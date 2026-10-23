import { Layout, Link, UserProfile } from '../types';
import { safeHostname } from './url';

// Builds a self-contained link-in-bio page (inline CSS, no external assets) that
// can be dropped on any static host: GitHub Pages, Netlify, an S3 bucket.

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const safeHref = (url: string | undefined) => {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? escapeHtml(parsed.toString()) : '';
  } catch {
    return '';
  }
};

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

const renderLink = (link: Link) => {
  const href = safeHref(link.url);
  if (!href) return '';
  const image = safeHref(link.imageUrl);
  return `
      <a class="link" href="${href}" target="_blank" rel="noopener noreferrer">
        ${image ? `<img src="${image}" alt="" loading="lazy" onerror="this.remove()">` : ''}
        <span class="text">
          <span class="title">${escapeHtml(link.title)}</span>
          <span class="host">${escapeHtml(safeHostname(link.url))}</span>
        </span>
      </a>`;
};

export const buildProfileHtml = (profile: UserProfile, links: Link[], layout: Layout): string => {
  const accent = profile.profileColor && HEX_COLOR.test(profile.profileColor) ? profile.profileColor : '#a78bfa';
  const avatar = safeHref(profile.logoUrl || profile.avatarUrl);
  const name = escapeHtml(profile.name);
  const columns = layout === Layout.GRID ? 'repeat(auto-fit, minmax(220px, 1fr))' : '1fr';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
  <meta name="description" content="${escapeHtml(profile.bio)}">
  <meta property="og:title" content="${name}">
  <meta property="og:description" content="${escapeHtml(profile.bio)}">
  ${avatar ? `<meta property="og:image" content="${avatar}">` : ''}
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
      background: #111827; color: #f9fafb; display: flex; justify-content: center; padding: 48px 16px; }
    main { width: 100%; max-width: ${layout === Layout.GRID ? '720px' : '480px'}; text-align: center; }
    ${layout === Layout.CARD ? 'main { background: #1f2937; border: 1px solid #374151; border-radius: 16px; padding: 32px 24px; align-self: flex-start; }' : ''}
    .avatar { width: 112px; height: 112px; border-radius: 50%; object-fit: cover; border: 4px solid ${accent}; }
    h1 { font-size: 1.75rem; margin: 16px 0 4px; }
    .location { color: #9ca3af; font-size: 0.875rem; margin: 0; }
    .bio { color: #d1d5db; margin: 16px auto 32px; max-width: 420px; line-height: 1.5; }
    .links { display: grid; grid-template-columns: ${columns}; gap: 12px; }
    .link { display: flex; align-items: center; gap: 12px; padding: 8px; border-radius: 10px; text-decoration: none;
      background: rgba(255,255,255,0.92); color: #1f2937; text-align: left; transition: transform .15s, background .15s; }
    .link:hover, .link:focus-visible { background: #fff; transform: scale(1.02); }
    .link:focus-visible { outline: 3px solid ${accent}; outline-offset: 2px; }
    .link img { width: 48px; height: 48px; border-radius: 6px; object-fit: cover; flex-shrink: 0; background: #f3f4f6; }
    .text { min-width: 0; display: flex; flex-direction: column; padding: 4px; }
    .title { font-weight: 600; }
    .host { font-size: 0.75rem; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    @media (prefers-reduced-motion: reduce) { .link { transition: none; } .link:hover { transform: none; } }
  </style>
</head>
<body>
  <main>
    ${avatar ? `<img class="avatar" src="${avatar}" alt="${name}">` : ''}
    <h1>${name}</h1>
    ${profile.location ? `<p class="location">${escapeHtml(profile.location)}</p>` : ''}
    <p class="bio">${escapeHtml(profile.bio)}</p>
    <nav class="links">${links.map(renderLink).join('')}
    </nav>
  </main>
</body>
</html>
`;
};

export const downloadProfileHtml = (profile: UserProfile, links: Link[], layout: Layout) => {
  const html = buildProfileHtml(profile, links, layout);
  const slug = profile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'profile';
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${slug}-links.html`;
  anchor.click();
  URL.revokeObjectURL(url);
};
