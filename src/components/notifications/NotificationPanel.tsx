import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications, markAsRead, markAllAsRead } from "@/lib/actions/notifications";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageCircle, Heart, AtSign, Award, Calendar, Sparkles, Bell,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NotificationPanelProps {
  userId: string;
  onClose: () => void;
  onCountChange: (count: number) => void;
}

const typeConfig: Record<string, { icon: typeof Bell; bg: string }> = {
  comment: { icon: MessageCircle, bg: "bg-blue-500/20 text-blue-400" },
  reaction: { icon: Heart, bg: "bg-pink-500/20 text-pink-400" },
  mention: { icon: AtSign, bg: "bg-purple-500/20 text-purple-400" },
  badge: { icon: Award, bg: "bg-amber-500/20 text-amber-400" },
  win: { icon: Award, bg: "bg-amber-500/20 text-amber-400" },
  event_reminder: { icon: Calendar, bg: "bg-teal-500/20 text-teal-400" },
  ritual_reminder: { icon: Sparkles, bg: "bg-teal-500/20 text-teal-400" },
  milestone: { icon: Sparkles, bg: "bg-amber-500/20 text-amber-400" },
  system: { icon: Bell, bg: "bg-slate-500/20 text-slate-400" },
};

const NotificationPanel = ({ userId, onClose, onCountChange }: NotificationPanelProps) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    const data = await getNotifications(userId);
    setNotifications(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [userId]);

  const handleClick = async (notif: any) => {
    if (!notif.read) {
      await markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      onCountChange(
        notifications.filter((n) => !n.read && n.id !== notif.id).length
      );
    }
    if (notif.link) {
      navigate(notif.link);
    }
    onClose();
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead(userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    onCountChange(0);
  };

  return (
    <div className="w-[360px] max-h-[480px] bg-[#0B1D3A] rounded-xl border border-[hsl(var(--gold-500)/0.25)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--gold-500)/0.15)]">
        <h3 className="font-body font-medium text-[15px] text-cream-100">Notifications</h3>
        <button
          onClick={handleMarkAllRead}
          className="text-xs font-body font-medium text-gold-400 hover:underline transition-colors"
        >
          Mark all read
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 p-2">
                <Skeleton className="w-8 h-8 rounded-full shrink-0 bg-white/10" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4 bg-white/10" />
                  <Skeleton className="h-3 w-1/2 bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Sparkles size={32} className="text-[#1E3A5F] mb-3" />
            <p className="font-body text-sm text-cream-300">You are all caught up</p>
            <p className="font-body text-xs text-[#1E3A5F] mt-1">Notifications will appear here</p>
          </div>
        ) : (
          <div>
            {notifications.map((notif, idx) => {
              const cfg = typeConfig[notif.type] ?? typeConfig.system;
              const Icon = cfg.icon;
              return (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#0F2847] ${
                    idx < notifications.length - 1 ? "border-b border-[#1E3A5F]/50" : ""
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${cfg.bg}`}>
                    <Icon size={16} />
                  </span>
                  <div className="flex-1 min-w-0">
                    {notif.title && (
                      <p className="text-[13px] font-body font-medium text-cream-100 leading-snug">
                        {notif.title}
                      </p>
                    )}
                    <p className="text-[12px] font-body text-cream-300 leading-snug line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-[11px] font-body text-[#3A5A7F] mt-0.5">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-gold shrink-0 mt-1.5" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
