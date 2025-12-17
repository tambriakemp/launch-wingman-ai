import { Palette, Image, Type, Upload, Check } from "lucide-react";
import { BrowserFrame } from "../BrowserFrame";

export const BrandingMockup = () => {
  return (
    <BrowserFrame>
      <div className="p-6 min-h-[380px]">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-1">Brand Assets</h3>
          <p className="text-sm text-muted-foreground">Your visual identity, organized and ready</p>
        </div>

        {/* Brand Sections */}
        <div className="grid grid-cols-2 gap-4">
          {/* Logos */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Image className="w-4 h-4 text-accent" />
              <span className="font-medium text-foreground text-sm">Logos</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                  {i <= 2 ? (
                    <div className="w-8 h-8 rounded bg-foreground/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-foreground/60">L</span>
                    </div>
                  ) : (
                    <Upload className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-accent" />
              <span className="font-medium text-foreground text-sm">Colors</span>
            </div>
            <div className="space-y-2">
              {[
                { name: "Primary", color: "bg-[#F7DC6F]" },
                { name: "Secondary", color: "bg-[#1C1C1E]" },
                { name: "Accent", color: "bg-[#E74C3C]" },
                { name: "Background", color: "bg-[#FAFAFA]" },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded ${c.color} border border-border`} />
                  <span className="text-xs text-muted-foreground">{c.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fonts */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Type className="w-4 h-4 text-accent" />
              <span className="font-medium text-foreground text-sm">Fonts</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-lg font-bold text-foreground">Plus Jakarta</div>
                <div className="text-xs text-muted-foreground">Headlines</div>
              </div>
              <div>
                <div className="text-sm text-foreground">Inter Regular</div>
                <div className="text-xs text-muted-foreground">Body Text</div>
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Image className="w-4 h-4 text-accent" />
              <span className="font-medium text-foreground text-sm">Photos</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div 
                  key={i} 
                  className={`aspect-square rounded ${
                    i <= 4 
                      ? 'bg-gradient-to-br from-accent/30 to-accent/10' 
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
          <span className="text-muted-foreground">Brand kit 80% complete</span>
        </div>
      </div>
    </BrowserFrame>
  );
};
