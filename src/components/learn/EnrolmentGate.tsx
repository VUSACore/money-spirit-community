import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BookOpen } from "lucide-react";

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
      // Use upsert to avoid duplicate enrollment errors
      const { error } = await supabase
        .from("course_enrollments")
        .upsert(
          { course_id: courseId, user_id: userId },
          { onConflict: "user_id,course_id" }
        );
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
      <div className="w-full max-w-lg text-center" style={{ padding: '48px 32px' }}>
        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{
          background: 'rgba(201,148,30,0.12)', border: '1px solid rgba(201,148,30,0.25)',
        }}>
          <BookOpen size={28} style={{ color: '#C9941E' }} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 300, color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: '12px' }}>
          {title}
        </h1>
        {description && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#D8C896', lineHeight: 1.6, marginBottom: '16px', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
            {description}
          </p>
        )}
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#D8C896', marginBottom: '32px' }}>
          {lessonCount} {lessonCount === 1 ? "lesson" : "lessons"} included
        </p>
        <Button
          onClick={() => enrol.mutate()}
          disabled={enrol.isPending || !userId}
          variant="gold"
          className="px-10 h-12 text-base"
        >
          {enrol.isPending ? "Enrolling…" : "Enrol Free and Begin"}
        </Button>
        {!userId && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#D8C896', marginTop: '16px' }}>
            Please log in to enrol in this course.
          </p>
        )}
      </div>
    </div>
  );
};

export default EnrolmentGate;
