import { useEffect, useState } from "react";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Flame, BookOpen, CheckCircle2, AlertCircle, GraduationCap, Sparkles, X, Home } from "lucide-react";
import NextSacredStep from "@/components/ai/NextSacredStep";
import type { Tables } from "@/integrations/supabase/types";
import { isProfileComplete, getProfileMissingFields } from "@/lib/profileCompletion";
import { archetypeName as archNames, archetypeAccent as archAccents } from "@/lib/profileConstants";
import { getCourseProgress, type CourseProgressSummary } from "@/lib/services/lessonService";
import { startOfWeek, endOfWeek, format } from "date-fns";

type Profile = Tables<"profiles">;

interface ActiveCourse {
  courseId: string;
  courseTitle: string;
  progress: CourseProgressSummary;
}

type RitualState = 
  | { status: "loading" }
  | { status: "no_ritual" }
  | { status: "incomplete"; title: string }
  | { status: "completed"; title: string };

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCourse, setActiveCourse] = useState<ActiveCourse | null>(null);
  const [allCoursesComplete, setAllCoursesComplete] = useState(false);
  const [noEnrollments, setNoEnrollments] = useState(false);
  const [ritualState, setRitualState] = useState<RitualState>({ status: "loading" });

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const uid = session.user.id;

      const { data } = await supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle();
      setProfile(data);

      // Fetch ritual state
      const now = new Date();
      const monday = startOfWeek(now, { weekStartsOn: 1 });
      const sunday = endOfWeek(now, { weekStartsOn: 1 });
      const start = format(monday, "yyyy-MM-dd");
      const end = format(sunday, "yyyy-MM-dd");

      const { data: currentRitual } = await supabase
        .from("rituals")
        .select("id, title")
        .gte("week_of", start)
        .lte("week_of", end)
        .eq("published", true)
        .limit(1)
        .maybeSingle();

      if (!currentRitual) {
        setRitualState({ status: "no_ritual" });
      } else {
        const { data: completion } = await supabase
          .from("ritual_completions")
          .select("id")
          .eq("user_id", uid)
          .eq("ritual_id", currentRitual.id)
          .maybeSingle();

        setRitualState(completion
          ? { status: "completed", title: currentRitual.title }
          : { status: "incomplete", title: currentRitual.title }
        );
      }

      // Fetch enrollments
      const { data: enrollments } = await supabase
        .from("course_enrollments")
        .select("course_id, completed_at")
        .eq("user_id", uid);

      if (!enrollments || enrollments.length === 0) {
        setNoEnrollments(true);
        setLoading(false);
        return;
      }

      const incomplete = enrollments.filter((e) => !e.completed_at);
      if (incomplete.length === 0) {
        setAllCoursesComplete(true);
        setLoading(false);
        return;
      }

      const courseId = incomplete[0].course_id;
      const { data: courseData } = await supabase
        .from("courses").select("title").eq("id", courseId).single();

      const progress = await getCourseProgress(uid, courseId);
      setActiveCourse({
        courseId,
        courseTitle: courseData?.title ?? "Course",
        progress,
      });

      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#C4973A', borderTopColor: 'transparent' }} />
          <p style={{ color: '#A08B62', fontSize: '14px', fontFamily: 'var(--font-body)' }}>Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <p style={{ color: '#A08B62', fontSize: '14px', fontFamily: 'var(--font-body)' }}>Unable to load your profile. Please try refreshing.</p>
      </div>
    );
  }

  const pathway = profile.pathway_type ?? "keeper";
  const archName = archNames[pathway] ?? "The Keeper";
  const accent = archAccents[pathway] ?? "#C9941E";
  const streak = profile.ritual_streak ?? 0;
  const profileComplete = isProfileComplete(profile);
  const missingFields = getProfileMissingFields(profile);

  let learningCta: { label: string; to: string; subtitle: string } | null = null;
  if (activeCourse) {
    const { progress, courseId, courseTitle } = activeCourse;
    if (progress.completed_lessons === 0) {
      learningCta = {
        label: "Start learning",
        to: progress.next_incomplete_lesson_id ? `/learn/${courseId}/${progress.next_incomplete_lesson_id}` : `/learn/${courseId}`,
        subtitle: courseTitle,
      };
    } else if (progress.next_incomplete_lesson_id) {
      learningCta = {
        label: "Continue learning",
        to: `/learn/${courseId}/${progress.next_incomplete_lesson_id}`,
        subtitle: `${courseTitle} — ${progress.percentage}% complete`,
      };
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8" style={{ padding: 'clamp(24px, 4vw, 40px) clamp(20px, 5vw, 48px)' }}>
      <SEOHead title="Dashboard — Money Spirit" />

      {/* Welcome heading */}
      <div className="ss-appear ss-appear-1">
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 300,
          letterSpacing: '-0.035em', color: '#F2EAD8', marginBottom: '6px', lineHeight: 1.1,
        }}>
          Welcome back, {profile.display_name}
        </h1>
        <p style={{ color: '#A08B62', fontSize: '14px', fontFamily: 'var(--font-body)' }}>
          Your personalised pathway to financial wellbeing
        </p>
      </div>

      {/* Profile completion card */}
      {!profileComplete && (
        <div className="ss-elevated ss-appear ss-appear-2" style={{ position: 'relative', padding: '24px 28px', borderLeft: '3px solid #C9941E' }}>
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0 mt-0.5" style={{ color: '#C9941E' }} />
            <div className="flex-1">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 400, color: '#F2EAD8', marginBottom: '6px' }}>
                Complete your profile
              </h3>
              <p style={{ color: '#A08B62', fontSize: '13px', lineHeight: 1.6, fontFamily: 'var(--font-body)', marginBottom: '12px' }}>
                Fill in the remaining details so other members can connect with you.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {missingFields.map((field) => (
                  <span key={field} className="text-[11px] font-body px-2.5 py-1 rounded-full" style={{
                    background: 'rgba(201,148,30,0.12)', border: '1px solid rgba(201,148,30,0.25)', color: '#EEC96E',
                  }}>
                    {field}
                  </span>
                ))}
              </div>
              <Button variant="gold" size="sm" asChild>
                <Link to="/profile">Complete Profile</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {profileComplete && (
        <div className="ss-appear ss-appear-2 flex items-center gap-2 px-4 py-3 rounded-xl" style={{
          background: 'rgba(39,174,143,0.08)', border: '1px solid rgba(39,174,143,0.20)',
        }}>
          <CheckCircle2 size={16} style={{ color: '#27AE8F' }} />
          <span className="text-[13px] font-body" style={{ color: '#27AE8F' }}>Profile complete</span>
        </div>
      )}

      {/* Archetype card */}
      <div className="ss-elevated ss-appear ss-appear-3" style={{ position: 'relative', padding: '28px 32px' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
          borderRadius: '22px 0 0 22px',
          background: `linear-gradient(180deg, transparent 0%, ${accent} 20%, ${accent} 80%, transparent 100%)`,
          boxShadow: `0 0 16px ${accent}4D`,
        }} />
        <div style={{ paddingLeft: '12px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 400,
            color: accent, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '8px',
          }}>
            {archName}
          </h2>
          <p style={{ color: '#D4C49A', fontSize: '14px', lineHeight: 1.70, fontFamily: 'var(--font-body)' }}>
            Your personalised {archName.toLowerCase()} pathway guides your financial wellbeing journey.
          </p>
        </div>
      </div>

      {/* Next Sacred Step AI widget */}
      {profile.onboarding_complete && (
        <div className="ss-appear ss-appear-4">
          <NextSacredStep userId={profile.user_id} profile={profile} />
        </div>
      )}

      {/* Two cards: Ritual + Learning */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ss-appear ss-appear-5">
        {/* Ritual card — live state */}
        <div className="ss-interactive flex flex-col items-start gap-4" style={{ padding: '22px 24px' }}>
          <div className="flex items-center gap-2">
            {ritualState.status === "completed" ? (
              <CheckCircle2 size={20} style={{ color: '#4DB89A' }} />
            ) : (
              <Sparkles size={20} style={{ color: '#C4973A' }} />
            )}
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '21px', fontWeight: 400, color: '#F2EAD8', letterSpacing: '-0.02em' }}>
              {ritualState.status === "completed" ? "Ritual complete" : "This week's ritual"}
            </span>
          </div>

          {ritualState.status === "loading" && (
            <p style={{ color: '#A08B62', fontSize: '13px', fontFamily: 'var(--font-body)' }}>Loading…</p>
          )}

          {ritualState.status === "no_ritual" && (
            <>
              <p style={{ color: '#A08B62', fontSize: '13px', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
                A new ritual will be published on Monday. Check back soon.
              </p>
              <Button variant="default" asChild><Link to="/rituals">View past rituals</Link></Button>
            </>
          )}

          {ritualState.status === "incomplete" && (
            <>
              <p style={{ color: '#D4C49A', fontSize: '14px', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
                {ritualState.title}
              </p>
              <Button variant="gold" asChild><Link to="/rituals">Complete it</Link></Button>
            </>
          )}

          {ritualState.status === "completed" && (
            <>
              <p style={{ color: '#4DB89A', fontSize: '13px', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
                {ritualState.title}
              </p>
              <Button variant="default" asChild><Link to="/rituals">View rituals</Link></Button>
            </>
          )}
        </div>

        {/* Learning card */}
        <div className="ss-interactive flex flex-col items-start gap-4" style={{ padding: '22px 24px' }}>
          <div className="flex items-center gap-2">
            <BookOpen size={20} style={{ color: '#C4973A' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '21px', fontWeight: 400, color: '#F2EAD8', letterSpacing: '-0.02em' }}>
              {learningCta ? learningCta.label : allCoursesComplete ? "Learning complete" : "Start learning"}
            </span>
          </div>
          {learningCta ? (
            <>
              <p style={{ color: '#A08B62', fontSize: '13px', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
                {learningCta.subtitle}
              </p>
              {activeCourse && activeCourse.progress.total_lessons > 0 && (
                <div className="w-full">
                  <div style={{ height: '3px', borderRadius: 'var(--r-pill)', overflow: 'hidden', background: 'rgba(196,151,58,0.12)' }}>
                    <div style={{
                      height: '100%', borderRadius: 'var(--r-pill)',
                      width: `${activeCourse.progress.percentage}%`,
                      background: 'linear-gradient(90deg, #8B6612 0%, #C4973A 50%, #EEC96E 100%)',
                      transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }} />
                  </div>
                </div>
              )}
              <Button variant="default" asChild><Link to={learningCta.to}>Go to lesson</Link></Button>
            </>
          ) : allCoursesComplete ? (
            <>
              <div className="flex items-center gap-2">
                <GraduationCap size={16} style={{ color: '#27AE8F' }} />
                <p style={{ color: '#27AE8F', fontSize: '13px', fontFamily: 'var(--font-body)' }}>All enrolled courses completed</p>
              </div>
              <Button variant="default" asChild><Link to="/learn">Browse courses</Link></Button>
            </>
          ) : noEnrollments ? (
            <>
              <p style={{ color: '#A08B62', fontSize: '13px', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
                Explore courses tailored to your {archName.toLowerCase()} journey.
              </p>
              <Button variant="default" asChild><Link to="/learn">Explore courses</Link></Button>
            </>
          ) : (
            <>
              <p style={{ color: '#A08B62', fontSize: '13px', lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
                Pick up where you left off on your learning path.
              </p>
              <Button variant="default" asChild><Link to="/learn">Go to lessons</Link></Button>
            </>
          )}
        </div>
      </div>

      {/* Streak badge */}
      {streak > 0 && (
        <div className="flex items-center gap-3 ss-appear ss-appear-6">
          <span
            className={streak >= 3 ? 'animate-streak-glow' : ''}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'rgba(196,151,58,0.09)',
              border: '1px solid rgba(196,151,58,0.22)',
              borderRadius: 'var(--r-pill)',
              padding: '7px 16px',
              boxShadow: 'inset 0 1px 0 rgba(238,201,110,0.10), 0 0 12px rgba(196,151,58,0.10)',
              fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500,
              color: '#EEC96E',
            }}
          >
            <Flame size={16} />
            {streak} week streak
          </span>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
