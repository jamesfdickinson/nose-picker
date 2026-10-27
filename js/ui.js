// Top bar, menu drawer and the overlay panels (items store, levels, awards, level intro, game over).
import { ITEMS, LEVELS } from './data.js';
import { AWARDS } from './awards.js';
import {
  state, onChange, foundItemCount, totalItemCount, awardsCount, totalAwards,
  addCoins, buyItem, unlockedLevels, getItem, setShowGestures, reset, markIntroSeen,
} from './state.js';
import { gestureToWords } from './words.js';

export class UI {
  constructor(root, actions) {
    this.root = root;
    this.actions = actions; // { startLevel(level), freePick(), toggleGestures(v) }
    this.clickHist = '';
    this.build();
    onChange(() => this.refreshBar());
    this.refreshBar();
  }

  build() {
    this.root.innerHTML = `
      <div class="topbar">
        <button class="stat" id="statItems" title="Items found"><span class="ico">&#128269;</span><span id="itemsCount"></span></button>
        <button class="stat" id="statAwards" title="Awards"><span class="ico">&#127942;</span><span id="awardsCount"></span></button>
        <button class="stat" id="statCoins" title="Coins"><span class="ico coin"></span><span id="coinsCount"></span></button>
        <span class="mode" id="modeLabel">free pick</span>
        <button class="menu-btn" id="menuBtn" aria-label="Menu">&#9776;</button>
      </div>
      <div class="drawer-backdrop" id="drawerBackdrop" hidden></div>
      <nav class="drawer" id="drawer" hidden>
        <img class="drawer-title" src="images/NosePicker_Title.png" alt="Nose Picker">
        <button data-action="freepick">free pick</button>
        <button data-action="challenge">challenge</button>
        <button data-action="items">items</button>
        <button data-action="awards">awards</button>
        <label class="toggle"><input type="checkbox" id="showGestures"> show gestures</label>
        <button data-action="freecoins">free coins</button>
        <button data-action="reset" class="danger">reset data</button>
      </nav>
      <div class="panel" id="panel" hidden>
        <div class="panel-head"><h2 id="panelTitle"></h2><button class="close" id="panelClose" aria-label="Close">&times;</button></div>
        <div class="panel-body" id="panelBody"></div>
      </div>
      <div class="toast" id="toast" hidden></div>
      <div class="modal-backdrop" id="modal" hidden>
        <div class="modal" role="dialog" aria-modal="true">
          <p id="modalText"></p>
          <div class="row">
            <button class="primary" id="modalOk">OK</button>
            <button id="modalCancel">Cancel</button>
          </div>
        </div>
      </div>`;

    this.menuBtn = this.root.querySelector('#menuBtn');
    this.drawer = this.root.querySelector('#drawer');
    this.backdrop = this.root.querySelector('#drawerBackdrop');
    this.panel = this.root.querySelector('#panel');
    this.panelTitle = this.root.querySelector('#panelTitle');
    this.panelBody = this.root.querySelector('#panelBody');
    this.modeLabel = this.root.querySelector('#modeLabel');
    this.toastEl = this.root.querySelector('#toast');
    this.gestureToggle = this.root.querySelector('#showGestures');
    this.modal = this.root.querySelector('#modal');
    this.modalText = this.root.querySelector('#modalText');
    this.modalOk = this.root.querySelector('#modalOk');
    this.modalCancel = this.root.querySelector('#modalCancel');
    this.gestureToggle.checked = state.showGestures;

    this.menuBtn.addEventListener('click', () => this.toggleDrawer());
    this.backdrop.addEventListener('click', () => this.toggleDrawer(false));
    this.root.querySelector('#panelClose').addEventListener('click', () => this.closePanel());
    this.drawer.addEventListener('click', e => {
      const a = e.target.closest('[data-action]');
      if (a) this.menuAction(a.dataset.action);
    });
    this.gestureToggle.addEventListener('change', () => {
      setShowGestures(this.gestureToggle.checked);
      this.actions.toggleGestures(this.gestureToggle.checked);
    });

    // hidden cheat from CoinCount.xaml.cs: tap items, awards, coins in order for 10 coins
    this.root.querySelector('#statItems').addEventListener('click', () => { this.cheat('i'); this.showItems(); });
    this.root.querySelector('#statAwards').addEventListener('click', () => { this.cheat('a'); this.showAwards(); });
    this.root.querySelector('#statCoins').addEventListener('click', () => this.cheat('c'));
  }

  cheat(ch) {
    this.clickHist = (this.clickHist + ch).slice(-3);
    if (this.clickHist === 'iac') {
      addCoins(10);
      this.clickHist = '';
      this.toast('+10 coins');
    }
  }

  refreshBar() {
    this.root.querySelector('#itemsCount').textContent = `${foundItemCount()}/${totalItemCount()}`;
    this.root.querySelector('#awardsCount').textContent = `${awardsCount()}/${totalAwards()}`;
    this.root.querySelector('#coinsCount').textContent = state.coins;
  }

  setMode(label) { this.modeLabel.textContent = label; }

  toggleDrawer(open = this.drawer.hidden) {
    this.drawer.hidden = !open;
    this.backdrop.hidden = !open;
  }

  menuAction(action) {
    this.toggleDrawer(false);
    switch (action) {
      case 'freepick': this.closePanel(); this.actions.freePick(); break;
      case 'challenge': this.showLevels(); break;
      case 'items': this.showItems(); break;
      case 'awards': this.showAwards(); break;
      case 'freecoins': addCoins(20); this.toast('+20 coins'); break;
      case 'reset':
        this.confirm('Reset all data? Items, coins, levels and awards will be lost.', 'Reset').then(ok => {
          if (ok) { reset(); this.gestureToggle.checked = true; this.toast('Data reset'); }
        });
        break;
      default: break;
    }
  }

  openPanel(title, bodyEl) {
    this.panelTitle.textContent = title;
    this.panelBody.replaceChildren(bodyEl);
    this.panel.hidden = false;
  }

  closePanel() {
    this.panel.hidden = true;
    this.panelBody.replaceChildren();
  }

  /** In-page replacement for window.confirm. Resolves true on OK. */
  confirm(message, okLabel = 'OK') {
    return new Promise(resolve => {
      this.modalText.textContent = message;
      this.modalOk.textContent = okLabel;
      this.modal.hidden = false;
      const done = v => {
        this.modal.hidden = true;
        this.modalOk.onclick = this.modalCancel.onclick = this.modal.onclick = null;
        resolve(v);
      };
      this.modalOk.onclick = () => done(true);
      this.modalCancel.onclick = () => done(false);
      this.modal.onclick = e => { if (e.target === this.modal) done(false); };
      this.modalOk.focus();
    });
  }

  toast(msg, ms = 1800) {
    this.toastEl.textContent = msg;
    this.toastEl.hidden = false;
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => { this.toastEl.hidden = true; }, ms);
  }

  // ---- Items (Pages/ItemsPage.xaml.cs) ----
  showItems() {
    const body = el('div', 'items-page');
    const found = ITEMS.filter(i => i.name in state.itemCounts);
    const notFound = ITEMS.filter(i => !(i.name in state.itemCounts));

    body.append(el('h3', '', `found (${found.length})`));
    const foundList = el('div', 'item-list');
    for (const item of found) foundList.append(itemRow(item, `x${state.itemCounts[item.name]}`));
    if (!found.length) foundList.append(el('p', 'muted', 'Nothing yet. Drag up then down on the nose to find a Penny.'));
    body.append(foundList);

    body.append(el('h3', '', `not found (${notFound.length})`));
    const storeList = el('div', 'item-list');
    for (const item of notFound) {
      const row = itemRow(item, `${item.cost} coins`, true);
      row.addEventListener('click', async () => {
        if (state.coins < item.cost) { this.toast(`You do not have enough coins to buy ${item.name}`); return; }
        if (await this.confirm(`Buy ${item.name} for ${item.cost} coins?`, 'Buy')) {
          buyItem(item.name);
          this.showItems();
          this.toast(`${item.name}: ${gestureToWords(item.gesture)}`, 3500);
        }
      });
      storeList.append(row);
    }
    body.append(storeList);
    this.openPanel('items', body);
  }

  // ---- Awards (Controls/AwardsList.xaml.cs) ----
  showAwards() {
    const body = el('div', 'awards-list');
    for (const a of AWARDS) {
      const earned = state.awards.includes(a.id);
      const row = el('div', 'award' + (earned ? ' earned' : ''));
      row.append(el('span', 'award-mark', earned ? '★' : '☆'), el('span', '', a.id));
      body.append(row);
    }
    this.openPanel('awards', body);
  }

  // ---- Choose level (Pages/ChooseLevelPage.xaml.cs) ----
  showLevels() {
    const body = el('div', 'level-list');
    const unlocked = new Set(unlockedLevels().map(l => l.name));
    LEVELS.forEach((level, i) => {
      const s = state.levelScores[level.name];
      const row = el('button', 'level' + (unlocked.has(level.name) ? '' : ' locked'));
      row.disabled = !unlocked.has(level.name);
      row.append(el('span', 'level-num', String(i + 1)), el('span', 'level-name', level.name), stars(s ? s.score : 0));
      row.addEventListener('click', () => this.showLevelIntro(level));
      body.append(row);
    });
    this.openPanel('choose level', body);
  }

  // ---- Level intro (Pages/LevelIntro.xaml.cs) ----
  showLevelIntro(level) {
    const body = el('div', 'level-intro');
    body.append(el('h3', '', level.name));
    body.append(el('p', 'muted', `${level.items.length} items. Catch ${Math.ceil(level.items.length * 0.75)} to pass.`));
    const hints = el('div', 'hint-list');
    for (const name of level.hints) {
      const item = getItem(name);
      if (!item) continue;
      hints.append(itemRow(item, gestureToWords(item.gesture)));
    }
    if (level.hints.length) body.append(el('h4', '', 'hints'), hints);
    const play = el('button', 'primary', 'Click to play');
    play.addEventListener('click', () => { this.closePanel(); this.actions.startLevel(level); });
    body.append(play);
    this.openPanel('level', body);
  }

  // ---- Game over (Pages/GamePage.xaml) ----
  showGameOver(result) {
    const body = el('div', 'game-over');
    body.append(el('h3', result.passes ? 'win' : 'lose', result.passes ? 'You win!' : 'You lose!'));
    body.append(el('div', 'percent', `${result.score} %`));
    body.append(stars(result.score));
    body.append(el('p', 'muted', `${result.caught} of ${result.total} caught`));
    if (result.newAwards.length) {
      const list = el('div', 'awards-won');
      list.append(el('h4', '', 'awards'));
      for (const a of result.newAwards) list.append(el('div', 'award earned', '★ ' + a));
      body.append(list);
    }
    const again = el('button', 'primary', 'Play Again');
    again.addEventListener('click', () => { this.closePanel(); this.actions.startLevel(result.level); });
    const levels = el('button', '', 'Levels');
    levels.addEventListener('click', () => this.showLevels());
    const free = el('button', '', 'Free Pick');
    free.addEventListener('click', () => { this.closePanel(); this.actions.freePick(); });
    body.append(el('div', 'row', again, levels, free));
    this.openPanel(result.level.name, body);
  }

  showFirstRunHint() {
    if (state.seenIntro) return;
    markIntroSeen();
    const body = el('div', 'intro');
    body.append(el('p', '', 'Drag your finger on the nose. Each item hides behind a different pattern of moves.'));
    body.append(el('p', '', 'Try: up, then down. That finds a Penny.'));
    body.append(el('p', 'muted', 'Shake the phone for items that need a shake. On a keyboard use the arrow keys, X and Y.'));
    const ok = el('button', 'primary', 'Pick!');
    ok.addEventListener('click', () => this.closePanel());
    body.append(ok);
    this.openPanel('nose picker', body);
  }
}

// ---- helpers ----
function el(tag, cls = '', ...children) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  for (const c of children) e.append(c);
  return e;
}

function itemRow(item, detail, clickable = false) {
  const row = el('div', 'item-row' + (clickable ? ' buy' : ''));
  const img = document.createElement('img');
  img.src = item.image; img.alt = ''; img.loading = 'lazy';
  row.append(img, el('span', 'item-name', item.name), el('span', 'item-detail', detail));
  return row;
}

/** Rating stars from Controls/RatingControl.xaml.cs thresholds. */
function stars(score) {
  const thresholds = [70, 75, 80, 90, 100];
  const wrap = el('span', 'stars');
  for (const t of thresholds) wrap.append(el('span', score >= t ? 'on' : '', '★'));
  return wrap;
}
