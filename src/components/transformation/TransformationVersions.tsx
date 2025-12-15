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
    description: 'For bios & hooks',
    copyLabel: 'Copy for bio',
  },
  standard: {
    label: 'Standard',
    description: 'For sales pages',
    copyLabel: 'Copy for sales page',
  },
  expanded: {
    label: 'Expanded',
    description: 'For about sections',
    copyLabel: 'Copy for about',
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

  const handleCopy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
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
    <div className="space-y-3">
      {(Object.keys(VERSION_CONFIG) as Array<keyof typeof VERSION_CONFIG>).map((key) => {
        const config = VERSION_CONFIG[key];
        const text = versions[key];
        const isPrimary = primaryVersion === key;
        const isEditing = editingVersion === key;

        return (
          <Card
            key={key}
            className={cn(
              "transition-all",
              isPrimary ? "border-primary bg-primary/5" : "border-border"
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{config.label}</span>
                  <span className="text-xs text-muted-foreground">({config.description})</span>
                  {isPrimary && (
                    <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                      <Star className="w-3 h-3 mr-1" />
                      Primary
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(text, config.copyLabel)}
                    className="h-7 px-2"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  {!isLocked && !isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit(key)}
                      className="h-7 px-2"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={key === 'one_liner' ? 2 : key === 'standard' ? 3 : 4}
                    className="bg-background text-sm"
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                      <X className="w-3.5 h-3.5 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveEdit}>
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-foreground leading-relaxed">
                    "{text}"
                  </p>
                  {!isPrimary && !isLocked && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectPrimary(key)}
                      className="mt-3 text-xs"
                    >
                      <Star className="w-3 h-3 mr-1" />
                      Use as Primary
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
