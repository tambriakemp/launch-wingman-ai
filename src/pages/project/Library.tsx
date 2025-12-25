import { useState } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight, ChevronDown, ArrowLeft, BookOpen } from "lucide-react";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  LIBRARY_CATEGORIES,
  getArticleById,
  searchArticles,
  type LibraryArticle,
  type LibraryCategory,
} from "@/data/libraryArticles";

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

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto"
    >
      {/* Navigation */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Library
        </Button>
      </div>

      {/* Article Content */}
      <Card className="bg-card border-border">
        <CardContent className="p-6 md:p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              {article.title}
            </h1>
            <p className="text-muted-foreground">{article.descriptor}</p>
          </div>

          <Separator />

          <section>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
              What this is
            </h2>
            <p className="text-foreground leading-relaxed">
              {article.content.whatThisIs}
            </p>
          </section>

          <section>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Why this matters here
            </h2>
            <p className="text-foreground leading-relaxed">
              {article.content.whyThisMattersHere}
            </p>
          </section>

          <section>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
              A simple way to think about it
            </h2>
            <p className="text-foreground leading-relaxed">
              {article.content.simpleWayToThink}
            </p>
          </section>

          {article.content.example && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Example
              </h2>
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <p className="text-foreground italic leading-relaxed">
                  {article.content.example}
                </p>
              </div>
            </section>
          )}

          <Separator />

          <p className="text-muted-foreground text-sm leading-relaxed">
            {article.content.reassurance}
          </p>
        </CardContent>
      </Card>

      {/* Back to Task CTA */}
      {returnToTask && (
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
}: {
  category: LibraryCategory;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectArticle: (article: LibraryArticle) => void;
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
              {category.articles.map((article, index) => (
                <button
                  key={article.id}
                  onClick={() => onSelectArticle(article)}
                  className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                    index !== category.articles.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <p className="font-medium text-foreground mb-0.5">{article.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {article.descriptor}
                  </p>
                </button>
              ))}
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

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(DEFAULT_EXPANDED_CATEGORIES);
  const [selectedArticle, setSelectedArticle] = useState<LibraryArticle | null>(
    articleId ? getArticleById(articleId) || null : null
  );

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

  return (
    <ProjectLayout>
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
                </div>
                <p className="text-muted-foreground">
                  Short explanations to support the step you're on.
                </p>
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
                  {LIBRARY_CATEGORIES.map((category) => (
                    <CategoryAccordion
                      key={category.id}
                      category={category}
                      isExpanded={expandedCategories.has(category.id)}
                      onToggle={() => toggleCategory(category.id)}
                      onSelectArticle={handleSelectArticle}
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
    </ProjectLayout>
  );
}
