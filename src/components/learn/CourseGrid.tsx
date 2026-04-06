import CourseCard from "./CourseCard";

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  lessonCount: number;
}

interface CourseGridProps {
  courses: Course[];
  enrolledIds: Set<string>;
}

const CourseGrid = ({ courses, enrolledIds }: CourseGridProps) => {
  if (courses.length === 0) {
    return <p className="text-navy/50 font-body">No courses available yet.</p>;
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
          isEnrolled={enrolledIds.has(course.id)}
          index={i}
        />
      ))}
    </div>
  );
};

export default CourseGrid;
