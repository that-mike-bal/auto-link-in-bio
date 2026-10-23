import { GravatarProfile } from '../types';
import { getGravatarProfile } from '../server/gravatar';
import { handle, readJson, validateEmail } from '../server/http';

// POST /api/gravatar { email } -> GravatarProfile | null
// Used to refresh the preview after the user edits their Gravatar profile.
export const POST = handle(async (request): Promise<GravatarProfile | null> => {
  const body = await readJson<{ email?: unknown }>(request);
  return getGravatarProfile(validateEmail(body.email));
});
