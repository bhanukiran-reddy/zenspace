"use client";

import { useState, useRef } from "react";
import {
  Upload,
  Sparkles,
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
  Zap,
  Star,
  TrendingUp,
  Eye,
  Layers,
  Palette,
  Brain,
  Mic,
  Camera,
  Box,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import VisualAssistant from "@/components/VisualAssistant";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
      } else if (data.error) {
        console.error("Image generation failed:", data.error);
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

  // Get shopping items from actions
  const shoppingItems = result?.agent_actions.filter(a => a.action_type === "ADD_ASSET" && a.shopping_search_query) || [];

  return (
    <div className="flex h-screen overflow-hidden bg-black text-white selection:bg-violet-500/30">
      {/* Sidebar */}
      <aside className="w-72 flex flex-col bg-zinc-950 border-r border-white/5 shadow-xl z-20">
        {/* Sidebar Header */}
        <div className="flex items-center gap-3 p-6 border-b border-white/5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              ZenSpace
            </h1>
            <p className="text-[10px] text-zinc-500 font-mono tracking-widest">
              SPATIAL REALITY ARCHITECT
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="flex-1 p-5 space-y-6 overflow-y-auto">
          {/* Gemini 3 Badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20">
            <Zap className="h-4 w-4 text-violet-400" />
            <span className="text-xs font-mono text-violet-300 tracking-wider">POWERED BY GEMINI 3</span>
          </div>

          {/* Capabilities */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Capabilities</p>
            {[
              { icon: Brain, label: "Deep Spatial Reasoning", desc: "Physics-based room analysis" },
              { icon: Lightbulb, label: "Lighting Optimization", desc: "Glare, shadow & ambiance" },
              { icon: Wand2, label: "AI Renovation Plan", desc: "Furniture & layout suggestions" },
              { icon: ImageIcon, label: "Product Previews", desc: "AI-generated item images" },
              { icon: ShoppingBag, label: "Smart Shopping", desc: "Curated product recommendations" },
              { icon: Camera, label: "Live AR Mode", desc: "Real-time object detection" },
              { icon: Mic, label: "Voice Assistant", desc: "Speak to analyze your space" },
              { icon: Palette, label: "Style Transform", desc: "6 design presets available" },
            ].map((cap, i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                <cap.icon className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-zinc-200 font-medium">{cap.label}</p>
                  <p className="text-[11px] text-zinc-500">{cap.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Live Assistant CTA */}
          <div className="pt-4 border-t border-white/5">
            <button
              onClick={() => setShowAssistant(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.02] hover:shadow-violet-500/30"
            >
              <div className="relative">
                <Video className="h-5 w-5 relative z-10" />
                <div className="absolute inset-0 bg-white/20 blur-lg animate-pulse" />
              </div>
              <div className="text-left">
                <span className="block">Live AR Assistant</span>
                <span className="block text-[10px] font-normal text-violet-200/60">
                  Camera • Voice • Products • Transform
                </span>
              </div>
            </button>
          </div>

          {/* How It Works */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">How It Works</p>
            {[
              { step: "01", text: "Upload a room photo" },
              { step: "02", text: "Describe your vision (optional)" },
              { step: "03", text: "AI generates renovation blueprint" },
              { step: "04", text: "Preview AI-generated products" },
              { step: "05", text: "Shop suggested items directly" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className="font-mono text-violet-500/50">{s.step}</span>
                <span className="text-zinc-400">{s.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/5">
          <p className="text-[10px] text-zinc-600 text-center font-mono">
            ZENSPACE v1.0 • GEMINI 3 HACKATHON 2026
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-black relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-black to-black pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-8 py-10">
          {!result && !loading && (
            <div className="space-y-10 animate-fade-in-up">
              {/* Hero */}
              <div className="text-center space-y-4 max-w-2xl mx-auto mb-8">
                <Badge className="bg-violet-500/10 border border-violet-500/20 text-violet-300 font-mono text-xs px-3 py-1">
                  <Star className="h-3 w-3 mr-1.5" /> GEMINI 3 POWERED
                </Badge>
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white">
                  Transform{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                    Your Space
                  </span>
                </h1>
                <p className="text-base text-zinc-400 leading-relaxed font-light max-w-lg mx-auto">
                  Upload a room photo and let our autonomous AI architect generate a complete renovation
                  blueprint — with product suggestions, preview images, and direct shopping links.
                </p>
              </div>

              {/* Upload Area */}
              <div className="max-w-3xl mx-auto space-y-6">
                <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm shadow-2xl rounded-3xl overflow-hidden">
                  <CardContent className="p-2">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "relative group cursor-pointer rounded-2xl transition-all duration-500 border-2 border-dashed",
                        image
                          ? "aspect-video border-transparent"
                          : "min-h-[350px] flex items-center justify-center border-white/10 hover:border-violet-500/50 hover:bg-violet-500/5"
                      )}
                    >
                      {image ? (
                        <>
                          <img src={image} alt="Room" className="w-full h-full object-cover rounded-xl" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button className="bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 text-white rounded-full px-6">
                              <Upload className="mr-2 h-4 w-4" />
                              Change Photo
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-12 space-y-5">
                          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-zinc-900 border border-white/10 group-hover:scale-110 transition-transform duration-500">
                            <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <Upload className="h-8 w-8 text-zinc-400 group-hover:text-violet-400 transition-colors" />
                          </div>
                          <div>
                            <p className="text-white text-lg font-medium mb-1">
                              Drop your room image here
                            </p>
                            <p className="text-sm text-zinc-500">or click to browse from your device</p>
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
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm shadow-xl rounded-3xl">
                  <CardContent className="p-6 space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-300">
                        Describe Your Vision <span className="text-zinc-600">(Optional)</span>
                      </label>
                      <Input
                        type="text"
                        value={userPrompt}
                        onChange={(e) => setUserPrompt(e.target.value)}
                        placeholder="e.g., Modern minimalist office with natural lighting, cozy reading nook..."
                        className="h-12 bg-black/40 text-white placeholder:text-zinc-600 focus:bg-black/60 border-white/10 rounded-xl focus:ring-violet-500/50 focus:border-violet-500/50"
                      />
                    </div>

                    <Button
                      onClick={handleAnalyze}
                      disabled={!image || loading}
                      size="lg"
                      className={cn(
                        "w-full h-13 text-base font-bold rounded-xl transition-all duration-300",
                        !image || loading
                          ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                          : "bg-white text-black hover:bg-zinc-200 hover:scale-[1.01] shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]"
                      )}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Gemini 3 is thinking...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-5 w-5" />
                          Generate Blueprint
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Feature Showcase Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <Card className="bg-zinc-900/30 border-white/5 rounded-2xl hover:border-violet-500/20 transition-all">
                    <CardContent className="p-5 text-center space-y-3">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-violet-500/10 border border-violet-500/20">
                        <Brain className="h-5 w-5 text-violet-400" />
                      </div>
                      <h3 className="text-sm font-bold text-white">Deep Analysis</h3>
                      <p className="text-xs text-zinc-500">Physics-based spatial reasoning with lighting, ergonomics, and flow analysis</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-zinc-900/30 border-white/5 rounded-2xl hover:border-violet-500/20 transition-all">
                    <CardContent className="p-5 text-center space-y-3">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20">
                        <ShoppingBag className="h-5 w-5 text-amber-400" />
                      </div>
                      <h3 className="text-sm font-bold text-white">Smart Shopping</h3>
                      <p className="text-xs text-zinc-500">AI-curated product suggestions with previews and direct shopping links</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-zinc-900/30 border-white/5 rounded-2xl hover:border-violet-500/20 transition-all">
                    <CardContent className="p-5 text-center space-y-3">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                        <Layers className="h-5 w-5 text-cyan-400" />
                      </div>
                      <h3 className="text-sm font-bold text-white">AR Transform</h3>
                      <p className="text-xs text-zinc-500">Live camera object detection, style transformation, and real-time overlay</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && !result && (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20">
                  <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                  <span className="text-sm font-mono text-violet-300">GEMINI 3 PRO ANALYZING SPACE...</span>
                </div>
                <p className="text-xs text-zinc-500 mt-3">Deep spatial reasoning in progress — analyzing lighting, ergonomics, acoustics, and flow</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-28 rounded-2xl bg-zinc-900/50" />
                <Skeleton className="h-28 rounded-2xl bg-zinc-900/50" />
              </div>
              <Skeleton className="h-24 rounded-2xl bg-zinc-900/50" />
              <Skeleton className="h-48 rounded-2xl bg-zinc-900/50" />
              <Skeleton className="h-48 rounded-2xl bg-zinc-900/50" />
            </div>
          )}

          {/* Results */}
          {result && !result.error && (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
              {/* Back Button */}
              <Button
                variant="ghost"
                onClick={() => { setResult(null); setImage(null); }}
                className="text-zinc-400 hover:text-white"
              >
                ← New Analysis
              </Button>

              {/* Room Image */}
              {image && (
                <div className="relative rounded-2xl overflow-hidden max-h-[300px]">
                  <img src={image} alt="Analyzed Room" className="w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 flex gap-2">
                    <Badge className="bg-white/10 backdrop-blur-md text-white border-white/20">
                      {result.room_analysis.room_type || "Room"} Analyzed
                    </Badge>
                    <Badge className="bg-violet-500/20 backdrop-blur-md text-violet-300 border-violet-500/20">
                      <Sparkles className="h-2.5 w-2.5 mr-1" /> Gemini 3 Pro
                    </Badge>
                  </div>
                </div>
              )}

              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-zinc-900/50 border-white/5 rounded-2xl">
                  <CardContent className="p-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Vibe Score</p>
                    <p className="text-4xl font-bold text-violet-400">
                      {result.room_analysis.vibe_score}
                      <span className="text-lg text-zinc-600">/10</span>
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-white/5 rounded-2xl">
                  <CardContent className="p-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Issues</p>
                    <p className="text-4xl font-bold text-amber-400">
                      {result.room_analysis.identified_problems.length}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-white/5 rounded-2xl">
                  <CardContent className="p-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Actions</p>
                    <p className="text-4xl font-bold text-green-400">
                      {result.agent_actions.length}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-white/5 rounded-2xl">
                  <CardContent className="p-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Shop Items</p>
                    <p className="text-4xl font-bold text-cyan-400">
                      {shoppingItems.length}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Lighting & Spatial Analysis */}
              {(result.room_analysis.lighting_analysis || result.room_analysis.spatial_flow) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.room_analysis.lighting_analysis && (
                    <Card className="bg-zinc-900/50 border-white/5 rounded-2xl">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Lightbulb className="h-4 w-4 text-amber-400" />
                          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Lighting</p>
                        </div>
                        <p className="text-sm text-zinc-300">{result.room_analysis.lighting_analysis}</p>
                      </CardContent>
                    </Card>
                  )}
                  {result.room_analysis.spatial_flow && (
                    <Card className="bg-zinc-900/50 border-white/5 rounded-2xl">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Compass className="h-4 w-4 text-blue-400" />
                          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Spatial Flow</p>
                        </div>
                        <p className="text-sm text-zinc-300">{result.room_analysis.spatial_flow}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Issues */}
              {result.room_analysis.identified_problems.length > 0 && (
                <Card className="bg-amber-500/5 border-amber-500/20 rounded-2xl">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertCircle className="h-5 w-5 text-amber-400" />
                      <CardTitle className="text-amber-200 text-sm font-bold uppercase tracking-wider">
                        Identified Issues
                      </CardTitle>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {result.room_analysis.identified_problems.map((problem, i) => (
                        <Badge key={i} className="bg-amber-500/10 text-amber-200 border-amber-500/20 text-xs">
                          {problem}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tab Switcher: Plan vs Shopping */}
              <div className="flex bg-zinc-900/50 rounded-xl p-1 border border-white/5">
                <button
                  onClick={() => setActiveTab("plan")}
                  className={cn("flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                    activeTab === "plan"
                      ? "bg-violet-500/20 text-violet-300 border border-violet-500/20"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}>
                  <Wand2 className="h-4 w-4" /> Renovation Plan
                </button>
                <button
                  onClick={() => setActiveTab("shopping")}
                  className={cn("flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                    activeTab === "shopping"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/20"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}>
                  <ShoppingBag className="h-4 w-4" /> Shopping List ({shoppingItems.length})
                </button>
              </div>

              {/* PLAN TAB */}
              {activeTab === "plan" && (
                <div className="space-y-4">
                  {result.agent_actions.map((action, i) => (
                    <Card key={i} className="bg-zinc-900/50 border-white/5 rounded-2xl hover:border-violet-500/20 transition-all">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {action.action_type === "ADD_ASSET" ? (
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20">
                                <ShoppingBag className="h-4 w-4 text-violet-400" />
                              </div>
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <Wrench className="h-4 w-4 text-blue-400" />
                              </div>
                            )}
                            <div>
                              <Badge className="bg-white/5 text-zinc-400 border-white/10 text-[10px] mb-1">
                                {action.action_type === "ADD_ASSET" ? "Add Item" : "Note"}
                                {action.estimated_impact && (
                                  <span className={cn(
                                    "ml-2",
                                    action.estimated_impact === "high" ? "text-green-400" :
                                    action.estimated_impact === "medium" ? "text-amber-400" : "text-zinc-500"
                                  )}>
                                    • {action.estimated_impact} impact
                                  </span>
                                )}
                              </Badge>
                              <h4 className="text-base font-semibold text-white">
                                {action.item_name || "Instruction"}
                              </h4>
                            </div>
                          </div>
                          {action.shopping_search_query && (
                            <Button size="sm" asChild className="bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-full text-xs">
                              <a href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(action.shopping_search_query)}`} target="_blank" rel="noopener noreferrer">
                                <ShoppingBag className="mr-1.5 h-3 w-3" /> Shop →
                              </a>
                            </Button>
                          )}
                        </div>

                        <p className="text-sm text-zinc-400">{action.reason}</p>

                        {action.placement_guide && (
                          <div className="flex items-start gap-3 p-3 rounded-xl bg-violet-500/5 border border-violet-500/10">
                            <MapPin className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-[10px] font-bold uppercase text-violet-400/60 mb-0.5">Placement Guide</p>
                              <p className="text-xs text-zinc-300">{action.placement_guide}</p>
                            </div>
                          </div>
                        )}

                        {action.instruction && (
                          <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                            <p className="text-xs text-zinc-300 italic">{action.instruction}</p>
                            {action.priority && (
                              <Badge className={cn("mt-2 text-[9px]",
                                action.priority === "urgent" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                action.priority === "recommended" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                              )}>
                                {action.priority}
                              </Badge>
                            )}
                          </div>
                        )}

                        {action.action_type === "ADD_ASSET" && action.nano_banana_prompt && (
                          <div>
                            {action.generated_image ? (
                              <div className="relative rounded-xl overflow-hidden bg-zinc-800/50">
                                <img src={action.generated_image} alt={action.item_name || "Preview"} className="w-full h-48 object-contain" />
                                <Badge className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-violet-300 border-violet-500/20">
                                  <Sparkles className="h-2.5 w-2.5 mr-1" /> Gemini 3 Generated
                                </Badge>
                              </div>
                            ) : (
                              <Button
                                onClick={() => handleGenerateImage(i, action.nano_banana_prompt!)}
                                disabled={generatingImageIndex !== null}
                                className="w-full bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-xl"
                              >
                                {generatingImageIndex === i ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating via Gemini 3...
                                  </>
                                ) : (
                                  <>
                                    <ImageIcon className="mr-2 h-4 w-4" />
                                    Generate Preview Image
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* SHOPPING TAB */}
              {activeTab === "shopping" && (
                <div className="space-y-4">
                  {shoppingItems.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500">
                      <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p className="text-sm">No shopping items in the renovation plan</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-zinc-500">
                        All {shoppingItems.length} recommended products — click to shop on Google
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {shoppingItems.map((item, i) => {
                          const actionIndex = result.agent_actions.indexOf(item);
                          return (
                            <Card key={i} className="bg-zinc-900/50 border-white/5 rounded-2xl overflow-hidden hover:border-violet-500/20 transition-all">
                              {/* Product Image */}
                              {item.generated_image ? (
                                <div className="relative h-40 bg-zinc-800/50">
                                  <img src={item.generated_image} alt={item.item_name || ""} className="w-full h-full object-contain" />
                                  <Badge className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-violet-300 border-violet-500/20 text-[9px]">
                                    <Sparkles className="h-2 w-2 mr-1" /> AI Preview
                                  </Badge>
                                </div>
                              ) : (
                                <button
                                  onClick={() => item.nano_banana_prompt && handleGenerateImage(actionIndex, item.nano_banana_prompt)}
                                  disabled={generatingImageIndex !== null}
                                  className="w-full h-32 bg-gradient-to-br from-zinc-900 to-zinc-800 flex flex-col items-center justify-center gap-2 hover:from-violet-950/30 transition-all"
                                >
                                  {generatingImageIndex === actionIndex ? (
                                    <Loader2 className="h-6 w-6 text-violet-400 animate-spin" />
                                  ) : (
                                    <>
                                      <ImageIcon className="h-6 w-6 text-zinc-600" />
                                      <span className="text-[10px] text-zinc-500">Generate Preview</span>
                                    </>
                                  )}
                                </button>
                              )}

                              <CardContent className="p-4 space-y-3">
                                <div>
                                  <h4 className="text-sm font-bold text-white">{item.item_name}</h4>
                                  {item.estimated_impact && (
                                    <Badge className={cn("mt-1 text-[9px] border",
                                      item.estimated_impact === "high"
                                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                                        : item.estimated_impact === "medium"
                                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                        : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                                    )}>
                                      <TrendingUp className="h-2 w-2 mr-0.5" /> {item.estimated_impact} impact
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[11px] text-zinc-400 line-clamp-2">{item.reason}</p>

                                {item.placement_guide && (
                                  <div className="flex items-start gap-2 text-[11px]">
                                    <MapPin className="h-3 w-3 text-violet-400 mt-0.5 shrink-0" />
                                    <span className="text-zinc-500">{item.placement_guide}</span>
                                  </div>
                                )}

                                <a
                                  href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(item.shopping_search_query || item.item_name || "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-500/10"
                                >
                                  <ShoppingBag className="h-3.5 w-3.5" />
                                  Shop on Google
                                  <ExternalLink className="h-3 w-3 opacity-60" />
                                </a>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* AI Reasoning */}
              <Card className="bg-zinc-900/50 border-white/5 rounded-2xl">
                <CardContent className="p-5">
                  <Button
                    variant="ghost"
                    onClick={() => setShowThinking(!showThinking)}
                    className="w-full justify-between text-zinc-400 hover:text-white hover:bg-white/5"
                  >
                    <span className="flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      View AI Reasoning (Thought Trace)
                    </span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", showThinking && "rotate-180")} />
                  </Button>
                  {showThinking && (
                    <div className="mt-4 p-4 rounded-xl bg-black/50 border border-white/5">
                      <pre className="text-xs text-zinc-400 font-mono whitespace-pre-wrap leading-relaxed">
                        {result.thought_signature}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* CTA: Try Live Mode */}
              <Card className="bg-gradient-to-r from-violet-950/50 to-indigo-950/50 border-violet-500/20 rounded-2xl">
                <CardContent className="p-6 flex items-center gap-6">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">Want to see it live?</h3>
                    <p className="text-sm text-zinc-400">
                      Open the Live AR Assistant to detect objects in real-time, get product suggestions with AI previews, and transform your space with style presets.
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowAssistant(true)}
                    className="bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl px-6 h-12 shadow-lg shadow-violet-500/20 shrink-0"
                  >
                    <Video className="mr-2 h-5 w-5" /> Open Live Mode
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Error State */}
          {result?.error && (
            <div className="max-w-2xl mx-auto text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
              <h3 className="text-xl font-bold text-white">Analysis Failed</h3>
              <p className="text-sm text-zinc-400">{result.error}</p>
              <Button onClick={() => { setResult(null); }} className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl">
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
