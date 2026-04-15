import { supabase } from "@/integrations/supabase/client";

/**
 * Deterministic FMS signal scoring — no AI dependency.
 * Scores based on real profile data and platform engagement.
 */

export interface FMSScoreResult {
  fms_score: number;
  fms_lead_type: string;
  fms_rationale: string;
  fms_confidence: "high" | "medium" | "low";
  fms_referral_eligible: boolean;
  fms_signal_type: string;
}

const FINANCIAL_GOAL_SIGNALS: Record<string, { type: string; weight: number }> = {
  buy_first_home: { type: "first_home_buyer", weight: 25 },
  buy_home: { type: "first_home_buyer", weight: 20 },
  first_home: { type: "first_home_buyer", weight: 25 },
  refinance: { type: "refinancer", weight: 25 },
  reduce_mortgage: { type: "refinancer", weight: 20 },
  investment_property: { type: "investment_property", weight: 25 },
  invest_property: { type: "investment_property", weight: 20 },
  build_wealth: { type: "wealth_builder", weight: 15 },
  grow_savings: { type: "wealth_builder", weight: 10 },
  protect_family: { type: "protection", weight: 20 },
  insurance: { type: "protection", weight: 20 },
  life_insurance: { type: "protection", weight: 22 },
  income_protection: { type: "protection", weight: 22 },
};

const LIFE_STAGE_WEIGHTS: Record<string, number> = {
  "30_to_40": 15,
  "40_to_50": 12,
  under_30: 8,
  "50_plus": 10,
};

const EMPLOYMENT_WEIGHTS: Record<string, number> = {
  employed: 10,
  self_employed: 12,
  business_owner: 14,
  student: 2,
  not_working: 0,
};

export async function scoreMemberForFMS(userId: string): Promise<FMSScoreResult | null> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, pathway_type, life_stage, ritual_streak, financial_goals, employment_type, country_of_origin, years_in_australia, marital_status, number_of_children, onboarding_complete")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profile || !profile.onboarding_complete) return null;

    let score = 0;
    const signals: string[] = [];
    let primaryType = "not_ready";
    const typeScores: Record<string, number> = {};

    // 1. Financial goals — strongest signal
    const goals = profile.financial_goals ?? [];
    for (const goal of goals) {
      const normalized = goal.toLowerCase().replace(/[\s-]+/g, "_");
      for (const [keyword, config] of Object.entries(FINANCIAL_GOAL_SIGNALS)) {
        if (normalized.includes(keyword)) {
          score += config.weight;
          typeScores[config.type] = (typeScores[config.type] || 0) + config.weight;
          signals.push(`financial goal: ${goal}`);
          break;
        }
      }
    }

    // 2. Life stage
    const lifeStageWeight = LIFE_STAGE_WEIGHTS[profile.life_stage ?? ""] ?? 0;
    if (lifeStageWeight > 0) {
      score += lifeStageWeight;
      signals.push(`life stage indicates readiness`);
    }

    // 3. Employment type
    const employmentWeight = EMPLOYMENT_WEIGHTS[profile.employment_type ?? ""] ?? 0;
    if (employmentWeight > 0) {
      score += employmentWeight;
      signals.push(`employment: ${(profile.employment_type ?? "").replace(/_/g, " ")}`);
    }

    // 4. Years in Australia — settlement stability
    const yearsMap: Record<string, number> = {
      "2_to_5": 8,
      "5_to_10": 12,
      more_than_10: 14,
      "1_to_2": 4,
      less_than_1: 1,
    };
    const yearsWeight = yearsMap[profile.years_in_australia ?? ""] ?? 0;
    if (yearsWeight >= 8) {
      score += yearsWeight;
      signals.push(`settled in Australia (${(profile.years_in_australia ?? "").replace(/_/g, " ")} years)`);
    }

    // 5. Family context — children / marital status
    if ((profile.number_of_children ?? 0) > 0) {
      score += 5;
      signals.push("has children — protection/planning relevance");
    }
    if (profile.marital_status === "married" || profile.marital_status === "de_facto") {
      score += 4;
      signals.push("in a relationship — joint financial planning");
    }

    // 6. Platform engagement bonus
    const { count: courseCount } = await supabase
      .from("course_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if ((courseCount ?? 0) > 0) {
      score += Math.min((courseCount ?? 0) * 3, 10);
      signals.push(`${courseCount} course${(courseCount ?? 0) > 1 ? "s" : ""} enrolled`);
    }

    // 7. Ritual streak — shows commitment
    if ((profile.ritual_streak ?? 0) >= 3) {
      score += 5;
      signals.push(`${profile.ritual_streak}-week ritual streak`);
    }

    // Cap at 100
    score = Math.min(score, 100);

    // Determine primary lead type
    const typeEntries = Object.entries(typeScores).sort((a, b) => b[1] - a[1]);
    if (typeEntries.length > 0) {
      primaryType = typeEntries[0][0];
    } else if (score >= 30) {
      // Infer from life stage
      if (profile.life_stage === "under_30" || profile.life_stage === "30_to_40") {
        primaryType = "first_home_buyer";
      } else {
        primaryType = "wealth_builder";
      }
    }

    // Confidence
    const confidence: "high" | "medium" | "low" =
      score >= 60 ? "high" : score >= 35 ? "medium" : "low";

    // Rationale — top 2 signals
    const topSignals = signals.slice(0, 2);
    let rationale: string;
    if (topSignals.length === 0) {
      rationale = "Limited financial signals detected — may need more engagement.";
    } else {
      rationale = topSignals.join("; ") + ".";
    }
    // Capitalise first letter
    rationale = rationale.charAt(0).toUpperCase() + rationale.slice(1);

    // Signal type for member-facing use
    const signalType = score >= 60 ? "strong" : score >= 35 ? "possible" : "none";

    return {
      fms_score: score,
      fms_lead_type: primaryType,
      fms_rationale: rationale,
      fms_confidence: confidence,
      fms_referral_eligible: score >= 40,
      fms_signal_type: signalType,
    };
  } catch (err) {
    console.error("FMS scoring failed:", err);
    return null;
  }
}
