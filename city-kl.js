(() => {
  'use strict';

  const STORAGE_KEY = 'jk-games-city-kl-property-v2';
  const SAVE_VERSION = 2;
  const START_CASH = 1500;
  const START_BONUS = 200;
  const JAIL_INDEX = 8;
  const FREE_PARKING_INDEX = 16;
  const GO_TO_JAIL_INDEX = 24;
  const BOARD_SIZE = 32;

  const GROUPS = {
    brown: { name: 'Altstadt-Braun', color: '#8a593b', houseCost: 50 },
    lightblue: { name: 'Spree-Blau', color: '#79d5ec', houseCost: 50 },
    pink: { name: 'City-Pink', color: '#dc67b8', houseCost: 100 },
    orange: { name: 'Lausitz-Orange', color: '#f09a3e', houseCost: 100 },
    red: { name: 'Zentrum-Rot', color: '#df4a4f', houseCost: 150 },
    yellow: { name: 'Branitz-Gold', color: '#efcf45', houseCost: 150 }
  };

  const BOARD = [
    { type: 'start', name: 'START', icon: '★', text: '+200 CB beim Vorbeiziehen' },
    { type: 'street', name: 'Mühlenstraße', group: 'brown', price: 60, rent: [4, 20, 60, 180, 320] },
    { type: 'chest', name: 'City-Kasse', icon: '🎁' },
    { type: 'street', name: 'Sandower Hauptstraße', group: 'brown', price: 60, rent: [6, 30, 90, 270, 400] },
    { type: 'tax', name: 'Gewerbesteuer', amount: 100, icon: '🧾' },
    { type: 'station', name: 'Straßenbahn-Depot', price: 200, icon: '🚋' },
    { type: 'street', name: 'Bahnhofstraße', group: 'lightblue', price: 100, rent: [8, 40, 100, 300, 450] },
    { type: 'street', name: 'Karl-Liebknecht-Straße', group: 'lightblue', price: 100, rent: [8, 40, 100, 300, 450] },
    { type: 'jail', name: 'Gefängnis', icon: '🔒', text: 'Nur zu Besuch' },
    { type: 'street', name: 'Berliner Straße', group: 'lightblue', price: 120, rent: [10, 50, 150, 450, 625] },
    { type: 'chance', name: 'Ereignis', icon: '?' },
    { type: 'street', name: 'Straße der Jugend', group: 'pink', price: 140, rent: [12, 60, 180, 500, 700] },
    { type: 'utility', name: 'Stadtwerke Cottbus', price: 150, icon: '⚡' },
    { type: 'street', name: 'Gelsenkirchener Allee', group: 'pink', price: 140, rent: [12, 60, 180, 500, 700] },
    { type: 'street', name: 'Thiemstraße', group: 'pink', price: 160, rent: [14, 70, 200, 550, 750] },
    { type: 'station', name: 'Cottbus Hauptbahnhof', price: 200, icon: '🚉' },
    { type: 'parking', name: 'Freiparken', icon: '🅿', text: 'City-Pot gewinnen' },
    { type: 'street', name: 'Sielower Chaussee', group: 'orange', price: 180, rent: [16, 80, 220, 600, 800] },
    { type: 'chest', name: 'City-Kasse', icon: '🎁' },
    { type: 'street', name: 'Madlower Hauptstraße', group: 'orange', price: 180, rent: [16, 80, 220, 600, 800] },
    { type: 'street', name: 'Lausitzer Straße', group: 'orange', price: 200, rent: [18, 90, 250, 700, 875] },
    { type: 'station', name: 'Busbahnhof', price: 200, icon: '🚌' },
    { type: 'street', name: 'Brandenburger Platz', group: 'red', price: 220, rent: [20, 100, 300, 750, 925] },
    { type: 'street', name: 'Cottbus Zentrum', group: 'red', price: 240, rent: [22, 110, 330, 800, 975] },
    { type: 'gojail', name: 'Ab ins Gefängnis', icon: '🚓' },
    { type: 'street', name: 'Altmarkt', group: 'red', price: 240, rent: [22, 110, 330, 800, 975] },
    { type: 'chance', name: 'Ereignis', icon: '?' },
    { type: 'street', name: 'Schlossstraße', group: 'yellow', price: 260, rent: [24, 120, 360, 850, 1025] },
    { type: 'utility', name: 'Energie Cottbus', price: 150, icon: '💡' },
    { type: 'street', name: 'Branitzer Allee', group: 'yellow', price: 280, rent: [26, 130, 390, 900, 1100] },
    { type: 'street', name: 'Pyramidenstraße', group: 'yellow', price: 300, rent: [28, 150, 450, 1000, 1200] },
    { type: 'station', name: 'Lausitz-Park-Halt', price: 200, icon: '🚆' }
  ];

  const TOKENS = [
    { id: 'car', icon: '🚗', name: 'Sportwagen' },
    { id: 'dog', icon: '🐕', name: 'Stadthund' },
    { id: 'bike', icon: '🏍️', name: 'Motorrad' },
    { id: 'hat', icon: '🎩', name: 'Zylinder' }
  ];

  const BOT_PROFILES = [
    { id: 'nina', name: 'Nina', token: '🐆', color: '#ff75ba', style: 'balanced' },
    { id: 'rico', name: 'Rico', token: '🚙', color: '#4eb6ff', style: 'aggressive' },
    { id: 'max', name: 'Max', token: '🦊', color: '#ffae4c', style: 'careful' }
  ];

  const CHANCE_CARDS = [
    { title: 'Grüne Welle', text: 'Fahre direkt bis START.', action: 'move', target: 0 },
    { title: 'Schnelle Straßenbahn', text: 'Rücke 4 Felder vor.', action: 'relative', amount: 4 },
    { title: 'Baustellenumleitung', text: 'Gehe 3 Felder zurück.', action: 'relative', amount: -3 },
    { title: 'Knöllchen', text: 'Zahle 50 CB.', action: 'cash', amount: -50 },
    { title: 'Stadtfest', text: 'Erhalte 120 CB.', action: 'cash', amount: 120 },
    { title: 'Polizeikontrolle', text: 'Gehe direkt ins Gefängnis.', action: 'jail' },
    { title: 'Immobilienbonus', text: 'Erhalte 25 CB pro eigener Straße.', action: 'perProperty', amount: 25 },
    { title: 'Straßenschäden', text: 'Zahle 20 CB pro Haus.', action: 'perHouse', amount: -20 }
  ];

  const CHEST_CARDS = [
    { title: 'Bürgerbonus', text: 'Die Stadt zahlt dir 100 CB.', action: 'cash', amount: 100 },
    { title: 'Versicherungsbeitrag', text: 'Zahle 60 CB.', action: 'cash', amount: -60 },
    { title: 'Geburtstagsrunde', text: 'Jeder Mitspieler zahlt dir 25 CB.', action: 'fromPlayers', amount: 25 },
    { title: 'Werkstattrechnung', text: 'Zahle 80 CB.', action: 'cash', amount: -80 },
    { title: 'Freifahrtschein', text: 'Du kommst kostenlos aus dem Gefängnis.', action: 'jailCard' },
    { title: 'Jobbonus', text: 'Erhalte 150 CB.', action: 'cash', amount: 150 },
    { title: 'Zum Cottbus Zentrum', text: 'Ziehe direkt zum Cottbus Zentrum.', action: 'move', target: 23 },
    { title: 'Straßenreinigung', text: 'Zahle 15 CB pro Haus.', action: 'perHouse', amount: -15 }
  ];

  const C = {
    overlay: null,
    sourceDevice: '',
    game: null,
    busy: false,
    timers: new Set(),
    resizeHandler: null,
    tileElements: [],
    playerElements: new Map(),
    modalLocked: false,
    modalHideTimer: 0
  };

  function createPlayer(id, name, token, color, isBot, style = 'balanced') {
    return {
      id, name, token, color, isBot, style,
      cash: START_CASH,
      position: 0,
      inJail: false,
      jailAttempts: 0,
      jailCards: 0,
      bankrupt: false,
      properties: [],
      doublesStreak: 0
    };
  }

  function newGame(botCount = 3, tokenId = 'car', difficulty = 'normal') {
    const token = TOKENS.find(item => item.id === tokenId) || TOKENS[0];
    const bots = BOT_PROFILES.slice(0, Math.max(1, Math.min(3, Number(botCount) || 3)));
    return {
      version: SAVE_VERSION,
      startedAt: Date.now(),
      updatedAt: Date.now(),
      difficulty,
      currentPlayer: 0,
      phase: 'roll',
      cityPot: 0,
      lastRoll: [1, 1],
      turn: 1,
      winner: null,
      properties: BOARD.map(() => ({ owner: null, houses: 0, mortgaged: false })),
      players: [
        createPlayer('human', 'Du', token.icon, '#68e4b6', false, 'human'),
        ...bots.map(bot => createPlayer(bot.id, bot.name, bot.token, bot.color, true, bot.style))
      ],
      log: ['Das Cottbus-Immobilienrennen beginnt.']
    };
  }

  function activePlayer() {
    return C.game?.players?.[C.game.currentPlayer] || null;
  }

  function getPlayer(id) {
    return C.game?.players?.find(player => player.id === id) || null;
  }

  function propertyState(index) {
    return C.game?.properties?.[index] || null;
  }

  function isOwnable(tile) {
    return tile && ['street', 'station', 'utility'].includes(tile.type);
  }

  function saveGame() {
    if (!C.game) return;
    C.game.updatedAt = Date.now();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(C.game)); } catch {}
  }

  function loadGame() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!data || data.version !== SAVE_VERSION || !Array.isArray(data.players) || !Array.isArray(data.properties)) return null;
      data.players.forEach(player => {
        player.properties = Array.isArray(player.properties) ? player.properties : [];
        player.doublesStreak = Number(player.doublesStreak || 0);
        player.jailCards = Number(player.jailCards || 0);
      });
      data.log = Array.isArray(data.log) ? data.log.slice(-20) : [];
      data.phase = 'roll';
      data.winner = data.winner || null;
      let guard = 0;
      while (data.players[data.currentPlayer]?.bankrupt && guard++ < data.players.length) data.currentPlayer = (data.currentPlayer + 1) % data.players.length;
      return data;
    } catch {
      return null;
    }
  }

  function deleteSave() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  function setTimer(fn, ms) {
    const id = setTimeout(() => {
      C.timers.delete(id);
      fn();
    }, ms);
    C.timers.add(id);
    return id;
  }

  function clearTimers() {
    C.timers.forEach(id => clearTimeout(id));
    C.timers.clear();
  }

  function formatMoney(value) {
    return `${Math.max(0, Math.floor(Number(value || 0))).toLocaleString('de-DE')} CB`;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function boardCoordinate(index) {
    const route = [];
    for (let col = 8; col >= 0; col--) route.push([8, col]);
    for (let row = 7; row >= 0; row--) route.push([row, 0]);
    for (let col = 1; col <= 8; col++) route.push([0, col]);
    for (let row = 1; row <= 7; row++) route.push([row, 8]);
    return route[index % BOARD_SIZE];
  }

  function renderLanding() {
    const saved = loadGame();
    C.overlay.innerHTML = `
      <div class="city-kl-stage city-kl-landing">
        <div class="city-kl-bg city-kl-bg-one"></div><div class="city-kl-bg city-kl-bg-two"></div>
        <header class="city-kl-topbar">
          <button class="city-kl-back" type="button" data-city-close>×</button>
          <div><small>JK.GAMES · COTTBUS</small><b>City.KL</b></div>
        </header>
        <main class="city-kl-start-card">
          <div class="city-kl-start-logo"><span>🏙️</span><div><small>DAS COTTBUS-BRETTSPIEL</small><h1>City.KL</h1></div></div>
          <p>Kaufe Straßen, kassiere Miete, baue Häuser und besiege bis zu drei Bots. Jeder Spieler startet mit ${formatMoney(START_CASH)}.</p>
          <div class="city-kl-rule-preview">
            <span><i>🏠</i><b>Straßen kaufen</b><small>Freie Grundstücke gehören dir nach dem Kauf.</small></span>
            <span><i>💸</i><b>Miete kassieren</b><small>Mit Häusern steigen deine Einnahmen.</small></span>
            <span><i>🤖</i><b>Gegen Bots</b><small>Nina, Rico und Max spielen selbstständig.</small></span>
            <span><i>🏆</i><b>Letzter gewinnt</b><small>Treibe alle Gegner in den Bankrott.</small></span>
          </div>
          <div class="city-kl-start-options">
            <label><span>Gegner</span><select data-city-bots><option value="1">1 Bot</option><option value="2">2 Bots</option><option value="3" selected>3 Bots</option></select></label>
            <label><span>Schwierigkeit</span><select data-city-difficulty><option value="easy">Leicht</option><option value="normal" selected>Normal</option><option value="hard">Schwer</option></select></label>
          </div>
          <div class="city-kl-token-select" data-city-token-select>
            ${TOKENS.map((item, index) => `<button type="button" class="${index === 0 ? 'active' : ''}" data-token="${item.id}"><span>${item.icon}</span><small>${item.name}</small></button>`).join('')}
          </div>
          <div class="city-kl-start-actions">
            <button type="button" class="primary" data-city-new>Neues Spiel starten</button>
            ${saved ? '<button type="button" class="secondary" data-city-continue>Spiel fortsetzen</button>' : ''}
          </div>
        </main>
      </div>`;

    let selectedToken = 'car';
    C.overlay.querySelectorAll('[data-token]').forEach(button => {
      button.addEventListener('click', () => {
        selectedToken = button.dataset.token || 'car';
        C.overlay.querySelectorAll('[data-token]').forEach(item => item.classList.toggle('active', item === button));
      });
    });
    C.overlay.querySelector('[data-city-close]')?.addEventListener('click', returnToTopGames);
    C.overlay.querySelector('[data-city-new]')?.addEventListener('click', () => {
      const bots = Number(C.overlay.querySelector('[data-city-bots]')?.value || 3);
      const difficulty = C.overlay.querySelector('[data-city-difficulty]')?.value || 'normal';
      C.game = newGame(bots, selectedToken, difficulty);
      saveGame();
      renderGame();
    });
    C.overlay.querySelector('[data-city-continue]')?.addEventListener('click', () => {
      C.game = saved;
      renderGame();
    });
  }

  function renderGame() {
    clearTimers();
    C.busy = false;
    C.modalLocked = false;
    const current = activePlayer();
    C.overlay.innerHTML = `
      <div class="city-kl-stage city-kl-game">
        <header class="city-kl-topbar city-kl-gamebar">
          <button class="city-kl-back" type="button" data-city-close>×</button>
          <div class="city-kl-title"><small>COTTBUS IMMOBILIENRENNEN</small><b>City.KL</b></div>
          <div class="city-kl-turn-badge"><small>AM ZUG</small><b data-city-turn-name>${escapeHtml(current?.name || '')}</b></div>
          <button class="city-kl-menu-button" type="button" data-city-menu>☰</button>
        </header>

        <aside class="city-kl-players" data-city-players></aside>

        <main class="city-kl-board-area">
          <div class="city-kl-board" data-city-board>
            <section class="city-kl-center-panel">
              <div class="city-kl-center-logo"><small>JK.GAMES</small><h1>CITY.KL</h1><span>Cottbus</span></div>
              <div class="city-kl-last-roll"><small>LETZTER WURF</small><b data-roll-total>–</b></div>
              <div class="city-kl-turn-info" data-city-turn-info>Du bist am Zug.</div>
              <button class="city-kl-roll-button" type="button" data-city-roll><span>WÜRFELN</span><small>2 Würfel</small></button>
              <button class="city-kl-bail-button" type="button" data-city-bail hidden>50 CB Kaution zahlen</button>
              <div class="city-kl-pot"><small>FREIPARKEN-POT</small><b data-city-pot>${formatMoney(C.game.cityPot)}</b></div>
            </section>
            <div class="city-kl-dice-throw" data-city-dice-throw hidden aria-live="polite"></div>
          </div>
        </main>

        <footer class="city-kl-actions">
          <button type="button" data-city-properties><span>🏘️</span><b>Meine Straßen</b></button>
          <button type="button" data-city-log><span>📜</span><b>Spielverlauf</b></button>
          <button type="button" data-city-help><span>?</span><b>Regeln</b></button>
        </footer>
        <div class="city-kl-toast" data-city-toast></div>
        <div class="city-kl-modal" data-city-modal hidden></div>
      </div>`;

    buildBoard();
    bindGame();
    updateAll();
    requestAnimationFrame(positionAllPlayers);
    if (activePlayer()?.isBot) scheduleBotTurn(700);
  }

  function buildBoard() {
    const boardEl = C.overlay.querySelector('[data-city-board]');
    C.tileElements = [];
    BOARD.forEach((tile, index) => {
      const [row, col] = boardCoordinate(index);
      const el = document.createElement('div');
      const corner = [0, 8, 16, 24].includes(index);
      el.className = `city-kl-tile city-kl-type-${tile.type}${corner ? ' city-kl-corner' : ''}`;
      el.dataset.tile = String(index);
      el.style.gridRow = String(row + 1);
      el.style.gridColumn = String(col + 1);
      if (tile.group) el.style.setProperty('--tile-group', GROUPS[tile.group].color);
      el.innerHTML = tileHtml(tile, index);
      el.addEventListener('click', () => openTileInfo(index));
      boardEl.append(el);
      C.tileElements.push(el);
    });

    const tokensLayer = document.createElement('div');
    tokensLayer.className = 'city-kl-tokens-layer';
    tokensLayer.dataset.tokensLayer = '';
    boardEl.append(tokensLayer);
    C.playerElements.clear();
    C.game.players.forEach(player => {
      const token = document.createElement('div');
      token.className = `city-kl-player-token${player.bankrupt ? ' bankrupt' : ''}`;
      token.dataset.playerId = player.id;
      token.style.setProperty('--player-color', player.color);
      token.innerHTML = `<span>${player.token}</span><small>${escapeHtml(player.name)}</small>`;
      tokensLayer.append(token);
      C.playerElements.set(player.id, token);
    });
  }

  function tileHtml(tile, index) {
    const prop = propertyState(index);
    const owner = prop?.owner ? getPlayer(prop.owner) : null;
    const ownerMark = owner ? `<i class="city-kl-owner-dot" style="--owner:${owner.color}" title="${escapeHtml(owner.name)}"></i>` : '';
    const houses = prop?.houses > 0 ? `<div class="city-kl-houses">${Array.from({ length: prop.houses }, () => '<i></i>').join('')}</div>` : '';
    if (tile.type === 'street') {
      return `<div class="city-kl-colorbar"></div>${ownerMark}<b>${escapeHtml(tile.name)}</b><small>${formatMoney(tile.price)}</small>${houses}`;
    }
    if (isOwnable(tile)) return `${ownerMark}<span class="city-kl-tile-icon">${tile.icon || '◆'}</span><b>${escapeHtml(tile.name)}</b><small>${formatMoney(tile.price)}</small>`;
    return `<span class="city-kl-tile-icon">${tile.icon || '◆'}</span><b>${escapeHtml(tile.name)}</b><small>${escapeHtml(tile.text || '')}</small>`;
  }

  function refreshTile(index) {
    const tile = BOARD[index];
    const el = C.tileElements[index];
    if (tile && el) el.innerHTML = tileHtml(tile, index);
  }

  function bindGame() {
    C.overlay.querySelector('[data-city-close]')?.addEventListener('click', returnToTopGames);
    C.overlay.querySelector('[data-city-menu]')?.addEventListener('click', openMenu);
    C.overlay.querySelector('[data-city-roll]')?.addEventListener('click', humanRoll);
    C.overlay.querySelector('[data-city-bail]')?.addEventListener('click', payBail);
    C.overlay.querySelector('[data-city-properties]')?.addEventListener('click', openProperties);
    C.overlay.querySelector('[data-city-log]')?.addEventListener('click', openLog);
    C.overlay.querySelector('[data-city-help]')?.addEventListener('click', openRules);
    C.resizeHandler = () => requestAnimationFrame(positionAllPlayers);
    window.addEventListener('resize', C.resizeHandler, { passive: true });
  }

  function updateAll() {
    updatePlayersPanel();
    updateTurnControls();
    updateBoardOwners();
    positionAllPlayers();
    const pot = C.overlay?.querySelector('[data-city-pot]');
    if (pot) pot.textContent = formatMoney(C.game.cityPot);
    saveGame();
  }

  function updatePlayersPanel() {
    const holder = C.overlay?.querySelector('[data-city-players]');
    if (!holder) return;
    holder.innerHTML = C.game.players.map((player, index) => {
      const propertyCount = player.properties.length;
      return `<article class="${index === C.game.currentPlayer ? 'active ' : ''}${player.bankrupt ? 'bankrupt' : ''}" style="--player:${player.color}">
        <div class="city-kl-avatar">${player.token}</div>
        <div><b>${escapeHtml(player.name)}</b><small>${player.isBot ? 'BOT' : 'SPIELER'} · ${propertyCount} Straßen</small></div>
        <strong>${player.bankrupt ? 'BANKROTT' : formatMoney(player.cash)}</strong>
        ${player.inJail ? '<i class="city-kl-jailed">🔒</i>' : ''}
      </article>`;
    }).join('');
  }

  function updateTurnControls() {
    const player = activePlayer();
    const roll = C.overlay?.querySelector('[data-city-roll]');
    const bail = C.overlay?.querySelector('[data-city-bail]');
    const name = C.overlay?.querySelector('[data-city-turn-name]');
    const info = C.overlay?.querySelector('[data-city-turn-info]');
    if (name) name.textContent = player?.name || '';
    if (roll) roll.disabled = C.busy || !player || player.isBot || player.bankrupt || C.game.phase !== 'roll';
    if (bail) {
      bail.hidden = !(player && !player.isBot && player.inJail && player.cash >= 50 && !C.busy);
      bail.disabled = C.busy;
    }
    if (info) {
      if (!player) info.textContent = '';
      else if (player.bankrupt) info.textContent = `${player.name} ist ausgeschieden.`;
      else if (player.inJail) info.textContent = player.isBot ? `${player.name} sitzt im Gefängnis.` : 'Du sitzt im Gefängnis: Würfle einen Pasch oder zahle Kaution.';
      else if (player.isBot) info.textContent = `${player.name} überlegt …`;
      else info.textContent = 'Du bist am Zug. Würfle mit zwei Würfeln.';
    }
  }

  function updateBoardOwners() {
    BOARD.forEach((tile, index) => {
      if (isOwnable(tile)) refreshTile(index);
    });
  }

  function positionAllPlayers() {
    if (!C.overlay) return;
    const boardEl = C.overlay.querySelector('[data-city-board]');
    if (!boardEl) return;
    const boardRect = boardEl.getBoundingClientRect();
    const positions = new Map();
    C.game.players.forEach(player => {
      if (player.bankrupt) return;
      const list = positions.get(player.position) || [];
      list.push(player);
      positions.set(player.position, list);
    });
    positions.forEach((players, tileIndex) => {
      const tileEl = C.tileElements[tileIndex];
      if (!tileEl) return;
      const rect = tileEl.getBoundingClientRect();
      players.forEach((player, offset) => {
        const token = C.playerElements.get(player.id);
        if (!token) return;
        const angle = (Math.PI * 2 * offset) / Math.max(1, players.length);
        const spread = players.length > 1 ? Math.min(rect.width, rect.height) * 0.2 : 0;
        token.style.left = `${rect.left - boardRect.left + rect.width / 2 + Math.cos(angle) * spread}px`;
        token.style.top = `${rect.top - boardRect.top + rect.height / 2 + Math.sin(angle) * spread}px`;
        token.classList.toggle('current', player === activePlayer());
      });
    });
  }

  function humanRoll() {
    const player = activePlayer();
    if (!player || player.isBot || C.busy || C.game.phase !== 'roll') return;
    performTurnRoll(player);
  }

  async function performTurnRoll(player) {
    if (C.busy || player.bankrupt) return;
    C.busy = true;
    C.game.phase = 'moving';
    updateTurnControls();

    const dice = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
    const isDouble = dice[0] === dice[1];
    await animateDice(dice);
    C.game.lastRoll = dice;

    if (player.inJail) {
      if (isDouble) {
        player.inJail = false;
        player.jailAttempts = 0;
        addLog(`${player.name} würfelt einen Pasch und kommt frei.`);
        showToast('Pasch!', `${player.name} kommt aus dem Gefängnis.`);
      } else if (player.jailCards > 0 && (player.isBot || player.jailAttempts >= 1)) {
        player.jailCards--;
        player.inJail = false;
        player.jailAttempts = 0;
        addLog(`${player.name} nutzt einen Freifahrtschein.`);
      } else {
        player.jailAttempts++;
        if (player.jailAttempts >= 3) {
          await transferCash(player, null, 50, 'Kaution');
          if (!player.bankrupt) {
            player.inJail = false;
            player.jailAttempts = 0;
            showToast('Kaution', `${player.name} zahlt 50 CB und kommt frei.`);
          }
        } else {
          addLog(`${player.name} bleibt im Gefängnis (${player.jailAttempts}/3).`);
          C.busy = false;
          await endTurn(false);
          return;
        }
      }
    }

    if (isDouble) player.doublesStreak = Number(player.doublesStreak || 0) + 1;
    else player.doublesStreak = 0;
    if (player.doublesStreak >= 3) {
      player.doublesStreak = 0;
      await sendToJail(player, 'Drei Pasche hintereinander');
      C.busy = false;
      await endTurn(false);
      return;
    }

    const total = dice[0] + dice[1];
    await movePlayer(player, total);
    await resolveLanding(player, total);
    C.busy = false;
    if (C.game.winner || player.bankrupt) {
      await endTurn(false);
      return;
    }
    const extraTurn = isDouble && !player.inJail;
    await endTurn(extraTurn);
  }

  function dicePips(value) {
    const active = {
      1: [5],
      2: [1, 9],
      3: [1, 5, 9],
      4: [1, 3, 7, 9],
      5: [1, 3, 5, 7, 9],
      6: [1, 3, 4, 6, 7, 9]
    }[value] || [5];
    return Array.from({ length: 9 }, (_, index) => `<i class="${active.includes(index + 1) ? 'active' : ''}"></i>`).join('');
  }

  function diceFaceLayout(value) {
    const layouts = {
      1: { front: 1, back: 6, right: 3, left: 4, top: 2, bottom: 5 },
      2: { front: 2, back: 5, right: 3, left: 4, top: 6, bottom: 1 },
      3: { front: 3, back: 4, right: 6, left: 1, top: 2, bottom: 5 },
      4: { front: 4, back: 3, right: 1, left: 6, top: 2, bottom: 5 },
      5: { front: 5, back: 2, right: 3, left: 4, top: 1, bottom: 6 },
      6: { front: 6, back: 1, right: 4, left: 3, top: 2, bottom: 5 }
    };
    return layouts[value] || layouts[1];
  }

  function diceCubeHtml(index, value) {
    const faces = diceFaceLayout(value);
    return `<div class="city-kl-dice-cube city-kl-dice-cube-${index}" data-city-dice-cube="${index}" data-result="${value}" role="img" aria-label="Würfel ${index}: ${value}">
      <span class="city-kl-dice-face front">${dicePips(faces.front)}</span>
      <span class="city-kl-dice-face back">${dicePips(faces.back)}</span>
      <span class="city-kl-dice-face right">${dicePips(faces.right)}</span>
      <span class="city-kl-dice-face left">${dicePips(faces.left)}</span>
      <span class="city-kl-dice-face top">${dicePips(faces.top)}</span>
      <span class="city-kl-dice-face bottom">${dicePips(faces.bottom)}</span>
    </div>`;
  }

  function diceLandingTransform(index) {
    const side = index === 0 ? -1 : 1;
    const x = side * 54;
    const y = index === 0 ? 8 : -4;
    return `translate3d(${x}px,${y}px,0) rotateX(-16deg) rotateY(${side * 17}deg) rotateZ(${side * 6}deg)`;
  }

  let cityThreePromise = null;

  function loadCityThree() {
    if (!cityThreePromise) cityThreePromise = import('three').catch(() => null);
    return cityThreePromise;
  }

  function makeDiceFaceTexture(THREE, value) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 256, 256);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(.55, '#f4f5f4');
    gradient.addColorStop(1, '#cbd1d4');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(7, 7, 242, 242, 36);
    ctx.fill();
    ctx.strokeStyle = '#aeb7bc';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(14, 14, 228, 228, 30);
    ctx.stroke();
    const positions = {
      1: [[128,128]],
      2: [[72,72],[184,184]],
      3: [[72,72],[128,128],[184,184]],
      4: [[72,72],[184,72],[72,184],[184,184]],
      5: [[72,72],[184,72],[128,128],[72,184],[184,184]],
      6: [[72,66],[184,66],[72,128],[184,128],[72,190],[184,190]]
    }[value] || [[128,128]];
    positions.forEach(([x,y]) => {
      const pip = ctx.createRadialGradient(x-5,y-6,2,x,y,23);
      pip.addColorStop(0,'#56616a');
      pip.addColorStop(.25,'#1e2931');
      pip.addColorStop(1,'#05080a');
      ctx.fillStyle = pip;
      ctx.beginPath();
      ctx.arc(x,y,22,0,Math.PI*2);
      ctx.fill();
    });
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }

  function diceTopQuaternion(THREE, value, index) {
    const base = new THREE.Quaternion();
    if (value === 6) base.setFromAxisAngle(new THREE.Vector3(1,0,0), Math.PI);
    else if (value === 2) base.setFromAxisAngle(new THREE.Vector3(1,0,0), -Math.PI / 2);
    else if (value === 5) base.setFromAxisAngle(new THREE.Vector3(1,0,0), Math.PI / 2);
    else if (value === 3) base.setFromAxisAngle(new THREE.Vector3(0,0,1), Math.PI / 2);
    else if (value === 4) base.setFromAxisAngle(new THREE.Vector3(0,0,1), -Math.PI / 2);
    const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), index === 0 ? -.23 : .27);
    return yaw.multiply(base);
  }

  function disposeDiceScene(renderer, scene) {
    scene.traverse((node) => {
      node.geometry?.dispose?.();
      const materials = Array.isArray(node.material) ? node.material : node.material ? [node.material] : [];
      materials.forEach((material) => {
        material.map?.dispose?.();
        material.dispose?.();
      });
    });
    renderer.dispose();
    renderer.forceContextLoss?.();
  }

  async function animateDiceWebGL(result) {
    const THREE = await loadCityThree();
    const layer = C.overlay?.querySelector('[data-city-dice-throw]');
    const total = C.overlay?.querySelector('[data-roll-total]');
    if (!THREE || !layer) return false;

    const player = activePlayer();
    const playerIndex = Math.max(0, C.game.players.indexOf(player));
    layer.hidden = false;
    layer.className = 'city-kl-dice-throw city-kl-dice-webgl throwing';
    layer.style.setProperty('--throw-color', player?.color || '#ffffff');
    layer.innerHTML = `<canvas class="city-kl-dice-canvas" data-city-dice-canvas aria-label="Zwei dreidimensionale Würfel"></canvas><div class="city-kl-dice-total" data-city-dice-total><small>${escapeHtml(player?.name || 'Spieler')}</small><b>?</b></div>`;
    const canvas = layer.querySelector('[data-city-dice-canvas]');
    const totalBadge = layer.querySelector('[data-city-dice-total]');
    const bounds = layer.getBoundingClientRect();
    const width = Math.max(260, Math.min(560, Math.round(bounds.width || 420)));
    const height = Math.max(220, Math.min(420, Math.round(bounds.height || 320)));

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch {
      layer.hidden = true;
      layer.innerHTML = '';
      return false;
    }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(width, height, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / height, .1, 50);
    camera.position.set(0, 5.6, 8.4);
    camera.lookAt(0, .55, 0);
    scene.add(new THREE.HemisphereLight(0xeaf7ff, 0x14212b, 2.2));
    const key = new THREE.DirectionalLight(0xffffff, 4.2);
    key.position.set(-4, 8, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024,1024);
    scene.add(key);
    const rim = new THREE.DirectionalLight(player?.color || '#72e5bd', 2.1);
    rim.position.set(5, 3, -4);
    scene.add(rim);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 9), new THREE.ShadowMaterial({ color: 0x061015, opacity: .42 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    const faceOrder = [3,4,1,6,2,5];
    const faceMaterials = faceOrder.map((face) => new THREE.MeshStandardMaterial({
      map: makeDiceFaceTexture(THREE, face), roughness: .26, metalness: .015
    }));
    const geometry = new THREE.BoxGeometry(1.35,1.35,1.35,2,2,2);
    const bevelLike = new THREE.EdgesGeometry(geometry, 25);
    const starts = [
      [0,4.3],[-4.4,.5],[0,-4.2],[4.4,.5]
    ][playerIndex % 4];
    const dice = result.map((value,index) => {
      const mesh = new THREE.Mesh(geometry, faceMaterials);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const edge = new THREE.LineSegments(bevelLike, new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.32}));
      mesh.add(edge);
      mesh.position.set(starts[0] + (index ? .55 : -.55), 1.4 + index * .35, starts[1]);
      scene.add(mesh);
      return {
        mesh,
        start: mesh.position.clone(),
        target: new THREE.Vector3(index === 0 ? -.88 : .88, .70, index === 0 ? .18 : -.12),
        finalQ: diceTopQuaternion(THREE, value, index),
        spin: new THREE.Vector3(11.5 + index * 1.4, 14.2 - index, 8.8 + value * .35),
        phase: index * .055
      };
    });

    const totalValue = result[0] + result[1];
    const started = performance.now();
    const duration = 1380;
    await new Promise((resolve) => {
      const frame = (now) => {
        const raw = Math.min(1, (now - started) / duration);
        dice.forEach((die,index) => {
          const t = Math.max(0, Math.min(1, (raw - die.phase) / (1 - die.phase)));
          const travel = 1 - Math.pow(1 - Math.min(1,t/.78), 3);
          die.mesh.position.lerpVectors(die.start, die.target, travel);
          die.mesh.position.y = .70 + Math.sin(Math.PI * travel) * 3.05;
          if (t > .78) {
            const bounce = (t - .78) / .22;
            die.mesh.position.y = .70 + Math.abs(Math.sin(bounce * Math.PI * 2.2)) * (1 - bounce) * .42;
          }
          const spinQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(
            die.spin.x * t,
            die.spin.y * t,
            die.spin.z * t,
            'XYZ'
          ));
          const settle = Math.max(0, Math.min(1, (t - .70) / .30));
          const smoothSettle = settle * settle * (3 - 2 * settle);
          die.mesh.quaternion.copy(spinQ).slerp(die.finalQ, smoothSettle);
        });
        renderer.render(scene,camera);
        if (raw < 1) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });

    dice.forEach((die) => { die.mesh.position.copy(die.target); die.mesh.quaternion.copy(die.finalQ); });
    renderer.render(scene,camera);
    if (totalBadge) totalBadge.innerHTML = `<small>${escapeHtml(player?.name || 'Spieler')} würfelt</small><b>${result[0]} + ${result[1]} = ${totalValue}</b>`;
    layer.classList.remove('throwing');
    layer.classList.add('landed');
    if (total) total.textContent = String(totalValue);
    await delay(1250);
    layer.classList.add('leaving');
    await delay(280);
    disposeDiceScene(renderer,scene);
    layer.hidden = true;
    layer.className = 'city-kl-dice-throw';
    layer.innerHTML = '';
    return true;
  }

  async function animateDiceFallback(result) {
    const layer = C.overlay?.querySelector('[data-city-dice-throw]');
    const total = C.overlay?.querySelector('[data-roll-total]');
    if (!layer) {
      if (total) total.textContent = String(result[0] + result[1]);
      await delay(450);
      return;
    }

    const player = activePlayer();
    const playerIndex = Math.max(0, C.game.players.indexOf(player));
    const starts = [[-220,145],[-230,-120],[220,-125],[230,140]][playerIndex % 4];
    layer.hidden = false;
    layer.className = 'city-kl-dice-throw throwing';
    layer.style.setProperty('--throw-color', player?.color || '#ffffff');
    layer.innerHTML = `${diceCubeHtml(1,result[0])}${diceCubeHtml(2,result[1])}<div class="city-kl-dice-total" data-city-dice-total><small>${escapeHtml(player?.name || 'Spieler')}</small><b>?</b></div>`;
    const cubes = [...layer.querySelectorAll('[data-city-dice-cube]')];
    const totalBadge = layer.querySelector('[data-city-dice-total]');
    const totalValue = result[0] + result[1];
    const animations = cubes.map((cube,index) => {
      const side=index===0?-1:1;
      const spinX=1260+result[index]*120+index*170;
      const spinY=1530+result[index]*90-index*130;
      const spinZ=620+result[index]*45+index*80;
      return cube.animate([
        {opacity:0,transform:`translate3d(${starts[0]+side*30}px,${starts[1]}px,240px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)`},
        {opacity:1,offset:.06},
        {transform:`translate3d(${side*105}px,-105px,150px) rotateX(${spinX*.42}deg) rotateY(${spinY*.42}deg) rotateZ(${spinZ*.42}deg)`,offset:.42},
        {transform:`translate3d(${side*76}px,-34px,58px) rotateX(${spinX*.78}deg) rotateY(${spinY*.78}deg) rotateZ(${spinZ*.78}deg)`,offset:.72},
        {opacity:1,transform:diceLandingTransform(index)}
      ],{duration:1180,easing:'cubic-bezier(.16,.78,.2,1)',fill:'forwards'});
    });
    await Promise.all(animations.map(animation=>animation.finished.catch(()=>undefined)));
    animations.forEach((animation,index)=>{animation.cancel();cubes[index].style.transform=diceLandingTransform(index);cubes[index].classList.add('settled')});
    if(totalBadge)totalBadge.innerHTML=`<small>${escapeHtml(player?.name || 'Spieler')} würfelt</small><b>${result[0]} + ${result[1]} = ${totalValue}</b>`;
    layer.classList.remove('throwing');layer.classList.add('landed');if(total)total.textContent=String(totalValue);
    await delay(1100);layer.classList.add('leaving');await delay(280);layer.hidden=true;layer.className='city-kl-dice-throw';layer.innerHTML='';
  }

  async function animateDice(result) {
    const rendered = await animateDiceWebGL(result).catch(() => false);
    if (!rendered) await animateDiceFallback(result);
  }

  async function movePlayer(player, steps) {
    for (let i = 0; i < steps; i++) {
      const old = player.position;
      player.position = (player.position + 1) % BOARD_SIZE;
      if (player.position < old) {
        player.cash += START_BONUS;
        addLog(`${player.name} zieht über START und erhält ${formatMoney(START_BONUS)}.`);
        showToast('START passiert', `${player.name} erhält ${formatMoney(START_BONUS)}.`);
      }
      positionAllPlayers();
      const token = C.playerElements.get(player.id);
      token?.classList.add('moving');
      await delay(145);
      token?.classList.remove('moving');
    }
    updatePlayersPanel();
  }

  async function moveTo(player, target, collectStart = true) {
    const old = player.position;
    player.position = target;
    if (collectStart && target < old) {
      player.cash += START_BONUS;
      addLog(`${player.name} erhält beim Vorbeiziehen an START ${formatMoney(START_BONUS)}.`);
    }
    positionAllPlayers();
    await delay(400);
  }

  async function resolveLanding(player, diceTotal) {
    if (player.bankrupt) return;
    const index = player.position;
    const tile = BOARD[index];
    C.tileElements[index]?.classList.add('hit');
    setTimer(() => C.tileElements[index]?.classList.remove('hit'), 650);
    addLog(`${player.name} landet auf ${tile.name}.`);

    if (isOwnable(tile)) {
      await resolveProperty(player, index, diceTotal);
      return;
    }

    switch (tile.type) {
      case 'start':
        showToast('START', 'Sicher gelandet.');
        break;
      case 'tax':
        C.game.cityPot += tile.amount;
        await transferCash(player, null, tile.amount, tile.name);
        showToast(tile.name, `${player.name} zahlt ${formatMoney(tile.amount)} in den City-Pot.`);
        break;
      case 'chance':
        await drawCard(player, CHANCE_CARDS, 'Ereignis');
        break;
      case 'chest':
        await drawCard(player, CHEST_CARDS, 'City-Kasse');
        break;
      case 'jail':
        showToast('Nur zu Besuch', `${player.name} besucht das Gefängnis.`);
        break;
      case 'parking': {
        const reward = Math.max(50, C.game.cityPot);
        C.game.cityPot = 0;
        player.cash += reward;
        addLog(`${player.name} gewinnt ${formatMoney(reward)} aus dem Freiparken-Pot.`);
        showToast('Freiparken', `${player.name} gewinnt ${formatMoney(reward)}.`);
        break;
      }
      case 'gojail':
        await sendToJail(player, 'Polizeifeld');
        break;
    }
    updateAll();
  }

  async function resolveProperty(player, index, diceTotal) {
    const tile = BOARD[index];
    const prop = propertyState(index);
    if (!prop.owner) {
      if (player.isBot) {
        if (shouldBotBuy(player, tile)) {
          buyProperty(player, index);
          showToast('Straße gekauft', `${player.name} kauft ${tile.name}.`);
          await delay(650);
        } else {
          addLog(`${player.name} lehnt ${tile.name} ab.`);
          await botAuction(index, player);
        }
      } else {
        await askHumanPurchase(index);
      }
      return;
    }
    if (prop.owner === player.id || prop.mortgaged) {
      showToast(tile.name, prop.owner === player.id ? 'Diese Straße gehört dir.' : 'Die Straße ist beliehen. Keine Miete.');
      return;
    }
    const owner = getPlayer(prop.owner);
    if (!owner || owner.bankrupt) return;
    const rent = calculateRent(index, diceTotal);
    await transferCash(player, owner, rent, `Miete für ${tile.name}`);
    if (!player.bankrupt) showToast('Miete fällig', `${player.name} zahlt ${formatMoney(rent)} an ${owner.name}.`);
  }

  function calculateRent(index, diceTotal = 7) {
    const tile = BOARD[index];
    const prop = propertyState(index);
    const owner = getPlayer(prop.owner);
    if (!owner) return 0;
    if (tile.type === 'station') {
      const count = owner.properties.filter(i => BOARD[i].type === 'station' && !propertyState(i).mortgaged).length;
      return 25 * Math.pow(2, Math.max(0, count - 1));
    }
    if (tile.type === 'utility') {
      const count = owner.properties.filter(i => BOARD[i].type === 'utility' && !propertyState(i).mortgaged).length;
      return Math.max(1, diceTotal) * (count >= 2 ? 10 : 4);
    }
    if (tile.type === 'street') {
      let rent = tile.rent[Math.max(0, Math.min(tile.rent.length - 1, prop.houses))];
      if (prop.houses === 0 && ownsGroup(owner, tile.group)) rent *= 2;
      return rent;
    }
    return 0;
  }

  function ownsGroup(player, group) {
    const indices = BOARD.map((tile, index) => tile.type === 'street' && tile.group === group ? index : -1).filter(index => index >= 0);
    return indices.length > 0 && indices.every(index => propertyState(index).owner === player.id && !propertyState(index).mortgaged);
  }

  function shouldBotBuy(player, tile) {
    const reserve = player.style === 'aggressive' ? 180 : player.style === 'careful' ? 450 : 300;
    const difficultyFactor = C.game.difficulty === 'hard' ? 0.9 : C.game.difficulty === 'easy' ? 1.15 : 1;
    if (player.cash - tile.price < reserve * difficultyFactor) return false;
    if (tile.type === 'street') {
      const ownedInGroup = player.properties.filter(index => BOARD[index].group === tile.group).length;
      return Math.random() < Math.min(0.96, 0.66 + ownedInGroup * 0.17 + (player.style === 'aggressive' ? 0.12 : 0));
    }
    return Math.random() < (player.style === 'careful' ? 0.62 : 0.8);
  }

  function buyProperty(player, index, priceOverride = null) {
    const tile = BOARD[index];
    const prop = propertyState(index);
    const price = priceOverride == null ? tile.price : priceOverride;
    if (!isOwnable(tile) || prop.owner || player.cash < price) return false;
    player.cash -= price;
    prop.owner = player.id;
    prop.houses = 0;
    prop.mortgaged = false;
    player.properties.push(index);
    addLog(`${player.name} kauft ${tile.name} für ${formatMoney(price)}.`);
    refreshTile(index);
    updatePlayersPanel();
    return true;
  }

  function askHumanPurchase(index) {
    return new Promise(resolve => {
      const tile = BOARD[index];
      showModal(`
        <div class="city-kl-property-card" style="--property:${tile.group ? GROUPS[tile.group].color : '#4ab3d7'}">
          <div class="city-kl-property-color"></div>
          <small>FREIE IMMOBILIE</small>
          <h2>${escapeHtml(tile.name)}</h2>
          <strong>${formatMoney(tile.price)}</strong>
          <div class="city-kl-rent-table">${propertyRentPreview(tile)}</div>
        </div>
        <p>Du besitzt ${formatMoney(activePlayer().cash)}. Möchtest du diese Immobilie kaufen?</p>
        <div class="city-kl-modal-actions">
          <button type="button" class="primary" data-buy ${activePlayer().cash < tile.price ? 'disabled' : ''}>Kaufen</button>
          <button type="button" class="secondary" data-auction>Auktion</button>
        </div>`, true);
      const modal = C.overlay.querySelector('[data-city-modal]');
      modal.querySelector('[data-buy]')?.addEventListener('click', () => {
        buyProperty(activePlayer(), index);
        closeModal();
        showToast('Gekauft', `${tile.name} gehört jetzt dir.`);
        resolve();
      });
      modal.querySelector('[data-auction]')?.addEventListener('click', async () => {
        closeModal();
        await runAuction(index);
        resolve();
      });
    });
  }

  function propertyRentPreview(tile) {
    if (tile.type === 'street') {
      return tile.rent.map((rent, index) => `<span><small>${index === 0 ? 'Grundmiete' : `${index} Haus${index > 1 ? 'er' : ''}`}</small><b>${formatMoney(rent)}</b></span>`).join('');
    }
    if (tile.type === 'station') return '<span><small>1 Bahnhof</small><b>25 CB</b></span><span><small>4 Bahnhöfe</small><b>200 CB</b></span>';
    return '<span><small>1 Versorger</small><b>4× Würfel</b></span><span><small>2 Versorger</small><b>10× Würfel</b></span>';
  }

  async function runAuction(index) {
    const tile = BOARD[index];
    const bidders = C.game.players.filter(player => !player.bankrupt && player.cash >= Math.max(10, Math.floor(tile.price * 0.35)));
    if (!bidders.length) return;
    let best = null;
    let bid = Math.max(10, Math.floor(tile.price * 0.35 / 10) * 10);
    bidders.forEach(player => {
      const max = Math.min(player.cash - 50, Math.floor(tile.price * (player.isBot ? 0.75 + Math.random() * 0.45 : 0.85)));
      if (max >= bid && (!best || max > best.max)) best = { player, max };
    });
    if (!best) return;
    bid = Math.max(bid, Math.min(best.max, Math.floor(tile.price * (0.65 + Math.random() * 0.25) / 10) * 10));
    buyProperty(best.player, index, bid);
    showToast('Auktion beendet', `${best.player.name} erhält ${tile.name} für ${formatMoney(bid)}.`);
    await delay(700);
  }

  async function botAuction(index, decliningPlayer) {
    const candidates = C.game.players.filter(player => player !== decliningPlayer && !player.bankrupt && player.cash > BOARD[index].price * 0.55);
    if (!candidates.length) return;
    const winner = candidates.sort((a, b) => b.cash - a.cash)[0];
    const price = Math.min(winner.cash - 100, Math.max(10, Math.floor(BOARD[index].price * (0.55 + Math.random() * 0.28) / 10) * 10));
    if (price > 0) {
      buyProperty(winner, index, price);
      showToast('Bot-Auktion', `${winner.name} kauft ${BOARD[index].name} für ${formatMoney(price)}.`);
      await delay(600);
    }
  }

  async function drawCard(player, deck, deckName) {
    const card = deck[Math.floor(Math.random() * deck.length)];
    await showCard(deckName, card, player.isBot);
    await applyCard(player, card);
  }

  function showCard(deckName, card, autoContinue = false) {
    return new Promise(resolve => {
      showModal(`
        <div class="city-kl-card-icon">${deckName === 'Ereignis' ? '?' : '🎁'}</div>
        <small class="city-kl-kicker">${escapeHtml(deckName)}</small>
        <h2>${escapeHtml(card.title)}</h2>
        <p>${escapeHtml(card.text)}</p>
        <button type="button" class="primary" data-card-ok>Weiter</button>`, true);
      let finished = false;
      const done = () => {
        if (finished) return;
        finished = true;
        closeModal();
        resolve();
      };
      C.overlay.querySelector('[data-card-ok]')?.addEventListener('click', done);
      if (autoContinue) setTimer(done, 950);
    });
  }

  async function applyCard(player, card) {
    switch (card.action) {
      case 'cash':
        if (card.amount >= 0) player.cash += card.amount;
        else await transferCash(player, null, Math.abs(card.amount), card.title);
        break;
      case 'move':
        await moveTo(player, card.target, true);
        await resolveLanding(player, C.game.lastRoll.reduce((a, b) => a + b, 0));
        break;
      case 'relative': {
        let target = (player.position + card.amount) % BOARD_SIZE;
        if (target < 0) target += BOARD_SIZE;
        await moveTo(player, target, card.amount > 0 && target < player.position);
        await resolveLanding(player, C.game.lastRoll.reduce((a, b) => a + b, 0));
        break;
      }
      case 'jail':
        await sendToJail(player, card.title);
        break;
      case 'jailCard':
        player.jailCards++;
        break;
      case 'perProperty':
        player.cash += player.properties.length * card.amount;
        break;
      case 'perHouse': {
        const houses = player.properties.reduce((sum, index) => sum + propertyState(index).houses, 0);
        const amount = houses * Math.abs(card.amount);
        if (card.amount < 0) await transferCash(player, null, amount, card.title);
        else player.cash += amount;
        break;
      }
      case 'fromPlayers':
        for (const other of C.game.players) {
          if (other === player || other.bankrupt) continue;
          await transferCash(other, player, card.amount, card.title);
        }
        break;
    }
    updateAll();
  }

  async function sendToJail(player, reason) {
    player.position = JAIL_INDEX;
    player.inJail = true;
    player.jailAttempts = 0;
    player.doublesStreak = 0;
    addLog(`${player.name} muss ins Gefängnis (${reason}).`);
    positionAllPlayers();
    showToast('Gefängnis', `${player.name} muss ins Gefängnis.`);
    await delay(500);
  }

  function payBail() {
    const player = activePlayer();
    if (!player || player.isBot || !player.inJail || player.cash < 50 || C.busy) return;
    player.cash -= 50;
    player.inJail = false;
    player.jailAttempts = 0;
    addLog(`${player.name} zahlt 50 CB Kaution.`);
    updateAll();
    showToast('Kaution bezahlt', 'Du kannst jetzt normal würfeln.');
  }

  async function transferCash(from, to, amount, reason) {
    amount = Math.max(0, Math.floor(Number(amount || 0)));
    if (!from || from.bankrupt || amount <= 0) return;
    if (from.cash < amount) await raiseCash(from, amount);
    const paid = Math.min(from.cash, amount);
    from.cash -= paid;
    if (to && !to.bankrupt) to.cash += paid;
    addLog(`${from.name} zahlt ${formatMoney(paid)}${to ? ` an ${to.name}` : ''} (${reason}).`);
    if (paid < amount) bankruptPlayer(from, to);
    updatePlayersPanel();
  }

  async function raiseCash(player, targetAmount) {
    const buildProperties = player.properties.filter(index => propertyState(index).houses > 0);
    for (const index of buildProperties) {
      while (propertyState(index).houses > 0 && player.cash < targetAmount) {
        const group = BOARD[index].group;
        player.cash += Math.floor(GROUPS[group].houseCost / 2);
        propertyState(index).houses--;
        addLog(`${player.name} verkauft ein Haus auf ${BOARD[index].name}.`);
        refreshTile(index);
      }
    }
    const mortgageable = player.properties
      .filter(index => !propertyState(index).mortgaged && propertyState(index).houses === 0)
      .sort((a, b) => BOARD[b].price - BOARD[a].price);
    for (const index of mortgageable) {
      if (player.cash >= targetAmount) break;
      const value = Math.floor(BOARD[index].price / 2);
      propertyState(index).mortgaged = true;
      player.cash += value;
      addLog(`${player.name} beleiht ${BOARD[index].name} für ${formatMoney(value)}.`);
    }
  }

  function bankruptPlayer(player, creditor) {
    if (player.bankrupt) return;
    player.bankrupt = true;
    player.cash = 0;
    player.inJail = false;
    addLog(`${player.name} ist bankrott.`);
    player.properties.forEach(index => {
      const prop = propertyState(index);
      if (creditor && !creditor.bankrupt) {
        prop.owner = creditor.id;
        creditor.properties.push(index);
      } else {
        prop.owner = null;
        prop.houses = 0;
        prop.mortgaged = false;
      }
      refreshTile(index);
    });
    player.properties = [];
    C.playerElements.get(player.id)?.classList.add('bankrupt');
    const survivors = C.game.players.filter(item => !item.bankrupt);
    if (survivors.length === 1) {
      C.game.winner = survivors[0].id;
      setTimer(() => showWinner(survivors[0]), 600);
    } else {
      showToast('Bankrott', `${player.name} scheidet aus.`);
    }
  }

  async function endTurn(extraTurn) {
    if (C.game.winner) return;
    const player = activePlayer();
    if (!player?.bankrupt && player?.isBot) botManage(player);
    if (extraTurn && player && !player.bankrupt) {
      addLog(`${player.name} hat einen Pasch und ist erneut am Zug.`);
      C.game.phase = 'roll';
      C.busy = false;
      updateAll();
      if (player.isBot) scheduleBotTurn(650);
      else showToast('Pasch!', 'Du darfst noch einmal würfeln.');
      return;
    }
    let next = C.game.currentPlayer;
    do {
      next = (next + 1) % C.game.players.length;
    } while (C.game.players[next].bankrupt && next !== C.game.currentPlayer);
    if (next <= C.game.currentPlayer) C.game.turn++;
    C.game.currentPlayer = next;
    C.game.phase = 'roll';
    C.busy = false;
    updateAll();
    if (activePlayer()?.isBot) scheduleBotTurn(750);
  }

  function scheduleBotTurn(ms = 700) {
    setTimer(() => {
      const bot = activePlayer();
      if (!bot || !bot.isBot || bot.bankrupt || C.busy || C.game.winner) return;
      if (bot.inJail && bot.cash > 600 && Math.random() < 0.45) {
        bot.cash -= 50;
        bot.inJail = false;
        bot.jailAttempts = 0;
        addLog(`${bot.name} zahlt 50 CB Kaution.`);
      }
      updateAll();
      performTurnRoll(bot);
    }, ms);
  }

  function botManage(bot) {
    if (bot.bankrupt) return;
    const reserve = bot.style === 'aggressive' ? 250 : bot.style === 'careful' ? 550 : 380;
    const groups = Object.keys(GROUPS).filter(group => ownsGroup(bot, group));
    for (const group of groups) {
      const indices = bot.properties.filter(index => BOARD[index].group === group);
      let safety = 0;
      while (bot.cash > reserve + GROUPS[group].houseCost && safety++ < 3) {
        const target = indices.sort((a, b) => propertyState(a).houses - propertyState(b).houses)[0];
        if (propertyState(target).houses >= 4) break;
        bot.cash -= GROUPS[group].houseCost;
        propertyState(target).houses++;
        addLog(`${bot.name} baut ein Haus auf ${BOARD[target].name}.`);
        refreshTile(target);
        if (Math.random() > (C.game.difficulty === 'hard' ? 0.25 : 0.55)) continue;
        break;
      }
    }
  }

  function openProperties() {
    const player = getPlayer('human');
    const cards = player.properties.length ? player.properties.map(index => {
      const tile = BOARD[index];
      const prop = propertyState(index);
      const complete = tile.group && ownsGroup(player, tile.group);
      const canBuild = tile.type === 'street' && complete && !prop.mortgaged && prop.houses < 4 && player.cash >= GROUPS[tile.group].houseCost && canBuildEvenly(player, tile.group, index);
      const mortgageValue = Math.floor(tile.price / 2);
      return `<article class="city-kl-owned-card" style="--property:${tile.group ? GROUPS[tile.group].color : '#4ab3d7'}">
        <div></div><h3>${escapeHtml(tile.name)}</h3>
        <p>${prop.mortgaged ? 'Beliehen · keine Miete' : `Miete: ${formatMoney(calculateRent(index, 7))}`}</p>
        ${tile.type === 'street' ? `<small>${complete ? 'Farbgruppe vollständig' : 'Farbgruppe noch unvollständig'} · ${prop.houses}/4 Häuser</small>` : '<small>Sonderimmobilie</small>'}
        <div class="city-kl-card-actions">
          ${tile.type === 'street' ? `<button data-build-house="${index}" ${canBuild ? '' : 'disabled'}>Haus bauen · ${formatMoney(GROUPS[tile.group].houseCost)}</button>` : ''}
          <button class="secondary" data-mortgage="${index}" ${prop.houses > 0 ? 'disabled' : ''}>${prop.mortgaged ? `Auslösen · ${formatMoney(Math.ceil(mortgageValue * 1.1))}` : `Beleihen · ${formatMoney(mortgageValue)}`}</button>
        </div>
      </article>`;
    }).join('') : '<p class="city-kl-empty">Du besitzt noch keine Straße. Kaufe freie Felder, auf denen du landest.</p>';

    showModal(`
      <small class="city-kl-kicker">IMMOBILIENVERWALTUNG</small>
      <h2>Meine Straßen</h2>
      <p>Häuser sind erst möglich, wenn dir die komplette Farbgruppe gehört. Innerhalb einer Gruppe muss gleichmäßig gebaut werden.</p>
      <div class="city-kl-owned-list">${cards}</div>
      <button type="button" class="secondary" data-modal-close>Schließen</button>`);

    C.overlay.querySelectorAll('[data-build-house]').forEach(button => button.addEventListener('click', () => buildHouse(Number(button.dataset.buildHouse))));
    C.overlay.querySelectorAll('[data-mortgage]').forEach(button => button.addEventListener('click', () => toggleMortgage(Number(button.dataset.mortgage))));
  }

  function canBuildEvenly(player, group, targetIndex) {
    const indices = player.properties.filter(index => BOARD[index].group === group);
    const min = Math.min(...indices.map(index => propertyState(index).houses));
    return propertyState(targetIndex).houses <= min;
  }

  function buildHouse(index) {
    const player = getPlayer('human');
    const tile = BOARD[index];
    const prop = propertyState(index);
    if (!player || tile.type !== 'street' || !ownsGroup(player, tile.group) || prop.houses >= 4 || prop.mortgaged) return;
    const cost = GROUPS[tile.group].houseCost;
    if (player.cash < cost || !canBuildEvenly(player, tile.group, index)) return;
    player.cash -= cost;
    prop.houses++;
    addLog(`Du baust ein Haus auf ${tile.name}.`);
    refreshTile(index);
    updateAll();
    closeModal();
    showToast('Haus gebaut', `${tile.name} hat jetzt ${prop.houses} Haus${prop.houses === 1 ? '' : 'er'}.`);
  }

  function toggleMortgage(index) {
    const player = getPlayer('human');
    const tile = BOARD[index];
    const prop = propertyState(index);
    if (!player || prop.owner !== player.id || prop.houses > 0) return;
    const value = Math.floor(tile.price / 2);
    if (!prop.mortgaged) {
      prop.mortgaged = true;
      player.cash += value;
      addLog(`Du beleihst ${tile.name} für ${formatMoney(value)}.`);
    } else {
      const cost = Math.ceil(value * 1.1);
      if (player.cash < cost) return;
      player.cash -= cost;
      prop.mortgaged = false;
      addLog(`Du löst ${tile.name} für ${formatMoney(cost)} aus.`);
    }
    refreshTile(index);
    updateAll();
    closeModal();
    showToast('Immobilie aktualisiert', tile.name);
  }

  function openTileInfo(index) {
    const tile = BOARD[index];
    const prop = propertyState(index);
    const owner = prop?.owner ? getPlayer(prop.owner) : null;
    showModal(`
      <div class="city-kl-property-card" style="--property:${tile.group ? GROUPS[tile.group].color : '#4ab3d7'}">
        <div class="city-kl-property-color"></div>
        <small>FELD ${index}</small><h2>${escapeHtml(tile.name)}</h2>
        ${isOwnable(tile) ? `<strong>${formatMoney(tile.price)}</strong><div class="city-kl-rent-table">${propertyRentPreview(tile)}</div>` : `<span class="city-kl-big-icon">${tile.icon || '◆'}</span><p>${escapeHtml(tile.text || '')}</p>`}
      </div>
      ${isOwnable(tile) ? `<p>${owner ? `Besitzer: <b style="color:${owner.color}">${escapeHtml(owner.name)}</b>${prop.mortgaged ? ' · beliehen' : ''}` : 'Diese Immobilie ist noch frei.'}</p>` : ''}
      <button type="button" class="secondary" data-modal-close>Schließen</button>`);
  }

  function openLog() {
    showModal(`
      <small class="city-kl-kicker">SPIELVERLAUF</small><h2>Letzte Aktionen</h2>
      <div class="city-kl-log-list">${C.game.log.slice().reverse().map(item => `<p>${escapeHtml(item)}</p>`).join('')}</div>
      <button type="button" class="secondary" data-modal-close>Schließen</button>`);
  }

  function openRules() {
    showModal(`
      <small class="city-kl-kicker">SPIELREGELN</small><h2>So funktioniert City.KL</h2>
      <div class="city-kl-rules-list">
        <p><b>1.</b> Alle Spieler starten mit ${formatMoney(START_CASH)} und würfeln der Reihe nach mit zwei Würfeln.</p>
        <p><b>2.</b> Landest du auf einer freien Straße, kannst du sie kaufen. Lehnst du ab, wird sie versteigert.</p>
        <p><b>3.</b> Landet ein Gegner auf deiner Immobilie, zahlt er Miete. Komplette Farbgruppen verdoppeln die Grundmiete.</p>
        <p><b>4.</b> Mit einer kompletten Farbgruppe kannst du bis zu vier Häuser pro Straße bauen.</p>
        <p><b>5.</b> Ein Pasch gibt einen weiteren Zug. Drei Pasche hintereinander führen ins Gefängnis.</p>
        <p><b>6.</b> Wer seine Schulden nicht mehr zahlen kann, geht bankrott. Der letzte aktive Spieler gewinnt.</p>
      </div>
      <button type="button" class="primary" data-modal-close>Verstanden</button>`);
  }

  function openMenu() {
    showModal(`
      <small class="city-kl-kicker">SPIELMENÜ</small><h2>City.KL</h2>
      <p>Dein Spiel wird automatisch auf diesem Gerät gespeichert.</p>
      <div class="city-kl-menu-actions">
        <button type="button" class="primary" data-modal-close>Weiterspielen</button>
        <button type="button" class="secondary" data-restart>Neues Spiel</button>
        <button type="button" class="danger" data-exit>Zu Top Games</button>
      </div>`);
    C.overlay.querySelector('[data-restart]')?.addEventListener('click', () => {
      closeModal();
      showConfirm('Neues Spiel starten?', 'Der aktuelle Spielstand wird gelöscht.', () => {
        deleteSave();
        C.game = null;
        renderLanding();
      });
    });
    C.overlay.querySelector('[data-exit]')?.addEventListener('click', returnToTopGames);
  }

  function showWinner(winner) {
    C.game.phase = 'finished';
    updateAll();
    const human = C.game.players.find((player) => player.id === 'human');
    const mainXpBase = winner.id === 'human' ? 65 : Math.max(10, Math.min(28, 10 + Math.floor((human?.properties?.length || 0) * 2)));
    const mainXp = typeof window.JKGamesAwardMainGameXp === 'function'
      ? window.JKGamesAwardMainGameXp('city', mainXpBase, winner.id === 'human' ? 'City.KL Sieg' : 'City.KL Runde', { eventKey: `city:${C.game.createdAt || C.game.startedAt || Date.now()}:${winner.id}` })
      : 0;
    showModal(`
      <div class="city-kl-winner">🏆</div>
      <small class="city-kl-kicker">SPIEL BEENDET</small>
      <h2>${winner.id === 'human' ? 'Du hast gewonnen!' : `${escapeHtml(winner.name)} gewinnt`}</h2>
      <p>${winner.id === 'human' ? 'Du hast alle Bots in den Bankrott getrieben und kontrollierst Cottbus.' : 'Dein Unternehmen ist ausgeschieden. Starte eine neue Runde und hole dir Cottbus zurück.'}</p>
      <p><b>Hauptcharakter: +${mainXp} EP</b></p>
      <div class="city-kl-modal-actions">
        <button type="button" class="primary" data-new-after-win>Neues Spiel</button>
        <button type="button" class="secondary" data-exit-after-win>Top Games</button>
      </div>`, true);
    C.overlay.querySelector('[data-new-after-win]')?.addEventListener('click', () => {
      deleteSave();
      C.game = null;
      renderLanding();
    });
    C.overlay.querySelector('[data-exit-after-win]')?.addEventListener('click', returnToTopGames);
  }

  function showConfirm(title, text, onConfirm) {
    showModal(`
      <small class="city-kl-kicker">BESTÄTIGEN</small><h2>${escapeHtml(title)}</h2><p>${escapeHtml(text)}</p>
      <div class="city-kl-modal-actions"><button type="button" class="danger" data-confirm>Ja, löschen</button><button type="button" class="secondary" data-modal-close>Abbrechen</button></div>`);
    C.overlay.querySelector('[data-confirm]')?.addEventListener('click', () => {
      closeModal();
      onConfirm();
    });
  }

  function showModal(html, locked = false) {
    const modal = C.overlay?.querySelector('[data-city-modal]');
    if (!modal) return;
    if (C.modalHideTimer) {
      clearTimeout(C.modalHideTimer);
      C.timers.delete(C.modalHideTimer);
      C.modalHideTimer = 0;
    }
    C.modalLocked = locked;
    modal.innerHTML = `<div class="city-kl-modal-backdrop"></div><section>${html}</section>`;
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('open'));
    modal.querySelectorAll('[data-modal-close]').forEach(button => button.addEventListener('click', closeModal));
    if (!locked) modal.querySelector('.city-kl-modal-backdrop')?.addEventListener('click', closeModal);
  }

  function closeModal() {
    const modal = C.overlay?.querySelector('[data-city-modal]');
    if (!modal) return;
    modal.classList.remove('open');
    if (C.modalHideTimer) { clearTimeout(C.modalHideTimer); C.timers.delete(C.modalHideTimer); }
    C.modalHideTimer = setTimer(() => {
      if (!modal) return;
      modal.hidden = true;
      modal.innerHTML = '';
      C.modalHideTimer = 0;
    }, 170);
    C.modalLocked = false;
  }

  function showToast(title, text) {
    const toast = C.overlay?.querySelector('[data-city-toast]');
    if (!toast) return;
    toast.innerHTML = `<b>${escapeHtml(title)}</b><span>${escapeHtml(text)}</span>`;
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
    setTimer(() => toast.classList.remove('show'), 2500);
  }

  function addLog(message) {
    if (!C.game) return;
    C.game.log.push(message);
    if (C.game.log.length > 30) C.game.log.shift();
  }

  function delay(ms) {
    return new Promise(resolve => setTimer(resolve, ms));
  }

  function open(sourceDevice = '') {
    if (sourceDevice) C.sourceDevice = String(sourceDevice);
    else if (typeof window.JKGamesOwnedPhoneItem === 'function') C.sourceDevice = window.JKGamesOwnedPhoneItem() || C.sourceDevice || '';
    if (C.overlay) return;
    C.overlay = document.createElement('div');
    C.overlay.className = 'city-kl-overlay';
    document.body.append(C.overlay);
    renderLanding();
  }

  function close() {
    clearTimers();
    if (C.game) saveGame();
    if (C.resizeHandler) window.removeEventListener('resize', C.resizeHandler);
    C.resizeHandler = null;
    C.overlay?.remove();
    C.overlay = null;
    C.game = null;
    C.tileElements = [];
    C.playerElements.clear();
    C.busy = false;
    C.modalHideTimer = 0;
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
