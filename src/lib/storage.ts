import type { EventState } from '../types';

const STORAGE_KEY = 'wedding_seating_state_v1';
const UNLOCK_KEY = 'wedding_seating_unlocked';
const THEME_KEY = 'wedding_seating_theme';
const GITHUB_TOKEN_KEY = 'wedding_seating_gh_token';

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
 * Gets stored GitHub token for direct GitHub Pages repository sync
 */
export function getStoredGitHubToken(): string | null {
  try {
    return localStorage.getItem(GITHUB_TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

/**
 * Stores GitHub token for direct GitHub Pages repository sync
 */
export function setStoredGitHubToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(GITHUB_TOKEN_KEY, token.trim());
    } else {
      localStorage.removeItem(GITHUB_TOKEN_KEY);
    }
  } catch (e) {
    console.error('Failed to save GitHub token', e);
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
 * Completely resets and clears all event data from storage
 */
export function clearAllEventData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear local event data', e);
  }
}

const GITHUB_OWNER = 'Rotemk83';
const GITHUB_REPO = 'wedding-seating-planner';
const FILE_PATH = 'data/event-state.json';

/**
 * Loads event state from remote API / GitHub with fallback to local cache
 */
export async function loadEventState(): Promise<{ state: EventState | null; source: 'remote' | 'local' | 'none' }> {
  // 1. Try remote Git endpoint first (/api/state or direct GitHub API)
  try {
    const token = getStoredGitHubToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Try serverless endpoint first with cache-busting timestamp
    let res = await fetch(`/api/state?t=${Date.now()}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    }).catch(() => null);

    // If serverless is 404/static (like on GitHub Pages), try fetching data/event-state.json directly from GitHub
    if (!res || !res.ok) {
      const ghUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/${FILE_PATH}?t=${Date.now()}`;
      res = await fetch(ghUrl, { cache: 'no-store' }).catch(() => null);
    }

    if (res && res.ok) {
      const data = await res.json();
      const remoteState = (data.state || data) as EventState;

      if (remoteState && remoteState.guests && remoteState.guests.length > 0) {
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

  // Attempt serverless Git commit or direct GitHub API commit
  const token = getStoredGitHubToken();

  try {
    // 1. Try serverless /api/state
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: updatedState }),
    }).catch(() => null);

    if (res && res.ok) {
      return {
        success: true,
        source: 'remote',
        timestamp: updatedState.lastModified,
      };
    }

    // 2. Direct GitHub API commit if token configured
    if (token) {
      const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`;
      
      // Get SHA
      let sha: string | undefined;
      const getFile = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      if (getFile.ok) {
        const fileData = await getFile.json();
        sha = fileData.sha;
      }

      const jsonStr = JSON.stringify(updatedState, null, 2);
      const b64 = btoa(unescape(encodeURIComponent(jsonStr)));

      const putRes = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Update seating state - ${new Date().toISOString()}`,
          content: b64,
          branch: 'main',
          sha,
        }),
      });

      if (putRes.ok) {
        return {
          success: true,
          source: 'remote',
          timestamp: updatedState.lastModified,
        };
      }
    }

    return {
      success: true,
      source: 'local',
      timestamp: updatedState.lastModified,
    };
  } catch (err: any) {
    return {
      success: true,
      source: 'local',
      timestamp: updatedState.lastModified,
      error: err.message || 'Offline save',
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
