import React from 'react';
import { X, CheckCircle2, UserPlus, Users, AlertTriangle, ArrowRight } from 'lucide-react';
import type { ReconcileSummary } from '../types';

interface ReconcileModalProps {
  report: ReconcileSummary | null;
  onClose: () => void;
}

export const ReconcileModal: React.FC<ReconcileModalProps> = ({ report, onClose }) => {
  if (!report) return null;

  const { newInvitationsCount, attendanceChangedCount, notAttendingAssignedCount, unchangedCount, details } = report;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                CSV Synchronization Report
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Seating assignments reconciled successfully
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/50 dark:border-indigo-800/40 rounded-2xl text-center">
            <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">New Guests</div>
            <div className="text-xl font-extrabold text-indigo-700 dark:text-indigo-300 mt-0.5">
              +{newInvitationsCount}
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/50 dark:border-amber-800/40 rounded-2xl text-center">
            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">Counts Changed</div>
            <div className="text-xl font-extrabold text-amber-700 dark:text-amber-300 mt-0.5">
              {attendanceChangedCount}
            </div>
          </div>

          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200/50 dark:border-rose-800/40 rounded-2xl text-center">
            <div className="text-xs font-semibold text-rose-600 dark:text-rose-400">Not Attending</div>
            <div className="text-xl font-extrabold text-rose-700 dark:text-rose-300 mt-0.5">
              {notAttendingAssignedCount}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-center">
            <div className="text-xs font-semibold text-slate-500">Unchanged</div>
            <div className="text-xl font-extrabold text-slate-700 dark:text-slate-300 mt-0.5">
              {unchangedCount}
            </div>
          </div>
        </div>

        {/* Breakdown details */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          {/* Flagged Not Attending */}
          {details.notAttendingAssigned.length > 0 && (
            <div className="p-3.5 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl space-y-2">
              <div className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Assigned guests flagged as NOT attending:</span>
              </div>
              <ul className="space-y-1 pl-5 list-disc text-rose-600 dark:text-rose-400">
                {details.notAttendingAssigned.map((item) => (
                  <li key={item.guest.id} dir="auto">
                    <span className="font-semibold">{item.guest.name}</span>  Table {item.tableNumber} (Approved: {item.guest.approved})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Changed attendance */}
          {details.changedAttendance.length > 0 && (
            <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-2">
              <div className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>Attendance Count Adjustments:</span>
              </div>
              <ul className="space-y-1 pl-5 list-disc text-amber-800 dark:text-amber-300">
                {details.changedAttendance.map((item) => (
                  <li key={item.guest.id} dir="auto">
                    <span className="font-semibold">{item.guest.name}</span>: changed from {item.oldVal} to {item.newVal} guests
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* New Guests */}
          {details.newGuests.length > 0 && (
            <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl space-y-2">
              <div className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4" />
                <span>New RSVP arrivals added to Unassigned list:</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                {details.newGuests.length} new invitations ready to be seated on tables.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-98 transition-all"
          >
            <span>Proceed to Seating Plan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
