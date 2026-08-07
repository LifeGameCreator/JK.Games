(() => {
  "use strict";

  const VERSION = "2026-08-07-money-kl-v219-online-toplist";
  const LEADERBOARD_COLLECTION = "playerProfiles";
  const MAX_OFFLINE_MS = 8 * 60 * 60 * 1000;
  const LEADERBOARD_ACTIVE_MS = 45 * 1000;
  const BOARD_TIERS = Object.freeze([
    { size: 2, price: 0, label: "Mini-Startfeld", description: "4 Bauplätze · sofort verfügbar" },
    { size: 4, price: 1_000_000, label: "Kleines Viertel", description: "16 Bauplätze · ab $1 Million" },
    { size: 8, price: 500_000_000, label: "Stadtfläche", description: "64 Bauplätze · ab $500 Millionen" },
    { size: 16, price: 1_000_000_000, label: "Großstadtfläche", description: "256 Bauplätze · ab $1 Milliarde" },
    { size: 32, price: 1_000_000_000_000, label: "Imperiumsfläche", description: "1.024 Bauplätze · ab $1 Billion" }
  ]);
  const MAKER_NAMES = [
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
  const ICONS = ["N","€","$","M","I","B","◆","◉","∞","★"];
  const COLORS = ["#63ffc1","#7fd3ff","#c894ff","#ffd766","#ff8da1","#6ef1ee","#a7ff7d","#ff9e5f","#d8e2ff","#f3a8ff"];
  const AVATARS = ["🧒","🧺","🛒","🎭","📦","💻","📈","🏢","💎","👑","🚀","🌌"] ;

  const UI = { overlay: null, leftOpen: false, rightOpen: false, view: "board", selectedMaker: 0, selectedCell: "", tick: 0, leaderboard: [], onlineStatus: "", sourceDevice: "", toastTimer: 0 };
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
  function makerBase(index) {
    if (index === 0) return 1;
    return Math.max(2, Math.round(Math.pow(10, index * 0.122)));
  }
  function makerLevelIncome(index, level = 1) {
    const multipliers = [1, 3, 8, 25, 100];
    return Math.round(makerBase(index) * multipliers[clamp(level, 1, 5) - 1]);
  }
  function makerCost(index) {
    if (index === 0) return 0;
    const base = makerBase(index);
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
    cost: makerCost(index)
  }));

  function defaultState() {
    const starterCell = "0:0";
    return {
      version: VERSION,
      dollars: 0,
      lifetimeEarned: 0,
      boardSize: 2,
      unlocked4: false,
      unlocked8: false,
      unlocked16: false,
      unlocked32: false,
      cells: { [starterCell]: { makerId: "maker-1", level: 1, stored: 0, placedAt: Date.now() } },
      selectedMakerId: "maker-1",
      lastTickAt: Date.now(),
      boosts: { doubleUntil: 0, autoCollectUntil: 0 },
      stats: { collected: 0, upgrades: 0, placements: 1, clicks: 0 },
      leaderboardUpdatedAt: 0,
      tutorialSeen: false
    };
  }
  function ensureState() {
    const root = appState();
    if (!root) return null;
    const base = defaultState();
    root.moneyKl ||= base;
    const data = root.moneyKl;
    const previousVersion = String(data.version || "");
    const previousBoardSize = Number(data.boardSize || 0);
    data.cells = data.cells && typeof data.cells === "object" ? data.cells : base.cells;
    let largestCoordinate = 0;
    Object.keys(data.cells).forEach(key => {
      const [x, y] = String(key).split(":").map(Number);
      if (Number.isFinite(x)) largestCoordinate = Math.max(largestCoordinate, x);
      if (Number.isFinite(y)) largestCoordinate = Math.max(largestCoordinate, y);
    });
    const isLegacySave = previousVersion && previousVersion !== VERSION;
    // Alte Money.KL-Spielstände behalten jede bereits erreichte Fläche.
    data.unlocked32 = data.unlocked32 === true || previousBoardSize >= 32 || largestCoordinate >= 16;
    data.unlocked16 = data.unlocked16 === true || data.unlocked32 || previousBoardSize >= 16 || largestCoordinate >= 8;
    data.unlocked8 = data.unlocked8 === true || data.unlocked16 || previousBoardSize >= 8 || largestCoordinate >= 4;
    data.unlocked4 = data.unlocked4 === true || data.unlocked8 || previousBoardSize >= 4 || largestCoordinate >= 2;
    const validSizes = BOARD_TIERS.map(tier => tier.size);
    const requestedSize = validSizes.includes(previousBoardSize) ? previousBoardSize : 0;
    const highestUnlocked = data.unlocked32 ? 32 : data.unlocked16 ? 16 : data.unlocked8 ? 8 : data.unlocked4 ? 4 : 2;
    const requestedUnlocked = requestedSize === 2
      || (requestedSize === 4 && data.unlocked4)
      || (requestedSize === 8 && data.unlocked8)
      || (requestedSize === 16 && data.unlocked16)
      || (requestedSize === 32 && data.unlocked32);
    data.boardSize = requestedUnlocked ? requestedSize : highestUnlocked;
    data.version = VERSION;
    data.dollars = Math.max(0, Number(data.dollars || 0));
    data.lifetimeEarned = Math.max(0, Number(data.lifetimeEarned || 0));
    data.boosts = { ...base.boosts, ...(data.boosts || {}) };
    data.stats = { ...base.stats, ...(data.stats || {}) };
    data.lastTickAt = Number(data.lastTickAt || Date.now());
    data.selectedMakerId = MAKERS.some(m => m.id === data.selectedMakerId) ? data.selectedMakerId : "maker-1";
    updateAccrual(data);
    return data;
  }
  function cellIncome(cell) {
    const maker = MAKERS.find(m => m.id === cell?.makerId);
    if (!maker) return 0;
    return makerLevelIncome(maker.index, cell.level || 1);
  }
  function productionMultiplier(data) { return Number(data.boosts.doubleUntil || 0) > Date.now() ? 2 : 1; }
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
      if (show) toast(`+${formatDollar(amount)} eingesammelt`);
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
      const maker = MAKERS.find(m => m.id === cell.makerId);
      if (!maker) return sum;
      let value = maker.cost;
      for (let l = 1; l < Number(cell.level || 1); l += 1) value += makerUpgradeCost(maker.index, l);
      return sum + value + Number(cell.stored || 0);
    }, 0);
    return Math.floor(data.dollars + asset);
  }
  function selectedMaker(data = ensureState()) { return MAKERS.find(m => m.id === data?.selectedMakerId) || MAKERS[0]; }
  function selectedCell(data = ensureState()) { return UI.selectedCell ? data?.cells?.[UI.selectedCell] || null : null; }

  function payMainEuros(amount, label) {
    const root = appState();
    const price = Math.max(0, Math.round(Number(amount) || 0));
    if (!root || !price) return false;
    try {
      if (typeof pay === "function") {
        if (!pay(price, false, { target: "treasury", taxRate: .19, awardXp: false })) return false;
      } else {
        let remaining = price;
        const bank = Math.min(remaining, Math.max(0, Number(root.bank || 0)));
        root.bank -= bank; remaining -= bank;
        const cash = Math.min(remaining, Math.max(0, Number(root.cash || 0)));
        root.cash -= cash; remaining -= cash;
        if (remaining > 0) return false;
      }
      feed(`Money.KL: ${label} für ${price.toLocaleString("de-DE")} € gekauft.`);
      persist();
      return true;
    } catch { return false; }
  }

  function placeOrCollect(key) {
    const data = ensureState();
    if (!data) return;
    updateAccrual(data);
    const existing = data.cells[key];
    if (existing) {
      UI.selectedCell = key;
      if (Number(existing.stored || 0) >= .01) {
        const amount = Math.floor(Number(existing.stored || 0) * 100) / 100;
        existing.stored = 0;
        data.dollars += amount;
        data.lifetimeEarned += amount;
        data.stats.collected += amount;
        data.stats.clicks += 1;
        toast(`+${formatDollar(amount)} von ${MAKERS.find(m => m.id === existing.makerId)?.name || "Maker"}`);
        persist();
      }
      render();
      return;
    }
    const maker = selectedMaker(data);
    if (data.dollars < maker.cost) return toast(`Dir fehlen ${formatDollar(maker.cost - data.dollars)} für ${maker.name}.`);
    data.dollars -= maker.cost;
    data.cells[key] = { makerId: maker.id, level: 1, stored: 0, placedAt: Date.now() };
    data.stats.placements += 1;
    UI.selectedCell = key;
    persist();
    toast(`${maker.name} platziert · +${formatDollar(makerLevelIncome(maker.index, 1))}/s`);
    render();
  }
  function upgradeSelected() {
    const data = ensureState();
    const cell = selectedCell(data);
    if (!cell) return toast("Wähle zuerst einen platzierten Maker aus.");
    const maker = MAKERS.find(m => m.id === cell.makerId);
    const level = clamp(cell.level, 1, 5);
    if (level >= 5) return toast("Dieser Maker ist bereits Level 5.");
    const cost = makerUpgradeCost(maker.index, level);
    if (data.dollars < cost) return toast(`Dir fehlen ${formatDollar(cost - data.dollars)} für das Upgrade.`);
    data.dollars -= cost;
    cell.level = level + 1;
    data.stats.upgrades += 1;
    persist();
    toast(`${maker.name} ist jetzt Level ${cell.level} · ${formatDollar(cellIncome(cell))}/s`);
    render();
  }
  function removeSelected() {
    const data = ensureState();
    const cell = selectedCell(data);
    if (!cell) return;
    const maker = MAKERS.find(m => m.id === cell.makerId);
    let paid = maker?.cost || 0;
    for (let l = 1; l < Number(cell.level || 1); l += 1) paid += makerUpgradeCost(maker.index, l);
    data.dollars += Math.floor(paid * .35);
    delete data.cells[UI.selectedCell];
    UI.selectedCell = "";
    persist();
    toast(`${maker?.name || "Maker"} zurückgegeben · ${formatDollar(Math.floor(paid * .35))} erhalten`);
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
    UI.selectedCell = "";
    persist();
    toast(`${tier.size}×${tier.size}-Feld freigeschaltet!`);
    render();
  }
  function buyPowerUp(type) {
    const data = ensureState();
    const now = Date.now();
    if (type === "double") {
      if (!payMainEuros(25000, "2× Produktion für 15 Minuten")) return toast("Nicht genug Euro auf Konto oder bar.");
      data.boosts.doubleUntil = Math.max(now, Number(data.boosts.doubleUntil || 0)) + 15 * 60 * 1000;
    } else if (type === "auto") {
      if (!payMainEuros(10000, "Auto-Collector für 30 Minuten")) return toast("Nicht genug Euro auf Konto oder bar.");
      data.boosts.autoCollectUntil = Math.max(now, Number(data.boosts.autoCollectUntil || 0)) + 30 * 60 * 1000;
    } else if (type === "instant") {
      if (!payMainEuros(50000, "10 Minuten Sofortproduktion")) return toast("Nicht genug Euro auf Konto oder bar.");
      const amount = totalPerSecond(data) * 600;
      data.dollars += amount; data.lifetimeEarned += amount;
    }
    persist(); render(); toast("Power-Up aktiviert.");
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
    let html = "";
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const key = `${x}:${y}`;
        const cell = data.cells[key];
        const district = (Math.floor(x / 4) + Math.floor(y / 4)) % 2 ? "district-b" : "district-a";
        if (!cell) {
          html += `<button class="money-kl-cell empty ${district}" data-money-cell="${key}" title="${esc(selectedMaker(data).name)} hier platzieren"><span class="money-kl-plot"><span class="plot-ground"></span><span class="plot-lines"></span><span class="plot-add">＋</span></span></button>`;
        } else {
          const maker = MAKERS.find(m => m.id === cell.makerId) || MAKERS[0];
          html += `<button class="money-kl-cell occupied ${district} ${Number(cell.stored || 0) >= .01 ? "has-money" : ""}" style="--maker-color:${maker.color}" data-money-cell="${key}" title="${esc(maker.name)} · Level ${cell.level} · ${formatDollar(cellIncome(cell))}/s"><span class="money-kl-plot"><span class="plot-ground"></span><span class="plot-lines"></span>${makerModelHtml(maker, cell.level)}</span><em>L${cell.level}</em><b>${Number(cell.stored || 0) >= 1 ? formatShortNumber(cell.stored) : ""}</b><span class="money-kl-cell-name">${esc(maker.name)}</span></button>`;
        }
      }
    }
    return html;
  }
  function makersHtml(data) {
    return MAKERS.map(maker => {
      const locked = maker.index > 0 && data.lifetimeEarned < maker.cost * .15;
      return `<button class="money-kl-maker ${data.selectedMakerId === maker.id ? "active" : ""} ${locked ? "locked" : ""}" data-money-maker="${maker.id}" ${locked ? "disabled" : ""}><span class="money-kl-maker-preview">${makerModelHtml(maker, 1, true)}</span><span><b>${esc(maker.name)}</b><small>Level 1: ${formatDollar(makerLevelIncome(maker.index,1))}/s · Level 5: ${formatDollar(makerLevelIncome(maker.index,5))}/s</small></span><em>${maker.cost ? formatDollar(maker.cost) : "START"}</em></button>`;
    }).join("");
  }
  function detailHtml(data) {
    const cell = selectedCell(data);
    if (!cell) {
      const maker = selectedMaker(data);
      return `<div class="money-kl-detail"><div class="money-kl-detail-icon">${makerModelHtml(maker, cell ? cell.level : 1, true)}</div><h3>${esc(maker.name)}</h3><p>Wähle ein freies Feld. Der Maker startet auf Level 1 und kann bis Level 5 verbessert werden.</p><div class="money-kl-stats"><div class="money-kl-stat"><small>LEVEL 1</small><b>${formatDollar(makerLevelIncome(maker.index,1))}/s</b></div><div class="money-kl-stat"><small>LEVEL 5</small><b>${formatDollar(makerLevelIncome(maker.index,5))}/s</b></div></div></div>`;
    }
    const maker = MAKERS.find(m => m.id === cell.makerId) || MAKERS[0];
    const level = clamp(cell.level,1,5);
    const cost = level < 5 ? makerUpgradeCost(maker.index, level) : 0;
    return `<div class="money-kl-detail"><div class="money-kl-detail-icon">${makerModelHtml(maker, cell ? cell.level : 1, true)}</div><h3>${esc(maker.name)}</h3><p>Position ${esc(UI.selectedCell)} · Level ${level}/5</p><div class="money-kl-stats"><div class="money-kl-stat"><small>PRO SEKUNDE</small><b data-money-live-selected-pps>${formatDollar(cellIncome(cell))}</b></div><div class="money-kl-stat"><small>GESPEICHERT</small><b data-money-live-selected-stored>${formatDollar(cell.stored || 0)}</b></div></div><div class="money-kl-actions">${level < 5 ? `<button class="money-kl-button primary" data-money-upgrade>Auf Level ${level + 1} · ${formatDollar(cost)}</button>` : `<button class="money-kl-button" disabled>Maximallevel erreicht</button>`}<button class="money-kl-button danger" data-money-remove>Rückgabe · 35 %</button></div></div>`;
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
    return `<aside class="money-kl-panel left ${UI.leftOpen ? "open" : ""}">${activeCharacterHtml()}<small>MONEY.KL</small><h2>Steuerung</h2><div class="money-kl-menu"><button class="${UI.view === "board" ? "active" : ""}" data-money-view="board">Spielfeld <span>${data.boardSize}×${data.boardSize}</span></button><button class="${UI.view === "makers" ? "active" : ""}" data-money-view="makers">100 Maker <span>Shop</span></button><button class="${UI.view === "boosts" ? "active" : ""}" data-money-view="boosts">Power-Ups <span>€</span></button><button class="${UI.view === "leader" ? "active" : ""}" data-money-view="leader">Topliste</button></div>${UI.view === "makers" ? `<div class="money-kl-shop">${makersHtml(data)}</div>` : UI.view === "boosts" ? `<div class="money-kl-actions"><button class="money-kl-button primary" data-money-power="auto">Auto-Collector 30 Min. · 10.000 €</button><button class="money-kl-button primary" data-money-power="double">2× Produktion 15 Min. · 25.000 €</button><button class="money-kl-button gold" data-money-power="instant">10 Min. Sofortertrag · 50.000 €</button></div>` : UI.view === "leader" ? `<button class="money-kl-button" data-money-refresh-leader>Topliste aktualisieren</button>${leaderboardHtml()}` : `<p class="money-kl-help">Wähle einen Maker und tippe auf ein freies Grundstück. Belegte Grundstücke sammeln Dollar und lassen sich bis Level 5 ausbauen.</p><button class="money-kl-button primary" data-money-collect-all>Alles einsammeln</button><h3 class="money-kl-field-title">Feld-Ausbau</h3>${fieldProgressHtml(data)}${nextUnlock ? `<p class="money-kl-next-goal">Nächstes Ziel: ${nextUnlock}×${nextUnlock} für ${formatDollar(BOARD_TIERS.find(t => t.size === nextUnlock).price)}</p>` : `<p class="money-kl-next-goal complete">Maximale Fläche erreicht</p>`}`}</aside>`;
  }
  function rightPanelHtml(data) {
    return `<aside class="money-kl-panel right ${UI.rightOpen ? "open" : ""}"><small>DEIN IMPERIUM</small><h2>Statistik</h2><div class="money-kl-stats"><div class="money-kl-stat"><small>PLATZIERT</small><b data-money-live-placed>${Object.keys(data.cells).length}/${data.boardSize*data.boardSize}</b></div><div class="money-kl-stat"><small>PRO SEKUNDE</small><b data-money-live-pps>${formatDollar(totalPerSecond(data))}</b></div><div class="money-kl-stat"><small>NETTOWERT</small><b data-money-live-networth>${formatDollar(netWorth(data))}</b></div><div class="money-kl-stat"><small>GESAMT VERDIENT</small><b data-money-live-lifetime>${formatDollar(data.lifetimeEarned)}</b></div></div>${detailHtml(data)}<div class="money-kl-detail"><small>AKTIVE BOOSTS</small><p data-money-live-boosts>2× Produktion: ${data.boosts.doubleUntil > Date.now() ? `${Math.ceil((data.boosts.doubleUntil-Date.now())/60000)} Min.` : "Aus"}<br>Auto-Collector: ${data.boosts.autoCollectUntil > Date.now() ? `${Math.ceil((data.boosts.autoCollectUntil-Date.now())/60000)} Min.` : "Aus"}</p></div></aside>`;
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
  function refreshDynamicValues() {
    const data = ensureState();
    if (!data || !UI.overlay) return;
    const setText = (selector, value) => {
      const node = UI.overlay.querySelector(selector);
      if (node && node.textContent !== String(value)) node.textContent = String(value);
    };
    setText("[data-money-live-balance]", formatDollar(data.dollars));
    setText("[data-money-live-toolbar-pps]", `${formatDollar(totalPerSecond(data))}/s`);
    setText("[data-money-live-placed]", `${Object.keys(data.cells).length}/${data.boardSize * data.boardSize}`);
    setText("[data-money-live-pps]", formatDollar(totalPerSecond(data)));
    setText("[data-money-live-networth]", formatDollar(netWorth(data)));
    setText("[data-money-live-lifetime]", formatDollar(data.lifetimeEarned));
    const selected = selectedCell(data);
    if (selected) {
      setText("[data-money-live-selected-pps]", formatDollar(cellIncome(selected)));
      setText("[data-money-live-selected-stored]", formatDollar(selected.stored || 0));
    }
    const boosts = UI.overlay.querySelector("[data-money-live-boosts]");
    if (boosts) boosts.innerHTML = `2× Produktion: ${data.boosts.doubleUntil > Date.now() ? `${Math.ceil((data.boosts.doubleUntil-Date.now())/60000)} Min.` : "Aus"}<br>Auto-Collector: ${data.boosts.autoCollectUntil > Date.now() ? `${Math.ceil((data.boosts.autoCollectUntil-Date.now())/60000)} Min.` : "Aus"}`;
    UI.overlay.querySelectorAll("[data-money-cell]").forEach(button => {
      const cell = data.cells[button.dataset.moneyCell];
      if (!cell) return;
      const stored = Math.max(0, Number(cell.stored || 0));
      button.classList.toggle("has-money", stored >= .01);
      const badge = button.querySelector("b");
      if (badge) badge.textContent = stored >= 1 ? formatShortNumber(stored) : "";
    });
  }

  function render() {
    const data = ensureState();
    if (!data || !UI.overlay) return;
    updateAccrual(data);
    const savedScroll = captureScrollState();
    UI.overlay.innerHTML = `<div class="money-kl-shell"><header class="money-kl-top"><div class="money-kl-brand"><small>JK.GAMES · IDLE EMPIRE</small><h1>Money.KL</h1></div><div class="money-kl-balance"><small>DEINE SPIEL-DOLLAR</small><b data-money-live-balance>${formatDollar(data.dollars)}</b></div><div class="money-kl-top-actions"><button class="jkc-game-inline-button" data-money-jkcoin title="JK/Coin öffnen">JK</button><button data-money-toggle-left>☰ <span>Menü</span></button><button data-money-toggle-right>▤ <span>Stats</span></button><button data-money-exit>×</button></div></header><main class="money-kl-layout">${leftPanelHtml(data)}<section class="money-kl-center"><div class="money-kl-board-toolbar"><div><span class="money-kl-chip field">${data.boardSize}×${data.boardSize} · ${BOARD_TIERS.find(t => t.size === data.boardSize)?.label || "Feld"}</span><span class="money-kl-chip">${Object.keys(data.cells).length} Maker</span><span class="money-kl-chip" data-money-live-toolbar-pps>${formatDollar(totalPerSecond(data))}/s</span><span class="money-kl-chip maker">Maker: ${esc(selectedMaker(data).name)}</span></div>${activeCharacterHtml()}</div><div class="money-kl-board-scroll"><div class="money-kl-world size-${data.boardSize}"><div class="money-kl-skyline" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div><div class="money-kl-board size-${data.boardSize}" style="--size:${data.boardSize}">${boardHtml(data)}</div></div></div></section>${rightPanelHtml(data)}</main></div>`;
    bind();
    restoreScrollState(savedScroll);
  }
  function bind() {
    const root = UI.overlay;
    root.querySelector("[data-money-jkcoin]")?.addEventListener("click", () => window.JKCoinApp?.openForGame?.("money"));
    root.querySelector("[data-money-toggle-left]")?.addEventListener("click", () => { UI.leftOpen = !UI.leftOpen; render(); });
    root.querySelector("[data-money-toggle-right]")?.addEventListener("click", () => { UI.rightOpen = !UI.rightOpen; render(); });
    root.querySelector("[data-money-exit]")?.addEventListener("click", requestExit);
    root.querySelectorAll("[data-money-view]").forEach(btn => btn.addEventListener("click", () => { UI.view = btn.dataset.moneyView; UI.leftOpen = true; if (UI.view === "leader") loadLeaderboard(true); render(); }));
    root.querySelectorAll("[data-money-maker]").forEach(btn => btn.addEventListener("click", () => { const data=ensureState(); data.selectedMakerId=btn.dataset.moneyMaker; persist(); UI.view="board"; if (matchMedia("(max-width:900px)").matches) UI.leftOpen=false; render(); }));
    root.querySelectorAll("[data-money-cell]").forEach(btn => btn.addEventListener("click", () => placeOrCollect(btn.dataset.moneyCell)));
    root.querySelector("[data-money-upgrade]")?.addEventListener("click", upgradeSelected);
    root.querySelector("[data-money-remove]")?.addEventListener("click", removeSelected);
    root.querySelector("[data-money-collect-all]")?.addEventListener("click", () => { collectAll(true); render(); });
    root.querySelectorAll("[data-money-unlock]").forEach(btn => btn.addEventListener("click", () => unlockBoard(Number(btn.dataset.moneyUnlock))));
    root.querySelectorAll("[data-money-power]").forEach(btn => btn.addEventListener("click", () => buyPowerUp(btn.dataset.moneyPower)));
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
    if (!core?.load) throw new Error("Firebase ist nicht geladen.");
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
    } catch (error) { UI.onlineStatus = `Online-Topliste nicht verfügbar: ${String(error?.message || error).replace(/^FirebaseError:\s*/i,"")}`; }
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
    } catch (error) { UI.onlineStatus = `Online-Topliste konnte nicht geladen werden: ${String(error?.message || error).replace(/^FirebaseError:\s*/i,"")}`; }
    if (UI.overlay) render();
  }
  function open(sourceDevice="") {
    if (UI.overlay) return;
    UI.sourceDevice = sourceDevice || "";
    ensureState();
    const el = document.createElement("div"); el.className = "money-kl-overlay"; document.body.append(el); UI.overlay = el;
    document.body.classList.add("money-kl-open"); document.addEventListener("keydown", onKey);
    render(); loadLeaderboard(false);
    UI.tick = window.setInterval(() => { const data=ensureState(); updateAccrual(data); if (UI.overlay) refreshDynamicValues(); if (Date.now()-Number(data.leaderboardUpdatedAt||0)>15000) publishLeaderboard(); }, 1000);
  }
  function close(returnPhone=false) {
    const data = ensureState(); updateAccrual(data); collectAll(false,data); publishLeaderboard(); persist();
    clearInterval(UI.tick); UI.tick=0; document.removeEventListener("keydown",onKey); UI.overlay?.remove(); UI.overlay=null; document.body.classList.remove("money-kl-open");
    if (returnPhone) window.setTimeout(() => window.JKGamesOpenTopGames?.(UI.sourceDevice),80);
  }

  window.MoneyKL = Object.freeze({ version:VERSION, open, close, definitions:MAKERS, getState:ensureState, leaderboard:loadLeaderboard });
})();
