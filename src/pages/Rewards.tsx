import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Award, Gift, CheckCircle2, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RewardTier {
  id: string;
  points_required: number;
  tax_discount_percentage: number;
  label: string;
}

export default function Rewards() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [rewards, setRewards] = useState<RewardTier[]>([]);

  useEffect(() => {
    // Generate mock reward tiers instead of fetching from Supabase
    const dummyRewards: RewardTier[] = [
      { id: "1", points_required: 201, tax_discount_percentage: 5, label: "Bronze Tier" },
      { id: "2", points_required: 501, tax_discount_percentage: 10, label: "Silver Tier" },
      { id: "3", points_required: 1000, tax_discount_percentage: 20, label: "Gold Tier" },
    ];
    setRewards(dummyRewards);

    // Listen to points updates dynamically
    const handleUpdate = () => {
      // Force a re-render to pick up new total_points from profile context if needed
      // Actually, profile context handles its own state updates and will re-render naturally
    };
    window.addEventListener('waste_data_updated', handleUpdate);
    return () => window.removeEventListener('waste_data_updated', handleUpdate);
  }, []);

  const totalPoints = profile?.total_points ?? 0;
  const currentDiscount = profile?.tax_discount_eligibility ?? 0;

  const handleRedeem = () => {
    toast({
      title: "Discount Applied!",
      description: `Your ${currentDiscount}% tax discount has been noted for the next billing cycle.`,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold font-display">Rewards & Discounts</h1>
          <p className="text-muted-foreground text-sm">Earn points through proper waste segregation</p>
        </div>

        {/* Current Status */}
        <Card className="gradient-primary text-primary-foreground">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 text-sm">Your Points</p>
                <p className="text-4xl font-bold mt-1">{totalPoints.toLocaleString()}</p>
              </div>
              <Award className="w-12 h-12 text-primary-foreground/40" />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <p className="text-sm text-primary-foreground/80">Current tax discount:</p>
              <span className="text-lg font-bold">{currentDiscount}%</span>
            </div>
            {currentDiscount > 0 && (
              <Button
                onClick={handleRedeem}
                className="mt-4 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <Gift className="w-4 h-4 mr-2" /> Redeem Discount
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Reward Tiers */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Reward Tiers</h2>
          {rewards.map((tier) => {
            const unlocked = totalPoints >= tier.points_required;
            const progress = Math.min((totalPoints / tier.points_required) * 100, 100);
            return (
              <Card key={tier.id} className={`transition-all ${unlocked ? "border-primary/50 shadow-md" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {unlocked ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span className="font-semibold text-sm">{tier.label}</span>
                    </div>
                    <span className="text-sm font-bold text-primary">{tier.tax_discount_percentage}% off</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {unlocked ? "Unlocked!" : `${totalPoints} / ${tier.points_required} points`}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
