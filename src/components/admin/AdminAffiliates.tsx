import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Copy, Plus, Loader2, ChevronRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

type Affiliate = {
  id: string;
  name: string;
  code: string;
  discount_percent: number;
  commission_percent: number;
  active: boolean;
  notes: string | null;
  created_at: string;
};

type Referral = {
  id: string;
  user_id: string;
  signed_up_at: string;
  commission_paid: boolean;
  commission_amount_pence: number;
  paid_at: string | null;
  display_name?: string | null;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 32);

const randomSuffix = () => Math.random().toString(36).slice(2, 6);

const buildLink = (code: string) =>
  `${window.location.origin}/register?ref=${encodeURIComponent(code)}`;

const AdminAffiliates = () => {
  const { toast } = useToast();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Affiliate | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [refLoading, setRefLoading] = useState(false);

  // form
  const [fName, setFName] = useState("");
  const [fDiscount, setFDiscount] = useState("10");
  const [fCommission, setFCommission] = useState("20");
  const [fNotes, setFNotes] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("affiliates" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load affiliates", description: error.message, variant: "destructive" });
    } else {
      setAffiliates((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const loadReferrals = async (a: Affiliate) => {
    setRefLoading(true);
    const { data, error } = await supabase
      .from("affiliate_referrals" as any)
      .select("*")
      .eq("affiliate_id", a.id)
      .order("signed_up_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load referrals", description: error.message, variant: "destructive" });
      setReferrals([]);
      setRefLoading(false);
      return;
    }
    const refs = (data as any[]) || [];
    const userIds = refs.map(r => r.user_id);
    let nameMap: Record<string, string> = {};
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);
      (profs || []).forEach((p: any) => { nameMap[p.user_id] = p.display_name; });
    }
    setReferrals(refs.map(r => ({ ...r, display_name: nameMap[r.user_id] || null })));
    setRefLoading(false);
  };

  const openDetail = (a: Affiliate) => {
    setSelected(a);
    loadReferrals(a);
  };

  const handleCreate = async () => {
    if (!fName.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCreating(false); return; }

    let code = `${slugify(fName)}-${randomSuffix()}`;
    const payload = {
      name: fName.trim(),
      code,
      discount_percent: Number(fDiscount) || 0,
      commission_percent: Number(fCommission) || 0,
      notes: fNotes.trim() || null,
      created_by: user.id,
    };

    const { data, error } = await supabase
      .from("affiliates" as any)
      .insert(payload)
      .select()
      .single();

    setCreating(false);
    if (error) {
      toast({ title: "Failed to create affiliate", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Affiliate created" });
    setCreateOpen(false);
    setFName(""); setFDiscount("10"); setFCommission("20"); setFNotes("");
    setAffiliates(prev => [data as any, ...prev]);
  };

  const toggleActive = async (a: Affiliate) => {
    const { error } = await supabase
      .from("affiliates" as any)
      .update({ active: !a.active })
      .eq("id", a.id);
    if (error) {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
      return;
    }
    setAffiliates(prev => prev.map(x => x.id === a.id ? { ...x, active: !a.active } : x));
    if (selected?.id === a.id) setSelected({ ...selected, active: !a.active });
  };

  const updateField = async (a: Affiliate, field: "discount_percent" | "commission_percent", value: number) => {
    const { error } = await supabase
      .from("affiliates" as any)
      .update({ [field]: value })
      .eq("id", a.id);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    setAffiliates(prev => prev.map(x => x.id === a.id ? { ...x, [field]: value } : x));
    if (selected?.id === a.id) setSelected({ ...selected, [field]: value });
    toast({ title: "Saved" });
  };

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(buildLink(code));
    toast({ title: "Link copied" });
  };

  const markPaid = async (r: Referral) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("affiliate_referrals" as any)
      .update({
        commission_paid: !r.commission_paid,
        paid_at: !r.commission_paid ? new Date().toISOString() : null,
        paid_by: !r.commission_paid ? user?.id : null,
      })
      .eq("id", r.id);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    setReferrals(prev => prev.map(x => x.id === r.id ? { ...x, commission_paid: !r.commission_paid } : x));
  };

  const totalCommission = useMemo(
    () => referrals.reduce((sum, r) => sum + (r.commission_amount_pence || 0), 0),
    [referrals]
  );
  const paidCommission = useMemo(
    () => referrals.filter(r => r.commission_paid).reduce((sum, r) => sum + (r.commission_amount_pence || 0), 0),
    [referrals]
  );

  if (loading) return <p className="text-muted-foreground font-body">Loading affiliates…</p>;

  // ---------- DETAIL VIEW ----------
  if (selected) {
    return (
      <div className="max-w-4xl space-y-6">
        <button
          onClick={() => { setSelected(null); setReferrals([]); }}
          className="flex items-center gap-2 text-sm font-body text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft size={14} /> Back to affiliates
        </button>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-heading text-primary">{selected.name}</h2>
              <p className="text-xs font-body text-muted-foreground mt-1">
                Created {format(new Date(selected.created_at), "d MMM yyyy")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-body text-muted-foreground">{selected.active ? "Active" : "Paused"}</span>
              <Switch checked={selected.active} onCheckedChange={() => toggleActive(selected)} />
            </div>
          </div>

          <div className="rounded-lg bg-background/40 border border-border p-3 flex items-center justify-between gap-3">
            <code className="text-xs font-body text-foreground/80 truncate">{buildLink(selected.code)}</code>
            <Button size="sm" variant="ghost" onClick={() => copyLink(selected.code)}>
              <Copy size={14} className="mr-1.5" /> Copy
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-body text-sm">Discount %</Label>
              <Input
                type="number" min={0} max={100} step={0.5}
                className="ms-input mt-1"
                defaultValue={selected.discount_percent}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (v !== selected.discount_percent) updateField(selected, "discount_percent", v);
                }}
              />
            </div>
            <div>
              <Label className="font-body text-sm">Commission %</Label>
              <Input
                type="number" min={0} max={100} step={0.5}
                className="ms-input mt-1"
                defaultValue={selected.commission_percent}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (v !== selected.commission_percent) updateField(selected, "commission_percent", v);
                }}
              />
            </div>
          </div>
        </div>

        {/* Referrals */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-lg text-primary">Referred members</h3>
            <span className="text-xs font-body text-muted-foreground">{referrals.length} total</span>
          </div>

          {refLoading ? (
            <p className="text-sm text-muted-foreground font-body">Loading…</p>
          ) : referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body">No referrals yet. Share the link to start tracking signups.</p>
          ) : (
            <div className="space-y-2">
              {referrals.map(r => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-body text-sm">{r.display_name || "Member"}</p>
                    <p className="font-body text-xs text-muted-foreground">
                      Joined {format(new Date(r.signed_up_at), "d MMM yyyy")}
                      {r.commission_amount_pence > 0 && ` · £${(r.commission_amount_pence / 100).toFixed(2)} commission`}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={r.commission_paid ? "ghost" : "outline"}
                    onClick={() => markPaid(r)}
                  >
                    {r.commission_paid ? (
                      <><CheckCircle2 size={14} className="mr-1.5 text-teal-400" /> Paid</>
                    ) : (
                      "Mark paid"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
            <span className="font-body text-sm text-muted-foreground">Total commission earned</span>
            <div className="text-right">
              <p className="font-heading text-2xl text-gold">£{(totalCommission / 100).toFixed(2)}</p>
              <p className="font-body text-xs text-muted-foreground">£{(paidCommission / 100).toFixed(2)} paid out</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- LIST VIEW ----------
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading text-primary">Affiliates</h2>
        <Button variant="gold" onClick={() => setCreateOpen(true)}>
          <Plus size={14} className="mr-1.5" /> New affiliate
        </Button>
      </div>

      <p className="text-sm font-body text-muted-foreground">
        Create unique referral links for partners and companies. Each link tracks signups and the commission earned.
        Discount and commission percentages will be applied to monthly subscriptions once Stripe billing is connected.
      </p>

      {affiliates.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="font-body text-sm text-muted-foreground">No affiliates yet. Create your first one to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {affiliates.map(a => (
            <button
              key={a.id}
              onClick={() => openDetail(a)}
              className="w-full text-left rounded-xl border border-border bg-card p-5 hover:border-gold/40 transition-colors flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-heading text-lg text-primary truncate">{a.name}</p>
                  {!a.active && (
                    <span className="text-[10px] uppercase tracking-wider font-body text-muted-foreground border border-border rounded px-1.5 py-0.5">
                      Paused
                    </span>
                  )}
                </div>
                <p className="font-body text-xs text-muted-foreground mt-1 truncate">
                  {a.discount_percent}% discount · {a.commission_percent}% commission · code: {a.code}
                </p>
              </div>
              <ChevronRight size={18} className="text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">New affiliate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="font-body text-sm">Name (company or person) *</Label>
              <Input
                className="ms-input mt-1"
                placeholder="e.g. Sacred Wealth Co."
                value={fName}
                onChange={(e) => setFName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-body text-sm">Discount %</Label>
                <Input
                  type="number" min={0} max={100} step={0.5}
                  className="ms-input mt-1"
                  value={fDiscount}
                  onChange={(e) => setFDiscount(e.target.value)}
                />
              </div>
              <div>
                <Label className="font-body text-sm">Commission %</Label>
                <Input
                  type="number" min={0} max={100} step={0.5}
                  className="ms-input mt-1"
                  value={fCommission}
                  onChange={(e) => setFCommission(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label className="font-body text-sm">Notes (optional)</Label>
              <Textarea
                className="ms-input mt-1"
                rows={2}
                value={fNotes}
                onChange={(e) => setFNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="gold" disabled={creating} onClick={handleCreate}>
              {creating ? <><Loader2 size={14} className="animate-spin mr-1.5" /> Creating…</> : "Create affiliate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAffiliates;
