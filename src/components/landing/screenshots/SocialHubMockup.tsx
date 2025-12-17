import { Calendar, Image, Send, Clock, Twitter, Instagram } from "lucide-react";
import { BrowserFrame } from "../BrowserFrame";

const PinterestIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
  </svg>
);

export const SocialHubMockup = () => {
  return (
    <BrowserFrame>
      <div className="p-6 min-h-[380px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Social Media Hub</h3>
            <p className="text-sm text-muted-foreground">Schedule and publish your launch content</p>
          </div>
          <div className="flex gap-2">
            <div className="p-2 rounded-lg bg-muted">
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Upcoming Posts */}
        <div className="space-y-3">
          {[
            { 
              title: "Launch announcement post", 
              platform: "pinterest",
              time: "Tomorrow, 9:00 AM",
              image: true,
              status: "scheduled"
            },
            { 
              title: "Behind the scenes story", 
              platform: "twitter",
              time: "Dec 18, 2:00 PM",
              image: false,
              status: "draft"
            },
            { 
              title: "Testimonial carousel", 
              platform: "instagram",
              time: "Dec 19, 10:00 AM",
              image: true,
              status: "scheduled"
            },
          ].map((post, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl">
              {/* Image Preview */}
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center flex-shrink-0">
                {post.image ? (
                  <Image className="w-6 h-6 text-accent" />
                ) : (
                  <div className="text-xs text-muted-foreground text-center px-1">Text only</div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground text-sm truncate">{post.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-5 h-5 rounded flex items-center justify-center ${
                    post.platform === 'pinterest' ? 'bg-red-500/10 text-red-500' :
                    post.platform === 'twitter' ? 'bg-blue-400/10 text-blue-400' :
                    'bg-pink-500/10 text-pink-500'
                  }`}>
                    {post.platform === 'pinterest' && <PinterestIcon />}
                    {post.platform === 'twitter' && <Twitter className="w-3 h-3" />}
                    {post.platform === 'instagram' && <Instagram className="w-3 h-3" />}
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.time}
                  </span>
                </div>
              </div>

              {/* Status & Action */}
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  post.status === 'scheduled' 
                    ? 'bg-green-500/10 text-green-500' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {post.status === 'scheduled' ? 'Scheduled' : 'Draft'}
                </span>
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center cursor-pointer">
                  <Send className="w-4 h-4 text-accent-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Connected Platforms */}
        <div className="mt-4 flex items-center justify-center gap-4 pt-4 border-t border-border">
          <span className="text-xs text-muted-foreground">Connected:</span>
          <div className="flex gap-2">
            {[
              { icon: PinterestIcon, connected: true, color: "text-red-500" },
              { icon: Twitter, connected: true, color: "text-blue-400" },
              { icon: Instagram, connected: false, color: "text-muted-foreground" },
            ].map((platform, i) => (
              <div 
                key={i}
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  platform.connected ? 'bg-muted' : 'bg-muted/50 opacity-50'
                } ${platform.color}`}
              >
                <platform.icon />
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
};
