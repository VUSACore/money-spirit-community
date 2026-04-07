import { useEffect, useState } from "react";
import { getUserBadges } from "@/lib/actions/badges";
import BadgeIcon from "./BadgeIcon";

interface BadgePreviewProps {
  userId: string;
  maxShow?: number;
}

const BadgePreview = ({ userId, maxShow = 4 }: BadgePreviewProps) => {
  const [badges, setBadges] = useState<any[]>([]);

  useEffect(() => {
    getUserBadges(userId).then((data) => {
      setBadges(data.filter((ub: any) => ub.badges));
    });
  }, [userId]);

  if (badges.length === 0) return null;

  const visible = badges.slice(0, maxShow);
  const remaining = badges.length - maxShow;

  return (
    <div className="flex items-center gap-1">
      {visible.map((ub: any) => (
        <BadgeIcon
          key={ub.id}
          emoji={ub.badges.emoji}
          color={ub.badges.color}
          name={ub.badges.name}
          description={ub.badges.description}
          size="sm"
          earned
        />
      ))}
      {remaining > 0 && (
        <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-body font-medium text-muted-foreground">
          +{remaining}
        </span>
      )}
    </div>
  );
};

export default BadgePreview;
