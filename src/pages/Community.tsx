import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/components/PlatformLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, PartyPopper, Sparkles, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type ReactionType = "heart" | "celebrate" | "inspire" | "spark";

interface ReactionCount {
  heart: number;
  celebrate: number;
  inspire: number;
  spark: number;
}

interface PostWithAuthor {
  id: string;
  author_id: string;
  content: string;
  media_url: string | null;
  pinned: boolean;
  created_at: string;
  author: { display_name: string; avatar_url: string | null } | null;
  reactions: ReactionCount;
  userReactions: Set<ReactionType>;
}

const reactionConfig: { type: ReactionType; icon: typeof Heart; label: string }[] = [
  { type: "heart", icon: Heart, label: "Heart" },
  { type: "celebrate", icon: PartyPopper, label: "Celebrate" },
  { type: "inspire", icon: Sparkles, label: "Inspire" },
  { type: "spark", icon: Zap, label: "Spark" },
];

const InitialsAvatar = ({ name }: { name: string }) => {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center shrink-0">
      <span className="text-sm font-body font-semibold text-foreground">{initials}</span>
    </div>
  );
};

const Community = () => {
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
    const { data: authors } = await supabase
      .rpc("get_public_profiles", { profile_ids: authorIds });

    const authorMap = new Map(
      (authors ?? []).map((a: { id: string; display_name: string; avatar_url: string | null }) => [a.id, a])
    );

    const postIds = postsData.map((p) => p.id);
    const { data: reactions } = await supabase
      .from("post_reactions")
      .select("post_id, user_id, type")
      .in("post_id", postIds);

    const reactionsByPost = new Map<string, { counts: ReactionCount; userSet: Set<ReactionType> }>();
    for (const r of reactions ?? []) {
      if (!reactionsByPost.has(r.post_id)) {
        reactionsByPost.set(r.post_id, {
          counts: { heart: 0, celebrate: 0, inspire: 0, spark: 0 },
          userSet: new Set(),
        });
      }
      const entry = reactionsByPost.get(r.post_id)!;
      if (r.type in entry.counts) entry.counts[r.type as ReactionType]++;
      if (r.user_id === uid) entry.userSet.add(r.type as ReactionType);
    }

    setPosts(
      postsData.map((p) => {
        const rData = reactionsByPost.get(p.id);
        const author = authorMap.get(p.author_id);
        return {
          ...p,
          author: author ? { display_name: author.display_name, avatar_url: author.avatar_url } : null,
          reactions: rData?.counts ?? { heart: 0, celebrate: 0, inspire: 0, spark: 0 },
          userReactions: rData?.userSet ?? new Set(),
        };
      })
    );
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      await fetchPosts(uid);
    };
    init();

    const channel = supabase
      .channel("posts_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          fetchPosts(session?.user?.id ?? null);
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  const handlePost = async () => {
    if (!newContent.trim() || !userId) return;
    setPosting(true);
    await supabase.from("posts").insert({ author_id: userId, content: newContent.trim() });
    setNewContent("");
    setPosting(false);
  };

  const handleReaction = async (postId: string, type: ReactionType) => {
    if (!userId) return;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    if (post.userReactions.has(type)) {
      await supabase
        .from("post_reactions")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId)
        .eq("type", type);
    } else {
      await supabase.from("post_reactions").insert({ post_id: postId, user_id: userId, type });
    }
    await fetchPosts(userId);
  };

  const visiblePosts = isGuest ? posts.slice(0, 5) : posts;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-heading text-foreground">Community</h1>

      {!isGuest && (
        <Card className="border bg-card shadow-none">
          <CardContent className="p-4 space-y-3">
            <Textarea
              placeholder="Share something with the community..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="min-h-[80px] bg-background border-input font-body resize-none"
            />
            <div className="flex justify-end">
              <Button variant="gold" onClick={handlePost} disabled={posting || !newContent.trim()}>
                Post
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {visiblePosts.map((post) => (
          <Card key={post.id} className="border bg-card shadow-none">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                {post.author?.avatar_url ? (
                  <img
                    src={post.author.avatar_url}
                    alt={post.author.display_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <InitialsAvatar name={post.author?.display_name ?? "?"} />
                )}
                <div>
                  <p className="text-sm font-body font-semibold text-foreground">
                    {post.author?.display_name ?? "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground font-body">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
                {post.pinned && (
                  <span className="ml-auto text-xs font-body text-accent font-medium">Pinned</span>
                )}
              </div>

              <p className="text-sm font-body text-foreground whitespace-pre-wrap">{post.content}</p>

              <div className="flex items-center gap-1 pt-1">
                {reactionConfig.map((r) => {
                  const count = post.reactions[r.type];
                  const active = post.userReactions.has(r.type);
                  return (
                    <button
                      key={r.type}
                      onClick={() => handleReaction(post.id, r.type)}
                      disabled={isGuest}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-body transition-colors ${
                        active
                          ? "bg-gold/15 text-gold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <r.icon size={14} />
                      {count > 0 && <span>{count}</span>}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}

        {visiblePosts.length === 0 && (
          <p className="text-center text-muted-foreground font-body py-12">
            No posts yet. Be the first to share!
          </p>
        )}

        {isGuest && posts.length > 5 && (
          <Card className="border-accent bg-accent/5 shadow-none">
            <CardContent className="p-6 text-center space-y-3">
              <p className="font-heading text-xl text-foreground">
                Join Money Spirit to see more
              </p>
              <p className="text-sm text-muted-foreground font-body">
                Become a member to access the full community feed, post, and react.
              </p>
              <Button variant="gold" asChild>
                <a href="/register">Join the Community</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Community;
