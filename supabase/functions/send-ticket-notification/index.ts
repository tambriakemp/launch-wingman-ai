import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
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
    const appUrl = Deno.env.get("APP_URL") || "https://launchely.com";

    // Handle new ticket notification to support team
    if (body.type === "new_ticket") {
      const { ticketId, userEmail, userName, subject, message, userTier } = body;
      console.log("Sending new ticket notification to support team:", ticketId);

      const adminUrl = `${appUrl}/admin`;
      const tierBadge = userTier === "pro" 
        ? '<span style="background: linear-gradient(135deg, #f59e0b, #ea580c); color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">PRO</span>'
        : '<span style="background: #e5e7eb; color: #6b7280; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">FREE</span>';

      const truncatedMessage = message.length > 500 ? message.substring(0, 500) + "..." : message;

      const emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;"><h1 style="color: white; margin: 0; font-size: 24px;">New Support Ticket</h1></div><div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;"><p style="margin-top: 0;">A new support ticket has been submitted.</p><table style="width: 100%; margin: 20px 0;"><tr><td style="padding: 8px 0; color: #6b7280;">From:</td><td style="padding: 8px 0;"><strong>${userName}</strong> (${userEmail}) ${tierBadge}</td></tr><tr><td style="padding: 8px 0; color: #6b7280;">Subject:</td><td style="padding: 8px 0;"><strong>${subject}</strong></td></tr></table><div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;"><p style="margin: 0; white-space: pre-wrap;">${truncatedMessage}</p></div><div style="text-align: center; margin-top: 30px;"><a href="${adminUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600;">View in Admin Dashboard</a></div></div></body></html>`;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Launchely Support <support@launchely.com>",
          to: [SUPPORT_EMAIL],
          subject: `[New Ticket] ${subject} - ${userTier.toUpperCase()} user`,
          html: emailHtml,
        }),
      });

      const emailResponse = await res.json();
      console.log("New ticket notification sent:", emailResponse);

      return new Response(JSON.stringify({ success: true, id: emailResponse.id }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Handle agent reply notification to user (default behavior)
    const { ticketId, userEmail, agentName, message } = body as AgentReplyRequest;
    console.log("Sending ticket reply notification to:", userEmail);

    const ticketUrl = `${appUrl}/help/ticket/${ticketId}`;
    const truncatedMessage = message.length > 500 ? message.substring(0, 500) + "..." : message;

    const emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;"><h1 style="color: white; margin: 0; font-size: 24px;">New Reply to Your Ticket</h1></div><div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;"><p style="margin-top: 0;">Hi there,</p><p><strong>${agentName}</strong> has replied to your support ticket:</p><div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;"><p style="margin: 0; white-space: pre-wrap;">${truncatedMessage}</p></div><div style="text-align: center; margin-top: 30px;"><a href="${ticketUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600;">View Full Conversation</a></div><p style="margin-top: 30px; font-size: 14px; color: #6b7280;">If you have any questions, simply reply to the ticket.</p><p style="margin-bottom: 0;">Best regards,<br>The Launchely Support Team</p></div></body></html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Launchely Support <support@launchely.com>",
        to: [userEmail],
        subject: "New reply to your support ticket",
        html: emailHtml,
      }),
    });

    const emailResponse = await res.json();
    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, id: emailResponse.id }), {
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
