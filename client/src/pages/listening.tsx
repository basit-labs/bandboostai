import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AppShell from "@/components/app-shell";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Headphones,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  Timer,
  Lock,
  Crown,
  Play,
} from "lucide-react";

export default function ListeningPage() {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const { toast } = useToast();
  const { hasPremiumAccess } = useAuth();

  const { data: usageData, isLoading: usageLoading } = useQuery<any>({
    queryKey: ["/api/practice/daily-usage"],
  });

  useEffect(() => {
    if (sessionStarted && !submitted) {
      setTimeLeft(20 * 60);
    }
  }, [sessionStarted, submitted]);

  useEffect(() => {
    if (timeLeft <= 0 || submitted || !sessionStarted) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitted, sessionStarted]);

  const startSession = async () => {
    try {
      const res = await apiRequest("GET", "/api/practice/session/listening");
      const data = await res.json();
      setSessionData(data);
      setSessionStarted(true);
      setAnswers({});
      setSubmitted(false);
    } catch (err: any) {
      const errorData = JSON.parse(err.message.split(": ").slice(1).join(": ") || "{}");
      if (errorData.limitReached) {
        toast({ title: "Daily limit reached", description: "Upgrade to premium for unlimited practice.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    }
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      for (const q of sessionData.questions) {
        const isCorrect = answers[q.id] === q.correctAnswer;
        await apiRequest("POST", "/api/practice/attempt", {
          questionId: q.id,
          moduleType: "listening",
          correct: isCorrect,
          userAnswer: answers[q.id] || "",
          correctAnswer: q.correctAnswer,
          questionText: q.questionText,
          explanation: q.explanation,
          difficulty: q.difficulty || "medium",
        });
      }
      await apiRequest("POST", "/api/tasks/complete-by-type", { taskType: "listening" });
      return true;
    },
    onSuccess: () => {
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
  const correctCount = sessionData?.questions?.filter((q: any) => answers[q.id] === q.correctAnswer).length || 0;
  const totalQuestions = sessionData?.questions?.length || 0;

  if (usageLoading) {
    return (<AppShell><div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-32" /></div></AppShell>);
  }

  if (sessionStarted && sessionData) {
    const questions = sessionData.questions || [];
    return (
      <AppShell>
        <motion.div className="space-y-6 pb-20 md:pb-0 max-w-4xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => { setSessionStarted(false); setSessionData(null); setAnswers({}); setSubmitted(false); }} data-testid="button-back-listening">
              End Session
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{Object.keys(answers).length}/{questions.length} answered</Badge>
              {!submitted && (
                <Badge variant={timeLeft < 120 ? "destructive" : "secondary"} className="text-sm" data-testid="badge-timer">
                  <Timer className="w-3.5 h-3.5 mr-1" />{formatTime(timeLeft)}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {questions.map((q: any, index: number) => {
              const options = (q.options as string[]) || [];
              const isCorrect = submitted && answers[q.id] === q.correctAnswer;
              return (
                <Card key={q.id} className={submitted ? (isCorrect ? "border-chart-2/30" : answers[q.id] ? "border-destructive/30" : "") : ""} data-testid={`card-lq-${index}`}>
                  <CardContent className="p-5">
                    <p className="font-medium mb-3 text-sm"><span className="text-muted-foreground mr-2">Q{index + 1}.</span>{q.questionText}</p>
                    <div className="space-y-2">
                      {options.map((opt: string, oi: number) => (
                        <button key={oi} className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${answers[q.id] === opt ? (submitted ? (isCorrect ? "border-chart-2 bg-chart-2/10" : "border-destructive bg-destructive/10") : "border-primary bg-primary/5") : submitted && opt === q.correctAnswer ? "border-chart-2 bg-chart-2/10" : "hover:bg-muted/50"}`}
                          onClick={() => { if (!submitted) setAnswers({ ...answers, [q.id]: opt }); }} disabled={submitted} data-testid={`option-lq-${q.id}-${oi}`}>
                          <div className="flex items-center gap-2">
                            {submitted && opt === q.correctAnswer && <CheckCircle2 className="w-4 h-4 text-chart-2 shrink-0" />}
                            {submitted && answers[q.id] === opt && opt !== q.correctAnswer && <XCircle className="w-4 h-4 text-destructive shrink-0" />}
                            {!submitted && <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${answers[q.id] === opt ? "border-primary bg-primary" : "border-muted-foreground/30"}`} />}
                            <span>{opt}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    {submitted && q.explanation && <p className="text-xs text-muted-foreground mt-3 p-2 bg-muted/50 rounded">{q.explanation}</p>}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {!submitted && questions.length > 0 && (
            <Button className="w-full" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || Object.keys(answers).length === 0} data-testid="button-submit-listening">
              {submitMutation.isPending ? "Checking..." : "Submit Answers"}
            </Button>
          )}

          {submitted && (
            <Card className="bg-gradient-to-r from-chart-2/10 to-transparent border-chart-2/20">
              <CardContent className="p-6 text-center">
                <BarChart3 className="w-10 h-10 text-chart-2 mx-auto mb-3" />
                <h3 className="text-xl font-bold" data-testid="text-listening-score">{correctCount} / {totalQuestions} Correct</h3>
                <p className="text-sm text-muted-foreground mt-1">Score: {Math.round((correctCount / totalQuestions) * 100)}%</p>
                <Button className="mt-4" onClick={() => { setSessionStarted(false); setSessionData(null); setAnswers({}); setSubmitted(false); }} data-testid="button-new-session">Start New Session</Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AppShell>
    );
  }

  const dailyUsed = usageData?.usage?.listeningCount || 0;
  const dailyLimit = usageData?.dailyLimit;
  const isPremium = usageData?.isPremium;

  return (
    <AppShell>
      <motion.div className="space-y-6 pb-20 md:pb-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-listening-page-title">
            <Headphones className="w-6 h-6 text-chart-1" />
            Listening Practice
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Session-based listening comprehension with smart question selection</p>
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

        <Card className="border-chart-1/20">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-chart-1/10 flex items-center justify-center mx-auto mb-4">
              <Headphones className="w-8 h-8 text-chart-1" />
            </div>
            <h2 className="text-xl font-bold mb-2">Listening Session</h2>
            <p className="text-sm text-muted-foreground mb-1">10 questions per session, 20 minutes</p>
            <p className="text-xs text-muted-foreground mb-6">Questions are selected based on your performance history</p>

            {!isPremium && dailyUsed >= (dailyLimit || 3) ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Lock className="w-5 h-5" /><span className="text-sm font-medium">Daily limit reached</span>
                </div>
                <Button variant="outline" className="border-chart-4/30 text-chart-4" data-testid="button-upgrade-listening">
                  <Crown className="w-4 h-4 mr-2" />Upgrade to Premium
                </Button>
              </div>
            ) : (
              <Button size="lg" onClick={startSession} data-testid="button-start-listening-session">
                <Play className="w-5 h-5 mr-2" />Start Session
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AppShell>
  );
}
