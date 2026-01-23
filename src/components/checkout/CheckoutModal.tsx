import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CheckoutModalProps {
  isOpen: boolean;
  checkoutUrl: string;
  onClose: () => void;
}

const CheckoutModal = ({ isOpen, checkoutUrl, onClose }: CheckoutModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      // Reset loading state when modal opens
      setIsLoading(true);
      
      // Disable body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Listen for messages from the iframe (SureCart success redirect)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Check if message is from our checkout domain
      if (event.origin.includes('store.launchely.com')) {
        if (event.data?.type === 'checkout_success' || event.data?.success) {
          navigate('/checkout/success');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleOpenInNewTab = () => {
    window.open(checkoutUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full h-full max-w-4xl max-h-[90vh] m-4 bg-background rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-card">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-foreground">Complete Your Payment</h2>
              {isLoading && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenInNewTab}
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Open in new tab
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 top-[57px] flex items-center justify-center bg-background z-10">
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading secure checkout...</p>
              </div>
            </div>
          )}

          {/* Iframe */}
          <iframe
            src={checkoutUrl}
            className="flex-1 w-full border-0"
            onLoad={handleIframeLoad}
            title="SureCart Checkout"
            allow="payment"
          />

          {/* Footer */}
          <div className="p-3 border-t bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground">
              Secure checkout powered by SureCart • Your payment details are encrypted
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CheckoutModal;
