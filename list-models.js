
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
        console.log("Listing models...");
        const response = await client.models.list(); // This returns a Promise <ListModelsResponse>

        // The SDK response structure might vary. Let's try to inspect it.
        // Assuming response is an object with a 'models' array or similar.
        // Or if it's async iterable.

        let models = [];
        if (Array.isArray(response)) {
            models = response;
        } else if (response.models) {
            models = response.models;
        } else {
            // Try iterating if possible
            try {
                for await (const model of response) {
                    models.push(model);
                }
            } catch (iterErr) {
                console.log("Response is not iterable:", iterErr);
                console.log("Keys:", Object.keys(response));
            }
        }

        console.log(`Found ${models.length} models.`);
        models.forEach(m => {
            if (m.name.includes('flash') || m.name.includes('pro')) {
                console.log(`- ${m.name}`);
            }
        });

    } catch (e) {
        console.error("Error listing models:", e);
    }
}
main();
