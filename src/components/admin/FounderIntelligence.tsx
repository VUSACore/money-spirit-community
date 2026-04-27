import { useEffect, useState, useCallback } from "react";
import {
  Sparkles, RefreshCw, Users, TrendingUp, Flame, AlertCircle,
  Home, Shield, Building, Clock, Mail, Heart,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getArchetypeTrends, getChurnRiskMembers, getRetreatDemandSignals,
  getFMSSummary, getWeeklyAIDigest, getPlatformMetrics,
  type ArchetypeTrendData, type ChurnRiskMember, type RetreatDemand, type FMSSummary, type PlatformMetrics,
} from "@/lib/services/intelligenceService";

const archetypeColors: Record<string, string> = {
  giver: "#E8845C", keeper: "#5B8DB8", rebel: "#9B59B6", seeker: "#27AE8F", achiever: "#C9941E",
};
const archetypeNames: Record<string, string> = {
  giver: "The Giver", keeper: "The Keeper", rebel: "The Rebel", seeker: "The Seeker", achiever: "The Achiever",
};
const leadTypeConfig: Record<string, { label: string; color: string }> = {
  first_home_buyer: { label: "First Home Buyer", color: "#5B8DB8" },
  refinancer: { label: "Refinancer", color: "#9B59B6" },
  wealth_builder: { label: "Wealth Builder", color: "#C9941E" },
  protection: { label: "Protection", color: "#27AE8F" },
  investment_property: { label: "Investment Property", color: "#E8845C" },
};

const FounderIntelligence = () => {
  const [loading, setLoading] = useState(true);
  const [digestLoading, setDigestLoading] = useState(true);
  const [digest, setDigest] = useState("");
  const [digestIsAI, setDigestIsAI] = useState(true);
  const [trends, setTrends] = useState<ArchetypeTrendData[]>([]);
  const [churnMembers, setChurnMembers] = useState<ChurnRiskMember[]>([]);
  const [retreat, setRetreat] = useState<RetreatDemand | null>(null);
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [sendingNudge, setSendingNudge] = useState<string | null>(null);
  const [legacyStats, setLegacyStats] = useState({ enabledCount: 0, circleCount: 0, goalCount: 0 });

  const fetchAll = useCallback(async (forceDigest = false) => {
    setLoading(true);
    setDigestLoading(true);

    if (forceDigest) {
      try { sessionStorage.removeItem("founder_digest_v2"); } catch {}
    }

    const [
      trendsData, churnData, retreatData, metricsData,
      { count: legacyEnabledCount }, { count: circleCount }, { count: goalCount },
    ] = await Promise.all([
      getArchetypeTrends(),
      getChurnRiskMembers(),
      getRetreatDemandSignals(),
      getPlatformMetrics(),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_legacy_enabled", true),
      supabase.from("family_circles").select("id", { count: "exact", head: true }),
      supabase.from("legacy_goals").select("id", { count: "exact", head: true }),
    ]);

    setTrends(trendsData);
    setChurnMembers(churnData);
    setRetreat(retreatData);
    setMetrics(metricsData);
    setLegacyStats({ enabledCount: legacyEnabledCount || 0, circleCount: circleCount || 0, goalCount: goalCount || 0 });
    setLoading(false);

    // Digest — uses metrics
    const digestResult = await getWeeklyAIDigest(metricsData);
    setDigest(digestResult.text);
    setDigestIsAI(digestResult.isAI);
    setDigestLoading(false);
    setLastUpdated(new Date());
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fastestGrowing = trends.length >= 2
    ? (() => {
        const curr = trends[trends.length - 1];
        const prev = trends[trends.length - 2];
        let best = "seeker";
        let bestDiff = -Infinity;
        (["giver", "keeper", "rebel", "seeker", "achiever"] as const).forEach((a) => {
          const diff = curr[a] - prev[a];
          if (diff > bestDiff) { bestDiff = diff; best = a; }
        });
        return best;
      })()
    : "seeker";

  const sendNudge = async (member: ChurnRiskMember) => {
    setSendingNudge(member.user_id);
    const { error } = await supabase.from("notifications").insert({
      user_id: member.user_id,
      type: "system",
      title: "We miss you in the community",
      message: "Your Money Spirit community has been thinking of you. Your next ritual is waiting — come back and continue your journey.",
      link: "/rituals",
    });
    setSendingNudge(null);
    if (error) { toast.error("Failed to send nudge"); return; }
    toast.success(`Nudge sent to ${member.display_name}`);
  };

  const exportRetreatCSV = () => {
    if (!retreat) return;
    const rows = [
      ["Name", "Archetype", "Events Attended"],
      ...retreat.top_attendees.map((a) => [
        a.display_name,
        archetypeNames[a.pathway_type || ""] || "Unknown",
        String(a.ticket_count),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `retreat-demand-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fms = metrics?.fms_summary;
  const fmsTotal = fms ? Object.values(fms.by_lead_type).reduce((s, n) => s + n, 0) : 0;
  const topLeadType = fms
    ? Object.entries(fms.by_lead_type).sort((a, b) => b[1] - a[1])[0]?.[0] || "none"
    : "none";

  return (
    <div className="space-y-10">
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-[32px] text-primary-foreground">Founder Intelligence</h1>
          <p className="font-body text-sm text-primary-foreground/60 mt-1">Real-time platform metrics and AI-powered insights</p>
        </div>
        <div className="flex items-center gap-3 text-right">
          <span className="font-body text-xs text-primary-foreground/40">
            Updated {format(lastUpdated, "HH:mm")}
          </span>
          <Button variant="ghost" size="sm" onClick={() => fetchAll(true)} className="text-primary-foreground/60">
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>
      </div>

      {/* QUICK METRICS */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Members", value: metrics.total_members },
            { label: "Active Subscriptions", value: metrics.active_members },
            { label: "New This Week", value: metrics.new_members_this_week },
            { label: "Churn Risk", value: metrics.churn_risk_count, warn: metrics.churn_risk_count > 0 },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4" style={{ background: "hsl(220 72% 10%)", border: "1px solid hsl(220 50% 20%)" }}>
              <p className="font-heading text-3xl text-primary-foreground" style={s.warn ? { color: "#E8845C" } : undefined}>{s.value}</p>
              <p className="font-body text-[11px] text-primary-foreground/40 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ENGAGEMENT ROW */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Flame, label: "Rituals This Week", value: metrics.rituals_this_week },
            { icon: Users, label: "Posts This Week", value: metrics.posts_this_week },
            { icon: TrendingUp, label: "Course Enrolments", value: metrics.total_enrollments },
            { icon: AlertCircle, label: "Courses Completed", value: metrics.total_completions },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3 rounded-lg px-3.5 py-3 font-body text-xs text-primary-foreground/70"
              style={{ background: "hsl(220 72% 10%)", border: "1px solid hsl(220 50% 20%)" }}>
              <s.icon size={14} className="text-accent shrink-0" />
              <div>
                <span className="font-semibold text-primary-foreground text-base">{s.value}</span>
                <p className="text-primary-foreground/40 text-[11px]">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* WEEKLY DIGEST */}
      <section>
        <h2 className="font-body text-base text-primary-foreground mb-4">This Week's Briefing</h2>
        <div className="rounded-2xl p-7"
          style={{ background: "linear-gradient(135deg, hsl(220 72% 8%), hsl(220 72% 12%))", border: "1px solid hsl(41 74% 45% / 0.25)" }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-accent" />
              <span className="font-body text-xs text-accent uppercase tracking-widest">
                {digestIsAI ? "AI Founder Briefing" : "Platform Summary"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!digestIsAI && (
                <span className="font-body text-[10px] text-primary-foreground/30 italic">Factual fallback — AI unavailable</span>
              )}
              <span className="font-body text-xs text-primary-foreground/40">{format(new Date(), "d MMM yyyy")}</span>
            </div>
          </div>
          {digestLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-full" style={{ background: "hsl(220 50% 15%)" }} />
              <Skeleton className="h-5 w-4/5" style={{ background: "hsl(220 50% 15%)" }} />
              <Skeleton className="h-5 w-3/5" style={{ background: "hsl(220 50% 15%)" }} />
            </div>
          ) : (
            <p className="font-heading text-lg text-primary-foreground italic leading-[1.8]">{digest}</p>
          )}
        </div>
      </section>

      {/* ARCHETYPE TRENDS */}
      <section>
        <h2 className="font-body text-base text-primary-foreground mb-4">Archetype Distribution</h2>
        {loading ? (
          <Skeleton className="h-[300px] w-full rounded-xl" style={{ background: "hsl(220 72% 10%)" }} />
        ) : (
          <>
            <div className="rounded-xl p-5" style={{ background: "hsl(220 72% 10%)", border: "1px solid hsl(220 50% 20%)" }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trends}>
                  <CartesianGrid stroke="hsl(220 50% 20%)" strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fill: "hsl(220 30% 50%)", fontSize: 11 }} />
                  <YAxis tick={{ fill: "hsl(220 30% 50%)", fontSize: 11 }} />
                  <RechartsTooltip
                    contentStyle={{ background: "hsl(220 72% 8%)", border: "1px solid hsl(41 74% 45%)", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "hsl(39 33% 95%)" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {(["giver", "keeper", "rebel", "seeker", "achiever"] as const).map((a) => (
                    <Bar key={a} dataKey={a} stackId="a" fill={archetypeColors[a]} name={archetypeNames[a]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Archetype total counts */}
            {metrics && (
              <div className="flex flex-wrap gap-2 mt-3">
                {Object.entries(metrics.archetype_distribution).sort((a, b) => b[1] - a[1]).map(([arch, count]) => (
                  <span key={arch} className="flex items-center gap-1.5 font-body text-[12px] px-2.5 py-1 rounded-full"
                    style={{ background: `${archetypeColors[arch] || "#6B7280"}15`, color: archetypeColors[arch] || "#6B7280" }}>
                    {archetypeNames[arch] || arch}: {count}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2 font-body text-[13px] text-accent"
              style={{ background: "hsl(220 72% 10%)", border: "1px solid hsl(41 74% 45% / 0.2)" }}>
              Fastest growing this month: {archetypeNames[fastestGrowing]}
            </div>
          </>
        )}
      </section>

      {/* CHURN RISK */}
      <section>
        <h2 className="font-body text-base text-primary-foreground mb-1">Churn Risk Members</h2>
        <p className="font-body text-xs text-primary-foreground/40 mb-4">Active members with no ritual or post activity in 14+ days</p>
        {loading ? (
          <Skeleton className="h-48 w-full rounded-xl" style={{ background: "hsl(220 72% 10%)" }} />
        ) : churnMembers.length === 0 ? (
          <div className="rounded-lg p-4 font-body text-sm"
            style={{ background: "hsl(165 60% 38% / 0.1)", border: "1px solid hsl(165 60% 38% / 0.3)", color: "#27AE8F" }}>
            No churn risk detected this week. Your community is active and engaged.
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ background: "hsl(220 72% 10%)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr style={{ background: "hsl(220 72% 8%)" }}>
                    {["Member", "Archetype", "Last Active", "Streak", "FMS Score", "Action"].map((h) => (
                      <th key={h} className="font-body text-[11px] text-primary-foreground/40 uppercase px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {churnMembers.map((m) => (
                    <tr key={m.user_id} className="border-t border-primary-foreground/5 hover:bg-primary-foreground/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-body text-primary-foreground"
                            style={{ background: "hsl(220 50% 20%)" }}>
                            {m.display_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-body text-[13px] text-primary-foreground">{m.display_name}</p>
                            {m.plan && <span className="font-body text-[11px] text-primary-foreground/40">{m.plan}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {m.pathway_type && (
                          <span className="font-body text-xs px-2 py-0.5 rounded-full"
                            style={{ background: `${archetypeColors[m.pathway_type] || "#6B7280"}26`, color: archetypeColors[m.pathway_type] || "#6B7280" }}>
                            {archetypeNames[m.pathway_type]}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-body text-xs" style={{ color: "#E8845C" }}>
                          {Math.round((Date.now() - new Date(m.last_active_at).getTime()) / 86400000)}d ago
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-body text-xs flex items-center gap-1"
                          style={{ color: m.ritual_streak > 0 ? "#C9941E" : "hsl(220 30% 50%)" }}>
                          <Flame size={12} /> {m.ritual_streak}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-body text-sm font-semibold"
                          style={{ color: (m.fms_score || 0) >= 70 ? "#27AE8F" : (m.fms_score || 0) >= 40 ? "#C9941E" : "hsl(220 30% 50%)" }}>
                          {m.fms_score ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" className="text-xs text-primary-foreground/60"
                          disabled={sendingNudge === m.user_id} onClick={() => sendNudge(m)}>
                          <Mail size={12} /> Send Nudge
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* RETREAT DEMAND */}
      <section>
        <h2 className="font-body text-base text-primary-foreground mb-4">Retreat & Event Demand</h2>
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-40 rounded-xl" style={{ background: "hsl(220 72% 10%)" }} />
            <Skeleton className="h-40 rounded-xl" style={{ background: "hsl(220 72% 10%)" }} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl p-5" style={{ background: "hsl(220 72% 10%)", border: "1px solid hsl(220 50% 20%)" }}>
                <p className="font-heading text-5xl text-primary-foreground">{retreat?.high_demand_count || 0}</p>
                <p className="font-body text-[13px] text-primary-foreground/60 mt-1">members attended 2+ events</p>
                <div className="flex items-center gap-2 mt-4">
                  {retreat?.top_attendees.slice(0, 3).map((a) => (
                    <Tooltip key={a.id}>
                      <TooltipTrigger>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-body text-primary-foreground"
                          style={{ background: "hsl(220 50% 20%)" }}>
                          {a.display_name.slice(0, 2).toUpperCase()}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{a.display_name} ({a.ticket_count} events)</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
              <div className="rounded-xl p-5" style={{ background: "hsl(220 72% 10%)", border: "1px solid hsl(220 50% 20%)" }}>
                <p className="font-heading text-5xl text-primary-foreground">{retreat?.waitlist_count || 0}</p>
                <p className="font-body text-[13px] text-primary-foreground/60 mt-1">members on event waitlists</p>
                {(retreat?.waitlist_count || 0) > 0 && (
                  <p className="font-body text-xs text-accent italic mt-4">Strong signal for retreat demand</p>
                )}
              </div>
            </div>
            {retreat && retreat.top_attendees.length > 0 && (
              <Button variant="ghost" size="sm" className="mt-3 text-xs text-primary-foreground/50" onClick={exportRetreatCSV}>
                Export Retreat List
              </Button>
            )}
          </>
        )}
      </section>

      {/* FMS PIPELINE */}
      <section>
        <h2 className="font-body text-base text-primary-foreground mb-1">FMS Pipeline Summary</h2>
        <p className="font-body text-xs text-primary-foreground/40 mb-4">Deterministic lead scoring from member profile and engagement data</p>
        {loading || !fms ? (
          <Skeleton className="h-32 w-full rounded-xl" style={{ background: "hsl(220 72% 10%)" }} />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: "Total Eligible", value: fms.total_eligible },
                { label: "High Confidence", value: fms.high_confidence },
                { label: "Avg Score", value: fms.avg_score },
                { label: "Scored This Week", value: fms.scored_this_week },
                { label: "Top Lead Type", value: leadTypeConfig[topLeadType]?.label || "None" },
              ].map((c) => (
                <div key={c.label} className="rounded-xl p-4" style={{ background: "hsl(220 72% 10%)", border: "1px solid hsl(220 50% 20%)" }}>
                  <p className="font-body text-2xl font-semibold text-primary-foreground">{c.value}</p>
                  <p className="font-body text-[11px] text-primary-foreground/40 mt-1">{c.label}</p>
                </div>
              ))}
            </div>

            {fmsTotal > 0 && (
              <div className="mt-4">
                <div className="flex w-full h-3 rounded-full overflow-hidden" style={{ background: "hsl(220 50% 15%)" }}>
                  {Object.entries(fms.by_lead_type).map(([type, count]) => (
                    <div key={type} style={{ width: `${(count / fmsTotal) * 100}%`, background: leadTypeConfig[type]?.color || "#6B7280" }} />
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 mt-2">
                  {Object.entries(fms.by_lead_type).map(([type, count]) => (
                    <span key={type} className="flex items-center gap-1.5 font-body text-[11px] text-primary-foreground/60">
                      <span className="w-2 h-2 rounded-full" style={{ background: leadTypeConfig[type]?.color }} />
                      {leadTypeConfig[type]?.label || type} ({count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* FAMILY LEGACY */}
      <section>
        <h2 className="font-body text-base text-primary-foreground mb-1">Family Legacy</h2>
        <p className="font-body text-xs text-primary-foreground/40 mb-4">Early access &amp; circle stats</p>
        {loading ? (
          <Skeleton className="h-32 w-full rounded-xl" style={{ background: "hsl(220 72% 10%)" }} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl p-5" style={{ background: "hsl(220 72% 10%)", border: "1px solid hsl(220 50% 20%)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Heart size={16} className="text-accent" />
                <span className="font-body text-[11px] text-primary-foreground/40 uppercase tracking-wide">Early Access</span>
              </div>
              <p className="font-heading text-4xl text-primary-foreground">{legacyStats.enabledCount}</p>
              <p className="font-body text-[13px] text-primary-foreground/60 mt-1">members with legacy enabled</p>
            </div>
            <div className="rounded-xl p-5" style={{ background: "hsl(220 72% 10%)", border: "1px solid hsl(220 50% 20%)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-accent" />
                <span className="font-body text-[11px] text-primary-foreground/40 uppercase tracking-wide">Family Circles</span>
              </div>
              <p className="font-heading text-4xl text-primary-foreground">{legacyStats.circleCount}</p>
              <p className="font-body text-[13px] text-primary-foreground/60 mt-1">circles created</p>
            </div>
            <div className="rounded-xl p-5" style={{ background: "hsl(220 72% 10%)", border: "1px solid hsl(220 50% 20%)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Building size={16} className="text-accent" />
                <span className="font-body text-[11px] text-primary-foreground/40 uppercase tracking-wide">Legacy Goals</span>
              </div>
              <p className="font-heading text-4xl text-primary-foreground">{legacyStats.goalCount}</p>
              <p className="font-body text-[13px] text-primary-foreground/60 mt-1">goals set by members</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default FounderIntelligence;
