import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useBadgeNotification(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`badge-awards-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_badges",
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const badgeId = payload.new?.badge_id;
          if (!badgeId) return;

          const { data: badge } = await supabase
            .from("badges")
            .select("name, color, icon_slug")
            .eq("id", badgeId)
            .maybeSingle();

          if (badge) {
            toast("✨ Badge Unlocked", {
              description: badge.name,
              duration: 5000,
              position: "bottom-right",
              style: {
                background: "rgba(6, 12, 24, 0.96)",
                border: "1px solid rgba(196, 151, 58, 0.25)",
                borderRadius: "16px",
                boxShadow: "0 8px 32px rgba(196, 151, 58, 0.15)",
                fontFamily: "var(--font-body, 'DM Sans')",
                color: "#EEC96E",
              },
              },
            });
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
