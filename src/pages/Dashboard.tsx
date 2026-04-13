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
        <p style={{ color: 'var(--text-3)', fontSize: '14px', fontFamily: 'var(--font-body)' }}>Loading…</p>
      </div>
    );
  }

  const pathway = profile.pathway_type ?? "keeper";
  const info = archetypeDisplay[pathway] ?? archetypeDisplay.keeper;
  const progress = pathwayProgress[pathway] ?? 15;
  const streak = profile.ritual_streak ?? 0;

  return (
    <div className="px-5 py-6 md:px-10 md:py-8 max-w-4xl mx-auto space-y-8">
      <SEOHead title="Dashboard — Money Spirit" />

      {/* Welcome heading */}
      <div className="animate-glass animate-glass-1">
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 300,
          letterSpacing: '-0.03em', color: 'var(--text-1)', marginBottom: '4px',
        }}>
          Welcome back, {profile.display_name}
        </h1>
        <p style={{ color: 'var(--text-3)', fontSize: '14px', fontFamily: 'var(--font-body)' }}>
          Your personalised pathway to financial wellbeing
        </p>
      </div>

      {/* Archetype card */}
      <div className="glass-elevated animate-glass animate-glass-2" style={{ position: 'relative' }}>
        {/* Accent strip */}
        <div style={{
          position: 'absolute', left: 0, top: '20%', width: '3px', height: '60%',
          background: `linear-gradient(180deg, ${info.accent} 0%, transparent 100%)`,
          borderRadius: '0 2px 2px 0',
          boxShadow: `0 0 12px ${info.accent}66`,
        }} />
        <div style={{ paddingLeft: '12px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 400,
            color: info.accent, letterSpacing: '-0.02em', marginBottom: '4px',
          }}>
            {info.name}
          </h2>
          <p style={{ color: 'var(--text-2)', fontSize: '14px', lineHeight: 1.65, fontFamily: 'var(--font-body)' }}>
            {info.description}
          </p>
        </div>
      </div>

      {/* Next Sacred Step AI widget */}
      {profile.onboarding_complete && (
        <div className="animate-glass animate-glass-3">
          <NextSacredStep userId={profile.user_id} profile={profile} />
        </div>
      )}

      {/* Progress overview */}
      <div className="space-y-2 animate-glass animate-glass-4">
        <div className="flex items-center justify-between">
          <span style={{ color: 'var(--text-3)', fontSize: '13px', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
            {info.name} Pathway Progress
          </span>
          <span style={{ color: 'var(--text-gold)', fontSize: '13px', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
            {progress}%
          </span>
        </div>
        <div style={{ height: '4px', borderRadius: 'var(--r-full)', overflow: 'hidden', background: 'rgba(255,255,255,0.08)' }}>
          <div style={{
            height: '100%', borderRadius: 'var(--r-full)',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #C9941E 0%, #F5C842 100%)',
            boxShadow: '0 0 8px rgba(245,200,66,0.4)',
            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
        </div>
      </div>

      {/* Two cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-glass animate-glass-5">
        <div className="glass-interactive flex flex-col items-start gap-4">
          <div className="flex items-center gap-2">
            <Flame size={18} style={{ color: 'var(--gold-base)' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 400, color: 'var(--text-1)' }}>This week's ritual</span>
          </div>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
            Stay aligned with your financial intentions through a guided practice.
          </p>
          <Button variant="gold" asChild><Link to="/rituals">Complete it</Link></Button>
        </div>

        <div className="glass-interactive flex flex-col items-start gap-4">
          <div className="flex items-center gap-2">
            <BookOpen size={18} style={{ color: 'var(--gold-base)' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 400, color: 'var(--text-1)' }}>Continue learning</span>
          </div>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
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
              background: 'rgba(201, 148, 30, 0.10)',
              border: '1px solid rgba(201, 148, 30, 0.25)',
              borderRadius: 'var(--r-full)',
              padding: '8px 16px',
              boxShadow: 'inset 0 1px 0 rgba(245,200,66,0.15)',
              fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500,
              color: 'var(--text-gold)',
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
