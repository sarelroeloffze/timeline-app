'use client';

import { useState, useRef } from 'react';
import { useTimelineStore } from '@/lib/stores/useTimelineStore';

interface CanvasViewProps {
  onEventClick?: (eventId: string) => void;
}

export function CanvasView({ onEventClick }: CanvasViewProps) {
  const { currentTimeline } = useTimelineStore();
  const [zoom, setZoom] = useState(100);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Canvas paper sizes (width x height in pixels at 100% zoom)
  const paperSizes = {
    'A4 Landscape': { width: 1122, height: 794 },
    'A4 Portrait': { width: 794, height: 1122 },
    'A3 Landscape': { width: 1587, height: 1122 },
    'Letter Landscape': { width: 1056, height: 816 },
    'Poster': { width: 1800, height: 2400 },
    'Banner': { width: 3000, height: 600 },
  };

  const [paperSize, setPaperSize] = useState<keyof typeof paperSizes>('A4 Landscape');
  const currentPaperSize = paperSizes[paperSize];

  // Mouse handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleFitAll = () => {
    setZoom(100);
    setPanX(0);
    setPanY(0);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="tl-view-canvas" className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Canvas View</span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={paperSize}
            onChange={(e) => setPaperSize(e.target.value as keyof typeof paperSizes)}
            className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm border border-gray-600 focus:outline-none focus:border-indigo-500"
          >
            {Object.keys(paperSizes).map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>

          <button
            onClick={() => setZoom(Math.max(25, zoom - 10))}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors"
          >
            −
          </button>
          <span className="text-sm text-gray-400 w-12 text-center">{zoom}%</span>
          <button
            onClick={() => setZoom(Math.min(200, zoom + 10))}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors"
          >
            +
          </button>
          <button
            onClick={handleFitAll}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors"
          >
            Fit All
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm transition-colors"
          >
            🖨 Print
          </button>
        </div>
      </div>

      {/* Canvas Content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-950"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="min-h-full flex items-center justify-center p-12"
          style={{
            transform: `translate(${panX}px, ${panY}px)`,
          }}
        >
          {/* Paper/Artboard */}
          <div
            id="canvas-artboard"
            className="bg-white shadow-2xl relative print:shadow-none"
            style={{
              width: `${(currentPaperSize.width * zoom) / 100}px`,
              height: `${(currentPaperSize.height * zoom) / 100}px`,
              transformOrigin: 'center center',
            }}
          >
            {/* Timeline visualization would be embedded here */}
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="text-center text-gray-800">
                <div className="text-6xl mb-4">📐</div>
                <h2 className="text-2xl font-bold mb-2">
                  {currentTimeline?.name || 'Timeline'}
                </h2>
                <p className="text-gray-600 mb-4">Canvas Artboard</p>
                <p className="text-sm text-gray-500">
                  {paperSize} · {currentPaperSize.width} × {currentPaperSize.height} px
                </p>
                <p className="text-xs text-gray-400 mt-4">
                  This view provides a printable canvas for your timeline visualization
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          #tl-view-canvas {
            overflow: visible !important;
          }
          #canvas-artboard {
            width: 100% !important;
            height: auto !important;
            transform: none !important;
          }
          .bg-gray-800,
          .bg-gray-900,
          .bg-gray-950 {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}
