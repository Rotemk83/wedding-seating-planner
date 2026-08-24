import React, { useState, useMemo } from 'react';
import { Sparkles, X, ZoomIn, ZoomOut, Maximize2, ArrowLeft } from 'lucide-react';
import type { EventState } from '../types';

interface PublicSeatingViewProps {
  state: EventState;
  onExit?: () => void;
}

export const PublicSeatingView: React.FC<PublicSeatingViewProps> = ({ state, onExit }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [scale, setScale] = useState(0.75);
  const [pan, setPan] = useState({ x: 20, y: 20 });
  const [isPanning, setIsPanning] = useState(false);
  const startPanRef = React.useRef({ x: 0, y: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Group guests by table
  const tableGuestsMap = useMemo(() => {
    const map = new Map<string, typeof state.guests>();
    state.tables.forEach((t) => map.set(t.id, []));

    const guestMap = new Map<string, typeof state.guests[0]>();
    state.guests.forEach((g) => guestMap.set(g.id, g));

    state.assignments.forEach((a) => {
      const g = guestMap.get(a.guestId);
      if (g && map.has(a.tableId)) {
        map.get(a.tableId)!.push(g);
      }
    });

    return map;
  }, [state.tables, state.guests, state.assignments]);

  // Find matching table IDs based on search
  const matchingTableIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.trim().toLowerCase();
    const set = new Set<string>();

    state.tables.forEach((t) => {
      const guests = tableGuestsMap.get(t.id) || [];
      const hasMatch =
        guests.some((g) => g.name.toLowerCase().includes(q)) ||
        (t.name && t.name.toLowerCase().includes(q)) ||
        String(t.tableNumber) === q;

      if (hasMatch) {
        set.add(t.id);
      }
    });

    return set;
  }, [searchQuery, state.tables, tableGuestsMap]);

  const handleFitToScreen = () => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const scaleX = (clientWidth - 40) / 1450;
    const scaleY = (clientHeight - 40) / 1250;
    const optimalScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.35), 1.2);
    setScale(optimalScale);
    setPan({
      x: Math.max(10, (clientWidth - 1450 * optimalScale) / 2),
      y: Math.max(10, (clientHeight - 1250 * optimalScale) / 2),
    });
  };

  React.useEffect(() => {
    handleFitToScreen();
  }, []);

  const selectedTable = state.tables.find((t) => t.id === selectedTableId) || null;
  const selectedTableGuests = selectedTableId ? tableGuestsMap.get(selectedTableId) || [] : [];
  const selectedTotalSeated = selectedTableGuests.reduce((sum, g) => sum + (g.approved || 0), 0);
  const selectedCapacity = selectedTable?.capacity || state.defaultCapacity || 12;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* Top Header */}
      <header className="h-16 px-4 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          {onExit && (
            <button
              onClick={onExit}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Return to planner"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">חזרה לעריכה</span>
            </button>
          )}
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
              {state.eventName || 'סידור הושבה לחתונה'}
            </h1>
            <p className="text-[11px] text-slate-400">מפת הושבה אינטראקטיבית לאורחים</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-48 sm:w-72 max-w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 חפש שם אורח / משפחה..."
            className="w-full pl-3 pr-9 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            dir="auto"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={(e) => {
          setIsPanning(true);
          startPanRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
        }}
        onMouseMove={(e) => {
          if (!isPanning) return;
          setPan({ x: e.clientX - startPanRef.current.x, y: e.clientY - startPanRef.current.y });
        }}
        onMouseUp={() => setIsPanning(false)}
        onMouseLeave={() => setIsPanning(false)}
        onWheel={(e) => {
          e.preventDefault();
          const factor = e.deltaY < 0 ? 1.08 : 0.92;
          setScale((prev) => Math.min(Math.max(prev * factor, 0.35), 2.2));
        }}
        className="relative flex-1 h-full w-full overflow-hidden bg-slate-950 canvas-grid-pattern cursor-grab active:cursor-grabbing"
      >
        {/* Floating Zoom Controls */}
        <div className="absolute bottom-6 right-6 z-20 flex items-center gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl">
          <button
            onClick={() => setScale((s) => Math.min(s + 0.15, 2.2))}
            className="p-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-indigo-400"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-300 px-2">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale((s) => Math.max(s - 0.15, 0.35))}
            className="p-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-indigo-400"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleFitToScreen}
            className="p-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-indigo-400"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* 2D Hall Plane */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            width: '1450px',
            height: '1250px',
          }}
          className="absolute select-none"
        >
          <div className="absolute inset-0 rounded-3xl border-2 border-dashed border-slate-800 bg-slate-900/30" />

          {/* Hall Elements */}
          {state.hallElements.map((el) => (
            <div
              key={el.id}
              style={{
                left: `${el.x}px`,
                top: `${el.y}px`,
                width: `${el.width}px`,
                height: `${el.height}px`,
              }}
              className="absolute rounded-2xl border-2 flex items-center justify-center p-2 text-center text-xs font-black uppercase tracking-wider shadow-md backdrop-blur-sm border-slate-700 bg-slate-800/40 text-slate-300"
            >
              {el.name}
            </div>
          ))}

          {/* Tables */}
          {state.tables.map((table) => {
            const guests = tableGuestsMap.get(table.id) || [];
            const totalSeated = guests.reduce((sum, g) => sum + (g.approved || 0), 0);
            const cap = table.capacity || state.defaultCapacity || 12;
            const isMatch = matchingTableIds.has(table.id);
            const isSelected = selectedTableId === table.id;

            return (
              <div
                key={table.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTableId(table.id);
                }}
                style={{
                  left: `${table.x}px`,
                  top: `${table.y}px`,
                  width: `${table.width}px`,
                  height: `${table.height}px`,
                }}
                className={`absolute flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-all border-2 shadow-lg backdrop-blur-md ${
                  table.shape === 'round' ? 'rounded-full' : 'rounded-2xl'
                } ${
                  isMatch
                    ? 'border-amber-400 ring-4 ring-amber-400/50 bg-amber-950/60 scale-110 shadow-2xl animate-pulse'
                    : isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/50 bg-indigo-950/60'
                    : 'border-slate-700 bg-slate-900/90 hover:border-indigo-400 hover:scale-105'
                }`}
              >
                <div className="text-xl font-black text-white">{table.tableNumber}</div>
                <div className="text-[11px] font-semibold text-slate-400">
                  {totalSeated}/{cap}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Table Guest List Modal */}
      {selectedTable && (
        <div
          onClick={() => setSelectedTableId(null)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95"
          >
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800/60">
                  שולחן {selectedTable.tableNumber}
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  {selectedTable.name || `שולחן ${selectedTable.tableNumber}`}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  תפוסה: {selectedTotalSeated} מתוך {selectedCapacity} מקומות
                </p>
              </div>
              <button
                onClick={() => setSelectedTableId(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                מוזמנים בשולחן ({selectedTableGuests.length})
              </div>
              {selectedTableGuests.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  שולחן זה עדיין ריק
                </div>
              ) : (
                selectedTableGuests.map((guest) => (
                  <div
                    key={guest.id}
                    className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-bold text-white" dir="auto">
                        {guest.name}
                      </div>
                      <div className="text-xs text-slate-400">{guest.group || 'כללי'}</div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {guest.approved} מקומות
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
