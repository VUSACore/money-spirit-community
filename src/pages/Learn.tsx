import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import CourseGrid from "@/components/learn/CourseGrid";

const Learn = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  const { data: courses, isLoading } = useQuery({
    queryKey: ["published_courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, description, thumbnail_url")
        .eq("published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const ids = data.map((c) => c.id);

      // Fetch lesson counts
      const { data: lessons } = await supabase
        .from("lessons")
        .select("course_id")
        .in("course_id", ids);

      const lessonCountMap: Record<string, number> = {};
      lessons?.forEach((l) => {
        lessonCountMap[l.course_id] = (lessonCountMap[l.course_id] || 0) + 1;
      });

      // Fetch enrolled counts
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("course_id")
        .in("course_id", ids);

      const enrolledCountMap: Record<string, number> = {};
      enrollments?.forEach((e) => {
        enrolledCountMap[e.course_id] = (enrolledCountMap[e.course_id] || 0) + 1;
      });

      return data.map((c) => ({
        ...c,
        lessonCount: lessonCountMap[c.id] || 0,
        enrolledCount: enrolledCountMap[c.id] || 0,
      }));
    },
  });

  const { data: enrollments } = useQuery({
    queryKey: ["my_enrollments", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_enrollments")
        .select("course_id")
        .eq("user_id", userId!);
      if (error) throw error;
      return new Set(data.map((e) => e.course_id));
    },
  });

  return (
    <div className="p-6 md:p-8 animate-fade-in">
      <h1 className="font-heading text-3xl text-navy mb-1">Learn</h1>
      <p className="font-body text-navy/60 mb-10">Explore courses and resources.</p>

      {isLoading ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-muted h-64 rounded-lg" />
          ))}
        </div>
      ) : (
        <CourseGrid
          courses={courses || []}
          enrolledIds={enrollments ?? new Set()}
          userId={userId}
        />
      )}
    </div>
  );
};

export default Learn;
