import { useEffect, useState } from "react";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
        <p className="text-muted-foreground font-body">Loading…</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8 animate-fade-in">
      <SEOHead title="Rituals — Money Spirit" />
      <EducationBanner />

      <div className="flex items-center gap-3">
        <Flame className="text-accent" size={28} />
        <h1 className="text-3xl font-heading text-foreground">Rituals</h1>
      </div>

      {currentRitual ? (
        <Card className="border bg-card shadow-none animate-slide-up">
          <CardContent className="p-6 space-y-5">
            <div>
              <p className="text-xs font-body text-muted-foreground uppercase tracking-wider mb-1">This week's ritual</p>
              <h2 className="text-2xl font-heading text-foreground">{currentRitual.title}</h2>
            </div>

            <p className="text-sm font-body text-foreground leading-relaxed">{currentRitual.description}</p>

            {currentRitual.reflection_prompt && (
              <div className="bg-primary/5 rounded-xl p-5 border border-border">
                <p className="text-sm font-body text-foreground italic leading-relaxed">{currentRitual.reflection_prompt}</p>
              </div>
            )}

            {completed ? (
              <div className="flex items-center gap-3 py-4 relative animate-celebration">
                <CheckCircle2 className="text-green-600" size={28} />
                <p className="font-heading text-xl text-green-700">Ritual complete. Well done.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-body font-medium text-foreground">Your reflection (optional — just for you)</label>
                  <Textarea value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder="Write your thoughts here..." className="min-h-[100px] bg-background border-input font-body resize-none" />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="share" checked={shareToFeed} onCheckedChange={(v) => setShareToFeed(v === true)} />
                  <label htmlFor="share" className="text-sm font-body text-foreground cursor-pointer">Share my reflection with the community</label>
                </div>
                <Button variant="gold" onClick={handleComplete} disabled={submitting} className="w-full sm:w-auto">
                  {submitting ? "Completing…" : "Complete this ritual"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <EmptyState icon={Sparkles} iconClassName="text-accent" heading="Your ritual is being prepared" body="A new money ritual will be published shortly. Come back on Monday." />
      )}

      {pastRituals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-heading text-foreground">Past Rituals</h3>
          <Accordion type="single" collapsible className="space-y-2">
            {pastRituals.map((ritual) => (
              <AccordionItem key={ritual.id} value={ritual.id} className="border rounded-xl bg-card px-4">
                <AccordionTrigger className="font-body text-sm hover:no-underline">
                  <div className="flex items-center gap-2 text-left">
                    {pastCompletions.has(ritual.id) && <CheckCircle2 className="text-green-600 shrink-0" size={16} />}
                    <span className="text-foreground">{ritual.title}</span>
                    <span className="text-muted-foreground text-xs ml-2">{format(new Date(ritual.week_of), "d MMM yyyy")}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
                  <p className="text-sm font-body text-foreground">{ritual.description}</p>
                  {ritual.reflection_prompt && (
                    <div className="bg-primary/5 rounded-lg p-4 border border-border">
                      <p className="text-sm font-body text-foreground italic">{ritual.reflection_prompt}</p>
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
