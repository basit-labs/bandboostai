import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Target, BookOpen, Clock, Brain, Zap, GraduationCap } from "lucide-react";

const steps = [
  {
    title: "Which exam are you preparing for?",
    subtitle: "We'll tailor your study plan to the right format",
    icon: Target,
    field: "examType",
    options: [
      { value: "ielts", label: "IELTS", desc: "Academic or General Training" },
      { value: "pte", label: "PTE Academic", desc: "Pearson Test of English" },
    ],
  },
  {
    title: "What's your current English level?",
    subtitle: "This helps us set the right difficulty",
    icon: GraduationCap,
    field: "currentLevel",
    options: [
      { value: "beginner", label: "Beginner", desc: "A1-A2 level" },
      { value: "intermediate", label: "Intermediate", desc: "B1-B2 level" },
      { value: "advanced", label: "Advanced", desc: "C1-C2 level" },
    ],
  },
  {
    title: "What's your target score?",
    subtitle: "We'll create milestones to get you there",
    icon: Target,
    field: "targetScore",
    options: [
      { value: "6.0", label: "6.0 / 50", desc: "Competent user" },
      { value: "6.5", label: "6.5 / 58", desc: "Competent+" },
      { value: "7.0", label: "7.0 / 65", desc: "Good user" },
      { value: "7.5", label: "7.5 / 73", desc: "Very good user" },
      { value: "8.0+", label: "8.0+ / 79+", desc: "Expert user" },
    ],
  },
  {
    title: "Which skill do you find most challenging?",
    subtitle: "We'll prioritize extra practice in this area",
    icon: Brain,
    field: "weakSkill",
    options: [
      { value: "listening", label: "Listening", desc: "Understanding audio" },
      { value: "reading", label: "Reading", desc: "Comprehension & speed" },
      { value: "writing", label: "Writing", desc: "Essays & summaries" },
      { value: "speaking", label: "Speaking", desc: "Fluency & pronunciation" },
    ],
  },
  {
    title: "How much time can you study daily?",
    subtitle: "We'll create a realistic daily schedule",
    icon: Clock,
    field: "dailyStudyTime",
    options: [
      { value: "15", label: "15 minutes", desc: "Quick sessions" },
      { value: "30", label: "30 minutes", desc: "Focused practice" },
      { value: "60", label: "1 hour", desc: "Comprehensive study" },
      { value: "120", label: "2+ hours", desc: "Intensive preparation" },
    ],
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const currentStep = steps[step];

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/user/profile", answers);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSelect = (value: string) => {
    setAnswers({ ...answers, [currentStep.field]: value });
  };

  const handleNext = () => {
    if (!answers[currentStep.field]) {
      toast({ title: "Please select an option", variant: "destructive" });
      return;
    }
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      saveMutation.mutate();
    }
  };

  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg">BandBoost AI</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 mt-4">
            <motion.div
              className="bg-primary h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Step {step + 1} of {steps.length}</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <currentStep.icon className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-2" data-testid="text-onboarding-title">
                {currentStep.title}
              </h2>
              <p className="text-muted-foreground text-sm">{currentStep.subtitle}</p>
            </div>

            <div className="space-y-3">
              {currentStep.options.map((option) => (
                <Card
                  key={option.value}
                  className={`cursor-pointer transition-all duration-200 ${
                    answers[currentStep.field] === option.value
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "hover:border-primary/30"
                  }`}
                  onClick={() => handleSelect(option.value)}
                  data-testid={`card-option-${option.value}`}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        answers[currentStep.field] === option.value
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {answers[currentStep.field] === option.value && (
                        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-8">
          <Button
            variant="ghost"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            data-testid="button-onboarding-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={saveMutation.isPending}
            data-testid="button-onboarding-next"
          >
            {step === steps.length - 1
              ? saveMutation.isPending
                ? "Saving..."
                : "Get Started"
              : "Continue"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
