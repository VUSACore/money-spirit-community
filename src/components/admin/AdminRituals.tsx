import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type Ritual = Tables<"rituals">;

const AdminRituals = () => {
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reflectionPrompt, setReflectionPrompt] = useState("");
  const [weekOf, setWeekOf] = useState<Date | undefined>();
  const [published, setPublished] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("rituals")
      .select("*")
      .order("week_of", { ascending: false });
    setRituals(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setTitle(""); setDescription(""); setReflectionPrompt(""); setWeekOf(undefined); setPublished(false);
  };

  const handleCreate = async () => {
    if (!title || !description || !reflectionPrompt || !weekOf) {
      toast({ title: "Missing fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("rituals").insert({
      title,
      description,
      reflection_prompt: reflectionPrompt,
      week_of: format(weekOf, "yyyy-MM-dd"),
      published,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Ritual created" });
      resetForm();
      load();
    }
    setSaving(false);
  };

  return (
    <div>
      <h2 className="text-2xl font-heading text-primary mb-6">Rituals</h2>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4 mb-8 max-w-2xl">
        <h3 className="font-heading text-lg text-primary">Create Ritual</h3>

        <div>
          <Label className="font-body text-sm">Title</Label>
          <Input className="ms-input mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label className="font-body text-sm">Description</Label>
          <Textarea className="ms-input mt-1" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <Label className="font-body text-sm">Reflection Prompt</Label>
          <Textarea className="ms-input mt-1" rows={2} value={reflectionPrompt} onChange={(e) => setReflectionPrompt(e.target.value)} />
        </div>
        <div>
          <Label className="font-body text-sm">Week of</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-[240px] justify-start text-left font-normal mt-1", !weekOf && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {weekOf ? format(weekOf, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={weekOf} onSelect={setWeekOf} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={published} onCheckedChange={setPublished} />
          <Label className="font-body text-sm">Publish immediately</Label>
        </div>
        <Button variant="gold" disabled={saving} onClick={handleCreate}>
          {saving ? "Creating…" : "Create Ritual"}
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground font-body">Loading…</p>
      ) : (
        <div className="space-y-3">
          {rituals.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
              <div>
                <h4 className="font-heading text-primary">{r.title}</h4>
                <p className="text-xs text-muted-foreground font-body">
                  Week of {format(new Date(r.week_of), "d MMM yyyy")} · {r.published ? "Published" : "Draft"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminRituals;
