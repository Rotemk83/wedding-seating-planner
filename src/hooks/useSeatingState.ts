import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import type {
  EventState,
  GuestGroup,
  TableOccupancy,
  TableConfig,
  StatsSummary,
  ReconcileSummary,
} from '../types';
import { getDefaultTables, getDefaultHallElements } from '../lib/defaultHallLayout';
import {
  loadEventState,
  persistEventState,
  downloadJsonBackup,
  clearAllEventData,
} from '../lib/storage';
import { parseGuestCsv } from '../lib/csvParser';
import { reconcileGuestsWithCsv } from '../lib/reconciliation';

export type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

const INITIAL_VERSION = '1.0.0';

export function createInitialState(): EventState {
  return {
    version: INITIAL_VERSION,
    lastModified: new Date().toISOString(),
    eventName: 'Wedding Seating Planner',
    defaultCapacity: 12,
    guests: [],
    assignments: [],
    tables: getDefaultTables(12),
    hallElements: getDefaultHallElements(),
    notes: '',
    preferences: {
      theme: 'system',
    },
  };
}

export function useSeatingState() {
  const [state, setState] = useState<EventState>(createInitialState);
  const [history, setHistory] = useState<{ past: EventState[]; future: EventState[] }>({
    past: [],
    future: [],
  });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [highlightedTableId, setHighlightedTableId] = useState<string | null>(null);
  const [reconcileReport, setReconcileReport] = useState<ReconcileSummary | null>(null);
  const [isEditLayoutMode, setIsEditLayoutMode] = useState(false);

  const prevUnassignedRef = useRef<number>(-1);
  const autosaveTimerRef = useRef<number | null>(null);

  // Initialize state from storage / Git
  useEffect(() => {
    async function init() {
      try {
        const { state: loadedState } = await loadEventState();
        if (loadedState && loadedState.guests && loadedState.guests.length > 0) {
          const mergedState: EventState = {
            ...loadedState,
            tables:
              loadedState.tables && loadedState.tables.length > 0
                ? loadedState.tables
                : getDefaultTables(loadedState.defaultCapacity || 12),
            hallElements:
              loadedState.hallElements && loadedState.hallElements.length > 0
                ? loadedState.hallElements
                : getDefaultHallElements(),
          };
          setState(mergedState);
          setLastSavedTime(mergedState.lastModified);
          setSaveStatus('saved');
        }
      } catch (err) {
        console.error('Failed to load initial state', err);
      } finally {
        setIsInitialized(true);
      }
    }
    init();
  }, []);

  // Periodic background check for live updates from scraper / remote state
  useEffect(() => {
    if (!isInitialized) return;

    const checkLiveUpdates = async () => {
      // Avoid merging if user currently has pending local edits
      if (saveStatus === 'unsaved' || saveStatus === 'saving') return;

      try {
        const { state: remoteState } = await loadEventState();
        if (
          remoteState &&
          remoteState.lastModified &&
          state.lastModified &&
          new Date(remoteState.lastModified).getTime() > new Date(state.lastModified).getTime()
        ) {
          if (state.guests.length === 0) {
            // First time loading data from background scraper
            setState((prev) => ({
              ...remoteState,
              tables:
                remoteState.tables && remoteState.tables.length > 0
                  ? remoteState.tables
                  : prev.tables && prev.tables.length > 0
                  ? prev.tables
                  : getDefaultTables(remoteState.defaultCapacity || 12),
              hallElements:
                remoteState.hallElements && remoteState.hallElements.length > 0
                  ? remoteState.hallElements
                  : prev.hallElements && prev.hallElements.length > 0
                  ? prev.hallElements
                  : getDefaultHallElements(),
            }));
            setLastSavedTime(remoteState.lastModified);
            setSaveStatus('saved');
          } else if (remoteState.guests && remoteState.guests.length > 0) {
            // Non-destructively reconcile guest counts & new arrivals
            const { updatedGuests, updatedAssignments } = reconcileGuestsWithCsv(
              state.guests,
              state.assignments,
              state.tables,
              remoteState.guests
            );

            setState((prev) => ({
              ...prev,
              guests: updatedGuests,
              assignments: updatedAssignments,
              lastModified: remoteState.lastModified,
            }));
            setLastSavedTime(remoteState.lastModified);
            setSaveStatus('saved');
          }
        }
      } catch (err) {
        // Silently continue
      }
    };

    const intervalId = window.setInterval(checkLiveUpdates, 20000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkLiveUpdates();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isInitialized, state.lastModified, state.guests, state.assignments, state.tables, saveStatus]);

  // Compute Table Occupancies
  const tableOccupancies = useMemo(() => {
    const occupancies = new Map<string, TableOccupancy>();
    const guestMap = new Map<string, GuestGroup>();
    state.guests.forEach((g) => guestMap.set(g.id, g));

    // Group guests by table
    const tableGuestsMap = new Map<string, GuestGroup[]>();
    state.tables.forEach((t) => tableGuestsMap.set(t.id, []));

    state.assignments.forEach((a) => {
      const guest = guestMap.get(a.guestId);
      if (guest && tableGuestsMap.has(a.tableId)) {
        tableGuestsMap.get(a.tableId)!.push(guest);
      }
    });

    state.tables.forEach((t) => {
      const assignedGuests = tableGuestsMap.get(t.id) || [];
      const assignedCount = assignedGuests.reduce((sum, g) => sum + (g.approved || 0), 0);
      const capacity = t.capacity || state.defaultCapacity || 12;
      const percentage = capacity > 0 ? (assignedCount / capacity) * 100 : 0;

      let status: TableOccupancy['status'] = 'empty';
      if (assignedCount === 0) {
        status = 'empty';
      } else if (percentage > 100) {
        status = 'overcapacity';
      } else if (percentage >= 91) {
        status = 'full';
      } else if (percentage >= 71) {
        status = 'moderate';
      } else {
        status = 'normal';
      }

      occupancies.set(t.id, {
        tableId: t.id,
        tableNumber: t.tableNumber,
        capacity,
        assignedCount,
        percentage,
        status,
        guestGroups: assignedGuests,
      });
    });

    return occupancies;
  }, [state.guests, state.assignments, state.tables, state.defaultCapacity]);

  // Compute Overall Statistics
  const stats: StatsSummary = useMemo(() => {
    const totalAttending = state.guests.reduce((sum, g) => sum + (g.approved || 0), 0);
    const assignedGuestIds = new Set(state.assignments.map((a) => a.guestId));

    let assignedAttending = 0;
    let unassignedAttending = 0;

    state.guests.forEach((g) => {
      if (assignedGuestIds.has(g.id)) {
        assignedAttending += g.approved || 0;
      } else {
        unassignedAttending += g.approved || 0;
      }
    });

    let tablesUsed = 0;
    let largestTable = { tableNumber: 0, count: 0 };

    tableOccupancies.forEach((occ) => {
      if (occ.assignedCount > 0) {
        tablesUsed++;
      }
      if (occ.assignedCount > largestTable.count) {
        largestTable = { tableNumber: occ.tableNumber, count: occ.assignedCount };
      }
    });

    const averagePerTable = tablesUsed > 0 ? Math.round((assignedAttending / tablesUsed) * 10) / 10 : 0;

    return {
      totalAttending,
      assignedAttending,
      unassignedAttending,
      totalGuestsCount: state.guests.length,
      tablesUsed,
      totalTables: state.tables.length,
      averagePerTable,
      largestTable,
    };
  }, [state.guests, state.assignments, state.tables.length, tableOccupancies]);

  // Trigger celebratory confetti when all guests are assigned
  useEffect(() => {
    if (
      isInitialized &&
      stats.totalAttending > 0 &&
      stats.unassignedAttending === 0 &&
      prevUnassignedRef.current > 0
    ) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }
    }
    if (isInitialized) {
      prevUnassignedRef.current = stats.unassignedAttending;
    }
  }, [stats.unassignedAttending, stats.totalAttending, isInitialized]);

  // Push state to undo stack before mutating
  const updateStateWithHistory = useCallback(
    (updater: (prev: EventState) => EventState) => {
      setState((prevState) => {
        const nextState = updater(prevState);
        if (nextState === prevState) return prevState;

        setHistory((prevH) => ({
          past: [...prevH.past.slice(-30), prevState],
          future: [],
        }));

        setSaveStatus('unsaved');
        return nextState;
      });
    },
    []
  );

  // Debounced Autosave (saves 1.5s after last change)
  useEffect(() => {
    if (!isInitialized || saveStatus !== 'unsaved') return;

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(async () => {
      setSaveStatus('saving');
      const res = await persistEventState(state);
      if (res.success) {
        setSaveStatus('saved');
        setLastSavedTime(res.timestamp);
        setSaveErrorMessage(res.error || null);
      } else {
        setSaveStatus('error');
        setSaveErrorMessage(res.error || 'Failed to save state');
      }
    }, 1500);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [state, saveStatus, isInitialized]);

  // Manual Save Action
  const manualSave = useCallback(async () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    setSaveStatus('saving');
    const res = await persistEventState(state);
    if (res.success) {
      setSaveStatus('saved');
      setLastSavedTime(res.timestamp);
      setSaveErrorMessage(res.error || null);
    } else {
      setSaveStatus('error');
      setSaveErrorMessage(res.error || 'Save failed');
    }
  }, [state]);

  // Undo
  const undo = useCallback(() => {
    setHistory((prevH) => {
      if (prevH.past.length === 0) return prevH;
      const previous = prevH.past[prevH.past.length - 1];
      const newPast = prevH.past.slice(0, -1);

      setState(previous);
      setSaveStatus('unsaved');

      return {
        past: newPast,
        future: [state, ...prevH.future],
      };
    });
  }, [state]);

  // Redo
  const redo = useCallback(() => {
    setHistory((prevH) => {
      if (prevH.future.length === 0) return prevH;
      const next = prevH.future[0];
      const newFuture = prevH.future.slice(1);

      setState(next);
      setSaveStatus('unsaved');

      return {
        past: [...prevH.past, state],
        future: newFuture,
      };
    });
  }, [state]);

  // Update Event Title Name
  const updateEventName = useCallback(
    (name: string) => {
      updateStateWithHistory((prev) => ({
        ...prev,
        eventName: name,
      }));
    },
    [updateStateWithHistory]
  );

  // Reset / Clear All Data
  const resetAllData = useCallback(() => {
    clearAllEventData();
    const fresh = createInitialState();
    setState(fresh);
    setHistory({ past: [], future: [] });
    setSelectedTableId(null);
    setHighlightedTableId(null);
    setReconcileReport(null);
    setSaveStatus('saved');
    persistEventState(fresh);
  }, []);

  // Assign Guest to Table (Atomic reassignment)
  const assignGuestToTable = useCallback(
    (guestId: string, targetTableId: string) => {
      updateStateWithHistory((prev) => {
        const filtered = prev.assignments.filter((a) => a.guestId !== guestId);
        return {
          ...prev,
          assignments: [...filtered, { guestId, tableId: targetTableId }],
        };
      });
    },
    [updateStateWithHistory]
  );

  // Unassign Guest
  const unassignGuest = useCallback(
    (guestId: string) => {
      updateStateWithHistory((prev) => ({
        ...prev,
        assignments: prev.assignments.filter((a) => a.guestId !== guestId),
      }));
    },
    [updateStateWithHistory]
  );

  // Clear Table
  const clearTable = useCallback(
    (tableId: string) => {
      updateStateWithHistory((prev) => ({
        ...prev,
        assignments: prev.assignments.filter((a) => a.tableId !== tableId),
      }));
    },
    [updateStateWithHistory]
  );

  // Update table capacity
  const updateTableCapacity = useCallback(
    (tableId: string, capacity: number) => {
      updateStateWithHistory((prev) => ({
        ...prev,
        tables: prev.tables.map((t) => (t.id === tableId ? { ...t, capacity } : t)),
      }));
    },
    [updateStateWithHistory]
  );

  // Update table notes
  const updateTableNotes = useCallback(
    (tableId: string, notes: string) => {
      updateStateWithHistory((prev) => ({
        ...prev,
        tables: prev.tables.map((t) => (t.id === tableId ? { ...t, notes } : t)),
      }));
    },
    [updateStateWithHistory]
  );

  // Update table details (shape, name, zone, capacity, notes, dimensions)
  const updateTableDetails = useCallback(
    (tableId: string, updates: Partial<TableConfig>) => {
      updateStateWithHistory((prev) => ({
        ...prev,
        tables: prev.tables.map((t) => (t.id === tableId ? { ...t, ...updates } : t)),
      }));
    },
    [updateStateWithHistory]
  );

  // Update table position
  const updateTablePosition = useCallback(
    (tableId: string, x: number, y: number) => {
      updateStateWithHistory((prev) => ({
        ...prev,
        tables: prev.tables.map((t) => (t.id === tableId ? { ...t, x, y } : t)),
      }));
    },
    [updateStateWithHistory]
  );

  // Dismiss status flag
  const dismissGuestFlag = useCallback(
    (guestId: string) => {
      updateStateWithHistory((prev) => ({
        ...prev,
        guests: prev.guests.map((g) => (g.id === guestId ? { ...g, statusFlag: 'normal' } : g)),
      }));
    },
    [updateStateWithHistory]
  );

  // Import CSV
  const importCsv = useCallback(
    (csvContent: string) => {
      const parseResult = parseGuestCsv(csvContent);
      if (parseResult.guests.length === 0) {
        throw new Error('No valid guest records found in CSV file.');
      }

      if (state.guests.length === 0) {
        // First time import
        updateStateWithHistory((prev) => ({
          ...prev,
          guests: parseResult.guests,
          assignments: [],
        }));
        setReconcileReport({
          newInvitationsCount: parseResult.guests.length,
          attendanceChangedCount: 0,
          notAttendingAssignedCount: 0,
          unchangedCount: 0,
          details: {
            newGuests: parseResult.guests,
            changedAttendance: [],
            notAttendingAssigned: [],
          },
        });
      } else {
        // Reconciliation re-import
        const { updatedGuests, updatedAssignments, summary } = reconcileGuestsWithCsv(
          state.guests,
          state.assignments,
          state.tables,
          parseResult.guests
        );

        updateStateWithHistory((prev) => ({
          ...prev,
          guests: updatedGuests,
          assignments: updatedAssignments,
        }));
        setReconcileReport(summary);
      }
    },
    [state.guests, state.assignments, state.tables, updateStateWithHistory]
  );

  // Load JSON Backup
  const loadBackupState = useCallback(
    (backupState: EventState) => {
      updateStateWithHistory(() => backupState);
    },
    [updateStateWithHistory]
  );

  // Export JSON Backup
  const exportBackup = useCallback(() => {
    downloadJsonBackup(state);
  }, [state]);

  // Focus table
  const focusTable = useCallback(
    (tableNumber: number) => {
      const table = state.tables.find((t) => t.tableNumber === tableNumber);
      if (table) {
        setSelectedTableId(table.id);
        setHighlightedTableId(table.id);
        setTimeout(() => setHighlightedTableId(null), 2500);
      }
    },
    [state.tables]
  );

  return {
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
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    undo,
    redo,
    updateEventName,
    resetAllData,
    assignGuestToTable,
    unassignGuest,
    clearTable,
    updateTableCapacity,
    updateTableNotes,
    updateTableDetails,
    updateTablePosition,
    dismissGuestFlag,
    importCsv,
    loadBackupState,
    exportBackup,
    manualSave,
    focusTable,
  };
}
