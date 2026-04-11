import { useEffect, useState } from "react";
import { format, nextMonday } from "date-fns";
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
import { CalendarIcon, Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type Ritual = Tables<"rituals"> & { completion_count?: number };

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
    if (!modal?.title || !modal?.description || !modal?.week_of) {
      toast({ title: "Missing fields", description: "Title, description, and week are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    if (modal.id) {
      const { error } = await supabase.from("rituals").update({
        title: modal.title,
        description: modal.description,
        reflection_prompt: modal.reflection_prompt || null,
        week_of: modal.week_of,
        published: modal.published ?? false,
      }).eq("id", modal.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Ritual updated" });
    } else {
      const { error } = await supabase.from("rituals").insert({
        title: modal.title,
        description: modal.description!,
        reflection_prompt: modal.reflection_prompt || null,
        week_of: modal.week_of,
        published: modal.published ?? false,
      });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Ritual created" });
    }
    setSaving(false);
    setModal(null);
    load();
  };

  const togglePublish = async (r: Ritual) => {
    const { error } = await supabase.from("rituals").update({ published: !r.published }).eq("id", r.id);
    if (!error) setRituals(prev => prev.map(x => x.id === r.id ? { ...x, published: !r.published } : x));
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from("rituals").delete().eq("id", deleteTarget.id);
    toast({ title: "Ritual deleted" });
    setDeleteTarget(null);
    load();
  };

  if (loading) return <p className="text-muted-foreground font-body">Loading rituals…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-heading text-primary">Rituals</h2>
        <Button variant="gold" onClick={openNew}><Plus size={16} /> Create Ritual</Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-body">Week Of</TableHead>
              <TableHead className="font-body">Title</TableHead>
              <TableHead className="font-body">Completions</TableHead>
              <TableHead className="font-body">Published</TableHead>
              <TableHead className="font-body w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rituals.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-body text-sm">{format(new Date(r.week_of), "d MMM yyyy")}</TableCell>
                <TableCell className="font-body text-sm max-w-[300px] truncate">{r.title}</TableCell>
                <TableCell className="font-body text-sm text-muted-foreground">{r.completion_count}</TableCell>
                <TableCell><Switch checked={r.published} onCheckedChange={() => togglePublish(r)} /></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(r)}><Pencil size={14} /></Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteTarget(r)}><Trash2 size={14} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Ritual Form */}
      <Dialog open={!!modal} onOpenChange={open => !open && setModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-primary">{modal?.id ? "Edit Ritual" : "Create Ritual"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="font-body text-sm">Title *</Label>
              <Input className="ms-input mt-1" value={modal?.title || ""} onChange={e => setModal(prev => ({ ...prev!, title: e.target.value }))} />
            </div>
            <div>
              <Label className="font-body text-sm">Description *</Label>
              <Textarea className="ms-input mt-1" rows={3} value={modal?.description || ""} onChange={e => setModal(prev => ({ ...prev!, description: e.target.value }))} />
            </div>
            <div>
              <Label className="font-body text-sm">Reflection Prompt</Label>
              <Textarea className="ms-input mt-1" rows={2} value={modal?.reflection_prompt || ""} onChange={e => setModal(prev => ({ ...prev!, reflection_prompt: e.target.value }))} />
            </div>
            <div>
              <Label className="font-body text-sm">Week of *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal mt-1", !modal?.week_of && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {modal?.week_of ? format(new Date(modal.week_of), "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={modal?.week_of ? new Date(modal.week_of) : undefined}
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
          <p className="font-body text-sm text-muted-foreground">Delete "{deleteTarget?.title}"? This cannot be undone.</p>
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
