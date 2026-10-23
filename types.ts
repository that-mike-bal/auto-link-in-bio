import type { ComponentType } from 'react';

export interface UserProfile {
  name: string;
  bio: string;
  avatarUrl: string;
  location: string;
  logoUrl?: string;
  profileColor?: string;
  email?: string; // Kept for the Gravatar quick editor
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
}

export enum Layout {
  STACK = 'Stack',
  GRID = 'Grid',
  CARD = 'Card',
}

export interface LayoutOption {
  id: Layout;
  name: string;
  icon: ComponentType<{ className?: string }>;
}

export interface GroundingSource {
  web: {
    uri: string;
    title: string;
  };
}

export interface GravatarProfile {
  displayName: string;
  aboutMe: string;
  currentLocation: string;
  avatarUrl: string;
  verifiedLinks: Link[];
}

// Shapes returned by the /api handlers
export interface BuildResponse {
  profile: UserProfile;
  links: Link[];
}

export interface MoreLinksResponse {
  links: Link[];
  sources: GroundingSource[];
}
