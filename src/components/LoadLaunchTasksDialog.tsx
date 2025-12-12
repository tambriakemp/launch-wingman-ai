import { useState } from "react";
import { ListChecks, Loader2, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface LoadLaunchTasksDialogProps {
  projectId: string;
  projectType: "launch" | "prelaunch";
  onTasksLoaded: () => void;
  taskCount: number;
}

const SYSTEME_IO_LAUNCH_TASKS = [
  // PHASE 1: FOUNDATION & PLANNING
  { title: "Define your target audience (avatar/ideal customer)", labels: ["strategy"] },
  { title: "Identify the specific transformation your product delivers", labels: ["strategy"] },
  { title: "Research competitors and their offerings", labels: ["strategy"] },
  { title: "Determine your unique positioning/angle", labels: ["strategy"] },
  { title: "Validate product idea with audience (poll, survey, or conversations)", labels: ["strategy"] },
  { title: "Set revenue goal for launch", labels: ["strategy"] },
  { title: "Set enrollment goal (number of customers)", labels: ["strategy"] },
  { title: "Decide on product name", labels: ["creative"] },
  { title: "Write product tagline/subtitle", labels: ["copy"] },
  { title: "Determine product format (course, membership, template pack, coaching program, etc.)", labels: ["strategy"] },
  { title: "Decide on product length/duration", labels: ["strategy"] },
  { title: "Choose delivery method (self-paced, cohort-based, drip, all-at-once)", labels: ["strategy"] },
  { title: "Set pricing (research competitor pricing first)", labels: ["strategy"] },
  { title: "Decide if offering payment plans (and terms)", labels: ["strategy"] },
  { title: "Determine any bonuses or limited-time offers", labels: ["strategy", "marketing"] },
  { title: "Create product guarantee/refund policy", labels: ["copy"] },
  { title: "Plan product lifecycle (evergreen vs. limited enrollment)", labels: ["strategy"] },
  { title: "Set launch date (enrollment opens)", labels: ["strategy"] },
  { title: "Set cart close date", labels: ["strategy"] },
  { title: "Calculate prelaunch start date (6-8 weeks before launch)", labels: ["strategy"] },
  { title: "Set content creation deadline", labels: ["strategy"] },
  { title: "Set sales page completion deadline", labels: ["strategy"] },
  { title: "Set email sequence completion deadline", labels: ["strategy"] },
  { title: "Create master launch timeline with all milestones", labels: ["strategy"] },

  // PHASE 2: CONTENT CREATION
  { title: "Outline all modules/sections of product", labels: ["creative"] },
  { title: "Write learning objectives for each module", labels: ["copy"] },
  { title: "Outline lessons within each module", labels: ["creative"] },
  { title: "Decide on content format (video, text, audio, worksheets, combination)", labels: ["strategy"] },
  { title: "Create lesson scripts or outlines", labels: ["copy"] },
  { title: "Identify any templates/worksheets/downloads needed", labels: ["creative"] },
  { title: "Plan any live components (calls, Q&As, workshops)", labels: ["strategy"] },
  { title: "Write all lesson content", labels: ["copy"] },
  { title: "Create worksheets and templates", labels: ["creative"] },
  { title: "Design PDF workbooks (Canva, InDesign, Google Docs)", labels: ["creative"] },
  { title: "Proofread all written content", labels: ["copy"] },
  { title: "Convert to final PDF format", labels: ["technical"] },
  { title: "Create fillable PDFs if needed", labels: ["technical"] },
  { title: "Create welcome guide/orientation document", labels: ["copy"] },
  { title: "Create resource library or links document", labels: ["copy"] },
  { title: "Design any slide decks or presentations", labels: ["creative"] },
  { title: "Create implementation checklists", labels: ["creative"] },
  { title: "Develop any bonus materials", labels: ["creative"] },
  { title: "Write FAQ document", labels: ["copy"] },
  { title: "Create community guidelines (if applicable)", labels: ["copy"] },

  // PHASE 3: SYSTEME.IO TECHNICAL SETUP
  { title: "Sign up for Systeme.io account (or upgrade plan if needed)", labels: ["technical"] },
  { title: "Set up payment processor (Stripe and/or PayPal)", labels: ["technical"] },
  { title: "Connect domain name (if using custom domain)", labels: ["technical"] },
  { title: "Set up business email address", labels: ["technical"] },
  { title: "Configure account settings and preferences", labels: ["technical"] },
  { title: "Create new product in Systeme.io", labels: ["technical"] },
  { title: "Upload product name and description", labels: ["technical"] },
  { title: "Set product price", labels: ["technical"] },
  { title: "Configure payment plan options (if offering)", labels: ["technical"] },
  { title: "Upload product image/thumbnail", labels: ["technical", "creative"] },
  { title: "Set product availability settings", labels: ["technical"] },
  { title: "Create course structure (modules and lessons)", labels: ["technical"] },
  { title: "Upload all video content to lessons", labels: ["technical", "video"] },
  { title: "Upload all PDF/downloadable content", labels: ["technical"] },
  { title: "Set drip schedule (if using drip content)", labels: ["technical"] },
  { title: "Configure lesson completion settings", labels: ["technical"] },
  { title: "Test course navigation and flow", labels: ["technical"] },
  { title: "Set up member dashboard/welcome area", labels: ["technical"] },
  { title: "Create any member-only resources area", labels: ["technical"] },
  { title: "Create sales funnel in Systeme.io", labels: ["technical"] },
  { title: "Connect funnel to product", labels: ["technical"] },
  { title: "Set up funnel steps (landing page → checkout → thank you)", labels: ["technical"] },
  { title: "Configure funnel settings", labels: ["technical"] },
  { title: "Create email list for buyers", labels: ["technical"] },
  { title: "Create email list for waitlist (if applicable)", labels: ["technical"] },
  { title: "Set up sender email and name", labels: ["technical"] },
  { title: "Verify email domain (for better deliverability)", labels: ["technical"] },
  { title: "Create email templates with branding", labels: ["technical", "creative"] },
  { title: "Create automation: Purchase → Add to course", labels: ["technical"] },
  { title: "Create automation: Purchase → Send welcome email", labels: ["technical"] },
  { title: "Create automation: Purchase → Add to buyer email list", labels: ["technical"] },
  { title: "Set up abandoned cart sequence (if available)", labels: ["technical", "marketing"] },
  { title: "Test all automations with test purchase", labels: ["technical"] },

  // PHASE 4: SALES PAGE & COPY
  { title: "Research competitor sales pages", labels: ["strategy"] },
  { title: "Outline sales page structure", labels: ["copy"] },
  { title: "Identify testimonials/social proof to include", labels: ["strategy"] },
  { title: "Gather any statistics or data points", labels: ["strategy"] },
  { title: "Plan out objection handling sections", labels: ["strategy"] },
  { title: "Decide on FAQ questions to address", labels: ["strategy"] },
  { title: "Write compelling headline", labels: ["copy"] },
  { title: "Write sub-headline", labels: ["copy"] },
  { title: "Write opening hook/story", labels: ["copy"] },
  { title: "Write problem/agitation section", labels: ["copy"] },
  { title: "Write solution section (your product)", labels: ["copy"] },
  { title: "Write transformation/benefits section", labels: ["copy"] },
  { title: "Write what's included section (curriculum breakdown)", labels: ["copy"] },
  { title: "Write about you/credibility section", labels: ["copy"] },
  { title: "Write testimonials section", labels: ["copy"] },
  { title: "Write guarantee section", labels: ["copy"] },
  { title: "Write FAQ section", labels: ["copy"] },
  { title: "Write pricing section with CTA", labels: ["copy"] },
  { title: "Write urgency/scarcity section", labels: ["copy"] },
  { title: "Write final CTA", labels: ["copy"] },
  { title: "Choose sales page template in Systeme.io", labels: ["technical"] },
  { title: "Customize colors to match brand", labels: ["creative"] },
  { title: "Upload logo and brand elements", labels: ["creative"] },
  { title: "Add hero image or video", labels: ["creative", "video"] },
  { title: "Format all copy sections", labels: ["technical"] },
  { title: "Add product images or mockups", labels: ["creative"] },
  { title: "Add testimonial images (if applicable)", labels: ["creative"] },
  { title: "Insert CTA buttons throughout page", labels: ["technical"] },
  { title: "Add countdown timer (if using urgency)", labels: ["technical"] },
  { title: "Link checkout button to purchase", labels: ["technical"] },
  { title: "Optimize for mobile viewing", labels: ["technical"] },
  { title: "Test page load speed", labels: ["technical"] },
  { title: "Create checkout page", labels: ["technical"] },
  { title: "Customize thank you page (post-purchase)", labels: ["technical", "copy"] },
  { title: "Create order confirmation page", labels: ["technical"] },
  { title: "Create waitlist landing page (if applicable)", labels: ["technical", "marketing"] },
  { title: "Write privacy policy page", labels: ["copy"] },
  { title: "Write terms and conditions page", labels: ["copy"] },
  { title: "Write refund policy page", labels: ["copy"] },
  { title: "Link all legal pages in footer", labels: ["technical"] },

  // PHASE 5: EMAIL SEQUENCES
  { title: "Pre-Launch Email 1: Welcome to waitlist + what to expect", labels: ["copy", "marketing"] },
  { title: "Pre-Launch Email 2: Educational content related to problem", labels: ["copy", "marketing"] },
  { title: "Pre-Launch Email 3: Educational content + story", labels: ["copy", "marketing"] },
  { title: "Pre-Launch Email 4: Address objection or concern", labels: ["copy", "marketing"] },
  { title: "Pre-Launch Email 5: Behind-the-scenes of product creation", labels: ["copy", "marketing"] },
  { title: "Pre-Launch Email 6: Launch announcement (enrollment opens)", labels: ["copy", "marketing"] },
  { title: "Launch Email 1: Enrollment is open! (Launch day)", labels: ["copy", "marketing"] },
  { title: "Launch Email 2: Educational content + testimonial (Day 2)", labels: ["copy", "marketing"] },
  { title: "Launch Email 3: What's inside the product (Day 3)", labels: ["copy", "marketing"] },
  { title: "Launch Email 4: Handle main objection (Day 4)", labels: ["copy", "marketing"] },
  { title: "Launch Email 5: 48 hours left reminder", labels: ["copy", "marketing"] },
  { title: "Launch Email 6: 24 hours left reminder", labels: ["copy", "marketing"] },
  { title: "Launch Email 7: Final hours reminder", labels: ["copy", "marketing"] },
  { title: "Launch Email 8: Cart closed (for those who didn't buy)", labels: ["copy", "marketing"] },
  { title: "Post-Purchase Email 1: Welcome! Here's how to access", labels: ["copy"] },
  { title: "Post-Purchase Email 2: Getting started guide (Day 1)", labels: ["copy"] },
  { title: "Post-Purchase Email 3: Week 1 check-in and encouragement", labels: ["copy"] },
  { title: "Post-Purchase Email 4: Week 2 check-in", labels: ["copy"] },
  { title: "Post-Purchase Email 5: Midpoint motivation", labels: ["copy"] },
  { title: "Post-Purchase Email 6: Final push to completion", labels: ["copy"] },
  { title: "Post-Purchase Email 7: Congratulations + request testimonial", labels: ["copy"] },
  { title: "Create all email campaigns in Systeme.io", labels: ["technical"] },
  { title: "Schedule or trigger emails appropriately", labels: ["technical"] },
  { title: "Add unsubscribe links to all emails", labels: ["technical"] },
  { title: "Test emails by sending to yourself", labels: ["technical"] },
  { title: "Check mobile display of all emails", labels: ["technical"] },

  // PHASE 6: PRELAUNCH CONTENT & MARKETING
  { title: "Identify beta testers or past clients to feature", labels: ["strategy"] },
  { title: "Request video testimonials", labels: ["video", "marketing"] },
  { title: "Request written testimonials", labels: ["copy", "marketing"] },
  { title: "Request before/after stories", labels: ["marketing"] },
  { title: "Take screenshots of success stories/messages", labels: ["marketing"] },
  { title: "Get permission to use testimonials", labels: ["marketing"] },
  { title: "Edit and format testimonials", labels: ["copy"] },
  { title: "Batch create social media posts", labels: ["copy", "marketing"] },
  { title: "Create graphics for posts (Canva)", labels: ["creative", "marketing"] },
  { title: "Record stories or video content", labels: ["video", "marketing"] },
  { title: "Write blog posts (if applicable)", labels: ["copy", "marketing"] },
  { title: "Create lead magnets or free resources", labels: ["creative", "marketing"] },
  { title: "Design any promotional images", labels: ["creative", "marketing"] },
  { title: "Create launch announcement graphics", labels: ["creative", "marketing"] },
  { title: "Update social media bios with relevant info", labels: ["marketing"] },
  { title: "Create Instagram/Facebook highlights about product", labels: ["marketing"] },
  { title: "Set up link in bio tool (if needed)", labels: ["technical", "marketing"] },
  { title: "Create Pinterest pins (if using Pinterest)", labels: ["creative", "marketing"] },
  { title: "Set up YouTube playlist (if applicable)", labels: ["video", "marketing"] },

  // PHASE 7: LAUNCH WEEK PREPARATION
  { title: "Do complete test purchase on Systeme.io", labels: ["technical"] },
  { title: "Verify course access after test purchase", labels: ["technical"] },
  { title: "Test all lesson videos play correctly", labels: ["technical", "video"] },
  { title: "Test all download links work", labels: ["technical"] },
  { title: "Verify all emails send correctly", labels: ["technical"] },
  { title: "Check sales page displays correctly on mobile and desktop", labels: ["technical"] },
  { title: "Test payment processing (Stripe and PayPal if both)", labels: ["technical"] },
  { title: "Verify refund process works", labels: ["technical"] },
  { title: "Check all automations trigger properly", labels: ["technical"] },
  { title: "Set up analytics tracking (if using)", labels: ["technical"] },
  { title: "Finalize launch day social media posts", labels: ["copy", "marketing"] },
  { title: "Create launch day stories", labels: ["creative", "marketing"] },
  { title: "Prepare launch announcement email", labels: ["copy", "marketing"] },
  { title: "Create cart closing reminder graphics", labels: ["creative", "marketing"] },
  { title: "Prepare final day posts and emails", labels: ["copy", "marketing"] },
  { title: "Screenshot or record any live elements", labels: ["video"] },
  { title: "Prepare Q&A or webinar (if hosting)", labels: ["strategy"] },
  { title: "Write DM response templates for common questions", labels: ["copy"] },
  { title: "Create FAQ document for quick responses", labels: ["copy"] },
  { title: "Prepare objection-handling scripts", labels: ["copy", "strategy"] },
  { title: "Write testimonial request templates", labels: ["copy"] },
  { title: "Set up tracking for questions/objections during launch", labels: ["strategy"] },
  { title: "Set up customer support email", labels: ["technical"] },
  { title: "Create help desk or support system (if needed)", labels: ["technical"] },
  { title: "Prepare customer support templates", labels: ["copy"] },
  { title: "Set up response system for technical issues", labels: ["technical"] },
  { title: "Determine support hours during launch", labels: ["strategy"] },

  // PHASE 8: LAUNCH EXECUTION
  { title: "Launch Day: Send launch announcement email to waitlist", labels: ["marketing", "high-priority"] },
  { title: "Launch Day: Post launch announcement on all platforms", labels: ["marketing", "high-priority"] },
  { title: "Launch Day: Post launch day stories", labels: ["marketing"] },
  { title: "Launch Day: Go live (if planned)", labels: ["video", "marketing"] },
  { title: "Launch Day: Respond to all comments and DMs", labels: ["marketing"] },
  { title: "Launch Day: Monitor sales and track conversions", labels: ["strategy"] },
  { title: "Launch Day: Send thank you messages to buyers", labels: ["marketing"] },
  { title: "Launch Day: Share buyer excitement/testimonials (with permission)", labels: ["marketing"] },
  { title: "Mid-Launch: Send daily or every-other-day emails", labels: ["copy", "marketing"] },
  { title: "Mid-Launch: Post daily social content", labels: ["marketing"] },
  { title: "Mid-Launch: Share ongoing testimonials and results", labels: ["marketing"] },
  { title: "Mid-Launch: Host Q&A or webinar (if planned)", labels: ["video", "marketing"] },
  { title: "Mid-Launch: Continue DM and comment engagement", labels: ["marketing"] },
  { title: "Mid-Launch: Address any technical issues immediately", labels: ["technical", "high-priority"] },
  { title: "Mid-Launch: Track metrics (traffic, conversion rate, revenue)", labels: ["strategy"] },
  { title: "Mid-Launch: Adjust messaging based on questions/objections", labels: ["strategy", "copy"] },
  { title: "Cart Close: Send 48-hour warning email", labels: ["marketing", "high-priority"] },
  { title: "Cart Close: Post 48-hour warning on social", labels: ["marketing"] },
  { title: "Cart Close: Send 24-hour warning email", labels: ["marketing", "high-priority"] },
  { title: "Cart Close: Post 24-hour warning on social", labels: ["marketing"] },
  { title: "Cart Close: Send final hours reminder email", labels: ["marketing", "high-priority"] },
  { title: "Cart Close: Post final hours reminder on social", labels: ["marketing"] },
  { title: "Cart Close: Go live for final push (if planned)", labels: ["video", "marketing"] },
  { title: "Cart Close: Send cart closed email to non-buyers", labels: ["marketing"] },
  { title: "Post-Launch: Send welcome sequence to all buyers", labels: ["marketing"] },
  { title: "Post-Launch: Grant access to all buyers (verify in Systeme.io)", labels: ["technical"] },
  { title: "Post-Launch: Close enrollment in Systeme.io", labels: ["technical"] },
  { title: "Post-Launch: Post 'cart closed' announcement", labels: ["marketing"] },
  { title: "Post-Launch: Thank everyone for support/engagement", labels: ["marketing"] },
  { title: "Post-Launch: Start planning evergreen waitlist (if applicable)", labels: ["strategy", "marketing"] },
];

export const LoadLaunchTasksDialog = ({
  projectId,
  projectType,
  onTasksLoaded,
  taskCount,
}: LoadLaunchTasksDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [productType, setProductType] = useState<string>("");
  const [platform, setPlatform] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const canLoadTasks = platform === "systeme-io" && projectType === "launch";

  const handleLoadTasks = async () => {
    if (!user || !canLoadTasks) return;

    setIsLoading(true);

    try {
      // Get current task count to determine starting position
      const { count } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);

      const startPosition = count || 0;

      // Prepare all tasks for batch insert
      const tasksToInsert = SYSTEME_IO_LAUNCH_TASKS.map((task, index) => ({
        project_id: projectId,
        user_id: user.id,
        title: task.title,
        description: null,
        due_date: null,
        column_id: "todo",
        labels: task.labels,
        position: startPosition + index,
      }));

      // Insert all tasks in a single batch
      const { error } = await supabase.from("tasks").insert(tasksToInsert);

      if (error) {
        console.error("Error loading tasks:", error);
        toast.error("Failed to load tasks");
      } else {
        toast.success(`${SYSTEME_IO_LAUNCH_TASKS.length} tasks loaded successfully`);
        onTasksLoaded();
        setOpen(false);
        setProductType("");
        setPlatform("");
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

  return (
    <div className="flex gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <ListChecks className="w-4 h-4" />
            Load Launch Tasks
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Load Launch Tasks List</DialogTitle>
            <DialogDescription>
              Select your product type and platform to load a pre-built task list for your launch.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product-type">What type of product are you launching?</Label>
              <Select value={productType} onValueChange={setProductType}>
                <SelectTrigger id="product-type">
                  <SelectValue placeholder="Select product type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="digital-product">Digital Product (ebook, workbook, etc.)</SelectItem>
                  <SelectItem value="membership">Membership</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform">Which platform do you want to launch on?</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="systeme-io">Systeme.io</SelectItem>
                  <SelectItem value="skool">Skool</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {platform && !canLoadTasks && (
              <p className="text-sm text-muted-foreground">
                {platform === "skool" 
                  ? "Skool task templates coming soon!" 
                  : projectType === "prelaunch"
                    ? "Launch task templates are only available for Launch projects."
                    : "Please select both product type and platform."}
              </p>
            )}

            {canLoadTasks && (
              <p className="text-sm text-muted-foreground">
                This will add {SYSTEME_IO_LAUNCH_TASKS.length} tasks to your project board covering all phases of your launch.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleLoadTasks} 
              disabled={!canLoadTasks || isLoading}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Load Tasks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {taskCount > 0 && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" />
              Delete All Tasks
            </Button>
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
      )}
    </div>
  );
};
