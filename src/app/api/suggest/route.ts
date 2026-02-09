import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const SUGGEST_PROMPT = `You are ZenSpace's Product Recommendation Engine, an AI interior design consultant powered by Gemini 3.

Analyze the provided room image and generate SPECIFIC, ACTIONABLE product suggestions that would improve this space.

For each suggestion, provide:
- A real, purchasable product type (not vague categories)
- WHY this specific product would transform the space (reference what you actually SEE)
- WHERE in the room it should go
- A detailed image generation prompt for preview
- A Google Shopping search query to find real products

Return ONLY valid JSON in this exact format:
{
  "room_summary": "1-2 sentence summary of the room's current state and biggest opportunity",
  "mood": "Current mood/vibe detected (e.g., 'cluttered workspace', 'dim bedroom', 'sterile living room')",
  "color_palette": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "suggestions": [
    {
      "id": 1,
      "name": "Product Name (e.g., 'Warm LED Desk Lamp')",
      "category": "lighting|furniture|decor|storage|textiles|plants|tech",
      "description": "What this product is — be specific about style, material, color",
      "reason": "Why this is PERFECT for THIS specific room — reference what you see",
      "placement": "Exact placement instruction (e.g., 'On the left side of the desk, angled toward the keyboard')",
      "estimated_price": "$XX - $XX",
      "impact": "high|medium|low",
      "image_prompt": "Photorealistic product photo: [detailed description]. Clean white/transparent background, soft studio lighting, high detail, product photography style. 4K quality.",
      "shopping_query": "exact search terms for Google Shopping",
      "style_tags": ["modern", "minimalist", "warm"]
    }
  ]
}

RULES:
- Suggest 4-6 products, ordered by impact (highest first)
- Be SPECIFIC — not "a lamp" but "a warm-toned adjustable LED desk lamp with wooden base"
- Reference ACTUAL things you see in the image
- Price estimates should be realistic (USD)
- Image prompts must be detailed enough to generate realistic product photos
- Each suggestion must solve a VISIBLE problem or enhance a VISIBLE opportunity`;

const MODELS = ["gemini-3-flash-preview", "gemini-3-pro-preview", "gemini-2.5-flash"];

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 });
        }

        const { image, context } = await req.json();
        if (!image) {
            return NextResponse.json({ error: "Image is required" }, { status: 400 });
        }

        const client = new GoogleGenAI({ apiKey });
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

        const contextAddition = context
            ? `\n\nUser's specific request: "${context}". Prioritize suggestions that align with this.`
            : "";

        let lastError: any = null;

        for (const model of MODELS) {
            try {
                console.log(`[Suggest] Trying model: ${model}`);
                const response = await client.models.generateContent({
                    model,
                    contents: [{
                        role: "user",
                        parts: [
                            { text: SUGGEST_PROMPT + contextAddition },
                            { inlineData: { mimeType: "image/jpeg", data: base64Data } }
                        ]
                    }],
                    config: {
                        responseMimeType: "application/json",
                    }
                });

                const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!text) throw new Error("No response from model");

                const parsed = JSON.parse(text);

                // Validate structure
                if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
                    throw new Error("Invalid response structure — missing suggestions array");
                }

                return NextResponse.json({ ...parsed, usedModel: model });

            } catch (error: any) {
                console.warn(`[Suggest] Failed with ${model}:`, error.message);
                lastError = error;
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        return NextResponse.json(
            { error: `Product suggestion failed: ${lastError?.message}` },
            { status: 503 }
        );

    } catch (error: any) {
        console.error("[Suggest] Fatal Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
