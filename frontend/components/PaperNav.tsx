// PaperNav.tsx
'use client';
import { useState } from 'react';

interface PaperNavProps {
    items?: string[];
    title?: string;
    textColor?: string; // Add textColor prop
}

export default function PaperNav({ 
    items = ['one', 'two', 'three'],
    title = 'PAPER DIRECTORY',
    textColor = 'text-white' // Default color
}: PaperNavProps) {
    const [isOpen, setIsOpen] = useState(true);
    
    return (
        <aside
            className={`flex flex-col border-l border-gray-200 bg-white transition-all duration-300 ${
                isOpen ? 'w-64' : 'w-16'
            }`}
        >
            {/* Header */}
            <div className={`flex items-center justify-between bg-maroon h-12 px-3 font-bold text-lg ${textColor}`}>
                {isOpen && <span>{title}</span>}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="focus:outline-none"
                    title={isOpen ? 'Collapse' : 'Expand'}
                >
                    {isOpen ? '◀' : '▶'}
                </button>
            </div>
            {/* List */}
            {isOpen && (
                <ul className="m-0 p-0">
                    {items.map((item, index) => (
                        <li
                            key={index}
                            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 cursor-pointer list-none"
                        >
                            {item}
                        </li>
                    ))}
                </ul>
            )}
        </aside>
    );
}