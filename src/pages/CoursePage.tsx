import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Lock, Circle } from "lucide-react";
import EnrolmentGate from "@/components/learn/EnrolmentGate";
import EducationBanner from "@/components/EducationBanner";
import { getCourseProgress } from "@/lib/services/lessonService";

const CoursePage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses").select("*").eq("id", courseId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const { data: lessons } = useQuery({
    queryKey: ["lessons", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("id, title, sort_order, video_duration_seconds")
        .eq("course_id", courseId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const { data: enrollment, isLoading: enrolLoading } = useQuery({
    queryKey: ["enrolment_check", courseId, userId],
    enabled: !!userId && !!courseId,
    queryFn: async () => {
      const { data } = await supabase
        .from("course_enrollments").select("id, completed_at")
        .eq("user_id", userId!).eq("course_id", courseId!)
        .maybeSingle();
      return data;
    },
  });

  const isEnrolled = !!enrollment;

  const { data: progress } = useQuery({
    queryKey: ["course_progress_summary", courseId, userId],
    enabled: !!userId && !!courseId && isEnrolled,
    queryFn: () => getCourseProgress(userId!, courseId!),
  });

  const { data: completedIds } = useQuery({
    queryKey: ["lesson_progress", courseId, userId],
    enabled: !!userId && !!courseId && !!lessons && isEnrolled,
    queryFn: async () => {
      const ids = lessons?.map((l) => l.id) ?? [];
      if (ids.length === 0) return new Set<string>();
      const { data } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId!)
        .eq("completed", true)
        .in("lesson_id", ids);
      return new Set((data ?? []).map((p) => p.lesson_id));
    },
  });

  if (!course || !lessons) {
    return (
      <div className="p-6 md:p-8 animate-fade-in">
        <div className="animate-pulse bg-muted h-8 w-64 rounded mb-4" />
        <div className="animate-pulse bg-muted h-4 w-96 rounded" />
      </div>
    );
  }

  if (!enrolLoading && !isEnrolled) {
    return (
      <div className="p-6 md:p-8">
        <EnrolmentGate
          courseId={course.id} userId={userId}
          title={course.title} description={course.description}
          lessonCount={lessons.length}
        />
      </div>
    );
  }

  const done = completedIds ?? new Set<string>();
  const pct = progress?.percentage ?? 0;
  const isCompleted = !!enrollment?.completed_at;

  const isLessonLocked = (index: number): boolean => {
    if (index === 0) return false;
    const prevId = lessons[index - 1]?.id;
    return !done.has(prevId);
  };

  // Dynamic CTA
  let ctaLabel = "Start Course";
  let ctaTarget = `/learn/${courseId}/${lessons[0]?.id}`;
  if (isCompleted) {
    ctaLabel = "Review Course";
  } else if (progress && progress.completed_lessons > 0 && progress.next_incomplete_lesson_id) {
    ctaLabel = "Continue Learning";
    ctaTarget = `/learn/${courseId}/${progress.next_incomplete_lesson_id}`;
  }

  const formatDuration = (s: number | null) => {
    if (!s) return null;
    return `${Math.floor(s / 60)} min`;
  };

  return (
    <div className="p-6 md:p-8 animate-fade-in">
      <h1 className="font-heading text-3xl text-primary mb-2">{course.title}</h1>
      {course.description && (
        <p className="font-body text-primary/60 mb-6 max-w-2xl leading-relaxed">{course.description}</p>
      )}

      {/* Progress bar */}
      <div className="mb-6 max-w-xl">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-body text-sm text-primary/70">Progress</span>
          <span className="font-body text-sm font-medium text-primary">{pct}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-accent/15 overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* CTA */}
      <Button asChild className="btn-gold rounded-lg font-body mb-8">
        <Link to={ctaTarget}>{ctaLabel}</Link>
      </Button>

      <EducationBanner />

      {/* Lesson list */}
      <div className="mt-6 space-y-1 max-w-2xl">
        {lessons.map((l, i) => {
          const isDone = done.has(l.id);
          const locked = isLessonLocked(i);
          const duration = formatDuration(l.video_duration_seconds);

          return (
            <div key={l.id}>
              {locked ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg font-body text-sm text-muted-foreground/50 cursor-not-allowed">
                  <Lock size={18} className="shrink-0" />
                  <span className="flex-1">{l.title}</span>
                  {duration && <span className="text-xs">{duration}</span>}
                </div>
              ) : (
                <Link
                  to={`/learn/${courseId}/${l.id}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg font-body text-sm text-primary hover:bg-muted transition-colors"
                >
                  {isDone ? (
                    <CheckCircle size={18} className="text-accent shrink-0" />
                  ) : (
                    <Circle size={18} className="text-muted-foreground shrink-0" />
                  )}
                  <span className={`flex-1 ${isDone ? "line-through text-muted-foreground" : ""}`}>
                    {l.title}
                  </span>
                  {duration && <span className="text-xs text-muted-foreground">{duration}</span>}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CoursePage;
