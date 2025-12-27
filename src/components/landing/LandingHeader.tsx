import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, ClipboardCheck, Layout, Palette, MessageSquare, Rocket, LogOut, Package, BarChart3, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const featureLinks = [
  {
    title: "Assessments",
    description: "Find your launch readiness",
    href: "/features/assessments",
    icon: ClipboardCheck,
  },
  {
    title: "Plan",
    description: "Build your funnel foundation",
    href: "/features/plan",
    icon: Layout,
  },
  {
    title: "Branding",
    description: "Professional visuals, fast",
    href: "/features/branding",
    icon: Palette,
  },
  {
    title: "Messaging",
    description: "AI-powered copy that converts",
    href: "/features/messaging",
    icon: MessageSquare,
  },
  {
    title: "Execute",
    description: "Manage and launch",
    href: "/features/execute",
    icon: Rocket,
  },
  {
    title: "Content Vault",
    description: "Templates & resources library",
    href: "/features/content-vault",
    icon: Package,
  },
  {
    title: "Insights",
    description: "Track your launch metrics",
    href: "/features/insights",
    icon: BarChart3,
  },
  {
    title: "Relaunch",
    description: "Iterate on past launches",
    href: "/features/relaunch",
    icon: RefreshCw,
  },
];

export const LandingHeader = () => {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-md border-b border-border/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Rocket className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="text-xl font-bold text-primary-foreground">Launchely</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link to="/how-it-works" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors font-medium">
              How It Works
            </Link>
            
            {/* Features Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setFeaturesOpen(true)}
              onMouseLeave={() => setFeaturesOpen(false)}
            >
              <button className="flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground transition-colors font-medium">
                Features
                <ChevronDown className={`w-4 h-4 transition-transform ${featuresOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {featuresOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[520px] bg-card rounded-xl shadow-2xl border border-border overflow-hidden z-50"
                  >
                    <div className="p-3 grid grid-cols-2 gap-1">
                      {featureLinks.map((link) => (
                        <Link
                          key={link.href}
                          to={link.href}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors flex-shrink-0">
                            <link.icon className="w-4 h-4 text-accent" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground text-sm">{link.title}</div>
                            <div className="text-xs text-muted-foreground">{link.description}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link to="/pricing" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors font-medium">
              Pricing
            </Link>
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
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild className="text-primary-foreground hover:bg-primary-foreground/10">
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link to="/auth?tab=signup">Get Started Free</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-primary-foreground"
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
            className="lg:hidden bg-primary border-t border-border/10"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              {/* Features Accordion */}
              <div>
                <button
                  className="flex items-center justify-between w-full py-2 text-primary-foreground font-medium"
                  onClick={() => setFeaturesOpen(!featuresOpen)}
                >
                  Features
                  <ChevronDown className={`w-4 h-4 transition-transform ${featuresOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {featuresOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pl-4 space-y-2 overflow-hidden"
                    >
                      {featureLinks.map((link) => (
                        <Link
                          key={link.href}
                          to={link.href}
                          className="flex items-center gap-3 py-2 text-primary-foreground/70 hover:text-primary-foreground"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <link.icon className="w-4 h-4" />
                          {link.title}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link
                to="/pricing"
                className="block py-2 text-primary-foreground font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>

              <Link
                to="/how-it-works"
                className="block py-2 text-primary-foreground font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </Link>

              <div className="pt-4 border-t border-border/10 space-y-2">
                {user ? (
                  <>
                    <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                      <Link to="/app">Go to App</Link>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleSignOut}
                      className="w-full border-primary-foreground/20 text-primary-foreground"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" asChild className="w-full border-primary-foreground/20 text-primary-foreground">
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
