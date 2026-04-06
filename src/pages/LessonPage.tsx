import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import LessonSidebar from "@/components/learn/LessonSidebar";
import ComparisonCards from "@/components/learn/ComparisonCards";
import StepGuide from "@/components/learn/StepGuide";
import CurrencyCalculator from "@/components/learn/CurrencyCalculator";
import LessonComplete from "@/components/learn/LessonComplete";
import EducationBanner from "@/components/EducationBanner";

const LessonPage = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  const { data: lesson } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("id", lessonId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!lessonId,
  });

  const { data: allLessons } = useQuery({
    queryKey: ["lessons", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("id, title, sort_order")
        .eq("course_id", courseId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const { data: progress } = useQuery({
    queryKey: ["lesson_progress", courseId, userId],
    enabled: !!userId && !!courseId && !!allLessons,
    queryFn: async () => {
      const ids = allLessons?.map((l) => l.id) ?? [];
      if (ids.length === 0) return new Set<string>();
      const { data, error } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId!)
        .eq("completed", true)
        .in("lesson_id", ids);
      if (error) throw error;
      return new Set(data.map((p) => p.lesson_id));
    },
  });

  if (!lesson || !allLessons) {
    return (
      <div className="p-6 md:p-8 animate-fade-in">
        <div className="animate-pulse bg-muted h-10 w-80 rounded mb-4" />
        <div className="animate-pulse bg-muted h-4 w-full max-w-lg rounded" />
      </div>
    );
  }

  const completedIds = progress ?? new Set<string>();
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
  const nextLessonUrl = nextLesson ? `/learn/${courseId}/${nextLesson.id}` : null;
  const isCompleted = completedIds.has(lessonId!);

  return (
    <div className="p-6 md:p-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-8">
        <LessonSidebar courseId={courseId!} lessons={allLessons} completedIds={completedIds} />

        <div className="flex-1 max-w-3xl">
          {/* Hero */}
          <header className="mb-10">
            <h1 className="font-heading text-4xl lg:text-5xl text-navy mb-3 leading-tight">
              {lesson.title}
            </h1>
            <p className="font-body text-navy/60 text-lg mb-2">
              Two trusted tools. One clear guide. Your family gets more.
            </p>
            <span className="font-body text-sm italic text-gold">8 min read</span>
          </header>

          {/* Intro */}
          <section className="mb-10">
            <p className="font-body text-navy/70 leading-relaxed max-w-2xl">
              Wise and Remitly are trusted by millions of migrant women globally for safe, low-fee
              international transfers. Whether you're sending money home to family, supporting loved
              ones through education, or building financial stability across borders — these tools
              help you keep more of what you earn.
            </p>
          </section>

          <EducationBanner />

          <ComparisonCards />

          <StepGuide />

          <CurrencyCalculator />

          <LessonComplete
            lessonId={lessonId!}
            userId={userId}
            isCompleted={isCompleted}
            nextLessonUrl={nextLessonUrl}
          />
        </div>
      </div>
    </div>
  );
};

export default LessonPage;
