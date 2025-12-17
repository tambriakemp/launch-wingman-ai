import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  FileText, 
  Video, 
  MessageSquare, 
  Users, 
  Star, 
  Sparkles,
  Mail,
  CheckCircle2,
  Clock,
  Circle,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Rocket,
  Download,
  Calendar,
  List,
  CheckSquare,
  Square,
  Share2,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { PlatformSelector } from "./content-planner/PlatformSelector";
import { MediaUploader } from "./content-planner/MediaUploader";
import { SocialPostPreview } from "./content-planner/SocialPostPreview";
import { PinterestBoardSelector } from "./content-planner/PinterestBoardSelector";
import { ScheduleDateTimePicker } from "./content-planner/ScheduleDateTimePicker";

interface ContentItem {
  id: string;
  phase: string;
  day_number: number;
  time_of_day: string;
  content_type: string;
  title: string;
  description: string | null;
  content: string | null;
  status: string;
  labels: string[];
  media_url: string | null;
  media_type: string | null;
  scheduled_platforms: string[];
  scheduled_at: string | null;
}

interface ContentPlannerProps {
  projectId: string;
}

const PHASES = [
  { id: "week1", label: "Pre-Launch: Week 1", shortLabel: "Week 1", description: "Build awareness and engagement", color: "bg-blue-500" },
  { id: "week2", label: "Pre-Launch: Week 2", shortLabel: "Week 2", description: "Deepen connection with audience", color: "bg-indigo-500" },
  { id: "week3", label: "Pre-Launch: Week 3", shortLabel: "Week 3", description: "Create anticipation and desire", color: "bg-violet-500" },
  { id: "week4", label: "Pre-Launch: Week 4", shortLabel: "Week 4", description: "Launch promo and final push", color: "bg-purple-500" },
  { id: "launch", label: "Launch Phase", shortLabel: "Launch", description: "Cart open and FOMO", color: "bg-rose-500" },
];

const CONTENT_TYPES = [
  { id: "high-value", label: "High Value Content", icon: Sparkles, color: "bg-violet-500" },
  { id: "story", label: "Your Story", icon: FileText, color: "bg-blue-500" },
  { id: "testimonial", label: "Testimonial", icon: Star, color: "bg-amber-500" },
  { id: "engagement", label: "Engagement Question", icon: MessageSquare, color: "bg-green-500" },
  { id: "behind-scenes", label: "Behind The Scenes", icon: Video, color: "bg-pink-500" },
  { id: "buzz", label: "Launch Buzz", icon: Rocket, color: "bg-orange-500" },
  { id: "offer-fomo", label: "Offer + FOMO", icon: Users, color: "bg-red-500" },
  { id: "email", label: "Email", icon: Mail, color: "bg-cyan-500" },
  { id: "live", label: "LIVE", icon: Video, color: "bg-purple-500" },
];

const LABELS = [
  { id: "Post", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { id: "Email", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  { id: "LIVE", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { id: "Repurpose", color: "bg-green-100 text-green-800 border-green-200" },
  { id: "Launch Promo", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { id: "Cart Closing", color: "bg-red-100 text-red-800 border-red-200" },
];

const STATUS_OPTIONS = [
  { id: "planned", label: "Planned", icon: Circle, color: "text-muted-foreground" },
  { id: "in-progress", label: "In Progress", icon: Clock, color: "text-amber-500" },
  { id: "completed", label: "Completed", icon: CheckCircle2, color: "text-green-500" },
];

// Template content based on the Trello board
const TEMPLATE_CONTENT: Array<Omit<ContentItem, "id" | "media_url" | "media_type" | "scheduled_platforms" | "scheduled_at">> = [
  // Week 1
  { phase: "week1", day_number: 1, time_of_day: "morning", content_type: "high-value", title: "High-Value Content related to one pain point your launch is going to be solving", description: "Share valuable content that addresses a key pain point", status: "planned", labels: ["Post", "Email"], content: null },
  { phase: "week1", day_number: 2, time_of_day: "morning", content_type: "story", title: "Share your own story around your launch topic", description: "Connect personally with your audience", status: "planned", labels: ["Post"], content: null },
  { phase: "week1", day_number: 3, time_of_day: "morning", content_type: "testimonial", title: "Share a testimonial", description: "Build social proof with success stories", status: "planned", labels: ["Post"], content: null },
  { phase: "week1", day_number: 4, time_of_day: "morning", content_type: "high-value", title: "High-Value Content related to one pain point your launch is going to be solving", description: "Share valuable content with a LIVE session", status: "planned", labels: ["Email", "LIVE"], content: null },
  { phase: "week1", day_number: 5, time_of_day: "morning", content_type: "engagement", title: "Share a poll or engagement question related to your launch topic", description: "Boost engagement and gather insights", status: "planned", labels: ["Post"], content: null },
  { phase: "week1", day_number: 6, time_of_day: "morning", content_type: "story", title: "Share your own story around your launch topic", description: "Continue building personal connection", status: "planned", labels: ["Post"], content: null },
  { phase: "week1", day_number: 7, time_of_day: "morning", content_type: "high-value", title: "High-Value Content related to one pain point your launch is going to be solving", description: "End the week with valuable content", status: "planned", labels: ["Post"], content: null },
  
  // Week 2
  { phase: "week2", day_number: 1, time_of_day: "morning", content_type: "high-value", title: "High-Value Content related to one pain point your launch is going to be solving", description: "Start week with valuable content", status: "planned", labels: ["Post", "Email"], content: null },
  { phase: "week2", day_number: 2, time_of_day: "morning", content_type: "story", title: "Share your own story around your launch topic", description: "Deepen personal connection", status: "planned", labels: ["Post"], content: null },
  { phase: "week2", day_number: 3, time_of_day: "morning", content_type: "testimonial", title: "Share a testimonial", description: "Continue building social proof", status: "planned", labels: ["Post"], content: null },
  { phase: "week2", day_number: 4, time_of_day: "morning", content_type: "high-value", title: "High-Value Content related to one pain point your launch is going to be solving", description: "Mid-week value with LIVE session", status: "planned", labels: ["Post", "Email", "LIVE"], content: null },
  { phase: "week2", day_number: 5, time_of_day: "morning", content_type: "engagement", title: "Share a poll or engagement question related to your launch topic", description: "Engage your audience", status: "planned", labels: ["Post"], content: null },
  { phase: "week2", day_number: 5, time_of_day: "evening", content_type: "high-value", title: "Repurpose your high-value content post in a LIVE", description: "Maximize content reach", status: "planned", labels: ["LIVE", "Repurpose"], content: null },
  { phase: "week2", day_number: 6, time_of_day: "morning", content_type: "story", title: "Share your own story around your launch topic", description: "Continue storytelling", status: "planned", labels: ["Post"], content: null },
  { phase: "week2", day_number: 7, time_of_day: "morning", content_type: "high-value", title: "High-Value Content related to one pain point your launch is going to be solving", description: "End week with value", status: "planned", labels: ["Post"], content: null },
  
  // Week 3
  { phase: "week3", day_number: 1, time_of_day: "morning", content_type: "high-value", title: "High-Value Content related to one pain point your launch is going to be solving", description: "Start building anticipation", status: "planned", labels: ["Post", "Email"], content: null },
  { phase: "week3", day_number: 2, time_of_day: "morning", content_type: "story", title: "Share your own story around your launch topic", description: "Personal connection continues", status: "planned", labels: ["Post"], content: null },
  { phase: "week3", day_number: 3, time_of_day: "morning", content_type: "testimonial", title: "Share a testimonial", description: "Social proof building", status: "planned", labels: ["Post"], content: null },
  { phase: "week3", day_number: 4, time_of_day: "morning", content_type: "high-value", title: "High-Value Content related to one pain point your launch is going to be solving", description: "LIVE training session", status: "planned", labels: ["Email", "LIVE"], content: null },
  { phase: "week3", day_number: 5, time_of_day: "morning", content_type: "engagement", title: "Share a poll or engagement question related to your launch topic", description: "Keep engagement high", status: "planned", labels: ["Post"], content: null },
  { phase: "week3", day_number: 6, time_of_day: "morning", content_type: "story", title: "Share your own story around your launch topic", description: "Storytelling continues", status: "planned", labels: ["Post"], content: null },
  { phase: "week3", day_number: 7, time_of_day: "morning", content_type: "high-value", title: "High-Value Content related to one pain point your launch is going to be solving", description: "Prepare for launch week", status: "planned", labels: ["Post"], content: null },
  
  // Week 4 (Launch Promo)
  { phase: "week4", day_number: 1, time_of_day: "morning", content_type: "email", title: "Launch Promo Post", description: "Announce the upcoming launch", status: "planned", labels: ["Post", "Email", "Launch Promo"], content: null },
  { phase: "week4", day_number: 2, time_of_day: "morning", content_type: "engagement", title: "Launch Promo Post", description: "Polls and engagement with promo", status: "planned", labels: ["Post", "Launch Promo"], content: null },
  { phase: "week4", day_number: 3, time_of_day: "morning", content_type: "high-value", title: "High-Value Content related to one pain point your launch is going to be solving", description: "Value + LIVE + Promo", status: "planned", labels: ["Post", "LIVE", "Launch Promo"], content: null },
  { phase: "week4", day_number: 4, time_of_day: "morning", content_type: "email", title: "Launch Promo Post", description: "Continue launch promotion", status: "planned", labels: ["Post", "Email", "Launch Promo"], content: null },
  { phase: "week4", day_number: 5, time_of_day: "morning", content_type: "behind-scenes", title: "Share a behind-the-scene from your upcoming launch + launch promo", description: "Show the process", status: "planned", labels: ["Post", "Launch Promo"], content: null },
  { phase: "week4", day_number: 6, time_of_day: "morning", content_type: "email", title: "Launch Promo Post", description: "Final promo push", status: "planned", labels: ["Post", "Email", "Launch Promo"], content: null },
  { phase: "week4", day_number: 7, time_of_day: "morning", content_type: "email", title: "Launch Promo Post", description: "Last day before launch", status: "planned", labels: ["Post", "Email", "Launch Promo"], content: null },
  
  // Launch Phase
  { phase: "launch", day_number: 1, time_of_day: "morning", content_type: "buzz", title: "Create buzz around launch day 1", description: "Build excitement!", status: "planned", labels: ["Post"], content: null },
  { phase: "launch", day_number: 1, time_of_day: "evening", content_type: "offer-fomo", title: "Sum up your launch day 1 + share your offer", description: "Recap and promote", status: "planned", labels: ["Post"], content: null },
  { phase: "launch", day_number: 2, time_of_day: "morning", content_type: "buzz", title: "Create buzz around launch day 2", description: "Keep momentum", status: "planned", labels: ["Post"], content: null },
  { phase: "launch", day_number: 2, time_of_day: "evening", content_type: "offer-fomo", title: "Sum up your launch day 2 + share your offer", description: "Daily recap", status: "planned", labels: ["Post"], content: null },
  { phase: "launch", day_number: 3, time_of_day: "morning", content_type: "buzz", title: "Create buzz around launch day 3", description: "Continue buzz", status: "planned", labels: ["Post"], content: null },
  { phase: "launch", day_number: 3, time_of_day: "evening", content_type: "offer-fomo", title: "Sum up your launch day 3 + share your offer", description: "Keep sharing", status: "planned", labels: ["Post"], content: null },
  { phase: "launch", day_number: 4, time_of_day: "morning", content_type: "offer-fomo", title: "Share your offer + FOMO", description: "Cart closing soon!", status: "planned", labels: ["Post", "Email", "Cart Closing"], content: null },
  { phase: "launch", day_number: 4, time_of_day: "evening", content_type: "testimonial", title: "Share a testimonial", description: "Social proof for closing", status: "planned", labels: ["Post", "Cart Closing"], content: null },
  { phase: "launch", day_number: 5, time_of_day: "morning", content_type: "offer-fomo", title: "Share your offer + FOMO", description: "Urgency building", status: "planned", labels: ["Post", "Email", "Cart Closing"], content: null },
  { phase: "launch", day_number: 5, time_of_day: "evening", content_type: "testimonial", title: "Share a testimonial", description: "More social proof", status: "planned", labels: ["Post", "Cart Closing"], content: null },
  { phase: "launch", day_number: 6, time_of_day: "morning", content_type: "offer-fomo", title: "Share your offer + FOMO", description: "Last day reminder", status: "planned", labels: ["Post", "Email", "Cart Closing"], content: null },
  { phase: "launch", day_number: 6, time_of_day: "evening", content_type: "testimonial", title: "Share a testimonial", description: "Final testimonial", status: "planned", labels: ["Post", "Cart Closing"], content: null },
  { phase: "launch", day_number: 7, time_of_day: "morning", content_type: "offer-fomo", title: "FINAL: Cart closes today!", description: "Last chance!", status: "planned", labels: ["Post", "Email", "Cart Closing"], content: null },
];

export function ContentPlanner({ projectId }: ContentPlannerProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [expandedPhases, setExpandedPhases] = useState<string[]>(["week1"]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [isPostingToPinterest, setIsPostingToPinterest] = useState(false);
  const [isSchedulingPost, setIsSchedulingPost] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<"now" | "schedule">("now");
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduledTime, setScheduledTime] = useState("09:00");
const [formData, setFormData] = useState({
    phase: "week1",
    day_number: 1,
    time_of_day: "morning",
    content_type: "high-value",
    title: "",
    description: "",
    content: "",
    status: "planned",
    labels: [] as string[],
    media_url: null as string | null,
    media_type: null as string | null,
    scheduled_platforms: [] as string[],
    pinterest_board_id: null as string | null,
    link_url: "",
  });
  const [draggedItem, setDraggedItem] = useState<ContentItem | null>(null);

  // Check if Pinterest is connected
  const { data: pinterestConnection } = useQuery({
    queryKey: ["pinterest-connection", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_connections")
        .select("id, account_name")
        .eq("user_id", user!.id)
        .eq("platform", "pinterest")
        .single();
      
      if (error) return null;
      return data;
    },
    enabled: !!user,
  });

  const { data: contentItems = [], isLoading } = useQuery({
    queryKey: ["content-planner", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_planner")
        .select("*")
        .eq("project_id", projectId)
        .order("day_number", { ascending: true });
      
      if (error) throw error;
      return data as ContentItem[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (item: Omit<ContentItem, "id"> & { id?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (item.id) {
        const { error } = await supabase
          .from("content_planner")
          .update({
            phase: item.phase,
            day_number: item.day_number,
            time_of_day: item.time_of_day,
            content_type: item.content_type,
            title: item.title,
            description: item.description,
            content: item.content,
            status: item.status,
            labels: item.labels,
            media_url: item.media_url,
            media_type: item.media_type,
            scheduled_platforms: item.scheduled_platforms,
          })
          .eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("content_planner")
          .insert({
            user_id: user.id,
            project_id: projectId,
            phase: item.phase,
            day_number: item.day_number,
            time_of_day: item.time_of_day,
            content_type: item.content_type,
            title: item.title,
            description: item.description,
            content: item.content,
            status: item.status,
            labels: item.labels,
            media_url: item.media_url,
            media_type: item.media_type,
            scheduled_platforms: item.scheduled_platforms,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
      toast.success(editingItem ? "Content updated" : "Content added");
      setDialogOpen(false);
      setEditingItem(null);
      resetForm();
    },
    onError: () => {
      toast.error("Failed to save content");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("content_planner")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
      toast.success("Content deleted");
    },
    onError: () => {
      toast.error("Failed to delete content");
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const { error } = await supabase
        .from("content_planner")
        .update({ status })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
      toast.success(`Updated ${selectedItems.length} items`);
      setSelectedItems([]);
      setBulkActionOpen(false);
    },
    onError: () => {
      toast.error("Failed to update items");
    },
  });

  const moveItemMutation = useMutation({
    mutationFn: async ({ itemId, phase, day_number }: { itemId: string; phase: string; day_number: number }) => {
      const { error } = await supabase
        .from("content_planner")
        .update({ phase, day_number })
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
      toast.success("Content moved");
    },
    onError: () => {
      toast.error("Failed to move content");
    },
  });

  const loadTemplateMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const items = TEMPLATE_CONTENT.map(item => ({
        ...item,
        user_id: user.id,
        project_id: projectId,
      }));

      const { error } = await supabase
        .from("content_planner")
        .insert(items);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
      toast.success("Template loaded successfully!");
    },
    onError: () => {
      toast.error("Failed to load template");
    },
  });

  const resetForm = () => {
    setFormData({
      phase: "week1",
      day_number: 1,
      time_of_day: "morning",
      content_type: "high-value",
      title: "",
      description: "",
      content: "",
      status: "planned",
      labels: [],
      media_url: null,
      media_type: null,
      scheduled_platforms: [],
      pinterest_board_id: null,
      link_url: "",
    });
    setScheduleMode("now");
    setScheduledDate(null);
    setScheduledTime("09:00");
  };

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev =>
      prev.includes(phaseId)
        ? prev.filter(p => p !== phaseId)
        : [...prev, phaseId]
    );
  };

  const handleEdit = (item: ContentItem) => {
    setEditingItem(item);
    setFormData({
      phase: item.phase,
      day_number: item.day_number,
      time_of_day: item.time_of_day,
      content_type: item.content_type,
      title: item.title,
      description: item.description || "",
      content: item.content || "",
      status: item.status,
      labels: item.labels || [],
      media_url: item.media_url,
      media_type: item.media_type,
      scheduled_platforms: item.scheduled_platforms || [],
      pinterest_board_id: null,
      link_url: "",
    });
    setDialogOpen(true);
  };

  const handleAddNew = (phase: string) => {
    resetForm();
    setFormData(prev => ({ ...prev, phase }));
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    saveMutation.mutate({
      ...formData,
      id: editingItem?.id,
      description: formData.description || null,
      content: formData.content || null,
      scheduled_at: null,
    });
  };

  const handlePostToPinterest = async () => {
    if (!formData.scheduled_platforms.includes('pinterest')) {
      toast.error("Pinterest is not selected");
      return;
    }
    
    if (!pinterestConnection) {
      toast.error("Pinterest is not connected. Go to Settings to connect.");
      return;
    }

    if (!formData.pinterest_board_id) {
      toast.error("Please select a Pinterest board");
      return;
    }

    if (!formData.media_url) {
      toast.error("Pinterest requires an image. Please upload media.");
      return;
    }

    setIsPostingToPinterest(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke('post-to-pinterest', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          board_id: formData.pinterest_board_id,
          title: formData.title,
          description: formData.content || formData.description,
          media_url: formData.media_url,
          link: formData.link_url || undefined,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success("Posted to Pinterest!", {
        description: "Your pin has been created successfully.",
        action: data.pin_url ? {
          label: "View Pin",
          onClick: () => window.open(data.pin_url, '_blank'),
        } : undefined,
      });
    } catch (error) {
      console.error('Pinterest post error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to post to Pinterest");
    } finally {
      setIsPostingToPinterest(false);
    }
  };

  const handleSchedulePost = async () => {
    if (!formData.scheduled_platforms.includes('pinterest')) {
      toast.error("Please select Pinterest as platform");
      return;
    }
    
    if (!pinterestConnection) {
      toast.error("Pinterest is not connected. Go to Settings to connect.");
      return;
    }

    if (!formData.pinterest_board_id) {
      toast.error("Please select a Pinterest board");
      return;
    }

    if (!formData.media_url) {
      toast.error("Pinterest requires an image. Please upload media.");
      return;
    }

    if (!scheduledDate) {
      toast.error("Please select a date for scheduling");
      return;
    }

    // Combine date and time
    const [hours, minutes] = scheduledTime.split(":").map(Number);
    const scheduledFor = new Date(scheduledDate);
    scheduledFor.setHours(hours, minutes, 0, 0);

    // Check if scheduled time is in the past
    if (scheduledFor <= new Date()) {
      toast.error("Scheduled time must be in the future");
      return;
    }

    setIsSchedulingPost(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Not authenticated");

      // First save the content item if not already saved
      let contentItemId = editingItem?.id;
      if (!contentItemId) {
        const { data: savedItem, error: saveError } = await supabase
          .from("content_planner")
          .insert({
            user_id: currentUser.id,
            project_id: projectId,
            phase: formData.phase,
            day_number: formData.day_number,
            time_of_day: formData.time_of_day,
            content_type: formData.content_type,
            title: formData.title,
            description: formData.description || null,
            content: formData.content || null,
            status: formData.status,
            labels: formData.labels,
            media_url: formData.media_url,
            media_type: formData.media_type,
            scheduled_platforms: formData.scheduled_platforms,
            scheduled_at: scheduledFor.toISOString(),
          })
          .select()
          .single();

        if (saveError) throw saveError;
        contentItemId = savedItem.id;
      } else {
        // Update existing content item with scheduled_at
        await supabase
          .from("content_planner")
          .update({ scheduled_at: scheduledFor.toISOString() })
          .eq("id", contentItemId);
      }

      // Create scheduled post record
      const { error: scheduleError } = await supabase
        .from("scheduled_posts")
        .insert({
          user_id: currentUser.id,
          project_id: projectId,
          content_item_id: contentItemId,
          platform: "pinterest",
          scheduled_for: scheduledFor.toISOString(),
          post_data: {
            board_id: formData.pinterest_board_id,
            title: formData.title,
            description: formData.content || formData.description,
            media_url: formData.media_url,
            link: formData.link_url || undefined,
          },
          status: "pending",
        });

      if (scheduleError) throw scheduleError;

      queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
      
      toast.success("Post scheduled!", {
        description: `Will post on ${scheduledFor.toLocaleDateString()} at ${scheduledFor.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      });
      
      setDialogOpen(false);
      resetForm();
      setEditingItem(null);
    } catch (error) {
      console.error('Schedule post error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to schedule post");
    } finally {
      setIsSchedulingPost(false);
    }
  };

  const toggleLabel = (label: string) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.includes(label)
        ? prev.labels.filter(l => l !== label)
        : [...prev.labels, label],
    }));
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const selectAllInPhase = (phaseId: string) => {
    const phaseItems = contentItems.filter(item => item.phase === phaseId);
    const phaseIds = phaseItems.map(item => item.id);
    const allSelected = phaseIds.every(id => selectedItems.includes(id));
    
    if (allSelected) {
      setSelectedItems(prev => prev.filter(id => !phaseIds.includes(id)));
    } else {
      setSelectedItems(prev => [...new Set([...prev, ...phaseIds])]);
    }
  };

  const selectAll = () => {
    if (selectedItems.length === contentItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(contentItems.map(item => item.id));
    }
  };

  const getContentTypeInfo = (typeId: string) => {
    return CONTENT_TYPES.find(t => t.id === typeId) || CONTENT_TYPES[0];
  };

  const getStatusInfo = (statusId: string) => {
    return STATUS_OPTIONS.find(s => s.id === statusId) || STATUS_OPTIONS[0];
  };

  const getPhaseItems = (phaseId: string) => {
    return contentItems.filter(item => item.phase === phaseId);
  };

  const getCompletionPercentage = (phaseId: string) => {
    const items = getPhaseItems(phaseId);
    if (items.length === 0) return 0;
    const completed = items.filter(item => item.status === "completed").length;
    return Math.round((completed / items.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (contentItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No content planned yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Start with our pre-launch content template based on proven launch strategies, or create your own content plan.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => loadTemplateMutation.mutate()} disabled={loadTemplateMutation.isPending}>
            {loadTemplateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Load Template
          </Button>
          <Button variant="outline" onClick={() => handleAddNew("week1")}>
            <Plus className="w-4 h-4" />
            Create Custom
          </Button>
        </div>
      </div>
    );
  }

  const handleDragStart = (e: React.DragEvent, item: ContentItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetPhase: string, targetDay: number) => {
    e.preventDefault();
    if (draggedItem && (draggedItem.phase !== targetPhase || draggedItem.day_number !== targetDay)) {
      moveItemMutation.mutate({
        itemId: draggedItem.id,
        phase: targetPhase,
        day_number: targetDay,
      });
    }
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // Calendar View Component
  const CalendarView = () => (
    <div className="space-y-4">
      {/* Timeline Header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <span>Timeline showing all {contentItems.length} content items across {PHASES.length} phases. Drag items to move them.</span>
      </div>
      
      {/* Content Type Legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CONTENT_TYPES.map(type => (
          <Badge key={type.id} variant="outline" className="gap-1">
            <div className={`w-2 h-2 rounded-full ${type.color}`} />
            {type.label}
          </Badge>
        ))}
      </div>

      <ScrollArea className="w-full">
        <div className="min-w-[1100px]">
          {/* Day Headers */}
          <div className="flex border-b pb-2 mb-2">
            <div className="w-24 flex-shrink-0 font-medium text-muted-foreground text-sm">Phase</div>
            {[1, 2, 3, 4, 5, 6, 7].map(day => (
              <div key={day} className="flex-1 text-center font-medium text-sm text-muted-foreground">
                Day {day}
              </div>
            ))}
          </div>

          {/* Phase Rows */}
          {PHASES.map(phase => {
            const phaseItems = getPhaseItems(phase.id);
            
            return (
              <div key={phase.id} className="flex border-b last:border-0 py-2 min-h-[80px]">
                <div className="w-24 flex-shrink-0 flex items-center">
                  <Badge variant="outline" className="text-xs">
                    <div className={`w-2 h-2 rounded-full ${phase.color} mr-1`} />
                    {phase.shortLabel}
                  </Badge>
                </div>
                {[1, 2, 3, 4, 5, 6, 7].map(day => {
                  const dayItems = phaseItems.filter(item => item.day_number === day);
                  const isDropTarget = draggedItem && (draggedItem.phase !== phase.id || draggedItem.day_number !== day);
                  
                  return (
                    <div 
                      key={day} 
                      className={`flex-1 px-1 flex flex-col gap-1 min-h-[60px] rounded transition-colors ${
                        isDropTarget ? "bg-primary/10 border-2 border-dashed border-primary/30" : ""
                      }`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, phase.id, day)}
                    >
                      {dayItems.map(item => {
                        const typeInfo = getContentTypeInfo(item.content_type);
                        const statusInfo = getStatusInfo(item.status);
                        
                        return (
                          <TooltipProvider key={item.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, item)}
                                  onDragEnd={handleDragEnd}
                                  onClick={() => handleEdit(item)}
                                  className={`p-1.5 rounded text-xs cursor-grab active:cursor-grabbing transition-all hover:scale-105 ${typeInfo.color} text-white flex flex-col gap-0.5 ${
                                    item.status === "completed" ? "opacity-60" : ""
                                  } ${draggedItem?.id === item.id ? "opacity-50 scale-95" : ""}`}
                                >
                                  <div className="flex items-center gap-1">
                                    <typeInfo.icon className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate font-medium">{typeInfo.label}</span>
                                    {item.status === "completed" && (
                                      <CheckCircle2 className="w-3 h-3 flex-shrink-0 ml-auto" />
                                    )}
                                  </div>
                                  <span className="text-[10px] opacity-80 capitalize">{item.time_of_day}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="space-y-1">
                                  <p className="font-medium">{item.title}</p>
                                  <p className="text-xs text-muted-foreground">{item.description}</p>
                                  <div className="flex items-center gap-2 text-xs">
                                    <Badge variant="secondary" className="text-xs">{typeInfo.label}</Badge>
                                    <span className={statusInfo.color}>{statusInfo.label}</span>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                      {dayItems.length === 0 && (
                        <div className={`h-full min-h-[40px] rounded border border-dashed ${
                          isDropTarget ? "border-primary/50" : "border-muted-foreground/20"
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );

  // List View Component
  const ListView = () => (
    <div className="space-y-3">
      {PHASES.map((phase) => {
        const isExpanded = expandedPhases.includes(phase.id);
        const phaseItems = getPhaseItems(phase.id);
        const completionPercent = getCompletionPercentage(phase.id);
        const phaseIds = phaseItems.map(item => item.id);
        const allSelected = phaseIds.length > 0 && phaseIds.every(id => selectedItems.includes(id));

        return (
          <Card key={phase.id} variant="elevated">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => togglePhase(phase.id)}
            >
              <div className="flex items-center gap-3">
                {selectedItems.length > 0 && (
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={() => selectAllInPhase(phase.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
                <div className={`w-3 h-3 rounded-full ${phase.color}`} />
                <div>
                  <h3 className="font-semibold text-foreground">{phase.label}</h3>
                  <p className="text-sm text-muted-foreground">{phase.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium">{phaseItems.length} items</p>
                  <p className="text-xs text-muted-foreground">{completionPercent}% complete</p>
                </div>
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent className="pt-0">
                    {phaseItems.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="mb-2">No content for this phase</p>
                        <Button size="sm" variant="outline" onClick={() => handleAddNew(phase.id)}>
                          <Plus className="w-4 h-4" />
                          Add Content
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Group by day */}
                        {[1, 2, 3, 4, 5, 6, 7].map(day => {
                          const dayItems = phaseItems.filter(item => item.day_number === day);
                          if (dayItems.length === 0) return null;

                          return (
                            <div key={day} className="space-y-2">
                              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground pt-2">
                                <span>Day {day}</span>
                                <div className="flex-1 h-px bg-border" />
                              </div>
                              {dayItems.map(item => {
                                const typeInfo = getContentTypeInfo(item.content_type);
                                const statusInfo = getStatusInfo(item.status);
                                const StatusIcon = statusInfo.icon;
                                const isSelected = selectedItems.includes(item.id);

                                return (
                                  <div
                                    key={item.id}
                                    className={`flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors group ${
                                      isSelected ? "ring-2 ring-primary" : ""
                                    }`}
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => toggleItemSelection(item.id)}
                                    />
                                    <div className={`w-8 h-8 rounded-lg ${typeInfo.color} flex items-center justify-center flex-shrink-0`}>
                                      <typeInfo.icon className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs text-muted-foreground capitalize">
                                              {item.time_of_day}
                                            </span>
                                            <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                                          </div>
                                          <h4 className="font-medium text-foreground text-sm line-clamp-1">
                                            {item.title}
                                          </h4>
                                          {item.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-1">
                                              {item.description}
                                            </p>
                                          )}
                                        </div>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 opacity-0 group-hover:opacity-100"
                                            >
                                              <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(item)}>
                                              <Pencil className="w-4 h-4 mr-2" />
                                              Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              className="text-destructive"
                                              onClick={() => deleteMutation.mutate(item.id)}
                                            >
                                              <Trash2 className="w-4 h-4 mr-2" />
                                              Delete
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                      {item.labels && item.labels.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {item.labels.map(label => {
                                            const labelInfo = LABELS.find(l => l.id === label);
                                            return (
                                              <Badge
                                                key={label}
                                                variant="outline"
                                                className={`text-xs ${labelInfo?.color || ""}`}
                                              >
                                                {label}
                                              </Badge>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => handleAddNew(phase.id)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add to {phase.label}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Social Media Hub</h1>
        <p className="text-muted-foreground">Plan, create, and schedule your social media content</p>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "calendar")}>
            <TabsList className="h-9">
              <TabsTrigger value="list" className="gap-1.5 px-3">
                <List className="w-4 h-4" />
                List
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-1.5 px-3">
                <Calendar className="w-4 h-4" />
                Timeline
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {viewMode === "list" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedPhases(PHASES.map(p => p.id))}
              >
                Expand All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedPhases([])}
              >
                Collapse All
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedItems.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedItems([])}
              >
                Clear
              </Button>
              <DropdownMenu open={bulkActionOpen} onOpenChange={setBulkActionOpen}>
                <DropdownMenuTrigger asChild>
                  <Button size="sm">
                    <CheckSquare className="w-4 h-4 mr-1" />
                    Bulk Update
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {STATUS_OPTIONS.map(status => (
                    <DropdownMenuItem
                      key={status.id}
                      onClick={() => bulkUpdateMutation.mutate({ ids: selectedItems, status: status.id })}
                    >
                      <status.icon className={`w-4 h-4 mr-2 ${status.color}`} />
                      Mark as {status.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {viewMode === "list" && selectedItems.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
            >
              <Square className="w-4 h-4 mr-1" />
              Select All
            </Button>
          )}

          <Button size="sm" onClick={() => handleAddNew("week1")}>
            <Plus className="w-4 h-4" />
            Add Content
          </Button>
        </div>
      </div>

      {/* Content Views */}
      {viewMode === "calendar" ? <CalendarView /> : <ListView />}

      {/* Add/Edit Sheet */}
      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent side="right" className="w-[70vw] min-w-[700px] p-0 flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <SheetTitle>{editingItem ? "Edit Content" : "Add Content"}</SheetTitle>
            <SheetDescription>
              Plan your content for your pre-launch and launch phases.
            </SheetDescription>
          </SheetHeader>

          {/* Two Column Layout - Full Height */}
          <div className="flex-1 overflow-hidden flex">
            {/* Left Column - Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* Planning Details Card */}
              <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>📋</span>
                  <span>Planning Details</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Phase</Label>
                    <Select
                      value={formData.phase}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, phase: value }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PHASES.map(phase => (
                          <SelectItem key={phase.id} value={phase.id}>{phase.shortLabel}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Day</Label>
                    <Select
                      value={formData.day_number.toString()}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, day_number: parseInt(value) }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7].map(day => (
                          <SelectItem key={day} value={day.toString()}>Day {day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Time</Label>
                    <Select
                      value={formData.time_of_day}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, time_of_day: value }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning</SelectItem>
                        <SelectItem value="evening">Evening</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Content Type</Label>
                    <Select
                      value={formData.content_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, content_type: value }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTENT_TYPES.map(type => (
                          <SelectItem key={type.id} value={type.id}>
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded ${type.color}`} />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(status => (
                          <SelectItem key={status.id} value={status.id}>
                            <div className="flex items-center gap-2">
                              <status.icon className={`w-3.5 h-3.5 ${status.color}`} />
                              {status.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Labels</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {LABELS.map(label => (
                      <Badge
                        key={label.id}
                        variant="outline"
                        className={`cursor-pointer transition-all text-xs ${
                          formData.labels.includes(label.id)
                            ? label.color
                            : "opacity-50 hover:opacity-100"
                        }`}
                        onClick={() => toggleLabel(label.id)}
                      >
                        {label.id}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Social Post Content */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Share2 className="w-4 h-4" />
                  <span>Social Post</span>
                </div>

                {/* Post To */}
                <div className="space-y-2">
                  <Label>Post To</Label>
                  <PlatformSelector
                    selected={formData.scheduled_platforms}
                    onChange={(platforms) => setFormData(prev => ({ ...prev, scheduled_platforms: platforms }))}
                  />
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Title</Label>
                    {formData.scheduled_platforms.includes('pinterest') && (
                      <span className={`text-xs ${formData.title.length > 100 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {formData.title.length}/100
                      </span>
                    )}
                  </div>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter content title"
                    maxLength={formData.scheduled_platforms.includes('pinterest') ? 100 : undefined}
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description (optional)"
                  />
                </div>

                {/* Content / Copy */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Content / Copy</Label>
                    {formData.scheduled_platforms.includes('pinterest') && (
                      <span className={`text-xs ${formData.content.length > 500 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {formData.content.length}/500
                      </span>
                    )}
                  </div>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder={formData.scheduled_platforms.includes('pinterest') 
                      ? "Write your pin description here (used as caption)..." 
                      : "Write your content here..."}
                    rows={5}
                  />
                </div>

                {/* Destination Link for Pinterest */}
                {formData.scheduled_platforms.includes('pinterest') && (
                  <div className="space-y-1.5">
                    <Label>Destination Link</Label>
                    <Input
                      value={formData.link_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                      placeholder="https://example.com/your-page"
                      type="url"
                    />
                    <p className="text-xs text-muted-foreground">
                      Where users will be directed when they click your pin
                    </p>
                  </div>
                )}

                {/* Pinterest Board Selector */}
                {formData.scheduled_platforms.includes('pinterest') && pinterestConnection && (
                  <PinterestBoardSelector
                    selectedBoard={formData.pinterest_board_id}
                    onBoardChange={(boardId) => setFormData(prev => ({ ...prev, pinterest_board_id: boardId }))}
                  />
                )}
                
                {formData.scheduled_platforms.includes('pinterest') && !pinterestConnection && (
                  <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                    Pinterest is not connected. Go to Settings → Connected Accounts to connect.
                  </div>
                )}
                
                {/* Scheduling Section - When to Post */}
                {formData.scheduled_platforms.includes('pinterest') && pinterestConnection && formData.media_url && (
                  <ScheduleDateTimePicker
                    mode={scheduleMode}
                    onModeChange={setScheduleMode}
                    date={scheduledDate}
                    onDateChange={setScheduledDate}
                    time={scheduledTime}
                    onTimeChange={setScheduledTime}
                  />
                )}

                {/* Media Upload Section */}
                <div className="space-y-1.5">
                  <Label>Media</Label>
                  <MediaUploader
                    mediaUrl={formData.media_url}
                    mediaType={formData.media_type}
                    onMediaChange={(url, type) => setFormData(prev => ({ ...prev, media_url: url, media_type: type }))}
                    projectId={projectId}
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Preview (Fixed Width, Full Height) */}
            <div className="w-[340px] border-l bg-muted/20 p-4 flex flex-col shrink-0">
              <Label className="text-sm font-medium mb-3">Preview</Label>
              <div className="flex-1 flex items-start justify-center">
                {formData.scheduled_platforms.length > 0 || formData.media_url ? (
                  <SocialPostPreview
                    platforms={formData.scheduled_platforms}
                    content={formData.content}
                    mediaUrl={formData.media_url}
                    mediaType={formData.media_type}
                    linkUrl={formData.link_url}
                    title={formData.title}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center text-muted-foreground">
                    <Share2 className="w-10 h-10 mb-3 opacity-40" />
                    <p className="text-sm">Select a platform to see preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <SheetFooter className="px-6 py-4 border-t bg-background shrink-0">
            <div className="flex justify-between w-full">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <div className="flex gap-2">
                {/* Post Now / Schedule Button for Pinterest */}
                {formData.scheduled_platforms.includes('pinterest') && pinterestConnection && formData.media_url && (
                  scheduleMode === "now" ? (
                    <Button 
                      variant="secondary"
                      onClick={handlePostToPinterest}
                      disabled={isPostingToPinterest || !formData.pinterest_board_id}
                    >
                      {isPostingToPinterest ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Post Now
                    </Button>
                  ) : (
                    <Button 
                      variant="secondary"
                      onClick={handleSchedulePost}
                      disabled={isSchedulingPost || !formData.pinterest_board_id || !scheduledDate}
                    >
                      {isSchedulingPost ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Clock className="w-4 h-4 mr-2" />
                      )}
                      Schedule
                    </Button>
                  )
                )}
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {editingItem ? "Update" : "Save"}
                </Button>
              </div>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}