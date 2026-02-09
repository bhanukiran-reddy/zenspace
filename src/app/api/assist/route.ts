
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// List of models to try in order of preference
const MODELS_TO_TRY = [
    "gemini-2.5-flash", // Newest, might have different quota?
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash", // Standard fallback
    "gemini-flash-latest",
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

                // Safe access to text
                let text = "";
                // Try helper method first (if available)
                if (response.response && typeof response.response.text === 'function') {
                    try {
                        text = response.response.text();
                    } catch (e) {
                        // Fall out to manual parsing
                    }
                }

                // Manual parsing fallback
                if (!text) {
                    // Check if response has candidates directly (SDK v1beta behavior?)
                    if ((response as any).candidates && (response as any).candidates[0]?.content?.parts?.[0]?.text) {
                        text = (response as any).candidates[0].content.parts[0].text;
                    }
                    // Check if response.response has candidates
                    else if (response.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
                        text = response.response.candidates[0].content.parts[0].text;
                    }
                }

                if (!text) {
                    console.error("Unexpected response structure for model " + model, JSON.stringify(response, null, 2));
                    throw new Error("Unexpected response structure");
                }

                return NextResponse.json({
                    response: text,
                    usedModel: model
                });

            } catch (error: any) {
                console.warn(`Failed with model ${model}:`, error.message);
                lastError = error;

                // Add a small delay before trying the next model to avoid hammering the API
                await sleep(1000);
            }
        }


        // If we get here, all models failed
        console.error("All models failed. Last error:", lastError);
        return NextResponse.json(
            { error: `All models failed. Last error: ${lastError?.message || "Unknown error"}` },
            { status: 503 }
        );

    } catch (error: any) {
        console.error("Visual Assistant Fatal Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process request" },
            { status: 500 }
        );
    }
}
