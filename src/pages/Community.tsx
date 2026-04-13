import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import PostComposer from "@/components/PostComposer";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, PartyPopper, Sparkles, Zap } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { formatDistanceToNow } from "date-fns";
import { createNotification } from "@/lib/actions/notifications";
import { checkAndAwardPostBadges } from "@/lib/actions/badges";

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
    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#C9941E" }}>
      <span className="text-sm font-body font-semibold" style={{ color: "#0A0D14" }}>{initials}</span>
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

  const fetchPosts = useCallback(async (uid: string | null) => {
    const { data: postsData } = await supabase
      .from("posts")
      .select("id, author_id, content, media_url, pinned, created_at")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });

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

    const channel = supabase
      .channel('posts_realtime_' + Date.now())
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        () => {
          supabase.auth.getSession().then(({ data: { session } }) => fetchPosts(session?.user?.id ?? null));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handlePost = async () => {
    if (!newContent.trim() || !userId) return;
    setPosting(true);
    await supabase.from("posts").insert({ author_id: userId, content: newContent.trim(), post_type: "standard" as const });
    await checkAndAwardPostBadges(userId, "standard");
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
      if (post.author_id !== userId) {
        const { data: actor } = await supabase.from("profiles").select("display_name").eq("user_id", userId).maybeSingle();
        const name = actor?.display_name ?? "Someone";
        await createNotification(post.author_id, "reaction", `${name} reacted to your post`, `/community`);
      }
    }
    await fetchPosts(userId);
  };

  const visiblePosts = isGuest ? posts.slice(0, 5) : posts;

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-heading" style={{ color: "var(--ms-text-primary)" }}>Community</h1>
        {[1, 2, 3].map((i) => (
          <div key={i} className="ms-card space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" style={{ background: "var(--ms-surface-3)" }} />
              <div className="space-y-2"><Skeleton className="h-4 w-28" style={{ background: "var(--ms-surface-3)" }} /><Skeleton className="h-3 w-16" style={{ background: "var(--ms-surface-3)" }} /></div>
            </div>
            <Skeleton className="h-4 w-full" style={{ background: "var(--ms-surface-3)" }} />
            <Skeleton className="h-4 w-2/3" style={{ background: "var(--ms-surface-3)" }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6 animate-fade-in">
      <SEOHead title="Community — Money Spirit" />
      <h1 className="text-3xl font-heading" style={{ color: "var(--ms-text-primary)" }}>Community</h1>

      {!isGuest && (
        <PostComposer
          value={newContent}
          onChange={setNewContent}
          onSubmit={handlePost}
          disabled={posting || !newContent.trim()}
        />
      )}

      <div className="space-y-4">
        {visiblePosts.map((post) => (
          <div key={post.id} className="ms-card animate-fade-in" style={{ transition: "border-color 0.15s ease" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--ms-border-active)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--ms-border)"; }}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <button onClick={(e) => { e.stopPropagation(); navigate(`/members/${post.author_id}`); }} className="shrink-0">
                  {post.author?.avatar_url ? (
                    <img src={post.author.avatar_url} alt={post.author.display_name} className="w-10 h-10 rounded-full object-cover hover:ring-2 hover:ring-[#C9941E] transition-all" />
                  ) : (
                    <InitialsAvatar name={post.author?.display_name ?? "?"} />
                  )}
                </button>
                <div>
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/members/${post.author_id}`); }} className="text-sm font-body font-medium hover:underline" style={{ color: "var(--ms-text-primary)" }}>{post.author?.display_name ?? "Unknown"}</button>
                  <p className="text-xs font-body" style={{ color: "var(--ms-text-muted)" }}>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
                </div>
                {post.pinned && (
                  <span className="ml-auto text-[11px] font-body font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(201,148,30,0.15)", color: "#F5C842" }}>
                    Pinned
                  </span>
                )}
              </div>
              <p className="text-[15px] font-body leading-[1.7] whitespace-pre-wrap" style={{ color: "var(--ms-text-secondary)" }}>{post.content}</p>
              <div className="flex items-center gap-1 pt-1">
                {reactionConfig.map((r) => {
                  const count = post.reactions[r.type];
                  const active = post.userReactions.has(r.type);
                  return (
                    <button key={r.type} onClick={() => handleReaction(post.id, r.type)} disabled={isGuest}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-body transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: active ? "rgba(201,148,30,0.15)" : "transparent",
                        color: active ? "#F5C842" : "var(--ms-text-muted)",
                      }}
                      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = "#F5C842"; }}
                      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = "var(--ms-text-muted)"; }}
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
          <EmptyState
            icon={Sparkles}
            iconClassName="text-gold"
            heading="Be the first to share"
            body="Your community is gathering. Start the conversation by sharing your first post or financial win."
            ctaLabel={!isGuest ? "Share Your First Post" : undefined}
            onCta={!isGuest ? () => document.querySelector("textarea")?.focus() : undefined}
          />
        )}

        {isGuest && posts.length > 5 && (
          <div className="ms-card-elevated text-center space-y-3">
            <p className="font-heading text-xl" style={{ color: "var(--ms-text-primary)" }}>Join Money Spirit to see more</p>
            <p className="text-sm font-body" style={{ color: "var(--ms-text-secondary)" }}>Become a member to access the full community feed, post, and react.</p>
            <Button variant="gold" asChild><a href="/register">Join the Community</a></Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Community;
