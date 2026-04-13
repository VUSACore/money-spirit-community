import { useEffect, useState, useCallback } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { getNextSacredStep } from "@/lib/ai/archetypeAI";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

const CACHE_TTL = 5 * 60 * 1000;

const archetypeDisplay: Record<string, { name: string; accent: string }> = {
  giver: { name: "The Giver", accent: "#D4856A" },
  keeper: { name: "The Keeper", accent: "#6B9EC4" },
  rebel: { name: "The Rebel", accent: "#A87CC4" },
  seeker: { name: "The Seeker", accent: "#4DB89A" },
  achiever: { name: "The Achiever", accent: "#C4973A" },
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
          if (Date.now() - timestamp < CACHE_TTL) { setText(cachedText); return; }
        }
      } catch { /* ignore */ }
    }
    setLoading(true);
    try {
      const { count } = await supabase.from("course_enrollments").select("id", { count: "exact", head: true }).eq("user_id", userId).not("completed_at", "is", null);
      const result = await getNextSacredStep(profile, count ?? 0);
      setText(result);
      sessionStorage.setItem(cacheKey, JSON.stringify({ text: result, timestamp: Date.now() }));
    } finally { setLoading(false); }
  }, [userId, profile, cacheKey]);

  useEffect(() => {
    if (!profile.onboarding_complete) return;
    fetchStep();
  }, [fetchStep, profile.onboarding_complete]);

  if (!profile.onboarding_complete) return null;

  const pathway = profile.pathway_type ?? "keeper";
  const info = archetypeDisplay[pathway] ?? archetypeDisplay.keeper;

  return (
    <div className="ss-sacred">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} style={{ color: '#EEC96E' }} />
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: '9px', fontWeight: 600,
            letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C4973A',
          }}>
            Your Next Sacred Step
          </span>
        </div>
        <button
          onClick={() => fetchStep(true)}
          disabled={loading}
          className="transition-colors disabled:opacity-50"
          style={{ color: '#5C4E34' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#C4973A'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#5C4E34'; }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading && !text ? (
        <div className="space-y-3">
          <div className="h-4 w-full rounded animate-pulse" style={{ background: 'rgba(196,151,58,0.08)' }} />
          <div className="h-4 w-3/4 rounded animate-pulse" style={{ background: 'rgba(196,151,58,0.08)' }} />
        </div>
      ) : (
        <>
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: '20px', fontStyle: 'italic',
            fontWeight: 300, color: '#F2EAD8', lineHeight: 1.75, letterSpacing: '-0.01em',
          }}>
            {text}
          </p>
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(196,151,58,0.12)' }}>
            <span style={{
              display: 'inline-block',
              background: 'rgba(196,151,58,0.10)',
              border: '1px solid rgba(196,151,58,0.25)',
              borderRadius: 'var(--r-pill)',
              padding: '4px 14px',
              fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 500,
              color: '#C4973A',
            }}>
              {info.name}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default NextSacredStep;
