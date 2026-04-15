import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft, ChevronRight, ClipboardList, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import EmptyState from "@/components/EmptyState";

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

const ACTION_TYPES = [
  "all",
  "role_change",
  "suspend",
  "unsuspend",
  "content_resolve",
  "content_dismiss",
  "content_hide",
  "content_lock",
  "settings_change",
  "ritual_publish",
  "course_publish",
  "event_create",
  "event_update",
];

const ACTION_LABELS: Record<string, string> = {
  role_change: "Role Change",
  suspend: "Suspend",
  unsuspend: "Unsuspend",
  content_resolve: "Content Resolved",
  content_dismiss: "Content Dismissed",
  content_hide: "Content Hidden",
  content_lock: "Thread Locked",
  settings_change: "Settings Change",
  ritual_publish: "Ritual Publish",
  course_publish: "Course Publish",
  event_create: "Event Created",
  event_update: "Event Updated",
};

const ACTION_COLORS: Record<string, string> = {
  role_change: "bg-blue-500/15 text-blue-400",
  suspend: "bg-destructive/15 text-destructive",
  unsuspend: "bg-teal-500/15 text-teal-400",
  content_resolve: "bg-accent/15 text-accent",
  content_dismiss: "bg-muted text-muted-foreground",
  content_hide: "bg-destructive/15 text-destructive",
  content_lock: "bg-yellow-500/15 text-yellow-400",
  settings_change: "bg-purple-500/15 text-purple-400",
  ritual_publish: "bg-teal-500/15 text-teal-400",
  course_publish: "bg-blue-500/15 text-blue-400",
  event_create: "bg-accent/15 text-accent",
  event_update: "bg-purple-500/15 text-purple-400",
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
    const { data } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (!data) { setEntries([]); setLoading(false); return; }

    // Resolve actor/target names
    const userIds = new Set<string>();
    data.forEach(e => {
      if (e.actor_id) userIds.add(e.actor_id);
      if (e.target_id) userIds.add(e.target_id);
    });

    const idArr = [...userIds];
    let nameByUserId = new Map<string, string>();
    let nameById = new Map<string, string>();

    if (idArr.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, id")
        .or(`user_id.in.(${idArr.join(",")}),id.in.(${idArr.join(",")})`);

      (profiles || []).forEach(p => {
        nameByUserId.set(p.user_id, p.display_name);
        nameById.set(p.id, p.display_name);
      });
    }

    setEntries(data.map(e => ({
      ...e,
      actor_name: nameByUserId.get(e.actor_id) || nameById.get(e.actor_id) || e.actor_id?.slice(0, 8),
      target_name:
        (e.metadata as any)?.user_name ||
        nameByUserId.get(e.target_id) ||
        nameById.get(e.target_id) ||
        (e.target_id?.length > 20 ? e.target_id.slice(0, 8) + "…" : e.target_id),
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let result = entries;
    if (actionFilter !== "all") result = result.filter(e => e.action === actionFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.actor_name?.toLowerCase().includes(q) ||
        e.target_name?.toLowerCase().includes(q)
      );
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
    if (action === "role_change") return `${meta.from} → ${meta.to}`;
    if (action === "suspend") return meta.reason || "—";
    if (action === "unsuspend") return meta.user_name || "";
    if (action === "settings_change") return `${meta.key || meta.platform_name ? "identity" : ""}: ${meta.from ?? ""} → ${meta.to ?? ""}`;
    if (action.startsWith("content_")) return `${meta.content_type || ""} ${meta.note ? "— " + meta.note : ""}`;
    const str = JSON.stringify(meta);
    return str.length > 2 ? str.slice(0, 120) : "";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-heading text-primary">Audit Log</h2>
        <button onClick={load} className="p-2 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={actionFilter} onValueChange={v => { setActionFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[180px] ms-input"><SelectValue placeholder="All Actions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {ACTION_TYPES.filter(a => a !== "all").map(a => (
              <SelectItem key={a} value={a}>{ACTION_LABELS[a] || a.replace(/_/g, " ")}</SelectItem>
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
          placeholder="Search by actor or target…"
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
        <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground font-body text-sm">
          <RefreshCw size={16} className="animate-spin" /> Loading audit log…
        </div>
      ) : paged.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          iconClassName="text-muted-foreground"
          heading={entries.length === 0 ? "No audit log entries yet" : "No matching entries"}
          body={entries.length === 0 ? "Admin actions will appear here as they happen." : "Try adjusting your filters."}
        />
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
                        {ACTION_LABELS[e.action] || e.action.replace(/_/g, " ")}
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
