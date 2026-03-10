import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AppShell from "@/components/app-shell";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  Filter,
} from "lucide-react";

const moduleIcons: Record<string, any> = {
  listening: Headphones,
  reading: BookOpen,
  writing: PenTool,
  speaking: Mic,
};

const moduleColors: Record<string, string> = {
  listening: "chart-1",
  reading: "chart-2",
  writing: "chart-3",
  speaking: "chart-4",
};

export default function MistakesPage() {
  const [filter, setFilter] = useState<string>("all");

  const { data: mistakes, isLoading } = useQuery<any[]>({
    queryKey: ["/api/practice/mistakes", filter !== "all" ? `?module=${filter}` : ""],
  });

  const moduleFilters = ["all", "listening", "reading", "writing", "speaking"];

  const grouped = (mistakes || []).reduce((acc: Record<string, any[]>, m: any) => {
    if (!acc[m.moduleType]) acc[m.moduleType] = [];
    acc[m.moduleType].push(m);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <motion.div className="space-y-6 pb-20 md:pb-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-mistakes-title">
            <AlertTriangle className="w-6 h-6 text-destructive" />
            Mistake Review
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review your incorrect answers and learn from mistakes
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {moduleFilters.map(f => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              className="text-xs capitalize"
              onClick={() => setFilter(f)}
              data-testid={`filter-${f}`}
            >
              {f}
            </Button>
          ))}
        </div>

        {(!mistakes || mistakes.length === 0) ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-chart-2 mx-auto mb-4" />
              <h3 className="font-medium mb-1">No mistakes found</h3>
              <p className="text-sm text-muted-foreground">
                {filter === "all" ? "Great job! You haven't made any mistakes yet, or you haven't started practicing." : `No mistakes in ${filter} yet.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([moduleType, items]) => {
              const Icon = moduleIcons[moduleType] || AlertTriangle;
              const color = moduleColors[moduleType] || "primary";
              return (
                <div key={moduleType}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`w-5 h-5 text-${color}`} />
                    <h3 className="font-semibold capitalize">{moduleType}</h3>
                    <Badge variant="secondary" className="text-xs">{(items as any[]).length} mistakes</Badge>
                  </div>
                  <div className="space-y-3">
                    {(items as any[]).slice(0, 20).map((mistake: any, i: number) => (
                      <Card key={mistake.id} data-testid={`card-mistake-${moduleType}-${i}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <XCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium mb-2">{mistake.questionText || "Question"}</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div className="p-2 rounded bg-destructive/5 border border-destructive/20">
                                  <span className="text-muted-foreground">Your answer: </span>
                                  <span className="font-medium text-destructive">{mistake.userAnswer || "No answer"}</span>
                                </div>
                                <div className="p-2 rounded bg-chart-2/5 border border-chart-2/20">
                                  <span className="text-muted-foreground">Correct: </span>
                                  <span className="font-medium text-chart-2">{mistake.correctAnswer || "N/A"}</span>
                                </div>
                              </div>
                              {mistake.explanation && (
                                <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded">{mistake.explanation}</p>
                              )}
                              {mistake.aiFeedback && typeof mistake.aiFeedback === "object" && mistake.aiFeedback.suggestions && (
                                <div className="mt-2 space-y-1">
                                  {(mistake.aiFeedback.suggestions as string[]).map((s: string, j: number) => (
                                    <p key={j} className="text-xs text-muted-foreground">{s}</p>
                                  ))}
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-[10px] capitalize">{mistake.difficulty || "medium"}</Badge>
                                {mistake.attemptedAt && (
                                  <span className="text-[10px] text-muted-foreground">{new Date(mistake.attemptedAt).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </AppShell>
  );
}
