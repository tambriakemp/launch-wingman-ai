import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendLovableEmail } from "../_shared/send-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactFormRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message }: ContactFormRequest = await req.json();

    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({ error: "All fields are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (name.length > 100 || email.length > 255 || subject.length > 200 || message.length > 5000) {
      return new Response(JSON.stringify({ error: "Input exceeds maximum length" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`[Contact Form] Received submission from ${email}`);

    await sendLovableEmail({
      to: "hello@launchely.com",
      subject: `[Contact Form] ${subject}`,
      heading: "New Contact Form Submission",
      bodyHtml: `
        <p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <hr />
        <h3>Message:</h3>
        <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
      `,
      footer: "This message was sent via the Launchely contact form.",
    });

    return new Response(JSON.stringify({ success: true, message: "Email sent successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[Contact Form] Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to send message" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
