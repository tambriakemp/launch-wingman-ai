import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { name, description, privacy = 'PUBLIC', environment, sandboxToken } = await req.json();

    if (!name) {
      return new Response(
        JSON.stringify({ error: 'Board name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isSandbox = environment === 'sandbox';
    let accessToken: string | null = null;

    // Use manual sandbox token if provided for sandbox environment
    if (isSandbox && sandboxToken) {
      accessToken = sandboxToken;
      console.log('Using manual sandbox token for board creation');
    } else {
      // Get OAuth token from database
      const { data: connection, error: connError } = await supabase
        .from('social_connections_decrypted')
        .select('access_token')
        .eq('user_id', user.id)
        .eq('platform', 'pinterest')
        .single();

      if (connError || !connection?.access_token) {
        console.error('No Pinterest connection found:', connError);
        return new Response(
          JSON.stringify({ error: 'Pinterest not connected. Please connect your Pinterest account first.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      accessToken = connection.access_token;
    }

    const baseUrl = isSandbox ? 'https://api-sandbox.pinterest.com' : 'https://api.pinterest.com';
    console.log(`Creating board "${name}" on ${baseUrl}`);

    const boardData: Record<string, string> = { name };
    if (description) boardData.description = description;
    if (privacy) boardData.privacy = privacy;

    const response = await fetch(`${baseUrl}/v5/boards`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(boardData),
    });

    const responseText = await response.text();
    console.log('Pinterest API response status:', response.status);
    console.log('Pinterest API response:', responseText);

    if (!response.ok) {
      let errorMessage = 'Failed to create board';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        errorMessage = responseText || errorMessage;
      }
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const board = JSON.parse(responseText);
    console.log('Board created successfully:', board.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        board: {
          id: board.id,
          name: board.name,
          description: board.description,
          privacy: board.privacy,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create board';
    console.error('Error creating Pinterest board:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
