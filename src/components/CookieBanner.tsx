import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CookieBanner = () => {
  const [visible, setVisible] = useState(() => !localStorage.getItem("cookie_consent"));

  if (!visible) return null;

  const handle = (value: string) => {
    localStorage.setItem("cookie_consent", value);
    setVisible(false);
  };

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-[1000] bg-sidebar-background border-t border-accent/30 px-6 py-4 flex items-center gap-4 flex-wrap">
      <p className="flex-1 min-w-[200px] text-[13px] font-body text-sidebar-foreground/70">
        🍪 Money Spirit uses essential cookies to keep you signed in and remember your preferences. We do not use advertising or tracking cookies.{" "}
        <Link to="/privacy" className="text-accent hover:underline">Read our Privacy Policy</Link>
      </p>
      <div className="flex gap-2">
        <Button variant="gold" size="sm" onClick={() => handle("accepted")}>Accept</Button>
        <Button variant="ghost" size="sm" className="text-sidebar-foreground/60 hover:text-sidebar-foreground" onClick={() => handle("declined")}>Decline</Button>
      </div>
    </div>
  );
};

export default CookieBanner;
