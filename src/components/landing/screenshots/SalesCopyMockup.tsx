import { FileText, Sparkles, Check, ChevronRight } from "lucide-react";
import { BrowserFrame } from "../BrowserFrame";

export const SalesCopyMockup = () => {
  return (
    <BrowserFrame>
      <div className="p-6 min-h-[380px]">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-1">Sales Copy Builder</h3>
          <p className="text-sm text-muted-foreground">AI-powered copy for every page in your funnel</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-4 bg-muted/50 rounded-lg p-3">
          <span className="text-sm font-medium text-foreground">Progress</span>
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full" style={{ width: '66%' }} />
            </div>
            <span className="text-sm text-muted-foreground">66% Complete</span>
          </div>
        </div>

        {/* Pages List */}
        <div className="space-y-2">
          {[
            { name: "Opt-in Page", status: "complete", sections: "5/5" },
            { name: "Sales Page", status: "in-progress", sections: "3/8" },
            { name: "Thank You Page", status: "pending", sections: "0/3" },
            { name: "Upsell Page", status: "pending", sections: "0/4" },
          ].map((page, i) => (
            <div 
              key={i}
              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                page.status === 'complete' 
                  ? 'border-green-500/50 bg-green-500/5' 
                  : page.status === 'in-progress'
                  ? 'border-accent bg-accent/5'
                  : 'border-border bg-card hover:border-accent/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  page.status === 'complete' 
                    ? 'bg-green-500' 
                    : page.status === 'in-progress'
                    ? 'bg-accent'
                    : 'bg-muted'
                }`}>
                  {page.status === 'complete' ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <FileText className={`w-3 h-3 ${page.status === 'in-progress' ? 'text-accent-foreground' : 'text-muted-foreground'}`} />
                  )}
                </div>
                <div>
                  <div className="font-medium text-foreground">{page.name}</div>
                  <div className="text-xs text-muted-foreground">{page.sections} sections</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {page.status === 'in-progress' && (
                  <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">In Progress</span>
                )}
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>

        {/* AI Generate Button */}
        <div className="mt-4 flex justify-center">
          <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-lg text-sm font-medium cursor-pointer">
            <Sparkles className="w-4 h-4" />
            Generate All Copy with AI
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
};
