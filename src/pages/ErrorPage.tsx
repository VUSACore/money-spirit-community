import LotusIcon from "@/components/LotusIcon";
import SEOHead from "@/components/SEOHead";

const ErrorPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#4169E1' }}>
    <SEOHead title="Something Went Wrong — Money Spirit" noindex />
    <LotusIcon className="text-accent" size={36} />
    <p style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: '#C4973A', fontWeight: 700, marginTop: '16px' }}>Money Spirit</p>
    <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '13px', color: '#A08B62', marginBottom: '32px' }}>Spirit Inspired Freedom</p>

    <p style={{ fontFamily: 'var(--font-display)', fontSize: '80px', lineHeight: 1, color: 'rgba(196,151,58,0.15)', userSelect: 'none', fontWeight: 300 }}>500</p>
    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 300, color: '#F2EAD8', marginTop: '8px', letterSpacing: '-0.02em' }}>Something unexpected happened</h1>
    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#A08B62', maxWidth: '400px', marginTop: '12px', lineHeight: 1.65 }}>
      We're sorry for the interruption. Our team has been notified. Please try refreshing the page or come back shortly.
    </p>
    <button
      onClick={() => window.location.reload()}
      className="btn-gold mt-8 px-8 py-3 rounded-full font-body font-semibold text-sm"
    >
      Refresh Page
    </button>
  </div>
);

export default ErrorPage;
