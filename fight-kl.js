(() => {
  "use strict";

  const VERSION = "20260801-fight-kl-v114";
  const MAX_LEVEL = 100;
  const MAX_STAR = 5;
  const INVENTORY_LIMIT = 180;
  const CANVAS_W = 1280;
  const CANVAS_H = 720;
  const WORLD_W = 2200;
  const WORLD_H = 1400;
  const SCORE_FUNCTION = "fightKlSubmitScore";
  const LEADERBOARD_FUNCTION = "fightKlGetLeaderboard";
  const EURO = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const NUMBER = new Intl.NumberFormat("de-DE");

  const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary", "special", "mythic", "exotic"];
  const RARITIES = {
    common: { name: "Gewöhnlich", color: "#9aa6ad", glow: "#9aa6ad55", mult: 1, price: 280, drop: 54, minLevel: 1 },
    uncommon: { name: "Ungewöhnlich", color: "#52da79", glow: "#52da7966", mult: 1.2, price: 950, drop: 25, minLevel: 1 },
    rare: { name: "Selten", color: "#4ca8ff", glow: "#4ca8ff77", mult: 1.5, price: 4200, drop: 12, minLevel: 1 },
    epic: { name: "Episch", color: "#b76cff", glow: "#b76cff88", mult: 1.9, price: 16500, drop: 5.5, minLevel: 1 },
    legendary: { name: "Legendär", color: "#ffb52e", glow: "#ff9f2888", mult: 2.42, price: 52000, drop: 2.5, minLevel: 1 },
    special: { name: "Special", color: "#ff4e78", glow: "#ff4e7899", mult: 3.05, price: 82000, drop: .85, minLevel: 1 },
    mythic: { name: "Mystisch", color: "#ffd36a", glow: "#ff4bbaaa", mult: 3.82, price: 172000, drop: .18, minLevel: 10, gradient: "linear-gradient(135deg,#ff335f,#4a8cff,#ffd35c,#ff335f)" },
    exotic: { name: "Exotisch", color: "#63f8ff", glow: "#63f8ffbb", mult: 4.75, price: 345000, drop: .04, minLevel: 15, gradient: "linear-gradient(135deg,#5fffff,#ffd35a,#ff4fd8,#5fffff)" }
  };

  const STAR_MULT = [1, 1.34, 1.78, 2.35, 3.05, 4.0];
  const SPEED_BONUS = [8, 18, 38, 80, 130, 200];
  const SPECIALS = {
    chain: { name: "Blitz-Kette", icon: "⚡", color: "#62d9ff", text: "Springt auf mehrere nahe Gegner über." },
    explosion: { name: "Explosionsstoß", icon: "💥", color: "#ff9a42", text: "Verursacht Flächenschaden im Zielbereich." },
    stasis: { name: "Stasis-Feld", icon: "❄️", color: "#8f9bff", text: "Friert Gegner kurz ein und verursacht Schaden." },
    emp: { name: "EMP-Impuls", icon: "🧲", color: "#55f0d0", text: "Legt Schützen, Drohnen und Panzer kurz lahm." },
    pierce: { name: "Durchbruch-Schuss", icon: "☄️", color: "#ff5de5", text: "Ein mächtiges Projektil durchschlägt die gesamte Linie." }
  };

  const ITEMS = [
    { id: "service-pistol", name: "Dienstpistole", icon: "🔫", category: "weapon", family: "pistol", rarity: "common", attack: "gun", damage: 24, fireRate: 2.3, magazine: 7, reload: 1.25, range: 620, durability: 900, price: 420, text: "Zuverlässige Pistole mit sieben Schuss." },
    { id: "compact-pistol", name: "Kompaktpistole", icon: "🔫", category: "weapon", family: "pistol", rarity: "common", attack: "gun", damage: 20, fireRate: 3.2, magazine: 10, reload: 1.1, range: 560, durability: 860, price: 560, text: "Leicht, schnell und ideal als Basiswaffe." },
    { id: "heavy-revolver", name: "Schwerer Revolver", icon: "🔫", category: "weapon", family: "pistol", rarity: "uncommon", attack: "gun", damage: 55, fireRate: 1.18, magazine: 6, reload: 1.7, range: 690, durability: 850, price: 1550, text: "Langsam, aber mit hohem Einzelschaden." },
    { id: "burst-pistol", name: "Burst-Pistole", icon: "🔫", category: "weapon", family: "pistol", rarity: "rare", attack: "gun", damage: 24, fireRate: 6.4, magazine: 18, reload: 1.45, range: 680, spread: .035, durability: 1060, price: 5400, text: "Schnelle Feuerstöße mit guter Kontrolle." },
    { id: "arc-pistol", name: "Arc-Pistole", icon: "⚡", category: "weapon", family: "pistol", rarity: "epic", attack: "gun", damage: 66, fireRate: 2.8, magazine: 12, reload: 1.35, range: 760, durability: 1200, special: "chain", price: 18400, text: "Lädt eine Blitz-Kette für mehrere Gegner." },
    { id: "rail-pistol", name: "Rail-Pistole", icon: "☄️", category: "weapon", family: "pistol", rarity: "legendary", attack: "gun", damage: 122, fireRate: 1.75, magazine: 9, reload: 1.4, range: 900, durability: 1100, pierce: 2, special: "pierce", price: 57500, text: "Durchschlägt Ziele und lädt einen Durchbruch-Schuss." },

    { id: "uzi", name: "UZI Kompakt", icon: "🔫", category: "weapon", family: "automatic", rarity: "common", attack: "gun", damage: 12, fireRate: 10.5, magazine: 28, reload: 1.7, range: 500, spread: .08, durability: 1100, price: 820, text: "Sehr hohe Schussrate auf kurze Distanz." },
    { id: "machine-pistol", name: "Maschinenpistole", icon: "🔫", category: "weapon", family: "automatic", rarity: "uncommon", attack: "gun", damage: 16, fireRate: 9.4, magazine: 32, reload: 1.55, range: 560, spread: .062, durability: 1200, price: 1850, text: "Solide Automatikwaffe für frühe Wellen." },
    { id: "tactical-smg", name: "Taktische SMG", icon: "🔫", category: "weapon", family: "automatic", rarity: "rare", attack: "gun", damage: 22, fireRate: 12.2, magazine: 42, reload: 1.45, range: 620, spread: .045, durability: 1450, price: 7200, text: "Schnelle Maschinenpistole mit großem Magazin." },
    { id: "assault-rifle", name: "Sturmgewehr", icon: "🎯", category: "weapon", family: "automatic", rarity: "rare", attack: "gun", damage: 32, fireRate: 6.8, magazine: 30, reload: 1.85, range: 840, spread: .032, durability: 1380, price: 7900, text: "Ausgewogene Distanzwaffe für lange Wellen." },
    { id: "precision-rifle", name: "Präzisionsgewehr", icon: "🎯", category: "weapon", family: "automatic", rarity: "epic", attack: "gun", damage: 82, fireRate: 2.4, magazine: 14, reload: 1.75, range: 1080, spread: .008, durability: 1320, pierce: 1, special: "pierce", price: 22500, text: "Hohe Präzision und starker Durchbruch-Schuss." },
    { id: "light-machinegun", name: "Leichtes Maschinengewehr", icon: "🔫", category: "weapon", family: "automatic", rarity: "legendary", attack: "gun", damage: 39, fireRate: 11.3, magazine: 85, reload: 2.6, range: 790, spread: .05, durability: 2300, price: 61000, text: "Großes Magazin für massive Gegnergruppen." },
    { id: "plasma-carbine", name: "Plasma-Karabiner", icon: "☄️", category: "weapon", family: "automatic", rarity: "special", attack: "gun", damage: 52, fireRate: 8.8, magazine: 44, reload: 1.25, range: 930, spread: .018, durability: 1950, splash: 34, special: "explosion", price: 88000, text: "Plasmaeinschläge und aufladbarer Explosionsstoß." },
    { id: "ion-rifle", name: "Ionen-Gewehr", icon: "⚡", category: "weapon", family: "automatic", rarity: "mythic", minLevel: 10, attack: "gun", damage: 78, fireRate: 9.6, magazine: 54, reload: 1.15, range: 980, spread: .012, durability: 2450, pierce: 1, special: "emp", price: 178000, text: "Mystische Waffe mit EMP-Impuls gegen Technikgegner." },
    { id: "void-rifle", name: "Leeren-Gewehr", icon: "🌌", category: "weapon", family: "automatic", rarity: "exotic", minLevel: 15, attack: "gun", damage: 112, fireRate: 10.4, magazine: 64, reload: 1.05, range: 1080, spread: .008, durability: 3100, pierce: 2, splash: 42, special: "stasis", price: 365000, text: "Exotische Waffe mit Stasis-Feld und hoher Durchschlagskraft." },

    { id: "pump-shotgun", name: "Pumpgun", icon: "💥", category: "weapon", family: "shotgun", rarity: "common", attack: "shotgun", damage: 18, pellets: 7, fireRate: 1.05, magazine: 6, reload: 2.05, range: 460, spread: .24, durability: 980, price: 760, text: "Sieben Projektile pro Schuss." },
    { id: "double-shotgun", name: "Doppellauf-Schrotflinte", icon: "💥", category: "weapon", family: "shotgun", rarity: "uncommon", attack: "shotgun", damage: 32, pellets: 9, fireRate: .78, magazine: 2, reload: 1.8, range: 430, spread: .28, durability: 920, price: 1900, text: "Extrem starker Nahbereichsschaden." },
    { id: "combat-shotgun", name: "Kampf-Schrotflinte", icon: "💥", category: "weapon", family: "shotgun", rarity: "rare", attack: "shotgun", damage: 24, pellets: 9, fireRate: 2.0, magazine: 10, reload: 2.15, range: 520, spread: .2, durability: 1350, price: 6900, text: "Schnelle halbautomatische Schrotflinte." },
    { id: "drum-shotgun", name: "Trommel-Schrotflinte", icon: "💥", category: "weapon", family: "shotgun", rarity: "epic", attack: "shotgun", damage: 27, pellets: 10, fireRate: 2.7, magazine: 18, reload: 2.45, range: 550, spread: .19, durability: 1750, price: 23800, text: "Große Trommel für dichte Gegnerwellen." },
    { id: "thunder-shotgun", name: "Donnerkanone", icon: "🌩️", category: "weapon", family: "shotgun", rarity: "legendary", attack: "shotgun", damage: 38, pellets: 11, fireRate: 1.65, magazine: 8, reload: 1.9, range: 600, spread: .17, durability: 1800, splash: 55, special: "explosion", price: 64000, text: "Legendäre Schrotflinte mit Explosionsstoß." },
    { id: "singularity-shotgun", name: "Singularitäts-Schrotflinte", icon: "🌀", category: "weapon", family: "shotgun", rarity: "exotic", minLevel: 15, attack: "shotgun", damage: 58, pellets: 12, fireRate: 2.15, magazine: 12, reload: 1.55, range: 680, spread: .14, durability: 2800, splash: 75, special: "stasis", price: 382000, text: "Exotische Schrotflinte mit großem Stasis-Feld." },

    { id: "baseball-bat", name: "Baseballschläger", icon: "🏏", category: "weapon", family: "melee", rarity: "common", attack: "melee", damage: 48, fireRate: 1.45, range: 88, arc: 1.8, durability: 1250, price: 330, text: "Einfach, stabil und im Nahkampf wirksam." },
    { id: "metal-bat", name: "Metall-Baseballschläger", icon: "🏏", category: "weapon", family: "melee", rarity: "uncommon", attack: "melee", damage: 66, fireRate: 1.55, range: 94, arc: 1.9, durability: 1750, price: 1250, text: "Schwerer Schläger mit hoher Haltbarkeit." },
    { id: "crowbar", name: "Brecheisen", icon: "🛠️", category: "weapon", family: "melee", rarity: "common", attack: "melee", damage: 58, fireRate: 1.35, range: 92, arc: 1.65, durability: 1600, price: 520, text: "Hohe Haltbarkeit und zuverlässiger Schaden." },
    { id: "machete", name: "Machete", icon: "🗡️", category: "weapon", family: "melee", rarity: "uncommon", attack: "melee", damage: 82, fireRate: 1.75, range: 105, arc: 1.9, durability: 1200, price: 1650, text: "Schnelle Klinge mit weitem Schwung." },
    { id: "katana", name: "Katana", icon: "⚔️", category: "weapon", family: "melee", rarity: "rare", attack: "melee", damage: 118, fireRate: 2.05, range: 122, arc: 2.15, durability: 1450, dash: 24, price: 6500, text: "Schnelle Klinge mit kurzem Angriffssprint." },
    { id: "chain-blade", name: "Kettenklinge", icon: "⛓️", category: "weapon", family: "melee", rarity: "epic", attack: "melee", damage: 154, fireRate: 2.35, range: 132, arc: 2.4, durability: 1750, lifesteal: 2, price: 22500, text: "Breiter Schwung und geringer Lebensraub." },
    { id: "shock-hammer", name: "Schockhammer", icon: "🔨", category: "weapon", family: "melee", rarity: "legendary", attack: "melee", damage: 215, fireRate: .95, range: 140, arc: 2.55, durability: 2150, splash: 115, special: "emp", price: 68000, text: "Schwerer Flächenschaden und EMP-Impuls." },
    { id: "energy-blade", name: "Energieklinge", icon: "🌌", category: "weapon", family: "melee", rarity: "special", attack: "melee", damage: 248, fireRate: 2.45, range: 148, arc: 2.5, durability: 2400, lifesteal: 6, special: "chain", price: 92000, text: "Special-Klinge mit Lebensraub und Blitz-Kette." },
    { id: "chrono-blade", name: "Chronoklinge", icon: "⏳", category: "weapon", family: "melee", rarity: "mythic", minLevel: 10, attack: "melee", damage: 315, fireRate: 2.65, range: 155, arc: 2.65, durability: 2850, lifesteal: 7, dash: 38, special: "stasis", price: 182000, text: "Mystische Klinge, die Gegner kurz festsetzt." },
    { id: "nova-katana", name: "Nova-Katana", icon: "🌠", category: "weapon", family: "melee", rarity: "exotic", minLevel: 15, attack: "melee", damage: 410, fireRate: 2.9, range: 168, arc: 2.8, durability: 3500, lifesteal: 9, dash: 52, splash: 135, special: "explosion", price: 398000, text: "Exotisches Katana mit Nova-Explosion." },

    { id: "street-vest", name: "Street-Weste", icon: "🦺", category: "armor", rarity: "common", armor: 9, health: 18, durability: 1200, price: 360, text: "Leichter Grundschutz." },
    { id: "kevlar-vest", name: "Kevlar-Weste", icon: "🦺", category: "armor", rarity: "uncommon", armor: 15, health: 34, durability: 1500, price: 1450, text: "Solider Schutz für frühe Wellen." },
    { id: "tactical-vest", name: "Taktische Weste", icon: "🦺", category: "armor", rarity: "rare", armor: 23, health: 58, durability: 1900, price: 5700, text: "Guter Schutz für lange Wellen." },
    { id: "plate-carrier", name: "Plattenträger", icon: "🛡️", category: "armor", rarity: "epic", armor: 32, health: 90, durability: 2350, price: 20500, text: "Starke Panzerung ohne große Tempobremse." },
    { id: "juggernaut-plate", name: "Juggernaut-Rüstung", icon: "🛡️", category: "armor", rarity: "legendary", armor: 40, health: 130, speedPenalty: .07, durability: 2850, price: 62000, text: "Sehr hoher Schutz, aber etwas langsamer." },
    { id: "nano-armor", name: "Nano-Rüstung", icon: "🛡️", category: "armor", rarity: "special", armor: 48, health: 190, regen: 1.5, durability: 3450, price: 94000, text: "Regeneriert langsam Leben im Kampf." },
    { id: "aegis-armor", name: "Aegis-Rüstung", icon: "🔱", category: "armor", rarity: "mythic", minLevel: 10, armor: 55, health: 250, shield: 120, regen: 2.1, durability: 4100, price: 174000, text: "Mystische Rüstung mit Schild und Regeneration." },
    { id: "prism-armor", name: "Prisma-Rüstung", icon: "💠", category: "armor", rarity: "exotic", minLevel: 15, armor: 62, health: 340, shield: 210, regen: 3.0, dodge: 5, durability: 5200, price: 356000, text: "Exotische Rüstung mit maximalem Schutz." },

    { id: "runner-boots", name: "Runner-Schuhe", icon: "👟", category: "boots", rarity: "common", speed: 8, price: 320, text: "Erhöht deine Bewegungsgeschwindigkeit." },
    { id: "sprint-shoes", name: "Sprint-Schuhe", icon: "👟", category: "boots", rarity: "uncommon", speed: 12, price: 1250, text: "Leichte Schuhe mit spürbarem Tempo." },
    { id: "combat-boots", name: "Kampfstiefel", icon: "🥾", category: "boots", rarity: "rare", speed: 15, dodge: 4, price: 4700, text: "Tempo und kleine Ausweichchance." },
    { id: "shock-boots", name: "Schock-Stiefel", icon: "⚡", category: "boots", rarity: "epic", speed: 19, dodge: 7, price: 18800, text: "Schnelle Richtungswechsel und bessere Ausweichchance." },
    { id: "phase-boots", name: "Phasen-Schuhe", icon: "✨", category: "boots", rarity: "legendary", speed: 25, dodge: 11, price: 59000, text: "Legendäres Tempo mit hoher Ausweichchance." },
    { id: "overdrive-boots", name: "Overdrive-Schuhe", icon: "💨", category: "boots", rarity: "special", speed: 34, dodge: 14, price: 86000, text: "Special-Schuhe für sehr hohes Lauftempo." },
    { id: "chrono-boots", name: "Chrono-Schuhe", icon: "⏱️", category: "boots", rarity: "mythic", minLevel: 10, speed: 43, dodge: 18, regen: .6, price: 169000, text: "Mystische Schuhe mit extremem Tempo." },
    { id: "quantum-boots", name: "Quanten-Schuhe", icon: "🌈", category: "boots", rarity: "exotic", minLevel: 15, speed: 55, dodge: 24, regen: 1.0, price: 338000, text: "Exotische Schuhe mit maximaler Bewegung." },

    { id: "speed-chip", name: "Speed-Modul", icon: "💨", category: "chip", rarity: "common", speed: 8, price: 420, text: "Bis zu 200 % Tempo auf fünf Sternen." },
    { id: "damage-chip", name: "Damage-Modul", icon: "🔥", category: "chip", rarity: "uncommon", damagePct: 10, price: 1350, text: "Erhöht sämtlichen verursachten Schaden." },
    { id: "reload-chip", name: "Reload-Modul", icon: "🔄", category: "chip", rarity: "uncommon", reloadPct: 13, price: 1250, text: "Verkürzt Nachladezeiten." },
    { id: "crit-chip", name: "Krit-Modul", icon: "🎯", category: "chip", rarity: "rare", crit: 8, critDamage: 45, price: 5600, text: "Mehr kritische Treffer und Krit-Schaden." },
    { id: "tesla-chip", name: "Tesla-Modul", icon: "⚡", category: "chip", rarity: "epic", damagePct: 14, specialGrant: "chain", price: 19500, text: "Gibt Waffen ohne Special eine Blitz-Kette." },
    { id: "blast-chip", name: "Explosions-Modul", icon: "💥", category: "chip", rarity: "epic", damagePct: 16, specialGrant: "explosion", price: 21500, text: "Gibt Waffen ohne Special einen Explosionsstoß." },
    { id: "stasis-chip", name: "Stasis-Modul", icon: "❄️", category: "chip", rarity: "legendary", reloadPct: 18, specialGrant: "stasis", price: 61000, text: "Lädt ein Feld zum kurzen Festsetzen der Gegner." },
    { id: "emp-chip", name: "EMP-Modul", icon: "🧲", category: "chip", rarity: "special", damagePct: 20, specialGrant: "emp", price: 89000, text: "Deaktiviert Technikgegner für kurze Zeit." },
    { id: "quantum-chip", name: "Quanten-Modul", icon: "💠", category: "chip", rarity: "mythic", minLevel: 10, damagePct: 30, reloadPct: 24, crit: 10, specialGrant: "pierce", price: 176000, text: "Mystisches Modul für Schaden, Tempo und Durchbruch." },
    { id: "singularity-chip", name: "Singularitäts-Modul", icon: "🌀", category: "chip", rarity: "exotic", minLevel: 15, damagePct: 42, reloadPct: 30, crit: 15, critDamage: 65, specialGrant: "stasis", price: 352000, text: "Exotisches Modul mit enormen Gesamtwerten." },

    { id: "scavenger-token", name: "Plünderer-Marke", icon: "🧲", category: "charm", rarity: "common", loot: 10, price: 480, text: "Erhöht die Chance auf Beute." },
    { id: "boss-emblem", name: "Boss-Emblem", icon: "👹", category: "charm", rarity: "rare", bossDamage: 22, price: 5900, text: "Mehr Schaden gegen Bossgegner." },
    { id: "guardian-core", name: "Wächterkern", icon: "🔷", category: "charm", rarity: "epic", shield: 80, regen: .8, price: 21800, text: "Startschutz und langsame Regeneration." },
    { id: "vampire-core", name: "Vampirkern", icon: "🩸", category: "charm", rarity: "legendary", lifesteal: 5, damagePct: 8, price: 62000, text: "Lebensraub und zusätzlicher Schaden." },
    { id: "phoenix-core", name: "Phönixkern", icon: "🪶", category: "charm", rarity: "special", revive: 1, damagePct: 18, price: 96000, text: "Belebt dich einmal pro Lauf mit halbem Leben wieder." },
    { id: "time-core", name: "Zeitkern", icon: "⏳", category: "charm", rarity: "mythic", minLevel: 10, shield: 150, regen: 1.4, dodge: 7, bossDamage: 18, price: 171000, text: "Mystischer Kern für Schild, Ausweichen und Bossschaden." },
    { id: "prism-core", name: "Prismakern", icon: "🌈", category: "charm", rarity: "exotic", minLevel: 15, shield: 240, regen: 2.2, dodge: 12, bossDamage: 32, loot: 22, revive: 1, price: 348000, text: "Exotischer Kern mit mehreren starken Effekten." }
  ];

  const ITEM_MAP = new Map(ITEMS.map(item => [item.id, item]));
  const REPAIR_KITS = {
    pistol: { name: "Pistolen-Reparaturset", icon: "🧰", price: 420, amount: 420, text: "Repariert Pistolen und Revolver." },
    automatic: { name: "Automatik-Reparaturset", icon: "🧰", price: 980, amount: 520, text: "Für UZI, SMG und Gewehre." },
    shotgun: { name: "Schrotflinten-Reparaturset", icon: "🧰", price: 820, amount: 500, text: "Für Pumpguns und automatische Schrotflinten." },
    melee: { name: "Nahkampf-Reparaturset", icon: "🛠️", price: 520, amount: 620, text: "Für Schläger, Schwerter und Katanas." },
    armor: { name: "Rüstungs-Reparaturset", icon: "🧵", price: 650, amount: 700, text: "Repariert angelegte Rüstungen." },
    universal: { name: "Universal-Reparaturset", icon: "🧰", price: 2900, amount: 1100, text: "Repariert jede Ausrüstung." }
  };

  const CHARACTER_STYLES = [
    { id: "shadow", name: "Shadow", body: "#1a2327", accent: "#46e8ba", trim: "#0a1114", price: 0 },
    { id: "crimson", name: "Crimson", body: "#3b171d", accent: "#ff5c6f", trim: "#16090c", price: 1800 },
    { id: "arctic", name: "Arctic", body: "#dceaf0", accent: "#4cbcff", trim: "#34434a", price: 2600 },
    { id: "toxic", name: "Toxic", body: "#18281b", accent: "#8dff45", trim: "#071008", price: 4200 },
    { id: "royal", name: "Royal", body: "#261b45", accent: "#c67aff", trim: "#0c0817", price: 8200 },
    { id: "gold", name: "Gold Elite", body: "#2d2410", accent: "#ffd35a", trim: "#0f0b03", price: 16000 },
    { id: "neon", name: "Neon Pulse", body: "#13162b", accent: "#ff4fd8", trim: "#080817", price: 24000 }
  ];
  const STYLE_MAP = new Map(CHARACTER_STYLES.map(style => [style.id, style]));
  const SHOP_CATEGORIES = [
    ["pistol", "Pistolen"], ["automatic", "Automatik"], ["shotgun", "Schrotflinten"], ["melee", "Nahkampf"],
    ["armor", "Rüstung"], ["boots", "Schuhe"], ["chip", "Module"], ["charm", "Talismane"], ["repair", "Reparatur"], ["style", "Charakterfarben"]
  ];

  const ENEMIES = {
    grunt: { name: "Stürmer", color: "#ef5d5d", radius: 19, hp: 74, speed: 90, damage: 12, attackRate: 1.0, score: 70, xp: 10 },
    runner: { name: "Sprinter", color: "#ffb347", radius: 15, hp: 48, speed: 155, damage: 9, attackRate: 1.35, score: 82, xp: 11 },
    brute: { name: "Brecher", color: "#9b65ff", radius: 29, hp: 210, speed: 64, damage: 26, attackRate: .65, score: 155, xp: 20 },
    shooter: { name: "Schütze", color: "#5cbcff", radius: 18, hp: 88, speed: 74, damage: 11, attackRate: .7, score: 130, xp: 17, ranged: true },
    shield: { name: "Wächter", color: "#54e0a4", radius: 23, hp: 155, speed: 75, damage: 16, attackRate: .8, score: 145, xp: 19, armor: .28 },
    splitter: { name: "Teiler", color: "#ef77c8", radius: 22, hp: 118, speed: 86, damage: 15, attackRate: .9, score: 138, xp: 18, split: true },
    bomber: { name: "Bomber", color: "#ff6f32", radius: 21, hp: 132, speed: 112, damage: 34, attackRate: .55, score: 175, xp: 23, explosive: true },
    drone: { name: "Drohne", color: "#47e8ff", radius: 16, hp: 105, speed: 128, damage: 13, attackRate: 1.25, score: 185, xp: 25, ranged: true, tech: true },
    medic: { name: "Sanitäter", color: "#68ff93", radius: 20, hp: 145, speed: 82, damage: 9, attackRate: .75, score: 210, xp: 28, healer: true },
    tank: { name: "Panzer", color: "#d7b04b", radius: 34, hp: 430, speed: 48, damage: 29, attackRate: .55, score: 290, xp: 38, ranged: true, armor: .42, tech: true },
    sniper: { name: "Scharfschütze", color: "#e35cff", radius: 17, hp: 122, speed: 66, damage: 42, attackRate: .35, score: 260, xp: 34, ranged: true },
    phantom: { name: "Phantom", color: "#8b7bff", radius: 18, hp: 165, speed: 188, damage: 20, attackRate: 1.2, score: 300, xp: 40, phaseEnemy: true }
  };

  const BOSSES = [
    { id: "titan", name: "TITAN-01", color: "#ff4b62", radius: 55, hp: 2700, speed: 58, damage: 36, attackRate: .72, score: 2000, xp: 320, ability: "slam" },
    { id: "warden", name: "NEON-WÄCHTER", color: "#9d52ff", radius: 48, hp: 3300, speed: 72, damage: 28, attackRate: .9, score: 2500, xp: 390, ability: "burst" },
    { id: "colossus", name: "KOLOSS", color: "#ffb62d", radius: 63, hp: 4400, speed: 48, damage: 46, attackRate: .6, score: 3300, xp: 470, ability: "summon" },
    { id: "overlord", name: "OVERLORD", color: "#41e5d2", radius: 58, hp: 5600, speed: 62, damage: 52, attackRate: .78, score: 4200, xp: 560, ability: "empburst" }
  ];

  const UI = {
    overlay: null,
    shell: null,
    main: null,
    phoneItem: "",
    selected: new Set(),
    detailUid: "",
    toastTimer: 0,
    session: null,
    raf: 0,
    last: 0,
    keys: Object.create(null),
    pointer: { fire: false, aimX: 0, aimY: 0 },
    audio: null,
    leaderCache: [],
    leaderLoading: false,
    shopCategory: "pistol",
    shopRarity: "all"
  };

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const rand = (min, max) => min + Math.random() * (max - min);
  const randInt = (min, max) => Math.floor(rand(min, max + 1));
  const pick = list => list[Math.floor(Math.random() * list.length)];
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
  const uid = () => `fkl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  const itemDef = instance => ITEM_MAP.get(instance?.baseId) || ITEMS[0];
  const rarityKey = item => RARITIES[item?.rarity] ? item.rarity : (itemDef(item).rarity || "common");
  const rarityDef = item => RARITIES[rarityKey(item)] || RARITIES.common;
  const rarityIndex = item => Math.max(0, RARITY_ORDER.indexOf(typeof item === "string" ? item : rarityKey(item)));
  const requiredLevel = item => Math.max(Number(itemDef(item).minLevel || 1), Number(rarityDef(item).minLevel || 1));
  const starText = star => star > 0 ? "★".repeat(star) : "Basis";

  function getAppState() {
    try { return typeof state !== "undefined" && state ? state : null; } catch { return null; }
  }
  function safeSave() { try { if (typeof save === "function") save(); } catch (error) { console.warn("Fight.KL speichern", error); } }
  function safeRender() { try { if (typeof render === "function") render(); } catch {} }
  function safeFeed(text) { try { if (typeof addFeed === "function") addFeed(text); } catch {} }
  function playerName() {
    const appState = getAppState();
    return String(appState?.firstName || appState?.name || "Spieler").slice(0, 24);
  }
  function playerFunds() {
    const appState = getAppState();
    return Math.max(0, Number(appState?.cash) || 0) + Math.max(0, Number(appState?.bank) || 0);
  }
  function payFight(price, label) {
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
        appState.cash = Math.max(0, Number(appState.cash || 0) - remaining);
      }
      safeFeed(`Fight.KL: ${label} für ${EURO.format(amount)} gekauft.`);
      safeSave(); safeRender();
      return true;
    } catch { return false; }
  }
  function awardMoney(amount, label) {
    const reward = Math.max(0, Math.round(Number(amount) || 0));
    if (!reward) return;
    try {
      if (typeof awardGameWinMoney === "function") awardGameWinMoney(reward, label);
      else {
        const appState = getAppState();
        if (appState) appState.bank = Number(appState.bank || 0) + reward;
      }
      safeFeed(`${label}: ${EURO.format(reward)} erhalten.`);
      safeSave(); safeRender();
    } catch {}
  }

  function makeItem(baseId, star = 0, durability = null, rarity = null) {
    const def = ITEM_MAP.get(baseId) || ITEMS[0];
    const rarityKeyValue = RARITIES[rarity] ? rarity : def.rarity;
    const draft = { baseId: def.id, star: clamp(Math.floor(star), 0, MAX_STAR), rarity: rarityKeyValue };
    const max = itemMaxDurability(draft);
    return { uid: uid(), baseId: def.id, rarity: rarityKeyValue, star: draft.star, durability: durability == null ? max : clamp(Number(durability), 0, max), acquiredAt: Date.now() };
  }
  function defaultInventory() {
    return [
      ...Array.from({ length: 5 }, () => makeItem("service-pistol")),
      ...Array.from({ length: 5 }, () => makeItem("runner-boots")),
      makeItem("street-vest"), makeItem("speed-chip"), makeItem("scavenger-token")
    ];
  }
  function levelNeed(level) { return Math.round(700 + Math.pow(Math.max(1, level), 1.82) * 250); }
  function ensureState() {
    const appState = getAppState();
    if (!appState) return null;
    appState.fightKl ||= {};
    const data = appState.fightKl;
    data.version = VERSION;
    data.level = clamp(Math.floor(Number(data.level) || 1), 1, MAX_LEVEL);
    data.xp = Math.max(0, Math.floor(Number(data.xp) || 0));
    data.totalXp = Math.max(data.xp, Math.floor(Number(data.totalXp) || data.xp));
    data.bestWave = Math.max(0, Math.floor(Number(data.bestWave) || 0));
    data.bestScore = Math.max(0, Math.floor(Number(data.bestScore) || 0));
    data.totalKills = Math.max(0, Math.floor(Number(data.totalKills) || 0));
    data.runs = Math.max(0, Math.floor(Number(data.runs) || 0));
    data.inventory = Array.isArray(data.inventory) && data.inventory.length ? data.inventory : defaultInventory();
    data.inventory = data.inventory.slice(0, INVENTORY_LIMIT).map(raw => {
      const def = ITEM_MAP.get(raw?.baseId);
      if (!def) return null;
      const star = clamp(Math.floor(Number(raw.star) || 0), 0, MAX_STAR);
      const rarity = RARITIES[raw.rarity] ? raw.rarity : def.rarity;
      const max = itemMaxDurability({ baseId: def.id, rarity, star });
      return { uid: String(raw.uid || uid()), baseId: def.id, rarity, star, durability: clamp(Number(raw.durability ?? max), 0, max), acquiredAt: Number(raw.acquiredAt || Date.now()) };
    }).filter(Boolean);
    data.equipped ||= {};
    ["weapon", "armor", "boots", "chip", "charm"].forEach(slot => {
      const found = data.inventory.find(item => item.uid === data.equipped[slot] && itemDef(item).category === slot);
      data.equipped[slot] = found ? found.uid : "";
    });
    if (!data.equipped.weapon) data.equipped.weapon = data.inventory.find(item => item.baseId === "service-pistol")?.uid || data.inventory.find(item => itemDef(item).category === "weapon")?.uid || "";
    if (!data.equipped.armor) data.equipped.armor = data.inventory.find(item => item.baseId === "street-vest")?.uid || "";
    if (!data.equipped.boots) data.equipped.boots = data.inventory.find(item => item.baseId === "runner-boots")?.uid || "";
    if (!data.equipped.chip) data.equipped.chip = data.inventory.find(item => item.baseId === "speed-chip")?.uid || "";
    if (!data.equipped.charm) data.equipped.charm = data.inventory.find(item => item.baseId === "scavenger-token")?.uid || "";
    data.repairKits ||= {};
    Object.keys(REPAIR_KITS).forEach(key => data.repairKits[key] = Math.max(0, Math.floor(Number(data.repairKits[key]) || (key === "pistol" ? 2 : 0))));
    data.settings ||= { sound: true, particles: "high", autoFire: true };
    data.online ||= { lastSync: 0, status: "Nicht verbunden" };
    data.cosmetics ||= { active: "shadow", owned: ["shadow"] };
    if (!Array.isArray(data.cosmetics.owned)) data.cosmetics.owned = ["shadow"];
    if (!data.cosmetics.owned.includes("shadow")) data.cosmetics.owned.unshift("shadow");
    if (!STYLE_MAP.has(data.cosmetics.active) || !data.cosmetics.owned.includes(data.cosmetics.active)) data.cosmetics.active = "shadow";
    data.tutorialDone = !!data.tutorialDone;
    return data;
  }
  function itemMaxDurability(item) {
    const def = itemDef(item);
    if (!def.durability) return 0;
    const star = Number(item?.star) || 0;
    const rarityBoost = rarityIndex(item) * .12;
    return Math.round(def.durability * (1 + star * .16 + rarityBoost));
  }
  function equipped(slot) {
    const data = ensureState();
    return data?.inventory.find(item => item.uid === data.equipped[slot]) || null;
  }
  function effectiveStats(item) {
    const def = itemDef(item);
    const rarityKeyValue = rarityKey(item);
    const rarity = RARITIES[rarityKeyValue] || RARITIES.common;
    const star = clamp(Number(item?.star) || 0, 0, MAX_STAR);
    const mult = rarity.mult * STAR_MULT[star];
    const out = { ...def, rarity: rarityKeyValue, star, mult, maxDurability: itemMaxDurability(item) };
    ["damage", "health", "shield", "armor", "regen", "crit", "critDamage", "lifesteal", "bossDamage", "loot", "dodge", "damagePct", "reloadPct"].forEach(key => {
      if (Number.isFinite(def[key])) out[key] = def[key] * (key === "armor" || key.endsWith("Pct") || ["speed", "crit", "critDamage", "lifesteal", "bossDamage", "loot", "dodge"].includes(key) ? (1 + star * .26 + rarityIndex(item) * .08) : mult);
    });
    if (Number.isFinite(def.speed)) out.speed = def.id === "speed-chip" ? SPEED_BONUS[star] * (1 + rarityIndex(item) * .1) : def.speed * (1 + star * .32 + rarityIndex(item) * .08);
    if (Number.isFinite(def.fireRate)) out.fireRate = def.fireRate * (1 + star * .08 + rarityIndex(item) * .018);
    if (Number.isFinite(def.magazine)) out.magazine = Math.round(def.magazine * (1 + star * .07 + rarityIndex(item) * .025));
    if (Number.isFinite(def.reload)) out.reload = def.reload * Math.max(.42, 1 - star * .065 - rarityIndex(item) * .015);
    return out;
  }
  function powerScore() {
    const data = ensureState();
    if (!data) return 0;
    return ["weapon", "armor", "boots", "chip", "charm"].reduce((sum, slot) => {
      const item = equipped(slot); if (!item) return sum;
      const stats = effectiveStats(item);
      return sum + Math.round((stats.damage || 0) * 4 + (stats.health || 0) * 1.5 + (stats.armor || 0) * 10 + (stats.speed || 0) * 12 + stats.mult * 150);
    }, data.level * 100);
  }

  function open(phoneItem = "") {
    close(false);
    try { if (typeof prepareGameOverlay === "function") prepareGameOverlay(); } catch {}
    UI.phoneItem = phoneItem || window.JKGamesOwnedPhoneItem?.() || "";
    const data = ensureState();
    if (!data) return;
    UI.overlay = document.createElement("div");
    UI.overlay.className = "fight-kl-modal";
    UI.overlay.setAttribute("role", "dialog");
    UI.overlay.setAttribute("aria-modal", "true");
    UI.overlay.innerHTML = `<section class="fight-kl-shell"><header class="fkl-head"><div class="fkl-logo"><div class="fkl-logo-mark">⚔</div><div><small>ENDLESS UPGRADE ARENA</small><h2>FIGHT<span>.KL</span></h2></div></div><div class="fkl-head-stats" data-fkl-head-stats></div><div class="fkl-head-actions"><button class="fkl-icon-btn" type="button" data-fkl-home title="Hauptmenü">⌂</button><button class="fkl-icon-btn" type="button" data-fkl-close title="Zurück zu Top Games">×</button></div></header><main class="fkl-main" data-fkl-main></main><div class="fkl-toast" data-fkl-toast></div></section>`;
    document.body.appendChild(UI.overlay);
    document.body.classList.add("fight-kl-open");
    UI.shell = UI.overlay.querySelector(".fight-kl-shell");
    UI.main = UI.overlay.querySelector("[data-fkl-main]");
    UI.overlay.querySelector("[data-fkl-home]").addEventListener("click", () => UI.session ? pauseCombat() : renderDashboard());
    UI.overlay.querySelector("[data-fkl-close]").addEventListener("click", () => UI.session ? showExitConfirm() : returnToTopGames());
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    updateHead();
    renderDashboard();
    if (!data.tutorialDone) setTimeout(showTutorial, 220);
  }
  function close(returnPhone = false) {
    stopCombat(false);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    UI.overlay?.remove(); UI.overlay = null; UI.shell = null; UI.main = null;
    document.body.classList.remove("fight-kl-open");
    if (returnPhone) returnToTopGames();
  }
  function returnToTopGames() {
    const phone = UI.phoneItem;
    close(false);
    window.setTimeout(() => window.JKGamesOpenTopGames?.(phone), 80);
  }
  function updateHead() {
    if (!UI.overlay) return;
    const data = ensureState();
    const need = data.level >= MAX_LEVEL ? 1 : levelNeed(data.level);
    const html = `<div class="fkl-head-stat"><small>Fight-Level</small><b>${data.level}/${MAX_LEVEL}</b></div><div class="fkl-head-stat"><small>Power</small><b>${NUMBER.format(powerScore())}</b></div><div class="fkl-head-stat"><small>Best Wave</small><b>${data.bestWave}</b></div><div class="fkl-head-stat"><small>Geld</small><b>${EURO.format(playerFunds())}</b></div><div class="fkl-head-stat"><small>XP</small><b>${NUMBER.format(data.xp)}/${NUMBER.format(need)}</b></div>`;
    UI.overlay.querySelector("[data-fkl-head-stats]").innerHTML = html;
  }
  function toast(title, text = "") {
    const node = UI.overlay?.querySelector("[data-fkl-toast]");
    if (!node) return;
    node.innerHTML = `<b>${escapeHtml(title)}</b>${text ? `<small style="display:block;color:#b7c7cb;margin-top:2px">${escapeHtml(text)}</small>` : ""}`;
    node.classList.remove("show"); void node.offsetWidth; node.classList.add("show");
    clearTimeout(UI.toastTimer); UI.toastTimer = setTimeout(() => node.classList.remove("show"), 2600);
  }
  function showModal(html) {
    UI.shell?.querySelector(".fkl-pause-modal")?.remove();
    const modal = document.createElement("div"); modal.className = "fkl-pause-modal"; modal.innerHTML = `<article class="fkl-panel fkl-modal-card">${html}</article>`;
    UI.shell?.appendChild(modal); return modal;
  }
  function showTutorial() {
    const data = ensureState(); if (!UI.shell || data.tutorialDone) return;
    const modal = showModal(`<div style="font-size:60px">⚔️</div><small class="fkl-kicker">FIGHT.KL START</small><h3>Deine endlose Upgrade-Arena</h3><p>Besiege immer stärkere Bot-Wellen, sammle Items und kombiniere immer fünf identische Gegenstände zur nächsten Sternstufe. Rüste Waffen, Rüstung, Schuhe, Module und Talismane aus.</p><div class="fkl-modal-actions"><button class="fkl-btn primary" type="button" data-fkl-tutorial-ok>Verstanden</button></div>`);
    modal.querySelector("[data-fkl-tutorial-ok]").addEventListener("click", () => { data.tutorialDone = true; safeSave(); modal.remove(); });
  }

  function renderDashboard() {
    if (!UI.main) return;
    stopCombat(false);
    const data = ensureState();
    const need = data.level >= MAX_LEVEL ? 1 : levelNeed(data.level);
    const pct = data.level >= MAX_LEVEL ? 100 : clamp(data.xp / need * 100, 0, 100);
    const weapon = equipped("weapon");
    UI.main.innerHTML = `<div class="fkl-dashboard"><section class="fkl-panel fkl-hero"><div class="fkl-hero-copy"><small class="fkl-kicker">UNENDLICHE BOT-WELLEN · BOSS ALLE 10 WELLEN</small><h1>FIGHT<span>.KL</span></h1><p>Baue dein eigenes Arsenal auf, kombiniere fünf identische Items zur nächsten Sternstufe, steigere sie bis Exotisch und kämpfe dich bis Fight-Level 100. Jede Welle wird härter – dein Build entscheidet, wie weit du kommst.</p><div class="fkl-hero-actions"><button class="fkl-btn primary" type="button" data-fkl-start>⚔ Kampf starten</button><button class="fkl-btn" type="button" data-fkl-inventory>🎒 Inventar</button><button class="fkl-btn" type="button" data-fkl-shop>🛒 Shop</button></div></div><div class="fkl-hero-figure"></div></section><aside class="fkl-panel fkl-level-card"><div class="fkl-level-row"><div><small class="fkl-kicker">DEIN FIGHT-PROFIL</small><h3>${escapeHtml(playerName())}</h3></div><strong>LV ${data.level}</strong></div><div class="fkl-progress"><i style="width:${pct}%"></i></div><small>${data.level >= MAX_LEVEL ? "Maximallevel erreicht" : `${NUMBER.format(data.xp)} / ${NUMBER.format(need)} XP bis Level ${data.level + 1}`}</small><div class="fkl-stat-grid" style="margin-top:15px"><div class="fkl-stat-card"><small>Ausgerüstete Waffe</small><b>${escapeHtml(itemDef(weapon).name)}</b></div><div class="fkl-stat-card"><small>Waffenstern</small><b>${starText(weapon?.star || 0)}</b></div><div class="fkl-stat-card"><small>Bestleistung</small><b>Welle ${data.bestWave}</b></div><div class="fkl-stat-card"><small>Gesamtkills</small><b>${NUMBER.format(data.totalKills)}</b></div></div></aside><div class="fkl-dashboard-lower"><article class="fkl-panel fkl-feature" data-fkl-inventory><i>🎒</i><b>Merge-Inventar</b><small>Wähle fünf gleiche Items derselben Sternstufe und verschmelze sie bis auf fünf Sterne.</small></article><article class="fkl-panel fkl-feature" data-fkl-loadout><i>🧍</i><b>Ausrüstung</b><small>Waffe, Rüstung, Schuhe, Modul und Talisman bestimmen deinen kompletten Kampfstil.</small></article><article class="fkl-panel fkl-feature" data-fkl-shop><i>🛒</i><b>Item-Shop</b><small>Durchsuche Kategorien mit Waffen, Ausrüstung, Reparatursets und Charakterfarben.</small></article><article class="fkl-panel fkl-feature" data-fkl-leader><i>🏆</i><b>Online-Scores</b><small>Firebase-Rangliste nach höchster Welle und bestem Score.</small></article></div></div>`;
    UI.main.querySelector("[data-fkl-start]").addEventListener("click", startCombat);
    UI.main.querySelectorAll("[data-fkl-inventory],[data-fkl-loadout]").forEach(btn => btn.addEventListener("click", renderInventory));
    UI.main.querySelectorAll("[data-fkl-shop]").forEach(btn => btn.addEventListener("click", renderShop));
    UI.main.querySelector("[data-fkl-leader]").addEventListener("click", renderLeaderboard);
    updateHead();
  }

  function pageHeader(title, text, extra = "") {
    return `<div class="fkl-page-head"><div><small class="fkl-kicker">FIGHT.KL</small><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></div><div class="fkl-toolbar">${extra}<button class="fkl-btn" type="button" data-fkl-dashboard>← Hauptmenü</button></div></div>`;
  }
  function itemStyle(item) {
    const r = rarityDef(item);
    return `--rarity:${r.color};--rarity-glow:${r.glow};--rarity-gradient:${r.gradient || r.color}`;
  }
  function itemCard(item) {
    const def = itemDef(item); const r = rarityDef(item); const selected = UI.selected.has(item.uid); const data = ensureState();
    const isEquipped = Object.values(data.equipped).includes(item.uid); const max = itemMaxDurability(item); const pct = max ? clamp(item.durability / max * 100, 0, 100) : 100;
    const locked = data.level < requiredLevel(item);
    return `<article class="fkl-item rarity-${rarityKey(item)} ${selected ? "selected" : ""} ${isEquipped ? "equipped" : ""} ${locked ? "locked" : ""}" style="${itemStyle(item)}" data-fkl-item="${item.uid}"><div class="fkl-item-icon">${def.icon}</div><span class="rarity">${r.name}</span><h4>${escapeHtml(def.name)}</h4><div class="fkl-stars">${starText(item.star)}</div><small>${locked ? `Nutzbar ab Level ${requiredLevel(item)}` : escapeHtml(def.category === "weapon" ? `${Math.round(effectiveStats(item).damage)} Schaden` : def.text)}</small>${max ? `<div class="fkl-durability"><i style="width:${pct}%"></i></div><small>${Math.round(item.durability)}/${max}</small>` : ""}</article>`;
  }
  function detailHtml(item) {
    if (!item) return `<aside class="fkl-panel fkl-detail"><h3>Item auswählen</h3><p style="color:var(--fkl-muted)">Tippe ein Item an, um Werte, Equip-, Aufstiegs- und Reparaturoptionen zu sehen.</p></aside>`;
    const def = itemDef(item), r = rarityDef(item), stats = effectiveStats(item), data = ensureState();
    const isEquipped = data.equipped[def.category] === item.uid; const max = itemMaxDurability(item); const req = requiredLevel(item); const locked = data.level < req;
    const lines = [];
    if (def.category === "weapon") {
      lines.push(["Schaden", Math.round(stats.damage)]); lines.push(["Angriffe/Sek.", stats.fireRate.toFixed(2)]);
      if (def.attack !== "melee") lines.push(["Magazin", stats.magazine]);
      if (def.attack !== "melee") lines.push(["Nachladen", `${stats.reload.toFixed(2)} s`]);
      lines.push(["Reichweite", Math.round(stats.range)]);
      if (stats.special) lines.push(["Special", SPECIALS[stats.special]?.name || stats.special]);
    }
    if (stats.health) lines.push(["Extra-Leben", `+${Math.round(stats.health)}`]);
    if (stats.armor) lines.push(["Rüstung", `${Math.round(stats.armor)} %`]);
    if (stats.speed) lines.push(["Tempo", `+${Math.round(stats.speed)} %`]);
    if (stats.damagePct) lines.push(["Gesamtschaden", `+${Math.round(stats.damagePct)} %`]);
    if (stats.crit) lines.push(["Krit-Chance", `+${Math.round(stats.crit)} %`]);
    if (stats.lifesteal) lines.push(["Lebensraub", `+${Math.round(stats.lifesteal)} %`]);
    if (stats.loot) lines.push(["Beutechance", `+${Math.round(stats.loot)} %`]);
    if (stats.shield) lines.push(["Startschutz", `+${Math.round(stats.shield)}`]);
    if (max) lines.push(["Haltbarkeit", `${Math.round(item.durability)} / ${max}`]);
    const repairFamily = def.category === "weapon" ? def.family : def.category === "armor" ? "armor" : "";
    const canRepair = max && item.durability < max && (data.repairKits[repairFamily] > 0 || data.repairKits.universal > 0);
    const nextKey = RARITY_ORDER[rarityIndex(item) + 1]; const next = nextKey ? RARITIES[nextKey] : null;
    const canPromote = item.star >= MAX_STAR && !!next;
    const promoteLocked = canPromote && data.level < next.minLevel;
    return `<aside class="fkl-panel fkl-detail rarity-${rarityKey(item)}" style="${itemStyle(item)}"><div class="fkl-detail-icon">${def.icon}</div><span class="fkl-rarity">${r.name}</span><h3>${escapeHtml(def.name)}</h3><div class="fkl-stars">${starText(item.star)}</div><p style="color:var(--fkl-muted)">${escapeHtml(def.text)}</p>${locked ? `<div class="fkl-level-lock">🔒 Nutzbar ab Fight-Level ${req}</div>` : ""}<div class="fkl-stat-list">${lines.map(([k,v]) => `<div class="fkl-stat-line"><span>${escapeHtml(k)}</span><b>${escapeHtml(v)}</b></div>`).join("")}</div><div class="fkl-detail-actions"><button class="fkl-btn primary" type="button" data-fkl-equip="${item.uid}" ${locked ? "disabled" : ""}>${isEquipped ? "Ausgerüstet" : "Ausrüsten"}</button>${canPromote ? `<button class="fkl-btn rarity-up" type="button" data-fkl-promote="${item.uid}" ${promoteLocked ? "disabled" : ""}>⬆ Zu ${next.name}${promoteLocked ? ` · ab Level ${next.minLevel}` : ""}</button>` : ""}${max ? `<button class="fkl-btn" type="button" data-fkl-repair="${item.uid}" ${canRepair ? "" : "disabled"}>Reparieren</button>` : ""}</div></aside>`;
  }
  function renderInventory() {
    if (!UI.main) return;
    const data = ensureState();
    UI.selected.clear();
    UI.detailUid = data.inventory[0]?.uid || "";
    drawInventory();
  }
  function drawInventory() {
    const data = ensureState(); if (!UI.main) return;
    const detail = data.inventory.find(item => item.uid === UI.detailUid) || null;
    UI.main.innerHTML = `<div class="fkl-page">${pageHeader("Merge-Inventar", `${data.inventory.length}/${INVENTORY_LIMIT} Plätze · Fünf gleiche Items ergeben einen Stern. Ein 5-Sterne-Item steigt per Aufstiegsbutton zur nächsten Seltenheit auf.`, `<button class="fkl-btn gold" type="button" data-fkl-merge ${UI.selected.size === 5 ? "" : "disabled"}>✨ ${UI.selected.size}/5 matchen</button>`)}<section class="fkl-panel fkl-merge-box"><div><b>Upgrade-Kette</b><small>Gewöhnlich → Ungewöhnlich → Selten → Episch → Legendär → Special → Mystisch → Exotisch. Mystisch benötigt Level 10, Exotisch Level 15.</small></div><div>${Object.entries(data.equipped).map(([slot,id]) => { const item = data.inventory.find(x => x.uid === id); return `<small style="display:block">${slot}: <b>${escapeHtml(item ? `${itemDef(item).name} · ${rarityDef(item).name}` : "Leer")}</b></small>`; }).join("")}</div></section><div class="fkl-inventory-layout"><section class="fkl-inventory">${data.inventory.map(itemCard).join("")}</section>${detailHtml(detail)}</div></div>`;
    bindPageHome();
    UI.main.querySelectorAll("[data-fkl-item]").forEach(card => card.addEventListener("click", event => {
      const id = card.dataset.fklItem; const item = data.inventory.find(x => x.uid === id); if (!item) return;
      UI.detailUid = id;
      if (event.ctrlKey || event.shiftKey || event.pointerType === "touch") toggleMergeSelection(item); else {
        if (UI.selected.size && !UI.selected.has(id)) toggleMergeSelection(item); else { UI.selected.has(id) ? UI.selected.delete(id) : UI.selected.add(id); }
      }
      drawInventory();
    }));
    UI.main.querySelector("[data-fkl-merge]")?.addEventListener("click", mergeSelected);
    UI.main.querySelector("[data-fkl-equip]")?.addEventListener("click", event => equipItem(event.currentTarget.dataset.fklEquip));
    UI.main.querySelector("[data-fkl-repair]")?.addEventListener("click", event => repairItem(event.currentTarget.dataset.fklRepair));
    UI.main.querySelector("[data-fkl-promote]")?.addEventListener("click", event => promoteItem(event.currentTarget.dataset.fklPromote));
  }
  function toggleMergeSelection(item) {
    if (UI.selected.has(item.uid)) { UI.selected.delete(item.uid); return; }
    if (UI.selected.size >= 5) { toast("Maximal fünf Items", "Entferne zuerst eine Auswahl."); return; }
    if (UI.selected.size) {
      const first = ensureState().inventory.find(x => x.uid === [...UI.selected][0]);
      if (!first || first.baseId !== item.baseId || first.star !== item.star || rarityKey(first) !== rarityKey(item)) { toast("Nicht kombinierbar", "Wähle fünf identische Items derselben Seltenheit und Sternstufe."); return; }
    }
    UI.selected.add(item.uid);
  }
  function mergeSelected() {
    const data = ensureState(); const selected = data.inventory.filter(item => UI.selected.has(item.uid));
    if (selected.length !== 5) return toast("Fünf Items nötig");
    const first = selected[0];
    if (first.star >= MAX_STAR || selected.some(item => item.baseId !== first.baseId || item.star !== first.star || rarityKey(item) !== rarityKey(first))) return toast("Merge nicht möglich", "Items müssen identisch sein und unter fünf Sternen liegen.");
    const selectedIds = new Set(selected.map(item => item.uid));
    const equippedSlots = Object.entries(data.equipped).filter(([,id]) => selectedIds.has(id)).map(([slot]) => slot);
    data.inventory = data.inventory.filter(item => !selectedIds.has(item.uid));
    const merged = makeItem(first.baseId, first.star + 1, null, rarityKey(first));
    data.inventory.unshift(merged); equippedSlots.forEach(slot => data.equipped[slot] = merged.uid);
    UI.selected.clear(); UI.detailUid = merged.uid; safeSave(); updateHead();
    const flash = document.createElement("div"); flash.className = "fkl-merge-flash"; flash.innerHTML = `<div class="fkl-merge-core">${itemDef(merged).icon}</div>`; document.body.appendChild(flash); setTimeout(() => flash.remove(), 800);
    playSound(720, .16, "triangle"); setTimeout(() => playSound(980, .2, "sine"), 130);
    setTimeout(() => { drawInventory(); toast(`${itemDef(merged).name} verbessert`, `${rarityDef(merged).name} · ${starText(merged.star)} erreicht.`); }, 420);
  }
  function promoteItem(id) {
    const data = ensureState(); const item = data.inventory.find(entry => entry.uid === id); if (!item) return;
    if (item.star < MAX_STAR) return toast("Fünf Sterne nötig", "Erreiche zuerst fünf Sterne.");
    const currentIndex = rarityIndex(item), nextKey = RARITY_ORDER[currentIndex + 1];
    if (!nextKey) return toast("Maximalstufe", "Dieses Item ist bereits exotisch.");
    const next = RARITIES[nextKey];
    if (data.level < next.minLevel) return toast(`Fight-Level ${next.minLevel} nötig`, `${next.name} wird erst später freigeschaltet.`);
    item.rarity = nextKey; item.star = 0; item.durability = itemMaxDurability(item); UI.detailUid = item.uid; UI.selected.clear(); safeSave(); updateHead();
    const flash = document.createElement("div"); flash.className = `fkl-merge-flash rarity-${nextKey}`; flash.innerHTML = `<div class="fkl-merge-core">${itemDef(item).icon}</div>`; document.body.appendChild(flash); setTimeout(() => flash.remove(), 950);
    playSound(520, .12, "triangle"); setTimeout(() => playSound(920, .22, "sine"), 120); setTimeout(() => playSound(1320, .2, "triangle"), 260);
    setTimeout(() => { drawInventory(); toast("Seltenheit aufgestiegen", `${itemDef(item).name} ist jetzt ${next.name}.`); }, 480);
  }

  function equipItem(id) {
    const data = ensureState(); const item = data.inventory.find(x => x.uid === id); if (!item) return;
    const def = itemDef(item); if (!["weapon", "armor", "boots", "chip", "charm"].includes(def.category)) return;
    const req = requiredLevel(item); if (data.level < req) return toast(`Fight-Level ${req} nötig`, `${rarityDef(item).name} kann noch nicht ausgerüstet werden.`);
    if (itemMaxDurability(item) && item.durability <= 0) return toast("Item ist kaputt", "Repariere es vor dem Ausrüsten.");
    data.equipped[def.category] = item.uid; safeSave(); updateHead(); drawInventory(); toast("Ausgerüstet", `${def.name} · ${rarityDef(item).name}`);
  }
  function repairItem(id) {
    const data = ensureState(); const item = data.inventory.find(x => x.uid === id); if (!item) return;
    const def = itemDef(item); const max = itemMaxDurability(item); if (!max || item.durability >= max) return;
    const family = def.category === "weapon" ? def.family : def.category === "armor" ? "armor" : "";
    let kit = data.repairKits[family] > 0 ? family : data.repairKits.universal > 0 ? "universal" : "";
    if (!kit) return toast("Kein Reparaturset", "Kaufe ein passendes Set im Shop.");
    data.repairKits[kit] -= 1; item.durability = clamp(item.durability + REPAIR_KITS[kit].amount, 0, max); safeSave(); drawInventory(); toast("Repariert", `${def.name}: ${Math.round(item.durability)}/${max}`);
  }

  function dailyShopItems(category = UI.shopCategory) {
    return ITEMS.filter(def => {
      if (category === "pistol" || category === "automatic" || category === "shotgun" || category === "melee") return def.category === "weapon" && def.family === category;
      if (["armor", "boots", "chip", "charm"].includes(category)) return def.category === category;
      return false;
    }).sort((a,b) => rarityIndex(a.rarity) - rarityIndex(b.rarity) || (a.price || 0) - (b.price || 0));
  }
  function shopPrice(def) { return Math.max(1, Math.round(def.price || RARITIES[def.rarity]?.price || 500)); }
  function renderShop() {
    if (!UI.main) return; const data = ensureState(); const category = UI.shopCategory || "pistol";
    const tabs = SHOP_CATEGORIES.map(([id,label]) => `<button class="fkl-shop-tab ${category === id ? "active" : ""}" type="button" data-fkl-shop-category="${id}">${label}</button>`).join("");
    let content = "";
    if (category === "repair") {
      content = `<div class="fkl-repair-grid">${Object.entries(REPAIR_KITS).map(([id,kit]) => `<article class="fkl-panel fkl-repair-card"><i>${kit.icon}</i><b>${escapeHtml(kit.name)}</b><small>${escapeHtml(kit.text)}</small><div class="fkl-price">${EURO.format(kit.price)}</div><button class="fkl-btn" type="button" data-fkl-buy-kit="${id}">Kaufen · Besitz ${data.repairKits[id]}</button></article>`).join("")}</div>`;
    } else if (category === "style") {
      content = `<div class="fkl-style-grid">${CHARACTER_STYLES.map(style => { const owned = data.cosmetics.owned.includes(style.id), active = data.cosmetics.active === style.id; return `<article class="fkl-panel fkl-style-card ${active ? "active" : ""}"><div class="fkl-style-preview" style="--body:${style.body};--accent:${style.accent};--trim:${style.trim}"><i></i><b></b></div><h4>${escapeHtml(style.name)}</h4><small>Jacke ${style.body} · Akzent ${style.accent}</small><div class="fkl-price">${style.price ? EURO.format(style.price) : "Kostenlos"}</div><button class="fkl-btn ${active ? "primary" : ""}" type="button" data-fkl-style="${style.id}">${active ? "Aktiv" : owned ? "Anlegen" : "Kaufen"}</button></article>`; }).join("")}</div>`;
    } else {
      const catalog = dailyShopItems(category);
      content = `<div class="fkl-shop-grid">${catalog.map(def => { const r = RARITIES[def.rarity]; const price = shopPrice(def); const req = Math.max(def.minLevel || 1, r.minLevel || 1); const locked = data.level < req; return `<article class="fkl-panel fkl-shop-card rarity-${def.rarity}" style="--rarity:${r.color};--rarity-glow:${r.glow};--rarity-gradient:${r.gradient || r.color}"><div class="fkl-item-icon">${def.icon}</div><span class="fkl-kicker" style="color:${r.color}">${r.name}</span><h4>${escapeHtml(def.name)}</h4><p>${escapeHtml(def.text)}</p>${def.special ? `<small class="fkl-special-tag">${SPECIALS[def.special]?.icon || "✦"} ${SPECIALS[def.special]?.name || "Special"}</small>` : ""}<div class="fkl-price">${EURO.format(price)}</div><button class="fkl-btn primary" type="button" data-fkl-buy-item="${def.id}" data-price="${price}" ${locked || data.inventory.length >= INVENTORY_LIMIT ? "disabled" : ""}>${locked ? `Ab Level ${req}` : data.inventory.length >= INVENTORY_LIMIT ? "Inventar voll" : "Kaufen"}</button></article>`; }).join("")}</div>`;
    }
    UI.main.innerHTML = `<div class="fkl-page">${pageHeader("Arsenal-Shop", "Alle Waffen, Nahkampfitems, Rüstungen, Schuhe, Module, Talismane, Reparatursets und Charakterfarben sauber nach Kategorien.")}<nav class="fkl-shop-tabs">${tabs}</nav>${content}</div>`;
    bindPageHome();
    UI.main.querySelectorAll("[data-fkl-shop-category]").forEach(btn => btn.addEventListener("click", () => { UI.shopCategory = btn.dataset.fklShopCategory; renderShop(); }));
    UI.main.querySelectorAll("[data-fkl-buy-item]").forEach(btn => btn.addEventListener("click", () => {
      const def = ITEM_MAP.get(btn.dataset.fklBuyItem); const price = Number(btn.dataset.price); if (!def) return;
      const req = Math.max(def.minLevel || 1, RARITIES[def.rarity]?.minLevel || 1); if (data.level < req) return toast(`Fight-Level ${req} nötig`);
      if (data.inventory.length >= INVENTORY_LIMIT) return toast("Inventar voll");
      if (!payFight(price, def.name)) return toast("Nicht genug Geld");
      const item = makeItem(def.id, 0, null, def.rarity); data.inventory.unshift(item); safeSave(); updateHead(); toast("Gekauft", `${def.name} · ${RARITIES[def.rarity].name}`); renderShop();
    }));
    UI.main.querySelectorAll("[data-fkl-buy-kit]").forEach(btn => btn.addEventListener("click", () => {
      const id = btn.dataset.fklBuyKit, kit = REPAIR_KITS[id]; if (!kit) return;
      if (!payFight(kit.price, kit.name)) return toast("Nicht genug Geld");
      data.repairKits[id] += 1; safeSave(); updateHead(); toast("Gekauft", kit.name); renderShop();
    }));
    UI.main.querySelectorAll("[data-fkl-style]").forEach(btn => btn.addEventListener("click", () => {
      const style = STYLE_MAP.get(btn.dataset.fklStyle); if (!style) return;
      if (!data.cosmetics.owned.includes(style.id)) { if (!payFight(style.price, `Charakterfarbe ${style.name}`)) return toast("Nicht genug Geld"); data.cosmetics.owned.push(style.id); }
      data.cosmetics.active = style.id; safeSave(); toast("Charakterfarbe aktiv", style.name); renderShop();
    }));
  }

  async function renderLeaderboard() {
    if (!UI.main) return;
    UI.main.innerHTML = `<div class="fkl-page">${pageHeader("Online-Rangliste", "Die besten Fight.KL-Läufe aus Firebase – sortiert nach höchster Welle.", `<button class="fkl-btn" type="button" data-fkl-refresh>↻ Aktualisieren</button>`)}<div class="fkl-online-state" data-fkl-online-state>Firebase-Verbindung wird geprüft …</div><section class="fkl-panel fkl-board"><div class="fkl-leader-list" data-fkl-leader-list><div style="padding:30px;text-align:center;color:var(--fkl-muted)">Rangliste wird geladen …</div></div></section></div>`;
    bindPageHome(); UI.main.querySelector("[data-fkl-refresh]").addEventListener("click", loadLeaderboard);
    await loadLeaderboard();
  }
  async function firebaseCallable(name, payload = {}) {
    const core = window.LifeBuilderFirebaseCore;
    if (!core?.load) throw new Error("Firebase-Laufzeit fehlt.");
    const fb = await core.load(); const user = await core.waitForAuth(8500);
    if (!user) throw new Error("Melde dich mit deinem JK.Games-Konto an.");
    const callable = fb.httpsCallable(fb.functions, name);
    const result = await core.withTimeout(callable(payload), 15000, name);
    return result.data;
  }
  async function loadLeaderboard() {
    const stateNode = UI.main?.querySelector("[data-fkl-online-state]"); const list = UI.main?.querySelector("[data-fkl-leader-list]"); if (!list) return;
    if (UI.leaderLoading) return; UI.leaderLoading = true;
    try {
      if (stateNode) stateNode.textContent = "Firebase wird verbunden …";
      const result = await firebaseCallable(LEADERBOARD_FUNCTION, { limit: 50 });
      UI.leaderCache = Array.isArray(result?.entries) ? result.entries : [];
      if (stateNode) stateNode.textContent = `Online · ${UI.leaderCache.length} Scores geladen`;
      list.innerHTML = UI.leaderCache.length ? UI.leaderCache.map((entry, index) => `<article class="fkl-leader-row ${entry.me ? "me" : ""}"><span class="fkl-leader-rank">#${index + 1}</span><b>${escapeHtml(entry.name || "JK.Games-Spieler")}</b><span>Welle <b>${Number(entry.bestWave || 0)}</b></span><span>Score <b>${NUMBER.format(entry.bestScore || 0)}</b></span><span>LV <b>${Number(entry.level || 1)}</b></span></article>`).join("") : `<div style="padding:30px;text-align:center;color:var(--fkl-muted)">Noch keine Online-Scores vorhanden.</div>`;
    } catch (error) {
      if (stateNode) stateNode.textContent = `Offline/Backend nicht bereit: ${error.message || error}`;
      const data = ensureState(); list.innerHTML = `<article class="fkl-leader-row me"><span class="fkl-leader-rank">LOKAL</span><b>${escapeHtml(playerName())}</b><span>Welle <b>${data.bestWave}</b></span><span>Score <b>${NUMBER.format(data.bestScore)}</b></span><span>LV <b>${data.level}</b></span></article>`;
    } finally { UI.leaderLoading = false; }
  }
  async function submitScore(run) {
    const data = ensureState();
    try {
      data.online.status = "Wird synchronisiert"; safeSave();
      const result = await firebaseCallable(SCORE_FUNCTION, {
        score: Math.floor(run.score), wave: Math.floor(run.wave), kills: Math.floor(run.kills), durationMs: Math.floor(run.durationMs), level: data.level, power: powerScore(), name: playerName()
      });
      data.online.status = "Synchronisiert"; data.online.lastSync = Date.now(); safeSave();
      return result;
    } catch (error) { data.online.status = `Offline: ${error.message || error}`; safeSave(); return null; }
  }
  function bindPageHome() { UI.main?.querySelector("[data-fkl-dashboard]")?.addEventListener("click", renderDashboard); }

  function buildPlayer() {
    const data = ensureState();
    const weaponItem = equipped("weapon") || data.inventory.find(item => itemDef(item).category === "weapon");
    const armorItem = equipped("armor"), bootsItem = equipped("boots"), chipItem = equipped("chip"), charmItem = equipped("charm");
    const weapon = effectiveStats(weaponItem), armor = armorItem ? effectiveStats(armorItem) : {}, boots = bootsItem ? effectiveStats(bootsItem) : {}, chip = chipItem ? effectiveStats(chipItem) : {}, charm = charmItem ? effectiveStats(charmItem) : {};
    const levelBonus = 1 + (data.level - 1) * .012;
    const damageMult = levelBonus * (1 + Number(chip.damagePct || 0) / 100) * (1 + Number(charm.damagePct || 0) / 100);
    const speedBonus = Number(boots.speed || 0) + Number(chip.speed || 0); const speedPenalty = Number(armor.speedPenalty || 0);
    const style = STYLE_MAP.get(data.cosmetics.active) || CHARACTER_STYLES[0];
    const specialType = weapon.special || chip.specialGrant || "";
    return {
      x: WORLD_W / 2, y: WORLD_H / 2, radius: 18,
      maxHp: Math.round(130 + data.level * 3 + Number(armor.health || 0)), hp: 0,
      maxShield: Math.round(Number(charm.shield || 0) + Number(armor.shield || 0)), shield: Math.round(Number(charm.shield || 0) + Number(armor.shield || 0)),
      speed: 250 * (1 + speedBonus / 100) * (1 - speedPenalty), armor: clamp(Number(armor.armor || 0) / 100, 0, .72),
      dodge: clamp((Number(boots.dodge || 0) + Number(armor.dodge || 0) + Number(charm.dodge || 0)) / 100, 0, .48),
      regen: Number(armor.regen || 0) + Number(charm.regen || 0) + Number(boots.regen || 0),
      crit: .05 + Number(chip.crit || 0) / 100, critDamage: 1.75 + Number(chip.critDamage || 0) / 100,
      lifesteal: (Number(chip.lifesteal || 0) + Number(weapon.lifesteal || 0) + Number(charm.lifesteal || 0)) / 100,
      bossDamage: 1 + Number(charm.bossDamage || 0) / 100, lootBonus: Number(charm.loot || 0), revive: Math.floor(Number(charm.revive || 0)),
      weaponItem, armorItem, weapon, damageMult, ammo: Math.max(1, Math.round(weapon.magazine || 1)), reloading: false, reloadTimer: 0,
      fireCooldown: 0, attackAnim: 0, hitFlash: 0, angle: -Math.PI / 2, vx: 0, vy: 0, moving: false,
      weaponBroken: !weaponItem || Number(weaponItem.durability) <= 0, cosmetics: style,
      specialType, specialCharge: 0, specialReady: false, specialPulse: 0
    };
  }

  function startCombat() {
    const data = ensureState(); const weaponItem = equipped("weapon");
    if (!weaponItem) return toast("Keine Waffe", "Rüste im Inventar eine Waffe aus.");
    if (data.level < requiredLevel(weaponItem)) return toast(`Fight-Level ${requiredLevel(weaponItem)} nötig`, "Rüste eine freigeschaltete Waffe aus.");
    if (itemMaxDurability(weaponItem) && weaponItem.durability <= 0) return toast("Waffe kaputt", "Repariere deine Waffe im Inventar.");
    stopCombat(false); const player = buildPlayer(); player.hp = player.maxHp;
    const special = SPECIALS[player.specialType];
    UI.main.innerHTML = `<section class="fkl-combat"><div class="fkl-combat-hud"><div class="fkl-hud-left"><button class="fkl-icon-btn" type="button" data-fkl-combat-pause>Ⅱ</button><div class="fkl-health-wrap"><small>LEBEN <b data-fkl-hp-text></b></small><div class="fkl-bar fkl-health"><i data-fkl-hp-bar></i></div><div class="fkl-bar fkl-xp" style="margin-top:4px;height:6px"><i data-fkl-xp-bar></i></div></div><div class="fkl-hud-pill"><small>SHIELD</small><b data-fkl-shield>0</b></div></div><div class="fkl-wave" data-fkl-wave>WELLE 1</div><div class="fkl-hud-right"><div class="fkl-hud-pill"><small>KILLS</small><b data-fkl-kills>0</b></div><div class="fkl-hud-pill"><small>SCORE</small><b data-fkl-score>0</b></div><div class="fkl-hud-pill"><small>POWER</small><b>${NUMBER.format(powerScore())}</b></div></div></div><div class="fkl-stage"><canvas class="fkl-canvas" data-fkl-canvas></canvas><div class="fkl-vignette"></div><div class="fkl-combat-message" data-fkl-message></div><div class="fkl-boss-wrap" data-fkl-boss-wrap hidden><b data-fkl-boss-name>BOSS</b><div class="fkl-bar fkl-boss"><i data-fkl-boss-bar></i></div></div><div class="fkl-ammo"><small data-fkl-weapon-name></small><b data-fkl-ammo></b><small data-fkl-durability></small></div><button class="fkl-special-button ${special ? "" : "disabled"}" type="button" data-fkl-special ${special ? "" : "disabled"}><span>${special?.icon || "✦"}</span><div><small data-fkl-special-name>${special?.name || "Kein Special"}</small><b data-fkl-special-text>${special ? "0 %" : "—"}</b><div class="fkl-special-bar"><i data-fkl-special-bar></i></div></div></button><div class="fkl-touch"><div class="fkl-stick" data-fkl-stick><div class="fkl-stick-knob" data-fkl-stick-knob></div></div><button class="fkl-auto" type="button" data-fkl-auto>AUTO AN</button><button class="fkl-fire" type="button" data-fkl-fire>FEUER</button></div></div></section>`;
    const canvas = UI.main.querySelector("[data-fkl-canvas]");
    UI.session = { canvas, ctx: canvas.getContext("2d", { alpha: false }), player, viewW: 1280, viewH: 720, dpr: 1, camera: { x: player.x, y: player.y - 90 }, wave: 0, waveStarted: false, waveClearAt: 0, spawnQueue: [], spawnTimer: 0, enemies: [], projectiles: [], enemyProjectiles: [], particles: [], texts: [], pickups: [], score: 0, kills: 0, startedAt: performance.now(), paused: false, ended: false, autoFire: data.settings.autoFire !== false, joystick: { active: false, id: null, x: 0, y: 0, ox: 0, oy: 0 }, resizeObserver: null, boss: null, moneyEarned: 0, lootEarned: [], lastSave: 0, waveMessage: "", decorations: createArenaDecorations(), frameCount: 0, fpsClock: performance.now(), fps: 60, specialInProgress: false };
    bindCombatControls(); resizeCombat(); UI.session.resizeObserver = new ResizeObserver(resizeCombat); UI.session.resizeObserver.observe(canvas.parentElement);
    startWave(1); updateHud(); UI.last = performance.now(); cancelAnimationFrame(UI.raf); UI.raf = requestAnimationFrame(combatLoop);
    playSound(180, .14, "sawtooth"); setTimeout(() => playSound(330, .18, "square"), 120);
  }
  function createArenaDecorations() {
    const list = [];
    for (let i = 0; i < 90; i++) list.push({ x: rand(60, WORLD_W - 60), y: rand(60, WORLD_H - 60), type: Math.random() < .5 ? "crack" : Math.random() < .75 ? "crate" : "light", size: rand(10, 36), rot: rand(0, Math.PI * 2) });
    return list;
  }
  function resizeCombat() {
    const s = UI.session; if (!s?.canvas) return;
    const rect = s.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, matchMedia("(pointer:coarse)").matches ? 1.25 : 1.5);
    s.viewW = Math.max(320, rect.width); s.viewH = Math.max(260, rect.height); s.dpr = dpr;
    const w = Math.round(s.viewW * dpr), h = Math.round(s.viewH * dpr);
    if (s.canvas.width !== w || s.canvas.height !== h) { s.canvas.width = w; s.canvas.height = h; }
  }
  function bindCombatControls() {
    const s = UI.session; if (!s) return;
    UI.main.querySelector("[data-fkl-combat-pause]").addEventListener("click", pauseCombat);
    const auto = UI.main.querySelector("[data-fkl-auto]"); auto.textContent = s.autoFire ? "AUTO AN" : "AUTO AUS"; auto.classList.toggle("off", !s.autoFire);
    auto.addEventListener("click", () => { s.autoFire = !s.autoFire; ensureState().settings.autoFire = s.autoFire; safeSave(); auto.textContent = s.autoFire ? "AUTO AN" : "AUTO AUS"; auto.classList.toggle("off", !s.autoFire); });
    const specialButton = UI.main.querySelector("[data-fkl-special]"); specialButton?.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); triggerSpecial(); });
    const fire = UI.main.querySelector("[data-fkl-fire]");
    ["pointerdown", "pointerenter"].forEach(type => fire.addEventListener(type, event => { if (type === "pointerenter" && !event.buttons) return; UI.pointer.fire = true; fire.setPointerCapture?.(event.pointerId); }));
    ["pointerup", "pointercancel", "pointerleave"].forEach(type => fire.addEventListener(type, () => UI.pointer.fire = false));
    const canvas = s.canvas;
    canvas.addEventListener("pointermove", event => { const rect = canvas.getBoundingClientRect(); UI.pointer.aimX = (event.clientX - rect.left) + s.camera.x - s.viewW / 2; UI.pointer.aimY = (event.clientY - rect.top) + s.camera.y - s.viewH / 2; });
    canvas.addEventListener("pointerdown", event => { if (s.player.specialReady) { event.preventDefault(); triggerSpecial(); return; } if (event.pointerType === "mouse") UI.pointer.fire = true; });
    canvas.addEventListener("pointerup", event => { if (event.pointerType === "mouse") UI.pointer.fire = false; });
    const stick = UI.main.querySelector("[data-fkl-stick]"), knob = UI.main.querySelector("[data-fkl-stick-knob]");
    const updateStick = event => { const rect = stick.getBoundingClientRect(); const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2; let dx = event.clientX - cx, dy = event.clientY - cy; const max = rect.width * .32; const len = Math.hypot(dx, dy) || 1; if (len > max) { dx *= max / len; dy *= max / len; } s.joystick.x = dx / max; s.joystick.y = dy / max; knob.style.transform = `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`; };
    stick.addEventListener("pointerdown", event => { s.joystick.active = true; s.joystick.id = event.pointerId; stick.setPointerCapture(event.pointerId); updateStick(event); });
    stick.addEventListener("pointermove", event => { if (s.joystick.active && event.pointerId === s.joystick.id) updateStick(event); });
    const stopStick = event => { if (event && s.joystick.id != null && event.pointerId !== s.joystick.id) return; s.joystick.active = false; s.joystick.id = null; s.joystick.x = s.joystick.y = 0; knob.style.transform = "translate(-50%,-50%)"; };
    stick.addEventListener("pointerup", stopStick); stick.addEventListener("pointercancel", stopStick);
  }
  function startWave(number) {
    const s = UI.session; if (!s || s.ended) return;
    s.wave = number; s.waveStarted = true; s.waveClearAt = 0; s.spawnTimer = 0; s.spawnQueue = [];
    const bossWave = number % 10 === 0;
    let count = bossWave ? 5 + Math.floor(number / 7) : 6 + Math.floor(number * 1.62) + Math.floor(Math.pow(number, 1.13) * .42);
    if (number >= 20) count = Math.round(count * 1.18); if (number >= 40) count = Math.round(count * 1.14); count = Math.min(125, count);
    if (bossWave) s.spawnQueue.push({ boss: true, bossIndex: Math.floor(number / 10 - 1) % BOSSES.length });
    const unlocked = ["grunt", ...(number >= 2 ? ["runner"] : []), ...(number >= 4 ? ["shooter"] : []), ...(number >= 6 ? ["brute"] : []), ...(number >= 8 ? ["shield"] : []), ...(number >= 12 ? ["splitter"] : []), ...(number >= 15 ? ["bomber"] : []), ...(number >= 20 ? ["drone", "medic"] : []), ...(number >= 25 ? ["tank"] : []), ...(number >= 30 ? ["sniper"] : []), ...(number >= 38 ? ["phantom"] : [])];
    for (let i = 0; i < count; i++) { let type = pick(unlocked); if (number < 3 && Math.random() < .7) type = "grunt"; s.spawnQueue.push({ type, elite: number >= 20 && Math.random() < Math.min(.24, (number - 18) * .006) }); }
    showCombatMessage(bossWave ? `BOSS-WELLE ${number}` : number >= 20 ? `WELLE ${number} · ELITE-ZONE` : `WELLE ${number}`); updateHud();
  }
  function showCombatMessage(text) {
    const node = UI.main?.querySelector("[data-fkl-message]"); if (!node) return;
    node.textContent = text; node.classList.remove("show"); void node.offsetWidth; node.classList.add("show");
  }
  function spawnEnemy(spec) {
    const s = UI.session; if (!s) return;
    const angle = rand(0, Math.PI * 2); const dist = Math.max(s.viewW, s.viewH) * .68 + rand(120, 340);
    let x = clamp(s.player.x + Math.cos(angle) * dist, 35, WORLD_W - 35), y = clamp(s.player.y + Math.sin(angle) * dist, 35, WORLD_H - 35);
    if (spec.boss) {
      const boss = BOSSES[spec.bossIndex] || BOSSES[0]; const scale = 1 + Math.max(0, s.wave - 10) * .055;
      const enemy = { ...boss, type: "boss", boss: true, x, y, maxHp: boss.hp * scale, hp: boss.hp * scale, speed: boss.speed * (1 + s.wave * .006), damage: boss.damage * (1 + s.wave * .04), attackCooldown: 1.5, abilityCooldown: 2.5, hitFlash: 0, angle: 0, phase: 0, dead: false, statusTimer: 0, statusType: "" };
      s.enemies.push(enemy); s.boss = enemy; return;
    }
    const base = ENEMIES[spec.type] || ENEMIES.grunt; const scale = 1 + s.wave * .115 + Math.pow(s.wave, 1.25) * .012; const elite = !!spec.elite;
    s.enemies.push({ ...base, type: spec.type, elite, x, y, maxHp: base.hp * scale * (elite ? 2.15 : 1), hp: base.hp * scale * (elite ? 2.15 : 1), radius: base.radius * (elite ? 1.16 : 1), speed: base.speed * (1 + Math.min(.75, s.wave * .012)) * (elite ? 1.08 : 1), damage: base.damage * (1 + s.wave * .045) * (elite ? 1.55 : 1), score: base.score * (elite ? 2.5 : 1), xp: base.xp * (elite ? 2.2 : 1), attackCooldown: rand(.2, 1.1), abilityCooldown: rand(1, 3), hitFlash: 0, angle: 0, phase: rand(0, 10), dead: false, statusTimer: 0, statusType: "" });
  }
  function combatLoop(now) {
    const s = UI.session; if (!s || s.ended) return;
    const dt = Math.min(.034, Math.max(.001, (now - UI.last) / 1000)); UI.last = now;
    if (!s.paused) updateCombat(dt, now);
    drawCombat(now);
    UI.raf = requestAnimationFrame(combatLoop);
  }
  function updateCombat(dt, now) {
    const s = UI.session, p = s.player; if (!s || s.ended) return;
    s.frameCount++; if (now - s.fpsClock >= 1000) { s.fps = s.frameCount * 1000 / (now - s.fpsClock); s.frameCount = 0; s.fpsClock = now; }
    if (s.spawnQueue.length) {
      s.spawnTimer -= dt;
      if (s.spawnTimer <= 0) { spawnEnemy(s.spawnQueue.shift()); s.spawnTimer = s.wave <= 3 ? .55 : Math.max(.12, .42 - s.wave * .006); }
    }
    updatePlayer(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateParticles(dt);
    updatePickups(dt);
    if (!s.spawnQueue.length && !s.enemies.length && !s.waveClearAt) {
      s.waveClearAt = now + 2300; s.waveStarted = false; completeWave(s.wave);
      showCombatMessage(`WELLE ${s.wave} GESCHAFFT`);
    }
    if (s.waveClearAt && now >= s.waveClearAt) startWave(s.wave + 1);
    const cameraSpeed = 1 - Math.pow(.001, dt);
    s.camera.x += (p.x - s.camera.x) * cameraSpeed; s.camera.y += ((p.y - s.viewH * .12) - s.camera.y) * cameraSpeed;
    if (p.regen > 0 && p.hp > 0) p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);
    if (p.hitFlash > 0) p.hitFlash -= dt; if (p.attackAnim > 0) p.attackAnim -= dt;
    if (now - s.lastSave > 12000) { s.lastSave = now; safeSave(); }
    updateHud();
  }
  function updatePlayer(dt) {
    const s = UI.session, p = s.player;
    let mx = 0, my = 0;
    if (UI.keys.KeyW || UI.keys.ArrowUp) my -= 1; if (UI.keys.KeyS || UI.keys.ArrowDown) my += 1;
    if (UI.keys.KeyA || UI.keys.ArrowLeft) mx -= 1; if (UI.keys.KeyD || UI.keys.ArrowRight) mx += 1;
    mx += s.joystick.x; my += s.joystick.y;
    const len = Math.hypot(mx, my); if (len > 1) { mx /= len; my /= len; }
    p.vx = mx * p.speed; p.vy = my * p.speed; p.moving = Math.hypot(mx, my) > .08;
    p.x = clamp(p.x + p.vx * dt, p.radius, WORLD_W - p.radius); p.y = clamp(p.y + p.vy * dt, p.radius, WORLD_H - p.radius);
    p.fireCooldown = Math.max(0, p.fireCooldown - dt);
    if (p.reloading) {
      p.reloadTimer -= dt;
      if (p.reloadTimer <= 0) { p.reloading = false; p.ammo = Math.max(1, Math.round(p.weapon.magazine || 1)); playSound(460, .07, "square"); }
    }
    const target = nearestEnemy(p.x, p.y, p.weapon.range || 1600);
    if (target) p.angle = Math.atan2(target.y - p.y, target.x - p.x);
    else if (Number.isFinite(UI.pointer.aimX)) p.angle = Math.atan2(UI.pointer.aimY - p.y, UI.pointer.aimX - p.x);
    const wantsAttack = s.autoFire || UI.pointer.fire || UI.keys.Space;
    if (wantsAttack && target) attack(target);
  }
  function nearestEnemy(x, y, range = Infinity) {
    const s = UI.session; let best = null, bestD = range;
    for (const enemy of s.enemies) { if (enemy.dead) continue; const d = Math.hypot(enemy.x - x, enemy.y - y); if (d < bestD) { bestD = d; best = enemy; } }
    return best;
  }
  function attack(target) {
    const s = UI.session, p = s.player, w = p.weapon;
    if (p.fireCooldown > 0 || p.reloading) return;
    if (p.weaponItem && p.weaponItem.durability <= 0) { p.weaponBroken = true; p.weapon = { attack: "melee", damage: 9, fireRate: 1.2, range: 62, arc: 1.5, name: "Fäuste", rarity: "common" }; p.ammo = 1; showCombatMessage("WAFFE KAPUTT"); }
    if (p.weapon.attack !== "melee" && p.ammo <= 0) { beginReload(); return; }
    const rate = Math.max(.15, Number(p.weapon.fireRate) || 1); p.fireCooldown = 1 / rate; p.attackAnim = Math.min(.3, 1 / rate);
    if (p.weapon.attack === "melee") meleeAttack(); else fireWeapon();
    if (p.weaponItem && p.weaponItem.durability > 0) p.weaponItem.durability = Math.max(0, p.weaponItem.durability - (p.weapon.attack === "melee" ? .52 : p.weapon.attack === "shotgun" ? .72 : .16));
  }
  function beginReload() {
    const p = UI.session.player; if (p.reloading || p.weapon.attack === "melee") return;
    p.reloading = true; const reloadBoost = effectiveStats(equipped("chip"))?.reloadPct || 0; p.reloadTimer = Math.max(.35, (p.weapon.reload || 1.5) * (1 - reloadBoost / 100));
    playSound(250, .06, "square");
  }
  function fireWeapon() {
    const s = UI.session, p = s.player, w = p.weapon; p.ammo -= 1;
    const count = w.attack === "shotgun" ? Math.max(1, Math.round(w.pellets || 7)) : 1;
    for (let i = 0; i < count; i++) {
      const spread = (w.spread || 0) * rand(-1, 1); const angle = p.angle + spread; const crit = Math.random() < p.crit;
      s.projectiles.push({ x: p.x + Math.cos(angle) * 28, y: p.y + Math.sin(angle) * 28, vx: Math.cos(angle) * (w.attack === "shotgun" ? 760 : 940), vy: Math.sin(angle) * (w.attack === "shotgun" ? 760 : 940), radius: rarityIndex(w.rarity) >= 5 ? 5 : 3, damage: w.damage * p.damageMult * (crit ? p.critDamage : 1), life: (w.range || 620) / 900, color: crit ? "#ffe05a" : RARITIES[w.rarity]?.color || "#fff", crit, pierce: Math.max(0, Math.round(w.pierce || 0)), splash: Number(w.splash || 0), hit: new Set() });
    }
    chargeSpecial(.7 + count * .16); spawnParticles(p.x + Math.cos(p.angle) * 30, p.y + Math.sin(p.angle) * 30, RARITIES[w.rarity]?.color || "#ffd", 5, 120);
    playSound(w.attack === "shotgun" ? 95 : w.fireRate > 7 ? 150 : 210, w.attack === "shotgun" ? .08 : .035, "square", .018); if (p.ammo <= 0) beginReload();
  }
  function chargeSpecial(amount) {
    const s = UI.session, p = s?.player; if (!p?.specialType || p.specialReady || s.specialInProgress) return;
    p.specialCharge = clamp(p.specialCharge + Math.max(0, amount), 0, 100); p.specialReady = p.specialCharge >= 100;
    if (p.specialReady) { p.specialCharge = 100; showCombatMessage(`${SPECIALS[p.specialType]?.name || "SPECIAL"} BEREIT`); playSound(960, .14, "triangle"); }
  }
  function applyStatus(enemy, type, duration) {
    if (!enemy || enemy.dead) return; const scale = enemy.boss ? .35 : 1; enemy.statusType = type; enemy.statusTimer = Math.max(enemy.statusTimer || 0, duration * scale);
  }
  function triggerSpecial() {
    const s = UI.session, p = s?.player; if (!s || s.paused || !p?.specialType || !p.specialReady) return;
    const type = p.specialType, spec = SPECIALS[type]; p.specialReady = false; p.specialCharge = 0; p.specialPulse = .8; s.specialInProgress = true;
    const base = Math.max(20, Number(p.weapon.damage || 20) * p.damageMult); const enemies = [...s.enemies].filter(e => !e.dead).sort((a,b) => distance(a,p)-distance(b,p));
    showCombatMessage(spec?.name || "SPECIAL");
    if (type === "chain") {
      const targets = enemies.filter(e => distance(e,p) < 560).slice(0, 10); let from = p;
      targets.forEach((enemy,index) => { s.particles.push({ type:"beam", x:from.x, y:from.y, x2:enemy.x, y2:enemy.y, life:.32, maxLife:.32, color:spec.color }); damageEnemy(enemy, base * (1.5 - index * .055), index < 2, 0); applyStatus(enemy,"shock",.7); from = enemy; });
    } else if (type === "explosion") {
      const target = enemies[0] || { x:p.x + Math.cos(p.angle)*220, y:p.y + Math.sin(p.angle)*220 }; const radius = 320;
      s.particles.push({ type:"blast", x:target.x, y:target.y, radius:20, maxRadius:radius, life:.72, maxLife:.72, color:spec.color });
      enemies.filter(e => distance(e,target) <= radius + e.radius).forEach(e => damageEnemy(e, base * 2.15 * (1 - Math.min(.55,distance(e,target)/radius*.55)), true, 0));
    } else if (type === "stasis") {
      s.particles.push({ type:"blast", x:p.x, y:p.y, radius:30, maxRadius:520, life:.9, maxLife:.9, color:spec.color });
      enemies.filter(e => distance(e,p) <= 520).forEach(e => { damageEnemy(e, base * .72, false, 0); applyStatus(e,"stasis",3.6); });
    } else if (type === "emp") {
      s.particles.push({ type:"ring", x:p.x, y:p.y, radius:20, maxRadius:590, life:.8, maxLife:.8, color:spec.color });
      enemies.filter(e => distance(e,p) <= 590).forEach(e => { damageEnemy(e, base * .8, false, 0); if (e.tech || e.ranged || e.type === "tank") applyStatus(e,"emp",4.2); else applyStatus(e,"shock",1.1); });
    } else {
      s.projectiles.push({ x:p.x + Math.cos(p.angle)*34, y:p.y + Math.sin(p.angle)*34, vx:Math.cos(p.angle)*1250, vy:Math.sin(p.angle)*1250, radius:14, damage:base*3.1, life:1.25, color:spec?.color || "#ff5de5", crit:true, pierce:99, splash:60, hit:new Set(), special:true });
    }
    spawnParticles(p.x,p.y,spec?.color || "#fff",28,300); playSound(120,.18,"sawtooth",.05); setTimeout(()=>playSound(680,.18,"triangle",.035),80); setTimeout(()=>{ if (UI.session) UI.session.specialInProgress=false; },120);
  }

  function meleeAttack() {
    const s = UI.session, p = s.player, w = p.weapon; const range = w.range || 80, arc = w.arc || 1.6; let hit = 0;
    for (const enemy of [...s.enemies]) {
      const dx = enemy.x - p.x, dy = enemy.y - p.y, d = Math.hypot(dx, dy); if (d > range + enemy.radius) continue;
      const diff = Math.atan2(Math.sin(Math.atan2(dy, dx) - p.angle), Math.cos(Math.atan2(dy, dx) - p.angle)); if (Math.abs(diff) > arc / 2) continue;
      const crit = Math.random() < p.crit; damageEnemy(enemy, w.damage * p.damageMult * (crit ? p.critDamage : 1), crit, w.splash || 0); hit++;
      enemy.x += Math.cos(p.angle) * (w.id === "shock-hammer" ? 65 : 22); enemy.y += Math.sin(p.angle) * (w.id === "shock-hammer" ? 65 : 22);
    }
    s.particles.push({ type: "slash", x: p.x, y: p.y, angle: p.angle, radius: range, life: .24, maxLife: .24, color: RARITIES[w.rarity]?.color || "#fff" });
    if (w.dash) { p.x = clamp(p.x + Math.cos(p.angle) * w.dash, 20, WORLD_W - 20); p.y = clamp(p.y + Math.sin(p.angle) * w.dash, 20, WORLD_H - 20); }
    if (hit) chargeSpecial(Math.min(9, 1.8 + hit * 1.25));
    playSound(hit ? 105 : 180, .07, "sawtooth", .02);
  }
  function updateEnemies(dt) {
    const s = UI.session, p = s.player;
    for (const enemy of [...s.enemies]) {
      if (enemy.dead) continue; enemy.phase += dt * 8; enemy.hitFlash = Math.max(0, enemy.hitFlash - dt); enemy.attackCooldown -= dt; enemy.abilityCooldown -= dt;
      if (enemy.statusTimer > 0) { enemy.statusTimer -= dt; if (enemy.statusType === "emp" || enemy.statusType === "stasis") { enemy.x += Math.sin(enemy.phase) * .15; continue; } }
      const dx = p.x - enemy.x, dy = p.y - enemy.y, d = Math.hypot(dx, dy) || 1; enemy.angle = Math.atan2(dy, dx);
      if (enemy.boss) updateBoss(enemy, dt, d, dx / d, dy / d);
      else if (enemy.healer) {
        if (d > 430) { enemy.x += dx / d * enemy.speed * dt; enemy.y += dy / d * enemy.speed * dt; }
        if (enemy.abilityCooldown <= 0) { enemy.abilityCooldown = 5.5; const allies=s.enemies.filter(e=>e!==enemy&&!e.dead&&distance(e,enemy)<270).slice(0,8); allies.forEach(e=>{e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.12);}); s.particles.push({type:"ring",x:enemy.x,y:enemy.y,radius:12,maxRadius:260,life:.55,maxLife:.55,color:enemy.color}); }
      } else if (enemy.ranged) {
        const preferred = enemy.type === "sniper" ? 520 : enemy.type === "tank" ? 420 : 330;
        if (d > preferred + 80) { enemy.x += dx / d * enemy.speed * dt; enemy.y += dy / d * enemy.speed * dt; }
        else if (d < preferred - 100) { enemy.x -= dx / d * enemy.speed * .65 * dt; enemy.y -= dy / d * enemy.speed * .65 * dt; }
        else enemy.y += Math.sin(enemy.phase) * 18 * dt;
        if (enemy.attackCooldown <= 0 && d < (enemy.type === "sniper" ? 980 : 680)) { enemy.attackCooldown = 1 / enemy.attackRate; fireEnemyProjectile(enemy, enemy.angle, enemy.damage); }
      } else {
        enemy.x += dx / d * enemy.speed * dt; enemy.y += dy / d * enemy.speed * dt;
        if (d < enemy.radius + p.radius + 5 && enemy.attackCooldown <= 0) { enemy.attackCooldown = 1 / enemy.attackRate; if (enemy.explosive) { damagePlayer(enemy.damage * 1.35, enemy); s.particles.push({type:"blast",x:enemy.x,y:enemy.y,radius:10,maxRadius:150,life:.45,maxLife:.45,color:enemy.color}); killEnemy(enemy); } else damagePlayer(enemy.damage, enemy); }
      }
      enemy.x = clamp(enemy.x, enemy.radius, WORLD_W - enemy.radius); enemy.y = clamp(enemy.y, enemy.radius, WORLD_H - enemy.radius);
    }
  }
  function updateBoss(enemy, dt, d, nx, ny) {
    const p = UI.session.player; enemy.x += nx * enemy.speed * dt; enemy.y += ny * enemy.speed * dt;
    if (d < enemy.radius + p.radius + 14 && enemy.attackCooldown <= 0) { enemy.attackCooldown = 1 / enemy.attackRate; damagePlayer(enemy.damage, enemy); }
    if (enemy.abilityCooldown > 0) return;
    if (enemy.ability === "slam") { enemy.abilityCooldown = 4.2; UI.session.particles.push({ type:"ring",x:enemy.x,y:enemy.y,radius:10,maxRadius:240,life:.65,maxLife:.65,color:enemy.color }); if (d < 235) damagePlayer(enemy.damage * 1.45, enemy); }
    else if (enemy.ability === "burst") { enemy.abilityCooldown = 3.8; for (let i=0;i<14;i++) fireEnemyProjectile(enemy,i/14*Math.PI*2,enemy.damage*.72); }
    else if (enemy.ability === "empburst") { enemy.abilityCooldown = 4.6; UI.session.particles.push({type:"ring",x:enemy.x,y:enemy.y,radius:12,maxRadius:420,life:.72,maxLife:.72,color:enemy.color}); if(d<410){p.specialCharge=Math.max(0,p.specialCharge-24);damagePlayer(enemy.damage*.9,enemy);} }
    else { enemy.abilityCooldown=5.2; for(let i=0;i<4;i++)spawnEnemy({type:pick(["grunt","runner","shield","drone"]),elite:UI.session.wave>=30&&Math.random()<.25}); showCombatMessage("BOSS RUFT VERSTÄRKUNG"); }
  }
  function fireEnemyProjectile(enemy, angle, damage) {
    const s = UI.session; s.enemyProjectiles.push({ x: enemy.x + Math.cos(angle) * enemy.radius, y: enemy.y + Math.sin(angle) * enemy.radius, vx: Math.cos(angle) * 370, vy: Math.sin(angle) * 370, radius: enemy.boss ? 7 : 5, damage, life: 3, color: enemy.color });
  }
  function updateProjectiles(dt) {
    const s = UI.session;
    for (const bullet of [...s.projectiles]) {
      bullet.x += bullet.vx * dt; bullet.y += bullet.vy * dt; bullet.life -= dt;
      for (const enemy of [...s.enemies]) {
        if (enemy.dead || bullet.hit.has(enemy)) continue;
        if (Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y) <= enemy.radius + bullet.radius) {
          bullet.hit.add(enemy); damageEnemy(enemy, bullet.damage * (enemy.boss ? s.player.bossDamage : 1), bullet.crit, bullet.splash);
          if (bullet.pierce > 0) bullet.pierce -= 1; else bullet.life = 0;
          if (bullet.life <= 0) break;
        }
      }
    }
    s.projectiles = s.projectiles.filter(b => b.life > 0 && b.x > -30 && b.y > -30 && b.x < WORLD_W + 30 && b.y < WORLD_H + 30);
    for (const bullet of [...s.enemyProjectiles]) {
      bullet.x += bullet.vx * dt; bullet.y += bullet.vy * dt; bullet.life -= dt;
      if (Math.hypot(s.player.x - bullet.x, s.player.y - bullet.y) <= s.player.radius + bullet.radius) { damagePlayer(bullet.damage, bullet); bullet.life = 0; }
    }
    s.enemyProjectiles = s.enemyProjectiles.filter(b => b.life > 0);
  }
  function damageEnemy(enemy, amount, crit = false, splash = 0) {
    const s = UI.session; if (!enemy || enemy.dead) return;
    const mitigated = amount * (1 - Number(enemy.armor || 0)); enemy.hp -= mitigated; enemy.hitFlash = .11;
    addDamageText(enemy.x, enemy.y - enemy.radius, Math.round(mitigated), crit ? "#ffe359" : "#fff", crit ? 25 : 18); spawnParticles(enemy.x, enemy.y, crit ? "#ffe359" : enemy.color, crit ? 11 : 6, crit ? 200 : 120);
    if (!s.specialInProgress) chargeSpecial(Math.min(3.5, .35 + mitigated * .012));
    if (s.player.lifesteal > 0) s.player.hp = Math.min(s.player.maxHp, s.player.hp + mitigated * s.player.lifesteal);
    if (splash > 0) for (const other of s.enemies) if (other !== enemy && !other.dead && distance(other, enemy) <= splash) { other.hp -= mitigated * .35; other.hitFlash = .08; if (other.hp <= 0) killEnemy(other); }
    if (enemy.hp <= 0) killEnemy(enemy);
  }
  function killEnemy(enemy) {
    const s = UI.session; if (enemy.dead) return; enemy.dead = true;
    const index = s.enemies.indexOf(enemy); if (index >= 0) s.enemies.splice(index, 1);
    if (s.boss === enemy) s.boss = null;
    s.kills += 1; chargeSpecial(enemy.boss ? 16 : enemy.elite ? 6 : 2.2); const gained = Math.round(enemy.score * (1 + s.wave * .035)); s.score += gained;
    addFightXp(Math.round(enemy.xp * (1 + s.wave * .025)));
    spawnParticles(enemy.x, enemy.y, enemy.color, enemy.boss ? 38 : 15, enemy.boss ? 330 : 190);
    if (enemy.split && !enemy.boss && s.enemies.length < 100) for (let i = 0; i < 2; i++) { const child = { ...ENEMIES.runner, type: "runner", x: enemy.x + rand(-20,20), y: enemy.y + rand(-20,20), maxHp: enemy.maxHp * .28, hp: enemy.maxHp * .28, speed: enemy.speed * 1.15, damage: enemy.damage * .65, attackCooldown: .5, abilityCooldown: 0, hitFlash: 0, angle: 0, phase: rand(0,8), dead:false }; s.enemies.push(child); }
    if (Math.random() < .035 + s.player.lootBonus / 1200) s.pickups.push({ type: Math.random() < .35 ? "heal" : "credit", x: enemy.x, y: enemy.y, value: Math.random() < .35 ? 16 : 10 + s.wave * 2, life: 14, phase: 0 });
    if (enemy.boss) { showCombatMessage(`${enemy.name} BESIEGT`); grantLoot(s.wave, true); }
  }
  function damagePlayer(amount, source) {
    const s = UI.session, p = s.player; if (p.hp <= 0) return;
    if (Math.random() < p.dodge) { addDamageText(p.x, p.y - 30, "DODGE", "#6affd8", 18); return; }
    let damage = Math.max(1, amount * (1 - (p.armorItem?.durability > 0 ? p.armor : 0)));
    if (p.shield > 0) { const used = Math.min(p.shield, damage); p.shield -= used; damage -= used; }
    if (damage > 0) p.hp -= damage;
    p.hitFlash = .2; addDamageText(p.x, p.y - 34, `-${Math.round(amount)}`, "#ff6670", 22); spawnParticles(p.x, p.y, "#ff4f61", 10, 180); playSound(75, .08, "sawtooth", .025);
    if (p.armorItem?.durability > 0) p.armorItem.durability = Math.max(0, p.armorItem.durability - damage * .11);
    if (p.hp <= 0) {
      if (p.revive > 0) { p.revive -= 1; p.hp = p.maxHp * .5; p.shield = p.maxShield; showCombatMessage("PHÖNIX-WIEDERBELEBUNG"); spawnParticles(p.x,p.y,"#ff9a37",45,360); }
      else finishCombat("dead");
    }
  }
  function updatePickups(dt) {
    const s = UI.session, p = s.player;
    for (const item of s.pickups) {
      item.life -= dt; item.phase += dt * 4;
      const d = Math.hypot(p.x - item.x, p.y - item.y);
      if (d < 110) { item.x += (p.x - item.x) * dt * 6; item.y += (p.y - item.y) * dt * 6; }
      if (d < p.radius + 15) {
        item.life = 0;
        if (item.type === "heal") { p.hp = Math.min(p.maxHp, p.hp + item.value); addDamageText(p.x,p.y-25,`+${item.value}`,"#5bffae",18); }
        else { s.moneyEarned += item.value; s.score += item.value * 5; addDamageText(p.x,p.y-25,`+${item.value} €`,"#ffd55e",17); }
      }
    }
    s.pickups = s.pickups.filter(item => item.life > 0);
  }
  function updateParticles(dt) {
    const s = UI.session;
    for (const p of s.particles) { p.life -= dt; if (p.type === "dot") { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(.04, dt); p.vy *= Math.pow(.04, dt); } else if (p.type === "ring" || p.type === "blast") p.radius += (p.maxRadius - p.radius) * dt * 7; }
    for (const t of s.texts) { t.life -= dt; t.y -= 30 * dt; }
    s.particles = s.particles.filter(p => p.life > 0); s.texts = s.texts.filter(t => t.life > 0);
  }
  function spawnParticles(x, y, color, count = 6, speed = 120) {
    const s = UI.session; if (!s) return; const quality = ensureState().settings.particles === "low" ? .45 : 1;
    for (let i = 0; i < Math.round(count * quality); i++) { const a = rand(0, Math.PI * 2), v = rand(speed * .3, speed); s.particles.push({ type: "dot", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, size: rand(2,6), life: rand(.18,.55), maxLife:.55, color }); }
  }
  function addDamageText(x, y, text, color, size) { UI.session?.texts.push({ x, y, text: String(text), color, size, life: .8, maxLife: .8 }); }
  function completeWave(wave) {
    const s = UI.session; if (!s) return;
    const reward = Math.round(60 + wave * 24); s.moneyEarned += reward; s.score += wave * 250;
    if (wave % 3 === 0) grantLoot(wave, false);
    if (wave % 5 === 0) { s.player.hp = Math.min(s.player.maxHp, s.player.hp + s.player.maxHp * .18); s.player.shield = Math.min(s.player.maxShield, s.player.shield + s.player.maxShield * .25); }
    safeSave();
  }
  function grantLoot(wave, boss) {
    const data = ensureState(); if (data.inventory.length >= INVENTORY_LIMIT) { UI.session.moneyEarned += boss ? 1200 : 300; return; }
    const roll = Math.random() * 100; let rarity = "common"; const bonus = Math.min(38, wave * .38) + (boss ? 18 : 0) + UI.session.player.lootBonus * .25;
    if (roll < .05 + bonus * .002 && wave >= 65 && data.level >= 15) rarity = "exotic";
    else if (roll < .18 + bonus * .006 && wave >= 45 && data.level >= 10) rarity = "mythic";
    else if (roll < .75 + bonus * .025 && wave >= 32) rarity = "special";
    else if (roll < 2.8 + bonus * .11 && wave >= 20) rarity = "legendary";
    else if (roll < 9 + bonus * .27 && wave >= 10) rarity = "epic";
    else if (roll < 27 + bonus * .46) rarity = "rare";
    else if (roll < 60 + bonus * .52) rarity = "uncommon";
    let pool = ITEMS.filter(item => item.rarity === rarity && data.level >= Math.max(item.minLevel || 1, RARITIES[item.rarity].minLevel || 1));
    if (!pool.length) pool = ITEMS.filter(item => item.rarity === "common");
    const def = pick(pool); const star = wave >= 80 && Math.random() < .08 ? 1 : 0; const item = makeItem(def.id, star, null, rarity);
    data.inventory.unshift(item); UI.session.lootEarned.push(item); safeSave(); toast("Beute erhalten", `${RARITIES[rarity].name}: ${def.name} ${starText(star)}`);
  }
  function addFightXp(amount) {
    const data = ensureState(); let gain = Math.max(0, Math.floor(amount)); data.totalXp += gain;
    while (gain > 0 && data.level < MAX_LEVEL) {
      const need = levelNeed(data.level), part = Math.min(gain, need - data.xp); data.xp += part; gain -= part;
      if (data.xp >= need) { data.xp = 0; data.level += 1; UI.session && (UI.session.player.maxHp += 3, UI.session.player.hp += 3); showCombatMessage(`FIGHT-LEVEL ${data.level}`); playSound(850,.12,"triangle"); }
    }
    if (data.level >= MAX_LEVEL) data.xp = 0;
  }
  function updateHud() {
    const s = UI.session; if (!s || !UI.main) return; const p = s.player, data = ensureState(); const need = levelNeed(data.level);
    const hpPct = clamp(p.hp / p.maxHp * 100, 0, 100); const xpPct = data.level >= MAX_LEVEL ? 100 : clamp(data.xp / need * 100,0,100);
    const set = (sel,value) => { const node=UI.main.querySelector(sel); if(node) node.textContent=value; };
    set("[data-fkl-hp-text]",`${Math.ceil(p.hp)}/${p.maxHp}`); set("[data-fkl-shield]",Math.ceil(p.shield)); set("[data-fkl-wave]",`WELLE ${s.wave}`); set("[data-fkl-kills]",s.kills); set("[data-fkl-score]",NUMBER.format(Math.floor(s.score))); set("[data-fkl-weapon-name]",p.weapon.name||"Waffe");
    set("[data-fkl-ammo]",p.weapon.attack==="melee"?"NAHKAMPF":p.reloading?"NACHLADEN":`${p.ammo}/${Math.round(p.weapon.magazine||1)}`); set("[data-fkl-durability]",p.weaponItem?`Haltbarkeit ${Math.ceil(p.weaponItem.durability)}/${itemMaxDurability(p.weaponItem)}`:"");
    const hpBar=UI.main.querySelector("[data-fkl-hp-bar]"),xpBar=UI.main.querySelector("[data-fkl-xp-bar]");if(hpBar)hpBar.style.width=`${hpPct}%`;if(xpBar)xpBar.style.width=`${xpPct}%`;
    const specialButton=UI.main.querySelector("[data-fkl-special]"),specialBar=UI.main.querySelector("[data-fkl-special-bar]"); if(specialBar)specialBar.style.width=`${p.specialCharge}%`; set("[data-fkl-special-text]",p.specialReady?"BEREIT":`${Math.floor(p.specialCharge)} %`); specialButton?.classList.toggle("ready",!!p.specialReady);
    const bossWrap=UI.main.querySelector("[data-fkl-boss-wrap]");if(bossWrap){bossWrap.hidden=!s.boss;if(s.boss){set("[data-fkl-boss-name]",s.boss.name);const bar=UI.main.querySelector("[data-fkl-boss-bar]");if(bar)bar.style.width=`${clamp(s.boss.hp/s.boss.maxHp*100,0,100)}%`;}}
  }

  function drawCombat(now) {
    const s = UI.session; if (!s?.ctx) return; const ctx = s.ctx, dpr = s.dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,s.viewW,s.viewH);
    drawGround(ctx,s); drawDecorations(ctx,s);
    for (const pickup of s.pickups) drawPickup(ctx,s,pickup);
    for (const bullet of s.projectiles) drawBullet(ctx,s,bullet,false);
    for (const bullet of s.enemyProjectiles) drawBullet(ctx,s,bullet,true);
    for (const enemy of s.enemies) drawEnemy(ctx,s,enemy,now);
    drawPlayer(ctx,s,now);
    drawParticles(ctx,s);
    drawTexts(ctx,s);
  }
  function sx(s,x){return x-s.camera.x+s.viewW/2} function sy(s,y){return y-s.camera.y+s.viewH/2}
  function drawGround(ctx,s){
    const grad=ctx.createLinearGradient(0,0,0,s.viewH);grad.addColorStop(0,"#10252a");grad.addColorStop(1,"#061013");ctx.fillStyle=grad;ctx.fillRect(0,0,s.viewW,s.viewH);
    const grid=72, ox=(( -s.camera.x+s.viewW/2)%grid+grid)%grid, oy=(( -s.camera.y+s.viewH/2)%grid+grid)%grid;
    ctx.strokeStyle="#2c4b4d55";ctx.lineWidth=1;ctx.beginPath();for(let x=ox;x<s.viewW;x+=grid){ctx.moveTo(x,0);ctx.lineTo(x,s.viewH)}for(let y=oy;y<s.viewH;y+=grid){ctx.moveTo(0,y);ctx.lineTo(s.viewW,y)}ctx.stroke();
    ctx.strokeStyle="#49e6b31c";ctx.lineWidth=2;const big=grid*5, bx=(( -s.camera.x+s.viewW/2)%big+big)%big, by=(( -s.camera.y+s.viewH/2)%big+big)%big;ctx.beginPath();for(let x=bx;x<s.viewW;x+=big){ctx.moveTo(x,0);ctx.lineTo(x,s.viewH)}for(let y=by;y<s.viewH;y+=big){ctx.moveTo(0,y);ctx.lineTo(s.viewW,y)}ctx.stroke();
    const edgeX=sx(s,0),edgeY=sy(s,0),edgeR=sx(s,WORLD_W),edgeB=sy(s,WORLD_H);ctx.strokeStyle="#5bf0bd77";ctx.lineWidth=5;ctx.strokeRect(edgeX,edgeY,edgeR-edgeX,edgeB-edgeY);
  }
  function drawDecorations(ctx,s){for(const d of s.decorations){const x=sx(s,d.x),y=sy(s,d.y);if(x<-60||y<-60||x>s.viewW+60||y>s.viewH+60)continue;ctx.save();ctx.translate(x,y);ctx.rotate(d.rot);if(d.type==="crack"){ctx.strokeStyle="#010608aa";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-d.size,0);ctx.lineTo(-d.size*.25,-d.size*.2);ctx.lineTo(0,d.size*.1);ctx.lineTo(d.size*.55,-d.size*.3);ctx.lineTo(d.size,0);ctx.stroke()}else if(d.type==="crate"){ctx.fillStyle="#23383c";ctx.strokeStyle="#416166";ctx.lineWidth=2;ctx.fillRect(-d.size/2,-d.size/2,d.size,d.size);ctx.strokeRect(-d.size/2,-d.size/2,d.size,d.size);ctx.beginPath();ctx.moveTo(-d.size/2,-d.size/2);ctx.lineTo(d.size/2,d.size/2);ctx.moveTo(d.size/2,-d.size/2);ctx.lineTo(-d.size/2,d.size/2);ctx.stroke()}else{const g=ctx.createRadialGradient(0,0,0,0,0,d.size*2);g.addColorStop(0,"#4bf0bf44");g.addColorStop(1,"transparent");ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,d.size*2,0,Math.PI*2);ctx.fill()}ctx.restore()}}
  function drawPlayer(ctx,s,now) {
    const p=s.player,x=sx(s,p.x),y=sy(s,p.y),walk=p.moving?Math.sin(now*.014)*5:0,bob=p.moving?Math.abs(Math.sin(now*.014))*2:0;
    const style=p.cosmetics||CHARACTER_STYLES[0], aimX=Math.cos(p.angle), aimY=Math.sin(p.angle); ctx.save(); ctx.translate(x,y);
    ctx.globalAlpha=.38;ctx.fillStyle="#000";ctx.beginPath();ctx.ellipse(0,30,24,10,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    // Beine und Schuhe aus leicht erhöhter Rückenperspektive.
    ctx.strokeStyle="#20262b";ctx.lineWidth=10;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(-7,12);ctx.lineTo(-9+walk,34);ctx.moveTo(7,12);ctx.lineTo(9-walk,34);ctx.stroke();
    ctx.strokeStyle=style.accent;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-10+walk,35);ctx.lineTo(-16+walk,39);ctx.moveTo(10-walk,35);ctx.lineTo(16-walk,39);ctx.stroke();
    // Torso/Jacket von hinten, oben schmaler und unten breiter.
    ctx.fillStyle=p.hitFlash>0?"#fff":style.body;ctx.strokeStyle=style.trim;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-17,-14-bob);ctx.quadraticCurveTo(-22,-2, -15,18);ctx.lineTo(15,18);ctx.quadraticCurveTo(22,-2,17,-14-bob);ctx.quadraticCurveTo(0,-23-bob,-17,-14-bob);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle=style.accent;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-18-bob);ctx.lineTo(0,15);ctx.stroke();
    // Kopf/Haar - sichtbar von hinten statt flach liegend.
    ctx.fillStyle="#c98e72";ctx.beginPath();ctx.ellipse(0,-26-bob,11,13,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#241b19";ctx.beginPath();ctx.arc(0,-29-bob,11,Math.PI,Math.PI*2);ctx.lineTo(10,-25-bob);ctx.quadraticCurveTo(0,-35-bob,-10,-25-bob);ctx.fill();
    // Arme und Waffe werden in Zielrichtung geneigt, Körper bleibt aufrecht.
    const side=aimX>=0?1:-1;ctx.strokeStyle="#c98e72";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-15,-8-bob);ctx.lineTo(-22,-1+walk*.35);ctx.moveTo(15,-8-bob);ctx.lineTo(22,-1-walk*.35);ctx.stroke();
    const w=p.weapon, wx=side*12, wy=-8-bob;ctx.save();ctx.translate(wx,wy);ctx.rotate(p.angle+Math.PI/2);ctx.strokeStyle=RARITIES[w.rarity]?.color||"#ddd";ctx.lineWidth=w.attack==="melee"?7:5;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(0,5);ctx.lineTo(0,-(w.attack==="melee"?42:30));ctx.stroke();if(p.attackAnim>0){ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=18;ctx.fillStyle=ctx.strokeStyle;ctx.beginPath();ctx.arc(0,-32,5,0,Math.PI*2);ctx.fill();}ctx.restore();
    if(p.specialReady){ctx.strokeStyle=SPECIALS[p.specialType]?.color||"#fff";ctx.lineWidth=3;ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=16;ctx.beginPath();ctx.arc(0,-2,31+Math.sin(now*.01)*3,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
  }
  function drawEnemy(ctx,s,e,now) {
    const x=sx(s,e.x),y=sy(s,e.y);if(x<-100||y<-100||x>s.viewW+100||y>s.viewH+100)return;ctx.save();ctx.translate(x,y);ctx.rotate(e.angle+Math.PI/2);
    ctx.globalAlpha=.35;ctx.fillStyle="#000";ctx.beginPath();ctx.ellipse(0,e.radius*.7,e.radius*1.05,e.radius*.55,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=e.phaseEnemy?.82:1;ctx.shadowColor=e.color;ctx.shadowBlur=e.boss?25:e.elite?18:10;ctx.fillStyle=e.hitFlash>0?"#fff":e.color;ctx.beginPath();
    if(e.type==="runner"||e.type==="phantom"){ctx.moveTo(0,-e.radius);ctx.lineTo(e.radius*.8,e.radius);ctx.lineTo(-e.radius*.8,e.radius);ctx.closePath();}
    else if(e.type==="drone"){ctx.moveTo(0,-e.radius);ctx.lineTo(e.radius,0);ctx.lineTo(0,e.radius);ctx.lineTo(-e.radius,0);ctx.closePath();}
    else if(e.type==="tank"){ctx.roundRect(-e.radius*.9,-e.radius*.75,e.radius*1.8,e.radius*1.5,5);}
    else if(e.type==="bomber"){ctx.arc(0,0,e.radius,0,Math.PI*2);}
    else{ctx.roundRect(-e.radius*.7,-e.radius,e.radius*1.4,e.radius*2,e.radius*.55);}ctx.fill();ctx.shadowBlur=0;
    ctx.fillStyle="#101719";ctx.beginPath();ctx.arc(0,-e.radius*.35,e.radius*.38,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(-e.radius*.16,-e.radius*.38,2.2,0,Math.PI*2);ctx.arc(e.radius*.16,-e.radius*.38,2.2,0,Math.PI*2);ctx.fill();
    if(e.ranged){ctx.strokeStyle="#d8f5ff";ctx.lineWidth=e.type==="tank"?7:4;ctx.beginPath();ctx.moveTo(0,-e.radius*.2);ctx.lineTo(0,-e.radius*1.45);ctx.stroke();}
    if(e.healer){ctx.strokeStyle="#fff";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-7,0);ctx.lineTo(7,0);ctx.moveTo(0,-7);ctx.lineTo(0,7);ctx.stroke();}
    if(e.elite){ctx.strokeStyle="#ffd55c";ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,e.radius*1.18,0,Math.PI*2);ctx.stroke();}
    if(e.boss){ctx.strokeStyle="#fff";ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,e.radius*1.2,0,Math.PI*2);ctx.stroke();}
    if(e.statusTimer>0){ctx.strokeStyle=e.statusType==="emp"?"#4ffff0":e.statusType==="stasis"?"#8f9bff":"#67dfff";ctx.lineWidth=4;ctx.setLineDash([5,5]);ctx.beginPath();ctx.arc(0,0,e.radius*1.35,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}ctx.restore();
    const pct=clamp(e.hp/e.maxHp,0,1);ctx.fillStyle="#020607aa";ctx.fillRect(x-e.radius,y-e.radius-14,e.radius*2,6);ctx.fillStyle=e.elite?"#ffd55c":e.color;ctx.fillRect(x-e.radius,y-e.radius-14,e.radius*2*pct,6);
  }
  function drawBullet(ctx,s,b,enemy){const x=sx(s,b.x),y=sy(s,b.y);ctx.save();ctx.fillStyle=b.color;ctx.shadowColor=b.color;ctx.shadowBlur=enemy?12:16;ctx.beginPath();ctx.arc(x,y,b.radius,0,Math.PI*2);ctx.fill();ctx.restore()}
  function drawPickup(ctx,s,p){const x=sx(s,p.x),y=sy(s,p.y+Math.sin(p.phase)*4);ctx.save();ctx.translate(x,y);ctx.shadowColor=p.type==="heal"?"#4dffad":"#ffd55a";ctx.shadowBlur=18;ctx.fillStyle=p.type==="heal"?"#4dffad":"#ffd55a";ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.fill();ctx.fillStyle="#06100e";ctx.font="bold 13px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(p.type==="heal"?"+":"€",0,0);ctx.restore()}
  function drawParticles(ctx,s) {
    for(const p of s.particles){const x=sx(s,p.x),y=sy(s,p.y),a=clamp(p.life/(p.maxLife||.5),0,1);ctx.save();ctx.globalAlpha=a;
      if(p.type==="dot"){ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=9;ctx.fillRect(x-p.size/2,y-p.size/2,p.size,p.size);}
      else if(p.type==="slash"){ctx.strokeStyle=p.color;ctx.lineWidth=10*a;ctx.shadowColor=p.color;ctx.shadowBlur=18;ctx.beginPath();ctx.arc(x,y,p.radius*.72,p.angle-1.05,p.angle+1.05);ctx.stroke();}
      else if(p.type==="ring"||p.type==="blast"){ctx.strokeStyle=p.color;ctx.fillStyle=p.type==="blast"?`${p.color}22`:"transparent";ctx.lineWidth=(p.type==="blast"?16:8)*a;ctx.shadowColor=p.color;ctx.shadowBlur=22;ctx.beginPath();ctx.arc(x,y,p.radius,0,Math.PI*2);if(p.type==="blast")ctx.fill();ctx.stroke();}
      else if(p.type==="beam"){ctx.strokeStyle=p.color;ctx.lineWidth=5*a;ctx.shadowColor=p.color;ctx.shadowBlur=18;ctx.beginPath();ctx.moveTo(x,y);const x2=sx(s,p.x2),y2=sy(s,p.y2),mx=(x+x2)/2+rand(-12,12),my=(y+y2)/2+rand(-12,12);ctx.lineTo(mx,my);ctx.lineTo(x2,y2);ctx.stroke();}
      ctx.restore();
    }
  }
  function drawTexts(ctx,s){ctx.textAlign="center";ctx.textBaseline="middle";for(const t of s.texts){ctx.save();ctx.globalAlpha=clamp(t.life/t.maxLife,0,1);ctx.font=`900 ${t.size}px system-ui`;ctx.lineWidth=4;ctx.strokeStyle="#000";ctx.strokeText(t.text,sx(s,t.x),sy(s,t.y));ctx.fillStyle=t.color;ctx.fillText(t.text,sx(s,t.x),sy(s,t.y));ctx.restore()}}
  function pauseCombat(){const s=UI.session;if(!s||s.ended)return;s.paused=true;const modal=showModal(`<small class="fkl-kicker">KAMPF PAUSIERT</small><h3>Fight.KL</h3><p>Der Lauf bleibt an dieser Stelle stehen.</p><div class="fkl-modal-actions"><button class="fkl-btn primary" type="button" data-fkl-resume>Weiterspielen</button><button class="fkl-btn" type="button" data-fkl-exit>Run beenden</button></div>`);modal.querySelector("[data-fkl-resume]").addEventListener("click",()=>{modal.remove();s.paused=false;UI.last=performance.now()});modal.querySelector("[data-fkl-exit]").addEventListener("click",showExitConfirm)}
  function showExitConfirm(){const s=UI.session;if(!s)return returnToTopGames();s.paused=true;const modal=showModal(`<div style="font-size:55px">⚠️</div><h3>Run wirklich verlassen?</h3><p>Die aktuelle Welle und der noch nicht ausgezahlte Run-Bonus gehen verloren. Bereits gefundene Items bleiben erhalten.</p><div class="fkl-modal-actions"><button class="fkl-btn primary" type="button" data-fkl-stay>Im Kampf bleiben</button><button class="fkl-btn danger" type="button" data-fkl-confirm-exit>Run verlassen</button></div>`);modal.querySelector("[data-fkl-stay]").addEventListener("click",()=>{modal.remove();s.paused=false;UI.last=performance.now()});modal.querySelector("[data-fkl-confirm-exit]").addEventListener("click",()=>{modal.remove();finishCombat("exit")})}
  function finishCombat(reason="dead"){
    const s=UI.session;if(!s||s.ended)return;s.ended=true;cancelAnimationFrame(UI.raf);UI.raf=0;s.resizeObserver?.disconnect();
    const data=ensureState(),durationMs=Math.max(1000,performance.now()-s.startedAt),completedWave=Math.max(0,s.wave-(s.waveStarted?1:0));data.runs+=1;data.totalKills+=s.kills;data.bestWave=Math.max(data.bestWave,completedWave);data.bestScore=Math.max(data.bestScore,Math.floor(s.score));
    const reward=reason==="dead"?Math.min(250000,Math.round(s.moneyEarned+completedWave*115+s.kills*7+s.score/900)):0;if(reward)awardMoney(reward,"Fight.KL Run-Bonus");safeSave();updateHead();
    if(reason==="dead")submitScore({score:s.score,wave:completedWave,kills:s.kills,durationMs}).then(()=>{});
    const loot=s.lootEarned.slice(-5).map(item=>`${itemDef(item).icon} ${itemDef(item).name} ${starText(item.star)}`).join("<br>")||"Keine besonderen Items";
    const modal=showModal(`<div style="font-size:64px">${reason==="dead"?"☠️":"🚪"}</div><small class="fkl-kicker">${reason==="dead"?"RUN BEENDET":"RUN VERLASSEN"}</small><h3>${reason==="dead"?`Welle ${completedWave} erreicht`:"Kampf verlassen"}</h3><div class="fkl-summary-grid"><div><small>Kills</small><b>${s.kills}</b></div><div><small>Score</small><b>${NUMBER.format(Math.floor(s.score))}</b></div><div><small>Belohnung</small><b>${EURO.format(reward)}</b></div><div><small>Fight-Level</small><b>${data.level}</b></div><div><small>Beste Welle</small><b>${data.bestWave}</b></div><div><small>Dauer</small><b>${Math.floor(durationMs/60000)}:${String(Math.floor(durationMs/1000)%60).padStart(2,"0")}</b></div></div><p><b>Gefundene Items</b><br>${loot}</p><div class="fkl-modal-actions"><button class="fkl-btn primary" type="button" data-fkl-again>Noch einmal</button><button class="fkl-btn" type="button" data-fkl-summary-inventory>Inventar</button><button class="fkl-btn" type="button" data-fkl-summary-home>Hauptmenü</button></div>`);
    modal.querySelector("[data-fkl-again]").addEventListener("click",()=>{modal.remove();UI.session=null;startCombat()});modal.querySelector("[data-fkl-summary-inventory]").addEventListener("click",()=>{modal.remove();UI.session=null;renderInventory()});modal.querySelector("[data-fkl-summary-home]").addEventListener("click",()=>{modal.remove();UI.session=null;renderDashboard()});
  }
  function stopCombat(saveState=true){const s=UI.session;if(!s)return;cancelAnimationFrame(UI.raf);UI.raf=0;s.resizeObserver?.disconnect();UI.session=null;UI.pointer.fire=false;if(saveState)safeSave()}
  function onKeyDown(event) {
    if(!UI.overlay)return; UI.keys[event.code]=true;
    if(event.code==="Escape"){event.preventDefault();if(UI.session)pauseCombat();else returnToTopGames();}
    if(event.code==="KeyR"&&UI.session){event.preventDefault();beginReload();}
    if((event.code==="KeyE"||event.code==="KeyQ")&&UI.session){event.preventDefault();triggerSpecial();}
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(event.code))event.preventDefault();
  }
  function onKeyUp(event){UI.keys[event.code]=false}
  function playSound(frequency,duration=.06,type="sine",gain=.025){const data=ensureState();if(!data?.settings?.sound)return;try{UI.audio||=(new(window.AudioContext||window.webkitAudioContext)());if(UI.audio.state==="suspended")UI.audio.resume();const o=UI.audio.createOscillator(),g=UI.audio.createGain();o.type=type;o.frequency.value=frequency;g.gain.setValueAtTime(gain,UI.audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,UI.audio.currentTime+duration);o.connect(g).connect(UI.audio.destination);o.start();o.stop(UI.audio.currentTime+duration)}catch{}}

  window.FightKL=Object.freeze({version:VERSION,open,close,returnToTopGames});
})();
