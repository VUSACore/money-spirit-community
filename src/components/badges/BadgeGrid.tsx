import { useEffect, useState } from "react";
import { getAllBadges, getUserBadges } from "@/lib/actions/badges";
import LucideBadgeIcon from "./LucideBadgeIcon";

interface BadgeGridProps {
  userId: string;
  compact?: boolean;
}

const BadgeGrid = ({ userId, compact = false }: BadgeGridProps) => {
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [badges, userBadges] = await Promise.all([
        getAllBadges(),
        getUserBadges(userId),
      ]);
      setAllBadges(badges);
      setEarnedIds(new Set(userBadges.map((ub: any) => ub.badge_id)));
      setLoading(false);
    };
    load();
  }, [userId]);

  if (loading) return null;

  const earnedBadges = allBadges.filter((b) => earnedIds.has(b.id));
  const earnedCount = earnedBadges.length;

  // COMPACT MODE — directory cards
  if (compact) {
    if (earnedCount === 0) return null;
    const visible = earnedBadges.slice(0, 3);
    const remaining = earnedCount - 3;
    return (
      <div className="flex items-center gap-1.5">
        {visible.map((badge) => (
          <LucideBadgeIcon
            key={badge.id}
            iconSlug={badge.icon_slug ?? "award"}
            color={badge.color}
            name={badge.name}
            description={badge.description}
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
  }

  // FULL MODE — profile pages
  return (
    <div className="space-y-3">
      <h3 className="font-body font-bold text-base text-foreground">
        Achievements
      </h3>
      <p className="text-[13px] font-body text-accent">
        {earnedCount} of {allBadges.length} achievements unlocked
      </p>
      {allBadges.length === 0 ? (
        <p className="font-heading italic text-sm text-muted-foreground">
          Complete your first ritual to earn your first badge
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {allBadges.map((badge) => {
            const earned = earnedIds.has(badge.id);
            return (
              <div
                key={badge.id}
                className="flex flex-col items-center gap-1.5 py-2"
              >
                <LucideBadgeIcon
                  iconSlug={badge.icon_slug ?? "award"}
                  color={badge.color}
                  name={badge.name}
                  description={badge.description}
                  size="lg"
                  earned={earned}
                />
                <span
                  className={`text-[13px] font-body text-center leading-tight max-w-[80px] ${
                    earned ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {badge.name}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BadgeGrid;
