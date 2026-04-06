import { Link, useParams } from "react-router-dom";
import { CheckCircle, Lock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Lesson {
  id: string;
  title: string;
  sort_order: number;
}

interface LessonSidebarProps {
  courseId: string;
  lessons: Lesson[];
  completedIds: Set<string>;
}

const LessonSidebar = ({ courseId, lessons, completedIds }: LessonSidebarProps) => {
  const { lessonId: activeLessonId } = useParams();
  const completedCount = Array.from(completedIds).filter((id) =>
    lessons.some((l) => l.id === id)
  ).length;
  const pct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <nav className="w-full lg:w-64 shrink-0">
      <h3 className="font-heading text-lg text-navy mb-3">Lessons</h3>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="font-body text-xs text-navy/50">
            {completedCount} of {lessons.length} complete
          </span>
          <span className="font-body text-xs font-medium text-navy">{pct}%</span>
        </div>
        <Progress value={pct} className="h-1.5 bg-gold/15 [&>div]:bg-gold" />
      </div>

      <ol className="space-y-1">
        {lessons.map((lesson, i) => {
          const isActive = lesson.id === activeLessonId;
          const isCompleted = completedIds.has(lesson.id);

          return (
            <li key={lesson.id}>
              <Link
                to={`/learn/${courseId}/${lesson.id}`}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 font-body text-sm transition-colors ${
                  isActive
                    ? "border-l-2 border-gold bg-gold/5 text-navy font-medium"
                    : "text-navy/70 hover:bg-muted hover:text-navy"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle size={16} className="text-gold shrink-0" />
                ) : (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full border border-navy/30 text-[10px] text-navy/50 shrink-0">
                    {i + 1}
                  </span>
                )}
                <span className="line-clamp-2">{lesson.title}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default LessonSidebar;
