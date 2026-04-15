import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, ChevronLeft, ChevronRight, ShieldAlert, AlertTriangle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { awardBadge, getAllBadges, getUserBadges } from "@/lib/actions/badges";
import { toast as sonnerToast } from "sonner";
import EmptyState from "@/components/EmptyState";

type Profile = Tables<"profiles">;

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-accent text-primary font-semibold",
  moderator: "bg-purple-500/15 text-purple-400",
  member: "bg-teal-500/15 text-teal-400",
  guest: "bg-muted text-muted-foreground",
};

const ROLES = ["guest", "member", "moderator", "admin"] as const;

const PAGE_SIZE = 20;

const AdminUsers = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [newRole, setNewRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmingRole, setConfirmingRole] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<Profile | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspending, setSuspending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const { toast } = useToast();

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load users", description: error.message, variant: "destructive" });
    }
    setProfiles((data as Profile[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let result = profiles;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.display_name?.toLowerCase().includes(q) ||
        p.user_id?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q)
      );
    }
    if (roleFilter !== "all") result = result.filter(p => p.role === roleFilter);
    if (statusFilter === "suspended") result = result.filter(p => !!p.suspended_at);
    if (statusFilter === "active") result = result.filter(p => !p.suspended_at);
    return result;
  }, [profiles, search, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const isSelf = (p: Profile) => p.user_id === currentUserId;

  const openEdit = (p: Profile) => {
    if (isSelf(p)) {
      toast({ title: "You cannot edit your own role", variant: "destructive" });
      return;
    }
    setEditing(p);
    setNewRole(p.role);
    setConfirmingRole(false);
  };

  const saveRole = async () => {
    if (!editing || newRole === editing.role) return;

    // If not confirming yet, show confirmation step
    if (!confirmingRole) {
      setConfirmingRole(true);
      return;
    }

    setSaving(true);
    const oldRole = editing.role;
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole as any })
      .eq("id", editing.id);
    if (error) {
      toast({ title: "Role change failed", description: error.message, variant: "destructive" });
    } else {
      await supabase.from("audit_logs").insert({
        action: "role_change",
        actor_id: currentUserId,
        target_type: "profile",
        target_id: editing.id,
        metadata: { from: oldRole, to: newRole, user_name: editing.display_name },
      });
      toast({ title: "Role updated", description: `${editing.display_name}: ${oldRole} → ${newRole}` });
      setProfiles(prev => prev.map(p => p.id === editing.id ? { ...p, role: newRole as any } : p));
      setEditing(null);
    }
    setSaving(false);
    setConfirmingRole(false);
  };

  const toggleLegacy = async (p: Profile) => {
    const newVal = !p.is_legacy_enabled;
    const { error } = await supabase.from("profiles").update({ is_legacy_enabled: newVal } as any).eq("id", p.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setProfiles(prev => prev.map(pr => pr.id === p.id ? { ...pr, is_legacy_enabled: newVal } : pr));
    }
  };

  const openSuspend = (p: Profile) => {
    if (isSelf(p)) {
      toast({ title: "You cannot suspend yourself", variant: "destructive" });
      return;
    }
    if (p.role === "admin") {
      toast({ title: "Cannot suspend another admin", description: "Remove admin role first.", variant: "destructive" });
      return;
    }
    setSuspendTarget(p);
    setSuspendReason("");
  };

  const handleSuspend = async () => {
    if (!suspendTarget) return;
    setSuspending(true);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("profiles")
      .update({ suspended_at: now, suspended_reason: suspendReason } as any)
      .eq("id", suspendTarget.id);
    if (error) {
      toast({ title: "Suspension failed", description: error.message, variant: "destructive" });
    } else {
      await supabase.from("audit_logs").insert({
        action: "suspend",
        actor_id: currentUserId,
        target_type: "profile",
        target_id: suspendTarget.id,
        metadata: { reason: suspendReason, user_name: suspendTarget.display_name },
      });
      toast({ title: "User suspended", description: suspendTarget.display_name });
      setProfiles(prev => prev.map(p => p.id === suspendTarget.id ? { ...p, suspended_at: now, suspended_reason: suspendReason } : p));
      setSuspendTarget(null);
      setSuspendReason("");
    }
    setSuspending(false);
  };

  const unsuspend = async (p: Profile) => {
    const { error } = await supabase
      .from("profiles")
      .update({ suspended_at: null, suspended_reason: null } as any)
      .eq("id", p.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await supabase.from("audit_logs").insert({
        action: "unsuspend",
        actor_id: currentUserId,
        target_type: "profile",
        target_id: p.id,
        metadata: { user_name: p.display_name },
      });
      setProfiles(prev => prev.map(pr => pr.id === p.id ? { ...pr, suspended_at: null, suspended_reason: null } : pr));
      toast({ title: "User unsuspended", description: p.display_name });
    }
  };

  const counts = useMemo(() => ({
    total: profiles.length,
    legacy: profiles.filter(p => p.is_legacy_enabled).length,
    suspended: profiles.filter(p => !!p.suspended_at).length,
    admins: profiles.filter(p => p.role === "admin").length,
    members: profiles.filter(p => p.role === "member").length,
  }), [profiles]);

  if (loading) return <p className="text-muted-foreground font-body">Loading users…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-heading text-primary">Users</h2>
        <div className="flex gap-3 text-xs font-body">
          <span className="bg-accent/10 text-accent px-3 py-1.5 rounded-full">{counts.total} total</span>
          {counts.suspended > 0 && (
            <span className="bg-destructive/10 text-destructive px-3 py-1.5 rounded-full">{counts.suspended} suspended</span>
          )}
          <span className="bg-muted text-muted-foreground px-3 py-1.5 rounded-full">{counts.legacy} legacy</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or location…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="pl-9 ms-input"
          />
        </div>
        <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[140px] ms-input"><SelectValue placeholder="All Roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ROLES.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[140px] ms-input"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {paged.length === 0 ? (
        <EmptyState
          icon={Search}
          iconClassName="text-muted-foreground"
          heading="No users found"
          body={search || roleFilter !== "all" || statusFilter !== "all" ? "Try adjusting your filters." : "No users in the system yet."}
        />
      ) : (
        <div className="ms-card rounded-xl overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-body">User</TableHead>
                <TableHead className="font-body">Role</TableHead>
                <TableHead className="font-body">Archetype</TableHead>
                <TableHead className="font-body">Joined</TableHead>
                <TableHead className="font-body">Legacy</TableHead>
                <TableHead className="font-body">Status</TableHead>
                <TableHead className="font-body w-[160px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map(p => (
                <TableRow key={p.id} className={p.suspended_at ? "opacity-60" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={p.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-muted">{p.display_name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-body text-sm">{p.display_name}</span>
                        {isSelf(p) && <span className="ml-1.5 text-[10px] text-accent font-body">(you)</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-body ${ROLE_COLORS[p.role] || ""}`}>
                      {p.role}
                    </span>
                  </TableCell>
                  <TableCell className="font-body text-sm text-muted-foreground capitalize">{p.pathway_type || "—"}</TableCell>
                  <TableCell className="font-body text-sm text-muted-foreground">{format(new Date(p.created_at), "d MMM yyyy")}</TableCell>
                  <TableCell>
                    <Switch checked={!!p.is_legacy_enabled} onCheckedChange={() => toggleLegacy(p)} />
                  </TableCell>
                  <TableCell>
                    {p.suspended_at ? (
                      <span className="text-xs text-destructive font-body flex items-center gap-1">
                        <ShieldAlert size={12} /> Suspended
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground font-body">Active</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => openEdit(p)} disabled={isSelf(p)}>
                        Edit
                      </Button>
                      {p.suspended_at ? (
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => unsuspend(p)}>Unsuspend</Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-destructive"
                          onClick={() => openSuspend(p)}
                          disabled={isSelf(p)}
                        >
                          Suspend
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-muted-foreground font-body">
            Page {page + 1} of {totalPages} ({filtered.length} users)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={14} /> Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              Next <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Role Dialog */}
      <Dialog open={!!editing} onOpenChange={open => { if (!open) { setEditing(null); setConfirmingRole(false); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-primary">Edit Role — {editing?.display_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Select value={newRole} onValueChange={v => { setNewRole(v); setConfirmingRole(false); }}>
              <SelectTrigger className="ms-input"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
              </SelectContent>
            </Select>

            {confirmingRole && newRole !== editing?.role && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle size={16} className="text-destructive shrink-0 mt-0.5" />
                <p className="text-xs font-body text-destructive">
                  Change <strong>{editing?.display_name}</strong> from <strong>{editing?.role}</strong> to <strong>{newRole}</strong>?
                  {newRole === "admin" && " This will grant full admin access."}
                </p>
              </div>
            )}

            <Button
              variant={confirmingRole ? "destructive" : "gold"}
              className="w-full"
              disabled={saving || newRole === editing?.role}
              onClick={saveRole}
            >
              {saving ? "Saving…" : confirmingRole ? "Confirm Role Change" : "Save"}
            </Button>
          </div>
          {editing && <BadgeAwardSection userId={editing.id} />}
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={!!suspendTarget} onOpenChange={open => !open && setSuspendTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-destructive">Suspend — {suspendTarget?.display_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-xs font-body text-muted-foreground">
              This will mark the user as suspended. They will not be removed from the system, but their status will be flagged.
            </p>
            <Textarea
              placeholder="Reason for suspension (required)…"
              value={suspendReason}
              onChange={e => setSuspendReason(e.target.value)}
              className="ms-input"
              rows={3}
            />
            <Button variant="destructive" className="w-full" disabled={suspending || !suspendReason.trim()} onClick={handleSuspend}>
              {suspending ? "Suspending…" : "Confirm Suspension"}
            </Button>
          </div>
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
      const [badges, userBadges] = await Promise.all([getAllBadges(), getUserBadges(userId)]);
      setAllBadges(badges);
      setEarnedIds(new Set(userBadges.map((ub: any) => ub.badge_id)));
    };
    load();
  }, [userId]);

  const available = allBadges.filter(b => !earnedIds.has(b.id));

  const handleAward = async () => {
    if (!selectedBadge) return;
    setAwarding(true);
    const badge = allBadges.find(b => b.id === selectedBadge);
    await awardBadge(userId, badge.slug);
    setEarnedIds(prev => new Set(prev).add(selectedBadge));
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
          <SelectTrigger className="ms-input flex-1"><SelectValue placeholder="Select badge..." /></SelectTrigger>
          <SelectContent>
            {available.map((b: any) => (
              <SelectItem key={b.id} value={b.id}>{b.emoji} {b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="gold" size="sm" disabled={!selectedBadge || awarding} onClick={handleAward}>Award</Button>
      </div>
    </div>
  );
};

export default AdminUsers;
