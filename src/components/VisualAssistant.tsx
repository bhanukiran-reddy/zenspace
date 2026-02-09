"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
    Mic, MicOff, X, Send, ScanLine, Palette, Loader2,
    Sparkles, Eye, EyeOff, ChevronRight,
    ShoppingBag, ExternalLink, MapPin, ImageIcon,
    Star, TrendingUp, Lightbulb,
    Volume2, VolumeX, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
    image_prompt: string;
    shopping_query: string;
    product_url?: string;
    style_tags: string[];
    generated_image?: string;
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

    const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [roomMood, setRoomMood] = useState("");
    const [colorPalette, setColorPalette] = useState<string[]>([]);
    const [roomSummary, setRoomSummary] = useState("");
    const [groundingSources, setGroundingSources] = useState<GroundingSource[]>([]);
    const [isGrounded, setIsGrounded] = useState(false);
    const [sidePanelTab, setSidePanelTab] = useState<SidePanelTab>("objects");
    const [generatingPreviewId, setGeneratingPreviewId] = useState<number | null>(null);

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
            const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SR();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = "en-US";

            recognitionRef.current.onresult = (e: any) => {
                const text = e.results[0][0].transcript;
                handleQuery(text);
            };
            recognitionRef.current.onerror = (e: any) => {
                if (e.error === "no-speech") { setIsListening(false); setStatusMessage("Ready"); return; }
                setIsListening(false);
                setError(`Speech error: ${e.error}`);
            };
            recognitionRef.current.onend = () => { setIsListening(false); if (!isSpeaking) setStatusMessage("Ready"); };
            recognitionRef.current.onstart = () => setStatusMessage("Listening...");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSpeaking]);

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
            autoScanRef.current = setInterval(() => runDetection(), 6000);
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
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.name.includes("Google US English")) || voices[0];
        if (preferred) u.voice = preferred;
        u.rate = 1.05;
        u.onend = () => { setIsSpeaking(false); setStatusMessage("Ready"); };
        window.speechSynthesis.speak(u);
    }, [voiceEnabled]);

    const drawOverlay = useCallback(() => {
        const canvas = overlayRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const W = canvas.width;
        const H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        overlayImages.forEach(img => {
            const [x1, y1, x2, y2] = img.bbox;
            const image = new Image();
            image.src = img.imageData;
            if (image.complete) {
                ctx.globalAlpha = 0.85;
                ctx.drawImage(image, x1 * W, y1 * H, (x2 - x1) * W, (y2 - y1) * H);
                ctx.globalAlpha = 1;
            }
        });

        detectedObjects.forEach(obj => {
            const [x1, y1, x2, y2] = obj.bbox;
            const px = x1 * W, py = y1 * H, pw = (x2 - x1) * W, ph = (y2 - y1) * H;
            const isSelected = selectedObject?.name === obj.name;
            const color = isSelected ? "#ffffff" : (CATEGORY_COLORS[obj.category] || "#8b5cf6");

            ctx.strokeStyle = color;
            ctx.lineWidth = isSelected ? 2 : 1;
            ctx.setLineDash(isSelected ? [] : [4, 3]);
            ctx.strokeRect(px, py, pw, ph);
            ctx.setLineDash([]);

            if (isSelected) {
                const c = 10;
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 2.5;
                ctx.beginPath(); ctx.moveTo(px, py + c); ctx.lineTo(px, py); ctx.lineTo(px + c, py); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(px + pw - c, py); ctx.lineTo(px + pw, py); ctx.lineTo(px + pw, py + c); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(px, py + ph - c); ctx.lineTo(px, py + ph); ctx.lineTo(px + c, py + ph); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(px + pw - c, py + ph); ctx.lineTo(px + pw, py + ph); ctx.lineTo(px + pw, py + ph - c); ctx.stroke();
            }

            const label = obj.name;
            ctx.font = "500 11px -apple-system, system-ui, sans-serif";
            const tm = ctx.measureText(label);
            const lw = tm.width + 12;
            const lh = 20;
            ctx.fillStyle = isSelected ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.7)";
            const radius = 4;
            const lx = px, ly = py - lh - 4;
            ctx.beginPath();
            ctx.roundRect(lx, ly, lw, lh, radius);
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
                setSceneDescription(data.scene || "");
                if (data.mood) setRoomMood(data.mood);
                if (data.color_palette) setColorPalette(data.color_palette);
                setStatusMessage(`Found ${data.objects.length} objects`);

                const moodText = data.mood ? ` — Mood: ${data.mood}` : "";
                setChatHistory(prev => [...prev, {
                    role: "assistant",
                    content: `Found ${data.objects.length} objects: ${data.objects.map((o: DetectedObject) => o.name).join(", ")}${moodText}. ${data.scene || ""}\n\nTap any object to select it, or click Suggest for product recommendations.`,
                    timestamp: Date.now(),
                }]);
            }
        } catch (err) {
            console.error("Detection error:", err);
        } finally {
            setIsDetecting(false);
        }
    }, [isDetecting, captureFrame]);

    /* ═══════════════ Product Suggestions ═══════════════ */
    const fetchSuggestions = useCallback(async (context?: string) => {
        if (isSuggesting) return;
        const frame = captureFrame();
        if (!frame) return;

        setIsSuggesting(true);
        setStatusMessage("Finding products...");
        setSidePanelTab("suggestions");

        setChatHistory(prev => [...prev, {
            role: "user",
            content: context || "What products would you suggest for this space?",
            timestamp: Date.now(),
        }]);

        try {
            const res = await fetch("/api/suggest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: frame, context }),
            });
            const data: SuggestionResponse & { error?: string } = await res.json();

            if (data.error) throw new Error(data.error);

            setSuggestions(data.suggestions || []);
            setRoomMood(data.mood || "");
            setColorPalette(data.color_palette || []);
            setRoomSummary(data.room_summary || "");
            setGroundingSources(data.sources || []);
            setIsGrounded(data.grounded || false);

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
            setStatusMessage(`${data.suggestions.length} products found`);
            speak(`I found ${data.suggestions.length} product suggestions for your space.`);

        } catch (err: any) {
            console.error("Suggest error:", err);
            setError(err.message || "Suggestion failed");
        } finally {
            setIsSuggesting(false);
        }
    }, [isSuggesting, captureFrame, speak]);

    /* ═══════════════ Generate Preview ═══════════════ */
    const generatePreview = async (suggestion: ProductSuggestion) => {
        setGeneratingPreviewId(suggestion.id);
        try {
            const res = await fetch("/api/image-gen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: suggestion.image_prompt, style: "photorealistic product shot" }),
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

        const suggestKeywords = ["suggest", "recommend", "buy", "purchase", "product", "shop", "what should i add", "what do i need"];
        if (suggestKeywords.some(k => query.toLowerCase().includes(k))) {
            fetchSuggestions(query);
            return;
        }

        setChatHistory(prev => [...prev, { role: "user", content: query.trim(), timestamp: Date.now() }]);
        setIsProcessing(true);
        setStatusMessage("Thinking...");

        try {
            const res = await fetch("/api/assist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image: frame,
                    prompt: query.trim(),
                    history: chatHistory.slice(-12),
                    style: selectedStyle,
                }),
            });
            const data = await res.json();

            if (data.error) {
                if (data.error.includes("429") || data.error.includes("quota")) {
                    setStatusMessage("Rate limited — try again");
                    return;
                }
                throw new Error(data.error);
            }

            setChatHistory(prev => [...prev, { role: "assistant", content: data.response, timestamp: Date.now() }]);
            setStatusMessage("Ready");
            speak(data.response);
        } catch (err: any) {
            console.error("AI Error:", err);
            setError(err.message || "Failed to get response");
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing, captureFrame, chatHistory, selectedStyle, speak, fetchSuggestions]);

    /* ═══════════════ Transform ═══════════════ */
    const handleTransformObject = async (obj: DetectedObject, style: string) => {
        setIsGeneratingOverlay(true);
        setStatusMessage(`Transforming ${obj.name}...`);
        try {
            const res = await fetch("/api/image-gen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: `A ${style} style ${obj.name}. ${obj.description}. Photorealistic, matching indoor room lighting, product shot on transparent background.`,
                    style,
                }),
            });
            const data = await res.json();
            if (data.image) {
                setOverlayImages(prev => [
                    ...prev.filter(i => i.objectName !== obj.name),
                    { objectName: obj.name, imageData: data.image, bbox: obj.bbox }
                ]);
                speak(`Applied ${style} style to the ${obj.name}.`);
            }
        } catch (err) {
            console.error("Transform error:", err);
        } finally {
            setIsGeneratingOverlay(false);
            setStatusMessage("Ready");
        }
    };

    /* ═══════════════ Canvas Click ═══════════════ */
    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = overlayRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width;
        const ny = (e.clientY - rect.top) / rect.height;
        const clicked = detectedObjects.find(obj => {
            const [x1, y1, x2, y2] = obj.bbox;
            return nx >= x1 && nx <= x2 && ny >= y1 && ny <= y2;
        });
        setSelectedObject(clicked || null);
        if (clicked) setSidePanelTab("objects");
    };

    const toggleListening = () => {
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
                    <canvas ref={overlayRef} onClick={handleCanvasClick}
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
                    <div className="px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2">
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
                        <button onClick={toggleListening}
                            className={cn(
                                "h-10 w-10 shrink-0 rounded-full flex items-center justify-center transition-all",
                                isListening
                                    ? "bg-red-500 text-white animate-pulse"
                                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                            )}>
                            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </button>
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
                                {detectedObjects.map((obj, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedObject(selectedObject?.name === obj.name ? null : obj)}
                                        className={cn(
                                            "w-full text-left p-3 rounded-lg transition-colors",
                                            selectedObject?.name === obj.name
                                                ? "bg-zinc-800 border border-zinc-700"
                                                : "hover:bg-zinc-900 border border-transparent"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="h-2 w-2 rounded-full shrink-0"
                                                style={{ background: CATEGORY_COLORS[obj.category] || "#8b5cf6" }} />
                                            <span className="text-sm font-medium text-zinc-200 truncate">{obj.name}</span>
                                            <span className="ml-auto text-[10px] text-zinc-600">{obj.category}</span>
                                        </div>
                                        <p className="text-[11px] text-zinc-500 line-clamp-2 pl-4">{obj.description}</p>
                                    </button>
                                ))}
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
                                    const shopUrl = s.product_url || `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(s.shopping_query)}`;

                                    return (
                                        <div key={s.id} className="rounded-lg border border-zinc-800/60 overflow-hidden">
                                            {s.generated_image ? (
                                                <div className="relative h-32 bg-zinc-900">
                                                    <img src={s.generated_image} alt={s.name} className="w-full h-full object-contain" />
                                                    <span className="absolute top-2 right-2 text-[9px] text-zinc-400 bg-black/60 backdrop-blur px-1.5 py-0.5 rounded">AI</span>
                                                </div>
                                            ) : (
                                                <button onClick={() => generatePreview(s)} disabled={generatingPreviewId !== null}
                                                    className="w-full h-24 bg-zinc-900/50 flex flex-col items-center justify-center gap-1 hover:bg-zinc-800/50 transition-colors">
                                                    {generatingPreviewId === s.id ? (
                                                        <Loader2 className="h-5 w-5 text-zinc-500 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <ImageIcon className="h-4 w-4 text-zinc-700" />
                                                            <span className="text-[10px] text-zinc-600">Generate preview</span>
                                                        </>
                                                    )}
                                                </button>
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

                                                <a href={shopUrl} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-white text-black text-xs font-medium hover:bg-zinc-200 transition-colors">
                                                    {s.product_url ? "View Product" : "Shop on Google"}
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

                    {/* Style presets */}
                    <div className="p-3 border-t border-zinc-800/80">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600 mb-2 flex items-center gap-1.5">
                            <Palette className="h-3 w-3" /> Style
                        </p>
                        <div className="grid grid-cols-3 gap-1">
                            {STYLE_PRESETS.map(style => (
                                <button
                                    key={style.id}
                                    onClick={() => setSelectedStyle(selectedStyle === style.id ? null : style.id)}
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
                    </div>

                    {/* Transform button */}
                    {selectedObject && selectedStyle && (
                        <div className="p-3 border-t border-zinc-800/80">
                            <button
                                onClick={() => handleTransformObject(selectedObject, selectedStyle)}
                                disabled={isGeneratingOverlay}
                                className="w-full h-9 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isGeneratingOverlay ? (
                                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Transforming...</>
                                ) : (
                                    <><Sparkles className="h-3.5 w-3.5" /> Transform {selectedObject.name}</>
                                )}
                            </button>
                            <p className="text-[10px] text-zinc-600 text-center mt-1.5">
                                {selectedStyle} style via Gemini 3
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
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-lg bg-red-950/90 border border-red-500/30 backdrop-blur">
                    <p className="text-xs text-red-300">{error}</p>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200 transition-colors">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
}
