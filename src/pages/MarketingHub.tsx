import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Link } from "react-router-dom";
import { Link2, BarChart3, Megaphone, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const MarketingHub = () => {
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
      href: "/marketing-hub/analytics",
      available: true,
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
      <div className="max-w-7xl mx-auto px-2.5 md:px-6 py-8 space-y-6">
        <div className="flex items-start gap-4 mb-8">
          <div className="p-3 bg-rose-100/50 dark:bg-rose-900/20 rounded-xl shrink-0">
            <Megaphone className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Marketing Hub</h1>
            <p className="text-muted-foreground">
              Tools to build, track, and optimize your marketing campaigns.
            </p>
          </div>
        </div>

        {/* Tools grid */}
        <div className="grid sm:grid-cols-2 gap-4 items-stretch">
          {tools.map((tool) => {
            const content = (
              <Card
                key={tool.title}
                className={`transition-all h-full flex flex-col ${tool.available ? "hover:shadow-md hover:border-primary/30 cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
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
