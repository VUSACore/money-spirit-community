import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EyeOff, Lock, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import EmptyState from "@/components/EmptyState";

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
  content_hidden?: boolean;
  content_locked?: boolean;
};

type Tab = "pending" | "resolved" | "dismissed";

const TABS: { id: Tab; label: string }[] = [
  { id: "pending", label: "Open" },
  { id: "resolved", label: "Resolved" },
  { id: "dismissed", label: "Dismissed" },
];

const REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  harassment_or_bullying: "Harassment / Bullying",
  misinformation: "Misinformation",
  inappropriate_content: "Inappropriate Content",
  hate_speech: "Hate Speech",
  other: "Other",
};

const AdminContent = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [acting, setActing] = useState<string | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const { data: reportsData } = await supabase
      .from("content_reports")
      .select("*")
      .order("created_at" as any, { ascending: false });

    if (!reportsData) { setLoading(false); return; }

    const reporterIds = [...new Set(reportsData.map(r => r.reporter_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", reporterIds);
    const nameMap = new Map((profilesData || []).map(p => [p.user_id, p.display_name]));

    const enriched = await Promise.all(reportsData.map(async (r) => {
      let preview = "";
      let content_hidden = false;
      let content_locked = false;
      try {
        if (r.content_type === "post") {
          const { data } = await supabase.from("posts").select("content, hidden").eq("id", r.content_id).single();
          preview = data?.content || "";
          content_hidden = data?.hidden ?? false;
        } else if (r.content_type === "thread") {
          const { data } = await supabase.from("threads").select("body, hidden, locked").eq("id", r.content_id).single();
          preview = data?.body || "";
          content_hidden = data?.hidden ?? false;
          content_locked = data?.locked ?? false;
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
        content_preview: preview.slice(0, 250) + (preview.length > 250 ? "…" : ""),
        content_hidden,
        content_locked,
      } as Report;
    }));

    setReports(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const getStatus = (r: Report): Tab => {
    if (r.moderator_note && r.resolved_by && !r.resolved) return "dismissed";
    if (r.resolved) return "resolved";
    return "pending";
  };

  const filtered = reports.filter(r => getStatus(r) === tab);

  const pendingCount = reports.filter(r => getStatus(r) === "pending").length;

  const resolveReport = async (r: Report, action: "dismiss" | "resolve" | "hide" | "lock") => {
    setActing(r.id);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setActing(null); return; }

    // Handle content-level actions first
    if (action === "hide") {
      if (r.content_type === "post") {
        await supabase.from("posts").update({ hidden: true }).eq("id", r.content_id);
      } else if (r.content_type === "thread") {
        await supabase.from("threads").update({ hidden: true }).eq("id", r.content_id);
      }
      // thread_replies and comments don't have a hidden column — we delete or leave them
    }

    if (action === "lock" && r.content_type === "thread") {
      await supabase.from("threads").update({ locked: true }).eq("id", r.content_id);
    }

    // Update the report itself
    const { error } = await supabase
      .from("content_reports")
      .update({
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        moderator_note: notes[r.id] || null,
        resolved: action !== "dismiss",
      })
      .eq("id", r.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      const actionLabel = action === "dismiss" ? "dismissed" : action === "hide" ? "hidden & resolved" : action === "lock" ? "locked & resolved" : "resolved";
      await supabase.from("audit_logs").insert({
        action: `content_${action}`,
        actor_id: user.id,
        target_type: "content_report",
        target_id: r.id,
        metadata: { content_type: r.content_type, content_id: r.content_id, note: notes[r.id] || "" },
      });
      toast({ title: `Report ${actionLabel}` });
      load();
    }
    setActing(null);
  };

  const typeLabel = (t: string) => {
    const m: Record<string, string> = { post: "Post", thread: "Thread", thread_reply: "Reply", comment: "Comment" };
    return m[t] || t;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 300, color: "var(--text-1)", letterSpacing: "-0.03em" }}>
            Content Moderation
          </h2>
          {pendingCount > 0 && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--gold-base)", marginTop: 2 }}>
              {pendingCount} open {pendingCount === 1 ? "report" : "reports"}
            </p>
          )}
        </div>
        <button onClick={load} style={{ color: "var(--text-3)" }} className="p-2 rounded-lg transition-colors hover:bg-white/5">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 1 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "8px 16px",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? "var(--gold-bright)" : "var(--text-3)",
              borderBottom: tab === t.id ? "2px solid var(--gold-base)" : "2px solid transparent",
              transition: "all 0.2s",
            }}
          >
            {t.label}
            {t.id === "pending" && pendingCount > 0 && (
              <span style={{
                marginLeft: 6,
                background: "rgba(201,148,30,0.2)",
                color: "var(--gold-bright)",
                borderRadius: 99,
                padding: "1px 7px",
                fontSize: 11,
                fontWeight: 600,
              }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-12 justify-center" style={{ color: "var(--text-3)", fontFamily: "var(--font-body)", fontSize: 14 }}>
          <RefreshCw size={16} className="animate-spin" /> Loading reports…
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          iconClassName="text-gold"
          heading={tab === "pending" ? "No open reports" : `No ${tab} reports`}
          body={tab === "pending" ? "All clear — nothing needs your attention right now." : ""}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const status = getStatus(r);
            const isActing = acting === r.id;
            return (
              <div
                key={r.id}
                className="ss-card"
                style={{ padding: "18px 22px" }}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span style={{
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: 6,
                      padding: "2px 8px",
                      fontFamily: "var(--font-body)",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--text-3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}>
                      {typeLabel(r.content_type)}
                    </span>
                    <span style={{
                      background: "rgba(201,148,30,0.1)",
                      border: "1px solid rgba(201,148,30,0.2)",
                      borderRadius: 6,
                      padding: "2px 8px",
                      fontFamily: "var(--font-body)",
                      fontSize: 11,
                      fontWeight: 500,
                      color: "var(--gold-base)",
                    }}>
                      {REASON_LABELS[r.reason] || r.reason}
                    </span>
                    {r.content_hidden && (
                      <span className="flex items-center gap-1" style={{ fontSize: 11, fontFamily: "var(--font-body)", color: "#ef4444" }}>
                        <EyeOff size={12} /> Hidden
                      </span>
                    )}
                    {r.content_locked && (
                      <span className="flex items-center gap-1" style={{ fontSize: 11, fontFamily: "var(--font-body)", color: "#f59e0b" }}>
                        <Lock size={12} /> Locked
                      </span>
                    )}
                  </div>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-4)", whiteSpace: "nowrap" }}>
                    {format(new Date(r.created_at), "d MMM yyyy, h:mma")}
                  </span>
                </div>

                {/* Reporter */}
                <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-4)", marginBottom: 8 }}>
                  Reported by <span style={{ color: "var(--text-2)" }}>{r.reporter_name}</span>
                </p>

                {/* Content preview */}
                {r.content_preview ? (
                  <div style={{ borderLeft: "2px solid rgba(255,255,255,0.08)", paddingLeft: 12, marginBottom: 12 }}>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-3)", fontStyle: "italic", lineHeight: 1.6 }}>
                      {r.content_preview}
                    </p>
                  </div>
                ) : (
                  <div style={{ borderLeft: "2px solid rgba(255,255,255,0.08)", paddingLeft: 12, marginBottom: 12 }}>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-4)", fontStyle: "italic" }}>
                      Content not found or deleted
                    </p>
                  </div>
                )}

                {/* Moderator note (resolved/dismissed) */}
                {r.moderator_note && status !== "pending" && (
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-3)", marginBottom: 8 }}>
                    <span style={{ color: "var(--text-4)" }}>Mod note:</span> {r.moderator_note}
                  </p>
                )}

                {/* Actions for pending reports */}
                {status === "pending" && (
                  <div className="space-y-3 pt-1">
                    <Input
                      placeholder="Add a moderator note (optional)…"
                      value={notes[r.id] || ""}
                      onChange={e => setNotes(prev => ({ ...prev, [r.id]: e.target.value }))}
                      className="ms-input text-sm"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-2)" }}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="gold"
                        size="sm"
                        disabled={isActing}
                        onClick={() => resolveReport(r, "hide")}
                        className="btn-gold flex items-center gap-1.5"
                      >
                        <EyeOff size={13} /> Hide Content
                      </Button>
                      {r.content_type === "thread" && !r.content_locked && (
                        <Button
                          size="sm"
                          disabled={isActing}
                          onClick={() => resolveReport(r, "lock")}
                          style={{
                            background: "rgba(245,158,11,0.12)",
                            border: "1px solid rgba(245,158,11,0.25)",
                            color: "#f59e0b",
                            borderRadius: 8,
                          }}
                          className="flex items-center gap-1.5"
                        >
                          <Lock size={13} /> Lock Thread
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isActing}
                        onClick={() => resolveReport(r, "resolve")}
                        style={{ color: "var(--text-2)" }}
                        className="flex items-center gap-1.5"
                      >
                        <CheckCircle size={13} /> Resolve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isActing}
                        onClick={() => resolveReport(r, "dismiss")}
                        style={{ color: "var(--text-4)" }}
                        className="flex items-center gap-1.5"
                      >
                        <XCircle size={13} /> Dismiss
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminContent;
