// Game state: replaces NoseData + AwardsManager singletons.
import { ITEMS, LEVELS } from './data.js';
import { AWARDS, findNewAwards } from './awards.js';
import * as storage from './storage.js';

const DEFAULTS = () => ({
  coins: 0,
  totalPicks: 0,
  gamesPlayed: 0,
  itemCounts: {},      // name -> times found (0 means bought but never picked)
  levelScores: {},     // level name -> { score, passes }
  awards: [],          // earned award ids
  showGestures: true,
  seenIntro: false,
});

const listeners = new Set();
export const state = Object.assign(DEFAULTS(), storage.load() || {});

export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function notify() { for (const fn of listeners) fn(state); }

export function persist() { storage.save(state); notify(); }

export const itemsByName = new Map(ITEMS.map(i => [i.name, i]));
export const itemsByGesture = new Map(ITEMS.map(i => [i.gesture, i]));

export function getItem(name) { return itemsByName.get(name); }
export function getLevel(name) { return LEVELS.find(l => l.name === name); }

export function foundItemCount() { return Object.keys(state.itemCounts).length; }
export function totalItemCount() { return ITEMS.length; }
export function awardsCount() { return state.awards.length; }
export function totalAwards() { return AWARDS.length; }

export function addCoins(n) { state.coins += n; persist(); }

/** Called when an item has been pulled out of the nose. */
export function addFoundItem(name) {
  const item = getItem(name);
  state.itemCounts[name] = (state.itemCounts[name] || 0) + 1;
  if (item) state.coins += item.earn;
  persist();
}

export function buyItem(name) {
  const item = getItem(name);
  if (!item || state.coins < item.cost || name in state.itemCounts) return false;
  state.coins -= item.cost;
  state.itemCounts[name] = 0;
  persist();
  return true;
}

export function recordLevelScore(name, score, passes) {
  state.levelScores[name] = { score, passes };
  state.gamesPlayed += 1;
  persist();
}

/** Grants any newly qualified awards and returns their ids. */
export function checkAwards() {
  const fresh = findNewAwards(state);
  if (fresh.length) {
    state.awards.push(...fresh);
    persist();
  }
  return fresh;
}

/** Levels the player may play: every passed level plus the first unpassed one. */
export function unlockedLevels() {
  const out = [];
  for (const level of LEVELS) {
    const s = state.levelScores[level.name];
    out.push(level);
    if (!s || !s.passes) break;
  }
  return out;
}

export function setShowGestures(v) { state.showGestures = v; persist(); }
export function markIntroSeen() { state.seenIntro = true; persist(); }

export function reset() {
  Object.assign(state, DEFAULTS());
  storage.clear();
  persist();
}
