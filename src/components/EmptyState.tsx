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
  <div className="flex flex-col items-center justify-center min-h-[260px] text-center px-6 py-10">
    <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5" style={{
      background: 'rgba(224,176,64,0.08)',
      border: '1px solid rgba(224,176,64,0.15)',
    }}>
      <Icon size={24} className={iconClassName} style={{ color: iconClassName ? undefined : '#E0B040' }} />
    </div>
    <h2 style={{
      fontFamily: 'var(--font-display)',
      fontSize: '22px',
      fontWeight: 400,
      color: '#FFFFFF',
      letterSpacing: '-0.02em',
      marginBottom: '8px',
    }}>{heading}</h2>
    <p style={{
      fontFamily: 'var(--font-body)',
      fontSize: '14px',
      color: '#D8C896',
      maxWidth: '340px',
      lineHeight: 1.65,
    }}>{body}</p>
    {ctaLabel && onCta && (
      <Button variant="gold" className="mt-6 btn-gold" onClick={onCta}>{ctaLabel}</Button>
    )}
  </div>
);

export default EmptyState;
