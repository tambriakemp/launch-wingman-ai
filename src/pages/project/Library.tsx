import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight, ChevronDown, ArrowLeft, BookOpen, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  LIBRARY_CATEGORIES,
  getArticleById,
  searchArticles,
  getAllArticles,
  type LibraryArticle,
  type LibraryCategory,
} from "@/data/libraryArticles";

interface ArticleOrder {
  article_id: string;
  position: number;
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

  const handleBackToTask = () => {
    if (returnToTask) {
      navigate(returnToTask);
    }
  };

  const isContextual = !!returnToTask;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto"
    >
      {/* Navigation */}
      <div className="flex items-center gap-3 mb-6">
        {isContextual ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToTask}
              className="text-foreground hover:text-foreground"
            >
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
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Library
          </Button>
        )}
      </div>

      {/* Article Content */}
      <Card className="bg-card border-border">
        <CardContent className="p-6 md:p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              {article.title}
            </h1>
            <p className="text-muted-foreground/80">{article.descriptor}</p>
          </div>

          <Separator />

          <section>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
              What this is
            </h2>
            <p className="text-foreground leading-relaxed whitespace-pre-line">
              {article.content.whatThisIs}
            </p>
          </section>

          <section>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Why this matters here
            </h2>
            <p className="text-foreground leading-relaxed whitespace-pre-line">
              {article.content.whyThisMattersHere}
            </p>
          </section>

          <section>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
              A simple way to think about it
            </h2>
            <p className="text-foreground leading-relaxed whitespace-pre-line">
              {article.content.simpleWayToThink}
            </p>
          </section>

          {article.content.example && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Example
              </h2>
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <p className="text-foreground italic leading-relaxed whitespace-pre-line">
                  {article.content.example}
                </p>
              </div>
            </section>
          )}

          {/* Reassurance section with visual separation */}
          <div className="pt-4 mt-2 border-t border-border/50">
            <p className="text-muted-foreground/70 text-sm leading-relaxed italic">
              {article.content.reassurance}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Back to Task CTA - prominent for contextual view */}
      {isContextual && (
        <div className="mt-6 flex justify-center">
          <Button onClick={handleBackToTask}>
            Back to task
          </Button>
        </div>
      )}
    </motion.div>
  );
};

const CategoryAccordion = ({
  category,
  isExpanded,
  onToggle,
  onSelectArticle,
  isAdmin,
  orderedArticles,
  categoryIndex,
}: {
  category: LibraryCategory;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectArticle: (article: LibraryArticle) => void;
  isAdmin: boolean;
  orderedArticles: LibraryArticle[];
  categoryIndex: number;
}) => {
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
      >
        <span className="font-medium text-foreground">{category.name}</span>
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
              {isAdmin ? (
                <Droppable droppableId={`category-${categoryIndex}`}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {orderedArticles.map((article, index) => (
                        <Draggable key={article.id} draggableId={article.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center gap-2 p-4 hover:bg-muted/50 transition-colors ${
                                index !== orderedArticles.length - 1 ? "border-b border-border" : ""
                              } ${snapshot.isDragging ? "bg-muted shadow-lg" : ""}`}
                            >
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                              >
                                <GripVertical className="w-4 h-4" />
                              </div>
                              <button
                                onClick={() => onSelectArticle(article)}
                                className="flex-1 text-left"
                              >
                                <p className="font-medium text-foreground mb-0.5">{article.title}</p>
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {article.descriptor}
                                </p>
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ) : (
                orderedArticles.map((article, index) => (
                  <button
                    key={article.id}
                    onClick={() => onSelectArticle(article)}
                    className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                      index !== orderedArticles.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <p className="font-medium text-foreground mb-0.5">{article.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {article.descriptor}
                    </p>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SearchResults = ({
  results,
  onSelectArticle,
  query,
}: {
  results: LibraryArticle[];
  onSelectArticle: (article: LibraryArticle) => void;
  query: string;
}) => {
  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No articles found for "{query}"
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground mb-4">
        {results.length} result{results.length !== 1 ? "s" : ""} for "{query}"
      </p>
      {results.map((article) => (
        <button
          key={article.id}
          onClick={() => onSelectArticle(article)}
          className="w-full text-left p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors bg-card"
        >
          <p className="font-medium text-foreground mb-0.5">{article.title}</p>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {article.descriptor}
          </p>
        </button>
      ))}
    </div>
  );
};

// Default expanded categories - Getting Started and Planning & Offers
const DEFAULT_EXPANDED_CATEGORIES = new Set(["getting-started", "planning-offers"]);

export default function Library() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const articleId = searchParams.get("article");
  const returnToTask = searchParams.get("returnTo");
  const { toast } = useToast();
  const { session } = useAuth();
  const { isAdmin } = useAdmin();

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(DEFAULT_EXPANDED_CATEGORIES);
  const [selectedArticle, setSelectedArticle] = useState<LibraryArticle | null>(
    articleId ? getArticleById(articleId) || null : null
  );
  const [articleOrderMap, setArticleOrderMap] = useState<Map<string, number>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  // Fetch article order from database
  useEffect(() => {
    const fetchArticleOrder = async () => {
      const { data, error } = await supabase
        .from("library_article_order")
        .select("article_id, position")
        .order("position", { ascending: true });

      if (error) {
        console.error("Error fetching article order:", error);
        return;
      }

      if (data && data.length > 0) {
        const orderMap = new Map<string, number>();
        data.forEach((item) => {
          orderMap.set(item.article_id, item.position);
        });
        setArticleOrderMap(orderMap);
      }
    };

    fetchArticleOrder();
  }, []);

  // Sort articles within each category based on the order map
  const orderedCategories = useMemo(() => {
    return LIBRARY_CATEGORIES.map((category) => {
      const sortedArticles = [...category.articles].sort((a, b) => {
        const posA = articleOrderMap.get(a.id) ?? Infinity;
        const posB = articleOrderMap.get(b.id) ?? Infinity;
        if (posA === Infinity && posB === Infinity) {
          // Both don't have custom order, keep original order
          return category.articles.indexOf(a) - category.articles.indexOf(b);
        }
        return posA - posB;
      });
      return { ...category, articles: sortedArticles };
    });
  }, [articleOrderMap]);

  const searchResults = searchQuery.length >= 2 ? searchArticles(searchQuery) : [];
  const isSearching = searchQuery.length >= 2;

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleSelectArticle = (article: LibraryArticle) => {
    setSelectedArticle(article);
    setSearchQuery("");
  };

  const handleBackToList = () => {
    setSelectedArticle(null);
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !isAdmin) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;
    const categoryIndex = parseInt(result.source.droppableId.replace("category-", ""));

    if (sourceIndex === destIndex) return;

    const category = orderedCategories[categoryIndex];
    const reorderedArticles = [...category.articles];
    const [movedArticle] = reorderedArticles.splice(sourceIndex, 1);
    reorderedArticles.splice(destIndex, 0, movedArticle);

    // Update local state immediately for optimistic UI
    const newOrderMap = new Map(articleOrderMap);
    reorderedArticles.forEach((article, index) => {
      newOrderMap.set(article.id, index);
    });
    setArticleOrderMap(newOrderMap);

    // Save to database
    setIsSaving(true);
    try {
      const articlesToUpdate: ArticleOrder[] = reorderedArticles.map((article, index) => ({
        article_id: article.id,
        position: index,
      }));

      const { error } = await supabase.functions.invoke("update-article-order", {
        body: { articles: articlesToUpdate },
      });

      if (error) {
        console.error("Error saving article order:", error);
        toast({
          title: "Error",
          description: "Failed to save article order. Please try again.",
          variant: "destructive",
        });
        // Revert on error - refetch from DB
        const { data } = await supabase
          .from("library_article_order")
          .select("article_id, position")
          .order("position", { ascending: true });
        if (data) {
          const revertedMap = new Map<string, number>();
          data.forEach((item) => {
            revertedMap.set(item.article_id, item.position);
          });
          setArticleOrderMap(revertedMap);
        }
      } else {
        toast({
          title: "Order saved",
          description: "Article order has been updated.",
        });
      }
    } catch (error) {
      console.error("Error saving article order:", error);
      toast({
        title: "Error",
        description: "Failed to save article order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const content = (
    <div className="max-w-3xl mx-auto py-4 md:py-8 px-4">
      <AnimatePresence mode="wait">
        {selectedArticle ? (
          <ArticleView
            key="article"
            article={selectedArticle}
            onBack={handleBackToList}
            returnToTask={returnToTask}
          />
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h1 className="text-2xl font-semibold text-foreground">Library</h1>
                {isAdmin && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-2">
                    Admin mode
                  </span>
                )}
              </div>
              <p className="text-muted-foreground">
                Short explanations to support the step you're on.
              </p>
              {isAdmin && (
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Drag articles to reorder them. Changes are saved automatically.
                </p>
              )}
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search a concept…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Content */}
            {isSearching ? (
              <SearchResults
                results={searchResults}
                onSelectArticle={handleSelectArticle}
                query={searchQuery}
              />
            ) : (
              <div className="space-y-3">
                {orderedCategories.map((category, categoryIndex) => (
                  <CategoryAccordion
                    key={category.id}
                    category={category}
                    isExpanded={expandedCategories.has(category.id)}
                    onToggle={() => toggleCategory(category.id)}
                    onSelectArticle={handleSelectArticle}
                    isAdmin={isAdmin}
                    orderedArticles={category.articles}
                    categoryIndex={categoryIndex}
                  />
                ))}
              </div>
            )}

            {/* Return to work affordance */}
            {!isSearching && projectId && (
              <div className="mt-10 pt-6 border-t border-border/50">
                <p className="text-sm text-muted-foreground/70 text-center">
                  Working on a task?{" "}
                  <button
                    onClick={() => navigate(`/projects/${projectId}`)}
                    className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                  >
                    Return to your project →
                  </button>
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <ProjectLayout>
      {isAdmin ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          {content}
        </DragDropContext>
      ) : (
        content
      )}
    </ProjectLayout>
  );
}
