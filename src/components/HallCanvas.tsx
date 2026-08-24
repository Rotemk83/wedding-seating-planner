import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Move, Music, Sparkles, GlassWater, DoorOpen, Hand } from 'lucide-react';
import type { TableConfig, HallElement, TableOccupancy } from '../types';
import { TableNode } from './TableNode';

interface HallCanvasProps {
  tables: TableConfig[];
  hallElements: HallElement[];
  tableOccupancies: Map<string, TableOccupancy>;
  selectedTableId: string | null;
  highlightedTableId: string | null;
  isEditLayoutMode: boolean;
  onSelectTable: (tableId: string) => void;
  onTablePositionChange?: (tableId: string, x: number, y: number) => void;
}

export const HallCanvas: React.FC<HallCanvasProps> = ({
  tables,
  hallElements,
  tableOccupancies,
  selectedTableId,
  highlightedTableId,
  isEditLayoutMode,
  onSelectTable,
  onTablePositionChange,
}) => {
  const [scale, setScale] = useState(0.75);
  const [pan, setPan] = useState({ x: 20, y: 20 });
  const [isPanning, setIsPanning] = useState(false);
  const startPanRef = useRef({ x: 0, y: 0 });
  const touchDistanceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom controls
  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.15, 2.2));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.15, 0.35));
  const handleResetZoom = () => {
    setScale(0.75);
    setPan({ x: 20, y: 20 });
  };

  const handleFitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const canvasWidth = 1450;
    const canvasHeight = 1250;

    const scaleX = (clientWidth - 40) / canvasWidth;
    const scaleY = (clientHeight - 40) / canvasHeight;
    const optimalScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.35), 1.2);

    setScale(optimalScale);
    setPan({
      x: Math.max(10, (clientWidth - canvasWidth * optimalScale) / 2),
      y: Math.max(10, (clientHeight - canvasHeight * optimalScale) / 2),
    });
  }, []);

  // Fit on mount and on window resize
  useEffect(() => {
    handleFitToScreen();
    window.addEventListener('resize', handleFitToScreen);
    return () => window.removeEventListener('resize', handleFitToScreen);
  }, [handleFitToScreen]);

  // Mouse Pan interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.table-node-element')) return;
    setIsPanning(true);
    startPanRef.current = {
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - startPanRef.current.x,
      y: e.clientY - startPanRef.current.y,
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setScale((prev) => Math.min(Math.max(prev * zoomFactor, 0.35), 2.2));
  };

  // Touch Gesture Handling for Mobile & Tablets
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // 1 Finger Pan
      setIsPanning(true);
      startPanRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      };
      touchDistanceRef.current = null;
    } else if (e.touches.length === 2) {
      // 2 Finger Pinch Zoom
      setIsPanning(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistanceRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isPanning) {
      // Pan
      setPan({
        x: e.touches[0].clientX - startPanRef.current.x,
        y: e.touches[0].clientY - startPanRef.current.y,
      });
    } else if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      // Pinch Zoom
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = dist / touchDistanceRef.current;
      setScale((prev) => Math.min(Math.max(prev * (delta > 1 ? 1.03 : 0.97), 0.35), 2.2));
      touchDistanceRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    touchDistanceRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'none' }}
      className={`relative flex-1 h-full w-full overflow-hidden bg-slate-100 dark:bg-slate-950 canvas-grid-pattern select-none ${
        isPanning ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Floating Canvas Controls (Mobile & Desktop) */}
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl">
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 px-1.5 sm:px-2 min-w-[42px] sm:min-w-[48px] text-center">
          {Math.round(scale * 100)}%
        </span>

        <button
          onClick={handleZoomOut}
          className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 my-auto" />

        <button
          onClick={handleFitToScreen}
          className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors"
          title="Fit Venue to Screen"
        >
          <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <button
          onClick={handleResetZoom}
          className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Mobile Touch Gesture Hint */}
      <div className="sm:hidden absolute top-3 left-3 z-30 px-2.5 py-1 bg-slate-900/75 text-slate-200 text-[10px] font-medium rounded-lg backdrop-blur-sm pointer-events-none flex items-center gap-1">
        <Hand className="w-3 h-3 text-indigo-400" />
        <span>Touch & drag to pan | Pinch to zoom</span>
      </div>

      {/* Edit Layout Mode Banner */}
      {isEditLayoutMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-amber-500 text-white text-xs font-semibold rounded-full shadow-lg flex items-center gap-2 animate-pulse">
          <Move className="w-4 h-4" />
          <span>Edit Layout Mode: Drag tables to reposition</span>
        </div>
      )}

      {/* Scalable & Pannable Hall Container */}
      <div
        id="hall-canvas-export-target"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          width: '1450px',
          height: '1250px',
        }}
        className="absolute transition-transform duration-75 select-none"
      >
        {/* Hall Boundary Box */}
        <div className="absolute inset-0 rounded-3xl border-2 border-dashed border-slate-300/80 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/30 backdrop-blur-[2px]" />

        {/* Hall Elements */}
        {hallElements.map((el) => {
          if (el.type === 'stage') {
            return (
              <div
                key={el.id}
                style={{
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  width: `${el.width}px`,
                  height: `${el.height}px`,
                }}
                className="absolute rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border-2 border-amber-500/40 flex flex-col items-center justify-center p-3 text-amber-700 dark:text-amber-300 shadow-md backdrop-blur-sm"
              >
                <Sparkles className="w-5 h-5 mb-1 text-amber-500" />
                <span className="text-xs font-extrabold uppercase tracking-widest text-center">
                  {el.name}
                </span>
              </div>
            );
          }

          if (el.type === 'dance_floor') {
            return (
              <div
                key={el.id}
                style={{
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  width: `${el.width}px`,
                  height: `${el.height}px`,
                }}
                className="absolute rounded-3xl bg-indigo-500/5 dark:bg-indigo-500/10 border-2 border-indigo-500/30 flex flex-col items-center justify-center p-4 text-indigo-700 dark:text-indigo-300 shadow-inner"
              >
                <Music className="w-8 h-8 mb-2 text-indigo-400 opacity-60 animate-pulse" />
                <span className="text-sm font-black uppercase tracking-widest text-center">
                  {el.name}
                </span>
                <span className="text-[11px] text-indigo-500/70 mt-1">MAIN CELEBRATION ZONE</span>
              </div>
            );
          }

          if (el.type === 'dj') {
            return (
              <div
                key={el.id}
                style={{
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  width: `${el.width}px`,
                  height: `${el.height}px`,
                }}
                className="absolute rounded-xl bg-purple-500/15 border border-purple-500/40 flex items-center justify-center p-2 text-purple-700 dark:text-purple-300 text-[11px] font-bold shadow-sm"
              >
                <Music className="w-3.5 h-3.5 mr-1" />
                <span>{el.name}</span>
              </div>
            );
          }

          if (el.type === 'bar') {
            return (
              <div
                key={el.id}
                style={{
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  width: `${el.width}px`,
                  height: `${el.height}px`,
                }}
                className="absolute rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 flex flex-col items-center justify-center p-2 text-emerald-700 dark:text-emerald-300 shadow-sm"
              >
                <GlassWater className="w-4 h-4 mb-1 text-emerald-500" />
                <span className="text-[11px] font-bold text-center">{el.name}</span>
              </div>
            );
          }

          if (el.type === 'entrance') {
            return (
              <div
                key={el.id}
                style={{
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  width: `${el.width}px`,
                  height: `${el.height}px`,
                }}
                className="absolute rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 border-2 border-slate-400 dark:border-slate-600 flex items-center justify-center gap-2 p-2 text-slate-700 dark:text-slate-200 shadow-md"
              >
                <DoorOpen className="w-5 h-5 text-slate-500" />
                <span className="text-xs font-bold uppercase tracking-wider">{el.name}</span>
              </div>
            );
          }

          return null;
        })}

        {/* 34 Tables */}
        {tables.map((table) => {
          const occupancy = tableOccupancies.get(table.id) || {
            tableId: table.id,
            tableNumber: table.tableNumber,
            capacity: table.capacity || 12,
            assignedCount: 0,
            percentage: 0,
            status: 'empty',
            guestGroups: [],
          };

          return (
            <TableNode
              key={table.id}
              table={table}
              occupancy={occupancy}
              isSelected={selectedTableId === table.id}
              isHighlighted={highlightedTableId === table.id}
              isEditLayoutMode={isEditLayoutMode}
              onSelectTable={onSelectTable}
              onTablePositionChange={onTablePositionChange}
            />
          );
        })}
      </div>
    </div>
  );
};
