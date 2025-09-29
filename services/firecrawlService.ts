import { FIRECRAWL_API_KEY } from '../constants';
import { CrawlData } from '../types';

const API_URL = 'https://api.firecrawl.dev/v0/scrape';

export const crawlUrl = async (url: string): Promise<CrawlData[]> => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url: url,
        pageOptions:{
            onlyMainContent: false,
        }
      }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData?.error || 'Unknown error';
        throw new Error(`Firecrawl API error: ${response.status} ${response.statusText} - ${errorMessage}`);
    }

    const result = await response.json();
    
    if (result.success && result.data) {
        // The scrape endpoint returns a single object, but the app expects an array.
        // We'll wrap it in an array to maintain the expected data structure.
        return [{
            markdown: result.data.markdown,
            url: result.data.metadata.sourceURL,
        }];
    } else {
        throw new Error('Firecrawl did not return successful data.');
    }
  } catch (error) {
    console.error('Error scraping URL with Firecrawl:', error);
    throw new Error('Failed to scrape the provided URL.');
  }
};