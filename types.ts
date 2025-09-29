export interface UserProfile {
  name: string;
  bio: string;
  avatarUrl: string;
  location: string;
  logoUrl?: string;
  profileColor?: string;
  email?: string; // Add email to profile for Gravatar editor
}

export interface Link {
  url: string;
  title: string;
  description: string;
  type: 'social' | 'portfolio' | 'product' | 'contact' | 'other';
  imageUrl?: string;
}

export enum AppState {
  LANDING = 'LANDING',
  LOADING = 'LOADING',
  BUILDING = 'BUILDING',
  ERROR = 'ERROR',
}

export interface CrawlData {
    markdown: string;
    url: string;
}

export enum Layout {
    STACK = 'Stack',
    GRID = 'Grid',
    CARD = 'Card',
}

export interface LayoutOption {
    id: Layout;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
}

export interface GroundingSource {
    web: {
        uri: string;
        title: string;
    };
}