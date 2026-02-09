"use client";

import { useState, useRef } from "react";
import {
  Upload,
  ShoppingBag,
  MapPin,
  Wrench,
  ImageIcon,
  Loader2,
  ChevronDown,
  AlertCircle,
  Wand2,
  ArrowRight,
  Video,
  Lightbulb,
  Compass,
  Brain,
  Camera,
  ExternalLink,
  ArrowUpRight,
  Search,
  Layers,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import VisualAssistant from "@/components/VisualAssistant";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface AgentAction {
  action_type: string;
  item_name?: string;
  reason?: string;
  placement_guide?: string;
  nano_banana_prompt?: string;
  shopping_search_query?: string;
  instruction?: string;
  generated_image?: string;
  estimated_impact?: string;
  priority?: string;
}

interface RoomAnalysis {
  vibe_score: string;
  identified_problems: string[];
  room_type?: string;
  lighting_analysis?: string;
  spatial_flow?: string;
}

interface ZenSpaceResponse {
  thought_signature: string;
  room_analysis: RoomAnalysis;
  agent_actions: AgentAction[];
  error?: string;
}

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ZenSpaceResponse | null>(null);
  const [userPrompt, setUserPrompt] = useState("");
  const [generatingImageIndex, setGeneratingImageIndex] = useState<number | null>(null);
  const [showThinking, setShowThinking] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [activeTab, setActiveTab] = useState<"plan" | "shopping">("plan");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerateImage = async (actionIndex: number, prompt: string) => {
    if (!result) return;
    setGeneratingImageIndex(actionIndex);
    try {
      const response = await fetch("/api/image-gen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      if (data.image) {
        const updatedActions = [...result.agent_actions];
        updatedActions[actionIndex] = {
          ...updatedActions[actionIndex],
          generated_image: data.image,
        };
        setResult({ ...result, agent_actions: updatedActions });
      }
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setGeneratingImageIndex(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image,
          userPrompt: userPrompt || "Analyze this space and suggest improvements",
        }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error analyzing space:", error);
    } finally {
      setLoading(false);
    }
  };

  const shoppingItems = result?.agent_actions.filter(a => a.action_type === "ADD_ASSET" && a.shopping_search_query) || [];

  return (
    <div className="flex h-screen overflow-hidden bg-[#09090b] text-zinc-100 selection:bg-white/10">
      {/* ── Mobile sidebar backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r border-zinc-800/80 bg-[#09090b] transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-14 border-b border-zinc-800/80">
          <div className="h-7 w-7 rounded-md bg-white flex items-center justify-center">
            <Layers className="h-4 w-4 text-black" />
          </div>
          <span className="text-sm font-semibold tracking-tight">ZenSpace</span>
          <span className="ml-auto text-[10px] text-zinc-600 font-mono">v1.0</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-zinc-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* Nav items */}
          <p className="px-2 mb-2 text-[10px] font-medium uppercase tracking-widest text-zinc-600">Modes</p>

          <button
            onClick={() => { setShowAssistant(false); setResult(null); setImage(null); setSidebarOpen(false); }}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
              !showAssistant ? "bg-zinc-800/60 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30"
            )}
          >
            <Upload className="h-4 w-4" />
            Upload & Analyze
          </button>

          <button
            onClick={() => { setShowAssistant(true); setSidebarOpen(false); }}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
              showAssistant ? "bg-zinc-800/60 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30"
            )}
          >
            <Camera className="h-4 w-4" />
            Live Assistant
          </button>

          <div className="h-px bg-zinc-800/60 my-4" />

          <p className="px-2 mb-2 text-[10px] font-medium uppercase tracking-widest text-zinc-600">Powered by</p>

          <div className="space-y-0.5 px-2">
            {[
              { label: "Gemini 3 Pro", desc: "Deep spatial reasoning" },
              { label: "Gemini 3 Flash", desc: "Real-time vision & chat" },
              { label: "Nano Banana Pro", desc: "Image generation" },
            ].map((m, i) => (
              <div key={i} className="py-1.5">
                <p className="text-xs text-zinc-300">{m.label}</p>
                <p className="text-[11px] text-zinc-600">{m.desc}</p>
              </div>
            ))}
          </div>

          <div className="h-px bg-zinc-800/60 my-4" />

          <p className="px-2 mb-2 text-[10px] font-medium uppercase tracking-widest text-zinc-600">Capabilities</p>
          <div className="space-y-0.5 px-2 text-[11px] text-zinc-500">
            <p>Spatial analysis & reasoning</p>
            <p>Real-time object detection</p>
            <p>Product search via Google</p>
            <p>AI image generation</p>
            <p>Voice & text conversation</p>
            <p>AR overlay & transforms</p>
            <p>6 style presets</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800/80">
          <p className="text-[10px] text-zinc-700 font-mono">Gemini 3 Hackathon 2026</p>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto bg-[#09090b] relative w-full">
        {/* Mobile header bar */}
        <div className="sticky top-0 z-30 flex items-center gap-3 px-4 h-12 bg-[#09090b]/95 backdrop-blur border-b border-zinc-800/80 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-white flex items-center justify-center">
              <Layers className="h-3.5 w-3.5 text-black" />
            </div>
            <span className="text-sm font-semibold tracking-tight">ZenSpace</span>
          </div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-10">

          {/* ═══ Landing / Upload ═══ */}
          {!result && !loading && !showAssistant && (
            <div className="space-y-6 sm:space-y-8 md:space-y-10 animate-fade-in-up">
              {/* Hero */}
              <div className="space-y-3 max-w-xl">
                <p className="text-[10px] sm:text-xs font-medium text-zinc-500 uppercase tracking-widest">AI Spatial Intelligence</p>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-white leading-[1.15]">
                  Analyze any room.<br />
                  <span className="text-zinc-500">Get a renovation blueprint.</span>
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed max-w-md">
                  Upload a photo of your space. Gemini 3 will analyze lighting, layout, and flow — then suggest real products you can buy, with AI-generated previews.
                </p>
              </div>

              {/* Live mode CTA */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/20 mb-6">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                    <Video className="h-4 w-4 text-zinc-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-300">Live AR Assistant</p>
                    <p className="text-xs text-zinc-600">Camera, voice, object detection, product suggestions, style transforms</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowAssistant(true)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm rounded-lg h-9 px-4 shrink-0 w-full sm:w-auto ml-auto"
                >
                  Open <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Upload */}
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "relative group cursor-pointer rounded-xl transition-all border",
                    image
                      ? "aspect-video border-zinc-800 overflow-hidden"
                      : "min-h-[180px] sm:min-h-[220px] md:min-h-[280px] flex items-center justify-center border-dashed border-zinc-800 hover:border-zinc-600 bg-zinc-900/30"
                  )}
                >
                  {image ? (
                    <>
                      <img src={image} alt="Room" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-sm text-white/80">Click to change</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center space-y-3 p-10">
                      <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-zinc-800/80 border border-zinc-700/50">
                        <Upload className="h-5 w-5 text-zinc-400" />
                      </div>
                      <div>
                        <p className="text-sm text-zinc-300">Drop a room photo here</p>
                        <p className="text-xs text-zinc-600 mt-1">or click to browse</p>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Input
                    type="text"
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    placeholder="Describe your vision (optional)"
                    className="h-10 bg-zinc-900/50 text-zinc-200 placeholder:text-zinc-600 border-zinc-800 rounded-lg focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600"
                  />
                  <Button
                    onClick={handleAnalyze}
                    disabled={!image || loading}
                    className={cn(
                      "h-10 px-5 rounded-lg font-medium text-sm shrink-0 w-full sm:w-auto",
                      !image || loading
                        ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                        : "bg-white text-black hover:bg-zinc-200"
                    )}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>Analyze <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></>
                    )}
                  </Button>
                </div>
              </div>

              {/* Feature cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-4">
                {[
                  { icon: Brain, title: "Spatial Reasoning", desc: "Physics-based analysis of lighting, ergonomics, acoustics, and flow" },
                  { icon: Search, title: "Real Products", desc: "Google Search grounded suggestions from actual retailers with prices" },
                  { icon: Camera, title: "Live AR", desc: "Real-time detection, style transforms, and voice conversation" },
                ].map((f, i) => (
                  <div key={i} className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/20 space-y-2">
                    <f.icon className="h-4 w-4 text-zinc-500" />
                    <p className="text-sm font-medium text-zinc-300">{f.title}</p>
                    <p className="text-xs text-zinc-600 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>


            </div>
          )}

          {/* ═══ Loading ═══ */}
          {loading && !result && (
            <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 animate-fade-in-up">
              <div className="flex items-center gap-3 mb-4 sm:mb-8">
                <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                <span className="text-sm text-zinc-400">Gemini 3 Pro is analyzing your space...</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Skeleton className="h-24 rounded-xl bg-zinc-900/50" />
                <Skeleton className="h-24 rounded-xl bg-zinc-900/50" />
              </div>
              <Skeleton className="h-20 rounded-xl bg-zinc-900/50" />
              <Skeleton className="h-40 rounded-xl bg-zinc-900/50" />
              <Skeleton className="h-40 rounded-xl bg-zinc-900/50" />
            </div>
          )}

          {/* ═══ Results ═══ */}
          {result && !result.error && (
            <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 animate-fade-in-up">
              {/* Header */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => { setResult(null); setImage(null); }}
                  className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  ← New analysis
                </button>
                <div className="flex items-center gap-2 text-xs text-zinc-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Analysis complete
                </div>
              </div>

              {/* Room image */}
              {image && (
                <div className="relative rounded-xl overflow-hidden border border-zinc-800/60">
                  <img src={image} alt="Analyzed Room" className="w-full max-h-[260px] object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 flex gap-2">
                    {result.room_analysis.room_type && (
                      <span className="text-[11px] text-zinc-300 bg-black/60 backdrop-blur px-2.5 py-1 rounded-md border border-zinc-700/50">
                        {result.room_analysis.room_type}
                      </span>
                    )}
                    <span className="text-[11px] text-zinc-400 bg-black/60 backdrop-blur px-2.5 py-1 rounded-md border border-zinc-700/50">
                      Gemini 3 Pro
                    </span>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Vibe", value: result.room_analysis.vibe_score, suffix: "/10", color: "text-white" },
                  { label: "Issues", value: result.room_analysis.identified_problems.length, color: "text-amber-400" },
                  { label: "Actions", value: result.agent_actions.length, color: "text-white" },
                  { label: "Products", value: shoppingItems.length, color: "text-white" },
                ].map((s, i) => (
                  <div key={i} className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/20">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600 mb-1">{s.label}</p>
                    <p className={cn("text-2xl font-semibold", s.color)}>
                      {s.value}<span className="text-sm text-zinc-700">{s.suffix || ""}</span>
                    </p>
                  </div>
                ))}
              </div>

              {/* Lighting & Spatial */}
              {(result.room_analysis.lighting_analysis || result.room_analysis.spatial_flow) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.room_analysis.lighting_analysis && (
                    <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-3.5 w-3.5 text-zinc-500" />
                        <p className="text-xs font-medium text-zinc-400">Lighting</p>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed">{result.room_analysis.lighting_analysis}</p>
                    </div>
                  )}
                  {result.room_analysis.spatial_flow && (
                    <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Compass className="h-3.5 w-3.5 text-zinc-500" />
                        <p className="text-xs font-medium text-zinc-400">Spatial Flow</p>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed">{result.room_analysis.spatial_flow}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Issues */}
              {result.room_analysis.identified_problems.length > 0 && (
                <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/20">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500/70" />
                    <p className="text-xs font-medium text-zinc-400">Issues Found</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.room_analysis.identified_problems.map((problem, i) => (
                      <span key={i} className="text-xs text-zinc-300 bg-zinc-800/60 px-2.5 py-1 rounded-md border border-zinc-700/40">
                        {problem}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-1 bg-zinc-900/50 rounded-lg p-1 border border-zinc-800/60">
                <button
                  onClick={() => setActiveTab("plan")}
                  className={cn("flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5",
                    activeTab === "plan"
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}>
                  <Wand2 className="h-3.5 w-3.5" /> Renovation Plan
                </button>
                <button
                  onClick={() => setActiveTab("shopping")}
                  className={cn("flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5",
                    activeTab === "shopping"
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}>
                  <ShoppingBag className="h-3.5 w-3.5" /> Shopping ({shoppingItems.length})
                </button>
              </div>

              {/* PLAN TAB */}
              {activeTab === "plan" && (
                <div className="space-y-3">
                  {result.agent_actions.map((action, i) => (
                    <div key={i} className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/20 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-lg bg-zinc-800/80 flex items-center justify-center shrink-0 mt-0.5">
                            {action.action_type === "ADD_ASSET" ? (
                              <ShoppingBag className="h-3.5 w-3.5 text-zinc-400" />
                            ) : (
                              <Wrench className="h-3.5 w-3.5 text-zinc-400" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="text-sm font-medium text-white">{action.item_name || "Instruction"}</h4>
                              {action.estimated_impact && (
                                <span className={cn("text-[10px] px-1.5 py-0.5 rounded border",
                                  action.estimated_impact === "high" ? "text-green-400 border-green-500/20 bg-green-500/5" :
                                    action.estimated_impact === "medium" ? "text-amber-400 border-amber-500/20 bg-amber-500/5" :
                                      "text-zinc-500 border-zinc-700/40 bg-zinc-800/30"
                                )}>
                                  {action.estimated_impact}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-500">{action.action_type === "ADD_ASSET" ? "Add Item" : "Note"}</p>
                          </div>
                        </div>
                        {action.shopping_search_query && (
                          <a href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(action.shopping_search_query)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 shrink-0">
                            Shop <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>

                      {action.reason && (
                        <p className="text-sm text-zinc-400 leading-relaxed">{action.reason}</p>
                      )}

                      {action.placement_guide && (
                        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/60">
                          <MapPin className="h-3.5 w-3.5 text-zinc-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] font-medium uppercase text-zinc-600 mb-0.5">Placement</p>
                            <p className="text-xs text-zinc-400">{action.placement_guide}</p>
                          </div>
                        </div>
                      )}

                      {action.instruction && (
                        <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800/60">
                          <p className="text-xs text-zinc-400">{action.instruction}</p>
                          {action.priority && (
                            <span className={cn("inline-block mt-2 text-[10px] px-1.5 py-0.5 rounded border",
                              action.priority === "urgent" ? "text-red-400 border-red-500/20 bg-red-500/5" :
                                action.priority === "recommended" ? "text-amber-400 border-amber-500/20 bg-amber-500/5" :
                                  "text-zinc-500 border-zinc-700/40 bg-zinc-800/30"
                            )}>
                              {action.priority}
                            </span>
                          )}
                        </div>
                      )}

                      {action.action_type === "ADD_ASSET" && action.nano_banana_prompt && (
                        <div>
                          {action.generated_image ? (
                            <div className="relative rounded-lg overflow-hidden bg-zinc-800/30 border border-zinc-800/60">
                              <img src={action.generated_image} alt={action.item_name || "Preview"} className="w-full h-44 object-contain" />
                              <span className="absolute bottom-2 right-2 text-[10px] text-zinc-500 bg-black/60 backdrop-blur px-2 py-0.5 rounded">
                                AI Generated
                              </span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleGenerateImage(i, action.nano_banana_prompt!)}
                              disabled={generatingImageIndex !== null}
                              className="w-full py-2.5 rounded-lg bg-zinc-800/40 hover:bg-zinc-800/70 border border-zinc-800/60 text-sm text-zinc-500 hover:text-zinc-300 transition-colors flex items-center justify-center gap-2"
                            >
                              {generatingImageIndex === i ? (
                                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...</>
                              ) : (
                                <><ImageIcon className="h-3.5 w-3.5" /> Generate Preview</>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* SHOPPING TAB */}
              {activeTab === "shopping" && (
                <div className="space-y-3">
                  {shoppingItems.length === 0 ? (
                    <div className="text-center py-16 text-zinc-600">
                      <ShoppingBag className="h-8 w-8 mx-auto mb-3 opacity-40" />
                      <p className="text-sm">No products in this plan</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {shoppingItems.map((item, i) => {
                        const actionIndex = result.agent_actions.indexOf(item);
                        return (
                          <div key={i} className="rounded-xl border border-zinc-800/60 bg-zinc-900/20 overflow-hidden">
                            {item.generated_image ? (
                              <div className="relative h-36 bg-zinc-900">
                                <img src={item.generated_image} alt={item.item_name || ""} className="w-full h-full object-contain" />
                                <span className="absolute top-2 right-2 text-[9px] text-zinc-500 bg-black/60 backdrop-blur px-2 py-0.5 rounded">
                                  AI Preview
                                </span>
                              </div>
                            ) : (
                              <button
                                onClick={() => item.nano_banana_prompt && handleGenerateImage(actionIndex, item.nano_banana_prompt)}
                                disabled={generatingImageIndex !== null}
                                className="w-full h-28 bg-zinc-900/50 flex flex-col items-center justify-center gap-1.5 hover:bg-zinc-800/50 transition-colors"
                              >
                                {generatingImageIndex === actionIndex ? (
                                  <Loader2 className="h-5 w-5 text-zinc-500 animate-spin" />
                                ) : (
                                  <>
                                    <ImageIcon className="h-5 w-5 text-zinc-700" />
                                    <span className="text-[10px] text-zinc-600">Generate preview</span>
                                  </>
                                )}
                              </button>
                            )}

                            <div className="p-3.5 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-sm font-medium text-white leading-tight">{item.item_name}</h4>
                                {item.estimated_impact && (
                                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded border shrink-0",
                                    item.estimated_impact === "high" ? "text-green-400 border-green-500/20 bg-green-500/5" :
                                      item.estimated_impact === "medium" ? "text-amber-400 border-amber-500/20 bg-amber-500/5" :
                                        "text-zinc-500 border-zinc-700/40"
                                  )}>
                                    {item.estimated_impact}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-500 line-clamp-2">{item.reason}</p>

                              {item.placement_guide && (
                                <div className="flex items-start gap-1.5 text-[11px]">
                                  <MapPin className="h-3 w-3 text-zinc-600 mt-0.5 shrink-0" />
                                  <span className="text-zinc-600">{item.placement_guide}</span>
                                </div>
                              )}

                              <a
                                href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(item.shopping_search_query || item.item_name || "")}`}
                                target="_blank" rel="noopener noreferrer"
                                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-white text-black text-xs font-medium hover:bg-zinc-200 transition-colors"
                              >
                                Shop on Google <ExternalLink className="h-3 w-3 opacity-50" />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Thought Trace */}
              <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/20">
                <button
                  onClick={() => setShowThinking(!showThinking)}
                  className="w-full flex items-center justify-between p-4 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Brain className="h-3.5 w-3.5" /> AI Reasoning
                  </span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", showThinking && "rotate-180")} />
                </button>
                {showThinking && (
                  <div className="px-4 pb-4">
                    <pre className="text-xs text-zinc-500 font-mono whitespace-pre-wrap leading-relaxed p-3 rounded-lg bg-black/30 border border-zinc-800/40">
                      {result.thought_signature}
                    </pre>
                  </div>
                )}
              </div>

              {/* Live mode CTA */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/20">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Video className="h-5 w-5 text-zinc-600 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-zinc-300">Try the Live AR Assistant</p>
                    <p className="text-xs text-zinc-600">Detect objects, get product suggestions, transform styles in real-time</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowAssistant(true)}
                  className="bg-white text-black hover:bg-zinc-200 text-sm rounded-lg h-9 px-4 shrink-0 font-medium w-full sm:w-auto"
                >
                  Open
                </Button>
              </div>
            </div>
          )}

          {/* Error */}
          {result?.error && (
            <div className="max-w-md mx-auto text-center space-y-4 py-20">
              <AlertCircle className="h-8 w-8 text-red-500/60 mx-auto" />
              <p className="text-sm text-zinc-400">{result.error}</p>
              <Button onClick={() => setResult(null)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm rounded-lg">
                Try Again
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Live Assistant Overlay */}
      {showAssistant && (
        <VisualAssistant onClose={() => setShowAssistant(false)} />
      )}
    </div>
  );
}
