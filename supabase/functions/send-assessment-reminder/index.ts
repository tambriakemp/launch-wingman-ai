import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendLovableEmail } from "../_shared/send-email.ts";

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, assessmentType, completedAt }: ReminderRequest = await req.json();

    console.log(`Scheduling reminder for ${email} - Assessment: ${assessmentType}`);

    const completedDate = new Date(completedAt);
    const reminderDate = new Date(completedDate);
    reminderDate.setDate(reminderDate.getDate() + 90);

    const fmt = (d: Date) =>
      d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    await sendLovableEmail({
      to: email,
      subject: `Reminder Scheduled: Revisit "${assessmentType}" in 90 Days`,
      heading: "Reminder Scheduled!",
      bodyHtml: `
        <p>Hi there!</p>
        <p>Great job completing the <strong>"${assessmentType}"</strong> assessment on ${fmt(completedDate)}!</p>
        <p><strong>Mark your calendar:</strong> we'll remind you to revisit this assessment on <strong>${fmt(reminderDate)}</strong>.</p>
        <p>Taking this assessment again in 90 days will help you:</p>
        <ul>
          <li>Track your progress and growth</li>
          <li>See how your approach has evolved</li>
          <li>Identify new areas for improvement</li>
          <li>Celebrate the shifts you've made</li>
        </ul>
        <p>Keep up the great work on your coaching journey!</p>
        <p>— The Launchely Team</p>
      `,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Reminder scheduled", reminderDate: reminderDate.toISOString() }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-assessment-reminder function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
