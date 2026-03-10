import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import AuthPage from "@/pages/auth";
import OnboardingPage from "@/pages/onboarding";
import DashboardPage from "@/pages/dashboard";
import ListeningPage from "@/pages/listening";
import ReadingPage from "@/pages/reading";
import WritingPage from "@/pages/writing";
import SpeakingPage from "@/pages/speaking";
import ProgressPage from "@/pages/progress";
import AdminPage from "@/pages/admin";
import ExamSimulationPage from "@/pages/exam-simulation";
import MistakesPage from "@/pages/mistakes";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/listening" component={ListeningPage} />
      <Route path="/reading" component={ReadingPage} />
      <Route path="/writing" component={WritingPage} />
      <Route path="/speaking" component={SpeakingPage} />
      <Route path="/progress" component={ProgressPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/exam" component={ExamSimulationPage} />
      <Route path="/mistakes" component={MistakesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
