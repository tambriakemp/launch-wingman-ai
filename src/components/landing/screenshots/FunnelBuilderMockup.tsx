import { Gift, DollarSign, Video, Users, Check } from "lucide-react";
import { BrowserFrame } from "../BrowserFrame";

export const FunnelBuilderMockup = () => {
  return (
    <BrowserFrame>
      <div className="p-6 min-h-[380px]">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-1">Choose Your Funnel Type</h3>
          <p className="text-sm text-muted-foreground">Select the funnel that matches your launch strategy</p>
        </div>

        {/* Funnel Options */}
        <div className="space-y-3">
          {[
            { 
              icon: Gift, 
              name: "Freebie Funnel", 
              desc: "Build your email list with a valuable lead magnet",
              selected: true,
              color: "text-pink-500"
            },
            { 
              icon: DollarSign, 
              name: "Low-Ticket Funnel", 
              desc: "Convert leads with an irresistible entry offer",
              selected: false,
              color: "text-green-500"
            },
            { 
              icon: Video, 
              name: "Webinar Funnel", 
              desc: "Educate and pitch at scale with live events",
              selected: false,
              color: "text-blue-500"
            },
            { 
              icon: Users, 
              name: "Membership Funnel", 
              desc: "Build recurring revenue with community",
              selected: false,
              color: "text-purple-500"
            },
          ].map((funnel, i) => (
            <div 
              key={i} 
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                funnel.selected 
                  ? 'border-accent bg-accent/5' 
                  : 'border-border bg-card hover:border-accent/50'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${funnel.color}`}>
                <funnel.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-foreground">{funnel.name}</div>
                <div className="text-sm text-muted-foreground">{funnel.desc}</div>
              </div>
              {funnel.selected && (
                <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                  <Check className="w-4 h-4 text-accent-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
};
