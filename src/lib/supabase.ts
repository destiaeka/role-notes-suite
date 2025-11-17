import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

export const authService = {
  signUp: async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getSession: async (): Promise<{ session: Session | null; user: User | null }> => {
    const { data: { session } } = await supabase.auth.getSession();
    return { session, user: session?.user ?? null };
  },
};
