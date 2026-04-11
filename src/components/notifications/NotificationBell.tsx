import { useEffect, useState, useRef } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getUnreadCount } from "@/lib/actions/notifications";
import NotificationPanel from "./NotificationPanel";

interface NotificationBellProps {
  userId: string;
}

const NotificationBell = ({ userId }: NotificationBellProps) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getUnreadCount(userId).then(setUnreadCount);

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          getUnreadCount(userId).then((c) => {
            setUnreadCount(c);
            setPulse(true);
            setTimeout(() => setPulse(false), 1500);
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          getUnreadCount(userId).then(setUnreadCount);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const displayCount = unreadCount > 9 ? "9+" : unreadCount;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-body text-white/70 hover:text-white hover:bg-white/5 transition-colors w-full"
        aria-label="Notifications"
      >
        <Bell size={18} />
        <span>Notifications</span>
        {unreadCount > 0 && (
          <span
            className={`absolute top-1 left-7 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-gold text-[11px] font-semibold text-navy-deep px-1 ${
              pulse ? "animate-pulse" : ""
            }`}
          >
            {displayCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-full top-0 ml-2 z-50 md:left-0 md:top-full md:ml-0 md:mt-1">
          <NotificationPanel
            userId={userId}
            onClose={() => setOpen(false)}
            onCountChange={setUnreadCount}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
