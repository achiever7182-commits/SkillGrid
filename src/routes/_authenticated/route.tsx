import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) throw redirect({ to: "/auth" });
    
    // Check if user is blocked
    const { data: profile } = await supabase
      .from("profiles")
      .select("blocked")
      .eq("id", authData.user.id)
      .single();
      
    if (profile?.blocked) {
      await supabase.auth.signOut();
      throw redirect({ to: "/auth" });
    }
    
    return { user: authData.user };
  },
  component: () => <Outlet />,
});
