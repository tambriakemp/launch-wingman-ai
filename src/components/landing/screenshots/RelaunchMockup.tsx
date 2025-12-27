import { motion } from "framer-motion";
import { RefreshCw, Check, RotateCcw, Sparkles, ArrowRight } from "lucide-react";
import { BrowserFrame } from "../BrowserFrame";

const keepSections = [
  { label: "Target Audience", description: "Busy professionals", checked: true },
  { label: "Problem Statement", description: "Time management struggles", checked: true },
  { label: "Transformation", description: "From overwhelmed to organized", checked: true },
];

const revisitSections = [
  { label: "Messaging", description: "Social bios & copy", checked: true },
  { label: "Content Direction", description: "Topics & themes", checked: false },
  { label: "Funnel Configuration", description: "Offer stack & pricing", checked: true },
];

export const RelaunchMockup = () => {
  return (
    <BrowserFrame>
      <div className="p-4 space-y-4 bg-gray-50 min-h-[320px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Relaunch Project</h3>
              <p className="text-xs text-gray-500">"Q1 Coaching Launch" → New Version</p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 rounded-full border-2 border-amber-300 border-t-amber-500"
          />
        </div>

        {/* Memory Selection */}
        <div className="grid grid-cols-2 gap-4">
          {/* Keep Sections */}
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded bg-green-100 flex items-center justify-center">
                <Check className="w-3 h-3 text-green-600" />
              </div>
              <span className="text-xs font-semibold text-green-700">Keep (Foundation)</span>
            </div>
            <div className="space-y-2">
              {keepSections.map((section, index) => (
                <motion.div
                  key={section.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-2 p-2 bg-green-50 rounded border border-green-100"
                >
                  <div className="w-4 h-4 rounded border-2 border-green-500 bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-800">{section.label}</p>
                    <p className="text-[10px] text-gray-500">{section.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Revisit Sections */}
          <div className="bg-white rounded-lg p-3 border border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded bg-amber-100 flex items-center justify-center">
                <RotateCcw className="w-3 h-3 text-amber-600" />
              </div>
              <span className="text-xs font-semibold text-amber-700">Revisit (Refresh)</span>
            </div>
            <div className="space-y-2">
              {revisitSections.map((section, index) => (
                <motion.div
                  key={section.label}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-start gap-2 p-2 rounded border ${
                    section.checked
                      ? "bg-amber-50 border-amber-100"
                      : "bg-gray-50 border-gray-100"
                  }`}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    section.checked
                      ? "border-amber-500 bg-amber-500"
                      : "border-gray-300 bg-white"
                  }`}>
                    {section.checked && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-800">{section.label}</p>
                    <p className="text-[10px] text-gray-500">{section.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Fresh Start Option */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-purple-100 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-purple-800">Or start completely fresh</p>
                <p className="text-[10px] text-purple-600">Begin with a blank slate</p>
              </div>
            </div>
            <div className="w-8 h-4 bg-gray-200 rounded-full relative">
              <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow" />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
        >
          Start Relaunch
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </BrowserFrame>
  );
};
