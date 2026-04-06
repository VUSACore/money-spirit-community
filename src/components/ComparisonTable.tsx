import { Check, Circle } from "lucide-react";

const features = [
  { name: "Community feed", guest: "Read only", member: true },
  { name: "Forum discussions", guest: "Titles only", member: true },
  { name: "Money Rituals", guest: false, member: true },
  { name: "Courses and Learning", guest: false, member: true },
  { name: "Member Directory", guest: "Browse", member: true },
  { name: "Events", guest: "Browse", member: true },
  { name: "Pathway Dashboard", guest: false, member: true },
  { name: "Weekly ritual emails", guest: false, member: true },
  { name: "Member badge", guest: false, member: true },
];

const ComparisonTable = () => {
  return (
    <section className="mb-14">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-heading text-primary mb-2">
          Everything you get when you join
        </h2>
        <p className="font-body text-muted-foreground text-lg">
          Start free, go deeper when you are ready.
        </p>
      </div>

      <div className="w-full overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="bg-primary text-primary-foreground px-5 py-3 font-heading text-base font-medium w-1/3">
                What's inside
              </th>
              <th className="bg-card text-foreground px-5 py-3 font-heading text-base font-medium text-center w-1/3">
                <span>Guest</span>
                <span className="block text-xs font-body text-accent font-normal mt-0.5">Always free</span>
              </th>
              <th className="bg-primary text-accent px-5 py-3 font-heading text-base font-medium text-center w-1/3">
                <span>Member</span>
                <span className="block text-xs font-body text-accent font-normal mt-0.5">AU$19/month</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {features.map((f, i) => (
              <tr
                key={f.name}
                className={i % 2 === 0 ? "bg-card" : "bg-muted/50"}
              >
                <td className="px-5 py-3 font-body text-sm text-foreground">{f.name}</td>
                <td className="px-5 py-3 text-center">
                  {f.guest === true ? (
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto" />
                  ) : f.guest === false ? (
                    <Circle className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                  ) : (
                    <span className="font-body text-xs text-muted-foreground">{f.guest}</span>
                  )}
                </td>
                <td className="px-5 py-3 text-center">
                  {f.member === true ? (
                    <span className="font-body text-xs text-foreground">
                      {f.guest && typeof f.guest === "string" ? "Full access" : <Check className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto" />}
                    </span>
                  ) : (
                    <span className="font-body text-xs text-muted-foreground">{String(f.member)}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ComparisonTable;
