import { useEffect, useState } from "react";
import SEOHead from "@/components/SEOHead";
import EmptyState from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Flame, CheckCircle2, Sparkles } from "lucide-react";
import { startOfWeek, endOfWeek, format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";
import EducationBanner from "@/components/EducationBanner";
import { checkAndAwardRitualBadges } from "@/lib/actions/badges";

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
  const [reflection, setReflection] = useState("");
  const [shareToFeed, setShareToFeed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pastCompletions, setPastCompletions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      const { start, end } = getCurrentWeekRange();
      const { data: current } = await supabase.from("rituals").select("*").gte("week_of", start).lte("week_of", end).eq("published", true).limit(1).maybeSingle();
      setCurrentRitual(current);
      const { data: past } = await supabase.from("rituals").select("*").lt("week_of", start).eq("published", true).order("week_of", { ascending: false });
      setPastRituals(past ?? []);
      if (uid) {
        const { data: completions } = await supabase.from("ritual_completions").select("ritual_id").eq("user_id", uid);
        const completedIds = new Set((completions ?? []).map((c) => c.ritual_id));
        setPastCompletions(completedIds);
        if (current && completedIds.has(current.id)) setCompleted(true);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleComplete = async () => {
    if (!userId || !currentRitual) return;
    setSubmitting(true);
    await supabase.from("ritual_completions").insert({ user_id: userId, ritual_id: currentRitual.id, reflection: reflection.trim() || null, shared_to_feed: shareToFeed });
    if (shareToFeed && reflection.trim()) {
      await supabase.from("posts").insert({ author_id: userId, post_type: "ritual_share" as const, content: `✨ Completed this week's ritual: "${currentRitual.title}"\n\n${reflection.trim()}` });
    }
    await checkAndAwardRitualBadges(userId);
    setCompleted(true);
    setPastCompletions((prev) => new Set(prev).add(currentRitual.id));
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <p style={{ fontFamily: 'var(--font-body)', color: '#A08B62' }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8 ss-appear">
      <SEOHead title="Rituals — Money Spirit" />
      <EducationBanner />

      <div className="flex items-center gap-3">
        <Sparkles size={32} style={{ color: '#EEC96E' }} />
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 300, color: '#F2EAD8', letterSpacing: '-0.03em' }}>Rituals</h1>
      </div>

      {currentRitual ? (
        <div className="ss-elevated ss-appear ss-appear-1 space-y-5" style={{ padding: '36px 40px' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C4973A', marginBottom: '10px' }}>This week's ritual</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '34px', fontWeight: 300, color: '#F2EAD8', letterSpacing: '-0.03em' }}>{currentRitual.title}</h2>
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
            <div className="flex items-center gap-3 py-4 relative animate-celebration">
              <CheckCircle2 size={28} style={{ color: '#4DB89A' }} />
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 400, color: '#4DB89A' }}>Ritual complete. Well done.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label style={{ fontSize: '14px', fontFamily: 'var(--font-body)', fontWeight: 500, color: '#F2EAD8' }}>Your reflection (optional — just for you)</label>
                <textarea value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder="Write your thoughts here..." className="ms-input-dark min-h-[100px]" style={{ resize: 'vertical' }} />
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
        <EmptyState icon={Sparkles} iconClassName="text-gold" heading="Your ritual is being prepared" body="A new money ritual will be published shortly. Come back on Monday." />
      )}

      {pastRituals.length > 0 && (
        <div className="space-y-3">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 400, color: '#F2EAD8', letterSpacing: '-0.02em' }}>Past Rituals</h3>
          <Accordion type="single" collapsible className="space-y-2">
            {pastRituals.map((ritual) => (
              <AccordionItem key={ritual.id} value={ritual.id} className="ss-interactive" style={{ padding: '12px 16px', borderRadius: 'var(--r-md)' }}>
                <AccordionTrigger className="hover:no-underline" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#F2EAD8' }}>
                  <div className="flex items-center gap-2 text-left">
                    {pastCompletions.has(ritual.id) ? (
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
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  );
};

export default Rituals;
