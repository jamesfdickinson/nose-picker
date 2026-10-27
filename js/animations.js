// Item pop-out motion.
//
// Every item slides out of the nostril at a slow, constant speed, hangs for a beat, then drops
// with gravity. There are three motions, one per item size class (the six storyboards in
// Controls/PickNose.xaml group into these):
//  - drop:  small, roundish things (Square_*) come straight down and fall.
//  - slide: long, thin things (Long_100x350) slide out end first, tip over and fall.
//  - crawl: creatures and vehicles (Long_300x100, Long_256x256) are flipped and turned on end so
//           they come out head first, as in the original storyboards, then tumble.
// Items are drawn at their natural size (the XAML Grid sized to the image); the 256x256 art was
// scaled to about half in the original storyboard.
export const NOSTRIL = { x: 245, y: 214 }; // lower rim of the nostril hole, head coordinates
const HOLE_DEPTH = 60; // start fully above the curved opening, including tilted item corners
const OUT_ANGLE = 7; // degrees; items leave the nostril heading slightly forward of straight down
const OUT = { x: Math.sin(OUT_ANGLE * Math.PI / 180), y: Math.cos(OUT_ANGLE * Math.PI / 180) };
const GRAVITY = 2600; // px/s^2
const FALL_TO_Y = 760; // head y the item's center must pass before it is off screen
const STEP = 1000 / 30; // keyframe spacing (ms); the browser interpolates between them

export const MOTIONS = {
  drop: { speed: 55, out: 0.8, turn: 0, flip: false, sway: 2, hang: 300, spin: 90, kick: 30 },
  slide: { speed: 95, out: 0.7, turn: 0, flip: false, sway: 3, hang: 250, spin: -160, kick: 60 },
  crawl: { speed: 80, out: 0.75, turn: 90, flip: true, sway: 5, hang: 250, spin: -120, kick: 50 },
};

export const ITEM_MOTION = {
  Square_100x100: { motion: 'drop', scale: 1 },
  Square_150x150: { motion: 'drop', scale: 1 },
  Square_128x128: { motion: 'drop', scale: 1 },
  Squarex128: { motion: 'drop', scale: 1 }, // NoseItems.xml spelling of Square_128x128
  Long_100x350: { motion: 'slide', scale: 1 },
  Long_300x100: { motion: 'crawl', scale: 1 },
  Long_256x256: { motion: 'crawl', scale: 0.5 },
};

/**
 * Keyframes for an item of `w` x `h` (drawn size, centered on its own origin) leaving the nostril.
 * Returns { keyframes, duration } for Element.animate with linear easing.
 */
export function itemKeyframes(motion, w, h) {
  const m = MOTIONS[motion] || MOTIONS.drop;
  const len = m.turn ? w : h; // extent along the way out
  const base = m.turn - OUT_ANGLE; // keeps the long axis lined up with the way out
  const scaleX = m.flip ? -1 : 1;
  const spinSign = motion === 'drop' && Math.random() < 0.5 ? -1 : 1;

  // emerge: the leading edge moves from the top of the hole to `out` of the item past the rim
  const s0 = -HOLE_DEPTH, s1 = len * m.out;
  const emerge = (s1 - s0) / m.speed * 1000;
  const hang = m.hang;
  // fall: keep the sliding speed, add gravity, until the center is off screen
  const c1 = s1 - len / 2; // center distance past the nostril when it lets go
  const y1 = NOSTRIL.y + OUT.y * c1;
  const vy = m.speed * OUT.y, g = GRAVITY;
  const fallS = (-vy + Math.sqrt(vy * vy + 2 * g * (FALL_TO_Y + len / 2 - y1))) / g;
  const duration = Math.round(emerge + hang + fallS * 1000);

  const pose = t => {
    let c, dx = 0, dy = 0, r = base;
    if (t < emerge + hang) {
      c = (t < emerge ? s0 + (s1 - s0) * (t / emerge) : s1) - len / 2;
      // a slow side-to-side wriggle while it works its way out, settling during the hang
      const settle = t < emerge ? 1 : 1 - (t - emerge) / hang;
      r += Math.sin(t / 1000 * Math.PI * 2 * 0.8) * m.sway * settle;
    } else {
      const f = (t - emerge - hang) / 1000;
      c = c1 + m.speed * f;
      dx = m.kick * f;
      dy = 0.5 * g * f * f;
      r += spinSign * m.spin * f * (0.4 + f); // starts tipping slowly, then tumbles
    }
    const x = NOSTRIL.x + OUT.x * c + dx;
    const y = NOSTRIL.y + OUT.y * c + dy;
    return `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${r.toFixed(1)}deg) scaleX(${scaleX})`;
  };

  const times = [];
  for (let t = 0; t < duration; t += STEP) times.push(t);
  times.push(duration);
  return { duration, keyframes: times.map(t => ({ offset: t / duration, transform: pose(t) })) };
}

// Head wobble while picking (Storyboard_PickNose, 2 and 3).
export const HEAD_BOBS = [
  { duration: 3000, x: [[900, 0], [1500, 6], [3000, 0]], y: [[900, -10], [1500, 6.9], [3000, 0]], r: [[900, 0], [1500, 1], [3000, 0]] },
  { duration: 3500, x: [[1000, -2], [1900, 4.7], [3500, 0]], y: [[1000, -12], [1900, 6.3], [3500, 0]], r: [[1900, 0], [2200, 2.1], [3500, 0]] },
  { duration: 3500, x: [[1000, -4], [2000, 3.6], [3500, 0]], y: [[1000, -8], [2000, 1.2], [3500, 0]], r: [[2000, 0], [2800, 2.7], [3500, 0]] },
];

function sample(channel, t, fallback = 0) {
  if (!channel || !channel.length) return fallback;
  if (t <= channel[0][0]) return channel[0][1];
  for (let i = 1; i < channel.length; i++) {
    const [t0, v0] = channel[i - 1], [t1, v1] = channel[i];
    if (t <= t1) return v0 + (v1 - v0) * ((t - t0) / (t1 - t0));
  }
  return channel[channel.length - 1][1];
}

/** Converts the per-channel key times into Web Animations keyframes. */
export function toKeyframes(path, { scale = 1, offsetX = 0, offsetY = 0 } = {}) {
  const times = new Set([0, path.duration]);
  for (const ch of ['x', 'y', 'r']) for (const [t] of (path[ch] || [])) times.add(t);
  return [...times].sort((a, b) => a - b).map(t => ({
    offset: t / path.duration,
    transform: `translate(${(sample(path.x, t) * scale + offsetX).toFixed(1)}px, ${(sample(path.y, t) * scale + offsetY).toFixed(1)}px) rotate(${sample(path.r, t).toFixed(1)}deg)`,
  }));
}
