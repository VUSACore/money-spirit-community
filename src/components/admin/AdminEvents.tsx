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
import { CalendarIcon, Plus, Pencil, ChevronDown, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import EmptyState from "@/components/EmptyState";
import type { Tables } from "@/integrations/supabase/types";

type EventRow = Tables<"events"> & { tickets_sold?: number };
type Attendee = { display_name: string; user_id: string; purchased_at: string; status: string };

const logAudit = async (action: string, targetId: string, metadata: Record<string, unknown> = {}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("audit_logs").insert({
    action, actor_id: user.id, target_type: "event", target_id: targetId, metadata: metadata as any,
  });
};

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
    if (userIds.length === 0) { setAttendees(prev => ({ ...prev, [eventId]: [] })); return; }
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
    if (!e.published) return { label: "Draft", cls: "bg-muted text-muted-foreground" };
    const now = new Date();
    const date = new Date(e.event_date);
    if (date < now) return { label: "Past", cls: "bg-muted text-muted-foreground" };
    if (e.capacity && (e.tickets_sold || 0) >= e.capacity) return { label: "Sold Out", cls: "bg-destructive/15 text-destructive" };
    return { label: "Live", cls: "bg-teal-500/15 text-teal-400" };
  };

  const formatPrice = (pence: number) => pence === 0 ? "Free" : `A$${(pence / 100).toFixed(0)}`;

  const openNew = () => {
    setModal({
      title: "", description: "", published: false, price_pence: 0,
      is_virtual: false, waitlist_enabled: false, requires_recording_consent: false,
      virtual_link: "", location: "", capacity: null,
    });
  };

  const openEdit = (e: EventRow) => setModal(e);

  const save = async () => {
    if (!modal?.title?.trim()) {
      toast({ title: "Title required", variant: "destructive" }); return;
    }
    if (!modal?.event_date) {
      toast({ title: "Event date required", variant: "destructive" }); return;
    }
    if (modal.is_virtual && !modal.location && !modal.virtual_link) {
      // Allow but warn
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const payload = {
      title: modal.title!.trim(),
      description: modal.description?.trim() || null,
      event_date: typeof modal.event_date === "string" ? modal.event_date : new Date(modal.event_date).toISOString(),
      location: modal.location?.trim() || null,
      virtual_link: modal.virtual_link?.trim() || null,
      is_virtual: modal.is_virtual ?? false,
      price_pence: modal.price_pence ?? 0,
      capacity: modal.capacity || null,
      published: modal.published ?? false,
      waitlist_enabled: modal.waitlist_enabled ?? false,
      requires_recording_consent: modal.requires_recording_consent ?? false,
    };

    const isEdit = !!modal.id;
    if (isEdit) {
      const { error } = await supabase.from("events").update(payload).eq("id", modal.id!);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSaving(false); return; }
      await logAudit("event_update", modal.id!, { title: modal.title, published: modal.published });
      toast({ title: "Event updated" });
    } else {
      const { data, error } = await supabase.from("events").insert({ ...payload, created_by: user.id }).select("id").single();
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSaving(false); return; }
      await logAudit("event_create", data.id, { title: modal.title });
      toast({ title: "Event created" });
    }
    setSaving(false);
    setModal(null);
    load();
  };

  const togglePublish = async (e: EventRow) => {
    const { error } = await supabase.from("events").update({ published: !e.published }).eq("id", e.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setEvents(prev => prev.map(x => x.id === e.id ? { ...x, published: !e.published } : x));
    await logAudit(e.published ? "event_unpublish" : "event_publish", e.id, { title: e.title });
    toast({ title: e.published ? "Event unpublished" : "Event published" });
  };

  if (loading) return <p className="text-muted-foreground font-body">Loading events…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 300, color: "var(--text-1)", letterSpacing: "-0.03em" }}>Events</h2>
        <Button variant="gold" onClick={openNew}><Plus size={16} /> New Event</Button>
      </div>

      {events.length === 0 ? (
        <EmptyState icon={Plus} iconClassName="text-gold" heading="No events yet" body="Create your first event to get started." />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-body w-8" />
                <TableHead className="font-body">Title</TableHead>
                <TableHead className="font-body">Date</TableHead>
                <TableHead className="font-body">Type</TableHead>
                <TableHead className="font-body">Price</TableHead>
                <TableHead className="font-body">Capacity</TableHead>
                <TableHead className="font-body">Sold</TableHead>
                <TableHead className="font-body">Status</TableHead>
                <TableHead className="font-body w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map(e => {
                const st = getStatus(e);
                return (
                  <>
                    <TableRow key={e.id}>
                      <TableCell>
                        <button onClick={() => toggleExpand(e.id)} className="text-muted-foreground hover:text-foreground">
                          {expanded === e.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      </TableCell>
                      <TableCell className="font-body font-medium">{e.title}</TableCell>
                      <TableCell className="font-body text-sm">{format(new Date(e.event_date), "d MMM yyyy")}</TableCell>
                      <TableCell className="font-body text-sm text-muted-foreground">{e.is_virtual ? "Virtual" : "In-person"}</TableCell>
                      <TableCell className="font-body text-sm">{formatPrice(e.price_pence)}</TableCell>
                      <TableCell className="font-body text-sm text-muted-foreground">{e.capacity || "∞"}</TableCell>
                      <TableCell className="font-body text-sm">{e.tickets_sold}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-body ${st.cls}`}>
                            {st.label === "Live" && <Check size={10} />}
                            {st.label}
                          </span>
                          <Switch checked={e.published} onCheckedChange={() => togglePublish(e)} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(e)}><Pencil size={14} /></Button>
                      </TableCell>
                    </TableRow>
                    {expanded === e.id && (
                      <TableRow key={`${e.id}-att`}>
                        <TableCell colSpan={9} className="bg-muted/30 p-4">
                          <div className="flex items-center gap-4 mb-3 flex-wrap">
                            <h4 className="font-heading text-sm text-primary">Attendees ({(attendees[e.id] || []).length})</h4>
                            {e.waitlist_enabled && <span className="text-xs font-body text-muted-foreground">Waitlist enabled</span>}
                            {e.requires_recording_consent && <span className="text-xs font-body text-muted-foreground">Consent required</span>}
                          </div>
                          {(attendees[e.id] || []).length === 0 ? (
                            <p className="text-sm text-muted-foreground font-body">No registrations yet</p>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="font-body text-xs">Name</TableHead>
                                  <TableHead className="font-body text-xs">Registered</TableHead>
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
      )}

      {/* Event Form Modal */}
      <Dialog open={!!modal} onOpenChange={open => !open && setModal(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-primary">{modal?.id ? "Edit Event" : "New Event"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="font-body text-sm">Title *</Label>
              <Input className="ms-input mt-1" value={modal?.title || ""} onChange={e => setModal(prev => ({ ...prev!, title: e.target.value }))} placeholder="e.g. Sacred Money Circle" />
            </div>
            <div>
              <Label className="font-body text-sm">Description</Label>
              <Textarea className="ms-input mt-1" rows={3} value={modal?.description || ""} onChange={e => setModal(prev => ({ ...prev!, description: e.target.value }))} />
            </div>
            <div>
              <Label className="font-body text-sm">Event Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal mt-1", !modal?.event_date && "text-muted-foreground")}>
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

            {/* Location / Virtual */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-body text-sm">{modal?.is_virtual ? "Platform / Notes" : "Location"}</Label>
                <Input className="ms-input mt-1" value={modal?.location || ""} onChange={e => setModal(prev => ({ ...prev!, location: e.target.value }))} placeholder={modal?.is_virtual ? "e.g. Zoom" : "e.g. Sydney CBD"} />
              </div>
              <div className="flex items-end gap-3 pb-1">
                <Switch checked={modal?.is_virtual ?? false} onCheckedChange={v => setModal(prev => ({ ...prev!, is_virtual: v }))} />
                <Label className="font-body text-sm">Virtual</Label>
              </div>
            </div>

            {modal?.is_virtual && (
              <div>
                <Label className="font-body text-sm">Virtual Link</Label>
                <Input className="ms-input mt-1" value={modal?.virtual_link || ""} onChange={e => setModal(prev => ({ ...prev!, virtual_link: e.target.value }))} placeholder="https://zoom.us/j/..." />
                <p className="text-xs font-body text-muted-foreground mt-1">Shown to registered attendees only</p>
              </div>
            )}

            {/* Pricing / Capacity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-body text-sm">Price (cents AUD)</Label>
                <Input className="ms-input mt-1" type="number" min={0} value={modal?.price_pence ?? 0} onChange={e => setModal(prev => ({ ...prev!, price_pence: parseInt(e.target.value) || 0 }))} />
                <p className="text-xs font-body text-muted-foreground mt-1">{formatPrice(modal?.price_pence ?? 0)}</p>
              </div>
              <div>
                <Label className="font-body text-sm">Capacity</Label>
                <Input className="ms-input mt-1" type="number" min={0} value={modal?.capacity ?? ""} onChange={e => setModal(prev => ({ ...prev!, capacity: parseInt(e.target.value) || null }))} placeholder="Unlimited" />
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3 pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
              <div className="flex items-center gap-3">
                <Switch checked={modal?.published ?? false} onCheckedChange={v => setModal(prev => ({ ...prev!, published: v }))} />
                <Label className="font-body text-sm">Published</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={modal?.waitlist_enabled ?? false} onCheckedChange={v => setModal(prev => ({ ...prev!, waitlist_enabled: v }))} />
                <Label className="font-body text-sm">Waitlist enabled</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={modal?.requires_recording_consent ?? false} onCheckedChange={v => setModal(prev => ({ ...prev!, requires_recording_consent: v }))} />
                <Label className="font-body text-sm">Requires recording consent</Label>
              </div>
            </div>

            <Button variant="gold" className="w-full" disabled={saving || !modal?.title?.trim() || !modal?.event_date} onClick={save}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEvents;