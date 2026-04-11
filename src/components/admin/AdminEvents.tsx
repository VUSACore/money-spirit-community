import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type EventRow = Tables<"events"> & { tickets_sold?: number };
type Attendee = { display_name: string; user_id: string; purchased_at: string; status: string };

const AdminEvents = () => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<Partial<Tables<"events">> | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<Record<string, Attendee[]>>({});
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase.from("events").select("*").order("event_date", { ascending: false });
    if (!data) { setLoading(false); return; }
    const enriched = await Promise.all(data.map(async e => {
      const { count } = await supabase.from("event_tickets").select("id", { count: "exact", head: true }).eq("event_id", e.id).eq("status", "active");
      return { ...e, tickets_sold: count || 0 };
    }));
    setEvents(enriched);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const loadAttendees = async (eventId: string) => {
    const { data: tickets } = await supabase.from("event_tickets").select("*").eq("event_id", eventId);
    if (!tickets) return;
    const userIds = tickets.map(t => t.user_id);
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds);
    const nameMap = new Map((profiles || []).map(p => [p.user_id, p.display_name]));
    setAttendees(prev => ({
      ...prev,
      [eventId]: tickets.map(t => ({
        display_name: nameMap.get(t.user_id) || "Unknown",
        user_id: t.user_id,
        purchased_at: t.purchased_at,
        status: t.status,
      })),
    }));
  };

  const toggleExpand = (eventId: string) => {
    if (expanded === eventId) { setExpanded(null); return; }
    setExpanded(eventId);
    if (!attendees[eventId]) loadAttendees(eventId);
  };

  const getStatus = (e: EventRow) => {
    const now = new Date();
    const date = new Date(e.event_date);
    if (date < now) return { label: "Past", cls: "bg-muted text-muted-foreground" };
    if (e.capacity && (e.tickets_sold || 0) >= e.capacity) return { label: "Sold Out", cls: "bg-destructive/15 text-destructive" };
    return { label: "Upcoming", cls: "bg-teal-500/15 text-teal-400" };
  };

  const formatPrice = (pence: number) => pence === 0 ? "Free" : `A$${(pence / 100).toFixed(0)}`;

  const openNew = () => {
    setModal({ title: "", description: "", published: false, price_pence: 0, is_virtual: false });
  };

  const save = async () => {
    if (!modal?.title || !modal?.event_date) {
      toast({ title: "Missing fields", description: "Title and date are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    if (modal.id) {
      const { error } = await supabase.from("events").update({
        title: modal.title,
        description: modal.description || null,
        event_date: modal.event_date,
        location: modal.location || null,
        is_virtual: modal.is_virtual ?? false,
        price_pence: modal.price_pence ?? 0,
        capacity: modal.capacity || null,
        published: modal.published ?? false,
      }).eq("id", modal.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Event updated" });
    } else {
      const { error } = await supabase.from("events").insert({
        title: modal.title,
        description: modal.description || null,
        event_date: typeof modal.event_date === "string" ? modal.event_date : new Date(modal.event_date).toISOString(),
        location: modal.location || null,
        is_virtual: modal.is_virtual ?? false,
        price_pence: modal.price_pence ?? 0,
        capacity: modal.capacity || null,
        published: modal.published ?? false,
        created_by: user.id,
      });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Event created" });
    }
    setSaving(false);
    setModal(null);
    load();
  };

  if (loading) return <p className="text-muted-foreground font-body">Loading events…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-heading text-primary">Events</h2>
        <Button variant="gold" onClick={openNew}><Plus size={16} /> New Event</Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-body w-8" />
              <TableHead className="font-body">Title</TableHead>
              <TableHead className="font-body">Date</TableHead>
              <TableHead className="font-body">Price</TableHead>
              <TableHead className="font-body">Capacity</TableHead>
              <TableHead className="font-body">Sold</TableHead>
              <TableHead className="font-body">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map(e => {
              const st = getStatus(e);
              return (
                <>
                  <TableRow key={e.id} className="cursor-pointer" onClick={() => toggleExpand(e.id)}>
                    <TableCell>
                      {expanded === e.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </TableCell>
                    <TableCell className="font-body font-medium">{e.title}</TableCell>
                    <TableCell className="font-body text-sm">{format(new Date(e.event_date), "d MMM yyyy")}</TableCell>
                    <TableCell className="font-body text-sm">{formatPrice(e.price_pence)}</TableCell>
                    <TableCell className="font-body text-sm text-muted-foreground">{e.capacity || "∞"}</TableCell>
                    <TableCell className="font-body text-sm">{e.tickets_sold}</TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-body ${st.cls}`}>{st.label}</span>
                    </TableCell>
                  </TableRow>
                  {expanded === e.id && (
                    <TableRow key={`${e.id}-attendees`}>
                      <TableCell colSpan={7} className="bg-muted/30 p-4">
                        <h4 className="font-heading text-sm text-primary mb-3">Attendees</h4>
                        {(attendees[e.id] || []).length === 0 ? (
                          <p className="text-sm text-muted-foreground font-body">No tickets purchased yet</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="font-body text-xs">Name</TableHead>
                                <TableHead className="font-body text-xs">Purchase Date</TableHead>
                                <TableHead className="font-body text-xs">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(attendees[e.id] || []).map((a, i) => (
                                <TableRow key={i}>
                                  <TableCell className="font-body text-sm">{a.display_name}</TableCell>
                                  <TableCell className="font-body text-sm text-muted-foreground">{format(new Date(a.purchased_at), "d MMM yyyy")}</TableCell>
                                  <TableCell>
                                    <span className={`text-xs font-body ${a.status === "active" ? "text-teal-400" : "text-destructive"}`}>{a.status}</span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Event Form Modal */}
      <Dialog open={!!modal} onOpenChange={open => !open && setModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-primary">{modal?.id ? "Edit Event" : "New Event"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="font-body text-sm">Title *</Label>
              <Input className="ms-input mt-1" value={modal?.title || ""} onChange={e => setModal(prev => ({ ...prev!, title: e.target.value }))} />
            </div>
            <div>
              <Label className="font-body text-sm">Description</Label>
              <Textarea className="ms-input mt-1" rows={3} value={modal?.description || ""} onChange={e => setModal(prev => ({ ...prev!, description: e.target.value }))} />
            </div>
            <div>
              <Label className="font-body text-sm">Event Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal mt-1", !modal?.event_date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {modal?.event_date ? format(new Date(modal.event_date), "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={modal?.event_date ? new Date(modal.event_date) : undefined}
                    onSelect={d => setModal(prev => ({ ...prev!, event_date: d?.toISOString() || "" }))}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-body text-sm">Location</Label>
                <Input className="ms-input mt-1" value={modal?.location || ""} onChange={e => setModal(prev => ({ ...prev!, location: e.target.value }))} />
              </div>
              <div className="flex items-end gap-3 pb-1">
                <Switch checked={modal?.is_virtual ?? false} onCheckedChange={v => setModal(prev => ({ ...prev!, is_virtual: v }))} />
                <Label className="font-body text-sm">Virtual</Label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-body text-sm">Price (pence)</Label>
                <Input className="ms-input mt-1" type="number" value={modal?.price_pence ?? 0} onChange={e => setModal(prev => ({ ...prev!, price_pence: parseInt(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label className="font-body text-sm">Capacity</Label>
                <Input className="ms-input mt-1" type="number" value={modal?.capacity ?? ""} onChange={e => setModal(prev => ({ ...prev!, capacity: parseInt(e.target.value) || null }))} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={modal?.published ?? false} onCheckedChange={v => setModal(prev => ({ ...prev!, published: v }))} />
              <Label className="font-body text-sm">Published</Label>
            </div>
            <Button variant="gold" className="w-full" disabled={saving} onClick={save}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEvents;
