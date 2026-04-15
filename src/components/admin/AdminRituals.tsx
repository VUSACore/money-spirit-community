import { useEffect, useState } from "react";
import { format, nextMonday, isThisWeek, isFuture, isPast, startOfWeek } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Plus, Pencil, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import EmptyState from "@/components/EmptyState";
import type { Tables } from "@/integrations/supabase/types";

type Ritual = Tables<"rituals"> & { completion_count?: number };

const logAudit = async (action: string, targetId: string, metadata: Record<string, unknown> = {}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("audit_logs").insert({
    action, actor_id: user.id, target_type: "ritual", target_id: targetId, metadata,
  });
};

const getWeekStatus = (weekOf: string) => {
  const d = new Date(weekOf + "T00:00:00");
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  if (isThisWeek(d, { weekStartsOn: 1 })) return { label: "This week", cls: "bg-teal-500/15 text-teal-400" };
  if (isFuture(d) && d > weekStart) return { label: "Upcoming", cls: "bg-blue-500/15 text-blue-400" };
  if (isPast(d)) return { label: "Past", cls: "bg-muted text-muted-foreground" };
  return { label: "Scheduled", cls: "bg-blue-500/15 text-blue-400" };
};

const AdminRituals = () => {
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Partial<Ritual> | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Ritual | null>(null);
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase.from("rituals").select("*").order("week_of", { ascending: false });
    if (!data) { setLoading(false); return; }
    const enriched = await Promise.all(data.map(async r => {
      const { count } = await supabase.from("ritual_completions").select("id", { count: "exact", head: true }).eq("ritual_id", r.id);
      return { ...r, completion_count: count || 0 };
    }));
    setRituals(enriched);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setModal({
      title: "",
      description: "",
      reflection_prompt: "",
      week_of: format(nextMonday(new Date()), "yyyy-MM-dd"),
      published: false,
    });
  };

  const openEdit = (r: Ritual) => setModal(r);

  const save = async () => {
    if (!modal?.title?.trim()) {
      toast({ title: "Title required", variant: "destructive" }); return;
    }
    if (!modal?.description?.trim()) {
      toast({ title: "Description required", variant: "destructive" }); return;
    }
    if (!modal?.week_of) {
      toast({ title: "Week date required", variant: "destructive" }); return;
    }

    // Check for duplicate week_of (same week, different ritual)
    const existingForWeek = rituals.find(r => r.week_of === modal.week_of && r.id !== modal.id && r.published);
    if (modal.published && existingForWeek) {
      toast({
        title: "Week conflict",
        description: `"${existingForWeek.title}" is already published for this week. Unpublish it first or choose a different week.`,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const isEdit = !!modal.id;

    if (isEdit) {
      const { error } = await supabase.from("rituals").update({
        title: modal.title!.trim(),
        description: modal.description!.trim(),
        reflection_prompt: modal.reflection_prompt?.trim() || null,
        week_of: modal.week_of,
        published: modal.published ?? false,
      }).eq("id", modal.id!);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSaving(false); return; }
      await logAudit("ritual_update", modal.id!, { title: modal.title, published: modal.published });
      toast({ title: "Ritual updated" });
    } else {
      const { data, error } = await supabase.from("rituals").insert({
        title: modal.title!.trim(),
        description: modal.description!.trim(),
        reflection_prompt: modal.reflection_prompt?.trim() || null,
        week_of: modal.week_of,
        published: modal.published ?? false,
      }).select("id").single();
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSaving(false); return; }
      await logAudit("ritual_create", data.id, { title: modal.title });
      toast({ title: "Ritual created" });
    }
    setSaving(false);
    setModal(null);
    load();
  };

  const togglePublish = async (r: Ritual) => {
    // Check for week conflict when publishing
    if (!r.published) {
      const conflict = rituals.find(x => x.week_of === r.week_of && x.id !== r.id && x.published);
      if (conflict) {
        toast({ title: "Week conflict", description: `"${conflict.title}" is already published for this week.`, variant: "destructive" });
        return;
      }
    }
    const { error } = await supabase.from("rituals").update({ published: !r.published }).eq("id", r.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setRituals(prev => prev.map(x => x.id === r.id ? { ...x, published: !r.published } : x));
    await logAudit(r.published ? "ritual_unpublish" : "ritual_publish", r.id, { title: r.title });
    toast({ title: r.published ? "Ritual unpublished" : "Ritual published" });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("rituals").delete().eq("id", deleteTarget.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setDeleteTarget(null); return; }
    await logAudit("ritual_delete", deleteTarget.id, { title: deleteTarget.title });
    toast({ title: "Ritual deleted" });
    setDeleteTarget(null);
    load();
  };

  if (loading) return <p className="text-muted-foreground font-body">Loading rituals…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 300, color: "var(--text-1)", letterSpacing: "-0.03em" }}>Rituals</h2>
        <Button variant="gold" onClick={openNew}><Plus size={16} /> Create Ritual</Button>
      </div>

      {rituals.length === 0 ? (
        <EmptyState icon={Plus} iconClassName="text-gold" heading="No rituals yet" body="Create your first weekly ritual to get started." />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-body">Week Of</TableHead>
                <TableHead className="font-body">Title</TableHead>
                <TableHead className="font-body">Timing</TableHead>
                <TableHead className="font-body">Completions</TableHead>
                <TableHead className="font-body">Status</TableHead>
                <TableHead className="font-body w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rituals.map(r => {
                const ws = getWeekStatus(r.week_of);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-body text-sm">{format(new Date(r.week_of + "T00:00:00"), "d MMM yyyy")}</TableCell>
                    <TableCell className="font-body text-sm max-w-[300px] truncate">{r.title}</TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-body ${ws.cls}`}>{ws.label}</span>
                    </TableCell>
                    <TableCell className="font-body text-sm text-muted-foreground">{r.completion_count}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {r.published
                          ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-body" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}><Check size={10} /> Live</span>
                          : <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-body" style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-3)" }}>Draft</span>
                        }
                        <Switch checked={r.published} onCheckedChange={() => togglePublish(r)} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(r)}><Pencil size={14} /></Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteTarget(r)}><Trash2 size={14} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Ritual Form */}
      <Dialog open={!!modal} onOpenChange={open => !open && setModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-primary">{modal?.id ? "Edit Ritual" : "Create Ritual"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="font-body text-sm">Title *</Label>
              <Input className="ms-input mt-1" value={modal?.title || ""} onChange={e => setModal(prev => ({ ...prev!, title: e.target.value }))} placeholder="e.g. Gratitude Jar" />
            </div>
            <div>
              <Label className="font-body text-sm">Description *</Label>
              <Textarea className="ms-input mt-1" rows={3} value={modal?.description || ""} onChange={e => setModal(prev => ({ ...prev!, description: e.target.value }))} placeholder="What should members do this week?" />
            </div>
            <div>
              <Label className="font-body text-sm">Reflection Prompt</Label>
              <Textarea className="ms-input mt-1" rows={2} value={modal?.reflection_prompt || ""} onChange={e => setModal(prev => ({ ...prev!, reflection_prompt: e.target.value }))} placeholder="What did you notice after completing this ritual?" />
            </div>
            <div>
              <Label className="font-body text-sm">Week of *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal mt-1", !modal?.week_of && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {modal?.week_of ? format(new Date(modal.week_of + "T00:00:00"), "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={modal?.week_of ? new Date(modal.week_of + "T00:00:00") : undefined}
                    onSelect={d => setModal(prev => ({ ...prev!, week_of: d ? format(d, "yyyy-MM-dd") : "" }))}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={modal?.published ?? false} onCheckedChange={v => setModal(prev => ({ ...prev!, published: v }))} />
              <Label className="font-body text-sm">Published</Label>
            </div>
            <Button variant="gold" className="w-full" disabled={saving} onClick={save}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-destructive">Delete Ritual?</DialogTitle>
          </DialogHeader>
          <p className="font-body text-sm text-muted-foreground">
            Delete "{deleteTarget?.title}"? This cannot be undone.
            {(deleteTarget?.completion_count || 0) > 0 && ` ${deleteTarget!.completion_count} member completions will also be removed.`}
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={confirmDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRituals;