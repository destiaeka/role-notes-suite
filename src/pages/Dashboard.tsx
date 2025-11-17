import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FileText, LogOut, Settings, Plus } from "lucide-react";
import { NotesList } from "@/components/NotesList";
import { AdminPanel } from "@/components/AdminPanel";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<"notes" | "admin">("notes");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  const handleSignOut = async () => {
    const { error } = await authService.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/auth");
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card p-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">Private Notes</h1>
        </div>

        <nav className="space-y-2">
          <Button
            variant={activeTab === "notes" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("notes")}
          >
            <FileText className="mr-2 h-4 w-4" />
            My Notes
          </Button>
          {isAdmin && (
            <Button
              variant={activeTab === "admin" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("admin")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Admin Panel
            </Button>
          )}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="mb-4 rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">{user?.email}</p>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? "Admin" : "User"}
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {activeTab === "notes" ? (
          <NotesList userId={user?.id || ""} />
        ) : (
          <AdminPanel />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
