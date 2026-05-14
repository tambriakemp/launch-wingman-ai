import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Loader2, Mail, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const checkoutId = searchParams.get("checkout_id");
  const { user, checkSubscription } = useAuth();

  // Existing session = upgrade from native or already-signed-in web user.
  // No session = fresh signup-plus-pay flow from the embedded web checkout.
  const isExistingUserUpgrade = !!user;

  useEffect(() => {
    // Give the Stripe webhook time to write the new subscription row, then
    // refresh client state so gates unlock immediately.
    const timer = setTimeout(async () => {
      if (isExistingUserUpgrade) {
        try {
          await checkSubscription();
        } catch (err) {
          console.error("[CheckoutSuccess] subscription refresh failed", err);
        }
      }
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isExistingUserUpgrade, checkSubscription]);

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

        {isExistingUserUpgrade ? (
          <>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Welcome to Pro!
            </h1>
            <p className="text-muted-foreground mb-6">
              Your subscription is active and all Pro features are unlocked.
            </p>

            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-primary mb-2">
                <Sparkles className="h-5 w-5" />
                <span className="font-medium">You're all set</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Jump back into your launches — everything is ready when you are.
              </p>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link to="/app">
                  Continue to App
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button variant="outline" asChild className="w-full">
                <Link to="/settings">Manage Subscription</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
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
                <Link to="/">Return to Home</Link>
              </Button>
            </div>
          </>
        )}

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
