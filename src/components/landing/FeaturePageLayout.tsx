import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LucideIcon, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LandingHeader } from "./LandingHeader";
import { LandingFooter } from "./LandingFooter";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface FeaturePageLayoutProps {
  icon: LucideIcon;
  title: string;
  highlightedWord: string;
  subtitle: string;
  description: string;
  features: Feature[];
  benefits: string[];
  children?: ReactNode;
  screenshot?: ReactNode;
}

export const FeaturePageLayout = ({
  icon: Icon,
  title,
  highlightedWord,
  subtitle,
  description,
  features,
  benefits,
  children,
  screenshot,
}: FeaturePageLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Icon className="w-8 h-8 text-accent-foreground" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {title.split(highlightedWord)[0]}
              <span className="bg-accent text-accent-foreground px-3 py-1 rounded-lg">
                {highlightedWord}
              </span>
              {title.split(highlightedWord)[1]}
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/80 mb-8">
              {subtitle}
            </p>
            <p className="text-lg text-primary-foreground/60 max-w-2xl mx-auto">
              {description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Screenshot Section */}
      {screenshot && (
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto transform hover:scale-[1.01] transition-transform duration-300"
            >
              {screenshot}
            </motion.div>
          </div>
        </section>
      )}

      {/* Benefits Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border"
                >
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <ArrowRight className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-foreground font-medium">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful tools designed to make your launch process smoother and more effective.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Content */}
      {children}

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-primary-foreground/70 mb-8 max-w-2xl mx-auto">
              Join thousands of coaches and creators who are launching smarter, not harder.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="accent">
                <Link to="/checkout">Start Free Today</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};
