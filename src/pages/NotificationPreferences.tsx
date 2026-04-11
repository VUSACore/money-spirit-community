import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  getNotificationPreferences,
  upsertNotificationPreferences,
} from "@/lib/actions/notifications";
import { Switch } from "@/components/ui/switch";
import {
  MessageCircle, Heart, AtSign, Award, Calendar, Sparkles, Bell,
} from "lucide-react";

interface PrefRow {
  key: string;
  label: string;
  description: string;
  icon: typeof Bell;
}

const prefRows: PrefRow[] = [
  { key: "comments_enabled", label: "Comments", description: "When someone comments on your post", icon: MessageCircle },
  { key: "reactions_enabled", label: "Reactions", description: "When someone reacts to your post", icon: Heart },
  { key: "mentions_enabled", label: "Mentions", description: "When someone mentions you in a post or thread", icon: AtSign },
  { key: "badges_enabled", label: "Badges", description: "When you unlock a new achievement", icon: Award },
  { key: "event_reminders_enabled", label: "Event Reminders", description: "24 hours before an event you have a ticket for", icon: Calendar },
  { key: "ritual_reminders_enabled", label: "Ritual Reminders", description: "Monday morning reminder to complete your weekly ritual", icon: Sparkles },
  { key: "system_enabled", label: "System", description: "Important platform announcements from the Money Spirit team", icon: Bell },
];

const defaultPrefs: Record<string, boolean> = {
  comments_enabled: true,
  reactions_enabled: true,
  mentions_enabled: true,
  badges_enabled: true,
  event_reminders_enabled: true,
  ritual_reminders_enabled: true,
  system_enabled: true,
};

const NotificationPreferences = () => {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(defaultPrefs);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);

      const existing = await getNotificationPreferences(session.user.id);
      if (existing) {
        const mapped: Record<string, boolean> = {};
        for (const row of prefRows) {
          mapped[row.key] = (existing as any)[row.key] ?? true;
        }
        setPrefs(mapped);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleToggle = async (key: string, value: boolean) => {
    if (!userId) return;
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    await upsertNotificationPreferences(userId, updated);
  };

  if (loading) {
    return (
      <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-white/10 rounded animate-pulse" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      <h1 className="font-heading text-[28px] text-primary mb-1">Notification Preferences</h1>
      <p className="font-body text-sm text-muted-foreground mb-8">
        Choose which notifications you want to receive
      </p>

      <div className="space-y-1">
        {prefRows.map((row) => {
          const Icon = row.icon;
          return (
            <div
              key={row.key}
              className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-muted/30 transition-colors"
            >
              <Icon size={18} className="text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm text-foreground">{row.label}</p>
                <p className="font-body text-xs text-muted-foreground">{row.description}</p>
              </div>
              <Switch
                checked={prefs[row.key]}
                onCheckedChange={(v) => handleToggle(row.key, v)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NotificationPreferences;
