import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  iconClassName?: string;
  heading: string;
  body: string;
  ctaLabel?: string;
  onCta?: () => void;
}

const EmptyState = ({ icon: Icon, iconClassName = "", heading, body, ctaLabel, onCta }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center min-h-[300px] text-center px-4">
    <Icon size={40} className={iconClassName + " mb-4"} style={{ color: iconClassName ? undefined : "var(--ms-text-muted)" }} />
    <h2 className="font-heading text-2xl mb-2" style={{ color: "var(--ms-text-primary)" }}>{heading}</h2>
    <p className="font-body text-sm max-w-[320px] leading-relaxed" style={{ color: "var(--ms-text-secondary)" }}>{body}</p>
    {ctaLabel && onCta && (
      <Button variant="gold" className="mt-5" onClick={onCta}>{ctaLabel}</Button>
    )}
  </div>
);

export default EmptyState;
