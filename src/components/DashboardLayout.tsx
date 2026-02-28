import { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Recycle, LayoutDashboard, Award, Shield, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

const userLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/rewards", label: "Rewards", icon: Award },
];

const adminLinks = [
  { to: "/admin", label: "Admin Panel", icon: Shield },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { profile, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [...userLinks, ...(isAdmin ? adminLinks : [])];

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border gradient-hero">
        <div className="flex items-center gap-2">
          <Recycle className="w-6 h-6 text-primary-foreground" />
          <span className="font-bold text-primary-foreground text-sm">Waste Mgmt</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-primary-foreground">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`${mobileOpen ? 'block' : 'hidden'} md:block w-full md:w-64 gradient-hero md:min-h-screen flex-shrink-0`}>
        <div className="p-6 hidden md:block">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sidebar-primary/20 flex items-center justify-center">
              <Recycle className="w-5 h-5 text-sidebar-primary" />
            </div>
            <div>
              <h2 className="font-bold text-sidebar-foreground text-sm">Smart Waste</h2>
              <p className="text-sidebar-foreground/60 text-xs">Management System</p>
            </div>
          </div>
        </div>

        {profile && (
          <div className="mx-4 mb-4 p-3 rounded-lg bg-sidebar-accent">
            <p className="text-sidebar-foreground text-xs font-medium">{profile.owner_name || "User"}</p>
            <p className="text-sidebar-foreground/60 text-xs">ID: {profile.property_id}</p>
          </div>
        )}

        <nav className="px-3 space-y-1">
          {links.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
