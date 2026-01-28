import { NextRequest, NextResponse } from "next/server";
import { ZenSpaceAgent } from "@/lib/agent";

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "GEMINI_API_KEY is not set" },
                { status: 500 }
            );
        }

        const { userPrompt, image } = await req.json();

        if (!image) {
            return NextResponse.json(
                { error: "Image is required" },
                { status: 400 }
            );
        }

        // Default prompt if not provided, but the Agent class handles the System Prompt.
        // The userPrompt here is the "command" like "Turn this into a streamer setup".
        const prompt = userPrompt || "Analyze this room and generate a renovation plan.";

        const agent = new ZenSpaceAgent(apiKey);

        // Prepare image part for Gemini
        // Assuming image is base64 string
        // If it has data URI scheme, strip it
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

        // We assume the image is JPEG or PNG. Gemini supports both.
        // We can try to detect mime type from the data URI if present, default to image/jpeg
        let mimeType = "image/jpeg";
        const match = image.match(/^data:(image\/\w+);base64,/);
        if (match) {
            mimeType = match[1];
        }

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: mimeType,
            },
        };

        const result = await agent.analyzeSpace([imagePart], prompt);

        // Parse the JSON string returned by the model to ensure it's valid JSON before sending
        // The model is instructed to return JSON, but it returns a string.
        // We try to parse it.
        let parsedResult;
        try {
            parsedResult = JSON.parse(result);
        } catch (e) {
            console.error("Failed to parse JSON from model output:", result);
            // Fallback: return the raw text if parse fails, or an error
            // Ideally we return the raw text wrapped in a structure if it's not JSON
            return NextResponse.json({
                error: "Model did not return valid JSON",
                rawOutput: result
            }, { status: 502 });
        }

        return NextResponse.json(parsedResult);

    } catch (error: any) {
        console.error("API Route Error Detailed:", {
            message: error.message,
            stack: error.stack,
            cause: error.cause,
            response: error.response ? {
                status: error.response.status,
                data: error.response.data,
            } : "No response"
        });
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
