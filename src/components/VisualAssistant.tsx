
"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
    Mic, MicOff, X, Cpu, Aperture, Wifi, Send,
    ScanLine, Palette, MessageSquare, Loader2,
    Sparkles, Eye, EyeOff, ChevronRight, Box, Zap,
    ShoppingBag, ExternalLink, MapPin, ImageIcon,
    Star, TrendingUp, Lightbulb, Package, ArrowRight,
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
    category: string;
    description: string;
    reason: string;
    placement: string;
    estimated_price: string;
    impact: string;
    image_prompt: string;
    shopping_query: string;
    style_tags: string[];
    generated_image?: string;
}

interface SuggestionResponse {
    room_summary: string;
    mood: string;
    color_palette: string[];
    suggestions: ProductSuggestion[];
}

/* ─────────────────── Constants ─────────────────── */
const STYLE_PRESETS = [
    { id: "zen", label: "Zen", emoji: "🧘", gradient: "from-green-500 to-emerald-600" },
    { id: "cyberpunk", label: "Cyber", emoji: "🌆", gradient: "from-cyan-500 to-blue-600" },
    { id: "professional", label: "Pro", emoji: "💼", gradient: "from-slate-400 to-zinc-600" },
    { id: "fantasy", label: "Fantasy", emoji: "🏰", gradient: "from-purple-500 to-pink-600" },
    { id: "minimalist", label: "Minimal", emoji: "◻️", gradient: "from-neutral-400 to-stone-500" },
    { id: "cozy", label: "Cozy", emoji: "🔥", gradient: "from-orange-500 to-amber-600" },
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
    const [statusMessage, setStatusMessage] = useState("INITIALIZING");
    const [processingTime, setProcessingTime] = useState(0);

    const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
    const [selectedObject, setSelectedObject] = useState<DetectedObject | null>(null);
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
    const [overlayImages, setOverlayImages] = useState<OverlayImage[]>([]);
    const [sceneDescription, setSceneDescription] = useState("");
    const [showSidePanel, setShowSidePanel] = useState(true);
    const [isGeneratingOverlay, setIsGeneratingOverlay] = useState(false);

    // Product suggestions
    const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [roomMood, setRoomMood] = useState("");
    const [colorPalette, setColorPalette] = useState<string[]>([]);
    const [roomSummary, setRoomSummary] = useState("");
    const [sidePanelTab, setSidePanelTab] = useState<SidePanelTab>("objects");
    const [generatingPreviewId, setGeneratingPreviewId] = useState<number | null>(null);

    /* ═══════════════ Welcome Message ═══════════════ */
    useEffect(() => {
        const welcomeMsg: ChatMessage = {
            role: "assistant",
            content: "Welcome to ZenSpace Live! 🚀 I can see your environment through the camera. Try these:\n\n• Click **Scan** to detect objects\n• Click **Suggest** for AI product recommendations\n• Ask me anything about your space\n• Select an object + style to transform it\n\nWhat would you like to do?",
            timestamp: Date.now(),
        };
        setChatHistory([welcomeMsg]);
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
                if (e.error === "no-speech") { setIsListening(false); setStatusMessage("STANDBY"); return; }
                console.error("SR error", e.error);
                setIsListening(false);
                setStatusMessage("AUDIO_ERROR");
                setError(`Speech error: ${e.error}`);
            };
            recognitionRef.current.onend = () => { setIsListening(false); if (!isSpeaking) setStatusMessage("STANDBY"); };
            recognitionRef.current.onstart = () => setStatusMessage("LISTENING...");
        } else {
            setError("Speech recognition not supported — use text input.");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSpeaking]);

    /* ═══════════════ Camera Init ═══════════════ */
    useEffect(() => {
        (async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: false,
                });
                if (videoRef.current) videoRef.current.srcObject = stream;
                setStatusMessage("VISUAL_SENSORS_ONLINE");
            } catch {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
                    if (videoRef.current) videoRef.current.srcObject = stream;
                    setStatusMessage("VISUAL_SENSORS_ONLINE");
                } catch (err) {
                    console.error("Camera error:", err);
                    setError("CAMERA_ACCESS_DENIED");
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

    /* ═══════════════ Overlay Canvas Rendering ═══════════════ */
    useEffect(() => {
        drawOverlay();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [detectedObjects, selectedObject, overlayImages]);

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
        setStatusMessage("VOCALIZING");
        // Clean markdown and limit speech to first 200 chars for speed
        const cleanText = text.replace(/[*#_`\[\]]/g, "").substring(0, 250);
        const u = new SpeechSynthesisUtterance(cleanText);
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.name.includes("Google US English")) || voices[0];
        if (preferred) u.voice = preferred;
        u.rate = 1.05;
        u.onend = () => { setIsSpeaking(false); setStatusMessage("STANDBY"); };
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
            const px = x1 * W;
            const py = y1 * H;
            const pw = (x2 - x1) * W;
            const ph = (y2 - y1) * H;

            const isSelected = selectedObject?.name === obj.name;
            const color = isSelected ? "#a78bfa" : (CATEGORY_COLORS[obj.category] || "#8b5cf6");

            ctx.strokeStyle = color;
            ctx.lineWidth = isSelected ? 3 : 1.5;
            ctx.setLineDash(isSelected ? [] : [6, 3]);
            ctx.strokeRect(px, py, pw, ph);
            ctx.setLineDash([]);

            if (isSelected) {
                const corner = 12;
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 3;
                ctx.beginPath(); ctx.moveTo(px, py + corner); ctx.lineTo(px, py); ctx.lineTo(px + corner, py); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(px + pw - corner, py); ctx.lineTo(px + pw, py); ctx.lineTo(px + pw, py + corner); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(px, py + ph - corner); ctx.lineTo(px, py + ph); ctx.lineTo(px + corner, py + ph); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(px + pw - corner, py + ph); ctx.lineTo(px + pw, py + ph); ctx.lineTo(px + pw, py + ph - corner); ctx.stroke();
            }

            const label = obj.name.toUpperCase();
            ctx.font = "bold 11px monospace";
            const tm = ctx.measureText(label);
            const lw = tm.width + 14;
            const lh = 20;
            ctx.fillStyle = isSelected ? "rgba(139,92,246,0.9)" : "rgba(0,0,0,0.75)";
            ctx.fillRect(px, py - lh - 2, lw, lh);
            ctx.fillStyle = "#fff";
            ctx.fillText(label, px + 7, py - 8);

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(px + lw + 6, py - lh / 2 - 2, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    }, [detectedObjects, selectedObject, overlayImages]);

    /* ═══════════════ Object Detection ═══════════════ */
    const runDetection = useCallback(async () => {
        if (isDetecting) return;
        const frame = captureFrame();
        if (!frame) return;

        setIsDetecting(true);
        setStatusMessage("SCANNING_ENVIRONMENT");
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
                setStatusMessage(`DETECTED ${data.objects.length} OBJECTS`);

                // Auto-add to chat
                const moodText = data.mood ? ` | Mood: **${data.mood}**` : "";
                const detectionMsg: ChatMessage = {
                    role: "assistant",
                    content: `🔍 **Scan Complete** — Found ${data.objects.length} objects: ${data.objects.map((o: DetectedObject) => o.name).join(", ")}.${moodText}\n\n${data.scene || ""}\n\nTap any object to select it, or click **Suggest** for product recommendations!`,
                    timestamp: Date.now(),
                };
                setChatHistory(prev => [...prev, detectionMsg]);
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
        if (!frame) { setError("VISUAL_CAPTURE_FAILED"); return; }

        setIsSuggesting(true);
        setStatusMessage("GENERATING_SUGGESTIONS");
        setSidePanelTab("suggestions");

        const userMsg: ChatMessage = {
            role: "user",
            content: context || "What products would you suggest for this space?",
            timestamp: Date.now(),
        };
        setChatHistory(prev => [...prev, userMsg]);

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

            // Build rich chat message with suggestions
            const suggestionsText = data.suggestions.map((s, i) =>
                `**${i + 1}. ${s.name}** — ${s.estimated_price}\n   _${s.reason}_`
            ).join("\n\n");

            const aiMsg: ChatMessage = {
                role: "assistant",
                content: `🛍️ **Product Suggestions for Your Space**\n\n${data.room_summary || ""}\n\n${suggestionsText}\n\n👉 Check the **Suggestions** panel for details, previews & shopping links!`,
                timestamp: Date.now(),
                suggestions: data.suggestions,
            };
            setChatHistory(prev => [...prev, aiMsg]);
            setStatusMessage(`${data.suggestions.length} PRODUCTS SUGGESTED`);
            speak(`I found ${data.suggestions.length} product suggestions for your space. Check the suggestions panel for details.`);

        } catch (err: any) {
            console.error("Suggest error:", err);
            setError(err.message || "SUGGESTION_FAILED");
            setStatusMessage("ERROR");
        } finally {
            setIsSuggesting(false);
        }
    }, [isSuggesting, captureFrame, speak]);

    /* ═══════════════ Generate Product Preview Image ═══════════════ */
    const generatePreview = async (suggestion: ProductSuggestion) => {
        setGeneratingPreviewId(suggestion.id);
        setStatusMessage(`GENERATING_PREVIEW: ${suggestion.name.toUpperCase()}`);
        try {
            const res = await fetch("/api/image-gen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: suggestion.image_prompt,
                    style: "photorealistic product shot",
                }),
            });
            const data = await res.json();
            if (data.image) {
                setSuggestions(prev => prev.map(s =>
                    s.id === suggestion.id ? { ...s, generated_image: data.image } : s
                ));
                setStatusMessage("PREVIEW_GENERATED");
            } else {
                setStatusMessage("PREVIEW_FAILED");
            }
        } catch (err) {
            console.error("Preview generation error:", err);
            setStatusMessage("PREVIEW_ERROR");
        } finally {
            setGeneratingPreviewId(null);
        }
    };

    /* ═══════════════ Chat Query ═══════════════ */
    const handleQuery = useCallback(async (query: string) => {
        if (!query.trim() || isProcessing) return;
        const start = Date.now();
        const frame = captureFrame();
        if (!frame) { setError("VISUAL_CAPTURE_FAILED"); return; }

        // Check if user wants suggestions
        const suggestKeywords = ["suggest", "recommend", "buy", "purchase", "product", "shop", "what should i add", "what do i need"];
        if (suggestKeywords.some(k => query.toLowerCase().includes(k))) {
            fetchSuggestions(query);
            return;
        }

        const userMsg: ChatMessage = { role: "user", content: query.trim(), timestamp: Date.now() };
        setChatHistory(prev => [...prev, userMsg]);
        setIsProcessing(true);
        setStatusMessage("ANALYZING");

        try {
            const res = await fetch("/api/assist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image: frame,
                    prompt: query.trim(),
                    history: chatHistory.slice(-6),
                    style: selectedStyle,
                }),
            });
            const data = await res.json();
            setProcessingTime(Date.now() - start);

            if (data.error) {
                if (data.error.includes("429") || data.error.includes("quota")) {
                    setStatusMessage("RATE_LIMITED");
                    speak("All systems busy. Please try again in a moment.");
                    return;
                }
                throw new Error(data.error);
            }

            const aiMsg: ChatMessage = { role: "assistant", content: data.response, timestamp: Date.now() };
            setChatHistory(prev => [...prev, aiMsg]);
            if (data.usedModel) setStatusMessage(`VIA ${data.usedModel.toUpperCase()}`);
            speak(data.response);
        } catch (err: any) {
            console.error("AI Error:", err);
            setError(err.message || "NEURAL_NET_ERROR");
            setStatusMessage("ERROR");
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing, captureFrame, chatHistory, selectedStyle, speak, fetchSuggestions]);

    /* ═══════════════ Object Transformation ═══════════════ */
    const handleTransformObject = async (obj: DetectedObject, style: string) => {
        setIsGeneratingOverlay(true);
        setStatusMessage(`TRANSFORMING: ${obj.name.toUpperCase()}`);
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
                setStatusMessage("TRANSFORM_APPLIED");
                speak(`I've applied a ${style} transformation to the ${obj.name}.`);
            } else {
                setStatusMessage("TRANSFORM_FAILED");
            }
        } catch (err) {
            console.error("Transform error:", err);
            setStatusMessage("TRANSFORM_ERROR");
        } finally {
            setIsGeneratingOverlay(false);
        }
    };

    /* ═══════════════ Canvas Click → Select Object ═══════════════ */
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

    /* ═══════════════ Toggle Mic ═══════════════ */
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

    /* ═══════════════ Text Submit ═══════════════ */
    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!textInput.trim()) return;
        handleQuery(textInput.trim());
        setTextInput("");
    };

    /* Auto-scroll chat */
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

    /* ═══════════════════════════════════════════
       ███ RENDER ███
       ═══════════════════════════════════════════ */
    return (
        <div className="fixed inset-0 z-50 flex bg-black/95 backdrop-blur-md overflow-hidden">
            {/* ── Background effects ── */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-900/20 via-black to-black pointer-events-none" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none" />

            {/* ════════════ Main Video Area ════════════ */}
            <div className="flex-1 relative flex flex-col">
                {/* Top HUD */}
                <div className="absolute top-0 left-0 right-0 z-30 h-14 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center px-6">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-violet-400 font-mono text-xs tracking-widest">
                            <Aperture className={cn("h-4 w-4", autoScan && "animate-spin")} />
                            <span>ZENSPACE LIVE</span>
                        </div>
                        <div className="h-px w-16 bg-violet-500/30" />
                        <div className="text-violet-500/50 font-mono text-[10px]">
                            {processingTime > 0 ? `${processingTime}ms` : "---"}
                        </div>
                        {sceneDescription && (
                            <>
                                <div className="h-px w-8 bg-violet-500/20" />
                                <span className="text-violet-400/60 text-[10px] font-mono truncate max-w-[200px]">
                                    {sceneDescription.toUpperCase()}
                                </span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Voice Toggle */}
                        <Button variant="ghost" size="sm" onClick={() => setVoiceEnabled(!voiceEnabled)}
                            className="text-violet-400 hover:text-white hover:bg-violet-500/20 h-8 px-2">
                            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setShowSidePanel(!showSidePanel)}
                            className="text-violet-400 hover:text-white hover:bg-violet-500/20 h-8 px-2">
                            <Eye className="h-4 w-4 mr-1" /> {showSidePanel ? "Hide" : "Show"}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose}
                            className="text-violet-400 hover:text-white hover:bg-violet-500/20 rounded-full">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Video + Overlay */}
                <div ref={videoContainerRef} className="flex-1 relative overflow-hidden">
                    <video ref={videoRef} autoPlay playsInline muted
                        className="w-full h-full object-cover opacity-70" />
                    <canvas ref={overlayRef} onClick={handleCanvasClick}
                        className="absolute inset-0 w-full h-full cursor-crosshair z-10" />
                    <canvas ref={canvasRef} className="hidden" />

                    {autoScan && (
                        <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-violet-400/60 shadow-[0_0_20px_rgba(167,139,250,0.8)] animate-scan-line" />
                        </div>
                    )}

                    {/* Corner brackets */}
                    <div className="absolute inset-0 pointer-events-none z-20">
                        <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-violet-500/40 rounded-tl-lg" />
                        <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-violet-500/40 rounded-tr-lg" />
                        <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-violet-500/40 rounded-bl-lg" />
                        <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-violet-500/40 rounded-br-lg" />
                    </div>

                    {/* Color Palette overlay */}
                    {colorPalette.length > 0 && (
                        <div className="absolute top-20 right-6 z-30 flex flex-col gap-1">
                            {colorPalette.map((c, i) => (
                                <div key={i} className="w-6 h-6 rounded-md border border-white/20 shadow-lg"
                                    style={{ background: c }} title={c} />
                            ))}
                        </div>
                    )}

                    {/* Detection/Suggestion status badge */}
                    {(isDetecting || isSuggesting) && (
                        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30">
                            <Badge className="bg-violet-500/20 border border-violet-500/40 text-violet-300 gap-2 px-4 py-1.5 font-mono text-xs backdrop-blur-md">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                {isDetecting ? "SCANNING ENVIRONMENT..." : "GENERATING SUGGESTIONS..."}
                            </Badge>
                        </div>
                    )}

                    {/* Room Mood Badge */}
                    {roomMood && (
                        <div className="absolute bottom-8 left-6 z-30">
                            <Badge className="bg-black/60 backdrop-blur-md border border-violet-500/20 text-violet-300 gap-2 px-3 py-1.5 text-xs">
                                <Sparkles className="h-3 w-3" /> Mood: {roomMood}
                            </Badge>
                        </div>
                    )}
                </div>

                {/* ── Bottom Panel: Quick Actions + Chat + Input ── */}
                <div className="relative z-30 bg-gradient-to-t from-black via-black/95 to-transparent">
                    {/* Quick Actions Bar */}
                    <div className="px-6 pt-3 flex items-center gap-2 overflow-x-auto scrollbar-thin">
                        <Button size="sm" onClick={runDetection} disabled={isDetecting}
                            className="shrink-0 rounded-full h-8 bg-violet-500/10 border border-violet-500/20 text-violet-300 hover:bg-violet-500/20 text-xs gap-1.5">
                            {isDetecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <ScanLine className="h-3 w-3" />}
                            Scan Objects
                        </Button>
                        <Button size="sm" onClick={() => fetchSuggestions()} disabled={isSuggesting}
                            className="shrink-0 rounded-full h-8 bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 text-xs gap-1.5">
                            {isSuggesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShoppingBag className="h-3 w-3" />}
                            Suggest Products
                        </Button>
                        <Button size="sm" onClick={() => setAutoScan(!autoScan)}
                            className={cn("shrink-0 rounded-full h-8 text-xs gap-1.5",
                                autoScan
                                    ? "bg-green-500/20 border border-green-500/30 text-green-300"
                                    : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
                            )}>
                            <RefreshCw className={cn("h-3 w-3", autoScan && "animate-spin")} />
                            Auto-Scan {autoScan ? "ON" : "OFF"}
                        </Button>
                        <Button size="sm" onClick={() => handleQuery("Analyze this room's lighting and suggest improvements")}
                            disabled={isProcessing}
                            className="shrink-0 rounded-full h-8 bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 text-xs gap-1.5">
                            <Lightbulb className="h-3 w-3" /> Lighting Tips
                        </Button>
                        <Button size="sm" onClick={() => handleQuery("What's the overall vibe of this space and how can I improve it?")}
                            disabled={isProcessing}
                            className="shrink-0 rounded-full h-8 bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 text-xs gap-1.5">
                            <Star className="h-3 w-3" /> Rate My Space
                        </Button>
                    </div>

                    {/* Chat Messages */}
                    <div className="max-h-[180px] overflow-y-auto px-6 pt-3 space-y-2 scrollbar-thin">
                        {chatHistory.map((msg, i) => (
                            <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                                <div className={cn(
                                    "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm",
                                    msg.role === "user"
                                        ? "bg-violet-500/15 border border-violet-500/20 text-violet-100 rounded-tr-none"
                                        : "bg-cyan-500/10 border border-cyan-500/20 text-cyan-50 rounded-tl-none"
                                )}>
                                    {msg.role === "assistant" && (
                                        <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
                                            <Cpu className="inline h-2.5 w-2.5 mr-1" />ZENSPACE AI
                                        </span>
                                    )}
                                    <div className="whitespace-pre-line text-[13px] leading-relaxed">
                                        {msg.content.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
                                            if (part.startsWith("**") && part.endsWith("**")) {
                                                return <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
                                            }
                                            if (part.startsWith("_") && part.endsWith("_")) {
                                                return <em key={j} className="text-zinc-300">{part.slice(1, -1)}</em>;
                                            }
                                            return <span key={j}>{part}</span>;
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(isProcessing || isSuggesting) && (
                            <div className="flex justify-start">
                                <div className="bg-cyan-500/10 border border-cyan-500/20 px-4 py-3 rounded-2xl rounded-tl-none">
                                    <div className="flex gap-1 items-center">
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Bar */}
                    <div className="px-6 py-4 flex items-center gap-3 border-t border-violet-500/10">
                        <form onSubmit={handleTextSubmit} className="flex-1 flex gap-2">
                            <Input
                                value={textInput}
                                onChange={e => setTextInput(e.target.value)}
                                placeholder={selectedObject ? `Ask about ${selectedObject.name}...` : "Ask about your space, suggest products..."}
                                disabled={isProcessing || isSuggesting}
                                className="h-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 rounded-full px-4 focus:ring-violet-500/50 focus:border-violet-500/50"
                            />
                            <Button type="submit" size="sm" disabled={!textInput.trim() || isProcessing || isSuggesting}
                                className="rounded-full h-10 w-10 shrink-0 bg-violet-600 hover:bg-violet-500 text-white">
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>

                        {/* Mic Button */}
                        <Button size="sm" onClick={toggleListening}
                            className={cn(
                                "rounded-full h-12 w-12 shrink-0 border-2 transition-all",
                                isListening
                                    ? "bg-red-500/20 border-red-500 text-red-200 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                                    : "bg-violet-600/20 border-violet-500 text-violet-200 hover:bg-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                            )}>
                            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </Button>
                    </div>

                    {/* Footer Status */}
                    <div className="px-6 pb-3 flex justify-between items-center text-[10px] font-mono text-violet-500/40">
                        <div className="flex items-center gap-2">
                            <span className={cn("h-1.5 w-1.5 rounded-full", autoScan ? "bg-green-500 animate-pulse" : "bg-zinc-600")} />
                            <span>{statusMessage}</span>
                        </div>
                        <div className="flex gap-6">
                            <span>MODEL: GEMINI-3-FLASH</span>
                            <span>OBJECTS: {detectedObjects.length}</span>
                            <span>SUGGESTIONS: {suggestions.length}</span>
                            <span>OVERLAYS: {overlayImages.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ════════════ Side Panel ════════════ */}
            {showSidePanel && (
                <div className="w-[340px] bg-black/90 border-l border-violet-500/10 flex flex-col overflow-hidden backdrop-blur-md">
                    {/* Panel Header + Tabs */}
                    <div className="p-4 border-b border-violet-500/10">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex bg-white/5 rounded-lg p-0.5">
                                <button
                                    onClick={() => setSidePanelTab("objects")}
                                    className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                                        sidePanelTab === "objects"
                                            ? "bg-violet-500/20 text-violet-300"
                                            : "text-zinc-500 hover:text-zinc-300"
                                    )}>
                                    <Eye className="inline h-3 w-3 mr-1" /> Objects ({detectedObjects.length})
                                </button>
                                <button
                                    onClick={() => setSidePanelTab("suggestions")}
                                    className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                                        sidePanelTab === "suggestions"
                                            ? "bg-amber-500/20 text-amber-300"
                                            : "text-zinc-500 hover:text-zinc-300"
                                    )}>
                                    <ShoppingBag className="inline h-3 w-3 mr-1" /> Shop ({suggestions.length})
                                </button>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setShowSidePanel(false)}
                                className="h-6 w-6 p-0 text-zinc-500 hover:text-white">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Context info */}
                        {sidePanelTab === "objects" && sceneDescription && (
                            <p className="text-xs text-zinc-400 leading-relaxed">{sceneDescription}</p>
                        )}
                        {sidePanelTab === "suggestions" && roomSummary && (
                            <p className="text-xs text-zinc-400 leading-relaxed">{roomSummary}</p>
                        )}
                        {sidePanelTab === "objects" && detectedObjects.length === 0 && (
                            <p className="text-xs text-zinc-600 italic mt-2">
                                Click <strong>Scan Objects</strong> to detect items in your space
                            </p>
                        )}
                        {sidePanelTab === "suggestions" && suggestions.length === 0 && (
                            <p className="text-xs text-zinc-600 italic mt-2">
                                Click <strong>Suggest Products</strong> to get AI recommendations
                            </p>
                        )}
                    </div>

                    {/* ── Tab Content ── */}
                    <div className="flex-1 overflow-y-auto scrollbar-thin">
                        {/* OBJECTS TAB */}
                        {sidePanelTab === "objects" && (
                            <div className="p-3 space-y-1.5">
                                {detectedObjects.map((obj, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedObject(selectedObject?.name === obj.name ? null : obj)}
                                        className={cn(
                                            "w-full text-left p-3 rounded-xl transition-all text-sm",
                                            selectedObject?.name === obj.name
                                                ? "bg-violet-500/15 border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                                                : "bg-white/[0.02] border border-white/5 hover:bg-white/5"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="h-2 w-2 rounded-full shrink-0"
                                                style={{ background: CATEGORY_COLORS[obj.category] || "#8b5cf6" }} />
                                            <span className="font-medium text-white truncate">{obj.name}</span>
                                            <Badge className="ml-auto text-[9px] bg-white/5 text-zinc-400 border-0 shrink-0">
                                                {obj.category}
                                            </Badge>
                                        </div>
                                        <p className="text-[11px] text-zinc-500 line-clamp-2 pl-4">{obj.description}</p>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* SUGGESTIONS TAB */}
                        {sidePanelTab === "suggestions" && (
                            <div className="p-3 space-y-3">
                                {suggestions.map((s) => {
                                    const impactCfg = IMPACT_CONFIG[s.impact] || IMPACT_CONFIG.medium;
                                    return (
                                        <div key={s.id}
                                            className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden hover:border-violet-500/20 transition-all">
                                            {/* Product Preview Image */}
                                            {s.generated_image ? (
                                                <div className="relative h-36 bg-zinc-900">
                                                    <img src={s.generated_image} alt={s.name}
                                                        className="w-full h-full object-contain" />
                                                    <Badge className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-violet-300 border-violet-500/20 text-[9px]">
                                                        <Sparkles className="h-2 w-2 mr-1" /> AI Preview
                                                    </Badge>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => generatePreview(s)}
                                                    disabled={generatingPreviewId !== null}
                                                    className="w-full h-28 bg-gradient-to-br from-zinc-900 to-zinc-800 flex flex-col items-center justify-center gap-2 hover:from-violet-950/50 hover:to-zinc-800 transition-all"
                                                >
                                                    {generatingPreviewId === s.id ? (
                                                        <>
                                                            <Loader2 className="h-6 w-6 text-violet-400 animate-spin" />
                                                            <span className="text-[10px] text-violet-400 font-mono">GENERATING...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ImageIcon className="h-6 w-6 text-zinc-600" />
                                                            <span className="text-[10px] text-zinc-500">Click to generate AI preview</span>
                                                        </>
                                                    )}
                                                </button>
                                            )}

                                            {/* Product Info */}
                                            <div className="p-3 space-y-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-white leading-tight">{s.name}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge className={cn("text-[9px] border", impactCfg.bg, impactCfg.color)}>
                                                                <TrendingUp className="h-2 w-2 mr-0.5" /> {impactCfg.label}
                                                            </Badge>
                                                            <span className="text-[10px] text-zinc-500"
                                                                style={{ color: CATEGORY_COLORS[s.category] || "#8b5cf6" }}>
                                                                {s.category}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-bold text-green-400 whitespace-nowrap">{s.estimated_price}</span>
                                                </div>

                                                <p className="text-[11px] text-zinc-400 leading-relaxed">{s.description}</p>

                                                {/* Why this fits */}
                                                <div className="p-2 rounded-lg bg-violet-500/5 border border-violet-500/10">
                                                    <p className="text-[10px] font-bold uppercase text-violet-400/60 mb-0.5 flex items-center gap-1">
                                                        <Star className="h-2.5 w-2.5" /> Why This Fits
                                                    </p>
                                                    <p className="text-[11px] text-zinc-300 leading-relaxed">{s.reason}</p>
                                                </div>

                                                {/* Placement */}
                                                <div className="flex items-start gap-2 text-[11px]">
                                                    <MapPin className="h-3 w-3 text-violet-400 mt-0.5 shrink-0" />
                                                    <span className="text-zinc-400">{s.placement}</span>
                                                </div>

                                                {/* Style Tags */}
                                                {s.style_tags && s.style_tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {s.style_tags.map((tag, ti) => (
                                                            <span key={ti} className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-500">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Shop Button */}
                                                <a
                                                    href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(s.shopping_query)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20"
                                                >
                                                    <ShoppingBag className="h-3.5 w-3.5" />
                                                    Shop on Google
                                                    <ExternalLink className="h-3 w-3 opacity-60" />
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── Style Presets ── */}
                    <div className="p-4 border-t border-violet-500/10">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                            <Palette className="h-3 w-3" /> STYLE TRANSFORM
                        </h4>
                        <div className="grid grid-cols-3 gap-1.5">
                            {STYLE_PRESETS.map(style => (
                                <button
                                    key={style.id}
                                    onClick={() => setSelectedStyle(selectedStyle === style.id ? null : style.id)}
                                    className={cn(
                                        "flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] font-medium transition-all",
                                        selectedStyle === style.id
                                            ? "bg-violet-500/20 border border-violet-500/30 text-white"
                                            : "bg-white/[0.03] border border-white/5 text-zinc-400 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <span className="text-base">{style.emoji}</span>
                                    <span>{style.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Transform Selected Object ── */}
                    {selectedObject && selectedStyle && (
                        <div className="p-4 border-t border-violet-500/10">
                            <Button
                                onClick={() => handleTransformObject(selectedObject, selectedStyle)}
                                disabled={isGeneratingOverlay}
                                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl h-11 shadow-lg shadow-violet-500/20"
                            >
                                {isGeneratingOverlay ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transforming...</>
                                ) : (
                                    <><Sparkles className="mr-2 h-4 w-4" /> Transform {selectedObject.name}</>
                                )}
                            </Button>
                            <p className="text-[10px] text-zinc-600 text-center mt-2">
                                Apply <span className="text-violet-400">{selectedStyle}</span> style via Gemini 3 image generation
                            </p>
                        </div>
                    )}

                    {/* ── Clear Overlays ── */}
                    {overlayImages.length > 0 && (
                        <div className="p-4 border-t border-violet-500/10">
                            <Button variant="ghost" size="sm" onClick={() => setOverlayImages([])}
                                className="w-full text-zinc-400 hover:text-white hover:bg-white/5 text-xs">
                                <EyeOff className="mr-2 h-3 w-3" /> Clear All Overlays ({overlayImages.length})
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* ── Error Modal ── */}
            {error && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-red-950/90 border border-red-500/50 text-red-200 px-8 py-6 rounded-2xl backdrop-blur-xl shadow-2xl flex flex-col items-center gap-4 max-w-sm text-center">
                    <Wifi className="h-8 w-8 text-red-400" />
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider mb-1">System Error</h3>
                        <p className="text-xs opacity-80 font-mono">{error}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setError(null)}
                        className="border-red-500/50 hover:bg-red-500/20 text-red-200 text-xs">
                        Dismiss
                    </Button>
                </div>
            )}
        </div>
    );
}
