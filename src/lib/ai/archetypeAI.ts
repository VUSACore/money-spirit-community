import { callGemini } from "./geminiClient";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

const SACRED_STEP_SYSTEM = `You are the Money Spirit guide — a warm, spiritually-grounded financial wellbeing coach for migrant women in Australia. Your tone is compassionate, empowering, and never fear-based. You speak in second person. You never give specific financial advice — only education and encouragement. Keep your response to 2 sentences maximum. Do not use bullet points or headings.`;

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

export async function getNextSacredStep(
  profile: Profile,
  completedCoursesCount: number
): Promise<string> {
  const archetype = archetypeNames[profile.pathway_type ?? "keeper"] ?? "The Keeper";
  const lifeStage = lifeStageLabels[profile.life_stage ?? ""] ?? "recently active";
  const streak = profile.ritual_streak ?? 0;

  const prompt = `The member's money archetype is ${archetype}. Their life stage is ${lifeStage}. Their ritual streak is ${streak} weeks. They have completed ${completedCoursesCount} courses. Their most recent activity was recently active. Write them a personalised 'Next Sacred Step' — a warm 2-sentence prompt that honours their archetype and life stage and encourages their next action on the Money Spirit platform.`;

  return callGemini(prompt, SACRED_STEP_SYSTEM);
}

export interface ArchetypeScoreUpdate {
  scores: Record<string, number>;
  suggested: string;
}

const SCORING_SYSTEM = `You are an archetype scoring engine for the Money Spirit platform. The five archetypes are: giver (gives to others, community-focused), keeper (security-focused, careful planner), rebel (challenges convention, independent), seeker (curious, learning-focused), achiever (goal-driven, ambitious). Analyse the member's behaviour and return ONLY a valid JSON object with no other text, no markdown, no backticks. Format: {"giver":N,"keeper":N,"rebel":N,"seeker":N,"achiever":N,"suggested":"slug"} where N is a score 0-10 and suggested is the archetype slug with the highest score.`;

export async function scoreArchetypeFromBehaviour(
  userId: string
): Promise<ArchetypeScoreUpdate | null> {
  try {
    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("pathway_type, archetype_score")
      .eq("user_id", userId)
      .maybeSingle();

    // Fetch last 10 posts
    const { data: posts } = await supabase
      .from("posts")
      .select("content")
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Fetch forum categories from thread replies
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

    // Fetch enrolled course titles
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

    const response = await callGemini(prompt, SCORING_SYSTEM);

    const parsed = JSON.parse(response);
    if (
      typeof parsed.giver === "number" &&
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
    return null;
  }
}
