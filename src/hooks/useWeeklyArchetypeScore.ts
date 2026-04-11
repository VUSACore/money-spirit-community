import { useEffect } from "react";
import { runWeeklyArchetypeScore } from "@/lib/ai/weeklyArchetypeScore";

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export function useWeeklyArchetypeScore(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    const key = `archetype_score_last_run_${userId}`;
    const last = localStorage.getItem(key);
    const lastTs = last ? parseInt(last, 10) : 0;

    if (Date.now() - lastTs < SEVEN_DAYS) return;

    // Run in background without blocking
    runWeeklyArchetypeScore(userId).then(() => {
      localStorage.setItem(key, String(Date.now()));
    }).catch(console.error);
  }, [userId]);
}
