import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, Home, RefreshCw, TrendingUp, Shield, Building, Clock,
  ExternalLink, Search, Target,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const archetypeAccents: Record<string, string> = {
  giver: "#FFA37A", keeper: "#7BB0E0", rebel: "#C490DA", seeker: "#3DD4A8", achiever: "#C9941E",
};
const archetypeNames: Record<string, string> = {
  giver: "The Giver", keeper: "The Keeper", rebel: "The Rebel", seeker: "The Seeker", achiever: "The Achiever",
};

const leadTypeConfig: Record<string, { label: string; icon: typeof Home; color: string }> = {
  first_home_buyer: { label: "First Home Buyer", icon: Home, color: "#7BB0E0" },
  refinancer: { label: "Refinancer", icon: RefreshCw, color: "#C490DA" },
  wealth_builder: { label: "Wealth Builder", icon: TrendingUp, color: "#C9941E" },
  protection: { label: "Protection", icon: Shield, color: "#3DD4A8" },
  investment_property: { label: "Investment Property", icon: Building, color: "#FFA37A" },
  not_ready: { label: "Not Ready", icon: Clock, color: "#A8B0BC" },
};

const signalLabels: Record<string, { label: string; color: string }> = {
  strong: { label: "Strong Signal", color: "#3DD4A8" },
  possible: { label: "Possible Signal", color: "#C9941E" },
  none: { label: "No Signal", color: "#A8B0BC" },
};

const lifeStageLabels: Record<string, string> = {
  under_30: "Under 30", "30_to_40": "30–40", "40_to_50": "40–50", "50_plus": "50+",
};

type Lead = {
  user_id: string;
  display_name: string;
  pathway_type: string | null;
  life_stage: string | null;
  fms_score: number | null;
  fms_lead_type: string | null;
  fms_confidence: string | null;
  fms_rationale: string | null;
  fms_referral_eligible: boolean | null;
  fms_signal_type: string | null;
  fms_last_scored_at: string | null;
  financial_goals: string[] | null;
  country_of_origin: string | null;
  created_at: string;
};

const FMSLeadBoard = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [signalFilter, setSignalFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("score_desc");

  useEffect(() => {
    const fetchLeads = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, pathway_type, life_stage, fms_score, fms_lead_type, fms_confidence, fms_rationale, fms_referral_eligible, fms_signal_type, fms_last_scored_at, financial_goals, country_of_origin, created_at")
        .not("fms_last_scored_at", "is", null)
        .gte("fms_score", 1);
      setLeads((data as Lead[]) ?? []);
      setLoading(false);
    };
    fetchLeads();
  }, []);

  const summaryStats = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return {
      totalScored: leads.length,
      eligible: leads.filter((l) => l.fms_referral_eligible).length,
      strong: leads.filter((l) => l.fms_signal_type === "strong").length,
      scoredThisWeek: leads.filter(
        (l) => l.fms_last_scored_at && new Date(l.fms_last_scored_at).getTime() > sevenDaysAgo,
      ).length,
    };
  }, [leads]);

  const filtered = useMemo(() => {
    let result = [...leads];
    if (typeFilter !== "all") result = result.filter((l) => l.fms_lead_type === typeFilter);
    if (signalFilter !== "all") result = result.filter((l) => l.fms_signal_type === signalFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((l) =>
        l.display_name.toLowerCase().includes(q) ||
        (l.country_of_origin ?? "").toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case "score_asc": result.sort((a, b) => (a.fms_score ?? 0) - (b.fms_score ?? 0)); break;
      case "recent": result.sort((a, b) => new Date(b.fms_last_scored_at ?? 0).getTime() - new Date(a.fms_last_scored_at ?? 0).getTime()); break;
      case "name": result.sort((a, b) => a.display_name.localeCompare(b.display_name)); break;
      default: result.sort((a, b) => (b.fms_score ?? 0) - (a.fms_score ?? 0));
    }
    return result;
  }, [leads, typeFilter, signalFilter, search, sortBy]);

  const exportCSV = () => {
    const headers = ["Name", "Archetype", "Life Stage", "Country", "FMS Score", "Signal", "Lead Type", "Rationale", "Financial Goals", "Last Scored"];
    const rows = filtered.map((l) => [
      l.display_name,
      archetypeNames[l.pathway_type ?? ""] ?? "",
      lifeStageLabels[l.life_stage ?? ""] ?? "",
      l.country_of_origin ?? "",
      String(l.fms_score ?? 0),
      signalLabels[l.fms_signal_type ?? "none"]?.label ?? "",
      leadTypeConfig[l.fms_lead_type ?? ""]?.label ?? l.fms_lead_type ?? "",
      `"${(l.fms_rationale ?? "").replace(/"/g, '""')}"`,
      `"${(l.financial_goals ?? []).join(", ")}"`,
      l.fms_last_scored_at ? format(new Date(l.fms_last_scored_at), "dd MMM yyyy") : "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fms-leads-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Leads exported");
  };

  const scoreColor = (score: number) => {
    if (score >= 60) return "#3DD4A8";
    if (score >= 35) return "#C9941E";
    return "#A8B0BC";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-3xl text-foreground">FMS Lead Intelligence</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            Leads scored from real member profile data and platform engagement
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <Target size={14} className="text-accent" />
            <span className="font-body text-xs text-muted-foreground">Deterministic scoring — no AI dependency</span>
          </div>
        </div>
        <Button variant="gold" onClick={exportCSV} className="shrink-0">Export Leads</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Scored", value: summaryStats.totalScored },
          { label: "Eligible Leads", value: summaryStats.eligible },
          { label: "Strong Signal", value: summaryStats.strong },
          { label: "Scored This Week", value: summaryStats.scoredThisWeek },
        ].map((s) => (
          <div key={s.label} className="ms-card-metric">
            <p className="font-body text-xs mb-1" style={{ color: "var(--ms-text-muted)" }}>{s.label}</p>
            <p className="font-heading text-2xl" style={{ color: "#F1F5F9" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px] bg-card border-border"><SelectValue placeholder="Lead Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="first_home_buyer">First Home Buyer</SelectItem>
            <SelectItem value="refinancer">Refinancer</SelectItem>
            <SelectItem value="wealth_builder">Wealth Builder</SelectItem>
            <SelectItem value="protection">Protection</SelectItem>
            <SelectItem value="investment_property">Investment Property</SelectItem>
          </SelectContent>
        </Select>
        <Select value={signalFilter} onValueChange={setSignalFilter}>
          <SelectTrigger className="w-[160px] bg-card border-border"><SelectValue placeholder="Signal" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Signals</SelectItem>
            <SelectItem value="strong">Strong</SelectItem>
            <SelectItem value="possible">Possible</SelectItem>
            <SelectItem value="none">No Signal</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or country…" className="pl-9 bg-card border-border" />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px] bg-card border-border"><SelectValue placeholder="Sort by" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="score_desc">Score (high → low)</SelectItem>
            <SelectItem value="score_asc">Score (low → high)</SelectItem>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="name">Name A–Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-muted-foreground font-body">Loading leads…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Target size={32} className="text-muted-foreground" />
          <p className="font-body text-sm text-foreground">No leads match your filters</p>
          <p className="font-body text-xs text-muted-foreground max-w-sm text-center">
            Members are scored weekly based on their profile data and platform engagement. Adjust filters or check back later.
          </p>
        </div>
      ) : (
        <div className="ms-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/50">
                  {["Member", "Score", "Signal", "Lead Type", "Rationale", "Goals", "Scored"].map((h) => (
                    <th key={h} className="px-4 py-3 font-body text-xs text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => {
                  const lt = leadTypeConfig[lead.fms_lead_type ?? ""] ?? leadTypeConfig.not_ready;
                  const LeadIcon = lt.icon;
                  const accent = archetypeAccents[lead.pathway_type ?? ""] ?? "#C9941E";
                  const score = lead.fms_score ?? 0;
                  const sc = scoreColor(score);
                  const signal = signalLabels[lead.fms_signal_type ?? "none"] ?? signalLabels.none;

                  return (
                    <tr key={lead.user_id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-body font-semibold text-foreground">
                            {lead.display_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-body text-sm text-foreground">{lead.display_name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="inline-block px-2 py-0.5 rounded-full font-body text-[10px]"
                                style={{ backgroundColor: `${accent}26`, color: accent }}>
                                {archetypeNames[lead.pathway_type ?? ""] ?? "—"}
                              </span>
                              {lead.country_of_origin && (
                                <span className="font-body text-[10px] text-muted-foreground">{lead.country_of_origin}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-body text-xl font-semibold" style={{ color: sc }}>{score}</p>
                        <div className="w-full h-1 rounded-full bg-muted mt-1">
                          <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: sc }} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2.5 py-1 rounded-full font-body text-xs font-medium"
                          style={{ backgroundColor: `${signal.color}20`, color: signal.color }}>
                          {signal.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-body text-xs font-medium"
                          style={{ backgroundColor: `${lt.color}26`, color: lt.color }}>
                          <LeadIcon size={12} />
                          {lt.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[220px]">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="font-body text-sm text-muted-foreground line-clamp-2 cursor-help">
                              {lead.fms_rationale ?? "—"}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs"><p>{lead.fms_rationale}</p></TooltipContent>
                        </Tooltip>
                      </td>
                      <td className="px-4 py-3 max-w-[150px]">
                        <div className="flex flex-wrap gap-1">
                          {(lead.financial_goals ?? []).slice(0, 2).map((g) => (
                            <span key={g} className="font-body text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{g}</span>
                          ))}
                          {(lead.financial_goals ?? []).length > 2 && (
                            <span className="font-body text-[10px] text-muted-foreground">+{(lead.financial_goals ?? []).length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-body text-xs text-muted-foreground">
                          {lead.fms_last_scored_at ? format(new Date(lead.fms_last_scored_at), "d MMM") : "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FMSLeadBoard;
