import LotusIcon from "@/components/LotusIcon";

const ErrorPage = () => (
  <div className="min-h-screen bg-sidebar-background flex flex-col items-center justify-center px-6 text-center">
    <LotusIcon className="text-accent" size={36} />
    <p className="font-heading text-2xl text-accent mt-4 tracking-wide">Money Spirit</p>
    <p className="font-heading italic text-sm text-sidebar-foreground/50 mb-8">Spirit Inspired Freedom</p>

    <p className="font-heading text-[120px] leading-none text-accent/30 select-none">500</p>
    <h1 className="font-heading text-[32px] text-sidebar-foreground mt-2">Something unexpected happened</h1>
    <p className="font-body text-base text-sidebar-foreground/60 max-w-[400px] mt-3 leading-relaxed">
      We are sorry for the interruption. Our team has been notified. Please try refreshing the page or come back shortly.
    </p>
    <button
      onClick={() => window.location.reload()}
      className="btn-gold mt-8 px-8 py-3 rounded-lg font-body font-semibold text-sm"
    >
      Refresh Page
    </button>
  </div>
);

export default ErrorPage;
