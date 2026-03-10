import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AppShell from "@/components/app-shell";
import type { UserProfile, UserProgress } from "@shared/schema";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  Target,
  Calendar,
  Flame,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";

export default function ProgressPage() {
  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/user/profile"],
  });

  const { data: progressData, isLoading: progressLoading } = useQuery<UserProgress[]>({
    queryKey: ["/api/user/progress"],
  });

  const { data: skills } = useQuery<{ listening: number; reading: number; writing: number; speaking: number }>({
    queryKey: ["/api/user/skills"],
  });

  const isLoading = profileLoading || progressLoading;

  const radarData = [
    { skill: "Listening", value: skills?.listening ?? 0, fullMark: 100 },
    { skill: "Reading", value: skills?.reading ?? 0, fullMark: 100 },
    { skill: "Writing", value: skills?.writing ?? 0, fullMark: 100 },
    { skill: "Speaking", value: skills?.speaking ?? 0, fullMark: 100 },
  ];

  const trendData = progressData
    ?.reduce((acc: any[], item) => {
      const existing = acc.find((a) => a.date === item.date);
      if (existing) {
        existing[item.skill] = item.score;
      } else {
        acc.push({ date: item.date, [item.skill]: item.score });
      }
      return acc;
    }, [])
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14) ?? [];

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
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
      >
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-progress-title">
            <BarChart3 className="w-6 h-6 text-primary" />
            Progress Analytics
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Track your improvement across all skills</p>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card data-testid="stat-predicted">
            <CardContent className="p-4 text-center">
              <Target className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{(profile?.predictedScore ?? 5.5).toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Predicted Score</p>
            </CardContent>
          </Card>
          <Card data-testid="stat-streak">
            <CardContent className="p-4 text-center">
              <Flame className="w-5 h-5 text-chart-4 mx-auto mb-2" />
              <p className="text-2xl font-bold">{profile?.streak ?? 0}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>
          <Card data-testid="stat-study">
            <CardContent className="p-4 text-center">
              <Calendar className="w-5 h-5 text-chart-2 mx-auto mb-2" />
              <p className="text-2xl font-bold">{Math.floor((profile?.totalStudyMinutes ?? 0) / 60)}h</p>
              <p className="text-xs text-muted-foreground">Study Time</p>
            </CardContent>
          </Card>
          <Card data-testid="stat-target">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-5 h-5 text-chart-3 mx-auto mb-2" />
              <p className="text-2xl font-bold">{profile?.targetScore ?? "N/A"}</p>
              <p className="text-xs text-muted-foreground">Target Score</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Skills Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64" data-testid="chart-radar">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="skill" className="text-xs" />
                    <Radar
                      name="Score"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Score Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64" data-testid="chart-trend">
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="listening" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="reading" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="writing" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="speaking" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    <div className="text-center">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Complete some practice to see trends</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Skill Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: "Listening", key: "listening", icon: Headphones, color: "chart-1" },
                { name: "Reading", key: "reading", icon: BookOpen, color: "chart-2" },
                { name: "Writing", key: "writing", icon: PenTool, color: "chart-3" },
                { name: "Speaking", key: "speaking", icon: Mic, color: "chart-4" },
              ].map((skill) => {
                const score = skills?.[skill.key as keyof typeof skills] ?? 0;
                return (
                  <div
                    key={skill.key}
                    className="p-4 rounded-xl border text-center"
                    data-testid={`breakdown-${skill.key}`}
                  >
                    <div className={`w-10 h-10 rounded-lg bg-${skill.color}/10 flex items-center justify-center mx-auto mb-2`}>
                      <skill.icon className={`w-5 h-5 text-${skill.color}`} />
                    </div>
                    <p className="text-2xl font-bold">{score}%</p>
                    <p className="text-xs text-muted-foreground">{skill.name}</p>
                    <Badge
                      variant="secondary"
                      className="mt-2 text-xs"
                    >
                      {score >= 80 ? "Strong" : score >= 50 ? "Average" : "Needs Work"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AppShell>
  );
}
