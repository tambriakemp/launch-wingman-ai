import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, X, Sparkles, HelpCircle } from "lucide-react";
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
    features: [
      { name: "1 Active Project", included: true },
      { name: "Assessments", included: true },
      { name: "Full Plan Section (Funnel, Audience, Offers)", included: true },
      { name: "Tech Stack Selection", included: true },
      { name: "Branding Assets", included: false },
      { name: "Messaging (Sales Copy, Bios, Emails)", included: false },
      { name: "Execute (Project Board, Social Hub)", included: false },
      { name: "Social Media Connections", included: false },
      { name: "Unlimited Projects", included: false },
    ],
  },
  {
    name: "Pro",
    price: "$20",
    period: "/month",
    description: "Everything you need to launch like a pro",
    cta: "Go Pro",
    ctaVariant: "default" as const,
    popular: true,
    features: [
      { name: "Unlimited Projects", included: true },
      { name: "Assessments", included: true },
      { name: "Full Plan Section (Funnel, Audience, Offers)", included: true },
      { name: "Tech Stack Selection", included: true },
      { name: "Branding Assets (Logos, Colors, Fonts, Photos)", included: true },
      { name: "Messaging (AI Sales Copy, Bios, Emails)", included: true },
      { name: "Execute (Project Board, Social Hub, Calendar)", included: true },
      { name: "Social Media Connections (Pinterest, Twitter)", included: true },
      { name: "Priority Support", included: true },
    ],
  },
];

const faqs = [
  {
    question: "Can I upgrade or downgrade at any time?",
    answer: "Yes! You can upgrade to Pro at any time and get instant access to all features. If you downgrade, you'll keep access until the end of your billing period.",
  },
  {
    question: "What happens to my projects if I downgrade?",
    answer: "Your projects and data are never deleted. If you downgrade to Free, you'll still be able to view all projects but can only actively work on 1 project at a time.",
  },
  {
    question: "Is there a free trial for Pro?",
    answer: "We offer a generous Free plan that lets you experience the core planning features. This way, you can see the value before upgrading to Pro for the full experience.",
  },
  {
    question: "How does billing work?",
    answer: "Pro is billed monthly at $20/month. You can cancel anytime, and you'll keep access until the end of your billing period. No long-term contracts or hidden fees.",
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
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`relative bg-card rounded-2xl border-2 p-8 ${
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

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-5xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature.name} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-accent flex-shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground/40 flex-shrink-0" />
                      )}
                      <span className={feature.included ? "text-foreground" : "text-muted-foreground/60"}>
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
                  <Link to={plan.name === "Pro" ? "/auth?tab=signup&plan=pro" : "/auth?tab=signup"}>
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

          <div className="max-w-3xl mx-auto overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-semibold text-foreground">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold text-foreground">Free</th>
                  <th className="text-center py-4 px-4 font-semibold text-foreground">Pro</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Active Projects", free: "1", pro: "Unlimited" },
                  { feature: "Assessments", free: true, pro: true },
                  { feature: "Funnel Planning", free: true, pro: true },
                  { feature: "Audience Builder", free: true, pro: true },
                  { feature: "Offer Stack", free: true, pro: true },
                  { feature: "Tech Stack Selection", free: true, pro: true },
                  { feature: "Brand Assets", free: false, pro: true },
                  { feature: "AI Sales Copy", free: false, pro: true },
                  { feature: "Social Bio Builder", free: false, pro: true },
                  { feature: "Email Sequences", free: false, pro: true },
                  { feature: "Project Board", free: false, pro: true },
                  { feature: "Social Media Hub", free: false, pro: true },
                  { feature: "Launch Calendar", free: false, pro: true },
                  { feature: "Social Connections", free: false, pro: true },
                ].map((row, index) => (
                  <tr key={index} className="border-b border-border/50">
                    <td className="py-4 px-4 text-foreground">{row.feature}</td>
                    <td className="py-4 px-4 text-center">
                      {typeof row.free === "boolean" ? (
                        row.free ? (
                          <Check className="w-5 h-5 text-accent mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                        )
                      ) : (
                        <span className="text-foreground">{row.free}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {typeof row.pro === "boolean" ? (
                        row.pro ? (
                          <Check className="w-5 h-5 text-accent mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                        )
                      ) : (
                        <span className="text-foreground font-medium">{row.pro}</span>
                      )}
                    </td>
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
