import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { location, potholeCount, timestamp, deviceId, distanceCovered } = await req.json();

    if (!location || !location.latitude || !location.longitude || !potholeCount) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("Pothole report received:", {
      location,
      potholeCount,
      timestamp,
      deviceId,
      distanceCovered,
    });

    const reportData = {
      deviceId: deviceId || "unknown",
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      potholeCount,
      distanceCovered: distanceCovered || 0,
      timestamp: timestamp || new Date().toISOString(),
      status: "pending",
      receivedAt: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: "Report received successfully",
        data: reportData,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error processing report:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});