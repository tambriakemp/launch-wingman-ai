import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Campaign, CampaignStatus } from "@/types/campaign";
import { goalLabels, statusColors } from "./campaignDemoData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, ArrowUpDown, ChevronLeft, ChevronRight, Pencil, Copy, Archive, Trash2, PlayCircle, PauseCircle, CheckCircle2, Megaphone } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  campaigns: Campaign[];
  onNewCampaign: () => void;
}

type SortKey = "name" | "status" | "leads" | "revenue" | "roi" | "start_date" | "updated_at";

export default function CampaignTable({ campaigns, onNewCampaign }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);
  const perPage = 10;

  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filtered = useMemo(() => {
    let list = campaigns;
    if (search) list = list.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== "all") list = list.filter((c) => c.status === statusFilter);
    list = [...list].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      if (typeof av === "number" && typeof bv === "number") return sortAsc ? av - bv : bv - av;
      return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return list;
  }, [campaigns, search, statusFilter, sortKey, sortAsc]);

  const paginated = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const isDbCampaign = (c: Campaign) => !!user?.id && isUuid(c.id);

  const handleEdit = (c: Campaign) => {
    navigate(`/marketing-hub/campaigns/${c.id}`);
  };

  const handleDuplicate = async (c: Campaign) => {
    if (!user?.id) return;
    if (!isUuid(c.id)) { toast.error("Demo campaigns cannot be duplicated"); return; }
    const { error } = await supabase.from("campaigns").insert({
      user_id: user.id,
      name: `${c.name} (Copy)`,
      goal: c.goal,
      status: "draft",
      start_date: c.start_date,
      end_date: c.end_date,
      budget: c.budget,
      tags: c.tags,
    });
    if (error) {
      toast.error("Failed to duplicate campaign");
      return;
    }
    toast.success("Campaign duplicated");
    queryClient.invalidateQueries({ queryKey: ["campaigns"] });
  };

  const handleArchive = async (c: Campaign) => {
    if (!user?.id) return;
    if (!isUuid(c.id)) { toast.error("Demo campaigns cannot be archived"); return; }
    const { error } = await supabase
      .from("campaigns")
      .update({ status: "ended" })
      .eq("id", c.id)
      .eq("user_id", user.id);
    if (error) {
      toast.error("Failed to archive campaign");
      return;
    }
    toast.success("Campaign archived");
    queryClient.invalidateQueries({ queryKey: ["campaigns"] });
  };

  const handleDelete = async () => {
    if (!deleteTarget || !user?.id) return;
    if (!isUuid(deleteTarget.id)) { toast.error("Demo campaigns cannot be deleted"); setDeleteTarget(null); return; }
    setIsDeleting(true);
    const { error } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", deleteTarget.id)
      .eq("user_id", user.id);
    setIsDeleting(false);
    if (error) {
      toast.error("Failed to delete campaign");
      return;
    }
    toast.success("Campaign deleted");
    setDeleteTarget(null);
    queryClient.invalidateQueries({ queryKey: ["campaigns"] });
  };

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => (
    <button onClick={() => toggleSort(k)} className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground uppercase tracking-wide">
      {label}
      <ArrowUpDown className="w-3 h-3" />
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">All Campaigns</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search campaigns..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-8 h-9" />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="evergreen">Evergreen</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={onNewCampaign}>+ New Campaign</Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-3"><SortHeader label="Name" k="name" /></th>
              <th className="text-left p-3"><SortHeader label="Status" k="status" /></th>
              <th className="text-left p-3 hidden md:table-cell"><span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Goal</span></th>
              <th className="text-left p-3 hidden lg:table-cell"><SortHeader label="Start" k="start_date" /></th>
              <th className="text-left p-3 hidden lg:table-cell"><span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">End</span></th>
              <th className="text-right p-3"><SortHeader label="Leads" k="leads" /></th>
              <th className="text-right p-3"><SortHeader label="Revenue" k="revenue" /></th>
              <th className="text-right p-3 hidden md:table-cell"><SortHeader label="ROI" k="roi" /></th>
              <th className="text-left p-3 hidden xl:table-cell"><SortHeader label="Updated" k="updated_at" /></th>
              <th className="w-10 p-3" />
            </tr>
          </thead>
          <tbody>
            {paginated.map((c) => (
              <tr key={c.id} className={cn("border-b transition-colors", isDbCampaign(c) ? "hover:bg-muted/20 cursor-pointer" : "opacity-70")} onClick={() => isDbCampaign(c) && navigate(`/marketing-hub/campaigns/${c.id}`)}>
                <td className="p-3 font-medium">
                  {c.name}
                  {!isDbCampaign(c) && <Badge variant="outline" className="ml-2 text-[10px] text-muted-foreground">Demo</Badge>}
                </td>
                <td className="p-3"><Badge className={cn("text-[11px] capitalize", statusColors[c.status])} variant="secondary">{c.status}</Badge></td>
                <td className="p-3 hidden md:table-cell text-muted-foreground">{goalLabels[c.goal]}</td>
                <td className="p-3 hidden lg:table-cell text-muted-foreground">{format(new Date(c.start_date), "MMM d, yyyy")}</td>
                <td className="p-3 hidden lg:table-cell text-muted-foreground">{c.end_date ? format(new Date(c.end_date), "MMM d, yyyy") : "—"}</td>
                <td className="p-3 text-right">{c.leads.toLocaleString()}</td>
                <td className="p-3 text-right">${c.revenue.toLocaleString()}</td>
                <td className="p-3 text-right hidden md:table-cell">{c.roi > 0 ? c.roi + "%" : "—"}</td>
                <td className="p-3 hidden xl:table-cell text-muted-foreground">{format(new Date(c.updated_at), "MMM d")}</td>
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  {isDbCampaign(c) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(c)}>
                          <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(c)}>
                          <Copy className="w-3.5 h-3.5 mr-2" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleArchive(c)}>
                          <Archive className="w-3.5 h-3.5 mr-2" /> Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(c)}>
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{filtered.length} campaigns</p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-xs text-muted-foreground px-2">{page + 1} / {totalPages}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}

      <DeleteConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title="Delete Campaign"
        description={`This will permanently delete "${deleteTarget?.name}" and all associated data. This action cannot be undone.`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
