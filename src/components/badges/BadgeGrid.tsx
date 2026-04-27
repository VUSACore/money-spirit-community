import { useEffect, useState } from "react";
import { getAllBadges, getUserBadges } from "@/lib/actions/badges";
import LucideBadgeIcon from "./LucideBadgeIcon";

interface BadgeGridProps { userId: string; compact?: boolean; }

const BadgeGrid = ({ userId, compact = false }: BadgeGridProps) => {
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [badges, userBadges] = await Promise.all([getAllBadges(), getUserBadges(userId)]);
      setAllBadges(badges);
      setEarnedIds(new Set(userBadges.map((ub: any) => ub.badge_id)));
      setLoading(false);
    };
    load();
  }, [userId]);

  if (loading) return null;

  const earnedBadges = allBadges.filter((b) => earnedIds.has(b.id));
  const earnedCount = earnedBadges.length;

  if (compact) {
    if (earnedCount === 0) return null;
    const visible = earnedBadges.slice(0, 3);
    const remaining = earnedCount - 3;
    return (
      <div className="flex items-center gap-1.5">
        {visible.map((badge) => (
          <LucideBadgeIcon key={badge.id} iconSlug={badge.icon_slug ?? "award"} color={badge.color} name={badge.name} description={badge.description} size="sm" earned />
        ))}
        {remaining > 0 && (
          <span className="h-8 px-2 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.18)', fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 500, color: 'var(--text-4)' }}>+{remaining}</span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '16px', color: 'var(--text-1)' }}>Achievements</h3>
      <p style={{ fontSize: '13px', fontFamily: 'var(--font-body)', color: 'var(--text-gold)' }}>{earnedCount} of {allBadges.length} achievements unlocked</p>
      {allBadges.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '14px', color: 'var(--text-3)' }}>Complete your first ritual to earn your first badge</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {allBadges.map((badge) => {
            const earned = earnedIds.has(badge.id);
            return (
              <div key={badge.id} className="flex flex-col items-center gap-1.5 py-2" style={{
                ...(earned ? {
                  background: `${badge.color}26`,
                  border: `1px solid ${badge.color}4D`,
                  borderRadius: 'var(--r-md)',
                  boxShadow: `0 0 12px ${badge.color}26`,
                } : {
                  background: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.24)',
                  borderRadius: 'var(--r-md)',
                  opacity: 0.4,
                }),
              }}>
                <LucideBadgeIcon iconSlug={badge.icon_slug ?? "award"} color={badge.color} name={badge.name} description={badge.description} size="lg" earned={earned} />
                <span style={{ fontSize: '13px', fontFamily: 'var(--font-body)', textAlign: 'center', lineHeight: 1.2, maxWidth: '80px', color: earned ? 'var(--text-1)' : 'var(--text-4)' }}>{badge.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BadgeGrid;
