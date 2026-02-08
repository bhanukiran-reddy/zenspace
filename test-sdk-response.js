
const { GoogleGenAI } = require("@google/genai");
const fs = require('fs');
const path = require('path');

// Load env
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
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
        const response = await client.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [{ role: "user", parts: [{ text: "Hello" }] }]
        });

        console.log("Response keys:", Object.keys(response));
        console.log("Response prototype:", Object.getPrototypeOf(response));
        if (typeof response.text === 'function') {
            console.log("response.text() exists and returns:", response.text());
        } else {
            console.log("response.text() does NOT exist");
            console.log("Candidates:", JSON.stringify(response.candidates, null, 2));
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

test();
