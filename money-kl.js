(() => {
  "use strict";

  const VERSION = "2026-08-07-money-kl-v221-drag-multiselect-performance-mainxp";
  const LEADERBOARD_COLLECTION = "playerProfiles";
  const MAX_OFFLINE_MS = 8 * 60 * 60 * 1000;
  const LEADERBOARD_ACTIVE_MS = 45 * 1000;
  const BOARD_TIERS = Object.freeze([
    { size: 2, price: 0, label: "Mini-Startfeld", description: "4 Bauplätze · sofort verfügbar" },
    { size: 4, price: 1_000_000, label: "Kleines Viertel", description: "16 Bauplätze · ab $1 Million" },
    { size: 6, price: 500_000_000, label: "Stadtfläche", description: "36 Bauplätze · ab $500 Millionen" },
    { size: 8, price: 1_000_000_000, label: "Großstadtfläche", description: "64 Bauplätze · ab $1 Milliarde" },
    { size: 10, price: 1_000_000_000_000, label: "Imperiumsfläche", description: "100 Bauplätze · ab $1 Billion" }
  ]);
  const BASE_MAKER_NAMES = [
    "Noob-Maker","Taschengeld-Sammler","Pfandjäger","Zeitungsbote","Flohmarkt-Händler","Snack-Verkäufer","Straßenkünstler","Kiosk-Helfer","Pizza-Kurier","Mini-Streamer",
    "Money-Maker","Garage-Händler","Online-Verkäufer","Content-Creator","Influencer","Affiliate-Profi","App-Entwickler","Krypto-Scout","E-Commerce-Star","Social-Media-Agentur",
    "Startup-Gründer","Immobilien-Makler","Autohaus-Chef","Hotel-Betreiber","Restaurant-Kette","Logistik-Unternehmer","Software-Firma","Medien-Unternehmer","Finanzberater","Produktionsleiter",
    "Industrie-Chef","Tech-Investor","Immobilien-Hai","Öl-Unternehmer","Energie-Mogul","Mode-Imperium","Filmproduzent","Musik-Mogul","Sportinvestor","Casino-Besitzer",
    "Bankier","Börsenhai","Konzernchef","Globaler Investor","Luxusmarken-König","Minenbesitzer","Reederei-Chef","Fluglinien-Mogul","Pharma-Tycoon","Daten-Mogul",
    "Millionär","Multi-Millionär","Hundertfach-Millionär","Milliardär","Multi-Milliardär","Zehnfach-Milliardär","Hundertfach-Milliardär","Billionär","Multi-Billionär","Zehnfach-Billionär",
    "Trillionär","Multi-Trillionär","Quadrillionär","Quintillionär","Sextillionär","Septillionär","Oktillionär","Nonillionär","Dezillionär","Undezillionär",
    "Welten-Investor","Mond-Konzern","Mars-Mogul","Asteroiden-Miner","Sonnenenergie-König","Planeten-Bankier","Galaxie-Händler","Sternen-Milliardär","Kosmos-Tycoon","Nebula-Investor",
    "Quasar-Magnat","Pulsar-Bank","Schwarzes-Loch-Fonds","Dimensionen-Händler","Zeitlinien-Investor","Multiversum-Mogul","Realitäten-König","Unendlichkeits-Bankier","Omega-Tycoon","Alpha-Imperator",
    "JK-Money-Legende","JK-Coin-Architekt","Cash-Universum","Reichtums-Titan","Kapital-Gott","Money-Overlord","Dollar-Dominator","Imperium-Prime","Endlos-Milliardär","Money.KL-Champion"
  ];
  const MAKER_NAMES = Object.freeze([
    ...BASE_MAKER_NAMES,
    ...BASE_MAKER_NAMES.map(name => `${name} II`)
  ]);
  const JK_MAKERS = Object.freeze([
    { id:"jk-maker-1", name:"JK Neon-Sammler", icon:"JK", color:"#67ffd0", income:2_000_000_000, upgradeBase:20_000_000_000 },
    { id:"jk-maker-2", name:"JK Cash-Runner", icon:"⚡", color:"#7ecbff", income:4_000_000_000, upgradeBase:40_000_000_000 },
    { id:"jk-maker-3", name:"JK Quantum-Händler", icon:"Q", color:"#c18cff", income:8_000_000_000, upgradeBase:80_000_000_000 },
    { id:"jk-maker-4", name:"JK Galaxy-Broker", icon:"◆", color:"#ff8fd8", income:15_000_000_000, upgradeBase:150_000_000_000 },
    { id:"jk-maker-5", name:"JK Hyper-Mogul", icon:"H", color:"#ffe070", income:50_000_000_000, upgradeBase:500_000_000_000 },
    { id:"jk-maker-6", name:"JK Orbit-Bankier", icon:"◉", color:"#78f0ff", income:100_000_000_000, upgradeBase:1_000_000_000_000 },
    { id:"jk-maker-7", name:"JK Multiversum-Tycoon", icon:"∞", color:"#b88cff", income:500_000_000_000, upgradeBase:5_000_000_000_000 },
    { id:"jk-maker-8", name:"JK Infinity-Investor", icon:"∞", color:"#ff79c9", income:1_000_000_000_000, upgradeBase:10_000_000_000_000 },
    { id:"jk-maker-9", name:"JK Black-Hole-Imperator", icon:"●", color:"#9f76ff", income:5_000_000_000_000, upgradeBase:50_000_000_000_000 },
    { id:"jk-maker-10", name:"JK Money-Gott", icon:"★", color:"#ffd95d", income:10_000_000_000_000, upgradeBase:100_000_000_000_000 }
  ].map((maker,index)=>({ ...maker, index:200+index, jk:true, cost:0 })));
  const ICONS = ["N","€","$","M","I","B","◆","◉","∞","★"];
  const COLORS = ["#63ffc1","#7fd3ff","#c894ff","#ffd766","#ff8da1","#6ef1ee","#a7ff7d","#ff9e5f","#d8e2ff","#f3a8ff"];
  const AVATARS = ["🧒","🧺","🛒","🎭","📦","💻","📈","🏢","💎","👑","🚀","🌌"] ;

  const UI = { overlay: null, leftOpen: false, rightOpen: false, view: "board", selectedMaker: 0, selectedCell: "", selectedCells: new Set(), gesture: null, cellButtons: [], tick: 0, leaderboard: [], onlineStatus: "", sourceDevice: "", toastTimer: 0 };
  const number = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 });
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
  const SHORT_SUFFIXES = ["", "K", "M", "MI", "B", "BA", "T", "TA", "Q", "QA", "QU", "QI", "S", "SA", "O", "OA", "N", "NA", "D", "DA", "UD", "DD", "TD", "QD", "QID", "SD", "SPD", "OD", "ND", "VG"];
  function formatShortNumber(value) {
    const n = Math.max(0, Number(value) || 0);
    if (!Number.isFinite(n)) return "∞";
    if (n < 1000) return number.format(n);
    const tier = Math.min(SHORT_SUFFIXES.length - 1, Math.max(1, Math.floor(Math.log10(n) / 3)));
    const scaled = n / Math.pow(1000, tier);
    const maximumFractionDigits = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
    return `${scaled.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits })} ${SHORT_SUFFIXES[tier]}`;
  }

  function makerAvatar(index) {
    return AVATARS[Math.min(AVATARS.length - 1, Math.floor(Math.max(0, index) / 9))] || "💼";
  }

  function appState() { try { return typeof state !== "undefined" ? state : null; } catch { return null; } }
  function persist() { try { if (typeof save === "function") save(); } catch (error) { console.warn("Money.KL speichern", error); } }
  function feed(text) { try { if (typeof addFeed === "function") addFeed(text); } catch {} }
  function makerRawBase(index) {
    if (index === 0) return 1;
    return Math.max(2, Math.round(Math.pow(10, index * 0.122)));
  }
  function makerBase(index) {
    if (index === 0) return 1;
    return Math.max(1, Math.floor(makerRawBase(index) * 0.5));
  }
  function makerLevelIncome(index, level = 1) {
    const multipliers = [1, 3, 8, 25, 100];
    return Math.round(makerBase(index) * multipliers[clamp(level, 1, 5) - 1]);
  }
  function makerCost(index) {
    if (index === 0) return 0;
    const base = makerRawBase(index);
    return Math.max(20, Math.round(base * (55 + index * 1.8)));
  }
  function makerUpgradeCost(index, level) {
    return Math.max(10, Math.round(makerCost(index) * (0.55 + level * level * 0.62)));
  }
  const MAKERS = MAKER_NAMES.map((name, index) => ({
    id: `maker-${index + 1}`,
    index,
    name,
    icon: ICONS[index % ICONS.length],
    color: COLORS[index % COLORS.length],
    income: makerBase(index),
    cost: makerCost(index),
    jk: false
  }));
  const ALL_MAKERS = Object.freeze([...MAKERS, ...JK_MAKERS]);
  function findMaker(id) { return ALL_MAKERS.find(maker => maker.id === id) || null; }
  function makerIncome(maker, level = 1) {
    const multipliers = [1, 3, 8, 25, 100];
    if (!maker) return 0;
    if (maker.jk) return Math.round(Number(maker.income || 0) * multipliers[clamp(level, 1, 5) - 1]);
    return makerLevelIncome(maker.index, level);
  }
  function upgradeCostForMaker(maker, level) {
    if (!maker) return 0;
    if (maker.jk) return Math.max(10, Math.round(Number(maker.upgradeBase || maker.income || 1) * (0.55 + level * level * 0.62)));
    return makerUpgradeCost(maker.index, level);
  }

  function defaultState() {
    const starterCell = "0:0";
    return {
      version: VERSION,
      dollars: 0,
      lifetimeEarned: 0,
      maxDollarsHeld: 0,
      boardSize: 2,
      unlocked4: false,
      unlocked6: false,
      unlocked8: false,
      unlocked10: false,
      cells: { [starterCell]: { makerId: "maker-1", level: 1, stored: 0, placedAt: Date.now() } },
      selectedMakerId: "maker-1",
      jkMakerOwned: {},
      lastTickAt: Date.now(),
      boosts: { productionMultiplier: 1, productionUntil: 0, autoCollectUntil: 0, doubleUntil: 0 },
      stats: { collected: 0, upgrades: 0, placements: 1, clicks: 0 },
      leaderboardUpdatedAt: 0,
      tutorialSeen: false,
      mainXpLastBucket: -1
    };
  }
  function recordPeak(data) {
    if (!data) return 0;
    data.maxDollarsHeld = Math.max(0, Number(data.maxDollarsHeld || 0), Number(data.dollars || 0));
    return data.maxDollarsHeld;
  }
  function fitBoardSize(cellCount) {
    const count = Math.max(0, Math.floor(Number(cellCount) || 0));
    return BOARD_TIERS.find(tier => tier.size * tier.size >= count)?.size || 10;
  }
  function fullCellDollarValue(cell) {
    const maker = findMaker(cell?.makerId);
    if (!maker) return Math.max(0, Number(cell?.stored || 0));
    let value = maker.jk ? 0 : Number(maker.cost || 0);
    for (let level = 1; level < Number(cell?.level || 1); level += 1) value += upgradeCostForMaker(maker, level);
    return value + Math.max(0, Number(cell?.stored || 0));
  }
  function repackCells(data, size) {
    const safeSize = Math.max(2, Math.min(10, Number(size) || 2));
    const entries = Object.entries(data.cells || {}).sort((a,b) => {
      const [ax,ay] = String(a[0]).split(":").map(Number), [bx,by] = String(b[0]).split(":").map(Number);
      return (ay-by) || (ax-bx);
    });
    const limit = safeSize * safeSize;
    const next = {};
    let overflowRefund = 0;
    entries.forEach(([key,cell],index) => {
      if (index < limit) next[`${index % safeSize}:${Math.floor(index / safeSize)}`] = cell;
      else overflowRefund += fullCellDollarValue(cell);
    });
    data.cells = next;
    if (overflowRefund > 0) {
      data.dollars = Math.max(0, Number(data.dollars || 0)) + overflowRefund;
      recordPeak(data);
    }
  }
  function ensureState() {
    const root = appState();
    if (!root) return null;
    const base = defaultState();
    root.moneyKl ||= base;
    const data = root.moneyKl;
    const previousVersion = String(data.version || "");
    const previousBoardSize = Number(data.boardSize || 0);
    const isLegacySave = previousVersion !== VERSION;
    data.cells = data.cells && typeof data.cells === "object" ? data.cells : base.cells;
    data.dollars = Math.max(0, Number(data.dollars || 0));
    data.lifetimeEarned = Math.max(0, Number(data.lifetimeEarned || 0));
    data.maxDollarsHeld = Math.max(0, Number(data.maxDollarsHeld || 0));
    data.jkMakerOwned = data.jkMakerOwned && typeof data.jkMakerOwned === "object" ? data.jkMakerOwned : {};
    data.boosts = { ...base.boosts, ...(data.boosts || {}) };
    data.stats = { ...base.stats, ...(data.stats || {}) };
    data.mainXpLastBucket = Number.isFinite(Number(data.mainXpLastBucket)) ? Number(data.mainXpLastBucket) : -1;

    if (isLegacySave) {
      const oldUnlocked4 = data.unlocked4 === true || previousBoardSize >= 4;
      const oldUnlocked8 = data.unlocked8 === true || previousBoardSize >= 8;
      const oldUnlocked16 = data.unlocked16 === true || previousBoardSize >= 16;
      const oldUnlocked32 = data.unlocked32 === true || previousBoardSize >= 32;
      data.unlocked4 = oldUnlocked4 || oldUnlocked8 || oldUnlocked16 || oldUnlocked32;
      data.unlocked6 = oldUnlocked8 || oldUnlocked16 || oldUnlocked32;
      data.unlocked8 = oldUnlocked16 || oldUnlocked32;
      data.unlocked10 = oldUnlocked32;
      const mappedSelected = previousBoardSize >= 32 ? 10 : previousBoardSize >= 16 ? 8 : previousBoardSize >= 8 ? 6 : previousBoardSize >= 4 ? 4 : 2;
      const required = fitBoardSize(Math.min(100, Object.keys(data.cells).length));
      const migrationSize = Math.max(mappedSelected, required);
      if (migrationSize >= 4) data.unlocked4 = true;
      if (migrationSize >= 6) data.unlocked6 = true;
      if (migrationSize >= 8) data.unlocked8 = true;
      if (migrationSize >= 10) data.unlocked10 = true;
      data.boardSize = migrationSize;
      // V219 kannte noch keinen gespeicherten Höchststand. Für die einmalige
      // Migration wird nur aus nachweisbaren Käufen/Beständen ein Mindest-Höchststand
      // rekonstruiert; lifetimeEarned darf NICHT pauschal Maker freischalten.
      let inferredLegacyPeak = Math.max(data.maxDollarsHeld, data.dollars);
      if (oldUnlocked4) inferredLegacyPeak = Math.max(inferredLegacyPeak, 1_000_000);
      if (oldUnlocked8) inferredLegacyPeak = Math.max(inferredLegacyPeak, 500_000_000);
      if (oldUnlocked16) inferredLegacyPeak = Math.max(inferredLegacyPeak, 1_000_000_000);
      if (oldUnlocked32) inferredLegacyPeak = Math.max(inferredLegacyPeak, 1_000_000_000_000);
      Object.values(data.cells || {}).forEach(cell => {
        const maker = findMaker(cell?.makerId);
        if (!maker || maker.jk) return;
        inferredLegacyPeak = Math.max(inferredLegacyPeak, Number(maker.cost || 0));
        const level = clamp(cell?.level, 1, 5);
        for (let boughtLevel = 1; boughtLevel < level; boughtLevel += 1) {
          inferredLegacyPeak = Math.max(inferredLegacyPeak, upgradeCostForMaker(maker, boughtLevel));
        }
      });
      data.maxDollarsHeld = inferredLegacyPeak;
      if (Number(data.boosts.doubleUntil || 0) > Date.now() && Number(data.boosts.productionUntil || 0) <= Date.now()) {
        data.boosts.productionMultiplier = 2;
        data.boosts.productionUntil = Number(data.boosts.doubleUntil || 0);
      }
      repackCells(data, data.boardSize);
    } else {
      data.unlocked4 = data.unlocked4 === true;
      data.unlocked6 = data.unlocked6 === true;
      data.unlocked8 = data.unlocked8 === true;
      data.unlocked10 = data.unlocked10 === true;
      const validSizes = BOARD_TIERS.map(tier => tier.size);
      const requestedSize = validSizes.includes(previousBoardSize) ? previousBoardSize : 2;
      const highestUnlocked = data.unlocked10 ? 10 : data.unlocked8 ? 8 : data.unlocked6 ? 6 : data.unlocked4 ? 4 : 2;
      const requestedUnlocked = requestedSize === 2 || tierUnlocked(data, requestedSize);
      data.boardSize = requestedUnlocked ? requestedSize : highestUnlocked;
      const required = fitBoardSize(Math.min(100, Object.keys(data.cells).length));
      if (required > data.boardSize) {
        if (required >= 4) data.unlocked4 = true;
        if (required >= 6) data.unlocked6 = true;
        if (required >= 8) data.unlocked8 = true;
        if (required >= 10) data.unlocked10 = true;
        data.boardSize = required;
      }
      const keysOutside = Object.keys(data.cells).some(key => {
        const [x,y] = String(key).split(":").map(Number);
        return !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x >= data.boardSize || y >= data.boardSize;
      });
      if (keysOutside || Object.keys(data.cells).length > 100) repackCells(data, data.boardSize);
    }

    data.version = VERSION;
    data.lastTickAt = Number(data.lastTickAt || Date.now());
    data.selectedMakerId = ALL_MAKERS.some(m => m.id === data.selectedMakerId) ? data.selectedMakerId : "maker-1";
    recordPeak(data);
    updateAccrual(data);
    return data;
  }
  function cellIncome(cell) {
    const maker = findMaker(cell?.makerId);
    if (!maker) return 0;
    return makerIncome(maker, cell.level || 1);
  }
  function productionMultiplier(data) {
    return Number(data?.boosts?.productionUntil || 0) > Date.now()
      ? Math.max(1, Math.min(20, Number(data?.boosts?.productionMultiplier || 1)))
      : 1;
  }
  function totalPerSecond(data = ensureState()) {
    if (!data) return 0;
    return Object.values(data.cells).reduce((sum, cell) => sum + cellIncome(cell), 0) * productionMultiplier(data);
  }
  function updateAccrual(data = ensureState()) {
    if (!data) return;
    const now = Date.now();
    const elapsedMs = Math.min(MAX_OFFLINE_MS, Math.max(0, now - Number(data.lastTickAt || now)));
    if (elapsedMs < 50) return;
    const seconds = elapsedMs / 1000;
    const mult = productionMultiplier(data);
    Object.values(data.cells).forEach(cell => {
      cell.stored = Math.max(0, Number(cell.stored || 0) + cellIncome(cell) * seconds * mult);
    });
    data.lastTickAt = now;
    if (Number(data.boosts.autoCollectUntil || 0) > now) collectAll(false, data);
  }
  function collectAll(show = true, data = ensureState()) {
    if (!data) return 0;
    updateAccrualNoRecursion(data);
    let amount = 0;
    Object.values(data.cells).forEach(cell => { amount += Math.max(0, Number(cell.stored || 0)); cell.stored = 0; });
    amount = Math.floor(amount * 100) / 100;
    if (amount > 0) {
      data.dollars += amount;
      data.lifetimeEarned += amount;
      data.stats.collected += amount;
      recordPeak(data);
      if (show) {
        awardMoneyMainXp(data, Math.min(18, 4 + Math.floor(Math.log10(amount + 1))), "Money.KL Alles eingesammelt");
        toast(`+${formatDollar(amount)} eingesammelt`);
      }
      persist();
    }
    return amount;
  }
  function updateAccrualNoRecursion(data) {
    const now = Date.now();
    const elapsedMs = Math.min(MAX_OFFLINE_MS, Math.max(0, now - Number(data.lastTickAt || now)));
    if (elapsedMs < 50) return;
    const seconds = elapsedMs / 1000;
    const mult = productionMultiplier(data);
    Object.values(data.cells).forEach(cell => { cell.stored = Math.max(0, Number(cell.stored || 0) + cellIncome(cell) * seconds * mult); });
    data.lastTickAt = now;
  }
  function formatDollar(value) {
    return `$${formatShortNumber(value)}`;
  }
  function netWorth(data = ensureState()) {
    if (!data) return 0;
    const asset = Object.values(data.cells).reduce((sum, cell) => {
      const maker = findMaker(cell.makerId);
      if (!maker) return sum;
      let value = maker.jk ? 0 : Number(maker.cost || 0);
      for (let level = 1; level < Number(cell.level || 1); level += 1) value += upgradeCostForMaker(maker, level);
      return sum + value + Number(cell.stored || 0);
    }, 0);
    return Math.floor(data.dollars + asset);
  }
  function selectedMaker(data = ensureState()) { return findMaker(data?.selectedMakerId) || MAKERS[0]; }
  function selectedCell(data = ensureState()) { return UI.selectedCell ? data?.cells?.[UI.selectedCell] || null : null; }
  function makerUnlocked(data, maker) {
    if (!maker) return false;
    if (maker.jk) return jkMakerAvailable(data, maker.id) > 0 || placedJkMakerCount(data, maker.id) > 0;
    return maker.index === 0 || Number(data?.maxDollarsHeld || 0) >= Number(maker.cost || 0);
  }
  function placedJkMakerCount(data, makerId) {
    if (!data || !makerId) return 0;
    return Object.values(data.cells || {}).filter(cell => cell?.makerId === makerId).length;
  }
  function jkMakerOwnedCount(data, makerId) {
    return Math.max(0, Math.floor(Number(data?.jkMakerOwned?.[makerId] || 0)));
  }
  function jkMakerAvailable(data, makerId) {
    return Math.max(0, jkMakerOwnedCount(data, makerId) - placedJkMakerCount(data, makerId));
  }

  function selectionKeys(data = ensureState()) {
    if (!data) return [];
    const valid = [...UI.selectedCells].filter(key => !!data.cells?.[key]);
    if (!valid.length && UI.selectedCell && data.cells?.[UI.selectedCell]) valid.push(UI.selectedCell);
    UI.selectedCells = new Set(valid);
    if (valid.length === 1) UI.selectedCell = valid[0];
    else if (!valid.includes(UI.selectedCell)) UI.selectedCell = "";
    return valid;
  }
  function selectOnly(key, data = ensureState()) {
    UI.selectedCells.clear();
    if (key && data?.cells?.[key]) {
      UI.selectedCells.add(key);
      UI.selectedCell = key;
    } else {
      UI.selectedCell = "";
    }
  }
  function clearSelection() {
    UI.selectedCells.clear();
    UI.selectedCell = "";
  }
  function awardMoneyMainXp(data, baseAmount, reason = "Money.KL") {
    if (!data || typeof window.JKGamesAwardMainGameXp !== "function") return 0;
    const bucket = Math.floor(Date.now() / 30000);
    if (Number(data.mainXpLastBucket) === bucket) return 0;
    const amount = Math.max(1, Math.min(30, Math.floor(Number(baseAmount) || 1)));
    const earned = window.JKGamesAwardMainGameXp("money", amount, reason, { eventKey:`money:${bucket}`, feed:false });
    if (earned > 0) data.mainXpLastBucket = bucket;
    return earned;
  }
  function selectedStoredAmount(data, keys) {
    return keys.reduce((sum, key) => sum + Math.max(0, Number(data.cells?.[key]?.stored || 0)), 0);
  }
  function cellPaidValue(cell) {
    const maker = findMaker(cell?.makerId);
    if (!maker) return 0;
    let paid = maker.jk ? 0 : Number(maker.cost || 0);
    for (let level = 1; level < Number(cell?.level || 1); level += 1) paid += upgradeCostForMaker(maker, level);
    return paid;
  }
  function selectionUpgradeCost(data, keys) {
    return keys.reduce((sum, key) => {
      const cell = data.cells?.[key];
      const maker = findMaker(cell?.makerId);
      const level = clamp(cell?.level, 1, 5);
      return sum + (cell && maker && level < 5 ? upgradeCostForMaker(maker, level) : 0);
    }, 0);
  }
  function selectionRefund(data, keys) {
    return keys.reduce((sum, key) => sum + Math.floor(cellPaidValue(data.cells?.[key]) * .35), 0);
  }
  function collectSelected() {
    const data = ensureState();
    const keys = selectionKeys(data);
    if (!keys.length) return toast("Markiere zuerst mindestens einen Maker.");
    updateAccrualNoRecursion(data);
    let amount = 0;
    keys.forEach(key => {
      const cell = data.cells[key];
      amount += Math.max(0, Number(cell?.stored || 0));
      if (cell) cell.stored = 0;
    });
    amount = Math.floor(amount * 100) / 100;
    if (amount <= 0) return toast("Bei den markierten Makern ist noch nichts eingesammelt.");
    data.dollars += amount;
    data.lifetimeEarned += amount;
    data.stats.collected += amount;
    recordPeak(data);
    awardMoneyMainXp(data, Math.min(18, 4 + Math.floor(Math.log10(amount + 1))), "Money.KL Einsammeln");
    persist();
    toast(`${formatDollar(amount)} von ${keys.length} Maker${keys.length === 1 ? "" : "n"} eingesammelt`);
    render();
  }
  function upgradeSelectedMany() {
    const data = ensureState();
    const keys = selectionKeys(data);
    if (!keys.length) return toast("Markiere zuerst mindestens einen Maker.");
    const upgradeable = keys.filter(key => {
      const cell = data.cells?.[key];
      return cell && findMaker(cell.makerId) && clamp(cell.level, 1, 5) < 5;
    });
    if (!upgradeable.length) return toast("Alle markierten Maker sind bereits Level 5.");
    const cost = selectionUpgradeCost(data, upgradeable);
    if (data.dollars < cost) return toast(`Dir fehlen ${formatDollar(cost - data.dollars)} für alle markierten Upgrades.`);
    data.dollars -= cost;
    upgradeable.forEach(key => { data.cells[key].level = clamp(data.cells[key].level, 1, 5) + 1; });
    data.stats.upgrades += upgradeable.length;
    awardMoneyMainXp(data, Math.min(24, 5 + upgradeable.length), "Money.KL Mehrfach-Upgrade");
    persist();
    toast(`${upgradeable.length} Maker gleichzeitig verbessert · ${formatDollar(cost)}`);
    render();
  }
  function removeCells(keys, options = {}) {
    const data = ensureState();
    if (!data) return { count:0, refund:0, stored:0, jk:0 };
    const valid = [...new Set(keys)].filter(key => !!data.cells?.[key]);
    if (!valid.length) return { count:0, refund:0, stored:0, jk:0 };
    updateAccrualNoRecursion(data);
    let refund = 0, stored = 0, jk = 0;
    valid.forEach(key => {
      const cell = data.cells[key];
      const maker = findMaker(cell?.makerId);
      stored += Math.max(0, Number(cell?.stored || 0));
      refund += Math.floor(cellPaidValue(cell) * .35);
      if (maker?.jk) jk += 1;
      delete data.cells[key];
    });
    stored = Math.floor(stored * 100) / 100;
    data.dollars += refund + stored;
    data.lifetimeEarned += stored;
    data.stats.collected += stored;
    recordPeak(data);
    valid.forEach(key => UI.selectedCells.delete(key));
    if (valid.includes(UI.selectedCell)) UI.selectedCell = "";
    if (!options.silentXp) awardMoneyMainXp(data, Math.min(20, 4 + valid.length), "Money.KL Verkauf");
    persist();
    return { count:valid.length, refund, stored, jk };
  }
  function sellSelectedMany() {
    const data = ensureState();
    const keys = selectionKeys(data);
    if (!keys.length) return toast("Markiere zuerst mindestens einen Maker.");
    const refund = selectionRefund(data, keys);
    if (!confirm(`${keys.length} markierte Maker verkaufen? Normale Maker geben 35 % zurück, JK Maker gehen zurück ins JK-Maker-Inventar. Erwartete Rückgabe: ${formatDollar(refund)} plus gespeicherte Erträge.`)) return;
    const result = removeCells(keys);
    clearSelection();
    toast(`${result.count} Maker entfernt · ${formatDollar(result.refund + result.stored)} gutgeschrieben${result.jk ? ` · ${result.jk} JK Maker zurückgelegt` : ""}`);
    render();
  }
  function clearBoard() {
    const data = ensureState();
    const keys = Object.keys(data?.cells || {});
    if (!keys.length) return toast("Das Feld ist bereits leer.");
    const refund = selectionRefund(data, keys);
    if (!confirm(`Feld wirklich clearen? Alle ${keys.length} platzierten Maker werden verkauft bzw. JK Maker ins Inventar zurückgelegt. Rückgabe ca. ${formatDollar(refund)} plus gespeicherte Erträge.`)) return;
    const result = removeCells(keys, { silentXp:true });
    clearSelection();
    awardMoneyMainXp(data, 10, "Money.KL Feld gecleart");
    persist();
    toast(`Feld gecleart · ${result.count} Maker entfernt · ${formatDollar(result.refund + result.stored)} gutgeschrieben`);
    render();
  }
  function moveCell(fromKey, toKey) {
    const data = ensureState();
    if (!data || !fromKey || !toKey || fromKey === toKey || !data.cells?.[fromKey]) {
      selectOnly(fromKey, data);
      render();
      return;
    }
    updateAccrualNoRecursion(data);
    const source = data.cells[fromKey];
    const target = data.cells[toKey];
    if (target) {
      data.cells[fromKey] = target;
      data.cells[toKey] = source;
      toast("Maker-Positionen getauscht.");
    } else {
      data.cells[toKey] = source;
      delete data.cells[fromKey];
      toast("Maker verschoben.");
    }
    selectOnly(toKey, data);
    persist();
    render();
  }

  function placeOrCollect(key) {
    const data = ensureState();
    if (!data) return;
    updateAccrual(data);
    const existing = data.cells[key];
    if (existing) {
      selectOnly(key, data);
      if (Number(existing.stored || 0) >= .01) {
        const amount = Math.floor(Number(existing.stored || 0) * 100) / 100;
        existing.stored = 0;
        data.dollars += amount;
        data.lifetimeEarned += amount;
        data.stats.collected += amount;
        data.stats.clicks += 1;
        recordPeak(data);
        awardMoneyMainXp(data, Math.min(14, 3 + Math.floor(Math.log10(amount + 1))), "Money.KL Maker-Einnahmen");
        toast(`+${formatDollar(amount)} von ${findMaker(existing.makerId)?.name || "Maker"}`);
        persist();
      }
      render();
      return;
    }
    clearSelection();
    const maker = selectedMaker(data);
    if (!makerUnlocked(data, maker)) {
      if (maker.jk) return toast(`${maker.name} ist noch nicht über JK/Coin verfügbar.`);
      return toast(`${maker.name} wird freigeschaltet, sobald du einmal ${formatDollar(maker.cost)} gleichzeitig besitzt.`);
    }
    if (maker.jk) {
      if (jkMakerAvailable(data, maker.id) <= 0) return toast(`Keine freie ${maker.name}-Lizenz. Weitere Exemplare gibt es im JK/Coin-Shop.`);
    } else {
      if (data.dollars < maker.cost) return toast(`Dir fehlen ${formatDollar(maker.cost - data.dollars)} für ${maker.name}.`);
      data.dollars -= maker.cost;
    }
    data.cells[key] = { makerId: maker.id, level: 1, stored: 0, placedAt: Date.now() };
    data.stats.placements += 1;
    selectOnly(key, data);
    awardMoneyMainXp(data, 6, "Money.KL Maker platziert");
    persist();
    toast(`${maker.name} platziert · +${formatDollar(makerIncome(maker, 1))}/s`);
    render();
  }
  function upgradeSelected() {
    const data = ensureState();
    const cell = selectedCell(data);
    if (!cell) return toast("Wähle zuerst einen platzierten Maker aus.");
    const maker = findMaker(cell.makerId);
    if (!maker) return toast("Dieser Maker konnte nicht geladen werden.");
    const level = clamp(cell.level, 1, 5);
    if (level >= 5) return toast("Dieser Maker ist bereits Level 5.");
    const cost = upgradeCostForMaker(maker, level);
    if (data.dollars < cost) return toast(`Dir fehlen ${formatDollar(cost - data.dollars)} für das Upgrade.`);
    data.dollars -= cost;
    cell.level = level + 1;
    data.stats.upgrades += 1;
    awardMoneyMainXp(data, 8, "Money.KL Upgrade");
    persist();
    toast(`${maker.name} ist jetzt Level ${cell.level} · ${formatDollar(cellIncome(cell))}/s`);
    render();
  }
  function removeSelected() {
    const data = ensureState();
    const key = UI.selectedCell;
    const cell = selectedCell(data);
    if (!cell || !key) return;
    const maker = findMaker(cell.makerId);
    const result = removeCells([key]);
    clearSelection();
    toast(maker?.jk
      ? `${maker?.name || "JK Maker"} zurück ins JK-Maker-Inventar gelegt · ${formatDollar(result.refund + result.stored)} gutgeschrieben`
      : `${maker?.name || "Maker"} verkauft · ${formatDollar(result.refund + result.stored)} erhalten`);
    render();
  }
  function tierUnlocked(data, size) {
    if (Number(size) === 2) return true;
    return data?.[`unlocked${Number(size)}`] === true;
  }
  function previousTier(size) {
    const index = BOARD_TIERS.findIndex(tier => tier.size === Number(size));
    return index > 0 ? BOARD_TIERS[index - 1] : null;
  }
  function unlockBoard(size) {
    const data = ensureState();
    const tier = BOARD_TIERS.find(entry => entry.size === Number(size));
    if (!data || !tier || tier.size === 2) return;
    if (tierUnlocked(data, tier.size)) {
      data.boardSize = tier.size;
      UI.selectedCell = "";
      persist();
      render();
      return;
    }
    const previous = previousTier(tier.size);
    if (previous && !tierUnlocked(data, previous.size)) return toast(`Schalte zuerst das ${previous.size}×${previous.size}-Feld frei.`);
    if (data.dollars < tier.price) return toast(`Das ${tier.size}×${tier.size}-Feld kostet ${formatDollar(tier.price)}.`);
    if (!confirm(`${tier.size}×${tier.size}-Feld für ${formatDollar(tier.price)} freischalten?`)) return;
    data.dollars -= tier.price;
    data[`unlocked${tier.size}`] = true;
    data.boardSize = tier.size;
    clearSelection();
    awardMoneyMainXp(data, 15, "Money.KL Feld erweitert");
    persist();
    toast(`${tier.size}×${tier.size}-Feld freigeschaltet!`);
    render();
  }
  function grantJkCoinPurchase(kind, amount = 1) {
    const data = ensureState();
    if (!data) return false;
    const count = Math.max(1, Math.floor(Number(amount) || 1));
    const now = Date.now();
    if (kind === "auto30") {
      data.boosts.autoCollectUntil = Math.max(now, Number(data.boosts.autoCollectUntil || 0)) + count * 30 * 60 * 1000;
    } else if (/^production(?:2|4|6|8|10|12|14|16|18|20)$/.test(String(kind))) {
      const multiplier = Math.max(2, Math.min(20, Number(String(kind).replace("production", "")) || 2));
      const sameActive = Number(data.boosts.productionUntil || 0) > now && Number(data.boosts.productionMultiplier || 1) === multiplier;
      data.boosts.productionMultiplier = multiplier;
      data.boosts.productionUntil = (sameActive ? Number(data.boosts.productionUntil) : now) + count * 15 * 60 * 1000;
    } else if (kind === "instant10") {
      const earned = Math.floor(totalPerSecond(data) * 600 * count * 100) / 100;
      data.dollars += earned;
      data.lifetimeEarned += earned;
      data.stats.collected += earned;
      recordPeak(data);
    } else if (/^jkMaker:jk-maker-(?:[1-9]|10)$/.test(String(kind))) {
      const makerId = String(kind).split(":")[1];
      data.jkMakerOwned[makerId] = jkMakerOwnedCount(data, makerId) + count;
    } else {
      return false;
    }
    persist();
    if (UI.overlay) render();
    return true;
  }

  function makerVisualType(index) {
    if (index < 10) return "worker";
    if (index < 20) return "stall";
    if (index < 35) return "shop";
    if (index < 50) return "office";
    if (index < 70) return "tower";
    if (index < 85) return "space";
    return "cosmic";
  }
  function makerModelHtml(maker, level = 1, compact = false) {
    const type = makerVisualType(maker.index);
    const safeLevel = clamp(level, 1, 5);
    return `<span class="money-kl-model type-${type} ${compact ? "compact" : ""}" style="--maker-color:${maker.color};--maker-level:${safeLevel}"><span class="model-shadow"></span><span class="model-base"></span><span class="model-body"></span><span class="model-roof"></span><span class="model-head"></span><span class="model-accent"></span><span class="model-sign">${esc(maker.icon)}</span></span>`;
  }
  function useLiteBoardModels(data) {
    const occupied = Object.keys(data?.cells || {}).length;
    const memory = Number(navigator.deviceMemory || 8);
    const cores = Number(navigator.hardwareConcurrency || 8);
    return Number(data?.boardSize || 2) >= 10 || occupied >= 64 || memory <= 4 || cores <= 4;
  }
  function makerBoardLiteHtml(maker, level = 1) {
    const safeLevel = clamp(level, 1, 5);
    return `<span class="money-kl-model-lite" style="--maker-color:${maker.color};--maker-level:${safeLevel}"><i>${esc(maker.icon)}</i></span>`;
  }
  function fieldProgressHtml(data) {
    return `<div class="money-kl-field-tiers">${BOARD_TIERS.map(tier => {
      const unlocked = tierUnlocked(data, tier.size);
      const current = data.boardSize === tier.size;
      const previous = previousTier(tier.size);
      const canBuy = !unlocked && (!previous || tierUnlocked(data, previous.size));
      const action = current
        ? `<strong>AKTIV</strong>`
        : unlocked
          ? `<button class="money-kl-button" data-money-unlock="${tier.size}">Öffnen</button>`
          : canBuy
            ? `<button class="money-kl-button gold" data-money-unlock="${tier.size}">${formatDollar(tier.price)}</button>`
            : `<strong>${previous?.size || 2}×${previous?.size || 2} zuerst</strong>`;
      return `<article class="money-kl-field-tier ${unlocked ? "unlocked" : "locked"} ${current ? "current" : ""}"><div class="field-tier-preview size-${tier.size}"><span></span><span></span><span></span><span></span></div><div><small>${tier.label}</small><b>${tier.size}×${tier.size}</b><p>${tier.description}</p></div>${action}</article>`;
    }).join("")}</div>`;
  }

  function boardHtml(data) {
    const size = data.boardSize;
    const lite = useLiteBoardModels(data);
    const selected = new Set(selectionKeys(data));
    let html = "";
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const key = `${x}:${y}`;
        const cell = data.cells[key];
        const district = (Math.floor(x / 4) + Math.floor(y / 4)) % 2 ? "district-b" : "district-a";
        if (!cell) {
          html += `<button class="money-kl-cell empty ${district}" data-money-cell="${key}" title="${esc(selectedMaker(data).name)} hier platzieren"><span class="money-kl-plot"><span class="plot-ground"></span><span class="plot-lines"></span><span class="plot-add">＋</span></span></button>`;
        } else {
          const maker = findMaker(cell.makerId) || MAKERS[0];
          const visual = lite ? makerBoardLiteHtml(maker, cell.level) : makerModelHtml(maker, cell.level);
          html += `<button class="money-kl-cell occupied ${maker.jk ? "jk-premium" : ""} ${district} ${selected.has(key) ? "selected" : ""} ${Number(cell.stored || 0) >= .01 ? "has-money" : ""}" style="--maker-color:${maker.color}" data-money-cell="${key}" title="${esc(maker.name)} · Level ${cell.level} · ${formatDollar(cellIncome(cell))}/s"><span class="money-kl-plot"><span class="plot-ground"></span><span class="plot-lines"></span>${visual}</span><em>${maker.jk ? "JK · " : ""}L${cell.level}</em><b>${Number(cell.stored || 0) >= 1 ? formatShortNumber(cell.stored) : ""}</b>${lite ? "" : `<span class="money-kl-cell-name">${esc(maker.name)}</span>`}</button>`;
        }
      }
    }
    return html;
  }
  function makersHtml(data) {
    return MAKERS.map(maker => {
      const unlocked = makerUnlocked(data, maker);
      const unlockText = unlocked ? `Kaufpreis: ${maker.cost ? formatDollar(maker.cost) : "START"}` : `Freischalten: einmal ${formatDollar(maker.cost)} besitzen`;
      return `<button class="money-kl-maker ${data.selectedMakerId === maker.id ? "active" : ""} ${unlocked ? "" : "locked"}" data-money-maker="${maker.id}" ${unlocked ? "" : "disabled"}><span class="money-kl-maker-preview">${makerModelHtml(maker, 1, true)}</span><span><b>${esc(maker.name)}</b><small>Level 1: ${formatDollar(makerIncome(maker,1))}/s · Level 5: ${formatDollar(makerIncome(maker,5))}/s<br>${esc(unlockText)}</small></span><em>${maker.cost ? formatDollar(maker.cost) : "START"}</em></button>`;
    }).join("");
  }
  function jkMakersHtml(data) {
    const cards = JK_MAKERS.map(maker => {
      const owned = jkMakerOwnedCount(data, maker.id);
      const placed = placedJkMakerCount(data, maker.id);
      const available = Math.max(0, owned - placed);
      const selectable = available > 0;
      return `<button class="money-kl-maker jk-premium ${data.selectedMakerId === maker.id ? "active" : ""} ${selectable ? "" : "locked"}" data-money-maker="${maker.id}" ${selectable ? "" : "disabled"}><span class="money-kl-maker-preview">${makerModelHtml(maker, 1, true)}</span><span><b>${esc(maker.name)}</b><small>Level 1: ${formatDollar(makerIncome(maker,1))}/s · Level 5: ${formatDollar(makerIncome(maker,5))}/s<br>Besitz: ${owned} · Platziert: ${placed} · Frei: ${available}</small></span><em>JK</em></button>`;
    }).join("");
    return `<div class="money-kl-jk-note"><b>JK Maker</b><p>Diese Premium-Maker werden ausschließlich im Money.KL-Bereich der JK/Coin-App gekauft. Jeder Kauf gibt dir ein platzierbares Exemplar.</p><button class="money-kl-button gold" data-money-open-jkcoin-store>Money.KL JK/Coin-Shop öffnen</button></div>${cards}`;
  }
  function boostStatusHtml(data) {
    const now = Date.now();
    const mult = productionMultiplier(data);
    const productionText = Number(data.boosts.productionUntil || 0) > now
      ? `${mult}× Produktion: ${Math.ceil((Number(data.boosts.productionUntil)-now)/60000)} Min.`
      : "Produktionsboost: Aus";
    const autoText = Number(data.boosts.autoCollectUntil || 0) > now
      ? `Auto-Collector: ${Math.ceil((Number(data.boosts.autoCollectUntil)-now)/60000)} Min.`
      : "Auto-Collector: Aus";
    return `${productionText}<br>${autoText}`;
  }
  function boostsInfoHtml(data) {
    return `<div class="money-kl-jk-note"><b>Power-Ups nur noch mit JK/Coin</b><p>Euro-Käufe wurden entfernt. Öffne den Money.KL-Shop in JK/Coin und kaufe dort Auto-Collector, Produktionsboosts von 2× bis 20× oder den 10-Minuten-Sofortertrag.</p><div class="money-kl-boost-price-list"><span>Auto-Collector 30 Min. <b>200 JK/Coin</b></span><span>2× bis 20× Produktion, je 15 Min. <b>200–2.000 JK/Coin</b></span><span>10 Min. Sofortertrag <b>500 JK/Coin</b></span></div><button class="money-kl-button gold" data-money-open-jkcoin-store>Money.KL JK/Coin-Shop öffnen</button><small>AKTIV</small><p data-money-live-boosts>${boostStatusHtml(data)}</p></div>`;
  }
  function multiSelectionDetailHtml(data, keys) {
    const cells = keys.map(key => data.cells[key]).filter(Boolean);
    const upgradeable = cells.filter(cell => clamp(cell.level, 1, 5) < 5);
    const upgradeCost = selectionUpgradeCost(data, keys);
    const refund = selectionRefund(data, keys);
    const stored = selectedStoredAmount(data, keys);
    const pps = cells.reduce((sum, cell) => sum + cellIncome(cell), 0) * productionMultiplier(data);
    return `<div class="money-kl-detail money-kl-multi-detail"><small>MEHRFACHAUSWAHL</small><h3>${keys.length} Maker markiert</h3><p>Ziehe auf einer freien Fläche einen Rahmen über weitere Maker oder tippe einen Maker direkt an, um wieder einzeln zu arbeiten.</p><div class="money-kl-stats"><div class="money-kl-stat"><small>PRO SEKUNDE</small><b>${formatDollar(pps)}</b></div><div class="money-kl-stat"><small>GESPEICHERT</small><b>${formatDollar(stored)}</b></div><div class="money-kl-stat"><small>UPGRADE +1</small><b>${upgradeable.length ? formatDollar(upgradeCost) : "MAX"}</b></div><div class="money-kl-stat"><small>RÜCKGABE</small><b>${formatDollar(refund)}</b></div></div><div class="money-kl-actions"><button class="money-kl-button primary" data-money-upgrade-selected ${upgradeable.length ? "" : "disabled"}>${upgradeable.length ? `${upgradeable.length} Maker +1 upgraden` : "Alle Level 5"}</button><button class="money-kl-button" data-money-collect-selected>Markierte einsammeln</button><button class="money-kl-button danger" data-money-sell-selected>Markierte verkaufen</button><button class="money-kl-button" data-money-clear-selection>Markierung aufheben</button></div></div>`;
  }
  function detailHtml(data) {
    const selectedKeys = selectionKeys(data);
    if (selectedKeys.length > 1) return multiSelectionDetailHtml(data, selectedKeys);
    const cell = selectedCell(data);
    if (!cell) {
      const maker = selectedMaker(data);
      const extra = maker.jk ? `<p class="money-kl-premium-copy">JK Maker · freie Exemplare: ${jkMakerAvailable(data,maker.id)}</p>` : "";
      return `<div class="money-kl-detail"><div class="money-kl-detail-icon">${makerModelHtml(maker, 1, true)}</div><h3>${esc(maker.name)}</h3>${extra}<p>Wähle ein freies Feld. Der Maker startet auf Level 1 und kann bis Level 5 verbessert werden.</p><div class="money-kl-stats"><div class="money-kl-stat"><small>LEVEL 1</small><b>${formatDollar(makerIncome(maker,1))}/s</b></div><div class="money-kl-stat"><small>LEVEL 5</small><b>${formatDollar(makerIncome(maker,5))}/s</b></div></div></div>`;
    }
    const maker = findMaker(cell.makerId) || MAKERS[0];
    const level = clamp(cell.level,1,5);
    const cost = level < 5 ? upgradeCostForMaker(maker, level) : 0;
    const removeLabel = maker.jk ? "Ins JK-Maker-Inventar" : "Rückgabe · 35 %";
    return `<div class="money-kl-detail"><div class="money-kl-detail-icon">${makerModelHtml(maker, cell.level, true)}</div><h3>${esc(maker.name)}</h3><p>Position ${esc(UI.selectedCell)} · Level ${level}/5${maker.jk ? " · JK Maker" : ""}</p><div class="money-kl-stats"><div class="money-kl-stat"><small>PRO SEKUNDE</small><b data-money-live-selected-pps>${formatDollar(cellIncome(cell))}</b></div><div class="money-kl-stat"><small>GESPEICHERT</small><b data-money-live-selected-stored>${formatDollar(cell.stored || 0)}</b></div></div><div class="money-kl-actions">${level < 5 ? `<button class="money-kl-button primary" data-money-upgrade>Auf Level ${level + 1} · ${formatDollar(cost)}</button>` : `<button class="money-kl-button" disabled>Maximallevel erreicht</button>`}<button class="money-kl-button danger" data-money-remove>${removeLabel}</button></div></div>`;
  }
  function leaderboardHtml() {
    if (!UI.leaderboard.length) return `<p style="color:#91b3a8">${esc(UI.onlineStatus || "Noch keine Einträge geladen.")}</p>`;
    const ownUid = window.LifeBuilderFirebaseCore?.getRuntime?.()?.auth?.currentUser?.uid || "";
    const now = Date.now();
    const onlineCount = UI.leaderboard.filter(row => now - Number(row.updatedAtMs || 0) <= LEADERBOARD_ACTIVE_MS).length;
    return `<p style="color:#91b3a8;margin:10px 0 8px">${onlineCount ? `${onlineCount} Spieler ${onlineCount === 1 ? "ist" : "sind"} gerade in Money.KL online.` : "Gerade ist kein weiterer Money.KL-Spieler online."}</p><div class="money-kl-leader">${UI.leaderboard.map((row,index) => {
      const isOnline = now - Number(row.updatedAtMs || 0) <= LEADERBOARD_ACTIVE_MS;
      return `<article class="${row.uid === ownUid ? "you" : ""}"><b>${index+1}.</b><span><b>${esc(row.displayName || "Spieler")}</b><small>${isOnline ? "● JETZT ONLINE · " : ""}${formatDollar(row.perSecond || 0)}/s · ${row.boardSize || 2}×${row.boardSize || 2}</small></span><strong>${formatDollar(row.netWorth || 0)}</strong></article>`;
    }).join("")}</div>`;
  }
  function activeCharacterHtml() {
    const current = appState() || {};
    const fullName = `${current.firstName || "Spieler"} ${current.lastName || ""}`.trim();
    let portrait = "";
    try {
      if (typeof avatarHtml === "function") portrait = avatarHtml("mini");
    } catch {}
    if (!portrait) {
      const fallback = current.gender === "female" ? "👩" : "👨";
      portrait = `<span class="money-kl-character-fallback">${fallback}</span>`;
    }
    return `<div class="money-kl-active-character"><div class="money-kl-character-portrait">${portrait}</div><span><small>AKTIVER HAUPTCHARAKTER</small><b>${esc(fullName || "Spieler")}</b><em>Level ${Math.max(0,Number(current.level || 0))}</em></span></div>`;
  }

  function leftPanelHtml(data) {
    const nextTier = BOARD_TIERS.find(tier => !tierUnlocked(data, tier.size));
    const nextUnlock = nextTier?.size || 0;
    const menu = `<div class="money-kl-menu"><button class="${UI.view === "board" ? "active" : ""}" data-money-view="board">Spielfeld <span>${data.boardSize}×${data.boardSize}</span></button><button class="${UI.view === "makers" ? "active" : ""}" data-money-view="makers">Maker</button><button class="${UI.view === "jkmakers" ? "active" : ""}" data-money-view="jkmakers">JK Maker <span>Premium</span></button><button class="${UI.view === "boosts" ? "active" : ""}" data-money-view="boosts">Power-Ups <span>JK</span></button><button class="${UI.view === "leader" ? "active" : ""}" data-money-view="leader">Topliste</button></div>`;
    const content = UI.view === "makers"
      ? `<div class="money-kl-shop">${makersHtml(data)}</div>`
      : UI.view === "jkmakers"
        ? `<div class="money-kl-shop">${jkMakersHtml(data)}</div>`
        : UI.view === "boosts"
          ? boostsInfoHtml(data)
          : UI.view === "leader"
            ? `<button class="money-kl-button" data-money-refresh-leader>Topliste aktualisieren</button>${leaderboardHtml()}`
            : `<p class="money-kl-help"><b>Platzieren:</b> freien Platz kurz antippen. <b>Verschieben:</b> einen platzierten Maker direkt ziehen. <b>Mehrere markieren:</b> auf einem freien Platz oder am Feldrand drücken und einen Rahmen über die gewünschten Maker ziehen. Danach kannst du sie gemeinsam upgraden, einsammeln oder verkaufen.</p><button class="money-kl-button primary" data-money-collect-all>Alles einsammeln</button><button class="money-kl-button danger money-kl-clear-field" data-money-clear-field>Feld clearen</button><h3 class="money-kl-field-title">Feld-Ausbau</h3>${fieldProgressHtml(data)}${nextUnlock ? `<p class="money-kl-next-goal">Nächstes Ziel: ${nextUnlock}×${nextUnlock} für ${formatDollar(BOARD_TIERS.find(t => t.size === nextUnlock).price)}</p>` : `<p class="money-kl-next-goal complete">Maximale Fläche 10×10 erreicht</p>`}`;
    return `<aside class="money-kl-panel left ${UI.leftOpen ? "open" : ""}">${activeCharacterHtml()}<small>MONEY.KL</small><h2>Steuerung</h2>${menu}${content}</aside>`;
  }
  function rightPanelHtml(data, metrics = {}) {
    const placed = Number.isFinite(metrics.placed) ? metrics.placed : Object.keys(data.cells).length;
    const pps = Number.isFinite(metrics.pps) ? metrics.pps : totalPerSecond(data);
    const worth = Number.isFinite(metrics.worth) ? metrics.worth : netWorth(data);
    return `<aside class="money-kl-panel right ${UI.rightOpen ? "open" : ""}"><small>DEIN IMPERIUM</small><h2>Statistik</h2><div class="money-kl-stats"><div class="money-kl-stat"><small>PLATZIERT</small><b data-money-live-placed>${placed}/${data.boardSize*data.boardSize}</b></div><div class="money-kl-stat"><small>PRO SEKUNDE</small><b data-money-live-pps>${formatDollar(pps)}</b></div><div class="money-kl-stat"><small>NETTOWERT</small><b data-money-live-networth>${formatDollar(worth)}</b></div><div class="money-kl-stat"><small>GESAMT VERDIENT</small><b data-money-live-lifetime>${formatDollar(data.lifetimeEarned)}</b></div></div>${detailHtml(data)}<div class="money-kl-detail"><small>AKTIVE BOOSTS</small><p data-money-live-boosts>${boostStatusHtml(data)}</p></div></aside>`;
  }
  function captureScrollState() {
    if (!UI.overlay) return null;
    const left = UI.overlay.querySelector(".money-kl-panel.left");
    const right = UI.overlay.querySelector(".money-kl-panel.right");
    const board = UI.overlay.querySelector(".money-kl-board-scroll");
    return {
      leftTop: left?.scrollTop || 0,
      rightTop: right?.scrollTop || 0,
      boardTop: board?.scrollTop || 0,
      boardLeft: board?.scrollLeft || 0
    };
  }
  function restoreScrollState(saved) {
    if (!saved || !UI.overlay) return;
    const left = UI.overlay.querySelector(".money-kl-panel.left");
    const right = UI.overlay.querySelector(".money-kl-panel.right");
    const board = UI.overlay.querySelector(".money-kl-board-scroll");
    if (left) left.scrollTop = saved.leftTop;
    if (right) right.scrollTop = saved.rightTop;
    if (board) { board.scrollTop = saved.boardTop; board.scrollLeft = saved.boardLeft; }
  }
  function refreshDynamicValues(data = ensureState()) {
    if (!data || !UI.overlay) return;
    const setText = (selector, value) => {
      const node = UI.overlay.querySelector(selector);
      if (node && node.textContent !== String(value)) node.textContent = String(value);
    };
    const pps = totalPerSecond(data);
    const worth = netWorth(data);
    const placed = Object.keys(data.cells).length;
    setText("[data-money-live-balance]", formatDollar(data.dollars));
    setText("[data-money-live-toolbar-pps]", `${formatDollar(pps)}/s`);
    setText("[data-money-live-placed]", `${placed}/${data.boardSize * data.boardSize}`);
    setText("[data-money-live-pps]", formatDollar(pps));
    setText("[data-money-live-networth]", formatDollar(worth));
    setText("[data-money-live-lifetime]", formatDollar(data.lifetimeEarned));
    const selected = selectedCell(data);
    if (selected) {
      setText("[data-money-live-selected-pps]", formatDollar(cellIncome(selected)));
      setText("[data-money-live-selected-stored]", formatDollar(selected.stored || 0));
    }
    const boosts = UI.overlay.querySelector("[data-money-live-boosts]");
    if (boosts) boosts.innerHTML = boostStatusHtml(data);
    const buttons = UI.cellButtons?.length ? UI.cellButtons : [...UI.overlay.querySelectorAll("[data-money-cell]")];
    buttons.forEach(button => {
      const cell = data.cells[button.dataset.moneyCell];
      if (!cell) return;
      const stored = Math.max(0, Number(cell.stored || 0));
      button.classList.toggle("has-money", stored >= .01);
      const badge = button.querySelector("b");
      if (badge) {
        const next = stored >= 1 ? formatShortNumber(stored) : "";
        if (badge.textContent !== next) badge.textContent = next;
      }
    });
  }

  function render() {
    const data = ensureState();
    if (!data || !UI.overlay) return;
    updateAccrual(data);
    const savedScroll = captureScrollState();
    const placedCount = Object.keys(data.cells).length;
    const pps = totalPerSecond(data);
    const worth = netWorth(data);
    const selectedCount = selectionKeys(data).length;
    const perfClass = useLiteBoardModels(data) ? " performance-lite" : "";
    UI.overlay.innerHTML = `<div class="money-kl-shell"><header class="money-kl-top"><div class="money-kl-brand"><small>JK.GAMES · IDLE EMPIRE</small><h1>Money.KL</h1></div><div class="money-kl-balance"><small>DEINE SPIEL-DOLLAR</small><b data-money-live-balance>${formatDollar(data.dollars)}</b></div><div class="money-kl-top-actions"><button class="jkc-game-inline-button" data-money-jkcoin title="JK/Coin öffnen">JK</button><button data-money-toggle-left>☰ <span>Menü</span></button><button data-money-toggle-right>▤ <span>Stats</span></button><button data-money-exit>×</button></div></header><main class="money-kl-layout">${leftPanelHtml(data)}<section class="money-kl-center${perfClass}"><div class="money-kl-board-toolbar"><div><span class="money-kl-chip field">${data.boardSize}×${data.boardSize} · ${BOARD_TIERS.find(t => t.size === data.boardSize)?.label || "Feld"}</span><span class="money-kl-chip">${placedCount} Maker</span><span class="money-kl-chip" data-money-live-toolbar-pps>${formatDollar(pps)}/s</span><span class="money-kl-chip maker">Maker: ${esc(selectedMaker(data).name)}</span>${selectedCount ? `<span class="money-kl-chip selected" data-money-selection-chip>${selectedCount} markiert</span>` : ""}</div>${activeCharacterHtml()}</div><div class="money-kl-board-scroll"><div class="money-kl-world size-${data.boardSize}"><div class="money-kl-skyline" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div><div class="money-kl-board size-${data.boardSize}" style="--size:${data.boardSize}">${boardHtml(data)}</div></div></div></section>${rightPanelHtml(data, { placed:placedCount, pps, worth })}</main></div>`;
    bind();
    UI.cellButtons = [...UI.overlay.querySelectorAll("[data-money-cell]")];
    restoreScrollState(savedScroll);
  }

  function clearGestureVisuals() {
    UI.overlay?.querySelector(".money-kl-selection-box")?.remove();
    UI.overlay?.querySelectorAll(".money-kl-cell.selection-preview,.money-kl-cell.drop-target,.money-kl-cell.dragging").forEach(el => {
      el.classList.remove("selection-preview","drop-target","dragging");
    });
  }
  function cellAtPoint(x, y) {
    return document.elementFromPoint(x, y)?.closest?.("[data-money-cell]") || null;
  }
  function rectFromPoints(x1, y1, x2, y2) {
    return { left:Math.min(x1,x2), top:Math.min(y1,y2), right:Math.max(x1,x2), bottom:Math.max(y1,y2) };
  }
  function rectsIntersect(a, b) {
    return a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top;
  }
  function ensureSelectionBox() {
    let box = UI.overlay?.querySelector(".money-kl-selection-box");
    if (!box && UI.overlay) {
      box = document.createElement("div");
      box.className = "money-kl-selection-box";
      UI.overlay.append(box);
    }
    return box;
  }
  function updateMarqueeGesture(event) {
    const g = UI.gesture;
    if (!g || g.mode !== "marquee") return;
    const rect = rectFromPoints(g.startX, g.startY, event.clientX, event.clientY);
    const box = ensureSelectionBox();
    if (box) {
      box.style.left = `${rect.left}px`;
      box.style.top = `${rect.top}px`;
      box.style.width = `${Math.max(1, rect.right - rect.left)}px`;
      box.style.height = `${Math.max(1, rect.bottom - rect.top)}px`;
    }
    const preview = new Set();
    UI.cellButtons.forEach(button => {
      const cellRect = button.getBoundingClientRect();
      const occupied = button.classList.contains("occupied");
      const hit = occupied && rectsIntersect(rect, cellRect);
      button.classList.toggle("selection-preview", hit);
      if (hit) preview.add(button.dataset.moneyCell);
    });
    g.preview = preview;
  }
  function autoScrollBoardAtPoint(x, y) {
    const scroller = UI.overlay?.querySelector(".money-kl-board-scroll");
    if (!scroller) return;
    const rect = scroller.getBoundingClientRect();
    const edge = Math.min(46, Math.max(28, Math.min(rect.width, rect.height) * .1));
    const step = 16;
    let dx = 0, dy = 0;
    if (x < rect.left + edge) dx = -step;
    else if (x > rect.right - edge) dx = step;
    if (y < rect.top + edge) dy = -step;
    else if (y > rect.bottom - edge) dy = step;
    if (dx || dy) scroller.scrollBy({ left:dx, top:dy, behavior:"auto" });
  }
  function bindBoardGestures(root) {
    const board = root.querySelector(".money-kl-board");
    if (!board) return;
    const finish = (event, cancelled = false) => {
      const g = UI.gesture;
      if (!g || g.pointerId !== event.pointerId) return;
      if (g.raf) { cancelAnimationFrame(g.raf); g.raf = 0; }
      const data = ensureState();
      if (!cancelled && g.mode === "move") {
        if (g.moved) {
          const target = cellAtPoint(event.clientX, event.clientY);
          const targetKey = target?.dataset.moneyCell || "";
          if (targetKey) moveCell(g.sourceKey, targetKey);
          else { selectOnly(g.sourceKey, data); render(); }
        } else {
          placeOrCollect(g.sourceKey);
        }
      } else if (!cancelled && g.mode === "marquee") {
        if (g.moved) {
          UI.selectedCells = new Set([...(g.preview || [])].filter(key => !!data?.cells?.[key]));
          UI.selectedCell = UI.selectedCells.size === 1 ? [...UI.selectedCells][0] : "";
          const count = UI.selectedCells.size;
          if (count > 1 && matchMedia("(max-width:900px)").matches) {
            UI.rightOpen = true;
            UI.leftOpen = false;
          }
          if (count) toast(`${count} Maker markiert`);
          else toast("Keine Maker im Auswahlrahmen.");
          render();
        } else if (g.startKey) {
          placeOrCollect(g.startKey);
        }
      }
      clearGestureVisuals();
      UI.gesture = null;
      try { board.releasePointerCapture(event.pointerId); } catch {}
    };
    board.addEventListener("pointerdown", event => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const cellButton = event.target.closest("[data-money-cell]");
      const key = cellButton?.dataset.moneyCell || "";
      const occupied = !!key && !!ensureState()?.cells?.[key];
      UI.gesture = {
        pointerId:event.pointerId,
        mode:occupied ? "move" : "marquee",
        sourceKey:occupied ? key : "",
        startKey:occupied ? "" : key,
        startX:event.clientX,
        startY:event.clientY,
        moved:false,
        preview:new Set()
      };
      try { board.setPointerCapture(event.pointerId); } catch {}
      if (occupied) cellButton.classList.add("dragging");
      event.preventDefault();
    });
    board.addEventListener("pointermove", event => {
      const g = UI.gesture;
      if (!g || g.pointerId !== event.pointerId) return;
      const distance = Math.hypot(event.clientX - g.startX, event.clientY - g.startY);
      if (!g.moved && distance >= 8) g.moved = true;
      if (!g.moved) return;
      event.preventDefault();
      autoScrollBoardAtPoint(event.clientX, event.clientY);
      if (g.mode === "move") {
        root.querySelectorAll(".money-kl-cell.drop-target").forEach(el => el.classList.remove("drop-target"));
        const target = cellAtPoint(event.clientX, event.clientY);
        if (target && target.dataset.moneyCell !== g.sourceKey) target.classList.add("drop-target");
      } else {
        if (g.raf) cancelAnimationFrame(g.raf);
        g.raf = requestAnimationFrame(() => { g.raf = 0; updateMarqueeGesture(event); });
      }
    }, { passive:false });
    board.addEventListener("pointerup", event => finish(event, false));
    board.addEventListener("pointercancel", event => finish(event, true));
  }
  function bind() {
    const root = UI.overlay;
    root.querySelector("[data-money-jkcoin]")?.addEventListener("click", () => window.JKCoinApp?.openForGame?.("money"));
    root.querySelector("[data-money-toggle-left]")?.addEventListener("click", () => { UI.leftOpen = !UI.leftOpen; render(); });
    root.querySelector("[data-money-toggle-right]")?.addEventListener("click", () => { UI.rightOpen = !UI.rightOpen; render(); });
    root.querySelector("[data-money-exit]")?.addEventListener("click", requestExit);
    root.querySelectorAll("[data-money-view]").forEach(btn => btn.addEventListener("click", () => { UI.view = btn.dataset.moneyView; UI.leftOpen = true; if (UI.view === "leader") loadLeaderboard(true); render(); }));
    root.querySelectorAll("[data-money-maker]").forEach(btn => btn.addEventListener("click", () => { const data=ensureState(); data.selectedMakerId=btn.dataset.moneyMaker; persist(); UI.view="board"; if (matchMedia("(max-width:900px)").matches) UI.leftOpen=false; render(); }));
    bindBoardGestures(root);
    root.querySelector("[data-money-upgrade]")?.addEventListener("click", upgradeSelected);
    root.querySelector("[data-money-remove]")?.addEventListener("click", removeSelected);
    root.querySelector("[data-money-upgrade-selected]")?.addEventListener("click", upgradeSelectedMany);
    root.querySelector("[data-money-collect-selected]")?.addEventListener("click", collectSelected);
    root.querySelector("[data-money-sell-selected]")?.addEventListener("click", sellSelectedMany);
    root.querySelector("[data-money-clear-selection]")?.addEventListener("click", () => { clearSelection(); render(); });
    root.querySelector("[data-money-collect-all]")?.addEventListener("click", () => { collectAll(true); render(); });
    root.querySelector("[data-money-clear-field]")?.addEventListener("click", clearBoard);
    root.querySelectorAll("[data-money-unlock]").forEach(btn => btn.addEventListener("click", () => unlockBoard(Number(btn.dataset.moneyUnlock))));
    root.querySelectorAll("[data-money-open-jkcoin-store]").forEach(btn => btn.addEventListener("click", () => window.JKCoinApp?.openForGame?.("money")));
    root.querySelector("[data-money-refresh-leader]")?.addEventListener("click", () => loadLeaderboard(true));
  }
  function requestExit() {
    if (!UI.overlay || UI.overlay.querySelector(".money-kl-modal")) return;
    const modal = document.createElement("div");
    modal.className = "money-kl-modal";
    modal.innerHTML = `<div class="money-kl-modal-card"><small>MONEY.KL</small><h2>Spiel wirklich verlassen?</h2><p>Dein Imperium produziert offline bis zu acht Stunden weiter.</p><div class="money-kl-actions"><button class="money-kl-button primary" data-money-stay>Weiterspielen</button><button class="money-kl-button danger" data-money-confirm-exit>Spiel beenden</button></div></div>`;
    UI.overlay.append(modal);
    modal.querySelector("[data-money-stay]").onclick = () => modal.remove();
    modal.querySelector("[data-money-confirm-exit]").onclick = () => close(true);
  }
  function onKey(event) { if (event.key === "Escape") { event.preventDefault(); requestExit(); } }
  function toast(text) {
    let el = document.querySelector(".money-kl-toast");
    if (!el) { el = document.createElement("div"); el.className = "money-kl-toast"; document.body.append(el); }
    el.textContent = text;
    clearTimeout(UI.toastTimer); requestAnimationFrame(() => el.classList.add("show"));
    UI.toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }
  async function runtime() {
    const core = window.LifeBuilderFirebaseCore;
    if (!core?.load) throw new Error("Online-Dienst ist nicht geladen.");
    return core.load();
  }
  async function publishLeaderboard() {
    const data = ensureState();
    if (!data) return;
    try {
      const fb = await runtime();
      const user = await window.LifeBuilderFirebaseCore.waitForAuth?.(6000) || fb.auth.currentUser;
      if (!user) throw new Error("Bitte zuerst anmelden.");
      const displayName = `${appState()?.firstName || "Spieler"} ${appState()?.lastName || ""}`.trim();
      const payload = { uid:user.uid, displayName, moneyKlNetWorth:netWorth(data), moneyKlPerSecond:totalPerSecond(data), moneyKlLifetimeEarned:Math.floor(data.lifetimeEarned), moneyKlBoardSize:data.boardSize, moneyKlPlaced:Object.keys(data.cells).length, moneyKlUpdatedAtMs:Date.now() };
      await fb.setDoc(fb.doc(fb.db, LEADERBOARD_COLLECTION, user.uid), payload, { merge:true });
      data.leaderboardUpdatedAt = Date.now(); persist();
    } catch (error) { UI.onlineStatus = `Topliste nicht verfügbar: ${String(error?.message || error).replace(/^FirebaseError:\s*/i,"")}`; }
  }
  async function loadLeaderboard(force=false) {
    if (!force && UI.leaderboard.length) return;
    UI.onlineStatus = "Topliste wird geladen …"; render();
    try {
      await publishLeaderboard();
      const fb = await runtime();
      const collectionRef = fb.collection(fb.db, LEADERBOARD_COLLECTION);
      const topQuery = fb.query(collectionRef, fb.orderBy("moneyKlNetWorth","desc"), fb.limit(50));
      const recentQuery = fb.query(collectionRef, fb.orderBy("moneyKlUpdatedAtMs","desc"), fb.limit(50));
      const [topSnap, recentSnap] = await Promise.all([fb.getDocs(topQuery), fb.getDocs(recentQuery)]);
      const merged = new Map();
      [...topSnap.docs, ...recentSnap.docs].forEach(d => merged.set(d.id, { id:d.id, ...d.data() }));
      UI.leaderboard = [...merged.values()].map(row => ({
        ...row,
        uid:String(row.uid || row.id || ""),
        netWorth:Number(row.moneyKlNetWorth || 0),
        perSecond:Number(row.moneyKlPerSecond || 0),
        lifetimeEarned:Number(row.moneyKlLifetimeEarned || 0),
        boardSize:Number(row.moneyKlBoardSize || 2),
        placed:Number(row.moneyKlPlaced || 0),
        updatedAtMs:Number(row.moneyKlUpdatedAtMs || 0)
      })).filter(row => row.uid).sort((a,b) => (b.netWorth - a.netWorth) || (b.lifetimeEarned - a.lifetimeEarned) || String(a.displayName || "").localeCompare(String(b.displayName || ""), "de"));
      UI.onlineStatus = UI.leaderboard.length ? "" : "Noch keine Einträge.";
    } catch (error) { UI.onlineStatus = `Topliste konnte nicht geladen werden: ${String(error?.message || error).replace(/^FirebaseError:\s*/i,"")}`; }
    if (UI.overlay) render();
  }
  function open(sourceDevice="") {
    if (UI.overlay) return;
    UI.sourceDevice = sourceDevice || "";
    ensureState();
    const el = document.createElement("div"); el.className = "money-kl-overlay"; document.body.append(el); UI.overlay = el;
    document.body.classList.add("money-kl-open"); document.addEventListener("keydown", onKey);
    render(); loadLeaderboard(false);
    UI.tick = window.setInterval(() => { const data=ensureState(); if (UI.overlay) refreshDynamicValues(data); if (Date.now()-Number(data.leaderboardUpdatedAt||0)>15000) publishLeaderboard(); }, 1000);
  }
  function close(returnPhone=false) {
    const data = ensureState(); updateAccrual(data); collectAll(false,data); publishLeaderboard(); persist();
    clearInterval(UI.tick); UI.tick=0; document.removeEventListener("keydown",onKey); UI.overlay?.remove(); UI.overlay=null; document.body.classList.remove("money-kl-open");
    if (returnPhone) window.setTimeout(() => window.JKGamesOpenTopGames?.(UI.sourceDevice),80);
  }

  window.MoneyKL = Object.freeze({ version:VERSION, open, close, definitions:MAKERS, jkDefinitions:JK_MAKERS, getState:ensureState, leaderboard:loadLeaderboard, grantJkCoinPurchase });
})();
