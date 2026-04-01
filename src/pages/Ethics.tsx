import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LotusIcon from "@/components/LotusIcon";

const Ethics = () => {
  return (
    <div className="min-h-screen bg-cream">
      {/* Gold top border */}
      <div className="h-1 bg-gold w-full" />

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-8">
        <div className="flex items-center gap-3 mb-2">
          <LotusIcon className="text-gold" size={28} />
          <h1 className="text-3xl font-heading text-primary">Ethics &amp; Educational Commitment</h1>
        </div>

        <div className="space-y-6 font-body text-foreground/80 leading-relaxed">
          <p>
            Money Spirit is an educational and spiritual community dedicated to helping individuals
            explore their relationship with money, abundance and personal growth.
          </p>

          <h2 className="text-xl font-heading text-primary pt-2">Education, not financial advice</h2>
          <p>
            All content, workshops, rituals and materials provided through Money Spirit are for
            educational and personal development purposes only. Nothing shared within our community
            constitutes financial advice, investment recommendations, or professional financial
            planning.
          </p>

          <h2 className="text-xl font-heading text-primary pt-2">Our commitment</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>We encourage members to seek qualified financial professionals for specific financial decisions.</li>
            <li>We do not promise specific financial outcomes or returns.</li>
            <li>We respect every member's unique financial situation and cultural background.</li>
            <li>We maintain a safe, inclusive space for exploring one's relationship with money and abundance.</li>
            <li>We are transparent about pricing and what our memberships include.</li>
          </ul>

          <h2 className="text-xl font-heading text-primary pt-2">Member responsibility</h2>
          <p>
            Members are responsible for their own financial decisions. Any actions taken based on
            discussions, content or exercises within Money Spirit are at the individual's own
            discretion and risk.
          </p>
        </div>

        <div className="pt-4">
          <Button variant="gold" asChild>
            <Link to="/">Return Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Ethics;
