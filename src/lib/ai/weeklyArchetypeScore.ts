import { scoreArchetypeFromBehaviour } from "./archetypeAI";
import { supabase } from "@/integrations/supabase/client";

const archetypeNames: Record<string, string> = {
  giver: "The Giver",
  keeper: "The Keeper",
  rebel: "The Rebel",
  seeker: "The Seeker",
  achiever: "The Achiever",
};

export async function runWeeklyArchetypeScore(userId: string) {
  const result = await scoreArchetypeFromBehaviour(userId);
  if (!result) return;

  // Update archetype_score on profile
  await supabase
    .from("profiles")
    .update({ archetype_score: result.scores })
    .eq("user_id", userId);

  // Check if suggested differs from current
  const { data: profile } = await supabase
    .from("profiles")
    .select("pathway_type")
    .eq("user_id", userId)
    .maybeSingle();

  if (profile && result.suggested !== profile.pathway_type) {
    const suggestedName = archetypeNames[result.suggested] ?? result.suggested;
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "milestone",
      title: "Your archetype is evolving",
      message: `Based on your recent activity, you may be developing traits of ${suggestedName}. Explore your profile to learn more.`,
      link: "/dashboard",
    });
  }
}
