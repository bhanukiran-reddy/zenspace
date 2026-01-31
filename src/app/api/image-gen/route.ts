import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not set" },
                { status: 500 }
            );
        }

        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            );
        }

        const client = new GoogleGenAI({ apiKey });

        // Use nano-banana-pro-preview for image generation
        const response = await client.models.generateContent({
            model: "nano-banana-pro-preview",
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `Generate a photorealistic product image: ${prompt}. 
                            The image should have a clean, transparent or neutral background suitable for overlaying on room photos.
                            Focus on high detail, realistic textures, and professional product photography style.`
                        }
                    ]
                }
            ],
            config: {
                responseModalities: ["image", "text"],
            }
        });

        // Extract the image from response
        const parts = response.candidates?.[0]?.content?.parts;

        if (!parts) {
            throw new Error("No response parts received from model");
        }

        // Find the image part in the response
        for (const part of parts) {
            if (part.inlineData) {
                return NextResponse.json({
                    image: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
                    mimeType: part.inlineData.mimeType
                });
            }
        }

        // If no image found, return text response if available
        const textPart = parts.find(p => p.text);
        if (textPart) {
            return NextResponse.json({
                error: "Model returned text instead of image",
                message: textPart.text
            }, { status: 422 });
        }

        throw new Error("No image or text in response");

    } catch (error: any) {
        console.error("Image Generation Error:", {
            message: error.message,
            status: error.status,
        });
        return NextResponse.json(
            { error: error.message || "Image generation failed" },
            { status: error.status || 500 }
        );
    }
}
