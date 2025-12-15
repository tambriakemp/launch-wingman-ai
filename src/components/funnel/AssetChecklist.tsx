import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { 
  FileText, Mail, MessageSquare, Package, 
  Check, ChevronDown, ChevronRight,
  ArrowRight, GripVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FUNNEL_CONFIGS, AssetRequirement } from "@/data/funnelConfigs";
import { OfferSlotData } from "./OfferSlotCard";
import { cn } from "@/lib/utils";

interface AssetChecklistProps {
  funnelType: string;
  offers: OfferSlotData[];
  completedAssets: Set<string>;
  onToggleAsset: (assetId: string) => void;
  onReorderAssets?: (categoryId: string, reorderedAssets: AssetRequirement[]) => void;
}

type AssetCategory = 'pages' | 'emails' | 'content' | 'deliverables';

const CATEGORY_CONFIG: Record<AssetCategory, { 
  icon: React.ElementType; 
  label: string; 
  color: string;
  route: string;
}> = {
  pages: { 
    icon: FileText, 
    label: 'Pages', 
    color: 'text-blue-500',
    route: 'sales-copy'
  },
  emails: { 
    icon: Mail, 
    label: 'Emails', 
    color: 'text-amber-500',
    route: 'emails'
  },
  content: { 
    icon: MessageSquare, 
    label: 'Content', 
    color: 'text-emerald-500',
    route: 'content'
  },
  deliverables: { 
    icon: Package, 
    label: 'Deliverables', 
    color: 'text-purple-500',
    route: 'deliverables'
  },
};

// Filter categories for the filter popover
export const ASSET_CATEGORIES = [
  { id: 'pages', label: 'Pages' },
  { id: 'emails', label: 'Emails' },
  { id: 'content', label: 'Content' },
  { id: 'deliverables', label: 'Deliverables' },
];

export const AssetChecklist = ({
  funnelType,
  offers,
  completedAssets,
  onToggleAsset,
  onReorderAssets,
}: AssetChecklistProps) => {
  const navigate = useNavigate();
  const { id: projectId } = useParams();
  const [expandedCategories, setExpandedCategories] = useState<Set<AssetCategory>>(
    new Set(['pages', 'emails', 'content', 'deliverables'])
  );

  const funnelConfig = FUNNEL_CONFIGS[funnelType];

  // Generate assets based on funnel config and configured offers
  const assets = useMemo(() => {
    if (!funnelConfig) return [];

    // Get all assets from funnel config
    const baseAssets = funnelConfig.assets;

    // Filter assets based on configured offers
    return baseAssets.filter(asset => {
      if (!asset.offerSlotType) return true; // Always include non-slot-specific assets
      
      // Include if there's a configured offer of this slot type
      return offers.some(offer => 
        offer.slotType === asset.offerSlotType && 
        (offer.isConfigured || offer.title)
      );
    });
  }, [funnelConfig, offers]);

  // Group assets by category
  const assetsByCategory = useMemo(() => {
    const grouped: Record<AssetCategory, AssetRequirement[]> = {
      pages: [],
      emails: [],
      content: [],
      deliverables: [],
    };

    assets.forEach(asset => {
      if (grouped[asset.category]) {
        grouped[asset.category].push(asset);
      }
    });

    return grouped;
  }, [assets]);

  const toggleCategory = (category: AssetCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const totalAssets = assets.length;
  const completedCount = assets.filter(a => completedAssets.has(a.id)).length;
  const progressPercent = totalAssets > 0 ? (completedCount / totalAssets) * 100 : 0;

  const handleNavigateToSection = (route: string) => {
    if (projectId) {
      navigate(`/projects/${projectId}/${route}`);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !onReorderAssets) return;
    
    const categoryId = result.source.droppableId as AssetCategory;
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    
    if (sourceIndex === destIndex) return;
    
    const categoryAssets = [...assetsByCategory[categoryId]];
    const [movedAsset] = categoryAssets.splice(sourceIndex, 1);
    categoryAssets.splice(destIndex, 0, movedAsset);
    
    onReorderAssets(categoryId, categoryAssets);
  };

  if (!funnelConfig) return null;

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-1">
              Asset Checklist
            </h2>
            <p className="text-muted-foreground text-sm">
              Track all the pages, emails, content, and deliverables you need to create.
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            {completedCount} / {totalAssets} complete
          </Badge>
        </div>

        <div className="space-y-2">
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {Math.round(progressPercent)}% complete
          </p>
        </div>
      </div>

      {/* Categories with Drag and Drop */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="space-y-3">
          {(Object.keys(assetsByCategory) as AssetCategory[]).map((category) => {
            const config = CATEGORY_CONFIG[category];
            const Icon = config.icon;
            const categoryAssets = assetsByCategory[category];
            const categoryCompleted = categoryAssets.filter(a => completedAssets.has(a.id)).length;
            const isExpanded = expandedCategories.has(category);

            if (categoryAssets.length === 0) return null;

            return (
              <div 
                key={category}
                className="border border-border rounded-xl overflow-hidden bg-card"
              >
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors"
                >
                  <Icon className={cn("w-5 h-5", config.color)} />
                  <span className="font-medium text-foreground flex-1 text-left">
                    {config.label}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {categoryCompleted}/{categoryAssets.length}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                {/* Category Items */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Droppable droppableId={category}>
                        {(provided) => (
                          <div 
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="border-t border-border"
                          >
                            {categoryAssets.map((asset, index) => {
                              const isCompleted = completedAssets.has(asset.id);
                              const relatedOffer = asset.offerSlotType 
                                ? offers.find(o => o.slotType === asset.offerSlotType)
                                : null;

                              return (
                                <Draggable key={asset.id} draggableId={asset.id} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={cn(
                                        "flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors",
                                        index !== categoryAssets.length - 1 && "border-b border-border",
                                        snapshot.isDragging && "bg-muted shadow-lg"
                                      )}
                                    >
                                      {/* Drag Handle */}
                                      <div
                                        {...provided.dragHandleProps}
                                        className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground"
                                      >
                                        <GripVertical className="w-4 h-4" />
                                      </div>

                                      {/* Completion Toggle */}
                                      <button
                                        onClick={() => onToggleAsset(asset.id)}
                                        className={cn(
                                          "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                                          isCompleted
                                            ? "bg-emerald-500 border-emerald-500"
                                            : "border-muted-foreground hover:border-primary"
                                        )}
                                      >
                                        {isCompleted && (
                                          <Check className="w-3 h-3 text-white" />
                                        )}
                                      </button>

                                      <div className="flex-1 min-w-0">
                                        <p className={cn(
                                          "text-sm font-medium",
                                          isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                                        )}>
                                          {asset.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                          {asset.description}
                                          {relatedOffer?.title && (
                                            <span className="ml-1 text-primary">
                                              • {relatedOffer.title}
                                            </span>
                                          )}
                                        </p>
                                      </div>

                                      {asset.linkedSection && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="shrink-0"
                                          onClick={() => handleNavigateToSection(asset.linkedSection!)}
                                        >
                                          <ArrowRight className="w-4 h-4" />
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </Draggable>
                              );
                            })}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};