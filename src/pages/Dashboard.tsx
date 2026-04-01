import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, BookOpen } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

const pathwayLabels: Record<string, string> = {
  foundation: "Foundation",
  growth: "Growth",
  abundance: "Abundance",
};

const pathwayProgress: Record<string, number> = {
  foundation: 15,
  growth: 45,
  abundance: 75,
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
        .eq("id", session.user.id)
        .single();
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

  const pathway = profile.pathway_type ?? "foundation";
  const label = pathwayLabels[pathway] ?? "Foundation";
  const progress = pathwayProgress[pathway] ?? 15;
  const streak = profile.ritual_streak ?? 0;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Welcome heading */}
      <div>
        <h1 className="text-3xl font-heading text-foreground mb-1">
          Welcome to your {label} Journey, {profile.display_name}
        </h1>
        <p className="text-muted-foreground font-body">
          Your personalised pathway to financial wellbeing
        </p>
      </div>

      {/* Progress overview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-body text-foreground font-medium">
            {label} Pathway Progress
          </span>
          <span className="text-sm font-body text-muted-foreground">{progress}%</span>
        </div>
        <Progress value={progress} className="h-3 bg-muted [&>div]:bg-gold" />
      </div>

      {/* Two cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ritual card */}
        <Card className="border-0 bg-gold/10 shadow-none">
          <CardContent className="p-6 flex flex-col items-start gap-4">
            <div className="flex items-center gap-2">
              <Flame className="text-gold" size={22} />
              <span className="font-heading text-xl text-foreground">This week's ritual</span>
            </div>
            <p className="text-sm text-muted-foreground font-body">
              Stay aligned with your financial intentions through a guided practice.
            </p>
            <Button variant="gold" asChild>
              <Link to="/rituals">Complete it</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Learn card */}
        <Card className="border-0 bg-primary/5 shadow-none">
          <CardContent className="p-6 flex flex-col items-start gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="text-foreground" size={22} />
              <span className="font-heading text-xl text-foreground">Continue learning</span>
            </div>
            <p className="text-sm text-muted-foreground font-body">
              Pick up where you left off on your {label} learning path.
            </p>
            <Button variant="outline" asChild>
              <Link to="/learn">Go to lessons</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Streak counter */}
      {streak > 0 && (
        <div className="flex items-center gap-3">
          <Badge className="bg-gold text-foreground border-0 px-4 py-2 text-sm font-body font-semibold animate-pulse shadow-[0_0_15px_rgba(201,148,30,0.4)]">
            <Flame size={16} className="mr-1.5" />
            {streak} week streak
          </Badge>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
