import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowRight, X } from "lucide-react";

interface RelaunchIntentScreenProps {
  projectName: string;
  onContinue: () => void;
  onCancel: () => void;
}

export function RelaunchIntentScreen({
  projectName,
  onContinue,
  onCancel,
}: RelaunchIntentScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto py-12 px-4"
    >
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="pt-10 pb-10 text-center space-y-6">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center"
          >
            <RefreshCw className="w-8 h-8 text-primary" />
          </motion.div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">
              Ready to relaunch?
            </h1>
            <p className="text-sm text-muted-foreground">
              "{projectName}"
            </p>
          </div>

          {/* Body copy */}
          <div className="space-y-3 text-muted-foreground max-w-sm mx-auto">
            <p>You don't need to start over.</p>
            <p>
              We'll help you reuse what still fits — and gently revisit what
              might need attention.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={onContinue} className="gap-2">
              Start relaunch
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={onCancel}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
