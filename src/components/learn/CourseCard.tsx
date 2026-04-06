import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import LotusIcon from "@/components/LotusIcon";
import { toast } from "sonner";

interface CourseCardProps {
  id: string;
  title: string;
  description: string | null;
  lessonCount: number;
  enrolledCount: number;
  isEnrolled: boolean;
  userId: string | null;
  index: number;
}

const CourseCard = ({
  id,
  title,
  description,
  lessonCount,
  enrolledCount,
  isEnrolled,
  userId,
  index,
}: CourseCardProps) => {
  const queryClient = useQueryClient();

  const enrol = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Please log in first.");
      const { error } = await supabase
        .from("course_enrollments")
        .insert({ course_id: id, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Enrolled successfully!");
      queryClient.invalidateQueries({ queryKey: ["my_enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["published_courses"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not enrol.");
    },
  });

  const card = (
    <div
      className="group rounded-lg border border-stone-200 bg-white overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-gold animate-slide-up"
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: "both" }}
    >
      <div className="h-[120px] bg-navy flex items-center justify-center">
        <LotusIcon size={40} className="text-gold" />
      </div>

      <div className="p-5">
        <h3 className="font-heading text-lg text-navy mb-1 leading-snug font-semibold">{title}</h3>
        {description && (
          <p className="font-body text-sm text-navy/70 leading-relaxed mb-4 line-clamp-2">
            {description}
          </p>
        )}

        <div className="flex items-center gap-3 mb-4">
          <span className="font-body text-xs text-gold font-medium">
            {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"}
          </span>
          <span className="font-body text-xs text-navy/40">
            {enrolledCount} enrolled
          </span>
        </div>

        {isEnrolled ? (
          <Button asChild className="w-full bg-navy text-white hover:bg-gold hover:text-white font-body">
            <Link to={`/learn/${id}`}>Continue</Link>
          </Button>
        ) : (
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              enrol.mutate();
            }}
            disabled={enrol.isPending || !userId}
            className="w-full bg-gold text-white hover:bg-gold/90 font-body"
          >
            {enrol.isPending ? "Enrolling..." : "Enrol Free"}
          </Button>
        )}
      </div>
    </div>
  );

  if (isEnrolled) {
    return <Link to={`/learn/${id}`} className="block">{card}</Link>;
  }

  return card;
};

export default CourseCard;
