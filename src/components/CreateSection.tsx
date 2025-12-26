import { useState } from "react";
import { cn } from "@/lib/utils";
import { Image, Palette, Type, Camera, AtSign } from "lucide-react";
import LogosSection from "./branding/LogosSection";
import ColorsSection from "./branding/ColorsSection";
import FontsSection from "./branding/FontsSection";
import PhotosSection from "./branding/PhotosSection";
import { SocialBioBuilder } from "./SocialBioBuilder";

interface CreateSectionProps {
  projectId: string;
}

const NAV_ITEMS = [
  { id: "logos", label: "Logos", icon: Image, group: "Brand" },
  { id: "colors", label: "Colors", icon: Palette, group: "Brand" },
  { id: "fonts", label: "Fonts", icon: Type, group: "Brand" },
  { id: "photos", label: "Photos", icon: Camera, group: "Brand" },
  { id: "divider-1", type: "divider" },
  { id: "social-bio", label: "Social Bio", icon: AtSign, group: "Messaging" },
];

export const CreateSection = ({ projectId }: CreateSectionProps) => {
  const [activeSection, setActiveSection] = useState("logos");

  const renderContent = () => {
    switch (activeSection) {
      case "logos":
        return <LogosSection projectId={projectId} />;
      case "colors":
        return <ColorsSection projectId={projectId} />;
      case "fonts":
        return <FontsSection projectId={projectId} />;
      case "photos":
        return <PhotosSection projectId={projectId} />;
      case "social-bio":
        return <SocialBioBuilder projectId={projectId} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex gap-6 min-h-[500px]">
      {/* Sidebar Navigation */}
      <nav className="w-44 flex-shrink-0 space-y-1">
        {NAV_ITEMS.map((item) => {
          if (item.type === "divider") {
            return <div key={item.id} className="my-3 border-t border-border" />;
          }

          const Icon = item.icon!;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Content Area */}
      <div className="flex-1 min-w-0">{renderContent()}</div>
    </div>
  );
};
