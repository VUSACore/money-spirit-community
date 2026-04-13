import { useEffect, useState } from "react";
import SEOHead from "@/components/SEOHead";
import EmptyState from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  return {
    start: format(monday, "yyyy-MM-dd"),
    end: format(sunday, "yyyy-MM-dd"),
  };
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
        const { data: completions } = await supabase
          .from("ritual_completions")
          .select("ritual_id")
          .eq("user_id", uid);

        const completedIds = new Set((completions ?? []).map((c) => c.ritual_id));
        setPastCompletions(completedIds);

        if (current && completedIds.has(current.id)) {
          setCompleted(true);
        }
      }

      setLoading(false);
    };
    load();
  }, []);

  const handleComplete = async () => {
    if (!userId || !currentRitual) return;
    setSubmitting(true);

    await supabase.from("ritual_completions").insert({
      user_id: userId,
      ritual_id: currentRitual.id,
      reflection: reflection.trim() || null,
      shared_to_feed: shareToFeed,
    });

    if (shareToFeed && reflection.trim()) {
      await supabase.from("posts").insert({
        author_id: userId,
        post_type: "ritual_share" as const,
        content: `✨ Completed this week's ritual: "${currentRitual.title}"\n\n${reflection.trim()}`,
      });
    }

    await checkAndAwardRitualBadges(userId);
    setCompleted(true);
    setPastCompletions((prev) => new Set(prev).add(currentRitual.id));
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <p className="font-body" style={{ color: "var(--ms-text-secondary)" }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8 animate-fade-in">
      <SEOHead title="Rituals — Money Spirit" />
      <EducationBanner />

      <div className="flex items-center gap-3">
        <Flame style={{ color: "#F5C842" }} size={28} />
        <h1 className="text-3xl font-heading" style={{ color: "var(--ms-text-primary)" }}>Rituals</h1>
      </div>

      {currentRitual ? (
        <div className="ms-card-elevated animate-slide-up space-y-5">
          <div>
            <p className="text-xs font-body uppercase tracking-wider mb-1" style={{ color: "var(--ms-text-muted)" }}>This week's ritual</p>
            <h2 className="text-[28px] font-heading" style={{ color: "var(--ms-text-primary)" }}>{currentRitual.title}</h2>
          </div>

          <p className="text-[15px] font-body leading-[1.7]" style={{ color: "var(--ms-text-secondary)" }}>{currentRitual.description}</p>

          {currentRitual.reflection_prompt && (
            <div className="rounded-lg p-4" style={{ background: "var(--ms-base)", border: "1px solid var(--ms-border-active)" }}>
              <p className="text-sm font-body italic leading-relaxed" style={{ color: "var(--ms-text-secondary)" }}>{currentRitual.reflection_prompt}</p>
            </div>
          )}

          {completed ? (
            <div className="flex items-center gap-3 py-4 relative animate-celebration">
              <CheckCircle2 size={28} style={{ color: "var(--ms-success)" }} />
              <p className="font-heading text-xl" style={{ color: "var(--ms-success)" }}>Ritual complete. Well done.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-body font-medium" style={{ color: "var(--ms-text-primary)" }}>Your reflection (optional — just for you)</label>
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="Write your thoughts here..."
                  className="ms-input-dark min-h-[100px] resize-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="share" checked={shareToFeed} onCheckedChange={(v) => setShareToFeed(v === true)} />
                <label htmlFor="share" className="text-sm font-body cursor-pointer" style={{ color: "var(--ms-text-primary)" }}>Share my reflection with the community</label>
              </div>
              <Button variant="gold" onClick={handleComplete} disabled={submitting} className="w-full sm:w-auto">
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
          <h3 className="text-lg font-heading" style={{ color: "var(--ms-text-primary)" }}>Past Rituals</h3>
          <Accordion type="single" collapsible className="space-y-2">
            {pastRituals.map((ritual) => (
              <AccordionItem key={ritual.id} value={ritual.id} className="rounded-xl px-4" style={{ border: "1px solid var(--ms-border)", background: "var(--ms-surface-1)" }}>
                <AccordionTrigger className="font-body text-sm hover:no-underline" style={{ color: "var(--ms-text-primary)" }}>
                  <div className="flex items-center gap-2 text-left">
                    {pastCompletions.has(ritual.id) ? (
                      <CheckCircle2 className="shrink-0" size={16} style={{ color: "var(--ms-success)" }} />
                    ) : (
                      <div className="w-4 h-4 rounded-full border shrink-0" style={{ borderColor: "var(--ms-text-muted)" }} />
                    )}
                    <span>{ritual.title}</span>
                    <span className="text-xs ml-2" style={{ color: "var(--ms-text-muted)" }}>{format(new Date(ritual.week_of), "d MMM yyyy")}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
                  <p className="text-sm font-body" style={{ color: "var(--ms-text-secondary)" }}>{ritual.description}</p>
                  {ritual.reflection_prompt && (
                    <div className="rounded-lg p-4" style={{ background: "var(--ms-base)", border: "1px solid var(--ms-border)" }}>
                      <p className="text-sm font-body italic" style={{ color: "var(--ms-text-secondary)" }}>{ritual.reflection_prompt}</p>
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
