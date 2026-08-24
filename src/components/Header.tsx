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
  Eye,
  Share2,
  Table as TableIcon,
  Trash2,
} from 'lucide-react';
import type { StatsSummary } from '../types';
import type { SaveStatus } from '../hooks/useSeatingState';

interface HeaderProps {
  eventName: string;
  onUpdateEventName: (name: string) => void;
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
  onExportExcelCsv: () => void;
  onExportStandaloneHtml: () => void;
  onTogglePublicView: () => void;
  onClearAllData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  eventName,
  onUpdateEventName,
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
  onExportExcelCsv,
  onExportStandaloneHtml,
  onTogglePublicView,
  onClearAllData,
}) => {
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(eventName);
  const exportRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTitleInput(eventName);
  }, [eventName]);

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

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (titleInput.trim()) {
      onUpdateEventName(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

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
          <div
            className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium"
            title={lastSavedTime ? `Last saved at ${new Date(lastSavedTime).toLocaleTimeString()}` : ''}
          >
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
          <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium" title={saveErrorMessage || 'Failed to sync to server'}>
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Saved locally</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <header className="h-14 sm:h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-3 sm:px-4 flex items-center justify-between z-30 select-none">
      {/* Left: Branding & Editable Event Name */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 shrink-0">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          {isEditingTitle ? (
            <form onSubmit={handleTitleSubmit} className="flex items-center gap-1">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSubmit}
                autoFocus
                className="text-xs sm:text-sm font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-indigo-500 text-slate-900 dark:text-white"
              />
            </form>
          ) : (
            <div
              onClick={() => setIsEditingTitle(true)}
              className="flex items-center gap-1.5 cursor-pointer group"
              title="Click to rename event"
            >
              <h1 className="font-extrabold text-xs sm:text-base text-slate-900 dark:text-white tracking-tight leading-none truncate max-w-[140px] sm:max-w-[240px]">
                {eventName || 'Wedding Seating Planner'}
              </h1>
              <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">✎</span>
            </div>
          )}
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
            {stats.totalAttending} Attendees • {stats.tablesUsed}/{stats.totalTables} Tables
          </p>
        </div>
      </div>

      {/* Center: Live Stats Dashboard (Desktop) */}
      <div className="hidden lg:flex items-center gap-5 px-4 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shadow-inner">
        <div className="text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Attending</div>
          <div className="text-base font-extrabold text-slate-900 dark:text-white">{stats.totalAttending}</div>
        </div>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

        <div className="text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Assigned</div>
          <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{stats.assignedAttending}</div>
        </div>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

        <div className="text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Unassigned</div>
          <div className="text-base font-extrabold text-amber-600 dark:text-amber-400">{stats.unassignedAttending}</div>
        </div>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

        <div className="text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tables Used</div>
          <div className="text-base font-extrabold text-slate-900 dark:text-white">
            {stats.tablesUsed} <span className="text-xs text-slate-400 font-normal">/ {stats.totalTables}</span>
          </div>
        </div>
      </div>

      {/* Right: Actions, Save, Undo, Export, Public View */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Save status badge */}
        <div className="hidden md:flex items-center px-1">
          {getSaveStatusIndicator()}
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 sm:p-1 rounded-xl">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1 sm:p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1 sm:p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Save Button */}
        <button
          onClick={onManualSave}
          className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
          title="Save Seating Plan"
        >
          <Save className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">SAVE</span>
        </button>

        {/* Public Read-Only View Button */}
        <button
          onClick={onTogglePublicView}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/80 text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition-colors"
          title="תצוגת אורח / שיתוף מפה (View Only)"
        >
          <Eye className="w-3.5 h-3.5 text-purple-500" />
          <span className="hidden md:inline">תצוגת אורחים</span>
        </button>

        {/* Edit Layout Toggle */}
        <button
          onClick={onToggleEditLayout}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
            isEditLayoutMode
              ? 'bg-amber-500 text-white border-amber-600 shadow-sm animate-pulse'
              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
          title="Toggle Layout Editing Mode"
        >
          {isEditLayoutMode ? <Move className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
          <span className="hidden md:inline">{isEditLayoutMode ? 'מצב הזזה' : 'נעול'}</span>
        </button>

        {/* Update CSV Button */}
        <button
          onClick={onOpenImportCsv}
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition-colors"
          title="Import or update Guest CSV"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
          <span className="hidden md:inline">CSV</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition-colors"
            title="אפשרויות ייצוא והורדה"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs font-semibold">ייצוא</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {exportMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
              {/* Excel Table Seating List */}
              <button
                onClick={() => {
                  onExportExcelCsv();
                  setExportMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <TableIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">ייצוא טבלת שולחנות לאקסל (Excel/CSV)</div>
                  <div className="text-[10px] text-slate-400">רשימת שולחנות, שמות אורחים וטלפונים</div>
                </div>
              </button>

              {/* Standalone HTML Web View */}
              <button
                onClick={() => {
                  onExportStandaloneHtml();
                  setExportMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <Share2 className="w-4 h-4 text-purple-500 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">דף אינטרנט אינטראקטיבי (HTML)</div>
                  <div className="text-[10px] text-slate-400">קובץ עצמאי לשיתוף בוואטסאפ עם חיפוש</div>
                </div>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

              {/* PDF Chart */}
              <button
                onClick={() => {
                  onExportPdf();
                  setExportMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">תרשים הדפסה PDF</div>
                  <div className="text-[10px] text-slate-400">מסמך באיכות גבוהה להדפסה</div>
                </div>
              </button>

              {/* PNG Image */}
              <button
                onClick={() => {
                  onExportPng();
                  setExportMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <FileImage className="w-4 h-4 text-sky-500 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">תמונת מפה PNG</div>
                  <div className="text-[10px] text-slate-400">צילום מפת האולם כתמונה</div>
                </div>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

              {/* JSON Backup */}
              <button
                onClick={() => {
                  onExportJsonBackup();
                  setExportMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <Download className="w-4 h-4 text-teal-500 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">גיבוי מלא (JSON)</div>
                  <div className="text-[10px] text-slate-400">שמירת כל הנתונים כקובץ גיבוי</div>
                </div>
              </button>

              {/* JSON Restore */}
              <button
                onClick={() => {
                  onImportJsonBackup();
                  setExportMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <Upload className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">שחזור מגיבוי JSON</div>
                  <div className="text-[10px] text-slate-400">טעינת קובץ גיבוי שנשמר בעבר</div>
                </div>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

              {/* Clear All Data */}
              <button
                onClick={() => {
                  if (window.confirm('האם אתה בטוח שברצונך לאפס את כל נתוני ההושבה? פעולה זו תנקה את כל השיבוצים.')) {
                    onClearAllData();
                  }
                  setExportMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
                <div>
                  <div className="font-semibold">איפוס ומחיקת כל הנתונים</div>
                  <div className="text-[10px] text-rose-400">מנקה את כל האולם והאורחים</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <div className="relative" ref={themeRef}>
          <button
            onClick={() => setThemeMenuOpen(!themeMenuOpen)}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            title="ערכת נושא"
          >
            {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
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
                <span>בהיר</span>
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
                <span>כהה</span>
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
                <span>מערכת</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
