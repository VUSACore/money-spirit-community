import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type AuditEntry = {
  id: string;
  action: string;
  actor_id: string;
  target_type: string;
  target_id: string;
  metadata: any;
  created_at: string;
  actor_name?: string;
  target_name?: string;
};

const ACTION_TYPES = ["all", "role_change", "suspend", "unsuspend", "content_resolve", "content_dismiss", "settings_change", "ritual_publish", "course_publish"];

const ACTION_COLORS: Record<string, string> = {
  role_change: "bg-blue-500/15 text-blue-400",
  suspend: "bg-destructive/15 text-destructive",
  unsuspend: "bg-teal-500/15 text-teal-400",
  content_resolve: "bg-accent/15 text-accent",
  content_dismiss: "bg-muted text-muted-foreground",
  settings_change: "bg-purple-500/15 text-purple-400",
};

const PAGE_SIZE = 50;

const AdminAuditLog = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [page, setPage] = useState(0);

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);

    const { data } = await query;
    if (!data) { setLoading(false); return; }

    // Resolve actor/target names
    const userIds = new Set<string>();
    data.forEach(e => {
      if (e.actor_id) userIds.add(e.actor_id);
      if (e.target_id) userIds.add(e.target_id);
    });

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, id")
      .or(`user_id.in.(${[...userIds].join(",")}),id.in.(${[...userIds].join(",")})`);

    const nameByUserId = new Map<string, string>();
    const nameById = new Map<string, string>();
    (profiles || []).forEach(p => {
      nameByUserId.set(p.user_id, p.display_name);
      nameById.set(p.id, p.display_name);
    });

    setEntries(data.map(e => ({
      ...e,
      actor_name: nameByUserId.get(e.actor_id) || nameById.get(e.actor_id) || e.actor_id?.slice(0, 8),
      target_name: nameByUserId.get(e.target_id) || nameById.get(e.target_id) || e.target_id?.slice(0, 8),
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let result = entries;
    if (actionFilter !== "all") result = result.filter(e => e.action === actionFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e => e.actor_name?.toLowerCase().includes(q));
    }
    if (fromDate) result = result.filter(e => new Date(e.created_at) >= fromDate);
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59);
      result = result.filter(e => new Date(e.created_at) <= end);
    }
    return result;
  }, [entries, actionFilter, search, fromDate, toDate]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const formatDetails = (action: string, meta: any) => {
    if (!meta || typeof meta !== "object") return "";
    if (action === "role_change") return `Role: ${meta.from} → ${meta.to}`;
    if (action === "suspend") return `Reason: ${meta.reason || "—"}`;
    if (action === "settings_change") return `${meta.key || ""}: ${meta.from} → ${meta.to}`;
    return JSON.stringify(meta).slice(0, 100);
  };

  return (
    <div>
      <h2 className="text-2xl font-heading text-primary mb-6">Audit Log</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={actionFilter} onValueChange={v => { setActionFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[180px] ms-input"><SelectValue placeholder="All Actions" /></SelectTrigger>
          <SelectContent>
            {ACTION_TYPES.map(a => (
              <SelectItem key={a} value={a}>{a === "all" ? "All Actions" : a.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !fromDate && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {fromDate ? format(fromDate, "d MMM yyyy") : "From"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={fromDate} onSelect={setFromDate} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !toDate && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {toDate ? format(toDate, "d MMM yyyy") : "To"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={toDate} onSelect={setToDate} className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>

        <Input
          placeholder="Search by actor…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          className="ms-input max-w-[200px]"
        />

        {(actionFilter !== "all" || fromDate || toDate || search) && (
          <Button variant="ghost" size="sm" onClick={() => { setActionFilter("all"); setFromDate(undefined); setToDate(undefined); setSearch(""); setPage(0); }}>
            Clear
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground font-body">Loading audit log…</p>
      ) : paged.length === 0 ? (
        <p className="text-muted-foreground font-body text-center py-12">No audit log entries yet</p>
      ) : (
        <>
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-body">Timestamp</TableHead>
                  <TableHead className="font-body">Action</TableHead>
                  <TableHead className="font-body">Actor</TableHead>
                  <TableHead className="font-body">Target</TableHead>
                  <TableHead className="font-body">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="font-body text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(e.created_at), "d MMM yyyy, h:mma")}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-body ${ACTION_COLORS[e.action] || "bg-muted text-muted-foreground"}`}>
                        {e.action.replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell className="font-body text-sm">{e.actor_name}</TableCell>
                    <TableCell className="font-body text-sm text-muted-foreground">{e.target_name}</TableCell>
                    <TableCell className="font-body text-xs text-muted-foreground max-w-[250px] truncate">
                      {formatDetails(e.action, e.metadata)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-muted-foreground font-body">
                Page {page + 1} of {totalPages} ({filtered.length} entries)
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft size={14} /> Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  Next <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminAuditLog;
