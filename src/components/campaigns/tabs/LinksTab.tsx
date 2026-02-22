import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Copy, ExternalLink, MoreHorizontal, Pause, Archive, Search, Plus, Link2, Sparkles, Loader2,
  MousePointerClick, Calendar, FolderOpen, FolderInput, Trash2, X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import AddUTMLinkModal from "../links/AddUTMLinkModal";

import AutoGeneratePanel from "../links/AutoGeneratePanel";
import { CHANNELS } from "../links/utmHelpers";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  campaignId: string;
  campaignName: string;
}

const PAGE_SIZE = 10;

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  archived: "bg-muted text-muted-foreground",
};

export default function LinksTab({ campaignId, campaignName }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [showAutoGen, setShowAutoGen] = useState(false);
  const [page, setPage] = useState(0);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const { data: links, isLoading } = useQuery({
    queryKey: ["campaign-utm-links", campaignId],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("utm_links")
        .select("*")
        .eq("campaign_id", campaignId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  // Fetch folders
  const { data: folders = [] } = useQuery({
    queryKey: ["utm-folders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("utm_folders").select("*").eq("user_id", user!.id).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("utm_folders").insert({ user_id: user!.id, name });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["utm-folders"] });
      toast.success("Folder created");
    },
  });

  const filtered = (links ?? []).filter((l: any) => {
    if (search) {
      const q = search.toLowerCase();
      if (![l.label, l.utm_campaign, l.utm_source, l.utm_medium, l.full_url]
        .some((field: string) => field?.toLowerCase().includes(q))) return false;
    }
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (selectedFolderId && l.folder_id !== selectedFolderId) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedLinks = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  if (safePage !== page) setPage(safePage);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("utm_links").update({ status }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(`Link ${status}`);
    queryClient.invalidateQueries({ queryKey: ["campaign-utm-links", campaignId] });
  };

  const duplicateLink = async (link: any) => {
    if (!user?.id) return;
    const shortCode = Math.random().toString(36).slice(2, 10);
    const newContent = link.utm_content ? `${link.utm_content}-copy` : "copy";
    const { error } = await supabase.from("utm_links").insert({
      user_id: user.id,
      campaign_id: campaignId,
      label: `${link.label} (Copy)`,
      base_url: link.base_url,
      full_url: link.full_url,
      utm_source: link.utm_source,
      utm_medium: link.utm_medium,
      utm_campaign: link.utm_campaign,
      utm_content: newContent,
      utm_term: link.utm_term,
      short_code: shortCode,
      channel: link.channel ?? "other",
      status: "active",
    });
    if (error) { toast.error("Failed to duplicate"); return; }
    toast.success("Link duplicated");
    queryClient.invalidateQueries({ queryKey: ["campaign-utm-links", campaignId] });
  };

  const moveToFolder = async (linkId: string, folderId: string | null) => {
    const { error } = await supabase.from("utm_links").update({ folder_id: folderId }).eq("id", linkId);
    if (error) { toast.error("Failed to move"); return; }
    toast.success("Link moved");
    queryClient.invalidateQueries({ queryKey: ["campaign-utm-links", campaignId] });
  };

  const deleteLink = async (id: string) => {
    const { error } = await supabase.from("utm_links").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Link deleted");
    queryClient.invalidateQueries({ queryKey: ["campaign-utm-links", campaignId] });
  };

  const getShortUrl = (shortCode: string) => `https://launchely.com/r/${shortCode}`;

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    createFolderMutation.mutate(newFolderName.trim());
    setNewFolderName("");
    setCreatingFolder(false);
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add UTM Link
          </Button>
          <Button
            variant={showAutoGen ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowAutoGen(!showAutoGen)}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Auto-Generate
          </Button>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Search links..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-8 h-8 text-xs" />
          </div>
          {/* Status dropdown */}
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="h-8 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["all", "active", "paused", "archived"].map((s) => (
                <SelectItem key={s} value={s} className="capitalize text-xs">{s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Folder dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                <FolderOpen className="w-3.5 h-3.5" />
                {selectedFolderId ? folders.find((f) => f.id === selectedFolderId)?.name || "Folder" : "All Folders"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => { setSelectedFolderId(null); setPage(0); }} className={!selectedFolderId ? "font-semibold" : ""}>
                All Folders
              </DropdownMenuItem>
              {folders.map((f) => (
                <DropdownMenuItem key={f.id} onClick={() => { setSelectedFolderId(f.id); setPage(0); }} className={selectedFolderId === f.id ? "font-semibold" : ""}>
                  {f.name}
                </DropdownMenuItem>
              ))}
              <div className="border-t my-1" />
              {creatingFolder ? (
                <div className="px-2 py-1.5 flex gap-1">
                  <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name"
                    className="h-7 text-xs"
                    onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); e.stopPropagation(); }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button size="sm" className="h-7 px-2 text-xs" onClick={(e) => { e.stopPropagation(); handleCreateFolder(); }}>Add</Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 px-0" onClick={(e) => { e.stopPropagation(); setCreatingFolder(false); }}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <DropdownMenuItem onClick={() => setCreatingFolder(true)}>
                  <Plus className="w-3.5 h-3.5 mr-2" /> New Folder
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Auto-Generate Panel */}
      {showAutoGen && <AutoGeneratePanel campaignId={campaignId} campaignName={campaignName} />}

      {/* Links - UTM Builder style cards */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed rounded-lg py-12 text-center">
          <p className="text-sm text-muted-foreground">No UTM links yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Create or attach tracking links to measure this campaign's performance.</p>
          <Button size="sm" className="mt-4" onClick={() => setShowAddModal(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Create First Link
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {pagedLinks.map((link: any) => (
              <Card key={link.id} className="p-4 space-y-3">
                {/* Title row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{link.label}</p>
                    <p className="text-xs text-muted-foreground">{link.utm_campaign}</p>
                  </div>
                   <div className="flex items-center gap-2 shrink-0">
                    <Badge className={`text-[10px] capitalize ${statusColors[link.status] ?? ""}`} variant="secondary">
                      {link.status}
                    </Badge>
                    <Badge className="text-[10px] bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-transparent">
                      {link.utm_source || "unknown"}
                    </Badge>
                  </div>
                </div>

                {/* Full URL block */}
                <div
                  className="rounded-md border bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground break-all cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => { navigator.clipboard.writeText(link.full_url); toast.success("Full URL copied!"); }}
                  title="Click to copy"
                >
                  {link.full_url}
                </div>

                {/* Short link */}
                {link.short_code && (
                  <div
                    className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs text-primary cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => { navigator.clipboard.writeText(getShortUrl(link.short_code)); toast.success("Short link copied!"); }}
                    title="Click to copy — this link tracks clicks"
                  >
                    <Link2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-medium">Share:</span>
                    <span className="truncate">{getShortUrl(link.short_code)}</span>
                    <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0 h-4 border-primary/30 text-primary">Tracked</Badge>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MousePointerClick className="w-3.5 h-3.5" />
                      {(link.click_count ?? 0)} clicks
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(link.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {folders.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Move to folder">
                            <FolderInput className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => moveToFolder(link.id, null)}>No folder</DropdownMenuItem>
                          {folders.map((folder) => (
                            <DropdownMenuItem
                              key={folder.id}
                              onClick={() => moveToFolder(link.id, folder.id)}
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(link.full_url); toast.success("URL copied"); }}>
                          <Copy className="w-3.5 h-3.5 mr-2" /> Copy URL
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicateLink(link)}>Duplicate</DropdownMenuItem>
                        {link.status === "active" && (
                          <DropdownMenuItem onClick={() => updateStatus(link.id, "paused")}>
                            <Pause className="w-3.5 h-3.5 mr-2" /> Pause
                          </DropdownMenuItem>
                        )}
                        {link.status === "paused" && (
                          <DropdownMenuItem onClick={() => updateStatus(link.id, "active")}>Resume</DropdownMenuItem>
                        )}
                        {link.status !== "archived" && (
                          <DropdownMenuItem onClick={() => updateStatus(link.id, "archived")}>
                            <Archive className="w-3.5 h-3.5 mr-2" /> Archive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => deleteLink(link.id)} className="text-destructive">
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
              <p className="text-xs text-muted-foreground">
                Showing {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
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

      <AddUTMLinkModal open={showAddModal} onOpenChange={setShowAddModal} campaignId={campaignId} campaignName={campaignName} />
      
    </div>
  );
}
