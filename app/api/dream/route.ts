import { analyzeDream } from '@/lib/analysis';
import { HttpImageProvider, dreamImagePrompt } from '@/lib/image-provider';
export async function POST(request: Request) {
  let body: { text?: unknown } | null;
  try {
    body = (await request.json()) as { text?: unknown } | null;
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }
  if (
    !body ||
    typeof body.text !== 'string' ||
    body.text.trim().length < 8 ||
    body.text.length > 4000
  )
    return Response.json(
      { error: 'Describe your dream in 8–4000 characters.' },
      { status: 400 },
    );
  try {
    const dream = await analyzeDream(body.text.trim());
    if (process.env.IMAGE_PROVIDER_URL && process.env.IMAGE_PROVIDER_API_KEY) {
      const image = await new HttpImageProvider(
        process.env.IMAGE_PROVIDER_URL,
        process.env.IMAGE_PROVIDER_API_KEY,
      ).generate({ prompt: dreamImagePrompt(dream), scene: dream.scene });
      dream.imageUrl = image.url;
    }
    return Response.json(dream, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json(
      { error: 'Your world could not be created. Please try again.' },
      { status: 502 },
    );
  }
}
