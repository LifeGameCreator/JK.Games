(() => {
  'use strict';

  const STORAGE_KEY = 'jk-games-match-kl-v1';
  const SAVE_VERSION = 1;
  const ROWS = 8;
  const COLS = 8;
  const CELL_COUNT = ROWS * COLS;
  const MAX_LEVEL = 80;
  const MAX_LIVES = 5;
  const LIFE_REGEN_MS = 20 * 60 * 1000;

  const PIECES = [
    { id: 'coin', icon: 'CB', label: 'CB-Münzen' },
    { id: 'tram', icon: '▰', label: 'Straßenbahnen' },
    { id: 'tree', icon: '♣', label: 'Parkbäume' },
    { id: 'star', icon: '★', label: 'Sterne' },
    { id: 'crest', icon: '◆', label: 'Stadtwappen' },
    { id: 'helmet', icon: '⌂', label: 'Bauhelme' },
    { id: 'energy', icon: 'ϟ', label: 'Energie' }
  ];

  const REGIONS = [
    { id: 'zentrum', name: 'Cottbus Zentrum', icon: '🏙️', subtitle: 'Leuchtende Plätze und erste Kombos', colors: 5, bg: 'linear-gradient(135deg,#17b8d5,#6248cc 58%,#e950b5)', weather: 'klar' },
    { id: 'turm', name: 'Spremberger Turm', icon: '🗼', subtitle: 'Kisten, Mauern und verschlossene Felder', colors: 5, bg: 'linear-gradient(135deg,#d78b3d,#7e382c 58%,#3d1d45)', weather: 'abend' },
    { id: 'branitz', name: 'Branitzer Park', icon: '🌳', subtitle: 'Eis, Blätter und Parkaufgaben', colors: 6, bg: 'linear-gradient(135deg,#138f63,#45c17c 48%,#7cbce0)', weather: 'sonne' },
    { id: 'sandow', name: 'Sandow', icon: '🚋', subtitle: 'Straßenbahnen, Lieferungen und Baustellen', colors: 6, bg: 'linear-gradient(135deg,#e84056,#d07b32 48%,#315b8e)', weather: 'regen' },
    { id: 'sachsendorf', name: 'Sachsendorf', icon: '🏗️', subtitle: 'Betonblöcke und Förderbänder', colors: 6, bg: 'linear-gradient(135deg,#53616d,#a8643d 55%,#d5a133)', weather: 'wolkig' },
    { id: 'btu', name: 'BTU Cottbus', icon: '⚡', subtitle: 'Technik, Energie und Portale', colors: 7, bg: 'linear-gradient(135deg,#176bc4,#11b5b2 52%,#9c55e8)', weather: 'energie' },
    { id: 'arena', name: 'Lausitz-Arena', icon: '🏆', subtitle: 'Zeitdruck, Turniere und harte Ziele', colors: 7, bg: 'linear-gradient(135deg,#ef8d18,#d9444f 52%,#692cb3)', weather: 'event' },
    { id: 'nacht', name: 'Nacht-Cottbus', icon: '🌙', subtitle: 'Neonsteine und die schwersten Missionen', colors: 7, bg: 'linear-gradient(135deg,#111b55,#4f1b85 50%,#d2289a)', weather: 'nacht' }
  ];

  const BOOSTERS = {
    hammer: { name: 'CB-Hammer', icon: '🔨', text: 'Entfernt einen Stein oder beschädigt ein Hindernis.' },
    row: { name: 'Straßenbahn-Linie', icon: '↔️', text: 'Löscht eine komplette Reihe.' },
    col: { name: 'Turm-Blitz', icon: '↕️', text: 'Löscht eine komplette Spalte.' },
    bomb: { name: 'Lausitz-Bombe', icon: '💥', text: 'Sprengt einen großen Bereich.' },
    shuffle: { name: 'Mischen', icon: '🔀', text: 'Mischt alle beweglichen Spielsteine.' },
    moves: { name: '+5 Züge', icon: '➕', text: 'Gibt sofort fünf zusätzliche Züge.' },
    startBomb: { name: 'Start-Bombe', icon: '✨', text: 'Platziert zu Beginn eine Flächenbombe.' },
    startRocket: { name: 'Start-Linienstein', icon: '🚋', text: 'Platziert zu Beginn einen Linien-Booster.' }
  };

  const PROJECTS = [
    { id: 'square', name: 'Altmarkt reinigen', icon: '🧹', cost: 6, text: 'Der Altmarkt bekommt neue Pflasterflächen.' },
    { id: 'stop', name: 'Haltestelle erneuern', icon: '🚏', cost: 10, text: 'Neue Anzeigen und Beleuchtung für die Straßenbahn.' },
    { id: 'park', name: 'Branitzer Park pflegen', icon: '🌿', cost: 15, text: 'Bäume, Wege und Blumen werden restauriert.' },
    { id: 'facade', name: 'Fassaden sanieren', icon: '🏠', cost: 22, text: 'Historische Gebäude erhalten neue Fassaden.' },
    { id: 'tower', name: 'Turm beleuchten', icon: '🗼', cost: 30, text: 'Der Spremberger Turm leuchtet bei Nacht.' },
    { id: 'campus', name: 'BTU-Labor ausbauen', icon: '🔬', cost: 40, text: 'Ein modernes Energielabor entsteht.' },
    { id: 'arena', name: 'Lausitz-Arena modernisieren', icon: '🏟️', cost: 52, text: 'Die Arena erhält neue Tribünen und Technik.' },
    { id: 'night', name: 'Nacht-Cottbus eröffnen', icon: '🌃', cost: 66, text: 'Die komplette Innenstadt bekommt Neonbeleuchtung.' }
  ];

  const BLOCKER_LABELS = {
    crate: { icon: '📦', label: 'Kisten' },
    ice: { icon: '❄️', label: 'Eis' },
    concrete: { icon: '🧱', label: 'Beton' },
    graffiti: { icon: '🎨', label: 'Graffiti' },
    chain: { icon: '⛓️', label: 'Ketten' },
    slime: { icon: '🟢', label: 'Wasserfelder' }
  };

  const M = {
    overlay: null,
    shell: null,
    sourceDevice: '',
    save: null,
    board: [],
    level: null,
    levelNumber: 1,
    goals: [],
    moves: 0,
    score: 0,
    selected: -1,
    activeBooster: '',
    busy: false,
    combo: 0,
    gameStartedAt: 0,
    stats: null,
    timers: new Set(),
    pointerStart: null,
    audio: null,
    modal: null,
    toast: null
  };

  function defaultSave() {
    return {
      version: SAVE_VERSION,
      unlockedLevel: 1,
      lastLevel: 1,
      stars: {},
      scores: {},
      lives: MAX_LIVES,
      lifeAnchor: Date.now(),
      coins: 600,
      boosters: { hammer: 4, row: 2, col: 2, bomb: 2, shuffle: 3, moves: 1, startBomb: 2, startRocket: 2 },
      selectedPre: { startBomb: false, startRocket: false },
      projects: [],
      daily: null,
      event: { week: '', points: 0 },
      settings: { sound: true, hints: true },
      total: { levels: 0, pieces: 0, specials: 0, combos: 0, score: 0 },
      claimedDailyGift: ''
    };
  }

  function loadSave() {
    let data = null;
    try { data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch {}
    const base = defaultSave();
    if (!data || data.version !== SAVE_VERSION) data = base;
    M.save = {
      ...base,
      ...data,
      stars: { ...base.stars, ...(data.stars || {}) },
      scores: { ...base.scores, ...(data.scores || {}) },
      boosters: { ...base.boosters, ...(data.boosters || {}) },
      selectedPre: { ...base.selectedPre, ...(data.selectedPre || {}) },
      settings: { ...base.settings, ...(data.settings || {}) },
      total: { ...base.total, ...(data.total || {}) }
    };
    M.save.projects = Array.isArray(M.save.projects) ? M.save.projects : [];
    updateLives();
    ensureDaily();
    ensureWeeklyEvent();
    save();
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(M.save)); } catch {}
  }

  function dateKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function weekKey() {
    const d = new Date();
    const first = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil((((d - first) / 86400000) + first.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
  }

  function updateLives() {
    const now = Date.now();
    if (M.save.lives >= MAX_LIVES) {
      M.save.lives = MAX_LIVES;
      M.save.lifeAnchor = now;
      return;
    }
    const elapsed = Math.max(0, now - Number(M.save.lifeAnchor || now));
    const gained = Math.floor(elapsed / LIFE_REGEN_MS);
    if (gained > 0) {
      M.save.lives = Math.min(MAX_LIVES, M.save.lives + gained);
      M.save.lifeAnchor += gained * LIFE_REGEN_MS;
      if (M.save.lives >= MAX_LIVES) M.save.lifeAnchor = now;
    }
  }

  function lifeText() {
    updateLives();
    if (M.save.lives >= MAX_LIVES) return 'Voll';
    const remain = LIFE_REGEN_MS - (Date.now() - M.save.lifeAnchor);
    const minutes = Math.max(0, Math.ceil(remain / 60000));
    return `${minutes} Min.`;
  }

  function ensureDaily() {
    const today = dateKey();
    if (M.save.daily?.date === today) return;
    M.save.daily = {
      date: today,
      tasks: [
        { id: 'levels', label: '2 Level gewinnen', target: 2, value: 0, reward: 120, claimed: false },
        { id: 'specials', label: '8 Spezialsteine auslösen', target: 8, value: 0, reward: 90, claimed: false },
        { id: 'pieces', label: '150 Steine entfernen', target: 150, value: 0, reward: 110, claimed: false }
      ]
    };
  }

  function ensureWeeklyEvent() {
    const key = weekKey();
    if (M.save.event?.week === key) return;
    M.save.event = { week: key, points: 0 };
  }

  function setTimer(fn, ms) {
    const id = window.setTimeout(() => { M.timers.delete(id); fn(); }, ms);
    M.timers.add(id);
    return id;
  }

  function clearTimers() {
    M.timers.forEach(id => clearTimeout(id));
    M.timers.clear();
  }

  function delay(ms) { return new Promise(resolve => setTimer(resolve, ms)); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function rand(max) { return Math.floor(Math.random() * max); }
  function pick(list) { return list[rand(list.length)]; }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]); }
  function rowOf(index) { return Math.floor(index / COLS); }
  function colOf(index) { return index % COLS; }
  function indexOf(row, col) { return row * COLS + col; }
  function inside(row, col) { return row >= 0 && row < ROWS && col >= 0 && col < COLS; }
  function adjacent(a, b) { return Math.abs(rowOf(a) - rowOf(b)) + Math.abs(colOf(a) - colOf(b)) === 1; }
  function pieceMeta(id) { return PIECES.find(piece => piece.id === id) || PIECES[0]; }
  function totalStars() { return Object.values(M.save.stars).reduce((sum, value) => sum + Number(value || 0), 0); }
  function regionForLevel(level) { return REGIONS[Math.min(REGIONS.length - 1, Math.floor((level - 1) / 10))]; }

  function goalIcon(goal) {
    if (goal.kind === 'collect') return pieceMeta(goal.key).icon;
    if (goal.kind === 'blocker') return BLOCKER_LABELS[goal.key]?.icon || '◆';
    if (goal.kind === 'delivery') return '🎁';
    if (goal.kind === 'score') return '🏆';
    if (goal.kind === 'boss') return '👑';
    return '★';
  }

  function goalLabel(goal) {
    if (goal.kind === 'collect') return pieceMeta(goal.key).label;
    if (goal.kind === 'blocker') return BLOCKER_LABELS[goal.key]?.label || 'Hindernisse';
    if (goal.kind === 'delivery') return 'Pakete liefern';
    if (goal.kind === 'score') return 'Punkte erreichen';
    if (goal.kind === 'boss') return 'Gebietsfinale';
    return 'Aufgabe';
  }

  function generateLevel(number) {
    const n = clamp(Number(number) || 1, 1, MAX_LEVEL);
    const regionIndex = Math.floor((n - 1) / 10);
    const local = ((n - 1) % 10) + 1;
    const region = REGIONS[regionIndex];
    const goals = [];
    const collectType = PIECES[(n + regionIndex) % region.colors].id;
    const secondType = PIECES[(n + regionIndex + 2) % region.colors].id;
    let moves = Math.max(17, 30 - Math.floor(n / 7));
    let blocker = null;
    let blockerCount = 0;
    let delivery = 0;
    let conveyor = false;
    let slime = false;

    if (n <= 5) {
      goals.push({ kind: 'collect', key: collectType, target: 12 + local * 2 });
    } else if (n <= 10) {
      goals.push({ kind: 'collect', key: collectType, target: 20 + local });
      goals.push({ kind: 'score', key: 'score', target: 3200 + n * 180 });
    } else {
      goals.push({ kind: 'collect', key: collectType, target: 20 + Math.floor(n * .45) });
      if (local % 3 === 0 || regionIndex >= 5) goals.push({ kind: 'collect', key: secondType, target: 14 + Math.floor(n * .25) });
    }

    if (regionIndex === 1) { blocker = 'crate'; blockerCount = 6 + local; }
    if (regionIndex === 2) { blocker = 'ice'; blockerCount = 8 + local; }
    if (regionIndex === 3) { blocker = local <= 5 ? 'graffiti' : 'crate'; blockerCount = 9 + local; delivery = local >= 4 ? 1 + Math.floor(local / 4) : 0; }
    if (regionIndex === 4) { blocker = local <= 5 ? 'concrete' : 'chain'; blockerCount = 8 + local; conveyor = local >= 3; }
    if (regionIndex === 5) { blocker = local % 2 ? 'chain' : 'ice'; blockerCount = 10 + local; delivery = local >= 5 ? 2 : 0; }
    if (regionIndex === 6) { blocker = local <= 4 ? 'concrete' : 'graffiti'; blockerCount = 12 + local; conveyor = local % 2 === 0; moves -= 1; }
    if (regionIndex === 7) { blocker = local % 3 === 0 ? 'slime' : (local % 2 ? 'chain' : 'concrete'); blockerCount = 13 + local; delivery = 1 + Math.floor(local / 4); conveyor = local >= 5; slime = blocker === 'slime'; moves -= 2; }

    if (blocker) goals.push({ kind: 'blocker', key: blocker, target: blockerCount });
    if (delivery) goals.push({ kind: 'delivery', key: 'delivery', target: delivery });
    if (n > 20 && !goals.some(goal => goal.kind === 'score') && local % 4 === 0) goals.push({ kind: 'score', key: 'score', target: 7000 + n * 260 });
    if (local === 10) {
      const bossGoal = { kind: 'boss', key: 'boss', target: 5 + regionIndex * 2 };
      if (goals.length >= 3) goals[2] = bossGoal;
      else goals.push(bossGoal);
      moves += 3;
    }

    return {
      number: n,
      regionIndex,
      region,
      local,
      colors: region.colors,
      moves,
      goals: goals.slice(0, 3),
      blocker,
      blockerCount,
      delivery,
      conveyor,
      slime,
      starThresholds: [3500 + n * 140, 6200 + n * 220, 9000 + n * 330]
    };
  }

  function randomPieceType(colorCount = M.level?.colors || 5) {
    return PIECES[rand(colorCount)].id;
  }

  function makeCell() {
    return { piece: randomPieceType(), special: '', blocker: '', hp: 0, ingredient: false };
  }

  function isSolid(cell) { return cell?.blocker === 'crate' || cell?.blocker === 'concrete'; }

  function createsImmediateMatch(board, index, type) {
    const r = rowOf(index), c = colOf(index);
    if (c >= 2 && board[index - 1]?.piece === type && board[index - 2]?.piece === type) return true;
    if (r >= 2 && board[index - COLS]?.piece === type && board[index - COLS * 2]?.piece === type) return true;
    return false;
  }

  function createBoard(level) {
    const board = Array.from({ length: CELL_COUNT }, () => ({ piece: '', special: '', blocker: '', hp: 0, ingredient: false }));
    for (let i = 0; i < CELL_COUNT; i += 1) {
      let type = randomPieceType(level.colors);
      let guard = 0;
      while (createsImmediateMatch(board, i, type) && guard++ < 20) type = randomPieceType(level.colors);
      board[i].piece = type;
    }

    if (level.blockerCount) {
      const candidates = Array.from({ length: CELL_COUNT }, (_, i) => i).filter(i => rowOf(i) > 0 && rowOf(i) < ROWS - 1);
      for (let placed = 0; placed < level.blockerCount && candidates.length; placed += 1) {
        const at = candidates.splice(rand(candidates.length), 1)[0];
        board[at].blocker = level.blocker;
        board[at].hp = ['crate', 'concrete'].includes(level.blocker) ? 2 : 1;
        if (isSolid(board[at])) board[at].piece = '';
      }
    }

    for (let i = 0; i < level.delivery; i += 1) {
      const candidates = Array.from({ length: COLS }, (_, col) => col).filter(col => !isSolid(board[col]) && !board[col].ingredient);
      if (!candidates.length) break;
      board[pick(candidates)].ingredient = true;
    }

    if (!hasValidMove(board)) reshuffleBoard(board, false);
    return board;
  }

  function cloneCell(cell) { return { ...cell }; }

  function swapCells(a, b) {
    const first = M.board[a];
    M.board[a] = M.board[b];
    M.board[b] = first;
  }

  function findMatches(board = M.board) {
    const groups = [];
    for (let row = 0; row < ROWS; row += 1) {
      let start = 0;
      while (start < COLS) {
        const first = board[indexOf(row, start)];
        if (!first?.piece || isSolid(first) || first.special === 'color') { start += 1; continue; }
        let end = start + 1;
        while (end < COLS && board[indexOf(row, end)]?.piece === first.piece && !isSolid(board[indexOf(row, end)]) && board[indexOf(row, end)]?.special !== 'color') end += 1;
        if (end - start >= 3) groups.push({ orientation: 'row', indices: Array.from({ length: end - start }, (_, n) => indexOf(row, start + n)) });
        start = end;
      }
    }
    for (let col = 0; col < COLS; col += 1) {
      let start = 0;
      while (start < ROWS) {
        const first = board[indexOf(start, col)];
        if (!first?.piece || isSolid(first) || first.special === 'color') { start += 1; continue; }
        let end = start + 1;
        while (end < ROWS && board[indexOf(end, col)]?.piece === first.piece && !isSolid(board[indexOf(end, col)]) && board[indexOf(end, col)]?.special !== 'color') end += 1;
        if (end - start >= 3) groups.push({ orientation: 'col', indices: Array.from({ length: end - start }, (_, n) => indexOf(start + n, col)) });
        start = end;
      }
    }
    return groups;
  }

  function hasValidMove(board = M.board) {
    for (let i = 0; i < CELL_COUNT; i += 1) {
      if (!board[i]?.piece || isSolid(board[i])) continue;
      for (const next of [i + 1, i + COLS]) {
        if (next >= CELL_COUNT || !adjacent(i, next) || !board[next]?.piece || isSolid(board[next])) continue;
        const temp = board[i]; board[i] = board[next]; board[next] = temp;
        const valid = findMatches(board).length > 0 || board[i].special === 'color' || board[next].special === 'color';
        board[next] = board[i]; board[i] = temp;
        if (valid) return true;
      }
    }
    return false;
  }

  function reshuffleBoard(board = M.board, animate = true) {
    const movable = board.filter(cell => cell.piece && !isSolid(cell)).map(cell => ({ piece: cell.piece, special: cell.special }));
    for (let tries = 0; tries < 80; tries += 1) {
      for (let i = movable.length - 1; i > 0; i -= 1) {
        const j = rand(i + 1); [movable[i], movable[j]] = [movable[j], movable[i]];
      }
      let cursor = 0;
      board.forEach(cell => {
        if (cell.piece && !isSolid(cell)) {
          cell.piece = movable[cursor].piece;
          cell.special = movable[cursor].special;
          cursor += 1;
        }
      });
      if (!findMatches(board).length && hasValidMove(board)) break;
    }
    if (animate) {
      renderBoard();
      flashBoard();
      toast('Spielfeld gemischt', 'Neue Kombinationen sind bereit.');
    }
  }

  function resetRuntime() {
    M.board = [];
    M.level = null;
    M.goals = [];
    M.moves = 0;
    M.score = 0;
    M.selected = -1;
    M.activeBooster = '';
    M.busy = false;
    M.combo = 0;
    M.stats = { pieces: 0, specials: 0, largestCombo: 0, boosters: 0 };
  }

  function open(sourceDevice = '') {
    if (M.overlay) return;
    loadSave();
    M.sourceDevice = String(sourceDevice || (typeof window.JKGamesOwnedPhoneItem === 'function' ? window.JKGamesOwnedPhoneItem() || '' : ''));
    M.overlay = document.createElement('div');
    M.overlay.className = 'match-kl-overlay';
    M.overlay.innerHTML = '<div class="match-kl-shell" data-mkl-shell></div><div class="mkl-toast" data-mkl-toast></div><div class="mkl-modal" data-mkl-modal hidden></div>';
    document.body.append(M.overlay);
    M.shell = M.overlay.querySelector('[data-mkl-shell]');
    M.toast = M.overlay.querySelector('[data-mkl-toast]');
    M.modal = M.overlay.querySelector('[data-mkl-modal]');
    renderLoading();
  }

  function close() {
    clearTimers();
    save();
    M.overlay?.remove();
    M.overlay = null;
    M.shell = null;
    M.modal = null;
    M.toast = null;
    resetRuntime();
  }

  function returnToTopGames() {
    const source = M.sourceDevice;
    close();
    requestAnimationFrame(() => {
      if (typeof window.JKGamesOpenTopGames === 'function') window.JKGamesOpenTopGames(source);
      else if (typeof window.openDeviceInterface === 'function' && typeof window.JKGamesOwnedPhoneItem === 'function') {
        const item = window.JKGamesOwnedPhoneItem();
        if (item) window.openDeviceInterface(item, 'topgames', false);
      }
    });
  }

  function renderLoading() {
    M.shell.innerHTML = `<div class="mkl-loading" data-mkl-loading><div class="mkl-loading-content"><small class="mkl-kicker">JK.GAMES · COTTBUS</small><div class="mkl-loading-logo">Match.KL</div><div class="mkl-loading-grid">${Array.from({ length: 18 }, () => '<i></i>').join('')}</div><b>Spielsteine und Cottbus-Level werden vorbereitet</b><div class="mkl-loading-bar"><i data-mkl-loadbar></i></div><small data-mkl-loadtext>Levelkarte laden …</small></div></div>`;
    const bar = M.shell.querySelector('[data-mkl-loadbar]');
    const text = M.shell.querySelector('[data-mkl-loadtext]');
    const steps = [[18, 'Spielsteine laden …'], [42, 'Spezialeffekte vorbereiten …'], [68, 'Cottbus-Bereiche aufbauen …'], [88, 'Fortschritt prüfen …'], [100, 'Bereit!']];
    steps.forEach(([value, label], index) => setTimer(() => { if (bar) bar.style.width = `${value}%`; if (text) text.textContent = label; }, 240 + index * 260));
    setTimer(() => {
      M.shell.querySelector('[data-mkl-loading]')?.classList.add('hide');
      setTimer(renderHome, 420);
    }, 1700);
  }

  function appbar(title = 'Match.KL', showBack = false) {
    updateLives();
    return `<header class="mkl-appbar">
      <div class="mkl-brand"><span class="mkl-brand-logo">M</span><div><small>JK.GAMES · MATCH-3</small><b>${escapeHtml(title)}</b></div></div>
      <div class="mkl-spacer"></div>
      <div class="mkl-resourcebar">
        <div class="mkl-resource"><i>❤️</i><b>${M.save.lives}</b><small>${lifeText()}</small></div>
        <div class="mkl-resource"><i>🪙</i><b>${M.save.coins}</b><small>Match Coins</small></div>
        <div class="mkl-resource"><i>⭐</i><b>${totalStars()}</b><small>Sterne</small></div>
      </div>
      ${showBack ? '<button type="button" class="mkl-icon-btn" data-mkl-home title="Zurück">←</button>' : '<button type="button" class="mkl-icon-btn" data-mkl-exit title="Top Games">×</button>'}
    </header>`;
  }

  function previewPieces() {
    const pattern = ['coin', 'tram', 'tree', 'star', 'crest', 'helmet', 'energy', 'coin', 'tram', 'star', 'crest', 'tree', 'helmet', 'coin', 'energy', 'star', 'tram', 'tree', 'crest', 'coin'];
    const colors = {
      coin: ['#ffe772', '#e48c05', '#ffbe28'], tram: ['#ff9299', '#a50e32', '#f03c55'], tree: ['#a3f28e', '#128344', '#42ca6b'], star: ['#fff59a', '#b77704', '#f4c737'], crest: ['#8ac5ff', '#183e9e', '#3878e0'], helmet: ['#ffc16e', '#9d330d', '#ed751d'], energy: ['#d9a2ff', '#502094', '#9148e6']
    };
    return pattern.map((id, index) => `<span class="mkl-preview-piece" style="--p1:${colors[id][0]};--p2:${colors[id][1]};--glow:${colors[id][2]}88;animation-delay:${-(index % 5) * .32}s">${pieceMeta(id).icon}</span>`).join('');
  }

  function renderHome() {
    if (!M.shell) return;
    updateLives(); ensureDaily(); ensureWeeklyEvent(); save();
    const current = clamp(M.save.lastLevel || M.save.unlockedLevel, 1, M.save.unlockedLevel);
    const dailyReady = M.save.daily.tasks.some(task => task.value >= task.target && !task.claimed);
    const giftReady = M.save.claimedDailyGift !== dateKey();
    M.shell.innerHTML = `<main class="match-kl-screen"><div class="mkl-screen">${appbar('Match.KL')}
      <div class="mkl-page">
        <section class="mkl-card mkl-hero">
          <div class="mkl-hero-copy"><small class="mkl-kicker">COTTBUS MATCH-3 ABENTEUER</small><h1>Match<span>.KL</span></h1><p>Verbinde leuchtende Cottbus-Steine, erschaffe starke Spezialobjekte, löse Missionen und restauriere die Stadt auf einer großen Levelkarte.</p>
            <div class="mkl-hero-actions"><button type="button" class="mkl-primary" data-mkl-continue>Level ${current} spielen</button><button type="button" class="mkl-secondary" data-mkl-map>Levelkarte</button></div>
          </div><div class="mkl-hero-board"><div class="mkl-preview-grid">${previewPieces()}</div></div>
        </section>
        <section class="mkl-home-grid">
          <button type="button" class="mkl-menu-card" data-mkl-map><i>🗺️</i><b>Levelkarte</b><small>80 Level in acht Cottbuser Bereichen.</small></button>
          <button type="button" class="mkl-menu-card" data-mkl-daily><i>🎯</i><b>Tagesaufgaben</b><small>Schließe Missionen ab und verdiene Match Coins.</small>${dailyReady ? '<em>FERTIG</em>' : ''}</button>
          <button type="button" class="mkl-menu-card" data-mkl-projects><i>🏗️</i><b>Stadt restaurieren</b><small>Verwende Sterne für Plätze, Parks und Gebäude.</small></button>
          <button type="button" class="mkl-menu-card" data-mkl-shop><i>🛍️</i><b>Booster-Shop</b><small>Hammer, Bomben, Linien und zusätzliche Züge.</small></button>
          <button type="button" class="mkl-menu-card" data-mkl-event><i>🏆</i><b>Cottbus-Cup</b><small>Wöchentliche Punkte durch gewonnene Level.</small></button>
          <button type="button" class="mkl-menu-card" data-mkl-rules><i>💡</i><b>So funktioniert es</b><small>Kombinationen, Spezialsteine und Hindernisse.</small></button>
          <button type="button" class="mkl-menu-card" data-mkl-gift><i>🎁</i><b>Tagesgeschenk</b><small>Jeden Tag kostenlose Match Coins und Booster.</small>${giftReady ? '<em>ABHOLEN</em>' : ''}</button>
          <button type="button" class="mkl-menu-card" data-mkl-exit><i>📱</i><b>Top Games</b><small>Zurück zum Smartphone und zu den anderen Spielen.</small></button>
        </section>
      </div></div></main>`;
    bindCommon();
    M.shell.querySelector('[data-mkl-continue]')?.addEventListener('click', () => renderPreLevel(current));
    M.shell.querySelectorAll('[data-mkl-map]').forEach(button => button.addEventListener('click', renderMap));
    M.shell.querySelector('[data-mkl-daily]')?.addEventListener('click', renderDaily);
    M.shell.querySelector('[data-mkl-projects]')?.addEventListener('click', renderProjects);
    M.shell.querySelector('[data-mkl-shop]')?.addEventListener('click', renderShop);
    M.shell.querySelector('[data-mkl-event]')?.addEventListener('click', renderEvent);
    M.shell.querySelector('[data-mkl-rules]')?.addEventListener('click', renderRules);
    M.shell.querySelector('[data-mkl-gift]')?.addEventListener('click', claimDailyGift);
  }

  function bindCommon() {
    M.shell?.querySelectorAll('[data-mkl-exit]').forEach(button => button.addEventListener('click', returnToTopGames));
    M.shell?.querySelectorAll('[data-mkl-home]').forEach(button => button.addEventListener('click', renderHome));
  }

  function starsHtml(count) {
    return `<span class="mkl-level-stars">${[1,2,3].map(star => `<i class="${star <= count ? 'on' : ''}">★</i>`).join('')}</span>`;
  }

  function renderMap() {
    M.shell.innerHTML = `<main class="match-kl-screen"><div class="mkl-screen">${appbar('Levelkarte', true)}<div class="mkl-page"><div class="mkl-section-title"><div><small class="mkl-kicker">80 LEVEL · 8 BEREICHE</small><h2>Reise durch Cottbus</h2></div><p>Neue Bereiche öffnen sich automatisch mit deinem Fortschritt.</p></div><div class="mkl-map">
      ${REGIONS.map((region, regionIndex) => {
        const start = regionIndex * 10 + 1;
        const unlocked = M.save.unlockedLevel >= start;
        return `<section class="mkl-card mkl-region" style="--region-bg:${region.bg}"><header class="mkl-region-head"><span class="mkl-region-icon">${region.icon}</span><div><small>BEREICH ${regionIndex + 1}</small><b>${escapeHtml(region.name)}</b><small>${escapeHtml(region.subtitle)}</small></div></header><div class="mkl-level-track">${Array.from({ length: 10 }, (_, offset) => {
          const level = start + offset;
          const open = level <= M.save.unlockedLevel;
          const stars = Number(M.save.stars[level] || 0);
          return `<button type="button" class="mkl-level-node ${level === M.save.unlockedLevel ? 'current' : ''}" data-mkl-level="${level}" ${open ? '' : 'disabled'}><strong>${open ? level : '🔒'}</strong>${starsHtml(stars)}</button>`;
        }).join('')}</div></section>`;
      }).join('')}</div></div></div></main>`;
    bindCommon();
    M.shell.querySelectorAll('[data-mkl-level]').forEach(button => button.addEventListener('click', () => renderPreLevel(Number(button.dataset.mklLevel))));
  }

  function renderPreLevel(number) {
    const level = generateLevel(number);
    M.save.lastLevel = level.number;
    save();
    const selected = M.save.selectedPre;
    M.shell.innerHTML = `<main class="match-kl-screen"><div class="mkl-screen">${appbar(`Level ${level.number}`, true)}<div class="mkl-page">
      <div class="mkl-region-banner" style="--region-bg:${level.region.bg}"><small class="mkl-kicker">${level.region.icon} ${escapeHtml(level.region.name)}</small><h3>Level ${level.number}</h3><p>${escapeHtml(level.region.subtitle)} · ${level.moves} Züge</p></div>
      <div class="mkl-prelevel"><section class="mkl-card mkl-level-info"><small class="mkl-kicker">DEINE AUFGABEN</small><h2>Bereit für Level ${level.number}?</h2><div class="mkl-goal-list">${level.goals.map(goal => `<article class="mkl-goal-card"><i>${goalIcon(goal)}</i><div><b>${escapeHtml(goalLabel(goal))}</b><small>${goal.target.toLocaleString('de-DE')} erreichen</small></div></article>`).join('')}</div>
      <div class="mkl-hero-actions"><button type="button" class="mkl-primary" data-mkl-start-level>Level starten</button><button type="button" class="mkl-secondary" data-mkl-map>Zur Levelkarte</button></div></section>
      <aside class="mkl-card mkl-boost-select"><small class="mkl-kicker">START-BOOSTER</small><h3>Vor dem Level auswählen</h3><div class="mkl-boost-options">${['startBomb','startRocket'].map(id => `<button type="button" class="mkl-boost-option ${selected[id] ? 'selected' : ''}" data-mkl-preboost="${id}"><i>${BOOSTERS[id].icon}</i><span><b>${BOOSTERS[id].name}</b><small>${BOOSTERS[id].text}</small></span><em>${M.save.boosters[id]}</em></button>`).join('')}</div><p class="mkl-hint-line">Ausgewählte Start-Booster werden erst beim Start verbraucht.</p></aside></div></div></div></main>`;
    bindCommon();
    M.shell.querySelector('[data-mkl-map]')?.addEventListener('click', renderMap);
    M.shell.querySelectorAll('[data-mkl-preboost]').forEach(button => button.addEventListener('click', () => {
      const id = button.dataset.mklPreboost;
      if (M.save.boosters[id] <= 0) return toast('Kein Booster vorhanden', 'Im Booster-Shop kannst du Nachschub kaufen.');
      M.save.selectedPre[id] = !M.save.selectedPre[id];
      save(); renderPreLevel(number);
    }));
    M.shell.querySelector('[data-mkl-start-level]')?.addEventListener('click', () => startLevel(number));
  }

  function startLevel(number) {
    updateLives();
    if (M.save.lives <= 0) return showNoLives();
    resetRuntime();
    M.level = generateLevel(number);
    M.levelNumber = M.level.number;
    M.moves = M.level.moves;
    M.goals = M.level.goals.map(goal => ({ ...goal, current: 0 }));
    M.board = createBoard(M.level);
    M.gameStartedAt = Date.now();
    M.save.lastLevel = M.level.number;

    if (M.save.selectedPre.startBomb && M.save.boosters.startBomb > 0) {
      const indices = M.board.map((cell, i) => cell.piece && !isSolid(cell) ? i : -1).filter(i => i >= 0);
      if (indices.length) M.board[pick(indices)].special = 'bomb';
      M.save.boosters.startBomb -= 1;
    }
    if (M.save.selectedPre.startRocket && M.save.boosters.startRocket > 0) {
      const indices = M.board.map((cell, i) => cell.piece && !isSolid(cell) ? i : -1).filter(i => i >= 0);
      if (indices.length) M.board[pick(indices)].special = Math.random() < .5 ? 'row' : 'col';
      M.save.boosters.startRocket -= 1;
    }
    M.save.selectedPre.startBomb = false;
    M.save.selectedPre.startRocket = false;
    save();
    renderGame();
  }

  function renderGame() {
    const region = M.level.region;
    M.shell.innerHTML = `<main class="match-kl-screen mkl-game-screen"><div class="mkl-screen"><div class="mkl-game-layout">
      <section class="mkl-card mkl-game-card"><header class="mkl-game-head"><div class="mkl-game-head-left"><button type="button" class="mkl-icon-btn mkl-game-exit-btn" data-mkl-game-menu title="Level verlassen" aria-label="Level verlassen">×</button><div class="mkl-counter"><small>ZÜGE</small><b data-mkl-moves>${M.moves}</b></div></div><div class="mkl-level-title"><small>${escapeHtml(region.name).toUpperCase()}</small><b>LEVEL ${M.level.number}</b></div><div class="mkl-game-head-right"><div class="mkl-counter"><small>PUNKTE</small><b data-mkl-score>0</b></div></div></header>
      <div class="mkl-board-wrap" style="--region-bg:${region.bg}"><div class="mkl-board ${M.level.conveyor ? 'conveyor' : ''} ${M.level.regionIndex === 7 ? 'night' : ''}" data-mkl-board></div><div class="mkl-particle-layer" data-mkl-particles></div></div></section>
      <aside class="mkl-sidepanel"><section class="mkl-card mkl-goals-panel"><h3>🎯 Aufgaben</h3><div data-mkl-goals></div></section><section class="mkl-card mkl-boost-panel"><h3>✨ Booster</h3><div class="mkl-booster-grid">${['hammer','row','col','bomb','shuffle','moves'].map(id => `<button type="button" class="mkl-booster-btn" data-mkl-booster="${id}"><i>${BOOSTERS[id].icon}</i><b>${BOOSTERS[id].name}</b><em data-mkl-count-${id}>${M.save.boosters[id]}</em></button>`).join('')}</div><p class="mkl-hint-line">Booster auswählen und anschließend ein Feld berühren. Mischen und +5 Züge wirken sofort.</p></section></aside>
      </div></div></main>`;
    renderBoard(); updateHud(); bindGame();
    if (M.save.settings.hints) setTimer(showHint, 6000);
  }

  function cellContentHtml(cell) {
    const meta = cell.piece ? pieceMeta(cell.piece) : null;
    const piece = meta ? `<span class="mkl-piece type-${meta.id} ${cell.special ? `special-${cell.special}` : ''}">${cell.special === 'color' ? '' : meta.icon}</span>` : '';
    const blocker = cell.blocker ? `<span class="mkl-blocker ${cell.blocker}">${isSolid(cell) ? (cell.blocker === 'crate' ? '╳' : '▧') : ''}</span>${cell.hp > 1 ? `<span class="mkl-hp">${cell.hp}</span>` : ''}` : '';
    const ingredient = cell.ingredient ? '<span class="mkl-ingredient">📦</span>' : '';
    return `${piece}${blocker}${ingredient}`;
  }

  function cellSignature(cell) {
    return [cell?.piece || '', cell?.special || '', cell?.blocker || '', Number(cell?.hp || 0), cell?.ingredient ? 1 : 0].join('|');
  }

  function cellHtml(cell, index) {
    const meta = cell.piece ? pieceMeta(cell.piece) : null;
    return `<button type="button" class="mkl-cell ${index === M.selected ? 'selected' : ''}" data-mkl-cell="${index}" data-mkl-signature="${cellSignature(cell)}" aria-label="${meta ? escapeHtml(meta.label) : 'Hindernis'}">${cellContentHtml(cell)}</button>`;
  }

  function syncCellElement(button, cell, index) {
    if (!button) return;
    const meta = cell.piece ? pieceMeta(cell.piece) : null;
    button.classList.remove('clearing', 'falling', 'invalid', 'hint');
    button.classList.toggle('selected', index === M.selected);
    button.setAttribute('aria-label', meta ? meta.label : 'Hindernis');
    const signature = cellSignature(cell);
    if (button.dataset.mklSignature !== signature) {
      button.dataset.mklSignature = signature;
      button.innerHTML = cellContentHtml(cell);
    }
  }

  function bindBoardEvents(board) {
    if (board.dataset.mklBound === '1') return;
    board.dataset.mklBound = '1';
    board.addEventListener('click', event => {
      const button = event.target.closest('[data-mkl-cell]');
      if (!button || !board.contains(button)) return;
      event.preventDefault();
      handleCell(Number(button.dataset.mklCell));
    });
    board.addEventListener('pointerdown', event => {
      const button = event.target.closest('[data-mkl-cell]');
      if (!button || !board.contains(button) || event.button > 0) return;
      M.pointerStart = { index: Number(button.dataset.mklCell), x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    });
    board.addEventListener('pointerup', event => {
      const button = event.target.closest('[data-mkl-cell]');
      if (!button || !board.contains(button)) { M.pointerStart = null; return; }
      handleSwipe(event, Number(button.dataset.mklCell));
    });
    board.addEventListener('pointercancel', () => { M.pointerStart = null; });
  }

  function renderBoard() {
    const board = M.shell?.querySelector('[data-mkl-board]');
    if (!board) return;
    if (board.children.length !== CELL_COUNT) {
      board.innerHTML = M.board.map(cellHtml).join('');
    } else {
      for (let index = 0; index < CELL_COUNT; index += 1) {
        syncCellElement(board.children[index], M.board[index], index);
      }
    }
    bindBoardEvents(board);
  }

  function handleSwipe(event, index) {
    if (!M.pointerStart || M.pointerStart.index !== index || M.busy) { M.pointerStart = null; return; }
    const dx = event.clientX - M.pointerStart.x;
    const dy = event.clientY - M.pointerStart.y;
    M.pointerStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
    const r = rowOf(index), c = colOf(index);
    let target = -1;
    if (Math.abs(dx) > Math.abs(dy)) target = inside(r, c + (dx > 0 ? 1 : -1)) ? indexOf(r, c + (dx > 0 ? 1 : -1)) : -1;
    else target = inside(r + (dy > 0 ? 1 : -1), c) ? indexOf(r + (dy > 0 ? 1 : -1), c) : -1;
    if (target >= 0) attemptSwap(index, target);
  }

  function bindGame() {
    M.shell.querySelector('[data-mkl-game-menu]')?.addEventListener('click', showGameMenu);
    M.shell.querySelectorAll('[data-mkl-booster]').forEach(button => button.addEventListener('click', () => activateBooster(button.dataset.mklBooster)));
  }

  function updateHud() {
    const moves = M.shell?.querySelector('[data-mkl-moves]');
    const score = M.shell?.querySelector('[data-mkl-score]');
    if (moves) moves.textContent = M.moves;
    if (score) score.textContent = M.score.toLocaleString('de-DE');
    const goals = M.shell?.querySelector('[data-mkl-goals]');
    if (goals) goals.innerHTML = M.goals.map(goal => {
      const progress = Math.min(goal.target, goal.current);
      return `<div class="mkl-live-goal"><i>${goalIcon(goal)}</i><span><b style="width:${clamp(progress / goal.target * 100, 0, 100)}%"></b></span><strong>${progress}/${goal.target}</strong></div>`;
    }).join('');
    Object.keys(BOOSTERS).forEach(id => {
      const el = M.shell?.querySelector(`[data-mkl-count-${id}]`);
      if (el) el.textContent = M.save.boosters[id] || 0;
    });
    M.shell?.querySelectorAll('[data-mkl-booster]').forEach(button => button.classList.toggle('active', button.dataset.mklBooster === M.activeBooster));
  }

  function handleCell(index) {
    if (M.busy) return;
    if (M.activeBooster) return applyTargetBooster(index);
    const cell = M.board[index];
    if (!cell?.piece || isSolid(cell)) return;
    if (M.selected < 0) {
      M.selected = index; renderBoard(); playTone(330, .05); return;
    }
    if (M.selected === index) { M.selected = -1; renderBoard(); return; }
    if (!adjacent(M.selected, index)) {
      M.selected = index; renderBoard(); return;
    }
    const from = M.selected;
    M.selected = -1;
    attemptSwap(from, index);
  }

  async function attemptSwap(a, b) {
    if (M.busy || !adjacent(a, b) || isSolid(M.board[a]) || isSolid(M.board[b])) return;
    M.busy = true;
    swapCells(a, b);
    renderBoard();
    playTone(420, .05);
    await delay(160);

    const specialA = M.board[a]?.special;
    const specialB = M.board[b]?.special;
    const colorCombo = specialA === 'color' || specialB === 'color';
    const specialCombo = specialA && specialB;
    let groups = findMatches();

    if (!groups.length && !colorCombo && !specialCombo) {
      swapCells(a, b);
      renderBoard();
      const cells = M.shell.querySelectorAll('[data-mkl-cell]');
      cells[a]?.classList.add('invalid'); cells[b]?.classList.add('invalid');
      playTone(120, .12);
      await delay(300);
      M.busy = false;
      return;
    }

    M.moves -= 1;
    M.combo = 0;
    if (colorCombo) await resolveColorSwap(a, b);
    else if (specialCombo) await resolveSpecialCombo(a, b);
    else await resolveCascades(groups, [a, b]);

    if (M.level.conveyor && M.moves > 0 && !goalsComplete()) await moveConveyors();
    if (M.level.slime && M.moves > 0 && !goalsComplete()) spreadSlime();
    updateHud(); save();

    if (goalsComplete()) await winLevel();
    else if (M.moves <= 0) loseLevel();
    else {
      if (!hasValidMove()) { reshuffleBoard(); await delay(420); }
      M.busy = false;
      if (M.save.settings.hints) setTimer(showHint, 5500);
    }
  }

  async function resolveColorSwap(a, b) {
    const colorIndex = M.board[a].special === 'color' ? a : b;
    const otherIndex = colorIndex === a ? b : a;
    const bothColor = M.board[a].special === 'color' && M.board[b].special === 'color';
    const type = M.board[otherIndex].piece;
    const targets = new Set();
    M.board.forEach((cell, i) => {
      if (bothColor ? cell.piece || isSolid(cell) : cell.piece === type) targets.add(i);
    });
    targets.add(colorIndex);
    M.stats.specials += bothColor ? 2 : 1;
    await clearIndices(targets, new Map());
    await afterClearCycle();
    await resolveCascades(findMatches(), []);
  }

  async function resolveSpecialCombo(a, b) {
    const first = M.board[a].special;
    const second = M.board[b].special;
    const targets = new Set([a, b]);
    if (first === 'color' || second === 'color') return resolveColorSwap(a, b);
    if (first === 'bomb' && second === 'bomb') {
      const center = b;
      for (let r = rowOf(center) - 2; r <= rowOf(center) + 2; r += 1) for (let c = colOf(center) - 2; c <= colOf(center) + 2; c += 1) if (inside(r, c)) targets.add(indexOf(r, c));
    } else if ((first === 'row' && second === 'col') || (first === 'col' && second === 'row')) {
      for (let i = 0; i < COLS; i += 1) targets.add(indexOf(rowOf(b), i));
      for (let i = 0; i < ROWS; i += 1) targets.add(indexOf(i, colOf(b)));
    } else if (first === 'bomb' || second === 'bomb') {
      const center = first === 'bomb' ? a : b;
      for (let r = rowOf(center) - 1; r <= rowOf(center) + 1; r += 1) for (let c = 0; c < COLS; c += 1) if (inside(r, c)) targets.add(indexOf(r, c));
      for (let c = colOf(center) - 1; c <= colOf(center) + 1; c += 1) for (let r = 0; r < ROWS; r += 1) if (inside(r, c)) targets.add(indexOf(r, c));
    } else {
      [a, b].forEach(index => addSpecialTargets(index, targets));
    }
    M.stats.specials += 2;
    await clearIndices(targets, new Map());
    await afterClearCycle();
    await resolveCascades(findMatches(), []);
  }

  function specialCreation(groups, swapped) {
    const create = new Map();
    const membership = new Map();
    groups.forEach(group => group.indices.forEach(index => membership.set(index, (membership.get(index) || 0) + 1)));
    const intersections = [...membership.entries()].filter(([, count]) => count > 1).map(([index]) => index);
    intersections.forEach(index => create.set(index, 'bomb'));

    groups.forEach(group => {
      if (group.indices.some(index => create.has(index))) return;
      let at = swapped.find(index => group.indices.includes(index));
      if (at == null) at = group.indices[Math.floor(group.indices.length / 2)];
      if (group.indices.length >= 5) create.set(at, 'color');
      else if (group.indices.length === 4) create.set(at, group.orientation === 'row' ? 'row' : 'col');
    });
    return create;
  }

  async function resolveCascades(initialGroups, swapped) {
    let groups = initialGroups;
    while (groups.length) {
      M.combo += 1;
      M.stats.largestCombo = Math.max(M.stats.largestCombo, M.combo);
      const creation = specialCreation(groups, swapped);
      const targets = new Set(groups.flatMap(group => group.indices));
      creation.forEach((special, index) => targets.delete(index));
      await clearIndices(targets, creation);
      await afterClearCycle();
      if (M.combo >= 2) showCombo(M.combo);
      groups = findMatches();
      swapped = [];
    }
  }

  function addSpecialTargets(index, targets, visited = new Set()) {
    if (visited.has(index)) return;
    visited.add(index);
    const cell = M.board[index];
    if (!cell?.special) return;
    M.stats.specials += 1;
    progressGoal('boss', 'boss', 1);
    if (cell.special === 'row') for (let col = 0; col < COLS; col += 1) targets.add(indexOf(rowOf(index), col));
    if (cell.special === 'col') for (let row = 0; row < ROWS; row += 1) targets.add(indexOf(row, colOf(index)));
    if (cell.special === 'bomb') for (let row = rowOf(index) - 1; row <= rowOf(index) + 1; row += 1) for (let col = colOf(index) - 1; col <= colOf(index) + 1; col += 1) if (inside(row, col)) targets.add(indexOf(row, col));
    if (cell.special === 'color') {
      const type = cell.piece || pick(PIECES.slice(0, M.level.colors)).id;
      M.board.forEach((other, i) => { if (other.piece === type) targets.add(i); });
    }
  }

  async function clearIndices(targetSet, creation = new Map()) {
    const targets = new Set(targetSet);
    const expanded = new Set();
    let changed = true;
    while (changed) {
      changed = false;
      [...targets].forEach(index => {
        if (expanded.has(index)) return;
        expanded.add(index);
        const before = targets.size;
        addSpecialTargets(index, targets);
        if (targets.size > before) changed = true;
      });
    }
    const adjacentSolids = new Set();
    targets.forEach(index => {
      const r = rowOf(index), c = colOf(index);
      [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].forEach(([rr,cc]) => { if (inside(rr,cc) && isSolid(M.board[indexOf(rr,cc)])) adjacentSolids.add(indexOf(rr,cc)); });
    });
    adjacentSolids.forEach(index => targets.add(index));

    const elements = M.shell?.querySelectorAll('[data-mkl-cell]');
    targets.forEach(index => elements?.[index]?.classList.add('clearing'));
    spawnParticles([...targets]);
    playClearTone(M.combo);
    await delay(270);

    let removed = 0;
    targets.forEach(index => {
      const cell = M.board[index];
      if (!cell) return;
      if (cell.blocker) {
        cell.hp -= 1;
        if (cell.hp <= 0) {
          progressGoal('blocker', cell.blocker, 1);
          cell.blocker = '';
          cell.hp = 0;
          if (!cell.piece) cell.piece = randomPieceType(M.level.colors);
        }
        if (cell.blocker && isSolid(cell)) return;
      }
      if (cell.piece) {
        progressGoal('collect', cell.piece, 1);
        M.stats.pieces += 1;
        M.save.total.pieces += 1;
        removed += 1;
        cell.piece = '';
        cell.special = '';
        // Lieferpakete bleiben auf dem Feld und fallen nach der Explosion weiter nach unten.
      }
    });

    creation.forEach((special, index) => {
      const cell = M.board[index];
      if (!cell || isSolid(cell)) return;
      if (!cell.piece) cell.piece = randomPieceType(M.level.colors);
      cell.special = special;
      M.stats.specials += 1;
      M.save.total.specials += 1;
      progressGoal('boss', 'boss', 1);
    });

    const gained = removed * (55 + M.combo * 18) + creation.size * 350;
    M.score += gained;
    M.save.total.score += gained;
    progressGoal('score', 'score', gained);
    updateDailyProgress('pieces', removed);
    updateDailyProgress('specials', creation.size);
    updateHud();
  }

  async function afterClearCycle() {
    applyGravity();
    renderBoard();
    M.shell?.querySelectorAll('[data-mkl-cell]').forEach(cell => cell.classList.add('falling'));
    await delay(310);
    deliverIngredients();
    updateHud();
  }

  function applyGravity() {
    for (let col = 0; col < COLS; col += 1) {
      let segmentBottom = ROWS - 1;
      while (segmentBottom >= 0) {
        while (segmentBottom >= 0 && isSolid(M.board[indexOf(segmentBottom, col)])) segmentBottom -= 1;
        if (segmentBottom < 0) break;
        let segmentTop = segmentBottom;
        while (segmentTop - 1 >= 0 && !isSolid(M.board[indexOf(segmentTop - 1, col)])) segmentTop -= 1;
        const content = [];
        for (let row = segmentBottom; row >= segmentTop; row -= 1) {
          const cell = M.board[indexOf(row, col)];
          if (cell.piece || cell.ingredient) content.push({ piece: cell.piece || randomPieceType(M.level.colors), special: cell.special, ingredient: cell.ingredient });
          cell.piece = ''; cell.special = ''; cell.ingredient = false;
        }
        let cursor = 0;
        for (let row = segmentBottom; row >= segmentTop; row -= 1) {
          const cell = M.board[indexOf(row, col)];
          const item = content[cursor++] || { piece: randomPieceType(M.level.colors), special: '', ingredient: false };
          cell.piece = item.piece; cell.special = item.special; cell.ingredient = item.ingredient;
        }
        segmentBottom = segmentTop - 1;
      }
    }
  }

  function deliverIngredients() {
    for (let col = 0; col < COLS; col += 1) {
      for (let row = ROWS - 1; row >= 0; row -= 1) {
        const cell = M.board[indexOf(row, col)];
        if (!cell.ingredient) continue;
        if (row === ROWS - 1 || (row + 1 < ROWS && isSolid(M.board[indexOf(row + 1, col)]))) {
          cell.ingredient = false;
          progressGoal('delivery', 'delivery', 1);
          M.score += 600;
          toast('Paket geliefert!', 'Die Straßenbahn-Lieferung ist angekommen.');
        }
      }
    }
  }

  function progressGoal(kind, key, amount) {
    M.goals.forEach(goal => {
      if (goal.kind === kind && goal.key === key) goal.current = Math.min(goal.target, goal.current + amount);
    });
  }

  function goalsComplete() { return M.goals.every(goal => goal.current >= goal.target); }

  async function moveConveyors() {
    const rows = [2, 5];
    rows.forEach((row, rowIndex) => {
      const indices = Array.from({ length: COLS }, (_, col) => indexOf(row, col)).filter(index => !isSolid(M.board[index]));
      if (indices.length < 2) return;
      const cells = indices.map(index => cloneCell(M.board[index]));
      if (rowIndex % 2 === 0) cells.unshift(cells.pop()); else cells.push(cells.shift());
      indices.forEach((index, i) => { M.board[index] = cells[i]; });
    });
    renderBoard();
    toast('Förderband bewegt', 'Die Spielsteine wurden seitlich verschoben.');
    await delay(350);
    const groups = findMatches();
    if (groups.length) await resolveCascades(groups, []);
  }

  function spreadSlime() {
    const slimeCells = M.board.map((cell, index) => cell.blocker === 'slime' ? index : -1).filter(index => index >= 0);
    if (!slimeCells.length || Math.random() > .58) return;
    const source = pick(slimeCells);
    const r = rowOf(source), c = colOf(source);
    const candidates = [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].filter(([rr,cc]) => inside(rr,cc)).map(([rr,cc]) => indexOf(rr,cc)).filter(index => !M.board[index].blocker);
    if (!candidates.length) return;
    const target = pick(candidates);
    M.board[target].blocker = 'slime';
    M.board[target].hp = 1;
    const goal = M.goals.find(item => item.kind === 'blocker' && item.key === 'slime');
    if (goal) goal.target += 1;
    renderBoard(); updateHud();
    toast('Wasser breitet sich aus', 'Entferne die grünen Felder schnell.');
  }

  function activateBooster(id) {
    if (M.busy) return;
    if ((M.save.boosters[id] || 0) <= 0) return toast('Kein Booster vorhanden', 'Besuche den Booster-Shop.');
    if (id === 'shuffle') {
      M.save.boosters.shuffle -= 1; M.stats.boosters += 1; reshuffleBoard(); updateHud(); save(); return;
    }
    if (id === 'moves') {
      M.save.boosters.moves -= 1; M.moves += 5; M.stats.boosters += 1; updateHud(); save(); toast('+5 Züge', 'Du hast fünf zusätzliche Züge erhalten.'); return;
    }
    M.activeBooster = M.activeBooster === id ? '' : id;
    updateHud();
    if (M.activeBooster) toast(BOOSTERS[id].name, 'Berühre jetzt ein Feld auf dem Spielfeld.');
  }

  async function applyTargetBooster(index) {
    const id = M.activeBooster;
    if (!id || M.busy || (M.save.boosters[id] || 0) <= 0) return;
    M.activeBooster = '';
    M.save.boosters[id] -= 1;
    M.stats.boosters += 1;
    M.busy = true;
    const targets = new Set();
    if (id === 'hammer') targets.add(index);
    if (id === 'row') for (let col = 0; col < COLS; col += 1) targets.add(indexOf(rowOf(index), col));
    if (id === 'col') for (let row = 0; row < ROWS; row += 1) targets.add(indexOf(row, colOf(index)));
    if (id === 'bomb') for (let row = rowOf(index) - 1; row <= rowOf(index) + 1; row += 1) for (let col = colOf(index) - 1; col <= colOf(index) + 1; col += 1) if (inside(row, col)) targets.add(indexOf(row, col));
    M.combo = 1;
    await clearIndices(targets, new Map());
    await afterClearCycle();
    await resolveCascades(findMatches(), []);
    updateHud(); save();
    if (goalsComplete()) await winLevel(); else { M.busy = false; }
  }

  function showHint() {
    if (M.busy || M.selected >= 0 || !M.shell?.querySelector('[data-mkl-board]')) return;
    for (let i = 0; i < CELL_COUNT; i += 1) {
      for (const next of [i + 1, i + COLS]) {
        if (next >= CELL_COUNT || !adjacent(i, next) || isSolid(M.board[i]) || isSolid(M.board[next]) || !M.board[i].piece || !M.board[next].piece) continue;
        swapCells(i, next);
        const valid = findMatches().length > 0 || M.board[i].special === 'color' || M.board[next].special === 'color';
        swapCells(i, next);
        if (valid) {
          const cells = M.shell.querySelectorAll('[data-mkl-cell]');
          cells[i]?.classList.add('hint'); cells[next]?.classList.add('hint');
          setTimer(() => { cells[i]?.classList.remove('hint'); cells[next]?.classList.remove('hint'); }, 1800);
          return;
        }
      }
    }
  }

  function showCombo(count) {
    const wrap = M.shell?.querySelector('.mkl-board-wrap');
    if (!wrap) return;
    const label = count >= 5 ? 'MEGA KOMBO!' : count >= 4 ? 'SUPER KOMBO!' : count >= 3 ? 'STARKE KOMBO!' : 'KOMBO!';
    const el = document.createElement('div');
    el.className = 'mkl-combo'; el.textContent = `${label} ×${count}`;
    wrap.append(el); setTimer(() => el.remove(), 900);
    M.save.total.combos += 1;
  }

  function spawnParticles(indices) {
    const layer = M.shell?.querySelector('[data-mkl-particles]');
    if (!layer) return;
    const rect = layer.getBoundingClientRect();
    indices.slice(0, 24).forEach(index => {
      const row = rowOf(index), col = colOf(index);
      const x = (col + .5) / COLS * rect.width;
      const y = (row + .5) / ROWS * rect.height;
      for (let i = 0; i < 3; i += 1) {
        const particle = document.createElement('i');
        particle.className = 'mkl-particle';
        particle.style.left = `${x}px`; particle.style.top = `${y}px`;
        particle.style.setProperty('--x', `${(Math.random() - .5) * 75}px`);
        particle.style.setProperty('--y', `${(Math.random() - .5) * 75}px`);
        particle.style.setProperty('--c', ['#6feeff','#ffe264','#ff72cb','#7cf3a5'][rand(4)]);
        layer.append(particle); setTimer(() => particle.remove(), 700);
      }
    });
  }

  function flashBoard() {
    const wrap = M.shell?.querySelector('.mkl-board-wrap');
    if (!wrap) return;
    const flash = document.createElement('div'); flash.className = 'mkl-board-flash'; wrap.append(flash); setTimer(() => flash.remove(), 450);
  }

  function calculateStars() {
    let stars = 1;
    if (M.score >= M.level.starThresholds[1] || M.moves >= 5) stars = 2;
    if (M.score >= M.level.starThresholds[2] || M.moves >= 10) stars = 3;
    return stars;
  }

  async function winLevel() {
    M.busy = true;
    const bonus = Math.max(0, M.moves) * 180;
    M.score += bonus;
    const stars = calculateStars();
    const oldStars = Number(M.save.stars[M.level.number] || 0);
    M.save.stars[M.level.number] = Math.max(oldStars, stars);
    M.save.scores[M.level.number] = Math.max(Number(M.save.scores[M.level.number] || 0), M.score);
    M.save.unlockedLevel = Math.min(MAX_LEVEL, Math.max(M.save.unlockedLevel, M.level.number + 1));
    M.save.lastLevel = Math.min(MAX_LEVEL, M.level.number + 1);
    const reward = 45 + stars * 25 + Math.floor(M.level.number / 5) * 5;
    M.save.coins += reward;
    M.save.total.levels += 1;
    M.save.event.points += stars * 100 + Math.floor(M.score / 100);
    updateDailyProgress('levels', 1);
    if (M.level.number % 5 === 0) M.save.boosters.hammer += 1;
    save();
    playWinSound(); flashBoard(); await delay(500);
    showModal(`<div class="mkl-result-stars">${[1,2,3].map(star => `<span class="${star <= stars ? 'on' : ''}">★</span>`).join('')}</div><small class="mkl-kicker">LEVEL ${M.level.number} GESCHAFFT</small><h2>Starke Runde!</h2><div class="mkl-result-score">${M.score.toLocaleString('de-DE')} Punkte</div><div class="mkl-stats-grid"><div class="mkl-stat"><small>Belohnung</small><b>🪙 ${reward}</b></div><div class="mkl-stat"><small>Restzüge</small><b>${M.moves}</b></div><div class="mkl-stat"><small>Beste Kombo</small><b>×${M.stats.largestCombo || 1}</b></div></div><div class="mkl-modal-actions"><button type="button" class="mkl-primary" data-mkl-next-level>${M.level.number < MAX_LEVEL ? `Level ${M.level.number + 1}` : 'Levelkarte'}</button><button type="button" class="mkl-secondary" data-mkl-map-after>Levelkarte</button><button type="button" class="mkl-secondary" data-mkl-home-after>Hauptmenü</button></div>`, true);
    M.modal.querySelector('[data-mkl-next-level]')?.addEventListener('click', () => { closeModal(); M.level.number < MAX_LEVEL ? renderPreLevel(M.level.number + 1) : renderMap(); });
    M.modal.querySelector('[data-mkl-map-after]')?.addEventListener('click', () => { closeModal(); renderMap(); });
    M.modal.querySelector('[data-mkl-home-after]')?.addEventListener('click', () => { closeModal(); renderHome(); });
  }

  function loseLevel() {
    M.busy = true;
    M.save.lives = Math.max(0, M.save.lives - 1);
    if (M.save.lives === MAX_LIVES - 1) M.save.lifeAnchor = Date.now();
    save();
    playTone(100, .45);
    showModal(`<div style="text-align:center;font-size:58px">💔</div><small class="mkl-kicker">KEINE ZÜGE MEHR</small><h2>Fast geschafft</h2><p>Du kannst das Level erneut versuchen oder mit einem +5-Züge-Booster weiterspielen.</p><div class="mkl-stats-grid"><div class="mkl-stat"><small>Punkte</small><b>${M.score.toLocaleString('de-DE')}</b></div><div class="mkl-stat"><small>Leben</small><b>${M.save.lives}/${MAX_LIVES}</b></div><div class="mkl-stat"><small>+5 Züge</small><b>${M.save.boosters.moves}</b></div></div><div class="mkl-modal-actions">${M.save.boosters.moves > 0 ? '<button type="button" class="mkl-primary" data-mkl-continue-moves>+5 Züge benutzen</button>' : ''}<button type="button" class="mkl-secondary" data-mkl-retry>Erneut versuchen</button><button type="button" class="mkl-secondary" data-mkl-map-after>Levelkarte</button></div>`, true);
    M.modal.querySelector('[data-mkl-continue-moves]')?.addEventListener('click', () => { M.save.boosters.moves -= 1; M.moves = 5; M.busy = false; closeModal(); updateHud(); save(); });
    M.modal.querySelector('[data-mkl-retry]')?.addEventListener('click', () => { closeModal(); renderPreLevel(M.level.number); });
    M.modal.querySelector('[data-mkl-map-after]')?.addEventListener('click', () => { closeModal(); renderMap(); });
  }

  function showNoLives() {
    showModal(`<div style="text-align:center;font-size:58px">❤️</div><small class="mkl-kicker">LEBEN LADEN SICH AUF</small><h2>Keine Herzen verfügbar</h2><p>In ${lifeText()} erhältst du automatisch ein neues Herz. Im Booster-Shop kannst du außerdem alle Leben auffüllen.</p><div class="mkl-modal-actions"><button type="button" class="mkl-primary" data-mkl-shop-modal>Zum Shop</button><button type="button" class="mkl-secondary" data-mkl-modal-close>Schließen</button></div>`);
    M.modal.querySelector('[data-mkl-shop-modal]')?.addEventListener('click', () => { closeModal(); renderShop(); });
  }

  function abandonCurrentLevel(destination) {
    closeModal();
    M.selected = -1;
    M.activeBooster = '';
    M.busy = false;
    M.pointerStart = null;
    if (destination === 'topgames') returnToTopGames();
    else renderMap();
  }

  function showGameMenu() {
    if (M.busy) return;
    M.busy = true;
    showModal(`<small class="mkl-kicker">AKTUELLES LEVEL</small><h2>Spiel wirklich verlassen?</h2><p>Wenn du das Level jetzt verlässt, geht der Fortschritt dieser Runde verloren. Beim nächsten Start musst du das Level vollständig von vorne spielen.</p><div class="mkl-exit-warning">⚠️ Züge, Punkte und aktuelle Kombinationen werden nicht gespeichert.</div><div class="mkl-modal-actions"><button type="button" class="mkl-primary" data-mkl-resume>Nein, weiterspielen</button><button type="button" class="mkl-secondary" data-mkl-restart>Level neu starten</button><button type="button" class="mkl-secondary" data-mkl-map-quit>Ja, zur Levelkarte</button><button type="button" class="mkl-danger" data-mkl-topgames>Ja, zu Top Games</button></div>`, true);
    M.modal.querySelector('[data-mkl-resume]')?.addEventListener('click', () => { closeModal(); M.busy = false; });
    M.modal.querySelector('[data-mkl-restart]')?.addEventListener('click', () => { closeModal(); M.busy = false; startLevel(M.level.number); });
    M.modal.querySelector('[data-mkl-map-quit]')?.addEventListener('click', () => abandonCurrentLevel('map'));
    M.modal.querySelector('[data-mkl-topgames]')?.addEventListener('click', () => abandonCurrentLevel('topgames'));
  }

  function showModal(html, locked = false) {
    if (!M.modal) return;
    M.modal.hidden = false;
    M.modal.innerHTML = `<section class="mkl-modal-card">${html}</section>`;
    if (!locked) M.modal.addEventListener('click', modalBackdropClose, { once: true });
    M.modal.querySelectorAll('[data-mkl-modal-close]').forEach(button => button.addEventListener('click', closeModal));
  }

  function modalBackdropClose(event) { if (event.target === M.modal) closeModal(); }
  function closeModal() { if (!M.modal) return; M.modal.hidden = true; M.modal.innerHTML = ''; }

  function toast(title, text = '') {
    if (!M.toast) return;
    M.toast.innerHTML = `<b>${escapeHtml(title)}</b><span>${escapeHtml(text)}</span>`;
    M.toast.classList.remove('show'); void M.toast.offsetWidth; M.toast.classList.add('show');
    setTimer(() => M.toast?.classList.remove('show'), 2500);
  }

  function updateDailyProgress(id, amount) {
    ensureDaily();
    const task = M.save.daily.tasks.find(item => item.id === id);
    if (task && !task.claimed) task.value = Math.min(task.target, task.value + amount);
  }

  function renderDaily() {
    ensureDaily();
    M.shell.innerHTML = `<main class="match-kl-screen"><div class="mkl-screen">${appbar('Tagesaufgaben', true)}<div class="mkl-page"><div class="mkl-section-title"><div><small class="mkl-kicker">JEDEN TAG NEU</small><h2>Deine Missionen</h2></div><p>Abgeschlossene Aufgaben geben dir Match Coins.</p></div><div class="mkl-daily-grid">${M.save.daily.tasks.map(task => `<article class="mkl-daily-task"><i style="font-style:normal;font-size:36px">🎯</i><b>${escapeHtml(task.label)}</b><small>${task.value} von ${task.target}</small><div class="mkl-task-progress"><i style="width:${clamp(task.value / task.target * 100,0,100)}%"></i></div><button type="button" class="${task.value >= task.target && !task.claimed ? 'mkl-primary' : 'mkl-secondary'}" data-mkl-claim-task="${task.id}" ${task.value >= task.target && !task.claimed ? '' : 'disabled'}>${task.claimed ? 'Abgeholt' : `🪙 ${task.reward} abholen`}</button></article>`).join('')}</div></div></div></main>`;
    bindCommon();
    M.shell.querySelectorAll('[data-mkl-claim-task]').forEach(button => button.addEventListener('click', () => {
      const task = M.save.daily.tasks.find(item => item.id === button.dataset.mklClaimTask);
      if (!task || task.claimed || task.value < task.target) return;
      task.claimed = true; M.save.coins += task.reward; save(); toast('Belohnung abgeholt', `${task.reward} Match Coins erhalten.`); renderDaily();
    }));
  }

  function renderProjects() {
    const stars = totalStars();
    M.shell.innerHTML = `<main class="match-kl-screen"><div class="mkl-screen">${appbar('Stadt restaurieren', true)}<div class="mkl-page"><div class="mkl-section-title"><div><small class="mkl-kicker">DEINE STERNE VERÄNDERN COTTBUS</small><h2>Restaurierungsprojekte</h2></div><p>${stars} Sterne insgesamt gesammelt.</p></div><div class="mkl-project-grid">${PROJECTS.map(project => {
      const done = M.save.projects.includes(project.id);
      return `<article class="mkl-project ${done ? 'done' : ''}"><i>${project.icon}</i><b>${escapeHtml(project.name)}</b><small>${escapeHtml(project.text)}</small><button type="button" class="${done ? 'mkl-secondary' : 'mkl-primary'}" data-mkl-project="${project.id}" ${done || stars < project.cost ? 'disabled' : ''}>${done ? 'Fertiggestellt' : `⭐ ${project.cost} benötigt`}</button></article>`;
    }).join('')}</div></div></div></main>`;
    bindCommon();
    M.shell.querySelectorAll('[data-mkl-project]').forEach(button => button.addEventListener('click', () => {
      const project = PROJECTS.find(item => item.id === button.dataset.mklProject);
      if (!project || M.save.projects.includes(project.id) || totalStars() < project.cost) return;
      M.save.projects.push(project.id); save(); playWinSound(); toast('Projekt fertiggestellt', project.name); renderProjects();
    }));
  }

  function renderShop() {
    const items = [
      { id: 'hammer', amount: 3, price: 120 }, { id: 'row', amount: 2, price: 150 }, { id: 'col', amount: 2, price: 150 },
      { id: 'bomb', amount: 2, price: 180 }, { id: 'shuffle', amount: 3, price: 110 }, { id: 'moves', amount: 2, price: 220 },
      { id: 'startBomb', amount: 2, price: 190 }, { id: 'startRocket', amount: 2, price: 190 }, { id: 'lives', amount: 5, price: 300 }
    ];
    M.shell.innerHTML = `<main class="match-kl-screen"><div class="mkl-screen">${appbar('Booster-Shop', true)}<div class="mkl-page"><div class="mkl-section-title"><div><small class="mkl-kicker">MATCH COINS AUSGEBEN</small><h2>Booster und Leben</h2></div><p>Alle Booster können auch durch Level und Tagesaufgaben verdient werden.</p></div><div class="mkl-shop-grid">${items.map(item => {
      const booster = item.id === 'lives' ? { name: 'Leben auffüllen', icon: '❤️', text: 'Füllt deine fünf Herzen vollständig auf.' } : BOOSTERS[item.id];
      return `<article class="mkl-shop-item"><i>${booster.icon}</i><b>${escapeHtml(booster.name)}</b><small>${escapeHtml(booster.text)}<br><strong>${item.id === 'lives' ? 'Alle Herzen' : `+${item.amount} Stück`}</strong></small><button type="button" class="mkl-primary" data-mkl-buy="${item.id}" data-price="${item.price}" data-amount="${item.amount}">🪙 ${item.price}</button></article>`;
    }).join('')}</div></div></div></main>`;
    bindCommon();
    M.shell.querySelectorAll('[data-mkl-buy]').forEach(button => button.addEventListener('click', () => {
      const price = Number(button.dataset.price); const amount = Number(button.dataset.amount); const id = button.dataset.mklBuy;
      if (M.save.coins < price) return toast('Nicht genug Match Coins', 'Spiele Level oder erledige Tagesaufgaben.');
      M.save.coins -= price;
      if (id === 'lives') { M.save.lives = MAX_LIVES; M.save.lifeAnchor = Date.now(); }
      else M.save.boosters[id] = (M.save.boosters[id] || 0) + amount;
      save(); playTone(660,.12); toast('Gekauft', id === 'lives' ? 'Alle Leben wurden aufgefüllt.' : `${BOOSTERS[id].name} +${amount}`); renderShop();
    }));
  }

  function renderEvent() {
    ensureWeeklyEvent();
    const points = M.save.event.points;
    const rank = points >= 8000 ? 1 : points >= 5000 ? 2 : points >= 2500 ? 3 : points >= 1000 ? 5 : 12;
    const next = [1000,2500,5000,8000].find(value => value > points) || 10000;
    M.shell.innerHTML = `<main class="match-kl-screen"><div class="mkl-screen">${appbar('Cottbus-Cup', true)}<div class="mkl-page"><section class="mkl-card mkl-hero" style="min-height:360px"><div class="mkl-hero-copy"><small class="mkl-kicker">WÖCHENTLICHES TURNIER · ${escapeHtml(M.save.event.week)}</small><h1 style="font-size:70px">Cottbus<span>-Cup</span></h1><p>Gewinne Level und sammle Turnierpunkte. Drei Sterne und hohe Punktzahlen geben besonders viele Punkte.</p><div class="mkl-stats-grid"><div class="mkl-stat"><small>Deine Punkte</small><b>${points.toLocaleString('de-DE')}</b></div><div class="mkl-stat"><small>Aktueller Rang</small><b>#${rank}</b></div><div class="mkl-stat"><small>Nächstes Ziel</small><b>${next.toLocaleString('de-DE')}</b></div></div><div class="mkl-hero-actions"><button type="button" class="mkl-primary" data-mkl-map>Level spielen</button></div></div><div class="mkl-hero-board"><div style="height:100%;display:grid;place-items:center;font-size:150px;filter:drop-shadow(0 0 30px #ffd64a)">🏆</div></div></section></div></div></main>`;
    bindCommon(); M.shell.querySelector('[data-mkl-map]')?.addEventListener('click', renderMap);
  }

  function renderRules() {
    M.shell.innerHTML = `<main class="match-kl-screen"><div class="mkl-screen">${appbar('Spielregeln', true)}<div class="mkl-page"><div class="mkl-section-title"><div><small class="mkl-kicker">ALLES AUF EINEN BLICK</small><h2>So funktioniert Match.KL</h2></div></div><div class="mkl-card" style="padding:24px"><div class="mkl-rules-list">
      <article><i>3️⃣</i><div><b>Drei gleiche Steine</b><small>Mindestens drei gleiche Cottbus-Steine in einer Reihe oder Spalte entfernen.</small></div></article>
      <article><i>↔️</i><div><b>Vier gleiche Steine</b><small>Erzeugt einen leuchtenden Linienstein für eine komplette Reihe oder Spalte.</small></div></article>
      <article><i>🌈</i><div><b>Fünf gleiche Steine</b><small>Erzeugt eine Farbbombe, die alle Steine einer Farbe entfernt.</small></div></article>
      <article><i>💥</i><div><b>L- oder T-Kombination</b><small>Erzeugt eine Flächenbombe. Zwei Spezialsteine können miteinander kombiniert werden.</small></div></article>
      <article><i>📦</i><div><b>Hindernisse und Lieferungen</b><small>Zerstöre Kisten, Eis, Beton, Graffiti und Ketten oder bringe Pakete nach unten.</small></div></article>
      <article><i>✨</i><div><b>Booster</b><small>Hammer, Reihen-, Spalten- und Bomben-Booster helfen in schwierigen Leveln.</small></div></article>
      <article><i>⭐</i><div><b>Sterne und Cottbus</b><small>Verdiene bis zu drei Sterne und verwende sie für Restaurierungsprojekte.</small></div></article>
    </div></div></div></div></main>`;
    bindCommon();
  }

  function claimDailyGift() {
    const today = dateKey();
    if (M.save.claimedDailyGift === today) return toast('Bereits abgeholt', 'Das nächste Geschenk ist morgen verfügbar.');
    const reward = 100 + rand(101);
    const boosterIds = ['hammer','shuffle','bomb','row','col'];
    const booster = pick(boosterIds);
    M.save.claimedDailyGift = today;
    M.save.coins += reward;
    M.save.boosters[booster] += 1;
    save();
    playWinSound();
    showModal(`<div style="text-align:center;font-size:70px">🎁</div><small class="mkl-kicker">TAGESGESCHENK</small><h2>Geschenk geöffnet!</h2><p>Du erhältst <b>${reward} Match Coins</b> und einen <b>${escapeHtml(BOOSTERS[booster].name)}</b>.</p><div class="mkl-modal-actions"><button type="button" class="mkl-primary" data-mkl-modal-close>Abholen</button></div>`);
  }

  function audioContext() {
    if (!M.save.settings.sound) return null;
    try {
      if (!M.audio) M.audio = new (window.AudioContext || window.webkitAudioContext)();
      if (M.audio.state === 'suspended') M.audio.resume();
      return M.audio;
    } catch { return null; }
  }

  function playTone(frequency, duration = .08, gain = .035) {
    const ctx = audioContext(); if (!ctx) return;
    const oscillator = ctx.createOscillator(); const volume = ctx.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = frequency;
    volume.gain.setValueAtTime(gain, ctx.currentTime); volume.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + duration);
    oscillator.connect(volume).connect(ctx.destination); oscillator.start(); oscillator.stop(ctx.currentTime + duration);
  }

  function playClearTone(combo) { playTone(420 + Math.min(combo, 6) * 85, .1, .04); }
  function playWinSound() { [520,660,780,1040].forEach((frequency, index) => setTimer(() => playTone(frequency,.18,.045), index * 95)); }

  window.MatchKL = Object.freeze({ open, close, returnToTopGames });
})();
