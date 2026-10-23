import React, { useState, useEffect } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { UserProfile, Link, Layout, GroundingSource } from '../types';
import ProfilePreview from './ProfilePreview';
import SuggestedLinks from './SuggestedLinks';
import LayoutSelector from './LayoutSelector';
import { SparklesIcon } from './icons/SparklesIcon';
import { XIcon } from './icons/XIcon';
import { downloadProfileHtml } from '../utils/exportHtml';

interface ProfileBuilderProps {
  userProfile: UserProfile;
  suggestedLinks: Link[];
  addedLinks: Link[];
  searchSources: GroundingSource[];
  setSuggestedLinks: React.Dispatch<React.SetStateAction<Link[]>>;
  setAddedLinks: React.Dispatch<React.SetStateAction<Link[]>>;
  setSearchSources: React.Dispatch<React.SetStateAction<GroundingSource[]>>;
  onReset: () => void;
  onFindMoreLinks: () => Promise<void>;
  onProfileUpdate: (email: string) => Promise<void>;
  isFindingMore: boolean;
  findMoreError: string;
}

const ProfileBuilder: React.FC<ProfileBuilderProps> = (props) => {
  const {
    userProfile,
    suggestedLinks,
    addedLinks,
    searchSources,
    setAddedLinks,
    setSuggestedLinks,
    setSearchSources,
    onReset,
    onFindMoreLinks,
    onProfileUpdate,
    isFindingMore,
    findMoreError,
  } = props;

  const [layout, setLayout] = useState<Layout>(Layout.STACK);

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
    <div className="min-h-screen bg-brand-background text-brand-text-primary flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden">
      <div className="w-full lg:w-[450px] lg:min-w-[450px] bg-brand-surface p-6 flex flex-col border-r border-gray-800 lg:h-screen">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-bold">Customize Your Profile</h2>
          <button onClick={onReset} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors" aria-label="Start Over">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 flex-shrink-0">
            <span className="text-sm font-semibold text-brand-text-secondary mb-2 block">Layout</span>
            <LayoutSelector selectedLayout={layout} onSelectLayout={setLayout} />
        </div>

        <div className="flex-grow flex flex-col min-h-0">
          <h3 className="flex items-center space-x-2 pb-2 border-b border-gray-700 text-sm font-medium text-brand-secondary flex-shrink-0">
            <SparklesIcon className="h-5 w-5" />
            <span>AI Suggestions</span>
          </h3>
          <div className="mt-4 flex-grow overflow-y-auto pr-2 -mr-2">
            <SuggestedLinks
              links={suggestedLinks}
              sources={searchSources}
              onAddLink={handleAddLink}
              onDismissLink={handleDismissLink}
              onFindMore={onFindMoreLinks}
              isFindingMore={isFindingMore}
              errorMessage={findMoreError}
            />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-700 flex-shrink-0">
          <button
            onClick={() => downloadProfileHtml(userProfile, addedLinks, layout)}
            disabled={addedLinks.length === 0}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 font-bold text-white bg-brand-primary rounded-lg hover:bg-violet-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            <span>Export as HTML</span>
          </button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            {addedLinks.length === 0
              ? 'Add at least one link to export your page.'
              : 'A single self-contained page you can host anywhere.'}
          </p>
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
