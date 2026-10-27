// The nose-picking view, ported from Controls/PickNose.xaml(.cs).
// Stage coordinates are the original 480x800 phone layout; the stage is scaled to fit.
import { ITEMS } from './data.js';
import { ITEM_MOTION, HEAD_BOBS, toKeyframes, itemKeyframes } from './animations.js';
import { GestureRecognizer } from './gesture.js';
import { state, addFoundItem, persist } from './state.js';
import * as audio from './audio.js';
import { itemArt } from './item-art.js';

export const STAGE_W = 480;
export const STAGE_H = 800;

export class NoseView {
  /**
   * @param {HTMLElement} root container that will hold the stage
   * @param {() => number} getScale current stage scale
   */
  constructor(root, getScale) {
    this.root = root;
    this.getScale = getScale;
    this.onItemComplete = null;   // (item) => void  (NoseItemComplete event)
    this.onGesture = null;        // (motions) => void
    this.isPicking = false;
    this.itemAnim = null;
    this.itemBusy = false;
    this.currentItem = null;
    this.build();

    this.gestures = new GestureRecognizer(this.touch, getScale, this.head);
    this.gestures.onGesture = m => this.showGesture(m);
    this.gestures.onGestureEnd = m => this.startPick(m);
    this.gestures.onPointer = p => this.followFinger(p);
  }

  build() {
    this.root.innerHTML = `
      <div class="head" id="head">
        <img class="face-back" src="images/HeadFull.png" alt="" draggable="false">
        <div class="nose-layer">
          <img class="finger" id="finger" src="images/Layer 2.png" alt="" draggable="false">
          <div class="item-clip" id="itemClip"><div class="nose-item" id="noseItem"><img id="noseItemImg" alt="" draggable="false"></div></div>
        </div>
        <img class="face-front" src="images/HeadFull.png" alt="" draggable="false">
        <div class="touch" id="touch"></div>
      </div>
      <div class="gesture-debug" id="gestureDebug" hidden>
        <span id="gestureText"></span>
      </div>`;
    this.head = this.root.querySelector('#head');
    this.finger = this.root.querySelector('#finger');
    this.noseItem = this.root.querySelector('#noseItem');
    this.itemClip = this.root.querySelector('#itemClip');
    this.noseItemImg = this.root.querySelector('#noseItemImg');
    this.touch = this.root.querySelector('#touch');
    this.debug = this.root.querySelector('#gestureDebug');
    this.debugText = this.root.querySelector('#gestureText');
    this.setShowGestures(state.showGestures);
  }

  destroy() {
    this.gestures.destroy();
  }

  setShowGestures(v) {
    this.debug.hidden = !v;
  }

  showGesture(motions) {
    this.debugText.textContent = motions;
    if (this.onGesture) this.onGesture(motions);
  }

  /** Finger follows the touch point (UpdateFingerLocation in the original). */
  followFinger(p) {
    if (p.phase === 'end') {
      this.finger.style.transition = 'transform 0.35s ease-out';
      this.finger.style.transform = '';
      return;
    }
    this.finger.style.transition = p.phase === 'start' ? 'transform 0.15s ease-out' : 'none';
    let r = -((p.x - 250) / 4);
    let y = (p.y - 100) / 2;
    if (y < 30) y = 30;
    if (r > 20) r = 20;
    if (r < -25) r = -25;
    this.finger.style.transform = `translate(220px, ${y}px) rotate(${r}deg)`;
  }

  /** Called when a gesture ends (StartPickNose in the original). */
  startPick(gesture) {
    state.totalPicks += 1;
    persist();
    this.showGesture(gesture);

    let matched = null;
    for (const item of ITEMS) {
      if (item.gesture === gesture) matched = item;
    }
    if (matched) this.animate(matched);

    const almostComplete = ITEMS.some(item => item.gesture.startsWith(gesture));
    if (!matched && !this.isPicking && !almostComplete) {
      // 1 in 4 chance a random item falls out anyway
      if (Math.floor(Math.random() * 4) === 0) {
        this.animate(ITEMS[Math.floor(Math.random() * ITEMS.length)]);
      }
    }
    if (!matched && !this.isPicking && gesture.length >= 2 && !almostComplete) {
      audio.play('wrong');
    }
  }

  animate(item, { reward = true } = {}) {
    this.isPicking = true;
    audio.play(gestureHasShake(item.gesture) ? 'shake' : 'squeek');

    // head wobble
    const bob = HEAD_BOBS[Math.floor(Math.random() * HEAD_BOBS.length)];
    const headAnim = this.head.animate(toKeyframes(bob), { duration: bob.duration, easing: 'linear' });
    headAnim.onfinish = () => { this.isPicking = false; };

    // only one item at a time, like the original storyboard check
    if (this.itemBusy) return;
    this.itemBusy = true;
    this.currentItem = item;
    this.showItem(item, { reward })
      .catch(() => { this.noseItem.classList.remove('active'); }) // animation cancelled
      .finally(() => { this.itemBusy = false; });
  }

  async showItem(item, { reward = true } = {}) {
    const { motion, scale } = ITEM_MOTION[item.animation] || ITEM_MOTION.Square_100x100;
    const img = this.noseItemImg;
    const art = itemArt(item, state.realisticItems);
    img.src = art.src;
    img.alt = item.name;
    // need the natural size; decode() can stall in some webviews, so wait on load instead
    if (!img.complete) await new Promise(res => { img.onload = img.onerror = res; });
    const w = (art.width || img.naturalWidth || 100) * scale;
    const h = (art.height || img.naturalHeight || 100) * scale;
    this.noseItem.style.width = w + 'px';
    this.noseItem.style.height = h + 'px';
    this.noseItem.style.left = -w / 2 + 'px';
    this.noseItem.style.top = -h / 2 + 'px';

    const { keyframes, duration } = itemKeyframes(motion, w, h);
    this.noseItem.classList.add('active');
    this.itemAnim = this.noseItem.animate(keyframes, { duration, easing: 'linear', fill: 'forwards' });
    await this.itemAnim.finished;
    this.noseItem.classList.remove('active');
    this.itemAnim = null;
    if (reward) this.itemComplete(item);
  }

  itemComplete(item) {
    audio.play('coins');
    addFoundItem(item.name);
    if (this.onItemComplete) this.onItemComplete(item);
  }
}

function gestureHasShake(g) {
  return /[XY]/.test(g);
}
