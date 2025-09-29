
import React from 'react';
import { Layout, LayoutOption } from '../types';
import { Bars3Icon, Squares2X2Icon, IdentificationIcon } from '@heroicons/react/24/outline';


const layoutOptions: LayoutOption[] = [
    { id: Layout.STACK, name: 'Stack', icon: Bars3Icon },
    { id: Layout.GRID, name: 'Grid', icon: Squares2X2Icon },
    { id: Layout.CARD, name: 'Card', icon: IdentificationIcon },
];

interface LayoutSelectorProps {
    selectedLayout: Layout;
    onSelectLayout: (layout: Layout) => void;
}

const LayoutSelector: React.FC<LayoutSelectorProps> = ({ selectedLayout, onSelectLayout }) => {
    return (
        <div className="flex items-center bg-brand-surface p-1 rounded-lg border border-gray-700">
            {layoutOptions.map((option) => (
                <button
                    key={option.id}
                    onClick={() => onSelectLayout(option.id)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm transition-colors
                        ${selectedLayout === option.id 
                            ? 'bg-brand-primary text-white' 
                            : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                >
                    <option.icon className="h-5 w-5" />
                    <span>{option.name}</span>
                </button>
            ))}
        </div>
    );
}

export default LayoutSelector;
