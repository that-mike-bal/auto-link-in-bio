import React from 'react';
import { UserProfile, Link, Layout } from '../types';
import { XIcon } from './icons/XIcon';
import { PencilIcon } from './icons/PencilIcon';
import { GRAVATAR_API_KEY } from '../constants';

// Make Gravatar globally available for the SDK
declare const Gravatar: any;

interface ProfilePreviewProps {
  userProfile: UserProfile;
  links: Link[];
  layout: Layout;
  onRemoveLink: (linkUrl: string) => void;
  onProfileUpdate: (email: string) => void;
}

const ProfileLink: React.FC<{link: Link, onRemove: (url: string) => void}> = ({link, onRemove}) => {
    const hostname = new URL(link.url).hostname;
    const fallbackImageUrl = `https://ui-avatars.com/api/?name=${hostname}&size=100&background=random&color=fff`;

    return (
        <div className="group relative w-full">
            <a href={link.url} target="_blank" rel="noopener noreferrer" 
               className="flex items-center w-full text-left p-2 bg-white/90 hover:bg-white rounded-lg transition-all transform hover:scale-105 shadow-md hover:shadow-lg border border-gray-200">
                <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center mr-3">
                    <img src={link.imageUrl || fallbackImageUrl} alt={link.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                    <span className="font-semibold text-gray-800">{link.title}</span>
                    <p className="text-xs text-gray-500 truncate">{hostname}</p>
                </div>
            </a>
            <button
                onClick={(e) => { e.preventDefault(); onRemove(link.url); }}
                className="absolute -top-2 -right-2 p-1.5 text-white bg-gray-800/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/80"
                aria-label="Remove link"
            >
                <XIcon className="h-3 w-3" />
            </button>
        </div>
    );
};


const ProfilePreview: React.FC<ProfilePreviewProps> = ({ userProfile, links, layout, onRemoveLink, onProfileUpdate }) => {
    
    const handleEditProfile = () => {
        if (typeof Gravatar !== 'undefined' && userProfile.email) {
             // Initialize the SDK right before opening to ensure it has the correct context.
             Gravatar.init({
                email: userProfile.email,
                apiKey: GRAVATAR_API_KEY,
                onSaveSuccess: () => {
                    // Gravatar saved, now refetch the profile data
                    onProfileUpdate(userProfile.email!);
                },
            });
            Gravatar.open();
        } else {
            alert("Profile editor is not available. Ensure an email is associated with the profile.");
        }
    };

    const renderLinks = () => {
        let containerClasses = "w-full max-w-md mx-auto flex flex-col items-center gap-4 px-4";
        if (layout === Layout.GRID) {
            containerClasses = "w-full max-w-md mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 px-4";
        }
        return (
            <div className={containerClasses}>
                {links.map(link => <ProfileLink key={link.url} link={link} onRemove={onRemoveLink} />)}
            </div>
        )
    };
    
    const displayImageUrl = userProfile.logoUrl || userProfile.avatarUrl;
    const imageStyle = {
      borderColor: userProfile.profileColor || '#a78bfa'
    };

    if (layout === Layout.CARD) {
      return (
        <div className="w-full max-w-sm mx-auto bg-brand-surface rounded-2xl shadow-lg p-6 border border-gray-700 text-center flex flex-col items-center">
             <div className="relative">
                <img
                    src={displayImageUrl}
                    alt={userProfile.name}
                    className="w-28 h-28 rounded-full mb-4 border-4 object-cover"
                    style={imageStyle}
                />
                <button onClick={handleEditProfile} className="absolute bottom-4 -right-1 p-1.5 bg-brand-primary text-white rounded-full hover:scale-110 transition-transform" aria-label="Edit Profile">
                    <PencilIcon className="h-4 w-4" />
                </button>
             </div>
            <h3 className="text-2xl font-bold text-brand-text-primary">{userProfile.name}</h3>
            {userProfile.location && <p className="text-sm text-brand-text-secondary mb-1">{userProfile.location}</p>}
            <p className="text-brand-text-secondary my-4 text-sm">{userProfile.bio}</p>
            <div className="w-full space-y-3 mt-2">
                {links.map(link => <ProfileLink key={link.url} link={link} onRemove={onRemoveLink} />)}
            </div>
        </div>
      );
    }

  return (
    <div className="w-full h-full max-w-3xl mx-auto flex flex-col items-center justify-center p-4">
      <div className="relative">
        <img
            src={displayImageUrl}
            alt={userProfile.name}
            className="w-24 h-24 rounded-full mb-4 border-4 object-cover"
            style={imageStyle}
        />
        <button onClick={handleEditProfile} className="absolute bottom-4 -right-1 p-1.5 bg-brand-primary text-white rounded-full hover:scale-110 transition-transform" aria-label="Edit Profile">
            <PencilIcon className="h-4 w-4" />
        </button>
      </div>
      <h3 className="text-2xl font-bold text-brand-text-primary">@{userProfile.name.replace(/\s+/g, '').toLowerCase()}</h3>
      <p className="text-brand-text-secondary mb-8 max-w-md text-center">{userProfile.bio}</p>
      
      {renderLinks()}
    </div>
  );
};

export default ProfilePreview;