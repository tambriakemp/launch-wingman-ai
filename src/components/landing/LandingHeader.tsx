import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X, LogOut } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export const LandingHeader = () => {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    try {
      await signOut();
    } catch (e) {
      console.error("Sign out failed", e);
    }
    // Force a hard reload to fully clear auth state on the landing page
    window.location.href = "/";
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (isLanding) {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = `/#${id}`;
    }
  };

  const navLinks = [
    { id: "features", label: "Features" },
    { id: "how-it-works", label: "How it works" },
    { id: "pricing", label: "Pricing" },
    { id: "faq", label: "FAQ" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <div
        className={`max-w-5xl mx-auto bg-card hairline border rounded-full transition-all duration-300 ${
          scrolled ? "pill-shadow" : ""
        }`}
      >
        <div className="flex items-center justify-between pl-6 pr-3 py-2.5">
          {/* Wordmark */}
          <Link to="/" className="flex items-baseline gap-0">
            <span className="font-serif text-xl font-semibold text-foreground tracking-tight">
              Launchely
            </span>
            <span className="font-serif text-xl font-semibold text-accent">.</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-sm text-foreground/70 hover:text-foreground transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-2">
            {user ? (
              <>
                <Link
                  to="/app"
                  className="text-sm font-medium px-4 py-2 rounded-full bg-foreground text-background hover:opacity-90 transition-opacity"
                >
                  Go to App
                </Link>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-full text-foreground/60 hover:text-foreground hover:bg-muted"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="text-sm text-foreground/70 hover:text-foreground px-3 py-2 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/auth?tab=signup"
                  className="text-sm font-medium px-4 py-2 rounded-full border hairline text-foreground hover:bg-muted transition-colors"
                >
                  Start free
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="lg:hidden max-w-5xl mx-auto mt-2 bg-card hairline border rounded-2xl pill-shadow overflow-hidden"
          >
            <div className="p-4 space-y-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  className="block w-full text-left px-3 py-2.5 rounded-lg text-foreground hover:bg-muted text-sm"
                  onClick={() => scrollToSection(link.id)}
                >
                  {link.label}
                </button>
              ))}

              <div className="pt-3 mt-3 border-t hairline space-y-2">
                {user ? (
                  <>
                    <Link
                      to="/app"
                      className="block text-center px-4 py-2.5 rounded-full bg-foreground text-background text-sm font-medium"
                    >
                      Go to App
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-center px-4 py-2.5 rounded-full border hairline text-foreground text-sm font-medium"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/auth"
                      className="block text-center px-4 py-2.5 rounded-full border hairline text-foreground text-sm font-medium"
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/auth?tab=signup"
                      className="block text-center px-4 py-2.5 rounded-full bg-foreground text-background text-sm font-medium"
                    >
                      Start free
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
