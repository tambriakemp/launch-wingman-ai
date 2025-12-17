import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlanPageHeader } from "@/components/PlanPageHeader";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Check, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FUNNEL_CONFIGS } from "@/data/funnelConfigs";

// Map asset categories to task phases
const ASSET_PHASE_MAP: Record<string, string> = {
  'pages': 'technical',
  'emails': 'emails',
  'content': 'prelaunch',
  'deliverables': 'delivery',
};

// Map asset categories to task labels
const ASSET_LABEL_MAP: Record<string, string[]> = {
  'pages': ['technical'],
  'emails': ['copy'],
  'content': ['creative', 'marketing'],
  'deliverables': ['creative'],
};

interface Platform {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  fallbackColor: string;
}

const FUNNEL_BUILDERS: Platform[] = [
  {
    id: "clickfunnels",
    name: "ClickFunnels",
    description: "One of the most well-known sales funnel builders with drag-and-drop pages, order forms, upsells/downsells, and funnel templates.",
    logoUrl: "https://logo.clearbit.com/clickfunnels.com",
    fallbackColor: "bg-blue-500",
  },
  {
    id: "kartra",
    name: "Kartra",
    description: "All-in-one platform with landing pages, email automation, carts, affiliate tracking, membership sites, and funnels.",
    logoUrl: "https://logo.clearbit.com/kartra.com",
    fallbackColor: "bg-purple-500",
  },
  {
    id: "systeme-io",
    name: "Systeme.io",
    description: "Affordable and user-friendly funnel builder with email automation, membership support, and courses.",
    logoUrl: "https://logo.clearbit.com/systeme.io",
    fallbackColor: "bg-green-500",
  },
  {
    id: "getresponse",
    name: "GetResponse",
    description: "Marketing suite with funnel visualization, landing pages, webinars, and email automation.",
    logoUrl: "https://logo.clearbit.com/getresponse.com",
    fallbackColor: "bg-cyan-500",
  },
  {
    id: "leadpages",
    name: "Leadpages",
    description: "Strong landing page and conversion page builder that integrates with email and CRM tools.",
    logoUrl: "https://logo.clearbit.com/leadpages.com",
    fallbackColor: "bg-orange-500",
  },
  {
    id: "kajabi",
    name: "Kajabi",
    description: "All-in-one creator platform with courses, funnels, memberships, and email automations.",
    logoUrl: "https://logo.clearbit.com/kajabi.com",
    fallbackColor: "bg-indigo-500",
  },
  {
    id: "activecampaign",
    name: "ActiveCampaign",
    description: "More advanced automation and CRM-driven funnels with behavior-based triggers.",
    logoUrl: "https://logo.clearbit.com/activecampaign.com",
    fallbackColor: "bg-rose-500",
  },
];

const EMAIL_PLATFORMS: Platform[] = [
  {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Classic choice, beginner-friendly, lots of templates.",
    logoUrl: "https://logo.clearbit.com/mailchimp.com",
    fallbackColor: "bg-yellow-500",
  },
  {
    id: "constant-contact",
    name: "Constant Contact",
    description: "Simple setup + event marketing tools.",
    logoUrl: "https://logo.clearbit.com/constantcontact.com",
    fallbackColor: "bg-blue-500",
  },
  {
    id: "sendinblue",
    name: "Brevo (Sendinblue)",
    description: "Email + SMS in one place with strong automation.",
    logoUrl: "https://logo.clearbit.com/brevo.com",
    fallbackColor: "bg-sky-500",
  },
  {
    id: "activecampaign",
    name: "ActiveCampaign",
    description: "Powerful automation with CRM and segmentation.",
    logoUrl: "https://logo.clearbit.com/activecampaign.com",
    fallbackColor: "bg-rose-500",
  },
  {
    id: "getresponse",
    name: "GetResponse",
    description: "Good automation, webinars, and landing pages too.",
    logoUrl: "https://logo.clearbit.com/getresponse.com",
    fallbackColor: "bg-cyan-500",
  },
  {
    id: "aweber",
    name: "AWeber",
    description: "Great for creators and small businesses just starting out.",
    logoUrl: "https://logo.clearbit.com/aweber.com",
    fallbackColor: "bg-blue-600",
  },
  {
    id: "convertkit",
    name: "ConvertKit",
    description: "Easy automations and tagging — popular with bloggers & creators.",
    logoUrl: "https://logo.clearbit.com/convertkit.com",
    fallbackColor: "bg-red-500",
  },
  {
    id: "mailerlite",
    name: "MailerLite",
    description: "Clean interface, affordable, great for simple funnels.",
    logoUrl: "https://logo.clearbit.com/mailerlite.com",
    fallbackColor: "bg-green-500",
  },
  {
    id: "kajabi",
    name: "Kajabi",
    description: "All-in-one with email + courses + landing pages.",
    logoUrl: "https://logo.clearbit.com/kajabi.com",
    fallbackColor: "bg-indigo-500",
  },
  {
    id: "flodesk",
    name: "Flodesk",
    description: "Beautiful design templates, flat pricing, simple interface.",
    logoUrl: "https://logo.clearbit.com/flodesk.com",
    fallbackColor: "bg-pink-500",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "Enterprise features + CRM + automation.",
    logoUrl: "https://logo.clearbit.com/hubspot.com",
    fallbackColor: "bg-orange-500",
  },
];

const COMMUNITY_PLATFORMS: Platform[] = [
  {
    id: "kajabi",
    name: "Kajabi",
    description: "All-in-one creator platform with courses, funnels, memberships, and email automations.",
    logoUrl: "https://logo.clearbit.com/kajabi.com",
    fallbackColor: "bg-indigo-500",
  },
  {
    id: "mighty-networks",
    name: "Mighty Networks",
    description: "Community and membership platform for creators with network features.",
    logoUrl: "https://logo.clearbit.com/mightynetworks.com",
    fallbackColor: "bg-purple-500",
  },
  {
    id: "circle",
    name: "Circle",
    description: "Community hub integrated with membership and course sales.",
    logoUrl: "https://logo.clearbit.com/circle.so",
    fallbackColor: "bg-teal-500",
  },
  {
    id: "discord",
    name: "Discord",
    description: "Real-time community used for cohorts, launch groups, and engagement.",
    logoUrl: "https://logo.clearbit.com/discord.com",
    fallbackColor: "bg-violet-500",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Professional community space often used for paid membership groups.",
    logoUrl: "https://logo.clearbit.com/slack.com",
    fallbackColor: "bg-pink-500",
  },
  {
    id: "facebook-groups",
    name: "Facebook Groups",
    description: "Still widely used for community building and launch cohorts.",
    logoUrl: "https://logo.clearbit.com/facebook.com",
    fallbackColor: "bg-blue-600",
  },
  {
    id: "skool",
    name: "Skool",
    description: "Community platform combining courses, discussions, and gamification.",
    logoUrl: "https://logo.clearbit.com/skool.com",
    fallbackColor: "bg-yellow-500",
  },
];

interface PlatformListProps {
  platforms: Platform[];
  selectedPlatform: string | null;
  onSelect: (platformId: string) => void;
}

const PlatformList = ({ platforms, selectedPlatform, onSelect }: PlatformListProps) => {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageError = (platformId: string) => {
    setFailedImages(prev => new Set(prev).add(platformId));
  };

  return (
    <div className="divide-y divide-border rounded-xl border bg-card overflow-hidden">
      {platforms.map((platform) => {
        const isSelected = selectedPlatform === platform.id;
        const showFallback = failedImages.has(platform.id) || !platform.logoUrl;
        
        return (
          <button
            key={platform.id}
            onClick={() => onSelect(platform.id)}
            className={cn(
              "flex items-center gap-4 w-full p-4 text-left transition-colors hover:bg-muted/50",
              isSelected && "bg-muted/30"
            )}
          >
            {/* Selection indicator */}
            <div className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
              isSelected 
                ? "border-primary bg-primary" 
                : "border-muted-foreground/30"
            )}>
              {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
            </div>

            {/* Logo */}
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden",
              showFallback ? platform.fallbackColor : "bg-white"
            )}>
              {showFallback ? (
                <span className="text-white font-semibold text-sm">
                  {platform.name.charAt(0)}
                </span>
              ) : (
                <img
                  src={platform.logoUrl}
                  alt={platform.name}
                  className="w-6 h-6 object-contain"
                  onError={() => handleImageError(platform.id)}
                />
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-foreground">{platform.name}</h4>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {platform.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

interface TechStackContentProps {
  projectId: string;
}

const TechStackContent = ({ projectId }: TechStackContentProps) => {
  const navigate = useNavigate();
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

  // Fetch existing offers for task generation
  const { data: existingOffers } = useQuery({
    queryKey: ['funnel-offers', projectId],
    queryFn: async () => {
      if (!funnel?.id) return [];
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('funnel_id', funnel.id)
        .order('slot_position');
      if (error) throw error;
      return data;
    },
    enabled: !!funnel?.id,
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

  // Generate tasks from funnel assets
  const generateTasksFromFunnel = async (funnelTypeKey: string) => {
    if (!user || !projectId || !existingOffers) return;
    
    const config = FUNNEL_CONFIGS[funnelTypeKey];
    if (!config) return;

    // Check if there are already tasks for this project
    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('id')
      .eq('project_id', projectId)
      .limit(1);

    // Only generate tasks if none exist
    if (existingTasks && existingTasks.length > 0) return;

    const offers = existingOffers.map(offer => ({
      slotType: offer.slot_type,
      title: offer.title || '',
      isSkipped: false,
      isConfigured: true,
    }));

    const tasksToInsert = config.assets
      .filter(asset => {
        if (!asset.offerSlotType) return true;
        return offers.some(offer => 
          offer.slotType === asset.offerSlotType && 
          !offer.isSkipped &&
          (offer.isConfigured || offer.title)
        );
      })
      .map((asset, index) => {
        const relatedOffer = asset.offerSlotType 
          ? offers.find(o => o.slotType === asset.offerSlotType && !o.isSkipped)
          : null;
        
        const description = relatedOffer?.title 
          ? `${asset.description} • ${relatedOffer.title}`
          : asset.description;

        return {
          project_id: projectId,
          user_id: user.id,
          title: asset.title,
          description: description,
          column_id: 'todo',
          phase: ASSET_PHASE_MAP[asset.category] || null,
          labels: ASSET_LABEL_MAP[asset.category] || [],
          position: index,
        };
      });

    if (tasksToInsert.length > 0) {
      const { error } = await supabase.from('tasks').insert(tasksToInsert);
      if (error) {
        console.error('Error generating tasks:', error);
      }
    }
  };

  // Complete setup mutation
  const completeSetupMutation = useMutation({
    mutationFn: async () => {
      if (!funnel?.funnel_type) throw new Error("No funnel type");
      
      // Generate tasks
      await generateTasksFromFunnel(funnel.funnel_type);
      
      // Update funnel_type_snapshot on the project
      const { error } = await supabase
        .from('projects')
        .update({ funnel_type_snapshot: funnel.funnel_type })
        .eq('id', projectId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success("Setup complete!");
      navigate(`/projects/${projectId}/offer`);
    },
    onError: (error) => {
      console.error("Error completing setup:", error);
      toast.error("Failed to complete setup");
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
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            Please complete the Funnel Type step first to configure your tech stack.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
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

      {/* Funnel Builder Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Funnel Builder
        </h3>
        <PlatformList
          platforms={FUNNEL_BUILDERS}
          selectedPlatform={funnel.funnel_platform}
          onSelect={handleSelectFunnelBuilder}
        />
      </div>

      {/* Email Marketing Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Email Marketing Platform
        </h3>
        <PlatformList
          platforms={EMAIL_PLATFORMS}
          selectedPlatform={funnel.email_platform}
          onSelect={handleSelectEmailPlatform}
        />
      </div>

      {/* Community Platform Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
          Community Platform
        </h3>
        <PlatformList
          platforms={COMMUNITY_PLATFORMS}
          selectedPlatform={funnel.community_platform}
          onSelect={handleSelectCommunityPlatform}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={() => navigate(`/projects/${projectId}/offers`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Offer Stack
        </Button>

        <Button
          onClick={() => completeSetupMutation.mutate()}
          disabled={completeSetupMutation.isPending}
        >
          {completeSetupMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Completing...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Complete Setup
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default TechStackContent;