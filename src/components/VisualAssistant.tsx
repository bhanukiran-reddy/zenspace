"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
    Mic, MicOff, X, Send, ScanLine, Palette, Loader2,
    Sparkles, Eye, EyeOff, ChevronRight, ChevronDown,
    ShoppingBag, ExternalLink, MapPin,
    Star, Lightbulb, Trash2,
    Volume2, VolumeX, RefreshCw, Globe
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/* ───────────────────── Types ───────────────────── */
interface DetectedObject {
    name: string;
    bbox: number[];
    description: string;
    category: string;
}

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: number;
    suggestions?: ProductSuggestion[];
}

interface OverlayImage {
    objectName: string;
    imageData: string;
    bbox: number[];
    mode: "instant" | "hd";
}

interface ProductSuggestion {
    id: number;
    name: string;
    brand?: string;
    category: string;
    description: string;
    reason: string;
    placement: string;
    estimated_price: string;
    impact: string;
    image_prompt?: string;
    shopping_query: string;
    product_url?: string;
    style_tags: string[];
    // Image fields — loaded from Google Shopping proxy or AI gen
    fetched_image?: string;      // Real product image from Google Shopping
    generated_image?: string;    // AI fallback
    image_loading?: boolean;     // Loading state
    image_failed?: boolean;      // Fetch failed
}

interface GroundingSource {
    url: string;
    title: string;
}

interface SuggestionResponse {
    room_summary: string;
    mood: string;
    color_palette: string[];
    suggestions: ProductSuggestion[];
    sources?: GroundingSource[];
    grounded?: boolean;
}

/* ─────────────────── Constants ─────────────────── */
const STYLE_PRESETS = [
    { id: "zen", label: "Zen", icon: "🧘" },
    { id: "cyberpunk", label: "Cyber", icon: "🌆" },
    { id: "professional", label: "Pro", icon: "💼" },
    { id: "fantasy", label: "Fantasy", icon: "🏰" },
    { id: "minimalist", label: "Minimal", icon: "◻️" },
    { id: "cozy", label: "Cozy", icon: "🔥" },
];

const CATEGORY_COLORS: Record<string, string> = {
    furniture: "#8b5cf6",
    lighting: "#f59e0b",
    decor: "#ec4899",
    electronics: "#06b6d4",
    storage: "#22c55e",
    textiles: "#f97316",
    plants: "#10b981",
    tech: "#3b82f6",
    other: "#94a3b8",
};

const IMPACT_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    high: { color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", label: "High Impact" },
    medium: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", label: "Medium" },
    low: { color: "text-zinc-400", bg: "bg-zinc-500/10 border-zinc-500/20", label: "Low" },
};

const CATEGORY_ICONS: Record<string, string> = {
    lighting: "💡",
    furniture: "🪑",
    decor: "🎨",
    storage: "📦",
    textiles: "🧵",
    plants: "🌿",
    tech: "💻",
};

/* ── Supported speech languages (BCP 47 tags) ── */
const SPEECH_LANGUAGES = [
    { code: "en-US", label: "English", flag: "🇺🇸" },
    { code: "hi-IN", label: "हिन्दी", flag: "🇮🇳" },
    { code: "te-IN", label: "తెలుగు", flag: "🇮🇳" },
    { code: "ta-IN", label: "தமிழ்", flag: "🇮🇳" },
    { code: "kn-IN", label: "ಕನ್ನಡ", flag: "🇮🇳" },
    { code: "ml-IN", label: "മലയാളം", flag: "🇮🇳" },
    { code: "bn-IN", label: "বাংলা", flag: "🇮🇳" },
    { code: "mr-IN", label: "मराठी", flag: "🇮🇳" },
    { code: "gu-IN", label: "ગુજરાતી", flag: "🇮🇳" },
    { code: "es-ES", label: "Español", flag: "🇪🇸" },
    { code: "fr-FR", label: "Français", flag: "🇫🇷" },
    { code: "de-DE", label: "Deutsch", flag: "🇩🇪" },
    { code: "ja-JP", label: "日本語", flag: "🇯🇵" },
    { code: "ko-KR", label: "한국어", flag: "🇰🇷" },
    { code: "zh-CN", label: "中文", flag: "🇨🇳" },
    { code: "ar-SA", label: "العربية", flag: "🇸🇦" },
    { code: "pt-BR", label: "Português", flag: "🇧🇷" },
    { code: "ru-RU", label: "Русский", flag: "🇷🇺" },
    { code: "it-IT", label: "Italiano", flag: "🇮🇹" },
    { code: "tr-TR", label: "Türkçe", flag: "🇹🇷" },
];

/* ── Canvas-based instant style filters (no API, zero latency) ── */
const STYLE_CANVAS_FILTERS: Record<string, {
    filter: string;
    overlay?: { color: string; opacity: number; blendMode: GlobalCompositeOperation };
}> = {
    zen: {
        filter: "sepia(0.45) saturate(0.75) brightness(1.12) contrast(0.92)",
        overlay: { color: "#d4a574", opacity: 0.18, blendMode: "overlay" },
    },
    cyberpunk: {
        filter: "saturate(1.7) contrast(1.35) brightness(1.05) hue-rotate(180deg)",
        overlay: { color: "#00ffff", opacity: 0.15, blendMode: "screen" },
    },
    professional: {
        filter: "saturate(0.65) contrast(1.18) brightness(1.06)",
        overlay: { color: "#1a3a5c", opacity: 0.10, blendMode: "overlay" },
    },
    fantasy: {
        filter: "saturate(1.5) contrast(1.12) brightness(1.1) hue-rotate(-20deg)",
        overlay: { color: "#8b5cf6", opacity: 0.14, blendMode: "screen" },
    },
    minimalist: {
        filter: "saturate(0.25) contrast(1.12) brightness(1.25)",
        overlay: { color: "#f5f5f5", opacity: 0.12, blendMode: "overlay" },
    },
    cozy: {
        filter: "sepia(0.3) saturate(1.15) brightness(1.08) contrast(0.93)",
        overlay: { color: "#ff8c42", opacity: 0.13, blendMode: "overlay" },
    },
};

type SidePanelTab = "objects" | "suggestions";

/* ═══════════════════ COMPONENT ═══════════════════ */
export default function VisualAssistant({ onClose }: { onClose: () => void }) {
    /* ── Refs ── */
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLCanvasElement>(null);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);
    const autoScanRef = useRef<NodeJS.Timeout | null>(null);

    /* ── State ── */
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [autoScan, setAutoScan] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(true);

    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [textInput, setTextInput] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState("Initializing...");

    const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
    const [selectedObject, setSelectedObject] = useState<DetectedObject | null>(null);
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
    const [overlayImages, setOverlayImages] = useState<OverlayImage[]>([]);
    const [sceneDescription, setSceneDescription] = useState("");
    const [showSidePanel, setShowSidePanel] = useState(false);
    const [isGeneratingOverlay, setIsGeneratingOverlay] = useState(false);
    const [lastFailedTransform, setLastFailedTransform] = useState<{ obj: DetectedObject; style: string } | null>(null);

    const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [roomMood, setRoomMood] = useState("");
    const [colorPalette, setColorPalette] = useState<string[]>([]);
    const [roomSummary, setRoomSummary] = useState("");
    const [groundingSources, setGroundingSources] = useState<GroundingSource[]>([]);
    const [isGrounded, setIsGrounded] = useState(false);
    const [sidePanelTab, setSidePanelTab] = useState<SidePanelTab>("objects");
    const [generatingPreviewId, setGeneratingPreviewId] = useState<number | null>(null);
    const [showStylePicker, setShowStylePicker] = useState(false);
    const [speechLang, setSpeechLang] = useState("en-US");
    const [showLangPicker, setShowLangPicker] = useState(false);

    /* ═══════════════ Welcome ═══════════════ */
    useEffect(() => {
        setChatHistory([{
            role: "assistant",
            content: "Hi! I can see your space through the camera. Ask me anything — or use the buttons below to scan objects and get product suggestions.",
            timestamp: Date.now(),
        }]);
    }, []);

    /* ═══════════════ Speech Recognition ═══════════════ */
    useEffect(() => {
        if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
            // Stop any existing recognition before re-creating
            if (recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch { /* ignore */ }
            }
            const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SR();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            // Use the user-selected language for speech recognition
            recognitionRef.current.lang = speechLang;

            recognitionRef.current.onresult = (e: any) => {
                const text = e.results[0][0].transcript;
                const langLabel = SPEECH_LANGUAGES.find(l => l.code === speechLang)?.label || speechLang;
                setStatusMessage(`Heard (${langLabel}): "${text.slice(0, 40)}${text.length > 40 ? "..." : ""}"`);
                handleQuery(text);
            };
            recognitionRef.current.onerror = (e: any) => {
                if (e.error === "no-speech") { setIsListening(false); setStatusMessage("Ready"); return; }
                setIsListening(false);
                setError(`Speech error: ${e.error}`);
            };
            recognitionRef.current.onend = () => { setIsListening(false); if (!isSpeaking) setStatusMessage("Ready"); };
            recognitionRef.current.onstart = () => {
                const langLabel = SPEECH_LANGUAGES.find(l => l.code === speechLang)?.label || speechLang;
                setStatusMessage(`Listening (${langLabel})...`);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSpeaking, speechLang]);

    /* ═══════════════ Camera ═══════════════ */
    useEffect(() => {
        (async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: false,
                });
                if (videoRef.current) videoRef.current.srcObject = stream;
                setStatusMessage("Camera active");
            } catch {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
                    if (videoRef.current) videoRef.current.srcObject = stream;
                    setStatusMessage("Camera active");
                } catch (err) {
                    console.error("Camera error:", err);
                    setError("Camera access denied");
                }
            }
        })();
        return () => {
            if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    /* ═══════════════ Auto-Scan ═══════════════ */
    useEffect(() => {
        if (autoScan) {
            runDetection();
            autoScanRef.current = setInterval(() => runDetection(), 4000); // 4s for live feel
        } else {
            if (autoScanRef.current) clearInterval(autoScanRef.current);
        }
        return () => { if (autoScanRef.current) clearInterval(autoScanRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoScan]);

    /* ═══════════════ Overlay Canvas ═══════════════ */
    useEffect(() => { drawOverlay(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [detectedObjects, selectedObject, overlayImages]);

    useEffect(() => {
        const resize = () => {
            if (overlayRef.current && videoContainerRef.current) {
                const rect = videoContainerRef.current.getBoundingClientRect();
                overlayRef.current.width = rect.width;
                overlayRef.current.height = rect.height;
                drawOverlay();
            }
        };
        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ═══════════════ Helpers ═══════════════ */
    const captureFrame = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            if (ctx) {
                canvasRef.current.width = videoRef.current.videoWidth || 640;
                canvasRef.current.height = videoRef.current.videoHeight || 480;
                ctx.drawImage(videoRef.current, 0, 0);
                return canvasRef.current.toDataURL("image/jpeg", 0.8);
            }
        }
        return null;
    }, []);

    const speak = useCallback((text: string) => {
        if (!voiceEnabled || !("speechSynthesis" in window)) return;
        window.speechSynthesis.cancel();
        setIsSpeaking(true);
        setStatusMessage("Speaking...");
        const cleanText = text.replace(/[*#_`\[\]]/g, "").substring(0, 250);
        const u = new SpeechSynthesisUtterance(cleanText);
        // Match TTS language to the user's selected speech language
        u.lang = speechLang;
        const voices = window.speechSynthesis.getVoices();
        // Try to find a voice matching the selected language, fall back to any available
        const langPrefix = speechLang.split("-")[0]; // e.g. "hi" from "hi-IN"
        const preferred = voices.find(v => v.lang === speechLang)
            || voices.find(v => v.lang.startsWith(langPrefix))
            || voices.find(v => v.name.includes("Google US English"))
            || voices[0];
        if (preferred) u.voice = preferred;
        u.rate = 1.05;
        u.onend = () => { setIsSpeaking(false); setStatusMessage("Ready"); };
        window.speechSynthesis.speak(u);
    }, [voiceEnabled, speechLang]);

    /* Preloaded overlay images cache */
    const preloadedImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

    /* Preload overlay images when they change */
    useEffect(() => {
        const cache = preloadedImagesRef.current;
        // Load any new images
        overlayImages.forEach(img => {
            if (!cache.has(img.objectName)) {
                const el = new window.Image();
                el.onload = () => drawOverlay();
                el.src = img.imageData;
                cache.set(img.objectName, el);
            }
        });
        // Remove stale entries
        cache.forEach((_, key) => {
            if (!overlayImages.find(i => i.objectName === key)) cache.delete(key);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [overlayImages]);

    const drawOverlay = useCallback(() => {
        const canvas = overlayRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const W = canvas.width;
        const H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        /* Draw preloaded overlay images */
        overlayImages.forEach(img => {
            const [x1, y1, x2, y2] = img.bbox;
            const cached = preloadedImagesRef.current.get(img.objectName);
            if (cached && cached.complete && cached.naturalWidth > 0) {
                ctx.globalAlpha = 0.88;
                ctx.drawImage(cached, x1 * W, y1 * H, (x2 - x1) * W, (y2 - y1) * H);
                ctx.globalAlpha = 1;
            }
        });

        /* Draw bounding boxes for detected objects */
        detectedObjects.forEach(obj => {
            const [x1, y1, x2, y2] = obj.bbox;
            const px = x1 * W, py = y1 * H, pw = (x2 - x1) * W, ph = (y2 - y1) * H;
            const isSelected = selectedObject?.name === obj.name;
            const hasOverlay = overlayImages.some(o => o.objectName === obj.name);
            const color = isSelected ? "#ffffff" : hasOverlay ? "#22c55e" : (CATEGORY_COLORS[obj.category] || "#8b5cf6");

            ctx.strokeStyle = color;
            ctx.lineWidth = isSelected ? 2.5 : hasOverlay ? 1.5 : 1;
            ctx.setLineDash(isSelected ? [] : hasOverlay ? [6, 3] : [4, 3]);
            ctx.strokeRect(px, py, pw, ph);
            ctx.setLineDash([]);

            if (isSelected) {
                const c = 12;
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 2.5;
                ctx.beginPath(); ctx.moveTo(px, py + c); ctx.lineTo(px, py); ctx.lineTo(px + c, py); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(px + pw - c, py); ctx.lineTo(px + pw, py); ctx.lineTo(px + pw, py + c); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(px, py + ph - c); ctx.lineTo(px, py + ph); ctx.lineTo(px + c, py + ph); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(px + pw - c, py + ph); ctx.lineTo(px + pw, py + ph); ctx.lineTo(px + pw, py + ph - c); ctx.stroke();
            }

            /* Label */
            const label = hasOverlay ? `✓ ${obj.name}` : obj.name;
            ctx.font = "500 11px -apple-system, system-ui, sans-serif";
            const tm = ctx.measureText(label);
            const lw = tm.width + 12;
            const lh = 20;
            ctx.fillStyle = isSelected ? "rgba(255,255,255,0.95)" : hasOverlay ? "rgba(34,197,94,0.85)" : "rgba(0,0,0,0.7)";
            const lx = px, ly = py - lh - 4;
            ctx.beginPath();
            ctx.roundRect(lx, ly, lw, lh, 4);
            ctx.fill();
            ctx.fillStyle = isSelected ? "#000" : "#fff";
            ctx.fillText(label, lx + 6, ly + 14);
        });
    }, [detectedObjects, selectedObject, overlayImages]);

    /* ═══════════════ Object Detection ═══════════════ */
    const runDetection = useCallback(async () => {
        if (isDetecting) return;
        const frame = captureFrame();
        if (!frame) return;

        setIsDetecting(true);
        setStatusMessage("Scanning...");
        try {
            const res = await fetch("/api/detect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: frame }),
            });
            const data = await res.json();
            if (data.objects) {
                setDetectedObjects(data.objects);

                // Update overlay bboxes to match new detection positions (live tracking)
                setOverlayImages(prevOverlays => {
                    if (prevOverlays.length === 0) return prevOverlays;
                    let changed = false;
                    const updated = prevOverlays.map(overlay => {
                        const match = data.objects.find((o: DetectedObject) => o.name === overlay.objectName);
                        if (match && JSON.stringify(match.bbox) !== JSON.stringify(overlay.bbox)) {
                            changed = true;
                            return { ...overlay, bbox: match.bbox };
                        }
                        return overlay;
                    });
                    return changed ? updated : prevOverlays;
                });
                setSceneDescription(data.scene || "");
                if (data.mood) setRoomMood(data.mood);
                if (data.color_palette) setColorPalette(data.color_palette);
                setStatusMessage(`Found ${data.objects.length} objects`);

                // Only add chat message on manual scan, not auto-scan
                if (!autoScan) {
                    const moodText = data.mood ? ` — Mood: ${data.mood}` : "";
                    setChatHistory(prev => [...prev, {
                        role: "assistant",
                        content: `Found ${data.objects.length} objects: ${data.objects.map((o: DetectedObject) => o.name).join(", ")}${moodText}. ${data.scene || ""}\n\nTap any object to select it, or click a style to transform it.`,
                        timestamp: Date.now(),
                    }]);
                }
            }
        } catch (err) {
            console.error("Detection error:", err);
        } finally {
            setIsDetecting(false);
        }
    }, [isDetecting, captureFrame, autoScan, overlayImages]);

    /* ═══════════════ Product Suggestions ═══════════════ */
    /* ═══════════════ Detect if response mentions products ═══════════════ */
    const detectProductMention = useCallback((text: string): boolean => {
        const lower = text.toLowerCase();
        // Keywords that indicate product recommendations
        const productKeywords = [
            "product", "buy", "purchase", "shop", "suggest", "recommend", "consider",
            "lamp", "desk", "chair", "table", "sofa", "couch", "shelf", "cabinet",
            "light", "lighting", "fixture", "decor", "furniture", "rug", "curtain",
            "plant", "frame", "mirror", "storage", "organizer", "stand", "holder",
            "amazon", "ikea", "wayfair", "target", "walmart", "home depot",
            "price", "cost", "dollar", "usd", "available", "in stock",
            "brand", "model", "watt", "inch", "cm", "dimension"
        ];
        // Check if any keyword appears
        const hasKeyword = productKeywords.some(kw => lower.includes(kw));
        // Also check for brand names or product-like patterns (e.g., "Philips Hue", "IKEA desk")
        const hasBrandPattern = /\b([A-Z][a-z]+)\s+([A-Z][a-z]+|\w+)\b/.test(text);
        // Check for price mentions
        const hasPrice = /\$\d+|\d+\s*(dollar|usd|rupee|rs)/i.test(text);
        return hasKeyword || (hasBrandPattern && hasPrice) || hasPrice;
    }, []);

    const fetchSuggestions = useCallback(async (context?: string, skipChatMessage = false) => {
        if (isSuggesting) return;
        const frame = captureFrame();
        if (!frame) return;

        setIsSuggesting(true);
        setStatusMessage("Finding products...");
        setSidePanelTab("suggestions");

        // Only add chat message if not auto-triggered (to avoid duplicates)
        if (!skipChatMessage) {
            setChatHistory(prev => [...prev, {
                role: "user",
                content: context || "What products would you suggest for this space?",
                timestamp: Date.now(),
            }]);
        }

        try {
            const res = await fetch("/api/suggest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: frame, context }),
            });
            const data: SuggestionResponse & { error?: string } = await res.json();

            if (data.error) throw new Error(data.error);

            fetchedIdsRef.current.clear(); // Reset image fetch tracking for new suggestions
            setSuggestions(data.suggestions || []);
            setRoomMood(data.mood || "");
            setColorPalette(data.color_palette || []);
            setRoomSummary(data.room_summary || "");
            setGroundingSources(data.sources || []);
            setIsGrounded(data.grounded || false);

            // Only add chat message if not auto-triggered (to avoid duplicate with AI response)
            if (!skipChatMessage) {
                const sugText = data.suggestions.map((s, i) => {
                    const brand = s.brand ? ` by ${s.brand}` : "";
                    return `${i + 1}. **${s.name}**${brand} — ${s.estimated_price}\n   ${s.reason}`;
                }).join("\n\n");

                setChatHistory(prev => [...prev, {
                    role: "assistant",
                    content: `Here are ${data.suggestions.length} product suggestions:\n\n${sugText}\n\nCheck the Suggestions panel for details and shopping links.`,
                    timestamp: Date.now(),
                    suggestions: data.suggestions,
                }]);
                speak(`I found ${data.suggestions.length} product suggestions for your space.`);
            } else {
                // When auto-triggered, just update the status and switch to suggestions tab
                setStatusMessage(`Found ${data.suggestions.length} products — check Suggestions tab`);
            }

        } catch (err: any) {
            console.error("Suggest error:", err);
            setError(err.message || "Suggestion failed");
        } finally {
            setIsSuggesting(false);
        }
    }, [isSuggesting, captureFrame, speak]);

    /* ═══════════════ Fetch Real Product Image from Google Shopping ═══════════════ */
    const fetchProductImage = useCallback(async (suggestion: ProductSuggestion) => {
        if (!suggestion.shopping_query) return;

        // Mark as loading
        setSuggestions(prev => prev.map(s =>
            s.id === suggestion.id ? { ...s, image_loading: true } : s
        ));

        try {
            const res = await fetch(`/api/product-image?q=${encodeURIComponent(suggestion.shopping_query)}`);
            const data = await res.json();

            if (data.image_url) {
                setSuggestions(prev => prev.map(s =>
                    s.id === suggestion.id ? { ...s, fetched_image: data.image_url, image_loading: false } : s
                ));
            } else {
                setSuggestions(prev => prev.map(s =>
                    s.id === suggestion.id ? { ...s, image_loading: false, image_failed: true } : s
                ));
            }
        } catch {
            setSuggestions(prev => prev.map(s =>
                s.id === suggestion.id ? { ...s, image_loading: false, image_failed: true } : s
            ));
        }
    }, []);

    /* Auto-fetch real product images when suggestions arrive */
    const fetchedIdsRef = useRef<Set<number>>(new Set());

    useEffect(() => {
        const unfetched = suggestions.filter(
            s => !s.fetched_image && !s.image_loading && !s.image_failed && !fetchedIdsRef.current.has(s.id)
        );

        if (unfetched.length === 0) return;

        // Fetch images sequentially with small delay to avoid rate limiting
        const fetchAll = async () => {
            for (const s of unfetched) {
                fetchedIdsRef.current.add(s.id);
                await fetchProductImage(s);
                await new Promise(r => setTimeout(r, 300));
            }
        };
        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [suggestions.length, fetchProductImage]);

    /* ═══════════════ Generate AI Preview (fallback) ═══════════════ */
    const generatePreview = async (suggestion: ProductSuggestion) => {
        setGeneratingPreviewId(suggestion.id);
        try {
            const prompt = suggestion.image_prompt || `Photorealistic product photo of ${suggestion.name} by ${suggestion.brand}. ${suggestion.description}. Clean white background, soft studio lighting, product photography style.`;
            const res = await fetch("/api/image-gen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, style: "photorealistic product shot" }),
            });
            const data = await res.json();
            if (data.image) {
                setSuggestions(prev => prev.map(s =>
                    s.id === suggestion.id ? { ...s, generated_image: data.image } : s
                ));
            }
        } catch (err) {
            console.error("Preview error:", err);
        } finally {
            setGeneratingPreviewId(null);
        }
    };

    /* ═══════════════ Chat Query ═══════════════ */
    const handleQuery = useCallback(async (query: string) => {
        if (!query.trim() || isProcessing) return;
        const frame = captureFrame();
        if (!frame) return;

        // Smart routing: explicit shopping commands go to the structured suggest endpoint
        // Everything else (including conversational shopping questions) goes to the AI chat with Google Search
        const lq = query.toLowerCase();
        const isExplicitShopping = (
            lq.startsWith("suggest products") ||
            lq.startsWith("find products") ||
            lq.startsWith("shop for") ||
            lq === "suggest" ||
            lq === "suggestions"
        );

        if (isExplicitShopping) {
            fetchSuggestions(query);
            return;
        }

        setChatHistory(prev => [...prev, { role: "user", content: query.trim(), timestamp: Date.now() }]);
        setIsProcessing(true);
        setStatusMessage("Thinking...");

        try {
            // Build rich context so the AI knows everything about the scene
            const objectContext = detectedObjects.length > 0
                ? `\n[Detected objects in view: ${detectedObjects.map(o => `${o.name} (${o.category})`).join(", ")}]`
                : "";
            const selectedCtx = selectedObject ? `\n[User has selected: ${selectedObject.name} — ${selectedObject.description}]` : "";
            const moodCtx = roomMood ? `\n[Room mood: ${roomMood}]` : "";
            const paletteCtx = colorPalette.length > 0 ? `\n[Room colors: ${colorPalette.join(", ")}]` : "";

            const res = await fetch("/api/assist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image: frame,
                    prompt: query.trim() + objectContext + selectedCtx + moodCtx + paletteCtx,
                    history: chatHistory.slice(-12),
                    style: selectedStyle,
                }),
            });
            const data = await res.json();

            if (data.error) {
                if (data.error.includes("429") || data.error.includes("quota")) {
                    setStatusMessage("Rate limited — try again in a moment");
                    return;
                }
                throw new Error(data.error);
            }

            // Build response message with optional source links
            let responseContent = data.response;
            if (data.sources && data.sources.length > 0) {
                responseContent += `\n\n---\n*Sources: ${data.sources.slice(0, 3).map((s: any) => `[${s.title || "Link"}](${s.url})`).join(" · ")}*`;
            }

            setChatHistory(prev => [...prev, { role: "assistant", content: responseContent, timestamp: Date.now() }]);
            
            // 🎯 AUTO-DETECT PRODUCTS: If Gemini mentions products, auto-populate Suggestions tab
            const originalQuery = query.trim();
            const mentionsProducts = detectProductMention(data.response) || detectProductMention(originalQuery);
            
            if (mentionsProducts && !isExplicitShopping) {
                // Auto-fetch structured product suggestions based on the user's query
                // This ensures ANY product mention gets shown in the Suggestions tab with previews
                setTimeout(() => {
                    fetchSuggestions(originalQuery, true); // skipChatMessage=true to avoid duplicate
                }, 500); // Small delay to let chat message render first
            }
            
            setStatusMessage("Ready");
            speak(data.response); // Speak the clean response without source links
        } catch (err: any) {
            console.error("AI Error:", err);
            setError(err.message || "Failed to get response");
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing, captureFrame, chatHistory, selectedStyle, speak, fetchSuggestions, detectedObjects, selectedObject, roomMood, colorPalette, detectProductMention]);

    /* ═══════════════ INSTANT Canvas Transform (zero latency, no API) ═══════════════ */
    const applyInstantTransform = useCallback((obj: DetectedObject, style: string): string | null => {
        const video = videoRef.current;
        if (!video || video.videoWidth === 0) return null;

        const styleConfig = STYLE_CANVAS_FILTERS[style];
        if (!styleConfig) return null;

        const [x1, y1, x2, y2] = obj.bbox;
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const sx = Math.floor(x1 * vw);
        const sy = Math.floor(y1 * vh);
        const sw = Math.max(1, Math.floor((x2 - x1) * vw));
        const sh = Math.max(1, Math.floor((y2 - y1) * vh));

        // Create offscreen canvas matching the object region
        const offscreen = document.createElement("canvas");
        offscreen.width = sw;
        offscreen.height = sh;
        const ctx = offscreen.getContext("2d");
        if (!ctx) return null;

        // 1. Draw video region with CSS-like filters
        ctx.filter = styleConfig.filter;
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
        ctx.filter = "none";

        // 2. Apply color blend overlay
        if (styleConfig.overlay) {
            ctx.globalCompositeOperation = styleConfig.overlay.blendMode;
            ctx.globalAlpha = styleConfig.overlay.opacity;
            ctx.fillStyle = styleConfig.overlay.color;
            ctx.fillRect(0, 0, sw, sh);
            ctx.globalCompositeOperation = "source-over";
            ctx.globalAlpha = 1;
        }

        // 3. Subtle style-tinted border glow
        ctx.strokeStyle = styleConfig.overlay?.color || "#fff";
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.25;
        ctx.strokeRect(1, 1, sw - 2, sh - 2);
        ctx.globalAlpha = 1;

        return offscreen.toDataURL("image/png", 0.92);
    }, []);

    /* ═══════════════ Transform (Hybrid: instant first, HD optional) ═══════════════ */
    const handleTransformObject = useCallback((obj: DetectedObject, style: string) => {
        setError(null);
        setLastFailedTransform(null);

        setChatHistory(prev => [...prev, {
            role: "user",
            content: `Transform the ${obj.name} to ${style} style`,
            timestamp: Date.now(),
        }]);

        // ── Step 1: Instant canvas-based transform (< 50ms) ──
        const instantData = applyInstantTransform(obj, style);
        if (instantData) {
            setOverlayImages(prev => [
                ...prev.filter(i => i.objectName !== obj.name),
                { objectName: obj.name, imageData: instantData, bbox: obj.bbox, mode: "instant" },
            ]);
            speak(`Applied ${style} style to the ${obj.name}.`);
            setChatHistory(prev => [...prev, {
                role: "assistant",
                content: `Applied **${style}** style to **${obj.name}** ⚡`,
                timestamp: Date.now(),
            }]);
            setStatusMessage(`${style} applied to ${obj.name}`);

            // On mobile, auto-close side panel so user can see the overlay on video
            if (window.innerWidth < 768) {
                setTimeout(() => setShowSidePanel(false), 300);
            }
        } else {
            setError("Could not capture video frame for instant transform.");
            setTimeout(() => setError(null), 5000);
        }
    }, [applyInstantTransform, speak]);

    /* ── HD upgrade: call Gemini API for photorealistic replacement ── */
    const generateHDTransform = async (obj: DetectedObject, style: string) => {
        setIsGeneratingOverlay(true);
        setLastFailedTransform(null);
        setError(null);
        setStatusMessage(`Generating HD ${style} ${obj.name}...`);

        setChatHistory(prev => [...prev, {
            role: "user",
            content: `Generate HD version of ${style} ${obj.name}`,
            timestamp: Date.now(),
        }]);

        try {
            const paletteHint = colorPalette.length > 0 ? ` Room colors: ${colorPalette.join(", ")}.` : "";
            const moodHint = roomMood ? ` Room mood: ${roomMood}.` : "";

            const res = await fetch("/api/image-gen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: `A ${style}-style replacement for a ${obj.name}. ${obj.description}. ${paletteHint}${moodHint} Photorealistic, viewed from a front angle, soft ambient indoor lighting. Clean neutral background for AR overlay. High detail 4K quality.`,
                    style,
                }),
            });
            const data = await res.json();
            if (data.image) {
                setOverlayImages(prev => [
                    ...prev.filter(i => i.objectName !== obj.name),
                    { objectName: obj.name, imageData: data.image, bbox: obj.bbox, mode: "hd" },
                ]);
                setLastFailedTransform(null);
                speak(`HD ${style} version ready for the ${obj.name}.`);
                setChatHistory(prev => [...prev, {
                    role: "assistant",
                    content: `✨ **HD** version applied! The **${obj.name}** now has a photorealistic **${style}** look generated by Gemini.`,
                    timestamp: Date.now(),
                }]);
            } else {
                const rawErr = data.error || "Image generation returned no image";
                const isQuota = rawErr.includes("quota") || rawErr.includes("wait");
                const cleanMsg = isQuota
                    ? rawErr
                    : `HD generation failed for ${obj.name}. The instant preview is still active.`;
                setError(cleanMsg);
                setLastFailedTransform({ obj, style });
                setChatHistory(prev => [...prev, {
                    role: "assistant",
                    content: `⚠️ ${cleanMsg}`,
                    timestamp: Date.now(),
                }]);
                setTimeout(() => setError(prev => prev === cleanMsg ? null : prev), 8000);
            }
        } catch (err: any) {
            console.error("HD transform error:", err);
            const cleanMsg = "HD generation unavailable right now. The instant preview is still active.";
            setError(cleanMsg);
            setLastFailedTransform({ obj, style });
            setChatHistory(prev => [...prev, {
                role: "assistant",
                content: `⚠️ ${cleanMsg}`,
                timestamp: Date.now(),
            }]);
            setTimeout(() => setError(prev => prev === cleanMsg ? null : prev), 8000);
        } finally {
            setIsGeneratingOverlay(false);
            setStatusMessage("Ready");
        }
    };

    /* ═══════════════ Canvas Click / Touch ═══════════════ */
    const handleCanvasInteraction = useCallback((clientX: number, clientY: number) => {
        const canvas = overlayRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const nx = (clientX - rect.left) / rect.width;
        const ny = (clientY - rect.top) / rect.height;
        const clicked = detectedObjects.find(obj => {
            const [x1, y1, x2, y2] = obj.bbox;
            return nx >= x1 && nx <= x2 && ny >= y1 && ny <= y2;
        });
        setSelectedObject(clicked || null);
        if (clicked) {
            setSidePanelTab("objects");
            setShowSidePanel(true); // Auto-open panel when object tapped
        }
    }, [detectedObjects]);

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        handleCanvasInteraction(e.clientX, e.clientY);
    };

    const handleCanvasTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
        e.preventDefault(); // Prevent scroll/zoom
        const touch = e.touches[0];
        if (touch) handleCanvasInteraction(touch.clientX, touch.clientY);
    };

    const toggleListening = () => {
        setShowLangPicker(false); // Close language picker when toggling mic
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            setError(null);
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!textInput.trim()) return;
        setShowLangPicker(false);
        handleQuery(textInput.trim());
        setTextInput("");
    };

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

    /* ═══════════════════════════════════════════
       RENDER
       ═══════════════════════════════════════════ */
    return (
        <div className="fixed inset-0 z-50 flex flex-col md:flex-row bg-[#09090b] overflow-hidden">
            {/* ═══ Main Video + Chat ═══ */}
            <div className="flex-1 relative flex flex-col min-h-0">
                {/* Top bar */}
                <div className="absolute top-0 left-0 right-0 z-30 flex justify-between items-center px-3 sm:px-4 h-12 bg-gradient-to-b from-black/70 to-transparent">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <span className="text-xs font-medium text-white/70 shrink-0">ZenSpace Live</span>
                        <span className="h-1 w-1 rounded-full bg-green-500 shrink-0" />
                        <span className="text-[11px] text-white/40 truncate">{statusMessage}</span>
                        {roomMood && (
                            <span className="text-[11px] text-white/30 ml-1 hidden sm:inline">Mood: {roomMood}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                        <button onClick={() => setVoiceEnabled(!voiceEnabled)}
                            className="p-1.5 sm:p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                        </button>
                        <button onClick={() => setShowSidePanel(!showSidePanel)}
                            className="p-1.5 sm:p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                            <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={onClose}
                            className="p-1.5 sm:p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Video + Overlay */}
                <div ref={videoContainerRef} className="flex-1 relative overflow-hidden bg-black">
                    <video ref={videoRef} autoPlay playsInline muted
                        className="w-full h-full object-cover" />
                    <canvas ref={overlayRef} onClick={handleCanvasClick} onTouchStart={handleCanvasTouch}
                        className="absolute inset-0 w-full h-full cursor-crosshair z-10" />
                    <canvas ref={canvasRef} className="hidden" />

                    {autoScan && (
                        <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
                            <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/40 shadow-[0_0_8px_rgba(255,255,255,0.4)] animate-scan-line" />
                        </div>
                    )}

                    {/* Color palette */}
                    {colorPalette.length > 0 && (
                        <div className="absolute top-16 right-3 z-30 flex flex-col gap-1">
                            {colorPalette.map((c, i) => (
                                <div key={i} className="w-5 h-5 rounded border border-white/20 shadow"
                                    style={{ background: c }} title={c} />
                            ))}
                        </div>
                    )}

                    {(isDetecting || isSuggesting) && (
                        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur border border-white/10 text-xs text-white/70">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                {isDetecting ? "Scanning..." : "Finding products..."}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Bottom: Actions + Chat + Input ── */}
                <div className="relative z-30 bg-[#09090b] border-t border-zinc-800/80 safe-bottom">
                    {/* Quick Actions */}
                    <div className="px-3 sm:px-4 pt-2 sm:pt-3 flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-thin">
                        <button onClick={runDetection} disabled={isDetecting}
                            className="shrink-0 flex items-center gap-1.5 h-7 px-3 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors disabled:opacity-50">
                            {isDetecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <ScanLine className="h-3 w-3" />}
                            Scan
                        </button>
                        <button onClick={() => fetchSuggestions()} disabled={isSuggesting}
                            className="shrink-0 flex items-center gap-1.5 h-7 px-3 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors disabled:opacity-50">
                            {isSuggesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShoppingBag className="h-3 w-3" />}
                            Suggest
                        </button>
                        <button onClick={() => setAutoScan(!autoScan)}
                            className={cn("shrink-0 flex items-center gap-1.5 h-7 px-3 rounded-md text-xs transition-colors",
                                autoScan ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400"
                            )}>
                            <RefreshCw className={cn("h-3 w-3", autoScan && "animate-spin")} />
                            Auto {autoScan ? "On" : "Off"}
                        </button>
                        <button onClick={() => handleQuery("Analyze the lighting in this room.")} disabled={isProcessing}
                            className="shrink-0 flex items-center gap-1.5 h-7 px-3 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 text-xs transition-colors disabled:opacity-50">
                            <Lightbulb className="h-3 w-3" /> Lighting
                        </button>
                        <button onClick={() => handleQuery("Rate this space honestly.")} disabled={isProcessing}
                            className="shrink-0 flex items-center gap-1.5 h-7 px-3 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 text-xs transition-colors disabled:opacity-50">
                            <Star className="h-3 w-3" /> Rate
                        </button>
                    </div>

                    {/* Chat */}
                    <div className="max-h-[120px] sm:max-h-[160px] overflow-y-auto px-3 sm:px-4 pt-2 sm:pt-3 space-y-2 scrollbar-thin">
                        {chatHistory.map((msg, i) => (
                            <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                                <div className={cn(
                                    "max-w-[90%] sm:max-w-[80%] px-3 sm:px-3.5 py-2 rounded-xl text-[12px] sm:text-[13px] leading-relaxed",
                                    msg.role === "user"
                                        ? "bg-white text-black rounded-br-sm"
                                        : "bg-zinc-800/80 text-zinc-200 rounded-bl-sm"
                                )}>
                                    <div className="whitespace-pre-line">
                                        {msg.content.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
                                            if (part.startsWith("**") && part.endsWith("**")) {
                                                return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
                                            }
                                            return <span key={j}>{part}</span>;
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(isProcessing || isSuggesting) && (
                            <div className="flex justify-start">
                                <div className="bg-zinc-800/80 px-4 py-2.5 rounded-xl rounded-bl-sm">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input */}
                    <div className="px-3 sm:px-4 py-2 sm:py-3 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                            <form onSubmit={handleTextSubmit} className="flex-1 flex gap-2">
                                <Input
                                    value={textInput}
                                    onChange={e => setTextInput(e.target.value)}
                                    placeholder={selectedObject ? `Ask about ${selectedObject.name}...` : "Ask anything about your space..."}
                                    disabled={isProcessing || isSuggesting}
                                    className="h-9 bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 rounded-lg text-sm focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600"
                                />
                                <button type="submit" disabled={!textInput.trim() || isProcessing || isSuggesting}
                                    className="h-9 w-9 shrink-0 rounded-lg bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-colors disabled:opacity-30">
                                    <Send className="h-3.5 w-3.5" />
                                </button>
                            </form>
                            {/* Language picker */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowLangPicker(!showLangPicker)}
                                    className={cn(
                                        "h-9 shrink-0 rounded-lg flex items-center gap-1 px-2 transition-all text-xs",
                                        showLangPicker
                                            ? "bg-purple-600 text-white"
                                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                                    )}
                                    title={`Voice language: ${SPEECH_LANGUAGES.find(l => l.code === speechLang)?.label || speechLang}`}
                                >
                                    <Globe className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">{SPEECH_LANGUAGES.find(l => l.code === speechLang)?.flag}</span>
                                </button>
                                {showLangPicker && (
                                    <div className="absolute bottom-full right-0 mb-2 w-48 max-h-64 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 scrollbar-thin">
                                        <div className="p-1.5 border-b border-zinc-800">
                                            <p className="text-[10px] font-medium text-zinc-500 px-2 py-1">🎤 Voice Language</p>
                                        </div>
                                        {SPEECH_LANGUAGES.map(lang => (
                                            <button
                                                key={lang.code}
                                                onClick={() => {
                                                    setSpeechLang(lang.code);
                                                    setShowLangPicker(false);
                                                    setStatusMessage(`Voice: ${lang.label}`);
                                                }}
                                                className={cn(
                                                    "w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition-colors",
                                                    speechLang === lang.code
                                                        ? "bg-purple-600/20 text-purple-300"
                                                        : "text-zinc-300 hover:bg-zinc-800"
                                                )}
                                            >
                                                <span className="text-base">{lang.flag}</span>
                                                <span>{lang.label}</span>
                                                <span className="ml-auto text-[10px] text-zinc-600">{lang.code}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* Mic button */}
                            <button onClick={toggleListening}
                                className={cn(
                                    "h-10 w-10 shrink-0 rounded-full flex items-center justify-center transition-all",
                                    isListening
                                        ? "bg-red-500 text-white animate-pulse"
                                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                                )}
                                title={`Speak in ${SPEECH_LANGUAGES.find(l => l.code === speechLang)?.label || speechLang}`}
                            >
                                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Status bar */}
                    <div className="px-3 sm:px-4 pb-1.5 sm:pb-2 flex justify-between items-center text-[9px] sm:text-[10px] text-zinc-600">
                        <div className="flex items-center gap-1.5">
                            <span className={cn("h-1.5 w-1.5 rounded-full", autoScan ? "bg-green-500" : "bg-zinc-700")} />
                            Gemini 3 Flash
                        </div>
                        <div className="flex gap-2 sm:gap-4">
                            <span>{detectedObjects.length} objects</span>
                            <span>{suggestions.length} products</span>
                            <span className="hidden sm:inline">{overlayImages.length} overlays</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ Mobile side-panel backdrop ═══ */}
            {showSidePanel && (
                <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setShowSidePanel(false)} />
            )}

            {/* ═══ Side Panel ═══ */}
            {showSidePanel && (
                <div className="fixed inset-y-0 right-0 z-50 w-[85vw] max-w-[320px] md:relative md:w-80 md:max-w-none md:z-auto bg-[#09090b] border-l border-zinc-800/80 flex flex-col overflow-hidden shadow-2xl md:shadow-none">
                    {/* Header */}
                    <div className="p-3 border-b border-zinc-800/80">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800/60">
                                <button
                                    onClick={() => setSidePanelTab("objects")}
                                    className={cn("px-3 py-1 rounded-md text-xs font-medium transition-colors",
                                        sidePanelTab === "objects" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                                    )}>
                                    Objects ({detectedObjects.length})
                                </button>
                                <button
                                    onClick={() => setSidePanelTab("suggestions")}
                                    className={cn("px-3 py-1 rounded-md text-xs font-medium transition-colors",
                                        sidePanelTab === "suggestions" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                                    )}>
                                    Products ({suggestions.length})
                                </button>
                            </div>
                            <button onClick={() => setShowSidePanel(false)}
                                className="p-1 text-zinc-600 hover:text-white transition-colors">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>

                        {sidePanelTab === "objects" && sceneDescription && (
                            <p className="text-xs text-zinc-500 leading-relaxed">{sceneDescription}</p>
                        )}
                        {sidePanelTab === "suggestions" && roomSummary && (
                            <p className="text-xs text-zinc-500 leading-relaxed">{roomSummary}</p>
                        )}
                        {sidePanelTab === "objects" && detectedObjects.length === 0 && (
                            <p className="text-xs text-zinc-600 mt-1">Click Scan to detect objects</p>
                        )}
                        {sidePanelTab === "suggestions" && suggestions.length === 0 && (
                            <p className="text-xs text-zinc-600 mt-1">Click Suggest to get product recommendations</p>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto scrollbar-thin">
                        {/* OBJECTS */}
                        {sidePanelTab === "objects" && (
                            <div className="p-2 space-y-1">
                                {detectedObjects.map((obj, i) => {
                                    const isSelected = selectedObject?.name === obj.name;
                                    const hasOverlay = overlayImages.some(o => o.objectName === obj.name);
                                    return (
                                        <div key={i} className={cn(
                                            "rounded-lg transition-colors",
                                            isSelected
                                                ? "bg-zinc-800 border border-zinc-700"
                                                : "hover:bg-zinc-900 border border-transparent"
                                        )}>
                                            <button
                                                onClick={() => setSelectedObject(isSelected ? null : obj)}
                                                className="w-full text-left p-3"
                                            >
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="h-2 w-2 rounded-full shrink-0"
                                                        style={{ background: hasOverlay ? "#22c55e" : (CATEGORY_COLORS[obj.category] || "#8b5cf6") }} />
                                                    <span className="text-sm font-medium text-zinc-200 truncate">
                                                        {hasOverlay && "✓ "}{obj.name}
                                                    </span>
                                                    <span className="ml-auto text-[10px] text-zinc-600">{obj.category}</span>
                                                </div>
                                                <p className="text-[11px] text-zinc-500 line-clamp-2 pl-4">{obj.description}</p>
                                            </button>

                                            {/* Inline transform: style picks + HD upgrade + remove */}
                                            {isSelected && (
                                                <div className="px-3 pb-3 space-y-2">
                                                    {/* Style picker — instant transforms */}
                                                    <div className="flex flex-wrap gap-1">
                                                        {STYLE_PRESETS.map(style => (
                                                            <button
                                                                key={style.id}
                                                                onClick={() => {
                                                                    setSelectedStyle(style.id);
                                                                    handleTransformObject(obj, style.id);
                                                                }}
                                                                className={cn(
                                                                    "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] transition-colors border",
                                                                    selectedStyle === style.id
                                                                        ? "bg-white text-black border-white"
                                                                        : "text-zinc-400 hover:text-zinc-200 border-zinc-700/50 hover:border-zinc-600 bg-zinc-800/50"
                                                                )}
                                                            >
                                                                <span>{style.icon}</span>
                                                                <span>{style.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* Overlay mode badge + HD upgrade button */}
                                                    {hasOverlay && (() => {
                                                        const overlay = overlayImages.find(o => o.objectName === obj.name);
                                                        return (
                                                            <div className="space-y-1.5">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={cn(
                                                                        "text-[9px] px-1.5 py-0.5 rounded font-medium",
                                                                        overlay?.mode === "hd"
                                                                            ? "bg-purple-500/15 text-purple-300 border border-purple-500/20"
                                                                            : "bg-zinc-700/50 text-zinc-400 border border-zinc-600/30"
                                                                    )}>
                                                                        {overlay?.mode === "hd" ? "✨ HD" : "⚡ Instant"}
                                                                    </span>
                                                                    {overlay?.mode === "instant" && selectedStyle && (
                                                                        <button
                                                                            onClick={() => generateHDTransform(obj, selectedStyle)}
                                                                            disabled={isGeneratingOverlay}
                                                                            className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
                                                                        >
                                                                            {isGeneratingOverlay ? (
                                                                                <><Loader2 className="h-3 w-3 animate-spin" /> Generating HD...</>
                                                                            ) : (
                                                                                <><Sparkles className="h-3 w-3" /> Generate HD</>
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    onClick={() => {
                                                                        setOverlayImages(prev => prev.filter(o => o.objectName !== obj.name));
                                                                        preloadedImagesRef.current.delete(obj.name);
                                                                    }}
                                                                    className="flex items-center gap-1.5 text-[10px] text-red-400/70 hover:text-red-400 transition-colors"
                                                                >
                                                                    <Trash2 className="h-3 w-3" /> Remove overlay
                                                                </button>
                                                            </div>
                                                        );
                                                    })()}

                                                    {!hasOverlay && (
                                                        <p className="text-[10px] text-zinc-600 flex items-center gap-1">
                                                            <Palette className="h-3 w-3" /> Pick a style to transform instantly
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* SUGGESTIONS */}
                        {sidePanelTab === "suggestions" && (
                            <div className="p-2 space-y-2">
                                {isGrounded && suggestions.length > 0 && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/5 border border-green-500/10 mx-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                        <span className="text-[10px] text-green-400">Verified via Google Search</span>
                                    </div>
                                )}

                                {suggestions.map((s) => {
                                    const impactCfg = IMPACT_CONFIG[s.impact] || IMPACT_CONFIG.medium;
                                    return (
                                        <div key={s.id} className="rounded-lg border border-zinc-800/60 overflow-hidden">
                                            {/* Product Image: 1) Real from Google Shopping  2) AI-generated  3) Category icon placeholder */}
                                            {(s.fetched_image || s.generated_image) ? (
                                                <div className="relative h-32 bg-zinc-900">
                                                    <img
                                                        src={s.fetched_image || s.generated_image}
                                                        alt={s.name}
                                                        className="w-full h-full object-contain p-2"
                                                        referrerPolicy="no-referrer"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.style.display = "none";
                                                            setSuggestions(prev => prev.map(x =>
                                                                x.id === s.id ? { ...x, fetched_image: undefined, image_failed: true } : x
                                                            ));
                                                        }}
                                                    />
                                                    <span className="absolute top-2 right-2 text-[9px] text-zinc-400 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded">
                                                        {s.fetched_image ? "Product" : "AI"}
                                                    </span>
                                                </div>
                                            ) : s.image_loading ? (
                                                <div className="w-full h-28 bg-zinc-900/50 flex flex-col items-center justify-center gap-2">
                                                    <Loader2 className="h-5 w-5 text-zinc-600 animate-spin" />
                                                    <span className="text-[10px] text-zinc-600">Loading product image…</span>
                                                </div>
                                            ) : (
                                                <div className="w-full bg-zinc-900/30">
                                                    <div className="flex items-center justify-center h-20 gap-3">
                                                        <span className="text-3xl">{CATEGORY_ICONS[s.category] || "📦"}</span>
                                                        <div className="text-left">
                                                            <p className="text-[11px] text-zinc-400 font-medium">{s.brand || "Product"}</p>
                                                            <p className="text-[9px] text-zinc-600">{s.category}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex border-t border-zinc-800/40">
                                                        <button
                                                            onClick={() => fetchProductImage(s)}
                                                            className="flex-1 h-7 flex items-center justify-center gap-1 hover:bg-zinc-800/50 transition-colors border-r border-zinc-800/40"
                                                        >
                                                            <RefreshCw className="h-2.5 w-2.5 text-zinc-600" />
                                                            <span className="text-[9px] text-zinc-600">Retry image</span>
                                                        </button>
                                                        <button
                                                            onClick={() => generatePreview(s)}
                                                            disabled={generatingPreviewId !== null}
                                                            className="flex-1 h-7 flex items-center justify-center gap-1 hover:bg-zinc-800/50 transition-colors"
                                                        >
                                                            {generatingPreviewId === s.id ? (
                                                                <><Loader2 className="h-2.5 w-2.5 text-zinc-500 animate-spin" /><span className="text-[9px] text-zinc-500">Generating…</span></>
                                                            ) : (
                                                                <><Sparkles className="h-2.5 w-2.5 text-zinc-600" /><span className="text-[9px] text-zinc-600">AI preview</span></>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="p-3 space-y-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h4 className="text-sm font-medium text-white leading-tight">{s.name}</h4>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            {s.brand && (
                                                                <span className="text-[10px] text-zinc-500">{s.brand}</span>
                                                            )}
                                                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", impactCfg.bg, impactCfg.color)}>
                                                                {impactCfg.label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-medium text-green-400 whitespace-nowrap">{s.estimated_price}</span>
                                                </div>

                                                <p className="text-[11px] text-zinc-500 leading-relaxed">{s.description}</p>

                                                <div className="p-2 rounded-md bg-zinc-800/30 border border-zinc-800/60">
                                                    <p className="text-[10px] font-medium text-zinc-500 mb-0.5">Why this fits</p>
                                                    <p className="text-[11px] text-zinc-400 leading-relaxed">{s.reason}</p>
                                                </div>

                                                <div className="flex items-start gap-1.5 text-[11px]">
                                                    <MapPin className="h-3 w-3 text-zinc-600 mt-0.5 shrink-0" />
                                                    <span className="text-zinc-500">{s.placement}</span>
                                                </div>

                                                {s.style_tags && s.style_tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {s.style_tags.map((tag, ti) => (
                                                            <span key={ti} className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800/50 text-zinc-600">{tag}</span>
                                                        ))}
                                                    </div>
                                                )}

                                                <a
                                                    href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(s.shopping_query)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-white text-black text-xs font-medium hover:bg-zinc-200 transition-colors"
                                                >
                                                    <ShoppingBag className="h-3 w-3 opacity-60" />
                                                    Shop on Google
                                                    <ExternalLink className="h-3 w-3 opacity-50" />
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })}

                                {groundingSources.length > 0 && (
                                    <div className="mt-2 p-2.5 rounded-lg border border-zinc-800/60">
                                        <p className="text-[10px] font-medium text-zinc-600 mb-1.5">Sources</p>
                                        <div className="space-y-1">
                                            {groundingSources.slice(0, 5).map((src, i) => (
                                                <a key={i} href={src.url} target="_blank" rel="noopener noreferrer"
                                                    className="block text-[10px] text-zinc-500 hover:text-zinc-300 truncate transition-colors">
                                                    {src.title || src.url}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Style presets — collapsible */}
                    <div className="border-t border-zinc-800/80">
                        <button
                            onClick={() => setShowStylePicker(!showStylePicker)}
                            className="w-full p-3 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                            <span className="flex items-center gap-1.5">
                                <Palette className="h-3 w-3" />
                                Style {selectedStyle && <span className="normal-case text-white bg-zinc-700 px-1.5 py-0.5 rounded text-[9px]">{STYLE_PRESETS.find(s => s.id === selectedStyle)?.icon} {selectedStyle}</span>}
                            </span>
                            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showStylePicker && "rotate-180")} />
                        </button>
                        {showStylePicker && (
                            <div className="px-3 pb-3 grid grid-cols-3 gap-1">
                                {STYLE_PRESETS.map(style => (
                                    <button
                                        key={style.id}
                                        onClick={() => {
                                            setSelectedStyle(selectedStyle === style.id ? null : style.id);
                                        }}
                                        className={cn(
                                            "flex flex-col items-center gap-0.5 p-1.5 rounded-md text-[10px] transition-colors",
                                            selectedStyle === style.id
                                                ? "bg-zinc-800 text-white border border-zinc-700"
                                                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 border border-transparent"
                                        )}
                                    >
                                        <span className="text-sm">{style.icon}</span>
                                        <span>{style.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Transform button */}
                    {selectedObject && selectedStyle && (
                        <div className="p-3 border-t border-zinc-800/80 space-y-1.5">
                            <button
                                onClick={() => handleTransformObject(selectedObject, selectedStyle)}
                                className="w-full h-9 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                            >
                                <Sparkles className="h-3.5 w-3.5" /> Transform {selectedObject.name}
                            </button>
                            {overlayImages.find(o => o.objectName === selectedObject.name)?.mode === "instant" && (
                                <button
                                    onClick={() => generateHDTransform(selectedObject, selectedStyle)}
                                    disabled={isGeneratingOverlay}
                                    className="w-full h-8 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-medium hover:bg-purple-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isGeneratingOverlay ? (
                                        <><Loader2 className="h-3 w-3 animate-spin" /> Generating HD...</>
                                    ) : (
                                        <><Sparkles className="h-3 w-3" /> Generate HD via Gemini</>
                                    )}
                                </button>
                            )}
                            <p className="text-[10px] text-zinc-600 text-center">
                                ⚡ Instant preview • ✨ HD via Gemini 3
                            </p>
                        </div>
                    )}

                    {overlayImages.length > 0 && (
                        <div className="p-3 border-t border-zinc-800/80">
                            <button onClick={() => setOverlayImages([])}
                                className="w-full text-xs text-zinc-500 hover:text-zinc-300 py-1.5 flex items-center justify-center gap-1.5 transition-colors">
                                <EyeOff className="h-3 w-3" /> Clear overlays ({overlayImages.length})
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-lg bg-red-950/90 border border-red-500/30 backdrop-blur max-w-[90vw] md:max-w-md">
                    <p className="text-xs text-red-300 flex-1">{error}</p>
                    {lastFailedTransform && !isGeneratingOverlay && (
                        <button
                            onClick={() => {
                                setError(null);
                                handleTransformObject(lastFailedTransform.obj, lastFailedTransform.style);
                            }}
                            className="shrink-0 px-2.5 py-1 text-[10px] font-medium rounded bg-red-500/20 text-red-200 hover:bg-red-500/40 transition-colors"
                        >
                            Retry
                        </button>
                    )}
                    <button onClick={() => { setError(null); setLastFailedTransform(null); }} className="shrink-0 text-red-400 hover:text-red-200 transition-colors">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
}
