import { useState } from "react";
import { Plus, Gift, ShoppingBag, Video, Users, CreditCard, GraduationCap, BookOpen, Layers, Pencil, Trash2, Loader2, Mail, DollarSign, Play, Instagram, Radio, Zap, UserCheck, Send, Rocket, ArrowDown, ChevronRight, ListChecks, FileText, Headphones, MessageSquare, MessagesSquare, Calendar, Layout, Volume2, Heart, BookMarked, UsersRound, Phone, MailCheck, MessageCircle, CheckSquare, Globe, MessageCircleMore, Sparkles, RefreshCw, Lightbulb, Target, AlertCircle, Wand2, ShieldCheck } from "lucide-react";
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

interface OfferIdea {
  title: string;
  description: string;
}

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

const MAIN_DELIVERABLES = [
  {
    id: "step-by-step-tutorials",
    name: "Step-by-Step Tutorials",
    icon: Video,
    description: "Video or written guides that walk clients through processes in a sequential, easy-to-follow format. Ideal for teaching specific skills or workflows.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "checklists",
    name: "Checklists",
    icon: ListChecks,
    description: "Simple, actionable lists that help clients track their progress and ensure they don't miss any steps. Great for implementation and accountability.",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    id: "cheat-sheets",
    name: "Cheat Sheets",
    icon: FileText,
    description: "Quick-reference documents that condense key information into an easy-to-scan format. Perfect for summarizing complex topics.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    id: "coaching-sessions",
    name: "1:1 or Group Coaching Sessions",
    icon: Users,
    description: "Live or scheduled calls where clients receive personalized guidance, feedback, and support. The highest-touch deliverable for transformation.",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    id: "workbooks",
    name: "Workbooks",
    icon: BookOpen,
    description: "Interactive documents with exercises, prompts, and space for reflection. Help clients apply what they learn and deepen their understanding.",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
  },
  {
    id: "planners",
    name: "Planners",
    icon: Calendar,
    description: "Structured planning tools that help clients organize their time, goals, and tasks. Essential for goal-setting and time management.",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
  },
  {
    id: "templates",
    name: "Templates",
    icon: Layout,
    description: "Pre-built frameworks, documents, or designs that clients can customize for their own use. Save time and provide a starting point.",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  {
    id: "trello-boards",
    name: "Trello Boards",
    icon: Layers,
    description: "Pre-configured project management boards that help clients organize their workflow and track progress visually.",
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
  },
  {
    id: "audio-files",
    name: "Audio Files",
    icon: Headphones,
    description: "Recorded audio content like guided meditations, lessons, or motivational tracks. Great for on-the-go learning.",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    id: "affirmations",
    name: "Affirmations",
    icon: Volume2,
    description: "Curated positive statements designed to reinforce mindset shifts and encourage empowering beliefs.",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  {
    id: "journals",
    name: "Journals",
    icon: BookMarked,
    description: "Guided journaling prompts and templates for self-reflection, gratitude practice, or goal tracking.",
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
  {
    id: "support-groups",
    name: "Support Groups",
    icon: UsersRound,
    description: "Community spaces (like Facebook groups or Slack channels) where clients can connect, share, and support each other.",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    id: "voice-message-support",
    name: "Voice Message Support",
    icon: Phone,
    description: "Async voice messaging via apps like Voxer or Telegram for personalized coaching feedback without scheduling calls.",
    color: "text-sky-500",
    bgColor: "bg-sky-500/10",
  },
  {
    id: "text-message-support",
    name: "Text Message Support",
    icon: MessageSquare,
    description: "Direct text-based communication for quick questions, check-ins, and accountability.",
    color: "text-lime-500",
    bgColor: "bg-lime-500/10",
  },
  {
    id: "email-support",
    name: "Email Support",
    icon: MailCheck,
    description: "Dedicated email access for detailed questions, feedback, and ongoing support between sessions.",
    color: "text-blue-600",
    bgColor: "bg-blue-600/10",
  },
  {
    id: "live-chat-support",
    name: "Live Chat Support",
    icon: MessageCircle,
    description: "Real-time chat availability for immediate assistance and quick answers to client questions.",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
];

const PLATFORM_CATEGORIES = {
  "Funnel Builders": [
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
      id: "kajabi-funnel",
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
  ],
  "Community & Engagement Platforms": [
    {
      id: "kajabi-community",
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
  ],
  "Email Marketing Platforms": [
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
      id: "activecampaign-email",
      name: "ActiveCampaign",
      description: "Powerful automation with CRM and segmentation.",
      icon: Mail,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
    },
    {
      id: "getresponse-email",
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
      id: "kajabi-email",
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
    {
      id: "drip",
      name: "Drip",
      description: "Ecommerce-centric automation and segmentation.",
      icon: Mail,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      id: "klaviyo",
      name: "Klaviyo",
      description: "Popular with ecommerce brands (deep data + personalization).",
      icon: Mail,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      id: "benchmark",
      name: "Benchmark Email",
      description: "Advanced automation and reporting tools.",
      icon: Mail,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      id: "mailjet",
      name: "Mailjet",
      description: "Simple tool for straightforward campaigns.",
      icon: Mail,
      color: "text-orange-400",
      bgColor: "bg-orange-400/10",
    },
    {
      id: "moosend",
      name: "Moosend",
      description: "Low-cost with solid automation.",
      icon: Mail,
      color: "text-teal-500",
      bgColor: "bg-teal-500/10",
    },
    {
      id: "sender",
      name: "Sender",
      description: "Affordable with good deliverability basics.",
      icon: Mail,
      color: "text-lime-500",
      bgColor: "bg-lime-500/10",
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
  main_deliverables: string[] | null;
  funnel_platform: string | null;
  community_platform: string | null;
  email_platform: string | null;
  title: string | null;
  description: string | null;
  price: number | null;
  target_audience: string | null;
  primary_pain_point: string | null;
  desired_outcome: string | null;
  problem_statement: string | null;
  transformation_statement: string | null;
  created_at: string;
  updated_at: string;
}

interface OfferBuilderProps {
  projectId: string;
}

// Funnel Diagram Component
const FunnelDiagram = ({ steps, color, bgColor }: { steps: string[]; color: string; bgColor: string }) => {
  return (
    <div className="py-4">
      <div className="flex flex-col items-center gap-2">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center w-full max-w-md">
            <div 
              className={cn(
                "w-full py-3 px-4 rounded-lg border text-center transition-all",
                bgColor,
                "border-border"
              )}
              style={{
                width: `${100 - (index * 5)}%`,
                minWidth: '200px'
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <span className={cn("text-xs font-bold", color)}>{index + 1}</span>
                <span className="text-sm font-medium text-foreground">{step}</span>
              </div>
            </div>
            {index < steps.length - 1 && (
              <ArrowDown className="w-4 h-4 text-muted-foreground my-1" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const OfferBuilder = ({ projectId }: OfferBuilderProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Step 1: Audience & Problem Discovery
  const [selectedNiche, setSelectedNiche] = useState<string>("");
  const [targetAudience, setTargetAudience] = useState<string>("");
  const [primaryPainPoint, setPrimaryPainPoint] = useState<string>("");
  const [desiredOutcome, setDesiredOutcome] = useState<string>("");
  const [problemStatement, setProblemStatement] = useState<string>("");
  const [isGeneratingProblemStatement, setIsGeneratingProblemStatement] = useState(false);
  
  // Step 2: Offer Type
  const [selectedOfferType, setSelectedOfferType] = useState<string>("");
  
  // Step 3: Transformation Statement (NEW)
  const [transformationStatements, setTransformationStatements] = useState<string[]>([]);
  const [selectedTransformationIndex, setSelectedTransformationIndex] = useState<number | null>(null);
  const [editedTransformation, setEditedTransformation] = useState<string>("");
  const [transformationTimeframe, setTransformationTimeframe] = useState<string>("");
  const [isGeneratingTransformations, setIsGeneratingTransformations] = useState(false);
  const [isRefiningTransformations, setIsRefiningTransformations] = useState(false);
  const [isCheckingAlignment, setIsCheckingAlignment] = useState(false);
  const [alignmentFeedback, setAlignmentFeedback] = useState<string>("");
  
  // Step 4: Deliverables
  const [selectedDeliverables, setSelectedDeliverables] = useState<string[]>([]);
  
  // Step 5: AI Ideas
  const [offerIdeas, setOfferIdeas] = useState<OfferIdea[]>([]);
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState<number | null>(null);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  
  // Step 6: Offer Details
  const [offerTitle, setOfferTitle] = useState<string>("");
  const [offerDescription, setOfferDescription] = useState<string>("");
  const [offerPrice, setOfferPrice] = useState<string>("");
  
  // Step 7: Funnel Type
  const [selectedFunnelType, setSelectedFunnelType] = useState<string>("");
  
  // Step 8: Platforms
  const [selectedFunnelPlatform, setSelectedFunnelPlatform] = useState<string>("");
  const [selectedCommunityPlatform, setSelectedCommunityPlatform] = useState<string>("");
  const [selectedEmailPlatform, setSelectedEmailPlatform] = useState<string>("");
  
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>(1);

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
    setTargetAudience("");
    setPrimaryPainPoint("");
    setDesiredOutcome("");
    setProblemStatement("");
    setSelectedOfferType("");
    setTransformationStatements([]);
    setSelectedTransformationIndex(null);
    setEditedTransformation("");
    setTransformationTimeframe("");
    setAlignmentFeedback("");
    setSelectedFunnelType("");
    setSelectedDeliverables([]);
    setOfferTitle("");
    setOfferDescription("");
    setOfferPrice("");
    setSelectedFunnelPlatform("");
    setSelectedCommunityPlatform("");
    setSelectedEmailPlatform("");
    setOfferIdeas([]);
    setSelectedIdeaIndex(null);
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

  const handleEditOffer = (targetStep: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 = 1) => {
    if (!offer) return;
    setSelectedNiche(offer.niche);
    setTargetAudience(offer.target_audience || "");
    setPrimaryPainPoint(offer.primary_pain_point || "");
    setDesiredOutcome(offer.desired_outcome || "");
    setProblemStatement(offer.problem_statement || "");
    setSelectedOfferType(offer.offer_type);
    setEditedTransformation(offer.transformation_statement || "");
    setSelectedTransformationIndex(null);
    setTransformationStatements([]);
    setTransformationTimeframe("");
    setAlignmentFeedback("");
    setSelectedFunnelType(offer.funnel_type || "");
    setSelectedDeliverables(offer.main_deliverables || []);
    setOfferTitle(offer.title || "");
    setOfferDescription(offer.description || "");
    setOfferPrice(offer.price?.toString() || "");
    setSelectedFunnelPlatform(offer.funnel_platform || "");
    setSelectedCommunityPlatform(offer.community_platform || "");
    setSelectedEmailPlatform(offer.email_platform || "");
    setOfferIdeas([]);
    setSelectedIdeaIndex(null);
    setStep(targetStep);
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

  const getDeliverableDetails = (deliverableId: string) => {
    return MAIN_DELIVERABLES.find((d) => d.id === deliverableId) || null;
  };

  const getPlatformDetails = (platformId: string, category: keyof typeof PLATFORM_CATEGORIES) => {
    return PLATFORM_CATEGORIES[category].find((p) => p.id === platformId) || null;
  };

  const { isSubscribed } = useAuth();

  const toggleDeliverable = (deliverableId: string) => {
    setSelectedDeliverables(prev => {
      if (prev.includes(deliverableId)) {
        return prev.filter(id => id !== deliverableId);
      }
      if (!isSubscribed) {
        return [deliverableId];
      }
      return [...prev, deliverableId];
    });
  };

  const generateProblemStatement = async () => {
    if (!selectedNiche || !targetAudience || !primaryPainPoint || !desiredOutcome) return;
    
    setIsGeneratingProblemStatement(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-problem-statement', {
        body: {
          niche: selectedNiche,
          targetAudience,
          primaryPainPoint,
          desiredOutcome,
        },
      });

      if (error) throw error;
      
      if (data?.problemStatement) {
        setProblemStatement(data.problemStatement);
        toast.success("Problem statement generated!");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Failed to generate problem statement:", error);
      toast.error("Failed to generate problem statement. Please try again.");
    } finally {
      setIsGeneratingProblemStatement(false);
    }
  };

  // Transformation Statement Functions
  const generateTransformationStatements = async () => {
    if (!targetAudience || !primaryPainPoint || !desiredOutcome || !selectedOfferType) return;
    
    setIsGeneratingTransformations(true);
    setTransformationStatements([]);
    setSelectedTransformationIndex(null);
    setEditedTransformation("");
    setAlignmentFeedback("");
    
    try {
      const offerDetails = getOfferDetails(selectedOfferType);
      
      const { data, error } = await supabase.functions.invoke('generate-offer-transformation', {
        body: {
          operation: "generate",
          audience: targetAudience,
          problem: primaryPainPoint,
          desiredOutcome: desiredOutcome,
          offerType: offerDetails?.name || selectedOfferType,
          timeframe: transformationTimeframe || undefined,
        },
      });

      if (error) throw error;
      
      if (data?.statements && Array.isArray(data.statements)) {
        setTransformationStatements(data.statements);
        toast.success("Transformation statements generated!");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Failed to generate transformation statements:", error);
      toast.error("Failed to generate statements. Please try again.");
    } finally {
      setIsGeneratingTransformations(false);
    }
  };

  const refineTransformationStatements = async () => {
    if (transformationStatements.length === 0) return;
    
    setIsRefiningTransformations(true);
    setAlignmentFeedback("");
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-offer-transformation', {
        body: {
          operation: "refine",
          statements: transformationStatements,
        },
      });

      if (error) throw error;
      
      if (data?.statements && Array.isArray(data.statements)) {
        setTransformationStatements(data.statements);
        setSelectedTransformationIndex(null);
        setEditedTransformation("");
        toast.success("Statements refined!");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Failed to refine statements:", error);
      toast.error("Failed to refine statements. Please try again.");
    } finally {
      setIsRefiningTransformations(false);
    }
  };

  const checkOfferAlignment = async () => {
    if (!editedTransformation.trim() || !selectedOfferType) return;
    
    setIsCheckingAlignment(true);
    setAlignmentFeedback("");
    
    try {
      const offerDetails = getOfferDetails(selectedOfferType);
      
      const { data, error } = await supabase.functions.invoke('generate-offer-transformation', {
        body: {
          operation: "alignment",
          statement: editedTransformation,
          offerType: offerDetails?.name || selectedOfferType,
        },
      });

      if (error) throw error;
      
      if (data?.revised) {
        setEditedTransformation(data.revised);
        if (data.feedback) {
          setAlignmentFeedback(data.feedback);
        }
        toast.success("Alignment check complete!");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Failed to check alignment:", error);
      toast.error("Failed to check alignment. Please try again.");
    } finally {
      setIsCheckingAlignment(false);
    }
  };

  const handleSelectTransformation = (index: number) => {
    setSelectedTransformationIndex(index);
    setEditedTransformation(transformationStatements[index]);
    setAlignmentFeedback("");
  };

  const generateOfferIdeas = async () => {
    if (!selectedNiche || !selectedOfferType) return;
    
    setIsGeneratingIdeas(true);
    setOfferIdeas([]);
    setSelectedIdeaIndex(null);
    
    try {
      const offerDetails = getOfferDetails(selectedOfferType);
      const deliverableName = selectedDeliverables.length > 0 
        ? getDeliverableDetails(selectedDeliverables[0])?.name 
        : null;
      
      const { data, error } = await supabase.functions.invoke('generate-offer-ideas', {
        body: {
          niche: selectedNiche,
          offerType: selectedOfferType,
          offerTypeName: offerDetails?.name || selectedOfferType,
          mainDeliverable: selectedDeliverables[0] || null,
          mainDeliverableName: deliverableName,
          problemStatement: problemStatement || null,
        },
      });

      if (error) throw error;
      
      if (data?.ideas && Array.isArray(data.ideas)) {
        setOfferIdeas(data.ideas);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Failed to generate offer ideas:", error);
      toast.error("Failed to generate offer ideas. Please try again.");
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const handleSelectIdea = (index: number) => {
    setSelectedIdeaIndex(index);
    const idea = offerIdeas[index];
    if (idea) {
      setOfferTitle(idea.title);
      setOfferDescription(idea.description);
    }
  };

  const handleSaveOffer = (isPartialSave = false) => {
    if (!user || !selectedNiche || !selectedOfferType) return;
    
    if (!isPartialSave && (!offerTitle.trim() || !offerDescription.trim() || !selectedFunnelType)) return;

    const offerCategory = getOfferCategory(selectedOfferType);

    const offerData = {
      project_id: projectId,
      user_id: user.id,
      niche: selectedNiche,
      offer_category: offerCategory,
      offer_type: selectedOfferType,
      funnel_type: selectedFunnelType || null,
      main_deliverables: selectedDeliverables,
      funnel_platform: selectedFunnelPlatform || null,
      community_platform: selectedCommunityPlatform || null,
      email_platform: selectedEmailPlatform || null,
      title: offerTitle.trim() || null,
      description: offerDescription.trim() || null,
      price: offerPrice ? parseFloat(offerPrice) : null,
      target_audience: targetAudience.trim() || null,
      primary_pain_point: primaryPainPoint.trim() || null,
      desired_outcome: desiredOutcome.trim() || null,
      problem_statement: problemStatement.trim() || null,
      transformation_statement: editedTransformation.trim() || null,
    };

    if (offer) {
      updateMutation.mutate({ id: offer.id, ...offerData });
    } else {
      createMutation.mutate(offerData);
    }
  };

  const selectedOfferDetails = getOfferDetails(selectedOfferType);
  const selectedFunnelDetails = getFunnelDetails(selectedFunnelType);
  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Step validation
  const canProceedToStep2 = selectedNiche && targetAudience.trim() && primaryPainPoint.trim() && desiredOutcome.trim();
  const canProceedToStep3 = canProceedToStep2 && selectedOfferType;
  const canProceedToStep4 = canProceedToStep3; // Transformation optional
  const canProceedToStep5 = canProceedToStep4; // Deliverables optional
  const canProceedToStep6 = canProceedToStep5; // AI Ideas optional
  const canProceedToStep7 = canProceedToStep6 && offerTitle.trim() && offerDescription.trim();
  const canProceedToStep8 = canProceedToStep7 && selectedFunnelType;
  const canSave = canProceedToStep8;
  const canSavePartial = selectedNiche && selectedOfferType;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const savedOfferDetails = offer ? getOfferDetails(offer.offer_type) : null;
  const savedFunnelDetails = offer?.funnel_type ? getFunnelDetails(offer.funnel_type) : null;
  const SavedOfferIcon = savedOfferDetails?.icon || Gift;
  const SavedFunnelIcon = savedFunnelDetails?.icon || Rocket;

  return (
    <div className="space-y-6">
      {!offer ? (
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
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center", savedOfferDetails?.bgColor || "bg-muted")}>
                    <SavedOfferIcon className={cn("w-7 h-7", savedOfferDetails?.color || "text-muted-foreground")} />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{offer.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline">
                        {offer.offer_category === "Audience-Growing Offers" ? "Warm-Up Offer" : "Paid Offer"}
                      </Badge>
                      <Badge variant="secondary">{savedOfferDetails?.name}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditOffer(1)}>
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
              {/* Problem Statement */}
              {offer.problem_statement && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">Problem Statement</p>
                      <p className="text-sm text-muted-foreground">{offer.problem_statement}</p>
                    </div>
                  </div>
                </div>
              )}

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

              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-foreground">{offer.description}</p>
              </div>

              {savedOfferDetails && (
                <div className="p-4 rounded-lg bg-muted/50 border border-border relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handleEditOffer(2)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <div className="flex items-start gap-3 pr-8">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", savedOfferDetails.bgColor)}>
                      <SavedOfferIcon className={cn("w-5 h-5", savedOfferDetails.color)} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">About {savedOfferDetails.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{savedOfferDetails.description}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Main Deliverables Card */}
          {offer?.main_deliverables && offer.main_deliverables.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10">
                      <CheckSquare className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Main Deliverables</CardTitle>
                      <CardDescription>What your clients will receive</CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handleEditOffer(4)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {offer.main_deliverables.map((deliverableId) => {
                    const deliverable = getDeliverableDetails(deliverableId);
                    if (!deliverable) return null;
                    const Icon = deliverable.icon;
                    return (
                      <div 
                        key={deliverableId}
                        className={cn("p-3 rounded-lg border border-border flex items-start gap-3", deliverable.bgColor)}
                      >
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-background/80")}>
                          <Icon className={cn("w-4 h-4", deliverable.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{deliverable.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{deliverable.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Platforms Card */}
          {(offer?.funnel_platform || offer?.community_platform || offer?.email_platform) && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Platforms</CardTitle>
                      <CardDescription>Tools you'll use to deliver your offer</CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handleEditOffer(8)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {offer?.funnel_platform && (() => {
                    const platform = getPlatformDetails(offer.funnel_platform, "Funnel Builders");
                    if (!platform) return null;
                    const Icon = platform.icon;
                    return (
                      <div className={cn("p-3 rounded-lg border border-border flex items-start gap-3", platform.bgColor)}>
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-background/80")}>
                          <Icon className={cn("w-4 h-4", platform.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Funnel Builder</p>
                          <p className="text-sm font-medium text-foreground">{platform.name}</p>
                        </div>
                      </div>
                    );
                  })()}
                  {offer?.community_platform && (() => {
                    const platform = getPlatformDetails(offer.community_platform, "Community & Engagement Platforms");
                    if (!platform) return null;
                    const Icon = platform.icon;
                    return (
                      <div className={cn("p-3 rounded-lg border border-border flex items-start gap-3", platform.bgColor)}>
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-background/80")}>
                          <Icon className={cn("w-4 h-4", platform.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Community Platform</p>
                          <p className="text-sm font-medium text-foreground">{platform.name}</p>
                        </div>
                      </div>
                    );
                  })()}
                  {offer?.email_platform && (() => {
                    const platform = getPlatformDetails(offer.email_platform, "Email Marketing Platforms");
                    if (!platform) return null;
                    const Icon = platform.icon;
                    return (
                      <div className={cn("p-3 rounded-lg border border-border flex items-start gap-3", platform.bgColor)}>
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-background/80")}>
                          <Icon className={cn("w-4 h-4", platform.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Email Marketing</p>
                          <p className="text-sm font-medium text-foreground">{platform.name}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Funnel Diagram Card */}
          {savedFunnelDetails && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", savedFunnelDetails.bgColor)}>
                      <SavedFunnelIcon className={cn("w-5 h-5", savedFunnelDetails.color)} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{savedFunnelDetails.name}</CardTitle>
                      <CardDescription>{savedFunnelDetails.purpose}</CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handleEditOffer(7)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <FunnelDiagram 
                  steps={savedFunnelDetails.steps} 
                  color={savedFunnelDetails.color}
                  bgColor={savedFunnelDetails.bgColor}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{offer ? "Edit Offer" : "Create Offer"}</DialogTitle>
            <DialogDescription>
              {step === 1 && "Step 1: Define your audience and their problem"}
              {step === 2 && "Step 2: Select your offer type"}
              {step === 3 && "Step 3: Craft your transformation statement"}
              {step === 4 && "Step 4: Select main deliverables (optional)"}
              {step === 5 && "Step 5: Get AI-powered offer ideas (optional)"}
              {step === 6 && "Step 6: Enter your offer details"}
              {step === 7 && "Step 7: Select your funnel type"}
              {step === 8 && "Step 8: Select your platforms"}
            </DialogDescription>
          </DialogHeader>
          
          {/* Step Indicators */}
          <div className="flex items-center gap-2 py-2 flex-shrink-0">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <div
                key={s}
                className={cn(
                  "flex-1 h-1.5 rounded-full transition-colors",
                  s <= step ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 pr-2">
            <div className="space-y-6 py-4 pr-2">
              {/* Step 1: Audience & Problem Discovery */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="niche">Niche <span className="text-destructive">*</span></Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="targetAudience">
                      Who is this offer for? <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Describe your ideal customer in detail — their demographics, situation, and characteristics.
                    </p>
                    <Textarea
                      id="targetAudience"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder="e.g., Overwhelmed new moms aged 30-40 who want to get back in shape but have no time for traditional gym workouts"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="primaryPainPoint">
                      What problem are they actively trying to solve? <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      What are they frustrated with, confused about, or stuck on right now?
                    </p>
                    <Textarea
                      id="primaryPainPoint"
                      value={primaryPainPoint}
                      onChange={(e) => setPrimaryPainPoint(e.target.value)}
                      placeholder="e.g., They've tried multiple fitness apps but can't stick to a routine because the workouts are too long and don't fit around baby's unpredictable schedule"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="desiredOutcome">
                      What result do they truly want? <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Describe what success looks like for them — the transformation they're seeking.
                    </p>
                    <Textarea
                      id="desiredOutcome"
                      value={desiredOutcome}
                      onChange={(e) => setDesiredOutcome(e.target.value)}
                      placeholder="e.g., To feel confident in their body again, have consistent energy throughout the day, and fit into their pre-pregnancy clothes within 3 months"
                      rows={3}
                    />
                  </div>

                  {/* Problem Statement Generation */}
                  <div className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        <Label className="text-sm font-medium">Problem Statement</Label>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateProblemStatement}
                        disabled={isGeneratingProblemStatement || !selectedNiche || !targetAudience.trim() || !primaryPainPoint.trim() || !desiredOutcome.trim()}
                      >
                        {isGeneratingProblemStatement ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : problemStatement ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Regenerate
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      AI will synthesize your answers into a clear problem statement that anchors your offer messaging.
                    </p>
                    {problemStatement && (
                      <Textarea
                        value={problemStatement}
                        onChange={(e) => setProblemStatement(e.target.value)}
                        rows={3}
                        className="mt-2"
                      />
                    )}
                    {!problemStatement && !isGeneratingProblemStatement && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <AlertCircle className="w-3 h-3" />
                        <span>Fill in all fields above to generate a problem statement</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Offer Type Selection */}
              {step === 2 && (
                <div className="space-y-4">
                  <Label>Select Offer Type <span className="text-destructive">*</span></Label>
                  
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
                              <CardHeader className="py-3 px-4">
                                <div className="flex items-start gap-3">
                                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", offerItem.bgColor)}>
                                    <Icon className={cn("w-5 h-5", offerItem.color)} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <CardTitle className="text-sm">{offerItem.name}</CardTitle>
                                    <CardDescription className="text-xs mt-0.5">{offerItem.description.substring(0, 80)}...</CardDescription>
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
                                    <p className="text-sm text-muted-foreground">{offerItem.description}</p>
                                  </div>
                                </CardContent>
                              )}
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Step 3: Transformation Statement */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-primary" />
                      Transformation Statement
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Create a clear, compelling statement that shows the transformation your offer provides.
                    </p>
                  </div>

                  {/* Timeframe input */}
                  <div className="space-y-2">
                    <Label htmlFor="timeframe">Timeframe <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input
                      id="timeframe"
                      value={transformationTimeframe}
                      onChange={(e) => setTransformationTimeframe(e.target.value)}
                      placeholder="e.g., '30 days', '8 weeks', '3 months'"
                    />
                    <p className="text-xs text-muted-foreground">If your offer has a specific timeframe, mention it here for more targeted statements.</p>
                  </div>

                  {/* Generate button */}
                  <div className="flex gap-2">
                    <Button 
                      onClick={generateTransformationStatements}
                      disabled={isGeneratingTransformations || isRefiningTransformations}
                    >
                      {isGeneratingTransformations ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : transformationStatements.length > 0 ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Regenerate
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Statements
                        </>
                      )}
                    </Button>
                    {transformationStatements.length > 0 && (
                      <Button 
                        variant="outline"
                        onClick={refineTransformationStatements}
                        disabled={isGeneratingTransformations || isRefiningTransformations}
                      >
                        {isRefiningTransformations ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Refining...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4 mr-2" />
                            Refine for Specificity
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Loading state */}
                  {isGeneratingTransformations && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                      <p className="text-sm text-muted-foreground">Crafting transformation statements...</p>
                    </div>
                  )}

                  {/* Empty state */}
                  {!isGeneratingTransformations && transformationStatements.length === 0 && !editedTransformation && (
                    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-lg">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Wand2 className="w-6 h-6 text-primary" />
                      </div>
                      <h4 className="text-sm font-medium text-foreground mb-1">No transformation statement yet</h4>
                      <p className="text-xs text-muted-foreground mb-4 max-w-sm">
                        Click "Generate Statements" to create 3 variations based on your audience, problem, and offer type.
                      </p>
                    </div>
                  )}

                  {/* Statement selection cards */}
                  {!isGeneratingTransformations && transformationStatements.length > 0 && (
                    <div className="space-y-3">
                      <Label>Select a statement to use:</Label>
                      <div className="grid gap-3">
                        {transformationStatements.map((statement, index) => {
                          const isSelected = selectedTransformationIndex === index;
                          
                          return (
                            <Card
                              key={index}
                              className={cn(
                                "cursor-pointer transition-all hover:border-primary/50",
                                isSelected && "border-primary ring-1 ring-primary"
                              )}
                              onClick={() => handleSelectTransformation(index)}
                            >
                              <CardHeader className="py-3 px-4">
                                <div className="flex items-start gap-3">
                                  <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold",
                                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                  )}>
                                    {index + 1}
                                  </div>
                                  <p className="text-sm text-foreground flex-1">{statement}</p>
                                  <div className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                    isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                                  )}>
                                    {isSelected && (
                                      <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </div>
                                </div>
                              </CardHeader>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Editable selected statement */}
                  {editedTransformation && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="editedTransformation">Your Transformation Statement</Label>
                        <Textarea
                          id="editedTransformation"
                          value={editedTransformation}
                          onChange={(e) => setEditedTransformation(e.target.value)}
                          rows={3}
                          placeholder="Your transformation statement..."
                        />
                      </div>

                      {/* Alignment check button */}
                      <Button 
                        variant="outline"
                        onClick={checkOfferAlignment}
                        disabled={isCheckingAlignment || !editedTransformation.trim()}
                      >
                        {isCheckingAlignment ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Checking...
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4 mr-2" />
                            Check Offer Type Alignment
                          </>
                        )}
                      </Button>

                      {/* Alignment feedback */}
                      {alignmentFeedback && (
                        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-start gap-3">
                          <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Alignment Feedback</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{alignmentFeedback}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground text-center">
                    This step is optional. You can skip or come back to it later.
                  </p>
                </div>
              )}

              {/* Step 4: Main Deliverables (optional) */}
              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <Label>Select Main Deliverables</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isSubscribed 
                        ? "Choose what your clients will receive. Select all that apply."
                        : "Choose what your clients will receive."}
                    </p>
                  </div>

                  {!isSubscribed && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-amber-600" />
                        <span className="text-sm text-amber-700">Free plan: 1 deliverable included</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-amber-700 border-amber-500/30 hover:bg-amber-500/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open('/settings', '_blank');
                        }}
                      >
                        Upgrade Plan
                      </Button>
                    </div>
                  )}

                  <div className="grid gap-3">
                    {MAIN_DELIVERABLES.map((deliverable) => {
                      const Icon = deliverable.icon;
                      const isSelected = selectedDeliverables.includes(deliverable.id);
                      
                      return (
                        <Card
                          key={deliverable.id}
                          className={cn(
                            "cursor-pointer transition-all hover:border-primary/50",
                            isSelected && "border-primary ring-1 ring-primary"
                          )}
                          onClick={() => toggleDeliverable(deliverable.id)}
                        >
                          <CardHeader className="py-3 px-4">
                            <div className="flex items-start gap-3">
                              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", deliverable.bgColor)}>
                                <Icon className={cn("w-5 h-5", deliverable.color)} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-sm">{deliverable.name}</CardTitle>
                                <CardDescription className="text-xs mt-0.5">{deliverable.description}</CardDescription>
                              </div>
                              <div className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                              )}>
                                {isSelected && (
                                  <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckSquare className="w-4 h-4" />
                    <span>{selectedDeliverables.length} deliverable{selectedDeliverables.length !== 1 ? 's' : ''} selected</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    This step is optional. You can skip if you haven't decided on deliverables yet.
                  </p>
                </div>
              )}

              {/* Step 5: AI Offer Ideas (optional) */}
              {step === 5 && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        AI Offer Ideas
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Get AI-powered offer suggestions based on your niche, offer type, and problem statement.
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={generateOfferIdeas}
                      disabled={isGeneratingIdeas}
                    >
                      {isGeneratingIdeas ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : offerIdeas.length > 0 ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Regenerate
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Ideas
                        </>
                      )}
                    </Button>
                  </div>

                  {isGeneratingIdeas && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                      <p className="text-sm text-muted-foreground">Generating creative offer ideas...</p>
                    </div>
                  )}

                  {!isGeneratingIdeas && offerIdeas.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-lg">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Lightbulb className="w-6 h-6 text-primary" />
                      </div>
                      <h4 className="text-sm font-medium text-foreground mb-1">No ideas generated yet</h4>
                      <p className="text-xs text-muted-foreground mb-4 max-w-sm">
                        Click "Generate Ideas" to get AI-powered offer suggestions based on your {selectedNiche} niche and {getOfferDetails(selectedOfferType)?.name} offer type.
                      </p>
                      <Button onClick={generateOfferIdeas} disabled={isGeneratingIdeas}>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Ideas
                      </Button>
                    </div>
                  )}

                  {!isGeneratingIdeas && offerIdeas.length > 0 && (
                    <div className="grid gap-3">
                      {offerIdeas.map((idea, index) => {
                        const isSelected = selectedIdeaIndex === index;
                        
                        return (
                          <Card
                            key={index}
                            className={cn(
                              "cursor-pointer transition-all hover:border-primary/50",
                              isSelected && "border-primary ring-1 ring-primary"
                            )}
                            onClick={() => handleSelectIdea(index)}
                          >
                            <CardHeader className="py-3 px-4">
                              <div className="flex items-start gap-3">
                                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", isSelected ? "bg-primary/20" : "bg-muted")}>
                                  <Lightbulb className={cn("w-5 h-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-sm">{idea.title}</CardTitle>
                                  <CardDescription className="text-xs mt-1">{idea.description}</CardDescription>
                                </div>
                                <div className={cn(
                                  "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                  isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                                )}>
                                  {isSelected && (
                                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground text-center">
                    This step is optional. You can skip and enter your own offer details in the next step.
                  </p>
                </div>
              )}

              {/* Step 6: Offer Details (title, description, price) */}
              {step === 6 && (
                <div className="space-y-4">
                  {selectedIdeaIndex !== null && offerIdeas[selectedIdeaIndex] && (
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-start gap-3">
                      <Lightbulb className="w-4 h-4 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Using AI-generated idea</p>
                        <p className="text-xs text-muted-foreground mt-0.5">You can edit the title and description below.</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="offerTitle">Offer Title <span className="text-destructive">*</span></Label>
                    <Input
                      id="offerTitle"
                      value={offerTitle}
                      onChange={(e) => setOfferTitle(e.target.value)}
                      placeholder="e.g., 'Launch Like a Pro Masterclass'"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="offerDescription">Description <span className="text-destructive">*</span></Label>
                    <Textarea
                      id="offerDescription"
                      value={offerDescription}
                      onChange={(e) => setOfferDescription(e.target.value)}
                      placeholder="Describe what your offer includes and who it's for..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="offerPrice">Price ($) <span className="text-muted-foreground text-xs">(optional)</span></Label>
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

              {/* Step 7: Funnel Type */}
              {step === 7 && (
                <div className="space-y-4">
                  <Label>Select Funnel Type <span className="text-destructive">*</span></Label>
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
                                  {funnel.steps.map((funnelStep, index) => (
                                    <li key={index}>{index + 1}. {funnelStep}</li>
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

              {/* Step 8: Platform Selection */}
              {step === 8 && (
                <div className="space-y-6">
                  <div>
                    <Label>Select Your Platforms</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Choose one platform from each category that you'll use for your offer.
                    </p>
                  </div>

                  {Object.entries(PLATFORM_CATEGORIES).map(([category, platforms]) => {
                    const isFunnelCategory = category === "Funnel Builders";
                    const isCommunityCategory = category === "Community & Engagement Platforms";
                    const selectedPlatform = isFunnelCategory 
                      ? selectedFunnelPlatform 
                      : isCommunityCategory 
                        ? selectedCommunityPlatform 
                        : selectedEmailPlatform;
                    const setSelectedPlatform = isFunnelCategory 
                      ? setSelectedFunnelPlatform 
                      : isCommunityCategory 
                        ? setSelectedCommunityPlatform 
                        : setSelectedEmailPlatform;
                    
                    return (
                      <div key={category} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-foreground">{category}</h4>
                          {selectedPlatform && (
                            <Badge variant="secondary" className="text-xs">
                              1 selected
                            </Badge>
                          )}
                        </div>
                        <div className="grid gap-3">
                          {platforms.map((platform) => {
                            const Icon = platform.icon;
                            const isSelected = selectedPlatform === platform.id;
                            
                            return (
                              <Card
                                key={platform.id}
                                className={cn(
                                  "cursor-pointer transition-all hover:border-primary/50",
                                  isSelected && "border-primary ring-1 ring-primary"
                                )}
                                onClick={() => setSelectedPlatform(isSelected ? "" : platform.id)}
                              >
                                <CardHeader className="py-3 px-4">
                                  <div className="flex items-start gap-3">
                                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", platform.bgColor)}>
                                      <Icon className={cn("w-5 h-5", platform.color)} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <CardTitle className="text-sm">{platform.name}</CardTitle>
                                      <CardDescription className="text-xs mt-0.5">{platform.description}</CardDescription>
                                    </div>
                                    <div className={cn(
                                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                      isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                                    )}>
                                      {isSelected && (
                                        <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </div>
                                  </div>
                                </CardHeader>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-3 pt-4 border-t flex-shrink-0">
            <Button 
              variant="outline" 
              onClick={() => step === 1 ? handleCloseDialog() : setStep((step - 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7)}
            >
              {step === 1 ? "Cancel" : "Back"}
            </Button>
            <div className="flex gap-2">
              {canSavePartial && step < 8 && (
                <Button 
                  variant="outline"
                  onClick={() => handleSaveOffer(true)}
                  disabled={isSaving}
                >
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save & Exit
                </Button>
              )}
              {(step === 3 || step === 4 || step === 5) && (
                <Button 
                  variant="outline"
                  onClick={() => setStep((step + 1) as 4 | 5 | 6)}
                >
                  Skip
                </Button>
              )}
              {step < 8 ? (
                <Button 
                  onClick={() => setStep((step + 1) as 2 | 3 | 4 | 5 | 6 | 7 | 8)}
                  disabled={
                    step === 1 ? !canProceedToStep2 : 
                    step === 2 ? !canProceedToStep3 :
                    step === 3 ? !canProceedToStep4 :
                    step === 4 ? !canProceedToStep5 :
                    step === 5 ? !canProceedToStep6 :
                    step === 6 ? !canProceedToStep7 :
                    step === 7 ? !canProceedToStep8 :
                    false
                  }
                >
                  Continue
                </Button>
              ) : (
                <Button 
                  onClick={() => handleSaveOffer(false)} 
                  disabled={!canSave || isSaving}
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
