import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Tables } from "@/integrations/supabase/types";
import { awardBadge, getAllBadges, getUserBadges } from "@/lib/actions/badges";
import { toast as sonnerToast } from "sonner";

type Profile = Pick<Tables<"profiles">, "id" | "display_name" | "role" | "created_at"> & { is_legacy_enabled?: boolean };

const AdminUsers = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [newRole, setNewRole] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, role, created_at, is_legacy_enabled")
      .order("created_at", { ascending: false });
    setProfiles(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openEdit = (p: Profile) => {
    setEditing(p);
    setNewRole(p.role);
  };

  const saveRole = async () => {
    if (!editing) return;
    setSaving(true);
    // Direct update — admin RLS allows this via auth_user_role() check
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole as Tables<"profiles">["role"] })
      .eq("id", editing.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Role updated" });
      setProfiles((prev) => prev.map((p) => p.id === editing.id ? { ...p, role: newRole as Tables<"profiles">["role"] } : p));
      setEditing(null);
    }
    setSaving(false);
  };

  if (loading) return <p className="text-muted-foreground font-body">Loading users…</p>;

  return (
    <div>
      <h2 className="text-2xl font-heading text-primary mb-6">Users</h2>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-body">Name</TableHead>
              <TableHead className="font-body">Role</TableHead>
              <TableHead className="font-body">Joined</TableHead>
              <TableHead className="font-body w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-body">{p.display_name}</TableCell>
                <TableCell className="font-body capitalize">{p.role}</TableCell>
                <TableCell className="font-body text-muted-foreground">
                  {format(new Date(p.created_at), "d MMM yyyy")}
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-primary">Edit Role — {editing?.display_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="ms-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="guest">Guest</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="gold" className="w-full" disabled={saving} onClick={saveRole}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>

          {/* Badge Award Section */}
          {editing && <BadgeAwardSection userId={editing.id} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const BadgeAwardSection = ({ userId }: { userId: string }) => {
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set());
  const [selectedBadge, setSelectedBadge] = useState("");
  const [awarding, setAwarding] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [badges, userBadges] = await Promise.all([
        getAllBadges(),
        getUserBadges(userId),
      ]);
      setAllBadges(badges);
      setEarnedIds(new Set(userBadges.map((ub: any) => ub.badge_id)));
    };
    load();
  }, [userId]);

  const available = allBadges.filter((b) => !earnedIds.has(b.id));

  const handleAward = async () => {
    if (!selectedBadge) return;
    setAwarding(true);
    const badge = allBadges.find((b) => b.id === selectedBadge);
    await awardBadge(userId, badge.slug);
    setEarnedIds((prev) => new Set(prev).add(selectedBadge));
    setSelectedBadge("");
    sonnerToast.success("Badge awarded");
    setAwarding(false);
  };

  if (available.length === 0) return null;

  return (
    <div className="space-y-3 pt-3 border-t border-border">
      <h4 className="font-heading text-sm text-primary font-semibold">Award Badge</h4>
      <div className="flex gap-2">
        <Select value={selectedBadge} onValueChange={setSelectedBadge}>
          <SelectTrigger className="ms-input flex-1">
            <SelectValue placeholder="Select badge..." />
          </SelectTrigger>
          <SelectContent>
            {available.map((b: any) => (
              <SelectItem key={b.id} value={b.id}>
                {b.emoji} {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="gold" size="sm" disabled={!selectedBadge || awarding} onClick={handleAward}>
          Award
        </Button>
      </div>
    </div>
  );
};

export default AdminUsers;
