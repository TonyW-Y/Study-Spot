import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/enhanced-button";

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center px-4">
      <div className="max-w-md text-center animate-fade-up">
        <div className="relative mx-auto mb-6 h-32 w-32">
          <div className="absolute inset-0 rounded-full bg-lamp/40 blur-2xl" />
          <div className="relative text-8xl animate-float" aria-hidden>🐈</div>
          <span className="absolute -right-2 top-0 text-3xl animate-wiggle" aria-hidden>❓</span>
        </div>
        <p className="font-display text-6xl font-bold text-primary">404</p>
        <h1 className="mt-2 text-2xl font-bold">This corner is empty</h1>
        <p className="mt-2 text-muted-foreground">
          Even our kitty couldn't find <code className="rounded bg-muted px-1.5 py-0.5 text-sm">{location.pathname}</code>.
          Let's get you back somewhere warm.
        </p>
        <Link to="/" className="mt-6 inline-block">
          <Button variant="hero" size="lg">Back to cozy spots</Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
