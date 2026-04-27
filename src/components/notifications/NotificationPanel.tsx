import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getNotifications, markAsRead, markAllAsRead } from "@/lib/actions/notifications";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Heart, AtSign, Award, Calendar, Sparkles, Bell, Settings } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NotificationPanelProps {
  userId: string;
  onClose: () => void;
  onCountChange: (count: number) => void;
  compact?: boolean; // true = show max 5 + "View all"
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

const NotificationPanel = ({ userId, onClose, onCountChange, compact = true }: NotificationPanelProps) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getNotifications(userId).then((data) => {
      setNotifications(data);
      setLoading(false);
    });
  }, [userId]);

  const handleClick = async (notif: any) => {
    if (!notif.read) {
      await markAsRead(notif.id);
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
      onCountChange(notifications.filter((n) => !n.read && n.id !== notif.id).length);
    }
    if (notif.link) navigate(notif.link);
    onClose();
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead(userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    onCountChange(0);
  };

  const displayItems = compact ? notifications.slice(0, 5) : notifications;
  const hasMore = compact && notifications.length > 5;

  return (
    <div className="w-full md:w-[380px] max-h-[480px] overflow-hidden flex flex-col" style={{
      background: 'rgba(6, 12, 24, 0.96)',
      backdropFilter: 'blur(40px)',
      WebkitBackdropFilter: 'blur(40px)',
      border: '1px solid rgba(224,176,64,0.15)',
      borderRadius: '16px',
      boxShadow: 'inset 0 1px 0 rgba(248,220,138,0.08), 0 24px 60px rgba(0,0,0,0.65)',
    }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid rgba(248,220,138,0.34)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: '17px', color: '#FFFFFF', letterSpacing: '-0.02em' }}>
          Notifications
        </h3>
        {notifications.some((n) => !n.read) && (
          <button
            onClick={handleMarkAllRead}
            style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 500, color: '#E0B040' }}
            className="hover:underline transition-colors"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#F8DC8A'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#E0B040'; }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 p-2">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" style={{ background: 'rgba(248,220,138,0.32)' }} />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" style={{ background: 'rgba(248,220,138,0.32)' }} />
                  <Skeleton className="h-3 w-1/2" style={{ background: 'rgba(224,176,64,0.05)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-4">
            <Bell size={28} style={{ color: '#D8C896' }} className="mb-3" />
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: '#F0E8D4', letterSpacing: '-0.02em' }}>
              You're all caught up
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#D8C896', marginTop: '6px' }}>
              Notifications will appear here as you engage
            </p>
          </div>
        ) : (
          <div>
            {displayItems.map((notif, idx) => {
              const cfg = typeConfig[notif.type] ?? typeConfig.system;
              const Icon = cfg.icon;
              return (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className="w-full flex items-start gap-3 px-5 py-3 text-left transition-colors"
                  style={{
                    borderBottom: idx < displayItems.length - 1 ? '1px solid rgba(248,220,138,0.30)' : 'none',
                    background: !notif.read ? 'rgba(224,176,64,0.05)' : 'transparent',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(224,176,64,0.09)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = !notif.read ? 'rgba(224,176,64,0.05)' : 'transparent'; }}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${cfg.bg}`}>
                    <Icon size={15} />
                  </span>
                  <div className="flex-1 min-w-0">
                    {notif.title && (
                      <p style={{
                        fontSize: '13px', fontFamily: 'var(--font-body)', fontWeight: 500,
                        color: '#FFFFFF', lineHeight: 1.4,
                      }}>
                        {notif.title}
                      </p>
                    )}
                    <p className="line-clamp-2" style={{
                      fontSize: '12px', fontFamily: 'var(--font-body)',
                      color: '#F0E8D4', lineHeight: 1.5,
                    }}>
                      {notif.message}
                    </p>
                    <p style={{
                      fontSize: '11px', fontFamily: 'var(--font-body)',
                      color: '#D8C896', marginTop: '3px',
                    }}>
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!notif.read && (
                    <span
                      className="w-2 h-2 rounded-full shrink-0 mt-2"
                      style={{ background: '#F8DC8A', boxShadow: '0 0 8px rgba(248,220,138,0.50)' }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {(hasMore || !loading) && displayItems.length > 0 && (
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderTop: '1px solid rgba(248,220,138,0.32)' }}
        >
          {hasMore ? (
            <Link
              to="/settings/notifications"
              onClick={onClose}
              style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 500, color: '#E0B040' }}
              className="hover:underline"
            >
              View all notifications
            </Link>
          ) : (
            <span />
          )}
          <Link
            to="/settings/notifications"
            onClick={onClose}
            className="flex items-center gap-1.5 hover:underline"
            style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#D8C896' }}
          >
            <Settings size={12} />
            Settings
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
