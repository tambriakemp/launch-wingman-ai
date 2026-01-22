import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Loader2, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const checkoutId = searchParams.get("checkout_id");

  useEffect(() => {
    // Give the webhook time to process before showing success
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Processing your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-card rounded-2xl shadow-lg border p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-6"
        >
          <CheckCircle className="h-16 w-16 text-primary mx-auto" />
        </motion.div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          Payment Successful!
        </h1>
        
        <p className="text-muted-foreground mb-6">
          Thank you for subscribing to Launchely Pro. Your account is being set up.
        </p>

        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-primary mb-2">
            <Mail className="h-5 w-5" />
            <span className="font-medium">Check your email</span>
          </div>
          <p className="text-sm text-muted-foreground">
            We've sent you an email to set your password. Once you've set it, you can log in and start using Launchely.
          </p>
        </div>

        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link to="/auth">
              Go to Login
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link to="/">
              Return to Home
            </Link>
          </Button>
        </div>

        {checkoutId && (
          <p className="text-xs text-muted-foreground mt-6">
            Order ID: {checkoutId.substring(0, 8)}...
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default CheckoutSuccess;
