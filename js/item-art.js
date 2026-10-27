// Alternate artwork uses the original sprite dimensions for gameplay geometry.
export const REALISTIC_ITEMS = {
  'Red Dice': { file: 'reddice.png', width: 130, height: 115 },
  Cash: { file: 'cash.png', width: 110, height: 350 },
  Marble: { file: 'marble.png', width: 100, height: 101 },
  Key: { file: 'key.png', width: 100, height: 167 },
  cupcake: { file: 'cupcake.png', width: 256, height: 256 },
};

export function itemArt(item, realistic = false) {
  const variant = realistic && REALISTIC_ITEMS[item.name];
  return variant ? { ...variant, src: `images/realistic/${variant.file}` } : { src: item.image };
}
