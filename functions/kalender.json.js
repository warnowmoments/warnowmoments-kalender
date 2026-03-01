export async function onRequest(context) {
  // SUPABASE Zugangsdaten (deine anonymen Keys)
  const SUPABASE_URL = 'https://fnktiyujyznbbhwkeyww.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZua3RpeXVqeXpuYmJod2tleXd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA1MjM2MDAsImV4cCI6MjA0NjA5OTYwMH0.publishablecJyOwgz2NXfDiTj7mRUVrQVMAMoVdd';

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/wm_public_calendar?select=start_time,end_time,status,title&status=in.(confirmed,reserved)&apikey=${SUPABASE_ANON_KEY}`
    );
    const data = await response.json();

    const calendarData = {
      generatedAt: new Date().toISOString(),
      resourceId: 'floss_1',
      events: data.map(event => ({
        title: event.title,
        start: event.start_time,
        end: event.end_time,
        status: event.status
      }))
    };

    return new Response(JSON.stringify(calendarData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Kalender-Laden fehlgeschlagen', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
