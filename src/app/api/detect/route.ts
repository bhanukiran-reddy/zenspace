import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const DETECT_PROMPT = `You are a spatial object detection system for an AR application. Analyze this image and identify ALL distinct objects/furniture visible.

Return ONLY valid JSON in this exact format:
{
  "scene": "Brief 1-sentence description of the overall space",
  "lighting": "Brief lighting condition (e.g., 'warm artificial', 'natural daylight', 'dim')",
  "mood": "Current mood/ambiance in 2-3 words (e.g., 'cluttered workspace', 'cozy bedroom', 'sterile office')",
  "color_palette": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "objects": [
    {
      "name": "object name (e.g., 'wooden desk', 'office chair', 'floor lamp')",
      "bbox": [x1, y1, x2, y2],
      "description": "Brief description: color, material, condition, style",
      "category": "furniture|lighting|decor|electronics|storage|textiles|plants|tech|other"
    }
  ]
}

CRITICAL RULES for bounding boxes:
- All values MUST be normalized floats between 0.0 and 1.0
- [x1, y1] = top-left corner, [x2, y2] = bottom-right corner
- x1 < x2, y1 < y2 always
- Be as accurate as possible with spatial positioning
- Include ALL visible distinct objects (min 2, max 12)
- Do NOT include walls, floor, ceiling as objects — only distinct items
- color_palette should represent the 4 dominant colors in the room`;

const MODELS = ["gemini-3-flash-preview", "gemini-2.5-flash"];

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 });
        }

        const { image } = await req.json();
        if (!image) {
            return NextResponse.json({ error: "Image is required" }, { status: 400 });
        }

        const client = new GoogleGenAI({ apiKey });
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        let lastError: any = null;

        for (const model of MODELS) {
            try {
                console.log(`[Detect] Trying model: ${model}`);
                const response = await client.models.generateContent({
                    model,
                    contents: [{
                        role: "user",
                        parts: [
                            { text: DETECT_PROMPT },
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

                // Validate and clamp bounding boxes
                if (parsed.objects) {
                    parsed.objects = parsed.objects.map((obj: any) => ({
                        ...obj,
                        bbox: (obj.bbox || [0, 0, 1, 1]).map((v: number) =>
                            Math.max(0, Math.min(1, v))
                        )
                    }));
                }

                return NextResponse.json({ ...parsed, usedModel: model });

            } catch (error: any) {
                console.warn(`[Detect] Failed with ${model}:`, error.message);
                lastError = error;
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        return NextResponse.json(
            { error: `Detection failed: ${lastError?.message}` },
            { status: 503 }
        );

    } catch (error: any) {
        console.error("[Detect] Fatal Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
