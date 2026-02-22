export async function onRequestPost({ request }) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response("POST only", { headers: corsHeaders });
  }

  try {
    const data = await request.json(); // ✅ data initialisiert!
    console.log("POST erhalten:", data);

    // 1. Supabase speichern
    const supabaseUrl = "https://your-project.supabase.co/rest/v1/reservierungen"; // Deine URL!
    const supabaseKey = "your-anon-key"; // Dein Key!

    const dbRes = await fetch(supabaseUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify(data)
    });

    if (!dbRes.ok) {
      console.error("Supabase Fehler:", dbRes.status);
    }

    // 2. Mail senden (Mailchannels)
    const mailData = {
      personalizations: [{
        to: [{ email: "kontakt@warnowmoments.de" }]
      }],
      from: { email: data.email, name: data.name },
      subject: `Reservierung: ${data.datum} - ${data.paket}`,
      content: [{
        type: "text/plain",
        value: `
NEUE RESERVIERUNG Warnow Moments!

Datum: ${data.datum}
Paket: ${data.paket} (${data.startzeit})
Name: ${data.name}
Email: ${data.email}
Tel: ${data.telefon}
Nachricht: ${data.nachricht || '-'}

Supabase-ID: ${Date.now()}
        `
      }]
    };

    const mailRes = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mailData)
    });

    const mailOk = mailRes.ok;
    console.log("Mail:", mailOk ? "✓" : "✗", await mailRes.text());

    return new Response(JSON.stringify({ 
      ok: true, 
      mail: mailOk,
      db: dbRes.ok 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Worker Fehler:", error);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
