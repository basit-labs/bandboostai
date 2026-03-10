import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import AppShell from "@/components/app-shell";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Mic,
  Clock,
  Timer,
  Send,
  AlertCircle,
  Lock,
  Crown,
  Play,
  ArrowRight,
  ArrowLeft,
  Square,
} from "lucide-react";

export default function SpeakingPage() {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transcripts, setTranscripts] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [phase, setPhase] = useState<"prep" | "record">("prep");
  const [prepTime, setPrepTime] = useState(0);
  const [responseTime, setResponseTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const { toast } = useToast();
  const { hasPremiumAccess } = useAuth();

  const { data: usageData, isLoading: usageLoading } = useQuery<any>({
    queryKey: ["/api/practice/daily-usage"],
  });

  const currentPrompt = sessionData?.questions?.[currentIndex];

  useEffect(() => {
    if (currentPrompt && phase === "prep") {
      setPrepTime(currentPrompt.preparationTime || 30);
    }
  }, [currentPrompt, phase]);

  useEffect(() => {
    if (phase === "prep" && prepTime > 0) {
      const timer = setInterval(() => setPrepTime(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (phase === "prep" && prepTime === 0 && currentPrompt) {
      setPhase("record");
      setResponseTime(currentPrompt.responseTime || 60);
    }
  }, [phase, prepTime, currentPrompt]);

  useEffect(() => {
    if (phase === "record" && responseTime > 0 && isRecording) {
      const timer = setInterval(() => setResponseTime(t => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [phase, responseTime, isRecording]);

  const startSession = async () => {
    try {
      const res = await apiRequest("GET", "/api/practice/session/speaking");
      const data = await res.json();
      setSessionData(data);
      setSessionStarted(true);
      setCurrentIndex(0);
      setTranscripts({});
      setSubmitted(false);
      setFeedbacks([]);
      setPhase("prep");
    } catch (err: any) {
      toast({ title: "Error", description: "Could not start session. You may have reached your daily limit.", variant: "destructive" });
    }
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      const results: any[] = [];
      for (let i = 0; i < sessionData.questions.length; i++) {
        const prompt = sessionData.questions[i];
        const transcript = transcripts[i] || "";
        if (transcript.trim().length < 10) continue;
        const res = await apiRequest("POST", "/api/speaking/submit", {
          promptId: prompt.id,
          transcript,
        });
        const feedback = await res.json();
        results.push({ prompt, feedback });
      }
      await apiRequest("POST", "/api/tasks/complete-by-type", { taskType: "speaking" });
      return results;
    },
    onSuccess: (data) => {
      setFeedbacks(data);
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/user/skills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/practice/daily-usage"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (usageLoading) {
    return (<AppShell><div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-32" /></div></AppShell>);
  }

  if (sessionStarted && sessionData) {
    const prompts = sessionData.questions || [];

    if (submitted && feedbacks.length > 0) {
      return (
        <AppShell>
          <motion.div className="space-y-6 pb-20 md:pb-0 max-w-3xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-xl font-bold" data-testid="text-speaking-results">Speaking Session Results</h2>
            {feedbacks.map((item, i) => (
              <Card key={i} className="border-chart-4/20">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold">{item.prompt.title}</h3>
                  <p className="text-2xl font-bold text-chart-4 text-center" data-testid={`text-speaking-score-${i}`}>{item.feedback.score}/9.0</p>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(item.feedback.breakdown || {}).map(([key, value]) => (
                      <div key={key} className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                        <p className="text-lg font-semibold">{String(value)}/9</p>
                      </div>
                    ))}
                  </div>
                  {item.feedback.suggestions?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Suggestions</h4>
                      {item.feedback.suggestions.map((s: string, j: number) => (
                        <div key={j} className="flex items-start gap-2 text-sm mb-1">
                          <AlertCircle className="w-4 h-4 text-chart-4 mt-0.5 shrink-0" />
                          <span className="text-muted-foreground">{s}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            <Button className="w-full" onClick={() => { setSessionStarted(false); setSessionData(null); setTranscripts({}); setSubmitted(false); setFeedbacks([]); }} data-testid="button-new-speaking-session">
              Start New Session
            </Button>
          </motion.div>
        </AppShell>
      );
    }

    return (
      <AppShell>
        <motion.div className="space-y-6 pb-20 md:pb-0 max-w-3xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => { setSessionStarted(false); setSessionData(null); }} data-testid="button-end-speaking">
              End Session
            </Button>
            <Badge variant="outline" className="text-xs">Prompt {currentIndex + 1}/{prompts.length}</Badge>
          </div>

          <Card className="bg-gradient-to-r from-chart-4/10 to-transparent border-chart-4/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary">{currentPrompt?.taskType}</Badge>
                <Badge variant="outline">{currentPrompt?.difficulty}</Badge>
              </div>
              <h2 className="text-lg font-bold mb-3" data-testid="text-speaking-title">{currentPrompt?.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{currentPrompt?.promptText}</p>
            </CardContent>
          </Card>

          {phase === "prep" && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-chart-4/10 flex items-center justify-center mx-auto mb-4">
                  <Timer className="w-10 h-10 text-chart-4" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Preparation Time</h3>
                <p className="text-3xl font-bold text-chart-4 mb-2" data-testid="text-prep-time">{formatTime(prepTime)}</p>
                <Button className="mt-4" onClick={() => { setPhase("record"); setResponseTime(currentPrompt?.responseTime || 60); }} data-testid="button-skip-prep">
                  Skip to Recording
                </Button>
              </CardContent>
            </Card>
          )}

          {phase === "record" && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-8 text-center">
                  <Badge variant={responseTime < 10 ? "destructive" : "secondary"} className="text-sm mb-4">
                    <Timer className="w-3.5 h-3.5 mr-1" />{formatTime(responseTime)}
                  </Badge>
                  <div className="mb-6">
                    <button
                      className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all ${isRecording ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-chart-4/10 text-chart-4 hover:bg-chart-4/20"}`}
                      onClick={() => setIsRecording(!isRecording)}
                      data-testid="button-record"
                    >
                      {isRecording ? <Square className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
                    </button>
                    <p className="text-sm text-muted-foreground mt-3">{isRecording ? "Recording... Click to stop" : "Click to start recording"}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Type your response below as a transcript</p>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <label className="text-sm font-medium">Response Transcript</label>
                <Textarea
                  value={transcripts[currentIndex] || ""}
                  onChange={(e) => setTranscripts({ ...transcripts, [currentIndex]: e.target.value })}
                  placeholder="Type what you would say..."
                  className="min-h-[150px] text-sm leading-relaxed resize-none"
                  data-testid="textarea-transcript"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {currentIndex > 0 && (
              <Button variant="outline" onClick={() => { setCurrentIndex(currentIndex - 1); setPhase("record"); }} data-testid="button-prev-speaking">
                <ArrowLeft className="w-4 h-4 mr-1" />Previous
              </Button>
            )}
            <div className="flex-1" />
            {currentIndex < prompts.length - 1 ? (
              <Button onClick={() => { setCurrentIndex(currentIndex + 1); setPhase("prep"); setIsRecording(false); }} data-testid="button-next-speaking">
                Next<ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending} data-testid="button-submit-speaking">
                <Send className="w-4 h-4 mr-2" />{submitMutation.isPending ? "Analyzing..." : "Submit All"}
              </Button>
            )}
          </div>
        </motion.div>
      </AppShell>
    );
  }

  const dailyUsed = usageData?.usage?.speakingCount || 0;
  const dailyLimit = usageData?.dailyLimit;
  const isPremium = usageData?.isPremium;

  return (
    <AppShell>
      <motion.div className="space-y-6 pb-20 md:pb-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-speaking-page-title">
            <Mic className="w-6 h-6 text-chart-4" />Speaking Practice
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Session-based speaking practice with AI-powered feedback</p>
        </div>

        {!isPremium && dailyLimit && (
          <Card className="border-chart-4/20 bg-chart-4/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-chart-4" />
                <span className="text-sm">Daily sessions: <strong>{dailyUsed}/{dailyLimit}</strong></span>
              </div>
              <Badge variant="outline" className="text-xs border-chart-4/30 text-chart-4"><Crown className="w-3 h-3 mr-1" />Free Plan</Badge>
            </CardContent>
          </Card>
        )}

        <Card className="border-chart-4/20">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-chart-4/10 flex items-center justify-center mx-auto mb-4">
              <Mic className="w-8 h-8 text-chart-4" />
            </div>
            <h2 className="text-xl font-bold mb-2">Speaking Session</h2>
            <p className="text-sm text-muted-foreground mb-1">5 prompts per session with prep + response time</p>
            <p className="text-xs text-muted-foreground mb-6">Get AI-powered pronunciation and fluency feedback</p>

            {!isPremium && dailyUsed >= (dailyLimit || 3) ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Lock className="w-5 h-5" /><span className="text-sm font-medium">Daily limit reached</span>
                </div>
                <Button variant="outline" className="border-chart-4/30 text-chart-4" data-testid="button-upgrade-speaking">
                  <Crown className="w-4 h-4 mr-2" />Upgrade to Premium
                </Button>
              </div>
            ) : (
              <Button size="lg" onClick={startSession} data-testid="button-start-speaking-session">
                <Play className="w-5 h-5 mr-2" />Start Session
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AppShell>
  );
}
