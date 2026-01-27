import { Card } from "@/components/ui/card";
import { Camera, ExternalLink, Search, FolderOpen, Lightbulb } from "lucide-react";

const PhotosSection = () => {
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Camera className="h-5 w-5 text-primary" />
          <h4 className="font-medium text-foreground">Finding Your Brand Photos</h4>
        </div>
        
        <p className="text-sm text-muted-foreground mb-6">
          Gather photos that capture the feeling of your brand. These will help you stay consistent across your launch content.
        </p>

        {/* Where to Find Inspiration */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Search className="h-4 w-4 text-primary" />
            <h5 className="text-sm font-medium text-foreground">Where to Find Inspiration</h5>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <a 
              href="https://pinterest.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-foreground/80 hover:text-primary transition-colors"
            >
              <span>•</span>
              <span>Pinterest</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <a 
              href="https://pexels.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-foreground/80 hover:text-primary transition-colors"
            >
              <span>•</span>
              <span>Pexels</span>
              <span className="text-xs text-muted-foreground">(free stock photos)</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <a 
              href="https://unsplash.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-foreground/80 hover:text-primary transition-colors"
            >
              <span>•</span>
              <span>Unsplash</span>
              <span className="text-xs text-muted-foreground">(free stock photos)</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Tips for Searching */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-primary" />
            <h5 className="text-sm font-medium text-foreground">Tips for Searching</h5>
          </div>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Use keywords that resonate with your brand</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Search for colors, moods, or themes</span>
            </li>
            <li className="flex items-start gap-2">
              <span>•</span>
              <span>Look for images that feel "you"</span>
            </li>
          </ul>
        </div>

        {/* Keep It Organized */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen className="h-4 w-4 text-primary" />
            <h5 className="text-sm font-medium text-foreground">Keep It Organized</h5>
          </div>
          <p className="text-sm text-muted-foreground">
            Download your favorites and save them in a dedicated folder on your computer for easy reference during your launch.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default PhotosSection;
