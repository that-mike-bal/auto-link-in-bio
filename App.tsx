import React, { useState, useCallback, useEffect } from 'react';
import Landing from './components/Landing';
import ProfileBuilder from './components/ProfileBuilder';
import { AppState, UserProfile, Link, GroundingSource } from './types';
import { buildProfile, findMoreLinks, refreshGravatar } from './services/api';

// The build is one server round trip, so these rotate on a timer to show
// what the pipeline is doing.
const BUILD_STEPS = [
  'Fetching your digital footprint...',
  'Reading your website...',
  'Our AI agent is building your profile...',
  'Finding relevant links for you...',
];

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LANDING);
  const [buildStep, setBuildStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [suggestedLinks, setSuggestedLinks] = useState<Link[]>([]);
  const [addedLinks, setAddedLinks] = useState<Link[]>([]);
  const [searchSources, setSearchSources] = useState<GroundingSource[]>([]);
  const [isFindingMore, setIsFindingMore] = useState(false);
  const [findMoreError, setFindMoreError] = useState('');

  useEffect(() => {
    if (appState !== AppState.LOADING) return;
    setBuildStep(0);
    const timer = setInterval(() => {
      setBuildStep(step => Math.min(step + 1, BUILD_STEPS.length - 1));
    }, 3000);
    return () => clearInterval(timer);
  }, [appState]);

  const handleStartBuild = useCallback(async (email: string, url: string) => {
    setAppState(AppState.LOADING);
    setErrorMessage('');

    try {
      const { profile, links } = await buildProfile(email, url);
      setUserProfile(profile);
      setSuggestedLinks(links);
      setAddedLinks([]);
      setSearchSources([]);
      setFindMoreError('');
      setAppState(AppState.BUILDING);
    } catch (error) {
      console.error('Error building profile:', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      setErrorMessage(`Failed to build your profile. ${message}`);
      setAppState(AppState.LANDING);
    }
  }, []);

  const handleFindMoreLinks = useCallback(async () => {
    if (!userProfile) return;

    setIsFindingMore(true);
    setFindMoreError('');
    try {
      const existingUrls = [...addedLinks, ...suggestedLinks].map(link => link.url);
      const { links, sources } = await findMoreLinks(userProfile, existingUrls);
      if (links.length === 0) {
        setFindMoreError("The AI didn't find any new links this time.");
      }
      setSuggestedLinks(prev => [...prev, ...links.filter(nl => !prev.some(el => el.url === nl.url))]);
      setSearchSources(sources);
    } catch (error) {
      console.error('Failed to find more links:', error);
      setFindMoreError(error instanceof Error ? error.message : 'Search failed. Please try again.');
    } finally {
      setIsFindingMore(false);
    }
  }, [userProfile, suggestedLinks, addedLinks]);

  const handleProfileUpdate = useCallback(async (email: string) => {
    try {
      const gravatar = await refreshGravatar(email);
      if (gravatar) {
        setUserProfile(prev => prev ? {
          ...prev,
          name: gravatar.displayName || prev.name,
          bio: gravatar.aboutMe || prev.bio,
          avatarUrl: gravatar.avatarUrl ? `${gravatar.avatarUrl}&v=${Date.now()}` : prev.avatarUrl, // Cache bust avatar
          location: gravatar.currentLocation || prev.location,
        } : null);
      }
    } catch (error) {
      console.error('Failed to refresh Gravatar profile:', error);
    }
  }, []);

  const handleReset = () => {
    setAppState(AppState.LANDING);
    setUserProfile(null);
    setSuggestedLinks([]);
    setAddedLinks([]);
    setErrorMessage('');
    setSearchSources([]);
    setFindMoreError('');
  };

  if (appState === AppState.BUILDING && userProfile) {
    return <ProfileBuilder
              userProfile={userProfile}
              suggestedLinks={suggestedLinks}
              addedLinks={addedLinks}
              searchSources={searchSources}
              setAddedLinks={setAddedLinks}
              setSuggestedLinks={setSuggestedLinks}
              setSearchSources={setSearchSources}
              onReset={handleReset}
              onFindMoreLinks={handleFindMoreLinks}
              onProfileUpdate={handleProfileUpdate}
              isFindingMore={isFindingMore}
              findMoreError={findMoreError}
           />;
  }

  return (
    <Landing
      onStartBuild={handleStartBuild}
      isLoading={appState === AppState.LOADING}
      loadingMessage={BUILD_STEPS[buildStep]}
      errorMessage={errorMessage}
    />
  );
};

export default App;
