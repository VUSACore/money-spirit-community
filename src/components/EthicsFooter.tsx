import { Link } from "react-router-dom";

const EthicsFooter = () => (
  <footer className="py-6 text-center space-y-1">
    <div className="flex items-center justify-center gap-3 flex-wrap">
      <Link to="/ethics" className="text-xs font-body text-muted-foreground hover:underline">Ethics &amp; Education Policy</Link>
      <span className="text-muted-foreground/40">·</span>
      <Link to="/privacy" className="text-xs font-body text-muted-foreground hover:underline">Privacy</Link>
      <span className="text-muted-foreground/40">·</span>
      <Link to="/terms" className="text-xs font-body text-muted-foreground hover:underline">Terms</Link>
    </div>
    <p className="text-xs font-body text-muted-foreground/60">© 2026 Money Spirit</p>
  </footer>
);

export default EthicsFooter;
