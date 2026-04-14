import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: "#0B1F3A",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "transparent" }}
      />

      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <img
          src="/mandala.png"
          alt="Money Spirit"
          style={{
            width: 'min(320px, 68vw)',
            height: 'auto',
            display: 'block',
            margin: '0 auto 28px auto',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            boxShadow: 'none',
            filter: 'drop-shadow(0 0 24px rgba(196,151,58,0.18))',
          }}
        />
        <p style={{
          fontFamily: "'Cormorant', 'Cormorant Garamond', Georgia, serif",
          fontSize: 'clamp(18px, 4vw, 26px)',
          fontWeight: 400,
          letterSpacing: '0.25em',
          color: '#C4973A',
          textTransform: 'uppercase' as const,
          margin: '0 auto 16px auto',
          textAlign: 'center' as const,
        }}>
          Money-Spirit
        </p>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(18px, 3vw, 22px)',
          fontStyle: 'italic',
          fontWeight: 300,
          color: '#C4973A',
          letterSpacing: '0.02em',
          marginBottom: '48px',
        }}>
          Spirit Inspired Freedom
        </p>
        <Button variant="gold" size="lg" className="text-base px-10 py-6 btn-gold" asChild>
          <Link to="/join">Join the Community</Link>
        </Button>
        <p style={{ marginTop: '24px', fontSize: '14px', fontFamily: 'var(--font-body)', color: '#5C4E34' }}>
          Already a member?{" "}
          <Link to="/login" style={{ color: '#C4973A', textDecoration: 'underline', textUnderlineOffset: '2px' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#EEC96E'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#C4973A'; }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
