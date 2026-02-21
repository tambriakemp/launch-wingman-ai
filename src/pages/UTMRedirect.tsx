import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

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
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/utm-redirect?code=${encodeURIComponent(code)}`,
          { headers: { "Content-Type": "application/json" } }
        );

        if (!response.ok) {
          console.error("utm-redirect failed:", response.status);
          setError(true);
          return;
        }

        const result = await response.json();
        if (result.destination) {
          window.location.href = result.destination;
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("utm-redirect error:", err);
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
