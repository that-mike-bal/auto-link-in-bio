import React, { useState } from 'react';
import { Link } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { XIcon } from './icons/XIcon';
import { safeHostname, fallbackImageUrl } from '../utils/url';

interface LinkCardProps {
  link: Link;
  onAdd: (link: Link) => void;
  onDismiss: (linkUrl: string) => void;
}

const LinkCard: React.FC<LinkCardProps> = ({ link, onAdd, onDismiss }) => {
  const hostname = safeHostname(link.url);
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = link.imageUrl && !imageFailed;

  return (
    <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 hover:border-brand-primary transition-all group flex items-center space-x-4">
        <div className="flex-shrink-0 w-16 h-16 bg-gray-900 rounded-md overflow-hidden flex items-center justify-center">
            {showImage ? (
                <img src={link.imageUrl} alt="" className="w-full h-full object-cover" onError={() => setImageFailed(true)} />
            ) : (
                 <img src={fallbackImageUrl(hostname)} alt="" className="w-12 h-12 object-contain" />
            )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-brand-text-primary truncate">{link.title}</p>
          <p className="text-sm text-brand-text-secondary truncate">{hostname}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onDismiss(link.url)}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
            aria-label={`Dismiss ${link.title}`}
          >
            <XIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onAdd(link)}
            className="p-1.5 text-gray-400 bg-gray-700 hover:text-white hover:bg-brand-primary rounded-full transition-colors"
            aria-label={`Add ${link.title}`}
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
    </div>
  );
};

export default LinkCard;
