import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  TrendingUp,
  Target,
  Brain,
  BarChart3,
  Star,
  CheckCircle2,
  ArrowRight,
  Zap,
  Shield,
  Globe,
  ChevronDown,
  Sun,
  Moon,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/components/theme-provider";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
};

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 pt-20 pb-24 md:pt-28 md:pb-32">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-chart-2/5 blur-3xl" />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium" data-testid="badge-hero">
            <Zap className="w-3.5 h-3.5 mr-1.5" />
            AI-Powered Exam Preparation
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6" data-testid="text-hero-title">
            Ace Your{" "}
            <span className="text-primary">IELTS</span> &{" "}
            <span className="text-primary">PTE</span>
            <br />
            With AI Coaching
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed" data-testid="text-hero-description">
            Personalized study plans, AI-powered feedback, and realistic mock tests.
            Practice all four skills and predict your exam score with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="text-lg px-8 py-6 rounded-xl" data-testid="button-get-started">
                Start Free Practice
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-xl" data-testid="button-learn-more">
                Learn More
              </Button>
            </a>
          </div>
          <div className="flex items-center justify-center gap-8 mt-10 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-chart-2" />
              <span>Free to start</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-chart-2" />
              <span>AI feedback</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-chart-2" />
              <span>Score prediction</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Headphones,
      title: "Listening Practice",
      description: "Practice with real exam-style audio passages, podcasts, and comprehension questions.",
      color: "text-chart-1",
      bg: "bg-chart-1/10",
    },
    {
      icon: BookOpen,
      title: "Reading Mastery",
      description: "Timed reading passages with multiple question types including True/False/Not Given.",
      color: "text-chart-2",
      bg: "bg-chart-2/10",
    },
    {
      icon: PenTool,
      title: "Writing Workshop",
      description: "AI-evaluated essays with feedback on grammar, vocabulary, coherence, and task completion.",
      color: "text-chart-3",
      bg: "bg-chart-3/10",
    },
    {
      icon: Mic,
      title: "Speaking Studio",
      description: "Record responses, get pronunciation analysis, and track fluency improvements.",
      color: "text-chart-4",
      bg: "bg-chart-4/10",
    },
    {
      icon: Brain,
      title: "AI Tutor",
      description: "Adaptive recommendations based on your weak areas and performance trends.",
      color: "text-chart-5",
      bg: "bg-chart-5/10",
    },
    {
      icon: TrendingUp,
      title: "Score Prediction",
      description: "Get predicted exam scores with confidence levels based on your practice data.",
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Badge variant="secondary" className="mb-4">Features</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-features-title">
            Everything You Need to Succeed
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A comprehensive platform covering all four exam skills with AI-powered analysis and personalized learning paths.
          </p>
        </motion.div>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={fadeInUp}>
              <Card className="h-full border-border/50 hover:border-primary/30 transition-colors duration-300" data-testid={`card-feature-${index}`}>
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function ExamTypesSection() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Badge variant="secondary" className="mb-4">Exam Support</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Prepare for Any English Exam</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tailored preparation for the world's most recognized English proficiency exams.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card className="h-full border-primary/20 bg-gradient-to-br from-primary/5 to-transparent" data-testid="card-ielts">
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <Globe className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">IELTS</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  International English Language Testing System. Accepted by thousands of institutions worldwide for study, work, and migration.
                </p>
                <div className="space-y-2">
                  {["Academic & General Training", "Band scores 1-9", "4 skill sections", "AI band score prediction"].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-chart-2 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card className="h-full border-chart-4/20 bg-gradient-to-br from-chart-4/5 to-transparent" data-testid="card-pte">
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-2xl bg-chart-4/10 flex items-center justify-center mb-6">
                  <Target className="w-8 h-8 text-chart-4" />
                </div>
                <h3 className="text-2xl font-bold mb-3">PTE Academic</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Pearson Test of English Academic. Computer-based test accepted globally for study abroad and immigration applications.
                </p>
                <div className="space-y-2">
                  {["Computer-based format", "Score range 10-90", "Integrated skill tasks", "AI score estimation"].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-chart-2 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sarah Chen",
      score: "IELTS 8.0",
      text: "BandBoost's AI feedback on my writing was incredibly detailed. I improved from 6.5 to 8.0 in just two months of consistent practice.",
      avatar: "SC",
    },
    {
      name: "Raj Patel",
      score: "PTE 79",
      text: "The score prediction feature kept me motivated. Seeing my predicted score go up each week gave me the confidence I needed for test day.",
      avatar: "RP",
    },
    {
      name: "Maria Garcia",
      score: "IELTS 7.5",
      text: "The speaking practice module is a game changer. Being able to record, replay, and get instant feedback made all the difference.",
      avatar: "MG",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Badge variant="secondary" className="mb-4">Testimonials</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Success Stories</h2>
          <p className="text-muted-foreground text-lg">Join thousands of students who achieved their target scores.</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full" data-testid={`card-testimonial-${i}`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-chart-4 text-chart-4" />
                    ))}
                  </div>
                  <p className="text-foreground/90 mb-6 leading-relaxed italic">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.score}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Badge variant="secondary" className="mb-4">Pricing</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-muted-foreground text-lg">Start free, upgrade when you're ready.</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              name: "Free",
              price: "$0",
              period: "forever",
              features: ["5 daily practice tasks", "Basic reading & listening", "Limited AI feedback", "Progress tracking"],
              popular: false,
            },
            {
              name: "Pro",
              price: "$19",
              period: "/month",
              features: ["Unlimited practice", "Full AI scoring", "Score prediction", "Mock tests", "Speaking analysis", "Priority support"],
              popular: true,
            },
            {
              name: "Premium",
              price: "$39",
              period: "/month",
              features: ["Everything in Pro", "1-on-1 AI tutoring", "Custom study plans", "Advanced analytics", "Exam guarantee", "Offline access"],
              popular: false,
            },
          ].map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card
                className={`h-full relative ${plan.popular ? "border-primary shadow-lg scale-105" : ""}`}
                data-testid={`card-pricing-${plan.name.toLowerCase()}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  <div className="space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-chart-2 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/auth">
                    <Button className="w-full" variant={plan.popular ? "default" : "outline"} data-testid={`button-pricing-${plan.name.toLowerCase()}`}>
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "How does the AI scoring work?",
      a: "Our AI analyzes your responses across multiple dimensions including grammar, vocabulary, coherence, and task completion. Scores are labeled as practice estimates to help you gauge your readiness.",
    },
    {
      q: "Is BandBoost suitable for both IELTS and PTE?",
      a: "Yes! BandBoost supports both IELTS (Academic & General Training) and PTE Academic with exam-specific content, question types, and scoring criteria.",
    },
    {
      q: "How accurate is the score prediction?",
      a: "Our prediction engine uses your performance data across all skill areas, study consistency, and historical trends. While no prediction is perfect, our estimates typically fall within 0.5 bands of actual exam scores.",
    },
    {
      q: "Can I use BandBoost on my phone?",
      a: "Absolutely! BandBoost is built as a mobile-first Progressive Web App. You can install it on your phone's home screen for an app-like experience with offline support.",
    },
    {
      q: "How long should I study before taking the exam?",
      a: "It depends on your current level and target score. BandBoost generates a personalized study plan during onboarding. Most students see significant improvement within 4-8 weeks of consistent practice.",
    },
  ];

  return (
    <section id="faq" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Badge variant="secondary" className="mb-4">FAQ</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
        </motion.div>
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className="cursor-pointer"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                data-testid={`card-faq-${i}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium pr-4">{faq.q}</h3>
                    <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${openIndex === i ? "rotate-180" : ""}`} />
                  </div>
                  {openIndex === i && (
                    <motion.p
                      className="text-muted-foreground mt-3 leading-relaxed text-sm"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                    >
                      {faq.a}
                    </motion.p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-muted/30 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">BandBoost AI</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; 2026 BandBoost AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function Navbar() {
  const { theme, toggleTheme } = useTheme();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg" data-testid="text-brand-name">BandBoost AI</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleTheme} data-testid="button-landing-theme">
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>
          <Link href="/auth">
            <Button variant="outline" size="sm" data-testid="button-login">Log In</Button>
          </Link>
          <Link href="/auth">
            <Button size="sm" data-testid="button-signup">Sign Up</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <ExamTypesSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <Footer />
    </div>
  );
}
