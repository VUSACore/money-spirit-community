import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/components/PlatformLayout";
import SEOHead from "@/components/SEOHead";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ReportDialog from "@/components/ReportDialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft, Lock, Pin, MessageSquare, MoreHorizontal, Flag,
  ThumbsUp, Send,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ThreadData {
  id: string;
  forum_id: string;
  author_id: string;
  title: string;
  body: string;
  pinned: boolean;
  locked: boolean;
  hidden: boolean;
  reply_count: number;
  created_at: string;
}

interface ReplyData {
  id: string;
  thread_id: string;
  author_id: string;
  content: string;
  upvotes: number;
  created_at: string;
  author_name?: string;
  author_avatar?: string | null;
  user_upvoted?: boolean;
}

const InitialsAvatar = ({ name, size = 36 }: { name: string; size?: number }) => {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0"
      style={{ width: size, height: size, background: "var(--gold-base)" }}
    >
      <span style={{ fontSize: size * 0.36, fontFamily: "var(--font-body)", fontWeight: 600, color: "#060912" }}>{initials}</span>
    </div>
  );
};

const ThreadDetail = () => {
  const { slug, threadId } = useParams<{ slug: string; threadId: string }>();
  const navigate = useNavigate();
  const profile = useProfile();
  const [thread, setThread] = useState<ThreadData | null>(null);
  const [authorName, setAuthorName] = useState("Unknown");
  const [authorAvatar, setAuthorAvatar] = useState<string | null>(null);
  const [replies, setReplies] = useState<ReplyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Reply compose
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Report
  const [reportTarget, setReportTarget] = useState<{
    contentType: "thread" | "thread_reply";
    contentId: string;
  } | null>(null);

  const isGuest = profile?.role === "guest";
  const isAdminOrMod = profile?.role === "admin" || profile?.role === "moderator";
  const canReply = profile && !isGuest && thread && !thread.locked;

  const loadReplies = useCallback(async (tid: string, uid: string | null) => {
    const { data: repliesData } = await supabase
      .from("thread_replies")
      .select("*")
      .eq("thread_id", tid)
      .order("created_at", { ascending: true });

    if (!repliesData) return;

    const authorIds = [...new Set(repliesData.map(r => r.author_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", authorIds);
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    // Load upvotes
    const replyIds = repliesData.map(r => r.id);
    let userUpvotes = new Set<string>();
    if (uid && replyIds.length > 0) {
      const { data: upvotes } = await supabase
        .from("thread_reply_upvotes")
        .select("reply_id")
        .eq("user_id", uid)
        .in("reply_id", replyIds);
      userUpvotes = new Set((upvotes || []).map(u => u.reply_id));
    }

    setReplies(repliesData.map(r => {
      const p = profileMap.get(r.author_id);
      return {
        ...r,
        author_name: p?.display_name || "Unknown",
        author_avatar: p?.avatar_url || null,
        user_upvoted: userUpvotes.has(r.id),
      };
    }));
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!threadId) return;

      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id ?? null;
      setUserId(uid);

      const { data: threadData, error } = await supabase
        .from("threads")
        .select("*")
        .eq("id", threadId)
        .single();

      if (error || !threadData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setThread(threadData);

      // Author info
      const { data: authorProfile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", threadData.author_id)
        .single();
      if (authorProfile) {
        setAuthorName(authorProfile.display_name);
        setAuthorAvatar(authorProfile.avatar_url);
      }

      await loadReplies(threadData.id, uid);
      setLoading(false);
    };
    load();
  }, [threadId, loadReplies]);

  const handleReply = async () => {
    if (!replyContent.trim() || !userId || submitting) return;
    setSubmitting(true);

    const { error } = await supabase
      .from("thread_replies")
      .insert({
        thread_id: thread!.id,
        author_id: userId,
        content: replyContent.trim(),
      });

    if (!error) {
      setReplyContent("");
      await loadReplies(thread!.id, userId);
    }
    setSubmitting(false);
  };

  const handleUpvote = async (replyId: string, currentlyUpvoted: boolean) => {
    if (!userId || isGuest) return;

    if (currentlyUpvoted) {
      await supabase.from("thread_reply_upvotes").delete().eq("reply_id", replyId).eq("user_id", userId);
    } else {
      await supabase.from("thread_reply_upvotes").insert({ reply_id: replyId, user_id: userId });
    }
    await loadReplies(thread!.id, userId);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-6 w-32" style={{ background: "rgba(255,255,255,0.22)" }} />
        <Skeleton className="h-10 w-3/4" style={{ background: "rgba(255,255,255,0.22)" }} />
        <Skeleton className="h-32 w-full rounded-xl" style={{ background: "rgba(255,255,255,0.22)" }} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto">
        <EmptyState
          icon={MessageSquare}
          heading="Thread not found"
          body="This thread doesn't exist, was removed, or you don't have access."
          ctaLabel="Back to Forums"
          onCta={() => navigate("/forums")}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto space-y-6 ss-appear">
      <SEOHead title={`${thread?.title} — Money Spirit Forums`} />

      {/* Breadcrumb */}
      <button
        onClick={() => navigate(`/forums/${slug}`)}
        className="flex items-center gap-1.5 transition-colors"
        style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-3)" }}
        onMouseEnter={e => (e.currentTarget.style.color = "var(--gold-base)")}
        onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
      >
        <ArrowLeft size={14} /> Back to threads
      </button>

      {/* Thread header */}
      <div className="ss-card" style={{ padding: "24px 28px" }}>
        {/* Status badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {thread?.pinned && (
            <span className="flex items-center gap-1" style={{
              background: "rgba(201,148,30,0.1)", border: "1px solid rgba(201,148,30,0.2)",
              borderRadius: 6, padding: "2px 8px",
              fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600, color: "var(--gold-base)",
            }}>
              <Pin size={10} /> Pinned
            </span>
          )}
          {thread?.locked && (
            <span className="flex items-center gap-1" style={{
              background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
              borderRadius: 6, padding: "2px 8px",
              fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600, color: "#f59e0b",
            }}>
              <Lock size={10} /> Locked
            </span>
          )}
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 300, color: "var(--text-1)", letterSpacing: "-0.02em", lineHeight: 1.3 }}>
          {thread?.title}
        </h1>

        {/* Author row */}
        <div className="flex items-center gap-3 mt-4 mb-5">
          <button onClick={() => navigate(`/members/${thread?.author_id}`)} className="shrink-0">
            {authorAvatar ? (
              <img src={authorAvatar} alt={authorName} className="w-9 h-9 rounded-full object-cover" style={{ border: "2px solid rgba(255,255,255,0.1)" }} />
            ) : (
              <InitialsAvatar name={authorName} size={36} />
            )}
          </button>
          <div>
            <button onClick={() => navigate(`/members/${thread?.author_id}`)} className="hover:underline" style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>
              {authorName}
            </button>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-4)" }}>
              {thread?.created_at && formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
            </p>
          </div>

          {/* Report thread */}
          {userId && thread && thread.author_id !== userId && !isGuest && (
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1.5 rounded-lg transition-colors hover:bg-white/5" style={{ color: "var(--text-4)" }}>
                    <MoreHorizontal size={16} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" style={{
                  background: "rgba(12,18,33,0.95)", backdropFilter: "blur(24px)",
                  border: "1px solid rgba(255,255,255,0.24)", borderRadius: 10,
                }}>
                  <DropdownMenuItem
                    onClick={() => setReportTarget({ contentType: "thread", contentId: thread.id })}
                    className="flex items-center gap-2 cursor-pointer"
                    style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-2)" }}
                  >
                    <Flag size={14} style={{ color: "var(--text-3)" }} /> Report thread
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Thread body */}
        <div style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text-2)", lineHeight: 1.75 }} className="whitespace-pre-wrap">
          {thread?.body}
        </div>
      </div>

      {/* Replies section */}
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 400, color: "var(--text-1)", marginBottom: 16 }}>
          {replies.length === 0 ? "No replies yet" : `${replies.length} ${replies.length === 1 ? "Reply" : "Replies"}`}
        </h2>

        <div className="space-y-2">
          {replies.map(reply => (
            <div key={reply.id} className="ss-card" style={{ padding: "16px 22px" }}>
              <div className="flex items-start gap-3">
                <button onClick={() => navigate(`/members/${reply.author_id}`)} className="shrink-0 mt-0.5">
                  {reply.author_avatar ? (
                    <img src={reply.author_avatar} alt={reply.author_name} className="w-8 h-8 rounded-full object-cover" style={{ border: "1px solid rgba(255,255,255,0.24)" }} />
                  ) : (
                    <InitialsAvatar name={reply.author_name || "?"} size={32} />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <button onClick={() => navigate(`/members/${reply.author_id}`)} className="hover:underline" style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>
                      {reply.author_name}
                    </button>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-4)" }}>
                      {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-2)", lineHeight: 1.65 }} className="whitespace-pre-wrap">
                    {reply.content}
                  </p>

                  {/* Actions row */}
                  <div className="flex items-center gap-2 mt-2">
                    {/* Upvote */}
                    <button
                      onClick={() => handleUpvote(reply.id, !!reply.user_upvoted)}
                      disabled={isGuest || !userId}
                      className="flex items-center gap-1 px-2 py-1 rounded-md transition-colors disabled:opacity-40"
                      style={{
                        fontFamily: "var(--font-body)", fontSize: 12,
                        color: reply.user_upvoted ? "var(--gold-bright)" : "var(--text-4)",
                        background: reply.user_upvoted ? "rgba(201,148,30,0.12)" : "transparent",
                      }}
                    >
                      <ThumbsUp size={13} />
                      {reply.upvotes > 0 && <span>{reply.upvotes}</span>}
                    </button>

                    {/* Report reply */}
                    {userId && reply.author_id !== userId && !isGuest && (
                      <button
                        onClick={() => setReportTarget({ contentType: "thread_reply", contentId: reply.id })}
                        className="flex items-center gap-1 px-2 py-1 rounded-md transition-colors"
                        style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--text-4)" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "var(--text-2)")}
                        onMouseLeave={e => (e.currentTarget.style.color = "var(--text-4)")}
                      >
                        <Flag size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reply composer */}
      {thread?.locked ? (
        <div className="ss-card flex items-center gap-2" style={{ padding: "14px 20px" }}>
          <Lock size={14} style={{ color: "#f59e0b" }} />
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-3)" }}>
            This thread is locked. No new replies can be added.
          </p>
        </div>
      ) : canReply ? (
        <div className="ss-card" style={{ padding: "16px 20px" }}>
          <div className="flex gap-3">
            <textarea
              placeholder="Write a reply…"
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              className="ms-input-dark min-h-[72px] resize-none flex-1"
            />
            <Button
              variant="gold"
              size="sm"
              className="btn-gold self-end shrink-0 flex items-center gap-1.5"
              disabled={!replyContent.trim() || submitting}
              onClick={handleReply}
            >
              <Send size={13} /> {submitting ? "…" : "Reply"}
            </Button>
          </div>
        </div>
      ) : isGuest ? (
        <div className="ss-card flex items-center gap-2" style={{ padding: "14px 20px" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-3)" }}>
            <Link to="/join" style={{ color: "var(--gold-base)", textDecoration: "underline" }}>Join Money Spirit</Link> to reply.
          </p>
        </div>
      ) : null}

      {/* Report dialog */}
      <ReportDialog
        open={!!reportTarget}
        onOpenChange={open => { if (!open) setReportTarget(null); }}
        contentType={reportTarget?.contentType ?? "thread"}
        contentId={reportTarget?.contentId ?? ""}
      />
    </div>
  );
};

export default ThreadDetail;
