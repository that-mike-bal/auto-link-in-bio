import React, { useState, useEffect } from 'react';
import { UserProfile, Link, Layout, GroundingSource } from '../types';
import ProfilePreview from './ProfilePreview';
import SuggestedLinks from './SuggestedLinks';
import LayoutSelector from './LayoutSelector';
import LinkSourceController from './LinkSourceController';
import { XIcon } from './icons/XIcon';

interface ProfileBuilderProps {
  userProfile: UserProfile;
  initialSuggestedLinks: Link[];
  initialAddedLinks: Link[];
  searchSources: GroundingSource[];
  setSuggestedLinks: React.Dispatch<React.SetStateAction<Link[]>>;
  setAddedLinks: React.Dispatch<React.SetStateAction<Link[]>>;
  setSearchSources: React.Dispatch<React.SetStateAction<GroundingSource[]>>;
  onReset: () => void;
  onFindMoreLinks: () => Promise<void>;
  onProfileUpdate: (email: string) => Promise<void>;
  isFindingMore: boolean;
}

const ProfileBuilder: React.FC<ProfileBuilderProps> = (props) => {
  const { 
    userProfile, 
    initialSuggestedLinks: suggestedLinks,
    initialAddedLinks: addedLinks,
    searchSources,
    setAddedLinks,
    setSuggestedLinks,
    setSearchSources,
    onReset,
    onFindMoreLinks,
    onProfileUpdate,
    isFindingMore
  } = props;

  const [layout, setLayout] = useState<Layout>(Layout.STACK);
  const [activeTab, setActiveTab] = useState('suggestions');

  useEffect(() => {
    // When suggestions are cleared, also clear the sources for those suggestions.
    if (suggestedLinks.length === 0 && searchSources.length > 0) {
      setSearchSources([]);
    }
  }, [suggestedLinks, searchSources, setSearchSources]);

  const handleAddLink = (linkToAdd: Link) => {
    if (!addedLinks.some(link => link.url === linkToAdd.url)) {
      setAddedLinks(prev => [...prev, linkToAdd]);
    }
    setSuggestedLinks(prev => prev.filter(link => link.url !== linkToAdd.url));
  };
  
  const handleRemoveLink = (linkUrl: string) => {
    setAddedLinks(prev => prev.filter(link => link.url !== linkUrl));
  };
  
  const handleDismissLink = (linkUrl: string) => {
    setSuggestedLinks(prev => prev.filter(link => link.url !== linkUrl));
  };
  
  return (
    <div className="min-h-screen bg-brand-background text-brand-text-primary flex flex-col lg:flex-row overflow-hidden">
      <div className="w-full lg:w-[450px] lg:min-w-[450px] bg-brand-surface p-6 flex flex-col border-r border-gray-800 h-screen">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-bold">Customize Your Profile</h2>
          <button onClick={onReset} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors" aria-label="Start Over">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 flex-shrink-0">
            <label className="text-sm font-semibold text-brand-text-secondary mb-2 block">Layout</label>
            <LayoutSelector selectedLayout={layout} onSelectLayout={setLayout} />
        </div>

        <div className="flex-grow flex flex-col min-h-0">
          <LinkSourceController activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="mt-4 flex-grow overflow-y-auto pr-2 -mr-2">
            {activeTab === 'suggestions' && (
              <SuggestedLinks 
                links={suggestedLinks}
                sources={searchSources}
                onAddLink={handleAddLink} 
                onDismissLink={handleDismissLink}
                onFindMore={onFindMoreLinks}
                isFindingMore={isFindingMore}
              />
            )}
             {activeTab === 'add' && (
              <div className="text-center p-4 text-brand-text-secondary bg-gray-800 rounded-lg">
                Manual link adding is not yet implemented.
              </div>
            )}
            {activeTab === 'web' && (
               <div className="text-center p-4 text-brand-text-secondary bg-gray-800 rounded-lg">
                 Crawling another URL is not yet implemented.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-grow bg-brand-background flex items-center justify-center p-4 lg:p-8 overflow-auto">
        <ProfilePreview 
          userProfile={userProfile}
          links={addedLinks}
          layout={layout}
          onRemoveLink={handleRemoveLink}
          onProfileUpdate={onProfileUpdate}
        />
      </div>
    </div>
  );
};

export default ProfileBuilder;