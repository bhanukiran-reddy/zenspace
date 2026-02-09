import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = `You are ZenSpace — an AI spatial intelligence built on Gemini 3. You can see the user's environment in real-time through their camera.

You are as capable as Gemini itself. You can reason deeply, analyze visually, think critically, and hold natural conversations. You're not limited to interior design — if the user asks you anything, respond intelligently. But your specialty is spatial understanding.

When you see the user's room or space:
- Describe what you genuinely observe. Be honest and specific, not generic.
- If something is unclear (lighting, whether lights are on/off, what an object is), ask before assuming.
- Don't rush to give suggestions. Understand the situation first. If the room looks dim, ask: "Are the lights off right now, or is this the normal brightness?" before suggesting a lamp.
- When you do recommend something, reference what you actually see. Don't say "consider adding a plant" — say "that empty corner to the left of your desk would work well for a tall snake plant."
- Mention real brands and products when relevant (IKEA, Philips, etc.).

You have full conversation memory. Use it — don't repeat questions already answered. Build on context from earlier messages.

If a style preset is active (Zen, Cyberpunk, Professional, Fantasy, Minimalist, Cozy), let it influence your perspective naturally.

Keep spoken responses concise (2-4 sentences). Be warm, direct, and useful — like a knowledgeable friend, not a corporate AI.`;

const MODELS = ["gemini-3-flash-preview", "gemini-2.5-flash", "gemini-2.0-flash"];

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 });
        }

        const body = await req.json();
        const { image, prompt, history, style } = body;

        if (!image || !prompt) {
            return NextResponse.json(
                { error: "Image and prompt are required" },
                { status: 400 }
            );
        }

        const client = new GoogleGenAI({ apiKey });
        const base64Image = image.replace(/^data:image\/\w+;base64,/, "");

        // Pass generous history for strong context
        // Gemini API uses "model" instead of "assistant"
        const historyParts = (history || []).slice(-14).map((msg: any) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }]
        }));

        const styleContext = style ? `\n[Style: ${style}]` : "";
        const fullPrompt = prompt + styleContext;

        let lastError: any = null;

        for (const model of MODELS) {
            try {
                console.log(`[Assist] Trying model: ${model}`);
                const response = await client.models.generateContent({
                    model,
                    contents: [
                        ...historyParts,
                        {
                            role: "user",
                            parts: [
                                { text: fullPrompt },
                                {
                                    inlineData: {
                                        mimeType: "image/jpeg",
                                        data: base64Image,
                                    },
                                },
                            ],
                        },
                    ],
                    config: {
                        systemInstruction: SYSTEM_PROMPT,
                    }
                });

                const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!text) throw new Error("No response text");

                return NextResponse.json({
                    response: text,
                    usedModel: model
                });

            } catch (error: any) {
                console.warn(`[Assist] Failed with ${model}:`, error.message);
                lastError = error;
                await new Promise(resolve => setTimeout(resolve, 800));
            }
        }

        return NextResponse.json(
            { error: `All models failed. Last error: ${lastError?.message || "Unknown error"}` },
            { status: 503 }
        );

    } catch (error: any) {
        console.error("[Assist] Fatal Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process request" },
            { status: 500 }
        );
    }
}
