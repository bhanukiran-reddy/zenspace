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

console.log("=== GEMINI API DIAGNOSTIC REPORT ===\n");

// Phase 1: API Key Analysis
console.log("PHASE 1: API KEY ANALYSIS");
console.log("------------------------");
if (!apiKey) {
    console.log("❌ API Key: NOT FOUND");
    process.exit(1);
} else {
    console.log(`✓ API Key exists: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`);
    console.log(`  Key length: ${apiKey.length} characters`);
    console.log(`  Key prefix: ${apiKey.startsWith('AIza') ? '✓ Valid AIza prefix' : '⚠️ Unusual prefix'}`);
}

// Phase 2: Client Initialization
console.log("\nPHASE 2: CLIENT INITIALIZATION");
console.log("-------------------------------");
let client;
try {
    client = new GoogleGenAI({ apiKey });
    console.log("✓ GoogleGenAI client created successfully");
} catch (e) {
    console.log("❌ Failed to create client:", e.message);
    process.exit(1);
}

// Phase 3: List Available Models
async function runDiagnostics() {
    console.log("\nPHASE 3: LIST AVAILABLE MODELS");
    console.log("-------------------------------");
    try {
        const modelsResponse = await client.models.list();
        const modelsList = [];
        for await (const model of modelsResponse) {
            modelsList.push(model.name);
        }
        console.log(`✓ Found ${modelsList.length} models:`);
        modelsList.forEach(m => console.log(`  - ${m}`));
    } catch (e) {
        console.log("❌ Failed to list models:");
        console.log(`  Error: ${e.message || JSON.stringify(e)}`);
        console.log(`  Status: ${e.status || 'N/A'}`);
    }

    // Phase 4: Test Specific Models
    console.log("\nPHASE 4: MODEL ACCESS TESTS");
    console.log("----------------------------");

    const modelsToTest = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-2.0-flash-001",
        "gemini-2.0-flash-exp",
        "gemini-1.5-flash",
        "gemini-1.5-flash-002",
        "gemini-1.5-pro",
        "gemini-pro",
        "models/gemini-2.0-flash",
        "models/gemini-1.5-flash",
    ];

    for (const modelName of modelsToTest) {
        try {
            const response = await client.models.generateContent({
                model: modelName,
                contents: [{ role: "user", parts: [{ text: "Say 'OK'" }] }]
            });
            const text = response.candidates?.[0]?.content?.parts?.[0]?.text || 'No text';
            console.log(`✓ ${modelName}: SUCCESS (${text.substring(0, 20)}...)`);
        } catch (e) {
            const status = e.status || 'N/A';
            const msg = e.message?.substring(0, 80) || JSON.stringify(e).substring(0, 80);
            console.log(`❌ ${modelName}: FAILED (${status}) - ${msg}`);
        }
    }

    // Phase 5: Summary
    console.log("\n=== DIAGNOSIS ===");
    console.log("If ALL models fail with 404: API key may be invalid, disabled, or project not properly set up");
    console.log("If SOME models fail: Those specific model versions may be deprecated or not available for your project");
    console.log("Check: https://aistudio.google.com/ to verify your API key and project settings");
}

runDiagnostics().catch(console.error);
