import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  sort_order: number;
}

interface LessonNavigationProps {
  courseId: string;
  lessonId: string;
  userId: string | null;
  lessons: Lesson[];
  completedIds: Set<string>;
}

const LessonNavigation = ({
  courseId,
  lessonId,
  userId,
  lessons,
  completedIds,
}: LessonNavigationProps) => {
  const queryClient = useQueryClient();
  const [justCompleted, setJustCompleted] = useState(false);

  const currentIndex = lessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;
  const isCompleted = completedIds.has(lessonId) || justCompleted;
  const completedCount = completedIds.size + (justCompleted && !completedIds.has(lessonId) ? 1 : 0);
  const pct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
  const isLastLesson = currentIndex === lessons.length - 1;
  const allDone = completedCount === lessons.length;

  const markComplete = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not logged in");
      const { error } = await supabase.from("lesson_progress").upsert(
        {
          lesson_id: lessonId,
          user_id: userId,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "lesson_id,user_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      setJustCompleted(true);
      toast.success("Lesson complete!");
      queryClient.invalidateQueries({ queryKey: ["lesson_progress"] });
    },
    onError: () => {
      toast.error("Could not save progress. Please try again.");
    },
  });

  return (
    <div className="mt-12 rounded-lg border border-border bg-cream p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-body text-sm text-navy/60">
            {completedCount} of {lessons.length} lessons complete
          </span>
          <span className="font-body text-sm font-medium text-navy">{pct}%</span>
        </div>
        <Progress value={pct} className="h-2 bg-gold/15 [&>div]:bg-gold" />
      </div>

      {allDone && isLastLesson && (
        <div className="text-center py-4 animate-celebration">
          <CheckCircle size={40} className="text-gold mx-auto mb-2" />
          <p className="font-heading text-xl text-navy">Course Complete!</p>
          <p className="font-body text-sm text-navy/60 mt-1">
            Congratulations on finishing every lesson.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 mt-2">
        {prevLesson ? (
          <Button asChild variant="outline" className="font-body border-navy/20 text-navy">
            <Link to={`/learn/${courseId}/${prevLesson.id}`}>
              <ChevronLeft size={16} className="mr-1" />
              Previous Lesson
            </Link>
          </Button>
        ) : (
          <div />
        )}

        {!isCompleted ? (
          <Button
            onClick={() => markComplete.mutate()}
            disabled={markComplete.isPending || !userId}
            className="bg-gold text-white hover:bg-gold/90 font-body"
          >
            {markComplete.isPending ? "Saving..." : "Mark Complete and Continue"}
          </Button>
        ) : nextLesson ? (
          <Button asChild className="bg-gold text-white hover:bg-gold/90 font-body">
            <Link to={`/learn/${courseId}/${nextLesson.id}`}>
              Next Lesson
              <ChevronRight size={16} className="ml-1" />
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default LessonNavigation;
