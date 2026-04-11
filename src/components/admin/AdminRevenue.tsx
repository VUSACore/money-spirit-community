import { useEffect, useState, useMemo, useRef } from "react";
import { format, subDays, startOfWeek, startOfMonth, isAfter } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  Users, CreditCard, TrendingUp, Ticket, DollarSign, UserPlus,
  MessageSquare, Sparkles, Activity, Download, FileSpreadsheet,
  FileText, Copy, ChevronDown,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const MONTHLY_PRICE = 19;
const ANNUAL_PRICE = 149;

interface Membership {
  id: string; plan: string; status: string; created_at: string;
}
interface TicketRow {
  id: string; event_id: string; user_id: string; purchased_at: string; status: string;
}
interface EventRow { id: string; title: string; price_pence: number }
interface ProfileRow { user_id: string; display_name: string }

type Days = 30 | 90 | 365;

/* ── Metric Card ── */
function MetricCard({ label, value, sub, loading }: {
  label: string; value: string | number; sub?: string; loading: boolean;
}) {
  if (loading) return (
    <div className="bg-[#102A4C] rounded-xl border border-[#1E3A5F]/50 p-5 animate-pulse">
      <div className="h-3 w-24 bg-white/10 rounded mb-4" />
      <div className="h-9 w-32 bg-white/10 rounded" />
    </div>
  );
  return (
    <div className="bg-[#102A4C] rounded-xl border border-[#1E3A5F]/50 p-5">
      <p className="text-[12px] font-body font-semibold tracking-[0.8px] uppercase text-[#5A7A9F] mb-2">{label}</p>
      <p className="font-heading text-4xl text-cream-50 leading-none">{value}</p>
      {sub && <p className="text-[12px] font-body text-[#5A7A9F] mt-2">{sub}</p>}
    </div>
  );
}

/* ── Custom Tooltip ── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0B1D3A] border border-gold/40 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-[12px] font-body text-cream-200">{label}</p>
      <p className="text-[13px] font-body font-medium text-gold">{payload[0].value} members</p>
    </div>
  );
}

/* ── Status Pill ── */
function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-teal-500/20 text-teal-400",
    cancelled: "bg-[#E8845C]/20 text-[#E8845C]",
    refunded: "bg-[#E8845C]/20 text-[#E8845C]",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? "bg-gold/20 text-gold"}`}>
      {status}
    </span>
  );
}

const AdminRevenue = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [weekPosts, setWeekPosts] = useState(0);
  const [weekRituals, setWeekRituals] = useState(0);
  const [weekMembers, setWeekMembers] = useState(0);
  const [weekActiveUsers, setWeekActiveUsers] = useState(0);
  const [days, setDays] = useState<Days>(90);
  const [eventFilter, setEventFilter] = useState("all");
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
        const mondayISO = monday.toISOString();

        const [mRes, tRes, eRes, pRes, wpRes, wrRes, wmRes, wPostUsers, wRitualUsers, wReplyUsers] = await Promise.all([
          supabase.from("memberships").select("id, plan, status, created_at"),
          supabase.from("event_tickets").select("id, event_id, user_id, purchased_at, status").order("purchased_at", { ascending: false }).limit(50),
          supabase.from("events").select("id, title, price_pence"),
          supabase.from("profiles").select("user_id, display_name"),
          supabase.from("posts").select("id", { count: "exact", head: true }).gte("created_at", mondayISO),
          supabase.from("ritual_completions").select("id", { count: "exact", head: true }).gte("completed_at", mondayISO),
          supabase.from("memberships").select("id", { count: "exact", head: true }).gte("created_at", mondayISO),
          supabase.from("posts").select("author_id").gte("created_at", mondayISO),
          supabase.from("ritual_completions").select("user_id").gte("completed_at", mondayISO),
          supabase.from("thread_replies").select("author_id").gte("created_at", mondayISO),
        ]);

        setMemberships((mRes.data as Membership[]) ?? []);
        setTickets((tRes.data as TicketRow[]) ?? []);
        setEvents((eRes.data as EventRow[]) ?? []);
        setProfiles((pRes.data as ProfileRow[]) ?? []);
        setWeekPosts(wpRes.count ?? 0);
        setWeekRituals(wrRes.count ?? 0);
        setWeekMembers(wmRes.count ?? 0);

        const userSet = new Set<string>();
        (wPostUsers.data ?? []).forEach((r: any) => userSet.add(r.author_id));
        (wRitualUsers.data ?? []).forEach((r: any) => userSet.add(r.user_id));
        (wReplyUsers.data ?? []).forEach((r: any) => userSet.add(r.author_id));
        setWeekActiveUsers(userSet.size);

        setLoading(false);
      } catch {
        setError(true);
        setLoading(false);
      }
    };
    load();
  }, []);

  /* derived */
  const active = useMemo(() => memberships.filter(m => m.status === "active"), [memberships]);
  const monthlyCount = useMemo(() => active.filter(m => m.plan === "monthly").length, [active]);
  const annualCount = useMemo(() => active.filter(m => m.plan === "annual").length, [active]);
  const mrr = monthlyCount * MONTHLY_PRICE + annualCount * (ANNUAL_PRICE / 12);
  const arr = mrr * 12;

  const eventMap = useMemo(() => {
    const m = new Map<string, EventRow>();
    events.forEach(e => m.set(e.id, e));
    return m;
  }, [events]);
  const profileMap = useMemo(() => {
    const m = new Map<string, string>();
    profiles.forEach(p => m.set(p.user_id, p.display_name));
    return m;
  }, [profiles]);

  const ticketRevenue = useMemo(() => {
    return tickets
      .filter(t => t.status === "active")
      .reduce((sum, t) => sum + ((eventMap.get(t.event_id)?.price_pence ?? 0) / 100), 0);
  }, [tickets, eventMap]);

  const avgRev = active.length > 0 ? mrr / active.length : 0;

  const newThisMonth = useMemo(() => {
    const start = startOfMonth(new Date());
    return memberships.filter(m => isAfter(new Date(m.created_at), start)).length;
  }, [memberships]);

  /* growth chart */
  const growthData = useMemo(() => {
    const cutoff = subDays(new Date(), days);
    const sorted = [...memberships].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const dayMap = new Map<string, number>();
    let cum = 0;
    for (const m of sorted) {
      const d = new Date(m.created_at);
      if (d < cutoff) { if (m.status === "active") cum++; continue; }
      if (m.status === "active") cum++;
      const key = days <= 90 ? format(d, "d MMM") : format(d, "MMM yy");
      dayMap.set(key, cum);
    }
    return Array.from(dayMap.entries()).map(([date, count]) => ({ date, count }));
  }, [memberships, days]);

  /* plan pie */
  const planData = useMemo(() => [
    { name: "Monthly", value: monthlyCount },
    { name: "Annual", value: annualCount },
  ], [monthlyCount, annualCount]);

  /* ticket table */
  const distinctEvents = useMemo(() => {
    const titles = new Set<string>();
    tickets.forEach(t => {
      const e = eventMap.get(t.event_id);
      if (e) titles.add(e.title);
    });
    return Array.from(titles);
  }, [tickets, eventMap]);

  const filteredTickets = useMemo(() => {
    let list = tickets;
    if (eventFilter !== "all") {
      list = list.filter(t => (eventMap.get(t.event_id)?.title ?? "") === eventFilter);
    }
    return list.slice(0, 20);
  }, [tickets, eventFilter, eventMap]);

  /* exports */
  const metricsArr = () => [
    { Metric: "Active Members", Value: active.length },
    { Metric: "Monthly Revenue (AUD)", Value: `$${mrr.toFixed(0)}` },
    { Metric: "Annual Revenue Run Rate (AUD)", Value: `$${arr.toFixed(0)}` },
    { Metric: "Event Ticket Revenue (AUD)", Value: `$${ticketRevenue.toFixed(2)}` },
    { Metric: "Avg Revenue Per Member (AUD)", Value: `$${avgRev.toFixed(2)}` },
    { Metric: "New Members This Month", Value: newThisMonth },
  ];

  const ticketsArr = () => filteredTickets.map(t => ({
    Event: eventMap.get(t.event_id)?.title ?? "Unknown",
    Member: profileMap.get(t.user_id) ?? "Unknown",
    "Amount (AUD)": `$${((eventMap.get(t.event_id)?.price_pence ?? 0) / 100).toFixed(2)}`,
    Date: format(new Date(t.purchased_at), "d MMM yyyy"),
    Status: t.status,
  }));

  const download = (blob: Blob, name: string) => {
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click();
  };

  const exportCSV = () => {
    setExportOpen(false);
    const rows = ticketsArr();
    if (!rows.length) { toast.error("No data to export"); return; }
    const hdr = Object.keys(rows[0]).join(",");
    const body = rows.map(r => Object.values(r).join(",")).join("\n");
    download(new Blob([hdr + "\n" + body], { type: "text/csv" }), `money-spirit-revenue-${format(new Date(), "yyyy-MM-dd")}.csv`);
    toast.success("CSV exported");
  };

  const exportExcel = () => {
    setExportOpen(false);
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(metricsArr());
    ws1["!cols"] = [{ wch: 35 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws1, "Summary");
    const ws2 = XLSX.utils.json_to_sheet(ticketsArr());
    ws2["!cols"] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Ticket Sales");
    XLSX.writeFile(wb, `money-spirit-revenue-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Excel exported");
  };

  const copySummary = async () => {
    setExportOpen(false);
    const text = metricsArr().map(m => `${m.Metric}: ${m.Value}`).join("\n");
    await navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  if (error) {
    return <p className="text-[#E8845C] font-body text-sm p-8">Unable to load data — please refresh</p>;
  }

  const activityRows = [
    { icon: MessageSquare, label: "Posts Published", value: weekPosts },
    { icon: Sparkles, label: "Rituals Completed", value: weekRituals },
    { icon: Users, label: "New Members", value: weekMembers },
    { icon: Activity, label: "Active Users", value: weekActiveUsers },
  ];

  return (
    <div className="space-y-10 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-[32px] text-primary leading-tight">Revenue &amp; Analytics</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">Platform financial overview</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-body text-muted-foreground">Updated just now</span>
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen(o => !o)}
              className="btn-gold inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-medium"
            >
              <Download size={15} /> Export Data
              <ChevronDown size={14} className={`transition-transform ${exportOpen ? "rotate-180" : ""}`} />
            </button>
            {exportOpen && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-lg border border-border shadow-lg z-50 py-1">
                <button onClick={exportCSV} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-body text-primary hover:bg-muted transition-colors">
                  <FileText size={15} className="text-accent" /> Download CSV
                </button>
                <button onClick={exportExcel} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-body text-primary hover:bg-muted transition-colors">
                  <FileSpreadsheet size={15} className="text-accent" /> Download Excel
                </button>
                <button onClick={copySummary} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-body text-primary hover:bg-muted transition-colors">
                  <Copy size={15} className="text-accent" /> Copy to Clipboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 1: Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="Active Members" value={active.length} loading={loading} />
        <MetricCard label="Monthly Revenue" value={`AUD $${mrr.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} loading={loading} />
        <MetricCard label="Annual Revenue Run Rate" value={`AUD $${arr.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} loading={loading} />
        <MetricCard label="Event Ticket Revenue" value={`AUD $${ticketRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} loading={loading} />
        <MetricCard label="Avg Revenue Per Member" value={`AUD $${avgRev.toFixed(2)}`} loading={loading} />
        <MetricCard label="New Members This Month" value={newThisMonth} sub="this calendar month" loading={loading} />
      </div>

      {/* Section 2: Growth Chart */}
      <div className="bg-[#102A4C] rounded-xl border border-[#1E3A5F]/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-body text-base font-medium text-cream-100">Member Growth</h3>
          <div className="flex gap-1">
            {([30, 90, 365] as Days[]).map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-md text-xs font-body font-medium transition-colors ${
                  days === d ? "bg-[#1E3A5F] text-gold" : "text-cream-400 hover:text-cream-200"
                }`}
              >
                {d === 365 ? "1 year" : `${d} days`}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="h-[280px] bg-white/5 rounded-lg animate-pulse" />
        ) : growthData.length === 0 ? (
          <p className="text-[#5A7A9F] font-body text-center py-20">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={growthData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid stroke="#1E3A5F" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#5A7A9F", fontFamily: "DM Sans" }} />
              <YAxis tick={{ fontSize: 11, fill: "#5A7A9F", fontFamily: "DM Sans" }} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="count" stroke="#C9941E" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Section 3: Pie + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Breakdown */}
        <div className="bg-[#102A4C] rounded-xl border border-[#1E3A5F]/50 p-6">
          <h3 className="font-body text-base font-medium text-cream-100 mb-4">Plan Breakdown</h3>
          {loading ? (
            <div className="h-[200px] bg-white/5 rounded-lg animate-pulse" />
          ) : planData.every(d => d.value === 0) ? (
            <p className="text-[#5A7A9F] font-body text-center py-16">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={planData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                  dataKey="value" paddingAngle={3}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill="#C9941E" />
                  <Cell fill="#27AE8F" />
                </Pie>
                <Legend
                  formatter={(value) => {
                    const item = planData.find(d => d.name === value);
                    return <span className="text-xs font-body text-cream-300">{value}: {item?.value ?? 0}</span>;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Platform Activity */}
        <div className="bg-[#102A4C] rounded-xl border border-[#1E3A5F]/50 p-6">
          <h3 className="font-body text-sm font-medium text-cream-200 mb-4">This Week</h3>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-8 bg-white/5 rounded animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {activityRows.map(r => (
                <div key={r.label} className="flex items-center gap-3">
                  <r.icon size={16} className="text-[#5A7A9F] shrink-0" />
                  <span className="flex-1 text-[13px] font-body text-cream-300">{r.label}</span>
                  <span className="text-sm font-body font-medium text-cream-100">{r.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section 4: Recent Ticket Sales */}
      <div className="bg-[#102A4C] rounded-xl border border-[#1E3A5F]/50 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <h3 className="font-body text-base font-medium text-cream-100">Recent Ticket Sales</h3>
          <select
            value={eventFilter}
            onChange={e => setEventFilter(e.target.value)}
            className="bg-[#1E3A5F] text-cream-300 text-xs font-body rounded-lg px-3 py-1.5 border-none outline-none"
          >
            <option value="all">All Events</option>
            {distinctEvents.map(title => (
              <option key={title} value={title}>{title}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="px-6 pb-6 space-y-2">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-white/5 rounded animate-pulse" />)}
          </div>
        ) : filteredTickets.length === 0 ? (
          <p className="text-[#5A7A9F] font-body text-sm text-center py-10">No ticket sales yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="bg-[#0B1D3A]">
                  {["Event", "Member", "Amount", "Date", "Status"].map(h => (
                    <th key={h} className="text-left py-2.5 px-4 text-[11px] font-semibold tracking-[0.8px] uppercase text-[#5A7A9F]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map(t => (
                  <tr key={t.id} className="border-t border-[#1E3A5F]/50 hover:bg-[#0F2847] transition-colors">
                    <td className="py-3 px-4 text-cream-200">{eventMap.get(t.event_id)?.title ?? "Unknown"}</td>
                    <td className="py-3 px-4 text-cream-200">{profileMap.get(t.user_id) ?? "Unknown"}</td>
                    <td className="py-3 px-4 text-cream-200">AUD ${((eventMap.get(t.event_id)?.price_pence ?? 0) / 100).toFixed(2)}</td>
                    <td className="py-3 px-4 text-cream-300">{format(new Date(t.purchased_at), "d MMM yyyy")}</td>
                    <td className="py-3 px-4"><StatusPill status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRevenue;
