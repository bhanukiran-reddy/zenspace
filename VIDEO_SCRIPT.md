# 🎬 ZenSpace — Demo Video Production Guide

> **Total Duration: 2 minutes 50 seconds (under the 3-minute limit)**
> **Recording Tool:** OBS Studio, Loom, or Windows Game Bar (Win+G)
> **Resolution:** 1920x1080 (Full HD)
> **Audio:** Use a decent mic. Speak clearly, confidently, at a moderate pace.
> **Browser:** Chrome (full screen, no bookmarks bar, clean tabs)

---

## 🎯 GOLDEN RULES FOR THE VIDEO

1. **No dead air** — always be narrating or showing something
2. **No fumbling** — practice the flow 2-3 times before recording
3. **Pre-load everything** — have the app running, camera permissions granted, a good room photo ready
4. **Clean desktop** — hide all other windows, notifications OFF
5. **Speak with energy** — you're pitching to Google engineers. Be confident.
6. **Show, don't tell** — every claim should have a visual on screen

---

## 📋 PRE-RECORDING CHECKLIST

Before you hit record, make sure:

- [ ] App running at `localhost:3000` (or deployed Vercel URL)
- [ ] `.env.local` has your `GEMINI_API_KEY` set
- [ ] Browser is Chrome, full screen, bookmarks bar hidden
- [ ] A good room photo ready on desktop (clear, well-lit room — messy is better for demo)
- [ ] Camera permissions pre-granted (open Live Mode once, allow camera, then close)
- [ ] Microphone working and tested
- [ ] Notifications OFF (Do Not Disturb mode)
- [ ] No other tabs or windows visible
- [ ] Screen recording tool ready (OBS/Loom/Game Bar)
- [ ] Practice the script at least 2 times

---

## 🎬 THE SCRIPT — SHOT BY SHOT

---

### SCENE 1: THE HOOK (0:00 – 0:12) ⚡

**What's on screen:** Black screen with text fade-in, then transition to the ZenSpace landing page

**NARRATION:**
> "What if AI could look at any room... understand its problems like a professional architect... and show you exactly what to buy to fix it — with one click?"

**On-screen action:**
1. Start on the ZenSpace landing page (already loaded)
2. The hero text "Transform Your Space" should be visible
3. The "GEMINI 3 POWERED" badge should be prominent

**Tip:** Pause slightly after "one click" for dramatic effect.

---

### SCENE 2: THE PROBLEM (0:12 – 0:30) 🔴

**What's on screen:** Still on the landing page, slowly scrolling to show capabilities

**NARRATION:**
> "Interior design consultations cost two hundred to five hundred dollars an hour. Most people can't visualize how a new lamp or desk would look in THEIR specific space. And shopping for furniture? Overwhelmingly endless options with zero context about what actually fits."
>
> "We built ZenSpace to solve this — an autonomous AI spatial architect powered entirely by Google's Gemini 3."

**On-screen action:**
1. Slowly scroll down to show the 3 feature cards (Deep Analysis, Smart Shopping, AR Transform)
2. Pause on the cards as you mention each pain point
3. Scroll back up to the upload area

---

### SCENE 3: UPLOAD & ANALYZE (0:30 – 1:10) 📸

**What's on screen:** Upload a room photo and show the full analysis

**NARRATION:**
> "Let me show you. I'll upload a photo of this room."

**On-screen action:**
1. Click the upload area
2. Select a room photo from your desktop (pick a real, slightly messy room for maximum impact)
3. Photo appears in the upload card

**NARRATION (while photo loads):**
> "Now I'll describe what I want — let's say 'modern minimalist home office with warm lighting'."

**On-screen action:**
4. Type in the vision field: "modern minimalist home office with warm lighting"
5. Click "Generate Blueprint"

**NARRATION (while loading):**
> "Gemini 3 Pro is now performing deep spatial reasoning — analyzing lighting physics, ergonomic angles, acoustic properties, and spatial flow. Watch."

**On-screen action:**
6. Show the loading skeleton animation (the purple "GEMINI 3 PRO ANALYZING SPACE..." badge)
7. Wait for results to appear

**NARRATION (when results appear):**
> "Here we go. Vibe score: [read the number]. It identified [number] issues and generated [number] specific actions."

**On-screen action:**
8. Point cursor at the Vibe Score card
9. Point at the Issues count
10. Point at the Actions count

**NARRATION:**
> "Look at the lighting analysis — it detected [read what it says briefly]. And spatial flow — [read briefly]."

**On-screen action:**
11. Scroll to show the Lighting and Spatial Flow cards
12. Scroll to show the Issues badges

**NARRATION:**
> "And here's the renovation plan. Each item has a reason based on what the AI actually saw, a placement guide, and..."

**On-screen action:**
13. Scroll through 1-2 renovation plan items, pause on placement guide
14. Click "Generate Preview Image" on one item

**NARRATION:**
> "...AI-generated product previews. Gemini 3's Nano Banana Pro creates a photorealistic image of exactly what this product looks like."

**On-screen action:**
15. Show the generated image appearing
16. Point at the "Gemini 3 Generated" badge on the image

**NARRATION:**
> "Now watch this — switch to the Shopping List tab."

**On-screen action:**
17. Click the "Shopping List" tab
18. Show the grid of product cards

**NARRATION:**
> "Every recommended product in one place — with preview images, impact ratings, and one-click Google Shopping links. This is how we close the loop from 'see' to 'buy'."

**On-screen action:**
19. Click one "Shop on Google" button — briefly show Google Shopping results opening in new tab
20. Switch back to the app

---

### SCENE 4: AI REASONING (1:10 – 1:20) 🧠

**What's on screen:** The thought trace section

**NARRATION:**
> "And the AI's reasoning is fully transparent. Expand this — you can see the complete thought chain. Lighting ray-tracing, ergonomic calculations, acoustic analysis. This isn't a chatbot wrapper — it's a reasoning engine."

**On-screen action:**
1. Click "View AI Reasoning (Thought Trace)"
2. Show the expanded thought trace text for 3-4 seconds
3. Scroll through it briefly

---

### SCENE 5: LIVE AR MODE — THE WOW MOMENT (1:20 – 2:15) 🎥

**What's on screen:** Live AR Assistant with camera feed

> **⚠️ THIS IS THE MOST IMPORTANT PART OF THE VIDEO. Practice this section multiple times.**

**NARRATION:**
> "But here's where it gets really powerful. Let me open the Live AR Assistant."

**On-screen action:**
1. Click "Open Live Mode" button (or the sidebar "Live AR Assistant" button)
2. Camera opens, showing the room/environment with corner brackets and HUD overlay

**NARRATION:**
> "This is real-time. Gemini 3 can see my environment through the camera. Let me scan for objects."

**On-screen action:**
3. Click the **"Scan Objects"** quick action button
4. Wait for bounding boxes to appear on the camera feed
5. Show the detection badge "SCANNING ENVIRONMENT..." then the results

**NARRATION (when objects detected):**
> "Found [number] objects — you can see the bounding boxes drawn live on the camera feed, each color-coded by category. [Point at a few] That's furniture, that's lighting, that's electronics."

**On-screen action:**
6. Click on a detected object on the canvas (or in the side panel)
7. Show it getting selected (highlighted with corner accents)

**NARRATION:**
> "Now the killer feature. I'll ask Gemini 3 — what products should I add to this space?"

**On-screen action:**
8. Click **"Suggest Products"** quick action button
9. Wait for the suggestion to process (show the "GENERATING SUGGESTIONS..." badge)
10. Switch to the **"Shop"** tab in the side panel when results appear

**NARRATION (when suggestions appear):**
> "Look at this. Gemini 3 analyzed my actual room and suggested [number] specific products. Each one has a name, description, and — most importantly — a 'Why This Fits' explanation that references what it actually sees in MY room."

**On-screen action:**
11. Scroll through the suggestion cards in the side panel
12. Pause on one card — point at the "Why This Fits" section
13. Point at the price estimate
14. Point at the placement instruction

**NARRATION:**
> "I can generate an AI preview of any product..."

**On-screen action:**
15. Click "Click to generate AI preview" on one product card
16. Wait for the image to generate and appear

**NARRATION:**
> "...and shop for it with one click."

**On-screen action:**
17. Click the "Shop on Google" button on that product card
18. Briefly show Google Shopping opening, then switch back

**NARRATION:**
> "Now let me show you the style transform. I'll select this [object name] and apply a Cyberpunk style."

**On-screen action:**
19. Click on a detected object (in the side panel or canvas)
20. Click the **"Cyber"** style preset in the Style Transform section
21. Click the **"Transform [object name]"** button
22. Wait for the transformation to apply

**NARRATION:**
> "Gemini 3's image generation model creates a styled replacement and overlays it directly on the camera feed in real-time. This is augmented reality powered by Gemini 3."

**On-screen action:**
23. Show the overlay image appearing on the camera feed where the object was
24. Maybe wave the camera slightly to show it's live

**NARRATION:**
> "I can also just talk to it."

**On-screen action:**
25. Click the **microphone button** (or type in the text box)
26. Say or type: "What's the biggest issue with this room?"
27. Wait for the AI response to appear in chat
28. Show the response being spoken back (if voice is on)

**NARRATION:**
> "Conversational spatial intelligence — with full context of what it's seeing right now."

---

### SCENE 6: TECHNICAL DEPTH (2:15 – 2:35) ⚙️

**What's on screen:** Close the Live Assistant, show the README or architecture briefly

**NARRATION:**
> "Under the hood, ZenSpace orchestrates three Gemini 3 models across five API endpoints."

**On-screen action:**
1. Close the Live Assistant
2. Optionally: open the README briefly to show the architecture diagram
3. Or: just narrate over the main page

**NARRATION:**
> "Gemini 3 Pro Preview handles deep spatial reasoning with physics-based thinking. Gemini 3 Flash Preview powers real-time conversation, object detection, and product suggestions. And Nano Banana Pro generates photorealistic product images."
>
> "Every endpoint has an intelligent model fallback chain — if one model is rate-limited, it automatically cascades to the next. This is production-grade AI engineering, not just a demo."

**On-screen action:**
4. If showing README, scroll to the architecture section briefly
5. If on main page, just show the "POWERED BY GEMINI 3" badge in sidebar

---

### SCENE 7: THE CLOSE (2:35 – 2:50) 🎯

**What's on screen:** Back on the main landing page, hero text visible

**NARRATION:**
> "ZenSpace transforms how people design their spaces. From a single photo or a live camera feed, Gemini 3 perceives, reasons, recommends, and transforms — giving everyone access to AI-powered interior design."
>
> "No expensive consultants. No guessing. Just point your camera and let Gemini 3 architect your world."
>
> "ZenSpace — built for the Google Gemini 3 Hackathon 2026. Thank you."

**On-screen action:**
1. Show the hero section with "Transform Your Space"
2. Camera lingers on the "GEMINI 3 POWERED" badge
3. End on a clean frame of the landing page

**FADE TO BLACK**

---

## 🎨 POST-PRODUCTION TIPS (OPTIONAL BUT RECOMMENDED)

If you have time for light editing:

1. **Add a title card** at 0:00 — "ZenSpace" with subtitle "AI Spatial Reality Architect" and "Google Gemini 3 Hackathon 2026" — 3 seconds, then dissolve to app
2. **Add a closing card** — "Built with Gemini 3 Pro • Gemini 3 Flash • Nano Banana Pro" — 3 seconds
3. **Speed up loading/waiting** — if any API call takes >5 seconds, speed up that clip to 2x
4. **Add subtle background music** — low-volume, ambient electronic (YouTube Audio Library has free options). REMOVE if it makes voice hard to hear.
5. **Zoom into important UI elements** — when showing product cards, thought trace, bounding boxes

---

## 📝 DEVPOST SUBMISSION TEXT

Copy-paste these into the Devpost fields:

### "What it does" field:
> ZenSpace is an autonomous AI spatial reasoning agent that perceives physical spaces through photos or live camera feeds, identifies design flaws using physics-based logic (lighting, ergonomics, acoustics, spatial flow), generates comprehensive renovation blueprints, recommends specific purchasable products with AI-generated preview images and "Why This Fits" explanations, and transforms detected objects in real-time AR using style presets — all powered by 3 Gemini 3 models across 5 API endpoints.

### "How we built it" field:
> Built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS 4. The backend consists of 5 API routes, each leveraging different Gemini 3 models: Gemini 3 Pro Preview for deep spatial reasoning with visible thought traces, Gemini 3 Flash Preview for real-time conversation/detection/product suggestions, and Nano Banana Pro for photorealistic product image generation. The AR system uses the Canvas API for bounding box rendering and image compositing on the live camera feed. Voice I/O uses the Web Speech API. All endpoints implement intelligent model fallback chains for production reliability. UI built with shadcn/ui (Radix primitives).

### "Challenges we ran into" field:
> API key initialization timing in Next.js (moved client creation inside handlers), bounding box coordinate normalization (server-side clamping), model rate limits during development (implemented 3-model fallback chains), Canvas overlay synchronization with video feed (resize observers), and speech synthesis blocking on long responses (truncation + toggle control).

### "Accomplishments that we're proud of" field:
> 5 distinct API endpoints all powered by Gemini 3, 3 models orchestrated with intelligent fallback, real-time AR overlay with bounding boxes and image compositing, AI product suggestions that reference what the model actually SEES, physics-based spatial reasoning with visible thought traces, voice-first hands-free operation, and a polished UI with glass morphism and custom AR animations.

### "What we learned" field:
> Gemini 3's multimodal vision is remarkably accurate for spatial analysis. Structured JSON output mode (responseMimeType) is essential for agent-style apps. System instructions transform a general model into a domain expert. Model fallback chains are non-negotiable for production. And prompt engineering — our 54-line agent system prompt — IS the application logic.

### "What's next" field:
> VR environment transfer (export rooms to WebXR), multi-room project management, real-time price tracking via Google Shopping API, collaborative mode for sharing analyses, mobile-first AR experience, AR gaming mode (transform rooms into game levels), and AI architect personas (minimalist, eco-friendly, budget-conscious).

### "Built with" field:
> Next.js 16, React 19, TypeScript, Tailwind CSS 4, Gemini 3 Pro Preview, Gemini 3 Flash Preview, Nano Banana Pro Preview, @google/genai SDK, Web Speech API, Canvas API, Radix UI, Lucide React

---

## ⏱️ TIMING SUMMARY

| Scene | Time | Duration | Content |
|-------|------|----------|---------|
| 1. Hook | 0:00-0:12 | 12s | Opening question + landing page |
| 2. Problem | 0:12-0:30 | 18s | Pain points + introduce ZenSpace |
| 3. Upload & Analyze | 0:30-1:10 | 40s | Photo upload → analysis → shopping list |
| 4. AI Reasoning | 1:10-1:20 | 10s | Thought trace transparency |
| 5. Live AR Mode | 1:20-2:15 | 55s | Camera → detect → suggest → transform → voice |
| 6. Technical | 2:15-2:35 | 20s | Architecture + 3 models + fallback |
| 7. Close | 2:35-2:50 | 15s | Value recap + thank you |
| **TOTAL** | | **2:50** | |

---

## 🔑 KEY PHRASES TO SAY (judges listen for these)

Use these exact phrases naturally during the video — they map to judging criteria:

- ✅ "Powered by Gemini 3" (say at least 3 times)
- ✅ "Three Gemini 3 models working together"
- ✅ "Gemini 3 Pro for deep reasoning"
- ✅ "Gemini 3 Flash for real-time"
- ✅ "Nano Banana Pro for image generation"
- ✅ "Five API endpoints"
- ✅ "Not a chatbot wrapper — an autonomous agent"
- ✅ "Physics-based reasoning"
- ✅ "What it actually sees in MY room" (proves multimodal, not just text)
- ✅ "One-click Google Shopping"
- ✅ "Model fallback chains"
- ✅ "Production-grade" or "production-ready"
- ✅ "Built entirely during the contest period"
- ✅ "Built for the Google Gemini 3 Hackathon 2026"

---

## 🚨 COMMON MISTAKES TO AVOID

1. ❌ **Don't start with "Hi, I'm [name]"** — Start with the HOOK. Introduce yourself only if time allows.
2. ❌ **Don't show code** — Judges don't want to see your IDE. Show the WORKING APP.
3. ❌ **Don't read from a script robotically** — Practice enough that you can speak naturally.
4. ❌ **Don't rush** — Better to show 80% of features clearly than 100% in a blur.
5. ❌ **Don't apologize** — Never say "this is still buggy" or "I didn't have time to." Show confidence.
6. ❌ **Don't show errors** — If an API call might fail, pre-test it. If it fails during recording, re-record.
7. ❌ **Don't exceed 3 minutes** — Judges may stop watching. Aim for 2:45-2:55.

---

## ✅ FINAL CHECKLIST BEFORE UPLOADING

- [ ] Video is under 3 minutes
- [ ] Audio is clear (no background noise, voice is loud enough)
- [ ] All features shown: upload analysis, shopping list, live AR, product suggestions, style transform, voice
- [ ] "Gemini 3" mentioned at least 3 times
- [ ] "3 models" and "5 endpoints" mentioned
- [ ] No errors visible in the video
- [ ] Video resolution is at least 1080p
- [ ] Upload to YouTube (unlisted) or Loom
- [ ] Copy video URL for Devpost submission
- [ ] Devpost submission has ALL required fields filled
- [ ] Live URL (Vercel) included in Devpost
- [ ] GitHub repo link included in Devpost

---

**🎬 NOW GO RECORD. YOU GOT THIS. 🚀**
