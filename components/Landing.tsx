
import React, { useState } from 'react';
import { LinkIcon } from './icons/LinkIcon';

interface LandingProps {
  onStartBuild: (email: string, url: string) => void;
  isLoading: boolean;
  loadingMessage?: string;
  errorMessage?: string;
}

const Landing: React.FC<LandingProps> = ({ onStartBuild, isLoading, loadingMessage, errorMessage }) => {
  const [email, setEmail] = useState('');
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && url) {
      onStartBuild(email, url);
    }
  };
  
  const isValidUrl = (urlString: string) => {
    try {
      new URL(urlString);
      return true;
    } catch (e) {
      return false;
    }
  };

  const isFormValid = email && isValidUrl(url);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-brand-background to-gray-900">
      <div className="w-full max-w-lg mx-auto bg-brand-surface rounded-2xl shadow-2xl shadow-brand-primary/20 p-8 text-center backdrop-blur-sm bg-opacity-80 border border-gray-700">
        <div className="flex justify-center mb-6">
            <LinkIcon className="h-16 w-16 text-brand-primary" />
        </div>
        <h1 className="text-4xl font-bold text-brand-text-primary mb-2">Build Your Bio, Instantly</h1>
        <p className="text-brand-text-secondary mb-8">
          Let our AI agent crawl your digital footprint and create a stunning link-in-bio page for you in seconds.
        </p>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-brand-primary"></div>
            <p className="text-brand-secondary">{loadingMessage || 'Building your profile...'}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-brand-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none transition-all"
              required
            />
            <div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter your website or social profile URL"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-brand-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none transition-all"
                required
              />
              <p className="text-xs text-gray-500 mt-2 text-left">
                Tip: Use a link that connects to your other accounts, like a personal website or primary social profile.
              </p>
            </div>
             {errorMessage && <p className="text-red-400 bg-red-900/50 p-3 rounded-lg">{errorMessage}</p>}
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="w-full px-4 py-3 font-bold text-white bg-brand-primary rounded-lg hover:bg-violet-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              Let's Build
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Landing;
