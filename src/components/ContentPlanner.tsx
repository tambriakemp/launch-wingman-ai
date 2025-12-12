import { useState, useEffect } from "react";
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
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
}

interface ContentPlannerProps {
  projectId: string;
}

const PHASES = [
  { id: "week1", label: "Pre-Launch: Week 1", description: "Build awareness and engagement" },
  { id: "week2", label: "Pre-Launch: Week 2", description: "Deepen connection with audience" },
  { id: "week3", label: "Pre-Launch: Week 3", description: "Create anticipation and desire" },
  { id: "week4", label: "Pre-Launch: Week 4", description: "Launch promo and final push" },
  { id: "launch", label: "Launch Phase", description: "Cart open and FOMO" },
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
const TEMPLATE_CONTENT: Omit<ContentItem, "id">[] = [
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
  const [expandedPhases, setExpandedPhases] = useState<string[]>(["week1"]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
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
    });
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
    });
  };

  const toggleLabel = (label: string) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.includes(label)
        ? prev.labels.filter(l => l !== label)
        : [...prev.labels, label],
    }));
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

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
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
        </div>
        <Button size="sm" onClick={() => handleAddNew("week1")}>
          <Plus className="w-4 h-4" />
          Add Content
        </Button>
      </div>

      {/* Phase Sections */}
      <div className="space-y-3">
        {PHASES.map((phase) => {
          const isExpanded = expandedPhases.includes(phase.id);
          const phaseItems = getPhaseItems(phase.id);
          const completionPercent = getCompletionPercentage(phase.id);

          return (
            <Card key={phase.id} variant="elevated">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => togglePhase(phase.id)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
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

                                  return (
                                    <div
                                      key={item.id}
                                      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors group"
                                    >
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Content" : "Add Content"}</DialogTitle>
            <DialogDescription>
              Plan your content for your pre-launch and launch phases.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phase</Label>
                <Select
                  value={formData.phase}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, phase: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PHASES.map(phase => (
                      <SelectItem key={phase.id} value={phase.id}>{phase.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Day</Label>
                <Select
                  value={formData.day_number.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, day_number: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7].map(day => (
                      <SelectItem key={day} value={day.toString()}>Day {day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Time of Day</Label>
                <Select
                  value={formData.time_of_day}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, time_of_day: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select
                  value={formData.content_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, content_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded ${type.color}`} />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(status => (
                    <SelectItem key={status.id} value={status.id}>
                      <div className="flex items-center gap-2">
                        <status.icon className={`w-4 h-4 ${status.color}`} />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter content title"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label>Content / Copy</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your content here..."
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label>Labels</Label>
              <div className="flex flex-wrap gap-2">
                {LABELS.map(label => (
                  <Badge
                    key={label.id}
                    variant="outline"
                    className={`cursor-pointer transition-all ${
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingItem ? "Update" : "Add"} Content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}