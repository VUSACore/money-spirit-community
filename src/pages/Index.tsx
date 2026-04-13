import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import HeroSection from "@/components/HeroSection";
import { Leaf, Heart, BookOpen } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const features = [
  {
    icon: Leaf,
    title: "Weekly Money Rituals",
    description: "Guided weekly practices to build a conscious, healthy relationship with your money.",
  },
  {
    icon: Heart,
    title: "A Community That Gets You",
    description: "Connect with women who understand your journey — across cultures, currencies and life stages.",
  },
  {
    icon: BookOpen,
    title: "Learning That Empowers",
    description: "Courses and resources that educate and inspire. Knowledge that applies to your real life.",
  },
];

const Index = () => {
  return (
    <main>
      <SEOHead
        title="Money Spirit — Spirit Inspired Freedom"
        description="A financial wellbeing community for migrant women in Australia. Rituals, courses, events and a supportive community to help you thrive."
        ogTitle="Money Spirit — Spirit Inspired Freedom"
        ogDescription="A financial wellbeing community for migrant women in Australia. Rituals, courses, events and a supportive community to help you thrive."
        ogType="website"
        ogImage="https://moneyspirit.com.au/og-image.png"
      />
      <HeroSection />

      {/* Features Section */}
      <section className="bg-background py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
            {features.map((f) => (
              <div key={f.title} className="text-center space-y-4">
                <f.icon className="mx-auto text-accent" size={36} strokeWidth={1.5} />
                <h3 className="font-heading text-xl font-semibold text-foreground">{f.title}</h3>
                <p className="font-body text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button variant="gold" size="lg" className="text-base px-10 py-6 rounded-sm" asChild>
              <Link to="/join">Join the Community</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-6 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-body text-muted-foreground leading-relaxed">
            Money Spirit provides financial education and community — not financial advice.
          </p>
          <p className="text-xs font-body text-muted-foreground/60 mt-2">
            © 2026 Money Spirit ·{" "}
            <Link to="/ethics" className="hover:text-foreground transition-colors underline underline-offset-2">
              Ethics &amp; Education Policy
            </Link>{" "}
            ·{" "}
            <Link to="/privacy" className="hover:text-foreground transition-colors underline underline-offset-2">
              Privacy
            </Link>{" "}
            ·{" "}
            <Link to="/terms" className="hover:text-foreground transition-colors underline underline-offset-2">
              Terms
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
};

export default Index;
