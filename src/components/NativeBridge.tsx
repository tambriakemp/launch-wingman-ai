import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { initNativeBridge, closeInAppBrowser } from "@/lib/nativeBridge";

export function NativeBridge() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { checkSubscription, user } = useAuth();

  useEffect(() => {
    initNativeBridge({
      onResume: () => {
        queryClient.invalidateQueries();
        if (user) checkSubscription();
      },
      onUrlOpen: (url) => {
        closeInAppBrowser();
        navigate(url.pathname + url.search);
        if (user && url.pathname.startsWith("/checkout/")) {
          checkSubscription();
        }
      },
    });
  }, [navigate, queryClient, checkSubscription, user]);

  return null;
}
