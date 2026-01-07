import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTicket, useTicketMessages, useAddUserMessage, SupportTicket } from "@/hooks/useSupportTickets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Clock, 
  Send, 
  Loader2,
  User,
  Headphones
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

function getStatusBadge(status: SupportTicket['status']) {
  const config = {
    open: { label: "Open", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
    in_progress: { label: "In Progress", className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300" },
    awaiting_user: { label: "Awaiting Your Reply", className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
    awaiting_agent: { label: "Awaiting Support", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
    resolved: { label: "Resolved", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  };
  const { label, className } = config[status];
  return <Badge className={className}>{label}</Badge>;
}

function getPriorityBadge(priority: string) {
  const config: Record<string, string> = {
    low: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
    normal: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };
  return <Badge className={config[priority]}>{priority.charAt(0).toUpperCase() + priority.slice(1)} Priority</Badge>;
}

export default function HelpSupportTicket() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: ticket, isLoading: ticketLoading } = useTicket(id);
  const { data: messages, isLoading: messagesLoading } = useTicketMessages(id);
  const addMessage = useAddUserMessage();

  const [reply, setReply] = useState("");

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !id) return;

    await addMessage.mutateAsync({ ticketId: id, message: reply });
    setReply("");
  };

  if (ticketLoading || messagesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Ticket not found</p>
          <Button onClick={() => navigate("/help")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Help
          </Button>
        </div>
      </div>
    );
  }

  const isResolved = ticket.status === "resolved";

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-8 px-4">
        {/* Header */}
        <Button 
          variant="ghost" 
          onClick={() => navigate("/help")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Help
        </Button>

        {/* Ticket Info */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <CardTitle className="text-xl mb-2">{ticket.subject}</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  {getStatusBadge(ticket.status)}
                  {getPriorityBadge(ticket.priority)}
                  <span className="text-xs text-muted-foreground">
                    #{ticket.id.slice(0, 8)}
                  </span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {format(new Date(ticket.created_at), "MMM d, yyyy")}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Messages */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              {messages?.map((msg, index) => (
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
                        "flex-1 rounded-lg p-4",
                        msg.sender_type === "user"
                          ? "bg-muted"
                          : "bg-primary/5 border border-primary/10"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">
                          {msg.sender_name || (msg.sender_type === "user" ? "You" : "Support Agent")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(msg.created_at), "MMM d 'at' h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reply Form */}
        {!isResolved ? (
          <Card>
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleSubmitReply} className="space-y-4">
                <Textarea
                  placeholder="Type your reply..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={4}
                  maxLength={2000}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={addMessage.isPending || !reply.trim()}>
                    {addMessage.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Send Reply
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <p>This ticket has been resolved.</p>
              <p className="text-sm mt-1">If you need further assistance, please submit a new ticket.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
