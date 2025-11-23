
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedOutlineResponse, GeneratedDetailsResponse, AIConfig } from "../types";

// Initialize Default Gemini Client (System Environment)
const systemApiKey = process.env.API_KEY || ''; 
const systemAi = new GoogleGenAI({ apiKey: systemApiKey });

/**
 * Generic function to call AI.
 * Switches between System Gemini (using SDK) and Custom OpenAI-compatible (using fetch).
 */
async function callAI(
  prompt: string | any[], 
  config: AIConfig, 
  systemInstruction?: string,
  responseMimeType: string = "text/plain",
  responseSchema?: any
): Promise<string> {
  
  // --- Case 1: Default Gemini (System) ---
  if (config.provider === 'gemini') {
    const options: any = {
      model: config.modelName,
      // Handle both string prompt and structured parts (for images)
      contents: typeof prompt === 'string' ? prompt : { parts: prompt },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: responseMimeType,
      }
    };

    if (responseSchema) {
      options.config.responseSchema = responseSchema;
    }

    const response = await systemAi.models.generateContent(options);
    return response.text || "";
  }

  // --- Case 2: Custom OpenAI Compatible (User Configured) ---
  if (config.provider === 'openai') {
    if (!config.apiKey || !config.baseUrl) {
      throw new Error("Missing API Key or Base URL for custom provider");
    }

    // Ensure URL ends with /v1/chat/completions or similar if user just gave base
    let url = config.baseUrl;
    if (!url.includes('/chat/completions')) {
       // Heuristic: If it doesn't look like a full endpoint, append the standard path
       url = `${url.replace(/\/$/, '')}/chat/completions`;
    }

    const messages = [];
    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }
    
    let userContent: any = prompt;

    // Handle Multimodal Input for OpenAI (Text + Image)
    // Gemini SDK passes an array of parts. OpenAI expects content array with types.
    if (Array.isArray(prompt)) {
      userContent = prompt.map(part => {
        if (part.text) return { type: "text", text: part.text };
        if (part.inlineData) {
          return {
            type: "image_url",
            image_url: {
              url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
            }
          };
        }
        return null;
      }).filter(Boolean);
    } else {
      // Regular string prompt
      let finalPrompt = prompt;
      if (responseMimeType === "application/json") {
        finalPrompt += "\n\nIMPORTANT: Respond with valid JSON only. Do not use Markdown code blocks.";
      }
      userContent = finalPrompt;
    }

    messages.push({ role: "user", content: userContent });

    const body: any = {
      model: config.modelName,
      messages: messages,
      temperature: 0.7,
    };

    if (responseMimeType === "application/json") {
        // Attempt to set json mode, though some providers might ignore it
        body.response_format = { type: "json_object" };
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API Error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || "";
    } catch (error: any) {
      console.error("External API Call Failed", error);
      throw new Error(`External AI Error: ${error.message}`);
    }
  }

  throw new Error("Unknown Provider");
}

/**
 * Validates the connection for the provided configuration.
 * Returns true if successful, throws error if failed.
 */
export const validateConnection = async (config: AIConfig): Promise<boolean> => {
  try {
    // A very cheap/fast prompt to test connectivity
    const testPrompt = "Hi"; 
    await callAI(testPrompt, config);
    return true;
  } catch (error) {
    console.error("Connection Validation Failed", error);
    throw error;
  }
};

// --- Exported Services ---

export const generateOutlines = async (topic: string, customStyle: string, config: AIConfig): Promise<GeneratedOutlineResponse> => {
  if (!topic) throw new Error("Topic is required");

  const prompt = `
    You are a professional document architect. 
    The user wants to write a document about: "${topic}".
    ${customStyle ? `User's specific style requirement: "${customStyle}".` : ''}
    
    Please generate 3 distinct outlines.
    If the user provided a specific style, ensure at least 2 outlines align closely with that style, but offer 1 variation.
    If no style was provided, offer diverse tones (e.g., Academic, Professional, Creative).

    For each outline, provide:
    1. style: A short name for the tone/style.
    2. description: A brief explanation of the approach.
    3. chapters: A list of chapter titles (5-8 chapters).
  `;

  // Schema for Gemini
  const geminiSchema = {
    type: Type.OBJECT,
    properties: {
      outlines: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            style: { type: Type.STRING },
            description: { type: Type.STRING },
            chapters: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
          },
          required: ["style", "description", "chapters"],
        },
      },
    },
  };

  const text = await callAI(prompt, config, undefined, "application/json", config.provider === 'gemini' ? geminiSchema : undefined);

  try {
    // Sanitize markdown code blocks if present (common in generic LLM responses)
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr) as GeneratedOutlineResponse;
  } catch (e) {
    console.error("Failed to parse JSON", text);
    throw new Error("AI response was not valid JSON. Please try again.");
  }
};

export const generateChapterDetails = async (topic: string, chapterTitle: string, context: string[], config: AIConfig): Promise<string[]> => {
  const prompt = `
    Context: A document about "${topic}".
    Outline context: ${context.join(', ')}.
    
    Task: Create a detailed content plan (bullet points) for the chapter: "${chapterTitle}".
    Focus on what specific sub-topics, arguments, or data points should be covered.
    Return a JSON object with a single key "details" containing an array of 4-6 strings.
  `;

  const geminiSchema = {
    type: Type.OBJECT,
    properties: {
      details: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
  };

  const text = await callAI(prompt, config, undefined, "application/json", config.provider === 'gemini' ? geminiSchema : undefined);
  
  try {
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonStr) as GeneratedDetailsResponse;
    return data.details;
  } catch (e) {
     // Fallback parsing if JSON fails, try to split by newlines
     return text.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('•')).map(l => l.replace(/^[-•]\s*/, ''));
  }
};

export const generateChapterContent = async (
  topic: string, 
  chapterTitle: string, 
  points: string[], 
  tone: string,
  config: AIConfig,
  chartImageBase64?: string
): Promise<string> => {
  let promptText = `
    You are writing a section of a document.
    Document Topic: "${topic}"
    Tone/Style: ${tone}
    
    Chapter Title: "${chapterTitle}"
    Key Points to Cover:
    ${points.map(p => `- ${p}`).join('\n')}
    
    Write the full content for this chapter in Markdown format. 
    Do not include the chapter title in the output.
    Focus on high-quality, coherent paragraphs.
  `;

  if (chartImageBase64) {
    promptText += `
    \n[IMPORTANT] A chart/image has been provided for this section. 
    Analyze the visual data in the image provided and incorporate specific insights, trends, or numbers from the chart into your writing.
    Ensure the analysis flows naturally with the key points provided.
    `;
  }

  // If image exists, construct a multipart request
  if (chartImageBase64) {
    // Extract mime type and base64 data (assuming format: data:image/png;base64,...)
    const matches = chartImageBase64.match(/^data:(.+);base64,(.+)$/);
    if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const data = matches[2];

        const parts = [
            { inlineData: { mimeType, data } },
            { text: promptText }
        ];
        
        // Call AI with array of parts
        return await callAI(parts, config);
    }
  }

  // Default text-only call
  return await callAI(promptText, config);
};

export const refineContent = async (originalContent: string, instruction: string, config: AIConfig): Promise<string> => {
  const prompt = `
    Original Text:
    ${originalContent}
    
    User Instruction: "${instruction}"
    
    Rewrite the text above following the user's instruction. Keep the same general meaning but adjust based on the request. Return only the rewritten text in Markdown.
  `;

  return await callAI(prompt, config);
};
