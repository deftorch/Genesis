'use client';

import React, { useMemo, useRef, useEffect } from 'react';

interface MermaidCanvasProps {
  code: string;
  width?: number;
  height?: number;
}

const MermaidCanvas: React.FC<MermaidCanvasProps> = ({ code, width = 400, height = 400 }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generate the HTML content for the iframe using srcdoc
  const htmlContent = useMemo(() => {
    if (!code) return '';

    // Strip the renderer comment from the code before injecting
    const cleanCode = code.replace(/^\/\/ renderer: mermaid\s*\n?/, '').trim();

    // Escape backticks and backslashes for JS injection
    const escapedCode = cleanCode
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`');

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
      background: #ffffff;
      overflow: auto;
      padding: 20px;
    }
    .mermaid {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
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
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
</head>
<body>
  <div class="mermaid" id="mermaid-root">
    ${cleanCode}
  </div>
  <script>
    mermaid.initialize({ 
      startOnLoad: true,
      theme: 'neutral',
      securityLevel: 'loose',
      fontFamily: 'Inter, system-ui, sans-serif'
    });

    // Error handling
    window.onerror = function(msg, url, lineNo, columnNo, error) {
      document.body.innerHTML = '<div class="error"><strong>Mermaid Error:</strong><br>' + msg + '</div>';
      return false;
    };

    // Listen for message from parent to get SVG data
    window.addEventListener('message', function(event) {
      if (event.data === 'downloadCanvas') {
        var svgElement = document.querySelector('svg');
        if (svgElement) {
          var svgData = new XMLSerializer().serializeToString(svgElement);
          var svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          var url = URL.createObjectURL(svgBlob);
          var img = new Image();
          img.onload = function() {
            var canvas = document.createElement('canvas');
            var bbox = svgElement.getBBox();
            canvas.width = (bbox.width + 40) * 2;
            canvas.height = (bbox.height + 40) * 2;
            var ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.scale(2, 2);
            ctx.drawImage(img, 20, 20);
            URL.revokeObjectURL(url);
            var dataURL = canvas.toDataURL('image/png');
            window.parent.postMessage({ type: 'canvasData', dataURL: dataURL }, '*');
          };
          img.onerror = function() {
            URL.revokeObjectURL(url);
            window.parent.postMessage({ type: 'canvasData', dataURL: null }, '*');
          };
          img.src = url;
        } else {
          window.parent.postMessage({ type: 'canvasData', dataURL: null }, '*');
        }
      }
    });
  </script>
</body>
</html>`;
  }, [code]);

  const downloadImage = () => {
    if (iframeRef.current?.contentWindow) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'canvasData') {
          if (event.data.dataURL) {
            const link = document.createElement('a');
            link.download = `genesis-mermaid-${Date.now()}.png`;
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
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center text-gray-400">
          <p>No diagram to preview</p>
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
        className="w-full flex-1 border-0 rounded-lg bg-white"
        style={{ minHeight: `${height}px` }}
        sandbox="allow-scripts"
        title="Mermaid Diagram"
      />
    </div>
  );
};

export default MermaidCanvas;
