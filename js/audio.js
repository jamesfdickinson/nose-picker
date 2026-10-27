// Sound effects. The Silverlight app shipped these files but never wired them up.
const files = {
  squeek: ['audio/squeek_1.mp3', 'audio/squeek_2.mp3', 'audio/squeek_3.mp3', 'audio/squeek_4.mp3'],
  coins: ['audio/coins.mp3'],
  win: ['audio/win.mp3'],
  wrong: ['audio/wrong.mp3'],
  shake: ['audio/shake.mp3'],
  cart: ['audio/shuffle.wav'],
  door: ['audio/door1.mp3'],
};
const cache = new Map();
let enabled = true;

export function setEnabled(v) { enabled = v; }

export function play(name) {
  if (!enabled) return;
  const list = files[name];
  if (!list) return;
  const src = list[Math.floor(Math.random() * list.length)];
  let a = cache.get(src);
  if (!a) { a = new Audio(src); cache.set(src, a); }
  try {
    a.currentTime = 0;
    const p = a.play();
    if (p && p.catch) p.catch(() => {});
  } catch { /* autoplay blocked until first interaction */ }
}
