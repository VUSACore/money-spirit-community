const steps = [
  {
    title: "Choose your service",
    body: "Large amount going to a bank account? Wise is your best bet. Family needs cash fast, or collects via mobile money? Go with Remitly.",
  },
  {
    title: "Create your free account",
    body: "Use the referral links above for the best rates. You'll need: a photo ID, proof of address, and your recipient's bank or mobile money details.",
  },
  {
    title: "Enter your transfer details",
    body: "Type the amount in your send currency, select the recipient currency, and enter their account number or phone. Always check the rate AND the fee separately before confirming.",
  },
  {
    title: "Review and confirm",
    body: "Screenshot the confirmation for your records. Share the tracking link with your family so they know it's on the way.",
  },
  {
    title: "Track your transfer",
    body: "Both services send email and SMS updates. If the transfer is delayed beyond the quoted time, contact their support immediately.",
  },
];

const StepGuide = () => {
  return (
    <section className="my-12">
      <h2 className="font-heading text-2xl text-navy mb-8">How to Send Money — Step by Step</h2>
      <ol className="space-y-8">
        {steps.map((step, i) => (
          <li
            key={i}
            className="flex gap-5 animate-slide-up"
            style={{ animationDelay: `${i * 150}ms`, animationFillMode: "both" }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-white font-heading text-lg">
              {i + 1}
            </div>
            <div>
              <h3 className="font-heading text-lg text-navy mb-1">{step.title}</h3>
              <p className="font-body text-sm text-navy/70 leading-relaxed max-w-xl">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};

export default StepGuide;
