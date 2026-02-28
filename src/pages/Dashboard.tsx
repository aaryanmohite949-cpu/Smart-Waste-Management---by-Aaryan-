import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Droplets, Leaf, Scale, CheckCircle2, XCircle, Award, Percent, RefreshCw, AlertCircle
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { getWasteStats, initializeMockData, addSimulatedEntry, WasteRecord } from "@/lib/wasteData";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, parseISO, isWithinInterval } from "date-fns";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    if (!user || !profile) return;
    initializeMockData(user.id, profile.property_id || "mock-prop");
    const data = getWasteStats(user.id);
    setStats(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('waste_data_updated', handleUpdate);
    return () => window.removeEventListener('waste_data_updated', handleUpdate);
  }, [user, profile]);

  const handleSimulate = () => {
    if (!user || !profile) return;
    addSimulatedEntry(user.id, profile.property_id || "mock-prop");
  };

  if (loading || !stats) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center text-muted-foreground">Loading dashboard...</div>
      </DashboardLayout>
    );
  }

  const todayWet = stats.today.wet_waste_weight || 0;
  const todayDry = stats.today.dry_waste_weight || 0;
  const todaySegregation = stats.today.wet_waste_weight > 0 ? stats.today.segregation_correct : null;
  const monthlyTotal = stats.monthlyTotal || 0;

  const totalPoints = profile?.total_points || 0;
  const currentDiscount = profile?.tax_discount_eligibility || 0;

  const displayStats = [
    { label: "Today's Wet Waste", value: `${todayWet.toFixed(1)} kg`, icon: Droplets, color: "text-blue-500" },
    { label: "Today's Dry Waste", value: `${todayDry.toFixed(1)} kg`, icon: Leaf, color: "text-amber-500" },
    { label: "Monthly Total", value: `${monthlyTotal.toFixed(1)} kg`, icon: Scale, color: "text-purple-500" },
    { label: "Segregation Status", value: todaySegregation === null ? "No data today" : todaySegregation ? "GOOD" : "POOR", icon: todaySegregation ? CheckCircle2 : (todaySegregation === null ? AlertCircle : XCircle), color: todaySegregation ? "text-green-500" : (todaySegregation === null ? "text-gray-400" : "text-red-500") },
    { label: "Total Points", value: totalPoints.toLocaleString(), icon: Award, color: "text-amber-600" },
    { label: "Tax Discount", value: `${currentDiscount}%`, icon: Percent, color: "text-green-600" },
  ];

  // Prepare chart Data
  // 1. Daily Waste Chart (Today/Recent 7 days Bar graph)
  const recent7Days = stats.history.slice(-7);
  const dailyBarData = recent7Days.map((r: any) => ({
    date: r.date.slice(5), // MM-DD
    wet: r.wet_waste_weight,
    dry: r.dry_waste_weight
  }));

  // 2. Wet vs Dry Pie Chart (Monthly)
  const pieData = [
    { name: "Wet Waste", value: stats.monthlyWet },
    { name: "Dry Waste", value: stats.monthlyDry }
  ];
  const pieColors = ["#3b82f6", "#f59e0b"]; // Blue, Amber

  // 3. Monthly Trend Line Chart
  const currentMonthStart = startOfMonth(new Date());
  const currentMonthEnd = endOfMonth(new Date());

  // Create array of all days in month up to today to show trend
  const todayDt = new Date();
  const daysInMonthToDate = eachDayOfInterval({
    start: currentMonthStart,
    end: todayDt > currentMonthEnd ? currentMonthEnd : todayDt
  });

  const monthlyTrendData = daysInMonthToDate.map(day => {
    const dStr = format(day, "yyyy-MM-dd");
    const record = stats.history.find((r: any) => r.date === dStr);
    return {
      date: format(day, "dd"),
      total: record ? (record.wet_waste_weight + record.dry_waste_weight) : 0
    };
  });

  // 4. Segregation Score Chart (Pie or Bar showing percentage of Good/Poor days this month)
  const thisMonthRecords = stats.history.filter((r: any) => isWithinInterval(parseISO(r.date), { start: currentMonthStart, end: currentMonthEnd }));
  const goodDays = thisMonthRecords.filter((r: any) => r.segregation_correct).length;
  const poorDays = thisMonthRecords.length - goodDays;
  const segregationData = [
    { name: "Good Segregation", value: goodDays },
    { name: "Poor Segregation", value: poorDays }
  ];
  const segColors = ["#22c55e", "#ef4444"]; // Green, Red

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display text-gray-900">
              Welcome, {profile?.owner_name || "User"}!
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Property ID: {profile?.property_id}</p>
          </div>
          <Button onClick={handleSimulate} className="bg-green-600 hover:bg-green-700 shadow-md flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Simulate Waste Entry
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {displayStats.map((stat) => (
            <Card key={stat.label} className="border-none shadow-md hover:shadow-lg transition-shadow bg-white">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold mt-2 text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-gray-50 ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {stats.history.length === 0 && (
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-center">
            <h3 className="text-lg font-bold text-blue-900">No data available yet</h3>
            <p className="text-blue-700 mt-2">Click the "Simulate Waste Entry" button to generate mock data!</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Daily Waste Chart */}
          <Card className="shadow-md border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800">Recent 7 Days Waste (kg)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dailyBarData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6b7280" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" />
                  <Bar dataKey="wet" name="Wet Waste" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                  <Bar dataKey="dry" name="Dry Waste" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 3. Monthly Trend Line Chart */}
          <Card className="shadow-md border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800">Monthly Trend Total (kg)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6b7280" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="total" name="Total Waste" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 2. Wet vs Dry Pie Chart */}
          <Card className="shadow-md border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800">Monthly Wet vs Dry Spread</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center flex-col items-center">
              {stats.monthlyTotal > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" label>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-gray-400">No data for pie chart</div>
              )}
            </CardContent>
          </Card>

          {/* 4. Segregation Score Chart */}
          <Card className="shadow-md border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg text-gray-800">Monthly Segregation Performance</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center flex-col items-center">
              {thisMonthRecords.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={segregationData} cx="50%" cy="50%" innerRadius={0} outerRadius={90} dataKey="value" label>
                      {segregationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={segColors[index % segColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-gray-400">No data available</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
