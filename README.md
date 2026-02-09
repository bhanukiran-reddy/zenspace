# ZenSpace — AI Spatial Reality Architect

> An autonomous AI agent that perceives physical spaces, reasons about design using physics-based logic, generates renovation blueprints, recommends real products with AI-generated previews, and transforms environments in real-time AR — powered by Google's Gemini 3 API.

[![Gemini 3 Hackathon 2026](https://img.shields.io/badge/Google_DeepMind-Gemini_3_Hackathon_2026-8b5cf6?style=for-the-badge&logo=google&logoColor=white)](https://gemini3.devpost.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## What is ZenSpace?

ZenSpace is a full-stack autonomous spatial reasoning agent. It brings together multimodal AI perception, physics-based reasoning, generative image creation, and augmented reality — all orchestrated through Google's Gemini 3 API.

**The core idea:** What if AI could look at any room, understand its problems like a professional architect, suggest exact products to fix them, show AI-generated previews of those products, and let you shop for them — all in one experience?

ZenSpace operates on a **Perceive → Reason → Act → Recommend → Transform** pipeline:

| Step | What Happens | Gemini 3 Model |
|------|-------------|----------------|
| **Perceive** | Analyzes room geometry, furniture, lighting, color palette, and layout from photos or live camera | Gemini 3 Flash |
| **Reason** | Uses physics-based logic to identify friction points — glare, ergonomic issues, acoustic echo, spatial bottlenecks | Gemini 3 Pro |
| **Act** | Generates a structured renovation plan with prioritized actions, product suggestions, and placement coordinates | Gemini 3 Pro |
| **Recommend** | Suggests purchasable products with AI previews, price estimates, placement instructions, and Google Shopping links | Gemini 3 Flash + Nano Banana Pro |
| **Transform** | Detects objects in real-time, applies style transformations, and overlays AI-generated replacements on the camera feed | Gemini 3 Flash + Nano Banana Pro |

### The Problem

- Interior design consultations cost $100–500/hour
- People can't visualize how new furniture would look in their space
- Shopping for furniture is overwhelming without context about what fits
- Existing AR home tools don't actually understand your room

ZenSpace makes Gemini 3 your personal AI architect, product consultant, and AR transformation engine.

---

## Gemini 3 Integration

ZenSpace uses **three Gemini 3 models** across **five API endpoints** to create an end-to-end spatial intelligence pipeline.

### Gemini 3 Pro Preview — Deep Thinker

Powers the room analysis agent (`/api/agent`). When a user uploads a room photo, Gemini 3 Pro performs physics-based spatial analysis — tracing light sources for glare, calculating ergonomic angles, detecting hard surfaces that cause echo, assessing movement flow, and rating the overall aesthetic. Outputs a structured JSON renovation blueprint with prioritized actions, placement guides, product suggestions with image generation prompts, and shopping queries. The model's reasoning chain is fully visible to the user.

### Gemini 3 Flash Preview — Real-Time Brain

Drives three systems:
- **Conversational Assistant** (`/api/assist`) — Natural multi-turn dialogue with full visual context. The AI behaves like Gemini itself — intelligent, natural, and unconstrained. It sees the user's environment, remembers conversation context, and responds like a knowledgeable friend. Supports both voice and text input.
- **Object Detection** (`/api/detect`) — Real-time object detection with normalized bounding boxes, category classification, mood extraction, and color palette analysis.
- **Product Suggestions** (`/api/suggest`) — Analyzes the live camera feed and returns structured product recommendations with descriptions, reasons, placement instructions, prices, and Google Shopping links.

### Nano Banana Pro (Gemini 3 Pro Image Preview) — Visual Creator

Generates photorealistic product preview images (`/api/image-gen`). When the agent recommends adding furniture, Nano Banana Pro creates realistic product photography. These previews appear in both static analysis results and the live AR assistant. In Transform mode, generated images are composited directly onto the camera feed.

### Multi-Model Orchestration

All endpoints implement intelligent fallback chains — if the primary model is unavailable, requests cascade to alternatives:

```
Agent:   gemini-3-pro-preview → gemini-3-flash-preview → gemini-2.5-flash
Assist:  gemini-3-flash-preview → gemini-2.5-flash → gemini-2.0-flash
Detect:  gemini-3-flash-preview → gemini-2.5-flash
Suggest: gemini-3-flash-preview → gemini-3-pro-preview → gemini-2.5-flash
ImgGen:  nano-banana-pro-preview → gemini-3-pro-image-preview → gemini-2.0-flash-exp
```

---

## Features

### Mode 1: Upload & Analyze

Upload a room photo and get a comprehensive renovation blueprint:

- **Vibe Score** — 1–10 aesthetic rating
- **Room Type Detection** — automatic classification
- **Lighting Analysis** — natural vs artificial balance, glare sources, shadow zones
- **Spatial Flow** — movement paths, bottlenecks, dead zones
- **Identified Issues** — specific problems with physics-based reasoning
- **Renovation Plan** — ordered actions with impact ratings
- **AI Product Previews** — photorealistic images via Nano Banana Pro
- **Shopping List** — all products in a grid with generated previews and Google Shopping links
- **Thought Trace** — full visibility into the AI's reasoning chain

### Mode 2: Live AR Assistant

Real-time camera-powered spatial intelligence:

- **Live Camera Feed** with AR canvas overlay
- **Natural Conversation** — the AI behaves like Gemini itself, not a scripted chatbot. Ask it anything about your space, get honest, specific answers
- **Voice Input** via Web Speech API
- **Text Input** with context-aware prompts
- **Auto-Scan** — continuous object detection every 6 seconds
- **Object Detection** — bounding boxes drawn on canvas with category color coding
- **Click-to-Select** — tap any detected object
- **Voice Output** — AI responses spoken aloud (toggleable)
- **Room Mood Detection** — automatic ambiance analysis
- **Color Palette Extraction** — dominant colors displayed as swatches

### Smart Product Suggestions

AI-curated shopping recommendations based on what Gemini 3 actually sees:

- Product cards with AI-generated previews
- Product name, description, and brand
- "Why This Fits" — explanation referencing your specific room
- Exact placement instructions
- Price estimates
- Impact ratings
- Style tags
- One-click Google Shopping links

### Style Transform

6 design presets that change the AI's perspective:

| Style | Aesthetic |
|-------|-----------|
| Zen | Calm, natural materials, warm lighting |
| Cyberpunk | Neon accents, LED strips, high-tech |
| Professional | Clean lines, neutral palette, organized |
| Fantasy | Rich textures, dramatic lighting, ornate |
| Minimalist | Bare essentials, white space, hidden storage |
| Cozy | Warm tones, soft textures, layered lighting |

Select a style + a detected object → click Transform → Gemini 3 generates and overlays a styled replacement on the camera feed.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       ZenSpace Client                        │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────┐    │
│  │ Upload +     │  │ Live Camera + │  │ AR Canvas +    │    │
│  │ Analysis +   │  │ Voice/Text +  │  │ BBox Overlay + │    │
│  │ Shopping     │  │ Quick Actions │  │ Transforms     │    │
│  └──────┬───────┘  └──────┬────────┘  └───────┬────────┘    │
├─────────┼─────────────────┼──────────────────┼──────────────┤
│         │     Next.js API Routes             │              │
│  ┌──────▼───────┐  ┌─────▼──────┐  ┌────────▼─────────┐    │
│  │ /api/agent   │  │ /api/assist│  │ /api/detect      │    │
│  │ Deep Analysis│  │ Conversation│  │ Object Detection │    │
│  ├──────────────┤  ├────────────┤  └──────────────────┘    │
│  │ /api/image-gen│ │ /api/suggest│                          │
│  │ Product Images│ │ AI Shopping │                          │
│  └──────┬───────┘  └─────┬──────┘                          │
├─────────┼────────────────┼──────────────────────────────────┤
│         │     Gemini 3 API Models            │              │
│  ┌──────▼───────┐  ┌────▼──────┐  ┌────────────────┐      │
│  │ Gemini 3 Pro │  │ Gemini 3  │  │ Nano Banana    │      │
│  │ (Reasoning)  │  │ Flash     │  │ Pro (ImgGen)   │      │
│  └──────────────┘  └───────────┘  └────────────────┘      │
└──────────────────────────────────────────────────────────────┘
```

---

## How We Built It

### Frontend
- **Next.js 16** with App Router
- **React 19** with hooks-based state management
- **TypeScript** for type safety
- **Tailwind CSS 4** — minimal, dark design system
- **Canvas API** for AR overlay rendering
- **Web Speech API** for voice I/O
- **shadcn/ui** for accessible UI primitives

### Backend
- **5 Next.js API Routes** — each dedicated to a Gemini 3 capability
- **@google/genai SDK** — official Google GenAI TypeScript SDK
- **Structured JSON output** via `responseMimeType: "application/json"`
- **System instructions** giving each model its role
- **Model fallback chains** for reliability
- **Conversation history** for multi-turn context

### AI Design
- The conversational assistant uses a minimal, natural system prompt — letting Gemini 3 use its full intelligence rather than constraining it with rigid rules. It behaves like Gemini itself: honest, specific, context-aware.
- The agent uses a detailed 54-line instruction set covering physics, ergonomics, acoustics, and aesthetics.
- Detection and suggestion prompts enforce strict JSON schemas.

### UI Design
- Dark theme with #09090b base
- Zinc/neutral palette — professional, not flashy
- Clean typography with proper hierarchy
- Minimal borders and subtle transitions
- White accent for primary actions (Analyze, Shop)
- No gratuitous gradients or glow effects

---

## Challenges We Ran Into

1. **API Key Timing** — `GoogleGenAI` was initialized at module load before env vars were available. Fixed by moving initialization inside request handlers.
2. **Bounding Box Accuracy** — Gemini 3 Flash sometimes returns coordinates outside 0–1 range. Fixed with server-side clamping.
3. **Rate Limits** — Implemented fallback chains that cascade to alternative models.
4. **Canvas Sync** — AR overlay needed to stay aligned with video across resizes. Fixed with `getBoundingClientRect()` on resize.
5. **Speech Blocking** — Long responses blocked UI during speech. Fixed by truncating to 250 characters with toggle control.
6. **Image Generation** — Nano Banana Pro sometimes returns text instead of images. Added explicit `inlineData` checks with fallback handling.

---

## Accomplishments

- **5 distinct API endpoints** all powered by Gemini 3
- **3 Gemini 3 models** orchestrated with intelligent fallback
- **Real-time AR overlay** rendering bounding boxes, labels, and generated images on live camera
- **Natural AI conversation** — the assistant behaves like Gemini itself, not a scripted chatbot
- **Smart product suggestions** referencing what the AI actually sees
- **Physics-based reasoning** visible in the thought trace
- **Voice-first design** — entire app usable hands-free
- **Zero external services** beyond Gemini 3
- **Professional UI** — clean, dark, functional

---

## What We Learned

- Gemini 3's multimodal vision accurately identifies furniture styles, lighting conditions, and spatial relationships from a single photo
- Structured JSON output mode dramatically improves reliability for agent applications
- Letting Gemini be naturally intelligent (minimal system prompts) produces better conversational results than over-constraining with rigid rules
- Model fallback chains are essential — no single model has 100% uptime
- Canvas API works well for browser-based AR
- The system prompt IS the application logic

---

## What's Next

1. **VR Transfer** — Export detected rooms with transformations to WebXR
2. **Multi-Room Projects** — Save and manage rooms with consistent style
3. **Before/After Comparison** — Side-by-side slider
4. **Live Pricing** — Google Shopping API integration
5. **Mobile AR** — Dedicated phone camera experience
6. **AR Gaming** — Transform rooms into game levels, export to VR
7. **Architect Export** — CAD-compatible measurement data

---

## Getting Started

### Prerequisites
- Node.js 18+
- Google Gemini API Key (free at [Google AI Studio](https://aistudio.google.com/))
- Modern browser with camera access

### Setup

```bash
git clone https://github.com/YOUR_USERNAME/zenspace.git
cd zenspace
npm install
```

Create `.env.local`:

```
GEMINI_API_KEY=your_key_here
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deploy

```bash
npx vercel --yes
```

Set `GEMINI_API_KEY` in Vercel environment variables.

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 16 | Full-stack framework |
| React 19 | UI |
| TypeScript 5 | Type safety |
| @google/genai | Gemini 3 SDK |
| Gemini 3 Pro Preview | Deep spatial reasoning |
| Gemini 3 Flash Preview | Real-time vision, chat, detection |
| Nano Banana Pro Preview | Image generation |
| Tailwind CSS 4 | Styling |
| shadcn/ui | UI components |
| Web Speech API | Voice I/O |
| Canvas API | AR overlay |

---

## Project Structure

```
zenspace/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Main UI
│   │   ├── layout.tsx               # Root layout
│   │   ├── globals.css              # Design system
│   │   └── api/
│   │       ├── agent/route.ts       # Deep room analysis (Gemini 3 Pro)
│   │       ├── assist/route.ts      # Conversational AI (Gemini 3 Flash)
│   │       ├── detect/route.ts      # Object detection (Gemini 3 Flash)
│   │       ├── suggest/route.ts     # Product suggestions (Gemini 3 Flash)
│   │       └── image-gen/route.ts   # Image generation (Nano Banana Pro)
│   ├── components/
│   │   ├── VisualAssistant.tsx      # Live AR assistant
│   │   └── ui/                      # UI components
│   └── lib/
│       ├── agent.ts                 # ZenSpaceAgent class
│       └── utils.ts                 # Utilities
├── .env.local                       # API key (not committed)
├── package.json
└── README.md
```

---

## Third-Party Integrations

| Integration | Purpose | License |
|-------------|---------|---------|
| @google/genai | Gemini 3 API | Apache 2.0 |
| Next.js | Framework | MIT |
| React | UI | MIT |
| Tailwind CSS | Styling | MIT |
| Radix UI | UI primitives | MIT |
| Lucide React | Icons | ISC |
| Google Shopping | Product links | Public |
| Web Speech API | Voice | Native |
| Canvas API | AR | Native |

No user data is stored or transmitted to third parties. All AI processing goes through Google's Gemini 3 API. No database, no auth, no external APIs beyond Gemini.

---

## Hackathon Submission

| Field | Value |
|-------|-------|
| Contest | Google DeepMind Gemini 3 Hackathon 2026 |
| Period | Dec 17, 2025 – Feb 9, 2026 |
| Models | Gemini 3 Pro, Gemini 3 Flash, Nano Banana Pro |
| SDK | @google/genai |
| Endpoints | 5 |
| New Project | Yes |

### What Makes ZenSpace Different

| | |
|---|---|
| Not a wrapper | Autonomous agent with Perceive → Reason → Act → Recommend → Transform pipeline |
| Multi-model | 3 Gemini 3 models with intelligent fallback chains |
| Real-time AR | Live camera + detection + bounding boxes + image compositing |
| Smart shopping | AI suggests products with generated previews and buy links |
| Natural AI | The assistant behaves like Gemini itself — intelligent, honest, context-aware |
| Physics reasoning | Lighting, ergonomics, acoustics, spatial flow |
| Voice-first | Full speech I/O |
| Style system | 6 design presets |
| Production-ready | Fallbacks, error handling, graceful degradation |
| Zero dependencies | Only needs a Gemini API key |

---

<div align="center">

**Built for the Google DeepMind Gemini 3 Hackathon 2026**

[Live Demo](YOUR_VERCEL_URL) · [Video](YOUR_VIDEO_URL) · [Devpost](https://gemini3.devpost.com/)

</div>
