import React, { useState, useCallback } from 'react';
import Landing from './components/Landing';
import ProfileBuilder from './components/ProfileBuilder';
import { AppState, UserProfile, Link, GroundingSource } from './types';
import { crawlUrl } from './services/firecrawlService';
import { getGravatarProfile } from './services/gravatarService';
import { generateProfile, generateLinks, findMoreLinks } from './services/geminiService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LANDING);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [suggestedLinks, setSuggestedLinks] = useState<Link[]>([]);
  const [addedLinks, setAddedLinks] = useState<Link[]>([]);
  const [searchSources, setSearchSources] = useState<GroundingSource[]>([]);


  const handleStartBuild = useCallback(async (email: string, url: string) => {
    setAppState(AppState.LOADING);
    setErrorMessage('');
    setLoadingMessage('Fetching your digital footprint...');

    try {
      const [gravatarData, crawlData] = await Promise.all([
        getGravatarProfile(email),
        crawlUrl(url)
      ]);
      
      const crawlContent = crawlData.map(d => d.markdown).join('\n\n');

      setLoadingMessage('Our AI agent is building your profile...');

      const generatedProfile = await generateProfile(email, crawlContent, gravatarData);
      setUserProfile({ ...generatedProfile, email }); // Store email for Gravatar editor

      setLoadingMessage('Finding relevant links for you...');

      const generatedLinks = await generateLinks(crawlContent);
      setSuggestedLinks(generatedLinks);
      setAddedLinks([]);
      setSearchSources([]);

      setAppState(AppState.BUILDING);
    } catch (error) {
      console.error('Error building profile:', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      setErrorMessage(`Failed to build your profile. ${message} Please try again.`);
      setAppState(AppState.LANDING);
    } finally {
        setLoadingMessage('');
    }
  }, []);

  const handleFindMoreLinks = useCallback(async () => {
    if (!userProfile) return;
    
    setLoadingMessage("AI is searching for more links...");
    try {
      const existingLinks = [...addedLinks, ...suggestedLinks];
      const { links: newLinks, sources: newSources } = await findMoreLinks(userProfile, existingLinks);
      
      const uniqueNewLinks = newLinks.filter(nl => !existingLinks.some(el => el.url === nl.url));

      setSuggestedLinks(prev => [...prev, ...uniqueNewLinks]);
      setSearchSources(newSources);

    } catch (error) {
       console.error("Failed to find more links:", error);
    } finally {
      setLoadingMessage("");
    }
  }, [userProfile, suggestedLinks, addedLinks]);

  const handleProfileUpdate = useCallback(async (email: string) => {
      setLoadingMessage("Refreshing profile...");
      try {
          const gravatarData = await getGravatarProfile(email);
          if (gravatarData) {
              setUserProfile(prev => prev ? {
                  ...prev,
                  name: gravatarData.displayName || prev.name,
                  bio: gravatarData.aboutMe || prev.bio,
                  avatarUrl: `${gravatarData.thumbnailUrl}&v=${Date.now()}`, // Cache bust avatar
                  location: gravatarData.currentLocation || prev.location,
                  profileColor: gravatarData.profileColor || prev.profileColor,
              } : null);
          }
      } catch (error) {
          console.error("Failed to refresh Gravatar profile:", error);
      } finally {
          setLoadingMessage("");
      }
  }, []);

  const handleReset = () => {
    setAppState(AppState.LANDING);
    setUserProfile(null);
    setSuggestedLinks([]);
    setAddedLinks([]);
    setErrorMessage('');
    setSearchSources([]);
  };

  switch (appState) {
    case AppState.LOADING:
    case AppState.LANDING:
      return <Landing onStartBuild={handleStartBuild} isLoading={appState === AppState.LOADING} loadingMessage={loadingMessage} errorMessage={errorMessage} />;
    case AppState.BUILDING:
      if (userProfile) {
        return <ProfileBuilder 
                  userProfile={userProfile} 
                  initialSuggestedLinks={suggestedLinks}
                  initialAddedLinks={addedLinks}
                  searchSources={searchSources}
                  setAddedLinks={setAddedLinks}
                  setSuggestedLinks={setSuggestedLinks}
                  setSearchSources={setSearchSources}
                  onReset={handleReset} 
                  onFindMoreLinks={handleFindMoreLinks}
                  onProfileUpdate={handleProfileUpdate}
                  isFindingMore={!!loadingMessage}
               />;
      }
      setErrorMessage("Something went wrong. Couldn't load profile data.");
      setAppState(AppState.LANDING);
      return null;
    default:
      return <Landing onStartBuild={handleStartBuild} isLoading={false} errorMessage="An unexpected error occurred. Please refresh the page." />;
  }
};

export default App;