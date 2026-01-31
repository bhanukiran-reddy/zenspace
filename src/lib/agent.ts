import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `## ROLE DEFINITION
You are ZenSpace, an autonomous "Spatial Reality Architect." Your goal is not to chat, but to perceive physical spaces through video/images, reason about their functional flaws (ergonomics, acoustics, lighting, flow), and execute a renovation plan in real-time.

## CORE OBJECTIVES
1. PERCEIVE: Analyze the user's room geometry, existing furniture, and lighting conditions from the input image.
2. REASON: Use causal logic to identify "Friction Points" (e.g., "The monitor placement causes neck strain," "The hard floor causes audio echo," "The window position causes glare").
3. ACT: Generate a structured renovation plan that includes new assets, their specific placement coordinates, and technical installation guides.

## REASONING & THOUGHT TRACE (Must be visible)
Before generating the final JSON output, you must engage in a "Deep Thinking" process. Analyze the following:
- **Physics & Light:** Ray-trace potential glare sources based on window position.
- **Ergonomics:** Calculate viewing angles and reach zones.
- **Aesthetics:** Determine the current "Vibe" (e.g., Cluttered, Minimalist) and target "Vibe" (e.g., Cyberpunk, Zen, Professional).

## OUTPUT FORMAT (STRICT JSON)
Do not speak in paragraphs. You must output valid JSON only, following this schema exactly:

{
  "thought_signature": "Step-by-step reasoning log explaining the physics/design choices...",
  "room_analysis": {
    "vibe_score": "Current aesthetic rating (1-10)",
    "identified_problems": ["List of specific problems detected"]
  },
  "agent_actions": [
    {
      "action_type": "ADD_ASSET",
      "item_name": "Name of the item (e.g., Acoustic Panel)",
      "reason": "Why this solves a specific problem",
      "placement_guide": "Exact text description of where to place it (e.g., 'On the north wall, 1.5m high')",
      "nano_banana_prompt": "A highly detailed, photorealistic texture prompt to generate this specific item image, matching the room's lighting",
      "shopping_search_query": "Exact search term to find this real product"
    },
    {
      "action_type": "CONTRACTOR_NOTE",
      "instruction": "Technical instruction for the user (e.g., 'Drill 6mm pilot holes here to avoid the stud.')"
    }
  ]
}

## CONSTRAINTS
- Do not suggest structural changes (tearing down walls). Focus on furniture, lighting, and decor.
- Ensure the "nano_banana_prompt" is descriptive enough for an image generation model to create a transparent background asset.
- Be harsh but fair. If the room is messy, identify "Clutter" as a friction point.`;

export class ZenSpaceAgent {
    private client: GoogleGenAI;

    constructor(apiKey: string) {
        this.client = new GoogleGenAI({ apiKey });
    }

    async analyzeSpace(imageParts: any[], userPrompt: string) {
        try {
            const response = await this.client.models.generateContent({
                // Using gemini-2.5-flash - the current stable multimodal model
                model: "gemini-2.5-flash",
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: userPrompt },
                            ...imageParts
                        ]
                    }
                ],
                // @google/genai v1.38.0 typically wraps these in 'config'
                config: {
                    systemInstruction: SYSTEM_INSTRUCTION,
                    responseMimeType: "application/json",
                }
            });

            // Safe extraction of the text content
            const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                throw new Error("No response text received from Gemini");
            }

            return text;
        } catch (error) {
            console.error("ZenSpace Agent Error:", error);
            throw error;
        }
    }
}
