import { useEffect, useState, useCallback } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { getNextSacredStep } from "@/lib/ai/archetypeAI";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const archetypeDisplay: Record<string, { name: string; accent: string }> = {
  giver: { name: "The Giver", accent: "#E8845C" },
  keeper: { name: "The Keeper", accent: "#5B8DB8" },
  rebel: { name: "The Rebel", accent: "#9B59B6" },
  seeker: { name: "The Seeker", accent: "#27AE8F" },
  achiever: { name: "The Achiever", accent: "#C9941E" },
};

interface Props {
  userId: string;
  profile: Profile;
}

const NextSacredStep = ({ userId, profile }: Props) => {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cacheKey = `next_sacred_step_${userId}`;

  const fetchStep = useCallback(async (skipCache = false) => {
    if (!skipCache) {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { text: cachedText, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) {
            setText(cachedText);
            return;
          }
        }
      } catch { /* ignore */ }
    }

    setLoading(true);
    try {
      const { count } = await supabase
        .from("course_enrollments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .not("completed_at", "is", null);

      const result = await getNextSacredStep(profile, count ?? 0);
      setText(result);
      sessionStorage.setItem(cacheKey, JSON.stringify({ text: result, timestamp: Date.now() }));
    } finally {
      setLoading(false);
    }
  }, [userId, profile, cacheKey]);

  useEffect(() => {
    if (!profile.onboarding_complete) return;
    fetchStep();
  }, [fetchStep, profile.onboarding_complete]);

  if (!profile.onboarding_complete) return null;

  const pathway = profile.pathway_type ?? "keeper";
  const info = archetypeDisplay[pathway] ?? archetypeDisplay.keeper;

  return (
    <div
      className="rounded-xl p-5 animate-slide-up"
      style={{
        background: "linear-gradient(135deg, hsl(220 72% 10%), hsl(220 72% 6%))",
        border: "1px solid rgba(201, 148, 30, 0.3)",
      }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-gold" />
          <span className="font-body text-xs uppercase tracking-widest text-gold">
            Your Next Sacred Step
          </span>
        </div>
        <button
          onClick={() => fetchStep(true)}
          disabled={loading}
          className="text-navy-deep/50 hover:text-cream transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Content */}
      {loading && !text ? (
        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-[hsl(220,60%,15%)] animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-[hsl(220,60%,15%)] animate-pulse" />
        </div>
      ) : (
        <>
          <p className="font-heading text-lg text-cream italic leading-relaxed">
            {text}
          </p>

          <div className="mt-4 pt-3 border-t border-[hsl(220,60%,15%)]">
            <span
              className="inline-block px-3 py-1 rounded-full font-body text-xs"
              style={{
                backgroundColor: `${info.accent}26`,
                color: info.accent,
              }}
            >
              {info.name}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default NextSacredStep;
