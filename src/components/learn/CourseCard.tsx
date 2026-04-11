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
      className="group rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl hover:border-amber-300 hover:-translate-y-1 animate-slide-up"
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: "both" }}
    >
      <div className="h-[128px] bg-primary flex items-center justify-center">
        <LotusIcon size={40} className="text-accent opacity-90" />
      </div>

      <div className="px-5 py-4 flex flex-col gap-2">
        <h3 className="font-heading text-lg text-primary font-semibold leading-snug">{title}</h3>
        {description && (
          <p className="font-body text-sm text-primary/70 leading-relaxed line-clamp-3">{description}</p>
        )}

        <div className="flex items-center gap-3">
          <span className="font-body text-xs text-amber-600 font-medium">
            {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
          </span>
          <span className="font-body text-xs text-primary/50">{enrolledCount} enrolled</span>
        </div>

        {/* Progress bar for enrolled */}
        {isEnrolled && progress && progress.total_lessons > 0 && (
          <div className="mt-1">
            <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <span className="font-body text-[11px] text-muted-foreground mt-0.5 block">
              {progress.percentage}% complete
            </span>
          </div>
        )}

        {isEnrolled ? (
          <Button asChild className="w-full mt-2 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-body text-sm font-medium">
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
            variant="outline"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); enrol.mutate(); }}
            disabled={enrol.isPending || !userId}
            className="w-full mt-2 py-2.5 rounded-lg border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-body text-sm font-medium transition-all duration-200"
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
