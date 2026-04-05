import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

const Learn = () => {
  const queryClient = useQueryClient();
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
      return data;
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

  const enrolMutation = useMutation({
    mutationFn: async (courseId: string) => {
      if (!userId) throw new Error("Not logged in");
      const { error } = await supabase
        .from("course_enrollments")
        .insert({ course_id: courseId, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("You're enrolled! Welcome to the course.");
      queryClient.invalidateQueries({ queryKey: ["my_enrollments"] });
    },
    onError: (err: Error) => {
      if (err.message?.includes("duplicate") || err.message?.includes("unique")) {
        toast.error("You're already enrolled in this course.");
      } else {
        toast.error("Couldn't enrol — please try again.");
      }
    },
  });

  return (
    <div className="p-6 md:p-8 animate-fade-in">
      <h1 className="text-3xl font-heading text-navy mb-1">Learn</h1>
      <p className="text-navy/60 font-body mb-8">Explore courses and resources.</p>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse bg-muted h-48" />
          ))}
        </div>
      ) : !courses || courses.length === 0 ? (
        <p className="text-navy/50 font-body">No courses available yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const isEnrolled = enrollments?.has(course.id) ?? false;
            return (
              <Card key={course.id} className="animate-slide-up flex flex-col">
                {course.thumbnail_url && (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-40 object-cover rounded-t-lg"
                  />
                )}
                <CardHeader className="flex-1">
                  <CardTitle className="text-lg font-heading text-navy flex items-center gap-2">
                    <BookOpen size={18} className="text-gold shrink-0" />
                    {course.title}
                  </CardTitle>
                  {course.description && (
                    <CardDescription className="text-navy/60 font-body line-clamp-3">
                      {course.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardFooter>
                  {isEnrolled ? (
                    <Button disabled className="w-full font-body" variant="outline">
                      <CheckCircle size={16} className="mr-1.5 text-green-600" />
                      Enrolled
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-gold hover:bg-gold/90 text-white font-body"
                      onClick={() => enrolMutation.mutate(course.id)}
                      disabled={enrolMutation.isPending}
                    >
                      {enrolMutation.isPending ? "Enrolling…" : "Enrol"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Learn;
