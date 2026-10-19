/** Learning history in localStorage, re-validated against the scenarios on every load. */
import { emptyHistory, validateHistory, type History } from '../engine';
import { SCENARIOS } from '../scenarios';

export const HISTORY_KEY = 'recruit-sim.history.v1';
export const CORRUPT_KEY = 'recruit-sim.history.v1.corrupt';

function local(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export type LoadResult =
  { kind: 'ok'; history: History } | { kind: 'recovered'; raw: string; errors: string[] };

export function loadHistory(): LoadResult {
  let raw: string | null;
  try {
    raw = local()?.getItem(HISTORY_KEY) ?? null;
  } catch {
    raw = null;
  }
  if (raw === null) return { kind: 'ok', history: emptyHistory() };
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return keep(raw, ['the stored history is not valid JSON']);
  }
  const r = validateHistory(value, SCENARIOS);
  return r.ok ? { kind: 'ok', history: r.history } : keep(raw, r.errors);
}

function keep(raw: string, errors: string[]): LoadResult {
  try {
    local()?.setItem(CORRUPT_KEY, raw);
  } catch {
    /* still offered as a download */
  }
  return { kind: 'recovered', raw, errors };
}

/** Returns an error message, or null when saved. */
export function saveHistory(h: History): string | null {
  const s = local();
  if (s === null)
    return 'Browser storage is unavailable; your history will be lost when you close the page.';
  try {
    s.setItem(HISTORY_KEY, JSON.stringify(h));
    return null;
  } catch {
    return 'The browser refused to save your history (storage may be full). Export it now.';
  }
}

export function newId(): string {
  const rand = Math.floor(Math.random() * 36 ** 6).toString(36);
  return `a-${Date.now().toString(36)}-${rand}`;
}
