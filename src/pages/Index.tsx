import { Link } from "react-router-dom";
import HeroSection from "@/components/HeroSection";

const Index = () => {
  return (
    <main>
      <HeroSection />
      <footer className="bg-navy-deep py-6 text-center">
        <Link
          to="/ethics"
          className="text-sm font-body text-cream/50 hover:text-cream/80 transition-colors underline underline-offset-2"
        >
          Ethics and educational commitment
        </Link>
      </footer>
    </main>
  );
};

export default Index;
