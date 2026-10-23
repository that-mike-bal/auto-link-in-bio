import { createHash } from 'node:crypto';
import { GravatarProfile } from '../types';
import { sanitizeLinks } from './sanitize';

// Gravatar REST API v3. Works without a key (rate limited); GRAVATAR_API_KEY
// raises the limit and returns more fields.
export const getGravatarProfile = async (email: string): Promise<GravatarProfile | null> => {
  const hash = createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
  const headers: Record<string, string> = {};
  if (process.env.GRAVATAR_API_KEY) {
    headers.Authorization = `Bearer ${process.env.GRAVATAR_API_KEY}`;
  }

  try {
    const response = await fetch(`https://api.gravatar.com/v3/profiles/${hash}`, { headers });
    if (!response.ok) return null;
    const data = await response.json();

    const accounts = Array.isArray(data.verified_accounts) ? data.verified_accounts : [];
    const verifiedLinks = sanitizeLinks(
      accounts
        .filter((account: any) => !account.is_hidden)
        .map((account: any) => ({
          url: account.url,
          title: account.service_label,
          description: `Verified on Gravatar`,
          type: 'social',
        }))
    );

    return {
      displayName: data.display_name || '',
      aboutMe: data.description || '',
      currentLocation: data.location || '',
      avatarUrl: data.avatar_url ? `${data.avatar_url}?s=400` : '',
      verifiedLinks,
    };
  } catch (error) {
    console.error('Gravatar lookup failed', error);
    return null;
  }
};
