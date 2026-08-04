(() => {
  "use strict";

  const VERSION = "20260804-dungeon-kl-v181-four-item-values";
  const MAX_LEVEL = 100;
  const XP_REWARD_MULTIPLIER = 1.10;
  const MAX_CHARACTERS = 3;
  const MAX_INVENTORY = 900;
  const CANVAS_W = 1280;
  const CANVAS_H = 720;
  const WORLD_W = 1500;
  const WORLD_H = 900;
  const PARTY_COLLECTION = "dungeonKlParties";
  const AUCTION_COLLECTION = "dungeonKlAuctions";
  const NUMBER = new Intl.NumberFormat("de-DE");
  const GOLD = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
  const SKILL_BASE_COOLDOWNS = [7, 11, 13, 16, 30];
  const REVIVE_COOLDOWN = 45;
  const CHEST_INTERACT_RANGE = 92;
  const ENEMY_SIGHT_BASE = 260;
  const OUT_OF_COMBAT_DELAY = 10;
  const OUT_OF_COMBAT_REGEN = 0.08;
  const PROFESSION_MAX_LEVEL = 100;
  const PROFESSIONS = {
    herbalism:{name:"Kräuterkunde",icon:"🌿",description:"Sammelt Kräuter, Essenzen und braut Heil- sowie Stärkungstränke."},
    blacksmith:{name:"Schmied",icon:"⚒",description:"Verarbeitet Erz, Runen und Schmuck zu Waffen, Rüstung und Talismanen."},
    cooking:{name:"Koch",icon:"🍲",description:"Kocht Gruppenessen mit Leben, Rüstung, Stärke und zeitweiser Power."},
    companion:{name:"Begleiter",icon:"🐾",description:"Findet, fusioniert und trainiert Tank-, DD- und Heilbegleiter."}
  };
  const MATERIALS = {
    herb:{name:"Heilkraut",icon:"🌿"}, essence:{name:"Arkane Essenz",icon:"✦"}, ore:{name:"Dungeon-Erz",icon:"⛏"}, jewel:{name:"Runenschmuck",icon:"💎"},
    meat:{name:"Monsterfleisch",icon:"🥩"}, spice:{name:"Glutgewürz",icon:"🫙"}, bone:{name:"Bestienknochen",icon:"🦴"}, spirit:{name:"Tierseele",icon:"🐾"}
  };
  const PROFESSION_RECIPES = {
    herbalism:[
      {id:"minor_heal",name:"Trank der Erholung",icon:"🧪",level:1,cost:{herb:3,essence:1},type:"consumable",duration:0,buff:{healInstant:.45}},
      {id:"life_tonic",name:"Lebenselixier",icon:"💚",level:8,cost:{herb:6,essence:3},type:"consumable",duration:90,buff:{healthPct:.06}},
      {id:"power_tonic",name:"Essenz der Stärke",icon:"✨",level:18,cost:{herb:8,essence:5},type:"consumable",duration:60,buff:{damagePct:.04,healingPct:.04}}
    ],
    blacksmith:[
      {id:"forge_weapon",name:"Klassenwaffe schmieden",icon:"⚔",level:1,cost:{ore:5,jewel:2},type:"gear",slot:"weapon"},
      {id:"forge_armor",name:"Rüstung schmieden",icon:"🛡",level:6,cost:{ore:7,bone:2},type:"gear",slot:"chest"},
      {id:"forge_talisman",name:"Runentalisman herstellen",icon:"🔮",level:15,cost:{jewel:7,essence:4},type:"gear",slot:"amulet"}
    ],
    cooking:[
      {id:"stew",name:"Bestieneintopf",icon:"🍲",level:1,cost:{meat:4,spice:1},type:"consumable",duration:90,buff:{healthPct:.03}},
      {id:"armor_meal",name:"Wächtermahl",icon:"🍖",level:10,cost:{meat:7,bone:3,spice:2},type:"consumable",duration:90,buff:{armorPct:.03}},
      {id:"hero_feast",name:"Heldenfestmahl",icon:"🥘",level:25,cost:{meat:10,spice:5,essence:3},type:"consumable",duration:60,buff:{powerFlat:200,damagePct:.025}}
    ],
    companion:[
      {id:"spirit_lure",name:"Seelenköder",icon:"🐾",level:1,cost:{spirit:3,meat:2},type:"pet",petRole:"dps"},
      {id:"guardian_lure",name:"Wächterruf",icon:"🦏",level:12,cost:{spirit:6,bone:5},type:"pet",petRole:"tank"},
      {id:"healer_lure",name:"Lebensruf",icon:"🦋",level:20,cost:{spirit:8,herb:5,essence:3},type:"pet",petRole:"healer"}
    ]
  };
  const COMPANION_SPECIES = {
    wolf:{name:"Runenwolf",icon:"🐺"}, hound:{name:"Aschehund",icon:"🐕"}, bear:{name:"Felsenbär",icon:"🐻"}, boar:{name:"Panzerkeiler",icon:"🐗"},
    raven:{name:"Leerenrabe",icon:"🐦"}, sprite:{name:"Lebensfunke",icon:"🦋"}, drake:{name:"Jungdrache",icon:"🐉"}, golem:{name:"Runengolem",icon:"🗿"}
  };

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
    ranger: { role: "dps", name: "Jäger", icon: "🏹", weaponType: "bow", offhand: "quiver", range: 520, attackRate: 1.1, projectile: true, color: "#9be866", skills: [
      ["Dreifachpfeil", "Schießt drei Pfeile."], ["Frostfalle", "Verlangsamt Gegner im Bereich."], ["Durchbohrer", "Pfeil durchschlägt mehrere Ziele."], ["Adlerauge", "Erhöht kritische Treffer."], ["Pfeilsturm", "Großer Pfeilregen im Zielgebiet."]
    ]},
    arcanist: { role: "dps", name: "Arkanmagier", icon: "🔮", weaponType: "staff", offhand: "orb", range: 480, attackRate: .9, projectile: true, color: "#ac78ff", skills: [
      ["Arkanblitz", "Kettenblitz auf mehrere Ziele."], ["Zeitfeld", "Verlangsamt Gegner."], ["Manaschild", "Absorbiert Schaden."], ["Dimensionsriss", "Explodierendes Portal."], ["Sternenfall", "Große magische Flächenattacke."]
    ]},
    warlock: { role: "dps", name: "Leerenrufer", icon: "☄", weaponType: "tome", offhand: "relic", range: 450, attackRate: .82, projectile: true, color: "#e258ff", skills: [
      ["Leerenbrand", "Schaden über Zeit."], ["Schattenkette", "Bindet mehrere Gegner."], ["Seelenraub", "Heilt einen Teil des Schadens."], ["Dämonenriss", "Beschwört eine kurze Angriffseinheit."], ["Untergang", "Starke verzögerte Explosion."]
    ]},
    cleric: { role: "healer", name: "Lichtpriester", icon: "✨", weaponType: "mace", offhand: "relic", range: 360, attackRate: .75, projectile: true, color: "#ffe47a", skills: [
      ["Lichtwelle", "Heilt das ausgewählte Gruppenmitglied."], ["Reinigung", "Entfernt negative Effekte und heilt."], ["Sühne", "Drei heilige Geschosse: auf Gegner Schaden, auf Verbündete Heilung."], ["Heilkreis", "Heilt Verbündete oder verbrennt Gegner im Zielkreis."], ["Holy Shield", "Absorbiert Schaden in Höhe des maximalen Lebens. 30 Sekunden Abklingzeit."]
    ]},
    druid: { role: "healer", name: "Wilddruide", icon: "🌿", weaponType: "staff", offhand: "totem", range: 390, attackRate: .85, projectile: true, color: "#64e39c", skills: [
      ["Lebenssamen", "Starke Heilung über Zeit."], ["Dornenring", "Schaden und Verlangsamung."], ["Naturhaut", "Reduziert Gruppenschaden."], ["Wurzelgriff", "Hält Gegner fest."], ["Holy Shield", "Absorbiert Schaden in Höhe des maximalen Lebens. 30 Sekunden Abklingzeit."]
    ]}
  };

  const DUNGEONS = [
    { id: "crypt", name: "Krypta der Asche", level: 1, rooms: 10, theme: "ember", layout: "catacomb", color: "#ff8056", creatures: ["Aschekriecher", "Aschehund", "Knochensoldat", "Glutkultist"], bosses: ["Torwächter Morak", "Aschenbestie", "König der leeren Gruft"] },
    { id: "grove", name: "Verdorbener Hain", level: 8, rooms: 11, theme: "forest", layout: "grove", color: "#76dc78", creatures: ["Dornenwolf", "Mooshund", "Pilzwächter", "Verwachsener Jäger"], bosses: ["Wurzelmutter", "Der faule Hirsch", "Herz des Hains"] },
    { id: "frost", name: "Frostzitadelle", level: 16, rooms: 12, theme: "ice", layout: "citadel", color: "#6edcff", creatures: ["Frostwolf", "Eissplitter", "Frostlegionär", "Schneeschamane"], bosses: ["Wächter Khar", "Weiße Hydra", "Königin Iskara"] },
    { id: "prison", name: "Versunkenes Gefängnis", level: 22, rooms: 12, theme: "water", layout: "flooded", color: "#48cfff", creatures: ["Kerkerhund", "Kettengeist", "Sumpfwächter", "Ertrunkener Schütze"], bosses: ["Kerkermeister Voss", "Flutkoloss", "König der Ertrunkenen"] },
    { id: "storm", name: "Sturmobservatorium", level: 25, rooms: 12, theme: "storm", layout: "tower", color: "#8798ff", creatures: ["Sturmdrohne", "Blitzjäger", "Himmelswächter"], bosses: ["Leiter VII", "Donnerkoloss", "Astrax der Sturmseher"] },
    { id: "forge", name: "Obsidian-Schmiede", level: 30, rooms: 13, theme: "forge", layout: "forge", color: "#ff784f", creatures: ["Schlackengolem", "Schmiededämon", "Glutarmbrustschütze"], bosses: ["Meister Krov", "Obsidianriese", "Die lebende Esse"] },
    { id: "abyss", name: "Abgrund von Veyra", level: 35, rooms: 13, theme: "void", layout: "abyss", color: "#c76cff", creatures: ["Leerenmade", "Rissschütze", "Schattenritter"], bosses: ["Risshüter", "Namenloser Schlund", "Veyra die Unendliche"] },
    { id: "citadel", name: "Goldene Zitadelle", level: 45, rooms: 14, theme: "gold", layout: "palace", color: "#ffd15b", creatures: ["Palastgolem", "Runenritter", "Sonnenmagus"], bosses: ["Der vergoldete General", "Sonnenlöwe", "Kaiser Aureon"] },
    { id: "moon", name: "Mondgruft von Selene", level: 52, rooms: 14, theme: "moon", layout: "catacomb", color: "#b6c7ff", creatures: ["Mondwächter", "Silbergeist", "Sternengruftmagier"], bosses: ["Silberne Witwe", "Mondbestie", "Selene die Schlaflose"] },
    { id: "chaos", name: "Chaoskathedrale", level: 58, rooms: 15, theme: "chaos", layout: "cathedral", color: "#ff5fc9", creatures: ["Chaosbrut", "Flüsterhexe", "Spiegelkrieger"], bosses: ["Dreigesicht", "Kathedralenwyrm", "Chaos-Orakel"] },
    { id: "bones", name: "Thron der Knochen", level: 66, rooms: 15, theme: "bone", layout: "throne", color: "#e6dbc4", creatures: ["Knochenritter", "Grabpirscher", "Totenbeschwörer"], bosses: ["Der Gebeinkanzler", "Schädelhydra", "König Ossuar"] },
    { id: "universe", name: "Universe-Nexus", level: 75, rooms: 16, theme: "universe", layout: "nexus", color: "#f3fbff", creatures: ["Sternenwächter", "Kosmosjäger", "Nexusarchitekt"], bosses: ["Planetenschmied", "Galaxienfresser", "Nexus-Primus"] }
  ];

  const CHARACTER_PRESETS = [
    { id:"human", name:"Valorianer", icon:"⚔", race:"human", body:"athletic", skin:"medium", hair:"dark", accent:"#66f3c0", height:1, width:1, description:"Vielseitiger Mensch mit ausgewogener Statur und klarer Rüstungssilhouette." },
    { id:"hornborn", name:"Horngeborener", icon:"♉", race:"hornborn", body:"colossus", skin:"dark", hair:"dark", accent:"#d59a55", height:1.18, width:1.34, description:"Massiver Hornkrieger mit Hufen, breitem Oberkörper und mächtigen Schulterplatten." },
    { id:"revenant", name:"Grabwandler", icon:"☠", race:"revenant", body:"hunched", skin:"medium", hair:"silver", accent:"#86d79a", height:1.02, width:.92, description:"Untoter Kämpfer mit eingefallener Silhouette, Knochenpartien und kaltem Leuchten." },
    { id:"warborn", name:"Kriegsklaue", icon:"◆", race:"warborn", body:"broad", skin:"dark", hair:"dark", accent:"#d66e50", height:1.08, width:1.2, description:"Grünhäutiger Frontkämpfer mit Stoßzähnen, Muskelpanzer und schwerer Bewaffnung." },
    { id:"sylvan", name:"Sylvaner", icon:"❧", race:"sylvan", body:"slim", skin:"light", hair:"blond", accent:"#74e98d", height:1.07, width:.88, description:"Hochgewachsener Waldläufer mit langen Ohren, leichter Rüstung und agiler Haltung." },
    { id:"ironkin", name:"Eisenzwerg", icon:"⚒", race:"ironkin", body:"compact", skin:"medium", hair:"brown", accent:"#72cfff", height:.82, width:1.22, description:"Kompakter Bergkrieger mit breitem Bart, schweren Stiefeln und dicker Plattenrüstung." },
    { id:"drakeborn", name:"Drakonier", icon:"◇", race:"drakeborn", body:"broad", skin:"dark", hair:"silver", accent:"#7fdcff", height:1.12, width:1.14, description:"Geschuppter Drachenkrieger mit Hörnern, Schweif und kristallinen Rüstungsdetails." },
    { id:"voidkin", name:"Leerengeborener", icon:"◉", race:"voidkin", body:"slim", skin:"dark", hair:"silver", accent:"#d56cff", height:1.08, width:.9, description:"Schlanke Schattenrasse mit leuchtenden Augen, schwebenden Runen und dunkler Magie." }
  ];

  const PRESET_MIGRATION = {vanguard:"human",ironborn:"ironkin",ember:"hornborn",runeborn:"voidkin",sunwarden:"human",frostguard:"drakeborn"};

  const TALENT_TREES = {
    tank: [
      { branch:"Bollwerk", icon:"🛡", nodes:[
        {id:"tank_hp",name:"Titanenkörper",icon:"❤",max:5,effect:"health",amount:.04,text:"+4 % maximales Leben je Rang"},
        {id:"tank_armor",name:"Gehärtete Platte",icon:"⬢",max:5,effect:"armor",amount:.012,text:"+1,2 % Rüstung je Rang"},
        {id:"tank_shield",name:"Schildmeister",icon:"◈",max:5,effect:"shield",amount:.10,text:"+10 % Schildstärke je Rang"}
      ]},
      { branch:"Vergeltung", icon:"⚔", nodes:[
        {id:"tank_damage",name:"Gegenschlag",icon:"✦",max:5,effect:"damage",amount:.03,text:"+3 % Schaden je Rang"},
        {id:"tank_crit",name:"Präziser Hieb",icon:"◎",max:3,effect:"crit",amount:.01,text:"+1 % Krit je Rang"},
        {id:"tank_haste",name:"Kampfstrom",icon:"»",max:5,effect:"haste",amount:.012,text:"+1,2 % Tempo je Rang"}
      ]},
      { branch:"Kommandant", icon:"♛", nodes:[
        {id:"tank_cooldown",name:"Kriegsroutine",icon:"↻",max:5,effect:"cooldown",amount:.015,text:"-1,5 % Abklingzeit je Rang"},
        {id:"tank_move",name:"Vorhut",icon:"➤",max:3,effect:"move",amount:.03,text:"+3 % Bewegung je Rang"},
        {id:"tank_power",name:"Unbeugsam",icon:"◆",max:5,effect:"power",amount:.03,text:"+3 % Power je Rang"}
      ]}
    ],
    dps: [
      { branch:"Angriff", icon:"⚔", nodes:[
        {id:"dps_damage",name:"Waffenmeister",icon:"✦",max:5,effect:"damage",amount:.04,text:"+4 % Schaden je Rang"},
        {id:"dps_crit",name:"Tödliche Präzision",icon:"◎",max:5,effect:"crit",amount:.012,text:"+1,2 % Krit je Rang"},
        {id:"dps_haste",name:"Klingenrausch",icon:"»",max:5,effect:"haste",amount:.015,text:"+1,5 % Tempo je Rang"}
      ]},
      { branch:"Fokus", icon:"◉", nodes:[
        {id:"dps_cooldown",name:"Kampffokus",icon:"↻",max:5,effect:"cooldown",amount:.018,text:"-1,8 % Abklingzeit je Rang"},
        {id:"dps_power",name:"Überladung",icon:"◆",max:5,effect:"power",amount:.04,text:"+4 % Power je Rang"},
        {id:"dps_move",name:"Jägerinstinkt",icon:"➤",max:3,effect:"move",amount:.035,text:"+3,5 % Bewegung je Rang"}
      ]},
      { branch:"Überleben", icon:"❤", nodes:[
        {id:"dps_hp",name:"Zäher Kämpfer",icon:"❤",max:5,effect:"health",amount:.025,text:"+2,5 % Leben je Rang"},
        {id:"dps_armor",name:"Leichte Rüstung",icon:"⬢",max:5,effect:"armor",amount:.008,text:"+0,8 % Rüstung je Rang"},
        {id:"dps_shield",name:"Notbarriere",icon:"◈",max:3,effect:"shield",amount:.08,text:"+8 % Schildstärke je Rang"}
      ]}
    ],
    healer: [
      { branch:"Heilig", icon:"✚", nodes:[
        {id:"heal_healing",name:"Heilige Macht",icon:"✚",max:5,effect:"healing",amount:.05,text:"+5 % Heilung je Rang"},
        {id:"heal_shield",name:"Schildmacht",icon:"◈",max:5,effect:"shield",amount:.12,text:"+12 % Holy-Shield-Stärke je Rang"},
        {id:"heal_cooldown",name:"Glaubensfluss",icon:"↻",max:5,effect:"cooldown",amount:.018,text:"-1,8 % Abklingzeit je Rang"}
      ]},
      { branch:"Disziplin", icon:"✦", nodes:[
        {id:"heal_damage",name:"Sühne-Meister",icon:"✦",max:5,effect:"damage",amount:.035,text:"+3,5 % Schaden je Rang"},
        {id:"heal_crit",name:"Göttliche Präzision",icon:"◎",max:3,effect:"crit",amount:.01,text:"+1 % Krit je Rang"},
        {id:"heal_power",name:"Innere Stärke",icon:"◆",max:5,effect:"power",amount:.035,text:"+3,5 % Power je Rang"}
      ]},
      { branch:"Bewahrung", icon:"❤", nodes:[
        {id:"heal_hp",name:"Gesegnetes Leben",icon:"❤",max:5,effect:"health",amount:.03,text:"+3 % Leben je Rang"},
        {id:"heal_armor",name:"Lichtgewand",icon:"⬢",max:5,effect:"armor",amount:.009,text:"+0,9 % Rüstung je Rang"},
        {id:"heal_move",name:"Engelsschritt",icon:"➤",max:3,effect:"move",amount:.03,text:"+3 % Bewegung je Rang"}
      ]}
    ]
  };

  // V168: Jede Klasse besitzt zusätzlich einen eigenen aktiven Talentpfad. Die
  // Freischaltungen kosten je einen Talentpunkt und können danach frei in die
  // sechs Felder der Aktionsleiste gelegt werden.
  const CLASS_ABILITY_NODES = {
    guardian:[
      {branch:0,id:"tank_unlock_charge",name:"Unaufhaltsamer Ansturm",icon:"➤",ability:"guardian_charge",cooldown:18},
      {branch:0,id:"guardian_unlock_throw",name:"Schildwurf",icon:"◒",ability:"guardian_shield_throw",cooldown:12},
      {branch:1,id:"guardian_unlock_slam",name:"Erdbebenstoß",icon:"✹",ability:"guardian_groundslam",cooldown:17},
      {branch:2,id:"guardian_unlock_banner",name:"Banner der Wacht",icon:"⚑",ability:"guardian_banner",cooldown:25},
      {branch:2,id:"guardian_unlock_laststand",name:"Letztes Bollwerk",icon:"◆",ability:"guardian_laststand",cooldown:32}
    ],
    berserker:[
      {branch:0,id:"dps_unlock_signature",name:"Blutsturm",icon:"✹",ability:"berserker_signature",cooldown:20},
      {branch:0,id:"berserker_unlock_cleave",name:"Kettenschnitt",icon:"⚔",ability:"berserker_cleave",cooldown:10},
      {branch:1,id:"berserker_unlock_rage",name:"Blutrausch",icon:"♨",ability:"berserker_rage",cooldown:22},
      {branch:1,id:"berserker_unlock_execute",name:"Hinrichtung",icon:"☠",ability:"berserker_execute",cooldown:18},
      {branch:2,id:"berserker_unlock_leap",name:"Kriegssprung",icon:"➤",ability:"berserker_leap",cooldown:20}
    ],
    ranger:[
      {branch:0,id:"dps_unlock_signature",name:"Bestienruf",icon:"🐾",ability:"ranger_signature",cooldown:24},
      {branch:0,id:"ranger_unlock_poison",name:"Giftpfeil",icon:"☣",ability:"ranger_poison",cooldown:11},
      {branch:1,id:"ranger_unlock_volley",name:"Pfeilsalve",icon:"➹",ability:"ranger_volley",cooldown:18},
      {branch:2,id:"ranger_unlock_mendpet",name:"Tierheilung",icon:"❤",ability:"ranger_mend_pet",cooldown:20},
      {branch:2,id:"ranger_unlock_trap",name:"Frostfalle",icon:"❄",ability:"ranger_frost_trap",cooldown:16}
    ],
    arcanist:[
      {branch:0,id:"dps_unlock_signature",name:"Frostlanze",icon:"❄",ability:"arcanist_signature",cooldown:16},
      {branch:0,id:"arcanist_unlock_fireball",name:"Feuerkugel",icon:"☄",ability:"arcanist_fireball",cooldown:10},
      {branch:1,id:"arcanist_unlock_nova",name:"Arkane Nova",icon:"✦",ability:"arcanist_nova",cooldown:18},
      {branch:1,id:"arcanist_unlock_blink",name:"Arkanschritt",icon:"➤",ability:"arcanist_blink",cooldown:12},
      {branch:2,id:"arcanist_unlock_barrier",name:"Prismabarriere",icon:"◇",ability:"arcanist_barrier",cooldown:24}
    ],
    warlock:[
      {branch:0,id:"dps_unlock_signature",name:"Seelenexplosion",icon:"☄",ability:"warlock_signature",cooldown:21},
      {branch:0,id:"warlock_unlock_drain",name:"Lebensentzug",icon:"◉",ability:"warlock_drain",cooldown:14},
      {branch:1,id:"warlock_unlock_curse",name:"Fluchregen",icon:"☂",ability:"warlock_curse_rain",cooldown:18},
      {branch:1,id:"warlock_unlock_soulfire",name:"Seelenfeuer",icon:"✦",ability:"warlock_soulfire",cooldown:20},
      {branch:2,id:"warlock_unlock_guard",name:"Dämonenwache",icon:"◈",ability:"warlock_demon_guard",cooldown:26}
    ],
    cleric:[
      {branch:0,id:"heal_unlock_spear",name:"Heiliger Speer",icon:"⚡",ability:"cleric_holy_spear",cooldown:15},
      {branch:0,id:"cleric_unlock_judgment",name:"Urteil des Lichts",icon:"☀",ability:"cleric_judgment",cooldown:14},
      {branch:1,id:"cleric_unlock_nova",name:"Göttliche Nova",icon:"✦",ability:"cleric_divine_nova",cooldown:20},
      {branch:1,id:"cleric_unlock_beacon",name:"Lichtzeichen",icon:"◎",ability:"cleric_beacon",cooldown:24},
      {branch:2,id:"heal_unlock_radiance",name:"Strahlende Gnade",icon:"☀",ability:"cleric_radiance",cooldown:24},
      {branch:2,id:"cleric_unlock_angel",name:"Schutzengel",icon:"♢",ability:"cleric_guardian_angel",cooldown:28}
    ],
    druid:[
      {branch:0,id:"heal_unlock_radiance",name:"Smaragdblüte",icon:"❧",ability:"druid_radiance",cooldown:24},
      {branch:0,id:"druid_unlock_regrowth",name:"Nachwachsen",icon:"🌿",ability:"druid_regrowth",cooldown:15},
      {branch:1,id:"druid_unlock_moonfire",name:"Mondfeuer",icon:"☾",ability:"druid_moonfire",cooldown:10},
      {branch:1,id:"druid_unlock_cyclone",name:"Zyklon",icon:"◌",ability:"druid_cyclone",cooldown:18},
      {branch:2,id:"druid_unlock_barkskin",name:"Eisenborke",icon:"◈",ability:"druid_barkskin",cooldown:24},
      {branch:2,id:"druid_unlock_tranquility",name:"Gelassenheit",icon:"✿",ability:"druid_tranquility",cooldown:30}
    ]
  };

  const EXTRA_ABILITIES = {
    guardian_charge:{classId:"guardian",name:"Sturmangriff",icon:"➤",kind:"charge",cooldown:18,talent:"tank_unlock_charge",description:"Stürmt zum Ziel, verursacht Schaden und bindet es."},
    guardian_shield_throw:{classId:"guardian",name:"Schildwurf",icon:"◒",kind:"shieldthrow",cooldown:12,talent:"guardian_unlock_throw",action:"target_projectile",power:1.45,color:"#8fe8ff",description:"Wirft den Schild auf das Ziel und verursacht hohen Schaden."},
    guardian_groundslam:{classId:"guardian",name:"Erdbebenstoß",icon:"✹",kind:"groundslam",cooldown:17,talent:"guardian_unlock_slam",action:"area_damage",power:1.75,radius:190,color:"#ffd27a",description:"Erschüttert den Boden und trifft Gegner im Umkreis."},
    guardian_banner:{classId:"guardian",name:"Banner der Wacht",icon:"⚑",kind:"guardianbanner",cooldown:25,talent:"guardian_unlock_banner",action:"group_shield",power:.24,color:"#65d9ff",description:"Gibt der sichtbaren Gruppe einen Schutzschild und zieht Gegner an."},
    guardian_laststand:{classId:"guardian",name:"Letztes Bollwerk",icon:"◆",kind:"laststand",cooldown:32,talent:"guardian_unlock_laststand",action:"last_stand",power:.46,color:"#9fe9ff",description:"Heilt dich, verstärkt deine Verteidigung und gibt einen großen Schild."},

    berserker_signature:{classId:"berserker",name:"Blutsturm",icon:"✹",kind:"bloodstorm",cooldown:20,talent:"dps_unlock_signature",description:"Mehrere schnelle Treffer um den Charakter."},
    berserker_cleave:{classId:"berserker",name:"Kettenschnitt",icon:"⚔",kind:"cleave",cooldown:10,talent:"berserker_unlock_cleave",action:"area_damage",power:1.38,radius:135,color:"#ff6377",description:"Ein schneller Rundumschlag mit kurzer Abklingzeit."},
    berserker_rage:{classId:"berserker",name:"Blutrausch",icon:"♨",kind:"rage",cooldown:22,talent:"berserker_unlock_rage",action:"combat_buff",power:.28,color:"#ff4d66",description:"Erhöht vorübergehend Tempo und Angriffskraft."},
    berserker_execute:{classId:"berserker",name:"Hinrichtung",icon:"☠",kind:"execute",cooldown:18,talent:"berserker_unlock_execute",action:"execute",power:2.35,color:"#ff304f",description:"Sehr starker Treffer; gegen geschwächte Ziele noch mächtiger."},
    berserker_leap:{classId:"berserker",name:"Kriegssprung",icon:"➤",kind:"warleap",cooldown:20,talent:"berserker_unlock_leap",action:"dash_area",power:1.8,radius:150,color:"#ff805f",description:"Springt zum Ziel und schlägt beim Auftreffen im Umkreis ein."},

    ranger_signature:{classId:"ranger",name:"Bestienruf",icon:"🐾",kind:"beastcall",cooldown:24,talent:"dps_unlock_signature",description:"Begleiter verursacht einen verstärkten Angriff."},
    ranger_poison:{classId:"ranger",name:"Giftpfeil",icon:"☣",kind:"poisonarrow",cooldown:11,talent:"ranger_unlock_poison",action:"target_projectile",power:1.35,color:"#7bed73",dotPower:.38,description:"Ein giftiger Pfeil trifft das Ziel und hinterlässt eine Schadenszone."},
    ranger_volley:{classId:"ranger",name:"Pfeilsalve",icon:"➹",kind:"volley",cooldown:18,talent:"ranger_unlock_volley",action:"volley",power:.72,color:"#c9f17d",description:"Feuert fünf Pfeile fächerförmig auf das ausgewählte Ziel."},
    ranger_mend_pet:{classId:"ranger",name:"Tierheilung",icon:"❤",kind:"mendpet",cooldown:20,talent:"ranger_unlock_mendpet",action:"pet_heal",power:.62,color:"#8ff1a3",description:"Heilt den aktiven Jäger-Begleiter und gibt ihm kurz Schutz."},
    ranger_frost_trap:{classId:"ranger",name:"Frostfalle",icon:"❄",kind:"frosttrap",cooldown:16,talent:"ranger_unlock_trap",action:"zone_damage",power:.58,radius:145,duration:7,color:"#80dcff",description:"Legt am Ziel eine anhaltende Frostfalle ab."},

    arcanist_signature:{classId:"arcanist",name:"Frostlanze",icon:"❄",kind:"frostlance",cooldown:16,talent:"dps_unlock_signature",description:"Ein mächtiges magisches Geschoss auf das Ziel."},
    arcanist_fireball:{classId:"arcanist",name:"Feuerkugel",icon:"☄",kind:"fireball",cooldown:10,talent:"arcanist_unlock_fireball",action:"target_projectile",power:1.55,color:"#ff8b45",splash:95,description:"Eine Feuerkugel explodiert am Ziel und trifft nahe Gegner."},
    arcanist_nova:{classId:"arcanist",name:"Arkane Nova",icon:"✦",kind:"arcanenova",cooldown:18,talent:"arcanist_unlock_nova",action:"area_damage",power:1.85,radius:205,color:"#ae7dff",description:"Eine große arkane Explosion um den Magier."},
    arcanist_blink:{classId:"arcanist",name:"Arkanschritt",icon:"➤",kind:"blink",cooldown:12,talent:"arcanist_unlock_blink",action:"blink",power:0,color:"#7de7ff",description:"Teleportiert dich ein kurzes Stück in Blickrichtung."},
    arcanist_barrier:{classId:"arcanist",name:"Prismabarriere",icon:"◇",kind:"prismbarrier",cooldown:24,talent:"arcanist_unlock_barrier",action:"self_shield",power:.72,color:"#9fdfff",description:"Erzeugt eine starke magische Barriere um dich."},

    warlock_signature:{classId:"warlock",name:"Seelenexplosion",icon:"☄",kind:"soulburst",cooldown:21,talent:"dps_unlock_signature",description:"Leerenexplosion am ausgewählten Ziel."},
    warlock_drain:{classId:"warlock",name:"Lebensentzug",icon:"◉",kind:"drain",cooldown:14,talent:"warlock_unlock_drain",action:"drain",power:1.45,color:"#d45cff",description:"Entzieht dem Gegner Leben und heilt dich um einen Teil des Schadens."},
    warlock_curse_rain:{classId:"warlock",name:"Fluchregen",icon:"☂",kind:"curserain",cooldown:18,talent:"warlock_unlock_curse",action:"zone_damage",power:.72,radius:165,duration:8,color:"#b14cff",description:"Erzeugt eine anhaltende Leerenzone am Gegner."},
    warlock_soulfire:{classId:"warlock",name:"Seelenfeuer",icon:"✦",kind:"soulfire",cooldown:20,talent:"warlock_unlock_soulfire",action:"target_projectile",power:2.35,color:"#e569ff",splash:80,description:"Ein langsames, sehr starkes Seelenprojektil."},
    warlock_demon_guard:{classId:"warlock",name:"Dämonenwache",icon:"◈",kind:"demonguard",cooldown:26,talent:"warlock_unlock_guard",action:"self_shield_aura",power:.58,color:"#9a55ff",description:"Gibt dir einen Schild und schädigt Gegner in deiner Nähe."},

    cleric_holy_spear:{classId:"cleric",name:"Heiliger Speer",icon:"⚡",kind:"holyspear",cooldown:15,talent:"heal_unlock_spear",description:"Ein langer Lichtstoß verursacht hohen Schaden."},
    cleric_radiance:{classId:"cleric",name:"Strahlende Gnade",icon:"☀",kind:"radiance",cooldown:24,talent:"heal_unlock_radiance",description:"Heilt die sichtbare Gruppe und gibt kurz Schutz."},
    cleric_judgment:{classId:"cleric",name:"Urteil des Lichts",icon:"☀",kind:"judgment",cooldown:14,talent:"cleric_unlock_judgment",action:"drain",power:1.55,healRatio:.55,color:"#fff08b",description:"Schädigt einen Gegner und heilt dich mit heiligem Licht."},
    cleric_divine_nova:{classId:"cleric",name:"Göttliche Nova",icon:"✦",kind:"divinenova",cooldown:20,talent:"cleric_unlock_nova",action:"hybrid_nova",power:1.18,healPower:.82,radius:190,color:"#fff2a6",description:"Schädigt Gegner und heilt Verbündete gleichzeitig."},
    cleric_beacon:{classId:"cleric",name:"Lichtzeichen",icon:"◎",kind:"beacon",cooldown:24,talent:"cleric_unlock_beacon",action:"zone_heal",power:.46,radius:115,duration:9,color:"#aaffcf",description:"Legt eine länger anhaltende Heilzone auf das ausgewählte Ziel."},
    cleric_guardian_angel:{classId:"cleric",name:"Schutzengel",icon:"♢",kind:"guardianangel",cooldown:28,talent:"cleric_unlock_angel",action:"heal_shield",power:1.25,shieldPower:.48,color:"#dffaff",description:"Heilt einen Verbündeten stark und gibt zusätzlich einen Schild."},

    druid_radiance:{classId:"druid",name:"Smaragdblüte",icon:"❧",kind:"radiance",cooldown:24,talent:"heal_unlock_radiance",description:"Heilt die sichtbare Gruppe mit Naturenergie."},
    druid_regrowth:{classId:"druid",name:"Nachwachsen",icon:"🌿",kind:"regrowth",cooldown:15,talent:"druid_unlock_regrowth",action:"zone_heal",power:.56,radius:105,duration:8,color:"#72ef9b",description:"Eine konzentrierte Heilung über Zeit auf dem Ziel."},
    druid_moonfire:{classId:"druid",name:"Mondfeuer",icon:"☾",kind:"moonfire",cooldown:10,talent:"druid_unlock_moonfire",action:"target_projectile",power:1.45,color:"#a7c9ff",dotPower:.32,description:"Ein schneller Mondstrahl mit nachwirkendem Schaden."},
    druid_cyclone:{classId:"druid",name:"Zyklon",icon:"◌",kind:"cyclone",cooldown:18,talent:"druid_unlock_cyclone",action:"control",power:1.15,color:"#b7fff2",description:"Wirbelt das Ziel auf, verursacht Schaden und verzögert seinen Angriff."},
    druid_barkskin:{classId:"druid",name:"Eisenborke",icon:"◈",kind:"barkskin",cooldown:24,talent:"druid_unlock_barkskin",action:"ally_shield",power:.64,color:"#8de19a",description:"Gibt dir oder einem Verbündeten einen Natur-Schutzschild."},
    druid_tranquility:{classId:"druid",name:"Gelassenheit",icon:"✿",kind:"tranquility",cooldown:30,talent:"druid_unlock_tranquility",action:"group_zone_heal",power:.42,radius:210,duration:10,color:"#78f0a0",description:"Große anhaltende Gruppenheilung um den Druiden."}
  };
  const BASE_ABILITY_ICONS = {
    guardian:["🛡","♜","⚔","◈","◆"],berserker:["✹","⚡","➤","〽","☠"],ranger:["➹","❄","➤","◎","☄"],
    arcanist:["✦","◉","◈","◇","☄"],warlock:["☄","⛓","◉","◇","☠"],cleric:["☀","❧","✦","◎","◈"],druid:["❧","✿","◈","⌁","◉"]
  };
  function classSignatureAbilityId(classId){return classId==="berserker"?"berserker_signature":classId==="ranger"?"ranger_signature":classId==="arcanist"?"arcanist_signature":classId==="warlock"?"warlock_signature":"";}
  function defaultActionBar(classId){const c=CLASSES[classId]||CLASSES.guardian;return ["base:0","base:1","base:2","base:3","base:4",c.role==="healer"?"revive":""]; }
  function abilityInfo(classId,id){
    const c=CLASSES[classId]||CLASSES.guardian;
    if(/^base:[0-4]$/.test(String(id))){const index=Number(String(id).split(":")[1]),skill=c.skills[index]||["Fähigkeit",""];return{id:String(id),name:skill[0],description:skill[1],icon:(BASE_ABILITY_ICONS[classId]||[])[index]||String(index+1),kind:classId==="cleric"?["lightwave","cleanse","penance","healcircle","holyshield"][index]:classId==="druid"?["lifeseed","thorns","natureguard","roots","holyshield"][index]:"classskill",cooldown:SKILL_BASE_COOLDOWNS[index],baseIndex:index};}
    if(id==="revive")return{id,name:"Wiederbelebung",description:"Belebt ein gefallenes Gruppenmitglied wieder.",icon:"✚",kind:"revive",cooldown:REVIVE_COOLDOWN};
    const extra=EXTRA_ABILITIES[id];return extra?{id,...extra}:null;
  }
  function abilityUnlocked(data,id){if(!id)return true;if(/^base:[0-4]$/.test(id))return true;if(id==="revive")return data.role==="healer";const extra=EXTRA_ABILITIES[id];return !!extra&&extra.classId===data.classId&&talentRank(data,extra.talent)>0;}
  function abilityCatalog(data){const ids=["base:0","base:1","base:2","base:3","base:4"];if(data.role==="healer")ids.push("revive");for(const [id,extra] of Object.entries(EXTRA_ABILITIES))if(extra.classId===data.classId)ids.push(id);return [...new Set(ids)].map(id=>abilityInfo(data.classId,id)).filter(Boolean);}
  function ensureActionBarData(data){data.actionBars ||= {};let bar=Array.isArray(data.actionBars[data.classId])?data.actionBars[data.classId].slice(0,6):defaultActionBar(data.classId);while(bar.length<6)bar.push("");bar=bar.map(id=>abilityInfo(data.classId,String(id||""))?String(id):"");data.actionBars[data.classId]=bar;return bar;}

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
    session: null, raf: 0, last: 0, keys: Object.create(null), pointer: { x: 0, y: 0, down: false }, audio: null, onlineUnsubs: [], timers: [], loadingToken: 0, previewFacing: "front", actionEditSlot: 0
  };

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  const esc = value => String(value ?? "").replace(/[&<>'"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[ch]));
  const distance = (a, b) => Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0));
  const rarityIndex = rarity => Math.max(0, RARITY_ORDER.indexOf(rarity));
  const formatPower = value => { value=Number.isFinite(Number(value))?Math.max(0,Number(value)):0;return value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(1)}K` : String(Math.round(value)); };
  const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const presetById = id => CHARACTER_PRESETS.find(p => p.id === id) || CHARACTER_PRESETS[0];
  function talentTreeFor(value){
    const data=value&&typeof value==="object"?value:null,role=data?.role||value||"dps",classId=data?.classId||"";
    const base=TALENT_TREES[role]||TALENT_TREES.dps;
    const tree=base.map(branch=>({...branch,nodes:branch.nodes.map(node=>({...node}))}));
    for(const node of CLASS_ABILITY_NODES[classId]||[]){
      const info=EXTRA_ABILITIES[node.ability],cooldown=Number(node.cooldown||info?.cooldown||0);
      tree[clamp(Number(node.branch)||0,0,tree.length-1)].nodes.push({id:node.id,name:node.name,icon:node.icon,max:1,effect:"ability",ability:node.ability,text:`Fähigkeit freischalten · ${cooldown.toFixed(0)} s Abklingzeit`});
    }
    return tree;
  }
  function talentRank(data, id){ return clamp(Math.floor(Number(data?.talents?.[id]) || 0), 0, 5); }
  function talentPointsTotal(data){ return Math.max(0, Math.floor((Math.max(1, Number(data?.level) || 1) - 1) / 2)); }
  function talentPointsSpent(data){
    return Object.values(data?.talents || {}).reduce((sum, value) => sum + Math.max(0, Math.floor(Number(value) || 0)), 0);
  }
  function talentPointsAvailable(data){ return Math.max(0, talentPointsTotal(data) - talentPointsSpent(data)); }
  function talentBonuses(data){
    const out={health:0,damage:0,healing:0,armor:0,crit:0,haste:0,cooldown:0,shield:0,move:0,power:0};
    for(const branch of talentTreeFor(data)) for(const node of branch.nodes){
      const rank=clamp(talentRank(data,node.id),0,node.max);
      if(rank&&Object.prototype.hasOwnProperty.call(out,node.effect)) out[node.effect]+=rank*node.amount;
    }
    return out;
  }

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
  function accountPlayerName() { const s = getAppState(); return String(s?.firstName || s?.name || "Spieler").slice(0, 24); }
  function playerName() { const root=getAppState()?.dungeonKl,character=Array.isArray(root?.characters)?root.characters.find(c=>c.id===root.activeCharacterId):null;return String(character?.name||accountPlayerName()).slice(0,24); }
  function normalizeDungeonCharacterName(value,fallback="Held") { return String(value??"").replace(/\s+/g," ").trim().slice(0,24)||fallback; }
  function dungeonCharacterNameAvailable(name,characterId="") { const root=ensureDungeonRoot();const key=normalizeDungeonCharacterName(name,"").toLocaleLowerCase("de-DE");return !!key&&!(root?.characters||[]).some(character=>character.id!==characterId&&normalizeDungeonCharacterName(character.name,"").toLocaleLowerCase("de-DE")===key); }
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
  function createItem(level = 1, rarity = "common", slot = null, classId = null, options = null) {
    if (!classId) classId = ensureState()?.classId || "guardian";
    slot ||= pick(SLOT_KEYS);
    if (!RARITIES[rarity]) rarity = "common";
    const exactLevel = !!options?.exactLevel;
    const req = exactLevel ? clamp(Math.round(Number(level) || 1), 1, MAX_LEVEL) : itemLevelRequirement(level, rarity);
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
  function starterHunterPet(level=1){
    return { id: uid(), species:"wolf", name:"Runenwolf", level:clamp(Math.floor(level)||1,1,MAX_LEVEL), loyalty:1, acquiredAt:Date.now() };
  }
  function ensureHunterData(data){
    data.hunter ||= { pets:[], activeId:"" };
    data.hunter.pets = Array.isArray(data.hunter.pets) ? data.hunter.pets.slice(0,18).map(pet=>({
      id:String(pet?.id||uid()), species:String(pet?.species||"wolf"), name:String(pet?.name||"Runenwolf").slice(0,28),
      level:clamp(Math.floor(Number(data.level)||1),1,MAX_LEVEL), loyalty:clamp(Number(pet?.loyalty)||1,1,5), acquiredAt:Number(pet?.acquiredAt)||Date.now()
    })) : [];
    if(data.classId==="ranger" && !data.hunter.pets.length) data.hunter.pets.push(starterHunterPet(data.level));
    if(data.classId==="ranger" && !data.hunter.pets.some(pet=>pet.id===data.hunter.activeId)) data.hunter.activeId=data.hunter.pets[0]?.id||"";
    for(const pet of data.hunter.pets) pet.level=data.level;
    return data.hunter;
  }
  function activeHunterPet(data=ensureState()){
    if(!data||data.classId!=="ranger")return null;
    const hunter=ensureHunterData(data);return hunter.pets.find(pet=>pet.id===hunter.activeId)||hunter.pets[0]||null;
  }
  function hunterPetSpecies(name=""){
    const n=String(name).toLowerCase();
    if(/wolf/.test(n))return "wolf";
    if(/hund|hound/.test(n))return "hound";
    if(/bestie|löwe|katze|panther/.test(n))return "beast";
    return "";
  }
  function ensureProfessionData(data){
    data.profession ||= {id:"",level:1,xp:0};
    data.profession.id=PROFESSIONS[data.profession.id]?data.profession.id:"";
    data.profession.level=clamp(Math.floor(Number(data.profession.level)||1),1,PROFESSION_MAX_LEVEL);
    data.profession.xp=Math.max(0,Math.floor(Number(data.profession.xp)||0));
    data.materials ||= {};for(const key of Object.keys(MATERIALS))data.materials[key]=Math.max(0,Math.floor(Number(data.materials[key])||0));
    data.consumables=Array.isArray(data.consumables)?data.consumables.slice(0,120).map(x=>({...x,id:String(x?.id||uid()),quantity:Math.max(1,Math.floor(Number(x?.quantity)||1))})):[];
    data.activeBuffs=Array.isArray(data.activeBuffs)?data.activeBuffs.filter(x=>Number(x?.expiresAt||0)>Date.now()).slice(0,12):[];
    data.companions ||= {pets:[],activeId:""};
    data.companions.pets=Array.isArray(data.companions.pets)?data.companions.pets.slice(0,80).map(p=>({id:String(p?.id||uid()),species:COMPANION_SPECIES[p?.species]?p.species:"wolf",name:String(p?.name||"Begleiter").slice(0,28),rarity:RARITIES[p?.rarity]?p.rarity:"common",role:["tank","dps","healer"].includes(p?.role)?p.role:"dps",copies:Math.max(1,Math.floor(Number(p?.copies)||1)),acquiredAt:Number(p?.acquiredAt)||Date.now()})):[];
    if(!data.companions.pets.some(p=>p.id===data.companions.activeId))data.companions.activeId=data.companions.pets[0]?.id||"";
    return data.profession;
  }
  function professionNeed(level){return 80+Math.max(1,level)*42;}
  function addProfessionXp(data,amount){ensureProfessionData(data);if(!data.profession.id)return;data.profession.xp+=Math.max(0,Math.round(amount||0));while(data.profession.level<PROFESSION_MAX_LEVEL&&data.profession.xp>=professionNeed(data.profession.level)){data.profession.xp-=professionNeed(data.profession.level);data.profession.level++;toast("Beruf aufgestiegen",`${PROFESSIONS[data.profession.id].name} · Stufe ${data.profession.level}`);}}
  function activeBuffTotals(data){ensureProfessionData(data);data.activeBuffs=data.activeBuffs.filter(x=>finite(x?.expiresAt,0)>Date.now());const total={healthPct:0,damagePct:0,healingPct:0,armorPct:0,powerFlat:0};for(const x of data.activeBuffs)for(const key of Object.keys(total))total[key]+=finite(x?.buff?.[key],0);return total;}
  function materialCount(data,key){ensureProfessionData(data);return Number(data.materials[key]||0);}
  function addMaterial(data,key,amount=1){ensureProfessionData(data);if(!MATERIALS[key])return;data.materials[key]=Math.max(0,Math.floor(Number(data.materials[key]||0)+Number(amount||0)));}
  function petFusionNeed(rarity){return Math.min(10,rarityIndex(rarity)+2);}
  function companionPetProfile(data){ensureProfessionData(data);if(data.profession.id!=="companion")return null;return data.companions.pets.find(p=>p.id===data.companions.activeId)||null;}
  function addCompanionCopy(data,profile){ensureProfessionData(data);const existing=data.companions.pets.find(p=>p.species===profile.species&&p.rarity===profile.rarity&&p.role===profile.role);if(existing){existing.copies+=1;return existing;}const pet={id:uid(),species:profile.species||pick(Object.keys(COMPANION_SPECIES)),name:profile.name||COMPANION_SPECIES[profile.species]?.name||"Begleiter",rarity:profile.rarity||"common",role:profile.role||"dps",copies:1,acquiredAt:Date.now()};data.companions.pets.unshift(pet);data.companions.activeId ||= pet.id;return pet;}
  function upgradeCompanionPet(data,id){ensureProfessionData(data);const pet=data.companions.pets.find(p=>p.id===id);if(!pet)return false;const idx=rarityIndex(pet.rarity),need=petFusionNeed(pet.rarity);if(idx>=RARITY_ORDER.length-1)return toast("Maximale Stufe",`${pet.name} ist bereits Universe.`),false;if(pet.copies<need)return toast("Nicht genug Kopien",`${need} gleiche Begleiter werden benötigt.`),false;pet.copies-=need;pet.rarity=RARITY_ORDER[idx+1];toast("Begleiter fusioniert",`${pet.name} ist jetzt ${RARITIES[pet.rarity].name}.`);safeSave();return true;}
  function makeSupportPetRuntime(profile,{x=0,y=0,ownerId="",ownerLevel=1,ownerPower=100}={}){
    if(!profile)return null;
    const rarityId=RARITIES[profile.rarity]?profile.rarity:"common",rarity=RARITIES[rarityId]||RARITIES.common,mult=Math.max(.1,finite(rarity.mult,1)),role=["tank","healer","dps"].includes(profile.role)?profile.role:"dps",level=clamp(Math.floor(finite(ownerLevel,1)),1,MAX_LEVEL),power=Math.max(1,finite(ownerPower,100)),px=finite(x,0)-55,py=finite(y,0)+34,maxHp=Math.max(1,Math.round((90+level*24+power*.12)*(role==="tank"?1.35:role==="healer"?.78:.9)*mult)),id=String(profile.id||uid()),owner=String(ownerId||"");
    return {id,uid:`pet:${owner}:${id}`,isPet:true,petType:"support",ownerId:owner,species:String(profile.species||"wolf"),name:String(profile.name||"Begleiter"),rarity:rarityId,role,level,x:px,y:py,netX:px,netY:py,maxHp,hp:maxHp,armor:role==="tank"?.32:role==="healer"?.08:.14,damage:Math.max(1,Math.round((10+power*(role==="dps"?.26:.11))*mult)),healing:Math.max(1,Math.round((8+power*.09)*mult)),power:Math.max(1,Math.round(power*(role==="dps"?.32:.18)*mult)),shield:0,attackCd:0,attackRate:role==="dps"?1.18:.78,range:role==="healer"?165:58,angle:0,moving:false,attackAnim:0,walkPhase:0,radius:15,buffs:{},dead:false,downedAt:0,lastDamageAt:performance.now(),regenAccumulator:0,healthSeq:0,lastAppliedHealthSeq:-1,hitSeq:0,lastAppliedHitSeq:0};
  }
  function consumableCardHtml(x){const buffs=[];if(x.buff?.healInstant)buffs.push(`${Math.round(x.buff.healInstant*100)} % Sofortheilung`);if(x.buff?.healthPct)buffs.push(`+${Math.round(x.buff.healthPct*100)} % Leben`);if(x.buff?.damagePct)buffs.push(`+${Math.round(x.buff.damagePct*100)} % Schaden`);if(x.buff?.healingPct)buffs.push(`+${Math.round(x.buff.healingPct*100)} % Heilung`);if(x.buff?.armorPct)buffs.push(`+${Math.round(x.buff.armorPct*100)} % Rüstung`);if(x.buff?.powerFlat)buffs.push(`+${x.buff.powerFlat} Power`);return `<article class="dkl-consumable"><span>${x.icon||"🧪"}</span><div><b>${esc(x.name)}</b><small>${buffs.join(" · ")}${x.duration?` · ${x.duration} s`:""}</small></div><em>×${x.quantity}</em><button class="dkl-btn small" data-dkl-use-consumable="${esc(x.id)}">Benutzen</button></article>`;}
  function useConsumable(id){const d=ensureState();ensureProfessionData(d);const item=d.consumables.find(x=>x.id===id);if(!item)return;if(item.buff?.healInstant&&UI.session?.player&&!UI.session.player.dead){const p=UI.session.player;healPlayer(UI.session,p,p.maxHp*item.buff.healInstant,p);}if(item.duration>0)d.activeBuffs.push({id:uid(),name:item.name,buff:item.buff,expiresAt:Date.now()+item.duration*1000});item.quantity--;if(item.quantity<=0)d.consumables=d.consumables.filter(x=>x.id!==id);refreshSessionLoadout();safeSave();updateHead();toast("Verbrauchsitem benutzt",item.name);renderInventory();}
  function createCharacterData(index=0){
    const classId="guardian",character={id:uid(),name:`Held ${index+1}`,nameChosen:false,createdAtMs:Date.now(),level:1,xp:0,totalXp:0,gold:1500,role:"tank",classId,inventory:starterInventory(classId),equipped:{},bestDungeon:{},completed:{},stats:{kills:0,bosses:0,chests:0,runs:0,deaths:0},shop:{generatedAt:0,stock:[]},settings:{sound:true,particles:"high",damageNumbers:true},appearance:{gender:"male",skin:"medium",hair:"dark",preset:"human",hairStyle:"short",accent:"#66f3c0",ready:false,lockedAtMs:0},hunter:{pets:[],activeId:""},profession:{id:"",level:1,xp:0},materials:{},consumables:[],activeBuffs:[],companions:{pets:[],activeId:""},talents:{},actionBars:{},tutorialDone:false,lastClassChange:0};
    return normalizeCharacterData(character,index);
  }
  function normalizeCharacterData(data,index=0){
    data ||= {};data.id=String(data.id||uid());data.name=normalizeDungeonCharacterName(data.name,`${accountPlayerName()} ${index+1}`);data.nameChosen=data.nameChosen==null?!!data.appearance?.ready:!!data.nameChosen;
    data.level = clamp(Math.floor(Number(data.level) || 1), 1, MAX_LEVEL);
    data.xp = Math.max(0, Math.floor(Number(data.xp) || 0));
    data.totalXp = Math.max(data.xp, Math.floor(Number(data.totalXp) || data.xp));
    data.gold = Math.max(0, Math.floor(Number(data.gold) || 1500));
    data.role = ROLES[data.role] ? data.role : "tank";
    data.classId = CLASSES[data.classId]?.role === data.role ? data.classId : Object.keys(CLASSES).find(id => CLASSES[id].role === data.role) || "guardian";
    data.inventory = Array.isArray(data.inventory) ? data.inventory.slice(0, MAX_INVENTORY) : starterInventory(data.classId);
    data.equipped ||= {};
    SLOT_KEYS.forEach(slot => { const found=data.inventory.find(item=>item.uid===data.equipped[slot]&&item.slot===slot);if(!found)data.equipped[slot]=data.inventory.find(item=>item.slot===slot&&item.classId===data.classId)?.uid||""; });
    data.bestDungeon ||= {};data.completed ||= {};data.stats ||= { kills:0,bosses:0,chests:0,runs:0,deaths:0 };data.shop ||= {generatedAt:0,stock:[]};data.settings ||= {sound:true,particles:"high",damageNumbers:true};
    data.appearance ||= {gender:"male",skin:"medium",hair:"dark",preset:"human",hairStyle:"short",accent:"#66f3c0",ready:false};
    data.appearance.gender=["male","female"].includes(data.appearance.gender)?data.appearance.gender:"male";data.appearance.skin=["light","medium","dark"].includes(data.appearance.skin)?data.appearance.skin:"medium";data.appearance.hair=["dark","brown","blond","silver"].includes(data.appearance.hair)?data.appearance.hair:"dark";
    data.appearance.preset=PRESET_MIGRATION[data.appearance.preset]||data.appearance.preset;data.appearance.preset=CHARACTER_PRESETS.some(p=>p.id===data.appearance.preset)?data.appearance.preset:"human";data.appearance.hairStyle=["short","long","mohawk","braid","hooded"].includes(data.appearance.hairStyle)?data.appearance.hairStyle:"short";data.appearance.accent=/^#[0-9a-f]{6}$/i.test(String(data.appearance.accent||""))?data.appearance.accent:presetById(data.appearance.preset).accent;data.appearance.ready=!!data.appearance.ready;data.appearance.lockedAtMs=Math.max(0,Math.floor(Number(data.appearance.lockedAtMs)||0));if(data.appearance.ready&&!data.appearance.lockedAtMs)data.appearance.lockedAtMs=Date.now();
    ensureHunterData(data);ensureProfessionData(data);data.talents ||= {};for(const role of Object.keys(TALENT_TREES))for(const branch of TALENT_TREES[role])for(const node of branch.nodes)if(data.talents[node.id]!=null)data.talents[node.id]=clamp(Math.floor(Number(data.talents[node.id])||0),0,node.max);
    ensureActionBarData(data);data.tutorialDone=!!data.tutorialDone;data.lastClassChange ||= 0;return data;
  }
  function ensureDungeonRoot(){
    const app=getAppState();if(!app)return null;app.dungeonKl ||= {};const root=app.dungeonKl;root.version=VERSION;
    if(!Array.isArray(root.characters)){const legacy={};for(const [key,value] of Object.entries(root))if(!["characters","activeCharacterId","version"].includes(key))legacy[key]=value;root.characters=[normalizeCharacterData(legacy,0)];root.activeCharacterId=root.characters[0].id;}
    root.characters=root.characters.slice(0,MAX_CHARACTERS).map((character,index)=>normalizeCharacterData(character,index));
    if(!root.characters.length)root.characters.push(createCharacterData(0));
    if(!root.characters.some(c=>c.id===root.activeCharacterId))root.activeCharacterId=root.characters[0].id;return root;
  }
  function ensureState(){const root=ensureDungeonRoot();if(!root)return null;const data=root.characters.find(c=>c.id===root.activeCharacterId)||root.characters[0];storeBackup({activeCharacterId:root.activeCharacterId,character:data});return data;}
  function selectCharacter(id){const root=ensureDungeonRoot();if(!root?.characters.some(c=>c.id===id))return false;root.activeCharacterId=id;safeSave();updateHead();return true;}
  function deleteCharacter(id){const root=ensureDungeonRoot();if(!root)return;if(!confirm("Diesen Dungeon.KL-Charakter mit Level, Inventar und Fortschritt endgültig löschen?"))return;root.characters=root.characters.filter(c=>c.id!==id);if(!root.characters.length)root.characters.push(createCharacterData(0));root.activeCharacterId=root.characters[0].id;safeSave();renderCharacterSelect();}
  function equippedItem(slot,data=ensureState()) { return data?.inventory?.find(item => item.uid === data.equipped?.[slot]) || null; }
  function playerStats(data=ensureState()) {
    const d = data || ensureState();
    if(!d) return {health:1,damage:1,healing:0,armor:0,crit:.05,haste:0,power:1,cooldownReduction:0,shieldBonus:0,moveBonus:0};
    const role = ROLES[d.role] || ROLES.dps, level=clamp(Math.floor(finite(d.level,1)),1,MAX_LEVEL);
    const items = SLOT_KEYS.map(slot=>equippedItem(slot,d)).filter(Boolean), talents=talentBonuses(d);
    const sum = key => items.reduce((total, item) => total + finite(item?.[key],0), 0);
    const levelScale = 80 + level * 26 + Math.pow(level, 1.35) * 7;
    const buffs=activeBuffTotals(d);
    const health = Math.max(1,Math.round((levelScale * finite(role.hp,1) + sum("health")) * (1 + finite(talents.health,0) + finite(buffs.healthPct,0))));
    const damage = Math.max(1,Math.round((18 + level * 5.1 + sum("damage")) * finite(role.damage,1) * (1 + finite(talents.damage,0) + finite(buffs.damagePct,0))));
    const healing = Math.max(0,Math.round((8 + level * 3.2 + sum("healing")) * finite(role.heal,.18) * (1 + finite(talents.healing,0) + finite(buffs.healingPct,0))));
    const armor = clamp(finite(role.armor,0) + sum("armor") / Math.max(1200, levelScale * 8) + finite(talents.armor,0) + finite(buffs.armorPct,0), 0, .72);
    const crit = clamp(.05 + sum("crit") / 100 + finite(talents.crit,0), .05, .55);
    const haste = clamp(sum("haste") / 100 + finite(talents.haste,0), 0, .62);
    const rawPower = level * 80 + items.reduce((total, item) => total + Math.max(0,finite(item?.power,0)), 0);
    const power = Math.max(1,Math.round(rawPower * (1 + finite(talents.power,0)) + health*.08 + damage*1.3 + healing*.8 + finite(buffs.powerFlat,0)));
    return { health, damage, healing, armor, crit, haste, power, cooldownReduction:clamp(finite(talents.cooldown,0),0,.35), shieldBonus:finite(talents.shield,0), moveBonus:finite(talents.move,0) };
  }
  function addXp(amount) {
    const d = ensureState(), rewardedXp = Math.max(0, Math.round((Number(amount) || 0) * XP_REWARD_MULTIPLIER));
    d.xp += rewardedXp; d.totalXp += rewardedXp;
    while (d.level < MAX_LEVEL && d.xp >= levelNeed(d.level)) { d.xp -= levelNeed(d.level); d.level++; toast("Levelaufstieg", `Dungeon-Level ${d.level} erreicht.`); }
    safeSave(); updateHead();
  }
  function addItem(item, message = true) {
    const d = ensureState(); if (d.inventory.length >= MAX_INVENTORY) { d.gold += Math.round(item.value * .25); if (message) toast("Inventar voll", `${item.name} automatisch verkauft.`); return false; }
    d.inventory.unshift(item); if (message) toast("Beute gefunden", `${item.name} · ${RARITIES[item.rarity].name} · Level ${item.level}`); safeSave(); return true;
  }

  function skinColor(name,raceId="human"){
    const palettes={
      human:{light:"#efbc9c",medium:"#c98e72",dark:"#80513c"},
      hornborn:{light:"#b98a62",medium:"#78563f",dark:"#3d3430"},
      revenant:{light:"#b5b9ad",medium:"#7e9484",dark:"#52645b"},
      warborn:{light:"#7ea56a",medium:"#547c4d",dark:"#35563b"},
      sylvan:{light:"#efc2a0",medium:"#c59175",dark:"#795343"},
      ironkin:{light:"#e7ae8a",medium:"#b87b5d",dark:"#744735"},
      drakeborn:{light:"#6f9a9d",medium:"#456f78",dark:"#293f4b"},
      voidkin:{light:"#9891bd",medium:"#685c91",dark:"#40345f"}
    };
    return palettes[raceId]?.[name]||palettes.human[name]||palettes.human.medium;
  }
  function hairColor(name){return name==="brown"?"#70462f":name==="blond"?"#d9ad55":name==="silver"?"#c8d0d6":"#241b1a";}
  function gearVisualFromState(data=ensureState()){
    const item=slot=>data.inventory.find(x=>x.uid===data.equipped[slot])||null;
    const chest=item("chest"),helmet=item("helmet"),gloves=item("gloves"),boots=item("boots"),weapon=item("weapon"),offhand=item("offhand");
    const rarity=item=>RARITIES[item?.rarity]?.color||"#9fb0b8";
    const helmetName=String(helmet?.name||"").toLowerCase(), weaponName=String(weapon?.name||"").toLowerCase();
    const helmetType=/titanen|militär|visier|helm/.test(helmetName)?"helmet":/kapuze|hood/.test(helmetName)?"hood":/krone/.test(helmetName)?"crown":"none";
    const weaponModule=/nexus|universe|stern/.test(weaponName)?"cosmic":/chaos|leeren/.test(weaponName)?"void":/frost|eis/.test(weaponName)?"frost":/sonnen|licht/.test(weaponName)?"holy":"steel";
    return {armor:rarity(chest),trim:rarity(weapon),helmet:rarity(helmet),gloves:rarity(gloves),boots:rarity(boots),weapon:rarity(weapon),offhand:rarity(offhand),helmetType,weaponModule,weaponName:weapon?.name||"",chestName:chest?.name||"",helmetName:helmet?.name||"",weaponRarity:weapon?.rarity||"common",chestRarity:chest?.rarity||"common"};
  }
  function currentAppearance(){const d=ensureState();return {...d.appearance};}
  function characterPreviewHtml(extra=""){
    return `<canvas class="dkl-character-canvas ${extra}" width="420" height="520" data-dkl-character-preview></canvas>`;
  }
  function drawCharacterWeaponModel(ctx,c,g,side=1,casting=false,attack=false,scale=1,anchor=null){
    const color=g.weapon||c.color,module=g.weaponModule||"steel",swing=attack*(side>0?-.38:.38),ax=anchor&&Number.isFinite(anchor.x)?anchor.x:side*31*scale,ay=anchor&&Number.isFinite(anchor.y)?anchor.y:-45*scale;
    ctx.save();ctx.translate(ax,ay);ctx.rotate(swing);ctx.shadowColor=color;ctx.shadowBlur=module==="steel"?5:18;
    if(c.weaponType==="bow"){
      ctx.strokeStyle=color;ctx.lineWidth=4*scale;ctx.beginPath();ctx.arc(0,0,25*scale,-Math.PI/2,Math.PI/2);ctx.stroke();ctx.strokeStyle="#eaf5f6";ctx.lineWidth=1.5*scale;ctx.beginPath();ctx.moveTo(0,-25*scale);ctx.lineTo(0,25*scale);ctx.stroke();
    }else if(c.weaponType==="tome"){
      ctx.fillStyle="#21152d";ctx.strokeStyle=color;ctx.lineWidth=2*scale;ctx.beginPath();ctx.roundRect(-15*scale,-19*scale,30*scale,38*scale,4*scale);ctx.fill();ctx.stroke();ctx.fillStyle=color;ctx.fillRect(-2*scale,-18*scale,4*scale,36*scale);
    }else if(c.projectile){
      ctx.strokeStyle=color;ctx.lineWidth=6*scale;ctx.beginPath();ctx.moveTo(0,-32*scale);ctx.lineTo(0,32*scale);ctx.stroke();ctx.fillStyle="#eefcff";ctx.beginPath();ctx.arc(0,-36*scale,(casting?10:7)*scale,0,Math.PI*2);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=3*scale;ctx.beginPath();ctx.arc(0,-36*scale,(casting?17:12)*scale,0,Math.PI*2);ctx.stroke();
    }else{
      ctx.strokeStyle=color;ctx.lineWidth=7*scale;ctx.beginPath();ctx.moveTo(-5*scale,-34*scale);ctx.lineTo(7*scale,34*scale);ctx.stroke();ctx.strokeStyle="#8b5d36";ctx.lineWidth=5*scale;ctx.beginPath();ctx.moveTo(-7*scale,8*scale);ctx.lineTo(8*scale,13*scale);ctx.stroke();
    }
    if(module!=="steel"){ctx.fillStyle=color;for(let i=0;i<4;i++){ctx.globalAlpha=.45+i*.12;ctx.beginPath();ctx.arc(Math.sin(i*1.9)*10*scale,(-38-i*8)*scale,(2+i*.5)*scale,0,Math.PI*2);ctx.fill();}}
    ctx.restore();
  }
  function drawFantasyCharacterSide(ctx,{a,preset,race,c,role,g,now,wide,walk,attack,casting,skin,hair,accent,armor,trim,portrait}){
    const short=race==="ironkin",bodyScale=wide*(race==="hornborn"?1.08:1),headY=-82,torsoTop=-68,torsoBottom=-22,legLen=short?25:35,stride=Math.sin(walk)*4.2,lift=Math.max(0,Math.cos(walk))*2.2;
    if(!portrait){ctx.fillStyle="#0009";ctx.beginPath();ctx.ellipse(0,8,25*wide,9,0,0,Math.PI*2);ctx.fill();}
    // Cape konsequent hinter Rücken und Beinen.
    if(role==="healer"||c.weaponType==="staff"||c.weaponType==="tome"||race==="sylvan"||race==="voidkin"){ctx.fillStyle=`${accent}b5`;ctx.strokeStyle=trim;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-10*bodyScale,torsoTop+5);ctx.quadraticCurveTo(-31*bodyScale,torsoBottom+4,-26*bodyScale,torsoBottom+legLen+15);ctx.lineTo(-7*bodyScale,torsoBottom+legLen+7);ctx.lineTo(-3*bodyScale,torsoTop+8);ctx.closePath();ctx.fill();ctx.stroke();}
    if(race==="drakeborn"||race==="hornborn"){ctx.strokeStyle=race==="drakeborn"?skin:"#342925";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-9,-25);ctx.quadraticCurveTo(-34,-8,-39,9);ctx.stroke();}
    const drawSideLeg=(front)=>{const dir=front?1:-1,hipX=front?5:-4,kneeX=dir*(5+stride*.55),footX=dir*(17+stride),kneeY=torsoBottom+legLen*.48+(front?lift:0),footY=torsoBottom+legLen+(front?0:lift*.5);ctx.strokeStyle=front?"#18242c":"#111920";ctx.lineWidth=(short?13:11)*bodyScale;ctx.beginPath();ctx.moveTo(hipX,torsoBottom);ctx.lineTo(kneeX,kneeY);ctx.lineTo(footX,footY);ctx.stroke();ctx.strokeStyle=g.boots||armor;ctx.lineWidth=(short?10:8)*bodyScale;ctx.beginPath();ctx.moveTo(footX-2,footY);ctx.lineTo(footX+11,footY+2);ctx.stroke();};
    drawSideLeg(false);
    ctx.strokeStyle=g.gloves||skin;ctx.lineWidth=(race==="hornborn"?13:9)*bodyScale;ctx.beginPath();ctx.moveTo(-4,torsoTop+10);ctx.lineTo(-9,torsoBottom-1-Math.sin(walk)*2);ctx.stroke();
    const profileW=(race==="hornborn"?18:race==="ironkin"?16:13)*bodyScale;ctx.shadowColor=armor;ctx.shadowBlur=13;const grad=ctx.createLinearGradient(-profileW,0,profileW,0);grad.addColorStop(0,"#111820");grad.addColorStop(.55,armor);grad.addColorStop(1,trim);ctx.fillStyle=grad;ctx.strokeStyle=trim;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-profileW,torsoTop+2);ctx.quadraticCurveTo(profileW+7,torsoTop+8,profileW,torsoBottom);ctx.lineTo(-profileW+4,torsoBottom);ctx.quadraticCurveTo(-profileW-5,torsoTop+24,-profileW,torsoTop+2);ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle="#10171dbb";ctx.fillRect(-profileW+2,torsoBottom-9,profileW*2-2,6);ctx.fillStyle=trim;ctx.fillRect(-profileW+3,torsoTop+19,profileW*1.75,4);
    drawSideLeg(true);
    ctx.fillStyle=g.helmet||armor;ctx.strokeStyle=trim;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-4,torsoTop+3);ctx.lineTo(17*bodyScale,torsoTop+8);ctx.lineTo(13*bodyScale,torsoTop+20);ctx.lineTo(-2,torsoTop+16);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle=g.gloves||skin;ctx.lineWidth=(race==="hornborn"?14:10)*bodyScale;ctx.beginPath();ctx.moveTo(7,torsoTop+12);ctx.lineTo(14,torsoBottom+(attack?11:Math.sin(walk)*2));ctx.stroke();
    ctx.fillStyle=skin;ctx.strokeStyle="#151a1f";ctx.lineWidth=2;ctx.beginPath();if(race==="drakeborn"){ctx.moveTo(-11,headY-13);ctx.lineTo(12,headY-14);ctx.lineTo(23,headY-1);ctx.lineTo(9,headY+14);ctx.lineTo(-10,headY+10);ctx.closePath();}else if(race==="hornborn"){ctx.ellipse(0,headY,16*wide,19,0,0,Math.PI*2);}else{ctx.ellipse(0,headY,(race==="warborn"?14:12)*wide,16,0,0,Math.PI*2);}ctx.fill();ctx.stroke();
    if(race==="hornborn"){ctx.fillStyle="#2a2220";ctx.beginPath();ctx.ellipse(11*wide,headY+7,12*wide,7,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#c78b42";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-6,headY-11);ctx.quadraticCurveTo(-24,headY-28,-34,headY-10);ctx.stroke();}else if(race==="warborn"){ctx.fillStyle="#eee0b6";ctx.beginPath();ctx.moveTo(11,headY+8);ctx.lineTo(19,headY+16);ctx.lineTo(10,headY+13);ctx.fill();}else{ctx.fillStyle=hair;ctx.beginPath();ctx.arc(-2,headY-5,13*wide,Math.PI,Math.PI*2);ctx.lineTo(8,headY);ctx.lineTo(-13,headY);ctx.fill();}
    if(g.helmetType==="hood"){ctx.fillStyle=g.helmet||armor;ctx.beginPath();ctx.arc(-2,headY-2,19*wide,Math.PI,Math.PI*2);ctx.lineTo(12,headY+12);ctx.lineTo(-14,headY+12);ctx.closePath();ctx.fill();}else if(g.helmetType==="helmet"){ctx.fillStyle=g.helmet||armor;ctx.beginPath();ctx.arc(-2,headY-2,17*wide,Math.PI,Math.PI*2);ctx.lineTo(12,headY+3);ctx.lineTo(-13,headY+3);ctx.closePath();ctx.fill();ctx.stroke();}
    const eyeColor=race==="revenant"?"#8cffbe":race==="voidkin"?"#d88cff":race==="drakeborn"?"#77efff":"#15181b";ctx.fillStyle=eyeColor;ctx.shadowColor=eyeColor;ctx.shadowBlur=(race==="revenant"||race==="voidkin"||race==="drakeborn")?10:0;ctx.beginPath();ctx.arc(7*wide,headY-2,2.2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle=skin;ctx.beginPath();ctx.moveTo(10*wide,headY+1);ctx.lineTo(18*wide,headY+5);ctx.lineTo(10*wide,headY+7);ctx.fill();
    if(role==="tank"){ctx.save();ctx.translate(-24,-43);ctx.fillStyle=g.offhand||"#496a7c";ctx.strokeStyle=trim;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,11,23,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}
    const sideHandX=(c.weaponType==="bow"?12:10)*bodyScale;
    const sideHandY=(c.projectile||c.weaponType==="tome"?-22:-18)*bodyScale;
    const sideWeaponAnchor={x:sideHandX,y:sideHandY};
    ctx.save();drawCharacterWeaponModel(ctx,c,g,1,casting,attack,1,sideWeaponAnchor);ctx.restore();
  }

  function drawFantasyCharacter(ctx,opts={}){
    const a=opts.appearance||currentAppearance(),preset=presetById(a.preset),race=preset.race||preset.id,c=CLASSES[opts.classId]||CLASSES[ensureState()?.classId]||CLASSES.guardian,role=opts.role||c.role,g=opts.gear||gearVisualFromState(),now=opts.now||performance.now(),scale=(opts.scale||1)*(preset.height||1),wide=preset.width||1,walk=opts.walk||0,attack=!!opts.attack,casting=!!opts.casting,side=opts.side||1,portrait=!!opts.portrait,facing=opts.facing||"front",isBack=facing==="back",isSide=facing==="left"||facing==="right";
    const skin=skinColor(a.skin,race),hair=hairColor(a.hair),accent=a.accent||preset.accent,armor=g.armor||accent,trim=g.trim||accent;
    const bodyW=22*wide,shoulder=bodyW+10+(role==="tank"?7:0),headY=-83,torsoTop=-70,torsoBottom=-22,legSwing=Math.sin(walk)*5;
    ctx.save();ctx.scale(scale,scale);if(facing==="left")ctx.scale(-1,1);ctx.lineCap="round";ctx.lineJoin="round";
    if(isSide){drawFantasyCharacterSide(ctx,{a,preset,race,c,role,g,now,wide,walk,attack,casting,skin,hair,accent,armor,trim,portrait});ctx.restore();return;}
    if(!portrait){ctx.fillStyle="#0009";ctx.beginPath();ctx.ellipse(0,5,32*wide,10,0,0,Math.PI*2);ctx.fill();}
    if(race==="drakeborn"||race==="hornborn"){
      ctx.strokeStyle=race==="drakeborn"?skin:"#342925";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-3,-25);ctx.quadraticCurveTo(-30,-8,-37,8);ctx.stroke();ctx.fillStyle=race==="drakeborn"?accent:"#6a5140";ctx.beginPath();ctx.moveTo(-38,8);ctx.lineTo(-47,0);ctx.lineTo(-42,15);ctx.fill();
    }
    if(role==="healer"||c.weaponType==="staff"||c.weaponType==="tome"||race==="sylvan"||race==="voidkin"){
      ctx.fillStyle=`${accent}66`;ctx.strokeStyle=trim;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-bodyW+4,torsoTop+8);ctx.lineTo(-bodyW-10,torsoBottom+22);ctx.lineTo(0,7);ctx.lineTo(bodyW+10,torsoBottom+22);ctx.lineTo(bodyW-4,torsoTop+8);ctx.closePath();ctx.fill();ctx.stroke();
    }
    const short=race==="ironkin";const legLen=short?26:35,stride=clamp(legSwing,-4.2,4.2),kneeY=torsoBottom+legLen*.48,footY=torsoBottom+legLen;
    const drawFrontLeg=(dir)=>{const hipX=dir*8*wide,kneeX=(dir*8+stride*dir*.42)*wide,footX=(dir*11+stride*dir)*wide;ctx.strokeStyle=dir<0?"#172129":"#1b2831";ctx.lineWidth=(short?13:11)*wide;ctx.beginPath();ctx.moveTo(hipX,torsoBottom);ctx.lineTo(kneeX,kneeY);ctx.lineTo(footX,footY);ctx.stroke();ctx.strokeStyle=g.boots||armor;ctx.lineWidth=(short?11:8)*wide;ctx.beginPath();ctx.moveTo(footX,footY);ctx.lineTo(footX+dir*10*wide,footY+2);ctx.stroke();};
    drawFrontLeg(-1);drawFrontLeg(1);
    if(race==="hornborn"){ctx.fillStyle="#231d1a";ctx.beginPath();ctx.moveTo(-22*wide,torsoBottom+legLen+1);ctx.lineTo(-8*wide,torsoBottom+legLen-6);ctx.lineTo(-13*wide,torsoBottom+legLen+8);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(22*wide,torsoBottom+legLen+1);ctx.lineTo(8*wide,torsoBottom+legLen-6);ctx.lineTo(13*wide,torsoBottom+legLen+8);ctx.closePath();ctx.fill();}
    ctx.shadowColor=armor;ctx.shadowBlur=14;const grad=ctx.createLinearGradient(-bodyW,0,bodyW,0);grad.addColorStop(0,"#101820");grad.addColorStop(.35,armor);grad.addColorStop(.65,armor);grad.addColorStop(1,"#101820");ctx.fillStyle=grad;ctx.strokeStyle=trim;ctx.lineWidth=2.5;
    ctx.beginPath();ctx.moveTo(-bodyW,torsoTop);ctx.quadraticCurveTo(-bodyW-7,torsoTop+22,-bodyW+1,torsoBottom);ctx.lineTo(bodyW-1,torsoBottom);ctx.quadraticCurveTo(bodyW+7,torsoTop+22,bodyW,torsoTop);ctx.quadraticCurveTo(0,torsoTop-13,-bodyW,torsoTop);ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle="#10171d99";ctx.fillRect(-bodyW+2,torsoBottom-9,bodyW*2-4,7);ctx.fillStyle=trim;ctx.fillRect(-bodyW+4,torsoTop+19,bodyW*2-8,4);
    for(const sx0 of [-1,1]){ctx.save();ctx.scale(sx0,1);ctx.fillStyle=g.helmet||armor;ctx.strokeStyle=trim;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(bodyW-3,torsoTop+2);ctx.lineTo(shoulder+8,torsoTop+8);ctx.lineTo(shoulder+3,torsoTop+22);ctx.lineTo(bodyW-4,torsoTop+17);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
    const armSwing=attack?12:Math.sin(walk)*3;ctx.strokeStyle=g.gloves||skin;ctx.lineWidth=(race==="hornborn"?14:10)*wide;ctx.beginPath();ctx.moveTo(-shoulder+5,torsoTop+13);ctx.lineTo(-shoulder-7,torsoBottom-2+armSwing);ctx.moveTo(shoulder-5,torsoTop+13);ctx.lineTo(shoulder+7,torsoBottom-2-armSwing);ctx.stroke();
    if(race==="revenant"){ctx.strokeStyle="#d3d7c7";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-bodyW+5,torsoTop+10);ctx.lineTo(bodyW-5,torsoBottom-5);ctx.moveTo(bodyW-5,torsoTop+10);ctx.lineTo(-bodyW+5,torsoBottom-5);ctx.stroke();}
    if(isBack){ctx.fillStyle=`${accent}bb`;ctx.strokeStyle=trim;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-shoulder+2,torsoTop+7);ctx.quadraticCurveTo(-bodyW-10,torsoBottom+18,-bodyW-4,torsoBottom+legLen+10);ctx.quadraticCurveTo(0,torsoBottom+legLen+19,bodyW+4,torsoBottom+legLen+10);ctx.quadraticCurveTo(bodyW+10,torsoBottom+18,shoulder-2,torsoTop+7);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle=`${trim}aa`;ctx.beginPath();ctx.moveTo(0,torsoTop+8);ctx.lineTo(0,torsoBottom+legLen+12);ctx.stroke();}
    ctx.fillStyle=skin;ctx.strokeStyle="#151a1f";ctx.lineWidth=2;
    if(race==="hornborn"){ctx.beginPath();ctx.ellipse(0,headY,17*wide,19,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle="#2a2220";ctx.beginPath();ctx.ellipse(0,headY+10,13*wide,8,0,0,Math.PI*2);ctx.fill();}
    else if(race==="drakeborn"){ctx.beginPath();ctx.moveTo(-14,headY-12);ctx.lineTo(11,headY-15);ctx.lineTo(18,headY+1);ctx.lineTo(6,headY+16);ctx.lineTo(-13,headY+11);ctx.lineTo(-18,headY-2);ctx.closePath();ctx.fill();ctx.stroke();}
    else{ctx.beginPath();ctx.ellipse(0,headY,(race==="warborn"?15:13)*wide,race==="revenant"?17:16,0,0,Math.PI*2);ctx.fill();ctx.stroke();}
    if(race==="hornborn"){
      ctx.strokeStyle="#c78b42";ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(-11*wide,headY-9);ctx.quadraticCurveTo(-29*wide,headY-25,-39*wide,headY-10);ctx.moveTo(11*wide,headY-9);ctx.quadraticCurveTo(29*wide,headY-25,39*wide,headY-10);ctx.stroke();ctx.strokeStyle="#f0bb67";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-38*wide,headY-10);ctx.lineTo(-44*wide,headY-4);ctx.moveTo(38*wide,headY-10);ctx.lineTo(44*wide,headY-4);ctx.stroke();
    }else if(race==="sylvan"){
      ctx.fillStyle=skin;ctx.beginPath();ctx.moveTo(-10,headY-5);ctx.lineTo(-29,headY-12);ctx.lineTo(-12,headY+4);ctx.fill();ctx.beginPath();ctx.moveTo(10,headY-5);ctx.lineTo(29,headY-12);ctx.lineTo(12,headY+4);ctx.fill();
    }else if(race==="drakeborn"){
      ctx.strokeStyle=accent;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-8,headY-11);ctx.lineTo(-17,headY-28);ctx.moveTo(8,headY-11);ctx.lineTo(17,headY-28);ctx.stroke();
    }
    if(race==="warborn"){ctx.fillStyle="#eee0b6";ctx.beginPath();ctx.moveTo(-7,headY+10);ctx.lineTo(-3,headY+22);ctx.lineTo(0,headY+9);ctx.fill();ctx.beginPath();ctx.moveTo(7,headY+10);ctx.lineTo(3,headY+22);ctx.lineTo(0,headY+9);ctx.fill();}
    if(g.helmetType==="hood"){ctx.fillStyle=g.helmet||armor;ctx.beginPath();ctx.arc(0,headY-2,20*wide,Math.PI,Math.PI*2);ctx.lineTo(15*wide,headY+13);ctx.lineTo(-15*wide,headY+13);ctx.closePath();ctx.fill();}
    else if(g.helmetType==="helmet"){ctx.fillStyle=g.helmet||armor;ctx.strokeStyle=trim;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,headY-2,18*wide,Math.PI,Math.PI*2);ctx.lineTo(15*wide,headY+3);ctx.lineTo(-15*wide,headY+3);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle="#11191f";ctx.fillRect(-11*wide,headY-4,22*wide,5);}
    else if(g.helmetType==="crown"){ctx.fillStyle=g.helmet||"#ffd45a";ctx.beginPath();ctx.moveTo(-14,headY-15);ctx.lineTo(-9,headY-31);ctx.lineTo(0,headY-20);ctx.lineTo(9,headY-32);ctx.lineTo(14,headY-15);ctx.closePath();ctx.fill();}
    else if(race!=="hornborn"&&race!=="drakeborn"){
      ctx.fillStyle=hair;ctx.beginPath();ctx.arc(0,headY-5,14*wide,Math.PI,Math.PI*2);ctx.lineTo(12*wide,headY);ctx.lineTo(-12*wide,headY);ctx.fill();if(a.hairStyle==="long"||a.hairStyle==="braid"){ctx.fillRect(-13*wide,headY-6,5,27);ctx.fillRect(8*wide,headY-6,5,a.hairStyle==="braid"?36:27);}if(a.hairStyle==="mohawk"){ctx.beginPath();ctx.moveTo(-4,headY-16);ctx.lineTo(0,headY-38);ctx.lineTo(5,headY-16);ctx.fill();}
    }
    if(race==="ironkin"){ctx.fillStyle=hair;ctx.beginPath();ctx.moveTo(-12,headY+7);ctx.quadraticCurveTo(0,headY+31,12,headY+7);ctx.lineTo(8,headY+28);ctx.lineTo(0,headY+38);ctx.lineTo(-8,headY+28);ctx.closePath();ctx.fill();}
    const eyeColor=race==="revenant"?"#8cffbe":race==="voidkin"?"#d88cff":race==="drakeborn"?"#77efff":"#15181b";if(!isBack){ctx.fillStyle=eyeColor;ctx.shadowColor=eyeColor;ctx.shadowBlur=(race==="revenant"||race==="voidkin"||race==="drakeborn")?10:0;ctx.beginPath();if(isSide){ctx.arc(7*wide,headY-1,2.2,0,Math.PI*2);ctx.moveTo(13*wide,headY+3);ctx.lineTo(18*wide,headY+5);ctx.lineTo(13*wide,headY+7);}else{ctx.arc(-5*wide,headY-1,2,0,Math.PI*2);ctx.arc(5*wide,headY-1,2,0,Math.PI*2);}ctx.fill();ctx.shadowBlur=0;}else{ctx.strokeStyle=hair;ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,headY-3,11*wide,Math.PI,Math.PI*2);ctx.stroke();}
    if(race==="voidkin"){ctx.strokeStyle=accent;ctx.globalAlpha=.7;ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(Math.sin(now*.002+i*2.1)*34,headY+Math.cos(now*.002+i)*25,3+i,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;}
    drawCharacterWeaponModel(ctx,c,g,isBack?-1:side,casting,attack,1);
    if(role==="tank"){ctx.save();ctx.translate(-side*35,-42);ctx.fillStyle=g.offhand||"#496a7c";ctx.strokeStyle=trim;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-27);ctx.lineTo(20,-17);ctx.lineTo(17,19);ctx.lineTo(0,30);ctx.lineTo(-17,19);ctx.lineTo(-20,-17);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
    ctx.restore();
  }
  function renderCharacterCanvases(root=UI.main){
    const d=ensureState();if(!d||!root)return;const preset=presetById(d.appearance.preset);
    root.querySelectorAll("[data-dkl-character-slot-preview]").forEach(canvas=>{
      const dungeonRoot=ensureDungeonRoot(),character=dungeonRoot?.characters.find(c=>c.id===canvas.dataset.dklCharacterSlotPreview);if(!character)return;const presetSlot=presetById(character.appearance.preset),ctx=canvas.getContext("2d",{alpha:true}),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);const aura=ctx.createRadialGradient(w*.5,h*.46,8,w*.5,h*.46,w*.42);aura.addColorStop(0,`${presetSlot.accent}30`);aura.addColorStop(.7,`${presetSlot.accent}08`);aura.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=aura;ctx.fillRect(0,0,w,h);ctx.fillStyle="rgba(0,0,0,.3)";ctx.beginPath();ctx.ellipse(w*.5,h*.84,w*.23,h*.04,0,0,Math.PI*2);ctx.fill();ctx.save();ctx.translate(w*.5,h*.82);drawFantasyCharacter(ctx,{appearance:character.appearance,gear:gearVisualFromState(character),classId:character.classId,role:character.role,scale:1.85,portrait:true,facing:"front",now:performance.now()});ctx.restore();
    });
    root.querySelectorAll("[data-dkl-character-preview]").forEach(canvas=>{
      const ctx=canvas.getContext("2d",{alpha:true}),w=canvas.width,h=canvas.height;
      ctx.clearRect(0,0,w,h);
      // Nur eine dezente, transparente Aura und Bodenschatten. Kein schwarzes Rechteck.
      const aura=ctx.createRadialGradient(w*.5,h*.46,8,w*.5,h*.46,w*.38);
      aura.addColorStop(0,`${preset.accent}24`);aura.addColorStop(.62,`${preset.accent}0b`);aura.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle=aura;ctx.beginPath();ctx.ellipse(w*.5,h*.47,w*.35,h*.39,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="rgba(0,0,0,.28)";ctx.beginPath();ctx.ellipse(w*.5,h*.77,w*.19,h*.035,0,0,Math.PI*2);ctx.fill();
      ctx.save();ctx.translate(w*.5,h*.77);drawFantasyCharacter(ctx,{appearance:d.appearance,gear:gearVisualFromState(d),classId:d.classId,role:d.role,scale:2.6,portrait:true,facing:UI.previewFacing||"front",now:performance.now()});ctx.restore();
    });
  }
  function refreshSessionLoadout(){
    const s=UI.session;if(!s)return;
    const data=ensureState(),stats=playerStats(data),p=s.player,hpRatio=p.maxHp?clamp(p.hp/p.maxHp,0,1):1;
    p.maxHp=stats.health;p.hp=Math.max(p.dead?0:1,Math.round(stats.health*hpRatio));p.damage=stats.damage;p.healing=stats.healing;p.armor=stats.armor;p.crit=stats.crit;p.haste=stats.haste;p.power=stats.power;p.cooldownReduction=stats.cooldownReduction||0;p.shieldBonus=stats.shieldBonus||0;p.moveBonus=stats.moveBonus||0;p.appearance={...data.appearance};p.gearVisual=gearVisualFromState(data);p.actionBar=ensureActionBarData(data).slice(0,6);stabilizeCombatActor(p,{maxHp:stats.health,damage:stats.damage,healing:stats.healing,power:stats.power});refreshHunterPetRuntime(p);
    const profile=companionPetProfile(data),oldPet=p.supportPet,nextPet=makeSupportPetRuntime(profile,{x:oldPet?.x??p.x,y:oldPet?.y??p.y,ownerId:p.uid,ownerLevel:data.level,ownerPower:stats.power});
    if(nextPet&&oldPet&&String(oldPet.id)===String(nextPet.id)){const ratio=Math.max(0,Math.min(1,finite(oldPet.hp,nextPet.maxHp)/Math.max(1,finite(oldPet.maxHp,nextPet.maxHp))));nextPet.x=finite(oldPet.x,nextPet.x);nextPet.y=finite(oldPet.y,nextPet.y);nextPet.netX=finite(oldPet.netX,nextPet.x);nextPet.netY=finite(oldPet.netY,nextPet.y);nextPet.hp=oldPet.dead?0:Math.max(1,Math.round(nextPet.maxHp*ratio));nextPet.dead=!!oldPet.dead;nextPet.shield=Math.max(0,finite(oldPet.shield,0));nextPet.attackCd=Math.max(0,finite(oldPet.attackCd,0));nextPet.lastDamageAt=finite(oldPet.lastDamageAt,performance.now());nextPet.regenAccumulator=Math.max(0,finite(oldPet.regenAccumulator,0));}
    p.supportPet=nextPet;
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
    UI.overlay.querySelector("[data-dkl-home]").addEventListener("click", () => UI.session ? showExitDialog() : renderCharacterSelect());
    UI.overlay.querySelector("[data-dkl-close]").addEventListener("click", () => UI.session ? showExitDialog() : returnToTopGames());
    window.addEventListener("keydown", onKeyDown); window.addEventListener("keyup", onKeyUp);
    updateHead(); renderCharacterSelect();
    if (!d.tutorialDone) setTimeout(showTutorial, 250);
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
  function appearancePresetCards(){
    const d=ensureState();
    return CHARACTER_PRESETS.map(p=>`<button class="dkl-race-card ${d.appearance.preset===p.id?"active":""}" data-dkl-preset="${p.id}" style="--preset:${p.accent}"><span>${p.icon}</span><div><b>${p.name}</b><small>${p.description}</small></div></button>`).join("");
  }
  function renderCharacterSelect(){
    stopSession(false);UI.view="characters";const root=ensureDungeonRoot();if(!root)return;
    const cards=Array.from({length:MAX_CHARACTERS},(_,index)=>{const character=root.characters[index];if(!character)return `<button class="dkl-character-slot empty" data-dkl-character-create><span>＋</span><b>Neuen Charakter erstellen</b><small>Freier Platz ${index+1} von ${MAX_CHARACTERS}</small></button>`;const stats=playerStats(character),preset=presetById(character.appearance.preset),active=character.id===root.activeCharacterId;return `<article class="dkl-character-slot ${active?"active":""}" style="--slot:${preset.accent}"><canvas width="280" height="330" data-dkl-character-slot-preview="${esc(character.id)}"></canvas><div><small>CHARAKTER ${index+1}</small><h2>${esc(character.nameChosen?character.name:"Name noch wählen")}</h2><b>${preset.name} · ${ROLES[character.role].name}</b><span>${CLASSES[character.classId].name}</span><em>Level ${character.level} · PWR ${NUMBER.format(stats.power)}</em></div><footer><button class="dkl-btn primary" data-dkl-character-play="${esc(character.id)}">${character.appearance.ready?"AUSWÄHLEN":"ERSTELLUNG FORTSETZEN"}</button><button class="dkl-btn danger" data-dkl-character-delete="${esc(character.id)}">Löschen</button></footer></article>`;}).join("");
    UI.main.innerHTML=`<div class="dkl-character-roster"><header><div><small>DUNGEON.KL · CHARAKTERE</small><h1>Wähle deinen Charakter</h1><p>Du kannst bis zu drei eigene Charaktere besitzen. Level, Inventar, Gold, Talente und Dungeon-Fortschritt werden für jeden Charakter getrennt gespeichert.</p></div><button class="dkl-btn" data-dkl-roster-exit>← Top Games</button></header><section>${cards}</section><footer><span>${root.characters.length}/${MAX_CHARACTERS} Charakterplätze belegt</span>${root.characters.length<MAX_CHARACTERS?`<button class="dkl-btn gold" data-dkl-character-create>＋ Neuen Charakter erstellen</button>`:""}</footer></div>`;
    UI.main.querySelector("[data-dkl-roster-exit]").addEventListener("click",returnToTopGames);
    UI.main.querySelectorAll("[data-dkl-character-play]").forEach(btn=>btn.addEventListener("click",()=>{if(!selectCharacter(btn.dataset.dklCharacterPlay))return;ensureState().appearance.ready?renderHome():renderCharacterStudio();}));
    UI.main.querySelectorAll("[data-dkl-character-delete]").forEach(btn=>btn.addEventListener("click",()=>deleteCharacter(btn.dataset.dklCharacterDelete)));
    UI.main.querySelectorAll("[data-dkl-character-create]").forEach(btn=>btn.addEventListener("click",()=>{const current=ensureDungeonRoot();if(current.characters.length>=MAX_CHARACTERS)return toast("Alle Plätze belegt","Maximal drei Charaktere sind möglich.");const character=createCharacterData(current.characters.length);current.characters.push(character);current.activeCharacterId=character.id;safeSave();renderCharacterStudio();}));
    renderCharacterCanvases();updateHead();
  }

  function renderCharacterStudio(){
    stopSession(false);const d=ensureState();if(d?.appearance?.ready){renderHome();return;}UI.view="character";const stats=playerStats(),preset=presetById(d.appearance.preset);
    UI.main.innerHTML=`<div class="dkl-character-select"><header><div><small>DUNGEON.KL · CHARAKTERAUSWAHL</small><h1>Erstelle deinen Helden</h1><p>Dieser Charakter besitzt später sein eigenes Level, Inventar, Gold, Talente und Dungeon-Fortschritt.</p></div><button class="dkl-btn" data-dkl-exit-game>← Top Games</button></header>
      <section class="dkl-character-select-grid"><aside class="dkl-race-list"><h3>Fantasy-Rassen</h3>${appearancePresetCards()}</aside>
      <article class="dkl-character-focus" style="--studio-accent:${preset.accent}">${characterPreviewHtml("studio")}<div class="dkl-character-summary"><b>${preset.name}</b><span>${ROLES[d.role].icon} ${ROLES[d.role].name} · ${CLASSES[d.classId].name}</span><small>Level ${d.level} · Power ${NUMBER.format(stats.power)}</small></div></article>
      <aside class="dkl-character-controls"><h3>Erscheinung</h3><label>Charaktername<input class="dkl-character-name" data-dkl-character-name minlength="2" maxlength="24" autocomplete="off" value="${d.nameChosen?esc(d.name):""}" placeholder="Eigenen Namen eingeben"></label><small class="dkl-name-hint">2–24 Zeichen · der Name gilt nur für diesen Dungeon.KL-Charakter.</small><label>Geschlecht<div><button data-dkl-studio-gender="male" class="${d.appearance.gender==="male"?"active":""}">Mann</button><button data-dkl-studio-gender="female" class="${d.appearance.gender==="female"?"active":""}">Frau</button></div></label><label>Farbvariante<div>${["light","medium","dark"].map(x=>`<button data-dkl-studio-skin="${x}" class="${d.appearance.skin===x?"active":""}">${x==="light"?"Hell":x==="dark"?"Dunkel":"Mittel"}</button>`).join("")}</div></label><label>Haare/Fell<div>${["dark","brown","blond","silver"].map(x=>`<button data-dkl-studio-hair="${x}" class="${d.appearance.hair===x?"active":""}">${x==="dark"?"Schwarz":x==="brown"?"Braun":x==="blond"?"Blond":"Silber"}</button>`).join("")}</div></label><label>Stil<div>${["short","long","mohawk","braid","hooded"].map(x=>`<button data-dkl-studio-hairstyle="${x}" class="${d.appearance.hairStyle===x?"active":""}">${x==="short"?"Kurz":x==="long"?"Lang":x==="mohawk"?"Iro":x==="braid"?"Zopf":"Kapuze"}</button>`).join("")}</div></label><label>Rüstungsakzent<input type="color" data-dkl-studio-accent value="${esc(d.appearance.accent)}"></label><div class="dkl-character-tools"><button class="dkl-btn" data-dkl-studio-inventory>Ausrüstung</button><button class="dkl-btn gold" data-dkl-skilltree>Skillbaum</button></div></aside></section>
      <section class="dkl-character-class-select"><header><small>ROLLE & KLASSE</small><h2>Bestimme deinen Kampfstil</h2></header>${roleClassCards()}</section>
      <footer class="dkl-character-confirm"><div><b>${preset.name} ist ausgewählt</b><small>Nach der Bestätigung ist Rasse, Optik, Rolle und Klasse dauerhaft festgelegt.</small></div><button class="dkl-btn primary" data-dkl-character-confirm>CHARAKTER ÜBERNEHMEN</button></footer></div>`;
    const redraw=()=>renderCharacterStudio();
    UI.main.querySelector("[data-dkl-exit-game]").addEventListener("click",returnToTopGames);
    UI.main.querySelector("[data-dkl-skilltree]").addEventListener("click",renderSkillTree);
    UI.main.querySelector("[data-dkl-studio-inventory]").addEventListener("click",renderInventory);
    UI.main.querySelector("[data-dkl-character-confirm]").addEventListener("click",()=>{const data=ensureState(),raw=UI.main.querySelector("[data-dkl-character-name]")?.value||"",name=normalizeDungeonCharacterName(raw,"");if(name.length<2)return toast("Name fehlt","Bitte gib einen Namen mit mindestens zwei Zeichen ein.");if(!dungeonCharacterNameAvailable(name,data.id))return toast("Name bereits vergeben","Wähle für deine drei Dungeon-Charaktere unterschiedliche Namen.");data.name=name;data.nameChosen=true;data.appearance.ready=true;data.appearance.lockedAtMs=Date.now();safeSave();renderCharacterSelect();});
    UI.main.querySelectorAll("[data-dkl-preset]").forEach(btn=>btn.addEventListener("click",()=>{const data=ensureState(),p=presetById(btn.dataset.dklPreset);data.appearance.preset=p.id;data.appearance.skin=p.skin;data.appearance.hair=p.hair;data.appearance.accent=p.accent;safeSave();redraw();}));
    UI.main.querySelectorAll("[data-dkl-studio-gender]").forEach(btn=>btn.addEventListener("click",()=>{ensureState().appearance.gender=btn.dataset.dklStudioGender;safeSave();redraw();}));
    UI.main.querySelectorAll("[data-dkl-studio-skin]").forEach(btn=>btn.addEventListener("click",()=>{ensureState().appearance.skin=btn.dataset.dklStudioSkin;safeSave();redraw();}));
    UI.main.querySelectorAll("[data-dkl-studio-hair]").forEach(btn=>btn.addEventListener("click",()=>{ensureState().appearance.hair=btn.dataset.dklStudioHair;safeSave();redraw();}));
    UI.main.querySelectorAll("[data-dkl-studio-hairstyle]").forEach(btn=>btn.addEventListener("click",()=>{ensureState().appearance.hairStyle=btn.dataset.dklStudioHairstyle;safeSave();redraw();}));
    UI.main.querySelector("[data-dkl-studio-accent]").addEventListener("input",e=>{ensureState().appearance.accent=e.target.value;safeSave();renderCharacterCanvases();});
    UI.main.querySelectorAll("[data-dkl-role]").forEach(el=>el.addEventListener("click",()=>{const data=ensureState(),roleId=el.dataset.dklRole;if(!ROLES[roleId])return;data.role=roleId;data.classId=Object.keys(CLASSES).find(id=>CLASSES[id].role===roleId)||"guardian";data.inventory=starterInventory(data.classId);data.equipped={};normalizeCharacterData(data);safeSave();redraw();}));
    UI.main.querySelectorAll("[data-dkl-class]").forEach(el=>el.addEventListener("click",()=>{const data=ensureState(),id=el.dataset.dklClass;if(!CLASSES[id]||CLASSES[id].role!==data.role)return;data.classId=id;data.inventory=starterInventory(data.classId);data.equipped={};normalizeCharacterData(data);safeSave();redraw();}));
    renderCharacterCanvases();updateHead();
  }
  function effectiveAbilityCooldown(data,info){
    if(!info)return 0;
    const stats=playerStats(data),base=Math.max(.5,Number(info.cooldown||0));
    if(info.kind==="holyshield")return 30;
    return Math.max(.5,base*(1-clamp((stats.cooldownReduction||0)+(stats.haste||0)*.12,0,.45)));
  }
  function abilityCooldownText(data,info){
    if(!info)return "";
    const base=Math.max(.5,Number(info.cooldown||0)),effective=effectiveAbilityCooldown(data,info);
    return Math.abs(base-effective)<.05?`${base.toFixed(1)} s Abklingzeit`:`${base.toFixed(1)} s Basis · ${effective.toFixed(1)} s aktuell`;
  }
  function renderSkillTree(){
    UI.view="skills";const d=ensureState(),available=talentPointsAvailable(d),total=talentPointsTotal(d),tree=talentTreeFor(d),bar=ensureActionBarData(d),catalog=abilityCatalog(d);
    const slots=bar.map((id,index)=>{const info=abilityInfo(d.classId,id);return `<button data-dkl-action-edit-slot="${index}" class="${UI.actionEditSlot===index?"selected":""} ${info?"":"empty"}"><span>${index+1}</span>${abilityArtHtml(info)}<b>${esc(info?.name||"Leer")}</b><small>${info?abilityCooldownText(d,info):"Fähigkeit auswählen"}</small></button>`;}).join("");
    const abilities=catalog.map(info=>{const unlocked=abilityUnlocked(d,info.id),active=bar.includes(info.id),cooldown=abilityCooldownText(d,info);return `<button data-dkl-action-ability="${esc(info.id)}" class="${unlocked?"unlocked":"locked"} ${active?"equipped":""}" ${unlocked?"":"disabled"}>${abilityArtHtml(info)}<div><b>${esc(info.name)}</b><small>${esc(info.description||"")}</small><em>${unlocked?(active?"In Aktionsleiste":"Verfügbar"):`Im Skillbaum freischalten`} · ${esc(cooldown)}</em></div></button>`;}).join("");
    UI.main.innerHTML=`<div class="dkl-skill-page"><header class="dkl-page-head"><button class="dkl-btn" data-dkl-back>← Charakter</button><div><small>SKILLBAUM & AKTIONSLEISTE</small><h2>${ROLES[d.role].icon} ${CLASSES[d.classId].name}</h2><p>Alle zwei Dungeon-Level erhältst du einen Talentpunkt. Neue Fähigkeiten können freigeschaltet und frei auf sechs Plätze gelegt werden.</p></div><div class="dkl-skill-points"><b>${available}</b><small>frei · ${total} gesamt</small></div></header>
      <section class="dkl-action-editor"><header><div><small>DEINE SECHS FELDER</small><h3>Aktionsleiste anpassen</h3><p>Wähle zuerst einen Platz und danach eine freigeschaltete Fähigkeit. Auch Wiederbelebung kann entfernt oder auf einen anderen Platz gelegt werden.</p></div><button class="dkl-btn danger" data-dkl-action-clear>Platz leeren</button></header><div class="dkl-action-editor-slots">${slots}</div><div class="dkl-action-library">${abilities}</div></section>
      <section class="dkl-skill-branches">${tree.map((branch,branchIndex)=>`<article style="--branch:${branchIndex}"><header><span>${branch.icon}</span><div><small>PFAD ${branchIndex+1}</small><h3>${branch.branch}</h3></div></header><div class="dkl-skill-nodes">${branch.nodes.map((node,index)=>{const rank=talentRank(d,node.id);return `<button data-dkl-talent="${node.id}" class="${rank?"active":""} ${rank>=node.max?"maxed":""}" style="--node:${index}"><span>${node.icon}</span><b>${node.name}</b><small>${node.text}</small><em>${rank}/${node.max}</em></button>`}).join("")}</div></article>`).join("")}</section><footer><button class="dkl-btn danger" data-dkl-talents-reset>Talente zurücksetzen</button><button class="dkl-btn primary" data-dkl-skills-inventory>Charakterfenster öffnen</button></footer></div>`;
    UI.main.querySelector("[data-dkl-back]").addEventListener("click",renderInventory);UI.main.querySelector("[data-dkl-skills-inventory]").addEventListener("click",renderInventory);
    UI.main.querySelectorAll("[data-dkl-action-edit-slot]").forEach(btn=>btn.addEventListener("click",()=>{UI.actionEditSlot=clamp(Number(btn.dataset.dklActionEditSlot)||0,0,5);renderSkillTree();}));
    UI.main.querySelectorAll("[data-dkl-action-ability]").forEach(btn=>btn.addEventListener("click",()=>{const data=ensureState(),id=btn.dataset.dklActionAbility;if(!abilityUnlocked(data,id))return toast("Fähigkeit gesperrt","Zuerst im Skillbaum freischalten.");setActionBarSlot(data,UI.actionEditSlot,id);renderSkillTree();}));
    UI.main.querySelector("[data-dkl-action-clear]").addEventListener("click",()=>{setActionBarSlot(ensureState(),UI.actionEditSlot,"");renderSkillTree();});
    UI.main.querySelectorAll("[data-dkl-talent]").forEach(btn=>btn.addEventListener("click",()=>{const data=ensureState(),node=talentTreeFor(data).flatMap(branch=>branch.nodes).find(n=>n.id===btn.dataset.dklTalent);if(!node)return;const rank=talentRank(data,node.id);if(rank>=node.max)return toast("Talent vollständig",node.name);if(talentPointsAvailable(data)<=0)return toast("Keine Talentpunkte","Alle zwei Level erhältst du einen neuen Punkt.");data.talents[node.id]=rank+1;safeSave();renderSkillTree();}));
    UI.main.querySelector("[data-dkl-talents-reset]").addEventListener("click",()=>{if(!confirm("Alle Talentpunkte dieser Rolle zurücksetzen? Freigeschaltete Fähigkeiten werden aus der Aktionsleiste entfernt."))return;const data=ensureState();for(const branch of talentTreeFor(data))for(const node of branch.nodes)delete data.talents[node.id];const bar=ensureActionBarData(data);data.actionBars[data.classId]=bar.map(id=>abilityUnlocked(data,id)?id:"");safeSave();renderSkillTree();});
    updateHead();
  }

  function renderHome() {
    stopSession(false);UI.view="home";const d=ensureState(),stats=playerStats(),dungeon=DUNGEONS.find(x=>x.id===UI.selectedDungeon)||DUNGEONS[0],preset=presetById(d.appearance.preset);
    UI.main.innerHTML=`<div class="dkl-game-portal" style="--portal:${dungeon.color}"><nav><button data-dkl-characters><span>◉</span><b>Charaktere</b></button><button data-dkl-inventory><span>▣</span><b>Ausrüstung</b></button><button data-dkl-skilltree><span>✦</span><b>Skillbaum</b></button><button data-dkl-shop><span>◆</span><b>Händler</b></button><button data-dkl-auction><span>⚖</span><b>Auktion</b></button></nav>
      <main><header><small>DUNGEON-AUSWAHL</small><h1>${esc(dungeon.name)}</h1><p>Level ${dungeon.level} · ${dungeon.rooms} Räume · 3 Bosskämpfe</p></header><section class="dkl-portal-dungeons">${dungeonCards()}</section><div class="dkl-portal-info"><span>Empfohlen: ${dungeon.level<=d.level?"Bereit":"Level zu niedrig"}</span><span>Bestzeit: ${d.bestDungeon[dungeon.id]?.time?formatTime(d.bestDungeon[dungeon.id].time):"—"}</span><span>Gruppe: 1–4 Spieler</span></div></main>
      <aside><div class="dkl-portal-character" style="--race:${preset.accent}">${characterPreviewHtml("portal")}<h2>${esc(playerName())}</h2><b>${preset.name}</b><span>${ROLES[d.role].name} · ${CLASSES[d.classId].name}</span><div><small>LEVEL ${d.level}</small><small>PWR ${NUMBER.format(stats.power)}</small></div></div><button class="dkl-btn primary dkl-play-button" data-dkl-play>SPIEL STARTEN</button><small>Danach wählst du Solo, Gruppe oder Lobby-Code.</small></aside></div>`;
    UI.main.querySelectorAll("[data-dkl-dungeon]").forEach(el=>el.addEventListener("click",()=>{const x=DUNGEONS.find(d=>d.id===el.dataset.dklDungeon);if(ensureState().level<x.level)return toast("Dungeon gesperrt",`Level ${x.level} erforderlich.`);UI.selectedDungeon=x.id;renderHome();}));
    UI.main.querySelector("[data-dkl-characters]").addEventListener("click",renderCharacterSelect);
    UI.main.querySelector("[data-dkl-inventory]").addEventListener("click",renderInventory);
    UI.main.querySelector("[data-dkl-skilltree]").addEventListener("click",renderSkillTree);
    UI.main.querySelector("[data-dkl-shop]").addEventListener("click",renderShop);
    UI.main.querySelector("[data-dkl-auction]").addEventListener("click",renderAuction);
    UI.main.querySelector("[data-dkl-play]").addEventListener("click",renderModeLoading);
    renderCharacterCanvases();updateHead();
  }
  function renderModeLoading(){
    const dungeon=DUNGEONS.find(x=>x.id===UI.selectedDungeon)||DUNGEONS[0];UI.view="mode-loading";const token=++UI.loadingToken;
    UI.main.innerHTML=`<div class="dkl-menu-loading" style="--load:${dungeon.color}"><div><i></i><i></i><i></i></div><small>ABENTEUER WIRD VORBEREITET</small><h2>${esc(dungeon.name)}</h2><p>Gruppenoptionen und Dungeon-Zugang werden geladen …</p><span><b></b></span></div>`;
    const bar=UI.main.querySelector(".dkl-menu-loading span b");let n=0;const timer=setInterval(()=>{if(token!==UI.loadingToken){clearInterval(timer);return;}n=Math.min(100,n+14);if(bar)bar.style.width=`${n}%`;if(n>=100){clearInterval(timer);setTimeout(()=>{if(token===UI.loadingToken)renderModeSelect();},120);}},65);UI.timers.push(timer);
  }
  function renderModeSelect(){
    UI.view="mode";const dungeon=DUNGEONS.find(x=>x.id===UI.selectedDungeon)||DUNGEONS[0],d=ensureState();
    UI.main.innerHTML=`<div class="dkl-mode-select" style="--mode:${dungeon.color}"><header><button class="dkl-btn" data-dkl-mode-back>← Dungeon-Auswahl</button><div><small>SPIELMODUS</small><h1>${esc(dungeon.name)}</h1><p>Wähle, wie du den Dungeon betreten möchtest.</p></div></header><section class="dkl-mode-grid"><button data-dkl-mode-solo><span>1</span><h2>Solo</h2><p>Alleine spielen. Weniger Bonusbeute, aber sofort startklar.</p><b>SOFORT BETRETEN</b></button><button data-dkl-mode-party><span>2–4</span><h2>Gruppe erstellen</h2><p>Erstelle eine Online-Gruppe und lade bis zu drei Mitspieler ein.</p><b>LOBBY ERSTELLEN</b></button><button data-dkl-mode-join><span>#</span><h2>Code beitreten</h2><p>Betritt eine bestehende Gruppe mit einem sechsstelligen Lobby-Code.</p><b>CODE EINGEBEN</b></button></section><footer><span>${presetById(d.appearance.preset).name}</span><span>${CLASSES[d.classId].name}</span><span>PWR ${formatPower(playerStats().power)}</span></footer></div>`;
    UI.main.querySelector("[data-dkl-mode-back]").addEventListener("click",renderHome);UI.main.querySelector("[data-dkl-mode-solo]").addEventListener("click",()=>startDungeon(UI.selectedDungeon,{partySize:1}));UI.main.querySelector("[data-dkl-mode-party]").addEventListener("click",renderPartyHall);UI.main.querySelector("[data-dkl-mode-join]").addEventListener("click",showJoinDialog);updateHead();
  }
  function changeRole(roleId) { const d = ensureState(); if (d?.appearance?.ready || !ROLES[roleId]) return; d.role = roleId; d.classId = Object.keys(CLASSES).find(id => CLASSES[id].role === roleId) || "guardian"; d.lastClassChange = Date.now(); safeSave(); toast("Rolle gewählt", ROLES[roleId].name); renderHome(); }
  function changeClass(classId) { const d = ensureState(); if (d?.appearance?.ready || !CLASSES[classId] || CLASSES[classId].role !== d.role) return; d.classId = classId; d.lastClassChange = Date.now(); safeSave(); toast("Klasse gewählt", CLASSES[classId].name); renderHome(); }

  function hunterPetPanelHtml(data){
    const hunter=ensureHunterData(data),active=activeHunterPet(data);return `<section class="dkl-hunter-panel"><header><div><small>JÄGER-BEGLEITER</small><h3>${active?esc(active.name):"Kein Begleiter"}</h3><p>Begleiter haben immer dein Dungeon-Level und steigen automatisch mit dir auf. Geschwächte Wölfe, Hunde und Bestien können mit E gezähmt werden.</p></div><strong>${active?`Level ${data.level}`:""}</strong></header><div>${hunter.pets.map(pet=>`<button data-dkl-pet-select="${esc(pet.id)}" class="${pet.id===hunter.activeId?"active":""}"><span>${pet.species==="wolf"?"🐺":pet.species==="hound"?"🐕":"🐾"}</span><b>${esc(pet.name)}</b><small>Level ${data.level} · Loyalität ${pet.loyalty}/5</small></button>`).join("")}</div></section>`;
  }
  function professionCompanionPanelHtml(data){ensureProfessionData(data);if(data.profession.id!=="companion")return "";const active=companionPetProfile(data);return `<section class="dkl-hunter-panel dkl-profession-companions"><header><div><small>BERUF · BEGLEITER</small><h3>${active?esc(active.name):"Noch kein Begleiter"}</h3><p>Jeder Charakter kann einen Berufsbegleiter nutzen. Jäger kämpfen zusätzlich mit ihrem gezähmten Tier und können dadurch zwei Begleiter besitzen.</p></div><strong>${active?`${RARITIES[active.rarity].name} · ${active.role.toUpperCase()}`:""}</strong></header><div>${data.companions.pets.map(pet=>`<button data-dkl-companion-select="${esc(pet.id)}" class="${pet.id===data.companions.activeId?"active":""}"><span>${COMPANION_SPECIES[pet.species]?.icon||"🐾"}</span><b>${esc(pet.name)}</b><small>${RARITIES[pet.rarity].name} · ${pet.role.toUpperCase()} · ${pet.copies}/${petFusionNeed(pet.rarity)} Kopien</small></button><button class="dkl-btn small" data-dkl-companion-fuse="${esc(pet.id)}" ${pet.copies<petFusionNeed(pet.rarity)||pet.rarity==="universe"?"disabled":""}>Fusionieren</button>`).join("")||`<div class="dkl-empty">Begleiter können aus Gegnern, Kisten oder Rezepten stammen.</div>`}</div></section>`;}
  function professionRecipeCard(recipe,data){const ready=data.profession.level>=recipe.level&&Object.entries(recipe.cost).every(([id,n])=>materialCount(data,id)>=n);return `<article class="dkl-recipe ${ready?"ready":""}"><span>${recipe.icon}</span><div><b>${esc(recipe.name)}</b><small>Beruf Stufe ${recipe.level} · ${Object.entries(recipe.cost).map(([id,n])=>`${MATERIALS[id].icon} ${n}`).join(" · ")}</small></div><button class="dkl-btn small" data-dkl-craft="${recipe.id}" ${ready?"":"disabled"}>Herstellen</button></article>`;}
  function renderProfessions(){UI.view="profession";const d=ensureState();ensureProfessionData(d);const p=d.profession.id?PROFESSIONS[d.profession.id]:null;UI.main.innerHTML=`<div class="dkl-page dkl-profession-page"><header class="dkl-page-head"><button class="dkl-btn" data-dkl-prof-back>← Charakterfenster</button><div><small>BERUFE</small><h2>${p?p.icon+" "+p.name:"Einen Beruf erlernen"}</h2><p>${p?`Stufe ${d.profession.level} · ${d.profession.xp}/${professionNeed(d.profession.level)} XP`:"Pro Charakter kann genau ein Beruf erlernt werden."}</p></div></header>${p?`<section class="dkl-profession-layout"><article class="dkl-panel"><h3>Materiallager</h3><div class="dkl-material-grid">${Object.entries(MATERIALS).map(([id,m])=>`<div><span>${m.icon}</span><b>${m.name}</b><em>${GOLD.format(materialCount(d,id))}</em></div>`).join("")}</div></article><article class="dkl-panel"><h3>Rezepte</h3><div class="dkl-recipe-list">${(PROFESSION_RECIPES[d.profession.id]||[]).map(r=>professionRecipeCard(r,d)).join("")}</div></article></section>${d.profession.id==="companion"?professionCompanionPanelHtml(d):""}`:`<section class="dkl-profession-select">${Object.entries(PROFESSIONS).map(([id,x])=>`<button data-dkl-learn-profession="${id}"><span>${x.icon}</span><h3>${x.name}</h3><p>${x.description}</p><b>BERUF ERLERNEN</b></button>`).join("")}</section>`}</div>`;UI.main.querySelector("[data-dkl-prof-back]").onclick=renderInventory;UI.main.querySelectorAll("[data-dkl-learn-profession]").forEach(btn=>btn.onclick=()=>{if(d.profession.id)return;const id=btn.dataset.dklLearnProfession;if(!PROFESSIONS[id])return;if(!confirm(`${PROFESSIONS[id].name} dauerhaft für diesen Charakter erlernen?`))return;d.profession.id=id;d.profession.level=1;d.profession.xp=0;safeSave();renderProfessions();});UI.main.querySelectorAll("[data-dkl-craft]").forEach(btn=>btn.onclick=()=>craftProfessionRecipe(btn.dataset.dklCraft));UI.main.querySelectorAll("[data-dkl-companion-select]").forEach(btn=>btn.onclick=()=>{d.companions.activeId=btn.dataset.dklCompanionSelect;safeSave();renderProfessions();});UI.main.querySelectorAll("[data-dkl-companion-fuse]").forEach(btn=>btn.onclick=()=>{upgradeCompanionPet(d,btn.dataset.dklCompanionFuse);renderProfessions();});}
  function craftProfessionRecipe(id){const d=ensureState();ensureProfessionData(d);const recipe=(PROFESSION_RECIPES[d.profession.id]||[]).find(x=>x.id===id);if(!recipe||d.profession.level<recipe.level)return;for(const [key,n] of Object.entries(recipe.cost))if(materialCount(d,key)<n)return toast("Material fehlt",`${MATERIALS[key].name}: ${n} benötigt.`);for(const [key,n] of Object.entries(recipe.cost))d.materials[key]-=n;if(recipe.type==="gear"){const available=RARITY_ORDER.filter(r=>RARITIES[r].minLevel<=d.level),rarity=available[Math.min(available.length-1,Math.floor(d.profession.level/18))]||"common";addItem(createItem(d.level,rarity,recipe.slot,d.classId),true);}else if(recipe.type==="consumable"){const existing=d.consumables.find(x=>x.recipeId===recipe.id);if(existing)existing.quantity++;else d.consumables.push({id:uid(),recipeId:recipe.id,name:recipe.name,icon:recipe.icon,quantity:1,duration:recipe.duration||0,buff:{...recipe.buff}});toast("Hergestellt",recipe.name);}else if(recipe.type==="pet"){const species=recipe.petRole==="tank"?pick(["bear","boar","golem"]):recipe.petRole==="healer"?pick(["sprite","raven"]):pick(["wolf","hound","drake"]);const pet=addCompanionCopy(d,{species,role:recipe.petRole,rarity:"common",name:COMPANION_SPECIES[species].name});toast("Begleiter gefunden",`${pet.name} · ${pet.copies} Kopien`);}addProfessionXp(d,30+recipe.level*4);safeSave();renderProfessions();}
  function itemEquipScore(item,data=ensureState()){if(!item)return -Infinity;const role=data?.role||"dps";return finite(item.power,0)*3+finite(item.health,0)*.35+finite(item.damage,0)*(role==="dps"?2.1:role==="tank"?1.25:1.05)+finite(item.healing,0)*(role==="healer"?2.35:.35)+finite(item.armor,0)*(role==="tank"?8:4)+finite(item.crit,0)*10+finite(item.haste,0)*9+rarityIndex(item.rarity)*18;}
  function equipBestAvailable(){const d=ensureState();let changed=0;for(const slot of SLOT_KEYS){const candidates=d.inventory.filter(item=>item.slot===slot&&item.classId===d.classId&&Number(item.level||1)<=d.level).sort((a,b)=>itemEquipScore(b,d)-itemEquipScore(a,d));const best=candidates[0];if(best&&d.equipped[slot]!==best.uid){d.equipped[slot]=best.uid;changed++;}}refreshSessionLoadout();safeSave();updateHead();toast("Beste Ausrüstung angelegt",changed?`${changed} Plätze wurden verbessert.`:"Du trägst bereits die beste mögliche Ausrüstung.");renderInventory();}
  function smartSellRest(){const d=ensureState(),equippedIds=new Set(Object.values(d.equipped||{}).filter(Boolean));const equippedScores={};for(const slot of SLOT_KEYS)equippedScores[slot]=itemEquipScore(equippedItem(slot,d),d);const sellable=d.inventory.filter(item=>{if(equippedIds.has(item.uid))return false;if(Number(item.level||1)>d.level)return false;if(item.classId!==d.classId)return true;return itemEquipScore(item,d)<=Number(equippedScores[item.slot]??Infinity);});if(!sellable.length)return toast("Nichts zu verkaufen","Ausgerüstete und noch nicht tragbare Items bleiben geschützt.");const total=sellable.reduce((sum,item)=>sum+Math.round(Number(item.value||0)*.3),0);if(!confirm(`${sellable.length} sichere Rest-Items für ${GOLD.format(total)} Gold verkaufen? Höhere Level-Items und ausgerüstete Items bleiben erhalten.`))return;const ids=new Set(sellable.map(x=>x.uid));d.inventory=d.inventory.filter(x=>!ids.has(x.uid));d.gold+=total;safeSave();updateHead();toast("Rest verkauft",`${sellable.length} Items · +${GOLD.format(total)} Gold`);renderInventory();}
  const DUNGEON_STAFF_ROLE_LABELS={test_member:"Testmitglied",test_supporter:"Test-Supporter",supporter:"Supporter",test_moderator:"Test-Moderator",moderator:"Moderator",admin:"Admin",owner:"Owner"};
  const DUNGEON_STAFF_ROLE_PERMISSIONS={
    test_member:["players.read","character.read","audit.read"],
    test_supporter:["players.read","character.read","audit.read","tickets.work","smartphone.write","world.write"],
    supporter:["players.read","character.read","audit.read","tickets.work","tickets.all","tickets.delete","smartphone.write","world.write","work.write","games.write","shop.write","moderation.kick","moderation.timeout"],
    test_moderator:["players.read","character.read","character.write","player.write","audit.read","tickets.work","tickets.all","tickets.delete","smartphone.write","world.write","work.write","games.write","shop.write","items.write","ids.read","moderation.kick","moderation.timeout","moderation.ban.week"],
    moderator:["players.read","character.read","character.write","player.write","audit.read","tickets.work","tickets.all","tickets.delete","smartphone.write","world.write","work.write","games.write","shop.write","items.write","ids.read","money.write","properties.write","trust.write","moderation.kick","moderation.timeout","moderation.ban.year","player.reset","staff.timeout"],
    admin:["players.read","character.read","character.write","player.write","audit.read","tickets.work","tickets.all","tickets.delete","smartphone.write","world.write","work.write","games.write","shop.write","items.write","ids.read","money.write","properties.write","trust.write","moderation.kick","moderation.timeout","moderation.ban.year","player.reset","staff.timeout","staff.manage","events.write","session.unlimited"],
    owner:["*"]
  };
  function normalizedDungeonStaffContext(raw={}){const role=String(raw?.role||"").trim().toLowerCase(),fallback=DUNGEON_STAFF_ROLE_PERMISSIONS[role]||[],permissions=Array.isArray(raw?.permissions)?raw.permissions.map(String):fallback;return{role,roleLabel:String(raw?.roleLabel||DUNGEON_STAFF_ROLE_LABELS[role]||role||"Teamrolle"),permissions,active:raw?.active!==false};}
  function currentStaffContext(){try{const api=window.JKGamesSettingsMenu||window.LifeBuilderSettingsMenu||window.LifeBuilderOnlineMod,live=api?.getRole?.()||null;if(live)return normalizedDungeonStaffContext(live);const parsed=JSON.parse(sessionStorage.getItem("lifebuilder-2026-online-mod-session")||"null");if(!parsed?.authorized||Number(parsed.expiresAt||0)<=Date.now())return normalizedDungeonStaffContext({active:false});return normalizedDungeonStaffContext({...parsed,active:true});}catch{return normalizedDungeonStaffContext({active:false});}}
  function isDungeonOwner(staff=currentStaffContext()){return !!staff?.active&&staff.role==="owner";}
  function canUseDungeonModMenu(staff=currentStaffContext()){return isDungeonOwner(staff);}
  function dungeonModCapabilities(staff=currentStaffContext()){const allowed=isDungeonOwner(staff);return{profile:allowed,money:allowed,items:allowed,games:allowed,shop:allowed,owner:allowed};}
  function requireDungeonModCapability(_capability,message="Dieses Dungeon.KL-Mod-Menü ist ausschließlich für den Owner freigeschaltet."){const staff=UI.dungeonVerifiedStaff||currentStaffContext();if(isDungeonOwner(staff))return true;toast("Keine Berechtigung",message);return false;}
  async function verifyDungeonStaffRole(){if(!isDungeonOwner(currentStaffContext()))return null;try{const {fb,user}=await firebase(),snap=await fb.getDoc(fb.doc(fb.db,"staffRoles",user.uid));if(!snap.exists())return null;const data=snap.data()||{},staff=normalizedDungeonStaffContext({...data,active:data.active!==false});return isDungeonOwner(staff)?staff:null;}catch(error){console.warn("Dungeon.KL Rollenprüfung",error);return null;}}
  async function openDungeonModMenu(){if(!isDungeonOwner(currentStaffContext()))return toast("Kein Zugriff","Das Dungeon.KL-Mod-Menü ist in der Pre-Beta ausschließlich für den Owner sichtbar.");toast("Rolle wird geprüft","Firebase bestätigt die aktive Owner-Rolle.");const verified=await verifyDungeonStaffRole();if(!verified)return toast("Zugriff nicht bestätigt","Firebase konnte keine aktive Owner-Rolle bestätigen.");UI.dungeonVerifiedStaff=verified;renderDungeonModMenu();}
  function readDungeonModItemSelection(){
    const slot=String(UI.main.querySelector("[data-dkl-mod-slot]")?.value||"");
    const rarity=String(UI.main.querySelector("[data-dkl-mod-rarity]")?.value||"");
    const level=clamp(Math.floor(Number(UI.main.querySelector("[data-dkl-mod-item-level]")?.value)||ensureState()?.level||1),1,MAX_LEVEL);
    if(!SLOT_DEFS[slot]){toast("Ungültiger Slot","Bitte einen gültigen Ausrüstungsplatz auswählen.");return null;}
    if(!RARITIES[rarity]){toast("Ungültige Seltenheit","Bitte eine gültige Seltenheit auswählen.");return null;}
    return{slot,rarity,level};
  }
  function grantDungeonModItem({equip=false}={}){
    if(!requireDungeonModCapability("items"))return false;
    const d=ensureState(),selection=readDungeonModItemSelection();if(!selection)return false;
    if(d.inventory.length>=MAX_INVENTORY){toast("Inventar voll",`Das Inventar enthält bereits ${MAX_INVENTORY} Items. Es wurde nichts automatisch verkauft.`);return false;}
    const item=createItem(selection.level,selection.rarity,selection.slot,d.classId,{exactLevel:true});
    d.inventory.unshift(item);
    d.equipped ||= {};
    if(equip)d.equipped[selection.slot]=item.uid;
    refreshSessionLoadout();safeSave();updateHead();
    toast(equip?"Item gegeben und angezogen":"Item erfolgreich hinzugefügt",`${item.name} · ${RARITIES[item.rarity].name} · ${SLOT_DEFS[item.slot].name} · Level ${item.level}`);
    renderDungeonModMenu();return true;
  }
  function grantDungeonModFullSet(){
    if(!requireDungeonModCapability("items"))return false;
    const d=ensureState(),selection=readDungeonModItemSelection();if(!selection)return false;
    if(d.inventory.length+SLOT_KEYS.length>MAX_INVENTORY){toast("Nicht genug Inventarplätze",`Für ein komplettes Set werden ${SLOT_KEYS.length} freie Plätze benötigt.`);return false;}
    const granted=[];for(const slot of SLOT_KEYS){const item=createItem(selection.level,selection.rarity,slot,d.classId,{exactLevel:true});d.inventory.unshift(item);granted.push(item);}
    refreshSessionLoadout();safeSave();updateHead();toast("Komplettes Set hinzugefügt",`${granted.length} ${RARITIES[selection.rarity].name.toLowerCase()}e Items auf Level ${selection.level} wurden erstellt.`);renderDungeonModMenu();return true;
  }
  function upgradeAllInventoryItems(){if(!requireDungeonModCapability("items"))return;const d=ensureState();d.inventory=d.inventory.map(item=>{const idx=rarityIndex(item.rarity);if(idx>=RARITY_ORDER.length-1)return item;const next=RARITY_ORDER[idx+1],fresh=createItem(Math.max(1,Number(item.level||d.level)),next,item.slot,item.classId);return{...fresh,uid:item.uid,acquiredAt:item.acquiredAt||Date.now()};});refreshSessionLoadout();safeSave();toast("Inventar verbessert","Alle Items wurden um eine Seltenheitsstufe verbessert.");renderDungeonModMenu();}
  function renderDungeonModMenu(){
    const staff=UI.dungeonVerifiedStaff||currentStaffContext();
    if(!canUseDungeonModMenu(staff))return renderInventory();
    UI.view="mod";
    const d=ensureState(),caps=dungeonModCapabilities(staff),roleLabel=staff.roleLabel||DUNGEON_STAFF_ROLE_LABELS[staff.role]||"Teamrolle";
    const profilePanel=(caps.profile||caps.money||caps.owner)?`<article class="dkl-panel"><h3>Name, Level, XP & Gold</h3>${caps.profile||caps.owner?`<label>Charaktername<input type="text" minlength="2" maxlength="24" value="${esc(d.name)}" data-dkl-mod-name></label><label>Level<input type="number" min="1" max="100" value="${d.level}" data-dkl-mod-level></label><label>XP hinzufügen<input type="number" min="0" value="1000" data-dkl-mod-xp></label>`:""}${caps.money||caps.owner?`<label>Dungeon-Gold hinzufügen<input type="number" min="0" value="10000" data-dkl-mod-gold></label>`:""}<div class="dkl-mod-actions"><button class="dkl-btn primary" data-dkl-mod-apply>Übernehmen</button></div></article>`:"";
    const itemPanel=(caps.items||caps.owner)?`<article class="dkl-panel"><h3>Item-Geber</h3><p>Slot, Seltenheit und exaktes Item-Level auswählen. Mod-Items werden ohne zufällige Levelabweichung erstellt.</p><label>Slot<select data-dkl-mod-slot>${SLOT_KEYS.map(s=>`<option value="${s}">${SLOT_DEFS[s].name}</option>`).join("")}</select></label><label>Seltenheit<select data-dkl-mod-rarity>${RARITY_ORDER.map(r=>`<option value="${r}">${RARITIES[r].name}</option>`).join("")}</select></label><label>Exaktes Item-Level<input type="number" min="1" max="100" value="${d.level}" data-dkl-mod-item-level></label><div class="dkl-mod-actions"><button class="dkl-btn gold" data-dkl-mod-grant>Item hinzufügen</button><button class="dkl-btn primary" data-dkl-mod-grant-equip>Hinzufügen & anziehen</button><button class="dkl-btn" data-dkl-mod-fullset>Komplettes Set hinzufügen</button></div></article><article class="dkl-panel"><h3>Inventar-Werkzeuge</h3><p>${d.inventory.length}/${MAX_INVENTORY} Items im aktuellen Charakter.</p><div class="dkl-mod-actions"><button class="dkl-btn" data-dkl-mod-upgrade>Alle Items +1 Seltenheit</button><button class="dkl-btn" data-dkl-mod-best>Bestes anziehen</button><button class="dkl-btn danger" data-dkl-mod-repair>Alle auf Charakterlevel setzen</button></div></article>`:"";
    const gamePanel=(caps.games||caps.items||caps.owner)?`<article class="dkl-panel"><h3>Materialien & Beruf</h3><div class="dkl-material-grid">${Object.entries(MATERIALS).map(([id,m])=>`<button data-dkl-mod-material="${id}">${m.icon} +100 ${m.name}</button>`).join("")}</div><div class="dkl-mod-actions"><button class="dkl-btn" data-dkl-mod-profession>Beruf Stufe 100</button></div></article>`:"";
    UI.main.innerHTML=`<div class="dkl-page dkl-mod-page"><header class="dkl-page-head"><button class="dkl-btn" data-dkl-mod-back>← Charakterfenster</button><div><small>OWNER-WERKZEUGE</small><h2>Dungeon.KL Mod-Menü</h2><p>${esc(roleLabel)} · aktueller Charakter: ${esc(d.name)}</p></div></header><section class="dkl-mod-grid">${profilePanel}${itemPanel}${gamePanel}</section></div>`;
    UI.main.querySelector("[data-dkl-mod-back]").onclick=renderInventory;
    UI.main.querySelector("[data-dkl-mod-apply]")?.addEventListener("click",()=>{
      if(caps.profile||caps.owner){const name=normalizeDungeonCharacterName(UI.main.querySelector("[data-dkl-mod-name]")?.value,"");if(name.length<2)return toast("Name fehlt","Der Charaktername muss mindestens zwei Zeichen besitzen.");if(!dungeonCharacterNameAvailable(name,d.id))return toast("Name bereits vergeben","Ein anderer Dungeon-Charakter verwendet diesen Namen bereits.");d.name=name;d.nameChosen=true;d.level=clamp(Math.floor(Number(UI.main.querySelector("[data-dkl-mod-level]")?.value)||1),1,100);d.xp+=Math.max(0,Math.floor(Number(UI.main.querySelector("[data-dkl-mod-xp]")?.value)||0));ensureHunterData(d);}
      if(caps.money||caps.owner)d.gold+=Math.max(0,Math.floor(Number(UI.main.querySelector("[data-dkl-mod-gold]")?.value)||0));
      refreshSessionLoadout();safeSave();updateHead();toast("Charakter aktualisiert",`${d.name} wurde gespeichert.`);renderDungeonModMenu();
    });
    UI.main.querySelector("[data-dkl-mod-grant]")?.addEventListener("click",()=>grantDungeonModItem({equip:false}));
    UI.main.querySelector("[data-dkl-mod-grant-equip]")?.addEventListener("click",()=>grantDungeonModItem({equip:true}));
    UI.main.querySelector("[data-dkl-mod-fullset]")?.addEventListener("click",grantDungeonModFullSet);
    UI.main.querySelector("[data-dkl-mod-upgrade]")?.addEventListener("click",upgradeAllInventoryItems);
    UI.main.querySelector("[data-dkl-mod-best]")?.addEventListener("click",()=>{if(!requireDungeonModCapability("items"))return;equipBestAvailable();});
    UI.main.querySelector("[data-dkl-mod-repair]")?.addEventListener("click",()=>{if(!requireDungeonModCapability("items"))return;d.inventory=d.inventory.map(item=>({...createItem(d.level,item.rarity,item.slot,item.classId),uid:item.uid,acquiredAt:item.acquiredAt||Date.now()}));refreshSessionLoadout();safeSave();renderDungeonModMenu();});
    UI.main.querySelectorAll("[data-dkl-mod-material]").forEach(btn=>btn.addEventListener("click",()=>{if(!(caps.games||caps.items||caps.owner))return toast("Keine Berechtigung","Für Materialien wird games.write oder items.write benötigt.");addMaterial(d,btn.dataset.dklModMaterial,100);safeSave();renderDungeonModMenu();}));
    UI.main.querySelector("[data-dkl-mod-profession]")?.addEventListener("click",()=>{if(!(caps.games||caps.owner))return toast("Keine Berechtigung","Zum Bearbeiten von Berufen wird das Recht games.write benötigt.");ensureProfessionData(d);if(!d.profession.id)d.profession.id="blacksmith";d.profession.level=100;d.profession.xp=0;safeSave();renderDungeonModMenu();});
  }
  function renderInventory() {
    UI.view = "inventory"; const d = ensureState(), stats = playerStats(), talents=talentBonuses(d);
    const filtered = d.inventory.filter(item => (UI.inventoryRarity === "all" || item.rarity === UI.inventoryRarity) && (UI.inventorySlot === "all" || item.slot === UI.inventorySlot) && (!UI.inventorySearch || item.name.toLowerCase().includes(UI.inventorySearch.toLowerCase()))).sort((a, b) => rarityIndex(b.rarity) - rarityIndex(a.rarity) || b.level - a.level || b.power - a.power);
    const backLabel = UI.session ? "← Zurück zum Dungeon" : "← Spielmenü";
    const backHandler = UI.session ? renderDungeonStage : (d.appearance.ready ? renderHome : renderCharacterStudio);
    const leftSlots=["helmet","chest","gloves","boots"],rightSlots=["weapon","offhand","ring","amulet","relic"];
    UI.main.innerHTML = `<div class="dkl-page dkl-character-sheet"><header class="dkl-page-head"><button class="dkl-btn" data-dkl-back>${backLabel}</button><div><small>CHARAKTERFENSTER</small><h2>${esc(playerName())} · ${CLASSES[d.classId].name}</h2><p>${d.inventory.length}/${MAX_INVENTORY} Items · Power ${NUMBER.format(stats.power)}</p></div><div class="dkl-sheet-head-actions">${canUseDungeonModMenu()?`<button class="dkl-btn danger" data-dkl-mod-open>🛠 Mod-Menü</button>`:""}<button class="dkl-btn" data-dkl-profession>Berufe</button>${d.appearance.ready?`<span class="dkl-character-locked">🔒 Charakter festgelegt</span>`:`<button class="dkl-btn" data-dkl-sheet-character>Optik</button>`}<button class="dkl-btn gold" data-dkl-sheet-skills>Skillbaum</button></div></header>
      <section class="dkl-wow-sheet"><div class="dkl-wow-slots left">${leftSlots.map(slot=>loadoutSlotHtml(slot)).join("")}</div><div class="dkl-wow-model">${characterPreviewHtml("sheet")}<div class="dkl-preview-turn"><button data-dkl-facing="left">◀</button><button data-dkl-facing="front">Vorne</button><button data-dkl-facing="back">Hinten</button><button data-dkl-facing="right">▶</button></div><h3>${esc(playerName())}</h3><b>${ROLES[d.role].name} · ${CLASSES[d.classId].name}</b><div class="dkl-wow-power">${NUMBER.format(stats.power)}<small>POWER</small></div><div class="dkl-wow-weapon-modules"><span>Waffe: ${esc(equippedItem("weapon")?.name||"Leer")}</span><span>Modul: ${gearVisualFromState(d).weaponModule.toUpperCase()}</span></div></div><div class="dkl-wow-slots right"><button class="dkl-profession-slot" data-dkl-profession><span>${d.profession?.id?(PROFESSIONS[d.profession.id]?.icon||"◆"):"＋"}</span><div><small>BERUF</small><b>${d.profession?.id?(PROFESSIONS[d.profession.id]?.name||"Beruf"):"Beruf erlernen"}</b><em>${d.profession?.id?`Stufe ${d.profession.level}`:"Ein Beruf pro Charakter"}</em></div></button>${rightSlots.map(slot=>loadoutSlotHtml(slot)).join("")}</div><aside class="dkl-wow-attributes"><h3>Attribute</h3><dl><div><dt>Gesundheit</dt><dd>${NUMBER.format(stats.health)}</dd></div><div><dt>Schaden</dt><dd>${NUMBER.format(stats.damage)}</dd></div><div><dt>Heilung</dt><dd>${NUMBER.format(stats.healing)}</dd></div><div><dt>Rüstung</dt><dd>${Math.round(stats.armor*100)} %</dd></div><div><dt>Krit</dt><dd>${Math.round(stats.crit*100)} %</dd></div><div><dt>Tempo</dt><dd>${Math.round(stats.haste*100)} %</dd></div><div><dt>Abklingzeit</dt><dd>-${Math.round(stats.cooldownReduction*100)} %</dd></div><div><dt>Schildbonus</dt><dd>+${Math.round(stats.shieldBonus*100)} %</dd></div></dl><h3>Verstärkungen</h3><p>${talentPointsSpent(d)} Talentpunkte verteilt · ${talentPointsAvailable(d)} frei</p></aside></section>${d.classId==="ranger"?hunterPetPanelHtml(d):""}${professionCompanionPanelHtml(d)}${d.consumables.length?`<section class="dkl-consumables-panel"><header><div><small>VERBRAUCHSITEMS</small><h3>Essen, Tränke und Gruppenbuffs</h3></div><b>${d.consumables.reduce((n,x)=>n+x.quantity,0)} Stück</b></header><div>${d.consumables.map(consumableCardHtml).join("")}</div></section>`:""}
      <section class="dkl-panel"><div class="dkl-smart-inventory"><button class="dkl-btn primary" data-dkl-equip-best>✨ Bestes anziehen</button><button class="dkl-btn danger" data-dkl-smart-sell>🪙 Rest sicher verkaufen</button><small>Ausgerüstete und noch nicht tragbare Items werden niemals verkauft.</small></div><div class="dkl-filters"><select data-dkl-inv-rarity><option value="all">Alle Seltenheiten</option>${RARITY_ORDER.map(r => `<option value="${r}" ${UI.inventoryRarity === r ? "selected" : ""}>${RARITIES[r].name}</option>`).join("")}</select><select data-dkl-inv-slot><option value="all">Alle Plätze</option>${SLOT_KEYS.map(s => `<option value="${s}" ${UI.inventorySlot === s ? "selected" : ""}>${SLOT_DEFS[s].name}</option>`).join("")}</select><input data-dkl-inv-search placeholder="Item suchen …" value="${esc(UI.inventorySearch)}"><button class="dkl-btn danger" data-dkl-sell-filtered>Gefilterte verkaufen</button></div><div class="dkl-items">${filtered.length ? filtered.map(itemCardHtml).join("") : `<div class="dkl-empty">Keine passenden Items gefunden.</div>`}</div></section></div>`;
    UI.main.querySelector("[data-dkl-back]").addEventListener("click", backHandler);
    UI.main.querySelector("[data-dkl-sheet-character]")?.addEventListener("click",renderCharacterStudio);
    UI.main.querySelector("[data-dkl-sheet-skills]").addEventListener("click",renderSkillTree);
    UI.main.querySelector("[data-dkl-mod-open]")?.addEventListener("click",openDungeonModMenu);
    UI.main.querySelectorAll("[data-dkl-profession]").forEach(btn=>btn.addEventListener("click",renderProfessions));
    UI.main.querySelector("[data-dkl-equip-best]")?.addEventListener("click",equipBestAvailable);
    UI.main.querySelector("[data-dkl-smart-sell]")?.addEventListener("click",smartSellRest);
    UI.main.querySelectorAll("[data-dkl-use-consumable]").forEach(btn=>btn.addEventListener("click",()=>useConsumable(btn.dataset.dklUseConsumable)));
    UI.main.querySelectorAll("[data-dkl-companion-select]").forEach(btn=>btn.addEventListener("click",()=>{const data=ensureState();ensureProfessionData(data);data.companions.activeId=btn.dataset.dklCompanionSelect;refreshSessionLoadout();safeSave();renderInventory();}));
    UI.main.querySelectorAll("[data-dkl-companion-fuse]").forEach(btn=>btn.addEventListener("click",()=>{if(upgradeCompanionPet(ensureState(),btn.dataset.dklCompanionFuse))renderInventory();}));
    UI.main.querySelectorAll("[data-dkl-facing]").forEach(btn=>btn.addEventListener("click",()=>{UI.previewFacing=btn.dataset.dklFacing;renderCharacterCanvases();}));
    UI.main.querySelectorAll("[data-dkl-pet-select]").forEach(btn=>btn.addEventListener("click",()=>{const data=ensureState();ensureHunterData(data).activeId=btn.dataset.dklPetSelect;refreshSessionLoadout();safeSave();renderInventory();}));
    UI.main.querySelector("[data-dkl-inv-rarity]").addEventListener("change", e => { UI.inventoryRarity = e.target.value; renderInventory(); });
    UI.main.querySelector("[data-dkl-inv-slot]").addEventListener("change", e => { UI.inventorySlot = e.target.value; renderInventory(); });
    UI.main.querySelector("[data-dkl-inv-search]").addEventListener("input", e => { UI.inventorySearch = e.target.value; clearTimeout(e.target._t); e.target._t = setTimeout(renderInventory, 180); });
    UI.main.querySelector("[data-dkl-sell-filtered]").addEventListener("click", () => sellFiltered(filtered));
    bindItemButtons(renderInventory);renderCharacterCanvases();
  }
  function dungeonFourValuesHtml(item, compact = false) {
    const source = item || {};
    const values = [
      ["Schaden", Math.round(finite(source.damage, 0)), "⚔"],
      ["Leben", Math.round(finite(source.health, 0)), "❤"],
      ["Rüstung", Math.round(finite(source.armor, 0)), "🛡"],
      ["Heilung", Math.round(finite(source.healing, 0)), "✚"]
    ];
    return `<div class="dkl-four-values ${compact ? "compact" : ""}">${values.map(([label,value,icon]) => `<span title="${esc(label)}"><i>${icon}</i><small>${esc(label)}</small><b>${NUMBER.format(value)}</b></span>`).join("")}</div>`;
  }
  function loadoutSlotHtml(slot) { const item = equippedItem(slot); return `<article class="dkl-equip-slot ${item ? `rarity-${item.rarity}` : "empty"}"><span>${SLOT_DEFS[slot].icon}</span><div><small>${SLOT_DEFS[slot].name}</small><b>${item ? esc(item.name) : "Leer"}</b>${item ? `<em>${RARITIES[item.rarity].name} · L${item.level} · PWR ${formatPower(item.power)}</em>${dungeonFourValuesHtml(item, true)}` : ""}</div>${item ? `<button data-dkl-unequip="${slot}">×</button>` : ""}</article>`; }
  function itemCardHtml(item) {
    const d = ensureState(), equipped = d.equipped[item.slot] === item.uid, canEquip = d.level >= item.level && item.classId === d.classId;
    return `<article class="dkl-item rarity-${item.rarity}"><div class="dkl-item-icon">${SLOT_DEFS[item.slot].icon}</div><div class="dkl-item-main"><small>${RARITIES[item.rarity].name} · Level ${item.level} · ${SLOT_DEFS[item.slot].name}</small><b>${esc(item.name)}</b>${dungeonFourValuesHtml(item)}<div class="dkl-item-power"><span>PWR ${formatPower(item.power)}</span></div></div><div class="dkl-item-actions">${equipped ? `<strong>Ausgerüstet</strong>` : `<button class="dkl-btn small" data-dkl-equip="${item.uid}" ${canEquip ? "" : "disabled"}>${canEquip ? "Ausrüsten" : item.classId !== d.classId ? "Andere Klasse" : `Level ${item.level}`}</button>`}<button class="dkl-btn small" data-dkl-auction-item="${item.uid}">Auktion</button><button class="dkl-btn small danger" data-dkl-sell="${item.uid}">+${GOLD.format(Math.round(item.value * .3))}</button></div></article>`;
  }
  function bindItemButtons(after) {
    const d = ensureState();
    UI.main.querySelectorAll("[data-dkl-equip]").forEach(btn => btn.addEventListener("click", () => { const item = d.inventory.find(x => x.uid === btn.dataset.dklEquip); if (!item || d.level < item.level || item.classId !== d.classId) return; d.equipped[item.slot] = item.uid; refreshSessionLoadout(); safeSave(); updateHead(); after(); }));
    UI.main.querySelectorAll("[data-dkl-unequip]").forEach(btn => btn.addEventListener("click", () => { d.equipped[btn.dataset.dklUnequip] = ""; refreshSessionLoadout(); safeSave(); after(); }));
    UI.main.querySelectorAll("[data-dkl-sell]").forEach(btn => btn.addEventListener("click", () => sellItem(btn.dataset.dklSell, after)));
    UI.main.querySelectorAll("[data-dkl-auction-item]").forEach(btn => btn.addEventListener("click", () => listAuctionDialog(btn.dataset.dklAuctionItem)));
  }
  function sellItem(id, after = renderInventory) { const d = ensureState(), item = d.inventory.find(x => x.uid === id); if (!item) return; if (Object.values(d.equipped).includes(id)) return toast("Nicht möglich", "Ausgerüstete Items zuerst ablegen."); d.inventory = d.inventory.filter(x => x.uid !== id); const value = Math.round(item.value * .3); d.gold += value; safeSave(); updateHead(); toast("Verkauft", `${item.name} · +${GOLD.format(value)} Gold`); after(); }
  function sellFiltered(items) { const d = ensureState(), equipped = new Set(Object.values(d.equipped)); const sellable = items.filter(x => !equipped.has(x.uid)); if (!sellable.length) return toast("Nichts verkauft", "Ausgerüstete Items bleiben geschützt."); if (!confirm(`${sellable.length} Items für insgesamt ${GOLD.format(sellable.reduce((t, x) => t + Math.round(x.value * .3), 0))} Gold verkaufen?`)) return; const ids = new Set(sellable.map(x => x.uid)); const value = sellable.reduce((t, x) => t + Math.round(x.value * .3), 0); d.inventory = d.inventory.filter(x => !ids.has(x.uid)); d.gold += value; safeSave(); updateHead(); renderInventory(); }

  function shopRarityForIndex(level,index){const available=RARITY_ORDER.filter(r=>RARITIES[r].minLevel<=level);if(!available.length)return "common";const pattern=[0,0,1,0,1,2,1,0,2,3,1,2];return available[Math.min(available.length-1,pattern[index%pattern.length]||0)]||available[0];}
  function refreshShop() {
    const d = ensureState(); const day = Math.floor(Date.now() / 86400000); if (d.shop.generatedAt === day && d.shop.version===VERSION && Array.isArray(d.shop.stock) && d.shop.stock.length) return;
    d.shop.generatedAt = day;d.shop.version=VERSION;d.shop.stock = Array.from({ length: 54 }, (_, i) => {const rarity=shopRarityForIndex(d.level,i),min=RARITIES[rarity].minLevel,level=clamp(Math.max(min,d.level+Math.floor(rand(-2,3))),1,MAX_LEVEL);return createItem(level,rarity,pick(SLOT_KEYS),d.classId);}); safeSave();
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
  function shopItemHtml(item) { return `<article class="dkl-item rarity-${item.rarity}"><div class="dkl-item-icon">${SLOT_DEFS[item.slot].icon}</div><div class="dkl-item-main"><small>${RARITIES[item.rarity].name} · Level ${item.level}</small><b>${esc(item.name)}</b>${dungeonFourValuesHtml(item)}<div class="dkl-item-power"><span>PWR ${formatPower(item.power)}</span></div></div><div class="dkl-item-actions"><strong>${GOLD.format(shopPrice(item))} Gold</strong><button class="dkl-btn small gold" data-dkl-buy="${item.uid}" ${ensureState().level < item.level ? "disabled" : ""}>${ensureState().level < item.level ? `Level ${item.level}` : "Kaufen"}</button></div></article>`; }

  async function firebase() { const core = window.LifeBuilderFirebaseCore; if (!core?.load) throw new Error("Firebase-Laufzeit fehlt."); const fb = await core.load(); const user = await core.waitForAuth?.(8000) || fb.auth.currentUser; if (!user) throw new Error("Bitte mit JK.Games anmelden."); return { fb, user, core }; }
  function botAuctionItems(){const d=ensureState(),day=Math.floor(Date.now()/86400000),items=[];for(let i=0;i<42;i++){const high=i%9===0,level=i===0?77:high?clamp(60+(i*7+day)%41,1,100):clamp(d.level+((i*5+day)%17)-5,1,100),available=RARITY_ORDER.filter(r=>RARITIES[r].minLevel<=level),rarity=available[Math.min(available.length-1,high?Math.max(4,(i+day)%available.length):(i+day)%Math.min(4,available.length))]||"common",item=createItem(level,rarity,pick(SLOT_KEYS),i%4===0?pick(Object.keys(CLASSES)):d.classId);items.push({id:`bot:${day}:${i}`,bot:true,sellerName:pick(["Gruft-Händler","Nexus-Sammler","Schmied Arkon","Mira vom Hain","Auktionsbot VII"]),item,price:Math.round(shopPrice(item)*(.72+(i%7)*.07)),createdAtMs:Date.now()-i*90000});}return items;}
  function buyBotAuction(id){const d=ensureState(),a=botAuctionItems().find(x=>x.id===id);if(!a)return;if(d.gold<a.price)return toast("Nicht genug Gold");if(d.inventory.length>=MAX_INVENTORY)return toast("Inventar voll");d.gold-=a.price;d.inventory.unshift({...a.item,uid:uid(),acquiredAt:Date.now()});safeSave();updateHead();toast("Auktion gekauft",`${a.item.name} · Level ${a.item.level}`);renderAuction();}
  async function renderAuction() {
    UI.view = "auction"; UI.main.innerHTML = `<div class="dkl-page"><header class="dkl-page-head"><button class="dkl-btn" data-dkl-back>← Hauptlobby</button><div><small>ONLINE-HANDEL</small><h2>Auktionshaus</h2><p>Items anderer Spieler kaufen oder eigene Ausrüstung anbieten.</p></div></header><section class="dkl-panel"><div class="dkl-online-state">Online-Angebote werden geladen …</div><div class="dkl-items" data-dkl-auctions></div></section></div>`;
    UI.main.querySelector("[data-dkl-back]").addEventListener("click", renderHome); const list = UI.main.querySelector("[data-dkl-auctions]");
    try {
      const { fb, user } = await firebase(); await claimSoldAuctions(fb, user); const q = fb.query(fb.collection(fb.db, AUCTION_COLLECTION), fb.where("status", "==", "active"), fb.limit(80)); const snap = await fb.getDocs(q); const onlineItems=snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b)=>Number(b.createdAtMs||0)-Number(a.createdAtMs||0)).slice(0,60);UI.auctionItems=[...onlineItems,...botAuctionItems()];
      list.innerHTML = UI.auctionItems.map(a => auctionCardHtml(a, user.uid)).join("");
      UI.main.querySelector(".dkl-online-state").textContent = `Online · ${onlineItems.length} Spielerangebote · ${UI.auctionItems.length-onlineItems.length} Bot-Angebote`;
      UI.main.querySelectorAll("[data-dkl-auction-buy]").forEach(btn => btn.addEventListener("click", () => buyAuction(btn.dataset.dklAuctionBuy)));
      UI.main.querySelectorAll("[data-dkl-bot-buy]").forEach(btn=>btn.addEventListener("click",()=>buyBotAuction(btn.dataset.dklBotBuy)));
      UI.main.querySelectorAll("[data-dkl-auction-cancel]").forEach(btn => btn.addEventListener("click", () => cancelAuction(btn.dataset.dklAuctionCancel)));
    } catch (error) { const bots=botAuctionItems();UI.auctionItems=bots;UI.main.querySelector(".dkl-online-state").textContent = `Bot-Markt aktiv · ${bots.length} Angebote`;list.innerHTML=bots.map(a=>auctionCardHtml(a,"")).join("");UI.main.querySelectorAll("[data-dkl-bot-buy]").forEach(btn=>btn.addEventListener("click",()=>buyBotAuction(btn.dataset.dklBotBuy))); }
  }
  function auctionCardHtml(a, uidValue) { const item = a.item || {}; return `<article class="dkl-item rarity-${item.rarity || "common"}"><div class="dkl-item-icon">${SLOT_DEFS[item.slot]?.icon || "◆"}</div><div class="dkl-item-main"><small>${esc(a.sellerName || "Spieler")} · ${RARITIES[item.rarity]?.name || "Item"} · Level ${item.level || 1}</small><b>${esc(item.name || "Ausrüstung")}</b>${dungeonFourValuesHtml(item)}<div class="dkl-item-power"><span>PWR ${formatPower(item.power || 0)}</span></div></div><div class="dkl-item-actions"><strong>${GOLD.format(a.price || 0)} Gold</strong>${a.bot?`<button class="dkl-btn small gold" data-dkl-bot-buy="${a.id}">Kaufen</button>`:a.sellerUid === uidValue ? `<button class="dkl-btn small danger" data-dkl-auction-cancel="${a.id}">Zurücknehmen</button>` : `<button class="dkl-btn small gold" data-dkl-auction-buy="${a.id}">Kaufen</button>`}</div></article>`; }
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
  function partyProfile() { const d = ensureState(), s = playerStats(); return { uid: "", name: playerName(), role: d.role, classId: d.classId, level:clamp(Math.floor(finite(d.level,1)),1,MAX_LEVEL), power:Math.max(1,Math.round(finite(s.power,1))), maxHp:Math.max(1,Math.round(finite(s.health,1))), damage:Math.max(1,Math.round(finite(s.damage,1))), healing:Math.max(0,Math.round(finite(s.healing,0))), armor:clamp(finite(s.armor,0),0,.82), crit:clamp(finite(s.crit,.08),0,.75), haste:clamp(finite(s.haste,.05),0,.75), cooldownReduction:clamp(finite(s.cooldownReduction,0),0,.5), shieldBonus:Math.max(0,finite(s.shieldBonus,0)), moveBonus:Math.max(0,finite(s.moveBonus,0)), appearance:firestoreSafe(currentAppearance()), gearVisual:firestoreSafe(gearVisualFromState(d)), hunterPet:firestoreSafe(activeHunterPet(d)), supportPet:firestoreSafe(companionPetProfile(d)), actionBar:firestoreSafe(ensureActionBarData(d)), updatedAtMs: Date.now() }; }
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
    UI.onlineUnsubs.push(p.fb.onSnapshot(p.ref, snap => {
      if(!UI.party||UI.party!==p)return;
      if(!snap.exists()){closePartyLocally("Der Host hat die Lobby geschlossen.");return;}
      const data=snap.data()||{};p.data=data;
      if(data.status==="closed"){closePartyLocally(data.closedReason||"Der Host hat die Gruppe verlassen.");return;}
      if(data.status === "playing" && !UI.session && UI.view === "partyLobby") startDungeon(data.dungeonId, { partySize: (data.playerUids||[]).length, online: p, seed: data.seed, profiles: data.profiles, playerUids: data.playerUids, hostUid: data.hostUid });
      else if (data.status === "lobby" && ["partyLobby","result","partyReturn"].includes(UI.view)) renderPartyLobby();
    },error=>{console.warn("Dungeon.KL Party-Snapshot",error);}));
  }
  function renderPartyLobby() {
    const p = UI.party; if (!p) return renderPartyHall(); UI.view = "partyLobby"; const data = p.data || { playerUids: [p.user.uid], profiles: { [p.user.uid]: { ...partyProfile(), uid: p.user.uid } }, maxPlayers: UI.selectedPartySize, dungeonId: UI.selectedDungeon, hostUid: p.user.uid };
    const dungeon = DUNGEONS.find(x => x.id === data.dungeonId) || DUNGEONS[0];
    UI.main.innerHTML = `<div class="dkl-page"><header class="dkl-page-head"><button class="dkl-btn danger" data-dkl-party-leave>Lobby verlassen</button><div><small>PRIVATE DUNGEON PARTY</small><h2>Lobby-Code ${esc(p.code)}</h2><p>${esc(dungeon.name)} · ${data.playerUids.length}/${data.maxPlayers} Spieler</p></div></header><section class="dkl-panel"><div class="dkl-party-members">${Array.from({ length: data.maxPlayers }, (_, i) => { const id = data.playerUids[i], profile = id ? data.profiles[id] : null; return profile ? `<article class="filled role-${profile.role}"><span>${CLASSES[profile.classId]?.icon || "◆"}</span><div><b>${esc(profile.name)}</b><small>${ROLES[profile.role]?.name} · ${CLASSES[profile.classId]?.name} · Level ${profile.level}</small><em>PWR ${formatPower(profile.power)}</em></div>${id === data.hostUid ? `<strong>HOST</strong>` : ""}</article>` : `<article class="empty"><span>＋</span><div><b>Freier Platz</b><small>Code ${esc(p.code)} teilen</small></div></article>`; }).join("")}</div><div class="dkl-hero-actions">${p.host ? `<button class="dkl-btn primary" data-dkl-party-start ${data.playerUids.length < 2 ? "disabled" : ""}>Dungeon starten</button>` : `<div class="dkl-waiting">Der Host startet den Dungeon …</div>`}<button class="dkl-btn" data-dkl-copy-code>Code kopieren</button></div></section></div>`;
    UI.main.querySelector("[data-dkl-party-leave]").addEventListener("click", () => leaveParty(true));
    UI.main.querySelector("[data-dkl-copy-code]").addEventListener("click", () => navigator.clipboard?.writeText(p.code).then(() => toast("Code kopiert", p.code)).catch(() => toast("Lobby-Code", p.code)));
    UI.main.querySelector("[data-dkl-party-start]")?.addEventListener("click", async () => { if (data.playerUids.length < 2) return; try { await p.fb.updateDoc(p.ref, { status: "playing", startedAtMs: Date.now(), hostHeartbeatAtMs:Date.now(), updatedAtMs: Date.now() }); } catch (error) { toast("Start fehlgeschlagen", error.message || String(error)); } });
  }
  function closePartyLocally(reason="Die Dungeon-Gruppe wurde beendet."){
    const hadSession=!!UI.session;
    stopSession(false);
    UI.party=null;
    UI.onlineUnsubs.splice(0).forEach(fn=>{try{fn();}catch{}});
    if(UI.overlay){toast("Dungeon-Gruppe beendet",reason);renderHome();}
    return hadSession;
  }
  async function leaveParty(render = true, reason="Lobby verlassen") {
    const p = UI.party;
    if(!p){if(render&&UI.overlay)renderHome();return;}
    const data=p.data||{},playing=data.status==="playing"||!!UI.session;
    UI.onlineUnsubs.splice(0).forEach(fn=>{try{fn();}catch{}});
    try{
      if(p.host){
        if(playing){
          await p.fb.updateDoc(p.ref,{status:"closed",closedReason:String(reason||"Der Host hat die Gruppe verlassen."),closedAtMs:Date.now(),hostHeartbeatAtMs:Date.now(),updatedAtMs:Date.now()});
          window.setTimeout(()=>p.fb.deleteDoc(p.ref).catch(()=>{}),900);
        }else await p.fb.deleteDoc(p.ref);
      }else{
        const uids=(data.playerUids||[]).filter(x=>x!==p.user.uid),profiles={...(data.profiles||{})};delete profiles[p.user.uid];
        await p.fb.updateDoc(p.ref,{playerUids:uids,profiles,updatedAtMs:Date.now()});
      }
    }catch(error){console.warn("Dungeon.KL Lobby verlassen",error);}
    stopSession(false);UI.party=null;
    if(render&&UI.overlay)renderHome();
  }

  function startDungeon(dungeonId, options = {}) {
    try {
      const dungeon = DUNGEONS.find(x => x.id === dungeonId) || DUNGEONS[0], d = ensureState();
      if (!d) throw new Error("Spielstand ist noch nicht bereit.");
      if (d.level < dungeon.level) return toast("Dungeon gesperrt", `Level ${dungeon.level} benötigt.`);
      stopSession(false);
      const stats = playerStats(), partySize = clamp(Number(options.partySize) || 1, 1, 4);
      const player = makePlayer({ uid: options.online?.user?.uid || "local", name: playerName(), role: d.role, classId: d.classId, stats, local: true, x: WORLD_W / 2, y: WORLD_H - 150, appearance: currentAppearance(), gearVisual: gearVisualFromState(d), hunterPet:activeHunterPet(d), actionBar:ensureActionBarData(d) });
      player.supportPet=makeSupportPetRuntime(companionPetProfile(d),{x:player.x,y:player.y,ownerId:player.uid,ownerLevel:d.level,ownerPower:stats.power});
      const session = UI.session = { dungeon, partySize, online: options.online || null, host: !options.online || options.hostUid === options.online.user.uid, player, players: [player], remotePlayers: new Map(), enemies: [], projectiles: [], effects: [], texts: [], traps: [], chests: [], groundLoot:[], pickedGroundLootIds:new Set(), room: 1, roomState: "combat", roomStartedAt: performance.now(), startedAt: Date.now(), clearAt: 0, exitOpen: false, completed: false, autoAttack: false, noTargetFor: 0, skillCooldowns: [0,0,0,0,0], actionCooldowns:[0,0,0,0,0,0], actionCooldownTotals:[1,1,1,1,1,1], camera: { x: WORLD_W / 2, y: WORLD_H / 2 }, viewW: CANVAS_W, viewH: CANVAS_H, lastLootSeq: 0, lootSeq: 0, worldSeq: 0, networkLastWrite: 0, networkLastWorld: 0, seed: options.seed || Math.floor(Math.random() * 99999999), profiles: options.profiles || {}, playerUids: options.playerUids || [player.uid], hostUid: options.hostUid || player.uid, boss: null, bossTelegraph: null, message: "", messageUntil: 0, layout: null, roomExitOpen: false, minimap: null, roomTransitionLock: 0, zones: [], selectedTargetUid: player.uid, selectedEnemyId: "", targetPoint: null, cooldownTotals: SKILL_BASE_COOLDOWNS.slice(), reviveCooldown:0, reviveCooldownTotal:REVIVE_COOLDOWN, openedChestIds: new Set(), nearbyChestId: "", combatLog:["Dungeon betreten · Raum 1"], runtimeErrors:0, lastRuntimeErrorAt:0, roomBannerUntil:0, runId:`${options.seed||0}:${options.hostUid||player.uid}:${Date.now()}`, lastWorldRunId:"", combatMeterOpen:false, networkLastPartyHeartbeat:0, hostHeartbeatTimeoutAt:0, partyClosed:false };
      if (options.online) setupDungeonNetwork(options);
      buildRoom(session, 1);
      d.stats.runs++;
      safeSave();
      renderDungeonLoading(session, () => {
        if (UI.session !== session || !UI.overlay || !UI.main) return;
        try {
          renderDungeonStage();
          UI.last = performance.now();
          if (UI.raf) cancelAnimationFrame(UI.raf);
          UI.raf = requestAnimationFrame(loop);
        } catch (error) {
          console.error("Dungeon.KL Stage-Start", error);
          stopSession(false);
          toast("Dungeon konnte nicht gestartet werden", error?.message || "Unbekannter Ladefehler");
          renderHome();
        }
      });
    } catch (error) {
      console.error("Dungeon.KL Start", error);
      stopSession(false);
      toast("Dungeon-Start fehlgeschlagen", error?.message || "Unbekannter Fehler");
      if (UI.overlay) renderHome();
    }
  }
  function stabilizeCombatActor(actor,fallback={}){
    if(!actor)return actor;
    actor.x=finite(actor.x,finite(fallback.x,WORLD_W/2));actor.y=finite(actor.y,finite(fallback.y,WORLD_H/2));actor.netX=finite(actor.netX,actor.x);actor.netY=finite(actor.netY,actor.y);
    actor.maxHp=Math.max(1,finite(actor.maxHp,finite(fallback.maxHp,100)));actor.hp=clamp(finite(actor.hp,actor.maxHp),0,actor.maxHp);actor.shield=Math.max(0,finite(actor.shield,0));
    actor.damage=Math.max(1,finite(actor.damage,finite(fallback.damage,1)));actor.healing=Math.max(0,finite(actor.healing,finite(fallback.healing,0)));actor.armor=clamp(finite(actor.armor,finite(fallback.armor,0)),0,.82);
    actor.crit=clamp(finite(actor.crit,finite(fallback.crit,.05)),0,.8);actor.haste=clamp(finite(actor.haste,finite(fallback.haste,0)),0,.8);actor.attackRate=Math.max(.15,finite(actor.attackRate,finite(fallback.attackRate,1)));
    actor.range=Math.max(35,finite(actor.range,finite(fallback.range,100)));actor.power=Math.max(1,finite(actor.power,finite(fallback.power,1)));actor.attackCd=Math.max(0,finite(actor.attackCd,0));
    actor.damageDone=Math.max(0,finite(actor.damageDone,0));actor.healingDone=Math.max(0,finite(actor.healingDone,0));actor.buffs=actor.buffs&&typeof actor.buffs==="object"?actor.buffs:{};
    return actor;
  }
  function makePlayer({ uid: id, name, role, classId, stats={}, local, x, y, appearance=null, gearVisual=null, hunterPet=null, actionBar=null }) {
    const r = ROLES[role] || ROLES.dps, c = CLASSES[classId] || CLASSES.berserker, px=finite(x,WORLD_W/2),py=finite(y,WORLD_H-150),maxHp=Math.max(1,finite(stats.health,500));
    const player={ uid:String(id||uid()), name:String(name||"Spieler"), role:r===ROLES[role]?role:"dps", classId:CLASSES[classId]?classId:"berserker", local:!!local, x:px, y:py, vx:0, vy:0, angle:-Math.PI/2, radius:20, maxHp, hp:maxHp, damage:Math.max(1,finite(stats.damage,50)), healing:Math.max(0,finite(stats.healing,0)), armor:clamp(finite(stats.armor,0),0,.82), crit:clamp(finite(stats.crit,.08),0,.8), haste:clamp(finite(stats.haste,.05),0,.8), power:Math.max(1,finite(stats.power,80)), cooldownReduction:clamp(finite(stats.cooldownReduction,0),0,.5), shieldBonus:Math.max(0,finite(stats.shieldBonus,0)), moveBonus:Math.max(0,finite(stats.moveBonus,0)), range:Math.max(35,finite(c.range,100)), attackRate:Math.max(.15,finite(c.attackRate,1)), projectile:!!c.projectile, attackCd:0, skillSeq:0, skillRequested:0, reviveSeq:0, reviveRequested:false, actionSeq:0, actionSlotRequested:0, actionBar:Array.isArray(actionBar)?actionBar.slice(0,6):defaultActionBar(classId), dead:false, downedAt:0, shield:0, buffs:{}, color:c.color, moving:false, climbing:false, walkPhase:0, attackAnim:0, castAnim:0, skillAnim:0, netX:px, netY:py, targetUid:"", targetEnemyId:"", targetX:px, targetY:py, appearance:appearance||{gender:"male",skin:"medium",hair:"dark",preset:"human",hairStyle:"short",accent:c.color,ready:true}, gearVisual:gearVisual||{armor:c.color,trim:c.color,helmet:c.color,gloves:c.color,boots:c.color,weapon:c.color,offhand:c.color,helmetType:role==="tank"?"helmet":role==="healer"?"hood":"none",weaponModule:"steel"}, hunterPet:null, supportPet:null, lastDamageAt:performance.now(), regenAccumulator:0, healthSeq:0, lastAppliedHealthSeq:-1, hitSeq:0, lastAppliedHitSeq:0, damageDone:0, healingDone:0 };
    if(hunterPet&&player.classId==="ranger")player.hunterPet=makeHunterPetRuntime(hunterPet,{x:px,y:py,ownerId:player.uid,ownerLevel:Math.max(1,Math.floor(finite(hunterPet.level,finite(stats.level,1))))});
    return stabilizeCombatActor(player,{maxHp:500,damage:50,attackRate:1,range:c.range});
  }
  function makeHunterPetRuntime(profile,{x,y,ownerId,ownerLevel=1}){
    const level=clamp(Math.floor(finite(ownerLevel,finite(profile?.level,1))),1,MAX_LEVEL),species=String(profile?.species||"wolf"),maxHp=Math.max(1,Math.round(95+level*22)),petId=String(profile?.id||uid());
    return stabilizeCombatActor({id:petId,uid:`pet:${String(ownerId||"")}:${petId}`,isPet:true,petType:"hunter",ownerId:String(ownerId||""),species,name:String(profile?.name||"Runenwolf"),role:"dps",level,x:finite(x,WORLD_W/2)-36,y:finite(y,WORLD_H/2)+28,netX:finite(x,WORLD_W/2)-36,netY:finite(y,WORLD_H/2)+28,radius:15,maxHp,hp:maxHp,damage:Math.max(1,Math.round(8+level*3.1)),healing:0,armor:.12,crit:.08,haste:0,attackRate:.87,range:55,power:Math.round(level*48),shield:0,attackCd:0,angle:0,moving:false,walkPhase:0,attackAnim:0,dead:false,buffs:{},lastDamageAt:performance.now(),regenAccumulator:0,damageDone:0,healingDone:0});
  }
  function refreshHunterPetRuntime(player){
    if(!player||player.classId!=="ranger"){if(player)player.hunterPet=null;return;}
    const profile=player.local?activeHunterPet():player.hunterPet;if(!profile)return;
    const level=clamp(Math.floor(player.local?finite(ensureState()?.level,1):finite(profile.level,1)),1,MAX_LEVEL),maxHp=Math.max(1,Math.round(95+level*22));
    if(!player.hunterPet||!Number.isFinite(Number(player.hunterPet.x)))player.hunterPet=makeHunterPetRuntime(profile,{x:player.x,y:player.y,ownerId:player.uid,ownerLevel:level});
    const pet=player.hunterPet,ratio=pet.maxHp>0?clamp(finite(pet.hp,pet.maxHp)/pet.maxHp,0,1):1;
    pet.level=level;pet.maxHp=maxHp;pet.hp=pet.dead?0:clamp(Math.round(maxHp*ratio),0,maxHp);pet.damage=Math.max(1,Math.round(Math.max(6,finite(player.damage,1)*.34)));pet.ownerId=player.uid;pet.uid=`pet:${player.uid}:${pet.id}`;pet.role="dps";pet.isPet=true;pet.petType="hunter";stabilizeCombatActor(pet,{x:player.x-36,y:player.y+28,maxHp,damage:pet.damage,attackRate:.87,range:55});
  }

  function renderDungeonLoading(session,done){
    const tips=["Tanks eröffnen den Kampf und binden Gegner.","Kisten enthalten Gold und tragbare Ausrüstung.","Mit I kannst du dein Loadout im Dungeon wechseln.","Heiler können Sühne offensiv oder defensiv einsetzen.","Mauern unterbrechen Sichtlinien und Angriffe."];
    const symbol=session.dungeon.theme==="ice"?"❄":session.dungeon.theme==="forest"?"🌿":session.dungeon.theme==="void"?"◉":session.dungeon.theme==="universe"?"✦":"◆";
    const token=++UI.loadingToken;
    UI.view="loading";
    UI.main.innerHTML=`<div class="dkl-dungeon-loading" style="--load-color:${session.dungeon.color}"><div class="dkl-load-runes"><i></i><i></i><i></i></div><span class="dkl-load-symbol">${symbol}</span><small>GRUPPEN-DUNGEON WIRD VORBEREITET</small><h2>${esc(session.dungeon.name)}</h2><p>${esc(tips[Math.abs((Number(session.seed)||0)+session.partySize)%tips.length])}</p><div class="dkl-load-party">${session.players.map(p=>`<b>${ROLES[p.role]?.icon||"◆"} ${esc(p.name)}</b>`).join("")}</div><div class="dkl-load-progress"><i></i></div><em data-dkl-load-text>Dungeon-Grundriss wird aufgebaut …</em></div>`;
    const bar=UI.main.querySelector(".dkl-load-progress i"),label=UI.main.querySelector("[data-dkl-load-text]");
    const phases=["Dungeon-Grundriss wird aufgebaut …","Monster und Bosse werden platziert …","Ausrüstung und Fähigkeiten werden geladen …","Die Gruppe betritt den Dungeon …"];
    let progress=0,finished=false;
    const finish=()=>{
      if(finished)return;
      finished=true;
      clearInterval(interval);
      clearTimeout(fallback);
      if(UI.loadingToken!==token||UI.session!==session)return;
      if(bar)bar.style.width="100%";
      if(label)label.textContent=phases[3];
      window.setTimeout(()=>{if(UI.loadingToken===token&&UI.session===session)done();},120);
    };
    const interval=window.setInterval(()=>{
      if(UI.loadingToken!==token||UI.session!==session){clearInterval(interval);return;}
      progress=Math.min(100,progress+14);
      if(bar)bar.style.width=`${progress}%`;
      if(label)label.textContent=phases[Math.min(phases.length-1,Math.floor(progress/26))];
      if(progress>=100)finish();
    },90);
    const fallback=window.setTimeout(finish,1800);
    UI.timers.push(interval,fallback);
  }
  function setupDungeonNetwork(options) {
    const s = UI.session, p = s.online, fb = p.fb; if (!p) return;
    s.selfRef = fb.doc(fb.db, PARTY_COLLECTION, p.code, "players", p.user.uid); s.worldRef = fb.doc(fb.db, PARTY_COLLECTION, p.code, "world", "current");
    const profileMap = options.profiles || {};
    for (const id of options.playerUids || []) { if (id === p.user.uid) continue; const pr = profileMap[id] || {}; const role = ROLES[pr.role] ? pr.role : "dps", classId = CLASSES[pr.classId] ? pr.classId : "berserker", stats = { health:Math.max(1,finite(pr.maxHp,500)), damage:Math.max(1,finite(pr.damage,50)), healing:Math.max(0,finite(pr.healing,0)), armor:clamp(finite(pr.armor,0),0,.82), crit:clamp(finite(pr.crit,.08),0,.8), haste:clamp(finite(pr.haste,.05),0,.8), power:Math.max(1,finite(pr.power,80)), cooldownReduction:clamp(finite(pr.cooldownReduction,0),0,.5), shieldBonus:Math.max(0,finite(pr.shieldBonus,0)), moveBonus:Math.max(0,finite(pr.moveBonus,0)), level:clamp(Math.floor(finite(pr.level,1)),1,MAX_LEVEL) }; const remote = makePlayer({ uid: id, name: pr.name || "Mitspieler", role, classId, stats, local: false, x: WORLD_W / 2 + rand(-100, 100), y: WORLD_H - 150 + rand(-30, 30), appearance:pr.appearance||null, gearVisual:pr.gearVisual||null, hunterPet:pr.hunterPet||null, actionBar:pr.actionBar||defaultActionBar(classId) }); remote.supportPet=makeSupportPetRuntime(pr.supportPet||null,{x:remote.x,y:remote.y,ownerId:remote.uid,ownerLevel:stats.level,ownerPower:stats.power});if(remote.supportPet){remote.supportPet.uid=`pet:${remote.uid}:${remote.supportPet.id}`;remote.supportPet.isPet=true;remote.supportPet.petType="support";}s.players.push(remote); s.remotePlayers.set(id, remote); }
    UI.onlineUnsubs.push(fb.onSnapshot(s.worldRef, snap => { if (!snap.exists() || s.host) return; applyWorldSnapshot(snap.data()); }));
    if (s.host) {
      for (const id of s.playerUids) { if (id === p.user.uid) continue; const ref = fb.doc(fb.db, PARTY_COLLECTION, p.code, "players", id); UI.onlineUnsubs.push(fb.onSnapshot(ref, snap => { if (!snap.exists()) return; applyRemoteInput(id, snap.data()); })); }
    }
  }
  function abilityArtHtml(info){const kind=esc(info?.kind||"empty"),icon=esc(info?.icon||"＋");return `<i class="dkl-ability-art ${kind}"><em>${icon}</em></i>`;}
  function actionButtonHtml(classId,abilityId,slot){const info=abilityInfo(classId,abilityId);if(!info)return `<button data-dkl-action-slot="${slot}" class="empty"><i class="dkl-ready-sweep" data-dkl-action-fill="${slot}"></i><span class="dkl-action-number">${slot+1}</span><b>Leer</b>${abilityArtHtml(null)}<small data-dkl-action-cd="${slot}">Nicht belegt</small></button>`;return `<button data-dkl-action-slot="${slot}" class="ready"><i class="dkl-ready-sweep" data-dkl-action-fill="${slot}"></i><span class="dkl-action-number">${slot+1}</span><b>${esc(info.name)}</b>${abilityArtHtml(info)}<small data-dkl-action-cd="${slot}">Bereit</small></button>`;}
  function setActionBarSlot(data,slot,abilityId){const bar=ensureActionBarData(data);slot=clamp(Math.floor(Number(slot)||0),0,5);if(abilityId&&!abilityUnlocked(data,abilityId))return false;const existing=bar.indexOf(abilityId);if(abilityId&&existing>=0&&existing!==slot)[bar[existing],bar[slot]]=[bar[slot],bar[existing]];else bar[slot]=abilityId||"";data.actionBars[data.classId]=bar;safeSave();return true;}
  function actionCooldownFor(player,info){return Math.max(.5,Number(info?.cooldown||8)*(1-clamp((player.cooldownReduction||0)+player.haste*.12,0,.45)));}
  function executeExtraAbility(s,p,id){
    const info=abilityInfo(p.classId,id),target=activeEnemyTarget(s,p,780),ally=activePlayerTarget(s,p,false)||p;if(!info)return false;
    const requireTarget=()=>{if(target)return true;if(p.local)showMessage("Gegner auswählen",1300);return false;};
    const castProjectile=(damageMultiplier,color=info.color||p.color,extra={})=>{if(!requireTarget())return false;const a=Math.atan2(target.y-p.y,target.x-p.x);s.projectiles.push({x:p.x,y:p.y-14,vx:Math.cos(a)*(extra.speed||690),vy:Math.sin(a)*(extra.speed||690),radius:extra.radius||8,damage:p.damage*damageMultiplier,ownerUid:p.uid,friendly:true,life:extra.life||1.8,color,homingId:target.id,kind:extra.kind||info.kind,trail:extra.trail||52,splashRadius:extra.splashRadius||0,splashPower:extra.splashPower||0,dotPower:extra.dotPower||0});return true;};
    let effectTarget=target||ally||p,effectType=info.kind||"skill",used=true;
    if(id==="guardian_charge"){if(!requireTarget())return false;const angle=Math.atan2(target.y-p.y,target.x-p.x);tryMoveEntity(s,p,Math.cos(angle)*Math.min(120,Math.max(0,distance(p,target)-55)),Math.sin(angle)*Math.min(120,Math.max(0,distance(p,target)-55)));damageEnemy(s,target,p.damage*1.65,p);target.targetUid=p.uid;target.alerted=true;}
    else if(id==="berserker_signature"){areaDamage(s,p.x,p.y,175,p.damage*2.1,p);effectTarget=p;effectType="bloodburst";}
    else if(id==="ranger_signature"){if(!requireTarget())return false;if(p.hunterPet){p.hunterPet.attackAnim=.7;damageEnemy(s,target,p.damage*1.9,p);}else damageEnemy(s,target,p.damage*1.25,p);effectType="natureburst";}
    else if(id==="arcanist_signature"||id==="cleric_holy_spear"){used=castProjectile(id==="cleric_holy_spear"?2.15:2.45,id==="cleric_holy_spear"?"#fff09a":"#9bdcff",{radius:9,kind:"penance",trail:68});effectType=id==="cleric_holy_spear"?"lightwave":"frostburst";}
    else if(id==="warlock_signature"){if(!requireTarget())return false;areaDamage(s,target.x,target.y,180,p.damage*2.3,p);effectType="voidburst";}
    else if(id==="cleric_radiance"||id==="druid_radiance"){for(const member of s.players)if(!member.dead&&lineWalkable(s,p,member,5)){healPlayer(s,member,p.healing*1.25,p);member.shield=Math.max(member.shield||0,Math.round(member.maxHp*.12));}effectTarget=p;effectType=id==="druid_radiance"?"natureburst":"lightwave";}
    else if(info.action==="target_projectile"){used=castProjectile(info.power||1.4,info.color,{radius:info.kind==="soulfire"?10:7,speed:info.kind==="soulfire"?520:700,kind:info.kind,trail:info.kind==="soulfire"?74:56,splashRadius:info.splash||0,splashPower:(info.power||1.4)*.55,dotPower:info.dotPower||0});effectType=info.kind.includes("fire")?"fireburst":info.kind.includes("poison")||info.kind.includes("moon")?"natureburst":"skill";}
    else if(info.action==="area_damage"){areaDamage(s,p.x,p.y,info.radius||165,p.damage*(info.power||1.5),p);effectTarget=p;effectType=info.kind==="groundslam"?"groundslam":info.kind==="arcanenova"?"arcaneburst":"bloodburst";}
    else if(info.action==="group_shield"){for(const member of s.players)if(!member.dead&&lineWalkable(s,p,member,5))member.shield=Math.max(member.shield||0,Math.round(member.maxHp*(info.power||.2)*(1+(p.shieldBonus||0))));for(const enemy of s.enemies)if(!enemy.dead&&distance(p,enemy)<360){enemy.targetUid=p.uid;enemy.alerted=true;}effectTarget=p;effectType="shieldburst";}
    else if(info.action==="last_stand"){healPlayer(s,p,p.maxHp*(info.power||.4),p);p.shield=Math.max(p.shield||0,Math.round(p.maxHp*.65*(1+(p.shieldBonus||0))));p.buffs.fortress=Math.max(p.buffs.fortress||0,10);effectTarget=p;effectType="shieldburst";}
    else if(info.action==="combat_buff"){p.buffs.haste=Math.max(p.buffs.haste||0,10);p.buffs.damageBoost=Math.max(p.buffs.damageBoost||0,10);effectTarget=p;effectType="bloodburst";}
    else if(info.action==="execute"){if(!requireTarget())return false;const bonus=target.hp/Math.max(1,target.maxHp)<.35?1.75:1;damageEnemy(s,target,p.damage*(info.power||2.2)*bonus,p);effectType="bloodburst";}
    else if(info.action==="dash_area"){if(!requireTarget())return false;const angle=Math.atan2(target.y-p.y,target.x-p.x),travel=Math.min(170,Math.max(0,distance(p,target)-48));tryMoveEntity(s,p,Math.cos(angle)*travel,Math.sin(angle)*travel);areaDamage(s,p.x,p.y,info.radius||145,p.damage*(info.power||1.7),p);effectTarget=p;effectType="groundslam";}
    else if(info.action==="volley"){if(!requireTarget())return false;const base=Math.atan2(target.y-p.y,target.x-p.x);for(let i=0;i<5;i++){const a=base+(i-2)*.08;s.projectiles.push({x:p.x,y:p.y-10,vx:Math.cos(a)*690,vy:Math.sin(a)*690,radius:5,damage:p.damage*(info.power||.7),ownerUid:p.uid,friendly:true,life:1.6,color:info.color,kind:"volley",trail:42});}effectType="arrowrain";}
    else if(info.action==="pet_heal"){if(!p.hunterPet){if(p.local)showMessage("Kein aktiver Begleiter",1300);return false;}p.hunterPet.hp=Math.min(p.hunterPet.maxHp,p.hunterPet.hp+p.hunterPet.maxHp*(info.power||.6));p.hunterPet.shield=Math.round(p.hunterPet.maxHp*.3);effectTarget=p.hunterPet;effectType="natureburst";s.texts.push({x:p.hunterPet.x,y:p.hunterPet.y-30,text:"TIER GEHEILT",color:info.color,life:1});}
    else if(info.action==="zone_damage"){if(!requireTarget())return false;s.zones.push({id:uid(),type:"damage",x:target.x,y:target.y,radius:info.radius||150,life:info.duration||7,maxLife:info.duration||7,tick:0,ownerUid:p.uid,amount:Math.max(1,p.damage*(info.power||.6)),color:info.color});effectType=info.kind.includes("frost")?"frostburst":info.kind.includes("curse")?"voidburst":"skill";}
    else if(info.action==="blink"){const dx=Math.cos(p.angle)*185,dy=Math.sin(p.angle)*185;tryMoveEntity(s,p,dx,0);tryMoveEntity(s,p,0,dy);effectTarget=p;effectType="arcaneburst";}
    else if(info.action==="self_shield"){p.shield=Math.max(p.shield||0,Math.round(p.maxHp*(info.power||.65)*(1+(p.shieldBonus||0))));effectTarget=p;effectType="shieldburst";}
    else if(info.action==="drain"){if(!requireTarget())return false;const raw=p.damage*(info.power||1.4),before=target.hp;damageEnemy(s,target,raw,p);const dealt=Math.max(1,before-target.hp);healPlayer(s,p,dealt*(info.healRatio||.45),p);effectType="voidburst";}
    else if(info.action==="self_shield_aura"){p.shield=Math.max(p.shield||0,Math.round(p.maxHp*(info.power||.55)*(1+(p.shieldBonus||0))));areaDamage(s,p.x,p.y,150,p.damage*.75,p);effectTarget=p;effectType="voidburst";}
    else if(info.action==="hybrid_nova"){areaDamage(s,p.x,p.y,info.radius||190,p.damage*(info.power||1.1),p);for(const member of s.players)if(!member.dead&&distance(p,member)<(info.radius||190)+member.radius)healPlayer(s,member,p.healing*(info.healPower||.8),p);effectTarget=p;effectType="lightwave";}
    else if(info.action==="zone_heal"){const anchor=ally||p;s.zones.push({id:uid(),type:"heal",x:anchor.x,y:anchor.y,radius:info.radius||110,life:info.duration||8,maxLife:info.duration||8,tick:0,ownerUid:p.uid,amount:Math.max(1,p.healing*(info.power||.5)),color:info.color});effectTarget=anchor;effectType="natureburst";}
    else if(info.action==="heal_shield"){healPlayer(s,ally,p.healing*(info.power||1.2),p);ally.shield=Math.max(ally.shield||0,Math.round(ally.maxHp*(info.shieldPower||.4)*(1+(p.shieldBonus||0))));effectTarget=ally;effectType="shieldburst";}
    else if(info.action==="control"){if(!requireTarget())return false;damageEnemy(s,target,p.damage*(info.power||1.1),p);target.specialCd=(target.specialCd||0)+3;target.attackCd=(target.attackCd||0)+2;effectType="frostburst";}
    else if(info.action==="ally_shield"){const shieldTarget=ally||p;shieldTarget.shield=Math.max(shieldTarget.shield||0,Math.round(shieldTarget.maxHp*(info.power||.6)*(1+(p.shieldBonus||0))));effectTarget=shieldTarget;effectType="natureburst";}
    else if(info.action==="group_zone_heal"){s.zones.push({id:uid(),type:"heal",x:p.x,y:p.y,radius:info.radius||210,life:info.duration||10,maxLife:info.duration||10,tick:0,ownerUid:p.uid,amount:Math.max(1,p.healing*(info.power||.42)),color:info.color});effectTarget=p;effectType="natureburst";}
    else return false;
    if(!used)return false;p.castAnim=.8;p.attackAnim=.3;p.skillAnim=7;s.effects.push({type:effectType,x:effectTarget?.x||p.x,y:effectTarget?.y||p.y,radius:info.radius||115,life:1,color:info.color||p.color});playSound("skill");return true;
  }
  function executeAbilityId(s,p,abilityId,slot=-1){const info=abilityInfo(p.classId,abilityId);if(!info)return false;let used=false;if(info.baseIndex!=null)used=executeSkill(s,p,info.baseIndex,{actionSlot:slot});else if(abilityId==="revive"){used=executeRevive(s,p);if(used&&p.local&&slot>=0){s.actionCooldowns[slot]=actionCooldownFor(p,info);s.actionCooldownTotals[slot]=s.actionCooldowns[slot];}}else{used=executeExtraAbility(s,p,abilityId);if(used&&p.local&&slot>=0){s.actionCooldowns[slot]=actionCooldownFor(p,info);s.actionCooldownTotals[slot]=s.actionCooldowns[slot];}}return used;}
  function useActionSlot(slot){unlockAudio();const s=UI.session;if(!s||s.player.dead)return;slot=clamp(Math.floor(Number(slot)||0),0,5);if((s.actionCooldowns[slot]||0)>0)return;const id=s.player.actionBar?.[slot]||"";if(!id)return showMessage("Dieser Platz ist leer",900);const used=executeAbilityId(s,s.player,id,slot);if(!used)return;if(s.online&&!s.host){s.player.actionSeq=(s.player.actionSeq||0)+1;s.player.actionSlotRequested=slot+1;}}

  function renderDungeonStage() {
    const s = UI.session; if(!s) return renderHome(); refreshSessionLoadout(); UI.view = "dungeon"; const c=CLASSES[s.player.classId],role=ROLES[s.player.role],actionBar=s.player.actionBar||ensureActionBarData(ensureState());
    UI.main.innerHTML = `<div class="dkl-stage dkl-mmo-stage"><canvas tabindex="0" width="${CANVAS_W}" height="${CANVAS_H}" data-dkl-canvas aria-label="Dungeon-Spielfeld"></canvas><canvas class="dkl-mini-map" width="190" height="112" data-dkl-minimap></canvas>
      <div class="dkl-mmo-player-frame role-${s.player.role}"><span>${c.icon}</span><div><b>${esc(s.player.name)}</b><small>${role.name} · ${c.name}</small><div class="health"><i data-dkl-hp></i></div><em data-dkl-hp-text></em><div class="shield"><i data-dkl-shield></i></div></div></div>
      <div class="dkl-mmo-target-frame" data-dkl-target-frame><span data-dkl-target-icon>◎</span><div><b data-dkl-target-name>${esc(s.player.name)}</b><small data-dkl-target-type>Verbündeter</small><div><i data-dkl-target-health></i></div><em data-dkl-target-health-text>100 %</em><button class="dkl-target-trade" data-dkl-target-trade hidden>Handeln</button></div></div>
      <div class="dkl-room-title dkl-mmo-room" data-dkl-room-banner><small>${esc(s.dungeon.name)}</small><b data-dkl-room>Raum ${s.room}/${s.dungeon.rooms}</b><em data-dkl-objective></em></div><div class="dkl-team-hud dkl-mmo-party" data-dkl-team></div>
      <div class="dkl-boss-hud" data-dkl-boss hidden><b></b><div><i></i></div><small></small></div>
      <button class="dkl-meter-toggle" data-dkl-meter-toggle type="button" aria-expanded="false"><span>▥</span><b>Schaden & Heal</b></button><section class="dkl-combat-meter" data-dkl-combat-meter hidden><header><div><small>AKTUELLER RUN</small><b>Kampfstatistik</b></div><button type="button" data-dkl-meter-close aria-label="Statistik schließen">×</button></header><div data-dkl-meter-list></div></section>
      <div class="dkl-combat-log"><header><b>Dungeon-Chat</b><small>Gruppe & Kampf</small></header><div data-dkl-combat-log></div><form data-dkl-chat-form><input data-dkl-chat-input maxlength="120" placeholder="Nachricht an die Gruppe …"><button>↵</button></form></div>
      <button class="dkl-interact-button" data-dkl-interact hidden><span>E</span><b>Kiste öffnen</b><small>Loot aufnehmen</small></button><button class="dkl-loadout-button" data-dkl-loadout><span>I</span><b>Inventar</b><small>Ausrüstung wechseln</small></button>
      <div class="dkl-combat-actions dkl-mmo-actionbar target-combat">${actionBar.map((abilityId,slot)=>actionButtonHtml(s.player.classId,abilityId,slot)).join("")}</div>
      <div class="dkl-mobile-stick" data-dkl-stick><i></i></div><button class="dkl-exit-button" data-dkl-exit hidden>Dungeon verlassen</button></div>`;
    const canvas = UI.main.querySelector("[data-dkl-canvas]"); s.canvas = canvas; s.ctx = canvas.getContext("2d",{alpha:false}); s.minimap = UI.main.querySelector("[data-dkl-minimap]"); UI.keys=Object.create(null); resizeCanvas(); window.addEventListener("resize", resizeCanvas, { once: true });
    canvas.addEventListener("pointerdown", e=>{canvas.focus({preventScroll:true});pointerDown(e);}); canvas.addEventListener("pointermove", pointerMove); canvas.addEventListener("pointerup", pointerUp); canvas.addEventListener("pointercancel", pointerUp); canvas.addEventListener("contextmenu",e=>e.preventDefault());
    bindDungeonMobileStick(UI.main.querySelector("[data-dkl-stick]"));
    UI.main.querySelectorAll("[data-dkl-action-slot]").forEach(btn=>btn.addEventListener("click",()=>useActionSlot(Number(btn.dataset.dklActionSlot))));
    UI.main.querySelector("[data-dkl-team]")?.addEventListener("click", event => { const card = event.target.closest("[data-dkl-target-player]"); if (!card) return; selectPlayerTarget(card.dataset.dklTargetPlayer); });
    UI.main.querySelector("[data-dkl-exit]").addEventListener("click", finishDungeonExit);
    UI.main.querySelector("[data-dkl-interact]")?.addEventListener("click", interactNearby);
    UI.main.querySelector("[data-dkl-target-trade]")?.addEventListener("click",openTradeGift);
    UI.main.querySelector("[data-dkl-loadout]")?.addEventListener("click", renderInventory);
    UI.main.querySelector("[data-dkl-chat-form]")?.addEventListener("submit",event=>{event.preventDefault();const input=UI.main.querySelector("[data-dkl-chat-input]"),message=String(input?.value||"").trim();if(!message)return;pushCombatLog(s,`${s.player.name}: ${message}`);input.value="";});
    UI.main.querySelector("[data-dkl-meter-toggle]")?.addEventListener("click",toggleCombatMeter);
    UI.main.querySelector("[data-dkl-meter-close]")?.addEventListener("click",()=>{s.combatMeterOpen=false;syncCombatMeterVisibility(s);});
    syncCombatMeterVisibility(s);
    canvas.focus({preventScroll:true}); updateDungeonHud();
  }
  function toggleCombatMeter(){const s=UI.session;if(!s)return;s.combatMeterOpen=!s.combatMeterOpen;syncCombatMeterVisibility(s);}
  function syncCombatMeterVisibility(s=UI.session){if(!s||!UI.main)return;const panel=UI.main.querySelector("[data-dkl-combat-meter]"),button=UI.main.querySelector("[data-dkl-meter-toggle]");if(panel)panel.hidden=!s.combatMeterOpen;if(button){button.classList.toggle("active",!!s.combatMeterOpen);button.setAttribute("aria-expanded",s.combatMeterOpen?"true":"false");}}
  function updateCombatMeter(s){const list=UI.main?.querySelector("[data-dkl-meter-list]");if(!list)return;const players=(s.players||[]).filter(Boolean).slice().sort((a,b)=>(Number(b.damageDone)||0)-(Number(a.damageDone)||0)||(Number(b.healingDone)||0)-(Number(a.healingDone)||0)),maxDamage=Math.max(1,...players.map(p=>Math.max(0,Number(p.damageDone)||0))),maxHealing=Math.max(1,...players.map(p=>Math.max(0,Number(p.healingDone)||0)));list.innerHTML=players.map((p,index)=>{const damage=Math.max(0,Math.round(Number(p.damageDone)||0)),healing=Math.max(0,Math.round(Number(p.healingDone)||0)),damagePct=clamp(damage/maxDamage*100,0,100),healPct=clamp(healing/maxHealing*100,0,100);return `<article class="role-${esc(p.role)} ${p.local?"me":""}"><div class="dkl-meter-player"><span>${CLASSES[p.classId]?.icon||"◆"}</span><b>${esc(p.name)}</b><em>#${index+1}</em></div><div class="dkl-meter-row damage"><small>DMG</small><div><i style="width:${damagePct}%"></i></div><strong>${formatPower(damage)}</strong></div><div class="dkl-meter-row healing"><small>HEAL</small><div><i style="width:${healPct}%"></i></div><strong>${formatPower(healing)}</strong></div></article>`;}).join("");}
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
    if (variant===0) {
      // V158: Eine klar gegliederte, vollständig verbundene Krypta. Alle Hallen,
      // Seitenkammern, Kisten und der Ausgang sind mit Figurenradius erreichbar.
      add(100,100,1300,190,"hall");                 // obere Haupthalle
      add(650,100,200,710,"corridor");              // zentrale Nord-Süd-Achse
      add(100,330,500,230,"room");                  // linke Kammer
      add(900,330,500,230,"room");                  // rechte Kammer
      add(520,390,180,110,"corridor");              // linker Durchgang
      add(800,390,180,110,"corridor");              // rechter Durchgang
      add(100,610,1300,200,"hall");                 // untere Haupthalle
      add(100,525,500,165,"room");                  // untere linke Kammer
      add(900,525,500,165,"room");                  // untere rechte Kammer
      add(520,560,180,120,"corridor");              // unterer linker Durchgang
      add(800,560,180,120,"corridor");              // unterer rechter Durchgang
      ladder(690,560,120,120,"vertical");
      entry={x:750,y:755}; exit={x:750,y:145}; bossPoint={x:750,y:235}; chestPoint={x:300,y:445};
      // Kleine Gruben sorgen für Dungeon-Struktur, ohne Wege abzuschneiden.
      block(175,385,105,90,kind==="flooded"?"water":"pit");
      block(1220,385,105,90,kind==="flooded"?"water":"pit");
      ladder(165,415,125,38,"horizontal");
      ladder(1210,415,125,38,"horizontal");
    } else if (variant===1) {
      add(80,650,520,170); add(410,470,190,350); add(410,410,650,170); add(870,190,190,390); add(870,100,550,170); add(1110,270,310,250);
      ladder(490,580,90,90); ladder(930,310,90,100); entry={x:180,y:735}; exit={x:1320,y:160}; bossPoint={x:1210,y:390}; chestPoint={x:710,y:490};
      block(80,100,720,270,kind==="flooded"?"water":"pit"); block(610,610,790,210,"pit");
    } else if (variant===2) {
      add(80,620,1340,190); add(80,100,200,710); add(1220,100,200,710); add(80,100,1340,190); add(455,315,590,290,"raised");
      ladder(675,220,150,150); ladder(675,550,150,130); raised.push(rct(455,315,590,290,"raised")); entry={x:750,y:755}; exit={x:750,y:155}; bossPoint={x:750,y:445}; chestPoint={x:750,y:445};
      block(300,300,140,300,"pit"); block(1060,300,140,300,"pit");
    } else if (variant===3) {
      add(90,550,560,260); add(90,210,230,410); add(270,210,390,230,"raised"); ladder(530,380,170,230); add(640,270,250,240,"raised"); ladder(780,170,160,170); add(870,100,550,360,"raised"); add(1090,390,330,420);
      raised.push(rct(270,210,390,230,"raised"),rct(640,270,250,240,"raised"),rct(870,100,550,360,"raised")); entry={x:190,y:720}; exit={x:1320,y:180}; bossPoint={x:1160,y:260}; chestPoint={x:760,y:380};
      block(350,460,670,250,"pit");
    } else if (variant===4) {
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
    const chestSpawns=[];
    const chestCandidates=[chestPoint,{x:1200,y:445},{x:300,y:650},{x:1200,y:650}];
    for(const prop of props.filter(item=>item.type==="crate")) chestCandidates.push({x:prop.x,y:prop.y});
    for(const point of chestCandidates){
      if(!isPointInWalkableRaw(walkable,blocked,point.x,point.y,28))continue;
      if(chestSpawns.some(c=>Math.hypot(c.x-point.x,c.y-point.y)<110))continue;
      chestSpawns.push({x:point.x,y:point.y});
    }
    // Kisten werden separat interaktiv gezeichnet und blockieren nicht als Deko-Objekt.
    for(let i=props.length-1;i>=0;i--)if(props[i].type==="crate")props.splice(i,1);
    const roomType=room===1?"entrance":room===s.dungeon.rooms?"finale":room===Math.ceil(s.dungeon.rooms/3)||room===Math.ceil(s.dungeon.rooms*2/3)?"boss":room%5===0?"treasury":room%4===0?"ritual":room%3===0?"barracks":"corridor";
    const roomTitle={entrance:"Eingangshalle",finale:"Thronsaal",boss:"Wächterkammer",treasury:"Schatzgewölbe",ritual:"Ritualkammer",barracks:"Monsterquartier",corridor:"Verwunschene Passage"}[roomType];
    if(roomType==="ritual")props.push({type:"altar",x:bossPoint.x,y:bossPoint.y+50,decor:false},{type:"rune",x:bossPoint.x,y:bossPoint.y+95,decor:true});
    if(roomType==="treasury")props.push({type:"banner",x:entry.x-180,y:entry.y-110,decor:true},{type:"banner",x:entry.x+180,y:entry.y-110,decor:true},{type:"goldpile",x:chestPoint.x+75,y:chestPoint.y,decor:true});
    if(roomType==="barracks")props.push({type:"weaponrack",x:entry.x-170,y:entry.y-100,decor:true},{type:"weaponrack",x:entry.x+170,y:entry.y-100,decor:true});
    if(roomType==="boss"||roomType==="finale")props.push({type:"statue",x:bossPoint.x-150,y:bossPoint.y+20,decor:true},{type:"statue",x:bossPoint.x+150,y:bossPoint.y+20,decor:true});
    const layout={kind,roomType,roomTitle,walkable,blocked,ladders,props,raised,entry,exit,bossPoint,chestPoint,chestSpawns,palette:dungeonPalette(s.dungeon.theme),tile:48,seed:seedValue};
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
  function enemySightRange(enemy){return enemy.boss?540:enemy.elite?360:enemy.ranged?320:ENEMY_SIGHT_BASE;}
  function canEnemySeePlayer(s,enemy,player){
    if(!enemy||!player||player.dead)return false;
    const d=distance(enemy,player);
    if(d>enemySightRange(enemy))return false;
    // Eine Sichtlinie ist nur gültig, wenn sie vollständig über begehbare Fläche
    // verläuft. Mauern, Ecken, Abgründe, Wasser und feste Objekte blockieren Sicht.
    return lineWalkable(s,enemy,player,Math.max(5,Math.min(10,enemy.radius*.22)));
  }
  function createRoomChests(s,room){
    const points=s.layout?.chestSpawns||[s.layout?.chestPoint||{x:750,y:450}];
    const treasureRoom=room%5===0;
    const wanted=treasureRoom?Math.min(3,points.length):Math.min(room===1?2:1,points.length);
    return points.slice(0,wanted).map((point,index)=>({id:`${s.dungeon.id}:${room}:${index}`,x:point.x,y:point.y,radius:30,bonus:treasureRoom?18:0}));
  }
  function roomCombatCleared(s){return !!s && !s.enemies.some(e=>!e.dead);}
  function nearestClosedChest(s){
    if(!roomCombatCleared(s))return null;
    let best=null,bestD=CHEST_INTERACT_RANGE;
    for(const chest of s.chests||[]){
      if(s.openedChestIds?.has(chest.id))continue;
      const d=Math.hypot(s.player.x-chest.x,s.player.y-chest.y);
      if(d<=bestD&&lineWalkable(s,s.player,chest,5)){best=chest;bestD=d;}
    }
    return best;
  }
  function nearestTameableEnemy(s){
    if(ensureState()?.classId!=="ranger")return null;const enemy=s.enemies.find(e=>e.id===s.selectedEnemyId&&!e.dead&&e.tameable);if(!enemy)return null;
    if(distance(s.player,enemy)>118||!lineWalkable(s,s.player,enemy,5)||enemy.hp/enemy.maxHp>.42)return null;return enemy;
  }
  function tameSelectedEnemy(s,enemy){
    const d=ensureState(),hunter=ensureHunterData(d),species=enemy.tameSpecies||hunterPetSpecies(enemy.name)||"wolf",base=species==="wolf"?"Wolf":species==="hound"?"Hund":"Bestie";
    const pet={id:uid(),species,name:`${base} von ${playerName()}`,level:d.level,loyalty:1,acquiredAt:Date.now()};hunter.pets.unshift(pet);hunter.pets=hunter.pets.slice(0,18);hunter.activeId=pet.id;enemy.dead=true;s.selectedEnemyId="";s.autoAttack=false;s.player.hunterPet=makeHunterPetRuntime(pet,{x:s.player.x,y:s.player.y,ownerId:s.player.uid,ownerLevel:d.level});safeSave();
    s.effects.push({type:"blast",x:enemy.x,y:enemy.y,radius:72,life:.9,color:"#9be866"});showMessage(`${pet.name} wurde gezähmt`,2200);pushCombatLog(s,`Jäger-Begleiter gezähmt: ${pet.name}`);
  }
  function interactNearby(){
    const s=UI.session;if(!s||s.player.dead)return;
    const tameable=nearestTameableEnemy(s);if(tameable){tameSelectedEnemy(s,tameable);return;}
    if(!roomCombatCleared(s)){showMessage("Kisten sind verriegelt · zuerst alle Gegner besiegen",1800);return;}
    const chest=nearestClosedChest(s);
    if(!chest){showMessage("Keine geschlossene Kiste in Reichweite",1100);return;}
    s.openedChestIds.add(chest.id);
    const d=ensureState(),bonus=(s.partySize===1?-8:(s.partySize-1)*8)+Number(chest.bonus||0),rarity=rarityForLevel(Math.max(d.level,s.dungeon.level+s.room),bonus),level=clamp(Math.max(d.level,s.dungeon.level)+Math.floor(rand(-1,4)),1,MAX_LEVEL),item=createItem(level,rarity,pick(SLOT_KEYS),d.classId),gold=Math.round(45+s.dungeon.level*13+s.room*11+rand(0,55));
    addItem(item,true);d.gold+=gold;d.stats.chests++;const materialKey=pick(Object.keys(MATERIALS));addMaterial(d,materialKey,Math.max(1,Math.floor(rand(1,4))));if(d.profession.id==="companion"&&Math.random()<.22){const species=pick(Object.keys(COMPANION_SPECIES));addCompanionCopy(d,{species,role:pick(["tank","dps","healer"]),rarity:rarityForLevel(level,8),name:COMPANION_SPECIES[species].name});}safeSave();
    s.effects.push({type:"blast",x:chest.x,y:chest.y,radius:58,life:.7,color:"#ffd96a"});
    s.texts.push({x:chest.x,y:chest.y-42,text:`+${gold} Gold`,color:"#ffd96a",life:1.1});
    showMessage(`KISTE GEÖFFNET · ${item.name}`,1900);playSound("skill");
  }

  function buildRoom(s, room) {
    s.room = room; s.enemies = []; s.projectiles = []; s.effects = []; s.zones = []; s.traps = []; s.chests = []; s.groundLoot=[];s.pickedGroundLootIds=new Set(); s.boss = null; s.selectedEnemyId = ""; s.bossTelegraph = null; s.roomState = "combat"; s.clearAt = 0; s.exitOpen = false; s.roomExitOpen = false; s.roomTransitionLock = performance.now() + 1000;
    s.layout = createRoomLayout(s, room);
    s.chests = createRoomChests(s, room);
    s.players.forEach((p,index)=>{p.x=s.layout.entry.x+(index%2?42:-42)*(index?1:0);p.y=s.layout.entry.y+Math.floor(index/2)*38;p.path=[];if(p.hunterPet){p.hunterPet.x=p.x-34;p.hunterPet.y=p.y+28;p.hunterPet.netX=p.hunterPet.x;p.hunterPet.netY=p.hunterPet.y;p.hunterPet.dead=false;p.hunterPet.hp=Math.max(1,finite(p.hunterPet.maxHp,1));p.hunterPet.shield=0;p.hunterPet.lastDamageAt=performance.now();}if(p.supportPet){p.supportPet.x=p.x+42;p.supportPet.y=p.y+30;p.supportPet.netX=p.supportPet.x;p.supportPet.netY=p.supportPet.y;p.supportPet.dead=false;p.supportPet.hp=Math.max(1,finite(p.supportPet.maxHp,1));p.supportPet.shield=0;p.supportPet.lastDamageAt=performance.now();}});
    const bossRoom = room === Math.ceil(s.dungeon.rooms / 3) || room === Math.ceil(s.dungeon.rooms * 2 / 3) || room === s.dungeon.rooms;
    const trapRoom = !bossRoom && room % 4 === 0; const chestRoom = !bossRoom && room % 5 === 0;
    if (trapRoom) { const count=6+Math.floor(room/3); for(let i=0;i<count;i++){const p=s.layout.trapSpawns[i%s.layout.trapSpawns.length]||s.layout.chestPoint;s.traps.push({x:p.x,y:p.y,radius:rand(28,43),armed:true,pulse:rand(0,6)});} }
    if (bossRoom) {
      const bossIndex = room === s.dungeon.rooms ? 2 : room < s.dungeon.rooms / 2 ? 0 : 1; spawnBoss(s, bossIndex, room === s.dungeon.rooms);
      const adds = Math.min(4, 2 + Math.floor(room / 5) + Math.max(0, s.partySize - 2)); for (let i = 0; i < adds; i++) spawnEnemy(s, false, i);
    } else {
      const baseCount = Math.min(8, 3 + Math.floor(room * .55) + Math.max(0, s.partySize - 1) * 2); for (let i = 0; i < baseCount; i++) spawnEnemy(s, Math.random() < .08 + room * .005, i);
    }
    s.message="";s.messageUntil=0;s.roomBannerUntil=performance.now()+2600;updateDungeonHud();
  }
  function enemyScale(s) { const lvl = Math.max(s.dungeon.level, ensureState().level * .82) + s.room * 1.7; return { level: lvl, hp: 1 + (s.partySize - 1) * .72, damage: 1 + (s.partySize - 1) * .2 }; }
  function themeMonsterColor(theme, elite=false){
    const map={ember:"#ff9a54",forest:"#70d889",ice:"#8fd7ff",water:"#57bfff",storm:"#9aa7ff",forge:"#ff7f52",void:"#ce75ff",gold:"#ffd56a",moon:"#c8d3ff",chaos:"#ff6ccc",bone:"#ddd1ba",universe:"#d9ffff"};
    return elite?"#ffd76a":(map[theme]||"#ff9a54");
  }
  function monsterArchetype(name){const text=String(name||"").toLowerCase();if(/knochen|skelett|oss|gebein/.test(text))return "skeleton";if(/kult|hexe|mag|schamane|beschw/.test(text))return "cultist";if(/kriecher|made|wolf|bestie|löwe|hydra|brut/.test(text))return "beast";return "fiend";}
  function spawnEnemy(s, elite = false, spawnIndex = 0) {
    const scale = enemyScale(s), point=s.layout?.enemySpawns?.[spawnIndex % Math.max(1,s.layout.enemySpawns.length)] || {x:WORLD_W/2+rand(-400,400),y:WORLD_H/2+rand(-250,250)}, x=point.x, y=point.y, ranged = Math.random() < .28;
    const hp = Math.round((85 + scale.level * 24) * scale.hp * (elite ? 2.35 : 1));
    const name = pick(s.dungeon.creatures);
    s.enemies.push({ id: uid(), name, archetype: monsterArchetype(name), x, y, spawnX:x, spawnY:y, radius: elite ? 28 : 20, maxHp: hp, hp, damage: Math.round((8 + scale.level * 2.05) * scale.damage * (elite ? 1.55 : 1)), armor: elite ? .18 : .04, speed: ranged ? 76 : 102, range: ranged ? 310 : 52, ranged, elite, boss: false, attackCd: rand(0, 1), specialCd: rand(1, 4), dead: false, color: themeMonsterColor(s.dungeon.theme, elite), targetUid: "", angle: 0, moving: false, walkPhase: rand(0,6), attackAnim: 0, path: [], pathTimer: 0, alerted:false, tameable:!elite&&!!hunterPetSpecies(name), tameSpecies:hunterPetSpecies(name) });
  }
  function spawnBoss(s, index, finalBoss) { const scale = enemyScale(s), name = s.dungeon.bosses[index], soloHp=s.partySize===1?.78:1, soloDamage=s.partySize===1?.82:1, hp = Math.round((1700 + scale.level * 330) * scale.hp * (finalBoss ? 1.7 : 1) * soloHp); const bossPoint=s.layout?.bossPoint||{x:WORLD_W/2,y:230}; const boss = { id: uid(), name, x: bossPoint.x, y: bossPoint.y, radius: finalBoss ? 58 : 48, maxHp: hp, hp, damage: Math.round((25 + scale.level * 4.4) * scale.damage * (finalBoss ? 1.35 : 1) * soloDamage), armor: finalBoss ? .34 : .24, speed: finalBoss ? 66 : 75, range: 75, ranged: false, elite: false, boss: true, finalBoss, attackCd: 1.5, specialCd: 3.2, dead: false, color: s.dungeon.color, targetUid: "", phase: 1, angle: Math.PI/2, moving: false, walkPhase: 0, attackAnim: 0, path: [], pathTimer: 0 }; s.enemies.push(boss); s.boss = boss; }
  function pushCombatLog(s,text){if(!s)return;s.combatLog=Array.isArray(s.combatLog)?s.combatLog:[];s.combatLog.push(String(text||""));if(s.combatLog.length>18)s.combatLog.splice(0,s.combatLog.length-18);}
  function normalizeActor(actor,fallbackX=WORLD_W/2,fallbackY=WORLD_H/2){
    if(!actor)return;actor.x=finite(actor.x,fallbackX);actor.y=finite(actor.y,fallbackY);actor.netX=finite(actor.netX,actor.x);actor.netY=finite(actor.netY,actor.y);actor.hp=Math.max(0,finite(actor.hp,1));actor.maxHp=Math.max(1,finite(actor.maxHp,1));actor.radius=clamp(finite(actor.radius,20),8,80);actor.angle=finite(actor.angle,-Math.PI/2);actor.buffs=actor.buffs&&typeof actor.buffs==="object"?actor.buffs:{};actor.shield=Math.max(0,finite(actor.shield,0));actor.lastDamageAt=finite(actor.lastDamageAt,performance.now());
  }
  function normalizeSession(s){
    if(!s)return;for(const p of s.players||[])normalizeActor(p,s.layout?.entry?.x||WORLD_W/2,s.layout?.entry?.y||WORLD_H-150);for(const e of s.enemies||[])normalizeActor(e,s.layout?.bossPoint?.x||WORLD_W/2,s.layout?.bossPoint?.y||WORLD_H/2);normalizeActor(s.player);s.camera=s.camera||{x:s.player.x,y:s.player.y};s.camera.x=finite(s.camera.x,s.player.x);s.camera.y=finite(s.camera.y,s.player.y);
  }
  function reportRuntimeError(s,label,error){
    const now=Date.now();s.runtimeErrors=(s.runtimeErrors||0)+1;if(now-(s.lastRuntimeErrorAt||0)>2500){s.lastRuntimeErrorAt=now;console.error(`Dungeon.KL ${label}`,error);pushCombatLog(s,"Darstellungsfehler abgefangen · Spiel läuft weiter");}
  }
  function loop(now) {
    const s = UI.session; if (!s) return;
    const dt = Math.min(.035, Math.max(.001, (now - (UI.last || now)) / 1000)); UI.last = now;
    try{normalizeSession(s);updateSession(s, dt, now);}catch(error){reportRuntimeError(s,"Update",error);}
    try{drawSession(s, now);}catch(error){reportRuntimeError(s,"Darstellung",error);try{drawEmergencyScene(s,now);}catch{}}
    try{updateDungeonHud();}catch(error){reportRuntimeError(s,"HUD",error);}
    if(UI.session===s)UI.raf = requestAnimationFrame(loop);
  }
  function updateSession(s, dt, now) {
    updateLocalInput(s, dt); if (s.online) updateNetwork(s, now);
    if (s.host) { updatePartyCombat(s, dt, now); updateHunterPets(s,dt,true);updateSupportPets(s,dt,true); updateEnemies(s, dt, now); updateProjectiles(s, dt); updateTraps(s, dt, now); updateZones(s, dt); checkRoomClear(s, now); }
    else { updateGuestVisuals(s, dt); }
    if(!s.online||s.host)updateOutOfCombatRegen(s,dt,now);updateGroundLoot(s);updateEffects(s, dt); s.reviveCooldown=Math.max(0,finite(s.reviveCooldown,0)-dt); s.camera.x += (s.player.x - s.camera.x) * Math.min(1, dt * 7); s.camera.y += (s.player.y - s.camera.y) * Math.min(1, dt * 7);
  }
  function updateLocalInput(s, dt) {
    const p = s.player; if (p.dead) return; let dx = 0, dy = 0; if (UI.keys.KeyW || UI.keys.ArrowUp) dy--; if (UI.keys.KeyS || UI.keys.ArrowDown) dy++; if (UI.keys.KeyA || UI.keys.ArrowLeft) dx--; if (UI.keys.KeyD || UI.keys.ArrowRight) dx++;
    if (s.mobileMove) { dx += s.mobileMove.x; dy += s.mobileMove.y; }
    const len = Math.hypot(dx, dy); p.moving=!!len; p.climbing=isOnLadder(s.layout,p.x,p.y);
    if (len) { dx /= len; dy /= len; const speed = 205 * (1 + p.haste * .35 + (p.moveBonus||0)) * (p.climbing?.72:1); tryMoveEntity(s,p,dx*speed*dt,dy*speed*dt); p.angle = Math.atan2(dy, dx); p.walkPhase += dt*(p.climbing?10:15); }
    p.attackCd = Math.max(0, p.attackCd - dt); s.skillCooldowns = s.skillCooldowns.map(v => Math.max(0, v - dt));s.actionCooldowns=s.actionCooldowns.map(v=>Math.max(0,v-dt));
    if (s.autoAttack) {
      const target=s.enemies.find(enemy=>enemy.id===s.selectedEnemyId&&!enemy.dead);
      if(!target){s.autoAttack=false;s.selectedEnemyId="";}
      else if(distance(p,target)<=p.range+12&&lineWalkable(s,p,target,8)){s.noTargetFor=0;autoAttackPlayer(s,p,target);}
      else{s.noTargetFor+=dt;}
    }
  }
  function updatePartyCombat(s, dt) { for (const p of s.players) { if (p.local || p.dead) continue; stabilizeCombatActor(p,{maxHp:500,damage:50,attackRate:CLASSES[p.classId]?.attackRate||1,range:CLASSES[p.classId]?.range||100}); p.attackCd = Math.max(0, finite(p.attackCd,0) - dt); const target=s.enemies.find(e=>e.id===p.targetEnemyId&&!e.dead); if (p.wantAttack && target && distance(p,target)<=p.range+12 && lineWalkable(s,p,target,8)) autoAttackPlayer(s, p, target); if(p.actionSlotRequested){const slot=clamp(Math.floor(finite(p.actionSlotRequested,1))-1,0,5),ability=p.actionBar?.[slot]||"";if(ability)executeAbilityId(s,p,ability,-1);p.actionSlotRequested=0;}else if (p.skillRequested) { executeSkill(s, p, clamp(Math.floor(finite(p.skillRequested,1))-1,0,4)); p.skillRequested = 0; } if(p.reviveRequested){executeRevive(s,p);p.reviveRequested=false;} } }
  function autoAttackPlayer(s, p, target) { stabilizeCombatActor(p,{damage:1,attackRate:1,range:100});if (!target||p.attackCd > 0 || target.dead || distance(p,target)>p.range+12 || !lineWalkable(s,p,target,8)) return false; const rate=Math.max(.15,finite(p.attackRate,1)*(1+clamp(finite(p.haste,0),0,.8)));p.attackCd = Math.max(.08,1/rate); p.angle = Math.atan2(target.y - p.y, target.x - p.x); p.attackAnim=.24;const rolled=rollDamage(p.damage,p.crit,p); if (p.projectile) s.projectiles.push({ x: p.x, y: p.y, vx: Math.cos(p.angle) * 620, vy: Math.sin(p.angle) * 620, radius: 5, damage:rolled, ownerUid: p.uid, friendly: true, life: 1.4, color: p.color }); else damageEnemy(s, target, rolled, p); playSound("attack");return true; }
  function rollDamage(base, crit, source=null) { const safeBase=Math.max(1,finite(base,finite(source?.damage,1))),safeCrit=clamp(finite(crit,finite(source?.crit,.05)),0,.8),boost=finite(source?.buffs?.damageBoost,0)>0?1.28:1;return Math.max(1,Math.round(safeBase*boost*rand(.88,1.12)*(Math.random()<safeCrit?1.75:1))); }
  function nearestEnemy(s,p,max=Infinity){let best=null,bestD=max;for(const e of s.enemies){if(e.dead||!lineWalkable(s,p,e,7))continue;const d=distance(p,e);if(d<bestD){bestD=d;best=e;}}return best;}
  function spawnGroundLoot(s,enemy){
    if(!s||!enemy)return;const d=ensureState(),baseLevel=Math.max(d.level,s.dungeon.level+s.room),drops=[];
    if(enemy.boss||Math.random()<.38)drops.push({type:"gold",amount:Math.round((enemy.boss?90:12)+baseLevel*(enemy.boss?7:1.8)+rand(0,enemy.boss?120:35))});
    if(enemy.boss||Math.random()<.16){const bonus=enemy.boss?22:2,rarity=rarityForLevel(baseLevel,bonus),item=createItem(clamp(baseLevel+Math.floor(rand(-2,4)),1,MAX_LEVEL),rarity,pick(SLOT_KEYS),d.classId);drops.push({type:"item",item});}
    if(enemy.boss||Math.random()<(d.profession?.id?.16:.08)){const key=pick(Object.keys(MATERIALS));drops.push({type:"material",material:key,amount:enemy.boss?Math.floor(rand(3,7)):1});}
    if(d.profession?.id==="companion"&&(enemy.boss||Math.random()<.055)){const species=pick(Object.keys(COMPANION_SPECIES)),role=pick(["tank","dps","healer"]),rarity=rarityForLevel(baseLevel,enemy.boss?12:0);drops.push({type:"pet",pet:{species,role,rarity,name:COMPANION_SPECIES[species].name}});}
    drops.forEach((drop,index)=>s.groundLoot.push({id:uid(),x:enemy.x+(index-(drops.length-1)/2)*34,y:enemy.y+18+index*5,createdAt:Date.now(),...drop}));
  }
  function pickupGroundLoot(s,loot){if(!s||!loot||s.pickedGroundLootIds?.has(loot.id))return false;s.pickedGroundLootIds ||= new Set();s.pickedGroundLootIds.add(loot.id);const d=ensureState();if(loot.type==="gold"){d.gold+=Math.max(1,Math.round(loot.amount||1));s.texts.push({x:loot.x,y:loot.y-20,text:`+${Math.round(loot.amount||1)} Gold`,color:"#ffd45f",life:1.1});pushCombatLog(s,`${Math.round(loot.amount||1)} Gold aufgenommen`);}else if(loot.item){addItem({...loot.item,uid:uid(),acquiredAt:Date.now()},true);pushCombatLog(s,`${loot.item.name} aufgenommen`);}else if(loot.type==="material"&&MATERIALS[loot.material]){addMaterial(d,loot.material,loot.amount||1);s.texts.push({x:loot.x,y:loot.y-20,text:`+${loot.amount||1} ${MATERIALS[loot.material].name}`,color:"#83f3bf",life:1.1});pushCombatLog(s,`${MATERIALS[loot.material].name} aufgenommen`);}else if(loot.type==="pet"&&loot.pet){const pet=addCompanionCopy(d,loot.pet);s.texts.push({x:loot.x,y:loot.y-20,text:`${pet.name} gefunden`,color:RARITIES[pet.rarity].color,life:1.1});pushCombatLog(s,`${pet.name} · Begleiterkopie aufgenommen`);}safeSave();updateHead();return true;}
  function updateGroundLoot(s){for(const loot of s.groundLoot||[])if(!s.pickedGroundLootIds?.has(loot.id)&&Math.hypot(s.player.x-loot.x,s.player.y-loot.y)<=38)pickupGroundLoot(s,loot);}
  function drawGroundLoot(ctx,s,now){for(const loot of s.groundLoot||[]){if(s.pickedGroundLootIds?.has(loot.id))continue;const x=sx(s,loot.x),y=sy(s,loot.y),pulse=.8+.2*Math.sin(now*.008+loot.x);ctx.save();ctx.translate(x,y);ctx.shadowBlur=18;ctx.shadowColor=loot.type==="gold"?"#ffd45f":loot.type==="material"?"#83f3bf":loot.type==="pet"?(RARITIES[loot.pet?.rarity]?.color||"#ffb6ef"):(RARITIES[loot.item?.rarity]?.color||"#fff");ctx.fillStyle=ctx.shadowColor;ctx.globalAlpha=.4;ctx.beginPath();ctx.ellipse(0,8,18*pulse,7*pulse,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;if(loot.type==="gold"){ctx.fillStyle="#ffd45f";for(let i=0;i<4;i++){ctx.beginPath();ctx.arc((i-1.5)*6,-i%2*3,5,0,Math.PI*2);ctx.fill();}ctx.fillStyle="#5b3a12";ctx.font="900 10px system-ui";ctx.textAlign="center";ctx.fillText("GOLD",0,-14);}else{const color=loot.type==="material"?"#83f3bf":loot.type==="pet"?(RARITIES[loot.pet?.rarity]?.color||"#ffb6ef"):(RARITIES[loot.item?.rarity]?.color||"#fff");ctx.fillStyle="#101820";ctx.strokeStyle=color;ctx.lineWidth=3;ctx.rotate(Math.PI/4);ctx.fillRect(-11,-11,22,22);ctx.strokeRect(-11,-11,22,22);ctx.rotate(-Math.PI/4);ctx.fillStyle="#fff";ctx.font="900 13px system-ui";ctx.textAlign="center";ctx.fillText(loot.type==="material"?(MATERIALS[loot.material]?.icon||"◆"):loot.type==="pet"?(COMPANION_SPECIES[loot.pet?.species]?.icon||"🐾"):(SLOT_DEFS[loot.item?.slot]?.icon||"◆"),0,5);}ctx.restore();}}

  function damageEnemy(s, enemy, amount, source) { if (!s||!enemy||enemy.dead) return 0; const safeAmount=Math.max(1,finite(amount,finite(source?.damage,1))),armor=clamp(finite(enemy.armor,0),0,.9),raw=Math.max(1,Math.round(safeAmount*(1-armor))),maxHp=Math.max(1,finite(enemy.maxHp,finite(enemy.hp,1))),before=clamp(finite(enemy.hp,maxHp),0,maxHp),dealt=Math.max(0,Math.min(before,raw)); enemy.maxHp=maxHp;enemy.hp=Math.max(0,before-dealt); if(source&&dealt>0){stabilizeCombatActor(source,{damage:1});source.damageDone=Math.max(0,finite(source.damageDone,0))+dealt;} s.texts.push({ x:finite(enemy.x,0), y:finite(enemy.y,0)-Math.max(10,finite(enemy.radius,20)), text: `-${Math.round(dealt)}`, color: source?.role === "healer" ? "#ffe47a" : "#fff", life: .8 }); if (enemy.hp <= 0) killEnemy(s, enemy, source);if(s.online&&s.host)s.networkLastWorld=0; return dealt; }
  function killEnemy(s, enemy) { enemy.dead = true;spawnGroundLoot(s,enemy); if(s.selectedEnemyId===enemy.id){s.selectedEnemyId="";s.autoAttack=false;} ensureState().stats.kills++; pushCombatLog(s,`${enemy.name} besiegt${enemy.boss?" · Bossbeute!":""}`); if (enemy.boss) { ensureState().stats.bosses++; rewardBoss(s, enemy); } }
  function updateHunterPets(s,dt,combat){
    for(const owner of s.players){
      if(owner.classId!=="ranger")continue;refreshHunterPetRuntime(owner);const pet=owner.hunterPet;if(!pet)continue;stabilizeCombatActor(pet,{x:owner.x-36,y:owner.y+28,maxHp:100,damage:Math.max(1,finite(owner.damage,1)*.34),attackRate:.87,range:55});
      pet.attackCd=Math.max(0,finite(pet.attackCd,0)-dt);pet.attackAnim=Math.max(0,finite(pet.attackAnim,0)-dt);
      if(pet.dead||pet.hp<=0){pet.dead=true;pet.hp=0;pet.moving=false;continue;}
      const chosen=s.enemies.find(e=>e.id===(owner.local?s.selectedEnemyId:owner.targetEnemyId)&&!e.dead),target=chosen||null;
      const follow={x:owner.x-34*Math.cos(finite(owner.angle,0)),y:owner.y-34*Math.sin(finite(owner.angle,0))+24};let destination=follow;
      if(target&&lineWalkable(s,pet,target,5))destination=target;
      const dx=destination.x-pet.x,dy=destination.y-pet.y,dist=Math.hypot(dx,dy)||1,stop=target?45:26;
      pet.moving=false;if(dist>stop){pet.angle=Math.atan2(dy,dx);pet.moving=tryMoveEntity(s,pet,dx/dist*175*dt,dy/dist*175*dt);if(pet.moving)pet.walkPhase=finite(pet.walkPhase,0)+dt*14;}
      if(combat&&target&&!target.dead&&dist<=58&&pet.attackCd<=0&&lineWalkable(s,pet,target,5)){pet.attackCd=1.15;pet.attackAnim=.28;damageEnemy(s,target,Math.max(1,finite(pet.damage,1)),owner);}
      if(owner.dead&&!target){pet.x+=(owner.x-pet.x)*Math.min(1,dt*5);pet.y+=(owner.y-pet.y)*Math.min(1,dt*5);}
    }
  }
  function drawHunterPet(ctx,s,pet,owner,now){
    if(!pet)return;const x=sx(s,pet.x),y=sy(s,pet.y),phase=pet.moving?Math.sin(pet.walkPhase||now*.01)*3:0,color=pet.species==="hound"?"#9b6d45":pet.species==="beast"?"#72513e":"#65737f";
    ctx.save();ctx.translate(x,y);ctx.globalAlpha=pet.dead ? .45 : 1;ctx.fillStyle="#0009";ctx.beginPath();ctx.ellipse(0,9,23,8,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=10;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(-12,-4);ctx.lineTo(12,-4);ctx.stroke();ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-10,0);ctx.lineTo(-15+phase,14);ctx.moveTo(9,0);ctx.lineTo(14-phase,14);ctx.stroke();ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(10,-10);ctx.lineTo(25,-15);ctx.lineTo(22,3);ctx.lineTo(10,4);ctx.closePath();ctx.fill();ctx.fillStyle="#f4d36b";ctx.beginPath();ctx.arc(19,-9,1.8,0,Math.PI*2);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-14,-7);ctx.quadraticCurveTo(-28,-19,-30,-7);ctx.stroke();if(pet.attackAnim>0){ctx.strokeStyle="#fff";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(25,-7);ctx.lineTo(35,-3);ctx.stroke();}ctx.globalAlpha=1;ctx.fillStyle="#fff";ctx.font="800 9px system-ui";ctx.textAlign="center";ctx.fillText(`${pet.name} · L${pet.level}`,0,-30);const pct=clamp(finite(pet.hp,0)/Math.max(1,finite(pet.maxHp,1)),0,1);ctx.fillStyle="#25080d";ctx.fillRect(-24,-24,48,5);ctx.fillStyle=pet.dead?"#646b70":"#69e891";ctx.fillRect(-24,-24,48*pct,5);ctx.restore();
  }
  function updateOutOfCombatRegen(s,dt,now){const actors=[...s.players,...s.players.map(p=>p.supportPet).filter(Boolean),...s.players.map(p=>p.hunterPet).filter(Boolean)];for(const p of actors){if(!p||p.dead||p.hp>=p.maxHp)continue;if(now-Number(p.lastDamageAt||now)<OUT_OF_COMBAT_DELAY*1000)continue;p.regenAccumulator=(p.regenAccumulator||0)+dt;const amount=p.maxHp*OUT_OF_COMBAT_REGEN*dt;p.hp=Math.min(p.maxHp,p.hp+amount);if(p.regenAccumulator>=1){p.regenAccumulator=0;s.texts.push({x:p.x,y:p.y-38,text:`+${Math.max(1,Math.round(p.maxHp*OUT_OF_COMBAT_REGEN))}`,color:"#66f3a5",life:.8});}}}
  function updateSupportPets(s,dt,combat){
    for(const owner of s.players){
      const pet=owner.supportPet;if(!pet)continue;
      pet.uid ||= `pet:${owner.uid}:${pet.id}`;pet.ownerId=owner.uid;pet.isPet=true;pet.petType="support";
      stabilizeCombatActor(pet,{x:owner.x+42,y:owner.y+30,maxHp:100,damage:10,attackRate:1,range:pet.role==="healer"?165:58});
      if(pet.dead||pet.hp<=0){pet.dead=true;pet.hp=0;pet.moving=false;continue;}
      pet.level=owner.local?clamp(Math.floor(finite(ensureState()?.level,1)),1,MAX_LEVEL):clamp(Math.floor(finite(pet.level,1)),1,MAX_LEVEL);
      pet.attackCd=Math.max(0,finite(pet.attackCd,0)-dt);pet.attackAnim=Math.max(0,finite(pet.attackAnim,0)-dt);
      const selectedId=owner.local?s.selectedEnemyId:owner.targetEnemyId,target=s.enemies.find(e=>e.id===selectedId&&!e.dead),follow={x:owner.x+42*Math.cos(finite(owner.angle,0)+Math.PI/2),y:owner.y+42*Math.sin(finite(owner.angle,0)+Math.PI/2)+20};
      let usedHeal=false;
      if(pet.role==="healer"&&combat&&pet.attackCd<=0){
        const allies=combatAllies(s).filter(actor=>actor&&!actor.dead&&finite(actor.hp,0)<finite(actor.maxHp,1)*.86).sort((a,b)=>finite(a.hp,0)/Math.max(1,finite(a.maxHp,1))-finite(b.hp,0)/Math.max(1,finite(b.maxHp,1))),ally=allies[0];
        if(ally){pet.attackCd=3.8;pet.attackAnim=.24;healPlayer(s,ally,Math.max(1,finite(pet.healing,1)),owner);s.effects.push({type:"natureburst",x:ally.x,y:ally.y,radius:52,life:.8,color:"#72f3a5"});usedHeal=true;}
      }
      if(target&&combat&&lineWalkable(s,pet,target,5)){
        const dist=distance(pet,target),desired=pet.role==="healer"?145:50,angle=Math.atan2(target.y-pet.y,target.x-pet.x);pet.angle=angle;
        if(dist>desired){pet.moving=tryMoveEntity(s,pet,Math.cos(angle)*150*dt,Math.sin(angle)*150*dt);if(pet.moving)pet.walkPhase=finite(pet.walkPhase,0)+dt*13;}
        else if(pet.attackCd<=0&&!usedHeal){
          pet.attackCd=pet.role==="dps"?.85:pet.role==="tank"?1.35:1.65;pet.attackAnim=.28;
          if(pet.role==="healer")s.projectiles.push({x:pet.x,y:pet.y,vx:Math.cos(angle)*520,vy:Math.sin(angle)*520,radius:4,damage:Math.max(1,finite(pet.damage,1)),ownerUid:owner.uid,friendly:true,life:1.25,color:"#72f3a5"});
          else damageEnemy(s,target,Math.max(1,finite(pet.damage,1)),owner);
        }
      }else{
        const angle=Math.atan2(follow.y-pet.y,follow.x-pet.x),dist=Math.hypot(follow.x-pet.x,follow.y-pet.y);pet.moving=dist>18&&tryMoveEntity(s,pet,Math.cos(angle)*145*dt,Math.sin(angle)*145*dt);if(pet.moving){pet.angle=angle;pet.walkPhase=finite(pet.walkPhase,0)+dt*12;}
      }
    }
  }

  function updateEnemies(s, dt, now) {
    for (const e of s.enemies) {
      if (e.dead) continue;
      e.attackCd = Math.max(0, e.attackCd - dt); e.specialCd = Math.max(0, e.specialCd - dt); e.attackAnim=Math.max(0,(e.attackAnim||0)-dt);
      const target = chooseEnemyTarget(s, e);
      if (!target) { e.targetUid=""; e.moving=false; e.path=[]; e.pathTimer=0; continue; }
      e.targetUid = target.uid; e.alerted=true;
      const waypoint=nextEnemyWaypoint(s,e,target,dt), dx=waypoint.x-e.x,dy=waypoint.y-e.y,distToWaypoint=Math.hypot(dx,dy)||1,directDist=Math.hypot(target.x-e.x,target.y-e.y)||1;e.angle=Math.atan2(target.y-e.y,target.x-e.x);
      const desired=e.ranged?e.range*.78:e.range; e.moving=false;
      if(directDist>desired){const moved=tryMoveEntity(s,e,dx/distToWaypoint*e.speed*dt,dy/distToWaypoint*e.speed*dt);e.moving=moved;if(moved)e.walkPhase=(e.walkPhase||0)+dt*11;}
      const visible=canEnemySeePlayer(s,e,target);
      if (visible && directDist <= e.range && e.attackCd <= 0) { e.attackCd = e.boss ? 1.25 : e.ranged ? 1.55 : 1.05; e.attackAnim=.3; if (e.ranged) s.projectiles.push({ x: e.x, y: e.y, vx: (target.x-e.x)/directDist * 420, vy: (target.y-e.y)/directDist * 420, radius: e.boss ? 10 : 6, damage: e.damage, ownerUid: e.id, friendly: false, life: 2.3, color: e.color }); else damagePlayer(s, target, e.damage, e); }
      if (e.boss && visible && e.specialCd <= 0) { e.specialCd = rand(4.5, 7); bossSpecial(s, e, now); }
    }
  }
  function combatAllies(s,includeDead=false){const list=[...(s.players||[])];for(const owner of s.players||[]){if(owner?.hunterPet)list.push(owner.hunterPet);if(owner?.supportPet)list.push(owner.supportPet);}return list.filter(actor=>actor&&(includeDead||!actor.dead));}
  function chooseEnemyTarget(s, enemy) {
    const visible=combatAllies(s).filter(actor=>canEnemySeePlayer(s,enemy,actor));if(!visible.length)return null;
    const tankPets=visible.filter(actor=>actor.isPet&&actor.role==="tank");if(tankPets.length&&Math.random()<.78)return tankPets.sort((a,b)=>distance(enemy,a)-distance(enemy,b))[0];
    const nearby=visible.filter(actor=>distance(enemy,actor)<=enemySightRange(enemy)+28),pool=nearby.length?nearby:visible,tanks=pool.filter(actor=>!actor.isPet&&actor.role==="tank");
    if(tanks.length&&Math.random()<.84)return tanks.sort((a,b)=>distance(enemy,a)-distance(enemy,b))[0];
    return pool.sort((a,b)=>{const aggro=a.isPet?(a.role==="tank"?4:a.role==="healer"?.65:.8):(ROLES[a.role]?.aggro||1),bAggro=b.isPet?(b.role==="tank"?4:b.role==="healer"?.65:.8):(ROLES[b.role]?.aggro||1);return distance(enemy,a)/aggro-distance(enemy,b)/bAggro;})[0];
  }
  function damagePlayer(s, p, amount, source) {
    if (!s || !p || p.dead) return 0;
    stabilizeCombatActor(p,{maxHp:p.isPet?100:500,damage:1,healing:0,power:1});
    p.lastDamageAt=performance.now();p.regenAccumulator=0;
    const armor=clamp(finite(p.armor,0),0,.82),incoming=Math.max(0,finite(amount,finite(source?.damage,1)));
    let dealt=Math.max(1,Math.round(incoming*(1-armor)));
    if(Number(p.buffs?.fortress||0)>0)dealt=Math.max(1,Math.round(dealt*.62));
    const beforeHp=Math.max(0,Number(p.hp)||0),beforeShield=Math.max(0,Number(p.shield)||0);
    if(beforeShield>0){const absorbed=Math.min(beforeShield,dealt);p.shield=Math.max(0,beforeShield-absorbed);dealt-=absorbed;}
    if(dealt>0)p.hp=Math.max(0,beforeHp-dealt);
    p.healthSeq=(Number(p.healthSeq)||0)+1;p.hitSeq=(Number(p.hitSeq)||0)+1;
    p.lastHitAmount=Math.max(0,dealt);p.lastHitSource=String(source?.name||"Gegner");
    s.texts.push({x:p.x,y:p.y-35,text:dealt>0?`-${dealt}`:"BLOCK",color:dealt>0?"#ff647a":"#8deaff",life:.8});
    if(p.hp<=0){p.hp=0;p.dead=true;p.downedAt=Date.now();if(p.local&&!p.isPet)ensureState().stats.deaths++;showMessage(p.isPet?`${p.name} wurde besiegt`:`${p.name} ist gefallen`,2200);}
    // Schaden sofort in den nächsten Host-Weltsnapshot drücken.
    if(s.online&&s.host)s.networkLastWorld=0;
    return dealt;
  }
  function bossSpecial(s, boss) { const type = Math.floor(rand(0, 3)); if (type === 0) { s.bossTelegraph = { x: boss.x, y: boss.y, radius: boss.finalBoss ? 210 : 160, time: 1.25, damage: boss.damage * 1.7, type: "nova" }; showMessage(`${boss.name}: ZERSTÖRUNGSNOVA`, 1500); } else if (type === 1) { const t = chooseEnemyTarget(s, boss); if (t) s.bossTelegraph = { x: t.x, y: t.y, radius: 95, time: 1.1, damage: boss.damage * 2.1, type: "mark" }; } else { for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; s.projectiles.push({ x: boss.x, y: boss.y, vx: Math.cos(a) * 360, vy: Math.sin(a) * 360, radius: 9, damage: boss.damage * 1.25, ownerUid: boss.id, friendly: false, life: 3, color: boss.color }); } } }
  function updateProjectiles(s, dt) {
    for (const b of s.projectiles) {
      const enemyTarget=b.homingId&&s.enemies.find(e=>e.id===b.homingId&&!e.dead),healTarget=b.healTargetUid&&s.players.find(player=>player.uid===b.healTargetUid&&!player.dead),target=enemyTarget||healTarget;
      if(target){const angle=Math.atan2(target.y-b.y,target.x-b.x),speed=Math.hypot(b.vx||0,b.vy||0)||650;b.vx=Math.cos(angle)*speed;b.vy=Math.sin(angle)*speed;}
      b.x += b.vx * dt;b.y += b.vy * dt;b.life -= dt;
      if(b.healing&&healTarget&&distance(b,healTarget)<=b.radius+healTarget.radius+5){healPlayer(s,healTarget,b.healAmount||1,s.players.find(player=>player.uid===b.ownerUid)||null);b.life=0;continue;}
      if (b.life <= 0 || !isWalkable(s,b.x,b.y,Math.max(2,b.radius*.45))) { b.life=0; continue; }
      if (b.friendly&&!b.healing) { for (const e of s.enemies) { if (e.dead || distance(b, e) > b.radius + e.radius) continue; const owner=s.players.find(p => p.uid === b.ownerUid);damageEnemy(s, e, b.damage, owner);if(b.splashRadius)areaDamage(s,e.x,e.y,b.splashRadius,(b.splashPower||.5)*(owner?.damage||b.damage),owner);if(b.dotPower)s.zones.push({id:uid(),type:"damage",x:e.x,y:e.y,radius:80,life:5,maxLife:5,tick:0,ownerUid:b.ownerUid,amount:Math.max(1,(owner?.damage||b.damage)*b.dotPower),color:b.color});b.life = 0; break; } }
      else if(!b.friendly){ for (const actor of combatAllies(s)) { if (actor.dead || distance(b, actor) > b.radius + actor.radius) continue; damagePlayer(s, actor, b.damage, null); b.life = 0; break; } }
    }
    s.projectiles = s.projectiles.filter(b => b.life > 0 && b.x > -50 && b.y > -50 && b.x < WORLD_W + 50 && b.y < WORLD_H + 50);
  }
  function updateTraps(s, dt, now) { for (const t of s.traps) { t.pulse += dt; if (!t.armed) continue; for (const p of combatAllies(s)) { if (p.dead || distance(t, p) > t.radius + p.radius) continue; t.armed = false; damagePlayer(s, p, 22 + finite(ensureState()?.level,1) * 3.2, null); s.effects.push({ type: "trap", x: t.x, y: t.y, radius: t.radius, life: .7, color: "#ff5c67" });break; } } if (s.bossTelegraph) { s.bossTelegraph.time -= dt; if (s.bossTelegraph.time <= 0) { for (const p of combatAllies(s)) if (!p.dead && distance(p, s.bossTelegraph) <= s.bossTelegraph.radius + p.radius && lineWalkable(s,s.bossTelegraph,p,5)) damagePlayer(s, p, s.bossTelegraph.damage, s.boss); s.effects.push({ type: "blast", x: s.bossTelegraph.x, y: s.bossTelegraph.y, radius: s.bossTelegraph.radius, life: .75, color: "#ff4f66" }); s.bossTelegraph = null; } } }
  function updateEffects(s, dt) { for (const e of s.effects) e.life -= dt; for (const t of s.texts) { t.life -= dt; t.y -= 35 * dt; } s.effects = s.effects.filter(e => e.life > 0); s.texts = s.texts.filter(t => t.life > 0); for (const p of s.players) { p.attackAnim=Math.max(0,(p.attackAnim||0)-dt); p.castAnim=Math.max(0,(p.castAnim||0)-dt); if(p.castAnim<=0)p.skillAnim=0; for (const key of Object.keys(p.buffs)) p.buffs[key] = Math.max(0, p.buffs[key] - dt); } }
  function checkRoomClear(s, now) {
    if (s.players.every(p => p.dead)) return endDungeon(false, "Die Gruppe wurde besiegt.");
    if (s.enemies.some(e => !e.dead)) return;
    if (s.roomState === "combat") { s.clearAt = now; rewardRoom(s); showMessage(s.room === s.dungeon.rooms ? "END-BOSS BESIEGT · AUSGANG GEÖFFNET" : "RAUM GESÄUBERT · TOR GEÖFFNET", 2600); if(s.room===s.dungeon.rooms){s.roomState="completed";s.completed=true;s.exitOpen=true;UI.main?.querySelector("[data-dkl-exit]")?.removeAttribute("hidden");}else{s.roomState="door-open";s.roomExitOpen=true;} }
    if(s.roomState==="door-open"&&now>s.roomTransitionLock){const exit=s.layout?.exit||{x:WORLD_W/2,y:100};const entering=s.players.some(p=>!p.dead&&Math.hypot(p.x-exit.x,p.y-exit.y)<58);if(entering){s.roomTransitionLock=now+1500;buildRoom(s,s.room+1);}}
  }
  function rewardRoom(s) { const d = ensureState(), multiplayer = s.partySize === 1 ? .7 : 1 + (s.partySize - 2) * .18, xp = Math.round((80 + s.dungeon.level * 24 + s.room * 20) * multiplayer); addXp(xp); d.gold += Math.round((35 + s.dungeon.level * 10 + s.room * 8) * multiplayer); if (s.room % 2 === 0) awardIndividualLoot(s, false); safeSave(); }
  function rewardBoss(s) { awardIndividualLoot(s, true); if (s.boss?.finalBoss) awardIndividualLoot(s, true); }
  function awardIndividualLoot(s, boss) {
    const d = ensureState(), bonus = s.partySize === 1 ? -12 : (s.partySize - 1) * 10 + (boss ? 20 : 0), rarity = rarityForLevel(Math.max(d.level, s.dungeon.level + s.room), bonus), level = clamp(Math.max(d.level, s.dungeon.level) + Math.floor(rand(-2, boss ? 6 : 3)), 1, MAX_LEVEL); const item = createItem(level, rarity, pick(SLOT_KEYS), d.classId); addItem(item, true); s.lootSeq++;
  }
  function selectPlayerTarget(uid){const s=UI.session;if(!s)return;const target=s.players.find(p=>p.uid===uid);if(!target)return;s.selectedTargetUid=target.uid;s.selectedEnemyId="";s.autoAttack=false;s.noTargetFor=0;showMessage(`Ziel: ${target.name}`,900);pushCombatLog(s,`Verbündetes Ziel: ${target.name}`);updateDungeonHud();}
  function selectEnemyTarget(id){const s=UI.session;if(!s)return;const target=s.enemies.find(e=>e.id===id&&!e.dead);if(!target)return;s.selectedEnemyId=target.id;s.selectedTargetUid="";s.autoAttack=true;s.noTargetFor=0;s.networkLastWrite=0;showMessage(`Angriffsziel: ${target.name}`,900);pushCombatLog(s,`Angriffsziel gewählt: ${target.name}`);if(distance(s.player,target)<=s.player.range+12&&lineWalkable(s,s.player,target,8))autoAttackPlayer(s,s.player,target);updateDungeonHud();}
  function activePlayerTarget(s,p,allowDead=false){const uid=p.local?s.selectedTargetUid:p.targetUid;const target=s.players.find(x=>x.uid===uid);if(target&&(allowDead||!target.dead))return target;return null;}
  function activeEnemyTarget(s,p,max=760){const id=p.local?s.selectedEnemyId:p.targetEnemyId;const target=s.enemies.find(e=>e.id===id&&!e.dead);if(target&&distance(p,target)<=max&&lineWalkable(s,p,target,7))return target;return null;}
  function useSkill(index){useActionSlot(index);}
  function useRevive(){const s=UI.session,slot=s?.player?.actionBar?.indexOf("revive")??-1;if(slot>=0)useActionSlot(slot);else showMessage("Wiederbelebung ist nicht in der Aktionsleiste",1300);}
  function executeRevive(s,p){
    if(!s||p.role!=="healer")return false;
    const selected=activePlayerTarget(s,p,true),target=selected?.dead?selected:s.players.find(x=>x.dead);
    if(!target){if(p.local)showMessage("Wiederbelebung benötigt einen gefallenen Mitspieler",1900);return false;}
    target.dead=false;target.hp=Math.max(1,Math.round(target.maxHp*.45));target.downedAt=0;target.shield=Math.max(target.shield||0,Math.round(target.maxHp*.2));target.healthSeq=(Number(target.healthSeq)||0)+1;target.hitSeq=(Number(target.hitSeq)||0)+1;
    s.texts.push({x:target.x,y:target.y-42,text:"WIEDERBELEBT",color:"#9dffbd",life:1.25});s.effects.push({type:"skill",x:target.x,y:target.y,radius:120,life:1,color:"#9dffbd"});p.castAnim=.9;p.skillAnim=6;pushCombatLog(s,`${p.name} belebt ${target.name} wieder`);playSound("skill");return true;
  }
  function executeSkill(s, p, index, options={}) {
    const role=p.role,classId=p.classId,cooldowns=SKILL_BASE_COOLDOWNS,enemyTarget=activeEnemyTarget(s,p,760)||nearestEnemy(s,p,700);let effectTarget=enemyTarget||p,used=true,effectKind="";
    if(role==="healer"){
      const selectedAlive=activePlayerTarget(s,p,false),selectedEnemyRaw=s.enemies.find(e=>e.id===(p.local?s.selectedEnemyId:p.targetEnemyId)&&!e.dead),hostile=activeEnemyTarget(s,p,760);
      const enemyChosen=!!selectedEnemyRaw;
      if(index===0){
        // Lichtwelle heilt bei Feindziel oder fehlender Auswahl automatisch den Zaubernden.
        const ally=enemyChosen?p:(selectedAlive||p);healPlayer(s,ally,p.healing*2.2,p);effectTarget=ally;effectKind="lightwave";
      }else if(index===1){
        // Reinigung heilt bei Feindziel oder fehlender Auswahl automatisch den Zaubernden.
        const ally=enemyChosen?p:(selectedAlive||p);ally.buffs={...ally.buffs};for(const key of ["poison","slow","curse","burn"])delete ally.buffs[key];healPlayer(s,ally,p.healing*1.45,p);effectTarget=ally;effectKind="cleanse";
      }else if(index===2){
        // Sühne zeigt immer drei getrennte, lange Lichtprojektile.
        if(enemyChosen&&!hostile){if(p.local)showMessage("Gegner ist nicht sichtbar oder außer Reichweite",1700);return false;}
        if(hostile){const base=Math.atan2(hostile.y-p.y,hostile.x-p.x);for(let i=0;i<3;i++){const offset=(i-1)*13,a=base+(i-1)*.035;s.projectiles.push({x:p.x-Math.sin(base)*offset,y:p.y-14+Math.cos(base)*offset,vx:Math.cos(a)*650,vy:Math.sin(a)*650,radius:7,damage:p.damage*.82,ownerUid:p.uid,friendly:true,life:1.8,color:"#ffe47a",homingId:hostile.id,kind:"penance",trail:54});}effectTarget=hostile;}
        else{const ally=selectedAlive||p,base=Math.atan2(ally.y-p.y,ally.x-p.x)||-Math.PI/2;for(let i=0;i<3;i++){const offset=(i-1)*13,a=base+(i-1)*.035;s.projectiles.push({x:p.x-Math.sin(base)*offset,y:p.y-14+Math.cos(base)*offset,vx:Math.cos(a)*560,vy:Math.sin(a)*560,radius:7,ownerUid:p.uid,friendly:true,healing:true,healTargetUid:ally.uid,healAmount:p.healing*.58,life:1.8,color:"#a9ffd0",kind:"penance",trail:54});}effectTarget=ally;}
      }else if(index===3){
        // Heilkreis: ausgewählter Gegner erhält den Schadenskreis; Verbündeter/kein Ziel erhält den Heilkreis.
        if(enemyChosen&&!hostile){if(p.local)showMessage("Gegner ist nicht sichtbar oder außer Reichweite",1700);return false;}
        const anchor=hostile||selectedAlive||p,mode=hostile?"damage":"heal";s.zones.push({id:uid(),type:mode,x:anchor.x,y:anchor.y,radius:135,life:7,maxLife:7,tick:0,ownerUid:p.uid,amount:mode==="heal"?Math.max(1,p.healing*.32):Math.max(1,p.damage*.48),color:mode==="heal"?"#66f3a5":"#ffe47a"});effectTarget=anchor;
      }else{
        // Holy Shield: Feindziel oder kein Ziel = eigener Schild. Angeclickter Mitspieler = Schild auf den Mitspieler.
        const shieldTarget=enemyChosen?p:(selectedAlive||p),shieldValue=Math.round(shieldTarget.maxHp*(1+(p.shieldBonus||0)));shieldTarget.shield=Math.max(shieldTarget.shield||0,shieldValue);s.texts.push({x:shieldTarget.x,y:shieldTarget.y-48,text:`SHIELD ${shieldValue}`,color:"#a8eaff",life:1.2});effectTarget=shieldTarget;
      }
    }else if(role==="tank"){
      const target=activeEnemyTarget(s,p,700)||enemyTarget;
      if(index===0&&target){damageEnemy(s,target,p.damage*1.3,p);target.specialCd+=2;effectTarget=target;}else if(index===1)p.buffs.fortress=8;else if(index===2)areaDamage(s,p.x,p.y,155,p.damage*1.2,p);else if(index===3)s.players.forEach(x=>x.shield+=Math.round(p.maxHp*.18*(1+(p.shieldBonus||0))));else{p.buffs.fortress=11;areaDamage(s,p.x,p.y,220,p.damage*2.2,p);}
    }else{
      const target=activeEnemyTarget(s,p,760)||enemyTarget;
      if(index===0)classId==="ranger"?multiShot(s,p,3,target):areaDamage(s,p.x,p.y,145,p.damage*1.25,p);else if(index===1){p.buffs.haste=8;s.effects.push({type:"aura",x:p.x,y:p.y,radius:110,life:8,color:p.color});}else if(index===2&&target){damageEnemy(s,target,p.damage*2.4,p);effectTarget=target;}else if(index===3)areaDamage(s,target?.x||p.x,target?.y||p.y,190,p.damage*1.85,p);else areaDamage(s,target?.x||p.x,target?.y||p.y,285,p.damage*3.5,p);
    }
    if(used){if(p.local){const reduction=clamp((p.cooldownReduction||0)+p.haste*.12,0,.45),base=index===4&&role==="healer"?30:cooldowns[index],duration=index===4&&role==="healer"?30:base*(1-reduction);if(Number.isInteger(options.actionSlot)&&options.actionSlot>=0){s.actionCooldowns[options.actionSlot]=duration;s.actionCooldownTotals[options.actionSlot]=duration;}else{s.skillCooldowns[index]=duration;s.cooldownTotals[index]=duration;}}p.castAnim=.7;p.skillAnim=index+1;p.attackAnim=Math.max(p.attackAnim||0,.28);s.effects.push({type:effectKind||"skill",x:effectTarget.x||p.x,y:effectTarget.y||p.y,radius:90+index*25,life:.9,color:index===4&&role==="healer"?"#9fe9ff":p.color});playSound("skill");}
    return used;
  }
  function healPlayer(s,p,amount,source=null){if(!s||!p||p.dead)return 0;stabilizeCombatActor(p,{maxHp:100});const before=clamp(finite(p.hp,0),0,p.maxHp),value=Math.max(1,Math.round(Math.max(0,finite(amount,finite(source?.healing,1))))),after=Math.min(p.maxHp,before+value),actual=Math.max(0,after-before);p.hp=after;if(actual>0){if(source){stabilizeCombatActor(source,{healing:1});source.healingDone=Math.max(0,finite(source.healingDone,0))+actual;}p.healthSeq=Math.max(0,Math.floor(finite(p.healthSeq,0)))+1;s.texts.push({x:finite(p.x,0),y:finite(p.y,0)-35,text:`+${Math.round(actual)}`,color:"#64f3a4",life:.9});if(s.online&&s.host)s.networkLastWorld=0;}return actual;}
  function areaDamage(s,x,y,radius,damage,source){for(const e of s.enemies)if(!e.dead&&Math.hypot(e.x-x,e.y-y)<=radius+e.radius&&lineWalkable(s,{x,y},e,5))damageEnemy(s,e,damage,source);}
  function multiShot(s,p,count,chosen){const target=chosen||activeEnemyTarget(s,p,760)||nearestEnemy(s,p,700);if(!target||!lineWalkable(s,p,target,7))return;const base=Math.atan2(target.y-p.y,target.x-p.x);for(let i=0;i<count;i++){const a=base+(i-(count-1)/2)*.13;s.projectiles.push({x:p.x,y:p.y,vx:Math.cos(a)*680,vy:Math.sin(a)*680,radius:5,damage:p.damage*1.15,ownerUid:p.uid,friendly:true,life:1.5,color:p.color});}}
  function updateZones(s,dt){for(const z of s.zones||[]){z.life-=dt;z.tick-=dt;if(z.tick<=0){z.tick=.72;const owner=s.players.find(p=>p.uid===z.ownerUid)||s.player;if(z.type==="heal"){for(const p of s.players)if(!p.dead&&Math.hypot(p.x-z.x,p.y-z.y)<=z.radius+p.radius){const percent=p.maxHp*.025;healPlayer(s,p,percent+z.amount,owner);}}else{for(const e of s.enemies)if(!e.dead&&Math.hypot(e.x-z.x,e.y-z.y)<=z.radius+e.radius&&lineWalkable(s,z,e,4))damageEnemy(s,e,z.amount,owner);}}}s.zones=(s.zones||[]).filter(z=>z.life>0);}
  function showMessage(text, duration = 1800) { const s = UI.session; if (!s) return; s.message = text; s.messageUntil = performance.now() + duration; }

  function updateNetwork(s, now) {
    const p = s.online, fb = p.fb;
    if (now - s.networkLastWrite > 55) {
      s.networkLastWrite = now;
      safeSetDoc(fb, s.selfRef, {
        uid: String(s.player.uid || ""), name: String(s.player.name || "Spieler"),
        x: finite(s.player.x, WORLD_W / 2), y: finite(s.player.y, WORLD_H / 2), angle: finite(s.player.angle, 0),
        // Leben, K.O. und Schild sind im Online-Dungeon ausschließlich Host-autorisiert.
        // Der Gast sendet hier nur Eingaben/Positionen, damit alte lokale Werte den
        // vom Host berechneten Schaden niemals wieder überschreiben können.
        clientHealthSeen: Math.max(0, finite(s.player.hp, 0)), clientDeadSeen: !!s.player.dead,
        wantAttack: !!s.autoAttack, moving: !!s.player.moving, attackAnim: Math.max(0, finite(s.player.attackAnim, 0)), castAnim: Math.max(0, finite(s.player.castAnim, 0)), skillAnim: Math.max(0, Math.floor(finite(s.player.skillAnim, 0))), skillSeq: Math.max(0, Math.floor(finite(s.player.skillSeq, 0))), reviveSeq:Math.max(0,Math.floor(finite(s.player.reviveSeq,0))),
        skillRequested: Math.max(0, Math.floor(finite(s.player.skillRequested, 0))), actionSeq:Math.max(0,Math.floor(finite(s.player.actionSeq,0))), actionSlotRequested:Math.max(0,Math.floor(finite(s.player.actionSlotRequested,0))), targetUid: String(s.selectedTargetUid || ""), targetEnemyId: String(s.selectedEnemyId || ""), role: String(s.player.role || "dps"),
        classId: String(s.player.classId || "berserker"), power: Math.max(1, Math.round(finite(s.player.power, 1))), tradeGift:s.outgoingTradeGift?firestoreSafe(s.outgoingTradeGift):null, hunterPet:s.player.hunterPet?{id:String(s.player.hunterPet.id||""),species:String(s.player.hunterPet.species||"wolf"),name:String(s.player.hunterPet.name||"Begleiter"),level:Math.max(1,Math.floor(finite(s.player.hunterPet.level,1)))}:null,supportPet:s.player.supportPet?{id:String(s.player.supportPet.id||""),species:String(s.player.supportPet.species||"wolf"),name:String(s.player.supportPet.name||"Begleiter"),level:Math.max(1,Math.floor(finite(s.player.supportPet.level,1))),rarity:String(s.player.supportPet.rarity||"common"),role:String(s.player.supportPet.role||"dps")}:null,
        updatedAtMs: Date.now()
      }, { merge: true }, "Spielerstatus konnte nicht geschrieben werden");
      s.player.skillRequested = 0;
      s.player.reviveRequested = false;
      s.player.actionSlotRequested=0;
    }
    if (s.host && now - s.networkLastWorld > 55) {
      s.networkLastWorld = now;
      safeSetDoc(fb, s.worldRef, worldSnapshot(s), { merge: false }, "Weltstatus konnte nicht geschrieben werden");
    }
    if(s.host&&now-finite(s.networkLastPartyHeartbeat,0)>2000){s.networkLastPartyHeartbeat=now;safeSetDoc(fb,p.ref,{status:"playing",hostHeartbeatAtMs:Date.now(),updatedAtMs:Date.now()},{merge:true},"Host-Heartbeat konnte nicht geschrieben werden");}
    if(!s.host){const heartbeat=finite(p.data?.hostHeartbeatAtMs,finite(p.data?.updatedAtMs,Date.now()));if(p.data?.status==="playing"&&Date.now()-heartbeat>12000&&!s.partyClosed){s.partyClosed=true;closePartyLocally("Die Verbindung zum Host wurde beendet.");}}
  }
  function applyRemoteInput(id,data){
    const s=UI.session,p=s?.remotePlayers.get(id);if(!p||!data)return;
    stabilizeCombatActor(p,{maxHp:500,damage:50,attackRate:CLASSES[p.classId]?.attackRate||1,range:CLASSES[p.classId]?.range||100});
    const tx=finite(data.x,p.x),ty=finite(data.y,p.y);p.netX=tx;p.netY=ty;const dx=tx-p.x,dy=ty-p.y;tryMoveEntity(s,p,dx*.72,0);tryMoveEntity(s,p,0,dy*.72);p.moving=!!data.moving||Math.hypot(dx,dy)>.8;if(p.moving)p.walkPhase=finite(p.walkPhase,0)+.22;p.angle=finite(data.angle,p.angle);p.wantAttack=!!data.wantAttack;p.targetUid=String(data.targetUid||"");p.targetEnemyId=String(data.targetEnemyId||"");p.attackAnim=Math.max(finite(p.attackAnim,0),finite(data.attackAnim,0));p.castAnim=Math.max(finite(p.castAnim,0),finite(data.castAnim,0));p.skillAnim=Math.max(0,Math.floor(finite(data.skillAnim,p.skillAnim||0)));
    /* HP, Schild, K.O. und Pet-Positionen kommen ausschließlich aus dem Host-Weltsnapshot. */
    if(data.hunterPet){if(!p.hunterPet||p.hunterPet.id!==String(data.hunterPet.id||""))p.hunterPet=makeHunterPetRuntime(data.hunterPet,{x:p.x,y:p.y,ownerId:p.uid,ownerLevel:data.hunterPet.level});if(p.hunterPet){p.hunterPet.level=clamp(Math.floor(finite(data.hunterPet.level,p.hunterPet.level)),1,MAX_LEVEL);p.hunterPet.species=String(data.hunterPet.species||p.hunterPet.species);p.hunterPet.name=String(data.hunterPet.name||p.hunterPet.name);}}
    if(data.supportPet){if(!p.supportPet||p.supportPet.id!==String(data.supportPet.id||""))p.supportPet=makeSupportPetRuntime(data.supportPet,{x:p.x,y:p.y,ownerId:p.uid,ownerLevel:data.supportPet.level,ownerPower:p.power});if(p.supportPet){p.supportPet.uid=`pet:${p.uid}:${p.supportPet.id}`;p.supportPet.ownerId=p.uid;p.supportPet.isPet=true;p.supportPet.petType="support";}}
    if(data.tradeGift&&data.tradeGift.id!==p.lastTradeGiftId){p.lastTradeGiftId=data.tradeGift.id;s.tradeGifts ||= [];s.tradeGifts.push(data.tradeGift);applyTradeGift(s,data.tradeGift);}
    const actionSeq=Math.max(0,Math.floor(finite(data.actionSeq,0))),skillSeq=Math.max(0,Math.floor(finite(data.skillSeq,0))),reviveSeq=Math.max(0,Math.floor(finite(data.reviveSeq,0)));
    if(actionSeq>finite(p.lastActionSeq,0)){p.lastActionSeq=actionSeq;p.actionSlotRequested=clamp(Math.floor(finite(data.actionSlotRequested,0)),0,6);}
    if(skillSeq>finite(p.lastSkillSeq,0)){p.lastSkillSeq=skillSeq;p.skillRequested=clamp(Math.floor(finite(data.skillRequested,0)),0,5);}
    if(reviveSeq>finite(p.lastReviveSeq,0)){p.lastReviveSeq=reviveSeq;p.reviveRequested=true;}
  }

  function worldSnapshot(s) {
    return firestoreSafe({
      runId:String(s.runId||`${s.seed||0}:${s.hostUid||"host"}`),
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
        maxHp: Math.max(1, Math.round(finite(player.maxHp, 1))), dead: !!player.dead, shield:Math.max(0,Math.round(finite(player.shield,0))),
        healthSeq:Math.max(0,Math.floor(finite(player.healthSeq,0))),hitSeq:Math.max(0,Math.floor(finite(player.hitSeq,0))),lastHitAmount:Math.max(0,Math.round(finite(player.lastHitAmount,0))),lastHitSource:String(player.lastHitSource||""),
        angle: finite(player.angle, 0), moving: !!player.moving, attackAnim: Math.max(0, finite(player.attackAnim, 0)), castAnim: Math.max(0, finite(player.castAnim, 0)), skillAnim: Math.max(0, Math.floor(finite(player.skillAnim, 0))), role: String(player.role || "dps"),
        classId: String(player.classId || "berserker"), name: String(player.name || "Spieler"),
        power: Math.max(1, Math.round(finite(player.power, 1))), damageDone:Math.max(0,Math.round(finite(player.damageDone,0))), healingDone:Math.max(0,Math.round(finite(player.healingDone,0))), supportPet:player.supportPet?{...firestoreSafe(player.supportPet),hp:Math.max(0,finite(player.supportPet.hp,0)),maxHp:Math.max(1,finite(player.supportPet.maxHp,1)),dead:!!player.supportPet.dead,shield:Math.max(0,finite(player.supportPet.shield,0))}:null,hunterPet:player.hunterPet?{id:String(player.hunterPet.id||""),species:String(player.hunterPet.species||"wolf"),name:String(player.hunterPet.name||"Begleiter"),role:String(player.hunterPet.role||"dps"),level:Math.max(1,Math.floor(finite(player.hunterPet.level,1))),x:finite(player.hunterPet.x,player.x),y:finite(player.hunterPet.y,player.y),hp:Math.max(0,finite(player.hunterPet.hp,0)),maxHp:Math.max(1,finite(player.hunterPet.maxHp,1)),dead:!!player.hunterPet.dead,shield:Math.max(0,finite(player.hunterPet.shield,0)),damage:Math.max(1,finite(player.hunterPet.damage,1)),angle:finite(player.hunterPet.angle,0),moving:!!player.hunterPet.moving,attackAnim:Math.max(0,finite(player.hunterPet.attackAnim,0))}:null
      })),
      zones: (s.zones||[]).slice(-8).map(z=>({id:String(z.id||uid()),type:String(z.type||"heal"),x:finite(z.x,0),y:finite(z.y,0),radius:finite(z.radius,120),life:finite(z.life,0),maxLife:finite(z.maxLife,7),color:String(z.color||"#66f3a5")})),
      projectiles: s.projectiles.slice(-80).filter(Boolean).map(projectile => ({
        x: Math.round(finite(projectile.x, 0)), y: Math.round(finite(projectile.y, 0)),
        vx: finite(projectile.vx, 0), vy: finite(projectile.vy, 0),
        radius: Math.max(1, finite(projectile.radius, 4)), friendly: !!projectile.friendly,
        color: String(projectile.color || "#ffffff")
      })),
      tradeGifts:[...(s.tradeGifts||[]).slice(-20),...(s.outgoingTradeGift?[s.outgoingTradeGift]:[])].map(g=>firestoreSafe(g)),
      groundLoot:(s.groundLoot||[]).slice(-30).map(loot=>({id:String(loot.id||uid()),x:finite(loot.x,0),y:finite(loot.y,0),type:String(loot.type||"gold"),amount:Math.max(0,Math.round(finite(loot.amount,0))),material:loot.material?String(loot.material):"",pet:loot.pet?firestoreSafe(loot.pet):null,item:loot.item?firestoreSafe(loot.item):null})),
      lootSeq: Math.max(0, Math.floor(finite(s.lootSeq, 0))),
      updatedAtMs: Date.now(), version: VERSION
    });
  }
  function applyWorldSnapshot(data){
    const s=UI.session;if(!s||!data)return;
    const incomingRun=String(data.runId||"");if(incomingRun&&incomingRun!==String(s.lastWorldRunId||"")){s.lastWorldRunId=incomingRun;s.lastWorldSeq=0;}
    const seq=Math.max(0,Math.floor(finite(data.seq,0)));if(seq<=finite(s.lastWorldSeq,0))return;s.lastWorldSeq=seq;
    const incomingRoom=Math.max(1,Math.floor(finite(data.room,1)));
    if(incomingRoom!==s.room){s.room=incomingRoom;s.roomState=String(data.roomState||"combat");s.layout=createRoomLayout(s,s.room);s.chests=createRoomChests(s,s.room);s.pickedGroundLootIds=new Set();s.roomBannerUntil=performance.now()+2600;s.roomExitOpen=s.roomState==="door-open";s.player.x=s.layout.entry.x;s.player.y=s.layout.entry.y;s.player.path=[];}else{s.roomState=String(data.roomState||s.roomState);s.roomExitOpen=s.roomState==="door-open";}
    s.completed=!!data.completed;s.exitOpen=!!data.exitOpen;
    const previous=new Map((s.enemies||[]).map(e=>[e.id,e]));
    s.enemies=(Array.isArray(data.enemies)?data.enemies:[]).map(raw=>{const e=previous.get(raw.id)||{id:String(raw.id||uid()),walkPhase:0};e.name=String(raw.name||"Kreatur");e.netX=finite(raw.x,finite(e.x,0));e.netY=finite(raw.y,finite(e.y,0));if(!Number.isFinite(Number(e.x)))e.x=e.netX;if(!Number.isFinite(Number(e.y)))e.y=e.netY;e.maxHp=Math.max(1,finite(raw.maxHp,finite(e.maxHp,1)));e.hp=clamp(finite(raw.hp,e.maxHp),0,e.maxHp);e.radius=Math.max(1,finite(raw.radius,20));e.boss=!!raw.boss;e.elite=!!raw.elite;e.finalBoss=!!raw.finalBoss;e.color=String(raw.color||"#fff");e.angle=finite(raw.angle,0);e.moving=!!raw.moving;e.attackAnim=Math.max(finite(e.attackAnim,0),finite(raw.attackAnim,0));e.dead=false;return e;});
    s.projectiles=(Array.isArray(data.projectiles)?data.projectiles:[]).map(b=>({...b,x:finite(b.x,0),y:finite(b.y,0),vx:finite(b.vx,0),vy:finite(b.vy,0),radius:Math.max(1,finite(b.radius,4)),life:.42}));
    s.zones=(Array.isArray(data.zones)?data.zones:[]).map(z=>({...z,x:finite(z.x,0),y:finite(z.y,0),radius:Math.max(1,finite(z.radius,120)),life:Math.max(0,finite(z.life,0))}));
    s.groundLoot=(Array.isArray(data.groundLoot)?data.groundLoot:[]).map(loot=>({...loot,x:finite(loot.x,0),y:finite(loot.y,0)}));
    for(const gift of data.tradeGifts||[])applyTradeGift(s,gift);
    for(const raw of data.players||[]){
      const p=raw.uid===s.player.uid?s.player:s.remotePlayers.get(raw.uid);if(!p)continue;stabilizeCombatActor(p,{maxHp:raw.maxHp,damage:50,attackRate:CLASSES[p.classId]?.attackRate||1,range:CLASSES[p.classId]?.range||100});
      const previousHp=p.hp,incomingHp=clamp(finite(raw.hp,p.hp),0,Math.max(1,finite(raw.maxHp,p.maxHp))),incomingSeq=Math.max(0,Math.floor(finite(raw.healthSeq,0))),incomingHitSeq=Math.max(0,Math.floor(finite(raw.hitSeq,0)));
      p.maxHp=Math.max(1,finite(raw.maxHp,p.maxHp));p.hp=incomingHp;p.dead=!!raw.dead;p.shield=Math.max(0,finite(raw.shield,0));p.damageDone=Math.max(0,finite(raw.damageDone,0));p.healingDone=Math.max(0,finite(raw.healingDone,0));p.healthSeq=incomingSeq;
      if(incomingHitSeq>finite(p.lastAppliedHitSeq,0)){p.lastAppliedHitSeq=incomingHitSeq;const hit=Math.max(0,finite(raw.lastHitAmount,Math.max(0,previousHp-incomingHp)));if(hit>0&&p.local)s.texts.push({x:p.x,y:p.y-42,text:`-${Math.round(hit)}`,color:"#ff647a",life:.85});}
      p.lastAppliedHealthSeq=Math.max(finite(p.lastAppliedHealthSeq,-1),incomingSeq);
      if(!p.local){p.netX=finite(raw.x,p.x);p.netY=finite(raw.y,p.y);p.angle=finite(raw.angle,p.angle);p.moving=!!raw.moving;p.attackAnim=Math.max(finite(p.attackAnim,0),finite(raw.attackAnim,0));p.castAnim=Math.max(finite(p.castAnim,0),finite(raw.castAnim,0));p.skillAnim=Math.max(0,Math.floor(finite(raw.skillAnim,p.skillAnim||0)));}
      if(raw.hunterPet){if(!p.hunterPet||p.hunterPet.id!==String(raw.hunterPet.id||""))p.hunterPet=makeHunterPetRuntime(raw.hunterPet,{x:finite(raw.hunterPet.x,p.x),y:finite(raw.hunterPet.y,p.y),ownerId:p.uid,ownerLevel:raw.hunterPet.level});const pet=p.hunterPet;pet.netX=finite(raw.hunterPet.x,pet.x);pet.netY=finite(raw.hunterPet.y,pet.y);pet.x+=(pet.netX-pet.x)*.45;pet.y+=(pet.netY-pet.y)*.45;pet.maxHp=Math.max(1,finite(raw.hunterPet.maxHp,pet.maxHp));pet.hp=clamp(finite(raw.hunterPet.hp,pet.hp),0,pet.maxHp);pet.dead=!!raw.hunterPet.dead;pet.shield=Math.max(0,finite(raw.hunterPet.shield,0));pet.damage=Math.max(1,finite(raw.hunterPet.damage,pet.damage));pet.angle=finite(raw.hunterPet.angle,0);pet.moving=!!raw.hunterPet.moving;pet.attackAnim=Math.max(finite(pet.attackAnim,0),finite(raw.hunterPet.attackAnim,0));}
      if(raw.supportPet){if(!p.supportPet||p.supportPet.id!==String(raw.supportPet.id||""))p.supportPet=makeSupportPetRuntime(raw.supportPet,{x:finite(raw.supportPet.x,p.x),y:finite(raw.supportPet.y,p.y),ownerId:p.uid,ownerLevel:raw.supportPet.level,ownerPower:p.power});const pet=p.supportPet;if(pet){pet.uid=`pet:${p.uid}:${pet.id}`;pet.ownerId=p.uid;pet.isPet=true;pet.petType="support";pet.netX=finite(raw.supportPet.x,pet.x);pet.netY=finite(raw.supportPet.y,pet.y);pet.x+=(pet.netX-pet.x)*.45;pet.y+=(pet.netY-pet.y)*.45;pet.maxHp=Math.max(1,finite(raw.supportPet.maxHp,pet.maxHp));pet.hp=clamp(finite(raw.supportPet.hp,pet.hp),0,pet.maxHp);pet.dead=!!raw.supportPet.dead;pet.shield=Math.max(0,finite(raw.supportPet.shield,0));pet.angle=finite(raw.supportPet.angle,0);pet.moving=!!raw.supportPet.moving;pet.attackAnim=Math.max(finite(pet.attackAnim,0),finite(raw.supportPet.attackAnim,0));}}
    }
    if(finite(data.lootSeq,0)>finite(s.lastLootSeq,0)){const count=Math.min(10,Math.floor(finite(data.lootSeq,0)-finite(s.lastLootSeq,0)));s.lastLootSeq=Math.floor(finite(data.lootSeq,0));for(let i=0;i<count;i++)awardGuestLoot(s);}
    if(s.exitOpen)UI.main?.querySelector("[data-dkl-exit]")?.removeAttribute("hidden");
  }

  function awardGuestLoot(s) { const d = ensureState(), rarity = rarityForLevel(Math.max(d.level, s.dungeon.level + s.room), (s.partySize - 1) * 10 + 10); addItem(createItem(Math.max(d.level, s.dungeon.level), rarity, pick(SLOT_KEYS), d.classId), true); }
  function updateGuestVisuals(s, dt) { for(const p of s.players){if(p.local)continue;const ox=p.x,oy=p.y;p.x+=(Number(p.netX??p.x)-p.x)*Math.min(1,dt*13);p.y+=(Number(p.netY??p.y)-p.y)*Math.min(1,dt*13);if(p.moving||Math.hypot(p.x-ox,p.y-oy)>.15)p.walkPhase=(p.walkPhase||0)+dt*15;}for(const e of s.enemies){const ox=e.x,oy=e.y;e.x+=(Number(e.netX??e.x)-e.x)*Math.min(1,dt*12);e.y+=(Number(e.netY??e.y)-e.y)*Math.min(1,dt*12);if(e.moving||Math.hypot(e.x-ox,e.y-oy)>.15)e.walkPhase=(e.walkPhase||0)+dt*11;e.attackAnim=Math.max(0,(e.attackAnim||0)-dt);} for (const b of s.projectiles) { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; } s.projectiles = s.projectiles.filter(b => b.life > 0); }

  function drawActorFallback(ctx,s,actor,kind){
    const x=sx(s,actor.x),y=sy(s,actor.y);ctx.save();ctx.translate(x,y);ctx.fillStyle="#000a";ctx.beginPath();ctx.ellipse(0,10,24,9,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=kind==="player"?(ROLES[actor.role]?.color||"#66f3c0"):(actor.color||"#ff6b75");ctx.strokeStyle="#fff";ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-13,18,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle="#fff";ctx.font="900 11px system-ui";ctx.textAlign="center";ctx.fillText(actor.name||kind,0,-42);ctx.restore();
  }
  function safeDrawActor(ctx,s,actor,kind,now){
    ctx.save();try{if(kind==="enemy")drawEnemy(ctx,s,actor,now);else drawPlayer(ctx,s,actor,now);}catch(error){reportRuntimeError(s,`${kind}-Figur`,error);ctx.restore();drawActorFallback(ctx,s,actor,kind);return;}ctx.restore();
  }
  function drawEmergencyScene(s,now){
    const ctx=s.ctx;if(!ctx)return;ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.clearRect(0,0,CANVAS_W,CANVAS_H);try{drawDungeonGround(ctx,s,now);}catch{ctx.fillStyle="#080d10";ctx.fillRect(0,0,CANVAS_W,CANVAS_H);}for(const e of s.enemies||[])if(!e.dead)drawActorFallback(ctx,s,e,"enemy");for(const p of s.players||[])drawActorFallback(ctx,s,p,"player");
  }
  function drawTraps(ctx,s,now){
    for(const trap of s.traps||[]){
      const x=sx(s,trap.x),y=sy(s,trap.y),radius=Math.max(18,Number(trap.radius)||32);
      if(x<-radius*2||y<-radius*2||x>CANVAS_W+radius*2||y>CANVAS_H+radius*2)continue;
      const pulse=.55+.45*Math.sin((Number(trap.pulse)||0)+now*.006);
      ctx.save();ctx.translate(x,y);ctx.globalAlpha=trap.armed===false?.28:.7+pulse*.2;
      ctx.fillStyle=trap.armed===false?"#34242a55":"#ff435522";
      ctx.strokeStyle=trap.armed===false?"#74626a":"#ff6575";
      ctx.shadowColor=trap.armed===false?"transparent":"#ff4355";
      ctx.shadowBlur=trap.armed===false?0:10+pulse*10;
      ctx.lineWidth=2.5;
      ctx.beginPath();ctx.arc(0,0,radius*(.82+pulse*.06),0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.rotate(now*.00055+(trap.x+trap.y)*.001);
      ctx.beginPath();
      for(let i=0;i<8;i++){
        const a=i*Math.PI/4,inner=radius*.28,outer=radius*.7;
        ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);
        ctx.lineTo(Math.cos(a)*outer,Math.sin(a)*outer);
      }
      ctx.stroke();
      ctx.rotate(-now*.0011);
      ctx.beginPath();
      for(let i=0;i<4;i++){
        const a=i*Math.PI/2+Math.PI/4;
        ctx.moveTo(Math.cos(a)*radius*.18,Math.sin(a)*radius*.18);
        ctx.lineTo(Math.cos(a)*radius*.5,Math.sin(a)*radius*.5);
      }
      ctx.stroke();
      ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();
    }
  }

  function safeDrawLayer(s,label,draw){
    try{draw();return true;}catch(error){reportRuntimeError(s,label,error);return false;}
  }
  function drawSession(s, now) {
    const ctx = s.ctx; if (!ctx) return;
    ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    safeDrawLayer(s,"Dungeon-Boden",()=>drawDungeonGround(ctx,s,now));
    safeDrawLayer(s,"Hintergrund-Objekte",()=>drawDungeonProps(ctx,s,now,"back"));
    safeDrawLayer(s,"Fallen",()=>drawTraps(ctx,s,now));
    safeDrawLayer(s,"Kisten",()=>drawChests(ctx,s));safeDrawLayer(s,"Bodenbeute",()=>drawGroundLoot(ctx,s,now));
    safeDrawLayer(s,"Dungeon-Tor",()=>drawDungeonDoor(ctx,s,now));
    if(s.bossTelegraph)safeDrawLayer(s,"Boss-Markierung",()=>drawTelegraph(ctx,s,s.bossTelegraph));
    for(const z of s.zones||[])safeDrawLayer(s,"Zauberzone",()=>drawZone(ctx,s,z,now));
    for(const e of s.effects||[])safeDrawLayer(s,"Kampfeffekt",()=>drawEffect(ctx,s,e));
    for(const b of s.projectiles||[])safeDrawLayer(s,"Projektil",()=>drawProjectile(ctx,s,b,now));
    const actors=[...s.enemies.filter(e=>!e.dead).map(e=>({y:e.y,kind:"enemy",value:e})),...s.players.filter(Boolean).map(p=>({y:p.y,kind:"player",value:p})),...s.players.filter(p=>p?.hunterPet).map(p=>({y:p.hunterPet.y,kind:"pet",value:p.hunterPet,owner:p})),...s.players.filter(p=>p?.supportPet).map(p=>({y:p.supportPet.y,kind:"pet",value:p.supportPet,owner:p}))].sort((a,b)=>a.y-b.y);
    for(const actor of actors){if(actor.kind==="pet")safeDrawLayer(s,"Jäger-Begleiter",()=>drawHunterPet(ctx,s,actor.value,actor.owner,now));else safeDrawActor(ctx,s,actor.value,actor.kind,now);}
    safeDrawLayer(s,"Vordergrund-Objekte",()=>drawDungeonProps(ctx,s,now,"front"));
    for(const entry of s.texts||[])safeDrawLayer(s,"Kampftext",()=>drawText(ctx,s,entry));
    if(s.messageUntil>now)safeDrawLayer(s,"Raum-Nachricht",()=>drawCenterMessage(ctx,s.message));
    if(s.exitOpen)safeDrawLayer(s,"Ausgangsportal",()=>drawPortal(ctx,s,now));
    safeDrawLayer(s,"Minimap",()=>drawMiniMap(s));
  }
  function sx(s, x) { return x - s.camera.x + CANVAS_W / 2; } function sy(s, y) { return y - s.camera.y + CANVAS_H / 2; }
  function floorTileVisible(s,x,y,size){const px=sx(s,x),py=sy(s,y);return px>-size&&py>-size&&px<CANVAS_W+size&&py<CANVAS_H+size;}
  function drawDungeonGround(ctx,s,now){const l=s.layout||createRoomLayout(s,s.room),p=l.palette,t=l.tile;ctx.fillStyle=p.void;ctx.fillRect(0,0,CANVAS_W,CANVAS_H);ctx.save();ctx.translate(sx(s,0),sy(s,0));
    // Raised floors cast a real edge shadow.
    for(const z of l.raised||[]){ctx.fillStyle="#0009";ctx.fillRect(z.x+12,z.y+14,z.w,z.h);}
    const cols=Math.ceil(WORLD_W/t),rows=Math.ceil(WORLD_H/t);for(let gy=0;gy<rows;gy++)for(let gx=0;gx<cols;gx++){const wx=gx*t,wy=gy*t,cx=wx+t/2,cy=wy+t/2;if(!floorTileVisible(s,wx,wy,t))continue;const floor=isPointInWalkableRaw(l.walkable,l.blocked,cx,cy,2);if(floor){const raised=l.raised?.some(z=>containsRect(z,cx,cy,0));const v=(hashSeed(`${l.seed}:${gx}:${gy}`)%4);ctx.fillStyle=v%2?p.floor:p.floor2;ctx.fillRect(wx,wy,t,t);ctx.strokeStyle=p.line+"55";ctx.lineWidth=1;ctx.strokeRect(wx+.5,wy+.5,t-1,t-1);ctx.fillStyle=raised?p.accent+"12":"#ffffff08";ctx.fillRect(wx+5,wy+5,t-10,4);if(v===0){ctx.strokeStyle="#10151a55";ctx.beginPath();ctx.moveTo(wx+9,wy+31);ctx.lineTo(wx+21,wy+25);ctx.lineTo(wx+32,wy+35);ctx.stroke();}}
      else{const adjacent=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>isPointInWalkableRaw(l.walkable,l.blocked,cx+dx*t,cy+dy*t,2));if(adjacent){ctx.fillStyle=p.wall;ctx.fillRect(wx,wy,t,t);ctx.fillStyle=p.wallTop;ctx.fillRect(wx,wy,t,13);ctx.strokeStyle=p.edge;ctx.lineWidth=3;ctx.strokeRect(wx+1.5,wy+1.5,t-3,t-3);ctx.strokeStyle=p.line+"66";ctx.beginPath();ctx.moveTo(wx+8,wy+26);ctx.lineTo(wx+t-8,wy+26);ctx.stroke();}}
    }
    if(l.roomType==="ritual"||l.roomType==="boss"||l.roomType==="finale"){ctx.save();ctx.translate(l.bossPoint.x,l.bossPoint.y+75);ctx.globalAlpha=.22;ctx.strokeStyle=p.accent;ctx.lineWidth=7;ctx.shadowColor=p.accent;ctx.shadowBlur=18;ctx.beginPath();ctx.arc(0,0,l.roomType==="finale"?95:68,0,Math.PI*2);ctx.moveTo(-45,-45);ctx.lineTo(45,45);ctx.moveTo(45,-45);ctx.lineTo(-45,45);ctx.stroke();ctx.restore();}
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
      else if(p.type==="altar"){ctx.fillStyle="#28232f";ctx.fillRect(-42,-25,84,25);ctx.fillStyle=s.layout.palette.wallTop;ctx.fillRect(-34,-42,68,18);ctx.shadowColor=s.layout.palette.accent;ctx.shadowBlur=18;ctx.fillStyle=s.layout.palette.accent;ctx.beginPath();ctx.arc(0,-50,9,0,Math.PI*2);ctx.fill();}
      else if(p.type==="rune"){ctx.strokeStyle=s.layout.palette.accent;ctx.shadowColor=s.layout.palette.accent;ctx.shadowBlur=14;ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,32,0,Math.PI*2);ctx.moveTo(-22,-22);ctx.lineTo(22,22);ctx.moveTo(22,-22);ctx.lineTo(-22,22);ctx.stroke();}
      else if(p.type==="banner"){ctx.fillStyle="#261b34";ctx.fillRect(-16,-58,32,58);ctx.fillStyle=s.layout.palette.accent;ctx.beginPath();ctx.moveTo(-16,0);ctx.lineTo(0,15);ctx.lineTo(16,0);ctx.fill();ctx.fillStyle="#ffffffaa";ctx.fillRect(-4,-43,8,24);}
      else if(p.type==="goldpile"){ctx.fillStyle="#ffd05a";for(let i=0;i<12;i++){ctx.beginPath();ctx.arc((i%4)*10-15,-Math.floor(i/4)*7,6,0,Math.PI*2);ctx.fill();}}
      else if(p.type==="weaponrack"){ctx.fillStyle="#5c3a28";ctx.fillRect(-28,-42,56,42);ctx.strokeStyle="#d8e4ea";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-18,-36);ctx.lineTo(16,-5);ctx.moveTo(18,-36);ctx.lineTo(-16,-5);ctx.stroke();}
      else if(p.type==="statue"){ctx.fillStyle=s.layout.palette.wallTop;ctx.beginPath();ctx.arc(0,-52,13,0,Math.PI*2);ctx.fill();ctx.fillRect(-17,-40,34,38);ctx.fillRect(-28,-5,56,8);ctx.fillStyle=s.layout.palette.wall;ctx.fillRect(-22,3,44,12);}
      ctx.restore();}}
  function drawDungeonDoor(ctx,s,now){if(!s.layout)return;const e=s.layout.exit,x=sx(s,e.x),y=sy(s,e.y),open=s.roomExitOpen||s.completed;ctx.save();ctx.translate(x,y);ctx.fillStyle="#15131a";ctx.strokeStyle=s.layout.palette.wallTop;ctx.lineWidth=6;ctx.beginPath();ctx.roundRect(-42,-48,84,72,20);ctx.fill();ctx.stroke();if(open){ctx.shadowColor=s.layout.palette.accent;ctx.shadowBlur=22;ctx.fillStyle=s.layout.palette.accent+"66";ctx.fillRect(-29,-36,58,53);ctx.fillStyle="#f4ffff";ctx.font="900 10px system-ui";ctx.textAlign="center";ctx.fillText(s.completed?"AUSGANG":"NÄCHSTER RAUM",0,40);}else{ctx.fillStyle="#754b2f";ctx.fillRect(-29,-36,58,53);ctx.strokeStyle="#c18b57";ctx.lineWidth=3;for(let i=-20;i<=20;i+=10){ctx.beginPath();ctx.moveTo(i,-34);ctx.lineTo(i,15);ctx.stroke();}}ctx.restore();}
  function drawMiniMap(s){const c=s.minimap;if(!c||!s.layout)return;const ctx=c.getContext("2d"),scale=Math.min(c.width/WORLD_W,c.height/WORLD_H);ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle="#020509dd";ctx.fillRect(0,0,c.width,c.height);ctx.save();ctx.scale(scale,scale);ctx.fillStyle=s.layout.palette.floor;for(const z of s.layout.walkable)ctx.fillRect(z.x,z.y,z.w,z.h);ctx.fillStyle=s.layout.palette.void;for(const z of s.layout.blocked)ctx.fillRect(z.x,z.y,z.w,z.h);ctx.fillStyle=s.roomExitOpen||s.completed?"#6fffd0":"#9a6b43";ctx.fillRect(s.layout.exit.x-18,s.layout.exit.y-18,36,36);for(const p of s.players){ctx.fillStyle=p.local?"#ffffff":ROLES[p.role]?.color||"#7ff";ctx.beginPath();ctx.arc(p.x,p.y,14,0,Math.PI*2);ctx.fill();if(p.supportPet){ctx.fillStyle=RARITIES[p.supportPet.rarity]?.color||"#f8b";ctx.beginPath();ctx.arc(p.supportPet.x,p.supportPet.y,7,0,Math.PI*2);ctx.fill();}}ctx.fillStyle="#ff6479";for(const e of s.enemies)if(!e.dead){ctx.beginPath();ctx.arc(e.x,e.y,e.boss?18:8,0,Math.PI*2);ctx.fill();}ctx.restore();ctx.strokeStyle="#58737c";ctx.strokeRect(.5,.5,c.width-1,c.height-1);}

  function facingFromAngle(angle){const a=Math.atan2(Math.sin(Number(angle)||0),Math.cos(Number(angle)||0));if(a>-Math.PI/4&&a<=Math.PI/4)return "right";if(a>Math.PI/4&&a<=Math.PI*3/4)return "front";if(a<=-Math.PI/4&&a>-Math.PI*3/4)return "back";return "left";}
  function drawPlayer(ctx,s,p,now){
    const selected=s.selectedTargetUid===p.uid,x=sx(s,p.x),y=sy(s,p.y),c=CLASSES[p.classId]||CLASSES.berserker,r=ROLES[p.role]||ROLES.dps,a=p.appearance||{gender:"male",skin:"medium",hair:"dark",preset:"human"},g=p.gearVisual||{armor:c.color,trim:c.color,helmet:c.color,gloves:c.color,boots:c.color,weapon:c.color,helmetType:p.role==="tank"?"helmet":p.role==="healer"?"hood":"none"},phase=p.moving?(p.walkPhase||now*.012):0,facing=facingFromAngle(p.angle),side=facing==="left"?-1:1;
    ctx.save();ctx.translate(x,y);ctx.globalAlpha=p.dead?.35:1;
    if(selected){ctx.strokeStyle="#66f3a5";ctx.shadowColor="#66f3a5";ctx.shadowBlur=18;ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(0,8,38,15,0,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;}
    if((p.shield||0)>0){const pulse=.82+.1*Math.sin(now*.009);ctx.strokeStyle="#9fe9ff";ctx.fillStyle="#7bdcff18";ctx.shadowColor="#9fe9ff";ctx.shadowBlur=18;ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(0,-37,36*pulse,58*pulse,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;}
    drawFantasyCharacter(ctx,{appearance:a,gear:g,classId:p.classId,role:p.role,scale:.82,walk:phase,attack:(p.attackAnim||0)>.01,casting:(p.castAnim||0)>0,side,facing,now});
    const preset=presetById(a.preset);ctx.fillStyle="#fff";ctx.font="900 11px system-ui";ctx.textAlign="center";ctx.shadowColor="#000";ctx.shadowBlur=5;ctx.fillText(p.name,0,-91*(preset.height||1));ctx.fillStyle=r.color;ctx.font="800 10px system-ui";ctx.fillText(`${r.icon} ${Math.round(p.hp/Math.max(1,p.maxHp)*100)}%`,0,-79*(preset.height||1));ctx.restore();}
  function drawPlayerWeapon(ctx,p,c,torsoY,side,attack,casting){const gv=p.gearVisual||{},weaponColor=gv.weapon||c.color,module=gv.weaponModule||"steel";ctx.save();ctx.translate(side*(casting?9:19),torsoY+(casting?-18:4));const swing=attack?(side>0?-.7:.7):0;ctx.shadowColor=weaponColor;ctx.shadowBlur=module==="steel"?4:module==="holy"?18:14;if(p.role==="tank"){ctx.fillStyle="#496a7c";ctx.strokeStyle="#8fe8ff";ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(-side*34,3,14,20,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.rotate(swing);ctx.strokeStyle=weaponColor;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,-24);ctx.lineTo(side*11,24);ctx.stroke();ctx.strokeStyle="#9a6b3f";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-side*3,9);ctx.lineTo(side*7,13);ctx.stroke();}
    else if(c.weaponType==="bow"){ctx.strokeStyle="#c2ef7e";ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,20,-Math.PI/2,Math.PI/2);ctx.stroke();ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(0,20);ctx.stroke();ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-7,0);ctx.lineTo(24,0);ctx.stroke();}
    else if(c.projectile){ctx.rotate(swing*.5);ctx.strokeStyle=weaponColor;ctx.shadowColor=weaponColor;ctx.shadowBlur=casting?25:12;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(0,casting?-40:-22);ctx.lineTo(0,casting?22:25);ctx.stroke();ctx.fillStyle=casting?"#eafff1":"#fff";ctx.beginPath();ctx.arc(0,casting?-43:-25,casting?9:6,0,Math.PI*2);ctx.fill();if(casting){ctx.strokeStyle="#87ffc0";ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-43,15,0,Math.PI*2);ctx.stroke();}}
    else{ctx.rotate(swing);ctx.strokeStyle=weaponColor;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,-23);ctx.lineTo(side*12,25);ctx.stroke();ctx.strokeStyle="#a67648";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-side*3,8);ctx.lineTo(side*8,12);ctx.stroke();}
    if(module!=="steel"){ctx.globalAlpha=.75;ctx.fillStyle=weaponColor;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(Math.sin(i*2.1)*9,-28-i*7,2+i*.6,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}ctx.restore();}

  function drawEnemy(ctx,s,e,now){const selected=(s.selectedEnemyId===e.id);const x=sx(s,e.x),y=sy(s,e.y),pulse=.5+.5*Math.sin(now*.006),scale=e.boss?1.35:e.elite?1.12:1,phase=e.moving?Math.sin(e.walkPhase||now*.01)*5:0,kind=e.archetype||monsterArchetype(e.name);ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);if(selected){ctx.strokeStyle="#ffe47a";ctx.shadowColor="#ffe47a";ctx.shadowBlur=18;ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(0,10,e.radius+12,e.radius*.45,0,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;}ctx.fillStyle="#0009";ctx.beginPath();ctx.ellipse(0,8,e.radius*.95,e.radius*.3,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#17191e";ctx.lineWidth=8;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(-6,-1);ctx.lineTo(-8+phase*.5,16);ctx.moveTo(6,-1);ctx.lineTo(8-phase*.5,16);ctx.stroke();ctx.shadowColor=e.color;ctx.shadowBlur=e.boss?22:10;ctx.fillStyle=e.color;ctx.strokeStyle=e.boss?"#fff":e.elite?"#ffd85d":"#20242a";ctx.lineWidth=e.boss?3:2;ctx.beginPath();if(kind==="beast"){ctx.moveTo(-e.radius*.78,-18);ctx.quadraticCurveTo(-e.radius,-4,-e.radius*.72,12);ctx.lineTo(-10,22);ctx.quadraticCurveTo(0,28,10,22);ctx.lineTo(e.radius*.72,12);ctx.quadraticCurveTo(e.radius,-4,e.radius*.78,-18);ctx.quadraticCurveTo(0,-44,-e.radius*.78,-18);ctx.closePath();}else if(kind==="skeleton"){ctx.rect(-e.radius*.6,-26,e.radius*1.2,38);}else if(kind==="cultist"){ctx.moveTo(-e.radius*.7,-24);ctx.quadraticCurveTo(0,-42,e.radius*.7,-24);ctx.lineTo(e.radius*.88,10);ctx.lineTo(-e.radius*.88,10);ctx.closePath();}else{ctx.moveTo(-e.radius*.7,-24);ctx.quadraticCurveTo(-e.radius,-4,-e.radius*.6,10);ctx.lineTo(e.radius*.6,10);ctx.quadraticCurveTo(e.radius,-4,e.radius*.7,-24);ctx.quadraticCurveTo(0,-40,-e.radius*.7,-24);ctx.closePath();}ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle="#a77463";ctx.beginPath();ctx.arc(0,-34,11+(e.boss?4:0),0,Math.PI*2);ctx.fill();ctx.fillStyle="#17141a";ctx.beginPath();if(kind==="beast"){ctx.arc(-4,-38,2.2,0,Math.PI*2);ctx.arc(4,-38,2.2,0,Math.PI*2);ctx.fill();ctx.strokeStyle=e.color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-7,-46);ctx.lineTo(-15,-60);ctx.moveTo(7,-46);ctx.lineTo(15,-60);ctx.stroke();ctx.fillStyle="#fff0a0";ctx.fillRect(-4,-28,2,8);ctx.fillRect(2,-28,2,8);}else{ctx.arc(-4,-34,1.9,0,Math.PI*2);ctx.arc(4,-34,1.9,0,Math.PI*2);ctx.fill();}ctx.fillStyle="#ffdf6a";ctx.beginPath();ctx.arc(-4,-34,1.5,0,Math.PI*2);ctx.arc(4,-34,1.5,0,Math.PI*2);ctx.fill();if(kind==="skeleton"){ctx.strokeStyle="#e7edf1";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-8,-8);ctx.lineTo(8,-8);ctx.moveTo(0,-26);ctx.lineTo(0,10);ctx.moveTo(-8,-17);ctx.lineTo(8,1);ctx.moveTo(8,-17);ctx.lineTo(-8,1);ctx.stroke();}if(e.boss){ctx.strokeStyle=e.color;ctx.globalAlpha=.45+pulse*.35;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-15,e.radius+10+pulse*5,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}if(e.ranged){ctx.strokeStyle="#d9e2e8";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(17,-25);ctx.lineTo(25,6);ctx.stroke();ctx.fillStyle=e.color;ctx.beginPath();ctx.arc(17,-28,5,0,Math.PI*2);ctx.fill();}else{ctx.strokeStyle="#e7edf1";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(17,-24);ctx.lineTo(28,8+(e.attackAnim?8:0));ctx.stroke();}ctx.scale(1/scale,1/scale);const w=Math.max(50,e.radius*2.4);ctx.fillStyle="#19080b";ctx.fillRect(-w/2,-e.radius*scale-42,w,6);ctx.fillStyle=e.boss?"#ff526f":"#7ce98d";ctx.fillRect(-w/2,-e.radius*scale-42,w*clamp(e.hp/e.maxHp,0,1),6);ctx.fillStyle="#fff";ctx.font="800 10px system-ui";ctx.textAlign="center";ctx.fillText(e.name,0,-e.radius*scale-49);ctx.restore();}
  function drawChests(ctx,s){const cleared=roomCombatCleared(s);for(const c of s.chests||[]){const opened=s.openedChestIds?.has(c.id),x=sx(s,c.x),y=sy(s,c.y),near=cleared&&!opened&&Math.hypot(s.player.x-c.x,s.player.y-c.y)<=CHEST_INTERACT_RANGE;ctx.save();ctx.translate(x,y);ctx.shadowColor=opened?"transparent":cleared?"#ffd96a":"#ff5f6d";ctx.shadowBlur=near?22:cleared?9:5;ctx.fillStyle=opened?"#332b24":cleared?"#9b622c":"#4b3433";ctx.strokeStyle=opened?"#6f6254":cleared?"#ffd77a":"#a75d62";ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(-28,-22,56,42,6);ctx.fill();ctx.stroke();ctx.fillStyle=opened?"#4c4034":cleared?"#cf8b39":"#694347";ctx.fillRect(-28,-24,56,14);ctx.strokeRect(-28,-24,56,14);ctx.fillStyle=opened?"#6f6254":cleared?"#fff0a0":"#cf7c82";ctx.fillRect(-5,-23,10,43);if(!opened&&!cleared){ctx.fillStyle="#fff";ctx.font="900 15px system-ui";ctx.textAlign="center";ctx.fillText("🔒",0,-33);}else if(near){ctx.fillStyle="#fff";ctx.font="900 13px system-ui";ctx.textAlign="center";ctx.fillText("E",0,-35);}ctx.restore();}}
  function drawProjectile(ctx,s,b,now=performance.now()){
    const x=sx(s,finite(b?.x,0)),y=sy(s,finite(b?.y,0));
    if(x<-60||y<-60||x>CANVAS_W+60||y>CANVAS_H+60)return;
    const radius=clamp(finite(b?.radius,5),2,18),color=String(b?.color|| (b?.friendly?"#8fffd5":"#ff667c"));
    const speed=Math.hypot(finite(b?.vx,0),finite(b?.vy,0)),angle=Math.atan2(finite(b?.vy,0),finite(b?.vx,1));
    const pulse=.82+.18*Math.sin(now*.018+finite(b?.x,0)*.01);
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);
    ctx.globalCompositeOperation="lighter";ctx.shadowColor=color;ctx.shadowBlur=14+radius;
    const trail=Math.min(b?.trail||34,b?.kind==="penance"?54:8+speed*.025);
    const gradient=ctx.createLinearGradient(-trail,0,radius,0);gradient.addColorStop(0,"rgba(255,255,255,0)");gradient.addColorStop(.72,color);gradient.addColorStop(1,"#ffffff");
    ctx.strokeStyle=gradient;ctx.lineWidth=Math.max(2,b?.kind==="penance"?radius*1.15:radius*.9);ctx.lineCap="round";ctx.beginPath();ctx.moveTo(-trail,0);ctx.lineTo(radius,0);ctx.stroke();
    ctx.fillStyle=color;ctx.beginPath();ctx.arc(0,0,radius*pulse,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#ffffff";ctx.globalAlpha=.92;ctx.beginPath();ctx.arc(radius*.12,-radius*.12,Math.max(1.5,radius*.38),0,Math.PI*2);ctx.fill();
    if(b?.homingId||radius>=8){ctx.globalAlpha=.5;ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,radius*1.7,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
  }
  function drawTelegraph(ctx,s,t){ctx.save();ctx.translate(sx(s,t.x),sy(s,t.y));ctx.fillStyle="#ff405522";ctx.strokeStyle="#ff5367";ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,t.radius,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}
  function drawEffect(ctx,s,e){
    const x=sx(s,e.x),y=sy(s,e.y),life=clamp(e.life,0,1);ctx.save();ctx.translate(x,y);ctx.globalAlpha=life;ctx.shadowColor=e.color;ctx.shadowBlur=18;
    if(e.type==="lightwave"){ctx.strokeStyle="#fff6b0";ctx.lineWidth=7;for(let i=0;i<3;i++){ctx.globalAlpha=life*(1-i*.2);ctx.beginPath();ctx.arc(0,0,(28+i*22)*(1+(1-life)*.7),-Math.PI*.82,-Math.PI*.18);ctx.stroke();}ctx.fillStyle="#fff9c9";for(let i=0;i<8;i++){const a=-Math.PI*.85+i*Math.PI*.1,r=35+(1-life)*70;ctx.beginPath();ctx.arc(Math.cos(a)*r,Math.sin(a)*r,3,0,Math.PI*2);ctx.fill();}}
    else if(e.type==="cleanse"||e.type==="natureburst"){ctx.fillStyle=e.type==="cleanse"?"#78f29a":e.color;for(let i=0;i<12;i++){const a=i*Math.PI/6+(1-life)*2,r=28+(1-life)*60;ctx.save();ctx.translate(Math.cos(a)*r,Math.sin(a)*r);ctx.rotate(a);ctx.beginPath();ctx.ellipse(0,0,8,3,0,0,Math.PI*2);ctx.fill();ctx.restore();}}
    else if(e.type==="shieldburst"){ctx.strokeStyle="#dffaff";ctx.lineWidth=5;for(let i=0;i<3;i++){ctx.globalAlpha=life*(1-i*.18);ctx.beginPath();ctx.arc(0,0,(34+i*17)*(1+(1-life)*.3),Math.PI*.08,Math.PI*.92);ctx.stroke();}}
    else if(e.type==="fireburst"){ctx.strokeStyle="#ff9b55";ctx.lineWidth=5;for(let i=0;i<10;i++){const a=i*Math.PI/5,r=22+(1-life)*65;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.25,Math.sin(a)*r*.25);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);ctx.stroke();}}
    else if(e.type==="frostburst"){ctx.strokeStyle="#a7e9ff";ctx.lineWidth=4;for(let i=0;i<6;i++){const a=i*Math.PI/3,r=55*(1+(1-life)*.35);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);ctx.stroke();}}
    else if(e.type==="voidburst"||e.type==="arcaneburst"){ctx.strokeStyle=e.color;ctx.lineWidth=4;for(let i=0;i<3;i++){ctx.globalAlpha=life*(1-i*.2);ctx.beginPath();ctx.ellipse(0,0,(28+i*18)*(1+(1-life)*.4),(18+i*13)*(1+(1-life)*.4),i*.45,0,Math.PI*2);ctx.stroke();}}
    else if(e.type==="bloodburst"||e.type==="groundslam"){ctx.strokeStyle=e.color;ctx.lineWidth=6;for(let i=0;i<7;i++){const a=-Math.PI*.9+i*Math.PI*.3,r=30+(1-life)*65;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.2,Math.sin(a)*r*.2);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);ctx.stroke();}}
    else if(e.type==="arrowrain"){ctx.strokeStyle=e.color;ctx.lineWidth=3;for(let i=0;i<7;i++){const ox=(i-3)*13;ctx.beginPath();ctx.moveTo(ox,-55-(1-life)*20);ctx.lineTo(ox+7,18);ctx.stroke();}}
    else{ctx.strokeStyle=e.color;ctx.fillStyle=`${e.color}22`;ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,e.radius*(1+(1-life)*.25),0,Math.PI*2);ctx.fill();ctx.stroke();}
    ctx.restore();
  }
  function drawZone(ctx,s,z,now){const alpha=clamp(z.life/Math.max(1,z.maxLife||7),0,1),pulse=.82+.12*Math.sin(now*.008);ctx.save();ctx.translate(sx(s,z.x),sy(s,z.y));ctx.globalAlpha=.28+.45*alpha;ctx.fillStyle=`${z.color}24`;ctx.strokeStyle=z.color;ctx.shadowColor=z.color;ctx.shadowBlur=18;ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,z.radius*pulse,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.globalAlpha=.75*alpha;for(let i=0;i<8;i++){const a=now*.0015+i*Math.PI/4,r=z.radius*.68;ctx.beginPath();ctx.arc(Math.cos(a)*r,Math.sin(a)*r,3,0,Math.PI*2);ctx.fillStyle=z.color;ctx.fill();}ctx.restore();}
  function drawText(ctx,s,t){ctx.save();ctx.translate(sx(s,t.x),sy(s,t.y));ctx.globalAlpha=clamp(t.life/.8,0,1);ctx.fillStyle=t.color;ctx.font="900 18px system-ui";ctx.textAlign="center";ctx.shadowColor="#000";ctx.shadowBlur=5;ctx.fillText(t.text,0,0);ctx.restore();}
  function drawCenterMessage(ctx,text){ctx.save();ctx.fillStyle="#061014dd";ctx.strokeStyle="#6fffd0aa";ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(CANVAS_W/2-250,70,500,64,18);ctx.fill();ctx.stroke();ctx.fillStyle="#fff";ctx.font="900 21px system-ui";ctx.textAlign="center";ctx.fillText(text,CANVAS_W/2,110);ctx.restore();}
  function drawPortal(ctx,s,now){const portal=s.layout?.exit||{x:WORLD_W/2,y:110},x=sx(s,portal.x),y=sy(s,portal.y),pulse=.7+.3*Math.sin(now*.006);ctx.save();ctx.translate(x,y);ctx.strokeStyle="#75f5ff";ctx.shadowColor="#75f5ff";ctx.shadowBlur=24;ctx.lineWidth=8;ctx.beginPath();ctx.ellipse(0,0,34+pulse*6,57+pulse*8,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle="#885dff44";ctx.fill();ctx.restore();}
  function openTradeGift(){
    const s=UI.session,target=s?.players.find(p=>p.uid===s.selectedTargetUid&&!p.local);if(!s?.online||!target)return toast("Handel nicht verfügbar","Wähle in einer Online-Gruppe einen Mitspieler aus.");
    const d=ensureState(),options=d.inventory.filter(item=>!Object.values(d.equipped).includes(item.uid)).slice(0,60),food=d.consumables.slice(0,40);
    UI.overlay.insertAdjacentHTML("beforeend",`<div class="dkl-trade-modal"><section><button data-dkl-trade-close>×</button><small>HANDEL MIT ${esc(target.name)}</small><h2>Item, Essen oder Dungeon-Gold übergeben</h2><label>Gegenstand<select data-dkl-trade-item><option value="">Kein Gegenstand</option><optgroup label="Ausrüstung">${options.map(x=>`<option value="item:${x.uid}">${esc(x.name)} · L${x.level}</option>`).join("")}</optgroup><optgroup label="Essen & Tränke">${food.map(x=>`<option value="cons:${x.id}">${esc(x.name)} · ×${x.quantity}</option>`).join("")}</optgroup></select></label><label>Dungeon-Gold<input type="number" min="0" max="${d.gold}" value="0" data-dkl-trade-gold></label><button class="dkl-btn primary" data-dkl-trade-send>Übergeben</button><p>Die Übergabe wird über die laufende Dungeon-Gruppe synchronisiert.</p></section></div>`);
    const modal=UI.overlay.querySelector(".dkl-trade-modal"),close=()=>modal?.remove();modal.querySelector("[data-dkl-trade-close]").onclick=close;
    modal.querySelector("[data-dkl-trade-send]").onclick=()=>{const selected=modal.querySelector("[data-dkl-trade-item]").value,gold=clamp(Math.floor(Number(modal.querySelector("[data-dkl-trade-gold]").value)||0),0,d.gold),itemId=selected.startsWith("item:")?selected.slice(5):"",consId=selected.startsWith("cons:")?selected.slice(5):"",item=d.inventory.find(x=>x.uid===itemId),cons=d.consumables.find(x=>x.id===consId);if(!item&&!cons&&!gold)return;if(item)d.inventory=d.inventory.filter(x=>x.uid!==item.uid);if(cons){cons.quantity--;if(cons.quantity<=0)d.consumables=d.consumables.filter(x=>x.id!==cons.id);}d.gold-=gold;s.tradeGiftSeq=(s.tradeGiftSeq||0)+1;s.outgoingTradeGift={id:`${s.player.uid}:${s.tradeGiftSeq}`,targetUid:target.uid,fromName:s.player.name,gold,item:item?{...item,uid:""}:null,consumable:cons?{...cons,id:"",quantity:1}:null,createdAtMs:Date.now()};safeSave();updateHead();const label=item?.name||cons?.name||"";toast("Übergabe gesendet",`${label}${label&&gold?" · ":""}${gold?GOLD.format(gold)+" Gold":""}`);close();};
  }

  function applyTradeGift(s,gift){if(!gift||gift.targetUid!==s.player.uid)return;s.receivedTradeGiftIds ||= new Set();if(s.receivedTradeGiftIds.has(gift.id))return;s.receivedTradeGiftIds.add(gift.id);const d=ensureState();if(gift.gold)d.gold+=Math.max(0,Math.floor(Number(gift.gold)||0));if(gift.item)addItem({...gift.item,uid:uid(),acquiredAt:Date.now()},false);if(gift.consumable){ensureProfessionData(d);const existing=d.consumables.find(x=>x.recipeId&&x.recipeId===gift.consumable.recipeId||x.name===gift.consumable.name);if(existing)existing.quantity+=1;else d.consumables.push({...gift.consumable,id:uid(),quantity:1});}safeSave();updateHead();toast("Handel erhalten",`${gift.fromName||"Mitspieler"} hat dir ${gift.item?.name||""}${gift.item&&gift.gold?" und ":""}${gift.gold?GOLD.format(gift.gold)+" Gold":""} gegeben.`);}
  function updateDungeonHud(){
    const s=UI.session;if(!s||!UI.main)return;
    const hpPct=clamp(s.player.hp/Math.max(1,s.player.maxHp)*100,0,100),hp=UI.main.querySelector("[data-dkl-hp]");if(hp)hp.style.width=`${hpPct}%`;
    const hpt=UI.main.querySelector("[data-dkl-hp-text]");if(hpt)hpt.textContent=`${Math.round(hpPct)} % · ${NUMBER.format(Math.max(0,s.player.hp))}/${NUMBER.format(s.player.maxHp)}`;
    const shield=UI.main.querySelector("[data-dkl-shield]");if(shield)shield.style.width=`${clamp((s.player.shield||0)/Math.max(1,s.player.maxHp)*100,0,100)}%`;
    const roomBanner=UI.main.querySelector("[data-dkl-room-banner]"),room=UI.main.querySelector("[data-dkl-room]"),objective=UI.main.querySelector("[data-dkl-objective]"),bannerVisible=performance.now()<(s.roomBannerUntil||0);if(roomBanner)roomBanner.hidden=!bannerVisible;if(room)room.textContent=`${s.layout?.roomTitle||"Raum"} · ${s.room}/${s.dungeon.rooms}`;if(objective)objective.textContent=`${s.enemies.filter(e=>!e.dead).length} Gegner in diesem Raum`;
    for(let slot=0;slot<6;slot++){const remain=s.actionCooldowns?.[slot]||0,total=Math.max(.01,s.actionCooldownTotals?.[slot]||1),progress=clamp(1-remain/total,0,1),button=UI.main.querySelector(`[data-dkl-action-slot="${slot}"]`),cd=UI.main.querySelector(`[data-dkl-action-cd="${slot}"]`),fill=UI.main.querySelector(`[data-dkl-action-fill="${slot}"]`);if(cd)cd.textContent=remain>0?`${remain.toFixed(1)} s`:(s.player.actionBar?.[slot]?"Bereit":"Nicht belegt");if(button)button.classList.toggle("ready",remain<=0&&!!s.player.actionBar?.[slot]);if(fill)fill.style.transform=`scaleX(${progress})`;}
    const team=UI.main.querySelector("[data-dkl-team]");if(team)team.innerHTML=s.players.filter(p=>!p.local).map(p=>`<div role="button" tabindex="0" data-dkl-target-player="${esc(p.uid)}" class="role-${p.role} ${s.selectedTargetUid===p.uid?"selected":""}"><span>${CLASSES[p.classId]?.icon||"◆"}</span><b>${esc(p.name)}</b><small>PWR ${formatPower(p.power)} · Schild ${formatPower(p.shield||0)}</small><em>${p.dead?"K.O.":`${Math.round(p.hp/Math.max(1,p.maxHp)*100)} %`}</em></div>`).join("");
    const enemy=s.enemies.find(e=>e.id===s.selectedEnemyId&&!e.dead),ally=s.players.find(p=>p.uid===s.selectedTargetUid),target=enemy||ally||s.player,targetFrame=UI.main.querySelector("[data-dkl-target-frame]");if(targetFrame){targetFrame.classList.toggle("enemy",!!enemy);const name=targetFrame.querySelector("[data-dkl-target-name]"),type=targetFrame.querySelector("[data-dkl-target-type]"),icon=targetFrame.querySelector("[data-dkl-target-icon]"),bar=targetFrame.querySelector("[data-dkl-target-health]"),text=targetFrame.querySelector("[data-dkl-target-health-text]");const pct=clamp((target.hp||0)/Math.max(1,target.maxHp||1)*100,0,100);if(name)name.textContent=target.name||"Ziel";if(type)type.textContent=enemy?(enemy.boss?"Boss":"Gegner"):`${ROLES[target.role]?.name||"Verbündeter"} · Schild ${NUMBER.format(target.shield||0)}`;if(icon)icon.textContent=enemy?"☠":(CLASSES[target.classId]?.icon||"◎");if(bar)bar.style.width=`${pct}%`;if(text)text.textContent=target.dead?"K.O.":`${Math.round(pct)} %`;const trade=targetFrame.querySelector("[data-dkl-target-trade]");if(trade)trade.hidden=!!enemy||!s.online||!ally||ally.local;}
    const tameable=nearestTameableEnemy(s),nearbyChest=nearestClosedChest(s),interact=UI.main.querySelector("[data-dkl-interact]");s.nearbyChestId=nearbyChest?.id||"";if(interact){interact.hidden=!(tameable||nearbyChest);const b=interact.querySelector("b"),small=interact.querySelector("small");if(b)b.textContent=tameable?"Tier zähmen":"Kiste öffnen";if(small)small.textContent=tameable?"Geschwächtes Tier übernehmen":"Loot aufnehmen";}
    const bossHud=UI.main.querySelector("[data-dkl-boss]"),boss=s.enemies.find(e=>e.boss&&!e.dead);if(bossHud){bossHud.hidden=!boss;if(boss){bossHud.querySelector("b").textContent=boss.name;bossHud.querySelector("i").style.width=`${clamp(boss.hp/boss.maxHp*100,0,100)}%`;bossHud.querySelector("small").textContent=`${NUMBER.format(Math.max(0,Math.round(boss.hp)))} / ${NUMBER.format(boss.maxHp)}`;}}
    updateCombatMeter(s);syncCombatMeterVisibility(s);
    const log=UI.main.querySelector("[data-dkl-combat-log]");if(log){const lines=(s.combatLog||[]).slice(-7);log.innerHTML=lines.map(line=>`<p>${esc(line)}</p>`).join("");log.scrollTop=log.scrollHeight;}
  }
  function formatTime(ms){const total=Math.floor(ms/1000),m=Math.floor(total/60),s=total%60;return `${m}:${String(s).padStart(2,"0")}`;}
  function finishDungeonExit(){const s=UI.session;if(!s)return;if(!s.completed)return;endDungeon(true,"Dungeon abgeschlossen.");}
  function endDungeon(success,reason){const s=UI.session;if(!s)return;const d=ensureState(),elapsed=Date.now()-s.startedAt;if(success){const current=d.bestDungeon[s.dungeon.id];if(!current||elapsed<current.time)d.bestDungeon[s.dungeon.id]={time:elapsed,partySize:s.partySize,at:Date.now()};d.completed[s.dungeon.id]=(d.completed[s.dungeon.id]||0)+1;d.gold+=Math.round((500+s.dungeon.level*90)*Math.max(.7,1+(s.partySize-2)*.18));addXp(Math.round((800+s.dungeon.level*160)*Math.max(.7,1+(s.partySize-2)*.18)));}const mainXpBase=success?Math.min(90,18+Math.floor(s.dungeon.level*2.2)+Math.floor(s.room*1.5)):Math.min(24,5+Math.floor(s.room*1.2));const mainXp=typeof window.JKGamesAwardMainGameXp==="function"?window.JKGamesAwardMainGameXp("dungeon",mainXpBase,success?`${s.dungeon.name} abgeschlossen`:`${s.dungeon.name} versucht`,{eventKey:`dungeon:${s.dungeon.id}:${s.startedAt}:${success?1:0}`}):0;safeSave();stopSession(false);UI.view="result";const online=!!s.online;UI.main.innerHTML=`<div class="dkl-result ${success?"success":"fail"}"><span>${success?"🏆":"☠"}</span><small>${esc(s.dungeon.name)}</small><h2>${success?"Dungeon abgeschlossen":"Gruppe besiegt"}</h2><p>${esc(reason)}</p><div><b>Zeit ${formatTime(elapsed)}</b><b>Räume ${s.room}/${s.dungeon.rooms}</b><b>Gruppe ${s.partySize}</b><b>Haupt-EP +${mainXp}</b></div><button class="dkl-btn primary" data-dkl-result-home>${online?"Zur Gruppenlobby":"Zum Spielmenü"}</button></div>`;UI.main.querySelector("[data-dkl-result-home]").addEventListener("click",()=>returnAfterDungeon(s));}
  async function returnAfterDungeon(session){
    if(!session.online){renderHome();return;}
    UI.view="partyReturn";const party=UI.party;
    if(!party){renderHome();return;}
    if(party.host){try{await party.fb.updateDoc(party.ref,{status:"lobby",updatedAtMs:Date.now()});}catch(error){toast("Gruppenlobby nicht erreichbar",error.message||String(error));}}
    renderPartyLobby();
  }
  function stopSession(render=false){
    UI.loadingToken++;
    if(UI.raf)cancelAnimationFrame(UI.raf);
    UI.raf=0;UI.last=0;
    UI.timers.splice(0).forEach(id=>{clearInterval(id);clearTimeout(id);});
    UI.session=null;
    if(render&&UI.overlay)renderHome();
  }
  async function showExitDialog(){if(!confirm("Dungeon wirklich verlassen? Der aktuelle Fortschritt geht verloren."))return;const party=UI.party;if(party?.host&&UI.session?.online)await leaveParty(false,"Der Host hat den Dungeon verlassen.");else{stopSession(false);await leaveParty(false,"Ein Spieler hat den Dungeon verlassen.");}renderHome();}
  function showTutorial(){const d=ensureState();const html=`<div class="dkl-tutorial"><div><button data-dkl-tutorial-close>×</button><small>WILLKOMMEN IN DUNGEON.KL</small><h2>Deine erste Expedition</h2><p>Wähle Tank, DD oder Heiler. Mit <b>WASD</b> bewegst du dich. Klicke oder tippe einen Gegner an. Sobald er sichtbar und in Reichweite ist, greift dein Charakter ihn automatisch an. Gegner erkennen euch nur mit freier Sicht. Mit <b>E</b> öffnest du Kisten. Als Jäger zähmst du damit geschwächte Wölfe, Hunde und Bestien.</p><div><span><b>1–6</b><small>Frei belegbare Fähigkeiten</small></span><span><b>2–4 Spieler</b><small>Bessere Beute und mehr XP</small></span><span><b>3 Bosse</b><small>Pro Dungeon inklusive Endboss</small></span></div><button class="dkl-btn primary" data-dkl-tutorial-ok>Verstanden</button></div></div>`;UI.overlay.insertAdjacentHTML("beforeend",html);const close=()=>{UI.overlay.querySelector(".dkl-tutorial")?.remove();d.tutorialDone=true;safeSave();};UI.overlay.querySelector("[data-dkl-tutorial-close]").addEventListener("click",close);UI.overlay.querySelector("[data-dkl-tutorial-ok]").addEventListener("click",close);}
  function unlockAudio(){
    if(UI.audio&&UI.audio.state!=="closed")return UI.audio;
    const AudioCtor=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtor)return null;
    try{
      const audio=new AudioCtor({latencyHint:"interactive"});
      UI.audio=audio;
      if(audio.state==="suspended")audio.resume().catch(()=>{});
      return audio;
    }catch(error){
      UI.audio=null;
      return null;
    }
  }
  function playSound(type){const d=ensureState();if(!d.settings.sound||!UI.audio)return;try{const o=UI.audio.createOscillator(),g=UI.audio.createGain();o.connect(g);g.connect(UI.audio.destination);o.type=type==="skill"?"sine":"square";o.frequency.value=type==="skill"?420:180;g.gain.setValueAtTime(.035,UI.audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,UI.audio.currentTime+.12);o.start();o.stop(UI.audio.currentTime+.12);}catch{}}
  function onKeyDown(e){if(!UI.overlay)return;const typing=/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName||"");if(typing){if(e.code==="Escape")document.activeElement.blur();return;}UI.keys[e.code]=true;if(UI.session){if(["Digit1","Digit2","Digit3","Digit4","Digit5","Digit6"].includes(e.code)){e.preventDefault();useActionSlot(Number(e.code.slice(-1))-1);}if(e.code==="KeyE"){e.preventDefault();interactNearby();}if(e.code==="KeyI"){e.preventDefault();renderInventory();}if(e.code==="Escape"){e.preventDefault();showExitDialog();}}else if(e.code==="Escape"){e.preventDefault();returnToTopGames();}}
  function onKeyUp(e){UI.keys[e.code]=false;}
  function pointerDown(e){const s=UI.session;if(!s)return;if(e.pointerType!=="mouse")e.preventDefault();const rect=s.canvas.getBoundingClientRect(),px=e.clientX-rect.left,py=e.clientY-rect.top;UI.pointer.down=true;UI.pointer.x=px;UI.pointer.y=py;const worldX=px/Math.max(1,rect.width)*CANVAS_W+s.camera.x-CANVAS_W/2,worldY=py/Math.max(1,rect.height)*CANVAS_H+s.camera.y-CANVAS_H/2;const clickedLoot=(s.groundLoot||[]).filter(loot=>!s.pickedGroundLootIds?.has(loot.id)).sort((a,b)=>Math.hypot(a.x-worldX,a.y-worldY)-Math.hypot(b.x-worldX,b.y-worldY))[0];if(clickedLoot&&Math.hypot(clickedLoot.x-worldX,clickedLoot.y-worldY)<48&&Math.hypot(clickedLoot.x-s.player.x,clickedLoot.y-s.player.y)<110){pickupGroundLoot(s,clickedLoot);return;}let bestPlayer=null,bestPlayerD=58;for(const player of s.players){const d=Math.hypot(player.x-worldX,player.y-worldY);if(d<bestPlayerD){bestPlayer=player;bestPlayerD=d;}}let bestEnemy=null,bestEnemyD=72;for(const enemy of s.enemies){if(enemy.dead)continue;const d=Math.hypot(enemy.x-worldX,enemy.y-worldY);if(d<bestEnemyD+enemy.radius){bestEnemy=enemy;bestEnemyD=d;}}if(bestEnemy&&(!bestPlayer||bestEnemyD<=bestPlayerD+4)){selectEnemyTarget(bestEnemy.id);return;}if(bestPlayer)selectPlayerTarget(bestPlayer.uid);}
  function pointerMove(){/* Bewegung auf Touch-Geräten wird direkt vom sichtbaren Stick gesteuert. */}
  function pointerUp(){UI.pointer.down=false;}
  function bindDungeonMobileStick(stick){
    const s=UI.session;if(!s||!stick)return;const knob=stick.querySelector("i");let pointerId=null;
    const update=(event)=>{const rect=stick.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2,dx=event.clientX-cx,dy=event.clientY-cy,max=Math.max(24,Math.min(rect.width,rect.height)*.34),len=Math.hypot(dx,dy)||1,ratio=Math.min(1,max/len),kx=dx*ratio,ky=dy*ratio;s.mobileMove={x:clamp(dx/max,-1,1),y:clamp(dy/max,-1,1)};if(knob)knob.style.transform=`translate(${kx}px,${ky}px)`;};
    const end=(event)=>{if(pointerId!==null&&event&&event.pointerId!==pointerId)return;try{if(pointerId!==null&&stick.hasPointerCapture?.(pointerId))stick.releasePointerCapture(pointerId);}catch{}pointerId=null;s.mobileMove=null;s.mobileOrigin=null;UI.pointer.down=false;if(knob)knob.style.transform="translate(0,0)";};
    stick.addEventListener("pointerdown",event=>{if(event.pointerType==="mouse"&&event.button!==0)return;event.preventDefault();event.stopPropagation();pointerId=event.pointerId;UI.pointer.down=true;s.mobileOrigin={x:event.clientX,y:event.clientY};try{stick.setPointerCapture?.(pointerId);}catch{}update(event);},{passive:false});
    stick.addEventListener("pointermove",event=>{if(pointerId===null||event.pointerId!==pointerId)return;event.preventDefault();event.stopPropagation();update(event);},{passive:false});
    stick.addEventListener("pointerup",end,{passive:false});stick.addEventListener("pointercancel",end,{passive:false});stick.addEventListener("lostpointercapture",end);
  }

  window.DungeonKL = Object.freeze({ version: VERSION, open, close, returnToTopGames });

  window.addEventListener("pagehide",()=>{const p=UI.party;if(!p?.host||!UI.session?.online)return;try{p.fb.updateDoc(p.ref,{status:"closed",closedReason:"Der Host hat die Verbindung beendet.",closedAtMs:Date.now(),updatedAtMs:Date.now()}).catch(()=>{});}catch{}});
})();
