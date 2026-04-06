import { Button } from "@/components/ui/button";
import { REFERRAL_LINKS } from "@/lib/referralLinks";

const services = [
  {
    name: "Wise",
    icon: "W",
    tagline: "Best for bank-to-bank transfers.",
    fee: "Low fixed fee at mid-market rate",
    speed: "1 to 2 business days",
    link: REFERRAL_LINKS.wise,
    cta: "Send with Wise",
  },
  {
    name: "Remitly",
    icon: "R",
    tagline: "Best for fast cash pickup.",
    fee: "First transfer often free",
    speed: "Minutes to hours",
    link: REFERRAL_LINKS.remitly,
    cta: "Send with Remitly",
  },
];

const ComparisonCards = () => {
  return (
    <section className="my-12">
      <div className="grid gap-6 sm:grid-cols-2">
        {services.map((s, i) => (
          <div
            key={s.name}
            className="rounded-lg border border-border bg-white p-6 animate-slide-up"
            style={{ animationDelay: `${i * 100}ms`, animationFillMode: "both" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 font-heading text-xl text-gold font-semibold">
                {s.icon}
              </span>
              <h3 className="font-heading text-lg text-navy">{s.name}</h3>
            </div>

            <p className="font-body text-sm font-medium text-gold mb-3">{s.tagline}</p>

            <dl className="space-y-2 mb-5">
              <div>
                <dt className="font-body text-xs text-navy/50">Typical fee</dt>
                <dd className="font-body text-sm text-navy/70">{s.fee}</dd>
              </div>
              <div>
                <dt className="font-body text-xs text-navy/50">Speed</dt>
                <dd className="font-body text-sm text-navy/70">{s.speed}</dd>
              </div>
            </dl>

            <Button asChild className="w-full bg-navy text-white hover:bg-gold hover:text-white font-body">
              <a href={s.link} target="_blank" rel="noopener noreferrer">
                {s.cta}
              </a>
            </Button>
          </div>
        ))}
      </div>

      <p className="font-body text-xs italic text-navy/50 mt-4 max-w-2xl">
        Money Spirit may earn a small referral fee when you use these links at no extra cost to you. We only recommend services we trust.
      </p>
    </section>
  );
};

export default ComparisonCards;
