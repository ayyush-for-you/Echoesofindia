export interface VectorDocument {
  id: string; // manuscript ID
  content: string; // the text that was embedded (translation + metadata combined)
  embedding: number[]; // the embedding vector (768 dimensions for Gemini text-embedding-004)
  metadata: {
    title: string;
    originalLanguage: string;
    period: string;
    region: string;
    tags: string[];
    translationSummary: string;
    uploadedAt: string;
  };
}

export interface ScoredDocument {
  document: VectorDocument;
  score: number; // cosine similarity 0-1
}

export interface RAGSource {
  id: string;
  title: string;
  relevanceScore: number;
  snippet: string;
}

export interface RAGSearchResult {
  answer: string;
  sources: RAGSource[];
}
