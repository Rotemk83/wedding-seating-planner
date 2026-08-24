import React, { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Users, LayoutGrid } from 'lucide-react';
import { useSeatingState } from './hooks/useSeatingState';
import { isSecretGateUnlocked, getSavedTheme, setSavedTheme, readJsonBackupFile } from './lib/storage';
import { exportHallToPdf, exportHallToPng } from './lib/pdfExport';
import { SecretGate } from './components/SecretGate';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { HallCanvas } from './components/HallCanvas';
import { TableDetailsDrawer } from './components/TableDetailsDrawer';
import { LandingImport } from './components/LandingImport';
import { ReconcileModal } from './components/ReconcileModal';
import { GuestCard } from './components/GuestCard';
import type { GuestGroup } from './types';

export function App() {
  const [unlocked, setUnlocked] = useState<boolean>(() => isSecretGateUnlocked());
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => getSavedTheme());
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => window.innerWidth >= 1024);
  const [activeDragGuest, setActiveDragGuest] = useState<GuestGroup | null>(null);

  const csvInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  const {
    state,
    isInitialized,
    stats,
    tableOccupancies,
    selectedTableId,
    setSelectedTableId,
    highlightedTableId,
    reconcileReport,
    setReconcileReport,
    isEditLayoutMode,
    setIsEditLayoutMode,
    saveStatus,
    lastSavedTime,
    saveErrorMessage,
    canUndo,
    canRedo,
    undo,
    redo,
    updateEventName,
    resetAllData,
    assignGuestToTable,
    unassignGuest,
    clearTable,
    updateTableCapacity,
    updateTableNotes,
    updateTablePosition,
    dismissGuestFlag,
    importCsv,
    loadBackupState,
    exportBackup,
    manualSave,
    focusTable,
  } = useSeatingState();

  // Apply Theme to document root
  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    setSavedTheme(theme);
  }, [theme]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo) redo();
        } else {
          if (canUndo) undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        if (canRedo) redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        manualSave();
      } else if (e.key === 'Escape') {
        setSelectedTableId(null);
        setReconcileReport(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo, manualSave, setSelectedTableId, setReconcileReport]);

  // Drag & Drop Sensors configuration (pointer + touch)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const guest = event.active.data.current?.guest as GuestGroup | undefined;
    if (guest) {
      setActiveDragGuest(guest);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragGuest(null);

    if (!over) return;

    const guestId = active.id as string;
    const targetTableId = over.id as string;

    if (guestId && targetTableId) {
      assignGuestToTable(guestId, targetTableId);
    }
  };

  // Re-import CSV file picker handler
  const handleCsvFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const content = ev.target?.result as string;
          importCsv(content);
        } catch (err: any) {
          alert(`CSV Parse Error: ${err.message || err}`);
        }
      };
      reader.readAsText(file, 'UTF-8');
    }
    e.target.value = '';
  };

  // Backup restore file picker handler
  const handleBackupFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const backupData = await readJsonBackupFile(file);
        loadBackupState(backupData);
      } catch (err: any) {
        alert(`Backup Restore Error: ${err.message || err}`);
      }
    }
    e.target.value = '';
  };

  // Selected table object
  const selectedTable = state.tables.find((t) => t.id === selectedTableId) || null;
  const selectedTableOccupancy = selectedTableId ? tableOccupancies.get(selectedTableId) || null : null;

  // If secret gate is locked, render gate screen
  if (!unlocked) {
    return <SecretGate onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Hidden File Inputs for Update CSV and Restore Backup */}
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleCsvFileSelected}
        className="hidden"
      />
      <input
        ref={backupInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleBackupFileSelected}
        className="hidden"
      />

      {/* Top Application Header & Live Dashboard */}
      <Header
        eventName={state.eventName}
        onUpdateEventName={updateEventName}
        stats={stats}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        saveStatus={saveStatus}
        lastSavedTime={lastSavedTime}
        saveErrorMessage={saveErrorMessage}
        onManualSave={manualSave}
        theme={theme}
        onToggleTheme={setTheme}
        isEditLayoutMode={isEditLayoutMode}
        onToggleEditLayout={() => setIsEditLayoutMode(!isEditLayoutMode)}
        onOpenImportCsv={() => csvInputRef.current?.click()}
        onExportJsonBackup={exportBackup}
        onImportJsonBackup={() => backupInputRef.current?.click()}
        onExportPng={exportHallToPng}
        onExportPdf={() => exportHallToPdf(state)}
        onClearAllData={resetAllData}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {state.guests.length === 0 && isInitialized ? (
          /* First-time CSV Onboarding Experience */
          <LandingImport onImportCsv={importCsv} />
        ) : (
          /* Seating Floor Planner with DnD Context */
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* Left Collapsible Guest Sidebar */}
            <Sidebar
              guests={state.guests}
              assignments={state.assignments}
              tables={state.tables}
              onLocateTable={(num) => {
                focusTable(num);
                // On mobile, close sidebar when locating a table
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
              onUnassignGuest={unassignGuest}
              onDismissFlag={dismissGuestFlag}
              isOpen={sidebarOpen}
              onToggleOpen={() => setSidebarOpen(!sidebarOpen)}
            />

            {/* Interactive 2D Venue Floor Plan Canvas */}
            <HallCanvas
              tables={state.tables}
              hallElements={state.hallElements}
              tableOccupancies={tableOccupancies}
              selectedTableId={selectedTableId}
              highlightedTableId={highlightedTableId}
              isEditLayoutMode={isEditLayoutMode}
              onSelectTable={(id) => setSelectedTableId(id)}
              onTablePositionChange={updateTablePosition}
            />

            {/* Floating Mobile Bottom Navigation Button */}
            <div className="sm:hidden fixed bottom-4 left-4 z-40">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-full shadow-2xl font-semibold text-xs border border-indigo-400/30 active:scale-95 transition-all"
              >
                {sidebarOpen ? (
                  <>
                    <LayoutGrid className="w-4 h-4" />
                    <span>View Floor Plan</span>
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    <span>Guests ({stats.unassignedAttending} unseated)</span>
                  </>
                )}
              </button>
            </div>

            {/* Drag Overlay Card */}
            <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
              {activeDragGuest ? (
                <div className="w-80 shadow-2xl scale-105 rotate-1">
                  <GuestCard guest={activeDragGuest} isDragging />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        {/* Selected Table Details Drawer */}
        <TableDetailsDrawer
          table={selectedTable}
          occupancy={selectedTableOccupancy}
          allTables={state.tables}
          isOpen={!!selectedTableId}
          onClose={() => setSelectedTableId(null)}
          onUnassignGuest={unassignGuest}
          onMoveGuest={assignGuestToTable}
          onClearTable={clearTable}
          onUpdateCapacity={updateTableCapacity}
          onUpdateNotes={updateTableNotes}
        />

        {/* Reconciliation Report Modal after importing newer CSV */}
        <ReconcileModal
          report={reconcileReport}
          onClose={() => setReconcileReport(null)}
        />
      </div>
    </div>
  );
}

export default App;
