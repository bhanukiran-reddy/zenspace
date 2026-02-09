import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

/* ── Gemini models that support responseModalities: ["image", "text"] ──
   Each model ID maps to a different internal quota bucket, so if one
   is exhausted we can still succeed with another.                       */
const GEMINI_IMAGE_MODELS = [
    "nano-banana-pro-preview",       // → gemini-3-pro-image bucket
    "gemini-3-pro-image-preview",    // → gemini-3-pro-image bucket (alias)
    "gemini-2.0-flash-exp-image-generation",  // → gemini-2.0-flash-exp bucket
];

/* ── Imagen 3 — completely separate quota, different API surface ── */
const IMAGEN_MODELS = ["imagen-3.0-generate-001", "imagen-3.0-fast-generate-001"];

/* ── Helper: parse retryDelay from a 429 error body ── */
function parseRetryDelay(errorMsg: string): number | null {
    // Matches "retryDelay":"34s" or "retry in 34.071522277s" etc.
    const match = errorMsg.match(/retry(?:Delay)?[" :]*?(\d+(?:\.\d+)?)s/i);
    return match ? Math.ceil(parseFloat(match[1])) : null;
}

/* ── Helper: wait ── */
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

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
        const styleEnhancement = style ? `Style: ${style}. ` : "";

        const fullPrompt = `Generate a photorealistic product image: ${styleEnhancement}${prompt}. 
The image should have a clean, transparent or neutral background suitable for overlaying on room photos.
Focus on high detail, realistic textures, and professional product photography style.
The lighting should be soft and natural, matching typical indoor room lighting.`;

        let lastError: any = null;

        /* ── 1. Try each Gemini image model ── */
        for (const model of GEMINI_IMAGE_MODELS) {
            try {
                console.log(`[ImageGen] Trying model: ${model}`);
                const response = await client.models.generateContent({
                    model,
                    contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
                    config: { responseModalities: ["image", "text"] },
                });

                const parts = response.candidates?.[0]?.content?.parts;
                if (!parts) throw new Error("No response parts received");

                for (const part of parts) {
                    if (part.inlineData) {
                        console.log(`[ImageGen] ✓ Success with ${model}`);
                        return NextResponse.json({
                            image: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
                            mimeType: part.inlineData.mimeType,
                            usedModel: model,
                        });
                    }
                }

                const textPart = parts.find((p: any) => p.text);
                if (textPart) {
                    console.warn(`[ImageGen] ${model} returned text instead of image:`, textPart.text);
                    throw new Error("Model returned text instead of image");
                }

                throw new Error("No image or text in response");
            } catch (error: any) {
                const msg = error.message || String(error);
                console.warn(`[ImageGen] Failed with ${model}:`, msg.slice(0, 200));
                lastError = error;

                // If 429, check if the API gave us a retry delay
                if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
                    const retrySec = parseRetryDelay(msg);
                    // Only auto-retry if delay is short (≤ 40s) to stay within request timeout
                    if (retrySec && retrySec <= 40) {
                        console.log(`[ImageGen] 429 on ${model} — waiting ${retrySec}s then retrying...`);
                        await sleep(retrySec * 1000);
                        try {
                            const retryRes = await client.models.generateContent({
                                model,
                                contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
                                config: { responseModalities: ["image", "text"] },
                            });
                            const retryParts = retryRes.candidates?.[0]?.content?.parts;
                            if (retryParts) {
                                for (const part of retryParts) {
                                    if (part.inlineData) {
                                        console.log(`[ImageGen] ✓ Success with ${model} (after retry)`);
                                        return NextResponse.json({
                                            image: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
                                            mimeType: part.inlineData.mimeType,
                                            usedModel: `${model} (retry)`,
                                        });
                                    }
                                }
                            }
                        } catch (retryErr: any) {
                            console.warn(`[ImageGen] Retry also failed for ${model}:`, (retryErr.message || "").slice(0, 120));
                        }
                    }
                }

                // Brief pause before trying next model
                await sleep(300);
            }
        }

        /* ── 2. Final fallback: Imagen 3 (separate quota, different API) ── */
        for (const imagenModel of IMAGEN_MODELS) {
            try {
                console.log(`[ImageGen] Trying Imagen fallback: ${imagenModel}`);
                const imagenRes = await (client.models as any).generateImages({
                    model: imagenModel,
                    prompt: fullPrompt,
                    config: { numberOfImages: 1 },
                });

                const generated = (imagenRes as any)?.generatedImages?.[0];
                if (generated?.image?.imageBytes) {
                    console.log(`[ImageGen] ✓ Success with ${imagenModel}`);
                    return NextResponse.json({
                        image: `data:image/png;base64,${generated.image.imageBytes}`,
                        mimeType: "image/png",
                        usedModel: imagenModel,
                    });
                }
                throw new Error("Imagen returned no image data");
            } catch (imagenErr: any) {
                console.warn(`[ImageGen] Imagen fallback failed (${imagenModel}):`, (imagenErr.message || "").slice(0, 200));
            }
        }

        /* ── All models exhausted ── */
        // Build a user-friendly error
        const rawMsg = lastError?.message || "Unknown error";
        let userMsg = "Image generation failed — all models are currently unavailable.";

        if (rawMsg.includes("429") || rawMsg.includes("RESOURCE_EXHAUSTED")) {
            const retrySec = parseRetryDelay(rawMsg);
            userMsg = retrySec
                ? `Image generation quota reached. Please wait ~${retrySec} seconds and try again.`
                : "Image generation quota reached. Please wait a minute and try again, or try a different style.";
        } else if (rawMsg.includes("503") || rawMsg.includes("UNAVAILABLE")) {
            userMsg = "Image models are overloaded right now. Please try again in a few seconds.";
        }

        return NextResponse.json({ error: userMsg }, { status: 503 });

    } catch (error: any) {
        console.error("[ImageGen] Fatal Error:", error);
        return NextResponse.json(
            { error: error.message || "Image generation failed" },
            { status: error.status || 500 }
        );
    }
}
