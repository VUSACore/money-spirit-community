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
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location_name: string | null;
  is_virtual: boolean;
  price_pence: number;
  capacity: number | null;
  published: boolean;
}

const AdminEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState<Date | undefined>();
  const [locationName, setLocationName] = useState("");
  const [isVirtual, setIsVirtual] = useState(false);
  const [priceAud, setPriceAud] = useState("");
  const [capacity, setCapacity] = useState("");
  const [published, setPublished] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("events")
      .select("id, title, description, event_date, location_name, is_virtual, price_pence, capacity, published")
      .order("event_date", { ascending: false });
    setEvents((data as Event[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setTitle(""); setDescription(""); setEventDate(undefined);
    setLocationName(""); setIsVirtual(false); setPriceAud(""); setCapacity(""); setPublished(false);
  };

  const handleCreate = async () => {
    if (!title || !eventDate) {
      toast({ title: "Missing fields", description: "Title and date are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const pricePence = Math.round((parseFloat(priceAud) || 0) * 100);
    const { error } = await supabase.from("events").insert({
      title,
      description,
      event_date: eventDate.toISOString(),
      location_name: locationName || null,
      is_virtual: isVirtual,
      price_pence: pricePence,
      capacity: capacity ? parseInt(capacity) : null,
      published,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Event created" });
      resetForm();
      load();
    }
    setSaving(false);
  };

  const formatPrice = (pence: number) => pence === 0 ? "Free" : `A$${(pence / 100).toFixed(0)}`;

  return (
    <div>
      <h2 className="text-2xl font-heading text-primary mb-6">Events</h2>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4 mb-8 max-w-2xl">
        <h3 className="font-heading text-lg text-primary">Create Event</h3>

        <div>
          <Label className="font-body text-sm">Title</Label>
          <Input className="ms-input mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label className="font-body text-sm">Description</Label>
          <Textarea className="ms-input mt-1" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <Label className="font-body text-sm">Event Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-[240px] justify-start text-left font-normal mt-1", !eventDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {eventDate ? format(eventDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={eventDate} onSelect={setEventDate} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="font-body text-sm">Location</Label>
            <Input className="ms-input mt-1" value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="e.g. Sydney CBD" />
          </div>
          <div className="flex items-end gap-3 pb-1">
            <Switch checked={isVirtual} onCheckedChange={setIsVirtual} />
            <Label className="font-body text-sm">Virtual event</Label>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="font-body text-sm">Price (A$)</Label>
            <Input className="ms-input mt-1" type="number" min="0" step="1" value={priceAud} onChange={(e) => setPriceAud(e.target.value)} placeholder="0 = Free" />
          </div>
          <div>
            <Label className="font-body text-sm">Capacity</Label>
            <Input className="ms-input mt-1" type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Leave blank for unlimited" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={published} onCheckedChange={setPublished} />
          <Label className="font-body text-sm">Publish immediately</Label>
        </div>
        <Button variant="gold" disabled={saving} onClick={handleCreate}>
          {saving ? "Creating…" : "Create Event"}
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground font-body">Loading…</p>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <div key={e.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
              <div>
                <h4 className="font-heading text-primary">{e.title}</h4>
                <p className="text-xs text-muted-foreground font-body">
                  {format(new Date(e.event_date), "d MMM yyyy")} · {formatPrice(e.price_pence)} · {e.published ? "Published" : "Draft"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
