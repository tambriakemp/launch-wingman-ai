import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Link } from "react-router-dom";
import { Link2, BarChart3, Megaphone, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const MarketingHub = () => {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["utm-stats", user?.id],
    queryFn: async () => {
      const { data: links, error } = await supabase
        .from("utm_links")
        .select("id, click_count")
        .eq("user_id", user!.id);
      if (error) throw error;
      const totalLinks = links?.length || 0;
      const totalClicks = links?.reduce((sum, l) => sum + (l.click_count || 0), 0) || 0;
      return { totalLinks, totalClicks };
    },
    enabled: !!user,
  });

  const tools = [
    {
      title: "UTM Campaign Builder",
      description: "Create, save, and track UTM-tagged links with short URLs and click analytics.",
      icon: Link2,
      href: "/marketing-hub/utm-builder",
      available: true,
    },
    {
      title: "Campaign Analytics",
      description: "View performance data across all your marketing campaigns.",
      icon: BarChart3,
      href: "#",
      available: false,
    },
    {
      title: "Social Promotions",
      description: "Schedule and manage promotional posts across social platforms.",
      icon: Megaphone,
      href: "#",
      available: false,
    },
    {
      title: "Landing Page Tracker",
      description: "Monitor landing page performance and conversion rates.",
      icon: Globe,
      href: "#",
      available: false,
    },
  ];

  return (
    <ProjectLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Marketing Hub</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tools to build, track, and optimize your marketing campaigns.
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-2xl font-bold text-foreground">{stats?.totalLinks ?? 0}</p>
              <p className="text-xs text-muted-foreground">Saved Links</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-2xl font-bold text-foreground">{stats?.totalClicks ?? 0}</p>
              <p className="text-xs text-muted-foreground">Total Clicks</p>
            </CardContent>
          </Card>
        </div>

        {/* Tools grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {tools.map((tool) => {
            const content = (
              <Card
                key={tool.title}
                className={`transition-all ${tool.available ? "hover:shadow-md hover:border-primary/30 cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/20">
                      <tool.icon className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{tool.title}</CardTitle>
                      {!tool.available && (
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Coming Soon</span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{tool.description}</CardDescription>
                </CardContent>
              </Card>
            );

            return tool.available ? (
              <Link key={tool.title} to={tool.href}>
                {content}
              </Link>
            ) : (
              <div key={tool.title}>{content}</div>
            );
          })}
        </div>
      </div>
    </ProjectLayout>
  );
};

export default MarketingHub;
