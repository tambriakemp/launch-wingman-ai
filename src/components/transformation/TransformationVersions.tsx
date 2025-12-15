import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Copy, Check, Star, Pencil, X } from "lucide-react";
import { toast } from "sonner";

export interface TransformationVersionsData {
  one_liner: string;
  standard: string;
  expanded: string;
}

interface TransformationVersionsProps {
  versions: TransformationVersionsData | null;
  primaryVersion: 'one_liner' | 'standard' | 'expanded';
  onSelectPrimary: (version: 'one_liner' | 'standard' | 'expanded') => void;
  onEditVersion: (version: 'one_liner' | 'standard' | 'expanded', text: string) => void;
  isLocked: boolean;
}

const VERSION_CONFIG = {
  one_liner: {
    label: 'One-Liner',
    description: 'Bios & hooks',
  },
  standard: {
    label: 'Standard',
    description: 'Sales pages',
  },
  expanded: {
    label: 'Expanded',
    description: 'About sections',
  },
};

export const TransformationVersions = ({
  versions,
  primaryVersion,
  onSelectPrimary,
  onEditVersion,
  isLocked,
}: TransformationVersionsProps) => {
  const [editingVersion, setEditingVersion] = useState<'one_liner' | 'standard' | 'expanded' | null>(null);
  const [editText, setEditText] = useState('');

  if (!versions) return null;

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  const handleStartEdit = (version: 'one_liner' | 'standard' | 'expanded') => {
    setEditingVersion(version);
    setEditText(versions[version]);
  };

  const handleSaveEdit = () => {
    if (editingVersion) {
      onEditVersion(editingVersion, editText);
      setEditingVersion(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingVersion(null);
    setEditText('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {(Object.keys(VERSION_CONFIG) as Array<keyof typeof VERSION_CONFIG>).map((key) => {
        const config = VERSION_CONFIG[key];
        const text = versions[key];
        const isPrimary = primaryVersion === key;
        const isEditing = editingVersion === key;

        return (
          <Card
            key={key}
            className={cn(
              "transition-all cursor-pointer group",
              isPrimary ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-primary/30"
            )}
            onClick={() => !isLocked && !isEditing && onSelectPrimary(key)}
          >
            <CardContent className="p-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  {isPrimary && <Star className="w-3.5 h-3.5 text-primary fill-primary" />}
                  <span className="font-medium text-xs">{config.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleCopy(text); }}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  {!isLocked && !isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleStartEdit(key); }}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-[10px] text-muted-foreground mb-2">{config.description}</p>

              {/* Content */}
              {isEditing ? (
                <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={4}
                    className="bg-background text-xs"
                  />
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-7 px-2 text-xs">
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveEdit} className="h-7 px-2 text-xs">
                      <Check className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-foreground leading-relaxed line-clamp-4">
                  "{text}"
                </p>
              )}

              {/* Primary Badge */}
              {isPrimary && !isEditing && (
                <Badge className="mt-2 bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0">
                  Primary
                </Badge>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};