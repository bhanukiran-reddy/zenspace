const { GoogleGenAI } = require("@google/genai");
const fs = require('fs');
const path = require('path');

// Load .env manually
const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envConfig = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envConfig[key.trim()] = value.trim();
    }
});

const apiKey = envConfig.GEMINI_API_KEY;

async function testImageGeneration() {
    console.log("=== IMAGE GENERATION TEST ===\n");

    if (!apiKey) {
        console.log("❌ No API key found");
        return;
    }

    const client = new GoogleGenAI({ apiKey });

    const testPrompt = "A sleek, modern acoustic foam panel in hexagonal shape, matte black with subtle purple LED accent lighting, product photography style, transparent background";

    console.log("Testing model: nano-banana-pro-preview");
    console.log("Prompt:", testPrompt.substring(0, 60) + "...\n");

    try {
        const response = await client.models.generateContent({
            model: "nano-banana-pro-preview",
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `Generate a photorealistic product image: ${testPrompt}. 
                            The image should have a clean, transparent or neutral background suitable for overlaying on room photos.`
                        }
                    ]
                }
            ],
            config: {
                responseModalities: ["image", "text"],
            }
        });

        const parts = response.candidates?.[0]?.content?.parts;

        if (parts) {
            for (const part of parts) {
                if (part.inlineData) {
                    console.log("✓ SUCCESS! Image generated");
                    console.log("  MIME Type:", part.inlineData.mimeType);
                    console.log("  Data length:", part.inlineData.data.length, "bytes");

                    // Save to file for inspection
                    const imageBuffer = Buffer.from(part.inlineData.data, 'base64');
                    const outputPath = path.join(__dirname, 'test-generated-image.png');
                    fs.writeFileSync(outputPath, imageBuffer);
                    console.log("  Saved to:", outputPath);
                    return;
                }
                if (part.text) {
                    console.log("⚠️ Got text response:", part.text.substring(0, 100));
                }
            }
        }

        console.log("❌ No image in response");
        console.log("Full response:", JSON.stringify(response, null, 2).substring(0, 500));

    } catch (error) {
        console.log("❌ Error:", error.message || JSON.stringify(error));
        console.log("Status:", error.status);
    }
}

testImageGeneration();
