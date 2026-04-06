const steps = [
  {
    title: "Choose your service",
    body: "If you are sending a larger amount to a bank account, Wise is usually the better choice. If your family needs cash quickly or collects via mobile money, Remitly tends to be faster.",
  },
  {
    title: "Create your free account",
    body: "Use the links on this page to get the best rates available. You will need a photo ID, proof of address, and your recipient's bank details or phone number depending on the service.",
  },
  {
    title: "Enter your transfer details",
    body: "Type in the amount you want to send in your home currency. Select your recipient's currency and enter their account number or mobile number. Always check the exchange rate and the fee separately before you confirm.",
  },
  {
    title: "Review and confirm",
    body: "Take a screenshot of the confirmation screen for your records. Share the tracking link with your family so they know the transfer is on its way.",
  },
  {
    title: "Track your transfer",
    body: "Both Wise and Remitly send email and SMS updates at each stage. If your transfer is delayed beyond the quoted time, contact their support team directly using the app or website.",
  },
];

const StepGuide = () => {
  return (
    <section className="my-12">
      <h2 className="font-heading text-2xl text-navy mb-8">How to Send Money, Step by Step</h2>
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
