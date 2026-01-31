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

const client = new GoogleGenAI({ apiKey: envConfig.GEMINI_API_KEY });

// Models from our ListModels that might support image generation
const modelsToTest = [
    "gemini-2.5-flash-image",
    "gemini-2.0-flash-exp-image-generation",
];

async function testModel(modelName) {
    console.log(`\nTesting: ${modelName}`);
    try {
        const response = await client.models.generateImages({
            model: modelName,
            prompt: "A modern minimalist desk lamp, chrome finish, product photography, white background",
            config: {
                numberOfImages: 1,
            }
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const img = response.generatedImages[0];
            console.log(`  ✓ SUCCESS!`);

            // Save to file
            const buffer = Buffer.from(img.image.imageBytes, 'base64');
            fs.writeFileSync('generated-lamp.png', buffer);
            console.log("  Saved: generated-lamp.png");
            return modelName;
        }
        console.log("  ❌ No images returned");
    } catch (e) {
        console.log(`  ❌ Error (${e.status || 'N/A'}): ${e.message?.substring(0, 80) || JSON.stringify(e).substring(0, 80)}`);
    }
    return null;
}

async function main() {
    console.log("=== Testing Image Generation with generateImages API ===");
    for (const model of modelsToTest) {
        const result = await testModel(model);
        if (result) {
            console.log(`\n✓ WORKING MODEL: ${result}`);
            return;
        }
    }
    console.log("\n❌ No models worked - quota may be exhausted for all.");
}

main();
