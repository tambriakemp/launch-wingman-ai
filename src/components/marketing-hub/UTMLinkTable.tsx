import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface UTMLink {
  id: string;
  label: string;
  full_url: string;
  short_code: string;
  click_count: number;
  created_at: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
}

interface UTMLinkTableProps {
  links: UTMLink[];
  onDelete: (id: string) => void;
  publishedUrl: string;
}

export const UTMLinkTable = ({ links, onDelete, publishedUrl }: UTMLinkTableProps) => {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard.` });
  };

  const getShortUrl = (shortCode: string) => `${publishedUrl}/r/${shortCode}`;

  if (links.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No saved links yet. Create one above to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Label</th>
            <th className="text-left py-2 px-3 font-medium text-muted-foreground hidden md:table-cell">Source / Medium</th>
            <th className="text-left py-2 px-3 font-medium text-muted-foreground hidden lg:table-cell">Campaign</th>
            <th className="text-center py-2 px-3 font-medium text-muted-foreground">Clicks</th>
            <th className="text-left py-2 px-3 font-medium text-muted-foreground hidden md:table-cell">Created</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {links.map((link) => (
            <tr key={link.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
              <td className="py-2.5 px-3">
                <p className="font-medium text-foreground">{link.label}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{link.full_url}</p>
              </td>
              <td className="py-2.5 px-3 hidden md:table-cell text-muted-foreground">
                {link.utm_source} / {link.utm_medium}
              </td>
              <td className="py-2.5 px-3 hidden lg:table-cell text-muted-foreground">{link.utm_campaign}</td>
              <td className="py-2.5 px-3 text-center font-semibold text-foreground">{link.click_count}</td>
              <td className="py-2.5 px-3 hidden md:table-cell text-muted-foreground">
                {format(new Date(link.created_at), "MMM d, yyyy")}
              </td>
              <td className="py-2.5 px-3">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Copy full URL"
                    onClick={() => copyToClipboard(link.full_url, "Full URL")}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="Copy short link"
                    onClick={() => copyToClipboard(getShortUrl(link.short_code), "Short link")}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    title="Delete"
                    onClick={() => onDelete(link.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
