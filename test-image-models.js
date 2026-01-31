const { GoogleGenAI } = require("@google/genai");
const fs = require('fs');
const path = require('path');

// Load .env
const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envConfig = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) envConfig[key.trim()] = value.trim();
});

const apiKey = envConfig.GEMINI_API_KEY;
const client = new GoogleGenAI({ apiKey });

const modelsToTest = [
    "gemini-2.5-flash-preview-image-generation",
    "gemini-2.0-flash-exp-image-generation",
    "imagen-4.0-generate-001",
    "imagen-4.0-fast-generate-001",
];

async function testModel(modelName) {
    console.log(`\nTesting: ${modelName}`);
    try {
        const response = await client.models.generateContent({
            model: modelName,
            contents: [{ role: "user", parts: [{ text: "Generate an image of a modern desk lamp, product photo style" }] }],
            config: { responseModalities: ["image", "text"] }
        });

        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const p of parts) {
                if (p.inlineData) {
                    console.log(`  ✓ SUCCESS - Image generated (${p.inlineData.mimeType})`);
                    return modelName;
                }
                if (p.text) console.log(`  ⚠️ Text only: ${p.text.substring(0, 50)}...`);
            }
        }
        console.log("  ❌ No image output");
    } catch (e) {
        console.log(`  ❌ Error (${e.status || 'N/A'}): ${e.message?.substring(0, 60) || 'Unknown'}`);
    }
    return null;
}

async function main() {
    console.log("=== Finding working image generation model ===");
    for (const model of modelsToTest) {
        const result = await testModel(model);
        if (result) {
            console.log(`\n✓ RECOMMENDED MODEL: ${result}`);
            return;
        }
    }
    console.log("\n❌ No working image models found. Quota may be exhausted.");
}

main();
