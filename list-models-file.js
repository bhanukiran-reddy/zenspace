
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
        const response = await client.models.list();
        let models = [];

        // Handle response iteration
        for await (const model of response) {
            models.push(model.name);
        }

        fs.writeFileSync('models_clean.txt', models.join('\n'));
        console.log("Wrote models to models_clean.txt");
    } catch (e) {
        console.error("Error:", e);
    }
}
main();
