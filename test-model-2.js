
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

async function test() {
    console.log("Listing models...");
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
        const response = await client.models.list();
        for (const model of response) {
            console.log(model.name);
        }
    } catch (e) {
        console.error("Error listing models:", JSON.stringify(e, null, 2));
    }
}
test();
