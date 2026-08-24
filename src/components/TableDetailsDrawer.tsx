import React, { useState } from 'react';
import { X, Users, Trash2, ArrowRightLeft, FileText, AlertTriangle, Check, Plus, Minus } from 'lucide-react';
import type { TableConfig, TableOccupancy } from '../types';

interface TableDetailsDrawerProps {
  table: TableConfig | null;
  occupancy: TableOccupancy | null;
  allTables: TableConfig[];
  isOpen: boolean;
  onClose: () => void;
  onUnassignGuest: (guestId: string) => void;
  onMoveGuest: (guestId: string, targetTableId: string) => void;
  onClearTable: (tableId: string) => void;
  onUpdateCapacity: (tableId: string, capacity: number) => void;
  onUpdateNotes: (tableId: string, notes: string) => void;
}

export const TableDetailsDrawer: React.FC<TableDetailsDrawerProps> = ({
  table,
  occupancy,
  allTables,
  isOpen,
  onClose,
  onUnassignGuest,
  onMoveGuest,
  onClearTable,
  onUpdateCapacity,
  onUpdateNotes,
}) => {
  const [movingGuestId, setMovingGuestId] = useState<string | null>(null);
  const [targetMoveTableId, setTargetMoveTableId] = useState<string>('');
  const [notes, setNotes] = useState(table?.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  if (!isOpen || !table || !occupancy) return null;

  const handleCapacityChange = (delta: number) => {
    const newCap = Math.max(1, (table.capacity || 12) + delta);
    onUpdateCapacity(table.id, newCap);
  };

  const handleSaveNotes = () => {
    onUpdateNotes(table.id, notes);
    setIsEditingNotes(false);
  };

  const handleExecuteMove = (guestId: string) => {
    if (targetMoveTableId && targetMoveTableId !== table.id) {
      onMoveGuest(guestId, targetMoveTableId);
      setMovingGuestId(null);
      setTargetMoveTableId('');
    }
  };

  const { assignedCount, capacity, percentage, status, guestGroups } = occupancy;

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-all duration-300 animate-in slide-in-from-right">
      {/* Drawer Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              Table {table.tableNumber}
            </span>
            {table.zone && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {table.zone}
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {table.name || `Table ${table.tableNumber}`}
          </h3>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Close details (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Occupancy and Capacity Controls */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Occupancy</div>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {assignedCount} / {capacity} <span className="text-xs text-slate-500 font-normal">seats</span>
              </div>
            </div>
          </div>

          {/* Capacity Override Stepper */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => handleCapacityChange(-1)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
              title="Decrease capacity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-7 text-center text-xs font-bold text-slate-900 dark:text-white">
              {capacity}
            </span>
            <button
              onClick={() => handleCapacityChange(1)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
              title="Increase capacity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress Bar & Status Pill */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span
              className={
                status === 'overcapacity'
                  ? 'text-rose-600 dark:text-rose-400 flex items-center gap-1'
                  : status === 'full'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-400'
              }
            >
              {status === 'overcapacity' && <AlertTriangle className="w-3.5 h-3.5" />}
              {status.toUpperCase()} ({Math.round(percentage)}%)
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                status === 'overcapacity'
                  ? 'bg-rose-500'
                  : status === 'full'
                  ? 'bg-emerald-500'
                  : status === 'moderate'
                  ? 'bg-indigo-500'
                  : 'bg-sky-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Assigned Guest List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Seated Invitations ({guestGroups.length})
          </h4>
          {guestGroups.length > 0 && (
            <button
              onClick={() => onClearTable(table.id)}
              className="text-xs font-medium text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Table</span>
            </button>
          )}
        </div>

        {guestGroups.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
            <p className="text-sm font-medium">Table is currently empty</p>
            <p className="text-xs mt-1 text-slate-500">Drag guests from the sidebar to seat them here.</p>
          </div>
        ) : (
          guestGroups.map((guest) => (
            <div
              key={guest.id}
              className="p-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate rtl-text" dir="auto">
                    {guest.name}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      {guest.approved} {guest.approved === 1 ? 'guest' : 'guests'}
                    </span>
                    <span className="text-xs text-slate-500 truncate" dir="auto">
                      {guest.group}
                    </span>
                  </div>
                </div>

                {/* Remove from Table Button */}
                <button
                  onClick={() => onUnassignGuest(guest.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                  title="Unseat / Move to unassigned"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Move to another table control */}
              {movingGuestId === guest.id ? (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 flex items-center gap-1.5">
                  <select
                    value={targetMoveTableId}
                    onChange={(e) => setTargetMoveTableId(e.target.value)}
                    className="flex-1 text-xs py-1.5 px-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="">Select destination table...</option>
                    {allTables
                      .filter((t) => t.id !== table.id)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          Table {t.tableNumber} {t.name ? `(${t.name})` : ''}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={() => handleExecuteMove(guest.id)}
                    disabled={!targetMoveTableId}
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs"
                    title="Confirm move"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setMovingGuestId(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMovingGuestId(guest.id);
                    setTargetMoveTableId('');
                  }}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 pt-1"
                >
                  <ArrowRightLeft className="w-3 h-3" />
                  <span>Move to another table</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Table Notes Section */}
      <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Table Notes</span>
          </span>
          {!isEditingNotes && (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              {notes ? 'Edit' : 'Add Note'}
            </button>
          )}
        </div>

        {isEditingNotes ? (
          <div className="space-y-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Special dietary needs, near family, high chairs..."
              rows={2}
              className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsEditingNotes(false)}
                className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-md shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">
            {table.notes || 'No specific notes recorded for this table.'}
          </p>
        )}
      </div>
    </aside>
  );
};
