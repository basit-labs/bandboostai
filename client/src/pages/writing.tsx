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
  PenTool,
  Clock,
  Timer,
  Send,
  FileText,
  AlertCircle,
  Lock,
  Crown,
  Play,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

export default function WritingPage() {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [essays, setEssays] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const { toast } = useToast();
  const { hasPremiumAccess } = useAuth();

  const { data: usageData, isLoading: usageLoading } = useQuery<any>({
    queryKey: ["/api/practice/daily-usage"],
  });

  useEffect(() => {
    if (sessionStarted && !submitted) {
      setTimeLeft(40 * 60);
    }
  }, [sessionStarted, submitted]);

  useEffect(() => {
    if (timeLeft <= 0 || submitted || !sessionStarted) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitted, sessionStarted]);

  const startSession = async () => {
    try {
      const res = await apiRequest("GET", "/api/practice/session/writing");
      const data = await res.json();
      setSessionData(data);
      setSessionStarted(true);
      setCurrentIndex(0);
      setEssays({});
      setSubmitted(false);
      setFeedbacks([]);
    } catch (err: any) {
      toast({ title: "Error", description: "Could not start session. You may have reached your daily limit.", variant: "destructive" });
    }
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      const results: any[] = [];
      for (let i = 0; i < sessionData.questions.length; i++) {
        const prompt = sessionData.questions[i];
        const essay = essays[i] || "";
        if (essay.trim().length < 10) continue;
        const res = await apiRequest("POST", "/api/writing/submit", {
          promptId: prompt.id,
          content: essay,
          wordCount: essay.trim().split(/\s+/).filter(Boolean).length,
        });
        const feedback = await res.json();
        results.push({ prompt, feedback });
      }
      await apiRequest("POST", "/api/tasks/complete-by-type", { taskType: "writing" });
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
    const currentPrompt = prompts[currentIndex];
    const currentEssay = essays[currentIndex] || "";
    const wordCount = currentEssay.trim().split(/\s+/).filter(Boolean).length;

    if (submitted && feedbacks.length > 0) {
      return (
        <AppShell>
          <motion.div className="space-y-6 pb-20 md:pb-0 max-w-3xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-xl font-bold" data-testid="text-writing-results">Writing Session Results</h2>
            {feedbacks.map((item, i) => (
              <Card key={i} className="border-chart-3/20">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold">{item.prompt.title}</h3>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-chart-3" data-testid={`text-writing-score-${i}`}>
                      {item.feedback.score}/9.0
                    </p>
                  </div>
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
            <Button className="w-full" onClick={() => { setSessionStarted(false); setSessionData(null); setEssays({}); setSubmitted(false); setFeedbacks([]); }} data-testid="button-new-writing-session">
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
            <Button variant="ghost" size="sm" onClick={() => { setSessionStarted(false); setSessionData(null); }} data-testid="button-end-writing">
              End Session
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Prompt {currentIndex + 1}/{prompts.length}</Badge>
              <Badge variant={timeLeft < 120 ? "destructive" : "secondary"} className="text-sm" data-testid="badge-writing-timer">
                <Timer className="w-3.5 h-3.5 mr-1" />{formatTime(timeLeft)}
              </Badge>
            </div>
          </div>

          <Card className="bg-gradient-to-r from-chart-3/10 to-transparent border-chart-3/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary">{currentPrompt.taskType}</Badge>
                <Badge variant="outline">{currentPrompt.difficulty}</Badge>
              </div>
              <h2 className="text-lg font-bold mb-3" data-testid="text-prompt-title">{currentPrompt.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{currentPrompt.promptText}</p>
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <span>Min: {currentPrompt.minWords || 150} words</span>
                <span>Max: {currentPrompt.maxWords || 300} words</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Your Response</label>
              <span className={`text-xs font-medium ${wordCount < (currentPrompt.minWords || 150) ? "text-destructive" : "text-chart-2"}`} data-testid="text-word-count">
                {wordCount} words
              </span>
            </div>
            <Textarea
              value={currentEssay}
              onChange={(e) => setEssays({ ...essays, [currentIndex]: e.target.value })}
              placeholder="Start writing your response here..."
              className="min-h-[250px] text-sm leading-relaxed resize-none"
              data-testid="textarea-essay"
            />
          </div>

          <div className="flex items-center gap-2">
            {currentIndex > 0 && (
              <Button variant="outline" onClick={() => setCurrentIndex(currentIndex - 1)} data-testid="button-prev-prompt">
                <ArrowLeft className="w-4 h-4 mr-1" />Previous
              </Button>
            )}
            <div className="flex-1" />
            {currentIndex < prompts.length - 1 ? (
              <Button onClick={() => setCurrentIndex(currentIndex + 1)} data-testid="button-next-prompt">
                Next<ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending} data-testid="button-submit-writing">
                <Send className="w-4 h-4 mr-2" />{submitMutation.isPending ? "Analyzing..." : "Submit All"}
              </Button>
            )}
          </div>
        </motion.div>
      </AppShell>
    );
  }

  const dailyUsed = usageData?.usage?.writingCount || 0;
  const dailyLimit = usageData?.dailyLimit;
  const isPremium = usageData?.isPremium;

  return (
    <AppShell>
      <motion.div className="space-y-6 pb-20 md:pb-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-writing-page-title">
            <PenTool className="w-6 h-6 text-chart-3" />Writing Practice
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Session-based writing practice with AI-powered feedback</p>
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

        <Card className="border-chart-3/20">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-chart-3/10 flex items-center justify-center mx-auto mb-4">
              <PenTool className="w-8 h-8 text-chart-3" />
            </div>
            <h2 className="text-xl font-bold mb-2">Writing Session</h2>
            <p className="text-sm text-muted-foreground mb-1">5 prompts per session, 40 minutes</p>
            <p className="text-xs text-muted-foreground mb-6">Get AI-powered feedback on each response</p>

            {!isPremium && dailyUsed >= (dailyLimit || 3) ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Lock className="w-5 h-5" /><span className="text-sm font-medium">Daily limit reached</span>
                </div>
                <Button variant="outline" className="border-chart-4/30 text-chart-4" data-testid="button-upgrade-writing">
                  <Crown className="w-4 h-4 mr-2" />Upgrade to Premium
                </Button>
              </div>
            ) : (
              <Button size="lg" onClick={startSession} data-testid="button-start-writing-session">
                <Play className="w-5 h-5 mr-2" />Start Session
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AppShell>
  );
}
