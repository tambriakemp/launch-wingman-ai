import { Campaign } from "@/types/campaign";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Code, Image as ImageIcon, Zap, Star, Info } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  campaign: Campaign;
}

export default function PixelTab({ campaign }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/campaign-pixel`;

  const snippets = [
    {
      id: "js",
      title: "JavaScript Pixel",
      recommended: true,
      bestFor: "Most users — tracks leads + revenue",
      description: "Paste this on your thank-you page. Replace AMOUNT with your purchase value (e.g. 49.99). If you don't need revenue tracking, just remove the &revenue=AMOUNT part.",
      icon: Code,
      code: `<script>\nfetch("${baseUrl}?c=${campaign.id}&revenue=AMOUNT")\n</script>`,
    },
    {
      id: "img",
      title: "Image Pixel",
      recommended: false,
      bestFor: "Simple lead counting only — no revenue",
      description: "A tiny invisible image. Works on any platform, even those that don't allow JavaScript. Only counts leads — it can't track revenue.",
      icon: ImageIcon,
      code: `<img src="${baseUrl}?c=${campaign.id}" width="1" height="1" style="display:none" alt="" />`,
    },
    {
      id: "js-utm",
      title: "JavaScript + UTM Passthrough",
      recommended: false,
      bestFor: "Advanced — tracks revenue & preserves UTM attribution",
      description: "Automatically captures UTM parameters from the current page URL and passes them along. Use this if you want to see which traffic source drove each conversion.",
      icon: Zap,
      code: `<script>\nconst p = new URLSearchParams(location.search);\nconst u = new URL("${baseUrl}");\nu.searchParams.set("c", "${campaign.id}");\n["utm_source","utm_medium","utm_campaign"].forEach(k => { if(p.get(k)) u.searchParams.set(k, p.get(k)) });\nconst rev = /* your revenue variable */ 0;\nif(rev) u.searchParams.set("revenue", rev);\nfetch(u);\n</script>`,
    },
  ];

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold mb-1">Conversion Tracking Pixel</h3>
        <p className="text-xs text-muted-foreground">
          Pick <strong>one</strong> of the snippets below and paste it on your thank-you or confirmation page. Each time someone loads that page, it's recorded as a conversion for this campaign.
        </p>
      </div>

      {/* Which should I use? helper */}
      <Card className="p-4 bg-accent/30 border-accent/50">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-3.5 h-3.5 text-accent-foreground" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Which pixel should I use?</p>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li className="flex items-start gap-1.5">
                <Star className="w-3 h-3 text-primary shrink-0 mt-0.5 fill-primary" />
                <span><strong>JavaScript Pixel</strong> — Best for most users. Tracks leads and revenue with a single line of code.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <ImageIcon className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
                <span><strong>Image Pixel</strong> — Use this only if your platform doesn't allow JavaScript (e.g. some email providers). Tracks leads but not revenue.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Zap className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
                <span><strong>JS + UTM Passthrough</strong> — For advanced users who want to track which traffic source drove each sale. Requires UTM links.</span>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground/80 italic">You only need one pixel per page — don't combine them.</p>
          </div>
        </div>
      </Card>

      {/* Pixel snippets */}
      <div className="space-y-4">
        {snippets.map((s) => (
          <Card
            key={s.id}
            className={cn(
              "p-4 relative",
              s.recommended && "ring-2 ring-primary/40 border-primary/30"
            )}
          >
            {s.recommended && (
              <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-current" />
                Recommended
              </div>
            )}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                  s.recommended ? "bg-primary/10" : "bg-muted"
                )}>
                  <s.icon className={cn(
                    "w-4 h-4",
                    s.recommended ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <div>
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-[11px] font-medium text-primary/70 mb-0.5">{s.bestFor}</p>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </div>
              </div>
              <Button
                variant={s.recommended ? "default" : "outline"}
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={() => handleCopy(s.code, s.id)}
              >
                {copiedId === s.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedId === s.id ? "Copied" : "Copy"}
              </Button>
            </div>
            <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto font-mono text-foreground/80">
              {s.code}
            </pre>
          </Card>
        ))}
      </div>

      {/* How it works */}
      <Card className="p-4 border-dashed">
        <p className="text-xs text-muted-foreground">
          <strong>How it works:</strong> When someone visits your thank-you page, the pixel fires a request to Launchely's tracking endpoint. 
          The visit is recorded as a conversion for this campaign. If you include a <code className="bg-muted px-1 rounded">revenue</code> value, 
          it's tracked alongside the lead. All data appears in your Summary and Analytics tabs in real time.
        </p>
      </Card>
    </div>
  );
}
