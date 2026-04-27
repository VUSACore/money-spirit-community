import { useParams, Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Lock, Circle, GraduationCap } from "lucide-react";
import EnrolmentGate from "@/components/learn/EnrolmentGate";
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
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="animate-pulse h-8 w-64 rounded-lg" style={{ background: 'rgba(224,176,64,0.08)' }} />
          <div className="animate-pulse h-4 w-96 rounded" style={{ background: 'rgba(224,176,64,0.06)' }} />
          <div className="space-y-2 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-12 rounded-lg" style={{ background: 'rgba(224,176,64,0.04)' }} />
            ))}
          </div>
        </div>
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
      <SEOHead title={`${course.title} — Money Spirit`} description={course.description || "A Money Spirit course to support your financial wellbeing."} noindex />
      <div className="max-w-2xl">
        {/* Course title */}
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 300,
          color: '#FFFFFF', letterSpacing: '-0.03em', marginBottom: '8px', lineHeight: 1.1,
        }}>
          {course.title}
        </h1>
        {course.description && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#D8C896', lineHeight: 1.6, marginBottom: '24px', maxWidth: '560px' }}>
            {course.description}
          </p>
        )}

        {/* Completed banner */}
        {isCompleted && (
          <div className="flex items-center gap-3 px-5 py-4 rounded-xl mb-6" style={{
            background: 'rgba(39,174,143,0.08)', border: '1px solid rgba(39,174,143,0.20)',
          }}>
            <GraduationCap size={20} style={{ color: '#27AE8F' }} />
            <div>
              <p className="text-sm font-body font-medium" style={{ color: '#27AE8F' }}>Course completed</p>
              <p className="text-xs font-body" style={{ color: '#27AE8F80' }}>You've finished all lessons in this course.</p>
            </div>
          </div>
        )}

        {/* Progress bar */}
        {!isCompleted && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 500, color: '#D8C896', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Progress</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: '#F8DC8A' }}>{pct}%</span>
            </div>
            <div style={{ height: '3px', borderRadius: 'var(--r-pill)', overflow: 'hidden', background: 'rgba(224,176,64,0.12)' }}>
              <div style={{
                height: '100%', borderRadius: 'var(--r-pill)',
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #8B6612 0%, #E0B040 50%, #F8DC8A 100%)',
                boxShadow: '0 0 8px rgba(248,220,138,0.35)',
                transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }} />
            </div>
            <p className="text-xs font-body mt-1.5" style={{ color: '#5C4E34' }}>
              {progress?.completed_lessons ?? 0} of {progress?.total_lessons ?? lessons.length} lessons complete
            </p>
          </div>
        )}

        {/* CTA */}
        <Button asChild variant="gold" className="mb-8">
          <Link to={ctaTarget}>{ctaLabel}</Link>
        </Button>

        {/* Lesson list */}
        <div className="space-y-1">
          <p className="text-[11px] font-body font-semibold tracking-wider uppercase mb-3" style={{ color: '#D8C896' }}>Lessons</p>
          {lessons.map((l, i) => {
            const isDone = done.has(l.id);
            const locked = isLessonLocked(i);
            const duration = formatDuration(l.video_duration_seconds);
            const isNext = progress?.next_incomplete_lesson_id === l.id;

            return (
              <div key={l.id}>
                {locked ? (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ color: '#5C4E34', opacity: 0.5 }}>
                    <Lock size={16} className="shrink-0" />
                    <span className="flex-1 text-sm font-body">{l.title}</span>
                    {duration && <span className="text-xs font-body">{duration}</span>}
                  </div>
                ) : (
                  <Link
                    to={`/learn/${courseId}/${l.id}`}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
                    style={{
                      background: isNext ? 'rgba(224,176,64,0.08)' : 'transparent',
                      border: isNext ? '1px solid rgba(224,176,64,0.15)' : '1px solid transparent',
                    }}
                    onMouseEnter={(e) => { if (!isNext) (e.currentTarget as HTMLElement).style.background = 'rgba(224,176,64,0.05)'; }}
                    onMouseLeave={(e) => { if (!isNext) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    {isDone ? (
                      <CheckCircle size={16} className="shrink-0" style={{ color: '#27AE8F' }} />
                    ) : (
                      <Circle size={16} className="shrink-0" style={{ color: isNext ? '#C9941E' : '#5C4E34' }} />
                    )}
                    <span className="flex-1 text-sm font-body" style={{
                      color: isDone ? '#5C4E34' : '#FFFFFF',
                      textDecoration: isDone ? 'line-through' : 'none',
                    }}>
                      {l.title}
                    </span>
                    {isNext && (
                      <span className="text-[10px] font-body font-medium px-2 py-0.5 rounded-full" style={{
                        background: 'rgba(201,148,30,0.15)', color: '#F8DC8A',
                      }}>Next</span>
                    )}
                    {duration && <span className="text-xs font-body" style={{ color: '#5C4E34' }}>{duration}</span>}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CoursePage;
