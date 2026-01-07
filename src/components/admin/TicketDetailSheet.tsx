import { useState } from "react";
import { 
  useTicketMessages, 
  useAddAgentMessage, 
  useUpdateTicketStatus, 
  useUpdateTicketPriority,
  SupportTicket 
} from "@/hooks/useSupportTickets";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Loader2,
  User,
  Headphones,
  Clock,
  CheckCircle2,
  Mail
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TicketDetailSheetProps {
  ticket: SupportTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

export function TicketDetailSheet({ ticket, open, onOpenChange }: TicketDetailSheetProps) {
  const { data: messages, isLoading: messagesLoading } = useTicketMessages(ticket?.id);
  const addAgentMessage = useAddAgentMessage();
  const updateStatus = useUpdateTicketStatus();
  const updatePriority = useUpdateTicketPriority();

  const [reply, setReply] = useState("");

  const handleSendReply = async () => {
    if (!reply.trim() || !ticket) return;

    await addAgentMessage.mutateAsync({
      ticketId: ticket.id,
      message: reply,
      userEmail: ticket.user_email,
    });
    setReply("");
  };

  const handleStatusChange = async (status: string) => {
    if (!ticket) return;
    await updateStatus.mutateAsync({ ticketId: ticket.id, status });
  };

  const handlePriorityChange = async (priority: string) => {
    if (!ticket) return;
    await updatePriority.mutateAsync({ ticketId: ticket.id, priority });
  };

  const handleResolve = async () => {
    if (!ticket) return;
    await updateStatus.mutateAsync({ ticketId: ticket.id, status: "resolved" });
  };

  if (!ticket) return null;

  const isResolved = ticket.status === "resolved";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl flex flex-col h-full p-0">
        <SheetHeader className="p-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg font-semibold truncate pr-4">
                {ticket.subject}
              </SheetTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {getStatusBadge(ticket.status)}
                <span className="text-xs text-muted-foreground">
                  #{ticket.id.slice(0, 8)}
                </span>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Ticket Info */}
        <div className="px-6 py-4 border-b bg-muted/30 flex-shrink-0">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">From</p>
              <div className="flex items-center gap-2">
                <Mail className="w-3 h-3 text-muted-foreground" />
                <span className="font-medium truncate">{ticket.user_email}</span>
              </div>
              {ticket.user_name && (
                <p className="text-muted-foreground text-xs mt-0.5">{ticket.user_name}</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Created</p>
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span>{format(new Date(ticket.created_at), "MMM d, yyyy")}</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="flex-1 min-w-[120px]">
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <Select 
                value={ticket.status} 
                onValueChange={handleStatusChange}
                disabled={updateStatus.isPending}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="awaiting_user">Awaiting User</SelectItem>
                  <SelectItem value="awaiting_agent">Awaiting Agent</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[100px]">
              <p className="text-xs text-muted-foreground mb-1">Priority</p>
              <Select 
                value={ticket.priority} 
                onValueChange={handlePriorityChange}
                disabled={updatePriority.isPending}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!isResolved && (
              <div className="flex items-end">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleResolve}
                  disabled={updateStatus.isPending}
                  className="h-8"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Resolve
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-6">
          <div className="py-4 space-y-4">
            {messagesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages && messages.length > 0 ? (
              messages.map((msg, index) => (
                <div key={msg.id}>
                  {index > 0 && <Separator className="my-4" />}
                  <div
                    className={cn(
                      "flex gap-3",
                      msg.sender_type === "agent" && "flex-row-reverse"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        msg.sender_type === "user"
                          ? "bg-primary/10 text-primary"
                          : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      )}
                    >
                      {msg.sender_type === "user" ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Headphones className="w-4 h-4" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "flex-1 rounded-lg p-3",
                        msg.sender_type === "user"
                          ? "bg-muted"
                          : "bg-primary/5 border border-primary/10"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-xs">
                          {msg.sender_name || (msg.sender_type === "user" ? "User" : "Agent")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(msg.created_at), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No messages yet</p>
            )}
          </div>
        </ScrollArea>

        {/* Reply Form */}
        {!isResolved && (
          <div className="p-4 border-t bg-background flex-shrink-0">
            <div className="flex gap-2">
              <Textarea
                placeholder="Type your reply..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={2}
                className="resize-none"
                maxLength={2000}
              />
              <Button 
                onClick={handleSendReply}
                disabled={addAgentMessage.isPending || !reply.trim()}
                className="self-end"
              >
                {addAgentMessage.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
