import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Check, ChevronDown } from "lucide-react";

interface FacebookPage {
  id: string;
  name: string;
  picture?: {
    data?: {
      url?: string;
    };
  };
}

interface FacebookPageSelectorProps {
  currentPageName: string | null;
  currentPageId: string | null;
  onPageChange: () => void;
}

export function FacebookPageSelector({ 
  currentPageName, 
  currentPageId,
  onPageChange 
}: FacebookPageSelectorProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [pages, setPages] = useState<FacebookPage[]>([]);

  const fetchPages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('facebook-get-pages');
      
      if (error) throw error;
      
      if (data?.pages) {
        setPages(data.pages);
      } else {
        setPages([]);
      }
    } catch (error) {
      console.error('Failed to fetch pages:', error);
      toast.error("Failed to load Facebook pages");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchPages();
    }
  }, [open]);

  const handleSelectPage = async (page: FacebookPage) => {
    if (page.id === currentPageId) {
      setOpen(false);
      return;
    }

    setIsChanging(true);
    try {
      const { error } = await supabase.functions.invoke('facebook-change-page', {
        body: { pageId: page.id }
      });
      
      if (error) throw error;
      
      toast.success(`Switched to ${page.name}`);
      onPageChange();
      setOpen(false);
    } catch (error) {
      console.error('Failed to change page:', error);
      toast.error("Failed to switch Facebook page");
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-auto p-0 text-primary hover:text-primary/80">
          <span className="text-xs underline-offset-4 hover:underline">Change page</span>
          <ChevronDown className="w-3 h-3 ml-0.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Facebook Page</DialogTitle>
          <DialogDescription>
            Choose which page you want to post to
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : pages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No Facebook pages found.</p>
            <p className="text-sm mt-1">Make sure you have page admin access.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-2">
              {pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => handleSelectPage(page)}
                  disabled={isChanging}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    page.id === currentPageId 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  {page.picture?.data?.url ? (
                    <img 
                      src={page.picture.data.url} 
                      alt={page.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[#1877F2] flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">{page.name}</p>
                    <p className="text-xs text-muted-foreground">ID: {page.id}</p>
                  </div>
                  {page.id === currentPageId && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                  {isChanging && page.id !== currentPageId && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
