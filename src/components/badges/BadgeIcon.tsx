import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BadgeIconProps {
  emoji: string;
  color: string;
  name: string;
  description?: string | null;
  size?: "sm" | "md" | "lg";
  earned?: boolean;
  showTooltip?: boolean;
}

const sizeMap = {
  sm: "w-6 h-6 text-sm",
  md: "w-8 h-8 text-lg",
  lg: "w-12 h-12 text-2xl",
};

const BadgeIcon = ({
  emoji,
  color,
  name,
  description,
  size = "md",
  earned = true,
  showTooltip = true,
}: BadgeIconProps) => {
  const circle = (
    <div
      className={`${sizeMap[size]} rounded-full flex items-center justify-center shrink-0 transition-transform ${
        earned
          ? "ring-2 ring-accent/60"
          : "opacity-30 grayscale"
      }`}
      style={{
        backgroundColor: earned ? `${color}26` : "#e5e7eb",
      }}
    >
      {earned ? (
        <span>{emoji}</span>
      ) : (
        <span className="text-xs">🔒</span>
      )}
    </div>
  );

  if (!showTooltip) return circle;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{circle}</TooltipTrigger>
      <TooltipContent
        className="bg-primary text-white border-primary rounded px-3 py-2 max-w-[200px]"
        sideOffset={6}
      >
        <p className="font-body font-semibold text-xs">{name}</p>
        {description && (
          <p className="font-body text-[11px] text-white/70 mt-0.5">
            {description}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
};

export default BadgeIcon;
