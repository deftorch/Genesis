'use client';

import React, { useMemo, useRef } from 'react';

interface D3CanvasProps {
  code: string;
  width?: number;
  height?: number;
}

const D3Canvas: React.FC<D3CanvasProps> = ({ code, width = 400, height = 400 }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generate the HTML content for the iframe using srcdoc
  const htmlContent = useMemo(() => {
    if (!code) return '';

    // Strip the renderer comment from the code before injecting
    const cleanCode = code.replace(/^\/\/ renderer: d3\s*\n?/, '');

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
    #chart {
      width: 100%;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    svg {
      display: block;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
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
    /* D3 tooltip styling */
    .tooltip {
      position: absolute;
      background: rgba(0, 0, 0, 0.85);
      color: #fff;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 13px;
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    /* Axis styling */
    .tick text {
      fill: #aaa;
      font-size: 12px;
    }
    .tick line {
      stroke: #444;
    }
    .domain {
      stroke: #555;
    }
  </style>
  <script src="https://d3js.org/d3.v7.min.js"><\/script>
</head>
<body>
  <div id="chart"></div>
  <script>
    // Error handling
    window.onerror = function(msg, url, lineNo, columnNo, error) {
      document.body.innerHTML = '<div class="error"><strong>D3.js Error:</strong><br>' + msg + '</div>';
      return false;
    };

    // Listen for download request from parent
    window.addEventListener('message', function(event) {
      if (event.data === 'downloadCanvas') {
        const svgElement = document.querySelector('svg');
        if (svgElement) {
          // Convert SVG to PNG via canvas
          const svgData = new XMLSerializer().serializeToString(svgElement);
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(svgBlob);
          const img = new Image();
          img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = svgElement.getBoundingClientRect().width * 2;
            canvas.height = svgElement.getBoundingClientRect().height * 2;
            const ctx = canvas.getContext('2d');
            ctx.scale(2, 2);
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            const dataURL = canvas.toDataURL('image/png');
            window.parent.postMessage({ type: 'canvasData', dataURL: dataURL }, '*');
          };
          img.src = url;
        } else {
          // Fallback: try to capture the chart div
          window.parent.postMessage({ type: 'canvasData', dataURL: null }, '*');
        }
      }
    });

    try {
      // User's D3.js code
      ${cleanCode}
    } catch(e) {
      document.body.innerHTML = '<div class="error"><strong>D3.js Error:</strong><br>' + e.message + '</div>';
    }
  <\/script>
</body>
</html>`;
  }, [code]);

  // Function to trigger download
  const downloadImage = () => {
    if (iframeRef.current?.contentWindow) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'canvasData') {
          if (event.data.dataURL) {
            const link = document.createElement('a');
            link.download = `genesis-d3-${Date.now()}.png`;
            link.href = event.data.dataURL;
            link.click();
          }
          window.removeEventListener('message', handleMessage);
        }
      };
      window.addEventListener('message', handleMessage);
      iframeRef.current.contentWindow.postMessage('downloadCanvas', '*');
    }
  };

  if (!code) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
        <div className="text-center text-gray-400">
          <p>No D3.js visualization to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <iframe
        ref={iframeRef}
        key={code}
        srcDoc={htmlContent}
        className="w-full flex-1 border-0 rounded-lg bg-gray-900"
        style={{ minHeight: `${height}px` }}
        sandbox="allow-scripts"
        title="D3.js Visualization"
      />
    </div>
  );
};

export default D3Canvas;
