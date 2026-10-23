// Links come from an LLM, so never assume a URL parses.
export const safeHostname = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

export const fallbackImageUrl = (label: string, background = '27272a') =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&size=100&background=${background}&color=fff&font-size=0.33`;
