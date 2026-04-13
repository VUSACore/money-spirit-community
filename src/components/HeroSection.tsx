import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: "#0B1525",
        backgroundImage: "radial-gradient(circle, rgba(196,151,58,0.06) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(196,151,58,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <img
          src="/logo.png"
          alt="Money Spirit"
          style={{
            width: 72, height: 72, margin: '0 auto 24px',
            filter: 'drop-shadow(0 0 10px rgba(196,151,58,0.20))',
          }}
        />
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(44px, 8vw, 76px)',
          fontWeight: 300,
          color: '#F2EAD8',
          letterSpacing: '-0.045em',
          textShadow: '0 0 80px rgba(196,151,58,0.16)',
          marginBottom: '16px',
          lineHeight: 1.05,
        }}>
          Money Spirit
        </h1>
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
