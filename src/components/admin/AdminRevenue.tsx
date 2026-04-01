import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface TicketRow {
  id: string;
  event_id: string;
  user_id: string;
  purchased_at: string;
  status: string;
}

const AdminRevenue = () => {
  const [memberCount, setMemberCount] = useState(0);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });
      setMemberCount(count ?? 0);

      const { data } = await supabase
        .from("event_tickets")
        .select("id, event_id, user_id, purchased_at, status")
        .order("purchased_at", { ascending: false })
        .limit(50);
      setTickets((data as TicketRow[]) ?? []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <p className="text-muted-foreground font-body">Loading…</p>;

  return (
    <div>
      <h2 className="text-2xl font-heading text-primary mb-6">Revenue</h2>

      <div className="grid gap-6 sm:grid-cols-2 mb-8">
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground font-body">Total Members</p>
          <p className="text-4xl font-heading text-primary mt-1">{memberCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground font-body">Event Tickets Sold</p>
          <p className="text-4xl font-heading text-primary mt-1">{tickets.length}</p>
        </div>
      </div>

      <h3 className="font-heading text-lg text-primary mb-4">Recent Tickets</h3>
      {tickets.length === 0 ? (
        <p className="text-muted-foreground font-body">No tickets yet.</p>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <div key={t.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-body text-foreground">
                  Ticket <span className="text-muted-foreground">{t.id.slice(0, 8)}…</span>
                </p>
                <p className="text-xs text-muted-foreground font-body">
                  {format(new Date(t.purchased_at), "d MMM yyyy, HH:mm")} · {t.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminRevenue;
