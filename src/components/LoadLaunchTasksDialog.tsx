import { useState, useEffect } from "react";
import { ListChecks, Loader2, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";

interface LoadLaunchTasksDialogProps {
  projectId: string;
  projectType: "launch" | "prelaunch";
  onTasksLoaded: () => void;
  taskCount: number;
  trigger?: React.ReactNode;
  showDeleteOnly?: boolean;
}

interface TaskTemplate {
  title: string;
  labels: string[];
  phase: string;
}

interface Offer {
  id: string;
  offer_type: string;
  offer_category: string;
  funnel_type: string | null;
  main_deliverables: string[] | null;
  funnel_platform: string | null;
  community_platform: string | null;
  email_platform: string | null;
  niche: string;
  title: string | null;
}

// Base tasks that apply to all offer types
const BASE_FOUNDATION_TASKS: TaskTemplate[] = [
  { title: "Define your target audience (avatar/ideal customer)", labels: ["strategy"], phase: "foundation" },
  { title: "Identify the specific transformation your product delivers", labels: ["strategy"], phase: "foundation" },
  { title: "Research competitors and their offerings", labels: ["strategy"], phase: "foundation" },
  { title: "Determine your unique positioning/angle", labels: ["strategy"], phase: "foundation" },
  { title: "Validate product idea with audience (poll, survey, or conversations)", labels: ["strategy"], phase: "foundation" },
  { title: "Set revenue goal for launch", labels: ["strategy"], phase: "foundation" },
  { title: "Set enrollment goal (number of customers)", labels: ["strategy"], phase: "foundation" },
  { title: "Decide on product name", labels: ["creative"], phase: "foundation" },
  { title: "Write product tagline/subtitle", labels: ["copy"], phase: "foundation" },
  { title: "Create product guarantee/refund policy", labels: ["copy"], phase: "foundation" },
  { title: "Set launch date (enrollment opens)", labels: ["strategy"], phase: "foundation" },
  { title: "Set cart close date", labels: ["strategy"], phase: "foundation" },
  { title: "Create master launch timeline with all milestones", labels: ["strategy"], phase: "foundation" },
];

// Tasks by offer type
const OFFER_TYPE_TASKS: Record<string, TaskTemplate[]> = {
  "strategic-freebies": [
    { title: "Choose freebie format (PDF, video, audio, template)", labels: ["strategy"], phase: "content-creation" },
    { title: "Outline freebie content structure", labels: ["creative"], phase: "content-creation" },
    { title: "Write freebie content", labels: ["copy"], phase: "content-creation" },
    { title: "Design freebie with branding", labels: ["creative"], phase: "content-creation" },
    { title: "Create freebie mockup image", labels: ["creative"], phase: "content-creation" },
    { title: "Set up opt-in page for freebie", labels: ["technical"], phase: "technical-setup" },
    { title: "Create thank you page with delivery", labels: ["technical"], phase: "technical-setup" },
    { title: "Write opt-in page copy", labels: ["copy"], phase: "sales-page" },
    { title: "Test freebie delivery automation", labels: ["technical"], phase: "launch-prep" },
  ],
  "tangible-digital-products": [
    { title: "Create template/planner/workbook structure", labels: ["creative"], phase: "content-creation" },
    { title: "Design all pages/sections", labels: ["creative"], phase: "content-creation" },
    { title: "Add instructions/how-to-use section", labels: ["copy"], phase: "content-creation" },
    { title: "Create product mockups", labels: ["creative"], phase: "content-creation" },
    { title: "Set product pricing", labels: ["strategy"], phase: "foundation" },
    { title: "Write product description", labels: ["copy"], phase: "sales-page" },
  ],
  "online-workshops": [
    { title: "Choose workshop topic and outcome", labels: ["strategy"], phase: "foundation" },
    { title: "Create workshop outline/agenda", labels: ["creative"], phase: "content-creation" },
    { title: "Develop workshop slides/presentation", labels: ["creative"], phase: "content-creation" },
    { title: "Plan interactive elements (polls, Q&A, breakouts)", labels: ["strategy"], phase: "content-creation" },
    { title: "Set up webinar/workshop platform", labels: ["technical"], phase: "technical-setup" },
    { title: "Create workshop registration page", labels: ["technical"], phase: "technical-setup" },
    { title: "Write registration page copy", labels: ["copy"], phase: "sales-page" },
    { title: "Set up reminder email sequence", labels: ["technical"], phase: "email-marketing" },
    { title: "Record workshop or prepare for live delivery", labels: ["video"], phase: "content-creation" },
    { title: "Plan workshop follow-up offer", labels: ["strategy"], phase: "foundation" },
  ],
  "1-1-coaching": [
    { title: "Define coaching package structure (sessions, duration, frequency)", labels: ["strategy"], phase: "foundation" },
    { title: "Create intake questionnaire", labels: ["copy"], phase: "content-creation" },
    { title: "Set up scheduling system (Calendly, etc.)", labels: ["technical"], phase: "technical-setup" },
    { title: "Create welcome packet/onboarding materials", labels: ["creative"], phase: "content-creation" },
    { title: "Design session framework/structure", labels: ["strategy"], phase: "content-creation" },
    { title: "Create application/discovery call booking page", labels: ["technical"], phase: "technical-setup" },
    { title: "Write discovery call script", labels: ["copy"], phase: "sales-page" },
    { title: "Create coaching agreement/contract", labels: ["copy"], phase: "content-creation" },
    { title: "Set up payment processing for high-ticket", labels: ["technical"], phase: "technical-setup" },
    { title: "Create client portal or resource hub", labels: ["technical"], phase: "technical-setup" },
  ],
  "coaching-membership": [
    { title: "Define membership tiers and pricing", labels: ["strategy"], phase: "foundation" },
    { title: "Plan monthly content calendar", labels: ["strategy"], phase: "content-creation" },
    { title: "Create onboarding sequence for new members", labels: ["copy"], phase: "content-creation" },
    { title: "Set up membership platform", labels: ["technical"], phase: "technical-setup" },
    { title: "Create member welcome area", labels: ["technical"], phase: "technical-setup" },
    { title: "Plan live call schedule (group calls, Q&As)", labels: ["strategy"], phase: "foundation" },
    { title: "Set up recurring billing", labels: ["technical"], phase: "technical-setup" },
    { title: "Create membership cancellation process", labels: ["technical"], phase: "technical-setup" },
    { title: "Design retention strategy", labels: ["strategy"], phase: "foundation" },
    { title: "Create member-only resources library", labels: ["creative"], phase: "content-creation" },
  ],
  "group-coaching-program": [
    { title: "Define program duration and structure", labels: ["strategy"], phase: "foundation" },
    { title: "Create curriculum outline by week/module", labels: ["creative"], phase: "content-creation" },
    { title: "Plan group call schedule", labels: ["strategy"], phase: "foundation" },
    { title: "Create program workbook/resources", labels: ["creative"], phase: "content-creation" },
    { title: "Set up group coaching platform", labels: ["technical"], phase: "technical-setup" },
    { title: "Create program welcome sequence", labels: ["copy"], phase: "content-creation" },
    { title: "Design accountability/tracking system", labels: ["strategy"], phase: "content-creation" },
    { title: "Plan graduation/completion process", labels: ["strategy"], phase: "delivery" },
  ],
  "flagship-course": [
    { title: "Create comprehensive curriculum outline", labels: ["creative"], phase: "content-creation" },
    { title: "Outline all modules and lessons", labels: ["creative"], phase: "content-creation" },
    { title: "Write learning objectives per module", labels: ["copy"], phase: "content-creation" },
    { title: "Decide content format (video, text, audio)", labels: ["strategy"], phase: "foundation" },
    { title: "Create lesson scripts/outlines", labels: ["copy"], phase: "content-creation" },
    { title: "Record all video lessons", labels: ["video"], phase: "content-creation" },
    { title: "Create course workbooks and templates", labels: ["creative"], phase: "content-creation" },
    { title: "Set up course platform", labels: ["technical"], phase: "technical-setup" },
    { title: "Upload all course content", labels: ["technical"], phase: "technical-setup" },
    { title: "Configure drip schedule if applicable", labels: ["technical"], phase: "technical-setup" },
    { title: "Create course completion certificate", labels: ["creative"], phase: "content-creation" },
    { title: "Test entire course experience", labels: ["technical"], phase: "launch-prep" },
  ],
  "mini-courses": [
    { title: "Choose focused topic for mini-course", labels: ["strategy"], phase: "foundation" },
    { title: "Create simple 3-5 lesson outline", labels: ["creative"], phase: "content-creation" },
    { title: "Record or create lesson content", labels: ["video"], phase: "content-creation" },
    { title: "Create quick-win worksheet", labels: ["creative"], phase: "content-creation" },
    { title: "Set up course delivery platform", labels: ["technical"], phase: "technical-setup" },
    { title: "Create upsell to main offer", labels: ["strategy"], phase: "foundation" },
  ],
};

// Tasks by funnel type
const FUNNEL_TYPE_TASKS: Record<string, TaskTemplate[]> = {
  "freebie-funnel": [
    { title: "Create freebie opt-in landing page", labels: ["technical"], phase: "technical-setup" },
    { title: "Write compelling opt-in page headline", labels: ["copy"], phase: "sales-page" },
    { title: "Create thank you page with next steps", labels: ["technical"], phase: "technical-setup" },
    { title: "Write 3-5 email welcome sequence", labels: ["copy", "marketing"], phase: "email-marketing" },
    { title: "Add soft CTA to next offer in sequence", labels: ["copy"], phase: "email-marketing" },
  ],
  "low-ticket-funnel": [
    { title: "Create sales page for low-ticket offer", labels: ["technical"], phase: "sales-page" },
    { title: "Write sales page copy ($7-$49 positioning)", labels: ["copy"], phase: "sales-page" },
    { title: "Set up checkout page with order form", labels: ["technical"], phase: "technical-setup" },
    { title: "Create order bump offer", labels: ["strategy"], phase: "foundation" },
    { title: "Set up upsell page (optional)", labels: ["technical"], phase: "technical-setup" },
    { title: "Create post-purchase email sequence", labels: ["copy"], phase: "email-marketing" },
  ],
  "vsl-funnel": [
    { title: "Write VSL script", labels: ["copy", "video"], phase: "content-creation" },
    { title: "Record VSL video", labels: ["video"], phase: "content-creation" },
    { title: "Create VSL landing page", labels: ["technical"], phase: "technical-setup" },
    { title: "Set up checkout page", labels: ["technical"], phase: "technical-setup" },
    { title: "Create onboarding page", labels: ["technical"], phase: "technical-setup" },
    { title: "Write follow-up email sequence", labels: ["copy"], phase: "email-marketing" },
  ],
  "instagram-funnel": [
    { title: "Plan Instagram content series (Reels, Posts, Stories)", labels: ["creative", "marketing"], phase: "prelaunch-content" },
    { title: "Create link in bio page", labels: ["technical"], phase: "technical-setup" },
    { title: "Set up opt-in or sales page from bio", labels: ["technical"], phase: "technical-setup" },
    { title: "Create DM follow-up templates", labels: ["copy"], phase: "prelaunch-content" },
    { title: "Plan story-to-sale content flow", labels: ["strategy"], phase: "prelaunch-content" },
  ],
  "webinar-funnel": [
    { title: "Create webinar registration page", labels: ["technical"], phase: "technical-setup" },
    { title: "Write registration page copy", labels: ["copy"], phase: "sales-page" },
    { title: "Create webinar confirmation page", labels: ["technical"], phase: "technical-setup" },
    { title: "Set up reminder email sequence (3-5 reminders)", labels: ["technical"], phase: "email-marketing" },
    { title: "Create webinar presentation", labels: ["creative"], phase: "content-creation" },
    { title: "Write webinar script with offer pitch", labels: ["copy"], phase: "content-creation" },
    { title: "Record or deliver live webinar", labels: ["video"], phase: "content-creation" },
    { title: "Create checkout page for webinar offer", labels: ["technical"], phase: "technical-setup" },
    { title: "Write replay email sequence", labels: ["copy"], phase: "email-marketing" },
  ],
  "challenge-funnel": [
    { title: "Create challenge registration page", labels: ["technical"], phase: "technical-setup" },
    { title: "Write challenge welcome email", labels: ["copy"], phase: "email-marketing" },
    { title: "Create Day 1 challenge content", labels: ["creative"], phase: "content-creation" },
    { title: "Create Day 2 challenge content", labels: ["creative"], phase: "content-creation" },
    { title: "Create Day 3 challenge content", labels: ["creative"], phase: "content-creation" },
    { title: "Create Day 4 challenge content", labels: ["creative"], phase: "content-creation" },
    { title: "Create Day 5 challenge content", labels: ["creative"], phase: "content-creation" },
    { title: "Set up challenge community/group", labels: ["technical"], phase: "technical-setup" },
    { title: "Plan offer reveal moment", labels: ["strategy"], phase: "foundation" },
    { title: "Create challenge-to-offer sales page", labels: ["technical"], phase: "sales-page" },
  ],
  "membership-funnel": [
    { title: "Create membership awareness content", labels: ["creative", "marketing"], phase: "prelaunch-content" },
    { title: "Build membership sales page", labels: ["technical"], phase: "sales-page" },
    { title: "Write membership sales page copy", labels: ["copy"], phase: "sales-page" },
    { title: "Set up recurring payment checkout", labels: ["technical"], phase: "technical-setup" },
    { title: "Create member onboarding page", labels: ["technical"], phase: "technical-setup" },
    { title: "Write orientation email sequence", labels: ["copy"], phase: "email-marketing" },
    { title: "Plan ongoing retention emails", labels: ["strategy"], phase: "email-marketing" },
  ],
  "application-funnel": [
    { title: "Create authority content/free training", labels: ["creative"], phase: "prelaunch-content" },
    { title: "Build application page", labels: ["technical"], phase: "technical-setup" },
    { title: "Write application questions", labels: ["copy"], phase: "sales-page" },
    { title: "Create application confirmation page", labels: ["technical"], phase: "technical-setup" },
    { title: "Set up application review process", labels: ["strategy"], phase: "foundation" },
    { title: "Create strategy call booking page", labels: ["technical"], phase: "technical-setup" },
    { title: "Write sales call script", labels: ["copy"], phase: "sales-page" },
    { title: "Create contract template", labels: ["copy"], phase: "content-creation" },
  ],
  "email-nurture-funnel": [
    { title: "Create lead magnet entry point", labels: ["creative"], phase: "content-creation" },
    { title: "Write welcome email sequence (5-7 emails)", labels: ["copy"], phase: "email-marketing" },
    { title: "Plan value emails (education, stories, wins)", labels: ["strategy"], phase: "email-marketing" },
    { title: "Write soft offer introduction email", labels: ["copy"], phase: "email-marketing" },
    { title: "Create direct sales CTA email", labels: ["copy"], phase: "email-marketing" },
    { title: "Plan ongoing weekly email content", labels: ["strategy"], phase: "email-marketing" },
  ],
  "launch-funnel": [
    { title: "Plan pre-launch content calendar", labels: ["strategy", "marketing"], phase: "prelaunch-content" },
    { title: "Create waitlist/early access page", labels: ["technical"], phase: "technical-setup" },
    { title: "Write pre-launch email sequence", labels: ["copy"], phase: "email-marketing" },
    { title: "Create cart open announcement", labels: ["copy", "marketing"], phase: "launch-execution" },
    { title: "Build sales page", labels: ["technical"], phase: "sales-page" },
    { title: "Set up checkout page", labels: ["technical"], phase: "technical-setup" },
    { title: "Write cart close urgency emails", labels: ["copy"], phase: "email-marketing" },
    { title: "Create onboarding/welcome sequence", labels: ["copy"], phase: "delivery" },
  ],
};

// Tasks by deliverable type
const DELIVERABLE_TASKS: Record<string, TaskTemplate[]> = {
  "step-by-step-tutorials": [
    { title: "Outline tutorial structure and steps", labels: ["creative"], phase: "content-creation" },
    { title: "Write tutorial script or outline", labels: ["copy"], phase: "content-creation" },
    { title: "Record tutorial videos", labels: ["video"], phase: "content-creation" },
    { title: "Edit and polish tutorial content", labels: ["video"], phase: "content-creation" },
  ],
  "checklists": [
    { title: "Create checklist content and items", labels: ["copy"], phase: "content-creation" },
    { title: "Design checklist PDF", labels: ["creative"], phase: "content-creation" },
    { title: "Create fillable/interactive version", labels: ["technical"], phase: "content-creation" },
  ],
  "cheat-sheets": [
    { title: "Compile key information for cheat sheet", labels: ["copy"], phase: "content-creation" },
    { title: "Design cheat sheet layout", labels: ["creative"], phase: "content-creation" },
    { title: "Create printable PDF version", labels: ["creative"], phase: "content-creation" },
  ],
  "coaching-sessions": [
    { title: "Create session agenda template", labels: ["creative"], phase: "content-creation" },
    { title: "Develop session framework", labels: ["strategy"], phase: "content-creation" },
    { title: "Set up call scheduling system", labels: ["technical"], phase: "technical-setup" },
    { title: "Create pre-session questionnaire", labels: ["copy"], phase: "content-creation" },
    { title: "Create post-session action template", labels: ["creative"], phase: "content-creation" },
  ],
  "workbooks": [
    { title: "Outline workbook sections and exercises", labels: ["creative"], phase: "content-creation" },
    { title: "Write workbook prompts and content", labels: ["copy"], phase: "content-creation" },
    { title: "Design workbook pages", labels: ["creative"], phase: "content-creation" },
    { title: "Create fillable PDF version", labels: ["technical"], phase: "content-creation" },
  ],
  "planners": [
    { title: "Design planner layout and sections", labels: ["creative"], phase: "content-creation" },
    { title: "Create planner pages (daily, weekly, monthly)", labels: ["creative"], phase: "content-creation" },
    { title: "Add goal-setting and tracking sections", labels: ["creative"], phase: "content-creation" },
    { title: "Create printable and digital versions", labels: ["technical"], phase: "content-creation" },
  ],
  "templates": [
    { title: "Create template structure and format", labels: ["creative"], phase: "content-creation" },
    { title: "Write template instructions", labels: ["copy"], phase: "content-creation" },
    { title: "Design template with branding", labels: ["creative"], phase: "content-creation" },
    { title: "Create editable version (Canva, Google Docs, etc.)", labels: ["technical"], phase: "content-creation" },
  ],
  "trello-boards": [
    { title: "Plan Trello board structure and lists", labels: ["strategy"], phase: "content-creation" },
    { title: "Create board with all cards and checklists", labels: ["technical"], phase: "content-creation" },
    { title: "Add labels, due dates, and descriptions", labels: ["technical"], phase: "content-creation" },
    { title: "Write board usage instructions", labels: ["copy"], phase: "content-creation" },
  ],
  "audio-files": [
    { title: "Write audio scripts", labels: ["copy"], phase: "content-creation" },
    { title: "Record audio content", labels: ["creative"], phase: "content-creation" },
    { title: "Edit and master audio files", labels: ["creative"], phase: "content-creation" },
    { title: "Create audio file covers/artwork", labels: ["creative"], phase: "content-creation" },
  ],
  "affirmations": [
    { title: "Write affirmation statements", labels: ["copy"], phase: "content-creation" },
    { title: "Record affirmation audio (optional)", labels: ["creative"], phase: "content-creation" },
    { title: "Design affirmation cards or PDF", labels: ["creative"], phase: "content-creation" },
  ],
  "journals": [
    { title: "Create journal prompts and sections", labels: ["copy"], phase: "content-creation" },
    { title: "Design journal pages", labels: ["creative"], phase: "content-creation" },
    { title: "Add reflection and tracking sections", labels: ["creative"], phase: "content-creation" },
    { title: "Create printable PDF version", labels: ["creative"], phase: "content-creation" },
  ],
  "support-groups": [
    { title: "Set up community platform (Facebook, Discord, etc.)", labels: ["technical"], phase: "technical-setup" },
    { title: "Create community guidelines", labels: ["copy"], phase: "content-creation" },
    { title: "Plan community engagement activities", labels: ["strategy"], phase: "foundation" },
    { title: "Set up moderation and welcome process", labels: ["technical"], phase: "technical-setup" },
  ],
  "voice-message-support": [
    { title: "Set up Voxer/voice message platform", labels: ["technical"], phase: "technical-setup" },
    { title: "Create voice support guidelines and boundaries", labels: ["copy"], phase: "content-creation" },
    { title: "Plan response time expectations", labels: ["strategy"], phase: "foundation" },
  ],
  "text-message-support": [
    { title: "Set up text messaging platform", labels: ["technical"], phase: "technical-setup" },
    { title: "Create text support guidelines", labels: ["copy"], phase: "content-creation" },
    { title: "Plan response templates for common questions", labels: ["copy"], phase: "content-creation" },
  ],
  "email-support": [
    { title: "Set up dedicated support email", labels: ["technical"], phase: "technical-setup" },
    { title: "Create email response templates", labels: ["copy"], phase: "content-creation" },
    { title: "Plan email support response time", labels: ["strategy"], phase: "foundation" },
  ],
  "live-chat-support": [
    { title: "Set up live chat platform", labels: ["technical"], phase: "technical-setup" },
    { title: "Create chat response templates", labels: ["copy"], phase: "content-creation" },
    { title: "Plan chat availability hours", labels: ["strategy"], phase: "foundation" },
  ],
};

// Platform-specific tasks
const PLATFORM_TASKS: Record<string, TaskTemplate[]> = {
  // Funnel Builders
  "clickfunnels": [
    { title: "Set up ClickFunnels account and domain", labels: ["technical"], phase: "technical-setup" },
    { title: "Create funnel structure in ClickFunnels", labels: ["technical"], phase: "technical-setup" },
    { title: "Design landing pages in ClickFunnels", labels: ["creative"], phase: "technical-setup" },
    { title: "Set up checkout and order forms", labels: ["technical"], phase: "technical-setup" },
    { title: "Configure payment integration (Stripe)", labels: ["technical"], phase: "technical-setup" },
  ],
  "kartra": [
    { title: "Set up Kartra account and domain", labels: ["technical"], phase: "technical-setup" },
    { title: "Create pages and funnels in Kartra", labels: ["technical"], phase: "technical-setup" },
    { title: "Set up Kartra email automations", labels: ["technical"], phase: "technical-setup" },
    { title: "Configure Kartra membership if needed", labels: ["technical"], phase: "technical-setup" },
  ],
  "systeme-io": [
    { title: "Set up Systeme.io account", labels: ["technical"], phase: "technical-setup" },
    { title: "Connect payment processor (Stripe/PayPal)", labels: ["technical"], phase: "technical-setup" },
    { title: "Create sales funnel in Systeme.io", labels: ["technical"], phase: "technical-setup" },
    { title: "Set up email automations", labels: ["technical"], phase: "technical-setup" },
    { title: "Create course/membership area if needed", labels: ["technical"], phase: "technical-setup" },
    { title: "Test entire funnel flow", labels: ["technical"], phase: "launch-prep" },
  ],
  "kajabi-funnel": [
    { title: "Set up Kajabi account and branding", labels: ["technical"], phase: "technical-setup" },
    { title: "Create pipeline (funnel) in Kajabi", labels: ["technical"], phase: "technical-setup" },
    { title: "Build landing pages in Kajabi", labels: ["technical"], phase: "technical-setup" },
    { title: "Set up Kajabi automations", labels: ["technical"], phase: "technical-setup" },
  ],
  // Community Platforms
  "mighty-networks": [
    { title: "Set up Mighty Networks space", labels: ["technical"], phase: "technical-setup" },
    { title: "Configure community settings and sections", labels: ["technical"], phase: "technical-setup" },
    { title: "Create welcome content for new members", labels: ["copy"], phase: "content-creation" },
    { title: "Set up community guidelines post", labels: ["copy"], phase: "content-creation" },
  ],
  "circle": [
    { title: "Set up Circle community", labels: ["technical"], phase: "technical-setup" },
    { title: "Create spaces and categories", labels: ["technical"], phase: "technical-setup" },
    { title: "Configure member onboarding flow", labels: ["technical"], phase: "technical-setup" },
  ],
  "discord": [
    { title: "Create Discord server", labels: ["technical"], phase: "technical-setup" },
    { title: "Set up channels and categories", labels: ["technical"], phase: "technical-setup" },
    { title: "Configure roles and permissions", labels: ["technical"], phase: "technical-setup" },
    { title: "Create welcome channel and rules", labels: ["copy"], phase: "content-creation" },
  ],
  "slack": [
    { title: "Create Slack workspace", labels: ["technical"], phase: "technical-setup" },
    { title: "Set up channels for different topics", labels: ["technical"], phase: "technical-setup" },
    { title: "Create welcome messages and guidelines", labels: ["copy"], phase: "content-creation" },
  ],
  "facebook-groups": [
    { title: "Create Facebook Group", labels: ["technical"], phase: "technical-setup" },
    { title: "Set up group settings and questions", labels: ["technical"], phase: "technical-setup" },
    { title: "Create pinned welcome post", labels: ["copy"], phase: "content-creation" },
    { title: "Set up group rules", labels: ["copy"], phase: "content-creation" },
  ],
  // Email Platforms
  "mailchimp": [
    { title: "Set up Mailchimp account", labels: ["technical"], phase: "technical-setup" },
    { title: "Create audience/list in Mailchimp", labels: ["technical"], phase: "technical-setup" },
    { title: "Design email templates with branding", labels: ["creative"], phase: "technical-setup" },
    { title: "Set up email automations", labels: ["technical"], phase: "email-marketing" },
  ],
  "convertkit": [
    { title: "Set up ConvertKit account", labels: ["technical"], phase: "technical-setup" },
    { title: "Create sequences in ConvertKit", labels: ["technical"], phase: "email-marketing" },
    { title: "Set up tags for segmentation", labels: ["technical"], phase: "technical-setup" },
    { title: "Create automation rules", labels: ["technical"], phase: "email-marketing" },
  ],
  "activecampaign-email": [
    { title: "Set up ActiveCampaign account", labels: ["technical"], phase: "technical-setup" },
    { title: "Create lists and tags", labels: ["technical"], phase: "technical-setup" },
    { title: "Build email automations", labels: ["technical"], phase: "email-marketing" },
    { title: "Configure CRM pipeline if using", labels: ["technical"], phase: "technical-setup" },
  ],
  "mailerlite": [
    { title: "Set up MailerLite account", labels: ["technical"], phase: "technical-setup" },
    { title: "Create subscriber groups", labels: ["technical"], phase: "technical-setup" },
    { title: "Design email templates", labels: ["creative"], phase: "technical-setup" },
    { title: "Build email automations", labels: ["technical"], phase: "email-marketing" },
  ],
  "flodesk": [
    { title: "Set up Flodesk account", labels: ["technical"], phase: "technical-setup" },
    { title: "Create segments in Flodesk", labels: ["technical"], phase: "technical-setup" },
    { title: "Design beautiful email templates", labels: ["creative"], phase: "technical-setup" },
    { title: "Set up workflows/automations", labels: ["technical"], phase: "email-marketing" },
  ],
};

// Launch execution tasks
const LAUNCH_EXECUTION_TASKS: TaskTemplate[] = [
  { title: "Launch Day: Send launch announcement email", labels: ["marketing", "high-priority"], phase: "launch-execution" },
  { title: "Launch Day: Post launch announcement on all platforms", labels: ["marketing", "high-priority"], phase: "launch-execution" },
  { title: "Launch Day: Go live if planned", labels: ["video", "marketing"], phase: "launch-execution" },
  { title: "Launch Day: Monitor sales and respond to questions", labels: ["marketing"], phase: "launch-execution" },
  { title: "Mid-Launch: Send daily emails", labels: ["copy", "marketing"], phase: "launch-execution" },
  { title: "Mid-Launch: Post daily social content", labels: ["marketing"], phase: "launch-execution" },
  { title: "Mid-Launch: Address objections and questions", labels: ["marketing"], phase: "launch-execution" },
  { title: "Cart Close: Send 48-hour warning email", labels: ["marketing", "high-priority"], phase: "launch-execution" },
  { title: "Cart Close: Send 24-hour warning email", labels: ["marketing", "high-priority"], phase: "launch-execution" },
  { title: "Cart Close: Send final hours reminder", labels: ["marketing", "high-priority"], phase: "launch-execution" },
  { title: "Cart Close: Send cart closed email", labels: ["marketing"], phase: "launch-execution" },
];

// Delivery tasks
const DELIVERY_TASKS: TaskTemplate[] = [
  { title: "Send welcome email to all buyers", labels: ["marketing"], phase: "delivery" },
  { title: "Grant access to all purchased content", labels: ["technical"], phase: "delivery" },
  { title: "Send Day 1 getting started guide", labels: ["copy"], phase: "delivery" },
  { title: "Check in with buyers after first week", labels: ["marketing"], phase: "delivery" },
  { title: "Request testimonials from happy customers", labels: ["marketing"], phase: "analysis" },
  { title: "Analyze launch metrics and results", labels: ["strategy"], phase: "analysis" },
  { title: "Document lessons learned", labels: ["strategy"], phase: "analysis" },
];

// Function to generate tasks based on offer data
const generateTasksFromOffer = (offer: Offer): TaskTemplate[] => {
  const tasks: TaskTemplate[] = [];
  
  // Add base foundation tasks
  tasks.push(...BASE_FOUNDATION_TASKS);
  
  // Add offer type specific tasks
  if (offer.offer_type && OFFER_TYPE_TASKS[offer.offer_type]) {
    tasks.push(...OFFER_TYPE_TASKS[offer.offer_type]);
  }
  
  // Add funnel type specific tasks
  if (offer.funnel_type && FUNNEL_TYPE_TASKS[offer.funnel_type]) {
    tasks.push(...FUNNEL_TYPE_TASKS[offer.funnel_type]);
  }
  
  // Add deliverable specific tasks
  if (offer.main_deliverables && offer.main_deliverables.length > 0) {
    offer.main_deliverables.forEach(deliverable => {
      if (DELIVERABLE_TASKS[deliverable]) {
        tasks.push(...DELIVERABLE_TASKS[deliverable]);
      }
    });
  }
  
  // Add funnel platform tasks
  if (offer.funnel_platform && PLATFORM_TASKS[offer.funnel_platform]) {
    tasks.push(...PLATFORM_TASKS[offer.funnel_platform]);
  }
  
  // Add community platform tasks
  if (offer.community_platform && PLATFORM_TASKS[offer.community_platform]) {
    tasks.push(...PLATFORM_TASKS[offer.community_platform]);
  }
  
  // Add email platform tasks
  if (offer.email_platform && PLATFORM_TASKS[offer.email_platform]) {
    tasks.push(...PLATFORM_TASKS[offer.email_platform]);
  }
  
  // Add launch execution tasks
  tasks.push(...LAUNCH_EXECUTION_TASKS);
  
  // Add delivery tasks
  tasks.push(...DELIVERY_TASKS);
  
  // Remove duplicates based on title
  const uniqueTasks = tasks.filter((task, index, self) =>
    index === self.findIndex((t) => t.title === task.title)
  );
  
  return uniqueTasks;
};

export const LoadLaunchTasksDialog = ({
  projectId,
  projectType,
  onTasksLoaded,
  taskCount,
  trigger,
  showDeleteOnly = false,
}: LoadLaunchTasksDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Fetch offer data for this project
  const { data: offer, isLoading: isLoadingOffer } = useQuery({
    queryKey: ['offer', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Offer | null;
    },
    enabled: open,
  });

  const hasOffer = !!offer;
  const generatedTasks = offer ? generateTasksFromOffer(offer) : [];

  const handleLoadTasks = async () => {
    if (!user || !hasOffer || !offer) return;

    setIsLoading(true);

    try {
      const { count } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);

      const startPosition = count || 0;

      const tasksToInsert = generatedTasks.map((task, index) => ({
        project_id: projectId,
        user_id: user.id,
        title: task.title,
        description: null,
        due_date: null,
        column_id: "todo",
        labels: task.labels,
        phase: task.phase,
        position: startPosition + index,
      }));

      const { error } = await supabase.from("tasks").insert(tasksToInsert);

      if (error) {
        console.error("Error loading tasks:", error);
        toast.error("Failed to load tasks");
      } else {
        toast.success(`${generatedTasks.length} tasks loaded based on your offer`);
        onTasksLoaded();
        setOpen(false);
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAllTasks = async () => {
    if (!user) return;

    setIsDeletingAll(true);

    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("project_id", projectId);

      if (error) {
        console.error("Error deleting tasks:", error);
        toast.error("Failed to delete tasks");
      } else {
        toast.success("All tasks deleted");
        onTasksLoaded();
      }
    } catch (error) {
      console.error("Error deleting tasks:", error);
      toast.error("Failed to delete tasks");
    } finally {
      setIsDeletingAll(false);
    }
  };

  if (showDeleteOnly) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          {trigger}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Tasks?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {taskCount} tasks from this project. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllTasks}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeletingAll}
            >
              {isDeletingAll && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <ListChecks className="w-4 h-4" />
            Load Launch Tasks
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Load Launch Tasks List</DialogTitle>
          <DialogDescription>
            Generate a customized task list based on your offer configuration.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoadingOffer ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : hasOffer ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border bg-muted/30">
                <h4 className="font-medium mb-3">Your Offer Configuration</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Offer Type:</span>
                    <Badge variant="secondary" className="ml-2">
                      {offer?.offer_type?.replace(/-/g, ' ')}
                    </Badge>
                  </div>
                  {offer?.funnel_type && (
                    <div>
                      <span className="text-muted-foreground">Funnel:</span>
                      <Badge variant="secondary" className="ml-2">
                        {offer.funnel_type.replace(/-/g, ' ')}
                      </Badge>
                    </div>
                  )}
                  {offer?.funnel_platform && (
                    <div>
                      <span className="text-muted-foreground">Platform:</span>
                      <Badge variant="outline" className="ml-2">
                        {offer.funnel_platform.replace(/-/g, ' ')}
                      </Badge>
                    </div>
                  )}
                  {offer?.main_deliverables && offer.main_deliverables.length > 0 && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Deliverables:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {offer.main_deliverables.slice(0, 3).map(d => (
                          <Badge key={d} variant="outline" className="text-xs">
                            {d.replace(/-/g, ' ')}
                          </Badge>
                        ))}
                        {offer.main_deliverables.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{offer.main_deliverables.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>
                  <strong>{generatedTasks.length}</strong> tasks will be generated based on your offer
                </span>
              </div>

              <ScrollArea className="h-[200px] rounded-md border p-3">
                <div className="space-y-1">
                  {generatedTasks.slice(0, 30).map((task, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm py-1">
                      <div className="w-1 h-1 rounded-full bg-primary" />
                      <span className="text-muted-foreground truncate">{task.title}</span>
                    </div>
                  ))}
                  {generatedTasks.length > 30 && (
                    <div className="text-sm text-muted-foreground pt-2">
                      ... and {generatedTasks.length - 30} more tasks
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="w-10 h-10 text-muted-foreground mb-3" />
              <h4 className="font-medium mb-1">No Offer Configured</h4>
              <p className="text-sm text-muted-foreground max-w-sm">
                Please set up your offer in the Offer Builder tab first. The task list will be generated based on your offer type, funnel, deliverables, and platforms.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleLoadTasks} 
            disabled={!hasOffer || isLoading || isLoadingOffer}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Load {generatedTasks.length} Tasks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
