
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// List of models to try in order of preference
const MODELS_TO_TRY = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-flash-latest",
    "gemini-pro-latest",
];

export async function POST(req: NextRequest) {
    try {
        const { image, prompt } = await req.json();

        if (!image || !prompt) {
            return NextResponse.json(
                { error: "Image and prompt are required" },
                { status: 400 }
            );
        }

        // Remove the data URL prefix if present
        const base64Image = image.replace(/^data:image\/\w+;base64,/, "");

        let lastError = null;

        // Iterate through models until one succeeds
        for (const model of MODELS_TO_TRY) {
            try {
                console.log(`Trying model: ${model}`);
                const response = await client.models.generateContent({
                    model: model,
                    contents: [
                        {
                            role: "user",
                            parts: [
                                { text: prompt },
                                {
                                    inlineData: {
                                        mimeType: "image/jpeg",
                                        data: base64Image,
                                    },
                                },
                            ],
                        },
                    ],
                });

                const text = response.response.text();
                return NextResponse.json({
                    response: text,
                    usedModel: model
                });

            } catch (error: any) {
                console.warn(`Failed with model ${model}:`, error.message);
                // If it's a 429 (Resource Exhausted) or 503 (Unavailable), continue to next model.
                // If it's a different error (e.g., Invalid Argument), we might want to stop, but for now let's keep trying.
                lastError = error;
            }
        }

        // If we get here, all models failed
        console.error("All models failed. Last error:", lastError);
        return NextResponse.json(
            { error: `All models failed. Last error: ${lastError?.message || "Unknown error"}` },
            { status: 503 } // Service Unavailable
        );

    } catch (error: any) {
        console.error("Visual Assistant Fatal Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process request" },
            { status: 500 }
        );
    }
}
