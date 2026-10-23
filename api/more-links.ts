import { MoreLinksResponse } from '../types';
import { findMoreLinks } from '../server/gemini';
import { HttpError, handle, readJson } from '../server/http';

// POST /api/more-links { name, bio, existingUrls } -> { links, sources }
export const POST = handle(async (request): Promise<MoreLinksResponse> => {
  const body = await readJson<{ name?: unknown; bio?: unknown; existingUrls?: unknown }>(request);
  if (typeof body.name !== 'string' || !body.name.trim()) {
    throw new HttpError(400, 'A profile name is required.');
  }
  const existingUrls = Array.isArray(body.existingUrls)
    ? body.existingUrls.filter((u): u is string => typeof u === 'string').slice(0, 100)
    : [];

  return findMoreLinks(
    { name: body.name.slice(0, 80), bio: typeof body.bio === 'string' ? body.bio.slice(0, 200) : '' },
    existingUrls
  );
});
