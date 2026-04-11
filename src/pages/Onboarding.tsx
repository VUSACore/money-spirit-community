import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { sendWelcomeEmail, sendArchetypeReveal } from "@/lib/email/emailService";

type ArchetypeKey = "giver" | "keeper" | "rebel" | "seeker" | "achiever";
type LifeStage = "under_30" | "30_to_40" | "40_to_50" | "50_plus";

const archetypeInfo: Record<ArchetypeKey, { name: string; description: string; accent: string }> = {
  giver: { name: "The Giver", description: "You lead with generosity and care deeply about providing for others. Your financial journey is rooted in love, community, and the desire to uplift those around you.", accent: "#E8845C" },
  keeper: { name: "The Keeper", description: "You value security above all else. Building a solid foundation, protecting what you have, and planning carefully are the pillars of your financial wellbeing.", accent: "#5B8DB8" },
  rebel: { name: "The Rebel", description: "You reject traditional money rules and forge your own path. Bold, unconventional, and courageous — you are not afraid to challenge the system and rewrite the rules of wealth.", accent: "#9B59B6" },
  seeker: { name: "The Seeker", description: "You are on a journey of discovery. Curious, open-minded, and always learning — you approach money with wonder and a desire to understand the deeper purpose it can serve in your life.", accent: "#27AE8F" },
  achiever: { name: "The Achiever", description: "You are driven, ambitious, and focused on growth. You set bold financial goals and pursue them with discipline, strategy, and an unstoppable belief in what is possible.", accent: "#C9941E" },
};

const lifeStageQuestion = {
  question: "How old are you?",
  options: [
    { label: "Under 30", value: "under_30" as LifeStage },
    { label: "30 to 40", value: "30_to_40" as LifeStage },
    { label: "40 to 50", value: "40_to_50" as LifeStage },
    { label: "50 or over", value: "50_plus" as LifeStage },
  ],
};

interface ScoredQuestion {
  question: string;
  options: { label: string; archetype: ArchetypeKey }[];
}

const scoredQuestions: ScoredQuestion[] = [
  {
    question: "When you think about money, what feeling comes up first?",
    options: [
      { label: "I want to make sure my family and loved ones are taken care of", archetype: "giver" },
      { label: "I need to feel safe and know everything is covered", archetype: "keeper" },
      { label: "I feel frustrated with the rules — money should work differently", archetype: "rebel" },
      { label: "I feel curious — there is so much I still want to learn", archetype: "seeker" },
      { label: "I feel motivated — I know I can build something great", archetype: "achiever" },
    ],
  },
  {
    question: "What is your biggest financial focus right now?",
    options: [
      { label: "Supporting others — my family, community, or people I love", archetype: "giver" },
      { label: "Building a solid safety net and protecting what I have", archetype: "keeper" },
      { label: "Breaking free from financial stress and rewriting my story", archetype: "rebel" },
      { label: "Understanding money better and finding my own path", archetype: "seeker" },
      { label: "Growing my wealth and hitting ambitious financial goals", archetype: "achiever" },
    ],
  },
  {
    question: "How long have you been in Australia?",
    options: [
      { label: "Less than 2 years", archetype: "seeker" },
      { label: "2 to 5 years", archetype: "keeper" },
      { label: "5 to 10 years", archetype: "giver" },
      { label: "More than 10 years", archetype: "achiever" },
      { label: "I am not based in Australia", archetype: "seeker" },
    ],
  },
  {
    question: "What does financial wellbeing mean to you?",
    options: [
      { label: "Being able to give generously without worry", archetype: "giver" },
      { label: "Feeling secure, stable, and in control", archetype: "keeper" },
      { label: "Freedom from the systems that held me back", archetype: "rebel" },
      { label: "Living with purpose and understanding my money deeply", archetype: "seeker" },
      { label: "Creating lasting wealth for myself and my family", archetype: "achiever" },
    ],
  },
  {
    question: "How do you prefer to learn and grow?",
    options: [
      { label: "Through stories and real experiences from my community", archetype: "giver" },
      { label: "Step by step with clear guidance and structure", archetype: "keeper" },
      { label: "By challenging conventional wisdom and doing it my way", archetype: "rebel" },
      { label: "Through deep exploration, research, and asking questions", archetype: "seeker" },
      { label: "Through goals, milestones, and measurable results", archetype: "achiever" },
    ],
  },
  {
    question: "What is your current housing situation?",
    options: [
      { label: "Living with family or community", archetype: "giver" },
      { label: "Renting — focused on stability first", archetype: "keeper" },
      { label: "Renting — but I refuse to let that be my permanent story", archetype: "rebel" },
      { label: "Exploring my options and still figuring it out", archetype: "seeker" },
      { label: "Working actively toward buying my own property", archetype: "achiever" },
    ],
  },
  {
    question: "Which of these feels most like you?",
    options: [
      { label: "I show up for others before I show up for myself", archetype: "giver" },
      { label: "I plan carefully before I make any financial move", archetype: "keeper" },
      { label: "I question everything and trust my own instincts", archetype: "rebel" },
      { label: "I am always asking why and looking for deeper meaning", archetype: "seeker" },
      { label: "I set a goal and I do not stop until I reach it", archetype: "achiever" },
    ],
  },
];

const TOTAL_STEPS = 8; // 1 life stage + 7 scored

function calculateArchetype(scores: Record<ArchetypeKey, number>): ArchetypeKey {
  const priority: ArchetypeKey[] = ["achiever", "seeker", "keeper", "giver", "rebel"];
  let best: ArchetypeKey = "keeper";
  let bestScore = -1;
  for (const key of priority) {
    if (scores[key] > bestScore) {
      bestScore = scores[key];
      best = key;
    }
  }
  return best;
}

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0 = life stage, 1-7 = scored questions
  const [lifeStage, setLifeStage] = useState<LifeStage | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(scoredQuestions.length).fill(null));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ArchetypeKey | null>(null);
  const [scores, setScores] = useState<Record<ArchetypeKey, number> | null>(null);

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  const handleNext = () => {
    if (step === 0) {
      if (!lifeStage) return;
      setStep(1);
      return;
    }

    const qIdx = step - 1;
    if (answers[qIdx] === null) return;

    if (qIdx < scoredQuestions.length - 1) {
      setStep(step + 1);
      return;
    }

    // Calculate result
    const tally: Record<ArchetypeKey, number> = { giver: 0, keeper: 0, rebel: 0, seeker: 0, achiever: 0 };
    for (let i = 0; i < scoredQuestions.length; i++) {
      const ans = answers[i];
      if (ans !== null) {
        const archetype = scoredQuestions[i].options[ans].archetype;
        tally[archetype]++;
      }
    }
    setScores(tally);
    setResult(calculateArchetype(tally));
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleComplete = async () => {
    if (!result || !scores || !lifeStage) return;
    setSaving(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in.");
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        pathway_type: result,
        life_stage: lifeStage,
        archetype_score: scores,
        onboarding_complete: true,
      })
      .eq("user_id", user.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle();

    const name = profile?.display_name ?? "there";
    const info = archetypeInfo[result];

    // Send welcome + archetype reveal emails (fire-and-forget)
    if (user.email) {
      sendWelcomeEmail(user.email, name, info.name);
      sendArchetypeReveal(user.email, name, info.name, info.description, info.accent);
    }

    toast.success(`Welcome to Money Spirit, ${name}. Your ${info.name} journey is ready.`);
    navigate("/dashboard");
  };

  // Reveal screen
  if (result && scores) {
    const info = archetypeInfo[result];
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg text-center space-y-6 animate-fade-in">
          <div
            className="mx-auto w-28 h-28 rounded-full flex items-center justify-center text-5xl"
            style={{ border: `3px solid ${info.accent}`, boxShadow: `0 0 30px ${info.accent}40` }}
          >
            {result === "giver" && "❤️"}
            {result === "keeper" && "🛡️"}
            {result === "rebel" && "🔥"}
            {result === "seeker" && "🧭"}
            {result === "achiever" && "⭐"}
          </div>

          <h1 className="font-heading text-[42px] leading-tight" style={{ color: info.accent }}>
            You are {info.name}
          </h1>

          <p className="font-body text-cream-200 text-base leading-relaxed max-w-md mx-auto">
            {info.description}
          </p>

          <p className="font-body text-cream-200/70 text-lg">Your journey begins now</p>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-3 text-sm font-body">
              {error}
            </div>
          )}

          <Button
            className="btn-gold w-full rounded-xl h-12 text-base"
            disabled={saving}
            onClick={handleComplete}
          >
            {saving ? "Saving..." : "Enter Money Spirit"}
          </Button>
        </div>
      </div>
    );
  }

  // Quiz steps
  const isLifeStage = step === 0;
  const currentSelected = isLifeStage ? (lifeStage ? lifeStageQuestion.options.findIndex(o => o.value === lifeStage) : null) : answers[step - 1];
  const canProceed = currentSelected !== null;

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-heading text-white mb-1">Your Money Spirit Path</h1>
          <p className="text-gold font-body text-sm">
            Question {step + 1} of {TOTAL_STEPS}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-navy-800 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-gold rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question */}
        <h2 className="font-heading text-[28px] text-cream-50 text-center mb-6 animate-slide-up leading-tight" key={step}>
          {isLifeStage ? lifeStageQuestion.question : scoredQuestions[step - 1].question}
        </h2>

        {/* Options */}
        <div className="space-y-3 mb-8 animate-slide-up" key={`opts-${step}`}>
          {isLifeStage
            ? lifeStageQuestion.options.map((opt, idx) => {
                const selected = lifeStage === opt.value;
                return (
                  <button
                    key={idx}
                    onClick={() => setLifeStage(opt.value)}
                    className={`w-full text-left px-5 py-4 rounded-xl border-2 font-body text-base transition-all duration-200 ${
                      selected
                        ? "border-gold-500 bg-navy-800 text-gold-300"
                        : "border-navy-600 bg-navy-800 text-cream-100 hover:border-gold-500/50"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })
            : scoredQuestions[step - 1].options.map((opt, idx) => {
                const selected = answers[step - 1] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      const next = [...answers];
                      next[step - 1] = idx;
                      setAnswers(next);
                    }}
                    className={`w-full text-left px-5 py-4 rounded-xl border-2 font-body text-base transition-all duration-200 ${
                      selected
                        ? "border-gold-500 bg-navy-800 text-gold-300"
                        : "border-navy-600 bg-navy-800 text-cream-100 hover:border-gold-500/50"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <Button
              variant="ghost"
              className="text-white/60 hover:text-white hover:bg-white/5"
              onClick={handleBack}
            >
              <ChevronLeft size={18} className="mr-1" />
              Back
            </Button>
          )}
          <Button
            className="btn-gold flex-1 rounded-xl h-11"
            disabled={!canProceed}
            onClick={handleNext}
          >
            {step === TOTAL_STEPS - 1 ? "See my archetype" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
