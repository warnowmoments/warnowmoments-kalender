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

const name = String(data.name || "").trim();
const email = String(data.email || "").trim();
const phone = String(data.phone || data.telefon || "").trim();
const message = String(data.message || data.nachricht || "").trim();
const paket = String(data.paket || "").trim();
const dateRaw = String(data.date || data.datum || "").trim();
const startRaw = String(data.start || data.startzeit || "").trim();

const startDate = (() => {
  const [y, m, d] = dateRaw.split("-").map(Number);
  const [hh, mm] = startRaw.split(":").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0);
})();

const durationHours = paket.includes("8")
  ? 8
  : paket.includes("6")
  ? 6
  : 4;

const endDate = startDate
  ? new Date(startDate.getTime() + durationHours * 60 * 60 * 1000)
  : null;

const datumText = startDate
  ? startDate.toLocaleDateString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    })
  : (dateRaw || "-");

const wochentagText = startDate
  ? startDate.toLocaleDateString("de-DE", { weekday: "long" })
  : "-";

const startzeitText = startDate
  ? startDate.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit"
    })
  : (startRaw || "-");

const endzeitText = endDate
  ? endDate.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit"
    })
  : "-";

    // 2. Mail senden (Mailchannels)
    const mailData = {
  personalizations: [{
    to: [{ email: "kontakt@warnowmoments.de" }]
  }],
  from: { email: "no-reply@mail.warnowmoments.de", name: "Warnow Moments" },
  reply_to: { email: email, name: name },
  subject: `Reservierung: ${name} - ${paket}`,
  content: [{
    type: "text/plain",
    value: `
NEUE RESERVIERUNG Warnow Moments!

Paket: ${paket}
Datum: ${datumText}
Wochentag: ${wochentagText}
Uhrzeit: ${startzeitText} bis ${endzeitText}
Name: ${name}
Email: ${email}
Tel: ${phone}
Nachricht: ${message || '-'}

Supabase-ID: ${Date.now()}
    `.trim()
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
