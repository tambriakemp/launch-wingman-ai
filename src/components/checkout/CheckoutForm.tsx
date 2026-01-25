import { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CheckoutFormProps {
  displayPrice: number;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  couponCode?: string;
  isUpgrade: boolean;
  userId?: string;
  validateForm: () => boolean;
  onSuccess: () => void;
}

const CheckoutForm = ({ 
  displayPrice, 
  email,
  firstName,
  lastName,
  password,
  couponCode,
  isUpgrade,
  userId,
  validateForm,
  onSuccess 
}: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    // Validate form fields first
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Submit the elements to validate payment details
      const { error: submitError } = await elements.submit();
      if (submitError) {
        toast.error(submitError.message || "Please check your payment details");
        setIsProcessing(false);
        return;
      }

      // Step 2: Create subscription (this creates user + Stripe customer + subscription)
      const { data, error } = await supabase.functions.invoke('create-subscription-intent', {
        body: {
          email,
          firstName,
          lastName,
          password: isUpgrade ? undefined : password,
          couponCode,
          isUpgrade,
          userId,
        }
      });

      if (error || !data?.success || !data?.clientSecret) {
        throw new Error(data?.error || error?.message || "Failed to create subscription");
      }

      // Step 3: Confirm payment with the returned clientSecret
      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret: data.clientSecret,
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <PaymentElement 
          options={{
            layout: "tabs",
          }}
          onReady={() => console.log("PaymentElement ready")}
        />
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Lock className="w-3 h-3" />
        <span>Secure payment powered by Stripe</span>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!stripe || isProcessing}
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
};

export default CheckoutForm;
