import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SEED_MANUSCRIPTS, SeedArtifact } from "@/data/seedManuscripts";
import { Manuscript } from "@/types/manuscript";
import { prepareDocumentText } from "@/lib/ragHelpers";

function generatePlaceholderSvg(title: string, classification: string): string {
  const escapedTitle = title
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const displayTitle =
    escapedTitle.length > 42 ? escapedTitle.substring(0, 40) + "..." : escapedTitle;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
    <rect width="800" height="500" fill="#140F08"/>
    <rect x="24" y="24" width="752" height="452" rx="16" fill="#1E170E" stroke="#D4AF37" stroke-width="2" stroke-opacity="0.35"/>
    <circle cx="400" cy="180" r="54" fill="#D4AF37" fill-opacity="0.12" stroke="#D4AF37" stroke-width="1.5"/>
    <text x="400" y="190" font-family="serif" font-size="30" fill="#D4AF37" text-anchor="middle">🏛️</text>
    <text x="400" y="275" font-family="monospace" font-size="13" font-weight="bold" fill="#D4AF37" letter-spacing="4" text-anchor="middle">${classification.toUpperCase()}</text>
    <text x="400" y="320" font-family="serif" font-size="22" font-weight="bold" fill="#FDF5E6" text-anchor="middle">${displayTitle}</text>
    <text x="400" y="360" font-family="monospace" font-size="11" fill="#D4AF37" fill-opacity="0.8" text-anchor="middle">VERIFIED NATIONAL INSTITUTIONAL ARCHIVE</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

async function fetchImageAsBase64(url: string, title: string, classification: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "EchoesOfIndia-ArchivalBot/1.0",
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch (e) {
    // If fetching fails or times out, gracefully use rich parchment SVG placeholder
    return generatePlaceholderSvg(title, classification);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isDryRun = searchParams.get("dryRun") === "true";

    const apiKey = process.env.GEMINI_API_KEY;
    const hasValidApiKey = apiKey && apiKey !== "your_gemini_api_key_here";

    const seededManuscripts: (Manuscript & { embedding?: number[] })[] = [];
    const errors: string[] = [];

    // Dry-run mode: return metadata preview without processing heavy AI calls
    if (isDryRun) {
      const preview = SEED_MANUSCRIPTS.map((art) => ({
        id: art.id,
        title: art.title,
        archiveId: art.archiveId,
        classification: art.classification,
        originalLanguage: art.originalLanguage,
        period: art.period,
        region: art.region,
        description: art.description,
        tags: art.tags,
        sourceInstitution: art.sourceInstitution,
        sourceUrl: art.sourceUrl,
        originalImageUrl: art.referenceImageUrl,
        translatedText: art.historicalContext,
        translationSummary: art.description.slice(0, 180) + "...",
        uploadedAt: new Date().toISOString(),
        fileType: "image/jpeg",
        fileName: `${art.archiveId.toLowerCase()}.jpg`,
      }));

      return NextResponse.json({
        success: true,
        dryRun: true,
        seeded: preview,
        errors: [],
      });
    }

    const genAI = hasValidApiKey ? new GoogleGenerativeAI(apiKey) : null;

    // Process artifacts sequentially to prevent rate limits
    for (let i = 0; i < SEED_MANUSCRIPTS.length; i++) {
      const art = SEED_MANUSCRIPTS[i];

      try {
        // 1. Fetch reference image or generate placeholder
        const imageBase64 = await fetchImageAsBase64(
          art.referenceImageUrl,
          art.title,
          art.classification
        );

        // 2. Obtain translated / scholarly plain English interpretation
        let translatedText = `${art.historicalContext}\n\n${art.description}`;
        let translationSummary = art.description;

        if (genAI) {
          try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const prompt = `You are an expert archival historian at the National Archives of India.
Artifact: ${art.title}
Archive ID: ${art.archiveId}
Classification: ${art.classification}
Historical Context: ${art.historicalContext}
Curator Description: ${art.description}

Please provide:
1) A readable scholarly plain English translation or analytical transcript of this historical document/artifact (150-250 words) suitable for an archive exhibition.
2) A concise 2-sentence translation summary.
Format your answer with:
SUMMARY: [2-sentence concise summary]
TRANSLATION:
[Scholarly translation / transcript / descriptive analysis]`;

            const result = await model.generateContent(prompt);
            const text = result.response.text();

            if (text.includes("SUMMARY:") && text.includes("TRANSLATION:")) {
              const parts = text.split("TRANSLATION:");
              const summaryPart = parts[0].replace("SUMMARY:", "").trim();
              const translationPart = parts[1].trim();

              if (summaryPart) translationSummary = summaryPart;
              if (translationPart) translatedText = translationPart;
            } else {
              translatedText = text.trim();
            }
          } catch (aiErr: any) {
            console.warn(`AI translation fallback for ${art.archiveId}:`, aiErr?.message);
          }
        }

        const manuscript: Manuscript & { embedding?: number[] } = {
          id: art.id,
          title: art.title,
          archiveId: art.archiveId,
          classification: art.classification,
          originalLanguage: art.originalLanguage,
          period: art.period,
          region: art.region,
          description: art.description,
          tags: art.tags,
          sourceInstitution: art.sourceInstitution,
          sourceUrl: art.sourceUrl,
          originalImageUrl: imageBase64,
          translatedText,
          translationSummary,
          uploadedAt: new Date().toISOString(),
          fileType: "image/jpeg",
          fileName: `${art.archiveId.toLowerCase()}.jpg`,
        };

        // 3. Generate RAG Vector Embedding
        if (genAI) {
          try {
            const embedText = prepareDocumentText(manuscript);
            const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
            const embedResult = await embedModel.embedContent(embedText);
            const embedding = embedResult.embedding?.values;

            if (embedding && Array.isArray(embedding)) {
              manuscript.embedding = embedding;
            }
          } catch (embedErr: any) {
            console.warn(`RAG embedding generation for ${art.archiveId}:`, embedErr?.message);
          }
        }

        seededManuscripts.push(manuscript);
      } catch (itemErr: any) {
        console.error(`Error seeding artifact ${art.archiveId}:`, itemErr);
        errors.push(`${art.title}: ${itemErr?.message || "Processing failed"}`);
      }
    }

    return NextResponse.json({
      success: seededManuscripts.length > 0,
      seeded: seededManuscripts,
      errors,
    });
  } catch (error: any) {
    console.error("Seed vault API error:", error);
    return NextResponse.json(
      {
        success: false,
        seeded: [],
        errors: [error?.message || "Internal server error during vault seeding"],
      },
      { status: 500 }
    );
  }
}
