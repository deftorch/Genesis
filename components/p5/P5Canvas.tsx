'use client';

import React, { useMemo, useRef } from 'react';

interface P5CanvasProps {
  code: string;
  width?: number;
  height?: number;
  onDownload?: () => void;
}

const P5Canvas: React.FC<P5CanvasProps> = ({ code, width = 400, height = 400 }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generate the HTML content for the iframe using srcdoc
  const htmlContent = useMemo(() => {
    if (!code) return '';

    return `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      min-height: 100vh;
      background: #1a1a2e;
      overflow: hidden;
    }
    canvas { 
      display: block;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    .error {
      color: #ff6b6b;
      font-family: monospace;
      padding: 20px;
      background: #2d1f1f;
      border-radius: 8px;
      max-width: 90%;
      word-wrap: break-word;
    }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/p5.min.js"><\/script>
</head>
<body>
  <script>
    // Error handling
    window.onerror = function(msg, url, lineNo, columnNo, error) {
      document.body.innerHTML = '<div class="error"><strong>Error:</strong><br>' + msg + '</div>';
      return false;
    };

    // Listen for download request from parent
    window.addEventListener('message', function(event) {
      if (event.data === 'downloadCanvas') {
        const canvas = document.querySelector('canvas');
        if (canvas) {
          const dataURL = canvas.toDataURL('image/png');
          window.parent.postMessage({ type: 'canvasData', dataURL: dataURL }, '*');
        }
      }
    });

    try {
      // User's p5.js code
      ${code}
    } catch(e) {
      document.body.innerHTML = '<div class="error"><strong>Error:</strong><br>' + e.message + '</div>';
    }
  <\/script>
</body>
</html>`;
  }, [code]);

  // Function to trigger download
  const downloadImage = () => {
    if (iframeRef.current?.contentWindow) {
      // Set up listener for canvas data
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'canvasData' && event.data.dataURL) {
          // Create download link
          const link = document.createElement('a');
          link.download = `genesis-artwork-${Date.now()}.png`;
          link.href = event.data.dataURL;
          link.click();
          window.removeEventListener('message', handleMessage);
        }
      };
      window.addEventListener('message', handleMessage);

      // Request canvas data from iframe
      iframeRef.current.contentWindow.postMessage('downloadCanvas', '*');
    }
  };

  if (!code) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
        <div className="text-center text-gray-400">
          <p>No code to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <iframe
        ref={iframeRef}
        key={code} // Force re-render when code changes
        srcDoc={htmlContent}
        className="w-full flex-1 border-0 rounded-lg bg-gray-900"
        style={{ minHeight: `${height}px` }}
        sandbox="allow-scripts"
        title="p5.js Canvas"
      />
    </div>
  );
};

export default P5Canvas;
