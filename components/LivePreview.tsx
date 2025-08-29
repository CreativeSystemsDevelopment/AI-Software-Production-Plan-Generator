import React, { useEffect, useRef } from 'react';

interface LivePreviewProps {
  htmlContent: string | null;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ htmlContent }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && htmlContent) {
      const document = iframeRef.current.contentDocument;
      if (document) {
        document.open();
        document.write(htmlContent);
        document.close();
      }
    }
  }, [htmlContent]);

  return (
    <div className="w-full h-full bg-gray-900 rounded-lg shadow-inner relative">
      {htmlContent ? (
        <iframe
          ref={iframeRef}
          title="Live Preview"
          className="w-full h-full border-0 rounded-lg bg-white"
          sandbox="allow-scripts"
        />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400">
          <p>Select a completed UI task to see a preview.</p>
        </div>
      )}
    </div>
  );
};
