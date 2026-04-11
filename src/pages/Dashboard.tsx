import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
        <p className="text-muted-foreground font-body">Loading…</p>
      </div>
    );
  }

  const pathway = profile.pathway_type ?? "keeper";
  const info = archetypeDisplay[pathway] ?? archetypeDisplay.keeper;
  const progress = pathwayProgress[pathway] ?? 15;
  const streak = profile.ritual_streak ?? 0;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Welcome heading */}
      <div className="animate-slide-up">
        <h1 className="text-3xl font-heading text-navy mb-1">
          Welcome back, {profile.display_name}
        </h1>
        <p className="text-navy-deep/70 font-body">
          Your personalised pathway to financial wellbeing
        </p>
      </div>

      {/* Archetype card */}
      <Card
        className="border-l-4 bg-white shadow-none animate-slide-up"
        style={{ borderLeftColor: info.accent }}
      >
        <CardContent className="p-6">
          <h2 className="font-heading text-2xl mb-1" style={{ color: info.accent }}>
            {info.name}
          </h2>
          <p className="text-sm font-body text-navy-deep/60 line-clamp-2">
            {info.description}
          </p>
        </CardContent>
      </Card>

      {/* Next Sacred Step AI widget */}
      {profile.onboarding_complete && (
        <NextSacredStep userId={profile.user_id} profile={profile} />
      )}

      {/* Progress overview */}
      <div className="space-y-2 animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-body text-navy font-medium">
            {info.name} Pathway Progress
          </span>
          <span className="text-sm font-body text-navy">{progress}%</span>
        </div>
        <Progress value={progress} className="h-3 bg-muted [&>div]:bg-gold" />
      </div>

      {/* Two cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
        {/* Ritual card */}
        <Card className="border border-border bg-white shadow-none animate-slide-up">
          <CardContent className="p-6 flex flex-col items-start gap-4">
            <div className="flex items-center gap-2">
              <Flame className="text-gold" size={22} />
              <span className="font-heading text-xl text-navy">This week's ritual</span>
            </div>
            <p className="text-sm text-navy-deep/70 font-body">
              Stay aligned with your financial intentions through a guided practice.
            </p>
            <Button variant="gold" asChild>
              <Link to="/rituals">Complete it</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Learn card */}
        <Card className="border border-border bg-white shadow-none">
          <CardContent className="p-6 flex flex-col items-start gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="text-navy" size={22} />
              <span className="font-heading text-xl text-navy">Continue learning</span>
            </div>
            <p className="text-sm text-navy-deep/70 font-body">
              Pick up where you left off on your {info.name} learning path.
            </p>
            <Button variant="default" asChild>
              <Link to="/learn">Go to lessons</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Streak counter */}
      {streak > 0 && (
        <div className="flex items-center gap-3">
          <Badge className={`bg-gold text-navy border-0 px-4 py-2 text-sm font-body font-semibold ${streak >= 3 ? 'animate-streak-glow' : ''} shadow-[0_0_15px_rgba(201,148,30,0.4)]`}>
            <Flame size={16} className="mr-1.5" />
            {streak} week streak
          </Badge>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
