import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#4169E1" }}
    >
      <div
        style={{
          animation: "heroFadeUp 0.9s ease-out forwards",
          opacity: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "0 24px",
        }}
      >

        {/* Gold rule */}
        <div
          style={{
            width: 48,
            height: 1,
            background: "#C9941E",
            opacity: 0.6,
            margin: "0 auto 24px auto",
          }}
        />

        {/* Tagline */}
        <p
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "clamp(18px, 3vw, 22px)",
            fontStyle: "italic",
            fontWeight: 300,
            color: "#C9941E",
            letterSpacing: "0.12em",
            marginBottom: 48,
          }}
        >
          Spirit Inspired Freedom
        </p>

        {/* CTA */}
        <div style={{ marginBottom: 16 }}>
          <Button variant="gold" size="lg" className="text-base px-10 py-6 btn-gold" asChild>
            <Link to="/join">Join the Community</Link>
          </Button>
        </div>

        {/* Sign in */}
        <p style={{ fontSize: 14, fontFamily: "var(--font-body)", color: "#5C4E34" }}>
          Already a member?{" "}
          <Link
            to="/login"
            style={{ color: "#C9941E", textDecoration: "underline", textUnderlineOffset: "2px" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#EEC96E"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#C9941E"; }}
          >
            Sign in
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
