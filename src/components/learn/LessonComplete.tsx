import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface LessonCompleteProps {
  lessonId: string;
  userId: string | null;
  isCompleted: boolean;
  nextLessonUrl?: string | null;
}

const LessonComplete = ({ lessonId, userId, isCompleted, nextLessonUrl }: LessonCompleteProps) => {
  const queryClient = useQueryClient();
  const [celebrated, setCelebrated] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not logged in");
      const { error } = await supabase.from("lesson_progress").upsert(
        { lesson_id: lessonId, user_id: userId, completed: true, completed_at: new Date().toISOString() },
        { onConflict: "lesson_id,user_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      setCelebrated(true);
      toast.success("Lesson complete! 🎉");
      queryClient.invalidateQueries({ queryKey: ["lesson_progress"] });
    },
    onError: () => {
      toast.error("Couldn't mark complete — please try again.");
    },
  });

  if (isCompleted || celebrated) {
    return (
      <div className="my-10 text-center animate-celebration">
        <CheckCircle size={48} className="text-gold mx-auto mb-3" />
        <p className="font-heading text-xl text-navy mb-4">Lesson Complete!</p>
        {nextLessonUrl && (
          <Button asChild className="bg-gold text-white hover:bg-gold/90 font-body">
            <a href={nextLessonUrl}>Next Lesson →</a>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="my-10">
      <Button
        className="w-full bg-gold text-white hover:bg-gold/90 font-body text-base py-6"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !userId}
      >
        {mutation.isPending ? "Saving…" : "Mark Lesson Complete"}
      </Button>
    </div>
  );
};

export default LessonComplete;
