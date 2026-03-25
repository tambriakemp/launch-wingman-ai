import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, X, Sparkles, HelpCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started with your first launch",
    cta: "Start Free",
    ctaVariant: "outline" as const,
    ctaLink: "/auth?tab=signup",
    features: [
      { name: "1 Active Project", included: true },
      { name: "Full Planning & Messaging Tasks", included: true },
      { name: "Funnel Type Selection", included: true },
      { name: "Offer Stack Mapping", included: true },
      { name: "Branding & Visual Direction", included: true },
      { name: "5 AI Content Ideas per Day", included: true },
      { name: "Up to 5 Saved Drafts", included: true },
      { name: "Basic Sales Copy (Headline, CTA)", included: true },
      { name: "Phase Snapshot (View Only)", included: true },
      { name: "Full Library Access", included: true },
      { name: "Content Vault", included: false },
      { name: "Unlimited Projects", included: false },
      { name: "Marketing Tools", included: false },
    ],
  },
  {
    name: "Content Vault",
    price: "$7",
    period: "/month",
    description: "Access premium templates, guides, and resources",
    cta: "Get Vault Access",
    ctaVariant: "outline" as const,
    ctaLink: "/checkout?tier=content_vault",
    icon: Package,
    features: [
      { name: "Everything in Free", included: true, highlight: true },
      { name: "Content Vault Access", included: true },
      { name: "Premium Templates & Guides", included: true },
      { name: "Canva Templates Library", included: true },
      { name: "Swipe Files & Examples", included: true },
      { name: "Unlimited Projects", included: false },
      { name: "Full Sales Copy Builder", included: false },
      { name: "Marketing Tools", included: false },
    ],
  },
  {
    name: "Pro",
    price: "$25",
    period: "/month",
    description: "Everything you need to launch like a pro",
    cta: "Go Pro",
    ctaVariant: "default" as const,
    ctaLink: "/checkout",
    features: [
      { name: "Unlimited Projects", included: true },
      { name: "Unlimited AI Content Ideas", included: true },
      { name: "Unlimited Saved Drafts", included: true },
      { name: "Full Sales Copy Builder", included: true },
      { name: "Multiple Offers per Sales Page", included: true },
      { name: "Social Media Scheduling", included: true },
      { name: "Phase Snapshot + Export", included: true },
      { name: "Relaunch Mode", included: true },
      { name: "Insights & Analytics History", included: true },
      { name: "Content Vault Access", included: true },
      { name: "Campaigns & Marketing Tools", included: false },
      { name: "AI Studio", included: false },
    ],
  },
  {
    name: "Advanced",
    price: "$49",
    period: "/month",
    description: "Full marketing suite for scaling your business",
    cta: "Go Advanced",
    ctaVariant: "default" as const,
    ctaLink: "/checkout?tier=advanced",
    popular: true,
    features: [
      { name: "Everything in Pro", included: true, highlight: true },
      { name: "Campaigns Manager", included: true },
      { name: "Social Planner", included: true },
      { name: "Ideas Bank", included: true },
      { name: "AI Studio", included: true },
      { name: "Marketing Analytics", included: true },
      { name: "Advanced Marketing Tools", included: true },
      { name: "Priority Support", included: true },
    ],
  },
];

const faqs = [
  {
    question: "Can I upgrade or downgrade at any time?",
    answer: "Yes! You can upgrade to Pro or Content Vault at any time and get instant access to all features. If you downgrade, you'll keep access until the end of your billing period.",
  },
  {
    question: "What happens to my projects if I downgrade?",
    answer: "Your projects and data are never deleted. If you downgrade to Free, you'll still be able to view all projects but can only actively work on 1 project at a time.",
  },
  {
    question: "What's included in the Content Vault?",
    answer: "The Content Vault includes premium Canva templates, swipe files, email sequences, social media templates, and exclusive guides created by launch experts. New resources are added regularly.",
  },
  {
    question: "Is there a free trial for Pro?",
    answer: "We offer a generous Free plan that lets you experience the core planning features. This way, you can see the value before upgrading to Pro for the full experience.",
  },
  {
    question: "How does billing work?",
    answer: "Pro ($25/month), Advanced ($49/month), and Content Vault ($7/month) are billed monthly. You can cancel anytime, and you'll keep access until the end of your billing period. No long-term contracts or hidden fees.",
  },
  {
    question: "Do you offer refunds?",
    answer: "We do not offer refunds. We provide a free plan so you can experience our features before upgrading, and due to the digital nature of our software, all sales are final.",
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Simple, <span className="bg-accent text-accent-foreground px-3 py-1 rounded-lg">Transparent</span> Pricing
            </h1>
            <p className="text-xl text-primary-foreground/70 max-w-2xl mx-auto">
              No hidden fees. No surprise charges. Just straightforward pricing for launching smarter.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 -mt-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`relative bg-card rounded-2xl border-2 p-6 lg:p-8 ${
                  plan.popular ? "border-accent shadow-xl" : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-accent text-accent-foreground text-sm font-semibold px-4 py-1 rounded-full flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {plan.icon && <plan.icon className="w-5 h-5 text-primary" />}
                    <h3 className="text-xl lg:text-2xl font-bold text-foreground">{plan.name}</h3>
                  </div>
                  <div className="mb-2">
                    <span className="text-4xl lg:text-5xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.slice(0, 10).map((feature) => (
                    <li key={feature.name} className="flex items-center gap-2">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-accent flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${feature.included ? "text-foreground" : "text-muted-foreground/60"}`}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={`w-full ${
                    plan.popular
                      ? "bg-accent text-accent-foreground hover:bg-accent/90"
                      : ""
                  }`}
                  variant={plan.ctaVariant}
                  size="lg"
                >
                  <Link to={plan.ctaLink}>
                    {plan.cta}
                  </Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Compare Plans
            </h2>
            <p className="text-lg text-muted-foreground">
              See exactly what you get with each plan
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-semibold text-foreground">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold text-foreground">Free</th>
                  <th className="text-center py-4 px-4 font-semibold text-foreground">
                    <div className="flex items-center justify-center gap-1">
                      <Package className="w-4 h-4" />
                      Vault
                    </div>
                  </th>
                  <th className="text-center py-4 px-4 font-semibold text-foreground">Pro</th>
                  <th className="text-center py-4 px-4 font-semibold text-foreground">Advanced</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Active Projects", free: "1", vault: "1", pro: "Unlimited", advanced: "Unlimited" },
                  { feature: "Planning & Messaging Tasks", free: true, vault: true, pro: true, advanced: true },
                  { feature: "AI Content Ideas", free: "5/day", vault: "5/day", pro: "Unlimited", advanced: "Unlimited" },
                  { feature: "Saved Drafts", free: "5 max", vault: "5 max", pro: "Unlimited", advanced: "Unlimited" },
                  { feature: "Sales Copy", free: "Basic", vault: "Basic", pro: "Full Builder", advanced: "Full Builder" },
                  { feature: "Content Vault Access", free: false, vault: true, pro: true, advanced: true },
                  { feature: "Social Media Scheduling", free: false, vault: false, pro: true, advanced: true },
                  { feature: "Relaunch Mode", free: false, vault: false, pro: true, advanced: true },
                  { feature: "Insights & Analytics", free: false, vault: false, pro: true, advanced: true },
                  { feature: "Campaigns", free: false, vault: false, pro: false, advanced: true },
                  { feature: "Social Planner", free: false, vault: false, pro: false, advanced: true },
                  { feature: "Ideas Bank", free: false, vault: false, pro: false, advanced: true },
                  { feature: "AI Studio", free: false, vault: false, pro: false, advanced: true },
                  { feature: "Marketing Analytics", free: false, vault: false, pro: false, advanced: true },
                  { feature: "Priority Support", free: false, vault: false, pro: false, advanced: true },
                ].map((row, index) => (
                  <tr key={index} className="border-b border-border/50">
                    <td className="py-4 px-4 text-foreground">{row.feature}</td>
                    {(['free', 'vault', 'pro', 'advanced'] as const).map((col) => (
                      <td key={col} className="py-4 px-4 text-center">
                        {typeof row[col] === "boolean" ? (
                          row[col] ? (
                            <Check className="w-5 h-5 text-accent mx-auto" />
                          ) : (
                            <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                          )
                        ) : (
                          <span className={`text-foreground ${col === 'advanced' ? 'font-medium' : ''}`}>{row[col]}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
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
              Frequently Asked Questions
            </h2>
          </motion.div>

          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-foreground hover:text-foreground">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Launch Smarter?
            </h2>
            <p className="text-xl text-primary-foreground/70 mb-8">
              Start free and upgrade when you're ready.
            </p>
            <Button asChild size="lg" variant="accent">
              <Link to="/auth?tab=signup">Get Started Free</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default Pricing;