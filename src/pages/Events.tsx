import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarDays, MapPin, Globe, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location_name: string | null;
  is_virtual: boolean;
  price_pence: number;
  capacity: number | null;
  stripe_price_id: string | null;
}

const formatPrice = (pence: number) => {
  if (pence === 0) return "Free";
  return `A$${(pence / 100).toFixed(0)}`;
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
        .select("id, title, description, event_date, location_name, is_virtual, price_pence, capacity, stripe_price_id")
        .eq("published", true)
        .order("event_date", { ascending: true });

      setEvents((data as Event[]) ?? []);

      // Load user's existing tickets
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: tickets } = await supabase
          .from("event_tickets")
          .select("event_id")
          .eq("user_id", user.id)
          .eq("status", "active");
        setTicketedIds(new Set((tickets ?? []).map((t: any) => t.event_id)));
      }

      setLoading(false);
    };
    load();
  }, []);

  const claimFreeTicket = async (eventId: string) => {
    setClaimingId(eventId);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Please sign in", description: "You need an account to get a ticket.", variant: "destructive" });
      setClaimingId(null);
      return;
    }

    const { error } = await supabase.from("event_tickets").insert({
      event_id: eventId,
      user_id: user.id,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setTicketedIds((prev) => new Set(prev).add(eventId));
      toast({ title: "Ticket confirmed!", description: "You're all set." });
    }
    setClaimingId(null);
  };

  const handleGetTicket = (event: Event) => {
    if (event.price_pence === 0) {
      claimFreeTicket(event.id);
    } else {
      toast({ title: "Coming soon", description: "Paid ticket checkout will be available shortly." });
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-heading text-primary mb-6">Events</h1>
        <p className="text-muted-foreground font-body">Loading events…</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-heading text-primary mb-2">Events</h1>
      <p className="text-muted-foreground font-body mb-8">Workshops, circles and gatherings for the community.</p>

      {events.length === 0 ? (
        <div className="text-center py-16">
          <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground font-body">No upcoming events right now. Check back soon!</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {events.map((event) => {
            const hasTicket = ticketedIds.has(event.id);
            return (
              <div
                key={event.id}
                className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Cover placeholder */}
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
                    {event.is_virtual ? (
                      <>
                        <Globe className="h-4 w-4 text-accent" />
                        Online event
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4 text-accent" />
                        {event.location_name ?? "Location TBA"}
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-lg font-heading font-bold text-accent">
                      {formatPrice(event.price_pence)}
                    </span>

                    {hasTicket ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-body font-semibold text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
                        <Ticket className="h-4 w-4" /> Ticket confirmed
                      </span>
                    ) : (
                      <Button
                        variant="gold"
                        size="sm"
                        disabled={claimingId === event.id}
                        onClick={() => handleGetTicket(event)}
                      >
                        {claimingId === event.id ? "Claiming…" : "Get your ticket"}
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
