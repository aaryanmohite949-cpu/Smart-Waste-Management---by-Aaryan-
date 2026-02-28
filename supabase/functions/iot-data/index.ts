import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { property_id, wet_waste_weight, dry_waste_weight, segregation_correct } = await req.json();

    if (!property_id || wet_waste_weight == null || dry_waste_weight == null || segregation_correct == null) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: property_id, wet_waste_weight, dry_waste_weight, segregation_correct" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify property exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("property_id")
      .eq("property_id", property_id)
      .single();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: "Property ID not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert waste record (trigger handles points calculation)
    const { data, error } = await supabase
      .from("daily_waste_records")
      .insert({
        property_id,
        wet_waste_weight,
        dry_waste_weight,
        segregation_correct,
      })
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, record: data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
