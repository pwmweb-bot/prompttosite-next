export async function GET() {
  const PEXELS_KEY = process.env.PEXELS_API_KEY || '';
  return Response.json({ images: PEXELS_KEY ? 'pexels' : 'picsum' });
}
