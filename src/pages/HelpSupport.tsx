import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserTickets, useCreateTicket, SupportTicket } from "@/hooks/useSupportTickets";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  HelpCircle, 
  Plus, 
  Clock, 
  CheckCircle2, 
  MessageSquare,
  ChevronRight,
  Loader2,
  Send
} from "lucide-react";
import { format } from "date-fns";

export const TICKET_CATEGORIES = [
  { value: "general", label: "General Question" },
  { value: "technical", label: "Technical Issue" },
  { value: "billing", label: "Billing & Subscription" },
  { value: "feature", label: "Feature Request" },
  { value: "suggestion", label: "Make a Suggestion or Submit an Idea" },
  { value: "bug", label: "Bug Report" },
  { value: "account", label: "Account Help" },
  { value: "other", label: "Other" },
] as const;

const faqs = [
  {
    question: "How do I get started with my first project?",
    answer: "After signing up, you'll be guided through a quick assessment to understand your business needs. From there, you can create your first project and start building your launch strategy."
  },
  {
    question: "Can I upgrade or downgrade my subscription?",
    answer: "Yes! You can change your subscription at any time from your Settings page. Changes take effect at your next billing cycle."
  },
  {
    question: "How do I connect my social media accounts?",
    answer: "Navigate to the Social Hub section within your project and click on 'Connect Accounts'. Follow the authorization prompts for each platform you want to connect."
  },
  {
    question: "What if I need to pause my project?",
    answer: "You can pause your project at any time from the project settings. Your data will be preserved and you can resume whenever you're ready."
  },
];

function getStatusBadge(status: SupportTicket['status']) {
  const config = {
    open: { label: "Open", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
    in_progress: { label: "In Progress", className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300" },
    awaiting_user: { label: "Awaiting Reply", className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
    awaiting_agent: { label: "Awaiting Support", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
    resolved: { label: "Resolved", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  };
  const { label, className } = config[status];
  return <Badge className={className}>{label}</Badge>;
}

export default function HelpSupport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: tickets, isLoading: ticketsLoading } = useUserTickets();
  const createTicket = useCreateTicket();

  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !message.trim()) return;

    const categoryLabel = TICKET_CATEGORIES.find(c => c.value === category)?.label || category;
    await createTicket.mutateAsync({ subject: categoryLabel, message, priority });
    setCategory("");
    setMessage("");
    setPriority("normal");
    setShowForm(false);
  };

  return (
    <ProjectLayout>
      <div className="max-w-7xl mx-auto px-2.5 md:px-6 py-8">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <div className="p-3 bg-sky-100/50 dark:bg-sky-900/20 rounded-xl shrink-0">
            <HelpCircle className="w-6 h-6 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Help & Support</h1>
            <p className="text-muted-foreground">
              Find answers to common questions or submit a support ticket.
            </p>
          </div>
        </div>

        {/* FAQs */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>Quick answers to common questions</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`}>
                  <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Submit Ticket Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Need More Help?</CardTitle>
                <CardDescription>Submit a support ticket and we'll get back to you</CardDescription>
              </div>
              {!showForm && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Ticket
                </Button>
              )}
            </div>
          </CardHeader>
          {showForm && (
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">What do you need help with?</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TICKET_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Please describe your issue or idea in detail..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={5}
                    maxLength={2000}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createTicket.isPending || !category}>
                    {createTicket.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Submit Ticket
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          )}
        </Card>

        {/* My Tickets */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                My Tickets
              </CardTitle>
              <CardDescription>View and manage your support requests</CardDescription>
            </CardHeader>
            <CardContent>
              {ticketsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : tickets && tickets.length > 0 ? (
                <div className="space-y-3">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => navigate(`/help/ticket/${ticket.id}`)}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusBadge(ticket.status)}
                          <span className="text-xs text-muted-foreground">
                            #{ticket.id.slice(0, 8)}
                          </span>
                        </div>
                        <p className="font-medium truncate">{ticket.subject}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(ticket.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No tickets yet</p>
                  <p className="text-sm">Submit a ticket if you need assistance</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </ProjectLayout>
  );
}
