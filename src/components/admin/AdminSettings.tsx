import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Download, Eye } from "lucide-react";
import {
  welcomeEmail,
  ticketConfirmationEmail,
  ritualReminderEmail,
  archetypeRevealEmail,
} from "@/lib/email/templates";

const FLAG_KEYS = [
  { key: "ai_engine_enabled", label: "AI Engine", desc: "Archetype AI + Next Sacred Step" },
  { key: "fms_bridge_enabled", label: "FMS Bridge", desc: "FMS scoring background job" },
  { key: "legacy_features_enabled", label: "Family Legacy Features", desc: "Enable legacy pathway features" },
  { key: "notifications_enabled", label: "Notification System", desc: "In-app notification system" },
];

const AdminSettings = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase.from("platform_settings" as any).select("*");
    const map: Record<string, string> = {};
    (data || []).forEach((row: any) => { map[row.key] = row.value; });
    setSettings(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateSetting = async (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    const { error } = await supabase
      .from("platform_settings" as any)
      .update({ value, updated_at: new Date().toISOString() } as any)
      .eq("key", key);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
  };

  const savePlatformIdentity = async () => {
    setSaving(true);
    await Promise.all([
      updateSetting("platform_name", settings.platform_name || "Money Spirit"),
      updateSetting("logo_url", settings.logo_url || ""),
    ]);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("audit_logs").insert({
        action: "settings_change",
        actor_id: user.id,
        target_type: "platform_settings",
        target_id: "platform_identity",
        metadata: { platform_name: settings.platform_name, logo_url: settings.logo_url },
      });
    }
    toast({ title: "Settings saved" });
    setSaving(false);
  };

  const toggleFlag = async (key: string) => {
    const current = settings[key] === "true";
    const newVal = (!current).toString();
    await updateSetting(key, newVal);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("audit_logs").insert({
        action: "settings_change",
        actor_id: user.id,
        target_type: "platform_settings",
        target_id: key,
        metadata: { key, from: settings[key], to: newVal },
      });
    }
  };

  const exportMembers = async () => {
    setExporting(true);
    const { data } = await supabase.from("profiles").select("*");
    if (!data || data.length === 0) {
      toast({ title: "No data to export" });
      setExporting(false);
      return;
    }
    const headers = ["display_name", "role", "pathway_type", "life_stage", "ritual_streak", "created_at", "is_legacy_enabled"];
    const csv = [
      headers.join(","),
      ...data.map(r => headers.map(h => `"${(r as any)[h] ?? ""}"`).join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `members-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast({ title: "Export complete" });
    setExporting(false);
  };

  if (loading) return <p className="text-muted-foreground font-body">Loading settings…</p>;

  return (
    <div className="max-w-2xl space-y-8">
      <h2 className="text-2xl font-heading text-primary">Platform Settings</h2>

      {/* Platform Identity */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="font-heading text-lg text-primary">Platform Identity</h3>
        <div>
          <Label className="font-body text-sm">Platform Name</Label>
          <Input
            className="ms-input mt-1"
            value={settings.platform_name || ""}
            onChange={e => setSettings(prev => ({ ...prev, platform_name: e.target.value }))}
          />
        </div>
        <div>
          <Label className="font-body text-sm">Logo URL</Label>
          <Input
            className="ms-input mt-1"
            value={settings.logo_url || ""}
            onChange={e => setSettings(prev => ({ ...prev, logo_url: e.target.value }))}
          />
        </div>
        <Button variant="gold" disabled={saving} onClick={savePlatformIdentity}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </section>

      {/* Feature Flags */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="font-heading text-lg text-primary">Feature Flags</h3>
        {FLAG_KEYS.map(f => (
          <div key={f.key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <div>
              <p className="font-body text-sm font-medium">{f.label}</p>
              <p className="font-body text-xs text-muted-foreground">{f.desc}</p>
            </div>
            <Switch
              checked={settings[f.key] === "true"}
              onCheckedChange={() => toggleFlag(f.key)}
            />
          </div>
        ))}
      </section>

      {/* Email Templates */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="font-heading text-lg text-primary">Email Templates</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Preview Welcome Email", html: welcomeEmail("Aisha", "The Keeper") },
            { label: "Preview Ticket Confirmation", html: ticketConfirmationEmail("Aisha", "Money & Mindset Live Session", "Saturday, 12 April 2026", "Online via Zoom", "TKT-12345678") },
            { label: "Preview Ritual Reminder", html: ritualReminderEmail("Aisha", "The Money Breath", "Take three deep breaths and ask yourself: where am I holding financial tension today?") },
            { label: "Preview Archetype Reveal", html: archetypeRevealEmail("Aisha", "The Keeper", "You value security above all else. Building a solid foundation, protecting what you have, and planning carefully are the pillars of your financial wellbeing.", "#5B8DB8") },
          ].map((t) => (
            <Button
              key={t.label}
              variant="ghost"
              size="sm"
              className="justify-start gap-2"
              onClick={() => { setPreviewTitle(t.label); setPreviewHtml(t.html); }}
            >
              <Eye size={14} /> {t.label}
            </Button>
          ))}
        </div>
      </section>

      {/* Danger Zone */}
      <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-4">
        <h3 className="font-body text-sm font-semibold text-destructive">Danger Zone</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-body text-sm">Export All Member Data</p>
            <p className="font-body text-xs text-muted-foreground">Download profiles as CSV</p>
          </div>
          <Button variant="ghost" size="sm" disabled={exporting} onClick={exportMembers}>
            <Download size={14} /> {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        </div>
      </section>

      {/* Email Preview Modal */}
      <Dialog open={!!previewHtml} onOpenChange={(open) => { if (!open) setPreviewHtml(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-heading">{previewTitle}</DialogTitle>
          </DialogHeader>
          <iframe
            srcDoc={previewHtml ?? ""}
            style={{ width: "100%", height: 600, border: "none", background: "#061530", borderRadius: 8 }}
            title="Email Preview"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSettings;
