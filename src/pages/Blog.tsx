import { Link } from "react-router-dom";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, ArrowRight, Sparkles } from "lucide-react";

const featuredPost = {
  slug: "ai-workflow-launch",
  title: "How to Use AI to Supercharge Your Launch Workflow",
  excerpt: "Discover how AI tools can transform your launch preparation from weeks of work into hours of focused productivity. Learn practical strategies for using AI in audience research, copywriting, and task planning.",
  author: "Launchely Team",
  date: "December 17, 2024",
  readTime: "8 min read",
  category: "AI & Productivity",
};

const Blog = () => {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Launchely Blog</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Insights for
            <span className="text-primary"> Smarter Launches</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Practical strategies, AI tips, and launch insights to help you grow your coaching business.
          </p>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-6">Featured Article</h2>
          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2">
                <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-8 flex items-center justify-center min-h-[250px]">
                  <div className="text-center">
                    <Sparkles className="w-16 h-16 text-primary mx-auto mb-4" />
                    <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {featuredPost.category}
                    </span>
                  </div>
                </div>
                <div className="p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <span>{featuredPost.date}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {featuredPost.readTime}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{featuredPost.title}</h3>
                  <p className="text-muted-foreground mb-6">{featuredPost.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">By {featuredPost.author}</span>
                    <Button asChild variant="ghost" className="group">
                      <Link to={`/blog/${featuredPost.slug}`}>
                        Read Article
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-bold mb-4">Stay Updated</h2>
          <p className="text-muted-foreground mb-6">
            Get the latest launch strategies and AI tips delivered to your inbox.
          </p>
          <div className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button>Subscribe</Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">No spam. Unsubscribe anytime.</p>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default Blog;
