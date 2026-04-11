import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sendRitualReminder } from "@/lib/email/emailService";

function getMondayOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

export function useRitualReminder(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    const run = async () => {
      try {
        const now = new Date();
        if (now.getDay() !== 1) return; // Not Monday

        const lsKey = `ritual_reminder_last_sent_${userId}`;
        const lastSent = localStorage.getItem(lsKey);
        if (lastSent) {
          const daysSince = (now.getTime() - new Date(lastSent).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSince < 6) return;
        }

        const monday = getMondayOfWeek(now);
        const { data: ritual } = await supabase
          .from("rituals")
          .select("title, reflection_prompt")
          .eq("published", true)
          .gte("week_of", monday)
          .order("week_of", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (!ritual) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", userId)
          .maybeSingle();

        const displayName = profile?.display_name ?? "there";
        await sendRitualReminder(
          user.email,
          displayName,
          ritual.title,
          ritual.reflection_prompt ?? ""
        );

        localStorage.setItem(lsKey, now.toISOString());
      } catch (err) {
        console.error("[RitualReminder] Error:", err);
      }
    };

    run();
  }, [userId]);
}
