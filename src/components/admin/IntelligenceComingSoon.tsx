import { Sparkles } from "lucide-react";

const IntelligenceComingSoon = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div
      className="rounded-xl p-6 max-w-lg text-center"
      style={{
        background: "hsl(220 72% 10%)",
        border: "1px solid hsl(220 50% 20%)",
      }}
    >
      <Sparkles size={32} className="text-gold mx-auto mb-4" />
      <h2 className="font-heading text-2xl text-cream mb-3">Founder Intelligence</h2>
      <p className="font-body text-sm text-cream/60 leading-relaxed mb-6">
        Your AI-powered platform insights are being set up. This dashboard will show archetype
        trends, churn risk signals, retreat demand indicators, and FMS lead intelligence.
      </p>
      <span className="font-body text-xs text-muted-foreground">
        Powered by Gemini 2.5 Flash
      </span>
    </div>
  </div>
);

export default IntelligenceComingSoon;
