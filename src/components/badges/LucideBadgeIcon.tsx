import { lazy, Suspense } from "react";
import { icons, type LucideProps } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LucideBadgeIconProps {
  iconSlug: string;
  color: string;
  name: string;
  description?: string | null;
  size?: "sm" | "md" | "lg";
  earned?: boolean;
  showTooltip?: boolean;
}

const sizeMap = {
  sm: { container: "w-8 h-8", icon: 14 },
  md: { container: "w-10 h-10", icon: 18 },
  lg: { container: "w-12 h-12", icon: 24 },
};

function toPascalCase(slug: string): string {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

function getIcon(slug: string) {
  const name = toPascalCase(slug) as keyof typeof icons;
  return icons[name] ?? icons["Award"];
}

const LucideBadgeIcon = ({
  iconSlug,
  color,
  name,
  description,
  size = "md",
  earned = true,
  showTooltip = true,
}: LucideBadgeIconProps) => {
  const s = sizeMap[size];
  const Icon = getIcon(iconSlug);

  const circle = (
    <div
      className={`${s.container} rounded-full flex items-center justify-center shrink-0 border-2 transition-transform ${
        earned ? "" : "opacity-30 grayscale"
      }`}
      style={{
        backgroundColor: earned ? `${color}33` : "#e5e7eb",
        borderColor: earned ? color : "#9ca3af",
      }}
    >
      {earned ? (
        <Icon size={s.icon} style={{ color }} />
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

export default LucideBadgeIcon;
