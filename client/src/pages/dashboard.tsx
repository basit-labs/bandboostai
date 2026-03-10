import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import AppShell from "@/components/app-shell";
import type { UserProfile, DailyTask } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Flame,
  Target,
  TrendingUp,
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  CheckCircle2,
  Circle,
  ArrowRight,
  Brain,
  Clock,
  Zap,
  BarChart3,
} from "lucide-react";

const skillIcons: Record<string, any> = {
  listening: Headphones,
  reading: BookOpen,
  writing: PenTool,
  speaking: Mic,
};

const skillColors: Record<string, string> = {
  listening: "text-chart-1 bg-chart-1/10",
  reading: "text-chart-2 bg-chart-2/10",
  writing: "text-chart-3 bg-chart-3/10",
  speaking: "text-chart-4 bg-chart-4/10",
};

function ScoreCard({ profile }: { profile?: UserProfile | null }) {
  const predictedScore = profile?.predictedScore ?? 5.5;
  const confidence = profile?.confidence ?? "Building data...";

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Predicted Score</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-primary" data-testid="text-predicted-score">
                {predictedScore.toFixed(1)}
              </span>
              <span className="text-lg text-muted-foreground">/ 9.0</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Target: {profile?.targetScore ?? "Not set"}
            </p>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className="mb-2" data-testid="badge-confidence">
              {confidence}
            </Badge>
            <div className="w-14 h-14 rounded-full border-4 border-primary/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StreakCard({ profile }: { profile?: UserProfile | null }) {
  const streak = profile?.streak ?? 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-chart-4/10 flex items-center justify-center">
            <Flame className="w-6 h-6 text-chart-4" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Study Streak</p>
            <p className="text-2xl font-bold" data-testid="text-streak">{streak} days</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StudyTimeCard({ profile }: { profile?: UserProfile | null }) {
  const minutes = profile?.totalStudyMinutes ?? 0;
  const hours = Math.floor(minutes / 60);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-chart-2/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-chart-2" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Study Time</p>
            <p className="text-2xl font-bold" data-testid="text-study-time">
              {hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SkillsOverview() {
  const { data: progress } = useQuery<{ listening: number; reading: number; writing: number; speaking: number }>({
    queryKey: ["/api/user/skills"],
  });

  const skills = [
    { name: "Listening", key: "listening", score: progress?.listening ?? 0 },
    { name: "Reading", key: "reading", score: progress?.reading ?? 0 },
    { name: "Writing", key: "writing", score: progress?.writing ?? 0 },
    { name: "Speaking", key: "speaking", score: progress?.speaking ?? 0 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Skill Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {skills.map((skill) => {
          const Icon = skillIcons[skill.key];
          const colors = skillColors[skill.key];
          return (
            <div key={skill.key} data-testid={`skill-progress-${skill.key}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center ${colors}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-medium">{skill.name}</span>
                </div>
                <span className="text-sm font-semibold">{skill.score}%</span>
              </div>
              <Progress value={skill.score} className="h-2" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function DailyTasksCard() {
  const { data: tasks, isLoading } = useQuery<DailyTask[]>({
    queryKey: ["/api/tasks/today"],
  });

  const completeMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await apiRequest("POST", `/api/tasks/${taskId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    },
  });

  const taskLinks: Record<string, string> = {
    listening: "/listening",
    reading: "/reading",
    writing: "/writing",
    speaking: "/speaking",
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Today's Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const completedCount = tasks?.filter((t) => t.completed).length ?? 0;
  const totalCount = tasks?.length ?? 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Today's Tasks
          </CardTitle>
          <Badge variant="secondary" data-testid="badge-tasks-progress">
            {completedCount}/{totalCount}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks && tasks.length > 0 ? (
          tasks.map((task) => {
            const Icon = skillIcons[task.taskType] || BookOpen;
            const colors = skillColors[task.taskType] || "text-primary bg-primary/10";
            return (
              <div
                key={task.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  task.completed ? "bg-muted/50 opacity-70" : "hover:bg-muted/30"
                }`}
                data-testid={`task-${task.id}`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colors}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${task.completed ? "line-through" : ""}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">{task.taskType}</p>
                </div>
                {task.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-chart-2 shrink-0" />
                ) : (
                  <Link href={taskLinks[task.taskType] || "/dashboard"}>
                    <Button size="sm" variant="ghost" className="shrink-0" data-testid={`button-start-task-${task.id}`}>
                      Start
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-chart-2" />
            <p className="font-medium">All caught up!</p>
            <p className="text-sm">Check back tomorrow for new tasks.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AIRecommendation() {
  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["/api/user/profile"],
  });

  const weakSkill = profile?.weakSkill ?? "speaking";
  const Icon = skillIcons[weakSkill] || Brain;

  return (
    <Card className="border-chart-3/20 bg-gradient-to-br from-chart-3/5 to-transparent">
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-chart-3/10 flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5 text-chart-3" />
          </div>
          <div>
            <p className="font-semibold text-sm mb-1">AI Recommendation</p>
            <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-ai-recommendation">
              Focus on <span className="font-medium text-foreground capitalize">{weakSkill}</span> practice today.
              Your performance in this area has room for improvement. Try completing today's {weakSkill} task to build consistency.
            </p>
            <Link href={`/${weakSkill}`}>
              <Button size="sm" variant="outline" className="mt-3" data-testid="button-practice-weak">
                Practice {weakSkill}
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["/api/user/profile"],
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <motion.div
        className="space-y-6 pb-20 md:pb-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Track your progress and keep improving</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <ScoreCard profile={profile} />
          <StreakCard profile={profile} />
          <StudyTimeCard profile={profile} />
        </div>

        <AIRecommendation />

        <div className="grid gap-6 lg:grid-cols-2">
          <DailyTasksCard />
          <SkillsOverview />
        </div>
      </motion.div>
    </AppShell>
  );
}
