import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarDays, MapPin, Globe, Ticket, Sparkles, ArrowLeft,
  Users, Clock, ShieldCheck, AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { sendTicketConfirmation } from "@/lib/email/emailService";
import type { Tables } from "@/integrations/supabase/types";

type Event = Tables<"events">;

const formatPrice = (pence: number) => {
  if (pence === 0) return "Free";
  return `AU$${(pence / 100).toFixed(0)}`;
};

const EventDetail = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [hasTicket, setHasTicket] = useState(false);
  const [hasWaitlist, setHasWaitlist] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [ticketsSold, setTicketsSold] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const isFree = event ? event.price_pence === 0 : false;
  const isPast = event ? new Date(event.event_date) < new Date() : false;
  const isSoldOut = event?.capacity ? ticketsSold >= event.capacity : false;
  const nearlyFull = event?.capacity ? ticketsSold >= event.capacity * 0.8 && !isSoldOut : false;
  const spacesLeft = event?.capacity ? event.capacity - ticketsSold : null;
  const needsConsent = event?.requires_recording_consent ?? false;

  const loadData = useCallback(async () => {
    if (!eventId) return;

    const { data: ev } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .eq("published", true)
      .single();

    if (!ev) { setNotFound(true); setLoading(false); return; }
    setEvent(ev);

    // Tickets sold count
    const { count } = await supabase
      .from("event_tickets")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "active");
    setTicketsSold(count ?? 0);

    // User-specific state
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const [ticketRes, waitlistRes, consentRes] = await Promise.all([
        supabase.from("event_tickets").select("id").eq("event_id", eventId).eq("user_id", user.id).eq("status", "active").maybeSingle(),
        supabase.from("event_waitlist").select("id").eq("event_id", eventId).eq("user_id", user.id).maybeSingle(),
        supabase.from("recording_consents").select("id").eq("event_id", eventId).eq("user_id", user.id).maybeSingle(),
      ]);
      setHasTicket(!!ticketRes.data);
      setHasWaitlist(!!waitlistRes.data);
      setHasConsent(!!consentRes.data);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRegister = async () => {
    if (submitting || !event || !userId) return;
    setSubmitting(true);

    // Check consent first if needed
    if (needsConsent && !hasConsent) {
      const { error: consentErr } = await supabase.from("recording_consents").insert({
        event_id: event.id,
        user_id: userId,
        user_agent: navigator.userAgent,
      });
      if (consentErr) {
        toast.error(consentErr.message);
        setSubmitting(false);
        return;
      }
      setHasConsent(true);
    }

    const { data: ticket, error } = await supabase
      .from("event_tickets")
      .insert({ event_id: event.id, user_id: userId })
      .select("id")
      .single();

    if (error) {
      toast.error(error.message);
    } else {
      setHasTicket(true);
      setTicketsSold(prev => prev + 1);
      toast.success("You're registered!");

      // Send confirmation email
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email && ticket) {
        const { data: prof } = await supabase.from("profiles").select("display_name").eq("user_id", userId).maybeSingle();
        sendTicketConfirmation(
          user.email,
          prof?.display_name ?? "there",
          event.title,
          format(new Date(event.event_date), "EEEE, d MMMM yyyy"),
          event.is_virtual ? "Online event" : (event.location ?? "Location TBA"),
          ticket.id,
        );
      }
    }
    setSubmitting(false);
  };

  const handleWaitlist = async () => {
    if (submitting || !event || !userId) return;
    setSubmitting(true);
    const { error } = await supabase.from("event_waitlist").insert({ event_id: event.id, user_id: userId });
    if (error) { toast.error(error.message); }
    else { setHasWaitlist(true); toast.success("You've been added to the waitlist."); }
    setSubmitting(false);
  };

  const handleConsent = async () => {
    if (submitting || !event || !userId) return;
    setSubmitting(true);
    const { error } = await supabase.from("recording_consents").insert({
      event_id: event.id,
      user_id: userId,
      user_agent: navigator.userAgent,
    });
    if (error) { toast.error(error.message); }
    else { setHasConsent(true); toast.success("Recording consent confirmed."); }
    setSubmitting(false);
  };

  /* ---------- LOADING ---------- */
  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" style={{ background: "rgba(255,255,255,0.22)" }} />
        <Skeleton className="h-48 w-full rounded-xl" style={{ background: "rgba(255,255,255,0.22)" }} />
        <Skeleton className="h-6 w-64" style={{ background: "rgba(255,255,255,0.22)" }} />
      </div>
    );
  }

  /* ---------- NOT FOUND ---------- */
  if (notFound || !event) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto">
        <EmptyState icon={CalendarDays} heading="Event not found" body="This event doesn't exist or has been removed." ctaLabel="Back to Events" onCta={() => navigate("/events")} />
      </div>
    );
  }

  /* ---------- CTA LOGIC ---------- */
  const renderCTA = () => {
    if (isPast) {
      return (
        <div className="ss-card" style={{ padding: "16px 20px", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-3)" }}>This event has already taken place.</p>
        </div>
      );
    }

    if (hasTicket) {
      return (
        <div className="ss-card" style={{ padding: "20px 24px" }}>
          <div className="flex items-center gap-2 mb-3">
            <Ticket size={18} style={{ color: "var(--gold-base)" }} />
            <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 400, color: "var(--text-1)" }}>You're registered</span>
          </div>
          {event.is_virtual && event.virtual_link && (
            <div className="mt-3">
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-3)", marginBottom: 6 }}>Joining link:</p>
              <a href={event.virtual_link} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--gold-base)", textDecoration: "underline", wordBreak: "break-all" }}>
                {event.virtual_link}
              </a>
            </div>
          )}
          {needsConsent && !hasConsent && (
            <div className="mt-4">
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-3)", marginBottom: 8 }}>
                This event will be recorded. Please confirm your consent to continue.
              </p>
              <Button variant="gold" size="sm" className="btn-gold" disabled={submitting} onClick={handleConsent}>
                {submitting ? "Confirming…" : "Confirm recording consent"}
              </Button>
            </div>
          )}
          {needsConsent && hasConsent && (
            <p className="mt-3 flex items-center gap-1.5" style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--gold-base)" }}>
              <ShieldCheck size={14} /> Recording consent confirmed
            </p>
          )}
        </div>
      );
    }

    // Free event — register
    if (isFree) {
      if (isSoldOut) {
        return (
          <div className="space-y-3">
            <div className="ss-card" style={{ padding: "16px 20px", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#f59e0b" }}>This event is sold out.</p>
            </div>
            {event.waitlist_enabled && !hasWaitlist && (
              <Button variant="gold" className="btn-gold w-full" disabled={submitting} onClick={handleWaitlist}>
                {submitting ? "Joining…" : "Join the waitlist"}
              </Button>
            )}
            {hasWaitlist && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--gold-base)", textAlign: "center" }}>✓ You're on the waitlist</p>
            )}
          </div>
        );
      }

      // Consent gate for free events
      if (needsConsent && !hasConsent) {
        return (
          <div className="ss-card space-y-3" style={{ padding: "20px 24px" }}>
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" style={{ color: "#f59e0b" }} />
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
                This event will be recorded. By registering, you consent to being recorded.
              </p>
            </div>
            <Button variant="gold" className="btn-gold w-full" disabled={submitting} onClick={handleRegister}>
              {submitting ? "Registering…" : "I consent — Register now"}
            </Button>
          </div>
        );
      }

      return (
        <Button variant="gold" className="btn-gold w-full" disabled={submitting} onClick={handleRegister}>
          {submitting ? "Registering…" : "Get your free ticket"}
        </Button>
      );
    }

    // Paid event — pre-Stripe placeholder
    if (hasWaitlist) {
      return (
        <div className="ss-card" style={{ padding: "16px 20px", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--gold-base)" }}>✓ Interest registered — we'll be in touch with payment details soon.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="ss-card" style={{ padding: "16px 20px" }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-3)", lineHeight: 1.5 }}>
            Ticket sales opening soon. Register your interest and we'll notify you when booking opens.
          </p>
        </div>
        <Button variant="gold" className="btn-gold w-full" disabled={submitting} onClick={handleWaitlist}>
          {submitting ? "Submitting…" : "Register your interest"}
        </Button>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto space-y-6 ss-appear">
      <SEOHead title={`${event.title} — Money Spirit Events`} />

      {/* Breadcrumb */}
      <button
        onClick={() => navigate("/events")}
        className="flex items-center gap-1.5 transition-colors"
        style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-3)" }}
        onMouseEnter={e => (e.currentTarget.style.color = "var(--gold-base)")}
        onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
      >
        <ArrowLeft size={14} /> Events
      </button>

      {/* Hero banner */}
      <div className="rounded-xl overflow-hidden" style={{
        background: "linear-gradient(145deg, rgba(17,32,54,0.90), rgba(6,12,24,0.95))",
        padding: "clamp(28px, 5vw, 48px) clamp(16px, 4vw, 32px)",
        textAlign: "center",
      }}>
        <Sparkles className="mx-auto mb-4" size={32} style={{ color: "rgba(224,176,64,0.3)" }} />
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 300, color: "var(--text-1)", letterSpacing: "-0.03em" }}>
          {event.title}
        </h1>
      </div>

      {/* Meta info */}
      <div className="ss-card" style={{ padding: "20px 24px" }}>
        <div className="space-y-3">
          <div className="flex items-center gap-3" style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-2)" }}>
            <CalendarDays size={16} style={{ color: "var(--gold-base)" }} />
            {format(new Date(event.event_date), "EEEE d MMMM yyyy · h:mm a")}
          </div>
          <div className="flex items-center gap-3" style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-2)" }}>
            {event.is_virtual ? (
              <><Globe size={16} style={{ color: "var(--gold-base)" }} /> Online event</>
            ) : (
              <><MapPin size={16} style={{ color: "var(--gold-base)" }} /> {event.location ?? "Location TBA"}</>
            )}
          </div>
          <div className="flex items-center gap-3" style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-2)" }}>
            <Ticket size={16} style={{ color: "var(--gold-base)" }} />
            {formatPrice(event.price_pence)}
          </div>
          {event.capacity && (
            <div className="flex items-center gap-3" style={{ fontFamily: "var(--font-body)", fontSize: 14, color: isSoldOut ? "#f59e0b" : nearlyFull ? "#f59e0b" : "var(--text-2)" }}>
              <Users size={16} style={{ color: isSoldOut || nearlyFull ? "#f59e0b" : "var(--gold-base)" }} />
              {isSoldOut ? "Sold out" : nearlyFull ? `Only ${spacesLeft} spaces left` : `${spacesLeft} spaces available`}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {event.description && (
        <div className="ss-card" style={{ padding: "20px 24px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 400, color: "var(--text-1)", marginBottom: 12 }}>About this event</h2>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-2)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {event.description}
          </div>
        </div>
      )}

      {/* CTA section */}
      {renderCTA()}
    </div>
  );
};

export default EventDetail;
