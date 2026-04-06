import { Check } from "lucide-react";

const rows = [
  { feature: "Community feed", guest: "Read only", member: true },
  { feature: "Forum discussions", guest: "Titles only", member: true },
  { feature: "Money Rituals", guest: false, member: true },
  { feature: "Courses and Learning", guest: false, member: true },
  { feature: "Member Directory", guest: "Browse", member: true },
  { feature: "Events", guest: "Browse", member: "Browse and buy tickets" },
  { feature: "Pathway Dashboard", guest: false, member: true },
  { feature: "Weekly ritual emails", guest: false, member: true },
  { feature: "Member badge", guest: false, member: "Founding Member badge" },
];

const AccessCell = ({ value }: { value: boolean | string }) => {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gold/15">
        <Check className="h-3.5 w-3.5 text-gold" />
      </span>
    );
  }
  if (value === false) {
    return <span className="inline-block w-4 h-0.5 rounded bg-muted-foreground/30" />;
  }
  return <span className="font-body text-sm italic text-navy/60">{value}</span>;
};

const JoinComparisonTable = () => (
  <section className="max-w-3xl mx-auto mb-14 animate-fade-in">
    <div className="text-center mb-10">
      <h2 className="font-heading text-4xl text-primary mb-3">
        Everything you get when you join
      </h2>
      <p className="font-body text-muted-foreground">
        Start free. Go deeper when you are ready.
      </p>
    </div>

    <div className="rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-3">
        <div className="px-5 py-4 bg-cream font-heading text-sm text-primary">
          What you get
        </div>
        <div className="px-5 py-4 bg-cream text-center">
          <p className="font-body text-sm font-bold text-primary">Guest</p>
          <p className="font-body text-xs text-gold">Always free</p>
        </div>
        <div className="px-5 py-4 bg-navy text-center">
          <p className="font-body text-sm font-bold text-cream">Member</p>
          <p className="font-body text-xs text-gold">AU$19/month</p>
        </div>
      </div>

      {/* Rows */}
      {rows.map((row, i) => (
        <div
          key={row.feature}
          className={`grid grid-cols-3 border-t border-[#E8E4DC] ${
            i % 2 === 0 ? "bg-cream" : "bg-[#F2EEE8]"
          }`}
        >
          <div className="px-5 py-3.5 font-body text-sm text-primary">
            {row.feature}
          </div>
          <div className="px-5 py-3.5 flex items-center justify-center">
            <AccessCell value={row.guest} />
          </div>
          <div className="px-5 py-3.5 flex items-center justify-center">
            <AccessCell value={row.member} />
          </div>
        </div>
      ))}
    </div>

    <p className="text-center font-body text-sm italic text-muted-foreground mt-6">
      No lock-in. Cancel anytime. Your community stays with you.
    </p>
  </section>
);

export default JoinComparisonTable;
