import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { PlusIcon } from './icons/PlusIcon';
import { GlobeAltIcon } from './icons/GlobeAltIcon';

interface LinkSourceControllerProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const tabs = [
    { id: 'suggestions', name: 'AI Suggestions', icon: SparklesIcon },
    { id: 'add', name: 'Add Manually', icon: PlusIcon },
    { id: 'web', name: 'From Web', icon: GlobeAltIcon },
]

const LinkSourceController: React.FC<LinkSourceControllerProps> = ({ activeTab, setActiveTab }) => {
    return (
        <div className="flex-shrink-0">
            <div className="flex border-b border-gray-700">
                {tabs.map(tab => (
                     <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors focus:outline-none
                            ${
                                activeTab === tab.id
                                ? 'border-b-2 border-brand-primary text-brand-primary'
                                : 'text-gray-400 hover:text-white border-b-2 border-transparent'
                            }
                        `}
                    >
                        <tab.icon className="h-5 w-5"/>
                        <span>{tab.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default LinkSourceController;
