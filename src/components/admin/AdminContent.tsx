import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Report = {
  id: string;
  reporter_id: string;
  content_type: string;
  content_id: string;
  reason: string;
  resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  moderator_note: string | null;
  created_at: string;
  reporter_name?: string;
  content_preview?: string;
};

type Tab = "all" | "pending" | "resolved" | "dismissed";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "resolved", label: "Resolved" },
  { id: "dismissed", label: "Dismissed" },
];

const AdminContent = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [acting, setActing] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data: reportsData } = await supabase
      .from("content_reports")
      .select("*")
      .order("created_at" as any, { ascending: false });

    if (!reportsData) { setLoading(false); return; }

    // Fetch reporter names
    const reporterIds = [...new Set(reportsData.map(r => r.reporter_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", reporterIds);
    const nameMap = new Map((profilesData || []).map(p => [p.user_id, p.display_name]));

    // Fetch content previews
    const enriched = await Promise.all(reportsData.map(async (r) => {
      let preview = "";
      try {
        if (r.content_type === "post") {
          const { data } = await supabase.from("posts").select("content").eq("id", r.content_id).single();
          preview = data?.content || "";
        } else if (r.content_type === "thread") {
          const { data } = await supabase.from("threads").select("body").eq("id", r.content_id).single();
          preview = data?.body || "";
        } else if (r.content_type === "thread_reply") {
          const { data } = await supabase.from("thread_replies").select("content").eq("id", r.content_id).single();
          preview = data?.content || "";
        } else if (r.content_type === "comment") {
          const { data } = await supabase.from("comments").select("content").eq("id", r.content_id).single();
          preview = data?.content || "";
        }
      } catch {}
      return {
        ...r,
        reporter_name: nameMap.get(r.reporter_id) || "Unknown",
        content_preview: preview.slice(0, 150) + (preview.length > 150 ? "…" : ""),
      } as Report;
    }));

    setReports(enriched);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getStatus = (r: Report): Tab => {
    if (r.moderator_note && r.resolved_by && !r.resolved) return "dismissed";
    if (r.resolved) return "resolved";
    return "pending";
  };

  const filtered = tab === "all" ? reports : reports.filter(r => getStatus(r) === tab);

  const resolve = async (r: Report, dismiss = false) => {
    setActing(r.id);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setActing(null); return; }

    const update: any = {
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
      moderator_note: notes[r.id] || null,
    };
    if (!dismiss) update.resolved = true;

    const { error } = await supabase
      .from("content_reports")
      .update(update)
      .eq("id", r.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      await supabase.from("audit_logs").insert({
        action: dismiss ? "content_dismiss" : "content_resolve",
        actor_id: user.id,
        target_type: "content_report",
        target_id: r.id,
        metadata: { content_type: r.content_type, note: notes[r.id] || "" },
      });
      toast({ title: dismiss ? "Report dismissed" : "Report resolved" });
      load();
    }
    setActing(null);
  };

  return (
    <div>
      <h2 className="text-2xl font-heading text-primary mb-6">Content Moderation</h2>

      <div className="flex gap-1 mb-6">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-body rounded-lg transition-colors ${
              tab === t.id
                ? "bg-accent/15 text-accent font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground font-body">Loading reports…</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground font-body text-center py-12">
          No {tab === "all" ? "" : tab} reports
        </p>
      ) : (
        <div className="space-y-4">
          {filtered.map(r => (
            <div key={r.id} className="ms-card space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-[11px] font-body bg-muted text-muted-foreground uppercase">
                    {r.content_type}
                  </span>
                  <span className="font-body text-sm">{r.reason}</span>
                </div>
                <span className="font-body text-xs text-muted-foreground">
                  {format(new Date(r.created_at), "d MMM yyyy, h:mma")}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground font-body">
                Reported by: {r.reporter_name}
              </div>

              {r.content_preview && (
                <div className="border-l-2 border-muted pl-3">
                  <p className="font-body text-sm text-muted-foreground italic">{r.content_preview}</p>
                </div>
              )}

              {getStatus(r) === "pending" && (
                <div className="flex items-center gap-3 pt-1">
                  <Input
                    placeholder="Add a note…"
                    value={notes[r.id] || ""}
                    onChange={e => setNotes(prev => ({ ...prev, [r.id]: e.target.value }))}
                    className="ms-input flex-1 text-sm"
                  />
                  <Button
                    variant="gold"
                    size="sm"
                    disabled={acting === r.id}
                    onClick={() => resolve(r)}
                  >
                    Resolve
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={acting === r.id}
                    onClick={() => resolve(r, true)}
                  >
                    Dismiss
                  </Button>
                </div>
              )}

              {r.moderator_note && getStatus(r) !== "pending" && (
                <p className="font-body text-xs text-muted-foreground">
                  Note: {r.moderator_note}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminContent;
