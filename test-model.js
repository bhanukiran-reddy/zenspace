
const { GoogleGenAI } = require("@google/genai");
const fs = require('fs');
const path = require('path');
const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envConfig = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envConfig[key.trim()] = value.trim();
    }
});
process.env.GEMINI_API_KEY = envConfig.GEMINI_API_KEY;

async function testModel(modelName) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API KEY found");
        return;
    }
    console.log(`Testing model: ${modelName}`);
    const client = new GoogleGenAI({ apiKey });
    try {
        const response = await client.models.generateContent({
            model: modelName,
            contents: [{ role: "user", parts: [{ text: "Hello" }] }]
        });
        console.log(`Success with ${modelName}`);
    } catch (error) {
        console.error(`Failed with ${modelName}:`, error.message);
    }
}

(async () => {
    await testModel("gemini-3-flash-preview");
    await testModel("gemini-2.0-flash-exp");
    await testModel("gemini-1.5-flash");
})();
