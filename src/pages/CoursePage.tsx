import { useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import LessonSidebar from "@/components/learn/LessonSidebar";
import CourseOverview from "@/components/learn/CourseOverview";
import EnrolmentGate from "@/components/learn/EnrolmentGate";

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
        .from("courses")
        .select("*")
        .eq("id", courseId!)
        .single();
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
        .select("id, title, sort_order")
        .eq("course_id", courseId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const { data: isEnrolled, isLoading: enrolLoading } = useQuery({
    queryKey: ["enrolment_check", courseId, userId],
    enabled: !!userId && !!courseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_enrollments")
        .select("id")
        .eq("user_id", userId!)
        .eq("course_id", courseId!)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  const { data: progress } = useQuery({
    queryKey: ["lesson_progress", courseId, userId],
    enabled: !!userId && !!courseId && !!lessons,
    queryFn: async () => {
      const lessonIds = lessons?.map((l) => l.id) ?? [];
      if (lessonIds.length === 0) return new Set<string>();
      const { data, error } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId!)
        .eq("completed", true)
        .in("lesson_id", lessonIds);
      if (error) throw error;
      return new Set(data.map((p) => p.lesson_id));
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

  // Show enrolment gate if not enrolled
  if (!enrolLoading && !isEnrolled) {
    return (
      <div className="p-6 md:p-8">
        <EnrolmentGate
          courseId={course.id}
          userId={userId}
          title={course.title}
          description={course.description}
          lessonCount={lessons.length}
        />
      </div>
    );
  }

  const completedIds = progress ?? new Set<string>();

  return (
    <div className="p-6 md:p-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-8">
        <LessonSidebar courseId={course.id} lessons={lessons} completedIds={completedIds} />
        <CourseOverview
          title={course.title}
          description={course.description}
          totalLessons={lessons.length}
          completedCount={completedIds.size}
        />
      </div>
    </div>
  );
};

export default CoursePage;
