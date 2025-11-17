import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, User } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  role: string | null;
}

export const AdminPanel = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id");

    if (profileError) {
      toast.error("Failed to load users");
      setLoading(false);
      return;
    }

    const userPromises = profiles.map(async (profile) => {
      const { data: authData } = await supabase.auth.admin.getUserById(profile.id);
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", profile.id)
        .maybeSingle();

      return {
        id: profile.id,
        email: authData?.user?.email || "Unknown",
        role: roleData?.role || null,
      };
    });

    const usersData = await Promise.all(userPromises);
    setUsers(usersData);
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: "admin" | "user") => {
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingRole) {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (error) {
        toast.error("Failed to update role");
      } else {
        toast.success("Role updated successfully");
        fetchUsers();
      }
    } else {
      const { error } = await supabase
        .from("user_roles")
        .insert([{ user_id: userId, role: newRole }]);

      if (error) {
        toast.error("Failed to assign role");
      } else {
        toast.success("Role assigned successfully");
        fetchUsers();
      }
    }
  };

  if (loading) {
    return <div className="text-center">Loading users...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold">Admin Panel</h2>
        <p className="text-muted-foreground">Manage user roles and permissions</p>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    {user.role === "admin" ? (
                      <Shield className="h-5 w-5 text-primary" />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">{user.email}</CardTitle>
                    <CardDescription>
                      {user.role ? `Role: ${user.role}` : "No role assigned"}
                    </CardDescription>
                  </div>
                </div>
                <Select
                  value={user.role || "user"}
                  onValueChange={(value: "admin" | "user") => handleRoleChange(user.id, value)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No users found</p>
        </div>
      )}
    </div>
  );
};
