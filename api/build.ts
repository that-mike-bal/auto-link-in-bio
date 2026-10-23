import { BuildResponse } from '../types';
import { scrapeMarkdown } from '../server/firecrawl';
import { generateLinks, generateProfile } from '../server/gemini';
import { getGravatarProfile } from '../server/gravatar';
import { handle, readJson, validateEmail, validateUrl } from '../server/http';
import { sanitizeLinks } from '../server/sanitize';

// POST /api/build { email, url } -> { profile, links }
export const POST = handle(async (request): Promise<BuildResponse> => {
  const body = await readJson<{ email?: unknown; url?: unknown }>(request);
  const email = validateEmail(body.email);
  const url = validateUrl(body.url);

  const [gravatar, markdown] = await Promise.all([getGravatarProfile(email), scrapeMarkdown(url)]);
  const [profile, crawledLinks] = await Promise.all([
    generateProfile(markdown, gravatar),
    generateLinks(markdown),
  ]);

  return {
    profile: { ...profile, email },
    links: sanitizeLinks([...(gravatar?.verifiedLinks ?? []), ...crawledLinks]),
  };
});
