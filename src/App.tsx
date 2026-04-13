import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import CookieBanner from "@/components/CookieBanner";

const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PlatformLayout = lazy(() => import("./components/PlatformLayout"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Community = lazy(() => import("./pages/Community"));
const Forums = lazy(() => import("./pages/Forums"));
const Rituals = lazy(() => import("./pages/Rituals"));
const Learn = lazy(() => import("./pages/Learn"));
const CoursePage = lazy(() => import("./pages/CoursePage"));
const LessonPage = lazy(() => import("./pages/LessonPage"));
const Events = lazy(() => import("./pages/Events"));
const Members = lazy(() => import("./pages/Members"));
const Admin = lazy(() => import("./pages/Admin"));
const Ethics = lazy(() => import("./pages/Ethics"));
const Join = lazy(() => import("./pages/Join"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const NotFound = lazy(() => import("./pages/NotFound"));
const NotificationPreferences = lazy(() => import("./pages/NotificationPreferences"));

const queryClient = new QueryClient();

const LoadingSpinner = () => (
  <div style={{ minHeight: "100vh", background: "#061530", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div className="loading-spinner" />
  </div>
);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ErrorBoundary>
          <BrowserRouter>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/onboarding" element={<Onboarding />} />

                <Route element={<PlatformLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/forums" element={<Forums />} />
                  <Route path="/rituals" element={<Rituals />} />
                  <Route path="/learn" element={<Learn />} />
                  <Route path="/learn/:courseId" element={<CoursePage />} />
                  <Route path="/learn/:courseId/:lessonId" element={<LessonPage />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/members" element={<Members />} />
                  <Route path="/settings/notifications" element={<NotificationPreferences />} />
                </Route>

                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/:tabId" element={<Admin />} />
                <Route path="/join" element={<Join />} />
                <Route path="/ethics" element={<Ethics />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <CookieBanner />
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
