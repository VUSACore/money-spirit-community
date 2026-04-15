import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications, markAsRead, markAllAsRead } from "@/lib/actions/notifications";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Heart, AtSign, Award, Calendar, Sparkles, Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NotificationPanelProps { userId: string; onClose: () => void; onCountChange: (count: number) => void; }

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

  const load = async () => { const data = await getNotifications(userId); setNotifications(data); setLoading(false); };
  useEffect(() => { load(); }, [userId]);

  const handleClick = async (notif: any) => {
    if (!notif.read) { await markAsRead(notif.id); setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))); onCountChange(notifications.filter((n) => !n.read && n.id !== notif.id).length); }
    if (notif.link) navigate(notif.link);
    onClose();
  };

  const handleMarkAllRead = async () => { await markAllAsRead(userId); setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))); onCountChange(0); };

  return (
    <div className="w-full md:w-[360px] max-h-[480px] overflow-hidden flex flex-col" style={{
      background: 'rgba(8, 13, 26, 0.94)',
      backdropFilter: 'blur(40px)',
      WebkitBackdropFilter: 'blur(40px)',
      border: '1px solid rgba(196,151,58,0.12)',
      borderRadius: '16px',
      boxShadow: 'inset 0 1px 0 rgba(238,201,110,0.08), 0 24px 60px rgba(0,0,0,0.6)',
    }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(196,151,58,0.08)' }}>
        <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '15px', color: '#F2EAD8' }}>Notifications</h3>
        <button onClick={handleMarkAllRead} style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 500, color: '#EEC96E' }} className="hover:underline">Mark all read</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3 space-y-3">
            {[1, 2, 3].map((i) => (<div key={i} className="flex items-start gap-3 p-2"><Skeleton className="w-8 h-8 rounded-full shrink-0" style={{ background: 'rgba(196,151,58,0.08)' }} /><div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-3/4" style={{ background: 'rgba(196,151,58,0.08)' }} /></div></div>))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Sparkles size={32} style={{ color: '#5C4E34' }} className="mb-3" />
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#D4C49A' }}>You're all caught up</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#5C4E34', marginTop: '4px' }}>Notifications will appear here</p>
          </div>
        ) : (
          <div>
            {notifications.map((notif, idx) => {
              const cfg = typeConfig[notif.type] ?? typeConfig.system;
              const Icon = cfg.icon;
              return (
                <button key={notif.id} onClick={() => handleClick(notif)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
                  style={{
                    borderBottom: idx < notifications.length - 1 ? '1px solid rgba(196,151,58,0.06)' : 'none',
                    borderRadius: '8px',
                    background: !notif.read ? 'rgba(196,151,58,0.04)' : 'transparent',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(196,151,58,0.08)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = !notif.read ? 'rgba(196,151,58,0.04)' : 'transparent'; }}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${cfg.bg}`}><Icon size={16} /></span>
                  <div className="flex-1 min-w-0">
                    {notif.title && <p style={{ fontSize: '13px', fontFamily: 'var(--font-body)', fontWeight: 500, color: '#F2EAD8', lineHeight: 1.4 }}>{notif.title}</p>}
                    <p className="line-clamp-2" style={{ fontSize: '12px', fontFamily: 'var(--font-body)', color: '#D4C49A', lineHeight: 1.4 }}>{notif.message}</p>
                    <p style={{ fontSize: '11px', fontFamily: 'var(--font-body)', color: '#5C4E34', marginTop: '2px' }}>{formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}</p>
                  </div>
                  {!notif.read && <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: '#EEC96E', boxShadow: '0 0 6px rgba(238,201,110,0.40)' }} />}
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
