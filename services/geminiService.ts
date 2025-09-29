import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, Link, GroundingSource } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelName = "gemini-2.5-flash";

const userProfileSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "The full name of the person." },
    bio: { type: Type.STRING, description: "A short, engaging bio (max 150 characters)." },
    avatarUrl: { type: Type.STRING, description: "A URL to a high-quality profile picture. Must be a direct image link." },
    location: { type: Type.STRING, description: "The city and country, e.g., 'San Francisco, USA'." },
    logoUrl: { type: Type.STRING, nullable: true, description: "A URL for a secondary image or logo, if available. Can be null." },
    profileColor: { type: Type.STRING, nullable: true, description: "A hex color code (e.g., '#a78bfa') that represents the user's brand. Can be null." },
  },
  required: ["name", "bio", "avatarUrl", "location"],
};

const linksSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            url: { type: Type.STRING, description: "The full URL of the link." },
            title: { type: Type.STRING, description: "A concise, descriptive title for the link." },
            description: { type: Type.STRING, description: "A brief summary of the link's content (max 100 characters)." },
            type: {
                type: Type.STRING,
                enum: ['social', 'portfolio', 'product', 'contact', 'other'],
                description: "The category of the link."
            },
            imageUrl: { type: Type.STRING, nullable: true, description: "The Open Graph (og:image) or a relevant fallback image URL for the link. Can be null." },
        },
        required: ["url", "title", "description", "type"],
    },
};

export const generateProfile = async (
  email: string,
  crawlContent: string,
  gravatarData: { thumbnailUrl: string; displayName: string; aboutMe: string; currentLocation: string; profileColor?: string } | null
): Promise<UserProfile> => {
  const gravatarInfo = gravatarData ? `
    Here is verified information from the user's Gravatar profile. Prioritize this data:
    - Display Name: ${gravatarData.displayName}
    - Bio: ${gravatarData.aboutMe}
    - Location: ${gravatarData.currentLocation}
    - Avatar URL: ${gravatarData.thumbnailUrl}
    - Profile Color: ${gravatarData.profileColor || 'not set'}
  ` : 'No Gravatar data was found for this user.';

  const prompt = `
    You are an expert personal branding assistant. Analyze the provided information to generate a professional user profile.
    **Instructions:**
    1. Use Gravatar data as the primary source for name, avatar, location and bio. Fallback to the crawled content if Gravatar data is missing.
    2. Create a concise and compelling bio under 150 characters.
    3. If a company or brand logo is prominent on the website, use it for 'logoUrl'. Otherwise, set it to null.
    4. Extract a brand color from the website's design or use the Gravatar profile color. If none, set 'profileColor' to null.
    5. 'avatarUrl' MUST be a direct link to an image.
    6. Return the data strictly in the specified JSON format.
    **User Email:** ${email}
    ${gravatarInfo}
    **Crawled Website Content:**
    ---
    ${crawlContent.substring(0, 8000)}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: userProfileSchema },
    });
    const profileData = JSON.parse(response.text.trim()) as UserProfile;
    if (gravatarData) {
        profileData.name = profileData.name || gravatarData.displayName;
        profileData.avatarUrl = profileData.avatarUrl || gravatarData.thumbnailUrl;
        profileData.location = profileData.location || gravatarData.currentLocation;
        profileData.bio = profileData.bio || gravatarData.aboutMe;
        profileData.profileColor = profileData.profileColor || gravatarData.profileColor;
    }
    if (!profileData.avatarUrl) {
        profileData.avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name || email)}&size=200&background=random`;
    }
    return profileData;
  } catch (error) {
    console.error("Error generating profile with Gemini:", error);
    throw new Error("The AI failed to generate a user profile.");
  }
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
        ${crawlContent.substring(0, 8000)}
        ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: linksSchema },
        });
        return JSON.parse(response.text.trim()) as Link[];
    } catch (error) {
        console.error("Error generating links with Gemini:", error);
        return [];
    }
};

export const findMoreLinks = async (userProfile: UserProfile, existingLinks: Link[]): Promise<{ links: Link[], sources: GroundingSource[] }> => {
    const existingUrls = existingLinks.map(link => link.url).join(', ');
    const prompt = `
        You are an expert researcher. Your task is to find more online links related to a person based on their profile.
        **Instructions:**
        1. Use web search to find additional links for '${userProfile.name}'.
        2. Look for social media profiles, portfolios, blogs, or company pages that are not already in the list of existing URLs.
        3. For each new link found, provide a url, title, description, a category from ['social', 'portfolio', 'product', 'contact', 'other'], and an Open Graph image URL.
        4. Return up to 5 new, unique links.
        5. Your response MUST be only a valid JSON array of link objects. Do not include any other text, markdown, or explanations. If no new links are found, return an empty array [].

        **User Profile:**
        - Name: ${userProfile.name}
        - Bio: ${userProfile.bio}

        **Existing URLs (do not include these):**
        ${existingUrls}
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        
        let jsonText = response.text.trim();
        const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
            jsonText = jsonMatch[1];
        }

        const links = JSON.parse(jsonText) as Link[];
        // FIX: The `groundingChunks` from the Gemini API might have an optional `uri` or `title` in the `web` object.
        // We must filter for items that have both `uri` and `title` to match the `GroundingSource` type.
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources: GroundingSource[] = groundingChunks
            .filter(chunk => chunk.web?.uri && chunk.web?.title)
            .map(chunk => ({
                web: {
                    uri: chunk.web!.uri!,
                    title: chunk.web!.title!,
                }
            }));

        return { links, sources };
    } catch (error) {
        console.error("Error finding more links with Gemini:", error);
        return { links: [], sources: [] };
    }
};
