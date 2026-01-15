import { User, Heart, MessageCircle, Send, MoreHorizontal, Repeat2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Threads icon component
const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 192 192" fill="currentColor" className={className}>
    <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.265-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.68 22.231-5.436 29.049-14.127 5.178-6.6 8.453-15.153 9.899-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.742C35.236 139.966 29.808 120.682 29.605 96c.203-24.682 5.63-43.966 16.133-57.317C56.954 24.425 74.204 17.11 97.014 16.94c23.001.173 40.574 7.576 52.232 22.005 5.565 6.882 9.746 15.087 12.508 24.382l15.015-4.065c-3.271-11.017-8.327-20.907-15.171-29.362C146.97 11.794 125.597 3.146 97.064 2.94h-.085c-28.464.207-49.72 8.87-63.196 25.762-12.73 15.962-19.265 38.05-19.482 65.704v1.187c.217 27.654 6.752 49.742 19.482 65.704 13.475 16.892 34.732 25.555 63.196 25.763h.085c24.346-.163 41.608-6.497 55.918-20.531 18.79-18.418 18.362-41.087 12.118-55.65-4.481-10.45-12.896-18.99-24.563-25.091Zm-64.768 44.538c-10.455.57-21.327-4.108-21.872-14.329-.408-7.65 5.41-16.186 25.16-17.323 2.2-.127 4.35-.19 6.451-.19 6.274 0 12.15.513 17.519 1.493-1.994 24.134-15.667 29.764-27.258 30.349Z" />
  </svg>
);

interface ThreadPost {
  id: string;
  text: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
}

interface ThreadsPreviewProps {
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  accountName?: string;
  threadPosts?: ThreadPost[];
}

function ThreadPost({ 
  content, 
  mediaUrl, 
  mediaType, 
  accountName, 
  isFirst = false,
  isLast = false,
  showThread = false 
}: { 
  content: string; 
  mediaUrl?: string | null; 
  mediaType?: string | null; 
  accountName: string;
  isFirst?: boolean;
  isLast?: boolean;
  showThread?: boolean;
}) {
  return (
    <div className="relative flex gap-3 px-4 py-3">
      {/* Thread line connector */}
      {showThread && !isFirst && (
        <div className="absolute left-7 top-0 w-0.5 h-3 bg-gray-600" />
      )}
      
      {/* Avatar column */}
      <div className="relative flex flex-col items-center">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center flex-shrink-0 border border-gray-600">
          <User className="w-4 h-4 text-white" />
        </div>
        {/* Thread line going down */}
        {showThread && !isLast && (
          <div className="w-0.5 flex-1 bg-gray-600 mt-2" />
        )}
      </div>
      
      {/* Content column */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-white">{accountName}</span>
            <span className="text-xs text-gray-500">· 1m</span>
          </div>
          <MoreHorizontal className="w-4 h-4 text-gray-500" />
        </div>
        
        {/* Post content */}
        <p className={cn(
          "text-sm text-white leading-relaxed",
          !mediaUrl && "line-clamp-4"
        )}>
          {content || "Your thread starts here..."}
        </p>
        
        {/* Media */}
        {mediaUrl && (
          <div className="mt-2 rounded-lg overflow-hidden border border-gray-700">
            {mediaType === "video" ? (
              <video 
                src={mediaUrl} 
                className="w-full max-h-48 object-cover bg-black" 
                muted 
                loop
                autoPlay
                playsInline
              />
            ) : (
              <img src={mediaUrl} alt="" className="w-full max-h-48 object-cover" />
            )}
          </div>
        )}
        
        {/* Action icons */}
        <div className="flex items-center gap-4 mt-3">
          <Heart className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" strokeWidth={1.5} />
          <MessageCircle className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" strokeWidth={1.5} />
          <Repeat2 className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" strokeWidth={1.5} />
          <Send className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}

export function ThreadsPreview({ 
  content, 
  mediaUrl, 
  mediaType, 
  accountName = "your_account",
  threadPosts = []
}: ThreadsPreviewProps) {
  const displayName = accountName || "your_account";
  const hasThreadChain = threadPosts.length > 0;
  
  return (
    <div className="flex flex-col h-full bg-black">
      {/* Threads Header */}
      <div className="flex items-center justify-center gap-2 py-3 border-b border-gray-800">
        <ThreadsIcon className="w-5 h-5 text-white" />
      </div>
      
      {/* Thread Posts */}
      <div className="flex-1 overflow-y-auto">
        {/* First post (main content) */}
        <ThreadPost 
          content={content}
          mediaUrl={mediaUrl}
          mediaType={mediaType}
          accountName={displayName}
          isFirst={true}
          isLast={!hasThreadChain}
          showThread={hasThreadChain}
        />
        
        {/* Additional thread posts */}
        {threadPosts.map((post, index) => (
          <ThreadPost
            key={post.id}
            content={post.text}
            mediaUrl={post.mediaUrl}
            mediaType={post.mediaType}
            accountName={displayName}
            isFirst={false}
            isLast={index === threadPosts.length - 1}
            showThread={true}
          />
        ))}
      </div>
      
      {/* Bottom engagement stats */}
      <div className="px-4 py-2 border-t border-gray-800">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>0 replies</span>
          <span>·</span>
          <span>0 likes</span>
        </div>
      </div>
    </div>
  );
}
