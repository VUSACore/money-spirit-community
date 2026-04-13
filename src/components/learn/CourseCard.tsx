import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import LotusIcon from "@/components/LotusIcon";
import { toast } from "sonner";
import { getCourseProgress } from "@/lib/services/lessonService";

interface CourseCardProps {
  id: string;
  title: string;
  description: string | null;
  lessonCount: number;
  enrolledCount: number;
  isEnrolled: boolean;
  userId: string | null;
  index: number;
}

const CourseCard = ({
  id, title, description, lessonCount, enrolledCount,
  isEnrolled, userId, index,
}: CourseCardProps) => {
  const queryClient = useQueryClient();

  const enrol = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Please log in first.");
      const { error } = await supabase
        .from("course_enrollments").insert({ course_id: id, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Enrolled successfully!");
      queryClient.invalidateQueries({ queryKey: ["my_enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["published_courses"] });
    },
    onError: (err: Error) => toast.error(err.message || "Could not enrol."),
  });

  const { data: progress } = useQuery({
    queryKey: ["course_progress_summary", id, userId],
    enabled: !!userId && isEnrolled,
    queryFn: () => getCourseProgress(userId!, id),
  });

  const card = (
    <div
      className="group rounded-xl overflow-hidden animate-slide-up transition-all duration-300"
      style={{
        background: "var(--ms-surface-1)",
        border: "1px solid var(--ms-border)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        animationDelay: `${index * 100}ms`,
        animationFillMode: "both",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--ms-border-active)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--ms-border)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      <div className="h-[128px] flex items-center justify-center" style={{ background: "var(--ms-surface-2)" }}>
        <LotusIcon size={40} className="opacity-90 text-gold" />
      </div>

      <div className="px-5 py-4 flex flex-col gap-2">
        <h3 className="font-heading text-xl font-semibold leading-snug" style={{ color: "var(--ms-text-primary)" }}>{title}</h3>
        {description && (
          <p className="font-body text-[13px] leading-relaxed line-clamp-3" style={{ color: "var(--ms-text-secondary)" }}>{description}</p>
        )}

        <div className="flex items-center gap-3">
          <span className="font-body text-xs font-medium" style={{ color: "#F5C842" }}>
            {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
          </span>
          <span className="font-body text-xs" style={{ color: "var(--ms-text-muted)" }}>{enrolledCount} enrolled</span>
        </div>

        {isEnrolled && progress && progress.total_lessons > 0 && (
          <div className="mt-1">
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--ms-border)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress.percentage}%`, background: "linear-gradient(90deg, #C9941E, #F5C842)" }}
              />
            </div>
            <span className="font-body text-[11px] mt-0.5 block" style={{ color: "var(--ms-text-muted)" }}>
              {progress.percentage}% complete
            </span>
          </div>
        )}

        {isEnrolled ? (
          <Button asChild variant="gold" className="w-full mt-2 py-2.5 rounded-lg font-body text-sm font-medium">
            <Link to={`/learn/${id}`}>
              {progress && progress.completed_lessons === progress.total_lessons && progress.total_lessons > 0
                ? "Review"
                : progress && progress.completed_lessons > 0
                ? "Continue"
                : "Start"}
            </Link>
          </Button>
        ) : (
          <Button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); enrol.mutate(); }}
            disabled={enrol.isPending || !userId}
            className="w-full mt-2 py-2.5 rounded-lg font-body text-sm font-medium transition-all duration-200"
            style={{
              background: "transparent",
              border: "1px solid var(--ms-border-active)",
              color: "var(--ms-text-primary)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--ms-surface-3)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            {enrol.isPending ? "Enrolling..." : "Enrol Free"}
          </Button>
        )}
      </div>
    </div>
  );

  if (isEnrolled) {
    return <Link to={`/learn/${id}`} className="block">{card}</Link>;
  }
  return card;
};

export default CourseCard;
