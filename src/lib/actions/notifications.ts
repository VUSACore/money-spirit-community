import { supabase } from "@/integrations/supabase/client";

export async function getNotifications(userId: string) {
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("read", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);
  return count ?? 0;
}

export async function markAsRead(notificationId: string) {
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);
}

export async function markAllAsRead(userId: string) {
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
}

export async function createNotification(
  userId: string,
  type: string,
  message: string,
  link?: string | null
) {
  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    message,
    link: link ?? null,
  });
}
