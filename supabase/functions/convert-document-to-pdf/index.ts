import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConversionResult {
  pdfBase64: string;
  success: boolean;
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[CONVERT-PDF] Function started");

    const { fileBase64, filename } = await req.json();

    if (!fileBase64 || !filename) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: fileBase64, filename" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("[CONVERT-PDF] Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cloudConvertApiKey = Deno.env.get("CLOUDCONVERT_API_KEY");
    if (!cloudConvertApiKey) {
      return new Response(
        JSON.stringify({ error: "CloudConvert API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[CONVERT-PDF] Converting file: ${filename}`);

    // Step 1: Create a CloudConvert job with import, convert, and export tasks
    const jobResponse = await fetch("https://api.cloudconvert.com/v2/jobs", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${cloudConvertApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tasks: {
          "import-file": {
            operation: "import/base64",
            file: fileBase64,
            filename: filename,
          },
          "convert-to-pdf": {
            operation: "convert",
            input: ["import-file"],
            output_format: "pdf",
          },
          "export-result": {
            operation: "export/url",
            input: ["convert-to-pdf"],
            inline: false,
            archive_multiple_files: false,
          },
        },
        tag: "launchely-document-conversion",
      }),
    });

    if (!jobResponse.ok) {
      const errorText = await jobResponse.text();
      console.error(`[CONVERT-PDF] CloudConvert job creation failed: ${errorText}`);
      return new Response(
        JSON.stringify({ error: `CloudConvert job creation failed: ${jobResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jobData = await jobResponse.json();
    const jobId = jobData.data.id;
    console.log(`[CONVERT-PDF] Job created: ${jobId}`);

    // Step 2: Poll for job completion
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds max wait
    let jobStatus = "processing";
    let exportTask = null;

    while (attempts < maxAttempts && !["finished", "error"].includes(jobStatus)) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
        headers: {
          "Authorization": `Bearer ${cloudConvertApiKey}`,
        },
      });

      if (!statusResponse.ok) {
        throw new Error(`Failed to check job status: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();
      jobStatus = statusData.data.status;
      
      if (jobStatus === "finished") {
        exportTask = statusData.data.tasks.find((t: any) => t.name === "export-result" && t.status === "finished");
      } else if (jobStatus === "error") {
        const errorTask = statusData.data.tasks.find((t: any) => t.status === "error");
        throw new Error(`Conversion failed: ${errorTask?.message || "Unknown error"}`);
      }
      
      attempts++;
    }

    if (!exportTask || !exportTask.result?.files?.[0]?.url) {
      console.error("[CONVERT-PDF] No export URL found", exportTask);
      return new Response(
        JSON.stringify({ error: "Conversion completed but no export URL found" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Download the converted PDF
    const pdfUrl = exportTask.result.files[0].url;
    console.log(`[CONVERT-PDF] Downloading PDF from: ${pdfUrl}`);

    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to download converted PDF: ${pdfResponse.status}`);
    }

    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    const pdfBytes = new Uint8Array(pdfArrayBuffer);
    
    // Convert to base64
    let binaryString = "";
    for (let i = 0; i < pdfBytes.length; i++) {
      binaryString += String.fromCharCode(pdfBytes[i]);
    }
    const pdfBase64 = btoa(binaryString);

    console.log(`[CONVERT-PDF] Conversion complete. PDF size: ${pdfBytes.length} bytes`);

    const result: ConversionResult = {
      pdfBase64,
      success: true,
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[CONVERT-PDF] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
