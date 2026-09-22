import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is not configured. Please add your GEMINI_API_KEY to .env.local to enable text embedding.",
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Field 'text' is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

    const result = await model.embedContent(text.trim());
    const embedding = result.embedding?.values;

    if (!embedding || !Array.isArray(embedding)) {
      return NextResponse.json(
        { error: "Failed to generate embedding from Gemini API." },
        { status: 502 }
      );
    }

    return NextResponse.json({ embedding });
  } catch (error: any) {
    console.error("Embedding API error:", error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          "An unexpected error occurred while generating embedding.",
      },
      { status: 500 }
    );
  }
}
