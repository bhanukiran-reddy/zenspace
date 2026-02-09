import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const SUGGEST_PROMPT = `You are ZenSpace's Product Recommendation Engine powered by Gemini 3 with real-time Google Search.

Look at the room image carefully. Identify what's missing, what could be improved, and what specific products would make the biggest difference. Then search Google for REAL products that are currently available for purchase.

YOUR PROCESS:
1. Analyze the image — note the lighting, furniture, empty walls, clutter, missing items
2. Decide what categories of improvement are needed (better lighting? desk organization? decor? plants?)
3. Search Google for SPECIFIC, REAL products in each category that fit this room
4. Verify each product is currently for sale with a real price

ABSOLUTE RULES:
- Every product MUST be a real product you found via Google Search — NEVER invent or guess products
- The "shopping_query" field is CRITICAL — it must be the EXACT search query that finds THIS specific product on Google Shopping (include brand + model + key feature)
- DO NOT include any URLs (product_url or image_url) — we fetch those through our own system
- Prices must be from actual current listings
- Reference SPECIFIC things visible in the image when explaining why each product fits

Return ONLY valid JSON:
{
  "room_summary": "2-3 sentences describing the room and its biggest improvement opportunities",
  "mood": "detected mood/vibe of the space",
  "color_palette": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "suggestions": [
    {
      "id": 1,
      "name": "Full product name exactly as listed by the retailer",
      "brand": "Brand name",
      "category": "lighting|furniture|decor|storage|textiles|plants|tech",
      "description": "Real product specs from the listing: material, color, dimensions",
      "reason": "Why this product is perfect for THIS specific room — reference what you actually see in the image",
      "placement": "Exact placement instruction for where to put this in the room",
      "estimated_price": "Real price or price range from current listings",
      "impact": "high|medium|low",
      "shopping_query": "brand name + exact model name + key feature (this is what we search to find the product image, so be VERY specific and accurate)",
      "style_tags": ["tag1", "tag2"]
    }
  ]
}

QUALITY:
- 4-6 products ordered by impact
- Mix of price ranges
- Each shopping_query must uniquely identify ONE specific product (not a category)
- Be creative — suggest products the user might not have thought of`;

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

                // Clean up suggestions: ALWAYS use Google Shopping search URLs, never Gemini-hallucinated URLs
                if (parsed.suggestions) {
                    parsed.suggestions = parsed.suggestions.map((s: any, idx: number) => ({
                        ...s,
                        id: s.id || idx + 1,
                        // ALWAYS use Google Shopping search — never trust AI-generated URLs
                        product_url: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(s.shopping_query || s.name)}`,
                        // Remove any hallucinated image URLs — we fetch real ones via /api/product-image
                        product_image_url: undefined,
                    }));
                }

                // Enrich with grounding sources
                const sources = groundingChunks.map((chunk: any) => ({
                    url: chunk.web?.uri || "",
                    title: chunk.web?.title || "",
                })).filter((s: any) => s.url);

                return NextResponse.json({
                    ...parsed,
                    sources,
                    searchQueries,
                    usedModel: model,
                    grounded: sources.length > 0,
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
