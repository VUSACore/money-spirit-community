import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Download, Eye, CheckCircle, Loader2 } from "lucide-react";
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const { toast } = useToast();

  const load = async () => {
    setLoadError(null);
    const { data, error } = await supabase.from("platform_settings" as any).select("*");
    if (error) {
      setLoadError(error.message);
      setLoading(false);
      return;
    }
    const map: Record<string, string> = {};
    (data || []).forEach((row: any) => { map[row.key] = row.value; });
    setSettings(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateSetting = async (key: string, value: string): Promise<boolean> => {
    setSettings(prev => ({ ...prev, [key]: value }));
    const { error } = await supabase
      .from("platform_settings" as any)
      .update({ value, updated_at: new Date().toISOString() } as any)
      .eq("key", key);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  };

  const logSettingsChange = async (targetId: string, metadata: Record<string, any>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("audit_logs").insert({
        action: "settings_change",
        actor_id: user.id,
        target_type: "platform_settings",
        target_id: targetId,
        metadata,
      });
    }
  };

  const savePlatformIdentity = async () => {
    setSaving(true);
    const results = await Promise.all([
      updateSetting("platform_name", settings.platform_name || "Money Spirit"),
      updateSetting("logo_url", settings.logo_url || ""),
    ]);
    if (results.every(Boolean)) {
      await logSettingsChange("platform_identity", {
        platform_name: settings.platform_name,
        logo_url: settings.logo_url,
      });
      toast({ title: "Settings saved" });
      setSavedKey("identity");
      setTimeout(() => setSavedKey(null), 2000);
    }
    setSaving(false);
  };

  const toggleFlag = async (key: string) => {
    const current = settings[key] === "true";
    const newVal = (!current).toString();
    const success = await updateSetting(key, newVal);
    if (success) {
      await logSettingsChange(key, { key, from: current.toString(), to: newVal });
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 2000);
    } else {
      // Revert optimistic update
      setSettings(prev => ({ ...prev, [key]: current.toString() }));
    }
  };

  const exportMembers = async () => {
    setExporting(true);
    const { data, error } = await supabase.from("profiles").select("*");
    if (error || !data || data.length === 0) {
      toast({ title: error ? "Export failed" : "No data to export", description: error?.message, variant: error ? "destructive" : undefined });
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
    await logSettingsChange("member_export", { row_count: data.length });
    toast({ title: "Export complete" });
    setExporting(false);
  };

  if (loading) return <p className="text-muted-foreground font-body">Loading settings…</p>;

  if (loadError) {
    return (
      <div className="max-w-2xl space-y-4">
        <h2 className="text-2xl font-heading text-primary">Platform Settings</h2>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <p className="font-body text-sm text-destructive">Failed to load settings: {loadError}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => { setLoading(true); load(); }}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <h2 className="text-2xl font-heading text-primary">Platform Settings</h2>

      {/* Platform Identity */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg text-primary">Platform Identity</h3>
          {savedKey === "identity" && (
            <span className="flex items-center gap-1 text-xs font-body text-teal-400">
              <CheckCircle size={12} /> Saved
            </span>
          )}
        </div>
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
          {saving ? <><Loader2 size={14} className="animate-spin mr-1.5" /> Saving…</> : "Save"}
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
            <div className="flex items-center gap-2">
              {savedKey === f.key && (
                <span className="text-xs font-body text-teal-400 flex items-center gap-1">
                  <CheckCircle size={12} /> Saved
                </span>
              )}
              <Switch
                checked={settings[f.key] === "true"}
                onCheckedChange={() => toggleFlag(f.key)}
              />
            </div>
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
            { label: "Preview Archetype Reveal", html: archetypeRevealEmail("Aisha", "The Keeper", "You value security above all else. Building a solid foundation, protecting what you have, and planning carefully are the pillars of your financial wellbeing.", "#7BB0E0") },
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
            {exporting ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Download size={14} className="mr-1.5" />}
            {exporting ? "Exporting…" : "Export CSV"}
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
