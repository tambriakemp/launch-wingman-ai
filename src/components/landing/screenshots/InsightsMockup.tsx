import { motion } from "framer-motion";
import { TrendingUp, Users, Mail, DollarSign, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { BrowserFrame } from "../BrowserFrame";

const metrics = [
  { 
    label: "Email List", 
    start: "1,240", 
    end: "2,890", 
    change: "+133%", 
    trend: "up",
    icon: Mail 
  },
  { 
    label: "Instagram", 
    start: "3,450", 
    end: "5,120", 
    change: "+48%", 
    trend: "up",
    icon: Users 
  },
  { 
    label: "Revenue", 
    start: "$2,400", 
    end: "$12,500", 
    change: "+421%", 
    trend: "up",
    icon: DollarSign 
  },
];

const chartData = [
  { month: "Jan", value: 20 },
  { month: "Feb", value: 35 },
  { month: "Mar", value: 30 },
  { month: "Apr", value: 45 },
  { month: "May", value: 55 },
  { month: "Jun", value: 70 },
];

export const InsightsMockup = () => {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <ArrowUp className="w-3 h-3" />;
      case "down":
        return <ArrowDown className="w-3 h-3" />;
      default:
        return <Minus className="w-3 h-3" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up":
        return "text-green-600 bg-green-100";
      case "down":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <BrowserFrame>
      <div className="p-4 space-y-4 bg-gray-50 min-h-[320px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Launch Insights</h3>
              <p className="text-xs text-gray-500">Q1 2024 Launch</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">Starting</span>
            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Ending</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg p-3 border border-gray-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center">
                  <metric.icon className="w-3 h-3 text-gray-600" />
                </div>
                <span className="text-xs font-medium text-gray-600">{metric.label}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-gray-400">Start</span>
                  <span className="text-sm font-medium text-gray-700">{metric.start}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-gray-400">End</span>
                  <span className="text-sm font-bold text-gray-900">{metric.end}</span>
                </div>
                <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${getTrendColor(metric.trend)}`}>
                  {getTrendIcon(metric.trend)}
                  {metric.change}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-700">Growth Over Time</span>
            <span className="text-xs text-gray-500">Last 6 months</span>
          </div>
          <div className="flex items-end gap-2 h-20">
            {chartData.map((item, index) => (
              <motion.div
                key={item.month}
                initial={{ height: 0 }}
                animate={{ height: `${item.value}%` }}
                transition={{ delay: 0.3 + index * 0.05, duration: 0.4 }}
                className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t relative group"
              >
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-medium text-gray-600">{item.value}%</span>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {chartData.map((item) => (
              <span key={item.month} className="text-[10px] text-gray-400 flex-1 text-center">
                {item.month}
              </span>
            ))}
          </div>
        </div>

        {/* Playbook Note */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 border border-purple-200">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[10px]">📚</span>
            </div>
            <div>
              <p className="text-xs font-medium text-purple-800">Playbook Pattern Detected</p>
              <p className="text-[10px] text-purple-600">Your email sequences performed 2.3x better than industry average</p>
            </div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
};
