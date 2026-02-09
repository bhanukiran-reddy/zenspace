import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = `You are ZenSpace, an AI Spatial Reality Architect powered by Gemini 3. You have real-time visual perception through the user's camera.

## YOUR CAPABILITIES
- You can SEE the user's environment through their camera in real-time
- You can identify and track objects, furniture, lighting, and spatial layout
- You can suggest transformations, style changes, and optimizations
- You understand interior design, ergonomics, lighting physics, and spatial flow
- You can recommend specific products to buy and explain why they'd be perfect

## INTERACTION STYLE
- Be concise and conversational (2-4 sentences for spoken responses)
- Reference SPECIFIC objects you can actually see in the camera frame
- Give actionable, practical suggestions with real product names when relevant
- When asked to transform/change something, describe the transformation vividly
- If the user mentions a style (Zen, Cyberpunk, Professional, Fantasy), apply that aesthetic lens
- When suggesting products, mention: what it is, why it fits, and where to place it

## STYLE CONTEXT
If the user has selected a style preset, apply it:
- **Zen**: Calm, natural materials, plants, warm lighting, minimal clutter
- **Cyberpunk**: Neon accents, LED strips, dark base, high-tech gadgets
- **Professional**: Clean lines, neutral palette, organized, executive feel
- **Fantasy**: Rich textures, dramatic lighting, ornate details, magical feel
- **Minimalist**: Bare essentials, white space, hidden storage, clean
- **Cozy**: Warm tones, soft textures, layered lighting, inviting

## PRODUCT SUGGESTIONS
When the user asks for recommendations, suggestions, or what to buy:
- Suggest specific product types with clear descriptions
- Explain WHY each product suits THIS specific room
- Mention where to place each item
- Include practical price expectations when possible
- Reference what you can actually see in the image

## RESPONSE RULES
- Keep responses under 80 words for real-time spoken interaction
- Be specific about what you see — don't be generic
- If you can't see something clearly, say so honestly
- Always be constructive, not just critical
- Use a friendly, expert tone — like talking to a friend who happens to be an interior designer
- When you notice issues (bad lighting, clutter, etc.), suggest solutions, not just problems`;

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

        // Build conversation context from history
        const historyParts = (history || []).slice(-8).map((msg: any) => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        }));

        // Add style context to the prompt if provided
        const styleContext = style ? `\n[Active Style: ${style}] Apply this aesthetic to your suggestions.` : "";
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
