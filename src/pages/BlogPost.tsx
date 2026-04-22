import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/seo/SEO";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Calendar, Share2, Loader2 } from "lucide-react";

const BlogPost = () => {
  const { slug } = useParams();

  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug!)
        .eq('is_published', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-background">
      {post && (
        <SEO
          title={`${post.title} — Launchely Blog`}
          description={post.excerpt || `Read "${post.title}" on the Launchely blog.`}
          path={`/blog/${post.slug}`}
          image={post.cover_image_url || undefined}
          type="article"
          jsonLd={{
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.excerpt,
            image: post.cover_image_url,
            datePublished: post.published_at,
            dateModified: post.updated_at || post.published_at,
            author: { "@type": "Person", name: post.author || "Launchely" },
            publisher: {
              "@type": "Organization",
              name: "Launchely",
              logo: { "@type": "ImageObject", url: "https://launchely.com/favicon.png" },
            },
            mainEntityOfPage: `https://launchely.com/blog/${post.slug}`,
          }}
          breadcrumbs={[
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]}
        />
      )}
      <LandingHeader />
      
      <article className="pt-32 pb-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <Link to="/blog" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : !post ? (
            <div className="text-center py-16">
              <h1 className="text-2xl font-bold mb-4">Post not found</h1>
              <p className="text-muted-foreground mb-8">This article may have been removed or doesn't exist.</p>
              <Button asChild variant="outline">
                <Link to="/blog">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to All Articles
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                {post.category && (
                  <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {post.category}
                  </span>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-muted-foreground mb-8 pb-8 border-b">
                {post.published_at && (
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(post.published_at)}
                  </span>
                )}
                {post.read_time && (
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {post.read_time}
                  </span>
                )}
                {post.author && <span>By {post.author}</span>}
              </div>

              {/* Article Content */}
              {post.content ? (
                <div
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              ) : (
                <div className="text-center py-12 bg-muted/30 rounded-xl">
                  <p className="text-lg text-muted-foreground">Full article coming soon.</p>
                  <p className="text-sm text-muted-foreground mt-2">Check back shortly — we're putting the finishing touches on this one.</p>
                </div>
              )}

              {/* Share Section */}
              <div className="mt-12 pt-8 border-t">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  <span className="font-semibold">Share this article</span>
                </div>
              </div>

              {/* Back to Blog */}
              <div className="mt-12 text-center">
                <Button asChild variant="outline">
                  <Link to="/blog">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to All Articles
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </article>

      <LandingFooter />
    </div>
  );
};

export default BlogPost;
