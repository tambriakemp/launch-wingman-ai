import { Campaign } from "@/types/campaign";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Code, Image as ImageIcon, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  campaign: Campaign;
}

export default function PixelTab({ campaign }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/campaign-pixel`;

  const snippets = [
    {
      id: "img",
      title: "Image Pixel",
      description: "Place this on your thank-you or confirmation page. Works everywhere — no JavaScript needed.",
      icon: ImageIcon,
      code: `<img src="${baseUrl}?c=${campaign.id}" width="1" height="1" style="display:none" alt="" />`,
    },
    {
      id: "js",
      title: "JavaScript Pixel",
      description: "Use this to also track revenue. Replace AMOUNT with the purchase value.",
      icon: Code,
      code: `<script>\nfetch("${baseUrl}?c=${campaign.id}&revenue=AMOUNT")\n</script>`,
    },
    {
      id: "js-utm",
      title: "JavaScript with UTM Passthrough",
      description: "Auto-captures UTM params from the current page URL and forwards them to the pixel.",
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
      <div>
        <h3 className="text-sm font-semibold mb-1">Conversion Tracking Pixel</h3>
        <p className="text-xs text-muted-foreground">
          Add one of these snippets to your thank-you or confirmation page. Every time someone loads that page, it counts as a lead for this campaign.
        </p>
      </div>

      <div className="space-y-4">
        {snippets.map((s) => (
          <Card key={s.id} className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <s.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </div>
              </div>
              <Button
                variant="outline"
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
