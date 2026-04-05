import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

const Learn = () => {
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
          {courses.map((course) => (
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
                <Button className="w-full bg-gold hover:bg-gold/90 text-white font-body">
                  Enrol
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Learn;
