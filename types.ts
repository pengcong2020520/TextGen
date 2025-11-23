
export enum AppStep {
  TopicAndOutline = 1,
  ChapterDetails = 2,
  Drafting = 3,
  Finalize = 4,
}

export interface OutlineOption {
  id: string;
  style: string;
  description: string;
  chapters: string[];
}

export interface ChapterDetail {
  id: string;
  title: string;
  points: string[]; // The detailed bullet points for this chapter
  content?: string; // The generated full text content
  chartImage?: string; // Base64 data string for chart analysis
  isGenerating?: boolean;
}

export interface DocumentState {
  topic: string;
  selectedOutlineId: string | null;
  chapters: ChapterDetail[];
  finalContent: string;
}

export interface GeneratedOutlineResponse {
  outlines: {
    style: string;
    description: string;
    chapters: string[];
  }[];
}

export interface GeneratedDetailsResponse {
  details: string[];
}

export type AIProvider = 'gemini' | 'openai';

export interface AIConfig {
  provider: AIProvider;
  modelName: string;
  apiKey?: string;
  baseUrl?: string;
}