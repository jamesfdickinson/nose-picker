// Challenge mode, ported from Controls/GameBoard.xaml(.cs) and Pages/GamePage.xaml.cs.
// A mine cart rolls in showing the wanted item; the player has ITEM_SECONDS to pick it.
import { getItem, recordLevelScore, checkAwards, state, onChange } from './state.js';
import { itemArt } from './item-art.js';
import * as audio from './audio.js';

const ITEM_SECONDS = 8;
const PASS_PERCENT = 75;
const CART_IN_MS = 700;
const CART_OUT_MS = 1200;

export class Challenge {
  /**
   * @param {HTMLElement} root container for the cart UI (inside the stage)
   * @param {import('./nose.js').NoseView} nose
   */
  constructor(root, nose) {
    this.root = root;
    this.nose = nose;
    this.onGameOver = null;  // ({level, score, passes, caught, total, newAwards}) => void
    this.onProgress = null;  // ({index, total, caught}) => void
    this.level = null;
    this.index = -1;
    this.caught = 0;
    this.ready = false;
    this.wanted = null;
    this.timer = null;
    this.tickTimer = null;
    this.deadline = 0;
    this.running = false;
    this.build();
    onChange(() => {
      if (this.wanted) this.cartItem.src = itemArt(this.wanted, state.realisticItems).src;
    });
    this._itemHandler = item => this.itemComplete(item);
  }

  build() {
    this.root.innerHTML = `
      <div class="cart" id="cart">
        <img class="cart-img" src="images/MineCart.png" alt="" draggable="false">
        <img class="cart-item" id="cartItem" alt="" draggable="false">
        <div class="cart-timer"><div class="cart-timer-bar" id="cartTimerBar"></div></div>
      </div>
      <div class="challenge-hud" id="challengeHud">
        <span id="challengeLevel"></span>
        <span id="challengeProgress"></span>
      </div>
      <div class="point-feedback" id="pointFeedback">+1</div>`;
    this.cart = this.root.querySelector('#cart');
    this.cartItem = this.root.querySelector('#cartItem');
    this.timerBar = this.root.querySelector('#cartTimerBar');
    this.hud = this.root.querySelector('#challengeHud');
    this.hudLevel = this.root.querySelector('#challengeLevel');
    this.hudProgress = this.root.querySelector('#challengeProgress');
    this.feedback = this.root.querySelector('#pointFeedback');
    this.root.hidden = true;
  }

  start(level) {
    this.stop();
    this.level = level;
    this.index = -1;
    this.caught = 0;
    this.running = true;
    this.root.hidden = false;
    this.hudLevel.textContent = level.name;
    this.nose.onItemComplete = this._itemHandler;
    this.setNextItem();
  }

  stop() {
    clearTimeout(this.timer);
    clearInterval(this.tickTimer);
    this.running = false;
    this.ready = false;
    this.root.hidden = true;
    this.cart.classList.remove('in', 'out');
    if (this.nose.onItemComplete === this._itemHandler) this.nose.onItemComplete = null;
  }

  setNextItem() {
    if (!this.running) return;
    this.index += 1;
    const total = this.level.items.length;
    if (this.index < total) {
      this.wanted = getItem(this.level.items[this.index]) || getItem('Marble');
      this.cartItem.src = itemArt(this.wanted, state.realisticItems).src;
      this.cartItem.alt = this.wanted.name;
      this.hudProgress.textContent = `${this.index + 1} / ${total}`;
      if (this.onProgress) this.onProgress({ index: this.index, total, caught: this.caught });
      this.ready = true;
      this.cart.classList.remove('out');
      this.cart.classList.add('in');
      audio.play('cart');
      this.deadline = performance.now() + ITEM_SECONDS * 1000;
      this.timerBar.style.transition = 'none';
      this.timerBar.style.width = '100%';
      requestAnimationFrame(() => {
        this.timerBar.style.transition = `width ${ITEM_SECONDS}s linear`;
        this.timerBar.style.width = '0%';
      });
      this.timer = setTimeout(() => this.timeUp(), ITEM_SECONDS * 1000);
    } else {
      this.levelOver();
    }
  }

  timeUp() {
    this.ready = false;
    this.cartOut();
  }

  cartOut() {
    clearTimeout(this.timer);
    this.cart.classList.remove('in');
    this.cart.classList.add('out');
    this.timer = setTimeout(() => this.setNextItem(), CART_OUT_MS);
  }

  itemComplete(item) {
    if (!this.running || !this.ready) return;
    if (item.name !== this.wanted.name) return;
    this.caught += 1;
    this.ready = false;
    this.feedback.classList.remove('show');
    void this.feedback.offsetWidth; // restart animation
    this.feedback.classList.add('show');
    this.cartOut();
  }

  levelOver() {
    const total = this.level.items.length;
    const score = Math.round((this.caught / total) * 100);
    const passes = score >= PASS_PERCENT;
    this.running = false;
    this.ready = false;
    this.root.hidden = true;
    if (this.nose.onItemComplete === this._itemHandler) this.nose.onItemComplete = null;
    recordLevelScore(this.level.name, score, passes);
    const newAwards = checkAwards();
    audio.play(passes ? 'win' : 'wrong');
    if (this.onGameOver) {
      this.onGameOver({ level: this.level, score, passes, caught: this.caught, total, newAwards });
    }
  }
}

export { ITEM_SECONDS, PASS_PERCENT, CART_IN_MS };
