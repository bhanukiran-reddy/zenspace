
"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Mic, MicOff, X, Activity, Cpu, Eye, Aperture, Wifi, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function VisualAssistant({ onClose }: { onClose: () => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [aiResponse, setAiResponse] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState("SYSTEM_READY");
    const [processingTime, setProcessingTime] = useState(0);

    // Initialize Speech Recognition
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
            const SpeechRecognition =
                (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = "en-US";

            recognitionRef.current.onresult = (event: any) => {
                const text = event.results[0][0].transcript;
                setTranscript(text);
                handleUserQuery(text);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
                setStatusMessage("AUDIO_INPUT_ERROR");
                setError("Speech recognition failed.");
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
                if (!isSpeaking) setStatusMessage("STANDBY");
            };

            recognitionRef.current.onstart = () => {
                setStatusMessage("LISTENING...");
            };
        } else {
            setError("Speech recognition not supported.");
        }
    }, [isSpeaking]);

    // Initialize Camera
    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "user" },
                    audio: false,
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setStatusMessage("VISUAL_SENSORS_ONLINE");
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError("CAMERA_ACCESS_DENIED");
            }
        };

        startCamera();

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    const speak = (text: string) => {
        if ("speechSynthesis" in window) {
            setIsSpeaking(true);
            setStatusMessage("VOCALIZING_RESPONSE");
            const utterance = new SpeechSynthesisUtterance(text);

            // Get available voices and try to pick a more robotic/premium one if available
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.name.includes("Google US English")) || voices[0];
            if (preferredVoice) utterance.voice = preferredVoice;

            utterance.onend = () => {
                setIsSpeaking(false);
                setStatusMessage("STANDBY");
            };
            window.speechSynthesis.speak(utterance);
        }
    };

    const captureFrame = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext("2d");
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                return canvasRef.current.toDataURL("image/jpeg");
            }
        }
        return null;
    }, []);

    const handleUserQuery = async (query: string) => {
        const start = Date.now();
        const image = captureFrame();
        if (!image) {
            setError("VISUAL_CAPTURE_FAILED");
            return;
        }

        try {
            setAiResponse("");
            setStatusMessage("ANALYZING_VISUAL_DATA");

            const response = await fetch("/api/assist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image, prompt: query }),
            });

            const data = await response.json();
            setProcessingTime(Date.now() - start);

            if (data.error) {
                if (data.error.includes("429") || data.error.includes("quota")) {
                    setError("ALL_MODELS_BUSY_RETRYING");
                    setStatusMessage("RATE_LIMITED");
                    speak("All systems busy. Retrying connection.");
                    return;
                }
                throw new Error(data.error);
            }

            setAiResponse(data.response);
            if (data.usedModel) {
                setStatusMessage(`CONNECTED: ${data.usedModel.toUpperCase()}`);
            }
            speak(data.response);
        } catch (err: any) {
            console.error("AI Error:", err);
            const errorMessage = err.message || "Failed to get AI response";
            if (errorMessage.includes("429") || errorMessage.includes("quota")) {
                setError("SYSTEM_OVERLOAD");
                setStatusMessage("RATE_LIMITED");
            } else {
                setError("NEURAL_NET_CONNECTION_LOST");
                setStatusMessage("SYSTEM_ERROR");
            }
            setAiResponse("");
        }
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            setError(null);
            setTranscript("");
            setAiResponse("");
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-0 sm:p-4 overflow-hidden">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-900/20 via-black to-black pointer-events-none" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none" />

            <div className="relative w-full h-full max-w-6xl max-h-[90vh] flex flex-col sm:rounded-3xl overflow-hidden border border-violet-500/20 shadow-[0_0_100px_-20px_rgba(139,92,246,0.2)] bg-black">

                {/* HUD Overlay Container */}
                <div className="absolute inset-0 pointer-events-none z-20">
                    {/* Top Bar */}
                    <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-violet-400 font-mono text-xs tracking-widest">
                                <Aperture className="h-4 w-4 animate-spin-slow" />
                                <span>SYSTEM_ONLINE</span>
                            </div>
                            <div className="h-px w-24 bg-violet-500/30" />
                            <div className="text-violet-500/50 font-mono text-[10px]">
                                LATENCY: {processingTime > 0 ? `${processingTime}ms` : "---"}
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="pointer-events-auto text-violet-400 hover:text-white hover:bg-violet-500/20 rounded-full"
                        >
                            <X className="h-6 w-6" />
                        </Button>
                    </div>

                    {/* Corner Brackets */}
                    <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-violet-500/50 rounded-tl-lg" />
                    <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-violet-500/50 rounded-tr-lg" />
                    <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-violet-500/50 rounded-bl-lg" />
                    <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-violet-500/50 rounded-br-lg" />

                    {/* Center Reticle */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                        <div className="w-[400px] h-[400px] border border-violet-500/10 rounded-full flex items-center justify-center">
                            <div className="w-[300px] h-[300px] border border-violet-500/20 rounded-full flex items-center justify-center animate-hud-spin">
                                <div className="absolute top-0 w-1 h-2 bg-violet-500/50" />
                                <div className="absolute bottom-0 w-1 h-2 bg-violet-500/50" />
                                <div className="absolute left-0 w-2 h-1 bg-violet-500/50" />
                                <div className="absolute right-0 w-2 h-1 bg-violet-500/50" />
                            </div>
                        </div>
                    </div>

                    {/* Scanning Line */}
                    <div className="absolute inset-0 overflow-hidden opacity-20">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-violet-400/50 shadow-[0_0_20px_rgba(167,139,250,0.8)] animate-scan-line" />
                    </div>

                    {/* Bottom Status Panel */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent p-8 flex flex-col gap-4">

                        {/* Live Transcript / Response */}
                        <div className="min-h-[100px] flex flex-col justify-end space-y-4 max-w-3xl mx-auto w-full mb-8">
                            {transcript && (
                                <div className="self-end max-w-[80%]">
                                    <p className="text-right text-sm text-violet-300 mb-1 font-mono uppercase tracking-wider">User Input</p>
                                    <div className="bg-violet-500/10 border border-violet-500/20 p-4 rounded-2xl rounded-tr-none backdrop-blur-md">
                                        <p className="text-lg text-white font-light">{transcript}</p>
                                    </div>
                                </div>
                            )}
                            {aiResponse ? (
                                <div className="self-start max-w-[80%]">
                                    <p className="text-left text-sm text-cyan-300 mb-1 font-mono uppercase tracking-wider flex items-center gap-2">
                                        <Cpu className="h-3 w-3" /> AI Analysis
                                    </p>
                                    <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-2xl rounded-tl-none backdrop-blur-md">
                                        <div className="text-lg text-cyan-50 font-light typing-effect">
                                            {aiResponse}
                                        </div>
                                    </div>
                                </div>
                            ) : isSpeaking ? (
                                <div className="self-start flex gap-1 items-end h-8">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className={`w-1 bg-cyan-400 animate-waveform`} style={{ animationDelay: `${i * 0.1}s` }} />
                                    ))}
                                </div>
                            ) : null}
                        </div>

                        {/* Footer Info */}
                        <div className="flex justify-between items-end border-t border-violet-500/20 pt-4">

                            {/* Left: Status */}
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-mono text-violet-500/60 uppercase">System Status</span>
                                <span className="text-xl font-mono text-violet-400 tracking-tight flex items-center gap-2">
                                    {statusMessage === "LISTENING..." && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
                                    {statusMessage}
                                </span>
                            </div>

                            {/* Center: Interactive Trigger */}
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto">
                                <Button
                                    size="lg"
                                    onClick={toggleListening}
                                    className={cn(
                                        "h-20 w-20 rounded-full border-4 shadow-[0_0_40px_-10px_rgba(139,92,246,0.5)] transition-all duration-300",
                                        isListening
                                            ? "bg-red-500/20 border-red-500 text-red-100 hover:bg-red-500/40 hover:scale-110 animate-pulse"
                                            : "bg-violet-600/20 border-violet-500 text-violet-100 hover:bg-violet-500/40 hover:scale-110 hover:shadow-[0_0_60px_-10px_rgba(139,92,246,0.6)]"
                                    )}
                                >
                                    {isListening ? (
                                        <div className="flex flex-col items-center">
                                            <MicOff className="h-8 w-8" />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <Mic className="h-8 w-8" />
                                        </div>
                                    )}
                                </Button>
                            </div>

                            {/* Right: Technical Data */}
                            <div className="flex gap-8 text-[10px] font-mono text-violet-500/40 text-right">
                                <div>
                                    <div className="uppercase mb-0.5">Model</div>
                                    <div className="text-violet-400">GEMINI-2.0-FLASH</div>
                                </div>
                                <div>
                                    <div className="uppercase mb-0.5">Video</div>
                                    <div className="text-violet-400">1080p HD</div>
                                </div>
                                <div>
                                    <div className="uppercase mb-0.5">Sensors</div>
                                    <div className="text-violet-400">ACTIVE</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Real Video Feed (Background Layer of the HUD) */}
                <div className="absolute inset-0 z-0">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1] opacity-60 mix-blend-screen"
                    />
                    <div className="absolute inset-0 bg-violet-900/10 mix-blend-overlay" />
                    <canvas ref={canvasRef} className="hidden" />
                </div>

                {error && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-red-950/90 border border-red-500 text-red-200 px-8 py-6 rounded-lg backdrop-blur-xl shadow-2xl flex flex-col items-center gap-4 max-w-md text-center">
                        <Wifi className="h-10 w-10 text-red-500" />
                        <div>
                            <h3 className="text-lg font-bold uppercase tracking-wider mb-1">Connection Error</h3>
                            <p className="text-sm opacity-80 font-mono">{error}</p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setError(null)}
                            className="border-red-500/50 hover:bg-red-500/20 text-red-200"
                        >
                            Dismiss
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
