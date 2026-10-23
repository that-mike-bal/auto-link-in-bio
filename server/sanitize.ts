import { Link, UserProfile } from '../types';

// Model output is untrusted: URLs can be malformed, relative, or javascript:.
// Everything the client renders passes through these first.

const LINK_TYPES: Link['type'][] = ['social', 'portfolio', 'product', 'contact', 'other'];

export const toHttpUrl = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || !value) return undefined;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};

const text = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const urlKey = (url: string) => url.replace(/\/+$/, '').toLowerCase();

export const sanitizeLinks = (raw: unknown, exclude: string[] = []): Link[] => {
  if (!Array.isArray(raw)) return [];
  const seen = new Set(exclude.map(urlKey));
  const links: Link[] = [];

  for (const item of raw) {
    const url = toHttpUrl(item?.url);
    if (!url || seen.has(urlKey(url))) continue;
    seen.add(urlKey(url));
    links.push({
      url,
      title: text(item.title, 80) || new URL(url).hostname,
      description: text(item.description, 160),
      type: LINK_TYPES.includes(item.type) ? item.type : 'other',
      imageUrl: toHttpUrl(item.imageUrl),
    });
  }
  return links;
};

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export const sanitizeProfile = (raw: any): Omit<UserProfile, 'email'> => ({
  name: text(raw?.name, 80),
  bio: text(raw?.bio, 200),
  location: text(raw?.location, 80),
  avatarUrl: toHttpUrl(raw?.avatarUrl) ?? '',
  logoUrl: toHttpUrl(raw?.logoUrl),
  profileColor: typeof raw?.profileColor === 'string' && HEX_COLOR.test(raw.profileColor) ? raw.profileColor : undefined,
});

// Pulls a JSON array out of free-form model text (e.g. wrapped in ```json fences).
export const extractJsonArray = (textValue: string | undefined): unknown[] => {
  if (!textValue) return [];
  const start = textValue.indexOf('[');
  const end = textValue.lastIndexOf(']');
  if (start === -1 || end <= start) return [];
  try {
    const parsed = JSON.parse(textValue.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
