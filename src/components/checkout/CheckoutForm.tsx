import { useState, forwardRef } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Lock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface CheckoutFormProps {
  displayPrice: number;
  onSuccess: () => void;
  validateForm?: () => boolean;
}

const CheckoutForm = forwardRef<HTMLFormElement, CheckoutFormProps>(({ 
  displayPrice, 
  onSuccess,
  validateForm 
}, ref) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentElementReady, setPaymentElementReady] = useState(false);
  const [paymentElementError, setPaymentElementError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form fields first (account details)
    if (validateForm && !validateForm()) {
      toast.error("Please complete all required fields");
      return;
    }

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Submit the elements to validate payment details
      const { error: submitError } = await elements.submit();
      if (submitError) {
        toast.error(submitError.message || "Please check your payment details");
        setIsProcessing(false);
        return;
      }

      // Confirm payment with the existing clientSecret
      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
        redirect: "if_required",
      });

      if (paymentError) {
        if (paymentError.type === "card_error" || paymentError.type === "validation_error") {
          toast.error(paymentError.message || "Payment failed");
        } else {
          toast.error("An unexpected error occurred");
        }
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        toast.success("Payment successful!");
        onSuccess();
      }
    } catch (err) {
      console.error("Payment error:", err);
      toast.error(err instanceof Error ? err.message : "Payment failed. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <form ref={ref} onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Show skeleton while PaymentElement is loading */}
        {!paymentElementReady && !paymentElementError && (
          <div className="space-y-3">
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
        )}
        
        {/* Show error if PaymentElement failed to load */}
        {paymentElementError && (
          <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Failed to load payment form</p>
              <p className="text-sm">Please refresh the page and try again.</p>
            </div>
          </div>
        )}
        
        <div className={!paymentElementReady && !paymentElementError ? "opacity-0 h-0 overflow-hidden" : ""}>
          <PaymentElement 
            options={{
              layout: "tabs",
            }}
            onReady={() => {
              console.log("[CheckoutForm] PaymentElement ready and mounted");
              setPaymentElementReady(true);
              setPaymentElementError(null);
            }}
            onLoadError={(error) => {
              console.error("[CheckoutForm] PaymentElement failed to load:", error);
              setPaymentElementError(error.error?.message || "Failed to load payment form");
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Lock className="w-3 h-3" />
        <span>Secure payment powered by Stripe</span>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!stripe || isProcessing || !paymentElementReady}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Processing payment...
          </>
        ) : (
          <>
            Subscribe - ${displayPrice.toFixed(2)}/month
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
    </form>
  );
});

CheckoutForm.displayName = "CheckoutForm";

export default CheckoutForm;
