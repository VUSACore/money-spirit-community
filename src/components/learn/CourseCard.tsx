import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getCourseProgress } from "@/lib/services/lessonService";

interface CourseCardProps {
  id: string; title: string; description: string | null;
  lessonCount: number; enrolledCount: number; isEnrolled: boolean;
  userId: string | null; index: number;
}

const CourseCard = ({ id, title, description, lessonCount, enrolledCount, isEnrolled, userId, index }: CourseCardProps) => {
  const queryClient = useQueryClient();

  const enrol = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Please log in first.");
      const { error } = await supabase.from("course_enrollments")
        .upsert({ course_id: id, user_id: userId }, { onConflict: "user_id,course_id" });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Enrolled successfully!"); queryClient.invalidateQueries({ queryKey: ["my_enrollments"] }); queryClient.invalidateQueries({ queryKey: ["published_courses"] }); },
    onError: (err: Error) => toast.error(err.message || "Could not enrol."),
  });

  const { data: progress } = useQuery({
    queryKey: ["course_progress_summary", id, userId],
    enabled: !!userId && isEnrolled,
    queryFn: () => getCourseProgress(userId!, id),
  });

  const isComplete = progress && progress.completed_lessons === progress.total_lessons && progress.total_lessons > 0;
  const hasStarted = progress && progress.completed_lessons > 0;

  // Determine CTA destination — go to next lesson directly if in progress
  let ctaTo = `/learn/${id}`;
  if (hasStarted && !isComplete && progress?.next_incomplete_lesson_id) {
    ctaTo = `/learn/${id}/${progress.next_incomplete_lesson_id}`;
  }

  const card = (
    <div className="glass-interactive overflow-hidden p-0 animate-glass" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="h-[160px] flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, rgba(11,31,66,0.8) 0%, rgba(6,9,18,0.9) 100%)',
        borderRadius: '12px 12px 0 0',
      }}>
        {isComplete ? (
          <CheckCircle2 size={32} style={{ color: '#27AE8F' }} />
        ) : (
          <BookOpen size={32} style={{ color: 'rgba(201,148,30,0.5)' }} />
        )}
      </div>

      <div className="px-5 py-4 flex flex-col gap-2">
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 400, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>{title}</h3>
        {description && (
          <p className="line-clamp-3" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.5 }}>{description}</p>
        )}

        <div className="flex items-center gap-3">
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 500, color: 'var(--text-gold)' }}>
            {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
          </span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-4)' }}>{enrolledCount} enrolled</span>
        </div>

        {isEnrolled && progress && progress.total_lessons > 0 && (
          <div className="mt-1">
            <div className="w-full overflow-hidden" style={{ height: '4px', borderRadius: 'var(--r-full)', background: 'rgba(255,255,255,0.08)' }}>
              <div style={{
                height: '100%', borderRadius: 'var(--r-full)',
                width: `${progress.percentage}%`,
                background: isComplete
                  ? 'linear-gradient(90deg, #1a8a6e, #27AE8F)'
                  : 'linear-gradient(90deg, #C9941E, #F5C842)',
                boxShadow: isComplete
                  ? '0 0 8px rgba(39,174,143,0.4)'
                  : '0 0 8px rgba(245,200,66,0.4)',
                transition: 'width 0.5s ease',
              }} />
            </div>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: isComplete ? '#27AE8F' : 'var(--text-4)', marginTop: '4px', display: 'block' }}>
              {isComplete ? 'Completed' : `${progress.percentage}% complete`}
            </span>
          </div>
        )}

        {isEnrolled ? (
          <Button asChild variant="gold" className="w-full mt-2">
            <Link to={ctaTo}>
              {isComplete ? "Review" : hasStarted ? "Continue" : "Start"}
            </Link>
          </Button>
        ) : (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); enrol.mutate(); }}
            disabled={enrol.isPending || !userId}
            className="btn-ghost w-full mt-2"
          >
            {enrol.isPending ? "Enrolling…" : "Enrol Free"}
          </button>
        )}
      </div>
    </div>
  );

  if (isEnrolled) return <Link to={ctaTo} className="block">{card}</Link>;
  return card;
};

export default CourseCard;
