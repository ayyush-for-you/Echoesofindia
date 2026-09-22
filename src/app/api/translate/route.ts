import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is not configured. Please add your GEMINI_API_KEY to .env.local to enable AI translation.",
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { imageBase64, title, originalLanguage, period, region } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "No manuscript image data provided." },
        { status: 400 }
      );
    }

    // Extract mime type and raw base64 data
    let mimeType = "image/png";
    let base64Data = imageBase64;

    const dataUrlMatch = imageBase64.match(
      /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/
    );
    if (dataUrlMatch) {
      mimeType = dataUrlMatch[1];
      base64Data = dataUrlMatch[2];
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const systemPrompt = `You are a world-class historian and linguist specializing in ancient Indian manuscripts. You have been given an image of an ancient manuscript. Your job is to: 1) Identify the script and language if possible. 2) Provide a complete, readable English translation of the text in the manuscript. Write the translation in clear, modern English that anyone can understand — like a Google Translate output but with historical context preserved. 3) Provide a 2-3 sentence concise summary of what the manuscript is about. Format your response as JSON with exactly these fields: { "detectedLanguage": string, "translation": string, "summary": string }`;

    const userPrompt = `Curator Metadata:
- Title: ${title || "Untitled"}
- Stated Language: ${originalLanguage || "Unknown"}
- Era / Period: ${period || "Unknown"}
- Geographic Region / Provenance: ${region || "Unknown"}

Please examine this manuscript image carefully, identify the script and language, translate the inscriptions/text into clear modern English, and provide a 2-3 sentence summary. Return strictly the requested JSON format.`;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    };

    const result = await model.generateContent([
      systemPrompt,
      userPrompt,
      imagePart,
    ]);

    const response = await result.response;
    const responseText = response.text();

    // Parse JSON
    let parsedResult;
    try {
      const cleanedText = responseText.replace(/```json\s*|\s*```/g, "").trim();
      parsedResult = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response JSON:", responseText, parseError);
      return NextResponse.json(
        {
          error: "Failed to parse AI response into expected JSON format.",
          rawResponse: responseText,
        },
        { status: 502 }
      );
    }

    const { detectedLanguage, translation, summary } = parsedResult;

    return NextResponse.json({
      detectedLanguage: detectedLanguage || originalLanguage || "Unknown",
      translation: translation || "No readable translation produced.",
      summary: summary || "No summary available.",
    });
  } catch (error: any) {
    console.error("Manuscript translation API error:", error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          "An unexpected error occurred while translating the manuscript.",
      },
      { status: 500 }
    );
  }
}
