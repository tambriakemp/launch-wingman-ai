import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Upload, MoreVertical, Download, Trash2, Image } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface LogosSectionProps {
  projectId: string;
}

interface BrandLogo {
  id: string;
  project_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  created_at: string;
}

const LogosSection = ({ projectId }: LogosSectionProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: logos = [], isLoading } = useQuery({
    queryKey: ["brand-logos", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_logos")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BrandLogo[];
    },
    enabled: !!projectId && !!user,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user.id}/logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("brand-assets")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("brand_logos").insert({
        project_id: projectId,
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
      });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-logos", projectId] });
      toast({ title: "Logo uploaded successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to upload logo", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (logo: BrandLogo) => {
      const { error: storageError } = await supabase.storage
        .from("brand-assets")
        .remove([logo.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("brand_logos")
        .delete()
        .eq("id", logo.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-logos", projectId] });
      toast({ title: "Logo deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to delete logo", description: error.message, variant: "destructive" });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadMutation.mutateAsync(file);
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDownload = async (logo: BrandLogo) => {
    const { data } = supabase.storage.from("brand-assets").getPublicUrl(logo.file_path);
    
    const link = document.createElement("a");
    link.href = data.publicUrl;
    link.download = logo.file_name;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPublicUrl = (filePath: string) => {
    const { data } = supabase.storage.from("brand-assets").getPublicUrl(filePath);
    return data.publicUrl;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Logos</h3>
          <p className="text-sm text-muted-foreground">
            Upload your brand logos (PNG, JPG, SVG, WEBP)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Assets ({logos.length})
          </span>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            size="sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="aspect-square animate-pulse bg-muted" />
          ))}
        </div>
      ) : logos.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No logos uploaded yet</p>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload your first logo
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {logos.map((logo) => (
            <Card key={logo.id} className="group relative overflow-hidden">
              <div className="aspect-square bg-muted/50 flex items-center justify-center p-4">
                <img
                  src={getPublicUrl(logo.file_path)}
                  alt={logo.file_name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="p-3 border-t">
                <p className="text-sm font-medium truncate">{logo.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  Image • {format(new Date(logo.created_at), "MMM d, yyyy")}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDownload(logo)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => deleteMutation.mutate(logo)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LogosSection;
