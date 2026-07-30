(() => {
  'use strict';

  const STORAGE_KEY = 'jk-games-city-kl-v1';
  const MAX_SHIELDS = 5;
  const BOARD_SIZE = 24;
  const ROLL_REGEN_MS = 30 * 60 * 1000;
  const MAX_DICE = 100;

  const BOARDS = [
    {
      id: 'zentrum',
      name: 'Cottbus Zentrum',
      subtitle: 'Spremberger Straße',
      sky: '#4fc3ff',
      glow: '#f5c35b',
      grass: '#4dbb72',
      road: '#30465c',
      accent: '#f5c35b',
      landmarks: [
        { id: 'spremberger-turm', name: 'Spremberger Turm', icon: '♜' },
        { id: 'altmarkt', name: 'Altmarkt', icon: '◆' },
        { id: 'staatstheater', name: 'Staatstheater', icon: '♬' },
        { id: 'blechen-carre', name: 'Blechen Carré', icon: '▦' }
      ]
    },
    {
      id: 'branitz',
      name: 'Branitzer Park',
      subtitle: 'Pücklers Gartenreich',
      sky: '#63c4e8',
      glow: '#f2cf7c',
      grass: '#3f9f58',
      road: '#3d4e4b',
      accent: '#f2cf7c',
      landmarks: [
        { id: 'schloss-branitz', name: 'Schloss Branitz', icon: '♛' },
        { id: 'seepyramide', name: 'Seepyramide', icon: '▲' },
        { id: 'parksee', name: 'Parksee', icon: '≈' },
        { id: 'orangerie', name: 'Orangerie', icon: '✦' }
      ]
    },
    {
      id: 'sandow',
      name: 'Sandow City',
      subtitle: 'Spree & Stadtleben',
      sky: '#6f8fd4',
      glow: '#ff9f6e',
      grass: '#45a16a',
      road: '#343f58',
      accent: '#ff9f6e',
      landmarks: [
        { id: 'spreepromenade', name: 'Spreepromenade', icon: '≋' },
        { id: 'sandower-bruecke', name: 'Sandower Brücke', icon: '⌒' },
        { id: 'stadion', name: 'Stadion', icon: '◉' },
        { id: 'stadtvillen', name: 'Stadtvillen', icon: '▤' }
      ]
    },
    {
      id: 'lausitz',
      name: 'Lausitz Zukunft',
      subtitle: 'Neue Energie',
      sky: '#39445f',
      glow: '#58e6d2',
      grass: '#2f845e',
      road: '#232d3d',
      accent: '#58e6d2',
      landmarks: [
        { id: 'energiecampus', name: 'Energiecampus', icon: '⚡' },
        { id: 'innovationspark', name: 'Innovationspark', icon: '⬡' },
        { id: 'solarquartier', name: 'Solarquartier', icon: '☀' },
        { id: 'zukunftsbahnhof', name: 'Zukunftsbahnhof', icon: '▰' }
      ]
    }
  ];

  const TILE_PATTERN = [
    'start', 'coins', 'build', 'chance', 'coins', 'shield',
    'attack', 'coins', 'dice', 'heist', 'build', 'coins',
    'bonus', 'coins', 'chance', 'shield', 'attack', 'coins',
    'dice', 'heist', 'build', 'coins', 'jackpot', 'coins'
  ];

  const TILE_META = {
    start: { icon: '★', label: 'Start', cls: 'start' },
    coins: { icon: 'CB', label: 'City Coins', cls: 'coins' },
    build: { icon: '⌂', label: 'Bauen', cls: 'build' },
    chance: { icon: '?', label: 'City Karte', cls: 'chance' },
    shield: { icon: '⬟', label: 'Schutzschild', cls: 'shield' },
    attack: { icon: '⚒', label: 'Abriss', cls: 'attack' },
    dice: { icon: '⚄', label: 'Würfel', cls: 'dice' },
    heist: { icon: '▣', label: 'Bankraub', cls: 'heist' },
    bonus: { icon: '✦', label: 'Bonus', cls: 'bonus' },
    jackpot: { icon: '♛', label: 'City Jackpot', cls: 'jackpot' }
  };

  const DEFAULT_STATE = {
    coins: 15000,
    dice: 50,
    shields: 0,
    position: 0,
    boardIndex: 0,
    boardLevel: 1,
    netWorth: 0,
    stars: 0,
    multiplier: 1,
    landmarks: [0, 0, 0, 0],
    lastDiceAt: Date.now(),
    rolls: 0,
    totalCoins: 0,
    bestHeist: 0,
    sound: true,
    completedBoards: 0
  };

  const C = {
    overlay: null,
    sourceDevice: '',
    state: { ...DEFAULT_STATE },
    rolling: false,
    autoRoll: false,
    autoTimer: 0,
    saveTimer: 0,
    resizeHandler: null,
    visibilityHandler: null,
    boardTiles: [],
    token: null,
    currentCard: null
  };

  function cloneDefault() {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  function load() {
    const base = cloneDefault();
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      C.state = { ...base, ...data };
      C.state.landmarks = Array.isArray(data.landmarks) && data.landmarks.length === 4
        ? data.landmarks.map(v => Math.max(0, Math.min(5, Number(v) || 0)))
        : [0, 0, 0, 0];
      C.state.boardIndex = Math.max(0, Number(C.state.boardIndex || 0)) % BOARDS.length;
      C.state.position = Math.max(0, Number(C.state.position || 0)) % BOARD_SIZE;
      C.state.dice = Math.max(0, Math.min(MAX_DICE, Number(C.state.dice || 0)));
      C.state.coins = Math.max(0, Number(C.state.coins || 0));
      C.state.shields = Math.max(0, Math.min(MAX_SHIELDS, Number(C.state.shields || 0)));
      regenerateDice();
    } catch {
      C.state = base;
    }
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(C.state)); } catch {}
  }

  function queueSave() {
    clearTimeout(C.saveTimer);
    C.saveTimer = setTimeout(save, 250);
  }

  function regenerateDice() {
    const now = Date.now();
    const elapsed = Math.max(0, now - Number(C.state.lastDiceAt || now));
    const gained = Math.floor(elapsed / ROLL_REGEN_MS);
    if (gained > 0) {
      C.state.dice = Math.min(MAX_DICE, C.state.dice + gained);
      C.state.lastDiceAt = Number(C.state.lastDiceAt || now) + gained * ROLL_REGEN_MS;
      save();
    }
  }

  function board() {
    return BOARDS[C.state.boardIndex] || BOARDS[0];
  }

  function formatNumber(value) {
    return Math.floor(Number(value || 0)).toLocaleString('de-DE');
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function tileCoordinates(index) {
    const n = index % BOARD_SIZE;
    // 7 x 7 perimeter, 24 tiles: start bottom center, clockwise.
    const route = [
      [6,3], [6,2], [6,1], [6,0], [5,0], [4,0], [3,0], [2,0], [1,0], [0,0],
      [0,1], [0,2], [0,3], [0,4], [0,5], [0,6], [1,6], [2,6], [3,6], [4,6],
      [5,6], [6,6], [6,5], [6,4]
    ];
    return route[n];
  }

  function renderShell() {
    if (C.resizeHandler) window.removeEventListener('resize', C.resizeHandler);
    if (C.visibilityHandler) document.removeEventListener('visibilitychange', C.visibilityHandler);
    const theme = board();
    C.overlay.innerHTML = `
      <div class="city-kl-stage" style="--city-sky:${theme.sky};--city-glow:${theme.glow};--city-grass:${theme.grass};--city-road:${theme.road};--city-accent:${theme.accent}">
        <div class="city-kl-sky"><i></i><i></i><i></i></div>
        <header class="city-kl-hud">
          <button type="button" class="city-kl-icon-button" data-city-close aria-label="Zurück zu Top Games">×</button>
          <div class="city-kl-brand"><small>JK.GAMES</small><b>City.KL</b></div>
          <div class="city-kl-hud-stat city-kl-level"><small>STADT</small><b data-city-board-level>${C.state.boardLevel}</b></div>
          <div class="city-kl-hud-stat"><small>VERMÖGEN</small><b><span data-city-networth>${formatNumber(C.state.netWorth)}</span> ★</b></div>
          <div class="city-kl-hud-stat city-kl-coins"><small>CITY COINS</small><b><span class="city-coin-mini">CB</span><span data-city-coins>${formatNumber(C.state.coins)}</span></b></div>
        </header>

        <main class="city-kl-main">
          <section class="city-kl-board-wrap">
            <div class="city-kl-board" data-city-board>
              <div class="city-kl-center">
                <div class="city-kl-center-heading"><small data-city-subtitle>${escapeHtml(theme.subtitle)}</small><h1 data-city-board-name>${escapeHtml(theme.name)}</h1></div>
                <div class="city-kl-landmarks" data-city-landmarks></div>
                <button type="button" class="city-kl-build-button" data-city-build><span>⌂</span><b>Stadt ausbauen</b><small data-city-build-cost>ab 0 CB</small></button>
              </div>
              <div class="city-kl-token" data-city-token><span></span><i></i></div>
            </div>
          </section>
        </main>

        <aside class="city-kl-side-panel">
          <button type="button" data-city-album><span>★</span><b>Stadtalbum</b><small>${C.state.stars}/20 Sterne</small></button>
          <button type="button" data-city-info><span>i</span><b>Spielinfo</b><small>Regeln & Felder</small></button>
        </aside>

        <footer class="city-kl-controls">
          <div class="city-kl-shields" data-city-shields></div>
          <button type="button" class="city-kl-auto" data-city-auto><small>AUTO</small><b>Aus</b></button>
          <button type="button" class="city-kl-roll" data-city-roll>
            <span class="city-kl-dice" data-city-dice-face>⚄</span>
            <strong>WÜRFELN</strong>
            <small><b data-city-dice>${C.state.dice}</b> Würfel</small>
          </button>
          <button type="button" class="city-kl-multiplier" data-city-multiplier><small>EINSATZ</small><b>×<span data-city-multiplier-value>${C.state.multiplier}</span></b></button>
        </footer>

        <div class="city-kl-toast" data-city-toast></div>
        <div class="city-kl-modal" data-city-modal hidden></div>
        <div class="city-kl-loader" data-city-loader>
          <div class="city-kl-loader-logo"><small>JK.GAMES</small><b>City.KL</b></div>
          <div class="city-kl-loader-city"><i></i><i></i><i></i><i></i><i></i></div>
          <strong>Cottbus wird aufgebaut …</strong>
          <div><span></span></div>
        </div>
      </div>`;

    bindShell();
    buildBoardTiles();
    renderLandmarks();
    updateHud();
    requestAnimationFrame(positionToken);
    setTimeout(() => C.overlay?.querySelector('[data-city-loader]')?.classList.add('is-finished'), 950);
    setTimeout(() => {
      const loader = C.overlay?.querySelector('[data-city-loader]');
      if (loader) loader.remove();
      if (C.state.rolls === 0 && C.state.completedBoards === 0) showWelcome();
    }, 1350);
  }

  function buildBoardTiles() {
    const boardEl = C.overlay.querySelector('[data-city-board]');
    C.boardTiles = [];
    TILE_PATTERN.forEach((type, index) => {
      const meta = TILE_META[type];
      const [row, col] = tileCoordinates(index);
      const tile = document.createElement('div');
      tile.className = `city-kl-tile city-kl-tile-${meta.cls}`;
      tile.dataset.cityTile = String(index);
      tile.dataset.type = type;
      tile.style.gridRow = String(row + 1);
      tile.style.gridColumn = String(col + 1);
      tile.innerHTML = `<span>${meta.icon}</span><small>${meta.label}</small>`;
      boardEl.append(tile);
      C.boardTiles.push(tile);
    });
  }

  function landmarkCost(index, level = C.state.landmarks[index]) {
    const boardFactor = 1 + C.state.completedBoards * 0.68;
    return Math.floor((900 + index * 380) * Math.pow(1.72, level) * boardFactor / 50) * 50;
  }

  function renderLandmarks() {
    const holder = C.overlay?.querySelector('[data-city-landmarks]');
    if (!holder) return;
    const theme = board();
    holder.innerHTML = theme.landmarks.map((landmark, index) => {
      const level = C.state.landmarks[index];
      const classes = ['tiny', 'small', 'medium', 'large', 'tower', 'max'][level];
      return `<button type="button" class="city-kl-landmark ${classes}" data-city-landmark="${index}">
        <div class="city-kl-building"><i></i><i></i><i></i><span>${landmark.icon}</span></div>
        <b>${escapeHtml(landmark.name)}</b>
        <small>Stufe ${level}/5</small>
      </button>`;
    }).join('');
    holder.querySelectorAll('[data-city-landmark]').forEach(button => {
      button.addEventListener('click', () => openBuild(Number(button.dataset.cityLandmark)));
    });
    const available = C.state.landmarks.map((level, i) => level < 5 ? landmarkCost(i, level) : Infinity);
    const min = Math.min(...available);
    const cost = C.overlay.querySelector('[data-city-build-cost]');
    if (cost) cost.textContent = Number.isFinite(min) ? `ab ${formatNumber(min)} CB` : 'Stadt komplett';
  }

  function updateHud() {
    if (!C.overlay) return;
    regenerateDice();
    setText('[data-city-board-level]', C.state.boardLevel);
    setText('[data-city-networth]', formatNumber(C.state.netWorth));
    setText('[data-city-coins]', formatNumber(C.state.coins));
    setText('[data-city-dice]', C.state.dice);
    setText('[data-city-multiplier-value]', C.state.multiplier);
    const albumInfo = C.overlay.querySelector('[data-city-album] small');
    if (albumInfo) albumInfo.textContent = `${C.state.stars}/20 Sterne`;
    const auto = C.overlay.querySelector('[data-city-auto]');
    if (auto) {
      auto.classList.toggle('active', C.autoRoll);
      const b = auto.querySelector('b');
      if (b) b.textContent = C.autoRoll ? 'An' : 'Aus';
    }
    renderShields();
    const roll = C.overlay.querySelector('[data-city-roll]');
    if (roll) roll.disabled = C.rolling || C.state.dice < C.state.multiplier;
  }

  function setText(selector, value) {
    const el = C.overlay?.querySelector(selector);
    if (el && el.textContent !== String(value)) el.textContent = String(value);
  }

  function renderShields() {
    const holder = C.overlay?.querySelector('[data-city-shields]');
    if (!holder) return;
    holder.innerHTML = `<small>SCHUTZ</small><div>${Array.from({ length: MAX_SHIELDS }, (_, i) => `<i class="${i < C.state.shields ? 'active' : ''}">⬟</i>`).join('')}</div>`;
  }

  function positionToken() {
    if (!C.overlay) return;
    const boardEl = C.overlay.querySelector('[data-city-board]');
    const tile = C.boardTiles[C.state.position];
    const token = C.overlay.querySelector('[data-city-token]');
    if (!boardEl || !tile || !token) return;
    const boardRect = boardEl.getBoundingClientRect();
    const tileRect = tile.getBoundingClientRect();
    token.style.left = `${tileRect.left - boardRect.left + tileRect.width / 2}px`;
    token.style.top = `${tileRect.top - boardRect.top + tileRect.height / 2}px`;
    token.dataset.position = String(C.state.position);
    C.token = token;
  }

  function bindShell() {
    C.overlay.querySelector('[data-city-close]')?.addEventListener('click', returnToTopGames);
    C.overlay.querySelector('[data-city-roll]')?.addEventListener('click', rollDice);
    C.overlay.querySelector('[data-city-auto]')?.addEventListener('click', toggleAuto);
    C.overlay.querySelector('[data-city-multiplier]')?.addEventListener('click', cycleMultiplier);
    C.overlay.querySelector('[data-city-build]')?.addEventListener('click', () => openBuild());
    C.overlay.querySelector('[data-city-info]')?.addEventListener('click', openInfo);
    C.overlay.querySelector('[data-city-album]')?.addEventListener('click', openAlbum);
    C.resizeHandler = () => requestAnimationFrame(positionToken);
    window.addEventListener('resize', C.resizeHandler, { passive: true });
    C.visibilityHandler = () => {
      if (!document.hidden) {
        regenerateDice();
        updateHud();
      }
    };
    document.addEventListener('visibilitychange', C.visibilityHandler);
  }

  function showWelcome() {
    showModal(`
      <div class="city-kl-kicker">WILLKOMMEN IN COTTBUS</div>
      <h2>Baue deine eigene Stadt</h2>
      <p>Würfle, sammle City Coins, sichere deine Gebäude mit Schilden und entwickle vier Wahrzeichen bis Stufe 5.</p>
      <div class="city-kl-feature-grid">
        <span><i>⚄</i><b>Würfeln</b><small>Ziehe über das endlose Stadtbrett.</small></span>
        <span><i>⌂</i><b>Ausbauen</b><small>Steigere dein Vermögen und deine Sterne.</small></span>
        <span><i>⬟</i><b>Schützen</b><small>Blockiere Angriffe auf deine Stadt.</small></span>
        <span><i>♛</i><b>Neue Bereiche</b><small>Schalte weitere Cottbus-Welten frei.</small></span>
      </div>
      <button type="button" data-city-modal-close>Stadt betreten</button>
    `);
  }

  function rollDice() {
    if (C.rolling) return;
    regenerateDice();
    const mult = C.state.multiplier;
    if (C.state.dice < mult) {
      showToast('Keine Würfel', 'Deine Würfel laden sich alle 30 Minuten wieder auf.');
      C.autoRoll = false;
      updateHud();
      return;
    }
    C.rolling = true;
    C.state.dice -= mult;
    C.state.rolls += mult;
    const face = C.overlay.querySelector('[data-city-dice-face]');
    const rollButton = C.overlay.querySelector('[data-city-roll]');
    rollButton?.classList.add('is-rolling');
    updateHud();

    const result = 1 + Math.floor(Math.random() * 6);
    let ticks = 0;
    const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    const spin = setInterval(() => {
      if (face) face.textContent = faces[Math.floor(Math.random() * faces.length)];
      ticks++;
      if (ticks >= 8) {
        clearInterval(spin);
        if (face) face.textContent = faces[result - 1];
        moveToken(result, mult).finally(() => {
          C.rolling = false;
          rollButton?.classList.remove('is-rolling');
          updateHud();
          queueSave();
          scheduleAutoRoll();
        });
      }
    }, 70);
  }

  async function moveToken(steps, multiplier) {
    for (let step = 0; step < steps; step++) {
      const previous = C.state.position;
      C.state.position = (C.state.position + 1) % BOARD_SIZE;
      if (previous > C.state.position) {
        const lapReward = 700 * multiplier * Math.max(1, C.state.boardLevel);
        addCoins(lapReward, false);
        showToast('Runde geschafft', `+${formatNumber(lapReward)} CB für eine komplette Stadtrunde.`);
      }
      C.boardTiles.forEach(tile => tile.classList.remove('is-current'));
      C.boardTiles[C.state.position]?.classList.add('is-current');
      positionToken();
      C.token?.classList.add('is-moving');
      await delay(190);
      C.token?.classList.remove('is-moving');
    }
    await delay(120);
    resolveTile(TILE_PATTERN[C.state.position], multiplier);
  }

  function resolveTile(type, multiplier) {
    const meta = TILE_META[type];
    C.boardTiles[C.state.position]?.classList.add('is-hit');
    setTimeout(() => C.boardTiles[C.state.position]?.classList.remove('is-hit'), 650);

    switch (type) {
      case 'start': {
        const reward = 500 * multiplier;
        addCoins(reward);
        showToast(meta.label, `+${formatNumber(reward)} CB`);
        break;
      }
      case 'coins': {
        const reward = (350 + Math.floor(Math.random() * 450)) * multiplier * Math.max(1, C.state.boardLevel);
        addCoins(reward);
        showCoinBurst(reward);
        break;
      }
      case 'build': {
        const reward = 250 * multiplier;
        addCoins(reward, false);
        showToast('Bauplatz', `+${formatNumber(reward)} CB und dein nächster Ausbau wird angezeigt.`);
        setTimeout(() => openBuild(), 500);
        break;
      }
      case 'chance':
        resolveChance(multiplier);
        break;
      case 'shield': {
        if (C.state.shields < MAX_SHIELDS) {
          C.state.shields++;
          showToast('Schutzschild', `Deine Stadt ist jetzt mit ${C.state.shields}/${MAX_SHIELDS} Schilden geschützt.`);
        } else {
          const reward = 650 * multiplier;
          addCoins(reward, false);
          showToast('Schilde voll', `+${formatNumber(reward)} CB als Ersatz.`);
        }
        break;
      }
      case 'attack':
        resolveAttack(multiplier);
        break;
      case 'dice': {
        const reward = 3 * multiplier;
        C.state.dice = Math.min(MAX_DICE, C.state.dice + reward);
        showToast('Würfelbonus', `+${reward} Würfel`);
        break;
      }
      case 'heist':
        resolveHeist(multiplier);
        break;
      case 'bonus': {
        const coins = 900 * multiplier;
        addCoins(coins, false);
        C.state.dice = Math.min(MAX_DICE, C.state.dice + 2 * multiplier);
        showToast('City Bonus', `+${formatNumber(coins)} CB und +${2 * multiplier} Würfel`);
        break;
      }
      case 'jackpot': {
        const reward = (2500 + Math.floor(Math.random() * 2000)) * multiplier;
        addCoins(reward, false);
        C.state.dice = Math.min(MAX_DICE, C.state.dice + 5);
        showModal(`<div class="city-kl-jackpot-icon">♛</div><div class="city-kl-kicker">CITY JACKPOT</div><h2>${formatNumber(reward)} CB</h2><p>Du hast den großen Cottbus-Stadtbonus getroffen und zusätzlich 5 Würfel erhalten.</p><button type="button" data-city-modal-close>Abholen</button>`);
        break;
      }
    }
    updateHud();
    queueSave();
  }

  function resolveChance(multiplier) {
    const cards = [
      { title: 'Straßenfest', text: 'Deine Innenstadt ist voll. Die Geschäfte zahlen Extra-Miete.', coins: 800 },
      { title: 'Baustellenfund', text: 'Beim Ausbau wurde ein alter Stadtschatz entdeckt.', coins: 1250 },
      { title: 'Touristenbus', text: 'Neue Gäste besuchen deine Wahrzeichen.', coins: 650, dice: 2 },
      { title: 'Reparaturkosten', text: 'Ein Unwetter beschädigt mehrere Dächer.', coins: -450 },
      { title: 'Stadtförderung', text: 'Dein nachhaltiges Viertel wird gefördert.', coins: 1500 },
      { title: 'Würfel-Lieferung', text: 'Der Spieleladen schenkt dir neue Würfel.', dice: 5 }
    ];
    const card = cards[Math.floor(Math.random() * cards.length)];
    const amount = Number(card.coins || 0) * multiplier;
    if (amount >= 0) addCoins(amount, false);
    else C.state.coins = Math.max(0, C.state.coins + amount);
    if (card.dice) C.state.dice = Math.min(MAX_DICE, C.state.dice + card.dice * multiplier);
    const rewardText = [amount ? `${amount > 0 ? '+' : ''}${formatNumber(amount)} CB` : '', card.dice ? `+${card.dice * multiplier} Würfel` : ''].filter(Boolean).join(' · ');
    showModal(`<div class="city-kl-card-icon">?</div><div class="city-kl-kicker">CITY KARTE</div><h2>${escapeHtml(card.title)}</h2><p>${escapeHtml(card.text)}</p><strong class="city-kl-card-reward">${escapeHtml(rewardText)}</strong><button type="button" data-city-modal-close>Weiter</button>`);
  }

  function resolveAttack(multiplier) {
    const targets = ['Parkstadt Nord', 'Spree-Viertel', 'Altstadt-KI', 'Lausitz-Town'];
    const target = targets[Math.floor(Math.random() * targets.length)];
    const blocked = Math.random() < 0.38;
    const reward = (blocked ? 450 : 1200 + Math.floor(Math.random() * 800)) * multiplier;
    addCoins(reward, false);
    showModal(`
      <div class="city-kl-attack-scene ${blocked ? 'blocked' : 'success'}"><i>⚒</i><span></span></div>
      <div class="city-kl-kicker">STADTANGRIFF</div>
      <h2>${blocked ? 'Schild getroffen' : 'Gebäude beschädigt'}</h2>
      <p>${escapeHtml(target)} ${blocked ? 'hat deinen Angriff mit einem Schild blockiert.' : 'konnte den Angriff nicht abwehren.'}</p>
      <strong class="city-kl-card-reward">+${formatNumber(reward)} CB</strong>
      <button type="button" data-city-modal-close>Beute sichern</button>
    `);
  }

  function resolveHeist(multiplier) {
    const vaults = [
      { name: 'Kleine Kasse', factor: 1, icon: '▣' },
      { name: 'Goldtresor', factor: 2.1, icon: '◆' },
      { name: 'Mega-Tresor', factor: 4.4, icon: '♛' }
    ];
    const choice = Math.random();
    const vault = choice > 0.88 ? vaults[2] : choice > 0.55 ? vaults[1] : vaults[0];
    const reward = Math.floor((700 + Math.random() * 750) * vault.factor * multiplier);
    C.state.bestHeist = Math.max(C.state.bestHeist, reward);
    addCoins(reward, false);
    showModal(`
      <div class="city-kl-heist-vault"><span>${vault.icon}</span><i></i></div>
      <div class="city-kl-kicker">BANKRAUB</div>
      <h2>${escapeHtml(vault.name)}</h2>
      <p>Der Tresor ist offen. Deine Beute wird direkt deiner Stadtkasse gutgeschrieben.</p>
      <strong class="city-kl-card-reward">+${formatNumber(reward)} CB</strong>
      <button type="button" data-city-modal-close>Beute nehmen</button>
    `);
  }

  function addCoins(amount, animate = true) {
    amount = Math.max(0, Math.floor(Number(amount || 0)));
    C.state.coins += amount;
    C.state.totalCoins += amount;
    if (animate) pulseHudCoins();
  }

  function pulseHudCoins() {
    const el = C.overlay?.querySelector('.city-kl-coins');
    if (!el) return;
    el.classList.remove('pulse');
    void el.offsetWidth;
    el.classList.add('pulse');
  }

  function showCoinBurst(amount) {
    const stage = C.overlay?.querySelector('.city-kl-stage');
    if (!stage) return;
    const burst = document.createElement('div');
    burst.className = 'city-kl-coin-burst';
    burst.innerHTML = `<div>${Array.from({ length: 9 }, (_, i) => `<i style="--i:${i}">CB</i>`).join('')}</div><strong>+${formatNumber(amount)} CB</strong>`;
    stage.append(burst);
    setTimeout(() => burst.remove(), 1150);
    pulseHudCoins();
  }

  function nextBuildIndex() {
    let best = -1;
    let min = Infinity;
    C.state.landmarks.forEach((level, index) => {
      if (level < 5) {
        const cost = landmarkCost(index, level);
        if (cost < min) { min = cost; best = index; }
      }
    });
    return best;
  }

  function openBuild(preselected = -1) {
    const theme = board();
    const index = preselected >= 0 ? preselected : nextBuildIndex();
    if (index < 0) {
      completeBoard();
      return;
    }
    const landmark = theme.landmarks[index];
    const level = C.state.landmarks[index];
    const cost = landmarkCost(index, level);
    const preview = Array.from({ length: 5 }, (_, i) => `<i class="${i < level ? 'done' : i === level ? 'next' : ''}"></i>`).join('');
    showModal(`
      <div class="city-kl-build-preview"><span>${landmark.icon}</span><div>${preview}</div></div>
      <div class="city-kl-kicker">STADTAUSBAU</div>
      <h2>${escapeHtml(landmark.name)}</h2>
      <p>Stufe ${level}/5 · Jeder Ausbau erhöht dein Vermögen und bringt einen Stadtstern.</p>
      <strong class="city-kl-build-price"><span class="city-coin-mini">CB</span>${formatNumber(cost)}</strong>
      <div class="city-kl-modal-actions">
        <button type="button" data-city-buy-build="${index}" ${C.state.coins < cost ? 'disabled' : ''}>Jetzt ausbauen</button>
        <button type="button" class="secondary" data-city-modal-close>Später</button>
      </div>
      ${C.state.coins < cost ? `<small class="city-kl-missing">Dir fehlen ${formatNumber(cost - C.state.coins)} CB.</small>` : ''}
    `);
    C.overlay.querySelector('[data-city-buy-build]')?.addEventListener('click', event => buyBuild(Number(event.currentTarget.dataset.cityBuyBuild)));
  }

  function buyBuild(index) {
    const level = C.state.landmarks[index];
    if (level >= 5) return;
    const cost = landmarkCost(index, level);
    if (C.state.coins < cost) return;
    C.state.coins -= cost;
    C.state.landmarks[index] = level + 1;
    C.state.netWorth += Math.floor(cost * 1.35);
    C.state.stars += 1;
    closeModal();
    renderLandmarks();
    updateHud();
    const landmarkEl = C.overlay.querySelector(`[data-city-landmark="${index}"]`);
    landmarkEl?.classList.add('is-upgrading');
    showToast('Ausbau abgeschlossen', `${board().landmarks[index].name} erreicht Stufe ${level + 1}.`);
    setTimeout(() => landmarkEl?.classList.remove('is-upgrading'), 1000);
    if (C.state.landmarks.every(v => v >= 5)) setTimeout(completeBoard, 950);
    queueSave();
  }

  function completeBoard() {
    const oldBoard = board();
    const reward = 15000 * Math.max(1, C.state.boardLevel);
    C.state.coins += reward;
    C.state.dice = Math.min(MAX_DICE, C.state.dice + 25);
    C.state.completedBoards += 1;
    C.state.boardLevel += 1;
    C.state.boardIndex = (C.state.boardIndex + 1) % BOARDS.length;
    C.state.landmarks = [0, 0, 0, 0];
    C.state.position = 0;
    queueSave();
    showModal(`
      <div class="city-kl-complete-city"><span>★</span><i></i><i></i><i></i></div>
      <div class="city-kl-kicker">STADT KOMPLETT</div>
      <h2>${escapeHtml(oldBoard.name)} abgeschlossen</h2>
      <p>Alle Wahrzeichen stehen auf Stufe 5. Du erhältst ${formatNumber(reward)} CB und 25 Würfel.</p>
      <button type="button" data-city-next-board>Nächste Stadt öffnen</button>
    `, false);
    C.overlay.querySelector('[data-city-next-board]')?.addEventListener('click', () => {
      closeModal();
      renderShell();
    });
  }

  function cycleMultiplier() {
    if (C.rolling) return;
    const options = [1, 2, 3, 5, 10];
    const available = options.filter(v => v <= Math.max(1, C.state.dice));
    const current = available.indexOf(C.state.multiplier);
    C.state.multiplier = available[(current + 1) % available.length] || 1;
    updateHud();
    queueSave();
  }

  function toggleAuto() {
    C.autoRoll = !C.autoRoll;
    updateHud();
    if (C.autoRoll) scheduleAutoRoll(200);
    else clearTimeout(C.autoTimer);
  }

  function scheduleAutoRoll(delayMs = 650) {
    clearTimeout(C.autoTimer);
    if (!C.autoRoll || C.rolling || C.currentCard || !C.overlay) return;
    if (C.state.dice < C.state.multiplier) {
      C.autoRoll = false;
      updateHud();
      return;
    }
    C.autoTimer = setTimeout(rollDice, delayMs);
  }

  function openInfo() {
    showModal(`
      <div class="city-kl-kicker">SO FUNKTIONIERT CITY.KL</div>
      <h2>Deine Cottbus-Stadt</h2>
      <div class="city-kl-info-list">
        <span><i>⚄</i><b>Würfeln</b><small>Jeder Wurf kostet Würfel entsprechend deinem Multiplikator.</small></span>
        <span><i>CB</i><b>City Coins</b><small>Verdiene Coins auf dem Brett und investiere sie in Wahrzeichen.</small></span>
        <span><i>⬟</i><b>Schilde</b><small>Bis zu fünf Schilde schützen deine Stadt vor Angriffen.</small></span>
        <span><i>⌂</i><b>Ausbau</b><small>Vier Wahrzeichen mit je fünf Stufen schließen eine Stadt ab.</small></span>
        <span><i>×</i><b>Multiplikator</b><small>Höherer Einsatz erhöht Belohnungen und Würfelverbrauch.</small></span>
        <span><i>↻</i><b>Endlos</b><small>Nach einer fertigen Stadt beginnt der nächste Cottbus-Bereich.</small></span>
      </div>
      <button type="button" data-city-modal-close>Verstanden</button>
    `);
  }

  function openAlbum() {
    const progress = C.state.landmarks.reduce((sum, level) => sum + level, 0);
    showModal(`
      <div class="city-kl-album-star">★</div>
      <div class="city-kl-kicker">STADTALBUM</div>
      <h2>${C.state.stars} Sterne gesammelt</h2>
      <p>Jede Landmarken-Stufe bringt einen Stern. Eine vollständige Stadt enthält 20 Sterne.</p>
      <div class="city-kl-album-progress"><i style="width:${Math.min(100, progress / 20 * 100)}%"></i></div>
      <div class="city-kl-stat-grid">
        <span><small>Städte fertig</small><b>${C.state.completedBoards}</b></span>
        <span><small>Würfe</small><b>${formatNumber(C.state.rolls)}</b></span>
        <span><small>Coins verdient</small><b>${formatNumber(C.state.totalCoins)}</b></span>
        <span><small>Bester Raub</small><b>${formatNumber(C.state.bestHeist)}</b></span>
      </div>
      <button type="button" data-city-modal-close>Zurück</button>
    `);
  }

  function showToast(title, text) {
    const toast = C.overlay?.querySelector('[data-city-toast]');
    if (!toast) return;
    toast.innerHTML = `<b>${escapeHtml(title)}</b><span>${escapeHtml(text)}</span>`;
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  function showModal(html, closable = true) {
    clearTimeout(C.autoTimer);
    const modal = C.overlay?.querySelector('[data-city-modal]');
    if (!modal) return;
    C.currentCard = true;
    modal.innerHTML = `<div class="city-kl-modal-backdrop"></div><section>${html}</section>`;
    modal.hidden = false;
    modal.classList.add('open');
    modal.querySelectorAll('[data-city-modal-close]').forEach(button => button.addEventListener('click', closeModal));
    if (closable) modal.querySelector('.city-kl-modal-backdrop')?.addEventListener('click', closeModal);
  }

  function closeModal() {
    const modal = C.overlay?.querySelector('[data-city-modal]');
    if (!modal) return;
    modal.classList.remove('open');
    setTimeout(() => { if (modal) { modal.hidden = true; modal.innerHTML = ''; } }, 180);
    C.currentCard = null;
    scheduleAutoRoll();
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function open(sourceDevice = '') {
    if (sourceDevice) C.sourceDevice = String(sourceDevice);
    else if (typeof window.JKGamesOwnedPhoneItem === 'function') C.sourceDevice = window.JKGamesOwnedPhoneItem() || C.sourceDevice || '';
    if (C.overlay) return;
    load();
    const overlay = document.createElement('div');
    overlay.className = 'city-kl-overlay';
    document.body.append(overlay);
    C.overlay = overlay;
    renderShell();
  }

  function close() {
    if (!C.overlay) return;
    clearTimeout(C.autoTimer);
    clearTimeout(C.saveTimer);
    save();
    window.removeEventListener('resize', C.resizeHandler);
    document.removeEventListener('visibilitychange', C.visibilityHandler);
    C.overlay.remove();
    C.overlay = null;
    C.boardTiles = [];
    C.token = null;
    C.rolling = false;
    C.autoRoll = false;
    C.currentCard = null;
  }

  function returnToTopGames() {
    const source = C.sourceDevice || '';
    close();
    requestAnimationFrame(() => {
      if (typeof window.JKGamesOpenTopGames === 'function') window.JKGamesOpenTopGames(source);
      else if (typeof window.openDeviceInterface === 'function' && typeof window.JKGamesOwnedPhoneItem === 'function') {
        const item = window.JKGamesOwnedPhoneItem();
        if (item) window.openDeviceInterface(item, 'topgames', false);
      }
    });
  }

  window.CityKL = Object.freeze({ open, close, returnToTopGames });
})();
