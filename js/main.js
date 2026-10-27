// App entry: scales the 480x800 stage to the viewport and wires the views together.
import { NoseView, STAGE_W, STAGE_H } from './nose.js';
import { Challenge } from './challenge.js';
import { UI } from './ui.js';

const stage = document.getElementById('stage');
let scale = 1;

// The 480x800 design frame is scaled to fit, and the stage grows to cover the rest of the
// viewport so the top bar, panels and background fill the screen at any aspect ratio.
function fit() {
  const vw = window.innerWidth, vh = window.innerHeight;
  scale = Math.min(vw / STAGE_W, vh / STAGE_H);
  stage.style.width = `${vw / scale}px`;
  stage.style.height = `${vh / scale}px`;
  stage.style.transform = `scale(${scale})`;
  stage.style.setProperty('--frame-gap', `${(vh / scale - STAGE_H) / 2}px`);
}
window.addEventListener('resize', fit);
fit();

const nose = new NoseView(document.getElementById('nose'), () => scale);
const challenge = new Challenge(document.getElementById('challenge'), nose);
const ui = new UI(document.getElementById('ui'), {
  startLevel(level) {
    ui.setMode('challenge');
    challenge.start(level);
  },
  freePick() {
    challenge.stop();
    ui.setMode('free pick');
  },
  toggleGestures(v) {
    nose.setShowGestures(v);
  },
});

challenge.onGameOver = result => {
  ui.setMode('free pick');
  ui.showGameOver(result);
};

// iOS needs a user gesture before it will deliver devicemotion events.
const askMotion = () => {
  nose.gestures.shake.requestPermission();
  window.removeEventListener('pointerdown', askMotion);
};
window.addEventListener('pointerdown', askMotion);

ui.showFirstRunHint();

// handy for poking at things from the console
window.nosePicker = { nose, challenge, ui };
