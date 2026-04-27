import { useEffect, useState, useCallback, useRef } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { getNextSacredStep } from "@/lib/ai/archetypeAI";
import { getArchetypeFallback } from "@/lib/ai/geminiClient";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

const CACHE_TTL = 5 * 60 * 1000;
const HISTORY_KEY_PREFIX = "sacred_step_history_";
const MAX_HISTORY = 5;

const archetypeDisplay: Record<string, { name: string; accent: string }> = {
  giver: { name: "The Giver", accent: "#D4856A" },
  keeper: { name: "The Keeper", accent: "#6B9EC4" },
  rebel: { name: "The Rebel", accent: "#A87CC4" },
  seeker: { name: "The Seeker", accent: "#4DB89A" },
  achiever: { name: "The Achiever", accent: "#E0B040" },
};

interface Props {
  userId: string;
  profile: Profile;
}

function getHistory(userId: string): string[] {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY_PREFIX + userId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function pushHistory(userId: string, text: string) {
  const history = getHistory(userId);
  // Don't add duplicates
  if (history[history.length - 1] === text) return;
  history.push(text);
  if (history.length > MAX_HISTORY) history.shift();
  sessionStorage.setItem(HISTORY_KEY_PREFIX + userId, JSON.stringify(history));
}

const NextSacredStep = ({ userId, profile }: Props) => {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const fetchingRef = useRef(false);

  const cacheKey = `next_sacred_step_${userId}`;

  const fetchStep = useCallback(async (skipCache = false) => {
    // Prevent double-submit
    if (fetchingRef.current) return;

    if (!skipCache) {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { text: cachedText, timestamp, fallback } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) {
            setText(cachedText);
            setIsFallback(!!fallback);
            return;
          }
        }
      } catch { /* ignore */ }
    }

    fetchingRef.current = true;
    setLoading(true);
    setIsFallback(false);

    try {
      const history = getHistory(userId);
      const result = await getNextSacredStep(profile, 0, history);
      setText(result);
      pushHistory(userId, result);
      sessionStorage.setItem(cacheKey, JSON.stringify({ text: result, timestamp: Date.now(), fallback: false }));
    } catch {
      // Gemini failed — use archetype-aware fallback
      const history = getHistory(userId);
      const fallbackText = getArchetypeFallback(profile.pathway_type, history);
      setText(fallbackText);
      setIsFallback(true);
      pushHistory(userId, fallbackText);
      sessionStorage.setItem(cacheKey, JSON.stringify({ text: fallbackText, timestamp: Date.now(), fallback: true }));
    } finally {
      setLoading(false);
      fetchingRef.current = false;
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
    <div className="ss-sacred">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} style={{ color: '#F8DC8A' }} />
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: '9px', fontWeight: 600,
            letterSpacing: '0.18em', textTransform: 'uppercase', color: '#E0B040',
          }}>
            Your Next Sacred Step
          </span>
        </div>
        <button
          onClick={() => fetchStep(true)}
          disabled={loading}
          className="transition-colors disabled:opacity-50"
          style={{ color: '#5C4E34' }}
          aria-label="Refresh sacred step"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#E0B040'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#5C4E34'; }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading && !text ? (
        <div className="space-y-3">
          <div className="h-4 w-full rounded animate-pulse" style={{ background: 'rgba(224,176,64,0.08)' }} />
          <div className="h-4 w-3/4 rounded animate-pulse" style={{ background: 'rgba(224,176,64,0.08)' }} />
        </div>
      ) : (
        <>
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: '20px', fontStyle: 'italic',
            fontWeight: 300, color: '#FFFFFF', lineHeight: 1.75, letterSpacing: '-0.01em',
            opacity: loading ? 0.5 : 1,
            transition: 'opacity 0.3s ease',
          }}>
            {text}
          </p>
          <div className="mt-4 pt-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(224,176,64,0.12)' }}>
            <span style={{
              display: 'inline-block',
              background: 'rgba(224,176,64,0.10)',
              border: '1px solid rgba(224,176,64,0.25)',
              borderRadius: 'var(--r-pill)',
              padding: '4px 14px',
              fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 500,
              color: '#E0B040',
            }}>
              {info.name}
            </span>
            {isFallback && (
              <span style={{
                fontFamily: 'var(--font-body)', fontSize: '10px', color: '#8B7D5E',
                fontStyle: 'italic',
              }}>
                Guidance from your archetype
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NextSacredStep;
