import { useEffect } from "react";
import { scoreMemberForFMS } from "@/lib/ai/fmsScoring";
import { supabase } from "@/integrations/supabase/client";

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export function useFMSScoring(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    const key = `fms_score_last_run_${userId}`;
    const last = localStorage.getItem(key);
    const lastTs = last ? parseInt(last, 10) : 0;

    if (Date.now() - lastTs < SEVEN_DAYS) return;

    scoreMemberForFMS(userId)
      .then(async (result) => {
        if (!result) return;

        await supabase
          .from("profiles")
          .update({
            fms_score: result.fms_score,
            fms_lead_type: result.fms_lead_type,
            fms_rationale: result.fms_rationale,
            fms_confidence: result.fms_confidence,
            fms_referral_eligible: result.fms_referral_eligible,
            fms_last_scored_at: new Date().toISOString(),
          } as any)
          .eq("user_id", userId);

        localStorage.setItem(key, String(Date.now()));
      })
      .catch(console.error);
  }, [userId]);
}
