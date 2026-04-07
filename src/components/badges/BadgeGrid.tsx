import { useEffect, useState } from "react";
import { getAllBadges, getUserBadges } from "@/lib/actions/badges";
import BadgeIcon from "./BadgeIcon";

interface BadgeGridProps {
  userId: string;
}

const BadgeGrid = ({ userId }: BadgeGridProps) => {
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

  return (
    <div className="space-y-3">
      <h3 className="font-body font-bold text-sm text-primary">Achievements</h3>
      {allBadges.length === 0 ? (
        <p className="font-heading italic text-sm text-primary/60">
          Complete your first ritual to earn your first badge
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {allBadges.map((badge) => (
            <div key={badge.id} className="flex flex-col items-center gap-1">
              <BadgeIcon
                emoji={badge.emoji}
                color={badge.color}
                name={badge.name}
                description={badge.description}
                size="lg"
                earned={earnedIds.has(badge.id)}
              />
              <span className="text-[10px] font-body text-primary/70 text-center max-w-[56px] leading-tight">
                {badge.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BadgeGrid;
