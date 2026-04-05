import { useState } from "react";
import { Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import LotusIcon from "@/components/LotusIcon";

const features = {
  monthly: [
    "Full community access",
    "Weekly money rituals",
    "Forum discussions",
    "Member directory",
    "Monthly live events",
  ],
  annual: [
    "Everything in Monthly",
    "Founding Member badge",
    "Priority event access",
  ],
};

const Join = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  };

  const openModal = () => {
    setSubmitted(false);
    setEmail("");
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="py-6 px-6 flex items-center justify-center gap-2.5">
        <LotusIcon className="text-accent" size={28} />
        <span className="text-primary font-heading text-xl tracking-wide">Money Spirit</span>
      </header>

      <main className="max-w-[860px] mx-auto px-6 pb-20">
        {/* Hero */}
        <section className="text-center pt-8 pb-14">
          <h1 className="text-4xl md:text-5xl font-heading text-primary leading-tight mb-4">
            Join the Money Spirit Community
          </h1>
          <p className="text-lg font-body text-muted-foreground max-w-xl mx-auto">
            Inspiration, rituals and sisterhood for your financial wellbeing journey
          </p>
        </section>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-14">
          {/* Monthly */}
          <div className="rounded-2xl border border-border bg-card p-8 flex flex-col">
            <p className="text-sm font-body font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Monthly
            </p>
            <div className="mb-6">
              <span className="text-4xl font-heading text-primary">£19</span>
              <span className="text-muted-foreground font-body ml-1">/ month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {features.monthly.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm font-body text-foreground">
                  <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              onClick={openModal}
              className="w-full bg-accent hover:bg-accent/90 text-white font-body font-semibold py-3 rounded-xl"
            >
              Start Monthly
            </Button>
            <p className="text-xs text-muted-foreground font-body text-center mt-3">
              Cancel anytime. No lock-in.
            </p>
          </div>

          {/* Annual */}
          <div className="rounded-2xl border-2 border-accent bg-card p-8 flex flex-col shadow-lg relative">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-body font-semibold text-muted-foreground uppercase tracking-wider">
                Annual
              </p>
              <span className="text-xs font-body font-bold text-accent bg-accent/10 px-2.5 py-0.5 rounded-full">
                Best Value
              </span>
            </div>
            <div className="mb-1">
              <span className="text-4xl font-heading text-primary">£149</span>
              <span className="text-muted-foreground font-body ml-1">/ year</span>
            </div>
            <p className="text-sm font-body text-accent font-semibold mb-6">Save £79</p>
            <ul className="space-y-3 mb-8 flex-1">
              {features.annual.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm font-body text-foreground">
                  <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              onClick={openModal}
              className="w-full bg-primary hover:bg-primary/90 text-white font-body font-semibold py-3 rounded-xl"
            >
              Start Annual
            </Button>
            <p className="text-xs text-muted-foreground font-body text-center mt-3">
              Cancel anytime. No lock-in.
            </p>
          </div>
        </div>

        {/* Compliance */}
        <p className="text-xs font-body text-muted-foreground text-center max-w-lg mx-auto leading-relaxed mb-4">
          Money Spirit provides financial education and community, not financial advice.
          Always consult a qualified financial adviser for advice tailored to your situation.
        </p>
        <p className="text-center">
          <Link to="/ethics" className="text-xs font-body text-accent hover:underline">
            Ethics &amp; Education Policy
          </Link>
        </p>
      </main>

      {/* Notify modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-primary text-xl">
              {submitted ? "You're on the list ✨" : "Membership is launching soon"}
            </DialogTitle>
          </DialogHeader>

          {submitted ? (
            <p className="text-sm font-body text-muted-foreground">
              We'll let you know the moment doors open. Thank you for your interest.
            </p>
          ) : (
            <form onSubmit={handleNotify} className="space-y-4">
              <p className="text-sm font-body text-muted-foreground">
                Drop your email to be first to know.
              </p>
              <Input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="ms-input"
              />
              <Button
                type="submit"
                className="w-full bg-accent hover:bg-accent/90 text-white font-body font-semibold rounded-xl"
              >
                Notify Me
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Join;
