import React from 'react';
import { Link, GroundingSource } from '../types';
import LinkCard from './LinkCard';
import { SparklesIcon } from './icons/SparklesIcon';

interface SuggestedLinksProps {
  links: Link[];
  sources: GroundingSource[];
  onAddLink: (link: Link) => void;
  onDismissLink: (linkUrl: string) => void;
  onFindMore: () => void;
  isFindingMore: boolean;
  errorMessage?: string;
}

const SuggestedLinks: React.FC<SuggestedLinksProps> = ({ links, sources, onAddLink, onDismissLink, onFindMore, isFindingMore, errorMessage }) => {
  const findMoreButton = (
    <button
      onClick={onFindMore}
      disabled={isFindingMore}
      className="flex items-center justify-center space-x-2 px-4 py-2 font-bold text-white bg-brand-primary rounded-lg hover:bg-violet-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all transform hover:scale-105"
    >
      {isFindingMore ? (
        <>
            <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white"></div>
            <span>Searching...</span>
        </>
      ) : (
        <>
          <SparklesIcon className="h-5 w-5" />
          <span>Find More Suggestions</span>
        </>
      )}
    </button>
  );

  const error = errorMessage && (
    <p role="status" className="text-sm text-amber-300 mt-3">{errorMessage}</p>
  );

  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4 bg-gray-800 rounded-lg">
        <p className="text-brand-text-secondary font-semibold">No more links found!</p>
        <p className="text-sm text-gray-400 mt-2 mb-4">Want the AI to search the web for more?</p>
        {findMoreButton}
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3">
        {links.map((link) => (
          <LinkCard key={link.url} link={link} onAdd={onAddLink} onDismiss={onDismissLink} />
        ))}
      </div>

      <div className="mt-4 flex flex-col items-center">
        {findMoreButton}
        {error}
      </div>

      {sources && sources.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-700">
          <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
            AI Search Sources
          </h4>
          <ul className="mt-2 space-y-1">
            {sources.map((source, index) => (
              <li key={index} className="truncate">
                <a
                  href={source.web.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-brand-secondary transition-colors"
                  title={source.web.title}
                >
                  {source.web.title || source.web.uri}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SuggestedLinks;
