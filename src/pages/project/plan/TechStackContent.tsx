import { useState, useEffect } from "react";
import { PlanPageHeader } from "@/components/PlanPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Check, Globe, Mail, UsersRound, MessageCircleMore, MessageSquare } from "lucide-react";

interface Platform {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

const FUNNEL_BUILDERS: Platform[] = [
  {
    id: "clickfunnels",
    name: "ClickFunnels",
    description: "One of the most well-known sales funnel builders with drag-and-drop pages, order forms, upsells/downsells, and funnel templates.",
    icon: Globe,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "kartra",
    name: "Kartra",
    description: "All-in-one platform with landing pages, email automation, carts, affiliate tracking, membership sites, and funnels.",
    icon: Globe,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    id: "systeme-io",
    name: "Systeme.io",
    description: "Affordable and user-friendly funnel builder with email automation, membership support, and courses.",
    icon: Globe,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    id: "getresponse",
    name: "GetResponse",
    description: "Marketing suite with funnel visualization, landing pages, webinars, and email automation.",
    icon: Globe,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  {
    id: "leadpages",
    name: "Leadpages",
    description: "Strong landing page and conversion page builder that integrates with email and CRM tools.",
    icon: Globe,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    id: "kajabi",
    name: "Kajabi",
    description: "All-in-one creator platform with courses, funnels, memberships, and email automations.",
    icon: Globe,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
  },
  {
    id: "activecampaign",
    name: "ActiveCampaign",
    description: "More advanced automation and CRM-driven funnels with behavior-based triggers.",
    icon: Globe,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
  },
];

const EMAIL_PLATFORMS: Platform[] = [
  {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Classic choice, beginner-friendly, lots of templates.",
    icon: Mail,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  {
    id: "constant-contact",
    name: "Constant Contact",
    description: "Simple setup + event marketing tools.",
    icon: Mail,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "sendinblue",
    name: "Sendinblue",
    description: "Email + SMS in one place with strong automation.",
    icon: Mail,
    color: "text-sky-500",
    bgColor: "bg-sky-500/10",
  },
  {
    id: "activecampaign",
    name: "ActiveCampaign",
    description: "Powerful automation with CRM and segmentation.",
    icon: Mail,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
  },
  {
    id: "getresponse",
    name: "GetResponse",
    description: "Good automation, webinars, and landing pages too.",
    icon: Mail,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  {
    id: "aweber",
    name: "AWeber",
    description: "Great for creators and small businesses just starting out.",
    icon: Mail,
    color: "text-blue-600",
    bgColor: "bg-blue-600/10",
  },
  {
    id: "convertkit",
    name: "ConvertKit",
    description: "Easy automations and tagging — popular with bloggers & creators.",
    icon: Mail,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    id: "mailerlite",
    name: "MailerLite",
    description: "Clean interface, affordable, great for simple funnels.",
    icon: Mail,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    id: "kajabi",
    name: "Kajabi (Email + CRM)",
    description: "All-in-one with email + courses + landing pages.",
    icon: Mail,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
  },
  {
    id: "flodesk",
    name: "Flodesk",
    description: "Beautiful design templates, flat pricing, simple interface.",
    icon: Mail,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  {
    id: "hubspot",
    name: "HubSpot Marketing Hub",
    description: "Enterprise features + CRM + automation.",
    icon: Mail,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
];

const COMMUNITY_PLATFORMS: Platform[] = [
  {
    id: "kajabi",
    name: "Kajabi",
    description: "All-in-one creator platform with courses, funnels, memberships, and email automations.",
    icon: UsersRound,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
  },
  {
    id: "mighty-networks",
    name: "Mighty Networks",
    description: "Community and membership platform for creators with network features.",
    icon: UsersRound,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    id: "circle",
    name: "Circle",
    description: "Community hub integrated with membership and course sales.",
    icon: MessageCircleMore,
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
  },
  {
    id: "discord",
    name: "Discord",
    description: "Real-time community used for cohorts, launch groups, and engagement.",
    icon: MessageCircleMore,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Professional community space often used for paid membership groups.",
    icon: MessageSquare,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  {
    id: "facebook-groups",
    name: "Facebook Groups",
    description: "Still widely used for community building and launch cohorts.",
    icon: UsersRound,
    color: "text-blue-600",
    bgColor: "bg-blue-600/10",
  },
];

interface PlatformSelectorProps {
  title: string;
  platforms: Platform[];
  selectedPlatform: string | null;
  onSelect: (platformId: string) => void;
}

const PlatformSelector = ({ title, platforms, selectedPlatform, onSelect }: PlatformSelectorProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            const isSelected = selectedPlatform === platform.id;
            
            return (
              <button
                key={platform.id}
                onClick={() => onSelect(platform.id)}
                className={cn(
                  "relative flex flex-col items-start gap-2 p-4 rounded-lg border text-left transition-all hover:border-primary/50",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border bg-card hover:bg-accent/50"
                )}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={cn("p-2 rounded-md", platform.bgColor)}>
                  <Icon className={cn("h-4 w-4", platform.color)} />
                </div>
                <div className="space-y-1 pr-6">
                  <h4 className="font-medium text-sm">{platform.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {platform.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

interface TechStackContentProps {
  projectId: string;
}

const TechStackContent = ({ projectId }: TechStackContentProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Fetch funnel data
  const { data: funnel, isLoading } = useQuery({
    queryKey: ["funnel", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funnels")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId && !!user,
  });

  // Mutation to update tech stack
  const updateTechStack = useMutation({
    mutationFn: async (updates: {
      funnel_platform?: string;
      email_platform?: string;
      community_platform?: string;
    }) => {
      if (!funnel?.id) {
        throw new Error("No funnel found for this project");
      }

      const { error } = await supabase
        .from("funnels")
        .update(updates)
        .eq("id", funnel.id);

      if (error) throw error;
    },
    onMutate: () => {
      setSaveStatus("saving");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funnel", projectId] });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    },
    onError: (error) => {
      console.error("Error updating tech stack:", error);
      toast.error("Failed to save selection");
      setSaveStatus("idle");
    },
  });

  const handleSelectFunnelBuilder = (platformId: string) => {
    updateTechStack.mutate({ funnel_platform: platformId });
  };

  const handleSelectEmailPlatform = (platformId: string) => {
    updateTechStack.mutate({ email_platform: platformId });
  };

  const handleSelectCommunityPlatform = (platformId: string) => {
    updateTechStack.mutate({ community_platform: platformId });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PlanPageHeader
          title="Tech Stack"
          description="Select the tools you'll use to build and run your funnel"
        />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!funnel) {
    return (
      <div className="space-y-6">
        <PlanPageHeader
          title="Tech Stack"
          description="Select the tools you'll use to build and run your funnel"
        />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Please complete the Funnel Type step first to configure your tech stack.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PlanPageHeader
          title="Tech Stack"
          description="Select the tools you'll use to build and run your funnel"
        />
        {saveStatus !== "idle" && (
          <span className="text-sm text-muted-foreground">
            {saveStatus === "saving" ? "Saving..." : "Saved ✓"}
          </span>
        )}
      </div>

      <div className="space-y-6">
        <PlatformSelector
          title="Funnel Builder"
          platforms={FUNNEL_BUILDERS}
          selectedPlatform={funnel.funnel_platform}
          onSelect={handleSelectFunnelBuilder}
        />

        <PlatformSelector
          title="Email Marketing Platform"
          platforms={EMAIL_PLATFORMS}
          selectedPlatform={funnel.email_platform}
          onSelect={handleSelectEmailPlatform}
        />

        <PlatformSelector
          title="Community Platform"
          platforms={COMMUNITY_PLATFORMS}
          selectedPlatform={funnel.community_platform}
          onSelect={handleSelectCommunityPlatform}
        />
      </div>
    </div>
  );
};

export default TechStackContent;
