import { motion } from "framer-motion";
import { Sparkles, Copy, Check, AtSign, FileText, Mail, ChevronRight } from "lucide-react";
import { BrowserFrame } from "../BrowserFrame";

const platforms = [
  { name: "Instagram", chars: "150", active: true },
  { name: "Facebook", chars: "101", active: false },
  { name: "LinkedIn", chars: "220", active: false },
];

export const MessagingMockup = () => {
  return (
    <BrowserFrame>
      <div className="p-4 space-y-4 bg-gray-50 min-h-[340px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <AtSign className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Social Bio Builder</h3>
              <p className="text-xs text-gray-500">Create platform-optimized bios</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {platforms.map((p) => (
              <button
                key={p.name}
                className={`px-2.5 py-1 text-xs rounded-full transition-all ${
                  p.active
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Bio Preview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-4 border border-gray-200"
        >
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs font-medium text-gray-500">Generated Bio</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">142/150</span>
              <button className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors">
                <Copy className="w-3 h-3" />
                Copy
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-800 leading-relaxed">
            Helping busy professionals go from overwhelmed to organized in 90 days 📈
            <br />
            <span className="text-gray-600">Productivity Coach | Speaker | Author</span>
            <br />
            <span className="text-blue-600">👇 Free guide below</span>
          </p>
        </motion.div>

        {/* Formula Selector */}
        <div className="bg-white rounded-xl p-3 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">Bio Formula</span>
            <span className="text-xs text-pink-600 font-medium">3 formulas available</span>
          </div>
          <div className="flex gap-2">
            {["Transformation", "Authority", "Results"].map((formula, i) => (
              <motion.button
                key={formula}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 py-2 text-xs rounded-lg border transition-all ${
                  i === 0
                    ? "border-pink-500 bg-pink-50 text-pink-700 font-medium"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {formula}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-2">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-lg p-3 border border-gray-200 cursor-pointer group"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                <FileText className="w-3 h-3 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-gray-800">Sales Copy</span>
            </div>
            <p className="text-[10px] text-gray-500">4 pages ready</p>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-lg p-3 border border-gray-200 cursor-pointer group"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center">
                <Mail className="w-3 h-3 text-purple-600" />
              </div>
              <span className="text-xs font-medium text-gray-800">Email Sequences</span>
            </div>
            <p className="text-[10px] text-gray-500">2 sequences saved</p>
          </motion.div>
        </div>

        {/* AI Generate */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Regenerate with AI
        </motion.button>
      </div>
    </BrowserFrame>
  );
};
