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
            toast(
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${badge.color}33, ${badge.color}11)`,
                    border: `1.5px solid ${badge.color}66`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: "16px" }}>✨</span>
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: "var(--font-display, 'Cormorant Garamond')",
                      fontSize: "15px",
                      fontWeight: 500,
                      color: "#EEC96E",
                      marginBottom: "2px",
                    }}
                  >
                    Badge Unlocked
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-body, 'DM Sans')",
                      fontSize: "13px",
                      color: "#D4C49A",
                    }}
                  >
                    {badge.name}
                  </p>
                </div>
              </div>,
              {
                duration: 5000,
                position: "bottom-right",
                style: {
                  background: "rgba(6, 12, 24, 0.96)",
                  border: "1px solid rgba(196, 151, 58, 0.25)",
                  borderRadius: "16px",
                  boxShadow: "0 8px 32px rgba(196, 151, 58, 0.15)",
                  padding: "16px 20px",
                },
              }
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
