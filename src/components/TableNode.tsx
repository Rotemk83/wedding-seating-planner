import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { AlertTriangle, Users } from 'lucide-react';
import type { TableConfig, TableOccupancy } from '../types';

interface TableNodeProps {
  table: TableConfig;
  occupancy: TableOccupancy;
  isSelected: boolean;
  isHighlighted: boolean;
  isEditLayoutMode: boolean;
  onSelectTable: (tableId: string) => void;
  onTablePositionChange?: (tableId: string, x: number, y: number) => void;
}

export const TableNode: React.FC<TableNodeProps> = ({
  table,
  occupancy,
  isSelected,
  isHighlighted,
  isEditLayoutMode,
  onSelectTable,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: table.id,
    data: {
      type: 'table',
      table,
    },
  });

  const { assignedCount, capacity, percentage, status, guestGroups } = occupancy;

  // Status color styles
  const getStatusClasses = () => {
    if (isOver) {
      return 'border-indigo-500 ring-4 ring-indigo-500/30 bg-indigo-50/90 dark:bg-indigo-950/80 scale-105 shadow-2xl';
    }

    if (isSelected) {
      return 'border-indigo-600 dark:border-indigo-400 ring-2 ring-indigo-500/40 shadow-xl bg-white dark:bg-slate-800';
    }

    if (isHighlighted) {
      return 'border-amber-400 ring-4 ring-amber-400/50 shadow-2xl animate-pulse bg-amber-50/80 dark:bg-amber-950/50';
    }

    switch (status) {
      case 'overcapacity':
        return 'border-rose-400 dark:border-rose-600 bg-rose-50/40 dark:bg-rose-950/20 hover:border-rose-500';
      case 'full':
        return 'border-emerald-400/80 dark:border-emerald-600/80 bg-emerald-50/30 dark:bg-emerald-950/20 hover:border-emerald-500';
      case 'moderate':
        return 'border-indigo-300 dark:border-indigo-700/60 bg-white/90 dark:bg-slate-900/90 hover:border-indigo-400';
      case 'normal':
        return 'border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 hover:border-slate-400 dark:hover:border-slate-600';
      case 'empty':
      default:
        return 'border-dashed border-slate-300 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-400';
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case 'overcapacity':
        return 'bg-rose-500';
      case 'full':
        return 'bg-emerald-500';
      case 'moderate':
        return 'bg-indigo-500';
      case 'normal':
        return 'bg-sky-500';
      default:
        return 'bg-slate-300 dark:bg-slate-700';
    }
  };

  const isRound = table.shape === 'round';

  return (
    <div
      ref={setNodeRef}
      onClick={() => onSelectTable(table.id)}
      style={{
        left: `${table.x}px`,
        top: `${table.y}px`,
        width: `${table.width}px`,
        height: `${table.height}px`,
      }}
      className={`absolute flex flex-col items-center justify-center p-2 text-center transition-all duration-150 backdrop-blur-md cursor-pointer select-none border-2 shadow-sm ${
        isRound ? 'rounded-full' : 'rounded-2xl'
      } ${getStatusClasses()} ${isEditLayoutMode ? 'cursor-move ring-1 ring-dashed ring-amber-500/50' : ''}`}
    >
      {/* Warning icon for overcapacity */}
      {status === 'overcapacity' && (
        <div
          className="absolute -top-2 -right-1.5 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md animate-bounce"
          title="Over capacity!"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Table Number */}
      <div className="flex items-baseline gap-1">
        <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
          T
        </span>
        <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {table.tableNumber}
        </span>
      </div>

      {/* Guest Count / Capacity */}
      <div className="flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-300 mt-0.5">
        <Users className="w-3 h-3 text-slate-400" />
        <span className={status === 'overcapacity' ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
          {assignedCount}
        </span>
        <span className="text-[10px] text-slate-400">/ {capacity}</span>
      </div>

      {/* Mini Progress Bar */}
      <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getProgressColor()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Guest Groups Preview Pills */}
      {guestGroups.length > 0 && !isRound && (
        <div className="mt-1 flex items-center gap-1 max-w-[90%] overflow-hidden">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
            {guestGroups[0].name}
            {guestGroups.length > 1 ? ` +${guestGroups.length - 1}` : ''}
          </span>
        </div>
      )}
    </div>
  );
};
