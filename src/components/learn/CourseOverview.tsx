import { Progress } from "@/components/ui/progress";
import EducationBanner from "@/components/EducationBanner";

interface CourseOverviewProps {
  title: string;
  description: string | null;
  totalLessons: number;
  completedCount: number;
}

const CourseOverview = ({ title, description, totalLessons, completedCount }: CourseOverviewProps) => {
  const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="flex-1 animate-fade-in">
      <h1 className="font-heading text-3xl text-navy mb-2">{title}</h1>

      {description && (
        <p className="font-body text-navy/60 mb-6 max-w-2xl leading-relaxed">{description}</p>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-body text-sm text-navy/70">Progress</span>
          <span className="font-body text-sm font-medium text-navy">{pct}%</span>
        </div>
        <Progress value={pct} className="h-2 bg-gold/15 [&>div]:bg-gold" />
      </div>

      <EducationBanner />
    </div>
  );
};

export default CourseOverview;
