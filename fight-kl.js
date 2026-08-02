(() => {
  "use strict";

  const VERSION = "20260802-fight-kl-v134-coop-handshake-clock-hp-fix";
  const MAX_LEVEL = 100;
  const MAX_STAR = 5;
  const INVENTORY_LIMIT = 420;
  const CANVAS_W = 1280;
  const CANVAS_H = 720;
  const WORLD_W = 2200;
  const WORLD_H = 1400;
  const SCORE_FUNCTION = "fightKlSubmitScore";
  const LEADERBOARD_FUNCTION = "fightKlGetLeaderboard";
  const DUEL_JOIN_FUNCTION = "fightKlJoinDuel";
  const DUEL_GET_FUNCTION = "fightKlGetDuel";
  const DUEL_ACTION_FUNCTION = "fightKlDuelAction";
  const DUEL_LEAVE_FUNCTION = "fightKlLeaveDuel";
  const COOP_LOBBY_PATH = ["fightKlCoopSystem", "publicLobby"];
  const COOP_MATCH_COLLECTION = "fightKlCoopMatches";
  const COOP_INVITE_COLLECTION = "fightKlCoopInvites";
  const COOP_SNAPSHOT_INTERVAL = 170;
  const COOP_INPUT_INTERVAL = 75;
  const EURO = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const NUMBER = new Intl.NumberFormat("de-DE");
  const ARSENAL_STRENGTH_MULTIPLIER = 0.5;

  const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary", "special", "mythic", "exotic", "universe"];
  const RARITIES = {
    common: { name: "Gewöhnlich", color: "#9aa6ad", glow: "#9aa6ad55", mult: 1, price: 280, drop: 54, minLevel: 1 },
    uncommon: { name: "Ungewöhnlich", color: "#52da79", glow: "#52da7966", mult: 1.2, price: 950, drop: 25, minLevel: 1 },
    rare: { name: "Selten", color: "#4ca8ff", glow: "#4ca8ff77", mult: 1.5, price: 4200, drop: 12, minLevel: 1 },
    epic: { name: "Episch", color: "#b76cff", glow: "#b76cff88", mult: 1.9, price: 16500, drop: 5.5, minLevel: 1 },
    legendary: { name: "Legendär", color: "#ffb52e", glow: "#ff9f2888", mult: 2.42, price: 52000, drop: 2.5, minLevel: 1 },
    special: { name: "Special", color: "#ff4e78", glow: "#ff4e7899", mult: 3.05, price: 82000, drop: .85, minLevel: 1 },
    mythic: { name: "Mystisch", color: "#ffd36a", glow: "#ff4bbaaa", mult: 3.82, price: 172000, drop: .18, minLevel: 10, gradient: "linear-gradient(135deg,#ff335f,#4a8cff,#ffd35c,#ff335f)" },
    exotic: { name: "Exotisch", color: "#63f8ff", glow: "#63f8ffbb", mult: 4.75, price: 345000, drop: .04, minLevel: 15, gradient: "linear-gradient(135deg,#5fffff,#ffd35a,#ff4fd8,#5fffff)" },
    universe: { name: "Universe", color: "#ffffff", glow: "#b86cffdd", mult: 5.9, price: 650000, drop: .004, minLevel: 50, gradient: "linear-gradient(135deg,#ffffff,#7ffcff,#9b6cff,#ff65dc,#ffd75f,#ffffff)" }
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

  const ARENA_THEMES = [
    { id: "grid-core", name: "Neon-Kern", bgTop: "#10252a", bgBottom: "#061013", grid: "#2c4b4d55", gridMajor: "#49e6b31c", border: "#5bf0bd77", light: ["#4bf0bf44", "transparent"], crateFill: "#23383c", crateStroke: "#416166", crack: "#010608aa" },
    { id: "ember-zone", name: "Glut-Zone", bgTop: "#311512", bgBottom: "#120506", grid: "#7a3d3150", gridMajor: "#ff8b511e", border: "#ff9b6c88", light: ["#ff955544", "transparent"], crateFill: "#473126", crateStroke: "#8d6044", crack: "#1b0907cc" },
    { id: "toxic-marsh", name: "Toxic-Sumpf", bgTop: "#10261b", bgBottom: "#051009", grid: "#2f64475a", gridMajor: "#7dff8c1f", border: "#9bff7988", light: ["#7dff8c4f", "transparent"], crateFill: "#243a2c", crateStroke: "#4a845d", crack: "#041208cc" },
    { id: "frost-array", name: "Frost-Sektor", bgTop: "#132633", bgBottom: "#050d14", grid: "#4f6d8750", gridMajor: "#96d2ff20", border: "#9ddbff88", light: ["#a7e4ff48", "transparent"], crateFill: "#243845", crateStroke: "#5b7a95", crack: "#071019cc" },
    { id: "void-prism", name: "Void-Prisma", bgTop: "#221230", bgBottom: "#09040f", grid: "#5e3f7d52", gridMajor: "#f66dff1c", border: "#f48fff8d", light: ["#ed74ff44", "transparent"], crateFill: "#312243", crateStroke: "#8f6ab0", crack: "#14071ecc" }
  ];

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
    ,{ id: "light-revolver", name: "Leichter Revolver", icon: "🔫", category: "weapon", family: "pistol", rarity: "common", attack: "gun", damage: 31, fireRate: 1.7, magazine: 6, reload: 1.45, range: 640, durability: 980, price: 620, text: "Klassischer Revolver mit sauberem Rückstoß." }
    ,{ id: "tactical-pistol", name: "Taktikpistole", icon: "🔫", category: "weapon", family: "pistol", rarity: "uncommon", attack: "gun", damage: 35, fireRate: 3.8, magazine: 15, reload: 1.05, range: 700, spread: .022, durability: 1150, price: 2100, text: "Präzise Pistole mit großem Magazin." }
    ,{ id: "hand-cannon", name: "Handkanone", icon: "💢", category: "weapon", family: "pistol", rarity: "epic", attack: "gun", damage: 104, fireRate: 1.35, magazine: 5, reload: 1.8, range: 820, durability: 1500, pierce: 1, price: 24800, text: "Massiver Einzelschaden und hoher Durchschlag." }
    ,{ id: "pulse-sidearm", name: "Impulspistole", icon: "🔷", category: "weapon", family: "pistol", rarity: "special", attack: "gun", damage: 96, fireRate: 4.4, magazine: 18, reload: 1.1, range: 850, durability: 2050, special: "emp", price: 89000, text: "Special-Seitenwaffe mit EMP-Aufladung." }
    ,{ id: "nova-sidearm", name: "Nova-Pistole", icon: "🌠", category: "weapon", family: "pistol", rarity: "mythic", minLevel: 10, attack: "gun", damage: 128, fireRate: 4.8, magazine: 21, reload: 1.0, range: 920, durability: 2500, splash: 28, special: "explosion", price: 174000, text: "Mystische Seitenwaffe mit Nova-Explosion." }
    ,{ id: "rift-sidearm", name: "Riss-Pistole", icon: "🌀", category: "weapon", family: "pistol", rarity: "exotic", minLevel: 15, attack: "gun", damage: 172, fireRate: 5.1, magazine: 24, reload: .92, range: 980, durability: 3200, pierce: 2, special: "stasis", price: 348000, text: "Exotische Pistole mit Stasis-Projektilen." }

    ,{ id: "compact-carbine", name: "Kompaktkarabiner", icon: "🎯", category: "weapon", family: "automatic", rarity: "common", attack: "gun", damage: 20, fireRate: 6.2, magazine: 24, reload: 1.55, range: 720, spread: .045, durability: 1250, price: 980, text: "Leichter Karabiner für mittlere Distanz." }
    ,{ id: "patrol-rifle", name: "Patrouillengewehr", icon: "🎯", category: "weapon", family: "automatic", rarity: "uncommon", attack: "gun", damage: 28, fireRate: 6.7, magazine: 30, reload: 1.65, range: 790, spread: .036, durability: 1420, price: 2600, text: "Robustes Allround-Gewehr." }
    ,{ id: "battle-rifle", name: "Gefechtsgewehr", icon: "🎯", category: "weapon", family: "automatic", rarity: "rare", attack: "gun", damage: 48, fireRate: 4.6, magazine: 24, reload: 1.8, range: 940, spread: .02, durability: 1600, price: 8800, text: "Kontrollierte Feuerkraft für gepanzerte Gegner." }
    ,{ id: "rotary-lmg", name: "Rotations-MG", icon: "🔥", category: "weapon", family: "automatic", rarity: "legendary", attack: "gun", damage: 31, fireRate: 15.2, magazine: 120, reload: 3.05, range: 760, spread: .065, durability: 2800, price: 72000, text: "Legendäres Dauerfeuer für große Wellen." }
    ,{ id: "storm-carbine", name: "Sturm-Karabiner", icon: "🌩️", category: "weapon", family: "automatic", rarity: "special", attack: "gun", damage: 61, fireRate: 9.2, magazine: 48, reload: 1.22, range: 920, spread: .018, durability: 2200, special: "chain", price: 94000, text: "Special-Karabiner mit Blitz-Kette." }

    ,{ id: "sawed-shotgun", name: "Abgesägte Schrotflinte", icon: "💥", category: "weapon", family: "shotgun", rarity: "common", attack: "shotgun", damage: 24, pellets: 8, fireRate: .9, magazine: 2, reload: 1.55, range: 380, spread: .31, durability: 900, price: 690, text: "Sehr stark auf kürzeste Entfernung." }
    ,{ id: "tactical-pump", name: "Taktische Pumpgun", icon: "💥", category: "weapon", family: "shotgun", rarity: "uncommon", attack: "shotgun", damage: 26, pellets: 8, fireRate: 1.3, magazine: 8, reload: 1.95, range: 500, spread: .22, durability: 1260, price: 2400, text: "Schnellere Pumpgun mit acht Schuss." }
    ,{ id: "slug-shotgun", name: "Slug-Schrotflinte", icon: "🎯", category: "weapon", family: "shotgun", rarity: "rare", attack: "gun", damage: 116, fireRate: 1.25, magazine: 7, reload: 2.1, range: 760, spread: .01, durability: 1450, pierce: 1, price: 9200, text: "Verschießt einzelne schwere Präzisionsgeschosse." }
    ,{ id: "inferno-shotgun", name: "Inferno-Schrotflinte", icon: "🔥", category: "weapon", family: "shotgun", rarity: "special", attack: "shotgun", damage: 44, pellets: 12, fireRate: 1.95, magazine: 10, reload: 1.72, range: 640, spread: .16, durability: 2350, splash: 70, special: "explosion", price: 96000, text: "Special-Schrotflinte mit Flächenexplosion." }

    ,{ id: "wood-club", name: "Holzkeule", icon: "🪵", category: "weapon", family: "melee", rarity: "common", attack: "melee", damage: 39, fireRate: 1.65, range: 82, arc: 1.75, durability: 1000, price: 250, text: "Einfacher, schneller Nahkampf-Einstieg." }
    ,{ id: "combat-knife", name: "Kampfmesser", icon: "🔪", category: "weapon", family: "melee", rarity: "common", attack: "melee", damage: 44, fireRate: 2.55, range: 72, arc: 1.25, durability: 900, crit: 4, price: 410, text: "Sehr schnelle Angriffe auf kurze Distanz." }
    ,{ id: "shock-baton", name: "Schlagstock", icon: "🦯", category: "weapon", family: "melee", rarity: "uncommon", attack: "melee", damage: 72, fireRate: 1.9, range: 98, arc: 1.85, durability: 1700, price: 1750, text: "Schneller, haltbarer Schlagstock." }
    ,{ id: "fire-axe", name: "Feueraxt", icon: "🪓", category: "weapon", family: "melee", rarity: "rare", attack: "melee", damage: 138, fireRate: 1.25, range: 118, arc: 2.1, durability: 2100, splash: 42, price: 7600, text: "Schwerer Hieb mit kleinem Flächenschaden." }
    ,{ id: "war-hammer", name: "Kriegshammer", icon: "🔨", category: "weapon", family: "melee", rarity: "epic", attack: "melee", damage: 195, fireRate: 1.05, range: 134, arc: 2.35, durability: 2600, splash: 90, price: 26500, text: "Epischer Flächenschlag gegen Gegnergruppen." }
    ,{ id: "twin-blades", name: "Doppelklingen", icon: "⚔️", category: "weapon", family: "melee", rarity: "legendary", attack: "melee", damage: 178, fireRate: 3.25, range: 136, arc: 2.45, durability: 2350, lifesteal: 4, price: 69000, text: "Legendär schnelle Doppelklingen." }

    ,{ id: "padded-jacket", name: "Gepolsterte Jacke", icon: "🧥", category: "armor", rarity: "common", armor: 6, health: 22, durability: 1050, price: 280, text: "Günstiger Basisschutz mit zusätzlichem Leben." }
    ,{ id: "leather-armor", name: "Lederpanzer", icon: "🦺", category: "armor", rarity: "common", armor: 11, health: 14, durability: 1450, price: 520, text: "Leichte und langlebige Rüstung." }
    ,{ id: "riot-vest", name: "Einsatzweste", icon: "🛡️", category: "armor", rarity: "uncommon", armor: 19, health: 42, durability: 1800, price: 2350, text: "Verstärkte Weste für längere Kämpfe." }
    ,{ id: "composite-armor", name: "Kompositrüstung", icon: "🛡️", category: "armor", rarity: "rare", armor: 28, health: 72, durability: 2250, price: 8600, text: "Mehrschichtige Rüstung mit gutem Schutz." }
    ,{ id: "assault-plate", name: "Sturmplatten", icon: "🛡️", category: "armor", rarity: "epic", armor: 37, health: 112, durability: 2800, price: 27800, text: "Epische Frontpanzerung für Elite-Wellen." }
    ,{ id: "reactive-armor", name: "Reaktivpanzerung", icon: "💠", category: "armor", rarity: "legendary", armor: 45, health: 155, shield: 55, durability: 3400, price: 74000, text: "Legendärer Schutz mit zusätzlichem Schild." }

    ,{ id: "cloth-hood", name: "Stoffhaube", icon: "🥷", category: "helmet", rarity: "common", armor: 2, health: 8, price: 180, text: "Leichter Kopfschutz ohne Tempobremse." }
    ,{ id: "work-helmet", name: "Schutzhelm", icon: "⛑️", category: "helmet", rarity: "common", armor: 5, health: 12, durability: 700, price: 360, text: "Solider Basisschutz für den Kopf." }
    ,{ id: "tactical-helmet", name: "Taktikhelm", icon: "🪖", category: "helmet", rarity: "uncommon", armor: 9, health: 20, crit: 2, durability: 1000, price: 1800, text: "Schutz und leicht verbesserte Zielerfassung." }
    ,{ id: "reinforced-helmet", name: "Verstärkter Helm", icon: "🪖", category: "helmet", rarity: "rare", armor: 14, health: 35, crit: 4, durability: 1350, price: 6900, text: "Starker Kopfschutz mit Krit-Bonus." }
    ,{ id: "assault-helmet", name: "Sturmhelm", icon: "🪖", category: "helmet", rarity: "epic", armor: 19, health: 52, crit: 6, shield: 25, durability: 1750, price: 23500, text: "Epischer Helm mit kleinem Energieschild." }
    ,{ id: "commander-helmet", name: "Kommandantenhelm", icon: "👑", category: "helmet", rarity: "legendary", armor: 24, health: 72, crit: 9, shield: 45, durability: 2200, price: 65000, text: "Legendärer Helm mit Ziel- und Schildsystem." }
    ,{ id: "plasma-crown", name: "Plasma-Visier", icon: "🔶", category: "helmet", rarity: "special", armor: 28, health: 95, crit: 11, shield: 70, specialGrant: "emp", durability: 2600, price: 93000, text: "Special-Visier mit EMP-Unterstützung." }
    ,{ id: "oracle-helmet", name: "Orakelhelm", icon: "🔮", category: "helmet", rarity: "mythic", minLevel: 10, armor: 34, health: 125, crit: 15, shield: 100, dodge: 4, durability: 3200, price: 173000, text: "Mystischer Helm mit überlegener Zielerfassung." }
    ,{ id: "astral-helmet", name: "Astralhelm", icon: "🌌", category: "helmet", rarity: "exotic", minLevel: 15, armor: 42, health: 175, crit: 20, shield: 155, dodge: 7, durability: 4100, price: 352000, text: "Exotischer Helm für maximalen Kopfschutz." }

    ,{ id: "worker-suit", name: "Arbeitsanzug", icon: "🥋", category: "suit", rarity: "common", health: 18, armor: 4, speed: 3, price: 320, text: "Einfacher Vollanzug mit ausgewogenen Werten." }
    ,{ id: "scout-suit", name: "Späheranzug", icon: "🥋", category: "suit", rarity: "common", health: 10, speed: 7, dodge: 2, price: 480, text: "Leichter Anzug für schnelle Bewegung." }
    ,{ id: "field-suit", name: "Feldanzug", icon: "🥋", category: "suit", rarity: "uncommon", health: 35, armor: 8, speed: 6, durability: 1400, price: 2200, text: "Robuster Vollanzug für frühe Wellen." }
    ,{ id: "tactical-suit", name: "Taktikanzug", icon: "🦸", category: "suit", rarity: "rare", health: 62, armor: 13, speed: 8, dodge: 4, durability: 1850, price: 8200, text: "Seltener Anzug mit Schutz und Beweglichkeit." }
    ,{ id: "exo-suit", name: "Exo-Anzug", icon: "🤖", category: "suit", rarity: "epic", health: 95, armor: 18, speed: 11, damagePct: 8, durability: 2400, price: 27600, text: "Epischer Vollanzug mit Kraftverstärkung." }
    ,{ id: "sentinel-suit", name: "Sentinel-Anzug", icon: "🦾", category: "suit", rarity: "legendary", health: 145, armor: 24, speed: 14, damagePct: 12, shield: 65, durability: 3000, price: 76000, text: "Legendärer Anzug mit integriertem Schild." }
    ,{ id: "storm-suit", name: "Sturm-Anzug", icon: "🌩️", category: "suit", rarity: "special", health: 190, armor: 29, speed: 18, damagePct: 17, shield: 95, specialGrant: "chain", durability: 3600, price: 97000, text: "Special-Anzug mit Blitz-Unterstützung." }
    ,{ id: "celestial-suit", name: "Himmelsanzug", icon: "✨", category: "suit", rarity: "mythic", minLevel: 10, health: 260, armor: 35, speed: 23, damagePct: 24, shield: 145, regen: 1.4, durability: 4400, price: 181000, text: "Mystischer Vollanzug mit Regeneration." }
    ,{ id: "cosmic-suit", name: "Kosmosanzug", icon: "🌌", category: "suit", rarity: "exotic", minLevel: 15, health: 360, armor: 43, speed: 30, damagePct: 34, shield: 220, regen: 2.3, dodge: 7, durability: 5600, price: 388000, text: "Exotischer Vollanzug mit maximalen Gesamtwerten." }

    ,{ id: "street-sneakers", name: "Straßen-Sneaker", icon: "👟", category: "boots", rarity: "common", speed: 6, price: 220, text: "Günstige Schuhe mit kleinem Tempobonus." }
    ,{ id: "trail-boots", name: "Geländestiefel", icon: "🥾", category: "boots", rarity: "common", speed: 5, armor: 2, price: 340, text: "Stabiler Tritt und etwas Schutz." }
    ,{ id: "jump-boots", name: "Sprungstiefel", icon: "👢", category: "boots", rarity: "uncommon", speed: 10, dodge: 3, price: 1750, text: "Leichte Ausweichbewegungen und mehr Tempo." }
    ,{ id: "vector-boots", name: "Vektor-Schuhe", icon: "💨", category: "boots", rarity: "rare", speed: 17, dodge: 6, price: 7300, text: "Schnelle Richtungswechsel für dichte Wellen." }
    ,{ id: "gravity-boots", name: "Gravitationsstiefel", icon: "🌀", category: "boots", rarity: "legendary", speed: 28, dodge: 13, shield: 30, price: 68000, text: "Legendäre Schuhe mit zusätzlichem Schild." }

    ,{ id: "armor-chip", name: "Panzerungs-Modul", icon: "🛡️", category: "chip", rarity: "common", armor: 5, health: 12, price: 440, text: "Einfaches Modul für zusätzlichen Schutz." }
    ,{ id: "magazine-chip", name: "Magazin-Modul", icon: "📦", category: "chip", rarity: "uncommon", magazinePct: 16, reloadPct: 5, price: 1650, text: "Vergrößert Magazine und hilft beim Nachladen." }
    ,{ id: "vitality-chip", name: "Vitalitäts-Modul", icon: "❤️", category: "chip", rarity: "uncommon", health: 35, regen: .35, price: 1900, text: "Mehr Leben und leichte Regeneration." }
    ,{ id: "precision-chip", name: "Präzisions-Modul", icon: "🎯", category: "chip", rarity: "rare", crit: 9, critDamage: 35, damagePct: 6, price: 7200, text: "Erhöht Präzision und kritischen Schaden." }
    ,{ id: "overclock-chip", name: "Overclock-Modul", icon: "⚙️", category: "chip", rarity: "epic", speed: 12, reloadPct: 20, damagePct: 12, price: 24500, text: "Beschleunigt Bewegung, Nachladen und Schaden." }
    ,{ id: "guardian-chip", name: "Guardian-Modul", icon: "🔷", category: "chip", rarity: "legendary", armor: 15, shield: 95, regen: .8, price: 66000, text: "Legendäres Schutzmodul mit Energieschild." }

    ,{ id: "lucky-coin", name: "Glückscoin", icon: "🪙", category: "charm", rarity: "common", loot: 7, price: 300, text: "Kleine Verbesserung der Beutechance." }
    ,{ id: "speed-talisman", name: "Windtalisman", icon: "🍃", category: "charm", rarity: "uncommon", speed: 8, dodge: 3, price: 1800, text: "Mehr Tempo und Ausweichchance." }
    ,{ id: "war-talisman", name: "Kriegstalisman", icon: "⚔️", category: "charm", rarity: "rare", damagePct: 12, bossDamage: 12, price: 7600, text: "Mehr Schaden gegen normale Gegner und Bosse." }
    ,{ id: "shield-talisman", name: "Schildtalisman", icon: "🧿", category: "charm", rarity: "epic", shield: 110, armor: 8, price: 24600, text: "Epischer Startschutz und zusätzliche Rüstung." }
    ,{ id: "fortune-talisman", name: "Fortuna-Talisman", icon: "🍀", category: "charm", rarity: "legendary", loot: 28, crit: 7, price: 71000, text: "Legendär hohe Beutechance und mehr Krits." }

    ,{ id: "field-horse", name: "Feldpferd", icon: "🐎", category: "mount", rarity: "common", speed: 14, mountArmor: 120, price: 1200, text: "Ein zuverlässiges Reittier für mehr Tempo." }
    ,{ id: "armored-horse", name: "Gepanzertes Pferd", icon: "🐴", category: "mount", rarity: "uncommon", speed: 18, mountArmor: 220, armor: 4, price: 4800, text: "Mehr Tempo und eine eigene Reittierpanzerung." }
    ,{ id: "war-horse", name: "Kriegspferd", icon: "🐎", category: "mount", rarity: "rare", speed: 24, mountArmor: 380, damagePct: 5, price: 13800, text: "Schnelles Pferd mit Kampfvorteil." }
    ,{ id: "shock-bike", name: "Schock-Bike", icon: "🏍️", category: "mount", rarity: "epic", speed: 34, mountArmor: 560, dodge: 5, price: 39000, text: "Episches Bike mit hohem Tempo." }
    ,{ id: "combat-bike", name: "Kampf-Bike", icon: "🏍️", category: "mount", rarity: "legendary", speed: 43, mountArmor: 820, armor: 8, damagePct: 8, price: 88000, text: "Legendäres Bike mit starker Panzerung." }
    ,{ id: "spectral-stallion", name: "Spektralhengst", icon: "🦄", category: "mount", rarity: "special", speed: 52, mountArmor: 1080, dodge: 9, shield: 60, price: 98000, text: "Special-Reittier mit Schild und hoher Geschwindigkeit." }
    ,{ id: "solar-drake", name: "Solar-Drache", icon: "🐉", category: "mount", rarity: "mythic", minLevel: 10, speed: 64, mountArmor: 1450, armor: 12, damagePct: 14, shield: 100, price: 184000, text: "Mystisches Reittier mit starker Panzerung." }
    ,{ id: "street-dog", name: "Straßenhund", icon: "🐕", category: "companion", rarity: "common", companionType: "melee", companionDamage: 13, companionRate: 1.35, companionHealth: 115, companionRange: 62, companionSpeed: 235, price: 780, text: "Treuer Nahkampfbegleiter, der Gegner anspringt." }
    ,{ id: "alley-cat", name: "Straßenkatze", icon: "🐈", category: "companion", rarity: "common", companionType: "melee", companionDamage: 10, companionRate: 1.8, companionHealth: 82, companionRange: 55, companionSpeed: 285, dodge: 2, price: 720, text: "Sehr flink und schwer zu treffen." }
    ,{ id: "shepherd-dog", name: "Schäferhund", icon: "🐕‍🦺", category: "companion", rarity: "uncommon", companionType: "melee", companionDamage: 24, companionRate: 1.45, companionHealth: 190, companionRange: 70, companionSpeed: 250, armor: 3, price: 3600, text: "Robuster Hund mit gutem Schaden und Schutz." }
    ,{ id: "ranger-cat", name: "Kampfkatze", icon: "🐈", category: "companion", rarity: "uncommon", companionType: "ranged", companionDamage: 18, companionRate: 1.75, companionHealth: 125, companionRange: 360, companionSpeed: 280, crit: 3, price: 4100, text: "Feuert kleine Energiekrallen aus sicherer Entfernung." }
    ,{ id: "battle-hound", name: "Kampfhund", icon: "🐕‍🦺", category: "companion", rarity: "rare", companionType: "melee", companionDamage: 42, companionRate: 1.6, companionHealth: 320, companionRange: 76, companionSpeed: 275, armor: 5, price: 12800, text: "Seltener Begleiter mit starkem Biss und hoher Lebensenergie." }
    ,{ id: "lynx-companion", name: "Luchs", icon: "🐈", category: "companion", rarity: "rare", companionType: "melee", companionDamage: 46, companionRate: 1.9, companionHealth: 245, companionRange: 72, companionSpeed: 325, dodge: 5, price: 14500, text: "Schneller Luchs mit hoher Ausweichchance." }
    ,{ id: "scout-companion", name: "Späher", icon: "🧑‍🎯", category: "companion", rarity: "rare", companionType: "ranged", companionDamage: 33, companionRate: 2.05, companionHealth: 230, companionRange: 520, companionSpeed: 245, price: 16800, text: "Menschlicher Begleiter mit präziser Pistole." }
    ,{ id: "medic-companion", name: "Feldsanitäter", icon: "🧑‍⚕️", category: "companion", rarity: "epic", companionType: "support", companionDamage: 25, companionRate: 1.4, companionHealth: 360, companionRange: 420, companionSpeed: 240, companionHeal: 2.8, regen: .45, price: 38500, text: "Heilt dich regelmäßig und schießt auf nahe Gegner." }
    ,{ id: "gunner-companion", name: "Schwerer Schütze", icon: "🧑‍🚀", category: "companion", rarity: "epic", companionType: "ranged", companionDamage: 48, companionRate: 3.4, companionHealth: 430, companionRange: 610, companionSpeed: 220, companionPierce: 1, price: 44800, text: "Unterstützt dich mit einer schnellen Maschinenwaffe." }
    ,{ id: "tiger-companion", name: "Tiger", icon: "🐅", category: "companion", rarity: "legendary", companionType: "melee", companionDamage: 92, companionRate: 1.75, companionHealth: 720, companionRange: 92, companionSpeed: 350, crit: 8, armor: 7, price: 89000, text: "Legendärer Großkatzen-Begleiter mit gewaltigem Sprungangriff." }
    ,{ id: "lion-companion", name: "Löwe", icon: "🦁", category: "companion", rarity: "legendary", companionType: "melee", companionDamage: 108, companionRate: 1.45, companionHealth: 890, companionRange: 98, companionSpeed: 310, armor: 11, companionRoar: 12, price: 97000, text: "Sehr widerstandsfähig und schwächt Gegner mit seinem Brüllen." }
    ,{ id: "guardian-drone", name: "Wächterdrohne", icon: "🛸", category: "companion", rarity: "special", companionType: "ranged", companionDamage: 74, companionRate: 4.1, companionHealth: 650, companionRange: 690, companionSpeed: 330, shield: 45, companionPierce: 2, price: 99000, text: "Special-Drohne mit schnellen Plasmasalven." }
    ,{ id: "arc-mage", name: "Arc-Magier", icon: "🧙", category: "companion", rarity: "special", companionType: "ranged", companionDamage: 88, companionRate: 1.65, companionHealth: 610, companionRange: 650, companionSpeed: 255, companionSplash: 95, price: 99500, text: "Erzeugt elektrische Flächenangriffe gegen Gruppen." }
    ,{ id: "phoenix-cub", name: "Phönixjunges", icon: "🐦‍🔥", category: "companion", rarity: "mythic", minLevel: 10, companionType: "support", companionDamage: 132, companionRate: 2.2, companionHealth: 980, companionRange: 720, companionSpeed: 370, companionHeal: 5.5, companionSplash: 125, revive: 1, price: 179000, text: "Mystischer Begleiter mit Heilung und Feuerflächen." }
    ,{ id: "void-beast", name: "Leerenbestie", icon: "🐆", category: "companion", rarity: "exotic", minLevel: 15, companionType: "melee", companionDamage: 210, companionRate: 2.35, companionHealth: 1650, companionRange: 110, companionSpeed: 440, armor: 15, dodge: 11, companionSplash: 110, price: 379000, text: "Exotische Bestie mit extremer Geschwindigkeit und Flächenschaden." }

    ,{ id: "reflex-charm", name: "Reflex-Talisman", icon: "🌀", category: "charm", rarity: "common", dodge: 3, speed: 3, price: 520, text: "Verbessert frühe Ausweichbewegungen." }
    ,{ id: "guardian-knot", name: "Wächterknoten", icon: "🪢", category: "charm", rarity: "uncommon", armor: 5, dodge: 4, health: 20, price: 2600, text: "Kombiniert Schutz mit Ausweichchance." }
    ,{ id: "predator-eye", name: "Auge des Jägers", icon: "👁️", category: "charm", rarity: "rare", crit: 8, damagePct: 8, companionDamagePct: 10, price: 11800, text: "Stärkt kritische Treffer und den Begleiter." }
    ,{ id: "bond-talisman", name: "Bindungs-Talisman", icon: "🤝", category: "charm", rarity: "epic", companionDamagePct: 22, companionHealthPct: 25, companionRatePct: 12, price: 34800, text: "Erhöht Schaden, Leben und Angriffstempo des Begleiters." }
    ,{ id: "chrono-talisman", name: "Chrono-Talisman", icon: "⏳", category: "charm", rarity: "legendary", dodge: 16, speed: 16, dodgeHeal: 9, price: 84500, text: "Perfekte Ausweichmanöver heilen einen kleinen Teil deines Lebens." }
    ,{ id: "beast-sigil", name: "Bestien-Siegel", icon: "🐾", category: "charm", rarity: "special", companionDamagePct: 38, companionHealthPct: 42, companionSplash: 45, price: 98000, text: "Special-Talisman für aggressive Begleiter-Builds." }
    ,{ id: "fate-prism", name: "Schicksalsprisma", icon: "🔺", category: "charm", rarity: "mythic", minLevel: 10, loot: 35, dodge: 18, crit: 14, companionDamagePct: 45, price: 176000, text: "Mystischer Talisman für Beute, Ausweichen und Begleiterschaden." }
    ,{ id: "infinity-emblem", name: "Unendlichkeits-Emblem", icon: "♾️", category: "charm", rarity: "exotic", minLevel: 15, loot: 55, dodge: 24, crit: 22, damagePct: 22, companionDamagePct: 70, price: 366000, text: "Exotisches Endgame-Emblem mit starken Gesamtboni." }

    ,{ id: "evasion-chip", name: "Ausweich-Modul", icon: "💨", category: "chip", rarity: "common", dodge: 4, speed: 4, price: 650, text: "Einfaches Modul für schnelle Seitenschritte." }
    ,{ id: "counter-chip", name: "Konter-Modul", icon: "↩️", category: "chip", rarity: "rare", dodge: 8, dodgeBurst: 38, damagePct: 5, price: 9800, text: "Erzeugt bei einem Ausweichen einen kleinen Konterschlag." }
    ,{ id: "command-chip", name: "Begleiter-Kommando", icon: "📡", category: "chip", rarity: "epic", companionDamagePct: 28, companionRatePct: 18, companionHealthPct: 20, price: 31800, text: "Optimiert Zielerfassung und Angriffstempo des Begleiters." }
    ,{ id: "phase-chip", name: "Phasen-Modul", icon: "🫥", category: "chip", rarity: "legendary", dodge: 19, speed: 14, dodgeHeal: 6, shield: 55, price: 79000, text: "Legendäres Modul für Ausweich-Builds." }
    ,{ id: "quantum-command", name: "Quanten-Kommando", icon: "🧬", category: "chip", rarity: "exotic", minLevel: 15, companionDamagePct: 85, companionRatePct: 38, companionHealthPct: 70, dodge: 12, price: 359000, text: "Exotisches Kommandomodul für maximale Begleiterleistung." }

    ,{ id: "pet-first-aid", name: "Haustier-Erste-Hilfe", icon: "🐾", category: "companioncare", rarity: "common", companionCareHealthPct: 15, companionCareHealPct: 25, careCooldown: 18, price: 1350, text: "Pflegeset für Begleiter: mehr maximales Leben und Heilung mit Taste 4." }
    ,{ id: "pet-rescue-pack", name: "Begleiter-Rettungspack", icon: "🩹", category: "companioncare", rarity: "rare", companionCareHealthPct: 32, companionCareHealPct: 42, careCooldown: 13, price: 13800, text: "Starkes Rettungsset für Begleiter mit schnellerer Wiederherstellung." }
    ,{ id: "pet-field-clinic", name: "Mobile Tierklinik", icon: "🏥", category: "companioncare", rarity: "legendary", companionCareHealthPct: 55, companionCareHealPct: 60, careCooldown: 9, price: 76000, text: "Legendäres Pflegesystem mit viel Extra-Leben und schneller Rettung." }
    ,{ id: "mount-grooming-kit", name: "Reittier-Pflegeset", icon: "🧽", category: "mountcare", rarity: "common", mountCareHealthPct: 15, mountCareHealPct: 25, careCooldown: 18, price: 1550, text: "Pflegeset für Reittiere: mehr Panzerung und Heilung mit Taste 5." }
    ,{ id: "mount-rescue-pack", name: "Reittier-Rettungspack", icon: "🧰", category: "mountcare", rarity: "rare", mountCareHealthPct: 32, mountCareHealPct: 42, careCooldown: 13, price: 15200, text: "Rettungspack für verletzte oder ausgefallene Reittiere." }
    ,{ id: "mount-field-clinic", name: "Mobile Stallklinik", icon: "🚑", category: "mountcare", rarity: "legendary", mountCareHealthPct: 55, mountCareHealPct: 60, careCooldown: 9, price: 82000, text: "Legendäre Reittierpflege mit sehr hoher Panzerung und schneller Heilung." }

    ,{ id: "void-panther", name: "Leerenpanther", icon: "🐈‍⬛", category: "mount", rarity: "exotic", minLevel: 15, speed: 78, mountArmor: 2050, armor: 16, damagePct: 22, dodge: 14, shield: 170, price: 395000, text: "Exotisches Reittier für maximales Tempo und Schutz." }

    // V132: Große Arsenal-Erweiterung. Alle neuen normalen Reihen bleiben preislich in ihrer bisherigen Seltenheitsklasse.
    ,{ id: "backup-revolver", name: "Reserve-Revolver", icon: "🔫", category: "weapon", family: "pistol", rarity: "common", minLevel: 1, attack: "gun", damage: 27, fireRate: 1.55, magazine: 6, reload: 1.55, range: 640, durability: 920, price: 680, text: "Ein robuster Reserve-Revolver mit kräftigem Einzelschuss." }
    ,{ id: "civil-carbine", name: "Ziviler Karabiner", icon: "🎯", category: "weapon", family: "automatic", rarity: "common", minLevel: 1, attack: "gun", damage: 18, fireRate: 5.6, magazine: 24, reload: 1.8, range: 720, spread: .045, durability: 1180, price: 1080, text: "Ein einfacher Karabiner für den Einstieg in längere Kämpfe." }
    ,{ id: "coach-shotgun", name: "Kutschenschrotflinte", icon: "💥", category: "weapon", family: "shotgun", rarity: "common", minLevel: 1, attack: "shotgun", damage: 20, pellets: 8, fireRate: .9, magazine: 2, reload: 1.65, range: 440, spread: .27, durability: 950, price: 940, text: "Kurze Doppelflinte mit starkem Nahbereich." }
    ,{ id: "pipe-hammer", name: "Rohrhammer", icon: "🔨", category: "weapon", family: "melee", rarity: "common", minLevel: 1, attack: "melee", damage: 52, fireRate: 1.3, range: 91, arc: 1.75, durability: 1500, price: 470, text: "Improvisierter Hammer mit hoher Haltbarkeit." }
    ,{ id: "security-pistol", name: "Security-Pistole", icon: "🔫", category: "weapon", family: "pistol", rarity: "uncommon", minLevel: 1, attack: "gun", damage: 43, fireRate: 2.7, magazine: 13, reload: 1.25, range: 690, spread: .025, durability: 1150, price: 2450, text: "Ungewöhnliche Dienstwaffe mit guter Kontrolle." }
    ,{ id: "ranger-carbine", name: "Ranger-Karabiner", icon: "🎯", category: "weapon", family: "automatic", rarity: "uncommon", minLevel: 1, attack: "gun", damage: 34, fireRate: 6.4, magazine: 30, reload: 1.6, range: 820, spread: .032, durability: 1450, price: 2950, text: "Zuverlässiger Karabiner für mittlere Distanz." }
    ,{ id: "breacher-shotgun", name: "Brecher-Schrotflinte", icon: "💥", category: "weapon", family: "shotgun", rarity: "uncommon", minLevel: 1, attack: "shotgun", damage: 30, pellets: 8, fireRate: 1.35, magazine: 6, reload: 1.9, range: 480, spread: .23, durability: 1260, price: 2850, text: "Ungewöhnliche Schrotflinte für schnelle Raumkämpfe." }
    ,{ id: "steel-saber", name: "Stahlsäbel", icon: "🗡️", category: "weapon", family: "melee", rarity: "uncommon", minLevel: 1, attack: "melee", damage: 90, fireRate: 1.85, range: 112, arc: 2.0, durability: 1420, price: 2350, text: "Schneller Säbel mit weitem Schwung." }
    ,{ id: "hunter-revolver", name: "Jäger-Revolver", icon: "🔫", category: "weapon", family: "pistol", rarity: "rare", minLevel: 1, attack: "gun", damage: 74, fireRate: 1.65, magazine: 7, reload: 1.45, range: 760, durability: 1350, crit: 4, price: 8900, text: "Seltener Revolver für präzise kritische Treffer." }
    ,{ id: "marksman-carbine", name: "Marksman-Karabiner", icon: "🎯", category: "weapon", family: "automatic", rarity: "rare", minLevel: 1, attack: "gun", damage: 58, fireRate: 5.4, magazine: 28, reload: 1.55, range: 920, spread: .018, durability: 1680, pierce: 1, price: 9800, text: "Seltener Präzisionskarabiner mit Durchschlag." }
    ,{ id: "riot-shotgun", name: "Riot-Schrotflinte", icon: "💥", category: "weapon", family: "shotgun", rarity: "rare", minLevel: 1, attack: "shotgun", damage: 36, pellets: 9, fireRate: 1.9, magazine: 10, reload: 2.0, range: 540, spread: .19, durability: 1580, price: 9200, text: "Schnelle Schrotflinte für Gegnergruppen." }
    ,{ id: "tactical-spear", name: "Taktischer Speer", icon: "🔱", category: "weapon", family: "melee", rarity: "rare", minLevel: 1, attack: "melee", damage: 132, fireRate: 1.7, range: 152, arc: 1.55, durability: 1750, dash: 18, price: 8700, text: "Seltener Speer mit großer Reichweite." }
    ,{ id: "volt-pistol", name: "Volt-Pistole", icon: "⚡", category: "weapon", family: "pistol", rarity: "epic", minLevel: 1, attack: "gun", damage: 92, fireRate: 3.5, magazine: 16, reload: 1.15, range: 820, durability: 1650, special: "chain", price: 27800, text: "Epische Pistole mit elektrischer Kettenreaktion." }
    ,{ id: "gauss-rifle", name: "Gauss-Gewehr", icon: "☄️", category: "weapon", family: "automatic", rarity: "epic", minLevel: 1, attack: "gun", damage: 94, fireRate: 3.0, magazine: 18, reload: 1.5, range: 1180, spread: .006, durability: 1880, pierce: 2, special: "pierce", price: 29800, text: "Episches Langgewehr mit hoher Durchschlagskraft." }
    ,{ id: "pulse-shotgun", name: "Puls-Schrotflinte", icon: "🌩️", category: "weapon", family: "shotgun", rarity: "epic", minLevel: 1, attack: "shotgun", damage: 47, pellets: 10, fireRate: 2.25, magazine: 12, reload: 1.85, range: 590, spread: .17, durability: 1920, splash: 44, special: "explosion", price: 28800, text: "Epische Schrotflinte mit Puls-Explosion." }
    ,{ id: "plasma-glaive", name: "Plasma-Gleve", icon: "🌌", category: "weapon", family: "melee", rarity: "epic", minLevel: 1, attack: "melee", damage: 188, fireRate: 2.15, range: 158, arc: 2.3, durability: 2050, lifesteal: 3, special: "chain", price: 28200, text: "Epische Stangenklinge mit Plasmaentladung." }
    ,{ id: "sunfire-revolver", name: "Sonnenfeuer-Revolver", icon: "☀️", category: "weapon", family: "pistol", rarity: "legendary", minLevel: 1, attack: "gun", damage: 148, fireRate: 1.9, magazine: 8, reload: 1.25, range: 900, durability: 2100, splash: 38, special: "explosion", price: 73500, text: "Legendärer Revolver mit brennendem Einschlag." }
    ,{ id: "dragon-rifle", name: "Drachengewehr", icon: "🐉", category: "weapon", family: "automatic", rarity: "legendary", minLevel: 1, attack: "gun", damage: 74, fireRate: 8.4, magazine: 48, reload: 1.35, range: 980, spread: .016, durability: 2500, splash: 32, special: "explosion", price: 78500, text: "Legendäres Gewehr mit schnellen Feuerprojektilen." }
    ,{ id: "storm-shotgun", name: "Sturmschrotflinte", icon: "🌩️", category: "weapon", family: "shotgun", rarity: "legendary", minLevel: 1, attack: "shotgun", damage: 58, pellets: 11, fireRate: 2.0, magazine: 10, reload: 1.7, range: 630, spread: .15, durability: 2350, special: "chain", price: 76800, text: "Legendäre Schrotflinte mit Blitz-Kette." }
    ,{ id: "titan-axe", name: "Titanenaxt", icon: "🪓", category: "weapon", family: "melee", rarity: "legendary", minLevel: 1, attack: "melee", damage: 265, fireRate: 1.15, range: 150, arc: 2.7, durability: 2900, splash: 145, special: "explosion", price: 74800, text: "Legendäre Axt für schwere Flächentreffer." }
    ,{ id: "phase-pistol", name: "Phasen-Pistole", icon: "🫥", category: "weapon", family: "pistol", rarity: "special", minLevel: 1, attack: "gun", damage: 132, fireRate: 4.2, magazine: 22, reload: 1.0, range: 930, durability: 2450, pierce: 2, special: "stasis", price: 99000, text: "Special-Pistole, deren Projektile Ziele verlangsamen." }
    ,{ id: "nova-lmg", name: "Nova-LMG", icon: "🌠", category: "weapon", family: "automatic", rarity: "special", minLevel: 1, attack: "gun", damage: 82, fireRate: 10.8, magazine: 96, reload: 2.1, range: 920, spread: .025, durability: 3300, splash: 45, special: "explosion", price: 99500, text: "Special-LMG für dauerhaftes Flächenfeuer." }
    ,{ id: "rift-shotgun", name: "Riss-Schrotflinte", icon: "🌀", category: "weapon", family: "shotgun", rarity: "special", minLevel: 1, attack: "shotgun", damage: 68, pellets: 11, fireRate: 2.35, magazine: 14, reload: 1.55, range: 680, spread: .14, durability: 2750, splash: 72, special: "stasis", price: 99800, text: "Special-Schrotflinte mit Rissfeld." }
    ,{ id: "arc-scythe", name: "Arc-Sense", icon: "⚡", category: "weapon", family: "melee", rarity: "special", minLevel: 1, attack: "melee", damage: 305, fireRate: 2.35, range: 174, arc: 2.8, durability: 3150, splash: 105, lifesteal: 7, special: "chain", price: 99600, text: "Special-Sense mit elektrischer Kettenwirkung." }
    ,{ id: "oracle-sidearm", name: "Orakel-Seitenwaffe", icon: "🔮", category: "weapon", family: "pistol", rarity: "mythic", minLevel: 10, attack: "gun", damage: 176, fireRate: 4.8, magazine: 25, reload: .95, range: 1010, durability: 3100, pierce: 2, special: "pierce", crit: 8, price: 188000, text: "Mystische Pistole mit vorausberechneten Schussbahnen." }
    ,{ id: "celestial-rifle", name: "Himmelsgewehr", icon: "✨", category: "weapon", family: "automatic", rarity: "mythic", minLevel: 10, attack: "gun", damage: 108, fireRate: 10.2, magazine: 62, reload: 1.05, range: 1080, spread: .009, durability: 3600, pierce: 2, splash: 48, special: "chain", price: 196000, text: "Mystisches Gewehr mit himmlischer Energie." }
    ,{ id: "phoenix-shotgun", name: "Phönix-Schrotflinte", icon: "🐦‍🔥", category: "weapon", family: "shotgun", rarity: "mythic", minLevel: 10, attack: "shotgun", damage: 82, pellets: 12, fireRate: 2.45, magazine: 14, reload: 1.45, range: 720, spread: .13, durability: 3400, splash: 105, special: "explosion", price: 194000, text: "Mystische Schrotflinte mit Feuerexplosion." }
    ,{ id: "time-spear", name: "Zeitspeer", icon: "⏳", category: "weapon", family: "melee", rarity: "mythic", minLevel: 10, attack: "melee", damage: 370, fireRate: 2.45, range: 188, arc: 2.3, durability: 3750, dash: 46, lifesteal: 8, special: "stasis", price: 192000, text: "Mystischer Speer, der Gegner im Augenblick festhält." }
    ,{ id: "prism-pistol", name: "Prisma-Pistole", icon: "🌈", category: "weapon", family: "pistol", rarity: "exotic", minLevel: 15, attack: "gun", damage: 218, fireRate: 5.6, magazine: 30, reload: .82, range: 1080, durability: 3900, pierce: 3, splash: 42, special: "chain", price: 389000, text: "Exotische Pistole mit gebündelten Prismastrahlen." }
    ,{ id: "dimension-rifle", name: "Dimensionsgewehr", icon: "🌌", category: "weapon", family: "automatic", rarity: "exotic", minLevel: 15, attack: "gun", damage: 142, fireRate: 11.4, magazine: 78, reload: .9, range: 1180, spread: .006, durability: 4400, pierce: 3, splash: 62, special: "stasis", price: 419000, text: "Exotisches Gewehr, das durch Dimensionsrisse feuert." }
    ,{ id: "cosmic-shotgun", name: "Kosmos-Schrotflinte", icon: "☄️", category: "weapon", family: "shotgun", rarity: "exotic", minLevel: 15, attack: "shotgun", damage: 105, pellets: 13, fireRate: 2.65, magazine: 16, reload: 1.3, range: 760, spread: .12, durability: 4200, pierce: 1, splash: 135, special: "explosion", price: 408000, text: "Exotische Schrotflinte mit kosmischer Druckwelle." }
    ,{ id: "void-cleaver", name: "Leeren-Spalter", icon: "🕳️", category: "weapon", family: "melee", rarity: "exotic", minLevel: 15, attack: "melee", damage: 470, fireRate: 2.7, range: 182, arc: 2.9, durability: 4650, splash: 155, dash: 58, lifesteal: 11, special: "stasis", price: 425000, text: "Exotische Klinge mit vernichtendem Leerenfeld." }
    ,{ id: "event-horizon-pistol", name: "Ereignishorizont-Pistole", icon: "🕳️", category: "weapon", family: "pistol", rarity: "universe", minLevel: 50, attack: "gun", damage: 225, fireRate: 5.4, magazine: 28, reload: .78, range: 1120, spread: .004, durability: 5200, pierce: 4, splash: 55, special: "stasis", price: 690000, text: "Universe-Pistole mit einem kompakten Gravitationsfeld." }
    ,{ id: "galaxy-revolver", name: "Galaxie-Revolver", icon: "🌌", category: "weapon", family: "pistol", rarity: "universe", minLevel: 50, attack: "gun", damage: 285, fireRate: 1.85, magazine: 7, reload: 1.05, range: 1180, durability: 5400, pierce: 5, special: "pierce", crit: 12, price: 735000, text: "Universe-Revolver für extrem starke Einzeltreffer." }
    ,{ id: "infinity-sidearm", name: "Infinity-Seitenwaffe", icon: "♾️", category: "weapon", family: "pistol", rarity: "universe", minLevel: 50, attack: "gun", damage: 250, fireRate: 6.6, magazine: 36, reload: .7, range: 1160, spread: .003, durability: 5600, pierce: 3, splash: 70, special: "chain", price: 780000, text: "Universe-Seitenwaffe mit endlos wirkender Energiekette." }
    ,{ id: "universe-rifle", name: "Universe-Gewehr", icon: "🌠", category: "weapon", family: "automatic", rarity: "universe", minLevel: 50, attack: "gun", damage: 170, fireRate: 12.5, magazine: 88, reload: .78, range: 1260, spread: .004, durability: 6500, pierce: 4, splash: 72, special: "chain", price: 820000, text: "Universe-Langwaffe mit hoher Schussrate und Durchschlag." }
    ,{ id: "starbreaker-sniper", name: "Sternenbrecher-Scharfschütze", icon: "☄️", category: "weapon", family: "automatic", rarity: "universe", minLevel: 50, attack: "gun", damage: 360, fireRate: 1.35, magazine: 9, reload: 1.15, range: 1650, spread: .001, durability: 6200, pierce: 7, splash: 95, special: "pierce", price: 890000, text: "Universe-Präzisionsgewehr, das ganze Gegnerlinien durchbricht." }
    ,{ id: "multiverse-lmg", name: "Multiversum-LMG", icon: "🌀", category: "weapon", family: "automatic", rarity: "universe", minLevel: 50, attack: "gun", damage: 125, fireRate: 15.2, magazine: 160, reload: 1.85, range: 1150, spread: .012, durability: 7800, pierce: 2, splash: 88, special: "explosion", price: 860000, text: "Universe-LMG für gewaltiges Dauerfeuer." }
    ,{ id: "supernova-shotgun", name: "Supernova-Schrotflinte", icon: "💥", category: "weapon", family: "shotgun", rarity: "universe", minLevel: 50, attack: "shotgun", damage: 118, pellets: 14, fireRate: 2.75, magazine: 18, reload: 1.25, range: 810, spread: .105, durability: 6100, splash: 175, special: "explosion", price: 835000, text: "Universe-Schrotflinte mit einer Supernova-Druckwelle." }
    ,{ id: "black-hole-scattergun", name: "Schwarzes-Loch-Streukanone", icon: "🕳️", category: "weapon", family: "shotgun", rarity: "universe", minLevel: 50, attack: "shotgun", damage: 135, pellets: 13, fireRate: 2.5, magazine: 16, reload: 1.15, range: 850, spread: .095, durability: 6400, pierce: 2, splash: 150, special: "stasis", price: 875000, text: "Universe-Streukanone, die Gegner im Trefferfeld festhält." }
    ,{ id: "cosmic-breacher", name: "Kosmischer Brecher", icon: "🌌", category: "weapon", family: "shotgun", rarity: "universe", minLevel: 50, attack: "shotgun", damage: 155, pellets: 12, fireRate: 2.3, magazine: 14, reload: 1.05, range: 900, spread: .08, durability: 6700, pierce: 3, splash: 190, special: "pierce", price: 915000, text: "Universe-Schrotflinte mit maximaler Durchschlagskraft." }
    ,{ id: "universe-blade", name: "Universe-Klinge", icon: "🌠", category: "weapon", family: "melee", rarity: "universe", minLevel: 50, attack: "melee", damage: 560, fireRate: 3.0, range: 195, arc: 2.9, durability: 6900, splash: 190, dash: 68, lifesteal: 13, special: "chain", price: 840000, text: "Universe-Klinge mit blitzartigem Angriffssprint." }
    ,{ id: "galaxy-hammer", name: "Galaxie-Hammer", icon: "🔨", category: "weapon", family: "melee", rarity: "universe", minLevel: 50, attack: "melee", damage: 720, fireRate: 1.15, range: 178, arc: 3.0, durability: 8200, splash: 270, special: "explosion", price: 900000, text: "Universe-Hammer mit gewaltiger Flächenwucht." }
    ,{ id: "infinity-spear", name: "Infinity-Speer", icon: "♾️", category: "weapon", family: "melee", rarity: "universe", minLevel: 50, attack: "melee", damage: 620, fireRate: 2.55, range: 225, arc: 2.2, durability: 7400, splash: 160, dash: 76, lifesteal: 15, special: "stasis", price: 940000, text: "Universe-Speer mit enormer Reichweite und Stasis." }
    ,{ id: "cosmos-visor", name: "Kosmos-Visier", icon: "🪖", category: "helmet", rarity: "universe", minLevel: 50, durability: 6500, health: 210, armor: 32, shield: 190, crit: 20, dodge: 8, price: 700000, text: "Universe-Visier für Präzision und Schutz." }
    ,{ id: "singularity-crown", name: "Singularitäts-Krone", icon: "👑", category: "helmet", rarity: "universe", minLevel: 50, durability: 6900, health: 240, armor: 36, shield: 230, regen: 2.2, crit: 24, price: 760000, text: "Universe-Krone mit regenerierendem Schutzfeld." }
    ,{ id: "infinity-helmet", name: "Infinity-Helm", icon: "♾️", category: "helmet", rarity: "universe", minLevel: 50, durability: 7300, health: 280, armor: 40, shield: 280, crit: 28, dodge: 12, price: 820000, text: "Universe-Helm mit maximaler Zielerfassung." }
    ,{ id: "starforged-armor", name: "Sternengeschmiedete Rüstung", icon: "🛡️", category: "armor", rarity: "universe", minLevel: 50, durability: 8200, health: 430, armor: 38, shield: 260, regen: 2.6, price: 760000, text: "Universe-Rüstung aus sternengeschmiedeten Platten." }
    ,{ id: "gravity-armor", name: "Gravitationsrüstung", icon: "🕳️", category: "armor", rarity: "universe", minLevel: 50, durability: 8800, health: 480, armor: 42, shield: 310, regen: 2.2, dodge: 8, price: 830000, text: "Universe-Rüstung, die Treffer durch Gravitation abbremst." }
    ,{ id: "infinity-armor", name: "Infinity-Rüstung", icon: "♾️", category: "armor", rarity: "universe", minLevel: 50, durability: 9600, health: 540, armor: 46, shield: 370, regen: 3.3, price: 910000, text: "Universe-Rüstung mit extremen Gesamtwerten." }
    ,{ id: "nebula-suit", name: "Nebula-Vollanzug", icon: "🥋", category: "suit", rarity: "universe", minLevel: 50, durability: 7600, health: 390, armor: 30, shield: 220, speed: 24, regen: 2.0, damagePct: 24, price: 750000, text: "Universe-Anzug mit ausgewogener Beweglichkeit." }
    ,{ id: "dimension-suit", name: "Dimensionsanzug", icon: "🌀", category: "suit", rarity: "universe", minLevel: 50, durability: 8300, health: 450, armor: 34, shield: 270, speed: 30, regen: 2.5, dodge: 9, damagePct: 29, price: 825000, text: "Universe-Anzug für schnelle Dimensionssprünge." }
    ,{ id: "infinity-suit", name: "Infinity-Vollanzug", icon: "♾️", category: "suit", rarity: "universe", minLevel: 50, durability: 9100, health: 520, armor: 38, shield: 330, speed: 35, regen: 3.2, dodge: 12, damagePct: 35, price: 905000, text: "Universe-Vollanzug mit maximalen Gesamtboni." }
    ,{ id: "comet-boots", name: "Kometenstiefel", icon: "👢", category: "boots", rarity: "universe", minLevel: 50, speed: 55, regen: 1.2, dodge: 25, price: 690000, text: "Universe-Stiefel für kometenartige Sprints." }
    ,{ id: "warp-boots", name: "Warp-Stiefel", icon: "💫", category: "boots", rarity: "universe", minLevel: 50, shield: 90, speed: 65, regen: 1.6, dodge: 30, price: 750000, text: "Universe-Stiefel mit kurzen Warp-Bewegungen." }
    ,{ id: "infinity-boots", name: "Infinity-Stiefel", icon: "♾️", category: "boots", rarity: "universe", minLevel: 50, shield: 130, speed: 76, regen: 2.0, dodge: 36, price: 815000, text: "Universe-Stiefel für maximales Tempo." }
    ,{ id: "cosmic-overclock", name: "Kosmischer Overclock", icon: "💠", category: "chip", rarity: "universe", minLevel: 50, crit: 18, damagePct: 38, reloadPct: 34, magazinePct: 28, specialGrant: "chain", price: 720000, text: "Universe-Modul für hohe Feuerleistung." }
    ,{ id: "singularity-processor", name: "Singularitäts-Prozessor", icon: "🌀", category: "chip", rarity: "universe", minLevel: 50, crit: 21, critDamage: 75, dodge: 12, damagePct: 44, reloadPct: 38, specialGrant: "stasis", price: 790000, text: "Universe-Prozessor für kritische Stasis-Builds." }
    ,{ id: "infinity-command", name: "Infinity-Kommando", icon: "♾️", category: "chip", rarity: "universe", minLevel: 50, crit: 24, damagePct: 50, reloadPct: 42, specialGrant: "pierce", companionDamagePct: 95, companionHealthPct: 80, companionRatePct: 45, price: 875000, text: "Universe-Kommandomodul für Spieler und Begleiter." }
    ,{ id: "star-heart", name: "Sternenherz", icon: "💖", category: "charm", rarity: "universe", minLevel: 50, health: 260, shield: 240, regen: 2.6, bossDamage: 28, loot: 25, price: 710000, text: "Universe-Talisman mit Lebens- und Schildenergie." }
    ,{ id: "multiverse-emblem", name: "Multiversum-Emblem", icon: "🌀", category: "charm", rarity: "universe", minLevel: 50, crit: 22, dodge: 20, damagePct: 32, loot: 45, companionDamagePct: 65, price: 785000, text: "Universe-Emblem für vielseitige Builds." }
    ,{ id: "universe-core", name: "Universe-Kern", icon: "🌌", category: "charm", rarity: "universe", minLevel: 50, health: 320, shield: 320, regen: 3.0, damagePct: 40, bossDamage: 40, loot: 60, revive: 1, price: 880000, text: "Universe-Kern mit einem zusätzlichen Wiederbelebungsimpuls." }
    ,{ id: "star-wolf", name: "Sternenwolf", icon: "🐺", category: "companion", rarity: "universe", minLevel: 50, armor: 18, dodge: 14, companionType: "melee", companionDamage: 260, companionRate: 2.7, companionHealth: 2100, companionRange: 125, companionSpeed: 470, companionSplash: 140, price: 790000, text: "Universe-Wolf mit schnellen Sprungangriffen." }
    ,{ id: "cosmic-ranger", name: "Kosmischer Ranger", icon: "🧑‍🚀", category: "companion", rarity: "universe", minLevel: 50, companionType: "ranged", companionDamage: 230, companionRate: 4.6, companionHealth: 1850, companionRange: 850, companionSpeed: 360, companionPierce: 4, companionSplash: 100, price: 835000, text: "Universe-Begleiter mit einem kosmischen Präzisionsgewehr." }
    ,{ id: "infinity-dragon", name: "Infinity-Drache", icon: "🐉", category: "companion", rarity: "universe", minLevel: 50, revive: 1, companionType: "support", companionDamage: 310, companionRate: 3.2, companionHealth: 2800, companionRange: 900, companionSpeed: 430, companionHeal: 9.5, companionPierce: 3, companionSplash: 210, price: 930000, text: "Universe-Drache mit Heilung und Flächenfeuer." }
    ,{ id: "cosmic-pet-kit", name: "Kosmisches Haustier-Set", icon: "🩹", category: "companioncare", rarity: "universe", minLevel: 50, companionCareHealthPct: 72, companionCareHealPct: 70, careCooldown: 8, price: 690000, text: "Universe-Pflege für sehr hohe Begleiter-Lebenspunkte." }
    ,{ id: "star-rescue-clinic", name: "Sternen-Rettungsklinik", icon: "🏥", category: "companioncare", rarity: "universe", minLevel: 50, companionCareHealthPct: 88, companionCareHealPct: 82, careCooldown: 6.5, price: 760000, text: "Universe-Rettungssystem mit kurzer Abklingzeit." }
    ,{ id: "infinity-pet-care", name: "Infinity-Begleiterpflege", icon: "♾️", category: "companioncare", rarity: "universe", minLevel: 50, companionCareHealthPct: 105, companionCareHealPct: 95, careCooldown: 5, price: 840000, text: "Universe-Pflege für maximale Rettungsleistung." }
    ,{ id: "nebula-stallion", name: "Nebula-Hengst", icon: "🦄", category: "mount", rarity: "universe", minLevel: 50, armor: 18, shield: 210, speed: 88, dodge: 16, damagePct: 25, mountArmor: 2600, price: 810000, text: "Universe-Reittier mit Nebula-Schild." }
    ,{ id: "cosmic-hoverbike", name: "Kosmisches Hoverbike", icon: "🏍️", category: "mount", rarity: "universe", minLevel: 50, armor: 20, shield: 250, speed: 102, dodge: 20, damagePct: 29, mountArmor: 2850, price: 870000, text: "Universe-Hoverbike mit extremer Geschwindigkeit." }
    ,{ id: "infinity-drake-mount", name: "Infinity-Drache", icon: "🐲", category: "mount", rarity: "universe", minLevel: 50, armor: 24, shield: 330, speed: 96, dodge: 18, damagePct: 34, mountArmor: 3400, price: 950000, text: "Universe-Reittier mit maximaler Panzerung." }
    ,{ id: "cosmic-mount-kit", name: "Kosmisches Reittier-Set", icon: "🧰", category: "mountcare", rarity: "universe", minLevel: 50, mountCareHealthPct: 72, mountCareHealPct: 70, careCooldown: 8, price: 710000, text: "Universe-Pflegeset für Reittiere." }
    ,{ id: "star-stable-clinic", name: "Sternen-Stallklinik", icon: "🚑", category: "mountcare", rarity: "universe", minLevel: 50, mountCareHealthPct: 88, mountCareHealPct: 82, careCooldown: 6.5, price: 780000, text: "Universe-Stallklinik mit schneller Rettung." }
    ,{ id: "infinity-mount-care", name: "Infinity-Reittierpflege", icon: "♾️", category: "mountcare", rarity: "universe", minLevel: 50, mountCareHealthPct: 105, mountCareHealPct: 95, careCooldown: 5, price: 860000, text: "Universe-Pflege für maximale Reittierpanzerung." }


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
    ["pistol", "Pistolen"], ["automatic", "Langwaffen"], ["shotgun", "Schrotflinten"], ["melee", "Nahkampf"],
    ["helmet", "Helme"], ["armor", "Rüstung"], ["suit", "Vollanzüge"], ["boots", "Schuhe"],
    ["chip", "Module"], ["charm", "Talismane"], ["companion", "Begleiter"], ["companioncare", "Haustierpflege"], ["mount", "Reittiere"], ["mountcare", "Reittierpflege"], ["repair", "Reparatur"], ["style", "Charakterfarben"]
  ];
  const WEAPON_SLOT_KEYS = ["melee", "sidearm", "primary"];
  const EQUIPMENT_SLOT_KEYS = ["helmet", "armor", "suit", "melee", "sidearm", "primary", "boots", "chip", "charm", "companion", "companioncare", "mount", "mountcare"];
  const SLOT_META = {
    helmet: { name: "Kopf", icon: "🪖", hint: "Helme schützen Kopf und erhöhen häufig Krit oder Schild." },
    armor: { name: "Rüstung", icon: "🛡️", hint: "Zusätzliche Panzerung über dem Vollanzug." },
    suit: { name: "Vollanzug", icon: "🥋", hint: "Kompletter Kampfanzug mit mehreren Werten." },
    melee: { name: "1 · Nahkampf", icon: "⚔️", hint: "Schläger, Schwerter, Katanas und andere Nahkampfwaffen." },
    sidearm: { name: "2 · Pistole", icon: "🔫", hint: "Pistolen und Revolver als schnelle Seitenwaffe." },
    primary: { name: "3 · Langwaffe", icon: "🎯", hint: "SMG, Gewehre und Schrotflinten." },
    boots: { name: "Schuhe", icon: "👟", hint: "Erhöhen Tempo und Ausweichchance." },
    chip: { name: "Modul", icon: "💠", hint: "Technische Boni und teilweise neue Spezialangriffe." },
    charm: { name: "Talisman", icon: "🧿", hint: "Beute, Bossschaden, Ausweichen, Begleiter und Sonderboni." },
    companion: { name: "Begleiter", icon: "🐾", hint: "Kämpft selbstständig mit, besitzt eigene Lebenspunkte und fällt nur für den aktuellen Run aus." },
    companioncare: { name: "4 · Haustierpflege", icon: "🩹", hint: "Erhöht das Leben des Begleiters und heilt oder rettet ihn im Kampf mit Taste 4." },
    mount: { name: "Reittier", icon: "🐎", hint: "Eigenes Tempo und eigene Panzerung pro Run." },
    mountcare: { name: "5 · Reittierpflege", icon: "🧰", hint: "Erhöht die Reittierpanzerung und heilt oder rettet das Reittier im Kampf mit Taste 5." }
  };
  function equipmentSlotForDef(def) {
    if (!def) return "";
    if (def.category === "weapon") return def.family === "melee" ? "melee" : def.family === "pistol" ? "sidearm" : "primary";
    return EQUIPMENT_SLOT_KEYS.includes(def.category) ? def.category : "";
  }
  function slotAcceptsItem(slot, item) {
    const def = itemDef(item);
    return !!slot && equipmentSlotForDef(def) === slot;
  }

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
    shopRarity: "all",
    inventoryCategory: "all",
    inventorySort: "rarity",
    inventorySearch: "",
    duel: null,
    duelPollTimer: 0,
    duelRaf: 0,
    coopWaiting: null,
    coopPollTimer: 0,
    coopUnsubs: [],
    mergeConfirmTimer: 0,
    mergeConfirmOpen: false
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
  const MAX_WAVE_CHECKPOINT = 500;
  function normalizeWaveCheckpoint(value, maxAllowed = MAX_WAVE_CHECKPOINT) {
    const max = Math.max(1, Math.min(MAX_WAVE_CHECKPOINT, Math.floor(Number(maxAllowed) || 1)));
    const raw = Math.max(1, Math.floor(Number(value) || 1));
    if (raw < 10 || max < 10) return 1;
    return Math.min(Math.floor(max / 10) * 10, Math.floor(raw / 10) * 10);
  }
  function waveCheckpointValues(maxAllowed = 1) {
    const max = normalizeWaveCheckpoint(maxAllowed, MAX_WAVE_CHECKPOINT);
    const values = [1];
    for (let wave = 10; wave <= max; wave += 10) values.push(wave);
    return values;
  }
  function waveCheckpointOptions(selected, maxAllowed) {
    const normalized = normalizeWaveCheckpoint(selected, maxAllowed);
    return waveCheckpointValues(maxAllowed).map(wave => `<option value="${wave}" ${wave === normalized ? "selected" : ""}>${wave === 1 ? "Welle 1 · von vorne" : `Welle ${wave}`}</option>`).join("");
  }
  function unlockWaveCheckpoint(wave) {
    const data = ensureState();
    if (!data) return;
    const checkpoint = normalizeWaveCheckpoint(wave, MAX_WAVE_CHECKPOINT);
    if (checkpoint < 10 || checkpoint <= data.unlockedWaveStart) return;
    data.unlockedWaveStart = checkpoint;
    safeSave();
    toast("Neue Startwelle freigeschaltet", `Du kannst künftig direkt bei Welle ${checkpoint} starten.`);
  }
  function companionOwnerBonuses(item) {
    if (!item || itemDef(item).category !== "companion") return { damage: 0, defense: 0 };
    const def = itemDef(item);
    const rarityBaseDamage = [2, 4, 7, 11, 16, 20, 25, 32, 42][rarityIndex(item)] || 2;
    const rarityBaseDefense = [1, 2, 4, 6, 9, 12, 15, 20, 27][rarityIndex(item)] || 1;
    const star = clamp(Number(item.star) || 0, 0, MAX_STAR);
    let damage = rarityBaseDamage * (1 + star * .28);
    let defense = rarityBaseDefense * (1 + star * .24);
    if (["street-dog", "shepherd-dog", "battle-hound"].includes(def.id)) defense += 1 + star * .45;
    if (["alley-cat", "ranger-cat", "lynx-companion", "tiger-companion", "void-beast"].includes(def.id)) damage += 1.5 + star * .55;
    if (["medic-companion", "phoenix-cub"].includes(def.id)) defense += 3 + star * .7;
    if (["scout-companion", "gunner-companion", "arc-mage", "guardian-drone"].includes(def.id)) damage += 2 + star * .65;
    return { damage: Math.round(damage * ARSENAL_STRENGTH_MULTIPLIER), defense: Math.round(defense * ARSENAL_STRENGTH_MULTIPLIER) };
  }

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
  function safeSessionRole() {
    try {
      const parsed = JSON.parse(sessionStorage.getItem("lifebuilder-2026-online-mod-session") || "null");
      if (!parsed?.authorized || Number(parsed.expiresAt || 0) <= Date.now()) return "";
      return String(parsed.role || "").toLowerCase();
    } catch {
      return "";
    }
  }
  function currentStaffContext() {
    try {
      const api = window.JKGamesSettingsMenu || window.LifeBuilderSettingsMenu || window.LifeBuilderOnlineMod;
      const live = api?.getRole?.() || null;
      if (live) return { role: String(live.role || "").toLowerCase(), active: live.active !== false };
      const parsed = JSON.parse(sessionStorage.getItem("lifebuilder-2026-online-mod-session") || "null");
      if (!parsed?.authorized || Number(parsed.expiresAt || 0) <= Date.now()) return { role: "", active: false };
      return { role: String(parsed.role || "").toLowerCase(), active: true };
    } catch {
      const role = safeSessionRole();
      return { role, active: !!role };
    }
  }
  function currentStaffRole() {
    return currentStaffContext().role;
  }
  function canUseStaffModMenu() {
    const staff = currentStaffContext();
    return staff.active && ["admin", "owner"].includes(staff.role);
  }
  async function verifyFightAdminRole() {
    if (!canUseStaffModMenu()) return false;
    try {
      const core = window.LifeBuilderFirebaseCore;
      if (!core?.load) return false;
      const fb = await core.load();
      const user = await core.waitForAuth?.(7000) || fb.auth.currentUser;
      if (!user) return false;
      const snapshot = await fb.getDoc(fb.doc(fb.db, "staffRoles", user.uid));
      if (!snapshot.exists()) return false;
      const data = snapshot.data() || {};
      const role = String(data.role || "").toLowerCase();
      return data.active !== false && ["admin", "owner"].includes(role);
    } catch (error) {
      console.warn("Fight.KL Rollenprüfung", error);
      return false;
    }
  }
  function staffRoleLabel() {
    const role = currentStaffRole();
    if (role === "owner") return "Owner";
    if (role === "admin") return "Admin";
    return "Kein Zugriff";
  }
  function fightAdminButtonHtml() {
    return canUseStaffModMenu() ? `<button class="fkl-btn gold" type="button" data-fkl-admin-open>🛠 Mod-Menü</button>` : "";
  }
  async function openFightAdminMenu() {
    if (!canUseStaffModMenu()) return toast("Kein Zugriff", "Nur aktive Admin- und Owner-Konten sehen dieses Mod-Menü.");
    toast("Rolle wird geprüft", "Firebase bestätigt deinen Admin- oder Owner-Zugriff.");
    if (!await verifyFightAdminRole()) return toast("Zugriff nicht bestätigt", "Das Mod-Menü bleibt gesperrt, bis Firebase eine aktive Admin- oder Owner-Rolle bestätigt.");
    renderFightAdminMenu();
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
    makeItem("baseball-bat"), makeItem("uzi"), makeItem("street-vest"),
    makeItem("speed-chip"), makeItem("scavenger-token")
  ];
}

  function levelNeed(level) { return Math.round(700 + Math.pow(Math.max(1, level), 1.82) * 250); }
function ensureStateV116() {
  const appState = getAppState();
  if (!appState) return null;
  appState.fightKl ||= {};
  const data = appState.fightKl;
  const hasStoredInventory = Object.prototype.hasOwnProperty.call(data, "inventory");
  data.version = VERSION;
  data.level = clamp(Math.floor(Number(data.level) || 1), 1, MAX_LEVEL);
  data.xp = Math.max(0, Math.floor(Number(data.xp) || 0));
  data.totalXp = Math.max(data.xp, Math.floor(Number(data.totalXp) || data.xp));
  data.bestWave = Math.max(0, Math.floor(Number(data.bestWave) || 0));
  data.bestScore = Math.max(0, Math.floor(Number(data.bestScore) || 0));
  data.totalKills = Math.max(0, Math.floor(Number(data.totalKills) || 0));
  data.runs = Math.max(0, Math.floor(Number(data.runs) || 0));
  if (!hasStoredInventory) data.inventory = defaultInventory();
  else if (!Array.isArray(data.inventory)) data.inventory = [];
  data.inventory = data.inventory.slice(0, INVENTORY_LIMIT).map(raw => {
    const def = ITEM_MAP.get(raw?.baseId);
    if (!def) return null;
    const star = clamp(Math.floor(Number(raw.star) || 0), 0, MAX_STAR);
    const rarity = RARITIES[raw.rarity] ? raw.rarity : def.rarity;
    const max = itemMaxDurability({ baseId: def.id, rarity, star });
    return { uid: String(raw.uid || uid()), baseId: def.id, rarity, star, durability: clamp(Number(raw.durability ?? max), 0, max), acquiredAt: Number(raw.acquiredAt || Date.now()) };
  }).filter(Boolean);

  data.equipped ||= {};
  const legacyWeaponId = String(data.equipped.weapon || "");
  if (legacyWeaponId) {
    const legacy = data.inventory.find(item => item.uid === legacyWeaponId);
    const legacySlot = legacy ? equipmentSlotForDef(itemDef(legacy)) : "";
    if (legacySlot && !data.equipped[legacySlot]) data.equipped[legacySlot] = legacyWeaponId;
  }
  EQUIPMENT_SLOT_KEYS.forEach(slot => {
    const found = data.inventory.find(item => item.uid === data.equipped[slot] && slotAcceptsItem(slot, item));
    data.equipped[slot] = found ? found.uid : "";
  });
  delete data.equipped.weapon;
  const findBy = predicate => data.inventory.find(predicate)?.uid || "";
  if (!data.equipped.sidearm) data.equipped.sidearm = findBy(item => item.baseId === "service-pistol") || findBy(item => equipmentSlotForDef(itemDef(item)) === "sidearm");
  if (!data.equipped.melee) data.equipped.melee = findBy(item => item.baseId === "baseball-bat") || findBy(item => equipmentSlotForDef(itemDef(item)) === "melee");
  if (!data.equipped.primary) data.equipped.primary = findBy(item => ["uzi", "compact-carbine"].includes(item.baseId)) || findBy(item => equipmentSlotForDef(itemDef(item)) === "primary");
  if (!data.equipped.armor) data.equipped.armor = findBy(item => item.baseId === "street-vest");
  if (!data.equipped.boots) data.equipped.boots = findBy(item => item.baseId === "runner-boots");
  if (!data.equipped.chip) data.equipped.chip = findBy(item => item.baseId === "speed-chip");
  if (!data.equipped.charm) data.equipped.charm = findBy(item => item.baseId === "scavenger-token");
  data.activeWeaponSlot = WEAPON_SLOT_KEYS.includes(data.activeWeaponSlot) ? data.activeWeaponSlot : (data.equipped.primary ? "primary" : data.equipped.sidearm ? "sidearm" : "melee");

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
    ["damage", "health", "shield", "mountArmor", "armor", "regen", "crit", "critDamage", "lifesteal", "bossDamage", "loot", "dodge", "damagePct", "reloadPct", "magazinePct", "companionDamage", "companionHealth", "companionRange", "companionSpeed", "companionHeal", "companionPierce", "companionSplash", "companionRoar", "companionDamagePct", "companionHealthPct", "companionRatePct", "companionCareHealthPct", "companionCareHealPct", "mountCareHealthPct", "mountCareHealPct", "dodgeHeal", "dodgeBurst"].forEach(key => {
      if (Number.isFinite(def[key])) out[key] = def[key] * (key === "armor" || key.endsWith("Pct") || ["speed", "crit", "critDamage", "lifesteal", "bossDamage", "loot", "dodge"].includes(key) ? (1 + star * .26 + rarityIndex(item) * .08) : mult);
    });
    if (Number.isFinite(def.speed)) out.speed = def.id === "speed-chip" ? SPEED_BONUS[star] * (1 + rarityIndex(item) * .1) : def.speed * (1 + star * .32 + rarityIndex(item) * .08);
    if (Number.isFinite(def.companionRate)) out.companionRate = def.companionRate * (1 + star * .10 + rarityIndex(item) * .025);
    if (Number.isFinite(def.fireRate)) out.fireRate = def.fireRate * (1 + star * .08 + rarityIndex(item) * .018);
    if (Number.isFinite(def.magazine)) out.magazine = Math.round(def.magazine * (1 + star * .07 + rarityIndex(item) * .025));
    if (Number.isFinite(def.reload)) out.reload = def.reload * Math.max(.42, 1 - star * .065 - rarityIndex(item) * .015);
    if (Number.isFinite(def.careCooldown)) out.careCooldown = def.careCooldown * Math.max(.45, 1 - star * .07 - rarityIndex(item) * .025);
    const halfStrengthStats = [
      "damage", "splash", "health", "shield", "mountArmor", "armor", "regen", "crit", "critDamage",
      "lifesteal", "bossDamage", "loot", "dodge", "damagePct", "reloadPct", "magazinePct",
      "companionDamage", "companionHealth", "companionHeal", "companionSplash", "companionRoar",
      "companionDamagePct", "companionHealthPct", "companionRatePct", "companionCareHealthPct",
      "companionCareHealPct", "mountCareHealthPct", "mountCareHealPct", "dodgeHeal", "dodgeBurst", "speed"
    ];
    halfStrengthStats.forEach(key => { if (Number.isFinite(out[key])) out[key] *= ARSENAL_STRENGTH_MULTIPLIER; });
    out.mult = mult * ARSENAL_STRENGTH_MULTIPLIER;
    return out;
  }
function powerScore() {
  const data = ensureState();
  if (!data) return 0;
  return EQUIPMENT_SLOT_KEYS.reduce((sum, slot) => {
    const item = equipped(slot); if (!item) return sum;
    const stats = effectiveStats(item);
    return sum + Math.round((stats.damage || 0) * 4 + (stats.health || 0) * 1.5 + (stats.armor || 0) * 10 + (stats.speed || 0) * 12 + (stats.mountArmor || 0) * .7 + stats.mult * 150);
  }, data.level * 50);
}

function aggregateLoadoutStats() {
  const data = ensureState();
  const items = EQUIPMENT_SLOT_KEYS.map(slot => equipped(slot)).filter(Boolean).map(effectiveStats);
  const sum = key => items.reduce((total, item) => total + Number(item[key] || 0), 0);
  const weapons = WEAPON_SLOT_KEYS.map(slot => equipped(slot)).filter(Boolean).map(effectiveStats);
  const strongest = weapons.reduce((best, item) => Math.max(best, Number(item.damage || 0)), 0);
  return {
    health: Math.round(130 + data.level * 3 + sum("health")),
    armor: Math.round(Math.min(72, sum("armor"))),
    speed: Math.round(sum("speed") - items.reduce((t, item) => t + Number(item.speedPenalty || 0) * 100, 0)),
    damage: Math.round(strongest), damagePct: Math.round(sum("damagePct")),
    shield: Math.round(sum("shield")), crit: Math.round(5 + sum("crit")),
    dodge: Math.round(Math.min(48, sum("dodge"))), loot: Math.round(sum("loot")),
    mountArmor: Math.round(sum("mountArmor")), power: powerScore()
  };
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
    UI.overlay.querySelector("[data-fkl-home]").addEventListener("click", () => UI.session ? pauseCombat() : UI.duel ? stopDuel(true) : renderDashboard());
    UI.overlay.querySelector("[data-fkl-close]").addEventListener("click", () => UI.session ? showExitConfirm() : UI.duel ? leaveOnlineDuel(true) : returnToTopGames());
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
    const modal = showModal(`<div style="font-size:60px">⚔️</div><small class="fkl-kicker">FIGHT.KL START</small><h3>Deine endlose Upgrade-Arena</h3><p>Besiege immer stärkere Bot-Wellen, sammle Items und kombiniere zwei identische Gegenstände zur nächsten Sternstufe. Rüste Nahkampf, Pistole und Langwaffe gleichzeitig aus, ergänze Helm, Rüstung, Reittier und Begleiter. Haustierpflege auf Slot 4 und Reittierpflege auf Slot 5 erhöhen das Leben und können beide im Kampf retten oder heilen.</p><div class="fkl-modal-actions"><button class="fkl-btn primary" type="button" data-fkl-tutorial-ok>Verstanden</button></div>`);
    modal.querySelector("[data-fkl-tutorial-ok]").addEventListener("click", () => { data.tutorialDone = true; safeSave(); modal.remove(); });
  }

function renderDashboard() {
  if (!UI.main) return;
  stopCombat(false);
  const data = ensureState();
  const need = data.level >= MAX_LEVEL ? 1 : levelNeed(data.level);
  const pct = data.level >= MAX_LEVEL ? 100 : clamp(data.xp / need * 100, 0, 100);
  const weapon = equipped(data.activeWeaponSlot) || equipped("primary") || equipped("sidearm") || equipped("melee");
  UI.main.innerHTML = `<div class="fkl-dashboard"><section class="fkl-panel fkl-hero"><div class="fkl-hero-copy"><small class="fkl-kicker">UNENDLICHE BOT-WELLEN · BOSS ALLE 10 WELLEN</small><h1>FIGHT<span>.KL</span></h1><p>Baue dein Arsenal auf, kombiniere zwei identische Items zu Sternen und entwickle normale Ausrüstung bis Legendär. Special-, mystische und exotische Ausrüstung besitzt eigene Endgame-Linien. Universe ist die neue höchste Stufe ab Fight-Level 50. Drei Waffen, Vollanzug, Helm und Reittier bilden deinen persönlichen Build.</p><div class="fkl-hero-actions"><button class="fkl-btn primary" type="button" data-fkl-start>⚔ Kampf starten</button><button class="fkl-btn" type="button" data-fkl-inventory>🎒 Inventar & Ausrüstung</button><button class="fkl-btn" type="button" data-fkl-shop>🛒 Arsenal-Shop</button></div></div><div class="fkl-hero-figure"></div></section><aside class="fkl-panel fkl-level-card"><div class="fkl-level-row"><div><small class="fkl-kicker">DEIN FIGHT-PROFIL</small><h3>${escapeHtml(playerName())}</h3></div><strong>LV ${data.level}</strong></div><div class="fkl-progress"><i style="width:${pct}%"></i></div><small>${data.level >= MAX_LEVEL ? "Maximallevel erreicht" : `${NUMBER.format(data.xp)} / ${NUMBER.format(need)} XP bis Level ${data.level + 1}`}</small><div class="fkl-stat-grid" style="margin-top:15px"><div class="fkl-stat-card"><small>Aktive Waffe</small><b>${escapeHtml(itemDef(weapon).name)}</b></div><div class="fkl-stat-card"><small>Waffen-Slot</small><b>${escapeHtml(SLOT_META[data.activeWeaponSlot]?.name || "Waffe")}</b></div><div class="fkl-stat-card"><small>Bestleistung</small><b>Welle ${data.bestWave}</b></div><div class="fkl-stat-card"><small>Gesamtkills</small><b>${NUMBER.format(data.totalKills)}</b></div></div></aside><div class="fkl-dashboard-lower"><article class="fkl-panel fkl-feature" data-fkl-inventory><i>🎒</i><b>Merge & Loadout</b><small>Charakter in der Mitte, zehn Ausrüstungsplätze und zwei gleiche Items pro Stern.</small></article><article class="fkl-panel fkl-feature" data-fkl-loadout><i>🧍</i><b>Charakterwerte</b><small>Tempo, Stärke, Rüstung, Schild, Reittierpanzerung und alle Equip-Slots.</small></article><article class="fkl-panel fkl-feature" data-fkl-shop><i>🛒</i><b>Arsenal-Shop</b><small>Über 70 neue Items, halbierte Kampfwerte und Universe-Ausrüstung ab Fight-Level 50.</small></article><article class="fkl-panel fkl-feature" data-fkl-leader><i>🏆</i><b>Online-Scores</b><small>Firebase-Rangliste nach höchster Welle und bestem Score.</small></article></div></div>`;
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
  const locked = data.level < requiredLevel(item); const slot = equipmentSlotForDef(def);
  return `<article class="fkl-item rarity-${rarityKey(item)} ${selected ? "selected" : ""} ${isEquipped ? "equipped" : ""} ${locked ? "locked" : ""}" style="${itemStyle(item)}" data-fkl-item="${item.uid}" draggable="true" title="${escapeHtml(SLOT_META[slot]?.hint || def.text)}"><button class="fkl-item-info" type="button" data-fkl-item-info="${item.uid}" title="Item-Information">i</button><div class="fkl-item-icon">${def.icon}</div><span class="rarity">${r.name}</span><h4>${escapeHtml(def.name)}</h4><div class="fkl-stars">${starText(item.star)}</div><small>${locked ? `Nutzbar ab Level ${requiredLevel(item)}` : escapeHtml(def.category === "weapon" ? `${Math.round(effectiveStats(item).damage)} Schaden · ${SLOT_META[slot]?.name || "Waffe"}` : def.text)}</small>${max ? `<div class="fkl-durability"><i style="width:${pct}%"></i></div><small>${Math.round(item.durability)}/${max}</small>` : ""}</article>`;
}

function detailHtml(item) {
  if (!item) return `<aside class="fkl-panel fkl-detail"><h3>Item auswählen</h3><p style="color:var(--fkl-muted)">Tippe ein Item an oder ziehe es auf den passenden Ausrüstungsplatz.</p></aside>`;
  const def = itemDef(item), r = rarityDef(item), stats = effectiveStats(item), data = ensureState();
  const slot = equipmentSlotForDef(def); const isEquipped = data.equipped[slot] === item.uid; const max = itemMaxDurability(item); const req = requiredLevel(item); const locked = data.level < req;
  const lines = [];
  if (def.category === "weapon") {
    lines.push(["Slot", SLOT_META[slot]?.name || "Waffe"]); lines.push(["Schaden", Math.round(stats.damage)]); lines.push(["Angriffe/Sek.", stats.fireRate.toFixed(2)]);
    if (def.attack !== "melee") lines.push(["Magazin", stats.magazine]);
    if (def.attack !== "melee") lines.push(["Nachladen", `${stats.reload.toFixed(2)} s`]);
    lines.push(["Reichweite", Math.round(stats.range)]);
    if (stats.special) lines.push(["Special", SPECIALS[stats.special]?.name || stats.special]);
  }
  if (stats.health) lines.push(["Extra-Leben", `+${Math.round(stats.health)}`]);
  if (stats.armor) lines.push(["Rüstung", `${Math.round(stats.armor)} %`]);
  if (stats.speed) lines.push(["Tempo", `+${Math.round(stats.speed)} %`]);
  if (stats.mountArmor) lines.push(["Reittierpanzerung", `+${Math.round(stats.mountArmor)}`]);
  if (stats.damagePct) lines.push(["Gesamtschaden", `+${Math.round(stats.damagePct)} %`]);
  if (stats.crit) lines.push(["Krit-Chance", `+${Math.round(stats.crit)} %`]);
  if (stats.lifesteal) lines.push(["Lebensraub", `+${Math.round(stats.lifesteal)} %`]);
  if (stats.loot) lines.push(["Beutechance", `+${Math.round(stats.loot)} %`]);
  if (stats.shield) lines.push(["Startschutz", `+${Math.round(stats.shield)}`]);
  if (stats.companionDamage) lines.push(["Begleiter-Schaden", Math.round(stats.companionDamage)]);
  if (stats.companionHealth) lines.push(["Begleiter-Leben", Math.round(stats.companionHealth)]);
  if (stats.companionRate) lines.push(["Begleiter-Angriffe/Sek.", Number(stats.companionRate).toFixed(2)]);
  if (stats.companionRange) lines.push(["Begleiter-Reichweite", Math.round(stats.companionRange)]);
  if (stats.companionHeal) lines.push(["Begleiter-Heilung", `${Number(stats.companionHeal).toFixed(1)}/s`]);
  if (stats.companionDamagePct) lines.push(["Begleiter-Bonus", `+${Math.round(stats.companionDamagePct)} %`]);
  if (stats.companionCareHealthPct) lines.push(["Begleiter-Leben", `+${Math.round(stats.companionCareHealthPct)} %`]);
  if (stats.companionCareHealPct) lines.push(["Heilung mit Taste 4", `${Math.round(stats.companionCareHealPct)} %`]);
  if (stats.mountCareHealthPct) lines.push(["Reittier-Panzerung", `+${Math.round(stats.mountCareHealthPct)} %`]);
  if (stats.mountCareHealPct) lines.push(["Heilung mit Taste 5", `${Math.round(stats.mountCareHealPct)} %`]);
  if (stats.careCooldown) lines.push(["Pflege-Cooldown", `${Number(stats.careCooldown).toFixed(1)} s`]);
  if (def.category === "companion") {
    const ownerBonus = companionOwnerBonuses(item);
    lines.push(["Bonus für deinen Schaden", `+${ownerBonus.damage} %`]);
    lines.push(["Bonus für deine Verteidigung", `+${ownerBonus.defense} %`]);
  }
  if (stats.dodgeHeal) lines.push(["Heilung bei Ausweichen", `+${Math.round(stats.dodgeHeal)}`]);
  lines.push(["Verkaufswert (30 %)", EURO.format(fightItemSellPrice(item))]);
  if (max) lines.push(["Haltbarkeit", `${Math.round(item.durability)} / ${max}`]);
  const repairFamily = def.category === "weapon" ? def.family : ["armor","helmet","suit"].includes(def.category) ? "armor" : "";
  const canRepair = max && item.durability < max && (data.repairKits[repairFamily] > 0 || data.repairKits.universal > 0);
  const currentIndex = rarityIndex(item); const nextKey = currentIndex < rarityIndex("legendary") ? RARITY_ORDER[currentIndex + 1] : ""; const next = nextKey ? RARITIES[nextKey] : null;
  const canPromote = item.star >= MAX_STAR && !!next;
  const adminBlock = canUseStaffModMenu() ? `<div class="fkl-admin-block"><div class="fkl-admin-head"><small class="fkl-kicker">ADMIN / OWNER MOD-MENÜ</small><b>${staffRoleLabel()}</b></div><p>Direkte Item-Verwaltung nur für Admin und Owner. Sterne werden sofort übernommen.</p><div class="fkl-admin-stars">${Array.from({length: MAX_STAR + 1}, (_,index) => `<button class="${Number(item.star||0)===index?"active":""}" type="button" data-fkl-admin-star="${item.uid}" data-star="${index}">${index===0?"Basis":`${index}★`}</button>`).join("")}</div><div class="fkl-admin-actions"><button class="fkl-btn" type="button" data-fkl-admin-star-step="${item.uid}" data-step="-1">−1 Stern</button><button class="fkl-btn" type="button" data-fkl-admin-star-step="${item.uid}" data-step="1">+1 Stern</button><button class="fkl-btn" type="button" data-fkl-admin-durability="${item.uid}">Max. Haltbarkeit</button><button class="fkl-btn gold" type="button" data-fkl-admin-duplicate="${item.uid}">Duplizieren</button></div></div>` : "";
  return `<aside class="fkl-panel fkl-detail rarity-${rarityKey(item)}" style="${itemStyle(item)}"><div class="fkl-detail-icon">${def.icon}</div><span class="fkl-rarity">${r.name}</span><h3>${escapeHtml(def.name)}</h3><div class="fkl-stars">${starText(item.star)}</div><p style="color:var(--fkl-muted)">${escapeHtml(def.text)}</p>${locked ? `<div class="fkl-level-lock">🔒 Nutzbar ab Fight-Level ${req}</div>` : ""}<div class="fkl-stat-list">${lines.map(([k,v]) => `<div class="fkl-stat-line"><span>${escapeHtml(k)}</span><b>${escapeHtml(v)}</b></div>`).join("")}</div><div class="fkl-detail-actions"><button class="fkl-btn primary" type="button" data-fkl-equip="${item.uid}" ${locked ? "disabled" : ""}>${isEquipped ? `${SLOT_META[slot]?.name || "Item"} ausgerüstet` : `In ${SLOT_META[slot]?.name || "Slot"} ausrüsten`}</button>${canPromote ? `<button class="fkl-btn rarity-up" type="button" data-fkl-promote="${item.uid}">⬆ Zu ${next.name}</button>` : ""}${item.star >= MAX_STAR && currentIndex >= rarityIndex("legendary") ? `<small class="fkl-rarity-cap">${r.name} bleibt eine eigene Itemlinie und kann nur bis fünf Sterne verbessert werden.</small>` : ""}${max ? `<button class="fkl-btn" type="button" data-fkl-repair="${item.uid}" ${canRepair ? "" : "disabled"}>Reparieren</button>` : ""}${data.inventory.length <= 1 ? `<button class="fkl-btn danger" type="button" disabled title="Das letzte Item muss im Inventar bleiben.">Letztes Item · nicht verkäuflich</button>` : `<button class="fkl-btn danger" type="button" data-fkl-sell="${item.uid}">Verkaufen · ${EURO.format(fightItemSellPrice(item))}</button>`}</div>${adminBlock}</aside>`;
}


  function loadoutSlotHtml(slot) {
    const data = ensureState(); const meta = SLOT_META[slot]; const item = equipped(slot); const def = item ? itemDef(item) : null; const rarity = item ? rarityDef(item) : null;
    return `<div class="fkl-loadout-slot ${item ? `filled rarity-${rarityKey(item)}` : ""}" style="${item ? itemStyle(item) : ""}" data-fkl-equip-slot="${slot}" title="${escapeHtml(meta.hint)}"><button class="fkl-slot-info" type="button" data-fkl-slot-info="${slot}" title="${escapeHtml(meta.hint)}">i</button><span class="fkl-slot-number">${WEAPON_SLOT_KEYS.includes(slot) ? WEAPON_SLOT_KEYS.indexOf(slot)+1 : ""}</span><i>${def?.icon || meta.icon}</i><small>${escapeHtml(meta.name)}</small><b>${escapeHtml(def?.name || "Leer")}</b>${item ? `<em>${escapeHtml(rarity.name)} · ${starText(item.star)}</em>` : `<em>Item hier ablegen</em>`}</div>`;
  }
  function loadoutPanelHtml() {
    const data = ensureState(); const stats = aggregateLoadoutStats(); const style = STYLE_MAP.get(data.cosmetics.active) || CHARACTER_STYLES[0];
    return `<section class="fkl-panel fkl-loadout-panel"><div class="fkl-loadout-title"><div><small class="fkl-kicker">DEIN LOADOUT</small><h3>${escapeHtml(playerName())}</h3><p>Ziehe Items aus dem Inventar direkt auf den passenden Platz. Im Kampf wechselst du mit 1, 2 und 3.</p></div><div class="fkl-loadout-power">POWER <b>${NUMBER.format(stats.power)}</b></div></div><div class="fkl-loadout-grid"><div class="fkl-loadout-side left">${["helmet","armor","suit","boots","mount"].map(loadoutSlotHtml).join("")}</div><div class="fkl-character-card" style="--body:${style.body};--accent:${style.accent};--trim:${style.trim}"><div class="fkl-character-aura"></div><div class="fkl-character-model"><span class="head"></span><span class="face"></span><span class="body"></span><span class="arm a1"></span><span class="arm a2"></span><span class="leg l1"></span><span class="leg l2"></span></div><strong>${escapeHtml(playerName())}</strong><small>${escapeHtml(style.name)} · Fight-Level ${data.level}</small></div><div class="fkl-loadout-side right">${["melee","sidearm","primary","chip","charm"].map(loadoutSlotHtml).join("")}</div></div><div class="fkl-loadout-stats"><div><small>Stärke</small><b>${NUMBER.format(stats.damage)}</b></div><div><small>Schadensbonus</small><b>+${stats.damagePct}%</b></div><div><small>Tempo</small><b>+${stats.speed}%</b></div><div><small>Leben</small><b>${NUMBER.format(stats.health)}</b></div><div><small>Rüstung</small><b>${stats.armor}%</b></div><div><small>Schild</small><b>${NUMBER.format(stats.shield)}</b></div><div><small>Krit</small><b>${stats.crit}%</b></div><div><small>Ausweichen</small><b>${stats.dodge}%</b></div><div><small>Beute</small><b>+${stats.loot}%</b></div><div><small>Reittier-Panzerung</small><b>${NUMBER.format(stats.mountArmor)}</b></div></div></section>`;
  }

  function renderInventory() {
    if (!UI.main) return;
    const data = ensureState();
    clearTimeout(UI.mergeConfirmTimer); UI.mergeConfirmTimer = 0; UI.mergeConfirmOpen = false;
    UI.shell?.querySelector(".fkl-pause-modal")?.remove();
    UI.selected.clear();
    UI.detailUid = data.inventory[0]?.uid || "";
    drawInventory();
  }
function drawInventory() {
  const data = ensureState(); if (!UI.main) return;
  const detail = data.inventory.find(item => item.uid === UI.detailUid) || null;
  UI.main.innerHTML = `<div class="fkl-page">${pageHeader("Merge-Inventar & Loadout", `${data.inventory.length}/${INVENTORY_LIMIT} Plätze · Zwei identische Items derselben Seltenheit und Sternstufe ergeben den nächsten Stern. Verkauf bringt 30 % des berechneten Itemwerts. Das letzte Item bleibt immer im Inventar.`, `<button class="fkl-btn gold" type="button" data-fkl-merge ${UI.selected.size === 2 ? "" : "disabled"}>✨ ${UI.selected.size}/2 matchen</button>`)}${loadoutPanelHtml()}<div class="fkl-inventory-layout"><section class="fkl-inventory">${data.inventory.map(itemCard).join("")}</section>${detailHtml(detail)}</div></div>`;
  bindPageHome();
  UI.main.querySelectorAll("[data-fkl-item]").forEach(card => {
    card.addEventListener("dragstart", event => { event.dataTransfer?.setData("text/fight-kl-item", card.dataset.fklItem); event.dataTransfer && (event.dataTransfer.effectAllowed = "move"); card.classList.add("dragging"); });
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
    card.addEventListener("click", event => {
      if (event.target.closest("[data-fkl-item-info]")) return;
      const id = card.dataset.fklItem; const item = data.inventory.find(x => x.uid === id); if (!item) return;
      UI.detailUid = id;
      if (event.ctrlKey || event.shiftKey || event.pointerType === "touch") toggleMergeSelection(item);
      else if (UI.selected.size && !UI.selected.has(id)) toggleMergeSelection(item);
      else UI.selected.has(id) ? UI.selected.delete(id) : UI.selected.add(id);
      drawInventory();
    });
  });
  UI.main.querySelectorAll("[data-fkl-item-info]").forEach(btn => btn.addEventListener("click", event => { event.stopPropagation(); UI.detailUid = btn.dataset.fklItemInfo; drawInventory(); }));
  UI.main.querySelectorAll("[data-fkl-equip-slot]").forEach(slotNode => {
    slotNode.addEventListener("dragover", event => { event.preventDefault(); event.dataTransfer && (event.dataTransfer.dropEffect = "move"); slotNode.classList.add("drag-over"); });
    slotNode.addEventListener("dragleave", () => slotNode.classList.remove("drag-over"));
    slotNode.addEventListener("drop", event => { event.preventDefault(); slotNode.classList.remove("drag-over"); const id = event.dataTransfer?.getData("text/fight-kl-item"); if (id) equipItemToSlot(id, slotNode.dataset.fklEquipSlot); });
  });
  UI.main.querySelectorAll("[data-fkl-slot-info]").forEach(btn => btn.addEventListener("click", event => { event.stopPropagation(); const item = equipped(btn.dataset.fklSlotInfo); if (item) { UI.detailUid = item.uid; drawInventory(); } else toast(SLOT_META[btn.dataset.fklSlotInfo]?.name || "Slot", SLOT_META[btn.dataset.fklSlotInfo]?.hint || "Dieser Slot ist leer."); }));
  UI.main.querySelector("[data-fkl-merge]")?.addEventListener("click", requestMergeConfirmation);
  UI.main.querySelector("[data-fkl-equip]")?.addEventListener("click", event => equipItem(event.currentTarget.dataset.fklEquip));
  UI.main.querySelector("[data-fkl-repair]")?.addEventListener("click", event => repairItem(event.currentTarget.dataset.fklRepair));
  UI.main.querySelector("[data-fkl-promote]")?.addEventListener("click", event => promoteItem(event.currentTarget.dataset.fklPromote));
  UI.main.querySelector("[data-fkl-sell]")?.addEventListener("click", event => requestSellFightItem(event.currentTarget.dataset.fklSell));
}

  function toggleMergeSelection(item) {
    if (UI.selected.has(item.uid)) { UI.selected.delete(item.uid); return; }
    if (UI.selected.size >= 2) { toast("Maximal zwei Items", "Entferne zuerst eine Auswahl."); return; }
    if (UI.selected.size) {
      const first = ensureState().inventory.find(x => x.uid === [...UI.selected][0]);
      if (!first || first.baseId !== item.baseId || first.star !== item.star || rarityKey(first) !== rarityKey(item)) { toast("Nicht kombinierbar", "Wähle zwei identische Items derselben Seltenheit und Sternstufe."); return; }
    }
    UI.selected.add(item.uid);
    if (UI.selected.size === 2) {
      clearTimeout(UI.mergeConfirmTimer);
      UI.mergeConfirmTimer = window.setTimeout(requestMergeConfirmation, 40);
    }
  }
  function requestMergeConfirmation() {
    clearTimeout(UI.mergeConfirmTimer);
    UI.mergeConfirmTimer = 0;
    if (UI.mergeConfirmOpen || !UI.shell) return;
    const data = ensureState();
    const selected = data.inventory.filter(item => UI.selected.has(item.uid));
    if (selected.length !== 2) return;
    const first = selected[0];
    const valid = first.star < MAX_STAR && selected.every(item => item.baseId === first.baseId && item.star === first.star && rarityKey(item) === rarityKey(first));
    if (!valid) {
      toast(first.star >= MAX_STAR ? "Seltenheit erhöhen" : "Merge nicht möglich", first.star >= MAX_STAR ? "Ein 5-Sterne-Item muss zuerst zur nächsten Seltenheit aufsteigen." : "Wähle zwei identische Items derselben Seltenheit und Sternstufe.");
      return;
    }
    UI.mergeConfirmOpen = true;
    const def = itemDef(first); const rarity = rarityDef(first);
    const nextStar = Math.min(MAX_STAR, first.star + 1);
    const preview = selected.map(() => `<span class="fkl-merge-confirm-item" style="${itemStyle(first)}"><i>${def.icon}</i><small>${starText(first.star)}</small></span>`).join("");
    const modal = showModal(`<div class="fkl-merge-confirm"><div class="fkl-merge-confirm-icon" style="${itemStyle(first)}">${def.icon}</div><small class="fkl-kicker">2 ITEMS AUSGEWÄHLT</small><h3>Diese zwei zusammen matchen?</h3><p><b>${escapeHtml(def.name)}</b><br>${escapeHtml(rarity.name)} · ${starText(first.star)} wird zu ${starText(nextStar)}</p><div class="fkl-merge-confirm-items">${preview}<b>→</b><span class="fkl-merge-confirm-result" style="${itemStyle(first)}"><i>${def.icon}</i><small>${starText(nextStar)}</small></span></div><div class="fkl-modal-actions fkl-merge-confirm-actions"><button class="fkl-btn gold" type="button" data-fkl-confirm-merge>✨ Matchen</button><button class="fkl-btn" type="button" data-fkl-cancel-merge>✕ Nicht matchen</button></div></div>`);
    const closeState = () => { UI.mergeConfirmOpen = false; clearTimeout(UI.mergeConfirmTimer); UI.mergeConfirmTimer = 0; };
    modal.querySelector("[data-fkl-confirm-merge]").addEventListener("click", () => { closeState(); modal.remove(); mergeSelected(); });
    modal.querySelector("[data-fkl-cancel-merge]").addEventListener("click", () => { closeState(); modal.remove(); UI.selected.clear(); drawInventory(); });
  }
  function mergeSelected() {
    const data = ensureState(); const selected = data.inventory.filter(item => UI.selected.has(item.uid));
    if (selected.length !== 2) return toast("Zwei Items nötig");
    const first = selected[0];
    if (first.star >= MAX_STAR || selected.some(item => item.baseId !== first.baseId || item.star !== first.star || rarityKey(item) !== rarityKey(first))) return toast("Merge nicht möglich", "Items müssen identisch sein und unter fünf Sternen liegen.");
    const selectedIds = new Set(selected.map(item => item.uid));
    const equippedSlots = Object.entries(data.equipped).filter(([,id]) => selectedIds.has(id)).map(([slot]) => slot);
    data.inventory = data.inventory.filter(item => !selectedIds.has(item.uid));
    const merged = makeItem(first.baseId, first.star + 1, null, rarityKey(first));
    data.inventory.unshift(merged); equippedSlots.forEach(slot => data.equipped[slot] = merged.uid);
    UI.selected.clear(); UI.mergeConfirmOpen = false; clearTimeout(UI.mergeConfirmTimer); UI.mergeConfirmTimer = 0; UI.detailUid = merged.uid; safeSave(); updateHead();
    const flash = document.createElement("div"); flash.className = "fkl-merge-flash"; flash.innerHTML = `<div class="fkl-merge-core">${itemDef(merged).icon}</div>`; document.body.appendChild(flash); setTimeout(() => flash.remove(), 800);
    playSound(720, .16, "triangle"); setTimeout(() => playSound(980, .2, "sine"), 130);
    setTimeout(() => { drawInventory(); toast(`${itemDef(merged).name} verbessert`, `${rarityDef(merged).name} · ${starText(merged.star)} erreicht.`); }, 420);
  }
function promoteItem(id) {
  const data = ensureState(); const item = data.inventory.find(entry => entry.uid === id); if (!item) return;
  if (item.star < MAX_STAR) return toast("Fünf Sterne nötig", "Erreiche zuerst fünf Sterne.");
  const currentIndex = rarityIndex(item);
  if (currentIndex >= rarityIndex("legendary")) return toast("Seltenheitsgrenze erreicht", `${rarityDef(item).name} ist eine eigene Itemlinie und wird nur noch über Sterne verbessert.`);
  const nextKey = RARITY_ORDER[currentIndex + 1]; const next = RARITIES[nextKey];
  item.rarity = nextKey; item.star = 0; item.durability = itemMaxDurability(item); UI.detailUid = item.uid; UI.selected.clear(); safeSave(); updateHead();
  const flash = document.createElement("div"); flash.className = `fkl-merge-flash rarity-${nextKey}`; flash.innerHTML = `<div class="fkl-merge-core">${itemDef(item).icon}</div>`; document.body.appendChild(flash); setTimeout(() => flash.remove(), 950);
  playSound(520, .12, "triangle"); setTimeout(() => playSound(920, .22, "sine"), 120); setTimeout(() => playSound(1320, .2, "triangle"), 260);
  setTimeout(() => { drawInventory(); toast("Seltenheit aufgestiegen", `${itemDef(item).name} ist jetzt ${next.name}.`); }, 480);
}

function equipItem(id) {
  const data = ensureState(); const item = data.inventory.find(x => x.uid === id); if (!item) return;
  const slot = equipmentSlotForDef(itemDef(item)); if (!slot) return toast("Kein Ausrüstungsplatz");
  equipItemToSlot(id, slot);
}
function equipItemToSlot(id, slot) {
  const data = ensureState(); const item = data.inventory.find(x => x.uid === id); if (!item) return;
  const def = itemDef(item); if (!slotAcceptsItem(slot, item)) return toast("Falscher Platz", `${def.name} gehört in ${SLOT_META[equipmentSlotForDef(def)]?.name || "einen anderen Slot"}.`);
  const req = requiredLevel(item); if (data.level < req) return toast(`Fight-Level ${req} nötig`, `${rarityDef(item).name} kann noch nicht ausgerüstet werden.`);
  if (itemMaxDurability(item) && item.durability <= 0) return toast("Item ist kaputt", "Repariere es vor dem Ausrüsten.");
  data.equipped[slot] = item.uid; if (WEAPON_SLOT_KEYS.includes(slot) && !data.equipped[data.activeWeaponSlot]) data.activeWeaponSlot = slot;
  safeSave(); updateHead(); drawInventory(); toast("Ausgerüstet", `${def.name} → ${SLOT_META[slot].name}`);
}

function repairItem(id) {
  const data = ensureState(); const item = data.inventory.find(x => x.uid === id); if (!item) return;
  const def = itemDef(item); const max = itemMaxDurability(item); if (!max || item.durability >= max) return;
  const family = def.category === "weapon" ? def.family : ["armor","helmet","suit"].includes(def.category) ? "armor" : "";
  let kit = family && data.repairKits[family] > 0 ? family : data.repairKits.universal > 0 ? "universal" : "";
  if (!kit) return toast("Kein Reparaturset", "Kaufe ein passendes Set im Shop.");
  data.repairKits[kit] -= 1; item.durability = clamp(item.durability + REPAIR_KITS[kit].amount, 0, max); safeSave(); drawInventory(); toast("Repariert", `${def.name}: ${Math.round(item.durability)}/${max}`);
}
function staffItemById(id){return ensureState().inventory.find(entry=>entry.uid===id)||null;}
function setStaffItemStar(id, star) {
  if (!canUseStaffModMenu()) return toast("Kein Zugriff", "Nur Admin und Owner können Items direkt bearbeiten.");
  const item = staffItemById(id); if (!item) return;
  item.star = clamp(Math.floor(Number(star) || 0), 0, MAX_STAR);
  item.durability = itemMaxDurability(item);
  UI.detailUid = item.uid; safeSave(); updateHead(); drawInventory();
  toast("Admin-Mod-Menü", `${itemDef(item).name} ist jetzt ${starText(item.star)}.`);
}
function shiftStaffItemStar(id, delta) {
  const item = staffItemById(id); if (!item) return;
  setStaffItemStar(id, clamp(Number(item.star || 0) + Number(delta || 0), 0, MAX_STAR));
}
function fillStaffItemDurability(id) {
  if (!canUseStaffModMenu()) return toast("Kein Zugriff", "Nur Admin und Owner können Items direkt bearbeiten.");
  const item = staffItemById(id); if (!item) return;
  const max = itemMaxDurability(item); if (!max) return toast("Keine Haltbarkeit", "Dieser Gegenstand besitzt keine Haltbarkeit.");
  item.durability = max;
  UI.detailUid = item.uid; safeSave(); updateHead(); drawInventory();
  toast("Admin-Mod-Menü", `${itemDef(item).name} wurde vollständig repariert.`);
}
function duplicateStaffItem(id) {
  if (!canUseStaffModMenu()) return toast("Kein Zugriff", "Nur Admin und Owner können Items direkt bearbeiten.");
  const data = ensureState(); const item = staffItemById(id); if (!item) return;
  if (data.inventory.length >= INVENTORY_LIMIT) return toast("Inventar voll", "Kein Platz mehr zum Duplizieren.");
  const copy = makeItem(item.baseId, item.star, null, rarityKey(item));
  copy.durability = Math.min(item.durability, itemMaxDurability(copy));
  data.inventory.unshift(copy);
  UI.detailUid = copy.uid; safeSave(); updateHead(); drawInventory();
  toast("Admin-Mod-Menü", `${itemDef(copy).name} wurde dupliziert.`);
}

function dailyShopItems(category = UI.shopCategory) {
  return ITEMS.filter(def => {
    if (["pistol", "automatic", "shotgun", "melee"].includes(category)) return def.category === "weapon" && def.family === category;
    if (["helmet", "armor", "suit", "boots", "chip", "charm", "companion", "companioncare", "mount", "mountcare"].includes(category)) return def.category === category;
    return false;
  }).sort((a,b) => rarityIndex(a.rarity) - rarityIndex(b.rarity) || (a.price || 0) - (b.price || 0));
}

  function shopPrice(def) { return Math.max(1, Math.round(def.price || RARITIES[def.rarity]?.price || 500)); }
  function fightItemFullValue(item) {
    if (!item) return 0;
    const def=itemDef(item),base=shopPrice(def),defaultRarity=RARITIES[def.rarity]||RARITIES.common,currentRarity=rarityDef(item);
    const rarityScale=Math.max(.35,Number(currentRarity.mult||1)/Math.max(.35,Number(defaultRarity.mult||1)));
    const mergeScale=Math.pow(2,clamp(Math.floor(Number(item.star)||0),0,MAX_STAR));
    return Math.max(1,Math.round(base*rarityScale*mergeScale));
  }
  function fightItemSellPrice(item) {
    return Math.max(1,Math.round(fightItemFullValue(item)*.30));
  }
  function requestSellFightItem(uidValue) {
    const data=ensureState();
    if (data.inventory.length <= 1) return toast("Letztes Item bleibt", "Das letzte Item im Fight.KL-Inventar kann nicht verkauft werden.");
    const item=data.inventory.find(entry=>entry.uid===uidValue);if(!item)return;
    const def=itemDef(item),price=fightItemSellPrice(item),equippedSlots=Object.entries(data.equipped).filter(([,id])=>id===item.uid).map(([slot])=>SLOT_META[slot]?.name||slot);
    const modal=showModal(`<div class="fkl-sell-confirm"><div class="fkl-merge-confirm-icon" style="${itemStyle(item)}">${def.icon}</div><small class="fkl-kicker">30 % VERKAUFSWERT</small><h3>${escapeHtml(def.name)} verkaufen?</h3><p>Du erhältst <b>${EURO.format(price)}</b>.${equippedSlots.length?`<br>Das Item wird automatisch aus ${escapeHtml(equippedSlots.join(", "))} entfernt.`:""}</p><div class="fkl-modal-actions"><button class="fkl-btn danger" type="button" data-fkl-confirm-sell>Verkaufen</button><button class="fkl-btn" type="button" data-fkl-cancel-sell>Behalten</button></div></div>`);
    modal.querySelector("[data-fkl-confirm-sell]")?.addEventListener("click",()=>{modal.remove();sellFightItem(item.uid)});
    modal.querySelector("[data-fkl-cancel-sell]")?.addEventListener("click",()=>modal.remove());
  }
  function sellFightItem(uidValue) {
    const data=ensureState();
    if (data.inventory.length <= 1) return toast("Letztes Item bleibt", "Das letzte Item im Fight.KL-Inventar kann nicht verkauft werden.");
    const index=data.inventory.findIndex(entry=>entry.uid===uidValue);if(index<0)return;
    const item=data.inventory[index],def=itemDef(item),price=fightItemSellPrice(item);
    Object.keys(data.equipped||{}).forEach(slot=>{if(data.equipped[slot]===item.uid)data.equipped[slot]="";});
    data.inventory.splice(index,1);UI.selected.delete(item.uid);if(UI.detailUid===item.uid)UI.detailUid=data.inventory[0]?.uid||"";
    if(!data.equipped[data.activeWeaponSlot])data.activeWeaponSlot=WEAPON_SLOT_KEYS.find(slot=>data.equipped[slot])||"melee";
    data.itemsSold=Math.max(0,Math.floor(Number(data.itemsSold)||0))+1;data.saleRevenue=Math.max(0,Math.floor(Number(data.saleRevenue)||0))+price;
    awardMoney(price,`Fight.KL Verkauf · ${def.name}`);safeSave();updateHead();drawInventory();toast("Item verkauft",`${def.name} · ${EURO.format(price)} erhalten.`);
  }
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
      content = `<div class="fkl-shop-grid">${catalog.map(def => { const r = RARITIES[def.rarity]; const price = shopPrice(def); const req = Math.max(def.minLevel || 1, r.minLevel || 1); const locked = data.level < req; return `<article class="fkl-panel fkl-shop-card rarity-${def.rarity}" style="--rarity:${r.color};--rarity-glow:${r.glow};--rarity-gradient:${r.gradient || r.color}"><div class="fkl-item-icon">${def.icon}</div><span class="fkl-kicker" style="color:${r.color}">${r.name}</span><h4>${escapeHtml(def.name)}</h4><p>${escapeHtml(def.text)}</p>${def.rarity === "universe" ? `<small class="fkl-universe-tag">🌌 UNIVERSE · LEVEL 50</small>` : ""}${def.special ? `<small class="fkl-special-tag">${SPECIALS[def.special]?.icon || "✦"} ${SPECIALS[def.special]?.name || "Special"}</small>` : ""}<div class="fkl-price">${EURO.format(price)}</div><button class="fkl-btn primary" type="button" data-fkl-buy-item="${def.id}" data-price="${price}" ${locked || data.inventory.length >= INVENTORY_LIMIT ? "disabled" : ""}>${locked ? `Ab Level ${req}` : data.inventory.length >= INVENTORY_LIMIT ? "Inventar voll" : "Kaufen"}</button></article>`; }).join("")}</div>`;
    }
    const universeBanner = `<section class="fkl-universe-banner ${data.level >= 50 ? "unlocked" : "locked"}"><div><small>NEUE HÖCHSTE SELTENHEIT</small><h3>🌌 UNIVERSE · AB FIGHT-LEVEL 50</h3><p>${data.level >= 50 ? "Freigeschaltet: Universe-Pistolen, Langwaffen, Schrotflinten, Nahkampfwaffen und drei neue Items in jeder Ausrüstungskategorie." : `Noch ${50 - data.level} Fight-Level bis zur Universe-Ausrüstung. Die Karten bleiben sichtbar, können vorher aber nicht gekauft oder ausgerüstet werden.`}</p></div><b>${data.level >= 50 ? "FREIGESCHALTET" : `LEVEL ${data.level}/50`}</b></section>`;
    UI.main.innerHTML = `<div class="fkl-page">${pageHeader("Arsenal-Shop", "Das gesamte bisherige Arsenal besitzt weiterhin dieselben Preise, aber nur noch 50 % seiner früheren Kampfwerte. Gegner und Wellen bleiben unverändert stark.")}<nav class="fkl-shop-tabs">${tabs}</nav>${universeBanner}${content}</div>`;
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
  const gearSlots = ["helmet","armor","suit","boots","chip","charm","mount"];
  const gearItems = Object.fromEntries(gearSlots.map(slot => [slot, equipped(slot)]));
  const gear = Object.fromEntries(gearSlots.map(slot => [slot, gearItems[slot] ? effectiveStats(gearItems[slot]) : {}]));
  const sum = key => gearSlots.reduce((total, slot) => total + Number(gear[slot][key] || 0), 0);
  const levelBonus = 1 + (data.level - 1) * .012;
  const damageMult = levelBonus * (1 + sum("damagePct") / 100);
  const speedBonus = sum("speed"), speedPenalty = gearSlots.reduce((total, slot) => total + Number(gear[slot].speedPenalty || 0), 0);
  const style = STYLE_MAP.get(data.cosmetics.active) || CHARACTER_STYLES[0];
  const weaponRuntimes = {};
  WEAPON_SLOT_KEYS.forEach(slot => {
    const item = equipped(slot); if (!item) return;
    const stats = effectiveStats(item); weaponRuntimes[slot] = { slot, item, stats, ammo: Math.max(1, Math.round(stats.magazine || 1)), reloading: false, reloadTimer: 0, specialCharge: 0, specialReady: false };
  });
  let activeWeaponSlot = WEAPON_SLOT_KEYS.includes(data.activeWeaponSlot) && weaponRuntimes[data.activeWeaponSlot] ? data.activeWeaponSlot : WEAPON_SLOT_KEYS.find(slot => weaponRuntimes[slot]);
  const active = weaponRuntimes[activeWeaponSlot] || { slot: "fists", item: null, stats: { id:"fists", name:"Fäuste", attack:"melee", family:"melee", rarity:"common", damage:9, fireRate:1.2, range:62, arc:1.5 }, ammo:1, reloading:false, reloadTimer:0, specialCharge:0, specialReady:false };
  const moduleSpecial = gear.chip.specialGrant || gear.suit.specialGrant || gear.helmet.specialGrant || "";
  const mountArmor = Math.round(Number(gear.mount.mountArmor || 0));
  return {
    x: WORLD_W / 2, y: WORLD_H / 2, radius: 18,
    maxHp: Math.round(130 + data.level * 3 + sum("health")), hp: 0,
    maxShield: Math.round(sum("shield")), shield: Math.round(sum("shield")),
    baseSpeed: 250 * (1 + (speedBonus - Number(gear.mount.speed || 0)) / 100) * Math.max(.55, 1 - speedPenalty),
    mountSpeedPct: Number(gear.mount.speed || 0), mountMaxArmor: mountArmor, mountArmor, mountActive: !!gearItems.mount && mountArmor > 0, mountItem: gearItems.mount, mountStats: gear.mount,
    speed: 250, armor: clamp(sum("armor") / 100, 0, .72),
    dodge: clamp(sum("dodge") / 100, 0, .48), regen: sum("regen"),
    crit: .05 + sum("crit") / 100, critDamage: 1.75 + sum("critDamage") / 100,
    lifesteal: (sum("lifesteal") + Number(active.stats.lifesteal || 0)) / 100,
    bossDamage: 1 + sum("bossDamage") / 100, lootBonus: sum("loot"), revive: Math.floor(sum("revive")),
    armorItem: gearItems.armor || gearItems.suit || gearItems.helmet,
    weaponRuntimes, activeWeaponSlot, weaponItem: active.item, weapon: active.stats, ammo: active.ammo, reloading: active.reloading, reloadTimer: active.reloadTimer,
    moduleSpecial, damageMult, fireCooldown: 0, attackAnim: 0, hitFlash: 0, angle: -Math.PI / 2, vx: 0, vy: 0, moving: false,
    weaponBroken: !active.item || Number(active.item.durability) <= 0, cosmetics: style,
    lookX: 0, lookY: -1, specialType: active.stats.special || moduleSpecial || "", specialCharge: active.specialCharge, specialReady: active.specialReady, specialPulse: 0
  };
}

function saveActiveWeaponRuntime(player) {
  const runtime = player?.weaponRuntimes?.[player.activeWeaponSlot]; if (!runtime) return;
  runtime.ammo = player.ammo; runtime.reloading = player.reloading; runtime.reloadTimer = player.reloadTimer; runtime.specialCharge = player.specialCharge; runtime.specialReady = player.specialReady;
}
function switchCombatWeapon(slot, announce = true) {
  const s = UI.session, p = s?.player; if (!p || !WEAPON_SLOT_KEYS.includes(slot)) return false;
  const runtime = p.weaponRuntimes[slot];
  if (!runtime?.item) { if (announce) toast("Slot leer", `${SLOT_META[slot].name} ist nicht belegt.`); return false; }
  if (requiredLevel(runtime.item) > ensureState().level) { if (announce) toast("Noch gesperrt", `Benötigt Fight-Level ${requiredLevel(runtime.item)}.`); return false; }
  if (itemMaxDurability(runtime.item) && runtime.item.durability <= 0) { if (announce) toast("Waffe kaputt", `${itemDef(runtime.item).name} muss repariert werden.`); return false; }
  saveActiveWeaponRuntime(p); p.activeWeaponSlot = slot; p.weaponItem = runtime.item; p.weapon = runtime.stats; p.ammo = runtime.ammo; p.reloading = runtime.reloading; p.reloadTimer = runtime.reloadTimer; p.specialType = runtime.stats.special || p.moduleSpecial || ""; p.specialCharge = runtime.specialCharge || 0; p.specialReady = !!runtime.specialReady; p.weaponBroken = false; p.fireCooldown = Math.max(p.fireCooldown,.12);
  const data = ensureState(); data.activeWeaponSlot = slot; safeSave(); updateHud(); if (announce) showCombatMessage(`${slot === "melee" ? "1" : slot === "sidearm" ? "2" : "3"} · ${itemDef(runtime.item).name}`); return true;
}
function switchToNextWeapon() {
  const p = UI.session?.player; if (!p) return false;
  const ordered = WEAPON_SLOT_KEYS.filter(slot => slot !== p.activeWeaponSlot);
  for (const slot of ordered) if (switchCombatWeapon(slot, false)) { showCombatMessage(`WECHSEL: ${itemDef(p.weaponItem).name}`); return true; }
  saveActiveWeaponRuntime(p); p.activeWeaponSlot = "fists"; p.weaponItem = null; p.weapon = { id:"fists", name:"Fäuste", attack:"melee", family:"melee", rarity:"common", damage:9, fireRate:1.2, range:62, arc:1.5 }; p.ammo=1; p.reloading=false; p.specialType=p.moduleSpecial||""; p.specialCharge=0; p.specialReady=false; showCombatMessage("ALLE WAFFEN KAPUTT · FÄUSTE"); return false;
}

function startCombat(startAtWave = null) {
  const data = ensureState(); const weaponItems = WEAPON_SLOT_KEYS.map(equipped).filter(Boolean);
  if (!weaponItems.length) return toast("Keine Waffe", "Rüste mindestens eine Nahkampfwaffe, Pistole oder Langwaffe aus.");
  const usable = weaponItems.find(item => data.level >= requiredLevel(item) && (!itemMaxDurability(item) || item.durability > 0));
  if (!usable) return toast("Keine einsatzbereite Waffe", "Alle Waffen sind gesperrt oder müssen repariert werden.");
  stopCombat(false); UI.shell?.classList.add("combat-active"); const player = buildPlayer(); player.hp = player.maxHp; player.speed = player.baseSpeed * (1 + (player.mountActive ? player.mountSpeedPct : 0) / 100);
  if (!player.weaponItem || player.weaponItem.durability <= 0) switchCombatWeapon(equipmentSlotForDef(itemDef(usable)), false);
  const special = SPECIALS[player.specialType];
  const weaponButtons = WEAPON_SLOT_KEYS.map((slot,index) => { const item = equipped(slot), def = item ? itemDef(item) : null; return `<button class="fkl-weapon-slot ${slot === player.activeWeaponSlot ? "active" : ""}" type="button" data-fkl-weapon-switch="${slot}" ${item ? "" : "disabled"}><span>${index+1}</span><i>${def?.icon || SLOT_META[slot].icon}</i><small>${escapeHtml(def?.name || "Leer")}</small></button>`; }).join("");
  UI.main.innerHTML = `<section class="fkl-combat"><div class="fkl-combat-hud"><div class="fkl-hud-left"><button class="fkl-icon-btn" type="button" data-fkl-combat-pause>Ⅱ</button><div class="fkl-health-wrap"><small>LEBEN <b data-fkl-hp-text></b></small><div class="fkl-bar fkl-health"><i data-fkl-hp-bar></i></div><div class="fkl-bar fkl-xp" style="margin-top:4px;height:6px"><i data-fkl-xp-bar></i></div></div><div class="fkl-hud-pill"><small>SHIELD</small><b data-fkl-shield>0</b></div><div class="fkl-hud-pill fkl-mount-pill" data-fkl-mount-pill><small>REITTIER</small><b data-fkl-mount>—</b></div><div class="fkl-hud-pill fkl-companion-pill" data-fkl-companion-pill><small>BEGLEITER</small><b data-fkl-companion>—</b><em data-fkl-companion-bonus></em></div></div><div class="fkl-wave" data-fkl-wave>WELLE 1</div><div class="fkl-hud-right"><div class="fkl-hud-pill"><small>KILLS</small><b data-fkl-kills>0</b></div><div class="fkl-hud-pill"><small>SCORE</small><b data-fkl-score>0</b></div><div class="fkl-hud-pill"><small>POWER</small><b>${NUMBER.format(powerScore())}</b></div></div></div><div class="fkl-stage"><canvas class="fkl-canvas" data-fkl-canvas></canvas><div class="fkl-vignette"></div><div class="fkl-combat-message" data-fkl-message></div><div class="fkl-boss-wrap" data-fkl-boss-wrap hidden><b data-fkl-boss-name>BOSS</b><div class="fkl-bar fkl-boss"><i data-fkl-boss-bar></i></div></div><div class="fkl-weapon-switch">${weaponButtons}</div><div class="fkl-ammo"><small data-fkl-weapon-name></small><b data-fkl-ammo></b><small data-fkl-durability></small></div><div class="fkl-care-actions"><button class="fkl-care-button" type="button" data-fkl-care-companion><span>4</span><i>${equipped("companioncare")?itemDef(equipped("companioncare")).icon:"🩹"}</i><small data-fkl-care-companion-text>Haustierpflege</small></button><button class="fkl-care-button" type="button" data-fkl-care-mount><span>5</span><i>${equipped("mountcare")?itemDef(equipped("mountcare")).icon:"🧰"}</i><small data-fkl-care-mount-text>Reittierpflege</small></button></div><button class="fkl-special-button ${special ? "" : "disabled"}" type="button" data-fkl-special ${special ? "" : "disabled"}><div class="fkl-special-circle" data-fkl-special-circle style="--special-color:${special?.color || '#62d9ff'};--special-progress:0deg"><span data-fkl-special-icon>${special?.icon || "✦"}</span></div><div class="fkl-special-meta"><small data-fkl-special-name>${special?.name || "Kein Special"}</small><b data-fkl-special-text>${special ? "0 %" : "—"}</b></div></button><div class="fkl-touch"><div class="fkl-stick" data-fkl-stick><div class="fkl-stick-knob" data-fkl-stick-knob></div></div><button class="fkl-auto" type="button" data-fkl-auto>AUTO AN</button><button class="fkl-fire" type="button" data-fkl-fire>FEUER</button></div></div></section>`;
  const canvas = UI.main.querySelector("[data-fkl-canvas]");
  UI.session = { canvas, ctx: canvas.getContext("2d", { alpha: false }), player, viewW: 1280, viewH: 720, screenW:1280, screenH:720, zoom:1, dpr: 1, camera: { x: player.x, y: player.y - 90 }, wave: 0, waveStarted: false, waveClearAt: 0, spawnQueue: [], spawnTimer: 0, enemies: [], projectiles: [], enemyProjectiles: [], particles: [], texts: [], pickups: [], score: 0, kills: 0, startedAt: performance.now(), paused: false, ended: false, autoFire: data.settings.autoFire !== false, joystick: { active: false, id: null, x: 0, y: 0, ox: 0, oy: 0 }, resizeObserver: null, boss: null, moneyEarned: 0, lootEarned: [], lastSave: 0, waveMessage: "", themeIndex: 0, theme: ARENA_THEMES[0], decorations: createArenaDecorations(0), frameCount: 0, fpsClock: performance.now(), fps: 60, specialInProgress: false };
  bindCombatControls(); resizeCombat(); UI.session.resizeObserver = new ResizeObserver(resizeCombat); UI.session.resizeObserver.observe(canvas.parentElement);
  const requestedStartWave = normalizeWaveCheckpoint(startAtWave == null ? data.selectedStartWave : startAtWave, data.unlockedWaveStart);
  data.selectedStartWave = requestedStartWave;
  safeSave();
  startWave(requestedStartWave); updateHud(); UI.last = performance.now(); cancelAnimationFrame(UI.raf); UI.raf = requestAnimationFrame(combatLoop);
  playSound(180, .14, "sawtooth"); setTimeout(() => playSound(330, .18, "square"), 120);
}

  function createArenaDecorations(themeIndex = UI.session?.themeIndex || 0) {
    const palette = ARENA_THEMES[themeIndex % ARENA_THEMES.length] || ARENA_THEMES[0];
    const list = [];
    const variants = themeIndex % ARENA_THEMES.length === 0 ? ["crack","crate","light"] : themeIndex % ARENA_THEMES.length === 1 ? ["crack","crate","ember"] : themeIndex % ARENA_THEMES.length === 2 ? ["toxic","crate","light"] : themeIndex % ARENA_THEMES.length === 3 ? ["ice","crate","light"] : ["void","crate","crack"];
    for (let i = 0; i < 96; i++) {
      const roll = Math.random();
      const type = roll < .42 ? variants[0] : roll < .74 ? variants[1] : variants[2];
      list.push({ x: rand(60, WORLD_W - 60), y: rand(60, WORLD_H - 60), type, size: rand(10, 38), rot: rand(0, Math.PI * 2), palette });
    }
    return list;
  }
  function cycleArenaTheme() {
    const s = UI.session; if (!s) return;
    s.themeIndex = (Number(s.themeIndex || 0) + 1) % ARENA_THEMES.length;
    s.theme = ARENA_THEMES[s.themeIndex];
    s.decorations = createArenaDecorations(s.themeIndex);
    showCombatMessage(`ARENA-WECHSEL · ${s.theme.name}`);
  }
  function resizeCombat() {
    const s = UI.session; if (!s?.canvas) return;
    const rect = s.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, matchMedia("(pointer:coarse)").matches ? 1.25 : 1.5);
    const coarse=matchMedia("(pointer:coarse)").matches;s.zoom=coarse ? .68 : .9;s.screenW=Math.max(320,rect.width);s.screenH=Math.max(260,rect.height);s.viewW=s.screenW/s.zoom;s.viewH=s.screenH/s.zoom;s.dpr=dpr;
    const w = Math.round(s.screenW * dpr), h = Math.round(s.screenH * dpr);
    if (s.canvas.width !== w || s.canvas.height !== h) { s.canvas.width = w; s.canvas.height = h; }
  }
  function bindCombatControls() {
    const s = UI.session; if (!s) return;
    UI.main.querySelector("[data-fkl-combat-pause]").addEventListener("click", pauseCombat);
    const auto = UI.main.querySelector("[data-fkl-auto]"); auto.textContent = s.autoFire ? "AUTO AN" : "AUTO AUS"; auto.classList.toggle("off", !s.autoFire);
    auto.addEventListener("click", () => { s.autoFire = !s.autoFire; ensureState().settings.autoFire = s.autoFire; safeSave(); auto.textContent = s.autoFire ? "AUTO AN" : "AUTO AUS"; auto.classList.toggle("off", !s.autoFire); });
    const specialButton = UI.main.querySelector("[data-fkl-special]"); specialButton?.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); triggerSpecial(); });
    UI.main.querySelector("[data-fkl-care-companion]")?.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();useCompanionCare();});UI.main.querySelector("[data-fkl-care-mount]")?.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();useMountCare();});
    UI.main.querySelectorAll("[data-fkl-weapon-switch]").forEach(btn => btn.addEventListener("click", () => switchCombatWeapon(btn.dataset.fklWeaponSwitch)));
    const fire = UI.main.querySelector("[data-fkl-fire]");
    ["pointerdown", "pointerenter"].forEach(type => fire.addEventListener(type, event => { if (type === "pointerenter" && !event.buttons) return; event.preventDefault(); event.stopPropagation(); UI.pointer.fire = true; fire.setPointerCapture?.(event.pointerId); }));
    ["pointerup", "pointercancel", "pointerleave", "lostpointercapture"].forEach(type => fire.addEventListener(type, event => { event?.preventDefault?.(); UI.pointer.fire = false; }));
    const canvas = s.canvas;
    canvas.addEventListener("pointermove", event => { const rect = canvas.getBoundingClientRect(); UI.pointer.aimX = (event.clientX - rect.left) / (s.zoom||1) + s.camera.x - s.viewW / 2; UI.pointer.aimY = (event.clientY - rect.top) / (s.zoom||1) + s.camera.y - s.viewH / 2; });
    canvas.addEventListener("pointerdown", event => { if (s.player.specialReady) { event.preventDefault(); triggerSpecial(); return; } if (event.pointerType === "mouse") UI.pointer.fire = true; });
    canvas.addEventListener("pointerup", event => { if (event.pointerType === "mouse") UI.pointer.fire = false; });
    const stick = UI.main.querySelector("[data-fkl-stick]"), knob = UI.main.querySelector("[data-fkl-stick-knob]");
    const updateStick = event => { event.preventDefault(); const rect = stick.getBoundingClientRect(); const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2; let dx = event.clientX - cx, dy = event.clientY - cy; const max = Math.max(24, rect.width * .32); const len = Math.hypot(dx, dy) || 1; if (len > max) { dx *= max / len; dy *= max / len; } s.joystick.x = dx / max; s.joystick.y = dy / max; knob.style.transform = `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`; };
    stick.addEventListener("pointerdown", event => { event.preventDefault(); event.stopPropagation(); s.joystick.active = true; s.joystick.id = event.pointerId; stick.setPointerCapture?.(event.pointerId); updateStick(event); });
    stick.addEventListener("pointermove", event => { if (s.joystick.active && event.pointerId === s.joystick.id) updateStick(event); });
    const stopStick = event => { if (event && s.joystick.id != null && event.pointerId !== s.joystick.id) return; event?.preventDefault?.(); s.joystick.active = false; s.joystick.id = null; s.joystick.x = s.joystick.y = 0; knob.style.transform = "translate(-50%,-50%)"; };
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(type => stick.addEventListener(type, stopStick));
  }
  function startWave(number) {
    const s = UI.session; if (!s || s.ended) return;
    number = Math.max(1, Math.floor(Number(number) || 1));
    unlockWaveCheckpoint(number);
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
      const enemy = { id: uid(), ...boss, type: "boss", boss: true, x, y, maxHp: boss.hp * scale, hp: boss.hp * scale, speed: boss.speed * (1 + s.wave * .006), damage: boss.damage * (1 + s.wave * .04), attackCooldown: 1.5, abilityCooldown: 2.5, hitFlash: 0, angle: 0, phase: 0, dead: false, statusTimer: 0, statusType: "" };
      s.enemies.push(enemy); s.boss = enemy; return;
    }
    const base = ENEMIES[spec.type] || ENEMIES.grunt; const scale = 1 + s.wave * .115 + Math.pow(s.wave, 1.25) * .012; const elite = !!spec.elite;
    s.enemies.push({ id: uid(), ...base, type: spec.type, elite, x, y, maxHp: base.hp * scale * (elite ? 2.15 : 1), hp: base.hp * scale * (elite ? 2.15 : 1), radius: base.radius * (elite ? 1.16 : 1), speed: base.speed * (1 + Math.min(.75, s.wave * .012)) * (elite ? 1.08 : 1), damage: base.damage * (1 + s.wave * .045) * (elite ? 1.55 : 1), score: base.score * (elite ? 2.5 : 1), xp: base.xp * (elite ? 2.2 : 1), attackCooldown: rand(.2, 1.1), abilityCooldown: rand(1, 3), hitFlash: 0, angle: 0, phase: rand(0, 10), dead: false, statusTimer: 0, statusType: "" });
  }
  function combatLoop(now) {
    const s = UI.session; if (!s || s.ended) return;
    const dt = Math.min(.034, Math.max(.001, (now - UI.last) / 1000)); UI.last = now;
    if (!s.paused) {
      if (s.coop?.role === "guest") updateCoopGuest(dt, now);
      else updateCombat(dt, now);
    }
    drawCombat(now);
    UI.raf = requestAnimationFrame(combatLoop);
  }
  function updateCombat(dt, now) {
    const s = UI.session, p = s?.player; if (!s || s.ended) return;
    s.frameCount++; if (now - s.fpsClock >= 1000) { s.fps = s.frameCount * 1000 / (now - s.fpsClock); s.frameCount = 0; s.fpsClock = now; }
    if (s.spawnQueue.length) {
      s.spawnTimer -= dt;
      if (s.spawnTimer <= 0) { spawnEnemy(s.spawnQueue.shift()); s.spawnTimer = s.wave <= 3 ? .55 : Math.max(.12, .42 - s.wave * .006); }
    }
    if(p.companionCare)p.companionCare.timer=Math.max(0,p.companionCare.timer-dt);
    if(p.mountCare)p.mountCare.timer=Math.max(0,p.mountCare.timer-dt);
    updatePlayer(dt);
    if (s.coop?.role === "host") updateCoopRemotePlayer(dt, now);
    updateCompanion(dt);
    if (s.coop?.role === "host" && s.coop.remote) withSessionPlayer(s.coop.remote, () => updateCompanion(dt));
    updateEnemies(dt);
    updateProjectiles(dt);
    updateParticles(dt);
    updatePickups(dt);
    if (!s.spawnQueue.length && !s.enemies.length && !s.waveClearAt) {
      s.waveClearAt = now + 2300; s.waveStarted = false; completeWave(s.wave);
      showCombatMessage(`WELLE ${s.wave} GESCHAFFT`);
    }
    if (s.waveClearAt && now >= s.waveClearAt) startWave(s.wave + 1);
    const cameraTarget = p.hp > 0 ? p : (s.coop?.remote?.hp > 0 ? s.coop.remote : p);
    const cameraSpeed = 1 - Math.pow(.001, dt);
    s.camera.x += (cameraTarget.x - s.camera.x) * cameraSpeed; s.camera.y += ((cameraTarget.y - s.viewH * .12) - s.camera.y) * cameraSpeed;
    for (const entity of combatPlayers()) {
      if (entity.spawnProtection > 0) entity.spawnProtection = Math.max(0, entity.spawnProtection - dt);
      if (entity.regen > 0 && entity.hp > 0) entity.hp = Math.min(entity.maxHp, entity.hp + entity.regen * dt);
      if (entity.hitFlash > 0) entity.hitFlash -= dt;
      if (entity.attackAnim > 0) entity.attackAnim -= dt;
    }
    if (s.coop?.role === "host") {
      if (combatPlayers(true).every(entity => entity.hp <= 0)) finishCoopHost("Beide Spieler wurden besiegt.");
      writeCoopSnapshot(now);
    }
    if (now - s.lastSave > 12000) { s.lastSave = now; safeSave(); }
    updateHud();
  }
function updatePlayer(dt) {
  const s = UI.session, p = s.player;
  if (!p || p.hp <= 0) { if (p) { p.moving=false; p.vx=0; p.vy=0; } return; }
  let mx = 0, my = 0;
  if (UI.keys.KeyW || UI.keys.ArrowUp) my -= 1; if (UI.keys.KeyS || UI.keys.ArrowDown) my += 1;
  if (UI.keys.KeyA || UI.keys.ArrowLeft) mx -= 1; if (UI.keys.KeyD || UI.keys.ArrowRight) mx += 1;
  mx += s.joystick.x; my += s.joystick.y;
  const len = Math.hypot(mx, my); if (len > 1) { mx /= len; my /= len; }
  p.speed = p.baseSpeed * (1 + (p.mountActive ? p.mountSpeedPct : 0) / 100);
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
  if (p.moving) { p.lookX = mx; p.lookY = my; }
  else { p.lookX = Math.cos(p.angle); p.lookY = Math.sin(p.angle); }
  if (!Number.isFinite(p.lookX) || !Number.isFinite(p.lookY)) { p.lookX = 0; p.lookY = -1; }
  saveActiveWeaponRuntime(p);
  const wantsAttack = s.autoFire || UI.pointer.fire || UI.keys.Space;
  if (wantsAttack && target) attack(target);
}

  function nearestEnemy(x, y, range = Infinity) {
    const s = UI.session; let best = null, bestD = range;
    for (const enemy of s.enemies) { if (enemy.dead) continue; const d = Math.hypot(enemy.x - x, enemy.y - y); if (d < bestD) { bestD = d; best = enemy; } }
    return best;
  }
function attack(target) {
  const s = UI.session, p = s.player;
  if (p.fireCooldown > 0 || p.reloading) return;
  if (p.weaponItem && p.weaponItem.durability <= 0) { p.weaponBroken = true; if (switchToNextWeapon()) return; }
  const w = p.weapon;
  if (w.attack !== "melee" && p.ammo <= 0) { beginReload(); return; }
  const rate = Math.max(.15, Number(w.fireRate) || 1); p.fireCooldown = 1 / rate; p.attackAnim = Math.min(.3, 1 / rate);
  if (w.attack === "melee") meleeAttack(); else fireWeapon();
  if (p.weaponItem && p.weaponItem.durability > 0) {
    p.weaponItem.durability = Math.max(0, p.weaponItem.durability - (w.attack === "melee" ? .52 : w.attack === "shotgun" ? .72 : .16));
    if (p.weaponItem.durability <= 0) { showCombatMessage(`${itemDef(p.weaponItem).name} KAPUTT`); switchToNextWeapon(); }
  }
  saveActiveWeaponRuntime(p);
}

function beginReload() {
  const p = UI.session.player; if (p.reloading || p.weapon.attack === "melee") return;
  p.reloading = true; const reloadBoost = effectiveStats(equipped("chip"))?.reloadPct || 0; p.reloadTimer = Math.max(.35, (p.weapon.reload || 1.5) * (1 - reloadBoost / 100));
  saveActiveWeaponRuntime(p); playSound(250, .06, "square");
}

  function fireWeapon() {
    const s = UI.session, p = s.player, w = p.weapon; p.ammo -= 1;
    const count = w.attack === "shotgun" ? Math.max(1, Math.round(w.pellets || 7)) : 1;
    for (let i = 0; i < count; i++) {
      const spread = (w.spread || 0) * rand(-1, 1); const angle = p.angle + spread; const crit = Math.random() < p.crit;
      s.projectiles.push({ x: p.x + Math.cos(angle) * 28, y: p.y + Math.sin(angle) * 28, vx: Math.cos(angle) * (w.attack === "shotgun" ? 760 : 940), vy: Math.sin(angle) * (w.attack === "shotgun" ? 760 : 940), radius: rarityIndex(w.rarity) >= 5 ? 5 : 3, damage: w.damage * p.damageMult * (crit ? p.critDamage : 1), life: (w.range || 620) / 900, color: crit ? "#ffe05a" : RARITIES[w.rarity]?.color || "#fff", crit, pierce: Math.max(0, Math.round(w.pierce || 0)), splash: Number(w.splash || 0), ownerKey:coopOwnerKey(p), hit: new Set() });
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
    const s = UI.session, p = s?.player;
    if(s?.coop?.role==="guest"){if(!p?.specialType||!p.specialReady)return;p.specialReady=false;p.specialCharge=0;s.coop.specialSeq++;showCombatMessage("SPECIAL AN HOST GESENDET");sendCoopInput(performance.now()+COOP_INPUT_INTERVAL);return;}
    if (!s || s.paused || !p?.specialType || !p.specialReady) return;
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
      s.projectiles.push({ x:p.x + Math.cos(p.angle)*34, y:p.y + Math.sin(p.angle)*34, vx:Math.cos(p.angle)*1250, vy:Math.sin(p.angle)*1250, radius:14, damage:base*3.1, life:1.25, color:spec?.color || "#ff5de5", crit:true, pierce:99, splash:60, ownerKey:coopOwnerKey(p), hit:new Set(), special:true });
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
    if (applyCoopFriendlyMeleeHit(p, w, range, arc)) hit++;
    s.particles.push({ type: "slash", x: p.x, y: p.y, angle: p.angle, radius: range, life: .24, maxLife: .24, color: RARITIES[w.rarity]?.color || "#fff" });
    if (w.dash) { p.x = clamp(p.x + Math.cos(p.angle) * w.dash, 20, WORLD_W - 20); p.y = clamp(p.y + Math.sin(p.angle) * w.dash, 20, WORLD_H - 20); }
    if (hit) chargeSpecial(Math.min(9, 1.8 + hit * 1.25));
    playSound(hit ? 105 : 180, .07, "sawtooth", .02);
  }
  function combatPlayers(includeDead=false) {
    const s=UI.session;if(!s)return[];
    const list=s.coop?[s.coop.local||s.player,s.coop.remote]:[s.player];
    return includeDead?list.filter(Boolean):list.filter(entity=>entity&&entity.hp>0);
  }
  function nearestCombatPlayer(enemy) {
    let best=null,bestDistance=Infinity;
    for(const entity of combatPlayers()){
      const d=Math.hypot(entity.x-enemy.x,entity.y-enemy.y);
      if(d<bestDistance){bestDistance=d;best=entity;}
    }
    return best?{player:best,distance:bestDistance,dx:best.x-enemy.x,dy:best.y-enemy.y}:null;
  }
  function damageCombatPlayer(target,amount,source){
    const s=UI.session;if(!s||!target||target.hp<=0)return;
    if(target===s.player){damagePlayer(amount,source);return;}
    withSessionPlayer(target,()=>damagePlayer(amount,source));
  }
  function updateEnemies(dt) {
    const s = UI.session;
    for (const enemy of [...s.enemies]) {
      if (enemy.dead) continue; enemy.phase += dt * 8; enemy.hitFlash = Math.max(0, enemy.hitFlash - dt); enemy.attackCooldown -= dt; enemy.abilityCooldown -= dt;
      if (enemy.statusTimer > 0) { enemy.statusTimer -= dt; if (enemy.statusType === "emp" || enemy.statusType === "stasis") { enemy.x += Math.sin(enemy.phase) * .15; continue; } }
      const targetInfo=nearestCombatPlayer(enemy);if(!targetInfo)continue;
      const target=targetInfo.player,dx=targetInfo.dx,dy=targetInfo.dy,d=targetInfo.distance||1;enemy.angle=Math.atan2(dy,dx);
      if (enemy.boss) updateBoss(enemy, target, dt, d, dx / d, dy / d);
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
        if (d < enemy.radius + target.radius + 5 && enemy.attackCooldown <= 0) { enemy.attackCooldown = 1 / enemy.attackRate; if (enemy.explosive) { damageCombatPlayer(target,enemy.damage * 1.35,enemy); s.particles.push({type:"blast",x:enemy.x,y:enemy.y,radius:10,maxRadius:150,life:.45,maxLife:.45,color:enemy.color}); killEnemy(enemy); } else damageCombatPlayer(target,enemy.damage,enemy); }
      }
      enemy.x = clamp(enemy.x, enemy.radius, WORLD_W - enemy.radius); enemy.y = clamp(enemy.y, enemy.radius, WORLD_H - enemy.radius);
    }
  }
  function updateBoss(enemy, target, dt, d, nx, ny) {
    enemy.x += nx * enemy.speed * dt; enemy.y += ny * enemy.speed * dt;
    if (d < enemy.radius + target.radius + 14 && enemy.attackCooldown <= 0) { enemy.attackCooldown = 1 / enemy.attackRate; damageCombatPlayer(target,enemy.damage,enemy); }
    if (enemy.abilityCooldown > 0) return;
    if (enemy.ability === "slam") { enemy.abilityCooldown = 4.2; UI.session.particles.push({ type:"ring",x:enemy.x,y:enemy.y,radius:10,maxRadius:240,life:.65,maxLife:.65,color:enemy.color }); for(const player of combatPlayers())if(distance(player,enemy)<235)damageCombatPlayer(player,enemy.damage*1.45,enemy); }
    else if (enemy.ability === "burst") { enemy.abilityCooldown = 3.8; for (let i=0;i<14;i++) fireEnemyProjectile(enemy,i/14*Math.PI*2,enemy.damage*.72); }
    else if (enemy.ability === "empburst") { enemy.abilityCooldown = 4.6; UI.session.particles.push({type:"ring",x:enemy.x,y:enemy.y,radius:12,maxRadius:420,life:.72,maxLife:.72,color:enemy.color}); for(const player of combatPlayers())if(distance(player,enemy)<410){player.specialCharge=Math.max(0,player.specialCharge-24);damageCombatPlayer(player,enemy.damage*.9,enemy);} }
    else { enemy.abilityCooldown=5.2; for(let i=0;i<4;i++)spawnEnemy({type:pick(["grunt","runner","shield","drone"]),elite:UI.session.wave>=30&&Math.random()<.25}); showCombatMessage("BOSS RUFT VERSTÄRKUNG"); }
  }
  function fireEnemyProjectile(enemy, angle, damage) {
    const s = UI.session; s.enemyProjectiles.push({ x: enemy.x + Math.cos(angle) * enemy.radius, y: enemy.y + Math.sin(angle) * enemy.radius, vx: Math.cos(angle) * 370, vy: Math.sin(angle) * 370, radius: enemy.boss ? 7 : 5, damage, life: 3, color: enemy.color });
  }
  function updateProjectiles(dt) {
    const s = UI.session;
    for (const bullet of [...s.projectiles]) {
      bullet.x += bullet.vx * dt; bullet.y += bullet.vy * dt; bullet.life -= dt;
      // Teamprojektile fliegen im KOOP durch den Mitspieler sowie durch dessen
      // Begleiter und Reittier hindurch. Treffer werden ausschließlich gegen Bots geprüft.
      if (bullet.life <= 0) continue;
      for (const enemy of [...s.enemies]) {
        if (enemy.dead || bullet.hit.has(enemy)) continue;
        if (Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y) <= enemy.radius + bullet.radius) {
          const attacker=coopProjectileOwner(bullet);bullet.hit.add(enemy);damageEnemyForPlayer(attacker,enemy,bullet.damage*(enemy.boss?Number(attacker?.bossDamage||1):1),bullet.crit,bullet.splash);
          if (bullet.pierce > 0) bullet.pierce -= 1; else bullet.life = 0;
          if (bullet.life <= 0) break;
        }
      }
    }
    s.projectiles = s.projectiles.filter(b => b.life > 0 && b.x > -30 && b.y > -30 && b.x < WORLD_W + 30 && b.y < WORLD_H + 30);
    for (const bullet of [...s.enemyProjectiles]) {
      bullet.x += bullet.vx * dt; bullet.y += bullet.vy * dt; bullet.life -= dt;
      for(const player of combatPlayers()){
        const companion=player.companion;
        if(companion&&!companion.dead&&Math.hypot(companion.x-bullet.x,companion.y-bullet.y)<=18+bullet.radius){withSessionPlayer(player,()=>damageCompanion(bullet.damage,bullet,.5));bullet.life=0;break;}
        if(player.mountActive&&Math.hypot(player.x-bullet.x,player.y-bullet.y)<=player.radius+10+bullet.radius){withSessionPlayer(player,()=>damageMount(bullet.damage,bullet,.5));bullet.life=0;break;}
        if(Math.hypot(player.x-bullet.x,player.y-bullet.y)<=player.radius+bullet.radius){damageCombatPlayer(player,bullet.damage,bullet);bullet.life=0;break;}
      }
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
    if (enemy.split && !enemy.boss && s.enemies.length < 100) for (let i = 0; i < 2; i++) { const child = { id: uid(), ...ENEMIES.runner, type: "runner", x: enemy.x + rand(-20,20), y: enemy.y + rand(-20,20), maxHp: enemy.maxHp * .28, hp: enemy.maxHp * .28, speed: enemy.speed * 1.15, damage: enemy.damage * .65, attackCooldown: .5, abilityCooldown: 0, hitFlash: 0, angle: 0, phase: rand(0,8), dead:false }; s.enemies.push(child); }
    if (Math.random() < .035 + s.player.lootBonus / 1200) s.pickups.push({ type: Math.random() < .35 ? "heal" : "credit", x: enemy.x, y: enemy.y, value: Math.random() < .35 ? 16 : 10 + s.wave * 2, life: 14, phase: 0 });
    if (enemy.boss) { showCombatMessage(`${enemy.name} BESIEGT`); grantLoot(s.wave, true); }
  }
function damagePlayerV116(amount, source) {
  const s = UI.session, p = s.player; if (p.hp <= 0) return;
  if (Math.random() < p.dodge) { addDamageText(p.x, p.y - 30, "DODGE", "#6affd8", 18); return; }
  let incoming = Math.max(1, Number(amount) || 1);
  if (p.mountActive && p.mountArmor > 0) {const mountIncoming=incoming*.5,absorbed=Math.min(p.mountArmor,mountIncoming);p.mountArmor-=absorbed;incoming=Math.max(0,mountIncoming-absorbed);addDamageText(p.x,p.y+28,`REITTIER -${Math.round(absorbed)}`,"#ffca6a",16);if(p.mountArmor<=0){p.mountArmor=0;p.mountActive=false;showCombatMessage(`${itemDef(p.mountItem).name} AUSGEFALLEN`);spawnParticles(p.x,p.y,"#ffae52",24,240);}}
  let damage = Math.max(0, incoming * (1 - (p.armorItem?.durability > 0 ? p.armor : 0)));
  if (p.shield > 0 && damage > 0) { const used = Math.min(p.shield, damage); p.shield -= used; damage -= used; }
  if (damage > 0) p.hp -= damage;
  p.hitFlash = .2; if (damage > 0) addDamageText(p.x, p.y - 34, `-${Math.round(damage)}`, "#ff6670", 22); spawnParticles(p.x, p.y, "#ff4f61", 10, 180); playSound(75, .08, "sawtooth", .025);
  if (p.armorItem?.durability > 0 && damage > 0) p.armorItem.durability = Math.max(0, p.armorItem.durability - damage * .11);
  if (p.hp <= 0) {
    if (p.revive > 0) { p.revive -= 1; p.hp = p.maxHp * .5; p.shield = p.maxShield; showCombatMessage("PHÖNIX-WIEDERBELEBUNG"); spawnParticles(p.x,p.y,"#ff9a37",45,360); }
    else if (s.coop) { p.hp=0;p.moving=false;p.vx=0;p.vy=0;showCombatMessage(`${p.coopName||"SPIELER"} IST K.O. · TEAMKAMERAD KÄMPFT WEITER`);spawnParticles(p.x,p.y,"#ff4f61",30,260); }
    else finishCombat("dead");
  }
}

  function updatePickups(dt) {
    const s=UI.session,players=combatPlayers();
    for(const item of s.pickups){
      item.life-=dt;item.phase+=dt*4;let target=null,targetDistance=Infinity;
      for(const player of players){const d=Math.hypot(player.x-item.x,player.y-item.y);if(d<targetDistance){targetDistance=d;target=player;}}
      if(target&&targetDistance<110){item.x+=(target.x-item.x)*dt*6;item.y+=(target.y-item.y)*dt*6;}
      if(target&&targetDistance<target.radius+15){item.life=0;if(item.type==="heal"){target.hp=Math.min(target.maxHp,target.hp+item.value);addDamageText(target.x,target.y-25,`+${item.value}`,"#5bffae",18);}else{s.moneyEarned+=item.value;s.score+=item.value*5;addDamageText(target.x,target.y-25,`+${item.value} €`,"#ffd55e",17);}}
    }
    s.pickups=s.pickups.filter(item=>item.life>0);
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
    if (wave % 5 === 0) { for(const player of combatPlayers(true)){if(player.hp>0)player.hp=Math.min(player.maxHp,player.hp+player.maxHp*.18);player.shield=Math.min(player.maxShield,player.shield+player.maxShield*.25);} }
    if (wave % 10 === 0) cycleArenaTheme();
    safeSave();
  }
function grantLoot(wave, boss) {
  const data = ensureState(); if (data.inventory.length >= INVENTORY_LIMIT) { UI.session.moneyEarned += boss ? 1200 : 300; return; }
  const roll = Math.random() * 100; const luck = Math.min(.45, UI.session.player.lootBonus / 1000) + (boss ? .08 : 0); let rarity = "common";
  const universeChance = data.level >= 50 && wave >= 100 ? .002 + Math.min(.008, (wave - 100) * .00008) + (boss ? .006 : 0) + luck * .004 : 0;
  const exoticChance = data.level >= 15 && wave >= 60 ? .012 + Math.min(.018, (wave - 60) * .00025) + luck * .01 : 0;
  const mythicChance = data.level >= 10 && wave >= 35 ? .20 + Math.min(.10, (wave - 35) * .0015) + luck * .04 : 0;
  const legendaryChance = wave >= 18 ? .35 + Math.min(1.1, (wave - 18) * .018) + (boss ? .9 : 0) + luck * .6 : .05;
  if (roll < universeChance) rarity = "universe";
  else if (roll < universeChance + exoticChance) rarity = "exotic";
  else if (roll < universeChance + exoticChance + mythicChance) rarity = "mythic";
  else if (roll < universeChance + exoticChance + mythicChance + legendaryChance) rarity = "legendary";
  else if (roll < 5 + Math.min(8, wave * .07) + luck * 2) rarity = "epic";
  else if (roll < 20 + Math.min(12, wave * .1) + luck * 3) rarity = "rare";
  else if (roll < 55 + Math.min(8, wave * .08) + luck * 4) rarity = "uncommon";
  let pool;
  if (["mythic","exotic","universe"].includes(rarity)) pool = ITEMS.filter(def => def.rarity === rarity && data.level >= requiredLevel({baseId:def.id,rarity,star:0}));
  else pool = ITEMS.filter(def => rarityIndex(def.rarity) <= rarityIndex("legendary") && !["special","mythic","exotic","universe"].includes(def.rarity) && data.level >= Math.max(def.minLevel || 1, RARITIES[rarity].minLevel || 1));
  if (!pool.length) pool = ITEMS.filter(item => item.rarity === "common");
  const def = pick(pool); const star = wave >= 80 && Math.random() < .05 ? 1 : 0; const item = makeItem(def.id, star, null, rarity);
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
  const set=(sel,val)=>{const n=UI.main.querySelector(sel);if(n)n.textContent=val};
  set("[data-fkl-hp-text]",`${Math.ceil(p.hp)}/${p.maxHp}`); set("[data-fkl-shield]",Math.ceil(p.shield)); set("[data-fkl-wave]",p.godMode?`WELLE ${s.wave} · GOD MODE`:`WELLE ${s.wave}`); set("[data-fkl-kills]",s.kills); set("[data-fkl-score]",NUMBER.format(Math.floor(s.score))); set("[data-fkl-weapon-name]",p.weapon.name||"Waffe");
  set("[data-fkl-ammo]",p.weapon.attack==="melee"?"NAHKAMPF":p.reloading?"NACHLADEN":`${p.ammo}/${Math.round(p.weapon.magazine||1)}`); set("[data-fkl-durability]",p.weaponItem?`Haltbarkeit ${Math.ceil(p.weaponItem.durability)}/${itemMaxDurability(p.weaponItem)}`:"Fäuste");
  const hpBar=UI.main.querySelector("[data-fkl-hp-bar]"),xpBar=UI.main.querySelector("[data-fkl-xp-bar]");if(hpBar)hpBar.style.width=`${clamp(p.hp/p.maxHp*100,0,100)}%`;if(xpBar)xpBar.style.width=`${data.level>=MAX_LEVEL?100:clamp(data.xp/need*100,0,100)}%`;
  const mountPill=UI.main.querySelector("[data-fkl-mount-pill]"); if(mountPill) mountPill.hidden=!p.mountItem; set("[data-fkl-mount]",p.mountItem?(p.mountActive?`${Math.ceil(p.mountArmor)}/${p.mountMaxArmor}`:"AUSGEFALLEN"):"—");
  const specialButton=UI.main.querySelector("[data-fkl-special]"),specialCircle=UI.main.querySelector("[data-fkl-special-circle]"); const spec=SPECIALS[p.specialType];
  if(specialCircle){specialCircle.style.setProperty("--special-progress",`${Math.round(p.specialCharge*3.6)}deg`);specialCircle.style.setProperty("--special-color",spec?.color||"#62d9ff");}
  set("[data-fkl-special-icon]",spec?.icon||"✦");set("[data-fkl-special-name]",spec?.name||"Kein Special");set("[data-fkl-special-text]",p.specialType?(p.specialReady?"BEREIT":`${Math.floor(p.specialCharge)} %`):"—");specialButton?.classList.toggle("ready",!!p.specialReady);specialButton?.classList.toggle("disabled",!p.specialType);specialButton && (specialButton.disabled=!p.specialType);
  UI.main.querySelectorAll("[data-fkl-weapon-switch]").forEach(btn=>{const slot=btn.dataset.fklWeaponSwitch;btn.classList.toggle("active",slot===p.activeWeaponSlot);const runtime=p.weaponRuntimes[slot];btn.classList.toggle("broken",!!runtime?.item&&runtime.item.durability<=0);});
  const bossWrap=UI.main.querySelector("[data-fkl-boss-wrap]");if(bossWrap){bossWrap.hidden=!s.boss;if(s.boss){set("[data-fkl-boss-name]",s.boss.name);const bar=UI.main.querySelector("[data-fkl-boss-bar]");if(bar)bar.style.width=`${clamp(s.boss.hp/s.boss.maxHp*100,0,100)}%`;}}
}

  function drawCombat(now) {
    const s = UI.session; if (!s?.ctx) return; const ctx = s.ctx, dpr = s.dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,s.screenW||s.viewW,s.screenH||s.viewH);ctx.setTransform(dpr*(s.zoom||1),0,0,dpr*(s.zoom||1),0,0);
    drawGround(ctx,s); drawDecorations(ctx,s);
    for (const pickup of s.pickups) drawPickup(ctx,s,pickup);
    for (const bullet of s.projectiles) drawBullet(ctx,s,bullet,false);
    for (const bullet of s.enemyProjectiles) drawBullet(ctx,s,bullet,true);
    for (const enemy of s.enemies) drawEnemy(ctx,s,enemy,now);
    if(s.coop?.remote)drawCoopPlayerEntity(ctx,s,s.coop.remote,now,false);
    drawCoopPlayerEntity(ctx,s,s.coop?.local||s.player,now,true);
    drawParticles(ctx,s);
    drawTexts(ctx,s);
  }
  function sx(s,x){return x-s.camera.x+s.viewW/2} function sy(s,y){return y-s.camera.y+s.viewH/2}
  function drawGround(ctx,s){
    const theme=s.theme||ARENA_THEMES[0];
    const grad=ctx.createLinearGradient(0,0,0,s.viewH);grad.addColorStop(0,theme.bgTop);grad.addColorStop(1,theme.bgBottom);ctx.fillStyle=grad;ctx.fillRect(0,0,s.viewW,s.viewH);
    const grid=72, ox=(( -s.camera.x+s.viewW/2)%grid+grid)%grid, oy=(( -s.camera.y+s.viewH/2)%grid+grid)%grid;
    ctx.strokeStyle=theme.grid;ctx.lineWidth=1;ctx.beginPath();for(let x=ox;x<s.viewW;x+=grid){ctx.moveTo(x,0);ctx.lineTo(x,s.viewH)}for(let y=oy;y<s.viewH;y+=grid){ctx.moveTo(0,y);ctx.lineTo(s.viewW,y)}ctx.stroke();
    ctx.strokeStyle=theme.gridMajor;ctx.lineWidth=2;const big=grid*5, bx=(( -s.camera.x+s.viewW/2)%big+big)%big, by=(( -s.camera.y+s.viewH/2)%big+big)%big;ctx.beginPath();for(let x=bx;x<s.viewW;x+=big){ctx.moveTo(x,0);ctx.lineTo(x,s.viewH)}for(let y=by;y<s.viewH;y+=big){ctx.moveTo(0,y);ctx.lineTo(s.viewW,y)}ctx.stroke();
    const edgeX=sx(s,0),edgeY=sy(s,0),edgeR=sx(s,WORLD_W),edgeB=sy(s,WORLD_H);ctx.strokeStyle=theme.border;ctx.lineWidth=5;ctx.strokeRect(edgeX,edgeY,edgeR-edgeX,edgeB-edgeY);
  }
  function drawDecorations(ctx,s){for(const d of s.decorations){const x=sx(s,d.x),y=sy(s,d.y),palette=d.palette||s.theme||ARENA_THEMES[0];if(x<-60||y<-60||x>s.viewW+60||y>s.viewH+60)continue;ctx.save();ctx.translate(x,y);ctx.rotate(d.rot);if(d.type==="crack"){ctx.strokeStyle=palette.crack;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-d.size,0);ctx.lineTo(-d.size*.25,-d.size*.2);ctx.lineTo(0,d.size*.1);ctx.lineTo(d.size*.55,-d.size*.3);ctx.lineTo(d.size,0);ctx.stroke()}else if(d.type==="crate"){ctx.fillStyle=palette.crateFill;ctx.strokeStyle=palette.crateStroke;ctx.lineWidth=2;ctx.fillRect(-d.size/2,-d.size/2,d.size,d.size);ctx.strokeRect(-d.size/2,-d.size/2,d.size,d.size);ctx.beginPath();ctx.moveTo(-d.size/2,-d.size/2);ctx.lineTo(d.size/2,d.size/2);ctx.moveTo(d.size/2,-d.size/2);ctx.lineTo(-d.size/2,d.size/2);ctx.stroke()}else{const g=ctx.createRadialGradient(0,0,0,0,0,d.size*2);if(d.type==="ember"){g.addColorStop(0,"#ff955544");g.addColorStop(1,"transparent");}else if(d.type==="toxic"){g.addColorStop(0,"#7dff8c4c");g.addColorStop(1,"transparent");}else if(d.type==="ice"){g.addColorStop(0,"#a7e4ff4d");g.addColorStop(1,"transparent");}else if(d.type==="void"){g.addColorStop(0,"#ed74ff44");g.addColorStop(1,"transparent");}else{g.addColorStop(0,palette.light?.[0]||"#4bf0bf44");g.addColorStop(1,palette.light?.[1]||"transparent");}ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,d.size*2,0,Math.PI*2);ctx.fill()}ctx.restore()}}
  function drawPlayer(ctx,s,now) {
    const p=s.player,x=sx(s,p.x),y=sy(s,p.y),walk=p.moving?Math.sin(now*.014)*5:0,bob=p.moving?Math.abs(Math.sin(now*.014))*2:0;
    const style=p.cosmetics||CHARACTER_STYLES[0];
    const lookX = Number.isFinite(p.lookX) ? p.lookX : Math.cos(p.angle);
    const lookY = Number.isFinite(p.lookY) ? p.lookY : Math.sin(p.angle);
    const facing = Math.abs(lookY) >= Math.abs(lookX) * .82 ? (lookY > 0 ? "front" : "back") : "side";
    const sideDir = lookX >= 0 ? 1 : -1;
    const aimX=Math.cos(p.angle), aimY=Math.sin(p.angle);
    ctx.save(); ctx.translate(x,y);
    if(p.mountActive && p.mountItem){
      const m=itemDef(p.mountItem), motor=/bike/i.test(m.id); ctx.save(); ctx.translate(0,12);
      ctx.globalAlpha=.42;ctx.fillStyle="#000";ctx.beginPath();ctx.ellipse(0,26,38,12,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
      ctx.save();ctx.rotate(p.angle+Math.PI/2);if(motor){ctx.strokeStyle=rarityDef(p.mountItem).color;ctx.lineWidth=7;ctx.beginPath();ctx.arc(0,-22,12,0,Math.PI*2);ctx.arc(0,24,12,0,Math.PI*2);ctx.stroke();ctx.fillStyle="#25343a";ctx.beginPath();ctx.roundRect(-12,-24,24,50,8);ctx.fill();ctx.fillStyle=rarityDef(p.mountItem).color;ctx.fillRect(-8,-13,16,23);}else{const stride=p.moving?Math.sin(now*.014)*3:0;ctx.fillStyle="#6d4934";ctx.strokeStyle=rarityDef(p.mountItem).color;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,4,18,35,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(0,-34,13,12,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-9,-39);ctx.lineTo(-13,-53);ctx.lineTo(-3,-43);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(9,-39);ctx.lineTo(13,-53);ctx.lineTo(3,-43);ctx.closePath();ctx.fill();ctx.strokeStyle="#513524";ctx.lineWidth=7;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(-15,-8);ctx.lineTo(-27,-15+stride);ctx.moveTo(15,-8);ctx.lineTo(27,-15-stride);ctx.moveTo(-15,20);ctx.lineTo(-26,31-stride);ctx.moveTo(15,20);ctx.lineTo(26,31+stride);ctx.stroke();ctx.strokeStyle=rarityDef(p.mountItem).color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,38);ctx.quadraticCurveTo(12,49,19,39);ctx.stroke();}ctx.restore();
      ctx.restore();ctx.translate(0,-18);
    }
    ctx.globalAlpha=.38;ctx.fillStyle="#000";ctx.beginPath();ctx.ellipse(0,30,24,10,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;

    if (facing === "front") {
      ctx.strokeStyle="#243038";ctx.lineWidth=10;ctx.lineCap="round";ctx.beginPath();
      ctx.moveTo(-8,12);ctx.lineTo(-11+walk,34);ctx.moveTo(8,12);ctx.lineTo(11-walk,34);ctx.stroke();
      ctx.strokeStyle=style.accent;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-12+walk,36);ctx.lineTo(-18+walk,40);ctx.moveTo(12-walk,36);ctx.lineTo(18-walk,40);ctx.stroke();
      ctx.fillStyle=p.hitFlash>0?"#fff":style.body;ctx.strokeStyle=style.trim;ctx.lineWidth=3;ctx.beginPath();
      ctx.moveTo(-18,-13-bob);ctx.quadraticCurveTo(-24,2,-15,18);ctx.lineTo(15,18);ctx.quadraticCurveTo(24,2,18,-13-bob);ctx.quadraticCurveTo(0,-22-bob,-18,-13-bob);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.strokeStyle=style.accent;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-16-bob);ctx.lineTo(0,16);ctx.stroke();
      ctx.strokeStyle="#c98e72";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-16,-7-bob);ctx.lineTo(-24,2+walk*.25);ctx.moveTo(16,-7-bob);ctx.lineTo(24,2-walk*.25);ctx.stroke();
      ctx.fillStyle="#c98e72";ctx.beginPath();ctx.ellipse(0,-26-bob,11,13,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#2d201d";ctx.beginPath();ctx.arc(0,-31-bob,11.5,Math.PI,Math.PI*2);ctx.lineTo(9,-23-bob);ctx.quadraticCurveTo(0,-18-bob,-9,-23-bob);ctx.fill();
      ctx.fillStyle="#15181b";ctx.beginPath();ctx.arc(-4,-27-bob,1.35,0,Math.PI*2);ctx.arc(4,-27-bob,1.35,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="#9d5e58";ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(0,-22-bob,3.6,.2,Math.PI-.2);ctx.stroke();
    } else if (facing === "back") {
      ctx.strokeStyle="#20262b";ctx.lineWidth=10;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(-7,12);ctx.lineTo(-9+walk,34);ctx.moveTo(7,12);ctx.lineTo(9-walk,34);ctx.stroke();
      ctx.strokeStyle=style.accent;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-10+walk,35);ctx.lineTo(-16+walk,39);ctx.moveTo(10-walk,35);ctx.lineTo(16-walk,39);ctx.stroke();
      ctx.fillStyle=p.hitFlash>0?"#fff":style.body;ctx.strokeStyle=style.trim;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-17,-14-bob);ctx.quadraticCurveTo(-22,-2,-15,18);ctx.lineTo(15,18);ctx.quadraticCurveTo(22,-2,17,-14-bob);ctx.quadraticCurveTo(0,-23-bob,-17,-14-bob);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.strokeStyle=style.accent;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-18-bob);ctx.lineTo(0,15);ctx.stroke();
      ctx.fillStyle="#c98e72";ctx.beginPath();ctx.ellipse(0,-26-bob,11,13,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#241b19";ctx.beginPath();ctx.arc(0,-29-bob,11,Math.PI,Math.PI*2);ctx.lineTo(10,-25-bob);ctx.quadraticCurveTo(0,-35-bob,-10,-25-bob);ctx.fill();
      ctx.strokeStyle="#c98e72";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-15,-8-bob);ctx.lineTo(-22,-1+walk*.35);ctx.moveTo(15,-8-bob);ctx.lineTo(22,-1-walk*.35);ctx.stroke();
    } else {
      ctx.scale(sideDir,1);
      ctx.strokeStyle="#243038";ctx.lineWidth=10;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(-2,12);ctx.lineTo(-4+walk*.2,35);ctx.moveTo(8,12);ctx.lineTo(13-walk*.45,33);ctx.stroke();
      ctx.strokeStyle=style.accent;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-5,36);ctx.lineTo(-10,39);ctx.moveTo(13-walk*.45,34);ctx.lineTo(19-walk*.45,38);ctx.stroke();
      ctx.fillStyle=p.hitFlash>0?"#fff":style.body;ctx.strokeStyle=style.trim;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-14,-16-bob);ctx.quadraticCurveTo(-19,-4,-13,18);ctx.lineTo(9,18);ctx.quadraticCurveTo(19,2,14,-14-bob);ctx.quadraticCurveTo(6,-22-bob,-14,-16-bob);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.strokeStyle=style.accent;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(2,-17-bob);ctx.lineTo(2,16);ctx.stroke();
      ctx.strokeStyle="#c98e72";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-10,-7-bob);ctx.lineTo(-18,4);ctx.moveTo(13,-9-bob);ctx.lineTo(22,-2);ctx.stroke();
      ctx.fillStyle="#c98e72";ctx.beginPath();ctx.ellipse(1,-26-bob,10.5,13,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#241b19";ctx.beginPath();ctx.arc(0,-29-bob,10.5,Math.PI*.78,Math.PI*1.98);ctx.lineTo(8,-21-bob);ctx.quadraticCurveTo(2,-33-bob,-7,-25-bob);ctx.fill();
      ctx.fillStyle="#15181b";ctx.beginPath();ctx.arc(5,-27-bob,1.2,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="#9d5e58";ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(8,-23-bob);ctx.lineTo(11,-22-bob);ctx.stroke();
    }

    const w=p.weapon, wx=(facing === "side" ? sideDir*14 : (aimX>=0?12:-12)), wy=-8-bob;ctx.save();ctx.translate(wx,wy);ctx.rotate(p.angle+Math.PI/2);ctx.strokeStyle=RARITIES[w.rarity]?.color||"#ddd";ctx.lineWidth=w.attack==="melee"?7:5;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(0,5);ctx.lineTo(0,-(w.attack==="melee"?42:30));ctx.stroke();if(p.attackAnim>0){ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=18;ctx.fillStyle=ctx.strokeStyle;ctx.beginPath();ctx.arc(0,-32,5,0,Math.PI*2);ctx.fill();}ctx.restore();
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
  function stopCombat(saveState=true){UI.shell?.classList.remove("combat-active");const s=UI.session;if(!s)return;if(s.coop)stopCoopNetwork(true);cancelAnimationFrame(UI.raf);UI.raf=0;s.resizeObserver?.disconnect();UI.session=null;UI.pointer.fire=false;if(saveState)safeSave()}
  function onKeyDown(event) {
    if(!UI.overlay)return; UI.keys[event.code]=true;
    if(event.code==="Escape"){event.preventDefault();if(UI.session)pauseCombat();else returnToTopGames();}
    if(event.code==="KeyR"&&UI.session){event.preventDefault();beginReload();}
    if((event.code==="KeyE"||event.code==="KeyQ")&&UI.session){event.preventDefault();triggerSpecial();}
    if(UI.session && ["Digit1","Numpad1","Digit2","Numpad2","Digit3","Numpad3"].includes(event.code)){event.preventDefault();const n=event.code.includes("1")?0:event.code.includes("2")?1:2;switchCombatWeapon(WEAPON_SLOT_KEYS[n]);}
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(event.code))event.preventDefault();
  }
  function onKeyUp(event){UI.keys[event.code]=false}
  function playSound(frequency,duration=.06,type="sine",gain=.025){const data=ensureState();if(!data?.settings?.sound)return;try{UI.audio||=(new(window.AudioContext||window.webkitAudioContext)());if(UI.audio.state==="suspended")UI.audio.resume();const o=UI.audio.createOscillator(),g=UI.audio.createGain();o.type=type;o.frequency.value=frequency;g.gain.setValueAtTime(gain,UI.audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,UI.audio.currentTime+duration);o.connect(g).connect(UI.audio.destination);o.start();o.stop(UI.audio.currentTime+duration)}catch{}}



  /* V117: Begleiter, verbessertes Inventar und Online-1v1 */
  function ensureState() {
    const data = ensureStateV116();
    if (!data) return null;
    data.version = VERSION;
    if (!Array.isArray(data.inventory)) data.inventory = [];
    // Inventar darf absichtlich leer beziehungsweise bis auf ein Item verkauft sein.
    // Es werden nachträglich keine Starter-Items oder Begleiter automatisch ergänzt.
    data.starterCompanionGrantedV125 = true;
    data.equipped ||= {};
    const companion = data.inventory.find(item => item.uid === data.equipped.companion && itemDef(item).category === "companion") || data.inventory.find(item => itemDef(item).category === "companion");
    data.equipped.companion = companion?.uid || "";
    data.duel ||= { wins: 0, losses: 0, draws: 0, lastMatchId: "", status: "Bereit" };
    data.duel.wins = Math.max(0, Math.floor(Number(data.duel.wins) || 0));
    data.duel.losses = Math.max(0, Math.floor(Number(data.duel.losses) || 0));
    data.duel.draws = Math.max(0, Math.floor(Number(data.duel.draws) || 0));
    data.staffTools ||= {};
    data.staffTools.godMode = !!data.staffTools.godMode;
    data.staffTools.damageMultiplier = clamp(Number(data.staffTools.damageMultiplier) || 1, 1, 100);
    data.staffTools.speedMultiplier = clamp(Number(data.staffTools.speedMultiplier) || 1, 1, 10);
    data.staffTools.defenseMultiplier = clamp(Number(data.staffTools.defenseMultiplier) || 1, 1, 100);
    data.staffTools.selectedItemId = ITEM_MAP.has(data.staffTools.selectedItemId) ? data.staffTools.selectedItemId : "service-pistol";
    data.staffTools.grantRarity = RARITIES[data.staffTools.grantRarity] ? data.staffTools.grantRarity : "common";
    data.staffTools.grantStar = clamp(Math.floor(Number(data.staffTools.grantStar) || 0), 0, MAX_STAR);
    data.staffTools.grantQuantity = clamp(Math.floor(Number(data.staffTools.grantQuantity) || 1), 1, 10);
    const migratedCheckpoint = Math.max(1, Math.floor(Math.max(0, Number(data.bestWave) || 0) / 10) * 10);
    data.unlockedWaveStart = normalizeWaveCheckpoint(Math.max(Number(data.unlockedWaveStart) || 1, migratedCheckpoint), MAX_WAVE_CHECKPOINT);
    data.selectedStartWave = normalizeWaveCheckpoint(data.selectedStartWave || 1, data.unlockedWaveStart);
    const selectedUid = String(data.staffTools.selectedInventoryUid || "");
    if (!data.inventory.some(item => item.uid === selectedUid)) {
      const automatic = ["primary","sidearm","melee","armor","companion","mount"].map(slot => data.inventory.find(item => item.uid === data.equipped[slot])).find(Boolean) || data.inventory[0] || null;
      data.staffTools.selectedInventoryUid = automatic?.uid || "";
    }
    return data;
  }

  function inventoryGroup(def) {
    if (!def) return "other";
    if (def.category === "weapon") return "weapon";
    if (["helmet","armor","suit","boots"].includes(def.category)) return "armor";
    return def.category || "other";
  }
  function inventoryFilteredItems() {
    const data = ensureState();
    const search = String(UI.inventorySearch || "").trim().toLowerCase();
    let list = data.inventory.filter(item => {
      const def = itemDef(item);
      const categoryOk = UI.inventoryCategory === "all" || inventoryGroup(def) === UI.inventoryCategory || def.category === UI.inventoryCategory;
      const textOk = !search || `${def.name} ${def.text} ${rarityDef(item).name}`.toLowerCase().includes(search);
      return categoryOk && textOk;
    });
    list.sort((a,b) => {
      if (UI.inventorySort === "name") return itemDef(a).name.localeCompare(itemDef(b).name, "de");
      if (UI.inventorySort === "new") return Number(b.acquiredAt||0)-Number(a.acquiredAt||0);
      if (UI.inventorySort === "power") return powerValueOfItem(b)-powerValueOfItem(a);
      return rarityIndex(b)-rarityIndex(a) || Number(b.star||0)-Number(a.star||0) || itemDef(a).name.localeCompare(itemDef(b).name,"de");
    });
    return list;
  }
  function powerValueOfItem(item) {
    const s=effectiveStats(item); return Math.round((s.damage||0)*4+(s.health||0)*1.4+(s.armor||0)*10+(s.speed||0)*8+(s.companionDamage||0)*4+(s.companionHealth||0)*.7+(s.dodge||0)*16+(s.companionCareHealthPct||0)*9+(s.mountCareHealthPct||0)*9+(s.companionCareHealPct||0)*6+(s.mountCareHealPct||0)*6+s.mult*100);
  }

  function aggregateLoadoutStats() {
    const data = ensureState();
    const items = EQUIPMENT_SLOT_KEYS.map(slot => equipped(slot)).filter(Boolean).map(effectiveStats);
    const sum = key => items.reduce((total, item) => total + Number(item[key] || 0), 0);
    const weapons = WEAPON_SLOT_KEYS.map(slot => equipped(slot)).filter(Boolean).map(effectiveStats);
    const strongest = weapons.reduce((best,item)=>Math.max(best,Number(item.damage||0)),0);
    const companion = equipped("companion");
    const cs = companion ? effectiveStats(companion) : {};
    const ownerBonus = companionOwnerBonuses(companion);
    return {
      health: Math.round(130 + data.level*3 + sum("health")),
      armor: Math.round(Math.min(72,sum("armor"))),
      speed: Math.round(sum("speed")-items.reduce((total,item)=>total+Number(item.speedPenalty||0)*100,0)),
      damage: Math.round(strongest), damagePct: Math.round(sum("damagePct")), shield: Math.round(sum("shield")),
      crit: Math.round(5+sum("crit")), dodge: Math.round(Math.min(58,sum("dodge"))), loot: Math.round(sum("loot")), mountArmor: Math.round(sum("mountArmor")),
      companionDamage: Math.round(Number(cs.companionDamage||0)*(1+sum("companionDamagePct")/100)),
      companionHealth: Math.round(Number(cs.companionHealth||0)*(1+sum("companionHealthPct")/100)),
      companionRate: Number(cs.companionRate||0)*(1+sum("companionRatePct")/100),
      companionOwnerDamage: ownerBonus.damage, companionOwnerDefense: ownerBonus.defense,
      companionCareHealthPct: Math.round(sum("companionCareHealthPct")), companionCareHealPct: Math.round(sum("companionCareHealPct")),
      mountCareHealthPct: Math.round(sum("mountCareHealthPct")), mountCareHealPct: Math.round(sum("mountCareHealPct")),
      dodgeHeal: Math.round(sum("dodgeHeal")), power: powerScore()
    };
  }

  function powerScore() {
    const data=ensureState(); if(!data)return 0;
    return EQUIPMENT_SLOT_KEYS.reduce((sum,slot)=>{const item=equipped(slot);if(!item)return sum;const s=effectiveStats(item);return sum+powerValueOfItem(item)+Math.round((s.companionRate||0)*90);},data.level*50);
  }

  function characterPreviewHtml(style, compact = false) {
    return `<div class="fkl-character-model ${compact ? "compact" : ""}"><span class="shadow"></span><span class="head"></span><span class="hair"></span><span class="eye e1"></span><span class="eye e2"></span><span class="nose"></span><span class="mouth"></span><span class="neck"></span><span class="body"></span><span class="chest"></span><span class="arm a1"></span><span class="arm a2"></span><span class="hand h1"></span><span class="hand h2"></span><span class="leg l1"></span><span class="leg l2"></span><span class="shoe s1"></span><span class="shoe s2"></span></div>`;
  }

  function loadoutPanelHtml() {
    const data=ensureState(),stats=aggregateLoadoutStats(),style=STYLE_MAP.get(data.cosmetics.active)||CHARACTER_STYLES[0],companion=equipped("companion"),bonus=companionOwnerBonuses(companion);
    const companionBadge=companion?`<div class="fkl-loadout-companion-icon rarity-${rarityKey(companion)}" style="${itemStyle(companion)}" title="${escapeHtml(itemDef(companion).name)}"><span>${itemDef(companion).icon}</span><small>+${bonus.damage}% DMG · +${bonus.defense}% DEF</small></div>`:"";
    return `<section class="fkl-panel fkl-loadout-panel v124"><div class="fkl-loadout-title"><div><small class="fkl-kicker">CHARAKTER · AUSRÜSTUNG · PFLEGE</small><h3>${escapeHtml(playerName())}</h3><p>Ziehe Items auf die Slots. Begleiter und Reittiere können getroffen werden. Pflege-Sets erhöhen ihr Leben und heilen sie im Kampf mit den Tasten 4 und 5.</p></div><div class="fkl-loadout-power">GESAMT-POWER <b>${NUMBER.format(stats.power)}</b></div></div><div class="fkl-loadout-grid"><div class="fkl-loadout-side left">${["helmet","armor","suit","boots","mount","mountcare","companion","companioncare"].map(loadoutSlotHtml).join("")}</div><div class="fkl-character-card" style="--body:${style.body};--accent:${style.accent};--trim:${style.trim}"><div class="fkl-character-aura"></div>${characterPreviewHtml(style)}${companionBadge}<strong>${escapeHtml(playerName())}</strong><small>${escapeHtml(style.name)} · Fight-Level ${data.level}</small></div><div class="fkl-loadout-side right">${["melee","sidearm","primary","chip","charm"].map(loadoutSlotHtml).join("")}</div></div><div class="fkl-loadout-stats"><div><small>Stärke</small><b>${NUMBER.format(stats.damage)}</b></div><div><small>Schadensbonus</small><b>+${stats.damagePct}%</b></div><div><small>Tempo</small><b>+${stats.speed}%</b></div><div><small>Leben</small><b>${NUMBER.format(stats.health)}</b></div><div><small>Rüstung</small><b>${stats.armor}%</b></div><div><small>Schild</small><b>${NUMBER.format(stats.shield)}</b></div><div><small>Krit</small><b>${stats.crit}%</b></div><div><small>Ausweichen</small><b>${stats.dodge}%</b></div><div><small>Beute</small><b>+${stats.loot}%</b></div><div><small>Reittier</small><b>${NUMBER.format(stats.mountArmor)}</b></div><div><small>Begleiter-Schaden</small><b>${NUMBER.format(stats.companionDamage)}</b></div><div><small>Begleiter-Leben</small><b>${NUMBER.format(stats.companionHealth)}</b></div><div class="fkl-comp-bonus"><small>Dein Schaden durch Begleiter</small><b>+${stats.companionOwnerDamage}%</b></div><div class="fkl-comp-bonus"><small>Deine Verteidigung durch Begleiter</small><b>+${stats.companionOwnerDefense}%</b></div><div class="fkl-care-stat"><small>Haustierpflege</small><b>+${stats.companionCareHealthPct}% Leben · ${stats.companionCareHealPct}% Heilung</b></div><div class="fkl-care-stat"><small>Reittierpflege</small><b>+${stats.mountCareHealthPct}% Panzerung · ${stats.mountCareHealPct}% Heilung</b></div></div></section>`;
  }

  function drawInventory() {
    const data=ensureState(); if(!UI.main)return;
    const detail=data.inventory.find(item=>item.uid===UI.detailUid)||null;
    const categories=[["all","Alle"],["weapon","Waffen"],["armor","Rüstung"],["companion","Begleiter"],["companioncare","Haustierpflege"],["mount","Reittiere"],["mountcare","Reittierpflege"],["chip","Module"],["charm","Talismane"]];
    const list=inventoryFilteredItems();
    const filter=`<section class="fkl-panel fkl-inventory-toolbar"><div class="fkl-inventory-tabs">${categories.map(([id,label])=>`<button class="${UI.inventoryCategory===id?"active":""}" type="button" data-fkl-inv-cat="${id}">${label}</button>`).join("")}</div><label class="fkl-search"><span>⌕</span><input type="search" value="${escapeHtml(UI.inventorySearch)}" placeholder="Item, Seltenheit oder Effekt suchen" data-fkl-inv-search></label><select data-fkl-inv-sort><option value="rarity" ${UI.inventorySort==="rarity"?"selected":""}>Seltenheit</option><option value="power" ${UI.inventorySort==="power"?"selected":""}>Power</option><option value="new" ${UI.inventorySort==="new"?"selected":""}>Neu erhalten</option><option value="name" ${UI.inventorySort==="name"?"selected":""}>Name</option></select><div class="fkl-inv-count"><b>${list.length}</b><small>angezeigt</small></div></section>`;
    UI.main.innerHTML=`<div class="fkl-page fkl-inventory-page">${pageHeader("Inventar & Charakter",`${data.inventory.length}/${INVENTORY_LIMIT} Plätze · Zwei identische Items ergeben den nächsten Stern. Alle Items außer dem letzten verbleibenden können für 30 % ihres Werts verkauft werden.`,`${fightAdminButtonHtml()}<button class="fkl-btn gold" type="button" data-fkl-merge ${UI.selected.size===2?"":"disabled"}>✨ ${UI.selected.size}/2 matchen</button>`)}${loadoutPanelHtml()}${filter}<div class="fkl-inventory-layout"><section class="fkl-inventory">${list.map(itemCard).join("")||`<div class="fkl-empty-inventory">Keine passenden Items gefunden.</div>`}</section>${detailHtml(detail)}</div></div>`;
    bindPageHome();
    UI.main.querySelectorAll("[data-fkl-inv-cat]").forEach(btn=>btn.addEventListener("click",()=>{UI.inventoryCategory=btn.dataset.fklInvCat;drawInventory();}));
    UI.main.querySelector("[data-fkl-inv-sort]")?.addEventListener("change",e=>{UI.inventorySort=e.currentTarget.value;drawInventory();});
    UI.main.querySelector("[data-fkl-inv-search]")?.addEventListener("input",e=>{UI.inventorySearch=e.currentTarget.value;window.clearTimeout(UI.inventorySearchTimer);UI.inventorySearchTimer=window.setTimeout(drawInventory,180);});
    UI.main.querySelectorAll("[data-fkl-item]").forEach(card=>{
      card.addEventListener("dragstart",event=>{event.dataTransfer?.setData("text/fight-kl-item",card.dataset.fklItem);if(event.dataTransfer)event.dataTransfer.effectAllowed="move";card.classList.add("dragging")});
      card.addEventListener("dragend",()=>card.classList.remove("dragging"));
      card.addEventListener("click",event=>{if(event.target.closest("[data-fkl-item-info]"))return;const id=card.dataset.fklItem,item=data.inventory.find(x=>x.uid===id);if(!item)return;UI.detailUid=id;if(event.ctrlKey||event.shiftKey||event.pointerType==="touch")toggleMergeSelection(item);else if(UI.selected.size&&!UI.selected.has(id))toggleMergeSelection(item);else UI.selected.has(id)?UI.selected.delete(id):UI.selected.add(id);drawInventory();});
    });
    UI.main.querySelectorAll("[data-fkl-item-info]").forEach(btn=>btn.addEventListener("click",event=>{event.stopPropagation();UI.detailUid=btn.dataset.fklItemInfo;drawInventory();}));
    UI.main.querySelectorAll("[data-fkl-equip-slot]").forEach(slotNode=>{slotNode.addEventListener("dragover",event=>{event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect="move";slotNode.classList.add("drag-over")});slotNode.addEventListener("dragleave",()=>slotNode.classList.remove("drag-over"));slotNode.addEventListener("drop",event=>{event.preventDefault();slotNode.classList.remove("drag-over");const id=event.dataTransfer?.getData("text/fight-kl-item");if(id)equipItemToSlot(id,slotNode.dataset.fklEquipSlot)});});
    UI.main.querySelectorAll("[data-fkl-slot-info]").forEach(btn=>btn.addEventListener("click",event=>{event.stopPropagation();const item=equipped(btn.dataset.fklSlotInfo);if(item){UI.detailUid=item.uid;drawInventory()}else toast(SLOT_META[btn.dataset.fklSlotInfo]?.name||"Slot",SLOT_META[btn.dataset.fklSlotInfo]?.hint||"Dieser Slot ist leer.")}));
    UI.main.querySelector("[data-fkl-admin-open]")?.addEventListener("click",openFightAdminMenu);
    UI.main.querySelectorAll("[data-fkl-admin-star]").forEach(btn=>btn.addEventListener("click",event=>setStaffItemStar(event.currentTarget.dataset.fklAdminStar,event.currentTarget.dataset.star)));
    UI.main.querySelectorAll("[data-fkl-admin-star-step]").forEach(btn=>btn.addEventListener("click",event=>shiftStaffItemStar(event.currentTarget.dataset.fklAdminStarStep,event.currentTarget.dataset.step)));
    UI.main.querySelectorAll("[data-fkl-admin-durability]").forEach(btn=>btn.addEventListener("click",event=>fillStaffItemDurability(event.currentTarget.dataset.fklAdminDurability)));
    UI.main.querySelectorAll("[data-fkl-admin-duplicate]").forEach(btn=>btn.addEventListener("click",event=>duplicateStaffItem(event.currentTarget.dataset.fklAdminDuplicate)));
    UI.main.querySelector("[data-fkl-merge]")?.addEventListener("click",requestMergeConfirmation);UI.main.querySelector("[data-fkl-equip]")?.addEventListener("click",event=>equipItem(event.currentTarget.dataset.fklEquip));UI.main.querySelector("[data-fkl-repair]")?.addEventListener("click",event=>repairItem(event.currentTarget.dataset.fklRepair));UI.main.querySelector("[data-fkl-promote]")?.addEventListener("click",event=>promoteItem(event.currentTarget.dataset.fklPromote));UI.main.querySelector("[data-fkl-sell]")?.addEventListener("click",event=>requestSellFightItem(event.currentTarget.dataset.fklSell));
  }

  function renderDashboard() {
    if(!UI.main)return;
    stopCoopWaiting(true); stopCombat(false); stopDuel(false);
    const data=ensureState(),need=data.level>=MAX_LEVEL?1:levelNeed(data.level),pct=data.level>=MAX_LEVEL?100:clamp(data.xp/need*100,0,100),weapon=equipped(data.activeWeaponSlot)||equipped("primary")||equipped("sidearm")||equipped("melee"),comp=equipped("companion");
    const startOptions=waveCheckpointOptions(data.selectedStartWave,data.unlockedWaveStart);
    UI.main.innerHTML=`<div class="fkl-dashboard"><section class="fkl-panel fkl-hero"><div class="fkl-hero-copy"><small class="fkl-kicker">ENDLOSE ARENA · WELLEN-KOOP · BOSS-CHECKPOINTS</small><h1>FIGHT<span>.KL</span></h1><p>Erreichte Zehner-Wellen bleiben als Startpunkte freigeschaltet. Du kannst weiterhin bei Welle 1 beginnen oder direkt an einem erreichten Boss-Abschnitt einsteigen.</p><div class="fkl-wave-start-card"><label><span>Startwelle</span><select data-fkl-start-wave>${startOptions}</select></label><small>Freigeschaltet bis Welle ${data.unlockedWaveStart}. Neue Punkte erhältst du bei 10, 20, 30, 40 und immer weiter.</small></div><div class="fkl-hero-actions"><button class="fkl-btn primary" type="button" data-fkl-start>⚔ Bot-Arena starten</button><button class="fkl-btn gold" type="button" data-fkl-coop>🤝 Wellen-KOOP</button><button class="fkl-btn ${data.level>=5?"gold":""}" type="button" data-fkl-duel>${data.level>=5?"🌐 Online 1 gegen 1":"🔒 Online-Duell ab Level 5"}</button><button class="fkl-btn" type="button" data-fkl-inventory>🎒 Inventar & Ausrüstung</button><button class="fkl-btn" type="button" data-fkl-shop>🛒 Arsenal-Shop</button>${fightAdminButtonHtml()}</div></div><div class="fkl-hero-figure"></div></section><aside class="fkl-panel fkl-level-card"><div class="fkl-level-row"><div><small class="fkl-kicker">DEIN FIGHT-PROFIL</small><h3>${escapeHtml(playerName())}</h3></div><strong>LV ${data.level}</strong></div><div class="fkl-progress"><i style="width:${pct}%"></i></div><small>${data.level>=MAX_LEVEL?"Maximallevel erreicht":`${NUMBER.format(data.xp)} / ${NUMBER.format(need)} XP bis Level ${data.level+1}`}</small><div class="fkl-stat-grid" style="margin-top:15px"><div class="fkl-stat-card"><small>Aktive Waffe</small><b>${escapeHtml(itemDef(weapon).name)}</b></div><div class="fkl-stat-card"><small>Begleiter</small><b>${escapeHtml(comp?itemDef(comp).name:"Keiner")}</b></div><div class="fkl-stat-card"><small>Bestleistung</small><b>Welle ${data.bestWave}</b></div><div class="fkl-stat-card"><small>Startpunkte</small><b>bis ${data.unlockedWaveStart}</b></div></div></aside><div class="fkl-dashboard-lower v117"><article class="fkl-panel fkl-feature" data-fkl-inventory><i>🎒</i><b>Inventar & Loadout</b><small>Charakteransicht, Ausrüstung, Pflege-Sets, Filter und Zwei-Item-Merge.</small></article><article class="fkl-panel fkl-feature" data-fkl-shop><i>🛒</i><b>Arsenal-Shop</b><small>74 neue Items, 50 % Arsenal-Stärke und Universe-Ausrüstung ab Fight-Level 50.</small></article><article class="fkl-panel fkl-feature" data-fkl-coop><i>🤝</i><b>Wellen-KOOP</b><small>Zwei Spieler kämpfen gemeinsam ab einer Startwelle, die beide freigeschaltet haben.</small></article><article class="fkl-panel fkl-feature" data-fkl-duel><i>🌐</i><b>Online 1 gegen 1</b><small>${data.level>=5?"Firebase-Matchmaking mit Bewegung, Angriff, Ausweichen und Special.":"Wird mit Fight-Level 5 freigeschaltet."}</small></article><article class="fkl-panel fkl-feature" data-fkl-leader><i>🏆</i><b>Online-Scores</b><small>Rangliste nach Wellen, Score und Power.</small></article></div></div>`;
    const startSelect=UI.main.querySelector("[data-fkl-start-wave]");
    startSelect?.addEventListener("change",()=>{data.selectedStartWave=normalizeWaveCheckpoint(startSelect.value,data.unlockedWaveStart);safeSave();});
    UI.main.querySelector("[data-fkl-start]").addEventListener("click",()=>{const wave=normalizeWaveCheckpoint(startSelect?.value||data.selectedStartWave,data.unlockedWaveStart);data.selectedStartWave=wave;safeSave();startCombat(wave);});
    UI.main.querySelectorAll("[data-fkl-inventory]").forEach(btn=>btn.addEventListener("click",renderInventory));
    UI.main.querySelectorAll("[data-fkl-shop]").forEach(btn=>btn.addEventListener("click",renderShop));
    UI.main.querySelectorAll("[data-fkl-coop]").forEach(btn=>btn.addEventListener("click",renderCoopLobby));
    UI.main.querySelectorAll("[data-fkl-duel]").forEach(btn=>btn.addEventListener("click",renderDuelLobby));
    UI.main.querySelectorAll("[data-fkl-admin-open]").forEach(btn=>btn.addEventListener("click",openFightAdminMenu));
    UI.main.querySelector("[data-fkl-leader]").addEventListener("click",renderLeaderboard);updateHead();
  }

  function dailyShopItems(category=UI.shopCategory){return ITEMS.filter(def=>{if(["pistol","automatic","shotgun","melee"].includes(category))return def.category==="weapon"&&def.family===category;if(["helmet","armor","suit","boots","chip","charm","companion","companioncare","mount","mountcare"].includes(category))return def.category===category;return false}).sort((a,b)=>rarityIndex(a.rarity)-rarityIndex(b.rarity)||(a.price||0)-(b.price||0));}

  function buildPlayer() {
    const data=ensureState(),gearSlots=["helmet","armor","suit","boots","chip","charm","mount","mountcare","companion","companioncare"],gearItems=Object.fromEntries(gearSlots.map(slot=>[slot,equipped(slot)])),gear=Object.fromEntries(gearSlots.map(slot=>[slot,gearItems[slot]?effectiveStats(gearItems[slot]):{}])),sum=key=>gearSlots.reduce((total,slot)=>total+Number(gear[slot][key]||0),0),levelBonus=1+(data.level-1)*.012,speedBonus=sum("speed"),speedPenalty=gearSlots.reduce((total,slot)=>total+Number(gear[slot].speedPenalty||0),0),style=STYLE_MAP.get(data.cosmetics.active)||CHARACTER_STYLES[0],weaponRuntimes={};
    const staff=canUseStaffModMenu()?data.staffTools:{godMode:false,damageMultiplier:1,speedMultiplier:1,defenseMultiplier:1};
    const ownerBonus=companionOwnerBonuses(gearItems.companion);
    const damageMult=levelBonus*(1+sum("damagePct")/100)*(1+ownerBonus.damage/100)*Number(staff.damageMultiplier||1);
    WEAPON_SLOT_KEYS.forEach(slot=>{const item=equipped(slot);if(!item)return;const stats=effectiveStats(item);weaponRuntimes[slot]={slot,item,stats,ammo:Math.max(1,Math.round(stats.magazine||1)),reloading:false,reloadTimer:0,specialCharge:0,specialReady:false}});
    let activeWeaponSlot=WEAPON_SLOT_KEYS.includes(data.activeWeaponSlot)&&weaponRuntimes[data.activeWeaponSlot]?data.activeWeaponSlot:WEAPON_SLOT_KEYS.find(slot=>weaponRuntimes[slot]);
    const active=weaponRuntimes[activeWeaponSlot]||{slot:"fists",item:null,stats:{id:"fists",name:"Fäuste",attack:"melee",family:"melee",rarity:"common",damage:9,fireRate:1.2,range:62,arc:1.5},ammo:1,reloading:false,reloadTimer:0,specialCharge:0,specialReady:false},moduleSpecial=gear.chip.specialGrant||gear.suit.specialGrant||gear.helmet.specialGrant||"";
    const mountBaseArmor=Math.round(Number(gear.mount.mountArmor||0)),mountCareStats=gear.mountcare||{},mountArmor=Math.round(mountBaseArmor*(1+Number(mountCareStats.mountCareHealthPct||0)/100));
    const compItem=gearItems.companion,cs=gear.companion||{},compCareStats=gear.companioncare||{},compDamagePct=sum("companionDamagePct"),compHealthPct=sum("companionHealthPct"),compRatePct=sum("companionRatePct");
    const companionMax=Math.round(Number(cs.companionHealth||100)*(1+compHealthPct/100)*(1+Number(compCareStats.companionCareHealthPct||0)/100));
    const companion=compItem?{item:compItem,stats:cs,x:WORLD_W/2-55,y:WORLD_H/2+55,hp:companionMax,maxHp:companionMax,damage:Number(cs.companionDamage||10)*(1+compDamagePct/100),rate:Number(cs.companionRate||1)*(1+compRatePct/100),range:Number(cs.companionRange||80),speed:Number(cs.companionSpeed||230),type:cs.companionType||"melee",heal:Number(cs.companionHeal||0),splash:Number(cs.companionSplash||0),pierce:Math.floor(Number(cs.companionPierce||0)),roar:Number(cs.companionRoar||0),cooldown:0,hitCooldown:0,dead:false,angle:0,attackAnim:0,moving:false,runPhase:0,ownerDamageBonus:ownerBonus.damage,ownerDefenseBonus:ownerBonus.defense}:null;
    const companionCare=gearItems.companioncare?{item:gearItems.companioncare,healPct:Number(compCareStats.companionCareHealPct||25),cooldown:Number(compCareStats.careCooldown||18),timer:0}:null;
    const mountCare=gearItems.mountcare?{item:gearItems.mountcare,healPct:Number(mountCareStats.mountCareHealPct||25),cooldown:Number(mountCareStats.careCooldown||18),timer:0}:null;
    const baseSpeed=250*(1+(speedBonus-Number(gear.mount.speed||0))/100)*Math.max(.55,1-speedPenalty)*Number(staff.speedMultiplier||1);
    return {x:WORLD_W/2,y:WORLD_H/2,radius:18,maxHp:Math.round(130+data.level*3+sum("health")),hp:0,maxShield:Math.round(sum("shield")),shield:Math.round(sum("shield")),baseSpeed,mountSpeedPct:Number(gear.mount.speed||0),mountMaxArmor:mountArmor,mountArmor,mountActive:!!gearItems.mount&&mountArmor>0,mountItem:gearItems.mount,mountStats:gear.mount,mountCare,speed:baseSpeed,armor:clamp(sum("armor")/100,0,.72),dodge:clamp(sum("dodge")/100,0,.58),dodgeHeal:sum("dodgeHeal"),dodgeBurst:sum("dodgeBurst"),regen:sum("regen"),crit:.05+sum("crit")/100,critDamage:1.75+sum("critDamage")/100,lifesteal:(sum("lifesteal")+Number(active.stats.lifesteal||0))/100,bossDamage:1+sum("bossDamage")/100,lootBonus:sum("loot"),revive:Math.floor(sum("revive")),armorItem:gearItems.armor||gearItems.suit||gearItems.helmet,weaponRuntimes,activeWeaponSlot,weaponItem:active.item,weapon:active.stats,ammo:active.ammo,reloading:active.reloading,reloadTimer:active.reloadTimer,moduleSpecial,damageMult,fireCooldown:0,attackAnim:0,hitFlash:0,angle:-Math.PI/2,vx:0,vy:0,moving:false,weaponBroken:!active.item||Number(active.item.durability)<=0,cosmetics:style,lookX:0,lookY:-1,specialType:active.stats.special||moduleSpecial||"",specialCharge:active.specialCharge,specialReady:active.specialReady,specialPulse:0,companion,companionCare,companionDefensePct:ownerBonus.defense,godMode:!!staff.godMode,staffDefenseMultiplier:Number(staff.defenseMultiplier||1)};
  }

  function updateCompanion(dt) {
    const s=UI.session,p=s?.player,c=p?.companion;
    if(!c||c.dead)return;
    c.cooldown=Math.max(0,c.cooldown-dt);c.hitCooldown=Math.max(0,c.hitCooldown-dt);c.attackAnim=Math.max(0,c.attackAnim-dt);c.runPhase+=dt*(c.moving?13:4);
    const def=itemDef(c.item),isMelee=c.type==="melee";
    const followX=p.x-50*Math.cos(p.angle)+40*Math.sin(p.angle),followY=p.y-50*Math.sin(p.angle)-40*Math.cos(p.angle);
    const target=nearestEnemy(c.x,c.y,isMelee?Math.max(420,c.range*5):c.range);
    c.moving=false;
    if(target){
      c.angle=Math.atan2(target.y-c.y,target.x-c.x);
      const d=distance(c,target);
      const desired=isMelee?target.radius+30:Math.max(115,c.range*.68);
      if(d>desired){const speed=c.speed*(isMelee?1.13:.82);c.x+=Math.cos(c.angle)*speed*dt;c.y+=Math.sin(c.angle)*speed*dt;c.moving=true;}
      if(c.cooldown<=0&&d<=Math.max(c.range,desired+18)){
        c.cooldown=1/Math.max(.2,c.rate);c.attackAnim=.22;
        if(isMelee){damageEnemy(target,c.damage,false,c.splash);spawnParticles(target.x,target.y,rarityDef(c.item).color,8,150);c.x+=Math.cos(c.angle)*8;c.y+=Math.sin(c.angle)*8;}
        else{const projectileSpeed=620;s.projectiles.push({x:c.x,y:c.y,vx:Math.cos(c.angle)*projectileSpeed,vy:Math.sin(c.angle)*projectileSpeed,radius:4,damage:c.damage,life:2.2,pierce:c.pierce,splash:c.splash,crit:false,color:rarityDef(c.item).color,ownerKey:coopOwnerKey(p),hit:new Set()});}
        if(c.roar&&Math.random()<.12)for(const enemy of s.enemies)if(distance(enemy,c)<165){enemy.statusTimer=Math.max(enemy.statusTimer,.8);enemy.statusType="stasis";}
      }
      if(d<target.radius+28&&c.hitCooldown<=0){
        c.hitCooldown=.75;damageCompanion(Math.max(2,target.damage),target,.5);
      }
    }else{
      const fd=Math.hypot(followX-c.x,followY-c.y)||1;
      if(fd>38){c.angle=Math.atan2(followY-c.y,followX-c.x);c.x+=((followX-c.x)/fd)*c.speed*.9*dt;c.y+=((followY-c.y)/fd)*c.speed*.9*dt;c.moving=true;}
    }
    if(c.heal>0&&p.hp>0)p.hp=Math.min(p.maxHp,p.hp+c.heal*dt);
    c.x=clamp(c.x,20,WORLD_W-20);c.y=clamp(c.y,20,WORLD_H-20);
  }


  function drawCompanion(ctx,s,now) {
    const c=s.player?.companion;if(!c||c.dead)return;
    const x=sx(s,c.x),y=sy(s,c.y),def=itemDef(c.item),rarity=rarityDef(c.item),human=/companion$/.test(def.id)||["scout-companion","medic-companion","gunner-companion","arc-mage"].includes(def.id),flying=["guardian-drone","phoenix-cub"].includes(def.id),canine=["street-dog","shepherd-dog","battle-hound"].includes(def.id),bigCat=["tiger-companion","lion-companion","void-beast","lynx-companion","alley-cat","ranger-cat"].includes(def.id);
    if(human){
      const fakePlayer={x:c.x,y:c.y,radius:16,moving:!!c.moving,cosmetics:{body:"#243841",accent:rarity.color,trim:"#10191d"},lookX:Math.cos(c.angle),lookY:Math.sin(c.angle),angle:c.angle,mountActive:false,mountItem:null,hitFlash:0,weapon:{name:def.name,attack:"gun",rarity:rarityKey(c.item)},attackAnim:c.attackAnim,specialReady:false,specialType:""};
      drawPlayer(ctx,{...s,player:fakePlayer},now);
      const pct=clamp(c.hp/c.maxHp,0,1);ctx.fillStyle="#020607dd";ctx.fillRect(x-30,y-48,60,6);ctx.fillStyle=rarity.color;ctx.fillRect(x-30,y-48,60*pct,6);return;
    }
    const stride=c.moving?Math.sin(c.runPhase||now*.014)*3:Math.sin(now*.004)*.5;
    ctx.save();ctx.translate(x,y+(flying?Math.sin(now*.006)*7:0));ctx.rotate(c.angle+Math.PI/2);
    ctx.globalAlpha=.28;ctx.fillStyle="#000";ctx.beginPath();ctx.ellipse(4,15,24,10,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.shadowColor=rarity.color;ctx.shadowBlur=14;ctx.strokeStyle=rarity.color;ctx.lineWidth=2.5;ctx.lineJoin="round";
    if(flying){ctx.fillStyle=def.id.includes("phoenix")?"#ff9f63":"#334c55";ctx.beginPath();ctx.moveTo(0,-23);ctx.lineTo(25,5);ctx.lineTo(0,17);ctx.lineTo(-25,5);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle="#eafcff";ctx.beginPath();ctx.arc(0,1,4,0,Math.PI*2);ctx.fill();}
    else if(canine||bigCat){
      const body=def.id==="street-dog"?"#8b694d":def.id==="shepherd-dog"?"#6e5138":def.id==="battle-hound"?"#514a43":def.id.includes("lion")?"#b17b36":def.id.includes("tiger")?"#d08a34":def.id.includes("lynx")?"#75664f":def.id.includes("void")?"#5a5470":"#77695d";
      ctx.fillStyle=body;ctx.beginPath();ctx.ellipse(0,4,13,24,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(0,-22,11,10,0,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.moveTo(-8,-28);ctx.lineTo(-12,-40);ctx.lineTo(-2,-31);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(8,-28);ctx.lineTo(12,-40);ctx.lineTo(2,-31);ctx.closePath();ctx.fill();
      ctx.strokeStyle=body;ctx.lineWidth=5;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(-10,-4);ctx.lineTo(-20,-8+stride);ctx.moveTo(10,-4);ctx.lineTo(20,-8-stride);ctx.moveTo(-10,14);ctx.lineTo(-20,21-stride);ctx.moveTo(10,14);ctx.lineTo(20,21+stride);ctx.stroke();
      ctx.strokeStyle=rarity.color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,27);ctx.quadraticCurveTo(12,37+stride,19,28);ctx.stroke();if(canine){ctx.strokeStyle=rarity.color;ctx.lineWidth=3.5;ctx.beginPath();ctx.arc(0,-20,9,.25,Math.PI-.2);ctx.stroke();}
      ctx.fillStyle="#f2dfc9";ctx.beginPath();ctx.ellipse(0,-30,5.5,4,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#161413";ctx.beginPath();ctx.arc(-4,-24,1.3,0,Math.PI*2);ctx.arc(4,-24,1.3,0,Math.PI*2);ctx.arc(0,-34,1.6,0,Math.PI*2);ctx.fill();
      if(def.id.includes("tiger")){ctx.strokeStyle="#4a2c11";ctx.lineWidth=2;for(const stripe of [-9,0,9]){ctx.beginPath();ctx.moveTo(-11,stripe);ctx.lineTo(11,stripe+3);ctx.stroke();}}if(def.id.includes("lion")){ctx.strokeStyle="#ddb35e";ctx.lineWidth=6;ctx.beginPath();ctx.arc(0,-22,11,0,Math.PI*2);ctx.stroke();}if(c.attackAnim>0){ctx.strokeStyle="#fff";ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,-27,28,-2.8,-.35);ctx.stroke();}
    }
    ctx.restore();const pct=clamp(c.hp/c.maxHp,0,1);ctx.fillStyle="#020607dd";ctx.fillRect(x-30,y-48,60,6);ctx.fillStyle=rarity.color;ctx.fillRect(x-30,y-48,60*pct,6);
  }


  function damageCompanion(amount,source,multiplier=.5){const c=UI.session?.player?.companion;if(!c||c.dead)return false;const incoming=Math.max(1,Number(amount)||1)*clamp(Number(multiplier)||.5,.05,1);c.hp=Math.max(0,c.hp-incoming);c.hitCooldown=.35;addDamageText(c.x,c.y-28,`-${Math.round(incoming)}`,"#ff9aa0",15);spawnParticles(c.x,c.y,rarityDef(c.item).color,7,120);if(c.hp<=0){c.dead=true;showCombatMessage(`${itemDef(c.item).name} AUSGEFALLEN`);spawnParticles(c.x,c.y,rarityDef(c.item).color,24,230);}return true;}
  function damageMount(amount,source,multiplier=.5){const p=UI.session?.player;if(!p?.mountItem||!p.mountActive||p.mountArmor<=0)return false;const incoming=Math.max(1,Number(amount)||1)*clamp(Number(multiplier)||.5,.05,1);p.mountArmor=Math.max(0,p.mountArmor-incoming);addDamageText(p.x,p.y+31,`REITTIER -${Math.round(incoming)}`,"#ffca6a",15);spawnParticles(p.x,p.y,"#ffae52",6,110);if(p.mountArmor<=0){p.mountActive=false;showCombatMessage(`${itemDef(p.mountItem).name} AUSGEFALLEN`);spawnParticles(p.x,p.y,"#ffae52",24,240);}return true;}
  function useCompanionCare(){const s=UI.session;if(s?.coop?.role==="guest"){s.coop.careCompanionSeq++;sendCoopInput(0);showCombatMessage("HAUSTIERPFLEGE AN HOST GESENDET");return;}const p=s?.player,c=p?.companion,care=p?.companionCare;if(!p)return;if(!c)return toast("Kein Begleiter","Rüste zuerst einen Begleiter aus.");if(!care)return toast("Keine Haustierpflege","Rüste im neuen Slot 4 ein Pflege- oder Rettungsset aus.");if(care.timer>0)return toast("Haustierpflege lädt",`${care.timer.toFixed(1)} Sekunden verbleiben.`);const restored=Math.max(1,c.maxHp*care.healPct/100);if(c.dead){c.dead=false;c.hp=Math.min(c.maxHp,restored);c.x=p.x-42;c.y=p.y+35;showCombatMessage(`${itemDef(c.item).name} GERETTET`);}else{c.hp=Math.min(c.maxHp,c.hp+restored);showCombatMessage(`${itemDef(c.item).name} +${Math.round(restored)} LP`);}care.timer=care.cooldown;spawnParticles(c.x,c.y,"#67ffae",22,180);updateHud();}
  function useMountCare(){const s=UI.session;if(s?.coop?.role==="guest"){s.coop.careMountSeq++;sendCoopInput(0);showCombatMessage("REITTIERPFLEGE AN HOST GESENDET");return;}const p=s?.player,care=p?.mountCare;if(!p)return;if(!p.mountItem)return toast("Kein Reittier","Rüste zuerst ein Reittier aus.");if(!care)return toast("Keine Reittierpflege","Rüste im neuen Slot 5 ein Pflege- oder Rettungsset aus.");if(care.timer>0)return toast("Reittierpflege lädt",`${care.timer.toFixed(1)} Sekunden verbleiben.`);const restored=Math.max(1,p.mountMaxArmor*care.healPct/100);if(!p.mountActive){p.mountActive=true;p.mountArmor=Math.min(p.mountMaxArmor,restored);p.speed=p.baseSpeed*(1+p.mountSpeedPct/100);showCombatMessage(`${itemDef(p.mountItem).name} GERETTET`);}else{p.mountArmor=Math.min(p.mountMaxArmor,p.mountArmor+restored);showCombatMessage(`${itemDef(p.mountItem).name} +${Math.round(restored)} PANZERUNG`);}care.timer=care.cooldown;spawnParticles(p.x,p.y,"#ffd46a",22,180);updateHud();}

  function damagePlayer(amount,source){
    const s=UI.session,p=s?.player;if(!p)return;
    if(s?.coop&&Number(p.spawnProtection||0)>0){addDamageText(p.x,p.y-30,"STARTSCHUTZ","#67f5c8",14);return;}
    if(p.godMode){p.hp=p.maxHp;p.shield=p.maxShield;addDamageText(p.x,p.y-30,"GOD MODE","#ffd76f",16);return;}
    if(Math.random()<p.dodge){addDamageText(p.x,p.y-30,"AUSGEWICHEN","#6affd8",18);if(p.dodgeHeal)p.hp=Math.min(p.maxHp,p.hp+p.dodgeHeal);if(p.dodgeBurst)for(const enemy of s.enemies)if(distance(enemy,p)<145)damageEnemy(enemy,p.dodgeBurst,false,0);spawnParticles(p.x,p.y,"#62f4d0",12,180);return;}
    const companionReduction=clamp(Number(p.companionDefensePct||0)/100,0,.65);
    const staffDivisor=Math.max(1,Number(p.staffDefenseMultiplier||1));
    return damagePlayerV116(Math.max(.1,Number(amount||0)*(1-companionReduction)/staffDivisor),source);
  }

  function updateHud(){const s=UI.session;if(!s||!UI.main)return;const p=s.player,data=ensureState(),need=levelNeed(data.level),set=(sel,val)=>{const n=UI.main.querySelector(sel);if(n)n.textContent=val};set("[data-fkl-hp-text]",`${Math.ceil(p.hp)}/${p.maxHp}`);set("[data-fkl-shield]",Math.ceil(p.shield));set("[data-fkl-wave]",s.coop?`KOOP · WELLE ${s.wave}`:p.godMode?`WELLE ${s.wave} · GOD MODE`:`WELLE ${s.wave}`);set("[data-fkl-kills]",s.kills);set("[data-fkl-score]",NUMBER.format(Math.floor(s.score)));set("[data-fkl-weapon-name]",p.weapon.name||"Waffe");set("[data-fkl-ammo]",p.weapon.attack==="melee"?"NAHKAMPF":p.reloading?"NACHLADEN":`${p.ammo}/${Math.round(p.weapon.magazine||1)}`);set("[data-fkl-durability]",p.weaponItem?`Haltbarkeit ${Math.ceil(p.weaponItem.durability)}/${itemMaxDurability(p.weaponItem)}`:"Fäuste");const hpBar=UI.main.querySelector("[data-fkl-hp-bar]"),xpBar=UI.main.querySelector("[data-fkl-xp-bar]");if(hpBar)hpBar.style.width=`${clamp(p.hp/p.maxHp*100,0,100)}%`;if(xpBar)xpBar.style.width=`${data.level>=MAX_LEVEL?100:clamp(data.xp/need*100,0,100)}%`;const mountPill=UI.main.querySelector("[data-fkl-mount-pill]");if(mountPill)mountPill.hidden=!p.mountItem;set("[data-fkl-mount]",p.mountItem?(p.mountActive?`${Math.ceil(p.mountArmor)}/${p.mountMaxArmor}`:"AUSGEFALLEN"):"—");const compPill=UI.main.querySelector("[data-fkl-companion-pill]");if(compPill)compPill.hidden=!p.companion;set("[data-fkl-companion]",p.companion?(p.companion.dead?"AUSGEFALLEN":`${Math.ceil(p.companion.hp)}/${p.companion.maxHp}`):"—");set("[data-fkl-companion-bonus]",p.companion?`+${p.companion.ownerDamageBonus}% DMG · +${p.companion.ownerDefenseBonus}% DEF`:"");const specialButton=UI.main.querySelector("[data-fkl-special]"),specialCircle=UI.main.querySelector("[data-fkl-special-circle]"),spec=SPECIALS[p.specialType];if(specialCircle){specialCircle.style.setProperty("--special-progress",`${Math.round(p.specialCharge*3.6)}deg`);specialCircle.style.setProperty("--special-color",spec?.color||"#62d9ff")}set("[data-fkl-special-icon]",spec?.icon||"✦");set("[data-fkl-special-name]",spec?.name||"Kein Special");set("[data-fkl-special-text]",p.specialType?(p.specialReady?"BEREIT":`${Math.floor(p.specialCharge)} %`):"—");specialButton?.classList.toggle("ready",!!p.specialReady);specialButton?.classList.toggle("disabled",!p.specialType);if(specialButton)specialButton.disabled=!p.specialType;UI.main.querySelectorAll("[data-fkl-weapon-switch]").forEach(btn=>{const slot=btn.dataset.fklWeaponSwitch;btn.classList.toggle("active",slot===p.activeWeaponSlot);const runtime=p.weaponRuntimes[slot];btn.classList.toggle("broken",!!runtime?.item&&runtime.item.durability<=0)});const companionCareButton=UI.main.querySelector("[data-fkl-care-companion]"),mountCareButton=UI.main.querySelector("[data-fkl-care-mount]");if(companionCareButton){const ready=!!p.companionCare&&p.companionCare.timer<=0;companionCareButton.disabled=!p.companionCare||!p.companion;companionCareButton.classList.toggle("ready",ready);set("[data-fkl-care-companion-text]",!p.companionCare?"Pflege ausrüsten":p.companionCare.timer>0?`${p.companionCare.timer.toFixed(1)} s`:p.companion?.dead?"Begleiter retten":"Begleiter heilen");}if(mountCareButton){const ready=!!p.mountCare&&p.mountCare.timer<=0;mountCareButton.disabled=!p.mountCare||!p.mountItem;mountCareButton.classList.toggle("ready",ready);set("[data-fkl-care-mount-text]",!p.mountCare?"Pflege ausrüsten":p.mountCare.timer>0?`${p.mountCare.timer.toFixed(1)} s`:!p.mountActive?"Reittier retten":"Reittier heilen");}const bossWrap=UI.main.querySelector("[data-fkl-boss-wrap]");if(bossWrap){bossWrap.hidden=!s.boss;if(s.boss){set("[data-fkl-boss-name]",s.boss.name);const bar=UI.main.querySelector("[data-fkl-boss-bar]");if(bar)bar.style.width=`${clamp(s.boss.hp/s.boss.maxHp*100,0,100)}%`}}updateCoopHud();}

  function duelProfile(){
    const data=ensureState(),stats=aggregateLoadoutStats(),weapon=equipped(data.activeWeaponSlot)||equipped("primary")||equipped("sidearm")||equipped("melee"),w=weapon?effectiveStats(weapon):{damage:10,fireRate:1,range:80,family:"melee",attack:"melee",rarity:"common"},companion=equipped("companion"),bonus=companionOwnerBonuses(companion);
    const visual={weaponId:weapon?.baseId||"service-pistol",weaponRarity:weapon?rarityKey(weapon):"common",weaponStar:Number(weapon?.star||0),weaponAttack:w.attack||"gun",companionId:companion?.baseId||"",companionRarity:companion?rarityKey(companion):"",companionStar:Number(companion?.star||0),companionName:companion?itemDef(companion).name:"",companionDamageBonus:bonus.damage,companionDefenseBonus:bonus.defense};
    const packedWeapon=`${itemDef(weapon).name}~v125~${encodeURIComponent(JSON.stringify(visual))}`;
    return {name:playerName(),level:data.level,power:powerScore(),maxHp:Math.min(2200,Math.round(stats.health+stats.shield*.45)),damage:Math.min(380,Math.max(12,Math.round(w.damage*(1+stats.damagePct/100)*.36))),attackRate:Math.min(6,Math.max(.55,Number(w.fireRate||1))),rangeClass:w.family==="melee"?"melee":w.family==="pistol"?"pistol":"primary",weapon:packedWeapon,...visual,style:data.cosmetics.active};
  }
  function stopDuel(renderHome=false){const current=UI.duel;clearTimeout(UI.duelPollTimer);cancelAnimationFrame(UI.duelRaf);current?.resizeObserver?.disconnect?.();UI.duelPollTimer=0;UI.duelRaf=0;UI.duel=null;if(renderHome&&UI.main)renderDashboard();}
  async function renderDuelLobby(){if(!UI.main)return;stopCombat(false);stopDuel(false);const data=ensureState(),locked=data.level<5;UI.main.innerHTML=`<div class="fkl-page">${pageHeader("Online 1 gegen 1","Firebase-Matchmaking mit einem echten Gegner. Figuren, Waffen und Begleiter entsprechen jetzt der Bot-Arena; Bewegungen werden weich interpoliert.")}<section class="fkl-panel fkl-duel-lobby"><div class="fkl-duel-emblem">⚔</div><small class="fkl-kicker">ONLINE-ARENA</small><h2>${locked?"Freischaltung ab Fight-Level 5":"Bereit für ein Duell?"}</h2><p>${locked?`Dir fehlen noch ${5-data.level} Fight-Level. Spiele Bot-Wellen, um Online-Duelle freizuschalten.`:"Das Match dauert maximal 90 Sekunden. Dein ausgerüsteter Begleiter wird neben deiner Figur angezeigt."}</p><div class="fkl-duel-record"><div><small>Siege</small><b>${data.duel.wins}</b></div><div><small>Niederlagen</small><b>${data.duel.losses}</b></div><div><small>Unentschieden</small><b>${data.duel.draws}</b></div><div><small>Power</small><b>${NUMBER.format(powerScore())}</b></div></div><button class="fkl-btn gold" type="button" data-fkl-find-duel ${locked?"disabled":""}>${locked?"Noch gesperrt":"Gegner suchen"}</button><div class="fkl-online-state" data-fkl-duel-status>Firebase wartet auf deine Suche.</div></section></div>`;bindPageHome();UI.main.querySelector("[data-fkl-find-duel]")?.addEventListener("click",joinOnlineDuel);}
  async function joinOnlineDuel(){const status=UI.main?.querySelector("[data-fkl-duel-status]");if(status)status.textContent="Firebase wird verbunden und ein Gegner gesucht …";try{const result=await firebaseCallable(DUEL_JOIN_FUNCTION,{profile:duelProfile()});if(result?.match){startDuelArena(result.match);return;}UI.duel={waiting:true,queueId:result?.queueId||""};if(status)status.textContent="Warteschlange aktiv · Gegner wird gesucht …";pollDuelWaiting();}catch(error){if(status)status.textContent=`Matchmaking nicht verfügbar: ${error.message||error}`;}}
  async function pollDuelWaiting(){if(!UI.duel?.waiting)return;try{const result=await firebaseCallable(DUEL_GET_FUNCTION,{});if(result?.match){startDuelArena(result.match);return;}const status=UI.main?.querySelector("[data-fkl-duel-status]");if(status)status.textContent=`Warteschlange aktiv · ${new Date().toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}`;}catch(error){const status=UI.main?.querySelector("[data-fkl-duel-status]");if(status)status.textContent=`Verbindung wird erneut versucht: ${error.message||error}`;}UI.duelPollTimer=setTimeout(pollDuelWaiting,1500);}
  function normalizeDuelProfile(value={},fallback={}){let merged={...fallback,...value};const rawWeapon=String(merged.weapon||"");if(rawWeapon.includes("~v125~")){const [weaponName,payload]=rawWeapon.split("~v125~",2);try{merged={...merged,...JSON.parse(decodeURIComponent(payload||"")),weapon:weaponName};}catch{merged.weapon=weaponName;}}return {...merged,name:String(merged.name||"Spieler"),style:STYLE_MAP.has(merged.style)?merged.style:"shadow",weapon:String(merged.weapon||itemDef({baseId:merged.weaponId}).name||"Waffe"),weaponId:ITEM_MAP.has(merged.weaponId)?merged.weaponId:"service-pistol",weaponRarity:RARITIES[merged.weaponRarity]?merged.weaponRarity:"common",weaponStar:clamp(Math.floor(Number(merged.weaponStar)||0),0,MAX_STAR),companionId:ITEM_MAP.has(merged.companionId)&&ITEM_MAP.get(merged.companionId)?.category==="companion"?merged.companionId:"",companionRarity:RARITIES[merged.companionRarity]?merged.companionRarity:"common",companionStar:clamp(Math.floor(Number(merged.companionStar)||0),0,MAX_STAR)};}
  function resizeDuelCanvas(){const d=UI.duel;if(!d?.canvas)return;const rect=d.canvas.getBoundingClientRect(),dpr=Math.min(matchMedia("(pointer:coarse)").matches?1.25:1.6,window.devicePixelRatio||1);d.dpr=dpr;const width=Math.max(520,Math.round(rect.width*dpr)),height=Math.max(340,Math.round(rect.height*dpr));if(d.canvas.width!==width)d.canvas.width=width;if(d.canvas.height!==height)d.canvas.height=height;}
  function applyDuelMatch(match,now=performance.now()){
    const d=UI.duel;if(!d||!match)return;const opp=match.players?.[d.remoteSide]||{},me=match.players?.[d.youSide]||{},packetStamp=Number(opp.positionUpdatedAtMs||opp.updatedAtMs||opp.lastMoveAtMs||0);if(packetStamp&&packetStamp<Number(d.remotePacketStamp||0)){d.localProfile=normalizeDuelProfile(me,d.localProfile);d.state=match;return;}if(packetStamp)d.remotePacketStamp=packetStamp;const nextX=clamp(Number(opp.x??d.remoteTargetX??75),5,95),nextY=clamp(Number(opp.y??d.remoteTargetY??50),8,92),previousX=Number(d.remoteTargetX??nextX),previousY=Number(d.remoteTargetY??nextY),elapsed=Math.max(.001,(now-Number(d.remoteLastPacketAt||now))/1000),dx=nextX-previousX,dy=nextY-previousY,distanceMoved=Math.hypot(dx,dy);
    if(elapsed>.025&&elapsed<1.5&&distanceMoved>.005){const measuredX=clamp(dx/elapsed,-48,48),measuredY=clamp(dy/elapsed,-48,48);d.remoteVelX=d.remoteVelX*.28+measuredX*.72;d.remoteVelY=d.remoteVelY*.28+measuredY*.72;d.remoteIdleSince=now;}else if(now-Number(d.remoteIdleSince||now)>420){d.remoteVelX*=.68;d.remoteVelY*=.68;}
    d.remoteTargetX=nextX;d.remoteTargetY=nextY;d.remoteTargetAngle=Number.isFinite(Number(opp.angle))?Number(opp.angle):(distanceMoved>.03?Math.atan2(dy,dx):d.remoteTargetAngle);d.remoteSampleAt=now;d.remoteLastPacketAt=now;if(Math.hypot(nextX-d.remoteX,nextY-d.remoteY)>38){d.remoteX=nextX;d.remoteY=nextY;d.remoteVelX=0;d.remoteVelY=0;}d.localProfile=normalizeDuelProfile(me,d.localProfile);d.remoteProfile=normalizeDuelProfile(opp,d.remoteProfile);d.state=match;
  }

  function startDuelArena(match){
    stopDuel(false);const you=match.youSide||"a",remote=you==="a"?"b":"a",me=match.players?.[you]||{},opp=match.players?.[remote]||{},localBase=duelProfile();
    UI.main.innerHTML=`<section class="fkl-duel"><div class="fkl-duel-hud"><div><small>${escapeHtml(me.name||localBase.name)}</small><div class="fkl-duel-health"><i data-fkl-duel-me-bar></i></div><b data-fkl-duel-me-hp>${Math.ceil(me.hp||localBase.maxHp||100)}</b></div><div class="fkl-duel-clock" data-fkl-duel-clock>1:30</div><div class="opponent"><small>${escapeHtml(opp.name||"Gegner")}</small><div class="fkl-duel-health"><i data-fkl-duel-opp-bar></i></div><b data-fkl-duel-opp-hp>${Math.ceil(opp.hp||100)}</b></div></div><canvas class="fkl-duel-canvas" data-fkl-duel-canvas></canvas><div class="fkl-duel-controls"><button class="fkl-btn" type="button" data-fkl-duel-dodge>💨 Ausweichen</button><button class="fkl-btn primary" type="button" data-fkl-duel-attack>🎯 Angriff</button><button class="fkl-btn gold" type="button" data-fkl-duel-special>⚡ Special 0%</button><button class="fkl-btn danger" type="button" data-fkl-duel-leave>Verlassen</button></div></section>`;
    const canvas=UI.main.querySelector("[data-fkl-duel-canvas]"),oppX=clamp(Number(opp.x||75),5,95),oppY=clamp(Number(opp.y||50),8,92),now=performance.now();
    UI.duel={matchId:match.id,youSide:you,remoteSide:remote,state:match,canvas,ctx:canvas.getContext("2d"),dpr:1,x:clamp(Number(me.x||25),5,95),y:clamp(Number(me.y||50),8,92),angle:Number(me.angle||0),localMoving:false,localProfile:normalizeDuelProfile(me,localBase),remoteProfile:normalizeDuelProfile(opp,{}),remoteX:oppX,remoteY:oppY,remoteTargetX:oppX,remoteTargetY:oppY,remoteVelX:0,remoteVelY:0,remoteAngle:Number(opp.angle||Math.PI),remoteTargetAngle:Number(opp.angle||Math.PI),remoteSampleAt:now,remoteLastPacketAt:now,remoteIdleSince:now,remotePacketStamp:0,lastHeartbeat:0,heartbeatPending:false,pollPending:false,lastSentX:Number(me.x||25),lastSentY:Number(me.y||50),lastSentAngle:Number(me.angle||0),lastAttack:0,bits:[],ended:false,resizeObserver:null};
    resizeDuelCanvas();UI.duel.resizeObserver=new ResizeObserver(resizeDuelCanvas);UI.duel.resizeObserver.observe(canvas.parentElement);
    UI.main.querySelector("[data-fkl-duel-attack]").addEventListener("click",()=>sendDuelAction("attack"));UI.main.querySelector("[data-fkl-duel-dodge]").addEventListener("click",()=>sendDuelAction("dodge"));UI.main.querySelector("[data-fkl-duel-special]").addEventListener("click",()=>sendDuelAction("special"));UI.main.querySelector("[data-fkl-duel-leave]").addEventListener("click",()=>leaveOnlineDuel(false));UI.last=now;updateDuelHud();UI.duelRaf=requestAnimationFrame(duelLoop);pollActiveDuel();
  }
  function smoothDuelAngle(from,to,amount){let delta=(to-from+Math.PI)%(Math.PI*2)-Math.PI;if(delta< -Math.PI)delta+=Math.PI*2;return from+delta*amount;}
  function duelLoop(now){const d=UI.duel;if(!d||d.ended)return;const dt=Math.min(.04,Math.max(.001,(now-UI.last)/1000||.016));UI.last=now;let mx=0,my=0;if(UI.keys.KeyW||UI.keys.ArrowUp)my-=1;if(UI.keys.KeyS||UI.keys.ArrowDown)my+=1;if(UI.keys.KeyA||UI.keys.ArrowLeft)mx-=1;if(UI.keys.KeyD||UI.keys.ArrowRight)mx+=1;const len=Math.hypot(mx,my)||1;d.localMoving=!!(mx||my);if(d.localMoving){mx/=len;my/=len;d.x=clamp(d.x+mx*28*dt,5,95);d.y=clamp(d.y+my*28*dt,8,92);d.angle=Math.atan2(my,mx);}const packetAge=Math.max(0,(now-d.remoteSampleAt)/1000),predictionTime=Math.min(.62,packetAge+.07),predX=clamp(d.remoteTargetX+d.remoteVelX*predictionTime,5,95),predY=clamp(d.remoteTargetY+d.remoteVelY*predictionTime,8,92),positionSmooth=1-Math.exp(-dt*17),angleSmooth=1-Math.exp(-dt*14);d.remoteX+=(predX-d.remoteX)*positionSmooth;d.remoteY+=(predY-d.remoteY)*positionSmooth;d.remoteAngle=smoothDuelAngle(d.remoteAngle,d.remoteTargetAngle,angleSmooth);const movedSinceSend=Math.hypot(d.x-Number(d.lastSentX||d.x),d.y-Number(d.lastSentY||d.y)),angleChanged=Math.abs(smoothDuelAngle(Number(d.lastSentAngle||d.angle),d.angle,1)-Number(d.lastSentAngle||d.angle));if(((now-d.lastHeartbeat>125&&(d.localMoving||movedSinceSend>.08||angleChanged>.04))||now-d.lastHeartbeat>420)&&!d.heartbeatPending){d.lastHeartbeat=now;d.lastSentX=d.x;d.lastSentY=d.y;d.lastSentAngle=d.angle;sendDuelAction("heartbeat",false);}drawDuel(now,dt);UI.duelRaf=requestAnimationFrame(duelLoop);}

  function drawDuelArenaFloor(ctx,w,h,now){const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,"#13313a");g.addColorStop(.55,"#071a20");g.addColorStop(1,"#030a0d");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);const glow=ctx.createRadialGradient(w*.5,h*.5,20,w*.5,h*.5,Math.max(w,h)*.55);glow.addColorStop(0,"#2ce8ba20");glow.addColorStop(.5,"#1596b010");glow.addColorStop(1,"transparent");ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);ctx.strokeStyle="#3d6a6d44";ctx.lineWidth=1;const grid=64;for(let x=0;x<w;x+=grid){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}for(let y=0;y<h;y+=grid){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}ctx.strokeStyle="#55e5bd30";ctx.lineWidth=3;ctx.beginPath();ctx.arc(w*.5,h*.5,Math.min(w,h)*.22,0,Math.PI*2);ctx.stroke();ctx.setLineDash([12,14]);ctx.strokeStyle="#f7cb6140";ctx.beginPath();ctx.arc(w*.5,h*.5,Math.min(w,h)*.32,now*.0002,Math.PI*2+now*.0002);ctx.stroke();ctx.setLineDash([]);const obstacles=[[.18,.22],[.82,.22],[.18,.78],[.82,.78],[.5,.18],[.5,.82]];for(const [px,py] of obstacles){const x=w*px,y=h*py;ctx.fillStyle="#19343a";ctx.strokeStyle="#4e7377";ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x-15,y-15,30,30,5);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(x-15,y-15);ctx.lineTo(x+15,y+15);ctx.moveTo(x+15,y-15);ctx.lineTo(x-15,y+15);ctx.stroke();}ctx.strokeStyle="#68efc777";ctx.lineWidth=4;ctx.strokeRect(4,4,w-8,h-8);}
  function duelProfileItem(id,rarity,star){if(!ITEM_MAP.has(id))return null;return{uid:`duel-${id}`,baseId:id,rarity:RARITIES[rarity]?rarity:ITEM_MAP.get(id).rarity,star:clamp(Math.floor(Number(star)||0),0,MAX_STAR),durability:999999};}
  function drawDuelAvatar(ctx,x,y,profile,angle,moving,color,now,isLocal){const normalized=normalizeDuelProfile(profile),style=STYLE_MAP.get(normalized.style)||CHARACTER_STYLES[0],weaponItem=duelProfileItem(normalized.weaponId,normalized.weaponRarity,normalized.weaponStar),weaponStats=weaponItem?effectiveStats(weaponItem):{name:normalized.weapon||"Waffe",attack:normalized.rangeClass==="melee"?"melee":"gun",rarity:normalized.weaponRarity||"common"};ctx.save();ctx.translate(x,y);const avatarScale=matchMedia("(pointer:coarse)").matches ? .88 : 1.04;ctx.scale(avatarScale,avatarScale);const fake={camera:{x:0,y:0},viewW:0,viewH:0,player:{x:0,y:0,moving,cosmetics:style,lookX:Math.cos(angle),lookY:Math.sin(angle),angle,mountActive:false,hitFlash:0,weapon:{...weaponStats,rarity:normalized.weaponRarity||weaponStats.rarity||"common"},attackAnim:0,specialReady:false,specialType:""}};drawPlayer(ctx,fake,now);if(normalized.companionId){const item=duelProfileItem(normalized.companionId,normalized.companionRarity,normalized.companionStar),offsetX=-48*Math.cos(angle)+35*Math.sin(angle),offsetY=-48*Math.sin(angle)-35*Math.cos(angle);fake.player.companion={item,x:offsetX,y:offsetY,hp:100,maxHp:100,dead:false,angle,moving,runPhase:now*.014,attackAnim:0};drawCompanion(ctx,fake,now);}ctx.restore();ctx.save();ctx.textAlign="center";ctx.shadowColor=color;ctx.shadowBlur=9;ctx.fillStyle="#f4fbfc";ctx.font="900 12px system-ui";ctx.fillText(normalized.name||"Spieler",x,y-70);ctx.shadowBlur=5;ctx.fillStyle=color;ctx.font="800 11px system-ui";ctx.fillText(normalized.weapon||itemDef(weaponItem).name||"Waffe",x,y+73);if(normalized.companionId){ctx.fillStyle="#b6c9cd";ctx.font="700 9px system-ui";ctx.fillText(`${normalized.companionName||itemDef(duelProfileItem(normalized.companionId,normalized.companionRarity,normalized.companionStar)).name} · +${Number(normalized.companionDamageBonus||0)}% DMG`,x,y+87);}ctx.restore();}
  function drawDuel(now,dt=.016){const d=UI.duel;if(!d?.ctx)return;const ctx=d.ctx,canvas=d.canvas,w=canvas.width/d.dpr,h=canvas.height/d.dpr;ctx.setTransform(d.dpr,0,0,d.dpr,0,0);ctx.clearRect(0,0,w,h);drawDuelArenaFloor(ctx,w,h,now);const remoteMoving=Math.hypot(d.remoteVelX,d.remoteVelY)>.45||Math.hypot(d.remoteTargetX-d.remoteX,d.remoteTargetY-d.remoteY)>.18;drawDuelAvatar(ctx,d.x/100*w,d.y/100*h,d.localProfile,d.angle,d.localMoving,"#49edbb",now,true);drawDuelAvatar(ctx,d.remoteX/100*w,d.remoteY/100*h,d.remoteProfile,d.remoteAngle,remoteMoving,"#ff6674",now,false);for(const b of d.bits){b.life-=dt;b.x+=(b.tx-b.x)*(1-Math.exp(-dt*12));b.y+=(b.ty-b.y)*(1-Math.exp(-dt*12));ctx.fillStyle=b.color;ctx.shadowColor=b.color;ctx.shadowBlur=14;ctx.beginPath();ctx.arc(b.x,b.y,5,0,Math.PI*2);ctx.fill()}d.bits=d.bits.filter(b=>b.life>0);}
  async function sendDuelAction(type,showErrors=true){const d=UI.duel;if(!d?.matchId||d.ended)return;if(type==="heartbeat"&&d.heartbeatPending)return;if(type==="heartbeat")d.heartbeatPending=true;try{const result=await firebaseCallable(DUEL_ACTION_FUNCTION,{matchId:d.matchId,type,x:Number(d.x.toFixed(3)),y:Number(d.y.toFixed(3)),angle:Number(d.angle.toFixed(4))});if(result?.match){applyDuelMatch(result.match,performance.now());if(type==="attack"||type==="special"){const w=d.canvas.width/d.dpr,h=d.canvas.height/d.dpr;d.bits.push({x:d.x/100*w,y:d.y/100*h,tx:d.remoteX/100*w,ty:d.remoteY/100*h,color:type==="special"?"#ffd45e":"#5cceff",life:.7});}updateDuelHud();if(result.match.status==="finished")finishDuelUI(result.match);}}catch(error){if(showErrors)toast("Online-Aktion fehlgeschlagen",error.message||String(error));}finally{if(type==="heartbeat"&&UI.duel)UI.duel.heartbeatPending=false;}}
  async function pollActiveDuel(){const d=UI.duel;if(!d?.matchId||d.ended)return;if(d.pollPending){UI.duelPollTimer=setTimeout(pollActiveDuel,180);return;}d.pollPending=true;try{const result=await firebaseCallable(DUEL_GET_FUNCTION,{matchId:d.matchId});if(result?.match){applyDuelMatch(result.match,performance.now());updateDuelHud();if(result.match.status==="finished"){finishDuelUI(result.match);return;}}}catch(error){}finally{if(UI.duel)UI.duel.pollPending=false;}UI.duelPollTimer=setTimeout(pollActiveDuel,180);}
  function updateDuelHud(){const d=UI.duel,state=d?.state;if(!state||!UI.main)return;const me=state.players?.[d.youSide]||{},opp=state.players?.[d.remoteSide]||{},set=(sel,val)=>{const n=UI.main.querySelector(sel);if(n)n.textContent=val};set("[data-fkl-duel-me-hp]",Math.ceil(me.hp||0));set("[data-fkl-duel-opp-hp]",Math.ceil(opp.hp||0));const mb=UI.main.querySelector("[data-fkl-duel-me-bar]"),ob=UI.main.querySelector("[data-fkl-duel-opp-bar]");if(mb)mb.style.width=`${clamp((me.hp||0)/(me.maxHp||1)*100,0,100)}%`;if(ob)ob.style.width=`${clamp((opp.hp||0)/(opp.maxHp||1)*100,0,100)}%`;const remaining=Math.max(0,Math.ceil((Number(state.endsAtMs||Date.now())-Date.now())/1000));set("[data-fkl-duel-clock]",`${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,"0")}`);const special=UI.main.querySelector("[data-fkl-duel-special]");if(special){special.textContent=`⚡ Special ${Math.floor(me.charge||0)}%`;special.disabled=Number(me.charge||0)<100;}}
  function finishDuelUI(match){const d=UI.duel;if(!d||d.ended)return;d.ended=true;clearTimeout(UI.duelPollTimer);cancelAnimationFrame(UI.duelRaf);d.resizeObserver?.disconnect?.();const data=ensureState(),winner=match.winnerSide,result=winner===d.youSide?"win":winner?"loss":"draw";if(result==="win")data.duel.wins++;else if(result==="loss")data.duel.losses++;else data.duel.draws++;safeSave();const modal=showModal(`<div style="font-size:64px">${result==="win"?"🏆":result==="loss"?"💥":"🤝"}</div><small class="fkl-kicker">ONLINE-DUELL BEENDET</small><h3>${result==="win"?"Sieg!":result==="loss"?"Niederlage":"Unentschieden"}</h3><p>${escapeHtml(match.finishReason||"Das Duell wurde ausgewertet.")}</p><div class="fkl-modal-actions"><button class="fkl-btn gold" type="button" data-fkl-duel-again>Noch ein Duell</button><button class="fkl-btn" type="button" data-fkl-duel-home>Hauptmenü</button></div>`);modal.querySelector("[data-fkl-duel-again]").addEventListener("click",()=>{modal.remove();renderDuelLobby()});modal.querySelector("[data-fkl-duel-home]").addEventListener("click",()=>{modal.remove();renderDashboard()});}
  async function leaveOnlineDuel(returnPhone=false){const d=UI.duel;try{if(d?.matchId)await firebaseCallable(DUEL_LEAVE_FUNCTION,{matchId:d.matchId});else if(d?.waiting)await firebaseCallable(DUEL_LEAVE_FUNCTION,{});}catch{}stopDuel(false);if(returnPhone)returnToTopGames();else renderDashboard();}


  function withSessionPlayer(player, callback) {
    const s=UI.session;if(!s||!player)return undefined;
    const original=s.player;s.player=player;
    try{return callback();}finally{s.player=original;}
  }
  function coopOwnerKey(player){const s=UI.session;if(!s?.coop)return"local";return player===s.coop.remote?"remote":"local";}
  function coopProjectileOwner(projectile){const s=UI.session;if(!s?.coop||projectile?.ownerKey!=="remote")return s?.coop?.local||s?.player;return s.coop.remote;}
  // Wellen-KOOP ist ein vollständig geschützter Teammodus. Projektile,
  // Nahkampf, Specials und Begleiter eines Spielers dürfen niemals den
  // Mitspieler oder dessen Begleiter/Reittier verletzen.
  function coopFriendlyTarget(){return null;}
  function applyCoopFriendlyMeleeHit(){return false;}
  function damageEnemyForPlayer(player,enemy,amount,crit=false,splash=0){if(!player)return damageEnemy(enemy,amount,crit,splash);return withSessionPlayer(player,()=>damageEnemy(enemy,amount,crit,splash));}
  function drawCoopPlayerEntity(ctx,s,player,now,isLocal){
    if(!player)return;
    if(player.hp>0){withSessionPlayer(player,()=>{drawCompanion(ctx,s,now);drawPlayer(ctx,s,now);});}
    const x=sx(s,player.x),y=sy(s,player.y);
    ctx.save();ctx.textAlign="center";ctx.font="800 12px system-ui";ctx.fillStyle=isLocal?"#67f5c8":"#7dc6ff";ctx.shadowColor="#000";ctx.shadowBlur=5;ctx.fillText(player.coopName|| (isLocal?playerName():"Mitspieler"),x,y-58);
    if(player.hp<=0){ctx.font="28px system-ui";ctx.fillText("💀",x,y-15);ctx.font="800 11px system-ui";ctx.fillStyle="#ff7b83";ctx.fillText("K.O. · Team kämpft weiter",x,y+18);}
    ctx.restore();
  }
  function cleanCoopData(value){return JSON.parse(JSON.stringify(value));}
  function coopItemData(item){return item?{baseId:item.baseId,rarity:rarityKey(item),star:Number(item.star||0),durability:itemMaxDurability(item)||999999}:null;}
  function coopProfile(){
    const p=buildPlayer(),data=ensureState();
    const weapons={};
    for(const [slot,runtime] of Object.entries(p.weaponRuntimes||{}))weapons[slot]={item:coopItemData(runtime.item),stats:cleanCoopData(runtime.stats)};
    return cleanCoopData({
      name:playerName(),level:data.level,power:powerScore(),style:p.cosmetics,weapons,activeWeaponSlot:p.activeWeaponSlot,
      maxHp:p.maxHp,maxShield:p.maxShield,baseSpeed:p.baseSpeed,mountSpeedPct:p.mountSpeedPct,mountMaxArmor:p.mountMaxArmor,
      armor:p.armor,dodge:p.dodge,dodgeHeal:p.dodgeHeal,dodgeBurst:p.dodgeBurst,regen:p.regen,crit:p.crit,critDamage:p.critDamage,
      lifesteal:p.lifesteal,bossDamage:p.bossDamage,lootBonus:p.lootBonus,revive:p.revive,damageMult:p.damageMult,
      companionDefensePct:p.companionDefensePct||0,
      mount:p.mountItem?{item:coopItemData(p.mountItem),stats:cleanCoopData(p.mountStats||{}),maxArmor:p.mountMaxArmor}:null,
      companion:p.companion?{item:coopItemData(p.companion.item),stats:cleanCoopData(p.companion.stats||{}),maxHp:p.companion.maxHp,damage:p.companion.damage,rate:p.companion.rate,range:p.companion.range,speed:p.companion.speed,type:p.companion.type,heal:p.companion.heal,splash:p.companion.splash,pierce:p.companion.pierce,roar:p.companion.roar,ownerDamageBonus:p.companion.ownerDamageBonus,ownerDefenseBonus:p.companion.ownerDefenseBonus}:null,
      companionCare:p.companionCare?{item:coopItemData(p.companionCare.item),healPct:p.companionCare.healPct,cooldown:p.companionCare.cooldown}:null,
      mountCare:p.mountCare?{item:coopItemData(p.mountCare.item),healPct:p.mountCare.healPct,cooldown:p.mountCare.cooldown}:null,
      unlockedWaveStart:data.unlockedWaveStart,
      selectedStartWave:data.selectedStartWave
    });
  }
  function buildCoopPlayer(profile,x,y){
    const weapons={};for(const [slot,runtime] of Object.entries(profile?.weapons||{})){if(!runtime?.item)continue;weapons[slot]={slot,item:{...runtime.item,uid:`coop-${slot}`},stats:{...runtime.stats},ammo:Math.max(1,Math.round(runtime.stats?.magazine||1)),reloading:false,reloadTimer:0,specialCharge:0,specialReady:false};}
    let active=weapons[profile?.activeWeaponSlot]?profile.activeWeaponSlot:Object.keys(weapons)[0];
    if(!active){active="fists";weapons.fists={slot:"fists",item:null,stats:{id:"fists",name:"Fäuste",attack:"melee",family:"melee",rarity:"common",damage:9,fireRate:1.2,range:62,arc:1.5},ammo:1,reloading:false,reloadTimer:0,specialCharge:0,specialReady:false};}
    const runtime=weapons[active];
    const companionProfile=profile?.companion;
    const companion=companionProfile?{item:{...companionProfile.item,uid:"coop-companion"},stats:{...companionProfile.stats},x:x-55,y:y+55,hp:companionProfile.maxHp,maxHp:companionProfile.maxHp,damage:companionProfile.damage,rate:companionProfile.rate,range:companionProfile.range,speed:companionProfile.speed,type:companionProfile.type,heal:companionProfile.heal,splash:companionProfile.splash,pierce:companionProfile.pierce,roar:companionProfile.roar,cooldown:0,hitCooldown:0,dead:false,angle:0,attackAnim:0,moving:false,runPhase:0,ownerDamageBonus:companionProfile.ownerDamageBonus||0,ownerDefenseBonus:companionProfile.ownerDefenseBonus||0}:null;
    return {coopName:String(profile?.name||"Mitspieler").slice(0,24),x,y,radius:18,maxHp:Number(profile?.maxHp||130),hp:Number(profile?.maxHp||130),maxShield:Number(profile?.maxShield||0),shield:Number(profile?.maxShield||0),baseSpeed:Number(profile?.baseSpeed||250),mountSpeedPct:Number(profile?.mountSpeedPct||0),mountMaxArmor:Number(profile?.mountMaxArmor||0),mountArmor:Number(profile?.mountMaxArmor||0),mountActive:!!profile?.mount,mountItem:profile?.mount?.item?{...profile.mount.item,uid:"coop-mount"}:null,mountStats:{...(profile?.mount?.stats||{})},mountCare:profile?.mountCare?{item:{...profile.mountCare.item,uid:"coop-mountcare"},healPct:Number(profile.mountCare.healPct||25),cooldown:Number(profile.mountCare.cooldown||18),timer:0}:null,speed:Number(profile?.baseSpeed||250),armor:Number(profile?.armor||0),dodge:Number(profile?.dodge||0),dodgeHeal:Number(profile?.dodgeHeal||0),dodgeBurst:Number(profile?.dodgeBurst||0),regen:Number(profile?.regen||0),crit:Number(profile?.crit||.05),critDamage:Number(profile?.critDamage||1.75),lifesteal:Number(profile?.lifesteal||0),bossDamage:Number(profile?.bossDamage||1),lootBonus:Number(profile?.lootBonus||0),revive:Number(profile?.revive||0),armorItem:{durability:999999},weaponRuntimes:weapons,activeWeaponSlot:active,weaponItem:runtime.item,weapon:runtime.stats,ammo:runtime.ammo,reloading:false,reloadTimer:0,moduleSpecial:"",damageMult:Number(profile?.damageMult||1),fireCooldown:0,attackAnim:0,hitFlash:0,angle:-Math.PI/2,vx:0,vy:0,moving:false,weaponBroken:false,cosmetics:profile?.style||CHARACTER_STYLES[0],lookX:0,lookY:-1,specialType:runtime.stats?.special||"",specialCharge:0,specialReady:false,specialPulse:0,companion,companionCare:profile?.companionCare?{item:{...profile.companionCare.item,uid:"coop-compcare"},healPct:Number(profile.companionCare.healPct||25),cooldown:Number(profile.companionCare.cooldown||18),timer:0}:null,companionDefensePct:Number(profile?.companionDefensePct||0),staffDefenseMultiplier:1,godMode:false};
  }
  async function loadCoopFirebase(){
    const core=window.LifeBuilderFirebaseCore;if(!core?.load)throw new Error("Firebase-Laufzeit fehlt.");
    const fb=await core.load(),user=await core.waitForAuth(8500);if(!user)throw new Error("Melde dich mit deinem JK.Games-Konto an.");return{fb,user};
  }
  function coopFinite(value,fallback=0){const number=Number(value);return Number.isFinite(number)?number:Number(fallback)||0;}
  function coopHas(object,key){return !!object&&Object.prototype.hasOwnProperty.call(object,key);}
  function waitForCoopHostReady(match,fb,user){
    return new Promise((resolve,reject)=>{
      const matchId=match?.id||match?.matchId;if(!matchId){reject(new Error("Die KOOP-Partie besitzt keine gültige ID."));return;}
      const matchRef=fb.doc(fb.db,COOP_MATCH_COLLECTION,matchId);let finished=false,unsubscribe=()=>{};
      const finish=(error,value)=>{if(finished)return;finished=true;clearTimeout(timer);try{unsubscribe();}catch{}error?reject(error):resolve(value);};
      const timer=setTimeout(()=>finish(new Error("Der andere Spieler hat die Lobby nicht bestätigt. Bitte startet die Suche erneut.")),18000);
      unsubscribe=fb.onSnapshot(matchRef,snapshot=>{
        if(!snapshot.exists()){finish(new Error("Die KOOP-Partie wurde nicht gefunden."));return;}
        const current=snapshot.data();
        if(current.status==="ended"){finish(new Error(current.finishReason||"Die KOOP-Partie wurde beendet."));return;}
        if(current.hostReady===true&&current.hostUid!==user.uid)finish(null,{...match,...current,id:matchId});
      },error=>finish(new Error(error?.message||"Die Lobby-Verbindung wurde unterbrochen.")));
    });
  }
  function renderCoopLobby(){
    if(!UI.main)return;stopCombat(false);stopDuel(false);stopCoopWaiting(true);
    const data=ensureState();
    UI.main.innerHTML=`<div class="fkl-page">${pageHeader("Wellen-KOOP","Zwei Spieler kämpfen gemeinsam gegen dieselben Wellen. Die tatsächliche Startwelle wird auf den höchsten Startpunkt begrenzt, den beide Spieler freigeschaltet haben.")}<section class="fkl-panel fkl-coop-lobby"><div class="fkl-coop-emblem">🤝</div><small class="fkl-kicker">TEAM-ARENA</small><h2>Gemeinsam gegen endlose Bot-Wellen</h2><p>Die Bots greifen immer den nächsten lebenden Spieler an. Friendly Fire ist deaktiviert: Spieler, Begleiter und Reittiere können dem Mitspieler und dessen Team keinen Schaden zufügen. Wird ein Spieler durch Bots K.O., kämpft der andere weiter.</p><label class="fkl-coop-wave-select"><span>Gewünschte Startwelle</span><select data-fkl-coop-start-wave>${waveCheckpointOptions(data.selectedStartWave,data.unlockedWaveStart)}</select><small>Deine Freischaltung: bis Welle ${data.unlockedWaveStart}</small></label><div class="fkl-coop-rules"><span>👥 2 Spieler</span><span>🤖 Gemeinsame Bots</span><span>🛡️ Team-Schutz aktiv</span><span>🏁 Gemeinsamer Startpunkt</span></div><button class="fkl-btn gold" type="button" data-fkl-find-coop>Mitspieler suchen</button><button class="fkl-btn" type="button" data-fkl-cancel-coop hidden>Suche abbrechen</button><div class="fkl-online-state" data-fkl-coop-status>Firebase ist bereit für die Suche.</div></section></div>`;
    bindPageHome();
    UI.main.querySelector("[data-fkl-coop-start-wave]")?.addEventListener("change",event=>{data.selectedStartWave=normalizeWaveCheckpoint(event.currentTarget.value,data.unlockedWaveStart);safeSave();});
    UI.main.querySelector("[data-fkl-find-coop]")?.addEventListener("click",joinWaveCoop);UI.main.querySelector("[data-fkl-cancel-coop]")?.addEventListener("click",()=>stopCoopWaiting(true));
  }
  async function joinWaveCoop(){
    const status=UI.main?.querySelector("[data-fkl-coop-status]"),find=UI.main?.querySelector("[data-fkl-find-coop]"),cancel=UI.main?.querySelector("[data-fkl-cancel-coop]");
    if(status)status.textContent="Firebase wird verbunden …";if(find)find.disabled=true;
    try{
      const data=ensureState(),selectedNode=UI.main?.querySelector("[data-fkl-coop-start-wave]");
      data.selectedStartWave=normalizeWaveCheckpoint(selectedNode?.value||data.selectedStartWave,data.unlockedWaveStart);safeSave();
      const{fb,user}=await loadCoopFirebase(),profile=coopProfile(),lobbyRef=fb.doc(fb.db,...COOP_LOBBY_PATH),ownInvite=fb.doc(fb.db,COOP_INVITE_COLLECTION,user.uid);
      await fb.deleteDoc(ownInvite).catch(()=>{});
      const matchRef=fb.doc(fb.collection(fb.db,COOP_MATCH_COLLECTION));
      const result=await fb.runTransaction(fb.db,async transaction=>{
        const lobby=await transaction.get(lobbyRef),data=lobby.exists()?lobby.data():null,valid=!!(data?.waitingUid&&data.waitingUid!==user.uid);
        if(valid){
          const hostLimit=normalizeWaveCheckpoint(data.profile?.unlockedWaveStart||1,MAX_WAVE_CHECKPOINT),guestLimit=normalizeWaveCheckpoint(profile.unlockedWaveStart||1,MAX_WAVE_CHECKPOINT);
          const hostRequest=normalizeWaveCheckpoint(data.profile?.selectedStartWave||1,hostLimit),guestRequest=normalizeWaveCheckpoint(profile.selectedStartWave||1,guestLimit);
          const startWave=Math.min(hostRequest,guestRequest,hostLimit,guestLimit);
          const match={id:matchRef.id,status:"playing",hostUid:data.waitingUid,guestUid:user.uid,participantUids:[data.waitingUid,user.uid],hostProfile:data.profile,guestProfile:profile,startWave,hostReady:false,guestReady:true,handshakeVersion:2,createdAtMs:Date.now(),updatedAtMs:Date.now(),wave:startWave,snapshot:null};
          transaction.set(matchRef,match);transaction.set(fb.doc(fb.db,COOP_INVITE_COLLECTION,data.waitingUid),{matchId:matchRef.id,guestUid:user.uid,createdAtMs:Date.now()});transaction.delete(lobbyRef);return{matched:true,match};
        }
        transaction.set(lobbyRef,{waitingUid:user.uid,profile,queueVersion:2,createdAtMs:Date.now()});return{matched:false};
      });
      if(result.matched){
        if(status)status.textContent="Mitspieler gefunden · warte auf Bestätigung des Hosts …";
        if(cancel)cancel.hidden=true;
        try{const readyMatch=await waitForCoopHostReady(result.match,fb,user);if(status)status.textContent="Host bestätigt · Arena startet …";startCoopArena(readyMatch,fb,user);}
        catch(handshakeError){if(status)status.textContent=`Beitritt fehlgeschlagen: ${handshakeError.message||handshakeError}`;if(find)find.disabled=false;if(cancel)cancel.hidden=true;}
        return;
      }
      UI.coopWaiting={fb,user,lobbyRef,inviteRef:ownInvite};if(status)status.textContent="Warteschlange aktiv · Mitspieler wird gesucht …";if(cancel)cancel.hidden=false;pollCoopInvite();
    }catch(error){if(status)status.textContent=`KOOP nicht verfügbar: ${error.message||error}`;if(find)find.disabled=false;}
  }
  async function pollCoopInvite(){
    const waiting=UI.coopWaiting;if(!waiting)return;
    try{
      const snap=await waiting.fb.getDoc(waiting.inviteRef);
      if(snap.exists()){
        const matchId=snap.data()?.matchId,matchRef=matchId?waiting.fb.doc(waiting.fb.db,COOP_MATCH_COLLECTION,matchId):null,matchSnap=matchRef?await waiting.fb.getDoc(matchRef):null;
        if(matchSnap?.exists()){
          const match=matchSnap.data();
          if(match.hostUid!==waiting.user.uid)throw new Error("Die Einladung gehört nicht zu dieser Host-Lobby.");
          await waiting.fb.setDoc(matchRef,{hostReady:true,hostReadyAtMs:Date.now(),updatedAtMs:Date.now()},{merge:true});
          await waiting.fb.deleteDoc(waiting.inviteRef).catch(()=>{});
          stopCoopWaiting(false);startCoopArena({...match,hostReady:true,id:matchId},waiting.fb,waiting.user);return;
        }
      }
    }catch(error){const status=UI.main?.querySelector("[data-fkl-coop-status]");if(status)status.textContent=`Lobby-Prüfung: ${error?.message||error}`;}
    UI.coopPollTimer=setTimeout(pollCoopInvite,700);
  }
  async function stopCoopWaiting(removeLobby=true){
    clearTimeout(UI.coopPollTimer);UI.coopPollTimer=0;const waiting=UI.coopWaiting;UI.coopWaiting=null;if(!waiting)return;
    if(removeLobby)try{await waiting.fb.runTransaction(waiting.fb.db,async transaction=>{const snap=await transaction.get(waiting.lobbyRef);if(snap.exists()&&snap.data()?.waitingUid===waiting.user.uid)transaction.delete(waiting.lobbyRef);});}catch{}
    const status=UI.main?.querySelector("[data-fkl-coop-status]"),find=UI.main?.querySelector("[data-fkl-find-coop]"),cancel=UI.main?.querySelector("[data-fkl-cancel-coop]");if(status)status.textContent="Suche beendet.";if(find)find.disabled=false;if(cancel)cancel.hidden=true;
  }
  function startCoopArena(match,fb,user){
    const startAt=normalizeWaveCheckpoint(match.startWave||match.wave||1,MAX_WAVE_CHECKPOINT);
    stopCoopWaiting(false);startCombat(startAt);const s=UI.session;if(!s)return;
    const role=match.hostUid===user.uid?"host":"guest",localProfile=role==="host"?match.hostProfile:match.guestProfile,remoteProfile=role==="host"?match.guestProfile:match.hostProfile;
    const local=s.player;local.coopName=String(localProfile?.name||playerName());local.x=WORLD_W/2+(role==="host"?-130:130);local.y=WORLD_H/2;local.hp=local.maxHp;local.shield=local.maxShield;local.spawnProtection=4;
    const remote=buildCoopPlayer(remoteProfile,WORLD_W/2+(role==="host"?130:-130),WORLD_H/2);remote.spawnProtection=4;
    s.coop={role,matchId:match.id||match.matchId,fb,user,local,remote,remoteInput:null,remoteInputSeq:-1,remoteLastSeenAt:performance.now(),remoteConnectionWarned:false,inputSeq:0,specialSeq:0,careCompanionSeq:0,careMountSeq:0,lastInputWrite:0,lastSnapshotWrite:0,snapshotPending:false,lastSnapshotAt:0,lastSnapshotSeq:-1,frameSeq:0,ended:false,connected:true,matchRef:fb.doc(fb.db,COOP_MATCH_COLLECTION,match.id||match.matchId)};
    s.player=local;s.camera.x=(local.x+remote.x)/2;s.camera.y=local.y-80;s.wave=startAt;
    if(role==="guest"){s.spawnQueue=[];s.enemies=[];s.projectiles=[];s.enemyProjectiles=[];s.pickups=[];s.waveStarted=false;s.waveClearAt=0;s.boss=null;}
    const stage=UI.main?.querySelector(".fkl-stage");stage?.insertAdjacentHTML("beforeend",`<div class="fkl-coop-team" data-fkl-coop-team><div class="local"><small>${escapeHtml(local.coopName)}</small><div><i data-fkl-coop-local-bar></i></div><b data-fkl-coop-local-hp></b></div><span>🛡️ KOOP · TEAM-SCHUTZ</span><div class="remote"><small>${escapeHtml(remote.coopName)}</small><div><i data-fkl-coop-remote-bar></i></div><b data-fkl-coop-remote-hp></b></div></div><button class="fkl-coop-leave" type="button" data-fkl-coop-leave>KOOP verlassen</button>`);UI.main?.querySelector("[data-fkl-coop-leave]")?.addEventListener("click",leaveWaveCoop);
    setupCoopNetwork();showCombatMessage(role==="host"?"KOOP GESTARTET · TEAM-SCHUTZ AKTIV":"KOOP VERBUNDEN · TEAM-SCHUTZ AKTIV");updateHud();
  }
  function setupCoopNetwork(){
    const s=UI.session,c=s?.coop;if(!c)return;const fb=c.fb,selfRef=fb.doc(fb.db,COOP_MATCH_COLLECTION,c.matchId,"players",c.user.uid);c.selfRef=selfRef;c.inputRefs=Array.from({length:16},(_,index)=>fb.doc(fb.db,COOP_MATCH_COLLECTION,c.matchId,"players",c.user.uid,"inputs",String(index)));
    fb.setDoc(selfRef,{uid:c.user.uid,name:c.local.coopName,left:false,updatedAtMs:Date.now()},{merge:true}).catch(()=>{});
    if(c.role==="host"){
      const participantSnapPromise=fb.getDoc(c.matchRef);
      participantSnapPromise.then(matchSnap=>{if(!UI.session?.coop||!matchSnap.exists())return;const data=matchSnap.data(),uidValue=data.hostUid===c.user.uid?data.guestUid:data.hostUid;c.remoteUid=uidValue;const remoteRef=fb.doc(fb.db,COOP_MATCH_COLLECTION,c.matchId,"players",uidValue);UI.coopUnsubs.push(fb.onSnapshot(remoteRef,snap=>{if(!UI.session?.coop||!snap.exists())return;c.remoteLastSeenAt=performance.now();const presence=snap.data();if(presence.left)c.remoteInput={...(c.remoteInput||{}),left:true,seq:Number(c.remoteInput?.seq||0)+1};}));const inputRefs=Array.from({length:16},(_,index)=>fb.doc(fb.db,COOP_MATCH_COLLECTION,c.matchId,"players",uidValue,"inputs",String(index)));for(const inputRef of inputRefs)UI.coopUnsubs.push(fb.onSnapshot(inputRef,snap=>{if(!UI.session?.coop||!snap.exists())return;const input=snap.data(),seq=Number(input.seq||0);if(seq>Number(c.remoteInputSeq||-1)){c.remoteInputSeq=seq;c.remoteInput=input;c.remoteLastSeenAt=performance.now();}}));});
      UI.coopUnsubs.push(fb.onSnapshot(c.matchRef,snap=>{if(!snap.exists()||!UI.session?.coop)return;const data=snap.data();if(data.status==="ended"&&!c.ended)finishCoopGuest(data.finishReason||"KOOP wurde beendet.");}));
    }else{
      UI.coopUnsubs.push(fb.onSnapshot(c.matchRef,snap=>{if(!snap.exists()||!UI.session?.coop)return;const data=snap.data();if(data.status==="ended")finishCoopGuest(data.finishReason||"Der KOOP-Lauf wurde beendet.");}));
      c.frameRefs=Array.from({length:8},(_,index)=>fb.doc(fb.db,COOP_MATCH_COLLECTION,c.matchId,"frames",String(index)));
      for(const frameRef of c.frameRefs)UI.coopUnsubs.push(fb.onSnapshot(frameRef,snap=>{if(!snap.exists()||!UI.session?.coop)return;applyCoopSnapshot({status:"playing",snapshot:snap.data()?.snapshot});}));
    }
  }
  function updateCoopGuest(dt,now){
    const s=UI.session,c=s?.coop,p=c?.local;if(!s||!c||!p)return;
    if(p.hp>0){let mx=0,my=0;if(UI.keys.KeyW||UI.keys.ArrowUp)my-=1;if(UI.keys.KeyS||UI.keys.ArrowDown)my+=1;if(UI.keys.KeyA||UI.keys.ArrowLeft)mx-=1;if(UI.keys.KeyD||UI.keys.ArrowRight)mx+=1;mx+=s.joystick.x;my+=s.joystick.y;const len=Math.hypot(mx,my);if(len>1){mx/=len;my/=len;}p.speed=p.baseSpeed*(1+(p.mountActive?p.mountSpeedPct:0)/100);p.vx=mx*p.speed;p.vy=my*p.speed;p.moving=Math.hypot(mx,my)>.08;p.x=clamp(p.x+p.vx*dt,p.radius,WORLD_W-p.radius);p.y=clamp(p.y+p.vy*dt,p.radius,WORLD_H-p.radius);const target=nearestEnemy(p.x,p.y,p.weapon.range||1600);if(target)p.angle=Math.atan2(target.y-p.y,target.x-p.x);else if(Number.isFinite(UI.pointer.aimX))p.angle=Math.atan2(UI.pointer.aimY-p.y,UI.pointer.aimX-p.x);if(p.moving){p.lookX=mx;p.lookY=my;}else{p.lookX=Math.cos(p.angle);p.lookY=Math.sin(p.angle);}}
    if(c.remoteTarget){const r=c.remote,alpha=1-Math.pow(.0008,dt);r.x+=(c.remoteTarget.x-r.x)*alpha;r.y+=(c.remoteTarget.y-r.y)*alpha;r.angle=lerpCoopAngle(r.angle,c.remoteTarget.angle,alpha);r.moving=!!c.remoteTarget.moving;}
    const worldAlpha=1-Math.pow(.0003,dt);for(const enemy of s.enemies){if(Number.isFinite(enemy.targetX)){enemy.x+=(enemy.targetX-enemy.x)*worldAlpha;enemy.y+=(enemy.targetY-enemy.y)*worldAlpha;enemy.angle=lerpCoopAngle(Number(enemy.angle||0),Number(enemy.targetAngle ?? enemy.angle ?? 0),worldAlpha);}}for(const bullet of s.projectiles){bullet.x+=Number(bullet.vx||0)*dt;bullet.y+=Number(bullet.vy||0)*dt;bullet.life-=dt;}for(const bullet of s.enemyProjectiles){bullet.x+=Number(bullet.vx||0)*dt;bullet.y+=Number(bullet.vy||0)*dt;bullet.life-=dt;}s.projectiles=s.projectiles.filter(b=>b.life>0);s.enemyProjectiles=s.enemyProjectiles.filter(b=>b.life>0);
    const cameraTarget=p.hp>0?p:c.remote,cameraSpeed=1-Math.pow(.001,dt);s.camera.x+=(cameraTarget.x-s.camera.x)*cameraSpeed;s.camera.y+=((cameraTarget.y-s.viewH*.12)-s.camera.y)*cameraSpeed;
    sendCoopInput(now);updateHud();
  }
  function sendCoopInput(now=performance.now()){
    const s=UI.session,c=s?.coop,p=c?.local;if(!c||c.role!=="guest"||c.writePending||now-c.lastInputWrite<COOP_INPUT_INTERVAL)return;c.lastInputWrite=now;c.writePending=true;
    const target=nearestEnemy(p.x,p.y,p.weapon.range||1600),fire=!!(p.hp>0&&target&&(s.autoFire||UI.pointer.fire||UI.keys.Space));
    c.inputFrameIndex=(Number(c.inputFrameIndex||0)+1)%c.inputRefs.length;const inputRef=c.inputRefs[c.inputFrameIndex];
    c.fb.setDoc(inputRef,{x:Number(p.x.toFixed(2)),y:Number(p.y.toFixed(2)),angle:Number(p.angle.toFixed(4)),moving:!!p.moving,fire,activeWeaponSlot:p.activeWeaponSlot,seq:++c.inputSeq,specialSeq:c.specialSeq,careCompanionSeq:c.careCompanionSeq,careMountSeq:c.careMountSeq,updatedAtMs:Date.now()},{merge:false}).catch(()=>{}).finally(()=>{if(UI.session?.coop)c.writePending=false;});
  }
  function lerpCoopAngle(from,to,amount){let delta=(to-from+Math.PI)%(Math.PI*2)-Math.PI;if(delta< -Math.PI)delta+=Math.PI*2;return from+delta*amount;}
  function updateCoopRemotePlayer(dt,now){
    const s=UI.session,c=s?.coop,p=c?.remote,input=c?.remoteInput;if(!c||!p)return;
    if(p.companionCare)p.companionCare.timer=Math.max(0,p.companionCare.timer-dt);if(p.mountCare)p.mountCare.timer=Math.max(0,p.mountCare.timer-dt);
    p.fireCooldown=Math.max(0,p.fireCooldown-dt);if(p.reloading){p.reloadTimer-=dt;if(p.reloadTimer<=0){p.reloading=false;p.ammo=Math.max(1,Math.round(p.weapon.magazine||1));}}
    if(!input)return;if(input.left&&p.hp>0){p.hp=0;p.moving=false;showCombatMessage(`${p.coopName} HAT DEN KOOP VERLASSEN · DU KÄMPFST WEITER`);return;}if(p.hp<=0){p.moving=false;p.vx=0;p.vy=0;return;}const silence=performance.now()-Number(c.remoteLastSeenAt||performance.now());c.connected=silence<12000;if(!c.connected){p.moving=false;p.vx=0;p.vy=0;if(!c.remoteConnectionWarned){c.remoteConnectionWarned=true;showCombatMessage(`${p.coopName} VERBINDUNG LANGSAM · SPIELER WIRD NICHT AUTOMATISCH GETÖTET`);}return;}if(c.remoteConnectionWarned){c.remoteConnectionWarned=false;showCombatMessage(`${p.coopName} WIEDER VERBUNDEN`);}
    const maxStep=Math.max(35,p.speed*dt*1.7),dx=Number(input.x||p.x)-p.x,dy=Number(input.y||p.y)-p.y,d=Math.hypot(dx,dy);if(d>0){const step=Math.min(d,maxStep);p.x+=dx/d*step;p.y+=dy/d*step;}p.angle=lerpCoopAngle(p.angle,Number(input.angle||p.angle),Math.min(1,dt*15));p.moving=!!input.moving;p.lookX=p.moving?Math.cos(p.angle):Math.cos(p.angle);p.lookY=p.moving?Math.sin(p.angle):Math.sin(p.angle);
    if(input.activeWeaponSlot&&input.activeWeaponSlot!==p.activeWeaponSlot)coopSwitchRemoteWeapon(p,input.activeWeaponSlot);
    if(Number(input.specialSeq||0)>Number(c.lastRemoteSpecialSeq||0)){c.lastRemoteSpecialSeq=Number(input.specialSeq||0);withSessionPlayer(p,()=>triggerSpecial());}
    if(Number(input.careCompanionSeq||0)>Number(c.lastRemoteCompCareSeq||0)){c.lastRemoteCompCareSeq=Number(input.careCompanionSeq||0);withSessionPlayer(p,()=>useCompanionCare());}
    if(Number(input.careMountSeq||0)>Number(c.lastRemoteMountCareSeq||0)){c.lastRemoteMountCareSeq=Number(input.careMountSeq||0);withSessionPlayer(p,()=>useMountCare());}
    if(input.fire&&p.hp>0){const target=nearestEnemy(p.x,p.y,p.weapon.range||1600);if(target)coopRemoteAttack(p,target);}
  }
  function coopSwitchRemoteWeapon(player,slot){const runtime=player.weaponRuntimes?.[slot];if(!runtime)return;player.activeWeaponSlot=slot;player.weaponItem=runtime.item;player.weapon=runtime.stats;player.ammo=runtime.ammo;player.reloading=runtime.reloading;player.reloadTimer=runtime.reloadTimer;player.specialType=runtime.stats.special||"";}
  function coopRemoteAttack(player,target){
    const s=UI.session,w=player.weapon;if(player.fireCooldown>0||player.reloading)return;if(w.attack!=="melee"&&player.ammo<=0){player.reloading=true;player.reloadTimer=Math.max(.35,w.reload||1.5);return;}const rate=Math.max(.15,Number(w.fireRate)||1);player.fireCooldown=1/rate;player.attackAnim=Math.min(.3,1/rate);player.angle=Math.atan2(target.y-player.y,target.x-player.x);
    if(w.attack==="melee"){const range=w.range||80,arc=w.arc||1.6;for(const enemy of [...s.enemies]){const dx=enemy.x-player.x,dy=enemy.y-player.y,d=Math.hypot(dx,dy);if(d>range+enemy.radius)continue;const diff=Math.atan2(Math.sin(Math.atan2(dy,dx)-player.angle),Math.cos(Math.atan2(dy,dx)-player.angle));if(Math.abs(diff)>arc/2)continue;const crit=Math.random()<player.crit;damageEnemyForPlayer(player,enemy,w.damage*player.damageMult*(crit?player.critDamage:1),crit,w.splash||0);}applyCoopFriendlyMeleeHit(player,w,range,arc);s.particles.push({type:"slash",x:player.x,y:player.y,angle:player.angle,radius:range,life:.24,maxLife:.24,color:RARITIES[w.rarity]?.color||"#fff"});}
    else{player.ammo-=1;const count=w.attack==="shotgun"?Math.max(1,Math.round(w.pellets||7)):1;for(let i=0;i<count;i++){const angle=player.angle+(w.spread||0)*rand(-1,1),crit=Math.random()<player.crit;s.projectiles.push({x:player.x+Math.cos(angle)*28,y:player.y+Math.sin(angle)*28,vx:Math.cos(angle)*(w.attack==="shotgun"?760:940),vy:Math.sin(angle)*(w.attack==="shotgun"?760:940),radius:rarityIndex(w.rarity)>=5?5:3,damage:w.damage*player.damageMult*(crit?player.critDamage:1),life:(w.range||620)/900,color:crit?"#ffe05a":RARITIES[w.rarity]?.color||"#fff",crit,pierce:Math.max(0,Math.round(w.pierce||0)),splash:Number(w.splash||0),ownerKey:"remote",hit:new Set()});}if(player.ammo<=0){player.reloading=true;player.reloadTimer=Math.max(.35,w.reload||1.5);}}
  }
  function serializeCoopPlayer(player){return cleanCoopData({x:player.x,y:player.y,angle:player.angle,moving:player.moving,hp:player.hp,maxHp:player.maxHp,shield:player.shield,maxShield:player.maxShield,activeWeaponSlot:player.activeWeaponSlot,ammo:player.ammo,reloading:player.reloading,specialCharge:player.specialCharge,specialReady:player.specialReady,companionCareTimer:player.companionCare?.timer||0,mountCareTimer:player.mountCare?.timer||0,mountActive:player.mountActive,mountArmor:player.mountArmor,mountMaxArmor:player.mountMaxArmor,companion:player.companion?{x:player.companion.x,y:player.companion.y,angle:player.companion.angle,moving:player.companion.moving,hp:player.companion.hp,maxHp:player.companion.maxHp,dead:player.companion.dead,attackAnim:player.companion.attackAnim}:null});}
  function writeCoopSnapshot(now=performance.now()){
    const s=UI.session,c=s?.coop;if(!c||c.role!=="host"||c.snapshotPending||now-c.lastSnapshotWrite<COOP_SNAPSHOT_INTERVAL)return;c.lastSnapshotWrite=now;c.snapshotPending=true;
    const snapshot=cleanCoopData({seq:++c.frameSeq,wave:s.wave,score:s.score,kills:s.kills,themeIndex:s.themeIndex,players:{host:serializeCoopPlayer(c.local),guest:serializeCoopPlayer(c.remote)},enemies:s.enemies,projectiles:s.projectiles.map(({hit,...rest})=>rest),enemyProjectiles:s.enemyProjectiles,pickups:s.pickups,bossId:s.boss?.id||"",updatedAtMs:Date.now()});
    c.frameRefs ||= Array.from({length:8},(_,index)=>c.fb.doc(c.fb.db,COOP_MATCH_COLLECTION,c.matchId,"frames",String(index)));
    c.frameIndex=(Number(c.frameIndex||0)+1)%c.frameRefs.length;
    c.fb.setDoc(c.frameRefs[c.frameIndex],{snapshot,updatedAtMs:Date.now()},{merge:false}).catch(()=>{}).finally(()=>{if(UI.session?.coop)c.snapshotPending=false;});
  }
  function applyCoopSnapshot(data){
    const s=UI.session,c=s?.coop,snap=data?.snapshot;if(!s||!c)return;if(data.status==="ended"){finishCoopGuest(data.finishReason||"Der KOOP-Lauf wurde beendet.");return;}const snapshotSeq=coopFinite(snap?.seq,-1);if(!snap||snapshotSeq<=Number(c.lastSnapshotSeq||-1))return;c.lastSnapshotSeq=snapshotSeq;c.lastSnapshotAt=performance.now();s.wave=coopFinite(snap.wave,s.wave);s.score=coopFinite(snap.score,s.score);s.kills=coopFinite(snap.kills,s.kills);s.themeIndex=coopFinite(snap.themeIndex,s.themeIndex);s.theme=ARENA_THEMES[s.themeIndex%ARENA_THEMES.length]||ARENA_THEMES[0];
    const oldEnemies=new Map(s.enemies.map(enemy=>[enemy.id,enemy]));s.enemies=(snap.enemies||[]).map(raw=>{const old=oldEnemies.get(raw.id);return old?{...raw,x:old.x,y:old.y,angle:old.angle,targetX:Number(raw.x),targetY:Number(raw.y),targetAngle:Number(raw.angle||0)}:{...raw,targetX:Number(raw.x),targetY:Number(raw.y),targetAngle:Number(raw.angle||0)};});s.projectiles=(snap.projectiles||[]).map(raw=>({...raw,hit:new Set()}));s.enemyProjectiles=(snap.enemyProjectiles||[]).map(raw=>({...raw}));s.pickups=(snap.pickups||[]).map(raw=>({...raw}));s.boss=s.enemies.find(enemy=>enemy.id===snap.bossId)||null;
    const own=snap.players?.guest,host=snap.players?.host;if(own){if(coopHas(own,"maxHp"))c.local.maxHp=Math.max(1,coopFinite(own.maxHp,c.local.maxHp));if(coopHas(own,"hp"))c.local.hp=clamp(coopFinite(own.hp,c.local.hp),0,c.local.maxHp);if(coopHas(own,"maxShield"))c.local.maxShield=Math.max(0,coopFinite(own.maxShield,c.local.maxShield));if(coopHas(own,"shield"))c.local.shield=clamp(coopFinite(own.shield,c.local.shield),0,c.local.maxShield);c.local.activeWeaponSlot=own.activeWeaponSlot||c.local.activeWeaponSlot;coopSwitchRemoteWeapon(c.local,c.local.activeWeaponSlot);c.local.ammo=coopFinite(own.ammo,c.local.ammo);c.local.reloading=!!own.reloading;c.local.specialCharge=coopFinite(own.specialCharge,c.local.specialCharge);c.local.specialReady=!!own.specialReady;if(c.local.companionCare)c.local.companionCare.timer=coopFinite(own.companionCareTimer,c.local.companionCare.timer);if(c.local.mountCare)c.local.mountCare.timer=coopFinite(own.mountCareTimer,c.local.mountCare.timer);if(coopHas(own,"mountActive"))c.local.mountActive=!!own.mountActive;if(coopHas(own,"mountArmor"))c.local.mountArmor=Math.max(0,coopFinite(own.mountArmor,c.local.mountArmor));if(c.local.companion&&own.companion){Object.assign(c.local.companion,own.companion);}}
    if(host){c.remoteTarget={x:Number(host.x||c.remote.x),y:Number(host.y||c.remote.y),angle:Number(host.angle||c.remote.angle),moving:!!host.moving};applyCoopPlayerState(c.remote,host);}
    updateHud();
  }
  function applyCoopPlayerState(player,state){if(!player||!state)return;if(coopHas(state,"maxHp"))player.maxHp=Math.max(1,coopFinite(state.maxHp,player.maxHp));if(coopHas(state,"hp"))player.hp=clamp(coopFinite(state.hp,player.hp),0,player.maxHp);if(coopHas(state,"maxShield"))player.maxShield=Math.max(0,coopFinite(state.maxShield,player.maxShield));if(coopHas(state,"shield"))player.shield=clamp(coopFinite(state.shield,player.shield),0,player.maxShield);player.activeWeaponSlot=state.activeWeaponSlot||player.activeWeaponSlot;coopSwitchRemoteWeapon(player,player.activeWeaponSlot);player.ammo=coopFinite(state.ammo,player.ammo);player.reloading=!!state.reloading;player.specialCharge=coopFinite(state.specialCharge,player.specialCharge);player.specialReady=!!state.specialReady;if(player.companionCare)player.companionCare.timer=coopFinite(state.companionCareTimer,player.companionCare.timer);if(player.mountCare)player.mountCare.timer=coopFinite(state.mountCareTimer,player.mountCare.timer);if(coopHas(state,"mountActive"))player.mountActive=!!state.mountActive;if(coopHas(state,"mountArmor"))player.mountArmor=Math.max(0,coopFinite(state.mountArmor,player.mountArmor));if(player.companion&&state.companion)Object.assign(player.companion,state.companion);}
  async function finishCoopHost(reason){const s=UI.session,c=s?.coop;if(!c||c.ended)return;c.ended=true;s.ended=true;cancelAnimationFrame(UI.raf);UI.raf=0;try{await c.fb.setDoc(c.matchRef,{status:"ended",finishReason:reason,finalWave:s.wave,updatedAtMs:Date.now()},{merge:true});}catch{}finishCoopRun(reason);}
  function finishCoopGuest(reason){const s=UI.session,c=s?.coop;if(!c||c.ended)return;c.ended=true;s.ended=true;cancelAnimationFrame(UI.raf);UI.raf=0;finishCoopRun(reason);}
  function finishCoopRun(reason){
    const s=UI.session,c=s?.coop;if(!s||!c)return;const activeWave=!!(s.enemies.length||s.spawnQueue.length),completedWave=Math.max(0,s.wave-(activeWave?1:0)),score=Math.floor(s.score||0),kills=Math.floor(s.kills||0),durationMs=Math.max(1000,performance.now()-s.startedAt),reward=Math.min(250000,Math.round(s.moneyEarned+completedWave*115+kills*7+score/900));
    const data=ensureState();data.runs+=1;data.totalKills+=kills;data.bestWave=Math.max(data.bestWave,completedWave);data.bestScore=Math.max(data.bestScore,score);addFightXp(Math.round(completedWave*40+kills*2));if(reward)awardMoney(reward,"Fight.KL Wellen-KOOP");safeSave();updateHead();
    stopCoopNetwork(false);s.resizeObserver?.disconnect?.();UI.shell?.classList.remove("combat-active");UI.session=null;UI.pointer.fire=false;
    const modal=showModal(`<div style="font-size:64px">🤝</div><small class="fkl-kicker">WELLEN-KOOP BEENDET</small><h3>Team-Lauf beendet</h3><p>${escapeHtml(reason)}</p><div class="fkl-summary-grid"><div><small>Geschaffte Wellen</small><b>${completedWave}</b></div><div><small>Team-Kills</small><b>${kills}</b></div><div><small>Team-Score</small><b>${NUMBER.format(score)}</b></div><div><small>Belohnung</small><b>${EURO.format(reward)}</b></div><div><small>Fight-Level</small><b>${data.level}</b></div><div><small>Dauer</small><b>${Math.floor(durationMs/60000)}:${String(Math.floor(durationMs/1000)%60).padStart(2,"0")}</b></div></div><div class="fkl-modal-actions"><button class="fkl-btn gold" type="button" data-fkl-coop-again>Noch einmal</button><button class="fkl-btn" type="button" data-fkl-summary-inventory>Inventar</button><button class="fkl-btn" type="button" data-fkl-coop-home>Hauptmenü</button></div>`);modal.querySelector("[data-fkl-coop-again]")?.addEventListener("click",()=>{modal.remove();renderCoopLobby();});modal.querySelector("[data-fkl-summary-inventory]")?.addEventListener("click",()=>{modal.remove();renderInventory();});modal.querySelector("[data-fkl-coop-home]")?.addEventListener("click",()=>{modal.remove();renderDashboard();});
  }
  function stopCoopNetwork(markLeft=true){
    clearTimeout(UI.coopPollTimer);UI.coopPollTimer=0;for(const unsub of UI.coopUnsubs.splice(0)){try{unsub();}catch{}}
    const c=UI.session?.coop;if(!c)return;if(markLeft&&!c.ended){if(c.role==="guest"&&c.selfRef)c.fb?.setDoc?.(c.selfRef,{left:true,fire:false,updatedAtMs:Date.now()},{merge:true}).catch(()=>{});else c.fb?.setDoc?.(c.matchRef,{status:"ended",finishReason:`${c.local?.coopName||"Der Host"} hat den KOOP beendet.`,updatedAtMs:Date.now()},{merge:true}).catch(()=>{});}
  }
  function leaveWaveCoop(){const c=UI.session?.coop;if(c&&!c.ended){if(c.role==="guest"&&c.selfRef)c.fb?.setDoc?.(c.selfRef,{left:true,fire:false,updatedAtMs:Date.now()},{merge:true}).catch(()=>{});else c.fb?.setDoc?.(c.matchRef,{status:"ended",finishReason:`${c.local?.coopName||"Der Host"} hat den KOOP beendet.`,updatedAtMs:Date.now()},{merge:true}).catch(()=>{});c.ended=true;}stopCoopNetwork(false);stopCombat(false);renderDashboard();}
  function updateCoopHud(){const s=UI.session,c=s?.coop;if(!c)return;const set=(sel,val)=>{const n=UI.main?.querySelector(sel);if(n)n.textContent=val},local=c.local,remote=c.remote;set("[data-fkl-coop-local-hp]",local.hp>0?`${Math.ceil(local.hp)}/${local.maxHp}`:"K.O.");set("[data-fkl-coop-remote-hp]",remote.hp>0?`${Math.ceil(remote.hp)}/${remote.maxHp}`:"K.O.");const lb=UI.main?.querySelector("[data-fkl-coop-local-bar]"),rb=UI.main?.querySelector("[data-fkl-coop-remote-bar]");if(lb)lb.style.width=`${clamp(local.hp/local.maxHp*100,0,100)}%`;if(rb)rb.style.width=`${clamp(remote.hp/remote.maxHp*100,0,100)}%`;}

  function adminSelectedInventoryItem() {
    const data=ensureState();
    const item=data.inventory.find(entry=>entry.uid===data.staffTools.selectedInventoryUid)||["primary","sidearm","melee","armor","companion","mount"].map(equipped).find(Boolean)||data.inventory[0]||null;
    if(item&&data.staffTools.selectedInventoryUid!==item.uid)data.staffTools.selectedInventoryUid=item.uid;
    return item;
  }

  function adminCharacterCardHtml() {
    const data=ensureState(),style=STYLE_MAP.get(data.cosmetics.active)||CHARACTER_STYLES[0],stats=aggregateLoadoutStats(),comp=equipped("companion"),bonus=companionOwnerBonuses(comp);
    return `<article class="fkl-panel fkl-mod-character" style="--body:${style.body};--accent:${style.accent};--trim:${style.trim}"><small class="fkl-kicker">LIVE-CHARAKTER</small><h2>${escapeHtml(playerName())}</h2><div class="fkl-mod-character-stage"><div class="fkl-character-aura"></div>${characterPreviewHtml(style,true)}${comp?`<div class="fkl-mod-pet"><span>${itemDef(comp).icon}</span><b>${escapeHtml(itemDef(comp).name)}</b><small>+${bonus.damage}% Schaden · +${bonus.defense}% Verteidigung</small></div>`:""}</div><div class="fkl-mod-stat-row"><span>Power <b>${NUMBER.format(stats.power)}</b></span><span>Leben <b>${NUMBER.format(stats.health)}</b></span><span>Tempo <b>+${stats.speed}%</b></span></div></article>`;
  }

  function renderFightAdminMenu() {
    if(!UI.main||!canUseStaffModMenu())return toast("Kein Zugriff","Nur Admin und Owner dürfen dieses Mod-Menü öffnen.");
    stopCombat(false);stopDuel(false);
    const data=ensureState(),tools=data.staffTools,selected=adminSelectedInventoryItem(),selectedDef=selected?itemDef(selected):null;
    if(selected&&!tools.selectedInventoryUid)tools.selectedInventoryUid=selected.uid;
    const equippedCards=EQUIPMENT_SLOT_KEYS.map(slot=>{const item=equipped(slot),def=item?itemDef(item):null;return `<button class="fkl-mod-equip ${selected?.uid===item?.uid?"active":""}" type="button" data-fkl-mod-select="${item?.uid||""}" ${item?"":"disabled"}><span>${def?.icon||SLOT_META[slot].icon}</span><small>${escapeHtml(SLOT_META[slot].name)}</small><b>${escapeHtml(def?.name||"Leer")}</b>${item?`<em>${rarityDef(item).name} · ${starText(item.star)}</em>`:""}</button>`}).join("");
    const catalog=ITEMS.slice().sort((a,b)=>a.category.localeCompare(b.category)||rarityIndex(a.rarity)-rarityIndex(b.rarity)||a.name.localeCompare(b.name,"de"));
    const rarityOptions=RARITY_ORDER.map(id=>`<option value="${id}" ${tools.grantRarity===id?"selected":""}>${RARITIES[id].name}</option>`).join("");
    const selectedRarity=selected?rarityKey(selected):"common";
    const inventorySelect=data.inventory.map(item=>{const def=itemDef(item);return `<option value="${item.uid}" ${selected?.uid===item.uid?"selected":""}>${def.icon} ${escapeHtml(def.name)} · ${rarityDef(item).name} · ${starText(item.star)}</option>`}).join("");
    const unlockOptions=waveCheckpointValues(MAX_WAVE_CHECKPOINT).map(wave=>`<option value="${wave}" ${data.unlockedWaveStart===wave?"selected":""}>${wave===1?"Nur Welle 1":`Bis Welle ${wave}`}</option>`).join("");
    const activeWaveOptions=waveCheckpointOptions(data.selectedStartWave,data.unlockedWaveStart);
    UI.main.innerHTML=`<div class="fkl-page fkl-mod-page">${pageHeader("Admin / Owner Mod-Menü","Direkte Fight.KL-Verwaltung. Dieser Bereich wird ausschließlich bei aktiver Admin- oder Owner-Rolle angezeigt.",`<button class="fkl-btn" type="button" data-fkl-mod-inventory>🎒 Inventar</button>`)}<div class="fkl-mod-layout">${adminCharacterCardHtml()}<section class="fkl-panel fkl-mod-tools"><div class="fkl-mod-title"><div><small class="fkl-kicker">KAMPF-CHEATS</small><h3>Ingame-Einstellungen</h3></div><b>${staffRoleLabel()}</b></div><div class="fkl-mod-toggle-row"><button class="fkl-mod-toggle ${tools.godMode?"active":""}" type="button" data-fkl-mod-god><span>♾</span><div><b>God Mode</b><small>${tools.godMode?"Aktiv · unendlich Leben":"Aus"}</small></div></button></div><div class="fkl-mod-control-grid"><label><span>Schaden</span><select data-fkl-mod-setting="damageMultiplier">${[1,2,5,10,25,50,100].map(v=>`<option value="${v}" ${Number(tools.damageMultiplier)===v?"selected":""}>${v}×</option>`).join("")}</select></label><label><span>Speed</span><select data-fkl-mod-setting="speedMultiplier">${[1,1.5,2,3,5,8,10].map(v=>`<option value="${v}" ${Number(tools.speedMultiplier)===v?"selected":""}>${v}×</option>`).join("")}</select></label><label><span>Verteidigung</span><select data-fkl-mod-setting="defenseMultiplier">${[1,1.5,2,5,10,25,50,100].map(v=>`<option value="${v}" ${Number(tools.defenseMultiplier)===v?"selected":""}>${v}×</option>`).join("")}</select></label></div><small class="fkl-mod-note">Die Einstellungen gelten für die Bot-Arena. Online-Duelle bleiben serverseitig normal.</small></section><section class="fkl-panel fkl-mod-waves"><small class="fkl-kicker">WELLEN-STARTPUNKTE</small><h3>Startwellen verwalten</h3><div class="fkl-mod-control-grid"><label><span>Freigeschaltet</span><select data-fkl-mod-wave-unlock>${unlockOptions}</select></label><label><span>Aktive Startwelle</span><select data-fkl-mod-wave-active>${activeWaveOptions}</select></label></div><p>Spieler schalten regulär alle zehn Wellen einen neuen Startpunkt frei. Admin und Owner können diese Grenze hier direkt festlegen.</p></section><section class="fkl-panel fkl-mod-money"><small class="fkl-kicker">GELD</small><h3>Geld hinzufügen</h3><div class="fkl-mod-money-actions">${[10000,100000,1000000,10000000].map(v=>`<button type="button" data-fkl-mod-money="${v}">+${NUMBER.format(v)} €</button>`).join("")}</div><label class="fkl-mod-custom-money"><input type="number" min="1" step="1000" placeholder="Eigener Betrag" data-fkl-mod-money-input><button type="button" data-fkl-mod-money-custom>Hinzufügen</button></label><p>Aktuell: <b>${EURO.format(playerFunds())}</b></p></section><section class="fkl-panel fkl-mod-equipped"><small class="fkl-kicker">CHARAKTER-AUSRÜSTUNG</small><h3>Slot anklicken und bearbeiten</h3><div class="fkl-mod-equipped-grid">${equippedCards}</div></section><section class="fkl-panel fkl-mod-item-editor"><small class="fkl-kicker">ITEM-EDITOR</small><h3>Item direkt bearbeiten</h3>${data.inventory.length?`<label class="fkl-mod-inventory-picker"><span>Vorhandenes Item</span><select data-fkl-mod-inventory-select>${inventorySelect}</select></label>`:""}${selected?`<div class="fkl-mod-selected"><span>${selectedDef.icon}</span><div><b>${rarityDef(selected).name}</b><small>${starText(selected.star)} · ${itemMaxDurability(selected)?`${Math.round(selected.durability)}/${itemMaxDurability(selected)} Haltbarkeit`:"Ohne Haltbarkeit"}</small></div></div><div class="fkl-mod-control-grid"><label><span>Seltenheit</span><select data-fkl-mod-item-rarity>${RARITY_ORDER.map(id=>`<option value="${id}" ${selectedRarity===id?"selected":""}>${RARITIES[id].name}</option>`).join("")}</select></label><label><span>Sterne</span><select data-fkl-mod-item-star>${Array.from({length:MAX_STAR+1},(_,i)=>`<option value="${i}" ${Number(selected.star)===i?"selected":""}>${i===0?"Basis":`${i} Sterne`}</option>`).join("")}</select></label></div><div class="fkl-mod-item-actions"><button type="button" data-fkl-mod-item-repair>Max. Haltbarkeit</button><button type="button" data-fkl-mod-item-duplicate>Duplizieren</button></div>`:`<p>Dein Inventar ist leer. Über den Item-Geber kannst du direkt einen Gegenstand hinzufügen.</p>`}</section><section class="fkl-panel fkl-mod-grant"><small class="fkl-kicker">SHOP / ITEM-GEBER</small><h3>Beliebiges Item geben</h3><div class="fkl-mod-grant-grid"><label><span>Item</span><select data-fkl-mod-grant-item>${catalog.map(def=>`<option value="${def.id}" ${tools.selectedItemId===def.id?"selected":""}>${def.icon} ${escapeHtml(def.name)} · ${RARITIES[def.rarity].name}</option>`).join("")}</select></label><label><span>Seltenheit</span><select data-fkl-mod-grant-rarity>${rarityOptions}</select></label><label><span>Sterne</span><select data-fkl-mod-grant-star>${Array.from({length:MAX_STAR+1},(_,i)=>`<option value="${i}" ${Number(tools.grantStar)===i?"selected":""}>${i===0?"Basis":`${i} Sterne`}</option>`).join("")}</select></label><label><span>Anzahl</span><select data-fkl-mod-grant-quantity>${[1,2,5,10].map(v=>`<option value="${v}" ${Number(tools.grantQuantity)===v?"selected":""}>${v}</option>`).join("")}</select></label></div><button class="fkl-btn gold fkl-mod-grant-button" type="button" data-fkl-mod-grant>Item geben</button></section></div></div>`;
    bindPageHome();
    UI.main.querySelector("[data-fkl-mod-inventory]")?.addEventListener("click",renderInventory);
    UI.main.querySelector("[data-fkl-mod-god]")?.addEventListener("click",()=>{tools.godMode=!tools.godMode;safeSave();renderFightAdminMenu();});
    UI.main.querySelectorAll("[data-fkl-mod-setting]").forEach(select=>select.addEventListener("change",()=>{tools[select.dataset.fklModSetting]=Number(select.value)||1;safeSave();renderFightAdminMenu();}));
    UI.main.querySelector("[data-fkl-mod-wave-unlock]")?.addEventListener("change",event=>{data.unlockedWaveStart=normalizeWaveCheckpoint(event.currentTarget.value,MAX_WAVE_CHECKPOINT);data.selectedStartWave=normalizeWaveCheckpoint(data.selectedStartWave,data.unlockedWaveStart);safeSave();renderFightAdminMenu();});
    UI.main.querySelector("[data-fkl-mod-wave-active]")?.addEventListener("change",event=>{data.selectedStartWave=normalizeWaveCheckpoint(event.currentTarget.value,data.unlockedWaveStart);safeSave();renderFightAdminMenu();});
    UI.main.querySelector("[data-fkl-mod-inventory-select]")?.addEventListener("change",event=>{tools.selectedInventoryUid=event.currentTarget.value;safeSave();renderFightAdminMenu();});
    UI.main.querySelectorAll("[data-fkl-mod-money]").forEach(btn=>btn.addEventListener("click",()=>addFightAdminMoney(Number(btn.dataset.fklModMoney))));
    UI.main.querySelector("[data-fkl-mod-money-custom]")?.addEventListener("click",()=>addFightAdminMoney(Number(UI.main.querySelector("[data-fkl-mod-money-input]")?.value||0)));
    UI.main.querySelectorAll("[data-fkl-mod-select]").forEach(btn=>btn.addEventListener("click",()=>{if(btn.dataset.fklModSelect){tools.selectedInventoryUid=btn.dataset.fklModSelect;safeSave();renderFightAdminMenu();}}));
    UI.main.querySelector("[data-fkl-mod-item-rarity]")?.addEventListener("change",event=>setFightAdminItemRarity(selected?.uid,event.currentTarget.value));
    UI.main.querySelector("[data-fkl-mod-item-star]")?.addEventListener("change",event=>setFightAdminItemStar(selected?.uid,Number(event.currentTarget.value)));
    UI.main.querySelector("[data-fkl-mod-item-repair]")?.addEventListener("click",()=>fillFightAdminItemDurability(selected?.uid));
    UI.main.querySelector("[data-fkl-mod-item-duplicate]")?.addEventListener("click",()=>duplicateFightAdminItem(selected?.uid));
    const syncGrant=()=>{tools.selectedItemId=UI.main.querySelector("[data-fkl-mod-grant-item]")?.value||tools.selectedItemId;tools.grantRarity=UI.main.querySelector("[data-fkl-mod-grant-rarity]")?.value||tools.grantRarity;tools.grantStar=Number(UI.main.querySelector("[data-fkl-mod-grant-star]")?.value||0);tools.grantQuantity=Number(UI.main.querySelector("[data-fkl-mod-grant-quantity]")?.value||1);safeSave();};
    UI.main.querySelectorAll("[data-fkl-mod-grant-item],[data-fkl-mod-grant-rarity],[data-fkl-mod-grant-star],[data-fkl-mod-grant-quantity]").forEach(node=>node.addEventListener("change",syncGrant));
    UI.main.querySelector("[data-fkl-mod-grant]")?.addEventListener("click",()=>{syncGrant();grantFightAdminItems();});
  }

  function addFightAdminMoney(amount) {
    if(!canUseStaffModMenu())return toast("Kein Zugriff");
    const value=Math.max(0,Math.floor(Number(amount)||0));if(!value)return toast("Betrag fehlt");
    const appState=getAppState();if(!appState)return;
    appState.bank=Number(appState.bank||0)+value;safeFeed(`Fight.KL Mod-Menü: ${EURO.format(value)} hinzugefügt.`);safeSave();safeRender();toast("Geld hinzugefügt",EURO.format(value));renderFightAdminMenu();
  }
  function setFightAdminItemRarity(uidValue,rarity){if(!canUseStaffModMenu()||!RARITIES[rarity])return;const item=ensureState().inventory.find(entry=>entry.uid===uidValue);if(!item)return;item.rarity=rarity;item.durability=itemMaxDurability(item);safeSave();renderFightAdminMenu();}
  function setFightAdminItemStar(uidValue,star){if(!canUseStaffModMenu())return;const item=ensureState().inventory.find(entry=>entry.uid===uidValue);if(!item)return;item.star=clamp(Math.floor(Number(star)||0),0,MAX_STAR);item.durability=itemMaxDurability(item);safeSave();renderFightAdminMenu();}
  function fillFightAdminItemDurability(uidValue){if(!canUseStaffModMenu())return;const item=ensureState().inventory.find(entry=>entry.uid===uidValue);if(!item)return;item.durability=itemMaxDurability(item);safeSave();renderFightAdminMenu();}
  function duplicateFightAdminItem(uidValue){if(!canUseStaffModMenu())return;const data=ensureState(),item=data.inventory.find(entry=>entry.uid===uidValue);if(!item||data.inventory.length>=INVENTORY_LIMIT)return toast("Inventar voll");const copy=makeItem(item.baseId,item.star,null,rarityKey(item));data.inventory.unshift(copy);data.staffTools.selectedInventoryUid=copy.uid;safeSave();renderFightAdminMenu();}
  function grantFightAdminItems(){if(!canUseStaffModMenu())return;const data=ensureState(),tools=data.staffTools,def=ITEM_MAP.get(tools.selectedItemId);if(!def)return;const room=INVENTORY_LIMIT-data.inventory.length,quantity=Math.min(room,clamp(Math.floor(Number(tools.grantQuantity)||1),1,10));if(quantity<=0)return toast("Inventar voll");for(let i=0;i<quantity;i++)data.inventory.unshift(makeItem(def.id,tools.grantStar,null,tools.grantRarity));safeSave();updateHead();toast("Item gegeben",`${quantity}× ${def.name} · ${RARITIES[tools.grantRarity].name} · ${starText(tools.grantStar)}`);renderFightAdminMenu();}

  function close(returnPhone=false){stopCoopWaiting(true);stopCombat(false);stopDuel(false);window.removeEventListener("keydown",onKeyDown);window.removeEventListener("keyup",onKeyUp);UI.overlay?.remove();UI.overlay=null;UI.shell=null;UI.main=null;document.body.classList.remove("fight-kl-open");if(returnPhone)returnToTopGames();}
  function onKeyDown(event){if(!UI.overlay)return;UI.keys[event.code]=true;if(UI.duel){if(event.code==="Escape"){event.preventDefault();leaveOnlineDuel(false)}if(event.code==="Space"){event.preventDefault();sendDuelAction("attack")}if(event.code==="ShiftLeft"||event.code==="ShiftRight"){event.preventDefault();sendDuelAction("dodge")}if(event.code==="KeyE"||event.code==="KeyQ"){event.preventDefault();sendDuelAction("special")}return;}if(event.code==="Escape"){event.preventDefault();if(UI.session)pauseCombat();else returnToTopGames()}if(event.code==="KeyR"&&UI.session){event.preventDefault();beginReload()}if((event.code==="KeyE"||event.code==="KeyQ")&&UI.session){event.preventDefault();triggerSpecial()}if(UI.session&&["Digit1","Numpad1","Digit2","Numpad2","Digit3","Numpad3"].includes(event.code)){event.preventDefault();const n=event.code.includes("1")?0:event.code.includes("2")?1:2;switchCombatWeapon(WEAPON_SLOT_KEYS[n])}if(UI.session&&["Digit4","Numpad4"].includes(event.code)){event.preventDefault();useCompanionCare()}if(UI.session&&["Digit5","Numpad5"].includes(event.code)){event.preventDefault();useMountCare()}if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(event.code))event.preventDefault();}

  window.FightKL=Object.freeze({version:VERSION,open,close,returnToTopGames});
})();
