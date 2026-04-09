import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Activity, Mail, Lock, UserPlus, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Setup: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      setIsChecking(true);
      // Call with GET to check if admin already exists
      const { data, error } = await supabase.functions.invoke('setup-admin', {
        method: 'GET',
      });

      if (error) throw error;
      
      if (data && data.needsSetup === false) {
        setNeedsSetup(false);
        // If no setup needed, redirect to login after a short delay
        toast.info("System is already configured. Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setNeedsSetup(true);
      }
    } catch (err: any) {
      console.error("Setup check error:", err);
      // If function doesn't exist yet or other error, assume setup needed or handle gracefully
      setNeedsSetup(true);
    } finally {
      setIsChecking(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('setup-admin', {
        body: { email, password },
      });

      if (error) throw error;

      if (data && data.success) {
        toast.success("Admin account created successfully!");
        setNeedsSetup(false);
        setTimeout(() => navigate("/login"), 1500);
      } else if (data && data.error) {
        toast.error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create admin account");
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Checking system status...</p>
        </div>
      </div>
    );
  }

  if (needsSetup === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 text-center">
        <div className="max-w-md space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 text-green-500 mb-2">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">System Ready</h1>
          <p className="text-muted-foreground">
            The initial setup is already complete. You can now log in with your admin credentials.
          </p>
          <Button onClick={() => navigate("/login")} className="w-full h-11">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Premium Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] pointer-events-none grayscale">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      <div className="relative w-full max-w-xl">
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-xl shadow-primary/20 ring-4 ring-background">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Initial System Setup
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Welcome! Let's create your first administrator account.
          </p>
        </div>

        <Card className="border-border/40 shadow-2xl backdrop-blur-md bg-card/80 overflow-hidden ring-1 ring-white/10">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-500 to-primary animate-gradient-x" />
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <UserPlus className="h-6 w-6 text-primary" />
              Create Admin Account
            </CardTitle>
            <CardDescription className="text-base">
              This account will have full access to manage users, devices, and system settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAdmin} className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="email">Administrator Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 pl-10 bg-background/50 border-border/50 focus-visible:ring-primary"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 pl-10 bg-background/50 border-border/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <CheckCircle2 className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="h-12 pl-10 bg-background/50 border-border/50"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-500">Security Note</p>
                  <p className="text-muted-foreground">
                    This setup page will automatically disable itself once the first admin account is created. Ensure you save your credentials in a safe place.
                  </p>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-lg font-semibold group" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating System...</>
                ) : (
                  <>
                    Complete Setup
                    <Activity className="ml-2 h-5 w-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t border-border/40 py-4 justify-center">
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              Powered by <span className="font-bold text-foreground">Anedya IoT Ecosystem</span>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Setup;
