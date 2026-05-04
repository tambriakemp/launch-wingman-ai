import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendLovableEmail } from "../_shared/send-email.ts";

const SUPPORT_EMAIL = "hello@launchely.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AgentReplyRequest {
  type?: "agent_reply";
  ticketId: string;
  userEmail: string;
  agentName: string;
  message: string;
}

interface NewTicketRequest {
  type: "new_ticket";
  ticketId: string;
  userEmail: string;
  userName: string;
  subject: string;
  message: string;
  userTier: string;
}

type TicketNotificationRequest = AgentReplyRequest | NewTicketRequest;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: TicketNotificationRequest = await req.json();
    const appUrl = Deno.env.get("APP_URL") || "https://app.launchely.com";

    if (body.type === "new_ticket") {
      const { ticketId, userEmail, userName, subject, message, userTier } = body;
      console.log("Sending new ticket notification:", ticketId);

      const adminUrl = `${appUrl}/admin`;
      const truncatedMessage = message.length > 500 ? message.substring(0, 500) + "..." : message;

      await sendLovableEmail({
        to: SUPPORT_EMAIL,
        subject: `[New Ticket] ${subject} - ${userTier.toUpperCase()} user`,
        heading: "New Support Ticket",
        bodyHtml: `
          <p>A new support ticket has been submitted.</p>
          <p><strong>From:</strong> ${userName} (${userEmail}) — ${userTier.toUpperCase()}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; white-space: pre-wrap;">${truncatedMessage}</div>
        `,
        ctaText: "View in Admin Dashboard",
        ctaUrl: adminUrl,
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { ticketId, userEmail, agentName, message } = body as AgentReplyRequest;
    console.log("Sending ticket reply notification to:", userEmail);

    const ticketUrl = `${appUrl}/help/ticket/${ticketId}`;
    const truncatedMessage = message.length > 500 ? message.substring(0, 500) + "..." : message;

    await sendLovableEmail({
      to: userEmail,
      subject: "New reply to your support ticket",
      heading: "New Reply to Your Ticket",
      bodyHtml: `
        <p>Hi there,</p>
        <p><strong>${agentName}</strong> has replied to your support ticket:</p>
        <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; white-space: pre-wrap;">${truncatedMessage}</div>
        <p style="margin-top: 16px; font-size: 14px; color: #6b7280;">If you have any questions, simply reply to the ticket.</p>
        <p>Best regards,<br>The Launchely Support Team</p>
      `,
      ctaText: "View Full Conversation",
      ctaUrl: ticketUrl,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending ticket notification:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
