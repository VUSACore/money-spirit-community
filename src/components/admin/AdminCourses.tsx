import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, GripVertical, Check } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import type { Tables } from "@/integrations/supabase/types";

type Course = Tables<"courses"> & { lesson_count?: number; enrolled_count?: number };
type Lesson = Tables<"lessons">;

const logAudit = async (action: string, targetType: string, targetId: string, metadata: Record<string, unknown> = {}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("audit_logs").insert({
    action, actor_id: user.id, target_type: targetType, target_id: targetId, metadata,
  });
};

const AdminCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [courseModal, setCourseModal] = useState<Partial<Course> | null>(null);
  const [lessonModal, setLessonModal] = useState<{ courseId: string; lesson?: Partial<Lesson> } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "course" | "lesson"; id: string; name: string } | null>(null);
  const { toast } = useToast();

  const loadCourses = async () => {
    const { data: coursesData } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
    if (!coursesData) { setLoading(false); return; }
    const enriched = await Promise.all(coursesData.map(async (c) => {
      const [{ count: lc }, { count: ec }] = await Promise.all([
        supabase.from("lessons").select("id", { count: "exact", head: true }).eq("course_id", c.id),
        supabase.from("course_enrollments").select("id", { count: "exact", head: true }).eq("course_id", c.id),
      ]);
      return { ...c, lesson_count: lc || 0, enrolled_count: ec || 0 };
    }));
    setCourses(enriched);
    setLoading(false);
  };

  const loadLessons = async (courseId: string) => {
    const { data } = await supabase.from("lessons").select("*").eq("course_id", courseId).order("sort_order");
    setLessons(prev => ({ ...prev, [courseId]: data || [] }));
  };

  useEffect(() => { loadCourses(); }, []);

  const toggleExpand = (courseId: string) => {
    if (expanded === courseId) { setExpanded(null); return; }
    setExpanded(courseId);
    if (!lessons[courseId]) loadLessons(courseId);
  };

  const togglePublish = async (c: Course) => {
    // Prevent publishing a course with no lessons
    if (!c.published && (c.lesson_count || 0) === 0) {
      toast({ title: "Cannot publish", description: "Add at least one lesson before publishing.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("courses").update({ published: !c.published }).eq("id", c.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setCourses(prev => prev.map(x => x.id === c.id ? { ...x, published: !c.published } : x));
    await logAudit(c.published ? "course_unpublish" : "course_publish", "course", c.id, { title: c.title });
    toast({ title: c.published ? "Course unpublished" : "Course published" });
  };

  const saveCourse = async () => {
    if (!courseModal) return;
    if (!courseModal.title?.trim()) {
      toast({ title: "Title required", description: "Enter a course title.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const isEdit = !!courseModal.id;
    if (isEdit) {
      const { error } = await supabase.from("courses").update({
        title: courseModal.title!.trim(),
        description: courseModal.description || null,
        thumbnail_url: courseModal.thumbnail_url || null,
        published: courseModal.published ?? false,
      }).eq("id", courseModal.id!);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSaving(false); return; }
      await logAudit("course_update", "course", courseModal.id!, { title: courseModal.title });
      toast({ title: "Course updated" });
    } else {
      const { data, error } = await supabase.from("courses").insert({
        title: courseModal.title!.trim(),
        description: courseModal.description || null,
        thumbnail_url: courseModal.thumbnail_url || null,
        published: false, // Always start as draft
        created_by: user.id,
      }).select("id").single();
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSaving(false); return; }
      await logAudit("course_create", "course", data.id, { title: courseModal.title });
      toast({ title: "Course created as draft" });
    }
    setSaving(false);
    setCourseModal(null);
    loadCourses();
  };

  const saveLesson = async () => {
    if (!lessonModal) return;
    const { courseId, lesson } = lessonModal;
    if (!lesson?.title?.trim()) {
      toast({ title: "Title required", description: "Enter a lesson title.", variant: "destructive" });
      return;
    }
    setSaving(true);

    const isEdit = !!lesson?.id;
    if (isEdit) {
      const { error } = await supabase.from("lessons").update({
        title: lesson!.title!.trim(),
        video_url: lesson!.video_url || null,
        resource_url: lesson!.resource_url || null,
        video_duration_seconds: lesson!.video_duration_seconds ?? null,
        sort_order: lesson!.sort_order ?? 0,
      }).eq("id", lesson!.id!);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSaving(false); return; }
      await logAudit("lesson_update", "lesson", lesson!.id!, { title: lesson!.title, course_id: courseId });
      toast({ title: "Lesson updated" });
    } else {
      const { data, error } = await supabase.from("lessons").insert({
        course_id: courseId,
        title: lesson?.title?.trim() || "",
        video_url: lesson?.video_url || null,
        resource_url: lesson?.resource_url || null,
        video_duration_seconds: lesson?.video_duration_seconds ?? null,
        sort_order: lesson?.sort_order ?? 0,
      }).select("id").single();
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSaving(false); return; }
      await logAudit("lesson_create", "lesson", data.id, { title: lesson?.title, course_id: courseId });
      toast({ title: "Lesson created" });
    }
    setSaving(false);
    setLessonModal(null);
    loadLessons(courseId);
    loadCourses();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "course") {
      const { error } = await supabase.from("courses").delete().eq("id", deleteTarget.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setDeleteTarget(null); return; }
      await logAudit("course_delete", "course", deleteTarget.id, { title: deleteTarget.name });
      toast({ title: "Course deleted" });
      loadCourses();
    } else {
      const { error } = await supabase.from("lessons").delete().eq("id", deleteTarget.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setDeleteTarget(null); return; }
      await logAudit("lesson_delete", "lesson", deleteTarget.id, { title: deleteTarget.name });
      toast({ title: "Lesson deleted" });
      if (expanded) loadLessons(expanded);
      loadCourses();
    }
    setDeleteTarget(null);
  };

  const publishBadge = (published: boolean, lessonCount: number) => {
    if (published) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-body" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}><Check size={10} /> Live</span>;
    if (lessonCount === 0) return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-body" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>Empty draft</span>;
    return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-body" style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-3)" }}>Draft</span>;
  };

  if (loading) return <p className="text-muted-foreground font-body">Loading courses…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 300, color: "var(--text-1)", letterSpacing: "-0.03em" }}>Courses</h2>
        <Button variant="gold" onClick={() => setCourseModal({ title: "", published: false })}>
          <Plus size={16} /> New Course
        </Button>
      </div>

      {courses.length === 0 ? (
        <EmptyState icon={Plus} iconClassName="text-gold" heading="No courses yet" body="Create your first course to get started." />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-body w-8" />
                <TableHead className="font-body">Title</TableHead>
                <TableHead className="font-body">Lessons</TableHead>
                <TableHead className="font-body">Enrolled</TableHead>
                <TableHead className="font-body">Status</TableHead>
                <TableHead className="font-body">Created</TableHead>
                <TableHead className="font-body w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map(c => (
                <>
                  <TableRow key={c.id}>
                    <TableCell>
                      <button onClick={() => toggleExpand(c.id)} className="text-muted-foreground hover:text-foreground">
                        {expanded === c.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </TableCell>
                    <TableCell className="font-body font-medium">{c.title}</TableCell>
                    <TableCell className="font-body text-muted-foreground">{c.lesson_count}</TableCell>
                    <TableCell className="font-body text-muted-foreground">{c.enrolled_count}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {publishBadge(c.published, c.lesson_count || 0)}
                        <Switch checked={c.published} onCheckedChange={() => togglePublish(c)} />
                      </div>
                    </TableCell>
                    <TableCell className="font-body text-sm text-muted-foreground">{format(new Date(c.created_at), "d MMM yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setCourseModal(c)}><Pencil size={14} /></Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteTarget({ type: "course", id: c.id, name: c.title })}><Trash2 size={14} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expanded === c.id && (
                    <TableRow key={`${c.id}-lessons`}>
                      <TableCell colSpan={7} className="bg-muted/30 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-heading text-sm text-primary">Lessons ({(lessons[c.id] || []).length})</h4>
                          <Button variant="outline" size="sm" onClick={() => setLessonModal({ courseId: c.id, lesson: { title: "", sort_order: (lessons[c.id]?.length || 0) + 1 } })}>
                            <Plus size={14} /> Add Lesson
                          </Button>
                        </div>
                        {(lessons[c.id] || []).length === 0 ? (
                          <p className="text-sm text-muted-foreground font-body py-4 text-center">No lessons yet — add one to get started</p>
                        ) : (
                          <div className="space-y-2">
                            {(lessons[c.id] || []).map(l => (
                              <div key={l.id} className="flex items-center justify-between bg-background rounded-lg px-3 py-2 border border-border">
                                <div className="flex items-center gap-3">
                                  <GripVertical size={14} className="text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground font-body w-6">{l.sort_order}</span>
                                  <span className="font-body text-sm">{l.title}</span>
                                  {l.video_url && <span className="text-xs text-muted-foreground truncate max-w-[200px]">🎬 Video</span>}
                                  {l.resource_url && <span className="text-xs text-muted-foreground">📎 Resource</span>}
                                </div>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => setLessonModal({ courseId: c.id, lesson: l })}><Pencil size={12} /></Button>
                                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteTarget({ type: "lesson", id: l.id, name: l.title })}><Trash2 size={12} /></Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Course Form Modal */}
      <Dialog open={!!courseModal} onOpenChange={open => !open && setCourseModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-primary">{courseModal?.id ? "Edit Course" : "New Course"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="font-body text-sm">Title *</Label>
              <Input className="ms-input mt-1" value={courseModal?.title || ""} onChange={e => setCourseModal(prev => ({ ...prev!, title: e.target.value }))} placeholder="e.g. Foundations of Wealth" />
            </div>
            <div>
              <Label className="font-body text-sm">Description</Label>
              <Textarea className="ms-input mt-1" rows={3} value={courseModal?.description || ""} onChange={e => setCourseModal(prev => ({ ...prev!, description: e.target.value }))} placeholder="What will members learn?" />
            </div>
            <div>
              <Label className="font-body text-sm">Thumbnail URL</Label>
              <Input className="ms-input mt-1" value={courseModal?.thumbnail_url || ""} onChange={e => setCourseModal(prev => ({ ...prev!, thumbnail_url: e.target.value }))} placeholder="https://..." />
            </div>
            {courseModal?.id && (
              <div className="flex items-center gap-3">
                <Switch checked={courseModal?.published ?? false} onCheckedChange={v => setCourseModal(prev => ({ ...prev!, published: v }))} />
                <Label className="font-body text-sm">Published</Label>
              </div>
            )}
            {!courseModal?.id && (
              <p className="text-xs font-body text-muted-foreground">New courses start as drafts. Publish from the list after adding lessons.</p>
            )}
            <Button variant="gold" className="w-full" disabled={saving || !courseModal?.title?.trim()} onClick={saveCourse}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lesson Form Modal */}
      <Dialog open={!!lessonModal} onOpenChange={open => !open && setLessonModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-primary">{lessonModal?.lesson?.id ? "Edit Lesson" : "New Lesson"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="font-body text-sm">Title *</Label>
              <Input className="ms-input mt-1" value={lessonModal?.lesson?.title || ""} onChange={e => setLessonModal(prev => prev ? { ...prev, lesson: { ...prev.lesson, title: e.target.value } } : null)} placeholder="Lesson title" />
            </div>
            <div>
              <Label className="font-body text-sm">Video URL</Label>
              <Input className="ms-input mt-1" value={lessonModal?.lesson?.video_url || ""} onChange={e => setLessonModal(prev => prev ? { ...prev, lesson: { ...prev.lesson, video_url: e.target.value } } : null)} placeholder="https://youtube.com/..." />
            </div>
            <div>
              <Label className="font-body text-sm">Resource URL</Label>
              <Input className="ms-input mt-1" value={lessonModal?.lesson?.resource_url || ""} onChange={e => setLessonModal(prev => prev ? { ...prev, lesson: { ...prev.lesson, resource_url: e.target.value } } : null)} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-body text-sm">Sort Order</Label>
                <Input className="ms-input mt-1" type="number" value={lessonModal?.lesson?.sort_order ?? 0} onChange={e => setLessonModal(prev => prev ? { ...prev, lesson: { ...prev.lesson, sort_order: parseInt(e.target.value) || 0 } } : null)} />
              </div>
              <div>
                <Label className="font-body text-sm">Duration (seconds)</Label>
                <Input className="ms-input mt-1" type="number" value={lessonModal?.lesson?.video_duration_seconds ?? ""} onChange={e => setLessonModal(prev => prev ? { ...prev, lesson: { ...prev.lesson, video_duration_seconds: parseInt(e.target.value) || null } } : null)} placeholder="e.g. 600" />
              </div>
            </div>
            <Button variant="gold" className="w-full" disabled={saving || !lessonModal?.lesson?.title?.trim()} onClick={saveLesson}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-destructive">Delete {deleteTarget?.type}?</DialogTitle>
          </DialogHeader>
          <p className="font-body text-sm text-muted-foreground">
            Are you sure you want to delete "{deleteTarget?.name}"? This cannot be undone.
            {deleteTarget?.type === "course" && " All lessons and enrollments will also be removed."}
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" onClick={confirmDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCourses;