import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExternalLink, Trash2, ChevronLeft, ChevronRight, Search, MousePointerClick, Calendar, Link2, FolderInput } from "lucide-react";
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
  folder_id?: string | null;
}

interface Folder {
  id: string;
  name: string;
}

interface UTMLinkTableProps {
  links: UTMLink[];
  folders?: Folder[];
  onDelete: (id: string) => void;
  onMoveToFolder?: (linkId: string, folderId: string | null) => void;
  publishedUrl: string;
}

const PAGE_SIZE = 10;

export const UTMLinkTable = ({ links, folders = [], onDelete, onMoveToFolder, publishedUrl }: UTMLinkTableProps) => {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLinks = links.filter((l) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return [l.label, l.utm_campaign, l.utm_source, l.utm_medium, l.full_url]
      .some((field) => field?.toLowerCase().includes(q));
  });

  const totalPages = Math.max(1, Math.ceil(filteredLinks.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedLinks = filteredLinks.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  if (safePage !== page) setPage(safePage);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard.` });
  };

  const getShortUrl = (shortCode: string) => `https://launchely.com/r/${shortCode}`;

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(0);
  };

  if (links.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No saved links yet. Create one above to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by label, campaign, source, medium, or URL…"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredLinks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No links match your search.
        </div>
      ) : (
        <>
          {/* Cards */}
          <div className="space-y-3">
            {pagedLinks.map((link) => (
              <Card key={link.id} className="p-4 space-y-3">
                {/* Title row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{link.label}</p>
                    <p className="text-xs text-muted-foreground">{link.utm_campaign}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {link.utm_campaign}
                  </Badge>
                </div>

                {/* Full URL block */}
                <div
                  className="rounded-md border bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground break-all cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => copyToClipboard(link.full_url, "Full URL")}
                  title="Click to copy"
                >
                  {link.full_url}
                </div>

                {/* Short link */}
                <div
                  className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs text-primary cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => copyToClipboard(getShortUrl(link.short_code), "Short link")}
                  title="Click to copy"
                >
                  <Link2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-medium text-muted-foreground">Short:</span>
                  <span className="truncate">/r/{link.short_code}</span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MousePointerClick className="w-3.5 h-3.5" />
                      {link.click_count} clicks
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(link.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {onMoveToFolder && folders.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Move to folder">
                            <FolderInput className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onMoveToFolder(link.id, null)}>
                            No folder
                          </DropdownMenuItem>
                          {folders.map((folder) => (
                            <DropdownMenuItem
                              key={folder.id}
                              onClick={() => onMoveToFolder(link.id, folder.id)}
                              className={link.folder_id === folder.id ? "font-semibold" : ""}
                            >
                              {folder.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Open link" onClick={() => window.open(link.full_url, "_blank")}>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Delete" onClick={() => onDelete(link.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
              <p className="text-xs text-muted-foreground">
                Showing {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, filteredLinks.length)} of {filteredLinks.length}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <Button
                    key={i}
                    variant={i === safePage ? "default" : "ghost"}
                    size="icon"
                    className="h-7 w-7 text-xs"
                    onClick={() => setPage(i)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={safePage === totalPages - 1} onClick={() => setPage(safePage + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
