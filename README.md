# 🏠 ZenSpace — AI Spatial Reality Architect

> **An autonomous AI agent that perceives physical spaces, reasons about design flaws using physics-based logic, generates renovation blueprints, recommends purchasable products with AI-generated previews, and transforms environments in real-time AR — all powered by Google's Gemini 3 API.**

[![Gemini 3 Hackathon 2026](https://img.shields.io/badge/Google_DeepMind-Gemini_3_Hackathon_2026-8b5cf6?style=for-the-badge&logo=google&logoColor=white)](https://gemini3.devpost.com/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.1.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Gemini 3 Pro](https://img.shields.io/badge/Gemini_3-Pro_Preview-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Gemini 3 Flash](https://img.shields.io/badge/Gemini_3-Flash_Preview-EA4335?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Nano Banana Pro](https://img.shields.io/badge/Nano_Banana-Pro_Preview-FBBC04?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

---

## 📖 Table of Contents

- [What is ZenSpace?](#-what-is-zenspace)
- [Gemini 3 Integration](#-gemini-3-integration-how-we-use-the-api)
- [Key Features](#-key-features)
- [Demo & Screenshots](#-demo--screenshots)
- [Architecture](#-architecture)
- [How We Built It](#-how-we-built-it)
- [Challenges We Ran Into](#-challenges-we-ran-into)
- [Accomplishments We're Proud Of](#-accomplishments-were-proud-of)
- [What We Learned](#-what-we-learned)
- [What's Next](#-whats-next)
- [Getting Started](#-getting-started)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Third-Party Integrations](#-third-party-integrations)
- [Hackathon Submission](#-hackathon-submission)

---

## 🎯 What is ZenSpace?

ZenSpace is **not** another chatbot wrapper or simple API demo. It is a **full-stack autonomous spatial reasoning agent** that brings together multimodal AI perception, physics-based reasoning, generative image creation, and augmented reality — all orchestrated through Google's Gemini 3 API.

The core idea: **What if AI could look at any room, understand its problems like a professional architect, suggest exact products to fix them, show you AI-generated previews of those products, and let you shop for them — all in one experience?**

ZenSpace operates on a **Perceive → Reason → Act → Recommend → Transform** pipeline:

| Step | What Happens | Gemini 3 Model |
|------|-------------|----------------|
| **1. PERCEIVE** | Analyzes room geometry, furniture placement, lighting conditions, color palette, and spatial layout from photos or live camera feeds | Gemini 3 Flash Preview |
| **2. REASON** | Uses physics-based logic to identify "friction points" — glare from windows, ergonomic issues, acoustic echo from hard surfaces, spatial flow bottlenecks, clutter zones | Gemini 3 Pro Preview |
| **3. ACT** | Generates a structured JSON renovation plan with prioritized actions, specific product suggestions, placement coordinates, and contractor notes | Gemini 3 Pro Preview |
| **4. RECOMMEND** | Suggests specific purchasable products with AI-generated preview images, price estimates, placement instructions, "Why This Fits" explanations, and direct Google Shopping links | Gemini 3 Flash Preview + Nano Banana Pro |
| **5. TRANSFORM** | In Live AR mode, detects objects in real-time with bounding boxes, allows style transformation (Zen, Cyberpunk, Professional, Fantasy, Minimalist, Cozy), and overlays AI-generated replacement objects directly onto the camera feed | Gemini 3 Flash + Nano Banana Pro |

### The Problem We're Solving

- **Interior design is expensive** — professional consultations cost $100-500/hour
- **People struggle to visualize changes** — hard to imagine how a new lamp or desk would look
- **Shopping for furniture is overwhelming** — endless options with no context about what fits YOUR specific space
- **AR home tools are gimmicky** — most just let you place 3D models; none actually understand your space

ZenSpace solves all of these by making Gemini 3 your personal AI architect, product consultant, and AR transformation engine.

---

## 🧠 Gemini 3 Integration (How We Use the API)

ZenSpace leverages **three distinct Gemini 3 models** across **five API endpoints** to create an end-to-end spatial intelligence pipeline — demonstrating the full breadth of Gemini 3's multimodal capabilities.

### Model 1: Gemini 3 Pro Preview — The Deep Thinker

Powers the **deep room analysis agent** (`/api/agent`). When a user uploads a room photo, Gemini 3 Pro's advanced reasoning capabilities perform physics-based spatial analysis — tracing light sources for potential glare, calculating ergonomic viewing angles for monitors and TVs, detecting hard surfaces that cause acoustic echo, assessing movement flow paths for bottlenecks, and rating the overall "vibe" of the space. It outputs a structured JSON renovation blueprint with prioritized actions, detailed placement guides, product suggestions with image generation prompts, and shopping search queries. The model's thinking trace is fully visible to the user, demonstrating the reasoning chain.

### Model 2: Gemini 3 Flash Preview — The Real-Time Brain

Drives **three critical systems**:
- **Live AR Conversational Assistant** (`/api/assist`) — Multi-turn dialogue with visual context, conversation memory, and style-aware responses. Supports both voice and text input.
- **Object Detection Engine** (`/api/detect`) — Rapid spatial object detection with normalized bounding box coordinates, category classification, room mood extraction, and dominant color palette analysis. Enables the AR canvas overlay system.
- **Smart Product Suggestion Engine** (`/api/suggest`) — Analyzes the live camera feed and returns structured product recommendations with descriptions, "Why This Fits" reasoning, placement instructions, price estimates, impact ratings, style tags, image generation prompts, and Google Shopping queries.

### Model 3: Nano Banana Pro (Gemini 3 Pro Image Preview) — The Visual Creator

Generates **photorealistic product preview images** (`/api/image-gen`). When the agent recommends adding furniture or decor, Nano Banana Pro creates realistic product photography — enabling users to "see" suggested items before purchasing. These previews appear in both the static analysis results and the live AR assistant's suggestion cards. In AR Transform mode, generated images are composited directly onto the camera feed at detected object positions.

### Multi-Model Orchestration

All endpoints implement **intelligent fallback chains** — if the primary model is unavailable or rate-limited, requests automatically cascade to the next model in the chain. This ensures the application remains functional even under high load:

```
Agent:   gemini-3-pro-preview → gemini-3-flash-preview → gemini-2.5-flash
Assist:  gemini-3-flash-preview → gemini-2.5-flash → gemini-2.0-flash
Detect:  gemini-3-flash-preview → gemini-2.5-flash
Suggest: gemini-3-flash-preview → gemini-3-pro-preview → gemini-2.5-flash
ImgGen:  nano-banana-pro-preview → gemini-3-pro-image-preview → gemini-2.0-flash-exp
```

This architecture demonstrates Gemini 3's full multimodal capability: **vision understanding, spatial reasoning with deep thinking, conversational intelligence, structured data generation, and generative image creation** — all orchestrated by a single autonomous agent.

---

## ✨ Key Features

### 📸 Mode 1: Static Room Analysis (Upload)

Upload a room photo, optionally describe your vision, and Gemini 3 Pro generates a comprehensive renovation blueprint:

- **Vibe Score** — 1-10 aesthetic rating of your current space
- **Room Type Detection** — automatic classification (bedroom, office, living room, etc.)
- **Lighting Analysis** — natural vs artificial light balance, glare sources, shadow zones
- **Spatial Flow Analysis** — movement paths, bottlenecks, dead zones
- **Identified Issues** — specific problems with physics-based reasoning
- **Renovation Plan** — ordered list of actions (add items, contractor notes)
- **AI-Generated Product Previews** — photorealistic images via Nano Banana Pro
- **Shopping List Tab** — all recommended products in a visual grid with:
  - Generated preview images
  - Impact ratings (high/medium/low)
  - Placement guides
  - One-click Google Shopping links
- **Thought Trace** — full visibility into the AI's reasoning chain

### 🎥 Mode 2: Live AR Assistant (Camera)

Real-time camera-powered spatial intelligence with augmented reality:

- **Live Camera Feed** — real-time video with AR canvas overlay
- **Voice Input** — speak naturally via Web Speech API
- **Text Input** — type queries with context-aware placeholder
- **Auto-Scan Mode** — automatic object detection every 6 seconds
- **Object Detection** — Gemini 3 identifies objects with bounding boxes, drawn on canvas
- **Category Color Coding** — furniture (purple), lighting (amber), decor (pink), electronics (cyan), storage (green), textiles (orange), plants (emerald), tech (blue)
- **Click-to-Select** — tap any detected object on the camera feed
- **Multi-Turn Conversation** — context-aware dialogue with chat history
- **Voice Output** — AI responses spoken aloud (toggleable)
- **Room Mood Detection** — automatic ambiance analysis (e.g., "cluttered workspace", "cozy bedroom")
- **Color Palette Extraction** — 4 dominant colors displayed as live swatches
- **Welcome Onboarding** — guided first-use message

### 🛍️ Smart Product Suggestions

The killer feature — AI-curated shopping recommendations based on what Gemini 3 **actually sees**:

- **"Suggest Products" Button** — one-click in the Live AR assistant
- **Smart Keyword Detection** — saying "suggest", "recommend", "buy", or "what should I add" automatically triggers the suggestion engine
- **Product Cards** with:
  - 📸 AI-generated preview image (click to generate)
  - 📝 Product name and detailed description
  - ⭐ "Why This Fits" — explanation referencing YOUR specific room
  - 📍 Exact placement instructions
  - 💰 Realistic price estimates (USD)
  - 📊 Impact rating (high/medium/low)
  - 🏷️ Style tags (modern, minimalist, warm, etc.)
  - 🛒 **One-click Google Shopping** button
- **Side Panel Tabs** — switch between Objects view and Shopping view
- **Impact-Ordered** — highest-impact suggestions shown first

### 🎨 Style Transform System

6 design presets that transform the AI's entire perspective:

| Style | Aesthetic | Example |
|-------|-----------|---------|
| 🧘 Zen | Calm, natural materials, plants, warm lighting | Bamboo desk organizer, meditation corner |
| 🌆 Cyberpunk | Neon accents, LED strips, dark base, high-tech | RGB underglow, holographic wall art |
| 💼 Professional | Clean lines, neutral palette, organized | Cable management, ergonomic monitor arm |
| 🏰 Fantasy | Rich textures, dramatic lighting, ornate details | Velvet curtains, wrought iron bookends |
| ◻️ Minimalist | Bare essentials, white space, hidden storage | Floating shelves, wireless charger |
| 🔥 Cozy | Warm tones, soft textures, layered lighting | Chunky knit throw, salt lamp |

Select a style + a detected object → click **Transform** → Gemini 3 generates a styled replacement and overlays it on the camera feed in real-time.

### ⚡ Quick Actions

One-click intelligent shortcuts in the Live Assistant:
- **Scan Objects** — run immediate detection
- **Suggest Products** — get AI product recommendations
- **Auto-Scan ON/OFF** — toggle continuous detection
- **Lighting Tips** — instant lighting analysis
- **Rate My Space** — get an overall vibe assessment

---

## 📸 Demo & Screenshots

> **Demo Video:** [Link to YouTube/Loom demo video]
>
> **Live URL:** [Link to deployed Vercel app]

### Upload Mode — Room Analysis & Shopping List
*Upload a room photo → get a full renovation blueprint → browse product recommendations*

### Live AR Mode — Object Detection & Product Suggestions
*Open camera → scan objects → get AI product suggestions with previews → shop directly*

### Style Transform — Real-time Object Replacement
*Select an object → choose a style → AI generates and overlays the transformed version*

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         ZenSpace Client                          │
│  ┌────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │  Room Upload    │  │  Live Camera    │  │  AR Canvas       │  │
│  │  + Analysis     │  │  + Voice/Text   │  │  + BBox Overlay  │  │
│  │  + Shopping Tab │  │  + Quick Actions│  │  + Transforms    │  │
│  │  + Thought Trace│  │  + Suggestions  │  │  + Color Palette │  │
│  └───────┬────────┘  └────────┬────────┘  └────────┬─────────┘  │
├──────────┼─────────────────────┼───────────────────┼────────────┤
│          │       Next.js 16 API Routes             │            │
│  ┌───────▼────────┐  ┌───────▼───────┐  ┌─────────▼─────────┐  │
│  │  /api/agent    │  │  /api/assist  │  │  /api/detect      │  │
│  │  Deep Analysis │  │  Conversation │  │  Object Detection │  │
│  │                │  │               │  │  + Mood + Palette  │  │
│  ├────────────────┤  ├───────────────┤  └───────────────────┘  │
│  │  /api/image-gen│  │  /api/suggest │                          │
│  │  Product Images│  │  AI Shopping  │                          │
│  └───────┬────────┘  └───────┬───────┘                          │
├──────────┼─────────────────────┼────────────────────────────────┤
│          │       Gemini 3 API Models               │            │
│  ┌───────▼────────┐  ┌───────▼───────┐  ┌──────────────────┐  │
│  │ Gemini 3 Pro   │  │ Gemini 3      │  │  Nano Banana     │  │
│  │ Preview        │  │ Flash Preview │  │  Pro Preview     │  │
│  │ (Deep Reason)  │  │ (Fast Multi)  │  │  (Image Gen)     │  │
│  └────────────────┘  └───────────────┘  └──────────────────┘  │
└──────────────────────────────────────────────────────────────────┘

Data Flow:
  Upload → /api/agent (Gemini 3 Pro) → JSON Blueprint + Actions
  Camera → /api/detect (Gemini 3 Flash) → Objects + BBoxes + Mood
  Camera → /api/assist (Gemini 3 Flash) → Conversational Response
  Camera → /api/suggest (Gemini 3 Flash) → Product Recommendations
  Prompt → /api/image-gen (Nano Banana Pro) → Product Preview Image
```

---

## 🔨 How We Built It

### Frontend
- **Next.js 16** with App Router and server-side API routes
- **React 19** with hooks-based state management
- **TypeScript** for full type safety across all components and API routes
- **Tailwind CSS 4** for the design system — custom CSS variables, dark theme, glass morphism
- **Canvas API** for the AR overlay — bounding boxes, corner accents, category labels, image compositing
- **Web Speech API** — `SpeechRecognition` for voice input, `SpeechSynthesis` for voice output
- **shadcn/ui** (Radix UI primitives) for accessible UI components

### Backend
- **5 Next.js API Routes** — each dedicated to a specific Gemini 3 capability
- **`@google/genai` SDK** (v1.38+) — official Google GenAI TypeScript SDK
- **Structured JSON output** — using `responseMimeType: "application/json"` for deterministic parsing
- **System Instructions** — custom system prompts that give each model its specific role and constraints
- **Model fallback chains** — graceful degradation across 3 models per endpoint
- **Conversation history** — multi-turn context passed to the assist endpoint

### AI Prompt Engineering
- **Agent system prompt** — 54-line instruction set covering physics reasoning, ergonomics, acoustics, aesthetics, and spatial flow
- **Detection prompt** — strict JSON schema enforcement with bounding box validation rules
- **Suggestion prompt** — detailed product recommendation template with 11 required fields per product
- **Assist prompt** — conversational guidelines with style-aware response generation

### Design System
- Custom CSS variable system (`--zen-*`) for consistent theming
- 12 custom CSS animations (fade-in-up, scan-line, glow-pulse, object-pulse, AR grid, etc.)
- Glass morphism effects with `backdrop-blur` and `saturate`
- Category-specific color coding for detected objects
- Responsive layout with sidebar + main content + side panel

---

## 🚧 Challenges We Ran Into

1. **API Key Initialization Timing** — The `GoogleGenAI` client was being created at module load time in Next.js, before environment variables were available. Solution: moved client initialization inside each request handler.

2. **Bounding Box Accuracy** — Gemini 3 Flash's bounding box coordinates sometimes exceeded the 0-1 normalized range. Solution: implemented server-side clamping (`Math.max(0, Math.min(1, v))`) to ensure valid coordinates.

3. **Model Rate Limits** — During development, we frequently hit rate limits on Gemini 3 models. Solution: implemented intelligent fallback chains that cascade to alternative models, plus retry delays between attempts.

4. **Canvas Overlay Synchronization** — The AR overlay canvas needed to stay perfectly aligned with the video feed across window resizes. Solution: `ResizeObserver`-like approach using `getBoundingClientRect()` on resize events.

5. **Speech Synthesis Blocking** — Long AI responses would block the UI while being spoken. Solution: truncated speech output to 250 characters and added a voice toggle for user control.

6. **Image Generation Reliability** — Nano Banana Pro sometimes returns text instead of images. Solution: explicit check for `inlineData` parts, with fallback error handling and user-friendly status messages.

---

## 🏆 Accomplishments We're Proud Of

- **5 distinct API endpoints** all powered by Gemini 3 — not just one wrapper
- **3 Gemini 3 models** orchestrated in a single application with intelligent fallback
- **Real-time AR overlay** that renders bounding boxes, labels, and generated images on a live camera feed
- **Smart product suggestions** that reference what the AI actually sees — not generic recommendations
- **Physics-based reasoning** visible in the thought trace — lighting analysis, ergonomic calculations, acoustic detection
- **Voice-first design** — the entire app can be used hands-free via speech
- **Sub-200ms render times** on the main page after initial compile
- **Zero external services** beyond Gemini 3 — no databases, no auth, no third-party APIs (except Google Shopping links)
- **Professional-grade UI** — dark theme, glass morphism, custom animations, category color coding

---

## 📚 What We Learned

- **Gemini 3's multimodal vision is remarkably accurate** — it correctly identifies furniture styles, lighting conditions, and spatial relationships from a single photo
- **Structured JSON output mode** (`responseMimeType: "application/json"`) dramatically improves reliability for agent-style applications
- **System instructions** are crucial for consistent agentic behavior — without them, responses are too generic
- **Model fallback chains** are essential for production applications — no single model has 100% uptime
- **Canvas API is powerful for AR** — bounding box rendering, image compositing, and real-time drawing all work smoothly in the browser
- **Prompt engineering is the new architecture** — the 54-line agent system prompt IS the application logic

---

## 🔮 What's Next

If we continue developing ZenSpace, here's the roadmap:

1. **VR Environment Transfer** — Export the detected room with applied transformations to WebXR, enabling users to walk through their redesigned space in VR
2. **Multi-Room Projects** — Save and manage multiple rooms as a single project with consistent style
3. **Before/After Comparison** — Side-by-side slider showing original room vs AI-generated renovation
4. **Real-Time Price Tracking** — Integration with Google Shopping API for live pricing
5. **Collaborative Mode** — Share your room analysis with friends/family for feedback
6. **Mobile-First AR** — Dedicated mobile experience optimized for phone cameras
7. **AR Gaming Mode** — Transform detected environments into game levels (cyberpunk cityscape, fantasy dungeon, etc.) and export to VR
8. **Architect Export** — Generate CAD-compatible measurement data from room photos
9. **AI Interior Designer Personas** — Choose from different AI architect personalities (minimalist, maximalist, eco-friendly, budget-conscious)
10. **Smart Home Integration** — Connect with IoT devices to actually adjust lighting based on AI recommendations

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** ([Download](https://nodejs.org/))
- **Google Gemini API Key** — free at [Google AI Studio](https://aistudio.google.com/)
- **Modern browser** with camera access (Chrome, Edge, or Firefox recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/zenspace.git
cd zenspace

# Install dependencies
npm install
```

### Environment Setup

Create a `.env.local` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> 💡 Get your free API key at [https://aistudio.google.com/](https://aistudio.google.com/). Gemini 3 Flash and Pro Preview are available in the free tier.

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel

```bash
npx vercel --yes
```

> Set `GEMINI_API_KEY` in your Vercel project's environment variables.

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1.5 | Full-stack React framework with App Router |
| **React** | 19.2.3 | UI component library |
| **TypeScript** | 5.x | Type-safe codebase |
| **@google/genai** | 1.38+ | Official Google GenAI SDK for Gemini 3 |
| **Gemini 3 Pro Preview** | — | Deep spatial reasoning + thinking |
| **Gemini 3 Flash Preview** | — | Real-time conversation + detection + suggestions |
| **Nano Banana Pro Preview** | — | AI image generation for product previews |
| **Tailwind CSS** | 4.x | Utility-first CSS framework + design system |
| **Radix UI** | Latest | Accessible UI primitives (via shadcn/ui) |
| **Web Speech API** | Native | Browser voice recognition + synthesis |
| **Canvas API** | Native | AR overlay rendering + image compositing |
| **Lucide React** | 0.563+ | Icon library |

---

## 📁 Project Structure

```
zenspace/
├── public/
│   └── grid.svg                     # AR grid overlay pattern
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Main UI — upload, analysis, results, shopping list
│   │   ├── layout.tsx               # Root layout with metadata + fonts
│   │   ├── globals.css              # Design system — variables, animations, AR styles
│   │   └── api/
│   │       ├── agent/route.ts       # POST — Deep room analysis (Gemini 3 Pro)
│   │       ├── assist/route.ts      # POST — Live conversational AI (Gemini 3 Flash)
│   │       ├── detect/route.ts      # POST — Object detection + mood + palette (Gemini 3 Flash)
│   │       ├── suggest/route.ts     # POST — Smart product suggestions (Gemini 3 Flash)
│   │       └── image-gen/route.ts   # POST — Product image generation (Nano Banana Pro)
│   ├── components/
│   │   ├── VisualAssistant.tsx      # Live AR camera assistant + product suggestions UI
│   │   └── ui/                      # Reusable UI components (badge, button, card, input, etc.)
│   └── lib/
│       ├── agent.ts                 # ZenSpaceAgent class — system prompt + model orchestration
│       └── utils.ts                 # cn() utility for class merging
├── .env.local                       # GEMINI_API_KEY (not committed)
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── components.json                  # shadcn/ui configuration
└── README.md
```

---

## 📦 Third-Party Integrations

As required by the hackathon rules, here is a disclosure of all third-party integrations:

| Integration | Type | Purpose | License/Terms |
|-------------|------|---------|---------------|
| **@google/genai** | SDK | Official Google GenAI SDK for Gemini 3 API access | [Apache 2.0](https://github.com/googleapis/google-cloud-node/blob/main/LICENSE) |
| **Next.js** | Framework | Full-stack React framework | [MIT License](https://github.com/vercel/next.js/blob/canary/license.md) |
| **React** | Library | UI component library | [MIT License](https://github.com/facebook/react/blob/main/LICENSE) |
| **Tailwind CSS** | CSS Framework | Utility-first styling | [MIT License](https://github.com/tailwindcss/tailwindcss/blob/master/LICENSE) |
| **Radix UI** | UI Primitives | Accessible component primitives (via shadcn/ui) | [MIT License](https://github.com/radix-ui/primitives/blob/main/LICENSE) |
| **Lucide React** | Icon Library | SVG icons | [ISC License](https://github.com/lucide-icons/lucide/blob/main/LICENSE) |
| **Google Shopping** | External Link | Product shopping links (opens in new tab) | Public search interface |
| **Web Speech API** | Browser API | Voice recognition + synthesis | Native browser capability |
| **Canvas API** | Browser API | AR overlay rendering | Native browser capability |

> **Note:** No user data is stored, transmitted to third parties, or persisted beyond the browser session. All AI processing happens through Google's Gemini 3 API. The application has no database, no authentication, and no external API calls beyond the Gemini 3 endpoints.

---

## 🏆 Hackathon Submission Details

| Field | Value |
|-------|-------|
| **Contest** | Google DeepMind Gemini 3 Hackathon 2026 |
| **Challenge** | Build a new application using the Gemini 3 API |
| **Submission Period** | Dec 17, 2025 – Feb 9, 2026 |
| **Models Used** | Gemini 3 Pro Preview, Gemini 3 Flash Preview, Nano Banana Pro (Gemini 3 Pro Image Preview) |
| **SDK** | @google/genai v1.38+ |
| **API Endpoints** | 5 (agent, assist, detect, suggest, image-gen) |
| **New Project** | Yes — built entirely within the contest period |

### What Makes ZenSpace Stand Out

| Differentiator | Details |
|----------------|---------|
| **Not a wrapper** | Autonomous agent with Perceive → Reason → Act → Recommend → Transform pipeline |
| **Multi-model orchestration** | 3 Gemini 3 models working in concert with intelligent fallback chains |
| **Real-time AR** | Live camera + object detection + bounding box overlay + image compositing |
| **Smart Shopping** | AI suggests specific products with generated previews and direct buy links |
| **Physics-based reasoning** | Lighting ray-tracing, ergonomic calculations, acoustic detection, spatial flow |
| **Style system** | 6 design presets that transform the AI's entire analytical perspective |
| **Voice-first design** | Full speech I/O — recognition + synthesis with toggle control |
| **Visible AI reasoning** | Thought trace shows the complete reasoning chain |
| **Production-ready** | Model fallbacks, error handling, rate limit detection, graceful degradation |
| **Zero external dependencies** | Only needs a Gemini API key — no databases, no auth, no third-party APIs |

---

## 📄 License

This project was created for the Google DeepMind Gemini 3 Hackathon 2026. All rights reserved by the creator(s).

---

<div align="center">

**Built with ❤️ and Gemini 3 for the Google DeepMind Hackathon 2026**

[🌐 Live Demo](YOUR_VERCEL_URL) • [📹 Video Demo](YOUR_VIDEO_URL) • [💬 Devpost](https://gemini3.devpost.com/)

</div>
