import { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Lock } from "lucide-react";
import { toast } from "sonner";

interface CheckoutFormProps {
  displayPrice: number;
  onSuccess: () => void;
}

const CheckoutForm = ({ displayPrice, onSuccess }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
        redirect: "if_required",
      });

      if (error) {
        if (error.type === "card_error" || error.type === "validation_error") {
          toast.error(error.message || "Payment failed");
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
      toast.error("Payment failed. Please try again.");
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
