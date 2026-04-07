import { useEffect, useState, useMemo, useRef } from "react";
import { format, subDays, startOfWeek } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  Users, TrendingUp, TrendingDown, CreditCard, GraduationCap,
  UserCheck, Ticket, MessageSquare, Flame, Search,
  Download, FileSpreadsheet, FileText, Copy, ChevronDown
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  BarChart, Bar, Area, AreaChart
} from "recharts";

/* ── types ────────────────────────────── */
interface Membership {
  id: string;
  plan: string;
  status: string;
  created_at: string;
}
interface TicketRow {
  id: string;
  event_id: string;
  user_id: string;
  purchased_at: string;
  status: string;
}
interface EventRow { id: string; title: string }
interface ProfileRow { id: string; display_name: string; user_id: string }

type Range = "30" | "90" | "all";

const MONTHLY_PRICE_AUD = 29;
const ANNUAL_PRICE_AUD = 290;
const NAVY = "#0E2D5F";
const GOLD = "#C9941E";
const NAVY_LIGHT = "#1B4B8F";
const NAVY_PALE = "#2A5FA0";

/* ── small reusable pieces ────────────── */

function StatCard({
  icon: Icon, label, value, trend, loading
}: {
  icon: React.ElementType; label: string; value: string | number;
  trend?: number | null; loading: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border-l-4 border-accent p-5">
        <Skeleton className="h-3 w-20 mb-3" />
        <Skeleton className="h-8 w-28" />
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl border-l-4 border-accent p-5 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-body font-semibold tracking-widest uppercase text-primary/60">
          {label}
        </span>
        <Icon size={16} className="text-accent" />
      </div>
      <p className="font-heading text-3xl text-primary leading-none mt-2">{value}</p>
      {trend !== undefined && trend !== null && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-body ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{Math.abs(trend).toFixed(1)}% vs last month</span>
        </div>
      )}
    </div>
  );
}

function InfoCard({
  icon: Icon, label, value, loading
}: { icon: React.ElementType; label: string; value: number; loading: boolean }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border-l-4 border-accent p-5">
        <Skeleton className="h-3 w-20 mb-3" />
        <Skeleton className="h-8 w-16" />
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl border-l-4 border-accent p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={16} className="text-accent" />
        <span className="text-[11px] font-body font-semibold tracking-widest uppercase text-primary/60">
          {label}
        </span>
      </div>
      <p className="font-heading text-3xl text-primary leading-none mt-2">
        {value === 0 ? <span className="text-lg text-primary/40 font-body">No data yet</span> : value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "active";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      isActive ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-600"
    }`}>
      {status}
    </span>
  );
}

/* ── main component ───────────────────── */

const AdminRevenue = () => {
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [totalProfiles, setTotalProfiles] = useState(0);
  const [totalEnrollments, setTotalEnrollments] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalThreads, setTotalThreads] = useState(0);
  const [totalRitualCompletions, setTotalRitualCompletions] = useState(0);
  const [range, setRange] = useState<Range>("90");
  const [ticketFilter, setTicketFilter] = useState<"all" | "active" | "cancelled">("all");
  const [ticketSearch, setTicketSearch] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const load = async () => {
      const [
        membershipsRes,
        ticketsRes,
        eventsRes,
        profilesRes,
        profileCountRes,
        enrollCountRes,
        postsCountRes,
        threadsCountRes,
        ritualsCountRes,
      ] = await Promise.all([
        supabase.from("memberships").select("id, plan, status, created_at"),
        supabase.from("event_tickets").select("id, event_id, user_id, purchased_at, status").order("purchased_at", { ascending: false }).limit(50),
        supabase.from("events").select("id, title"),
        supabase.from("profiles").select("id, display_name, user_id"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("course_enrollments").select("id", { count: "exact", head: true }),
        supabase.from("posts").select("id", { count: "exact", head: true }),
        supabase.from("threads").select("id", { count: "exact", head: true }),
        supabase.from("ritual_completions").select("id", { count: "exact", head: true }),
      ]);

      setMemberships((membershipsRes.data as Membership[]) ?? []);
      setTickets((ticketsRes.data as TicketRow[]) ?? []);
      setEvents((eventsRes.data as EventRow[]) ?? []);
      setProfiles((profilesRes.data as ProfileRow[]) ?? []);
      setTotalProfiles(profileCountRes.count ?? 0);
      setTotalEnrollments(enrollCountRes.count ?? 0);
      setTotalPosts(postsCountRes.count ?? 0);
      setTotalThreads(threadsCountRes.count ?? 0);
      setTotalRitualCompletions(ritualsCountRes.count ?? 0);
      setLoading(false);
    };
    load();
  }, []);

  /* derived metrics */
  const activeMembers = useMemo(() => memberships.filter(m => m.status === "active"), [memberships]);
  const monthlyCount = useMemo(() => activeMembers.filter(m => m.plan === "monthly").length, [activeMembers]);
  const annualCount = useMemo(() => activeMembers.filter(m => m.plan === "annual").length, [activeMembers]);
  const mrr = monthlyCount * MONTHLY_PRICE_AUD + annualCount * (ANNUAL_PRICE_AUD / 12);
  const activeTickets = useMemo(() => tickets.filter(t => t.status === "active").length, [tickets]);

  /* trend: compare current month active members vs previous month */
  const trend = useMemo(() => {
    const now = new Date();
    const thisMonth = memberships.filter(m => {
      const d = new Date(m.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = memberships.filter(m => {
      const d = new Date(m.created_at);
      return d.getMonth() === prev.getMonth() && d.getFullYear() === prev.getFullYear();
    }).length;
    if (lastMonth === 0) return thisMonth > 0 ? 100 : null;
    return ((thisMonth - lastMonth) / lastMonth) * 100;
  }, [memberships]);

  /* growth chart data */
  const growthData = useMemo(() => {
    const cutoff = range === "30" ? subDays(new Date(), 30) : range === "90" ? subDays(new Date(), 90) : null;
    const sorted = [...memberships].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const weekMap = new Map<string, number>();
    let cumulative = 0;
    for (const m of sorted) {
      const d = new Date(m.created_at);
      if (cutoff && d < cutoff) { cumulative++; continue; }
      const weekKey = format(startOfWeek(d, { weekStartsOn: 1 }), "d MMM yy");
      cumulative++;
      weekMap.set(weekKey, cumulative);
    }
    return Array.from(weekMap.entries()).map(([week, count]) => ({ week, members: count }));
  }, [memberships, range]);

  /* plan breakdown pie */
  const planData = useMemo(() => [
    { name: "Monthly", value: monthlyCount },
    { name: "Annual", value: annualCount },
  ], [monthlyCount, annualCount]);

  /* status breakdown bar */
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    memberships.forEach(m => { counts[m.status] = (counts[m.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [memberships]);

  /* tickets table with filter & search */
  const eventMap = useMemo(() => {
    const m = new Map<string, string>();
    events.forEach(e => m.set(e.id, e.title));
    return m;
  }, [events]);
  const profileMap = useMemo(() => {
    const m = new Map<string, string>();
    profiles.forEach(p => m.set(p.user_id, p.display_name));
    return m;
  }, [profiles]);

  const filteredTickets = useMemo(() => {
    let list = tickets;
    if (ticketFilter !== "all") list = list.filter(t => t.status === ticketFilter);
    if (ticketSearch.trim()) {
      const q = ticketSearch.toLowerCase();
      list = list.filter(t =>
        t.id.toLowerCase().includes(q) ||
        (eventMap.get(t.event_id) ?? "").toLowerCase().includes(q) ||
        (profileMap.get(t.user_id) ?? "").toLowerCase().includes(q)
      );
    }
    return list.slice(0, 10);
  }, [tickets, ticketFilter, ticketSearch, eventMap, profileMap]);

  const PIE_COLORS = [NAVY, GOLD];
  const BAR_COLORS = [NAVY, NAVY_LIGHT, NAVY_PALE];

  return (
    <div className="space-y-10 max-w-6xl">
      {/* Section 1: Key Metrics */}
      <div>
        <h2 className="font-heading text-2xl text-primary mb-6">Revenue &amp; Platform Analytics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard icon={UserCheck} label="Active Members" value={loading ? "..." : activeMembers.length} trend={trend} loading={loading} />
          <StatCard icon={CreditCard} label="Monthly Recurring Revenue" value={loading ? "..." : `A$${mrr.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} trend={null} loading={loading} />
          <StatCard icon={Users} label="Annual Plan Members" value={loading ? "..." : annualCount} trend={null} loading={loading} />
          <StatCard icon={Ticket} label="Event Tickets Sold" value={loading ? "..." : activeTickets} trend={null} loading={loading} />
          <StatCard icon={GraduationCap} label="Courses Enrolled" value={loading ? "..." : totalEnrollments} trend={null} loading={loading} />
          <StatCard icon={Users} label="Total Users" value={loading ? "..." : totalProfiles} trend={null} loading={loading} />
        </div>
      </div>

      {/* Section 2: Membership Growth */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h3 className="font-heading text-xl text-primary">Membership Growth</h3>
          <div className="flex gap-1 bg-stone-100 rounded-lg p-0.5">
            {([["30", "30 days"], ["90", "90 days"], ["all", "All time"]] as [Range, string][]).map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setRange(val)}
                className={`px-3 py-1.5 rounded-md text-xs font-body font-medium transition-colors ${
                  range === val ? "bg-primary text-primary-foreground shadow-sm" : "text-primary/60 hover:text-primary"
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : growthData.length === 0 ? (
          <p className="text-primary/40 font-body text-center py-20">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={growthData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D8" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: NAVY }} />
              <YAxis tick={{ fontSize: 11, fill: NAVY }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: `1px solid ${GOLD}`, fontFamily: "DM Sans" }}
                labelStyle={{ fontWeight: 600, color: NAVY }}
              />
              <Area type="monotone" dataKey="members" stroke={NAVY} strokeWidth={2} fill="url(#goldGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Section 3: Two-column charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Breakdown Pie */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
          <h3 className="font-heading text-xl text-primary mb-4">Plan Breakdown</h3>
          {loading ? (
            <Skeleton className="h-52 w-full rounded-lg" />
          ) : planData.every(d => d.value === 0) ? (
            <p className="text-primary/40 font-body text-center py-16">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={planData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {planData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontFamily: "DM Sans" }} />
                <Legend
                  formatter={(value, entry: any) => {
                    const item = planData.find(d => d.name === value);
                    return <span className="text-sm font-body text-primary">{value}: {item?.value ?? 0}</span>;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status Breakdown Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
          <h3 className="font-heading text-xl text-primary mb-4">Membership Status</h3>
          {loading ? (
            <Skeleton className="h-52 w-full rounded-lg" />
          ) : statusData.length === 0 ? (
            <p className="text-primary/40 font-body text-center py-16">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={statusData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D8" />
                <XAxis type="number" tick={{ fontSize: 11, fill: NAVY }} />
                <YAxis dataKey="status" type="category" tick={{ fontSize: 12, fill: NAVY }} width={80} />
                <Tooltip contentStyle={{ borderRadius: 8, fontFamily: "DM Sans" }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {statusData.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Section 4: Recent Tickets Table */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <h3 className="font-heading text-xl text-primary">Recent Tickets</h3>
          <div className="flex gap-2 items-center">
            <div className="flex gap-1 bg-stone-100 rounded-lg p-0.5">
              {(["all", "active", "cancelled"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setTicketFilter(s)}
                  className={`px-3 py-1.5 rounded-md text-xs font-body font-medium capitalize transition-colors ${
                    ticketFilter === s ? "bg-primary text-primary-foreground shadow-sm" : "text-primary/60 hover:text-primary"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-primary/40" />
              <Input
                value={ticketSearch}
                onChange={e => setTicketSearch(e.target.value)}
                placeholder="Search..."
                className="pl-8 h-8 text-xs w-40 bg-stone-50 border-stone-200"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : filteredTickets.length === 0 ? (
          <p className="text-primary/40 font-body text-center py-10">No tickets found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-2.5 px-3 text-[11px] font-semibold tracking-wider uppercase text-primary/50">Ticket ID</th>
                  <th className="text-left py-2.5 px-3 text-[11px] font-semibold tracking-wider uppercase text-primary/50">Event</th>
                  <th className="text-left py-2.5 px-3 text-[11px] font-semibold tracking-wider uppercase text-primary/50">User</th>
                  <th className="text-left py-2.5 px-3 text-[11px] font-semibold tracking-wider uppercase text-primary/50">Purchase Date</th>
                  <th className="text-left py-2.5 px-3 text-[11px] font-semibold tracking-wider uppercase text-primary/50">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map(t => (
                  <tr key={t.id} className="border-b border-stone-100 hover:bg-accent/5 transition-colors">
                    <td className="py-3 px-3 text-primary/70 font-mono text-xs">{t.id.slice(0, 8)}...</td>
                    <td className="py-3 px-3 text-primary">{eventMap.get(t.event_id) ?? "Unknown"}</td>
                    <td className="py-3 px-3 text-primary">{profileMap.get(t.user_id) ?? "Unknown"}</td>
                    <td className="py-3 px-3 text-primary/70">{format(new Date(t.purchased_at), "d MMM yyyy, HH:mm")}</td>
                    <td className="py-3 px-3"><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 5: Platform Activity */}
      <div>
        <h3 className="font-heading text-xl text-primary mb-4">Platform Activity</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InfoCard icon={MessageSquare} label="Total Posts" value={totalPosts} loading={loading} />
          <InfoCard icon={MessageSquare} label="Forum Threads" value={totalThreads} loading={loading} />
          <InfoCard icon={Flame} label="Ritual Completions" value={totalRitualCompletions} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default AdminRevenue;
