import { Manuscript } from "@/types/manuscript";
import { vectorStore } from "@/lib/vectorStore";
import { prepareDocumentText } from "@/lib/ragHelpers";
import { VectorDocument } from "@/types/rag";

/**
 * Generates an embedding for a game-discovered manuscript and adds it to the RAG vector store.
 * Non-blocking, fails gracefully without disrupting gameplay.
 */
export async function indexGameArtifactInRAG(manuscript: Manuscript): Promise<boolean> {
  try {
    const textToEmbed = prepareDocumentText(manuscript);
    const res = await fetch("/api/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: textToEmbed }),
    });

    if (!res.ok) {
      return false;
    }

    const data = await res.json();
    if (data.embedding && Array.isArray(data.embedding)) {
      const vectorDoc: VectorDocument = {
        id: manuscript.id,
        content: textToEmbed,
        embedding: data.embedding,
        metadata: {
          title: manuscript.title,
          originalLanguage: manuscript.originalLanguage,
          period: manuscript.period,
          region: manuscript.region,
          tags: manuscript.tags,
          translationSummary: manuscript.translationSummary,
          uploadedAt: manuscript.uploadedAt,
        },
      };

      vectorStore.addDocument(vectorDoc);
      return true;
    }
    return false;
  } catch (err) {
    console.warn("Failed to index game artifact in RAG:", err);
    return false;
  }
}
