import { Copy, Check, Pencil } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BrowserFrame } from "@/components/landing/BrowserFrame";
import type { SalesCopySection, SectionDraft } from "./types";

interface SalesPagePreviewProps {
  sections: SalesCopySection[];
  drafts: Record<string, SectionDraft>;
  offerTitle: string;
  onEditSection?: (section: SalesCopySection) => void;
}

export const SalesPagePreview = ({ 
  sections, 
  drafts, 
  offerTitle,
  onEditSection 
}: SalesPagePreviewProps) => {
  const [copied, setCopied] = useState(false);

  const draftedSections = sections.filter(s => drafts[s.id]?.status === 'drafted');
  const progress = `${draftedSections.length}/${sections.length}`;

  const assembleCopy = (): string => {
    return sections
      .filter(s => drafts[s.id]?.status === 'drafted' && drafts[s.id]?.content)
      .map(s => {
        const content = drafts[s.id]?.content || '';
        return `## ${s.label}\n\n${content}`;
      })
      .join('\n\n---\n\n');
  };

  const handleCopyAll = async () => {
    const fullCopy = assembleCopy();
    if (!fullCopy) return;
    
    await navigator.clipboard.writeText(fullCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSectionContent = (section: SalesCopySection) => {
    const draft = drafts[section.id];
    if (draft?.status === 'drafted' && draft.content) {
      return { type: 'drafted' as const, content: draft.content };
    }
    if (draft?.status === 'skipped') {
      return { type: 'skipped' as const, content: null };
    }
    return { type: 'empty' as const, content: null };
  };

  // Determine section styling based on its type
  const isHeadlineSection = (sectionId: string) => 
    ['opening-headline', 'introduce-offer'].includes(sectionId);
  
  const isCtaSection = (sectionId: string) => 
    ['final-cta', 'the-investment'].includes(sectionId);

  return (
    <div className="space-y-4">
      {/* Header with progress and copy button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-normal">
            {progress} sections drafted
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyAll}
          disabled={draftedSections.length === 0}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-1" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-1" />
              Copy All Text
            </>
          )}
        </Button>
      </div>

      {/* Browser frame preview */}
      <BrowserFrame>
        <div className="bg-background min-h-[400px] max-h-[60vh] overflow-y-auto">
          {/* Page header */}
          <div className="bg-muted/30 border-b px-6 py-4">
            <p className="text-xs text-muted-foreground text-center uppercase tracking-wider">
              Sales Page Preview
            </p>
            <h1 className="text-lg font-semibold text-center mt-1">
              {offerTitle}
            </h1>
          </div>

          {/* Sections */}
          <div className="divide-y">
            {sections.map((section) => {
              const { type, content } = getSectionContent(section);
              const isHeadline = isHeadlineSection(section.id);
              const isCta = isCtaSection(section.id);

              return (
                <div 
                  key={section.id}
                  className={cn(
                    "px-6 py-6 transition-colors group relative",
                    type === 'empty' && "bg-muted/20",
                    type === 'skipped' && "bg-muted/10",
                    onEditSection && "cursor-pointer hover:bg-muted/30"
                  )}
                  onClick={() => onEditSection?.(section)}
                >
                  {/* Section label */}
                  <div className="flex items-center gap-2 mb-3">
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-xs font-normal",
                        type === 'drafted' && "bg-primary/10 text-primary",
                        type === 'skipped' && "bg-muted text-muted-foreground",
                        type === 'empty' && "bg-muted text-muted-foreground"
                      )}
                    >
                      {section.label}
                    </Badge>
                    {type === 'skipped' && (
                      <span className="text-xs text-muted-foreground italic">Skipped</span>
                    )}
                    {onEditSection && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto h-7 text-xs"
                      >
                        <Pencil className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>

                  {/* Section content */}
                  {type === 'drafted' && content ? (
                    <div className={cn(
                      "prose prose-sm max-w-none",
                      isHeadline && "text-center",
                      isCta && "text-center"
                    )}>
                      {isHeadline ? (
                        <h2 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                          {content}
                        </h2>
                      ) : isCta ? (
                        <div className="space-y-3">
                          <p className="text-foreground whitespace-pre-wrap">{content}</p>
                          <div className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium">
                            Get Started →
                          </div>
                        </div>
                      ) : (
                        <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                          {content}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className={cn(
                      "border-2 border-dashed rounded-md p-4",
                      type === 'skipped' 
                        ? "border-muted-foreground/20 bg-muted/10" 
                        : "border-muted-foreground/30"
                    )}>
                      <p className="text-sm text-muted-foreground text-center">
                        {type === 'skipped' 
                          ? "This section was skipped" 
                          : `Write your ${section.label.toLowerCase()} section`}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="bg-muted/30 border-t px-6 py-4 text-center">
            <p className="text-xs text-muted-foreground">
              Preview only — your final page design may vary
            </p>
          </div>
        </div>
      </BrowserFrame>
    </div>
  );
};
