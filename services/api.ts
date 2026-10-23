import { BuildResponse, GravatarProfile, MoreLinksResponse, UserProfile } from '../types';

// The browser only talks to our own /api routes; all third-party keys live
// on the server.
const post = async <T>(path: string, body: unknown): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Network error. Check your connection and try again.');
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || `Request failed (${response.status}).`);
  }
  return data as T;
};

export const buildProfile = (email: string, url: string) =>
  post<BuildResponse>('/api/build', { email, url });

export const findMoreLinks = (profile: UserProfile, existingUrls: string[]) =>
  post<MoreLinksResponse>('/api/more-links', { name: profile.name, bio: profile.bio, existingUrls });

export const refreshGravatar = (email: string) =>
  post<GravatarProfile | null>('/api/gravatar', { email });
