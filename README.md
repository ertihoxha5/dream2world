# Dream2World

Cinematic dream creation and exploration built with React, TypeScript, Tailwind, Framer Motion, Three.js and the Next.js App Router API through Vinext for Cloudflare Workers.

## Run

`npm install` then `npm run dev`. Use the URL printed by Vinext. `npm run build` creates the Worker and assets. `npx tsc --noEmit` checks types.

## Preview and live providers

With no environment variables, the complete UI works with a deterministic, keyword-based creative preview. It uses curated generated art, clearly labels preview worlds, and saves dreams in this browser. Preview analysis is not AI inference. Sound is a synthesized ambient chord, not generated audio.

Copy `.env.example` to `.env` for local configuration. Configure the same keys as runtime secrets in Sites for hosting. Never place service credentials in browser code.

- `OPENAI_API_KEY`: enables server-side OpenAI structured dream analysis. `OPENAI_MODEL` defaults to `gpt-4o-mini` and can be overridden. For managed Sites key provisioning, enable the OpenAI Developers plugin and its `openai-platform-api-key` skill.
- `SUPABASE_URL` and `SUPABASE_ANON_KEY`: enable email-link login and private cloud archives. Use a publishable/anon key, never a service role key. Run `supabase/schema.sql` once. Configure your deployed URL in Supabase Auth Site URL and redirect allowlist. The SDK handles session refresh. Row-level policies isolate all records by user ID; local drafts are not automatically uploaded.
- `IMAGE_PROVIDER_URL` and `IMAGE_PROVIDER_API_KEY`: optional server-side image adapter. The endpoint accepts `{prompt, scene}` and returns `{url: "https://..."}`. Return a durable URL. Without this provider, worlds use the curated scene library.

Live providers need credentials and were not exercised in the credential-free preview. Supabase migration needs to be applied before cloud saves work. Browser automation was unavailable in the environment; HTTP, types, and build checks were used.

## Architecture

`app/page.tsx`: home, world explorer, archive, universe, search and account flows. `lib/dreams.ts`: typed model and offline fixtures. `lib/analysis.ts`: validated structured AI output. `lib/image-provider.ts`: provider abstraction. `components/atmosphere.tsx`: lazy-loaded Three.js particles with reduced-motion support. `supabase/schema.sql`: normalized dream records, synchronization trigger and RLS.

## Artwork

Built-in imagegen created `public/dream-hero.png` and `public/dream-worlds.png`.
Hero prompt: cinematic realistic concept art with floating city and islands, enormous planet, waterfalls into clouds, glowing bridges, navy/cyan/violet twilight and peach sunset, seated traveler on the right, darker negative space on the left; no text or UI.
World sheet prompt: four equal quadrants showing floating sky city, bioluminescent underwater civilization, giant pink tree reflected in a lake, and lonely desert city; cinematic concept art, no text or borders.

## Provider references

- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Supabase email-link login](https://supabase.com/docs/reference/javascript/auth-signinwithotp)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
