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
        ogDescription="A financial wellbeing community for migrant women in Australia."
        ogType="website"
        ogImage="https://moneyspirit.com.au/og-image.png"
      />
      <HeroSection />

      <section style={{ background: '#005eb8', padding: '80px 24px' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
            {features.map((f) => (
              <div key={f.title} className="text-center space-y-4">
                <f.icon className="mx-auto" size={36} strokeWidth={1.5} style={{ color: '#E0B040' }} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '21px', fontWeight: 400, color: '#FFFFFF' }}>{f.title}</h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#D8C896', lineHeight: 1.65 }}>{f.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button variant="gold" size="lg" className="text-base px-10 py-6 btn-gold" asChild>
              <Link to="/join">Join the Community</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer style={{ background: '#005eb8', borderTop: '1px solid rgba(224,176,64,0.08)', padding: '24px' }}>
        <div className="max-w-4xl mx-auto text-center">
          <p style={{ fontSize: '12px', fontFamily: 'var(--font-body)', color: '#5C4E34', lineHeight: 1.6 }}>
            Money Spirit provides financial education and community — not financial advice.
          </p>
          <p style={{ fontSize: '12px', fontFamily: 'var(--font-body)', color: '#5C4E3480', marginTop: '8px' }}>
            © 2026 Money Spirit ·{" "}
            <Link to="/ethics" style={{ color: '#5C4E34', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Ethics &amp; Education Policy</Link>{" "}·{" "}
            <Link to="/privacy" style={{ color: '#5C4E34', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Privacy</Link>{" "}·{" "}
            <Link to="/terms" style={{ color: '#5C4E34', textDecoration: 'underline', textUnderlineOffset: '2px' }}>Terms</Link>
          </p>
        </div>
      </footer>
    </main>
  );
};

export default Index;
