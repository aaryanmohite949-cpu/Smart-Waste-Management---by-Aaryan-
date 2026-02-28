import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Trash2, Droplets, Leaf, Trophy, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface ProfileRow {
  property_id: string;
  owner_name: string;
  address: string;
  total_points: number;
}

interface WasteRow {
  property_id: string;
  wet_waste_weight: number;
  dry_waste_weight: number;
  segregation_correct: boolean;
  date: string;
}

export default function Admin() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [records, setRecords] = useState<WasteRow[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const [pRes, rRes] = await Promise.all([
        supabase.from("profiles").select("property_id, owner_name, address, total_points").order("total_points", { ascending: false }),
        supabase.from("daily_waste_records").select("property_id, wet_waste_weight, dry_waste_weight, segregation_correct, date"),
      ]);
      setProfiles((pRes.data as ProfileRow[]) || []);
      setRecords((rRes.data as WasteRow[]) || []);
    };
    fetch();
  }, []);

  const totalWet = records.reduce((s, r) => s + Number(r.wet_waste_weight), 0);
  const totalDry = records.reduce((s, r) => s + Number(r.dry_waste_weight), 0);
  const totalWaste = totalWet + totalDry;
  const leaderboard = profiles.slice(0, 10);

  // Daily aggregation for chart
  const dailyData = records.reduce<Record<string, { date: string; wet: number; dry: number }>>((acc, r) => {
    if (!acc[r.date]) acc[r.date] = { date: r.date, wet: 0, dry: 0 };
    acc[r.date].wet += Number(r.wet_waste_weight);
    acc[r.date].dry += Number(r.dry_waste_weight);
    return acc;
  }, {});
  const chartArray = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date)).slice(-30);

  const exportCSV = () => {
    const header = "Property ID,Owner Name,Address,Total Points\n";
    const rows = profiles.map((p) => `${p.property_id},${p.owner_name},${p.address},${p.total_points}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "waste_data_export.csv";
    a.click();
  };

  const stats = [
    { label: "Total Properties", value: profiles.length, icon: Users, color: "text-primary" },
    { label: "Total Waste (kg)", value: totalWaste.toFixed(1), icon: Trash2, color: "text-accent" },
    { label: "Wet Waste (kg)", value: totalWet.toFixed(1), icon: Droplets, color: "text-info" },
    { label: "Dry Waste (kg)", value: totalDry.toFixed(1), icon: Leaf, color: "text-warning" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm">City-wide waste management overview</p>
          </div>
          <Button onClick={exportCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="stat-card animate-fade-in">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                    <p className="text-xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* City-wide Chart */}
        <Card className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <CardHeader>
            <CardTitle className="text-sm font-medium">City-Wide Daily Waste (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {chartArray.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartArray}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                  <Legend />
                  <Bar dataKey="wet" name="Wet Waste" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="dry" name="Dry Waste" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">No records yet</div>
            )}
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="w-4 h-4 text-warning" /> Top 10 Segregating Households
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Property ID</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((p, i) => (
                  <TableRow key={p.property_id}>
                    <TableCell className="font-bold">{i + 1}</TableCell>
                    <TableCell className="font-mono text-xs">{p.property_id}</TableCell>
                    <TableCell>{p.owner_name}</TableCell>
                    <TableCell className="text-right font-bold text-primary">{p.total_points}</TableCell>
                  </TableRow>
                ))}
                {leaderboard.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">No users yet</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* All Properties */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">All Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property ID</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => (
                  <TableRow key={p.property_id}>
                    <TableCell className="font-mono text-xs">{p.property_id}</TableCell>
                    <TableCell>{p.owner_name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.address || "—"}</TableCell>
                    <TableCell className="text-right font-bold">{p.total_points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
