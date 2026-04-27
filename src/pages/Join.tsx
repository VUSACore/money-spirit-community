import { useState } from "react";
import SEOHead from "@/components/SEOHead";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import EthicsFooter from "@/components/EthicsFooter";
import JoinComparisonTable from "@/components/JoinComparisonTable";

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
    <div className="min-h-screen flex flex-col" style={{ background: '#005eb8' }}>
      <SEOHead title="Join Money Spirit — Your Financial Wellbeing Journey Starts Here" description="Become a member of Money Spirit. Access weekly money rituals, expert courses, live events and a community of migrant women building financial wellbeing." ogTitle="Join Money Spirit" ogDescription="Become a member of Money Spirit. Access weekly money rituals, expert courses, live events and a community of migrant women building financial wellbeing." />
      <header className="py-6 px-6 flex items-center justify-center gap-2.5">
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: '#C4973A', fontWeight: 700 }}>Money Spirit</span>
      </header>

      <main className="flex-1 max-w-[860px] mx-auto px-6 pb-12">
        <section className="text-center pt-8 pb-14">
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 300, color: '#F2EAD8', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '16px',
          }}>
            Join the Money Spirit Community
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#A08B62', maxWidth: '500px', margin: '0 auto' }}>
            Rituals, learning, and sisterhood for your financial wellbeing journey
          </p>
        </section>

        <JoinComparisonTable />

        <div className="grid md:grid-cols-2 gap-6 mb-14">
          <div className="ss-card flex flex-col">
            <p style={{ fontSize: '11px', fontFamily: 'var(--font-body)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#A08B62', marginBottom: '4px' }}>Monthly</p>
            <div className="mb-6">
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '40px', fontWeight: 400, color: '#F2EAD8' }}>AU$19</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#5C4E34', marginLeft: '6px' }}>/ month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {features.monthly.map((f) => (
                <li key={f} className="flex items-start gap-2.5" style={{ fontSize: '14px', fontFamily: 'var(--font-body)', color: '#D4C49A' }}>
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#C4973A' }} /> {f}
                </li>
              ))}
            </ul>
            <Button onClick={openModal} variant="gold" className="w-full btn-gold">Start Monthly</Button>
            <p style={{ fontSize: '12px', fontFamily: 'var(--font-body)', color: '#5C4E34', textAlign: 'center', marginTop: '12px' }}>Cancel anytime. No lock-in.</p>
          </div>

          <div className="ss-elevated flex flex-col" style={{ border: '1px solid rgba(196,151,58,0.35)' }}>
            <div className="flex items-center gap-2 mb-1">
              <p style={{ fontSize: '11px', fontFamily: 'var(--font-body)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#A08B62' }}>Annual</p>
              <span style={{
                fontSize: '11px', fontFamily: 'var(--font-body)', fontWeight: 600, color: '#EEC96E',
                background: 'rgba(196,151,58,0.12)', border: '1px solid rgba(196,151,58,0.25)',
                borderRadius: 'var(--r-pill)', padding: '2px 10px',
              }}>Best Value</span>
            </div>
            <div className="mb-1">
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '40px', fontWeight: 400, color: '#F2EAD8' }}>AU$149</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#5C4E34', marginLeft: '6px' }}>/ year</span>
            </div>
            <p style={{ fontSize: '13px', fontFamily: 'var(--font-body)', fontWeight: 500, color: '#EEC96E', marginBottom: '24px' }}>Save AU$79</p>
            <ul className="space-y-3 mb-8 flex-1">
              {features.annual.map((f) => (
                <li key={f} className="flex items-start gap-2.5" style={{ fontSize: '14px', fontFamily: 'var(--font-body)', color: '#D4C49A' }}>
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#C4973A' }} /> {f}
                </li>
              ))}
            </ul>
            <Button onClick={openModal} variant="gold" className="w-full btn-gold">Start Annual</Button>
            <p style={{ fontSize: '12px', fontFamily: 'var(--font-body)', color: '#5C4E34', textAlign: 'center', marginTop: '12px' }}>Cancel anytime. No lock-in.</p>
          </div>
        </div>

        <p style={{ fontSize: '12px', fontFamily: 'var(--font-body)', color: '#5C4E34', textAlign: 'center', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
          Money Spirit provides financial education and community, not financial advice. Always consult a qualified financial adviser for advice tailored to your situation.
        </p>
        <p className="text-center mt-3">
          <Link to="/ethics" style={{ fontSize: '12px', fontFamily: 'var(--font-body)', color: '#C4973A', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Ethics &amp; Education Policy</Link>
        </p>
      </main>

      <EthicsFooter />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 400, color: '#F2EAD8' }}>
              {submitted ? "You're on the list ✨" : "Membership is launching soon"}
            </DialogTitle>
          </DialogHeader>
          {submitted ? (
            <p style={{ fontSize: '14px', fontFamily: 'var(--font-body)', color: '#A08B62' }}>We'll let you know the moment doors open. Thank you for your interest.</p>
          ) : (
            <form onSubmit={handleNotify} className="space-y-4">
              <p style={{ fontSize: '14px', fontFamily: 'var(--font-body)', color: '#A08B62' }}>Drop your email to be first to know.</p>
              <input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="ms-input-dark" />
              <Button type="submit" variant="gold" className="w-full btn-gold">Notify Me</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Join;
