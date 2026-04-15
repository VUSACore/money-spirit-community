import callGemini from "./geminiClient";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { isProfileComplete } from "@/lib/profileCompletion";

type Profile = Tables<"profiles">;

/* ── archetype display names ── */
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

/* ── archetype-specific guidance lenses ── */
const archetypeLens: Record<string, string> = {
  giver:
    "This member leads with generosity. Emphasise boundaries, reciprocity, and sustaining their giving without depleting themselves. Encourage them to honour their own financial wellbeing alongside their care for others.",
  keeper:
    "This member values safety and structure. Emphasise steadiness, long-view planning, and building resilient foundations. Encourage them to trust the progress they have already made.",
  rebel:
    "This member challenges convention. Emphasise autonomy, reframing inherited money rules, and forging their own financial path. Encourage them to channel their independence into deliberate action.",
  seeker:
    "This member is driven by curiosity. Emphasise exploration, deeper pattern recognition, and connecting learning to lived experience. Encourage them to turn insight into one concrete next step.",
  achiever:
    "This member is goal-driven. Emphasise momentum, direction, and achievement with alignment. Encourage them to celebrate progress while staying connected to purpose.",
};

/* ── system prompt ── */
const SYSTEM_SACRED_STEP = `You are the Money Spirit guide — a warm, spiritually-grounded financial wellbeing coach for migrant women in Australia.

Rules:
- Tone: compassionate, empowering, never fear-based. Second person.
- Never give specific financial advice — only education and encouragement.
- Keep your response to exactly 2 sentences. No bullet points, headings, or lists.
- Make the recommendation a specific, actionable next step on the Money Spirit platform — not a vague affirmation.
- If previous recommendations are provided, do NOT repeat them. Offer a genuinely different angle or action.`;

/* ── gather live member context ── */
async function gatherMemberContext(
  profile: Profile,
  userId: string,
): Promise<string> {
  const parts: string[] = [];

  // Archetype
  const archetype = archetypeNames[profile.pathway_type ?? "keeper"] ?? "The Keeper";
  parts.push(`Money archetype: ${archetype}.`);

  // Archetype lens
  const lens = archetypeLens[profile.pathway_type ?? "keeper"] ?? archetypeLens.keeper;
  parts.push(`Archetype guidance lens: ${lens}`);

  // Life stage
  const lifeStage = lifeStageLabels[profile.life_stage ?? ""] ?? null;
  if (lifeStage) parts.push(`Life stage: ${lifeStage}.`);

  // Country of origin
  if (profile.country_of_origin) parts.push(`Country of origin: ${profile.country_of_origin}.`);

  // Profile completeness
  const complete = isProfileComplete(profile);
  parts.push(`Profile complete: ${complete ? "yes" : "no — they still need to fill in missing details"}.`);

  // Ritual streak
  const streak = profile.ritual_streak ?? 0;
  if (streak === 0) {
    parts.push("Ritual streak: 0 weeks — they have not started a streak yet.");
  } else if (streak < 3) {
    parts.push(`Ritual streak: ${streak} week${streak > 1 ? "s" : ""} — just getting started.`);
  } else {
    parts.push(`Ritual streak: ${streak} weeks — strong consistency.`);
  }

  // Financial goals
  if (profile.financial_goals && profile.financial_goals.length > 0) {
    parts.push(`Financial goals: ${profile.financial_goals.join(", ")}.`);
  }

  // Courses — completed vs in-progress
  try {
    const { data: enrollments } = await supabase
      .from("course_enrollments")
      .select("course_id, completed_at")
      .eq("user_id", userId);

    if (enrollments && enrollments.length > 0) {
      const completed = enrollments.filter((e) => e.completed_at).length;
      const inProgress = enrollments.length - completed;

      if (completed > 0 && inProgress > 0) {
        parts.push(`Courses: ${completed} completed, ${inProgress} in progress.`);
      } else if (completed > 0) {
        parts.push(`Courses: ${completed} completed, none in progress.`);
      } else {
        parts.push(`Courses: ${inProgress} enrolled but not yet completed.`);
      }

      // Fetch titles of in-progress courses
      if (inProgress > 0) {
        const ipIds = enrollments.filter((e) => !e.completed_at).map((e) => e.course_id);
        const { data: courses } = await supabase
          .from("courses")
          .select("title")
          .in("id", ipIds)
          .limit(3);
        if (courses && courses.length > 0) {
          parts.push(`Currently enrolled in: ${courses.map((c) => c.title).join(", ")}.`);
        }
      }
    } else {
      parts.push("Courses: not enrolled in any courses yet.");
    }
  } catch {
    parts.push("Courses: data unavailable.");
  }

  // Recent community activity
  try {
    const { count: postCount } = await supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("author_id", userId);
    if (postCount !== null) {
      if (postCount === 0) {
        parts.push("Community: has not posted yet.");
      } else {
        parts.push(`Community: ${postCount} post${postCount > 1 ? "s" : ""} shared.`);
      }
    }
  } catch { /* skip */ }

  // Archetype score evolution
  if (profile.archetype_score && typeof profile.archetype_score === "object") {
    const scores = profile.archetype_score as Record<string, number>;
    const entries = Object.entries(scores).filter(([, v]) => typeof v === "number" && v > 0);
    if (entries.length > 0) {
      const sorted = entries.sort((a, b) => b[1] - a[1]);
      const top = sorted.slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(", ");
      parts.push(`Archetype scores (top 3): ${top}.`);
    }
  }

  return parts.join("\n");
}

/* ── main export ── */
export async function getNextSacredStep(
  profile: Profile,
  _completedCoursesCount: number,
  previousSteps: string[] = [],
): Promise<string> {
  const context = await gatherMemberContext(profile, profile.user_id);

  let repetitionGuard = "";
  if (previousSteps.length > 0) {
    const recent = previousSteps.slice(-3);
    repetitionGuard = `\n\nPrevious recommendations (DO NOT repeat these or paraphrase them — offer something genuinely different):\n${recent.map((s, i) => `${i + 1}. "${s}"`).join("\n")}`;
  }

  const prompt = `${context}${repetitionGuard}\n\nWrite this member a personalised 'Next Sacred Step' — a warm, specific 2-sentence prompt that honours their archetype, reflects their current progress, and encourages one clear next action on the Money Spirit platform.`;

  return callGemini(prompt, SYSTEM_SACRED_STEP);
}

/* ── scoring (unchanged) ── */
export interface ArchetypeScoreUpdate {
  scores: Record<string, number>;
  suggested: string;
}

const SYSTEM_SCORING =
  'You are an archetype scoring engine for the Money Spirit platform. The five archetypes are: giver (gives to others, community-focused), keeper (security-focused, careful planner), rebel (challenges convention, independent), seeker (curious, learning-focused), achiever (goal-driven, ambitious). Analyse the member\'s behaviour and return ONLY a valid JSON object with no other text, no markdown, no backticks. Format: {"giver":N,"keeper":N,"rebel":N,"seeker":N,"achiever":N,"suggested":"slug"} where N is a score 0-10 and suggested is the archetype slug with the highest score.';

export async function scoreArchetypeFromBehaviour(
  userId: string,
): Promise<ArchetypeScoreUpdate | null> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("pathway_type, archetype_score")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: posts } = await supabase
      .from("posts")
      .select("content")
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    const { data: replies } = await supabase
      .from("thread_replies")
      .select("thread_id")
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    let forumTitles: string[] = [];
    if (replies && replies.length > 0) {
      const threadIds = [...new Set(replies.map((r) => r.thread_id))];
      const { data: threads } = await supabase
        .from("threads")
        .select("forum_id")
        .in("id", threadIds);

      if (threads && threads.length > 0) {
        const forumIds = [...new Set(threads.map((t) => t.forum_id))];
        const { data: forums } = await supabase
          .from("forums")
          .select("title")
          .in("id", forumIds);
        forumTitles = (forums ?? []).map((f) => f.title).slice(0, 5);
      }
    }

    const { data: enrollments } = await supabase
      .from("course_enrollments")
      .select("course_id")
      .eq("user_id", userId);

    let courseTitles: string[] = [];
    if (enrollments && enrollments.length > 0) {
      const courseIds = enrollments.map((e) => e.course_id);
      const { data: courses } = await supabase
        .from("courses")
        .select("title")
        .in("id", courseIds);
      courseTitles = (courses ?? []).map((c) => c.title);
    }

    const postContent = (posts ?? []).map((p) => p.content).join(" | ") || "No posts yet";
    const forumsStr = forumTitles.length > 0 ? forumTitles.join(", ") : "None yet";
    const coursesStr = courseTitles.length > 0 ? courseTitles.join(", ") : "None yet";

    const prompt = `Current archetype: ${profile?.pathway_type ?? "unknown"}. Recent posts: ${postContent}. Forum categories engaged: ${forumsStr}. Courses enrolled: ${coursesStr}. Score this member across all 5 archetypes.`;

    const raw = await callGemini(prompt, SYSTEM_SCORING);

    const parsed = JSON.parse(raw);
    if (
      typeof parsed.giver === "number" &&
      typeof parsed.keeper === "number" &&
      typeof parsed.suggested === "string"
    ) {
      return {
        scores: {
          giver: parsed.giver,
          keeper: parsed.keeper,
          rebel: parsed.rebel,
          seeker: parsed.seeker,
          achiever: parsed.achiever,
        },
        suggested: parsed.suggested,
      };
    }
    return null;
  } catch {
    console.error("Archetype scoring failed");
    return null;
  }
}
