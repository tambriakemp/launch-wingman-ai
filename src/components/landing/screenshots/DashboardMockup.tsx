import { motion } from "framer-motion";
import { FolderOpen, CheckSquare, Calendar, TrendingUp, LayoutGrid, Plus, Sparkles, ArrowRight } from "lucide-react";
import { BrowserFrame } from "../BrowserFrame";

export const DashboardMockup = () => {
  return (
    <BrowserFrame>
      <div className="p-5 min-h-[400px] bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <motion.h3 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl font-bold text-gray-900"
            >
              Welcome back, Sarah! 👋
            </motion.h3>
            <p className="text-sm text-gray-500">Here's your launch overview</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-gray-900/20"
          >
            <Plus className="w-4 h-4" />
            New Project
          </motion.button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { icon: FolderOpen, label: "Active Projects", value: "3", gradient: "from-blue-500 to-blue-600" },
            { icon: CheckSquare, label: "Tasks Due", value: "12", gradient: "from-amber-500 to-orange-500" },
            { icon: Calendar, label: "Upcoming", value: "2", gradient: "from-emerald-500 to-green-600" },
            { icon: TrendingUp, label: "Content", value: "28", gradient: "from-violet-500 to-purple-600" },
          ].map((stat, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-2`}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-5 gap-3">
          {/* Recent Projects - takes 3 columns */}
          <div className="col-span-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center">
                  <LayoutGrid className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <span className="font-semibold text-gray-900 text-sm">Recent Projects</span>
              </div>
              <button className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              {[
                { name: "Summer Coaching Program", status: "Active", progress: 75, color: "bg-emerald-500" },
                { name: "Digital Course Launch", status: "Planning", progress: 30, color: "bg-amber-500" },
                { name: "Membership Site", status: "Active", progress: 50, color: "bg-blue-500" },
              ].map((project, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="flex items-center justify-between p-2.5 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${project.color}`} />
                    <div>
                      <div className="font-medium text-sm text-gray-800 group-hover:text-gray-900">{project.name}</div>
                      <div className="text-xs text-gray-400">{project.status}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progress}%` }}
                        transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                        className={`h-full rounded-full ${project.color}`}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{project.progress}%</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick Actions - takes 2 columns */}
          <div className="col-span-2 space-y-3">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl p-4 text-white"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="font-semibold text-sm">AI Suggestion</span>
              </div>
              <p className="text-xs text-white/90 leading-relaxed">
                Your "Summer Coaching" launch is 75% ready. Complete your sales copy to move forward.
              </p>
              <button className="mt-3 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                Continue →
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white rounded-xl p-3 shadow-sm border border-gray-100"
            >
              <div className="text-xs font-medium text-gray-500 mb-2">Next task</div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded border-2 border-amber-500" />
                <span className="text-sm text-gray-800">Write sales page headline</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
};
