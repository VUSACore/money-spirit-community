import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";

type PathwayType = Database["public"]["Enums"]["pathway_type"];

const questions = [
  {
    question: "How would you describe your relationship with money?",
    options: ["Anxious or avoidant", "Curious but overwhelmed", "Actively building", "Confident and growing"],
  },
  {
    question: "What is your biggest financial challenge?",
    options: ["Understanding where my money goes", "Building savings", "Getting out of debt", "Growing my wealth"],
  },
  {
    question: "How long have you been in your current country?",
    options: ["Less than 2 years", "2 to 5 years", "5 to 10 years", "More than 10 years"],
  },
  {
    question: "What does financial wellbeing mean to you?",
    options: ["Feeling safe and secure", "Freedom and choice", "Building for my family", "Creating lasting wealth"],
  },
  {
    question: "How do you prefer to learn?",
    options: ["Step by step structure", "Community and conversation", "Practical exercises", "All of the above"],
  },
];

function calculatePathway(answers: number[]): PathwayType {
  let foundation = 0;
  let growth = 0;
  let abundance = 0;

  for (const a of answers) {
    if (a <= 1) foundation++;
    else if (a === 2) growth++;
    else abundance++;
  }

  if (foundation >= growth && foundation >= abundance) return "foundation";
  if (growth >= abundance) return "growth";
  return "abundance";
}

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const current = questions[step];
  const selected = answers[step];
  const progress = ((step + 1) / questions.length) * 100;
  const isLast = step === questions.length - 1;

  const selectOption = (idx: number) => {
    const next = [...answers];
    next[step] = idx;
    setAnswers(next);
  };

  const handleNext = async () => {
    if (selected === null) return;

    if (!isLast) {
      setStep(step + 1);
      return;
    }

    setSaving(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in.");
      setSaving(false);
      return;
    }

    const pathway = calculatePathway(answers as number[]);

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ pathway_type: pathway, onboarding_complete: true })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    const name = profile?.display_name ?? "there";
    const label = pathway.charAt(0).toUpperCase() + pathway.slice(1);
    toast.success(`Welcome to Money Spirit, ${name}. Your ${label} pathway is ready.`);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-navy-deep flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-heading text-white mb-1">Your Money Spirit Path</h1>
          <p className="text-gold font-body text-sm">Question {step + 1} of {questions.length}</p>
        </div>

        <div className="w-full h-1.5 bg-navy rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-gold rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <h2 className="text-xl font-heading text-white text-center mb-6 animate-slide-up">{current.question}</h2>

        <div className="space-y-3 mb-8 animate-slide-up" key={step}>
          {current.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => selectOption(idx)}
              className={`w-full text-left px-5 py-4 rounded-xl border-2 font-body text-sm transition-all duration-200 ${
                selected === idx
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-navy bg-transparent text-cream hover:border-gold/50"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-3 text-sm font-body mb-4">
            {error}
          </div>
        )}

        <Button
          variant="gold"
          className="w-full rounded-xl h-11"
          disabled={selected === null || saving}
          onClick={handleNext}
        >
          {saving ? "Saving..." : isLast ? "Complete" : "Next"}
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
