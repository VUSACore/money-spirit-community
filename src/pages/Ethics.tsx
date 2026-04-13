import PublicPageLayout from "@/components/PublicPageLayout";
import SEOHead from "@/components/SEOHead";

const Ethics = () => (
  <PublicPageLayout>
    <SEOHead title="Our Ethics Commitment — Money Spirit" description="Money Spirit provides financial education only — not financial advice. Read our full ethics commitment here." />
    <h1 className="text-3xl font-heading text-foreground mb-8">Our Ethics &amp; Education Commitment</h1>

    <div className="space-y-6 font-body text-muted-foreground leading-relaxed">
      <p>
        Money Spirit provides financial education, community support and inspiration — not financial advice.
      </p>
      <p>
        All content on this platform is for educational and general information purposes only. It does not take into account your personal financial situation, objectives or needs.
      </p>
      <p>
        Before making any financial decision, we encourage you to seek advice from a qualified financial adviser who holds an Australian Financial Services (AFS) licence, as required under the Corporations Act 2001 (Cth).
      </p>
      <p>
        Money Spirit does not hold an AFS licence and does not provide financial product advice as defined under the Corporations Act 2001 (Cth) or regulated by the Australian Securities and Investments Commission (ASIC).
      </p>

      <h2 className="text-xl font-heading text-foreground pt-2">We are committed to</h2>
      <ul className="list-disc list-inside space-y-2">
        <li>Shame-free, empowering financial education</li>
        <li>Respectful, inclusive community spaces</li>
        <li>Honest, clear communication — no fear-based selling</li>
        <li>Protecting your privacy and personal data</li>
        <li>Providing inspiration and practical tools, never directives</li>
      </ul>
    </div>
  </PublicPageLayout>
);

export default Ethics;
