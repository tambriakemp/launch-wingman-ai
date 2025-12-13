import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Type, Upload, Trash2, ArrowLeft, Search } from "lucide-react";
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

// Comprehensive Google Fonts list (100+ fonts)
const GOOGLE_FONTS = [
  // Display fonts
  "Abril Fatface", "Alfa Slab One", "Anton", "Archivo Black", "Bebas Neue", "Black Ops One",
  "Bungee", "Cabin Sketch", "Dela Gothic One", "Fjalla One", "Fredoka One", "Fugaz One",
  "Lilita One", "Lobster", "Lobster Two", "Pacifico", "Permanent Marker", "Righteous",
  "Russo One", "Satisfy", "Secular One", "Sigmar One", "Titan One", "Ultra",
  // Serif fonts
  "Bitter", "Cormorant", "Cormorant Garamond", "Crimson Pro", "Crimson Text", "DM Serif Display",
  "EB Garamond", "Frank Ruhl Libre", "Gelasio", "IBM Plex Serif", "Josefin Slab", "Libre Baskerville",
  "Lora", "Merriweather", "Noto Serif", "Old Standard TT", "Playfair Display", "Prata",
  "PT Serif", "Roboto Slab", "Rokkitt", "Spectral", "Vollkorn", "Zilla Slab",
  // Sans-serif fonts
  "Alegreya Sans", "Archivo", "Asap", "Barlow", "Barlow Condensed", "Be Vietnam Pro",
  "Cabin", "Catamaran", "DM Sans", "Encode Sans", "Exo 2", "Figtree", "Fira Sans",
  "Heebo", "Hind", "IBM Plex Sans", "Inter", "Jost", "Karla", "Lato", "Lexend",
  "Manrope", "Maven Pro", "Montserrat", "Mulish", "Nunito", "Nunito Sans", "Open Sans",
  "Outfit", "Overpass", "Oxygen", "Plus Jakarta Sans", "Poppins", "Prompt", "PT Sans",
  "Public Sans", "Quicksand", "Raleway", "Red Hat Display", "Roboto", "Rubik",
  "Sarabun", "Signika", "Sora", "Source Sans Pro", "Space Grotesk", "Teko",
  "Titillium Web", "Ubuntu", "Urbanist", "Varela Round", "Work Sans", "Yantramanav",
  // Handwriting/Script fonts
  "Amatic SC", "Bad Script", "Caveat", "Courgette", "Dancing Script", "Gloria Hallelujah",
  "Great Vibes", "Handlee", "Indie Flower", "Kalam", "Kaushan Script", "Marck Script",
  "Parisienne", "Patrick Hand", "Reenie Beanie", "Sacramento", "Shadows Into Light",
  // Monospace fonts
  "Fira Code", "Fira Mono", "IBM Plex Mono", "Inconsolata", "JetBrains Mono",
  "Overpass Mono", "Roboto Mono", "Source Code Pro", "Space Mono", "Ubuntu Mono",
].sort();

const FontsSection = ({ projectId }: FontsSectionProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [showManageView, setShowManageView] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch assigned fonts (fonts selected for categories)
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

  // Fetch uploaded custom fonts (separate query)
  const { data: uploadedFonts = [] } = useQuery({
    queryKey: ["uploaded-fonts", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_fonts")
        .select("*")
        .eq("project_id", projectId)
        .eq("font_source", "custom");

      if (error) throw error;
      return data as BrandFont[];
    },
    enabled: !!projectId && !!user,
  });

  // Get unique uploaded fonts (deduplicated by font_family)
  const uniqueUploadedFonts = useMemo(() => {
    const seen = new Set<string>();
    return uploadedFonts.filter(f => {
      if (seen.has(f.font_family)) return false;
      seen.add(f.font_family);
      return true;
    });
  }, [uploadedFonts]);

  const upsertMutation = useMutation({
    mutationFn: async ({ category, fontFamily, fontSource, customPath }: { 
      category: string; 
      fontFamily: string; 
      fontSource: string;
      customPath?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("brand_fonts")
        .upsert(
          {
            project_id: projectId,
            user_id: user.id,
            font_category: category,
            font_family: fontFamily,
            font_source: fontSource,
            custom_font_path: customPath || null,
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

  const deleteFontMutation = useMutation({
    mutationFn: async (fontFamily: string) => {
      // Delete from storage
      const fontsToDelete = uploadedFonts.filter(f => f.font_family === fontFamily);
      for (const font of fontsToDelete) {
        if (font.custom_font_path) {
          await supabase.storage.from("brand-assets").remove([font.custom_font_path]);
        }
      }
      
      // Delete from database
      const { error } = await supabase
        .from("brand_fonts")
        .delete()
        .eq("project_id", projectId)
        .eq("font_family", fontFamily)
        .eq("font_source", "custom");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-fonts", projectId] });
      queryClient.invalidateQueries({ queryKey: ["uploaded-fonts", projectId] });
      toast({ title: "Font deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to delete font", description: error.message, variant: "destructive" });
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

  const loadCustomFont = async (fontFamily: string, fontPath: string) => {
    if (loadedFonts.has(fontFamily)) return;

    const { data } = supabase.storage.from("brand-assets").getPublicUrl(fontPath);
    
    const fontFace = new FontFace(fontFamily, `url(${data.publicUrl})`);
    try {
      const loadedFont = await fontFace.load();
      document.fonts.add(loadedFont);
      setLoadedFonts((prev) => new Set(prev).add(fontFamily));
    } catch (error) {
      console.error("Failed to load custom font:", error);
    }
  };

  const getFontForCategory = (category: string) => {
    const font = fonts.find((f) => f.font_category === category);
    return font?.font_family || "";
  };

  const handleFontChange = (category: string, fontFamily: string) => {
    const uploadedFont = uniqueUploadedFonts.find(f => f.font_family === fontFamily);
    if (uploadedFont) {
      if (uploadedFont.custom_font_path) {
        loadCustomFont(fontFamily, uploadedFont.custom_font_path);
      }
      upsertMutation.mutate({ 
        category, 
        fontFamily, 
        fontSource: "custom",
        customPath: uploadedFont.custom_font_path || undefined
      });
    } else {
      loadGoogleFont(fontFamily);
      upsertMutation.mutate({ category, fontFamily, fontSource: "google" });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop()?.toLowerCase();
        if (!["woff", "woff2", "ttf", "otf"].includes(fileExt || "")) {
          toast({ 
            title: "Invalid file type", 
            description: "Only .woff, .woff2, .ttf, .otf files are allowed",
            variant: "destructive" 
          });
          continue;
        }

        const fontName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        const filePath = `fonts/${projectId}/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("brand-assets")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Save to database (use a placeholder category that won't conflict)
        const { error: dbError } = await supabase
          .from("brand_fonts")
          .insert({
            project_id: projectId,
            user_id: user.id,
            font_category: `uploaded_${Date.now()}`,
            font_family: fontName,
            font_source: "custom",
            custom_font_path: filePath,
          });

        if (dbError) throw dbError;
      }

      queryClient.invalidateQueries({ queryKey: ["uploaded-fonts", projectId] });
      toast({ title: "Font(s) uploaded successfully" });
      setUploadDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Load all selected fonts on mount
  fonts.forEach((font) => {
    if (font.font_source === "google") {
      loadGoogleFont(font.font_family);
    } else if (font.custom_font_path) {
      loadCustomFont(font.font_family, font.custom_font_path);
    }
  });

  // Load uploaded fonts for dropdown preview
  uniqueUploadedFonts.forEach((font) => {
    if (font.custom_font_path) {
      loadCustomFont(font.font_family, font.custom_font_path);
    }
  });

  // Filter fonts based on search
  const filteredGoogleFonts = useMemo(() => {
    if (!searchQuery) return GOOGLE_FONTS;
    return GOOGLE_FONTS.filter(font => 
      font.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const filteredUploadedFonts = useMemo(() => {
    if (!searchQuery) return uniqueUploadedFonts;
    return uniqueUploadedFonts.filter(font => 
      font.font_family.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, uniqueUploadedFonts]);

  // Manage uploaded fonts view
  if (showManageView) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setShowManageView(false)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Fonts
          </Button>
          <h3 className="text-lg font-semibold">Manage Uploaded Fonts</h3>
        </div>

        {uniqueUploadedFonts.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <Type className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No uploaded fonts yet</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {uniqueUploadedFonts.map((font) => (
              <Card key={font.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{font.font_family}</p>
                    <p 
                      className="text-2xl mt-1"
                      style={{ fontFamily: font.font_family }}
                    >
                      AaBbCc 123
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteFontMutation.mutate(font.font_family)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Brand Fonts</h3>
          <p className="text-sm text-muted-foreground">
            Select fonts for different text styles
          </p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Upload Fonts
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Custom Fonts</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload .woff, .woff2, .ttf, or .otf font files
              </p>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".woff,.woff2,.ttf,.otf"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="font-upload"
                />
                <label htmlFor="font-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {uploading ? "Uploading..." : "Click to upload or drag and drop"}
                  </p>
                </label>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Select font">
                        {selectedFont || "Select font"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px]">
                      <div className="px-2 py-2 sticky top-0 bg-popover z-10">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search fonts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 h-9"
                          />
                        </div>
                      </div>
                      
                      {filteredUploadedFonts.length > 0 && (
                        <>
                          <SelectGroup>
                            <SelectLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                              Uploaded Fonts
                            </SelectLabel>
                            {filteredUploadedFonts.map((font) => (
                              <SelectItem
                                key={font.id}
                                value={font.font_family}
                                style={{ fontFamily: font.font_family }}
                              >
                                <span className="flex items-center justify-between w-full gap-4">
                                  <span>{font.font_family}</span>
                                  <span className="text-muted-foreground">AaBb</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                          <div className="my-3 mx-2 border-t border-border" />
                        </>
                      )}
                      
                      <SelectGroup>
                        <SelectLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                          Google Fonts
                        </SelectLabel>
                        {filteredGoogleFonts.map((font) => {
                          loadGoogleFont(font);
                          return (
                            <SelectItem 
                              key={font} 
                              value={font}
                              style={{ fontFamily: font }}
                            >
                              <span className="flex items-center justify-between w-full gap-4">
                                <span>{font}</span>
                                <span className="text-muted-foreground">AaBb</span>
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {uniqueUploadedFonts.length > 0 && (
        <button
          onClick={() => setShowManageView(true)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
        >
          Manage uploaded fonts ({uniqueUploadedFonts.length})
        </button>
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
