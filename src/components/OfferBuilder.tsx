import { useState } from "react";
import { Plus, Gift, ShoppingBag, Video, Users, CreditCard, GraduationCap, BookOpen, Layers, Pencil, Trash2, Loader2, Mail, DollarSign, Play, Instagram, Radio, Zap, UserCheck, Send, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const NICHES = [
  "Business Coaching",
  "Life Coaching",
  "Health & Wellness",
  "Fitness & Nutrition",
  "Mindset & Personal Development",
  "Career & Leadership",
  "Relationships & Dating",
  "Spirituality & Mindfulness",
  "Financial Coaching",
  "Parenting & Family",
  "Creative Arts & Writing",
  "Marketing & Sales",
  "Other",
];

const OFFER_TYPES = {
  "Audience-Growing Offers": [
    {
      id: "strategic-freebies",
      name: "Strategic Freebies",
      icon: Gift,
      description: "Bite-sized resources like mini-guides, checklists, or cheat sheets that deliver quick value at no cost.",
      color: "text-teal-500",
      bgColor: "bg-teal-500/10",
    },
    {
      id: "tangible-digital-products",
      name: "Tangible Digital Products",
      icon: ShoppingBag,
      description: "Practical tools such as templates, planners, or plug-and-play digital assets.",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      id: "online-workshops",
      name: "Online Workshops",
      icon: Video,
      description: "Short, topic-focused live or recorded sessions designed to deepen engagement.",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ],
  "Revenue-Generating Offers": [
    {
      id: "1-1-coaching",
      name: "1:1 Coaching",
      icon: Users,
      description: "High-touch, personalized support tailored to a client's specific needs or goals.",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      id: "coaching-membership",
      name: "Coaching Membership",
      icon: CreditCard,
      description: "A subscription-based program that provides ongoing support through community and resources.",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      id: "group-coaching-program",
      name: "Group Coaching Program",
      icon: Layers,
      description: "A structured program where multiple clients learn together with scalability.",
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
    },
    {
      id: "flagship-course",
      name: "Flagship Course",
      icon: GraduationCap,
      description: "Your signature, in-depth course that covers a major transformation.",
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
    },
    {
      id: "mini-courses",
      name: "Mini-Courses",
      icon: BookOpen,
      description: "Shorter, focused courses that dive into one specific topic.",
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
  ],
};

const FUNNEL_TYPES = [
  {
    id: "freebie-funnel",
    name: "Freebie Funnel",
    icon: Gift,
    purpose: "Grow your email list and warm up leads.",
    steps: [
      "Freebie Opt-In Page",
      "Thank You Page",
      "Email Welcome Sequence (3–5 emails)",
      "Soft CTA to next-step offer"
    ],
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
  },
  {
    id: "low-ticket-funnel",
    name: "Low-Ticket Offer Funnel",
    icon: DollarSign,
    purpose: "Turn new leads into paying customers quickly.",
    steps: [
      "Freebie or Content Entry Point",
      "Sales Page for Low-Ticket Offer ($7–$49)",
      "Order Form / Checkout",
      "Order Bump or Upsell (optional)",
      "Thank You / Access Page",
      "Post-Purchase Email Sequence"
    ],
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    id: "vsl-funnel",
    name: "VSL Funnel",
    icon: Play,
    purpose: "Sell a core or flagship offer using video.",
    steps: [
      "VSL Landing Page (video + CTA)",
      "Sales Page (optional)",
      "Checkout Page",
      "Thank You / Onboarding Page",
      "Follow-Up Emails"
    ],
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    id: "instagram-funnel",
    name: "Instagram Funnel",
    icon: Instagram,
    purpose: "Convert Instagram traffic into leads or sales.",
    steps: [
      "Instagram Content (Reels, Posts, Stories)",
      "Link in Bio Page",
      "Opt-In Page or Sales Page",
      "Thank You Page or Checkout",
      "DM or Email Follow-Up Sequence"
    ],
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  {
    id: "webinar-funnel",
    name: "Webinar Funnel",
    icon: Radio,
    purpose: "Educate, build authority, and sell at scale.",
    steps: [
      "Webinar Registration Page",
      "Confirmation Page",
      "Reminder Emails & SMS",
      "Live or Recorded Webinar",
      "Offer Pitch",
      "Checkout Page",
      "Follow-Up / Replay Email Sequence"
    ],
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    id: "challenge-funnel",
    name: "Challenge Funnel",
    icon: Zap,
    purpose: "Build engagement and community before selling.",
    steps: [
      "Challenge Registration Page",
      "Welcome Email + Access Details",
      "Daily Challenge Content (3–5 days)",
      "Community Engagement",
      "Offer Reveal",
      "Sales Page & Checkout",
      "Follow-Up Emails"
    ],
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    id: "membership-funnel",
    name: "Membership Funnel",
    icon: CreditCard,
    purpose: "Generate recurring monthly revenue.",
    steps: [
      "Awareness Content (social or ads)",
      "Membership Sales Page",
      "Checkout Page",
      "Member Onboarding / Welcome Page",
      "Orientation Email Sequence",
      "Ongoing Content & Retention Emails"
    ],
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    id: "application-funnel",
    name: "Application Funnel",
    icon: UserCheck,
    purpose: "Qualify leads before selling premium offers.",
    steps: [
      "Authority Content or Free Training",
      "Application Page",
      "Application Confirmation Page",
      "Application Review",
      "Strategy Call Booking",
      "Sales Call",
      "Contract & Payment"
    ],
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    id: "email-nurture-funnel",
    name: "Email Nurture Funnel",
    icon: Send,
    purpose: "Build trust and sell over time.",
    steps: [
      "Lead Magnet or Content Entry",
      "Welcome Email Sequence",
      "Value Emails (education, stories, wins)",
      "Soft Offer Introduction",
      "Direct Sales CTA",
      "Ongoing Weekly Emails"
    ],
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "launch-funnel",
    name: "Launch Funnel",
    icon: Rocket,
    purpose: "Create urgency around a live launch.",
    steps: [
      "Pre-Launch Content (email + social)",
      "Waitlist or Early Access Page",
      "Cart Open Announcement",
      "Sales Page",
      "Checkout Page",
      "Cart Close Emails",
      "Onboarding / Welcome Sequence"
    ],
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
  },
];

interface Offer {
  id: string;
  project_id: string;
  user_id: string;
  niche: string;
  offer_category: string;
  offer_type: string;
  funnel_type: string | null;
  title: string | null;
  description: string | null;
  price: number | null;
  created_at: string;
  updated_at: string;
}

interface OfferBuilderProps {
  projectId: string;
}

export const OfferBuilder = ({ projectId }: OfferBuilderProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState<string>("");
  const [selectedOfferType, setSelectedOfferType] = useState<string>("");
  const [selectedFunnelType, setSelectedFunnelType] = useState<string>("");
  const [offerTitle, setOfferTitle] = useState<string>("");
  const [offerDescription, setOfferDescription] = useState<string>("");
  const [offerPrice, setOfferPrice] = useState<string>("");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Fetch offer (only one per project)
  const { data: offer, isLoading } = useQuery({
    queryKey: ["offer", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Offer | null;
    },
    enabled: !!projectId,
  });

  // Create offer mutation
  const createMutation = useMutation({
    mutationFn: async (offerData: Omit<Offer, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("offers")
        .insert(offerData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offer", projectId] });
      toast.success("Offer created successfully");
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Failed to create offer");
      console.error(error);
    },
  });

  // Update offer mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...offerData }: Partial<Offer> & { id: string }) => {
      const { data, error } = await supabase
        .from("offers")
        .update(offerData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offer", projectId] });
      toast.success("Offer updated successfully");
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Failed to update offer");
      console.error(error);
    },
  });

  // Delete offer mutation
  const deleteMutation = useMutation({
    mutationFn: async (offerId: string) => {
      const { error } = await supabase
        .from("offers")
        .delete()
        .eq("id", offerId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offer", projectId] });
      toast.success("Offer deleted successfully");
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to delete offer");
      console.error(error);
    },
  });

  const handleReset = () => {
    setSelectedNiche("");
    setSelectedOfferType("");
    setSelectedFunnelType("");
    setOfferTitle("");
    setOfferDescription("");
    setOfferPrice("");
    setStep(1);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    handleReset();
  };

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      handleReset();
    }
  };

  const handleEditOffer = () => {
    if (!offer) return;
    setSelectedNiche(offer.niche);
    setSelectedOfferType(offer.offer_type);
    setSelectedFunnelType(offer.funnel_type || "");
    setOfferTitle(offer.title || "");
    setOfferDescription(offer.description || "");
    setOfferPrice(offer.price?.toString() || "");
    setStep(1);
    setDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (offer) {
      deleteMutation.mutate(offer.id);
    }
  };

  const getOfferCategory = (offerTypeId: string): string => {
    for (const [category, offers] of Object.entries(OFFER_TYPES)) {
      if (offers.some((o) => o.id === offerTypeId)) {
        return category;
      }
    }
    return "";
  };

  const getOfferDetails = (offerTypeId: string) => {
    for (const category of Object.values(OFFER_TYPES)) {
      const o = category.find((item) => item.id === offerTypeId);
      if (o) return o;
    }
    return null;
  };

  const getFunnelDetails = (funnelTypeId: string) => {
    return FUNNEL_TYPES.find((f) => f.id === funnelTypeId) || null;
  };

  const handleSaveOffer = () => {
    if (!user || !selectedNiche || !selectedOfferType || !selectedFunnelType) return;

    const offerCategory = getOfferCategory(selectedOfferType);
    const offerDetails = getOfferDetails(selectedOfferType);

    if (offer) {
      updateMutation.mutate({
        id: offer.id,
        niche: selectedNiche,
        offer_category: offerCategory,
        offer_type: selectedOfferType,
        funnel_type: selectedFunnelType,
        title: offerTitle || offerDetails?.name || null,
        description: offerDescription || null,
        price: offerPrice ? parseFloat(offerPrice) : null,
      });
    } else {
      createMutation.mutate({
        project_id: projectId,
        user_id: user.id,
        niche: selectedNiche,
        offer_category: offerCategory,
        offer_type: selectedOfferType,
        funnel_type: selectedFunnelType,
        title: offerTitle || offerDetails?.name || null,
        description: offerDescription || null,
        price: offerPrice ? parseFloat(offerPrice) : null,
      });
    }
  };

  const selectedOfferDetails = getOfferDetails(selectedOfferType);
  const selectedFunnelDetails = getFunnelDetails(selectedFunnelType);
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const canProceedToStep2 = selectedNiche && selectedOfferType;
  const canProceedToStep3 = canProceedToStep2 && selectedFunnelType;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Get details for saved offer
  const savedOfferDetails = offer ? getOfferDetails(offer.offer_type) : null;
  const savedFunnelDetails = offer?.funnel_type ? getFunnelDetails(offer.funnel_type) : null;
  const SavedOfferIcon = savedOfferDetails?.icon || Gift;
  const SavedFunnelIcon = savedFunnelDetails?.icon || Rocket;

  return (
    <div className="space-y-6">
      {!offer ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Gift className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No offer yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Design your offer to attract and convert your ideal clients. Start by creating your offer for this project.
          </p>
          
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Offer
          </Button>
        </div>
      ) : (
        /* Your Offer Section */
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center", savedOfferDetails?.bgColor || "bg-muted")}>
                  <SavedOfferIcon className={cn("w-7 h-7", savedOfferDetails?.color || "text-muted-foreground")} />
                </div>
                <div>
                  <CardTitle className="text-xl">{offer.title || savedOfferDetails?.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline">
                      {offer.offer_category === "Audience-Growing Offers" ? "Warm-Up Offer" : "Paid Offer"}
                    </Badge>
                    <Badge variant="secondary">{savedOfferDetails?.name}</Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleEditOffer}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Offer Details Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Niche</p>
                <p className="text-foreground">{offer.niche}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Offer Type</p>
                <p className="text-foreground">{savedOfferDetails?.name}</p>
              </div>
              {offer.price !== null && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Price</p>
                  <p className="text-foreground text-lg font-semibold">${offer.price}</p>
                </div>
              )}
            </div>

            {/* Description */}
            {offer.description && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-foreground">{offer.description}</p>
              </div>
            )}

            {/* Funnel Type Section */}
            {savedFunnelDetails && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-start gap-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", savedFunnelDetails.bgColor)}>
                    <SavedFunnelIcon className={cn("w-5 h-5", savedFunnelDetails.color)} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{savedFunnelDetails.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{savedFunnelDetails.purpose}</p>
                    <div className="mt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Funnel Steps:</p>
                      <ol className="text-sm text-foreground space-y-1">
                        {savedFunnelDetails.steps.map((step, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-muted-foreground">{index + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{offer ? "Edit Offer" : "Create Offer"}</DialogTitle>
            <DialogDescription>
              {step === 1 && "Step 1: Select your niche and offer type"}
              {step === 2 && "Step 2: Select your funnel type"}
              {step === 3 && "Step 3: Add offer details"}
            </DialogDescription>
          </DialogHeader>
          
          {/* Step Indicators */}
          <div className="flex items-center gap-2 py-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "flex-1 h-1.5 rounded-full transition-colors",
                  s <= step ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 py-4">
              {/* Step 1: Niche & Offer Type */}
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="niche">Select Your Niche</Label>
                    <Select value={selectedNiche} onValueChange={setSelectedNiche}>
                      <SelectTrigger id="niche">
                        <SelectValue placeholder="Choose your niche..." />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border">
                        {NICHES.map((niche) => (
                          <SelectItem key={niche} value={niche}>
                            {niche}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedNiche && (
                    <div className="space-y-4">
                      <Label>Select Offer Type</Label>
                      
                      {Object.entries(OFFER_TYPES).map(([category, offersList]) => (
                        <div key={category} className="space-y-3">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
                            <Badge variant="outline" className="text-xs">
                              {category === "Audience-Growing Offers" ? "Warm-Up" : "Paid"}
                            </Badge>
                          </div>
                          <div className="grid gap-2">
                            {offersList.map((offerItem) => {
                              const Icon = offerItem.icon;
                              const isSelected = selectedOfferType === offerItem.id;
                              
                              return (
                                <Card
                                  key={offerItem.id}
                                  className={cn(
                                    "cursor-pointer transition-all hover:border-primary/50",
                                    isSelected && "border-primary ring-1 ring-primary"
                                  )}
                                  onClick={() => setSelectedOfferType(offerItem.id)}
                                >
                                  <CardHeader className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", offerItem.bgColor)}>
                                        <Icon className={cn("w-4 h-4", offerItem.color)} />
                                      </div>
                                      <div className="flex-1">
                                        <CardTitle className="text-sm">{offerItem.name}</CardTitle>
                                      </div>
                                      {isSelected && (
                                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                          <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                          </svg>
                                        </div>
                                      )}
                                    </div>
                                  </CardHeader>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Step 2: Funnel Type */}
              {step === 2 && (
                <div className="space-y-4">
                  <Label>Select Funnel Type</Label>
                  <div className="grid gap-3">
                    {FUNNEL_TYPES.map((funnel) => {
                      const Icon = funnel.icon;
                      const isSelected = selectedFunnelType === funnel.id;
                      
                      return (
                        <Card
                          key={funnel.id}
                          className={cn(
                            "cursor-pointer transition-all hover:border-primary/50",
                            isSelected && "border-primary ring-1 ring-primary"
                          )}
                          onClick={() => setSelectedFunnelType(funnel.id)}
                        >
                          <CardHeader className="py-3 px-4">
                            <div className="flex items-start gap-3">
                              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", funnel.bgColor)}>
                                <Icon className={cn("w-5 h-5", funnel.color)} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-sm">{funnel.name}</CardTitle>
                                <CardDescription className="text-xs mt-0.5">{funnel.purpose}</CardDescription>
                              </div>
                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                                  <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </CardHeader>
                          {isSelected && (
                            <CardContent className="pt-0 pb-3 px-4">
                              <div className="ml-13 pl-10 border-l border-border">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Steps:</p>
                                <ol className="text-xs text-muted-foreground space-y-0.5">
                                  {funnel.steps.map((step, index) => (
                                    <li key={index}>{index + 1}. {step}</li>
                                  ))}
                                </ol>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Offer Details */}
              {step === 3 && (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="p-4 rounded-lg bg-accent border border-border">
                    <h4 className="font-medium text-foreground mb-3">Your Selection</h4>
                    <div className="grid gap-2 text-sm">
                      <p><span className="text-muted-foreground">Niche:</span> {selectedNiche}</p>
                      <p><span className="text-muted-foreground">Offer Type:</span> {selectedOfferDetails?.name}</p>
                      <p><span className="text-muted-foreground">Funnel:</span> {selectedFunnelDetails?.name}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground">Offer Details (Optional)</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="offerTitle">Custom Title</Label>
                      <Input
                        id="offerTitle"
                        value={offerTitle}
                        onChange={(e) => setOfferTitle(e.target.value)}
                        placeholder={selectedOfferDetails?.name || "Enter a custom title..."}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="offerDescription">Description</Label>
                      <Textarea
                        id="offerDescription"
                        value={offerDescription}
                        onChange={(e) => setOfferDescription(e.target.value)}
                        placeholder="Describe your offer..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="offerPrice">Price ($)</Label>
                      <Input
                        id="offerPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={offerPrice}
                        onChange={(e) => setOfferPrice(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => step === 1 ? handleCloseDialog() : setStep((step - 1) as 1 | 2)}
            >
              {step === 1 ? "Cancel" : "Back"}
            </Button>
            <div className="flex gap-2">
              {step < 3 ? (
                <Button 
                  onClick={() => setStep((step + 1) as 2 | 3)}
                  disabled={step === 1 ? !canProceedToStep2 : !canProceedToStep3}
                >
                  Continue
                </Button>
              ) : (
                <Button 
                  onClick={handleSaveOffer} 
                  disabled={!canProceedToStep3 || isSaving}
                >
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {offer ? "Save Changes" : "Create Offer"}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Offer"
        description={`Are you sure you want to delete "${offer?.title || savedOfferDetails?.name}"? This action cannot be undone.`}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};
