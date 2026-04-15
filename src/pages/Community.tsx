import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import PostComposer from "@/components/PostComposer";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, PartyPopper, Sparkles, Zap, Flag, MoreHorizontal } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { formatDistanceToNow } from "date-fns";
import ReportDialog from "@/components/ReportDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ReactionType = "heart" | "celebrate" | "inspire" | "spark";
interface ReactionCount { heart: number; celebrate: number; inspire: number; spark: number; }
interface PostWithAuthor {
  id: string; author_id: string; content: string; media_url: string | null; pinned: boolean; created_at: string;
  author: { display_name: string; avatar_url: string | null } | null;
  reactions: ReactionCount; userReactions: Set<ReactionType>;
}

const reactionConfig: { type: ReactionType; icon: typeof Heart; label: string }[] = [
  { type: "heart", icon: Heart, label: "Heart" },
  { type: "celebrate", icon: PartyPopper, label: "Celebrate" },
  { type: "inspire", icon: Sparkles, label: "Inspire" },
  { type: "spark", icon: Zap, label: "Spark" },
];

const InitialsAvatar = ({ name }: { name: string }) => {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--gold-base)' }}>
      <span style={{ fontSize: '13px', fontFamily: 'var(--font-body)', fontWeight: 600, color: '#060912' }}>{initials}</span>
    </div>
  );
};

const Community = () => {
  const navigate = useNavigate();
  const profile = useProfile();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [newContent, setNewContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const isGuest = profile?.role === "guest";

  // Report state
  const [reportTarget, setReportTarget] = useState<{ contentType: "post"; contentId: string } | null>(null);

  const fetchPosts = useCallback(async (uid: string | null) => {
    // posts RLS already filters hidden=false for non-admin/mod
    const { data: postsData } = await supabase.from("posts").select("id, author_id, content, media_url, pinned, created_at").order("pinned", { ascending: false }).order("created_at", { ascending: false });
    if (!postsData) return;
    const authorIds = [...new Set(postsData.map((p) => p.author_id))];
    const { data: authors } = await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", authorIds);
    const authorMap = new Map((authors ?? []).map((a) => [a.user_id, a]));
    const postIds = postsData.map((p) => p.id);
    const { data: reactions } = await supabase.from("post_reactions").select("post_id, user_id, type").in("post_id", postIds);
    const reactionsByPost = new Map<string, { counts: ReactionCount; userSet: Set<ReactionType> }>();
    for (const r of reactions ?? []) {
      if (!reactionsByPost.has(r.post_id)) reactionsByPost.set(r.post_id, { counts: { heart: 0, celebrate: 0, inspire: 0, spark: 0 }, userSet: new Set() });
      const entry = reactionsByPost.get(r.post_id)!;
      if (r.type in entry.counts) entry.counts[r.type as ReactionType]++;
      if (r.user_id === uid) entry.userSet.add(r.type as ReactionType);
    }
    setPosts(postsData.map((p) => {
      const rData = reactionsByPost.get(p.id);
      const author = authorMap.get(p.author_id);
      return { ...p, author: author ? { display_name: author.display_name, avatar_url: author.avatar_url } : null, reactions: rData?.counts ?? { heart: 0, celebrate: 0, inspire: 0, spark: 0 }, userReactions: rData?.userSet ?? new Set() };
    }));
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      await fetchPosts(uid);
      setLoading(false);
    };
    init();
    const channel = supabase.channel('posts_realtime_' + Date.now()).on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
      supabase.auth.getSession().then(({ data: { session } }) => fetchPosts(session?.user?.id ?? null));
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handlePost = async () => {
    if (!newContent.trim() || !userId) return;
    setPosting(true);
    await supabase.from("posts").insert({ author_id: userId, content: newContent.trim(), post_type: "standard" as const });
    setNewContent("");
    setPosting(false);
  };

  const handleReaction = async (postId: string, type: ReactionType) => {
    if (!userId) return;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    if (post.userReactions.has(type)) {
      await supabase.from("post_reactions").delete().eq("post_id", postId).eq("user_id", userId).eq("type", type);
    } else {
      await supabase.from("post_reactions").insert({ post_id: postId, user_id: userId, type });
    }
    await fetchPosts(userId);
  };

  const visiblePosts = isGuest ? posts.slice(0, 5) : posts;

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 300, color: 'var(--text-1)', letterSpacing: '-0.03em' }}>Community</h1>
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className="space-y-2"><Skeleton className="h-4 w-28" style={{ background: 'rgba(255,255,255,0.06)' }} /><Skeleton className="h-3 w-16" style={{ background: 'rgba(255,255,255,0.06)' }} /></div>
            </div>
            <Skeleton className="h-4 w-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6 animate-glass">
      <SEOHead title="Community — Money Spirit" />
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 300, color: 'var(--text-1)', letterSpacing: '-0.03em' }}>Community</h1>

      {!isGuest && (
        <PostComposer value={newContent} onChange={setNewContent} onSubmit={handlePost} disabled={posting || !newContent.trim()} />
      )}

      <div className="space-y-3">
        {visiblePosts.map((post) => (
          <div key={post.id} className="glass-interactive" style={{ padding: '20px 24px', marginBottom: '0' }}>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <button onClick={(e) => { e.stopPropagation(); navigate(`/members/${post.author_id}`); }} className="shrink-0">
                  {post.author?.avatar_url ? (
                    <img src={post.author.avatar_url} alt={post.author.display_name} className="w-10 h-10 rounded-full object-cover" style={{ border: '2px solid rgba(255,255,255,0.10)' }} />
                  ) : (
                    <InitialsAvatar name={post.author?.display_name ?? "?"} />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/members/${post.author_id}`); }} className="hover:underline" style={{ fontSize: '14px', fontFamily: 'var(--font-body)', fontWeight: 500, color: 'var(--text-1)' }}>{post.author?.display_name ?? "Unknown"}</button>
                  <p style={{ fontSize: '11px', fontFamily: 'var(--font-body)', color: 'var(--text-4)' }}>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
                </div>
                {post.pinned && (
                  <span style={{
                    background: 'rgba(245,200,66,0.10)', border: '1px solid rgba(245,200,66,0.25)',
                    borderRadius: 'var(--r-full)', padding: '2px 10px',
                    fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-gold)',
                  }}>Pinned</span>
                )}
                {/* Report menu */}
                {userId && post.author_id !== userId && !isGuest && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1.5 rounded-lg transition-colors hover:bg-white/5" style={{ color: 'var(--text-4)' }}>
                        <MoreHorizontal size={16} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      style={{
                        background: 'rgba(12, 18, 33, 0.95)',
                        backdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 10,
                      }}
                    >
                      <DropdownMenuItem
                        onClick={() => setReportTarget({ contentType: "post", contentId: post.id })}
                        className="flex items-center gap-2 cursor-pointer"
                        style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-2)' }}
                      >
                        <Flag size={14} style={{ color: 'var(--text-3)' }} />
                        Report post
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <p style={{ fontSize: '15px', fontFamily: 'var(--font-body)', color: 'var(--text-2)', lineHeight: 1.7 }} className="whitespace-pre-wrap">{post.content}</p>
              <div className="flex items-center gap-1 pt-1">
                {reactionConfig.map((r) => {
                  const count = post.reactions[r.type];
                  const active = post.userReactions.has(r.type);
                  return (
                    <button key={r.type} onClick={() => handleReaction(post.id, r.type)} disabled={isGuest}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        fontFamily: 'var(--font-body)', fontSize: '12px',
                        background: active ? 'rgba(201,148,30,0.15)' : 'transparent',
                        color: active ? 'var(--text-gold)' : 'var(--text-4)',
                      }}
                      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-gold)'; }}
                      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-4)'; }}
                    >
                      <r.icon size={14} />
                      {count > 0 && <span>{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        {visiblePosts.length === 0 && (
          <EmptyState icon={Sparkles} iconClassName="text-gold" heading="Start the conversation" body="Share a thought, celebrate a win, or ask the community something. Your voice matters here." ctaLabel={!isGuest ? "Write your first post" : undefined} onCta={!isGuest ? () => document.querySelector("textarea")?.focus() : undefined} />
        )}

        {isGuest && posts.length > 5 && (
          <div className="glass-elevated text-center space-y-3">
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 400, color: 'var(--text-1)' }}>Join Money Spirit to see more</p>
            <p style={{ fontSize: '14px', fontFamily: 'var(--font-body)', color: 'var(--text-2)' }}>Become a member to access the full community feed, post, and react.</p>
            <Button variant="gold" asChild><a href="/register">Join the Community</a></Button>
          </div>
        )}
      </div>

      {/* Report dialog */}
      <ReportDialog
        open={!!reportTarget}
        onOpenChange={(open) => { if (!open) setReportTarget(null); }}
        contentType={reportTarget?.contentType ?? "post"}
        contentId={reportTarget?.contentId ?? ""}
      />
    </div>
  );
};

export default Community;
