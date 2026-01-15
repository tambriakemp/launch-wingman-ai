import { Plus, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 192 192" fill="currentColor" className={className}>
    <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.265-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.68 22.231-5.436 29.049-14.127 5.178-6.6 8.453-15.153 9.899-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.742C35.236 139.966 29.808 120.682 29.605 96c.203-24.682 5.63-43.966 16.133-57.317C56.954 24.425 74.204 17.11 97.014 16.94c23.001.173 40.574 7.576 52.232 22.005 5.565 6.882 9.746 15.087 12.508 24.382l15.015-4.065c-3.271-11.017-8.327-20.907-15.171-29.362C146.97 11.794 125.597 3.146 97.064 2.94h-.085c-28.464.207-49.72 8.87-63.196 25.762-12.73 15.962-19.265 38.05-19.482 65.704v1.187c.217 27.654 6.752 49.742 19.482 65.704 13.475 16.892 34.732 25.555 63.196 25.763h.085c24.346-.163 41.608-6.497 55.918-20.531 18.79-18.418 18.362-41.087 12.118-55.65-4.481-10.45-12.896-18.99-24.563-25.091Zm-64.768 44.538c-10.455.57-21.327-4.108-21.872-14.329-.408-7.65 5.41-16.186 25.16-17.323 2.2-.127 4.35-.19 6.451-.19 6.274 0 12.15.513 17.519 1.493-1.994 24.134-15.667 29.764-27.258 30.349Z" />
  </svg>
);

export interface ThreadPost {
  id: string;
  text: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
}

interface ThreadChainEditorProps {
  threadPosts: ThreadPost[];
  onThreadPostsChange: (posts: ThreadPost[]) => void;
  maxPosts?: number;
}

export function ThreadChainEditor({
  threadPosts,
  onThreadPostsChange,
  maxPosts = 10,
}: ThreadChainEditorProps) {
  const handleAddThreadPost = () => {
    const newThreadPost: ThreadPost = {
      id: crypto.randomUUID(),
      text: "",
    };
    onThreadPostsChange([...threadPosts, newThreadPost]);
  };

  const handleUpdateThreadPost = (threadPostId: string, text: string) => {
    const updatedThreadPosts = threadPosts.map((post) =>
      post.id === threadPostId ? { ...post, text } : post
    );
    onThreadPostsChange(updatedThreadPosts);
  };

  const handleRemoveThreadPost = (threadPostId: string) => {
    const updatedThreadPosts = threadPosts.filter(
      (post) => post.id !== threadPostId
    );
    onThreadPostsChange(updatedThreadPosts);
  };

  return (
    <div className="space-y-3 pt-2 border-t border-border/50">
      <p className="text-xs text-muted-foreground">
        Add additional posts to create a thread on Threads
      </p>
      
      {/* Thread posts */}
      {threadPosts.map((threadPost, index) => (
        <div
          key={threadPost.id}
          className="relative border-l-2 border-muted pl-4 py-2"
        >
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 mt-1">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: "#000000" }}
              >
                <ThreadsIcon className="w-3 h-3" />
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Thread {index + 2}
                </Label>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${threadPost.text.length > 500 ? 'text-destructive font-medium' : threadPost.text.length > 450 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                    {500 - threadPost.text.length} remaining
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveThreadPost(threadPost.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <Textarea
                value={threadPost.text}
                onChange={(e) => {
                  handleUpdateThreadPost(threadPost.id, e.target.value);
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.max(80, target.scrollHeight)}px`;
                }}
                placeholder="Continue your thread..."
                className="min-h-[80px] resize-none overflow-hidden text-sm"
                maxLength={500}
                style={{ height: 'auto' }}
              />
            </div>
          </div>
        </div>
      ))}

      {/* Add to thread button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddThreadPost}
        className="w-full border-dashed text-muted-foreground hover:text-foreground"
        disabled={threadPosts.length >= maxPosts}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add to thread
      </Button>
      
      {threadPosts.length >= maxPosts && (
        <p className="text-xs text-muted-foreground text-center">
          Maximum {maxPosts} posts per thread
        </p>
      )}
    </div>
  );
}
