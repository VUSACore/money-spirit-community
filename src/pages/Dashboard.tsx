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
  giver: { name: "The Giver", accent: "#D4856A", description: "You lead with generosity and care deeply about providing for others." },
  keeper: { name: "The Keeper", accent: "#6B9EC4", description: "You value security above all else. Building a solid foundation is your strength." },
  rebel: { name: "The Rebel", accent: "#A87CC4", description: "You reject traditional money rules and forge your own bold path." },
  seeker: { name: "The Seeker", accent: "#4DB89A", description: "You approach money with curiosity and a desire to understand its deeper purpose." },
  achiever: { name: "The Achiever", accent: "#C4973A", description: "You are driven, ambitious, and focused on growth with unstoppable belief." },
};

const pathwayProgress: Record<string, number> = {
  giver: 10, keeper: 15, rebel: 20, seeker: 45, achiever: 75,
};

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from("profiles").select("*").eq("user_id", session.user.id).maybeSingle();
      setProfile(data);
    };
    load();
  }, []);

  if (!profile) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <p style={{ color: '#A08B62', fontSize: '14px', fontFamily: 'var(--font-body)' }}>Loading…</p>
      </div>
    );
  }

  const pathway = profile.pathway_type ?? "keeper";
  const info = archetypeDisplay[pathway] ?? archetypeDisplay.keeper;
  const progress = pathwayProgress[pathway] ?? 15;
  const streak = profile.ritual_streak ?? 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8" style={{ padding: 'clamp(24px, 4vw, 40px) clamp(20px, 5vw, 48px)' }}>
      <SEOHead title="Dashboard — Money Spirit" />

      {/* Welcome heading */}
      <div className="ss-appear ss-appear-1">
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 300,
          letterSpacing: '-0.035em', color: '#F2EAD8', marginBottom: '6px', lineHeight: 1.1,
        }}>
          Welcome back, {profile.display_name}
        </h1>
        <p style={{ color: '#A08B62', fontSize: '14px', fontFamily: 'var(--font-body)' }}>
          Your personalised pathway to financial wellbeing
        </p>
      </div>

      {/* Archetype card */}
      <div className="ss-elevated ss-appear ss-appear-2" style={{ position: 'relative', padding: '28px 32px' }}>
        {/* Left accent bar */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
          borderRadius: '22px 0 0 22px',
          background: `linear-gradient(180deg, transparent 0%, ${info.accent} 20%, ${info.accent} 80%, transparent 100%)`,
          boxShadow: `0 0 16px ${info.accent}4D`,
        }} />
        <div style={{ paddingLeft: '12px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 400,
            color: info.accent, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '8px',
          }}>
            {info.name}
          </h2>
          <p style={{ color: '#D4C49A', fontSize: '14px', lineHeight: 1.70, fontFamily: 'var(--font-body)' }}>
            {info.description}
          </p>
        </div>
      </div>

      {/* Next Sacred Step AI widget */}
      {profile.onboarding_complete && (
        <div className="ss-appear ss-appear-3">
          <NextSacredStep userId={profile.user_id} profile={profile} />
        </div>
      )}

      {/* Progress overview */}
      <div className="space-y-2 ss-appear ss-appear-4">
        <div className="flex items-center justify-between">
          <span style={{ color: '#A08B62', fontSize: '12px', fontFamily: 'var(--font-body)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {info.name} Pathway Progress
          </span>
          <span style={{ color: '#EEC96E', fontSize: '12px', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
            {progress}%
          </span>
        </div>
        <div style={{ height: '3px', borderRadius: 'var(--r-pill)', overflow: 'hidden', background: 'rgba(196,151,58,0.12)' }}>
          <div style={{
            height: '100%', borderRadius: 'var(--r-pill)',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #8B6612 0%, #C4973A 50%, #EEC96E 100%)',
            boxShadow: '0 0 8px rgba(238,201,110,0.35)',
            transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
        </div>
      </div>

      {/* Two cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ss-appear ss-appear-5">
        <div className="ss-interactive flex flex-col items-start gap-4" style={{ padding: '22px 24px' }}>
          <div className="flex items-center gap-2">
            <Flame size={20} style={{ color: '#C4973A' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '21px', fontWeight: 400, color: '#F2EAD8', letterSpacing: '-0.02em' }}>This week's ritual</span>
          </div>
          <p style={{ color: '#A08B62', fontSize: '13px', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
            Stay aligned with your financial intentions through a guided practice.
          </p>
          <Button variant="gold" asChild><Link to="/rituals">Complete it</Link></Button>
        </div>

        <div className="ss-interactive flex flex-col items-start gap-4" style={{ padding: '22px 24px' }}>
          <div className="flex items-center gap-2">
            <BookOpen size={20} style={{ color: '#C4973A' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '21px', fontWeight: 400, color: '#F2EAD8', letterSpacing: '-0.02em' }}>Continue learning</span>
          </div>
          <p style={{ color: '#A08B62', fontSize: '13px', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
            Pick up where you left off on your {info.name} learning path.
          </p>
          <Button variant="default" asChild><Link to="/learn">Go to lessons</Link></Button>
        </div>
      </div>

      {/* Streak badge */}
      {streak > 0 && (
        <div className="flex items-center gap-3">
          <span
            className={streak >= 3 ? 'animate-streak-glow' : ''}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'rgba(196,151,58,0.09)',
              border: '1px solid rgba(196,151,58,0.22)',
              borderRadius: 'var(--r-pill)',
              padding: '7px 16px',
              boxShadow: 'inset 0 1px 0 rgba(238,201,110,0.10), 0 0 12px rgba(196,151,58,0.10)',
              fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500,
              color: '#EEC96E',
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
