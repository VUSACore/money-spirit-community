import { Link } from "react-router-dom";
import LotusIcon from "@/components/LotusIcon";

interface CourseCardProps {
  id: string;
  title: string;
  description: string | null;
  lessonCount: number;
  isEnrolled: boolean;
  index: number;
}

const CourseCard = ({ id, title, description, lessonCount, isEnrolled, index }: CourseCardProps) => {
  return (
    <Link
      to={`/learn/${id}`}
      className="group block rounded-lg border border-border bg-white overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-gold hover:-translate-y-1"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="animate-slide-up" style={{ animationDelay: `${index * 100}ms`, animationFillMode: "both" }}>
        {/* Navy header panel */}
        <div className="h-[120px] bg-navy flex items-center justify-center">
          <LotusIcon size={48} className="text-gold" />
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="font-heading text-xl text-navy mb-2 leading-snug">{title}</h3>
          {description && (
            <p className="font-body text-sm text-navy/60 line-clamp-3 mb-4">{description}</p>
          )}

          <div className="flex items-center justify-between mt-4">
            <span className="inline-flex items-center rounded-full bg-gold/10 px-3 py-1 text-xs font-body font-medium text-gold">
              {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
            </span>

            <span className="font-body text-sm font-medium text-gold group-hover:underline">
              {isEnrolled ? "Continue →" : "Begin Journey →"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
