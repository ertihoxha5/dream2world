export async function GET() {
  return Response.json(
    {
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseKey: process.env.SUPABASE_ANON_KEY || '',
      aiEnabled: !!process.env.OPENAI_API_KEY,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
