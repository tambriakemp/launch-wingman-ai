import { useState, useEffect } from "react";
import { Plus, FileText, MoreHorizontal, Pencil, Trash2, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const SALES_PAGE_SECTIONS = [
  { id: "heading", label: "Heading", placeholder: "Enter your main headline..." },
  { id: "subheading", label: "Subheading", placeholder: "Enter your supporting subheadline..." },
  { id: "description", label: "Description", placeholder: "Enter your offer description..." },
  { id: "boldQuestion", label: "Bold Question", placeholder: "Enter the bold question that hooks your audience..." },
  { id: "solutionStory", label: "Solution Discovery Story", placeholder: "Tell the story of how you discovered this solution..." },
  { id: "offerDetails", label: "Offer Details", placeholder: "Detail what's included in your offer..." },
  { id: "testimonials", label: "Testimonials", placeholder: "Add client testimonials and social proof..." },
  { id: "faqs", label: "FAQs", placeholder: "Add frequently asked questions and answers..." },
];

interface SalesPageCopy {
  id: string;
  deliverableId: string;
  deliverableName: string;
  sections: Record<string, string>;
}

interface SalesPageCopyBuilderProps {
  projectId: string;
}

export const SalesPageCopyBuilder = ({ projectId }: SalesPageCopyBuilderProps) => {
  const [items, setItems] = useState<SalesPageCopy[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SalesPageCopy | null>(null);
  const [selectedDeliverable, setSelectedDeliverable] = useState<string>("");
  const [sections, setSections] = useState<Record<string, string>>({});
  const [directionsOpen, setDirectionsOpen] = useState(true);

  // Fetch offer to get deliverables
  const { data: offer } = useQuery({
    queryKey: ["offer", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const deliverables = offer?.main_deliverables || [];

  // Deliverable name mapping
  const DELIVERABLE_NAMES: Record<string, string> = {
    "step-by-step-tutorials": "Step-by-Step Tutorials",
    "checklists": "Checklists",
    "cheat-sheets": "Cheat Sheets",
    "coaching-sessions": "1:1 or Group Coaching Sessions",
    "workbooks": "Workbooks",
    "planners": "Planners",
    "templates": "Templates",
    "trello-boards": "Trello Boards",
    "audio-files": "Audio Files",
    "affirmations": "Affirmations",
    "journals": "Journals",
    "support-groups": "Support Groups",
    "voice-message-support": "Voice Message Support",
    "text-message-support": "Text Message Support",
    "email-support": "Email Support",
    "live-chat-support": "Live Chat Support",
  };

  const getDeliverableName = (id: string) => DELIVERABLE_NAMES[id] || id;

  const handleAdd = () => {
    setEditingItem(null);
    setSelectedDeliverable("");
    setSections({});
    setDialogOpen(true);
  };

  const handleEdit = (item: SalesPageCopy) => {
    setEditingItem(item);
    setSelectedDeliverable(item.deliverableId);
    setSections(item.sections);
    setDialogOpen(true);
  };

  const handleDelete = (item: SalesPageCopy) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    toast.success("Sales page copy deleted");
  };

  const handleSave = () => {
    if (!selectedDeliverable) {
      toast.error("Please select a deliverable");
      return;
    }

    const hasContent = Object.values(sections).some((s) => s.trim());
    if (!hasContent) {
      toast.error("Please enter copy for at least one section");
      return;
    }

    if (editingItem) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? { ...item, deliverableId: selectedDeliverable, deliverableName: getDeliverableName(selectedDeliverable), sections }
            : item
        )
      );
      toast.success("Sales page copy updated");
    } else {
      // Check if copy already exists for this deliverable
      const existing = items.find((i) => i.deliverableId === selectedDeliverable);
      if (existing) {
        toast.error("Sales page copy already exists for this deliverable. Edit the existing one instead.");
        return;
      }

      const newItem: SalesPageCopy = {
        id: crypto.randomUUID(),
        deliverableId: selectedDeliverable,
        deliverableName: getDeliverableName(selectedDeliverable),
        sections,
      };
      setItems((prev) => [...prev, newItem]);
      toast.success("Sales page copy added");
    }

    setDialogOpen(false);
    setSelectedDeliverable("");
    setSections({});
    setEditingItem(null);
  };

  const updateSection = (sectionId: string, value: string) => {
    setSections((prev) => ({ ...prev, [sectionId]: value }));
  };

  // Filter out deliverables that already have copy (unless editing)
  const availableDeliverables = deliverables.filter(
    (d) => editingItem?.deliverableId === d || !items.find((i) => i.deliverableId === d)
  );

  return (
    <Card className="border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Sales Page Copy</CardTitle>
              <CardDescription className="text-sm">
                Headlines, benefits, and persuasive copy for your sales page
              </CardDescription>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAdd}
            disabled={deliverables.length === 0}
          >
            <Plus className="w-4 h-4" />
            Add New
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {deliverables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">No deliverables found</p>
            <p className="text-xs text-muted-foreground">
              Add deliverables in the Offer Builder first
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">No sales page copy added yet</p>
            <Button size="sm" variant="ghost" onClick={handleAdd}>
              <Plus className="w-4 h-4" />
              Add Your First
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-lg border bg-background hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground">{item.deliverableName}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {Object.entries(item.sections).filter(([_, v]) => v.trim()).length} of {SALES_PAGE_SECTIONS.length} sections completed
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
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
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {editingItem ? "Edit" : "Add"} Sales Page Copy
            </DialogTitle>
            <DialogDescription>
              Create compelling copy for each section of your sales page
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-2">
            {/* Deliverable Selection */}
            <div className="space-y-2">
              <Label>Select Deliverable</Label>
              <Select value={selectedDeliverable} onValueChange={setSelectedDeliverable}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a deliverable..." />
                </SelectTrigger>
                <SelectContent>
                  {availableDeliverables.map((d) => (
                    <SelectItem key={d} value={d}>
                      {getDeliverableName(d)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ChatGPT Direction Box */}
            <Collapsible open={directionsOpen} onOpenChange={setDirectionsOpen}>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <CollapsibleTrigger asChild>
                  <button className="flex items-center justify-between w-full text-left">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm text-foreground">
                        How to Create Your Sales Page Copy
                      </span>
                    </div>
                    {directionsOpen ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>
                      Use ChatGPT to help generate each section of your sales page copy. For each section below, use this prompt template:
                    </p>
                    <div className="bg-background rounded-md p-3 border text-xs font-mono">
                      "I'm creating a sales page for my [deliverable type]. My target audience is [describe audience]. Help me write the [section name] for my sales page. The main transformation I offer is [transformation statement]."
                    </div>
                    <p className="text-xs">
                      Replace the bracketed sections with your specific details, then paste the generated copy into each section below.
                    </p>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Sales Page Sections */}
            <div className="space-y-4">
              {SALES_PAGE_SECTIONS.map((section) => (
                <div key={section.id} className="space-y-2">
                  <Label htmlFor={section.id}>{section.label}</Label>
                  <Textarea
                    id={section.id}
                    placeholder={section.placeholder}
                    value={sections[section.id] || ""}
                    onChange={(e) => updateSection(section.id, e.target.value)}
                    rows={3}
                  />
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingItem ? "Save Changes" : "Save Copy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
