export const countries = [
  "Afghanistan", "Bangladesh", "China", "Egypt", "Ghana", "India", "Iran", "Kenya",
  "Lebanon", "Nepal", "New Zealand", "Nigeria", "Pakistan", "Philippines", "South Africa",
  "South Korea", "Sri Lanka", "UK", "Vietnam", "Zimbabwe", "Other",
];

export const yearsInAustraliaOptions = [
  { value: "less_than_1", label: "Less than 1 year" },
  { value: "1_to_2", label: "1–2 years" },
  { value: "2_to_5", label: "2–5 years" },
  { value: "5_to_10", label: "5–10 years" },
  { value: "more_than_10", label: "More than 10 years" },
] as const;

export const maritalStatusOptions = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "de_facto", label: "De facto" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export const employmentOptions = [
  { value: "employed", label: "Employed" },
  { value: "self_employed", label: "Self-employed" },
  { value: "business_owner", label: "Business owner" },
  { value: "student", label: "Student" },
  { value: "not_working", label: "Not working" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export const financialGoalOptions = [
  "Buy my first home",
  "Pay off debt",
  "Build savings",
  "Start a business",
  "Invest in property",
  "Create passive income",
  "Send money home",
  "Retire comfortably",
  "Build generational wealth",
  "Get financial education",
];

export const interestOptions = [
  "Money rituals", "Spirituality", "Community", "Investing", "Budgeting",
  "Property", "Superannuation", "Insurance", "Sending money home",
  "Family wealth", "Business", "Career growth",
];

export const yearsLabel = (v: string | null | undefined) => {
  const opt = yearsInAustraliaOptions.find((o) => o.value === v);
  return opt?.label ?? v ?? "";
};

export const formatEnumLabel = (v: string | null | undefined) => {
  if (!v) return "";
  return v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export const archetypeAccent: Record<string, string> = {
  giver: "#FFA37A", keeper: "#7BB0E0", rebel: "#C490DA", seeker: "#3DD4A8", achiever: "#C9941E",
};
export const archetypeName: Record<string, string> = {
  giver: "The Giver", keeper: "The Keeper", rebel: "The Rebel", seeker: "The Seeker", achiever: "The Achiever",
};
