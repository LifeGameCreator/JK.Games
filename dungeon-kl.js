(() => {
  "use strict";

  const VERSION = "20260802-dungeon-kl-v157-catacomb-collision-connectors-fix";
  const MAX_LEVEL = 100;
  const MAX_INVENTORY = 900;
  const CANVAS_W = 1280;
  const CANVAS_H = 720;
  const WORLD_W = 1500;
  const WORLD_H = 900;
  const PARTY_COLLECTION = "dungeonKlParties";
  const AUCTION_COLLECTION = "dungeonKlAuctions";
  const NUMBER = new Intl.NumberFormat("de-DE");
  const GOLD = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
  const SKILL_BASE_COOLDOWNS = [7, 11, 13, 16, 28];

  const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary", "special", "mythic", "exotic", "universe"];
  const RARITIES = {
    common: { name: "Gewöhnlich", color: "#aab3bc", mult: 1, minLevel: 1, drop: 49 },
    uncommon: { name: "Ungewöhnlich", color: "#58e681", mult: 1.22, minLevel: 3, drop: 25 },
    rare: { name: "Selten", color: "#56aaff", mult: 1.52, minLevel: 8, drop: 13 },
    epic: { name: "Episch", color: "#ba73ff", mult: 1.9, minLevel: 15, drop: 6.5 },
    legendary: { name: "Legendär", color: "#ffc04d", mult: 2.34, minLevel: 25, drop: 3 },
    special: { name: "Special", color: "#ff5f86", mult: 2.82, minLevel: 32, drop: 1.5 },
    mythic: { name: "Mystisch", color: "#ff6edc", mult: 3.34, minLevel: 40, drop: .65 },
    exotic: { name: "Exotisch", color: "#50ecff", mult: 3.92, minLevel: 46, drop: .24 },
    universe: { name: "Universe", color: "#ffffff", mult: 4.6, minLevel: 50, drop: .07 }
  };

  const ROLES = {
    tank: { name: "Tank", icon: "🛡", color: "#63d9ff", hp: 1.65, damage: .72, armor: .28, heal: 0, aggro: 4.5, description: "Frontkämpfer mit Schwert und Schild. Zieht Gegner zuerst auf sich und hält besonders viel aus." },
    dps: { name: "DD", icon: "⚔", color: "#ff6c83", hp: .94, damage: 1.3, armor: .08, heal: 0, aggro: 1, description: "Schadensklasse für Nahkampf, Fernkampf oder Magie. Weniger Leben, dafür hoher Schaden." },
    healer: { name: "Heiler", icon: "✚", color: "#66f3a5", hp: .96, damage: .7, armor: .09, heal: 1, aggro: .7, description: "Heilt Gruppe und sich selbst. Verursacht weniger Schaden, ist aber für lange Dungeons entscheidend." }
  };

  const CLASSES = {
    guardian: { role: "tank", name: "Schildwächter", icon: "🛡", weaponType: "sword", offhand: "shield", range: 90, attackRate: .72, projectile: false, color: "#5fc8ff", skills: [
      ["Schildstoß", "Betäubt das Ziel und erzeugt viel Bedrohung."], ["Festungsruf", "Reduziert eingehenden Schaden für kurze Zeit."], ["Klingenbogen", "Trifft Gegner vor dir."], ["Schutzwall", "Gibt der Gruppe einen Schild."], ["Titanenstand", "Maximale Verteidigung und Flächenschaden."]
    ]},
    berserker: { role: "dps", name: "Klingenbrecher", icon: "🗡", weaponType: "blade", offhand: "focus", range: 105, attackRate: 1.35, projectile: false, color: "#ff6c72", skills: [
      ["Wirbelklinge", "Mehrfachtreffer im Kreis."], ["Bluttempo", "Erhöht Angriffstempo."], ["Sprungschlag", "Springt zum Ziel."], ["Rissklinge", "Gerader Durchbruchangriff."], ["Hinrichtung", "Extremer Schaden gegen geschwächte Ziele."]
    ]},
    ranger: { role: "dps", name: "Runenbogner", icon: "🏹", weaponType: "bow", offhand: "quiver", range: 520, attackRate: 1.1, projectile: true, color: "#9be866", skills: [
      ["Dreifachpfeil", "Schießt drei Pfeile."], ["Frostfalle", "Verlangsamt Gegner im Bereich."], ["Durchbohrer", "Pfeil durchschlägt mehrere Ziele."], ["Adlerauge", "Erhöht kritische Treffer."], ["Pfeilsturm", "Großer Pfeilregen im Zielgebiet."]
    ]},
    arcanist: { role: "dps", name: "Arkanmagier", icon: "🔮", weaponType: "staff", offhand: "orb", range: 480, attackRate: .9, projectile: true, color: "#ac78ff", skills: [
      ["Arkanblitz", "Kettenblitz auf mehrere Ziele."], ["Zeitfeld", "Verlangsamt Gegner."], ["Manaschild", "Absorbiert Schaden."], ["Dimensionsriss", "Explodierendes Portal."], ["Sternenfall", "Große magische Flächenattacke."]
    ]},
    warlock: { role: "dps", name: "Leerenrufer", icon: "☄", weaponType: "tome", offhand: "relic", range: 450, attackRate: .82, projectile: true, color: "#e258ff", skills: [
      ["Leerenbrand", "Schaden über Zeit."], ["Schattenkette", "Bindet mehrere Gegner."], ["Seelenraub", "Heilt einen Teil des Schadens."], ["Dämonenriss", "Beschwört eine kurze Angriffseinheit."], ["Untergang", "Starke verzögerte Explosion."]
    ]},
    cleric: { role: "healer", name: "Lichtpriester", icon: "✨", weaponType: "mace", offhand: "relic", range: 360, attackRate: .75, projectile: true, color: "#ffe47a", skills: [
      ["Lichtwelle", "Heilt das Gruppenmitglied mit wenigstem Leben."], ["Reinigung", "Entfernt negative Effekte und heilt."], ["Segen", "Erhöht Gruppenrüstung."], ["Heilkreis", "Heilt alle im Bereich."], ["Wiedergeburt", "Rettet einmal ein gefallenes Gruppenmitglied."]
    ]},
    druid: { role: "healer", name: "Wilddruide", icon: "🌿", weaponType: "staff", offhand: "totem", range: 390, attackRate: .85, projectile: true, color: "#64e39c", skills: [
      ["Lebenssamen", "Starke Heilung über Zeit."], ["Dornenring", "Schaden und Verlangsamung."], ["Naturhaut", "Reduziert Gruppenschaden."], ["Wurzelgriff", "Hält Gegner fest."], ["Uralter Hain", "Große dauerhafte Gruppenheilung."]
    ]}
  };

  const DUNGEONS = [
    { id: "crypt", name: "Krypta der Asche", level: 1, rooms: 10, theme: "ember", layout: "catacomb", color: "#ff8056", creatures: ["Aschekriecher", "Knochensoldat", "Glutkultist"], bosses: ["Torwächter Morak", "Aschenbestie", "König der leeren Gruft"] },
    { id: "grove", name: "Verdorbener Hain", level: 8, rooms: 11, theme: "forest", layout: "grove", color: "#76dc78", creatures: ["Dornenwolf", "Pilzwächter", "Verwachsener Jäger"], bosses: ["Wurzelmutter", "Der faule Hirsch", "Herz des Hains"] },
    { id: "frost", name: "Frostzitadelle", level: 16, rooms: 12, theme: "ice", layout: "citadel", color: "#6edcff", creatures: ["Eissplitter", "Frostlegionär", "Schneeschamane"], bosses: ["Wächter Khar", "Weiße Hydra", "Königin Iskara"] },
    { id: "prison", name: "Versunkenes Gefängnis", level: 22, rooms: 12, theme: "water", layout: "flooded", color: "#48cfff", creatures: ["Kettengeist", "Sumpfwächter", "Ertrunkener Schütze"], bosses: ["Kerkermeister Voss", "Flutkoloss", "König der Ertrunkenen"] },
    { id: "storm", name: "Sturmobservatorium", level: 25, rooms: 12, theme: "storm", layout: "tower", color: "#8798ff", creatures: ["Sturmdrohne", "Blitzjäger", "Himmelswächter"], bosses: ["Leiter VII", "Donnerkoloss", "Astrax der Sturmseher"] },
    { id: "forge", name: "Obsidian-Schmiede", level: 30, rooms: 13, theme: "forge", layout: "forge", color: "#ff784f", creatures: ["Schlackengolem", "Schmiededämon", "Glutarmbrustschütze"], bosses: ["Meister Krov", "Obsidianriese", "Die lebende Esse"] },
    { id: "abyss", name: "Abgrund von Veyra", level: 35, rooms: 13, theme: "void", layout: "abyss", color: "#c76cff", creatures: ["Leerenmade", "Rissschütze", "Schattenritter"], bosses: ["Risshüter", "Namenloser Schlund", "Veyra die Unendliche"] },
    { id: "citadel", name: "Goldene Zitadelle", level: 45, rooms: 14, theme: "gold", layout: "palace", color: "#ffd15b", creatures: ["Palastgolem", "Runenritter", "Sonnenmagus"], bosses: ["Der vergoldete General", "Sonnenlöwe", "Kaiser Aureon"] },
    { id: "moon", name: "Mondgruft von Selene", level: 52, rooms: 14, theme: "moon", layout: "catacomb", color: "#b6c7ff", creatures: ["Mondwächter", "Silbergeist", "Sternengruftmagier"], bosses: ["Silberne Witwe", "Mondbestie", "Selene die Schlaflose"] },
    { id: "chaos", name: "Chaoskathedrale", level: 58, rooms: 15, theme: "chaos", layout: "cathedral", color: "#ff5fc9", creatures: ["Chaosbrut", "Flüsterhexe", "Spiegelkrieger"], bosses: ["Dreigesicht", "Kathedralenwyrm", "Chaos-Orakel"] },
    { id: "bones", name: "Thron der Knochen", level: 66, rooms: 15, theme: "bone", layout: "throne", color: "#e6dbc4", creatures: ["Knochenritter", "Grabpirscher", "Totenbeschwörer"], bosses: ["Der Gebeinkanzler", "Schädelhydra", "König Ossuar"] },
    { id: "universe", name: "Universe-Nexus", level: 75, rooms: 16, theme: "universe", layout: "nexus", color: "#f3fbff", creatures: ["Sternenwächter", "Kosmosjäger", "Nexusarchitekt"], bosses: ["Planetenschmied", "Galaxienfresser", "Nexus-Primus"] }
  ];

  const SLOT_DEFS = {
    weapon: { name: "Waffe", icon: "⚔" }, offhand: { name: "Nebenhand", icon: "🛡" }, helmet: { name: "Kopf", icon: "🪖" }, chest: { name: "Rüstung", icon: "🥋" },
    gloves: { name: "Handschuhe", icon: "🧤" }, boots: { name: "Schuhe", icon: "🥾" }, ring: { name: "Ring", icon: "💍" }, amulet: { name: "Amulett", icon: "📿" }, relic: { name: "Relikt", icon: "🔷" }
  };
  const SLOT_KEYS = Object.keys(SLOT_DEFS);
  const PREFIXES = ["Verwittert", "Runen", "Blut", "Sturm", "Schatten", "Sonnen", "Frost", "Dornen", "Arkan", "Leeren", "Titanen", "Prisma", "Chaos", "Sternen", "Nexus"];
  const WEAPON_NAMES = {
    sword: ["Kurzschwert", "Bollwerksklinge", "Wächterschwert", "Festungsschneide"], blade: ["Doppelklinge", "Kriegssäbel", "Hinrichter", "Klingenfächer"], bow: ["Langbogen", "Runenbogen", "Scharfschützenbogen", "Himmelssehne"],
    staff: ["Zauberstab", "Arkanstab", "Sternenstab", "Weltenzepter"], tome: ["Fluchbuch", "Leerenkodex", "Seelenband", "Untergangsfoliant"], mace: ["Lichtkolben", "Heilzepter", "Morgenstern", "Sanktionshammer"]
  };
  const SLOT_NAMES = {
    offhand: ["Schild", "Fokus", "Köcher", "Orb", "Totem", "Relikthand"], helmet: ["Helm", "Krone", "Kapuze", "Visier"], chest: ["Kettenpanzer", "Robe", "Brustplatte", "Kampfmantel"],
    gloves: ["Handschützer", "Runenhandschuhe", "Griffpanzer"], boots: ["Stiefel", "Pfadschuhe", "Kampftreter"], ring: ["Siegelring", "Runenring", "Band"], amulet: ["Amulett", "Talisman", "Halsreif"], relic: ["Relikt", "Seelenstein", "Kristall", "Rune"]
  };

  const UI = {
    overlay: null, main: null, head: null, toastTimer: 0, phoneItem: "", view: "home", selectedDungeon: "crypt", selectedPartySize: 1,
    inventoryRarity: "all", inventorySlot: "all", inventorySearch: "", shopRole: "all", auctionLoading: false, auctionItems: [], party: null,
    session: null, raf: 0, last: 0, keys: Object.create(null), pointer: { x: 0, y: 0, down: false }, audio: null, onlineUnsubs: [], timers: []
  };

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  const esc = value => String(value ?? "").replace(/[&<>'"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[ch]));
  const distance = (a, b) => Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0));
  const rarityIndex = rarity => Math.max(0, RARITY_ORDER.indexOf(rarity));
  const formatPower = value => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(1)}K` : String(Math.round(value));
  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

  // Firestore akzeptiert weder undefined noch NaN/Infinity. Netzwerk-Snapshots werden
  // deshalb rekursiv bereinigt, bevor sie geschrieben werden. Arrays behalten nur
  // tatsächlich vorhandene Werte; undefinierte Objektfelder werden ausgelassen.
  function firestoreSafe(value) {
    if (value === undefined || typeof value === "function" || typeof value === "symbol") return undefined;
    if (value === null || typeof value === "string" || typeof value === "boolean") return value;
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    if (Array.isArray(value)) return value.map(firestoreSafe).filter(entry => entry !== undefined);
    if (value instanceof Date) return value;
    if (typeof value === "object") {
      const out = {};
      for (const [key, entry] of Object.entries(value)) {
        const cleaned = firestoreSafe(entry);
        if (cleaned !== undefined) out[key] = cleaned;
      }
      return out;
    }
    return String(value);
  }

  let lastNetworkWarningAt = 0;
  function reportNetworkWriteError(label, error) {
    const now = Date.now();
    if (now - lastNetworkWarningAt < 4000) return;
    lastNetworkWarningAt = now;
    console.warn(`Dungeon.KL ${label}`, error);
  }
  function safeSetDoc(fb, ref, data, options, label = "Netzwerk-Schreibfehler") {
    const payload = firestoreSafe(data);
    try {
      const write = fb.setDoc(ref, payload, options);
      if (write && typeof write.catch === "function") write.catch(error => reportNetworkWriteError(label, error));
      return write;
    } catch (error) {
      reportNetworkWriteError(label, error);
      return null;
    }
  }

  function getAppState() { try { return typeof state !== "undefined" && state ? state : null; } catch { return null; } }
  function safeSave() { try { if (typeof save === "function") save(); } catch (error) { console.warn("Dungeon.KL speichern", error); } }
  function playerName() { const s = getAppState(); return String(s?.firstName || s?.name || "Spieler").slice(0, 24); }
  function activeSlotIndex() { try { return clamp(Math.floor(Number(localStorage.getItem("lifebuilder-active-slot")) || 0), 0, 3); } catch { return 0; } }
  function backupKey() { return `jk-games-dungeon-kl-v152:${activeSlotIndex()}`; }
  function storeBackup(data) { try { localStorage.setItem(backupKey(), JSON.stringify({ savedAtMs: Date.now(), data })); } catch {} }

  function levelNeed(level) { return Math.round(500 + Math.pow(level, 1.72) * 190); }
  function rarityForLevel(level, bonus = 0) {
    const weights = RARITY_ORDER.map(key => {
      const r = RARITIES[key];
      if (level < r.minLevel) return 0;
      const levelBoost = Math.max(0, level - r.minLevel) * (rarityIndex(key) * .007 + .002);
      return r.drop * (1 + bonus * .02 + levelBoost);
    });
    let roll = Math.random() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < weights.length; i++) { roll -= weights[i]; if (roll <= 0) return RARITY_ORDER[i]; }
    return "common";
  }
  function itemLevelRequirement(level, rarity) {
    const min = RARITIES[rarity]?.minLevel || 1;
    return clamp(Math.max(min, Math.round(level + rand(-3, 4))), 1, MAX_LEVEL);
  }
  function classCompatibleSlot(classId, slot) {
    const c = CLASSES[classId] || CLASSES.guardian;
    if (slot === "weapon") return c.weaponType;
    if (slot === "offhand") return c.offhand;
    return slot;
  }
  function generatedName(slot, classId, rarity, seed = 0) {
    const idx = (seed + rarityIndex(rarity) * 3) % PREFIXES.length;
    const prefix = PREFIXES[idx];
    if (slot === "weapon") return `${prefix}-${pick(WEAPON_NAMES[CLASSES[classId]?.weaponType] || WEAPON_NAMES.sword)}`;
    const names = SLOT_NAMES[slot] || [SLOT_DEFS[slot]?.name || "Ausrüstung"];
    return `${prefix}-${pick(names)}`;
  }
  function createItem(level = 1, rarity = "common", slot = null, classId = null) {
    if (!classId) classId = ensureState()?.classId || "guardian";
    slot ||= pick(SLOT_KEYS);
    if (!RARITIES[rarity]) rarity = "common";
    const req = itemLevelRequirement(level, rarity);
    const rm = RARITIES[rarity].mult;
    const base = Math.pow(req + 5, 1.22) * rm;
    const item = {
      uid: uid(), slot, classId, rarity, level: req, name: generatedName(slot, classId, rarity, req + Date.now() % 17), acquiredAt: Date.now(), locked: false,
      damage: 0, health: 0, armor: 0, healing: 0, crit: 0, haste: 0, value: Math.round(base * 7.5)
    };
    if (slot === "weapon") { item.damage = Math.round(base * (CLASSES[classId]?.role === "healer" ? .8 : CLASSES[classId]?.role === "tank" ? .86 : 1.18)); item.crit = Math.round(rm * 1.3); }
    else if (slot === "offhand") { item.armor = Math.round(base * (CLASSES[classId]?.role === "tank" ? .78 : .28)); item.damage = Math.round(base * .16); item.healing = CLASSES[classId]?.role === "healer" ? Math.round(base * .34) : 0; }
    else if (["helmet", "chest", "gloves", "boots"].includes(slot)) { item.health = Math.round(base * (slot === "chest" ? 2.1 : 1.05)); item.armor = Math.round(base * (slot === "chest" ? .48 : .22)); item.haste = slot === "gloves" || slot === "boots" ? Math.round(rm * 1.2) : 0; }
    else { item.damage = Math.round(base * .22); item.health = Math.round(base * .48); item.healing = CLASSES[classId]?.role === "healer" ? Math.round(base * .3) : Math.round(base * .05); item.crit = Math.round(rm * 1.4); }
    item.power = Math.round(item.damage * 4 + item.health * 1.1 + item.armor * 5 + item.healing * 3 + item.crit * 18 + item.haste * 14);
    return item;
  }
  function starterInventory(classId) {
    return SLOT_KEYS.map(slot => createItem(1, "common", slot, classId));
  }
  function ensureState() {
    const app = getAppState();
    if (!app) return null;
    app.dungeonKl ||= {};
    const data = app.dungeonKl;
    data.version = VERSION;
    data.level = clamp(Math.floor(Number(data.level) || 1), 1, MAX_LEVEL);
    data.xp = Math.max(0, Math.floor(Number(data.xp) || 0));
    data.totalXp = Math.max(data.xp, Math.floor(Number(data.totalXp) || data.xp));
    data.gold = Math.max(0, Math.floor(Number(data.gold) || 1500));
    data.role = ROLES[data.role] ? data.role : "tank";
    data.classId = CLASSES[data.classId]?.role === data.role ? data.classId : Object.keys(CLASSES).find(id => CLASSES[id].role === data.role) || "guardian";
    data.inventory = Array.isArray(data.inventory) ? data.inventory.slice(0, MAX_INVENTORY) : starterInventory(data.classId);
    data.equipped ||= {};
    SLOT_KEYS.forEach(slot => {
      const found = data.inventory.find(item => item.uid === data.equipped[slot] && item.slot === slot);
      if (!found) data.equipped[slot] = data.inventory.find(item => item.slot === slot && item.classId === data.classId)?.uid || "";
    });
    data.bestDungeon ||= {};
    data.completed ||= {};
    data.stats ||= { kills: 0, bosses: 0, chests: 0, runs: 0, deaths: 0 };
    data.shop ||= { generatedAt: 0, stock: [] };
    data.settings ||= { sound: true, particles: "high", damageNumbers: true };
    data.tutorialDone = !!data.tutorialDone;
    data.lastClassChange ||= 0;
    storeBackup(data);
    return data;
  }
  function equippedItem(slot) { const d = ensureState(); return d.inventory.find(item => item.uid === d.equipped[slot]) || null; }
  function playerStats() {
    const d = ensureState(); const role = ROLES[d.role]; const items = SLOT_KEYS.map(equippedItem).filter(Boolean);
    const sum = key => items.reduce((t, item) => t + Number(item[key] || 0), 0);
    const levelScale = 80 + d.level * 26 + Math.pow(d.level, 1.35) * 7;
    const health = Math.round(levelScale * role.hp + sum("health"));
    const damage = Math.round((18 + d.level * 5.1 + sum("damage")) * role.damage);
    const healing = Math.round((8 + d.level * 3.2 + sum("healing")) * (role.heal || .18));
    const armor = clamp(role.armor + sum("armor") / Math.max(1200, levelScale * 8), 0, .68);
    const crit = clamp(.05 + sum("crit") / 100, .05, .48);
    const haste = clamp(sum("haste") / 100, 0, .55);
    const power = Math.round(d.level * 80 + items.reduce((t, item) => t + item.power, 0));
    return { health, damage, healing, armor, crit, haste, power };
  }
  function addXp(amount) {
    const d = ensureState(); d.xp += Math.max(0, Math.round(amount)); d.totalXp += Math.max(0, Math.round(amount));
    while (d.level < MAX_LEVEL && d.xp >= levelNeed(d.level)) { d.xp -= levelNeed(d.level); d.level++; toast("Levelaufstieg", `Dungeon-Level ${d.level} erreicht.`); }
    safeSave(); updateHead();
  }
  function addItem(item, message = true) {
    const d = ensureState(); if (d.inventory.length >= MAX_INVENTORY) { d.gold += Math.round(item.value * .25); if (message) toast("Inventar voll", `${item.name} automatisch verkauft.`); return false; }
    d.inventory.unshift(item); if (message) toast("Beute gefunden", `${item.name} · ${RARITIES[item.rarity].name} · Level ${item.level}`); safeSave(); return true;
  }

  function open(phoneItem = "") {
    close(false);
    try { if (typeof prepareGameOverlay === "function") prepareGameOverlay(); } catch {}
    UI.phoneItem = phoneItem || window.JKGamesOwnedPhoneItem?.() || "";
    if (!ensureState()) return;
    UI.overlay = document.createElement("div");
    UI.overlay.className = "dkl-modal";
    UI.overlay.innerHTML = `<section class="dkl-shell"><header class="dkl-head"><div class="dkl-brand"><span>◈</span><div><small>PARTY DUNGEON RPG</small><h2>DUNGEON<span>.KL</span></h2></div></div><div class="dkl-head-stats" data-dkl-head></div><div class="dkl-head-actions"><button data-dkl-home title="Hauptlobby">⌂</button><button data-dkl-close title="Zurück">×</button></div></header><main class="dkl-main" data-dkl-main></main><div class="dkl-toast" data-dkl-toast></div></section>`;
    document.body.appendChild(UI.overlay); document.body.classList.add("dungeon-kl-open");
    UI.main = UI.overlay.querySelector("[data-dkl-main]"); UI.head = UI.overlay.querySelector("[data-dkl-head]");
    UI.overlay.querySelector("[data-dkl-home]").addEventListener("click", () => UI.session ? showExitDialog() : renderHome());
    UI.overlay.querySelector("[data-dkl-close]").addEventListener("click", () => UI.session ? showExitDialog() : returnToTopGames());
    window.addEventListener("keydown", onKeyDown); window.addEventListener("keyup", onKeyUp);
    updateHead(); renderHome();
    const d = ensureState(); if (!d.tutorialDone) setTimeout(showTutorial, 250);
  }
  function close(returnPhone = false) {
    stopSession(false); leaveParty(false); UI.onlineUnsubs.splice(0).forEach(fn => { try { fn(); } catch {} }); UI.timers.splice(0).forEach(clearInterval);
    window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); UI.overlay?.remove(); UI.overlay = null; UI.main = null; UI.head = null; document.body.classList.remove("dungeon-kl-open");
    if (returnPhone) returnToTopGames();
  }
  function returnToTopGames() { const phone = UI.phoneItem; close(false); setTimeout(() => window.JKGamesOpenTopGames?.(phone), 80); }
  function updateHead() {
    if (!UI.head) return; const d = ensureState(), s = playerStats();
    UI.head.innerHTML = `<div><small>LEVEL</small><b>${d.level}/${MAX_LEVEL}</b></div><div><small>POWER</small><b>${NUMBER.format(s.power)}</b></div><div><small>KLASSE</small><b>${esc(CLASSES[d.classId].name)}</b></div><div><small>DUNGEON-GOLD</small><b>${GOLD.format(d.gold)}</b></div><div><small>XP</small><b>${NUMBER.format(d.xp)}/${NUMBER.format(levelNeed(d.level))}</b></div>`;
  }
  function toast(title, text = "") { const n = UI.overlay?.querySelector("[data-dkl-toast]"); if (!n) return; n.innerHTML = `<b>${esc(title)}</b>${text ? `<small>${esc(text)}</small>` : ""}`; n.classList.add("show"); clearTimeout(UI.toastTimer); UI.toastTimer = setTimeout(() => n.classList.remove("show"), 3200); }

  function roleClassCards() {
    const d = ensureState();
    return Object.entries(ROLES).map(([roleId, role]) => `<article class="dkl-role ${d.role === roleId ? "active" : ""}" data-dkl-role="${roleId}"><span>${role.icon}</span><div><b>${role.name}</b><small>${role.description}</small></div></article>`).join("") +
      `<div class="dkl-class-row">${Object.entries(CLASSES).filter(([, c]) => c.role === d.role).map(([id, c]) => `<button class="dkl-class ${d.classId === id ? "active" : ""}" data-dkl-class="${id}"><span>${c.icon}</span><b>${c.name}</b><small>${c.role === "tank" ? "Schwert & Schild" : c.role === "healer" ? "Heilung & Unterstützung" : c.weaponType === "bow" ? "Fernkampf" : c.weaponType === "staff" || c.weaponType === "tome" ? "Magie" : "Nahkampf"}</small></button>`).join("")}</div>`;
  }
  function dungeonCards() {
    const d = ensureState();
    return DUNGEONS.map(x => `<button class="dkl-dungeon ${UI.selectedDungeon === x.id ? "active" : ""} ${d.level < x.level ? "locked" : ""}" data-dkl-dungeon="${x.id}" style="--dkl-color:${x.color}"><span class="dkl-dungeon-icon">${x.theme === "ice" ? "❄" : x.theme === "forest" ? "🌿" : x.theme === "void" ? "◉" : x.theme === "universe" ? "✦" : "◆"}</span><div><b>${esc(x.name)}</b><small>Level ${x.level} · ${x.rooms} Räume · 3 Bosse</small><em>${d.level < x.level ? `Gesperrt bis Level ${x.level}` : `Bestzeit: ${d.bestDungeon[x.id]?.time ? formatTime(d.bestDungeon[x.id].time) : "—"}`}</em></div></button>`).join("");
  }
  function renderHome() {
    stopSession(false); UI.view = "home"; const d = ensureState(), stats = playerStats(), dungeon = DUNGEONS.find(x => x.id === UI.selectedDungeon) || DUNGEONS[0];
    UI.main.innerHTML = `<div class="dkl-home"><section class="dkl-hero"><div><small>ORIGINAL JK.GAMES PARTY-RPG</small><h1>Betritt die <span>${esc(dungeon.name)}</span></h1><p>Solo ist möglich, aber Duo, Trio und Vierergruppe erhalten bessere Beute, mehr Kisten und höhere Erfahrung. Tank führt die Gruppe, DD verursacht Schaden und Heiler hält alle am Leben.</p><div class="dkl-hero-actions"><button class="dkl-btn primary" data-dkl-start-solo>Solo betreten</button><button class="dkl-btn gold" data-dkl-party-open>Online-Gruppe erstellen</button><button class="dkl-btn" data-dkl-party-join>Lobby-Code beitreten</button></div></div><div class="dkl-character-card"><div class="dkl-avatar role-${d.role} class-${d.classId}"><i></i><b></b><span>${CLASSES[d.classId].icon}</span></div><h3>${esc(playerName())}</h3><small>${ROLES[d.role].name} · ${CLASSES[d.classId].name}</small><div class="dkl-mini-stats"><span>❤ ${NUMBER.format(stats.health)}</span><span>⚔ ${NUMBER.format(stats.damage)}</span><span>✚ ${NUMBER.format(stats.healing)}</span><span>PWR ${formatPower(stats.power)}</span></div></div></section>
      <section class="dkl-grid"><article class="dkl-panel dkl-build"><header><div><small>ROLLE & KLASSE</small><h3>Dein Kampfstil</h3></div><button class="dkl-link" data-dkl-inventory>Inventar öffnen</button></header>${roleClassCards()}</article><article class="dkl-panel dkl-dungeons"><header><div><small>DUNGEONS</small><h3>Lange Instanzen mit Fallen und Bossen</h3></div><span>${DUNGEONS.length} Gebiete</span></header><div class="dkl-dungeon-list">${dungeonCards()}</div></article></section>
      <section class="dkl-hub-cards"><button data-dkl-inventory><span>🎒</span><b>Inventar & Loadout</b><small>Filtern, vergleichen, ausrüsten und verkaufen.</small></button><button data-dkl-shop><span>🏪</span><b>Händler</b><small>Neue Ausrüstung passend zu deinem Level.</small></button><button data-dkl-auction><span>⚖</span><b>Auktionshaus</b><small>Online-Angebote einstellen und kaufen.</small></button><button data-dkl-party-open><span>👥</span><b>Gruppenhalle</b><small>Solo, Duo, Trio oder Vierergruppe.</small></button></section></div>`;
    bindHome(); updateHead();
  }
  function bindHome() {
    UI.main.querySelectorAll("[data-dkl-role]").forEach(el => el.addEventListener("click", () => changeRole(el.dataset.dklRole)));
    UI.main.querySelectorAll("[data-dkl-class]").forEach(el => el.addEventListener("click", () => changeClass(el.dataset.dklClass)));
    UI.main.querySelectorAll("[data-dkl-dungeon]").forEach(el => el.addEventListener("click", () => { const x = DUNGEONS.find(d => d.id === el.dataset.dklDungeon); if (ensureState().level < x.level) return toast("Dungeon gesperrt", `Level ${x.level} erforderlich.`); UI.selectedDungeon = x.id; renderHome(); }));
    UI.main.querySelector("[data-dkl-start-solo]")?.addEventListener("click", () => startDungeon(UI.selectedDungeon, { partySize: 1 }));
    UI.main.querySelectorAll("[data-dkl-party-open]").forEach(el => el.addEventListener("click", renderPartyHall));
    UI.main.querySelector("[data-dkl-party-join]")?.addEventListener("click", showJoinDialog);
    UI.main.querySelectorAll("[data-dkl-inventory]").forEach(el => el.addEventListener("click", renderInventory));
    UI.main.querySelector("[data-dkl-shop]")?.addEventListener("click", renderShop);
    UI.main.querySelector("[data-dkl-auction]")?.addEventListener("click", renderAuction);
  }
  function changeRole(roleId) { const d = ensureState(); if (!ROLES[roleId]) return; d.role = roleId; d.classId = Object.keys(CLASSES).find(id => CLASSES[id].role === roleId) || "guardian"; d.lastClassChange = Date.now(); safeSave(); toast("Rolle gewählt", ROLES[roleId].name); renderHome(); }
  function changeClass(classId) { const d = ensureState(); if (!CLASSES[classId] || CLASSES[classId].role !== d.role) return; d.classId = classId; d.lastClassChange = Date.now(); safeSave(); toast("Klasse gewählt", CLASSES[classId].name); renderHome(); }

  function renderInventory() {
    UI.view = "inventory"; const d = ensureState(), stats = playerStats();
    const filtered = d.inventory.filter(item => (UI.inventoryRarity === "all" || item.rarity === UI.inventoryRarity) && (UI.inventorySlot === "all" || item.slot === UI.inventorySlot) && (!UI.inventorySearch || item.name.toLowerCase().includes(UI.inventorySearch.toLowerCase()))).sort((a, b) => rarityIndex(b.rarity) - rarityIndex(a.rarity) || b.level - a.level || b.power - a.power);
    UI.main.innerHTML = `<div class="dkl-page"><header class="dkl-page-head"><button class="dkl-btn" data-dkl-back>← Hauptlobby</button><div><small>LOADOUT</small><h2>Inventar & Ausrüstung</h2><p>${d.inventory.length}/${MAX_INVENTORY} Items · Power ${NUMBER.format(stats.power)}</p></div></header><section class="dkl-loadout"><div class="dkl-loadout-slots">${SLOT_KEYS.map(slot => loadoutSlotHtml(slot)).join("")}</div><div class="dkl-loadout-avatar"><div class="dkl-avatar large role-${d.role} class-${d.classId}"><i></i><b></b><span>${CLASSES[d.classId].icon}</span></div><h3>${esc(playerName())}</h3><small>${ROLES[d.role].name} · ${CLASSES[d.classId].name}</small><div class="dkl-mini-stats"><span>❤ ${NUMBER.format(stats.health)}</span><span>⚔ ${NUMBER.format(stats.damage)}</span><span>🛡 ${Math.round(stats.armor * 100)}%</span><span>✚ ${NUMBER.format(stats.healing)}</span></div></div></section><section class="dkl-panel"><div class="dkl-filters"><select data-dkl-inv-rarity><option value="all">Alle Seltenheiten</option>${RARITY_ORDER.map(r => `<option value="${r}" ${UI.inventoryRarity === r ? "selected" : ""}>${RARITIES[r].name}</option>`).join("")}</select><select data-dkl-inv-slot><option value="all">Alle Plätze</option>${SLOT_KEYS.map(s => `<option value="${s}" ${UI.inventorySlot === s ? "selected" : ""}>${SLOT_DEFS[s].name}</option>`).join("")}</select><input data-dkl-inv-search placeholder="Item suchen …" value="${esc(UI.inventorySearch)}"><button class="dkl-btn danger" data-dkl-sell-filtered>Gefilterte verkaufen</button></div><div class="dkl-items">${filtered.length ? filtered.map(itemCardHtml).join("") : `<div class="dkl-empty">Keine passenden Items gefunden.</div>`}</div></section></div>`;
    UI.main.querySelector("[data-dkl-back]").addEventListener("click", renderHome);
    UI.main.querySelector("[data-dkl-inv-rarity]").addEventListener("change", e => { UI.inventoryRarity = e.target.value; renderInventory(); });
    UI.main.querySelector("[data-dkl-inv-slot]").addEventListener("change", e => { UI.inventorySlot = e.target.value; renderInventory(); });
    UI.main.querySelector("[data-dkl-inv-search]").addEventListener("input", e => { UI.inventorySearch = e.target.value; clearTimeout(e.target._t); e.target._t = setTimeout(renderInventory, 180); });
    UI.main.querySelector("[data-dkl-sell-filtered]").addEventListener("click", () => sellFiltered(filtered));
    bindItemButtons(renderInventory);
  }
  function loadoutSlotHtml(slot) { const item = equippedItem(slot); return `<article class="dkl-equip-slot ${item ? `rarity-${item.rarity}` : "empty"}"><span>${SLOT_DEFS[slot].icon}</span><div><small>${SLOT_DEFS[slot].name}</small><b>${item ? esc(item.name) : "Leer"}</b>${item ? `<em>${RARITIES[item.rarity].name} · L${item.level} · PWR ${formatPower(item.power)}</em>` : ""}</div>${item ? `<button data-dkl-unequip="${slot}">×</button>` : ""}</article>`; }
  function itemCardHtml(item) {
    const d = ensureState(), equipped = d.equipped[item.slot] === item.uid, canEquip = d.level >= item.level && item.classId === d.classId;
    return `<article class="dkl-item rarity-${item.rarity}"><div class="dkl-item-icon">${SLOT_DEFS[item.slot].icon}</div><div class="dkl-item-main"><small>${RARITIES[item.rarity].name} · Level ${item.level} · ${SLOT_DEFS[item.slot].name}</small><b>${esc(item.name)}</b><div><span>⚔ ${item.damage}</span><span>❤ ${item.health}</span><span>🛡 ${item.armor}</span><span>✚ ${item.healing}</span><span>PWR ${formatPower(item.power)}</span></div></div><div class="dkl-item-actions">${equipped ? `<strong>Ausgerüstet</strong>` : `<button class="dkl-btn small" data-dkl-equip="${item.uid}" ${canEquip ? "" : "disabled"}>${canEquip ? "Ausrüsten" : item.classId !== d.classId ? "Andere Klasse" : `Level ${item.level}`}</button>`}<button class="dkl-btn small" data-dkl-auction-item="${item.uid}">Auktion</button><button class="dkl-btn small danger" data-dkl-sell="${item.uid}">+${GOLD.format(Math.round(item.value * .3))}</button></div></article>`;
  }
  function bindItemButtons(after) {
    const d = ensureState();
    UI.main.querySelectorAll("[data-dkl-equip]").forEach(btn => btn.addEventListener("click", () => { const item = d.inventory.find(x => x.uid === btn.dataset.dklEquip); if (!item || d.level < item.level || item.classId !== d.classId) return; d.equipped[item.slot] = item.uid; safeSave(); updateHead(); after(); }));
    UI.main.querySelectorAll("[data-dkl-unequip]").forEach(btn => btn.addEventListener("click", () => { d.equipped[btn.dataset.dklUnequip] = ""; safeSave(); after(); }));
    UI.main.querySelectorAll("[data-dkl-sell]").forEach(btn => btn.addEventListener("click", () => sellItem(btn.dataset.dklSell, after)));
    UI.main.querySelectorAll("[data-dkl-auction-item]").forEach(btn => btn.addEventListener("click", () => listAuctionDialog(btn.dataset.dklAuctionItem)));
  }
  function sellItem(id, after = renderInventory) { const d = ensureState(), item = d.inventory.find(x => x.uid === id); if (!item) return; if (Object.values(d.equipped).includes(id)) return toast("Nicht möglich", "Ausgerüstete Items zuerst ablegen."); d.inventory = d.inventory.filter(x => x.uid !== id); const value = Math.round(item.value * .3); d.gold += value; safeSave(); updateHead(); toast("Verkauft", `${item.name} · +${GOLD.format(value)} Gold`); after(); }
  function sellFiltered(items) { const d = ensureState(), equipped = new Set(Object.values(d.equipped)); const sellable = items.filter(x => !equipped.has(x.uid)); if (!sellable.length) return toast("Nichts verkauft", "Ausgerüstete Items bleiben geschützt."); if (!confirm(`${sellable.length} Items für insgesamt ${GOLD.format(sellable.reduce((t, x) => t + Math.round(x.value * .3), 0))} Gold verkaufen?`)) return; const ids = new Set(sellable.map(x => x.uid)); const value = sellable.reduce((t, x) => t + Math.round(x.value * .3), 0); d.inventory = d.inventory.filter(x => !ids.has(x.uid)); d.gold += value; safeSave(); updateHead(); renderInventory(); }

  function refreshShop() {
    const d = ensureState(); const day = Math.floor(Date.now() / 86400000); if (d.shop.generatedAt === day && Array.isArray(d.shop.stock) && d.shop.stock.length) return;
    d.shop.generatedAt = day; d.shop.stock = Array.from({ length: 36 }, (_, i) => createItem(clamp(d.level + Math.floor(rand(-5, 7)), 1, MAX_LEVEL), rarityForLevel(d.level, i % 5), pick(SLOT_KEYS), d.classId)); safeSave();
  }
  function renderShop() {
    UI.view = "shop"; refreshShop(); const d = ensureState();
    const stock = d.shop.stock.filter(x => UI.shopRole === "all" || x.slot === UI.shopRole);
    UI.main.innerHTML = `<div class="dkl-page"><header class="dkl-page-head"><button class="dkl-btn" data-dkl-back>← Hauptlobby</button><div><small>HÄNDLERVIERTEL</small><h2>Ausrüstungshändler</h2><p>Die Angebote passen sich deinem Dungeon-Level und deiner Klasse an. Neue Ware erscheint täglich.</p></div><strong>${GOLD.format(d.gold)} Gold</strong></header><section class="dkl-panel"><div class="dkl-filters"><select data-dkl-shop-slot><option value="all">Alle Kategorien</option>${SLOT_KEYS.map(s => `<option value="${s}" ${UI.shopRole === s ? "selected" : ""}>${SLOT_DEFS[s].name}</option>`).join("")}</select><button class="dkl-btn" data-dkl-shop-reroll>Neu würfeln · ${GOLD.format(250 + d.level * 12)} Gold</button></div><div class="dkl-items">${stock.map(item => shopItemHtml(item)).join("")}</div></section></div>`;
    UI.main.querySelector("[data-dkl-back]").addEventListener("click", renderHome);
    UI.main.querySelector("[data-dkl-shop-slot]").addEventListener("change", e => { UI.shopRole = e.target.value; renderShop(); });
    UI.main.querySelector("[data-dkl-shop-reroll]").addEventListener("click", () => { const cost = 250 + d.level * 12; if (d.gold < cost) return toast("Nicht genug Gold"); d.gold -= cost; d.shop.generatedAt = 0; refreshShop(); renderShop(); });
    UI.main.querySelectorAll("[data-dkl-buy]").forEach(btn => btn.addEventListener("click", () => { const item = d.shop.stock.find(x => x.uid === btn.dataset.dklBuy); if (!item) return; const price = shopPrice(item); if (d.gold < price) return toast("Nicht genug Gold"); if (d.inventory.length >= MAX_INVENTORY) return toast("Inventar voll"); d.gold -= price; d.inventory.unshift({ ...item, uid: uid(), acquiredAt: Date.now() }); safeSave(); updateHead(); toast("Gekauft", item.name); renderShop(); }));
  }
  function shopPrice(item) { return Math.round(item.value * (1.25 + rarityIndex(item.rarity) * .08)); }
  function shopItemHtml(item) { return `<article class="dkl-item rarity-${item.rarity}"><div class="dkl-item-icon">${SLOT_DEFS[item.slot].icon}</div><div class="dkl-item-main"><small>${RARITIES[item.rarity].name} · Level ${item.level}</small><b>${esc(item.name)}</b><div><span>⚔ ${item.damage}</span><span>❤ ${item.health}</span><span>🛡 ${item.armor}</span><span>✚ ${item.healing}</span><span>PWR ${formatPower(item.power)}</span></div></div><div class="dkl-item-actions"><strong>${GOLD.format(shopPrice(item))} Gold</strong><button class="dkl-btn small gold" data-dkl-buy="${item.uid}" ${ensureState().level < item.level ? "disabled" : ""}>${ensureState().level < item.level ? `Level ${item.level}` : "Kaufen"}</button></div></article>`; }

  async function firebase() { const core = window.LifeBuilderFirebaseCore; if (!core?.load) throw new Error("Firebase-Laufzeit fehlt."); const fb = await core.load(); const user = await core.waitForAuth?.(8000) || fb.auth.currentUser; if (!user) throw new Error("Bitte mit JK.Games anmelden."); return { fb, user, core }; }
  async function renderAuction() {
    UI.view = "auction"; UI.main.innerHTML = `<div class="dkl-page"><header class="dkl-page-head"><button class="dkl-btn" data-dkl-back>← Hauptlobby</button><div><small>ONLINE-HANDEL</small><h2>Auktionshaus</h2><p>Items anderer Spieler kaufen oder eigene Ausrüstung anbieten.</p></div></header><section class="dkl-panel"><div class="dkl-online-state">Online-Angebote werden geladen …</div><div class="dkl-items" data-dkl-auctions></div></section></div>`;
    UI.main.querySelector("[data-dkl-back]").addEventListener("click", renderHome); const list = UI.main.querySelector("[data-dkl-auctions]");
    try {
      const { fb, user } = await firebase(); await claimSoldAuctions(fb, user); const q = fb.query(fb.collection(fb.db, AUCTION_COLLECTION), fb.where("status", "==", "active"), fb.limit(80)); const snap = await fb.getDocs(q); UI.auctionItems = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b)=>Number(b.createdAtMs||0)-Number(a.createdAtMs||0)).slice(0,60);
      list.innerHTML = UI.auctionItems.length ? UI.auctionItems.map(a => auctionCardHtml(a, user.uid)).join("") : `<div class="dkl-empty">Noch keine Online-Angebote.</div>`;
      UI.main.querySelector(".dkl-online-state").textContent = `Online · ${UI.auctionItems.length} Angebote`;
      UI.main.querySelectorAll("[data-dkl-auction-buy]").forEach(btn => btn.addEventListener("click", () => buyAuction(btn.dataset.dklAuctionBuy)));
      UI.main.querySelectorAll("[data-dkl-auction-cancel]").forEach(btn => btn.addEventListener("click", () => cancelAuction(btn.dataset.dklAuctionCancel)));
    } catch (error) { UI.main.querySelector(".dkl-online-state").textContent = `Auktionshaus nicht erreichbar: ${error.message || error}`; list.innerHTML = aiAuctionHtml(); }
  }
  function auctionCardHtml(a, uidValue) { const item = a.item || {}; return `<article class="dkl-item rarity-${item.rarity || "common"}"><div class="dkl-item-icon">${SLOT_DEFS[item.slot]?.icon || "◆"}</div><div class="dkl-item-main"><small>${esc(a.sellerName || "Spieler")} · ${RARITIES[item.rarity]?.name || "Item"} · Level ${item.level || 1}</small><b>${esc(item.name || "Ausrüstung")}</b><div><span>PWR ${formatPower(item.power || 0)}</span><span>⚔ ${item.damage || 0}</span><span>❤ ${item.health || 0}</span></div></div><div class="dkl-item-actions"><strong>${GOLD.format(a.price || 0)} Gold</strong>${a.sellerUid === uidValue ? `<button class="dkl-btn small danger" data-dkl-auction-cancel="${a.id}">Zurücknehmen</button>` : `<button class="dkl-btn small gold" data-dkl-auction-buy="${a.id}">Kaufen</button>`}</div></article>`; }
  async function claimSoldAuctions(fb, user) {
    const d = ensureState();
    try {
      const q = fb.query(fb.collection(fb.db, AUCTION_COLLECTION), fb.where("sellerUid", "==", user.uid), fb.limit(80));
      const snap = await fb.getDocs(q); let credit = 0;
      for (const docSnap of snap.docs) {
        const value = docSnap.data();
        if (value.status !== "sold") continue;
        const ref = fb.doc(fb.db, AUCTION_COLLECTION, docSnap.id);
        try {
          await fb.runTransaction(fb.db, async tx => {
            const fresh = await tx.get(ref); if (!fresh.exists() || fresh.data().status !== "sold" || fresh.data().sellerUid !== user.uid) return;
            tx.update(ref, { status: "claimed", claimedAtMs: Date.now() }); credit += Math.max(0, Math.floor(Number(fresh.data().price) || 0));
          });
        } catch {}
      }
      if (credit > 0) { d.gold += credit; safeSave(); updateHead(); toast("Auktion ausgezahlt", `+${GOLD.format(credit)} Dungeon-Gold`); }
    } catch {}
  }
  function aiAuctionHtml() { const d = ensureState(); const items = Array.from({ length: 12 }, () => createItem(clamp(d.level + Math.floor(rand(-4, 5)), 1, MAX_LEVEL), rarityForLevel(d.level), pick(SLOT_KEYS), d.classId)); return `<div class="dkl-empty"><b>Offline-Händler aktiv</b><small>Online-Auktionen benötigen Firebase. Im Händler kannst du trotzdem passende Items kaufen.</small></div>${items.map(shopItemHtml).join("")}`; }
  async function listAuctionDialog(itemId) {
    const d = ensureState(), item = d.inventory.find(x => x.uid === itemId); if (!item) return; if (Object.values(d.equipped).includes(itemId)) return toast("Nicht möglich", "Ausgerüstete Items zuerst ablegen."); const raw = prompt(`Preis für ${item.name} festlegen:`, String(Math.max(100, Math.round(item.value * .7)))); const price = Math.max(1, Math.floor(Number(raw) || 0)); if (!price) return;
    try { const { fb, user } = await firebase(); const ref = fb.doc(fb.collection(fb.db, AUCTION_COLLECTION)); await fb.setDoc(ref, { sellerUid: user.uid, sellerName: playerName(), item: { ...item, uid: "" }, price, status: "active", createdAtMs: Date.now(), version: VERSION }); d.inventory = d.inventory.filter(x => x.uid !== itemId); safeSave(); toast("Auktion erstellt", `${item.name} für ${GOLD.format(price)} Gold`); renderInventory(); } catch (error) { toast("Auktion fehlgeschlagen", error.message || String(error)); }
  }
  async function buyAuction(id) {
    const d = ensureState(), a = UI.auctionItems.find(x => x.id === id); if (!a || d.gold < a.price) return toast("Nicht genug Gold"); if (d.inventory.length >= MAX_INVENTORY) return toast("Inventar voll");
    try { const { fb, user } = await firebase(); await fb.runTransaction(fb.db, async tx => { const ref = fb.doc(fb.db, AUCTION_COLLECTION, id), snap = await tx.get(ref); if (!snap.exists() || snap.data().status !== "active") throw new Error("Angebot ist nicht mehr verfügbar."); tx.update(ref, { status: "sold", buyerUid: user.uid, soldAtMs: Date.now() }); }); d.gold -= a.price; d.inventory.unshift({ ...a.item, uid: uid(), acquiredAt: Date.now() }); safeSave(); updateHead(); toast("Auktion gekauft", a.item.name); renderAuction(); } catch (error) { toast("Kauf fehlgeschlagen", error.message || String(error)); }
  }
  async function cancelAuction(id) { try { const { fb } = await firebase(); const a = UI.auctionItems.find(x => x.id === id); await fb.updateDoc(fb.doc(fb.db, AUCTION_COLLECTION, id), { status: "cancelled", cancelledAtMs: Date.now() }); if (a?.item) addItem({ ...a.item, uid: uid(), acquiredAt: Date.now() }, false); renderAuction(); } catch (error) { toast("Fehler", error.message || String(error)); } }

  function renderPartyHall() {
    UI.view = "party"; const d = ensureState(), dungeon = DUNGEONS.find(x => x.id === UI.selectedDungeon) || DUNGEONS[0];
    UI.main.innerHTML = `<div class="dkl-page"><header class="dkl-page-head"><button class="dkl-btn" data-dkl-back>← Hauptlobby</button><div><small>GRUPPENHALLE</small><h2>Dungeon-Gruppe bilden</h2><p>Mindestens zwei Spieler werden empfohlen. Solo gibt weniger Beute und Erfahrung.</p></div></header><section class="dkl-party-layout"><article class="dkl-panel"><h3>Gruppengröße</h3><div class="dkl-party-size">${[1,2,3,4].map(n => `<button class="${UI.selectedPartySize === n ? "active" : ""}" data-dkl-party-size="${n}"><b>${n}</b><small>${n === 1 ? "Solo" : n === 2 ? "Duo" : n === 3 ? "Trio" : "Vierergruppe"}</small><em>${n === 1 ? "70 % Beute" : `${100 + (n - 2) * 18} % Beute`}</em></button>`).join("")}</div><h3>Ausgewählter Dungeon</h3><div class="dkl-selected-dungeon" style="--dkl-color:${dungeon.color}"><b>${esc(dungeon.name)}</b><small>Level ${dungeon.level} · ${dungeon.rooms} Räume · ${dungeon.bosses.length} Bosse</small></div><div class="dkl-hero-actions"><button class="dkl-btn primary" data-dkl-party-create>${UI.selectedPartySize === 1 ? "Solo starten" : "Private Lobby erstellen"}</button><button class="dkl-btn gold" data-dkl-party-code>Code beitreten</button></div></article><article class="dkl-panel dkl-party-rules"><h3>Gruppenregeln</h3><p>Der Tank wird von Gegnern bevorzugt angegriffen. DDs verursachen hohen Schaden. Heiler halten Spieler am Leben. Beute wird für jeden Spieler einzeln gewürfelt.</p><div class="dkl-role-summary">${Object.entries(ROLES).map(([, r]) => `<div><span>${r.icon}</span><b>${r.name}</b><small>${r.description}</small></div>`).join("")}</div></article></section></div>`;
    UI.main.querySelector("[data-dkl-back]").addEventListener("click", renderHome);
    UI.main.querySelectorAll("[data-dkl-party-size]").forEach(btn => btn.addEventListener("click", () => { UI.selectedPartySize = Number(btn.dataset.dklPartySize); renderPartyHall(); }));
    UI.main.querySelector("[data-dkl-party-create]").addEventListener("click", () => UI.selectedPartySize === 1 ? startDungeon(UI.selectedDungeon, { partySize: 1 }) : createOnlineParty(UI.selectedPartySize, UI.selectedDungeon));
    UI.main.querySelector("[data-dkl-party-code]").addEventListener("click", showJoinDialog);
  }
  function showJoinDialog() { const code = prompt("Sechsstelligen Dungeon.KL-Lobby-Code eingeben:", ""); if (code) joinOnlineParty(code.trim().toUpperCase()); }
  function partyProfile() { const d = ensureState(), s = playerStats(); return { uid: "", name: playerName(), role: d.role, classId: d.classId, level: d.level, power: s.power, maxHp: s.health, damage: s.damage, healing: s.healing, armor: s.armor, updatedAtMs: Date.now() }; }
  function partyCode() { const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join(""); }
  async function createOnlineParty(maxPlayers, dungeonId) {
    try {
      const { fb, user } = await firebase(); const code = partyCode(), profile = { ...partyProfile(), uid: user.uid }; const ref = fb.doc(fb.db, PARTY_COLLECTION, code);
      await fb.setDoc(ref, { code, hostUid: user.uid, maxPlayers, dungeonId, status: "lobby", playerUids: [user.uid], profiles: { [user.uid]: profile }, seed: Math.floor(Math.random() * 99999999), createdAtMs: Date.now(), updatedAtMs: Date.now(), version: VERSION });
      UI.party = { code, ref, fb, user, host: true }; watchParty(); renderPartyLobby();
    } catch (error) { toast("Lobby konnte nicht erstellt werden", error.message || String(error)); }
  }
  async function joinOnlineParty(code) {
    try {
      const { fb, user } = await firebase(); const ref = fb.doc(fb.db, PARTY_COLLECTION, code); let joined;
      await fb.runTransaction(fb.db, async tx => { const snap = await tx.get(ref); if (!snap.exists()) throw new Error("Lobby nicht gefunden."); const data = snap.data(); if (data.status !== "lobby") throw new Error("Lobby läuft bereits."); if ((data.playerUids || []).length >= data.maxPlayers) throw new Error("Lobby ist voll."); if ((data.playerUids || []).includes(user.uid)) { joined = data; return; } const profile = { ...partyProfile(), uid: user.uid }; const playerUids = [...data.playerUids, user.uid], profiles = { ...data.profiles, [user.uid]: profile }; tx.update(ref, { playerUids, profiles, updatedAtMs: Date.now() }); joined = { ...data, playerUids, profiles }; });
      UI.party = { code, ref, fb, user, host: joined?.hostUid === user.uid }; watchParty(); renderPartyLobby();
    } catch (error) { toast("Beitritt fehlgeschlagen", error.message || String(error)); }
  }
  function watchParty() {
    const p = UI.party; if (!p) return; UI.onlineUnsubs.splice(0).forEach(fn => { try { fn(); } catch {} });
    UI.onlineUnsubs.push(p.fb.onSnapshot(p.ref, snap => { if (!snap.exists()) return leaveParty(true); const data = snap.data(); p.data = data; if (data.status === "playing" && !UI.session && UI.view === "partyLobby") startDungeon(data.dungeonId, { partySize: data.playerUids.length, online: p, seed: data.seed, profiles: data.profiles, playerUids: data.playerUids, hostUid: data.hostUid }); else if (data.status === "lobby" && ["partyLobby","result","partyReturn"].includes(UI.view)) renderPartyLobby(); }));
  }
  function renderPartyLobby() {
    const p = UI.party; if (!p) return renderPartyHall(); UI.view = "partyLobby"; const data = p.data || { playerUids: [p.user.uid], profiles: { [p.user.uid]: { ...partyProfile(), uid: p.user.uid } }, maxPlayers: UI.selectedPartySize, dungeonId: UI.selectedDungeon, hostUid: p.user.uid };
    const dungeon = DUNGEONS.find(x => x.id === data.dungeonId) || DUNGEONS[0];
    UI.main.innerHTML = `<div class="dkl-page"><header class="dkl-page-head"><button class="dkl-btn danger" data-dkl-party-leave>Lobby verlassen</button><div><small>PRIVATE DUNGEON PARTY</small><h2>Lobby-Code ${esc(p.code)}</h2><p>${esc(dungeon.name)} · ${data.playerUids.length}/${data.maxPlayers} Spieler</p></div></header><section class="dkl-panel"><div class="dkl-party-members">${Array.from({ length: data.maxPlayers }, (_, i) => { const id = data.playerUids[i], profile = id ? data.profiles[id] : null; return profile ? `<article class="filled role-${profile.role}"><span>${CLASSES[profile.classId]?.icon || "◆"}</span><div><b>${esc(profile.name)}</b><small>${ROLES[profile.role]?.name} · ${CLASSES[profile.classId]?.name} · Level ${profile.level}</small><em>PWR ${formatPower(profile.power)}</em></div>${id === data.hostUid ? `<strong>HOST</strong>` : ""}</article>` : `<article class="empty"><span>＋</span><div><b>Freier Platz</b><small>Code ${esc(p.code)} teilen</small></div></article>`; }).join("")}</div><div class="dkl-hero-actions">${p.host ? `<button class="dkl-btn primary" data-dkl-party-start ${data.playerUids.length < 2 ? "disabled" : ""}>Dungeon starten</button>` : `<div class="dkl-waiting">Der Host startet den Dungeon …</div>`}<button class="dkl-btn" data-dkl-copy-code>Code kopieren</button></div></section></div>`;
    UI.main.querySelector("[data-dkl-party-leave]").addEventListener("click", () => leaveParty(true));
    UI.main.querySelector("[data-dkl-copy-code]").addEventListener("click", () => navigator.clipboard?.writeText(p.code).then(() => toast("Code kopiert", p.code)).catch(() => toast("Lobby-Code", p.code)));
    UI.main.querySelector("[data-dkl-party-start]")?.addEventListener("click", async () => { if (data.playerUids.length < 2) return; try { await p.fb.updateDoc(p.ref, { status: "playing", startedAtMs: Date.now(), updatedAtMs: Date.now() }); } catch (error) { toast("Start fehlgeschlagen", error.message || String(error)); } });
  }
  async function leaveParty(render = true) { const p = UI.party; UI.party = null; UI.onlineUnsubs.splice(0).forEach(fn => { try { fn(); } catch {} }); if (p?.data?.status === "lobby") { try { if (p.host) await p.fb.deleteDoc(p.ref); else { const uids = p.data.playerUids.filter(x => x !== p.user.uid), profiles = { ...p.data.profiles }; delete profiles[p.user.uid]; await p.fb.updateDoc(p.ref, { playerUids: uids, profiles, updatedAtMs: Date.now() }); } } catch {} } if (render && UI.overlay) renderHome(); }

  function startDungeon(dungeonId, options = {}) {
    const dungeon = DUNGEONS.find(x => x.id === dungeonId) || DUNGEONS[0], d = ensureState(); if (d.level < dungeon.level) return toast("Dungeon gesperrt", `Level ${dungeon.level} benötigt.`);
    stopSession(false); unlockAudio(); const stats = playerStats(), partySize = clamp(Number(options.partySize) || 1, 1, 4);
    const player = makePlayer({ uid: options.online?.user?.uid || "local", name: playerName(), role: d.role, classId: d.classId, stats, local: true, x: WORLD_W / 2, y: WORLD_H - 150 });
    const session = UI.session = { dungeon, partySize, online: options.online || null, host: !options.online || options.hostUid === options.online.user.uid, player, players: [player], remotePlayers: new Map(), enemies: [], projectiles: [], effects: [], texts: [], traps: [], chests: [], room: 1, roomState: "combat", roomStartedAt: performance.now(), startedAt: Date.now(), clearAt: 0, exitOpen: false, completed: false, autoAttack: false, noTargetFor: 0, skillCooldowns: [0,0,0,0,0], camera: { x: WORLD_W / 2, y: WORLD_H / 2 }, viewW: CANVAS_W, viewH: CANVAS_H, lastLootSeq: 0, lootSeq: 0, worldSeq: 0, networkLastWrite: 0, networkLastWorld: 0, seed: options.seed || Math.floor(Math.random() * 99999999), profiles: options.profiles || {}, playerUids: options.playerUids || [player.uid], hostUid: options.hostUid || player.uid, boss: null, bossTelegraph: null, message: "", messageUntil: 0, layout: null, roomExitOpen: false, minimap: null, roomTransitionLock: 0, zones: [], selectedTargetUid: player.uid, selectedEnemyId: "", targetPoint: null, cooldownTotals: SKILL_BASE_COOLDOWNS.slice() };
    if (options.online) setupDungeonNetwork(options);
    buildRoom(session, 1); renderDungeonStage(); d.stats.runs++; safeSave(); loop(performance.now());
  }
  function makePlayer({ uid: id, name, role, classId, stats, local, x, y }) { const r = ROLES[role] || ROLES.dps, c = CLASSES[classId] || CLASSES.berserker; return { uid: id, name, role, classId, local, x, y, vx: 0, vy: 0, angle: -Math.PI / 2, radius: 20, maxHp: stats.health, hp: stats.health, damage: stats.damage, healing: stats.healing, armor: stats.armor, crit: stats.crit, haste: stats.haste, power: stats.power, range: c.range, attackRate: c.attackRate, projectile: c.projectile, attackCd: 0, skillSeq: 0, skillRequested: 0, dead: false, downedAt: 0, shield: 0, buffs: {}, color: c.color, moving: false, climbing: false, walkPhase: 0, attackAnim: 0, castAnim: 0, skillAnim: 0, netX: x, netY: y, targetUid: "", targetEnemyId: "", targetX: x, targetY: y }; }
  function setupDungeonNetwork(options) {
    const s = UI.session, p = s.online, fb = p.fb; if (!p) return;
    s.selfRef = fb.doc(fb.db, PARTY_COLLECTION, p.code, "players", p.user.uid); s.worldRef = fb.doc(fb.db, PARTY_COLLECTION, p.code, "world", "current");
    const profileMap = options.profiles || {};
    for (const id of options.playerUids || []) { if (id === p.user.uid) continue; const pr = profileMap[id] || {}; const role = ROLES[pr.role] ? pr.role : "dps", classId = CLASSES[pr.classId] ? pr.classId : "berserker", stats = { health: Number(pr.maxHp || 500), damage: Number(pr.damage || 50), healing: Number(pr.healing || 0), armor: Number(pr.armor || 0), crit: .08, haste: .05, power: Number(pr.power || 0) }; const remote = makePlayer({ uid: id, name: pr.name || "Mitspieler", role, classId, stats, local: false, x: WORLD_W / 2 + rand(-100, 100), y: WORLD_H - 150 + rand(-30, 30) }); s.players.push(remote); s.remotePlayers.set(id, remote); }
    UI.onlineUnsubs.push(fb.onSnapshot(s.worldRef, snap => { if (!snap.exists() || s.host) return; applyWorldSnapshot(snap.data()); }));
    if (s.host) {
      for (const id of s.playerUids) { if (id === p.user.uid) continue; const ref = fb.doc(fb.db, PARTY_COLLECTION, p.code, "players", id); UI.onlineUnsubs.push(fb.onSnapshot(ref, snap => { if (!snap.exists()) return; applyRemoteInput(id, snap.data()); })); }
    }
  }
  function renderDungeonStage() {
    const s = UI.session; UI.view = "dungeon";
    UI.main.innerHTML = `<div class="dkl-stage"><canvas width="${CANVAS_W}" height="${CANVAS_H}" data-dkl-canvas></canvas><canvas class="dkl-mini-map" width="190" height="112" data-dkl-minimap></canvas><div class="dkl-dungeon-top"><div class="dkl-self-hud"><b>${esc(s.player.name)}</b><span>${ROLES[s.player.role].icon} ${esc(CLASSES[s.player.classId].name)}</span><div><i data-dkl-hp></i></div><small data-dkl-hp-text></small></div><div class="dkl-room-title"><small>${esc(s.dungeon.name)}</small><b data-dkl-room>Raum ${s.room}/${s.dungeon.rooms}</b><em data-dkl-objective>Gegner besiegen</em></div><div class="dkl-team-hud" data-dkl-team></div></div><div class="dkl-boss-hud" data-dkl-boss hidden><b></b><div><i></i></div><small></small></div><div class="dkl-target-hud" data-dkl-target-hud><span>◎</span><div><small>ZIEL</small><b>${esc(s.player.name)}</b></div></div><div class="dkl-combat-actions"><button data-dkl-attack class="attack"><i class="dkl-ready-sweep"></i><span>⚔</span><b>ANGRIFF</b><small>Auto-Kampf aus</small></button>${CLASSES[s.player.classId].skills.map((skill, i) => `<button data-dkl-skill="${i}" class="ready"><i class="dkl-ready-sweep" data-dkl-fill="${i}"></i><span>${i + 1}</span><b>${esc(skill[0])}</b><small data-dkl-cd="${i}">Bereit</small></button>`).join("")}</div><div class="dkl-mobile-stick" data-dkl-stick><i></i></div><button class="dkl-exit-button" data-dkl-exit hidden>Dungeon verlassen</button></div>`;
    const canvas = UI.main.querySelector("[data-dkl-canvas]"); s.canvas = canvas; s.ctx = canvas.getContext("2d"); s.minimap = UI.main.querySelector("[data-dkl-minimap]"); resizeCanvas(); window.addEventListener("resize", resizeCanvas, { once: true });
    canvas.addEventListener("pointerdown", pointerDown); canvas.addEventListener("pointermove", pointerMove); canvas.addEventListener("pointerup", pointerUp); canvas.addEventListener("pointercancel", pointerUp);
    UI.main.querySelector("[data-dkl-attack]").addEventListener("click", toggleAutoAttack);
    UI.main.querySelectorAll("[data-dkl-skill]").forEach(btn => btn.addEventListener("click", () => useSkill(Number(btn.dataset.dklSkill))));
    UI.main.querySelector("[data-dkl-team]")?.addEventListener("click", event => { const card = event.target.closest("[data-dkl-target-player]"); if (!card) return; selectPlayerTarget(card.dataset.dklTargetPlayer); });
    UI.main.querySelector("[data-dkl-exit]").addEventListener("click", finishDungeonExit);
    updateDungeonHud();
  }
  function resizeCanvas() { const s = UI.session; if (!s?.canvas) return; const rect = s.canvas.getBoundingClientRect(); s.viewW = rect.width; s.viewH = rect.height; }

  function hashSeed(value) { let h = 2166136261; const text = String(value); for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function seeded(seed) { let a = seed >>> 0; return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function dungeonPalette(theme) {
    return {
      ember:{void:"#090607",floor:"#54484a",floor2:"#68585a",edge:"#282126",wall:"#332a32",wallTop:"#66586d",line:"#847681",accent:"#ff8a54",liquid:"#7c2518"},
      forest:{void:"#06100b",floor:"#3e5444",floor2:"#4d6853",edge:"#17271c",wall:"#24392a",wallTop:"#516a55",line:"#708877",accent:"#70e792",liquid:"#173e2c"},
      ice:{void:"#061018",floor:"#516777",floor2:"#617d91",edge:"#172b38",wall:"#2d4655",wallTop:"#7fa1b5",line:"#9bb7c7",accent:"#70dcff",liquid:"#195c80"},
      water:{void:"#041018",floor:"#526575",floor2:"#657a8d",edge:"#162c3a",wall:"#293f51",wallTop:"#7892a8",line:"#9fb0c0",accent:"#49d6ff",liquid:"#0875a7"},
      storm:{void:"#090a18",floor:"#4d506b",floor2:"#616581",edge:"#202139",wall:"#323650",wallTop:"#747a9f",line:"#969bc0",accent:"#91a4ff",liquid:"#252b73"},
      forge:{void:"#120705",floor:"#514541",floor2:"#66544d",edge:"#2e1711",wall:"#3d2b28",wallTop:"#79584e",line:"#96756c",accent:"#ff754c",liquid:"#c93d16"},
      void:{void:"#090510",floor:"#443953",floor2:"#564568",edge:"#21132e",wall:"#30213e",wallTop:"#6f5685",line:"#8d72a4",accent:"#c879ff",liquid:"#461b70"},
      gold:{void:"#100d05",floor:"#625a42",floor2:"#756c4d",edge:"#302a12",wall:"#443b24",wallTop:"#8f8052",line:"#aa9b6d",accent:"#ffd65d",liquid:"#7a5415"},
      moon:{void:"#080b18",floor:"#505872",floor2:"#626d88",edge:"#1d2339",wall:"#30384f",wallTop:"#7682a4",line:"#9aa6c2",accent:"#c1ccff",liquid:"#28346d"},
      chaos:{void:"#11050f",floor:"#554151",floor2:"#6c5065",edge:"#321126",wall:"#45253e",wallTop:"#8d5b83",line:"#aa7aa1",accent:"#ff60cf",liquid:"#74175f"},
      bone:{void:"#0c0b09",floor:"#625e55",floor2:"#777166",edge:"#2c2923",wall:"#403c34",wallTop:"#8e887b",line:"#aaa396",accent:"#eadfc7",liquid:"#514737"},
      universe:{void:"#030711",floor:"#354965",floor2:"#435b7c",edge:"#111d32",wall:"#1e304b",wallTop:"#607da5",line:"#8ba4c6",accent:"#eaffff",liquid:"#1d2f7d"}
    }[theme] || {void:"#071014",floor:"#46565d",floor2:"#5a6a71",edge:"#1d282d",wall:"#2d3a40",wallTop:"#718188",line:"#91a0a6",accent:"#68e8c4",liquid:"#164a57"};
  }
  function rct(x,y,w,h,kind="floor") { return {x,y,w,h,kind}; }
  function containsRect(rect,x,y,r=0){return x-r>=rect.x&&x+r<=rect.x+rect.w&&y-r>=rect.y&&y+r<=rect.y+rect.h;}
  function intersectsRect(rect,x,y,r=0){return x+r>rect.x&&x-r<rect.x+rect.w&&y+r>rect.y&&y-r<rect.y+rect.h;}
  function createRoomLayout(s, room) {
    const seedValue = hashSeed(`${s.seed}:${s.dungeon.id}:${room}`), rnd = seeded(seedValue), variant = (room + (seedValue % 6)) % 6;
    const baseKind = s.dungeon.layout || "catacomb"; let kind = baseKind;
    if (["catacomb","grove","citadel","flooded","tower","forge","abyss","palace","cathedral","throne","nexus"].includes(baseKind)) kind = baseKind;
    const walkable=[], blocked=[], ladders=[], props=[], raised=[];
    let entry={x:750,y:790}, exit={x:750,y:105}, bossPoint={x:750,y:235}, chestPoint={x:750,y:450};
    const add=(x,y,w,h,k="floor")=>walkable.push(rct(x,y,w,h,k));
    const block=(x,y,w,h,k="pit")=>blocked.push(rct(x,y,w,h,k));
    const ladder=(x,y,w,h,dir="vertical")=>{const v=rct(x,y,w,h,"ladder");walkable.push(v);ladders.push({...v,dir});};
    if (variant===0 || kind==="catacomb") {
      // V157: Die Krypta besitzt bewusst überlappende Übergänge. Dadurch entstehen
      // an den Kanten der Rechtecke keine unsichtbaren Kollisionsnähte mehr.
      add(110,640,1280,170); add(620,90,260,630); add(100,90,530,225); add(870,90,530,225); add(100,340,440,230); add(960,340,440,230);
      ladder(690,545,120,115);
      add(565,150,140,145,"corridor"); add(795,150,140,145,"corridor");
      entry={x:750,y:755}; exit={x:750,y:140}; bossPoint={x:750,y:245}; chestPoint={x:300,y:450};
      block(535,335,130,225,kind==="flooded"?"water":"pit"); block(835,335,130,225,kind==="flooded"?"water":"pit");
      ladder(475,385,235,125,"horizontal"); ladder(790,385,235,125,"horizontal");
    } else if (variant===1 || kind==="flooded") {
      add(80,650,520,170); add(410,470,190,350); add(410,410,650,170); add(870,190,190,390); add(870,100,550,170); add(1110,270,310,250);
      ladder(490,580,90,90); ladder(930,310,90,100); entry={x:180,y:735}; exit={x:1320,y:160}; bossPoint={x:1210,y:390}; chestPoint={x:710,y:490};
      block(80,100,720,270,kind==="flooded"?"water":"pit"); block(610,610,790,210,"pit");
    } else if (variant===2 || kind==="palace" || kind==="cathedral") {
      add(80,620,1340,190); add(80,100,200,710); add(1220,100,200,710); add(80,100,1340,190); add(455,315,590,290,"raised");
      ladder(675,220,150,150); ladder(675,550,150,130); raised.push(rct(455,315,590,290,"raised")); entry={x:750,y:755}; exit={x:750,y:155}; bossPoint={x:750,y:445}; chestPoint={x:750,y:445};
      block(300,300,140,300,"pit"); block(1060,300,140,300,"pit");
    } else if (variant===3 || kind==="tower" || kind==="citadel") {
      add(90,550,560,260); add(90,210,230,410); add(270,210,390,230,"raised"); ladder(530,380,170,230); add(640,270,250,240,"raised"); ladder(780,170,160,170); add(870,100,550,360,"raised"); add(1090,390,330,420);
      raised.push(rct(270,210,390,230,"raised"),rct(640,270,250,240,"raised"),rct(870,100,550,360,"raised")); entry={x:190,y:720}; exit={x:1320,y:180}; bossPoint={x:1160,y:260}; chestPoint={x:760,y:380};
      block(350,460,670,250,"pit");
    } else if (variant===4 || kind==="forge" || kind==="abyss") {
      add(80,580,1340,230); add(130,300,1240,330); add(500,80,500,280); ladder(665,520,170,130); ladder(665,250,170,140); entry={x:750,y:735}; exit={x:750,y:155}; bossPoint={x:750,y:210}; chestPoint={x:750,y:440};
      block(280,370,210,150,kind==="forge"?"lava":"pit"); block(1010,370,210,150,kind==="forge"?"lava":"pit");
    } else {
      add(90,620,1320,190); add(90,100,220,710); add(1190,100,220,710); add(90,100,1320,190); add(410,310,680,300,"raised"); ladder(675,220,150,150); ladder(675,550,150,130);
      raised.push(rct(410,310,680,300,"raised")); entry={x:750,y:750}; exit={x:750,y:155}; bossPoint={x:750,y:445}; chestPoint={x:750,y:445}; block(320,310,90,290,"pit"); block(1090,310,90,290,"pit");
    }
    // Theme-specific structure tweaks.
    if (kind==="grove") { props.push({type:"tree",x:360,y:690},{type:"tree",x:1140,y:690},{type:"roots",x:750,y:430}); }
    if (kind==="throne") { props.push({type:"throne",x:bossPoint.x,y:bossPoint.y-45},{type:"bones",x:340,y:690},{type:"bones",x:1160,y:690}); }
    if (kind==="nexus") { props.push({type:"crystal",x:430,y:690},{type:"crystal",x:1070,y:690},{type:"crystal",x:750,y:430}); }
    const solidCandidates=[
      {type:"column",x:360,y:690,r:24},{type:"column",x:1140,y:690,r:24},{type:"barrel",x:260,y:500,r:22},{type:"crate",x:1240,y:500,r:24},
      {type:"urn",x:560,y:190,r:18},{type:"urn",x:940,y:190,r:18}
    ];
    for (const prop of solidCandidates) if (isPointInWalkableRaw(walkable,blocked,prop.x,prop.y,prop.r+8) && Math.hypot(prop.x-entry.x,prop.y-entry.y)>120 && Math.hypot(prop.x-exit.x,prop.y-exit.y)>100) props.push(prop);
    // Torches, rubble and room dressing are deterministic and non-blocking.
    for(let i=0;i<10;i++){
      const zone=walkable[Math.floor(rnd()*walkable.length)], x=zone.x+50+rnd()*Math.max(20,zone.w-100), y=zone.y+45+rnd()*Math.max(20,zone.h-90);
      if(isPointInWalkableRaw(walkable,blocked,x,y,12)) props.push({type:i%3===0?"torch":i%3===1?"rubble":"bones",x,y,r:0,decor:true});
    }
    const layout={kind,walkable,blocked,ladders,props,raised,entry,exit,bossPoint,chestPoint,palette:dungeonPalette(s.dungeon.theme),tile:48,seed:seedValue};
    buildNavGrid(layout); markReachable(layout, entry);
    layout.enemySpawns = collectSpawnPoints(layout, 30, rnd, entry, exit);
    layout.trapSpawns = collectSpawnPoints(layout, 18, rnd, entry, exit);
    if (!layout.enemySpawns.length) layout.enemySpawns=[{x:bossPoint.x,y:bossPoint.y+100}];
    return layout;
  }
  function pointOnDungeonSurface(walkable,blocked,x,y){
    const onBridge=walkable.some(z=>z.kind==="ladder"&&x>=z.x&&x<=z.x+z.w&&y>=z.y&&y<=z.y+z.h);
    if(onBridge)return true;
    const onFloor=walkable.some(z=>x>=z.x&&x<=z.x+z.w&&y>=z.y&&y<=z.y+z.h);
    if(!onFloor)return false;
    return !blocked.some(z=>x>z.x&&x<z.x+z.w&&y>z.y&&y<z.y+z.h);
  }
  function isPointInWalkableRaw(walkable,blocked,x,y,r=0){
    const radius=Math.max(0,Number(r)||0);
    if(!pointOnDungeonSurface(walkable,blocked,x,y))return false;
    if(radius<=0)return true;
    // Eine Figur darf über die Naht zweier direkt verbundener Bodenrechtecke laufen.
    // Deshalb wird ihre Kreisfläche gegen die Vereinigung aller Bodenflächen geprüft,
    // statt zu verlangen, dass der komplette Kreis in genau einem Rechteck liegt.
    const d=radius*.70710678;
    const samples=[[radius,0],[-radius,0],[0,radius],[0,-radius],[d,d],[-d,d],[d,-d],[-d,-d],[radius*.5,0],[-radius*.5,0],[0,radius*.5],[0,-radius*.5]];
    return samples.every(([dx,dy])=>pointOnDungeonSurface(walkable,blocked,x+dx,y+dy));
  }
  function collectSpawnPoints(layout,count,rnd,entry,exit){const out=[];let guard=0;while(out.length<count&&guard++<900){const z=layout.walkable[Math.floor(rnd()*layout.walkable.length)],x=z.x+45+rnd()*Math.max(20,z.w-90),y=z.y+45+rnd()*Math.max(20,z.h-90);if(!isPointInWalkableRaw(layout.walkable,layout.blocked,x,y,28)||!isReachablePoint(layout,x,y))continue;if(Math.hypot(x-entry.x,y-entry.y)<260||Math.hypot(x-exit.x,y-exit.y)<100)continue;if(layout.props.some(p=>p.r&&Math.hypot(x-p.x,y-p.y)<p.r+40))continue;out.push({x,y});}return out;}
  function markReachable(layout,start){const nav=layout.nav;if(!nav)return;const sx=clamp(Math.floor(start.x/nav.cell),0,nav.cols-1),sy=clamp(Math.floor(start.y/nav.cell),0,nav.rows-1),key=(x,y)=>`${x}:${y}`,q=[[sx,sy]],seen=new Set([key(sx,sy)]),dirs=[[1,0],[-1,0],[0,1],[0,-1]];for(let head=0;head<q.length;head++){const[x,y]=q[head];for(const[dx,dy]of dirs){const nx=x+dx,ny=y+dy,k=key(nx,ny);if(nx<0||ny<0||nx>=nav.cols||ny>=nav.rows||!nav.grid[ny][nx]||seen.has(k))continue;seen.add(k);q.push([nx,ny]);}}layout.reachable=seen;}
  function isReachablePoint(layout,x,y){const nav=layout.nav;if(!nav||!layout.reachable)return true;return layout.reachable.has(`${clamp(Math.floor(x/nav.cell),0,nav.cols-1)}:${clamp(Math.floor(y/nav.cell),0,nav.rows-1)}`);}
  function isOnLadder(layout,x,y){return !!layout?.ladders?.some(l=>x>=l.x&&x<=l.x+l.w&&y>=l.y&&y<=l.y+l.h);}
  function isWalkable(s,x,y,r=0){const l=s?.layout;if(!l)return x-r>=60&&x+r<=WORLD_W-60&&y-r>=60&&y+r<=WORLD_H-60;if(!isPointInWalkableRaw(l.walkable,l.blocked,x,y,r))return false;for(const p of l.props||[]){if(!p.r||p.decor)continue;if(Math.hypot(x-p.x,y-p.y)<r+p.r)return false;}return true;}
  function tryMoveEntity(s,e,dx,dy){let moved=false;if(isWalkable(s,e.x+dx,e.y,e.radius||16)){e.x+=dx;moved=true;}if(isWalkable(s,e.x,e.y+dy,e.radius||16)){e.y+=dy;moved=true;}return moved;}
  function lineWalkable(s,a,b,r=10){const d=Math.hypot(b.x-a.x,b.y-a.y),steps=Math.max(1,Math.ceil(d/24));for(let i=1;i<=steps;i++){const t=i/steps;if(!isWalkable(s,a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,r))return false;}return true;}
  function buildNavGrid(layout){const cell=30,cols=Math.ceil(WORLD_W/cell),rows=Math.ceil(WORLD_H/cell),grid=[];for(let y=0;y<rows;y++){const row=[];for(let x=0;x<cols;x++)row.push(isPointInWalkableRaw(layout.walkable,layout.blocked,x*cell+cell/2,y*cell+cell/2,6));grid.push(row);}layout.nav={cell,cols,rows,grid};}
  function findNavPath(s,from,to){const nav=s.layout?.nav;if(!nav)return[];const key=(x,y)=>y*nav.cols+x, sx0=clamp(Math.floor(from.x/nav.cell),0,nav.cols-1),sy0=clamp(Math.floor(from.y/nav.cell),0,nav.rows-1),tx=clamp(Math.floor(to.x/nav.cell),0,nav.cols-1),ty=clamp(Math.floor(to.y/nav.cell),0,nav.rows-1);const q=[[sx0,sy0]],prev=new Map([[key(sx0,sy0),null]]),dirs=[[1,0],[-1,0],[0,1],[0,-1]];let found=false,head=0;while(head<q.length){const [x,y]=q[head++];if(x===tx&&y===ty){found=true;break;}for(const[dX,dY]of dirs){const nx=x+dX,ny=y+dY,k=key(nx,ny);if(nx<0||ny<0||nx>=nav.cols||ny>=nav.rows||!nav.grid[ny][nx]||prev.has(k))continue;prev.set(k,[x,y]);q.push([nx,ny]);}}if(!found)return[];const path=[];let cur=[tx,ty];while(cur){path.push({x:cur[0]*nav.cell+nav.cell/2,y:cur[1]*nav.cell+nav.cell/2});cur=prev.get(key(cur[0],cur[1]));}return path.reverse().slice(1);}
  function nextEnemyWaypoint(s,e,target,dt){e.pathTimer=(e.pathTimer||0)-dt;if(lineWalkable(s,e,target,e.radius*.55))return target;if(e.pathTimer<=0||!e.path?.length){e.path=findNavPath(s,e,target);e.pathTimer=.55+Math.random()*.3;}while(e.path?.length&&Math.hypot(e.x-e.path[0].x,e.y-e.path[0].y)<35)e.path.shift();return e.path?.[0]||target;}

  function buildRoom(s, room) {
    s.room = room; s.enemies = []; s.projectiles = []; s.effects = []; s.zones = []; s.traps = []; s.chests = []; s.boss = null; s.selectedEnemyId = ""; s.bossTelegraph = null; s.roomState = "combat"; s.clearAt = 0; s.exitOpen = false; s.roomExitOpen = false; s.roomTransitionLock = performance.now() + 1000;
    s.layout = createRoomLayout(s, room);
    s.players.forEach((p,index)=>{p.x=s.layout.entry.x+(index%2?42:-42)*(index?1:0);p.y=s.layout.entry.y+Math.floor(index/2)*38;p.path=[];});
    const bossRoom = room === Math.ceil(s.dungeon.rooms / 3) || room === Math.ceil(s.dungeon.rooms * 2 / 3) || room === s.dungeon.rooms;
    const trapRoom = !bossRoom && room % 4 === 0; const chestRoom = !bossRoom && room % 5 === 0;
    if (trapRoom) { const count=6+Math.floor(room/3); for(let i=0;i<count;i++){const p=s.layout.trapSpawns[i%s.layout.trapSpawns.length]||s.layout.chestPoint;s.traps.push({x:p.x,y:p.y,radius:rand(28,43),armed:true,pulse:rand(0,6)});} }
    if (chestRoom) s.chests.push({ x: s.layout.chestPoint.x, y: s.layout.chestPoint.y, opened: false, radius: 30 });
    if (bossRoom) {
      const bossIndex = room === s.dungeon.rooms ? 2 : room < s.dungeon.rooms / 2 ? 0 : 1; spawnBoss(s, bossIndex, room === s.dungeon.rooms);
      const adds = 4 + Math.floor(room / 3); for (let i = 0; i < adds; i++) spawnEnemy(s, false, i);
    } else {
      const baseCount = 6 + Math.floor(room * 1.6) + (s.partySize - 1) * 4; for (let i = 0; i < baseCount; i++) spawnEnemy(s, Math.random() < .12 + room * .008, i);
    }
    showMessage(bossRoom ? `BOSSRAUM · ${s.boss.name}` : chestRoom ? "SCHATZKAMMER" : trapRoom ? "FALLENKAMMER" : `RAUM ${room}`, 2600); updateDungeonHud();
  }
  function enemyScale(s) { const lvl = Math.max(s.dungeon.level, ensureState().level * .82) + s.room * 1.7; return { level: lvl, hp: 1 + (s.partySize - 1) * .72, damage: 1 + (s.partySize - 1) * .2 }; }
  function spawnEnemy(s, elite = false, spawnIndex = 0) { const scale = enemyScale(s), point=s.layout?.enemySpawns?.[spawnIndex % Math.max(1,s.layout.enemySpawns.length)] || {x:WORLD_W/2+rand(-400,400),y:WORLD_H/2+rand(-250,250)}, x=point.x, y=point.y, ranged = Math.random() < .34; const hp = Math.round((85 + scale.level * 24) * scale.hp * (elite ? 2.4 : 1)); s.enemies.push({ id: uid(), name: pick(s.dungeon.creatures), x, y, radius: elite ? 28 : 20, maxHp: hp, hp, damage: Math.round((8 + scale.level * 2.1) * scale.damage * (elite ? 1.55 : 1)), armor: elite ? .18 : .04, speed: ranged ? 78 : 105, range: ranged ? 350 : 52, ranged, elite, boss: false, attackCd: rand(0, 1), specialCd: rand(1, 4), dead: false, color: elite ? "#ffcf55" : s.dungeon.color, targetUid: "", angle: 0, moving: false, walkPhase: rand(0,6), attackAnim: 0, path: [], pathTimer: 0 }); }
  function spawnBoss(s, index, finalBoss) { const scale = enemyScale(s), name = s.dungeon.bosses[index], hp = Math.round((1700 + scale.level * 330) * scale.hp * (finalBoss ? 1.7 : 1)); const bossPoint=s.layout?.bossPoint||{x:WORLD_W/2,y:230}; const boss = { id: uid(), name, x: bossPoint.x, y: bossPoint.y, radius: finalBoss ? 58 : 48, maxHp: hp, hp, damage: Math.round((25 + scale.level * 4.4) * scale.damage * (finalBoss ? 1.35 : 1)), armor: finalBoss ? .34 : .24, speed: finalBoss ? 66 : 75, range: 75, ranged: false, elite: false, boss: true, finalBoss, attackCd: 1.5, specialCd: 3.2, dead: false, color: s.dungeon.color, targetUid: "", phase: 1, angle: Math.PI/2, moving: false, walkPhase: 0, attackAnim: 0, path: [], pathTimer: 0 }; s.enemies.push(boss); s.boss = boss; }
  function loop(now) { const s = UI.session; if (!s) return; const dt = Math.min(.035, Math.max(.001, (now - (UI.last || now)) / 1000)); UI.last = now; updateSession(s, dt, now); drawSession(s, now); updateDungeonHud(); UI.raf = requestAnimationFrame(loop); }
  function updateSession(s, dt, now) {
    updateLocalInput(s, dt); if (s.online) updateNetwork(s, now);
    if (s.host) { updatePartyCombat(s, dt, now); updateEnemies(s, dt, now); updateProjectiles(s, dt); updateTraps(s, dt, now); updateZones(s, dt); checkRoomClear(s, now); }
    else updateGuestVisuals(s, dt);
    updateEffects(s, dt); s.camera.x += (s.player.x - s.camera.x) * Math.min(1, dt * 7); s.camera.y += (s.player.y - s.camera.y) * Math.min(1, dt * 7);
  }
  function updateLocalInput(s, dt) {
    const p = s.player; if (p.dead) return; let dx = 0, dy = 0; if (UI.keys.KeyW || UI.keys.ArrowUp) dy--; if (UI.keys.KeyS || UI.keys.ArrowDown) dy++; if (UI.keys.KeyA || UI.keys.ArrowLeft) dx--; if (UI.keys.KeyD || UI.keys.ArrowRight) dx++;
    if (s.mobileMove) { dx += s.mobileMove.x; dy += s.mobileMove.y; }
    const len = Math.hypot(dx, dy); p.moving=!!len; p.climbing=isOnLadder(s.layout,p.x,p.y);
    if (len) { dx /= len; dy /= len; const speed = 205 * (1 + p.haste * .35) * (p.climbing?.72:1); tryMoveEntity(s,p,dx*speed*dt,dy*speed*dt); p.angle = Math.atan2(dy, dx); p.walkPhase += dt*(p.climbing?10:15); }
    p.attackCd = Math.max(0, p.attackCd - dt); s.skillCooldowns = s.skillCooldowns.map(v => Math.max(0, v - dt));
    if (s.autoAttack) { const target = nearestEnemy(s, p, p.range + 80); if (target && lineWalkable(s,p,target,8)) { s.noTargetFor = 0; autoAttackPlayer(s, p, target); } else { s.noTargetFor += dt; if (s.noTargetFor >= 5) { s.autoAttack = false; showMessage("Auto-Angriff beendet · keine Gegner sichtbar", 1800); } } }
  }
  function updatePartyCombat(s, dt) { for (const p of s.players) { if (p.local || p.dead) continue; p.attackCd = Math.max(0, p.attackCd - dt); const target = nearestEnemy(s, p, p.range + 80); if (p.wantAttack && target) autoAttackPlayer(s, p, target); if (p.skillRequested) { executeSkill(s, p, p.skillRequested - 1); p.skillRequested = 0; } } }
  function autoAttackPlayer(s, p, target) { if (p.attackCd > 0 || target.dead || distance(p,target)>p.range+12 || !lineWalkable(s,p,target,8)) return; p.attackCd = 1 / (p.attackRate * (1 + p.haste)); p.angle = Math.atan2(target.y - p.y, target.x - p.x); p.attackAnim=.24; if (p.projectile) s.projectiles.push({ x: p.x, y: p.y, vx: Math.cos(p.angle) * 620, vy: Math.sin(p.angle) * 620, radius: 5, damage: rollDamage(p.damage, p.crit), ownerUid: p.uid, friendly: true, life: 1.4, color: p.color }); else damageEnemy(s, target, rollDamage(p.damage, p.crit), p); playSound("attack"); }
  function rollDamage(base, crit) { return Math.round(base * rand(.88, 1.12) * (Math.random() < crit ? 1.75 : 1)); }
  function nearestEnemy(s,p,max=Infinity){let best=null,bestD=max;for(const e of s.enemies){if(e.dead||!lineWalkable(s,p,e,7))continue;const d=distance(p,e);if(d<bestD){bestD=d;best=e;}}return best;}
  function damageEnemy(s, enemy, amount, source) { if (!enemy || enemy.dead) return; const dealt = Math.max(1, Math.round(amount * (1 - enemy.armor))); enemy.hp -= dealt; s.texts.push({ x: enemy.x, y: enemy.y - enemy.radius, text: `-${dealt}`, color: source?.role === "healer" ? "#ffe47a" : "#fff", life: .8 }); if (enemy.hp <= 0) killEnemy(s, enemy, source); }
  function killEnemy(s, enemy) { enemy.dead = true; ensureState().stats.kills++; if (enemy.boss) { ensureState().stats.bosses++; rewardBoss(s, enemy); } }
  function updateEnemies(s, dt, now) {
    for (const e of s.enemies) { if (e.dead) continue; e.attackCd = Math.max(0, e.attackCd - dt); e.specialCd = Math.max(0, e.specialCd - dt); e.attackAnim=Math.max(0,(e.attackAnim||0)-dt); const target = chooseEnemyTarget(s, e); if (!target) continue; e.targetUid = target.uid;
      const waypoint=nextEnemyWaypoint(s,e,target,dt), dx=waypoint.x-e.x,dy=waypoint.y-e.y,distToWaypoint=Math.hypot(dx,dy)||1,directDist=Math.hypot(target.x-e.x,target.y-e.y)||1;e.angle=Math.atan2(target.y-e.y,target.x-e.x);
      const desired=e.ranged?e.range*.78:e.range; e.moving=false;
      if(directDist>desired || !lineWalkable(s,e,target,e.radius*.45)){const moved=tryMoveEntity(s,e,dx/distToWaypoint*e.speed*dt,dy/distToWaypoint*e.speed*dt);e.moving=moved;if(moved)e.walkPhase=(e.walkPhase||0)+dt*11;}
      if (directDist <= e.range && lineWalkable(s,e,target,8) && e.attackCd <= 0) { e.attackCd = e.boss ? 1.25 : e.ranged ? 1.55 : 1.05; e.attackAnim=.3; if (e.ranged) s.projectiles.push({ x: e.x, y: e.y, vx: (target.x-e.x)/directDist * 420, vy: (target.y-e.y)/directDist * 420, radius: e.boss ? 10 : 6, damage: e.damage, ownerUid: e.id, friendly: false, life: 2.3, color: e.color }); else damagePlayer(s, target, e.damage, e); }
      if (e.boss && e.specialCd <= 0) { e.specialCd = rand(4.5, 7); bossSpecial(s, e, now); }
    }
  }
  function chooseEnemyTarget(s, enemy) { const alive = s.players.filter(p => !p.dead); if (!alive.length) return null; const tanks = alive.filter(p => p.role === "tank"); if (tanks.length && Math.random() < .84) return tanks.sort((a, b) => distance(enemy, a) - distance(enemy, b))[0]; return alive.sort((a, b) => distance(enemy, a) / (ROLES[a.role].aggro || 1) - distance(enemy, b) / (ROLES[b.role].aggro || 1))[0]; }
  function damagePlayer(s, p, amount, source) { if (!p || p.dead) return; let dealt = Math.max(1, Math.round(amount * (1 - p.armor))); if (p.buffs.fortress > 0) dealt = Math.round(dealt * .62); if (p.shield > 0) { const absorbed = Math.min(p.shield, dealt); p.shield -= absorbed; dealt -= absorbed; } p.hp -= dealt; s.texts.push({ x: p.x, y: p.y - 35, text: `-${dealt}`, color: "#ff647a", life: .8 }); if (p.hp <= 0) { p.hp = 0; p.dead = true; p.downedAt = Date.now(); if (p.local) ensureState().stats.deaths++; showMessage(`${p.name} ist gefallen`, 2200); } }
  function bossSpecial(s, boss) { const type = Math.floor(rand(0, 3)); if (type === 0) { s.bossTelegraph = { x: boss.x, y: boss.y, radius: boss.finalBoss ? 210 : 160, time: 1.25, damage: boss.damage * 1.7, type: "nova" }; showMessage(`${boss.name}: ZERSTÖRUNGSNOVA`, 1500); } else if (type === 1) { const t = chooseEnemyTarget(s, boss); if (t) s.bossTelegraph = { x: t.x, y: t.y, radius: 95, time: 1.1, damage: boss.damage * 2.1, type: "mark" }; } else { for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; s.projectiles.push({ x: boss.x, y: boss.y, vx: Math.cos(a) * 360, vy: Math.sin(a) * 360, radius: 9, damage: boss.damage * 1.25, ownerUid: boss.id, friendly: false, life: 3, color: boss.color }); } } }
  function updateProjectiles(s, dt) { for (const b of s.projectiles) { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; if (b.life <= 0 || !isWalkable(s,b.x,b.y,Math.max(2,b.radius*.45))) { b.life=0; continue; } if (b.friendly) { for (const e of s.enemies) { if (e.dead || distance(b, e) > b.radius + e.radius) continue; damageEnemy(s, e, b.damage, s.players.find(p => p.uid === b.ownerUid)); b.life = 0; break; } } else { for (const p of s.players) { if (p.dead || distance(b, p) > b.radius + p.radius) continue; damagePlayer(s, p, b.damage, null); b.life = 0; break; } } } s.projectiles = s.projectiles.filter(b => b.life > 0 && b.x > -50 && b.y > -50 && b.x < WORLD_W + 50 && b.y < WORLD_H + 50); }
  function updateTraps(s, dt, now) { for (const t of s.traps) { t.pulse += dt; if (!t.armed) continue; for (const p of s.players) { if (p.dead || distance(t, p) > t.radius + p.radius) continue; t.armed = false; damagePlayer(s, p, 22 + ensureState().level * 3.2, null); s.effects.push({ type: "trap", x: t.x, y: t.y, radius: t.radius, life: .7, color: "#ff5c67" }); } } if (s.bossTelegraph) { s.bossTelegraph.time -= dt; if (s.bossTelegraph.time <= 0) { for (const p of s.players) if (!p.dead && distance(p, s.bossTelegraph) <= s.bossTelegraph.radius + p.radius && lineWalkable(s,s.bossTelegraph,p,5)) damagePlayer(s, p, s.bossTelegraph.damage, s.boss); s.effects.push({ type: "blast", x: s.bossTelegraph.x, y: s.bossTelegraph.y, radius: s.bossTelegraph.radius, life: .75, color: "#ff4f66" }); s.bossTelegraph = null; } } }
  function updateEffects(s, dt) { for (const e of s.effects) e.life -= dt; for (const t of s.texts) { t.life -= dt; t.y -= 35 * dt; } s.effects = s.effects.filter(e => e.life > 0); s.texts = s.texts.filter(t => t.life > 0); for (const p of s.players) { p.attackAnim=Math.max(0,(p.attackAnim||0)-dt); p.castAnim=Math.max(0,(p.castAnim||0)-dt); if(p.castAnim<=0)p.skillAnim=0; for (const key of Object.keys(p.buffs)) p.buffs[key] = Math.max(0, p.buffs[key] - dt); } }
  function checkRoomClear(s, now) {
    if (s.players.every(p => p.dead)) return endDungeon(false, "Die Gruppe wurde besiegt.");
    if (s.enemies.some(e => !e.dead)) return;
    if (s.roomState === "combat") { s.clearAt = now; for (const chest of s.chests) chest.opened = true; rewardRoom(s); showMessage(s.room === s.dungeon.rooms ? "END-BOSS BESIEGT · AUSGANG GEÖFFNET" : "RAUM GESÄUBERT · TOR GEÖFFNET", 2600); if(s.room===s.dungeon.rooms){s.roomState="completed";s.completed=true;s.exitOpen=true;UI.main?.querySelector("[data-dkl-exit]")?.removeAttribute("hidden");}else{s.roomState="door-open";s.roomExitOpen=true;} }
    if(s.roomState==="door-open"&&now>s.roomTransitionLock){const exit=s.layout?.exit||{x:WORLD_W/2,y:100};const entering=s.players.some(p=>!p.dead&&Math.hypot(p.x-exit.x,p.y-exit.y)<58);if(entering){s.roomTransitionLock=now+1500;buildRoom(s,s.room+1);}}
  }
  function rewardRoom(s) { const d = ensureState(), multiplayer = s.partySize === 1 ? .7 : 1 + (s.partySize - 2) * .18, xp = Math.round((80 + s.dungeon.level * 24 + s.room * 20) * multiplayer); addXp(xp); d.gold += Math.round((35 + s.dungeon.level * 10 + s.room * 8) * multiplayer); if (s.room % 2 === 0 || s.chests.length) awardIndividualLoot(s, false); if (s.chests.length) d.stats.chests++; safeSave(); }
  function rewardBoss(s) { awardIndividualLoot(s, true); if (s.boss?.finalBoss) awardIndividualLoot(s, true); }
  function awardIndividualLoot(s, boss) {
    const d = ensureState(), bonus = s.partySize === 1 ? -12 : (s.partySize - 1) * 10 + (boss ? 20 : 0), rarity = rarityForLevel(Math.max(d.level, s.dungeon.level + s.room), bonus), level = clamp(Math.max(d.level, s.dungeon.level) + Math.floor(rand(-2, boss ? 6 : 3)), 1, MAX_LEVEL); const item = createItem(level, rarity, pick(SLOT_KEYS), d.classId); addItem(item, true); s.lootSeq++;
  }
  function selectPlayerTarget(uid){const s=UI.session;if(!s)return;const target=s.players.find(p=>p.uid===uid);if(!target)return;s.selectedTargetUid=target.uid;s.selectedEnemyId="";showMessage(`Ziel: ${target.name}`,900);updateDungeonHud();}
  function selectEnemyTarget(id){const s=UI.session;if(!s)return;const target=s.enemies.find(e=>e.id===id&&!e.dead);if(!target)return;s.selectedEnemyId=target.id;s.selectedTargetUid="";showMessage(`Ziel: ${target.name}`,900);updateDungeonHud();}
  function activePlayerTarget(s,p,allowDead=false){const uid=p.local?s.selectedTargetUid:p.targetUid;const target=s.players.find(x=>x.uid===uid);if(target&&(allowDead||!target.dead))return target;return null;}
  function activeEnemyTarget(s,p,max=760){const id=p.local?s.selectedEnemyId:p.targetEnemyId;const target=s.enemies.find(e=>e.id===id&&!e.dead);if(target&&distance(p,target)<=max&&lineWalkable(s,p,target,7))return target;return null;}
  function useSkill(index) { const s = UI.session; if (!s || s.player.dead || s.skillCooldowns[index] > 0) return; const used=executeSkill(s, s.player, index); if(!used)return; if (s.online && !s.host) { s.player.skillSeq++; s.player.skillRequested = index + 1; } }
  function executeSkill(s, p, index) {
    const role=p.role,classId=p.classId,cooldowns=SKILL_BASE_COOLDOWNS,enemyTarget=activeEnemyTarget(s,p,760)||nearestEnemy(s,p,700);let effectTarget=enemyTarget||p,used=true;
    if(role==="healer"){
      const selectedAlive=activePlayerTarget(s,p,false),selectedDead=activePlayerTarget(s,p,true);
      if(index===0){const target=selectedAlive||s.players.filter(x=>!x.dead).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0]||p;healPlayer(s,target,p.healing*2.2);effectTarget=target;}
      else if(index===1){const target=selectedAlive||p;target.buffs={...target.buffs};for(const key of ["poison","slow","curse","burn"])delete target.buffs[key];healPlayer(s,target,p.healing*1.45);effectTarget=target;}
      else if(index===2){const target=selectedAlive||p;target.buffs.fortress=Math.max(target.buffs.fortress||0,7);healPlayer(s,target,p.healing*.55);effectTarget=target;}
      else if(index===3){const hostile=activeEnemyTarget(s,p,760);const anchor=hostile||selectedAlive||p;const mode=hostile?"damage":"heal";s.zones.push({id:uid(),type:mode,x:anchor.x,y:anchor.y,radius:135,life:7,maxLife:7,tick:0,ownerUid:p.uid,amount:mode==="heal"?Math.max(1,p.healing*.32):Math.max(1,p.damage*.48),color:mode==="heal"?"#66f3a5":"#ffe47a"});effectTarget=anchor;}
      else {const target=selectedDead?.dead?selectedDead:s.players.find(x=>x.dead);if(!target){if(p.local)showMessage("Wiedergeburt benötigt einen gefallenen Mitspieler",1900);return false;}target.dead=false;target.hp=Math.max(1,Math.round(target.maxHp*.45));target.downedAt=0;s.texts.push({x:target.x,y:target.y-42,text:"WIEDERBELEBT",color:"#9dffbd",life:1.2});effectTarget=target;}
    }else if(role==="tank"){
      const target=activeEnemyTarget(s,p,700)||enemyTarget;
      if(index===0&&target){damageEnemy(s,target,p.damage*1.3,p);target.specialCd+=2;effectTarget=target;}else if(index===1)p.buffs.fortress=8;else if(index===2)areaDamage(s,p.x,p.y,155,p.damage*1.2,p);else if(index===3)s.players.forEach(x=>x.shield+=Math.round(p.maxHp*.18));else{p.buffs.fortress=11;areaDamage(s,p.x,p.y,220,p.damage*2.2,p);}
    }else{
      const target=activeEnemyTarget(s,p,760)||enemyTarget;
      if(index===0)classId==="ranger"?multiShot(s,p,3,target):areaDamage(s,p.x,p.y,145,p.damage*1.25,p);else if(index===1){p.buffs.haste=8;s.effects.push({type:"aura",x:p.x,y:p.y,radius:110,life:8,color:p.color});}else if(index===2&&target){damageEnemy(s,target,p.damage*2.4,p);effectTarget=target;}else if(index===3)areaDamage(s,target?.x||p.x,target?.y||p.y,190,p.damage*1.85,p);else areaDamage(s,target?.x||p.x,target?.y||p.y,285,p.damage*3.5,p);
    }
    if(used){if(p.local){s.skillCooldowns[index]=cooldowns[index]*(1-p.haste*.35);s.cooldownTotals[index]=s.skillCooldowns[index];}p.castAnim=.7;p.skillAnim=index+1;p.attackAnim=Math.max(p.attackAnim||0,.28);s.effects.push({type:"skill",x:effectTarget.x||p.x,y:effectTarget.y||p.y,radius:90+index*25,life:.8,color:p.color});playSound("skill");}
    return used;
  }
  function healPlayer(s,p,amount){if(p.dead)return;const value=Math.max(1,Math.round(amount));p.hp=Math.min(p.maxHp,p.hp+value);s.texts.push({x:p.x,y:p.y-35,text:`+${value}`,color:"#64f3a4",life:.9});}
  function areaDamage(s,x,y,radius,damage,source){for(const e of s.enemies)if(!e.dead&&Math.hypot(e.x-x,e.y-y)<=radius+e.radius&&lineWalkable(s,{x,y},e,5))damageEnemy(s,e,damage,source);}
  function multiShot(s,p,count,chosen){const target=chosen||activeEnemyTarget(s,p,760)||nearestEnemy(s,p,700);if(!target||!lineWalkable(s,p,target,7))return;const base=Math.atan2(target.y-p.y,target.x-p.x);for(let i=0;i<count;i++){const a=base+(i-(count-1)/2)*.13;s.projectiles.push({x:p.x,y:p.y,vx:Math.cos(a)*680,vy:Math.sin(a)*680,radius:5,damage:p.damage*1.15,ownerUid:p.uid,friendly:true,life:1.5,color:p.color});}}
  function updateZones(s,dt){for(const z of s.zones||[]){z.life-=dt;z.tick-=dt;if(z.tick<=0){z.tick=.72;const owner=s.players.find(p=>p.uid===z.ownerUid)||s.player;if(z.type==="heal"){for(const p of s.players)if(!p.dead&&Math.hypot(p.x-z.x,p.y-z.y)<=z.radius+p.radius){const percent=p.maxHp*.025;healPlayer(s,p,percent+z.amount);}}else{for(const e of s.enemies)if(!e.dead&&Math.hypot(e.x-z.x,e.y-z.y)<=z.radius+e.radius&&lineWalkable(s,z,e,4))damageEnemy(s,e,z.amount,owner);}}}s.zones=(s.zones||[]).filter(z=>z.life>0);}
  function toggleAutoAttack() { const s = UI.session; if (!s) return; s.autoAttack = !s.autoAttack; s.noTargetFor = 0; updateDungeonHud(); }
  function showMessage(text, duration = 1800) { const s = UI.session; if (!s) return; s.message = text; s.messageUntil = performance.now() + duration; }

  function updateNetwork(s, now) {
    const p = s.online, fb = p.fb;
    if (now - s.networkLastWrite > 55) {
      s.networkLastWrite = now;
      safeSetDoc(fb, s.selfRef, {
        uid: String(s.player.uid || ""), name: String(s.player.name || "Spieler"),
        x: finite(s.player.x, WORLD_W / 2), y: finite(s.player.y, WORLD_H / 2), angle: finite(s.player.angle, 0),
        hp: Math.max(0, finite(s.player.hp, 0)), maxHp: Math.max(1, finite(s.player.maxHp, 1)), dead: !!s.player.dead,
        wantAttack: !!s.autoAttack, moving: !!s.player.moving, attackAnim: Math.max(0, finite(s.player.attackAnim, 0)), castAnim: Math.max(0, finite(s.player.castAnim, 0)), skillAnim: Math.max(0, Math.floor(finite(s.player.skillAnim, 0))), skillSeq: Math.max(0, Math.floor(finite(s.player.skillSeq, 0))),
        skillRequested: Math.max(0, Math.floor(finite(s.player.skillRequested, 0))), targetUid: String(s.selectedTargetUid || ""), targetEnemyId: String(s.selectedEnemyId || ""), role: String(s.player.role || "dps"),
        classId: String(s.player.classId || "berserker"), power: Math.max(0, Math.round(finite(s.player.power, 0))),
        updatedAtMs: Date.now()
      }, { merge: true }, "Spielerstatus konnte nicht geschrieben werden");
      s.player.skillRequested = 0;
    }
    if (s.host && now - s.networkLastWorld > 72) {
      s.networkLastWorld = now;
      safeSetDoc(fb, s.worldRef, worldSnapshot(s), { merge: false }, "Weltstatus konnte nicht geschrieben werden");
    }
  }
  function applyRemoteInput(id,data){const s=UI.session,p=s?.remotePlayers.get(id);if(!p)return;const tx=Number(data.x??p.x),ty=Number(data.y??p.y);p.netX=tx;p.netY=ty;const dx=tx-p.x,dy=ty-p.y;tryMoveEntity(s,p,dx*.72,0);tryMoveEntity(s,p,0,dy*.72);p.moving=!!data.moving||Math.hypot(dx,dy)>.8;if(p.moving)p.walkPhase=(p.walkPhase||0)+.22;p.angle=Number(data.angle??p.angle);p.wantAttack=!!data.wantAttack;p.targetUid=String(data.targetUid||"");p.targetEnemyId=String(data.targetEnemyId||"");p.attackAnim=Math.max(p.attackAnim||0,Number(data.attackAnim||0));p.castAnim=Math.max(p.castAnim||0,Number(data.castAnim||0));p.skillAnim=Number(data.skillAnim||p.skillAnim||0);if(Number(data.skillSeq||0)>Number(p.lastSkillSeq||0)){p.lastSkillSeq=Number(data.skillSeq);p.skillRequested=Number(data.skillRequested||0);}}
  function worldSnapshot(s) {
    return firestoreSafe({
      seq: ++s.worldSeq,
      room: Math.max(1, Math.floor(finite(s.room, 1))),
      roomState: String(s.roomState || "combat"),
      completed: !!s.completed,
      exitOpen: !!s.exitOpen,
      message: String(s.message || ""),
      messageUntil: Math.max(0, finite(s.messageUntil, 0)),
      enemies: s.enemies.filter(e => e && !e.dead).map(e => ({
        id: String(e.id || uid()), name: String(e.name || "Kreatur"),
        x: Math.round(finite(e.x, WORLD_W / 2)), y: Math.round(finite(e.y, WORLD_H / 2)),
        hp: Math.max(0, Math.round(finite(e.hp, 0))), maxHp: Math.max(1, Math.round(finite(e.maxHp, 1))),
        radius: Math.max(1, finite(e.radius, 20)), boss: !!e.boss, elite: !!e.elite,
        finalBoss: !!e.finalBoss, color: String(e.color || s.dungeon?.color || "#ffffff"),
        angle: finite(e.angle, 0), moving: !!e.moving, attackAnim: Math.max(0, finite(e.attackAnim, 0))
      })),
      players: s.players.filter(Boolean).map(player => ({
        uid: String(player.uid || ""), x: Math.round(finite(player.x, WORLD_W / 2)),
        y: Math.round(finite(player.y, WORLD_H / 2)), hp: Math.max(0, Math.round(finite(player.hp, 0))),
        maxHp: Math.max(1, Math.round(finite(player.maxHp, 1))), dead: !!player.dead,
        angle: finite(player.angle, 0), moving: !!player.moving, attackAnim: Math.max(0, finite(player.attackAnim, 0)), castAnim: Math.max(0, finite(player.castAnim, 0)), skillAnim: Math.max(0, Math.floor(finite(player.skillAnim, 0))), role: String(player.role || "dps"),
        classId: String(player.classId || "berserker"), name: String(player.name || "Spieler"),
        power: Math.max(0, Math.round(finite(player.power, 0)))
      })),
      zones: (s.zones||[]).slice(-8).map(z=>({id:String(z.id||uid()),type:String(z.type||"heal"),x:finite(z.x,0),y:finite(z.y,0),radius:finite(z.radius,120),life:finite(z.life,0),maxLife:finite(z.maxLife,7),color:String(z.color||"#66f3a5")})),
      projectiles: s.projectiles.slice(-80).filter(Boolean).map(projectile => ({
        x: Math.round(finite(projectile.x, 0)), y: Math.round(finite(projectile.y, 0)),
        vx: finite(projectile.vx, 0), vy: finite(projectile.vy, 0),
        radius: Math.max(1, finite(projectile.radius, 4)), friendly: !!projectile.friendly,
        color: String(projectile.color || "#ffffff")
      })),
      lootSeq: Math.max(0, Math.floor(finite(s.lootSeq, 0))),
      updatedAtMs: Date.now(), version: VERSION
    });
  }
  function applyWorldSnapshot(data){const s=UI.session;if(!s||Number(data.seq||0)<=Number(s.lastWorldSeq||0))return;s.lastWorldSeq=Number(data.seq);if(Number(data.room||1)!==s.room){s.room=Number(data.room);s.roomState=data.roomState;s.layout=createRoomLayout(s,s.room);s.roomExitOpen=s.roomState==="door-open";s.player.x=s.layout.entry.x;s.player.y=s.layout.entry.y;s.player.path=[];}else{s.roomState=data.roomState||s.roomState;s.roomExitOpen=s.roomState==="door-open";}s.completed=!!data.completed;s.exitOpen=!!data.exitOpen;const previous=new Map((s.enemies||[]).map(e=>[e.id,e]));s.enemies=(data.enemies||[]).map(raw=>{const e=previous.get(raw.id)||{...raw,x:raw.x,y:raw.y,walkPhase:0};e.netX=Number(raw.x??e.x);e.netY=Number(raw.y??e.y);e.hp=raw.hp;e.maxHp=raw.maxHp;e.radius=raw.radius;e.boss=!!raw.boss;e.elite=!!raw.elite;e.finalBoss=!!raw.finalBoss;e.color=raw.color;e.name=raw.name;e.angle=Number(raw.angle||0);e.moving=!!raw.moving;e.attackAnim=Math.max(e.attackAnim||0,Number(raw.attackAnim||0));e.dead=false;return e;});s.projectiles=(data.projectiles||[]).map(b=>({...b,life:.42}));s.zones=(data.zones||[]).map(z=>({...z}));for(const raw of data.players||[]){const p=raw.uid===s.player.uid?s.player:s.remotePlayers.get(raw.uid);if(!p)continue;if(p.local){p.hp=raw.hp;p.dead=raw.dead;}else{p.netX=Number(raw.x??p.x);p.netY=Number(raw.y??p.y);p.hp=raw.hp;p.maxHp=raw.maxHp;p.dead=raw.dead;p.angle=Number(raw.angle??p.angle);p.moving=!!raw.moving;p.attackAnim=Math.max(p.attackAnim||0,Number(raw.attackAnim||0));p.castAnim=Math.max(p.castAnim||0,Number(raw.castAnim||0));p.skillAnim=Number(raw.skillAnim||p.skillAnim||0);}}if(Number(data.lootSeq||0)>s.lastLootSeq){const count=Number(data.lootSeq)-s.lastLootSeq;s.lastLootSeq=Number(data.lootSeq);for(let i=0;i<count;i++)awardGuestLoot(s);}if(s.exitOpen)UI.main?.querySelector("[data-dkl-exit]")?.removeAttribute("hidden");}
  function awardGuestLoot(s) { const d = ensureState(), rarity = rarityForLevel(Math.max(d.level, s.dungeon.level + s.room), (s.partySize - 1) * 10 + 10); addItem(createItem(Math.max(d.level, s.dungeon.level), rarity, pick(SLOT_KEYS), d.classId), true); }
  function updateGuestVisuals(s, dt) { for(const p of s.players){if(p.local)continue;const ox=p.x,oy=p.y;p.x+=(Number(p.netX??p.x)-p.x)*Math.min(1,dt*13);p.y+=(Number(p.netY??p.y)-p.y)*Math.min(1,dt*13);if(p.moving||Math.hypot(p.x-ox,p.y-oy)>.15)p.walkPhase=(p.walkPhase||0)+dt*15;}for(const e of s.enemies){const ox=e.x,oy=e.y;e.x+=(Number(e.netX??e.x)-e.x)*Math.min(1,dt*12);e.y+=(Number(e.netY??e.y)-e.y)*Math.min(1,dt*12);if(e.moving||Math.hypot(e.x-ox,e.y-oy)>.15)e.walkPhase=(e.walkPhase||0)+dt*11;e.attackAnim=Math.max(0,(e.attackAnim||0)-dt);} for (const b of s.projectiles) { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; } s.projectiles = s.projectiles.filter(b => b.life > 0); }

  function drawSession(s, now) {
    const ctx = s.ctx; if (!ctx) return; ctx.clearRect(0, 0, CANVAS_W, CANVAS_H); drawDungeonGround(ctx, s, now); drawDungeonProps(ctx,s,now,"back"); drawTraps(ctx, s, now); drawChests(ctx, s); drawDungeonDoor(ctx,s,now); if (s.bossTelegraph) drawTelegraph(ctx, s, s.bossTelegraph); for(const z of s.zones||[])drawZone(ctx,s,z,now); for (const e of s.effects) drawEffect(ctx, s, e); for (const b of s.projectiles) drawProjectile(ctx, s, b);
    const actors=[...s.enemies.filter(e=>!e.dead).map(e=>({y:e.y,kind:"enemy",value:e})),...s.players.map(p=>({y:p.y,kind:"player",value:p}))].sort((a,b)=>a.y-b.y);for(const actor of actors){if(actor.kind==="enemy")drawEnemy(ctx,s,actor.value,now);else drawPlayer(ctx,s,actor.value,now);}
    drawDungeonProps(ctx,s,now,"front"); for (const t of s.texts) drawText(ctx, s, t); if (s.messageUntil > now) drawCenterMessage(ctx, s.message); if (s.exitOpen) drawPortal(ctx, s, now); drawMiniMap(s);
  }
  function sx(s, x) { return x - s.camera.x + CANVAS_W / 2; } function sy(s, y) { return y - s.camera.y + CANVAS_H / 2; }
  function floorTileVisible(s,x,y,size){const px=sx(s,x),py=sy(s,y);return px>-size&&py>-size&&px<CANVAS_W+size&&py<CANVAS_H+size;}
  function drawDungeonGround(ctx,s,now){const l=s.layout||createRoomLayout(s,s.room),p=l.palette,t=l.tile;ctx.fillStyle=p.void;ctx.fillRect(0,0,CANVAS_W,CANVAS_H);ctx.save();ctx.translate(sx(s,0),sy(s,0));
    // Raised floors cast a real edge shadow.
    for(const z of l.raised||[]){ctx.fillStyle="#0009";ctx.fillRect(z.x+12,z.y+14,z.w,z.h);}
    const cols=Math.ceil(WORLD_W/t),rows=Math.ceil(WORLD_H/t);for(let gy=0;gy<rows;gy++)for(let gx=0;gx<cols;gx++){const wx=gx*t,wy=gy*t,cx=wx+t/2,cy=wy+t/2;if(!floorTileVisible(s,wx,wy,t))continue;const floor=isPointInWalkableRaw(l.walkable,l.blocked,cx,cy,2);if(floor){const raised=l.raised?.some(z=>containsRect(z,cx,cy,0));const v=(hashSeed(`${l.seed}:${gx}:${gy}`)%4);ctx.fillStyle=v%2?p.floor:p.floor2;ctx.fillRect(wx,wy,t,t);ctx.strokeStyle=p.line+"55";ctx.lineWidth=1;ctx.strokeRect(wx+.5,wy+.5,t-1,t-1);ctx.fillStyle=raised?p.accent+"12":"#ffffff08";ctx.fillRect(wx+5,wy+5,t-10,4);if(v===0){ctx.strokeStyle="#10151a55";ctx.beginPath();ctx.moveTo(wx+9,wy+31);ctx.lineTo(wx+21,wy+25);ctx.lineTo(wx+32,wy+35);ctx.stroke();}}
      else{const adjacent=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>isPointInWalkableRaw(l.walkable,l.blocked,cx+dx*t,cy+dy*t,2));if(adjacent){ctx.fillStyle=p.wall;ctx.fillRect(wx,wy,t,t);ctx.fillStyle=p.wallTop;ctx.fillRect(wx,wy,t,13);ctx.strokeStyle=p.edge;ctx.lineWidth=3;ctx.strokeRect(wx+1.5,wy+1.5,t-3,t-3);ctx.strokeStyle=p.line+"66";ctx.beginPath();ctx.moveTo(wx+8,wy+26);ctx.lineTo(wx+t-8,wy+26);ctx.stroke();}}
    }
    for(const b of l.blocked){ctx.fillStyle=b.kind==="water"?p.liquid:b.kind==="lava"?"#c63c16":p.void;ctx.fillRect(b.x,b.y,b.w,b.h);if(b.kind==="water"){ctx.strokeStyle="#6be0ff77";ctx.lineWidth=3;for(let y=b.y+18;y<b.y+b.h;y+=28){ctx.beginPath();ctx.moveTo(b.x+12,y);ctx.quadraticCurveTo(b.x+b.w*.35,y-8,b.x+b.w*.55,y);ctx.quadraticCurveTo(b.x+b.w*.75,y+8,b.x+b.w-12,y);ctx.stroke();}}if(b.kind==="lava"){ctx.fillStyle="#ff9a35";for(let i=0;i<7;i++){const x=b.x+20+(i*79)%Math.max(40,b.w-40),y=b.y+20+(i*53)%Math.max(40,b.h-40);ctx.beginPath();ctx.arc(x,y,5+(i%3)*3,0,Math.PI*2);ctx.fill();}}}
    for(const ladder of l.ladders){ctx.fillStyle="#6b4a2e";ctx.fillRect(ladder.x,ladder.y,ladder.w,ladder.h);ctx.strokeStyle="#c58a52";ctx.lineWidth=5;if(ladder.dir==="vertical"){ctx.beginPath();ctx.moveTo(ladder.x+18,ladder.y);ctx.lineTo(ladder.x+18,ladder.y+ladder.h);ctx.moveTo(ladder.x+ladder.w-18,ladder.y);ctx.lineTo(ladder.x+ladder.w-18,ladder.y+ladder.h);ctx.stroke();for(let y=ladder.y+12;y<ladder.y+ladder.h;y+=18){ctx.beginPath();ctx.moveTo(ladder.x+18,y);ctx.lineTo(ladder.x+ladder.w-18,y);ctx.stroke();}}else{for(let x=ladder.x+12;x<ladder.x+ladder.w;x+=18){ctx.fillRect(x,ladder.y+8,8,ladder.h-16);}}}
    ctx.restore();
  }
  function drawDungeonProps(ctx,s,now,layer){const l=s.layout;if(!l)return;for(const p of l.props||[]){const front=!p.decor&&p.y>s.player.y+20;if((layer==="front")!==front)continue;const x=sx(s,p.x),y=sy(s,p.y);if(x<-80||y<-100||x>CANVAS_W+80||y>CANVAS_H+80)continue;ctx.save();ctx.translate(x,y);if(p.type==="torch"){const pulse=.7+.3*Math.sin(now*.01+p.x);ctx.fillStyle="#3c2c28";ctx.fillRect(-3,-22,6,25);ctx.shadowColor=s.layout.palette.accent;ctx.shadowBlur=22;ctx.fillStyle=s.layout.palette.accent;ctx.beginPath();ctx.moveTo(0,-35);ctx.quadraticCurveTo(12,-20,0,-14);ctx.quadraticCurveTo(-12,-20,0,-35);ctx.fill();ctx.globalAlpha=.12*pulse;ctx.beginPath();ctx.arc(0,-22,55,0,Math.PI*2);ctx.fill();}
      else if(p.type==="column"){ctx.fillStyle=s.layout.palette.wallTop;ctx.fillRect(-18,-58,36,58);ctx.fillStyle=s.layout.palette.wall;ctx.fillRect(-24,-8,48,14);ctx.fillRect(-23,-62,46,12);ctx.strokeStyle=s.layout.palette.line;ctx.strokeRect(-18,-58,36,58);}
      else if(p.type==="barrel"){ctx.fillStyle="#6c432b";ctx.beginPath();ctx.ellipse(0,-24,18,9,0,0,Math.PI*2);ctx.fill();ctx.fillRect(-18,-24,36,38);ctx.fillStyle="#a06b42";ctx.fillRect(-18,-15,36,5);ctx.fillRect(-18,4,36,5);}
      else if(p.type==="crate"){ctx.fillStyle="#725033";ctx.fillRect(-23,-42,46,42);ctx.strokeStyle="#bb8651";ctx.lineWidth=3;ctx.strokeRect(-23,-42,46,42);ctx.beginPath();ctx.moveTo(-20,-38);ctx.lineTo(20,-4);ctx.moveTo(20,-38);ctx.lineTo(-20,-4);ctx.stroke();}
      else if(p.type==="urn"){ctx.fillStyle="#64515c";ctx.beginPath();ctx.moveTo(-12,0);ctx.quadraticCurveTo(-20,-18,-10,-37);ctx.lineTo(10,-37);ctx.quadraticCurveTo(20,-18,12,0);ctx.closePath();ctx.fill();ctx.fillStyle="#a48b99";ctx.fillRect(-11,-41,22,6);}
      else if(p.type==="tree"){ctx.fillStyle="#473321";ctx.fillRect(-10,-50,20,50);ctx.fillStyle="#234c31";for(const[oX,oY,r]of[[-15,-55,24],[13,-60,27],[0,-82,28]]){ctx.beginPath();ctx.arc(oX,oY,r,0,Math.PI*2);ctx.fill();}}
      else if(p.type==="roots"){ctx.strokeStyle="#6a5131";ctx.lineWidth=8;for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(Math.cos(i)*45,-20,Math.cos(i)*80,Math.sin(i)*55);ctx.stroke();}}
      else if(p.type==="crystal"){ctx.shadowColor=s.layout.palette.accent;ctx.shadowBlur=18;ctx.fillStyle=s.layout.palette.accent;ctx.beginPath();ctx.moveTo(0,-52);ctx.lineTo(22,-13);ctx.lineTo(10,0);ctx.lineTo(-15,-8);ctx.lineTo(-22,-30);ctx.closePath();ctx.fill();}
      else if(p.type==="throne"){ctx.fillStyle="#5b4b40";ctx.fillRect(-34,-58,68,58);ctx.fillStyle="#9e8872";ctx.fillRect(-26,-50,52,35);ctx.fillRect(-42,-10,84,12);}
      else if(p.type==="rubble"){ctx.fillStyle=s.layout.palette.wallTop;for(let i=0;i<5;i++){ctx.beginPath();ctx.arc((i-2)*8,(i%2)*4-3,4+i%3,0,Math.PI*2);ctx.fill();}}
      else if(p.type==="bones"){ctx.strokeStyle="#d8d0bf";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-14,-5);ctx.lineTo(14,5);ctx.moveTo(-12,7);ctx.lineTo(12,-7);ctx.stroke();}
      ctx.restore();}}
  function drawDungeonDoor(ctx,s,now){if(!s.layout)return;const e=s.layout.exit,x=sx(s,e.x),y=sy(s,e.y),open=s.roomExitOpen||s.completed;ctx.save();ctx.translate(x,y);ctx.fillStyle="#15131a";ctx.strokeStyle=s.layout.palette.wallTop;ctx.lineWidth=6;ctx.beginPath();ctx.roundRect(-42,-48,84,72,20);ctx.fill();ctx.stroke();if(open){ctx.shadowColor=s.layout.palette.accent;ctx.shadowBlur=22;ctx.fillStyle=s.layout.palette.accent+"66";ctx.fillRect(-29,-36,58,53);ctx.fillStyle="#f4ffff";ctx.font="900 10px system-ui";ctx.textAlign="center";ctx.fillText(s.completed?"AUSGANG":"NÄCHSTER RAUM",0,40);}else{ctx.fillStyle="#754b2f";ctx.fillRect(-29,-36,58,53);ctx.strokeStyle="#c18b57";ctx.lineWidth=3;for(let i=-20;i<=20;i+=10){ctx.beginPath();ctx.moveTo(i,-34);ctx.lineTo(i,15);ctx.stroke();}}ctx.restore();}
  function drawMiniMap(s){const c=s.minimap;if(!c||!s.layout)return;const ctx=c.getContext("2d"),scale=Math.min(c.width/WORLD_W,c.height/WORLD_H);ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle="#020509dd";ctx.fillRect(0,0,c.width,c.height);ctx.save();ctx.scale(scale,scale);ctx.fillStyle=s.layout.palette.floor;for(const z of s.layout.walkable)ctx.fillRect(z.x,z.y,z.w,z.h);ctx.fillStyle=s.layout.palette.void;for(const z of s.layout.blocked)ctx.fillRect(z.x,z.y,z.w,z.h);ctx.fillStyle=s.roomExitOpen||s.completed?"#6fffd0":"#9a6b43";ctx.fillRect(s.layout.exit.x-18,s.layout.exit.y-18,36,36);for(const p of s.players){ctx.fillStyle=p.local?"#ffffff":ROLES[p.role]?.color||"#7ff";ctx.beginPath();ctx.arc(p.x,p.y,14,0,Math.PI*2);ctx.fill();}ctx.fillStyle="#ff6479";for(const e of s.enemies)if(!e.dead){ctx.beginPath();ctx.arc(e.x,e.y,e.boss?18:8,0,Math.PI*2);ctx.fill();}ctx.restore();ctx.strokeStyle="#58737c";ctx.strokeRect(.5,.5,c.width-1,c.height-1);}

  function drawPlayer(ctx,s,p,now){const selected=(s.selectedTargetUid===p.uid);const x=sx(s,p.x),y=sy(s,p.y),c=CLASSES[p.classId]||CLASSES.berserker,r=ROLES[p.role]||ROLES.dps,phase=p.moving?Math.sin((p.walkPhase||now*.012))*5:0,bob=p.moving?Math.abs(Math.sin((p.walkPhase||now*.012)))*2:0,side=Math.cos(p.angle)>=0?1:-1,front=Math.sin(p.angle)>.35,back=Math.sin(p.angle)<-.35,attack=(p.attackAnim||0)>.01;ctx.save();ctx.translate(x,y);ctx.globalAlpha=p.dead?.35:1;
    if(selected){ctx.strokeStyle="#66f3a5";ctx.shadowColor="#66f3a5";ctx.shadowBlur=18;ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(0,7,31,13,0,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;}ctx.fillStyle="#0008";ctx.beginPath();ctx.ellipse(0,5,25,9,0,0,Math.PI*2);ctx.fill();if(p.climbing){ctx.strokeStyle="#d6a267";ctx.lineWidth=7;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(-8,-30);ctx.lineTo(-13+phase,-4);ctx.moveTo(8,-30);ctx.lineTo(13-phase,-4);ctx.moveTo(-7,-2);ctx.lineTo(-10-phase,15);ctx.moveTo(7,-2);ctx.lineTo(10+phase,15);ctx.stroke();}
    else{ctx.strokeStyle="#182229";ctx.lineWidth=9;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(-7,-4);ctx.lineTo(-9+phase*.45,17);ctx.moveTo(7,-4);ctx.lineTo(9-phase*.45,17);ctx.stroke();ctx.strokeStyle=c.color;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-10+phase*.45,18);ctx.lineTo(-16+phase*.45,20);ctx.moveTo(10-phase*.45,18);ctx.lineTo(16-phase*.45,20);ctx.stroke();}
    const torsoY=-25-bob;ctx.fillStyle=c.color;ctx.strokeStyle="#dcecf0";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-17,torsoY-12);ctx.quadraticCurveTo(-21,torsoY+7,-14,torsoY+22);ctx.lineTo(14,torsoY+22);ctx.quadraticCurveTo(21,torsoY+7,17,torsoY-12);ctx.quadraticCurveTo(0,torsoY-20,-17,torsoY-12);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=front?"#ffffff22":"#00000025";ctx.fillRect(-12,torsoY-7,24,5);ctx.strokeStyle="#c98e72";ctx.lineWidth=7;ctx.beginPath();const armSwing=attack?12:phase*.35;ctx.moveTo(-15,torsoY-7);ctx.lineTo(-23,torsoY+8+armSwing);ctx.moveTo(15,torsoY-7);ctx.lineTo(23,torsoY+8-armSwing);ctx.stroke();
    ctx.fillStyle="#c98e72";ctx.beginPath();ctx.ellipse(0,torsoY-25,11,13,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#2b201d";ctx.beginPath();ctx.arc(0,torsoY-29,11,Math.PI,Math.PI*2);ctx.lineTo(9,torsoY-23);ctx.quadraticCurveTo(0,torsoY-18,-9,torsoY-23);ctx.fill();if(!back){ctx.fillStyle="#15181b";ctx.beginPath();ctx.arc(-4,torsoY-25,1.3,0,Math.PI*2);ctx.arc(4,torsoY-25,1.3,0,Math.PI*2);ctx.fill();}
    drawPlayerWeapon(ctx,p,c,torsoY,side,attack,(p.castAnim||0)>0);ctx.fillStyle="#fff";ctx.font="900 11px system-ui";ctx.textAlign="center";ctx.shadowColor="#000";ctx.shadowBlur=5;ctx.fillText(p.name,0,torsoY-47);ctx.fillStyle=r.color;ctx.font="800 10px system-ui";ctx.fillText(`${r.icon} ${Math.round(p.hp/Math.max(1,p.maxHp)*100)}%`,0,torsoY-35);ctx.restore();}
  function drawPlayerWeapon(ctx,p,c,torsoY,side,attack,casting){ctx.save();ctx.translate(side*(casting?9:19),torsoY+(casting?-18:4));const swing=attack?(side>0?-.7:.7):0;if(p.role==="tank"){ctx.fillStyle="#496a7c";ctx.strokeStyle="#8fe8ff";ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(-side*34,3,14,20,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.rotate(swing);ctx.strokeStyle="#edf5fb";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,-24);ctx.lineTo(side*11,24);ctx.stroke();ctx.strokeStyle="#9a6b3f";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-side*3,9);ctx.lineTo(side*7,13);ctx.stroke();}
    else if(c.weaponType==="bow"){ctx.strokeStyle="#c2ef7e";ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,20,-Math.PI/2,Math.PI/2);ctx.stroke();ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(0,20);ctx.stroke();ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-7,0);ctx.lineTo(24,0);ctx.stroke();}
    else if(c.projectile){ctx.rotate(swing*.5);ctx.strokeStyle=c.color;ctx.shadowColor=c.color;ctx.shadowBlur=casting?25:12;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(0,casting?-40:-22);ctx.lineTo(0,casting?22:25);ctx.stroke();ctx.fillStyle=casting?"#eafff1":"#fff";ctx.beginPath();ctx.arc(0,casting?-43:-25,casting?9:6,0,Math.PI*2);ctx.fill();if(casting){ctx.strokeStyle="#87ffc0";ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-43,15,0,Math.PI*2);ctx.stroke();}}
    else{ctx.rotate(swing);ctx.strokeStyle="#f3f7ff";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,-23);ctx.lineTo(side*12,25);ctx.stroke();ctx.strokeStyle="#a67648";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-side*3,8);ctx.lineTo(side*8,12);ctx.stroke();}ctx.restore();}

  function drawEnemy(ctx,s,e,now){const selected=(s.selectedEnemyId===e.id);const x=sx(s,e.x),y=sy(s,e.y),pulse=.5+.5*Math.sin(now*.006),scale=e.boss?1.35:e.elite?1.12:1,phase=e.moving?Math.sin(e.walkPhase||now*.01)*5:0;ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);if(selected){ctx.strokeStyle="#ffe47a";ctx.shadowColor="#ffe47a";ctx.shadowBlur=18;ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(0,8,e.radius+12,e.radius*.45,0,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;}ctx.fillStyle="#0009";ctx.beginPath();ctx.ellipse(0,6,e.radius*.9,e.radius*.28,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#17191e";ctx.lineWidth=8;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(-6,-2);ctx.lineTo(-8+phase*.4,15);ctx.moveTo(6,-2);ctx.lineTo(8-phase*.4,15);ctx.stroke();ctx.shadowColor=e.color;ctx.shadowBlur=e.boss?22:9;ctx.fillStyle=e.color;ctx.strokeStyle=e.boss?"#fff":e.elite?"#ffd85d":"#20242a";ctx.lineWidth=e.boss?3:2;ctx.beginPath();ctx.moveTo(-e.radius*.65,-28);ctx.quadraticCurveTo(-e.radius,-8,-e.radius*.62,8);ctx.lineTo(e.radius*.62,8);ctx.quadraticCurveTo(e.radius,-8,e.radius*.65,-28);ctx.quadraticCurveTo(0,-42,-e.radius*.65,-28);ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle="#9d715b";ctx.beginPath();ctx.arc(0,-42,10+(e.boss?4:0),0,Math.PI*2);ctx.fill();ctx.fillStyle="#17141a";ctx.beginPath();ctx.arc(0,-46,11+(e.boss?4:0),Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle="#ffdf6a";ctx.beginPath();ctx.arc(-4,-42,1.6,0,Math.PI*2);ctx.arc(4,-42,1.6,0,Math.PI*2);ctx.fill();if(e.boss){ctx.strokeStyle=e.color;ctx.globalAlpha=.45+pulse*.35;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-15,e.radius+10+pulse*5,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;ctx.fillStyle=e.color;ctx.beginPath();ctx.moveTo(-12,-53);ctx.lineTo(-22,-72);ctx.lineTo(-4,-57);ctx.moveTo(12,-53);ctx.lineTo(22,-72);ctx.lineTo(4,-57);ctx.fill();}if(e.ranged){ctx.strokeStyle="#d9e2e8";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(17,-27);ctx.lineTo(25,6);ctx.stroke();ctx.fillStyle=e.color;ctx.beginPath();ctx.arc(17,-30,5,0,Math.PI*2);ctx.fill();}else{ctx.strokeStyle="#e7edf1";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(17,-28);ctx.lineTo(28,8+(e.attackAnim?8:0));ctx.stroke();}ctx.scale(1/scale,1/scale);const w=Math.max(50,e.radius*2.4);ctx.fillStyle="#19080b";ctx.fillRect(-w/2,-e.radius*scale-42,w,6);ctx.fillStyle=e.boss?"#ff526f":"#7ce98d";ctx.fillRect(-w/2,-e.radius*scale-42,w*clamp(e.hp/e.maxHp,0,1),6);ctx.fillStyle="#fff";ctx.font="800 10px system-ui";ctx.textAlign="center";ctx.fillText(e.name,0,-e.radius*scale-49);ctx.restore();}

  function drawProjectile(ctx,s,b){ctx.save();ctx.translate(sx(s,b.x),sy(s,b.y));ctx.fillStyle=b.color||"#fff";ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(0,0,b.radius,0,Math.PI*2);ctx.fill();ctx.restore();}
  function drawTraps(ctx,s,now){for(const t of s.traps){const x=sx(s,t.x),y=sy(s,t.y);ctx.save();ctx.translate(x,y);ctx.globalAlpha=t.armed?.7:.18;ctx.strokeStyle=t.armed?"#ff6b55":"#666";ctx.lineWidth=3;ctx.rotate(t.pulse*.6);ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2?t.radius*.45:t.radius;const px=Math.cos(a)*r,py=Math.sin(a)*r;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.closePath();ctx.stroke();ctx.restore();}}
  function drawChests(ctx,s){for(const c of s.chests){const x=sx(s,c.x),y=sy(s,c.y);ctx.save();ctx.translate(x,y);ctx.fillStyle=c.opened?"#392f22":"#d99e38";ctx.strokeStyle="#ffe191";ctx.lineWidth=3;ctx.fillRect(-25,-18,50,36);ctx.strokeRect(-25,-18,50,36);ctx.fillStyle="#fff2a5";ctx.fillRect(-5,-18,10,36);ctx.restore();}}
  function drawTelegraph(ctx,s,t){ctx.save();ctx.translate(sx(s,t.x),sy(s,t.y));ctx.fillStyle="#ff405522";ctx.strokeStyle="#ff5367";ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,t.radius,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}
  function drawEffect(ctx,s,e){ctx.save();ctx.translate(sx(s,e.x),sy(s,e.y));ctx.globalAlpha=clamp(e.life,0,1);ctx.strokeStyle=e.color;ctx.fillStyle=`${e.color}22`;ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,e.radius*(1+(1-e.life)*.25),0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}
  function drawZone(ctx,s,z,now){const alpha=clamp(z.life/Math.max(1,z.maxLife||7),0,1),pulse=.82+.12*Math.sin(now*.008);ctx.save();ctx.translate(sx(s,z.x),sy(s,z.y));ctx.globalAlpha=.28+.45*alpha;ctx.fillStyle=`${z.color}24`;ctx.strokeStyle=z.color;ctx.shadowColor=z.color;ctx.shadowBlur=18;ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,z.radius*pulse,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.globalAlpha=.75*alpha;for(let i=0;i<8;i++){const a=now*.0015+i*Math.PI/4,r=z.radius*.68;ctx.beginPath();ctx.arc(Math.cos(a)*r,Math.sin(a)*r,3,0,Math.PI*2);ctx.fillStyle=z.color;ctx.fill();}ctx.restore();}
  function drawText(ctx,s,t){ctx.save();ctx.translate(sx(s,t.x),sy(s,t.y));ctx.globalAlpha=clamp(t.life/.8,0,1);ctx.fillStyle=t.color;ctx.font="900 18px system-ui";ctx.textAlign="center";ctx.shadowColor="#000";ctx.shadowBlur=5;ctx.fillText(t.text,0,0);ctx.restore();}
  function drawCenterMessage(ctx,text){ctx.save();ctx.fillStyle="#061014dd";ctx.strokeStyle="#6fffd0aa";ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(CANVAS_W/2-250,70,500,64,18);ctx.fill();ctx.stroke();ctx.fillStyle="#fff";ctx.font="900 21px system-ui";ctx.textAlign="center";ctx.fillText(text,CANVAS_W/2,110);ctx.restore();}
  function drawPortal(ctx,s,now){const portal=s.layout?.exit||{x:WORLD_W/2,y:110},x=sx(s,portal.x),y=sy(s,portal.y),pulse=.7+.3*Math.sin(now*.006);ctx.save();ctx.translate(x,y);ctx.strokeStyle="#75f5ff";ctx.shadowColor="#75f5ff";ctx.shadowBlur=24;ctx.lineWidth=8;ctx.beginPath();ctx.ellipse(0,0,34+pulse*6,57+pulse*8,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle="#885dff44";ctx.fill();ctx.restore();}
  function updateDungeonHud(){const s=UI.session;if(!s||!UI.main)return;const hpPct=clamp(s.player.hp/Math.max(1,s.player.maxHp)*100,0,100),hp=UI.main.querySelector("[data-dkl-hp]");if(hp)hp.style.width=`${hpPct}%`;const hpt=UI.main.querySelector("[data-dkl-hp-text]");if(hpt)hpt.textContent=`${Math.round(hpPct)} % · ${NUMBER.format(Math.max(0,s.player.hp))}/${NUMBER.format(s.player.maxHp)}`;const room=UI.main.querySelector("[data-dkl-room]");if(room)room.textContent=`Raum ${s.room}/${s.dungeon.rooms}`;const obj=UI.main.querySelector("[data-dkl-objective]");if(obj)obj.textContent=s.completed?"Dungeon abgeschlossen · Ausgang offen":s.roomExitOpen?"Tor offen · zum Ausgang laufen":s.enemies.some(e=>!e.dead)?`${s.enemies.filter(e=>!e.dead).length} Gegner verbleiben`:"Raum gesäubert";const attack=UI.main.querySelector("[data-dkl-attack]");if(attack){attack.classList.toggle("active",s.autoAttack);attack.querySelector("small").textContent=s.autoAttack?"Auto-Kampf aktiv":"Auto-Kampf aus";}for(let i=0;i<5;i++){const remain=s.skillCooldowns[i]||0,total=Math.max(.01,s.cooldownTotals?.[i]||SKILL_BASE_COOLDOWNS[i]),progress=clamp(1-remain/total,0,1),button=UI.main.querySelector(`[data-dkl-skill="${i}"]`),cd=UI.main.querySelector(`[data-dkl-cd="${i}"]`),fill=UI.main.querySelector(`[data-dkl-fill="${i}"]`);if(cd)cd.textContent=remain>0?`${remain.toFixed(1)} s`:"Bereit";if(button)button.classList.toggle("ready",remain<=0);if(fill)fill.style.transform=`scaleX(${progress})`;}const team=UI.main.querySelector("[data-dkl-team]");if(team)team.innerHTML=s.players.map(p=>`<div role="button" tabindex="0" data-dkl-target-player="${esc(p.uid)}" class="role-${p.role} ${p.local?"me":""} ${s.selectedTargetUid===p.uid?"selected":""}"><b>${esc(p.name)}</b><span>PWR ${formatPower(p.power)}</span><em>${p.dead?"K.O.":`${Math.round(p.hp/Math.max(1,p.maxHp)*100)} %`}</em></div>`).join("");const enemy=s.enemies.find(e=>e.id===s.selectedEnemyId&&!e.dead),ally=s.players.find(p=>p.uid===s.selectedTargetUid),targetHud=UI.main.querySelector("[data-dkl-target-hud]");if(targetHud){const target=enemy||ally||s.player;targetHud.classList.toggle("enemy",!!enemy);targetHud.querySelector("span").textContent=enemy?"✦":"◎";targetHud.querySelector("b").textContent=target?.name||"Kein Ziel";}const bossHud=UI.main.querySelector("[data-dkl-boss]"),boss=s.enemies.find(e=>e.boss&&!e.dead);if(bossHud){bossHud.hidden=!boss;if(boss){bossHud.querySelector("b").textContent=boss.name;bossHud.querySelector("i").style.width=`${clamp(boss.hp/boss.maxHp*100,0,100)}%`;bossHud.querySelector("small").textContent=`${NUMBER.format(Math.max(0,Math.round(boss.hp)))} / ${NUMBER.format(boss.maxHp)}`;}}}
  function formatTime(ms){const total=Math.floor(ms/1000),m=Math.floor(total/60),s=total%60;return `${m}:${String(s).padStart(2,"0")}`;}
  function finishDungeonExit(){const s=UI.session;if(!s)return;if(!s.completed)return;endDungeon(true,"Dungeon abgeschlossen.");}
  function endDungeon(success,reason){const s=UI.session;if(!s)return;const d=ensureState(),elapsed=Date.now()-s.startedAt;if(success){const current=d.bestDungeon[s.dungeon.id];if(!current||elapsed<current.time)d.bestDungeon[s.dungeon.id]={time:elapsed,partySize:s.partySize,at:Date.now()};d.completed[s.dungeon.id]=(d.completed[s.dungeon.id]||0)+1;d.gold+=Math.round((500+s.dungeon.level*90)*Math.max(.7,1+(s.partySize-2)*.18));addXp(Math.round((800+s.dungeon.level*160)*Math.max(.7,1+(s.partySize-2)*.18)));}safeSave();stopSession(false);UI.view="result";const online=!!s.online;UI.main.innerHTML=`<div class="dkl-result ${success?"success":"fail"}"><span>${success?"🏆":"☠"}</span><small>${esc(s.dungeon.name)}</small><h2>${success?"Dungeon abgeschlossen":"Gruppe besiegt"}</h2><p>${esc(reason)}</p><div><b>Zeit ${formatTime(elapsed)}</b><b>Räume ${s.room}/${s.dungeon.rooms}</b><b>Gruppe ${s.partySize}</b></div><button class="dkl-btn primary" data-dkl-result-home>${online?"Zur Gruppenlobby":"Zur Hauptlobby"}</button></div>`;UI.main.querySelector("[data-dkl-result-home]").addEventListener("click",()=>returnAfterDungeon(s));}
  async function returnAfterDungeon(session){
    if(!session.online){renderHome();return;}
    UI.view="partyReturn";const party=UI.party;
    if(!party){renderHome();return;}
    if(party.host){try{await party.fb.updateDoc(party.ref,{status:"lobby",updatedAtMs:Date.now()});}catch(error){toast("Gruppenlobby nicht erreichbar",error.message||String(error));}}
    renderPartyLobby();
  }
  function stopSession(render=false){if(UI.raf)cancelAnimationFrame(UI.raf);UI.raf=0;UI.last=0;UI.session=null;if(render&&UI.overlay)renderHome();}
  function showExitDialog(){if(confirm("Dungeon wirklich verlassen? Der aktuelle Fortschritt geht verloren.")){stopSession(false);leaveParty(false);renderHome();}}
  function showTutorial(){const d=ensureState();const html=`<div class="dkl-tutorial"><div><button data-dkl-tutorial-close>×</button><small>WILLKOMMEN IN DUNGEON.KL</small><h2>Deine erste Expedition</h2><p>Wähle Tank, DD oder Heiler. Mit <b>WASD</b> bewegst du dich. Drücke <b>Angriff</b>, um den automatischen Kampf zu starten. Nach fünf Sekunden ohne sichtbaren Gegner stoppt er automatisch.</p><div><span><b>1–5</b><small>Fähigkeiten selbst auslösen</small></span><span><b>2–4 Spieler</b><small>Bessere Beute und mehr XP</small></span><span><b>3 Bosse</b><small>Pro Dungeon inklusive Endboss</small></span></div><button class="dkl-btn primary" data-dkl-tutorial-ok>Verstanden</button></div></div>`;UI.overlay.insertAdjacentHTML("beforeend",html);const close=()=>{UI.overlay.querySelector(".dkl-tutorial")?.remove();d.tutorialDone=true;safeSave();};UI.overlay.querySelector("[data-dkl-tutorial-close]").addEventListener("click",close);UI.overlay.querySelector("[data-dkl-tutorial-ok]").addEventListener("click",close);}
  function unlockAudio(){if(UI.audio)return;try{UI.audio=new (window.AudioContext||window.webkitAudioContext)();}catch{}}
  function playSound(type){const d=ensureState();if(!d.settings.sound||!UI.audio)return;try{const o=UI.audio.createOscillator(),g=UI.audio.createGain();o.connect(g);g.connect(UI.audio.destination);o.type=type==="skill"?"sine":"square";o.frequency.value=type==="skill"?420:180;g.gain.setValueAtTime(.035,UI.audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,UI.audio.currentTime+.12);o.start();o.stop(UI.audio.currentTime+.12);}catch{}}
  function onKeyDown(e){if(!UI.overlay)return;UI.keys[e.code]=true;if(UI.session){if(["Digit1","Digit2","Digit3","Digit4","Digit5"].includes(e.code)){e.preventDefault();useSkill(Number(e.code.slice(-1))-1);}if(e.code==="Space"){e.preventDefault();toggleAutoAttack();}if(e.code==="Escape"){e.preventDefault();showExitDialog();}}else if(e.code==="Escape"){e.preventDefault();returnToTopGames();}}
  function onKeyUp(e){UI.keys[e.code]=false;}
  function pointerDown(e){const s=UI.session;if(!s)return;const rect=s.canvas.getBoundingClientRect(),px=e.clientX-rect.left,py=e.clientY-rect.top;UI.pointer.down=true;UI.pointer.x=px;UI.pointer.y=py;const useStick=e.pointerType!=="mouse"&&px<rect.width*.42&&py>rect.height*.55;if(useStick){s.mobileOrigin={x:px,y:py};s.mobileMove={x:0,y:0};return;}const worldX=px/rect.width*CANVAS_W+s.camera.x-CANVAS_W/2,worldY=py/rect.height*CANVAS_H+s.camera.y-CANVAS_H/2;let bestPlayer=null,bestPlayerD=52;for(const p of s.players){const d=Math.hypot(p.x-worldX,p.y-worldY);if(d<bestPlayerD){bestPlayer=p;bestPlayerD=d;}}if(bestPlayer){selectPlayerTarget(bestPlayer.uid);return;}let bestEnemy=null,bestEnemyD=62;for(const enemy of s.enemies){if(enemy.dead)continue;const d=Math.hypot(enemy.x-worldX,enemy.y-worldY);if(d<bestEnemyD+enemy.radius){bestEnemy=enemy;bestEnemyD=d;}}if(bestEnemy)selectEnemyTarget(bestEnemy.id);}
  function pointerMove(e){const s=UI.session;if(!s||!UI.pointer.down||!s.mobileOrigin)return;const rect=s.canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top,dx=x-s.mobileOrigin.x,dy=y-s.mobileOrigin.y,len=Math.hypot(dx,dy)||1;s.mobileMove={x:clamp(dx/55,-1,1),y:clamp(dy/55,-1,1)};const knob=UI.main.querySelector("[data-dkl-stick] i");if(knob)knob.style.transform=`translate(${clamp(dx,-38,38)}px,${clamp(dy,-38,38)}px)`;}
  function pointerUp(){const s=UI.session;UI.pointer.down=false;if(s){s.mobileOrigin=null;s.mobileMove=null;}const knob=UI.main?.querySelector("[data-dkl-stick] i");if(knob)knob.style.transform="translate(0,0)";}

  window.DungeonKL = Object.freeze({ version: VERSION, open, close, returnToTopGames });
})();
