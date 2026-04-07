import { supabase } from "@/integrations/supabase/client";

export async function getUserBadges(userId: string) {
  const { data } = await supabase
    .from("user_badges")
    .select("*, badges(*)")
    .eq("user_id", userId);
  return data ?? [];
}

export async function getAllBadges() {
  const { data } = await supabase
    .from("badges")
    .select("*")
    .order("name");
  return data ?? [];
}

export async function awardBadge(userId: string, badgeSlug: string, awardedBy?: string) {
  const { data: badge } = await supabase
    .from("badges")
    .select("id")
    .eq("slug", badgeSlug)
    .maybeSingle();

  if (!badge) return;

  // Check if already awarded
  const { data: existing } = await supabase
    .from("user_badges")
    .select("id")
    .eq("user_id", userId)
    .eq("badge_id", badge.id)
    .maybeSingle();

  if (existing) return;

  await supabase.from("user_badges").insert({
    user_id: userId,
    badge_id: badge.id,
    awarded_by: awardedBy ?? userId,
  });
}

export async function checkAndAwardRitualBadges(userId: string) {
  // Award first-ritual
  await awardBadge(userId, "first-ritual");

  // Check streak from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("ritual_streak")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile) return;

  const streak = profile.ritual_streak;
  if (streak >= 5) await awardBadge(userId, "ritual-streak-5");
  if (streak >= 10) await awardBadge(userId, "ritual-streak-10");
  if (streak >= 25) await awardBadge(userId, "ritual-streak-25");
}

export async function checkAndAwardPostBadges(userId: string, postType: string) {
  await awardBadge(userId, "community");
  if (postType === "win") {
    await awardBadge(userId, "first-win");
  }
}
