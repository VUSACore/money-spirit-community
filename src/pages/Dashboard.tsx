import { useEffect, useState } from "react";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
        <p style={{ color: "#94A3B8", fontSize: "14px", fontFamily: "'DM Sans', sans-serif" }}>Loading…</p>
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
        <h1 style={{ color: "#F1F5F9", fontSize: "32px", fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, marginBottom: "4px" }}>
          Welcome back, {profile.display_name}
        </h1>
        <p style={{ color: "#94A3B8", fontSize: "14px", fontFamily: "'DM Sans', sans-serif" }}>
          Your personalised pathway to financial wellbeing
        </p>
      </div>

      {/* Archetype card */}
      <div
        className="ms-card-elevated animate-slide-up"
        style={{
          borderLeft: `3px solid ${info.accent}`,
        }}
      >
        <h2 style={{ color: info.accent, fontSize: "28px", fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, opacity: 1, marginBottom: "4px" }}>
          {info.name}
        </h2>
        <p style={{ color: "#94A3B8", fontSize: "14px", lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif", opacity: 1 }}>
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
          <span style={{ color: "#94A3B8", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
            {info.name} Pathway Progress
          </span>
          <span style={{ color: "#F5C842", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
            {progress}%
          </span>
        </div>
        <div style={{ height: "6px", borderRadius: "3px", overflow: "hidden", background: "rgba(255,255,255,0.06)" }}>
          <div
            style={{ height: "100%", borderRadius: "3px", width: `${progress}%`, background: "linear-gradient(90deg, #C9941E, #F5C842)", transition: "width 0.5s ease" }}
          />
        </div>
      </div>

      {/* Two cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
        {/* Ritual card */}
        <div
          className="ms-card flex flex-col items-start gap-4"
        >
          <div className="flex items-center gap-2">
            <Flame size={20} style={{ color: "#C9941E" }} />
            <span style={{ color: "#F1F5F9", fontFamily: "'Cormorant Garamond', serif", fontSize: "20px" }}>This week's ritual</span>
          </div>
          <p style={{ color: "#94A3B8", fontSize: "13px", lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>
            Stay aligned with your financial intentions through a guided practice.
          </p>
          <Button variant="gold" asChild>
            <Link to="/rituals">Complete it</Link>
          </Button>
        </div>

        {/* Learn card */}
        <div
          className="ms-card flex flex-col items-start gap-4"
        >
          <div className="flex items-center gap-2">
            <BookOpen size={20} style={{ color: "#C9941E" }} />
            <span style={{ color: "#F1F5F9", fontFamily: "'Cormorant Garamond', serif", fontSize: "20px" }}>Continue learning</span>
          </div>
          <p style={{ color: "#94A3B8", fontSize: "13px", lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>
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
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full ${streak >= 3 ? 'animate-streak-glow' : ''}`}
            style={{
              backgroundColor: "rgba(201,148,30,0.12)",
              border: "1px solid rgba(201,148,30,0.3)",
              color: "#F5C842",
              fontSize: "13px",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
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
