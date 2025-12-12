import { useState } from "react";
import { Plus, Gift, ShoppingBag, Video, Users, CreditCard, GraduationCap, BookOpen, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

interface OfferBuilderProps {
  projectId: string;
}

export const OfferBuilder = ({ projectId }: OfferBuilderProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState<string>("");
  const [selectedOfferType, setSelectedOfferType] = useState<string>("");

  const handleReset = () => {
    setSelectedNiche("");
    setSelectedOfferType("");
  };

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      handleReset();
    }
  };

  const getSelectedOfferDetails = () => {
    for (const category of Object.values(OFFER_TYPES)) {
      const offer = category.find((o) => o.id === selectedOfferType);
      if (offer) return offer;
    }
    return null;
  };

  const selectedOffer = getSelectedOfferDetails();

  return (
    <div className="space-y-6">
      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Gift className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No offers yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Design your offers to attract and convert your ideal clients. Start by creating your first offer.
        </p>
        
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create New Offer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Offer</DialogTitle>
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
                  
                  {Object.entries(OFFER_TYPES).map(([category, offers]) => (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
                        <Badge variant="outline" className="text-xs">
                          {category === "Audience-Growing Offers" ? "Warm-Up" : "Paid"}
                        </Badge>
                      </div>
                      <div className="grid gap-3">
                        {offers.map((offer) => {
                          const Icon = offer.icon;
                          const isSelected = selectedOfferType === offer.id;
                          
                          return (
                            <Card
                              key={offer.id}
                              className={cn(
                                "cursor-pointer transition-all hover:border-primary/50",
                                isSelected && "border-primary ring-1 ring-primary"
                              )}
                              onClick={() => setSelectedOfferType(offer.id)}
                            >
                              <CardHeader className="pb-2">
                                <div className="flex items-start gap-3">
                                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", offer.bgColor)}>
                                    <Icon className={cn("w-5 h-5", offer.color)} />
                                  </div>
                                  <div className="flex-1">
                                    <CardTitle className="text-base">{offer.name}</CardTitle>
                                    <CardDescription className="text-sm mt-1">
                                      {offer.description}
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

              {/* Selection Summary */}
              {selectedNiche && selectedOfferType && selectedOffer && (
                <div className="p-4 rounded-lg bg-accent border border-border">
                  <h4 className="font-medium text-foreground mb-2">Your Selection</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Niche:</span> {selectedNiche}</p>
                    <p><span className="text-muted-foreground">Offer Type:</span> {selectedOffer.name}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button disabled={!selectedNiche || !selectedOfferType}>
                  Continue
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
