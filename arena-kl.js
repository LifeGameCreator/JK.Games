(() => {
  "use strict";

  const VERSION = "20260726-professional-v32";
  const WORLD_SIZE = 1000;
  const CANVAS_SIZE = 720;
  const VIEW_RADIUS = 350;
  const WIN_KILLS = 25;
  const PLAYER_RADIUS = 15;
  const ONLINE_REMOTE_STALE_MS = 12000;
  const ONLINE_SNAPSHOT_TIMEOUT_MS = 12000;
  const ONLINE_FIRST_SNAPSHOT_TIMEOUT_MS = 18000;
  const ONLINE_INPUT_ACTIVE_MS = 70;
  const ONLINE_INPUT_IDLE_MS = 420;
  const ONLINE_SNAPSHOT_ACTIVE_MS = 95;
  const ONLINE_SNAPSHOT_IDLE_MS = 190;
  const ONLINE_REMOTE_PREDICTION_MS = 260;
  const ONLINE_BULLET_GRACE_MS = 260;
  const CLOUDFLARE_INPUT_INTERVAL_MS = 50;
  const CLOUDFLARE_RECONNECT_LIMIT = 4;
  const MOBILE_RENDER_FPS = 50;
  const DESKTOP_RENDER_FPS = 60;
  const MOBILE_VISIBILITY_RAYS = 72;
  const DESKTOP_VISIBILITY_RAYS = 112;
  const COLORS = ["#77d6a4", "#ef6d67", "#73a9ff", "#f2c85d"];
  const BOT_NAMES = ["Viper", "Nova", "Rex"];
  const BOT_DIFFICULTIES = Object.freeze({
    easy: Object.freeze({ id: "easy", name: "Leicht", xp: 50, money: 1000, speed: 0.70, thinkMin: 720, thinkMax: 1180, sight: 330, aimError: 0.42, fireChance: 0.24, strafe: 0.18, chase: 0.72, healChance: 0.003 }),
    medium: Object.freeze({ id: "medium", name: "Mittel", xp: 70, money: 3000, speed: 0.94, thinkMin: 250, thinkMax: 450, sight: 525, aimError: 0.105, fireChance: 0.72, strafe: 0.43, chase: 0.94, healChance: 0.010 }),
    hard: Object.freeze({ id: "hard", name: "Schwer", xp: 100, money: 5000, speed: 1.16, thinkMin: 65, thinkMax: 135, sight: 760, aimError: 0.018, fireChance: 0.98, strafe: 0.72, chase: 1.10, healChance: 0.025 })
  });
  const EURO = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  const WEAPONS = [
    { id: "pistol", name: "Pistole", short: "Pistole", symbol: "⌖", start: 0, fireDelay: 340, damage: 34, bulletSpeed: 760, pellets: 1, spread: 0.025, range: 650, barrel: 24 },
    { id: "shotgun", name: "Schrotflinte", short: "Shotgun", symbol: "━", start: 4, fireDelay: 760, damage: 12, bulletSpeed: 690, pellets: 7, spread: 0.23, range: 390, barrel: 31 },
    { id: "smg", name: "Maschinenpistole", short: "SMG", symbol: "╾", start: 8, fireDelay: 105, damage: 12, bulletSpeed: 800, pellets: 1, spread: 0.075, range: 560, barrel: 28 },
    { id: "assault", name: "Sturmgewehr", short: "Sturmgewehr", symbol: "═", start: 12, fireDelay: 170, damage: 21, bulletSpeed: 900, pellets: 1, spread: 0.04, range: 720, barrel: 34 },
    { id: "machine", name: "Maschinengewehr", short: "MG", symbol: "▰", start: 16, fireDelay: 78, damage: 11, bulletSpeed: 850, pellets: 1, spread: 0.105, range: 650, barrel: 37 },
    { id: "sniper", name: "Scharfschützengewehr", short: "Sniper", symbol: "╼", start: 20, fireDelay: 900, damage: 96, bulletSpeed: 1250, pellets: 1, spread: 0.008, range: 1000, barrel: 43 },
    { id: "knife", name: "Kampfmesser", short: "Messer", symbol: "◆", start: 24, fireDelay: 520, damage: 120, bulletSpeed: 0, pellets: 0, spread: 0, range: 54, barrel: 22, melee: true }
  ];

  const LASERS = [
    { id: "red", name: "Rot", color: "#ff4d4d", price: 1500 },
    { id: "green", name: "Grün", color: "#65ff91", price: 2500 },
    { id: "blue", name: "Blau", color: "#55a8ff", price: 3500 },
    { id: "violet", name: "Violett", color: "#c86cff", price: 5000 },
    { id: "gold", name: "Gold", color: "#ffd66b", price: 8000 }
  ];

  const SUPPLIES = [
    { id: "bandage", name: "Verband", icon: "✚", price: 250, heal: 25, max: 8 },
    { id: "medipack", name: "Medipack", icon: "▣", price: 900, heal: 55, max: 5 }
  ];

  const MAPS = [
    {
      id: "warehouse", name: "Lagerhalle", subtitle: "Enge Wege und Kisten", floor: "#343630", wallTop: "#59644d", wallBottom: "#1b211c",
      spawns: [{ x: 510, y: 350 }, { x: 790, y: 500 }, { x: 560, y: 860 }, { x: 205, y: 560 }],
      walls: [
        { x: 120, y: 135, w: 230, h: 54 }, { x: 565, y: 135, w: 280, h: 54 }, { x: 428, y: 78, w: 56, h: 250 },
        { x: 170, y: 280, w: 205, h: 55 }, { x: 625, y: 270, w: 190, h: 55 }, { x: 110, y: 400, w: 60, h: 250 },
        { x: 275, y: 392, w: 245, h: 56 }, { x: 590, y: 392, w: 290, h: 56 }, { x: 470, y: 500, w: 58, h: 260 },
        { x: 160, y: 710, w: 260, h: 58 }, { x: 610, y: 700, w: 255, h: 58 }, { x: 700, y: 520, w: 58, h: 135 },
        { x: 245, y: 505, w: 58, h: 120 }, { x: 345, y: 820, w: 58, h: 105 }, { x: 610, y: 815, w: 58, h: 110 },
        { x: 835, y: 380, w: 55, h: 190 }
      ],
      crates: [{ x: 362, y: 102, s: 32 }, { x: 394, y: 102, s: 32 }, { x: 536, y: 207, s: 31 }, { x: 568, y: 207, s: 31 }, { x: 568, y: 239, s: 31 }, { x: 315, y: 652, s: 34 }, { x: 349, y: 652, s: 34 }, { x: 786, y: 650, s: 32 }, { x: 818, y: 650, s: 32 }]
    },
    {
      id: "subway", name: "U-Bahn-Depot", subtitle: "Lange Gleise, harte Ecken", floor: "#2d3033", wallTop: "#667079", wallBottom: "#24292d",
      spawns: [{ x: 150, y: 150 }, { x: 850, y: 150 }, { x: 850, y: 850 }, { x: 150, y: 850 }],
      walls: [
        { x: 250, y: 80, w: 54, h: 300 }, { x: 696, y: 80, w: 54, h: 300 }, { x: 250, y: 620, w: 54, h: 300 }, { x: 696, y: 620, w: 54, h: 300 },
        { x: 390, y: 160, w: 220, h: 52 }, { x: 390, y: 788, w: 220, h: 52 }, { x: 80, y: 430, w: 280, h: 54 }, { x: 640, y: 516, w: 280, h: 54 },
        { x: 440, y: 330, w: 120, h: 54 }, { x: 440, y: 616, w: 120, h: 54 }, { x: 360, y: 460, w: 280, h: 80 }
      ],
      crates: [{ x: 316, y: 112, s: 30 }, { x: 654, y: 856, s: 30 }, { x: 112, y: 494, s: 32 }, { x: 856, y: 474, s: 32 }]
    },
    {
      id: "harbor", name: "Containerhafen", subtitle: "Offene Flächen und Deckung", floor: "#30383a", wallTop: "#596c70", wallBottom: "#233034",
      spawns: [{ x: 135, y: 500 }, { x: 500, y: 130 }, { x: 865, y: 500 }, { x: 500, y: 870 }],
      walls: [
        { x: 170, y: 120, w: 230, h: 70 }, { x: 600, y: 120, w: 230, h: 70 }, { x: 170, y: 810, w: 230, h: 70 }, { x: 600, y: 810, w: 230, h: 70 },
        { x: 110, y: 285, w: 70, h: 250 }, { x: 820, y: 465, w: 70, h: 250 }, { x: 285, y: 285, w: 250, h: 70 }, { x: 465, y: 645, w: 250, h: 70 },
        { x: 390, y: 430, w: 220, h: 140 }, { x: 230, y: 520, w: 80, h: 210 }, { x: 690, y: 270, w: 80, h: 210 }
      ],
      crates: [{ x: 410, y: 375, s: 34 }, { x: 444, y: 375, s: 34 }, { x: 556, y: 590, s: 34 }, { x: 590, y: 590, s: 34 }, { x: 745, y: 735, s: 31 }]
    },
    {
      id: "clinic", name: "Klinik", subtitle: "Zimmer, Flure und Kreuzungen", floor: "#3b403f", wallTop: "#778785", wallBottom: "#293231",
      spawns: [{ x: 180, y: 180 }, { x: 820, y: 180 }, { x: 820, y: 820 }, { x: 180, y: 820 }],
      walls: [
        { x: 90, y: 300, w: 270, h: 48 }, { x: 640, y: 300, w: 270, h: 48 }, { x: 90, y: 652, w: 270, h: 48 }, { x: 640, y: 652, w: 270, h: 48 },
        { x: 300, y: 90, w: 48, h: 210 }, { x: 652, y: 90, w: 48, h: 210 }, { x: 300, y: 700, w: 48, h: 210 }, { x: 652, y: 700, w: 48, h: 210 },
        { x: 430, y: 350, w: 140, h: 300 }, { x: 350, y: 430, w: 80, h: 48 }, { x: 570, y: 522, w: 80, h: 48 }
      ],
      crates: [{ x: 120, y: 235, s: 28 }, { x: 852, y: 735, s: 28 }, { x: 735, y: 235, s: 28 }, { x: 235, y: 735, s: 28 }]
    },
    {
      id: "bunker", name: "Bunker", subtitle: "Viele Winkel, kurze Kämpfe", floor: "#2f312d", wallTop: "#686b5a", wallBottom: "#24261f",
      spawns: [{ x: 500, y: 130 }, { x: 870, y: 500 }, { x: 500, y: 870 }, { x: 130, y: 500 }],
      walls: [
        { x: 100, y: 100, w: 260, h: 55 }, { x: 640, y: 100, w: 260, h: 55 }, { x: 100, y: 845, w: 260, h: 55 }, { x: 640, y: 845, w: 260, h: 55 },
        { x: 100, y: 155, w: 55, h: 205 }, { x: 845, y: 155, w: 55, h: 205 }, { x: 100, y: 640, w: 55, h: 205 }, { x: 845, y: 640, w: 55, h: 205 },
        { x: 250, y: 250, w: 180, h: 55 }, { x: 570, y: 250, w: 180, h: 55 }, { x: 250, y: 695, w: 180, h: 55 }, { x: 570, y: 695, w: 180, h: 55 },
        { x: 250, y: 305, w: 55, h: 180 }, { x: 695, y: 515, w: 55, h: 180 }, { x: 430, y: 390, w: 140, h: 220 }, { x: 305, y: 515, w: 125, h: 55 }, { x: 570, y: 430, w: 125, h: 55 }
      ],
      crates: [{ x: 175, y: 175, s: 32 }, { x: 793, y: 175, s: 32 }, { x: 175, y: 793, s: 32 }, { x: 793, y: 793, s: 32 }, { x: 485, y: 330, s: 30 }]
    }
  ];

  let overlay = null;
  let session = null;
  let onlineLobby = null;
  let selectedMode = "bots";
  let selectedPlayers = 2;
  let selectedMapId = "warehouse";
  let selectedBotDifficulty = "easy";
  let rafId = 0;
  let lastFrame = 0;
  let keyboard = Object.create(null);
  let mouse = { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2, down: false, active: false };
  let resizeObserver = null;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const normalizeAngle = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));
  const escapeText = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  const botDifficultyConfig = (id = selectedBotDifficulty) => BOT_DIFFICULTIES[id] || BOT_DIFFICULTIES.easy;

  function getAppState() {
    try { return typeof state !== "undefined" && state ? state : null; } catch (_) { return null; }
  }

  function ensureArenaState() {
    const appState = getAppState();
    if (!appState) return { matches: 0, wins: 0, bestKills: 0, totalKills: 0, lasers: [], selectedLaser: "", bandages: 0, medipacks: 0 };
    appState.arenaKl ||= {};
    const data = appState.arenaKl;
    data.matches = Math.max(0, Number(data.matches) || 0);
    data.wins = Math.max(0, Number(data.wins) || 0);
    data.bestKills = Math.max(0, Number(data.bestKills) || 0);
    data.totalKills = Math.max(0, Number(data.totalKills) || 0);
    data.lasers = Array.isArray(data.lasers) ? [...new Set(data.lasers.filter((id) => LASERS.some((laser) => laser.id === id)))] : [];
    data.selectedLaser = data.lasers.includes(data.selectedLaser) ? data.selectedLaser : "";
    data.bandages = clamp(Math.floor(Number(data.bandages) || 0), 0, 99);
    data.medipacks = clamp(Math.floor(Number(data.medipacks) || 0), 0, 99);
    return data;
  }

  function safeSave() { try { if (typeof save === "function") save(); } catch (_) {} }
  function safeRender() { try { if (typeof render === "function") render(); } catch (_) {} }
  function safeFeed(text) { try { if (typeof addFeed === "function") addFeed(text); } catch (_) {} }
  function safeAddXp(amount, reason) { try { if (typeof addXp === "function") addXp(amount, reason); } catch (_) {} }
  function safeMood(amount, reason) { try { if (typeof improveMood === "function") improveMood(amount, reason); } catch (_) {} }
  function safeAwardMoney(amount, reason) {
    try {
      if (typeof awardGameWinMoney === "function") return awardGameWinMoney(amount, reason);
      const appState = getAppState();
      if (!appState) return 0;
      appState.bank = Math.max(0, Number(appState.bank) || 0) + Math.max(0, Math.round(Number(amount) || 0));
      safeFeed(`${reason}: ${EURO.format(amount)} Siegprämie ausgezahlt.`);
      return amount;
    } catch (_) { return 0; }
  }

  function playerFunds() {
    const appState = getAppState();
    return Math.max(0, Number(appState?.cash) || 0) + Math.max(0, Number(appState?.bank) || 0);
  }

  function payArena(price, label) {
    const amount = Math.max(0, Math.round(Number(price) || 0));
    if (!amount) return true;
    try {
      if (typeof pay === "function") {
        const ok = pay(amount, false, { target: "treasury", taxRate: 0, awardXp: false });
        if (!ok) return false;
      } else {
        const appState = getAppState();
        if (!appState || playerFunds() < amount) return false;
        let remaining = amount;
        const fromBank = Math.min(remaining, Math.max(0, Number(appState.bank) || 0));
        appState.bank -= fromBank;
        remaining -= fromBank;
        appState.cash = Math.max(0, (Number(appState.cash) || 0) - remaining);
      }
      safeFeed(`Arena.KL Shop: ${label} für ${EURO.format(amount)} gekauft.`);
      safeSave();
      return true;
    } catch (error) {
      console.error("Arena.KL Zahlung", error);
      return false;
    }
  }

  function currentMap() { return MAPS.find((map) => map.id === selectedMapId) || MAPS[0]; }
  function mapById(id) { return MAPS.find((map) => map.id === id) || MAPS[0]; }
  function weaponIndexForKills(kills) { let result = 0; for (let i = 0; i < WEAPONS.length; i += 1) if (kills >= WEAPONS[i].start) result = i; return result; }
  function weaponFor(player) { return WEAPONS[weaponIndexForKills(player.kills)]; }
  function playerName() { const appState = getAppState(); return String(appState?.firstName || "Du").slice(0, 18); }
  function selectedLaserColor() { const data = ensureArenaState(); return LASERS.find((laser) => laser.id === data.selectedLaser)?.color || ""; }

  function open() {
    close(false, true);
    try { if (typeof prepareGameOverlay === "function") prepareGameOverlay(); } catch (_) {}
    ensureArenaState();
    selectedMode = "bots";
    selectedPlayers = 2;
    selectedMapId = "warehouse";
    overlay = document.createElement("div");
    overlay.className = "arena-kl-modal";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Arena.KL");
    overlay.innerHTML = shellHtml();
    document.body.appendChild(overlay);
    document.body.classList.add("arena-kl-open");
    bindShellEvents();
    showMenu();
  }

  function shellHtml() {
    const stats = ensureArenaState();
    return `
      <section class="arena-kl-shell" data-arena-shell>
        <header class="arena-kl-head">
          <button class="arena-kl-icon-button" type="button" data-arena-back title="Zurück">‹</button>
          <div class="arena-kl-title"><small>TOP-DOWN WEAPON GAME</small><h2>ARENA<span>.KL</span></h2></div>
          <div class="arena-kl-head-actions">
            <button class="arena-kl-icon-button arena-kl-shop-button" type="button" data-arena-shop title="Shop">🛒</button>
            <button class="arena-kl-icon-button" type="button" data-arena-info title="Information">i</button>
            <button class="arena-kl-icon-button" type="button" data-arena-pause title="Pause" hidden>Ⅱ</button>
            <button class="arena-kl-icon-button arena-kl-close-button" type="button" data-arena-close title="Spiel beenden">×</button>
          </div>
        </header>
        <main class="arena-kl-main">
          <section class="arena-kl-menu" data-arena-menu>
            <article class="arena-kl-menu-hero"><div class="arena-kl-menu-emblem">⌖</div><div><h3>Waffenleiter im Sichtschatten</h3><p>Spiele sofort gegen Bots oder eröffne einen öffentlichen beziehungsweise privaten Online-Raum. Freie Plätze können mit Bots gefüllt werden.</p></div></article>
            <section class="arena-kl-mode-box arena-kl-connection-box"><small>SPIELMODUS</small><div class="arena-kl-connection-options" role="group" aria-label="Spielmodus auswählen">
              <button class="arena-kl-connection-option active" type="button" data-arena-mode="bots" aria-pressed="true"><i class="arena-kl-mode-check" aria-hidden="true">✓</i><b>BOT-LOBBY</b><span>Sofort gegen Computergegner</span></button>
              <button class="arena-kl-connection-option" type="button" data-arena-mode="online" aria-pressed="false"><i class="arena-kl-mode-check" aria-hidden="true">✓</i><b>ONLINE</b><span>Öffentliche oder private Räume mit echten Spielern</span></button>
            </div><p class="arena-kl-mode-note" data-arena-mode-note>Bot-Lobby ausgewählt · startet sofort.</p></section>
            <section class="arena-kl-mode-box"><small>TEILNEHMER</small><div class="arena-kl-player-options">${[2, 3, 4].map((count) => `<button class="arena-kl-player-option ${count === 2 ? "active" : ""}" type="button" data-arena-players="${count}"><b>${count}</b><span>${count === 2 ? "Duell" : count === 3 ? "Dreikampf" : "Vierkampf"}</span></button>`).join("")}</div></section>
            <section class="arena-kl-mode-box arena-kl-difficulty-box"><small data-arena-difficulty-title>BOT-SCHWIERIGKEIT</small><div class="arena-kl-difficulty-options">${Object.values(BOT_DIFFICULTIES).map((level) => `<button class="arena-kl-difficulty-option ${level.id === "easy" ? "active" : ""}" type="button" data-arena-difficulty="${level.id}"><b>${level.name}</b><span>${level.id === "easy" ? "Sehr langsame und ungenaue Bots" : level.id === "medium" ? "Deutlich stärker, aber fair besiegbar" : "Extrem schnelle Reaktion und Präzision"}</span><em>${level.xp} EP · ${EURO.format(level.money)}</em></button>`).join("")}</div><p class="arena-kl-difficulty-note" data-arena-difficulty-note>Belohnung bei Bot-Sieg: 50 EP und ${EURO.format(1000)}.</p></section>
            <section class="arena-kl-mode-box"><small>MAP AUSWÄHLEN</small><div class="arena-kl-map-options">${MAPS.map((map, index) => `<button class="arena-kl-map-option ${index === 0 ? "active" : ""}" type="button" data-arena-map="${map.id}"><b>${escapeText(map.name)}</b><span>${escapeText(map.subtitle)}</span></button>`).join("")}</div></section>
            <section class="arena-kl-rules-box"><small>SPIELREGELN</small><div class="arena-kl-rules">
              <div class="arena-kl-rule"><b>25 Kills</b><span>Der erste Spieler mit 25 Abschüssen gewinnt.</span></div>
              <div class="arena-kl-rule"><b>Sichtschutz</b><span>Wände blockieren Sicht, Laser und Geschosse.</span></div>
              <div class="arena-kl-rule"><b>Finales Messer</b><span>Der 25. Kill muss mit dem Kampfmesser gelingen.</span></div>
            </div></section>
            <button class="arena-kl-primary" type="button" data-arena-start>Bot-Lobby starten</button>
            <section class="arena-kl-private-tools" data-arena-private-tools hidden>
              <button class="arena-kl-secondary" type="button" data-arena-create-private>Privaten Raum erstellen</button>
              <div><input maxlength="6" inputmode="text" autocomplete="off" placeholder="RAUMCODE" data-arena-room-code><button class="arena-kl-secondary" type="button" data-arena-join-private>Beitreten</button></div>
            </section>
            <section class="arena-kl-online-lobby" data-arena-online-lobby hidden></section>
            <p>Statistik: ${stats.wins} Siege · ${stats.totalKills} Gesamtkills · Bestleistung ${stats.bestKills}/25</p>
          </section>

          <section class="arena-kl-game" data-arena-game hidden>
            <div class="arena-kl-game-topline"><span data-arena-map-name>Lagerhalle</span><span data-arena-online-status>BOT-MATCH</span></div>
            <div class="arena-kl-scoreboard" data-arena-scoreboard></div>
            <div class="arena-kl-arena-wrap">
              <canvas class="arena-kl-canvas" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" data-arena-canvas aria-label="Arena.KL Spielfeld"></canvas>
              <div class="arena-kl-canvas-overlay"></div>
              <div class="arena-kl-sticks" aria-label="Mobile Steuerung"><div class="arena-kl-stick move" data-arena-stick="move"><div class="arena-kl-stick-knob">LAUFEN</div></div><div class="arena-kl-stick aim" data-arena-stick="aim"><div class="arena-kl-stick-knob">ZIELEN<br>FEUERN</div></div></div>
              <div class="arena-kl-quick-items">
                <button type="button" data-arena-use="bandage"><span>✚</span><b data-arena-bandages>0</b><small>Verband</small></button>
                <button type="button" data-arena-use="medipack"><span>▣</span><b data-arena-medipacks>0</b><small>Medipack</small></button>
              </div>
              <div class="arena-kl-respawn" data-arena-respawn hidden></div><div class="arena-kl-paused" data-arena-paused hidden>PAUSE</div><section class="arena-kl-end-panel" data-arena-end hidden></section>
            </div>
            <section class="arena-kl-health-strip"><span>LEBEN</span><div><i data-arena-health></i></div><b data-arena-health-text>100</b></section>
            <section class="arena-kl-hud">
              <article class="arena-kl-weapon-card current"><small>AKTUELLE WAFFE</small><b data-arena-current-name>Pistole</b><div class="arena-kl-weapon-visual" data-arena-current-symbol>⌖</div></article>
              <article class="arena-kl-progress-card"><small>KILLS</small><strong><b data-arena-kills>00</b><span>/25</span></strong><div class="arena-kl-progress-track"><i data-arena-progress></i></div><em data-arena-progress-text>4 Kills bis zur nächsten Waffe</em></article>
              <article class="arena-kl-weapon-card next"><small>NÄCHSTE WAFFE</small><b data-arena-next-name>Shotgun</b><div class="arena-kl-weapon-visual" data-arena-next-symbol>━</div></article>
            </section>
            <section class="arena-kl-ladder-wrap"><div class="arena-kl-ladder-title">WAFFENLEITER</div><div class="arena-kl-ladder" data-arena-ladder></div></section>
            <div class="arena-kl-help"><span><b>PC:</b> WASD + Maus · B Verband · H Medipack</span><span><b>Handy:</b> Sticks und Versorgungsbuttons</span></div>
          </section>
        </main>
        <section class="arena-kl-shop-panel" data-arena-shop-panel hidden></section>
      </section>`;
  }

  function bindShellEvents() {
    overlay?.querySelector("[data-arena-close]")?.addEventListener("click", requestClose);
    overlay?.querySelector("[data-arena-back]")?.addEventListener("click", () => {
      if ((session?.running || onlineLobby) && !window.confirm("Arena.KL wirklich verlassen? Die aktuelle Lobby oder das Match wird beendet.")) return;
      if (onlineLobby) leaveOnlineLobby(false);
      stopSession(false);
      showMenu();
    });
    overlay?.querySelector("[data-arena-info]")?.addEventListener("click", showInfo);
    overlay?.querySelector("[data-arena-shop]")?.addEventListener("click", showShop);
    overlay?.querySelector("[data-arena-pause]")?.addEventListener("click", togglePause);
    overlay?.querySelector("[data-arena-start]")?.addEventListener("click", () => selectedMode === "online" ? startOnlineLobby({ type: "quick" }) : startLocalMatch());
    overlay?.querySelector("[data-arena-create-private]")?.addEventListener("click", () => startOnlineLobby({ type: "create-private" }));
    overlay?.querySelector("[data-arena-join-private]")?.addEventListener("click", () => {
      const code = String(overlay?.querySelector("[data-arena-room-code]")?.value || "").trim().toUpperCase();
      startOnlineLobby({ type: "join-private", code });
    });
    overlay?.querySelectorAll("[data-arena-mode]").forEach((button) => {
      const chooseMode = (event) => {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        selectArenaMode(button.dataset.arenaMode);
      };
      // pointerup reagiert auf iPhone/Touch sofort; click bleibt für Maus und Tastatur erhalten.
      button.addEventListener("pointerup", chooseMode);
      button.addEventListener("click", chooseMode);
      button.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") chooseMode(event);
      });
    });
    overlay?.querySelectorAll("[data-arena-difficulty]").forEach((button) => button.addEventListener("click", () => {
      selectedBotDifficulty = botDifficultyConfig(button.dataset.arenaDifficulty).id;
      overlay.querySelectorAll("[data-arena-difficulty]").forEach((item) => item.classList.toggle("active", item === button));
      syncArenaModeUi();
      hideOnlineLobby();
    }));
    overlay?.querySelectorAll("[data-arena-players]").forEach((button) => button.addEventListener("click", () => {
      selectedPlayers = clamp(Number(button.dataset.arenaPlayers) || 2, 2, 4);
      overlay.querySelectorAll("[data-arena-players]").forEach((item) => item.classList.toggle("active", item === button));
      hideOnlineLobby();
    }));
    overlay?.querySelectorAll("[data-arena-map]").forEach((button) => button.addEventListener("click", () => {
      selectedMapId = mapById(button.dataset.arenaMap).id;
      overlay.querySelectorAll("[data-arena-map]").forEach((item) => item.classList.toggle("active", item === button));
      hideOnlineLobby();
    }));
    overlay?.querySelectorAll("[data-arena-use]").forEach((button) => button.addEventListener("click", () => requestUseItem(button.dataset.arenaUse)));
  }

  function showInfo() {
    window.alert("Arena.KL: Bot- und Online-Matches für 2 bis 4 Teilnehmer. Öffentliche Räume werden automatisch gesucht; private Räume erhalten einen sechsstelligen Code. Wände blockieren Sicht, Schüsse und den kurzen Waffenlaser. Im Shop kannst du Laserfarben, Verbände und Medipacks kaufen. PC: WASD + Maus, B für Verband, H für Medipack. Der 25. Kill mit dem Kampfmesser gewinnt.");
  }

  function showMenu() {
    if (!overlay) return;
    overlay.querySelector("[data-arena-menu]")?.removeAttribute("hidden");
    overlay.querySelector("[data-arena-game]")?.setAttribute("hidden", "");
    overlay.querySelector("[data-arena-pause]")?.setAttribute("hidden", "");
    overlay.querySelector("[data-arena-shop]")?.removeAttribute("hidden");
    syncArenaModeUi();
  }

  function showGame() {
    overlay?.querySelector("[data-arena-menu]")?.setAttribute("hidden", "");
    overlay?.querySelector("[data-arena-game]")?.removeAttribute("hidden");
    overlay?.querySelector("[data-arena-pause]")?.removeAttribute("hidden");
    overlay?.querySelector("[data-arena-shop]")?.setAttribute("hidden", "");
  }

  function showShop() {
    if (!overlay || session?.running) return;
    const panel = overlay.querySelector("[data-arena-shop-panel]");
    if (!panel) return;
    const data = ensureArenaState();
    panel.removeAttribute("hidden");
    panel.innerHTML = `
      <div class="arena-kl-shop-card">
        <header><div><small>ARENA.KL AUSRÜSTUNG</small><h3>Shop</h3></div><button type="button" data-arena-shop-close>×</button></header>
        <p class="arena-kl-shop-balance">Verfügbar: <b>${EURO.format(playerFunds())}</b></p>
        <section><h4>Waffenlaser</h4><p>Der Laser ist absichtlich kurz und endet an Wänden. Gekaufte Farben bleiben dauerhaft freigeschaltet.</p><div class="arena-kl-shop-grid">${LASERS.map((laser) => {
          const owned = data.lasers.includes(laser.id);
          const selected = data.selectedLaser === laser.id;
          return `<button type="button" class="arena-kl-shop-item ${selected ? "selected" : ""}" data-arena-laser="${laser.id}" style="--laser:${laser.color}"><i></i><span><b>${laser.name}</b><small>${owned ? (selected ? "AUSGEWÄHLT" : "AUSWÄHLEN") : EURO.format(laser.price)}</small></span></button>`;
        }).join("")}</div><button class="arena-kl-secondary arena-kl-laser-off ${data.selectedLaser ? "" : "active"}" type="button" data-arena-laser-off>Laser ausschalten</button></section>
        <section><h4>Versorgung</h4><p>Verbände heilen 25 Leben, Medipacks 55 Leben. Sie werden beim Benutzen verbraucht.</p><div class="arena-kl-supply-grid">${SUPPLIES.map((item) => `<article><span>${item.icon}</span><div><b>${item.name}</b><small>Vorrat: ${item.id === "bandage" ? data.bandages : data.medipacks}</small></div><button type="button" data-arena-buy-supply="${item.id}">${EURO.format(item.price)}</button></article>`).join("")}</div></section>
      </div>`;
    panel.querySelector("[data-arena-shop-close]")?.addEventListener("click", () => panel.setAttribute("hidden", ""));
    panel.querySelector("[data-arena-laser-off]")?.addEventListener("click", () => { data.selectedLaser = ""; safeSave(); showShop(); });
    panel.querySelectorAll("[data-arena-laser]").forEach((button) => button.addEventListener("click", () => {
      const laser = LASERS.find((entry) => entry.id === button.dataset.arenaLaser);
      if (!laser) return;
      if (!data.lasers.includes(laser.id)) {
        if (!payArena(laser.price, `Laser ${laser.name}`)) return window.alert("Nicht genug Geld für diesen Laser.");
        data.lasers.push(laser.id);
      }
      data.selectedLaser = laser.id;
      safeSave();
      showShop();
    }));
    panel.querySelectorAll("[data-arena-buy-supply]").forEach((button) => button.addEventListener("click", () => {
      const item = SUPPLIES.find((entry) => entry.id === button.dataset.arenaBuySupply);
      if (!item) return;
      const key = item.id === "bandage" ? "bandages" : "medipacks";
      if (data[key] >= 99) return window.alert("Dein Vorrat ist bereits voll.");
      if (!payArena(item.price, item.name)) return window.alert("Nicht genug Geld für diesen Kauf.");
      data[key] += 1;
      safeSave();
      showShop();
    }));
  }

  function syncArenaModeUi() {
    if (!overlay) return;
    const online = selectedMode === "online";
    overlay.querySelectorAll("[data-arena-mode]").forEach((button) => {
      const active = (button.dataset.arenaMode === "online") === online;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    const start = overlay.querySelector("[data-arena-start]");
    if (start) {
      start.disabled = false;
      start.textContent = online ? "Öffentliche Lobby suchen" : "Bot-Lobby starten";
    }
    overlay.querySelector("[data-arena-private-tools]")?.toggleAttribute("hidden", !online);
    const note = overlay.querySelector("[data-arena-mode-note]");
    if (note) note.textContent = online
      ? "Online ausgewählt · öffentliche Suche oder privater Raumcode. Dein Login wird beim Start geprüft."
      : "Bot-Lobby ausgewählt · startet sofort.";
    const difficulty = botDifficultyConfig();
    const difficultyTitle = overlay.querySelector("[data-arena-difficulty-title]");
    if (difficultyTitle) difficultyTitle.textContent = online ? "BOT-STÄRKE FÜR FREIE PLÄTZE" : "BOT-SCHWIERIGKEIT";
    const difficultyNote = overlay.querySelector("[data-arena-difficulty-note]");
    if (difficultyNote) difficultyNote.textContent = online
      ? `${difficulty.name}: Freie Plätze werden mit Bots dieser Stärke gefüllt. Die feste Bot-Siegprämie gilt nur in Bot-Lobbys.`
      : `Belohnung bei Bot-Sieg: ${difficulty.xp} EP und ${EURO.format(difficulty.money)}.`;
    overlay.querySelectorAll("[data-arena-difficulty]").forEach((button) => button.classList.toggle("active", button.dataset.arenaDifficulty === difficulty.id));
    if (start && !online) start.textContent = `Bot-Lobby ${difficulty.name} starten`;
  }

  function selectArenaMode(mode) {
    const nextMode = mode === "online" ? "online" : "bots";
    const changed = selectedMode !== nextMode;
    selectedMode = nextMode;
    syncArenaModeUi();
    if (changed) hideOnlineLobby();
  }

  function hideOnlineLobby() {
    const box = overlay?.querySelector("[data-arena-online-lobby]");
    if (box) { box.setAttribute("hidden", ""); box.innerHTML = ""; }
    if (onlineLobby && !onlineLobby.started) leaveOnlineLobby(false);
  }

  async function arenaFirebaseRuntime() {
    if (typeof loadFirebasePhoneRuntime === "function") return loadFirebasePhoneRuntime();
    if (window.LifeBuilderFirebase?.load) return window.LifeBuilderFirebase.load();
    throw new Error("Online-Verbindung ist in dieser Version nicht verfügbar.");
  }

  function onlineIdentity(fb) {
    const uid = String(fb?.auth?.currentUser?.uid || "");
    if (!uid) throw new Error("Bitte zuerst mit deinem JK.Games-Account anmelden.");
    return { uid, name: playerName() };
  }

  function cloudflareServerBaseUrl() {
    const raw = String(window.ArenaKLServerConfig?.url || "").trim().replace(/\/+$/, "");
    if (!raw || /DEIN-NAME|DEINE-ADRESSE/i.test(raw)) return "";
    if (!/^https?:\/\//i.test(raw) && !/^wss?:\/\//i.test(raw)) return "";
    return raw.replace(/^http:/i, "ws:").replace(/^https:/i, "wss:");
  }

  function cloudflareConfigured() {
    return !!cloudflareServerBaseUrl();
  }

  function currentLoadout() {
    const data = ensureArenaState();
    return { laserColor: selectedLaserColor(), bandages: clamp(data.bandages, 0, 8), medipacks: clamp(data.medipacks, 0, 5) };
  }

  function randomRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let value = "";
    for (let i = 0; i < 6; i += 1) value += chars[Math.floor(Math.random() * chars.length)];
    return value;
  }

  function renderOnlineLobby(message = "Online-Lobby wird gesucht …") {
    const box = overlay?.querySelector("[data-arena-online-lobby]");
    if (!box) return;
    box.removeAttribute("hidden");
    const players = onlineLobby?.participants || [];
    const maxPlayers = Number(onlineLobby?.roomData?.maxPlayers || selectedPlayers);
    const map = mapById(onlineLobby?.roomData?.mapId || selectedMapId);
    const slots = Math.max(0, maxPlayers - players.length);
    const isHost = !!onlineLobby?.isHost;
    const code = onlineLobby?.roomData?.visibility === "private" ? onlineLobby.roomId : "";
    box.innerHTML = `
      <header><div><small>ONLINE-LOBBY${code ? ` · CODE ${escapeText(code)}` : ""}</small><h4>${escapeText(message)}</h4></div><span class="arena-kl-online-dot"></span></header>
      <p class="arena-kl-lobby-map">Map: <b>${escapeText(map.name)}</b> · Bots: <b>${escapeText(botDifficultyConfig(onlineLobby?.roomData?.botDifficulty).name)}</b></p>
      <div class="arena-kl-online-members">${Array.from({ length: maxPlayers }, (_, index) => {
        const member = players.find((entry) => Number(entry.slot) === index);
        return member ? `<div class="arena-kl-online-member filled"><i style="--player-color:${COLORS[index]}"></i><span><b>${escapeText(member.name || "Spieler")}</b><small>${member.uid === onlineLobby?.uid ? "DU" : "ONLINE"}</small></span></div>` : `<div class="arena-kl-online-member"><i></i><span><b>Freier Platz</b><small>WARTET</small></span></div>`;
      }).join("")}</div>
      <p>${players.length}/${maxPlayers} echte Spieler verbunden${slots ? ` · ${slots} Platz${slots === 1 ? " wird" : "e werden"} beim Start mit Bots gefüllt` : ""}</p>
      <div class="arena-kl-online-actions">${isHost && onlineLobby?.roomId ? `<button class="arena-kl-primary" type="button" data-arena-online-start>${slots ? `Starten · ${slots} Bot${slots === 1 ? "" : "s"} ergänzen` : "Match starten"}</button>` : ""}<button class="arena-kl-secondary" type="button" data-arena-online-leave>Lobby verlassen</button></div>`;
    box.querySelector("[data-arena-online-start]")?.addEventListener("click", startOnlineRoomAsHost);
    box.querySelector("[data-arena-online-leave]")?.addEventListener("click", () => leaveOnlineLobby(true));
  }

  async function startOnlineLobby(options = { type: "quick" }) {
    if (onlineLobby?.joining) return;
    if (!cloudflareConfigured()) {
      window.alert("Arena.KL Cloudflare-Server ist noch nicht eingetragen. Starte im GitHub-Paket SERVER-URL-EINTRAGEN.cmd und füge deine workers.dev-Adresse ein.");
      return;
    }
    const type = options.type || "quick";
    const code = String(options.code || "").trim().toUpperCase();
    if (type === "join-private" && !/^[A-Z0-9]{6}$/.test(code)) return window.alert("Bitte einen gültigen sechsstelligen Raumcode eingeben.");
    stopSession(false);
    selectedMode = "online";
    syncArenaModeUi();
    onlineLobby = { joining: true, started: false, participants: [], unsubs: [], startTimer: 0 };
    renderOnlineLobby(type === "join-private" ? `Raum ${code} wird geöffnet …` : "Online-Lobby wird gesucht …");
    const startButton = overlay?.querySelector("[data-arena-start]");
    if (startButton) startButton.disabled = true;
    try {
      const fb = await arenaFirebaseRuntime();
      const identity = onlineIdentity(fb);
      const room = type === "create-private" ? await createPrivateRoom(fb, identity) : type === "join-private" ? await joinPrivateRoom(fb, identity, code) : await findOrCreatePublicRoom(fb, identity);
      if (!onlineLobby) return;
      Object.assign(onlineLobby, { fb, ...identity, ...room, joining: false });
      const roomRef = fb.doc(fb.db, "arenaKlRooms", room.roomId);
      await fb.setDoc(fb.doc(fb.db, "arenaKlRooms", room.roomId, "participants", identity.uid), {
        uid: identity.uid, name: identity.name, slot: room.slot, joinedAtMs: Date.now(), lastSeenMs: Date.now(), loadout: currentLoadout(),
        input: { moveX: 0, moveY: 0, angle: 0, firing: false, bandageSeq: 0, medipackSeq: 0, at: Date.now() }
      }, { merge: true });
      listenOnlineLobby();
      renderOnlineLobby(room.isHost ? "Eigene Lobby erstellt" : "Lobby gefunden");
    } catch (error) {
      console.error("Arena.KL Online-Lobby", error);
      renderOnlineLobby(`Online konnte nicht starten: ${error?.message || error}`);
      if (startButton) startButton.disabled = false;
    }
  }

  async function createRoomDocument(fb, identity, roomRef, visibility) {
    const now = Date.now();
    await fb.setDoc(roomRef, {
      hostUid: identity.uid, status: "waiting", visibility, maxPlayers: selectedPlayers, currentPlayers: 1,
      playerUids: [identity.uid], slots: { [identity.uid]: 0 }, playerNames: { [identity.uid]: identity.name }, mapId: selectedMapId, botDifficulty: selectedBotDifficulty,
      createdAtMs: now, updatedAtMs: now, version: VERSION
    });
    return { roomId: roomRef.id, slot: 0, isHost: true, roomData: { visibility, maxPlayers: selectedPlayers, mapId: selectedMapId, botDifficulty: selectedBotDifficulty } };
  }

  async function createPrivateRoom(fb, identity) {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const code = randomRoomCode();
      const ref = fb.doc(fb.db, "arenaKlRooms", code);
      const snap = await fb.getDoc(ref);
      if (!snap.exists()) return createRoomDocument(fb, identity, ref, "private");
    }
    throw new Error("Es konnte kein freier Raumcode erstellt werden.");
  }

  async function joinPrivateRoom(fb, identity, code) {
    const ref = fb.doc(fb.db, "arenaKlRooms", code);
    const snap = await fb.getDoc(ref);
    if (!snap.exists()) throw new Error("Dieser Raum existiert nicht.");
    const data = snap.data();
    if (data.visibility !== "private" || data.status !== "waiting") throw new Error("Dieser Raum ist nicht mehr verfügbar.");
    selectedPlayers = clamp(Number(data.maxPlayers) || 2, 2, 4);
    selectedMapId = mapById(data.mapId).id;
    selectedBotDifficulty = botDifficultyConfig(data.botDifficulty).id;
    return joinRoomTransaction(fb, code, identity, selectedPlayers);
  }

  async function findOrCreatePublicRoom(fb, identity) {
    const queryRef = fb.query(
      fb.collection(fb.db, "arenaKlRooms"),
      fb.where("status", "==", "waiting"),
      fb.where("visibility", "==", "public"),
      fb.where("maxPlayers", "==", selectedPlayers),
      fb.where("mapId", "==", selectedMapId),
      fb.limit(20)
    );
    const snap = await fb.getDocs(queryRef);
    const now = Date.now();
    const candidates = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .filter((room) => room.visibility === "public" && room.hostUid !== identity.uid && !(Array.isArray(room.playerUids) && room.playerUids.includes(identity.uid)) && Number(room.maxPlayers) === selectedPlayers && room.mapId === selectedMapId && botDifficultyConfig(room.botDifficulty).id === selectedBotDifficulty && now - Number(room.updatedAtMs || room.createdAtMs || 0) < 180000 && Number(room.currentPlayers || 0) < selectedPlayers)
      .sort((a, b) => Number(b.currentPlayers || 0) - Number(a.currentPlayers || 0));
    for (const candidate of candidates) {
      try { const joined = await joinRoomTransaction(fb, candidate.id, identity, selectedPlayers); if (joined) return joined; } catch (_) {}
    }
    return createRoomDocument(fb, identity, fb.doc(fb.collection(fb.db, "arenaKlRooms")), "public");
  }

  async function joinRoomTransaction(fb, roomId, identity, maxPlayers) {
    const roomRef = fb.doc(fb.db, "arenaKlRooms", roomId);
    return fb.runTransaction(fb.db, async (transaction) => {
      const snap = await transaction.get(roomRef);
      if (!snap.exists()) return null;
      const data = snap.data();
      if (data.status !== "waiting" || Number(data.maxPlayers) !== maxPlayers) return null;
      const playerUids = Array.isArray(data.playerUids) ? [...data.playerUids] : [];
      const slots = { ...(data.slots || {}) };
      const playerNames = { ...(data.playerNames || {}) };
      if (playerUids.includes(identity.uid)) throw new Error("Dieser JK.Games-Account ist bereits in diesem Raum. Für jeden echten Online-Spieler wird ein eigener Account benötigt.");
      if (playerUids.length >= maxPlayers) return null;
      const used = new Set(Object.values(slots).map(Number));
      let slot = 0; while (used.has(slot) && slot < maxPlayers) slot += 1;
      if (slot >= maxPlayers) return null;
      playerUids.push(identity.uid); slots[identity.uid] = slot; playerNames[identity.uid] = identity.name;
      transaction.update(roomRef, { playerUids, slots, playerNames, currentPlayers: playerUids.length, updatedAtMs: Date.now() });
      return { roomId, slot, isHost: data.hostUid === identity.uid, roomData: data };
    });
  }

  function listenOnlineLobby() {
    const lobby = onlineLobby;
    if (!lobby?.fb || !lobby.roomId) return;
    const roomRef = lobby.fb.doc(lobby.fb.db, "arenaKlRooms", lobby.roomId);
    const participantsRef = lobby.fb.collection(lobby.fb.db, "arenaKlRooms", lobby.roomId, "participants");
    lobby.unsubs.push(lobby.fb.onSnapshot(roomRef, (snapshot) => {
      if (!onlineLobby || onlineLobby.roomId !== lobby.roomId || !snapshot.exists()) return;
      const data = snapshot.data();
      onlineLobby.roomData = data;
      onlineLobby.isHost = data.hostUid === lobby.uid;
      if (data.status === "running" && !onlineLobby.started) {
        onlineLobby.started = true;
        startOnlineSession(data).catch((error) => { console.error(error); renderOnlineLobby(`Matchstart fehlgeschlagen: ${error?.message || error}`); });
        return;
      }
      if (data.status === "cancelled") { renderOnlineLobby("Die Lobby wurde geschlossen."); leaveOnlineLobby(false); return; }
      renderOnlineLobby(onlineLobby.isHost ? "Warte auf Spieler" : "Mit Lobby verbunden");
    }, (error) => renderOnlineLobby(`Lobby-Verbindung verloren: ${error.message || error}`)));
    lobby.unsubs.push(lobby.fb.onSnapshot(participantsRef, (snapshot) => {
      if (!onlineLobby || onlineLobby.roomId !== lobby.roomId) return;
      onlineLobby.participants = snapshot.docs.map((docSnap) => ({ uid: docSnap.id, ...docSnap.data() })).sort((a, b) => Number(a.slot) - Number(b.slot));
      renderOnlineLobby(onlineLobby.isHost ? "Warte auf Spieler" : "Mit Lobby verbunden");
      if (onlineLobby.isHost && onlineLobby.participants.length >= Number(onlineLobby.roomData?.maxPlayers || selectedPlayers) && !onlineLobby.startTimer) onlineLobby.startTimer = window.setTimeout(startOnlineRoomAsHost, 1000);
    }));
    lobby.heartbeat = window.setInterval(() => {
      if (!onlineLobby?.fb || onlineLobby.started) return;
      lobby.fb.setDoc(lobby.fb.doc(lobby.fb.db, "arenaKlRooms", lobby.roomId, "participants", lobby.uid), { lastSeenMs: Date.now() }, { merge: true }).catch(() => {});
    }, 5000);
  }

  async function startOnlineRoomAsHost() {
    const lobby = onlineLobby;
    if (!lobby?.isHost || !lobby.fb || !lobby.roomId || lobby.starting) return;
    lobby.starting = true;
    try {
      const maxPlayers = Number(lobby.roomData?.maxPlayers || selectedPlayers);
      await lobby.fb.updateDoc(lobby.fb.doc(lobby.fb.db, "arenaKlRooms", lobby.roomId), {
        status: "running", botCount: Math.max(0, maxPlayers - lobby.participants.length), startedAtMs: Date.now(), updatedAtMs: Date.now(), seed: Math.floor(Math.random() * 2147483647)
      });
    } catch (error) { lobby.starting = false; renderOnlineLobby(`Start fehlgeschlagen: ${error?.message || error}`); }
  }

  async function startOnlineSession(roomData) {
    const lobby = onlineLobby;
    if (!lobby?.fb || !lobby.roomId) throw new Error("Lobby-Daten fehlen.");
    const fb = lobby.fb;
    selectedPlayers = clamp(Number(roomData.maxPlayers) || 2, 2, 4);
    selectedMapId = mapById(roomData.mapId).id;
    selectedBotDifficulty = botDifficultyConfig(roomData.botDifficulty).id;
    const participantSnapshot = await fb.getDocs(fb.collection(fb.db, "arenaKlRooms", lobby.roomId, "participants"));
    const participants = participantSnapshot.docs.map((docSnap) => ({ uid: docSnap.id, ...docSnap.data() })).sort((a, b) => Number(a.slot) - Number(b.slot));
    const local = participants.find((entry) => entry.uid === lobby.uid);
    if (!local) throw new Error("Dein Spielerplatz wurde nicht gefunden.");
    lobby.unsubs.forEach((unsubscribe) => { try { unsubscribe(); } catch (_) {} });
    if (lobby.heartbeat) clearInterval(lobby.heartbeat);
    if (lobby.startTimer) clearTimeout(lobby.startTimer);
    const definitions = participants.map((entry) => ({ ...entry, bot: false }));
    const usedSlots = new Set(definitions.map((entry) => Number(entry.slot)));
    let botNumber = 1;
    for (let slot = 0; slot < selectedPlayers; slot += 1) if (!usedSlots.has(slot)) definitions.push({ uid: `bot-${lobby.roomId}-${slot}`, name: `Arena Bot ${botNumber++}`, slot, bot: true, loadout: { laserColor: "", bandages: 1, medipacks: 0 } });
    const serverRoster = definitions.map((entry) => ({ uid: entry.uid, name: entry.name, slot: Number(entry.slot), bot: !!entry.bot, loadout: entry.loadout || {} })).sort((a, b) => a.slot - b.slot);
    definitions.sort((a, b) => (a.uid === lobby.uid ? -1 : b.uid === lobby.uid ? 1 : Number(a.slot) - Number(b.slot)));
    const players = definitions.map((entry) => createPlayer(Number(entry.slot), entry.name, entry.uid === lobby.uid, COLORS[Number(entry.slot)], currentMap().spawns[Number(entry.slot)], entry.loadout, entry.uid, !!entry.bot));
    const roomRef = fb.doc(fb.db, "arenaKlRooms", lobby.roomId);
    createSession(players, {
      online: true,
      isHost: roomData.hostUid === lobby.uid,
      roomId: lobby.roomId,
      roomRef,
      fb,
      uid: lobby.uid,
      roomToken: String(roomData.seed || roomData.startedAtMs || lobby.roomId),
      cloudflareConfig: { mapId: selectedMapId, maxPlayers: selectedPlayers, botDifficulty: selectedBotDifficulty, seed: Number(roomData.seed) || 0, roster: serverRoster },
      localSlot: Number(local.slot) || 0,
      localLoadout: local.loadout || currentLoadout(),
      botDifficulty: selectedBotDifficulty
    });
    onlineLobby = null;
    bindCloudflareSession();
  }

  function startLocalMatch() {
    stopSession(false);
    hideOnlineLobby();
    const loadout = currentLoadout();
    const players = [];
    for (let index = 0; index < selectedPlayers; index += 1) {
      const bot = index !== 0;
      players.push(createPlayer(index, bot ? BOT_NAMES[index - 1] : playerName(), !bot, COLORS[index], currentMap().spawns[index], bot ? { laserColor: "", bandages: 1, medipacks: 0 } : loadout, bot ? `bot-local-${index}` : "local", bot));
    }
    createSession(players, { online: false, isHost: true, botDifficulty: selectedBotDifficulty });
  }

  function createSession(players, onlineData) {
    showGame();
    const canvas = overlay?.querySelector("[data-arena-canvas]");
    if (!canvas) return;
    const coarsePointer = !!window.matchMedia?.("(pointer: coarse)")?.matches;
    session = {
      canvas, ctx: canvas.getContext("2d", { alpha: false }), map: currentMap(), players, bullets: [], particles: [], running: true, paused: false, finished: false, winner: null, botDifficulty: botDifficultyConfig(onlineData.botDifficulty || selectedBotDifficulty).id,
      startedAt: performance.now(), moveInput: { x: 0, y: 0 }, aimInput: { x: 0, y: -1 }, stickFiring: false, visibility: [], visibilityAt: 0, visibilityX: NaN, visibilityY: NaN, visibilityRays: coarsePointer ? MOBILE_VISIBILITY_RAYS : DESKTOP_VISIBILITY_RAYS, visibilityInterval: coarsePointer ? 95 : 70, hudAt: 0,
      renderInterval: 1000 / (coarsePointer ? MOBILE_RENDER_FPS : DESKTOP_RENDER_FPS), lastDrawAt: 0, mapCache: null,
      online: !!onlineData.online, isHost: !!onlineData.isHost, roomId: onlineData.roomId || "", roomRef: onlineData.roomRef || null, fb: onlineData.fb || null, uid: onlineData.uid || "",
      roomToken: onlineData.roomToken || "", cloudflareConfig: onlineData.cloudflareConfig || null, localSlot: Number(onlineData.localSlot) || 0, localLoadout: onlineData.localLoadout || {},
      ws: null, wsConnected: false, wsClosing: false, reconnectAttempts: 0, reconnectTimer: 0, inputSequence: 0, latencyMs: 0, lastPongAt: 0,
      remoteInputs: {}, onlineUnsubs: [], snapshotAt: 0, inputAt: 0, heartbeatTimer: 0, lastSnapshotAt: 0, lastInputSentAt: 0, lastSentInput: null, localSequences: { bandage: 0, medipack: 0 },
      lastAppliedSnapshotAtMs: 0, lastInputStampMs: 0, lastSnapshotStampMs: 0, inputWriteInFlight: false, pendingInputWrite: null, snapshotWriteInFlight: false, pendingSnapshotWrite: null, nextBulletId: 1
    };
    session.mapCache = buildMapCache(session.map);
    keyboard = Object.create(null);
    mouse = { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2, down: false, active: false };
    bindGameControls();
    renderLadder();
    updateHud(true);
    setText("[data-arena-map-name]", session.map.name);
    setText("[data-arena-online-status]", session.online ? "CLOUDFLARE · VERBINDET" : `BOT-MATCH · ${botDifficultyConfig(session.botDifficulty).name.toUpperCase()}`);
    lastFrame = performance.now();
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(frame);
  }

  function createPlayer(id, name, human, color, spawn, loadout = {}, uid = "", bot = false) {
    return {
      id, uid, name: String(name || "Spieler").slice(0, 24), human, bot, onlineRemote: !human && !bot, color, x: spawn.x, y: spawn.y, angle: id * Math.PI / 2,
      health: 100, maxHealth: 100, kills: 0, deaths: 0, nextShot: 0, respawnAt: 0, invulnerableUntil: performance.now() + (bot ? 1500 : 2500),
      speed: bot ? (158 + Math.random() * 18) * botDifficultyConfig().speed : 180, waypoint: null, waypointAt: 0, strafe: Math.random() > .5 ? 1 : -1, strafeAt: 0, aiThinkAt: 0,
      targetId: null, muzzleUntil: 0, knifeUntil: 0, localFxNextShot: 0, laserColor: String(loadout?.laserColor || "").slice(0, 16), bandages: clamp(Number(loadout?.bandages) || 0, 0, 8), medipacks: clamp(Number(loadout?.medipacks) || 0, 0, 5), healCooldownUntil: 0, processedBandageSeq: 0, processedMedipackSeq: 0,
      targetX: spawn.x, targetY: spawn.y, targetAngle: id * Math.PI / 2, netVx: 0, netVy: 0, lastAuthorityAt: 0, lastPayloadX: spawn.x, lastPayloadY: spawn.y, lastPayloadAt: 0, connectionStale: false, onlineFallback: false
    };
  }

  function bindCloudflareSession() {
    if (!session?.online) return;
    connectCloudflareSocket(false);
  }

  function connectCloudflareSocket(reconnecting = false) {
    if (!session?.online || session.finished || session.wsClosing) return;
    const base = cloudflareServerBaseUrl();
    if (!base) return finishOnlineDisconnected("Cloudflare-Serveradresse fehlt.");
    if (session.ws && (session.ws.readyState === WebSocket.OPEN || session.ws.readyState === WebSocket.CONNECTING)) return;
    const activeSession = session;
    const url = `${base}/room/${encodeURIComponent(activeSession.roomId)}?uid=${encodeURIComponent(activeSession.uid)}&name=${encodeURIComponent(activeSession.players[0]?.name || playerName())}`;
    const socket = new WebSocket(url);
    activeSession.ws = socket;
    activeSession.wsConnected = false;
    setText("[data-arena-online-status]", reconnecting ? "CLOUDFLARE · NEUVERBINDUNG" : "CLOUDFLARE · VERBINDET");

    socket.addEventListener("open", () => {
      if (session !== activeSession) return socket.close();
      activeSession.wsConnected = true;
      activeSession.reconnectAttempts = 0;
      activeSession.lastSnapshotAt = performance.now();
      setText("[data-arena-online-status]", "CLOUDFLARE · ECHTZEIT");
      socket.send(JSON.stringify({
        type: "join",
        version: VERSION,
        uid: activeSession.uid,
        name: activeSession.players[0]?.name || playerName(),
        slot: activeSession.localSlot,
        roomToken: activeSession.roomToken,
        loadout: activeSession.localLoadout,
        config: activeSession.cloudflareConfig
      }));
    });

    socket.addEventListener("message", (event) => {
      if (session !== activeSession) return;
      let message;
      try { message = JSON.parse(String(event.data || "")); } catch (_) { return; }
      if (message.type === "snapshot") {
        applyOnlineSnapshot(message);
        return;
      }
      if (message.type === "joined") {
        activeSession.wsConnected = true;
        activeSession.lastSnapshotAt = performance.now();
        setText("[data-arena-online-status]", "CLOUDFLARE · ECHTZEIT");
        return;
      }
      if (message.type === "pong") {
        activeSession.latencyMs = Math.max(0, Date.now() - Number(message.echo || Date.now()));
        activeSession.lastPongAt = performance.now();
        setText("[data-arena-online-status]", `CLOUDFLARE · ${Math.round(activeSession.latencyMs)} MS`);
        return;
      }
      if (message.type === "error") {
        finishOnlineDisconnected(`Cloudflare-Server: ${message.message || "Unbekannter Fehler"}`);
      }
    });

    socket.addEventListener("close", () => {
      if (session !== activeSession || activeSession.wsClosing || activeSession.finished) return;
      activeSession.wsConnected = false;
      if (activeSession.reconnectAttempts >= CLOUDFLARE_RECONNECT_LIMIT) {
        finishOnlineDisconnected("Die Cloudflare-Echtzeitverbindung konnte nicht wiederhergestellt werden.");
        return;
      }
      const delay = Math.min(4000, 500 * 2 ** activeSession.reconnectAttempts++);
      setText("[data-arena-online-status]", `CLOUDFLARE · NEU IN ${Math.ceil(delay / 1000)}S`);
      clearTimeout(activeSession.reconnectTimer);
      activeSession.reconnectTimer = window.setTimeout(() => {
        if (session === activeSession) connectCloudflareSocket(true);
      }, delay);
    });

    socket.addEventListener("error", () => {
      try { socket.close(); } catch (_) {}
    });
  }

  function bindOnlineSessionListeners() {
    if (!session?.online) return;
    const fb = session.fb;
    const participantsRef = fb.collection(fb.db, "arenaKlRooms", session.roomId, "participants");
    const stateRef = fb.doc(fb.db, "arenaKlRooms", session.roomId, "state", "live");
    session.participantRef = fb.doc(fb.db, "arenaKlRooms", session.roomId, "participants", session.uid);
    session.stateRef = stateRef;
    session.onlineUnsubs.push(fb.onSnapshot(session.roomRef, (snapshot) => {
      if (!session?.online || !snapshot.exists()) return;
      const data = snapshot.data();
      if (data.status === "cancelled") finishOnlineDisconnected("Der Host hat die Lobby beendet.");
      if (data.status === "finished" && !session.finished && !session.isHost) {
        const winner = session.players.find((p) => String(p.uid) === String(data.winnerUid)) || session.players.find((p) => p.id === Number(data.winnerId));
        if (winner) finishMatch(winner);
      }
    }));

    /* Jeder Browser empfängt die kleinen Eingabepakete aller anderen echten Spieler.
       Dadurch können Nicht-Hosts Bewegungen zwischen den langsameren autoritativen
       Spielständen selbst vorhersagen, statt auf jedes neue Bild vom Host zu warten. */
    session.onlineUnsubs.push(fb.onSnapshot(participantsRef, (snapshot) => {
      if (!session?.online) return;
      const receivedAt = performance.now();
      snapshot.docs.forEach((docSnap) => {
        if (docSnap.id === session.uid) return;
        const input = docSnap.data().input || {};
        const clientAt = Number(input.at || 0);
        const previous = session.remoteInputs[docSnap.id];
        if (previous && clientAt && clientAt <= Number(previous.clientAt || 0)) return;
        session.remoteInputs[docSnap.id] = {
          moveX: clamp(Number(input.moveX) || 0, -1, 1),
          moveY: clamp(Number(input.moveY) || 0, -1, 1),
          angle: Number(input.angle) || 0,
          firing: !!input.firing,
          bandageSeq: Number(input.bandageSeq) || 0,
          medipackSeq: Number(input.medipackSeq) || 0,
          at: receivedAt,
          clientAt
        };
      });
    }, (error) => {
      if (session?.online && session.isHost) finishOnlineDisconnected(`Spielereingaben verloren: ${error.message || error}`);
    }));

    if (!session.isHost) {
      session.onlineUnsubs.push(fb.onSnapshot(stateRef, (snapshot) => {
        if (!session?.online || session.isHost || !snapshot.exists()) return;
        applyOnlineSnapshot(snapshot.data());
      }, (error) => finishOnlineDisconnected(`Online-Synchronisierung verloren: ${error.message || error}`)));
    }
    session.heartbeatTimer = window.setInterval(() => {
      if (!session?.online || !session.participantRef || session.inputWriteInFlight || session.pendingInputWrite) return;
      fb.setDoc(session.participantRef, { lastSeenMs: Date.now() }, { merge: true }).catch(() => {});
    }, 5000);
  }

  function sendOnlineInput(now) {
    if (!session?.online || !session.wsConnected || session.ws?.readyState !== WebSocket.OPEN) return;
    if (now < session.inputAt) return;
    session.inputAt = now + CLOUDFLARE_INPUT_INTERVAL_MS;
    const input = session.localInput || { moveX: 0, moveY: 0, angle: 0, firing: false };
    const packet = {
      type: "input",
      seq: ++session.inputSequence,
      moveX: Math.round(clamp(input.moveX, -1, 1) * 1000) / 1000,
      moveY: Math.round(clamp(input.moveY, -1, 1) * 1000) / 1000,
      angle: Math.round(Number(input.angle || 0) * 10000) / 10000,
      firing: !!input.firing,
      bandageSeq: session.localSequences.bandage,
      medipackSeq: session.localSequences.medipack,
      clientTimeMs: Date.now()
    };
    try { session.ws.send(JSON.stringify(packet)); } catch (_) {}
    if (!session.lastPongAt || now - session.lastPongAt > 4000) {
      try { session.ws.send(JSON.stringify({ type: "ping", clientTimeMs: Date.now() })); } catch (_) {}
      session.lastPongAt = now;
    }
  }

  function flushOnlineInputWrite() {}

  function onlinePlayerPayload(player, now) {
    const elapsed = player.lastPayloadAt ? clamp((now - player.lastPayloadAt) / 1000, .016, .5) : 0;
    const moved = Math.hypot(player.x - player.lastPayloadX, player.y - player.lastPayloadY);
    let vx = elapsed ? (player.x - player.lastPayloadX) / elapsed : Number(player.netVx || 0);
    let vy = elapsed ? (player.y - player.lastPayloadY) / elapsed : Number(player.netVy || 0);
    if (player.health <= 0 || moved > 120) { vx = 0; vy = 0; }
    const maxVelocity = Math.max(220, Number(player.speed || 180) * 1.35);
    const velocityLength = Math.hypot(vx, vy);
    if (velocityLength > maxVelocity) { vx = vx / velocityLength * maxVelocity; vy = vy / velocityLength * maxVelocity; }
    player.lastPayloadX = player.x;
    player.lastPayloadY = player.y;
    player.lastPayloadAt = now;
    return {
      id: player.id, uid: player.uid || "", x: Math.round(player.x * 10) / 10, y: Math.round(player.y * 10) / 10,
      angle: Math.round(player.angle * 10000) / 10000, vx: Math.round(vx * 10) / 10, vy: Math.round(vy * 10) / 10,
      health: Math.round(player.health * 10) / 10, kills: player.kills, deaths: player.deaths, bandages: player.bandages, medipacks: player.medipacks, laserColor: player.laserColor,
      respawnAt: player.respawnAt ? Date.now() + Math.max(0, player.respawnAt - performance.now()) : 0,
      invulnerableFor: Math.max(0, Math.round(player.invulnerableUntil - performance.now())), muzzleFor: Math.max(0, Math.round(player.muzzleUntil - performance.now())), knifeFor: Math.max(0, Math.round(player.knifeUntil - performance.now())), connectionStale: !!player.connectionStale
    };
  }

  function packOnlineBullet(bullet) {
    return [
      String(bullet.id || ""), Number(bullet.ownerId) || 0,
      Math.round(bullet.x * 10) / 10, Math.round(bullet.y * 10) / 10,
      Math.round(bullet.vx * 10) / 10, Math.round(bullet.vy * 10) / 10,
      Number(bullet.damage) || 0, Math.max(0, Math.round(Number(bullet.life || 0) * 1000) / 1000),
      String(bullet.color || "#fff"), Number(bullet.width) || 2, bullet.sniper ? 1 : 0
    ];
  }

  function publishOnlineSnapshot(now, force = false) {
    if (!session?.online || !session.isHost) return;
    const active = session.bullets.length > 0 || session.players.some((player) => player.health <= 0 || now < player.muzzleUntil || Math.abs(session.remoteInputs[player.uid]?.moveX || 0) > .01 || Math.abs(session.remoteInputs[player.uid]?.moveY || 0) > .01 || session.remoteInputs[player.uid]?.firing);
    const interval = active ? ONLINE_SNAPSHOT_ACTIVE_MS : ONLINE_SNAPSHOT_IDLE_MS;
    if (!force && now < session.snapshotAt) return;
    session.snapshotAt = now + interval;
    const snapshotStampMs = Math.max(Date.now(), Number(session.lastSnapshotStampMs || 0) + 1);
    session.lastSnapshotStampMs = snapshotStampMs;
    session.pendingSnapshotWrite = {
      version: VERSION,
      mapId: session.map.id,
      updatedAtMs: snapshotStampMs,
      players: session.players.map((player) => onlinePlayerPayload(player, now)),
      bullets: session.bullets.slice(-48).map(packOnlineBullet),
      finished: !!session.finished,
      winnerId: session.winner?.id ?? null,
      winnerUid: session.winner?.uid || ""
    };
    flushOnlineSnapshotWrite(session);
  }

  function flushOnlineSnapshotWrite(activeSession) {
    if (!activeSession?.online || !activeSession.isHost || activeSession.snapshotWriteInFlight || !activeSession.pendingSnapshotWrite) return;
    const payload = activeSession.pendingSnapshotWrite;
    activeSession.pendingSnapshotWrite = null;
    activeSession.snapshotWriteInFlight = true;
    const ref = activeSession.stateRef || activeSession.fb.doc(activeSession.fb.db, "arenaKlRooms", activeSession.roomId, "state", "live");
    activeSession.fb.setDoc(ref, payload)
      .catch((error) => console.warn("Arena.KL Snapshot", error))
      .finally(() => {
        activeSession.snapshotWriteInFlight = false;
        if (session === activeSession && activeSession.pendingSnapshotWrite) flushOnlineSnapshotWrite(activeSession);
      });
  }

  function decodeOnlineBullet(raw, index) {
    if (Array.isArray(raw)) return {
      id: String(raw[0] || `net-${index}`), ownerId: Number(raw[1]) || 0, x: Number(raw[2]) || 0, y: Number(raw[3]) || 0,
      vx: Number(raw[4]) || 0, vy: Number(raw[5]) || 0, damage: Number(raw[6]) || 0, life: Math.max(0, Number(raw[7]) || 0),
      color: String(raw[8] || "#fff"), width: Number(raw[9]) || 2, sniper: !!raw[10]
    };
    return {
      id: String(raw?.id || `legacy-${raw?.ownerId || 0}-${index}`), ownerId: Number(raw?.ownerId) || 0,
      x: Number(raw?.x) || 0, y: Number(raw?.y) || 0, vx: Number(raw?.vx) || 0, vy: Number(raw?.vy) || 0,
      damage: Number(raw?.damage) || 0, life: Math.max(0, Number(raw?.life) || 0), color: String(raw?.color || "#fff"), width: Number(raw?.width) || 2, sniper: !!raw?.sniper
    };
  }

  function reconcileOnlineBullets(rawBullets, sentAtMs, now) {
    const ageSeconds = clamp((Date.now() - Number(sentAtMs || Date.now())) / 1000, 0, .42);
    const existing = new Map(session.bullets.map((bullet) => [String(bullet.id || ""), bullet]));
    const seen = new Set();
    (Array.isArray(rawBullets) ? rawBullets.slice(-48) : []).forEach((raw, index) => {
      const incoming = decodeOnlineBullet(raw, index);
      const id = String(incoming.id);
      seen.add(id);
      const predictedX = incoming.x + incoming.vx * ageSeconds;
      const predictedY = incoming.y + incoming.vy * ageSeconds;
      const predictedLife = Math.max(0, incoming.life - ageSeconds);
      let bullet = existing.get(id);
      if (!bullet) {
        bullet = { ...incoming, id, x: predictedX, y: predictedY, targetX: predictedX, targetY: predictedY, life: predictedLife, netSeenAt: now };
        existing.set(id, bullet);
      } else {
        bullet.ownerId = incoming.ownerId;
        bullet.vx = incoming.vx;
        bullet.vy = incoming.vy;
        bullet.damage = incoming.damage;
        bullet.color = incoming.color;
        bullet.width = incoming.width;
        bullet.sniper = incoming.sniper;
        bullet.targetX = predictedX;
        bullet.targetY = predictedY;
        bullet.life = Math.min(Math.max(bullet.life, predictedLife), predictedLife + .14);
        bullet.netSeenAt = now;
        if (Math.hypot(predictedX - bullet.x, predictedY - bullet.y) > 105) { bullet.x = predictedX; bullet.y = predictedY; }
      }
    });
    session.bullets = [...existing.values()].filter((bullet) => bullet.life > 0 && (seen.has(String(bullet.id)) || now - Number(bullet.netSeenAt || 0) < ONLINE_BULLET_GRACE_MS)).slice(-64);
  }

  function applyOnlineSnapshot(data) {
    if (!session?.online || !Array.isArray(data?.players)) return;
    const snapshotAtMs = Number(data.updatedAtMs) || 0;
    if (snapshotAtMs && snapshotAtMs <= session.lastAppliedSnapshotAtMs) return;
    if (snapshotAtMs) session.lastAppliedSnapshotAtMs = snapshotAtMs;
    const now = performance.now();
    const snapshotAgeSeconds = clamp((Date.now() - Number(data.updatedAtMs || Date.now())) / 1000, 0, ONLINE_REMOTE_PREDICTION_MS / 1000);
    const local = session.players[0];
    const byUid = new Map(session.players.map((player) => [String(player.uid), player]));
    data.players.forEach((incoming) => {
      const player = byUid.get(String(incoming.uid)) || session.players.find((entry) => entry.id === Number(incoming.id));
      if (!player) return;
      const baseX = Number.isFinite(Number(incoming.x)) ? Number(incoming.x) : player.x;
      const baseY = Number.isFinite(Number(incoming.y)) ? Number(incoming.y) : player.y;
      const netVx = Number(incoming.vx) || 0;
      const netVy = Number(incoming.vy) || 0;
      const predictedX = clamp(baseX + netVx * snapshotAgeSeconds, PLAYER_RADIUS + 12, WORLD_SIZE - PLAYER_RADIUS - 12);
      const predictedY = clamp(baseY + netVy * snapshotAgeSeconds, PLAYER_RADIUS + 12, WORLD_SIZE - PLAYER_RADIUS - 12);
      const incomingHealth = Math.max(0, Number(incoming.health) || 0);
      const wasDead = player.health <= 0;
      const respawned = wasDead && incomingHealth > 0;
      const divergence = Math.hypot(predictedX - player.x, predictedY - player.y);
      player.netVx = netVx;
      player.netVy = netVy;
      player.lastAuthorityAt = now;
      if (player === local) {
        /* Lokale Vorhersage bleibt flüssig; der Cloudflare-Server korrigiert
           Wände und Treffer sanft, bei großen Abweichungen sofort. */
        if (incomingHealth <= 0 || respawned || divergence > 145) {
          player.x = predictedX;
          player.y = predictedY;
        }
        player.targetX = predictedX;
        player.targetY = predictedY;
      } else {
        player.targetX = predictedX;
        player.targetY = predictedY;
        player.targetAngle = Number(incoming.angle) || 0;
      }
      if (player !== local || incomingHealth <= 0 || respawned) player.angle = Number(incoming.angle) || player.angle;
      player.health = incomingHealth;
      player.maxHealth = 100;
      player.kills = Number(incoming.kills) || 0;
      player.deaths = Number(incoming.deaths) || 0;
      player.bandages = Number(incoming.bandages) || 0;
      player.medipacks = Number(incoming.medipacks) || 0;
      player.laserColor = String(incoming.laserColor || "");
      player.respawnAt = incoming.respawnAt ? now + Math.max(0, Number(incoming.respawnAt) - Date.now()) : 0;
      player.invulnerableUntil = now + Math.max(0, Number(incoming.invulnerableFor) || 0);
      player.muzzleUntil = Math.max(player.muzzleUntil || 0, now + Math.max(0, Number(incoming.muzzleFor) || 0));
      player.knifeUntil = Math.max(player.knifeUntil || 0, now + Math.max(0, Number(incoming.knifeFor) || 0));
      player.connectionStale = !!incoming.connectionStale;
      player.onlineFallback = false;
    });
    session.lastSnapshotAt = now;
    reconcileOnlineBullets(data.bullets, data.updatedAtMs, now);
    if (data.finished && !session.finished) {
      const winner = session.players.find((p) => String(p.uid) === String(data.winnerUid)) || session.players.find((p) => p.id === Number(data.winnerId));
      if (winner) finishMatch(winner);
    }
  }

  function frame(now) {
    if (!session) return;
    const dt = Math.min(.035, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    if (session.running && !session.paused && !session.finished) update(dt, now);
    if (now - session.lastDrawAt >= session.renderInterval) {
      draw(now);
      session.lastDrawAt = now;
      if (now - session.hudAt > 110) { updateHud(false); session.hudAt = now; }
    }
    rafId = requestAnimationFrame(frame);
  }

  function update(dt, now) {
    updateHuman(dt, now);
    if (session.online) sendOnlineInput(now);
    if (session.online) {
      updateRemoteInterpolation(dt, now);
      updateClientBullets(dt);
      updateParticles(dt);
      const firstSnapshotMissing = !session.lastSnapshotAt && now - session.startedAt > ONLINE_FIRST_SNAPSHOT_TIMEOUT_MS;
      const snapshotStale = session.lastSnapshotAt && now - session.lastSnapshotAt > ONLINE_SNAPSHOT_TIMEOUT_MS;
      if (firstSnapshotMissing || snapshotStale) finishOnlineDisconnected("Vom Cloudflare-Server kommen keine aktuellen Spieldaten mehr.");
      return;
    }
    session.players.filter((p) => p.bot).forEach((bot) => updateBot(bot, dt, now));
    updateBullets(dt, now);
    updateParticles(dt);
    session.players.forEach((player) => { if (player.health <= 0 && player.respawnAt && now >= player.respawnAt && !session.finished) respawnPlayer(player, now); });
  }

  function updateClientBullets(dt) {
    const blend = 1 - Math.exp(-18 * dt);
    for (const bullet of session.bullets) {
      const previousX = bullet.x;
      const previousY = bullet.y;
      bullet.x += Number(bullet.vx || 0) * dt;
      bullet.y += Number(bullet.vy || 0) * dt;
      if (Number.isFinite(bullet.targetX) && Number.isFinite(bullet.targetY)) {
        bullet.targetX += Number(bullet.vx || 0) * dt;
        bullet.targetY += Number(bullet.vy || 0) * dt;
        bullet.x += (bullet.targetX - bullet.x) * blend;
        bullet.y += (bullet.targetY - bullet.y) * blend;
      }
      bullet.life = Math.max(0, Number(bullet.life || 0) - dt);
      if (segmentHitsWall(previousX, previousY, bullet.x, bullet.y)) bullet.life = 0;
    }
    session.bullets = session.bullets.filter((bullet) => bullet.life > 0 && bullet.x >= 0 && bullet.y >= 0 && bullet.x <= WORLD_SIZE && bullet.y <= WORLD_SIZE).slice(-64);
  }

  function advanceRemoteTarget(player, dx, dy) {
    const min = PLAYER_RADIUS + 12;
    const max = WORLD_SIZE - PLAYER_RADIUS - 12;
    const nextX = clamp(player.targetX + dx, min, max);
    if (!circleHitsWall(nextX, player.targetY, PLAYER_RADIUS)) player.targetX = nextX;
    const nextY = clamp(player.targetY + dy, min, max);
    if (!circleHitsWall(player.targetX, nextY, PLAYER_RADIUS)) player.targetY = nextY;
  }

  function updateRemoteInterpolation(dt, now) {
    const local = session.players[0];
    const localBlend = 1 - Math.exp(-2.4 * dt);
    for (const player of session.players) {
      if (player === local) {
        if (Number.isFinite(player.targetX) && Number.isFinite(player.targetY) && player.health > 0) {
          const divergence = Math.hypot(player.targetX - player.x, player.targetY - player.y);
          if (divergence > 145) {
            player.x = player.targetX;
            player.y = player.targetY;
          } else if (divergence > 3) {
            const correction = 1 - Math.exp(-(divergence > 55 ? 12 : 5.5) * dt);
            player.x += (player.targetX - player.x) * correction;
            player.y += (player.targetY - player.y) * correction;
          }
        }
        continue;
      }

      const packet = session.remoteInputs[player.uid];
      const packetFresh = packet && now - Number(packet.at || 0) < 1350;
      const moveX = packetFresh ? clamp(packet.moveX, -1, 1) : 0;
      const moveY = packetFresh ? clamp(packet.moveY, -1, 1) : 0;
      if (packetFresh) {
        advanceRemoteTarget(player, moveX * player.speed * dt, moveY * player.speed * dt);
        player.targetAngle = Number.isFinite(packet.angle) ? packet.angle : player.targetAngle;
      } else if (now - Number(player.lastAuthorityAt || 0) < 650) {
        advanceRemoteTarget(player, Number(player.netVx || 0) * dt, Number(player.netVy || 0) * dt);
      }

      if (Number.isFinite(player.targetX) && Number.isFinite(player.targetY)) {
        const divergence = Math.hypot(player.targetX - player.x, player.targetY - player.y);
        if (divergence > 250) {
          player.x = player.targetX;
          player.y = player.targetY;
        } else {
          const rate = divergence > 80 ? 24 : 16;
          const blend = 1 - Math.exp(-rate * dt);
          player.x += (player.targetX - player.x) * blend;
          player.y += (player.targetY - player.y) * blend;
        }
      }
      if (Number.isFinite(player.targetAngle)) {
        const angleBlend = 1 - Math.exp(-20 * dt);
        player.angle += normalizeAngle(player.targetAngle - player.angle) * angleBlend;
      }
    }
  }

  function localControlInput() {
    let moveX = session.moveInput.x + (keyboard.d || keyboard.arrowright ? 1 : 0) - (keyboard.a || keyboard.arrowleft ? 1 : 0);
    let moveY = session.moveInput.y + (keyboard.s || keyboard.arrowdown ? 1 : 0) - (keyboard.w || keyboard.arrowup ? 1 : 0);
    const length = Math.hypot(moveX, moveY); if (length > 1) { moveX /= length; moveY /= length; }
    let angle = session.players[0]?.angle || 0;
    if (session.stickFiring && Math.hypot(session.aimInput.x, session.aimInput.y) > .2) angle = Math.atan2(session.aimInput.y, session.aimInput.x);
    else if (mouse.active) angle = Math.atan2(mouse.y - CANVAS_SIZE / 2, mouse.x - CANVAS_SIZE / 2);
    return { moveX, moveY, angle, firing: !!(session.stickFiring || mouse.down || keyboard[" "]) };
  }

  function updateHuman(dt, now) {
    const player = session.players[0];
    if (!player) return;
    if (player.health <= 0) {
      player.netVx = 0;
      player.netVy = 0;
      session.localInput = { moveX: 0, moveY: 0, angle: player.angle || 0, firing: false };
      return;
    }
    const input = localControlInput();
    player.angle = input.angle;
    player.netVx = input.moveX * player.speed;
    player.netVy = input.moveY * player.speed;
    /* Der Nicht-Host bewegt sich lokal nur gegen Wände. Kollisionen mit anderen
       Spielern entscheidet weiterhin der Host; dadurch ruckelt die eigene Kamera
       nicht mehr an verspäteten Online-Positionen. */
    moveEntity(player, player.netVx * dt, player.netVy * dt, !session.online);
    session.localInput = input;
    if (input.firing && !session.online) {
      tryShoot(player, now);
    } else if (input.firing && session.online && now >= player.localFxNextShot) {
      const weapon = weaponFor(player);
      player.localFxNextShot = now + weapon.fireDelay;
      player.muzzleUntil = now + 75;
      if (weapon.melee) player.knifeUntil = now + 180;
      else addMuzzleParticles(player, weapon);
    }
  }

  function updateRemotePlayer(player, dt, now) {
    if (!player || player.health <= 0) return;
    const packet = session.remoteInputs[player.uid];
    const packetAge = packet ? now - Number(packet.at || 0) : Number.POSITIVE_INFINITY;
    if (!packet || packetAge > ONLINE_REMOTE_STALE_MS) {
      player.connectionStale = true;
      player.onlineFallback = false;
      player.netVx = 0;
      player.netVy = 0;
      return;
    }
    player.connectionStale = false;
    player.onlineFallback = false;
    player.angle = Number.isFinite(packet.angle) ? packet.angle : player.angle;
    player.netVx = clamp(packet.moveX, -1, 1) * player.speed;
    player.netVy = clamp(packet.moveY, -1, 1) * player.speed;
    moveEntity(player, player.netVx * dt, player.netVy * dt);
    if (packet.firing) tryShoot(player, now);
    if (packet.bandageSeq > player.processedBandageSeq) { player.processedBandageSeq = packet.bandageSeq; useHealingItem(player, "bandage", now, false); }
    if (packet.medipackSeq > player.processedMedipackSeq) { player.processedMedipackSeq = packet.medipackSeq; useHealingItem(player, "medipack", now, false); }
  }

  function updateBot(bot, dt, now) {
    if (bot.health <= 0) return;
    const difficulty = botDifficultyConfig(session?.botDifficulty);
    if (bot.health < (difficulty.id === "hard" ? 62 : 42) && bot.bandages > 0 && now >= bot.healCooldownUntil && Math.random() < difficulty.healChance) useHealingItem(bot, "bandage", now, false);
    if (now >= bot.aiThinkAt) {
      bot.aiThinkAt = now + difficulty.thinkMin + Math.random() * Math.max(1, difficulty.thinkMax - difficulty.thinkMin);
      const targets = session.players.filter((p) => p.id !== bot.id && p.health > 0).sort((a, b) => distance(bot, a) - distance(bot, b));
      bot.targetId = targets[0]?.id ?? null;
    }
    const target = session.players.find((p) => p.id === bot.targetId && p.health > 0);
    const weapon = weaponFor(bot);
    if (target) {
      const dx = target.x - bot.x, dy = target.y - bot.y, dist = Math.hypot(dx, dy) || 1;
      const sees = dist <= Math.min(weapon.range + 150, difficulty.sight) && lineOfSight(bot.x, bot.y, target.x, target.y);
      if (sees) {
        const prediction = difficulty.id === "hard" ? clamp(dist / Math.max(weapon.bulletSpeed || 900, 1), 0, .42) : 0;
        const aimX = target.x + Number(target.netVx || 0) * prediction;
        const aimY = target.y + Number(target.netVy || 0) * prediction;
        bot.angle = Math.atan2(aimY - bot.y, aimX - bot.x) + (Math.random() - .5) * difficulty.aimError;
        if (now >= bot.strafeAt) { bot.strafeAt = now + (difficulty.id === "hard" ? 260 : 600) + Math.random() * (difficulty.id === "easy" ? 1200 : 700); bot.strafe *= -1; }
        const preferred = weapon.melee ? 28 : weapon.id === "shotgun" ? 190 : weapon.id === "sniper" ? 390 : 280;
        let forward = dist > preferred + 45 ? difficulty.chase : dist < preferred - 55 ? -difficulty.chase * .75 : 0;
        if (weapon.melee) forward = difficulty.chase;
        const side = bot.strafe * difficulty.strafe;
        moveEntity(bot, ((dx / dist) * forward + (-dy / dist) * side) * bot.speed * dt, ((dy / dist) * forward + (dx / dist) * side) * bot.speed * dt);
        if (Math.random() < difficulty.fireChance) tryShoot(bot, now);
        return;
      }
    }
    updateBotWander(bot, dt * (difficulty.id === "easy" ? .62 : difficulty.id === "hard" ? 1.08 : .9), now, target);
  }

  function updateBotWander(bot, dt, now, target) {
    if (!bot.waypoint || now >= bot.waypointAt || Math.hypot(bot.waypoint.x - bot.x, bot.waypoint.y - bot.y) < 35) { bot.waypointAt = now + 1700 + Math.random() * 2100; bot.waypoint = target && Math.random() < .68 ? { x: target.x + (Math.random() - .5) * 170, y: target.y + (Math.random() - .5) * 170 } : randomOpenPoint(); }
    let dx = bot.waypoint.x - bot.x, dy = bot.waypoint.y - bot.y; const dist = Math.hypot(dx, dy) || 1; dx /= dist; dy /= dist; bot.angle = Math.atan2(dy, dx);
    const beforeX = bot.x, beforeY = bot.y; moveEntity(bot, dx * bot.speed * .82 * dt, dy * bot.speed * .82 * dt);
    if (Math.hypot(bot.x - beforeX, bot.y - beforeY) < .1) { bot.waypointAt = 0; bot.angle += (Math.random() > .5 ? 1 : -1) * Math.PI / 2; moveEntity(bot, Math.cos(bot.angle) * bot.speed * dt, Math.sin(bot.angle) * bot.speed * dt); }
  }

  function moveEntity(entity, dx, dy, resolvePlayers = true) {
    const min = PLAYER_RADIUS + 12, max = WORLD_SIZE - PLAYER_RADIUS - 12;
    const nextX = clamp(entity.x + dx, min, max); if (!circleHitsWall(nextX, entity.y, PLAYER_RADIUS)) entity.x = nextX;
    const nextY = clamp(entity.y + dy, min, max); if (!circleHitsWall(entity.x, nextY, PLAYER_RADIUS)) entity.y = nextY;
    if (!resolvePlayers) return;
    for (const other of session.players) { if (other === entity || other.health <= 0) continue; const dx2 = entity.x - other.x, dy2 = entity.y - other.y, dist = Math.hypot(dx2, dy2) || 1, minDist = PLAYER_RADIUS * 1.72; if (dist < minDist) { const push = (minDist - dist) * .38; entity.x = clamp(entity.x + dx2 / dist * push, min, max); entity.y = clamp(entity.y + dy2 / dist * push, min, max); } }
  }

  function tryShoot(player, now) {
    if (!player || player.health <= 0 || now < player.nextShot || session.finished) return;
    const weapon = weaponFor(player); player.nextShot = now + weapon.fireDelay; player.muzzleUntil = now + 75;
    if (weapon.melee) { player.knifeUntil = now + 180; meleeAttack(player, weapon, now); return; }
    for (let pellet = 0; pellet < weapon.pellets; pellet += 1) {
      const angle = player.angle + (Math.random() - .5) * weapon.spread;
      session.bullets.push({ id: `${player.id}-${session.nextBulletId++}`, ownerId: player.id, x: player.x + Math.cos(angle) * weapon.barrel, y: player.y + Math.sin(angle) * weapon.barrel, vx: Math.cos(angle) * weapon.bulletSpeed, vy: Math.sin(angle) * weapon.bulletSpeed, damage: weapon.damage, life: weapon.range / weapon.bulletSpeed, color: player.color, width: weapon.id === "sniper" ? 3.4 : 2.1, sniper: weapon.id === "sniper" });
    }
    addMuzzleParticles(player, weapon);
  }

  function meleeAttack(player, weapon, now) {
    let hit = false;
    for (const target of session.players.filter((p) => p.id !== player.id && p.health > 0 && now >= p.invulnerableUntil)) {
      if (distance(player, target) > weapon.range) continue;
      if (Math.abs(normalizeAngle(Math.atan2(target.y - player.y, target.x - player.x) - player.angle)) > .72) continue;
      damagePlayer(target, weapon.damage, player, now); hit = true;
    }
    const tipX = player.x + Math.cos(player.angle) * 36, tipY = player.y + Math.sin(player.angle) * 36;
    for (let i = 0; i < (hit ? 10 : 4); i += 1) session.particles.push({ x: tipX, y: tipY, vx: (Math.random() - .5) * 90, vy: (Math.random() - .5) * 90, life: .25, size: 2 + Math.random() * 3, color: hit ? "#ef6d67" : "#f3d475" });
  }

  function updateBullets(dt, now) {
    for (const bullet of session.bullets) {
      if (bullet.life <= 0) continue;
      const px = bullet.x, py = bullet.y; bullet.x += bullet.vx * dt; bullet.y += bullet.vy * dt; bullet.life -= dt;
      if (bullet.x < 0 || bullet.y < 0 || bullet.x > WORLD_SIZE || bullet.y > WORLD_SIZE || segmentHitsWall(px, py, bullet.x, bullet.y)) { bullet.life = 0; addImpactParticles(bullet.x, bullet.y, "#d3bd79", 4); continue; }
      for (const player of session.players) {
        if (player.id === bullet.ownerId || player.health <= 0 || now < player.invulnerableUntil) continue;
        if (segmentCircleHit(px, py, bullet.x, bullet.y, player.x, player.y, PLAYER_RADIUS)) { bullet.life = 0; damagePlayer(player, bullet.damage, session.players.find((p) => p.id === bullet.ownerId), now); addImpactParticles(bullet.x, bullet.y, "#ef766d", bullet.sniper ? 12 : 7); break; }
      }
    }
    session.bullets = session.bullets.filter((b) => b.life > 0).slice(-160);
  }

  function damagePlayer(target, damage, attacker, now) {
    target.health = Math.max(0, target.health - damage); if (target.health > 0) return;
    target.deaths += 1; target.respawnAt = now + 1450; target.nextShot = now + 1600; addImpactParticles(target.x, target.y, target.color, 20);
    if (attacker && attacker.id !== target.id) { attacker.kills += 1; if (attacker.kills >= WIN_KILLS) finishMatch(attacker); }
  }

  function respawnPlayer(player, now) {
    const spawn = bestSpawnFor(player); player.x = spawn.x; player.y = spawn.y; player.health = player.maxHealth; player.respawnAt = 0; player.invulnerableUntil = now + 1800; player.angle = Math.random() * Math.PI * 2;
  }

  function bestSpawnFor(player) {
    const enemies = session.players.filter((p) => p.id !== player.id && p.health > 0);
    return [...session.map.spawns].sort((a, b) => enemies.reduce((sum, e) => sum + Math.min(500, Math.hypot(b.x - e.x, b.y - e.y)), 0) - enemies.reduce((sum, e) => sum + Math.min(500, Math.hypot(a.x - e.x, a.y - e.y)), 0))[0];
  }

  function randomOpenPoint() {
    for (let attempt = 0; attempt < 60; attempt += 1) { const point = { x: 55 + Math.random() * 890, y: 55 + Math.random() * 890 }; if (!circleHitsWall(point.x, point.y, PLAYER_RADIUS + 8)) return point; }
    return session.map.spawns[Math.floor(Math.random() * session.map.spawns.length)];
  }

  function requestUseItem(type) {
    if (!session || session.finished) return;
    const player = session.players[0];
    if (!player || player.health <= 0) return;
    const now = performance.now();
    if (session.online) {
      const key = type === "bandage" ? "bandages" : "medipacks";
      if (player[key] <= 0) return;
      if (now < player.healCooldownUntil || player.health >= player.maxHealth) return;
      const data = ensureArenaState();
      if (data[key] <= 0) return;
      data[key] -= 1; player[key] -= 1; player.health = Math.min(player.maxHealth, player.health + (type === "bandage" ? 25 : 55)); player.healCooldownUntil = now + 1800;
      session.localSequences[type] += 1; safeSave(); updateHud(true); return;
    }
    useHealingItem(player, type, now, true);
  }

  function useHealingItem(player, type, now, persistHuman) {
    const key = type === "bandage" ? "bandages" : "medipacks";
    const heal = type === "bandage" ? 25 : 55;
    if (!player || player.health <= 0 || player.health >= player.maxHealth || player[key] <= 0 || now < player.healCooldownUntil) return false;
    player[key] -= 1; player.health = Math.min(player.maxHealth, player.health + heal); player.healCooldownUntil = now + 1800;
    for (let i = 0; i < 14; i += 1) session.particles.push({ x: player.x, y: player.y, vx: (Math.random() - .5) * 75, vy: -20 - Math.random() * 90, life: .45, size: 2 + Math.random() * 3, color: "#69e49b" });
    if (persistHuman && player.human) { const data = ensureArenaState(); data[key] = Math.max(0, data[key] - 1); safeSave(); }
    return true;
  }

  function bindGameControls() {
    const canvas = session?.canvas; if (!canvas || !overlay) return;
    window.addEventListener("keydown", onKeyDown, { passive: false }); window.addEventListener("keyup", onKeyUp, { passive: false });
    canvas.addEventListener("pointermove", onCanvasPointerMove); canvas.addEventListener("pointerdown", onCanvasPointerDown); canvas.addEventListener("pointerup", onCanvasPointerUp); canvas.addEventListener("pointercancel", onCanvasPointerUp); canvas.addEventListener("contextmenu", preventContext);
    overlay.querySelectorAll("[data-arena-stick]").forEach((stick) => {
      const cleanStick = stick.cloneNode(true);
      stick.replaceWith(cleanStick);
      bindStick(cleanStick);
    });
    if (typeof ResizeObserver === "function") { resizeObserver = new ResizeObserver(() => updatePointerAimFromMouse()); resizeObserver.observe(canvas); }
  }

  function unbindGameControls() {
    window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); if (resizeObserver) resizeObserver.disconnect(); resizeObserver = null;
    const canvas = session?.canvas || overlay?.querySelector("[data-arena-canvas]"); if (canvas) { canvas.removeEventListener("pointermove", onCanvasPointerMove); canvas.removeEventListener("pointerdown", onCanvasPointerDown); canvas.removeEventListener("pointerup", onCanvasPointerUp); canvas.removeEventListener("pointercancel", onCanvasPointerUp); canvas.removeEventListener("contextmenu", preventContext); }
  }

  function preventContext(event) { event.preventDefault(); }
  function onKeyDown(event) { if (!session || session.finished) return; const key = String(event.key || "").toLowerCase(); if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault(); if (key === "escape" || key === "p") return togglePause(); if (key === "b") requestUseItem("bandage"); if (key === "h") requestUseItem("medipack"); keyboard[key] = true; if (key === " ") mouse.down = true; }
  function onKeyUp(event) { const key = String(event.key || "").toLowerCase(); keyboard[key] = false; if (key === " ") mouse.down = false; }
  function canvasPoint(event) { const rect = session.canvas.getBoundingClientRect(); return { x: (event.clientX - rect.left) * CANVAS_SIZE / rect.width, y: (event.clientY - rect.top) * CANVAS_SIZE / rect.height }; }
  function onCanvasPointerMove(event) { if (!session || event.pointerType === "touch") return; const point = canvasPoint(event); mouse.x = point.x; mouse.y = point.y; mouse.active = true; }
  function onCanvasPointerDown(event) { if (!session || event.pointerType === "touch") return; event.preventDefault(); const point = canvasPoint(event); mouse.x = point.x; mouse.y = point.y; mouse.active = true; mouse.down = true; }
  function onCanvasPointerUp(event) { if (event.pointerType !== "touch") mouse.down = false; }
  function updatePointerAimFromMouse() { if (!session || !mouse.active) return; session.players[0].angle = Math.atan2(mouse.y - CANVAS_SIZE / 2, mouse.x - CANVAS_SIZE / 2); }

  function bindStick(stick) {
    const type = stick.dataset.arenaStick, knob = stick.querySelector(".arena-kl-stick-knob"); let pointerId = null;
    const updateStick = (event) => { if (!session || pointerId !== event.pointerId) return; const rect = stick.getBoundingClientRect(), cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2; let dx = event.clientX - cx, dy = event.clientY - cy; const max = rect.width * .3, length = Math.hypot(dx, dy) || 1, scale = Math.min(1, max / length); dx *= scale; dy *= scale; knob.style.transform = `translate3d(${dx}px,${dy}px,0)`; const nx = clamp(dx / max, -1, 1), ny = clamp(dy / max, -1, 1); if (type === "move") session.moveInput = { x: nx, y: ny }; else { session.aimInput = { x: nx, y: ny }; session.stickFiring = Math.hypot(nx, ny) > .28; } };
    const end = (event) => { if (pointerId !== event.pointerId) return; pointerId = null; knob.style.transform = "translate3d(0,0,0)"; if (type === "move" && session) session.moveInput = { x: 0, y: 0 }; if (type === "aim" && session) session.stickFiring = false; };
    stick.addEventListener("pointerdown", (event) => { event.preventDefault(); pointerId = event.pointerId; stick.setPointerCapture?.(pointerId); updateStick(event); }); stick.addEventListener("pointermove", updateStick); stick.addEventListener("pointerup", end); stick.addEventListener("pointercancel", end); stick.addEventListener("lostpointercapture", end);
  }

  function draw(now) {
    if (!session) return;
    const ctx = session.ctx, human = session.players[0], camera = { x: human.x, y: human.y };
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE); ctx.save(); ctx.beginPath(); ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 4, 0, Math.PI * 2); ctx.clip(); drawFogBase(ctx);
    if (!session.visibility.length || now - session.visibilityAt > session.visibilityInterval || Math.hypot(human.x - session.visibilityX, human.y - session.visibilityY) > 4) {
      session.visibility = visibilityPolygon(human.x, human.y, VIEW_RADIUS - 15, session.visibilityRays);
      session.visibilityAt = now;
      session.visibilityX = human.x;
      session.visibilityY = human.y;
    }
    ctx.save(); clipVisibility(ctx, session.visibility, camera); drawVisibleWorld(ctx, camera, now); ctx.restore(); drawVisionEdge(ctx, session.visibility, camera); if (human.health > 0) drawPlayer(ctx, human, camera, now); drawRadar(ctx, human); drawKillBadge(ctx, human); ctx.restore();
    ctx.save(); ctx.strokeStyle = "rgba(222,182,82,.75)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 5, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }

  function buildMapCache(map) {
    const canvas = document.createElement("canvas");
    canvas.width = WORLD_SIZE;
    canvas.height = WORLD_SIZE;
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.fillStyle = map.floor;
    ctx.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);
    ctx.strokeStyle = "rgba(255,255,255,.035)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= WORLD_SIZE; x += 48) { ctx.moveTo(x, 0); ctx.lineTo(x, WORLD_SIZE); }
    for (let y = 0; y <= WORLD_SIZE; y += 48) { ctx.moveTo(0, y); ctx.lineTo(WORLD_SIZE, y); }
    ctx.stroke();
    for (const wall of map.walls) {
      const gradient = ctx.createLinearGradient(wall.x, wall.y, wall.x, wall.y + wall.h);
      gradient.addColorStop(0, map.wallTop);
      gradient.addColorStop(.18, map.wallBottom);
      gradient.addColorStop(1, "#171b17");
      ctx.fillStyle = "rgba(0,0,0,.42)";
      ctx.fillRect(wall.x + 8, wall.y + 10, wall.w, wall.h);
      ctx.fillStyle = gradient;
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      ctx.strokeStyle = "rgba(210,215,185,.22)";
      ctx.lineWidth = 2;
      ctx.strokeRect(wall.x + 1, wall.y + 1, wall.w - 2, wall.h - 2);
    }
    for (const crate of map.crates) {
      ctx.fillStyle = "#4b3826";
      ctx.fillRect(crate.x, crate.y, crate.s, crate.s);
      ctx.strokeStyle = "#82613d";
      ctx.lineWidth = 2;
      ctx.strokeRect(crate.x + 1, crate.y + 1, crate.s - 2, crate.s - 2);
      ctx.beginPath();
      ctx.moveTo(crate.x + 4, crate.y + 4);
      ctx.lineTo(crate.x + crate.s - 4, crate.y + crate.s - 4);
      ctx.moveTo(crate.x + crate.s - 4, crate.y + 4);
      ctx.lineTo(crate.x + 4, crate.y + crate.s - 4);
      ctx.stroke();
    }
    return canvas;
  }

  function drawFogBase(ctx) { const gradient = ctx.createRadialGradient(360, 360, 40, 360, 360, 360); gradient.addColorStop(0, "#101912"); gradient.addColorStop(.55, "#070d09"); gradient.addColorStop(1, "#010302"); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 720, 720); }
  function drawVisibleWorld(ctx, camera, now) { if (session.mapCache) ctx.drawImage(session.mapCache, worldToScreenX(0, camera), worldToScreenY(0, camera)); else { drawFloor(ctx, camera); drawWalls(ctx, camera); drawCrates(ctx, camera); } drawBullets(ctx, camera); drawParticles(ctx, camera); for (const player of session.players) { if (player.human || player.health <= 0) continue; if (distance(session.players[0], player) <= VIEW_RADIUS - 12 && lineOfSight(session.players[0].x, session.players[0].y, player.x, player.y)) drawPlayer(ctx, player, camera, now); } }
  function drawFloor(ctx, camera) { ctx.fillStyle = session.map.floor; ctx.fillRect(worldToScreenX(0, camera), worldToScreenY(0, camera), WORLD_SIZE, WORLD_SIZE); ctx.strokeStyle = "rgba(255,255,255,.035)"; ctx.lineWidth = 1; ctx.beginPath(); for (let x = Math.floor((camera.x - VIEW_RADIUS) / 48) * 48; x <= camera.x + VIEW_RADIUS; x += 48) { const sx = worldToScreenX(x, camera); ctx.moveTo(sx, 0); ctx.lineTo(sx, 720); } for (let y = Math.floor((camera.y - VIEW_RADIUS) / 48) * 48; y <= camera.y + VIEW_RADIUS; y += 48) { const sy = worldToScreenY(y, camera); ctx.moveTo(0, sy); ctx.lineTo(720, sy); } ctx.stroke(); }
  function drawWalls(ctx, camera) { for (const wall of session.map.walls) { const x = worldToScreenX(wall.x, camera), y = worldToScreenY(wall.y, camera), gradient = ctx.createLinearGradient(x, y, x, y + wall.h); gradient.addColorStop(0, session.map.wallTop); gradient.addColorStop(.18, session.map.wallBottom); gradient.addColorStop(1, "#171b17"); ctx.fillStyle = "rgba(0,0,0,.42)"; ctx.fillRect(x + 8, y + 10, wall.w, wall.h); ctx.fillStyle = gradient; ctx.fillRect(x, y, wall.w, wall.h); ctx.strokeStyle = "rgba(210,215,185,.22)"; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, wall.w - 2, wall.h - 2); } }
  function drawCrates(ctx, camera) { for (const crate of session.map.crates) { const x = worldToScreenX(crate.x, camera), y = worldToScreenY(crate.y, camera); ctx.fillStyle = "#4b3826"; ctx.fillRect(x, y, crate.s, crate.s); ctx.strokeStyle = "#82613d"; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, crate.s - 2, crate.s - 2); ctx.beginPath(); ctx.moveTo(x + 4, y + 4); ctx.lineTo(x + crate.s - 4, y + crate.s - 4); ctx.moveTo(x + crate.s - 4, y + 4); ctx.lineTo(x + 4, y + crate.s - 4); ctx.stroke(); } }
  function drawBullets(ctx, camera) { ctx.lineCap = "round"; for (const bullet of session.bullets) { if (!pointVisibleToHuman(bullet.x, bullet.y)) continue; const x = worldToScreenX(bullet.x, camera), y = worldToScreenY(bullet.y, camera), length = bullet.sniper ? 22 : 10, speed = Math.hypot(bullet.vx, bullet.vy) || 1; ctx.strokeStyle = bullet.sniper ? "#fff4b8" : "#ffd36c"; ctx.lineWidth = bullet.width; ctx.shadowColor = "#ffbd40"; ctx.shadowBlur = bullet.sniper ? 15 : 8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - bullet.vx / speed * length, y - bullet.vy / speed * length); ctx.stroke(); ctx.shadowBlur = 0; } }
  function drawParticles(ctx, camera) { for (const particle of session.particles) { if (!pointVisibleToHuman(particle.x, particle.y)) continue; ctx.globalAlpha = clamp(particle.life * 3, 0, 1); ctx.fillStyle = particle.color; ctx.beginPath(); ctx.arc(worldToScreenX(particle.x, camera), worldToScreenY(particle.y, camera), particle.size, 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1; }

  function drawPlayer(ctx, player, camera, now) {
    const x = worldToScreenX(player.x, camera), y = worldToScreenY(player.y, camera), weapon = weaponFor(player);
    if (player.laserColor && !weapon.melee) drawLaser(ctx, player, camera, weapon);
    ctx.save(); ctx.translate(x, y); ctx.rotate(player.angle); if (now < player.invulnerableUntil && Math.floor(now / 100) % 2 === 0) ctx.globalAlpha = .46;
    ctx.fillStyle = "rgba(0,0,0,.42)"; ctx.beginPath(); ctx.ellipse(-2, 8, 22, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = player.color; ctx.strokeStyle = "rgba(255,255,255,.22)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(-2, 0, 15, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#d59a70"; ctx.beginPath(); ctx.arc(2, 0, 9.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#191d18"; ctx.beginPath(); ctx.arc(0, 0, 10, Math.PI * .75, Math.PI * 1.75); ctx.fill(); ctx.strokeStyle = "#d59a70"; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(6, -7); ctx.lineTo(19, -5); ctx.moveTo(6, 7); ctx.lineTo(19, 5); ctx.stroke();
    if (weapon.melee) { ctx.strokeStyle = "#d6d7d3"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(17, 0); ctx.lineTo(34, 0); ctx.stroke(); ctx.fillStyle = "#f1f2ef"; ctx.beginPath(); ctx.moveTo(34, -4); ctx.lineTo(46, 0); ctx.lineTo(34, 4); ctx.closePath(); ctx.fill(); }
    else { ctx.strokeStyle = weapon.id === "sniper" ? "#d4d9d2" : "#202622"; ctx.lineWidth = weapon.id === "machine" ? 7 : weapon.id === "pistol" ? 5 : 6; ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(weapon.barrel + 10, 0); ctx.stroke(); ctx.fillStyle = "#303832"; ctx.fillRect(14, -5, Math.max(12, weapon.barrel - 10), 10); if (now < player.muzzleUntil) { ctx.fillStyle = "#ffd06a"; ctx.shadowColor = "#ffb52e"; ctx.shadowBlur = 13; ctx.beginPath(); ctx.moveTo(weapon.barrel + 12, 0); ctx.lineTo(weapon.barrel + 23, -7); ctx.lineTo(weapon.barrel + 20, 0); ctx.lineTo(weapon.barrel + 23, 7); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0; } }
    ctx.restore();
    if (!player.human) { ctx.fillStyle = "rgba(0,0,0,.7)"; ctx.fillRect(x - 19, y - 34, 38, 5); ctx.fillStyle = player.color; ctx.fillRect(x - 19, y - 34, 38 * player.health / player.maxHealth, 5); ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.font = "700 10px system-ui"; ctx.textAlign = "center"; ctx.fillText(player.name, x, y - 40); }
  }

  function drawLaser(ctx, player, camera, weapon) {
    const start = weapon.barrel + 8, maxLength = 145, dx = Math.cos(player.angle), dy = Math.sin(player.angle);
    let length = maxLength;
    for (const wall of session.map.walls) { const hit = rayRectDistance(player.x, player.y, dx, dy, wall, maxLength + start); if (hit !== null && hit > start && hit - start < length) length = hit - start; }
    const x1 = worldToScreenX(player.x + dx * start, camera), y1 = worldToScreenY(player.y + dy * start, camera), x2 = worldToScreenX(player.x + dx * (start + length), camera), y2 = worldToScreenY(player.y + dy * (start + length), camera);
    ctx.save(); ctx.strokeStyle = player.laserColor; ctx.globalAlpha = .72; ctx.lineWidth = 1.5; ctx.shadowColor = player.laserColor; ctx.shadowBlur = 7; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.fillStyle = player.laserColor; ctx.beginPath(); ctx.arc(x2, y2, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  function drawRadar(ctx, human) { const x = 72, y = 72, r = 44; ctx.save(); ctx.fillStyle = "rgba(4,10,7,.72)"; ctx.strokeStyle = "rgba(126,184,104,.4)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.strokeStyle = "rgba(126,184,104,.18)"; [r * .33, r * .66].forEach((radius) => { ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.stroke(); }); ctx.save(); ctx.translate(x, y); ctx.rotate(human.angle); ctx.fillStyle = "#e8f7e7"; ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-6, -6); ctx.lineTo(-3, 0); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fill(); ctx.restore(); for (const p of session.players) { if (p.human || p.health <= 0 || !lineOfSight(human.x, human.y, p.x, p.y) || distance(human, p) > VIEW_RADIUS) continue; const dx = clamp((p.x - human.x) / VIEW_RADIUS, -1, 1) * (r - 8), dy = clamp((p.y - human.y) / VIEW_RADIUS, -1, 1) * (r - 8); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(x + dx, y + dy, 3.6, 0, Math.PI * 2); ctx.fill(); } ctx.restore(); }
  function drawKillBadge(ctx, human) { ctx.save(); ctx.fillStyle = "rgba(4,10,7,.82)"; roundRect(ctx, 595, 28, 92, 66, 16); ctx.fill(); ctx.fillStyle = "#f4f1e8"; ctx.font = "950 28px system-ui"; ctx.textAlign = "center"; ctx.fillText(String(human.kills).padStart(2, "0"), 641, 61); ctx.fillStyle = "#79bd70"; ctx.font = "900 10px system-ui"; ctx.fillText("KILLS", 641, 79); ctx.restore(); }

  function addMuzzleParticles(player, weapon) { const x = player.x + Math.cos(player.angle) * (weapon.barrel + 5), y = player.y + Math.sin(player.angle) * (weapon.barrel + 5); for (let i = 0; i < (weapon.id === "shotgun" ? 8 : 3); i += 1) { const angle = player.angle + (Math.random() - .5) * .6, speed = 45 + Math.random() * 100; session.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: .12 + Math.random() * .12, size: 2 + Math.random() * 3, color: "#ffd473" }); } }
  function updateParticles(dt) { for (const p of session.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .92; p.vy *= .92; p.life -= dt; } session.particles = session.particles.filter((p) => p.life > 0).slice(-120); }
  function addImpactParticles(x, y, color, count) { for (let i = 0; i < count; i += 1) { const angle = Math.random() * Math.PI * 2, speed = 30 + Math.random() * 150; session.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: .18 + Math.random() * .36, size: 1.5 + Math.random() * 3.5, color }); } }

  function updateHud(force) {
    if (!session || !overlay) return;
    const human = session.players[0], index = weaponIndexForKills(human.kills), current = WEAPONS[index], next = WEAPONS[Math.min(WEAPONS.length - 1, index + 1)];
    setText("[data-arena-current-name]", current.name); setText("[data-arena-current-symbol]", current.symbol); setText("[data-arena-next-name]", index === WEAPONS.length - 1 ? "Sieg bei Kill 25" : next.name); setText("[data-arena-next-symbol]", index === WEAPONS.length - 1 ? "★" : next.symbol); setText("[data-arena-kills]", String(human.kills).padStart(2, "0")); setText("[data-arena-health-text]", Math.ceil(human.health)); setText("[data-arena-bandages]", human.bandages); setText("[data-arena-medipacks]", human.medipacks);
    const progress = overlay.querySelector("[data-arena-progress]"); if (progress) progress.style.width = `${clamp(human.kills / WIN_KILLS * 100, 0, 100)}%`;
    const health = overlay.querySelector("[data-arena-health]"); if (health) health.style.width = `${clamp(human.health / human.maxHealth * 100, 0, 100)}%`;
    const nextStart = index === WEAPONS.length - 1 ? WIN_KILLS : WEAPONS[index + 1].start; setText("[data-arena-progress-text]", human.kills >= 24 ? `${WIN_KILLS - human.kills} Kill bis zum Sieg` : `${nextStart - human.kills} Kills bis zur nächsten Waffe`);
    updateScoreboard(); updateRespawn(performance.now()); if (force || session.lastLadderIndex !== index) { session.lastLadderIndex = index; renderLadder(); }
  }
  function updateScoreboard() {
    const box = overlay?.querySelector("[data-arena-scoreboard]");
    if (!box || !session) return;
    box.innerHTML = session.players.map((p) => {
      const suffix = p.human ? " (DU)" : p.connectionStale ? " (VERBINDUNG)" : p.onlineRemote ? " (ONLINE)" : p.bot ? " (BOT)" : "";
      return `<div class="arena-kl-score-chip ${p.human ? "you" : ""}" style="--player-color:${p.color}"><i></i><span>${escapeText(`${p.name}${suffix}`)}</span><b>${p.kills}</b></div>`;
    }).join("");
  }
  function updateRespawn(now) { const human = session?.players[0], box = overlay?.querySelector("[data-arena-respawn]"); if (!box || !human) return; if (human.health > 0 || session.finished) return box.setAttribute("hidden", ""); box.removeAttribute("hidden"); box.textContent = `Respawn in ${Math.max(1, Math.ceil((human.respawnAt - now) / 1000))}…`; }
  function renderLadder() { const box = overlay?.querySelector("[data-arena-ladder]"), human = session?.players[0]; if (!box || !human) return; const active = weaponIndexForKills(human.kills); box.innerHTML = WEAPONS.map((weapon, index) => `<div class="arena-kl-ladder-item ${index < active ? "unlocked" : ""} ${index === active ? "active" : ""} ${index === WEAPONS.length - 1 ? "final" : ""}"><small>${index + 1}</small><i>${weapon.symbol}</i><b>${escapeText(weapon.short)}</b></div>`).join(""); }
  function setText(selector, text) { const element = overlay?.querySelector(selector); if (element) element.textContent = String(text); }

  function togglePause() { if (!session || session.finished) return; if (session.online) return window.alert("Online-Matches können nicht pausiert werden."); session.paused = !session.paused; overlay?.querySelector("[data-arena-paused]")?.toggleAttribute("hidden", !session.paused); const button = overlay?.querySelector("[data-arena-pause]"); if (button) button.textContent = session.paused ? "▶" : "Ⅱ"; }

  function finishMatch(winner) {
    if (!session || session.finished) return;
    session.finished = true; session.running = false; session.winner = winner;
    const human = session.players[0], stats = ensureArenaState(); stats.matches += 1; stats.totalKills += human.kills; stats.bestKills = Math.max(stats.bestKills, human.kills); if (winner.human) stats.wins += 1;
    let rewardText = "";
    if (winner.human && !session.online) {
      const reward = botDifficultyConfig(session.botDifficulty);
      safeAddXp(reward.xp, `Arena.KL ${reward.name} gewonnen`);
      safeAwardMoney(reward.money, `Arena.KL ${reward.name}`);
      safeMood(4, "Arena.KL gewonnen");
      rewardText = `${reward.xp} EP · ${EURO.format(reward.money)}`;
      safeFeed(`Arena.KL ${reward.name} auf ${session.map.name} gewonnen: ${human.kills} Kills · ${rewardText}.`);
    } else {
      safeAddXp(winner.human ? 150 : Math.max(15, human.kills * 4), winner.human ? "Arena.KL Online-Sieg" : "Arena.KL Match");
      if (winner.human) safeMood(4, "Arena.KL gewonnen");
      safeFeed(winner.human ? `Arena.KL Online auf ${session.map.name} gewonnen: ${human.kills} Kills.` : `Arena.KL beendet: ${winner.name} gewinnt. Du erreichst ${human.kills} Kills.`);
      if (winner.human) rewardText = "150 EP";
    }
    if (session.online && session.isHost && session.fb && session.roomRef) session.fb.updateDoc(session.roomRef, { status: "finished", winnerId: winner.id, winnerUid: winner.uid || "", winnerName: winner.name, finishedAtMs: Date.now(), updatedAtMs: Date.now() }).catch(() => {});
    safeSave();
    const panel = overlay?.querySelector("[data-arena-end]"); if (panel) { panel.removeAttribute("hidden"); panel.innerHTML = `<small>${winner.human ? "SIEG" : "MATCH BEENDET"}</small><h3>${escapeText(winner.name)} gewinnt</h3><p>${escapeText(human.name)}: ${human.kills} Kills · ${human.deaths} Tode${rewardText ? ` · Belohnung: ${escapeText(rewardText)}` : ""}</p><div class="arena-kl-end-actions"><button class="arena-kl-primary" type="button" data-arena-restart>Nochmal</button><button class="arena-kl-secondary" type="button" data-arena-menu-back>Menü</button></div>`; panel.querySelector("[data-arena-restart]")?.addEventListener("click", () => session.online ? (stopSession(false), startOnlineLobby({ type: "quick" })) : startLocalMatch()); panel.querySelector("[data-arena-menu-back]")?.addEventListener("click", () => { stopSession(false); showMenu(); }); }
    updateHud(true);
  }

  function finishOnlineDisconnected(message) { if (!session || session.finished) return; session.finished = true; session.running = false; const panel = overlay?.querySelector("[data-arena-end]"); if (panel) { panel.removeAttribute("hidden"); panel.innerHTML = `<small>VERBINDUNG BEENDET</small><h3>Online-Match geschlossen</h3><p>${escapeText(message)}</p><div class="arena-kl-end-actions"><button class="arena-kl-primary" type="button" data-arena-reconnect>Neue Lobby</button><button class="arena-kl-secondary" type="button" data-arena-menu-back>Menü</button></div>`; panel.querySelector("[data-arena-reconnect]")?.addEventListener("click", () => { stopSession(false); startOnlineLobby({ type: "quick" }); }); panel.querySelector("[data-arena-menu-back]")?.addEventListener("click", () => { stopSession(false); showMenu(); }); } }

  async function leaveOnlineLobby(showMenuAfter = true) {
    const lobby = onlineLobby; onlineLobby = null; if (!lobby) return;
    lobby.unsubs?.forEach((unsubscribe) => { try { unsubscribe(); } catch (_) {} }); if (lobby.heartbeat) clearInterval(lobby.heartbeat); if (lobby.startTimer) clearTimeout(lobby.startTimer);
    if (lobby.fb && lobby.roomId && lobby.uid && !lobby.started) {
      const roomRef = lobby.fb.doc(lobby.fb.db, "arenaKlRooms", lobby.roomId), participantRef = lobby.fb.doc(lobby.fb.db, "arenaKlRooms", lobby.roomId, "participants", lobby.uid);
      try {
        if (lobby.isHost) await lobby.fb.updateDoc(roomRef, { status: "cancelled", updatedAtMs: Date.now() });
        else await lobby.fb.runTransaction(lobby.fb.db, async (transaction) => { const snap = await transaction.get(roomRef); if (!snap.exists()) return; const data = snap.data(), playerUids = (data.playerUids || []).filter((uid) => uid !== lobby.uid), slots = { ...(data.slots || {}) }, names = { ...(data.playerNames || {}) }; delete slots[lobby.uid]; delete names[lobby.uid]; transaction.update(roomRef, { playerUids, slots, playerNames: names, currentPlayers: playerUids.length, updatedAtMs: Date.now() }); });
        await lobby.fb.deleteDoc(participantRef);
      } catch (error) { console.warn("Arena.KL Lobby verlassen", error); }
    }
    const start = overlay?.querySelector("[data-arena-start]"); if (start) start.disabled = false; const box = overlay?.querySelector("[data-arena-online-lobby]"); if (box) { box.setAttribute("hidden", ""); box.innerHTML = ""; } if (showMenuAfter) showMenu();
  }

  function requestClose() { if ((session?.running && !session.finished) || onlineLobby) if (!window.confirm("Arena.KL wirklich beenden? Die aktuelle Lobby oder das Match wird geschlossen.")) return; close(true); }
  function stopSession(report = false) { if (!session) return; const ending = session; if (report && ending.running) safeFeed(`Arena.KL vorzeitig beendet: ${ending.players[0].kills} Kills.`); cancelAnimationFrame(rafId); rafId = 0; unbindGameControls(); cleanupOnlineSession(ending, report); session = null; mouse.down = false; }
  function cleanupOnlineSession(ending, abandoned = false) {
    if (!ending?.online) return;
    ending.onlineUnsubs?.forEach((unsubscribe) => { try { unsubscribe(); } catch (_) {} });
    if (ending.heartbeatTimer) clearInterval(ending.heartbeatTimer);
    if (ending.reconnectTimer) clearTimeout(ending.reconnectTimer);
    ending.wsClosing = true;
    try {
      if (ending.ws?.readyState === WebSocket.OPEN) ending.ws.send(JSON.stringify({ type: "leave" }));
      ending.ws?.close(1000, "Arena.KL beendet");
    } catch (_) {}
    if (!ending.fb || !ending.roomRef) return;
    ending.fb.setDoc(ending.fb.doc(ending.fb.db, "arenaKlRooms", ending.roomId, "participants", ending.uid), { leftAtMs: Date.now(), lastSeenMs: Date.now() }, { merge: true }).catch(() => {});
  }
  function close(renderAfter = true, silent = false) { stopSession(!silent); if (onlineLobby) leaveOnlineLobby(false); overlay?.remove(); overlay = null; document.body.classList.remove("arena-kl-open"); if (renderAfter) { safeSave(); safeRender(); } }

  function pointVisibleToHuman(x, y) { const human = session?.players[0]; return !!human && Math.hypot(x - human.x, y - human.y) <= VIEW_RADIUS && lineOfSight(human.x, human.y, x, y); }
  function circleHitsWall(x, y, radius) { return session.map.walls.some((wall) => { const cx = clamp(x, wall.x, wall.x + wall.w), cy = clamp(y, wall.y, wall.y + wall.h); return (x - cx) ** 2 + (y - cy) ** 2 < radius ** 2; }); }
  function segmentHitsWall(x1, y1, x2, y2) { return session.map.walls.some((wall) => segmentRectHit(x1, y1, x2, y2, wall)); }
  function lineOfSight(x1, y1, x2, y2) { return !segmentHitsWall(x1, y1, x2, y2); }
  function pointInRect(x, y, rect) { return x > rect.x && x < rect.x + rect.w && y > rect.y && y < rect.y + rect.h; }
  function segmentRectHit(x1, y1, x2, y2, rect) { if (pointInRect(x1, y1, rect) || pointInRect(x2, y2, rect)) return true; const x3 = rect.x, y3 = rect.y, x4 = rect.x + rect.w, y4 = rect.y + rect.h; return segmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y3) || segmentsIntersect(x1, y1, x2, y2, x4, y3, x4, y4) || segmentsIntersect(x1, y1, x2, y2, x4, y4, x3, y4) || segmentsIntersect(x1, y1, x2, y2, x3, y4, x3, y3); }
  function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) { const rX = bx - ax, rY = by - ay, sX = dx - cx, sY = dy - cy, den = rX * sY - rY * sX; if (Math.abs(den) < 1e-8) return false; const t = ((cx - ax) * sY - (cy - ay) * sX) / den, u = ((cx - ax) * rY - (cy - ay) * rX) / den; return t >= 0 && t <= 1 && u >= 0 && u <= 1; }
  function segmentCircleHit(x1, y1, x2, y2, cx, cy, radius) { const dx = x2 - x1, dy = y2 - y1, lengthSquared = dx * dx + dy * dy || 1, t = clamp(((cx - x1) * dx + (cy - y1) * dy) / lengthSquared, 0, 1), px = x1 + dx * t, py = y1 + dy * t; return (px - cx) ** 2 + (py - cy) ** 2 <= radius ** 2; }
  function visibilityPolygon(x, y, maxDistance, rays) { const points = []; for (let index = 0; index < rays; index += 1) { const angle = index / rays * Math.PI * 2, dx = Math.cos(angle), dy = Math.sin(angle); let hitDistance = Math.min(maxDistance, rayWorldBoundaryDistance(x, y, dx, dy)); for (const wall of session.map.walls) { const result = rayRectDistance(x, y, dx, dy, wall, maxDistance); if (result !== null && result < hitDistance) hitDistance = result; } points.push({ x: x + dx * Math.max(0, hitDistance - .6), y: y + dy * Math.max(0, hitDistance - .6) }); } return points; }
  function rayRectDistance(ox, oy, dx, dy, rect, maxDistance) { let tMin = 0, tMax = maxDistance; for (const [min, max, origin, direction] of [[rect.x, rect.x + rect.w, ox, dx], [rect.y, rect.y + rect.h, oy, dy]]) { if (Math.abs(direction) < 1e-9) { if (origin < min || origin > max) return null; continue; } let t1 = (min - origin) / direction, t2 = (max - origin) / direction; if (t1 > t2) [t1, t2] = [t2, t1]; tMin = Math.max(tMin, t1); tMax = Math.min(tMax, t2); if (tMin > tMax) return null; } if (tMin >= 0 && tMin <= maxDistance) return tMin; if (tMax >= 0 && tMax <= maxDistance) return tMax; return null; }
  function rayWorldBoundaryDistance(x, y, dx, dy) { const distances = []; if (dx > 0) distances.push((WORLD_SIZE - x) / dx); if (dx < 0) distances.push((0 - x) / dx); if (dy > 0) distances.push((WORLD_SIZE - y) / dy); if (dy < 0) distances.push((0 - y) / dy); return Math.min(...distances.filter((value) => value >= 0)); }
  function clipVisibility(ctx, polygon, camera) { ctx.beginPath(); polygon.forEach((point, index) => { const x = worldToScreenX(point.x, camera), y = worldToScreenY(point.y, camera); if (!index) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.closePath(); ctx.clip(); }
  function drawVisionEdge(ctx, polygon, camera) { if (!polygon.length) return; ctx.save(); ctx.strokeStyle = "rgba(238,226,171,.07)"; ctx.lineWidth = 2; ctx.beginPath(); polygon.forEach((point, index) => { const x = worldToScreenX(point.x, camera), y = worldToScreenY(point.y, camera); if (!index) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.closePath(); ctx.stroke(); ctx.restore(); }
  function worldToScreenX(x, camera) { return x - camera.x + CANVAS_SIZE / 2; }
  function worldToScreenY(y, camera) { return y - camera.y + CANVAS_SIZE / 2; }
  function roundRect(ctx, x, y, width, height, radius) { const r = Math.min(radius, width / 2, height / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + width, y, x + width, y + height, r); ctx.arcTo(x + width, y + height, x, y + height, r); ctx.arcTo(x, y + height, x, y, r); ctx.arcTo(x, y, x + width, y, r); ctx.closePath(); }

  window.ArenaKL = Object.freeze({ open, close: () => close(true, true), version: VERSION, get active() { return !!overlay; } });
})();
