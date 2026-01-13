import { Instagram, Facebook, Linkedin } from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface PlatformConfig {
  id: string;
  name: string;
  icon: LucideIcon | null;
  customIcon?: string;
  color: string;
  bgColor: string;
  maxMedia: number;
  supportsVideo: boolean;
  maxCaptionLength: number;
  hidden?: boolean;
}

export const PLATFORMS: PlatformConfig[] = [
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "#E4405F",
    bgColor: "bg-[#E4405F]",
    maxMedia: 10,
    supportsVideo: true,
    maxCaptionLength: 2200,
    hidden: false,
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    color: "#1877F2",
    bgColor: "bg-[#1877F2]",
    maxMedia: 10,
    supportsVideo: true,
    maxCaptionLength: 63206,
    hidden: false,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    color: "#0A66C2",
    bgColor: "bg-[#0A66C2]",
    maxMedia: 9,
    supportsVideo: true,
    maxCaptionLength: 3000,
    hidden: true,
  },
  {
    id: "pinterest",
    name: "Pinterest",
    icon: null,
    customIcon: "pinterest",
    color: "#E60023",
    bgColor: "bg-[#E60023]",
    maxMedia: 1,
    supportsVideo: true,
    maxCaptionLength: 500,
    hidden: false,
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: null,
    customIcon: "tiktok",
    color: "#000000",
    bgColor: "bg-black",
    maxMedia: 1,
    supportsVideo: true,
    maxCaptionLength: 2200,
    hidden: true,
  },
];

export const getPlatformById = (id: string): PlatformConfig | undefined => {
  return PLATFORMS.find((p) => p.id === id);
};
