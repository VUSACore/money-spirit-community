import { useEffect, useState } from "react";
import { getUserBadges } from "@/lib/actions/badges";
import LucideBadgeIcon from "./LucideBadgeIcon";

interface BadgePreviewProps {
  userId: string;
  maxShow?: number;
}

const BadgePreview = ({ userId, maxShow = 3 }: BadgePreviewProps) => {
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
    <div className="flex items-center gap-1.5">
      {visible.map((ub: any) => (
        <LucideBadgeIcon
          key={ub.id}
          iconSlug={ub.badges.icon_slug ?? "award"}
          color={ub.badges.color}
          name={ub.badges.name}
          description={ub.badges.description}
          size="sm"
          earned
        />
      ))}
      {remaining > 0 && (
        <span className="h-8 px-2 rounded-full bg-muted flex items-center justify-center text-[11px] font-body font-medium text-muted-foreground">
          +{remaining}
        </span>
      )}
    </div>
  );
};

export default BadgePreview;
