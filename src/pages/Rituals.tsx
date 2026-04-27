import { useEffect, useState } from "react";
import SEOHead from "@/components/SEOHead";
import EmptyState from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Flame, CheckCircle2, Sparkles, Calendar } from "lucide-react";
import { startOfWeek, endOfWeek, format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";
import EducationBanner from "@/components/EducationBanner";

import { toast } from "@/hooks/use-toast";

type Ritual = Tables<"rituals">;

const getCurrentWeekRange = () => {
  const now = new Date();
  const monday = startOfWeek(now, { weekStartsOn: 1 });
  const sunday = endOfWeek(now, { weekStartsOn: 1 });
  return { start: format(monday, "yyyy-MM-dd"), end: format(sunday, "yyyy-MM-dd") };
};

const Rituals = () => {
  const [currentRitual, setCurrentRitual] = useState<Ritual | null>(null);
  const [pastRituals, setPastRituals] = useState<Ritual[]>([]);
  const [completed, setCompleted] = useState(false);
  const [savedReflection, setSavedReflection] = useState<string | null>(null);
  const [reflection, setReflection] = useState("");
  const [shareToFeed, setShareToFeed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pastCompletions, setPastCompletions] = useState<Map<string, string | null>>(new Map());
  const [ritualStreak, setRitualStreak] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      const { start, end } = getCurrentWeekRange();

      const { data: current } = await supabase
        .from("rituals")
        .select("*")
        .gte("week_of", start)
        .lte("week_of", end)
        .eq("published", true)
        .limit(1)
        .maybeSingle();
      setCurrentRitual(current);

      const { data: past } = await supabase
        .from("rituals")
        .select("*")
        .lt("week_of", start)
        .eq("published", true)
        .order("week_of", { ascending: false });
      setPastRituals(past ?? []);

      if (uid) {
        // Get all completions for this user
        const { data: completions } = await supabase
          .from("ritual_completions")
          .select("ritual_id, reflection")
          .eq("user_id", uid);

        const completionMap = new Map<string, string | null>();
        (completions ?? []).forEach((c) => completionMap.set(c.ritual_id, c.reflection));
        setPastCompletions(completionMap);

        if (current && completionMap.has(current.id)) {
          setCompleted(true);
          setSavedReflection(completionMap.get(current.id) ?? null);
        }

        // Get streak
        const { data: profile } = await supabase
          .from("profiles")
          .select("ritual_streak")
          .eq("user_id", uid)
          .maybeSingle();
        setRitualStreak(profile?.ritual_streak ?? 0);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleComplete = async () => {
    if (!userId || !currentRitual) return;
    setSubmitting(true);

    const { error } = await supabase.from("ritual_completions").insert({
      user_id: userId,
      ritual_id: currentRitual.id,
      reflection: reflection.trim() || null,
      shared_to_feed: shareToFeed,
    });

    if (error) {
      // Unique constraint violation means already completed
      if (error.code === "23505") {
        setCompleted(true);
        toast({ title: "Already completed", description: "You've already completed this ritual." });
      } else {
        toast({ title: "Error", description: "Could not save your completion. Please try again.", variant: "destructive" });
      }
      setSubmitting(false);
      return;
    }

    if (shareToFeed && reflection.trim()) {
      await supabase.from("posts").insert({
        author_id: userId,
        post_type: "ritual_share" as const,
        content: `✨ Completed this week's ritual: "${currentRitual.title}"\n\n${reflection.trim()}`,
      });
    }

    // Re-fetch streak after completion (trigger updates it)
    const { data: updatedProfile } = await supabase
      .from("profiles")
      .select("ritual_streak")
      .eq("user_id", userId)
      .maybeSingle();
    setRitualStreak(updatedProfile?.ritual_streak ?? ritualStreak + 1);

    setCompleted(true);
    setSavedReflection(reflection.trim() || null);
    setPastCompletions((prev) => new Map(prev).set(currentRitual.id, reflection.trim() || null));
    setSubmitting(false);

    toast({ title: "Ritual complete ✨", description: "Your completion has been saved." });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#C4973A', borderTopColor: 'transparent' }} />
          <p style={{ fontFamily: 'var(--font-body)', color: '#A08B62', fontSize: '14px' }}>Loading rituals…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto space-y-8 ss-appear">
      <SEOHead title="Weekly Money Rituals — Money Spirit" description="Guided weekly practices to build a conscious, healthy relationship with your money." />
      <EducationBanner />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Sparkles size={32} style={{ color: '#EEC96E' }} />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 300, color: '#F2EAD8', letterSpacing: '-0.03em' }}>Rituals</h1>
        </div>
        {ritualStreak > 0 && (
          <span
            className={ritualStreak >= 3 ? 'animate-streak-glow' : ''}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'rgba(196,151,58,0.09)',
              border: '1px solid rgba(196,151,58,0.22)',
              borderRadius: 'var(--r-pill)',
              padding: '7px 16px',
              fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500,
              color: '#EEC96E',
            }}
          >
            <Flame size={16} />
            {ritualStreak} week streak
          </span>
        )}
      </div>

      {currentRitual ? (
        <div className="ss-elevated ss-appear ss-appear-1 space-y-5" style={{ padding: 'clamp(24px, 4vw, 36px) clamp(20px, 4vw, 40px)' }}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={14} style={{ color: '#C4973A' }} />
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C4973A' }}>
                Week of {format(new Date(currentRitual.week_of), "d MMM yyyy")}
              </p>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 3.5vw, 34px)', fontWeight: 300, color: '#F2EAD8', letterSpacing: '-0.03em' }}>{currentRitual.title}</h2>
          </div>

          <p style={{ fontSize: '15px', fontFamily: 'var(--font-body)', color: '#D4C49A', lineHeight: 1.75 }}>{currentRitual.description}</p>

          {currentRitual.reflection_prompt && (
            <div style={{
              background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(196,151,58,0.12)',
              borderRadius: '12px', padding: '16px 20px',
            }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontStyle: 'italic', color: '#A08B62', lineHeight: 1.75 }}>{currentRitual.reflection_prompt}</p>
            </div>
          )}

          {completed ? (
            <div className="ritual-complete-card with-glow space-y-4" style={{
              background: 'linear-gradient(135deg, rgba(196,151,58,0.06) 0%, rgba(238,201,110,0.03) 100%)',
              border: '1px solid rgba(196,151,58,0.18)',
              borderRadius: '16px', padding: '24px 28px',
            }}>
              <div className="flex items-center gap-4">
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(196,151,58,0.15), rgba(238,201,110,0.08))',
                  border: '1px solid rgba(238,201,110,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="ritual-check-svg">
                    <path d="M5 13l4 4L19 7" stroke="#EEC96E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 400, color: '#EEC96E', letterSpacing: '-0.02em' }}>Ritual complete</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#A08B62', marginTop: '2px' }}>Your intention has been set for this week.</p>
                </div>
              </div>
              {savedReflection && (
                <div style={{
                  background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(196,151,58,0.10)',
                  borderRadius: '12px', padding: '16px 20px', marginTop: '8px',
                }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#5C4E34', marginBottom: '8px' }}>Your reflection</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#D4C49A', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{savedReflection}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label style={{ fontSize: '14px', fontFamily: 'var(--font-body)', fontWeight: 500, color: '#F2EAD8' }}>Your reflection (optional)</label>
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="Write your thoughts here…"
                  className="ms-input-dark min-h-[100px] w-full"
                  style={{ resize: 'vertical', fontSize: '15px', lineHeight: 1.7 }}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="share" checked={shareToFeed} onCheckedChange={(v) => setShareToFeed(v === true)} />
                <label htmlFor="share" style={{ fontSize: '14px', fontFamily: 'var(--font-body)', color: '#F2EAD8', cursor: 'pointer' }}>Share my reflection with the community</label>
              </div>
              <Button variant="gold" onClick={handleComplete} disabled={submitting} className="w-full sm:w-auto btn-gold">
                {submitting ? "Completing…" : "Complete this ritual"}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={Sparkles}
          iconClassName="text-gold"
          heading="A new ritual is on its way"
          body="Your next money ritual will arrive on Monday. In the meantime, revisit your past rituals below."
        />
      )}

      {pastRituals.length > 0 && (
        <div className="space-y-3 ss-appear ss-appear-2">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 400, color: '#F2EAD8', letterSpacing: '-0.02em' }}>Past Rituals</h3>
          <Accordion type="single" collapsible className="space-y-2">
            {pastRituals.map((ritual) => {
              const isComplete = pastCompletions.has(ritual.id);
              const pastReflection = pastCompletions.get(ritual.id);
              return (
                <AccordionItem key={ritual.id} value={ritual.id} className="ss-interactive" style={{ padding: '12px 16px', borderRadius: 'var(--r-md)' }}>
                  <AccordionTrigger className="hover:no-underline" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#F2EAD8' }}>
                    <div className="flex items-center gap-2 text-left">
                      {isComplete ? (
                        <CheckCircle2 className="shrink-0" size={16} style={{ color: '#4DB89A' }} />
                      ) : (
                        <div className="w-4 h-4 rounded-full border shrink-0" style={{ borderColor: '#5C4E34' }} />
                      )}
                      <span>{ritual.title}</span>
                      <span style={{ fontSize: '12px', marginLeft: '8px', color: '#5C4E34' }}>{format(new Date(ritual.week_of), "d MMM yyyy")}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pb-4">
                    <p style={{ fontSize: '14px', fontFamily: 'var(--font-body)', color: '#D4C49A' }}>{ritual.description}</p>
                    {ritual.reflection_prompt && (
                      <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(196,151,58,0.12)', borderRadius: '12px', padding: '16px 20px' }}>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontStyle: 'italic', color: '#A08B62' }}>{ritual.reflection_prompt}</p>
                      </div>
                    )}
                    {isComplete && pastReflection && (
                      <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(196,151,58,0.10)', borderRadius: '12px', padding: '14px 18px' }}>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#5C4E34', marginBottom: '6px' }}>Your reflection</p>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#D4C49A', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{pastReflection}</p>
                      </div>
                    )}
                    {isComplete && !pastReflection && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} style={{ color: '#4DB89A' }} />
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#4DB89A' }}>Completed</span>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      )}
    </div>
  );
};

export default Rituals;
