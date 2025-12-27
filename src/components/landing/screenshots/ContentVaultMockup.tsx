import { Package, FolderOpen, Download, FileText, Video, Image, Type, Palette, BookOpen, Music } from "lucide-react";
import { BrowserFrame } from "../BrowserFrame";

export const ContentVaultMockup = () => {
  const categories = [
    { icon: FileText, name: "Social Media Posts", count: 45, color: "text-blue-500" },
    { icon: BookOpen, name: "Ebooks & Guides", count: 12, color: "text-purple-500" },
    { icon: Video, name: "Video Templates", count: 18, color: "text-red-500" },
    { icon: Image, name: "Stock Photos", count: 200, color: "text-green-500" },
    { icon: Type, name: "Font Pairings", count: 24, color: "text-amber-500" },
    { icon: Palette, name: "Color Palettes", count: 36, color: "text-pink-500" },
  ];

  const resources = [
    { title: "Launch Announcement Template", type: "Canva", category: "Social Posts" },
    { title: "Email Welcome Sequence", type: "PDF", category: "Ebooks" },
    { title: "Product Mockup Pack", type: "Canva", category: "Templates" },
  ];

  return (
    <BrowserFrame>
      <div className="p-6 min-h-[400px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Content Vault</h3>
              <p className="text-sm text-muted-foreground">335+ resources available</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              placeholder="Search resources..." 
              className="bg-muted/50 border border-border rounded-lg px-3 py-1.5 text-sm w-48"
              readOnly
            />
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {categories.map((cat, i) => (
            <div 
              key={i} 
              className="bg-card border border-border rounded-xl p-3 hover:border-accent/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <cat.icon className={`w-4 h-4 ${cat.color}`} />
                <span className="text-sm font-medium text-foreground">{cat.name}</span>
              </div>
              <div className="text-xs text-muted-foreground">{cat.count} resources</div>
            </div>
          ))}
        </div>

        {/* Recent Resources */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-accent" />
              <span className="font-medium text-foreground">Popular Resources</span>
            </div>
            <span className="text-xs text-muted-foreground">View all →</span>
          </div>
          <div className="space-y-2">
            {resources.map((resource, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <div className="font-medium text-sm text-foreground">{resource.title}</div>
                    <div className="text-xs text-muted-foreground">{resource.category}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                    {resource.type}
                  </span>
                  <Download className="w-4 h-4 text-muted-foreground hover:text-accent cursor-pointer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
};
