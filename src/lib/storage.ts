import { EventState } from '../types';

const STORAGE_KEY = 'wedding_seating_state_v1';
const UNLOCK_KEY = 'wedding_seating_unlocked';
const THEME_KEY = 'wedding_seating_theme';

export interface SaveResult {
  success: boolean;
  source: 'remote' | 'local';
  timestamp: string;
  error?: string;
}

/**
 * Checks if the secret gate is unlocked in localStorage
 */
export function isSecretGateUnlocked(): boolean {
  try {
    return localStorage.getItem(UNLOCK_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Saves the secret gate unlock state
 */
export function setSecretGateUnlocked(unlocked: boolean): void {
  try {
    if (unlocked) {
      localStorage.setItem(UNLOCK_KEY, 'true');
    } else {
      localStorage.removeItem(UNLOCK_KEY);
    }
  } catch (e) {
    console.error('Failed to save unlock key', e);
  }
}

/**
 * Gets saved theme preference
 */
export function getSavedTheme(): 'light' | 'dark' | 'system' {
  try {
    const val = localStorage.getItem(THEME_KEY);
    if (val === 'light' || val === 'dark' || val === 'system') return val;
  } catch {
    // fallback
  }
  return 'system';
}

/**
 * Saves theme preference
 */
export function setSavedTheme(theme: 'light' | 'dark' | 'system'): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    console.error('Failed to set theme in storage', e);
  }
}

/**
 * Gets cached state from browser localStorage
 */
export function getLocalCachedState(): EventState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EventState;
  } catch (e) {
    console.error('Failed to load local state', e);
    return null;
  }
}

/**
 * Saves state directly to browser localStorage
 */
export function saveLocalCachedState(state: EventState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save local state cache', e);
  }
}

/**
 * Loads event state from remote API with fallback to local cache
 */
export async function loadEventState(): Promise<{ state: EventState | null; source: 'remote' | 'local' | 'none' }> {
  // 1. Try remote Git endpoint first
  try {
    const res = await fetch('/api/state', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.state && data.state.guests) {
        const remoteState = data.state as EventState;
        const localState = getLocalCachedState();

        // If local state has newer lastModified timestamp, prioritize local
        if (
          localState &&
          localState.lastModified &&
          remoteState.lastModified &&
          new Date(localState.lastModified).getTime() > new Date(remoteState.lastModified).getTime()
        ) {
          return { state: localState, source: 'local' };
        }

        // Cache remote locally
        saveLocalCachedState(remoteState);
        return { state: remoteState, source: 'remote' };
      }
    }
  } catch (err) {
    console.warn('Remote state fetch failed, checking local cache', err);
  }

  // 2. Fallback to local cache
  const local = getLocalCachedState();
  if (local) {
    return { state: local, source: 'local' };
  }

  return { state: null, source: 'none' };
}

/**
 * Persists event state to both local storage and remote Git endpoint
 */
export async function persistEventState(state: EventState): Promise<SaveResult> {
  const updatedState: EventState = {
    ...state,
    lastModified: new Date().toISOString(),
  };

  // Always save locally first for instant durability
  saveLocalCachedState(updatedState);

  // Attempt serverless Git commit
  try {
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: updatedState }),
    });

    if (res.ok) {
      return {
        success: true,
        source: 'remote',
        timestamp: updatedState.lastModified,
      };
    } else {
      const errText = await res.text();
      return {
        success: true, // Still durable locally
        source: 'local',
        timestamp: updatedState.lastModified,
        error: `Git sync unavailable (${res.status}): ${errText}`,
      };
    }
  } catch (err: any) {
    return {
      success: true, // Durable locally
      source: 'local',
      timestamp: updatedState.lastModified,
      error: `Offline/Git sync failed: ${err.message || err}`,
    };
  }
}

/**
 * Downloads full state as JSON backup file
 */
export function downloadJsonBackup(state: EventState): void {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `wedding-seating-backup-${dateStr}.json`;
  const jsonStr = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Reads and parses an uploaded JSON backup file
 */
export async function readJsonBackupFile(file: File): Promise<EventState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const state = JSON.parse(text) as EventState;
        if (!state.guests || !state.tables) {
          throw new Error('Invalid wedding seating backup format.');
        }
        resolve(state);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
}
