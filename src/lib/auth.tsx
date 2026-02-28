import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  property_id: string;
  owner_name: string;
  address: string;
  total_points: number;
  tax_discount_eligibility: number;
  mobile_number?: string;
  property_type?: string;
  family_members?: number;
  property_size?: number;
  profile_completed?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, propertyId: string, ownerName: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    let mockProfile: any = {
      id: userId,
      property_id: "DUMMY-PROP-001",
      owner_name: "Mock User",
      address: "123 Mock Street",
      total_points: 0,
      tax_discount_eligibility: 0,
      profile_completed: false
    };

    const mockData = localStorage.getItem(`profile_mock_${userId}`);
    if (mockData) {
      mockProfile = { ...mockProfile, ...JSON.parse(mockData) };
    }

    setProfile(mockProfile as Profile);
    setIsAdmin(false);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) return;

    // Save Mock fields
    const mockUpdates: any = { ...updates };

    // get existing
    const existingStr = localStorage.getItem(`profile_mock_${user.id}`);
    const existing = existingStr ? JSON.parse(existingStr) : {};

    localStorage.setItem(`profile_mock_${user.id}`, JSON.stringify({ ...existing, ...mockUpdates }));

    // optimistically update state
    setProfile(prev => prev ? { ...prev, ...updates } : null);
  };

  useEffect(() => {
    const sessionStr = localStorage.getItem("mock_session");
    if (sessionStr) {
      const s = JSON.parse(sessionStr);
      setSession(s);
      setUser(s.user);
      fetchProfile(s.user.id);
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    // Mock sign in
    const mockUser = { id: email, email } as User;
    const mockSession = { user: mockUser } as Session;
    localStorage.setItem("mock_session", JSON.stringify(mockSession));
    setUser(mockUser);
    setSession(mockSession);
    fetchProfile(mockUser.id);
  };

  const signUp = async (email: string, password: string, propertyId: string, ownerName: string) => {
    // Mock sign up
    const mockUser = { id: email, email } as User;
    const mockSession = { user: mockUser } as Session;

    localStorage.setItem("mock_session", JSON.stringify(mockSession));
    localStorage.setItem(`profile_mock_${email}`, JSON.stringify({
      property_id: propertyId,
      owner_name: ownerName,
      profile_completed: false,
      total_points: 0,
      tax_discount_eligibility: 0
    }));

    setUser(mockUser);
    setSession(mockSession);
    fetchProfile(mockUser.id);
  };

  const signOut = async () => {
    localStorage.removeItem("mock_session");
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const signInWithGoogle = async () => {
    // Mock Google sign-in: create a mock user session like email/password login
    const mockGoogleEmail = `google_user_${Date.now()}@gmail.com`;
    const mockUser = { id: mockGoogleEmail, email: mockGoogleEmail, app_metadata: { provider: 'google' }, user_metadata: { full_name: 'Google User', avatar_url: '' } } as unknown as User;
    const mockSession = { user: mockUser } as Session;

    localStorage.setItem("mock_session", JSON.stringify(mockSession));
    localStorage.setItem(`profile_mock_${mockGoogleEmail}`, JSON.stringify({
      property_id: `PROP-G-${Date.now().toString(36).toUpperCase()}`,
      owner_name: "Google User",
      profile_completed: false,
      total_points: 0,
      tax_discount_eligibility: 0
    }));

    setUser(mockUser);
    setSession(mockSession);
    fetchProfile(mockUser.id);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, isAdmin, loading, signIn, signUp, signOut, signInWithGoogle, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
