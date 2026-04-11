import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, Home, RefreshCw, TrendingUp, Shield, Building, Clock,
  Mail, ExternalLink, Target, Search, ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const archetypeAccents: Record<string, string> = {
  giver: "#E8845C", keeper: "#5B8DB8", rebel: "#9B59B6", seeker: "#27AE8F", achiever: "#C9941E",
};
const archetypeNames: Record<string, string> = {
  giver: "The Giver", keeper: "The Keeper", rebel: "The Rebel", seeker: "The Seeker", achiever: "The Achiever",
};

const leadTypeConfig: Record<string, { label: string; icon: typeof Home; color: string }> = {
  first_home_buyer: { label: "First Home Buyer", icon: Home, color: "#5B8DB8" },
  refinancer: { label: "Refinancer", icon: RefreshCw, color: "#9B59B6" },
  wealth_builder: { label: "Wealth Builder", icon: TrendingUp, color: "#C9941E" },
  protection: { label: "Protection", icon: Shield, color: "#27AE8F" },
  investment_property: { label: "Investment Property", icon: Building, color: "#E8845C" },
  not_ready: { label: "Not Ready", icon: Clock, color: "#6B7280" },
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
  fms_last_scored_at: string | null;
  created_at: string;
};

const FMSLeadBoard = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [confFilter, setConfFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("score_desc");

  useEffect(() => {
    const fetchLeads = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, pathway_type, life_stage, fms_score, fms_lead_type, fms_confidence, fms_rationale, fms_referral_eligible, fms_last_scored_at, created_at")
        .eq("fms_referral_eligible", true);
      setLeads((data as Lead[]) ?? []);
      setLoading(false);
    };
    fetchLeads();
  }, []);

  const allScored = leads;

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const summaryStats = useMemo(() => ({
    totalLeads: allScored.length,
    highConf: allScored.filter((l) => l.fms_confidence === "high").length,
    firstHome: allScored.filter((l) => l.fms_lead_type === "first_home_buyer").length,
    scoredThisWeek: allScored.filter(
      (l) => l.fms_last_scored_at && new Date(l.fms_last_scored_at).getTime() > sevenDaysAgo,
    ).length,
  }), [allScored, sevenDaysAgo]);

  const filtered = useMemo(() => {
    let result = [...leads];
    if (typeFilter !== "all") result = result.filter((l) => l.fms_lead_type === typeFilter);
    if (confFilter !== "all") result = result.filter((l) => l.fms_confidence === confFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((l) => l.display_name.toLowerCase().includes(q));
    }
    switch (sortBy) {
      case "score_asc": result.sort((a, b) => (a.fms_score ?? 0) - (b.fms_score ?? 0)); break;
      case "recent": result.sort((a, b) => new Date(b.fms_last_scored_at ?? 0).getTime() - new Date(a.fms_last_scored_at ?? 0).getTime()); break;
      case "name": result.sort((a, b) => a.display_name.localeCompare(b.display_name)); break;
      default: result.sort((a, b) => (b.fms_score ?? 0) - (a.fms_score ?? 0));
    }
    return result;
  }, [leads, typeFilter, confFilter, search, sortBy]);

  const exportCSV = () => {
    const headers = ["Name", "Archetype", "Life Stage", "FMS Score", "Lead Type", "Confidence", "Rationale", "Member Since", "Last Scored"];
    const rows = filtered.map((l) => [
      l.display_name,
      archetypeNames[l.pathway_type ?? ""] ?? l.pathway_type ?? "",
      lifeStageLabels[l.life_stage ?? ""] ?? l.life_stage ?? "",
      String(l.fms_score ?? 0),
      leadTypeConfig[l.fms_lead_type ?? ""]?.label ?? l.fms_lead_type ?? "",
      l.fms_confidence ?? "",
      `"${(l.fms_rationale ?? "").replace(/"/g, '""')}"`,
      l.created_at ? format(new Date(l.created_at), "MMM yyyy") : "",
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
    if (score >= 70) return "#27AE8F";
    if (score >= 40) return "#C9941E";
    return "#6B7280";
  };

  const MetricCard = ({ label, value }: { label: string; value: number }) => (
    <div className="rounded-xl p-4 border" style={{ background: "hsl(220 72% 10%)", borderColor: "hsl(220 50% 20%)" }}>
      <p className="font-body text-xs text-cream/40 mb-1">{label}</p>
      <p className="font-heading text-2xl text-cream">{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-3xl text-foreground">FMS Lead Intelligence</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            Potential Finance &amp; Mortgage Solutions leads identified by AI
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <Sparkles size={14} className="text-accent" />
            <span className="font-body text-xs text-muted-foreground">Powered by Gemini 2.5 Flash</span>
          </div>
        </div>
        <Button variant="gold" onClick={exportCSV} className="shrink-0">
          Export Leads
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total Leads" value={summaryStats.totalLeads} />
        <MetricCard label="High Confidence" value={summaryStats.highConf} />
        <MetricCard label="First Home Buyers" value={summaryStats.firstHome} />
        <MetricCard label="Scored This Week" value={summaryStats.scoredThisWeek} />
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
        <Select value={confFilter} onValueChange={setConfFilter}>
          <SelectTrigger className="w-[140px] bg-card border-border"><SelectValue placeholder="Confidence" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="pl-9 bg-card border-border"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px] bg-card border-border"><SelectValue placeholder="Sort by" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="score_desc">Score (high to low)</SelectItem>
            <SelectItem value="score_asc">Score (low to high)</SelectItem>
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
          <Sparkles size={32} className="text-muted-foreground" />
          <p className="font-body text-sm text-foreground">No leads scored yet</p>
          <p className="font-body text-xs text-muted-foreground max-w-sm text-center">
            Members are scored weekly in the background. Check back after your community has been active for a week.
          </p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/50">
                  {["Member", "FMS Score", "Lead Type", "Confidence", "AI Rationale", "Member Since", "Actions"].map((h) => (
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

                  return (
                    <tr key={lead.user_id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      {/* Member */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-body font-semibold text-foreground">
                            {lead.display_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-body text-sm text-foreground">{lead.display_name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className="inline-block px-2 py-0.5 rounded-full font-body text-[10px]"
                                style={{ backgroundColor: `${accent}26`, color: accent }}
                              >
                                {archetypeNames[lead.pathway_type ?? ""] ?? "—"}
                              </span>
                              <span className="font-body text-[11px] text-muted-foreground">
                                {lifeStageLabels[lead.life_stage ?? ""] ?? ""}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Score */}
                      <td className="px-4 py-3">
                        <p className="font-body text-xl font-semibold" style={{ color: sc }}>{score}</p>
                        <div className="w-full h-1 rounded-full bg-muted mt-1">
                          <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: sc }} />
                        </div>
                      </td>

                      {/* Lead type */}
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-body text-xs font-medium"
                          style={{ backgroundColor: `${lt.color}26`, color: lt.color }}
                        >
                          <LeadIcon size={12} />
                          {lt.label}
                        </span>
                      </td>

                      {/* Confidence */}
                      <td className="px-4 py-3">
                        <span
                          className="inline-block px-2.5 py-1 rounded-full font-body text-xs"
                          style={{
                            backgroundColor: lead.fms_confidence === "high" ? "#27AE8F26" : lead.fms_confidence === "medium" ? "#C9941E26" : "hsl(220 50% 20%)",
                            color: lead.fms_confidence === "high" ? "#27AE8F" : lead.fms_confidence === "medium" ? "#C9941E" : "#6B7280",
                          }}
                        >
                          {lead.fms_confidence ?? "—"}
                        </span>
                      </td>

                      {/* Rationale */}
                      <td className="px-4 py-3 max-w-[200px]">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="font-body text-sm text-muted-foreground italic line-clamp-2 cursor-help">
                              {lead.fms_rationale ?? "—"}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{lead.fms_rationale}</p>
                          </TooltipContent>
                        </Tooltip>
                      </td>

                      {/* Member since */}
                      <td className="px-4 py-3">
                        <span className="font-body text-xs text-muted-foreground">
                          {lead.created_at ? format(new Date(lead.created_at), "MMM yyyy") : "—"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { toast.info("Email not available from client"); }}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Mail size={14} />
                          </button>
                          <a href="/members" className="text-muted-foreground hover:text-foreground transition-colors">
                            <ExternalLink size={14} />
                          </a>
                        </div>
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
