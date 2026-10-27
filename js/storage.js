// Persistence: replaces the WP8 IsolatedStorage JSON files (data.txt, Awards.txt).
const KEY = 'nosepicker.v1';

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable (private mode etc.) - play without saving */
  }
}

export function clear() {
  try {
    localStorage.removeItem(KEY);
  } catch { /* ignore */ }
}
