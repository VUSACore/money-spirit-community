import { useParams, Navigate, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckCircle, PlayCircle, Lock, Circle, FileDown,
  ChevronLeft, ChevronRight, Trophy,
} from "lucide-react";
import { toast } from "sonner";
import {
  saveWatchPosition,
  markLessonComplete,
} from "@/lib/services/lessonService";
import {
  Dialog, DialogContent,
} from "@/components/ui/dialog";

/* ── helpers ── */
function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^?&]+)/);
  return m ? m[1] : null;
}

function extractVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? m[1] : null;
}

type VideoType = "youtube" | "vimeo" | "iframe" | "html5" | "none";

function detectVideoType(url: string | null): VideoType {
  if (!url) return "none";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("vimeo.com")) return "vimeo";
  if (url.includes("cloudflare") || url.includes("mux")) return "iframe";
  return "html5";
}

/* ── main component ── */
const LessonPage = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [markedComplete, setMarkedComplete] = useState(false);

  // Reset markedComplete when lesson changes
  useEffect(() => { setMarkedComplete(false); }, [lessonId]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  /* ── data queries ── */
  const { data: isEnrolled, isLoading: enrolLoading } = useQuery({
    queryKey: ["enrolment_check", courseId, userId],
    enabled: !!userId && !!courseId,
    queryFn: async () => {
      const { data } = await supabase
        .from("course_enrollments").select("id")
        .eq("user_id", userId!).eq("course_id", courseId!)
        .maybeSingle();
      return !!data;
    },
  });

  const { data: lesson } = useQuery({
    queryKey: ["lesson", lessonId],
    enabled: !!lessonId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons").select("*")
        .eq("id", lessonId!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: allLessons } = useQuery({
    queryKey: ["lessons", courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons").select("id, title, sort_order, video_duration_seconds")
        .eq("course_id", courseId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: progressMap } = useQuery({
    queryKey: ["lesson_progress", courseId, userId],
    enabled: !!userId && !!courseId && !!allLessons,
    queryFn: async () => {
      const ids = allLessons?.map((l) => l.id) ?? [];
      if (ids.length === 0) return new Map<string, { completed: boolean; watch_position: number }>();
      const { data } = await supabase
        .from("lesson_progress")
        .select("lesson_id, completed, watch_position")
        .eq("user_id", userId!)
        .in("lesson_id", ids);
      const map = new Map<string, { completed: boolean; watch_position: number }>();
      data?.forEach((p) => map.set(p.lesson_id, { completed: p.completed, watch_position: p.watch_position }));
      return map;
    },
  });

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    enabled: !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses").select("title").eq("id", courseId!).single();
      if (error) throw error;
      return data;
    },
  });

  /* ── derived state ── */
  const pm = progressMap ?? new Map();
  const completedIds = new Set(
    Array.from(pm.entries()).filter(([, v]) => v.completed).map(([k]) => k)
  );
  const currentIndex = allLessons?.findIndex((l) => l.id === lessonId) ?? -1;
  const prevLesson = currentIndex > 0 ? allLessons![currentIndex - 1] : null;
  const nextLesson = allLessons && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
  const isCurrentCompleted = completedIds.has(lessonId!) || markedComplete;
  const completedCount = completedIds.size + (markedComplete && !completedIds.has(lessonId!) ? 1 : 0);
  const totalLessons = allLessons?.length ?? 0;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  /* ── lesson locking ── */
  const isLessonLocked = useCallback((index: number): boolean => {
    if (index === 0) return false;
    const prevId = allLessons?.[index - 1]?.id;
    if (!prevId) return true;
    return !completedIds.has(prevId);
  }, [allLessons, completedIds]);

  /* ── video watch position restore ── */
  useEffect(() => {
    if (!videoRef.current || !userId || !lessonId) return;
    const existing = pm.get(lessonId);
    if (existing && existing.watch_position > 0) {
      videoRef.current.currentTime = existing.watch_position;
    }
  }, [lesson, userId, lessonId, pm]);

  /* ── debounced save ── */
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current || !userId || !lessonId || !courseId) return;
    const currentTime = Math.floor(videoRef.current.currentTime);
    const duration = videoRef.current.duration;

    // Auto-complete at 85%
    if (duration && currentTime > duration * 0.85 && !isCurrentCompleted) {
      handleMarkComplete();
    }

    if (saveTimerRef.current) return;
    saveTimerRef.current = setTimeout(() => {
      saveWatchPosition(userId, lessonId, courseId, currentTime).catch(() => {});
      saveTimerRef.current = null;
    }, 10000);
  }, [userId, lessonId, courseId, isCurrentCompleted]);

  useEffect(() => {
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, []);

  /* ── mark complete ── */
  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !lessonId || !courseId) throw new Error("Missing data");
      return markLessonComplete(userId, lessonId, courseId);
    },
    onSuccess: (courseCompleted) => {
      setMarkedComplete(true);
      toast.success("Lesson complete! 🎉");
      queryClient.invalidateQueries({ queryKey: ["lesson_progress"] });
      queryClient.invalidateQueries({ queryKey: ["course_progress_summary"] });
      if (courseCompleted) {
        setShowCelebration(true);
        queryClient.invalidateQueries({ queryKey: ["my_enrollments"] });
        queryClient.invalidateQueries({ queryKey: ["enrolment_check"] });
      }
    },
    onError: () => toast.error("Could not save progress. Please try again."),
  });

  const handleMarkComplete = () => {
    if (!isCurrentCompleted && !completeMutation.isPending) {
      completeMutation.mutate();
    }
  };

  /* ── gate ── */
  if (!enrolLoading && userId && !isEnrolled) {
    return <Navigate to={`/learn/${courseId}`} replace />;
  }

  if (!lesson || !allLessons) {
    return (
      <div className="p-6 md:p-8 animate-fade-in">
        <div className="max-w-3xl">
          <div className="animate-pulse h-10 w-80 rounded mb-4" style={{ background: 'rgba(248,220,138,0.32)' }} />
          <div className="animate-pulse aspect-video w-full rounded-xl mb-4" style={{ background: 'rgba(224,176,64,0.04)' }} />
        </div>
      </div>
    );
  }

  const videoType = detectVideoType(lesson.video_url);
  const formatDuration = (s: number | null) => {
    if (!s) return null;
    return `${Math.floor(s / 60)} min`;
  };

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── LEFT: main content ── */}
        <div className="flex-1 min-w-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-4">
            <Link to={`/learn/${courseId}`} className="text-xs font-body transition-colors" style={{ color: '#D8C896' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#F8DC8A'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#D8C896'; }}
            >
              {course?.title ?? "Course"}
            </Link>
            <span className="text-xs" style={{ color: '#D8C896' }}>›</span>
            <span className="text-xs font-body" style={{ color: '#FFFFFF' }}>
              Lesson {currentIndex + 1} of {totalLessons}
            </span>
          </div>

          {/* Video player */}
          <div className="aspect-video w-full rounded-xl overflow-hidden mb-5" style={{ background: 'rgba(6,9,18,0.8)' }}>
            {videoType === "youtube" && lesson.video_url && (
              <iframe
                src={`https://www.youtube.com/embed/${extractYouTubeId(lesson.video_url)}?rel=0&modestbranding=1`}
                className="w-full h-full" allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            )}
            {videoType === "vimeo" && lesson.video_url && (
              <iframe
                src={`https://player.vimeo.com/video/${extractVimeoId(lesson.video_url)}`}
                className="w-full h-full" allowFullScreen
              />
            )}
            {videoType === "iframe" && lesson.video_url && (
              <iframe src={lesson.video_url} className="w-full h-full" allowFullScreen />
            )}
            {videoType === "html5" && lesson.video_url && (
              <video
                ref={videoRef}
                src={lesson.video_url}
                controls className="w-full h-full"
                onTimeUpdate={handleTimeUpdate}
              />
            )}
            {videoType === "none" && (
              <div className="w-full h-full flex items-center justify-center">
                <PlayCircle size={64} style={{ color: 'rgba(201,148,30,0.2)' }} />
              </div>
            )}
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 300,
            color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: '8px', lineHeight: 1.2,
          }}>
            {lesson.title}
          </h1>

          {/* Complete CTA / completed state */}
          {isCurrentCompleted ? (
            <div className="flex items-center gap-2 mt-2 mb-4">
              <CheckCircle size={18} style={{ color: '#3DD4A8' }} />
              <span className="text-sm font-body font-medium" style={{ color: '#3DD4A8' }}>Completed</span>
            </div>
          ) : (
            <Button
              onClick={handleMarkComplete}
              disabled={completeMutation.isPending || !userId}
              variant="gold"
              className="mt-3 mb-4"
            >
              <CheckCircle size={16} className="mr-2" />
              {completeMutation.isPending ? "Saving…" : "Mark Lesson Complete"}
            </Button>
          )}

          {/* Resource download */}
          {lesson.resource_url && (
            <a
              href={lesson.resource_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 font-body text-sm transition-colors mb-4"
              style={{ background: 'rgba(248,220,138,0.32)', border: '1px solid rgba(224,176,64,0.15)', color: '#F0E8D4' }}
            >
              <FileDown size={18} style={{ color: '#C9941E' }} />
              Download Resources
            </a>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4 mt-8 pt-6" style={{ borderTop: '1px solid rgba(248,220,138,0.34)' }}>
            {prevLesson ? (
              <Button asChild variant="ghost" className="font-body text-sm" style={{ color: '#D8C896' }}>
                <Link to={`/learn/${courseId}/${prevLesson.id}`}>
                  <ChevronLeft size={16} className="mr-1" /> Previous
                </Link>
              </Button>
            ) : <div />}

            {nextLesson ? (
              <Button
                asChild={isCurrentCompleted}
                disabled={!isCurrentCompleted}
                variant="gold"
                className="font-body"
              >
                {isCurrentCompleted ? (
                  <Link to={`/learn/${courseId}/${nextLesson.id}`}>
                    Next Lesson <ChevronRight size={16} className="ml-1" />
                  </Link>
                ) : (
                  <span className="opacity-50">Next Lesson <ChevronRight size={16} className="ml-1" /></span>
                )}
              </Button>
            ) : isCurrentCompleted ? (
              <Button asChild variant="gold" className="font-body">
                <Link to={`/learn/${courseId}`}>Back to Course</Link>
              </Button>
            ) : null}
          </div>
        </div>

        {/* ── RIGHT: sidebar (desktop) ── */}
        <aside className="hidden lg:block w-[260px] shrink-0">
          <p className="text-[11px] font-body font-semibold tracking-wider uppercase mb-3" style={{ color: '#D8C896' }}>
            Course Progress
          </p>
          <div style={{ height: '3px', borderRadius: 'var(--r-pill)', overflow: 'hidden', background: 'rgba(248,220,138,0.36)', marginBottom: '4px' }}>
            <div style={{
              height: '100%', borderRadius: 'var(--r-pill)',
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #8B6612, #E0B040, #F8DC8A)',
              transition: 'width 0.5s ease',
            }} />
          </div>
          <p className="text-xs font-body mb-6" style={{ color: '#D8C896' }}>
            {completedCount} of {totalLessons} lessons complete
          </p>

          <ol className="space-y-0.5 max-h-[60vh] overflow-y-auto pr-1">
            {allLessons.map((l, i) => {
              const isCurrent = l.id === lessonId;
              const isDone = completedIds.has(l.id);
              const locked = isLessonLocked(i);
              const duration = formatDuration(l.video_duration_seconds);

              return (
                <li key={l.id}>
                  {locked ? (
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs" style={{ color: '#D8C896', opacity: 0.5 }}>
                      <Lock size={14} className="shrink-0" />
                      <span className="flex-1 line-clamp-2 font-body">{l.title}</span>
                    </div>
                  ) : (
                    <Link
                      to={`/learn/${courseId}/${l.id}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-colors"
                      style={{
                        fontFamily: 'var(--font-body)',
                        background: isCurrent ? 'rgba(248,220,138,0.34)' : 'transparent',
                        borderLeft: isCurrent ? '2px solid #C9941E' : '2px solid transparent',
                        color: isDone ? '#D8C896' : '#FFFFFF',
                        fontWeight: isCurrent ? 500 : 400,
                      }}
                    >
                      {isDone ? (
                        <CheckCircle size={14} className="shrink-0" style={{ color: '#3DD4A8' }} />
                      ) : isCurrent ? (
                        <PlayCircle size={14} className="shrink-0" style={{ color: '#C9941E' }} />
                      ) : (
                        <Circle size={14} className="shrink-0" style={{ color: '#D8C896' }} />
                      )}
                      <span className={`flex-1 line-clamp-2 ${isDone ? "line-through" : ""}`}>
                        {l.title}
                      </span>
                      {duration && <span className="text-[11px] shrink-0" style={{ color: '#D8C896' }}>{duration}</span>}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </aside>

        {/* ── Mobile lesson progress bar ── */}
        <div className="lg:hidden mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-body font-semibold tracking-wider uppercase" style={{ color: '#D8C896' }}>
              Progress
            </span>
            <span className="text-xs font-body font-medium" style={{ color: '#F8DC8A' }}>{progressPct}%</span>
          </div>
          <div style={{ height: '3px', borderRadius: 'var(--r-pill)', overflow: 'hidden', background: 'rgba(248,220,138,0.36)' }}>
            <div style={{
              height: '100%', borderRadius: 'var(--r-pill)',
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #8B6612, #E0B040, #F8DC8A)',
              transition: 'width 0.5s ease',
            }} />
          </div>
          <p className="text-xs font-body mt-1" style={{ color: '#D8C896' }}>
            {completedCount} of {totalLessons} lessons complete
          </p>
        </div>
      </div>

      {/* ── Celebration modal ── */}
      <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
        <DialogContent className="max-w-md p-10 text-center" style={{
          background: 'rgba(11,31,58,0.98)', border: '1px solid rgba(201,148,30,0.25)',
          borderRadius: '16px',
        }}>
          <div className="mx-auto mb-4">
            <Trophy size={64} style={{ color: '#C9941E' }} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '30px', fontWeight: 300, color: '#F8DC8A', marginBottom: '8px' }}>
            Course Complete!
          </h2>
          <p className="text-sm font-body mb-1" style={{ color: '#FFFFFF' }}>
            {course?.title}
          </p>
          <p className="text-xs font-body mb-8" style={{ color: '#D8C896' }}>
            You have completed this course. Your achievement has been recorded.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/learn")} className="font-body" style={{ color: '#D8C896' }}>
              Back to Courses
            </Button>
            <Button variant="gold" onClick={() => navigate(`/learn/${courseId}`)}>
              View Course
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LessonPage;
