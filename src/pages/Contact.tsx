import { useState } from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MessageSquare, Clock, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const faqs = [
  {
    question: "How do I reset my password?",
    answer: "Click 'Forgot Password' on the login page and enter your email. You'll receive a reset link within minutes.",
  },
  {
    question: "Can I upgrade or downgrade my plan?",
    answer: "Yes! Go to Settings > Plans & Credits to manage your subscription. Changes take effect immediately.",
  },
  {
    question: "Do you offer refunds?",
    answer: "We do not offer refunds. We provide a free plan so you can experience our features before upgrading, and due to the digital nature of our software, all sales are final.",
  },
  {
    question: "How do I delete my account?",
    answer: "You can delete your account in Settings > Account. Note that this action is permanent and cannot be undone.",
  },
];

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("send-contact-form", {
        body: formData,
      });

      if (error) throw error;

      toast.success("Message sent! We'll get back to you within 24-48 hours.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error: any) {
      console.error("Contact form error:", error);
      toast.error("Failed to send message. Please try again or email us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm font-medium">Contact Us</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Get in
            <span className="text-primary"> Touch</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have a question or need help? We're here for you. Reach out and we'll respond as quickly as possible.
          </p>
        </div>
      </section>

      {/* Contact Info + Form */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <Mail className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">Email Us</h3>
                  <p className="text-muted-foreground text-sm mb-2">For general inquiries and support</p>
                  <a href="mailto:hello@launchely.com" className="text-primary hover:underline">
                    hello@launchely.com
                  </a>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <Clock className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">Response Time</h3>
                  <p className="text-muted-foreground text-sm">
                    We typically respond within 24-48 hours during business days.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="md:col-span-2">
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Name</label>
                        <Input
                          placeholder="Your name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Subject</label>
                      <Input
                        placeholder="What's this about?"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Message</label>
                      <Textarea
                        placeholder="Tell us how we can help..."
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <HelpCircle className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Quick answers to common questions</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default Contact;
