import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { LaunchelyLogo } from "@/components/ui/LaunchelyLogo";

export const LandingHeader = () => {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (isLanding) {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = `/#${id}`;
    }
  };

  // On landing page: start transparent over dark hero, turn white on scroll
  // On other pages: always dark
  const showWhiteHeader = isLanding && scrolled;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        showWhiteHeader
          ? "bg-card/95 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-primary/95 backdrop-blur-md border-b border-border/10"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link to="/">
            <LaunchelyLogo textClassName={showWhiteHeader ? "text-foreground" : "text-primary-foreground"} />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            <button
              onClick={() => scrollToSection("features")}
              className={`font-medium transition-colors ${
                showWhiteHeader ? "text-foreground/70 hover:text-foreground" : "text-primary-foreground/80 hover:text-primary-foreground"
              }`}
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className={`font-medium transition-colors ${
                showWhiteHeader ? "text-foreground/70 hover:text-foreground" : "text-primary-foreground/80 hover:text-primary-foreground"
              }`}
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className={`font-medium transition-colors ${
                showWhiteHeader ? "text-foreground/70 hover:text-foreground" : "text-primary-foreground/80 hover:text-primary-foreground"
              }`}
            >
              Pricing
            </button>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <>
                <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link to="/app">Go to App</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className={showWhiteHeader ? "text-foreground hover:bg-muted" : "text-primary-foreground hover:bg-primary-foreground/10"}
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  asChild
                  className={showWhiteHeader ? "text-foreground hover:bg-muted" : "text-primary-foreground hover:bg-primary-foreground/10"}
                >
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link to="/auth?tab=signup">Get Started Free</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className={`lg:hidden p-2 ${showWhiteHeader ? "text-foreground" : "text-primary-foreground"}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-card border-t border-border"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              <button
                className="block w-full text-left py-2 text-foreground font-medium"
                onClick={() => scrollToSection("features")}
              >
                Features
              </button>
              <button
                className="block w-full text-left py-2 text-foreground font-medium"
                onClick={() => scrollToSection("how-it-works")}
              >
                How It Works
              </button>
              <Link to="/pricing" className="block py-2 text-foreground font-medium" onClick={() => setMobileMenuOpen(false)}>
                Pricing
              </Link>

              <div className="pt-4 border-t border-border space-y-2">
                {user ? (
                  <>
                    <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                      <Link to="/app">Go to App</Link>
                    </Button>
                    <Button variant="outline" onClick={handleSignOut} className="w-full">
                      <LogOut className="w-4 h-4 mr-2" /> Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" asChild className="w-full">
                      <Link to="/auth">Sign In</Link>
                    </Button>
                    <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                      <Link to="/auth?tab=signup">Get Started Free</Link>
                    </Button>
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
