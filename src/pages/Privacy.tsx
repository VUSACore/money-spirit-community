import PublicPageLayout from "@/components/PublicPageLayout";
import SEOHead from "@/components/SEOHead";

const Privacy = () => (
  <PublicPageLayout>
    <SEOHead title="Privacy Policy — Money Spirit" description="How Money Spirit collects, stores and protects your personal data. Your privacy matters to us." />
    <h1 className="text-3xl font-heading text-foreground mb-2">Privacy Policy</h1>
    <p className="text-sm font-body text-muted-foreground mb-8">Effective date: April 2026</p>

    <div className="space-y-6 font-body text-muted-foreground leading-relaxed">
      <p>
        Money Spirit is committed to protecting your personal information in accordance with the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs).
      </p>

      <h2 className="text-xl font-heading text-foreground pt-2">What we collect</h2>
      <p>
        We collect your name, email address, profile information (bio, location, avatar), and platform usage data (pages visited, content interactions, course progress) when you register and use the platform.
      </p>

      <h2 className="text-xl font-heading text-foreground pt-2">How we use it</h2>
      <p>
        We use your information solely to provide and improve the Money Spirit platform, send you relevant platform notifications and emails, and personalise your experience. We do not sell, rent or share your personal information with third parties for marketing purposes.
      </p>

      <h2 className="text-xl font-heading text-foreground pt-2">Third-party services</h2>
      <p>
        We use the following trusted third-party services to operate the platform: Supabase (database and authentication), Stripe (payment processing), and Resend (transactional email). Each service has its own privacy policy and handles data in accordance with applicable law.
      </p>

      <h2 className="text-xl font-heading text-foreground pt-2">Your rights under the Australian Privacy Principles</h2>
      <p>You have the right to:</p>
      <ul className="list-disc list-inside space-y-2">
        <li>Access the personal information we hold about you</li>
        <li>Request correction of inaccurate information</li>
        <li>Request deletion of your account and associated data</li>
        <li>Make a complaint if you believe your privacy has been breached</li>
      </ul>
      <p>
        To exercise any of these rights, email us at contact@moneyspirit.com.au. We will respond within 30 days.
      </p>
      <p>
        If you are not satisfied with our response, you may lodge a complaint with the Office of the Australian Information Commissioner (OAIC) at{" "}
        <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">www.oaic.gov.au</a>.
      </p>

      <h2 className="text-xl font-heading text-foreground pt-2">Cookies</h2>
      <p>
        We use essential cookies to keep you logged in and maintain your session. We do not use advertising or tracking cookies.
      </p>
    </div>
  </PublicPageLayout>
);

export default Privacy;
