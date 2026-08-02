(() => {
  "use strict";

  const VERSION = "20260802-dungeon-kl-v152-first-realm";
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
    { id: "crypt", name: "Krypta der Asche", level: 1, rooms: 10, theme: "ember", color: "#ff8056", creatures: ["Aschekriecher", "Knochensoldat", "Glutkultist"], bosses: ["Torwächter Morak", "Aschenbestie", "König der leeren Gruft"] },
    { id: "grove", name: "Verdorbener Hain", level: 8, rooms: 11, theme: "forest", color: "#76dc78", creatures: ["Dornenwolf", "Pilzwächter", "Verwachsener Jäger"], bosses: ["Wurzelmutter", "Der faule Hirsch", "Herz des Hains"] },
    { id: "frost", name: "Frostzitadelle", level: 16, rooms: 12, theme: "ice", color: "#6edcff", creatures: ["Eissplitter", "Frostlegionär", "Schneeschamane"], bosses: ["Wächter Khar", "Weiße Hydra", "Königin Iskara"] },
    { id: "storm", name: "Sturmobservatorium", level: 25, rooms: 12, theme: "storm", color: "#8798ff", creatures: ["Sturmdrohne", "Blitzjäger", "Himmelswächter"], bosses: ["Leiter VII", "Donnerkoloss", "Astrax der Sturmseher"] },
    { id: "abyss", name: "Abgrund von Veyra", level: 35, rooms: 13, theme: "void", color: "#c76cff", creatures: ["Leerenmade", "Rissschütze", "Schattenritter"], bosses: ["Risshüter", "Namenloser Schlund", "Veyra die Unendliche"] },
    { id: "citadel", name: "Goldene Zitadelle", level: 45, rooms: 14, theme: "gold", color: "#ffd15b", creatures: ["Palastgolem", "Runenritter", "Sonnenmagus"], bosses: ["Der vergoldete General", "Sonnenlöwe", "Kaiser Aureon"] },
    { id: "chaos", name: "Chaoskathedrale", level: 58, rooms: 15, theme: "chaos", color: "#ff5fc9", creatures: ["Chaosbrut", "Flüsterhexe", "Spiegelkrieger"], bosses: ["Dreigesicht", "Kathedralenwyrm", "Chaos-Orakel"] },
    { id: "universe", name: "Universe-Nexus", level: 75, rooms: 16, theme: "universe", color: "#f3fbff", creatures: ["Sternenwächter", "Kosmosjäger", "Nexusarchitekt"], bosses: ["Planetenschmied", "Galaxienfresser", "Nexus-Primus"] }
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
    const session = UI.session = { dungeon, partySize, online: options.online || null, host: !options.online || options.hostUid === options.online.user.uid, player, players: [player], remotePlayers: new Map(), enemies: [], projectiles: [], effects: [], texts: [], traps: [], chests: [], room: 1, roomState: "combat", roomStartedAt: performance.now(), startedAt: Date.now(), clearAt: 0, exitOpen: false, completed: false, autoAttack: false, noTargetFor: 0, skillCooldowns: [0,0,0,0,0], camera: { x: WORLD_W / 2, y: WORLD_H / 2 }, viewW: CANVAS_W, viewH: CANVAS_H, lastLootSeq: 0, lootSeq: 0, worldSeq: 0, networkLastWrite: 0, networkLastWorld: 0, seed: options.seed || Math.floor(Math.random() * 99999999), profiles: options.profiles || {}, playerUids: options.playerUids || [player.uid], hostUid: options.hostUid || player.uid, boss: null, bossTelegraph: null, message: "", messageUntil: 0 };
    if (options.online) setupDungeonNetwork(options);
    buildRoom(session, 1); renderDungeonStage(); d.stats.runs++; safeSave(); loop(performance.now());
  }
  function makePlayer({ uid: id, name, role, classId, stats, local, x, y }) { const r = ROLES[role] || ROLES.dps, c = CLASSES[classId] || CLASSES.berserker; return { uid: id, name, role, classId, local, x, y, vx: 0, vy: 0, angle: -Math.PI / 2, radius: 20, maxHp: stats.health, hp: stats.health, damage: stats.damage, healing: stats.healing, armor: stats.armor, crit: stats.crit, haste: stats.haste, power: stats.power, range: c.range, attackRate: c.attackRate, projectile: c.projectile, attackCd: 0, skillSeq: 0, skillRequested: 0, dead: false, downedAt: 0, shield: 0, buffs: {}, color: c.color }; }
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
    UI.main.innerHTML = `<div class="dkl-stage"><canvas width="${CANVAS_W}" height="${CANVAS_H}" data-dkl-canvas></canvas><div class="dkl-dungeon-top"><div class="dkl-self-hud"><b>${esc(s.player.name)}</b><span>${ROLES[s.player.role].icon} ${esc(CLASSES[s.player.classId].name)}</span><div><i data-dkl-hp></i></div><small data-dkl-hp-text></small></div><div class="dkl-room-title"><small>${esc(s.dungeon.name)}</small><b data-dkl-room>Raum ${s.room}/${s.dungeon.rooms}</b><em data-dkl-objective>Gegner besiegen</em></div><div class="dkl-team-hud" data-dkl-team></div></div><div class="dkl-boss-hud" data-dkl-boss hidden><b></b><div><i></i></div><small></small></div><div class="dkl-combat-actions"><button data-dkl-attack class="attack"><span>⚔</span><b>ANGRIFF</b><small>Auto-Kampf aus</small></button>${CLASSES[s.player.classId].skills.map((skill, i) => `<button data-dkl-skill="${i}"><span>${i + 1}</span><b>${esc(skill[0])}</b><small data-dkl-cd="${i}">Bereit</small></button>`).join("")}</div><div class="dkl-mobile-stick" data-dkl-stick><i></i></div><button class="dkl-exit-button" data-dkl-exit hidden>Dungeon verlassen</button></div>`;
    const canvas = UI.main.querySelector("[data-dkl-canvas]"); s.canvas = canvas; s.ctx = canvas.getContext("2d"); resizeCanvas(); window.addEventListener("resize", resizeCanvas, { once: true });
    canvas.addEventListener("pointerdown", pointerDown); canvas.addEventListener("pointermove", pointerMove); canvas.addEventListener("pointerup", pointerUp); canvas.addEventListener("pointercancel", pointerUp);
    UI.main.querySelector("[data-dkl-attack]").addEventListener("click", toggleAutoAttack);
    UI.main.querySelectorAll("[data-dkl-skill]").forEach(btn => btn.addEventListener("click", () => useSkill(Number(btn.dataset.dklSkill))));
    UI.main.querySelector("[data-dkl-exit]").addEventListener("click", finishDungeonExit);
    updateDungeonHud();
  }
  function resizeCanvas() { const s = UI.session; if (!s?.canvas) return; const rect = s.canvas.getBoundingClientRect(); s.viewW = rect.width; s.viewH = rect.height; }
  function buildRoom(s, room) {
    s.room = room; s.enemies = []; s.projectiles = []; s.effects = []; s.traps = []; s.chests = []; s.boss = null; s.bossTelegraph = null; s.roomState = "combat"; s.clearAt = 0; s.exitOpen = false;
    const bossRoom = room === Math.ceil(s.dungeon.rooms / 3) || room === Math.ceil(s.dungeon.rooms * 2 / 3) || room === s.dungeon.rooms;
    const trapRoom = !bossRoom && room % 4 === 0; const chestRoom = !bossRoom && room % 5 === 0;
    if (trapRoom) for (let i = 0; i < 6 + Math.floor(room / 3); i++) s.traps.push({ x: rand(160, WORLD_W - 160), y: rand(150, WORLD_H - 150), radius: rand(30, 48), armed: true, pulse: rand(0, 6) });
    if (chestRoom) s.chests.push({ x: WORLD_W / 2, y: WORLD_H / 2, opened: false, radius: 30 });
    if (bossRoom) {
      const bossIndex = room === s.dungeon.rooms ? 2 : room < s.dungeon.rooms / 2 ? 0 : 1; spawnBoss(s, bossIndex, room === s.dungeon.rooms);
      const adds = 4 + Math.floor(room / 3); for (let i = 0; i < adds; i++) spawnEnemy(s, false);
    } else {
      const baseCount = 6 + Math.floor(room * 1.6) + (s.partySize - 1) * 4; for (let i = 0; i < baseCount; i++) spawnEnemy(s, Math.random() < .12 + room * .008);
    }
    showMessage(bossRoom ? `BOSSRAUM · ${s.boss.name}` : chestRoom ? "SCHATZKAMMER" : trapRoom ? "FALLENKAMMER" : `RAUM ${room}`, 2600); updateDungeonHud();
  }
  function enemyScale(s) { const lvl = Math.max(s.dungeon.level, ensureState().level * .82) + s.room * 1.7; return { level: lvl, hp: 1 + (s.partySize - 1) * .72, damage: 1 + (s.partySize - 1) * .2 }; }
  function spawnEnemy(s, elite = false) { const scale = enemyScale(s), angle = rand(0, Math.PI * 2), dist = rand(240, 520), x = clamp(WORLD_W / 2 + Math.cos(angle) * dist, 90, WORLD_W - 90), y = clamp(WORLD_H / 2 + Math.sin(angle) * dist, 90, WORLD_H - 90), ranged = Math.random() < .34; const hp = Math.round((85 + scale.level * 24) * scale.hp * (elite ? 2.4 : 1)); s.enemies.push({ id: uid(), name: pick(s.dungeon.creatures), x, y, radius: elite ? 28 : 20, maxHp: hp, hp, damage: Math.round((8 + scale.level * 2.1) * scale.damage * (elite ? 1.55 : 1)), armor: elite ? .18 : .04, speed: ranged ? 78 : 105, range: ranged ? 350 : 52, ranged, elite, boss: false, attackCd: rand(0, 1), specialCd: rand(1, 4), dead: false, color: elite ? "#ffcf55" : s.dungeon.color, targetUid: "" }); }
  function spawnBoss(s, index, finalBoss) { const scale = enemyScale(s), name = s.dungeon.bosses[index], hp = Math.round((1700 + scale.level * 330) * scale.hp * (finalBoss ? 1.7 : 1)); const boss = { id: uid(), name, x: WORLD_W / 2, y: 230, radius: finalBoss ? 58 : 48, maxHp: hp, hp, damage: Math.round((25 + scale.level * 4.4) * scale.damage * (finalBoss ? 1.35 : 1)), armor: finalBoss ? .34 : .24, speed: finalBoss ? 66 : 75, range: 75, ranged: false, elite: false, boss: true, finalBoss, attackCd: 1.5, specialCd: 3.2, dead: false, color: s.dungeon.color, targetUid: "", phase: 1 }; s.enemies.push(boss); s.boss = boss; }
  function loop(now) { const s = UI.session; if (!s) return; const dt = Math.min(.035, Math.max(.001, (now - (UI.last || now)) / 1000)); UI.last = now; updateSession(s, dt, now); drawSession(s, now); updateDungeonHud(); UI.raf = requestAnimationFrame(loop); }
  function updateSession(s, dt, now) {
    updateLocalInput(s, dt); if (s.online) updateNetwork(s, now);
    if (s.host) { updatePartyCombat(s, dt, now); updateEnemies(s, dt, now); updateProjectiles(s, dt); updateTraps(s, dt, now); checkRoomClear(s, now); }
    else updateGuestVisuals(s, dt);
    updateEffects(s, dt); s.camera.x += (s.player.x - s.camera.x) * Math.min(1, dt * 7); s.camera.y += (s.player.y - s.camera.y) * Math.min(1, dt * 7);
  }
  function updateLocalInput(s, dt) {
    const p = s.player; if (p.dead) return; let dx = 0, dy = 0; if (UI.keys.KeyW || UI.keys.ArrowUp) dy--; if (UI.keys.KeyS || UI.keys.ArrowDown) dy++; if (UI.keys.KeyA || UI.keys.ArrowLeft) dx--; if (UI.keys.KeyD || UI.keys.ArrowRight) dx++;
    if (s.mobileMove) { dx += s.mobileMove.x; dy += s.mobileMove.y; }
    const len = Math.hypot(dx, dy); if (len) { dx /= len; dy /= len; const speed = 205 * (1 + p.haste * .35); p.x = clamp(p.x + dx * speed * dt, 70, WORLD_W - 70); p.y = clamp(p.y + dy * speed * dt, 70, WORLD_H - 70); p.angle = Math.atan2(dy, dx); }
    p.attackCd = Math.max(0, p.attackCd - dt); s.skillCooldowns = s.skillCooldowns.map(v => Math.max(0, v - dt));
    if (s.autoAttack) { const target = nearestEnemy(s, p, p.range + 80); if (target) { s.noTargetFor = 0; autoAttackPlayer(s, p, target); } else { s.noTargetFor += dt; if (s.noTargetFor >= 5) { s.autoAttack = false; showMessage("Auto-Angriff beendet · keine Gegner sichtbar", 1800); } } }
  }
  function updatePartyCombat(s, dt) { for (const p of s.players) { if (p.local || p.dead) continue; p.attackCd = Math.max(0, p.attackCd - dt); const target = nearestEnemy(s, p, p.range + 80); if (p.wantAttack && target) autoAttackPlayer(s, p, target); if (p.skillRequested) { executeSkill(s, p, p.skillRequested - 1); p.skillRequested = 0; } } }
  function autoAttackPlayer(s, p, target) { if (p.attackCd > 0 || target.dead) return; p.attackCd = 1 / (p.attackRate * (1 + p.haste)); p.angle = Math.atan2(target.y - p.y, target.x - p.x); if (p.projectile) s.projectiles.push({ x: p.x, y: p.y, vx: Math.cos(p.angle) * 620, vy: Math.sin(p.angle) * 620, radius: 5, damage: rollDamage(p.damage, p.crit), ownerUid: p.uid, friendly: true, life: 1.4, color: p.color }); else damageEnemy(s, target, rollDamage(p.damage, p.crit), p); playSound("attack"); }
  function rollDamage(base, crit) { return Math.round(base * rand(.88, 1.12) * (Math.random() < crit ? 1.75 : 1)); }
  function nearestEnemy(s, p, max = Infinity) { let best = null, bestD = max; for (const e of s.enemies) { if (e.dead) continue; const d = distance(p, e); if (d < bestD) { bestD = d; best = e; } } return best; }
  function damageEnemy(s, enemy, amount, source) { if (!enemy || enemy.dead) return; const dealt = Math.max(1, Math.round(amount * (1 - enemy.armor))); enemy.hp -= dealt; s.texts.push({ x: enemy.x, y: enemy.y - enemy.radius, text: `-${dealt}`, color: source?.role === "healer" ? "#ffe47a" : "#fff", life: .8 }); if (enemy.hp <= 0) killEnemy(s, enemy, source); }
  function killEnemy(s, enemy) { enemy.dead = true; ensureState().stats.kills++; if (enemy.boss) { ensureState().stats.bosses++; rewardBoss(s, enemy); } }
  function updateEnemies(s, dt, now) {
    for (const e of s.enemies) { if (e.dead) continue; e.attackCd = Math.max(0, e.attackCd - dt); e.specialCd = Math.max(0, e.specialCd - dt); const target = chooseEnemyTarget(s, e); if (!target) continue; e.targetUid = target.uid; const dx = target.x - e.x, dy = target.y - e.y, dist = Math.hypot(dx, dy) || 1; e.angle = Math.atan2(dy, dx);
      const desired = e.ranged ? e.range * .78 : e.range; if (dist > desired) { e.x += dx / dist * e.speed * dt; e.y += dy / dist * e.speed * dt; }
      if (dist <= e.range && e.attackCd <= 0) { e.attackCd = e.boss ? 1.25 : e.ranged ? 1.55 : 1.05; if (e.ranged) s.projectiles.push({ x: e.x, y: e.y, vx: dx / dist * 420, vy: dy / dist * 420, radius: e.boss ? 10 : 6, damage: e.damage, ownerUid: e.id, friendly: false, life: 2.3, color: e.color }); else damagePlayer(s, target, e.damage, e); }
      if (e.boss && e.specialCd <= 0) { e.specialCd = rand(4.5, 7); bossSpecial(s, e, now); }
    }
  }
  function chooseEnemyTarget(s, enemy) { const alive = s.players.filter(p => !p.dead); if (!alive.length) return null; const tanks = alive.filter(p => p.role === "tank"); if (tanks.length && Math.random() < .84) return tanks.sort((a, b) => distance(enemy, a) - distance(enemy, b))[0]; return alive.sort((a, b) => distance(enemy, a) / (ROLES[a.role].aggro || 1) - distance(enemy, b) / (ROLES[b.role].aggro || 1))[0]; }
  function damagePlayer(s, p, amount, source) { if (!p || p.dead) return; let dealt = Math.max(1, Math.round(amount * (1 - p.armor))); if (p.buffs.fortress > 0) dealt = Math.round(dealt * .62); if (p.shield > 0) { const absorbed = Math.min(p.shield, dealt); p.shield -= absorbed; dealt -= absorbed; } p.hp -= dealt; s.texts.push({ x: p.x, y: p.y - 35, text: `-${dealt}`, color: "#ff647a", life: .8 }); if (p.hp <= 0) { p.hp = 0; p.dead = true; p.downedAt = Date.now(); if (p.local) ensureState().stats.deaths++; showMessage(`${p.name} ist gefallen`, 2200); } }
  function bossSpecial(s, boss) { const type = Math.floor(rand(0, 3)); if (type === 0) { s.bossTelegraph = { x: boss.x, y: boss.y, radius: boss.finalBoss ? 210 : 160, time: 1.25, damage: boss.damage * 1.7, type: "nova" }; showMessage(`${boss.name}: ZERSTÖRUNGSNOVA`, 1500); } else if (type === 1) { const t = chooseEnemyTarget(s, boss); if (t) s.bossTelegraph = { x: t.x, y: t.y, radius: 95, time: 1.1, damage: boss.damage * 2.1, type: "mark" }; } else { for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; s.projectiles.push({ x: boss.x, y: boss.y, vx: Math.cos(a) * 360, vy: Math.sin(a) * 360, radius: 9, damage: boss.damage * 1.25, ownerUid: boss.id, friendly: false, life: 3, color: boss.color }); } } }
  function updateProjectiles(s, dt) { for (const b of s.projectiles) { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; if (b.life <= 0) continue; if (b.friendly) { for (const e of s.enemies) { if (e.dead || distance(b, e) > b.radius + e.radius) continue; damageEnemy(s, e, b.damage, s.players.find(p => p.uid === b.ownerUid)); b.life = 0; break; } } else { for (const p of s.players) { if (p.dead || distance(b, p) > b.radius + p.radius) continue; damagePlayer(s, p, b.damage, null); b.life = 0; break; } } } s.projectiles = s.projectiles.filter(b => b.life > 0 && b.x > -50 && b.y > -50 && b.x < WORLD_W + 50 && b.y < WORLD_H + 50); }
  function updateTraps(s, dt, now) { for (const t of s.traps) { t.pulse += dt; if (!t.armed) continue; for (const p of s.players) { if (p.dead || distance(t, p) > t.radius + p.radius) continue; t.armed = false; damagePlayer(s, p, 22 + ensureState().level * 3.2, null); s.effects.push({ type: "trap", x: t.x, y: t.y, radius: t.radius, life: .7, color: "#ff5c67" }); } } if (s.bossTelegraph) { s.bossTelegraph.time -= dt; if (s.bossTelegraph.time <= 0) { for (const p of s.players) if (!p.dead && distance(p, s.bossTelegraph) <= s.bossTelegraph.radius + p.radius) damagePlayer(s, p, s.bossTelegraph.damage, s.boss); s.effects.push({ type: "blast", x: s.bossTelegraph.x, y: s.bossTelegraph.y, radius: s.bossTelegraph.radius, life: .75, color: "#ff4f66" }); s.bossTelegraph = null; } } }
  function updateEffects(s, dt) { for (const e of s.effects) e.life -= dt; for (const t of s.texts) { t.life -= dt; t.y -= 35 * dt; } s.effects = s.effects.filter(e => e.life > 0); s.texts = s.texts.filter(t => t.life > 0); for (const p of s.players) { for (const key of Object.keys(p.buffs)) p.buffs[key] = Math.max(0, p.buffs[key] - dt); } }
  function checkRoomClear(s, now) {
    if (s.players.every(p => p.dead)) return endDungeon(false, "Die Gruppe wurde besiegt.");
    if (s.enemies.some(e => !e.dead)) return;
    if (s.roomState === "combat") { s.roomState = "cleared"; s.clearAt = now; for (const chest of s.chests) chest.opened = true; rewardRoom(s); showMessage(s.room === s.dungeon.rooms ? "END-BOSS BESIEGT · AUSGANG GEÖFFNET" : "RAUM GESÄUBERT", 2600); }
    if (s.room === s.dungeon.rooms) { s.completed = true; s.exitOpen = true; UI.main?.querySelector("[data-dkl-exit]")?.removeAttribute("hidden"); return; }
    if (now - s.clearAt > 2800) buildRoom(s, s.room + 1);
  }
  function rewardRoom(s) { const d = ensureState(), multiplayer = s.partySize === 1 ? .7 : 1 + (s.partySize - 2) * .18, xp = Math.round((80 + s.dungeon.level * 24 + s.room * 20) * multiplayer); addXp(xp); d.gold += Math.round((35 + s.dungeon.level * 10 + s.room * 8) * multiplayer); if (s.room % 2 === 0 || s.chests.length) awardIndividualLoot(s, false); if (s.chests.length) d.stats.chests++; safeSave(); }
  function rewardBoss(s) { awardIndividualLoot(s, true); if (s.boss?.finalBoss) awardIndividualLoot(s, true); }
  function awardIndividualLoot(s, boss) {
    const d = ensureState(), bonus = s.partySize === 1 ? -12 : (s.partySize - 1) * 10 + (boss ? 20 : 0), rarity = rarityForLevel(Math.max(d.level, s.dungeon.level + s.room), bonus), level = clamp(Math.max(d.level, s.dungeon.level) + Math.floor(rand(-2, boss ? 6 : 3)), 1, MAX_LEVEL); const item = createItem(level, rarity, pick(SLOT_KEYS), d.classId); addItem(item, true); s.lootSeq++;
  }
  function useSkill(index) { const s = UI.session; if (!s || s.player.dead || s.skillCooldowns[index] > 0) return; executeSkill(s, s.player, index); if (s.online && !s.host) { s.player.skillSeq++; s.player.skillRequested = index + 1; } }
  function executeSkill(s, p, index) {
    const role = p.role, classId = p.classId; const cooldowns = [7, 11, 13, 16, 28]; if (p.local) s.skillCooldowns[index] = cooldowns[index] * (1 - p.haste * .35); const target = nearestEnemy(s, p, 700);
    if (role === "healer") {
      if (index === 0) healLowest(s, p, p.healing * 2.2); else if (index === 1) healLowest(s, p, p.healing * 1.45); else if (index === 2) s.players.forEach(x => x.buffs.fortress = Math.max(x.buffs.fortress || 0, 7)); else if (index === 3) s.players.forEach(x => healPlayer(s, x, p.healing * 1.35)); else { s.players.forEach(x => { if (x.dead) { x.dead = false; x.hp = Math.round(x.maxHp * .45); } else healPlayer(s, x, p.healing * 2); }); }
    } else if (role === "tank") {
      if (index === 0 && target) { damageEnemy(s, target, p.damage * 1.3, p); target.specialCd += 2; } else if (index === 1) p.buffs.fortress = 8; else if (index === 2) areaDamage(s, p.x, p.y, 155, p.damage * 1.2, p); else if (index === 3) s.players.forEach(x => x.shield += Math.round(p.maxHp * .18)); else { p.buffs.fortress = 11; areaDamage(s, p.x, p.y, 220, p.damage * 2.2, p); }
    } else {
      if (index === 0) classId === "ranger" ? multiShot(s, p, 3) : areaDamage(s, p.x, p.y, 145, p.damage * 1.25, p); else if (index === 1) { p.buffs.haste = 8; s.effects.push({ type: "aura", x: p.x, y: p.y, radius: 110, life: 8, color: p.color }); } else if (index === 2 && target) damageEnemy(s, target, p.damage * 2.4, p); else if (index === 3) areaDamage(s, target?.x || p.x, target?.y || p.y, 190, p.damage * 1.85, p); else areaDamage(s, target?.x || p.x, target?.y || p.y, 285, p.damage * 3.5, p);
    }
    s.effects.push({ type: "skill", x: target?.x || p.x, y: target?.y || p.y, radius: 90 + index * 25, life: .8, color: p.color }); playSound("skill");
  }
  function healLowest(s, source, amount) { const target = s.players.filter(x => !x.dead).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0] || source; healPlayer(s, target, amount); }
  function healPlayer(s, p, amount) { if (p.dead) return; const value = Math.max(1, Math.round(amount)); p.hp = Math.min(p.maxHp, p.hp + value); s.texts.push({ x: p.x, y: p.y - 35, text: `+${value}`, color: "#64f3a4", life: .9 }); }
  function areaDamage(s, x, y, radius, damage, source) { for (const e of s.enemies) if (!e.dead && Math.hypot(e.x - x, e.y - y) <= radius + e.radius) damageEnemy(s, e, damage, source); }
  function multiShot(s, p, count) { const target = nearestEnemy(s, p, 700); if (!target) return; const base = Math.atan2(target.y - p.y, target.x - p.x); for (let i = 0; i < count; i++) { const a = base + (i - (count - 1) / 2) * .13; s.projectiles.push({ x: p.x, y: p.y, vx: Math.cos(a) * 680, vy: Math.sin(a) * 680, radius: 5, damage: p.damage * 1.15, ownerUid: p.uid, friendly: true, life: 1.5, color: p.color }); } }
  function toggleAutoAttack() { const s = UI.session; if (!s) return; s.autoAttack = !s.autoAttack; s.noTargetFor = 0; updateDungeonHud(); }
  function showMessage(text, duration = 1800) { const s = UI.session; if (!s) return; s.message = text; s.messageUntil = performance.now() + duration; }

  function updateNetwork(s, now) {
    const p = s.online, fb = p.fb; if (now - s.networkLastWrite > 90) { s.networkLastWrite = now; fb.setDoc(s.selfRef, { uid: s.player.uid, name: s.player.name, x: s.player.x, y: s.player.y, angle: s.player.angle, hp: s.player.hp, maxHp: s.player.maxHp, dead: s.player.dead, wantAttack: s.autoAttack, skillSeq: s.player.skillSeq, skillRequested: s.player.skillRequested, role: s.player.role, classId: s.player.classId, power: s.player.power, updatedAtMs: Date.now() }, { merge: true }).catch(() => {}); s.player.skillRequested = 0; }
    if (s.host && now - s.networkLastWorld > 115) { s.networkLastWorld = now; const payload = worldSnapshot(s); fb.setDoc(s.worldRef, payload, { merge: false }).catch(() => {}); }
  }
  function applyRemoteInput(id, data) { const s = UI.session, p = s?.remotePlayers.get(id); if (!p) return; p.x += (Number(data.x || p.x) - p.x) * .55; p.y += (Number(data.y || p.y) - p.y) * .55; p.angle = Number(data.angle || p.angle); p.wantAttack = !!data.wantAttack; if (Number(data.skillSeq || 0) > Number(p.lastSkillSeq || 0)) { p.lastSkillSeq = Number(data.skillSeq); p.skillRequested = Number(data.skillRequested || 0); } }
  function worldSnapshot(s) { return { seq: ++s.worldSeq, room: s.room, roomState: s.roomState, completed: s.completed, exitOpen: s.exitOpen, message: s.message, messageUntil: s.messageUntil, enemies: s.enemies.filter(e => !e.dead).map(e => ({ id: e.id, name: e.name, x: Math.round(e.x), y: Math.round(e.y), hp: Math.max(0, Math.round(e.hp)), maxHp: Math.round(e.maxHp), radius: e.radius, boss: e.boss, elite: e.elite, finalBoss: e.finalBoss, color: e.color, angle: e.angle })), players: s.players.map(p => ({ uid: p.uid, x: Math.round(p.x), y: Math.round(p.y), hp: Math.max(0, Math.round(p.hp)), maxHp: p.maxHp, dead: p.dead, angle: p.angle, role: p.role, classId: p.classId, name: p.name, power: p.power })), projectiles: s.projectiles.slice(-80).map(b => ({ x: Math.round(b.x), y: Math.round(b.y), vx: b.vx, vy: b.vy, radius: b.radius, friendly: b.friendly, color: b.color })), lootSeq: s.lootSeq, updatedAtMs: Date.now(), version: VERSION }; }
  function applyWorldSnapshot(data) { const s = UI.session; if (!s || Number(data.seq || 0) <= Number(s.lastWorldSeq || 0)) return; s.lastWorldSeq = Number(data.seq); if (Number(data.room || 1) !== s.room) { s.room = Number(data.room); s.roomState = data.roomState; } s.completed = !!data.completed; s.exitOpen = !!data.exitOpen; s.enemies = (data.enemies || []).map(e => ({ ...e, dead: false, damage: 0, armor: 0, range: 0, speed: 0, attackCd: 0, specialCd: 0 })); s.projectiles = (data.projectiles || []).map(b => ({ ...b, life: .35 })); for (const raw of data.players || []) { const p = raw.uid === s.player.uid ? s.player : s.remotePlayers.get(raw.uid); if (!p) continue; if (p.local) { p.hp = raw.hp; p.dead = raw.dead; } else { p.x += (raw.x - p.x) * .5; p.y += (raw.y - p.y) * .5; p.hp = raw.hp; p.maxHp = raw.maxHp; p.dead = raw.dead; p.angle = raw.angle; } } if (Number(data.lootSeq || 0) > s.lastLootSeq) { const count = Number(data.lootSeq) - s.lastLootSeq; s.lastLootSeq = Number(data.lootSeq); for (let i = 0; i < count; i++) awardGuestLoot(s); } if (s.exitOpen) UI.main?.querySelector("[data-dkl-exit]")?.removeAttribute("hidden"); }
  function awardGuestLoot(s) { const d = ensureState(), rarity = rarityForLevel(Math.max(d.level, s.dungeon.level + s.room), (s.partySize - 1) * 10 + 10); addItem(createItem(Math.max(d.level, s.dungeon.level), rarity, pick(SLOT_KEYS), d.classId), true); }
  function updateGuestVisuals(s, dt) { for (const b of s.projectiles) { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; } s.projectiles = s.projectiles.filter(b => b.life > 0); }

  function drawSession(s, now) {
    const ctx = s.ctx; if (!ctx) return; ctx.clearRect(0, 0, CANVAS_W, CANVAS_H); drawDungeonGround(ctx, s); drawTraps(ctx, s, now); drawChests(ctx, s); if (s.bossTelegraph) drawTelegraph(ctx, s, s.bossTelegraph); for (const e of s.effects) drawEffect(ctx, s, e); for (const b of s.projectiles) drawProjectile(ctx, s, b); for (const e of s.enemies) if (!e.dead) drawEnemy(ctx, s, e, now); for (const p of s.players) drawPlayer(ctx, s, p, now); for (const t of s.texts) drawText(ctx, s, t); if (s.messageUntil > now) drawCenterMessage(ctx, s.message); if (s.exitOpen) drawPortal(ctx, s, now); }
  function sx(s, x) { return x - s.camera.x + CANVAS_W / 2; } function sy(s, y) { return y - s.camera.y + CANVAS_H / 2; }
  function themeColors(theme) { return { ember: ["#2d100d", "#6c2419", "#ff7855"], forest: ["#0b261a", "#174a32", "#65d98a"], ice: ["#0d2533", "#174b64", "#68d8ff"], storm: ["#171a3c", "#2f3973", "#899aff"], void: ["#160d28", "#3b1d62", "#bd68ff"], gold: ["#2f250c", "#6a521c", "#ffd35f"], chaos: ["#260d25", "#651c57", "#ff60d0"], universe: ["#081324", "#233b67", "#eafcff"] }[theme] || ["#101820", "#263541", "#66e2c0"]; }
  function drawDungeonGround(ctx, s) { const [a, b, c] = themeColors(s.dungeon.theme), g = ctx.createLinearGradient(0,0,0,CANVAS_H); g.addColorStop(0,a); g.addColorStop(1,b); ctx.fillStyle = g; ctx.fillRect(0,0,CANVAS_W,CANVAS_H); const tile = 64, ox = ((-s.camera.x + CANVAS_W/2)%tile+tile)%tile, oy = ((-s.camera.y+CANVAS_H/2)%tile+tile)%tile; ctx.strokeStyle = `${c}22`; ctx.lineWidth = 1; ctx.beginPath(); for(let x=ox;x<CANVAS_W;x+=tile){ctx.moveTo(x,0);ctx.lineTo(x,CANVAS_H)} for(let y=oy;y<CANVAS_H;y+=tile){ctx.moveTo(0,y);ctx.lineTo(CANVAS_W,y)} ctx.stroke(); ctx.strokeStyle=`${c}66`;ctx.lineWidth=5;ctx.strokeRect(sx(s,35),sy(s,35),WORLD_W-70,WORLD_H-70); for(let i=0;i<18;i++){const x=sx(s,100+(i*173)%1300),y=sy(s,100+(i*97)%700);ctx.fillStyle=`${c}12`;ctx.beginPath();ctx.arc(x,y,20+(i%4)*8,0,Math.PI*2);ctx.fill();} }
  function drawPlayer(ctx,s,p,now){const x=sx(s,p.x),y=sy(s,p.y),c=CLASSES[p.classId]||CLASSES.berserker,r=ROLES[p.role]||ROLES.dps,bob=Math.sin(now*.008+p.uid.length)*2;ctx.save();ctx.translate(x,y);ctx.globalAlpha=p.dead?.35:1;ctx.fillStyle="#0008";ctx.beginPath();ctx.ellipse(0,24,24,9,0,0,Math.PI*2);ctx.fill();ctx.rotate(p.angle+Math.PI/2);ctx.fillStyle=c.color;ctx.strokeStyle="#e9fbff";ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-15,-21-bob,30,42,10);ctx.fill();ctx.stroke();ctx.fillStyle="#d49b77";ctx.beginPath();ctx.arc(0,-29-bob,10,0,Math.PI*2);ctx.fill();if(p.role==="tank"){ctx.fillStyle="#4a6d82";ctx.strokeStyle="#8fe8ff";ctx.lineWidth=3;ctx.beginPath();ctx.arc(-21,-1,13,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle="#e7eff5";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(15,-16);ctx.lineTo(25,18);ctx.stroke();}else if(c.weaponType==="bow"){ctx.strokeStyle="#b7f277";ctx.lineWidth=3;ctx.beginPath();ctx.arc(18,0,18,-Math.PI/2,Math.PI/2);ctx.stroke();ctx.beginPath();ctx.moveTo(18,-18);ctx.lineTo(18,18);ctx.stroke();}else if(c.projectile){ctx.strokeStyle=c.color;ctx.shadowColor=c.color;ctx.shadowBlur=10;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(18,-18);ctx.lineTo(18,20);ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(18,-20,5,0,Math.PI*2);ctx.fill();}else{ctx.strokeStyle="#f3f7ff";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(15,-17);ctx.lineTo(26,18);ctx.stroke();}ctx.rotate(-p.angle-Math.PI/2);ctx.fillStyle="#fff";ctx.font="900 11px system-ui";ctx.textAlign="center";ctx.fillText(p.name,0,-51);ctx.fillStyle=r.color;ctx.font="800 10px system-ui";ctx.fillText(`${r.icon} ${Math.round(p.hp/Math.max(1,p.maxHp)*100)}%`,0,-39);ctx.restore();}
  function drawEnemy(ctx,s,e,now){const x=sx(s,e.x),y=sy(s,e.y),pulse=.5+.5*Math.sin(now*.006);ctx.save();ctx.translate(x,y);ctx.fillStyle="#0008";ctx.beginPath();ctx.ellipse(0,e.radius*.65,e.radius*.9,e.radius*.3,0,0,Math.PI*2);ctx.fill();ctx.shadowColor=e.color;ctx.shadowBlur=e.boss?20:8;ctx.fillStyle=e.color;ctx.strokeStyle=e.boss?"#fff":e.elite?"#ffd85d":"#151b20";ctx.lineWidth=e.boss?4:2;ctx.beginPath();if(e.boss){for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2?e.radius*.75:e.radius;const px=Math.cos(a)*r,py=Math.sin(a)*r;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.closePath();}else ctx.roundRect(-e.radius,-e.radius,e.radius*2,e.radius*2,7);ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle="#12131a";ctx.beginPath();ctx.arc(-e.radius*.3,-3,3,0,Math.PI*2);ctx.arc(e.radius*.3,-3,3,0,Math.PI*2);ctx.fill();if(e.boss){ctx.strokeStyle=`${e.color}`;ctx.globalAlpha=.45+pulse*.35;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,e.radius+9+pulse*5,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;const w=Math.max(42,e.radius*2);ctx.fillStyle="#19080b";ctx.fillRect(-w/2,-e.radius-18,w,6);ctx.fillStyle=e.boss?"#ff526f":"#7ce98d";ctx.fillRect(-w/2,-e.radius-18,w*clamp(e.hp/e.maxHp,0,1),6);ctx.fillStyle="#fff";ctx.font="800 10px system-ui";ctx.textAlign="center";ctx.fillText(e.name,0,-e.radius-24);ctx.restore();}
  function drawProjectile(ctx,s,b){ctx.save();ctx.translate(sx(s,b.x),sy(s,b.y));ctx.fillStyle=b.color||"#fff";ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(0,0,b.radius,0,Math.PI*2);ctx.fill();ctx.restore();}
  function drawTraps(ctx,s,now){for(const t of s.traps){const x=sx(s,t.x),y=sy(s,t.y);ctx.save();ctx.translate(x,y);ctx.globalAlpha=t.armed?.7:.18;ctx.strokeStyle=t.armed?"#ff6b55":"#666";ctx.lineWidth=3;ctx.rotate(t.pulse*.6);ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2?t.radius*.45:t.radius;const px=Math.cos(a)*r,py=Math.sin(a)*r;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.closePath();ctx.stroke();ctx.restore();}}
  function drawChests(ctx,s){for(const c of s.chests){const x=sx(s,c.x),y=sy(s,c.y);ctx.save();ctx.translate(x,y);ctx.fillStyle=c.opened?"#392f22":"#d99e38";ctx.strokeStyle="#ffe191";ctx.lineWidth=3;ctx.fillRect(-25,-18,50,36);ctx.strokeRect(-25,-18,50,36);ctx.fillStyle="#fff2a5";ctx.fillRect(-5,-18,10,36);ctx.restore();}}
  function drawTelegraph(ctx,s,t){ctx.save();ctx.translate(sx(s,t.x),sy(s,t.y));ctx.fillStyle="#ff405522";ctx.strokeStyle="#ff5367";ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,t.radius,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}
  function drawEffect(ctx,s,e){ctx.save();ctx.translate(sx(s,e.x),sy(s,e.y));ctx.globalAlpha=clamp(e.life,0,1);ctx.strokeStyle=e.color;ctx.fillStyle=`${e.color}22`;ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,e.radius*(1+(1-e.life)*.25),0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}
  function drawText(ctx,s,t){ctx.save();ctx.translate(sx(s,t.x),sy(s,t.y));ctx.globalAlpha=clamp(t.life/.8,0,1);ctx.fillStyle=t.color;ctx.font="900 18px system-ui";ctx.textAlign="center";ctx.shadowColor="#000";ctx.shadowBlur=5;ctx.fillText(t.text,0,0);ctx.restore();}
  function drawCenterMessage(ctx,text){ctx.save();ctx.fillStyle="#061014dd";ctx.strokeStyle="#6fffd0aa";ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(CANVAS_W/2-250,70,500,64,18);ctx.fill();ctx.stroke();ctx.fillStyle="#fff";ctx.font="900 21px system-ui";ctx.textAlign="center";ctx.fillText(text,CANVAS_W/2,110);ctx.restore();}
  function drawPortal(ctx,s,now){const x=sx(s,WORLD_W/2),y=sy(s,110),pulse=.7+.3*Math.sin(now*.006);ctx.save();ctx.translate(x,y);ctx.strokeStyle="#75f5ff";ctx.shadowColor="#75f5ff";ctx.shadowBlur=24;ctx.lineWidth=8;ctx.beginPath();ctx.ellipse(0,0,34+pulse*6,57+pulse*8,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle="#885dff44";ctx.fill();ctx.restore();}
  function updateDungeonHud(){const s=UI.session;if(!s||!UI.main)return;const hpPct=clamp(s.player.hp/Math.max(1,s.player.maxHp)*100,0,100);const hp=UI.main.querySelector("[data-dkl-hp]");if(hp)hp.style.width=`${hpPct}%`;const hpt=UI.main.querySelector("[data-dkl-hp-text]");if(hpt)hpt.textContent=`${Math.round(hpPct)} % · ${NUMBER.format(Math.max(0,s.player.hp))}/${NUMBER.format(s.player.maxHp)}`;const room=UI.main.querySelector("[data-dkl-room]");if(room)room.textContent=`Raum ${s.room}/${s.dungeon.rooms}`;const obj=UI.main.querySelector("[data-dkl-objective]");if(obj)obj.textContent=s.completed?"Dungeon abgeschlossen · Ausgang offen":s.enemies.some(e=>!e.dead)?`${s.enemies.filter(e=>!e.dead).length} Gegner verbleiben`:"Raum gesäubert";const attack=UI.main.querySelector("[data-dkl-attack]");if(attack){attack.classList.toggle("active",s.autoAttack);attack.querySelector("small").textContent=s.autoAttack?"Auto-Kampf aktiv":"Auto-Kampf aus";}for(let i=0;i<5;i++){const cd=UI.main.querySelector(`[data-dkl-cd="${i}"]`);if(cd)cd.textContent=s.skillCooldowns[i]>0?`${s.skillCooldowns[i].toFixed(1)} s`:"Bereit";}const team=UI.main.querySelector("[data-dkl-team]");if(team)team.innerHTML=s.players.map(p=>`<div class="role-${p.role} ${p.local?"me":""}"><b>${esc(p.name)}</b><span>PWR ${formatPower(p.power)}</span><em>${p.dead?"K.O.":`${Math.round(p.hp/Math.max(1,p.maxHp)*100)} %`}</em></div>`).join("");const bossHud=UI.main.querySelector("[data-dkl-boss]");const boss=s.enemies.find(e=>e.boss&&!e.dead);if(bossHud){bossHud.hidden=!boss;if(boss){bossHud.querySelector("b").textContent=boss.name;bossHud.querySelector("i").style.width=`${clamp(boss.hp/boss.maxHp*100,0,100)}%`;bossHud.querySelector("small").textContent=`${NUMBER.format(Math.max(0,Math.round(boss.hp)))} / ${NUMBER.format(boss.maxHp)}`;}}}
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
  function pointerDown(e){const s=UI.session;if(!s)return;const rect=s.canvas.getBoundingClientRect();UI.pointer.down=true;UI.pointer.x=e.clientX-rect.left;UI.pointer.y=e.clientY-rect.top;if(e.pointerType!=="mouse"&&UI.pointer.x<rect.width*.42&&UI.pointer.y>rect.height*.55){s.mobileOrigin={x:UI.pointer.x,y:UI.pointer.y};s.mobileMove={x:0,y:0};}}
  function pointerMove(e){const s=UI.session;if(!s||!UI.pointer.down||!s.mobileOrigin)return;const rect=s.canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top,dx=x-s.mobileOrigin.x,dy=y-s.mobileOrigin.y,len=Math.hypot(dx,dy)||1;s.mobileMove={x:clamp(dx/55,-1,1),y:clamp(dy/55,-1,1)};const knob=UI.main.querySelector("[data-dkl-stick] i");if(knob)knob.style.transform=`translate(${clamp(dx,-38,38)}px,${clamp(dy,-38,38)}px)`;}
  function pointerUp(){const s=UI.session;UI.pointer.down=false;if(s){s.mobileOrigin=null;s.mobileMove=null;}const knob=UI.main?.querySelector("[data-dkl-stick] i");if(knob)knob.style.transform="translate(0,0)";}

  window.DungeonKL = Object.freeze({ version: VERSION, open, close, returnToTopGames });
})();
