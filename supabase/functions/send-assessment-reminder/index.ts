import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReminderRequest {
  email: string;
  assessmentType: string;
  completedAt: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, assessmentType, completedAt }: ReminderRequest = await req.json();

    console.log(`Scheduling reminder for ${email} - Assessment: ${assessmentType}`);

    const completedDate = new Date(completedAt);
    const reminderDate = new Date(completedDate);
    reminderDate.setDate(reminderDate.getDate() + 90);

    // Send confirmation email using Resend API directly
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Coach Hub <onboarding@resend.dev>",
        to: [email],
        subject: `Reminder Scheduled: Revisit "${assessmentType}" in 90 Days`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #7c3aed, #06b6d4); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
              .header h1 { color: white; margin: 0; font-size: 24px; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
              .highlight { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed; }
              .date { font-size: 18px; font-weight: bold; color: #7c3aed; }
              .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Reminder Scheduled!</h1>
              </div>
              <div class="content">
                <p>Hi there!</p>
                
                <p>Great job completing the <strong>"${assessmentType}"</strong> assessment on ${completedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}!</p>
                
                <div class="highlight">
                  <p><strong>Mark your calendar!</strong></p>
                  <p class="date">We'll remind you to revisit this assessment on ${reminderDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                
                <p>Taking this assessment again in 90 days will help you:</p>
                <ul>
                  <li>Track your progress and growth</li>
                  <li>See how your approach has evolved</li>
                  <li>Identify new areas for improvement</li>
                  <li>Celebrate the shifts you've made</li>
                </ul>
                
                <p>Keep up the great work on your coaching journey!</p>
                
                <div class="footer">
                  <p>— The Coach Hub Team</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const emailResponse = await res.json();
    console.log("Confirmation email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Reminder scheduled",
        reminderDate: reminderDate.toISOString() 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-assessment-reminder function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
