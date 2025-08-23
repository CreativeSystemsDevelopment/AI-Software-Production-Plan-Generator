
import React, { useState, useCallback, useEffect } from 'react';
import { UserInputForm } from './components/UserInputForm';
import { PlanViewer } from './components/PlanViewer';
import { DetailedLoader } from './components/DetailedLoader';
import { generatePlan } from './services/geminiService';
import type { SoftwarePlan } from './types';
import { AlertTriangleIcon, TerminalIcon } from './components/icons/Icons';
import { ProgrammaticAccessInfo } from './components/ProgrammaticAccessInfo';

type AppState = 'initial' | 'input' | 'loading' | 'results';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [plan, setPlan] = useState<SoftwarePlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>('initial');
  const [showProgrammaticInfo, setShowProgrammaticInfo] = useState<boolean>(false);

  const handleGeneratePlan = useCallback(async (promptOverride?: string) => {
    const promptToUse = promptOverride || prompt;
    if (!promptToUse.trim()) {
      setError('Please enter a description for your software idea.');
      return;
    }
    setAppState('loading');
    setIsLoading(true);
    setError(null);
    setPlan(null);

    try {
      const generatedPlan = await generatePlan(promptToUse);
      setPlan(generatedPlan);
      // Wait for fade out animation of previous screen before showing results
      setTimeout(() => {
          setAppState('results');
      }, 500);
    } catch (e: any) {
      console.error(e);
      setError(
        e.message || 'An error occurred while generating the plan. Please check your API key and try again.'
      );
      setAppState('input'); // Go back to input on error
    } finally {
      setIsLoading(false);
    }
  }, [prompt]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const promptFromUrl = urlParams.get('prompt');

    // If 'prompt' is in the URL (but not format=json, which is handled in index.tsx),
    // auto-start the generation process in the UI.
    if (promptFromUrl) {
      setPrompt(promptFromUrl);
      // We pass the prompt directly to avoid stale state issues with the initial render.
      handleGeneratePlan(promptFromUrl);
    } else {
      const timer = setTimeout(() => {
          setAppState('input');
      }, 500); // Wait 500ms before fading in the initial input card
      return () => clearTimeout(timer);
    }
  }, [handleGeneratePlan]);

  const handleDownloadStart = useCallback(() => {
    setShowProgrammaticInfo(true);
  }, []);

  const containerClasses = `min-h-screen font-sans w-full flex flex-col transition-all duration-1000 ease-in-out p-4 md:p-8`;
  const alignmentClasses = appState === 'input' ? 'items-center justify-center' : 'items-center justify-start';

  return (
    <div className="relative">
      <button
        onClick={() => setShowProgrammaticInfo(true)}
        className="fixed top-6 left-6 z-50 h-12 w-12 flex items-center justify-center glass-button rounded-full"
        aria-label="Show Programmatic Access Info"
        title="Programmatic Access Info"
      >
        <TerminalIcon className="h-6 w-6 text-gray-200" />
      </button>

      <main className={`${containerClasses} ${alignmentClasses}`}>
        {/* Stage 1 (Input) & 2 (Loading) */}
        <div
          className={`w-full transition-all duration-700 ease-in-out ${
            appState === 'results' ? 'opacity-0 scale-95 pointer-events-none absolute' : 'opacity-100 scale-100'
          }`}
        >
          <div
            className={`transition-all duration-1000 ease-in-out w-full flex justify-center ${
              appState === 'loading' ? 'mb-8' : ''
            }`}
          >
            <div
              className={`w-full max-w-4xl transition-opacity duration-1000 delay-300 ${
                appState === 'initial' ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <UserInputForm
                prompt={prompt}
                setPrompt={setPrompt}
                onSubmit={() => handleGeneratePlan()}
                isLoading={isLoading || appState !== 'input'}
              />
            </div>
          </div>

          {error && (
            <div className="mt-6 glass-panel bg-red-500/20 border-red-500/30 text-red-100 px-4 py-3 rounded-lg flex items-center max-w-4xl mx-auto animate-fade-in">
              <AlertTriangleIcon className="h-5 w-5 mr-3 text-red-200" />
              <span>{error}</span>
            </div>
          )}

          {appState === 'loading' && (
            <div className="animate-fade-in">
                <DetailedLoader />
            </div>
          )}
        </div>

        {/* Stage 3 (Results) */}
        {appState === 'results' && plan && (
          <div className="w-full max-w-6xl mx-auto animate-fade-in">
            <PlanViewer plan={plan} onDownloadStart={handleDownloadStart}/>
          </div>
        )}
      </main>

      {/* Programmatic Access Overlay */}
      {showProgrammaticInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowProgrammaticInfo(false)}></div>
           <div className="relative w-full max-w-2xl animate-fade-in">
             <ProgrammaticAccessInfo onClose={() => setShowProgrammaticInfo(false)} />
           </div>
        </div>
      )}
    </div>
  );
};

export default App;