import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import callGemini from "@/lib/ai/geminiClient";

const ARCHETYPES = ["giver", "keeper", "rebel", "seeker", "achiever"] as const;

export type ArchetypeTrendData = {
  month: string;
  giver: number;
  keeper: number;
  rebel: number;
  seeker: number;
  achiever: number;
};

export type ChurnRiskMember = {
  id: string;
  user_id: string;
  display_name: string;
  pathway_type: string | null;
  life_stage: string | null;
  ritual_streak: number;
  last_active_at: string;
  fms_score: number | null;
  plan: string | null;
};

export type RetreatDemand = {
  high_demand_count: number;
  waitlist_count: number;
  top_attendees: { id: string; display_name: string; ticket_count: number; pathway_type: string | null }[];
};

export type FMSSummary = {
  total_eligible: number;
  high_confidence: number;
  by_lead_type: Record<string, number>;
  scored_this_week: number;
};

export type AdminContext = {
  active_member_count: number;
  new_members_this_week: number;
  ritual_completions_this_week: number;
  churn_risk_count: number;
  fms_summary: FMSSummary;
  top_archetype: string;
};

export async function getArchetypeTrends(): Promise<ArchetypeTrendData[]> {
  const now = new Date();
  const months: ArchetypeTrendData[] = [];

  for (let i = 5; i >= 0; i--) {
    const date = subMonths(now, i);
    const monthStart = startOfMonth(date).toISOString();
    const monthEnd = endOfMonth(date).toISOString();
    const label = format(date, "MMM yyyy");

    const { data } = await supabase
      .from("profiles")
      .select("pathway_type")
      .eq("onboarding_complete", true)
      .gte("created_at", monthStart)
      .lte("created_at", monthEnd);

    const row: ArchetypeTrendData = { month: label, giver: 0, keeper: 0, rebel: 0, seeker: 0, achiever: 0 };
    (data || []).forEach((p) => {
      const pt = p.pathway_type as string;
      if (pt && pt in row) (row as any)[pt]++;
    });
    months.push(row);
  }
  return months;
}

export async function getChurnRiskMembers(): Promise<ChurnRiskMember[]> {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, user_id, display_name, pathway_type, life_stage, ritual_streak, created_at, fms_score")
    .eq("onboarding_complete", true)
    .lt("created_at", fourteenDaysAgo)
    .order("created_at", { ascending: true })
    .limit(50);

  if (!profiles || profiles.length === 0) return [];

  // Filter out those with recent ritual completions
  const userIds = profiles.map((p) => p.user_id);
  const { data: recentRituals } = await supabase
    .from("ritual_completions")
    .select("user_id")
    .in("user_id", userIds)
    .gte("completed_at", fourteenDaysAgo);

  const activeUserIds = new Set((recentRituals || []).map((r) => r.user_id));

  // Get memberships
  const { data: memberships } = await supabase
    .from("memberships")
    .select("user_id, plan, status")
    .in("user_id", userIds)
    .eq("status", "active");

  const membershipMap = new Map((memberships || []).map((m) => [m.user_id, m]));

  const result: ChurnRiskMember[] = [];
  for (const p of profiles) {
    if (activeUserIds.has(p.user_id)) continue;
    const membership = membershipMap.get(p.user_id);
    if (!membership) continue; // only active members
    result.push({
      id: p.id,
      user_id: p.user_id,
      display_name: p.display_name,
      pathway_type: p.pathway_type,
      life_stage: p.life_stage,
      ritual_streak: p.ritual_streak,
      last_active_at: p.created_at,
      fms_score: p.fms_score,
      plan: membership.plan,
    });
    if (result.length >= 20) break;
  }
  return result;
}

export async function getRetreatDemandSignals(): Promise<RetreatDemand> {
  // Get all active tickets grouped by user
  const { data: tickets } = await supabase
    .from("event_tickets")
    .select("user_id")
    .eq("status", "active");

  const countMap = new Map<string, number>();
  (tickets || []).forEach((t) => countMap.set(t.user_id, (countMap.get(t.user_id) || 0) + 1));

  const highDemandUserIds = Array.from(countMap.entries())
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1]);

  // Get waitlist count
  const { count: waitlistCount } = await supabase
    .from("event_waitlist")
    .select("id", { count: "exact", head: true });

  // Get profiles for top attendees
  const topIds = highDemandUserIds.slice(0, 5).map(([id]) => id);
  const { data: topProfiles } = await supabase
    .from("profiles")
    .select("user_id, display_name, pathway_type")
    .in("user_id", topIds);

  const profileMap = new Map((topProfiles || []).map((p) => [p.user_id, p]));
  const top_attendees = highDemandUserIds.slice(0, 5).map(([uid, count]) => {
    const p = profileMap.get(uid);
    return {
      id: uid,
      display_name: p?.display_name || "Unknown",
      ticket_count: count,
      pathway_type: p?.pathway_type || null,
    };
  });

  return {
    high_demand_count: highDemandUserIds.length,
    waitlist_count: waitlistCount || 0,
    top_attendees,
  };
}

export async function getFMSSummary(): Promise<FMSSummary> {
  const { data } = await supabase
    .from("profiles")
    .select("fms_referral_eligible, fms_confidence, fms_lead_type, fms_last_scored_at")
    .not("fms_last_scored_at", "is", null);

  const profiles = data || [];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const by_lead_type: Record<string, number> = {};
  let total_eligible = 0;
  let high_confidence = 0;
  let scored_this_week = 0;

  profiles.forEach((p) => {
    if (p.fms_referral_eligible) total_eligible++;
    if (p.fms_confidence === "high") high_confidence++;
    if (p.fms_last_scored_at && p.fms_last_scored_at > sevenDaysAgo) scored_this_week++;
    if (p.fms_lead_type) by_lead_type[p.fms_lead_type] = (by_lead_type[p.fms_lead_type] || 0) + 1;
  });

  return { total_eligible, high_confidence, by_lead_type, scored_this_week };
}

export async function getWeeklyAIDigest(): Promise<string> {
  const CACHE_KEY = "founder_digest";
  const ONE_HOUR = 60 * 60 * 1000;

  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const { text, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < ONE_HOUR) return text;
    }
  } catch {}

  // Gather stats
  const { count: activeMemberCount } = await supabase
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const { count: newMembersThisWeek } = await supabase
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo);

  const { count: ritualCompletionsThisWeek } = await supabase
    .from("ritual_completions")
    .select("id", { count: "exact", head: true })
    .gte("completed_at", sevenDaysAgo);

  const churnMembers = await getChurnRiskMembers();
  const fmsSummary = await getFMSSummary();

  // Top archetype this month
  const monthStart = startOfMonth(new Date()).toISOString();
  const { data: monthProfiles } = await supabase
    .from("profiles")
    .select("pathway_type")
    .eq("onboarding_complete", true)
    .gte("created_at", monthStart);

  const archetypeCounts: Record<string, number> = {};
  (monthProfiles || []).forEach((p) => {
    if (p.pathway_type) archetypeCounts[p.pathway_type] = (archetypeCounts[p.pathway_type] || 0) + 1;
  });
  const topArchetype = Object.entries(archetypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "seeker";

  const archetypeNames: Record<string, string> = {
    giver: "Giver", keeper: "Keeper", rebel: "Rebel", seeker: "Seeker", achiever: "Achiever",
  };

  const systemPrompt = "You are the Money Spirit Founder Intelligence engine writing a private weekly briefing for Madhu Chaudhuri, the founder of Money Spirit and director of FMS mortgage brokerage. Write in a warm, direct, founder-to-founder tone. Be concise and action-oriented. Maximum 4 short paragraphs. No bullet points. No headings. Plain prose only.";

  const userPrompt = `This week on Money Spirit: ${activeMemberCount || 0} active members, ${newMembersThisWeek || 0} new this week. ${ritualCompletionsThisWeek || 0} rituals completed. ${churnMembers.length} members showing churn risk signals. Top archetype this month: The ${archetypeNames[topArchetype] || topArchetype}. FMS leads: ${fmsSummary.total_eligible} eligible, ${fmsSummary.high_confidence} high confidence. Write Madhu a brief founder intelligence summary covering: community health, engagement trends, FMS opportunity, and one recommended action for this week.`;

  const text = await callGemini(userPrompt, systemPrompt);

  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ text, timestamp: Date.now() }));
  } catch {}

  return text;
}
