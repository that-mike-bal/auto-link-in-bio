import { GoogleGenAI, Type } from '@google/genai';
import { GravatarProfile, GroundingSource, Link, UserProfile } from '../types';
import { HttpError, requireEnv } from './http';
import { extractJsonArray, sanitizeLinks, sanitizeProfile } from './sanitize';

const modelName = 'gemini-2.5-flash';
const MAX_CONTENT_CHARS = 8000;

let client: GoogleGenAI | null = null;
const ai = () => (client ??= new GoogleGenAI({ apiKey: requireEnv('GEMINI_API_KEY') }));

const userProfileSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: 'The full name of the person.' },
    bio: { type: Type.STRING, description: 'A short, engaging bio (max 150 characters).' },
    avatarUrl: { type: Type.STRING, description: 'A URL to a high-quality profile picture. Must be a direct image link.' },
    location: { type: Type.STRING, description: "The city and country, e.g., 'San Francisco, USA'." },
    logoUrl: { type: Type.STRING, nullable: true, description: 'A URL for a secondary image or logo, if available. Can be null.' },
    profileColor: { type: Type.STRING, nullable: true, description: "A hex color code (e.g., '#a78bfa') that represents the user's brand. Can be null." },
  },
  required: ['name', 'bio', 'avatarUrl', 'location'],
};

const linksSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      url: { type: Type.STRING, description: 'The full URL of the link.' },
      title: { type: Type.STRING, description: 'A concise, descriptive title for the link.' },
      description: { type: Type.STRING, description: "A brief summary of the link's content (max 100 characters)." },
      type: {
        type: Type.STRING,
        enum: ['social', 'portfolio', 'product', 'contact', 'other'],
        description: 'The category of the link.',
      },
      imageUrl: { type: Type.STRING, nullable: true, description: 'The Open Graph (og:image) or a relevant fallback image URL for the link. Can be null.' },
    },
    required: ['url', 'title', 'description', 'type'],
  },
};

export const generateProfile = async (
  crawlContent: string,
  gravatar: GravatarProfile | null
): Promise<Omit<UserProfile, 'email'>> => {
  const gravatarInfo = gravatar
    ? `
    Here is verified information from the user's Gravatar profile. Prioritize this data:
    - Display Name: ${gravatar.displayName}
    - Bio: ${gravatar.aboutMe}
    - Location: ${gravatar.currentLocation}
    - Avatar URL: ${gravatar.avatarUrl}
  `
    : 'No Gravatar data was found for this user.';

  const prompt = `
    You are an expert personal branding assistant. Analyze the provided information to generate a professional user profile.
    **Instructions:**
    1. Use Gravatar data as the primary source for name, avatar, location and bio. Fallback to the crawled content if Gravatar data is missing.
    2. Create a concise and compelling bio under 150 characters.
    3. If a company or brand logo is prominent on the website, use it for 'logoUrl'. Otherwise, set it to null.
    4. Extract a brand color from the website's design. If none, set 'profileColor' to null.
    5. 'avatarUrl' MUST be a direct link to an image.
    6. Return the data strictly in the specified JSON format.
    ${gravatarInfo}
    **Crawled Website Content:**
    ---
    ${crawlContent.slice(0, MAX_CONTENT_CHARS)}
    ---
  `;

  let raw: unknown;
  try {
    const response = await ai().models.generateContent({
      model: modelName,
      contents: prompt,
      config: { responseMimeType: 'application/json', responseSchema: userProfileSchema },
    });
    raw = JSON.parse(response.text ?? '{}');
  } catch (error) {
    console.error('Gemini profile generation failed', error);
    throw new HttpError(502, 'The AI failed to generate a profile. Please try again.');
  }

  const profile = sanitizeProfile(raw);
  if (gravatar) {
    profile.name ||= gravatar.displayName;
    profile.bio ||= gravatar.aboutMe;
    profile.location ||= gravatar.currentLocation;
    // Gravatar's avatar is a known-good image; the model's guess often isn't.
    profile.avatarUrl = gravatar.avatarUrl || profile.avatarUrl;
  }
  return profile;
};

export const generateLinks = async (crawlContent: string): Promise<Link[]> => {
  const prompt = `
    You are an intelligent web crawler assistant. Extract relevant external links from the provided website content.
    **Instructions:**
    1. Scan the content and identify up to 10 key links (social media, portfolios, products, contact pages).
    2. For each link, provide a clear title, a brief description, a category, and an Open Graph image URL (og:image) if available.
    3. Do NOT include internal navigation links or generic footer links (e.g., 'privacy policy').
    4. Return the data strictly in the specified JSON array format. If no relevant links are found, return an empty array.
    **Crawled Website Content:**
    ---
    ${crawlContent.slice(0, MAX_CONTENT_CHARS)}
    ---
  `;

  try {
    const response = await ai().models.generateContent({
      model: modelName,
      contents: prompt,
      config: { responseMimeType: 'application/json', responseSchema: linksSchema },
    });
    return sanitizeLinks(JSON.parse(response.text ?? '[]'));
  } catch (error) {
    // Links are a nice-to-have on the first pass; the user can search for more.
    console.error('Gemini link extraction failed', error);
    return [];
  }
};

export const findMoreLinks = async (
  profile: Pick<UserProfile, 'name' | 'bio'>,
  existingUrls: string[]
): Promise<{ links: Link[]; sources: GroundingSource[] }> => {
  const prompt = `
    You are an expert researcher. Your task is to find more online links related to a person based on their profile.
    **Instructions:**
    1. Use web search to find additional links for '${profile.name}'.
    2. Look for social media profiles, portfolios, blogs, or company pages that are not already in the list of existing URLs.
    3. For each new link found, provide a url, title, description, a category from ['social', 'portfolio', 'product', 'contact', 'other'], and an Open Graph image URL.
    4. Return up to 5 new, unique links.
    5. Your response MUST be only a valid JSON array of link objects. Do not include any other text, markdown, or explanations. If no new links are found, return an empty array [].

    **User Profile:**
    - Name: ${profile.name}
    - Bio: ${profile.bio}

    **Existing URLs (do not include these):**
    ${existingUrls.join(', ')}
  `;

  let response;
  try {
    // Grounded search can't be combined with a response schema, so the JSON
    // is parsed out of free text and sanitized.
    response = await ai().models.generateContent({
      model: modelName,
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });
  } catch (error) {
    console.error('Gemini grounded search failed', error);
    throw new HttpError(502, 'The AI search failed. Please try again.');
  }

  const links = sanitizeLinks(extractJsonArray(response.text), existingUrls);
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const sources: GroundingSource[] = chunks
    .filter(chunk => chunk.web?.uri && chunk.web?.title)
    .map(chunk => ({ web: { uri: chunk.web!.uri!, title: chunk.web!.title! } }));

  return { links, sources };
};
