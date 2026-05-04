import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<"loading" | "valid" | "invalid" | "already" | "success" | "error">("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`;
    fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } })
      .then((r) => r.json())
      .then((data) => {
        if (data.valid === false && data.reason === "already_unsubscribed") setState("already");
        else if (data.valid) setState("valid");
        else setState("invalid");
      })
      .catch(() => setState("error"));
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
    setSubmitting(false);
    if (error) setState("error");
    else if (data?.reason === "already_unsubscribed") setState("already");
    else setState("success");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-card border rounded-2xl p-8 text-center space-y-4">
        <h1 className="font-display text-2xl">Unsubscribe</h1>
        {state === "loading" && <p className="text-muted-foreground">Verifying your link…</p>}
        {state === "invalid" && <p className="text-muted-foreground">This link is invalid or has expired.</p>}
        {state === "already" && <p className="text-muted-foreground">You've already unsubscribed.</p>}
        {state === "valid" && (
          <>
            <p className="text-muted-foreground">Click below to confirm you want to unsubscribe from these emails.</p>
            <Button onClick={confirm} disabled={submitting} className="w-full">
              {submitting ? "Unsubscribing…" : "Confirm Unsubscribe"}
            </Button>
          </>
        )}
        {state === "success" && <p className="text-foreground">You've been unsubscribed. Sorry to see you go.</p>}
        {state === "error" && <p className="text-destructive">Something went wrong. Please try again.</p>}
      </div>
    </div>
  );
}
