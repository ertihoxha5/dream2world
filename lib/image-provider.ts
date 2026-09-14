import type { Dream } from './dreams';
export interface ImageProvider {
  generate(input: {
    prompt: string;
    scene: number;
  }): Promise<{ url: string; provider: string }>;
}
export class PreviewImageProvider implements ImageProvider {
  async generate(_input: { prompt: string; scene: number }) {
    return { url: '/dream-worlds.png', provider: 'preview' };
  }
}
// Custom providers should return a durable HTTPS URL from their storage layer.
export class HttpImageProvider implements ImageProvider {
  constructor(
    private endpoint: string,
    private apiKey: string,
  ) {}
  async generate(input: { prompt: string; scene: number }) {
    const r = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(45000),
    });
    if (!r.ok) throw new Error('Image provider failed');
    const result = (await r.json()) as { url?: unknown };
    if (typeof result.url !== 'string' || !result.url.startsWith('https://'))
      throw new Error('Image provider returned an invalid URL');
    return { url: result.url, provider: 'custom' };
  }
}
export const dreamImagePrompt = (dream: Dream) =>
  `Cinematic dream concept art: ${dream.summary}. Atmosphere: ${dream.mood}. No text, no interface, no watermark.`;
