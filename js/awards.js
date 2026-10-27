// Award definitions, ported from Model/AwardsManager.cs.
// The original had a few name mismatches ("Find the Dragon" vs "Find the Dragon Flower",
// " Easter Bunny" with a leading space, "Pennies" as an item name). Those are fixed here.
const COUNT_ITEMS = [
  ['Pennies', 'Penny'], ['Red Dice', 'Red Dice'], ['Red Crayon', 'Red Crayon'], ['Quarter', 'Quarter'],
  ['Pen Cap', 'Pen Cap'], ['Paper Clip', 'Paper Clip'], ['Marble', 'Marble'], ['Lego', 'Lego'],
  ['Key', 'Key'], ['Jack', 'Jack'], ['Green Crayon', 'Green Crayon'], ['Button', 'Button'], ['Unicorn', 'Unicorn'],
];
const TIERS = [5, 10, 50, 100, 500];

export const AWARDS = [
  { id: 'Played First Game', item: null, count: 0 },
  { id: 'Find the Easter Bunny', item: 'Easter Bunny', count: 1 },
  { id: 'Find the Dragon Flower', item: 'Dragon Flower', count: 1 },
];
for (const tier of TIERS) {
  for (const [label, item] of COUNT_ITEMS) {
    AWARDS.push({ id: `Find ${tier} ${label}`, item, count: tier });
  }
}

/** Returns the award ids that `state` now qualifies for but has not earned. */
export function findNewAwards(state) {
  const fresh = [];
  for (const a of AWARDS) {
    if (state.awards.includes(a.id)) continue;
    if (a.item === null) {
      if (state.gamesPlayed > 0) fresh.push(a.id);
    } else if ((state.itemCounts[a.item] || 0) >= a.count) {
      fresh.push(a.id);
    }
  }
  return fresh;
}
