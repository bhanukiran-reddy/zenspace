
const { GoogleGenAI } = require("@google/genai");
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envConfig = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) envConfig[key.trim()] = value.trim();
});

async function main() {
    const client = new GoogleGenAI({ apiKey: envConfig.GEMINI_API_KEY });
    try {
        console.log("Testing gemini-2.0-flash...");
        const response = await client.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [{ role: "user", parts: [{ text: "Hello, are you working?" }] }]
        });
        console.log("Response:", response.response.text());
        console.log("SUCCESS");
    } catch (e) {
        console.error("Error:", e);
    }
}
main();
