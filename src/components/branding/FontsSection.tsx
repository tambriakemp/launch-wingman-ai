import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Type } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FontsSectionProps {
  projectId: string;
}

interface BrandFont {
  id: string;
  project_id: string;
  user_id: string;
  font_category: string;
  font_family: string;
  font_source: string;
  custom_font_path: string | null;
  created_at: string;
}

const FONT_CATEGORIES = [
  { id: "title", label: "Title", preview: "Your Main Title" },
  { id: "subtitle", label: "Subtitle", preview: "Your Subtitle Text" },
  { id: "heading", label: "Heading", preview: "Section Heading" },
  { id: "subheading", label: "Subheading", preview: "Subheading Text" },
  { id: "body", label: "Body", preview: "Body text for paragraphs and content" },
  { id: "caption", label: "Caption", preview: "Caption or small text" },
];

const GOOGLE_FONTS = [
  "Plus Jakarta Sans",
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Playfair Display",
  "Merriweather",
  "Source Sans Pro",
  "Raleway",
  "Oswald",
  "Nunito",
  "Ubuntu",
  "PT Sans",
  "Quicksand",
  "Work Sans",
  "DM Sans",
  "Rubik",
  "Karla",
  "Outfit",
  "Space Grotesk",
  "Sora",
  "Manrope",
];

const FontsSection = ({ projectId }: FontsSectionProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());

  const { data: fonts = [], isLoading } = useQuery({
    queryKey: ["brand-fonts", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_fonts")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;
      return data as BrandFont[];
    },
    enabled: !!projectId && !!user,
  });

  const upsertMutation = useMutation({
    mutationFn: async ({ category, fontFamily }: { category: string; fontFamily: string }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("brand_fonts")
        .upsert(
          {
            project_id: projectId,
            user_id: user.id,
            font_category: category,
            font_family: fontFamily,
            font_source: "google",
          },
          { onConflict: "project_id,font_category" }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-fonts", projectId] });
      toast({ title: "Font updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to update font", description: error.message, variant: "destructive" });
    },
  });

  const loadGoogleFont = (fontFamily: string) => {
    if (loadedFonts.has(fontFamily)) return;

    const link = document.createElement("link");
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, "+")}:wght@400;500;600;700&display=swap`;
    link.rel = "stylesheet";
    document.head.appendChild(link);
    setLoadedFonts((prev) => new Set(prev).add(fontFamily));
  };

  const getFontForCategory = (category: string) => {
    const font = fonts.find((f) => f.font_category === category);
    return font?.font_family || "";
  };

  const handleFontChange = (category: string, fontFamily: string) => {
    loadGoogleFont(fontFamily);
    upsertMutation.mutate({ category, fontFamily });
  };

  // Load all selected fonts on mount
  fonts.forEach((font) => {
    if (font.font_source === "google") {
      loadGoogleFont(font.font_family);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Brand Fonts</h3>
          <p className="text-sm text-muted-foreground">
            Select fonts for different text styles
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4 animate-pulse bg-muted h-24" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {FONT_CATEGORIES.map((category) => {
            const selectedFont = getFontForCategory(category.id);
            return (
              <Card key={category.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {category.label}
                    </p>
                    <p
                      className="text-lg truncate"
                      style={{
                        fontFamily: selectedFont || "inherit",
                        fontSize: category.id === "title" ? "1.5rem" : 
                                 category.id === "subtitle" ? "1.25rem" :
                                 category.id === "heading" ? "1.125rem" :
                                 category.id === "caption" ? "0.875rem" : "1rem",
                      }}
                    >
                      {category.preview}
                    </p>
                  </div>
                  <Select
                    value={selectedFont}
                    onValueChange={(value) => handleFontChange(category.id, value)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select font">
                        {selectedFont || "Select font"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {GOOGLE_FONTS.map((font) => {
                        loadGoogleFont(font);
                        return (
                          <SelectItem 
                            key={font} 
                            value={font}
                            style={{ fontFamily: font }}
                          >
                            {font}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {fonts.length === 0 && !isLoading && (
        <Card className="p-8 text-center border-dashed mt-4">
          <Type className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Select fonts above to build your typography system
          </p>
        </Card>
      )}
    </div>
  );
};

export default FontsSection;
