import callGemini from "./geminiClient";
import { supabase } from "@/integrations/supabase/client";

export interface FMSScoreResult {
  fms_score: number;
  fms_lead_type: string;
  fms_rationale: string;
  fms_confidence: "high" | "medium" | "low";
  fms_referral_eligible: boolean;
}

const archetypeNames: Record<string, string> = {
  giver: "The Giver",
  keeper: "The Keeper",
  rebel: "The Rebel",
  seeker: "The Seeker",
  achiever: "The Achiever",
};

const lifeStageLabels: Record<string, string> = {
  under_30: "under 30",
  "30_to_40": "30 to 40",
  "40_to_50": "40 to 50",
  "50_plus": "50 or over",
};

const SYSTEM_PROMPT = `You are an FMS lead scoring engine for Money Spirit, a financial wellbeing platform for migrant women in Australia. FMS (Finance & Mortgage Solutions) is a mortgage brokerage run by Madhu Chaudhuri that helps migrant women with home loans, refinancing, insurance, and wealth protection. Your job is to assess whether a platform member is a potential FMS lead based on their behaviour, demographics, and engagement. Return ONLY a valid JSON object with no other text, no markdown, no backticks, no explanation. Use this exact format:
{"fms_score":N,"fms_lead_type":"string","fms_rationale":"string","fms_confidence":"high|medium|low","fms_referral_eligible":true|false}
Where:
- fms_score is 0-100 (100 = perfect FMS lead)
- fms_lead_type is one of: first_home_buyer, refinancer, wealth_builder, protection, investment_property, not_ready
- fms_rationale is a single sentence (max 20 words) explaining why this member is or is not a lead
- fms_confidence is high (score 70+), medium (40-69), or low (under 40)
- fms_referral_eligible is true if score >= 50`;

export async function scoreMemberForFMS(userId: string): Promise<FMSScoreResult | null> {
  try {
    // Profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, pathway_type, life_stage, ritual_streak, archetype_score")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profile) return null;

    // Membership
    const { data: membership } = await supabase
      .from("memberships")
      .select("plan, status, created_at")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    const memberMonths = membership?.created_at
      ? Math.round((Date.now() - new Date(membership.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30))
      : 0;

    // Course enrollments
    const { data: enrollments } = await supabase
      .from("course_enrollments")
      .select("course_id")
      .eq("user_id", userId);

    let courseTitles: string[] = [];
    if (enrollments && enrollments.length > 0) {
      const ids = enrollments.map((e) => e.course_id);
      const { data: courses } = await supabase.from("courses").select("title").in("id", ids);
      courseTitles = (courses ?? []).map((c) => c.title);
    }

    // Posts (last 10)
    const { data: posts } = await supabase
      .from("posts")
      .select("content, post_type")
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Forum categories via thread_replies
    const { data: replies } = await supabase
      .from("thread_replies")
      .select("thread_id")
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    let forumTitles: string[] = [];
    if (replies && replies.length > 0) {
      const threadIds = [...new Set(replies.map((r) => r.thread_id))];
      const { data: threads } = await supabase.from("threads").select("forum_id").in("id", threadIds);
      if (threads && threads.length > 0) {
        const forumIds = [...new Set(threads.map((t) => t.forum_id))];
        const { data: forums } = await supabase.from("forums").select("title").in("id", forumIds);
        forumTitles = (forums ?? []).map((f) => f.title).slice(0, 5);
      }
    }

    // Event tickets
    const { data: tickets } = await supabase
      .from("event_tickets")
      .select("event_id")
      .eq("user_id", userId)
      .eq("status", "active");

    let eventTitles: string[] = [];
    if (tickets && tickets.length > 0) {
      const eventIds = tickets.map((t) => t.event_id);
      const { data: events } = await supabase.from("events").select("title").in("id", eventIds);
      eventTitles = (events ?? []).map((e) => e.title);
    }

    // Build prompt
    const archetype = archetypeNames[profile.pathway_type ?? "keeper"] ?? "The Keeper";
    const lifeStage = lifeStageLabels[profile.life_stage ?? ""] ?? "not specified";
    const postSummary =
      (posts ?? [])
        .slice(0, 3)
        .map((p) => p.content.slice(0, 50))
        .join(" | ") || "no posts";

    const prompt = `Member archetype: ${archetype}. Life stage: ${lifeStage}. Member for ${memberMonths} months. Ritual streak: ${profile.ritual_streak ?? 0} weeks. Courses enrolled: ${courseTitles.join(", ") || "none"}. Events attended: ${eventTitles.join(", ") || "none"}. Forum categories engaged: ${forumTitles.join(", ") || "none"}. Recent post themes (summarised): ${postSummary}. Score this member as a potential FMS mortgage and financial services lead.`;

    const raw = await callGemini(prompt, SYSTEM_PROMPT);

    const parsed = JSON.parse(raw);
    if (typeof parsed.fms_score === "number" && typeof parsed.fms_lead_type === "string") {
      return {
        fms_score: parsed.fms_score,
        fms_lead_type: parsed.fms_lead_type,
        fms_rationale: parsed.fms_rationale ?? "",
        fms_confidence: parsed.fms_confidence ?? "low",
        fms_referral_eligible: parsed.fms_referral_eligible ?? false,
      };
    }
    return null;
  } catch (err) {
    console.error("FMS scoring failed:", err);
    return null;
  }
}
