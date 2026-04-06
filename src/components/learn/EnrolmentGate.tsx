import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import LotusIcon from "@/components/LotusIcon";

interface EnrolmentGateProps {
  courseId: string;
  userId: string | null;
  title: string;
  description: string | null;
  lessonCount: number;
}

const EnrolmentGate = ({ courseId, userId, title, description, lessonCount }: EnrolmentGateProps) => {
  const queryClient = useQueryClient();

  const enrol = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Please log in to enrol.");
      const { error } = await supabase
        .from("course_enrollments")
        .insert({ course_id: courseId, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("You're enrolled! Welcome to the course.");
      queryClient.invalidateQueries({ queryKey: ["my_enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["enrolment_check"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not enrol. Please try again.");
    },
  });

  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="w-full max-w-lg rounded-lg bg-navy p-10 text-center">
        <LotusIcon size={48} className="text-gold mx-auto mb-6" />
        <h1 className="font-heading text-3xl text-cream mb-3">{title}</h1>
        {description && (
          <p className="font-body text-cream/70 mb-4 leading-relaxed">{description}</p>
        )}
        <p className="font-body text-sm text-cream/50 mb-8">
          {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"} included
        </p>
        <Button
          onClick={() => enrol.mutate()}
          disabled={enrol.isPending || !userId}
          className="bg-gold text-white hover:bg-gold/90 font-body text-base px-10 py-6"
        >
          {enrol.isPending ? "Enrolling..." : "Enrol Free and Begin"}
        </Button>
        {!userId && (
          <p className="font-body text-xs text-cream/40 mt-4">
            Please log in to enrol in this course.
          </p>
        )}
      </div>
    </div>
  );
};

export default EnrolmentGate;
