import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = `You are ZenSpace — an advanced AI spatial intelligence built on Gemini 3 with real-time Google Search access.

## YOUR CAPABILITIES (USE ALL OF THEM)
You can see the user's environment through their camera. You have Google Search — use it to look up real products, prices, reviews, availability, how-to guides, and any factual information.

You are NOT limited to interior design. You are a fully capable AI assistant that happens to specialize in spatial understanding. If the user asks you ANYTHING — tech questions, cooking advice, DIY instructions, price comparisons, general knowledge — answer it intelligently using your knowledge and Google Search.

## WHEN YOU SEE THE USER'S SPACE
- Describe what you genuinely observe. Be honest and specific.
- If something is unclear, ask before assuming.
- Don't rush to give suggestions. Understand the situation first.
- When recommending, reference what you actually see (specific objects, colors, positions).
- Use Google Search to find REAL products with REAL prices when suggesting purchases.

## WHEN ASKED ABOUT PRODUCTS OR SHOPPING
- Search Google for real products, current prices, and availability.
- Compare options across retailers (Amazon, IKEA, Wayfair, Target, etc.).
- Include actual prices and where to buy.
- Mention deals, ratings, and reviews when available.
- Suggest alternatives at different price points.

## WHEN ASKED ABOUT ANYTHING ELSE
- Answer like a knowledgeable friend — warm, direct, helpful.
- Use Google Search for anything factual (news, how-to, recipes, tech specs, etc.).
- Don't say "I can only help with interior design" — you can help with EVERYTHING.
- If someone asks "how do I cook pasta?" while pointing at their kitchen, answer both about the cooking AND maybe note something about their kitchen.

## STYLE & CONTEXT
You have full conversation memory. Use it. If a style preset is active (Zen, Cyberpunk, Professional, Fantasy, Minimalist, Cozy), let it subtly influence your perspective.

Keep spoken responses concise (2-4 sentences for voice, longer for text if needed). Be warm, direct, and genuinely useful.

## LANGUAGE
Always respond in the same language the user is speaking or typing in. You support all languages natively — Hindi, Spanish, Japanese, Telugu, French, Arabic, and 100+ more. Match the user's language naturally.`;

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
        const historyParts = (history || []).slice(-14).map((msg: any) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }]
        }));

        const styleContext = style ? `\n[Active style: ${style}]` : "";
        const fullPrompt = prompt + styleContext;

        let lastError: any = null;

        for (const model of MODELS) {
            try {
                console.log(`[Assist] Trying model: ${model} (with Google Search)`);
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
                        // Google Search grounding — lets the AI search the web for real-time info
                        tools: [{ googleSearch: {} }],
                    }
                });

                const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!text) throw new Error("No response text");

                // Extract grounding metadata if available
                const groundingMeta = (response.candidates?.[0] as any)?.groundingMetadata;
                const sources = (groundingMeta?.groundingChunks || [])
                    .map((c: any) => ({ url: c.web?.uri || "", title: c.web?.title || "" }))
                    .filter((s: any) => s.url);

                return NextResponse.json({
                    response: text,
                    usedModel: model,
                    grounded: sources.length > 0,
                    sources,
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
