import { useState, useRef, useCallback, useEffect } from "react";
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
} from "@/components/ui/dialog";
import { Plus, X, Palette, Trash2, Pencil } from "lucide-react";
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

// Convert HSV to Hex
const hsvToHex = (h: number, s: number, v: number): string => {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  };
  const r = Math.round(f(5) * 255);
  const g = Math.round(f(3) * 255);
  const b = Math.round(f(1) * 255);
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
};

// Convert Hex to HSV
const hexToHsv = (hex: string): { h: number; s: number; v: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, v: 0 };
  
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  
  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  
  return { h, s, v };
};

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const ColorPicker = ({ color, onChange }: ColorPickerProps) => {
  const saturationRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const [isDraggingSat, setIsDraggingSat] = useState(false);
  const [isDraggingHue, setIsDraggingHue] = useState(false);
  
  const hsv = hexToHsv(color);
  const [hue, setHue] = useState(hsv.h);
  const [saturation, setSaturation] = useState(hsv.s);
  const [value, setValue] = useState(hsv.v);

  useEffect(() => {
    const newHsv = hexToHsv(color);
    setHue(newHsv.h);
    setSaturation(newHsv.s);
    setValue(newHsv.v);
  }, [color]);

  const updateColor = useCallback((h: number, s: number, v: number) => {
    const hex = hsvToHex(h, s, v);
    onChange(hex);
  }, [onChange]);

  const handleSaturationMouseDown = (e: React.MouseEvent) => {
    setIsDraggingSat(true);
    updateSaturationValue(e);
  };

  const updateSaturationValue = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!saturationRef.current) return;
    const rect = saturationRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setSaturation(x);
    setValue(1 - y);
    updateColor(hue, x, 1 - y);
  }, [hue, updateColor]);

  const handleHueMouseDown = (e: React.MouseEvent) => {
    setIsDraggingHue(true);
    updateHueValue(e);
  };

  const updateHueValue = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newHue = x * 360;
    setHue(newHue);
    updateColor(newHue, saturation, value);
  }, [saturation, value, updateColor]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSat) updateSaturationValue(e);
      if (isDraggingHue) updateHueValue(e);
    };
    
    const handleMouseUp = () => {
      setIsDraggingSat(false);
      setIsDraggingHue(false);
    };

    if (isDraggingSat || isDraggingHue) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingSat, isDraggingHue, updateSaturationValue, updateHueValue]);

  return (
    <div className="space-y-3">
      {/* Saturation/Value picker */}
      <div
        ref={saturationRef}
        className="relative w-full h-40 rounded-lg cursor-crosshair overflow-hidden"
        style={{
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))`,
        }}
        onMouseDown={handleSaturationMouseDown}
      >
        <div
          className="absolute w-4 h-4 border-2 border-white rounded-full shadow-md transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${saturation * 100}%`,
            top: `${(1 - value) * 100}%`,
            boxShadow: "0 0 0 1px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)",
          }}
        />
      </div>

      {/* Hue slider */}
      <div
        ref={hueRef}
        className="relative w-full h-3 rounded-full cursor-pointer"
        style={{
          background: "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
        }}
        onMouseDown={handleHueMouseDown}
      >
        <div
          className="absolute w-4 h-4 border-2 border-white rounded-full shadow-md transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${(hue / 360) * 100}%`,
            top: "50%",
            backgroundColor: `hsl(${hue}, 100%, 50%)`,
            boxShadow: "0 0 0 1px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)",
          }}
        />
      </div>
    </div>
  );
};

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

  const handleDelete = () => {
    if (editingColor) {
      deleteMutation.mutate(editingColor.id);
      handleCloseDialog();
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
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Input
                value={colorName || "Untitled color"}
                onChange={(e) => setColorName(e.target.value)}
                placeholder="Untitled color"
                className="border-none text-lg font-medium p-0 h-auto focus-visible:ring-0 bg-transparent"
              />
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <ColorPicker color={selectedColor} onChange={setSelectedColor} />
            
            {/* Color preview and hex input */}
            <div className="flex items-center gap-3 pt-2">
              {editingColor && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <div
                className="w-8 h-8 rounded-md border shadow-inner shrink-0"
                style={{ backgroundColor: selectedColor }}
              />
              <Input
                type="text"
                value={selectedColor.toUpperCase()}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                    setSelectedColor(val);
                  }
                }}
                className="font-mono text-sm flex-1"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={handleCloseDialog} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} className="flex-1">
                {editingColor ? "Update" : "Add Color"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ColorsSection;
