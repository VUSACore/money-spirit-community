import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: "#071D40",
        backgroundImage: "radial-gradient(circle, rgba(201,148,30,0.08) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      {/* Subtle gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(201,148,30,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <h1 className="font-heading text-6xl md:text-8xl font-light tracking-wide text-cream mb-6">
          Money Spirit
        </h1>
        <p className="font-heading text-xl md:text-2xl text-gold italic tracking-widest mb-12">
          Spirit Inspired Freedom
        </p>
        <Button variant="gold" size="lg" className="text-base px-10 py-6 rounded-sm" asChild>
          <Link to="/register">Join the Community</Link>
        </Button>
        <p className="mt-6 text-sm font-body text-cream/60">
          Already a member?{" "}
          <Link to="/login" className="text-gold hover:text-gold/80 underline underline-offset-2 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
