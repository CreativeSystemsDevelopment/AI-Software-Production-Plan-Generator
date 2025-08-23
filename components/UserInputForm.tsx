
import React from 'react';
import { SparklesIcon } from './icons/Icons';

interface UserInputFormProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export const UserInputForm: React.FC<UserInputFormProps> = ({ prompt, setPrompt, onSubmit, isLoading }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };
  
  return (
    <form onSubmit={handleSubmit} className="glass-panel p-6">
      <label htmlFor="prompt-input" className="block text-lg font-medium mb-3">
        Describe your software idea
      </label>
      <textarea
        id="prompt-input"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g., A mobile app that uses AI to identify plants from photos and provides care instructions."
        className="w-full h-32 p-3 glass-input transition duration-200 resize-none"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading}
        className="mt-4 w-full flex items-center justify-center px-6 py-3 text-base font-medium glass-button primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          'Generating...'
        ) : (
          <>
            <SparklesIcon className="h-5 w-5 mr-2" />
            Generate Plan
          </>
        )}
      </button>
    </form>
  );
};
