import CourseCard from "./CourseCard";
import { BookOpen } from "lucide-react";
import EmptyState from "@/components/EmptyState";

interface Course {
  id: string;
  title: string;
  description: string | null;
  lessonCount: number;
  enrolledCount: number;
}

interface CourseGridProps {
  courses: Course[];
  enrolledIds: Set<string>;
  userId: string | null;
}

const CourseGrid = ({ courses, enrolledIds, userId }: CourseGridProps) => {
  if (courses.length === 0) {
    return <EmptyState icon={BookOpen} heading="New courses on the way" body="We're crafting learning experiences for your journey. Check back soon." />;
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course, i) => (
        <CourseCard
          key={course.id}
          id={course.id}
          title={course.title}
          description={course.description}
          lessonCount={course.lessonCount}
          enrolledCount={course.enrolledCount}
          isEnrolled={enrolledIds.has(course.id)}
          userId={userId}
          index={i}
        />
      ))}
    </div>
  );
};

export default CourseGrid;
