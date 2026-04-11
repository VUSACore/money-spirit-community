import { supabase } from "@/integrations/supabase/client";

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string | null;
  watch_position: number;
  completed: boolean;
  completed_at: string | null;
}

export interface CourseProgressSummary {
  total_lessons: number;
  completed_lessons: number;
  percentage: number;
  next_incomplete_lesson_id: string | null;
}

export async function getLessonProgress(
  userId: string,
  lessonId: string
): Promise<LessonProgress | null> {
  const { data, error } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();
  if (error) throw error;
  return data as LessonProgress | null;
}

export async function saveWatchPosition(
  userId: string,
  lessonId: string,
  courseId: string,
  position: number
): Promise<void> {
  const { error } = await supabase.from("lesson_progress").upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      course_id: courseId,
      watch_position: position,
    },
    { onConflict: "lesson_id,user_id" }
  );
  if (error) throw error;
}

export async function markLessonComplete(
  userId: string,
  lessonId: string,
  courseId: string
): Promise<boolean> {
  const { error } = await supabase.from("lesson_progress").upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      course_id: courseId,
      completed: true,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "lesson_id,user_id" }
  );
  if (error) throw error;

  // Check if all lessons in the course are complete
  const { count: totalCount } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId);

  const { count: completedCount } = await supabase
    .from("lesson_progress")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId)
    .eq("user_id", userId)
    .eq("completed", true);

  if (totalCount && completedCount && completedCount >= totalCount) {
    await supabase
      .from("course_enrollments")
      .update({ completed_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("course_id", courseId);
    return true; // course completed
  }
  return false;
}

export async function getCourseProgress(
  userId: string,
  courseId: string
): Promise<CourseProgressSummary> {
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, sort_order")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true });

  const allLessons = lessons ?? [];
  const total_lessons = allLessons.length;

  if (total_lessons === 0) {
    return { total_lessons: 0, completed_lessons: 0, percentage: 0, next_incomplete_lesson_id: null };
  }

  const { data: progressRows } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", userId)
    .eq("completed", true)
    .in("lesson_id", allLessons.map((l) => l.id));

  const completedSet = new Set((progressRows ?? []).map((p) => p.lesson_id));
  const completed_lessons = completedSet.size;
  const percentage = Math.round((completed_lessons / total_lessons) * 100);

  const next_incomplete_lesson_id =
    allLessons.find((l) => !completedSet.has(l.id))?.id ?? null;

  return { total_lessons, completed_lessons, percentage, next_incomplete_lesson_id };
}

export async function isLessonUnlocked(
  userId: string,
  lessonId: string,
  courseId: string
): Promise<boolean> {
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, sort_order")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true });

  if (!lessons || lessons.length === 0) return false;

  const currentLesson = lessons.find((l) => l.id === lessonId);
  if (!currentLesson) return false;

  // First lesson is always unlocked
  const currentIndex = lessons.findIndex((l) => l.id === lessonId);
  if (currentIndex === 0) return true;

  // Check if previous lesson is completed
  const prevLesson = lessons[currentIndex - 1];
  const { data } = await supabase
    .from("lesson_progress")
    .select("id")
    .eq("user_id", userId)
    .eq("lesson_id", prevLesson.id)
    .eq("completed", true)
    .maybeSingle();

  return !!data;
}
