import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Users, FileText, PhoneOff, AlertTriangle, Sparkles, MapPin, X, GripVertical } from 'lucide-react';
import type { GuestGroup } from '../types';

interface GuestCardProps {
  guest: GuestGroup;
  assignedTableNumber?: number;
  onLocateTable?: (tableNumber: number) => void;
  onUnassign?: (guestId: string) => void;
  onDismissFlag?: (guestId: string) => void;
  isDragging?: boolean;
}

export const GuestCard: React.FC<GuestCardProps> = ({
  guest,
  assignedTableNumber,
  onLocateTable,
  onUnassign,
  onDismissFlag,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging: activeDragging } = useDraggable({
    id: guest.id,
    data: {
      type: 'guest',
      guest,
      assignedTableNumber,
    },
  });

  const style: React.CSSProperties = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999,
        opacity: activeDragging ? 0.6 : 1,
      }
    : {};

  const isNoPhone = guest.hasPhone === 'No' || guest.hasPhone === 'לא';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-xl border p-3 transition-all duration-150 text-left select-none ${
        activeDragging
          ? 'shadow-2xl border-indigo-500 bg-indigo-50/90 dark:bg-indigo-950/80'
          : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:shadow-md'
      }`}
    >
      {/* Flag Banners if reconciled */}
      {guest.statusFlag === 'not_attending' && (
        <div className="mb-2 px-2 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="font-semibold">Not Attending (לא מגיע)</span>
          </div>
          {onDismissFlag && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismissFlag(guest.id);
              }}
              className="hover:bg-rose-500/20 p-0.5 rounded"
              title="Dismiss warning"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {guest.statusFlag === 'updated_count' && (
        <div className="mb-2 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              Attendance updated ({guest.previousApproved}  {guest.approved})
            </span>
          </div>
          {onDismissFlag && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismissFlag(guest.id);
              }}
              className="hover:bg-amber-500/20 p-0.5 rounded"
              title="Dismiss"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {guest.statusFlag === 'new_arrival' && (
        <div className="mb-2 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>New RSVP Arrival</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mt-0.5 p-0.5 -ml-1 rounded transition-colors"
          title="Drag to seat"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Guest Name & Group */}
        <div className="flex-1 min-w-0">
          <h4
            className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate rtl-text"
            dir="auto"
            title={guest.name}
          >
            {guest.name}
          </h4>

          <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
            {/* Group Badge */}
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rtl-text truncate max-w-[140px]"
              dir="auto"
              title={guest.group}
            >
              {guest.group}
            </span>

            {/* Attendance Count Badge */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
              <Users className="w-3 h-3" />
              <span>{guest.approved}</span>
              <span className="text-[10px] opacity-75">{guest.approved === 1 ? 'guest' : 'guests'}</span>
            </span>

            {/* Assigned Table Badge */}
            {assignedTableNumber !== undefined && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLocateTable?.(assignedTableNumber);
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
                title={`Click to focus Table ${assignedTableNumber}`}
              >
                <MapPin className="w-3 h-3" />
                <span>Table {assignedTableNumber}</span>
              </button>
            )}
          </div>
        </div>

        {/* Metadata Indicators & Quick Unassign */}
        <div className="flex items-center gap-1 text-slate-400">
          {guest.hasNotes && (
            <span title="Has Notes" className="text-amber-500/80 p-1">
              <FileText className="w-3.5 h-3.5" />
            </span>
          )}
          {isNoPhone && (
            <span title="No Phone Number" className="text-slate-400 p-1">
              <PhoneOff className="w-3.5 h-3.5" />
            </span>
          )}

          {assignedTableNumber !== undefined && onUnassign && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnassign(guest.id);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
              title="Remove from table"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
