import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const MODELS = ["nano-banana-pro-preview", "gemini-3-pro-image-preview", "gemini-2.0-flash-exp-image-generation"];

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not set" },
                { status: 500 }
            );
        }

        const { prompt, style } = await req.json();

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            );
        }

        const client = new GoogleGenAI({ apiKey });

        // Enhance prompt with style context if provided
        const styleEnhancement = style
            ? `Style: ${style}. `
            : "";

        const fullPrompt = `Generate a photorealistic product image: ${styleEnhancement}${prompt}. 
The image should have a clean, transparent or neutral background suitable for overlaying on room photos.
Focus on high detail, realistic textures, and professional product photography style.
The lighting should be soft and natural, matching typical indoor room lighting.`;

        let lastError: any = null;

        for (const model of MODELS) {
            try {
                console.log(`[ImageGen] Trying model: ${model}`);
                const response = await client.models.generateContent({
                    model,
                    contents: [
                        {
                            role: "user",
                            parts: [{ text: fullPrompt }]
                        }
                    ],
                    config: {
                        responseModalities: ["image", "text"],
                    }
                });

                const parts = response.candidates?.[0]?.content?.parts;
                if (!parts) throw new Error("No response parts received");

                // Find the image part
                for (const part of parts) {
                    if (part.inlineData) {
                        return NextResponse.json({
                            image: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
                            mimeType: part.inlineData.mimeType,
                            usedModel: model
                        });
                    }
                }

                // If no image, check for text explaining why
                const textPart = parts.find((p: any) => p.text);
                if (textPart) {
                    console.warn(`[ImageGen] ${model} returned text instead of image:`, textPart.text);
                    throw new Error("Model returned text instead of image");
                }

                throw new Error("No image or text in response");

            } catch (error: any) {
                console.warn(`[ImageGen] Failed with ${model}:`, error.message);
                lastError = error;
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        return NextResponse.json(
            { error: `Image generation failed: ${lastError?.message}` },
            { status: 503 }
        );

    } catch (error: any) {
        console.error("[ImageGen] Fatal Error:", error);
        return NextResponse.json(
            { error: error.message || "Image generation failed" },
            { status: error.status || 500 }
        );
    }
}
