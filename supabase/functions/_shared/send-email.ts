// Shared helper to send a transactional email via Lovable Emails.
// Replaces direct Resend calls. Uses the "generic" template registered in
// supabase/functions/_shared/transactional-email-templates/registry.ts
//
// Note: send-transactional-email has verify_jwt = true, so we pass the
// service-role key in Authorization to allow function-to-function calls.

interface SendArgs {
  to: string;
  subject: string;
  heading?: string;
  bodyHtml?: string;
  bodyText?: string;
  ctaText?: string;
  ctaUrl?: string;
  footer?: string;
  replyTo?: string; // currently unused — Lovable Emails picks reply-to from sender
}

export async function sendLovableEmail(args: SendArgs): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    console.error("[sendLovableEmail] Missing SUPABASE_URL or SERVICE_ROLE_KEY");
    return;
  }

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
      body: JSON.stringify({
        templateName: "generic",
        recipientEmail: args.to,
        templateData: {
          subject: args.subject,
          heading: args.heading,
          bodyHtml: args.bodyHtml,
          bodyText: args.bodyText,
          ctaText: args.ctaText,
          ctaUrl: args.ctaUrl,
          footer: args.footer,
        },
      }),
    });
    const text = await res.text();
    if (!res.ok) {
      console.error("[sendLovableEmail] failed:", res.status, text);
    } else {
      console.log("[sendLovableEmail] queued:", text);
    }
  } catch (err) {
    console.error("[sendLovableEmail] error:", err);
  }
}
