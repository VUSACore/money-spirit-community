import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications, markAsRead, markAllAsRead } from "@/lib/actions/notifications";
import { Skeleton } from "@/components/ui/skeleton";
import LotusIcon from "@/components/LotusIcon";
import { formatDistanceToNow } from "date-fns";

interface NotificationPanelProps {
  userId: string;
  onClose: () => void;
  onCountChange: (count: number) => void;
}

const typeColors: Record<string, string> = {
  reaction: "bg-accent",
  mention: "bg-primary",
  comment: "bg-primary/70",
  win: "bg-amber-400",
  event_reminder: "bg-gray-400",
  milestone: "bg-accent",
  system: "bg-gray-300",
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
    <div className="w-[360px] max-h-[480px] bg-white rounded-xl border border-border shadow-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-body font-bold text-sm text-primary">Notifications</h3>
        <button
          onClick={handleMarkAllRead}
          className="text-xs font-body font-medium text-accent hover:text-accent/80 transition-colors"
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
                <Skeleton className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <LotusIcon className="text-accent/40 mb-3" size={36} />
            <p className="font-heading text-primary italic text-sm">
              You are all caught up
            </p>
          </div>
        ) : (
          <div>
            {notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                  !notif.read ? "bg-background" : "bg-white"
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                    typeColors[notif.type] ?? "bg-gray-300"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-body font-medium text-primary leading-snug truncate">
                    {notif.message}
                  </p>
                  <p className="text-[11px] font-body text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(notif.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
