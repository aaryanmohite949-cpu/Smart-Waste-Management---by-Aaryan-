import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Rewards from "./pages/Rewards";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import { useLocation } from "react-router-dom";

const queryClient = new QueryClient();

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, profile, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" />;

  const isProfileComplete = profile?.profile_completed;
  if (profile && !isProfileComplete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/rewards" element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
