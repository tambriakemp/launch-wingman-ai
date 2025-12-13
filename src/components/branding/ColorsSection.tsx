import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, X, Palette } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ColorsSectionProps {
  projectId: string;
}

interface BrandColor {
  id: string;
  project_id: string;
  user_id: string;
  hex_color: string;
  name: string | null;
  position: number;
  created_at: string;
}

const ColorsSection = ({ projectId }: ColorsSectionProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#6366f1");
  const [colorName, setColorName] = useState("");
  const [editingColor, setEditingColor] = useState<BrandColor | null>(null);

  const { data: colors = [], isLoading } = useQuery({
    queryKey: ["brand-colors", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_colors")
        .select("*")
        .eq("project_id", projectId)
        .order("position", { ascending: true });

      if (error) throw error;
      return data as BrandColor[];
    },
    enabled: !!projectId && !!user,
  });

  const createMutation = useMutation({
    mutationFn: async ({ hexColor, name }: { hexColor: string; name: string }) => {
      if (!user) throw new Error("Not authenticated");

      const maxPosition = colors.reduce((max, c) => Math.max(max, c.position), -1);

      const { error } = await supabase.from("brand_colors").insert({
        project_id: projectId,
        user_id: user.id,
        hex_color: hexColor,
        name: name || null,
        position: maxPosition + 1,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-colors", projectId] });
      toast({ title: "Color added successfully" });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({ title: "Failed to add color", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, hexColor, name }: { id: string; hexColor: string; name: string }) => {
      const { error } = await supabase
        .from("brand_colors")
        .update({ hex_color: hexColor, name: name || null })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-colors", projectId] });
      toast({ title: "Color updated successfully" });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({ title: "Failed to update color", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("brand_colors")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-colors", projectId] });
      toast({ title: "Color deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to delete color", description: error.message, variant: "destructive" });
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedColor("#6366f1");
    setColorName("");
    setEditingColor(null);
  };

  const handleOpenAddDialog = () => {
    setEditingColor(null);
    setSelectedColor("#6366f1");
    setColorName("");
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (color: BrandColor) => {
    setEditingColor(color);
    setSelectedColor(color.hex_color);
    setColorName(color.name || "");
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingColor) {
      updateMutation.mutate({
        id: editingColor.id,
        hexColor: selectedColor,
        name: colorName,
      });
    } else {
      createMutation.mutate({
        hexColor: selectedColor,
        name: colorName,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Brand Colors</h3>
          <p className="text-sm text-muted-foreground">
            Define your brand color palette
          </p>
        </div>
        <span className="text-sm text-muted-foreground">
          Colors ({colors.length})
        </span>
      </div>

      {isLoading ? (
        <div className="flex gap-4 flex-wrap">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-20 h-20 rounded-full animate-pulse bg-muted" />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 flex-wrap items-start">
          {colors.map((color) => (
            <div key={color.id} className="group relative flex flex-col items-center gap-2">
              <button
                onClick={() => handleOpenEditDialog(color)}
                className="w-16 h-16 rounded-full border-2 border-border hover:border-primary transition-colors shadow-sm hover:shadow-md"
                style={{ backgroundColor: color.hex_color }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-destructive hover:bg-destructive/90"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMutation.mutate(color.id);
                }}
              >
                <X className="h-3 w-3 text-destructive-foreground" />
              </Button>
              <span className="text-xs text-muted-foreground font-mono">
                {color.hex_color.toUpperCase()}
              </span>
              {color.name && (
                <span className="text-xs text-foreground">{color.name}</span>
              )}
            </div>
          ))}
          
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleOpenAddDialog}
              className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground/50 hover:border-primary flex items-center justify-center transition-colors"
            >
              <Plus className="h-6 w-6 text-muted-foreground" />
            </button>
            <span className="text-xs text-muted-foreground">Add new</span>
          </div>
        </div>
      )}

      {colors.length === 0 && !isLoading && (
        <Card className="p-12 text-center border-dashed">
          <Palette className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No colors defined yet</p>
          <Button variant="outline" onClick={handleOpenAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add your first color
          </Button>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingColor ? "Edit Color" : "Add New Color"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <div
                className="w-20 h-20 rounded-lg border shadow-inner"
                style={{ backgroundColor: selectedColor }}
              />
              <div className="flex-1 space-y-2">
                <Input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-full h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  placeholder="#000000"
                  className="font-mono"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Color Name (optional)</label>
              <Input
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
                placeholder="e.g., Primary Blue"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingColor ? "Update" : "Add Color"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ColorsSection;
