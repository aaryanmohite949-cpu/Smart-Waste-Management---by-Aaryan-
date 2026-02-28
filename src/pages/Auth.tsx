import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Recycle, Leaf, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [ownerName, setOwnerName] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(loginEmail, loginPassword);
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(signupEmail, signupPassword, propertyId, ownerName);
      toast({ title: "Account created!", description: "Please check your email to verify your account." });
    } catch (err: any) {
      toast({ title: "Signup failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Google Login failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mx-auto">
            <Recycle className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Smart Waste Management
          </h1>
          <p className="text-muted-foreground text-sm">
            IoT-Powered Waste Tracking & Rewards System
          </p>
        </div>

        <Card className="shadow-xl border-border/50">
          <Tabs defaultValue="login">
            <CardHeader className="pb-3">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Register</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="you@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="property-id">Property ID</Label>
                    <Input id="property-id" placeholder="e.g. PROP-001" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="owner-name">Owner Name</Label>
                    <Input id="owner-name" placeholder="Full name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" placeholder="you@example.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type="password" placeholder="Min 6 characters" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required minLength={6} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Register"}
                  </Button>
                </form>
              </TabsContent>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  type="button"
                  disabled={loading}
                  className="w-full mt-4"
                  onClick={handleGoogleLogin}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google
                </Button>
              </div>
            </CardContent>
          </Tabs>
        </Card>

        <div className="flex items-center justify-center gap-6 text-muted-foreground text-xs">
          <span className="flex items-center gap-1"><Leaf className="w-3 h-3" /> Eco-Friendly</span>
          <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure</span>
          <span className="flex items-center gap-1"><Recycle className="w-3 h-3" /> Smart IoT</span>
        </div>
      </div>
    </div>
  );
}
