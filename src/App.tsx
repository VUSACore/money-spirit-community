import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/components/layout/LanguageContext";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import PlatformLayout from "./components/PlatformLayout.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Community from "./pages/Community.tsx";
import Forums from "./pages/Forums.tsx";
import Rituals from "./pages/Rituals.tsx";
import Learn from "./pages/Learn.tsx";
import CoursePage from "./pages/CoursePage.tsx";
import LessonPage from "./pages/LessonPage.tsx";
import Events from "./pages/Events.tsx";
import Members from "./pages/Members.tsx";
import Admin from "./pages/Admin.tsx";
import Ethics from "./pages/Ethics.tsx";
import Join from "./pages/Join.tsx";
import Privacy from "./pages/Privacy.tsx";
import Terms from "./pages/Terms.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/onboarding" element={<Onboarding />} />

            {/* Authenticated platform routes */}
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
            </Route>

            <Route path="/admin" element={<Admin />} />
            <Route path="/join" element={<Join />} />
            <Route path="/ethics" element={<Ethics />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
