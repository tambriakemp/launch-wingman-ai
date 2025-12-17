import { LayoutDashboard, FolderOpen, CheckSquare, Calendar, TrendingUp } from "lucide-react";
import { BrowserFrame } from "../BrowserFrame";

export const DashboardMockup = () => {
  return (
    <BrowserFrame>
      <div className="p-6 min-h-[400px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Welcome back, Sarah!</h3>
            <p className="text-sm text-muted-foreground">Here's your launch overview</p>
          </div>
          <div className="bg-accent text-accent-foreground px-3 py-1.5 rounded-lg text-sm font-medium">
            + New Project
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { icon: FolderOpen, label: "Active Projects", value: "3", color: "text-blue-500" },
            { icon: CheckSquare, label: "Tasks Due", value: "12", color: "text-amber-500" },
            { icon: Calendar, label: "Upcoming Launches", value: "2", color: "text-green-500" },
            { icon: TrendingUp, label: "Content Pieces", value: "28", color: "text-purple-500" },
          ].map((stat, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4">
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Recent Projects */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <LayoutDashboard className="w-4 h-4 text-accent" />
            <span className="font-medium text-foreground">Recent Projects</span>
          </div>
          <div className="space-y-3">
            {[
              { name: "Summer Coaching Program", status: "Active", progress: 75 },
              { name: "Digital Course Launch", status: "Planning", progress: 30 },
              { name: "Membership Site", status: "Active", progress: 50 },
            ].map((project, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <div className="font-medium text-sm text-foreground">{project.name}</div>
                  <div className="text-xs text-muted-foreground">{project.status}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent rounded-full" 
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{project.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
};
