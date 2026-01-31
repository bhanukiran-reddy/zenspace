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
  LayoutGrid,
  Wand2,
  ArrowRight,
  Settings,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
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
}

interface RoomAnalysis {
  vibe_score: string;
  identified_problems: string[];
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
  const [activeSection, setActiveSection] = useState("upload");
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
      if (data) setActiveSection("results");
    } catch (error) {
      console.error("Error analyzing space:", error);
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = [
    { id: "upload", label: "Upload", icon: Upload },
    { id: "analyze", label: "Analyze", icon: Sparkles },
    { id: "results", label: "Results", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col bg-white shadow-lg">
        {/* Sidebar Header */}
        <div className="flex items-center gap-3 p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-purple-600">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">ZenSpace</h1>
            <p className="text-xs text-slate-500">AI Architect</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  activeSection === item.id
                    ? "bg-violet-50 text-violet-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Upload Section */}
        {activeSection === "upload" && (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="text-center space-y-4 max-w-2xl mx-auto mb-12">
              <h1 className="text-5xl font-bold tracking-tight text-slate-900">
                Transform Your Space
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed">
                Upload a room photo and get a complete renovation blueprint with layout analysis, lighting optimization, and flow recommendations.
              </p>
            </div>

            {/* Upload Area */}
            <div className="max-w-3xl mx-auto space-y-6">
              <Card className="bg-white shadow-md rounded-2xl">
                <CardContent className="p-6">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "relative group cursor-pointer rounded-xl transition-all",
                      image
                        ? "aspect-video overflow-hidden"
                        : "bg-slate-50 min-h-[400px] flex items-center justify-center hover:bg-violet-50/50"
                    )}
                  >
                    {image ? (
                      <>
                        <img src={image} alt="Room" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg">
                            <Upload className="mr-2 h-4 w-4" />
                            Change Photo
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-12 space-y-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-slate-100 mb-2">
                          <Upload className="h-8 w-8 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-slate-900 font-medium mb-1">Drop your room image here</p>
                          <p className="text-sm text-slate-500">or click to browse from your device</p>
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

              <Card className="bg-white shadow-md rounded-2xl">
                <CardContent className="p-6 space-y-4">
                  {/* Description Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Describe Your Vision (Optional)</label>
                    <Input
                      type="text"
                      value={userPrompt}
                      onChange={(e) => setUserPrompt(e.target.value)}
                      placeholder="e.g., Modern minimalist office with natural lighting, cozy reading nook..."
                      className="h-12 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-violet-500/20 border-0"
                    />
                  </div>

                  {/* Generate Button */}
                  <Button
                    onClick={handleAnalyze}
                    disabled={!image || loading}
                    size="lg"
                    className={cn(
                      "w-full h-12 text-base font-semibold rounded-xl",
                      !image || loading
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-linear-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/20"
                    )}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Analyzing Space...
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
            </div>
          </div>
        )}

        {/* Analyze Section */}
        {activeSection === "analyze" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="space-y-2 mb-8">
              <h2 className="text-3xl font-bold text-slate-900">Analysis Configuration</h2>
              <p className="text-slate-600">Configure how the AI analyzes your space</p>
            </div>
            <Card className="bg-white shadow-md rounded-2xl">
              <CardContent className="p-8">
                <p className="text-slate-600">Analysis settings will be available here.</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results Section */}
        {activeSection === "results" && (
          <div className="max-w-4xl mx-auto space-y-8">
            {!result && !loading && (
              <div className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-slate-100">
                  <LayoutGrid className="h-8 w-8 text-slate-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold text-slate-900">No Results Yet</h3>
                  <p className="text-slate-600 max-w-sm">
                    Upload a room photo and generate a blueprint to see results here.
                  </p>
                </div>
                <Button onClick={() => setActiveSection("upload")} className="bg-slate-100 hover:bg-slate-200 text-slate-700">
                  Go to Upload
                </Button>
              </div>
            )}

            {loading && !result && (
              <div className="space-y-4">
                <Skeleton className="h-32 rounded-xl bg-slate-100" />
                <Skeleton className="h-24 rounded-xl bg-slate-100" />
                <Skeleton className="h-48 rounded-xl bg-slate-100" />
              </div>
            )}

            {result && !result.error && (
              <div className="space-y-8">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-white shadow-md rounded-2xl">
                    <CardContent className="p-6">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Vibe Score</p>
                      <p className="text-5xl font-bold text-violet-600">
                        {result.room_analysis.vibe_score}
                        <span className="text-xl text-slate-500 ml-1">/10</span>
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white shadow-md rounded-2xl">
                    <CardContent className="p-6">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Issues Found</p>
                      <p className="text-5xl font-bold text-amber-600">
                        {result.room_analysis.identified_problems.length}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Issues Alert */}
                {result.room_analysis.identified_problems.length > 0 && (
                  <Card className="bg-amber-50 shadow-md rounded-2xl">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                        <CardTitle className="text-amber-900">Identified Issues</CardTitle>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.room_analysis.identified_problems.map((problem, i) => (
                          <Badge key={i} className="bg-amber-100 text-amber-800">
                            {problem}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Renovation Plan */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-6">Renovation Plan</h3>
                  </div>
                  <div className="space-y-4">
                    {result.agent_actions.map((action, i) => (
                      <Card key={i} className="bg-white shadow-md rounded-2xl hover:shadow-lg transition-all">
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              {action.action_type === "ADD_ASSET" ? (
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
                                  <ShoppingBag className="h-5 w-5 text-violet-600" />
                                </div>
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                  <Wrench className="h-5 w-5 text-blue-600" />
                                </div>
                              )}
                              <Badge className="bg-slate-100 text-slate-700">
                                {action.action_type === "ADD_ASSET" ? "Add Item" : "Note"}
                              </Badge>
                            </div>
                            {action.shopping_search_query && (
                              <Button size="sm" asChild className="bg-slate-100 hover:bg-slate-200 text-slate-700">
                                <a href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(action.shopping_search_query)}`} target="_blank" rel="noopener noreferrer">
                                  Shop →
                                </a>
                              </Button>
                            )}
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-slate-900 mb-2">{action.item_name || "Instruction"}</h4>
                            <p className="text-slate-600">{action.reason}</p>
                          </div>
                          {action.placement_guide && (
                            <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50">
                              <MapPin className="h-5 w-5 text-violet-600 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs font-semibold uppercase text-slate-500 mb-1">Placement Guide</p>
                                <p className="text-sm text-slate-700">{action.placement_guide}</p>
                              </div>
                            </div>
                          )}
                          {action.instruction && (
                            <div className="p-4 rounded-lg bg-blue-50">
                              <p className="text-sm text-slate-700 italic">{action.instruction}</p>
                            </div>
                          )}
                          {action.action_type === "ADD_ASSET" && action.nano_banana_prompt && (
                            <div>
                              {action.generated_image ? (
                                <div className="relative rounded-lg overflow-hidden bg-slate-50">
                                  <img src={action.generated_image} alt={action.item_name || "Preview"} className="w-full h-48 object-contain" />
                                  <Badge className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm shadow-md">
                                    AI Generated
                                  </Badge>
                                </div>
                              ) : (
                                <Button
                                  onClick={() => handleGenerateImage(i, action.nano_banana_prompt!)}
                                  disabled={generatingImageIndex !== null}
                                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700"
                                >
                                  {generatingImageIndex === i ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Generating Preview...
                                    </>
                                  ) : (
                                    <>
                                      <ImageIcon className="mr-2 h-4 w-4" />
                                      Generate Preview
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
                </div>

                {/* AI Reasoning */}
                <Card className="bg-white shadow-md rounded-2xl">
                  <CardContent className="p-6">
                    <Button
                      variant="ghost"
                      onClick={() => setShowThinking(!showThinking)}
                      className="w-full justify-between text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    >
                      <span className="flex items-center gap-2">
                        <Wand2 className="h-4 w-4" />
                        View AI Reasoning
                      </span>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", showThinking && "rotate-180")} />
                    </Button>
                    {showThinking && (
                      <div className="mt-4 p-4 rounded-lg bg-slate-50">
                        <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap leading-relaxed">
                          {result.thought_signature}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Settings Section */}
        {activeSection === "settings" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="space-y-2 mb-8">
              <h2 className="text-3xl font-bold text-slate-900">Settings</h2>
              <p className="text-slate-600">Manage your preferences and account settings</p>
            </div>
            <Card className="bg-white shadow-md rounded-2xl">
              <CardContent className="p-8">
                <p className="text-slate-600">Settings will be available here.</p>
              </CardContent>
            </Card>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
