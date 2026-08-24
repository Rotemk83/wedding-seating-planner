import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Undo2,
  Redo2,
  Save,
  Moon,
  Sun,
  Laptop,
  Download,
  Upload,
  FileSpreadsheet,
  FileImage,
  FileText,
  Move,
  Lock,
  Check,
  AlertCircle,
  Clock,
  ChevronDown,
} from 'lucide-react';
import type { StatsSummary } from '../types';
import type { SaveStatus } from '../hooks/useSeatingState';

interface HeaderProps {
  eventName: string;
  stats: StatsSummary;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  saveStatus: SaveStatus;
  lastSavedTime: string | null;
  saveErrorMessage: string | null;
  onManualSave: () => void;
  theme: 'light' | 'dark' | 'system';
  onToggleTheme: (theme: 'light' | 'dark' | 'system') => void;
  isEditLayoutMode: boolean;
  onToggleEditLayout: () => void;
  onOpenImportCsv: () => void;
  onExportJsonBackup: () => void;
  onImportJsonBackup: () => void;
  onExportPng: () => void;
  onExportPdf: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  eventName,
  stats,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  saveStatus,
  lastSavedTime,
  saveErrorMessage,
  onManualSave,
  theme,
  onToggleTheme,
  isEditLayoutMode,
  onToggleEditLayout,
  onOpenImportCsv,
  onExportJsonBackup,
  onImportJsonBackup,
  onExportPng,
  onExportPdf,
}) => {
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setExportMenuOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(event.target as Node)) {
        setThemeMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSaveStatusIndicator = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-1.5 text-xs text-amber-500 font-medium animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            <span>Saving...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium" title={lastSavedTime ? `Last saved at ${new Date(lastSavedTime).toLocaleTimeString()}` : ''}>
            <Check className="w-3.5 h-3.5" />
            <span>Saved {lastSavedTime ? new Date(lastSavedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
          </div>
        );
      case 'unsaved':
        return (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Unsaved</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium" title={saveErrorMessage || 'Failed to sync to Git'}>
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Saved locally</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-4 flex items-center justify-between z-30 select-none">
      {/* Left: Branding & Event Name */}
      <div className="flex items-center gap-3 min-w-[240px]">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight leading-none">
              Wedding Planner
            </h1>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
              PRO
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px] sm:max-w-[260px] font-medium" dir="auto">
            {eventName}
          </p>
        </div>
      </div>

      {/* Center: Live Stats Dashboard */}
      <div className="hidden lg:flex items-center gap-6 px-4 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shadow-inner">
        <div className="flex items-center gap-2">
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Attending</div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white">
              {stats.totalAttending}
            </div>
          </div>
        </div>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

        <div className="flex items-center gap-2">
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Assigned</div>
            <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
              {stats.assignedAttending}
            </div>
          </div>
        </div>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

        <div className="flex items-center gap-2">
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Unassigned</div>
            <div className="text-base font-extrabold text-amber-600 dark:text-amber-400">
              {stats.unassignedAttending}
            </div>
          </div>
        </div>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

        <div className="flex items-center gap-2">
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tables Used</div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white">
              {stats.tablesUsed} <span className="text-xs text-slate-400 font-normal">/ {stats.totalTables}</span>
            </div>
          </div>
        </div>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

        <div className="flex items-center gap-2">
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg / Table</div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white">
              {stats.averagePerTable}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Actions, Undo/Redo, Save & Theme */}
      <div className="flex items-center gap-2">
        {/* Save status badge */}
        <div className="hidden sm:flex items-center px-2 py-1">
          {getSaveStatusIndicator()}
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Manual Save Button */}
        <button
          onClick={onManualSave}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
          title="Save Seating Plan (Ctrl+S)"
        >
          <Save className="w-3.5 h-3.5" />
          <span>SAVE</span>
        </button>

        {/* Edit Layout Toggle */}
        <button
          onClick={onToggleEditLayout}
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
            isEditLayoutMode
              ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
          title="Toggle Layout Editing Mode"
        >
          {isEditLayoutMode ? <Move className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
          <span>{isEditLayoutMode ? 'Editing Layout' : 'Layout Locked'}</span>
        </button>

        {/* Update CSV Button */}
        <button
          onClick={onOpenImportCsv}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition-colors"
          title="Import or update Guest CSV"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
          <span>Update CSV</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {exportMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95">
              <button
                onClick={() => {
                  onExportPdf();
                  setExportMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <FileText className="w-4 h-4 text-indigo-500" />
                <div>
                  <div className="font-semibold">Export PDF Chart</div>
                  <div className="text-[10px] text-slate-400">High-res printable document</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onExportPng();
                  setExportMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <FileImage className="w-4 h-4 text-sky-500" />
                <div>
                  <div className="font-semibold">Export PNG Image</div>
                  <div className="text-[10px] text-slate-400">Floor plan image snapshot</div>
                </div>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

              <button
                onClick={() => {
                  onExportJsonBackup();
                  setExportMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-500" />
                <div>
                  <div className="font-semibold">Export JSON Backup</div>
                  <div className="text-[10px] text-slate-400">Complete application state</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onImportJsonBackup();
                  setExportMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <Upload className="w-4 h-4 text-amber-500" />
                <div>
                  <div className="font-semibold">Restore JSON Backup</div>
                  <div className="text-[10px] text-slate-400">Upload saved backup file</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Theme Toggle Dropdown */}
        <div className="relative" ref={themeRef}>
          <button
            onClick={() => setThemeMenuOpen(!themeMenuOpen)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="Toggle theme (Light / Dark / System)"
          >
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Laptop className="w-4 h-4" />
            )}
          </button>

          {themeMenuOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1 z-50 text-xs">
              <button
                onClick={() => {
                  onToggleTheme('light');
                  setThemeMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors ${
                  theme === 'light' ? 'bg-indigo-50 dark:bg-indigo-950 font-bold text-indigo-600' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </button>

              <button
                onClick={() => {
                  onToggleTheme('dark');
                  setThemeMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors ${
                  theme === 'dark' ? 'bg-indigo-50 dark:bg-indigo-950 font-bold text-indigo-600' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dark</span>
              </button>

              <button
                onClick={() => {
                  onToggleTheme('system');
                  setThemeMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors ${
                  theme === 'system' ? 'bg-indigo-50 dark:bg-indigo-950 font-bold text-indigo-600' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>System</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
