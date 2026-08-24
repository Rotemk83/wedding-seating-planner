import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { getSampleCsvContent } from '../lib/csvParser';

interface LandingImportProps {
  onImportCsv: (csvContent: string) => void;
}

export const LandingImport: React.FC<LandingImportProps> = ({ onImportCsv }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        onImportCsv(text);
      } catch (err: any) {
        setError(err.message || 'Failed to parse guest CSV file');
      }
    };
    reader.onerror = () => setError('Error reading file from disk');
    reader.readAsText(file, 'UTF-8');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleLoadSample = () => {
    const sample = getSampleCsvContent();
    onImportCsv(sample);
  };

  return (
    <div className="min-h-full flex items-center justify-center p-6 bg-slate-50/50 dark:bg-slate-950">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Decorative ambient gradient */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-5 shadow-inner">
            <FileSpreadsheet className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Seating Planner</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Import Guest RSVP List
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
            Upload the CSV exported from your wedding website. UTF-8 Hebrew characters and group attendance counts are parsed automatically.
          </p>

          {/* Drag and drop upload zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-8 border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 scale-[1.01]'
                : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex flex-col items-center">
              <Upload className="w-10 h-10 text-indigo-500 mb-3 animate-bounce" />
              <button
                type="button"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <span>Choose Guest CSV</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-xs text-slate-400 mt-3">
                or drag & drop your <span className="font-semibold text-slate-600 dark:text-slate-300">WeddingGuests.csv</span> file here
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs rounded-xl text-left">
              {error}
            </div>
          )}

          {/* Sample CSV Loader */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Full Hebrew & UTF-8 BOM Compatible</span>
            </span>

            <button
              onClick={handleLoadSample}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample RSVP Data (דוגמת מוזמנים)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
