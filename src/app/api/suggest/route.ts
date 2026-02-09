import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const SUGGEST_PROMPT = `You are ZenSpace's Product Recommendation Engine, an AI interior design consultant powered by Gemini 3 with access to Google Search.

Analyze the provided room image and suggest REAL, PURCHASABLE products from actual stores/brands that would improve this space.

CRITICAL RULES:
- Search Google for REAL products from actual retailers (Amazon, IKEA, Wayfair, Target, West Elm, etc.)
- Suggest products that ACTUALLY EXIST — not imaginary ones
- Include REAL brand names, model names if possible
- Include REAL approximate prices based on what you find online
- Reference what you ACTUALLY SEE in the image when explaining WHY each product fits
- Include a direct shopping search query that will find the EXACT product on Google Shopping

Return ONLY valid JSON in this exact format:
{
  "room_summary": "1-2 sentence summary of the room's current state and biggest opportunity for improvement",
  "mood": "Current mood/vibe detected (e.g., 'cluttered workspace', 'dim bedroom', 'sterile living room')",
  "color_palette": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "suggestions": [
    {
      "id": 1,
      "name": "REAL Product Name (e.g., 'IKEA TERTIAL Work Lamp' or 'Philips Hue Go Portable Light')",
      "brand": "Brand name (e.g., 'IKEA', 'Philips', 'West Elm')",
      "category": "lighting|furniture|decor|storage|textiles|plants|tech",
      "description": "What this product is — real description with material, color, size",
      "reason": "Why this is PERFECT for THIS specific room — reference what you see in the image. Be specific: mention the dim corner, the bare wall, the cluttered desk etc.",
      "placement": "Exact placement instruction (e.g., 'On the left side of the desk, angled toward the keyboard')",
      "estimated_price": "$XX - $XX (based on real market prices)",
      "impact": "high|medium|low",
      "image_prompt": "Photorealistic product photo of [exact product description]. Clean white background, soft studio lighting, high detail, product photography style. 4K quality.",
      "shopping_query": "exact search terms for Google Shopping to find this REAL product (e.g., 'IKEA TERTIAL desk lamp black')",
      "product_url": "If you found a specific product URL from search, include it here. Otherwise leave empty string.",
      "style_tags": ["modern", "minimalist", "warm"]
    }
  ]
}

RULES:
- Suggest 4-6 REAL products, ordered by impact (highest first)
- Every product MUST be a real product that can be purchased — not hypothetical
- Include the brand name for every product
- Price estimates MUST be based on real market prices (USD)
- Reference ACTUAL things you see in the image for the "reason" field
- Image prompts must describe the REAL product accurately
- shopping_query should find the exact product on Google Shopping`;

const MODELS = ["gemini-3-flash-preview", "gemini-2.5-flash", "gemini-2.0-flash"];

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
                console.log(`[Suggest] Trying model: ${model} (with Google Search grounding)`);

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
                        tools: [{ googleSearch: {} }],
                    }
                });

                const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!text) throw new Error("No response from model");

                // Extract grounding metadata for real product sources
                const groundingMeta = (response.candidates?.[0] as any)?.groundingMetadata;
                const groundingChunks = groundingMeta?.groundingChunks || [];
                const searchQueries = groundingMeta?.webSearchQueries || [];

                // Parse JSON from response (strip markdown code fences if present)
                const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
                const parsed = JSON.parse(jsonStr);

                // Validate structure
                if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
                    throw new Error("Invalid response structure — missing suggestions array");
                }

                // Enrich suggestions with grounding sources
                const sources = groundingChunks.map((chunk: any) => ({
                    url: chunk.web?.uri || "",
                    title: chunk.web?.title || "",
                })).filter((s: any) => s.url);

                return NextResponse.json({
                    ...parsed,
                    sources,             // Real URLs from Google Search
                    searchQueries,       // What was searched
                    usedModel: model,
                    grounded: sources.length > 0,  // Flag: results backed by real search
                });

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
