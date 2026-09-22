import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { VectorDocument, RAGSearchResult, RAGSource } from "@/types/rag";

/**
 * Server-side cosine similarity calculation.
 */
function cosineSimilarity(a: number[], b: number[]): number {
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
 * Extract an excerpt snippet around query terms.
 */
function extractExcerpt(text: string, query: string, maxLen: number = 220): string {
  if (!text) return "";
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();

  let idx = lowerText.indexOf(lowerQuery);
  if (idx === -1) {
    const words = lowerQuery.split(/\s+/).filter((w) => w.length > 3);
    for (const w of words) {
      const match = lowerText.indexOf(w);
      if (match !== -1) {
        idx = match;
        break;
      }
    }
  }

  if (idx === -1) {
    return text.length > maxLen ? `${text.slice(0, maxLen).trim()}...` : text;
  }

  const start = Math.max(0, idx - 60);
  const end = Math.min(text.length, idx + query.length + 140);
  const prefix = start > 0 ? "... " : "";
  const suffix = end < text.length ? " ..." : "";

  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is not configured. Please add your GEMINI_API_KEY to .env.local to enable RAG search.",
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const query: string = body.query;
    const vectors: VectorDocument[] = body.vectors || [];

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json(
        { error: "Query parameter is required and cannot be empty." },
        { status: 400 }
      );
    }

    // Check if vectors exist to search over
    if (!vectors || vectors.length === 0) {
      const emptyResult: RAGSearchResult = {
        answer:
          "The Curator's Vault does not currently contain any indexed manuscript embeddings. Please upload and archive manuscripts first to enable AI retrieval and historical analysis.",
        sources: [],
      };
      return NextResponse.json(emptyResult);
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // ── a. EMBED THE QUERY ──
    const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const embedResult = await embedModel.embedContent(query.trim());
    const queryEmbedding = embedResult.embedding?.values;

    if (!queryEmbedding || !Array.isArray(queryEmbedding)) {
      return NextResponse.json(
        { error: "Failed to generate query vector embedding." },
        { status: 502 }
      );
    }

    // ── b. RETRIEVE TOP-5 MOST SIMILAR DOCUMENTS ──
    const scoredDocs = vectors.map((doc) => ({
      document: doc,
      score: cosineSimilarity(queryEmbedding, doc.embedding),
    }));

    // Sort descending by similarity score
    scoredDocs.sort((a, b) => b.score - a.score);
    const topScored = scoredDocs.slice(0, 5);

    // ── c. AUGMENT & GENERATE ──
    const contextPrompt = topScored
      .map((item, index) => {
        const doc = item.document;
        return `[MANUSCRIPT EXCERPT ${index + 1}]
Title: ${doc.metadata.title}
Original Language: ${doc.metadata.originalLanguage}
Period / Era: ${doc.metadata.period}
Region / Origin: ${doc.metadata.region}
Summary: ${doc.metadata.translationSummary || "N/A"}
Content:
${doc.content}`;
      })
      .join("\n\n---\n\n");

    const systemPrompt = `You are the Echoes of India Archive Scholar — an AI historian specializing in ancient Indian manuscripts. You have been given relevant manuscript excerpts retrieved from the archive. Answer the user's question using ONLY the information from these manuscripts. Be clear, readable, and cite which manuscript(s) your answer comes from by title. If the manuscripts don't contain relevant information, say so honestly. Format your answer in clear paragraphs.`;

    const userPrompt = `RETRIEVED ARCHIVAL MANUSCRIPTS:
${contextPrompt}

USER QUESTION:
${query.trim()}

Please provide your scholarly answer based exclusively on the manuscripts above:`;

    const generationModel = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const generationResult = await generationModel.generateContent([
      systemPrompt,
      userPrompt,
    ]);

    const response = await generationResult.response;
    const answer = response.text();

    // ── d. FORMAT AND RETURN RESPONSE ──
    const sources: RAGSource[] = topScored.map((item) => {
      const doc = item.document;
      const snippet = extractExcerpt(doc.content, query);
      return {
        id: doc.id,
        title: doc.metadata.title,
        relevanceScore: parseFloat(item.score.toFixed(3)),
        snippet,
      };
    });

    const result: RAGSearchResult = {
      answer: answer.trim(),
      sources,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("RAG Search API error:", error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          "An unexpected error occurred while executing RAG search.",
      },
      { status: 500 }
    );
  }
}
