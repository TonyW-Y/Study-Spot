import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { MapPin, Plus, User, LogIn, LogOut, Menu, X } from "lucide-react";
import { Button } from "./ui/enhanced-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApp } from "@/context/app-context";
import ThemeToggle from "./cozy/ThemeToggle";
import { cn } from "@/lib/utils";

export const Logo = () => (
  <Link to="/" className="group flex items-center gap-2.5" aria-label="StudySpot home">
    <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary text-xl shadow-md transition-transform group-hover:-rotate-6">
      <span className="absolute -top-2 left-3 flex gap-0.5" aria-hidden>
        <span className="block h-2.5 w-1 rounded-full bg-primary/40 animate-steam" />
        <span className="block h-2.5 w-1 rounded-full bg-primary/40 animate-steam [animation-delay:1s]" />
      </span>
      ☕
    </span>
    <span className="font-display text-xl font-bold tracking-tight">
      Study<span className="text-primary">Spot</span>
    </span>
  </Link>
);

const NAV = [
  { name: "Explore", href: "/", icon: MapPin },
  { name: "Add Spot", href: "/add", icon: Plus },
  { name: "Profile", href: "/profile", icon: User },
];

const initials = (name: string) => name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useApp();

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-all",
      isActive ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-accent hover:text-foreground"
    );

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-6" style={{ top: "env(safe-area-inset-top, 0px)" }}>
      <nav className="mx-auto max-w-7xl rounded-full border border-border/70 bg-card/80 px-3 py-2 shadow-md backdrop-blur-md supports-[backdrop-filter]:bg-card/65 sm:px-4">
        <div className="flex items-center justify-between gap-2">
          <Logo />

          <div className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <NavLink key={item.name} to={item.href} end={item.href === "/"} className={linkClass}>
                <item.icon className="h-4 w-4" />
                {item.name}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden md:block">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground shadow-md transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="Account menu"
                    >
                      {initials(user.name)}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                    <DropdownMenuLabel>
                      <div className="font-bold">{user.name}</div>
                      <div className="text-xs font-normal text-muted-foreground">{user.email}</div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => navigate("/profile")}>
                      <User className="mr-2 h-4 w-4" /> My profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" /> Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/login">
                  <Button variant="hero" size="sm" className="gap-2">
                    <LogIn className="h-4 w-4" /> Log in
                  </Button>
                </Link>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </nav>

      {open && (
        <div className="mx-auto mt-2 max-w-7xl rounded-3xl border border-border/70 bg-card/95 p-3 shadow-lg backdrop-blur-md animate-fade-up md:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map((item) => (
              <NavLink key={item.name} to={item.href} end={item.href === "/"} className={linkClass} onClick={() => setOpen(false)}>
                <item.icon className="h-4 w-4" />
                {item.name}
              </NavLink>
            ))}
            <div className="my-1 h-px bg-border" />
            {user ? (
              <button type="button" onClick={handleLogout} className={linkClass({ isActive: false })}>
                <LogOut className="h-4 w-4" /> Log out ({user.name.split(" ")[0]})
              </button>
            ) : (
              <NavLink to="/login" className={linkClass} onClick={() => setOpen(false)}>
                <LogIn className="h-4 w-4" /> Log in
              </NavLink>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
