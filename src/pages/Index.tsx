import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Recycle, ArrowRight, BarChart3, Award, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate("/dashboard");
  }, [user, loading]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="gradient-hero text-primary-foreground">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 text-sm mb-6">
              <Wifi className="w-3 h-3" /> IoT-Powered Solution
            </div>
            <h1 className="text-4xl md:text-5xl font-bold font-display leading-tight">
              Smart Integrated<br />Waste Management
            </h1>
            <p className="mt-4 text-lg text-primary-foreground/70 max-w-lg">
              Track waste disposal, earn rewards for proper segregation, and contribute to a cleaner city — all powered by IoT smart dustbins.
            </p>
            <div className="mt-8 flex gap-3">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Recycle, title: "Automatic Tracking", desc: "IoT dustbins automatically record waste type, weight, and segregation status." },
            { icon: BarChart3, title: "Real-time Dashboard", desc: "Monitor your daily and monthly waste patterns with interactive charts." },
            { icon: Award, title: "Earn Rewards", desc: "Get points for proper segregation and unlock tax discounts for your household." },
          ].map((f) => (
            <div key={f.title} className="text-center p-6 rounded-xl stat-card">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
                <f.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Smart Waste Management System © {new Date().getFullYear()} — Powered by IoT
      </footer>
    </div>
  );
}
