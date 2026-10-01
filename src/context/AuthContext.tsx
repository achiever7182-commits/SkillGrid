import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type {
  Session,
  User,
  SignInWithPasswordCredentials,
  SignUpWithPasswordCredentials,
  AuthResponse,
  AuthTokenResponsePassword,
} from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (credentials: SignUpWithPasswordCredentials) => Promise<AuthResponse>;
  signIn: (credentials: SignInWithPasswordCredentials) => Promise<AuthTokenResponsePassword>;
  signOut: () => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1. Initial session load
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (!mounted) return;
      if (error) {
        console.error("[AuthContext] Error getting initial session:", error.message);
      }
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
    });

    // 2. Auth state subscription
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!mounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signUp(credentials: SignUpWithPasswordCredentials): Promise<AuthResponse> {
    return await supabase.auth.signUp(credentials);
  }

  async function signIn(
    credentials: SignInWithPasswordCredentials,
  ): Promise<AuthTokenResponsePassword> {
    return await supabase.auth.signInWithPassword(credentials);
  }

  async function signOut(): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setSession(null);
      setUser(null);
    }
    return { error };
  }

  async function refreshSession(): Promise<void> {
    const {
      data: { session: refreshedSession },
    } = await supabase.auth.getSession();
    setSession(refreshedSession);
    setUser(refreshedSession?.user ?? null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
