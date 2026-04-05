import { Link } from "react-router-dom";

const EthicsFooter = () => (
  <footer className="py-6 text-center space-y-1">
    <Link to="/ethics" className="text-xs font-body text-muted-foreground hover:underline">
      Ethics &amp; Education Policy
    </Link>
    <p className="text-xs font-body text-muted-foreground/60">© 2025 Money Spirit</p>
  </footer>
);

export default EthicsFooter;
