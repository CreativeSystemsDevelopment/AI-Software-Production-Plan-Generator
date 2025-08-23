import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

const steps = [
  'Architecting system components...',
  'Selecting optimal tech stack...',
  'Defining AI agent specializations...',
  'Constructing detailed execution plan...',
  'Generating task dependency graph...',
  'Finalizing supervisor directives...'
];

export const DetailedLoader: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
    }, 2500); // Change step every 2.5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center glass-panel p-6 w-full max-w-2xl mx-auto">
      <LoadingSpinner />
      <p className="text-lg text-[var(--accent-color)] animate-pulse mt-4">Generating your software plan...</p>
      <p className="text-sm text-gray-300 opacity-75 mt-2 h-5">
        {steps[currentStep]}
      </p>
    </div>
  );
};
