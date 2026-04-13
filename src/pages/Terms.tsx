import PublicPageLayout from "@/components/PublicPageLayout";
import SEOHead from "@/components/SEOHead";

const Terms = () => (
  <PublicPageLayout>
    <SEOHead title="Terms of Service — Money Spirit" description="The terms and conditions governing your use of the Money Spirit platform." />
    <h1 className="text-3xl font-heading text-foreground mb-2">Terms of Service</h1>
    <p className="text-sm font-body text-muted-foreground mb-8">Effective date: April 2026</p>

    <div className="space-y-6 font-body text-muted-foreground leading-relaxed">
      <p>By creating an account on Money Spirit, you agree to these terms.</p>

      <h2 className="text-xl font-heading text-foreground pt-2">1. Nature of the platform</h2>
      <p>
        Money Spirit is a financial education and community platform. It is not a financial adviser and does not hold an Australian Financial Services (AFS) licence. Nothing on this platform constitutes financial product advice under the Corporations Act 2001 (Cth). All content is general and educational in nature only.
      </p>

      <h2 className="text-xl font-heading text-foreground pt-2">2. Membership</h2>
      <p>
        Membership is available on a monthly or annual subscription basis. You may cancel your membership at any time. No lock-in contracts. Refunds are handled in accordance with the Australian Consumer Law (ACL) — if a service is not delivered as described, you are entitled to a remedy.
      </p>

      <h2 className="text-xl font-heading text-foreground pt-2">3. Community standards</h2>
      <p>
        Members must engage respectfully and inclusively. Harmful, abusive, discriminatory or misleading content is prohibited and will be removed. Money Spirit reserves the right to suspend or terminate accounts that breach these standards.
      </p>

      <h2 className="text-xl font-heading text-foreground pt-2">4. Intellectual property</h2>
      <p>
        All platform content created by Money Spirit (rituals, courses, written materials) remains the intellectual property of Money Spirit. Member-generated content (posts, forum replies) remains your own, but you grant Money Spirit a licence to display it on the platform.
      </p>

      <h2 className="text-xl font-heading text-foreground pt-2">5. Limitation of liability</h2>
      <p>
        To the extent permitted by Australian Consumer Law, Money Spirit is not liable for any financial decisions made based on content viewed on this platform. Our total liability is limited to the amount you paid for your current subscription period.
      </p>

      <h2 className="text-xl font-heading text-foreground pt-2">6. Governing law</h2>
      <p>
        These terms are governed by the laws of Australia. Any disputes will be subject to the jurisdiction of the Australian courts.
      </p>

      <p className="pt-2">
        Contact: contact@moneyspirit.com.au
      </p>
    </div>
  </PublicPageLayout>
);

export default Terms;
