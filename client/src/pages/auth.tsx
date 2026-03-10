import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Zap, ArrowLeft, Sun, Moon } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useTheme } from "@/components/theme-provider";

const DISPOSABLE_DOMAINS = [
  "tempmail.com", "throwaway.email", "guerrillamail.com", "mailinator.com",
  "10minutemail.com", "yopmail.com", "trashmail.com", "sharklasers.com",
  "guerrillamailblock.com", "grr.la", "dispostable.com", "maildrop.cc",
  "temp-mail.org", "fakeinbox.com", "tempail.com", "getnada.com",
  "mohmal.com", "burnermail.io", "tempmailo.com", "emailondeck.com",
  "33mail.com", "mailnesia.com", "spamgourmet.com", "tempr.email",
  "discard.email", "harakirimail.com", "jetable.org", "tmail.ws",
  "mytemp.email", "throwam.com", "tmpmail.net", "tmpmail.org",
  "crazymailing.com", "mailcatch.com", "mintemail.com", "nomail.xl.cx",
  "temp-mail.io", "mail-temp.com", "tempinbox.com", "emailfake.com",
];

function isValidEmail(email: string): { valid: boolean; error?: string } {
  if (!email) return { valid: false, error: "Email is required" };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return { valid: false, error: "Please enter a valid email address" };
  const domain = email.split("@")[1].toLowerCase();
  if (DISPOSABLE_DOMAINS.includes(domain)) {
    return { valid: false, error: "Temporary/disposable email addresses are not allowed. Please use a valid email." };
  }
  return { valid: true };
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();

  const authMutation = useMutation({
    mutationFn: async () => {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body = isLogin
        ? { username, password }
        : { username, password, displayName, email };
      const res = await apiRequest("POST", endpoint, body);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      if (data.onboardingComplete) {
        navigate("/dashboard");
      } else {
        navigate("/onboarding");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (!isLogin) {
      const emailCheck = isValidEmail(email);
      if (!emailCheck.valid) {
        toast({ title: "Invalid Email", description: emailCheck.error, variant: "destructive" });
        return;
      }
    }
    authMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
      <div className="absolute top-4 left-4">
        <Link href="/">
          <Button variant="ghost" size="sm" data-testid="button-back-home">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>
      <div className="absolute top-4 right-4">
        <Button variant="ghost" size="sm" onClick={toggleTheme} data-testid="button-auth-theme">
          {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </Button>
      </div>
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold" data-testid="text-auth-title">BandBoost AI</h1>
          <p className="text-muted-foreground text-sm mt-1">Your AI-powered exam coach</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle data-testid="text-form-title">
              {isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? "Sign in to continue your practice"
                : "Start your exam preparation journey"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Full Name</Label>
                    <Input
                      id="displayName"
                      placeholder="Enter your name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      data-testid="input-display-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email (no temp mail)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      data-testid="input-email"
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  data-testid="input-username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={authMutation.isPending}
                data-testid="button-submit-auth"
              >
                {authMutation.isPending
                  ? "Please wait..."
                  : isLogin
                  ? "Sign In"
                  : "Create Account"}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <button
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setIsLogin(!isLogin)}
                data-testid="button-toggle-auth"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
