
import React from 'react';
import { BotIcon } from './icons/Icons';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-4 z-50">
      <div className="container mx-auto px-4">
        <div className="glass-panel px-4 py-3">
          <div className="flex items-center space-x-3">
            <BotIcon className="h-8 w-8 text-[var(--accent-color)]" />
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-[var(--accent-color)]">AI</span> Software Development Planner
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
};
