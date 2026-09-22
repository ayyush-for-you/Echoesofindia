import { VectorDocument, ScoredDocument } from "../types/rag";

const STORAGE_KEY = "echoes_rag_vectors";

export class VectorStore {
  documents: VectorDocument[] = [];

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Load stored vector documents from browser localStorage safely.
   */
  loadFromStorage(): void {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          this.documents = parsed;
        }
      }
    } catch (err) {
      console.error("VectorStore failed to load from localStorage:", err);
    }
  }

  /**
   * Persist current documents array to browser localStorage safely.
   */
  saveToStorage(): void {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.documents));
    } catch (err) {
      console.error("VectorStore failed to save to localStorage:", err);
    }
  }

  /**
   * Add or update a vector document and persist to storage.
   */
  addDocument(doc: VectorDocument): void {
    const existingIndex = this.documents.findIndex((d) => d.id === doc.id);
    if (existingIndex >= 0) {
      this.documents[existingIndex] = doc;
    } else {
      this.documents.push(doc);
    }
    this.saveToStorage();
  }

  /**
   * Remove a vector document by ID and update storage.
   */
  removeDocument(id: string): void {
    this.documents = this.documents.filter((d) => d.id !== id);
    this.saveToStorage();
  }

  /**
   * Check if a document is present in the vector store.
   */
  hasDocument(id: string): boolean {
    return this.documents.some((d) => d.id === id);
  }

  /**
   * Get total number of stored documents.
   */
  getDocumentCount(): number {
    return this.documents.length;
  }

  /**
   * Compute cosine similarity between two numeric vectors.
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) {
      return 0;
    }
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Search for top-K most similar documents against query embedding.
   */
  search(queryEmbedding: number[], topK: number = 5): ScoredDocument[] {
    if (!queryEmbedding || queryEmbedding.length === 0 || this.documents.length === 0) {
      return [];
    }

    const scored: ScoredDocument[] = this.documents.map((doc) => ({
      document: doc,
      score: this.cosineSimilarity(queryEmbedding, doc.embedding),
    }));

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, topK);
  }
}

// Export singleton instance
export const vectorStore = new VectorStore();
