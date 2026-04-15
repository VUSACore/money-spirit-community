import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/components/PlatformLayout";
import SEOHead from "@/components/SEOHead";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare, Pin, Lock, ChevronLeft, Plus, X, ArrowLeft,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Forum = Tables<"forums">;

interface ThreadRow {
  id: string;
  forum_id: string;
  author_id: string;
  title: string;
  body: string;
  pinned: boolean;
  locked: boolean;
  hidden: boolean;
  reply_count: number;
  last_reply_at: string | null;
  view_count: number;
  created_at: string;
  author_name?: string;
}

const ForumDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const profile = useProfile();
  const [forum, setForum] = useState<Forum | null>(null);
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Compose state
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isGuest = profile?.role === "guest";
  const canPost = profile && !isGuest && profile.role !== "guest";

  const loadThreads = useCallback(async (forumId: string) => {
    // RLS already filters hidden=false for non-admin/mod
    const { data: threadsData } = await supabase
      .from("threads")
      .select("*")
      .eq("forum_id", forumId)
      .order("pinned", { ascending: false })
      .order("last_reply_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (!threadsData) return;

    const authorIds = [...new Set(threadsData.map(t => t.author_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", authorIds);
    const nameMap = new Map((profiles || []).map(p => [p.user_id, p.display_name]));

    setThreads(threadsData.map(t => ({
      ...t,
      author_name: nameMap.get(t.author_id) || "Unknown",
    })));
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      const { data: forumData } = await supabase
        .from("forums")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!forumData) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setForum(forumData);
      await loadThreads(forumData.id);
      setLoading(false);
    };
    load();
  }, [slug, loadThreads]);

  const handleCreate = async () => {
    console.log("[ForumDetail] handleCreate called", { title: title.trim(), body: body.trim(), profile: !!profile, submitting });
    if (!title.trim() || !body.trim() || !profile || submitting) return;
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    console.log("[ForumDetail] auth user:", user?.id, "profile role:", profile.role);
    if (!user) { setSubmitting(false); toast.error("You must be logged in to create a thread."); return; }

    const { data: profileRow } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profileRow) { setSubmitting(false); toast.error("Profile not found."); return; }

    console.log("[ForumDetail] inserting thread...", { forum_id: forum!.id, author_id: profileRow.id });
    const { data, error } = await supabase
      .from("threads")
      .insert({
        forum_id: forum!.id,
        author_id: profileRow.id,
        title: title.trim(),
        body: body.trim(),
      })
      .select("id")
      .single();

    console.log("[ForumDetail] insert result:", { data, error });

    if (error || !data) {
      console.error("[ForumDetail] thread insert failed:", error);
      toast.error(error?.message || "Failed to create thread. You may not have permission.");
      setSubmitting(false);
      return;
    }

    console.log("[ForumDetail] navigating to thread:", data.id);
    navigate(`/forums/${slug}/${data.id}`);
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" style={{ background: "rgba(255,255,255,0.06)" }} />
        <Skeleton className="h-4 w-72" style={{ background: "rgba(255,255,255,0.06)" }} />
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }} />
        ))}
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <EmptyState icon={MessageSquare} heading="Forum not found" body="This forum doesn't exist or may have been removed." ctaLabel="Back to Forums" onCta={() => navigate("/forums")} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 ss-appear">
      <SEOHead title={`${forum?.title} — Money Spirit Forums`} />

      {/* Breadcrumb */}
      <button
        onClick={() => navigate("/forums")}
        className="flex items-center gap-1.5 transition-colors"
        style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-3)" }}
        onMouseEnter={e => (e.currentTarget.style.color = "var(--gold-base)")}
        onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
      >
        <ArrowLeft size={14} /> Forums
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 300, color: "var(--text-1)", letterSpacing: "-0.03em" }}>
            {forum?.title}
          </h1>
          {forum?.description && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-3)", marginTop: 4, lineHeight: 1.5 }}>
              {forum.description}
            </p>
          )}
        </div>
        {canPost && !composing && (
          <Button variant="gold" size="sm" className="btn-gold flex items-center gap-1.5 shrink-0" onClick={() => setComposing(true)}>
            <Plus size={14} /> New Thread
          </Button>
        )}
      </div>

      {/* Guest notice */}
      {isGuest && forum?.requires_member && (
        <div className="ss-card" style={{ padding: "14px 20px" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-3)" }}>
            This forum is for members only.{" "}
            <Link to="/join" style={{ color: "var(--gold-base)", textDecoration: "underline" }}>Join Money Spirit</Link> to participate.
          </p>
        </div>
      )}

      {/* Compose panel */}
      {composing && (
        <div className="ss-card space-y-3" style={{ padding: "20px 24px" }}>
          <div className="flex items-center justify-between">
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 400, color: "var(--text-1)" }}>New thread</h3>
            <button onClick={() => { setComposing(false); setTitle(""); setBody(""); }} style={{ color: "var(--text-4)" }}>
              <X size={16} />
            </button>
          </div>
          <Input
            placeholder="Thread title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="ms-input"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-1)" }}
          />
          <textarea
            placeholder="Share your thoughts…"
            value={body}
            onChange={e => setBody(e.target.value)}
            className="ms-input-dark min-h-[120px] resize-none w-full"
          />
          <div className="flex justify-end">
            <Button
              type="button"
              variant="gold"
              className="btn-gold"
              disabled={!title.trim() || !body.trim() || submitting}
              onClick={handleCreate}
            >
              {submitting ? "Creating…" : "Create Thread"}
            </Button>
          </div>
        </div>
      )}

      {/* Thread list */}
      {threads.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          iconClassName="text-gold"
          heading="No threads yet"
          body="Be the first to start a conversation in this forum."
          ctaLabel={canPost ? "Start a thread" : undefined}
          onCta={canPost ? () => setComposing(true) : undefined}
        />
      ) : (
        <div className="space-y-2">
          {threads.map(thread => (
            <button
              key={thread.id}
              onClick={() => navigate(`/forums/${slug}/${thread.id}`)}
              className="w-full text-left ss-interactive transition-all"
              style={{ padding: "16px 22px", display: "block" }}
            >
              <div className="flex items-start gap-3">
                <MessageSquare size={16} className="mt-1 shrink-0" style={{ color: "var(--gold-base)", opacity: 0.6 }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {thread.pinned && (
                      <span className="flex items-center gap-1" style={{ fontSize: 10, fontFamily: "var(--font-body)", fontWeight: 600, color: "var(--gold-base)" }}>
                        <Pin size={10} /> Pinned
                      </span>
                    )}
                    {thread.locked && (
                      <span className="flex items-center gap-1" style={{ fontSize: 10, fontFamily: "var(--font-body)", fontWeight: 600, color: "#f59e0b" }}>
                        <Lock size={10} /> Locked
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 400, color: "var(--text-1)", lineHeight: 1.35 }}>
                    {thread.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-2 flex-wrap" style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-4)" }}>
                    <span>{thread.author_name}</span>
                    <span>·</span>
                    <span>{formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}</span>
                    {thread.reply_count > 0 && (
                      <>
                        <span>·</span>
                        <span>{thread.reply_count} {thread.reply_count === 1 ? "reply" : "replies"}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ForumDetail;
