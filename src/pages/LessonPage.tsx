import { useParams, Navigate, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import EducationBanner from "@/components/EducationBanner";
import {
  CheckCircle, PlayCircle, Lock, Circle, FileDown,
  ChevronLeft, ChevronRight, Trophy,
} from "lucide-react";
import { toast } from "sonner";
import {
  getLessonProgress,
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
      if (courseCompleted) {
        setShowCelebration(true);
        queryClient.invalidateQueries({ queryKey: ["my_enrollments"] });
      }
    },
    onError: () => toast.error("Could not save progress."),
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
        <div className="animate-pulse bg-muted h-10 w-80 rounded mb-4" />
        <div className="animate-pulse bg-muted h-64 w-full rounded-lg" />
      </div>
    );
  }

  const videoType = detectVideoType(lesson.video_url);
  const formatDuration = (s: number | null) => {
    if (!s) return null;
    const m = Math.floor(s / 60);
    return `${m} min`;
  };

  return (
    <div className="p-4 md:p-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── LEFT: main content ── */}
        <div className="flex-1 min-w-0">
          {/* Video player */}
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-sidebar mb-5">
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
                <PlayCircle size={64} className="text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="font-heading text-2xl md:text-3xl text-primary mb-2 leading-tight">
            {lesson.title}
          </h1>

          {/* Manual complete button for iframes */}
          {videoType !== "html5" && videoType !== "none" && !isCurrentCompleted && (
            <Button
              onClick={handleMarkComplete}
              disabled={completeMutation.isPending || !userId}
              className="btn-gold rounded-lg font-body mt-3 mb-4"
            >
              <CheckCircle size={16} className="mr-2" />
              {completeMutation.isPending ? "Saving…" : "Mark Lesson Complete"}
            </Button>
          )}

          {isCurrentCompleted && (
            <div className="flex items-center gap-2 text-accent mt-1 mb-4">
              <CheckCircle size={18} />
              <span className="font-body text-sm font-medium">Completed</span>
            </div>
          )}

          {/* Resource download */}
          {lesson.resource_url && (
            <a
              href={lesson.resource_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-sidebar px-4 py-2.5 font-body text-sm text-primary-foreground hover:border-accent transition-colors mb-4"
            >
              <FileDown size={18} className="text-accent" />
              Download Resources
            </a>
          )}

          {/* Education banner */}
          <div className="my-6">
            <EducationBanner />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4 mt-8">
            {prevLesson ? (
              <Button asChild variant="ghost" className="font-body text-primary-foreground">
                <Link to={`/learn/${courseId}/${prevLesson.id}`}>
                  <ChevronLeft size={16} className="mr-1" /> Previous
                </Link>
              </Button>
            ) : <div />}

            {nextLesson ? (
              <Button
                asChild={isCurrentCompleted}
                disabled={!isCurrentCompleted}
                className="btn-gold rounded-lg font-body"
              >
                {isCurrentCompleted ? (
                  <Link to={`/learn/${courseId}/${nextLesson.id}`}>
                    Next Lesson <ChevronRight size={16} className="ml-1" />
                  </Link>
                ) : (
                  <span>Next Lesson <ChevronRight size={16} className="ml-1" /></span>
                )}
              </Button>
            ) : null}
          </div>
        </div>

        {/* ── RIGHT: sidebar ── */}
        <aside className="hidden lg:block w-[280px] shrink-0">
          <h3 className="font-body text-sm text-primary-foreground/70 font-medium mb-3">
            Course Progress
          </h3>
          <div className="w-full h-1.5 rounded-full bg-sidebar-border overflow-hidden mb-1">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="font-body text-xs text-muted-foreground mb-6">
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
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded font-body text-xs text-muted-foreground/50 cursor-not-allowed">
                      <Lock size={16} className="shrink-0" />
                      <span className="flex-1 line-clamp-2">{l.title}</span>
                      {duration && <span className="text-[11px] shrink-0">{duration}</span>}
                    </div>
                  ) : (
                    <Link
                      to={`/learn/${courseId}/${l.id}`}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded font-body text-xs transition-colors ${
                        isCurrent
                          ? "bg-sidebar-accent border-l-2 border-accent text-primary-foreground font-medium"
                          : isDone
                          ? "text-muted-foreground hover:bg-sidebar-accent/50"
                          : "text-primary-foreground/80 hover:bg-sidebar-accent/50"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle size={16} className="text-accent shrink-0" />
                      ) : isCurrent ? (
                        <PlayCircle size={16} className="text-accent shrink-0" />
                      ) : (
                        <Circle size={16} className="shrink-0 text-muted-foreground" />
                      )}
                      <span className={`flex-1 line-clamp-2 ${isDone ? "line-through" : ""}`}>
                        {l.title}
                      </span>
                      {duration && <span className="text-[11px] text-muted-foreground shrink-0">{duration}</span>}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </aside>
      </div>

      {/* ── Celebration modal ── */}
      <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
        <DialogContent className="bg-sidebar border-accent text-center max-w-md p-10">
          <div className="animate-celebration-icon mx-auto mb-4">
            <Trophy size={64} className="text-accent" />
          </div>
          <h2 className="font-heading text-3xl text-accent mb-2">Course Complete!</h2>
          <p className="font-body text-sm text-primary-foreground/80 mb-1">
            {course?.title}
          </p>
          <p className="font-body text-xs text-muted-foreground mb-8">
            You have completed this course. Your achievement has been recorded and your badge has been awarded.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/learn")} className="font-body text-primary-foreground">
              Back to Courses
            </Button>
            <Button className="btn-gold rounded-lg font-body" onClick={() => navigate("/members")}>
              View My Badges
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LessonPage;
