import { useEffect, useState } from "react";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, BookOpen } from "lucide-react";
import NextSacredStep from "@/components/ai/NextSacredStep";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

const archetypeDisplay: Record<string, { name: string; accent: string; description: string }> = {
  giver: { name: "The Giver", accent: "#E8845C", description: "You lead with generosity and care deeply about providing for others." },
  keeper: { name: "The Keeper", accent: "#5B8DB8", description: "You value security above all else. Building a solid foundation is your strength." },
  rebel: { name: "The Rebel", accent: "#9B59B6", description: "You reject traditional money rules and forge your own bold path." },
  seeker: { name: "The Seeker", accent: "#27AE8F", description: "You approach money with curiosity and a desire to understand its deeper purpose." },
  achiever: { name: "The Achiever", accent: "#C9941E", description: "You are driven, ambitious, and focused on growth with unstoppable belief." },
};

const pathwayProgress: Record<string, number> = {
  giver: 10,
  keeper: 15,
  rebel: 20,
  seeker: 45,
  achiever: 75,
};

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();
      setProfile(data);
    };
    load();
  }, []);

  if (!profile) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <p className="font-body text-sm" style={{ color: "var(--ms-text-secondary)" }}>Loading…</p>
      </div>
    );
  }

  const pathway = profile.pathway_type ?? "keeper";
  const info = archetypeDisplay[pathway] ?? archetypeDisplay.keeper;
  const progress = pathwayProgress[pathway] ?? 15;
  const streak = profile.ritual_streak ?? 0;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      <SEOHead title="Dashboard — Money Spirit" />

      {/* Welcome heading */}
      <div className="animate-slide-up">
        <h1 className="text-3xl font-heading mb-1" style={{ color: "var(--ms-text-primary)" }}>
          Welcome back, {profile.display_name}
        </h1>
        <p className="font-body text-sm" style={{ color: "var(--ms-text-secondary)" }}>
          Your personalised pathway to financial wellbeing
        </p>
      </div>

      {/* Archetype card */}
      <div
        className="ms-card-elevated animate-slide-up"
        style={{ borderLeft: `3px solid ${info.accent}` }}
      >
        <h2 className="font-heading text-[28px] mb-1" style={{ color: info.accent }}>
          {info.name}
        </h2>
        <p className="text-sm font-body leading-[1.7]" style={{ color: "var(--ms-text-secondary)" }}>
          {info.description}
        </p>
      </div>

      {/* Next Sacred Step AI widget */}
      {profile.onboarding_complete && (
        <NextSacredStep userId={profile.user_id} profile={profile} />
      )}

      {/* Progress overview */}
      <div className="space-y-2 animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-body font-medium" style={{ color: "var(--ms-text-secondary)" }}>
            {info.name} Pathway Progress
          </span>
          <span className="text-[13px] font-body" style={{ color: "#F5C842" }}>{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--ms-border)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: "linear-gradient(90deg, #C9941E, #F5C842)" }}
          />
        </div>
      </div>

      {/* Two cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
        {/* Ritual card */}
        <div className="ms-card flex flex-col items-start gap-4">
          <div className="flex items-center gap-2">
            <Flame size={20} style={{ color: "#C9941E" }} />
            <span className="font-heading text-xl" style={{ color: "var(--ms-text-primary)" }}>This week's ritual</span>
          </div>
          <p className="text-sm font-body" style={{ color: "var(--ms-text-secondary)" }}>
            Stay aligned with your financial intentions through a guided practice.
          </p>
          <Button variant="gold" asChild>
            <Link to="/rituals">Complete it</Link>
          </Button>
        </div>

        {/* Learn card */}
        <div className="ms-card flex flex-col items-start gap-4">
          <div className="flex items-center gap-2">
            <BookOpen size={20} style={{ color: "#C9941E" }} />
            <span className="font-heading text-xl" style={{ color: "var(--ms-text-primary)" }}>Continue learning</span>
          </div>
          <p className="text-sm font-body" style={{ color: "var(--ms-text-secondary)" }}>
            Pick up where you left off on your {info.name} learning path.
          </p>
          <Button variant="default" asChild>
            <Link to="/learn">Go to lessons</Link>
          </Button>
        </div>
      </div>

      {/* Streak counter */}
      {streak > 0 && (
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-body font-medium rounded-full ${streak >= 3 ? 'animate-streak-glow' : ''}`}
            style={{
              background: "rgba(201,148,30,0.12)",
              border: "1px solid rgba(201,148,30,0.3)",
              color: "#F5C842",
            }}
          >
            <Flame size={16} />
            {streak} week streak
          </span>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
