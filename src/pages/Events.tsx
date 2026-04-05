import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarDays, MapPin, Globe, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import EducationBanner from "@/components/EducationBanner";

type Event = Tables<"events">;

const formatPrice = (pence: number) => {
  if (pence === 0) return "Free";
  return `£${(pence / 100).toFixed(0)}`;
};

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketedIds, setTicketedIds] = useState<Set<string>>(new Set());
  const [interestedIds, setInterestedIds] = useState<Set<string>>(new Set());
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("published", true)
        .order("event_date", { ascending: true });

      setEvents(data ?? []);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: tickets } = await supabase
          .from("event_tickets")
          .select("event_id")
          .eq("user_id", user.id)
          .eq("status", "active");
        setTicketedIds(new Set((tickets ?? []).map((t) => t.event_id)));

        const { data: interests } = await supabase
          .from("event_waitlist")
          .select("event_id")
          .eq("user_id", user.id);
        setInterestedIds(new Set((interests ?? []).map((t) => t.event_id)));
      }

      setLoading(false);
    };
    load();
  }, []);

  const claimFreeTicket = async (eventId: string) => {
    setClaimingId(eventId);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast({ title: "Please sign in", description: "You need an account to get a ticket.", variant: "destructive" }); setClaimingId(null); return; }
    const { error } = await supabase.from("event_tickets").insert({ event_id: eventId, user_id: user.id });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { setTicketedIds((prev) => new Set(prev).add(eventId)); toast({ title: "Ticket confirmed!", description: "You're all set." }); }
    setClaimingId(null);
  };

  const registerInterest = async (eventId: string) => {
    setClaimingId(eventId);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast({ title: "Please sign in", description: "You need an account to register interest.", variant: "destructive" }); setClaimingId(null); return; }
    const { error } = await supabase.from("event_waitlist").insert({ event_id: eventId, user_id: user.id });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { setInterestedIds((prev) => new Set(prev).add(eventId)); toast({ title: "Thanks!", description: "We will be in touch with payment details shortly." }); }
    setClaimingId(null);
  };

  const handleGetTicket = (event: Event) => {
    if (event.price_pence === 0) claimFreeTicket(event.id);
    else registerInterest(event.id);
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <h1 className="text-3xl font-heading text-primary mb-2">Events</h1>
        <p className="text-muted-foreground font-body mb-8">Workshops, circles and gatherings for the community.</p>
        <div className="grid gap-6 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-border overflow-hidden bg-card">
              <Skeleton className="h-40 w-full rounded-none bg-accent/10" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-6 w-3/4 bg-accent/10" />
                <Skeleton className="h-4 w-1/2 bg-accent/10" />
                <Skeleton className="h-4 w-1/3 bg-accent/10" />
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-6 w-16 bg-accent/10" />
                  <Skeleton className="h-9 w-32 rounded-lg bg-accent/10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      <EducationBanner />

      <h1 className="text-3xl font-heading text-primary mb-2">Events</h1>
      <p className="text-muted-foreground font-body mb-8">Workshops, circles and gatherings for the community.</p>

      {events.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <CalendarDays className="mx-auto h-12 w-12 text-accent/60" />
          <p className="text-lg font-body text-muted-foreground">No events scheduled yet. Watch this space.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {events.map((event) => {
            const hasTicket = ticketedIds.has(event.id);
            const hasInterest = interestedIds.has(event.id);
            const isFree = event.price_pence === 0;
            return (
              <div key={event.id} className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow animate-fade-in">
                <div className="h-40 bg-primary flex items-center justify-center">
                  <CalendarDays className="h-12 w-12 text-primary-foreground/30" />
                </div>
                <div className="p-5 space-y-3">
                  <h2 className="text-xl font-heading text-primary leading-tight">{event.title}</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-body">
                    <CalendarDays className="h-4 w-4 text-accent" />
                    {format(new Date(event.event_date), "EEEE d MMMM yyyy")}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-body">
                    {event.is_virtual ? (<><Globe className="h-4 w-4 text-accent" />Online event</>) : (<><MapPin className="h-4 w-4 text-accent" />{event.location ?? "Location TBA"}</>)}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-lg font-heading font-bold text-accent">{formatPrice(event.price_pence)}</span>
                    {hasTicket ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-body font-semibold text-accent bg-accent/10 px-3 py-1.5 rounded-full"><Ticket className="h-4 w-4" /> Ticket confirmed</span>
                    ) : hasInterest ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-body font-semibold text-accent bg-accent/10 px-3 py-1.5 rounded-full">✓ Interest registered</span>
                    ) : (
                      <Button variant="gold" size="sm" disabled={claimingId === event.id} onClick={() => handleGetTicket(event)}>
                        {claimingId === event.id ? "Submitting…" : isFree ? "Get your ticket" : "Register your interest"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Events;
