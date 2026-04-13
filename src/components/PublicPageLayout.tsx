import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import LotusIcon from "@/components/LotusIcon";

interface PublicPageLayoutProps {
  children: React.ReactNode;
}

const PublicPageLayout = ({ children }: PublicPageLayoutProps) => (
  <div className="min-h-screen bg-background flex flex-col">
    <div className="h-1 bg-accent w-full" />

    <div className="max-w-3xl mx-auto w-full px-6 py-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-body text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={14} />
        Back to home
      </Link>
    </div>

    <div className="flex-1 max-w-3xl mx-auto w-full px-6 pb-16">
      <div className="flex justify-center mb-8">
        <LotusIcon className="text-accent" size={40} />
      </div>
      {children}
    </div>

    <footer className="border-t border-border py-6 px-6">
      <div className="max-w-3xl mx-auto text-center space-y-2">
        <nav className="flex flex-wrap justify-center gap-4 text-xs font-body text-muted-foreground">
          <Link to="/ethics" className="hover:text-foreground transition-colors">Ethics &amp; Education Policy</Link>
          <span className="text-border">·</span>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <span className="text-border">·</span>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
        </nav>
        <p className="text-xs font-body text-muted-foreground/60"><p className="text-xs font-body text-muted-foreground/60">© 2026 Money Spirit</p></p>
      </div>
    </footer>
  </div>
);

export default PublicPageLayout;
