"use client";

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, Cpu, Zap, ShoppingCart, Eye, MousePointer2 } from 'lucide-react';

// Types for the ZenSpace response
interface AgentAction {
  action_type: string;
  item_name?: string;
  reason?: string;
  placement_guide?: string;
  nano_banana_prompt?: string;
  shopping_search_query?: string;
  instruction?: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image,
          userPrompt: userPrompt || "Turn this into a High-End Streamer Setup",
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error analyzing space:", error);
      alert("Something went wrong. Please check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 font-sans selection:bg-purple-900 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <header className="text-center space-y-4 pt-10">
          <h1 className="text-6xl md:text-8xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 tracking-tighter animate-pulse-slow">
            ZENSPACE
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-light tracking-wide">
            Autonomous Spatial Reality Architect
          </p>
        </header>

        {/* Input Section */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <Card
              className="border-dashed border-2 hover:border-purple-500 transition-colors cursor-pointer aspect-video overflow-hidden group bg-muted/20"
              onClick={() => fileInputRef.current?.click()}
            >
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image}
                  alt="Room Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full space-y-4 group-hover:scale-105 transition-transform">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">Click or Drag to Upload Room Image</p>
                </div>
              )}
              <Input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </Card>

            <div className="space-y-4">
              <Textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Describe your goal (e.g. 'Cyberpunk Workstation', 'Zen Reading Nook')..."
                className="h-32 resize-none bg-muted/20 text-lg"
              />
              <Button
                onClick={handleAnalyze}
                disabled={!image || loading}
                className="w-full text-lg py-6 rounded-full font-bold"
                size="lg"
              >
                {loading ? (
                  <>
                    <Cpu className="mr-2 h-5 w-5 animate-spin" />
                    Architecting...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-5 w-5" />
                    GENERATE RENOVATION PLAN
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            {!result && !loading && (
              <Card className="h-full min-h-[400px] flex items-center justify-center bg-muted/10 border-muted">
                <CardContent className="text-center text-muted-foreground italic p-10">
                  <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  Awaiting input to initiate spatial analysis...
                </CardContent>
              </Card>
            )}

            {loading && !result && (
              <div className="space-y-4">
                <Skeleton className="h-[200px] w-full rounded-xl" />
                <Skeleton className="h-[100px] w-full rounded-xl" />
                <Skeleton className="h-[300px] w-full rounded-xl" />
              </div>
            )}

            {result && !result.error && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
                {/* Score Card */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-muted/20 border-purple-900/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Vibe Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-mono text-purple-400">{result.room_analysis.vibe_score}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/20 border-red-900/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Friction Points</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-mono text-red-400">{result.room_analysis.identified_problems.length}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Problems List */}
                <Card className="bg-red-950/20 border-red-900/30">
                  <CardHeader>
                    <CardTitle className="text-red-400 font-bold flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                      DETECTED ISSUES
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {result.room_analysis.identified_problems.map((prob, i) => (
                      <Badge key={i} variant="destructive" className="bg-red-500/10 text-red-300 border-red-500/20 hover:bg-red-500/20">
                        {prob}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>

                {/* Actions */}
                <ScrollArea className="h-[600px] pr-4 rounded-md">
                  <div className="space-y-4">
                    <h3 className="font-bold text-xl mb-4">Protocol: TRANSFORMA</h3>
                    {result.agent_actions.map((action, i) => (
                      <Card key={i} className="hover:border-purple-500/50 transition-colors group bg-muted/10">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <Badge variant={action.action_type === 'ADD_ASSET' ? 'secondary' : 'outline'}>
                              {action.action_type}
                            </Badge>
                            {action.shopping_search_query && (
                              <a
                                href={`https://www.google.com/search?q=${encodeURIComponent(action.shopping_search_query)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <ShoppingCart className="w-4 h-4 text-purple-400" />
                              </a>
                            )}
                          </div>
                          <CardTitle className="text-xl mt-2 group-hover:text-purple-400 transition-colors">
                            {action.item_name || "Instruction"}
                          </CardTitle>
                          <CardDescription className="text-base">
                            {action.reason}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {action.placement_guide && (
                            <div className="bg-muted rounded-lg p-3 text-sm border flex gap-3">
                              <MousePointer2 className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="text-purple-500 font-mono text-xs block mb-1">COORDINATES:</span>
                                {action.placement_guide}
                              </div>
                            </div>
                          )}

                          {action.instruction && (
                            <p className="text-muted-foreground italic border-l-2 border-blue-500 pl-4 py-1">
                              {action.instruction}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>

                {/* Thought Trace */}
                <div className="pt-4">
                  <details className="group">
                    <summary className="text-muted-foreground text-sm cursor-pointer list-none flex items-center gap-2 hover:text-white transition-colors">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full group-hover:bg-purple-500"></span>
                      Initialize Neural Log
                    </summary>
                    <div className="mt-4 p-4 bg-muted/30 rounded-xl font-mono text-xs text-muted-foreground leading-relaxed border border-muted">
                      {result.thought_signature}
                    </div>
                  </details>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
