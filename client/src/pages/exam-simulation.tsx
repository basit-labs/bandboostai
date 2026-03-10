import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import AppShell from "@/components/app-shell";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  GraduationCap,
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  Timer,
  CheckCircle2,
  XCircle,
  Play,
  ArrowRight,
  Trophy,
} from "lucide-react";

type ExamPhase = "intro" | "listening" | "reading" | "writing" | "speaking" | "results";

interface SectionResult {
  module: string;
  score: number;
  total: number;
  percentage: number;
}

export default function ExamSimulationPage() {
  const [phase, setPhase] = useState<ExamPhase>("intro");
  const [listeningData, setListeningData] = useState<any>(null);
  const [readingData, setReadingData] = useState<any>(null);
  const [writingData, setWritingData] = useState<any>(null);
  const [speakingData, setSpeakingData] = useState<any>(null);
  const [listeningAnswers, setListeningAnswers] = useState<Record<string, string>>({});
  const [readingAnswers, setReadingAnswers] = useState<Record<string, string>>({});
  const [writingEssay, setWritingEssay] = useState("");
  const [speakingTranscript, setSpeakingTranscript] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [results, setResults] = useState<SectionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sectionTimes: Record<string, number> = {
    listening: 15 * 60,
    reading: 20 * 60,
    writing: 30 * 60,
    speaking: 10 * 60,
  };

  useEffect(() => {
    if (phase !== "intro" && phase !== "results" && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [phase, timeLeft]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const startExam = async () => {
    setLoading(true);
    try {
      const [lRes, rRes, wRes, sRes] = await Promise.all([
        apiRequest("GET", "/api/practice/session/listening"),
        apiRequest("GET", "/api/practice/session/reading"),
        apiRequest("GET", "/api/practice/session/writing"),
        apiRequest("GET", "/api/practice/session/speaking"),
      ]);
      const [lData, rData, wData, sData] = await Promise.all([lRes.json(), rRes.json(), wRes.json(), sRes.json()]);
      setListeningData(lData);
      setReadingData(rData);
      setWritingData(wData);
      setSpeakingData(sData);
      setPhase("listening");
      setTimeLeft(sectionTimes.listening);
    } catch (err: any) {
      toast({ title: "Error", description: "Could not load exam data. Please try again.", variant: "destructive" });
    }
    setLoading(false);
  };

  const finishSection = async () => {
    if (phase === "listening") {
      const questions = listeningData?.questions || [];
      const correct = questions.filter((q: any) => listeningAnswers[q.id] === q.correctAnswer).length;
      setResults(prev => [...prev, { module: "Listening", score: correct, total: questions.length, percentage: Math.round((correct / Math.max(questions.length, 1)) * 100) }]);
      setPhase("reading");
      setTimeLeft(sectionTimes.reading);
    } else if (phase === "reading") {
      const questions = readingData?.questions || [];
      const correct = questions.filter((q: any) => readingAnswers[q.id] === q.correctAnswer).length;
      setResults(prev => [...prev, { module: "Reading", score: correct, total: questions.length, percentage: Math.round((correct / Math.max(questions.length, 1)) * 100) }]);
      setPhase("writing");
      setTimeLeft(sectionTimes.writing);
    } else if (phase === "writing") {
      const wordCount = writingEssay.trim().split(/\s+/).filter(Boolean).length;
      const estimatedScore = Math.min(100, Math.round(Math.min(wordCount / 2, 50) + (wordCount > 100 ? 30 : 0) + (wordCount > 150 ? 20 : 0)));
      setResults(prev => [...prev, { module: "Writing", score: estimatedScore, total: 100, percentage: estimatedScore }]);
      setPhase("speaking");
      setTimeLeft(sectionTimes.speaking);
    } else if (phase === "speaking") {
      const wordCount = speakingTranscript.trim().split(/\s+/).filter(Boolean).length;
      const estimatedScore = Math.min(100, Math.round(Math.min(wordCount / 1, 40) + (wordCount > 30 ? 30 : 0) + (wordCount > 50 ? 30 : 0)));
      setResults(prev => [...prev, { module: "Speaking", score: estimatedScore, total: 100, percentage: estimatedScore }]);
      setPhase("results");
    }
  };

  const sectionIcons: Record<string, any> = { listening: Headphones, reading: BookOpen, writing: PenTool, speaking: Mic };
  const sectionColors: Record<string, string> = { listening: "chart-1", reading: "chart-2", writing: "chart-3", speaking: "chart-4" };

  if (phase === "intro") {
    return (
      <AppShell>
        <motion.div className="space-y-6 pb-20 md:pb-0 max-w-3xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-exam-title">
              <GraduationCap className="w-6 h-6 text-primary" />Exam Simulation
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Full mock exam experience with timed sections</p>
          </div>

          <Card>
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <GraduationCap className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">Mock Exam</h2>
                <p className="text-sm text-muted-foreground">Complete all 4 sections in order, just like the real exam.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {["listening", "reading", "writing", "speaking"].map(mod => {
                  const Icon = sectionIcons[mod];
                  return (
                    <div key={mod} className="p-4 rounded-lg border text-center">
                      <Icon className={`w-6 h-6 text-${sectionColors[mod]} mx-auto mb-2`} />
                      <p className="text-sm font-medium capitalize">{mod}</p>
                      <p className="text-xs text-muted-foreground">{Math.floor(sectionTimes[mod] / 60)} min</p>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground">Total duration: ~75 minutes</p>
              <Button size="lg" onClick={startExam} disabled={loading} data-testid="button-start-exam">
                <Play className="w-5 h-5 mr-2" />{loading ? "Loading..." : "Start Exam"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </AppShell>
    );
  }

  if (phase === "results") {
    const overallScore = results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length) : 0;
    const bandScore = Math.min(9, Math.round((overallScore / 100 * 4 + 3.5) * 10) / 10);

    return (
      <AppShell>
        <motion.div className="space-y-6 pb-20 md:pb-0 max-w-3xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-center">
            <Trophy className="w-12 h-12 text-chart-4 mx-auto mb-3" />
            <h2 className="text-2xl font-bold" data-testid="text-exam-complete">Exam Complete!</h2>
            <p className="text-muted-foreground text-sm mt-1">Here's your performance breakdown</p>
          </div>

          <Card className="bg-gradient-to-r from-primary/10 to-transparent border-primary/20">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">Estimated Band Score</p>
              <p className="text-4xl font-bold text-primary" data-testid="text-band-score">{bandScore}</p>
              <p className="text-sm text-muted-foreground mt-1">Overall: {overallScore}%</p>
            </CardContent>
          </Card>

          <div className="grid gap-3">
            {results.map((r, i) => (
              <Card key={i}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-${sectionColors[r.module.toLowerCase()]}/10 flex items-center justify-center`}>
                      {(() => { const Icon = sectionIcons[r.module.toLowerCase()]; return <Icon className={`w-5 h-5 text-${sectionColors[r.module.toLowerCase()]}`} />; })()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{r.module}</p>
                      <p className="text-xs text-muted-foreground">{r.score}/{r.total}</p>
                    </div>
                  </div>
                  <Badge variant={r.percentage >= 70 ? "default" : r.percentage >= 50 ? "secondary" : "destructive"}>
                    {r.percentage}%
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button className="w-full" onClick={() => { setPhase("intro"); setResults([]); setListeningAnswers({}); setReadingAnswers({}); setWritingEssay(""); setSpeakingTranscript(""); }} data-testid="button-retake-exam">
            Take Another Exam
          </Button>
        </motion.div>
      </AppShell>
    );
  }

  const renderMCQuestions = (questions: any[], answers: Record<string, string>, setAnswersFn: (a: Record<string, string>) => void) => (
    <div className="space-y-4">
      {questions.map((q: any, index: number) => {
        const options = (q.options as string[]) || [];
        return (
          <Card key={q.id} data-testid={`card-exam-q-${index}`}>
            <CardContent className="p-5">
              <p className="font-medium mb-3 text-sm"><span className="text-muted-foreground mr-2">Q{index + 1}.</span>{q.questionText}</p>
              <div className="space-y-2">
                {options.map((opt: string, oi: number) => (
                  <button key={oi} className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${answers[q.id] === opt ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                    onClick={() => setAnswersFn({ ...answers, [q.id]: opt })} data-testid={`option-exam-${q.id}-${oi}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${answers[q.id] === opt ? "border-primary bg-primary" : "border-muted-foreground/30"}`} />
                      <span>{opt}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const CurrentIcon = sectionIcons[phase] || GraduationCap;

  return (
    <AppShell>
      <motion.div className="space-y-6 pb-20 md:pb-0 max-w-4xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CurrentIcon className={`w-5 h-5 text-${sectionColors[phase]}`} />
            <h2 className="text-lg font-bold capitalize">{phase} Section</h2>
          </div>
          <Badge variant={timeLeft < 120 ? "destructive" : "secondary"} className="text-sm" data-testid="badge-exam-timer">
            <Timer className="w-3.5 h-3.5 mr-1" />{formatTime(timeLeft)}
          </Badge>
        </div>

        <div className="flex gap-1">
          {["listening", "reading", "writing", "speaking"].map(s => (
            <div key={s} className={`flex-1 h-2 rounded-full ${s === phase ? "bg-primary" : results.find(r => r.module.toLowerCase() === s) ? "bg-chart-2" : "bg-muted"}`} />
          ))}
        </div>

        {phase === "listening" && listeningData && renderMCQuestions(listeningData.questions || [], listeningAnswers, setListeningAnswers)}
        {phase === "reading" && readingData && renderMCQuestions(readingData.questions || [], readingAnswers, setReadingAnswers)}

        {phase === "writing" && writingData && (
          <div className="space-y-4">
            <Card className="bg-gradient-to-r from-chart-3/10 to-transparent border-chart-3/20">
              <CardContent className="p-6">
                <h3 className="font-bold mb-2">{writingData.questions?.[0]?.title}</h3>
                <p className="text-sm text-muted-foreground">{writingData.questions?.[0]?.promptText}</p>
              </CardContent>
            </Card>
            <Textarea
              value={writingEssay}
              onChange={(e) => setWritingEssay(e.target.value)}
              placeholder="Write your response here..."
              className="min-h-[250px] text-sm leading-relaxed resize-none"
              data-testid="textarea-exam-writing"
            />
            <p className="text-xs text-muted-foreground text-right">
              {writingEssay.trim().split(/\s+/).filter(Boolean).length} words
            </p>
          </div>
        )}

        {phase === "speaking" && speakingData && (
          <div className="space-y-4">
            <Card className="bg-gradient-to-r from-chart-4/10 to-transparent border-chart-4/20">
              <CardContent className="p-6">
                <h3 className="font-bold mb-2">{speakingData.questions?.[0]?.title}</h3>
                <p className="text-sm text-muted-foreground">{speakingData.questions?.[0]?.promptText}</p>
              </CardContent>
            </Card>
            <Textarea
              value={speakingTranscript}
              onChange={(e) => setSpeakingTranscript(e.target.value)}
              placeholder="Type your spoken response transcript here..."
              className="min-h-[150px] text-sm leading-relaxed resize-none"
              data-testid="textarea-exam-speaking"
            />
          </div>
        )}

        <Button className="w-full" onClick={finishSection} data-testid="button-next-section">
          {phase === "speaking" ? "Finish Exam" : "Next Section"}<ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </AppShell>
  );
}
