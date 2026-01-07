import { useState } from "react";
import { useAllTickets, SupportTicket } from "@/hooks/useSupportTickets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TicketDetailSheet } from "./TicketDetailSheet";
import { 
  Search, 
  Loader2, 
  Inbox, 
  Clock,
  AlertCircle,
  CheckCircle2,
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";

function getStatusBadge(status: SupportTicket['status']) {
  const config = {
    open: { label: "Open", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
    in_progress: { label: "In Progress", className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300" },
    awaiting_user: { label: "Awaiting User", className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
    awaiting_agent: { label: "Awaiting Agent", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
    resolved: { label: "Resolved", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  };
  const { label, className } = config[status];
  return <Badge className={className}>{label}</Badge>;
}

function getPriorityBadge(priority: string) {
  const config: Record<string, { label: string; className: string }> = {
    low: { label: "Low", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
    normal: { label: "Normal", className: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
    high: { label: "High", className: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400" },
  };
  const { label, className } = config[priority] || config.normal;
  return <Badge variant="outline" className={className}>{label}</Badge>;
}

export function SupportTicketsTab() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const { data: tickets, isLoading } = useAllTickets({
    status: statusFilter,
    priority: priorityFilter,
    search: search || undefined,
  });

  // Stats
  const openCount = tickets?.filter(t => t.status === "open").length || 0;
  const inProgressCount = tickets?.filter(t => ["in_progress", "awaiting_user", "awaiting_agent"].includes(t.status)).length || 0;
  const highPriorityCount = tickets?.filter(t => t.priority === "high" && t.status !== "resolved").length || 0;
  const resolvedCount = tickets?.filter(t => t.status === "resolved").length || 0;

  const selectedTicket = tickets?.find(t => t.id === selectedTicketId);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                <Inbox className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{openCount}</p>
                <p className="text-xs text-muted-foreground">Open</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressCount}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{highPriorityCount}</p>
                <p className="text-xs text-muted-foreground">High Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resolvedCount}</p>
                <p className="text-xs text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Support Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by subject or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="awaiting_user">Awaiting User</SelectItem>
                <SelectItem value="awaiting_agent">Awaiting Agent</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ticket List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : tickets && tickets.length > 0 ? (
            <div className="space-y-2">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                    </div>
                    <p className="font-medium truncate">{ticket.subject}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                      <span>{ticket.user_email}</span>
                      <span>•</span>
                      <span>{format(new Date(ticket.created_at), "MMM d, yyyy h:mm a")}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="sm:flex-shrink-0">
                    View
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No tickets found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Sheet */}
      <TicketDetailSheet
        ticket={selectedTicket || null}
        open={!!selectedTicketId}
        onOpenChange={(open) => !open && setSelectedTicketId(null)}
      />
    </div>
  );
}
