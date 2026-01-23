import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

/**
 * SurecartRedirect handles legacy portal_url redirects from SureCart.
 * 
 * If SureCart's portal_url points to our domain (e.g., /surecart/redirect/...),
 * this route catches it and forwards users to the correct checkout page.
 * 
 * Expected URL patterns:
 * - /surecart/redirect/checkouts/{checkout_id}
 * - /surecart/redirect?checkout_id={checkout_id}
 */
const SurecartRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Extract checkout ID from path or query params
    const pathMatch = location.pathname.match(/\/surecart\/redirect\/checkouts\/([a-zA-Z0-9-]+)/);
    const searchParams = new URLSearchParams(location.search);
    
    const checkoutId = pathMatch?.[1] || searchParams.get("checkout_id");

    if (checkoutId) {
      // Redirect to SureCart's hosted checkout
      const surecartUrl = `https://checkout.surecart.com/checkout/${checkoutId}`;
      console.log("[SurecartRedirect] Forwarding to:", surecartUrl);
      window.location.href = surecartUrl;
    } else {
      // No checkout ID found - show error or redirect to checkout page
      console.error("[SurecartRedirect] No checkout ID found in URL:", location.pathname + location.search);
      setError("Invalid redirect. No checkout ID found.");
      
      // Redirect to checkout page after a delay
      setTimeout(() => {
        navigate("/checkout", { replace: true });
      }, 3000);
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {error ? (
          <>
            <p className="text-destructive">{error}</p>
            <p className="text-muted-foreground text-sm">Redirecting to checkout...</p>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Redirecting to payment...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default SurecartRedirect;
