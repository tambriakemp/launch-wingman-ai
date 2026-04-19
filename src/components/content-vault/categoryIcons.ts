import { 
  FileText, 
  BookOpen, 
  CalendarDays, 
  Mail, 
  Image, 
  Video, 
  Sliders, 
  ShoppingBag, 
  Type,
  Folder,
  Palette,
  LucideIcon
} from "lucide-react";

interface CategoryIconConfig {
  icon: LucideIcon;
  color: string;
}

const CATEGORY_ICONS: Record<string, CategoryIconConfig> = {
  'social-media-posts': { icon: FileText, color: 'text-blue-500' },
  'social-posts': { icon: FileText, color: 'text-blue-500' },
  'ebooks': { icon: BookOpen, color: 'text-purple-500' },
  'planners': { icon: CalendarDays, color: 'text-green-500' },
  'email-designs': { icon: Mail, color: 'text-orange-500' },
  'emails': { icon: Mail, color: 'text-orange-500' },
  'photos': { icon: Image, color: 'text-emerald-500' },
  'stock-photos': { icon: Image, color: 'text-emerald-500' },
  'videos': { icon: Video, color: 'text-red-500' },
  'lightroom-presets': { icon: Sliders, color: 'text-pink-500' },
  'presets': { icon: Sliders, color: 'text-pink-500' },
  'luts': { icon: Palette, color: 'text-violet-500' },
  'etsy': { icon: ShoppingBag, color: 'text-amber-500' },
  'etsy-templates': { icon: ShoppingBag, color: 'text-amber-500' },
  'fonts': { icon: Type, color: 'text-cyan-500' },
  'business-documents': { icon: FileText, color: 'text-slate-500' },
  'templates': { icon: FileText, color: 'text-indigo-500' },
};

const DEFAULT_ICON: CategoryIconConfig = { icon: Folder, color: 'text-muted-foreground' };

export const getCategoryIcon = (slug: string): CategoryIconConfig => {
  return CATEGORY_ICONS[slug] || DEFAULT_ICON;
};
