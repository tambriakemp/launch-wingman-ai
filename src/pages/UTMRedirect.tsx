import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const UTMRedirect = () => {
  const { code } = useParams<{ code: string }>();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!code) {
      setError(true);
      return;
    }

    const redirect = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("utm-redirect", {
          body: null,
          method: "GET",
        });

        // Use fetch directly since functions.invoke doesn't support query params well
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/utm-redirect?code=${encodeURIComponent(code)}`,
          { headers: { "Content-Type": "application/json" } }
        );

        if (!response.ok) {
          setError(true);
          return;
        }

        const result = await response.json();
        if (result.destination) {
          window.location.href = result.destination;
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      }
    };

    redirect();
  }, [code]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">This link is invalid or has expired.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
};

export default UTMRedirect;
