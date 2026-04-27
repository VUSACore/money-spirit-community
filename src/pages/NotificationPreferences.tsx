import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  getNotificationPreferences,
  upsertNotificationPreferences,
} from "@/lib/actions/notifications";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
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
  { key: "comments_enabled", label: "Comments & Replies", description: "When someone comments on your post or replies to your thread", icon: MessageCircle },
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
  const [saving, setSaving] = useState<string | null>(null);

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
    setSaving(key);
    try {
      await upsertNotificationPreferences(userId, updated);
      toast.success("Preference saved", { duration: 1500 });
    } catch {
      setPrefs(prefs); // revert
      toast.error("Failed to save preference");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-6">
        <div className="h-8 w-64 rounded animate-pulse" style={{ background: 'rgba(224,176,64,0.08)' }} />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'rgba(224,176,64,0.04)' }} />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      <h1 style={{
        fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3.5vw, 32px)',
        fontWeight: 400, color: '#FFFFFF', letterSpacing: '-0.03em', marginBottom: '4px',
      }}>
        Notification Preferences
      </h1>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#D8C896', marginBottom: '32px' }}>
        Choose which notifications you want to receive
      </p>

      <div className="space-y-1">
        {prefRows.map((row) => {
          const Icon = row.icon;
          return (
            <div
              key={row.key}
              className="flex items-center gap-4 px-4 py-4 rounded-xl transition-colors"
              style={{ background: 'transparent' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(224,176,64,0.04)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <Icon size={18} className="shrink-0" style={{ color: '#D8C896' }} />
              <div className="flex-1 min-w-0">
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#FFFFFF', fontWeight: 500 }}>{row.label}</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#D8C896', marginTop: '2px' }}>{row.description}</p>
              </div>
              <Switch
                checked={prefs[row.key]}
                onCheckedChange={(v) => handleToggle(row.key, v)}
                disabled={saving === row.key}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NotificationPreferences;
