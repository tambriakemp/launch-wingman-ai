import { useState } from "react";
import { Plus, Gift, ShoppingBag, Video, Users, CreditCard, GraduationCap, BookOpen, Layers, Pencil, Trash2, Loader2 } from "lucide-react";
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
      description: "Bite-sized resources like mini-guides, checklists, or cheat sheets that deliver quick value at no cost. They showcase your expertise and help people experience your style before they invest in bigger offers.",
      color: "text-teal-500",
      bgColor: "bg-teal-500/10",
    },
    {
      id: "tangible-digital-products",
      name: "Tangible Digital Products",
      icon: ShoppingBag,
      description: "Practical tools such as templates, planners, or plug-and-play digital assets that your audience can start using immediately. These are usually low-cost or free, making them an easy yes for new leads.",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      id: "online-workshops",
      name: "Online Workshops",
      icon: Video,
      description: "Short, topic-focused live or recorded sessions designed to deepen engagement. These allow people to learn from you in real time and get a preview of your teaching or coaching approach.",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ],
  "Revenue-Generating Offers": [
    {
      id: "1-1-coaching",
      name: "1:1 Coaching",
      icon: Users,
      description: "High-touch, personalized support tailored to a client's specific needs or goals. This can be sold as single sessions or structured coaching packages and is one of the most premium services you can offer.",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      id: "coaching-membership",
      name: "Coaching Membership",
      icon: CreditCard,
      description: "A subscription-based program that provides ongoing support through community, group sessions, resources, or periodic 1:1 access. This creates predictable, recurring monthly revenue.",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      id: "group-coaching-program",
      name: "Group Coaching Program",
      icon: Layers,
      description: "A structured program where multiple clients learn together. It balances personal interaction with scalability, allowing you to serve more people at once without sacrificing value.",
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
    },
    {
      id: "flagship-course",
      name: "Flagship Course",
      icon: GraduationCap,
      description: "Your signature, in-depth course that covers a major transformation from start to finish. This is typically your main revenue driver and the offer you ultimately want most clients to move toward.",
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
    },
    {
      id: "mini-courses",
      name: "Mini-Courses",
      icon: BookOpen,
      description: "Shorter, focused courses that dive into one specific topic. They're low-commitment, low-priced, and often serve as a stepping stone into your higher-ticket programs or flagship course.",
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
  ],
};

interface Offer {
  id: string;
  project_id: string;
  user_id: string;
  niche: string;
  offer_category: string;
  offer_type: string;
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
  const [offerTitle, setOfferTitle] = useState<string>("");
  const [offerDescription, setOfferDescription] = useState<string>("");
  const [offerPrice, setOfferPrice] = useState<string>("");

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
    setOfferTitle("");
    setOfferDescription("");
    setOfferPrice("");
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
    setOfferTitle(offer.title || "");
    setOfferDescription(offer.description || "");
    setOfferPrice(offer.price?.toString() || "");
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

  const handleSaveOffer = () => {
    if (!user || !selectedNiche || !selectedOfferType) return;

    const offerCategory = getOfferCategory(selectedOfferType);
    const offerDetails = getOfferDetails(selectedOfferType);

    if (offer) {
      updateMutation.mutate({
        id: offer.id,
        niche: selectedNiche,
        offer_category: offerCategory,
        offer_type: selectedOfferType,
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
        title: offerTitle || offerDetails?.name || null,
        description: offerDescription || null,
        price: offerPrice ? parseFloat(offerPrice) : null,
      });
    }
  };

  const selectedOfferDetails = getOfferDetails(selectedOfferType);
  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Get details for saved offer
  const savedOfferDetails = offer ? getOfferDetails(offer.offer_type) : null;
  const SavedIcon = savedOfferDetails?.icon || Gift;

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
                  <SavedIcon className={cn("w-7 h-7", savedOfferDetails?.color || "text-muted-foreground")} />
                </div>
                <div>
                  <CardTitle className="text-xl">{offer.title || savedOfferDetails?.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
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

            {/* Offer Type Info */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm font-medium text-foreground mb-2">About this offer type</p>
              <p className="text-sm text-muted-foreground">{savedOfferDetails?.description}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{offer ? "Edit Offer" : "Create Offer"}</DialogTitle>
            <DialogDescription>
              Design an offer that resonates with your audience and drives results.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Niche Selection */}
            <div className="space-y-2">
              <Label htmlFor="niche">Select Your Niche</Label>
              <Select value={selectedNiche} onValueChange={setSelectedNiche}>
                <SelectTrigger id="niche">
                  <SelectValue placeholder="Choose your niche..." />
                </SelectTrigger>
                <SelectContent>
                  {NICHES.map((niche) => (
                    <SelectItem key={niche} value={niche}>
                      {niche}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Offer Type Selection */}
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
                    <div className="grid gap-3">
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
                            <CardHeader className="pb-2">
                              <div className="flex items-start gap-3">
                                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", offerItem.bgColor)}>
                                  <Icon className={cn("w-5 h-5", offerItem.color)} />
                                </div>
                                <div className="flex-1">
                                  <CardTitle className="text-base">{offerItem.name}</CardTitle>
                                  <CardDescription className="text-sm mt-1">
                                    {offerItem.description}
                                  </CardDescription>
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

            {/* Additional Details */}
            {selectedNiche && selectedOfferType && (
              <div className="space-y-4 p-4 rounded-lg bg-accent border border-border">
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
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveOffer} 
                disabled={!selectedNiche || !selectedOfferType || isSaving}
              >
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {offer ? "Save Changes" : "Create Offer"}
              </Button>
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
