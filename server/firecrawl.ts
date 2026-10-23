import { HttpError, requireEnv } from './http';

const API_URL = 'https://api.firecrawl.dev/v1/scrape';

export const scrapeMarkdown = async (url: string): Promise<string> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${requireEnv('FIRECRAWL_API_KEY')}`,
    },
    body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: false }),
  });

  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    console.error('Firecrawl error', response.status, result?.error);
    throw new HttpError(502, "We couldn't read that page. Check the URL and try again.");
  }
  return result.data?.markdown ?? '';
};
