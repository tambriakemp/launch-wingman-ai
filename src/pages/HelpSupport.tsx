import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useUserTickets, useCreateTicket, SupportTicket } from "@/hooks/useSupportTickets";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  HelpCircle,
  Plus,
  Clock,
  CheckCircle2,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  Loader2,
  Send,
  Search,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import { format } from "date-fns";
import {
  LIBRARY_CATEGORIES,
  getArticleById,
  searchArticles,
  type LibraryArticle,
} from "@/data/libraryArticles";

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

const DEFAULT_EXPANDED_CATEGORIES = new Set(["getting-started", "planning-offers"]);

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

const ArticleView = ({
  article,
  onBack,
  returnToTask,
}: {
  article: LibraryArticle;
  onBack: () => void;
  returnToTask?: string | null;
}) => {
  const navigate = useNavigate();
  const isContextual = !!returnToTask;

  const handleBackToTask = () => {
    if (returnToTask) navigate(returnToTask);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="flex items-center gap-3 mb-6">
        {isContextual ? (
          <>
            <Button variant="ghost" size="sm" onClick={handleBackToTask}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to task
            </Button>
            <span className="text-muted-foreground/50">·</span>
            <button
              onClick={onBack}
              className="text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              Browse Library
            </button>
          </>
        ) : (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Library
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">{article.title}</h2>
            <p className="text-muted-foreground/80">{article.descriptor}</p>
          </div>
          <Separator />
          <section>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">What this is</h3>
            <p className="text-foreground leading-relaxed whitespace-pre-line">{article.content.whatThisIs}</p>
          </section>
          <section>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">Why this matters here</h3>
            <p className="text-foreground leading-relaxed whitespace-pre-line">{article.content.whyThisMattersHere}</p>
          </section>
          <section>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">A simple way to think about it</h3>
            <p className="text-foreground leading-relaxed whitespace-pre-line">{article.content.simpleWayToThink}</p>
          </section>
          {article.content.example && (
            <section>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">Example</h3>
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <p className="text-foreground italic leading-relaxed whitespace-pre-line">{article.content.example}</p>
              </div>
            </section>
          )}
          <div className="pt-4 mt-2 border-t border-border/50">
            <p className="text-muted-foreground/70 text-sm leading-relaxed italic">{article.content.reassurance}</p>
          </div>
        </CardContent>
      </Card>

      {isContextual && (
        <div className="mt-6 flex justify-center">
          <Button onClick={handleBackToTask}>Back to task</Button>
        </div>
      )}
    </motion.div>
  );
};

export default function HelpSupport() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const articleParam = searchParams.get("article");
  const returnToTask = searchParams.get("returnTo");
  const { user } = useAuth();
  const { data: tickets, isLoading: ticketsLoading } = useUserTickets();
  const createTicket = useCreateTicket();

  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");

  // Library state
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(DEFAULT_EXPANDED_CATEGORIES);
  const [selectedArticle, setSelectedArticle] = useState<LibraryArticle | null>(
    articleParam ? getArticleById(articleParam) || null : null
  );

  // Sync article URL param when it changes externally
  useEffect(() => {
    if (articleParam) {
      const found = getArticleById(articleParam);
      if (found) setSelectedArticle(found);
    }
  }, [articleParam]);

  const isSearching = searchQuery.length >= 2;
  const searchResults = useMemo(
    () => (isSearching ? searchArticles(searchQuery) : []),
    [searchQuery, isSearching]
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const handleSelectArticle = (article: LibraryArticle) => {
    setSelectedArticle(article);
    setSearchQuery("");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("article", article.id);
      return next;
    });
  };

  const handleBackToList = () => {
    setSelectedArticle(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("article");
      next.delete("returnTo");
      return next;
    });
  };

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
              Browse the library, find answers to common questions, or submit a support ticket.
            </p>
          </div>
        </div>

        {/* Library */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Library
            </CardTitle>
            <CardDescription>Short explanations to support the step you're on.</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {selectedArticle ? (
                <ArticleView
                  key="article"
                  article={selectedArticle}
                  onBack={handleBackToList}
                  returnToTask={returnToTask}
                />
              ) : (
                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search a concept…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {isSearching ? (
                    searchResults.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">No articles found for "{searchQuery}"</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground mb-4">
                          {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{searchQuery}"
                        </p>
                        {searchResults.map((article) => (
                          <button
                            key={article.id}
                            onClick={() => handleSelectArticle(article)}
                            className="w-full text-left p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors bg-card"
                          >
                            <p className="font-medium text-foreground mb-0.5">{article.title}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">{article.descriptor}</p>
                          </button>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="space-y-3">
                      {LIBRARY_CATEGORIES.map((cat) => {
                        const isExpanded = expandedCategories.has(cat.id);
                        return (
                          <div key={cat.id} className="border border-border rounded-lg overflow-hidden bg-card">
                            <button
                              onClick={() => toggleCategory(cat.id)}
                              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                            >
                              <span className="font-medium text-foreground">{cat.name}</span>
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="border-t border-border">
                                    {cat.articles.map((article, index) => (
                                      <button
                                        key={article.id}
                                        onClick={() => handleSelectArticle(article)}
                                        className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                                          index !== cat.articles.length - 1 ? "border-b border-border" : ""
                                        }`}
                                      >
                                        <p className="font-medium text-foreground mb-0.5">{article.title}</p>
                                        <p className="text-sm text-muted-foreground line-clamp-1">{article.descriptor}</p>
                                      </button>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

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
