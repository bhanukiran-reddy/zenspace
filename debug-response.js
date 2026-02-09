
const { GoogleGenAI } = require("@google/genai");
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envConfig = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) envConfig[key.trim()] = value.trim();
});

async function testModel(modelName) {
    console.log(`\nTesting ${modelName}...`);
    const client = new GoogleGenAI({ apiKey: envConfig.GEMINI_API_KEY });

    try {
        const response = await client.models.generateContent({
            model: modelName,
            contents: [{ role: "user", parts: [{ text: "Hello, just say 'ok'." }] }]
        });

        console.log("Keys in response object:", Object.keys(response));
        if (response.response) {
            console.log("Keys in response.response:", Object.keys(response.response));
            if (typeof response.response.text === 'function') {
                console.log("response.response.text() exists and returns:", response.response.text());
            } else {
                console.log("response.response.text is NOT a function");
            }
        } else {
            console.log("response.response is UNDEFINED");
        }

        // Log deep structure if needed
        // console.log("Full response:", JSON.stringify(response, null, 2));

    } catch (e) {
        console.error(`Error testing ${modelName}:`, e.message);
    }
}

async function main() {
    await testModel("gemini-2.0-flash");
    await testModel("gemini-2.5-flash");
    await testModel("gemini-1.5-flash");
}

main();
