import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import Events from "./pages/Events.tsx";
import Members from "./pages/Members.tsx";
import Admin from "./pages/Admin.tsx";
import Ethics from "./pages/Ethics.tsx";
import Join from "./pages/Join.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
            <Route path="/events" element={<Events />} />
            <Route path="/members" element={<Members />} />
          </Route>

          <Route path="/admin" element={<Admin />} />
          <Route path="/ethics" element={<Ethics />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
