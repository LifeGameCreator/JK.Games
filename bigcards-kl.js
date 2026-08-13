/* BigCards.kl – JK.Games Top Game V429 · Smooth Input + Deferred Local Save + Async Cloud Build */
(() => {
  "use strict";

  const VERSION = "2026-08-13-bigcards-v429-smooth-input-deferred-save-async-cloud";
  const SAVE_KEY = "jk-games-bigcards-kl-v332";
  const CLOUD_SAVE_COLLECTION = "bigCardsSaves";
  const CLOUD_SCHEMA_VERSION = 394;
  const CLOUD_MIN_SCHEMA_VERSION = 354;
  const CLOUD_CHUNK_CHARS = 180000;
  const CLOUD_CHUNK_MAX_BYTES = 700000;
  const CLOUD_CHUNK_TARGET_BYTES = 480000;
  const CLOUD_BUCKET_FORMAT = "bucket-v370";
  const CLOUD_LEGACY_BUCKET_FORMAT = "bucket-v368";
  const CLOUD_INSTANCE_BUCKETS = 48;
  const CLOUD_COLLECTION_BUCKETS = 12;
  const CLOUD_BUCKET_CHUNKS = 1 + CLOUD_INSTANCE_BUCKETS + CLOUD_COLLECTION_BUCKETS;
  const LOCAL_DB_NAME = "jk-games-bigcards-kl-cache";
  const LOCAL_DB_VERSION = 1;
  const LOCAL_DB_STORE = "saves";
  const LOCAL_SAVE_DELAY_MS = 8000;
  const LOCAL_SAVE_MAX_WAIT_MS = 180000;
  const CLOUD_MAX_CHUNKS = 512;
  // V402: Cloud-Chunks werden in stabilen 12er-Gruppen parallel gelesen.
  // Das ist schneller als der alte 6er-Weg, ohne den riskanten V401-IN-Query-Pfad.
  const CLOUD_SAFE_READ_BATCH = 12;
  // V387: Große Sammlungen bleiben lokal sofort sicher, während Firestore bewusst
  // ruhiger synchronisiert. Das verhindert eine überfüllte Write-Queue bei Auto-Opener
  // und sehr großen Kartenbeständen.
  const CLOUD_SAVE_DELAY_MS = 900000;
  const CLOUD_PASSIVE_SAVE_DELAY_MS = 1800000;
  const CLOUD_PROFILE_SAVE_INTERVAL_MS = 7200000;
  const CLOUD_RESOURCE_BACKOFF_MS = 3600000;
  const CLOUD_POLL_MS = 45000;
  // V407: kompakte Karten-Buckets + gebündelte Firestore-Batches reduzieren die Anzahl der Writes massiv.
  // So liegen nie dutzende Einzel-Writes gleichzeitig im SDK-Write-Stream.
  const CLOUD_WRITE_BATCH_SIZE = 8;
  const CLOUD_WRITE_BATCH_PAUSE_MS = 7000;
  const PROFILE_COLLECTION = "bigCardsProfiles";
  const MARKET_COLLECTION = "bigCardsMarket";
  const MARKET_STATS_COLLECTION = "bigCardsMarketStats";
  const WEEKLY_BOSS_COLLECTION = "bigCardsWeeklyBoss";
  const PAYOUT_COLLECTION = "bigCardsPayouts";
  const ONLINE_QUEUE_COLLECTION = "bigCardsOnlineQueue";
  const ONLINE_MATCH_COLLECTION = "bigCardsOnlineMatches";
  const ONLINE_POLL_MS = 1800;
  const ONLINE_QUEUE_STALE_MS = 60000;
  const ONLINE_DISCONNECT_MS = 90000;
  const ONLINE_HEARTBEAT_MS = 30000;
  const MARKET_FEE = 0.05;
  const MARKET_MERCHANT_REFRESH_MS = 20 * 60 * 1000;
  const MARKET_MERCHANT_MIN_LISTINGS = 12;
  const MARKET_MERCHANT_MAX_LISTINGS = 16;
  const MARKET_MERCHANT_NAMES = Object.freeze([
    "NovaTrade","IronLedger","CardHarbor","RoyalDeck","NightMarket","AtlasCards",
    "CrownExchange","PixelTrader","VaultSeven","ArcaneShop","DeckForge","StarMerchant"
  ]);
  const MAX_OFFLINE_MS = 4 * 60 * 60 * 1000;
  const OFFLINE_RATE = 0.35;
  const BULK_LEVEL_ACCESS_MS = 24 * 60 * 60 * 1000;
  const JK_VIP_CLICK_DURATION_MS = 60 * 60 * 1000;
  const JK_BOSS_DAMAGE_DURATION_MS = 60 * 60 * 1000;
  const AUTO_OPENER_HOUR_MS = 60 * 60 * 1000;
  const AUTO_OPENER_MAX_LANES = 4;

  // V392 – die fünf neuen Langzeitsysteme arbeiten bewusst mit kleinen, gedeckelten
  // Boni. Sie schaffen zusätzliche Entscheidungen, ohne das normale Pack-/Kampfsystem
  // durch passive Multiplikatoren zu ersetzen.
  const EXPEDITION_DURATIONS = Object.freeze([
    Object.freeze({minutes:10,label:"10 Min.",eff:.12,icon:"⚡"}),
    Object.freeze({minutes:60,label:"1 Stunde",eff:.16,icon:"🧭"}),
    Object.freeze({minutes:360,label:"6 Stunden",eff:.20,icon:"🌙"})
  ]);
  const EXPEDITION_TYPES = Object.freeze([
    Object.freeze({id:"training",name:"Trainingslager",icon:"🏕️",desc:"Points + BigCards-XP",pointFactor:1,xpFactor:.70,dustFactor:.10,auraFactor:0,cosmeticFactor:0}),
    Object.freeze({id:"ruins",name:"Verlassene Ruinen",icon:"🏛️",desc:"Aura-Material + etwas Points",pointFactor:.48,xpFactor:.20,dustFactor:.10,auraFactor:1,cosmeticFactor:.05}),
    Object.freeze({id:"rift",name:"Dimensionsriss",icon:"🌀",desc:"Fusionsstaub + Katalysator-Chance",pointFactor:.28,xpFactor:.15,dustFactor:1,auraFactor:.08,cosmeticFactor:.05}),
    Object.freeze({id:"treasure",name:"Schatzsuche",icon:"🗺️",desc:"Kosmetikfragmente + Rahmenfunde",pointFactor:.18,xpFactor:.10,dustFactor:.10,auraFactor:.05,cosmeticFactor:1}),
    Object.freeze({id:"set",name:"Set-Suche",icon:"🧩",desc:"Set-XP + rotierender Wochenbonus",pointFactor:.36,xpFactor:.25,dustFactor:.25,auraFactor:.20,cosmeticFactor:.25})
  ]);
  const FUSION_DUST_BASE = 80;
  const FUSION_HOLO_DUPES = 8;
  const FUSION_PRISM_DUPES = 20;
  const FUSION_POINT_MULT = Object.freeze({normal:1,holo:1.02,prismatic:1.04});
  const FUSION_BOSS_MULT = Object.freeze({normal:1,holo:1.02,prismatic:1.04});
  const SET_REQUIREMENT_RARITIES = Object.freeze([0,0,1,2,2,3,3,4,6,10]);
  const BOSS_VARIANTS = Object.freeze([
    Object.freeze({id:"ancient-dragon",name:"Ancient Dragon King",icon:"🐉",tags:["dragon","fire","medieval"],theme:"Flammenpanzer"}),
    Object.freeze({id:"void-emperor",name:"Void Emperor",icon:"🌑",tags:["shadow","galaxy","magic"],theme:"Leeren-Schild"}),
    Object.freeze({id:"royal-colossus",name:"Royal Colossus",icon:"🏰",tags:["royal","medieval","warrior"],theme:"Königliche Rüstung"}),
    Object.freeze({id:"frost-beast",name:"Frost Beast Prime",icon:"❄️",tags:["ice","beast","magic"],theme:"Eiskern"}),
    Object.freeze({id:"blood-phoenix",name:"Blood Phoenix",icon:"🩸",tags:["blood","fire","beast"],theme:"Blutflamme"}),
    Object.freeze({id:"celestial-warden",name:"Celestial Warden",icon:"🌌",tags:["galaxy","royal","magic"],theme:"Sternenwall"})
  ]);

  const RARITIES = Object.freeze([
    // V410: Packpreise folgen der neuen langsameren Point-Wirtschaft.
    // min/max bleiben absichtlich als alter XP-Referenzwert erhalten, damit XP unverändert bleibt.
    {id:"common",name:"Gewöhnlich",symbol:"⚪",price:5000,jk:5,min:1,max:25},
    {id:"uncommon",name:"Ungewöhnlich",symbol:"🟢",price:15000,jk:10,min:10,max:80},
    {id:"rare",name:"Selten",symbol:"🔵",price:50000,jk:18,min:50,max:350},
    {id:"epic",name:"Episch",symbol:"🟣",price:150000,jk:30,min:250,max:1500},
    {id:"legendary",name:"Legendär",symbol:"🟠",price:450000,jk:50,min:1000,max:8000},
    {id:"special",name:"Special",symbol:"🔴",price:1200000,jk:80,min:5000,max:50000},
    {id:"mythic",name:"Mythisch",symbol:"🟡",price:3000000,jk:120,min:25000,max:250000},
    {id:"exotic",name:"Exotisch",symbol:"🩵",price:8000000,jk:200,min:100000,max:2500000},
    {id:"universe",name:"Universe",symbol:"🌌",price:20000000,jk:400,min:1000000,max:20000000},
    {id:"blackhole",name:"Black Hole",symbol:"⚫",price:50000000,jk:750,min:10000000,max:100000000},
    {id:"galaxy",name:"Galaxy",symbol:"🌠",price:120000000,jk:1200,min:50000000,max:300000000},
    {id:"cosmic",name:"Kosmisch",symbol:"🔥",price:280000000,jk:1800,min:100000000,max:650000000},
    {id:"godly",name:"Göttlich",symbol:"👑",price:650000000,jk:2500,min:250000000,max:454545454}
  ]);
  const POINT_RARITY_CURVE = Object.freeze([
    {min:40,max:65},{min:70,max:115},{min:130,max:215},{min:250,max:410},{min:470,max:760},
    {min:850,max:1400},{min:1500,max:2500},{min:2700,max:4500},{min:4700,max:7800},
    {min:7500,max:12500},{min:12000,max:19500},{min:18500,max:30000},{min:28000,max:45000}
  ]);
  // V418: XP besitzt jetzt eine eigene, deutlich flachere Kurve.
  // Sie hängt NICHT mehr an den alten riesigen Raritäts-Pointwerten.
  const XP_RARITY_CURVE = Object.freeze([
    {min:1.0,max:1.5},{min:1.4,max:2.2},{min:2.0,max:3.2},{min:2.8,max:4.5},{min:4.0,max:6.2},
    {min:5.6,max:8.5},{min:7.8,max:12.0},{min:10.5,max:16.0},{min:14.0,max:21.0},
    {min:18.0,max:27.0},{min:23.0,max:34.0},{min:29.0,max:43.0},{min:36.0,max:52.0}
  ]);
  const XP_LEVEL_MULT = Object.freeze([1,1,1.07,1.15,1.25,1.35]);
  const XP_CARD_REBIRTH_MULT = Object.freeze([1,1.10,1.21,1.33,1.46,1.60]);
  const HYPER_XP_GENERATION_MULT = Object.freeze([1,.22,.28,.36,.48]);
  const RARITY_INDEX = Object.freeze(Object.fromEntries(RARITIES.map((r,i)=>[r.id,i])));

  // V344: Reparatur-Kits sind Verbrauchsitems. Normale Kits steigen mit der
  // Kartenrarität stark im Preis; Exclusive besitzt ein eigenes, mit dem
  // aktuellen Account-Kampfbereich skalierendes Reparatur-Siegel.
  const REPAIR_KITS = Object.freeze([
    {id:"common",name:"Gewöhnliches Reparatur-Kit",icon:"🧰",price:1000},
    {id:"uncommon",name:"Ungewöhnliches Reparatur-Kit",icon:"🧰",price:4000},
    {id:"rare",name:"Seltenes Reparatur-Kit",icon:"🛠️",price:15000},
    {id:"epic",name:"Episches Reparatur-Kit",icon:"🛠️",price:50000},
    {id:"legendary",name:"Legendäres Reparatur-Kit",icon:"⚒️",price:150000},
    {id:"special",name:"Special Reparatur-Kit",icon:"⚒️",price:400000},
    {id:"mythic",name:"Mythisches Reparatur-Kit",icon:"🔧",price:1000000},
    {id:"exotic",name:"Exotisches Reparatur-Kit",icon:"🔧",price:3000000},
    {id:"universe",name:"Universe Reparatur-Kit",icon:"🌌",price:8000000},
    {id:"blackhole",name:"Black-Hole Reparatur-Kit",icon:"⚫",price:20000000},
    {id:"galaxy",name:"Galaxy Reparatur-Kit",icon:"🌠",price:50000000},
    {id:"cosmic",name:"Kosmisches Reparatur-Kit",icon:"🔥",price:120000000},
    {id:"godly",name:"Göttliches Reparatur-Kit",icon:"👑",price:300000000},
    {id:"exclusive",name:"Exclusive Reparatur-Siegel",icon:"🩸",price:0,exclusive:true},
    {id:"wins",name:"Wins Reparatur-Pack",icon:"🏆",price:0,wins:true},
    {id:"vip",name:"VIP Reparatur-Kit",icon:"💎",price:0,vip:true},
    {id:"hyper",name:"Hyper Reparatur-Kern",icon:"⚡",price:0,hyper:true}
  ]);
  const REPAIR_KIT_BY_ID = Object.freeze(Object.fromEntries(REPAIR_KITS.map(k=>[k.id,k])));

  // V346: Kampfkarten können für genau einen Kampf einen Trank vorbereiten.
  // Jede Rarität besitzt dieselben fünf Trankarten; höhere Raritäten verstärken
  // denselben Effekt prozentual stärker. Ein ausgerüsteter Trank wird beim
  // nächsten gestarteten Kartenkampf verbraucht.
  const POTION_TYPES = Object.freeze([
    {id:"life",name:"Lebens-Trank",icon:"❤️",desc:"Erhöht das maximale Leben für einen Kampf.",priceMult:.35},
    {id:"power",name:"Kraft-Trank",icon:"💪",desc:"Erhöht deinen verursachten Schaden für einen Kampf.",priceMult:.50},
    {id:"guard",name:"Schutz-Trank",icon:"🛡️",desc:"Verringert erlittenen Schaden für einen Kampf.",priceMult:.65},
    {id:"xp",name:"XP-Trank",icon:"✨",desc:"Erhöht die BigCards-XP-Belohnung des nächsten Kartenkampfs.",priceMult:.42},
    {id:"points",name:"Point-Trank",icon:"💰",desc:"Erhöht die Points-Belohnung des nächsten Kartenkampfs.",priceMult:.46}
  ]);

  // V347: Spuren sind ein eigenes Ausrüstungssystem für genau die Karte, die im
  // neuen Tab „Karte“ als persönliche Karte ausgewählt wurde. Es gibt bewusst
  // keine Exclusive-Spur. Jede Spur kann auf jede Kartenrarität gelegt werden.
  // Die Spur bleibt an der Karteninstanz gespeichert, ihre Werte wirken jedoch
  // nur solange genau diese Karte im persönlichen Karten-Slot ausgewählt ist.
  const TRAILS = Object.freeze([
    {id:"common",name:"Gewöhnliche Spur",icon:"〰️",pointPrice:5000,jk:25,levelReq:1,unlockCost:0,points:.03,xp:.03,damage:.04,hp:.04},
    {id:"uncommon",name:"Ungewöhnliche Spur",icon:"🍃",pointPrice:20000,jk:50,levelReq:5,unlockCost:50000,points:.05,xp:.05,damage:.07,hp:.06},
    {id:"rare",name:"Seltene Spur",icon:"💧",pointPrice:75000,jk:90,levelReq:10,unlockCost:250000,points:.08,xp:.08,damage:.11,hp:.09},
    {id:"epic",name:"Epische Spur",icon:"🔮",pointPrice:200000,jk:150,levelReq:15,unlockCost:1000000,points:.12,xp:.12,damage:.16,hp:.13},
    {id:"legendary",name:"Legendäre Spur",icon:"✨",pointPrice:500000,jk:250,levelReq:20,unlockCost:4000000,points:.16,xp:.16,damage:.22,hp:.18},
    {id:"special",name:"Special Spur",icon:"🔻",pointPrice:1200000,jk:400,levelReq:25,unlockCost:12000000,points:.2,xp:.2,damage:.30,hp:.24},
    {id:"mythic",name:"Mythische Spur",icon:"🌟",pointPrice:3000000,jk:650,levelReq:30,unlockCost:35000000,points:.25,xp:.25,damage:.40,hp:.32},
    {id:"exotic",name:"Exotische Spur",icon:"💠",pointPrice:8000000,jk:1000,levelReq:40,unlockCost:90000000,points:.3,xp:.3,damage:.52,hp:.42},
    {id:"universe",name:"Universe Spur",icon:"🌌",pointPrice:20000000,jk:1500,levelReq:50,unlockCost:250000000,points:.35,xp:.35,damage:.66,hp:.54},
    {id:"blackhole",name:"Black Hole Spur",icon:"⚫",pointPrice:50000000,jk:2200,levelReq:60,unlockCost:650000000,points:.4,xp:.4,damage:.82,hp:.68},
    {id:"galaxy",name:"Galaxy Spur",icon:"🌠",pointPrice:120000000,jk:3200,levelReq:75,unlockCost:1500000000,points:.45,xp:.45,damage:1.00,hp:.85},
    {id:"cosmic",name:"Kosmische Spur",icon:"🔥",pointPrice:280000000,jk:4500,levelReq:90,unlockCost:3500000000,points:.5,xp:.5,damage:1.22,hp:1.05},
    {id:"godly",name:"Göttliche Spur",icon:"👑",pointPrice:650000000,jk:6500,levelReq:100,unlockCost:8000000000,points:.6,xp:.6,damage:1.50,hp:1.30}
  ].map((x,index)=>Object.freeze({...x,index})));
  const TRAIL_BY_ID = Object.freeze(Object.fromEntries(TRAILS.map(x=>[x.id,x])));

  // V397: Der persönliche Karten-Slot sammelt Points deutlich langsamer voll.
  // Die XP-Limits bleiben unverändert; nur die Point-Speicher wurden verkleinert,
  // damit hohe Karten nicht in wenigen Augenblicken zig Millionen AFK-Points bunkern.
  const FEATURED_STORAGE_TIERS = Object.freeze([
    Object.freeze({tier:0,name:"Standard",points:250_000,xp:50_000,jk:0}),
    Object.freeze({tier:1,name:"5-Mio.-Speicher",points:5_000_000,xp:150_000,jk:1000}),
    Object.freeze({tier:2,name:"25-Mio.-Speicher",points:25_000_000,xp:500_000,jk:5000}),
    Object.freeze({tier:3,name:"250-Mio.-Speicher",points:250_000_000,xp:1_000_000,jk:10000})
  ]);

  // V357: Karten-Ranks sind jetzt eine echte Meisterschaft der persönlichen Karte.
  // Kartenlevel und Rank laufen getrennt: Das Level wird beim Rank-Up NICHT mehr zurückgesetzt.
  // Meisterschaft gibt es nur durch Siege mit genau dieser persönlichen Karte. Je stärker
  // der Gegner, desto mehr Meisterschaftspunkte; Siege gegen stärkere Gegner zählen zusätzlich
  // als Elite-Siege. Rank-Meilensteine geben eigene Perks und weiterhin Gratis-Speicher.
  const FEATURED_RANKS = Object.freeze([
    Object.freeze({rank:0,title:"Unranked",mastery:0,elite:0,levelReq:1,bonus:0,storageTier:0,backupTier:-1,perk:"Noch keine Rank-Boni"}),
    Object.freeze({rank:1,title:"Anwärter",mastery:20,elite:0,levelReq:2,bonus:.02,storageTier:1,backupTier:0,perk:"5-Mio.-Speicher gratis"}),
    Object.freeze({rank:2,title:"Kämpfer",mastery:55,elite:0,levelReq:2,bonus:.04,storageTier:1,backupTier:1,perk:"Kampf-Tränke +5 % Wirkung"}),
    Object.freeze({rank:3,title:"Veteran",mastery:105,elite:2,levelReq:3,bonus:.06,storageTier:1,backupTier:2,perk:"Special-Attacken +5 % Schaden"}),
    Object.freeze({rank:4,title:"Elite",mastery:175,elite:4,levelReq:3,bonus:.08,storageTier:1,backupTier:3,perk:"Kampfbelohnungen +5 %"}),
    Object.freeze({rank:5,title:"Champion",mastery:270,elite:8,levelReq:4,bonus:.10,storageTier:2,backupTier:4,perk:"25-Mio.-Speicher gratis"}),
    Object.freeze({rank:6,title:"Meister",mastery:390,elite:12,levelReq:4,bonus:.12,storageTier:2,backupTier:5,perk:"5 % weniger erlittener Kampfschaden"}),
    Object.freeze({rank:7,title:"Großmeister",mastery:545,elite:18,levelReq:5,bonus:.14,storageTier:2,backupTier:6,perk:"Kampf-Tränke insgesamt +10 % Wirkung"}),
    Object.freeze({rank:8,title:"Titan",mastery:745,elite:25,levelReq:5,bonus:.16,storageTier:2,backupTier:8,perk:"Special-Attacken insgesamt +10 % Schaden"}),
    Object.freeze({rank:9,title:"Legende",mastery:995,elite:35,levelReq:5,bonus:.18,storageTier:2,backupTier:11,perk:"Kampfbelohnungen insgesamt +10 %"}),
    Object.freeze({rank:10,title:"Apex",mastery:1350,elite:50,levelReq:5,bonus:.25,storageTier:3,backupTier:12,perk:"250-Mio.-Speicher + Apex-Bonus + 10 % Schadensreduktion"})
  ]);
  const FEATURED_RANK_MAX = 10;

  const DROP_TABLES = Object.freeze({
    common:[[0,82],[1,13],[2,4],[3,1]],
    uncommon:[[0,25],[1,58],[2,13],[3,3.5],[4,.5]],
    rare:[[0,5],[1,20],[2,58],[3,13],[4,3.5],[5,.5]],
    epic:[[1,5],[2,20],[3,58],[4,13],[5,3.5],[6,.5]],
    legendary:[[2,5],[3,20],[4,58],[5,13],[6,3.5],[7,.5]],
    special:[[3,5],[4,20],[5,59],[6,12],[7,4]],
    mythic:[[4,5],[5,20],[6,60],[7,15]],
    exotic:[[6,10],[7,78],[8,9],[9,2],[10,.8],[11,.2]],
    universe:[[6,3],[7,12],[8,68],[9,12],[10,4],[11,1]],
    blackhole:[[7,4],[8,12],[9,67],[10,12],[11,5]],
    galaxy:[[6,2],[7,4],[8,8],[9,14],[10,67],[11,5]],
    cosmic:[[6,1],[7,2],[8,4],[9,8],[10,14],[11,70.5],[12,.5]],
    godly:[[7,3],[8,5],[9,8],[10,12],[11,22],[12,50]]
  });
  const LEVEL_MULT = Object.freeze([1,1,1.18,1.42,1.75,2.15]);
  const DUPE_COST = Object.freeze([0,0,2,5,12,25]);
  // V371: Jede konkrete Karteninstanz kann nach Level 5 bis zu fünf eigene
  // Karten-Rebirths durchlaufen. Der angezeigte Rebirth-Faktor ist ein BONUS
  // auf den normalen 1,0-Grundwert: RB ×1 = insgesamt ×2, RB ×1,5 = ×2,5 usw.
  // Der Sammlungs-Score bleibt über highestLevel dauerhaft auf Level-5-Stand.
  const CARD_REBIRTH_MAX = 5;
  const CARD_REBIRTH_BONUS = Object.freeze([0,1,1.5,2,2.5,3]);
  const POINT_CARD_REBIRTH_MULT = Object.freeze([1,1.30,1.65,2.05,2.50,3.00]);
  const POINT_FLOOR_MULT = Object.freeze([1,1.20,1.45,1.75]);
  const JK_BOOST_DURATION_MS = 15 * 60 * 1000;

  const AURAS = Object.freeze([
    {id:"basic",name:"Basic Aura",mult:1.05,icon:"✦"},{id:"rare",name:"Rare Aura",mult:1.08,icon:"✧"},
    {id:"epic",name:"Epic Aura",mult:1.12,icon:"✹"},{id:"legendary",name:"Legendary Aura",mult:1.16,icon:"✺"},
    {id:"mythic",name:"Mythic Aura",mult:1.20,icon:"✷"},{id:"exotic",name:"Exotic Aura",mult:1.25,icon:"◈"},
    {id:"universe",name:"Universe Aura",mult:1.30,icon:"✵"},{id:"blackhole",name:"Black Hole Aura",mult:1.35,icon:"◉"},
    {id:"galaxy",name:"Galaxy Aura",mult:1.40,icon:"✯"},{id:"cosmic",name:"Cosmic Aura",mult:1.50,icon:"☼"}
  ]);
  const COMBAT_AURAS = Object.freeze([
    {id:"basic",name:"Basic Kampf Aura",mult:1.08,icon:"⚔"},{id:"rare",name:"Rare Kampf Aura",mult:1.16,icon:"🗡"},
    {id:"epic",name:"Epic Kampf Aura",mult:1.28,icon:"⚔"},{id:"legendary",name:"Legendary Kampf Aura",mult:1.42,icon:"🛡"},
    {id:"mythic",name:"Mythic Kampf Aura",mult:1.60,icon:"🔱"},{id:"exotic",name:"Exotic Kampf Aura",mult:1.85,icon:"💠"},
    {id:"universe",name:"Universe Kampf Aura",mult:2.15,icon:"🌌"},{id:"blackhole",name:"Black Hole Kampf Aura",mult:2.50,icon:"⚫"},
    {id:"galaxy",name:"Galaxy Kampf Aura",mult:2.90,icon:"🌠"},{id:"cosmic",name:"Cosmic Kampf Aura",mult:3.50,icon:"🔥"}
  ]);
  const COMBAT_RANGES = Object.freeze([
    {min:5,max:12},{min:10,max:24},{min:20,max:45},{min:40,max:90},{min:80,max:180},
    {min:150,max:320},{min:300,max:650},{min:600,max:1300},{min:1200,max:2600},{min:2500,max:5200},
    {min:5000,max:10500},{min:10000,max:22000},{min:22000,max:50000}
  ]);
  const COMBAT_LEVEL_MULT = Object.freeze([1,1,1.24,1.52,1.90,2.35]);
  // Kartenkampf-Fortschritt: Jede Stufe muss mit Siegen auf der aktuell höchsten
  // freigeschalteten Kampfrarität verdient und anschließend mit Points gekauft werden.
  // Index = aktuell freigeschaltete höchste Kampfrarität; unlock = nächste Rarität.
  const BATTLE_UPGRADES = Object.freeze([
    {unlock:1,wins:10,cost:50000},
    {unlock:2,wins:20,cost:180000},
    {unlock:3,wins:30,cost:600000},
    {unlock:4,wins:45,cost:1800000},
    {unlock:5,wins:65,cost:5400000},
    {unlock:6,wins:90,cost:14400000},
    {unlock:7,wins:125,cost:36000000},
    {unlock:8,wins:175,cost:96000000},
    {unlock:9,wins:240,cost:240000000},
    {unlock:10,wins:325,cost:600000000},
    {unlock:11,wins:425,cost:1440000000},
    {unlock:12,wins:550,cost:3360000000}
  ]);
  const BINDS = Object.freeze([
    {id:"fire",name:"Feuerbindung",mult:1.06,icon:"🔥"},{id:"poison",name:"Giftbindung",mult:1.10,icon:"☣"},
    {id:"ice",name:"Eisbindung",mult:1.14,icon:"❄"},{id:"water",name:"Wasserbindung",mult:1.18,icon:"💧"},
    {id:"hell",name:"Höllenbindung",mult:1.23,icon:"♨"},{id:"angel",name:"Engelsbindung",mult:1.29,icon:"🪽"},
    {id:"wizard",name:"Magierbindung",mult:1.35,icon:"🔮"}
  ]);

  // V350: Jede Aura, Kampf-Aura und Bindung ist im normalen BigCards-Shop mit
  // Points kaufbar. Zusätzlich gibt es pro Stufe einen einmaligen kostenlosen
  // Freischaltweg über echten Spielfortschritt. Kaufen überspringt das Ziel nicht,
  // sondern ist eine alternative Beschaffung; die Gratis-Belohnung kann später
  // trotzdem noch einmal verdient werden.
  const EQUIPMENT_POINT_PRICES = Object.freeze({
    aura:Object.freeze({basic:10000,rare:40000,epic:150000,legendary:500000,mythic:1500000,exotic:5000000,universe:15000000,blackhole:45000000,galaxy:120000000,cosmic:300000000}),
    combatAura:Object.freeze({basic:20000,rare:80000,epic:300000,legendary:1000000,mythic:3000000,exotic:10000000,universe:30000000,blackhole:90000000,galaxy:240000000,cosmic:600000000}),
    bind:Object.freeze({fire:50000,poison:200000,ice:800000,water:3000000,hell:12000000,angel:50000000,wizard:200000000})
  });

  const EXCLUSIVES = Object.freeze([
    {id:"blood-initiate",name:"BLOOD INITIATE",rarityValue:100,chance:32.49,strength:.80},
    {id:"crimson-familiar",name:"CRIMSON FAMILIAR",rarityValue:80,chance:25,strength:.90},
    {id:"nightfang-stalker",name:"NIGHTFANG STALKER",rarityValue:60,chance:17,strength:1.00},
    {id:"bloodmoon-countess",name:"BLOODMOON COUNTESS",rarityValue:40,chance:10,strength:1.10},
    {id:"sanguine-reaper",name:"SANGUINE REAPER",rarityValue:20,chance:6,strength:1.25},
    {id:"nosferatu-warden",name:"NOSFERATU WARDEN",rarityValue:10,chance:3.5,strength:1.40},
    {id:"vampyr-blood-prince",name:"VAMPYR BLOOD PRINCE",rarityValue:8,chance:2.5,strength:1.50},
    {id:"crimson-archduke",name:"CRIMSON ARCHDUKE",rarityValue:5,chance:2,strength:1.60},
    {id:"blood-eclipse",name:"BLOOD ECLIPSE",rarityValue:1,chance:.9,strength:1.90},
    {id:"throne-of-night",name:"THRONE OF NIGHT",rarityValue:.5,chance:.5,strength:2.20},
    {id:"blood-sovereign",name:"THE BLOOD SOVEREIGN",rarityValue:.1,chance:.1,strength:2.75},
    {id:"eternal-blood-emperor",name:"THE ETERNAL BLOOD EMPEROR",rarityValue:.01,chance:.01,strength:3.75}
  ]);

  // V376: Permanentes VIP-Programm. Die 100 VIP-Karten sind ein eigener
  // Bonus-Pool und zählen absichtlich nicht zum bisherigen 100%-Sammlungs-Score.
  // Ihre Raritäten folgen der normalen Pack-Progression; sie können ausschließlich
  // über den VIP-Klicker erspielt werden.
  const VIP_CARD_PREFIXES = Object.freeze(["Royal","Neon","Crimson","Aether","Void","Solar","Lunar","Prism","Titan","Crown"]);
  const VIP_CARD_TITLES = Object.freeze(["Warden","Hunter","Knight","Oracle","Reaper","Dragon","Valkyrie","Phantom","Emperor","Ascendant"]);
  // V381: VIP-Raritäten fallen strikt monoton ab. Das verhindert den alten Fehler,
  // bei dem z. B. Universe-/Black-Hole-VIP-Karten mit 20–30 % angezeigt wurden.
  // Die Gewichte gelten innerhalb eines VIP-Karten-Drops; der normale/boss VIP-Drop
  // selbst bleibt separat selten. Noch nicht regulär erreichbare Raritäten werden entfernt.
  const VIP_RARITY_WEIGHTS = Object.freeze([58,22,10,5,2.5,1.2,.6,.3,.15,.07,.035,.015,.005]);
  const VIP_RARITY_DISPLAY = Object.freeze([12,6,3,1.5,.75,.35,.16,.08,.04,.02,.01,.005,.001]);
  const VIP_CARDS = Object.freeze(VIP_CARD_PREFIXES.flatMap((pre,a)=>VIP_CARD_TITLES.map((title,b)=>`${pre} ${title}`)).map((name,i)=>{
    const rarity=Math.min(12,Math.floor(i*13/100)),slot=i%8;
    return Object.freeze({id:`vip-${String(i+1).padStart(3,"0")}`,name:`VIP ${name}`,rarity,rarityValue:VIP_RARITY_DISPLAY[rarity],powerFactor:1.00+slot*.009});
  }));

  // V406: Hyper-Karten sind ein eigener, rein kampforientierter Endgame-Pool.
  // Jede der 16 Karten startet in Generation 1 und kann mit Rank, Karten-Rebirth,
  // Wins, Fusionsstaub und Hyper-Kernen bis Generation 4 entwickelt werden.
  const HYPER_TIER_META = Object.freeze([
    Object.freeze({id:"basic",name:"Hyper Basic",icon:"⚡",rarity:4}),
    Object.freeze({id:"rare",name:"Hyper Rare",icon:"🔷",rarity:5}),
    Object.freeze({id:"elite",name:"Hyper Elite",icon:"🌀",rarity:6}),
    Object.freeze({id:"apex",name:"Hyper Apex",icon:"💠",rarity:7}),
    Object.freeze({id:"myth",name:"Hyper Myth",icon:"🌌",rarity:8}),
    Object.freeze({id:"omega",name:"Hyper Omega",icon:"Ω",rarity:9}),
    Object.freeze({id:"prime",name:"Hyper Prime",icon:"👑",rarity:10})
  ]);
  const HYPER_CARD_ROWS = Object.freeze([
    ["hyperwolf-initiate","HYPERWOLF INITIATE",0,11.25,1.00],
    ["riftclaw","RIFTCLAW",0,11.25,1.03],
    ["stormpelt","STORMPELT",0,11.25,1.06],
    ["astral-fang","ASTRAL FANG",0,11.25,1.09],
    ["hyperwolf-vanguard","HYPERWOLF VANGUARD",1,8.333333,1.13],
    ["ion-howl","ION HOWL",1,8.333333,1.16],
    ["aether-hunter","AETHER HUNTER",1,8.333334,1.19],
    ["nova-claw","NOVA CLAW",2,5.00,1.24],
    ["hyperwolf-ascendant","HYPERWOLF ASCENDANT",2,5.00,1.28],
    ["voidstorm","VOIDSTORM",2,5.00,1.32],
    ["celestial-ravager","CELESTIAL RAVAGER",3,4.00,1.38],
    ["rift-sovereign","RIFT SOVEREIGN",3,4.00,1.43],
    ["hyperwolf-prime","HYPERWOLF PRIME",4,2.50,1.49],
    ["omega-fenrir","OMEGA FENRIR",4,2.50,1.55],
    ["apex-godfang","APEX GODFANG",5,1.90,1.64],
    ["godbreaker-wolf","GODBREAKER WOLF",6,.10,1.78]
  ]);
  const HYPER_CARDS = Object.freeze(HYPER_CARD_ROWS.map(([id,name,tier,chance,powerFactor],i)=>{
    const t=HYPER_TIER_META[tier]||HYPER_TIER_META[0];
    return Object.freeze({id,name,tier,tierId:t.id,tierName:t.name,icon:t.icon,rarity:t.rarity,chance,rarityValue:chance,powerFactor,base:(i*31+87)%500});
  }));
  const HYPER_CARD_BY_ID = Object.freeze(Object.fromEntries(HYPER_CARDS.map(x=>[x.id,x])));
  const HYPER_GENERATION_MAX = 4;
  const HYPER_JK_PRICE = 800;
  const HYPER_GENERATION_COSTS = Object.freeze({
    2:Object.freeze({rebirth:1,rank:3,wins:40,dust:150,cores:0}),
    3:Object.freeze({rebirth:3,rank:6,wins:120,dust:450,cores:1}),
    4:Object.freeze({rebirth:5,rank:10,wins:300,dust:1200,cores:3})
  });
  const HYPER_GENERATION_COMBAT_MULT = Object.freeze([1,1,1.22,1.55,2.10]);
  const HYPER_GENERATION_PRODUCTION_MULT = Object.freeze([1,.30,.45,.70,1.10]);
  const HYPER_CORE_CRAFT_WINS = 75;
  const HYPER_CORE_CRAFT_DUST = 750;
  const HYPER_CORE_PACK_CHANCE = .05;
  const HYPER_ART = Object.freeze([
    "",
    "assets/bigcards/hyper/hyper-wolf-gen-1.webp",
    "assets/bigcards/hyper/hyper-wolf-gen-2.webp",
    "assets/bigcards/hyper/hyper-wolf-gen-3.webp",
    "assets/bigcards/hyper/hyper-wolf-gen-4.webp"
  ]);

  // V393: Kartenkampf-Wins sind eine knappe, vollständig erspielbare Währung.
  // Der Bestand ist bewusst gedeckelt, damit lange Siegesserien nicht zu absurden
  // Millionenwerten führen. Rebirth und fünf eigene Wins-Packs verbrauchen Wins.
  const WIN_CAP = 999;
  const WIN_PACK_COSTS = Object.freeze([12,22,38,65,100]);
  const REBIRTH_POINT_COSTS = Object.freeze([60000,180000,600000,1800000,5400000,14400000,36000000,96000000,240000000,600000000,1440000000,3360000000,7800000000]);
  const REBIRTH_WIN_COSTS = Object.freeze([5,8,12,18,25,35,50,70,95,125,160,210,275]);
  const PREMIUM_V393_STRENGTH = 1.10;

  const WIN_PACK_DEFS = Object.freeze([
    Object.freeze({id:"wins-1",name:"WINS PACK I",floor:1,cost:WIN_PACK_COSTS[0],icon:"🏅",rarities:[18,14,10,8]}),
    Object.freeze({id:"wins-2",name:"WINS PACK II",floor:1,cost:WIN_PACK_COSTS[1],icon:"🥈",rarities:[8,8,12,10,8,4]}),
    Object.freeze({id:"wins-3",name:"WINS PACK III",floor:2,cost:WIN_PACK_COSTS[2],icon:"🥇",rarities:[4,4,5,6,8,9,8,6]}),
    Object.freeze({id:"wins-4",name:"WINS PACK IV",floor:3,cost:WIN_PACK_COSTS[3],icon:"🏆",rarities:[2,2,2,2,4,5,6,8,7,6,4,2]}),
    Object.freeze({id:"wins-5",name:"WINS PACK V",floor:4,cost:WIN_PACK_COSTS[4],icon:"👑",rarities:[1,1,1,1,2,2,3,4,6,7,8,7,7]})
  ]);
  const WIN_CARD_PREFIXES = Object.freeze(["Victory","Triumph","Crown","Arena","Champion","Valor","Glory","Streak","Conqueror","Master"]);
  const WIN_CARD_TITLES = Object.freeze(["Vanguard","Hunter","Knight","Dragon","Ascendant"]);
  const VIP_SPECIAL_ATTACKS = Object.freeze(RARITIES.map((r,i)=>Object.freeze({
    id:`vip-special-${r.id}`,rarity:i,name:["Kronenstoß","Neon-Klinge","Saphir-Salve","Arkaner Riss","Legendärer Impuls","Roter Brecher","Mythischer Speer","Exotic Nova","Universe Ray","Singularitätsbruch","Galaxy Storm","Cosmic Rupture","Göttliches Urteil"][i],
    icon:["👊","✨","🔷","🔮","⚡","🔴","🔱","💠","🌌","⚫","🌠","🔥","👑"][i],mult:2+i*.48,cost:Math.round(80*Math.pow(1.85,i)),charge:Math.max(3,9-Math.floor(i/2))
  })));
  const VIP_WHEEL_REWARDS = Object.freeze([
    Object.freeze({id:"xp",icon:"✨",label:"2× XP",weight:25,desc:"Verdoppelt BigCards-XP bis zum nächsten täglichen VIP-Spin."}),
    Object.freeze({id:"damage",icon:"⚔️",label:"2× Kraft",weight:20,desc:"Verdoppelt deinen Karten-Kampfschaden bis zum nächsten täglichen VIP-Spin."}),
    Object.freeze({id:"points",icon:"💰",label:"2× Points",weight:20,desc:"Verdoppelt eingesammelte und verdiente direkte Points bis zum nächsten täglichen VIP-Spin."}),
    Object.freeze({id:"production",icon:"🏭",label:"2× Produktion",weight:25,desc:"Verdoppelt Stockwerk- und persönliche Kartenproduktion bis zum nächsten täglichen VIP-Spin."}),
    Object.freeze({id:"clicks",icon:"👆",label:"2× VIP-Klicks",weight:10,desc:"Jeder Klick im VIP-Klicker zählt doppelt bis zum nächsten täglichen VIP-Spin."})
  ]);

  const PREFIXES = Object.freeze(["","Iron","Shadow","Storm","Frost","Flame","Void","Crystal","Cyber","Ancient","Royal","Phantom","Solar","Lunar","Toxic","Arcane","Titan","Neon","Infernal","Celestial"]);
  const MOTIFS = Object.freeze(["Viking","Samurai","Knight","Dragon","Wolf","Raven","Phoenix","Golem","Hunter","Assassin","Guardian","Sorcerer","Reaper","Colossus","Valkyrie","Ronin","Warden","Berserker","Nomad","Pirate","Gladiator","Monk","Ranger","Engineer","Beast"]);
  const BASE_NAMES = Object.freeze(PREFIXES.flatMap(prefix=>MOTIFS.map(motif=>prefix?`${prefix} ${motif}`:motif)));
  const WIN_PACKS = Object.freeze(WIN_PACK_DEFS.map((def,packIndex)=>{
    const rarities=[];def.rarities.forEach((count,rarity)=>{for(let i=0;i<count;i++)rarities.push(rarity)});
    while(rarities.length<50)rarities.push(Math.min(12,packIndex*2+3));rarities.length=50;
    // Die 50. Karte jedes Packs besitzt exakt 0,01 % Packchance. Die restlichen
    // 99,99 % werden so verteilt, dass die gewünschte Schwerpunkt-Rarität dominiert,
    // niedrigere Karten aber weiterhin möglich bleiben.
    const focus=[2,4,6,9,11][packIndex],raw=rarities.map((rarity,i)=>i===49?0:Math.max(.08,1.8-Math.abs(rarity-focus)*.22));
    const rawTotal=raw.reduce((a,b)=>a+b,0)||1;
    const names=WIN_CARD_PREFIXES.flatMap(pre=>WIN_CARD_TITLES.map(title=>`${pre} ${title}`));
    const cards=names.slice(0,50).map((name,i)=>Object.freeze({
      id:`win-${packIndex+1}-${String(i+1).padStart(2,"0")}`,
      name:`${def.name.replace("WINS PACK ","")} · ${name}`,
      packIndex,
      rarity:i===49?Math.min(12,Math.max(rarities[i],focus+1)):Math.min(12,Math.max(0,Number(rarities[i])||0)),
      chance:i===49?.01:Number((raw[i]/rawTotal*99.99).toFixed(5)),
      base:(packIndex*97+i*11)%BASE_NAMES.length,
      powerFactor:1.04+packIndex*.02+(i===49?.08:0)
    }));
    return Object.freeze({...def,cards:Object.freeze(cards)});
  }));
  const WIN_CARDS = Object.freeze(WIN_PACKS.flatMap(pack=>pack.cards));
  const WIN_CARD_BY_ID = Object.freeze(Object.fromEntries(WIN_CARDS.map(card=>[card.id,card])));


  // V397: Die 20 bisherigen Sets bleiben die normalen Sets. Zusätzlich gibt es
  // 10 bewusst schwere Crazy Sets mit Karten von Special bis Göttlich sowie
  // Exclusive-, Wins- und VIP-Karten. Normale Set-Karten bleiben untereinander
  // eindeutig; Crazy Sets besitzen ebenfalls eigene Karten-Slots.
  const SET_BLUEPRINTS = Object.freeze([
    {id:"dragon",name:"Dragon",icon:"🐉",cards:["Dragon","Iron Dragon","Shadow Dragon","Storm Dragon","Frost Dragon","Flame Dragon","Ancient Dragon","Royal Dragon","Celestial Dragon","Void Dragon"]},
    {id:"blood",name:"Blood",icon:"🩸",cards:["Reaper","Toxic Raven","Shadow Reaper","Infernal Hunter","Toxic Sorcerer","Infernal Knight","Royal Reaper","Arcane Reaper","Celestial Reaper","Toxic Reaper"]},
    {id:"medieval",name:"Medieval",icon:"🏰",cards:["Viking","Knight","Iron Viking","Iron Knight","Royal Viking","Royal Knight","Ancient Viking","Ancient Knight","Titan Gladiator","Celestial Valkyrie"]},
    {id:"galaxy",name:"Galaxy",icon:"🌌",cards:["Raven","Lunar Ranger","Solar Hunter","Void Sorcerer","Celestial Warden","Solar Phoenix","Lunar Valkyrie","Void Colossus","Celestial Sorcerer","Celestial Monk"]},
    {id:"shadow",name:"Shadow",icon:"🌑",cards:["Assassin","Shadow Raven","Shadow Hunter","Shadow Knight","Void Assassin","Phantom Reaper","Shadow Sorcerer","Void Warden","Infernal Reaper","Shadow Berserker"]},
    {id:"royal",name:"Royal",icon:"👑",cards:["Royal Guardian","Royal Samurai","Royal Warden","Royal Colossus","Royal Valkyrie","Royal Sorcerer","Royal Hunter","Royal Monk","Royal Ranger","Royal Berserker"]},
    {id:"beast",name:"Beast",icon:"🐺",cards:["Wolf","Beast","Iron Wolf","Storm Beast","Frost Wolf","Flame Beast","Ancient Beast","Titan Wolf","Infernal Beast","Celestial Nomad"]},
    {id:"fire",name:"Fire",icon:"🔥",cards:["Phoenix","Flame Viking","Flame Wolf","Flame Phoenix","Infernal Samurai","Infernal Berserker","Flame Colossus","Infernal Phoenix","Solar Samurai","Flame Gladiator"]},
    {id:"ice",name:"Ice",icon:"❄️",cards:["Frost Viking","Crystal Ranger","Frost Raven","Crystal Knight","Frost Sorcerer","Crystal Golem","Frost Warden","Lunar Nomad","Celestial Ranger","Frost Monk"]},
    {id:"magic",name:"Magic",icon:"🔮",cards:["Sorcerer","Golem","Arcane Monk","Crystal Sorcerer","Arcane Golem","Lunar Sorcerer","Ancient Sorcerer","Arcane Warden","Phantom Sorcerer","Toxic Golem"]},
    {id:"warrior",name:"Warrior",icon:"⚔️",cards:["Gladiator","Berserker","Ronin","Iron Samurai","Storm Knight","Titan Viking","Ancient Gladiator","Phantom Ronin","Infernal Gladiator","Celestial Samurai"]},
    {id:"hyper",name:"Hyper",icon:"⚡",cards:[]},
    {id:"cyber",name:"Cyber",icon:"🤖",cards:["Engineer","Cyber Engineer","Iron Engineer","Crystal Engineer","Neon Engineer","Titan Engineer","Arcane Engineer","Solar Engineer","Void Engineer","Celestial Engineer"]},
    {id:"hunter",name:"Hunter",icon:"🏹",cards:["Hunter","Iron Hunter","Storm Hunter","Frost Hunter","Flame Hunter","Ancient Hunter","Phantom Hunter","Neon Hunter","Titan Hunter","Celestial Hunter"]},
    {id:"phantom",name:"Phantom",icon:"👻",cards:["Phantom Viking","Phantom Samurai","Phantom Knight","Phantom Wolf","Phantom Raven","Phantom Phoenix","Phantom Guardian","Phantom Monk","Phantom Valkyrie","Phantom Warden"]},
    {id:"toxic",name:"Toxic",icon:"☣️",cards:["Toxic Viking","Toxic Samurai","Toxic Knight","Toxic Wolf","Toxic Phoenix","Toxic Assassin","Toxic Guardian","Toxic Warden","Toxic Ranger","Toxic Beast"]},
    {id:"neon",name:"Neon",icon:"💡",cards:["Neon Viking","Neon Samurai","Neon Knight","Neon Dragon","Neon Wolf","Neon Raven","Neon Phoenix","Neon Guardian","Neon Sorcerer","Neon Valkyrie"]},
    {id:"ancient",name:"Ancient",icon:"🗿",cards:["Ancient Samurai","Ancient Wolf","Ancient Raven","Ancient Phoenix","Ancient Golem","Ancient Assassin","Ancient Guardian","Ancient Warden","Ancient Berserker","Ancient Monk"]},
    {id:"celestial",name:"Celestial",icon:"🌟",cards:["Celestial Viking","Celestial Knight","Celestial Wolf","Celestial Raven","Celestial Phoenix","Celestial Golem","Celestial Assassin","Celestial Guardian","Celestial Berserker","Celestial Ronin"]},
    {id:"arcane",name:"Arcane",icon:"🪄",cards:["Arcane Viking","Arcane Samurai","Arcane Knight","Arcane Wolf","Arcane Raven","Arcane Phoenix","Arcane Assassin","Arcane Guardian","Arcane Ranger","Arcane Berserker"]}
  ].map(def=>{
    if(def.id==="hyper"){
      const names=HYPER_CARDS.map(x=>x.name);
      const requirements=HYPER_CARDS.map(x=>Object.freeze({kind:"hyper",id:x.id,name:x.name}));
      return Object.freeze({...def,group:"normal",cards:Object.freeze(names),requirements:Object.freeze(requirements)});
    }
    const names=def.cards.slice(0,10);
    const requirements=names.map((name,i)=>({kind:"normal",name,base:BASE_NAMES.indexOf(name),rarity:SET_REQUIREMENT_RARITIES[i]})).filter(x=>x.base>=0);
    return Object.freeze({...def,group:"normal",cards:Object.freeze(names),requirements:Object.freeze(requirements)});
  }));

  const CRAZY_SET_META = Object.freeze([
    ["apocalypse","Apocalypse","☄️"],["void-crown","Void Crown","🕳️"],["divine-hunt","Divine Hunt","🏹"],["nightmare","Nightmare","🌘"],["omega","Omega","Ω"],
    ["blood-throne","Blood Throne","🩸"],["multiverse","Multiverse","🪐"],["eternal","Eternal","♾️"],["chaos","Chaos","🌀"],["impossible","Impossible","💎"]
  ]);
  const CRAZY_SET_BLUEPRINTS = (()=>{
    const used=new Set();
    for(const set of SET_BLUEPRINTS)for(const req of set.requirements)used.add(`normal:${req.rarity}:${req.base}`);
    // Die jeweils seltenste 0,1-%-Schlusskarte jeder normalen Rarität bleibt
    // exklusiv für das große Exklusivitäts-Ziel reserviert und taucht nicht noch
    // einmal in einem normalen oder Crazy Set auf.
    for(let rarity=0;rarity<RARITIES.length;rarity++)used.add(`normal:${rarity}:${BASE_NAMES.length-1}`);
    const rows=CRAZY_SET_META.map(([id,name,icon],setIndex)=>{
      const requirements=[];
      for(let rarity=5;rarity<=12;rarity++){
        let base=(setIndex*53+rarity*31+17)%BASE_NAMES.length,key=`normal:${rarity}:${base}`;
        while(used.has(key)){base=(base+1)%BASE_NAMES.length;key=`normal:${rarity}:${base}`;}
        used.add(key);requirements.push({kind:"normal",name:BASE_NAMES[base],base,rarity});
      }
      const exclusive=EXCLUSIVES[Math.min(EXCLUSIVES.length-2,setIndex+1)];
      const winPack=WIN_PACKS[Math.min(WIN_PACKS.length-1,Math.floor(setIndex/2))],winCard=winPack.cards[44+(setIndex%2)*4];
      const vip=VIP_CARDS[89+setIndex];
      requirements.push({kind:"exclusive",id:exclusive.id,name:exclusive.name});
      requirements.push({kind:"win",id:winCard.id,name:winCard.name});
      requirements.push({kind:"vip",id:vip.id,name:vip.name});
      return Object.freeze({id:`crazy-${id}`,name,icon,group:"crazy",requirements:Object.freeze(requirements)});
    });
    return Object.freeze(rows);
  })();

  const ALL_SET_BLUEPRINTS = Object.freeze([...SET_BLUEPRINTS,...CRAZY_SET_BLUEPRINTS]);
  const SET_BY_ID = Object.freeze(Object.fromEntries(ALL_SET_BLUEPRINTS.map(x=>[x.id,x])));

  // Das eigenständige Exklusivitäts-Set sitzt oberhalb aller Kategorien. Es verlangt
  // die 0,1-%-Schlusskarte jeder normalen Rarität sowie die seltensten Zielkarten
  // aus Exclusive, Wins und VIP. Der Gewinn ist einmalig 5.000 JK/Coin plus ein
  // permanenter globaler ×2-Prestige-Boost auf erspielte Kernbelohnungen.
  const ULTIMATE_SET = Object.freeze({
    id:"exclusivity",name:"Exklusivität",icon:"💠",group:"ultimate",
    requirements:Object.freeze([
      ...RARITIES.map((r,rarity)=>Object.freeze({kind:"normal",name:BASE_NAMES[BASE_NAMES.length-1],base:BASE_NAMES.length-1,rarity})),
      Object.freeze({kind:"exclusive",id:EXCLUSIVES.at(-1).id,name:EXCLUSIVES.at(-1).name}),
      Object.freeze({kind:"win",id:WIN_PACKS.at(-1).cards.at(-1).id,name:WIN_PACKS.at(-1).cards.at(-1).name}),
      Object.freeze({kind:"vip",id:VIP_CARDS.at(-1).id,name:VIP_CARDS.at(-1).name})
    ])
  });

  function setRequirementKey(req){if(!req)return"";if(req.kind==="hyper")return `hyper:${req.id}`;if(req.kind==="exclusive")return `exclusive:${req.id}`;if(req.kind==="vip")return `vip:${req.id}`;if(req.kind==="win")return `win:${req.id}`;return `normal:${Math.floor(req.rarity||0)}:${Math.floor(req.base||0)}`;}
  function setInstanceKey(inst){if(!inst)return"";if(inst.hyper)return `hyper:${inst.hyperId}`;if(inst.exclusive)return `exclusive:${inst.exclusiveId}`;if(inst.vip)return `vip:${inst.vipId}`;if(inst.win)return `win:${inst.winId}`;return `normal:${Math.floor(inst.rarity||0)}:${Math.floor(inst.base||0)}`;}
  const SET_MEMBERSHIP = (()=>{const map=new Map();for(const set of ALL_SET_BLUEPRINTS)for(const req of set.requirements){const key=setRequirementKey(req),arr=map.get(key)||[];arr.push(set.id);map.set(key,arr);}return map;})();

  // Exakt 500 Werte gemäß Masterverteilung. Die Reihenfolge bleibt deterministisch in allen 13 Serien.
  const INTERNAL_VALUES = (()=>{
    const out=[];
    const fill=(count,a,b)=>{for(let i=0;i<count;i++){const t=count<=1?0:i/(count-1);out.push(Number((a+(b-a)*t).toFixed(a<10?2:1)));}};
    fill(50,100,100);fill(90,99,89);fill(90,88,70);fill(90,69,50);fill(80,49,25);fill(50,24,10);fill(30,9.9,2);fill(15,1.9,.5);
    out.push(.4,.4,.3,.2,.1);
    return Object.freeze(out.slice(0,500));
  })();
  const INTERNAL_WEIGHT_SUM = INTERNAL_VALUES.reduce((s,v)=>s+v,0);

  const FLOOR_PHASES = Object.freeze([
    {name:"Einstieg",tiers:[[0,0],[1,1],[2,2],[3,3],[5,4]]},
    {name:"High Tier",tiers:[[0,5],[2,6],[5,7]]},
    {name:"Endgame",tiers:[[0,8],[2,9],[5,10]]},
    {name:"Ultimate",tiers:[[0,11],[5,12]]}
  ]);

  const UI={overlay:null,main:null,phone:null,tab:"field",floor:0,collectionTier:0,collectionPage:0,collectionPageMenu:false,collectionSearch:"",rebirthScoreTier:0,selectedSlot:null,selectedCard:null,packReveal:null,role:"player",market:[],marketStats:{},marketStatsLoaded:false,marketStatsLoading:false,leaderboard:[],battleCard:null,battleResult:null,battleSession:null,battleEnemyTimer:0,onlineStatus:"idle",onlineMode:null,onlineMatchId:null,onlineMatch:null,onlinePollTimer:0,onlineBusy:false,onlineQueueHeartbeat:0,onlineMatchHeartbeat:0,onlineResult:null,boss:null,bossPlayers:[],bossLoading:false,bossTeamLoading:false,setSelected:"dragon",setNormalOpen:true,setCrazyOpen:false,fusionMode:"ready",expeditionPickerSlot:0,lastHeader:0,toastTimer:0,autoNoticeTimer:0,autoNoticeDrag:null,vipWheelSpinning:false,vipWheelRotation:0,vipWheelTargetRotation:0,autoLaneSelected:0,autoLaneResults:{},rarityScroll:0,mainScroll:{},drag:null,suppressClickUntil:0,modLoadToken:0,modInventoryData:null,modInventoryPage:0,modInventorySearch:"",modInventoryLoading:false,modCardsLoading:false,modCardGrantSearch:"",modCardGrantType:"all",modCardGrantSelected:"",smartSetupLoading:false,smartSetupToken:0,packCategory:"all",navCollapsed:false,autoOpenerCollapsed:false,hyperTestConfigs:null,tutorialKey:null,tutorialStep:0,tutorialReturnTab:"field"};
  let S=null,tickTimer=0,cloudSaveTimer=0,cloudSaveDueAt=0,cloudPollTimer=0,autoTimer=0,lastTick=performance.now(),lastPassivePersistAt=0,cloudReady=false,cloudBooting=false,cloudDirty=false,cloudFastDirty=false,cloudSaving=false,cloudMutationCounter=0,cloudLastSaveId="",cloudLastRemoteUpdatedAt=0,cloudLastChunkHashes=[],cloudLastChunkRefs=[],cloudLastProfileWriteAt=0,cloudBackoffUntil=0,cloudUid="",cloudMigrationPending=false,localDbPromise=null,localSaveTimer=0,localSaveIdleHandle=0,localSaveFirstDirtyAt=0,localSaveUser="",localSaveBusy=false,localSaveQueued=false,leaderboardProfileTimer=0,premiumNormalBaseCacheKey="",premiumNormalBaseCacheValue=1,cardPowerRevision=0,vipPopLastAt=0;

  const clamp=(n,a,b)=>Math.min(b,Math.max(a,Number(n)||0));
  const esc=(v)=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
  const fmt=(n)=>{n=Number(n)||0;if(Math.abs(n)<1000)return Math.floor(n).toLocaleString("de-DE");const u=[[1e18,"Qi"],[1e15,"Qa"],[1e12,"Bio"],[1e9,"Mrd"],[1e6,"Mio"],[1e3,"Tsd"]];for(const [v,s] of u)if(Math.abs(n)>=v)return `${(n/v).toLocaleString("de-DE",{maximumFractionDigits:2})} ${s}`;return n.toLocaleString("de-DE")};
  const pct=(n)=>Number(n).toLocaleString("de-DE",{maximumFractionDigits:5})+" %";
  const now=()=>Date.now();
  const uid=()=>`bc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
  function localStateKey(userId=""){return userId?`${SAVE_KEY}:uid:${userId}`:SAVE_KEY;}
  function cloudMetaKey(userId){return `${SAVE_KEY}:cloud-meta:${userId}`;}
  function readStoredJson(key){try{const raw=JSON.parse(localStorage.getItem(key)||"null");return raw&&typeof raw==="object"?raw:null}catch{return null}}
  function openLocalDb(){
    if(localDbPromise)return localDbPromise;
    localDbPromise=new Promise((resolve,reject)=>{
      if(!window.indexedDB)return reject(new Error("IndexedDB nicht verfügbar"));
      const req=indexedDB.open(LOCAL_DB_NAME,LOCAL_DB_VERSION);
      req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(LOCAL_DB_STORE))db.createObjectStore(LOCAL_DB_STORE,{keyPath:"id"});};
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error("IndexedDB konnte nicht geöffnet werden"));
      req.onblocked=()=>reject(new Error("IndexedDB ist blockiert"));
    });
    return localDbPromise;
  }
  function indexedStateId(userId=""){return userId?`uid:${userId}`:"guest";}
  async function readIndexedState(userId=""){
    try{const db=await openLocalDb();return await new Promise((resolve,reject)=>{const tx=db.transaction(LOCAL_DB_STORE,"readonly"),req=tx.objectStore(LOCAL_DB_STORE).get(indexedStateId(userId));req.onsuccess=()=>resolve(req.result?.state||null);req.onerror=()=>reject(req.error);});}catch(e){console.warn("BigCards IndexedDB read",e);return null}
  }
  async function putIndexedState(userId,state){
    const db=await openLocalDb();return await new Promise((resolve,reject)=>{const tx=db.transaction(LOCAL_DB_STORE,"readwrite");tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error||new Error("IndexedDB Schreibfehler"));tx.onabort=()=>reject(tx.error||new Error("IndexedDB Schreiben abgebrochen"));tx.objectStore(LOCAL_DB_STORE).put({id:indexedStateId(userId),updatedAt:Number(state?.updatedAt)||now(),state});});
  }
  function clearLegacyFullCopies(userId=""){try{localStorage.removeItem(SAVE_KEY);if(userId)localStorage.removeItem(localStateKey(userId));}catch{}}
  function cancelLocalIdleFlushV429(){
    if(localSaveTimer){clearTimeout(localSaveTimer);localSaveTimer=0;}
    if(localSaveIdleHandle&&typeof cancelIdleCallback==="function"){try{cancelIdleCallback(localSaveIdleHandle)}catch{}}
    localSaveIdleHandle=0;
  }
  function queueLocalIdleFlushV429(){
    localSaveTimer=0;
    const run=()=>{localSaveIdleHandle=0;void flushLocalState(localSaveUser);};
    if(typeof requestIdleCallback==="function"){
      localSaveIdleHandle=requestIdleCallback(run,{timeout:2200});
    }else{
      localSaveTimer=setTimeout(()=>{localSaveTimer=0;run();},0);
    }
  }
  async function flushLocalState(userId=""){
    if(!S)return false;
    if(localSaveBusy){localSaveQueued=true;return false}
    localSaveBusy=true;cancelLocalIdleFlushV429();
    const target=userId||cloudUid||currentUidSync()||"";let ok=false;
    try{
      // V429: Kein JSON.stringify + JSON.parse des kompletten 100k+-Kartenstands
      // mehr auf dem Main-Thread. IndexedDB klont den Wert beim put() selbst.
      await putIndexedState(target,S);clearLegacyFullCopies(target);ok=true;return true;
    }catch(e){
      console.warn("BigCards IndexedDB local save",e);
      // localStorage bleibt nur ein kleiner Notfall-Fallback. Große Saves werden dort
      // bewusst nicht hineingezwungen.
      try{const json=JSON.stringify(S);if(json.length>1500000){console.warn("BigCards local fallback übersprungen: Spielstand ist zu groß für localStorage.");return false}localStorage.setItem(SAVE_KEY,json);ok=true;return true}catch(fallback){console.warn("BigCards local fallback save",fallback);return false}
    }finally{
      localSaveBusy=false;
      if(ok)localSaveFirstDirtyAt=0;
      if(localSaveQueued){
        localSaveQueued=false;
        if(!localSaveFirstDirtyAt)localSaveFirstDirtyAt=now();
        writeLocalState(target,false);
      }
    }
  }
  function writeLocalState(userId="",immediate=false){
    if(!S)return;
    localSaveUser=userId||cloudUid||currentUidSync()||localSaveUser||"";
    if(immediate){
      cancelLocalIdleFlushV429();localSaveFirstDirtyAt=0;void flushLocalState(localSaveUser);return;
    }
    if(localSaveBusy){localSaveQueued=true;if(!localSaveFirstDirtyAt)localSaveFirstDirtyAt=now();return;}
    const t=now();if(!localSaveFirstDirtyAt)localSaveFirstDirtyAt=t;
    const waited=t-localSaveFirstDirtyAt;
    // Sliding debounce: bei schnellem Klicken/Auto-Opener startet der 8-Sekunden-
    // Countdown immer neu. Dadurch wird nicht mitten im Eingabestrom gespeichert.
    if(waited<LOCAL_SAVE_MAX_WAIT_MS){
      if(localSaveTimer)clearTimeout(localSaveTimer);
      if(localSaveIdleHandle&&typeof cancelIdleCallback==="function"){try{cancelIdleCallback(localSaveIdleHandle)}catch{}localSaveIdleHandle=0;}
      localSaveTimer=setTimeout(queueLocalIdleFlushV429,LOCAL_SAVE_DELAY_MS);
      return;
    }
    // Sicherheitscheckpoint spätestens nach 3 Minuten Daueraktivität.
    // Ist bereits einer geplant, wird er nicht durch weitere Klicks verschoben.
    if(localSaveTimer||localSaveIdleHandle)return;
    localSaveTimer=setTimeout(queueLocalIdleFlushV429,50);
  }
  async function readLocalStateForUser(userId){
    const indexed=await readIndexedState(userId);if(indexed&&typeof indexed==="object")return indexed;
    const scoped=readStoredJson(localStateKey(userId)),global=readStoredJson(SAVE_KEY);
    const legacy=scoped&&global?(Number(scoped.updatedAt||0)>=Number(global.updatedAt||0)?scoped:global):(scoped||global);
    if(legacy){try{await putIndexedState(userId,legacy);clearLegacyFullCopies(userId);}catch(e){console.warn("BigCards legacy cache migration",e)}return legacy;}
    return null;
  }
  function readCloudMeta(userId){return readStoredJson(cloudMetaKey(userId))||{};}
  function writeCloudMeta(userId,data){try{const prev=readCloudMeta(userId);localStorage.setItem(cloudMetaKey(userId),JSON.stringify({...prev,...(data||{})}))}catch{}}
  function backupLocalConflict(userId,raw){if(!raw)return;void putIndexedState(`conflict:${userId}:${now()}`,raw).catch(()=>{});}
  function persist(){if(!S)return;invalidateCollectionRenderCache();S.updatedAt=now();writeLocalState(cloudUid||currentUidSync());cloudDirty=true;cloudFastDirty=true;cloudMutationCounter++;scheduleCloudSave(CLOUD_SAVE_DELAY_MS);}
  function persistPassive(){if(!S)return;S.updatedAt=now();writeLocalState(cloudUid||currentUidSync());cloudDirty=true;cloudMutationCounter++;scheduleCloudSave(CLOUD_PASSIVE_SAVE_DELAY_MS);}
  function defaultState(){return {version:419,points:1000,pendingPoints:0,fieldStoredSeconds:0,level:1,xp:0,totalRebirths:0,phase:0,phaseRebirths:0,unlockedFloors:1,instances:{},floors:Array.from({length:4},()=>Array(10).fill(null)),collection:{},exclusiveCollection:{},vipCollection:{},winCollection:{},hyperCollection:{},hyperCores:0,vipUnlocked:false,vipWheelDay:"",vipWheelReward:"",vipWheelUntil:0,vipClicks:0,vipClickerLevel:1,vipClickerDefeats:0,vipClickerBosses:0,vipClickerEnemy:null,vipClickerSpecialOwned:{},vipClickerSpecialEquipped:null,vipClickerSpecialCharge:0,vipClickerLastReward:null,shards:0,fusionDust:0,auraMaterial:0,cosmeticFragments:0,prismaticCatalysts:0,bossTokens:0,packFragments:0,expeditions:[],bossLoadout:[null,null,null],bossDaily:{day:"",freeUsed:0,bonusTickets:0,packProgress:0,battleProgress:0},bossWeek:{key:"",contribution:0,attacks:0,goal:0,milestones:{},community:{}},bossQualifiedWeeks:0,bossCosmeticPity:0,setMastery:{},setWeekly:{week:"",setId:"",expeditions:0,bossDamage:0,upgrades:0,claimed:{}},ultimateSetClaimed:false,ultimateSetClaimedAt:0,prestigeCount:0,prestigeTokens:0,prestigeLifetimeRebirths:0,prestigeJkEarned:0,prestigeBestJk:0,prestigeHistory:[],prestigeShopOwned:{},prestigePending:null,bestCombatAutoUnlocked:false,uiPrefs:{
showF2PScore:true,showRebirthScore:true,showPayScore:true,showAutoOpenerPanel:true,showAutoOpenerFloating:true,
showCollectionRarityScores:true,showHeaderCollection:true,showPackDescriptions:true,showCollectionCardEffects:true,compactMobile:true,reduceAnimations:false,
autoOpenerStartCollapsed:false
},auraInventory:{},combatAuraInventory:{},bindInventory:{},repairKits:{},potionInventory:{},potionMastery:{},trailInventory:{},trailTierUnlocked:0,equipmentRewards:{},featuredCardId:null,featuredPendingPoints:0,featuredPendingXp:0,featuredStorageTier:0,bulkLevelUnlocked:false,bulkLevelUntil:0,bulkLevelLegacyMigrated:true,bulkRebirthUntil:0,featuredLastAt:now(),jkBoostPointsMultiplier:1,jkBoostPointsUntil:0,jkBoostXpMultiplier:1,jkBoostXpUntil:0,jkBoostDamageBonus:0,jkBoostDamageUntil:0,jkVipClickMultiplier:1,jkVipClickUntil:0,jkBossDamageMultiplier:1,jkBossDamageUntil:0,jkPackCredits:{},exclusiveCredits:0,autoCollectorUntil:0,autoCollectorPointStep:0,autoOpenerUntil:0,autoPack:"common",autoEnabled:false,autoOpenerWorkMs:0,autoOpenerCapacity:0,autoOpenerLanes:Array.from({length:4},()=>({pack:"common",enabled:false})),autoOpenerLastAt:0,autoOpenerSummary:null,winsCurrency:0,battleWins:0,battleLosses:0,battleStreak:0,battleBestStreak:0,battleCooldownUntil:0,battleTierUnlocked:0,battleTierWins:0,battleUpgradeSpent:0,onlineBattleWins:0,onlineBattleLosses:0,onlineRankedWins:0,onlineRankedLosses:0,onlineProcessedMatches:{},onlinePotionConsumedMatches:{},lifetimePointsEarned:0,lifetimeScore:0,maxLevelEver:1,highestProductionEver:0,highestXpProductionEver:0,highestUpgrade:{},shinyMilestones:{},floorScore:{1:true},daily:{day:"",opened:0,upgraded:0,newCards:0,claimed:{}},lastSeen:now(),createdAt:now(),updatedAt:now(),packHistory:[],marketMerchantBought:{}};}

  const BIGCARDS_UI_PREF_DEFAULTS = Object.freeze({
    showF2PScore:true,showRebirthScore:true,showPayScore:true,
    showAutoOpenerPanel:true,showAutoOpenerFloating:true,
    showCollectionRarityScores:true,showHeaderCollection:true,
    showPackDescriptions:true,showCollectionCardEffects:true,compactMobile:true,reduceAnimations:false,
    autoOpenerStartCollapsed:false
  });
  function normalizeUiPrefs(raw){
    const out={...BIGCARDS_UI_PREF_DEFAULTS},src=raw&&typeof raw==="object"?raw:{};
    for(const key of Object.keys(out))if(Object.prototype.hasOwnProperty.call(src,key))out[key]=!!src[key];
    return out;
  }
  function uiPref(key){return S?.uiPrefs?.[key]??BIGCARDS_UI_PREF_DEFAULTS[key]??true;}
  function applyUiPreferenceClasses(){
    const root=UI.overlay;if(!root)return;
    root.classList.toggle("bc-pref-compact-mobile",!!uiPref("compactMobile"));
    root.classList.toggle("bc-pref-reduce-motion",!!uiPref("reduceAnimations"));
    root.classList.toggle("bc-pref-hide-rarity-scores",!uiPref("showCollectionRarityScores"));
    root.classList.toggle("bc-pref-hide-header-collection",!uiPref("showHeaderCollection"));
    root.classList.toggle("bc-pref-hide-pack-descriptions",!uiPref("showPackDescriptions"));
    root.classList.toggle("bc-pref-hide-collection-fx",!uiPref("showCollectionCardEffects"));
    if(!uiPref("showAutoOpenerFloating"))root.querySelector("[data-bc-auto-notice]")?.remove();
  }
  function settingRow(key,title,text){
    return `<label class="bc-setting-row"><div><b>${esc(title)}</b><small>${esc(text)}</small></div><input type="checkbox" data-bc-setting="${key}" ${uiPref(key)?"checked":""}><i aria-hidden="true"></i></label>`;
  }
  function settingsHtml(){
    return `<section class="bc-section bc-settings-page"><div class="bc-section-title"><div><small>BIGCARDS · ANZEIGE & KOMFORT</small><h2>⚙️ Einstellungen</h2><p>Hier bestimmst du selbst, wie viel BigCards auf dem Bildschirm zeigt. Die Einstellungen werden mit deinem BigCards-Spielstand gespeichert.</p></div><button class="bc-info-circle" data-bc-section-info="settings" title="Einstellungen-Info">i</button></div><div class="bc-settings-groups">
      <section><h3>📚 Sammlung & Scores</h3>${settingRow("showF2PScore","Gesamter F2P-Score","Linken Sammlungs-Score anzeigen.")}${settingRow("showRebirthScore","Gesamter Rebirth-Score","Mittleren Rebirth-Score mit Bereichsauswahl anzeigen.")}${settingRow("showPayScore","Gesamter Pay-Score","Exclusive-/VIP-Score anzeigen.")}${settingRow("showCollectionRarityScores","Raritäts-Prozente","Prozentwerte über den einzelnen Raritäts-Tabs anzeigen.")}${settingRow("showHeaderCollection","Sammlung in der Kopfzeile","Sammlungs-Prozentwert oben anzeigen.")}</section>
      <section><h3>📦 Auto-Opener</h3>${settingRow("showAutoOpenerPanel","Auto-Opener-Bereich anzeigen","Das große Bedienfeld bei Packs ein- oder ausblenden. Aktive Kanäle laufen weiter.")}${settingRow("showAutoOpenerFloating","Auto-Opener-Schwebefenster","Das kleine verschiebbare Ergebnisfenster mit neuen Karten/Duplikaten anzeigen.")}${settingRow("autoOpenerStartCollapsed","Beim Öffnen zuklappen","Auto-Opener beim nächsten Öffnen von BigCards kompakt starten.")}</section>
      <section><h3>📱 Darstellung & Leistung</h3>${settingRow("compactMobile","Kompakte Handy-Ansicht","Auf kleinen Displays Abstände und Kartenbereiche enger darstellen.")}${settingRow("showPackDescriptions","Pack-Beschreibungen","Längere Erklärungstexte in Pack-Karten anzeigen.")}${settingRow("showCollectionCardEffects","Zusatz-Effekte in der Sammlung","Aura, Kampf-Aura, Bindung, Spur und Fusion direkt auf Sammlungs-Karten anzeigen. Shiny/Rebirth bleiben als Kartenstatus erhalten.")}${settingRow("reduceAnimations","Karteneffekte & Animationen reduzieren","Alle Designs bleiben sichtbar, aber Rainbow, Shiny, Aura, Hyper- und Übergangseffekte bewegen sich nicht mehr. Gut gegen Lag.")}</section>
    </div><div class="bc-settings-actions"><button data-bc-settings-reset>Standard wiederherstellen</button><button class="secondary" data-bc-online-save>☁ Jetzt online speichern</button></div></section>`;
  }
  function setUiPreference(key,value){
    if(!Object.prototype.hasOwnProperty.call(BIGCARDS_UI_PREF_DEFAULTS,key))return;
    S.uiPrefs=normalizeUiPrefs(S.uiPrefs);S.uiPrefs[key]=!!value;
    if(key==="autoOpenerStartCollapsed")UI.autoOpenerCollapsed=!!value;
    persistPassive();applyUiPreferenceClasses();
    if(["showF2PScore","showRebirthScore","showPayScore","showAutoOpenerPanel"].includes(key)&&["collection","packs"].includes(UI.tab))renderMain();
  }
  function resetUiPreferences(){
    S.uiPrefs={...BIGCARDS_UI_PREF_DEFAULTS};UI.autoOpenerCollapsed=!!S.uiPrefs.autoOpenerStartCollapsed;
    persistPassive();refresh(false);toast("BigCards-Einstellungen auf Standard zurückgesetzt.");
  }

  function normalizeFloorUniqueCards(){
    if(!S?.floors||!S?.instances)return false;let changed=false;
    for(let floor=0;floor<S.floors.length;floor++){
      const row=S.floors[floor],seen=new Map();
      for(let slot=0;slot<row.length;slot++){
        const id=row[slot],inst=instance(id);if(!inst){if(id){row[slot]=null;changed=true}continue;}
        const key=collectionKey(inst);
        if(!seen.has(key)){seen.set(key,{slot,id,inst});continue;}
        const kept=seen.get(key),keptScore=effectivePoints(kept.inst),newScore=effectivePoints(inst);
        if(newScore>keptScore){row[kept.slot]=null;seen.set(key,{slot,id,inst});}else row[slot]=null;
        changed=true;
      }
    }
    return changed;
  }
  function normalizeExpeditionUniqueCards(){
    if(!S?.instances||!Array.isArray(S.expeditions))return false;
    const active=S.expeditions.filter(x=>x&&!x.claimed).slice().sort((a,b)=>(Number(a.startedAt)||0)-(Number(b.startedAt)||0)||(Number(a.slot)||0)-(Number(b.slot)||0));
    const seenTypes=new Set(),cleaned=[];let changed=active.length!==S.expeditions.length;
    for(const ex of active){
      const inst=instance(ex.cardId);if(!inst){changed=true;continue;}
      const key=collectionKey(inst);if(!key||seenTypes.has(key)){changed=true;continue;}
      seenTypes.add(key);
      const baseMinutes=EXPEDITION_DURATIONS.some(d=>d.minutes===Number(ex.minutes))?Number(ex.minutes):Math.max(1,Math.round(Number(ex.actualMinutes)||Number(ex.minutes)||10));
      const startedAt=Math.max(0,Number(ex.startedAt)||now());
      if(Number(ex.actualMinutes)!==baseMinutes||Number(ex.endsAt)!==startedAt+baseMinutes*60000){ex.actualMinutes=baseMinutes;ex.endsAt=startedAt+baseMinutes*60000;changed=true;}
      cleaned.push(ex);
    }
    cleaned.sort((a,b)=>(Number(a.slot)||0)-(Number(b.slot)||0));
    if(cleaned.length!==S.expeditions.length)changed=true;
    S.expeditions=cleaned.slice(0,4);
    return changed;
  }
  const PREMIUM_FIELD_LIMIT = 5;
  function premiumFieldCount(kind,ignoreId="",excludeFloor=-1){
    let count=0;
    for(let floor=0;floor<(S?.floors||[]).length;floor++){
      if(floor===excludeFloor)continue;
      for(const id of S.floors[floor]||[]){
        if(!id||String(id)===String(ignoreId||""))continue;
        const inst=instance(id);
        if(inst&&((kind==="exclusive"&&inst.exclusive)||(kind==="vip"&&inst.vip)))count++;
      }
    }
    return count;
  }
  function normalizeExclusiveFloorRestriction(){
    if(!S?.floors||!S?.instances)return false;let changed=false;
    // Exclusive: nur Stockwerk 1. VIP: nur Stockwerk 1–2.
    for(let floor=0;floor<S.floors.length;floor++){
      const row=S.floors[floor];if(!Array.isArray(row))continue;
      for(let slot=0;slot<row.length;slot++){
        const id=row[slot],inst=instance(id);
        if(inst&&((inst.exclusive&&floor>=1)||(inst.vip&&floor>=2))){row[slot]=null;changed=true;}
      }
    }
    // Zusätzlich dürfen accountweit höchstens 5 Exclusive und 5 VIP im Produktionsfeld liegen.
    // Bei alten Spielständen bleiben automatisch die fünf produktionsstärksten Exemplare aktiv.
    for(const kind of ["exclusive","vip"]){
      const placed=[];
      for(let floor=0;floor<S.floors.length;floor++)for(let slot=0;slot<(S.floors[floor]||[]).length;slot++){
        const id=S.floors[floor][slot],inst=instance(id);
        if(inst&&((kind==="exclusive"&&inst.exclusive)||(kind==="vip"&&inst.vip)))placed.push({floor,slot,id,score:effectivePoints(inst)});
      }
      placed.sort((a,b)=>b.score-a.score||a.floor-b.floor||a.slot-b.slot);
      for(const row of placed.slice(PREMIUM_FIELD_LIMIT)){S.floors[row.floor][row.slot]=null;changed=true;}
    }
    return changed;
  }
  function normalizeFeaturedCombatFieldRestriction(){
    if(!S?.floors||!S?.instances)return false;const protectedIds=new Set();if(S.featuredCardId)protectedIds.add(String(S.featuredCardId));const main=S.featuredCardId?S.instances[S.featuredCardId]:null;if(main?.backupCardId)protectedIds.add(String(main.backupCardId));if(!protectedIds.size)return false;let changed=false;for(const row of S.floors){if(!Array.isArray(row))continue;for(let i=0;i<row.length;i++){if(row[i]&&protectedIds.has(String(row[i]))){row[i]=null;changed=true;}}}return changed;
  }
  function adoptState(raw,{saveLocal=false,userId=""}={}){invalidateCollectionRenderCache();
    const incomingVersion=Math.max(0,Math.floor(Number(raw?.version)||0));
    const rawHadBulkMigrationFlag=!!(raw&&typeof raw==="object"&&Object.prototype.hasOwnProperty.call(raw,"bulkLevelLegacyMigrated"));
    S=raw&&typeof raw==="object"?Object.assign(defaultState(),raw):defaultState();cardPowerRevision++;premiumNormalBaseCacheKey="";premiumNormalBaseCacheValue=1;
    S.instances||={};S.collection||={};S.exclusiveCollection||={};S.vipCollection||={};S.winCollection||={};S.hyperCollection||={};S.hyperCores=Math.max(0,Math.floor(Number(S.hyperCores)||0));S.vipClickerSpecialOwned||={};S.auraInventory||={};S.combatAuraInventory||={};S.bindInventory||={};S.repairKits||={};S.potionInventory||={};S.potionMastery||={};S.trailInventory||={};S.equipmentRewards||={};
    S.expeditions=Array.isArray(S.expeditions)?S.expeditions.slice(0,4):[];S.bossLoadout=Array.isArray(S.bossLoadout)?S.bossLoadout.slice(0,3):[null,null,null];while(S.bossLoadout.length<3)S.bossLoadout.push(null);
    S.fusionDust=Math.max(0,Math.floor(Number(S.fusionDust)||0));S.auraMaterial=Math.max(0,Math.floor(Number(S.auraMaterial)||0));S.cosmeticFragments=Math.max(0,Math.floor(Number(S.cosmeticFragments)||0));S.prismaticCatalysts=Math.max(0,Math.floor(Number(S.prismaticCatalysts)||0));S.bossTokens=Math.max(0,Math.floor(Number(S.bossTokens)||0));S.packFragments=Math.max(0,Math.floor(Number(S.packFragments)||0));
    S.bossDaily=S.bossDaily&&typeof S.bossDaily==="object"?S.bossDaily:{day:"",freeUsed:0,bonusTickets:0,packProgress:0,battleProgress:0};S.bossWeek=S.bossWeek&&typeof S.bossWeek==="object"?S.bossWeek:{key:"",contribution:0,attacks:0,goal:0,milestones:{},community:{}};S.bossWeek.milestones=S.bossWeek.milestones||{};S.bossWeek.community=S.bossWeek.community||{};S.setMastery=S.setMastery&&typeof S.setMastery==="object"?S.setMastery:{};S.setWeekly=S.setWeekly&&typeof S.setWeekly==="object"?S.setWeekly:{week:"",setId:"",expeditions:0,bossDamage:0,upgrades:0,claimed:{}};S.setWeekly.claimed=S.setWeekly.claimed||{};S.ultimateSetClaimed=!!S.ultimateSetClaimed;S.ultimateSetClaimedAt=Math.max(0,Number(S.ultimateSetClaimedAt)||0);
    S.prestigeCount=Math.max(0,Math.floor(Number(S.prestigeCount)||0));S.prestigeTokens=Math.max(0,Math.floor(Number(S.prestigeTokens)||0));S.prestigeLifetimeRebirths=Math.max(0,Math.floor(Number(S.prestigeLifetimeRebirths)||0));S.prestigeJkEarned=Math.max(0,Math.floor(Number(S.prestigeJkEarned)||0));S.prestigeBestJk=Math.max(0,Math.floor(Number(S.prestigeBestJk)||0));S.prestigeHistory=Array.isArray(S.prestigeHistory)?S.prestigeHistory.slice(-30):[];S.prestigeShopOwned=S.prestigeShopOwned&&typeof S.prestigeShopOwned==="object"?S.prestigeShopOwned:{};S.prestigePending=S.prestigePending&&typeof S.prestigePending==="object"?S.prestigePending:null;S.bestCombatAutoUnlocked=!!S.bestCombatAutoUnlocked;S.uiPrefs=normalizeUiPrefs(S.uiPrefs);if(bestCombatEntitled())S.bestCombatAutoUnlocked=true;
    const legacyBulkLevelOwned=!!S.bulkLevelUnlocked,legacyBulkPurchase=(()=>{try{return Number(window.JKCoinApp?.coinState?.()?.gamePurchases?.["bigcards-bulk-level-unlock"]||0)>0;}catch{return false;}})();let bulkLevelMigrated=false;
    S.bulkLevelUntil=Math.max(0,Number(S.bulkLevelUntil)||0);
    if(!rawHadBulkMigrationFlag){const legacyPaid=legacyBulkLevelOwned||legacyBulkPurchase;S.bulkLevelLegacyMigrated=!legacyPaid;bulkLevelMigrated=legacyPaid;}
    if((legacyBulkLevelOwned||legacyBulkPurchase)&&!S.bulkLevelLegacyMigrated){S.bulkLevelUntil=Math.max(S.bulkLevelUntil,now()+BULK_LEVEL_ACCESS_MS);S.bulkLevelLegacyMigrated=true;bulkLevelMigrated=true;}
    S.bulkLevelUnlocked=false;
    S.bulkRebirthUntil=Math.max(0,Number(S.bulkRebirthUntil)||0);
    const potionInventoryMigrated=normalizePotionInventory(),potionMasteryMigrated=normalizePotionMastery();let potionQueueMigrated=false;
    if(S.daily?.claimed?.new)S.equipmentRewards[equipmentRewardKey("aura","basic")]=true;
    if((Number(S.battleWins)||0)>0)S.equipmentRewards[equipmentRewardKey("combatAura","basic")]=true;
    S.trailTierUnlocked=clamp(Math.floor(Number(S.trailTierUnlocked)||0),0,TRAILS.length-1);
    S.featuredStorageTier=clamp(Math.floor(Number(S.featuredStorageTier)||0),0,FEATURED_STORAGE_TIERS.length-1);
    S.featuredPendingPoints=Math.max(0,Number(S.featuredPendingPoints)||0);S.featuredPendingXp=Math.max(0,Number(S.featuredPendingXp)||0);S.featuredLastAt=Math.max(0,Number(S.featuredLastAt)||now());
    S.vipUnlocked=!!S.vipUnlocked;S.vipWheelDay=String(S.vipWheelDay||"");S.vipWheelReward=VIP_WHEEL_REWARDS.some(x=>x.id===S.vipWheelReward)?S.vipWheelReward:"";S.vipWheelUntil=Math.max(0,Number(S.vipWheelUntil)||0);S.vipClicks=Math.max(0,Math.floor(Number(S.vipClicks)||0));S.vipClickerLevel=clamp(Math.floor(Number(S.vipClickerLevel)||1),1,100);S.vipClickerDefeats=Math.max(0,Math.floor(Number(S.vipClickerDefeats)||0));S.vipClickerBosses=Math.max(0,Math.floor(Number(S.vipClickerBosses)||0));S.vipClickerSpecialCharge=Math.max(0,Math.floor(Number(S.vipClickerSpecialCharge)||0));S.vipClickerSpecialEquipped=VIP_SPECIAL_ATTACKS.some(x=>x.id===S.vipClickerSpecialEquipped)?S.vipClickerSpecialEquipped:null;if(S.vipClickerEnemy&&typeof S.vipClickerEnemy!=="object")S.vipClickerEnemy=null;if(incomingVersion<398)S.vipClickerEnemy=null;
    S.fieldStoredSeconds=Math.max(0,Number(S.fieldStoredSeconds)||0);
    S.jkBoostPointsMultiplier=[2,4,6,8,10].includes(Number(S.jkBoostPointsMultiplier))?Number(S.jkBoostPointsMultiplier):1;S.jkBoostPointsUntil=Math.max(0,Number(S.jkBoostPointsUntil)||0);
    S.jkBoostXpMultiplier=[2,4,6,8,10].includes(Number(S.jkBoostXpMultiplier))?Number(S.jkBoostXpMultiplier):1;S.jkBoostXpUntil=Math.max(0,Number(S.jkBoostXpUntil)||0);
    S.jkBoostDamageBonus=[.2,.4,.6,.8,1].includes(Number(S.jkBoostDamageBonus))?Number(S.jkBoostDamageBonus):0;S.jkBoostDamageUntil=Math.max(0,Number(S.jkBoostDamageUntil)||0);
    S.jkVipClickMultiplier=[2,4,6,8,10].includes(Number(S.jkVipClickMultiplier))?Number(S.jkVipClickMultiplier):1;S.jkVipClickUntil=Math.max(0,Number(S.jkVipClickUntil)||0);S.jkBossDamageMultiplier=Number(S.jkBossDamageMultiplier)===2?2:1;S.jkBossDamageUntil=Math.max(0,Number(S.jkBossDamageUntil)||0);
    const legacyAutoRemaining=Math.max(0,(Number(S.autoOpenerUntil)||0)-now());S.autoOpenerWorkMs=Math.max(0,Number(S.autoOpenerWorkMs)||0)+(incomingVersion<398?legacyAutoRemaining:0);S.autoOpenerCapacity=clamp(Math.floor(Number(S.autoOpenerCapacity)||0),0,AUTO_OPENER_MAX_LANES);if(incomingVersion<398&&legacyAutoRemaining>0)S.autoOpenerCapacity=Math.max(1,S.autoOpenerCapacity);S.autoOpenerLanes=Array.isArray(S.autoOpenerLanes)?S.autoOpenerLanes.slice(0,AUTO_OPENER_MAX_LANES):[];while(S.autoOpenerLanes.length<AUTO_OPENER_MAX_LANES)S.autoOpenerLanes.push({pack:"common",enabled:false});S.autoOpenerLanes=S.autoOpenerLanes.map((lane,i)=>({pack:RARITY_INDEX[String(lane?.pack||S.autoPack||"common")]!==undefined?String(lane?.pack||S.autoPack||"common"):"common",enabled:i<S.autoOpenerCapacity&&!!(lane?.enabled||(incomingVersion<398&&i===0&&S.autoEnabled))}));S.autoOpenerLastAt=Math.max(0,Number(S.autoOpenerLastAt)||0);S.autoOpenerSummary=S.autoOpenerSummary&&typeof S.autoOpenerSummary==="object"?S.autoOpenerSummary:null;S.autoOpenerUntil=0;S.autoEnabled=false;
    S.winsCurrency=clamp(Math.floor(Number(S.winsCurrency)||0),0,WIN_CAP);S.battleWins=Math.max(0,Math.floor(Number(S.battleWins)||0));S.battleLosses=Math.max(0,Math.floor(Number(S.battleLosses)||0));S.battleStreak=Math.max(0,Math.floor(Number(S.battleStreak)||0));S.battleBestStreak=Math.max(S.battleStreak,Math.floor(Number(S.battleBestStreak)||0));S.battleCooldownUntil=Math.max(0,Number(S.battleCooldownUntil)||0);S.battleTierUnlocked=clamp(Math.floor(Number(S.battleTierUnlocked)||0),0,RARITIES.length-1);S.battleTierWins=Math.max(0,Math.floor(Number(S.battleTierWins)||0));S.battleUpgradeSpent=Math.max(0,Number(S.battleUpgradeSpent)||0);S.autoCollectorPointStep=Math.max(0,Math.floor(Number(S.autoCollectorPointStep)||0));if((Number(S.autoCollectorUntil)||0)<=now())S.autoCollectorPointStep=0;
    S.onlineBattleWins=Math.max(0,Math.floor(Number(S.onlineBattleWins)||0));S.onlineBattleLosses=Math.max(0,Math.floor(Number(S.onlineBattleLosses)||0));S.onlineRankedWins=Math.max(0,Math.floor(Number(S.onlineRankedWins)||0));S.onlineRankedLosses=Math.max(0,Math.floor(Number(S.onlineRankedLosses)||0));S.onlineProcessedMatches=S.onlineProcessedMatches&&typeof S.onlineProcessedMatches==="object"?S.onlineProcessedMatches:{};S.onlinePotionConsumedMatches=S.onlinePotionConsumedMatches&&typeof S.onlinePotionConsumedMatches==="object"?S.onlinePotionConsumedMatches:{};
    S.marketMerchantBought=S.marketMerchantBought&&typeof S.marketMerchantBought==="object"?S.marketMerchantBought:{};for(const [key,at] of Object.entries(S.marketMerchantBought)){if(!Number(at)||Number(at)<now()-48*60*60*1000)delete S.marketMerchantBought[key];}
    for(const inst of Object.values(S.instances)){
      if(!inst)continue;
      if(inst.hyper===undefined)inst.hyper=false;if(inst.hyperId===undefined)inst.hyperId=null;if(inst.hyperGeneration===undefined)inst.hyperGeneration=1;inst.hyperGeneration=clamp(Math.floor(Number(inst.hyperGeneration)||1),1,HYPER_GENERATION_MAX);if(inst.vip===undefined)inst.vip=false;if(inst.vipId===undefined)inst.vipId=null;if(inst.win===undefined)inst.win=false;if(inst.winId===undefined)inst.winId=null;if(inst.winPack===undefined)inst.winPack=null;if(inst.combatAura===undefined)inst.combatAura=null;if(inst.broken===undefined)inst.broken=false;if(inst.brokenAt===undefined)inst.brokenAt=0;if(inst.trail===undefined)inst.trail=null;if(inst.backupCardId===undefined)inst.backupCardId=null;inst.fusion=inst.fusion==="prismatic"?"prismatic":inst.fusion==="holo"?"holo":"normal";
      if(!Array.isArray(inst.battlePotions))inst.battlePotions=[];
      if(inst.battlePotion&&inst.battlePotions.length===0){const old=normalizePotionQueueEntry(inst.battlePotion,inst);if(old){inst.battlePotions=[old];potionQueueMigrated=true;}}
      const normalizedQueue=inst.battlePotions.map(x=>normalizePotionQueueEntry(x,inst)).filter(Boolean).slice(0,3);if(JSON.stringify(normalizedQueue)!==JSON.stringify(inst.battlePotions))potionQueueMigrated=true;inst.battlePotions=normalizedQueue;inst.battlePotion=null;
      inst.cardRebirth=clamp(Math.floor(Number(inst.cardRebirth)||0),0,CARD_REBIRTH_MAX);inst.rank=clamp(Math.floor(Number(inst.rank)||0),0,FEATURED_RANK_MAX);if(inst.rankMastery===undefined)inst.rankMastery=Math.max(0,Math.floor(Number(inst.rankWins)||0))*4;inst.rankMastery=Math.max(0,Math.floor(Number(inst.rankMastery)||0));if(inst.rankEliteWins===undefined)inst.rankEliteWins=0;inst.rankEliteWins=Math.max(0,Math.floor(Number(inst.rankEliteWins)||0));inst.rankWins=0;if(inst.rankedAt===undefined)inst.rankedAt=0;
      const key=collectionKey(inst),col=cardCollectionMap(inst),scoreLevel=inst.cardRebirth>0?5:clamp(Math.floor(Number(inst.level)||1),1,5);col[key]=col[key]||{firstAt:Number(inst.createdAt)||now(),highestLevel:scoreLevel,highestRebirth:0};col[key].highestLevel=Math.max(Number(col[key].highestLevel)||1,scoreLevel);col[key].highestRebirth=Math.max(clamp(Math.floor(Number(col[key].highestRebirth)||0),0,CARD_REBIRTH_MAX),cardRebirth(inst));if(inst.hyper)col[key].highestGeneration=Math.max(clamp(Math.floor(Number(col[key].highestGeneration)||1),1,HYPER_GENERATION_MAX),hyperGeneration(inst));
    }
    S.floors=Array.from({length:4},(_,i)=>Array.isArray(S.floors?.[i])?S.floors[i].slice(0,10).concat(Array(10).fill(null)).slice(0,10):Array(10).fill(null));S.unlockedFloors=clamp(S.unlockedFloors||1,1,4);S.phase=clamp(S.phase||0,0,3);S.phaseRebirths=clamp(S.phaseRebirths||0,0,5);S.level=Math.max(1,Math.floor(S.level||1));
    if(S.featuredCardId&&(!S.instances[S.featuredCardId]||S.instances[S.featuredCardId]?.listed))S.featuredCardId=null;
    for(const inst of Object.values(S.instances)){if(!inst?.backupCardId)continue;const backup=S.instances[inst.backupCardId];if(!backup||backup.id===inst.id||backup.listed)inst.backupCardId=null;}
    const featuredCopyFixed=repairFeaturedIdentityV424();
    if(S.featuredCardId){for(const row of S.floors){const i=row.indexOf(S.featuredCardId);if(i>=0)row[i]=null;}}
    S.version=419;const exclusiveFloorFixed=normalizeExclusiveFloorRestriction();const featuredFieldFixed=normalizeFeaturedCombatFieldRestriction();const repaired=normalizeFloorUniqueCards();const expeditionFixed=normalizeExpeditionUniqueCards();updateFeaturedEarnings(now(),false);if(saveLocal||featuredCopyFixed||exclusiveFloorFixed||featuredFieldFixed||repaired||expeditionFixed||potionInventoryMigrated||potionMasteryMigrated||potionQueueMigrated||bulkLevelMigrated)writeLocalState(userId||cloudUid||currentUidSync());return S;
  }
  function state(){
    if(S)return S;
    return adoptState(readStoredJson(SAVE_KEY),{saveLocal:false});
  }

  function cardRebirth(inst){return clamp(Math.floor(Number(inst?.cardRebirth)||0),0,CARD_REBIRTH_MAX);}
  function cardRebirthBonus(inst){return CARD_REBIRTH_BONUS[cardRebirth(inst)]||0;}
  function cardRebirthTotalMultiplier(inst){return 1+cardRebirthBonus(inst);}
  function cardRebirthClass(inst){const r=cardRebirth(inst);return r?`card-rb-${r}`:"";}
  function cardRebirthLabel(inst){const r=cardRebirth(inst),combat=cardRebirthTotalMultiplier(inst),points=pointCardRebirthMultiplier(inst);return r?`Rebirth ${r}/${CARD_REBIRTH_MAX} · Points ×${points.toFixed(2).replace(".",",")} · Kampf/XP ×${String(combat).replace(".",",")}`:"Kein Karten-Rebirth";}
  function cardRebirthBadge(inst){const r=cardRebirth(inst);if(!r)return "";const bonus=cardRebirthBonus(inst);return `<span class="bc-card-rebirth-badge rb-${r}" title="${esc(cardRebirthLabel(inst))}">↻${r} · ×${String(bonus).replace(".",",")}</span>`;}
  function activeTimedBoost(mult,until,base=1){return Number(until)>now()?Number(mult)||base:base;}
  function pointsBoosterMultiplier(){return activeTimedBoost(S?.jkBoostPointsMultiplier,S?.jkBoostPointsUntil,1);}
  function xpBoosterMultiplier(){return activeTimedBoost(S?.jkBoostXpMultiplier,S?.jkBoostXpUntil,1);}
  function damageBoosterMultiplier(){return 1+(Number(S?.jkBoostDamageUntil)>now()?Math.max(0,Number(S?.jkBoostDamageBonus)||0):0);}
  function jkBoosterState(kind){
    if(kind==="points"){const active=Number(S?.jkBoostPointsUntil)>now();return {kind,active,value:active?Number(S.jkBoostPointsMultiplier)||1:1,until:active?Number(S.jkBoostPointsUntil):0,max:10};}
    if(kind==="xp"){const active=Number(S?.jkBoostXpUntil)>now();return {kind,active,value:active?Number(S.jkBoostXpMultiplier)||1:1,until:active?Number(S.jkBoostXpUntil):0,max:10};}
    const active=Number(S?.jkBoostDamageUntil)>now();return {kind:"damage",active,value:active?Math.max(0,Number(S.jkBoostDamageBonus)||0):0,until:active?Number(S.jkBoostDamageUntil):0,max:1};
  }

  function nextLocalDayReset(){const d=new Date();d.setHours(24,0,0,0);return d.getTime();}
  function vipWheelActive(kind){return !!S?.vipUnlocked&&S.vipWheelReward===kind&&Number(S.vipWheelUntil)>now();}
  function vipWheelMultiplier(kind){return vipWheelActive(kind)?2:1;}
  function vipWheelRewardMeta(){return VIP_WHEEL_REWARDS.find(x=>x.id===S?.vipWheelReward)||null;}
  function vipWheelAvailable(){return !!S?.vipUnlocked&&String(S.vipWheelDay||"")!==dailyKey();}
  function vipCardBy(id){return VIP_CARDS.find(x=>x.id===id)||null;}
  function vipCount(){return Object.keys(S?.vipCollection||{}).length;}
  function winCount(){return Object.keys(S?.winCollection||{}).length;}
  function winCardBy(id){return WIN_CARD_BY_ID[id]||null;}
  function addWins(amount){const before=Math.max(0,Number(S?.winsCurrency)||0),gain=Math.max(0,Math.floor(Number(amount)||0))*ultimateSetMultiplier();S.winsCurrency=clamp(before+gain,0,WIN_CAP);return Math.max(0,S.winsCurrency-before);}
  function winStreakReward(streak){const n=Math.max(1,Math.floor(Number(streak)||1));return n>=10?5:n>=7?4:n>=5?3:n>=3?2:1;}
  function vipClickerUpgradeCost(level=S?.vipClickerLevel||1){
    const l=clamp(Math.floor(Number(level)||1),1,100),raw=100*Math.pow(1.22,l-1)*(1+l/10),round=raw>=1e12?1e9:raw>=1e9?1e6:raw>=1e6?1e3:raw>=1e4?100:10;
    return Math.max(100,Math.round(raw/round)*round);
  }
  function vipClickerDamage(){const l=clamp(Math.floor(Number(S?.vipClickerLevel)||1),1,100);return Math.max(5,Math.round(5*Math.pow(1.085,l-1)));}
  function vipClickerCritChance(){const l=clamp(Math.floor(Number(S?.vipClickerLevel)||1),1,100);return l>=60?.10:l>=25?.08:.05;}
  function vipClickerVipChance(boss=false){const l=clamp(Math.floor(Number(S?.vipClickerLevel)||1),1,100),growth=l>=20?1.08+Math.max(0,l-20)*.012:1,base=boss?.14:.012;return Math.min(boss?.28:.03,base*growth);}
  function vipUnlockedMaxRarity(){const pack=clamp(rarityUnlockedIndex(),0,RARITIES.length-1),table=DROP_TABLES[RARITIES[pack]?.id]||DROP_TABLES.common;return clamp(Math.max(...table.map(x=>Number(x[0])||0)),0,RARITIES.length-1);}
  function vipClickerEnemyRarityRoll(){const idx=clamp(rarityUnlockedIndex(),0,RARITIES.length-1),table=DROP_TABLES[RARITIES[idx]?.id]||DROP_TABLES.common;return rollWeighted(table);}
  function vipCardRarityRows(){const max=vipUnlockedMaxRarity(),rows=[];for(let i=0;i<=max;i++)rows.push([i,VIP_RARITY_WEIGHTS[i]||0]);return rows.filter(x=>x[1]>0);}
  function vipCardRarityRoll(){return rollWeighted(vipCardRarityRows());}
  function vipCardRarityChances(){const rows=vipCardRarityRows(),total=rows.reduce((n,x)=>n+x[1],0)||1;return rows.map(([rarity,weight])=>({rarity,weight,chance:weight/total*100}));}
  function vipClickerEnemyName(rarity,boss){const pool=BASE_NAMES,base=pool[Math.floor(Math.random()*pool.length)]||"Karte";return `${boss?"VIP BOSS · ":""}${RARITIES[rarity]?.symbol||"⚪"} ${base}`;}
  function makeVipClickerEnemy(boss=false){
    const rarity=vipClickerEnemyRarityRoll(),base=Math.max(5,vipClickerDamage()),progress=1+Math.min(5.5,(Number(S?.vipClickerDefeats)||0)/90),rarityFactor=20+rarity*12+rarity*rarity*2,bossFactor=boss?8:1,maxHp=Math.max(120,Math.round(base*rarityFactor*progress*bossFactor));
    return {id:uid(),rarity,boss:!!boss,name:vipClickerEnemyName(rarity,boss),hp:maxHp,maxHp,spawnedAt:now()};
  }
  function ensureVipClickerEnemy(){if(!S.vipClickerEnemy||Number(S.vipClickerEnemy.hp)<=0)S.vipClickerEnemy=makeVipClickerEnemy(false);return S.vipClickerEnemy;}
  function jkVipClickMultiplier(){return (Number(S?.jkVipClickUntil)||0)>now()?clamp(Number(S?.jkVipClickMultiplier)||1,1,10):1;}
  function vipClickGainMultiplier(){return Math.max(1,Math.round(vipWheelMultiplier("clicks")*jkVipClickMultiplier()));}
  function jkBossDamageMultiplier(){return (Number(S?.jkBossDamageUntil)||0)>now()?2:1;}
  function spawnVipDamagePop(damage,crit=false,special=false){
    const target=UI.overlay?.querySelector("[data-bc-vip-click]");if(!target)return;
    const t=performance.now();
    // Nur die Animation wird begrenzt – Schaden, Klicks und Krits werden weiterhin
    // bei JEDEM echten Klick berechnet. Das verhindert hunderte DOM-Popups gleichzeitig.
    if(!special&&t-vipPopLastAt<38)return;vipPopLastAt=t;
    const existing=target.querySelectorAll(".bc-vip-damage-pop");for(let i=0;i<Math.max(0,existing.length-14);i++)existing[i]?.remove();
    const pop=document.createElement("span");pop.className=`bc-vip-damage-pop${crit?" crit":""}${special?" special":""}`;pop.textContent=`${special&&crit?"SPECIAL KRIT ":special?"SPECIAL ":crit?"KRIT ":""}-${fmt(damage)}`;pop.style.left=`${14+Math.random()*72}%`;pop.style.top=`${16+Math.random()*62}%`;pop.style.setProperty("--pop-drift",`${-28+Math.random()*56}px`);target.append(pop);setTimeout(()=>pop.remove(),720);
  }
  function refreshVipClickerLive(enemy=ensureVipClickerEnemy()){if(!UI.overlay||UI.tab!=="vipClicker"||!enemy)return;const pctHp=clamp(Number(enemy.hp)/Math.max(1,Number(enemy.maxHp))*100,0,100),fill=UI.overlay.querySelector("[data-bc-vip-hp-fill]"),hp=UI.overlay.querySelector("[data-bc-vip-hp-text]"),clicks=UI.overlay.querySelector("[data-bc-vip-click-count]"),charge=UI.overlay.querySelector("[data-bc-vip-special-charge]");if(fill)fill.style.width=`${pctHp}%`;if(hp)hp.textContent=`${fmt(enemy.hp)} / ${fmt(enemy.maxHp)} HP`;if(clicks)clicks.textContent=fmt(S.vipClicks);if(charge){const sp=vipSpecialBy(S.vipClickerSpecialEquipped);charge.textContent=sp?`${fmt(S.vipClickerSpecialCharge)}/${sp.charge}`:"";}}
  function vipSpecialBy(id){return VIP_SPECIAL_ATTACKS.find(x=>x.id===id)||null;}
  function vipSpecialOwned(id){return !!S?.vipClickerSpecialOwned?.[id];}
  function vipSpecialAvailable(sp){return !!sp&&sp.rarity<=clamp(rarityUnlockedIndex(),0,12);}
  function equippedVipSpecial(){const sp=vipSpecialBy(S?.vipClickerSpecialEquipped);return sp&&vipSpecialOwned(sp.id)?sp:null;}
  function vipSpecialPassiveDamage(sp=equippedVipSpecial()){if(!sp)return 0;return .05+clamp(Math.floor(Number(sp.rarity)||0),0,12)*.025;}
  function vipSpecialPassiveCrit(sp=equippedVipSpecial()){if(!sp)return 0;return .005+clamp(Math.floor(Number(sp.rarity)||0),0,12)*.004;}
  function vipEffectiveClickDamage(){return Math.max(1,Math.round(vipClickerDamage()*(1+vipSpecialPassiveDamage())));}
  function vipEffectiveCritChance(){return clamp(vipClickerCritChance()+vipSpecialPassiveCrit(),0,.35);}
  function vipSpecialPassiveText(sp=equippedVipSpecial()){return sp?`+${Math.round(vipSpecialPassiveDamage(sp)*100)} % Klick-Schaden · +${(vipSpecialPassiveCrit(sp)*100).toLocaleString("de-DE",{maximumFractionDigits:1})} % Krit-Chance`:"Kein Attacken-Passivbonus";}
  function vipBasePower(meta){const normal=Math.max(1,strongestUsableNormalBase()),rarity=clamp(Math.floor(Number(meta?.rarity)||0),0,12),tierFactor=.82+(rarity/12)*2.35,cardFactor=clamp(Number(meta?.powerFactor)||1,.95,1.08);return Math.max(1,normal*tierFactor*cardFactor);}
  function vipRewardSummaryText(row){if(!row)return"Noch keine Belohnung.";return [row.vipCard?`👑 ${row.vipCard}`:"",row.normalCard?`🎴 ${row.normalCard}`:"",row.points?`💰 +${fmt(row.points)} Points`:"",row.xp?`✨ +${fmt(row.xp)} XP`:"",row.shards?`♻️ +${fmt(row.shards)} Shards`:"",row.item||""].filter(Boolean).join(" · ");}

  function rarityValue(index){return INTERNAL_VALUES[clamp(index,0,499)]??100;}
  function variantKey(rarityIndex,baseIndex){return `${rarityIndex}:${baseIndex}`;}
  function hyperCardBy(id){return HYPER_CARD_BY_ID[id]||null;}
  function hyperGeneration(inst){return clamp(Math.floor(Number(inst?.hyperGeneration)||1),1,HYPER_GENERATION_MAX);}
  function hyperCount(){return Object.keys(S?.hyperCollection||{}).length;}
  function collectionKey(inst){return inst?.hyper?`h:${inst.hyperId}`:inst?.win?`w:${inst.winId}`:inst?.vip?`v:${inst.vipId}`:inst?.exclusive?`x:${inst.exclusiveId}`:variantKey(inst.rarity,inst.base);}
  function cardCollectionMap(inst){return inst?.hyper?S.hyperCollection:inst?.win?S.winCollection:inst?.vip?S.vipCollection:inst?.exclusive?S.exclusiveCollection:S.collection;}
  function rarityUnlockedIndex(){const phase=FLOOR_PHASES[S.phase]||FLOOR_PHASES[0];let max=phase.tiers[0][1];for(const [r,t] of phase.tiers)if(S.phaseRebirths>=r)max=t;return max;}
  function hyperPackPointPrice(){
    const r=Math.max(0,Math.floor(Number(S?.totalRebirths)||0)),fixed=[250000,2000000,30000000,120000000,450000000,1200000000],prestigeFactor=Math.pow(1.50,prestigeCount());
    const base=r<fixed.length?fixed[r]:fixed.at(-1)*Math.pow(1.75,r-5);
    return Math.round(base*prestigeFactor);
  }
  function hyperTierMeta(instOrMeta){const meta=instOrMeta?.hyper?hyperCardBy(instOrMeta.hyperId):instOrMeta;return HYPER_TIER_META[clamp(Math.floor(Number(meta?.tier)||0),0,HYPER_TIER_META.length-1)]||HYPER_TIER_META[0];}
  function hyperProductionFactor(inst){return HYPER_GENERATION_PRODUCTION_MULT[hyperGeneration(inst)]||.30;}
  const HYPER_ECONOMY_RARITY_INDEX = RARITY_INDEX.rare;
  function hyperEconomyBase(inst){
    const hm=hyperCardBy(inst?.hyperId)||HYPER_CARDS[0];
    return cardBasePointProduction(HYPER_ECONOMY_RARITY_INDEX,inst?.base||0)*(Number(hm?.powerFactor)||1)*hyperProductionFactor(inst);
  }
  function hyperRankCombatMultiplier(inst){const rank=cardRank(inst);return 1+rank*.075+(rank>=10?.15:0);}
  function hyperCombatMultiplier(inst){
    const meta=hyperCardBy(inst?.hyperId)||HYPER_CARDS[0],tierFactor=Math.max(1,Number(meta?.powerFactor)||1),gen=HYPER_GENERATION_COMBAT_MULT[hyperGeneration(inst)]||1,rank=hyperRankCombatMultiplier(inst),fusion=fusionVariant(inst)==="prismatic"?1.20:fusionVariant(inst)==="holo"?1.08:1;
    return tierFactor*gen*rank*fusion;
  }
  function premiumReferenceTier(){return clamp(Math.max(rarityUnlockedIndex(),Math.floor(Number(S?.battleTierUnlocked)||0)),0,RARITIES.length-1);}
  function floorMaxTier(floorIndex){if(floorIndex>S.phase)return -1;const phase=FLOOR_PHASES[floorIndex];let max=phase.tiers[0][1];const rebirths=floorIndex<S.phase?5:S.phaseRebirths;for(const [r,t] of phase.tiers)if(rebirths>=r)max=t;return max;}
  function rebirthMultiplier(){const completed=S.phase,local=[1,2,3,4,5,5][S.phaseRebirths]||1;return Math.min(125,Math.pow(5,completed)*local);}
  const REBIRTH_LEVEL_REQUIREMENTS = Object.freeze([100,125,150,200]);
  function rebirthRequiredLevel(phase=S?.phase){return REBIRTH_LEVEL_REQUIREMENTS[clamp(Math.floor(Number(phase)||0),0,REBIRTH_LEVEL_REQUIREMENTS.length-1)]||100;}

  // ===== V412 · PRESTIGE =====
  const PRESTIGE_REWARDS = Object.freeze([
    Object.freeze({jk:1,weight:28}),Object.freeze({jk:5,weight:22}),Object.freeze({jk:10,weight:18}),Object.freeze({jk:20,weight:12}),
    Object.freeze({jk:30,weight:8}),Object.freeze({jk:50,weight:5}),Object.freeze({jk:75,weight:3}),Object.freeze({jk:100,weight:2}),
    Object.freeze({jk:200,weight:1}),Object.freeze({jk:300,weight:.5}),Object.freeze({jk:500,weight:.3}),Object.freeze({jk:750,weight:.15}),Object.freeze({jk:1000,weight:.05})
  ]);
  const PRESTIGE_SHOP_ITEMS = Object.freeze([
    Object.freeze({id:"title",name:"Prestige-Anwärter",icon:"◆",cost:1,minPrestige:1,desc:"Dauerhafter Prestige-Titel in BigCards."}),
    Object.freeze({id:"gold-frame",name:"Goldener Prestige-Rahmen",icon:"✦",cost:2,minPrestige:2,desc:"Kosmetischer goldener Rahmen für deine Kartenansichten."}),
    Object.freeze({id:"pack-flare",name:"Prestige Pack-Flare",icon:"🎴",cost:3,minPrestige:3,desc:"Zusätzlicher Prestige-Lichteffekt beim Pack-Reveal."}),
    Object.freeze({id:"expedition-seal",name:"Expeditions-Siegel",icon:"🧭",cost:4,minPrestige:4,desc:"+10 % Fusionsstaub, Aura-Material und Kosmetikfragmente aus Expeditionen. Keine zusätzlichen Points/XP."}),
    Object.freeze({id:"fusion-master",name:"Fusions-Meister",icon:"🔬",cost:5,minPrestige:5,desc:"Holo- und Prismatic-Fusionen kosten dauerhaft 10 % weniger Fusionsstaub."}),
    Object.freeze({id:"hyper-smith",name:"Hyper-Schmied",icon:"⚡",cost:8,minPrestige:7,desc:"Hyper-Kerne kosten dauerhaft 10 % weniger Wins und Fusionsstaub."}),
    Object.freeze({id:"market-license",name:"Prestige-Markt-Lizenz",icon:"🏪",cost:10,minPrestige:10,desc:"Eigene neue Marktangebote besitzen nur noch 4 % statt 5 % Verkaufsgebühr."}),
    Object.freeze({id:"legend-title",name:"Prestige-Legende",icon:"👑",cost:15,minPrestige:12,desc:"Animierter Prestige-Legenden-Titel und stärkere Prestige-Optik."}),
    Object.freeze({id:"mythic-shell",name:"Prestige-Mythos",icon:"✺",cost:25,minPrestige:20,desc:"Höchste kosmetische Prestige-Oberfläche. Kein Point-Multiplikator."})
  ]);
  function prestigeOwns(id){return !!S?.prestigeShopOwned?.[id];}
  function prestigeCount(){return Math.max(0,Math.floor(Number(S?.prestigeCount)||0));}
  function lifetimeRebirthCount(){return Math.max(0,Math.floor(Number(S?.prestigeLifetimeRebirths)||0))+Math.max(0,Math.floor(Number(S?.totalRebirths)||0));}
  function prestigeCycleDifficultyMultiplier(){return Math.min(3,1+prestigeCount()*.12);}
  function prestigeLuckPercent(){return Math.min(50,prestigeCount()*2);}
  function prestigeRewardRows(){
    const luck=prestigeLuckPercent()/100,rows=PRESTIGE_REWARDS.map(x=>{let w=x.weight;if(x.jk<=5)w*=Math.max(.60,1-luck*.50);if(x.jk>=100)w*=1+luck;if(x.jk>=500)w*=1+luck*.50;return {...x,adjusted:w};}),sum=rows.reduce((n,x)=>n+x.adjusted,0)||100;
    return rows.map(x=>({...x,chance:x.adjusted/sum*100}));
  }
  function prestigeHash32(text){let h=2166136261;for(let i=0;i<String(text).length;i++){h^=String(text).charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
  function prestigeRewardFor(uidText,number){const rows=prestigeRewardRows(),roll=prestigeHash32(`BIGCARDS-PRESTIGE-V412:${uidText}:${number}`)/4294967296*100;let at=0;for(const r of rows){at+=r.chance;if(roll<at)return r.jk;}return rows.at(-1)?.jk||1;}
  function prestigeTokenGain(number){return 1+(number%5===0?1:0);}
  function prestigePointsRequired(number=prestigeCount()+1){return Math.min(100_000_000_000,Math.round(250_000_000*Math.pow(1.75,Math.max(0,number-1))));}
  function prestigeWinsRequired(number=prestigeCount()+1){return Math.min(700,150+Math.max(0,number-1)*35);}
  function prestigeBossRequired(number=prestigeCount()+1){return Math.min(20_000_000,Math.round(100_000*Math.pow(1.60,Math.max(0,number-1))));}
  function prestigeSetsRequired(number=prestigeCount()+1){return Math.min(15,3+Math.floor(Math.max(0,number-1)/2));}
  function prestigePrismaticRequired(number=prestigeCount()+1){return Math.min(5,1+Math.floor(Math.max(0,number-1)/3));}
  function prestigeCompletedSetCount(){let n=0;for(const def of ALL_SET_BLUEPRINTS){const p=setProgress(def.id);if(p.total>0&&p.owned>=p.total)n++;}return n;}
  function prestigePrismaticCount(){let n=0;for(const inst of Object.values(S?.instances||{}))if(inst&&fusionVariant(inst)==="prismatic")n++;return n;}
  function prestigeEndgameComplete(){return Number(S?.phase)===3&&Number(S?.phaseRebirths)>=5;}
  function prestigeRequirements(number=prestigeCount()+1){
    const rows=[
      {id:"endgame",label:"Stockwerk 4 komplett",current:prestigeEndgameComplete()?1:0,target:1,text:prestigeEndgameComplete()?"5/5 Rebirths auf Stockwerk 4":"Stockwerk 4 · Rebirth 5/5"},
      {id:"points",label:"Points",current:Number(S?.points)||0,target:prestigePointsRequired(number)},
      {id:"wins",label:"Wins",current:Number(S?.winsCurrency)||0,target:prestigeWinsRequired(number)},
      {id:"boss",label:"Wochenboss-Schaden",current:Number(S?.bossWeek?.contribution)||0,target:prestigeBossRequired(number)},
      {id:"sets",label:"Komplette Sets",current:prestigeCompletedSetCount(),target:prestigeSetsRequired(number)},
      {id:"prism",label:"Prismatic-Karten",current:prestigePrismaticCount(),target:prestigePrismaticRequired(number)}
    ];
    for(const r of rows)r.ready=r.current>=r.target;return rows;
  }
  function prestigeReady(number=prestigeCount()+1){return prestigeRequirements(number).every(x=>x.ready);}
  function prestigeTitle(){return prestigeOwns("legend-title")?"Prestige-Legende":prestigeOwns("title")?`Prestige ${prestigeCount()}`:"";}
  function prestigeExpeditionMaterialMultiplier(){return prestigeOwns("expedition-seal")?1.10:1;}
  function prestigeFusionDustMultiplier(){return prestigeOwns("fusion-master")?.90:1;}
  function prestigeHyperCraftMultiplier(){return prestigeOwns("hyper-smith")?.90:1;}
  function marketFeeRate(){return prestigeOwns("market-license")?.04:MARKET_FEE;}
  function applyPrestigeCosmetics(){
    if(!UI.overlay)return;UI.overlay.classList.toggle("prestige-gold-frame",prestigeOwns("gold-frame"));UI.overlay.classList.toggle("prestige-pack-flare",prestigeOwns("pack-flare"));UI.overlay.classList.toggle("prestige-legend",prestigeOwns("legend-title"));UI.overlay.classList.toggle("prestige-mythic-shell",prestigeOwns("mythic-shell"));const badge=UI.overlay.querySelector("[data-bc-prestige-title]");if(badge){const t=prestigeTitle();badge.textContent=t?`◆ ${t}`:"";badge.hidden=!t;}
  }
  async function buyPrestigeItem(id){
    const item=PRESTIGE_SHOP_ITEMS.find(x=>x.id===id);if(!item)return;if(prestigeOwns(id))return toast("Prestige-Shop-Item bereits dauerhaft freigeschaltet.");if(prestigeCount()<item.minPrestige)return toast(`${item.name} benötigt Prestige ${item.minPrestige}.`);if((S.prestigeTokens||0)<item.cost)return toast(`Dir fehlen ${item.cost-(S.prestigeTokens||0)} Prestige-Siegel.`);
    if(!await gameConfirm({title:`${item.icon} ${item.name}`,message:`Kosten: ${item.cost} Prestige-Siegel\n\n${item.desc}\n\nDieser Kauf ist dauerhaft und bleibt bei jedem weiteren Prestige erhalten.`,confirmText:`Für ${item.cost} Siegel freischalten`,icon:item.icon,tone:"jk"}))return;
    S.prestigeTokens-=item.cost;S.prestigeShopOwned[id]=true;raiseScore(5000+item.cost*1200);persist();applyPrestigeCosmetics();refresh(false);toast(`${item.icon} ${item.name} dauerhaft freigeschaltet.`,4200);
  }
  function prestigeResetProgress(p){
    const currentRebirths=Math.max(0,Math.floor(Number(S.totalRebirths)||0));S.prestigeLifetimeRebirths=Math.max(0,Math.floor(Number(S.prestigeLifetimeRebirths)||0))+currentRebirths;S.prestigeCount=p.number;S.prestigeTokens=Math.max(0,Math.floor(Number(S.prestigeTokens)||0))+p.tokens;S.prestigeJkEarned=Math.max(0,Math.floor(Number(S.prestigeJkEarned)||0))+p.reward;S.prestigeBestJk=Math.max(Math.floor(Number(S.prestigeBestJk)||0),p.reward);S.prestigeHistory=[...(Array.isArray(S.prestigeHistory)?S.prestigeHistory:[]),{number:p.number,at:now(),jk:p.reward,tokens:p.tokens}].slice(-30);
    // Karten, Karten-Level/Rebirth/Rank, Sammlung, Auren, Fusion, Hyper-Generationen,
    // Auto-Opener-Arbeitszeit und bezahlte Komfortfunktionen bleiben erhalten.
    S.points=0;S.pendingPoints=0;S.fieldStoredSeconds=0;S.level=1;S.xp=0;S.totalRebirths=0;S.phase=0;S.phaseRebirths=0;S.unlockedFloors=1;S.floors=Array.from({length:4},()=>Array(10).fill(null));S.winsCurrency=0;S.battleTierUnlocked=0;S.battleTierWins=0;S.battleUpgradeSpent=0;S.battleStreak=0;S.battleCooldownUntil=0;UI.floor=0;UI.battleResult=null;UI.battleSession=null;S.prestigePending=null;normalizeExclusiveFloorRestriction();normalizeFloorUniqueCards();invalidateCardPowerCache();raiseScore(50000+p.number*10000);awardMainXp(50,"BigCards.kl Prestige",`bc-prestige-${p.number}`,true);persist();scheduleLeaderboardProfileSync(250);void syncProfile(true);refresh(false);toast(`◆ PRESTIGE ${p.number} · +${p.reward} JK/Coin · +${p.tokens} Prestige-Siegel`,7000);
  }
  async function completePendingPrestige(){
    const p=S?.prestigePending;if(!p)return false;const u=await currentUser();if(!u||String(p.uid)!==String(u.uid))return toast("Prestige wartet auf dieselbe Online-Anmeldung, mit der es gestartet wurde.",5000);if(!window.JKCoinApp?.credit)return toast("JK/Coin-System ist gerade nicht verfügbar. Prestige bleibt sicher vorgemerkt.",5000);const credited=window.JKCoinApp.credit(p.reward,`BigCards Prestige ${p.number}`,`bigcards-prestige-${u.uid}-${p.number}`);if(!credited)return toast("JK/Coin konnte gerade nicht gutgeschrieben werden. Prestige wurde NICHT zurückgesetzt; bitte später erneut versuchen.",5500);prestigeResetProgress(p);try{window.JKCoinApp.syncProfileBalance?.().catch?.(()=>{});}catch{}return true;
  }
  async function startPrestige(){
    if(S.prestigePending)return completePendingPrestige();const number=prestigeCount()+1,req=prestigeRequirements(number);if(!req.every(x=>x.ready))return toast("Prestige ist noch nicht bereit. Prüfe die roten Anforderungen im Prestige-Bereich.",4500);const u=await currentUser();if(!u)return toast("Prestige benötigt eine Online-Anmeldung, weil die JK/Coin-Belohnung eindeutig gespeichert wird.",5000);const reward=prestigeRewardFor(u.uid,number),tokens=prestigeTokenGain(number),reqText=req.map(x=>`✓ ${x.label}: ${x.id==="points"||x.id==="boss"?fmt(x.target):x.target}`).join("\n");
    if(!await gameConfirm({title:`◆ Prestige ${number} durchführen`,message:`${reqText}\n\nBelohnung dieses Prestiges: ${reward} JK/Coin + ${tokens} Prestige-Siegel.\n\nRESET: aktuelle Points, Level/XP, aktueller Rebirth-Zyklus, Stockwerk-Freischaltungen, Feldbelegung, Wins-Bestand und Kampfraritäten.\n\nBLEIBT: alle Karten und Duplikate, Kartenlevel, Karten-Rebirth, Rank, Shiny, Auren/Kampf-Auren/Bindungen, Fusion, Hyper-Generation, Sets/Sammlung, Materialien, Inventare, Auto-Opener-Arbeitszeit und Prestige-Shop-Freischaltungen.`,confirmText:`Prestige ${number} starten`,icon:"◆",tone:"danger"}))return;
    S.prestigePending={number,reward,tokens,uid:u.uid,createdAt:now()};persist();writeLocalState(cloudUid||u.uid,true);await completePendingPrestige();
  }
  function prestigeHtml(){
    const number=prestigeCount()+1,req=prestigeRequirements(number),ready=req.every(x=>x.ready),luck=prestigeLuckPercent(),rewardRows=prestigeRewardRows(),history=(S.prestigeHistory||[]).slice().reverse().slice(0,10),pending=S.prestigePending;
    const reqHtml=req.map(x=>`<article class="${x.ready?"ready":"locked"}"><span>${x.ready?"✓":"○"}</span><div><b>${x.label}</b><small>${x.text||`${(x.id==="points"||x.id==="boss")?fmt(x.current):x.current} / ${(x.id==="points"||x.id==="boss")?fmt(x.target):x.target}`}</small></div></article>`).join("");
    const odds=rewardRows.map(x=>`<article><b>${fmt(x.jk)} JK</b><span>${x.chance.toLocaleString("de-DE",{maximumFractionDigits:4})} %</span></article>`).join("");
    const shop=PRESTIGE_SHOP_ITEMS.map(x=>{const owned=prestigeOwns(x.id),locked=prestigeCount()<x.minPrestige,poor=(S.prestigeTokens||0)<x.cost;return `<article class="bc-prestige-shop-item ${owned?"owned":locked?"locked":""}"><span>${x.icon}</span><div><b>${esc(x.name)}</b><small>${esc(x.desc)}</small><em>Prestige ${x.minPrestige}+ · ${x.cost} ◆</em></div><button data-bc-prestige-buy="${x.id}" ${owned||locked||poor?"disabled":""}>${owned?"✓ DAUERHAFT":locked?`ab P${x.minPrestige}`:`${x.cost} Siegel`}</button></article>`}).join("");
    return `<section class="bc-section bc-prestige"><div class="bc-section-title"><div><small>ENDGAME · RESET MIT DAUERFORTSCHRITT</small><h2>◆ Prestige</h2><p>Prestige beginnt einen neuen BigCards-Durchlauf, lässt deine wertvollen Karten aber vollständig bestehen. Es gibt JK/Coin und die eigene Prestige-Shop-Währung.</p></div><button class="bc-info-circle" data-bc-section-info="prestige" title="Prestige-Info">i</button></div><div class="bc-prestige-hero"><div><small>PRESTIGE</small><b>${prestigeCount()}</b></div><div><small>PRESTIGE-SIEGEL</small><b>◆ ${fmt(S.prestigeTokens||0)}</b></div><div><small>JK/Coin ERSPIELT</small><b>${fmt(S.prestigeJkEarned||0)}</b></div><div><small>BESTER TREFFER</small><b>${fmt(S.prestigeBestJk||0)} JK</b></div><div><small>PRESTIGE-LUCK</small><b>+${luck} %</b></div></div>${pending?`<div class="bc-prestige-pending"><b>⚠ Prestige ${pending.number} wartet auf JK/Coin-Gutschrift.</b><span>Dein Reset wurde noch nicht durchgeführt.</span><button data-bc-prestige-complete>Jetzt erneut abschließen</button></div>`:""}<section class="bc-prestige-progress"><div class="bc-prestige-head"><div><small>NÄCHSTES ZIEL</small><h3>Prestige ${number}</h3><p>Jedes weitere Prestige wird über Points, Wins, Boss, Sets und Fusion schwerer. XP selbst wurde dafür nicht verändert.</p></div><strong>${ready?"BEREIT":"NOCH NICHT BEREIT"}</strong></div><div class="bc-prestige-requirements">${reqHtml}</div><button class="bc-prestige-start ${ready?"ready":""}" data-bc-prestige-start ${ready||pending?"":"disabled"}>${pending?"Vorgemerktes Prestige abschließen":ready?`◆ PRESTIGE ${number} DURCHFÜHREN`:`Noch nicht bereit`}</button><p class="bc-prestige-difficulty">Nächster Rebirth-Zyklus: Point-Kosten ×${prestigeCycleDifficultyMultiplier().toFixed(2).replace(".",",")} · Karten/XP bleiben von diesem Prestige-Schwierigkeitsfaktor unberührt.</p></section><section class="bc-prestige-keep"><article><b>WIRD ZURÜCKGESETZT</b><span>Points · Level/XP · aktueller Account-Rebirth-Zyklus · Stockwerke · Feldbelegung · Wins-Bestand · normale Kampfraritäts-Freischaltung</span></article><article><b>BLEIBT DAUERHAFT</b><span>Karten/Duplikate · Kartenlevel/Rebirth · Rank · Auren · Bindungen · Shiny · Fusion · Hyper-Generation · Sets/Sammlung · Materialien · bezahlte Auto-Zeit · Prestige-Shop</span></article></section><section class="bc-prestige-odds"><div class="bc-prestige-head"><div><small>JK/COIN-KAPSEL</small><h3>Belohnungschancen für Prestige ${number}</h3><p>1.000 JK/Coin bleibt extrem selten. Prestige-Luck verschiebt mit vielen Prestiges langsam Gewicht von kleinen auf größere Treffer.</p></div></div><div>${odds}</div></section><section class="bc-prestige-shop"><div class="bc-prestige-head"><div><small>DAUERHAFTE FREISCHALTUNGEN</small><h3>◆ Prestige-Shop</h3><p>Prestige-Siegel gibt es nur beim Prestige. Shop-Boni erhöhen nicht direkt deine normale Points-Produktion.</p></div></div><div class="bc-prestige-shop-grid">${shop}</div></section><section class="bc-prestige-history"><h3>Letzte Prestiges</h3>${history.length?history.map(h=>`<article><b>Prestige ${h.number}</b><span>+${fmt(h.jk)} JK/Coin · +${h.tokens} ◆</span><small>${new Date(h.at).toLocaleString("de-DE")}</small></article>`).join(""):`<p>Noch kein Prestige abgeschlossen.</p>`}</section></section>`;
  }
  function rebirthCostTier(){return clamp(rarityUnlockedIndex(),0,RARITIES.length-1);}
  function rebirthPointCost(){const base=REBIRTH_POINT_COSTS[rebirthCostTier()]||REBIRTH_POINT_COSTS[0];return Math.round(base*prestigeCycleDifficultyMultiplier());}
  function rebirthWinCost(){return REBIRTH_WIN_COSTS[rebirthCostTier()]||REBIRTH_WIN_COSTS[0];}
  function rebirthReady(){return !prestigeEndgameComplete()&&S.level>=rebirthRequiredLevel()&&S.points>=rebirthPointCost()&&S.winsCurrency>=rebirthWinCost();}
  function cardBaseProduction(rarityIndex,baseIndex){const r=RARITIES[rarityIndex],rv=rarityValue(baseIndex);const scarcity=clamp(1-Math.pow((rv-.1)/99.9,.58),0,1);return r.min+(r.max-r.min)*scarcity;}
  function cardBasePointProduction(rarityIndex,baseIndex){const r=POINT_RARITY_CURVE[clamp(Math.floor(Number(rarityIndex)||0),0,POINT_RARITY_CURVE.length-1)]||POINT_RARITY_CURVE[0],rv=rarityValue(baseIndex),scarcity=clamp(1-Math.pow((rv-.1)/99.9,.58),0,1);return r.min+(r.max-r.min)*scarcity;}
  function pointCardRebirthMultiplier(inst){return POINT_CARD_REBIRTH_MULT[cardRebirth(inst)]||1;}
  function accountPointRebirthMultiplier(){return 1+clamp(Math.floor(Number(S?.phaseRebirths)||0),0,5)*.08;}
  function cardProductionFloorIndex(inst){const p=inst?.id?findCardPlacement(inst.id):null;return clamp(Math.floor(Number(p?.floor ?? UI?.floor ?? S?.phase)||0),0,3);}
  function pointFloorMultiplier(inst){return POINT_FLOOR_MULT[cardProductionFloorIndex(inst)]||1;}
  function setPointBonusValue(inst){const ids=setMembershipIds(inst);let bonus=0;for(const id of ids){if(inst?.hyper&&id==="hyper")continue;bonus+=Math.max(0,Number(setProgress(id).bonus)||0);}return bonus;}
  function cardPointBonusBreakdown(inst){const parts=[],a=inst?.aura?auraBy(inst.aura):null;if(a&&a.mult>1)parts.push({label:a.name,bonus:a.mult-1});if((inst?.shiny||0)>=2)parts.push({label:"Explosive Shiny",bonus:.15});const f=Math.max(0,fusionPointMultiplier(inst)-1);if(f)parts.push({label:fusionLabel(inst),bonus:f});const sets=setPointBonusValue(inst);if(sets)parts.push({label:"Set-Boni",bonus:sets});if(S?.ultimateSetClaimed)parts.push({label:"Ultimate Set",bonus:.25});return parts;}
  function persistentPointBonusMultiplier(inst){return 1+cardPointBonusBreakdown(inst).reduce((sum,x)=>sum+x.bonus,0);}
  function pointBonusSummary(inst){const base=[`Level ×${(LEVEL_MULT[inst?.level]||1).toFixed(2).replace(".",",")}`,`Karten-Rebirth ×${pointCardRebirthMultiplier(inst).toFixed(2).replace(".",",")}`,`Account-Rebirth ×${accountPointRebirthMultiplier().toFixed(2).replace(".",",")}`,`Stockwerk ×${pointFloorMultiplier(inst).toFixed(2).replace(".",",")}`],extras=cardPointBonusBreakdown(inst).map(x=>`${x.label} +${Math.round(x.bonus*100)} %`);return base.concat(extras).join(" · ");}
  function cardBaseXpProduction(rarityIndex,baseIndex){const r=XP_RARITY_CURVE[clamp(Math.floor(Number(rarityIndex)||0),0,XP_RARITY_CURVE.length-1)]||XP_RARITY_CURVE[0],rv=rarityValue(baseIndex),scarcity=clamp(1-Math.pow((rv-.1)/99.9,.58),0,1);return r.min+(r.max-r.min)*scarcity;}
  function xpCardRebirthMultiplier(inst){return XP_CARD_REBIRTH_MULT[cardRebirth(inst)]||1;}
  function accountXpRebirthMultiplier(){return 1+Math.min(.30,Math.max(0,Math.floor(Number(S?.totalRebirths)||0))*.015);}
  function premiumXpBase(inst){const n=premiumProductionRarityNorm(inst),maxTier=inst?.exclusive?RARITY_INDEX.exotic:RARITY_INDEX.universe,tier=clamp(premiumReferenceTier(),0,maxTier),r=XP_RARITY_CURVE[tier]||XP_RARITY_CURVE[0];return r.min+(r.max-r.min)*(.30+n*.50);}
  function premiumXpCap(inst){return inst?.exclusive?70:inst?.vip?100:Infinity;}
  function cardBaseXp(inst){
    if(!inst)return 0;
    if(inst.hyper){const hm=hyperCardBy(inst.hyperId)||HYPER_CARDS[0],gen=HYPER_XP_GENERATION_MULT[hyperGeneration(inst)]||.22;return cardBaseXpProduction(RARITY_INDEX.rare,inst.base)*(Number(hm?.powerFactor)||1)*gen;}
    if(inst.exclusive||inst.vip)return premiumXpBase(inst);
    let base=cardBaseXpProduction(inst.rarity,inst.base);
    if(inst.win)base*=1.05;
    return Math.max(.1,base);
  }
  function auraBy(id){return AURAS.find(a=>a.id===id)||null}function combatAuraBy(id){return COMBAT_AURAS.find(a=>a.id===id)||null}function bindBy(id){return BINDS.find(b=>b.id===id)||null}
  function equipmentItem(kind,id){return kind==="aura"?auraBy(id):kind==="combatAura"?combatAuraBy(id):kind==="bind"?bindBy(id):null;}
  function equipmentInventory(kind){return kind==="aura"?S.auraInventory:kind==="combatAura"?S.combatAuraInventory:kind==="bind"?S.bindInventory:null;}
  function equipmentPointPrice(kind,id){return Math.max(0,Math.floor(Number(EQUIPMENT_POINT_PRICES[kind]?.[id])||0));}
  function equipmentRewardKey(kind,id){return `${kind}:${id}`;}
  function equipmentRewardInfo(kind,id){
    const key=equipmentRewardKey(kind,id),claimed=!!S.equipmentRewards?.[key];
    if(kind==="aura"){
      if(id==="basic")return {claimed,direct:true,ready:!!S.daily?.claimed?.new,current:S.daily?.claimed?.new?1:0,target:1,label:'Daily Card Quest „3 neue Karten finden“ abschließen'};
      const goals={rare:25,epic:75,legendary:150,mythic:300,exotic:600,universe:1000,blackhole:1750,galaxy:3000,cosmic:5000},target=goals[id]||0,current=collectionCount();
      return {claimed,direct:false,ready:current>=target,current,target,label:`${fmt(target)} verschiedene normale Karten entdecken`};
    }
    if(kind==="combatAura"){
      if(id==="basic")return {claimed,direct:true,ready:(S.battleWins||0)>=1,current:Math.min(1,S.battleWins||0),target:1,label:'Den ersten Kartenkampf gewinnen'};
      const goals={rare:10,epic:30,legendary:75,mythic:150,exotic:300,universe:500,blackhole:800,galaxy:1200,cosmic:2000},target=goals[id]||0,current=S.battleWins||0;
      return {claimed,direct:false,ready:current>=target,current,target,label:`${fmt(target)} Kartenkampf-Siege erreichen`};
    }
    if(kind==="bind"){
      const lvlGoals={fire:20,poison:40,ice:60,water:80};
      if(lvlGoals[id]){const target=lvlGoals[id],current=Math.max(S.maxLevelEver||1,S.level||1);return {claimed,direct:false,ready:current>=target,current,target,label:`BigCards Level ${target} mindestens einmal erreichen`};}
      const rebirthGoals={hell:1,angel:5,wizard:10},target=rebirthGoals[id]||0,current=S.totalRebirths||0;
      return {claimed,direct:false,ready:current>=target,current,target,label:`${target} BigCards-Rebirth${target===1?'':'s'} erreichen`};
    }
    return {claimed,direct:false,ready:false,current:0,target:1,label:'Noch kein Freischaltweg'};
  }
  function equipmentProgressText(info){if(info.claimed)return 'Gratis-Belohnung bereits erhalten';if(info.direct)return info.ready?'Direkte Belohnung wurde über den Spielweg freigeschaltet':'Direkte Belohnung: '+info.label;return `${info.label} · ${fmt(Math.min(info.current,info.target))}/${fmt(info.target)}`;}
  function equipmentFreeButton(kind,id){const info=equipmentRewardInfo(kind,id);if(info.direct)return `<button class="bc-eq-free direct" disabled>${info.claimed?'Gratis erhalten ✓':'Direkt erspielen'}</button>`;if(info.claimed)return `<button class="bc-eq-free claimed" disabled>Gratis erhalten ✓</button>`;if(info.ready)return `<button class="bc-eq-free ready" data-bc-equipment-free="${kind}:${id}">🎁 Gratis holen</button>`;return `<button class="bc-eq-free" disabled>Gratis ${fmt(Math.min(info.current,info.target))}/${fmt(info.target)}</button>`;}
  function buyEquipment(kind,id){const item=equipmentItem(kind,id),inv=equipmentInventory(kind),price=equipmentPointPrice(kind,id);if(!item||!inv||!price)return toast('Ausrüstung nicht gefunden.');if(S.points<price)return toast(`Dir fehlen ${fmt(price-S.points)} Points für ${item.name}.`,3400);S.points-=price;inv[id]=(inv[id]||0)+1;persist();showEquipment(kind==="combatAura"?'aura':kind);toast(`${item.name} gekauft · -${fmt(price)} Points`,3200);}
  function claimFreeEquipment(kind,id){const item=equipmentItem(kind,id),inv=equipmentInventory(kind),info=equipmentRewardInfo(kind,id),key=equipmentRewardKey(kind,id);if(!item||!inv)return toast('Ausrüstung nicht gefunden.');if(info.direct)return toast(`Diese Belohnung bekommst du direkt: ${info.label}.`,3400);if(info.claimed)return toast('Diese kostenlose Freischalt-Belohnung hast du bereits erhalten.');if(!info.ready)return toast(`Noch nicht freigeschaltet: ${info.label} (${fmt(info.current)}/${fmt(info.target)}).`,3600);inv[id]=(inv[id]||0)+1;S.equipmentRewards[key]=true;persist();showEquipment(kind==="combatAura"?'aura':kind);toast(`${item.name} kostenlos freigeschaltet und ins Inventar gelegt!`,3800);}
  function equipmentUnlockList(kind,items){return `<ul class="bc-equipment-unlock-list">${items.map(item=>{const info=equipmentRewardInfo(kind,item.id);return `<li><b>${item.icon} ${item.name}</b><span>${esc(info.label)}${info.claimed?' · ✓ erhalten':info.direct&&info.ready?' · ✓ erfüllt':!info.direct?` · ${fmt(Math.min(info.current,info.target))}/${fmt(info.target)}`:''}</span></li>`}).join('')}</ul>`;}
  // V384: Premiumkarten (Exclusive + VIP) skalieren bei der Points-Produktion
  // dynamisch mit dem echten F2P-Packfortschritt. Der gespeicherte basePower bleibt
  // für bestehende XP-/Marktwerte erhalten, ist aber nicht mehr die alleinige
  // Produktionsbasis. Früh im Spiel liegen Premiumkarten bewusst deutlich vor den
  // normalen Karten; Richtung Göttlich wird der Vorsprung kleiner, sodass starke
  // F2P-Endgame-Karten einzelne Premiumkarten wieder überholen können.
  function premiumProductionRarityNorm(inst){
    if(inst?.exclusive){
      const idx=Math.max(0,EXCLUSIVES.findIndex(x=>x.id===inst.exclusiveId));
      return clamp(idx/Math.max(1,EXCLUSIVES.length-1),0,1);
    }
    if(inst?.vip){
      const vm=vipCardBy(inst.vipId)||VIP_CARDS[0];
      const rarity=clamp(Number(vm?.rarity)||0,0,12)/12;
      const card=clamp((Number(vm?.powerFactor)||1)-1,0,.08)/.08;
      return clamp(rarity*.88+card*.12,0,1);
    }
    return 0;
  }
  function premiumProductionFactor(inst){
    const n=premiumProductionRarityNorm(inst),progress=premiumReferenceTier()/12;
    if(inst?.exclusive){
      const early=1.35+n*1.25,late=.90+n*.62;
      return early+(late-early)*progress;
    }
    const early=1.30+n*1.18,late=.88+n*.60;
    return early+(late-early)*progress;
  }
  function premiumProductionBase(inst){
    const n=premiumProductionRarityNorm(inst),maxTier=inst?.exclusive?RARITY_INDEX.blackhole:RARITY_INDEX.galaxy,tier=clamp(premiumReferenceTier(),0,maxTier),curve=POINT_RARITY_CURVE[tier]||POINT_RARITY_CURVE[0];
    return curve.min+(curve.max-curve.min)*(.30+n*.55);
  }
  function premiumPointCap(inst){return inst?.exclusive?60000:inst?.vip?120000:Infinity;}
  function effectivePoints(inst){if(!inst)return 0;let base;if(inst.hyper)base=hyperEconomyBase(inst);else if(inst.exclusive||inst.vip)base=premiumProductionBase(inst);else{base=cardBasePointProduction(inst.rarity,inst.base);if(inst.win)base*=1.05;}let value=base*(LEVEL_MULT[inst.level]||1)*pointCardRebirthMultiplier(inst)*accountPointRebirthMultiplier()*pointFloorMultiplier(inst)*persistentPointBonusMultiplier(inst);if(inst.exclusive||inst.vip)value=Math.min(value,premiumPointCap(inst));value*=pointsBoosterMultiplier()*vipWheelMultiplier("production");return Math.max(0,value);}
  function effectiveXp(inst){if(!inst)return 0;let value=cardBaseXp(inst)*(XP_LEVEL_MULT[inst.level]||1)*xpCardRebirthMultiplier(inst)*accountXpRebirthMultiplier();if(inst.bind)value*=bindBy(inst.bind)?.mult||1;if(inst.shiny>=1)value*=1.10;if(inst.exclusive||inst.vip)value=Math.min(value,premiumXpCap(inst));value*=xpBoosterMultiplier();return Math.max(0,value);}
  function trailBy(id){return TRAIL_BY_ID[id]||null;}
  function trailCount(id){return Math.max(0,Math.floor(Number(S?.trailInventory?.[id])||0));}
  function returnTrailToInventory(inst){if(!inst?.trail)return null;const t=trailBy(inst.trail);if(t)S.trailInventory[t.id]=trailCount(t.id)+1;inst.trail=null;return t;}
  function trailUnlocked(id){const t=trailBy(id);return !!t&&t.index<=clamp(Math.floor(Number(S?.trailTierUnlocked)||0),0,TRAILS.length-1);}
  function featuredCard(){const inst=instance(S?.featuredCardId);return inst&&!inst.listed?inst:null;}
  function featuredProgressCompareV424(a,b){
    if(!a&&!b)return 0;if(!a)return-1;if(!b)return 1;
    const ar=cardRebirth(a),br=cardRebirth(b);if(ar!==br)return ar-br;
    const al=clamp(Math.floor(Number(a.level)||1),1,5),bl=clamp(Math.floor(Number(b.level)||1),1,5);if(al!==bl)return al-bl;
    const ag=a.hyper?hyperGeneration(a):1,bg=b.hyper?hyperGeneration(b):1;if(ag!==bg)return ag-bg;
    return 0;
  }
  function strongestOwnedCopyForFeaturedV424(inst){
    if(!inst)return null;const key=collectionKey(inst),blockedBackup=String(inst.backupCardId||""),candidates=[];
    for(const x of Object.values(S?.instances||{})){
      if(!x||collectionKey(x)!==key||x.listed||isCardOnExpedition(x.id))continue;
      if(blockedBackup&&String(x.id)===blockedBackup)continue;
      candidates.push(x);
    }
    const healthy=candidates.filter(x=>!x.broken),pool=healthy.length?healthy:candidates;
    pool.sort((a,b)=>featuredProgressCompareV424(b,a)||combatStats(b).power-combatStats(a).power);
    return pool[0]||inst;
  }
  function swapFeaturedLoadoutV424(from,to){
    if(!from||!to||from.id===to.id)return;
    // Diese Werte gehören praktisch zum persönlichen Kampfslot. Sie werden
    // getauscht, damit beim Wechsel auf die stärker ausgebaute Kopie Rank,
    // Auren, Bindung, Spur, Tränke und Backup nicht scheinbar verschwinden.
    const fields=["rank","rankMastery","rankEliteWins","rankWins","rankedAt","aura","combatAura","bind","trail","backupCardId","battlePotions","battlePotion"];
    for(const field of fields){
      const a=Array.isArray(from[field])?from[field].map(x=>x&&typeof x==="object"?{...x}:x):from[field];
      const b=Array.isArray(to[field])?to[field].map(x=>x&&typeof x==="object"?{...x}:x):to[field];
      from[field]=b;to[field]=a;
    }
    if(to.backupCardId===to.id)to.backupCardId=null;
    if(from.backupCardId===from.id)from.backupCardId=null;
  }
  function promoteFeaturedCopyV424(target){
    const current=instance(S?.featuredCardId);if(!current||!target||current.id===target.id)return false;
    if(collectionKey(current)!==collectionKey(target)||target.listed||target.broken||isCardOnExpedition(target.id))return false;
    swapFeaturedLoadoutV424(current,target);
    for(const row of S.floors||[]){const i=row.indexOf(target.id);if(i>=0)row[i]=null;}
    if(UI.battleCard===current.id)UI.battleCard=target.id;
    S.featuredCardId=target.id;S.featuredLastAt=now();invalidateCardPowerCache();return true;
  }
  function repairFeaturedIdentityV424(){
    const current=instance(S?.featuredCardId);if(!current||current.listed||current.broken)return false;
    const best=strongestOwnedCopyForFeaturedV424(current);
    if(!best||best.id===current.id||best.broken||featuredProgressCompareV424(best,current)<=0)return false;
    return promoteFeaturedCopyV424(best);
  }
  function bestSelectableFeaturedCopyV424(inst){
    if(!inst)return null;
    const best=strongestOwnedCopyForFeaturedV424(inst);
    return best&&!best.broken?best:inst;
  }
  function cardRank(inst){return clamp(Math.floor(Number(inst?.rank)||0),0,FEATURED_RANK_MAX);}
  function cardRankMastery(inst){return Math.max(0,Math.floor(Number(inst?.rankMastery)||0));}
  function cardRankEliteWins(inst){return Math.max(0,Math.floor(Number(inst?.rankEliteWins)||0));}
  function rankMeta(rank){return FEATURED_RANKS[clamp(Math.floor(Number(rank)||0),0,FEATURED_RANK_MAX)]||FEATURED_RANKS[0];}
  function nextRankMeta(inst){const rank=cardRank(inst);return rank>=FEATURED_RANK_MAX?null:FEATURED_RANKS[rank+1];}
  function rankActive(inst){return !!inst&&S?.featuredCardId===inst.id;}
  function rankBonusMultiplier(inst){return rankActive(inst)?1+(rankMeta(cardRank(inst)).bonus||0):1;}
  function rankPotionBonus(inst){if(!rankActive(inst))return 0;const r=cardRank(inst);return r>=7 ? .10 : r>=2 ? .05 : 0;}
  function rankSpecialBonus(inst){if(!rankActive(inst))return 0;const r=cardRank(inst);return r>=8 ? .10 : r>=3 ? .05 : 0;}
  function rankDamageReduction(inst){if(!rankActive(inst))return 0;const r=cardRank(inst);return r>=10 ? .10 : r>=6 ? .05 : 0;}
  function rankBattleRewardMultiplier(inst){if(!rankActive(inst))return 1;const r=cardRank(inst);return r>=9?1.10:r>=4?1.05:1;}
  function rankMasteryGain(enemy){const shift=clamp(Math.floor(Number(enemy?.difficultyShift)||0),-2,2);return shift<=-2?1:shift===-1?2:shift===0?4:shift===1?7:12;}
  function rankBackupMaxTier(inst=featuredCard()){return inst?Math.floor(Number(rankMeta(cardRank(inst)).backupTier)??-1):-1;}
  function rankBackupTierName(inst=featuredCard()){const tier=rankBackupMaxTier(inst);return tier<0?"Noch keine Backup-Karte":RARITIES[tier]?.name||"Karte";}
  function backupRankRequirementForTier(tier){const row=FEATURED_RANKS.find(r=>Number(r.backupTier)>=tier);return row?.rank??FEATURED_RANK_MAX;}
  function featuredBackupCard(main=featuredCard()){if(!main?.backupCardId)return null;const backup=instance(main.backupCardId);return backup&&backup.id!==main.id&&!backup.listed?backup:null;}
  function backupCardEligible(main,candidate){if(!main||!candidate||candidate.id===main.id||candidate.listed)return false;if(candidate.hyper||candidate.exclusive||candidate.vip)return cardRank(main)>=1;return cardRank(main)>=1&&candidate.rarity<=rankBackupMaxTier(main);}
  function usableFeaturedBackup(main=featuredCard()){const backup=featuredBackupCard(main);return backup&&backupCardEligible(main,backup)&&!backup.broken?backup:null;}
  function clearBackupReferences(cardId){for(const inst of Object.values(S?.instances||{}))if(inst?.backupCardId===cardId)inst.backupCardId=null;}
  function isFeaturedCombatCardId(id){const main=featuredCard();return !!id&&!!main&&(main.id===id||main.backupCardId===id);}
  function activeTrail(inst){return inst&&isFeaturedCombatCardId(inst.id)?trailBy(inst.trail):null;}
  function featurePointRate(inst=featuredCard()){if(!inst)return 0;const t=activeTrail(inst),rankMult=inst.hyper?1:rankBonusMultiplier(inst);return effectivePoints(inst)*(1+(t?.points||0))*rankMult;}
  function featureXpRate(inst=featuredCard()){if(!inst)return 0;const t=activeTrail(inst),rankMult=inst.hyper?1:rankBonusMultiplier(inst);return effectiveXp(inst)*(1+(t?.xp||0))*rankMult;}
  function featuredStorageMeta(){return FEATURED_STORAGE_TIERS[clamp(Math.floor(Number(S?.featuredStorageTier)||0),0,FEATURED_STORAGE_TIERS.length-1)]||FEATURED_STORAGE_TIERS[0];}
  function featuredStorageNext(){return FEATURED_STORAGE_TIERS[featuredStorageMeta().tier+1]||null;}
  function updateFeaturedEarnings(at=now(),allowXp=true){
    if(!S)return;const last=Math.max(0,Number(S.featuredLastAt)||at),dt=Math.max(0,(at-last)/1000);S.featuredLastAt=at;const inst=featuredCard();if(!inst||dt<=0)return;const lim=featuredStorageMeta(),oldPoints=Math.max(0,Number(S.featuredPendingPoints)||0),oldXp=Math.max(0,Number(S.featuredPendingXp)||0);
    // Bereits vor V353 angesammelte Werte oberhalb des neuen Limits werden nicht gelöscht.
    // Es kommt lediglich nichts Neues hinzu, bis der Spieler eingesammelt hat. Points
    // dürfen weiterhin bis zum Karten-Slot-Limit nachlaufen; XP gibt es in V367 aber
    // ausschließlich während einer aktiven BigCards-Sitzung und nie für Offline-Zeit.
    S.featuredPendingPoints=oldPoints>=lim.points?oldPoints:Math.min(lim.points,oldPoints+featurePointRate(inst)*dt);
    if(allowXp)S.featuredPendingXp=oldXp>=lim.xp?oldXp:Math.min(lim.xp,oldXp+featureXpRate(inst)*dt);
  }

  // V410: Das Spielfeld speichert eine feste Anzahl Sekunden der aktuellen Produktion.
  const FIELD_STORAGE_SECONDS = Object.freeze([30,60,120,240,480]);
  function fieldStorageStage(){const r=Math.max(0,Math.floor(Number(S?.totalRebirths)||0));return r>=6?5:r>=4?4:r>=2?3:r>=1?2:1;}
  function fieldStorageSecondsLimit(){return FIELD_STORAGE_SECONDS[fieldStorageStage()-1]||30;}
  function fieldPointCapacity(){const rate=Math.max(0,productionPerSecond());return Math.max(2500,rate*fieldStorageSecondsLimit());}
  function fieldStorageRemainingPoints(){return Math.max(0,fieldPointCapacity()-Math.max(0,Number(S?.pendingPoints)||0));}
  function fieldStorageMinutes(){const rate=Math.max(0,productionPerSecond());return rate>0?fieldStorageRemainingPoints()/rate/60:0;}
  function fieldStorageRemainingSeconds(){const rate=Math.max(0,productionPerSecond());return rate>0?fieldStorageRemainingPoints()/rate:0;}
  function fieldStoragePercent(){return Math.min(100,Math.max(0,Number(S?.pendingPoints)||0)/Math.max(1,fieldPointCapacity())*100);}
  function fieldStorageLabel(){const full=fieldStorageRemainingPoints()<=.01,sec=fieldStorageSecondsLimit();return `${full?"VOLL · ":""}Stufe ${fieldStorageStage()} · ${sec}s · Limit ${fmt(fieldPointCapacity())} Points`; }
  function trailBonusText(t){if(!t)return"";return `+${Math.round(t.points*100)} % Karten-Slot-Points · +${Math.round(t.xp*100)} % Karten-Slot-XP · +${Math.round(t.damage*100)} % Kampfschaden · +${Math.round(t.hp*100)} % Kampf-Leben`;}
  function trailClass(inst){const t=inst?trailBy(inst.trail):null;return t?`trail-${t.id}`:"";}
  function highestNormalCombatTierReached(){
    // V386: Premium folgt direkt der höchsten bereits freigeschalteten normalen
    // Kampf-/Packstufe. Das ist zugleich wesentlich schneller als für jede
    // Premiumkarte erneut die komplette Sammlung nach der höchsten Stufe zu scannen.
    return clamp(premiumReferenceTier(),0,COMBAT_RANGES.length-1);
  }
  function exclusiveCombatTier(){return clamp(highestNormalCombatTierReached(),0,9);}
  function vipCombatTier(){return clamp(highestNormalCombatTierReached(),0,10);}
  function hyperCombatTier(inst){
    // Hyper beginnt mindestens im Legendär-Bereich und wächst mit normalem Accountfortschritt.
    // Die tatsächliche Endgame-Stärke kommt zusätzlich aus Hyper-Rarität, Generation, Rank und Karten-Rebirth.
    const meta=hyperCardBy(inst?.hyperId)||HYPER_CARDS[0],floor=clamp(Number(meta?.rarity)||4,4,10);
    return clamp(Math.max(floor,highestNormalCombatTierReached()),0,12);
  }
  function combatTier(inst){if(!inst)return 0;if(inst.hyper)return hyperCombatTier(inst);if(inst.vip)return vipCombatTier();if(inst.exclusive)return exclusiveCombatTier();return clamp(Math.floor(inst.rarity||0),0,COMBAT_RANGES.length-1);}
  // V386: Premiumkarten liegen innerhalb der aktuell erreichten normalen
  // Kampfrarität (z. B. Legendär), nicht mehr künstlich 1–2 Klassen darunter.
  // Die eigene Seltenheit entscheidet innerhalb dieses Bereichs: kleinere
  // Prozentwerte = höherer Kampfwert. Sehr seltene Premiumkarten liegen oben.
  function premiumCombatRange(tier){
    const t=clamp(Math.floor(Number(tier)||0),0,COMBAT_RANGES.length-1),cur=COMBAT_RANGES[t]||COMBAT_RANGES[0],scale=(.78+(t/12)*.08)*PREMIUM_V393_STRENGTH;
    return {min:cur.min*scale,max:cur.max*scale};
  }
  function premiumCombatRarityFactor(inst,tier){
    let raw=1.02;
    if(inst?.exclusive){
      const idx=Math.max(0,EXCLUSIVES.findIndex(x=>x.id===inst.exclusiveId)),n=idx/Math.max(1,EXCLUSIVES.length-1);
      raw=1.02+n*.42;
    }else if(inst?.vip){
      const vm=vipCardBy(inst.vipId)||VIP_CARDS[0],rarity=clamp(Number(vm?.rarity)||0,0,12),cardFactor=clamp(Number(vm?.powerFactor)||1,1,1.08);
      raw=1.00+(rarity/12)*.34+(cardFactor-1)*.75;
    }
    const endgameFade=1-clamp(Number(tier)||0,0,12)/12*.15;
    return 1+(raw-1)*endgameFade;
  }
  function hyperSupportTier(){return clamp(Math.max(RARITY_INDEX.legendary,highestNormalCombatTierReached()),RARITY_INDEX.legendary,RARITY_INDEX.galaxy);}
  function repairKitId(inst){
    if(inst?.hyper)return "hyper";
    if(inst?.vip)return "vip";
    if(inst?.exclusive)return "exclusive";
    if(inst?.win)return "wins";
    return RARITIES[clamp(Math.floor(inst?.rarity||0),0,RARITIES.length-1)]?.id||"common";
  }
  function repairKitMeta(id){return REPAIR_KIT_BY_ID[id]||REPAIR_KIT_BY_ID.common;}
  function repairKitPrice(id){
    const kit=repairKitMeta(id);
    if(!kit.exclusive&&!kit.vip&&!kit.wins&&!kit.hyper)return Math.max(1,Math.floor(kit.price||1));
    const tier=kit.vip?vipCombatTier():kit.hyper?hyperSupportTier():exclusiveCombatTier();
    // Jede Spezialkarten-Art besitzt ein eigenes Reparatur-Item.
    const curve=[20000,30000,50000,75000,110000,160000,200000,240000,350000,550000,850000,1300000,2000000];
    const base=curve[clamp(tier,0,curve.length-1)]||20000;
    const mult=kit.vip?1.75:kit.hyper?1.50:kit.wins?1.25:1;
    const raw=base*mult,round=raw>=1000000?10000:raw>=100000?1000:100;
    return Math.max(round,Math.ceil(raw/round)*round);
  }
  function repairKitCount(id){return Math.max(0,Math.floor(Number(S?.repairKits?.[id])||0));}
  const POTION_SPECIAL_TIERS=Object.freeze(["exclusive","vip","hyper"]);
  function potionAllTierIds(){return [...RARITIES.map(r=>r.id),...POTION_SPECIAL_TIERS];}
  function potionTierId(inst){
    if(inst?.hyper)return "hyper";
    if(inst?.vip)return "vip";
    if(inst?.exclusive)return "exclusive";
    return RARITIES[clamp(Math.floor(inst?.rarity||0),0,RARITIES.length-1)]?.id||"common";
  }
  function normalizePotionTierId(value){
    const raw=String(value??"").trim().toLowerCase(),simple=raw.normalize?.("NFD").replace(/[\u0300-\u036f]/g,"")||raw;
    const compact=simple.replace(/[._\s-]+/g,"");
    const aliases={
      common:"common",gewohnlich:"common",normal:"common",basic:"common",
      uncommon:"uncommon",ungewohnlich:"uncommon",
      rare:"rare",selten:"rare",
      epic:"epic",episch:"epic",
      legendary:"legendary",legendar:"legendary",
      special:"special",spezial:"special",
      mythic:"mythic",mythisch:"mythic",
      exotic:"exotic",exotisch:"exotic",
      universe:"universe",universum:"universe",
      blackhole:"blackhole",
      galaxy:"galaxy",galaxie:"galaxy",
      cosmic:"cosmic",kosmisch:"cosmic",
      godly:"godly",gottlich:"godly",
      exclusive:"exclusive",exklusiv:"exclusive",
      vip:"vip",
      hyper:"hyper",hyperkarte:"hyper",hyperkarten:"hyper"
    };
    if(POTION_SPECIAL_TIERS.includes(raw)||RARITY_INDEX[raw]!==undefined)return raw;
    return aliases[compact]||null;
  }
  function normalizePotionTypeId(value){
    const raw=String(value??"").trim().toLowerCase(),simple=raw.normalize?.("NFD").replace(/[\u0300-\u036f]/g,"")||raw,compact=simple.replace(/[._\s-]+/g,"");
    const aliases={life:"life",leben:"life",lebens:"life",lebenstrank:"life",hp:"life",health:"life",power:"power",kraft:"power",krafttrank:"power",schaden:"power",damage:"power",guard:"guard",schutz:"guard",schutztrank:"guard",defense:"guard",defence:"guard",xp:"xp",erfahrung:"xp",erfahrungstrank:"xp",xptrank:"xp",points:"points",point:"points",punkte:"points",punktetrank:"points",pointstrank:"points"};
    if(POTION_TYPES.some(x=>x.id===raw))return raw;
    return aliases[compact]||null;
  }
  function potionTierIndex(tierId){const normalized=normalizePotionTierId(tierId)||"common";if(normalized==="exclusive")return exclusiveCombatTier();if(normalized==="vip")return vipCombatTier();if(normalized==="hyper")return hyperSupportTier();return clamp(RARITY_INDEX[normalized]??0,0,RARITIES.length-1);}
  function potionTierMeta(tierId){const t=normalizePotionTierId(tierId)||"common";if(t==="exclusive")return {id:t,name:"Exclusive",symbol:"🩸",className:"rar-exclusive",special:true};if(t==="vip")return {id:t,name:"VIP",symbol:"💎",className:"rar-vip",special:true};if(t==="hyper")return {id:t,name:"Hyper",symbol:"⚡",className:"rar-hyper",special:true};const r=RARITIES[RARITY_INDEX[t]]||RARITIES[0];return {id:r.id,name:r.name,symbol:r.symbol,className:`rar-${r.id}`,special:false};}
  function potionType(typeId){const normalized=normalizePotionTypeId(typeId)||"life";return POTION_TYPES.find(x=>x.id===normalized)||POTION_TYPES[0];}
  function potionKey(tierId,typeId){return `${normalizePotionTierId(tierId)||tierId}:${normalizePotionTypeId(typeId)||typeId}`;}
  function potionCount(tierId,typeId){const t=normalizePotionTierId(tierId),type=normalizePotionTypeId(typeId);if(!t||!type)return 0;return Math.max(0,Math.floor(Number(S?.potionInventory?.[`${t}:${type}`])||0));}
  function potionTierTotal(tierId){return POTION_TYPES.reduce((sum,p)=>sum+potionCount(tierId,p.id),0);}
  function potionInventoryTotal(){return potionAllTierIds().reduce((sum,tier)=>sum+potionTierTotal(tier),0);}
  function potionTierLabel(tierId){return potionTierMeta(tierId).name;}
  function normalizePotionInventory(){
    if(!S)return false;
    const out={},setCount=(tierId,typeId,value)=>{const tier=normalizePotionTierId(tierId),type=normalizePotionTypeId(typeId),count=Math.max(0,Math.floor(Number(value)||0));if(!tier||!type||count<1)return;const key=`${tier}:${type}`;out[key]=Math.max(out[key]||0,count);};
    const parseFlat=(key,value)=>{
      const parts=String(key||"").split(/[:|/._-]+/).filter(Boolean);
      if(parts.length>=2){const aTier=normalizePotionTierId(parts[0]),aType=normalizePotionTypeId(parts.slice(1).join("")),bType=normalizePotionTypeId(parts[0]),bTier=normalizePotionTierId(parts.slice(1).join(""));if(aTier&&aType)return setCount(aTier,aType,value);if(bTier&&bType)return setCount(bTier,bType,value);}
      const compact=String(key||"").replace(/[:|/._\s-]+/g,"");for(const tier of potionAllTierIds()){for(const type of POTION_TYPES.map(x=>x.id)){if(compact.toLowerCase()===`${tier}${type}`||compact.toLowerCase()===`${type}${tier}`)return setCount(tier,type,value);}}
    };
    const ingest=source=>{if(!source||typeof source!=="object")return;for(const [key,value] of Object.entries(source)){if(value&&typeof value==="object"&&!Array.isArray(value)){const tier=normalizePotionTierId(key);if(tier){for(const [type,count] of Object.entries(value))setCount(tier,type,count);continue;}const type=normalizePotionTypeId(key);if(type){for(const [nestedTier,count] of Object.entries(value))setCount(nestedTier,type,count);continue;}}parseFlat(key,value);}};
    ingest(S.potionInventory);ingest(S.potions);ingest(S.potionStock);ingest(S.potionItems);
    const before=JSON.stringify(S.potionInventory||{}),after=JSON.stringify(out);if(before===after)return false;S.potionInventory=out;return true;
  }
  // ===== V375 TRANK-MEISTERSCHAFT + 3-RUNDEN-QUEUE =====
  const POTION_MASTERY_MAX=3;
  const POTION_MASTERY_NAMES=Object.freeze(["Basis","Veredelt","Arkan","Prisma-MAX"]);
  function potionMasteryKey(tierId,typeId){return potionKey(tierId,typeId);}
  function normalizePotionMastery(){
    if(!S)return false;const before=JSON.stringify(S.potionMastery||{}),out={};
    for(const [key,val] of Object.entries(S.potionMastery||{})){const [tier,type]=String(key).split(":");const nt=normalizePotionTierId(tier),np=normalizePotionTypeId(type);if(!nt||!np)continue;out[`${nt}:${np}`]={uses:Math.max(0,Math.floor(Number(val?.uses)||0)),stage:clamp(Math.floor(Number(val?.stage)||0),0,POTION_MASTERY_MAX)};}
    S.potionMastery=out;return before!==JSON.stringify(out);
  }
  function potionMastery(tierId,typeId){const key=potionMasteryKey(tierId,typeId),raw=S?.potionMastery?.[key]||{};return {key,uses:Math.max(0,Math.floor(Number(raw.uses)||0)),stage:clamp(Math.floor(Number(raw.stage)||0),0,POTION_MASTERY_MAX)};}
  function potionMasteryStage(tierId,typeId){return potionMastery(tierId,typeId).stage;}
  function potionMasteryName(tierId,typeId){return POTION_MASTERY_NAMES[potionMasteryStage(tierId,typeId)]||POTION_MASTERY_NAMES[0];}
  function potionMasteryRequirement(stage){return clamp(Math.floor(Number(stage)||0),1,POTION_MASTERY_MAX)*100;}
  function potionMaxEffect(tierId,typeId){const id=normalizePotionTierId(tierId)||"common",tier=potionTierIndex(id),boost=id==="hyper"?1.08:id==="vip"?1.06:id==="exclusive"?1.04:1;let pct=0,cap=.45;if(typeId==="life"){pct=(.25+tier*.035)*boost;cap=.70;}else if(typeId==="power"){pct=(.20+tier*.03)*boost;cap=.60;}else if(typeId==="guard"){pct=(.12+tier*.025)*boost;cap=.45;}else if(typeId==="xp"){pct=(.16+tier*.022)*boost;cap=.50;}else if(typeId==="points"){pct=(.18+tier*.024)*boost;cap=.55;}return Math.min(cap,pct);}
  function potionEffect(tierId,typeId,stage=potionMasteryStage(tierId,typeId)){const max=potionMaxEffect(tierId,typeId),base=max/1.09;return Math.min(max,base*(1+.03*clamp(stage,0,POTION_MASTERY_MAX)));}
  function potionPrice(tierId,typeId){const id=normalizePotionTierId(tierId)||"common",tier=potionTierIndex(id),r=RARITIES[tier]||RARITIES[0],type=potionType(typeId),specialMult=id==="hyper"?1.35:id==="vip"?1.25:id==="exclusive"?1.15:1,base=Math.max(500,r.price*specialMult);const raw=Math.max(500,base*type.priceMult),round=raw>=1e9?1e6:raw>=1e7?1e5:raw>=1e5?1000:raw>=1e4?100:50;return Math.ceil(raw/round)*round;}
  function potionEffectValueText(typeId,effect){const pct=(Math.max(0,Number(effect)||0)*100).toLocaleString("de-DE",{maximumFractionDigits:1});return typeId==="life"?`+${pct} % Leben`:typeId==="power"?`+${pct} % Schaden`:typeId==="guard"?`-${pct} % erlittener Schaden`:typeId==="xp"?`+${pct} % Kampf-XP`:`+${pct} % Kampf-Points`;}
  function potionEffectText(tierId,typeId){return potionEffectValueText(typeId,potionEffect(tierId,typeId));}
  function potionMaxEffectText(tierId,typeId){return potionEffectValueText(typeId,potionMaxEffect(tierId,typeId));}
  function potionMasteryClass(tierId,typeId){return `potion-mastery-${potionMasteryStage(tierId,typeId)}`;}
  function recordPotionUse(tierId,typeId,count=1){const m=potionMastery(tierId,typeId);S.potionMastery[m.key]={uses:m.uses+Math.max(1,Math.floor(Number(count)||1)),stage:m.stage};}
  function upgradePotionMastery(tierId,typeId){const m=potionMastery(tierId,typeId),type=potionType(typeId);if(m.stage>=POTION_MASTERY_MAX)return toast(`${type.name} ist bereits Prisma-MAX.`);const need=potionMasteryRequirement(m.stage+1);if(m.uses<need)return toast(`${type.name}: ${need-m.uses} Anwendungen bis zur nächsten Meisterschaft.`);S.potionMastery[m.key]={uses:m.uses,stage:m.stage+1};persist();showPotionTierShop(tierId);refresh(true);toast(`${type.icon} ${type.name} → ${POTION_MASTERY_NAMES[m.stage+1]} · Wirkung +3 %.`);}
  function normalizePotionQueueEntry(entry,inst=null){if(!entry)return null;const rawType=typeof entry==="string"?entry:entry.typeId||entry.type,rawTier=typeof entry==="object"?entry.tierId:null,typeId=normalizePotionTypeId(rawType),tierId=normalizePotionTierId(rawTier||potionTierId(inst));return typeId&&tierId?{tierId,typeId}:null;}
  function potionQueue(inst){if(!inst)return[];if(!Array.isArray(inst.battlePotions))inst.battlePotions=[];return inst.battlePotions;}
  function potionQueueCount(inst){return potionQueue(inst).length;}
  function preparedPotionMetaFromEntry(inst,entry){const normalized=normalizePotionQueueEntry(entry,inst);if(!normalized)return null;const {tierId,typeId}=normalized,type=potionType(typeId),stage=potionMasteryStage(tierId,typeId),effect=potionEffect(tierId,typeId,stage);return {tierId,typeId,name:type.name,icon:type.icon,stage,stageName:POTION_MASTERY_NAMES[stage],effect,effectText:potionEffectValueText(typeId,effect)};}
  function preparedPotionsMeta(inst){return potionQueue(inst).map(x=>preparedPotionMetaFromEntry(inst,x)).filter(Boolean);}
  function preparedPotionMeta(inst,index=0){return preparedPotionMetaFromEntry(inst,potionQueue(inst)[index]);}
  function returnPreparedPotion(inst,index=0){const q=potionQueue(inst);if(!q.length)return null;const i=clamp(Math.floor(Number(index)||0),0,q.length-1),entry=q.splice(i,1)[0],p=preparedPotionMetaFromEntry(inst,entry);if(!p)return null;const key=potionKey(p.tierId,p.typeId);S.potionInventory[key]=potionCount(p.tierId,p.typeId)+1;return p;}
  function returnPreparedPotions(inst){const returned=[];while(potionQueue(inst).length){const p=returnPreparedPotion(inst,0);if(p)returned.push(p);}return returned;}
  function consumePreparedPotion(inst){const q=potionQueue(inst);if(!q.length)return null;const entry=q.shift(),p=preparedPotionMetaFromEntry(inst,entry);if(p)recordPotionUse(p.tierId,p.typeId,1);return p;}
  function battleUnlockedTier(){return clamp(Math.floor(Number(S?.battleTierUnlocked)||0),0,RARITIES.length-1);}
  function battleCardUnlocked(inst){return !!inst&&!isCardOnExpedition(inst.id)&&(inst.hyper||inst.exclusive||inst.vip||combatTier(inst)<=battleUnlockedTier());}
  function battleCardUsable(inst){return !!inst&&!inst.broken&&!inst.listed&&!isCardOnExpedition(inst.id)&&battleCardUnlocked(inst);}
  function battleCardBlockReason(inst){
    if(!inst)return "Keine Kampfkarte gewählt.";
    if(inst.broken)return "Diese Karte ist kaputt und muss zuerst repariert werden.";
    if(inst.listed)return "Diese Karte ist am Markt gelistet und kann nicht kämpfen.";
    if(isCardOnExpedition(inst.id))return "Diese Karte ist gerade auf Expedition und kann nicht kämpfen.";
    if(!battleCardUnlocked(inst))return `${battleTierLabel(inst)}-Karten sind im Kartenkampf noch gesperrt.`;
    return "";
  }
  function battleTierWinCounts(inst,current=battleUnlockedTier()){
    if(!inst||inst.broken)return false;
    if(inst.hyper||inst.exclusive||inst.vip)return true;
    return combatTier(inst)===current;
  }
  function battleLifetimeWins(){return Math.max(0,Math.floor(Number(S?.battleWins)||0))+Math.max(0,Math.floor(Number(S?.onlineBattleWins)||0))+Math.max(0,Math.floor(Number(S?.onlineRankedWins)||0));}
  function battleTierPriorWinRequirement(current=battleUnlockedTier()){
    let total=0;for(let i=0;i<Math.max(0,current);i++)total+=Math.max(0,Math.floor(Number(BATTLE_UPGRADES[i]?.wins)||0));return total;
  }
  function repairBattleTierProgressV423(){
    const current=battleUnlockedTier(),next=BATTLE_UPGRADES[current]||null;if(!next)return false;
    const stored=Math.max(0,Math.floor(Number(S?.battleTierWins)||0));
    // V423-Recovery: Frühere Exclusive-/VIP-/Hyper- und Online-Siege wurden teilweise
    // nicht in battleTierWins geschrieben. Aus den gesamten Kampfsiegen wird deshalb
    // nur der Anteil oberhalb der bereits abgeschlossenen Stufen rekonstruiert.
    const inferred=Math.max(0,Math.min(next.wins,battleLifetimeWins()-battleTierPriorWinRequirement(current)));
    const repaired=Math.max(stored,inferred);
    if(repaired<=stored)return false;S.battleTierWins=repaired;return true;
  }
  function recordBattleTierWin(inst){
    const current=battleUnlockedTier(),next=BATTLE_UPGRADES[current]||null;if(!next||!battleTierWinCounts(inst,current))return false;
    S.battleTierWins=Math.min(next.wins,Math.max(0,Math.floor(Number(S.battleTierWins)||0))+1);return true;
  }
  function battleUpgradeInfo(){
    const current=battleUnlockedTier(),next=BATTLE_UPGRADES[current]||null;
    if(next)repairBattleTierProgressV423();
    return {current,next,wins:Math.max(0,Math.floor(Number(S?.battleTierWins)||0)),max:current>=RARITIES.length-1};
  }
  function battleTierLabel(inst){const tier=combatTier(inst);return RARITIES[tier]?.name||`Stufe ${tier+1}`;}
  function combatStats(inst){
    if(!inst)return {tier:0,min:0,max:0,hp:0,power:0,aura:null};
    const tier=combatTier(inst),range=(inst.exclusive||inst.vip)?premiumCombatRange(tier):(COMBAT_RANGES[tier]||COMBAT_RANGES[0]);
    const rv=inst.exclusive?(EXCLUSIVES.find(x=>x.id===inst.exclusiveId)?.rarityValue||100):inst.win?(winCardBy(inst.winId)?.chance||100):rarityValue(inst.base);
    const scarcity=clamp(1-(Math.max(.1,rv)-.1)/99.9,0,1);
    let quality=.90+scarcity*.20;
    if(inst.exclusive){
      const exIndex=Math.max(0,EXCLUSIVES.findIndex(x=>x.id===inst.exclusiveId));
      quality=.94+(exIndex/Math.max(1,EXCLUSIVES.length-1))*.12;
    }else if(inst.vip){
      const vm=vipCardBy(inst.vipId),slot=Math.max(0,VIP_CARDS.findIndex(x=>x.id===inst.vipId));quality=.95+(slot%8)*.012+(clamp(Number(vm?.rarity)||0,0,12)/12)*.02;
    }else if(inst.hyper){
      const hm=hyperCardBy(inst.hyperId)||HYPER_CARDS[0];quality=.98+clamp(Number(hm?.tier)||0,0,6)*.018;
    }
    const levelMult=COMBAT_LEVEL_MULT[clamp(inst.level||1,1,5)]||1;
    const premium=!!(inst.exclusive||inst.vip||inst.hyper),cardRbMult=cardRebirthTotalMultiplier(inst),jkDamageMult=damageBoosterMultiplier();
    const aura=combatAuraBy(inst.combatAura),auraMult=aura?.mult||1,trail=inst?._previewTrail?trailBy(inst.trail):activeTrail(inst),trailDamage=1+(trail?.damage||0),trailHp=1+(trail?.hp||0),rankMult=inst.hyper?1:rankBonusMultiplier(inst);
    // V386: Bei Premiumkarten zählt jetzt auch die bereits investierte persönliche
    // Ausrüstung leicht mit in den Kampfwert. Kampf-Aura/Spur bleiben die starken
    // Kampfboni; normale Aura, Bindung und Shiny geben nur einen kleinen Support-
    // Bonus. Dadurch wird eine stark ausgebaute Rebirth-/Rank-Premiumkarte sichtbar
    // stärker als eine nackte normale Karte derselben Raritätsstufe.
    const supportAura=premium&&inst.aura?1+Math.min(.06,Math.max(0,(auraBy(inst.aura)?.mult||1)-1)*.05):1;
    const supportBind=premium&&inst.bind?1+Math.min(.08,Math.max(0,(bindBy(inst.bind)?.mult||1)-1)*.05):1;
    const supportShiny=premium?1+clamp(Math.floor(Number(inst.shiny)||0),0,3)*.03:1;
    const premiumSupport=supportAura*supportBind*supportShiny;
    const hyperSetMult=inst.hyper?hyperSetCombatMultiplier():1,premiumFactor=inst.hyper?hyperCombatMultiplier(inst):premium?premiumCombatRarityFactor(inst,tier):(inst.win?(winCardBy(inst.winId)?.powerFactor||1):1),vipWheelDamage=vipWheelMultiplier("damage");
    const coreMin=Math.max(1,Math.floor(range.min*quality*levelMult*auraMult*trailDamage*premiumFactor*premiumSupport*vipWheelDamage*hyperSetMult));
    const coreMax=Math.max(coreMin+1,Math.ceil(range.max*quality*levelMult*auraMult*trailDamage*premiumFactor*premiumSupport*vipWheelDamage*hyperSetMult));
    const ultimateCombat=ultimateSetMultiplier(),baseMin=Math.max(1,Math.floor(coreMin*cardRbMult*jkDamageMult)),baseMax=Math.max(baseMin+1,Math.ceil(coreMax*cardRbMult*jkDamageMult));
    const min=Math.max(1,Math.floor(baseMin*rankMult*ultimateCombat)),max=Math.max(min+1,Math.ceil(baseMax*rankMult*ultimateCombat)),avg=(min+max)/2,coreAvg=(coreMin+coreMax)/2;
    // Karten-Rebirth verstärkt Kampfwerte einmalig; der JK-Schadensbooster verändert nur Schaden, nicht Leben.
    // Beim Hyper-Set gilt derselbe 3/5/10/16-Bonus bewusst auf den gesamten Lebenswert, nicht nur auf den Schadenskern.
    const hpCoreAvg=inst.hyper?coreAvg/Math.max(1,hyperSetMult):coreAvg;
    const hp=Math.max(45,Math.round((hpCoreAvg*5.5+(tier+1)*35*Math.sqrt(levelMult))*trailHp*rankMult*cardRbMult*ultimateCombat*hyperSetMult));
    let power=Math.max(1,Math.round(avg+hp*.16));
    const battleScale=Math.max(.05,Number(inst?.battleScale)||1);
    if(battleScale!==1){
      const scaledMin=Math.max(1,Math.floor(min*battleScale)),scaledMax=Math.max(scaledMin+1,Math.ceil(max*battleScale)),scaledHp=Math.max(45,Math.round(hp*battleScale));
      power=Math.max(1,Math.round(((scaledMin+scaledMax)/2)+scaledHp*.16));
      return {tier,min:scaledMin,max:scaledMax,hp:scaledHp,power,aura,trail,battleScale};
    }
    return {tier,min,max,hp,power,aura,trail,battleScale:1};
  }
  function rollCombatDamage(stats){return Math.max(1,Math.floor(stats.min+Math.random()*(stats.max-stats.min+1)));}
  function combatAbilityProfile(inst){
    if(inst?.hyper)return {burst:3,specials:[
      {id:"hyper-rend",icon:"⚡",name:"Hyper-Riss",mult:1.62,req:1,desc:"Hyper-Basis-Special · skaliert mit Rank und Generation."},
      {id:"generation-break",icon:"🐺",name:"Generationsbruch",mult:2.05,req:3,desc:"Ab Kartenstufe 3 · hoher Hyper-Kampfschaden."},
      {id:"godbreaker",icon:"🌩️",name:"Godbreaker",mult:2.62,req:5,desc:"Ab Kartenstufe 5 · Endgame-Angriff der Hyper-Karten."}
    ]};
    if(inst?.exclusive)return {burst:1,specials:[
      {id:"blood-strike",icon:"🩸",name:"Blutstoß",mult:1.45,req:1,desc:"Kräftiger Blutangriff."},
      {id:"blood-moon",icon:"🌑",name:"Blutmond",mult:1.85,req:4,desc:"Ab Kartenstufe 4 freigeschaltet."}
    ]};
    const tier=clamp(Math.floor(inst?.rarity||0),0,12);
    const profiles=[
      {burst:0,specials:[]},
      {burst:1,specials:[{id:"quick-hit",icon:"✨",name:"Schneller Hieb",mult:1.22,req:1,desc:"Kleine Special-Attacke."}]},
      {burst:1,specials:[{id:"power-hit",icon:"💥",name:"Kraftstoß",mult:1.38,req:1,desc:"Stärkere Special-Attacke."}]},
      {burst:1,specials:[{id:"arcane-hit",icon:"🔮",name:"Arkaner Schlag",mult:1.55,req:1,desc:"Epischer Special-Schlag."}]},
      {burst:2,specials:[{id:"legend-hit",icon:"⚡",name:"Legendärer Schlag",mult:1.62,req:1,desc:"Zweimal hintereinander möglich."}]},
      {burst:1,specials:[{id:"red-flash",icon:"🔴",name:"Roter Blitz",mult:1.68,req:1,desc:"Erste Special-Fähigkeit."},{id:"breaker",icon:"🗡",name:"Brecher",mult:1.86,req:1,desc:"Zweite Special-Fähigkeit."}]},
      {burst:2,specials:[{id:"mythic-wave",icon:"🟡",name:"Mythische Welle",mult:1.76,req:1,desc:"Mythischer Angriff."},{id:"mythic-crush",icon:"🔱",name:"Mythischer Brecher",mult:1.98,req:1,desc:"Zweimalige Special-Kette möglich."}]},
      {burst:2,specials:[{id:"exotic-pulse",icon:"💠",name:"Exotic Pulse",mult:1.86,req:1,desc:"Exotische Energie."},{id:"phase-rift",icon:"🌀",name:"Phasenriss",mult:2.08,req:3,desc:"Freischaltung ab Stufe 3."}]},
      {burst:2,specials:[{id:"starfall",icon:"🌌",name:"Sternenfall",mult:1.96,req:1,desc:"Universe-Angriff."},{id:"nova",icon:"☄️",name:"Nova",mult:2.16,req:3,desc:"Ab Stufe 3."},{id:"cosmic-ray",icon:"🌠",name:"Kosmischer Strahl",mult:2.32,req:4,desc:"Ab Stufe 4."}]},
      {burst:3,specials:[{id:"gravity",icon:"⚫",name:"Gravitationsstoß",mult:2.02,req:1,desc:"Black-Hole-Angriff."},{id:"singularity",icon:"🕳️",name:"Singularität",mult:2.25,req:3,desc:"Ab Stufe 3."},{id:"event-horizon",icon:"⭕",name:"Ereignishorizont",mult:2.48,req:5,desc:"Ab Stufe 5."}]},
      {burst:3,specials:[{id:"galaxy-slash",icon:"🌠",name:"Galaxy Slash",mult:2.08,req:1,desc:"Galaxy-Angriff."},{id:"supernova",icon:"💫",name:"Supernova",mult:2.34,req:3,desc:"Ab Stufe 3."},{id:"star-core",icon:"⭐",name:"Sternenkern",mult:2.56,req:4,desc:"Ab Stufe 4."}]},
      {burst:3,specials:[{id:"cosmic-burst",icon:"🔥",name:"Cosmic Burst",mult:2.18,req:1,desc:"Kosmischer Angriff."},{id:"void-flare",icon:"🌋",name:"Void Flare",mult:2.42,req:3,desc:"Ab Stufe 3."},{id:"time-break",icon:"⌛",name:"Zeitbruch",mult:2.68,req:4,desc:"Ab Stufe 4."},{id:"world-end",icon:"☀️",name:"Weltenende",mult:2.88,req:5,desc:"Ab Stufe 5."}]},
      {burst:4,specials:[{id:"divine-hit",icon:"👑",name:"Göttlicher Schlag",mult:2.28,req:1,desc:"Göttliche Basisfähigkeit."},{id:"judgement",icon:"⚖️",name:"Urteil",mult:2.50,req:2,desc:"Ab Stufe 2."},{id:"heaven-break",icon:"⚡",name:"Himmelsbruch",mult:2.76,req:3,desc:"Ab Stufe 3."},{id:"final-light",icon:"🌟",name:"Letztes Licht",mult:3.05,req:4,desc:"Ab Stufe 4."}]}
    ];
    return profiles[tier]||profiles[0];
  }
  function repairCost(inst){
    if(!inst)return 0;
    const level=clamp(Math.floor(Number(inst.level)||1),1,5);
    const tier=combatTier(inst),r=RARITIES[tier]||RARITIES[0],kitId=repairKitId(inst);
    if(inst.hyper||inst.exclusive||inst.vip||inst.win){
      const kitPrice=repairKitPrice(kitId),factor=inst.hyper?(.22+level*.05):inst.vip?(.24+level*.055):inst.win?(.20+level*.05):(.18+level*.045),raw=kitPrice*factor;
      return Math.max(500,Math.ceil(raw/100)*100);
    }
    const rarityBase=Math.max(1000,Number(r.price)||1000);
    return Math.max(500,Math.ceil((rarityBase*(0.16+level*.055))/50)*50);
  }
  function battleActorState(){return {specialUsed:0,mustNormal:false};}
  function combatAbilities(inst,actorState){
    const profile=combatAbilityProfile(inst),level=clamp(inst?.level||1,1,5),locked=!!actorState?.mustNormal;
    const rows=[{id:"strike",icon:"👊",name:"Schlag",mult:1,req:1,normal:true,desc:locked?"Pflichtschlag – danach sind Specials wieder bereit.":"Normaler Angriff."}];
    for(const sp of profile.specials)rows.push({...sp,locked:locked||level<(sp.req||1)});
    return rows;
  }
  function abilityById(inst,id){return combatAbilities(inst,{mustNormal:false}).find(x=>x.id===id)||null;}
  function applyAbilityUse(inst,actorState,ability){
    const profile=combatAbilityProfile(inst);
    if(ability.normal){actorState.specialUsed=0;actorState.mustNormal=false;return;}
    actorState.specialUsed=Math.max(0,actorState.specialUsed||0)+1;
    if(actorState.specialUsed>=Math.max(1,profile.burst||1))actorState.mustNormal=true;
  }
  function abilityDamage(inst,stats,ability,bonusMult=1){
    const level=clamp(inst?.level||1,1,5),levelSkill=1+(level-1)*.055;
    const masterySkill=ability.normal?1:1+rankSpecialBonus(inst);
    const base=rollCombatDamage(stats),mult=ability.normal?(.90+Math.random()*.20):(Number(ability.mult)||1)*levelSkill*masterySkill;
    return Math.max(1,Math.round(base*mult*Math.max(.1,Number(bonusMult)||1)));
  }
  function sellValue(inst){if(!inst)return 0;const rb=cardRebirthTotalMultiplier(inst),fusionValue=fusionVariant(inst)==="prismatic"?1.35:fusionVariant(inst)==="holo"?1.15:1;if(inst.hyper){const hm=hyperCardBy(inst.hyperId)||HYPER_CARDS[0],p=RARITIES[hm.rarity]?.price||150000;return Math.max(1,Math.floor(p*.10*(1+hm.tier*.18)*(1+(hyperGeneration(inst)-1)*.20)*(1+(inst.level-1)*.35)*rb*fusionValue));}if(inst.vip){const p=Math.max(1,premiumProductionBase(inst)*(LEVEL_MULT[inst.level]||1));return Math.max(1,Math.floor(p*2.2*(1+(inst.shiny||0)*.16)*pointCardRebirthMultiplier(inst)*fusionValue));}if(inst.exclusive){const p=Math.max(1,premiumProductionBase(inst)*(LEVEL_MULT[inst.level]||1));return Math.max(1,Math.floor(p*1.8*(1+(inst.shiny||0)*.16)*pointCardRebirthMultiplier(inst)*fusionValue));}const r=RARITIES[inst.rarity],rv=inst.win?(winCardBy(inst.winId)?.chance||100):rarityValue(inst.base),scarcity=1+2.5*Math.pow(1-rv/100,2),levelValue=1+(inst.level-1)*.45,shiny=1+(inst.shiny||0)*.22;return Math.max(1,Math.floor(r.price*.06*scarcity*levelValue*shiny*rb*fusionValue));}
  function instance(id){return id?S.instances[id]||null:null;}
  function duplicateIds(inst){if(!inst)return[];const key=collectionKey(inst),deployed=new Set(S.floors.flat().filter(Boolean));return Object.values(S.instances).filter(x=>x.id!==inst.id&&x.id!==S.featuredCardId&&collectionKey(x)===key&&cardRebirth(x)===0&&fusionVariant(x)==="normal"&&!isCardOnExpedition(x.id)&&!x.listed&&!x.locked&&!x.favorite&&!deployed.has(x.id)).map(x=>x.id);}
  let collectionOwnedIndexCache=null;
  let collectionScoreCache=null;
  function invalidateCollectionRenderCache(){collectionOwnedIndexCache=null;collectionScoreCache=null;}
  function collectionOwnedIndex(){
    if(collectionOwnedIndexCache)return collectionOwnedIndexCache;
    const maps=Array.from({length:17},()=>new Map());
    for(const inst of Object.values(S.instances||{})){
      if(!inst)continue;
      const tier=inst.hyper?16:inst.win?15:inst.vip?14:inst.exclusive?13:clamp(Math.floor(Number(inst.rarity)||0),0,12),key=collectionKey(inst),map=maps[tier],arr=map.get(key);
      if(arr)arr.push(inst);else map.set(key,[inst]);
    }
    collectionOwnedIndexCache=maps;
    return maps;
  }
  function collectionCount(){return Object.keys(S.collection).length;}
  function exclusiveCount(){return Object.keys(S.exclusiveCollection).length;}

  // V388: Score-Werte ändern sich nur bei echten Karten-/Upgrade-Mutationen.
  // Sie werden deshalb einmal berechnet und beim nächsten persist() gezielt verworfen.
  function collectionScoreSnapshot(){
    if(collectionScoreCache)return collectionScoreCache;
    const tiers=Array(17).fill(0),rebirthTiers=Array(17).fill(0);
    for(let tier=0;tier<RARITIES.length;tier++){
      const max=BASE_NAMES.length*5;let got=0,gotRb=0;
      for(let base=0;base<BASE_NAMES.length;base++){
        const row=S.collection?.[variantKey(tier,base)];
        got+=clamp(Number(row?.highestLevel)||0,0,5);
        gotRb+=clamp(Number(row?.highestRebirth)||0,0,CARD_REBIRTH_MAX);
      }
      tiers[tier]=max?clamp(got/max*100,0,100):0;
      rebirthTiers[tier]=max?clamp(gotRb/max*100,0,100):0;
    }
    let gotExclusive=0,rbExclusive=0;
    for(const ex of EXCLUSIVES){const row=S.exclusiveCollection?.[`x:${ex.id}`];gotExclusive+=clamp(Number(row?.highestLevel)||0,0,5);rbExclusive+=clamp(Number(row?.highestRebirth)||0,0,5);}
    tiers[13]=EXCLUSIVES.length?clamp(gotExclusive/(EXCLUSIVES.length*5)*100,0,100):0;
    rebirthTiers[13]=EXCLUSIVES.length?clamp(rbExclusive/(EXCLUSIVES.length*5)*100,0,100):0;

    let gotVip=0,rbVip=0;
    for(const vm of VIP_CARDS){const row=S.vipCollection?.[`v:${vm.id}`];gotVip+=clamp(Number(row?.highestLevel)||0,0,5);rbVip+=clamp(Number(row?.highestRebirth)||0,0,5);}
    tiers[14]=VIP_CARDS.length?clamp(gotVip/(VIP_CARDS.length*5)*100,0,100):0;
    rebirthTiers[14]=VIP_CARDS.length?clamp(rbVip/(VIP_CARDS.length*5)*100,0,100):0;

    let gotWins=0,rbWins=0;
    for(const wm of WIN_CARDS){const row=S.winCollection?.[`w:${wm.id}`];gotWins+=clamp(Number(row?.highestLevel)||0,0,5);rbWins+=clamp(Number(row?.highestRebirth)||0,0,5);}
    tiers[15]=WIN_CARDS.length?clamp(gotWins/(WIN_CARDS.length*5)*100,0,100):0;
    rebirthTiers[15]=WIN_CARDS.length?clamp(rbWins/(WIN_CARDS.length*5)*100,0,100):0;

    let gotHyper=0,hyperRebirthScore=0;
    for(const hm of HYPER_CARDS){
      const row=S.hyperCollection?.[`h:${hm.id}`];
      gotHyper+=clamp(Number(row?.highestLevel)||0,0,5);
      const rb=clamp(Number(row?.highestRebirth)||0,0,5)/5;
      const gen=clamp((Number(row?.highestGeneration)||1)-1,0,3)/3;
      // Hyper besitzt neben Karten-Rebirth noch Generationen:
      // 70 % des Hyper-Rebirth-Scores kommen aus RB 0–5, 30 % aus Generation 1–4.
      hyperRebirthScore+=rb*.70+gen*.30;
    }
    tiers[16]=HYPER_CARDS.length?clamp(gotHyper/(HYPER_CARDS.length*5)*100,0,100):0;
    rebirthTiers[16]=HYPER_CARDS.length?clamp(hyperRebirthScore/HYPER_CARDS.length*100,0,100):0;

    const totalVariants=RARITIES.length*BASE_NAMES.length;
    let earned=0;for(let tier=0;tier<RARITIES.length;tier++)earned+=tiers[tier]*(BASE_NAMES.length/100);
    const overall=totalVariants?clamp(earned/totalVariants*100,0,100):0;
    const payVariants=EXCLUSIVES.length+VIP_CARDS.length;
    const pay=payVariants?clamp((tiers[13]*(EXCLUSIVES.length/100)+tiers[14]*(VIP_CARDS.length/100))/payVariants*100,0,100):0;

    const rebirthWeights=[
      ...Array(RARITIES.length).fill(BASE_NAMES.length),
      EXCLUSIVES.length,VIP_CARDS.length,WIN_CARDS.length,HYPER_CARDS.length
    ];
    let rbEarned=0,rbTotal=0;
    for(let tier=0;tier<17;tier++){const w=rebirthWeights[tier]||0;rbEarned+=rebirthTiers[tier]/100*w;rbTotal+=w;}
    const rebirthOverall=rbTotal?clamp(rbEarned/rbTotal*100,0,100):0;

    collectionScoreCache={tiers,overall,pay,wins:tiers[15],hyper:tiers[16],rebirthTiers,rebirthOverall};
    return collectionScoreCache;
  }

  function collectionTierScore(tier){return collectionScoreSnapshot().tiers[clamp(Math.floor(Number(tier)||0),0,16)]||0;}
  function overallCollectionScore(){return collectionScoreSnapshot().overall;}
  function payCollectionScore(){return collectionScoreSnapshot().pay;}
  function rebirthTierScore(tier){return collectionScoreSnapshot().rebirthTiers[clamp(Math.floor(Number(tier)||0),0,16)]||0;}
  function overallRebirthScore(){return collectionScoreSnapshot().rebirthOverall||0;}
  function rebirthScoreTierLabel(tier){
    const t=clamp(Math.floor(Number(tier)||0),0,16);
    if(t<13)return RARITIES[t]?.name||"Gewöhnlich";
    return t===13?"Exclusive":t===14?"VIP":t===15?"Wins":"Hyper";
  }
  function rebirthScoreOptionsHtml(){
    const selected=clamp(Math.floor(Number(UI.rebirthScoreTier)||0),0,16);
    const rows=[...RARITIES.map((r,i)=>[i,r.name]),[13,"Exclusive"],[15,"Wins"],[14,"VIP"],[16,"Hyper"]];
    return rows.map(([i,label])=>`<option value="${i}" ${selected===i?"selected":""}>${esc(label)} · ${scorePct(rebirthTierScore(i))}</option>`).join("");
  }
  function scorePct(n){const v=clamp(n,0,100);return v.toLocaleString("de-DE",{minimumFractionDigits:v>=100?0:1,maximumFractionDigits:2})+" %";}
  function collectionComplete(){return overallCollectionScore()>=99.999999;}

  const FIELD_PERMIT_COSTS=Object.freeze([0,150000,600000,2500000,10000000,40000000,150000000,500000000,1500000000,4000000000,10000000000,25000000000,60000000000]);
  function fieldPermitCost(inst){if(!inst||inst.exclusive)return 0;const base=Math.max(0,Number(FIELD_PERMIT_COSTS[clamp(inst.rarity,0,FIELD_PERMIT_COSTS.length-1)])||0),gap=Math.max(1,inst.rarity-floorMaxTier(UI.floor));return Math.max(base,Math.round(base*(1+Math.max(0,gap-1)*.65)));}
  function hasEarlyFieldVipAccess(){return !!S?.vipUnlocked||UI.role==="owner";}
  function needsFieldPermit(inst,floor=UI.floor){if(!inst||inst.exclusive||inst.vip)return false;return inst.rarity>floorMaxTier(floor)&&!(hasEarlyFieldVipAccess()&&inst.fieldPermit);}

  function addInstance(data){const id=uid(),inst={id,rarity:Math.floor(data.rarity||0),base:Math.floor(data.base||0),level:1,cardRebirth:0,rank:0,rankMastery:0,rankEliteWins:0,rankWins:0,rankedAt:0,backupCardId:null,aura:null,combatAura:null,bind:null,shiny:0,fusion:"normal",battlePotions:[],battlePotion:null,broken:false,brokenAt:0,favorite:false,locked:false,listed:false,hyper:!!data.hyper,hyperId:data.hyperId||null,hyperGeneration:clamp(Math.floor(Number(data.hyperGeneration)||1),1,HYPER_GENERATION_MAX),win:!!data.win,winId:data.winId||null,winPack:data.winPack??null,vip:!!data.vip,vipId:data.vipId||null,exclusive:!!data.exclusive,exclusiveId:data.exclusiveId||null,basePower:data.basePower||null,createdAt:now()};S.instances[id]=inst;invalidateCardPowerCache();const key=collectionKey(inst),col=cardCollectionMap(inst);const wasNew=!col[key];col[key]=col[key]||{firstAt:now(),highestLevel:1,highestRebirth:0,...(inst.hyper?{highestGeneration:1}:{})};if(wasNew){S.daily.newCards=(S.daily.newCards||0)+1;raiseScore(inst.hyper?1800+(hyperCardBy(inst.hyperId)?.tier||0)*500+Math.round(2500/Math.max(.1,data.rarityValue||100)):inst.win?650+(inst.rarity+1)*100+Math.round(1500/Math.max(.01,data.rarityValue||100)):inst.vip?400+(inst.rarity+1)*90:inst.exclusive?2500+Math.round(20000/(Math.max(.1,data.rarityValue||100))):100+Math.round((inst.rarity+1)*80+250/Math.max(.1,rarityValue(inst.base))),"collection");}return {inst,wasNew};}
  function rollWeighted(rows){let total=rows.reduce((s,x)=>s+Number(x[1]||0),0),r=Math.random()*total;for(const row of rows){r-=row[1];if(r<=0)return row[0]}return rows.at(-1)[0];}
  function rollBaseIndex(){let r=Math.random()*INTERNAL_WEIGHT_SUM;for(let i=0;i<500;i++){r-=INTERNAL_VALUES[i];if(r<=0)return i}return 499;}
  function rollNormal(packRarity){const table=DROP_TABLES[RARITIES[packRarity].id],rarity=rollWeighted(table),base=rollBaseIndex(),tierChance=(table.find(x=>x[0]===rarity)?.[1]||0)/100,actual=tierChance*(rarityValue(base)/INTERNAL_WEIGHT_SUM)*100;const added=addInstance({rarity,base});return {...added,actualChance:actual,rarityValue:rarityValue(base)};}
  function invalidateCardPowerCache(){cardPowerRevision++;premiumNormalBaseCacheKey="";setOwnedVariantCacheRev=-1;setOwnedVariantCache=null;fusionSummaryCacheRev=-1;fusionSummaryCache=null;}
  function strongestUsableNormalBase(){
    const maxTier=premiumReferenceTier(),cacheKey=`${cardPowerRevision}:${maxTier}`;
    if(cacheKey===premiumNormalBaseCacheKey)return premiumNormalBaseCacheValue;
    let best=1;
    for(const id in (S.instances||{})){
      const inst=S.instances[id];
      if(!inst||inst.hyper||inst.exclusive||inst.vip||inst.win||inst.rarity>maxTier)continue;
      best=Math.max(best,cardBaseProduction(inst.rarity,inst.base)*(LEVEL_MULT[inst.level]||1));
    }
    premiumNormalBaseCacheKey=cacheKey;premiumNormalBaseCacheValue=best;return best;
  }
  function rollExclusive(){const ex=EXCLUSIVES[rollWeighted(EXCLUSIVES.map((x,i)=>[i,x.chance]))],basePower=strongestUsableNormalBase()*ex.strength,added=addInstance({exclusive:true,exclusiveId:ex.id,basePower,rarityValue:ex.rarityValue});return {...added,exclusiveMeta:ex,actualChance:ex.chance,rarityValue:ex.rarityValue};}
  function rollVipCard(forceRarity=null){const rarity=forceRarity===null?vipCardRarityRoll():clamp(Math.floor(Number(forceRarity)||0),0,12),pool=VIP_CARDS.filter(x=>x.rarity===rarity),fallback=VIP_CARDS.filter(x=>x.rarity<=rarity),vm=(pool.length?pool:fallback)[Math.floor(Math.random()*Math.max(1,(pool.length?pool:fallback).length))]||VIP_CARDS[0],added=addInstance({vip:true,vipId:vm.id,rarity:vm.rarity,basePower:vipBasePower(vm),rarityValue:vm.rarityValue});return {...added,vipMeta:vm,actualChance:0,rarityValue:vm.rarityValue};}
  function vipPackRarityRows(){return VIP_RARITY_WEIGHTS.map((weight,rarity)=>[rarity,Number(weight)||0]).filter(x=>x[1]>0);}
  function vipPackRarityChances(){const rows=vipPackRarityRows(),total=rows.reduce((n,x)=>n+x[1],0)||1;return rows.map(([rarity,weight])=>({rarity,weight,chance:weight/total*100}));}
  function rollVipPackCard(){const rarity=rollWeighted(vipPackRarityRows()),pool=VIP_CARDS.filter(x=>x.rarity===rarity),vm=(pool.length?pool:VIP_CARDS)[Math.floor(Math.random()*Math.max(1,(pool.length?pool:VIP_CARDS).length))]||VIP_CARDS[0],added=addInstance({vip:true,vipId:vm.id,rarity:vm.rarity,basePower:vipBasePower(vm),rarityValue:vm.rarityValue});return {...added,vipMeta:vm,actualChance:(vipPackRarityChances().find(x=>x.rarity===vm.rarity)?.chance||0)/Math.max(1,pool.length),rarityValue:vm.rarityValue};}
  function rollWinCard(packIndex){const pack=WIN_PACKS[clamp(Math.floor(Number(packIndex)||0),0,WIN_PACKS.length-1)]||WIN_PACKS[0],card=rollWeighted(pack.cards.map(x=>[x,x.chance])),added=addInstance({win:true,winId:card.id,winPack:packIndex,rarity:card.rarity,base:card.base,rarityValue:card.chance});return {...added,winMeta:card,actualChance:card.chance,rarityValue:card.chance};}
  async function openWinPack(packIndex){const pack=WIN_PACKS[clamp(Math.floor(Number(packIndex)||0),0,WIN_PACKS.length-1)];if(!pack)return;const floor=S.phase+1;if(floor<pack.floor)return toast(`${pack.name} wird erst ab Stockwerk ${pack.floor} freigeschaltet.`);if(S.winsCurrency<pack.cost)return toast(`Du brauchst ${pack.cost} Wins. Aktuell: ${S.winsCurrency}/${WIN_CAP}.`);if(!await gameConfirm({title:`${pack.icon} ${pack.name} öffnen`,message:`5 Karten aus einem eigenen 50-Karten-Wins-Pool.\nSeltenste Karte dieses Packs: exakt 0,01 %.\nKosten: ${pack.cost} Wins`,confirmText:`${pack.cost} Wins einsetzen`,icon:pack.icon,tone:"points"}))return;S.winsCurrency-=pack.cost;const results=Array.from({length:5},()=>rollWinCard(packIndex));S.daily.opened=(S.daily.opened||0)+1;recordBossPackOpen();addXp(80+(packIndex+1)*30);awardMainXp(5+packIndex*2,"BigCards.kl Wins Pack",`bc-wins-pack-${packIndex}-${now()}`);showPackReveal(results,{name:pack.name,wins:true,paidWins:pack.cost});persist();}
  async function openVipPack(){if(!await confirmJkPackPurchase("VIP PACK · 5 VIP-Karten",500))return;if(!window.JKCoinApp?.spend?.(500,"BigCards VIP PACK"))return toast("Du brauchst 500 JK-Coins.");const results=Array.from({length:5},()=>rollVipPackCard());S.daily.opened=(S.daily.opened||0)+1;recordBossPackOpen();addXp(220);awardMainXp(10,"BigCards.kl VIP Pack",`bc-vip-pack-${now()}`);showPackReveal(results,{name:"VIP PACK",vip:true,paidJk:500});persist();}

  function awardMainXp(amount,reason,key,showToast=false){try{return window.JKGamesAwardMainGameXp?.("bigcards",amount,reason,{eventKey:key,toast:!!showToast})||0}catch{return 0}}
  function raiseScore(amount){S.lifetimeScore=Math.max(Number(S.lifetimeScore)||0,(Number(S.lifetimeScore)||0)+Math.max(0,Math.floor(amount||0)));}
  function updateScoreHighWater(){const p=productionPerSecond(),x=xpPerSecond();if(p>S.highestProductionEver){raiseScore(Math.max(1,Math.round(Math.log10(1+p)*160)),"production");S.highestProductionEver=p}if(x>S.highestXpProductionEver){raiseScore(Math.max(1,Math.round(Math.log10(1+x)*100)),"xp");S.highestXpProductionEver=x}S.maxLevelEver=Math.max(S.maxLevelEver||1,S.level||1);}
  function xpNeed(level){const l=Math.max(1,level);return Math.floor(45*Math.pow(l,1.64)*(1+S.phase*.18));}
  function addXp(xp){const beforeLevel=S.level;xp=Math.max(0,xp)*vipWheelMultiplier("xp")*ultimateSetMultiplier();S.xp+=xp;let guard=0;while(S.xp>=xpNeed(S.level)&&guard++<100){S.xp-=xpNeed(S.level);S.level++;S.maxLevelEver=Math.max(S.maxLevelEver,S.level);raiseScore(12+Math.floor(Math.sqrt(S.level)*6));if(S.level%10===0)toast(`BigCards Level ${S.level} erreicht!`)}if(S.level!==beforeLevel)scheduleLeaderboardProfileSync();return S.level;}
  function activeInstances(){const out=[];for(let f=0;f<S.unlockedFloors;f++)for(const id of S.floors[f]){const inst=instance(id);if(inst)out.push(inst)}return out;}
  function productionPerSecond(){return activeInstances().reduce((sum,x)=>sum+effectivePoints(x),0);}
  function xpPerSecond(){return activeInstances().reduce((sum,x)=>sum+effectiveXp(x),0)*vipWheelMultiplier("xp");}
  function collectPending(){const amount=Math.floor(S.pendingPoints||0),stored=Math.max(0,Number(S.fieldStoredSeconds)||0);if(!amount&&!stored)return toast("Noch keine Points zum Einsammeln.");S.fieldStoredSeconds=0;if(amount){S.pendingPoints-=amount;const credited=Math.floor(amount*vipWheelMultiplier("points"));S.points+=credited;S.lifetimePointsEarned+=credited;raiseScore(Math.max(1,Math.floor(Math.log10(1+amount)*2)));awardMainXp(Math.min(12,1+Math.floor(Math.log10(1+amount))),"BigCards.kl Collect",`bc-collect-${Math.floor(now()/5000)}`);}persist();refresh();toast(amount?`+${fmt(Math.floor(amount*vipWheelMultiplier("points")))} Points eingesammelt · Spielfeld-Speicher geleert`:"Spielfeld-Speicher geleert. Die Produktion läuft wieder.");}

  function dailyKey(){const d=new Date();return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;}
  function ensureDaily(){const key=dailyKey();if(S.daily?.day!==key)S.daily={day:key,opened:0,upgraded:0,newCards:0,claimed:{}};}
  function dailyQuestHtml(){ensureDaily();const quests=[{id:"packs",label:"5 Packs öffnen",v:S.daily.opened||0,max:5,reward:"250 Shards"},{id:"up",label:"2 Karten upgraden",v:S.daily.upgraded||0,max:2,reward:"500 Shards"},{id:"new",label:"3 neue Karten finden",v:S.daily.newCards||0,max:3,reward:"Basic Aura"}];return quests.map(q=>`<div class="bc-quest"><div><b>${q.label}</b><small>${Math.min(q.v,q.max)}/${q.max} · ${q.reward} · <strong>+50 Haupt-XP</strong></small></div>${q.v>=q.max&&!S.daily.claimed[q.id]?`<button data-bc-claim="${q.id}">Holen</button>`:`<span>${S.daily.claimed[q.id]?"✓":"…"}</span>`}</div>`).join("")}
  function claimDaily(id){
    ensureDaily();if(S.daily.claimed[id])return;
    const req=id==="packs"?5:id==="up"?2:3,val=id==="packs"?S.daily.opened:id==="up"?S.daily.upgraded:S.daily.newCards;
    if((val||0)<req)return;
    if(id==="packs")S.shards+=250;if(id==="up")S.shards+=500;if(id==="new"){S.auraInventory.basic=(S.auraInventory.basic||0)+1;S.equipmentRewards[equipmentRewardKey("aura","basic")]=true;}
    S.daily.claimed[id]=true;
    awardMainXp(50,"BigCards.kl Daily Card Quest",`bc-daily-${S.daily.day}-${id}`,true);
    persist();refresh();toast("Daily Card Quest erledigt · +50 Haupt-XP",3300);
  }

  async function confirmJkPackPurchase(packName,cost){
    return gameConfirm({title:"JK/Coin-Ausgabe bestätigen",message:`${packName}\nKosten: ${fmt(cost)} JK/Coin\n\nDie JK/Coins werden erst nach deiner Bestätigung abgezogen.`,confirmText:`Für ${fmt(cost)} JK/Coin öffnen`,cancelText:"Nicht kaufen",icon:"💎",tone:"jk"});
  }

  function rollHyperCard(){
    const hm=rollWeighted(HYPER_CARDS.map(x=>[x,x.chance])),added=addInstance({hyper:true,hyperId:hm.id,hyperGeneration:1,rarity:hm.rarity,base:hm.base,rarityValue:hm.chance});
    return {...added,hyperMeta:hm,actualChance:hm.chance,rarityValue:hm.chance};
  }
  async function openHyperPack(currency="points"){
    const pointCost=hyperPackPointPrice();
    if(currency==="jk"){
      if(!await confirmJkPackPurchase("HYPER PACK · 2 Kampfkarten",HYPER_JK_PRICE))return;
      if(!window.JKCoinApp?.spend?.(HYPER_JK_PRICE,"BigCards HYPER PACK"))return toast(`Du brauchst ${HYPER_JK_PRICE} JK-Coins.`);
    }else{
      if(S.points<pointCost)return toast(`Dir fehlen ${fmt(pointCost-S.points)} Points für das Hyper Pack.`);
      S.points-=pointCost;
    }
    const results=Array.from({length:2},()=>rollHyperCard());let coreFound=false;
    if(Math.random()<hyperPackCoreChance()){S.hyperCores=(S.hyperCores||0)+1;coreFound=true;}
    S.daily.opened=(S.daily.opened||0)+1;recordBossPackOpen();addXp(70);awardMainXp(8,"BigCards.kl Hyper Pack",`bc-hyper-${now()}`);
    showPackReveal(results,{name:"HYPER PACK",hyper:true,paid:currency==="points"?pointCost:0,paidJk:currency==="jk"?HYPER_JK_PRICE:0,hyperCore:coreFound});persist();
    if(coreFound)setTimeout(()=>toast("⚡ HYPER-KERN gefunden! Wird für Generation 3/4 benötigt.",5200),700);
  }
  async function craftHyperCore(){
    const mult=prestigeHyperCraftMultiplier(),wins=Math.max(1,Math.ceil(HYPER_CORE_CRAFT_WINS*mult)),dust=Math.max(1,Math.ceil(HYPER_CORE_CRAFT_DUST*mult));
    if(S.winsCurrency<wins)return toast(`Du brauchst ${wins} Wins.`);
    if(S.fusionDust<dust)return toast(`Du brauchst ${fmt(dust)} Fusionsstaub.`);
    if(!await gameConfirm({title:"⚡ Hyper-Kern herstellen",message:`${wins} Wins + ${fmt(dust)} Fusionsstaub${mult<1?"\nPrestige-Schmied: -10 % Kosten":""}

Hyper-Kerne werden für die hohen Hyper-Generationen benötigt.`,confirmText:"Hyper-Kern herstellen",icon:"⚡",tone:"danger"}))return;
    S.winsCurrency-=wins;S.fusionDust-=dust;S.hyperCores=(S.hyperCores||0)+1;persist();refresh(true);toast(`⚡ Hyper-Kern hergestellt · Bestand ${S.hyperCores}`);
  }
  function hyperGenerationCostText(gen){const c=HYPER_GENERATION_COSTS[gen];if(!c)return"MAX";return `↻${c.rebirth} · R${c.rank} · ${c.wins} Wins · ${fmt(c.dust)} Staub${c.cores?` · ${c.cores} Hyper-Kern${c.cores===1?"":"e"}`:""}`;}
  async function upgradeHyperGeneration(id){
    const inst=instance(id);if(!inst?.hyper)return;const current=hyperGeneration(inst),next=current+1,cost=HYPER_GENERATION_COSTS[next];if(!cost)return toast("Generation 4 ist bereits MAX.");
    if(cardRebirth(inst)<cost.rebirth)return toast(`Generation ${next} benötigt Karten-Rebirth ${cost.rebirth}.`);
    if(cardRank(inst)<cost.rank)return toast(`Generation ${next} benötigt Rank ${cost.rank}. Setze die Hyper-Karte als persönliche Karte ein und meistere ihren Rank.`);
    if(S.winsCurrency<cost.wins)return toast(`Generation ${next} benötigt ${cost.wins} Wins.`);
    if(S.fusionDust<cost.dust)return toast(`Generation ${next} benötigt ${fmt(cost.dust)} Fusionsstaub.`);
    if((S.hyperCores||0)<cost.cores)return toast(`Generation ${next} benötigt ${cost.cores} Hyper-Kern${cost.cores===1?"":"e"}.`);
    if(!await gameConfirm({title:`🐺 Hyper Generation ${current} → ${next}`,message:`${cardMeta(inst).name}\n${hyperGenerationCostText(next)}\n\nGeneration erhöht hauptsächlich die Kampfkraft. Produktion/XP bleiben absichtlich deutlich schwächer als bei normalen Premiumkarten.`,confirmText:`Generation ${next} entwickeln`,icon:"⚡",tone:"danger"}))return;
    S.winsCurrency-=cost.wins;S.fusionDust-=cost.dust;S.hyperCores=Math.max(0,(S.hyperCores||0)-cost.cores);inst.hyperGeneration=next;const hKey=collectionKey(inst),hCol=cardCollectionMap(inst);hCol[hKey]=hCol[hKey]||{firstAt:Number(inst.createdAt)||now(),highestLevel:Math.max(1,inst.level||1),highestRebirth:cardRebirth(inst),highestGeneration:1};hCol[hKey].highestGeneration=Math.max(Number(hCol[hKey].highestGeneration)||1,next);invalidateCardPowerCache();repairFeaturedIdentityV424();persist();refresh(false);showCardDetail(id);toast(`⚡ ${cardMeta(inst).name} ist jetzt Hyper Generation ${next}.`,5000);
  }
  function packChanceText(n){return `${Number(n).toLocaleString("de-DE",{minimumFractionDigits:Number(n)<.1?2:0,maximumFractionDigits:Number(n)<.1?4:2})} %`;}
  function showNormalPackInfo(index){const r=RARITIES[clamp(Math.floor(Number(index)||0),0,RARITIES.length-1)],table=DROP_TABLES[r.id]||[];showModal(`<div class="bc-pack-info-modal"><small>${r.symbol} ${r.name.toUpperCase()} · PACK-INFO</small><h2>${r.name}-Pack</h2><p>10 Karten pro Pack. Die Prozentwerte unten sind die <b>Raritätschance pro Ziehung</b>. Innerhalb der gezogenen Rarität entscheidet zusätzlich der Raritätswert der konkreten Karte.</p><div class="bc-pack-odds">${table.map(([tier,chance])=>{const rr=RARITIES[tier];return `<article class="rar-${rr.id}"><b>${rr.symbol} ${rr.name}</b><span>${packChanceText(chance)}</span></article>`}).join("")}</div><p><b>Points:</b> ${fmt(r.price)} · <b>JK/Coin:</b> ${fmt(r.jk)}. JK/Coin kann ein regulär noch gesperrtes Pack früher öffnen.</p><button class="bc-primary" data-bc-modal-close>Verstanden</button></div>`);}
  function showWinPackInfo(index){const pack=WIN_PACKS[clamp(Math.floor(Number(index)||0),0,WIN_PACKS.length-1)]||WIN_PACKS[0];showModal(`<div class="bc-pack-info-modal"><small>${pack.icon} WINS PACK · INFO</small><h2>${esc(pack.name)}</h2><p>5 Ziehungen aus genau 50 eigenen Wins-Karten. Kosten: <b>${pack.cost} Wins</b> · Freischaltung ab Stockwerk ${pack.floor}.</p><div class="bc-pack-odds long">${pack.cards.map(c=>`<article class="rar-${RARITIES[c.rarity]?.id||"common"}"><b>${esc(c.name)}</b><span>${packChanceText(c.chance)}</span></article>`).join("")}</div><button class="bc-primary" data-bc-modal-close>Verstanden</button></div>`);}
  function showVipPackInfo(){const rows=vipPackRarityChances();showModal(`<div class="bc-pack-info-modal"><small>👑 VIP PACK · INFO</small><h2>100 VIP-Karten</h2><p>5 VIP-Karten pro Pack · <b>500 JK/Coin</b>. Der Raritätswurf gilt pro Karte; innerhalb der Rarität wird gleichmäßig aus den dort vorhandenen VIP-Karten gewählt. Maximal ausgebaut zielt VIP im Kampf ungefähr auf den <b>Galaxy-Bereich</b>.</p><div class="bc-pack-odds">${rows.map(x=>{const r=RARITIES[x.rarity],count=VIP_CARDS.filter(v=>v.rarity===x.rarity).length;return `<article class="rar-${r.id}"><b>${r.symbol} ${r.name} · ${count} Karten</b><span>${packChanceText(x.chance)}</span></article>`}).join("")}</div><button class="bc-primary" data-bc-modal-close>Verstanden</button></div>`);}
  function showHyperInfo(){const price=hyperPackPointPrice();showModal(`<div class="bc-pack-info-modal bc-hyper-info"><small>⚡ HYPER PACK · KAMPF-ENDGAME</small><h2>Hyper-Karten</h2><p>2 Hyper-Karten · <b>${fmt(price)} Points</b> bei aktuell ${Math.floor(S.totalRebirths||0)} Account-Rebirths oder <b>${HYPER_JK_PRICE} JK/Coin</b>. Hyper-Karten produzieren bewusst deutlich weniger Points und XP. Ihre XP nutzt jetzt ebenfalls eine eigene stark reduzierte Selten-Basis; Generation steigert XP nur vorsichtig und Hyper-Rank gibt weder Points noch XP. Im Kartenkampf skalieren sie als einzige Premiumart besonders stark mit <b>Rank + Karten-Rebirth + Generation + Fusion</b>.</p><div class="bc-hyper-rules"><article><b>Generation 1 → 2</b><span>${hyperGenerationCostText(2)}</span></article><article><b>Generation 2 → 3</b><span>${hyperGenerationCostText(3)}</span></article><article><b>Generation 3 → 4</b><span>${hyperGenerationCostText(4)}</span></article><article><b>Hyper-Kern</b><span>${HYPER_CORE_CRAFT_WINS} Wins + ${fmt(HYPER_CORE_CRAFT_DUST)} Fusionsstaub · zusätzlich ${packChanceText(hyperPackCoreChance()*100)} Kernchance pro Hyper-Pack${hyperPackCoreChance()>HYPER_CORE_PACK_CHANCE?" (inkl. vollem Hyper-Set-Bonus)":""}.</span></article></div><p><b>Set-Regel:</b> Hyper-Karten gehören ausschließlich zum normalen <b>Hyper Set</b>, das Ocean ersetzt. 3/5/10/16 Karten geben +3/+6/+10/+15 % Hyper-Kampfwerte; 16/16 erhöht zusätzlich die Hyper-Kernchance auf 7 %. Keine Points-/XP-Setverstärkung.</p><p><b>Endgame:</b> Eine vollständig ausgebaute Generation-4-Hyperkarte mit Rank 10, Karten-Rebirth 5, Prismatic-Fusion, starker Kampf-Aura und Spur kann im reinen Kartenkampf <b>über Göttlich hinausgehen</b>. Dafür bleibt ihre Wirtschaftsleistung absichtlich schwach.</p><div class="bc-pack-odds long">${HYPER_CARDS.map(h=>`<article class="rar-hyper"><b>G1 · ${esc(h.name)} · ${esc(h.tierName)}</b><span>${packChanceText(h.chance)}</span></article>`).join("")}</div><button class="bc-primary" data-bc-modal-close>Verstanden</button></div>`);}
  function showWinsInfo(){showModal(`<div class="bc-pack-info-modal"><small>🏆 WINS · INFO</small><h2>Wins-Währung</h2><p>Wins bekommst du aus Kartenkampf-Siegen. Die Siegesserie erhöht die Auszahlung: 1–2 = 1 Win, 3–4 = 2, 5–6 = 3, 7–9 = 4 und ab 10 = 5 Wins pro Sieg. Bestand: maximal ${WIN_CAP}.</p><div class="bc-auto-info-grid"><article><b>Wins Packs</b><span>Öffnen die fünf eigenen 50er-Kartenpools.</span></article><article><b>Rebirth</b><span>Account-Rebirths benötigen auf höheren Stufen zusätzlich Wins.</span></article><article><b>Material & Boss</b><span>20 Wins → Fusionsstaub, 35 → Wins Reparatur-Pack, 50 → Boss-Ticket.</span></article><article><b>Hyper-Endgame</b><span>Generationen benötigen Wins. Hyper-Kerne können für ${HYPER_CORE_CRAFT_WINS} Wins + ${fmt(HYPER_CORE_CRAFT_DUST)} Fusionsstaub hergestellt werden.</span></article></div><button class="bc-primary" data-bc-modal-close>Verstanden</button></div>`);}
  async function openNormalPack(rarityIndex,currency="points"){
    const r=RARITIES[rarityIndex];if(!r)return;
    if(currency==="points"){
      // Point-Packs bleiben bewusst ohne Bestätigungsabfrage: Klick = direkt öffnen.
      if(rarityIndex>rarityUnlockedIndex())return toast(`Noch gesperrt: ${r.name}. Mit JK-Coins kannst du das Pack trotzdem früher kaufen.`);
      if(S.points<r.price)return toast(`Dir fehlen ${fmt(r.price-S.points)} Points.`);
      S.points-=r.price;
    }else if(currency==="credit"){
      // Bereits gekaufte Credits werden nicht ein zweites Mal bestätigt.
      if((S.jkPackCredits[r.id]||0)<1)return false;S.jkPackCredits[r.id]--;
    }else{
      // Direkte JK/Coin-Ausgabe muss immer vorher bestätigt werden.
      if(!await confirmJkPackPurchase(`${r.name}-Pack · 10 Karten`,r.jk))return;
      if(!window.JKCoinApp?.spend?.(r.jk,`BigCards ${r.name}-Pack`))return toast("Nicht genügend JK-Coins.");
    }
    const results=Array.from({length:10},()=>rollNormal(rarityIndex));S.daily.opened=(S.daily.opened||0)+1;recordBossPackOpen();addXp(20+(rarityIndex+1)*10);awardMainXp(2+(rarityIndex>7?3:1),"BigCards.kl Pack",`bc-pack-${now()}-${Math.random()}`);showPackReveal(results,{name:`${r.name}-Pack`,exclusive:false,paid:r.price});persist();
  }
  async function openExclusivePack(currency="jk"){
    if(currency==="credit"){
      if(S.exclusiveCredits<1)return false;S.exclusiveCredits--;
    }else{
      if(!await confirmJkPackPurchase("EXCLUSIVE PACK · 5 Karten",100))return;
      if(!window.JKCoinApp?.spend?.(100,"BigCards EXCLUSIVE PACK"))return toast("Du brauchst 100 JK-Coins.");
    }
    const results=Array.from({length:5},()=>rollExclusive());S.daily.opened=(S.daily.opened||0)+1;recordBossPackOpen();addXp(160);awardMainXp(8,"BigCards.kl Exclusive Pack",`bc-exclusive-${now()}`);showPackReveal(results,{name:"EXCLUSIVE PACK",exclusive:true,paidJk:100});persist();
  }
  function resultCard(result,index,total){const inst=result.inst,meta=cardMeta(inst),status=result.wasNew?"NEU":"DUPLIKAT",label=inst.hyper?`HYPER · G${hyperGeneration(inst)} · ${meta.hyperTier?.name||""}`:inst.win?"WINS":inst.vip?`VIP · ${meta.rarity.name}`:inst.exclusive?"EXCLUSIVE":meta.rarity.name;return `<article class="bc-reveal-card ${meta.className} ${inst.exclusive?"exclusive":""} ${result.rarityValue<=.4?"secret":""}"><div class="bc-card-art"><span>${meta.icon}</span><em class="bc-reveal-status ${result.wasNew?"is-new":"is-dupe"}">${status}</em>${cardEffectBadges(inst)}</div><small>${label} · ${index+1}/${total}</small><h2>${esc(meta.name)}</h2><div class="bc-card-tags"><b>Raritätswert ${pct(result.rarityValue)}</b><b>Packchance ${pct(result.actualChance)}</b></div><p>${fmt(meta.points)} Points/s · ${fmt(meta.xp)} XP/s</p><p>⚔ Kampfwert ${fmt(meta.combat.power)} · Schaden ${fmt(meta.combat.min)}–${fmt(meta.combat.max)}</p><p>Wert ${fmt(meta.value)} Points</p></article>`;}
  function showPackReveal(results,pack){UI.packReveal={results,pack,index:-1};renderReveal();}
  function renderReveal(){const pr=UI.packReveal;if(!pr||!UI.overlay)return;let modal=UI.overlay.querySelector("[data-bc-reveal]");if(!modal){modal=document.createElement("div");modal.className="bc-reveal-overlay";modal.dataset.bcReveal="1";UI.overlay.append(modal)}if(pr.index<0){modal.innerHTML=`<div class="bc-pack-stage ${packClass(pr.pack)}"><button class="bc-skip" data-bc-skip-reveal>Alles überspringen</button><button class="bc-pack-object" data-bc-start-reveal aria-label="Pack öffnen"><span>BIG</span><b>CARDS</b><small>${esc(pr.pack.name)}</small></button><div class="bc-pack-energy"></div><h2>Dein Pack ist bereit</h2><p>${pr.pack.hyper?"Tippe auf das Hyper Pack – Kampfkarten mit eigenem Generation-Endgame.":pr.pack.exclusive?"Tippe auf das Pack und öffne den Blutnebel selbst.":"Klicke auf das Pack, wenn du es öffnen möchtest."}</p><strong class="bc-pack-tap">PACK ANTIPPEN / ANKLICKEN</strong></div>`;return}
    if(pr.index<pr.results.length){const result=pr.results[pr.index];modal.innerHTML=`<div class="bc-reveal-stage ${result.rarityValue<=.4?"bc-secret-stage":""}"><button class="bc-skip" data-bc-skip-reveal>Alles überspringen</button>${resultCard(result,pr.index,pr.results.length)}<button class="bc-next-card" data-bc-next-card>Nächste Karte →</button></div>`;return}
    const rows=pr.results.map(r=>cardMeta(r.inst)),newCount=pr.results.filter(r=>r.wasNew).length,rarest=Math.min(...pr.results.map(r=>r.rarityValue)),prod=rows.reduce((s,m)=>s+m.points,0),value=rows.reduce((s,m)=>s+m.value,0),bestTier=Math.max(...pr.results.filter(r=>!r.inst.exclusive).map(r=>r.inst.rarity),0),grade=packGrade(value,rarest,bestTier,pr.pack.exclusive);S.packHistory.unshift({at:now(),name:pr.pack.name,rarest,value,prod,newCount});S.packHistory=S.packHistory.slice(0,20);modal.innerHTML=`<div class="bc-pack-summary"><small>GESAMTPACK</small><h2>${grade}</h2><div class="bc-summary-stats"><b>${pr.results.length} Karten</b><b>Seltenste: ${pct(rarest)}</b><b>Produktion: ${fmt(prod)}/s</b><b>Gesamtwert: ${fmt(value)}</b><b>Neue Karten: ${newCount}</b><b>Duplikate: ${pr.results.length-newCount}</b>${pr.pack.hyperCore?`<b>⚡ HYPER-KERN +1</b>`:""}</div><div class="bc-summary-grid">${pr.results.map((r,i)=>`<div class="bc-mini-card ${cardMeta(r.inst).className}"><span class="bc-mini-status ${r.wasNew?"is-new":"is-dupe"}">${r.wasNew?"NEU":"DUPLIKAT"}</span><b>${esc(cardMeta(r.inst).name)}</b><small>${r.inst.hyper?`HYPER · G${hyperGeneration(r.inst)}`:r.inst.win?"WINS":r.inst.vip?`VIP · ${RARITIES[r.inst.rarity].name}`:r.inst.exclusive?"EXCLUSIVE":RARITIES[r.inst.rarity].name} · ${pct(r.rarityValue)} · ⚔ ${fmt(cardMeta(r.inst).combat.power)}</small></div>`).join("")}</div><button class="bc-primary" data-bc-close-reveal>Pack übernehmen</button></div>`;persist();}
  function packClass(pack){return pack.hyper?"hyper-pack":pack.exclusive?"exclusive-pack":pack.vip?"vip-pack":"normal-pack"}
  function packGrade(value,rare,best,exclusive){if(exclusive&&rare<=.5)return "GOD PACK";if(rare<=.1||best>=12)return "GOD PACK";if(rare<=.4||best>=11)return "INSANE PACK";if(best>=9)return "EPIC PACK";if(best>=6)return "GREAT PACK";return "GOOD PACK"}

  function cardMeta(inst){if(!inst)return null;const combat=combatStats(inst),fusionClass=fusionVariant(inst)==="prismatic"?"fusion-prismatic":fusionVariant(inst)==="holo"?"fusion-holo":"";if(inst.hyper){const hm=hyperCardBy(inst.hyperId)||HYPER_CARDS[0],tm=hyperTierMeta(hm),gen=hyperGeneration(inst);return {name:hm.name,rarity:{id:"hyper",name:tm.name},className:`rar-hyper hyper-gen-${gen} hyper-tier-${tm.id} ${fusionClass} ${cardRebirthClass(inst)}`,icon:"",art:HYPER_ART[gen],rarityValue:hm.chance,points:effectivePoints(inst),xp:effectiveXp(inst),value:sellValue(inst),combat,hyper:true,hyperTier:tm,generation:gen}}if(inst.win){const wm=winCardBy(inst.winId)||WIN_CARDS[0],r=RARITIES[clamp(wm?.rarity||inst.rarity,0,12)]||RARITIES[0];return {name:wm?.name||"Wins-Karte",rarity:r,className:`rar-${r.id} rar-wins ${fusionClass} ${cardRebirthClass(inst)}`,icon:"🏆",rarityValue:wm?.chance||100,points:effectivePoints(inst),xp:effectiveXp(inst),value:sellValue(inst),combat,win:true}}if(inst.vip){const vm=vipCardBy(inst.vipId)||VIP_CARDS[0],r=RARITIES[clamp(vm.rarity,0,12)]||RARITIES[0];return {name:vm.name,rarity:r,className:`rar-${r.id} rar-vip ${fusionClass} ${cardRebirthClass(inst)}`,icon:"👑",rarityValue:vm.rarityValue,points:effectivePoints(inst),xp:effectiveXp(inst),value:sellValue(inst),combat,vip:true}}if(inst.exclusive){const ex=EXCLUSIVES.find(x=>x.id===inst.exclusiveId)||EXCLUSIVES[0];return {name:ex.name,rarity:{id:"exclusive",name:"Exclusive"},className:`rar-exclusive ${fusionClass} ${cardRebirthClass(inst)}`,icon:"🩸",rarityValue:ex.rarityValue,points:effectivePoints(inst),xp:effectiveXp(inst),value:sellValue(inst),combat}}const r=RARITIES[inst.rarity];return {name:BASE_NAMES[inst.base],rarity:r,className:`rar-${r.id} ${fusionClass} ${cardRebirthClass(inst)}`,icon:motifIcon(BASE_NAMES[inst.base]),rarityValue:rarityValue(inst.base),points:effectivePoints(inst),xp:effectiveXp(inst),value:sellValue(inst),combat}}
  function motifIcon(name){if(/Dragon/.test(name))return"🐉";if(/Wolf/.test(name))return"🐺";if(/Raven/.test(name))return"🐦‍⬛";if(/Phoenix/.test(name))return"🔥";if(/Golem/.test(name))return"🗿";if(/Reaper/.test(name))return"☠";if(/Sorcerer/.test(name))return"🔮";if(/Knight|Guardian|Warden/.test(name))return"🛡";if(/Samurai|Ronin/.test(name))return"⚔";if(/Viking|Berserker/.test(name))return"🪓";return"◆"}
  function cardEffectBadges(inst,opts={}){
    if(!inst)return"";const aura=auraBy(inst.aura),combat=combatAuraBy(inst.combatAura),potion=preparedPotionMeta(inst),potionCountQueued=potionQueueCount(inst),trail=trailBy(inst.trail),fusion=fusionVariant(inst),hyper=!!inst.hyper,rank=cardRank(inst),rebirth=cardRebirth(inst),showHyperProgress=opts.hyperProgress!==false,showRebirth=opts.rebirth!==false,hyperProgress=hyper&&showHyperProgress,rebirthVisible=showRebirth&&rebirth;
    if(!aura&&!combat&&!potion&&!trail&&fusion==="normal"&&!rebirthVisible&&!hyperProgress)return"";
    return `<span class="bc-card-effect-badges">${hyperProgress?`<span class="bc-mini-effect hyper-gen" title="Hyper Generation ${hyperGeneration(inst)}">G${hyperGeneration(inst)}</span><span class="bc-mini-effect hyper-rank" title="Hyper Rank ${rank}/10">R${rank}</span>`:""}${aura?`<span class="bc-mini-effect aura" title="${esc(aura.name)}">${aura.icon}</span>`:""}${combat?`<span class="bc-mini-effect combat" title="${esc(combat.name)}"><span class="bc-cross-weapons"><i class="blade">🗡</i><i class="axe">🪓</i></span><small>⚔</small></span>`:""}${potion?`<span class="bc-mini-effect potion" title="${potionCountQueued} Trank-Runden vorbereitet · zuerst ${esc(potion.name)}">🧪<small>${potionCountQueued}</small></span>`:""}${trail?`<span class="bc-mini-effect trail" title="${esc(trail.name)}${S?.featuredCardId===inst.id?" · AKTIV":" · gespeichert"}">☄</span>`:""}${fusionBadgeHtml(inst)}${rebirthVisible?cardRebirthBadge(inst):""}</span>`;
  }
  function battleProgressBadgesHtml(inst){
    if(!inst)return"";const parts=[],rank=cardRank(inst),rebirth=cardRebirth(inst);
    if(inst.hyper)parts.push(`<span class="hyper-gen">G${hyperGeneration(inst)}</span>`);
    if(inst.hyper||rank>0)parts.push(`<span class="rank">R${rank}</span>`);
    if(rebirth>0)parts.push(`<span class="rebirth">↻${rebirth}</span>`);
    return parts.length?`<div class="bc-battle-progress-badges">${parts.join("")}</div>`:"";
  }
  function battleEquipmentBadgesHtml(inst){
    const out=cardEffectBadges(inst,{hyperProgress:false,rebirth:false});
    return out?`<div class="bc-battle-badge-line">${out}</div>`:"";
  }
  function battleDisplayedSpecialAbility(abilities,player){
    const level=clamp(Math.floor(Number(player?.level)||1),1,5),unlocked=(abilities||[]).filter(a=>!a.normal&&level>=(a.req||1));
    if(!unlocked.length)return null;
    return unlocked.slice().sort((a,b)=>(Number(b.req)||1)-(Number(a.req)||1)||(Number(b.mult)||1)-(Number(a.mult)||1))[0]||null;
  }
  function onlineBattleProgressBadgesHtml(card){
    if(!card)return"";const parts=[],rank=Math.max(0,Math.floor(Number(card.rank)||0)),rebirth=Math.max(0,Math.floor(Number(card.rebirth)||0)),hyper=!!card.hyper||String(card.className||"").includes("rar-hyper"),gen=Math.max(1,Math.floor(Number(card.generation)||Number((String(card.className||"").match(/hyper-gen-(\d+)/)||[])[1])||1));
    if(hyper)parts.push(`<span class="hyper-gen">G${gen}</span>`);
    if(hyper||rank>0)parts.push(`<span class="rank">R${rank}</span>`);
    if(rebirth>0)parts.push(`<span class="rebirth">↻${rebirth}</span>`);
    return parts.length?`<div class="bc-battle-progress-badges">${parts.join("")}</div>`:"";
  }
  function collectionEquipmentVisualHtml(inst){
    if(!inst)return"";const aura=auraBy(inst.aura),combat=combatAuraBy(inst.combatAura),bind=bindBy(inst.bind),trail=trailBy(inst.trail),fusion=fusionVariant(inst);
    if(!aura&&!combat&&!bind&&!trail&&fusion==="normal")return"";
    const ai=Math.max(0,AURAS.findIndex(x=>x.id===aura?.id)),ci=Math.max(0,COMBAT_AURAS.findIndex(x=>x.id===combat?.id)),bi=Math.max(0,BINDS.findIndex(x=>x.id===bind?.id)),ti=Math.max(0,TRAILS.findIndex(x=>x.id===trail?.id));
    const ah=(195+ai*29)%360,ch=(8+ci*31)%360,bh=(35+bi*47)%360,th=(170+ti*23)%360;
    return `<span class="bc-collection-visual-fx ${aura?"has-aura":""} ${combat?"has-combat":""} ${bind?"has-bind":""} ${trail?"has-trail":""} ${fusion!=="normal"?`has-fusion fusion-${fusion}`:""}" style="--bc-aura-h:${ah};--bc-combat-h:${ch};--bc-bind-h:${bh};--bc-trail-h:${th}">${aura?'<i class="aura-fx"></i>':""}${combat?'<i class="combat-fx"></i>':""}${bind?'<i class="bind-fx"></i>':""}${trail?'<i class="trail-fx"></i>':""}${fusion!=="normal"?'<i class="fusion-fx"></i>':""}</span>`;
  }
  function bulkLevelUnlocked(){return Math.max(0,Number(S?.bulkLevelUntil)||0)>now();}
  function bulkLevelRemainingMs(){return bulkLevelUnlocked()?Math.max(0,Number(S.bulkLevelUntil)-now()):0;}
  function bulkLevelTimeText(){const sec=Math.max(0,Math.ceil(bulkLevelRemainingMs()/1000)),h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),ss=sec%60;return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(ss).padStart(2,"0")}`;}
  function bulkLevelButtonText(){return bulkLevelUnlocked()?`⚡ Alle Karten leveln · ${bulkLevelTierLabel()} · ⏱ ${bulkLevelTimeText()}`:`🔒 Alle Karten leveln · 24 Std. · 500 JK/Coin`;}
  function refreshBulkLevelLive(){if(!UI.overlay||UI.tab!=="collection")return;const b=UI.overlay.querySelector("[data-bc-bulk-level]");if(b)b.textContent=bulkLevelButtonText();const r=UI.overlay.querySelector("[data-bc-bulk-rebirth]");if(r)r.textContent=bulkRebirthButtonText();}
  function backupProtectedIds(){const ids=new Set();for(const inst of Object.values(S.instances||{})){if(inst?.backupCardId)ids.add(String(inst.backupCardId));}return ids;}
  function bulkLevelTierLabel(){const tier=UI.collectionTier;return tier===16?"Hyper":tier===15?"Wins":tier===14?"VIP":tier===13?"Exclusive":(RARITIES[tier]?.name||"aktuelle Rarität");}
  function bulkLevelGroupKey(inst){return collectionKey(inst);}
  function bulkLevelProtectedDuplicate(inst,deployed,backupIds){
    if(!inst)return true;
    return cardRebirth(inst)>0||inst.id===S.featuredCardId||backupIds.has(String(inst.id))||deployed.has(inst.id)||!!inst.listed||!!inst.locked||!!inst.favorite||!!inst.broken||!!inst.aura||!!inst.combatAura||!!inst.bind||!!inst.trail||potionQueueCount(inst)>0;
  }
  function bulkLevelKeeperScore(inst,deployed,backupIds){
    if(!inst)return -1e15;let score=cardRebirth(inst)*1e10+(Number(inst.level)||1)*1e8+(Number(inst.shiny)||0)*1e7+(Number(cardRank(inst))||0)*1e6+effectivePoints(inst);
    if(inst.id===S.featuredCardId)score+=9e12;if(backupIds.has(String(inst.id)))score+=8e12;if(deployed.has(inst.id))score+=7e12;if(inst.favorite)score+=6e12;if(inst.locked)score+=5e12;if(inst.aura||inst.combatAura||inst.bind||inst.trail||potionQueueCount(inst)>0)score+=4e12;if(inst.listed)score-=2e13;if(inst.broken)score-=1e13;return score;
  }
  function bulkLevelPlan(tier=UI.collectionTier){
    const hyper=tier===16,wins=tier===15,vip=tier===14,exclusive=tier===13,deployed=new Set(S.floors.flat().filter(Boolean)),backupIds=backupProtectedIds(),groups=new Map();
    for(const inst of Object.values(S.instances||{})){
      if(!inst)continue;if(hyper?!inst.hyper:wins?!inst.win:vip?!inst.vip:exclusive?!inst.exclusive:(inst.hyper||inst.win||inst.vip||inst.exclusive||inst.rarity!==tier))continue;
      const key=bulkLevelGroupKey(inst),arr=groups.get(key)||[];arr.push(inst);groups.set(key,arr);
    }
    const simLevels=new Map(),removed=new Set();let points=Number(S.points)||0,totalCost=0,upgrades=0,cardsTouched=0,dupesUsed=0;const steps=[];
    for(const [key,group] of groups){
      const keepers=group.filter(x=>!x.listed&&!x.broken).sort((a,b)=>bulkLevelKeeperScore(b,deployed,backupIds)-bulkLevelKeeperScore(a,deployed,backupIds));
      const keeper=keepers[0];if(!keeper)continue;let level=clamp(Math.floor(Number(keeper.level)||1),1,5),localUpgrades=0;
      while(level<5){
        const next=level+1,need=DUPE_COST[next],candidates=group.filter(x=>x.id!==keeper.id&&!removed.has(x.id)&&!bulkLevelProtectedDuplicate(x,deployed,backupIds)).sort((a,b)=>(Number(a.level)||1)-(Number(b.level)||1)||(Number(a.shiny)||0)-(Number(b.shiny)||0)||effectivePoints(a)-effectivePoints(b));
        const cost=upgradeCost({...keeper,level},next);if(candidates.length<need||points<cost)break;
        const consume=candidates.slice(0,need);for(const x of consume)removed.add(x.id);points-=cost;totalCost+=cost;dupesUsed+=need;upgrades++;localUpgrades++;steps.push({keeperId:keeper.id,next,cost,consumeIds:consume.map(x=>x.id),key});level=next;
      }
      if(localUpgrades)cardsTouched++;
      simLevels.set(keeper.id,level);
    }
    return {tier,hyper,wins,vip,exclusive,steps,totalCost,upgrades,cardsTouched,dupesUsed,remainingPoints:points};
  }
  function unlockBulkLevelFromCollection(){
    if(bulkLevelUnlocked())return bulkLevelCurrentTier();
    if(!window.JKCoinApp?.openForGame)return toast("JK/Coin ist gerade nicht verfügbar.");
    window.JKCoinApp.openForGame("bigcards");
    toast("🔒 24-Stunden-Zugang: 500 JK/Coin. Nach Ablauf muss er erneut gekauft werden.",4600);
  }
  async function bulkLevelCurrentTier(){
    if(!bulkLevelUnlocked())return unlockBulkLevelFromCollection();
    const plan=bulkLevelPlan();if(!plan.upgrades)return toast(`Für ${bulkLevelTierLabel()} ist aktuell kein automatisches Upgrade möglich. Es fehlen freie Duplikate oder Points.`,4200);
    if(!await gameConfirm({title:`Alle Karten leveln · ${bulkLevelTierLabel()}`,message:`${plan.cardsTouched} Karten werden verbessert\n${plan.upgrades} Level-Upgrades\n${plan.dupesUsed} freie Duplikate werden verbraucht\n${fmt(plan.totalCost)} Points Kosten\n\nGeschützte Karten, Ausrüstung, Spielfeld-, Backup- und persönliche Karten bleiben unangetastet.`,confirmText:`${fmt(plan.totalCost)} Points einsetzen`,icon:"⚡",tone:"points"}))return;
    let applied=0,spent=0,used=0;for(const step of plan.steps){const inst=instance(step.keeperId);if(!inst||inst.level>=step.next)continue;const valid=step.consumeIds.filter(id=>!!instance(id));if(valid.length!==step.consumeIds.length||S.points<step.cost)break;S.points-=step.cost;spent+=step.cost;for(const rid of valid){delete S.instances[rid];used++;}inst.level=step.next;const col=cardCollectionMap(inst),key=collectionKey(inst);if(col[key])col[key].highestLevel=Math.max(col[key].highestLevel||1,step.next);S.daily.upgraded=(S.daily.upgraded||0)+1;raiseScore(150*step.next*(inst.exclusive?3:inst.rarity+1));addXp(50*step.next);applied++;}
    if(applied){invalidateCardPowerCache();repairFeaturedIdentityV424();}
    if(!applied)return toast("Die Karten haben sich zwischenzeitlich geändert. Bitte erneut versuchen.");persist();refresh(false);toast(`⚡ ${applied} Level-Upgrades erledigt · ${used} Duplikate · -${fmt(spent)} Points`,5000);
  }
  // ===== V363 ALLE KARTEN LEVELN END =====
  // ===== V381 ALLE KARTEN REBIRTHEN · 24-STUNDEN-ZUGANG =====
  function bulkRebirthUnlocked(){return Math.max(0,Number(S?.bulkRebirthUntil)||0)>now();}
  function bulkRebirthRemainingMs(){return bulkRebirthUnlocked()?Math.max(0,Number(S.bulkRebirthUntil)-now()):0;}
  function bulkRebirthTimeText(){const sec=Math.max(0,Math.ceil(bulkRebirthRemainingMs()/1000)),h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),ss=sec%60;return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(ss).padStart(2,"0")}`;}
  function bulkRebirthButtonText(){return bulkRebirthUnlocked()?`↻ Alle Karten rebirthen · ${bulkLevelTierLabel()} · ⏱ ${bulkRebirthTimeText()}`:`🔒 Alle Karten rebirthen · 24 Std. · 500 JK/Coin`;}
  function bulkRebirthPlan(tier=UI.collectionTier){
    const vip=tier===14,exclusive=tier===13,groups=new Map(),deployed=new Set(S.floors.flat().filter(Boolean)),backupIds=backupProtectedIds();
    for(const inst of Object.values(S.instances||{})){if(!inst)continue;if(vip?!inst.vip:exclusive?!inst.exclusive:(inst.vip||inst.exclusive||inst.rarity!==tier))continue;const key=collectionKey(inst),arr=groups.get(key)||[];arr.push(inst);groups.set(key,arr);}
    const cards=[];for(const group of groups.values()){const eligible=group.filter(x=>!x.listed&&!x.broken&&Number(x.level)>=5&&cardRebirth(x)<CARD_REBIRTH_MAX).sort((a,b)=>bulkLevelKeeperScore(b,deployed,backupIds)-bulkLevelKeeperScore(a,deployed,backupIds));if(eligible[0])cards.push(eligible[0].id);}
    return {tier,vip,exclusive,cards,count:cards.length};
  }
  function unlockBulkRebirthFromCollection(){if(bulkRebirthUnlocked())return bulkRebirthCurrentTier();if(!window.JKCoinApp?.openForGame)return toast("JK/Coin ist gerade nicht verfügbar.");window.JKCoinApp.openForGame("bigcards");toast("🔒 Alle Karten rebirthen: 24 Stunden für 500 JK/Coin.",4200);}
  async function bulkRebirthCurrentTier(){
    if(!bulkRebirthUnlocked())return unlockBulkRebirthFromCollection();const plan=bulkRebirthPlan();if(!plan.count)return toast(`Für ${bulkLevelTierLabel()} ist aktuell keine Level-5-Karte für einen weiteren Rebirth bereit.`,4200);
    if(!await gameConfirm({title:`Alle Karten rebirthen · ${bulkLevelTierLabel()}`,message:`${plan.count} Karten werden jeweils genau 1× rebirtht.\nJede betroffene Karte fällt auf Level 1 zurück.\nDer Sammlungs-Score bleibt auf dem bereits erreichten Level-5-Stand.\nAusrüstung, Shiny, Spur, Rank, persönlicher Slot und Backup-Zuordnung bleiben erhalten.`,confirmText:"Rebirth durchführen",icon:"↻",tone:"danger"}))return;
    let applied=0;for(const id of plan.cards){const inst=instance(id);if(!inst||inst.listed||inst.broken||inst.level<5||cardRebirth(inst)>=CARD_REBIRTH_MAX)continue;const key=collectionKey(inst),col=cardCollectionMap(inst);col[key]=col[key]||{firstAt:Number(inst.createdAt)||now(),highestLevel:5};col[key].highestLevel=Math.max(5,Number(col[key].highestLevel)||0);inst.cardRebirth=cardRebirth(inst)+1;col[key].highestRebirth=Math.max(Number(col[key].highestRebirth)||0,inst.cardRebirth);inst.level=1;applied++;}
    if(applied){invalidateCardPowerCache();repairFeaturedIdentityV424();}
    if(!applied)return toast("Die Karten haben sich zwischenzeitlich geändert. Bitte erneut versuchen.");persist();refresh(false);toast(`↻ ${applied} Karten automatisch rebirtht · Zugang noch ${bulkRebirthTimeText()}`,5000);
  }
  // ===== V381 ALLE KARTEN REBIRTHEN END =====


  async function upgradeCard(id){const inst=instance(id);if(!inst||inst.level>=5)return;if(isCardOnExpedition(id))return toast("Diese Karte ist gerade auf Expedition.");if(inst.listed)return toast("Gelistete Karten sind bis zum Ende des Angebots gesperrt.");const next=inst.level+1,dupes=duplicateIds(inst),need=DUPE_COST[next],cost=upgradeCost(inst,next);if(dupes.length<need)return toast(`Du brauchst ${need} zusätzliche Exemplare (${dupes.length} vorhanden).`);if(S.points<cost)return toast(`Upgrade kostet ${fmt(cost)} Points.`);if(!await gameConfirm({title:`${cardMeta(inst).name} verbessern`,message:`Auf Stufe ${next} upgraden?\n${need} Duplikate werden verbraucht\nKosten: ${fmt(cost)} Points`,confirmText:`${fmt(cost)} Points einsetzen`,icon:"⬆️",tone:"points"}))return;S.points-=cost;for(const rid of dupes.slice(0,need))delete S.instances[rid];inst.level=next;invalidateCardPowerCache();const key=collectionKey(inst),col=cardCollectionMap(inst);col[key].highestLevel=Math.max(col[key].highestLevel||1,next);S.daily.upgraded=(S.daily.upgraded||0)+1;setMissionRecord("upgrade",inst,1);addSetMastery(setMembershipIds(inst),3);raiseScore(150*next*(inst.exclusive?3:inst.rarity+1));addXp(50*next);repairFeaturedIdentityV424();persist();showCardDetail(id);refresh();}
  function showCardRebirthInfo(){showModal(`<div class="bc-card-rebirth-info"><small>KARTEN-REBIRTH · EIGENE KARTENENTWICKLUNG</small><h2>↻ So funktioniert Karten-Rebirth</h2><p>Jede einzelne Karteninstanz kann nach <b>Level 5</b> bis zu <b>5× rebirtht</b> werden. Beim Rebirth fällt nur diese Karte wieder auf <b>Level 1</b>. Aura, Kampf-Aura, Bindung, Shiny, Rank, Spur und Backup-Zuordnung bleiben auf der Karte.</p><ol><li>Bringe die Karte wie bisher mit Duplikaten bis <b>Level 5/5</b>.</li><li>Drücke in der Karte auf <b>↻ Rebirth</b>.</li><li>Die Karte startet wieder auf Level 1. Für Level 2/3/4/5 brauchst du weiterhin exakt <b>2 / 5 / 12 / 25</b> zusätzliche Exemplare und die normalen Point-Kosten.</li><li>Sobald die Karte einmal Level 5 erreicht hatte, bleibt sie im <b>Sammlungs-Score dauerhaft als Level 5</b> gewertet. Rebirth kann deinen Sammlungsfortschritt also nicht zurücksetzen.</li></ol><div class="bc-card-rebirth-table">${[1,2,3,4,5].map(r=>{const b=CARD_REBIRTH_BONUS[r],total=1+b;return `<article class="card-rb-${r}"><b>${r===5?"🌈 ":""}Rebirth ${r}</b><span>Anzeige: ×${String(b).replace(".",",")}</span><small>Points, XP, Kampfwerte und Kartenwert insgesamt ×${String(total).replace(".",",")}</small></article>`}).join("")}</div><p><b>Rebirth 5</b> ist MAX und bekommt eine animierte Rainbow-Umrandung. Die Rebirth-Umrandung und Stufe werden auch im normalen und Online-Kartenkampf angezeigt.</p><button data-bc-modal-close>Verstanden</button></div>`);}
  async function rebirthCard(id){const inst=instance(id);if(!inst)return;if(isCardOnExpedition(id))return toast("Diese Karte ist gerade auf Expedition.");if(inst.listed)return toast("Gelistete Karten können nicht rebirtht werden.");if(inst.broken)return toast("Repariere die Karte vor dem Rebirth.");const current=cardRebirth(inst);if(current>=CARD_REBIRTH_MAX)return toast("Diese Karte ist bereits auf Rebirth 5 MAX.");if(inst.level<5)return toast("Karten-Rebirth ist erst auf Level 5/5 möglich.");const next=current+1,bonus=CARD_REBIRTH_BONUS[next]||0,total=1+bonus;if(!await gameConfirm({title:`Karten-Rebirth ${next}/${CARD_REBIRTH_MAX}`,message:`${cardMeta(inst).name} wird auf Level 1 zurückgesetzt.\nSammlungs-Score bleibt auf Level-5-Stand.\nRebirth-Bonus: ×${String(bonus).replace(".",",")} → Gesamtwerte ×${String(total).replace(".",",")}\n\nFür Level 2–5 brauchst du danach wieder 2 / 5 / 12 / 25 Duplikate.`,confirmText:`Rebirth ${next} starten`,icon:"↻",tone:"danger"}))return;const key=collectionKey(inst),col=cardCollectionMap(inst);col[key]=col[key]||{firstAt:now(),highestLevel:5};col[key].highestLevel=Math.max(5,Number(col[key].highestLevel)||0);inst.cardRebirth=next;col[key].highestRebirth=Math.max(Number(col[key].highestRebirth)||0,next);inst.level=1;invalidateCardPowerCache();repairFeaturedIdentityV424();persist();refresh(false);showCardDetail(id);toast(next===CARD_REBIRTH_MAX?`🌈 ${cardMeta(inst).name}: REBIRTH 5 MAX! Rainbow-Umrandung freigeschaltet.`:`↻ ${cardMeta(inst).name}: Rebirth ${next} · ${cardRebirthLabel(inst)}`,5000);}

  function upgradeCost(inst,next){const base=(inst.exclusive||inst.vip)?Math.max(100,premiumProductionBase(inst)):inst.hyper?Math.max(100,hyperEconomyBase(inst)):cardBasePointProduction(inst.rarity,inst.base);const rarity=inst.exclusive?12:inst.rarity;return Math.max(100,Math.floor(base*(8+rarity*2)*Math.pow(next,2.25)));}
  async function upgradeShiny(id){const inst=instance(id);if(!inst||inst.shiny>=3)return;if(inst.listed)return toast("Gelistete Karten sind gesperrt.");const next=inst.shiny+1,needLevel=[0,3,4,5][next];if(inst.level<needLevel)return toast(`Shiny ${next} benötigt Kartenlevel ${needLevel}.`);const base=Math.max(100,sellValue(inst)),mult=[0,12,70,900][next],cost=Math.floor(base*mult);if(S.points<cost)return toast(`Shiny kostet ${fmt(cost)} Points.`);if(!await gameConfirm({title:`Shiny Stufe ${next} aktivieren`,message:`Kosten: ${fmt(cost)} Points\nDie Shiny-Stufe wird dauerhaft auf dieser Karteninstanz aktiviert.`,confirmText:`${fmt(cost)} Points einsetzen`,icon:"✨",tone:"points"}))return;S.points-=cost;inst.shiny=next;raiseScore(600*next);persist();showCardDetail(id);refresh();}
  function equipAura(id,auraId){const inst=instance(id),a=auraBy(auraId);if(!inst||!a)return;if(inst.listed)return toast("Gelistete Karten sind gesperrt.");if((S.auraInventory[auraId]||0)<1)return toast("Diese Aura besitzt du nicht.");if(inst.aura)S.auraInventory[inst.aura]=(S.auraInventory[inst.aura]||0)+1;S.auraInventory[auraId]--;inst.aura=auraId;persist();showCardDetail(id);refresh();}
  function equipCombatAura(id,auraId){const inst=instance(id),a=combatAuraBy(auraId);if(!inst||!a)return;if(inst.listed)return toast("Gelistete Karten sind gesperrt.");if((S.combatAuraInventory[auraId]||0)<1)return toast("Diese Kampf-Aura besitzt du nicht.");if(inst.combatAura)S.combatAuraInventory[inst.combatAura]=(S.combatAuraInventory[inst.combatAura]||0)+1;S.combatAuraInventory[auraId]--;inst.combatAura=auraId;persist();showCardDetail(id);refresh();}
  function equipBind(id,bindId){const inst=instance(id),b=bindBy(bindId);if(!inst||!b)return;if(inst.listed)return toast("Gelistete Karten sind gesperrt.");if((S.bindInventory[bindId]||0)<1)return toast("Diese Bindung besitzt du nicht.");if(inst.bind)S.bindInventory[inst.bind]=(S.bindInventory[inst.bind]||0)+1;S.bindInventory[bindId]--;inst.bind=bindId;persist();showCardDetail(id);refresh();}
  function removeAura(id){const inst=instance(id);if(inst?.aura){S.auraInventory[inst.aura]=(S.auraInventory[inst.aura]||0)+1;inst.aura=null;persist();showCardDetail(id);refresh()}}
  function removeCombatAura(id){const inst=instance(id);if(inst?.combatAura){S.combatAuraInventory[inst.combatAura]=(S.combatAuraInventory[inst.combatAura]||0)+1;inst.combatAura=null;persist();showCardDetail(id);refresh()}}
  function removeBind(id){const inst=instance(id);if(inst?.bind){S.bindInventory[inst.bind]=(S.bindInventory[inst.bind]||0)+1;inst.bind=null;persist();showCardDetail(id);refresh()}}
  // V348: Beim Ausrüsten/Entfernen eines Kampf-Tranks bleibt das Kartendetail
  // exakt an seiner bisherigen Scrollposition. Das verhindert das frühere
  // Hochspringen zum Anfang der Karte nach jedem Trank-Klick.
  function cardDetailModalScroll(){const el=UI.overlay?.querySelector("[data-bc-modal] .bc-modal-card");return el?Math.max(0,el.scrollTop||0):null;}
  function restoreCardDetailModalScroll(scrollTop){if(scrollTop===null||scrollTop===undefined)return;requestAnimationFrame(()=>{const el=UI.overlay?.querySelector("[data-bc-modal] .bc-modal-card");if(!el)return;const max=Math.max(0,el.scrollHeight-el.clientHeight);el.scrollTop=Math.min(Math.max(0,Number(scrollTop)||0),max);});}
  function equipPotion(id,typeId){
    const inst=instance(id),type=POTION_TYPES.find(x=>x.id===typeId);if(!inst||!type)return;if(inst.listed)return toast("Gelistete Karten sind gesperrt.");if(potionQueueCount(inst)>=3)return toast("Alle 3 Trank-Slots dieser Karte sind belegt.");
    const tierId=potionTierId(inst),owned=potionCount(tierId,typeId);if(owned<1)return toast(`Du besitzt keinen passenden ${type.name} für ${potionTierLabel(tierId)}.`);
    const modalScroll=cardDetailModalScroll(),inCardDetail=modalScroll!==null;S.potionInventory[potionKey(tierId,typeId)]=owned-1;potionQueue(inst).push({tierId,typeId});persist();
    if(inCardDetail){showCardDetail(id);restoreCardDetailModalScroll(modalScroll);refresh();}else refresh(true);toast(`${type.icon} ${type.name} in Slot ${potionQueueCount(inst)}/3 gelegt · wirkt genau 1 Kampfrunde.`);
  }
  function removePotion(id,index=0){const inst=instance(id);if(!inst||!potionQueueCount(inst))return;const modalScroll=cardDetailModalScroll(),inCardDetail=modalScroll!==null,p=returnPreparedPotion(inst,index);persist();if(inCardDetail){showCardDetail(id);restoreCardDetailModalScroll(modalScroll);refresh();}else refresh(true);toast(`${p?.name||"Trank"} zurück ins Inventar gelegt.`);}
  function buyPotion(tierId,typeId){tierId=normalizePotionTierId(tierId);const type=POTION_TYPES.find(x=>x.id===typeId);if(!type||!tierId||(!POTION_SPECIAL_TIERS.includes(tierId)&&RARITY_INDEX[tierId]===undefined))return;const price=potionPrice(tierId,typeId);if(S.points<price)return toast(`Dir fehlen ${fmt(price-S.points)} Points für ${type.name}.`);S.points-=price;const key=potionKey(tierId,typeId);S.potionInventory[key]=potionCount(tierId,typeId)+1;persist();showPotionTierShop(tierId);refresh(true);toast(`${type.name} gekauft · -${fmt(price)} Points`);}
  function showPotionShop(){const tiers=potionAllTierIds();showModal(`<div class="bc-potion-shop"><small>KAMPF-APOTHEKE</small><h2>Tränke & Meisterschaft</h2><p>Jede Karte besitzt <b>3 Trank-Slots</b>. Normale Raritäten haben ihre eigenen Listen. Zusätzlich besitzen <b>Exclusive, VIP und Hyper jeweils eine komplett eigene Trankliste samt eigenem Inventar und eigener Meisterschaft</b>.</p><div class="bc-potion-tier-grid">${tiers.map(id=>{const meta=potionTierMeta(id);return `<button class="${meta.className} ${meta.special?"bc-special-potion-tier":""}" data-bc-potion-tier="${id}"><span>${meta.symbol}</span><div><b>${meta.name}</b><small>${potionTierTotal(id)} Tränke · 5 Tranktypen · eigene Meisterschaft</small></div><em>Öffnen →</em></button>`}).join("")}</div><div class="bc-repair-explain"><b>Meisterschaft:</b><span>100 Anwendungen → Veredelt, 200 → Arkan, 300 → Prisma-MAX. VIP-Tränke funktionieren nur auf VIP-Karten; Hyper-Tränke nur auf Hyper-Karten; Exclusive-Tränke nur auf Exclusive-Karten.</span></div></div>`);}
  function showPotionTierShop(tierId){
    const id=normalizePotionTierId(tierId)||"common",meta=potionTierMeta(id);
    showModal(`<div class="bc-potion-shop bc-potion-tier-shop ${meta.special?"bc-special-potion-shop":""}"><button class="bc-potion-back" data-bc-potion-shop>← Alle Tranklisten</button><small>${meta.name.toUpperCase()} · EIGENE KAMPF-APOTHEKE</small><h2>${meta.symbol} ${meta.name}-Tränke</h2><p>${id==="hyper"?"Diese Tränke sind ausschließlich für Hyper-Karten. Hyper besitzt damit ein vollständig getrenntes Trank-Inventar.":id==="vip"?"Diese Tränke sind ausschließlich für VIP-Karten. Normale oder Exclusive-Tränke können nicht als VIP-Tränke verwendet werden.":id==="exclusive"?"Diese Tränke sind ausschließlich für Exclusive-Karten.":"Diese Liste gilt ausschließlich für Karten dieser Rarität."} Jeder Verbrauch zählt als Anwendung; Prisma-MAX ist die höchste Meisterschaft.</p><div class="bc-potion-list">${POTION_TYPES.map(type=>{const m=potionMastery(id,type.id),next=m.stage<POTION_MASTERY_MAX?potionMasteryRequirement(m.stage+1):0,ready=next&&m.uses>=next;return `<article class="${meta.className} ${potionMasteryClass(id,type.id)}"><span>${type.icon}</span><div><b>${type.name}</b><small>${type.desc}</small><strong>${potionEffectText(id,type.id)}</strong><em>${POTION_MASTERY_NAMES[m.stage]} · Anwendungen ${m.uses}${next?`/${next}`:" · MAX"} · Inventar ×${potionCount(id,type.id)}</em><small class="bc-potion-max-hint">Maximal: ${potionMaxEffectText(id,type.id)}</small></div><div class="bc-potion-card-actions"><button data-bc-buy-potion="${type.id}" data-tier="${id}">${fmt(potionPrice(id,type.id))} Points</button>${m.stage<POTION_MASTERY_MAX?`<button class="bc-potion-mastery-up ${ready?"ready":""}" data-bc-upgrade-potion="${type.id}" data-tier="${id}" ${ready?"":"disabled"}>${ready?`⬆ ${POTION_MASTERY_NAMES[m.stage+1]}`:`🔒 ${m.uses}/${next}`}</button>`:`<span class="bc-potion-master-max">🌈 PRISMA-MAX</span>`}</div></article>`}).join("")}</div></div>`);
  }
  function cardPotionSection(inst){
    const tierId=potionTierId(inst),tierMeta=potionTierMeta(tierId),queue=preparedPotionsMeta(inst),available=POTION_TYPES.filter(x=>potionCount(tierId,x.id)>0),total=potionInventoryTotal();
    const otherOwned=potionAllTierIds().filter(t=>t!==tierId&&potionTierTotal(t)>0).map(t=>`${potionTierLabel(t)} ×${potionTierTotal(t)}`);
    const slots=Array.from({length:3},(_,i)=>{const p=queue[i];return p?`<div class="bc-potion-slot filled ${potionMasteryClass(p.tierId,p.typeId)}"><span>${i+1}</span><b>${p.icon} ${p.name}</b><small>${p.effectText} · ${p.stageName}</small><button data-bc-remove-potion="${inst.id}" data-bc-potion-slot="${i}" title="Zurück ins Inventar">×</button></div>`:`<div class="bc-potion-slot empty"><span>${i+1}</span><b>Leer</b><small>Runde ${i+1}</small></div>`}).join("");
    const matchingHtml=available.length?available.map(x=>`<button data-bc-equip-potion="${x.id}" data-card="${inst.id}" ${queue.length>=3?"disabled":""}>${x.icon} ${x.name} · ${potionEffectText(tierId,x.id)} · ×${potionCount(tierId,x.id)}</button>`).join(""):`<span>${total>0?`Keine passenden ${tierMeta.name}-Tränke vorhanden.`:"Noch keine Tränke im Inventar."}</span>`;
    const inventoryHint=otherOwned.length?`<small><b>Andere Trank-Inventare:</b> ${otherOwned.join(" · ")}</small>`:"";
    return `<section class="bc-card-potion-section ${tierMeta.special?"bc-special-card-potions":""}"><div class="bc-potion-section-head"><div><small>${tierMeta.symbol} ${tierMeta.name.toUpperCase()} · EIGENE TRANKLISTE</small><h3>🧪 Tränke · ${queue.length}/3</h3></div><button class="bc-potion-open-inline" data-bc-potion-tier="${tierId}">${tierMeta.name}-Tränke öffnen</button></div><p>Diese Karte kann ausschließlich Tränke aus ihrer <b>${tierMeta.name}-Liste</b> verwenden. Slot 1 wirkt in der nächsten Kampfrunde, danach Slot 2 und Slot 3.</p><div class="bc-potion-loadout">${slots}</div><div class="bc-equip-list compact">${matchingHtml}${inventoryHint}</div></section>`;
  }
  function buyTrail(id){
    const t=trailBy(id);if(!t)return;if(!trailUnlocked(id))return toast(`${t.name} ist noch gesperrt. Freischaltung erfolgt im Tab „Karte“.`,3600);
    if(S.points<t.pointPrice)return toast(`Dir fehlen ${fmt(t.pointPrice-S.points)} Points für ${t.name}.`);
    S.points-=t.pointPrice;S.trailInventory[id]=trailCount(id)+1;persist();showTrailShop();toast(`${t.name} gekauft · -${fmt(t.pointPrice)} Points`);
  }
  function equipTrail(cardId,trailId){
    const inst=instance(cardId),t=trailBy(trailId);if(!inst||!t)return;if(!isFeaturedCombatCardId(inst.id))return toast("Spuren können nur auf deine Haupt- oder aktuell gewählte Backup-Karte gelegt werden.");if(inst.listed)return toast("Gelistete Karten sind gesperrt.");if(!trailUnlocked(t.id))return toast(`${t.name} ist noch nicht freigeschaltet.`);if(trailCount(t.id)<1)return toast(`Du besitzt keine ${t.name}.`);
    const reopen=!!UI.overlay?.querySelector(".bc-owned-trails-modal");updateFeaturedEarnings(now());if(inst.trail)returnTrailToInventory(inst);S.trailInventory[t.id]=trailCount(t.id)-1;inst.trail=t.id;persist();refresh(false);if(reopen)showOwnedTrails(cardId);toast(`${t.name} auf ${cardMeta(inst).name} ausgerüstet.`,3200);
  }
  function removeTrail(cardId){const inst=instance(cardId);if(!inst?.trail)return;const reopen=!!UI.overlay?.querySelector(".bc-owned-trails-modal");updateFeaturedEarnings(now());const t=returnTrailToInventory(inst);persist();refresh(false);if(reopen)showOwnedTrails(cardId);toast(`${t?.name||"Spur"} zurück ins Inventar gelegt.`);}
  function unlockNextTrail(){
    const current=clamp(Math.floor(Number(S.trailTierUnlocked)||0),0,TRAILS.length-1),next=TRAILS[current+1],inst=featuredCard();if(!next)return toast("Alle Spuren bis Göttlich sind bereits freigeschaltet.");if(!inst)return toast("Wähle im Tab „Karte“ zuerst deine persönliche Karte aus.");const currentTrail=TRAILS[current];if(inst.trail!==currentTrail.id)return toast(`Rüste zuerst die ${currentTrail.name} auf deiner ausgewählten Karte aus. So wird die nächste Spur freischaltbar.`,4200);if(S.level<next.levelReq)return toast(`${next.name} benötigt BigCards Level ${next.levelReq}. Aktuell: Level ${S.level}.`);if(S.points<next.unlockCost)return toast(`${fmt(next.unlockCost)} Points für die Freischaltung von ${next.name} benötigt.`);S.points-=next.unlockCost;S.trailTierUnlocked=current+1;persist();refresh(false);toast(`${next.name} freigeschaltet! Du kannst sie jetzt im Shop mit Points kaufen.`,4200);
  }
  function showTrailInfo(){
    const unlocked=clamp(Math.floor(Number(S.trailTierUnlocked)||0),0,TRAILS.length-1),current=TRAILS[unlocked],next=TRAILS[unlocked+1]||null;
    showModal(`<div class="bc-trail-info-panel"><small>SPUREN · INFO</small><h2>☄ So bekommst du Spuren</h2><p><b>Gewöhnliche Spur</b> ist von Anfang an freigeschaltet. Danach arbeitest du dich immer genau eine Spur weiter.</p><div class="bc-trail-info-steps"><article><b>1 · Persönliche Karte wählen</b><span>Öffne den Tab <b>„Karte“</b> und wähle deine persönliche Hauptkarte. Ab Rank 1 darf auch die aktuelle Backup-Karte eine eigene Spur tragen.</span></article><article><b>2 · Aktuelle Spur ausrüsten</b><span>Die aktuell höchste freigeschaltete Spur muss auf deiner persönlichen Karte ausgerüstet sein.</span></article><article><b>3 · Level + Points erreichen</b><span>Erreiche das geforderte <b>BigCards-Level</b> und bezahle die einmaligen Freischaltkosten.</span></article><article><b>4 · Nächste Spur freischalten</b><span>Im Tab <b>„Karte“ → Spuren-Freischaltung</b> erscheint dann der Freischalt-Button.</span></article><article><b>5 · Spur kaufen</b><span>Nach der Freischaltung kannst du sie in der Spurenwerkstatt mit <b>Points</b> kaufen und anschließend ausrüsten.</span></article></div><div class="bc-trail-info-current"><b>Dein Stand</b><span>Freigeschaltet bis: <strong>${current.icon} ${current.name}</strong></span>${next?`<span>Nächste: <strong>${next.icon} ${next.name}</strong> · Level ${next.levelReq} · ${fmt(next.unlockCost)} Points Freischaltung</span>`:`<span>👑 Alle Spuren bis Göttlich sind freigeschaltet.</span>`}</div><div class="bc-trail-info-list">${TRAILS.map((t,i)=>`<div class="${i<=unlocked?"done":i===unlocked+1?"next":""}"><span>${t.icon}</span><b>${t.name}</b><small>${i===0?"Start-Freischaltung":`Lv ${t.levelReq} · Freischalten ${fmt(t.unlockCost)} Points`}<br>Kaufen ${fmt(t.pointPrice)} Points · ${fmt(t.jk)} JK/Coin</small></div>`).join("")}</div><div class="bc-repair-explain"><b>Wichtig bei JK/Coin:</b><span>Ein JK/Coin-Kauf legt die Spur sofort in dein Inventar. Er überspringt aber <b>nicht</b> die normale Spuren-Freischaltung. Eine noch gesperrte Spur kannst du erst ausrüsten, nachdem du ihre Stufe normal freigeschaltet hast.</span></div><button class="bc-primary" data-bc-trail-shop>← Zurück zu Spuren</button></div>`);
  }
  
  function ownedTrailInventoryCount(){return TRAILS.reduce((n,t)=>n+trailCount(t.id),0);}
  function showOwnedTrails(cardId){
    const inst=instance(cardId);if(!inst)return toast("Karte nicht gefunden.");
    if(!isFeaturedCombatCardId(inst.id))return toast("Spuren können nur für deine persönliche Haupt- oder Backup-Karte ausgewählt werden.");
    const current=trailBy(inst.trail),total=ownedTrailInventoryCount();
    const rows=TRAILS.slice().sort((a,b)=>{
      const ae=inst.trail===a.id,be=inst.trail===b.id;if(ae!==be)return ae?-1:1;
      const ac=trailCount(a.id),bc=trailCount(b.id);if(!!ac!==!!bc)return ac?-1:1;
      return a.index-b.index;
    });
    showModal(`<div class="bc-owned-trails-modal"><div class="bc-owned-trails-head"><div><small>☄ SPUREN-INVENTAR</small><h2>Meine Spuren</h2><p>${esc(cardMeta(inst).name)} · Bestand insgesamt <b>${fmt(total)}</b></p></div><button class="bc-info-circle" data-bc-trail-info title="Spuren-Info">i</button></div><div class="bc-owned-trails-current"><span>Aktuell ausgerüstet</span><b>${current?`${current.icon} ${current.name}`:"Keine Spur"}</b>${current?`<button class="secondary" data-bc-remove-trail="${inst.id}">Spur entfernen</button>`:""}</div><div class="bc-owned-trails-grid">${rows.map(t=>{const count=trailCount(t.id),unlocked=trailUnlocked(t.id),equipped=inst.trail===t.id,canEquip=unlocked&&count>0&&!equipped;return `<article class="bc-owned-trail-row ${equipped?"equipped":""} ${!unlocked?"locked":""}"><div class="bc-owned-trail-icon">${t.icon}</div><div class="bc-owned-trail-copy"><b>${t.name}</b><small>${trailBonusText(t)}</small><span>Inventar <strong>×${count}</strong> · ${unlocked?"freigeschaltet":"🔒 noch nicht freigeschaltet"}</span></div><button data-bc-equip-trail="${t.id}" data-card="${inst.id}" ${canEquip?"":"disabled"}>${equipped?"AKTIV":count<1?"Nicht vorhanden":!unlocked?"Gesperrt":"Ausrüsten"}</button></article>`}).join("")}</div><div class="bc-owned-trails-footer"><button data-bc-trail-shop>Spuren kaufen</button><button class="secondary" data-bc-modal-close>Schließen</button></div></div>`);
  }

  function showTrailShop(){
    const unlocked=clamp(Math.floor(Number(S.trailTierUnlocked)||0),0,TRAILS.length-1);showModal(`<button class="bc-trail-modal-info" data-bc-trail-info title="Wie bekomme ich Spuren?" aria-label="Info: Wie bekomme ich Spuren?">i</button><div class="bc-trail-shop"><small>SPURENWERKSTATT</small><h2>Spuren</h2><p>Spuren sind exklusiv für deine persönliche <b>Karte</b>. Sie verbessern den separaten Karten-Slot-Ertrag und den Kartenkampf. Es gibt absichtlich <b>keine Exclusive-Spur</b> – jede normale Spur kann aber auf eine Exclusive-Karte gelegt werden.</p><div class="bc-trail-grid">${TRAILS.map(t=>{const locked=t.index>unlocked;return `<article class="rar-${t.id} ${locked?"locked":""}"><span>${t.icon}</span><div><b>${t.name}</b><small>${trailBonusText(t)}</small><em>Inventar ×${trailCount(t.id)}${locked?` · 🔒 Freischaltung im Tab Karte`:" · freigeschaltet"}</em></div><button data-bc-buy-trail="${t.id}" ${locked?"disabled":""}>${locked?"Gesperrt":`${fmt(t.pointPrice)} Points`}</button></article>`}).join("")}</div><div class="bc-repair-explain"><b>JK/Coin:</b><span>Alle Spuren können zusätzlich direkt im BigCards-Bereich des JK/Coin-Shops gekauft werden. Ein JK/Coin-Kauf legt die Spur ins Inventar, die normale Freischaltung zum Ausrüsten bleibt bestehen.</span></div></div>`);
  }
  // V386: Picker berechnen Kampfwert/Produktion pro Karte nur noch EINMAL vor
  // dem Sortieren. Zuvor wurden cardMeta()/combatStats() im Sortiervergleich sehr
  // oft wiederholt, was bei großen Sammlungen den Klick auf „Karte auswählen“
  // deutlich verzögert hat.
  function pickerRows(filterFn){const rows=[];for(const inst of Object.values(S.instances||{})){if(!inst||inst.listed||!filterFn(inst))continue;rows.push({inst,power:combatStats(inst).power});}return rows;}
  function showFeaturedPicker(){
    const groups=new Map();
    for(const row of pickerRows(()=>true)){
      const inst=row.inst,key=collectionKey(inst);let g=groups.get(key);
      if(!g){g={rows:[],copies:0};groups.set(key,g);}g.rows.push(row);g.copies++;
    }
    const rows=[];
    for(const [key,g] of groups){
      const usable=g.rows.filter(x=>!x.inst.listed&&!isCardOnExpedition(x.inst.id));
      const healthy=usable.filter(x=>!x.inst.broken),pool=healthy.length?healthy:usable;
      pool.sort((a,b)=>featuredProgressCompareV424(b.inst,a.inst)||b.power-a.power);
      const best=pool[0];if(best)rows.push({...best,copies:g.copies,key});
    }
    rows.sort((a,b)=>{const af=collectionKey(a.inst)===collectionKey(instance(S.featuredCardId)),bf=collectionKey(b.inst)===collectionKey(instance(S.featuredCardId));if(af!==bf)return af?-1:1;return featuredProgressCompareV424(b.inst,a.inst)||b.power-a.power;});
    showModal(`<div class="bc-feature-picker"><small>DEINE PERSÖNLICHE KARTE</small><h2>Karte auswählen</h2><p>Pro Kartenmotiv wird nur noch die <b>stärkste ausgebaute Kopie</b> angezeigt. Damit kann nicht versehentlich eine zweite schwächere Kopie derselben Karte im Kampfslot landen.</p><div class="bc-feature-picker-grid">${rows.length?rows.slice(0,250).map(row=>{const inst=row.inst,m=cardMeta(inst),current=inst.id===S.featuredCardId;return `<button data-bc-feature-select="${inst.id}" class="${m.className} ${current?"current":""} ${inst.broken?"broken":""}"><span>${m.icon}</span><div><b>${esc(m.name)}</b><small>${inst.hyper?`HYPER · G${hyperGeneration(inst)} · ${m.hyperTier?.name||""}`:inst.vip?`VIP · ${m.rarity.name}`:inst.exclusive?"EXCLUSIVE":m.rarity.name} · Lv ${inst.level}/5 · Rebirth ${cardRebirth(inst)}/5 · Rank ${cardRank(inst)}/10 · ⚔ ${fmt(row.power)} · ×${row.copies} vorhanden</small></div><em>${current?"AKTIV":"Auswählen"}</em></button>`}).join(""):`<div class="bc-empty-state"><span>🃏</span><h3>Noch keine Karte vorhanden</h3></div>`}</div></div>`);
  }
  function showFeaturedBackupPicker(){
    const main=featuredCard();if(!main)return toast("Wähle zuerst eine persönliche Karte aus.");if(cardRank(main)<1)return toast("Die erste Backup-Karte wird mit Rank 1 freigeschaltet.");
    const rows=pickerRows(x=>x.id!==main.id).map(row=>({...row,eligible:backupCardEligible(main,row.inst)})).sort((a,b)=>{if(a.eligible!==b.eligible)return a.eligible?-1:1;if(!!a.inst.broken!==!!b.inst.broken)return a.inst.broken?1:-1;return b.power-a.power||b.inst.level-a.inst.level;}).slice(0,250);
    showModal(`<div class="bc-backup-picker"><small>RANK-BACKUP · ${esc(cardMeta(main).name)}</small><h2>🛡 Backup-Karte wählen</h2><p>Rank ${cardRank(main)} erlaubt normale Backup-Karten bis <b>${esc(rankBackupTierName(main))}</b>. Hyper-, Exclusive- und VIP-Karten sind ab Rank 1 erlaubt. Nur Haupt- und aktive Backup-Karte dürfen eine Spur tragen.</p><div class="bc-feature-picker-grid">${rows.length?rows.map(row=>{const inst=row.inst,m=cardMeta(inst),eligible=row.eligible,current=main.backupCardId===inst.id,locked=!eligible||inst.broken;const req=(inst.hyper||inst.exclusive||inst.vip)?1:backupRankRequirementForTier(inst.rarity);return `<button data-bc-backup-select="${inst.id}" class="${m.className} ${current?"current":""} ${inst.broken?"broken":""} ${!eligible?"battle-locked":""}" ${locked?"disabled":""}><span>${m.icon}</span><div><b>${esc(m.name)}</b><small>${inst.hyper?`HYPER · G${hyperGeneration(inst)} · ab Rank 1`:inst.vip?`VIP · ${m.rarity.name} · ab Rank 1`:inst.exclusive?"EXCLUSIVE · ab Rank 1":`${m.rarity.name} · benötigt Rank ${req}`} · Lv ${inst.level}/5 · ⚔ ${fmt(row.power)}</small></div><em>${current?"AKTIV":inst.broken?"KAPUTT":eligible?"Als Backup":"GESPERRT"}</em></button>`}).join(""):`<div class="bc-empty-state"><span>🃏</span><h3>Keine Backup-Karte verfügbar</h3></div>`}</div></div>`);
  }
  function setFeaturedBackupCard(id){
    const main=featuredCard(),backup=instance(id);if(!main||!backup)return;if(isCardOnExpedition(id))return toast("Diese Karte ist gerade auf Expedition.");if(cardRank(main)<1)return toast("Backup-Karten werden ab Rank 1 freigeschaltet.");if(backup.broken)return toast("Eine kaputte Karte kann nicht als Backup gesetzt werden.");if(!backupCardEligible(main,backup)){const req=(backup.hyper||backup.exclusive||backup.vip)?1:backupRankRequirementForTier(backup.rarity);return toast(`${cardMeta(backup).name} benötigt für den Backup-Slot Rank ${req}.`);}
    const old=featuredBackupCard(main);if(old&&old.id!==backup.id&&old.trail)returnTrailToInventory(old);
    for(const row of S.floors){const i=row.indexOf(backup.id);if(i>=0)row[i]=null;}main.backupCardId=backup.id;persist();closeModal();UI.tab="card";refresh(false);toast(`${cardMeta(backup).name} ist jetzt deine Backup-Karte.`,3600);
  }
  function clearFeaturedBackup(){
    const main=featuredCard();if(!main?.backupCardId)return;const backup=featuredBackupCard(main);if(backup?.trail)returnTrailToInventory(backup);main.backupCardId=null;persist();closeModal();UI.tab="card";refresh(false);toast(`${backup?cardMeta(backup).name:"Backup-Karte"} als Backup entfernt. Spur wurde ins Inventar zurückgelegt.`);
  }
  function selectFeaturedCard(id){
    const requested=instance(id);if(!requested)return;if(isCardOnExpedition(id))return toast("Diese Karte ist gerade auf Expedition.");if(requested.listed)return toast("Online gelistete Karten können nicht als persönliche Karte gewählt werden.");
    const inst=bestSelectableFeaturedCopyV424(requested);if(!inst)return;const old=featuredCard();updateFeaturedEarnings(now());
    if(old&&old.id!==inst.id){if(old.trail)returnTrailToInventory(old);const oldBackup=featuredBackupCard(old);if(oldBackup?.trail)returnTrailToInventory(oldBackup);old.backupCardId=null;}
    for(const row of S.floors){const i=row.indexOf(inst.id);if(i>=0)row[i]=null;}S.featuredCardId=inst.id;S.featuredLastAt=now();UI.battleCard=UI.battleCard||inst.id;persist();closeModal();UI.tab="card";refresh(false);toast(`${cardMeta(inst).name} ist jetzt deine persönliche Karte · stärkste ausgebaute Kopie gewählt.`,4200);
  }
  function clearFeaturedCard(){
    const inst=featuredCard();if(!inst)return;updateFeaturedEarnings(now());if(inst.trail)returnTrailToInventory(inst);const backup=featuredBackupCard(inst);if(backup?.trail)returnTrailToInventory(backup);inst.backupCardId=null;S.featuredCardId=null;S.featuredLastAt=now();persist();refresh(false);toast(`${cardMeta(inst).name} abgewählt. Haupt-/Backup-Spuren wurden ins Inventar zurückgelegt.`);
  }
  function collectFeatured(){updateFeaturedEarnings(now());const points=Math.floor(Number(S.featuredPendingPoints)||0),xp=Math.floor(Number(S.featuredPendingXp)||0);if(points<1&&xp<1)return toast("Deine Karte hat noch nichts gesammelt.");S.featuredPendingPoints=Math.max(0,S.featuredPendingPoints-points);S.featuredPendingXp=Math.max(0,S.featuredPendingXp-xp);if(points){const credited=Math.floor(points*vipWheelMultiplier("points"));S.points+=credited;S.lifetimePointsEarned+=credited;}if(xp)addXp(xp);raiseScore(Math.max(1,Math.floor(Math.log10(1+points)*3)));persist();refresh(false);toast(`Karten-Slot eingesammelt: +${fmt(Math.floor(points*vipWheelMultiplier("points")))} Points${xp?` · +${fmt(xp)} XP`:""}`,3600);}
  function rankStorageRequirement(tier){const row=FEATURED_RANKS.find(x=>(x.storageTier||0)>=tier);return row?.rank??null;}
  function applyRankStorageUnlock(inst){
    const tier=rankMeta(cardRank(inst)).storageTier||0;if(tier<=S.featuredStorageTier)return null;
    S.featuredStorageTier=tier;return FEATURED_STORAGE_TIERS[tier]||null;
  }
  function showFeaturedRankInfo(){
    showModal(`<div class="bc-rank-info"><small>PERSÖNLICHE KARTE · MEISTERSCHAFT</small><h2>Wie funktioniert der neue Karten-Rank?</h2><p><b>Rank und Kartenlevel sind zwei getrennte Systeme.</b> Dein Kartenlevel bleibt beim Rank-Up erhalten. Rank zeigt, wie gut du genau dieses Kartenexemplar im Kartenkampf gemeistert hast.</p><ol><li>Wähle im Tab <b>„Karte“</b> eine persönliche Karte. Nur dieses Exemplar kann Meisterschaft sammeln.</li><li>Gewinne Kartenkämpfe mit genau dieser Karte. Lokale Siege geben je nach Gegnerstärke <b>1 / 2 / 4 / 7 / 12 Meisterschaftspunkte</b>. Im neuen <b>Online-Rank-Kampf</b> bekommst du für Siege je nach gegnerischem Karten-Rank <b>5 / 8 / 12 / 18 / 24 Meisterschaft</b>.</li><li>Lokale Siege gegen stärkere KI-Gegner und Online-Rank-Siege gegen einen <b>höheren Karten-Rank</b> zählen zusätzlich als <b>Elite-Siege</b>. Für hohe Ranks brauchst du beides: Meisterschaft + Elite-Siege.</li><li>Jeder Rank hat außerdem eine kleine Kartenlevel-Anforderung. Das Kartenlevel wird dabei <b>nie zurückgesetzt</b>.</li><li>Wenn alle Bedingungen erfüllt sind, drückst du im Rank-Menü auf <b>Rank meistern</b>. Der Rank bleibt dauerhaft auf diesem Kartenexemplar gespeichert.</li></ol><p><b>Grundbonus:</b> Bei normalen Karten geben Rank 1–9 jeweils insgesamt +2 % pro Rank auf persönliche Karten-Slot-Points, Karten-Slot-XP, Kampfschaden und Kampf-Leben. Rank 10 ist „Apex“ und erhöht diesen Grundbonus auf insgesamt <b>+25 %</b>. <b>Hyper-Ausnahme:</b> Rank ist dort reines Kampfsystem und erhöht weder Points noch XP.</p><p><b>Meilenstein-Perks:</b> Höhere Ranks verstärken zusätzlich Tränke, Special-Attacken, Kampfbelohnungen und Schadensreduktion. Diese Perks gelten nur, solange das Exemplar deine persönliche Karte ist.</p><p><b>Speicher gratis:</b> Rank 1 → 5 Mio. Points / 150.000 XP, Rank 5 → 25 Mio. / 500.000 XP, Rank 10 → 250 Mio. / 1 Mio. XP. JK/Coin-Upgrades bleiben als alternative Sofort-Freischaltung bestehen.</p><p><b>Online-Rank-Kampf:</b> Die Gegnersuche läuft in einem fairen Fenster von <b>±2 Karten-Ranks</b>. Rank 1 trifft also auf Rank 1–3, Rank 4 auf Rank 2–6 und Rank 10 nur auf Rank 8–10. Normale Online-Kämpfe haben dieses Rank-Fenster nicht.</p><p><b>Backup-Karte:</b> Ab Rank 1 bekommst du einen zweiten Kampfslot. Rank 1 erlaubt Gewöhnlich, Rank 2 Ungewöhnlich, Rank 3 Selten, Rank 4 Episch, Rank 5 Legendär, Rank 6 Special, Rank 7 Mythisch, Rank 8 bis Universe, Rank 9 bis Kosmisch und Rank 10 bis Göttlich. <b>Exclusive ist ab Rank 1 immer erlaubt.</b> Die Backup-Karte wird automatisch vom Produktions-Spielfeld entfernt, darf eine eigene Spur tragen und erhält keine persönlichen Rank-Boni der Hauptkarte. Die Backup-Karte übernimmt automatisch erst bei einem echten K.O. der Hauptkarte. In diesem Moment wird die Hauptkarte sicher als zerbrochen gespeichert und bleibt auch dann kaputt, wenn das Backup den Kampf anschließend gewinnt. Ein freiwilliger manueller Wechsel zerstört die Hauptkarte natürlich nicht.</p><button data-bc-feature-rank>Zum Rank-Menü</button></div>`);
  }
  function showFeaturedRank(){
    const inst=featuredCard();if(!inst)return toast("Wähle zuerst eine persönliche Karte aus.");
    const rank=cardRank(inst),meta=rankMeta(rank),next=nextRankMeta(inst),mastery=cardRankMastery(inst),elite=cardRankEliteWins(inst),m=cardMeta(inst),max=rank>=FEATURED_RANK_MAX;
    const levelReady=!!next&&inst.level>=next.levelReq,masteryReady=!!next&&mastery>=next.mastery,eliteReady=!!next&&elite>=next.elite,ready=!!next&&levelReady&&masteryReady&&eliteReady&&!inst.broken;
    const masteryPct=next?Math.min(100,mastery/Math.max(1,next.mastery)*100):100,elitePct=next?.elite?Math.min(100,elite/Math.max(1,next.elite)*100):100;
    const track=FEATURED_RANKS.slice(1).map(r=>`<span class="${r.rank<rank?"done":r.rank===rank?"current":r.rank===rank+1?"next":""}" title="${esc(r.perk)} · Backup bis ${r.backupTier>=0?(RARITIES[r.backupTier]?.name||"Karte"):"–"}"><b>R${r.rank}</b><small>${esc(r.title)}</small><em>+${Math.round(r.bonus*100)}%</em></span>`).join("");
    const currentStorage=S.featuredStorageTier||0,nextStorageTier=next?.storageTier||0;
    const storageText=nextStorageTier>currentStorage?`Dieser Rank schaltet zusätzlich <b>${FEATURED_STORAGE_TIERS[nextStorageTier].name}</b> kostenlos frei.`:rank<5&&currentStorage<2?`Nächster gratis Speicher-Meilenstein: <b>Rank 5</b> · 25 Mio. Points / 500.000 XP.`:rank<10&&currentStorage<3?`Nächster gratis Speicher-Meilenstein: <b>Rank 10</b> · 250 Mio. Points / 1 Mio. XP.`:`Dein aktuell freigeschalteter Speicher bleibt dauerhaft erhalten.`;
    const perks=FEATURED_RANKS.slice(1).map(r=>`<li class="${r.rank<=rank?"done":""}"><b>Rank ${r.rank} · ${esc(r.title)}</b><span>${esc(r.perk)} · Backup bis ${esc(RARITIES[Math.max(0,r.backupTier)]?.name||"–")}${r.rank>=1?" + Exclusive":""}</span></li>`).join("");
    showModal(`<div class="bc-rank-panel"><div class="bc-manager-title"><div><small>PERSÖNLICHE KARTE · MEISTERSCHAFT</small><h2>🏅 Karten-Rank</h2><p>${esc(m.name)} · Level ${inst.level}/5 · Rank ${rank}/10 · ${esc(meta.title)}</p></div><button class="bc-manager-info" data-bc-rank-info title="Wie funktioniert Rank?" aria-label="Rank Info">i</button></div><div class="bc-rank-summary"><div><span>Aktueller Rank</span><strong>${rank}/10</strong><small>${esc(meta.title)} · +${Math.round(meta.bonus*100)} % Grundbonus</small></div><div><span>Meisterschaft</span><strong>${next?`${fmt(mastery)} / ${fmt(next.mastery)}`:"MAX"}</strong><small>Stärkere Gegner geben mehr Punkte.</small></div><div><span>Elite-Siege</span><strong>${next?`${fmt(elite)} / ${fmt(next.elite)}`:"MAX"}</strong><small>Nur Siege gegen stärkere Gegner.</small></div></div><div class="bc-rank-track">${track}</div>${max?`<div class="bc-rank-max"><b>🏆 RANK 10 · APEX</b><span>+25 % persönliche Points, XP, Kampfschaden und Kampf-Leben.</span><span>+10 % Trankwirkung · +10 % Special-Schaden · 10 % weniger erlittener Schaden · +10 % Kampfbelohnungen.</span><span>Maximaler Speicher: ${fmt(FEATURED_STORAGE_TIERS[3].points)} Points / ${fmt(FEATURED_STORAGE_TIERS[3].xp)} XP.</span></div>`:`<section class="bc-rank-next"><small>NÄCHSTER RANK · ${esc(next.title)} · RANK ${next.rank}</small><h3>${fmt(next.mastery)} Meisterschaft${next.elite?` + ${fmt(next.elite)} Elite-Siege`:""} + Level ${next.levelReq}</h3><p>Meisterschaft: <b>${fmt(mastery)} / ${fmt(next.mastery)}</b>. Ein Sieg gibt 1–12 Punkte abhängig von der Gegnerstärke.</p><i class="bc-rank-meter"><u style="width:${masteryPct}%"></u></i>${next.elite?`<p>Elite-Siege: <b>${fmt(elite)} / ${fmt(next.elite)}</b>.</p><i class="bc-rank-meter elite"><u style="width:${elitePct}%"></u></i>`:""}<p>Kartenlevel: <b>${inst.level}/5</b> · benötigt Level ${next.levelReq}. ${storageText}</p><p><b>Rank-Belohnung:</b> +${Math.round(next.bonus*100)} % Grundbonus · ${esc(next.perk)}.</p>${inst.broken?`<em class="bc-rank-warning">💥 Repariere die Karte vor dem Rank-Up.</em>`:""}<button data-bc-rank-upgrade ${ready?"":"disabled"}>${ready?`🏅 Rank ${next.rank} meistern · Level bleibt ${inst.level}`:`🔒 Rank ${next.rank} noch nicht bereit`}</button></section>`}<section class="bc-rank-backup"><div><small>BACKUP-KARTE · RANK-PERK</small><h3>${cardRank(inst)<1?"🔒 Freischaltung ab Rank 1":featuredBackupCard(inst)?`🛡 ${esc(cardMeta(featuredBackupCard(inst)).name)}`:"Noch keine Backup-Karte gewählt"}</h3><p>${cardRank(inst)<1?"Erreiche Rank 1, um den Backup-Slot zu aktivieren.":`Mit Rank ${rank} darf deine normale Backup-Karte bis <b>${esc(rankBackupTierName(inst))}</b> gehen. Exclusive ist immer erlaubt. Backup-Karten werden aus dem Produktions-Spielfeld entfernt. Sie dürfen eine eigene Spur nutzen; der persönliche Rank-Bonus der Hauptkarte gilt nicht für sie.`}</p>${cardRank(inst)>=1?`<div class="bc-rank-backup-actions"><button data-bc-backup-picker>${featuredBackupCard(inst)?"Backup wechseln":"Backup wählen"}</button>${featuredBackupCard(inst)?`<button class="secondary" data-bc-backup-clear>Backup entfernen</button>`:""}</div>`:""}</section><section class="bc-rank-perks"><small>RANK-MEILENSTEINE</small><ul>${perks}</ul></section><p class="bc-rank-foot">Meisterschaft, Elite-Siege und Rank gehören dauerhaft zu diesem Kartenexemplar. Wechselst du deine persönliche Karte, pausieren die Rank-Boni dieses Exemplars, gehen aber nicht verloren.</p></div>`);
  }
  function upgradeFeaturedRank(){
    const inst=featuredCard();if(!inst)return toast("Wähle zuerst eine persönliche Karte aus.");if(UI.battleSession)return toast("Beende zuerst den laufenden Kartenkampf.");if(inst.broken)return toast("Repariere die persönliche Karte zuerst.");
    const next=nextRankMeta(inst);if(!next)return toast("Diese Karte ist bereits Rank 10.");
    const mastery=cardRankMastery(inst),elite=cardRankEliteWins(inst);
    if(inst.level<next.levelReq)return toast(`Rank ${next.rank} benötigt Kartenlevel ${next.levelReq}. Aktuell: ${inst.level}/5.`);
    if(mastery<next.mastery)return toast(`Noch ${fmt(next.mastery-mastery)} Meisterschaftspunkte für Rank ${next.rank}.`);
    if(elite<next.elite)return toast(`Noch ${fmt(next.elite-elite)} Elite-Siege gegen stärkere Gegner für Rank ${next.rank}.`);
    inst.rank=next.rank;inst.rankedAt=now();const storage=applyRankStorageUnlock(inst);persist();refresh(false);showFeaturedRank();toast(`🏅 Rank ${next.rank} · ${next.title} erreicht! Level ${inst.level} bleibt erhalten · +${Math.round(next.bonus*100)} % Grundbonus · Backup bis ${RARITIES[next.backupTier]?.name||"–"}${storage?` · ${storage.name} gratis freigeschaltet`:""}.`,6000);
  }
  function featuredTrailVisual(inst,visualOnly=false){const t=visualOnly?trailBy(inst?.trail):activeTrail(inst);if(!t)return"";return `<div class="bc-feature-trail-sweep ${trailClass(inst)}" aria-hidden="true"><i></i><b>${t.icon}</b></div>`;}
  function featuredBackupSlotHtml(main){
    const rank=cardRank(main),backup=featuredBackupCard(main);
    if(rank<1)return `<section class="bc-feature-backup-slot locked"><div class="bc-feature-backup-head"><span>🛡</span><div><small>ZWEITER KAMPFSLOT · BACKUP-KARTE</small><h3>🔒 Freischaltung ab Rank 1</h3><p>Erreiche mit deiner Hauptkarte Rank 1. Danach kannst du hier direkt deine zweite Kampfkarte auswählen.</p></div></div><button data-bc-feature-rank>🏅 Rank ansehen</button></section>`;
    if(!backup)return `<section class="bc-feature-backup-slot empty"><div class="bc-feature-backup-head"><span>🛡</span><div><small>ZWEITER KAMPFSLOT · BACKUP-KARTE</small><h3>Noch keine Backup-Karte gewählt</h3><p>Mit Rank ${rank} darfst du normale Karten bis <b>${esc(rankBackupTierName(main))}</b> einsetzen. Exclusive- und VIP-Karten sind ab Rank 1 erlaubt.</p></div></div><button class="primary" data-bc-backup-picker>+ Backup-Karte auswählen</button><small class="bc-feature-backup-note">Die Backup-Karte kann nicht gleichzeitig im Produktions-Spielfeld liegen. Sie darf eine eigene Spur ausrüsten; der persönliche Rank-Bonus der Hauptkarte gilt nicht für sie.</small></section>`;
    const m=cardMeta(backup),placement=findCardPlacement(backup.id),t=trailBy(backup.trail),backupRank=cardRank(backup),potionCount=potionQueueCount(backup);
    const rarityLabel=backup.vip?`VIP · ${m.rarity.name}`:backup.exclusive?"EXCLUSIVE":m.rarity.name;
    return `<section class="bc-feature-backup-full-wrap"><div class="bc-feature-backup-full-head"><div><span>🛡</span><div><small>ZWEITER KAMPFSLOT · BACKUP-KARTE</small><h3>${esc(m.name)}</h3></div></div><em>${backup.broken?"💥 KAPUTT":"BEREIT"}</em></div><article class="bc-feature-card bc-feature-backup-full-card ${m.className} shiny-${backup.shiny} ${trailClass(backup)} ${backup.broken?"broken":""}">${featuredTrailVisual(backup,true)}<div class="bc-feature-card-art"><span>${m.icon}</span>${cardEffectBadges(backup)}${backup.broken?'<span class="bc-card-crack" aria-hidden="true"></span>':""}</div><small>${rarityLabel} · Rarität ${pct(m.rarityValue)}</small><h2>${esc(m.name)}</h2><div class="bc-feature-card-stats"><span>★ Level ${backup.level}/5</span><span>↻ Rebirth ${cardRebirth(backup)}/${CARD_REBIRTH_MAX}</span><span>🏅 Rank ${backupRank}/10 · ${esc(rankMeta(backupRank).title)}</span><span>⚔ ${fmt(m.combat.power)}</span><span>❤️ ${fmt(m.combat.hp)}</span><span>💥 ${fmt(m.combat.min)}–${fmt(m.combat.max)}</span>${placement?`<span>🏢 Stockwerk ${placement.floor+1}</span>`:`<span>🏢 Nicht auf Stockwerk</span>`}<span>🛡 Backup aktiv</span></div><div class="bc-feature-equipment"><span>${backup.aura?`${auraBy(backup.aura)?.icon||"✦"} ${auraBy(backup.aura)?.name}`:"✦ Keine Aura"}</span><span>${backup.combatAura?`⚔ ${combatAuraBy(backup.combatAura)?.name}`:"⚔ Keine Kampf-Aura"}</span><span>${backup.bind?`${bindBy(backup.bind)?.icon||"🔗"} ${bindBy(backup.bind)?.name}`:"🔗 Keine Bindung"}</span><span>${backup.shiny?`⚡ Shiny ${backup.shiny}/3`:"⚡ Kein Shiny"}</span><span>${potionCount?`🧪 ${potionCount}/3 Trank-Runden`:"🧪 Keine Tränke"}</span><span>${t?`${t.icon} ${t.name} · AKTIV`:"☄ Keine Spur"}</span><span>🛡 Zweite Kampfkarte</span><span>🏅 Rank-Bonus als Backup inaktiv</span></div>${backup.broken?`<p class="bc-feature-backup-warning">💥 Diese Backup-Karte ist zerbrochen und muss vor dem nächsten Kampfeinsatz repariert werden.</p>`:`<p class="bc-feature-backup-ready">Wenn die Hauptkarte kritisch wird oder K.O. geht, übernimmt diese Karte. Ihre eigene Aura, Kampf-Aura, Bindung, Shiny-Optik, Tränke und <b>eigene Spur</b> wirken weiter.</p>`}<div class="bc-feature-backup-trails"><small>☄ BACKUP-SPUR</small><div><button class="primary" data-bc-owned-trails="${backup.id}">🎒 Meine Spuren öffnen · ${fmt(ownedTrailInventoryCount())} im Inventar</button>${t?`<button class="secondary" data-bc-remove-trail="${backup.id}">Spur entfernen</button>`:""}</div></div></article><div class="bc-feature-backup-actions"><button class="primary" data-bc-backup-picker>Backup wechseln</button><button data-bc-card="${backup.id}">Karte ansehen</button><button class="secondary" data-bc-backup-clear>Backup entfernen</button></div><small class="bc-feature-backup-note">Backup ist vom Produktions-Spielfeld getrennt · eigene Spur erlaubt · kein persönlicher Rank-Bonus der Hauptkarte.</small></section>`;
  }
  function featureCardHtml(){
    updateFeaturedEarnings(now());const inst=featuredCard(),unlocked=clamp(Math.floor(Number(S.trailTierUnlocked)||0),0,TRAILS.length-1),currentTrail=TRAILS[unlocked],next=TRAILS[unlocked+1]||null,storage=featuredStorageMeta(),storageNext=featuredStorageNext();if(!inst)return `<section class="bc-section bc-feature-page"><div class="bc-section-title"><div><small>PERSÖNLICHER KARTEN-SLOT</small><h2>Karte</h2><p>Wähle eine einzelne Karte als persönliche Karte. Der Standard-Speicher fasst <b>250.000 Points und 50.000 XP</b>. Größere Limits gibt es per JK/Coin oder kostenlos über Karten-Ranks.</p></div><button class="bc-info-circle" data-bc-section-info="card" title="Karten-Info">i</button></div><div class="bc-empty-state bc-feature-empty"><span>🃏</span><h3>Noch keine persönliche Karte gewählt</h3><p>Die Karte wird aus dem Spielfeld herausgenommen, bleibt aber für Kartenkampf und alle Upgrades verfügbar.</p><div class="bc-feature-empty-actions"><button data-bc-feature-picker>Karte auswählen</button><button class="bc-best-featured ${S.bestCombatAutoUnlocked?"unlocked":"locked"}" data-bc-feature-best>${S.bestCombatAutoUnlocked?"⚡ Beste Kampfkarte auswählen":"🔒 Beste Kampfkarte · 100 JK/Coin"}</button></div></div></section>`;
    const m=cardMeta(inst),t=trailBy(inst.trail),rank=cardRank(inst),pointRate=featurePointRate(inst),xpRate=featureXpRate(inst),available=TRAILS.filter(x=>trailUnlocked(x.id)&&trailCount(x.id)>0),nextReady=next&&S.level>=next.levelReq&&inst.trail===currentTrail.id&&S.points>=next.unlockCost,pPct=Math.min(100,Math.max(0,Number(S.featuredPendingPoints)||0)/storage.points*100),xPct=Math.min(100,Math.max(0,Number(S.featuredPendingXp)||0)/storage.xp*100);
    return `<section class="bc-section bc-feature-page"><div class="bc-section-title"><div><small>PERSÖNLICHER KARTEN-SLOT</small><h2>Karte</h2><p>Diese Karte ist vom normalen Spielfeld getrennt. Ihre Produktion zählt <b>nicht</b> zur Anzeige „Produktion“ oben.</p></div><button class="bc-info-circle" data-bc-section-info="card" title="Karten-Info">i</button><div class="bc-feature-top-actions"><button data-bc-feature-picker>Karte wechseln</button><button class="bc-best-featured ${S.bestCombatAutoUnlocked?"unlocked":"locked"}" data-bc-feature-best>${S.bestCombatAutoUnlocked?"⚡ Beste Kampfkarte":"🔒 Beste Kampfkarte · 100 JK"}</button><button class="secondary" data-bc-feature-clear>Abwählen</button><button class="rank" data-bc-feature-rank>🏅 Rank</button><button class="rank-info" data-bc-rank-info title="Wie funktioniert Rank?" aria-label="Rank Info">i</button></div></div><div class="bc-feature-layout"><div class="bc-feature-primary"><article class="bc-feature-card ${m.className} shiny-${inst.shiny} ${trailClass(inst)} ${inst.broken?"broken":""}">${featuredTrailVisual(inst)}<div class="bc-feature-card-art"><span>${m.icon}</span>${cardEffectBadges(inst)}${inst.broken?'<span class="bc-card-crack" aria-hidden="true"></span>':""}</div><small>${inst.exclusive?"EXCLUSIVE":m.rarity.name} · Rarität ${pct(m.rarityValue)}</small><h2>${esc(m.name)}</h2><div class="bc-feature-card-stats"><span>★ Level ${inst.level}/5</span><span>↻ Rebirth ${cardRebirth(inst)}/${CARD_REBIRTH_MAX}</span><span>🏅 Rank ${rank}/10 · ${esc(rankMeta(rank).title)}</span><span>⚔ ${fmt(m.combat.power)}</span><span>❤️ ${fmt(m.combat.hp)}</span><span>💥 ${fmt(m.combat.min)}–${fmt(m.combat.max)}</span><span>📈 Meisterschaft +${Math.round(rankMeta(rank).bonus*100)}%</span></div><div class="bc-feature-equipment"><span>${inst.aura?`${auraBy(inst.aura)?.icon||"✦"} ${auraBy(inst.aura)?.name}`:"✦ Keine Aura"}</span><span>${inst.combatAura?`⚔ ${combatAuraBy(inst.combatAura)?.name}`:"⚔ Keine Kampf-Aura"}</span><span>${inst.bind?`${bindBy(inst.bind)?.icon||"🔗"} ${bindBy(inst.bind)?.name}`:"🔗 Keine Bindung"}</span><span>${inst.shiny?`⚡ Shiny ${inst.shiny}/3`:"⚡ Kein Shiny"}</span><span>${potionQueueCount(inst)?`🧪 ${potionQueueCount(inst)}/3 Trank-Runden`:"🧪 Keine Tränke"}</span><span>${t?`${t.icon} ${t.name}`:"☄ Keine Spur"}</span><span>${featuredBackupCard(inst)?`🛡 Backup: ${esc(cardMeta(featuredBackupCard(inst)).name)}`:cardRank(inst)>=1?"🛡 Backup frei":"🛡 Backup ab Rank 1"}</span></div><button class="bc-feature-detail" data-bc-card="${inst.id}">Karte & Ausrüstung bearbeiten</button></article>${featuredBackupSlotHtml(inst)}</div><div class="bc-feature-side"><section class="bc-feature-vault"><small>KARTEN-SLOT-SPEICHER · ${storage.name.toUpperCase()}</small><h3>Eigener Ertrag</h3><div class="bc-feature-vault-values"><div><span>Gesammelt</span><b data-bc-feature-pending>${fmt(S.featuredPendingPoints)}</b><small>von ${fmt(storage.points)} Points</small><i class="bc-storage-meter"><u data-bc-feature-point-meter style="width:${pPct}%"></u></i></div><div><span>Gesammelte XP</span><b data-bc-feature-xp>${fmt(S.featuredPendingXp)}</b><small>von ${fmt(storage.xp)} BigCards XP</small><i class="bc-storage-meter"><u data-bc-feature-xp-meter style="width:${xPct}%"></u></i></div></div><p>Aktuell <b data-bc-feature-rate>+${fmt(pointRate)}/s</b> Points und <b data-bc-feature-xp-rate>+${fmt(xpRate)}/s XP</b>. Sobald ein Limit voll ist, sammelt dieser Teil erst nach dem Einsammeln wieder weiter.</p>${storageNext?`<div class="bc-feature-storage-upgrade"><b>Nächste Speicherstufe · JK/Coin oder Rank ${rankStorageRequirement(storageNext.tier)} gratis</b><span>${fmt(storageNext.points)} Points · ${fmt(storageNext.xp)} XP</span><em>${fmt(storageNext.jk)} JK/Coin</em><button data-bc-jkshop>Im JK-Shop upgraden</button></div>`:`<div class="bc-feature-storage-upgrade max"><b>MAX-SPEICHER FREIGESCHALTET</b><span>${fmt(storage.points)} Points · ${fmt(storage.xp)} XP</span></div>`}<button class="bc-feature-collect" data-bc-feature-collect>💰 Geld einsammeln</button></section>${cardPotionSection(inst)}<section class="bc-feature-trail-panel"><small>SPUR</small><h3>${t?`${t.icon} ${t.name}`:"Keine Spur ausgerüstet"}</h3><p>${t?trailBonusText(t):"Spuren verändern das Design deiner Karte und erhöhen Karten-Slot-Points, XP, Kampfschaden und Kampf-Leben."}</p><div class="bc-feature-trail-actions"><button class="primary" data-bc-owned-trails="${inst.id}">🎒 Meine Spuren öffnen · ${fmt(ownedTrailInventoryCount())} im Inventar</button>${t?`<button class="secondary" data-bc-remove-trail="${inst.id}">Spur entfernen</button>`:""}<button data-bc-trail-shop>Spuren kaufen</button></div></section><section class="bc-trail-progression"><small>SPUREN-FREISCHALTUNG ${unlocked+1}/${TRAILS.length}</small><h3>Freigeschaltet bis ${currentTrail.name}</h3>${next?`<p>Für <b>${next.name}</b>: BigCards Level ${next.levelReq}, ${fmt(next.unlockCost)} Points und die <b>${currentTrail.name}</b> muss auf deiner persönlichen Karte ausgerüstet sein.</p><button data-bc-trail-unlock ${nextReady?"":"disabled"}>${nextReady?`${next.name} freischalten · ${fmt(next.unlockCost)}`:`🔒 ${next.name} · Level ${next.levelReq}`}</button>`:'<p><b>MAX:</b> Alle Spuren bis Göttlich freigeschaltet.</p>'}</section></div></div></section>`;
  }

  async function sellCard(id){const inst=instance(id);if(!inst)return;if(isCardOnExpedition(id))return toast("Diese Karte ist gerade auf Expedition und kann nicht verkauft werden.");if(id===S.featuredCardId)return toast("Wähle die Karte im Tab „Karte“ zuerst ab, bevor du sie verkaufst.");if(featuredCard()?.backupCardId===id)return toast("Entferne diese Karte zuerst im Rank-Menü als Backup-Karte.");if(inst.broken)return toast("Repariere die Karte vor dem Verkauf.");if(inst.favorite||inst.locked)return toast("Favorisierte/gesperrte Karten können nicht verkauft werden.");if(S.floors.flat().includes(id))return toast("Nimm die Karte zuerst vom Stockwerk.");if(inst.listed)return toast("Die Karte ist im Online-Marktplatz gelistet.");const m=cardMeta(inst),warning=(inst.aura||inst.combatAura||inst.bind)?"\nAura/Kampf-Aura/Bindung werden mitverkauft. Entferne sie vorher, wenn du sie behalten willst.":"";if(!await gameConfirm({title:"Karte verkaufen",message:`${m.name}\nVerkaufspreis: ${fmt(m.value)} Points${warning}\n\nDer Verkauf ist endgültig.`,confirmText:`Für ${fmt(m.value)} Points verkaufen`,icon:"💰",tone:"danger"}))return;if(potionQueueCount(inst))returnPreparedPotions(inst);if(inst.trail)returnTrailToInventory(inst);clearBackupReferences(id);delete S.instances[id];invalidateCardPowerCache();S.points+=m.value;persist();refresh();closeModal();toast(`+${fmt(m.value)} Points`);}
  function shredDuplicate(id){
    const anchor=instance(id);if(!anchor)return toast("Karte nicht gefunden.");
    const key=collectionKey(anchor),main=featuredCard(),backupId=main?.backupCardId||null,deployed=new Set((S.floors||[]).flat().filter(Boolean));
    const candidates=Object.values(S.instances||{}).filter(inst=>inst&&inst.id!==anchor.id&&collectionKey(inst)===key&&!inst.favorite&&!inst.locked&&!inst.listed&&!inst.broken&&!isCardOnExpedition(inst.id)&&!deployed.has(inst.id)&&inst.id!==S.featuredCardId&&inst.id!==backupId&&fusionVariant(inst)==="normal"&&!inst.aura&&!inst.combatAura&&!inst.bind&&!inst.trail&&!potionQueueCount(inst));
    if(!candidates.length)return toast("Kein freies, sicheres Duplikat zum Zerlegen vorhanden. Die geöffnete Karte wird niemals zurückgesetzt oder gelöscht.",4200);
    candidates.sort((a,b)=>cardRebirth(a)-cardRebirth(b)||a.level-b.level||(Number(a.shiny)||0)-(Number(b.shiny)||0)||combatStats(a).power-combatStats(b).power);
    const inst=candidates[0],gain=Math.max(1,Math.round((inst.exclusive?20:inst.rarity+1)*4/Math.max(.3,Math.sqrt(cardMeta(inst).rarityValue)))),dust=fusionDustGain(inst);
    delete S.instances[inst.id];invalidateCardPowerCache();S.shards+=gain;S.fusionDust+=dust;persist();refresh();toast(`Duplikat zerlegt · +${gain} Card Shards · +${dust} Fusionsstaub. Deine geöffnete Karte bleibt unverändert.`,4200);
  }

  function findCardPlacement(id){for(let floor=0;floor<S.floors.length;floor++){const slot=S.floors[floor].indexOf(id);if(slot>=0)return {floor,slot};}return null;}
  function sameVariantOnFloor(inst,floor,excludeId=null){if(!inst||!S.floors[floor])return null;const key=collectionKey(inst);for(const id of S.floors[floor]){if(!id||id===excludeId)continue;const other=instance(id);if(other&&collectionKey(other)===key)return other;}return null;}
  function placeCard(id,floor=UI.floor,slot=UI.selectedSlot){
    const inst=instance(id);if(!inst)return;if(isCardOnExpedition(id))return toast("Diese Karte ist gerade auf Expedition. Hole sie nach Abschluss zuerst zurück.");if(id===S.featuredCardId)return toast("Diese Karte liegt im persönlichen Karten-Slot. Wähle sie dort zuerst ab, bevor du sie aufs Spielfeld setzt.");if(featuredCard()?.backupCardId===id)return toast("Diese Karte ist deine Backup-Kampfkarte und kann nicht gleichzeitig im Produktions-Spielfeld liegen.");if(inst.listed)return toast("Diese Karte ist im Online-Marktplatz gesperrt.");if(floor>=S.unlockedFloors)return toast("Stockwerk noch gesperrt.");if(inst.exclusive&&floor!==0)return toast("Exclusive-Karten können im Produktionsfeld ausschließlich auf Stockwerk 1 eingesetzt werden.",3600);if(inst.vip&&floor>1)return toast("VIP-Karten können im Produktionsfeld ausschließlich auf Stockwerk 1 oder 2 eingesetzt werden.",3600);if(inst.exclusive&&premiumFieldCount("exclusive",id)>=PREMIUM_FIELD_LIMIT)return toast("Maximal 5 Exclusive-Karten dürfen gleichzeitig im gesamten Produktionsfeld aktiv sein.",4200);if(inst.vip&&premiumFieldCount("vip",id)>=PREMIUM_FIELD_LIMIT)return toast("Maximal 5 VIP-Karten dürfen gleichzeitig über Stockwerk 1 und 2 aktiv sein.",4200);
    const max=floorMaxTier(floor),required=(inst.exclusive||inst.vip)?0:inst.rarity;if(required>max&&!(hasEarlyFieldVipAccess()&&inst.fieldPermit))return toast(hasEarlyFieldVipAccess()?`${cardMeta(inst).name} ist regulär noch nicht für Stockwerk ${floor+1} freigeschaltet. Kaufe bei dieser Karteninstanz zuerst die VIP-Vorzeitfreigabe.`:"Vorzeitiges Einsetzen höherer Karten ist ausschließlich mit dauerhaftem BigCards VIP möglich.",4200);
    const same=sameVariantOnFloor(inst,floor,id);if(same)return toast(`${cardMeta(inst).name} ist auf Stockwerk ${floor+1} bereits eingesetzt. Pro Stockwerk ist jede Kartenvariante nur 1× erlaubt.`);
    if(S.floors.flat().includes(id))for(const row of S.floors){const i=row.indexOf(id);if(i>=0)row[i]=null}
    let target=Number.isInteger(slot)?slot:S.floors[floor].findIndex(x=>!x);if(target<0)return toast("Dieses Stockwerk hat keinen freien Kartenplatz. Entferne zuerst eine Karte oder nutze Bestes Setup.");
    S.floors[floor][target]=id;UI.selectedSlot=null;addXp(8);persist();refresh();closeModal();
  }
  function removeFromSlot(floor,slot){if(!S.floors[floor]||slot<0||slot>=S.floors[floor].length)return;S.floors[floor][slot]=null;persist();refresh();}
  async function unlockAndPlaceCard(id){
    const inst=instance(id);if(!inst||inst.exclusive||inst.vip)return placeCard(id);
    const max=floorMaxTier(UI.floor);if(inst.rarity<=max||(hasEarlyFieldVipAccess()&&inst.fieldPermit))return placeCard(id);if(!hasEarlyFieldVipAccess())return showVipInfo();
    const same=sameVariantOnFloor(inst,UI.floor,id);if(same)return toast(`${cardMeta(inst).name} ist auf Stockwerk ${UI.floor+1} bereits eingesetzt.`);
    const target=Number.isInteger(UI.selectedSlot)?UI.selectedSlot:S.floors[UI.floor].findIndex(x=>!x);if(target<0)return toast("Kein freier Kartenplatz. Entferne zuerst eine Karte.");
    const cost=fieldPermitCost(inst);if(S.points<cost)return toast(`Vorzeitige Spielfeld-Freigabe kostet ${fmt(cost)} Points.`);
    if(!await gameConfirm({title:"Spielfeld-Freigabe",message:`${cardMeta(inst).name} vorzeitig freischalten?\nVoraussetzung: aktiver dauerhafter BigCards VIP-Zugang.\nDiese Freigabe gilt dauerhaft für genau diese Karteninstanz, solange VIP vorhanden ist.\nKosten: ${fmt(cost)} Points`,confirmText:`${fmt(cost)} Points einsetzen`,icon:"🔓",tone:"points"}))return;
    S.points-=cost;inst.fieldPermit=true;raiseScore(Math.max(20,Math.floor(Math.log10(1+cost)*35)));addXp(Math.max(15,Math.floor(Math.log10(1+cost)*9)));persist();placeCard(id,UI.floor,target);toast(`${cardMeta(inst).name} ist jetzt vorzeitig spielfeldberechtigt.`);
  }
  function removeCardFromField(id){const placement=findCardPlacement(id);if(!placement)return toast("Diese Karte ist aktuell auf keinem Stockwerk eingesetzt.");S.floors[placement.floor][placement.slot]=null;UI.floor=placement.floor;UI.selectedSlot=placement.slot;persist();closeModal();refresh();toast(`Karte von Stockwerk ${placement.floor+1}, Platz ${placement.slot+1} entfernt.`);}
  function swapFieldSlots(floor,fromSlot,toSlot){
    if(floor!==UI.floor||!S.floors[floor]||fromSlot===toSlot)return false;
    const row=S.floors[floor],from=row[fromSlot];if(!from)return false;
    const target=row[toSlot]||null;row[toSlot]=from;row[fromSlot]=target;UI.selectedSlot=null;persist();refresh();
    toast(target?`Kartenplätze ${fromSlot+1} und ${toSlot+1} getauscht.`:`Karte auf Platz ${toSlot+1} verschoben.`);return true;
  }
  function clearFieldDragVisuals(){
    const d=UI.drag;if(!d)return;clearTimeout(d.timer);d.ghost?.remove();d.sourceEl?.classList.remove("bc-drag-source");UI.overlay?.querySelectorAll?.(".bc-drop-target").forEach(el=>el.classList.remove("bc-drop-target"));
  }
  function startFieldDrag(e){
    const d=UI.drag;if(!d||d.active||UI.tab!=="field")return;const inst=instance(d.cardId);if(!inst)return;
    d.active=true;UI.suppressClickUntil=now()+500;d.sourceEl.classList.add("bc-drag-source");
    const ghost=d.sourceEl.cloneNode(true);ghost.classList.add("bc-drag-ghost");ghost.removeAttribute("data-bc-card");ghost.removeAttribute("data-bc-slot");
    const r=d.sourceEl.getBoundingClientRect();ghost.style.width=`${r.width}px`;ghost.style.height=`${r.height}px`;document.body.append(ghost);d.ghost=ghost;
    updateFieldDrag(e);navigator.vibrate?.(18);
  }
  function updateFieldDrag(e){
    const d=UI.drag;if(!d?.active)return;e.preventDefault?.();
    d.ghost.style.transform=`translate3d(${e.clientX-d.ghost.offsetWidth/2}px,${e.clientY-d.ghost.offsetHeight/2}px,0) scale(1.07) rotate(-1.5deg)`;
    UI.overlay?.querySelectorAll?.(".bc-drop-target").forEach(el=>el.classList.remove("bc-drop-target"));
    const hit=document.elementFromPoint(e.clientX,e.clientY)?.closest?.(".bc-slot[data-bc-slot]");
    const slot=hit&&UI.overlay?.contains(hit)?Number(hit.dataset.bcSlot):NaN;d.targetSlot=Number.isInteger(slot)?slot:null;
    if(hit&&d.targetSlot!==d.sourceSlot)hit.classList.add("bc-drop-target");
  }
  function finishFieldDrag(e,cancel=false){
    const d=UI.drag;if(!d)return;clearTimeout(d.timer);
    if(d.active){UI.suppressClickUntil=now()+500;if(!cancel&&Number.isInteger(d.targetSlot)&&d.targetSlot!==d.sourceSlot)swapFieldSlots(d.floor,d.sourceSlot,d.targetSlot);}
    clearFieldDragVisuals();UI.drag=null;
  }
  // V391: „Bestes Setup“ arbeitet linear statt alle Karten komplett zu sortieren.
  // Bei großen Sammlungen wird die Arbeit in kurze Blöcke geteilt, damit der Browser
  // zwischen den Blöcken zeichnen und Eingaben verarbeiten kann. Premiumkarten teilen
  // sich dabei denselben einmal berechneten normalen Referenzwert.
  function smartSetupYield(){return new Promise(resolve=>requestAnimationFrame(()=>resolve()));}
  async function smartSetup(floor=UI.floor){
    if(UI.smartSetupLoading)return toast("Bestes Setup wird bereits berechnet …",1600);
    const button=UI.overlay?.querySelector("[data-bc-smart]");
    UI.smartSetupLoading=true;const token=++UI.smartSetupToken;
    const valid=()=>UI.overlay&&UI.tab==="field"&&token===UI.smartSetupToken;
    if(button){button.disabled=true;button.textContent="⚡ Bestes Setup · prüft Karten …";}
    try{
      const max=floorMaxTier(floor),used=new Set();
      for(const row of S.floors||[])for(const id of row||[])if(id)used.add(id);
      for(const id of S.floors?.[floor]||[])if(id)used.delete(id);
      const bestByKey=new Map(),premiumCandidates=[];
      const premiumMax=premiumReferenceTier();let strongestNormal=1,checked=0;
      for(const id in (S.instances||{})){
        const inst=S.instances[id];checked++;
        if(inst&&!inst.exclusive&&!inst.vip&&inst.rarity<=premiumMax){
          strongestNormal=Math.max(strongestNormal,cardBasePointProduction(inst.rarity,inst.base)*(LEVEL_MULT[inst.level]||1));
        }
        if(inst&&!inst.listed&&!isFeaturedCombatCardId(inst.id)&&!used.has(inst.id)&&((inst.exclusive&&floor===0)||(inst.vip&&floor<=1)||(!inst.exclusive&&!inst.vip&&(inst.rarity<=max||(hasEarlyFieldVipAccess()&&inst.fieldPermit))))){
          if(inst.exclusive||inst.vip)premiumCandidates.push(inst);
          else{
            const key=collectionKey(inst),score=effectivePoints(inst),prev=bestByKey.get(key);
            if(!prev||score>prev.score)bestByKey.set(key,{inst,score});
          }
        }
        if(checked%700===0){
          if(!valid())return;
          if(button)button.textContent=`⚡ Bestes Setup · ${fmt(checked)} Karten geprüft`;
          await smartSetupYield();
        }
      }
      if(!valid())return;
      // Der gerade im selben Durchlauf ermittelte Premium-Anker verhindert eine
      // zweite Vollsuche durch alle Karten beim ersten Exclusive-/VIP-Vergleich.
      premiumNormalBaseCacheValue=strongestNormal;
      premiumNormalBaseCacheKey=`${cardPowerRevision}:${premiumMax}`;
      for(let i=0;i<premiumCandidates.length;i++){
        const inst=premiumCandidates[i],key=collectionKey(inst),score=effectivePoints(inst),prev=bestByKey.get(key);
        if(!prev||score>prev.score)bestByKey.set(key,{inst,score});
        if(i&&i%700===0){if(!valid())return;await smartSetupYield();}
      }
      const sorted=[...bestByKey.values()].sort((a,b)=>b.score-a.score);
      const top=[],premiumBudget={
        exclusive:Math.max(0,PREMIUM_FIELD_LIMIT-premiumFieldCount("exclusive","",floor)),
        vip:Math.max(0,PREMIUM_FIELD_LIMIT-premiumFieldCount("vip","",floor))
      };
      for(const row of sorted){
        const inst=row.inst;
        if(inst.exclusive){if(premiumBudget.exclusive<=0)continue;premiumBudget.exclusive--;}
        if(inst.vip){if(premiumBudget.vip<=0)continue;premiumBudget.vip--;}
        top.push(row);if(top.length>=10)break;
      }
      if(!valid())return;
      S.floors[floor]=Array.from({length:10},(_,i)=>top[i]?.inst.id||null);
      persist();refresh(false);toast("Bestes Setup gesetzt · jede Kartenvariante maximal 1× auf diesem Stockwerk.");
    }finally{
      UI.smartSetupLoading=false;
      const current=UI.overlay?.querySelector("[data-bc-smart]");
      if(current&&UI.tab==="field"){current.disabled=false;current.textContent="⚡ Bestes Setup";}
    }
  }

  function showVipInfo(){
    const reward=vipWheelRewardMeta(),vipOdds=vipPackRarityChances(),oddsHtml=vipOdds.map(x=>`<span class="rar-${RARITIES[x.rarity]?.id||"common"}"><b>${RARITIES[x.rarity]?.symbol||"⚪"} ${RARITIES[x.rarity]?.name||"Gewöhnlich"}</b><em>${x.chance.toLocaleString("de-DE",{maximumFractionDigits:x.chance<.1?4:2})} % im VIP-Kartenpool</em></span>`).join("");showModal(`<div class="bc-vip-info"><small>BIGCARDS VIP · DAUERHAFT</small><h2>👑 Das komplette VIP-Programm</h2><p>VIP kostet einmalig <b>500 JK/Coin</b> und bleibt dauerhaft auf deinem BigCards-Spielstand. Es schaltet <b>VIP-Glücksrad</b>, <b>VIP-Klicker</b> und die <b>vorzeitige Spielfeld-Freigabe</b> höherer normaler/Wins-Karten frei. Das separate VIP-Pack kostet ebenfalls 500 JK/Coin pro Öffnung und kann unabhängig vom Dauer-VIP gekauft werden.</p><div class="bc-vip-info-grid"><article><b>🎡 Tägliches Glücksrad</b><span>1 Spin pro Kalendertag. Der gezogene Bonus läuft bis zum nächsten täglichen Spin/Reset.</span><small>2× XP · 2× Kraft · 2× Points · 2× Produktion · 2× VIP-Klicks</small></article><article><b>👆 VIP-Klicker</b><span>Klicke Karten herunter, sammle VIP-Klicks und verbessere den Klicker bis Level 100.</span><small>Nach jedem besiegten Gegner besteht <b>2 %</b> Chance, dass der nächste Gegner ein VIP-Boss ist.</small></article><article><b>👑 100 VIP-Karten</b><span>VIP-Karten skalieren mit deinem echten normalen Kartenfortschritt und erreichen voll ausgebaut ungefähr den Galaxy-Bereich. Hyper bleibt darüber das reine Kampf-Endgame.</span><small>Stockwerk 1–2 + Kartenkampf. Sie zählen nur zum Pay-Score. Alle VIP- und Exclusive-Karten erhalten zusätzlich den aktuellen Premium-Stärkebonus. Ohne VIP funktionieren alte vorzeitige Freigaben für höhere normale Karten nicht mehr.</small></article><article><b>💥 Boss-Specials</b><span>13 Special-Attacken von Gewöhnlich bis Göttlich. Du kaufst sie mit VIP-Klicks, rüstest eine aus und lädst sie durch normale Klicks auf.</span><small>Special-Attacken funktionieren gegen VIP-Bosse und werden mit höheren Raritäten stärker.</small></article></div><div class="bc-vip-drop-info"><small>VIP-PACK · ALLE 100 VIP-KARTEN</small><p>Das VIP-Pack kann aus allen 100 VIP-Karten ziehen – von Gewöhnlich bis Göttlich. Höhere Raritäten bleiben bewusst deutlich seltener; dein normaler Pack-Fortschritt begrenzt dieses bezahlte VIP-Pack nicht.</p><div>${oddsHtml}</div></div>${reward&&vipWheelActive(reward.id)?`<div class="bc-vip-current-bonus"><b>Aktueller Tagesbonus: ${reward.icon} ${reward.label}</b><span>${esc(reward.desc)}</span><small>Noch ${timeLeft(S.vipWheelUntil)}</small></div>`:""}<button data-bc-modal-close>Verstanden</button></div>`);
  }
  function spinVipWheel(){
    if(!S.vipUnlocked)return window.JKCoinApp?.openForGame?.("bigcards");
    if(!vipWheelAvailable())return toast(`VIP-Glücksrad morgen wieder verfügbar · aktueller Bonus: ${vipWheelRewardMeta()?.label||"bereits gezogen"}.`,4200);
    let total=VIP_WHEEL_REWARDS.reduce((n,x)=>n+x.weight,0),r=Math.random()*total,pick=VIP_WHEEL_REWARDS[0];for(const row of VIP_WHEEL_REWARDS){r-=row.weight;if(r<=0){pick=row;break;}}
    const index=Math.max(0,VIP_WHEEL_REWARDS.findIndex(x=>x.id===pick.id)),segmentCenter=index*72+36,current=((Number(UI.vipWheelRotation)||0)%360+360)%360,targetWithin=(360-segmentCenter+360)%360,delta=(targetWithin-current+360)%360,target=(Number(UI.vipWheelRotation)||0)+1800+delta;
    S.vipWheelDay=dailyKey();S.vipWheelReward=pick.id;S.vipWheelUntil=nextLocalDayReset();UI.vipWheelSpinning=true;UI.vipWheelTargetRotation=target;persist();refresh(false);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{const wheel=UI.overlay?.querySelector("[data-bc-vip-wheel]");if(wheel)wheel.style.transform=`rotate(${target}deg)`;}));
    setTimeout(()=>{UI.vipWheelRotation=target;UI.vipWheelSpinning=false;if(UI.tab==="vipWheel")refresh(true);toast(`${pick.icon} VIP-Glücksrad: ${pick.label} bis zum nächsten Tagesreset!`,5200);},2400);
  }
  function vipWheelHtml(){
    if(!S.vipUnlocked)return `<section class="bc-section bc-vip-locked"><button class="bc-shop-info bc-vip-locked-info" data-bc-vip-info title="Info zu BigCards VIP" aria-label="Info zu BigCards VIP">i</button><div class="bc-vip-lock-icon">👑</div><small>BIGCARDS VIP</small><h2>VIP-Glücksrad</h2><p>Dieser Bereich gehört zum permanenten VIP-Programm.</p><b>500 JK/Coin · einmalig · dauerhaft</b><div class="bc-vip-buy-actions"><button data-bc-jkshop>VIP im JK/Coin-Shop kaufen</button></div></section>`;
    const reward=vipWheelRewardMeta(),available=vipWheelAvailable(),segments=VIP_WHEEL_REWARDS.map(x=>`<span>${x.icon}<small>${x.label}</small></span>`).join(""),rotation=Number(UI.vipWheelRotation)||0;
    return `<section class="bc-section bc-vip-page bc-vip-wheel-page"><div class="bc-vip-page-actions"><button class="bc-vip-info-btn" data-bc-vip-info title="VIP-Programm Info">i</button><button class="bc-vip-close-btn" data-bc-tab="shop" title="VIP-Glücksrad schließen" aria-label="VIP-Glücksrad schließen">×</button></div><div class="bc-section-title"><div><small>VIP · TÄGLICHER BONUS</small><h2>🎡 VIP-Glücksrad</h2><p>Ein Spin pro Tag. Das Rad dreht sichtbar bis auf das gezogene Feld; rechts erscheint exakt derselbe Tagesbonus.</p></div></div><div class="bc-vip-wheel-layout"><div class="bc-vip-wheel-wrap"><div class="bc-vip-wheel-pointer">▼</div><div class="bc-vip-wheel ${UI.vipWheelSpinning?"spinning":""}" data-bc-vip-wheel style="transform:rotate(${rotation}deg)"><div class="bc-vip-wheel-labels">${segments}</div><strong>VIP</strong></div><button class="bc-vip-spin" data-bc-vip-spin ${!available||UI.vipWheelSpinning?"disabled":""}>${UI.vipWheelSpinning?"RAD DREHT …":available?"JETZT DREHEN":"MORGEN WIEDER"}</button></div><div class="bc-vip-wheel-status"><small>${UI.vipWheelSpinning?"DAS RAD LANDET AUF":"DEIN TAGESBONUS"}</small><h3>${reward&&vipWheelActive(reward.id)?`${reward.icon} ${reward.label}`:"Noch kein Bonus aktiv"}</h3><p>${reward&&vipWheelActive(reward.id)?reward.desc:"Drehe das Rad und erhalte einen von fünf VIP-Multiplikatoren."}</p>${reward&&vipWheelActive(reward.id)?`<b>Restzeit ${timeLeft(S.vipWheelUntil)}</b>`:""}<div class="bc-vip-wheel-prizes">${VIP_WHEEL_REWARDS.map(x=>`<span class="${reward?.id===x.id&&vipWheelActive(x.id)?"active":""}">${x.icon} ${x.label}</span>`).join("")}</div></div></div></section>`;
  }
  function awardVipClickerDefeat(enemy){
    const boss=!!enemy.boss,rarity=clamp(Math.floor(Number(enemy.rarity)||0),0,12),row={at:now(),boss,points:0,xp:0,shards:0,vipCard:"",normalCard:"",item:""},pointMult=vipWheelMultiplier("points")*ultimateSetMultiplier(),base=Math.max(1,vipClickerDamage());row.points=Math.round(base*(boss?95:12)*(1+rarity*.45)*pointMult);row.xp=Math.round((boss?85:12)*(rarity+1));row.shards=(boss?Math.max(5,5+rarity*2):(Math.random()<.22?1+Math.floor(rarity/3):0))*ultimateSetMultiplier();S.points+=row.points;S.lifetimePointsEarned+=row.points;addXp(row.xp);S.shards+=row.shards;
    const vipChance=vipClickerVipChance(boss);if(Math.random()<vipChance){const rolled=vipCardRarityRoll(),res=rollVipCard(rolled);row.vipCard=`${RARITIES[res.inst.rarity]?.symbol||"👑"} ${cardMeta(res.inst).name}${res.wasNew?" · NEU":" · Duplikat"}`;}else if(Math.random()<(boss?.72:.28)){const pack=clamp(rarityUnlockedIndex(),0,12),res=rollNormal(pack);row.normalCard=`${RARITIES[res.inst.rarity]?.symbol||"🎴"} ${cardMeta(res.inst).name}${res.wasNew?" · NEU":" · Duplikat"}`;}
    if(Math.random()<(boss?.32:.055)){if(Math.random()<.52){const kitId=RARITIES[Math.min(rarity,12)]?.id||"common";S.repairKits[kitId]=repairKitCount(kitId)+1;row.item=`🧰 ${repairKitMeta(kitId).name}`;}else{const type=POTION_TYPES[Math.floor(Math.random()*POTION_TYPES.length)],tierId=RARITIES[Math.min(rarity,12)]?.id||"common",key=potionKey(tierId,type.id);S.potionInventory[key]=potionCount(tierId,type.id)+1;row.item=`🧪 ${RARITIES[rarity]?.name||"Gewöhnlich"} ${type.name}`;}}
    if(boss)S.vipClickerBosses++;S.vipClickerLastReward=row;return row;
  }
  function vipClick(){
    if(!S.vipUnlocked)return;const enemy=ensureVipClickerEnemy();if(!enemy)return;let dmg=vipEffectiveClickDamage(),crit=Math.random()<vipEffectiveCritChance();if(crit)dmg=Math.round(dmg*2.5);enemy.hp=Math.max(0,Number(enemy.hp)-dmg);const gain=vipClickGainMultiplier();S.vipClicks+=gain;S.vipClickerSpecialCharge+=1;spawnVipDamagePop(dmg,crit,false);
    if(enemy.hp<=0){S.vipClickerDefeats++;const reward=awardVipClickerDefeat(enemy),bossNext=Math.random()<.02;S.vipClickerEnemy=makeVipClickerEnemy(bossNext);persist();refresh(true);return toast(`${enemy.boss?"👑 BOSS BESIEGT":"Karte besiegt"} · ${vipRewardSummaryText(reward)}`,enemy.boss?5200:3200);}
    persistPassive();refreshVipClickerLive(enemy);
  }
  function upgradeVipClicker(){if(!S.vipUnlocked)return;if(S.vipClickerLevel>=100)return toast("VIP-Klicker ist bereits Level 100 MAX.");const cost=vipClickerUpgradeCost();if(S.vipClicks<cost)return toast(`Dir fehlen ${fmt(cost-S.vipClicks)} VIP-Klicks.`);S.vipClicks-=cost;S.vipClickerLevel++;S.vipClickerEnemy=null;persist();refresh(false);toast(`👑 VIP-Klicker Level ${S.vipClickerLevel} erreicht!`,3400);}
  function buyVipSpecial(id){const sp=vipSpecialBy(id);if(!sp||!vipSpecialAvailable(sp))return toast("Diese Special-Attacke ist durch deinen Pack-Fortschritt noch gesperrt.");if(vipSpecialOwned(id)){S.vipClickerSpecialEquipped=id;persist();refresh(true);return toast(`${sp.icon} ${sp.name} ausgerüstet · ${vipSpecialPassiveText(sp)}`,3600);}if(S.vipClicks<sp.cost)return toast(`Du brauchst ${fmt(sp.cost)} VIP-Klicks.`);S.vipClicks-=sp.cost;S.vipClickerSpecialOwned[id]=true;S.vipClickerSpecialEquipped=id;persist();refresh(true);toast(`${sp.icon} ${sp.name} gekauft & ausgerüstet · ${vipSpecialPassiveText(sp)}`,4200);}
  function useVipSpecial(){const enemy=ensureVipClickerEnemy(),sp=equippedVipSpecial();if(!enemy?.boss)return toast("Special-Attacken sind für VIP-Bosse reserviert.");if(!sp)return toast("Kaufe und rüste zuerst eine VIP-Special-Attacke aus.");if(S.vipClickerSpecialCharge<sp.charge)return toast(`Noch ${sp.charge-S.vipClickerSpecialCharge} normale Klicks bis ${sp.name} bereit ist.`);let dmg=Math.round(vipEffectiveClickDamage()*sp.mult),crit=Math.random()<vipEffectiveCritChance();if(crit)dmg=Math.round(dmg*2.5);S.vipClickerSpecialCharge=0;enemy.hp=Math.max(0,enemy.hp-dmg);spawnVipDamagePop(dmg,crit,true);if(enemy.hp<=0){S.vipClickerDefeats++;const reward=awardVipClickerDefeat(enemy);S.vipClickerEnemy=makeVipClickerEnemy(Math.random()<.02);persist();refresh(true);return toast(`${sp.icon} ${sp.name}: BOSS BESIEGT · ${vipRewardSummaryText(reward)}`,5600);}persistPassive();refreshVipClickerLive(enemy);}
  function vipClickerHtml(){
    if(!S.vipUnlocked)return `<section class="bc-section bc-vip-locked"><button class="bc-shop-info bc-vip-locked-info" data-bc-vip-info title="Info zu BigCards VIP" aria-label="Info zu BigCards VIP">i</button><div class="bc-vip-lock-icon">👑</div><small>BIGCARDS VIP</small><h2>VIP-Klicker</h2><p>100 exklusive VIP-Karten, Bosse, Upgrades und Special-Attacken werden mit dem permanenten VIP-Programm freigeschaltet.</p><b>500 JK/Coin · einmalig · dauerhaft</b><div class="bc-vip-buy-actions"><button data-bc-jkshop>VIP im JK/Coin-Shop kaufen</button></div></section>`;
    const enemy=ensureVipClickerEnemy(),pctHp=clamp(Number(enemy.hp)/Math.max(1,Number(enemy.maxHp))*100,0,100),eq=equippedVipSpecial(),nextCost=S.vipClickerLevel<100?vipClickerUpgradeCost():0,maxDrop=vipUnlockedMaxRarity(),clickMult=vipClickGainMultiplier(),shopMult=jkVipClickMultiplier(),vipChance=vipClickerVipChance(false)*100,effectiveDamage=vipEffectiveClickDamage(),effectiveCrit=vipEffectiveCritChance()*100;
    return `<section class="bc-section bc-vip-page bc-vip-clicker-page"><div class="bc-vip-page-actions"><button class="bc-vip-info-btn" data-bc-vip-info title="VIP-Programm Info">i</button><button class="bc-vip-close-btn" data-bc-tab="shop" title="VIP-Klicker schließen" aria-label="VIP-Klicker schließen">×</button></div><div class="bc-section-title"><div><small>VIP · KLICKER ARENA</small><h2>👆 VIP-Klicker</h2><p>Karten besitzen deutlich mehr HP. Jeder Treffer wird direkt an einer leicht wechselnden Stelle auf der Karte eingeblendet.</p></div></div><div class="bc-vip-clicker-stats"><span><small>VIP-KLICKS</small><b data-bc-vip-click-count>${fmt(S.vipClicks)}</b><em>${clickMult}× Klick-Ertrag${shopMult>1?` · JK-Shop ×${shopMult}`:""}</em></span><span><small>KLICKER</small><b>Level ${S.vipClickerLevel}/100</b><em>${fmt(effectiveDamage)} Schaden/Klick · ${effectiveCrit.toLocaleString("de-DE",{maximumFractionDigits:1})} % Krit${eq?` · ${eq.icon} aktiv`:""}</em></span><span><small>VIP-CHANCE</small><b>${vipChance.toLocaleString("de-DE",{maximumFractionDigits:2})} %</b><em>steigt ab Level 20 weiter</em></span><span><small>BESIEGT</small><b>${fmt(S.vipClickerDefeats)}</b><em>${fmt(S.vipClickerBosses)} Bosse</em></span></div><div class="bc-vip-clicker-layout"><div class="bc-vip-clicker-arena ${enemy.boss?"boss":""}"><div class="bc-vip-enemy-head"><small>${enemy.boss?"👑 2%-VIP-BOSS":"KLICKER-KARTE"}</small><b>${esc(enemy.name)}</b><span>${RARITIES[enemy.rarity]?.name||"Gewöhnlich"}</span></div><div class="bc-vip-enemy-hp"><i data-bc-vip-hp-fill style="width:${pctHp}%"></i><b data-bc-vip-hp-text>${fmt(enemy.hp)} / ${fmt(enemy.maxHp)} HP</b></div><button class="bc-vip-card-target rar-${RARITIES[enemy.rarity]?.id||"common"} ${enemy.boss?"boss":""}" data-bc-vip-click><span>${enemy.boss?"👑":"🃏"}</span><b>${enemy.boss?"BOSS ANGREIFEN":"KARTE KLICKEN"}</b><small>+${clickMult} VIP-Klick${clickMult>1?"s":""} pro Treffer</small></button>${enemy.boss?`<button class="bc-vip-special-use" data-bc-vip-special-use ${!eq||!vipSpecialOwned(eq.id)||S.vipClickerSpecialCharge<(eq?.charge||999)?"disabled":""}>${eq?`${eq.icon} ${esc(eq.name)} · <span data-bc-vip-special-charge>${fmt(S.vipClickerSpecialCharge)}/${eq.charge}</span>`:"Keine Special-Attacke ausgerüstet"}</button>`:""}${S.vipClickerLastReward?`<div class="bc-vip-last-reward"><small>LETZTE BELOHNUNG</small><b>${esc(vipRewardSummaryText(S.vipClickerLastReward))}</b></div>`:""}</div><aside class="bc-vip-clicker-side"><article><small>KLICKER UPGRADE</small><h3>${S.vipClickerLevel>=100?"👑 Level 100 MAX":`Level ${S.vipClickerLevel} → ${S.vipClickerLevel+1}`}</h3><p>Der Weg bis 100 wird extrem teuer. Krits verbessern sich bei Level 25/60. Ab Level 20 steigt die VIP-Karten-Chance langsam weiter bis Level 100.</p><button data-bc-vip-clicker-upgrade ${S.vipClickerLevel>=100||S.vipClicks<nextCost?"disabled":""}>${S.vipClickerLevel>=100?"MAX":`${fmt(nextCost)} VIP-Klicks`}</button></article><article><small>DEIN PACK-FORTSCHRITT</small><h3>Bis ${RARITIES[maxDrop]?.symbol||"⚪"} ${RARITIES[maxDrop]?.name||"Gewöhnlich"} im VIP-Drop</h3><p>VIP-Karten dürfen nur bis zu dieser über deine Packs erreichbaren Rarität droppen. Innerhalb des VIP-Pools wird jede höhere Rarität deutlich seltener als die vorherige.</p></article></aside></div><section class="bc-vip-specials"><div><small>VIP-SPECIAL-ATTACKEN</small><h3>Eine Attacke ausrüsten</h3><p>Eine ausgerüstete Attacke gibt jetzt <b>sofort dauerhaft mehr Klick-Schaden und mehr Krit-Chance</b>, solange sie aktiv ist. Zusätzlich lädst du durch normale Klicks ihr stärkeres Boss-Special auf. Höhere Attacken werden mit deinem normalen Pack-Fortschritt freigeschaltet.</p></div><div class="bc-vip-special-grid">${VIP_SPECIAL_ATTACKS.map(sp=>{const owned=vipSpecialOwned(sp.id),available=vipSpecialAvailable(sp),active=S.vipClickerSpecialEquipped===sp.id;return `<button data-bc-vip-special="${sp.id}" class="rar-${RARITIES[sp.rarity].id} ${active?"active":""}" ${!available?"disabled":""}><span>${sp.icon}</span><b>${esc(sp.name)}</b><small>${RARITIES[sp.rarity].name} · ×${sp.mult.toFixed(2).replace(".",",")} Boss-Special<br>${vipSpecialPassiveText(sp)}</small><em>${active?"AUSGERÜSTET":owned?"Ausrüsten":available?`${fmt(sp.cost)} Klicks`:"🔒 Pack-Fortschritt"}</em></button>`}).join("")}</div></section></section>`;
  }

  async function doRebirth(skip=false){
    if(prestigeEndgameComplete()){UI.tab="prestige";refresh(false);return toast("Stockwerk 4 ist bei Rebirth 5/5 abgeschlossen. Dein nächster Endgame-Schritt ist Prestige.",4500);}
    const requiredLevel=rebirthRequiredLevel(),pointCost=rebirthPointCost(),winCost=rebirthWinCost(),tier=RARITIES[rebirthCostTier()]||RARITIES[0];
    if(!skip&&S.level<requiredLevel)return toast(`Level ${requiredLevel} wird auf Stockwerk ${S.phase+1} für den normalen Rebirth benötigt.`);
    if(!skip&&S.points<pointCost)return toast(`Rebirth bei ${tier.name} kostet ${fmt(pointCost)} Points. Dir fehlen ${fmt(pointCost-S.points)}.`);
    if(!skip&&S.winsCurrency<winCost)return toast(`Rebirth bei ${tier.name} braucht ${winCost} Wins. Aktuell: ${S.winsCurrency}.`);
    const beforePointMult=accountPointRebirthMultiplier()*(POINT_FLOOR_MULT[clamp(Math.floor(Number(S.phase)||0),0,3)]||1),nextLocalRaw=Math.min(5,S.phaseRebirths+1),willAdvance=nextLocalRaw>=5&&S.phase<3,nextPhase=willAdvance?S.phase+1:S.phase,nextLocal=willAdvance?0:nextLocalRaw,nextAccountMult=1+nextLocal*.08,nextFloorMult=POINT_FLOOR_MULT[nextPhase]||1;
    if(!await gameConfirm({title:skip?"Rebirth mit JK/Coin-Skip":"Rebirth durchführen",message:`ALLE aktuellen BigCards-Points und noch nicht eingesammelten Points werden auf 0 gesetzt.\nDas interne Level startet wieder bei Level 1.\nALLE Karten und Duplikate bleiben vollständig erhalten – inklusive Feldbelegung, Kartenlevel, Karten-Rebirth, Aura, Kampf-Aura, Bindung, Shiny und Fusion.\nSammlung und freigeschaltete Stockwerke bleiben ebenfalls erhalten.\nNächster Point-Fortschritt: Stockwerk ${nextPhase+1} ×${nextFloorMult.toFixed(2).replace(".",",")} · Account-Rebirth ×${nextAccountMult.toFixed(2).replace(".",",")}${skip?"\nJK/Coin-Skip: 300 JK-Coins":`\nRebirth-Kosten (${tier.name}): ${fmt(pointCost)} Points + ${winCost} Wins\nPrestige ${prestigeCount()}: Rebirth-Pointkosten ×${prestigeCycleDifficultyMultiplier().toFixed(2).replace(".",",")}`}`,confirmText:skip?"300 JK/Coin einsetzen":"Rebirth starten",icon:"↻",tone:skip?"jk":"danger"}))return;
    if(skip&&!window.JKCoinApp?.spend?.(300,"BigCards Rebirth-Skip"))return toast("Nicht genügend JK-Coins.");
    if(!skip){S.points-=pointCost;S.winsCurrency=Math.max(0,S.winsCurrency-winCost);}

    // V336: Kartenfortschritt ist beim Rebirth ausdrücklich geschützt. Selbst wenn die
    // Reset-Logik später erweitert wird, dürfen Karteninstanzen/Duplikate/Slots nicht verschwinden.
    const keepCards={
      instances:S.instances,
      collection:S.collection,
      exclusiveCollection:S.exclusiveCollection,
      vipCollection:S.vipCollection,
      winCollection:S.winCollection,
      hyperCollection:S.hyperCollection,
      hyperCores:S.hyperCores,
      floors:S.floors,
      highestUpgrade:S.highestUpgrade,
      shinyMilestones:S.shinyMilestones
    };

    S.totalRebirths++;S.phaseRebirths=nextLocal;S.points=0;S.pendingPoints=0;S.fieldStoredSeconds=0;S.level=1;S.xp=0;
    if(S.phaseRebirths>=5&&S.phase<3){S.phase++;S.phaseRebirths=0;S.unlockedFloors=Math.max(S.unlockedFloors,S.phase+1);raiseScore(5000*S.unlockedFloors);S.auraInventory.basic=(S.auraInventory.basic||0)+1;S.bindInventory.fire=(S.bindInventory.fire||0)+1;}

    S.instances=keepCards.instances;S.collection=keepCards.collection;S.exclusiveCollection=keepCards.exclusiveCollection;S.vipCollection=keepCards.vipCollection;S.winCollection=keepCards.winCollection;S.hyperCollection=keepCards.hyperCollection;S.hyperCores=keepCards.hyperCores;S.floors=keepCards.floors;S.highestUpgrade=keepCards.highestUpgrade;S.shinyMilestones=keepCards.shinyMilestones;
    normalizeFloorUniqueCards();
    raiseScore(1000+S.totalRebirths*150);awardMainXp(15,"BigCards.kl Rebirth",`bc-rebirth-${S.totalRebirths}`);persist();scheduleLeaderboardProfileSync(250);refresh();toast(`Rebirth ${S.totalRebirths} abgeschlossen · Points: 0 · Level 1 · alle Karten behalten · Point-Faktor vorher ×${beforePointMult.toFixed(2).replace(".",",")}`);
  }

  const COLLECTOR_POINT_START=10000,COLLECTOR_POINT_MULT=2.5;
  function collectorRemainingMinutes(){return Math.max(0,(Number(S.autoCollectorUntil)||0)-now())/60000;}
  function syncCollectorPointStep(){
    if((Number(S.autoCollectorUntil)||0)<=now()&&(Number(S.autoCollectorPointStep)||0)!==0){S.autoCollectorPointStep=0;return true;}
    return false;
  }
  function collectorPointPrice(){
    // Jeder zusammenhängende Point-Kauf startet bei demselben Startpreis. Nur zusätzlich
    // vorgemerkte Point-Minuten in der aktuellen Laufzeit verteuern die nächste Minute stark.
    syncCollectorPointStep();
    const step=Math.max(0,Math.floor(Number(S.autoCollectorPointStep)||0));
    const raw=COLLECTOR_POINT_START*Math.pow(COLLECTOR_POINT_MULT,Math.min(step,30));
    const round=raw>=1e12?1e9:raw>=1e9?1e6:raw>=1e6?1e4:raw>=1e5?1e3:100;
    return Math.max(COLLECTOR_POINT_START,Math.ceil(raw/round)*round);
  }
  function buyCollectorPoints(){
    const t=now(),wasOff=(Number(S.autoCollectorUntil)||0)<=t;
    if(wasOff){S.autoCollectorUntil=t;S.autoCollectorPointStep=0;}
    const remaining=collectorRemainingMinutes();
    // Point-Käufe dürfen nicht endlos vorgestapelt werden. Nach vollständigem Ablauf beginnt
    // die Preisreihe automatisch wieder beim Startpreis.
    if(remaining>=15)return toast("Point-Auto-Collector ist bereits weit voraus gebucht. Erst unter 15 Minuten Restzeit wieder verlängerbar.");
    const cost=collectorPointPrice();if(S.points<cost)return toast(`${fmt(cost)} Points für die nächste Auto-Collector-Minute benötigt.`);
    S.points-=cost;S.autoCollectorUntil=Math.max(t,S.autoCollectorUntil||0)+60000;S.autoCollectorPointStep=Math.max(0,Math.floor(Number(S.autoCollectorPointStep)||0))+1;persist();refresh();toast(`+1 Minute Auto-Collector · ${fmt(cost)} Points`);
  }
  function autoOpenerEntitledCapacity(){
    try{
      const total=Number(window.JKCoinApp?.coinState?.()?.entitlements?.["bigcards-auto-opener"]||0);
      return clamp(Math.floor(total||0),0,AUTO_OPENER_MAX_LANES);
    }catch{return 0;}
  }
  function syncAutoOpenerPermanentChannels(){
    const entitled=autoOpenerEntitledCapacity(),current=clamp(Math.floor(Number(S.autoOpenerCapacity)||0),0,AUTO_OPENER_MAX_LANES),next=Math.max(current,entitled);
    if(next<=current)return false;
    S.autoOpenerCapacity=next;
    if(!Array.isArray(S.autoOpenerLanes))S.autoOpenerLanes=[];
    while(S.autoOpenerLanes.length<AUTO_OPENER_MAX_LANES)S.autoOpenerLanes.push({pack:"common",enabled:false});
    for(let i=0;i<next;i++)if(!S.autoOpenerLanes[i]||typeof S.autoOpenerLanes[i]!=="object")S.autoOpenerLanes[i]={pack:"common",enabled:false};
    return true;
  }
  function refreshAutoOpenerControls(){
    if(!UI.overlay||UI.tab!=="packs")return;
    const box=UI.overlay.querySelector(".bc-auto-opener");if(!box)return;
    const cap=clamp(Math.floor(Number(S.autoOpenerCapacity)||0),0,AUTO_OPENER_MAX_LANES),activeCount=autoActiveLaneIndexes().length,wallMs=activeCount?S.autoOpenerWorkMs/activeCount:S.autoOpenerWorkMs;
    const time=box.querySelector("[data-bc-auto-time]");if(time){time.textContent=formatAutoWorkTime(S.autoOpenerWorkMs);if(time.classList.contains("bc-auto-compact-time"))time.hidden=S.autoOpenerWorkMs<=0;}
    const meta=box.querySelector("[data-bc-auto-meta]");if(meta)meta.textContent=activeCount?`${activeCount} aktiv · ≈ ${formatAutoWorkTime(wallMs)} gleichzeitig`:"pausiert";
    for(let i=0;i<AUTO_OPENER_MAX_LANES;i++){
      const lane=S.autoOpenerLanes?.[i]||{pack:"common",enabled:false},unlocked=i<cap;
      const top=box.querySelector(`[data-bc-auto-lane="${i}"]`);
      if(top){top.classList.toggle("active",unlocked&&i===UI.autoLaneSelected);top.classList.toggle("running",unlocked&&!!lane.enabled);top.classList.toggle("locked",!unlocked);top.setAttribute("aria-disabled",unlocked?"false":"true");}
      const card=box.querySelector(`[data-bc-auto-channel="${i}"]`);
      if(card){card.classList.toggle("selected",unlocked&&i===UI.autoLaneSelected);card.classList.toggle("running",unlocked&&!!lane.enabled);}
      const toggle=box.querySelector(`[data-bc-auto-lane-toggle="${i}"]`);
      if(toggle){toggle.classList.toggle("active",!!lane.enabled);toggle.textContent=lane.enabled?"Stop":"Start";}
      const status=box.querySelector(`[data-bc-auto-channel-status="${i}"]`);
      if(status)status.textContent=lane.enabled?"AKTIV":"BEREIT";
    }
  }
  function toggleAuto(){const lane=clamp(Math.floor(Number(UI.autoLaneSelected)||0),0,AUTO_OPENER_MAX_LANES-1);return toggleAutoLane(lane);}
  function formatAutoWorkTime(ms){ms=Math.max(0,Number(ms)||0);const sec=Math.ceil(ms/1000),h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;}
  function autoActiveLaneIndexes(){const cap=clamp(Math.floor(Number(S.autoOpenerCapacity)||0),0,AUTO_OPENER_MAX_LANES),out=[];for(let i=0;i<cap;i++)if(S.autoOpenerLanes?.[i]?.enabled)out.push(i);return out;}
  function autoLaneCanRun(index){const lane=S.autoOpenerLanes?.[index];if(!lane?.enabled)return false;const ri=RARITY_INDEX[lane.pack]??0,r=RARITIES[ri];return !!r&&ri<=rarityUnlockedIndex()&&S.points>=r.price;}
  function resetAutoSummary(){S.autoOpenerSummary={startedAt:now(),packs:0,cards:0,newCount:0,dupes:0,totalValue:0,rarestValue:101,rarestName:"",rarities:{}};}
  function recordAutoSummary(results,laneIndex){if(!S.autoOpenerSummary||typeof S.autoOpenerSummary!=="object")resetAutoSummary();const sum=S.autoOpenerSummary;sum.packs=Math.max(0,Number(sum.packs)||0)+1;for(const result of results||[]){const inst=result?.inst;if(!inst)continue;const m=cardMeta(inst),rid=RARITIES[inst.rarity]?.id||"common",row=sum.rarities[rid]||{count:0,newCount:0};row.count++;if(result.wasNew){row.newCount++;sum.newCount=(sum.newCount||0)+1;}else sum.dupes=(sum.dupes||0)+1;sum.rarities[rid]=row;sum.cards=(sum.cards||0)+1;sum.totalValue=(sum.totalValue||0)+(Number(m?.value)||0);const rv=Number(result.rarityValue??m?.rarityValue??100);if(rv<Number(sum.rarestValue||101)){sum.rarestValue=rv;sum.rarestName=m?.name||"Karte";}}sum.lastLane=laneIndex;}
  function showAutoOpenerFinalSummary(){const sum=S.autoOpenerSummary;if(!sum||!(Number(sum.cards)>0))return;const rows=RARITIES.map(r=>({r,...(sum.rarities?.[r.id]||{count:0,newCount:0})})).filter(x=>x.count);showModal(`<div class="bc-auto-final"><small>AUTO-OPENER · GESAMTAUFLISTUNG</small><h2>📦 Session abgeschlossen</h2><div class="bc-auto-final-stats"><span><b>${fmt(sum.packs)}</b><small>Packs</small></span><span><b>${fmt(sum.cards)}</b><small>Karten</small></span><span><b>${fmt(sum.newCount)}</b><small>Neu</small></span><span><b>${fmt(sum.dupes)}</b><small>Duplikate</small></span><span><b>${fmt(sum.totalValue)}</b><small>Gesamtwert</small></span></div><div class="bc-auto-rarest"><small>SELTENSTER FUND</small><b>${esc(sum.rarestName||"–")}</b><span>${Number(sum.rarestValue||0)<=100?pct(sum.rarestValue):"–"}</span></div><div class="bc-auto-final-rarities">${rows.map(x=>`<span class="rar-${x.r.id}">${x.r.symbol}<b>${x.r.name}</b><em>×${x.count}${x.newCount?` · ${x.newCount} neu`:""}</em></span>`).join("")}</div><button class="bc-primary" data-bc-auto-summary-close>Übernehmen</button></div>`);}
  function toggleAutoLane(index){index=clamp(Math.floor(Number(index)||0),0,AUTO_OPENER_MAX_LANES-1);if(index>=S.autoOpenerCapacity)return toast("Dieser Auto-Opener-Kanal ist noch nicht gekauft.");if(S.autoOpenerWorkMs<=0)return toast("Auto-Opener-Zeit fehlt. Im JK/Coin-Shop erhältlich.");const lane=S.autoOpenerLanes[index];lane.enabled=!lane.enabled;if(lane.enabled&&!S.autoOpenerSummary)resetAutoSummary();S.autoOpenerLastAt=now();persistPassive();refreshAutoOpenerControls();showAutoOpenerStatus(null,`Auto-Opener ${index+1} ${lane.enabled?"gestartet":"gestoppt"}`);}
  function autoLaneResultHtml(index){const row=UI.autoLaneResults?.[index];if(!row)return `<small>Noch kein Pack-Ergebnis auf Kanal ${index+1}.</small>`;return `<small>Letztes Pack · Kanal ${index+1}</small><b>${esc(row.rarestName||"–")} · ${pct(row.rarestValue||100)}</b><span>${row.rarityText||""}</span>`;}
  function autoRaritySummary(results){
    const counts=new Map();for(const result of results||[]){const inst=result?.inst;if(!inst)continue;const r=inst.exclusive?{id:"exclusive",name:"Exclusive",symbol:"🩸"}:RARITIES[inst.rarity]||RARITIES[0];const key=r.id,row=counts.get(key)||{r,count:0,newCount:0};row.count++;if(result.wasNew)row.newCount++;counts.set(key,row);}
    return [...counts.values()].sort((a,b)=>(RARITY_INDEX[a.r.id]??99)-(RARITY_INDEX[b.r.id]??99));
  }
  const AUTO_NOTICE_POS_KEY="jk-games-bigcards-auto-notice-pos-v375";
  function readAutoNoticePos(){try{const p=JSON.parse(localStorage.getItem(AUTO_NOTICE_POS_KEY)||"null");return p&&Number.isFinite(p.x)&&Number.isFinite(p.y)?p:null}catch{return null}}
  function clampAutoNoticePosition(el,x,y){const pad=6,w=el.offsetWidth||220,h=el.offsetHeight||100;return {x:clamp(x,pad,Math.max(pad,window.innerWidth-w-pad)),y:clamp(y,Math.max(pad,Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--safe-top"))||pad),Math.max(pad,window.innerHeight-h-pad))};}
  function applyAutoNoticePosition(el){const p=readAutoNoticePos();if(!p)return;requestAnimationFrame(()=>{const c=clampAutoNoticePosition(el,p.x,p.y);el.style.left=`${c.x}px`;el.style.top=`${c.y}px`;el.style.right="auto";});}
  function saveAutoNoticePosition(el){try{const r=el.getBoundingClientRect(),c=clampAutoNoticePosition(el,r.left,r.top);localStorage.setItem(AUTO_NOTICE_POS_KEY,JSON.stringify(c));}catch{}}
  function bindAutoNoticeDrag(el){if(el.dataset.dragBound)return;el.dataset.dragBound="1";el.addEventListener("pointerdown",e=>{if(e.button>0)return;e.preventDefault();clearTimeout(UI.autoNoticeTimer);const r=el.getBoundingClientRect();UI.autoNoticeDrag={id:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top};el.setPointerCapture?.(e.pointerId);el.classList.add("dragging");el.style.left=`${r.left}px`;el.style.top=`${r.top}px`;el.style.right="auto";});el.addEventListener("pointermove",e=>{const d=UI.autoNoticeDrag;if(!d||d.id!==e.pointerId)return;e.preventDefault();const c=clampAutoNoticePosition(el,e.clientX-d.dx,e.clientY-d.dy);el.style.left=`${c.x}px`;el.style.top=`${c.y}px`;el.style.right="auto";});const end=e=>{const d=UI.autoNoticeDrag;if(!d||d.id!==e.pointerId)return;UI.autoNoticeDrag=null;el.classList.remove("dragging");saveAutoNoticePosition(el);UI.autoNoticeTimer=setTimeout(()=>el.classList.remove("show"),2600);};el.addEventListener("pointerup",end);el.addEventListener("pointercancel",end);}
  function showAutoOpenerStatus(results,message=""){if(!UI.overlay||!uiPref("showAutoOpenerFloating"))return;let el=UI.overlay.querySelector("[data-bc-auto-notice]");if(!el){el=document.createElement("aside");el.className="bc-auto-opener-notice";el.dataset.bcAutoNotice="1";UI.overlay.append(el);bindAutoNoticeDrag(el);applyAutoNoticePosition(el);}const newCount=(results||[]).filter(x=>x.wasNew).length,dupes=Math.max(0,(results||[]).length-newCount),rarities=autoRaritySummary(results);el.innerHTML=results?`<small>📦 AUTO-OPENER${message?` · ${esc(message)}`:""}</small><div class="bc-auto-notice-counts"><b class="new">NEU ×${newCount}</b><b class="dupe">DUPLIKATE ×${dupes}</b></div><div class="bc-auto-notice-rarities">${rarities.map(x=>`<span class="auto-rar-${x.r.id}" title="${esc(x.r.name)}${x.newCount?` · ${x.newCount} neu`:""}">${x.r.symbol}<strong>×${x.count}</strong>${x.newCount?`<em>+${x.newCount}</em>`:""}</span>`).join("")}</div>`:`<small>📦 AUTO-OPENER</small><b class="bc-auto-notice-message">${esc(message)}</b>`;el.classList.add("show");clearTimeout(UI.autoNoticeTimer);UI.autoNoticeTimer=setTimeout(()=>{if(!UI.autoNoticeDrag)el.classList.remove("show")},results?4300:2300);}
  function showAutoOpenerInfo(){showModal(`<div class="bc-auto-info"><small>AUTO-OPENER · INFO</small><h2>📦 Bis zu 4 Packs gleichzeitig</h2><p>Jeder Kauf im JK/Coin-Shop gibt <b>1 Stunde Arbeitszeit</b>. Die ersten vier Käufe schalten dauerhaft Kanal 1, 2, 3 und 4 frei. Die gekaufte Arbeitszeit liegt in einem gemeinsamen Pool.</p><div class="bc-auto-info-grid"><article><b>Jeder Kanal separat</b><span>Kanal 1–4 besitzt jetzt immer seine eigene Pack-Auswahl und seinen eigenen Start-/Stop-Button. So kannst du z. B. Kanal 1 auf Gewöhnlich und Kanal 2 auf Selten stellen.</span></article><article><b>Alle vier sichtbar</b><span>Auch gesperrte Kanäle werden angezeigt. So siehst du sofort, welche Kanäle bereits freigeschaltet sind und welche noch einen JK/Coin-Kauf benötigen.</span></article><article><b>Gemeinsame Arbeitszeit</b><span>Sind drei Kanäle aktiv, wird der Zeitpool dreifach verbraucht, weil drei Packs parallel automatisch geöffnet werden.</span></article><article><b>Gesamtauflistung</b><span>Wenn die Arbeitszeit verbraucht ist, erhältst du weiterhin eine Zusammenfassung mit Kartenanzahl, Neu/Duplikaten, Raritäten, Gesamtwert und seltenstem Fund.</span></article></div><p><b>Platz sparen:</b> Das normale Auto-Opener-Feld lässt sich mit ⌃/⌄ komplett zuklappen. Zugeklappt bleiben nur Auto-Opener, Info, vorhandene Restzeit und die vier Kanalbuttons sichtbar.</p><p>Die Buttons 1–4 oben springen direkt zum jeweiligen Kanal. Bereits früher gekaufte Auto-Opener-Kanäle werden zusätzlich mit deinen JK/Coin-Entitlements abgeglichen, damit sie nach einer Spielstand-Wiederherstellung nicht wieder verschwinden.</p><button class="bc-primary" data-bc-modal-close>Verstanden</button></div>`);}

  function showExclusivePackInfo(){
    showModal(`<div class="bc-pack-info-modal bc-exclusive-pack-info"><small>🩸 EXCLUSIVE PACK · INFO</small><h2>12 Exclusive-Karten</h2><p>5 Karten pro Pack · <b>100 JK/Coin</b>. Exclusive ist immer im Kartenkampf nutzbar, im Produktionsfeld nur auf Stockwerk 1. Voll ausgebaut zielt die Kampfleistung ungefähr auf <b>Universe bis Black Hole</b>.</p><div class="bc-pack-odds long">${EXCLUSIVES.map(ex=>`<article class="rar-exclusive"><b>${esc(ex.name)}</b><span>${packChanceText(ex.chance)}</span></article>`).join("")}</div><button class="bc-primary" data-bc-modal-close>Verstanden</button></div>`);
  }
  function autoOpenNormalPack(rarityIndex,laneIndex=0){
    const r=RARITIES[rarityIndex];if(!r||rarityIndex>rarityUnlockedIndex()||S.points<r.price)return false;
    S.points-=r.price;const results=Array.from({length:10},()=>rollNormal(rarityIndex));S.daily.opened=(S.daily.opened||0)+1;recordBossPackOpen();addXp(20+(rarityIndex+1)*10);awardMainXp(2+(rarityIndex>7?3:1),"BigCards.kl Auto-Pack",`bc-auto-pack-${now()}-${Math.random()}`);
    const rows=results.map(x=>cardMeta(x.inst)),newCount=results.filter(x=>x.wasNew).length,rarest=Math.min(...results.map(x=>x.rarityValue)),prod=rows.reduce((sum,m)=>sum+m.points,0),value=rows.reduce((sum,m)=>sum+m.value,0),rarestResult=results.slice().sort((a,b)=>Number(a.rarityValue)-Number(b.rarityValue))[0];
    S.packHistory.unshift({at:now(),name:`${r.name}-Pack · Auto ${laneIndex+1}`,rarest,value,prod,newCount});S.packHistory=S.packHistory.slice(0,20);recordAutoSummary(results,laneIndex);const rarityText=autoRaritySummary(results).map(x=>`${x.r.symbol}×${x.count}`).join(" · ");UI.autoLaneResults[laneIndex]={rarestName:rarestResult?cardMeta(rarestResult.inst).name:"–",rarestValue:rarest,rarityText};
    persistPassive();refreshHeader();showAutoOpenerStatus(results,`Kanal ${laneIndex+1}`);if(UI.tab==="packs"){const detail=UI.overlay?.querySelector(`[data-bc-auto-lane-result="${laneIndex}"]`);if(detail)detail.innerHTML=autoLaneResultHtml(laneIndex);}return true;
  }

  function tick(){if(!S)return;const t=performance.now(),dt=Math.min(2,(t-lastTick)/1000);lastTick=t;if(!UI.overlay)return;updateFeaturedEarnings(now());const stepReset=syncCollectorPointStep(),act=activeInstances(),autoCollect=(S.autoCollectorUntil||0)>now();let pending=0,direct=0,xp=0,room=fieldStorageRemainingPoints();for(const inst of act){const fullPointGain=Math.max(0,effectivePoints(inst)*dt);if(autoCollect||inst.shiny>=3)direct+=fullPointGain;else if(room>0){const accepted=Math.min(room,fullPointGain);pending+=accepted;room-=accepted;}
      // BigCards-XP ist bewusst NICHT an das Point-Speicherlimit gekoppelt. Solange
      // BigCards geöffnet ist, geben aktive Karten ihre volle XP/s weiter.
      xp+=effectiveXp(inst)*dt;}if(direct){direct*=vipWheelMultiplier("points");S.points+=direct;S.lifetimePointsEarned+=direct}if(pending)S.pendingPoints+=pending;if(xp)addXp(xp);S.fieldStoredSeconds=0;updateScoreHighWater();S.lastSeen=now();if(t-UI.lastHeader>900){UI.lastHeader=t;refreshHeader();refreshFieldLive();refreshFeaturedLive();refreshBulkLevelLive();refreshExpeditionCountdowns();if(UI.tab==="battle"){const btn=UI.overlay.querySelector("[data-bc-battle-start]"),left=Math.max(0,Math.ceil(((S.battleCooldownUntil||0)-now())/1000));if(btn){btn.disabled=left>0;btn.textContent=left?`Nächster Kampf in ${left}s`:"⚔ Kampf starten";}}}if(stepReset)persist();else if(now()-lastPassivePersistAt>=30000){lastPassivePersistAt=now();persistPassive();}}
  function autoTick(){
    if(!UI.overlay||S.autoOpenerWorkMs<=0)return;const t=now(),runnable=autoActiveLaneIndexes().filter(autoLaneCanRun);if(!runnable.length){S.autoOpenerLastAt=t;refreshAutoOpenerControls();return;}
    const last=Math.max(0,Number(S.autoOpenerLastAt)||t),elapsed=Math.max(0,Math.min(10000,t-last));S.autoOpenerLastAt=t;if(elapsed>0)S.autoOpenerWorkMs=Math.max(0,(Number(S.autoOpenerWorkMs)||0)-elapsed*runnable.length);
    for(const laneIndex of runnable){const lane=S.autoOpenerLanes[laneIndex],ri=RARITY_INDEX[lane.pack]??0;if(S.autoOpenerWorkMs<=0)break;autoOpenNormalPack(ri,laneIndex);}
    if(S.autoOpenerWorkMs<=0){for(const lane of S.autoOpenerLanes)lane.enabled=false;S.autoOpenerWorkMs=0;persist();refreshAutoOpenerControls();showAutoOpenerStatus(null,"Auto-Opener-Arbeitszeit verbraucht");showAutoOpenerFinalSummary();S.autoOpenerSummary=null;return;}persistPassive();refreshAutoOpenerControls();
  }
  function settleOfflineBeforePointsBooster(){
    if(!S)return;const tNow=now();updateFeaturedEarnings(tNow,false);const delta=Math.min(MAX_OFFLINE_MS,Math.max(0,tNow-(S.lastSeen||tNow)));if(delta>0){const rate=Math.max(0,productionPerSecond()),totalSec=delta/1000,start=tNow-delta,autoSec=Math.max(0,Math.min(totalSec,((Number(S.autoCollectorUntil)||0)-start)/1000)),normalSec=Math.max(0,totalSec-autoSec),directGain=rate*autoSec*OFFLINE_RATE,pendingPotential=rate*normalSec*OFFLINE_RATE,pendingGain=Math.min(fieldStorageRemainingPoints(),pendingPotential);if(directGain>0){S.points+=directGain;S.lifetimePointsEarned+=directGain}if(pendingGain>0)S.pendingPoints+=pendingGain;}S.fieldStoredSeconds=0;S.lastSeen=tNow;
  }
  function applyOffline(){updateFeaturedEarnings(now(),false);const tNow=now(),delta=Math.min(MAX_OFFLINE_MS,Math.max(0,tNow-(S.lastSeen||tNow)));if(delta<30000)return;const rate=Math.max(0,productionPerSecond()),totalSec=delta/1000,start=tNow-delta,autoSec=Math.max(0,Math.min(totalSec,((Number(S.autoCollectorUntil)||0)-start)/1000)),normalSec=Math.max(0,totalSec-autoSec),directGain=rate*autoSec*OFFLINE_RATE,pendingPotential=rate*normalSec*OFFLINE_RATE,pendingGain=Math.min(fieldStorageRemainingPoints(),pendingPotential),gain=directGain+pendingGain;if(directGain>0){S.points+=directGain;S.lifetimePointsEarned+=directGain}if(pendingGain>0)S.pendingPoints+=pendingGain;S.fieldStoredSeconds=0;
    // Wichtig: Offline werden ausschließlich Points nach der bestehenden Offline-Rate
    // nachgetragen. BigCards-/Karten-XP wird hier absichtlich NICHT vergeben.
    if(gain>0)setTimeout(()=>toast(`Offline-Ertrag: +${fmt(gain)} Points (${Math.round(OFFLINE_RATE*100)} %)${pendingGain+0.01<pendingPotential?" · Spielfeld-Limit erreicht":""} · keine Offline-XP`,5000),400);S.lastSeen=tNow;persist();}

  function markBattleCardBroken(inst){
    if(!inst)return false;
    const wasBroken=!!inst.broken;
    inst.broken=true;
    inst.brokenAt=Math.max(Number(inst.brokenAt)||0,now());
    // UI.battleCard bleibt absichtlich auf exakt dieser Instanz stehen.
    // Der Kampfbereich zeigt dadurch sofort "KARTE KAPUTT" und startet sie nie neu.
    return !wasBroken;
  }
  function battleCardRows(includeBroken=true){const rows=[];for(const inst of Object.values(S.instances||{})){if(!inst||inst.listed||(!includeBroken&&inst.broken))continue;const stats=combatStats(inst);rows.push({inst,stats,unlocked:battleCardUnlocked(inst)});}rows.sort((a,b)=>{if(a.unlocked!==b.unlocked)return a.unlocked?-1:1;if(!!a.inst.broken!==!!b.inst.broken)return a.inst.broken?1:-1;if(a.unlocked)return b.stats.tier-a.stats.tier||b.stats.power-a.stats.power||b.inst.level-a.inst.level;return a.stats.tier-b.stats.tier||b.stats.power-a.stats.power||b.inst.level-a.inst.level;});return rows;}
  function battleCards(includeBroken=true){return battleCardRows(includeBroken).map(x=>x.inst);}
  function battlePickerCards(){const rows=battleCardRows(true),out=[],seenIds=new Set(),seenVariants=new Set(),add=(inst,reserveVariant=true)=>{if(inst&&!inst.listed&&!seenIds.has(inst.id)){seenIds.add(inst.id);if(reserveVariant)seenVariants.add(collectionKey(inst));out.push(inst);}};
    const current=instance(UI.battleCard),featured=instance(S.featuredCardId);
    // V422: Eine kaputte aktuelle Karte bleibt sichtbar und blockiert nicht mehr
    // eine gesunde Duplikat-Kopie derselben Kartenvariante.
    add(current,!current?.broken);add(featured,!featured?.broken);
    for(const row of rows){const inst=row.inst;if(!(inst.exclusive||inst.vip)||seenIds.has(inst.id)||seenVariants.has(collectionKey(inst)))continue;add(inst,!inst.broken);}
    let normalShown=0;for(const row of rows){const inst=row.inst;if(inst.exclusive||inst.vip||seenIds.has(inst.id)||seenVariants.has(collectionKey(inst)))continue;if(normalShown>=200)break;add(inst,!inst.broken);if(!inst.broken)normalShown++;}return out;}
  function ensureBattleCard(){
    const current=instance(UI.battleCard);
    // Niemals eine kaputte ausgewählte Karteninstanz automatisch gegen eine andere
    // gleich aussehende Kopie austauschen. Sie bleibt sichtbar, bis bewusst gewechselt wird.
    if(current)return current;
    const featured=instance(S.featuredCardId);if(battleCardUsable(featured)){UI.battleCard=featured.id;return featured;}
    const first=battleCards(false).find(battleCardUsable)||null;UI.battleCard=first?.id||null;return first;
  }
  function chooseBattleCardById(id){
    const inst=instance(id);if(!inst)return toast("Diese Karte existiert nicht mehr.");
    const reason=battleCardBlockReason(inst);if(reason)return toast(reason,3600);
    UI.battleCard=inst.id;UI.battleResult=null;UI.battleSession=null;closeModal();refresh(false);return inst;
  }

  function bestCombatEntitled(){
    try{return Number(window.JKCoinApp?.coinState?.()?.entitlements?.["bigcards-best-combat"]||0)>0}catch{return false}
  }
  async function ensureBestCombatUnlock(){
    if(S.bestCombatAutoUnlocked||bestCombatEntitled()){S.bestCombatAutoUnlocked=true;return true;}
    const ok=await gameConfirm({title:"⚡ Beste Kampfkarte dauerhaft freischalten",message:"Einmalig 100 JK/Coin. Danach kannst du im Bereich „Karte“ und im Kartenkampf jederzeit automatisch deine aktuell stärkste erlaubte Kampfkarte auswählen.",confirmText:"Für 100 JK/Coin freischalten",icon:"⚡"});
    if(!ok)return false;
    if(!window.JKCoinApp?.spend?.(100,"BigCards Beste Kampfkarte dauerhaft")){toast("Du brauchst 100 JK/Coin.");return false;}
    S.bestCombatAutoUnlocked=true;persist();toast("⚡ Beste Kampfkarte dauerhaft freigeschaltet.",3600);return true;
  }

  function bestBattleCardCandidate(){
    const cards=battlePickerCards().filter(battleCardUsable);
    let best=null,bestPower=-1;
    for(const inst of cards){const power=combatStats(inst).power;if(power>bestPower){best=inst;bestPower=power;}}
    return best;
  }
  async function chooseBestBattleCard(){
    if(!await ensureBestCombatUnlock())return false;
    const best=bestBattleCardCandidate();if(!best)return toast("Keine einsatzbereite Kampfkarte gefunden.");
    UI.battleCard=best.id;UI.battleResult=null;UI.battleSession=null;closeModal();refresh(false);toast(`⚡ Beste Kampfkarte gewählt: ${cardMeta(best).name} · ⚔ ${fmt(combatStats(best).power)}`,3600);return true;
  }
  async function chooseBestFeaturedCombatCard(){
    if(!await ensureBestCombatUnlock())return false;
    const best=bestBattleCardCandidate();if(!best)return toast("Keine einsatzbereite Kampfkarte gefunden.");
    selectFeaturedCard(best.id);return true;
  }

  function showBattlePicker(){const cards=battlePickerCards(),maxTier=battleUnlockedTier();showModal(`<div class="bc-battle-picker"><small>DEINE KARTEN</small><h2>Kampfkarte wählen</h2><p>Aktuell freigeschaltet bis <b>${RARITIES[maxTier].name}</b>. Höhere normale Karten werden über die Kartenkampf-Stufe freigeschaltet. <b>Exclusive- und VIP-Karten sind unabhängig von dieser normalen Stufe immer sofort nutzbar</b>. Deine persönliche Karte wird zusätzlich immer bevorzugt angezeigt.</p><div class="bc-best-combat-picker"><button class="${S.bestCombatAutoUnlocked?"unlocked":"locked"}" data-bc-battle-best>${S.bestCombatAutoUnlocked?"⚡ Beste Kampfkarte automatisch wählen":"🔒 Beste Kampfkarte · dauerhaft 100 JK/Coin"}</button><small>${S.bestCombatAutoUnlocked?"Findet sofort die stärkste aktuell erlaubte und nicht kaputte Karte.":"Einmal kaufen, danach bleibt die automatische Auswahl dauerhaft offen."}</small></div><div class="bc-battle-picker-grid">${cards.length?cards.map(inst=>{const m=cardMeta(inst),profile=combatAbilityProfile(inst),specials=profile.specials.filter(x=>inst.level>=(x.req||1)).length,locked=!battleCardUnlocked(inst),disabled=inst.broken||locked;return `<button data-bc-battle-pick="${inst.id}" class="${m.className} ${inst.broken?"broken":""} ${locked?"battle-locked":""}" ${disabled?"disabled":""}><span>${m.icon}</span><b>${esc(m.name)}</b><small>${inst.vip?`VIP · ${m.rarity.name}`:inst.exclusive?`EXCLUSIVE · Kampfstufe ${battleTierLabel(inst)}`:m.rarity.name} · Lv ${inst.level}/5${cardRebirth(inst)?` · ↻${cardRebirth(inst)}`:""} · Rank ${cardRank(inst)}/10${inst.id===S.featuredCardId?" · ★ Persönliche Karte":""}</small><small>⚔ ${fmt(m.combat.power)} · ${fmt(m.combat.min)}–${fmt(m.combat.max)} Schaden · ${specials} Special${specials===1?"":"s"}${potionQueueCount(inst)?` · 🧪 ${potionQueueCount(inst)}/3 Runden`:""}</small>${locked?`<em>🔒 Kartenkampf erst bis ${RARITIES[maxTier].name} freigeschaltet</em>`:inst.broken?`<em>💥 KAPUTT · in Sammlung reparieren</em>`:""}</button>`}).join(""):`<div class="bc-empty-state"><span>🃏</span><h3>Noch keine Karte vorhanden</h3></div>`}</div></div>`);}
  function upgradeBattleTier(){
    if(UI.battleSession)return toast("Während eines laufenden Kampfes kann die Kartenkampf-Stufe nicht erhöht werden.");
    const info=battleUpgradeInfo();if(info.max||!info.next)return toast("Alle Kartenkampf-Raritäten sind bereits freigeschaltet.");
    if(info.wins<info.next.wins)return toast(`Noch ${info.next.wins-info.wins} Sieg${info.next.wins-info.wins===1?"":"e"} mit ${RARITIES[info.current].name}-Karten oder Special-Karten (Exclusive, VIP, Hyper) nötig.`);
    if(S.points<info.next.cost)return toast(`${fmt(info.next.cost)} Points für das Kartenkampf-Upgrade auf ${RARITIES[info.next.unlock].name} benötigt.`);
    S.points-=info.next.cost;S.battleUpgradeSpent=(S.battleUpgradeSpent||0)+info.next.cost;S.battleTierUnlocked=info.next.unlock;S.battleTierWins=0;repairBattleTierProgressV423();persist();refresh(false);toast(`Kartenkampf verbessert: ${RARITIES[info.next.unlock].name}-Karten sind jetzt freigeschaltet!`,4200);
  }
  function battleStreakPressureV426(streak=Math.max(0,Math.floor(Number(S?.battleStreak)||0))){
    if(streak<10)return .58+Math.random()*.38;
    if(streak<20)return .92+(streak-10)*.020;
    if(streak<30)return 1.12+(streak-20)*.030;
    if(streak<40)return 1.42+(streak-30)*.040;
    return Math.min(3.10,1.82+(streak-40)*.055);
  }
  function makeBattleEnemy(player){
    const ps=combatStats(player),streak=Math.max(0,Math.floor(Number(S?.battleStreak)||0)),pressure=battleStreakPressureV426(streak),roll=Math.random();
    let shift=0;
    if(streak>=20)shift=roll<.45?2:1;
    else if(streak>=10)shift=roll<.20?2:roll<.70?1:0;
    else if(roll<.08)shift=2;else if(roll<.27)shift=1;else if(roll>.90)shift=-2;else if(roll>.72)shift=-1;
    const tier=clamp(ps.tier+shift,0,RARITIES.length-1),base=Math.floor(Math.random()*BASE_NAMES.length),levelShift=streak>=20?1:(Math.random()<.18?1:(Math.random()<.12?-1:0)),level=clamp((player.level||1)+levelShift,1,5),shiny=Math.random()<Math.min(.35,.07+streak*.004)?1:0;
    const enemy={id:"enemy-"+uid(),rarity:tier,base,level,aura:null,combatAura:null,bind:null,shiny,broken:false,exclusive:false,basePower:null,difficultyShift:shift,battleScale:1,streakPressure:pressure};
    const raw=combatStats(enemy),target=Math.max(1,ps.power*pressure),scale=clamp(target/Math.max(1,raw.power),.45,250);enemy.battleScale=scale;
    if(pressure>=1.05)enemy.difficultyShift=Math.max(1,enemy.difficultyShift);
    return enemy;
  }
  function battleBackupForSession(session=UI.battleSession){if(!session?.backupPlayerId)return null;const main=instance(session.primaryPlayerId),backup=instance(session.backupPlayerId);return main&&backup&&backupCardEligible(main,backup)&&!backup.broken&&!backup.listed?backup:null;}
  function deployBattleBackup(reason="manual"){
    const session=UI.battleSession;if(!session||session.activeRole==="backup")return false;const main=instance(session.primaryPlayerId),backup=battleBackupForSession(session);if(!main||!backup)return false;
    session.primaryRemainingHp=Math.max(0,Number(session.playerHp)||0);session.primaryMaxHp=Math.max(1,Number(session.playerMaxHp)||1);session.primaryState=session.playerState;session.activeRole="backup";session.playerId=backup.id;const bs=combatStats(backup);session.playerHp=bs.hp;session.playerMaxHp=bs.hp;session.playerBaseMaxHp=bs.hp;session.playerState=battleActorState();session.playerPotion=null;session.backupUsed=true;session.lastHit=null;session.turn="player";activateLocalRoundPotion(session,{silent:true});session.log.push(reason==="ko"?`🛡 Hauptkarte K.O. – ${cardMeta(backup).name} übernimmt als Backup.`:`🛡 Du wechselst auf ${cardMeta(backup).name}.`);session.log=session.log.slice(-12);refresh(true);return true;
  }
  function manualBattleBackupSwitch(){const session=UI.battleSession;if(!session||session.turn!=="player")return toast("Du kannst nur in deinem Zug auf die Backup-Karte wechseln.");if(session.activeRole==="backup")return toast("Die Backup-Karte ist bereits aktiv.");if(!battleBackupForSession(session))return toast("Keine einsatzbereite Backup-Karte vorhanden.");deployBattleBackup("manual");}

  function activeRoundPotion(inst,prepared){if(!prepared)return null;const potionBoost=rankPotionBonus(inst),effect=prepared.effect*(1+potionBoost);return {...prepared,effect,effectText:potionEffectValueText(prepared.typeId,effect),lifePct:prepared.typeId==="life"?effect:0,damagePct:prepared.typeId==="power"?effect:0,guardPct:prepared.typeId==="guard"?effect:0,rankBoost:potionBoost};}
  function activateLocalRoundPotion(session,{silent=false}={}){
    const player=instance(session?.playerId);if(!session||!player)return null;const baseHp=Math.max(1,combatStats(player).hp);
    session.playerBaseMaxHp=baseHp;session.playerMaxHp=baseHp;session.playerHp=Math.min(Math.max(0,Number(session.playerHp)||0),baseHp);session.playerPotion=null;
    const prepared=consumePreparedPotion(player),active=activeRoundPotion(player,prepared);if(active){session.playerPotion=active;if(active.lifePct){const raised=Math.max(baseHp,Math.round(baseHp*(1+active.lifePct))),bonus=raised-baseHp;session.playerMaxHp=raised;session.playerHp=Math.min(raised,session.playerHp+bonus);}session.usedPotions??=[];session.usedPotions.push(active);session.log?.push(`${active.icon} Runde ${session.round}: ${active.name} aktiv · ${active.effectText}.`);if(!silent)toast(`${active.icon} ${active.name} · nur diese Runde aktiv.`,1900);persistPassive();}
    return active;
  }
  function startBattle(){
    if(UI.onlineStatus==="searching"||UI.onlineStatus==="active")return toast("Beende zuerst die Online-Suche bzw. den Online-Kampf.");
    const player=ensureBattleCard();if(!player)return toast("Du brauchst zuerst mindestens eine Karte für den Kartenkampf.");
    const blocked=battleCardBlockReason(player);if(blocked)return toast(blocked,3800);
    if(UI.battleSession)return toast("Der Kampf läuft bereits.");if((S.battleCooldownUntil||0)>now())return toast(`Nächster Kampf in ${Math.ceil((S.battleCooldownUntil-now())/1000)} Sek.`);
    // Zweite Prüfung direkt vor Session-Erstellung gegen schnelle UI-/Cloud-Änderungen.
    if(!battleCardUsable(instance(player.id)))return toast(battleCardBlockReason(instance(player.id))||"Diese Karte ist nicht kampfbereit.",3800);
    const enemy=makeBattleEnemy(player),ps=combatStats(player),es=combatStats(enemy),em=cardMeta(enemy),configuredBackup=player.id===S.featuredCardId?usableFeaturedBackup(player):null;UI.battleResult=null;UI.battleSession={id:uid(),primaryPlayerId:player.id,playerId:player.id,backupPlayerId:configuredBackup?.id||null,activeRole:"primary",backupUsed:false,primaryFallen:false,primaryRemainingHp:ps.hp,primaryMaxHp:ps.hp,enemy,playerHp:ps.hp,playerMaxHp:ps.hp,playerBaseMaxHp:ps.hp,enemyHp:es.hp,playerState:battleActorState(),enemyState:battleActorState(),playerPotion:null,usedPotions:[],lastHit:null,turn:"player",round:1,log:[`Gegner aufgedeckt: ${em.name} · ${RARITIES[enemy.rarity]?.name||"Karte"} · Lv ${enemy.level}.${configuredBackup?` Backup bereit: ${cardMeta(configuredBackup).name}.`:""}`],startedAt:now()};activateLocalRoundPotion(UI.battleSession,{silent:true});persist();refresh(true);toast(enemy.difficultyShift>0?"Achtung: Dieser Gegner ist stärker als deine aktuelle Kampfstufe.":enemy.difficultyShift<0?"Dieser Gegner ist etwas schwächer.":"Gegner aufgedeckt – du beginnst.",3000);
  }
  function performPlayerBattleAction(abilityId){const session=UI.battleSession;if(!session||session.turn!=="player")return;const player=instance(session.playerId);if(!player)return finishBattle(false);if(player.broken){clearTimeout(UI.battleEnemyTimer);UI.battleEnemyTimer=0;UI.battleSession=null;refresh(false);return toast("Diese Karte ist bereits kaputt und kann nicht weiterkämpfen. Wähle oder repariere eine andere Karte.",4200)}const abilities=combatAbilities(player,session.playerState),ability=abilities.find(x=>x.id===abilityId);if(!ability||ability.locked)return toast("Diese Fähigkeit ist gerade nicht verfügbar.");if(!ability.normal&&player.level<(ability.req||1))return toast(`Diese Fähigkeit wird erst auf Kartenstufe ${ability.req} freigeschaltet.`);const pm=cardMeta(player),dmg=abilityDamage(player,pm.combat,ability,1+(session.playerPotion?.damagePct||0));session.enemyHp=Math.max(0,session.enemyHp-dmg);session.lastHit={target:"enemy",damage:dmg,icon:ability.icon,name:ability.name,at:now()};applyAbilityUse(player,session.playerState,ability);session.log.push(`Du: ${ability.icon} ${ability.name} → ${fmt(dmg)} Schaden${session.playerPotion?.damagePct?` · ${session.playerPotion.name}`:""}.`);session.log=session.log.slice(-12);if(session.enemyHp<=0)return finishBattle(true);session.turn="enemy";refresh(true);clearTimeout(UI.battleEnemyTimer);const sid=session.id;UI.battleEnemyTimer=setTimeout(()=>enemyBattleTurn(sid),760);}
  function enemyBattleTurn(sessionId){const session=UI.battleSession;if(!session||session.id!==sessionId||session.turn!=="enemy")return;const player=instance(session.playerId),enemy=session.enemy;if(!player||!enemy)return;const choices=combatAbilities(enemy,session.enemyState),specials=choices.filter(x=>!x.normal&&!x.locked&&enemy.level>=(x.req||1));let ability=choices[0];if(specials.length&&Math.random()<Math.min(.82,.52+enemy.rarity*.025))ability=specials[Math.floor(Math.random()*specials.length)];const em=cardMeta(enemy),rawDmg=abilityDamage(enemy,em.combat,ability),rankGuard=rankDamageReduction(player),dmg=Math.max(1,Math.round(rawDmg*(1-(session.playerPotion?.guardPct||0))*(1-rankGuard)));session.playerHp=Math.max(0,session.playerHp-dmg);session.lastHit={target:"player",damage:dmg,icon:ability.icon,name:ability.name,at:now()};applyAbilityUse(enemy,session.enemyState,ability);session.log.push(`Gegner: ${ability.icon} ${ability.name} → ${fmt(dmg)} Schaden${session.playerPotion?.guardPct?` (${session.playerPotion.name})`:""}${rankGuard?` (Rank-Schutz ${Math.round(rankGuard*100)} %)`:""}.`);session.log=session.log.slice(-12);
    if(session.playerHp<=0){if(session.activeRole==="primary"&&battleBackupForSession(session)){markBattleCardBroken(player);session.primaryFallen=true;session.round++;if(deployBattleBackup("ko")){persist();toast("💥 Hauptkarte K.O. – Backup-Karte übernimmt!",3200);return;}}return finishBattle(false);}
    session.round++;session.turn="player";activateLocalRoundPotion(session);refresh(true);
  }

  function battleRewardPotionBonus(session,typeId,cap=.60){
    return Math.min(cap,(session?.usedPotions||[]).filter(p=>p?.typeId===typeId).reduce((sum,p)=>sum+Math.max(0,Number(p.effect)||0),0));
  }
  function finishBattle(won){
    const session=UI.battleSession;if(!session)return;clearTimeout(UI.battleEnemyTimer);UI.battleEnemyTimer=0;const player=instance(session.playerId),primary=instance(session.primaryPlayerId||session.playerId),backup=instance(session.backupPlayerId),enemy=session.enemy,pm=player?cardMeta(player):null,primaryMeta=primary?cardMeta(primary):null,em=cardMeta(enemy),es=em.combat;const rankSource=primary&&primary.id===S.featuredCardId?primary:player,rewardMult=won?rankBattleRewardMultiplier(rankSource):1,baseRewardPoints=Math.max(75,Math.round((es.tier+1)*70*(primary?.level||player?.level||1))),baseRewardShards=Math.max(1,1+Math.floor(es.tier/3)),pointsPotionBonus=won?battleRewardPotionBonus(session,"points",.80):0,xpPotionBonus=won?battleRewardPotionBonus(session,"xp",.80):0,rewardPoints=won?Math.round(baseRewardPoints*rewardMult*ultimateSetMultiplier()*(1+pointsPotionBonus)):0,rewardShards=won?Math.max(1,Math.round(baseRewardShards*rewardMult*ultimateSetMultiplier())):0,firstWin=won&&(S.battleWins||0)===0;let winsEarned=0,rankMasteryEarned=0,rankEliteEarned=false,rankMasteryNow=rankSource?cardRankMastery(rankSource):0,rankEliteNow=rankSource?cardRankEliteWins(rankSource):0,rankNext=rankSource?nextRankMeta(rankSource):null;
    // V383: Ein K.O. bleibt ein K.O. – auch wenn anschließend die Backup-Karte gewinnt.
    // Die Hauptkarte wird deshalb beim Abschluss noch einmal aus dem Session-Flag
    // abgeleitet und dauerhaft als kaputt gespeichert. Ein Backup-Sieg repariert nichts.
    const primaryWasKo=!!session.primaryFallen||(!!session.backupUsed&&Number(session.primaryRemainingHp)<=0);
    if(primaryWasKo&&primary){session.primaryFallen=true;markBattleCardBroken(primary);}
    if(won){S.battleWins=(S.battleWins||0)+1;recordBossBattleWin();S.battleStreak=(S.battleStreak||0)+1;S.battleBestStreak=Math.max(S.battleBestStreak||0,S.battleStreak);winsEarned=addWins(winStreakReward(S.battleStreak));S.points+=rewardPoints;S.shards+=rewardShards;addXp(Math.round((16+(es.tier+1)*4)*(1+xpPotionBonus)));raiseScore(55+(es.tier+1)*22);if(firstWin){S.combatAuraInventory.basic=(S.combatAuraInventory.basic||0)+1;S.equipmentRewards[equipmentRewardKey("combatAura","basic")]=true;}recordBattleTierWin(primary);if(rankSource&&rankSource.id===S.featuredCardId&&cardRank(rankSource)<FEATURED_RANK_MAX){rankMasteryEarned=rankMasteryGain(enemy);rankSource.rankMastery=cardRankMastery(rankSource)+rankMasteryEarned;rankMasteryNow=rankSource.rankMastery;if(Number(enemy?.difficultyShift)>0){rankSource.rankEliteWins=cardRankEliteWins(rankSource)+1;rankEliteEarned=true;}rankEliteNow=cardRankEliteWins(rankSource);rankNext=nextRankMeta(rankSource);session.log.push(`Meisterschaft: +${fmt(rankMasteryEarned)} MP${rankEliteEarned?" · +1 Elite-Sieg":""}${rankNext?` · Rank ${rankNext.rank}: ${fmt(rankMasteryNow)}/${fmt(rankNext.mastery)} MP${rankNext.elite?` · Elite ${fmt(rankEliteNow)}/${fmt(rankNext.elite)}`:""}`:""}.`);}}else{S.battleLosses=(S.battleLosses||0)+1;S.battleStreak=0;addXp(5+(es.tier+1));if(player)markBattleCardBroken(player);}
    S.battleCooldownUntil=now()+2200;const brokenIds=[];if(primary?.broken)brokenIds.push(primary.id);if(backup?.broken&&!brokenIds.includes(backup.id))brokenIds.push(backup.id);UI.battleResult={won,round:session.round,playerId:player?.id||null,primaryId:primary?.id||null,backupId:backup?.id||null,backupUsed:!!session.backupUsed,primaryFallen:!!session.primaryFallen,brokenIds,playerBroken:!won&&!!player,player:{name:pm?.name||"Karte",icon:pm?.icon||"🃏",className:pm?.className||"",hp:session.playerHp,maxHp:session.playerMaxHp||pm?.combat.hp||0,power:pm?.combat.power||0,min:pm?.combat.min||0,max:pm?.combat.max||0},primary:primaryMeta?{name:primaryMeta.name,icon:primaryMeta.icon,className:primaryMeta.className,broken:!!primary.broken}:null,enemy:{name:em.name,icon:em.icon,className:em.className,hp:session.enemyHp,maxHp:es.hp,power:es.power,min:es.min,max:es.max,level:enemy.level},rewardPoints,rewardShards,winsEarned,pointsPotionBonus,xpPotionBonus,streak:S.battleStreak,firstWin,potion:session.usedPotions?.[0]||null,potions:session.usedPotions||[],rankMasteryEarned,rankEliteEarned,rankMasteryNow,rankEliteNow,rankNextRank:rankNext?.rank||null,rankNextMastery:rankNext?.mastery||null,rankNextElite:rankNext?.elite||0,log:session.log.slice(-12)};UI.battleSession=null;persist();refresh(true);const rankToast=rankMasteryEarned&&rankNext?` · Meisterschaft +${fmt(rankMasteryEarned)} MP${rankEliteEarned?" + Elite-Sieg":""}`:"",backupToast=session.backupUsed?" · Backup eingesetzt":"";toast(won?`Sieg! +${fmt(rewardPoints)} Points · +${rewardShards} Shards · +${winsEarned} Wins · Siegesserie ×${S.battleStreak}${firstWin?" · Basic Kampf Aura erhalten!":""}${backupToast}${rankToast}`:session.backupUsed?"Niederlage – auch deine Backup-Karte ist gefallen und muss repariert werden.":"Niederlage – deine Kampfkarte ist zerbrochen und muss in der Sammlung repariert werden.",5200);
  }

  // ===== V360 ONLINE-KARTENKAMPF =====
  // Matchmaking und rundenbasierter PvP-Kampf laufen über Firestore. Ranked-Duelle
  // verwenden ausschließlich die persönliche Karte und matchen maximal ±2 Karten-Ranks.
  function onlineRankWindow(rank){const r=clamp(Math.floor(Number(rank)||1),1,FEATURED_RANK_MAX);return {min:Math.max(1,r-2),max:Math.min(FEATURED_RANK_MAX,r+2)};}
  function onlineModeLabel(mode){return mode==="ranked"?"Rank-Kampf":"Normaler Online-Kampf";}
  function onlineSelectedCard(mode){if(mode==="ranked")return featuredCard();return ensureBattleCard();}
  function onlineCardSnapshot(inst,usePotion=false){
    if(!inst)return null;const m=cardMeta(inst),c=m.combat,potionBoost=rankPotionBonus(inst),potionQueueSnap=usePotion?preparedPotionsMeta(inst).map(p=>{const effect=p.effect*(1+potionBoost);return {tierId:p.tierId,typeId:p.typeId,name:p.name,icon:p.icon,effect,effectText:potionEffectValueText(p.typeId,effect),lifePct:p.typeId==="life"?effect:0,damagePct:p.typeId==="power"?effect:0,guardPct:p.typeId==="guard"?effect:0};}):[];
    return {instanceId:inst.id,name:m.name,icon:m.icon,className:m.className,rarity:inst.exclusive?-1:clamp(Math.floor(Number(inst.rarity)||0),0,RARITIES.length-1),rarityName:inst.vip?`VIP · ${m.rarity.name}`:inst.exclusive?"Exclusive":m.rarity.name,vip:!!inst.vip,exclusive:!!inst.exclusive,hyper:!!inst.hyper,generation:inst.hyper?hyperGeneration(inst):0,level:clamp(Math.floor(Number(inst.level)||1),1,5),rebirth:cardRebirth(inst),rebirthBonus:cardRebirthBonus(inst),rank:cardRank(inst),tier:c.tier,min:Math.max(1,Math.floor(c.min)),max:Math.max(1,Math.floor(c.max)),hp:Math.max(1,Math.floor(c.hp)),baseHp:Math.max(1,Math.floor(c.hp)),power:Math.max(1,Math.floor(c.power)),specialBonus:rankActive(inst)?rankSpecialBonus(inst):0,guardReduction:rankActive(inst)?rankDamageReduction(inst):0,potionQueue:potionQueueSnap};
  }
  function onlineBackupSnapshot(main){if(!main||main.id!==S.featuredCardId)return null;const backup=usableFeaturedBackup(main);return backup?onlineCardSnapshot(backup,true):null;}
  function onlineQueueCompatible(me,other){
    if(!me||!other||other.uid===me.uid||other.status!=="waiting"||other.mode!==me.mode)return false;
    if(now()-Math.max(0,Number(other.updatedAtMs)||0)>ONLINE_QUEUE_STALE_MS)return false;
    if(me.mode!=="ranked")return true;const a=clamp(Number(me.rank)||1,1,10),b=clamp(Number(other.rank)||1,1,10);return Math.abs(a-b)<=2;
  }
  function onlineSeedNumber(seed){let h=2166136261;for(const ch of String(seed)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0)/4294967296;}
  function onlineDamage(card,ability,match,attackerUid,row=null){
    const actionNo=Math.max(0,Math.floor(Number(match.actionNo)||0))+1,seed=`${match.seed}:${actionNo}:${attackerUid}:${ability.id}`,r1=onlineSeedNumber(seed),r2=onlineSeedNumber(seed+":m"),base=Math.max(1,Math.floor(card.min+r1*(Math.max(card.min,card.max)-card.min+1))),levelSkill=1+(clamp(card.level||1,1,5)-1)*.055,mult=ability.normal?(.90+r2*.20):(Number(ability.mult)||1)*levelSkill*(1+(Number(card.specialBonus)||0)),potionDamage=Math.max(0,Number(row?.currentPotion?.damagePct)||0);return Math.max(1,Math.round(base*mult*(1+potionDamage)));
  }
  function onlineBattleActorState(row){return {specialUsed:Math.max(0,Math.floor(Number(row?.specialUsed)||0)),mustNormal:!!row?.mustNormal};}
  function onlineAbilities(card,row){return combatAbilities(card,onlineBattleActorState(row));}
  function onlineApplyAbilityState(card,row,ability){const st=onlineBattleActorState(row);applyAbilityUse(card,st,ability);row.specialUsed=st.specialUsed;row.mustNormal=st.mustNormal;}
  function onlineActiveCard(roster,row){return row?.activeRole==="backup"&&roster?.backup?roster.backup:roster?.card;}
  function onlineCanDeployBackup(roster,row){return !!(roster?.backup&&row?.activeRole!=="backup"&&!row?.backupUsed);}
  function onlineDeployBackup(roster,row,reason){if(!onlineCanDeployBackup(roster,row))return false;row.primaryHp=Math.max(0,Number(row.hp)||0);row.primaryMaxHp=Math.max(1,Number(row.maxHp)||Number(roster.card?.hp)||1);if(reason==="ko")row.primaryFallen=true;row.activeRole="backup";row.backupUsed=true;row.hp=Math.max(1,Number(roster.backup.hp)||1);row.maxHp=Math.max(1,Number(roster.backup.hp)||1);row.currentPotion=null;row.specialUsed=0;row.mustNormal=false;row.switchReason=reason;return true;}
  function onlineRankMasteryGain(myRank,opponentRank){const diff=clamp(Math.floor(Number(opponentRank)||0)-Math.floor(Number(myRank)||0),-2,2);return diff<=-2?5:diff===-1?8:diff===0?12:diff===1?18:24;}
  function resetOnlineUi(){stopOnlineBattlePolling();UI.onlineStatus="idle";UI.onlineMode=null;UI.onlineMatchId=null;UI.onlineMatch=null;UI.onlineBusy=false;UI.onlineResult=null;UI.onlineQueueHeartbeat=0;UI.onlineMatchHeartbeat=0;}
  function stopOnlineBattlePolling(){clearInterval(UI.onlinePollTimer);UI.onlinePollTimer=0;}
  function startOnlineBattlePolling(){stopOnlineBattlePolling();UI.onlinePollTimer=setInterval(()=>pollOnlineBattle(),ONLINE_POLL_MS);}
  function showOnlineBattleMenu(){
    if(UI.battleSession)return toast("Beende zuerst deinen lokalen Kartenkampf.");
    const normal=ensureBattleCard(),feature=featuredCard(),rank=feature?cardRank(feature):0,range=rank?onlineRankWindow(rank):null;
    showModal(`<div class="bc-online-menu"><small>🌐 BIGCARDS ONLINE</small><h2>Online-Kampf wählen</h2><p>Du spielst rundenbasiert gegen einen echten, gleichzeitig suchenden BigCards-Spieler. K.O.-geschlagene Karten zerbrechen als konkrete Karteninstanz und sind danach bis zur Reparatur für lokale und Online-Kämpfe gesperrt. Eine gesunde Duplikat-Kopie derselben Karte ist eine eigene Instanz. Backup-Karten funktionieren ebenfalls.</p><div class="bc-online-mode-grid"><article><span>⚔️</span><h3>Normaler Online-Kampf</h3><p>Suche gegen andere Spieler im normalen Online-Modus. Deine aktuell gewählte Kampfkarte wird benutzt.</p><small>${normal?`${esc(cardMeta(normal).name)} · ${normal.exclusive?"Exclusive":cardMeta(normal).rarity.name} · Rank ${cardRank(normal)}/10`:"Keine Kampfkarte gewählt"}</small><button data-bc-online-mode="normal" ${!normal||normal.broken||!battleCardUnlocked(normal)?"disabled":""}>Gegner suchen</button></article><article class="ranked"><span>🏅</span><h3>Rank-Kampf</h3><p>Nur mit deiner persönlichen Karte. Gegner dürfen höchstens zwei Karten-Ranks unter oder über dir liegen.</p><small>${feature?`${esc(cardMeta(feature).name)} · Rank ${rank}/10${range?` · Gegner Rank ${range.min}–${range.max}`:""}`:"Keine persönliche Karte gewählt"}</small><button data-bc-online-mode="ranked" ${!feature||feature.broken||rank<1?"disabled":""}>Rank-Gegner suchen</button></article></div><div class="bc-online-rules"><b>Rank-Matching:</b><span>Rank 1 → Gegner Rank 1–3 · Rank 4 → Rank 2–6 · Rank 5 → Rank 3–7 · Rank 10 → Rank 8–10.</span><span>Ranked-Siege geben zusätzliche Meisterschaft. Ein Sieg gegen einen höheren Rank zählt zusätzlich als Elite-Sieg.</span></div></div>`);
  }
  function showOnlineSearchModal(){
    const card=onlineSelectedCard(UI.onlineMode),rank=card?cardRank(card):0,range=UI.onlineMode==="ranked"?onlineRankWindow(rank):null;
    showModal(`<div class="bc-online-search" data-bc-online-search><div class="bc-online-search-pulse">🌐</div><small>${esc(onlineModeLabel(UI.onlineMode))}</small><h2>Gegner wird gesucht …</h2><p>${UI.onlineMode==="ranked"?`Deine Karte: Rank ${rank} · erlaubte Gegner Rank ${range.min}–${range.max}.`:"Es werden nur Spieler gesucht, die ebenfalls normalen Online-Kampf gewählt haben."}</p><div class="bc-online-search-bars"><i></i><i></i><i></i></div><button data-bc-online-cancel>Suche abbrechen</button></div>`);
  }
  async function beginOnlineMatchmaking(mode){
    mode=mode==="ranked"?"ranked":"normal";if(UI.onlineStatus==="searching"||UI.onlineStatus==="active")return toast("Du bist bereits in einem Online-Kampf.");if(UI.battleSession)return toast("Beende zuerst deinen lokalen Kartenkampf.");
    const card=onlineSelectedCard(mode);if(!card)return toast(mode==="ranked"?"Wähle zuerst im Tab „Karte“ deine persönliche Karte.":"Wähle zuerst eine Kampfkarte.");const blocked=battleCardBlockReason(card);if(blocked)return toast(blocked,3800);if(mode==="ranked"&&cardRank(card)<1)return toast("Rank-Kampf wird ab Karten-Rank 1 freigeschaltet.");
    const fb=await firebase(),u=await currentUser();if(!fb||!u)return toast("Für Online-Kämpfe musst du online angemeldet sein.");
    UI.onlineMode=mode;UI.onlineStatus="searching";UI.onlineMatchId=null;UI.onlineMatch=null;UI.onlineResult=null;UI.onlineBusy=false;const stamp=now(),snap=onlineCardSnapshot(card,true),backup=onlineBackupSnapshot(card),range=mode==="ranked"?onlineRankWindow(snap.rank):{min:0,max:10};
    const entry={uid:u.uid,displayName:await displayName(),mode,status:"waiting",rank:snap.rank,minRank:range.min,maxRank:range.max,card:snap,backup:backup||null,deviceId:deviceId(),createdAtMs:stamp,updatedAtMs:stamp};
    try{await fb.setDoc(fb.doc(fb.db,ONLINE_QUEUE_COLLECTION,u.uid),entry);UI.onlineQueueHeartbeat=stamp;showOnlineSearchModal();startOnlineBattlePolling();await pollOnlineBattle();}catch(e){console.warn("BigCards online queue",e);resetOnlineUi();toast("Online-Suche konnte nicht gestartet werden. Bitte versuche es gleich erneut.",4200);}
  }
  async function removeOwnOnlineQueue(fb,u,reason="cleanup"){
    if(!fb||!u?.uid)return false;
    try{await fb.deleteDoc(fb.doc(fb.db,ONLINE_QUEUE_COLLECTION,u.uid));return true;}catch(e){
      if(e?.code!=="not-found")console.warn(`BigCards online queue ${reason}`,e);
      return false;
    }
  }
  async function cancelOnlineMatchmaking(silent=false){
    if(UI.onlineStatus!=="searching"){if(!silent)closeModal();return;}const fb=await firebase(),u=await currentUser();if(fb&&u)await removeOwnOnlineQueue(fb,u,"cancel");resetOnlineUi();closeModal();if(!silent){refresh(false);toast("Online-Suche abgebrochen.");}
  }
  function onlineInitialBattleRow(roster,stamp){return {activeRole:"primary",hp:Math.max(1,Number(roster.card.hp)||1),maxHp:Math.max(1,Number(roster.card.hp)||1),primaryHp:Math.max(1,Number(roster.card.hp)||1),primaryMaxHp:Math.max(1,Number(roster.card.hp)||1),backupUsed:false,primaryFallen:false,backupFallen:false,primaryPotionIndex:0,backupPotionIndex:0,currentPotion:null,specialUsed:0,mustNormal:false,lastSeenMs:stamp};}
  function onlineCreateMatchData(a,b,matchId){
    const stamp=now(),uids=[a.uid,b.uid],seed=`${matchId}:${a.uid}:${b.uid}`,turnUid=onlineSeedNumber(seed)<.5?a.uid:b.uid,roster={[a.uid]:{uid:a.uid,name:a.displayName||"Spieler",rank:Number(a.rank)||0,card:a.card,backup:a.backup||null},[b.uid]:{uid:b.uid,name:b.displayName||"Spieler",rank:Number(b.rank)||0,card:b.card,backup:b.backup||null}};
    return {version:359,mode:a.mode,playerUids:uids,roster,battle:{[a.uid]:onlineInitialBattleRow(roster[a.uid],stamp),[b.uid]:onlineInitialBattleRow(roster[b.uid],stamp)},status:"active",turnUid,round:1,actionNo:0,seed,log:[`${a.displayName||"Spieler"} vs. ${b.displayName||"Spieler"} · Online-Kampf gestartet.`],lastAction:null,winnerUid:null,loserUid:null,endReason:null,createdAtMs:stamp,updatedAtMs:stamp};
  }
  async function attemptOnlinePair(fb,u,myQueue){
    if(UI.onlineBusy||UI.onlineStatus!=="searching")return false;UI.onlineBusy=true;
    try{const snap=await fb.getDocs(fb.query(fb.collection(fb.db,ONLINE_QUEUE_COLLECTION),fb.where("updatedAtMs",">",now()-ONLINE_QUEUE_STALE_MS),fb.limit(50))),candidates=snap.docs.map(d=>d.data()).filter(x=>onlineQueueCompatible(myQueue,x)).sort((a,b)=>{if(myQueue.mode==="ranked"){const da=Math.abs((a.rank||0)-(myQueue.rank||0)),db=Math.abs((b.rank||0)-(myQueue.rank||0));if(da!==db)return da-db;}return (a.createdAtMs||0)-(b.createdAtMs||0);});const other=candidates[0];if(!other)return false;
      const matchId=`bc-online-${now().toString(36)}-${Math.random().toString(36).slice(2,9)}`,meRef=fb.doc(fb.db,ONLINE_QUEUE_COLLECTION,u.uid),otherRef=fb.doc(fb.db,ONLINE_QUEUE_COLLECTION,other.uid),matchRef=fb.doc(fb.db,ONLINE_MATCH_COLLECTION,matchId);
      await fb.runTransaction(fb.db,async tx=>{const [meSnap,opSnap]=await Promise.all([tx.get(meRef),tx.get(otherRef)]);if(!meSnap.exists()||!opSnap.exists())throw new Error("Queue nicht mehr vorhanden");const me=meSnap.data(),op=opSnap.data();if(me.status!=="waiting"||op.status!=="waiting"||!onlineQueueCompatible(me,op))throw new Error("Gegner wurde bereits vermittelt");const data=onlineCreateMatchData(me,op,matchId);tx.set(matchRef,data);tx.update(meRef,{status:"matched",matchId,opponentUid:op.uid,updatedAtMs:now()});tx.update(otherRef,{status:"matched",matchId,opponentUid:me.uid,updatedAtMs:now()});});
      await activateOnlineMatch(matchId);return true;
    }catch(e){if(!String(e?.message||"").includes("bereits vermittelt"))console.warn("BigCards online pairing",e);return false;}finally{UI.onlineBusy=false;}
  }
  function onlineActivateTurnPotion(card,row){
    if(!card||!row)return null;const baseHp=Math.max(1,Number(card.baseHp)||Number(card.hp)||1);row.maxHp=baseHp;row.hp=Math.min(Math.max(0,Number(row.hp)||0),baseHp);row.currentPotion=null;const role=row.activeRole==="backup"?"backup":"primary",key=role==="backup"?"backupPotionIndex":"primaryPotionIndex",i=Math.max(0,Math.floor(Number(row[key])||0)),queue=Array.isArray(card.potionQueue)?card.potionQueue:[],p=queue[i]||null;if(!p)return null;row[key]=i+1;row.currentPotion=p;if(Number(p.lifePct)>0){const raised=Math.max(baseHp,Math.round(baseHp*(1+Number(p.lifePct)))),bonus=raised-baseHp;row.maxHp=raised;row.hp=Math.min(raised,row.hp+bonus);}return p;
  }
  function consumeOnlinePotionForMatch(match,myUid,matchId){
    const roster=match?.roster?.[myUid],row=match?.battle?.[myUid];if(!roster||!row||!matchId)return false;const rec=S.onlinePotionConsumedMatches?.[matchId]||{at:now(),primary:0,backup:0};let changed=false;
    for(const role of ["primary","backup"]){const snap=role==="primary"?roster.card:roster.backup;if(!snap?.instanceId)continue;const target=Math.max(0,Math.floor(Number(row[role==="primary"?"primaryPotionIndex":"backupPotionIndex"])||0)),done=Math.max(0,Math.floor(Number(rec[role])||0)),inst=instance(snap.instanceId);if(!inst)continue;for(let i=done;i<target;i++){const entry=potionQueue(inst).shift();const p=preparedPotionMetaFromEntry(inst,entry);if(p){recordPotionUse(p.tierId,p.typeId,1);changed=true;}}rec[role]=Math.max(done,target);}
    rec.at=now();S.onlinePotionConsumedMatches[matchId]=rec;const keys=Object.keys(S.onlinePotionConsumedMatches);if(keys.length>80)keys.sort((a,b)=>(S.onlinePotionConsumedMatches[a]?.at||0)-(S.onlinePotionConsumedMatches[b]?.at||0)).slice(0,keys.length-80).forEach(k=>delete S.onlinePotionConsumedMatches[k]);if(changed)persistPassive();return changed;
  }
  async function activateOnlineMatch(matchId){const fb=await firebase(),u=await currentUser();if(!fb||!u)return false;try{const snap=await fb.getDoc(fb.doc(fb.db,ONLINE_MATCH_COLLECTION,matchId));if(!snap.exists())return false;const data=snap.data()||{};if(!Array.isArray(data.playerUids)||!data.playerUids.includes(u.uid))return false;UI.onlineStatus=data.status==="active"?"active":"ended";UI.onlineMatchId=matchId;UI.onlineMatch=data;UI.onlineMode=data.mode||UI.onlineMode;UI.onlineMatchHeartbeat=0;consumeOnlinePotionForMatch(data,u.uid,matchId);closeModal();UI.tab="battle";refresh(false);startOnlineBattlePolling();toast(`🌐 Gegner gefunden: ${onlineOpponentRoster(data,u.uid)?.name||"Spieler"}`,3200);if(data.status!=="active")applyOnlineResult(data);return true;}catch(e){console.warn("BigCards activate online match",e);return false;}}
  function onlineOpponentUid(match,myUid=currentUidSync()){return (match?.playerUids||[]).find(x=>x!==myUid)||"";}
  function onlineOpponentRoster(match,myUid=currentUidSync()){const id=onlineOpponentUid(match,myUid);return id?match?.roster?.[id]||null:null;}
  async function pollOnlineBattle(){
    if(UI.onlineBusy)return;const fb=await firebase(),u=await currentUser();if(!fb||!u)return;
    try{
      if(UI.onlineStatus==="searching"){
        const qRef=fb.doc(fb.db,ONLINE_QUEUE_COLLECTION,u.uid),qSnap=await fb.getDoc(qRef);if(!qSnap.exists()){resetOnlineUi();closeModal();return toast("Online-Suche wurde beendet.");}const q=qSnap.data()||{};if(q.status==="matched"&&q.matchId)return activateOnlineMatch(q.matchId);if(q.status!=="waiting")return;
        if(now()-UI.onlineQueueHeartbeat>=ONLINE_HEARTBEAT_MS){UI.onlineQueueHeartbeat=now();await fb.updateDoc(qRef,{updatedAtMs:UI.onlineQueueHeartbeat});q.updatedAtMs=UI.onlineQueueHeartbeat;}
        await attemptOnlinePair(fb,u,q);return;
      }
      if(UI.onlineStatus==="active"&&UI.onlineMatchId){
        const ref=fb.doc(fb.db,ONLINE_MATCH_COLLECTION,UI.onlineMatchId),snap=await fb.getDoc(ref);if(!snap.exists())return;const data=snap.data()||{};const changed=(Number(data.actionNo)||0)!==(Number(UI.onlineMatch?.actionNo)||0)||Number(data.updatedAtMs)!==Number(UI.onlineMatch?.updatedAtMs)||data.status!==UI.onlineMatch?.status;UI.onlineMatch=data;consumeOnlinePotionForMatch(data,u.uid,UI.onlineMatchId);
        if(now()-UI.onlineMatchHeartbeat>=ONLINE_HEARTBEAT_MS&&data.status==="active"){UI.onlineMatchHeartbeat=now();try{await fb.updateDoc(ref,{[`battle.${u.uid}.lastSeenMs`]:UI.onlineMatchHeartbeat,updatedAtMs:UI.onlineMatchHeartbeat});}catch{}}
        const opUid=onlineOpponentUid(data,u.uid),opSeen=Number(data.battle?.[opUid]?.lastSeenMs)||Number(data.createdAtMs)||now();if(data.status==="active"&&opUid&&now()-opSeen>ONLINE_DISCONNECT_MS)await claimOnlineDisconnectWin();
        if(data.status!=="active"){UI.onlineStatus="ended";stopOnlineBattlePolling();await applyOnlineResult(data);return;}
        if(changed&&UI.tab==="battle")refresh(true);
      }
    }catch(e){console.warn("BigCards online poll",e);}
  }
  async function performOnlineBattleAction(abilityId){
    if(UI.onlineStatus!=="active"||!UI.onlineMatchId||UI.onlineBusy)return;const fb=await firebase(),u=await currentUser();if(!fb||!u)return toast("Online-Verbindung fehlt.");UI.onlineBusy=true;
    try{const ref=fb.doc(fb.db,ONLINE_MATCH_COLLECTION,UI.onlineMatchId);await fb.runTransaction(fb.db,async tx=>{const snap=await tx.get(ref);if(!snap.exists())throw new Error("Match nicht gefunden");const d=snap.data(),myUid=u.uid,opUid=onlineOpponentUid(d,myUid);if(d.status!=="active")throw new Error("Match ist beendet");if(d.turnUid!==myUid)throw new Error("Der Gegner ist dran");const roster=structuredClone(d.roster||{}),battle=structuredClone(d.battle||{}),meR=roster[myUid],opR=roster[opUid],me=battle[myUid],op=battle[opUid];if(!meR||!opR||!me||!op)throw new Error("Matchdaten fehlen");const card=onlineActiveCard(meR,me),turnPotion=onlineActivateTurnPotion(card,me),abilities=onlineAbilities(card,me),ability=abilities.find(x=>x.id===abilityId);if(!ability||ability.locked)throw new Error("Fähigkeit ist nicht verfügbar");if(!ability.normal&&card.level<(ability.req||1))throw new Error(`Special erst ab Kartenstufe ${ability.req}`);let dmg=onlineDamage(card,ability,d,myUid,me),defCard=onlineActiveCard(opR,op);const reduction=1-(1-clamp(Number(defCard?.guardReduction)||0,0,.8))*(1-clamp(Number(op.currentPotion?.guardPct)||0,0,.8));dmg=Math.max(1,Math.round(dmg*(1-reduction)));op.hp=Math.max(0,(Number(op.hp)||0)-dmg);onlineApplyAbilityState(card,me,ability);me.lastSeenMs=now();let switchText="";if(op.hp<=0&&onlineCanDeployBackup(opR,op)){onlineDeployBackup(opR,op,"ko");switchText=` · ${opR.name} wechselt nach K.O. auf die Backup-Karte`;}const actionNo=Math.max(0,Math.floor(Number(d.actionNo)||0))+1,potionText=turnPotion?` · ${turnPotion.icon} ${turnPotion.name}`:"",log=[...(Array.isArray(d.log)?d.log:[]),`${meR.name}: ${ability.icon} ${ability.name} → ${fmt(dmg)} Schaden${potionText}${switchText}.`].slice(-18),stamp=now();let status="active",winnerUid=null,loserUid=null,endReason=null,turnUid=opUid;if(op.hp<=0&&((op.activeRole==="backup")||!opR.backup)){if(op.activeRole==="backup")op.backupFallen=true;else op.primaryFallen=true;status="ended";winnerUid=myUid;loserUid=opUid;endReason="ko";turnUid="";}const lastAction={attackerUid:myUid,targetUid:opUid,damage:dmg,icon:ability.icon,name:ability.name,atMs:stamp};tx.update(ref,{battle,status,turnUid,actionNo,round:Math.floor(actionNo/2)+1,log,lastAction,winnerUid,loserUid,endReason,updatedAtMs:stamp});});await pollOnlineBattle();
    }catch(e){toast(e.message||"Online-Aktion fehlgeschlagen.");}finally{UI.onlineBusy=false;}
  }
  async function manualOnlineBackupSwitch(){
    if(UI.onlineStatus!=="active"||!UI.onlineMatchId||UI.onlineBusy)return;const fb=await firebase(),u=await currentUser();if(!fb||!u)return;UI.onlineBusy=true;try{const ref=fb.doc(fb.db,ONLINE_MATCH_COLLECTION,UI.onlineMatchId);await fb.runTransaction(fb.db,async tx=>{const snap=await tx.get(ref);if(!snap.exists())throw new Error("Match nicht gefunden");const d=snap.data(),myUid=u.uid;if(d.status!=="active"||d.turnUid!==myUid)throw new Error("Du kannst nur in deinem Zug wechseln");const roster=structuredClone(d.roster||{}),battle=structuredClone(d.battle||{}),meR=roster[myUid],me=battle[myUid];if(!onlineDeployBackup(meR,me,"manual"))throw new Error("Keine Backup-Karte verfügbar");me.lastSeenMs=now();const log=[...(d.log||[]),`${meR.name} wechselt manuell auf die Backup-Karte ${meR.backup.name}.`].slice(-18),stamp=now();tx.update(ref,{battle,log,updatedAtMs:stamp});});await pollOnlineBattle();}catch(e){toast(e.message||"Backup-Wechsel fehlgeschlagen.");}finally{UI.onlineBusy=false;}
  }
  async function forfeitOnlineBattle(silent=false){
    if(UI.onlineStatus!=="active"||!UI.onlineMatchId)return;const fb=await firebase(),u=await currentUser();if(!fb||!u)return;const ref=fb.doc(fb.db,ONLINE_MATCH_COLLECTION,UI.onlineMatchId);try{await fb.runTransaction(fb.db,async tx=>{const snap=await tx.get(ref);if(!snap.exists())return;const d=snap.data(),opUid=onlineOpponentUid(d,u.uid);if(d.status!=="active")return;const stamp=now(),log=[...(d.log||[]),`${d.roster?.[u.uid]?.name||"Spieler"} hat aufgegeben.`].slice(-18);tx.update(ref,{status:"ended",turnUid:"",winnerUid:opUid,loserUid:u.uid,endReason:"forfeit",log,updatedAtMs:stamp});});await pollOnlineBattle();if(!silent)toast("Du hast den Online-Kampf aufgegeben.");}catch(e){console.warn(e);}
  }
  async function claimOnlineDisconnectWin(){
    if(UI.onlineStatus!=="active"||!UI.onlineMatchId||UI.onlineBusy)return;const fb=await firebase(),u=await currentUser();if(!fb||!u)return;UI.onlineBusy=true;try{const ref=fb.doc(fb.db,ONLINE_MATCH_COLLECTION,UI.onlineMatchId);await fb.runTransaction(fb.db,async tx=>{const snap=await tx.get(ref);if(!snap.exists())return;const d=snap.data(),opUid=onlineOpponentUid(d,u.uid),opSeen=Number(d.battle?.[opUid]?.lastSeenMs)||Number(d.createdAtMs)||now();if(d.status!=="active"||now()-opSeen<=ONLINE_DISCONNECT_MS)return;const stamp=now(),log=[...(d.log||[]),`${d.roster?.[opUid]?.name||"Gegner"} hat die Verbindung verloren.`].slice(-18);tx.update(ref,{status:"ended",turnUid:"",winnerUid:u.uid,loserUid:opUid,endReason:"disconnect",log,updatedAtMs:stamp});});await pollOnlineBattle();}catch(e){console.warn(e);}finally{UI.onlineBusy=false;}
  }
  async function applyOnlineResult(match){
    const u=await currentUser();if(!u||!match||!UI.onlineMatchId)return;const id=UI.onlineMatchId;consumeOnlinePotionForMatch(match,u.uid,id);if(S.onlineProcessedMatches?.[id]){UI.onlineResult={won:match.winnerUid===u.uid,mode:match.mode,reason:match.endReason};if(UI.tab==="battle")refresh(true);return;}const won=match.winnerUid===u.uid,ranked=match.mode==="ranked",myR=match.roster?.[u.uid],opR=onlineOpponentRoster(match,u.uid),myCardId=myR?.card?.instanceId,localCard=instance(myCardId);let mastery=0,elite=false;
    if(ranked){if(won)S.onlineRankedWins=(S.onlineRankedWins||0)+1;else S.onlineRankedLosses=(S.onlineRankedLosses||0)+1;}else{if(won)S.onlineBattleWins=(S.onlineBattleWins||0)+1;else S.onlineBattleLosses=(S.onlineBattleLosses||0)+1;}
    const myBattle=match.battle?.[u.uid]||{},brokenNames=[],primaryFallen=!!myBattle.primaryFallen||(!!myBattle.backupUsed&&Number(myBattle.primaryHp)<=0),backupFallen=!!myBattle.backupFallen||(match.loserUid===u.uid&&myBattle.activeRole==="backup"&&Number(myBattle.hp)<=0);if(primaryFallen&&myR?.card?.instanceId){const x=instance(myR.card.instanceId);if(x){markBattleCardBroken(x);brokenNames.push(cardMeta(x).name);}}if(backupFallen&&myR?.backup?.instanceId){const x=instance(myR.backup.instanceId);if(x){markBattleCardBroken(x);brokenNames.push(cardMeta(x).name);}}
    const tier=Math.max(0,Number(opR?.card?.tier)||0),rewardPoints=won?Math.max(150,Math.round((tier+1)*120*(Number(myR?.card?.level)||1)*ultimateSetMultiplier())):0,rewardShards=won?Math.max(1,Math.round((1+Math.floor(tier/4))*ultimateSetMultiplier())):0;if(won){S.points+=rewardPoints;S.shards+=rewardShards;addXp(18+(tier+1)*3);raiseScore(45+(tier+1)*18);recordBattleTierWin(localCard);}
    else addXp(4+Math.floor((tier+1)/2));
    if(ranked&&won&&localCard&&localCard.id===S.featuredCardId&&cardRank(localCard)<FEATURED_RANK_MAX){mastery=onlineRankMasteryGain(Number(myR?.rank)||cardRank(localCard),Number(opR?.rank)||0);localCard.rankMastery=cardRankMastery(localCard)+mastery;if((Number(opR?.rank)||0)>(Number(myR?.rank)||0)){localCard.rankEliteWins=cardRankEliteWins(localCard)+1;elite=true;}}
    S.onlineProcessedMatches[id]={at:now(),won,mode:match.mode};const keys=Object.keys(S.onlineProcessedMatches);if(keys.length>80){keys.sort((a,b)=>(S.onlineProcessedMatches[a]?.at||0)-(S.onlineProcessedMatches[b]?.at||0)).slice(0,keys.length-80).forEach(k=>delete S.onlineProcessedMatches[k]);}UI.onlineResult={won,mode:match.mode,reason:match.endReason,rewardPoints,rewardShards,mastery,elite,opponent:opR?.name||"Spieler",brokenNames};persist();if(cloudReady)scheduleCloudSave(1000);if(UI.tab==="battle")refresh(true);toast(won?`🌐 Online-Sieg! +${fmt(rewardPoints)} Points${ranked&&mastery?` · +${mastery} Meisterschaft${elite?" · +1 Elite-Sieg":""}`:""}${brokenNames.length?` · 💥 ${brokenNames.join(", ")} zerbrochen`:""}`:`🌐 Online-Niederlage${brokenNames.length?` · 💥 ${brokenNames.join(", ")} zerbrochen`:""}.`,5200);
  }
  async function recoverOnlineMatchIfAny(){
    if(!UI.overlay||UI.onlineStatus!=="idle")return false;
    const fb=await firebase(),u=await currentUser();if(!fb||!u)return false;
    const qRef=fb.doc(fb.db,ONLINE_QUEUE_COLLECTION,u.uid);
    let qSnap;
    try{qSnap=await fb.getDoc(qRef);}catch(e){
      console.warn("BigCards online recovery queue read",e);
      return false;
    }
    if(!qSnap.exists())return false;
    const q=qSnap.data()||{};
    if(q.status==="matched"&&q.matchId){
      const restored=await activateOnlineMatch(q.matchId);
      if(restored)return true;
      await removeOwnOnlineQueue(fb,u,"orphan matched cleanup");
      return false;
    }
    if(q.status==="waiting"){
      const age=now()-Math.max(0,Number(q.updatedAtMs)||0);
      if(age<=ONLINE_QUEUE_STALE_MS){
        UI.onlineStatus="searching";UI.onlineMode=q.mode==="ranked"?"ranked":"normal";UI.onlineQueueHeartbeat=Number(q.updatedAtMs)||now();showOnlineSearchModal();startOnlineBattlePolling();await pollOnlineBattle();return true;
      }
      await removeOwnOnlineQueue(fb,u,"stale recovery cleanup");
      return false;
    }
    // cancelled/alte/ungültige Queue-Dokumente gehören nicht dauerhaft in die Recovery.
    await removeOwnOnlineQueue(fb,u,"legacy recovery cleanup");
    return false;
  }
  function closeOnlineBattleView(){if(UI.onlineStatus==="active")return toast("Der Online-Kampf läuft noch. Nutze Aufgeben, wenn du ihn beenden möchtest.");resetOnlineUi();refresh(false);}
  function onlineBattleAbilityOrbHtml(ability,card,row,isMyTurn){const levelLocked=!ability.normal&&card.level<(ability.req||1),disabled=!!ability.locked||levelLocked||!isMyTurn||UI.onlineBusy,hint=levelLocked?`ab Stufe ${ability.req}`:(ability.normal?(row.mustNormal?"Pflichtschlag":"Normaler Schlag"):(ability.desc||"Special"));return `<button type="button" data-bc-online-action="${ability.id}" class="bc-battle-orb ${ability.normal?"normal":"special"}" ${disabled?"disabled":""}><span>${ability.icon}</span><b>${esc(ability.name)}</b><small>${esc(hint)}</small></button>`;}
  function onlineBattlePanelHtml(){
    const match=UI.onlineMatch,myUid=currentUidSync();if(!match||!myUid)return `<div class="bc-empty-state"><span>🌐</span><h3>Online-Kampf wird geladen …</h3></div>`;const opUid=onlineOpponentUid(match,myUid),myR=match.roster?.[myUid],opR=match.roster?.[opUid],me=match.battle?.[myUid],op=match.battle?.[opUid];if(!myR||!opR||!me||!op)return `<div class="bc-empty-state"><span>⚠</span><h3>Matchdaten werden synchronisiert …</h3></div>`;const myCard=onlineActiveCard(myR,me),opCard=onlineActiveCard(opR,op),myPct=clamp(Number(me.hp)/Math.max(1,Number(me.maxHp))*100,0,100),opPct=clamp(Number(op.hp)/Math.max(1,Number(op.maxHp))*100,0,100),isMyTurn=match.status==="active"&&match.turnUid===myUid,abilities=onlineAbilities(myCard,me),normal=abilities.find(a=>a.normal),activeSpecial=battleDisplayedSpecialAbility(abilities,myCard),last=match.lastAction||{},myHit=last.targetUid===myUid?`<div class="bc-battle-hit player"><strong>-${fmt(last.damage)}</strong><small>${esc(last.icon||"💥")} ${esc(last.name||"Treffer")}</small></div>`:"",opHit=last.targetUid===opUid?`<div class="bc-battle-hit enemy"><strong>-${fmt(last.damage)}</strong><small>${esc(last.icon||"💥")} ${esc(last.name||"Treffer")}</small></div>`:"",manualBackup=match.status==="active"&&isMyTurn&&onlineCanDeployBackup(myR,me)?`<button class="bc-battle-backup-switch" data-bc-online-backup>🛡 Auf Backup wechseln · ${esc(myR.backup.name)}</button>`:"",ended=match.status!=="active",result=UI.onlineResult;
    const fighter=(r,row,card,mine)=>`<article class="bc-battle-fighter ${mine?"":"enemy"} ${card.className||""} ${last.targetUid===(mine?myUid:opUid)?"hit-now":""}"><small>${mine?(row.activeRole==="backup"?"🛡 DEINE BACKUP-KARTE":"DEINE ONLINE-KARTE"):(row.activeRole==="backup"?"🛡 GEGNER-BACKUP":"ONLINE-GEGNER")}</small>${mine?myHit:opHit}${onlineBattleProgressBadgesHtml(card)}<div class="bc-battle-icon">${esc(card.icon||"🃏")}</div><h3>${esc(card.name||"Karte")}</h3><div class="bc-battle-hp"><span><i style="width:${mine?myPct:opPct}%"></i></span><b>${fmt(row.hp)} / ${fmt(row.maxHp)} HP</b></div><small>${esc(card.rarityName||"")} · Lv ${card.level}/5${card.rebirth?` · ↻ Rebirth ${card.rebirth}/5`:""} · Rank ${card.rank}/10 · ⚔ ${fmt(card.power)}</small>${row.currentPotion?`<em class="bc-active-potion">${esc(row.currentPotion.icon)} ${esc(row.currentPotion.name)} · ${esc(row.currentPotion.effectText)} · diese Runde</em>`:""}${r.backup?`<em class="bc-online-backup-state">🛡 Backup ${row.backupUsed?"bereits eingesetzt":`bereit: ${esc(r.backup.name)}`}</em>`:""}</article>`;
    const controls=ended?`<div class="bc-online-ended"><span>${match.winnerUid===myUid?"🏆":"💥"}</span><h3>${match.winnerUid===myUid?"ONLINE-SIEG":"ONLINE-NIEDERLAGE"}</h3><p>${match.endReason==="disconnect"?"Kampfende durch Verbindungsabbruch.":match.endReason==="forfeit"?"Kampfende durch Aufgabe.":"Kampf durch K.O. entschieden."}</p>${result?`<small>${result.won?`+${fmt(result.rewardPoints||0)} Points · +${result.rewardShards||0} Shards${result.mastery?` · +${result.mastery} Meisterschaft${result.elite?" · +1 Elite-Sieg":""}`:""}${result.brokenNames?.length?` · 💥 Zerbrochen: ${result.brokenNames.map(esc).join(", ")}`:""}`:result.brokenNames?.length?`💥 Zerbrochen: ${result.brokenNames.map(esc).join(", ")}`:"Keine deiner Karten wurde zerbrochen."}</small>`:""}<button data-bc-online-close>Zurück zum Kartenkampf</button></div>`:`<div class="bc-battle-center-controls online"><small class="bc-battle-turn-state ${isMyTurn?"player":"enemy"}">${isMyTurn?(me.mustNormal?"NORMALER SCHLAG PFLICHT":"DU BIST DRAN"):"GEGNER IST DRAN …"}</small><div class="bc-battle-control-row"><div class="bc-battle-action-side normal-side">${onlineBattleAbilityOrbHtml(normal,myCard,me,isMyTurn)}</div><div class="bc-battle-vs compact"><span>VS</span><small>RUNDE ${match.round||1}</small></div><div class="bc-battle-action-side special-side count-${activeSpecial?1:0}">${activeSpecial?onlineBattleAbilityOrbHtml(activeSpecial,myCard,me,isMyTurn):`<div class="bc-battle-no-special"><span>—</span><small>Kein Special</small></div>`}</div></div>${manualBackup}<p>${match.mode==="ranked"?`🏅 Rank-Kampf · ${myR.rank} gegen ${opR.rank}`:"🌐 Normaler Online-Kampf"}</p><button class="bc-online-forfeit" data-bc-online-forfeit>Aufgeben</button></div>`;
    return `<section class="bc-online-live"><div class="bc-online-live-head"><div><small>🌐 ${esc(onlineModeLabel(match.mode))}</small><h3>${esc(myR.name)} vs. ${esc(opR.name)}</h3></div><div><b>${match.mode==="ranked"?`Rank ${myR.rank} ↔ Rank ${opR.rank}`:"ONLINE"}</b><small>Match ${esc(String(UI.onlineMatchId||"").slice(-8))}</small></div></div><div class="bc-battle-arena active-fight online-fight">${fighter(myR,me,myCard,true)}${controls}${fighter(opR,op,opCard,false)}</div><div class="bc-battle-live-panel"><div><small>ONLINE-LOG</small><b>Letzte Aktionen</b></div><div class="bc-battle-live-log">${(match.log||[]).slice(-10).map(x=>`<span>${esc(x)}</span>`).join("")}</div></div></section>`;
  }
  // ===== V360 ONLINE-KARTENKAMPF END =====

  function repairCard(id){
    const inst=instance(id);if(!inst||!inst.broken)return;
    const cost=repairCost(inst),kitId=repairKitId(inst),kit=repairKitMeta(kitId),owned=repairKitCount(kitId);
    if(owned<1)return toast(`Du brauchst 1× ${kit.name}. Öffne im Shop „Rep.“.` ,3400);
    if(S.points<cost)return toast(`Zusätzlich fehlen ${fmt(cost-S.points)} Points für die Reparatur.` ,3400);
    S.points-=cost;S.repairKits[kitId]=owned-1;inst.broken=false;inst.brokenAt=0;persist();refresh(false);showCardDetail(id);toast(`${cardMeta(inst).name} repariert · 1× ${kit.name} + ${fmt(cost)} Points`,3800);
  }
  function buyRepairKit(id){
    const kit=repairKitMeta(id),price=repairKitPrice(kit.id);
    if(S.points<price)return toast(`Dir fehlen ${fmt(price-S.points)} Points für ${kit.name}.`,3400);
    S.points-=price;S.repairKits[kit.id]=repairKitCount(kit.id)+1;persist();showRepairShop();toast(`${kit.name} gekauft · -${fmt(price)} Points`);
  }
  function showRepairShop(){
    const label=k=>k.hyper?"Nur für Hyper-Karten":k.vip?"Nur für VIP-Karten":k.wins?"Nur für Wins-Karten":k.exclusive?`Nur für Exclusive-Karten · Preis folgt moderat deinem Kampfbereich (${RARITIES[exclusiveCombatTier()]?.name||"Gewöhnlich"})`:`Für ${RARITIES[RARITY_INDEX[k.id]]?.name||k.id}-Karten`,cls=k=>k.hyper?"rar-hyper":k.vip?"rar-vip":k.wins?"rar-wins":k.exclusive?"rar-exclusive":`rar-${k.id}`;
    showModal(`<div class="bc-repair-shop"><small>KARTENWERKSTATT</small><h2>Reparatur-Kits</h2><p>Eine zerbrochene Karte braucht <b>1 exakt passendes Reparatur-Kit + Points</b>. Normale Karten benötigen ihre Rarität. <b>Exclusive, Wins, VIP und Hyper besitzen jeweils ihr eigenes Spezial-Kit</b> und können nicht mit normalen Kits repariert werden.</p><div class="bc-repair-kit-grid">${REPAIR_KITS.map(k=>`<article class="${cls(k)} ${k.exclusive||k.wins||k.vip||k.hyper?"bc-special-repair-kit":""}"><span>${k.icon}</span><div><b>${k.name}</b><small>${label(k)}</small><em>Inventar ×${repairKitCount(k.id)}</em></div><button data-bc-buy-repair-kit="${k.id}">${fmt(repairKitPrice(k.id))} Points</button></article>`).join("")}</div><div class="bc-repair-explain"><b>Spezial-Kits:</b><span>Exclusive Reparatur-Siegel · Wins Reparatur-Pack · VIP Reparatur-Kit · <b>Hyper Reparatur-Kern</b>. Sammlung → kaputte Karte → „Karte reparieren“ zeigt immer exakt das benötigte Kit.</span></div></div>`);
  }
  function openBattleRepair(id){const inst=instance(id);if(!inst)return;rememberViewScroll();UI.tab="collection";UI.collectionTier=inst.vip?14:inst.exclusive?13:inst.rarity;UI.collectionPage=(inst.vip||inst.exclusive)?0:Math.floor((inst.base||0)/48);UI.collectionSearch="";refresh(false);setTimeout(()=>showCardDetail(id),0);}

  // ===== BIGCARDS.KL V392 · EXPEDITIONEN / BOSS / SETS / FUSION / MARKTWERT =====
  let setOwnedVariantCacheRev=-1,setOwnedVariantCache=null,fusionSummaryCacheRev=-1,fusionSummaryCache=null;
  function fusionVariant(inst){return inst?.fusion==="prismatic"?"prismatic":inst?.fusion==="holo"?"holo":"normal";}
  function fusionPointMultiplier(inst){return FUSION_POINT_MULT[fusionVariant(inst)]||1;}
  function fusionBossMultiplier(inst){return FUSION_BOSS_MULT[fusionVariant(inst)]||1;}
  function fusionLabel(inst){const f=fusionVariant(inst);return f==="prismatic"?"Prismatic":f==="holo"?"Holographic":"Normal";}
  function fusionBadgeHtml(inst){const f=fusionVariant(inst);return f==="normal"?"":`<span class="bc-fusion-badge ${f}" title="${f==="prismatic"?"Prismatic · +4 % Karten-Points · +4 % Boss-Power":"Holographic · +2 % Karten-Points · +2 % Boss-Power"}">${f==="prismatic"?"◇ PRISM":"◈ HOLO"}</span>`;}
  function setMembershipIds(inst){if(!inst)return[];return SET_MEMBERSHIP.get(setInstanceKey(inst))||[];}
  function setOwnedVariants(){
    if(setOwnedVariantCache&&setOwnedVariantCacheRev===cardPowerRevision)return setOwnedVariantCache;
    const set=new Set();
    for(const inst of Object.values(S?.instances||{})){if(!inst)continue;const key=setInstanceKey(inst);if(key)set.add(key);}
    setOwnedVariantCacheRev=cardPowerRevision;setOwnedVariantCache=set;return set;
  }
  function setProgress(setId){
    const def=SET_BY_ID[setId];
    if(!def)return {owned:0,total:0,stage:0,bonus:0,requirements:[],activeTarget:5,fullTarget:10,group:"normal"};
    const owned=setOwnedVariants(),rows=def.requirements.map(req=>({...req,owned:owned.has(setRequirementKey(req))})),count=rows.filter(x=>x.owned).length,total=rows.length;
    if(def.id==="hyper"){
      const stage=count>=total?total:count>=10?10:count>=5?5:count>=3?3:0;
      return {owned:count,total,stage,bonus:0,requirements:rows,activeTarget:5,fullTarget:total,group:"normal",hyper:true};
    }
    const activeTarget=def.group==="crazy"?Math.min(7,total):Math.min(5,total),fullTarget=total;
    const stage=count>=fullTarget?fullTarget:count>=activeTarget?5:count>=3?3:0,bonus=count>=fullTarget?.04:count>=activeTarget?.02:count>=3?.01:0;
    return {owned:count,total,stage,bonus,requirements:rows,activeTarget,fullTarget,group:def.group||"normal"};
  }
  function setRequirementMeta(req){
    if(!req)return {name:"Unbekannte Karte",label:"–",className:"",rarityValue:100};
    if(req.kind==="hyper"){const h=hyperCardBy(req.id),tm=hyperTierMeta(h),rv=Number(h?.chance)||100;return {name:h?.name||req.name||"Hyper-Karte",label:`HYPER · ${tm.name} · ${pct(rv)}`,className:`rar-hyper hyper-tier-${tm.id}`,rarityValue:rv};}
    if(req.kind==="exclusive"){const ex=EXCLUSIVES.find(x=>x.id===req.id),rv=Number(ex?.rarityValue)||100;return {name:ex?.name||req.name||"Exclusive",label:`EXCLUSIVE · ${pct(rv)}`,className:"rar-exclusive",rarityValue:rv};}
    if(req.kind==="win"){const w=winCardBy(req.id),r=RARITIES[clamp(Math.floor(Number(w?.rarity)||0),0,12)],rv=Number(w?.chance)||100;return {name:w?.name||req.name||"Wins-Karte",label:`WINS · ${r?.name||"Karte"} · ${pct(rv)}`,className:`rar-${r?.id||"common"} rar-win`,rarityValue:rv};}
    if(req.kind==="vip"){const v=vipCardBy(req.id),r=RARITIES[clamp(Math.floor(Number(v?.rarity)||0),0,12)],rv=Number(v?.rarityValue)||100;return {name:v?.name||req.name||"VIP-Karte",label:`VIP · ${r?.name||"Karte"} · ${pct(rv)}`,className:`rar-${r?.id||"common"} rar-vip`,rarityValue:rv};}
    const rarity=clamp(Math.floor(Number(req.rarity)||0),0,12),r=RARITIES[rarity],base=clamp(Math.floor(Number(req.base)||0),0,BASE_NAMES.length-1),rv=rarityValue(base);return {name:req.name||BASE_NAMES[base]||"Karte",label:`${r?.name||"Karte"} · ${pct(rv)}`,className:`rar-${r?.id||"common"}`,rarityValue:rv};
  }
  function ultimateSetProgress(){const owned=setOwnedVariants(),requirements=ULTIMATE_SET.requirements.map(req=>({...req,owned:owned.has(setRequirementKey(req))})),count=requirements.filter(x=>x.owned).length,total=requirements.length;return {owned:count,total,percent:total?Math.floor(count/total*100):0,complete:!!total&&count>=total,requirements};}
  function totalSetCollectionScore(){
    const normal=SET_BLUEPRINTS.map(x=>setProgress(x.id)),crazy=CRAZY_SET_BLUEPRINTS.map(x=>setProgress(x.id)),ultimate=ultimateSetProgress();
    const owned=[...normal,...crazy].reduce((n,x)=>n+x.owned,0)+ultimate.owned,total=[...normal,...crazy].reduce((n,x)=>n+x.total,0)+ultimate.total;
    return {owned,total,percent:total?Math.floor(owned/total*100):0,normalOwned:normal.reduce((n,x)=>n+x.owned,0),normalTotal:normal.reduce((n,x)=>n+x.total,0),crazyOwned:crazy.reduce((n,x)=>n+x.owned,0),crazyTotal:crazy.reduce((n,x)=>n+x.total,0),ultimate};
  }
  function ultimateSetMultiplier(){return S?.ultimateSetClaimed?2:1;}
  function setPointBonusMultiplier(inst){return 1+setPointBonusValue(inst);}
  function hyperSetCombatMultiplier(){const p=setProgress("hyper"),n=p.owned||0;return n>=16?1.15:n>=10?1.10:n>=5?1.06:n>=3?1.03:1;}
  function hyperPackCoreChance(){return HYPER_CORE_PACK_CHANCE+(setProgress("hyper").owned>=HYPER_CARDS.length?.02:0);}
  function weekStartDate(at=now()){const d=new Date(at),shift=(d.getDay()+6)%7;d.setHours(0,0,0,0);d.setDate(d.getDate()-shift);return d;}
  function weekKey(at=now()){const d=weekStartDate(at);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
  function weekIndex(at=now()){return Math.floor(weekStartDate(at).getTime()/(7*86400000));}
  function weeklySetId(){return SET_BLUEPRINTS[Math.abs(weekIndex())%SET_BLUEPRINTS.length]?.id||"dragon";}
  function ensureSetWeekly(){const key=weekKey();if(S.setWeekly?.week!==key){S.setWeekly={week:key,setId:weeklySetId(),expeditions:0,bossDamage:0,upgrades:0,claimed:{}};}S.setWeekly.claimed||={};return S.setWeekly;}
  function setMasteryXp(setId){return Math.max(0,Math.floor(Number(S?.setMastery?.[setId]?.xp)||0));}
  function setMasteryLevel(setId){return Math.min(100,Math.floor(Math.sqrt(setMasteryXp(setId)/18)));}
  function addSetMastery(setIds,amount){for(const id of new Set(setIds||[])){if(!SET_BY_ID[id])continue;const old=S.setMastery[id]||{xp:0};S.setMastery[id]={...old,xp:Math.max(0,Math.floor(Number(old.xp)||0)+Math.max(1,Math.floor(Number(amount)||1)))};}}
  function setMasteryUnlocks(setId){const lv=setMasteryLevel(setId),out=[];if(lv>=10)out.push("Titel");if(lv>=25)out.push("Set-Rahmen");if(lv>=50)out.push("Animiertes Badge");if(lv>=100)out.push("Set-Reveal");return out;}
  function setMissionRecord(kind,instOrIds,value=1){const w=ensureSetWeekly(),ids=Array.isArray(instOrIds)?instOrIds:setMembershipIds(instOrIds);if(!ids.includes(w.setId))return;if(kind==="expedition")w.expeditions=Math.max(0,Math.floor(Number(w.expeditions)||0)+Math.max(1,Math.floor(value)));else if(kind==="boss")w.bossDamage=Math.max(0,Number(w.bossDamage)||0)+Math.max(0,Number(value)||0);else if(kind==="upgrade")w.upgrades=Math.max(0,Math.floor(Number(w.upgrades)||0)+Math.max(1,Math.floor(value)));}
  function claimSetMission(kind){const w=ensureSetWeekly(),def=SET_BY_ID[w.setId];const target=kind==="expedition"?3:kind==="upgrade"?2:Math.max(5000,Math.floor((Number(S.bossWeek?.goal)||50000)*.25)),value=kind==="expedition"?w.expeditions:kind==="upgrade"?w.upgrades:w.bossDamage;if(w.claimed[kind])return toast("Diese Set-Mission ist bereits abgeholt.");if(value<target)return toast(`Noch nicht erfüllt: ${fmt(value)} / ${fmt(target)}.`);w.claimed[kind]=true;const mastery=kind==="boss"?40:25;addSetMastery([w.setId],mastery);const prestige=ultimateSetMultiplier();S.fusionDust+=(kind==="boss"?120:70)*prestige;S.auraMaterial+=(kind==="expedition"?35:15)*prestige;S.cosmeticFragments+=(kind==="upgrade"?3:1)*prestige;persist();refresh(false);toast(`${def?.icon||"🧩"} Wochenmission erfüllt · +${mastery} Set-XP · +Fusionsmaterial`,3800);}

  function expeditionSlotCount(){return Math.min(4,2+(S.level>=50?1:0)+((S.totalRebirths>=1||(collectionCount()+exclusiveCount()+vipCount())>=250)?1:0));}
  function isCardOnExpedition(id){return !!id&&S.expeditions.some(x=>x&&x.cardId===id&&!x.claimed);}
  function expeditionIdentityKey(inst){return inst?collectionKey(inst):"";}
  function isCardTypeOnExpedition(instOrId){const inst=typeof instOrId==="string"?instance(instOrId):instOrId,key=expeditionIdentityKey(inst);if(!key)return false;return S.expeditions.some(ex=>{if(!ex||ex.claimed)return false;const other=instance(ex.cardId);return other&&expeditionIdentityKey(other)===key;});}
  function expeditionAtSlot(slot){return S.expeditions.find(x=>x&&Number(x.slot)===Number(slot)&&!x.claimed)||null;}
  function expeditionCardEligible(inst){if(!inst||inst.listed||inst.broken||isCardTypeOnExpedition(inst)||inst.id===S.featuredCardId)return false;if(S.floors.flat().includes(inst.id))return false;return true;}
  function expeditionQuickScore(inst){return (inst.exclusive||inst.vip?1800:(Number(inst.rarity)||0)*120)+(Number(inst.level)||1)*30+cardRebirth(inst)*180+(fusionVariant(inst)==="prismatic"?120:fusionVariant(inst)==="holo"?60:0)+Math.max(0,100-(inst.exclusive?EXCLUSIVES.find(x=>x.id===inst.exclusiveId)?.rarityValue||100:inst.vip?vipCardBy(inst.vipId)?.rarityValue||100:rarityValue(inst.base)));}
  function expeditionPickerRows(){const rows=[];for(const map of collectionOwnedIndex()){for(const arr of map.values()){let best=null,bestScore=-Infinity;for(const inst of arr){if(!expeditionCardEligible(inst))continue;const score=expeditionQuickScore(inst);if(score>bestScore){best=inst;bestScore=score;}}if(best)rows.push({inst:best,score:bestScore,count:arr.length});}}rows.sort((a,b)=>b.score-a.score);return rows.slice(0,140);}
  function expeditionRawPointRate(inst){if(!inst)return 0;const base=inst.hyper?hyperEconomyBase(inst):(inst.exclusive||inst.vip)?premiumProductionBase(inst):cardBasePointProduction(inst.rarity,inst.base)*(inst.win?1.05:1);let value=base*(LEVEL_MULT[inst.level]||1)*pointCardRebirthMultiplier(inst)*persistentPointBonusMultiplier(inst);if(inst.exclusive||inst.vip)value=Math.min(value,premiumPointCap(inst));return Math.max(1,value);}
  function expeditionRawXpRate(inst){if(!inst)return 0;let v=cardBaseXp(inst)*(XP_LEVEL_MULT[inst.level]||1)*xpCardRebirthMultiplier(inst);if(inst.bind)v*=bindBy(inst.bind)?.mult||1;if(inst.exclusive||inst.vip)v=Math.min(v,premiumXpCap(inst));return Math.max(.1,v);}
  function expeditionTimeBonus(){return 1;}
  function expeditionMaterialBonus(inst){const f=fusionVariant(inst),fusion=f==="prismatic"?1.035:f==="holo"?1.02:1,premium=(inst?.hyper||inst?.exclusive||inst?.vip)?1.05:1;return fusion*premium*ultimateSetMultiplier();}
  function showExpeditionPicker(slot){slot=clamp(Math.floor(Number(slot)||0),0,3);if(slot>=expeditionSlotCount())return toast("Dieser Expeditions-Slot ist noch gesperrt.");if(expeditionAtSlot(slot))return toast("Dieser Slot ist bereits belegt.");UI.expeditionPickerSlot=slot;const rows=expeditionPickerRows();showModal(`<div class="bc-expedition-picker"><small>EXPEDITION · SLOT ${slot+1}</small><h2>🧭 Karte auswählen</h2><p>Nur wirklich freie Karten werden angezeigt: keine persönliche Karte, keine Spielfeldkarte, kein Marktlisting und keine Kartenart, die bereits in einem anderen Expeditions-Slot läuft.</p><div class="bc-feature-picker-grid">${rows.length?rows.map(row=>{const m=cardMeta(row.inst);return `<button data-bc-expedition-card="${row.inst.id}" class="${m.className}"><span>${m.icon}</span><div><b>${esc(m.name)}</b><small>${row.inst.hyper?`HYPER · G${hyperGeneration(row.inst)} · ${m.hyperTier?.name||""}`:row.inst.vip?`VIP · ${m.rarity.name}`:row.inst.exclusive?"EXCLUSIVE":m.rarity.name} · ${pct(m.rarityValue)} · ${fusionLabel(row.inst)} · ${fmt(expeditionRawPointRate(row.inst))} Roh-Points/s</small></div><em>Wählen</em></button>`}).join(""):`<div class="bc-empty-state"><span>🧭</span><h3>Keine freie Karte</h3><p>Nimm eine Karte aus Spielfeld/persönlichem Slot oder warte auf eine laufende Expedition.</p></div>`}</div></div>`);}
  function showExpeditionConfig(cardId,slot=UI.expeditionPickerSlot){const inst=instance(cardId);if(!expeditionCardEligible(inst))return toast("Diese Karte ist nicht mehr frei für eine Expedition.");const m=cardMeta(inst),sets=setMembershipIds(inst).map(id=>`${SET_BY_ID[id]?.icon||"🧩"} ${SET_BY_ID[id]?.name}`).join(" · ")||"Kein Set";showModal(`<div class="bc-expedition-config"><small>EXPEDITION VORBEREITEN · SLOT ${Number(slot)+1}</small><h2>${m.icon} ${esc(m.name)}</h2><p>${esc(sets)} · ${fusionLabel(inst)}. Hyper/Exclusive/VIP erhalten einen kleinen Materialbonus; alle gewählten Laufzeiten bleiben trotzdem exakt 10 Minuten, 1 Stunde oder 6 Stunden.</p><div class="bc-expedition-type-grid">${EXPEDITION_TYPES.map(t=>`<article><span>${t.icon}</span><b>${t.name}</b><small>${t.desc}</small><div>${EXPEDITION_DURATIONS.map(d=>{return `<button data-bc-exp-start="${esc(t.id)}" data-bc-exp-card="${inst.id}" data-bc-exp-slot="${slot}" data-bc-exp-minutes="${d.minutes}">${d.icon} ${d.label}</button>`}).join("")}</div></article>`).join("")}</div><div class="bc-market-info-warning"><b>Wichtig:</b> Während der Expedition ist die Karte gebunden. Sie kann nicht verkauft, fusioniert, aufs Spielfeld gesetzt oder als persönliche/Kampfkarte neu ausgewählt werden.</div></div>`);}
  function startExpedition(slot,cardId,typeId,minutes){slot=clamp(Math.floor(Number(slot)||0),0,3);const inst=instance(cardId),type=EXPEDITION_TYPES.find(x=>x.id===typeId),dur=EXPEDITION_DURATIONS.find(x=>x.minutes===Number(minutes));if(!inst||!type||!dur||!expeditionCardEligible(inst))return toast("Expedition konnte nicht gestartet werden.");if(slot>=expeditionSlotCount()||expeditionAtSlot(slot))return toast("Expeditions-Slot nicht verfügbar.");const startedAt=now(),actualMinutes=Math.max(1,Math.round(dur.minutes*expeditionTimeBonus(inst))),entry={id:uid(),slot,cardId:inst.id,type:type.id,minutes:dur.minutes,actualMinutes,startedAt,endsAt:startedAt+actualMinutes*60000,pointRate:expeditionRawPointRate(inst),xpRate:expeditionRawXpRate(inst),setIds:setMembershipIds(inst),fusion:fusionVariant(inst),premium:!!(inst.hyper||inst.exclusive||inst.vip),claimed:false};S.expeditions=S.expeditions.filter(x=>x&&Number(x.slot)!==slot);S.expeditions.push(entry);persist();closeModal();UI.tab="expedition";refresh(false);toast(`${type.icon} ${cardMeta(inst).name} ist für ${actualMinutes<60?`${actualMinutes} Min.`:`${(actualMinutes/60).toLocaleString("de-DE",{maximumFractionDigits:1})} Std.`} unterwegs.`,4200);}
  function expeditionQuality(){const r=Math.random();return r<.03?{id:"perfect",name:"Perfekt",mult:1.15,icon:"🌟"}:r<.15?{id:"very",name:"Sehr gut",mult:1.10,icon:"✨"}:r<.45?{id:"good",name:"Gut",mult:1.05,icon:"👍"}:{id:"normal",name:"Normal",mult:1,icon:"✓"};}
  function claimExpedition(slot){const ex=expeditionAtSlot(slot);if(!ex)return;if(now()<Number(ex.endsAt))return toast("Diese Expedition ist noch nicht beendet.");const inst=instance(ex.cardId),type=EXPEDITION_TYPES.find(x=>x.id===ex.type)||EXPEDITION_TYPES[0],dur=EXPEDITION_DURATIONS.find(x=>x.minutes===Number(ex.minutes))||EXPEDITION_DURATIONS[0],quality=expeditionQuality(),seconds=Number(ex.minutes)*60,weekly=weeklySetId(),setWeekBonus=(ex.setIds||[]).includes(weekly)?1.10:1,materialBonus=expeditionMaterialBonus(inst||{exclusive:ex.premium,fusion:ex.fusion})*quality.mult*setWeekBonus*prestigeExpeditionMaterialMultiplier(),points=Math.floor((Number(ex.pointRate)||1)*seconds*dur.eff*type.pointFactor*quality.mult*ultimateSetMultiplier()),xp=Math.floor((Number(ex.xpRate)||1)*seconds*dur.eff*type.xpFactor*quality.mult),scale=Math.max(1,Math.log10(10+(Number(ex.pointRate)||1))),dust=Math.floor((4+seconds/900)*scale*type.dustFactor*materialBonus),aura=Math.floor((3+seconds/1200)*scale*type.auraFactor*materialBonus),cosmetics=Math.floor((seconds>=21600?2:seconds>=3600?1:0)*type.cosmeticFactor*materialBonus),catalyst=(type.id==="rift"&&seconds>=3600&&Math.random()<(seconds>=21600?.08:.018))?1:0;let event="";const er=Math.random();if(er<.04){event="Geheime Kammer";S.cosmeticFragments+=1;}else if(er<.10){event="Verborgener Fund";S.auraMaterial+=Math.max(1,Math.round(scale));}else if(er<.17){event="Seltener Gegner";addXp(Math.max(5,Math.floor(xp*.12)));}else if(er<.22){event="Dimensionsportal";S.fusionDust+=Math.max(2,Math.floor(dust*.2));}if(points){S.points+=Math.floor(points*vipWheelMultiplier("points"));S.lifetimePointsEarned+=Math.floor(points*vipWheelMultiplier("points"));}if(xp)addXp(xp);S.fusionDust+=Math.max(0,dust);S.auraMaterial+=Math.max(0,aura);S.cosmeticFragments+=Math.max(0,cosmetics);S.prismaticCatalysts+=catalyst;if(type.id==="set"){addSetMastery(ex.setIds||[],Math.max(10,Math.round(seconds/600)));setMissionRecord("expedition",ex.setIds||[],1);}else addSetMastery(ex.setIds||[],Math.max(2,Math.round(seconds/3600)));ex.claimed=true;S.expeditions=S.expeditions.filter(x=>x&&x.id!==ex.id);persist();refresh(false);showModal(`<div class="bc-expedition-result ${quality.id}"><small>EXPEDITION ABGESCHLOSSEN</small><h2>${quality.icon} ${quality.name}</h2><p>${inst?esc(cardMeta(inst).name):"Deine Karte"} kehrt aus <b>${esc(type.name)}</b> zurück.${event?` Ereignis: <b>${esc(event)}</b>.`:""}</p><div class="bc-resource-grid"><span>💰 <b>+${fmt(points)}</b><small>Points</small></span><span>✨ <b>+${fmt(xp)}</b><small>XP</small></span><span>🧪 <b>+${fmt(dust)}</b><small>Fusionsstaub</small></span><span>✦ <b>+${fmt(aura)}</b><small>Aura-Material</small></span><span>🎨 <b>+${fmt(cosmetics)}</b><small>Kosmetikfragmente</small></span><span>◇ <b>+${catalyst}</b><small>Prismatic-Katalysator</small></span></div><button class="bc-primary" data-bc-modal-close>Belohnungen übernehmen</button></div>`);}
  function formatExpeditionDuration(minutes){minutes=Math.max(1,Math.round(Number(minutes)||0));if(minutes%60===0){const h=minutes/60;return `${h} ${h===1?"Stunde":"Stunden"}`;}if(minutes>60){const h=Math.floor(minutes/60),m=minutes%60;return `${h} Std. ${m} Min.`;}return `${minutes} Minuten`;}
  function formatRemain(ms){ms=Math.max(0,Math.ceil(ms/1000));const h=Math.floor(ms/3600),m=Math.floor(ms%3600/60),s=ms%60;return h?`${h}h ${String(m).padStart(2,"0")}m`:m?`${m}m ${String(s).padStart(2,"0")}s`:`${s}s`;}
  function refreshExpeditionCountdowns(){if(UI.tab!=="expedition"||!UI.overlay)return;for(const el of UI.overlay.querySelectorAll("[data-bc-exp-countdown]")){const end=Number(el.dataset.bcExpCountdown)||0;el.textContent=end<=now()?"Bereit zum Abholen":formatRemain(end-now());const button=el.closest("article")?.querySelector("[data-bc-exp-claim]");if(button)button.disabled=end>now();}}
  function finishExpeditionWithJk(slot){slot=clamp(Math.floor(Number(slot)||0),0,3);const ex=expeditionAtSlot(slot);if(!ex)return false;if(Number(ex.endsAt)<=now())return false;ex.endsAt=now();persist();if(UI.overlay&&UI.tab==="expedition"){refresh(false);toast(`⚡ Expedition in Slot ${slot+1} sofort abgeschlossen. Belohnung kann abgeholt werden.`,4200);}return true;}
  function expeditionHtml(){const slots=expeditionSlotCount(),weekly=SET_BY_ID[weeklySetId()];return `<section class="bc-section bc-expeditions"><div class="bc-section-title"><div><small>KARTEN-EXPEDITIONEN</small><h2>🧭 Expeditionen</h2><p>Unbenutzte Karten arbeiten für Materialien und kleine Zusatzbelohnungen. Aktives Spielen bleibt deutlich effizienter.</p></div><button class="bc-info-circle" data-bc-section-info="expedition" title="Expeditions-Info">i</button><div class="bc-system-resources"><span>🧪 ${fmt(S.fusionDust)}</span><span>✦ ${fmt(S.auraMaterial)}</span><span>🎨 ${fmt(S.cosmeticFragments)}</span></div></div><div class="bc-expedition-week"><b>${weekly?.icon||"🧩"} Wochen-Set: ${esc(weekly?.name||"")}</b><span>Passende Set-Karten erhalten maximal +10 % Expeditionsbelohnung.</span></div><div class="bc-expedition-slots">${Array.from({length:4},(_,slot)=>{const unlocked=slot<slots,ex=expeditionAtSlot(slot),inst=ex?instance(ex.cardId):null,type=ex?EXPEDITION_TYPES.find(x=>x.id===ex.type):null;return `<article class="${!unlocked?"locked":ex?"running":"free"}"><header><span>${unlocked?ex?type?.icon||"🧭":"🧭":"🔒"}</span><div><small>SLOT ${slot+1}</small><h3>${!unlocked?slot===2?"Ab Level 50":"Ab Rebirth 1 oder 250 Karten":ex?esc(cardMeta(inst)?.name||"Karte"):"Freier Expeditionsplatz"}</h3></div></header>${!unlocked?`<p>Dieser Slot erweitert die passive Nutzung, ohne mehr als vier parallele Expeditionen zu erlauben.</p>`:ex?`<p><b>${esc(type?.name||"Expedition")}</b> · ${formatExpeditionDuration(ex.actualMinutes||ex.minutes)}</p><strong data-bc-exp-countdown="${ex.endsAt}">${formatRemain(ex.endsAt-now())}</strong><button data-bc-exp-claim="${slot}" ${ex.endsAt>now()?"disabled":""}>${ex.endsAt>now()?"Unterwegs …":"Belohnung abholen"}</button>`:`<p>Wähle eine freie Karte, Expeditionsart und 10 Min. / 1 Std. / 6 Std.</p><button data-bc-exp-pick="${slot}">Karte losschicken</button>`}</article>`}).join("")}</div><div class="bc-system-explain"><article><b>10 Min.</b><span>≈ 12 % aktive Effizienz</span></article><article><b>1 Stunde</b><span>≈ 16 %</span></article><article><b>6 Stunden</b><span>≈ 20 % + beste Materialchance</span></article><article><b>Kein Kartenverlust</b><span>Expeditionen können eine Karte niemals zerstören.</span></article></div></section>`;}

  function fusionDustGain(inst){if(!inst)return 0;const rv=inst.hyper?(hyperCardBy(inst.hyperId)?.chance||100):inst.exclusive?(EXCLUSIVES.find(x=>x.id===inst.exclusiveId)?.rarityValue||100):inst.vip?(vipCardBy(inst.vipId)?.rarityValue||100):rarityValue(inst.base),tier=inst.hyper?combatTier(inst):inst.exclusive||inst.vip?premiumReferenceTier():inst.rarity;return Math.max(1,Math.round((tier+1)*3/Math.max(.35,Math.sqrt(Math.max(.1,rv)))));}
  function fusionDustCost(inst,target){const tier=inst.hyper?combatTier(inst):inst.exclusive||inst.vip?premiumReferenceTier():clamp(inst.rarity,0,12),scarcity=Math.max(.8,Math.min(2.5,Math.sqrt(10/Math.max(.1,cardMeta(inst).rarityValue)))),raw=FUSION_DUST_BASE*(target==="prismatic"?9:1)*(1+tier*.32)*scarcity*prestigeFusionDustMultiplier();return Math.max(10,Math.ceil(raw/10)*10);}
  function hardProtectedForFusion(inst){if(!inst)return true;if(inst.id===S.featuredCardId||featuredCard()?.backupCardId===inst.id||S.floors.flat().includes(inst.id)||inst.listed||isCardOnExpedition(inst.id))return true;if(inst.aura||inst.combatAura||inst.bind||inst.trail||potionQueueCount(inst))return true;return false;}
  function softProtectedForFusion(inst){if(!inst)return false;const rv=cardMeta(inst).rarityValue;return !!(inst.favorite||inst.locked||inst.hyper||inst.exclusive||inst.vip||Number(rv)<=1);}
  function fusionPlan(inst,target){if(!inst)return null;const need=target==="prismatic"?FUSION_PRISM_DUPES:FUSION_HOLO_DUPES,dust=fusionDustCost(inst,target),safe=[],risky=[];for(const other of Object.values(S.instances||{})){if(!other||other.id===inst.id||collectionKey(other)!==collectionKey(inst)||fusionVariant(other)!=="normal"||hardProtectedForFusion(other))continue;(softProtectedForFusion(other)?risky:safe).push(other);}safe.sort((a,b)=>(Number(a.level)||1)-(Number(b.level)||1)||cardRebirth(a)-cardRebirth(b));risky.sort((a,b)=>(Number(a.level)||1)-(Number(b.level)||1));return {need,dust,safe,risky,enough:safe.length+risky.length>=need,riskyNeeded:Math.max(0,need-safe.length)};}
  async function fuseCard(id,target){const inst=instance(id);if(!inst)return;if(hardProtectedForFusion(inst))return toast("Diese Hauptkarte ist gerade gebunden. Entferne sie zuerst aus Spielfeld/Markt/Expedition oder Ausrüstung.");const current=fusionVariant(inst);if(target==="holo"&&current!=="normal")return toast("Holographic benötigt eine normale Karte.");if(target==="prismatic"&&current!=="holo")return toast("Prismatic benötigt bereits eine Holographic-Karte.");const plan=fusionPlan(inst,target);if(!plan?.enough)return toast(`Du brauchst ${plan.need} freie Duplikate. Verfügbar: ${plan.safe.length+plan.risky.length}.`);if(S.fusionDust<plan.dust)return toast(`Dir fehlen ${fmt(plan.dust-S.fusionDust)} Fusionsstaub.`);if(target==="prismatic"&&S.prismaticCatalysts<1)return toast("Für Prismatic brauchst du 1 Prismatic-Katalysator aus Boss/Expedition.");const marketKey=marketCardKeyFromInst(inst);await loadMarketStats([marketKey]);const marketUnit=Math.max(0,marketAdjustedReference(marketStatsForKey(marketKey))),m=cardMeta(inst),selected=[...plan.safe,...plan.risky].slice(0,plan.need),marketValue=marketUnit?marketUnit*selected.length:selected.reduce((sum,x)=>sum+sellValue(x),0),label=target==="prismatic"?"Prismatic":"Holographic";if(!await gameConfirm({title:`${label}-Fusion`,message:`${m.name}\n${plan.need} Duplikate + ${fmt(plan.dust)} Fusionsstaub${target==="prismatic"?" + 1 Katalysator":""}\nGeschätzter ${marketUnit?"7-Tage-Marktwert":"interner Kartenwert"} des Materials: ${fmt(marketValue)} Points\n\nFusionen sind bei erfüllten Kosten immer 100 % erfolgreich.`,confirmText:`Zu ${label} fusionieren`,icon:target==="prismatic"?"◇":"◈",tone:"danger"}))return;if(plan.riskyNeeded>0){const risky=selected.filter(softProtectedForFusion),names=risky.slice(0,4).map(x=>`${cardMeta(x).name} (${pct(cardMeta(x).rarityValue)})`).join("\n");if(!await gameConfirm({title:"WARNUNG · geschützte Sammlerkarten",message:`Für diese Fusion werden ${risky.length} besonders geschützte Duplikate benötigt. Darunter können ≤1-%-, Hyper/Exclusive/VIP-, Favoriten- oder gesperrte Karten sein.\n\n${names}${risky.length>4?"\n…":""}\n\nDiese zweite Bestätigung ist absichtlich erforderlich.`,confirmText:"Trotzdem verbrauchen",icon:"⚠️",tone:"danger"}))return;}for(const other of selected){clearBackupReferences(other.id);delete S.instances[other.id];}S.fusionDust-=plan.dust;if(target==="prismatic")S.prismaticCatalysts--;inst.fusion=target;invalidateCardPowerCache();addSetMastery(setMembershipIds(inst),target==="prismatic"?60:20);persist();refresh(false);showFusionCard(inst.id);toast(`${target==="prismatic"?"◇":"◈"} ${m.name} ist jetzt ${label}.`,4500);}
  function fusionSummary(){if(fusionSummaryCache&&fusionSummaryCacheRev===cardPowerRevision)return fusionSummaryCache;const map=new Map();for(const inst of Object.values(S.instances||{})){if(!inst)continue;const key=collectionKey(inst);let g=map.get(key);if(!g){g={key,normal:0,holo:0,prismatic:0,rep:inst};map.set(key,g);}g[fusionVariant(inst)]++;if(expeditionQuickScore(inst)>expeditionQuickScore(g.rep))g.rep=inst;}const rows=[...map.values()];rows.sort((a,b)=>{const ar=(a.normal>=FUSION_HOLO_DUPES+1?2:a.holo&&a.normal>=FUSION_PRISM_DUPES?1:0),br=(b.normal>=FUSION_HOLO_DUPES+1?2:b.holo&&b.normal>=FUSION_PRISM_DUPES?1:0);return br-ar||(b.normal+b.holo+b.prismatic)-(a.normal+a.holo+a.prismatic);});fusionSummaryCacheRev=cardPowerRevision;fusionSummaryCache=rows;return rows;}
  function showFusionCard(id){const inst=instance(id);if(!inst)return;const m=cardMeta(inst),planH=fusionPlan(inst,"holo"),planP=fusionPlan(inst,"prismatic"),f=fusionVariant(inst),sets=setMembershipIds(inst).map(x=>SET_BY_ID[x]?.name).filter(Boolean).join(" + ")||"Kein Set";showModal(`<div class="bc-fusion-detail ${f}"><small>FUSIONSLABOR</small><h2>${m.icon} ${esc(m.name)}</h2><div class="bc-fusion-hero"><span>${f==="prismatic"?"◇":f==="holo"?"◈":"○"}</span><div><b>${fusionLabel(inst)}</b><small>${esc(sets)} · ${pct(m.rarityValue)} · Lv ${inst.level}/5</small></div></div><div class="bc-fusion-path"><article class="${f==="normal"?"current":"done"}"><b>Normal</b><span>Grundkarte</span></article><article class="${f==="holo"?"current":f==="prismatic"?"done":""}"><b>Holographic</b><span>+2 % Karten-Points · +2 % Boss-Power</span></article><article class="${f==="prismatic"?"current":""}"><b>Prismatic</b><span>+4 % Karten-Points · +4 % Boss-Power · +3 % Expeditionsmaterial</span></article></div>${f==="normal"?`<div class="bc-fusion-cost"><b>Holographic</b><span>${planH?.safe.length+planH?.risky.length||0}/${FUSION_HOLO_DUPES} Duplikate · ${fmt(planH?.dust||0)} Staub</span><button data-bc-fuse-card="${inst.id}" data-bc-fuse-target="holo" ${!planH?.enough||S.fusionDust<(planH?.dust||0)?"disabled":""}>◈ Holographic fusionieren</button></div>`:f==="holo"?`<div class="bc-fusion-cost prism"><b>Prismatic</b><span>${planP?.safe.length+planP?.risky.length||0}/${FUSION_PRISM_DUPES} Duplikate · ${fmt(planP?.dust||0)} Staub · ${S.prismaticCatalysts} Katalysator</span><button data-bc-fuse-card="${inst.id}" data-bc-fuse-target="prismatic" ${!planP?.enough||S.fusionDust<(planP?.dust||0)||S.prismaticCatalysts<1?"disabled":""}>◇ Prismatic fusionieren</button></div>`:`<div class="bc-market-info-warning"><b>Prismatic MAX:</b> Es gibt bewusst keine weitere Power-Stufe. Spätere Stufen sollten fast nur kosmetisch sein.</div>`}<div class="bc-market-info-warning"><b>Schutz:</b> Spielfeld-, persönliche, Backup-, Markt-, Expeditions- und ausgerüstete Karten werden nie verbraucht. ≤1-%-, VIP/Exclusive-, Favoriten- oder gesperrte Duplikate benötigen eine zweite ausdrückliche Bestätigung.</div></div>`);}
  function fusionHtml(){const rows=fusionSummary().slice(0,80);return `<section class="bc-section bc-fusion"><div class="bc-section-title"><div><small>DUPLIKATE VEREDLEN</small><h2>🔬 Fusionslabor</h2><p>Duplikate werden zu besonderen Varianten derselben Grundkarte. Rarität und Fusionsvariante bleiben getrennte Systeme.</p></div><button class="bc-info-circle" data-bc-section-info="fusion" title="Fusions-Info">i</button><div class="bc-system-resources"><span>🧪 ${fmt(S.fusionDust)} Staub</span><span>◇ ${fmt(S.prismaticCatalysts)} Katalysatoren</span></div></div><div class="bc-fusion-rules"><article><b>◈ Holographic</b><span>1 Hauptkarte + 8 Duplikate + Staub · dieselbe Karte als Holo · +2 % Points / Boss</span></article><article><b>◇ Prismatic</b><span>Holo + 20 weitere Duplikate + Staub + Katalysator · höchste Fusionsstufe · +4 % Points / Boss</span></article><article><b>100 % Erfolg</b><span>Kein zufälliger Fehlschlag, keine verlorene 30-%-Chance.</span></article></div><div class="bc-fusion-list">${rows.length?rows.map(g=>{const inst=g.rep,m=cardMeta(inst),canH=g.normal>=FUSION_HOLO_DUPES+1,canP=g.holo>0&&g.normal>=FUSION_PRISM_DUPES;return `<button data-bc-fusion-card="${inst.id}" class="${m.className} ${canH||canP?"ready":""}"><span>${m.icon}</span><div><b>${esc(m.name)}</b><small>${inst.vip?`VIP · ${m.rarity.name}`:inst.exclusive?"EXCLUSIVE":m.rarity.name} · Normal ×${g.normal} · Holo ×${g.holo} · Prism ×${g.prismatic}</small></div><em>${canP?"◇ PRISM BEREIT":canH?"◈ HOLO BEREIT":"Ansehen"}</em></button>`}).join(""):`<div class="bc-empty-state"><span>🔬</span><h3>Noch keine Karten</h3></div>`}</div></section>`;}

  function bossDefinition(at=now()){const idx=Math.abs(weekIndex(at))%BOSS_VARIANTS.length,base=BOSS_VARIANTS[idx],maxHp=Math.round(1_000_000_000*(1+(idx*.18)));return {...base,weekKey:weekKey(at),maxHp};}
  function bossPhase(root=UI.boss||bossDefinition()){const max=Math.max(1,Number(root?.maxHp)||bossDefinition().maxHp),damage=Math.max(0,Number(root?.globalDamage)||0),left=clamp(1-damage/max,0,1);if(left>.70)return {id:1,name:"Phase 1 · Normal",icon:"🛡️",damageMult:1,desc:"Normale Verteidigung."};if(left>.40)return {id:2,name:"Phase 2 · Schildbruch",icon:"⚡",damageMult:1.03,desc:"Der Boss öffnet eine neue Schwachstelle: +3 % gewerteter Teamschaden."};if(left>.10)return {id:3,name:"Phase 3 · Raserei",icon:"🔥",damageMult:.97,desc:"Der Boss erhöht seine Verteidigung: -3 % Teamschaden."};return {id:4,name:"Finale Phase · Endspurt",icon:"🌟",damageMult:1.05,desc:"Unter 10 % Leben: +5 % Teamschaden und Community-Endspurt."};}
  const BOSS_FREE_ATTACKS_PER_DAY=3;
  const BOSS_BONUS_ATTACKS_PER_DAY=2;
  function bossDailyShadowKey(){return `jk-games-bigcards-boss-daily-v406:${currentUidSync()||cloudUid||"guest"}`;}
  function readBossDailyShadow(day){
    try{
      const raw=JSON.parse(localStorage.getItem(bossDailyShadowKey())||"null");
      return raw&&raw.day===day?raw:null;
    }catch{return null;}
  }
  function writeBossDailyShadow(d){
    try{
      localStorage.setItem(bossDailyShadowKey(),JSON.stringify({
        day:d.day,
        freeUsed:d.freeUsed,
        bonusUsed:d.bonusUsed,
        packBonusEarned:!!d.packBonusEarned,
        battleBonusEarned:!!d.battleBonusEarned,
        packProgress:d.packProgress,
        battleProgress:d.battleProgress
      }));
    }catch{}
  }
  function bossBonusEarnedCount(d){return (d.packBonusEarned?1:0)+(d.battleBonusEarned?1:0);}
  function normalizeBossDailyShape(raw,day){
    const d=raw&&typeof raw==="object"?raw:{};
    const freeUsed=clamp(Math.floor(Number(d.freeUsed)||0),0,BOSS_FREE_ATTACKS_PER_DAY);
    const legacyTickets=clamp(Math.floor(Number(d.bonusTickets)||0),0,BOSS_BONUS_ATTACKS_PER_DAY);
    let packBonusEarned=!!d.packBonusEarned;
    let battleBonusEarned=!!d.battleBonusEarned||Math.floor(Number(d.battleProgress)||0)>=1;
    let bonusUsed=clamp(Math.floor(Number(d.bonusUsed)||0),0,BOSS_BONUS_ATTACKS_PER_DAY);
    // Migration alter Spielstände: Wenn die 3 Gratis-Angriffe bereits verbraucht
    // und keine alten Tickets mehr vorhanden sind, behandeln wir die zwei
    // Bonusplätze konservativ als bereits verbraucht. So kann ein alter/staler
    // Save nach Reload nicht wieder zwei Angriffe schenken.
    if(d.bonusUsed==null&&freeUsed>=BOSS_FREE_ATTACKS_PER_DAY&&legacyTickets===0){
      packBonusEarned=true;
      battleBonusEarned=true;
      bonusUsed=BOSS_BONUS_ATTACKS_PER_DAY;
    }else if(d.bonusUsed==null&&legacyTickets>0){
      if(!packBonusEarned&&!battleBonusEarned)packBonusEarned=true;
      if(legacyTickets>1&&!battleBonusEarned)battleBonusEarned=true;
      bonusUsed=Math.max(0,bossBonusEarnedCount({packBonusEarned,battleBonusEarned})-legacyTickets);
    }
    const out={
      day,
      freeUsed,
      bonusUsed,
      packBonusEarned,
      battleBonusEarned,
      packProgress:packBonusEarned?0:clamp(Math.floor(Number(d.packProgress)||0),0,4),
      battleProgress:battleBonusEarned?1:clamp(Math.floor(Number(d.battleProgress)||0),0,1)
    };
    out.bonusTickets=Math.max(0,bossBonusEarnedCount(out)-out.bonusUsed);
    return out;
  }
  function mergeBossDailyHighWater(base,other){
    if(!other||other.day!==base.day)return base;
    base.freeUsed=Math.max(base.freeUsed,clamp(Math.floor(Number(other.freeUsed)||0),0,BOSS_FREE_ATTACKS_PER_DAY));
    base.bonusUsed=Math.max(base.bonusUsed,clamp(Math.floor(Number(other.bonusUsed)||0),0,BOSS_BONUS_ATTACKS_PER_DAY));
    base.packBonusEarned=base.packBonusEarned||!!other.packBonusEarned;
    base.battleBonusEarned=base.battleBonusEarned||!!other.battleBonusEarned;
    if(!base.packBonusEarned)base.packProgress=Math.max(base.packProgress,clamp(Math.floor(Number(other.packProgress)||0),0,4));
    if(base.battleBonusEarned)base.battleProgress=1;
    else base.battleProgress=Math.max(base.battleProgress,clamp(Math.floor(Number(other.battleProgress)||0),0,1));
    base.bonusUsed=Math.min(base.bonusUsed,bossBonusEarnedCount(base));
    base.bonusTickets=Math.max(0,bossBonusEarnedCount(base)-base.bonusUsed);
    return base;
  }
  function ensureBossDaily(){
    const day=dailyKey();
    let d=normalizeBossDailyShape(S.bossDaily?.day===day?S.bossDaily:null,day);
    d=mergeBossDailyHighWater(d,readBossDailyShadow(day));
    S.bossDaily=d;
    writeBossDailyShadow(d);
    return d;
  }
  function reconcileBossDailyRemote(remote){
    const day=dailyKey();
    if(!remote||String(remote.dailyDay||"")!==day)return false;
    const d=ensureBossDaily(),before=JSON.stringify(d);
    mergeBossDailyHighWater(d,{
      day,
      freeUsed:remote.dailyFreeUsed,
      bonusUsed:remote.dailyBonusUsed,
      packBonusEarned:remote.dailyPackBonusEarned,
      battleBonusEarned:remote.dailyBattleBonusEarned,
      packProgress:remote.dailyPackProgress,
      battleProgress:remote.dailyBattleProgress
    });
    S.bossDaily=d;writeBossDailyShadow(d);
    return JSON.stringify(d)!==before;
  }
  function ensureBossWeek(){const key=weekKey();if(S.bossWeek?.key!==key)S.bossWeek={key,contribution:0,attacks:0,goal:0,milestones:{},community:{},goldCounted:false};S.bossWeek.milestones||={};S.bossWeek.community||={};return S.bossWeek;}
  function recordBossPackOpen(){
    const d=ensureBossDaily();
    if(d.packBonusEarned)return;
    d.packProgress=Math.min(5,Math.max(0,Math.floor(Number(d.packProgress)||0)+1));
    if(d.packProgress>=5){
      d.packProgress=0;
      d.packBonusEarned=true;
      d.bonusTickets=Math.max(0,bossBonusEarnedCount(d)-d.bonusUsed);
      toast("🎟 Boss-Bonusangriff erspielt: 5 Packs geöffnet.",2600);
    }
    writeBossDailyShadow(d);
  }
  function recordBossBattleWin(){
    const d=ensureBossDaily();
    if(d.battleBonusEarned)return;
    d.battleProgress=1;
    d.battleBonusEarned=true;
    d.bonusTickets=Math.max(0,bossBonusEarnedCount(d)-d.bonusUsed);
    writeBossDailyShadow(d);
    toast("🎟 Boss-Bonusangriff erspielt: Kartenkampf gewonnen.",2600);
  }
  function bossCardEligible(inst){return !!inst&&!inst.listed&&!inst.broken&&!isCardOnExpedition(inst.id);}
  function bossLoadoutCards(){return (S.bossLoadout||[]).map(id=>instance(id)).map(x=>bossCardEligible(x)?x:null);}
  function bossCardTags(inst){return setMembershipIds(inst);}
  function bossTeamStats(){const def=bossDefinition(),phase=bossPhase(),cards=bossLoadoutCards();let base=0,tagBonus=0,setBonus=0,premiumBonus=0;cards.forEach((inst,i)=>{if(!inst)return;const power=combatStats(inst).power*fusionBossMultiplier(inst)*(i===0?1:.25);base+=power;const ids=bossCardTags(inst);if(ids.some(id=>def.tags.includes(id)))tagBonus+=.05;for(const id of ids){const stage=setProgress(id).stage;if(stage>=10)setBonus+=.04;else if(stage>=5)setBonus+=.02;}if(inst.exclusive||inst.vip)premiumBonus=Math.max(premiumBonus,.06);});tagBonus=Math.min(.15,tagBonus);setBonus=Math.min(.10,setBonus);const jkMult=jkBossDamageMultiplier(),total=Math.max(0,base*(1+tagBonus+setBonus+premiumBonus)*phase.damageMult*jkMult);return {cards,base,tagBonus,setBonus,premiumBonus,jkMult,total,def,phase};}
  function bossAvailableAttacks(){
    const d=ensureBossDaily();
    const free=Math.max(0,BOSS_FREE_ATTACKS_PER_DAY-d.freeUsed);
    const bonus=Math.max(0,Math.min(BOSS_BONUS_ATTACKS_PER_DAY,bossBonusEarnedCount(d))-d.bonusUsed);
    return free+bonus;
  }
  function bossConsumeAttack(){
    const d=ensureBossDaily();
    if(d.freeUsed<BOSS_FREE_ATTACKS_PER_DAY)d.freeUsed++;
    else if(d.bonusUsed<Math.min(BOSS_BONUS_ATTACKS_PER_DAY,bossBonusEarnedCount(d)))d.bonusUsed++;
    else return false;
    d.bonusTickets=Math.max(0,bossBonusEarnedCount(d)-d.bonusUsed);
    writeBossDailyShadow(d);
    return true;
  }
  function bossQuickScore(inst){if(!bossCardEligible(inst))return -Infinity;return (inst.exclusive||inst.vip?2200:(inst.rarity+1)*150)+(inst.level||1)*45+cardRebirth(inst)*260+cardRank(inst)*45+(fusionVariant(inst)==="prismatic"?140:fusionVariant(inst)==="holo"?60:0);}
  function showBossCardPicker(slot){slot=clamp(Math.floor(Number(slot)||0),0,2);const rows=[];for(const map of collectionOwnedIndex())for(const arr of map.values()){let best=null,score=-Infinity;for(const inst of arr){if(!bossCardEligible(inst)||S.bossLoadout.some((id,i)=>i!==slot&&id===inst.id))continue;const q=bossQuickScore(inst);if(q>score){best=inst;score=q;}}if(best)rows.push({inst:best,score});}rows.sort((a,b)=>b.score-a.score);const show=rows.slice(0,160);showModal(`<div class="bc-boss-picker"><small>BOSS-LOADOUT · ${slot===0?"HAUPTKARTE":`SUPPORT ${slot}`}</small><h2>👹 Karte wählen</h2><p>Hauptkarte zählt zu 100 %, Supportkarten zu je 25 %. Laufende Expeditionen und kaputte/gelistete Karten werden nicht angeboten.</p><div class="bc-feature-picker-grid">${show.map(row=>{const m=cardMeta(row.inst),stats=combatStats(row.inst);return `<button data-bc-boss-pick="${row.inst.id}" data-bc-boss-slot="${slot}" class="${m.className}"><span>${m.icon}</span><div><b>${esc(m.name)}</b><small>${fusionLabel(row.inst)} · ⚔ ${fmt(stats.power)} · ${setMembershipIds(row.inst).map(id=>SET_BY_ID[id]?.name).filter(Boolean).join(" + ")||"kein Set"}</small></div><em>Wählen</em></button>`}).join("")||`<div class="bc-empty-state"><span>👹</span><h3>Keine freie Karte</h3></div>`}</div></div>`);}
  function setBossCard(slot,id){slot=clamp(Math.floor(Number(slot)||0),0,2);const inst=instance(id);if(!bossCardEligible(inst))return toast("Diese Karte ist nicht für den Boss verfügbar.");for(let i=0;i<3;i++)if(i!==slot&&S.bossLoadout[i]===id)S.bossLoadout[i]=null;S.bossLoadout[slot]=id;persist();closeModal();UI.tab="boss";refresh(false);}
  async function autoBossTeam(){if(UI.bossTeamLoading)return;UI.bossTeamLoading=true;const btn=UI.overlay?.querySelector("[data-bc-boss-auto]");if(btn){btn.disabled=true;btn.textContent="Team wird gesucht …";}try{const best=[];let i=0;for(const inst of Object.values(S.instances||{})){i++;if(!bossCardEligible(inst))continue;const score=bossQuickScore(inst);if(best.length<24){best.push({inst,score});best.sort((a,b)=>b.score-a.score);}else if(score>best.at(-1).score){best[best.length-1]={inst,score};best.sort((a,b)=>b.score-a.score);}if(i%800===0)await new Promise(r=>setTimeout(r,0));}const exact=best.map(x=>({inst:x.inst,score:combatStats(x.inst).power*fusionBossMultiplier(x.inst)})).sort((a,b)=>b.score-a.score).slice(0,3);S.bossLoadout=[exact[0]?.inst.id||null,exact[1]?.inst.id||null,exact[2]?.inst.id||null];ensureBossDaily();persist();refresh(false);toast("👹 Bestes verfügbares Boss-Team gesetzt.",3000);}finally{UI.bossTeamLoading=false;}}
  async function ensureBossRemote(){const fb=await firebase(),u=await currentUser();if(!fb||!u)return null;const def=bossDefinition(),ref=fb.doc(fb.db,WEEKLY_BOSS_COLLECTION,def.weekKey);try{const snap=await fb.getDoc(ref);if(!snap.exists()){const row={weekKey:def.weekKey,bossId:def.id,name:def.name,icon:def.icon,tags:def.tags,theme:def.theme,maxHp:def.maxHp,globalDamage:0,attackCount:0,lastDamage:0,lastAttackerUid:"",createdAtMs:now(),updatedAtMs:now()};await fb.setDoc(ref,row);return row;}return snap.data();}catch(e){console.warn("BigCards boss init",e);return null;}}
  async function loadWeeklyBoss(show=false){if(UI.bossLoading)return;UI.bossLoading=true;try{const fb=await firebase(),u=await currentUser();if(!fb||!u){if(show)toast("Online-Verbindung für den Community-Boss nicht verfügbar.");return;}const root=await ensureBossRemote();UI.boss=root;try{const def=bossDefinition(),q=fb.query(fb.collection(fb.db,WEEKLY_BOSS_COLLECTION,def.weekKey,"players"),fb.orderBy("contribution","desc"),fb.limit(50)),snap=await fb.getDocs(q);UI.bossPlayers=snap.docs.map(d=>d.data());try{const ownSnap=await fb.getDoc(fb.doc(fb.db,WEEKLY_BOSS_COLLECTION,def.weekKey,"players",u.uid));if(ownSnap.exists()&&reconcileBossDailyRemote(ownSnap.data()))writeLocalState(cloudUid||u.uid);}catch(ownErr){console.warn("Boss daily ledger",ownErr);}}catch(e){console.warn("Boss leaderboard",e);UI.bossPlayers=[];}if(UI.tab==="boss")refresh(false);if(show)toast("Boss-Daten aktualisiert.");}finally{UI.bossLoading=false;}}
  async function syncBossPlayerState(){const fb=await firebase(),u=await currentUser();if(!fb||!u)return;const w=ensureBossWeek(),def=bossDefinition(),daily=ensureBossDaily();try{await fb.setDoc(fb.doc(fb.db,WEEKLY_BOSS_COLLECTION,def.weekKey,"players",u.uid),{uid:u.uid,displayName:await displayName(),contribution:Math.floor(w.contribution||0),attacks:Math.floor(w.attacks||0),goal:Math.floor(w.goal||0),dailyDay:daily.day,dailyFreeUsed:daily.freeUsed,dailyBonusUsed:daily.bonusUsed,dailyPackBonusEarned:!!daily.packBonusEarned,dailyBattleBonusEarned:!!daily.battleBonusEarned,dailyPackProgress:daily.packProgress,dailyBattleProgress:daily.battleProgress,updatedAtMs:now()},{merge:true});}catch(e){console.warn("Boss player sync",e);}}
  async function syncWeeklyBossAttackRemote(team,raw,w){
    const fb=await firebase(),u=await currentUser();if(!fb||!u)throw new Error("Boss-Online-Sync nicht verfügbar.");
    const def=team.def,rootRef=fb.doc(fb.db,WEEKLY_BOSS_COLLECTION,def.weekKey),playerRef=fb.doc(fb.db,WEEKLY_BOSS_COLLECTION,def.weekKey,"players",u.uid),playerName=await displayName();
    let finalContribution=Math.max(0,Math.floor(Number(w.contribution)||0)),finalAttacks=Math.max(0,Math.floor(Number(w.attacks)||0));
    await fb.runTransaction(fb.db,async tx=>{
      const rootSnap=await tx.get(rootRef),playerSnap=await tx.get(playerRef),oldRoot=rootSnap.exists()?rootSnap.data():{globalDamage:0,attackCount:0},oldPlayer=playerSnap.exists()?playerSnap.data():{contribution:0,attacks:0};
      const remoteContribution=Math.max(0,Math.floor(Number(oldPlayer.contribution)||0)),remoteAttacks=Math.max(0,Math.floor(Number(oldPlayer.attacks)||0));
      finalContribution=Math.max(finalContribution,remoteContribution+raw);
      finalAttacks=Math.max(finalAttacks,remoteAttacks+1);
      const damageDelta=Math.max(raw,finalContribution-remoteContribution),attackDelta=Math.max(1,finalAttacks-remoteAttacks),globalDamage=Math.max(0,Number(oldRoot.globalDamage)||0)+damageDelta,attackCount=Math.max(0,Math.floor(Number(oldRoot.attackCount)||0)+attackDelta),stamp=now();
      if(rootSnap.exists())tx.update(rootRef,{globalDamage,attackCount,lastDamage:raw,lastAttackerUid:u.uid,updatedAtMs:stamp});
      else tx.set(rootRef,{weekKey:def.weekKey,bossId:def.id,name:def.name,icon:def.icon,tags:def.tags,theme:def.theme,maxHp:def.maxHp,globalDamage,attackCount,lastDamage:raw,lastAttackerUid:u.uid,createdAtMs:stamp,updatedAtMs:stamp});
      const daily=ensureBossDaily();
      tx.set(playerRef,{uid:u.uid,displayName:playerName,contribution:finalContribution,attacks:finalAttacks,goal:Math.floor(w.goal||0),dailyDay:daily.day,dailyFreeUsed:daily.freeUsed,dailyBonusUsed:daily.bonusUsed,dailyPackBonusEarned:!!daily.packBonusEarned,dailyBattleBonusEarned:!!daily.battleBonusEarned,dailyPackProgress:daily.packProgress,dailyBattleProgress:daily.battleProgress,updatedAtMs:stamp},{merge:true});
    });
    w.contribution=finalContribution;w.attacks=finalAttacks;return true;
  }
  async function attackWeeklyBoss(){
    const team=bossTeamStats(),main=team.cards[0];if(!main)return toast("Wähle zuerst eine Hauptkarte für den Boss.");if(bossAvailableAttacks()<1)return toast("Heute sind alle 3 Gratis-Angriffe und maximal 2 Bonus-Angriffe verbraucht.");
    const dailyBefore={...ensureBossDaily()},w=ensureBossWeek(),oldContribution=Math.max(0,Number(w.contribution)||0),oldAttacks=Math.max(0,Math.floor(Number(w.attacks)||0)),oldGoal=Math.max(0,Number(w.goal)||0);
    if(!bossConsumeAttack())return;
    const raw=Math.max(1,Math.round(team.total*100*(.92+Math.random()*.16)));if(!w.goal)w.goal=Math.max(10000,Math.round(team.total*100*15));w.contribution=oldContribution+raw;w.attacks=oldAttacks+1;
    let synced=false,lastError=null;
    for(let attempt=0;attempt<2&&!synced;attempt++){try{await syncWeeklyBossAttackRemote(team,raw,w);synced=true;}catch(e){lastError=e;console.warn(`Boss attack sync Versuch ${attempt+1}`,e);if(attempt===0)await new Promise(r=>setTimeout(r,500));}}
    if(!synced){
      w.contribution=oldContribution;w.attacks=oldAttacks;w.goal=oldGoal;S.bossDaily={...dailyBefore};writeBossDailyShadow(S.bossDaily);persist();refresh(false);
      toast("Boss-Angriff NICHT verbraucht: Community-Sync konnte nicht online gespeichert werden.",5200);return;
    }
    setMissionRecord("boss",team.cards.flatMap(x=>x?setMembershipIds(x):[]),raw);for(const inst of team.cards)if(inst)addSetMastery(setMembershipIds(inst),6);persist();await loadWeeklyBoss(false);const def=team.def;
    showModal(`<div class="bc-boss-result"><small>GEWERTETER BOSS-ANGRIFF · ☁ LIVE-SYNC ✓</small><h2>${def.icon} ${fmt(raw)} Schaden</h2><p><b>Community-Sync sofort online gespeichert.</b> Frühere lokal vorgemerkte Boss-Schäden dieses Wochenstands werden beim ersten erfolgreichen V413-Sync automatisch nachgezogen.</p><p>Hauptkarte ${esc(cardMeta(main).name)} · Team-Power ${fmt(team.total)}.</p><div class="bc-boss-bonus-row"><span>Set-/Tag-Bonus <b>+${Math.round(team.tagBonus*100)} %</b></span><span>Set-Fortschritt <b>+${Math.round(team.setBonus*100)} %</b></span><span>Premium-Signature <b>+${Math.round(team.premiumBonus*100)} %</b></span><span>${team.phase.icon} ${team.phase.name} <b>${team.phase.damageMult>=1?"+":""}${Math.round((team.phase.damageMult-1)*100)} %</b></span>${team.jkMult>1?`<span>◆ JK-Teamboost <b>×${team.jkMult}</b></span>`:""}</div><p>Heute verbleiben <b>${bossAvailableAttacks()}</b> gewertete Angriffe.</p><button class="bc-primary" data-bc-modal-close>Weiter</button></div>`);
  }
  function bossMilestoneRows(){const w=ensureBossWeek(),goal=Math.max(1,Number(w.goal)||bossTeamStats().total*100*15||1);return [{id:"join",name:"Teilnahme",target:1,type:"attacks",reward:"10 Token + 30 Staub"},{id:"bronze",name:"Bronze",target:.25,reward:"25 Token + Aura-Material"},{id:"silver",name:"Silber",target:.60,reward:"45 Token + 100 Staub"},{id:"gold",name:"Gold",target:1,reward:"75 Token + Katalysator-Chance"},{id:"master",name:"Meister",target:1.5,reward:"110 Token + Kosmetik"}].map(x=>({...x,goal,targetValue:x.type==="attacks"?1:goal*x.target,current:x.type==="attacks"?w.attacks:w.contribution,ready:x.type==="attacks"?w.attacks>=1:w.contribution>=goal*x.target,claimed:!!w.milestones[x.id]}));}
  function claimBossMilestone(id){const row=bossMilestoneRows().find(x=>x.id===id),w=ensureBossWeek();if(!row||!row.ready||row.claimed)return;w.milestones[id]=true;const rewards={join:[10,30,0,0],bronze:[25,40,20,0],silver:[45,100,15,0],gold:[75,140,30,1],master:[110,180,40,0]}[id]||[0,0,0,0];const prestige=ultimateSetMultiplier();S.bossTokens+=rewards[0]*prestige;S.fusionDust+=rewards[1]*prestige;S.auraMaterial+=rewards[2]*prestige;if(rewards[3]&&Math.random()<.35)S.prismaticCatalysts+=1;if(id==="master")S.cosmeticFragments+=8;if(id==="gold"&&!w.goldCounted){w.goldCounted=true;S.bossQualifiedWeeks=Math.max(0,Math.floor(Number(S.bossQualifiedWeeks)||0)+1);S.bossCosmeticPity=Math.max(0,Math.floor(Number(S.bossCosmeticPity)||0)+1);if(S.bossCosmeticPity>=12){S.cosmeticFragments+=25;S.bossCosmeticPity=0;toast("🎨 Boss-Pity: seltenes Kosmetikpaket garantiert!",5000);}}persist();void syncBossPlayerState();refresh(false);toast(`${row.name} abgeholt · +${rewards[0]*prestige} Boss-Token`,3200);}
  function bossCommunityRows(){const boss=UI.boss||bossDefinition(),max=Math.max(1,Number(boss.maxHp)||bossDefinition().maxHp),damage=Math.max(0,Number(boss.globalDamage)||0),pct=clamp(damage/max,0,1);return [{id:"75",name:"Boss auf 75 %",need:.25,reward:"20 Token"},{id:"50",name:"Boss auf 50 %",need:.50,reward:"30 Token + Staub"},{id:"25",name:"Boss auf 25 %",need:.75,reward:"40 Token + Aura"},{id:"dead",name:"Boss besiegt",need:1,reward:"60 Token + Kosmetik"}].map(x=>({...x,pct,ready:pct>=x.need,claimed:!!S.bossWeek?.community?.[x.id]}));}
  function claimBossCommunity(id){const row=bossCommunityRows().find(x=>x.id===id),w=ensureBossWeek();if(!row?.ready||row.claimed||w.attacks<1)return toast("Community-Belohnung benötigt mindestens einen eigenen Angriff und das erreichte Ziel.");w.community[id]=true;const r={"75":[20,0,0,0],"50":[30,60,0,0],"25":[40,0,30,0],dead:[60,80,30,5]}[id];const prestige=ultimateSetMultiplier();S.bossTokens+=r[0]*prestige;S.fusionDust+=r[1]*prestige;S.auraMaterial+=r[2]*prestige;S.cosmeticFragments+=r[3]*prestige;persist();refresh(false);}
  function buyBossShop(id){const items={dust:{cost:25,label:"120 Fusionsstaub"},aura:{cost:20,label:"40 Aura-Material"},cosmetic:{cost:45,label:"5 Kosmetikfragmente"},pack:{cost:35,label:"10 Pack-Fragmente"}};const item=items[id];if(!item)return;if(S.bossTokens<item.cost)return toast("Nicht genügend Boss-Token.");S.bossTokens-=item.cost;if(id==="dust")S.fusionDust+=120;else if(id==="aura")S.auraMaterial+=40;else if(id==="cosmetic")S.cosmeticFragments+=5;else S.packFragments+=10;persist();refresh(false);toast(`${item.label} gekauft.`);}
  function bossHtml(){ensureBossDaily();ensureBossWeek();const root=UI.boss||bossDefinition(),max=Math.max(1,Number(root.maxHp)||bossDefinition().maxHp),damage=Math.max(0,Number(root.globalDamage)||0),hp=Math.max(0,max-damage),pct=clamp(hp/max*100,0,100),team=bossTeamStats(),cards=team.cards,attacks=bossAvailableAttacks(),daily=ensureBossDaily(),milestones=bossMilestoneRows(),community=bossCommunityRows();return `<section class="bc-section bc-weekly-boss"><div class="bc-section-title"><div><small>WÖCHENTLICHER COMMUNITY-BOSS · ${esc(bossDefinition().weekKey)}</small><h2>${esc(root.icon||bossDefinition().icon)} ${esc(root.name||bossDefinition().name)}</h2><p>Montag–Sonntag. Alle angemeldeten Spieler greifen denselben Online-Boss an. Hauptbelohnungen sind persönliche Ziele und Community-Meilensteine.</p></div><div class="bc-section-title-actions"><button class="bc-info-circle" data-bc-section-info="boss" title="Wochenboss-Info">i</button><button data-bc-boss-refresh>Online aktualisieren</button></div></div><div class="bc-boss-health"><div><span style="width:${pct}%"></span></div><b>${fmt(hp)} / ${fmt(max)} HP</b><small>${(root.tags||bossDefinition().tags).map(x=>SET_BY_ID[x]?`${SET_BY_ID[x].icon} ${SET_BY_ID[x].name}`:x).join(" · ")} · ${esc(root.theme||bossDefinition().theme)} · ${bossPhase(root).icon} ${bossPhase(root).name}</small></div><div class="bc-boss-layout"><section class="bc-boss-team"><header><div><small>DEIN 3-KARTEN-LOADOUT</small><h3>Team-Power ${fmt(team.total)}</h3></div><button data-bc-boss-auto>⚡ Bestes Boss-Team</button></header><div class="bc-boss-slots">${[0,1,2].map(i=>{const inst=cards[i],m=inst?cardMeta(inst):null;return `<button data-bc-boss-slot="${i}" class="${m?m.className:"empty"}"><span>${m?m.icon:i===0?"⚔️":"🛡️"}</span><b>${m?esc(m.name):i===0?"Hauptkarte wählen":"Supportkarte wählen"}</b><small>${m?`${fusionLabel(inst)} · ⚔ ${fmt(combatStats(inst).power)} · ${i===0?"100 %":"25 %"}`:i===0?"Pflichtslot":"Optional"}</small></button>`}).join("")}</div><div class="bc-boss-bonus-row"><span>Boss-Tags <b>+${Math.round(team.tagBonus*100)}%</b></span><span>Set-Boni <b>+${Math.round(team.setBonus*100)}%</b></span><span>EX/VIP <b>+${Math.round(team.premiumBonus*100)}%</b></span><span>${team.phase.icon} Phase <b>${team.phase.damageMult>=1?"+":""}${Math.round((team.phase.damageMult-1)*100)}%</b></span></div><button class="bc-boss-attack" data-bc-boss-attack ${!cards[0]||attacks<1?"disabled":""}>${root.globalDamage>=max?"Boss besiegt":`⚔ Angriff starten · ${attacks} heute übrig`}</button><p class="bc-boss-ticket-note">3 Gratis-Angriffe/Tag · maximal 2 Bonus-Angriffe/Tag: 1× durch 5 Packs (${daily.packBonusEarned?"✓":`${daily.packProgress}/5`}) + 1× durch einen Kartenkampf-Sieg (${daily.battleBonusEarned?"✓":"offen"}). Bereits verbrauchte Bonus-Angriffe kommen heute nicht erneut zurück.</p></section><section class="bc-boss-personal"><small>PERSÖNLICHER WOCHENBEITRAG</small><h3>${fmt(S.bossWeek.contribution)} Schaden</h3><p>Ziel wird beim ersten Angriff aus deiner eigenen Boss-Power eingefroren. So kann auch ein neuer Spieler Gold erreichen.</p>${milestones.map(x=>`<div class="bc-boss-milestone ${x.ready?"ready":""}"><span><b>${x.name}</b><small>${fmt(Math.min(x.current,x.targetValue))} / ${fmt(x.targetValue)} · ${x.reward}</small></span>${x.claimed?"<em>✓</em>":`<button data-bc-boss-milestone="${x.id}" ${x.ready?"":"disabled"}>Holen</button>`}</div>`).join("")}</section></div><div class="bc-boss-community"><h3>Community-Ziele</h3>${community.map(x=>`<article class="${x.ready?"ready":""}"><b>${x.name}</b><small>${x.reward}</small>${x.claimed?"<em>✓ geholt</em>":`<button data-bc-boss-community="${x.id}" ${x.ready&&S.bossWeek.attacks>0?"":"disabled"}>Holen</button>`}</article>`).join("")}</div><div class="bc-boss-bottom"><section><h3>🏆 Wochen-Rangliste</h3><div class="bc-boss-leaderboard">${UI.bossPlayers.length?UI.bossPlayers.slice(0,10).map((p,i)=>`<div><b>#${i+1} ${esc(p.displayName||"Spieler")}</b><span>${fmt(p.contribution||0)}</span></div>`).join(""):`<p>Noch keine Online-Beiträge geladen.</p>`}</div></section><section><h3>🪙 Boss-Shop · ${fmt(S.bossTokens)} Token</h3><div class="bc-boss-shop"><button data-bc-boss-shop="dust">🧪 120 Staub <b>25</b></button><button data-bc-boss-shop="aura">✦ 40 Aura <b>20</b></button><button data-bc-boss-shop="cosmetic">🎨 5 Fragmente <b>45</b></button><button data-bc-boss-shop="pack">🎴 10 Pack-Fragmente <b>35</b></button></div><small>Boss-Pity Kosmetik: ${S.bossCosmeticPity}/12 qualifizierte Gold-Wochen.</small></section></div></section>`;}

  function setRequirementRowHtml(req){const meta=setRequirementMeta(req),rare=meta.rarityValue<=.1||req.kind==="hyper"||req.kind==="exclusive"||req.kind==="win"||req.kind==="vip";return `<article class="${req.owned?"owned":"missing"} ${meta.className}"><span>${req.owned?"✓":"?"}</span><div><b>${esc(meta.name)}</b><small>${esc(meta.label)}${rare?" · 💎 Sammler-Rarität":""}</small></div><em>${req.owned?"BESITZT":"FEHLT"}</em></article>`;}
  function setDetailHtml(selected,weekly){
    const progress=setProgress(selected.id),mastery=setMasteryLevel(selected.id),unlocks=setMasteryUnlocks(selected.id),active=progress.activeTarget||5,full=progress.fullTarget||progress.total,isCrazy=selected.group==="crazy";
    if(selected.id==="hyper")return `<div class="bc-set-main normal hyper-set"><section class="bc-set-book"><header><span>⚡</span><div><small>HYPER SET · NUR HYPER-KARTEN</small><h3>Hyper Set · ${progress.owned}/${progress.total}</h3></div></header><div class="bc-set-requirements">${progress.requirements.map(setRequirementRowHtml).join("")}</div></section><section class="bc-set-bonuses"><h3>Reine Kampf-Set-Stufen</h3><article class="${progress.owned>=3?"done":""}"><b>3/16 · Hyper-Verbund I</b><span>+3 % Schaden & Leben für alle Hyper-Karten.</span></article><article class="${progress.owned>=5?"done":""}"><b>5/16 · Hyper-Verbund II</b><span>+6 % Schaden & Leben für alle Hyper-Karten.</span></article><article class="${progress.owned>=10?"done":""}"><b>10/16 · Hyper-Verbund III</b><span>+10 % Schaden & Leben für alle Hyper-Karten.</span></article><article class="${progress.owned>=16?"done":""}"><b>16/16 · Hyper-Meisterschaft</b><span>+15 % Schaden & Leben · Hyper-Kernchance im Pack steigt von 5 % auf 7 %.</span></article><p><b>Keine Wirtschaftsverstärkung:</b> Dieses Set erhöht bewusst weder Points/s noch XP/s. Hyper bleibt ein reines Kampf-Endgame.</p><h3>Set-Mastery · Lv ${mastery}/100</h3><div class="bc-set-mastery"><span style="width:${mastery}%"></span></div><small>${fmt(setMasteryXp(selected.id))} Set-XP · Freigeschaltet: ${unlocks.join(" · ")||"noch keine Prestige-Meilensteine"}</small></section></div>`;
    return `<div class="bc-set-main ${isCrazy?"crazy":"normal"}"><section class="bc-set-book"><header><span>${selected.icon}</span><div><small>${weekly.setId===selected.id?"⭐ DIESES WOCHEN-SET":isCrazy?"CRAZY SET · SPECIAL BIS GÖTTLICH + PREMIUM":"SET-BUCH"}</small><h3>${esc(selected.name)} Set · ${progress.owned}/${progress.total}</h3></div></header><div class="bc-set-requirements">${progress.requirements.map(setRequirementRowHtml).join("")}</div></section><section class="bc-set-bonuses"><h3>Set-Stufen</h3><article class="${progress.owned>=3?"done":""}"><b>3/${full} · Set entdeckt</b><span>+1 % Points auf Karten dieses Sets · Badge</span></article><article class="${progress.owned>=active?"done":""}"><b>${active}/${full} · Set aktiv</b><span>+2 % Points/Expedition · +2 % Boss-Schaden</span></article><article class="${progress.owned>=full?"done":""}"><b>${full}/${full} · Set vollständig</b><span>+4 % Points/Boss · +5 % Set-Materialchance · animiertes Prestige</span></article><p>${isCrazy?"Crazy Sets sind bewusst schwer: Sie verlangen Karten ab Special bis Göttlich plus Exclusive-, Wins- und VIP-Karten. ":""}Set-Boni bleiben gedeckelt: max. +8 % Points auf eine Karte und max. +10 % Boss-Setbonus.</p><h3>Set-Mastery · Lv ${mastery}/100</h3><div class="bc-set-mastery"><span style="width:${mastery}%"></span></div><small>${fmt(setMasteryXp(selected.id))} Set-XP · Freigeschaltet: ${unlocks.join(" · ")||"noch keine Prestige-Meilensteine"}</small></section></div>`;
  }
  function showUltimateSetInfo(){
    showModal(`<div class="bc-ultimate-info"><small>💠 HÖCHSTES SAMMLERZIEL</small><h2>Exklusivität</h2><p>Dieses eigenständige Set verlangt die jeweils seltenste Schlusskarte jeder normalen Rarität von <b>Gewöhnlich bis Göttlich</b> – jeweils die 0,1-%-Karte – plus die seltenste <b>Exclusive (0,01 %)</b>, die seltenste <b>Wins-Karte (0,01 %)</b> und die seltenste <b>VIP-Karte (0,001 %)</b>.</p><div class="bc-ultimate-info-reward"><b>Einmalige Abschlussbelohnung</b><span>◆ 5.000 JK/Coin</span><span>∞ permanenter ×2 Prestige-Boost</span></div><p>Der permanente ×2-Boost wirkt auf deine BigCards-Kernfortschritte: Kartenproduktion/erspielte Points, XP, Wins, Kampf-Schaden und Kampf-Leben sowie zentrale Materialbelohnungen. <b>Kosten, Marktpreise und JK/Coin-Ausgaben werden nicht verdoppelt.</b></p><p>Nach dem Abholen bleibt der Bonus dauerhaft auf deinem BigCards-Account gespeichert und kann nur einmal eingelöst werden.</p><button class="bc-primary" data-bc-modal-close>Verstanden</button></div>`);
  }
  async function claimUltimateSetReward(){
    const progress=ultimateSetProgress();
    if(S.ultimateSetClaimed)return toast("💠 Exklusivität: Dein permanenter ×2-Bonus ist bereits aktiv.",4200);
    if(!progress.complete)return toast(`Exklusivität noch nicht vollständig · ${progress.owned}/${progress.total} Karten.`,3800);
    if(!window.JKCoinApp?.credit)return toast("JK/Coin-System ist noch nicht bereit. Bitte kurz warten und erneut versuchen.",4200);
    const ok=await gameConfirm({title:"Exklusivität abschließen",message:`Du hast alle ${progress.total} extrem seltenen Zielkarten gefunden.\n\nJetzt einmalig abholen:\n• 5.000 JK/Coin\n• permanenter ×2 BigCards-Prestige-Boost\n\nDiese Belohnung kann nur einmal eingelöst werden.`,confirmText:"5.000 JK/Coin + ×2 dauerhaft abholen",icon:"💠"});
    if(!ok)return;
    S.ultimateSetClaimed=true;S.ultimateSetClaimedAt=now();
    const credited=window.JKCoinApp.credit(5000,"BigCards Exklusivität-Set vollständig","bigcards-exclusivity-set");
    if(!credited){S.ultimateSetClaimed=false;S.ultimateSetClaimedAt=0;persist();return toast("JK/Coin konnte nicht gutgeschrieben werden. Belohnung wurde nicht als abgeholt markiert.",5000);}
    invalidateCardPowerCache();persist();try{window.JKCoinApp.syncProfileBalance?.().catch?.(()=>{});}catch{}refresh(false);toast("💠 EXKLUSIVITÄT VOLLSTÄNDIG · +5.000 JK/Coin · permanenter ×2-Bonus AKTIV!",6500);
  }
  function setsHtml(){
    if(UI.setSelected==="ocean"||!SET_BY_ID[UI.setSelected])UI.setSelected="hyper";const weekly=ensureSetWeekly(),score=totalSetCollectionScore(),ultimate=score.ultimate,selected=SET_BY_ID[UI.setSelected]||SET_BY_ID.hyper||SET_BLUEPRINTS[0],missionBossTarget=Math.max(5000,Math.floor((Number(S.bossWeek?.goal)||50000)*.25));
    const ultimateRows=ultimate.requirements.map(setRequirementRowHtml).join("");
    const ultimateAction=S.ultimateSetClaimed?`<button class="bc-ultimate-claim claimed" disabled>✓ PERMANENTER ×2-BONUS AKTIV</button>`:ultimate.complete?`<button class="bc-ultimate-claim ready" data-bc-ultimate-claim>◆ 5.000 JK/Coin + ×2 DAUERHAFT ABHOLEN</button>`:`<button class="bc-ultimate-claim" disabled>Noch ${ultimate.total-ultimate.owned} extrem seltene Karte${ultimate.total-ultimate.owned===1?"":"n"}</button>`;
    const normalTabs=SET_BLUEPRINTS.map(set=>{const p=setProgress(set.id);return `<button data-bc-set-select="${set.id}" class="${selected.id===set.id?"active":""}"><span>${set.icon}</span><b>${esc(set.name)}</b><small>${p.owned}/${p.total}</small></button>`}).join("");
    const crazyTabs=CRAZY_SET_BLUEPRINTS.map(set=>{const p=setProgress(set.id);return `<button data-bc-set-select="${set.id}" class="${selected.id===set.id?"active":""}"><span>${set.icon}</span><b>${esc(set.name)}</b><small>${p.owned}/${p.total}</small></button>`}).join("");
    return `<section class="bc-section bc-sets"><div class="bc-section-title"><div><small>SET-SAMMLUNGEN · NORMAL + CRAZY + EXKLUSIVITÄT</small><h2>🧩 Set-Sammlungen</h2><p>20 normale Sets, 10 schwere Crazy Sets und ganz oben das ultimative Exklusivitäts-Set. Kategorien lassen sich auf- und zuklappen, damit die Seite auch am Handy aufgeräumt bleibt.</p></div><button class="bc-info-circle" data-bc-section-info="sets" title="Set-Info">i</button><div class="bc-set-overview-score"><small>GESAMT-SET-SCORE</small><b>${score.percent}%</b><span>${score.owned}/${score.total} Set-Kartenplätze</span><i><u style="width:${score.percent}%"></u></i></div></div>
      <section class="bc-ultimate-set ${ultimate.complete?"complete":""} ${S.ultimateSetClaimed?"claimed":""}"><button class="bc-shop-info bc-ultimate-info-btn" data-bc-ultimate-info title="Info zum Exklusivitäts-Set" aria-label="Info zum Exklusivitäts-Set">i</button><header><div class="bc-ultimate-gem">💠</div><div><small>ÜBER ALLEN SETS</small><h2>EXKLUSIVITÄT</h2><p>Die seltenste Karte jeder Raritätswelt: 13× 0,1 % + Exclusive 0,01 % + Wins 0,01 % + VIP 0,001 %.</p></div><strong>${ultimate.percent}%</strong></header><div class="bc-ultimate-progress"><i><u style="width:${ultimate.percent}%"></u></i><b>${ultimate.owned}/${ultimate.total} gefunden</b></div><div class="bc-ultimate-reqs">${ultimateRows}</div><div class="bc-ultimate-reward"><span>◆ <b>5.000 JK/Coin</b> einmalig</span><span>∞ <b>×2 dauerhaft</b> auf BigCards-Kernfortschritt</span>${ultimateAction}</div></section>
      <div class="bc-set-group-actions"><button data-bc-set-toggle="normal" class="${UI.setNormalOpen?"active":""}"><span>🧩</span><b>Normale Sets</b><small>20 Sets · ${score.normalOwned}/${score.normalTotal}</small><em>${UI.setNormalOpen?"▲":"▼"}</em></button><button data-bc-set-toggle="crazy" class="crazy ${UI.setCrazyOpen?"active":""}"><span>🔥</span><b>Crazy Sets</b><small>10 Sets · Special–Göttlich + EX/Wins/VIP · ${score.crazyOwned}/${score.crazyTotal}</small><em>${UI.setCrazyOpen?"▲":"▼"}</em></button></div>
      ${UI.setNormalOpen?`<section class="bc-set-group normal"><div class="bc-set-group-head"><div><small>NORMALE SETS</small><h3>20 Sammlungen mit gemischten Raritäten</h3></div><span>${score.normalOwned}/${score.normalTotal}</span></div><div class="bc-set-tabs">${normalTabs}</div>${selected.group==="normal"?setDetailHtml(selected,weekly):""}</section>`:""}
      ${UI.setCrazyOpen?`<section class="bc-set-group crazy"><div class="bc-set-group-head"><div><small>CRAZY SETS</small><h3>Schwere Endgame-Sets</h3><p>Jedes Crazy Set verlangt normale Karten ab Special bis Göttlich und zusätzlich Premium-Karten aus Exclusive, Wins und VIP.</p></div><span>${score.crazyOwned}/${score.crazyTotal}</span></div><div class="bc-set-tabs crazy">${crazyTabs}</div>${selected.group==="crazy"?setDetailHtml(selected,weekly):""}</section>`:""}
      <section class="bc-set-weekly"><div><small>WÖCHENTLICHE SET-MISSIONEN · ${SET_BY_ID[weekly.setId]?.icon} ${SET_BY_ID[weekly.setId]?.name}</small><h3>Diese Woche zählt ein rotierendes normales Set</h3></div>${[{id:"expedition",label:"3 Set-Expeditionen",v:weekly.expeditions,t:3},{id:"boss",label:"Boss-Schaden mit Set-Karten",v:weekly.bossDamage,t:missionBossTarget},{id:"upgrade",label:"2 Set-Karten verbessern",v:weekly.upgrades,t:2}].map(q=>`<article><span><b>${q.label}</b><small>${fmt(Math.min(q.v,q.t))} / ${fmt(q.t)} · Set-XP + Material</small></span>${weekly.claimed[q.id]?"<em>✓</em>":`<button data-bc-set-mission="${q.id}" ${q.v>=q.t?"":"disabled"}>Holen</button>`}</article>`).join("")}</section></section>`;
  }

  function marketMerchantSeed(bucket){let x=(Math.floor(Number(bucket)||0)^0x9e3779b9)>>>0;return x||0x6d2b79f5;}
  function marketMerchantRng(seed){let a=(Number(seed)||1)>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
  function marketMerchantRarity(rng){const x=rng();if(x<.52)return 0;if(x<.78)return 1;if(x<.92)return 2;if(x<.975)return 3;if(x<.993)return 4;if(x<.9985)return 5;if(x<.9995)return 6;if(x<.99982)return 7;if(x<.99993)return 8;if(x<.999975)return 9;if(x<.999992)return 10;if(x<.999998)return 11;return 12;}
  function marketWeightedBase(rng){let roll=rng()*INTERNAL_WEIGHT_SUM;for(let i=0;i<INTERNAL_VALUES.length;i++){roll-=INTERNAL_VALUES[i];if(roll<=0)return i;}return INTERNAL_VALUES.length-1;}
  function marketBossCandidate(rarity,rng){const tags=bossDefinition().tags||[],rows=[];for(const tag of tags){const set=SET_BY_ID[tag];if(!set)continue;for(const req of set.requirements||[]){if(req.kind!=="normal"||Math.floor(Number(req.rarity)||0)!==rarity)continue;if(rarityValue(req.base)<2)continue;rows.push(req.base);}}return rows.length?rows[Math.floor(rng()*rows.length)]:null;}
  function marketMerchantBase(rarity,rng){if(rng()<.22){const bossBase=marketBossCandidate(rarity,rng);if(bossBase!=null)return bossBase;}return marketWeightedBase(rng);}
  function marketRoundPrice(value){const n=Math.max(1,Number(value)||1),step=n>=1e12?1e9:n>=1e10?1e7:n>=1e8?1e5:n>=1e6?1000:n>=1e4?100:10;return Math.max(step,Math.round(n/step)*step);}
  function marketMerchantCard(rarity,base){const rv=rarityValue(base),scarcity=clamp(1-(Math.max(.1,rv)-.1)/99.9,0,1),points=Math.max(1,cardBasePointProduction(rarity,base)),xp=Math.max(.1,cardBaseXpProduction(rarity,base)),range=COMBAT_RANGES[rarity]||COMBAT_RANGES[0],quality=.90+scarcity*.20,min=Math.max(1,Math.floor(range.min*quality)),max=Math.max(min+1,Math.ceil(range.max*quality)),avg=(min+max)/2,hp=Math.max(45,Math.round(avg*5.5+(rarity+1)*35)),power=Math.max(1,Math.round(avg+hp*.16));return {name:BASE_NAMES[base],rarity,base,rarityValue:rv,level:1,cardRebirth:0,rank:0,rankMastery:0,rankEliteWins:0,rankWins:0,rankedAt:0,aura:null,combatAura:null,bind:null,shiny:0,fusion:"normal",sets:[],battlePotions:[],battlePotion:null,win:false,winId:null,winPack:null,vip:false,vipId:null,exclusive:false,exclusiveId:null,basePower:null,points:Math.floor(points),xp:Math.floor(xp),combatPower:power,combatMin:min,combatMax:max};}
  function marketMerchantPrice(card,rng){const rarity=clamp(Math.floor(Number(card?.rarity)||0),0,12),r=RARITIES[rarity]||RARITIES[0],rv=Math.max(.1,Number(card?.rarityValue)||100),scarcity=rv<=.1?6500:rv<=.2?4200:rv<=.5?2200:rv<=1?900:rv<=2?250:rv<=5?90:rv<=10?35:rv<=25?12:rv<=50?4.5:2,rarityMarkup=1+rarity*.75,highTier=rarity>=5?1.6:1,bossTags=new Set(bossDefinition().tags||[]),setIds=(SET_MEMBERSHIP.get(setRequirementKey({kind:"normal",rarity,base:card.base}))||[]),bossDemand=setIds.some(id=>bossTags.has(id))?1.25:1,base=Math.max(1000,r.price*.75,Number(card.points||0)*30),raw=base*scarcity*rarityMarkup*highTier*bossDemand*(.90+rng()*.35);return marketRoundPrice(raw);}
  function marketMerchantListings(at=now()){const bucket=Math.floor(Number(at)/MARKET_MERCHANT_REFRESH_MS),rng=marketMerchantRng(marketMerchantSeed(bucket)),count=MARKET_MERCHANT_MIN_LISTINGS+Math.floor(rng()*(MARKET_MERCHANT_MAX_LISTINGS-MARKET_MERCHANT_MIN_LISTINGS+1)),rows=[];for(let i=0;i<count;i++){const id=`market-${bucket}-${i}`,already=!!S?.marketMerchantBought?.[id],rarity=marketMerchantRarity(rng),base=marketMerchantBase(rarity,rng),card=marketMerchantCard(rarity,base),price=marketMerchantPrice(card,rng),sellerName=MARKET_MERCHANT_NAMES[Math.floor(rng()*MARKET_MERCHANT_NAMES.length)]||"CardTrader";if(already)continue;rows.push({id,sellerUid:`market-house-${(bucket+i)%97}`,sellerName,status:"active",price,feeRate:0,cardKey:marketCardKeyFromCard(card),card,createdAtMs:bucket*MARKET_MERCHANT_REFRESH_MS+Math.floor(rng()*MARKET_MERCHANT_REFRESH_MS),marketMerchant:true});}return rows;}
  function receiveMarketCard(listing){const c=listing?.card||{},added=addInstance({rarity:c.rarity||0,base:c.base||0,hyper:!!c.hyper,hyperId:c.hyperId||null,hyperGeneration:c.hyperGeneration||1,win:!!c.win,winId:c.winId||null,winPack:c.winPack??null,vip:!!c.vip,vipId:c.vipId||null,exclusive:!!c.exclusive,exclusiveId:c.exclusiveId||null,basePower:c.basePower||null,rarityValue:c.rarityValue||100});added.inst.level=clamp(c.level||1,1,5);added.inst.cardRebirth=clamp(Math.floor(Number(c.cardRebirth)||0),0,CARD_REBIRTH_MAX);{const ckey=collectionKey(added.inst),ccol=cardCollectionMap(added.inst);ccol[ckey]=ccol[ckey]||{firstAt:now(),highestLevel:1};ccol[ckey].highestLevel=Math.max(Number(ccol[ckey].highestLevel)||1,added.inst.cardRebirth>0?5:added.inst.level);}added.inst.rank=clamp(Math.floor(Number(c.rank)||0),0,FEATURED_RANK_MAX);added.inst.rankMastery=Math.max(0,Math.floor(Number(c.rankMastery)||Math.floor(Number(c.rankWins)||0)*4));added.inst.rankEliteWins=Math.max(0,Math.floor(Number(c.rankEliteWins)||0));added.inst.rankWins=0;added.inst.rankedAt=Math.max(0,Number(c.rankedAt)||0);added.inst.aura=c.aura||null;added.inst.combatAura=c.combatAura||null;added.inst.bind=c.bind||null;added.inst.shiny=clamp(c.shiny||0,0,3);added.inst.fusion=["holo","prismatic"].includes(c.fusion)?c.fusion:"normal";added.inst.battlePotions=(Array.isArray(c.battlePotions)?c.battlePotions:(c.battlePotion?[c.battlePotion]:[])).map(x=>normalizePotionQueueEntry(x,added.inst)).filter(Boolean).slice(0,3);added.inst.battlePotion=null;invalidateCardPowerCache();return added.inst;}
  async function buyMarketMerchantListing(listing){if(!listing)return;if(S.points<listing.price)return toast("Nicht genügend Points.");if(!await gameConfirm({title:"Marktkauf bestätigen",message:`${listing.card?.name||"Karte"}\nPreis: ${fmt(listing.price)} Points`,confirmText:`Für ${fmt(listing.price)} Points kaufen`,icon:"🏪",tone:"points"}))return;S.points-=listing.price;receiveMarketCard(listing);S.marketMerchantBought=S.marketMerchantBought&&typeof S.marketMerchantBought==="object"?S.marketMerchantBought:{};S.marketMerchantBought[listing.id]=now();for(const [key,stamp] of Object.entries(S.marketMerchantBought)){if(Number(stamp)<now()-48*60*60*1000)delete S.marketMerchantBought[key];}UI.market=UI.market.filter(x=>x.id!==listing.id);persist();refresh(false);toast("Karte gekauft.");}

  function marketCardKeyFromCard(c){if(!c)return"unknown";const f=c.fusion==="prismatic"?"prismatic":c.fusion==="holo"?"holo":"normal";if(c.hyper)return `h:${String(c.hyperId||"hyper")}:g${clamp(Math.floor(Number(c.hyperGeneration)||1),1,HYPER_GENERATION_MAX)}:${f}`;if(c.win)return `w:${String(c.winId||"wins")}:${f}`;if(c.vip)return `v:${String(c.vipId||"vip")}:${f}`;if(c.exclusive)return `x:${String(c.exclusiveId||"exclusive")}:${f}`;return `n:${Math.floor(Number(c.rarity)||0)}:${Math.floor(Number(c.base)||0)}:${f}`;}
  function marketCardKeyFromInst(inst){if(!inst)return"unknown";return marketCardKeyFromCard({hyper:!!inst.hyper,hyperId:inst.hyperId,hyperGeneration:hyperGeneration(inst),win:!!inst.win,winId:inst.winId,winPack:inst.winPack,vip:!!inst.vip,vipId:inst.vipId,exclusive:!!inst.exclusive,exclusiveId:inst.exclusiveId,rarity:inst.rarity,base:inst.base,fusion:fusionVariant(inst)});}
  function marketStatsForKey(key){return UI.marketStats?.[key]||null;}
  function marketOwnTopCards(limit=12){const deployed=new Set(S.floors.flat().filter(Boolean)),top=[];for(const inst of Object.values(S.instances||{})){if(!inst||inst.listed||inst.broken||isCardOnExpedition(inst.id)||deployed.has(inst.id)||inst.locked)continue;const value=sellValue(inst),row={inst,value};if(top.length<limit){top.push(row);top.sort((a,b)=>b.value-a.value);}else if(value>top[top.length-1].value){top[top.length-1]=row;top.sort((a,b)=>b.value-a.value);}}return top.map(x=>x.inst);}
  function marketFrequencyFactor(salesCount){return clamp(1-Math.log10(1+Math.max(0,Number(salesCount)||0))*.08,.65,1);}
  function marketReferencePrice(stats){const sales=(stats?.sales||[]).filter(x=>Number(x?.price)>0&&Number(x?.at)>now()-7*86400000).map(x=>Number(x.price)).sort((a,b)=>a-b);if(!sales.length)return Math.max(0,Number(stats?.lastPrice)||0);const trim=sales.length>=8?Math.max(1,Math.floor(sales.length*.1)):0,core=trim?sales.slice(trim,-trim):sales;if(!core.length)return sales[Math.floor(sales.length/2)]||0;const mid=Math.floor(core.length/2);return core.length%2?core[mid]:(core[mid-1]+core[mid])/2;}
  function marketAdjustedReference(stats){const ref=marketReferencePrice(stats);return Math.floor(ref*marketFrequencyFactor(stats?.salesCount||0));}
  function marketTrend(stats){const sales=(stats?.sales||[]).filter(x=>Number(x?.price)>0).slice().sort((a,b)=>Number(a.at)-Number(b.at));if(sales.length<2)return null;const last=Number(sales.at(-1).price),old=Number(sales[0].price);return old>0?(last-old)/old*100:null;}
  async function loadMarketStats(keys=[]){if(UI.marketStatsLoading)return;const wanted=[...new Set((keys||[]).filter(Boolean).map(String))].filter(key=>!UI.marketStats?.[key]).slice(0,50);if(!wanted.length){UI.marketStatsLoaded=true;return;}UI.marketStatsLoading=true;try{const fb=await firebase();if(!fb)return;const rows=await Promise.all(wanted.map(async key=>{try{const snap=await fb.getDoc(fb.doc(fb.db,MARKET_STATS_COLLECTION,key));return snap.exists()?{cardKey:key,...snap.data()}:null}catch{return null}}));for(const row of rows)if(row)UI.marketStats[row.cardKey]=row;UI.marketStatsLoaded=true;}catch(e){console.warn("BigCards market stats",e);}finally{UI.marketStatsLoading=false;}}
  async function showMarketCardStats(key){let stats=marketStatsForKey(key);if(!stats){const fb=await firebase();if(fb)try{const snap=await fb.getDoc(fb.doc(fb.db,MARKET_STATS_COLLECTION,key));if(snap.exists()){stats={cardKey:key,...snap.data()};UI.marketStats[key]=stats;}}catch(e){console.warn(e);}}const sales=(stats?.sales||[]).filter(x=>Number(x?.price)>0&&Number(x?.at)>0).slice().sort((a,b)=>Number(b.at)-Number(a.at)),ref=marketReferencePrice(stats),adjusted=marketAdjustedReference(stats),freq=Math.round((1-marketFrequencyFactor(stats?.salesCount||0))*100),trend=marketTrend(stats),t=now(),sales24=sales.filter(x=>Number(x.at)>=t-86400000),sales7=sales.filter(x=>Number(x.at)>=t-7*86400000),vol24=sales24.reduce((a,x)=>a+Number(x.price||0),0),vol7=sales7.reduce((a,x)=>a+Number(x.price||0),0),offers=UI.market.filter(x=>(x.cardKey||marketCardKeyFromCard(x.card||{}))===key).length;showModal(`<div class="bc-market-stats-modal"><small>MARKT-PREISENTWICKLUNG</small><h2>📈 Kartenwert & echte Verkäufe</h2>${stats?`<div class="bc-market-stats-summary"><div><b>${fmt(stats.salesCount||0)}×</b><small>insgesamt verkauft</small></div><div><b>${fmt(stats.lastPrice||0)}</b><small>letzter Verkauf</small></div><div><b>${fmt(adjusted)}</b><small>Sammler-Referenz</small></div><div><b>${fmt(sales24.length)} / ${fmt(vol24)}</b><small>24h Verkäufe / Volumen</small></div><div><b>${fmt(sales7.length)} / ${fmt(vol7)}</b><small>7T Verkäufe / Volumen</small></div><div><b>${offers}</b><small>aktuelle sichtbare Angebote</small></div><div><b>${fmt(stats.allTimeHigh||0)}</b><small>bestätigtes Hoch</small></div><div><b>${fmt(stats.allTimeLow||0)}</b><small>bestätigtes Tief</small></div><div><b>${trend==null?"–":`${trend>=0?"+":""}${trend.toLocaleString("de-DE",{maximumFractionDigits:1})}%`}</b><small>Trend im gespeicherten Verlauf</small></div></div><div class="bc-market-frequency"><b>🔁 Handelsfrequenz-Abschlag: -${freq} %</b><span>Je öfter exakt diese Kartenvariante verkauft wurde, desto stärker sinkt ihr Knappheits-/Sammlerfaktor. Der freie Angebotspreis bleibt davon unberührt.</span></div><p>Robuste 7-Tage-Basis vor Frequenzfaktor: <b>${fmt(ref)} Points</b>. Bei genügend Verkäufen werden extreme Randwerte im gespeicherten Verlauf gedämpft.</p><div class="bc-market-sales-history">${sales.slice(0,12).map(x=>`<div><b>${fmt(x.price)} Points</b><span>${new Date(Number(x.at)||0).toLocaleString("de-DE")}</span></div>`).join("")||"<p>Keine Einzelverkäufe im 50er-Verlauf.</p>"}</div>`:`<div class="bc-empty-state"><span>📉</span><h3>Zu wenig Marktdaten</h3><p>Für diese Variante wurde noch kein erfolgreicher Verkauf gespeichert.</p></div>`}<button class="bc-primary" data-bc-modal-close>Schließen</button></div>`);}
  // ===== BIGCARDS.KL V392 SYSTEME END =====

  
  const TUTORIAL_LABELS = Object.freeze({
    field:["Spielfeld","🏗️"],packs:["Packs & Auto-Opener","🎴"],collection:["Sammlung","📚"],card:["Karte & Upgrades","🃏"],
    battle:["Kartenkampf & Wins","⚔️"],expedition:["Expedition","🧭"],boss:["Wochenboss","👹"],sets:["Sets","🧩"],
    fusion:["Fusion","🔬"],prestige:["Prestige & Prestige-Shop","◆"],shop:["Shop & Ausrüstung","🛒"],market:["Markt","🏪"],score:["Beste Spieler","🏆"],settings:["Einstellungen","⚙️"]
  });
  function tutorialSteps(key){
    const defs={
      field:[
        ["field",".bc-head-stats","Kopfzeile","Oben siehst du Points, gesamte Kartenproduktion, BigCards-Level, deinen Rebirth-Fortschritt und den Sammlungsstand."],
        ["field",".bc-floor-tabs","Stockwerke 1–4","Die gelb markierten Tasten 1–4 sind deine Produktions-Stockwerke. Das Tutorial wechselt sie nicht. Exclusive funktioniert nur auf Stockwerk 1. VIP nur auf Stockwerk 1 und 2."],
        ["field",".bc-map-stage","Kartenplätze","Jedes Stockwerk besitzt 10 Kartenplätze. Normale Karten werden mit höheren Raritäten und Ausbau besser. Maximal 5 Exclusive und maximal 5 VIP dürfen accountweit gleichzeitig im Produktionsfeld liegen."],
        ["field",".bc-level-panel","Level & XP","Hier läuft dein BigCards-Level. V418 besitzt eine eigene deutlich langsamere Karten-XP-Kurve. Höhere Raritäten, Kartenlevel und Karten-Rebirth bleiben besser, aber XP explodiert nicht mehr durch alte Milliarden-Pointwerte."],
        ["field",".bc-rebirth","Rebirth","Rebirth setzt Level und aktuelle Points zurück, behält aber Karten und wichtige Kartenausbauten. Stockwerk 1 braucht Level 100, Stockwerk 2 Level 125, Stockwerk 3 Level 150 und Stockwerk 4 Level 200. Zusätzlich werden Points und Wins benötigt."],
        ["prestige",".bc-prestige-progress","Nach dem Rebirth-Endgame: Prestige","Wenn Stockwerk 4 mit Rebirth 5/5 abgeschlossen ist, wird Prestige zum Endgame. Zusätzlich brauchst du Points, Wins, Boss-Schaden, komplette Sets und Prismatic-Karten. Prestige behält deine Karten, startet aber die Account-Progression neu."],
        ["field",".bc-auto","Auto-Collector","Der Auto-Collector sammelt automatisch. Jede direkt hintereinander gekaufte Point-Minute wird stark teurer; nach vollständigem Ablauf startet die Preisreihe wieder günstig."],
        ["field",".bc-daily","Daily Card Quests","Hier stehen deine täglichen Kartenaufgaben und Belohnungen. Jede abgeschlossene Daily Card Quest gibt zusätzlich Haupt-XP."]
      ],
      packs:[
        ["packs",".bc-pack-categories","Pack-Kategorien","Hier filterst du Free-, Pay- und Wins-Packs. Die einzelnen i-Buttons zeigen den jeweiligen Drop-Pool und die Chancen."],
        ["packs",".bc-pack-card.rar-common","Normale Point-Packs","Gewöhnlich bis Göttlich folgen deiner normalen Point- und Rebirth-Progression. Jeder einzelne Pack-i-Button zeigt, welche Raritäten enthalten sein können und mit welcher Chance."],
        ["packs",".bc-pack-card.wins-pack","Wins-Packs","Wins-Packs kosten keine normalen Points, sondern Wins aus Kartenkämpfen. Sie besitzen eigene Kartenpools und einen kleinen Produktionsbonus statt übertriebener Point-Werte."],
        ["packs",".bc-pack-card.exclusive","Exclusive Pack","Exclusive ist Premium und kampfstark, aber in der Produktion begrenzt: nur Stockwerk 1 und maximal 5 Exclusive gleichzeitig."],
        ["packs",".bc-pack-card.vip-pack","VIP Pack","VIP kann auf Stockwerk 1 und 2 produzieren. Insgesamt dürfen trotzdem nur 5 VIP gleichzeitig auf allen Produktionsfeldern liegen."],
        ["packs",".bc-pack-card.hyper-pack-card","Hyper Pack","Hyper enthält 2 Karten. Hyper ist vor allem für Kampf gedacht: wenig Points, Rank wirkt bei Hyper nur auf Kampf, Generation/Rebirth/Fusion bauen die Karte weiter aus."],
        ["packs",".bc-auto-opener","Auto-Opener","Der Auto-Opener hat bis zu vier unabhängige Kanäle. Du kannst ihn einklappen oder komplett über sein eigenes Fenster verwalten. Jeder Kanal kann ein anderes Pack öffnen."]
      ],
      collection:[
        ["collection",".bc-collection-score-row","Sammlungs- & Rebirth-Scores","Links steht der F2P-Sammlungs-Score, mittig der neue gesamte Rebirth-Score und rechts der Pay-Score. Im Rebirth-Score kannst du Gewöhnlich bis Göttlich, Exclusive, Wins, VIP und Hyper auswählen. 100 % bedeutet überall RB5; bei Hyper zählen zusätzlich die Generationen mit."],
        ["collection","[data-bc-collection-search]","Suche","Hier findest du Karten schnell nach Namen."],
        ["collection",".bc-rarity-tabs","Raritäten","Wechsle zwischen allen normalen Raritäten sowie Exclusive, VIP, Wins und Hyper."],
        ["collection",".bc-card-grid","Karten","Ein Klick auf eine gefundene Karte öffnet alle Details, Upgrades, Rebirths, Auren, Bindungen, Shiny, Fusion und weitere Funktionen."]
      ],
      card:[
        ["card",".bc-feature-page","Persönliche Karte","Die persönliche Karte ist vom normalen Produktionsfeld getrennt und wird für Rank, Backup und besondere Kartenfunktionen verwendet."],
        ["card",".bc-feature-top-actions","Karte, Beste Kampfkarte & Rank","Hier wechselst du die persönliche Karte. „Beste Kampfkarte“ wird einmalig für 100 JK/Coin freigeschaltet und kann danach automatisch die stärkste erlaubte Kampfkarte als persönliche Karte setzen. Der Rank-Bereich bleibt daneben separat."],
        ["card",".bc-feature-trail-panel","Spuren & Inventar","Über „Meine Spuren öffnen“ siehst du dein komplettes Spuren-Inventar mit Bestand, Freischaltung und allen Boni. Haupt- und Backup-Karte dürfen jeweils eine eigene Spur tragen."],
        ["card",".bc-section","Karten-Rebirth & Umrandungen","Karten-Rebirth besitzt fünf Stufen. RB1 = hellblau/cyan, RB2 = violett, RB3 = gold/gelb, RB4 = pink/rot und RB5 = animierter Regenbogenrand. Aura verbessert Points, Kampf-Aura den Kampf, Bindung XP, Shiny besitzt eigene Stufen und Fusion veredelt Duplikate."]
      ],
      battle:[
        ["battle",".bc-battle-record","Wins & Bilanz","Wins bekommst du aus Kartenkampf-Siegen. Der i-Button erklärt die komplette Wins-Währung und ihre Verwendungen."],
        ["battle",".bc-battle-progression","Kampfraritäten","Höhere Kampfraritäten werden mit Siegen und Points freigeschaltet. Die Point-Kosten sind an die neue Wirtschaft angepasst."],
        ["battle",".bc-best-combat-entry","Beste Kampfkarte","Diese Komfortfunktion ist zunächst gesperrt. Für einmalig 100 JK/Coin schaltest du sie dauerhaft frei; danach wählt sie automatisch deine aktuell stärkste erlaubte, nicht kaputte Kampfkarte."],
        ["battle",".bc-battle","Kartenkampf","Wähle deine Karte, starte den Kampf und nutze normale sowie Special-Angriffe. Zerbrochene Karten müssen repariert werden."]
      ],
      expedition:[
        ["expedition",".bc-section","Expeditionen","Unbenutzte Karten können zeitweise auf Expedition geschickt werden. Währenddessen sind sie für andere Systeme gesperrt."],
        ["expedition",".bc-expedition-slots","Slots & Dauer","Wähle einen freien Slot, eine Karte und die gewünschte Dauer. Belohnungen hängen von Karte und Expeditionstyp ab."]
      ],
      boss:[
        ["boss",".bc-boss-team","Boss-Team","Der Wochenboss nutzt bis zu drei Karten. Bestes Boss-Team sucht passende starke Karten."],
        ["boss",".bc-boss-attack","Tagesangriffe & Live-Sync","Du hast genau 3 Gratis-Angriffe pro Tag und maximal 2 Bonus-Angriffe. V413 schreibt jeden gewerteten Angriff sofort gemeinsam in den Community-Boss. Schlägt der Online-Sync fehl, wird der Angriff nicht verbraucht."],
        ["boss",".bc-boss-personal","Persönlicher Beitrag","Dein persönlicher Wochenschaden bestimmt Meilensteine. Community-Ziele laufen zusätzlich für alle Spieler."]
      ],
      sets:[
        ["sets",".bc-ultimate-set","Exklusivitäts-Set","Ganz oben liegt das besondere Exklusivitäts-Set mit sehr seltenen Karten und eigener Belohnung."],
        ["sets",".bc-set-group-actions","Normale & Crazy Sets","Beide Gruppen können auf- und zugeklappt werden. Das Hyper-Set gehört zu den normalen Sets und nutzt ausschließlich Hyper-Karten."],
        ["sets",".bc-set-weekly","Set-Missionen","Wöchentliche Missionen belohnen aktives Spielen mit bestimmten Sets."]
      ],
      fusion:[
        ["fusion",".bc-fusion-rules","Was ist Holo?","Holographic entsteht aus einer Hauptkarte + 8 Duplikaten + Fusionsstaub. Es bleibt dieselbe Grundkarte und erhält +2 % Points sowie +2 % Boss-Power."],
        ["fusion",".bc-fusion-rules","Was ist Prismatic?","Prismatic ist die nächste Fusionsstufe: Holo + 20 weitere Duplikate + Staub + Katalysator. Sie gibt +4 % Points und +4 % Boss-Power."],
        ["fusion",".bc-fusion-list","Fusionsliste","Hier siehst du, bei welchen Karten genug Duplikate für Holo oder Prismatic vorhanden sind. Fusion hat 100 % Erfolg."]
      ],
      prestige:[
        ["prestige",".bc-prestige-hero","Prestige-Fortschritt","Hier siehst du Prestige-Stufe, Prestige-Siegel, insgesamt erspielte JK/Coin, deinen besten Treffer und Prestige-Luck."],
        ["prestige",".bc-prestige-requirements","Prestige-Anforderungen","Für jedes Prestige musst du zuerst Stockwerk 4 vollständig abschließen. Dazu kommen skalierende Points, Wins, persönlicher Wochenboss-Schaden, vollständige Sets und Prismatic-Karten."],
        ["prestige",".bc-prestige-keep","Was wird zurückgesetzt?","Zurückgesetzt werden Account-Points, Level/XP, aktueller Rebirth-Zyklus, Stockwerke/Feldbelegung, Wins-Bestand und Kampfraritäts-Fortschritt. Deine Karten und ihre Ausbauten bleiben erhalten."],
        ["prestige",".bc-prestige-odds","JK/Coin-Kapsel","Jedes Prestige gibt eine feste, eindeutig ermittelte JK/Coin-Belohnung. Die Chance reicht von häufigen kleinen Treffern bis 1.000 JK/Coin als extrem seltenem Höchsttreffer. Prestige-Luck verbessert hohe Treffer langsam."],
        ["prestige",".bc-prestige-shop","Prestige-Shop","Jedes Prestige gibt mindestens ein Prestige-Siegel. Hier kaufst du dauerhafte kosmetische und Komfort-Freischaltungen, ohne die normale Points-Produktion direkt zu vervielfachen."],
        ["prestige",".bc-prestige-start","Prestige starten","Wenn alle Anforderungen grün sind, bestätigst du hier den Reset. Die JK/Coin-Gutschrift wird vor dem eigentlichen Reset vorbereitet; bei einem Fehler bleibt dein Fortschritt bestehen."]
      ],
      shop:[
        ["shop",".bc-shop-vip-card","VIP","Hier öffnest du das VIP-Programm, VIP-Glücksrad und den VIP-Klicker. VIP-Karten dürfen nur auf Stockwerk 1–2 produzieren und insgesamt maximal fünf aktiv sein."],
        ["shop",".bc-shop-trail-card","Spuren","Spuren werden auf die persönliche Haupt- oder Backup-Karte gelegt. Sie geben getrennte Points-, XP-, Schaden- und Lebensboni."],
        ["shop",".bc-shop-upgrade-card","Karten verbessern","Level 1–5 braucht Duplikate und Points. Reparatur-Kits beheben zerbrochene Karten. Im Tränke-Shop bereitest du Kampftränke vor."],
        ["shop",".bc-shop-info-card","Auren, Kampf-Auren & Bindungen","Aura = Points. Kampf-Aura = Kartenkampf. Bindung = XP. Die i-Buttons zeigen Beschaffung und Wirkung."],
        ["shop",".bc-shop-info-card","Shiny","Electric Shiny verstärkt XP, Explosive Shiny Points und Void Shiny aktiviert Auto-Collect. Shiny ist ein eigenes System neben Fusion und Rebirth."],
        ["shop",".bc-rebirth-shop","Rebirth Center","Hier siehst du Level-, Points- und Wins-Anforderungen für den nächsten Rebirth sowie den optionalen JK/Coin-Skip."]
      ],
      market:[
        ["market",".bc-section","Markt","Der Markt ist zum Kaufen und Verkaufen von Karten. Preise und Kartenwerte folgen der neuen Point-Wirtschaft; echte Spielerangebote werden getrennt von Systemangeboten behandelt."]
      ],
      score:[
        ["score",".bc-section","Beste Spieler","Hier vergleichst du deinen Fortschritt mit anderen Spielern. Der Rang basiert auf dem BigCards-Profil und nicht nur auf deinen aktuell gehaltenen Points."]
      ],
      settings:[
        ["settings",".bc-settings-page","Einstellungen","Hier steuerst du Darstellung und Komfort, ohne dein Spielbalancing zu verändern."],
        ["settings",".bc-settings-groups section:nth-child(1)","Scores","F2P-, Rebirth- und Pay-Score lassen sich einzeln ein- oder ausblenden. Auch die Prozentwerte über den Raritäts-Tabs sind optional."],
        ["settings",".bc-settings-groups section:nth-child(2)","Auto-Opener","Das große Auto-Opener-Bedienfeld und das verschiebbare Schwebefenster lassen sich unabhängig voneinander ausblenden. Laufende Kanäle werden dadurch nicht gestoppt."],
        ["settings",".bc-settings-groups section:nth-child(3)","Handy & Leistung","Kompakte Handy-Ansicht, kürzere Pack-Karten und reduzierte Animationen helfen bei kleinen Displays oder schwächeren Geräten."]
      ]
    };
    return defs[key]||[];
  }
  function tutorialHtml(){
    return `<section class="bc-section bc-tutorial-home"><div class="bc-section-title"><div><small>HILFE & LERNBEREICH</small><h2>🎓 Tutorial</h2><p>Wähle genau den Bereich, den du erklärt haben möchtest. Das Tutorial führt dich direkt dorthin und markiert das aktuell erklärte Element gelb. Prestige besitzt ebenfalls ein vollständiges eigenes Tutorial.</p></div><button class="bc-info-circle" data-bc-section-info="tutorial" title="Tutorial-Info">i</button></div><div class="bc-tutorial-grid">${Object.entries(TUTORIAL_LABELS).map(([id,[label,icon]])=>`<button data-bc-tutorial-start="${id}"><span>${icon}</span><b>${label}</b><small>Schritt für Schritt</small></button>`).join("")}</div><section class="bc-online-save-panel"><div><small>SPIELSTAND</small><h3>☁ Online speichern</h3><p>Speichert deinen aktuellen BigCards-Spielstand zusätzlich online. Die normale automatische Speicherung bleibt weiterhin aktiv.</p></div><button data-bc-online-save>Online speichern</button></section><div class="bc-tutorial-rebirth-key"><h3>Karten-Rebirth-Ränder</h3><div><span class="rb1">RB1</span><span class="rb2">RB2</span><span class="rb3">RB3</span><span class="rb4">RB4</span><span class="rb5">RB5</span></div><p>RB1 Cyan · RB2 Violett · RB3 Gold · RB4 Pink/Rot · RB5 animierter Regenbogen.</p></div></section>`;
  }
  function clearTutorialHighlight(){UI.overlay?.querySelectorAll(".bc-tutorial-highlight").forEach(x=>x.classList.remove("bc-tutorial-highlight"));UI.overlay?.querySelector("[data-bc-tutorial-coach]")?.remove();}
  function stopTutorial(returnHome=true){clearTutorialHighlight();UI.tutorialKey=null;UI.tutorialStep=0;if(returnHome){UI.tab="tutorial";refresh(false);}}
  function startTutorial(key){if(!tutorialSteps(key).length)return;UI.tutorialReturnTab=UI.tab;UI.tutorialKey=key;UI.tutorialStep=0;showTutorialStep();}
  function showTutorialStep(){
    const steps=tutorialSteps(UI.tutorialKey),step=steps[UI.tutorialStep];if(!step)return stopTutorial(true);
    const [tab]=step;if(tab==="packs")UI.packCategory="all";if(UI.tab!==tab){UI.tab=tab;refresh(false);}else renderMain();
    requestAnimationFrame(renderTutorialCoach);
  }
  function renderTutorialCoach(){
    clearTutorialHighlight();const steps=tutorialSteps(UI.tutorialKey),step=steps[UI.tutorialStep];if(!step||!UI.overlay)return;
    const [,selector,title,text]=step,target=UI.overlay.querySelector(selector)||UI.overlay.querySelector(".bc-section")||UI.main;
    target?.classList.add("bc-tutorial-highlight");target?.scrollIntoView?.({behavior:"smooth",block:"center",inline:"nearest"});
    const coach=document.createElement("div");coach.className="bc-tutorial-coach";coach.dataset.bcTutorialCoach="1";coach.innerHTML=`<div class="bc-tutorial-coach-head"><small>${esc(TUTORIAL_LABELS[UI.tutorialKey]?.[0]||"Tutorial")} · ${UI.tutorialStep+1}/${steps.length}</small><button data-bc-tutorial-close aria-label="Tutorial schließen">×</button></div><h3>${esc(title)}</h3><p>${text}</p><div class="bc-tutorial-coach-actions"><button data-bc-tutorial-prev ${UI.tutorialStep<=0?"disabled":""}>← Zurück</button><button class="primary" data-bc-tutorial-next>${UI.tutorialStep>=steps.length-1?"Tutorial fertig":"Weiter →"}</button></div>`;
    UI.overlay.append(coach);
  }
  function tutorialMove(delta){const steps=tutorialSteps(UI.tutorialKey);if(!steps.length)return stopTutorial(true);const next=UI.tutorialStep+delta;if(next<0)return;if(next>=steps.length)return stopTutorial(true);UI.tutorialStep=next;showTutorialStep();}
  async function manualOnlineSave(){toast("☁ Online-Speicherung wird vorbereitet …",1800);const ok=await syncProfile(true);toast(ok?"✓ BigCards wurde online gespeichert.":"Online-Speicherung ist gerade nicht möglich. Der lokale Spielstand bleibt erhalten und die automatische Speicherung versucht es erneut.",ok?3200:5000);}
  function showSectionInfo(id){
    const info={
      field:["Spielfeld","10 Karten pro Stockwerk. Rebirth-Level: 100 / 125 / 150 / 200. Exclusive nur Stockwerk 1 und maximal 5 insgesamt. VIP nur Stockwerk 1–2 und maximal 5 insgesamt. Das Sammellimit wächst mit deiner Produktion."],
      packs:["Packs","Jedes Pack besitzt einen eigenen i-Button mit Drop-Chancen. Hyper enthält 2 Karten und ist kampforientiert. Exclusive/VIP besitzen Produktionslimits."],
      collection:["Sammlung","Oben gibt es F2P-, Rebirth- und Pay-Score getrennt. V424 hält Sammlung und persönlichen Karte-Slot bei demselben Kartenmotiv synchron. V425 zeigt Karten-Rebirth im Sammlungsalbum kompakt oben links; die übrigen Effekt-Symbole bleiben innerhalb des Kartenbildes und umbrechen bei wenig Platz. Karten-Rebirth-Ränder: RB1 Cyan, RB2 Violett, RB3 Gold, RB4 Pink/Rot, RB5 Regenbogen."],
      battle:["Kartenkampf","Siege geben Wins und schalten höhere Kampfraritäten frei. Hyper-Rank ist besonders kampfstark. Die Wins-Info erklärt alle Einsatzmöglichkeiten."],
      boss:["Wochenboss","3 Gratis-Angriffe pro Tag plus maximal 2 Bonus-Angriffe. Der Verbrauch bleibt auch nach Neuladen bestehen."],
      sets:["Sets","Normale Sets, Crazy Sets, Hyper-Set und Exklusivitäts-Set geben eigene Fortschritte und Boni. Kategorien lassen sich ein- und ausklappen."],
      fusion:["Fusion","Holo = Hauptkarte + 8 Duplikate + Staub, +2 % Points/Boss. Prismatic = Holo + 20 Duplikate + Staub + Katalysator, +4 % Points/Boss. Erfolg immer 100 %."],
      prestige:["Prestige","Prestige wird nach dem vollständigen Stockwerk-4-Rebirth-Zyklus und zusätzlichen Endgame-Zielen möglich. Es setzt den Account-Durchlauf zurück, behält aber Karten und deren Ausbauten. Jedes Prestige gibt eine JK/Coin-Kapsel und Prestige-Siegel für den dauerhaften Prestige-Shop. 1.000 JK/Coin ist der extrem seltene Höchsttreffer."],
      tutorial:["Tutorial","Jeder Spielbereich besitzt ein eigenes Schritt-für-Schritt-Tutorial. Gelbe Umrandungen zeigen immer genau das Element, das gerade erklärt wird."],settings:["Einstellungen","Scores, Auto-Opener-Anzeigen, Handy-Kompaktheit, Pack-Texte und Animationen lassen sich unabhängig einstellen. Die Optionen ändern nur Darstellung und Komfort, nicht deine Kartenwerte."],
      card:["Karte","Persönliche Karte, Rank, Backup, Spuren und Kartenausbauten laufen hier zusammen. Karten-Rebirth: RB1 Cyan, RB2 Violett, RB3 Gold, RB4 Pink/Rot, RB5 Regenbogen."],
      expedition:["Expedition","Bis zu vier Karten können 10 Minuten, 1 Stunde oder 6 Stunden auf Expedition gehen. Währenddessen sind sie für andere Systeme gesperrt und gehen niemals verloren."],
      shop:["Shop","Auren verbessern Points, Kampf-Auren den Kampf und Bindungen XP. Spuren, Tränke, Reparatur, Shiny und Rebirth besitzen eigene Unterbereiche und i-Buttons."],
      score:["Beste Spieler","Die Rangliste nutzt Lifetime-Fortschritt. Rebirths setzen das aktuelle Level zurück, nicht aber deinen langfristigen Score."]
    },row=info[id]||["Info","Für diesen Bereich gibt es eine Schnellinfo und ein ausführliches Tutorial im Tutorial-Tab."];
    showModal(`<div class="bc-pack-info-modal"><small>SCHNELLINFO</small><h2>${esc(row[0])}</h2><p>${row[1]}</p><button class="bc-primary" data-bc-modal-close>Verstanden</button></div>`);
  }

  function navItems(){const items=[["field","Spielfeld","🏗️","core"],["packs","Packs","🎴","core"],["collection","Sammlung","📚","core"],["card","Karte","🃏","core"],["battle","Kartenkampf","⚔️","play"],["expedition","Expedition","🧭","play"],["boss","Wochenboss","👹","play"],["sets","Sets","🧩","collect"],["fusion","Fusion","🔬","collect"],["prestige","Prestige","◆","prestige"],["shop","Shop","🛒","trade"],["market","Markt","🏪","trade"],["score","Beste Spieler","🏆","trade"],["tutorial","Tutorial","🎓","help"],["settings","Einstellungen","⚙️","help"]];if(UI.role==="owner")items.push(["mod","Mod","🛠️","staff"]);return items;}
  function renderNav(){const wrap=UI.overlay?.querySelector("[data-bc-nav-wrap]"),nav=UI.overlay?.querySelector("[data-bc-nav]");if(!nav)return;if(wrap)wrap.classList.toggle("collapsed",!!UI.navCollapsed);nav.classList.toggle("owner-nav",UI.role==="owner");nav.classList.toggle("player-nav",UI.role!=="owner");nav.innerHTML=navItems().map(([id,label,icon,group])=>`<button data-bc-tab="${id}" class="nav-${group} ${UI.tab===id?"active":""}"><span>${icon}</span><b>${label}</b></button>`).join("");}
  function renderShell(){return `<div class="bc-shell"><header class="bc-header"><div class="bc-brand"><button class="bc-back" data-bc-close>←</button><div><small>JK.GAMES · TOP GAME</small><h1>BigCards<span>.kl</span></h1><em class="bc-prestige-title-badge" data-bc-prestige-title hidden></em></div></div><div class="bc-head-stats" data-bc-head-stats></div></header><div class="bc-nav-wrap ${UI.navCollapsed?"collapsed":""}" data-bc-nav-wrap><button class="bc-nav-toggle" data-bc-nav-toggle title="Menü ein-/ausfahren">${UI.navCollapsed?"⌄ MENÜ":"⌃ MENÜ"}</button><nav class="bc-nav" data-bc-nav></nav></div><main class="bc-main" data-bc-main></main><div class="bc-toast" data-bc-toast></div></div>`}
  function refreshHeader(){
    const el=UI.overlay?.querySelector("[data-bc-head-stats]");if(!el)return;
    if(el.dataset.liveReady!=="1"){
      el.innerHTML=`<div><small>POINTS</small><b data-bc-head-points></b></div><div><small>PRODUKTION</small><b data-bc-head-production></b></div><div><small>LEVEL</small><b data-bc-head-level></b><em data-bc-head-xp></em></div><div><small>REBIRTH</small><b data-bc-head-rebirth></b></div><div><small>PRESTIGE</small><b data-bc-head-prestige></b></div><div><small>SAMMLUNG</small><b data-bc-head-collection></b></div>`;
      el.dataset.liveReady="1";
    }
    const need=xpNeed(S.level),prod=productionPerSecond(),set=(sel,value)=>{const node=el.querySelector(sel);if(node&&node.textContent!==value)node.textContent=value;};
    set("[data-bc-head-points]",fmt(S.points));set("[data-bc-head-production]",`+${fmt(prod)}/s`);set("[data-bc-head-level]",String(S.level));set("[data-bc-head-xp]",`${fmt(S.xp)}/${fmt(need)} XP`);set("[data-bc-head-rebirth]",`${S.totalRebirths} · ×${accountPointRebirthMultiplier().toFixed(2).replace(".",",")}`);set("[data-bc-head-prestige]",`◆ ${prestigeCount()}`);set("[data-bc-head-collection]",scorePct(overallCollectionScore()));
  }
  function refreshFieldLive(){if(UI.tab!=="field"||!UI.overlay)return;const collected=UI.overlay.querySelector("[data-bc-collect] b"),cap=UI.overlay.querySelector("[data-bc-field-cap]");if(collected)collected.textContent=fmt(S.pendingPoints);if(cap)cap.textContent=fieldStorageLabel();const auto=UI.overlay.querySelector(".bc-auto");if(!auto)return;const timer=auto.querySelector(":scope > b"),button=auto.querySelector("[data-bc-buy-collector]"),remaining=collectorRemainingMinutes();if(timer)timer.textContent=timeLeft(S.autoCollectorUntil);if(button){button.disabled=remaining>=15;button.textContent=remaining>=15?"Point-Verlängerung bei < 15 Min Restzeit":`${fmt(collectorPointPrice())} Points = +1 Min`;}}
  function refreshFeaturedLive(){if(UI.tab!=="card"||!UI.overlay)return;updateFeaturedEarnings(now());const p=UI.overlay.querySelector("[data-bc-feature-pending]"),x=UI.overlay.querySelector("[data-bc-feature-xp]"),pr=UI.overlay.querySelector("[data-bc-feature-rate]"),xr=UI.overlay.querySelector("[data-bc-feature-xp-rate]"),pm=UI.overlay.querySelector("[data-bc-feature-point-meter]"),xm=UI.overlay.querySelector("[data-bc-feature-xp-meter]"),lim=featuredStorageMeta();if(p)p.textContent=fmt(S.featuredPendingPoints);if(x)x.textContent=fmt(S.featuredPendingXp);if(pm)pm.style.width=`${Math.min(100,(Number(S.featuredPendingPoints)||0)/lim.points*100)}%`;if(xm)xm.style.width=`${Math.min(100,(Number(S.featuredPendingXp)||0)/lim.xp*100)}%`;const inst=featuredCard();if(pr)pr.textContent=`+${fmt(featurePointRate(inst))}/s`;if(xr)xr.textContent=`+${fmt(featureXpRate(inst))}/s`;}
  function rememberViewScroll(){if(!UI.overlay)return;const main=UI.main||UI.overlay.querySelector("[data-bc-main]");if(main)UI.mainScroll[UI.tab]=Math.max(0,main.scrollTop||0);const rarity=UI.overlay.querySelector("[data-bc-rarity-tabs]");if(rarity)UI.rarityScroll=Math.max(0,rarity.scrollLeft||0);}
  function restoreViewScroll(preserve=true){requestAnimationFrame(()=>{if(!UI.overlay)return;const main=UI.main||UI.overlay.querySelector("[data-bc-main]");if(main)main.scrollTop=preserve?Math.min(Math.max(0,Number(UI.mainScroll[UI.tab])||0),Math.max(0,main.scrollHeight-main.clientHeight)):0;const rarity=UI.overlay.querySelector("[data-bc-rarity-tabs]");if(rarity){const max=Math.max(0,rarity.scrollWidth-rarity.clientWidth);rarity.scrollLeft=Math.min(Math.max(0,Number(UI.rarityScroll)||0),max);}});}
  function refresh(preserve=true){if(!UI.overlay)return;if(preserve)rememberViewScroll();refreshHeader();renderNav();renderMain();applyUiPreferenceClasses();applyPrestigeCosmetics();restoreViewScroll(preserve);}
  function renderMain(){const el=UI.main||UI.overlay?.querySelector("[data-bc-main]");if(!el)return;UI.main=el;if(UI.tab==="mod"&&UI.role!=="owner")UI.tab="field";if(UI.tab==="field")el.innerHTML=fieldHtml();else if(UI.tab==="packs")el.innerHTML=packsHtml();else if(UI.tab==="collection")el.innerHTML=collectionHtml();else if(UI.tab==="shop")el.innerHTML=shopHtml();else if(UI.tab==="market")el.innerHTML=marketHtml();else if(UI.tab==="score")el.innerHTML=scoreHtml();else if(UI.tab==="battle")el.innerHTML=battleHtml();else if(UI.tab==="expedition")el.innerHTML=expeditionHtml();else if(UI.tab==="boss")el.innerHTML=bossHtml();else if(UI.tab==="sets")el.innerHTML=setsHtml();else if(UI.tab==="fusion")el.innerHTML=fusionHtml();else if(UI.tab==="prestige")el.innerHTML=prestigeHtml();else if(UI.tab==="card")el.innerHTML=featureCardHtml();else if(UI.tab==="tutorial")el.innerHTML=tutorialHtml();else if(UI.tab==="settings")el.innerHTML=settingsHtml();else if(UI.tab==="vipWheel")el.innerHTML=vipWheelHtml();else if(UI.tab==="vipClicker")el.innerHTML=vipClickerHtml();else if(UI.tab==="mod"&&UI.role==="owner")el.innerHTML=modHtml();else el.innerHTML=fieldHtml();}
  function fieldHtml(){const floor=UI.floor,max=floorMaxTier(floor),phase=FLOOR_PHASES[floor],rebirthLevel=rebirthRequiredLevel(),rebirthPoints=rebirthPointCost(),rebirthWins=rebirthWinCost(),rebirthOk=rebirthReady();const slots=S.floors[floor]||[];return `<section class="bc-atlas"><div class="bc-atlas-toolbar"><div><small>AKTIVES STOCKWERK</small><div class="bc-floor-tabs">${Array.from({length:4},(_,i)=>`<button data-bc-floor="${i}" class="${floor===i?"active":""}" ${i>=S.unlockedFloors?"disabled":""}>${i+1}</button>`).join("")}</div></div><div><small>FREIGESCHALTET BIS</small><b>${RARITIES[max]?.symbol||"🔒"} ${RARITIES[max]?.name||"Gesperrt"}</b></div><div class="bc-field-actions"><button class="bc-info-circle" data-bc-section-info="field" title="Spielfeld-Info">i</button><button data-bc-smart>⚡ Bestes Setup</button><small>💡 Karte gedrückt halten und auf einen anderen Platz ziehen · Exclusive max. 5 gesamt, nur Stockwerk 1 · VIP max. 5 gesamt, nur Stockwerk 1–2</small></div></div><div class="bc-map-stage"><div class="bc-map-deco bc-citadel"><span>🏰</span><b>${phase?.name||"Stockwerk"}</b><small>Stockwerk ${floor+1}</small></div><div class="bc-map-path"></div><div class="bc-slot-column left">${slots.slice(0,5).map((id,i)=>slotHtml(id,i)).join("")}</div><div class="bc-slot-column right">${slots.slice(5,10).map((id,i)=>slotHtml(id,i+5)).join("")}</div><button class="bc-collector" data-bc-collect><small>GESAMMELT</small><b>${fmt(S.pendingPoints)}</b><span>Einsammeln</span><em data-bc-field-cap>${fieldStorageLabel()}</em></button></div><div class="bc-field-bottom"><div class="bc-level-panel"><small>BIGCARDS LEVEL</small><b>Level ${S.level}</b><div><i style="width:${Math.min(100,S.xp/xpNeed(S.level)*100)}%"></i></div><span>${fmt(S.xp)} / ${fmt(xpNeed(S.level))} XP</span><em class="bc-field-storage-note">Spielfeld-Limit: ${fmt(fieldPointCapacity())} Points · XP läuft online auch bei vollem Speicher weiter</em></div>${prestigeEndgameComplete()?`<button class="bc-rebirth ready prestige-ready" data-bc-tab="prestige"><small>◆ STOCKWERK 4 · REBIRTH 5/5</small><b>PRESTIGE PRÜFEN</b><span>Der Rebirth-Zyklus ist abgeschlossen. Öffne jetzt die Prestige-Anforderungen.</span></button>`:`<button class="bc-rebirth ${rebirthOk?"ready":"locked"}" data-bc-rebirth><small>${rebirthOk?"BEREIT":`🔒 LEVEL ${rebirthLevel} · ${fmt(rebirthPoints)} POINTS · ${rebirthWins} WINS`}</small><b>REBIRTH</b><span>Level ${S.level}/${rebirthLevel} · ${fmt(S.points)}/${fmt(rebirthPoints)} Points · 🏆 ${S.winsCurrency}/${rebirthWins} Wins · Points ×${accountPointRebirthMultiplier().toFixed(2).replace(".",",")}</span></button>`}<div class="bc-auto"><small>AUTO-COLLECTOR</small><b>${timeLeft(S.autoCollectorUntil)}</b><button data-bc-buy-collector ${collectorRemainingMinutes()>=15?"disabled":""}>${collectorRemainingMinutes()>=15?"Point-Verlängerung bei < 15 Min Restzeit":`${fmt(collectorPointPrice())} Points = +1 Min`}</button><em>Startet nach vollständigem Ablauf wieder günstig. Jede zusätzlich vorgemerkte Point-Minute wird deutlich teurer.</em></div></div><section class="bc-daily"><h3>Daily Card Quests</h3>${dailyQuestHtml()}</section></section>`}
  function slotHtml(id,slot){const inst=instance(id);if(!inst)return `<button class="bc-slot empty" data-bc-slot="${slot}"><span>+</span><b>Kartenplatz ${slot+1}</b><small>Karte einsetzen</small></button>`;const m=cardMeta(inst);return `<button class="bc-slot filled ${m.className} shiny-${inst.shiny} ${inst.broken?"broken":""}" data-bc-card="${id}" data-bc-slot="${slot}"><div class="bc-slot-art">${m.icon}${cardEffectBadges(inst)}${inst.broken?'<span class="bc-card-crack" aria-hidden="true"></span>':""}</div><small>${inst.hyper?`HYPER · G${hyperGeneration(inst)} · R${cardRank(inst)}`:inst.win?`WINS · ${m.rarity.name}`:inst.vip?`VIP · ${m.rarity.name}`:inst.exclusive?"EXCLUSIVE":m.rarity.name} · ${pct(m.rarityValue)}</small><b>${esc(m.name)}</b><span>★${inst.level}${cardRebirth(inst)?` · ↻${cardRebirth(inst)}`:""} · ${fmt(m.points)}/s · ⚔ ${fmt(m.combat.power)}</span><em>${inst.broken?"💥":""}${inst.aura?"✦":""}${inst.combatAura?"⚔":""}${inst.bind?"🔗":""}${inst.shiny?"⚡"+inst.shiny:""}</em></button>`}
  function packsHtml(){
    const unlocked=rarityUnlockedIndex(),cat=UI.packCategory||"all",showFree=cat==="all"||cat==="free",showPay=cat==="all"||cat==="pay",showWins=cat==="all"||cat==="wins",collapsed=!!UI.autoOpenerCollapsed;
    const categories=[["all","Alle Packs","🎴"],["free","Free Packs","🆓"],["pay","Pay Packs","💎"],["wins","Wins Packs","🏆"]];
    const freeHtml=showFree?RARITIES.map((r,i)=>`<article class="bc-pack-card rar-${r.id} ${i>unlocked?"locked":""}"><button class="bc-pack-info-btn bc-pack-info-corner" data-bc-pack-info="${i}" title="${r.name}-Pack Info">i</button><div class="bc-pack-badge">${r.symbol}</div><small>${i>unlocked?`🔒 REGULÄR NOCH GESPERRT`:"FREE / POINT PACK"}</small><h3>${r.name}</h3><p>10 Karten · mehrere mögliche Raritäten</p><b>${fmt(r.price)} Points</b><div><button data-bc-open-pack="${i}" data-currency="points" ${i>unlocked?"disabled":""}>Mit Points</button><button data-bc-open-pack="${i}" data-currency="jk">${r.jk} JK/Coin</button>${(S.jkPackCredits[r.id]||0)>0?`<button data-bc-open-pack="${i}" data-currency="credit">Credit ×${S.jkPackCredits[r.id]}</button>`:""}</div></article>`).join(""):"";
    const payHtml=showPay?`<article class="bc-pack-card exclusive"><button class="bc-pack-info-btn bc-pack-info-corner" data-bc-exclusive-info title="Exclusive-Pack Info">i</button><div class="bc-pack-badge">🩸</div><small>PAY PACK · 5 KARTEN</small><h3>EXCLUSIVE PACK</h3><p>12 eigene Blut-/Vampirkarten · Kampfziel bis Universe/Black Hole.</p><b>100 JK/Coin</b><div><button data-bc-exclusive="jk">Öffnen</button>${S.exclusiveCredits?`<button data-bc-exclusive="credit">Credit ×${S.exclusiveCredits}</button>`:""}</div><small class="bc-exclusive-floor-note">🏢 Produktionsfeld: nur Stockwerk 1 · max. 5 Exclusive insgesamt</small></article><article class="bc-pack-card vip-pack"><button class="bc-pack-info-btn bc-pack-info-corner" data-bc-vip-pack-info title="VIP-Pack Chancen">i</button><small>VIP PAY PACK · 5 KARTEN</small><h3>VIP PACK</h3><p>5 Karten aus 100 VIP-Karten · Kampfziel bis ungefähr Galaxy.</p><b>500 JK/Coin</b><div><button data-bc-vip-pack>Öffnen</button><button class="secondary" data-bc-vip-info>VIP-Programm</button></div><small class="bc-exclusive-floor-note">👑 Produktionsfeld: Stockwerk 1–2 · max. 5 VIP insgesamt</small></article><article class="bc-pack-card hyper-pack-card"><button class="bc-pack-info-btn bc-pack-info-corner" data-bc-hyper-info title="Hyper-Pack Info">i</button><div class="bc-pack-badge">⚡</div><small>HYPER · KAMPF-ENDGAME · 2 KARTEN</small><h3>HYPER PACK</h3><p>16 eigene Hyper-Karten · weniger Produktion/XP · extreme Rank-/Rebirth-/Generation-Skalierung.</p><b>${fmt(hyperPackPointPrice())} Points <em>oder</em> ${HYPER_JK_PRICE} JK/Coin</b><div><button data-bc-hyper-pack="points">Mit Points</button><button data-bc-hyper-pack="jk">${HYPER_JK_PRICE} JK/Coin</button></div><small class="bc-exclusive-floor-note">🐺 Hyper Set · Kerne ${S.hyperCores||0} · ${packChanceText(hyperPackCoreChance()*100)} Kernchance/Pack</small></article>`:"";
    const winsHtml=showWins?WIN_PACKS.map((pack,i)=>{const locked=S.phase+1<pack.floor;return `<article class="bc-pack-card wins-pack wins-pack-${i+1} ${locked?"locked":""}"><button class="bc-pack-info-btn bc-pack-info-corner" data-bc-win-pack-info="${i}" title="${pack.name} Info">i</button><div class="bc-pack-badge">${pack.icon}</div><small>${locked?`🔒 AB STOCKWERK ${pack.floor}`:`F2P · 50 EIGENE WIN-KARTEN`}</small><h3>${pack.name}</h3><p>5 Ziehungen · eigener 50er-Pool.</p><b>${pack.cost} Wins</b><div><button data-bc-win-pack="${i}" ${locked||S.winsCurrency<pack.cost?"disabled":""}>${locked?`Stockwerk ${pack.floor} benötigt`:`Für ${pack.cost} Wins öffnen`}</button></div><small class="bc-exclusive-floor-note">🏆 Aktuell ${S.winsCurrency}/${WIN_CAP} Wins</small></article>`}).join(""):"";
    const entitlementRaisedCapacity=syncAutoOpenerPermanentChannels();if(entitlementRaisedCapacity)queueMicrotask(()=>persistPassive());
    const cap=clamp(Math.floor(Number(S.autoOpenerCapacity)||0),0,AUTO_OPENER_MAX_LANES),selected=clamp(Math.floor(Number(UI.autoLaneSelected)||0),0,AUTO_OPENER_MAX_LANES-1),activeCount=autoActiveLaneIndexes().length,wallMs=activeCount?S.autoOpenerWorkMs/activeCount:S.autoOpenerWorkMs;
    const autoLaneCards=Array.from({length:AUTO_OPENER_MAX_LANES},(_,i)=>{const unlockedLane=i<cap,lane=S.autoOpenerLanes?.[i]||{pack:"common",enabled:false};if(!unlockedLane)return `<article class="bc-auto-channel locked" data-bc-auto-channel="${i}"><header><button type="button" data-bc-auto-lane="${i}" class="locked">🔒 ${i+1}</button><span>GESPERRT</span></header><div class="bc-auto-channel-locked"><b>Kanal ${i+1}</b><small>${i===0?"Kaufe 1 Auto-Opener-Stunde im JK/Coin-Shop.":`Der ${i+1}. Auto-Opener-Kauf schaltet diesen Kanal dauerhaft frei.`}</small><button type="button" data-bc-jkshop>JK/Coin-Shop öffnen</button></div></article>`;return `<article class="bc-auto-channel ${lane.enabled?"running":""} ${i===selected?"selected":""}" data-bc-auto-channel="${i}"><header><button type="button" data-bc-auto-lane="${i}" class="${i===selected?"active":""} ${lane.enabled?"running":""}">${i+1}</button><div><b>Kanal ${i+1}</b><span data-bc-auto-channel-status="${i}">${lane.enabled?"AKTIV":"BEREIT"}</span></div></header><select aria-label="Pack für Auto-Opener Kanal ${i+1}" data-bc-auto-pack="${i}">${RARITIES.map((r,ri)=>`<option value="${r.id}" ${lane.pack===r.id?"selected":""} ${ri>unlocked?"disabled":""}>${r.name}</option>`).join("")}</select><button type="button" data-bc-auto-lane-toggle="${i}" class="bc-auto-channel-toggle ${lane.enabled?"active":""}">${lane.enabled?"Stop":"Start"}</button><div class="bc-auto-lane-result" data-bc-auto-lane-result="${i}">${autoLaneResultHtml(i)}</div></article>`;}).join("");
    const compactTime=collapsed&&S.autoOpenerWorkMs>0?`<b class="bc-auto-compact-time" data-bc-auto-time>${formatAutoWorkTime(S.autoOpenerWorkMs)}</b>`:"";
    const laneButtons=`<div class="bc-auto-lanes">${Array.from({length:AUTO_OPENER_MAX_LANES},(_,i)=>`<button type="button" data-bc-auto-lane="${i}" class="${i===selected&&i<cap?"active":""} ${i<cap&&S.autoOpenerLanes[i]?.enabled?"running":""} ${i>=cap?"locked":""}" aria-disabled="${i>=cap}">${i>=cap?"🔒":""}${i+1}</button>`).join("")}</div>`;
    const autoHtml=uiPref("showAutoOpenerPanel")?`<div class="bc-auto-opener ${cap<1?"locked":"owned"} ${collapsed?"collapsed":""}><div class="bc-auto-opener-head"><div class="bc-auto-opener-title"><small>AUTO-OPENER</small><button class="bc-auto-info-btn" data-bc-auto-info title="Auto-Opener Info">i</button></div>${compactTime}${laneButtons}<button class="bc-auto-collapse-btn" data-bc-auto-collapse title="${collapsed?"Auto-Opener aufklappen":"Auto-Opener zuklappen"}">${collapsed?"⌄":"⌃"}</button></div>${collapsed?"":`<div class="bc-auto-work-summary"><span><small>ARBEITSZEIT</small><b data-bc-auto-time>${formatAutoWorkTime(S.autoOpenerWorkMs)}</b><em data-bc-auto-meta>${activeCount?`${activeCount} aktiv · ≈ ${formatAutoWorkTime(wallMs)} gleichzeitig`:"pausiert"}</em></span><strong>${cap}/4 Kanäle frei</strong></div><div class="bc-auto-channel-grid">${autoLaneCards}</div>`}</div>`:"";
    return `<section class="bc-section"><div class="bc-section-title"><div><small>PACK DISTRICT</small><h2>Kartenpacks</h2><p>Free, Pay, Wins und Hyper. Jedes Pack besitzt jetzt ein Infozeichen mit seinem exakten Drop-Pool.</p></div><button class="bc-info-circle" data-bc-section-info="packs" title="Pack-Übersicht">i</button>${autoHtml}</div><div class="bc-pack-categories">${categories.map(([id,label,icon])=>`<button data-bc-pack-category="${id}" class="${cat===id?"active":""}"><span>${icon}</span><b>${label}</b></button>`).join("")}</div><div class="bc-pack-grid">${freeHtml}${winsHtml}${payHtml}</div></section>`;
  }

  function showCollectionScoreInfo(kind){
    const data={
      f2p:["Gesamter F2P-Score","Zählt ausschließlich normale Karten von Gewöhnlich bis Göttlich. Jede Karte trägt mit ihrer höchsten erreichten Kartenstufe bei. 100 % bedeutet: alle normalen Karten wurden mindestens bis Kartenlevel 5 aufgebaut. Exclusive, VIP, Wins und Hyper verändern diesen Score nicht."],
      rebirth:["Gesamter Rebirth-Score","Misst Karten-Rebirth getrennt von der normalen Sammlung. In der Auswahl kannst du Gewöhnlich bis Göttlich, Exclusive, Wins, VIP oder Hyper prüfen. Bei normalen Bereichen bedeutet 100 %: jede Karte dieses Bereichs hat RB5 erreicht. Bei Hyper zählen Karten-Rebirth zu 70 % und Generation 1–4 zu 30 %; 100 % braucht dort RB5 und Generation 4 auf allen Hyper-Karten."],
      pay:["Gesamter Pay-Score","Zählt nur die Sammlungsausbaustufen von Exclusive- und VIP-Karten. Er ist bewusst vom normalen F2P-Score getrennt. Wins und Hyper werden hier nicht eingerechnet, damit bezahlte Karten den normalen Sammlungsfortschritt nicht verfälschen."]
    }[kind];if(!data)return;
    showModal(`<div class="bc-score-info-modal"><small>SAMMLUNG · SCHNELLINFO</small><h2>${esc(data[0])}</h2><p>${esc(data[1])}</p><button data-bc-modal-close>Verstanden</button></div>`);
  }
  function collectionScoreCardsHtml(totalScore,rebirthScore,payScore,complete){
    const cards=[];
    if(uiPref("showF2PScore"))cards.push(`<div class="bc-total-collection-score ${complete?"complete":""}"><button class="bc-score-info-button" data-bc-score-info="f2p" title="F2P-Score Info">i</button><small>GESAMTER SCORE · FREE-TO-PLAY</small><strong>${scorePct(totalScore)}</strong></div>`);
    if(uiPref("showRebirthScore"))cards.push(`<div class="bc-total-collection-score rebirth"><button class="bc-score-info-button" data-bc-score-info="rebirth" title="Rebirth-Score Info">i</button><small>GESAMTER REBIRTH-SCORE</small><strong>${scorePct(rebirthScore)}</strong><select data-bc-rebirth-score-tier aria-label="Rebirth-Score Bereich auswählen">${rebirthScoreOptionsHtml()}</select></div>`);
    if(uiPref("showPayScore"))cards.push(`<div class="bc-total-collection-score pay"><button class="bc-score-info-button" data-bc-score-info="pay" title="Pay-Score Info">i</button><small>GESAMTER PAY-SCORE</small><strong>${scorePct(payScore)}</strong></div>`);
    return cards.length?`<div class="bc-collection-score-row">${cards.join("")}</div>`:"";
  }

  function collectionHtml(){
    const tier=UI.collectionTier,hyper=tier===16,wins=tier===15,vip=tier===14,exclusive=tier===13,search=UI.collectionSearch.trim().toLowerCase(),ownedByKey=collectionOwnedIndex()[tier]||new Map();
    let entries=hyper?HYPER_CARDS.map((hm,i)=>({key:`h:${hm.id}`,name:hm.name,base:i,hyper:true,hyperId:hm.id,rarityValue:hm.chance,rarity:hm.rarity})):wins?WIN_CARDS.map((wm,i)=>({key:`w:${wm.id}`,name:wm.name,base:i,win:true,winPack:wm.packIndex,rarityValue:wm.chance,rarity:wm.rarity})):vip?VIP_CARDS.map((vm,i)=>({key:`v:${vm.id}`,name:vm.name,base:i,vip:true,rarityValue:vm.rarityValue,rarity:vm.rarity})):exclusive?EXCLUSIVES.map((ex,i)=>({key:`x:${ex.id}`,name:ex.name,base:i,exclusive:true,rarityValue:ex.rarityValue})):BASE_NAMES.map((name,base)=>({key:variantKey(tier,base),name,base,exclusive:false,rarityValue:rarityValue(base)}));
    if(search)entries=entries.filter(e=>e.name.toLowerCase().includes(search));
    const per=48,pages=Math.max(1,Math.ceil(entries.length/per)),page=Math.min(UI.collectionPage,pages-1),slice=entries.slice(page*per,page*per+per),discovered=hyper?hyperCount():wins?winCount():vip?vipCount():exclusive?exclusiveCount():Object.keys(S.collection).filter(k=>k.startsWith(`${tier}:`)).length,totalScore=overallCollectionScore(),rebirthScore=overallRebirthScore(),payScore=payCollectionScore(),selectedRbTier=clamp(Math.floor(Number(UI.rebirthScoreTier)||0),0,16),complete=collectionComplete();
    const specialProgress=hyper?`${discovered}/${HYPER_CARDS.length} Hyper-Karten · Kampf-Endgame · nur Hyper Set`:wins?`${discovered}/${WIN_CARDS.length} Wins-Karten · vollständig erspielbar · eigener F2P-Bonus-Score`:vip?`${discovered}/${VIP_CARDS.length} VIP-Karten · Pay-Score · zählt nicht zum F2P-Hauptscore`:exclusive?`${discovered}/${EXCLUSIVES.length} Exclusive · Pay-Score · zählt nicht zum F2P-Hauptscore`:`${discovered}/${BASE_NAMES.length}`;
    return `<section class="bc-section bc-collection"><div class="bc-section-title bc-collection-title"><div><small>MUSEUM & INVENTAR</small><h2>Sammlungsalbum</h2><p>${collectionCount()} / ${RARITIES.length*BASE_NAMES.length} normal · ${winCount()} / ${WIN_CARDS.length} Wins · ${exclusiveCount()} / ${EXCLUSIVES.length} Exclusive · ${vipCount()} / ${VIP_CARDS.length} VIP · ${hyperCount()} / ${HYPER_CARDS.length} Hyper</p></div><button class="bc-info-circle" data-bc-section-info="collection" title="Sammlungs-Info">i</button></div>${collectionScoreCardsHtml(totalScore,rebirthScore,payScore,complete)}<div class="bc-collection-search-row" style="flex-wrap:wrap;gap:10px"><input data-bc-collection-search placeholder="Karte suchen …" value="${esc(UI.collectionSearch)}"><div class="bc-bulk-actions"><button class="bc-primary bc-bulk-level-button" data-bc-bulk-level>${bulkLevelButtonText()}</button><button class="bc-primary bc-bulk-rebirth-button" data-bc-bulk-rebirth>${bulkRebirthButtonText()}</button></div></div><div class="bc-rarity-tabs" data-bc-rarity-tabs>${RARITIES.map((r,i)=>`<div class="bc-rarity-score-item"><span>${scorePct(collectionTierScore(i))}</span><button class="rar-${r.id} ${tier===i?"active":""}" data-bc-tier="${i}">${r.name}</button></div>`).join("")}<div class="bc-rarity-score-item exclusive-score"><span>${scorePct(collectionTierScore(13))}</span><button class="exclusive ${exclusive?"active":""}" data-bc-tier="13">Exclusive</button></div><div class="bc-rarity-score-item wins-score"><span>${scorePct(collectionTierScore(15))}</span><button class="wins ${wins?"active":""}" data-bc-tier="15">Wins</button></div><div class="bc-rarity-score-item vip-score"><span>${scorePct(collectionTierScore(14))}</span><button class="vip ${vip?"active":""}" data-bc-tier="14">VIP</button></div><div class="bc-rarity-score-item hyper-score"><span>${scorePct(collectionTierScore(16))}</span><button class="hyper ${hyper?"active":""}" data-bc-tier="16">Hyper</button></div></div><div class="bc-album-progress"><b>${specialProgress} entdeckt · Score ${scorePct(collectionTierScore(tier))}</b><div><i style="width:${Math.min(100,collectionTierScore(tier))}%"></i></div></div><div class="bc-card-grid">${slice.map(entry=>albumCardHtml(entry,ownedByKey.get(entry.key)||[],tier)).join("")||`<div class="bc-empty-state"><span>🔎</span><h3>Keine Treffer</h3></div>`}</div><div class="bc-pagination"><button data-bc-page="${page-1}" ${page<=0?"disabled":""}>←</button><div class="bc-page-jump ${UI.collectionPageMenu?"open":""}"><button class="bc-page-current" data-bc-page-menu title="Seite auswählen">${page+1}</button><span>/</span><button class="bc-page-max" data-bc-page="${pages-1}" title="Zur letzten Seite">${pages}</button>${UI.collectionPageMenu?`<div class="bc-page-popup">${Array.from({length:pages},(_,i)=>`<button data-bc-page-choice="${i}" class="${i===page?"active":""}">${i+1}</button>`).join("")}</div>`:""}</div><button data-bc-page="${page+1}" ${page>=pages-1?"disabled":""}>→</button></div></section>`;
  }
  function albumCardHtml(entry,owned,tier){
    if(!owned.length){const hyper=!!entry.hyper,r=hyper?{id:"hyper",name:`Hyper ${hyperTierMeta(hyperCardBy(entry.hyperId)).name}`}:(entry.win||entry.vip)?(RARITIES[entry.rarity]||RARITIES[0]):entry.exclusive?{id:"exclusive",name:"Exclusive"}:RARITIES[tier],className=hyper?`rar-hyper hyper-gen-1 hyper-tier-${hyperTierMeta(hyperCardBy(entry.hyperId)).id}`:entry.win?`rar-${r.id} rar-wins`:entry.vip?`rar-${r.id} rar-vip`:entry.exclusive?"rar-exclusive":`rar-${r.id}`,label=hyper?`HYPER · ${hyperTierMeta(hyperCardBy(entry.hyperId)).name}`:entry.win?`WINS · ${r.name}`:entry.vip?`VIP · ${r.name}`:entry.exclusive?"EXCLUSIVE":r.name;return `<article class="bc-inventory-card unknown ${className}"><div class="bc-card-art"><span>?</span></div><small>${label} · ${pct(entry.rarityValue)}</small><b>???</b><span>Nicht entdeckt</span><i>Sammlungsplatz ${entry.base+1}</i></article>`;}
    const sorter=(a,b)=>featuredProgressCompareV424(b,a)||effectivePoints(b)-effectivePoints(a),brokenOwned=owned.filter(x=>x.broken).sort(sorter),featured=instance(S.featuredCardId),featuredHere=featured&&collectionKey(featured)===entry.key&&owned.some(x=>x.id===featured.id)?featured:null,healthyOwned=owned.filter(x=>!x.broken).sort(sorter),best=(featuredHere||healthyOwned[0]||brokenOwned[0]||owned.slice().sort(sorter)[0]),m=cardMeta(best),copies=owned.length,dupes=Math.max(0,copies-1),brokenCount=brokenOwned.length,label=best.hyper?`HYPER · G${hyperGeneration(best)} · R${cardRank(best)} · ${m.hyperTier?.name||""}`:best.win?`WINS PACK ${(Number(best.winPack)||0)+1} · ${m.rarity.name}`:best.vip?`VIP · ${m.rarity.name}`:best.exclusive?"EXCLUSIVE":m.rarity.name;
    return `<button class="bc-inventory-card ${m.className} shiny-${best.shiny} ${best.broken?"broken":""} ${cardRebirth(best)?"has-rebirth":""}" data-bc-card="${best.id}"><div class="bc-card-art"><span>${m.icon}</span>${collectionEquipmentVisualHtml(best)}${cardRebirthBadge(best)}${cardEffectBadges(best,{rebirth:false})}${best.broken?'<span class="bc-card-crack" aria-hidden="true"></span>':""}${best.favorite?'<em class="bc-favorite-badge">★</em>':""}<em class="bc-copy-count"><strong>×${copies}</strong><small>${dupes} ${dupes===1?"Duplikat":"Duplikate"}</small>${brokenCount?`<small class="bc-broken-copy">💥 ${brokenCount} kaputt</small>`:""}</em></div><small>${label} · ${pct(m.rarityValue)}</small><b>${esc(m.name)}</b><span>Lv ${best.level}/5 · ${fmt(m.points)}/s · ${copies} Exemplar${copies===1?"":"e"}${featuredHere?" · ★ Karte-Slot":""}</span><i>⚔ Kampfwert ${fmt(m.combat.power)} · Schaden ${fmt(m.combat.min)}–${fmt(m.combat.max)}</i>${best.broken?`<i class="bc-broken-label">KAPUTT · ${repairKitMeta(repairKitId(best)).name} + ${fmt(repairCost(best))} Points</i>`:""}<i>${best.aura?`${auraBy(best.aura)?.icon} ${auraBy(best.aura)?.name}`:"Keine Aura"} · ${best.combatAura?`${combatAuraBy(best.combatAura)?.icon} ${combatAuraBy(best.combatAura)?.name}`:"Keine Kampf-Aura"}</i><i>${best.bind?`${bindBy(best.bind)?.icon} ${bindBy(best.bind)?.name}`:"Keine Bindung"}</i></button>`;
  }
  function renderCollectionFast(){
    if(UI.tab!=="collection"||!UI.main)return refresh(false);
    const oldRarityScroll=Math.max(0,UI.overlay?.querySelector("[data-bc-rarity-tabs]")?.scrollLeft||UI.rarityScroll||0);
    UI.main.innerHTML=collectionHtml();
    UI.rarityScroll=oldRarityScroll;
    requestAnimationFrame(()=>{
      const rarity=UI.overlay?.querySelector("[data-bc-rarity-tabs]");
      if(rarity){const max=Math.max(0,rarity.scrollWidth-rarity.clientWidth);rarity.scrollLeft=Math.min(oldRarityScroll,max);}
    });
  }

  function shopHtml(){const auraCount=Object.values(S.auraInventory).reduce((a,b)=>a+b,0),combatAuraCount=Object.values(S.combatAuraInventory).reduce((a,b)=>a+b,0),rebirthLevel=rebirthRequiredLevel(),rebirthPoints=rebirthPointCost(),rebirthWins=rebirthWinCost(),rebirthOk=rebirthReady();return `<section class="bc-section"><div class="bc-section-title"><div><small>MARKTHALLE AM KARTENHAFEN</small><h2>BigCards Shop</h2><p>Upgrades, Spuren, Ausrüstung, Verkauf und Komfort. Packs bleiben im eigenen oberen Tab.</p></div><div class="bc-section-title-actions"><button class="bc-info-circle" data-bc-section-info="shop" title="Shop-Info">i</button><button class="bc-jk" data-bc-jkshop>JK/Coin-Shop öffnen</button></div></div><div class="bc-shop-panels"><article class="bc-shop-vip-card bc-shop-info-card"><button class="bc-shop-info" data-bc-vip-info title="Info zu BigCards VIP" aria-label="Info zu BigCards VIP">i</button><span>👑</span><h3>BigCards VIP</h3><p>${S.vipUnlocked?`Dauerhaft freigeschaltet · ${vipCount()}/${VIP_CARDS.length} VIP-Karten entdeckt.`:"500 JK/Coin einmalig · tägliches Glücksrad, VIP-Klicker, 100 VIP-Karten und Boss-Specials."}</p><div class="bc-shop-dual-actions"><button data-bc-tab="vipWheel">VIP-Glücksrad</button><button data-bc-tab="vipClicker">VIP-Klicker</button></div></article><article class="bc-shop-trail-card bc-shop-info-card"><button class="bc-shop-info" data-bc-trail-info title="Info zu Spuren" aria-label="Info zu Spuren">i</button><span>☄️</span><h3>Spuren</h3><p>Exklusive Designs und starke Boni für deine persönliche Karte. Freigeschaltet bis: ${TRAILS[S.trailTierUnlocked]?.name||TRAILS[0].name}.</p><button data-bc-trail-shop>Spuren öffnen</button></article><article class="bc-shop-info-card bc-shop-upgrade-card"><button class="bc-shop-info" data-bc-card-upgrade-info title="Info zu Karten verbessern" aria-label="Info zu Karten verbessern">i</button><span>⚒️</span><h3>Karten verbessern</h3><p>Level 1–5 mit Duplikaten + Points. Zerbrochene Karten brauchen ein passendes Reparatur-Kit.</p><div class="bc-shop-dual-actions"><button data-bc-tab="collection">Smlg. öffnen</button><button class="bc-potion-short" data-bc-potion-shop>Tränke</button><button class="bc-rep-short" data-bc-repair-shop>Rep.</button></div><small class="bc-repair-stock">Reparatur-Kits im Inventar: ${Object.values(S.repairKits||{}).reduce((a,b)=>a+(Number(b)||0),0)}</small></article><article class="bc-shop-info-card"><button class="bc-shop-info" data-bc-equipment-info="aura" title="Info zu Auras" aria-label="Info zu Auras">i</button><span>✦</span><h3>Auras</h3><p>Alle Auras mit Points kaufbar oder kostenlos erspielbar. Points-Auras: ${auraCount} · Kampf-Auras: ${combatAuraCount}</p><button data-bc-equipment="aura">Auras · Kaufen & Freischalten</button></article><article class="bc-shop-info-card"><button class="bc-shop-info" data-bc-equipment-info="bind" title="Info zu Bindungen" aria-label="Info zu Bindungen">i</button><span>🔗</span><h3>Bindungen</h3><p>Alle Bindungen mit Points kaufbar oder kostenlos erspielbar. Inventar: ${Object.values(S.bindInventory).reduce((a,b)=>a+b,0)}</p><button data-bc-equipment="bind">Bindungen · Kaufen & Freischalten</button></article><article class="bc-shop-info-card"><button class="bc-shop-info" data-bc-equipment-info="shiny" title="Info zu Shiny" aria-label="Info zu Shiny">i</button><span>⚡</span><h3>Shiny</h3><p>Electric ab Lv3 · Explosive ab Lv4 · Void ab Lv5.</p><button data-bc-equipment="shiny">Shiny verwalten</button></article><article class="bc-shop-info-card"><button class="bc-shop-info" data-bc-shards-info title="Info zu Card Shards" aria-label="Info zu Card Shards">i</button><span>♻️</span><h3>Card Shards</h3><p>${fmt(S.shards)} Shards. Zerlege nicht benötigte Duplikate im Kartendetail.</p></article></div><div class="bc-rebirth-shop"><div><small>REBIRTH CENTER</small><h3>${rebirthOk?"Normaler Rebirth bereit":`🔒 Level ${rebirthLevel} + Points + Wins benötigt`}</h3><p>Stockwerk ${S.phase+1}: Level ${rebirthLevel} + ${fmt(rebirthPoints)} Points + ${rebirthWins} Wins. Aktuell: Level ${S.level}, ${fmt(S.points)} Points, ${S.winsCurrency} Wins. Rebirth behält Karten, Sammlung, Upgrades, Auras, Kampf-Auras, Bindungen und Shiny.</p><button data-bc-rebirth ${!rebirthOk?"disabled":""}>Normaler Rebirth</button></div><div><small>JK/COIN SKIP</small><h3>Rebirth für exakt 300 JK-Coins</h3><p>Überspringt die normalen Level-, Points- und Wins-Anforderungen des aktuellen Rebirths und zählt als vollständiger Rebirth.</p><button data-bc-rebirth-skip>300 JK/Coin</button></div></div></section>`}
  function showMarketInfo(){
    const odds01=Math.round(INTERNAL_WEIGHT_SUM/.1),odds07=Math.round(INTERNAL_WEIGHT_SUM/.7);
    showModal(`<div class="bc-market-info"><small>MARKT · SAMMLERWERT</small><h2>🏪 Seltenheit, echte Verkäufe & Kartenwert</h2><p>Die <b>Farbe</b> und der <b>individuelle Raritätswert</b> sind getrennt. Selbst eine gewöhnliche graue Karte kann ein High-End-Sammlerstück sein.</p><div class="bc-market-info-grid"><article><b>📉 Je kleiner, desto seltener</b><span>100 % ist häufig. Unter 1 % beginnt der extreme Sammlerbereich.</span></article><article><b>💎 0,7 % ist bereits extrem</b><span>Intern ungefähr 1 von ${fmt(odds07)} Motivauswahlen – noch vor der Pack-Raritätsstufe.</span></article><article class="ultra"><b>🔥 0,1 % ist ein Extremfund</b><span>Intern ungefähr 1 von ${fmt(odds01)} Motivauswahlen. Eine graue 0,1-%-Karte kann deshalb extrem wertvoll sein.</span></article><article><b>📊 Echte Marktdaten</b><span>Letzter Verkauf, 7-Tage-Referenz, Trend, aktuelle Angebote und <b>wie oft genau diese Kartenvariante bereits verkauft wurde</b> werden gespeichert.</span></article><article><b>🔁 Verkaufshäufigkeit mindert Sammlerwert</b><span>Je öfter dieselbe Variante erfolgreich gehandelt wurde, desto geringer wird ihr Knappheits-/Sammlerfaktor. Selten gehandelte Karten behalten dadurch einen stärkeren Sammleraufschlag.</span></article><article><b>🛡 Manipulationsschutz</b><span>Der Referenzpreis nutzt echte Verkäufe und dämpft Ausreißer. Eigene Angebote können nicht selbst gekauft werden.</span></article></div><div class="bc-market-info-warning"><b>Wichtig:</b> Spieler bestimmen weiterhin den Angebotspreis. Die Verkaufshäufigkeit beeinflusst nur den angezeigten Sammler-/Referenzwert – sie setzt keine harte Preisgrenze.</div><button class="bc-primary" data-bc-modal-close>Verstanden</button></div>`);
  }
  function marketHtml(){const boss=bossDefinition(),demand=(boss.tags||[]).map(id=>SET_BY_ID[id]?.name||id).join(" · ");return `<section class="bc-section"><div class="bc-section-title"><div><small>SPIELER-MARKT</small><h2>Online-Marktplatz</h2><p>Verkäufe bilden Referenzpreise und einen sichtbaren Sammlerwert. Zusätzlich bleibt der Markt auch bei wenig Spielerangeboten belebt.</p></div><div class="bc-market-title-actions"><button data-bc-market-refresh>Aktualisieren</button><button class="bc-market-info-btn bc-info-circle" data-bc-market-info title="Markt-Info" aria-label="Markt-Info">i</button></div></div><div class="bc-market-boss-demand"><span>👹</span><div><b>Aktuelle Wochenboss-Nachfrage</b><small>${esc(demand||"wechselnde Sets")} · passende Karten tauchen im Markt etwas häufiger auf.</small></div></div><div class="bc-market-note">Gelistete Karten werden gesperrt. Verkaufsanzahl, 7-Tage-Referenz und Handelstrend werden je exakter Kartenvariante geführt. Häufiger Handel senkt den Sammlerfaktor. Sehr seltene Markt-Funde bleiben außergewöhnlich und sind entsprechend teuer.</div><div class="bc-market-grid">${UI.market.length?UI.market.map(marketListingHtml).join(""):`<div class="bc-empty-state"><span>🏪</span><h3>Keine Angebote geladen</h3><p>Drücke auf Aktualisieren oder stelle eine Karte aus deinem Album ein.</p></div>`}</div><h3>Eigene Karte einstellen</h3><div class="bc-market-own">${marketOwnTopCards(12).map(x=>{const key=marketCardKeyFromInst(x),stats=marketStatsForKey(key),ref=marketAdjustedReference(stats);return `<button data-bc-list-card="${x.id}">${esc(cardMeta(x).name)}<small>${fusionLabel(x)} · ${stats?`${fmt(stats.salesCount||0)}× verkauft · `:""}${fmt(ref||sellValue(x))} Richtwert</small></button>`}).join("")||"Keine freie Karte verfügbar."}</div></section>`}
  function marketListingHtml(l){const d=l.card||{},r=d.hyper?{name:`Hyper ${hyperTierMeta(hyperCardBy(d.hyperId)).name}`,id:"hyper"}:d.vip?(RARITIES[d.rarity]||RARITIES[0]):d.exclusive?{name:"Exclusive",id:"exclusive"}:RARITIES[d.rarity]||RARITIES[0],key=marketCardKeyFromCard(d),stats=marketStatsForKey(key),ref=marketAdjustedReference(stats),count=Math.max(0,Math.floor(Number(stats?.salesCount)||0)),factor=marketFrequencyFactor(count),className=d.hyper?`rar-hyper hyper-gen-${clamp(Math.floor(Number(d.hyperGeneration)||1),1,4)} hyper-tier-${hyperTierMeta(hyperCardBy(d.hyperId)).id}`:`rar-${r.id} ${d.win?"rar-wins":""} ${d.vip?"rar-vip":""}`;return `<article class="bc-market-card ${className} ${d.fusion==="prismatic"?"fusion-prismatic":d.fusion==="holo"?"fusion-holo":""}"><small>${d.hyper?`HYPER · G${clamp(Math.floor(Number(d.hyperGeneration)||1),1,4)} · `:d.win?"WINS · ":d.vip?"VIP · ":d.exclusive?"EXCLUSIVE · ":""}${esc(r.name)} · ${pct(d.rarityValue||100)} · ${d.fusion==="prismatic"?"◇ PRISM":d.fusion==="holo"?"◈ HOLO":"NORMAL"}</small><h3>${esc(d.name||"Karte")}</h3><p>Lv ${d.level||1}${d.cardRebirth?` · ↻ Rebirth ${d.cardRebirth}/5`:""}${d.hyper?` · Rank ${Math.floor(Number(d.rank)||0)}/10`:""} · ${fmt(d.points||0)}/s · ${fmt(d.xp||0)} XP/s</p><p>⚔ Kampfwert ${d.combatPower?fmt(d.combatPower):"–"}${d.combatMin?` · Schaden ${fmt(d.combatMin)}–${fmt(d.combatMax||d.combatMin)}`:""}</p><div class="bc-market-live-stats"><span>🔁 <b>${fmt(count)}× verkauft</b></span><span>📈 7T-Referenz <b>${ref?fmt(ref):"zu wenig Daten"}</b></span><span>💎 Sammlerfaktor <b>${Math.round(factor*100)} %</b></span></div><span>Verkäufer: ${esc(l.sellerName||"Spieler")}</span><b>${fmt(l.price)} Points</b><div class="bc-market-card-actions"><button class="bc-market-stats-btn" data-bc-market-stats="${esc(key)}">Marktdaten</button>${l.sellerUid===currentUidSync()?`<button data-bc-cancel-listing="${esc(l.id)}">Zurücknehmen</button>`:`<button data-bc-buy-listing="${esc(l.id)}">Kaufen</button>`}</div></article>`;}
  function scoreHtml(){return `<section class="bc-section"><div class="bc-section-title"><div><small>LIFETIME SCORE</small><h2>Beste Spieler</h2><p>Der Score kann nur steigen und nutzt Bestwerte sowie Lifetime-Fortschritt. Das angezeigte Level ist dagegen immer dein <b>aktuelles</b> Level nach einem Rebirth.</p></div><div class="bc-section-title-actions"><button class="bc-info-circle" data-bc-section-info="score" title="Ranglisten-Info">i</button><button data-bc-score-refresh>Online aktualisieren</button></div></div><div class="bc-own-score"><div><small>DEIN SCORE</small><b>${fmt(S.lifetimeScore)}</b></div><div><small>AKTUELLES LEVEL</small><b>${S.level}</b></div><div><small>REBIRTHS LIFETIME</small><b>${lifetimeRebirthCount()}</b></div><div><small>PRESTIGE</small><b>◆ ${prestigeCount()}</b></div><div><small>BESTE PRODUKTION</small><b>${fmt(S.highestProductionEver)}/s</b></div><div><small>BESTE XP</small><b>${fmt(S.highestXpProductionEver)}/s</b></div></div><div class="bc-leaderboard">${UI.leaderboard.length?UI.leaderboard.map((p,i)=>`<article><strong>#${i+1}</strong><div><b>${esc(p.displayName||"Spieler")}</b><small>Level ${Math.max(1,Math.floor(Number(p.currentLevel??p.level??p.maxLevelEver)||1))} · ${p.collectionDiscovered||0}/6.500 · ${p.totalRebirths||0} Rebirths · ◆ ${p.prestigeCount||0} Prestige</small></div><span>${fmt(p.lifetimeScore)}</span></article>`).join(""):`<div class="bc-empty-state"><span>🏆</span><h3>Online-Rangliste noch nicht geladen</h3><p>Dein lokaler Lifetime-Score läuft bereits.</p></div>`}</div></section>`}
  function battleAbilityOrbHtml(ability,player,session){
    if(!ability||!player||!session)return "";
    const levelLocked=!ability.normal&&player.level<(ability.req||1);
    const disabled=!!ability.locked||levelLocked||session.turn!=="player";
    const hint=levelLocked?`ab Stufe ${ability.req}`:(ability.normal?(session.playerState.mustNormal?"Pflichtschlag":"Normaler Schlag"):(ability.desc||"Special"));
    return `<button type="button" data-bc-battle-action="${ability.id}" class="bc-battle-orb ${ability.normal?"normal":"special"}" ${disabled?"disabled":""} title="${esc(ability.name)} – ${esc(hint)}"><span>${ability.icon}</span><b>${esc(ability.name)}</b><small>${esc(hint)}</small></button>`;
  }
  function battleHitHtml(session,target){const hit=session?.lastHit;if(!hit||hit.target!==target)return"";return `<div class="bc-battle-hit ${target}"><strong>-${fmt(hit.damage)}</strong><small>${esc(hit.icon||"💥")} ${esc(hit.name||"Treffer")}</small></div>`;}
  function spendWins(kind){
    const costs={dust:20,repair:35,boss:50},cost=costs[kind]||0;if(!cost||S.winsCurrency<cost)return toast(`Nicht genügend Wins. Du hast ${S.winsCurrency}/${WIN_CAP}.`);
    if(kind==="dust")S.fusionDust+=100;
    else if(kind==="repair"){S.repairKits.wins=repairKitCount("wins")+1;}
    else if(kind==="boss"){const d=ensureBossDaily();if(d.bonusTickets>=2)return toast("Du hast für heute bereits das Maximum von 2 Bonus-Boss-Tickets.");d.bonusTickets++;}
    S.winsCurrency-=cost;persist();refresh(false);toast(kind==="dust"?"100 Fusionsstaub erhalten.":kind==="repair"?"1× Wins Reparatur-Pack erhalten.":"+1 Boss-Bonusticket erhalten.");
  }

  function battleHtml(){
    const selected=ensureBattleCard(),m=selected?cardMeta(selected):null,r=UI.battleResult,session=UI.battleSession,cooldown=Math.max(0,Math.ceil(((S.battleCooldownUntil||0)-now())/1000));
    const player=session?instance(session.playerId):selected,pm=player?cardMeta(player):m,enemy=session?.enemy||null,em=enemy?cardMeta(enemy):null;
    const playerHp=session?session.playerHp:(pm?.combat.hp||0),playerMaxHp=session?(session.playerMaxHp||pm?.combat.hp||0):(pm?.combat.hp||0),enemyHp=session?session.enemyHp:(em?.combat.hp||0),playerPct=session&&playerMaxHp?clamp(playerHp/playerMaxHp*100,0,100):100,enemyPct=session&&em?.combat.hp?clamp(enemyHp/em.combat.hp*100,0,100):100;
    const abilities=session&&player?combatAbilities(player,session.playerState):[];
    const battleProgress=battleUpgradeInfo(),currentBattleRarity=RARITIES[battleProgress.current],nextBattleRarity=battleProgress.next?RARITIES[battleProgress.next.unlock]:null,progressPct=battleProgress.next?clamp(battleProgress.wins/battleProgress.next.wins*100,0,100):100;
    const playerCard=selected?`<article class="bc-battle-fighter ${m.className} ${selected.broken?"broken":""}"><small>DEINE KAMPFKARTE</small>${battleProgressBadgesHtml(selected)}${battleEquipmentBadgesHtml(selected)}<div class="bc-battle-icon">${m.icon}${selected.broken?'<span class="bc-card-crack" aria-hidden="true"></span>':""}</div><h3>${esc(m.name)}</h3><b>⚔ Kampfwert ${fmt(m.combat.power)}</b><span>Schaden ${fmt(m.combat.min)}–${fmt(m.combat.max)} · Leben ${fmt(m.combat.hp)}</span><em>${selected.hyper?`HYPER · Generation ${hyperGeneration(selected)} · Rank ${cardRank(selected)} · reiner Kampffokus`:selected.vip?`VIP · ${m.rarity.name}`:selected.exclusive?`EXCLUSIVE · skaliert mit deinem normalen Kartenfortschritt`:`${m.rarity.name}`} · Kartenstufe ${selected.level}/5 · Rank ${cardRank(selected)}/10${selected.id===S.featuredCardId?" · ★ Persönliche Karte":""}${selected.combatAura?` · ${combatAuraBy(selected.combatAura)?.name}`:""}</em>${selected.id===S.featuredCardId&&featuredBackupCard(selected)?`<span class="bc-battle-backup-ready">🛡 Backup: ${esc(cardMeta(featuredBackupCard(selected)).name)} · ${featuredBackupCard(selected).broken?"KAPUTT":"bereit"}</span>`:""}${selected.broken?`<div class="bc-battle-broken"><b>💥 KARTE KAPUTT</b><span>Reparatur: 1× ${repairKitMeta(repairKitId(selected)).name} + ${fmt(repairCost(selected))} Points</span><div class="bc-battle-broken-actions"><button data-bc-battle-picker>Andere Karte wählen</button><button data-bc-battle-repair="${selected.id}">In Sammlung reparieren</button></div></div>`:`<div class="bc-battle-actions"><button data-bc-battle-picker>Karte wechseln</button><button class="primary" data-bc-battle-start ${cooldown||session?"disabled":""}>${session?"Kampf läuft":cooldown?`Nächster Kampf in ${cooldown}s`:"⚔ Kampf starten"}</button></div>`}</article>`:"";
    const fightPlayer=session&&pm?`<article class="bc-battle-fighter ${pm.className} ${session.lastHit?.target==="player"?"hit-now":""}"><small>${session.activeRole==="backup"?"🛡 BACKUP-KARTE AKTIV":"DEINE HAUPTKARTE"} · RUNDE ${session.round}</small>${battleHitHtml(session,"player")}${battleProgressBadgesHtml(player)}${battleEquipmentBadgesHtml(player)}<div class="bc-battle-icon">${pm.icon}</div><h3>${esc(pm.name)}</h3><div class="bc-battle-hp"><span><i style="width:${playerPct}%"></i></span><b>${fmt(playerHp)} / ${fmt(playerMaxHp)} HP</b></div><small>⚔ ${fmt(pm.combat.power)} · Schaden ${fmt(pm.combat.min)}–${fmt(pm.combat.max)} · Rank ${cardRank(player)}/10</small>${session.playerPotion?`<em class="bc-active-potion">${session.playerPotion.icon} ${session.playerPotion.name} · ${session.playerPotion.effectText}</em>`:""}</article>`:"";
    const fightEnemy=session&&em?`<article class="bc-battle-fighter enemy ${em.className} ${session.lastHit?.target==="enemy"?"hit-now":""}"><small>${enemy.difficultyShift>0?"⚠ STÄRKERER GEGNER":enemy.difficultyShift<0?"SCHWÄCHERER GEGNER":"GEGNER"}</small>${battleHitHtml(session,"enemy")}<div class="bc-battle-icon">${em.icon}</div><h3>${esc(em.name)}</h3><div class="bc-battle-hp"><span><i style="width:${enemyPct}%"></i></span><b>${fmt(enemyHp)} / ${fmt(em.combat.hp)} HP</b></div><span>${RARITIES[enemy.rarity]?.name} · Lv ${enemy.level}/5</span><small>⚔ ${fmt(em.combat.power)} · Schaden ${fmt(em.combat.min)}–${fmt(em.combat.max)}</small></article>`:"";
    const normalAbility=abilities.find(a=>a.normal)||null,activeSpecialAbility=battleDisplayedSpecialAbility(abilities,player);
    const backupSwitch=session&&session.activeRole!=="backup"&&battleBackupForSession(session)?`<button class="bc-battle-backup-switch" data-bc-battle-backup-switch ${session.turn!=="player"?"disabled":""}>🛡 Auf Backup wechseln · ${esc(cardMeta(battleBackupForSession(session)).name)}</button>`:"";
    const middleControls=session?`<div class="bc-battle-center-controls"><small class="bc-battle-turn-state ${session.turn}">${session.turn==="player"?(session.playerState.mustNormal?"NORMALER SCHLAG PFLICHT":"DU BIST DRAN"):"GEGNER GREIFT AN …"}</small><div class="bc-battle-control-row"><div class="bc-battle-action-side normal-side">${battleAbilityOrbHtml(normalAbility,player,session)}</div><div class="bc-battle-vs compact"><span>VS</span><small>RUNDE ${session.round}</small></div><div class="bc-battle-action-side special-side count-${activeSpecialAbility?1:0}">${activeSpecialAbility?battleAbilityOrbHtml(activeSpecialAbility,player,session):`<div class="bc-battle-no-special"><span>—</span><small>Kein Special</small></div>`}</div></div>${backupSwitch}<p>${session.playerState.mustNormal?"Nach diesem Schlag werden deine Specials wieder verfügbar.":session.activeRole==="backup"?"Backup aktiv · die Hauptkarte kann in diesem Kampf nicht zurückgewechselt werden.":"Links normal schlagen · rechts steht immer nur deine aktuell höchste freigeschaltete Special-Attacke."}</p></div>`:"";
    const arena=session?`<div class="bc-battle-arena active-fight">${fightPlayer}${middleControls}${fightEnemy}</div><div class="bc-battle-live-panel"><div><small>AKTUELLER KAMPF</small><b>Letzte Aktionen</b></div><div class="bc-battle-live-log">${session.log.slice(-8).map(x=>`<span>${esc(x)}</span>`).join("")}</div></div>`:(selected?`<div class="bc-battle-arena">${playerCard}<div class="bc-battle-vs"><span>VS</span><small>Gegner wird erst nach „Kampf starten“ aufgedeckt</small></div><article class="bc-battle-fighter enemy hidden-enemy"><small>GEGNER</small><div class="bc-battle-icon">❓</div><h3>Noch unbekannt</h3><b>Zufällige Stärke</b><span>Der Gegner kann schwächer, ähnlich oder auch deutlich stärker sein.</span><em>Bei einer Niederlage zerbricht deine Karte.</em></article></div>`:`<div class="bc-empty-state"><span>⚔</span><h3>Keine Kampfkarte vorhanden</h3><p>Öffne ein Pack oder repariere deine kaputten Karten in der Sammlung.</p><button data-bc-tab="collection">Zur Sammlung</button></div>`);
    const winsUse=`<section class="bc-wins-use"><div><small>🏆 WINS-WÄHRUNG <button class="bc-inline-info" data-bc-wins-info title="Wins Info">i</button></small><h3>Siegesserien werden wertvoller</h3><p>1–2er Serie = 1 Win · 3–4 = 2 · 5–6 = 3 · 7–9 = 4 · ab 10 = maximal 5 Wins pro Sieg. Bestand MAX ${WIN_CAP}.</p></div><div class="bc-wins-use-actions"><button data-bc-wins-spend="dust" ${S.winsCurrency<20?"disabled":""}>20 Wins → 100 Fusionsstaub</button><button data-bc-wins-spend="repair" ${S.winsCurrency<35?"disabled":""}>35 Wins → Wins Reparatur-Pack</button><button data-bc-wins-spend="boss" ${S.winsCurrency<50||ensureBossDaily().bonusTickets>=2?"disabled":""}>50 Wins → Boss-Ticket</button><button data-bc-hyper-core-craft ${S.winsCurrency<HYPER_CORE_CRAFT_WINS||S.fusionDust<HYPER_CORE_CRAFT_DUST?"disabled":""}>⚡ ${HYPER_CORE_CRAFT_WINS} Wins + ${fmt(HYPER_CORE_CRAFT_DUST)} Staub → Hyper-Kern</button></div></section>`;
    const progression=`<section class="bc-battle-progression"><div class="bc-battle-progression-head"><div><small>KARTENKAMPF-STUFE ${battleProgress.current+1} / ${RARITIES.length}</small><h3>Freigeschaltet bis ${currentBattleRarity.name}</h3></div>${nextBattleRarity?`<strong>Nächstes Ziel: ${nextBattleRarity.name}</strong>`:`<strong>MAXIMAL</strong>`}</div>${battleProgress.next?`<div class="bc-battle-progress-row"><div><span>Siege mit ${currentBattleRarity.name}</span><b>${battleProgress.wins} / ${battleProgress.next.wins}</b></div><div class="bc-battle-progress-bar"><i style="width:${progressPct}%"></i></div></div><div class="bc-battle-upgrade-row"><p>Nach ${battleProgress.next.wins} passenden Siegen kannst du <b>${nextBattleRarity.name}</b> für ${fmt(battleProgress.next.cost)} Points freischalten. Normale Karten zählen auf deiner aktuell höchsten Kampfrarität; <b>Exclusive, VIP und Hyper zählen immer</b>. Lokale und Online-Siege werden berücksichtigt.</p><button data-bc-battle-upgrade ${battleProgress.wins<battleProgress.next.wins?"disabled":""}>${battleProgress.wins<battleProgress.next.wins?`Noch ${battleProgress.next.wins-battleProgress.wins} Siege`:`${nextBattleRarity.name} freischalten · ${fmt(battleProgress.next.cost)}`}</button></div>`:`<p class="bc-battle-max-note">Alle normalen Kampfraritäten bis Göttlich sind freigeschaltet.</p>`}</section>`;
    const result=r?`<section class="bc-battle-result ${r.won?"win":"loss"}"><div class="bc-battle-result-title"><span>${r.won?"🏆":"💥"}</span><div><small>LETZTER KAMPF · ${r.round} RUNDEN</small><h3>${r.won?"SIEG":"NIEDERLAGE"}</h3><p>${r.won?`+${fmt(r.rewardPoints)} Points · +${r.rewardShards} Shards · +${r.winsEarned||0} Wins · Siegesserie ×${r.streak||0}${r.firstWin?" · Basic Kampf Aura freigeschaltet":""}${r.backupUsed?" · 🛡 Backup eingesetzt":""}${r.primaryFallen?" · Hauptkarte zerbrochen":""}${r.rankMasteryEarned&&r.rankNextRank?` · 🏅 +${fmt(r.rankMasteryEarned)} Meisterschaft${r.rankEliteEarned?" · +1 Elite-Sieg":""} · Rank ${r.rankNextRank}: ${fmt(r.rankMasteryNow)}/${fmt(r.rankNextMastery)} MP`:""}`:r.backupUsed?"Auch die Backup-Karte ist gefallen. Zerbrochene Karten müssen repariert werden.":"Deine eingesetzte Karte ist zerbrochen und muss repariert werden."}${r.potions?.length?` · 🧪 ${r.potions.length} Trank-Runden verbraucht`:""}</p></div></div><div class="bc-battle-result-grid"><article class="${r.player.className}"><b>${esc(r.player.name)}</b><span>Restleben ${fmt(r.player.hp)} / ${fmt(r.player.maxHp)}</span><small>⚔ ${fmt(r.player.power)} · ${fmt(r.player.min)}–${fmt(r.player.max)}</small>${(r.brokenIds||[]).map(id=>`<button data-bc-battle-repair="${id}">💥 ${esc(cardMeta(instance(id))?.name||"Karte")} reparieren</button>`).join("")}</article><article class="${r.enemy.className}"><b>${esc(r.enemy.name)}</b><span>Restleben ${fmt(r.enemy.hp)} / ${fmt(r.enemy.maxHp)}</span><small>Lv ${r.enemy.level} · ⚔ ${fmt(r.enemy.power)} · ${fmt(r.enemy.min)}–${fmt(r.enemy.max)}</small></article></div><div class="bc-battle-log">${r.log.map(x=>`<span>${esc(x)}</span>`).join("")}</div></section>`:"";
    const onlineActive=UI.onlineStatus==="active"||UI.onlineStatus==="ended",content=onlineActive?onlineBattlePanelHtml():`${arena}${result}`;
    return `<section class="bc-section bc-battle"><div class="bc-section-title"><div><small>KARTEN ARENA</small><h2>Kartenkampf</h2><p>Lokal gegen KI oder online gegen echte BigCards-Spieler. Im Rank-Kampf werden nur Karten-Ranks im Bereich ±2 vermittelt.</p></div><button class="bc-info-circle" data-bc-section-info="battle" title="Kartenkampf-Info">i</button><div class="bc-battle-title-actions"><div class="bc-battle-record"><b>${S.battleWins||0} Lokal-Siege · 🏆 ${S.winsCurrency}/${WIN_CAP} Wins</b><span>${S.battleLosses||0} Niederlagen · ${S.battleStreak>0?`Siegesserie ×${S.battleStreak}`:"Keine Siegesserie"} · Rekord ×${S.battleBestStreak||0}</span><em>🌐 Normal ${S.onlineBattleWins||0}/${S.onlineBattleLosses||0} · 🏅 Rank ${S.onlineRankedWins||0}/${S.onlineRankedLosses||0}</em></div><button class="bc-best-combat-entry ${S.bestCombatAutoUnlocked?"unlocked":"locked"}" data-bc-battle-best ${UI.battleSession?"disabled":""}>${S.bestCombatAutoUnlocked?"⚡ Beste Kampfkarte":"🔒 Beste Kampfkarte · 100 JK"}</button><button class="bc-online-entry" data-bc-online-menu ${UI.battleSession||UI.onlineStatus==="active"?"disabled":""}>🌐 Online-Kampf</button></div></div>${winsUse}${progression}${content}</section>`;
  }
  function modInventoryStackEntries(){
    const out=[],push=(kind,key,label,count,icon,category)=>{const n=Math.max(0,Math.floor(Number(count)||0));if(n)out.push({kind,key,label,count:n,icon,category});};
    for(const a of AURAS)push("aura",a.id,a.name,S.auraInventory?.[a.id],a.icon||"✦","Auras");
    for(const a of COMBAT_AURAS)push("combatAura",a.id,a.name,S.combatAuraInventory?.[a.id],a.icon||"⚔","Kampf-Auras");
    for(const b of BINDS)push("bind",b.id,b.name,S.bindInventory?.[b.id],b.icon||"🔗","Bindungen");
    for(const k of REPAIR_KITS)push("repairKit",k.id,k.name,S.repairKits?.[k.id],k.icon||"🧰","Reparatur-Kits");
    for(const t of TRAILS)push("trail",t.id,t.name,S.trailInventory?.[t.id],t.icon||"☄","Spuren");
    for(const [key,val] of Object.entries(S.potionInventory||{})){const [tierId,typeId]=String(key).split(":"),type=POTION_TYPES.find(x=>x.id===typeId),tierName=tierId==="exclusive"?"Exclusive":RARITIES[RARITY_INDEX[tierId]]?.name||tierId;push("potion",key,`${tierName} · ${type?.name||typeId}`,val,type?.icon||"🧪","Kampf-Tränke");}
    for(const r of RARITIES)push("packCredit",r.id,`${r.name}-Pack-Credit`,S.jkPackCredits?.[r.id],"🎴","Pack-Credits");
    push("exclusiveCredit","exclusive","Exclusive-Pack-Credit",S.exclusiveCredits,"🩸","Pack-Credits");
    return out;
  }
  function modInventoryEquippedEntries(){
    const out=[];
    for(const inst of Object.values(S.instances||{})){if(!inst)continue;const m=cardMeta(inst),card=`${m.name} · ${inst.vip?`VIP · ${m.rarity.name}`:inst.exclusive?"Exclusive":m.rarity.name}`;
      if(inst.aura){const a=auraBy(inst.aura);out.push({kind:"equippedAura",key:inst.id,label:a?.name||inst.aura,icon:a?.icon||"✦",card});}
      if(inst.combatAura){const a=combatAuraBy(inst.combatAura);out.push({kind:"equippedCombatAura",key:inst.id,label:a?.name||inst.combatAura,icon:a?.icon||"⚔",card});}
      if(inst.bind){const b=bindBy(inst.bind);out.push({kind:"equippedBind",key:inst.id,label:b?.name||inst.bind,icon:b?.icon||"🔗",card});}
      if(inst.trail){const t=trailBy(inst.trail);out.push({kind:"equippedTrail",key:inst.id,label:t?.name||inst.trail,icon:t?.icon||"☄",card});}
      preparedPotionsMeta(inst).forEach((p,i)=>out.push({kind:"equippedPotion",key:`${inst.id}:${i}`,label:`${p?.name||"Kampf-Trank"} · Slot ${i+1}`,icon:"🧪",card}));
    }
    return out;
  }
  function modProtectedCardIds(){const ids=new Set([String(S.featuredCardId||"")]);for(const row of S.floors||[])for(const id of row||[])if(id)ids.add(String(id));for(const inst of Object.values(S.instances||{}))if(inst?.backupCardId)ids.add(String(inst.backupCardId));return ids;}
  function modInventoryCardGroups(){const groups=new Map(),protectedIds=modProtectedCardIds();for(const inst of Object.values(S.instances||{})){if(!inst)continue;const key=collectionKey(inst),g=groups.get(key)||{key,label:cardMeta(inst).name,rarity:inst.vip?`VIP · ${cardMeta(inst).rarity.name}`:inst.exclusive?"Exclusive":cardMeta(inst).rarity.name,rarityClass:inst.vip?`rar-${cardMeta(inst).rarity.id} rar-vip`:inst.exclusive?"rar-exclusive":`rar-${cardMeta(inst).rarity.id}`,icon:cardMeta(inst).icon,count:0,removable:0};g.count++;if(!protectedIds.has(String(inst.id))&&!inst.listed&&!inst.locked&&!inst.favorite)g.removable++;groups.set(key,g);}return [...groups.values()].sort((a,b)=>a.rarity.localeCompare(b.rarity,"de")||a.label.localeCompare(b.label,"de"));}
  function modTimedEntries(){const rows=[],add=(key,label,until,icon)=>{const ms=Math.max(0,Number(until||0)-now());if(ms>0)rows.push({key,label,until:Number(until),icon,remaining:formatDuration(ms)});};add("bulk","Alle Karten leveln · 24h",S.bulkLevelUntil,"⚡");add("points","BigCards Points-Booster",S.jkBoostPointsUntil,"💰");add("xp","BigCards XP-Booster",S.jkBoostXpUntil,"✨");add("damage","BigCards Kampf-Booster",S.jkBoostDamageUntil,"⚔");add("vipclicks","VIP-Klicker JK-Boost",S.jkVipClickUntil,"👆");add("bossjk","Wochenboss JK-Teamboost",S.jkBossDamageUntil,"👹");add("collector","Auto-Collector",S.autoCollectorUntil,"🧲");if(S.autoOpenerWorkMs>0)rows.push({key:"opener",label:`Auto-Opener · ${S.autoOpenerCapacity} Kanäle`,until:now()+S.autoOpenerWorkMs,icon:"📦",remaining:formatAutoWorkTime(S.autoOpenerWorkMs)});return rows;}
  function formatDuration(ms){const sec=Math.max(0,Math.ceil((Number(ms)||0)/1000)),d=Math.floor(sec/86400),h=Math.floor((sec%86400)/3600),m=Math.floor((sec%3600)/60);return d?`${d}T ${h}Std ${m}Min`:h?`${h}Std ${m}Min`:`${Math.max(1,m)}Min`;}
  function modInventoryRowHtml(e){return `<article class="bc-mod-inventory-row"><span class="bc-mod-inventory-icon">${e.icon||"◆"}</span><div><b>${esc(e.label)}</b><small>${esc(e.category||"")}</small></div><strong>×${e.count}</strong><button class="bc-mod-inventory-remove" data-bc-mod-remove-kind="${esc(e.kind)}" data-bc-mod-remove-key="${esc(e.key)}" title="Entfernen" aria-label="${esc(e.label)} entfernen">×</button></article>`;}
  function modInventoryHtml(){
    const stacks=modInventoryStackEntries(),equipped=modInventoryEquippedEntries(),cards=modInventoryCardGroups(),timed=modTimedEntries(),stackTotal=stacks.reduce((n,x)=>n+x.count,0),cardTotal=Object.keys(S.instances||{}).length;
    const byCategory=[...new Set(stacks.map(x=>x.category))];
    return `<section class="bc-mod-inventory"><div class="bc-mod-inventory-head"><div><small>OWNER · AKTUELLER BIGCARDS-CHARAKTER</small><h3>Inventar & Besitz verwalten</h3><p>Hier kannst du Test-Inhalte wieder entfernen. Bei Stapeln mit mehreren Exemplaren fragt das X, wie viele gelöscht werden sollen.</p></div><div class="bc-mod-inventory-stats"><span><b>${stackTotal}</b><small>Items</small></span><span><b>${cardTotal}</b><small>Karten</small></span><span><b>${equipped.length}</b><small>ausgerüstet</small></span></div></div>${byCategory.map(cat=>`<details class="bc-mod-inventory-group" open><summary>${esc(cat)} <em>${stacks.filter(x=>x.category===cat).reduce((n,x)=>n+x.count,0)}</em></summary><div class="bc-mod-inventory-list">${stacks.filter(x=>x.category===cat).map(modInventoryRowHtml).join("")}</div></details>`).join("")}${equipped.length?`<details class="bc-mod-inventory-group"><summary>An Karten ausgerüstet <em>${equipped.length}</em></summary><div class="bc-mod-inventory-list">${equipped.map(e=>`<article class="bc-mod-inventory-row equipped"><span class="bc-mod-inventory-icon">${e.icon}</span><div><b>${esc(e.label)}</b><small>${esc(e.card)} · wird direkt von der Karte gelöscht</small></div><strong>×1</strong><button class="bc-mod-inventory-remove" data-bc-mod-remove-kind="${esc(e.kind)}" data-bc-mod-remove-key="${esc(e.key)}" title="Von Karte löschen">×</button></article>`).join("")}</div></details>`:""}${timed.length?`<details class="bc-mod-inventory-group"><summary>Aktive Freischaltungen & Booster <em>${timed.length}</em></summary><div class="bc-mod-inventory-list">${timed.map(e=>`<article class="bc-mod-inventory-row timed"><span class="bc-mod-inventory-icon">${e.icon}</span><div><b>${esc(e.label)}</b><small>Noch ${esc(e.remaining)}</small></div><strong>AKTIV</strong><button class="bc-mod-inventory-remove" data-bc-mod-remove-kind="timed" data-bc-mod-remove-key="${esc(e.key)}" title="Sofort beenden">×</button></article>`).join("")}</div></details>`:""}${cards.length?`<details class="bc-mod-inventory-group"><summary>Karten-Inventar <em>${cardTotal}</em></summary><p class="bc-mod-inventory-note">Persönliche, Backup-, Spielfeld-, gelistete, gesperrte und favorisierte Karten werden vor versehentlichem Löschen geschützt. Ausrüstung auf gelöschten Testkarten geht zurück ins Inventar.</p><div class="bc-mod-inventory-list cards">${cards.map(g=>`<article class="bc-mod-inventory-row card ${g.rarityClass}"><span class="bc-mod-inventory-icon">${g.icon}</span><div><b>${esc(g.label)}</b><small>${esc(g.rarity)} · ${g.removable} von ${g.count} löschbar</small></div><strong>×${g.count}</strong><button class="bc-mod-inventory-remove" data-bc-mod-remove-kind="cardGroup" data-bc-mod-remove-key="${esc(g.key)}" ${g.removable?"":"disabled"} title="Karten löschen">×</button></article>`).join("")}</div></details>`:""}</section>`;
  }
  function modRemoveAmount(label,current){if(current<=1)return 1;const raw=prompt(`${label}\n\nWie viele möchtest du entfernen? (1–${current})`,String(current));if(raw==null)return 0;return clamp(Math.floor(Number(raw)||0),0,current);}
  function modReturnCardEquipment(inst){if(inst.aura){S.auraInventory[inst.aura]=(S.auraInventory[inst.aura]||0)+1;inst.aura=null;}if(inst.combatAura){S.combatAuraInventory[inst.combatAura]=(S.combatAuraInventory[inst.combatAura]||0)+1;inst.combatAura=null;}if(inst.bind){S.bindInventory[inst.bind]=(S.bindInventory[inst.bind]||0)+1;inst.bind=null;}if(inst.trail)returnTrailToInventory(inst);if(potionQueueCount(inst))returnPreparedPotions(inst);}
  function modRemoveInventory(kind,key){
    if(UI.role!=="owner")return toast("Owner-Rechte erforderlich.");kind=String(kind||"");key=String(key||"");let label="Item",removed=0;
    const removeStack=(map,name)=>{const current=Math.max(0,Math.floor(Number(map?.[key])||0));if(!current)return 0;const qty=modRemoveAmount(name,current);if(!qty)return 0;map[key]=current-qty;if(map[key]<=0)delete map[key];label=name;return qty;};
    if(kind==="aura"){const a=auraBy(key);removed=removeStack(S.auraInventory,a?.name||key);}else if(kind==="combatAura"){const a=combatAuraBy(key);removed=removeStack(S.combatAuraInventory,a?.name||key);}else if(kind==="bind"){const b=bindBy(key);removed=removeStack(S.bindInventory,b?.name||key);}else if(kind==="repairKit"){const k=repairKitMeta(key);removed=removeStack(S.repairKits,k?.name||key);}else if(kind==="trail"){const t=trailBy(key);removed=removeStack(S.trailInventory,t?.name||key);}else if(kind==="potion"){removed=removeStack(S.potionInventory,key);}else if(kind==="packCredit"){const r=RARITIES[RARITY_INDEX[key]];removed=removeStack(S.jkPackCredits,`${r?.name||key}-Pack-Credit`);}else if(kind==="exclusiveCredit"){const current=Math.max(0,Math.floor(Number(S.exclusiveCredits)||0));const qty=modRemoveAmount("Exclusive-Pack-Credit",current);if(qty){S.exclusiveCredits=current-qty;removed=qty;label="Exclusive-Pack-Credit";}}
    else if(/^equipped/.test(kind)){const [cardId,slotRaw]=String(key).split(":"),inst=instance(cardId);if(!inst)return toast("Karte nicht mehr vorhanden.");if(kind==="equippedAura"&&inst.aura){label=auraBy(inst.aura)?.name||inst.aura;inst.aura=null;removed=1;}else if(kind==="equippedCombatAura"&&inst.combatAura){label=combatAuraBy(inst.combatAura)?.name||inst.combatAura;inst.combatAura=null;removed=1;}else if(kind==="equippedBind"&&inst.bind){label=bindBy(inst.bind)?.name||inst.bind;inst.bind=null;removed=1;}else if(kind==="equippedTrail"&&inst.trail){label=trailBy(inst.trail)?.name||inst.trail;inst.trail=null;removed=1;}else if(kind==="equippedPotion"&&potionQueueCount(inst)){const slot=clamp(Math.floor(Number(slotRaw)||0),0,potionQueueCount(inst)-1),p=preparedPotionMeta(inst,slot);label=p?.name||"Kampf-Trank";potionQueue(inst).splice(slot,1);removed=1;}}
    else if(kind==="timed"){label="Zeitinhalt";if(key==="bulk"){S.bulkLevelUntil=0;label="Alle Karten leveln";}else if(key==="points"){S.jkBoostPointsUntil=0;S.jkBoostPointsMultiplier=1;label="Points-Booster";}else if(key==="xp"){S.jkBoostXpUntil=0;S.jkBoostXpMultiplier=1;label="XP-Booster";}else if(key==="damage"){S.jkBoostDamageUntil=0;S.jkBoostDamageBonus=0;label="Kampf-Booster";}else if(key==="collector"){S.autoCollectorUntil=0;S.autoCollectorPointStep=0;label="Auto-Collector";}else if(key==="vipclicks"){S.jkVipClickUntil=0;S.jkVipClickMultiplier=1;label="VIP-Klicker JK-Boost";}else if(key==="bossjk"){S.jkBossDamageUntil=0;S.jkBossDamageMultiplier=1;label="Wochenboss JK-Teamboost";}else if(key==="opener"){S.autoOpenerWorkMs=0;for(const lane of S.autoOpenerLanes)lane.enabled=false;label="Auto-Opener";}removed=1;}
    else if(kind==="cardGroup"){const protectedIds=modProtectedCardIds(),candidates=Object.values(S.instances||{}).filter(inst=>inst&&collectionKey(inst)===key&&!protectedIds.has(String(inst.id))&&!inst.listed&&!inst.locked&&!inst.favorite).sort((a,b)=>(Number(a.level)||1)-(Number(b.level)||1)||cardRebirth(a)-cardRebirth(b));if(!candidates.length)return toast("Alle Exemplare dieser Karte sind geschützt.");const name=cardMeta(candidates[0]).name,qty=modRemoveAmount(name,candidates.length);if(!qty)return;for(const inst of candidates.slice(0,qty)){modReturnCardEquipment(inst);clearBackupReferences(inst.id);delete S.instances[inst.id];}invalidateCardPowerCache();removed=qty;label=name;}
    if(!removed)return;UI.modLoadToken++;UI.modInventoryData=null;persist();refresh(true);toast(`🗑 ${removed}× ${label} entfernt.`,3200);
  }


  // V389: Das Mod-Menü darf beim Öffnen nicht mehr die komplette Kartensammlung
  // synchron analysieren und tausende DOM-Zeilen bauen. Große Inventarlisten und
  // die 180 stärksten Testkarten werden deshalb nur noch auf ausdrücklichen Klick
  // und in kleinen, UI-freundlichen Portionen berechnet.
  const MOD_ASYNC_CHUNK=240,MOD_CARD_PAGE_SIZE=120;
  function modYield(){return new Promise(resolve=>setTimeout(resolve,0));}

  function modCardKind(inst){if(inst?.hyper)return"Hyper";if(inst?.win)return"Wins";if(inst?.vip)return"VIP";if(inst?.exclusive)return"Exclusive";return RARITIES[clamp(Math.floor(Number(inst?.rarity)||0),0,RARITIES.length-1)]?.name||"Karte";}
  function modCardOrder(inst){if(inst?.hyper)return 16;if(inst?.win)return 15;if(inst?.vip)return 14;if(inst?.exclusive)return 13;return clamp(Math.floor(Number(inst?.rarity)||0),0,12);}
  function modCardClass(inst){if(inst?.hyper)return"rar-hyper";if(inst?.win)return"rar-wins";if(inst?.vip)return`rar-${cardMeta(inst).rarity.id} rar-vip`;if(inst?.exclusive)return"rar-exclusive";return`rar-${cardMeta(inst).rarity.id}`;}
  function modPackOptionsHtml(){const normal=RARITIES.map((r,i)=>`<option value="normal:${i}">${r.symbol} ${r.name} · 10 Karten</option>`).join(""),wins=WIN_PACKS.map((p,i)=>`<option value="wins:${i}">${p.icon} ${p.name} · 5 Karten</option>`).join("");return`${normal}<optgroup label="Spezial-Packs"><option value="exclusive">🩸 Exclusive Pack · 5 Karten</option><option value="vip">👑 VIP Pack · 5 Karten</option><option value="hyper">⚡ Hyper Pack · 2 Karten</option>${wins}</optgroup>`;}
  function modJkPackOptionsHtml(){return`${RARITIES.map((r,i)=>`<option value="normal:${i}">${r.symbol} ${r.name} · ${r.jk} JK/Coin</option>`).join("")}<option value="exclusive">🩸 Exclusive · 100 JK/Coin</option><option value="vip">👑 VIP · 500 JK/Coin</option><option value="hyper">⚡ Hyper · ${HYPER_JK_PRICE} JK/Coin</option>`;}
  function modCatalogQuery(){return String(UI.modCardGrantSearch||"").trim().toLocaleLowerCase("de-DE");}
  function modCatalogType(){return["all","normal","exclusive","vip","wins","hyper"].includes(UI.modCardGrantType)?UI.modCardGrantType:"all";}
  function modCatalogRowByKey(key){
    const [kind,a,b]=String(key||"").split(":");
    if(kind==="n"){const rarity=clamp(Math.floor(Number(a)||0),0,RARITIES.length-1),base=clamp(Math.floor(Number(b)||0),0,BASE_NAMES.length-1),r=RARITIES[rarity];return{key:`n:${rarity}:${base}`,kind:"normal",label:BASE_NAMES[base],sub:`${r.name} · ${rarityValue(base).toLocaleString("de-DE",{maximumFractionDigits:4})} %`,icon:r.symbol,className:`rar-${r.id}`,hyper:false};}
    if(kind==="x"){const x=EXCLUSIVES.find(v=>v.id===a);return x?{key:`x:${x.id}`,kind:"exclusive",label:x.name,sub:`Exclusive · ${x.chance.toLocaleString("de-DE",{maximumFractionDigits:4})} %`,icon:"🩸",className:"rar-exclusive",hyper:false}:null;}
    if(kind==="v"){const v=VIP_CARDS.find(row=>row.id===a);return v?{key:`v:${v.id}`,kind:"vip",label:v.name,sub:`VIP · ${RARITIES[v.rarity]?.name||"Karte"}`,icon:"👑",className:`rar-${RARITIES[v.rarity]?.id||"common"} rar-vip`,hyper:false}:null;}
    if(kind==="w"){const w=WIN_CARD_BY_ID[a];return w?{key:`w:${w.id}`,kind:"wins",label:w.name,sub:`Wins · ${RARITIES[w.rarity]?.name||"Karte"} · ${w.chance.toLocaleString("de-DE",{maximumFractionDigits:4})} %`,icon:"🏆",className:"rar-wins",hyper:false}:null;}
    if(kind==="h"){const h=HYPER_CARD_BY_ID[a];return h?{key:`h:${h.id}`,kind:"hyper",label:h.name,sub:`Hyper · ${h.tierName} · ${h.chance.toLocaleString("de-DE",{maximumFractionDigits:4})} %`,icon:"⚡",className:"rar-hyper",hyper:true}:null;}
    return null;
  }
  function modCatalogResults(limit=72){
    const q=modCatalogQuery(),type=modCatalogType(),out=[],push=row=>{if(!row||out.length>=limit)return false;const hay=`${row.label} ${row.sub} ${row.key}`.toLocaleLowerCase("de-DE");if(q&&!hay.includes(q))return true;out.push(row);return out.length<limit;};
    if(!q&&type==="all")return[];
    if(type==="all"||type==="normal"){outer:for(let rarity=0;rarity<RARITIES.length;rarity++){for(let base=0;base<BASE_NAMES.length;base++){if(!push(modCatalogRowByKey(`n:${rarity}:${base}`)))break outer;}}}
    if((type==="all"||type==="exclusive")&&out.length<limit)for(const x of EXCLUSIVES)if(!push(modCatalogRowByKey(`x:${x.id}`)))break;
    if((type==="all"||type==="vip")&&out.length<limit)for(const v of VIP_CARDS)if(!push(modCatalogRowByKey(`v:${v.id}`)))break;
    if((type==="all"||type==="wins")&&out.length<limit)for(const w of WIN_CARDS)if(!push(modCatalogRowByKey(`w:${w.id}`)))break;
    if((type==="all"||type==="hyper")&&out.length<limit)for(const h of HYPER_CARDS)if(!push(modCatalogRowByKey(`h:${h.id}`)))break;
    return out;
  }
  function modSelectedCardRow(){return modCatalogRowByKey(UI.modCardGrantSelected);}
  function modCardGrantResultsHtml(){
    const rows=modCatalogResults(),selected=String(UI.modCardGrantSelected||"");
    if(!modCatalogQuery()&&modCatalogType()==="all")return`<div class="bc-mod-card-empty">Suche nach Kartenname, Rarität oder Karten-ID – oder wähle zuerst einen Kartenbereich.</div>`;
    if(!rows.length)return`<div class="bc-mod-card-empty">Keine Karte für diese Suche gefunden.</div>`;
    return `<div class="bc-mod-card-results bc-mod-card-choice-grid">${rows.map(row=>`<button type="button" class="bc-mod-card-result bc-mod-card-choice ${row.className} ${selected===row.key?"selected":""}" data-bc-mod-select-card="${esc(row.key)}"><span>${row.icon}</span><div><b>${esc(row.label)}</b><small>${esc(row.sub)}</small></div><em>${selected===row.key?"✓ AUSGEWÄHLT":"Auswählen"}</em></button>`).join("")}</div>${rows.length>=72?`<small class="bc-mod-card-limit">Maximal 72 Treffer sichtbar – suche genauer, wenn deine Karte nicht dabei ist.</small>`:""}`;
  }
  function modSelectedCardHtml(){
    const row=modSelectedCardRow();if(!row)return`<div class="bc-mod-selected-card empty"><span>🃏</span><div><b>Noch keine Karte ausgewählt</b><small>Tippe oben zuerst auf ein Suchergebnis.</small></div></div>`;
    return `<div class="bc-mod-selected-card ${row.className}"><span>${row.icon}</span><div><small>AUSGEWÄHLTE KARTE</small><b>${esc(row.label)}</b><em>${esc(row.sub)}</em></div><strong>✓</strong></div>`;
  }
  function renderModCardGrantResults(){
    const results=UI.overlay?.querySelector("[data-bc-mod-card-grant-results]"),selected=UI.overlay?.querySelector("[data-bc-mod-selected-card]");
    if(results)results.innerHTML=modCardGrantResultsHtml();
    if(selected)selected.innerHTML=modSelectedCardHtml();
    const row=modSelectedCardRow(),gen=UI.overlay?.querySelector("[data-bc-mod-give-generation]"),give=UI.overlay?.querySelector("[data-bc-mod-give-selected]");
    if(gen)gen.disabled=!row?.hyper;if(give)give.disabled=!row;
  }
  function modSelectCardV426(key){const row=modCatalogRowByKey(key);if(!row)return toast("Diese Karte wurde nicht gefunden.");UI.modCardGrantSelected=row.key;renderModCardGrantResults();}
  function modGrantCardOptions(){const q=s=>UI.overlay?.querySelector(s);return{quantity:clamp(Math.floor(Number(q("[data-bc-mod-give-qty]")?.value)||1),1,50),level:clamp(Math.floor(Number(q("[data-bc-mod-give-level]")?.value)||1),1,5),rebirth:clamp(Math.floor(Number(q("[data-bc-mod-give-rebirth]")?.value)||0),0,CARD_REBIRTH_MAX),generation:clamp(Math.floor(Number(q("[data-bc-mod-give-generation]")?.value)||1),1,HYPER_GENERATION_MAX),rank:clamp(Math.floor(Number(q("[data-bc-mod-give-rank]")?.value)||0),0,FEATURED_RANK_MAX),equipMode:["none","current","max"].includes(q("[data-bc-mod-give-equip]")?.value)?q("[data-bc-mod-give-equip]").value:"none"};}
  function modEquipmentScore(item){return Math.max(0,Number(item?.mult)||0)+Math.max(0,Number(item?.damage)||0)+Math.max(0,Number(item?.hp)||0)+Math.max(0,Number(item?.points)||0)+Math.max(0,Number(item?.xp)||0);}
  function modKnownEquipmentIds(field,inventory){
    const ids=new Set(Object.entries(inventory||{}).filter(([,count])=>Number(count)>0).map(([id])=>id));
    for(const inst of Object.values(S?.instances||{})){const id=inst?.[field];if(id)ids.add(id);}
    return ids;
  }
  function modBestKnownItem(list,field,inventory){
    const ids=modKnownEquipmentIds(field,inventory),known=list.filter(x=>ids.has(x.id));
    return known.sort((a,b)=>modEquipmentScore(b)-modEquipmentScore(a)||list.indexOf(b)-list.indexOf(a))[0]||null;
  }
  function modBestKnownTrail(){
    const ids=modKnownEquipmentIds("trail",S?.trailInventory),known=TRAILS.filter(t=>ids.has(t.id)&&trailUnlocked(t.id));
    return known.sort((a,b)=>modEquipmentScore(b)-modEquipmentScore(a)||b.index-a.index)[0]||null;
  }
  function modEquipmentCeilingV426(mode){
    if(mode==="max")return{aura:AURAS[AURAS.length-1]||null,combatAura:COMBAT_AURAS[COMBAT_AURAS.length-1]||null,bind:BINDS[BINDS.length-1]||null,trail:TRAILS[TRAILS.length-1]||null};
    if(mode==="current")return{aura:modBestKnownItem(AURAS,"aura",S?.auraInventory),combatAura:modBestKnownItem(COMBAT_AURAS,"combatAura",S?.combatAuraInventory),bind:modBestKnownItem(BINDS,"bind",S?.bindInventory),trail:modBestKnownTrail()};
    return{aura:null,combatAura:null,bind:null,trail:null};
  }
  function modMaxShinyForCardV426(inst){const level=clamp(Math.floor(Number(inst?.level)||1),1,5);return level>=5?3:level>=4?2:level>=3?1:0;}
  function modEquipCardV426(inst,mode="current",gearOverride=null){
    if(!inst||!["current","max"].includes(mode))return false;
    const gear=gearOverride||modEquipmentCeilingV426(mode);let changed=false;
    const set=(field,id)=>{if((inst[field]||null)!==(id||null)){inst[field]=id||null;changed=true;}};
    if(gear.aura)set("aura",gear.aura.id);
    if(gear.combatAura)set("combatAura",gear.combatAura.id);
    if(gear.bind)set("bind",gear.bind.id);
    const shiny=modMaxShinyForCardV426(inst);if(Math.floor(Number(inst.shiny)||0)!==shiny){inst.shiny=shiny;changed=true;}
    if(isFeaturedCombatCardId(inst.id)){if(gear.trail)set("trail",gear.trail.id);}
    else if(inst.trail){inst.trail=null;changed=true;}
    return changed;
  }
  function modFinalizeGrantedCard(inst,opt){
    if(!inst)return;inst.level=opt.level;inst.cardRebirth=opt.rebirth;inst.rank=opt.rank;inst.rankMastery=opt.rank?rankMeta(opt.rank).mastery:0;inst.rankEliteWins=opt.rank?rankMeta(opt.rank).elite:0;inst.rankWins=0;inst.rankedAt=opt.rank?now():0;if(inst.hyper)inst.hyperGeneration=opt.generation;
    const key=collectionKey(inst),col=cardCollectionMap(inst);col[key]=col[key]||{firstAt:Number(inst.createdAt)||now(),highestLevel:1,highestRebirth:0,...(inst.hyper?{highestGeneration:1}:{})};col[key].highestLevel=Math.max(Number(col[key].highestLevel)||1,opt.rebirth>0?5:opt.level);col[key].highestRebirth=Math.max(Number(col[key].highestRebirth)||0,opt.rebirth);if(inst.hyper)col[key].highestGeneration=Math.max(Number(col[key].highestGeneration)||1,opt.generation);
    if(opt.equipMode!=="none")modEquipCardV426(inst,opt.equipMode);
  }
  function modCreateSpecificCard(key,opt){
    const[kind,a,b]=String(key||"").split(":");let added=null;
    if(kind==="n"){const rarity=clamp(Math.floor(Number(a)||0),0,RARITIES.length-1),base=clamp(Math.floor(Number(b)||0),0,BASE_NAMES.length-1);added=addInstance({rarity,base});}
    else if(kind==="x"){const x=EXCLUSIVES.find(v=>v.id===a);if(!x)return null;added=addInstance({exclusive:true,exclusiveId:x.id,basePower:strongestUsableNormalBase()*x.strength,rarityValue:x.rarityValue});}
    else if(kind==="v"){const v=VIP_CARDS.find(row=>row.id===a);if(!v)return null;added=addInstance({vip:true,vipId:v.id,rarity:v.rarity,basePower:vipBasePower(v),rarityValue:v.rarityValue});}
    else if(kind==="w"){const w=WIN_CARD_BY_ID[a];if(!w)return null;added=addInstance({win:true,winId:w.id,winPack:w.packIndex,rarity:w.rarity,base:w.base,rarityValue:w.chance});}
    else if(kind==="h"){const h=HYPER_CARD_BY_ID[a];if(!h)return null;added=addInstance({hyper:true,hyperId:h.id,hyperGeneration:opt.generation,rarity:h.rarity,base:h.base,rarityValue:h.chance});}
    const inst=added?.inst;if(!inst)return null;modFinalizeGrantedCard(inst,opt);return inst;
  }
  function modGiveSpecificCard(key){
    if(UI.role!=="owner")return toast("Owner-Rechte erforderlich.");
    const row=modCatalogRowByKey(key),opt=modGrantCardOptions(),created=[];if(!row)return toast("Wähle zuerst eine Karte aus.");
    for(let i=0;i<opt.quantity;i++){const inst=modCreateSpecificCard(row.key,opt);if(inst)created.push(inst);}
    if(!created.length)return toast("Karte konnte nicht erstellt werden.");
    invalidateCardPowerCache();UI.modLoadToken++;UI.modInventoryData=null;persist();refresh(true);
    toast(`🧪 ${created.length}× ${row.label} gegeben · Lv ${opt.level} · RB ${opt.rebirth}${row.hyper?` · G${opt.generation}`:""} · Rank ${opt.rank}${opt.equipMode!=="none"?` · Ausrüstung ${opt.equipMode==="max"?"MAX":"aktueller Stand"}`:""}`,4600);
  }
  function modGiveSelectedCardV426(){return modGiveSpecificCard(UI.modCardGrantSelected);}
  function modCardScopeIdV426(inst){
    if(inst?.hyper)return"hyper";if(inst?.win)return"wins";if(inst?.vip)return"vip";if(inst?.exclusive)return"exclusive";
    return RARITIES[clamp(Math.floor(Number(inst?.rarity)||0),0,RARITIES.length-1)]?.id||"common";
  }
  function modScopeOptionsHtmlV426(){
    const rows=[...RARITIES.map(r=>({id:r.id,label:`${r.symbol} ${r.name}`})),{id:"exclusive",label:"🩸 Exclusive"},{id:"vip",label:"👑 VIP"},{id:"wins",label:"🏆 Wins"},{id:"hyper",label:"⚡ Hyper"}];
    return `<label class="bc-mod-scope-chip all"><input type="checkbox" data-bc-mod-bulk-scope="all" checked><span>ALLE</span></label>${rows.map(x=>`<label class="bc-mod-scope-chip"><input type="checkbox" data-bc-mod-bulk-scope="${x.id}"><span>${x.label}</span></label>`).join("")}`;
  }
  function modBulkEquipmentTargetsV426(scopes){
    const all=scopes.has("all"),groups=new Map(),main=featuredCard(),activeIds=new Set([main?.id,main?.backupCardId].filter(Boolean).map(String));
    for(const inst of Object.values(S?.instances||{})){
      if(!inst||inst.listed||isCardOnExpedition(inst.id))continue;
      const scope=modCardScopeIdV426(inst);if(!all&&!scopes.has(scope))continue;
      const key=collectionKey(inst),current=groups.get(key),instActive=activeIds.has(String(inst.id)),currentActive=current&&activeIds.has(String(current.id));
      if(!current||(instActive&&!currentActive)||(instActive===currentActive&&(featuredProgressCompareV424(inst,current)>0||featuredProgressCompareV424(inst,current)===0&&combatStats(inst).power>combatStats(current).power)))groups.set(key,inst);
    }
    return [...groups.values()];
  }
  async function modBulkEquipCardsV426(){
    if(UI.role!=="owner")return toast("Owner-Rechte erforderlich.");
    const mode=UI.overlay?.querySelector("[data-bc-mod-bulk-equip-mode]")?.value==="max"?"max":"current",checked=[...UI.overlay?.querySelectorAll("[data-bc-mod-bulk-scope]:checked")||[]].map(x=>x.dataset.bcModBulkScope),scopes=new Set(checked);
    if(!scopes.size)return toast("Wähle mindestens einen Kartenbereich aus.");
    const targets=modBulkEquipmentTargetsV426(scopes);if(!targets.length)return toast("In diesen Bereichen wurden keine Karten gefunden.");
    const gear=modEquipmentCeilingV426(mode);let changed=0;
    for(let i=0;i<targets.length;i++){if(modEquipCardV426(targets[i],mode,gear))changed++;if(i&&i%220===0)await new Promise(r=>setTimeout(r,0));}
    invalidateCardPowerCache();UI.modInventoryData=null;persist();refresh(true);
    toast(`🧰 ${targets.length} Kartenmotive geprüft · ${changed} angepasst · ${mode==="max"?"absolute MAX-Ausrüstung":"beste Ausrüstung deines aktuellen Stands"}. Level, Rebirth, Rank und Generation blieben unverändert.`,5200);
  }
  function modGivePack(value){value=String(value||"normal:0");let results=[],name="TEST PACK",meta={test:true};if(value.startsWith("normal:")){const ri=clamp(Math.floor(Number(value.split(":")[1])||0),0,RARITIES.length-1);results=Array.from({length:10},()=>rollNormal(ri));name=`TEST ${RARITIES[ri].name}`;}else if(value.startsWith("wins:")){const pi=clamp(Math.floor(Number(value.split(":")[1])||0),0,WIN_PACKS.length-1);results=Array.from({length:5},()=>rollWinCard(pi));name=`TEST ${WIN_PACKS[pi].name}`;meta.wins=true;}else if(value==="exclusive"){results=Array.from({length:5},()=>rollExclusive());name="TEST EXCLUSIVE";meta.exclusive=true;}else if(value==="vip"){results=Array.from({length:5},()=>rollVipPackCard());name="TEST VIP";meta.vip=true;}else if(value==="hyper"){results=Array.from({length:2},()=>rollHyperCard());name="TEST HYPER";meta.hyper=true;if(Math.random()<hyperPackCoreChance()){S.hyperCores=(S.hyperCores||0)+1;meta.hyperCore=true;}}if(!results.length)return toast("Test-Pack konnte nicht erzeugt werden.");showPackReveal(results,{...meta,name});return results;}
  function modLatestResourceHtml(){return`<section class="bc-mod-latest"><div class="bc-mod-latest-head"><div><small>V421 · AKTUELLE SYSTEME</small><h3>Endgame, Ressourcen & Komfort</h3></div></div><div class="bc-mod-resource-grid">
    <label>Fusion Dust<input type="number" min="0" data-bc-mod-resource="fusionDust" value="${Math.floor(S.fusionDust||0)}"></label><label>Aura-Material<input type="number" min="0" data-bc-mod-resource="auraMaterial" value="${Math.floor(S.auraMaterial||0)}"></label><label>Kosmetik-Fragmente<input type="number" min="0" data-bc-mod-resource="cosmeticFragments" value="${Math.floor(S.cosmeticFragments||0)}"></label><label>Prismatic-Katalysatoren<input type="number" min="0" data-bc-mod-resource="prismaticCatalysts" value="${Math.floor(S.prismaticCatalysts||0)}"></label><label>Hyper-Kerne<input type="number" min="0" data-bc-mod-resource="hyperCores" value="${Math.floor(S.hyperCores||0)}"></label><label>Boss-Token<input type="number" min="0" data-bc-mod-resource="bossTokens" value="${Math.floor(S.bossTokens||0)}"></label><label>Pack-Fragmente<input type="number" min="0" data-bc-mod-resource="packFragments" value="${Math.floor(S.packFragments||0)}"></label><label>Card Shards<input type="number" min="0" data-bc-mod-resource="shards" value="${Math.floor(S.shards||0)}"></label><label>Prestige<input type="number" min="0" data-bc-mod-resource="prestigeCount" value="${Math.floor(S.prestigeCount||0)}"></label><label>Prestige-Siegel<input type="number" min="0" data-bc-mod-resource="prestigeTokens" value="${Math.floor(S.prestigeTokens||0)}"></label><label>Auto-Opener Kanäle<select data-bc-mod-resource="autoOpenerCapacity">${[0,1,2,3,4].map(v=>`<option value="${v}" ${v===Math.floor(S.autoOpenerCapacity||0)?"selected":""}>${v}/4</option>`).join("")}</select></label><label>Auto-Opener Stunden<input type="number" min="0" max="999" step=".25" data-bc-mod-resource="autoOpenerHours" value="${((Number(S.autoOpenerWorkMs)||0)/3600000).toFixed(2)}"></label><label class="toggle">VIP dauerhaft<input type="checkbox" data-bc-mod-resource-check="vipUnlocked" ${S.vipUnlocked?"checked":""}></label><label class="toggle">Beste Kampfkarte<input type="checkbox" data-bc-mod-resource-check="bestCombatAutoUnlocked" ${S.bestCombatAutoUnlocked?"checked":""}></label>
  </div><button data-bc-mod-action="latestResources">Aktuelle Systeme übernehmen</button></section>`;}

  function modInventoryLazyHtml(){
    return `<div data-bc-mod-inventory-host>${UI.modInventoryData?modInventoryLoadedHtml(UI.modInventoryData):`<section class="bc-mod-inventory"><div class="bc-mod-inventory-head"><div><small>OWNER · PERFORMANCE-MODUS</small><h3>Inventar & Besitz verwalten</h3><p>Beim Öffnen von „Mod“ wird bewusst <b>keine einzige Kartenliste</b> durchsucht. Das Karteninventar wird ausschließlich geladen, wenn du unten auf den Button drückst.</p></div><div class="bc-mod-inventory-stats"><span><b>0</b><small>beim Öffnen geladen</small></span></div></div><button class="bc-primary" data-bc-mod-load-inventory>Inventar erst jetzt laden</button></section>`}</div>`;
  }
  function modInventoryLoadedHtml(data){
    const stacks=data?.stacks||[],equipped=data?.equipped||[],cards=data?.cards||[],timed=data?.timed||[],stackTotal=stacks.reduce((n,x)=>n+x.count,0),cardTotal=Math.max(0,Number(data?.cardTotal)||0),byCategory=[...new Set(stacks.map(x=>x.category))];
    const search=String(UI.modInventorySearch||"").trim().toLocaleLowerCase("de-DE"),filteredCards=search?cards.filter(g=>`${g.label} ${g.rarity} ${g.key}`.toLocaleLowerCase("de-DE").includes(search)):cards;
    const pages=Math.max(1,Math.ceil(filteredCards.length/MOD_CARD_PAGE_SIZE)),page=clamp(Math.floor(Number(UI.modInventoryPage)||0),0,pages-1),cardSlice=filteredCards.slice(page*MOD_CARD_PAGE_SIZE,(page+1)*MOD_CARD_PAGE_SIZE),equippedSlice=equipped.slice(0,120);
    return `<section class="bc-mod-inventory"><div class="bc-mod-inventory-head"><div><small>OWNER · GELADEN</small><h3>Inventar & Besitz verwalten</h3><p>Große Bestände werden seitenweise dargestellt. Das Karteninventar kann jetzt vollständig durchsucht werden.</p></div><div class="bc-mod-inventory-stats"><span><b>${stackTotal}</b><small>Items</small></span><span><b>${cardTotal}</b><small>Karten</small></span><span><b>${equipped.length}</b><small>ausgerüstet</small></span></div></div>${byCategory.map(cat=>{const rows=stacks.filter(x=>x.category===cat);return `<details class="bc-mod-inventory-group"><summary>${esc(cat)} <em>${rows.reduce((n,x)=>n+x.count,0)}</em></summary><div class="bc-mod-inventory-list">${rows.map(modInventoryRowHtml).join("")}</div></details>`}).join("")}${equipped.length?`<details class="bc-mod-inventory-group"><summary>An Karten ausgerüstet <em>${equipped.length}</em></summary>${equipped.length>equippedSlice.length?`<p class="bc-mod-inventory-note">Aus Performancegründen werden hier die ersten ${equippedSlice.length} Einträge angezeigt.</p>`:""}<div class="bc-mod-inventory-list">${equippedSlice.map(e=>`<article class="bc-mod-inventory-row equipped"><span class="bc-mod-inventory-icon">${e.icon}</span><div><b>${esc(e.label)}</b><small>${esc(e.card)} · wird direkt von der Karte gelöscht</small></div><strong>×1</strong><button class="bc-mod-inventory-remove" data-bc-mod-remove-kind="${esc(e.kind)}" data-bc-mod-remove-key="${esc(e.key)}" title="Von Karte löschen">×</button></article>`).join("")}</div></details>`:""}${timed.length?`<details class="bc-mod-inventory-group"><summary>Aktive Freischaltungen & Booster <em>${timed.length}</em></summary><div class="bc-mod-inventory-list">${timed.map(e=>`<article class="bc-mod-inventory-row timed"><span class="bc-mod-inventory-icon">${e.icon}</span><div><b>${esc(e.label)}</b><small>Noch ${esc(e.remaining)}</small></div><strong>AKTIV</strong><button class="bc-mod-inventory-remove" data-bc-mod-remove-kind="timed" data-bc-mod-remove-key="${esc(e.key)}" title="Sofort beenden">×</button></article>`).join("")}</div></details>`:""}${cards.length?`<details class="bc-mod-inventory-group" open><summary>Karten-Inventar <em>${search?`${filteredCards.length} Treffer / `:""}${cardTotal}</em></summary><div class="bc-mod-inventory-search"><span>🔎</span><input type="search" data-bc-mod-inventory-search value="${esc(UI.modInventorySearch||"")}" placeholder="Karte, Rarität, VIP, Hyper, Wins …"><button data-bc-mod-inventory-search-clear ${search?"":"disabled"}>×</button></div><p class="bc-mod-inventory-note">Persönliche, Backup-, Spielfeld-, gelistete, gesperrte und favorisierte Karten sind geschützt.</p>${cardSlice.length?`<div class="bc-mod-inventory-list cards">${cardSlice.map(g=>`<article class="bc-mod-inventory-row card ${g.rarityClass}"><span class="bc-mod-inventory-icon">${g.icon}</span><div><b>${esc(g.label)}</b><small>${esc(g.rarity)} · ${g.removable} von ${g.count} löschbar</small></div><strong>×${g.count}</strong><button class="bc-mod-inventory-remove" data-bc-mod-remove-kind="cardGroup" data-bc-mod-remove-key="${esc(g.key)}" ${g.removable?"":"disabled"} title="Karten löschen">×</button></article>`).join("")}</div>`:`<div class="bc-mod-card-empty">Keine Karte passt zu „${esc(UI.modInventorySearch||"")}“.</div>`}${pages>1?`<div class="bc-pagination"><button data-bc-mod-inventory-page="${page-1}" ${page<=0?"disabled":""}>←</button><b>Seite ${page+1} / ${pages}</b><button data-bc-mod-inventory-page="${page+1}" ${page>=pages-1?"disabled":""}>→</button></div>`:""}</details>`:""}<button data-bc-mod-load-inventory>Inventar neu laden</button></section>`;
  }
  function renderModInventoryData(focusSearch=false){
    if(UI.tab!=="mod"||UI.role!=="owner")return;
    const host=UI.overlay?.querySelector("[data-bc-mod-inventory-host]");
    if(host&&UI.modInventoryData){host.innerHTML=modInventoryLoadedHtml(UI.modInventoryData);if(focusSearch)requestAnimationFrame(()=>{const input=host.querySelector("[data-bc-mod-inventory-search]");if(input){input.focus();const n=input.value.length;try{input.setSelectionRange(n,n)}catch{}}});}
  }
  async function loadModInventoryAsync(){
    if(UI.role!=="owner"||UI.modInventoryLoading)return;
    const host=UI.overlay?.querySelector("[data-bc-mod-inventory-host]");if(!host)return;
    UI.modInventoryLoading=true;UI.modInventoryPage=0;const token=++UI.modLoadToken;
    const valid=()=>UI.overlay&&UI.tab==="mod"&&UI.role==="owner"&&token===UI.modLoadToken;
    const ids=Object.keys(S.instances||{}),cardTotal=ids.length,protectedIds=new Set([String(S.featuredCardId||"")]),equipped=[];
    for(const row of S.floors||[])for(const id of row||[])if(id)protectedIds.add(String(id));
    host.innerHTML=`<section class="bc-mod-inventory"><div class="bc-empty-state"><span>⚙️</span><h3>Inventar wird vorbereitet …</h3><p data-bc-mod-load-progress>0 / ${fmt(cardTotal)} Karten</p></div></section>`;
    const progress=()=>host.querySelector("[data-bc-mod-load-progress]");
    try{
      // Pass 1: Backup-Schutz und tatsächlich ausgerüstete Inhalte sammeln.
      for(let i=0;i<ids.length;i++){
        const inst=S.instances?.[ids[i]];if(!inst)continue;
        if(inst.backupCardId)protectedIds.add(String(inst.backupCardId));
        const hasEquipment=!!(inst.aura||inst.combatAura||inst.bind||inst.trail||potionQueueCount(inst));
        if(hasEquipment){
          const m=cardMeta(inst),card=`${m.name} · ${inst.vip?`VIP · ${m.rarity.name}`:inst.exclusive?"Exclusive":m.rarity.name}`;
          if(inst.aura){const a=auraBy(inst.aura);equipped.push({kind:"equippedAura",key:inst.id,label:a?.name||inst.aura,icon:a?.icon||"✦",card});}
          if(inst.combatAura){const a=combatAuraBy(inst.combatAura);equipped.push({kind:"equippedCombatAura",key:inst.id,label:a?.name||inst.combatAura,icon:a?.icon||"⚔",card});}
          if(inst.bind){const b=bindBy(inst.bind);equipped.push({kind:"equippedBind",key:inst.id,label:b?.name||inst.bind,icon:b?.icon||"🔗",card});}
          if(inst.trail){const t=trailBy(inst.trail);equipped.push({kind:"equippedTrail",key:inst.id,label:t?.name||inst.trail,icon:t?.icon||"☄",card});}
          preparedPotionsMeta(inst).forEach((p,j)=>equipped.push({kind:"equippedPotion",key:`${inst.id}:${j}`,label:`${p?.name||"Kampf-Trank"} · Slot ${j+1}`,icon:"🧪",card}));
        }
        if(i&&i%MOD_ASYNC_CHUNK===0){if(!valid())return;const el=progress();if(el)el.textContent=`Schutz/Ausrüstung ${fmt(i)} / ${fmt(cardTotal)}`;await modYield();}
      }
      const groups=new Map();
      // Pass 2: Jede Karte höchstens einmal vollständig auswerten.
      for(let i=0;i<ids.length;i++){
        const inst=S.instances?.[ids[i]];if(!inst)continue;
        const m=cardMeta(inst),key=collectionKey(inst),order=modCardOrder(inst),lite=liteCardLabel(inst);
        let g=groups.get(key);
        if(!g){g={key,label:m.name,rarity:lite.rarity||modCardKind(inst),rarityClass:modCardClass(inst),icon:lite.icon||m.icon||"◆",count:0,removable:0,order};groups.set(key,g);}
        g.count++;if(!protectedIds.has(String(inst.id))&&!inst.listed&&!inst.locked&&!inst.favorite)g.removable++;
        if(i&&i%MOD_ASYNC_CHUNK===0){if(!valid())return;const el=progress();if(el)el.textContent=`Kartengruppen ${fmt(i)} / ${fmt(cardTotal)}`;await modYield();}
      }
      if(!valid())return;
      const cards=[...groups.values()].sort((a,b)=>a.order-b.order||a.label.localeCompare(b.label,"de"));
      UI.modInventoryData={stacks:modInventoryStackEntries(),equipped,cards,timed:modTimedEntries(),cardTotal};renderModInventoryData();
    }finally{UI.modInventoryLoading=false;}
  }
  async function loadModTestCardsAsync(){
    if(UI.role!=="owner"||UI.modCardsLoading)return;
    const button=UI.overlay?.querySelector("[data-bc-mod-load-cards]"),selects=[...UI.overlay.querySelectorAll("[data-bc-mod-shiny-card],[data-bc-mod-broken-card]")],actionButtons=[...UI.overlay.querySelectorAll('[data-bc-mod-action="shinyTest"],[data-bc-mod-action="brokenTest"]')];if(!button||!selects.length)return;
    UI.modCardsLoading=true;const token=++UI.modLoadToken,ids=Object.keys(S.instances||{}),best=[];
    const valid=()=>UI.overlay&&UI.tab==="mod"&&UI.role==="owner"&&token===UI.modLoadToken;
    button.disabled=true;button.textContent=`Testkarten werden geladen · 0 / ${fmt(ids.length)}`;
    try{
      for(let i=0;i<ids.length;i++){
        const inst=S.instances?.[ids[i]];if(!inst)continue;const m=cardMeta(inst);
        best.push({id:inst.id,power:Number(m.combat?.power)||0,label:`${m.name} · ${inst.vip?`VIP · ${m.rarity.name}`:inst.exclusive?"EXCLUSIVE":m.rarity.name} · Lv ${inst.level}${inst.broken?" · KAPUTT":""}`});
        if(best.length>=600){best.sort((a,b)=>b.power-a.power);best.length=220;}
        if(i&&i%MOD_ASYNC_CHUNK===0){if(!valid())return;button.textContent=`Testkarten werden geladen · ${fmt(i)} / ${fmt(ids.length)}`;await modYield();}
      }
      if(!valid())return;best.sort((a,b)=>b.power-a.power);best.length=Math.min(180,best.length);
      const html=best.map(x=>`<option value="${esc(x.id)}">${esc(x.label)}</option>`).join("")||'<option value="">Keine Karte vorhanden</option>';
      for(const select of selects){const old=select.value;select.innerHTML=html;select.disabled=!best.length;if(old&&best.some(x=>String(x.id)===old))select.value=old;}for(const actionButton of actionButtons)actionButton.disabled=!best.length;
      button.textContent=`${best.length} stärkste Testkarten geladen`;
    }finally{UI.modCardsLoading=false;if(button&&valid())button.disabled=false;}
  }

  function liteCardLabel(inst){if(!inst)return {name:"Karte",rarity:"–",icon:"◆"};if(inst.hyper){const h=hyperCardBy(inst.hyperId)||HYPER_CARDS[0];return {name:h.name,rarity:`HYPER G${hyperGeneration(inst)} · ${hyperTierMeta(h).name}`,icon:""}}if(inst.win){const w=winCardBy(inst.winId)||WIN_CARDS[0];return {name:w.name,rarity:`WINS · ${RARITIES[w.rarity]?.name||"Karte"}`,icon:"🏆"}}if(inst.vip){const v=vipCardBy(inst.vipId)||VIP_CARDS[0];return {name:v.name,rarity:`VIP · ${RARITIES[v.rarity]?.name||"Karte"}`,icon:"👑"}}if(inst.exclusive){const x=EXCLUSIVES.find(e=>e.id===inst.exclusiveId)||EXCLUSIVES[0];return {name:x.name,rarity:"EXCLUSIVE",icon:"🩸"}}return {name:BASE_NAMES[inst.base]||"Karte",rarity:RARITIES[inst.rarity]?.name||"Karte",icon:motifIcon(BASE_NAMES[inst.base]||"")};}
  function ensureHyperTestConfigs(){
    if(!Array.isArray(UI.hyperTestConfigs)||UI.hyperTestConfigs.length!==4)UI.hyperTestConfigs=Array.from({length:4},(_,i)=>({rank:10,rebirth:5,aura:"cosmic",combatAura:"cosmic",bind:"wizard",shiny:3,fusion:"prismatic",trail:"cosmic"}));return UI.hyperTestConfigs;
  }
  function hyperTestMock(gen,index){const cfg=ensureHyperTestConfigs()[index]||{},meta=[HYPER_CARDS[3],HYPER_CARDS[7],HYPER_CARDS[12],HYPER_CARDS[15]][index]||HYPER_CARDS[0];return {id:`hyper-preview-${index}`,hyper:true,hyperId:meta.id,hyperGeneration:gen,rarity:meta.rarity,base:meta.base,level:5,cardRebirth:clamp(Number(cfg.rebirth)||0,0,5),rank:clamp(Number(cfg.rank)||0,0,10),rankMastery:999999,rankEliteWins:99,aura:cfg.aura||null,combatAura:cfg.combatAura||null,bind:cfg.bind||null,shiny:clamp(Number(cfg.shiny)||0,0,3),fusion:cfg.fusion||"normal",trail:cfg.trail||null,_previewTrail:true,battlePotions:[],broken:false,listed:false};}
  function hyperTestCardsHtml(){const cfgs=ensureHyperTestConfigs();return `<section class="bc-hyper-test-lab"><div class="bc-section-title"><div><small>OWNER · HYPER DESIGN LAB</small><h2>⚡ 4 Hyper-Testkarten</h2><p>Generation 1–4 mit frei testbarer Aura, Kampf-Aura, Bindung, Shiny, Fusion, Spur, Rank und Karten-Rebirth. Diese Vorschau erzeugt keine echten Karten.</p></div><button class="bc-pack-info-btn" data-bc-hyper-info>i</button></div><div class="bc-hyper-test-grid">${cfgs.map((cfg,i)=>{const gen=i+1,mock=hyperTestMock(gen,i),m=cardMeta(mock);return `<article class="bc-hyper-test-card"><div class="bc-hyper-test-preview ${m.className}"><div class="bc-card-art">${cardEffectBadges(mock)}</div><small>HYPER · GENERATION ${gen} · ${m.hyperTier?.name||""}</small><h3>${esc(m.name)}</h3><b>⚔ ${fmt(m.combat.power)}</b><span>${fmt(m.combat.min)}–${fmt(m.combat.max)} Schaden · ${fmt(m.combat.hp)} HP</span><em>${fmt(m.points)}/s · ${fmt(m.xp)} XP/s</em></div><div class="bc-hyper-test-controls"><label>Rank<select data-bc-hyper-test-field="rank" data-bc-hyper-test-index="${i}">${Array.from({length:11},(_,n)=>`<option value="${n}" ${Number(cfg.rank)===n?"selected":""}>R${n}</option>`).join("")}</select></label><label>Rebirth<select data-bc-hyper-test-field="rebirth" data-bc-hyper-test-index="${i}">${Array.from({length:6},(_,n)=>`<option value="${n}" ${Number(cfg.rebirth)===n?"selected":""}>↻${n}</option>`).join("")}</select></label><label>Aura<select data-bc-hyper-test-field="aura" data-bc-hyper-test-index="${i}"><option value="">Keine</option>${AURAS.map(x=>`<option value="${x.id}" ${cfg.aura===x.id?"selected":""}>${x.name}</option>`).join("")}</select></label><label>Kampf-Aura<select data-bc-hyper-test-field="combatAura" data-bc-hyper-test-index="${i}"><option value="">Keine</option>${COMBAT_AURAS.map(x=>`<option value="${x.id}" ${cfg.combatAura===x.id?"selected":""}>${x.name}</option>`).join("")}</select></label><label>Bindung<select data-bc-hyper-test-field="bind" data-bc-hyper-test-index="${i}"><option value="">Keine</option>${BINDS.map(x=>`<option value="${x.id}" ${cfg.bind===x.id?"selected":""}>${x.name}</option>`).join("")}</select></label><label>Shiny<select data-bc-hyper-test-field="shiny" data-bc-hyper-test-index="${i}">${[0,1,2,3].map(n=>`<option value="${n}" ${Number(cfg.shiny)===n?"selected":""}>${["Kein","Electric","Explosive","Void"][n]}</option>`).join("")}</select></label><label>Fusion<select data-bc-hyper-test-field="fusion" data-bc-hyper-test-index="${i}">${["normal","holo","prismatic"].map(x=>`<option value="${x}" ${cfg.fusion===x?"selected":""}>${x}</option>`).join("")}</select></label><label>Spur<select data-bc-hyper-test-field="trail" data-bc-hyper-test-index="${i}"><option value="">Keine</option>${TRAILS.map(x=>`<option value="${x.id}" ${cfg.trail===x.id?"selected":""}>${x.name}</option>`).join("")}</select></label></div></article>`}).join("")}</div></section>`;}
  function modHtml(){
    if(UI.role!=="owner")return `<section class="bc-section"><div class="bc-empty-state"><span>🔒</span><h3>BigCards Owner-Testmenü</h3><p>Dieser Bereich ist ausschließlich für den Owner sichtbar.</p></div></section>`;
    const feature=featuredCard(),featureLite=liteCardLabel(feature),cardOpts=feature?`<option value="${feature.id}">${esc(featureLite.name)} · ${esc(featureLite.rarity)} · Lv ${feature.level}${feature.broken?" · KAPUTT":""}</option>`:"";
    return `<section class="bc-section bc-mod-v421 bc-mod-v426"><div class="bc-section-title"><div><small>OWNER ONLY · V426</small><h2>BigCards Mod-Menü</h2><p>Aktueller Owner-Teststand mit direkter Kartenauswahl, Bulk-Ausrüstung, allen Packs, Hyper/VIP/Wins, Prestige, Fusion, Tränken und Reparatur.</p></div></div>
    <section class="bc-mod-card-giver"><div class="bc-mod-latest-head"><div><small>ALLE KARTEN · AUSWÄHLEN & GEBEN</small><h3>🃏 Einzelne Karte suchen und geben</h3><p>Suche zuerst eine Karte. Tippe sie an, damit sie sichtbar markiert wird. Erst danach stellst du Anzahl, Level, Karten-Rebirth, Hyper-Generation, Rank und optionale Test-Ausrüstung ein.</p></div></div>
      <div class="bc-mod-card-giver-tools"><select data-bc-mod-card-type><option value="all" ${UI.modCardGrantType==="all"?"selected":""}>Alle Karten</option><option value="normal" ${UI.modCardGrantType==="normal"?"selected":""}>Gewöhnlich–Göttlich</option><option value="exclusive" ${UI.modCardGrantType==="exclusive"?"selected":""}>Exclusive</option><option value="vip" ${UI.modCardGrantType==="vip"?"selected":""}>VIP</option><option value="wins" ${UI.modCardGrantType==="wins"?"selected":""}>Wins</option><option value="hyper" ${UI.modCardGrantType==="hyper"?"selected":""}>Hyper</option></select><input type="search" data-bc-mod-card-search value="${esc(UI.modCardGrantSearch||"")}" placeholder="z. B. Apex Godfang, Dragon, VIP Royal …"></div>
      <div data-bc-mod-card-grant-results>${modCardGrantResultsHtml()}</div>
      <div data-bc-mod-selected-card>${modSelectedCardHtml()}</div>
      <div class="bc-mod-card-giver-options"><label>Anzahl<input type="number" min="1" max="50" value="1" data-bc-mod-give-qty></label><label>Kartenlevel<select data-bc-mod-give-level>${[1,2,3,4,5].map(v=>`<option value="${v}">Level ${v}</option>`).join("")}</select></label><label>Karten-Rebirth<select data-bc-mod-give-rebirth>${[0,1,2,3,4,5].map(v=>`<option value="${v}">RB ${v}</option>`).join("")}</select></label><label>Hyper-Generation<select data-bc-mod-give-generation ${modSelectedCardRow()?.hyper?"":"disabled"}>${[1,2,3,4].map(v=>`<option value="${v}">Generation ${v}</option>`).join("")}</select></label><label>Rank<select data-bc-mod-give-rank>${Array.from({length:11},(_,v)=>`<option value="${v}">Rank ${v}</option>`).join("")}</select></label></div>
      <div class="bc-mod-equip-choice"><label>Ausrüstung beim Geben<select data-bc-mod-give-equip><option value="none">Keine zusätzliche Ausrüstung</option><option value="current">Beste Ausrüstung meines aktuellen Stands</option><option value="max">Absolute MAX-Ausrüstung (Owner-Test)</option></select></label><small>„Beste Ausrüstung“ verändert niemals Level, Karten-Rebirth, Rank oder Hyper-Generation. Shiny folgt weiterhin dem Kartenlevel. Eine Spur wird nur gesetzt, wenn genau diese Karte Haupt- oder Backup-Kampfkarte ist.</small><button class="bc-primary" data-bc-mod-give-selected ${modSelectedCardRow()?"":"disabled"}>Ausgewählte Karte geben</button></div>
    </section>
    <section class="bc-mod-bulk-equip"><div class="bc-mod-latest-head"><div><small>ALLE VORHANDENEN KARTEN · AUSRÜSTUNG</small><h3>🧰 Beste Ausrüstung auf Karten anwenden</h3><p>Wendet nur Aura, Kampf-Aura, Bindung, Shiny und – ausschließlich bei aktiver Haupt-/Backup-Kampfkarte – Spur an. <b>Level, Karten-Rebirth, Rank und Hyper-Generation werden nicht verändert.</b></p></div></div>
      <div class="bc-mod-bulk-mode"><label>Modus<select data-bc-mod-bulk-equip-mode><option value="current">Mein aktueller Stand · beste bereits vorhandene/ausgerüstete Sachen</option><option value="max">Absolute MAX-Werte · unabhängig vom normalen Fortschritt</option></select></label></div>
      <div class="bc-mod-scope-grid">${modScopeOptionsHtmlV426()}</div>
      <button class="bc-primary" data-bc-mod-bulk-equip>Ausgewählte Kartenbereiche ausrüsten</button>
    </section>
    <section class="bc-mod-pack-lab"><div class="bc-mod-latest-head"><div><small>ALLE AKTUELLEN PACKS</small><h3>🎴 Pack-Labor</h3><p>Keine Kosten im Owner-Test. Hyper, VIP, Exclusive und alle fünf Wins-Packs sind enthalten.</p></div></div><div class="bc-mod-pack-controls"><label>Test-Pack<select data-bc-mod-pack>${modPackOptionsHtml()}</select><button data-bc-mod-action="pack">Pack erzeugen</button></label><label>JK/Coin-Bestätigung<select data-bc-mod-jk-pack>${modJkPackOptionsHtml()}</select><button data-bc-mod-action="jkPackConfirm">Bestätigung testen</button></label></div></section>
    ${modLatestResourceHtml()}${modInventoryLazyHtml()}${hyperTestCardsHtml()}
    <div class="bc-mod-core-controls"><article class="bc-mod-core-card points"><header><span>💰</span><div><small>WIRTSCHAFT</small><h3>Points verwalten</h3></div></header><div class="bc-mod-core-current"><small>Aktuell</small><b>${fmt(S.points)}</b></div><label>Neuer Kontostand<input type="number" min="0" data-bc-mod-points value="${Math.floor(S.points)}"></label><button data-bc-mod-action="points">Points übernehmen</button></article><article class="bc-mod-core-card level"><header><span>⭐</span><div><small>FORTSCHRITT</small><h3>BigCards Level</h3></div></header><div class="bc-mod-core-current"><small>Aktuell</small><b>Level ${S.level}</b></div><label>Ziel-Level<input type="number" min="1" data-bc-mod-level value="${S.level}"></label><button data-bc-mod-action="level">Level übernehmen</button></article><article class="bc-mod-core-card storage"><header><span>🗄️</span><div><small>PERSÖNLICHE KARTE</small><h3>Karten-Speicher</h3></div></header><div class="bc-mod-core-current"><small>Aktuelle Stufe</small><b>${FEATURED_STORAGE_TIERS[S.featuredStorageTier]?.name||"Basis"}</b></div><label>Speicherstufe<select data-bc-mod-feature-storage>${FEATURED_STORAGE_TIERS.map(x=>`<option value="${x.tier}" ${x.tier===S.featuredStorageTier?"selected":""}>${x.name} · ${fmt(x.points)} Points · ${fmt(x.xp)} XP</option>`).join("")}</select></label><button data-bc-mod-action="featureStorage">Speicher übernehmen</button></article></div>
    <div class="bc-mod-grid">
      <label>Persönliche Karte · Rank<select data-bc-mod-feature-rank ${feature?"":"disabled"}>${FEATURED_RANKS.map(x=>`<option value="${x.rank}" ${feature&&x.rank===cardRank(feature)?"selected":""}>Rank ${x.rank} · ${x.title}</option>`).join("")}</select><input type="number" min="0" placeholder="Meisterschaft" data-bc-mod-feature-rank-mastery value="${feature?cardRankMastery(feature):0}" ${feature?"":"disabled"}><input type="number" min="0" placeholder="Elite-Siege" data-bc-mod-feature-rank-elite value="${feature?cardRankEliteWins(feature):0}" ${feature?"":"disabled"}><button data-bc-mod-action="featureRank" ${feature?"":"disabled"}>Rank testen</button></label>
      <label>Spielfeld-Speicher<select data-bc-mod-field-storage><option value="empty">Leer / Produktion frei</option><option value="full">Voll / Limit testen</option></select><button data-bc-mod-action="fieldStorage">Status setzen</button></label><label>Rebirths<input type="number" data-bc-mod-rebirth value="${S.totalRebirths}"><button data-bc-mod-action="rebirth">Setzen</button></label><label>Stockwerk freischalten<select data-bc-mod-floor>${[1,2,3,4].map(x=>`<option>${x}</option>`).join("")}</select><button data-bc-mod-action="floor">Freischalten</button></label>
      <label>Kartenkampf freigeschaltet bis<select data-bc-mod-battle-tier>${RARITIES.map((r,i)=>`<option value="${i}" ${i===battleUnlockedTier()?"selected":""}>${r.name}</option>`).join("")}</select><button data-bc-mod-action="battleTier">Kampfstufe setzen</button></label><label>Siege für nächste Kampfstufe<input type="number" min="0" data-bc-mod-battle-wins value="${Math.floor(S.battleTierWins||0)}"><button data-bc-mod-action="battleTierWins">Siegzähler setzen</button></label><label>Gesamte Kartenkampf-Siege<input type="number" min="0" data-bc-mod-total-battle-wins value="${Math.floor(S.battleWins||0)}"><button data-bc-mod-action="totalBattleWins">Gesamtsiege setzen</button></label><label>Wins-Währung<input type="number" min="0" max="${WIN_CAP}" data-bc-mod-wins value="${Math.floor(S.winsCurrency||0)}"><button data-bc-mod-action="wins">Wins setzen</button></label>
      <label>Gratis-Ausrüstungsmeilensteine<button data-bc-mod-action="equipmentRewardsReset">Gratis-Claims zurücksetzen</button></label><label>Test-Aura<select data-bc-mod-aura>${AURAS.map(a=>`<option value="${a.id}">${a.name}</option>`).join("")}</select><button data-bc-mod-action="aura">Geben</button></label><label>Test-Kampf-Aura<select data-bc-mod-combat-aura>${COMBAT_AURAS.map(a=>`<option value="${a.id}">${a.name}</option>`).join("")}</select><button data-bc-mod-action="combatAura">Geben</button></label><label>Test-Bindung<select data-bc-mod-bind>${BINDS.map(b=>`<option value="${b.id}">${b.name}</option>`).join("")}</select><button data-bc-mod-action="bind">Geben</button></label>
      <label>Reparatur-Kit geben<select data-bc-mod-repair-kit>${REPAIR_KITS.map(k=>`<option value="${k.id}">${k.name} · aktuell ×${repairKitCount(k.id)}</option>`).join("")}</select><button data-bc-mod-action="repairKit">Kit geben</button></label><label>Kampf-Trank geben<select data-bc-mod-potion>${potionAllTierIds().flatMap(t=>POTION_TYPES.map(p=>`<option value="${t}:${p.id}">${potionTierLabel(t)} · ${p.name}</option>`)).join("")}</select><button data-bc-mod-action="potion">Trank geben</button></label><label>Spur geben<select data-bc-mod-trail>${TRAILS.map(t=>`<option value="${t.id}">${t.name} · aktuell ×${trailCount(t.id)}</option>`).join("")}</select><button data-bc-mod-action="trail">Spur geben</button></label><label>Spuren freigeschaltet bis<select data-bc-mod-trail-tier>${TRAILS.map(t=>`<option value="${t.index}" ${t.index===S.trailTierUnlocked?"selected":""}>${t.name}</option>`).join("")}</select><button data-bc-mod-action="trailTier">Spurstufe setzen</button></label>
      <label>Große Testkarten-Liste<button type="button" data-bc-mod-load-cards>180 stärkste vorhandene Karten laden</button><small>Wird erst bei Bedarf berechnet.</small></label><label>Shiny direkt testen<select data-bc-mod-shiny-card ${cardOpts?"":"disabled"}>${cardOpts||'<option value="">Keine Karte vorhanden</option>'}</select><select data-bc-mod-shiny-level><option value="0">Kein Shiny</option><option value="1">Electric</option><option value="2">Explosive</option><option value="3">Void</option></select><button data-bc-mod-action="shinyTest" ${cardOpts?"":"disabled"}>Shiny setzen</button></label><label>Kartenbruch / Reparatur testen<select data-bc-mod-broken-card ${cardOpts?"":"disabled"}>${cardOpts||'<option value="">Keine Karte vorhanden</option>'}</select><select data-bc-mod-broken-state><option value="broken">Kaputt setzen</option><option value="repair">Reparieren</option></select><button data-bc-mod-action="brokenTest" ${cardOpts?"":"disabled"}>Status setzen</button></label><label>Spielstand<button class="danger" data-bc-mod-action="reset">BigCards zurücksetzen</button></label>
    </div></section>`;
  }
  function showCardDetail(id){const inst=instance(id);if(!inst)return;UI.selectedCard=id;const m=cardMeta(inst),dupes=duplicateIds(inst).length,next=inst.level<5?inst.level+1:null,cost=next?upgradeCost(inst,next):0,placement=findCardPlacement(id),exclusiveFloorBlocked=inst.exclusive&&UI.floor!==0,vipFloorBlocked=inst.vip&&UI.floor>1,permitNeeded=needsFieldPermit(inst,UI.floor),permitCost=fieldPermitCost(inst),repair=inst.broken?repairCost(inst):0,repairKit=inst.broken?repairKitMeta(repairKitId(inst)):null,repairKitOwned=repairKit?repairKitCount(repairKit.id):0;showModal(`<div class="bc-card-detail"><div class="bc-detail-card ${m.className} shiny-${inst.shiny} ${inst.broken?"broken":""}"><div class="bc-card-art"><span>${m.icon}</span>${cardEffectBadges(inst)}${inst.broken?'<span class="bc-card-crack" aria-hidden="true"></span>':""}</div><small>${inst.hyper?`HYPER · GENERATION ${hyperGeneration(inst)} · ${m.hyperTier?.name||""}`:inst.vip?`VIP · ${m.rarity.name}`:inst.exclusive?"EXCLUSIVE":m.rarity.name}</small><h2>${esc(m.name)}</h2><b>Raritätswert ${pct(m.rarityValue)}</b><p>Level ${inst.level}/5 · Rank ${cardRank(inst)}/10 · ${cardRebirth(inst)?`↻ ${cardRebirthLabel(inst)} · `:""}${fmt(m.points)} Points/s · ${fmt(m.xp)} XP/s</p><p class="bc-point-bonus-line"><b>Points-Aufbau:</b> ${esc(pointBonusSummary(inst))}${inst.win?" · Wins-Karte +5 %":""}${inst.hyper?" · Hyper-Rank: 0 % Points":""}${inst.exclusive?" · Produktions-Cap 60.000/s":inst.vip?" · Produktions-Cap 120.000/s":""}</p><p class="bc-combat-value"><b>⚔ Kampfwert ${fmt(m.combat.power)}</b> · Schaden ${fmt(m.combat.min)}–${fmt(m.combat.max)} · Leben ${fmt(m.combat.hp)}</p>${inst.hyper?`<p class="bc-hyper-combat-note">⚡ <b>HYPER-KAMPFKARTE</b> · Generation ${hyperGeneration(inst)}/4 · Rank ${cardRank(inst)}/10 · Rebirth ${cardRebirth(inst)}/5<br>Points und XP absichtlich deutlich reduziert. Hyper-Rank beeinflusst ausschließlich den Kampf und gibt weder Points noch XP. Generation verbessert XP nur langsam; Kampf bleibt der Hauptzweck der Hyperkarte.</p>`:inst.vip?`<p class="bc-vip-combat-note">👑 VIP-Karte · ${m.rarity.name}<br>🏢 Produktionsfeld: <b>nur Stockwerk 1 oder 2 · maximal 5 VIP insgesamt</b>. Im Kartenkampf immer einsetzbar.</p>`:inst.exclusive?`<p class="bc-exclusive-combat-note">Exclusive-Kampfwert folgt deinem normalen Karten-/Packfortschritt · aktuelle Kampfstufe: ${RARITIES[m.combat.tier]?.name||m.combat.tier}<br>🏢 Produktionsfeld: <b>nur Stockwerk 1 · maximal 5 Exclusive insgesamt</b>.</p>`:""}${S.featuredCardId===id?`<p class="bc-feature-selected-note">★ PERSÖNLICHE KARTE · nicht auf Stockwerken einsetzbar · Spur-/Rank-Boni aktiv</p>`:featuredCard()?.backupCardId===id?`<p class="bc-feature-selected-note">🛡 BACKUP-KARTE · nicht auf Stockwerken einsetzbar · eigene Spur im Kampf aktiv</p>`:inst.trail?`<p class="bc-feature-selected-note dormant">☄ ${trailBy(inst.trail)?.name||"Spur"} gespeichert · aktuell nicht im persönlichen Kampfslot.</p>`:""}<p>Direkter Kartenwert: ${fmt(m.value)} Points</p>${placement?`<p><b>Aktiv:</b> Stockwerk ${placement.floor+1} · Platz ${placement.slot+1}</p>`:""}${inst.broken?`<div class="bc-repair-box"><b>💥 KARTE ZERBROCHEN</b><span>Im Kartenkampf nicht einsetzbar.</span><span><strong>Benötigt:</strong> 1× ${repairKit.name} · Inventar ×${repairKitOwned}</span><span><strong>Zusätzlich:</strong> ${fmt(repair)} Points</span><div class="bc-repair-box-actions"><button data-bc-repair-card="${id}">🛠️ Karte reparieren</button><button class="secondary" data-bc-repair-shop>Rep-Shop</button></div></div>`:""}</div><div class="bc-detail-actions"><div class="bc-detail-row"><button data-bc-place-card="${id}" ${(isFeaturedCombatCardId(id)||exclusiveFloorBlocked||vipFloorBlocked)?"disabled":""}>${S.featuredCardId===id?"★ Persönliche Karte aktiv":featuredCard()?.backupCardId===id?"🛡 Backup-Karte aktiv":exclusiveFloorBlocked?"🩸 Exclusive nur auf Stockwerk 1":vipFloorBlocked?"👑 VIP nur auf Stockwerk 1–2":`Auf Stockwerk ${UI.floor+1} setzen`}</button><button data-bc-favorite="${id}">${inst.favorite?"★ Favorit":"☆ Favorit"}</button><button data-bc-lock="${id}">${inst.locked?"🔒 Gesperrt":"🔓 Sperren"}</button>${placement?`<button class="bc-remove-field" data-bc-remove-field="${id}">↩ Entfernen</button>`:""}</div><section><h3>Kartenupgrade & Spielfeld</h3>${next?`<p>Stufe ${next}: ${DUPE_COST[next]} Duplikate (${dupes} frei) + ${fmt(cost)} Points</p>`:`<p><b>★★★★★ MAX</b> · ${cardRebirth(inst)>=CARD_REBIRTH_MAX?"🌈 Karten-Rebirth 5 MAX":"bereit für Karten-Rebirth"}</p>`}<div class="bc-upgrade-field-row">${next?`<button data-bc-upgrade="${id}">Auf Stufe ${next}</button>`:cardRebirth(inst)<CARD_REBIRTH_MAX?`<button class="bc-card-rebirth-button" data-bc-card-rebirth="${id}">↻ Rebirth ${cardRebirth(inst)+1}</button>`:`<span class="bc-card-rebirth-max">🌈 REBIRTH 5 MAX</span>`}<button class="bc-card-rebirth-info-button" data-bc-card-rebirth-info title="Wie funktioniert Karten-Rebirth?">i</button>${permitNeeded?`<button class="bc-field-permit" data-bc-field-permit="${id}">Für ${fmt(permitCost)} aufs Spielfeld</button>`:inst.fieldPermit&&hasEarlyFieldVipAccess()?`<span class="bc-field-permit-owned">✓ VIP-Vorzeitfreigabe aktiv</span>`:inst.rarity>floorMaxTier(UI.floor)&&!hasEarlyFieldVipAccess()?`<button class="bc-field-permit" data-bc-vip-info>👑 VIP für Vorzeitfreigabe benötigt</button>`:""}</div>${permitNeeded?`<small class="bc-field-permit-note">${m.rarity.name} ist auf Stockwerk ${UI.floor+1} regulär noch gesperrt. Diese sehr teure Vorzeitfreigabe gilt dauerhaft nur für dieses Exemplar und erfordert BigCards VIP.</small>`:""}</section>${inst.hyper?`<section class="bc-hyper-generation-box"><div class="bc-hyper-generation-head"><div><small>HYPER-ENTWICKLUNG</small><h3>⚡ Generation ${hyperGeneration(inst)} / ${HYPER_GENERATION_MAX}</h3></div><button class="bc-pack-info-btn" data-bc-hyper-info>i</button></div><p>${hyperGeneration(inst)>=HYPER_GENERATION_MAX?"Generation 4 MAX · voller Generationsmultiplikator aktiv.":`Nächste Generation benötigt: <b>${hyperGenerationCostText(hyperGeneration(inst)+1)}</b>`}</p><div class="bc-hyper-generation-actions"><button data-bc-hyper-generation="${id}" ${hyperGeneration(inst)>=HYPER_GENERATION_MAX?"disabled":""}>${hyperGeneration(inst)>=HYPER_GENERATION_MAX?"GENERATION 4 MAX":`Generation ${hyperGeneration(inst)+1} entwickeln`}</button><button data-bc-hyper-core-craft>⚡ Hyper-Kern herstellen · Bestand ${S.hyperCores||0}</button></div></section>`:""}<section><h3>Kampffähigkeiten</h3><div class="bc-detail-abilities">${combatAbilities(inst,{mustNormal:false}).map(a=>`<article class="${a.normal?"normal":"special"} ${!a.normal&&inst.level<(a.req||1)?"locked":""}"><span>${a.icon}</span><div><b>${a.name}</b><small>${!a.normal&&inst.level<(a.req||1)?`🔒 Freischaltung auf Stufe ${a.req}`:a.desc}</small></div></article>`).join("")}</div></section><section><h3>Aura-Slot · nur Points</h3><p>${inst.aura?`${auraBy(inst.aura)?.name} x${auraBy(inst.aura)?.mult}`:"Keine Aura"}</p><div class="bc-equip-list">${AURAS.filter(a=>(S.auraInventory[a.id]||0)>0).map(a=>`<button data-bc-equip-aura="${a.id}" data-card="${id}">${a.icon} ${a.name} ×${S.auraInventory[a.id]}</button>`).join("")||"Keine Aura im Inventar."}${inst.aura?`<button data-bc-remove-aura="${id}">Aura entfernen</button>`:""}</div></section><section><h3>Kampf-Aura-Slot · nur Kartenkampf</h3><p>${inst.combatAura?`${combatAuraBy(inst.combatAura)?.name} x${combatAuraBy(inst.combatAura)?.mult} Schaden/Kampfwert`:"Keine Kampf-Aura"}</p><div class="bc-equip-list">${COMBAT_AURAS.filter(a=>(S.combatAuraInventory[a.id]||0)>0).map(a=>`<button data-bc-equip-combat-aura="${a.id}" data-card="${id}">${a.icon} ${a.name} ×${S.combatAuraInventory[a.id]}</button>`).join("")||"Keine Kampf-Aura im Inventar."}${inst.combatAura?`<button data-bc-remove-combat-aura="${id}">Kampf-Aura entfernen</button>`:""}</div></section>${cardPotionSection(inst)}<section class="bc-card-trail-section"><h3>☄ Spur · Haupt-/Backup-Karte</h3><p>${inst.trail?`${trailBy(inst.trail)?.icon||"☄"} ${trailBy(inst.trail)?.name||"Spur"} · ${trailBonusText(trailBy(inst.trail))}${isFeaturedCombatCardId(id)?" · <b>AKTIV</b>":" · aktuell inaktiv"}`:"Keine Spur auf diesem Exemplar."}</p>${isFeaturedCombatCardId(id)?`<div class="bc-equip-list"><button class="primary" data-bc-owned-trails="${id}">🎒 Meine Spuren öffnen · ${fmt(ownedTrailInventoryCount())}</button>${inst.trail?`<button data-bc-remove-trail="${id}">Spur entfernen</button>`:""}<button data-bc-trail-shop>Spuren kaufen</button></div>`:`<small>Spuren lassen sich nur ausrüsten, wenn dieses Exemplar im Tab „Karte“ deine Haupt- oder aktuelle Backup-Karte ist.</small>`}</section><section><h3>Bindungs-Slot · nur XP</h3><p>${inst.bind?`${bindBy(inst.bind)?.name} x${bindBy(inst.bind)?.mult}`:"Keine Bindung"}</p><div class="bc-equip-list">${BINDS.filter(b=>(S.bindInventory[b.id]||0)>0).map(b=>`<button data-bc-equip-bind="${b.id}" data-card="${id}">${b.icon} ${b.name} ×${S.bindInventory[b.id]}</button>`).join("")||"Keine Bindung im Inventar."}${inst.bind?`<button data-bc-remove-bind="${id}">Bindung entfernen</button>`:""}</div></section><section><h3>Shiny</h3><p>${["Kein Shiny","Electric Shiny · x1,10 XP","Explosive Shiny · + x1,15 Points","Void Shiny · Auto-Collect"][inst.shiny]}</p>${inst.shiny<3?`<button data-bc-shiny="${id}">Nächste Shiny-Stufe</button>`:"<b>VOID MAX</b>"}</section><div class="bc-detail-row danger-row"><button data-bc-shred="${id}">In Shards zerlegen</button><button class="danger" data-bc-sell="${id}">Für ${fmt(m.value)} Points verkaufen</button></div></div></div>`);}
  function showEquipmentInfo(kind){
    if(kind==="aura")return showModal(`<div class="bc-help-info"><small>AUSRÜSTUNG · INFO</small><h2>Wie funktionieren Auras?</h2><p class="bc-bigcards-definition"><b>BigCards</b> bedeutet einfach dieses Kartenspiel <b>BigCards.kl</b>. Gemeint sind also dein BigCards-Level, deine Sammlung und deine Kartenkampf-Siege hier im Spiel.</p><div class="bc-help-grid"><article><span>✦</span><div><h3>Normale Auras</h3><p>Eine normale Aura verstärkt ausschließlich die <b>Points-Produktion</b> der Karte.</p></div></article><article><span>⚔</span><div><h3>Kampf-Auras</h3><p>Kampf-Auras erhöhen nur <b>Kampfwert und Schaden im Kartenkampf</b>. Beide Aura-Arten können gleichzeitig auf derselben Karte liegen.</p></div></article></div><h3>Kostenlose Wege · normale Auras</h3>${equipmentUnlockList("aura",AURAS)}<h3>Kostenlose Wege · Kampf-Auras</h3>${equipmentUnlockList("combatAura",COMBAT_AURAS)}<p><b>Alternative:</b> Jede normale Aura und jede Kampf-Aura kann unabhängig vom Fortschritt direkt im BigCards-Shop mit Points gekauft werden. Kaufen nimmt dir die kostenlose Meilenstein-Belohnung nicht weg.</p><p>Zum Ausrüsten: <b>Sammlung → Karte</b>. Entfernst du eine Aura, wandert sie zurück ins Inventar.</p><button class="bc-primary" data-bc-modal-close>Verstanden</button></div>`);
    if(kind==="bind")return showModal(`<div class="bc-help-info"><small>AUSRÜSTUNG · INFO</small><h2>Wie funktionieren Bindungen?</h2><p class="bc-bigcards-definition"><b>BigCards</b> = dieses Kartenspiel <b>BigCards.kl</b>. Das BigCards-Level ist das interne Kartenlevel, das oben im Spiel angezeigt wird.</p><div class="bc-help-grid single"><article><span>🔗</span><div><h3>XP-Verstärker für eine Karte</h3><p>Eine Bindung erhöht ausschließlich das <b>interne BigCards-XP</b> dieser Karte. Points-Produktion und Kartenkampf werden dadurch nicht stärker.</p></div></article></div><h3>Kostenlose Freischaltwege</h3>${equipmentUnlockList("bind",BINDS)}<p><b>Alternative:</b> Jede Bindung kann jederzeit direkt im BigCards-Shop mit Points gekauft werden. Die Magierbindung kann zusätzlich weiterhin im JK/Coin-Shop angeboten werden.</p><p>Zum Ausrüsten: <b>Sammlung → Karte → Bindungs-Slot</b>. Pro Karte kann genau eine Bindung aktiv sein; beim Entfernen geht sie zurück ins Inventar.</p><button class="bc-primary" data-bc-modal-close>Verstanden</button></div>`);
    return showModal(`<div class="bc-help-info"><small>KARTENFORTSCHRITT · INFO</small><h2>Wie funktioniert Shiny?</h2><p>Shiny wird <b>nicht aus Packs gezogen</b>. Du entwickelst eine vorhandene Karte direkt im Kartendetail mit Points weiter. Die Shiny-Stufen werden nacheinander freigeschaltet und bleiben dauerhaft auf diesem Kartenexemplar.</p><div class="bc-shiny-info-steps"><article><b>⚡ Electric Shiny</b><span>Kartenlevel 3 erforderlich · x1,10 internes XP.</span></article><article><b>💥 Explosive Shiny</b><span>Kartenlevel 4 erforderlich · zusätzlich x1,15 Points-Produktion.</span></article><article><b>🌑 Void Shiny</b><span>Kartenlevel 5 erforderlich · Points dieser Karte werden automatisch direkt eingesammelt.</span></article></div><p>So geht es: <b>Sammlung → Karte öffnen → Shiny → Nächste Shiny-Stufe</b>. Die Point-Kosten richten sich nach dem Wert der Karte.</p><button class="bc-primary" data-bc-modal-close>Verstanden</button></div>`);
  }
  function equipmentShopRow(kind,x){const inv=equipmentInventory(kind),info=equipmentRewardInfo(kind,x.id),price=equipmentPointPrice(kind,x.id),suffix=kind==="aura"?`x${x.mult} Points`:kind==="combatAura"?`x${x.mult} Kampf`:`x${x.mult} XP`;return `<article class="bc-equipment-shop-row ${info.ready&&!info.claimed?'free-ready':''}"><span>${x.icon}</span><div class="bc-equipment-shop-copy"><b>${x.name}</b><small>${suffix} · Inventar ×${inv[x.id]||0}</small><em>${esc(equipmentProgressText(info))}</em></div><div class="bc-equipment-shop-actions"><button data-bc-equipment-buy="${kind}:${x.id}">${fmt(price)} Points</button>${equipmentFreeButton(kind,x.id)}</div></article>`;}
  function showEquipment(kind){
    if(kind==="shiny"){const cards=Object.values(S.instances).filter(x=>!x.listed).sort((a,b)=>b.level-a.level||effectivePoints(b)-effectivePoints(a)).slice(0,60);return showModal(`<div class="bc-equipment bc-shiny-manager"><div class="bc-manager-title"><div><small>KARTENFORTSCHRITT</small><h2>Shiny verwalten</h2></div><button class="bc-manager-info" data-bc-equipment-info="shiny" title="Shiny Info" aria-label="Shiny Info">i</button></div><p>Wähle eine Karte. Electric ist ab Kartenlevel 3, Explosive ab Level 4 und Void ab Level 5 möglich.</p><div class="bc-shiny-card-list">${cards.length?cards.map(inst=>{const m=cardMeta(inst);return `<button data-bc-card="${inst.id}"><b>${esc(m.name)}</b><small>${inst.vip?`VIP · ${m.rarity.name}`:inst.exclusive?"EXCLUSIVE":m.rarity.name} · Lv ${inst.level}/5 · Shiny ${inst.shiny}/3</small></button>`}).join(""):`<span>Noch keine Karten vorhanden.</span>`}</div></div>`);}
    if(kind==="aura")return showModal(`<div class="bc-aura-manager bc-equipment-store"><div class="bc-aura-manager-head bc-manager-title"><div><small>AUSRÜSTUNG · KAUFEN ODER ERSPIELEN</small><h2>Auras verwalten</h2><p>Jede Aura ist mit Points kaufbar. Die Meilensteine geben dir jede Stufe zusätzlich einmal kostenlos.</p></div><button class="bc-manager-info" data-bc-equipment-info="aura" title="Aura Info" aria-label="Aura Info">i</button></div><div class="bc-aura-split bc-aura-store-split"><section><h3>✦ Normale Auras</h3>${AURAS.map(x=>equipmentShopRow("aura",x)).join("")}</section><section class="combat"><h3>⚔ Kampf-Auras</h3>${COMBAT_AURAS.map(x=>equipmentShopRow("combatAura",x)).join("")}</section></div><p class="bc-aura-manager-note">Zum Ausrüsten anschließend eine konkrete Karte in der Sammlung öffnen.</p></div>`);
    const list=BINDS;showModal(`<div class="bc-equipment bc-equipment-store"><div class="bc-manager-title"><div><small>XP AUSRÜSTUNG · KAUFEN ODER ERSPIELEN</small><h2>Bindungen</h2><p>Alle Bindungen sind direkt mit Points kaufbar und besitzen zusätzlich einen kostenlosen Meilenstein.</p></div><button class="bc-manager-info" data-bc-equipment-info="bind" title="Bindungs Info" aria-label="Bindungs Info">i</button></div><div class="bc-binding-store-list">${list.map(x=>equipmentShopRow("bind",x)).join("")}</div><p>Zum Ausrüsten anschließend eine konkrete Karte in der Sammlung öffnen.</p></div>`);
  }
  function showShardInfo(){showModal(`<div class="bc-shards-info"><small>CARD SHARDS</small><h2>Was bedeutet „In Shards zerlegen“?</h2><p><b>Das ist kein Reset deiner Karte.</b> V426 schützt die gerade geöffnete bzw. ausgebaute Karte und sucht automatisch eine freie, schwächere Duplikat-Kopie desselben Kartenmotivs.</p><ol><li>Nur eine sichere Duplikat-Kopie wird zerstört.</li><li>Hauptkarte, Backup, Spielfeldkarten, Favoriten, gesperrte, gelistete, kaputte, ausgerüstete oder auf Expedition befindliche Karten bleiben geschützt.</li><li>Du erhältst dafür <b>Card Shards + Fusionsstaub</b>.</li><li>Du erhältst dabei keine Points – „für Points verkaufen“ ist ein anderes System.</li></ol><p><b>Aktuell:</b> ${fmt(S.shards)} Card Shards.</p><button data-bc-modal-close>Verstanden</button></div>`);}
  function showCardUpgradeInfo(){showModal(`<div class="bc-help-info"><small>KARTEN VERBESSERN · INFO</small><h2>⚒ So funktionieren Karten-Upgrades</h2><div class="bc-help-grid"><article><span>⬆️</span><div><h3>Level 1–5</h3><p>Eine Karte steigt mit <b>identischen Duplikaten + Points</b>. Für Level 2 / 3 / 4 / 5 brauchst du 2 / 5 / 12 / 25 freie Duplikate.</p></div></article><article><span>↻</span><div><h3>Karten-Rebirth</h3><p>Nach Level 5 kann genau dieses Exemplar bis zu <b>5×</b> rebirthen. Es fällt auf Level 1 zurück, behält aber Aura, Kampf-Aura, Bindung, Shiny, Rank und Spur.</p></div></article><article><span>🛠️</span><div><h3>Reparaturen</h3><p>Zerbrochene Kampfkarten brauchen das passende Reparatur-Kit und Points. Reparieren löscht keine Upgrades.</p></div></article><article><span>👑</span><div><h3>Vorzeitiges Spielfeld</h3><p>Noch nicht freigeschaltete normale/Wins-Karten können nur mit <b>BigCards VIP</b> und der sehr teuren individuellen Vorzeitfreigabe aufs Feld.</p></div></article></div><p>Öffne die <b>Sammlung</b> und danach eine Karte, um Level, Karten-Rebirth, Reparatur, Ausrüstung und Spielfeldfreigabe direkt für dieses Exemplar zu verwalten.</p><button class="bc-primary" data-bc-modal-close>Verstanden</button></div>`);}
  function showModal(html){closeModal();const modal=document.createElement("div");modal.className="bc-modal";modal.dataset.bcModal="1";modal.innerHTML=`<div class="bc-modal-card"><button class="bc-modal-x" data-bc-modal-close>×</button>${html}</div>`;UI.overlay.append(modal)}
  function closeModal(){UI.overlay?.querySelector("[data-bc-modal]")?.remove();}
  // V387: Native Browser-confirm()-Fenster werden in BigCards durch ein eigenes
  // In-Game-Fenster ersetzt. Es liegt über vorhandenen Kartendetails, ohne diese
  // zu schließen, und funktioniert deshalb auch bei Upgrades/Verkäufen sauber.
  function gameConfirm({title="Bitte bestätigen",message="",confirmText="Bestätigen",cancelText="Abbrechen",icon="✓",tone="normal"}={}){
    return new Promise(resolve=>{
      if(!UI.overlay)return resolve(false);
      UI.overlay.querySelector("[data-bc-confirm]")?.remove();
      const wrap=document.createElement("div");wrap.className=`bc-confirm-overlay tone-${tone}`;wrap.dataset.bcConfirm="1";
      wrap.innerHTML=`<div class="bc-confirm-card"><div class="bc-confirm-icon">${esc(icon)}</div><small>BIGCARDS · SICHERE BESTÄTIGUNG</small><h2>${esc(title)}</h2><div class="bc-confirm-message">${esc(message).replace(/\n/g,"<br>")}</div><div class="bc-confirm-actions"><button type="button" class="bc-confirm-cancel">${esc(cancelText)}</button><button type="button" class="bc-confirm-ok">${esc(confirmText)}</button></div></div>`;
      const finish=value=>{document.removeEventListener("keydown",onEsc,true);wrap.remove();resolve(value);};
      const onEsc=e=>{if(e.key!=="Escape")return;e.preventDefault();e.stopImmediatePropagation();finish(false);};
      wrap.querySelector(".bc-confirm-cancel")?.addEventListener("click",()=>finish(false),{once:true});
      wrap.querySelector(".bc-confirm-ok")?.addEventListener("click",()=>finish(true),{once:true});
      wrap.addEventListener("click",e=>{if(e.target===wrap)finish(false)});
      document.addEventListener("keydown",onEsc,true);UI.overlay.append(wrap);
      setTimeout(()=>wrap.querySelector(".bc-confirm-ok")?.focus(),0);
    });
  }
  function gameNumberPrompt({title="Betrag eingeben",message="",value=1,min=1,max=Number.MAX_SAFE_INTEGER,confirmText="Übernehmen",icon="🏪"}={}){
    return new Promise(resolve=>{
      if(!UI.overlay)return resolve(null);
      UI.overlay.querySelector("[data-bc-confirm]")?.remove();
      const wrap=document.createElement("div");wrap.className="bc-confirm-overlay tone-points";wrap.dataset.bcConfirm="1";
      wrap.innerHTML=`<div class="bc-confirm-card"><div class="bc-confirm-icon">${esc(icon)}</div><small>BIGCARDS · EINGABE</small><h2>${esc(title)}</h2><div class="bc-confirm-message">${esc(message).replace(/\n/g,"<br>")}</div><input class="bc-confirm-input" type="number" min="${Number(min)||0}" max="${Number(max)||Number.MAX_SAFE_INTEGER}" step="1" value="${Math.max(Number(min)||0,Math.min(Number(max)||Number.MAX_SAFE_INTEGER,Number(value)||0))}"><div class="bc-confirm-actions"><button type="button" class="bc-confirm-cancel">Abbrechen</button><button type="button" class="bc-confirm-ok">${esc(confirmText)}</button></div></div>`;
      const input=wrap.querySelector(".bc-confirm-input");
      const finish=value=>{document.removeEventListener("keydown",onKey,true);wrap.remove();resolve(value);};
      const submit=()=>{const n=Math.floor(Number(String(input?.value||"").replace(",","."))||0);if(n<min||n>max){input?.focus();return;}finish(n);};
      const onKey=e=>{if(e.key==="Escape"){e.preventDefault();e.stopImmediatePropagation();finish(null);}else if(e.key==="Enter"){e.preventDefault();e.stopImmediatePropagation();submit();}};
      wrap.querySelector(".bc-confirm-cancel")?.addEventListener("click",()=>finish(null),{once:true});wrap.querySelector(".bc-confirm-ok")?.addEventListener("click",submit);wrap.addEventListener("click",e=>{if(e.target===wrap)finish(null)});document.addEventListener("keydown",onKey,true);UI.overlay.append(wrap);setTimeout(()=>{input?.focus();input?.select();},0);
    });
  }
  function toast(text,ms=2600){const el=UI.overlay?.querySelector("[data-bc-toast]");if(!el)return;el.textContent=text;el.classList.add("show");clearTimeout(UI.toastTimer);UI.toastTimer=setTimeout(()=>el.classList.remove("show"),ms)}
  function timeLeft(until){const ms=Math.max(0,(Number(until)||0)-now());if(!ms)return"Aus";const h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000),s=Math.floor(ms%60000/1000);return h?`${h}h ${m}m`:`${m}:${String(s).padStart(2,"0")}`}

  function bindEvents(){UI.overlay.addEventListener("click",async e=>{const b=e.target.closest("button");if(!b)return;if(cloudBooting&&b.dataset.bcClose===undefined){e.preventDefault();e.stopPropagation();return toast("☁ Online-Spielstand wird geladen …",1800);}if(now()<UI.suppressClickUntil){e.preventDefault();e.stopPropagation();return;}if(b.dataset.bcClose!==undefined)return returnToTopGames();if(b.dataset.bcTutorialStart)return startTutorial(b.dataset.bcTutorialStart);if(b.dataset.bcTutorialNext!==undefined)return tutorialMove(1);if(b.dataset.bcTutorialPrev!==undefined)return tutorialMove(-1);if(b.dataset.bcTutorialClose!==undefined)return stopTutorial(true);if(b.dataset.bcOnlineSave!==undefined)return manualOnlineSave();if(b.dataset.bcPrestigeStart!==undefined)return startPrestige();if(b.dataset.bcPrestigeComplete!==undefined)return completePendingPrestige();if(b.dataset.bcPrestigeBuy)return buyPrestigeItem(b.dataset.bcPrestigeBuy);if(b.dataset.bcSectionInfo)return showSectionInfo(b.dataset.bcSectionInfo);if(b.dataset.bcNavToggle!==undefined){UI.navCollapsed=!UI.navCollapsed;const wrap=UI.overlay?.querySelector("[data-bc-nav-wrap]");wrap?.classList.toggle("collapsed",UI.navCollapsed);b.textContent=UI.navCollapsed?"⌄ MENÜ":"⌃ MENÜ";return}if(b.dataset.bcPackCategory){UI.packCategory=b.dataset.bcPackCategory;return refresh(false)}if(b.dataset.bcPackInfo!==undefined)return showNormalPackInfo(Number(b.dataset.bcPackInfo));if(b.dataset.bcWinPackInfo!==undefined)return showWinPackInfo(Number(b.dataset.bcWinPackInfo));if(b.dataset.bcVipPackInfo!==undefined)return showVipPackInfo();if(b.dataset.bcHyperInfo!==undefined)return showHyperInfo();if(b.dataset.bcHyperPack!==undefined)return openHyperPack(b.dataset.bcHyperPack);if(b.dataset.bcWinPack!==undefined)return openWinPack(Number(b.dataset.bcWinPack));if(b.dataset.bcVipPack!==undefined)return openVipPack();if(b.dataset.bcWinsSpend)return spendWins(b.dataset.bcWinsSpend);if(b.dataset.bcWinsInfo!==undefined)return showWinsInfo();if(b.dataset.bcHyperCoreCraft!==undefined)return craftHyperCore();if(b.dataset.bcTab){if(UI.tutorialKey){clearTutorialHighlight();UI.tutorialKey=null;UI.tutorialStep=0;}if(b.dataset.bcTab==="mod"&&UI.role!=="owner")return toast("Das BigCards-Mod-Menü ist ausschließlich für den Owner.");rememberViewScroll();UI.smartSetupToken++;if(b.dataset.bcTab!=="mod")UI.modLoadToken++;UI.tab=b.dataset.bcTab;if(UI.tab==="mod"){UI.modLoadToken++;UI.modInventoryData=null;UI.modInventoryPage=0;renderNav();renderMain();requestAnimationFrame(()=>{if(UI.overlay&&UI.tab==="mod")refreshHeader();});}else refresh(false);if(UI.tab==="market")loadMarket();if(UI.tab==="boss")loadWeeklyBoss();if(UI.tab==="score")loadLeaderboard();return}if(b.dataset.bcFloor!==undefined){UI.floor=Number(b.dataset.bcFloor);refresh();return}if(b.dataset.bcSlot!==undefined&&!b.dataset.bcCard){rememberViewScroll();UI.selectedSlot=Number(b.dataset.bcSlot);UI.tab="collection";refresh(false);toast(`Karte für Slot ${UI.selectedSlot+1} auswählen.`);return}if(b.dataset.bcCard)return showCardDetail(b.dataset.bcCard);if(b.dataset.bcCollect!==undefined)return collectPending();if(b.dataset.bcSmart!==undefined)return smartSetup();if(b.dataset.bcOpenPack!==undefined)return openNormalPack(Number(b.dataset.bcOpenPack),b.dataset.currency||"points");if(b.dataset.bcExclusive)return openExclusivePack(b.dataset.bcExclusive);if(b.dataset.bcStartReveal!==undefined){if(UI.packReveal&&UI.packReveal.index<0){UI.packReveal.index=0;return renderReveal()}return}if(b.dataset.bcNextCard!==undefined){UI.packReveal.index++;return renderReveal()}if(b.dataset.bcSkipReveal!==undefined){UI.packReveal.index=UI.packReveal.results.length;return renderReveal()}if(b.dataset.bcCloseReveal!==undefined){UI.packReveal=null;b.closest("[data-bc-reveal]")?.remove();refresh();return}if(b.dataset.bcTier!==undefined){UI.rarityScroll=Math.max(0,UI.overlay.querySelector("[data-bc-rarity-tabs]")?.scrollLeft||UI.rarityScroll||0);UI.collectionTier=Number(b.dataset.bcTier);UI.collectionPage=0;UI.collectionPageMenu=false;UI.mainScroll.collection=0;return renderCollectionFast()}if(b.dataset.bcPageMenu!==undefined){UI.collectionPageMenu=!UI.collectionPageMenu;return renderCollectionFast()}if(b.dataset.bcPageChoice!==undefined){UI.collectionPage=Math.max(0,Number(b.dataset.bcPageChoice));UI.collectionPageMenu=false;UI.mainScroll.collection=0;return renderCollectionFast()}if(b.dataset.bcPage!==undefined){UI.collectionPage=Math.max(0,Number(b.dataset.bcPage));UI.collectionPageMenu=false;UI.mainScroll.collection=0;return renderCollectionFast()}if(b.dataset.bcBulkLevel!==undefined)return bulkLevelUnlocked()?bulkLevelCurrentTier():unlockBulkLevelFromCollection();if(b.dataset.bcBulkRebirth!==undefined)return bulkRebirthUnlocked()?bulkRebirthCurrentTier():unlockBulkRebirthFromCollection();if(b.dataset.bcRebirth!==undefined)return doRebirth(false);if(b.dataset.bcRebirthSkip!==undefined)return doRebirth(true);if(b.dataset.bcBuyCollector!==undefined)return buyCollectorPoints();if(b.dataset.bcAutoInfo!==undefined)return showAutoOpenerInfo();if(b.dataset.bcAutoCollapse!==undefined){UI.autoOpenerCollapsed=!UI.autoOpenerCollapsed;return refresh(true);}if(b.dataset.bcExclusiveInfo!==undefined)return showExclusivePackInfo();if(b.dataset.bcVipInfo!==undefined)return showVipInfo();if(b.dataset.bcVipSpin!==undefined)return spinVipWheel();if(b.dataset.bcVipClick!==undefined)return vipClick();if(b.dataset.bcVipClickerUpgrade!==undefined)return upgradeVipClicker();if(b.dataset.bcVipSpecial)return buyVipSpecial(b.dataset.bcVipSpecial);if(b.dataset.bcVipSpecialUse!==undefined)return useVipSpecial();if(b.dataset.bcAutoLane!==undefined){const laneIndex=clamp(Number(b.dataset.bcAutoLane)||0,0,AUTO_OPENER_MAX_LANES-1),cap=clamp(Math.floor(Number(S.autoOpenerCapacity)||0),0,AUTO_OPENER_MAX_LANES);if(laneIndex>=cap){toast(`Auto-Opener-Kanal ${laneIndex+1} ist noch gesperrt. Die ersten vier Auto-Opener-Käufe schalten Kanal 1–4 dauerhaft frei.`);return window.JKCoinApp?.openForGame?.("bigcards")}UI.autoLaneSelected=laneIndex;refreshAutoOpenerControls();const card=UI.overlay?.querySelector(`[data-bc-auto-channel="${laneIndex}"]`);card?.scrollIntoView?.({behavior:"smooth",block:"nearest",inline:"nearest"});return}if(b.dataset.bcAutoLaneToggle!==undefined){const laneIndex=clamp(Number(b.dataset.bcAutoLaneToggle)||0,0,AUTO_OPENER_MAX_LANES-1);UI.autoLaneSelected=laneIndex;return toggleAutoLane(laneIndex)}if(b.dataset.bcAutoSummaryClose!==undefined){S.autoOpenerSummary=null;closeModal();persistPassive();return}if(b.dataset.bcToggleAuto!==undefined)return toggleAuto();if(b.dataset.bcJkshop!==undefined)return window.JKCoinApp?.openForGame?.("bigcards");if(b.dataset.bcRepairShop!==undefined)return showRepairShop();if(b.dataset.bcTrailShop!==undefined)return showTrailShop();if(b.dataset.bcTrailInfo!==undefined)return showTrailInfo();if(b.dataset.bcOwnedTrails)return showOwnedTrails(b.dataset.bcOwnedTrails);if(b.dataset.bcBuyTrail)return buyTrail(b.dataset.bcBuyTrail);if(b.dataset.bcTrailUnlock!==undefined)return unlockNextTrail();if(b.dataset.bcFeaturePicker!==undefined)return showFeaturedPicker();if(b.dataset.bcFeatureSelect)return selectFeaturedCard(b.dataset.bcFeatureSelect);if(b.dataset.bcFeatureClear!==undefined)return clearFeaturedCard();if(b.dataset.bcFeatureRank!==undefined)return showFeaturedRank();if(b.dataset.bcRankInfo!==undefined)return showFeaturedRankInfo();if(b.dataset.bcBackupPicker!==undefined)return showFeaturedBackupPicker();if(b.dataset.bcBackupSelect)return setFeaturedBackupCard(b.dataset.bcBackupSelect);if(b.dataset.bcBackupClear!==undefined)return clearFeaturedBackup();if(b.dataset.bcRankUpgrade!==undefined)return upgradeFeaturedRank();if(b.dataset.bcFeatureCollect!==undefined)return collectFeatured();if(b.dataset.bcEquipTrail)return equipTrail(b.dataset.card,b.dataset.bcEquipTrail);if(b.dataset.bcRemoveTrail)return removeTrail(b.dataset.bcRemoveTrail);if(b.dataset.bcPotionShop!==undefined)return showPotionShop();if(b.dataset.bcPotionTier)return showPotionTierShop(b.dataset.bcPotionTier);if(b.dataset.bcBuyPotion)return buyPotion(b.dataset.tier,b.dataset.bcBuyPotion);if(b.dataset.bcUpgradePotion)return upgradePotionMastery(b.dataset.tier,b.dataset.bcUpgradePotion);if(b.dataset.bcEquipPotion)return equipPotion(b.dataset.card,b.dataset.bcEquipPotion);if(b.dataset.bcRemovePotion)return removePotion(b.dataset.bcRemovePotion,Number(b.dataset.bcPotionSlot)||0);if(b.dataset.bcBuyRepairKit)return buyRepairKit(b.dataset.bcBuyRepairKit);if(b.dataset.bcEquipmentBuy){const [kind,id]=String(b.dataset.bcEquipmentBuy).split(":");return buyEquipment(kind,id)}if(b.dataset.bcEquipmentFree){const [kind,id]=String(b.dataset.bcEquipmentFree).split(":");return claimFreeEquipment(kind,id)}if(b.dataset.bcEquipmentInfo)return showEquipmentInfo(b.dataset.bcEquipmentInfo);if(b.dataset.bcEquipment)return showEquipment(b.dataset.bcEquipment);if(b.dataset.bcCardUpgradeInfo!==undefined)return showCardUpgradeInfo();if(b.dataset.bcShardsInfo!==undefined)return showShardInfo();if(b.dataset.bcOnlineMenu!==undefined)return showOnlineBattleMenu();if(b.dataset.bcOnlineMode)return beginOnlineMatchmaking(b.dataset.bcOnlineMode);if(b.dataset.bcOnlineCancel!==undefined)return cancelOnlineMatchmaking();if(b.dataset.bcOnlineAction){e.preventDefault();b.blur();return performOnlineBattleAction(b.dataset.bcOnlineAction);}if(b.dataset.bcOnlineBackup!==undefined){e.preventDefault();b.blur();return manualOnlineBackupSwitch();}if(b.dataset.bcOnlineForfeit!==undefined)return forfeitOnlineBattle();if(b.dataset.bcOnlineClose!==undefined)return closeOnlineBattleView();if(b.dataset.bcBattlePicker!==undefined)return showBattlePicker();if(b.dataset.bcBattleBest!==undefined)return chooseBestBattleCard();if(b.dataset.bcFeatureBest!==undefined)return chooseBestFeaturedCombatCard();if(b.dataset.bcBattlePick)return chooseBattleCardById(b.dataset.bcBattlePick);if(b.dataset.bcBattleStart!==undefined)return startBattle();if(b.dataset.bcBattleUpgrade!==undefined)return upgradeBattleTier();if(b.dataset.bcBattleAction){e.preventDefault();b.blur();return performPlayerBattleAction(b.dataset.bcBattleAction);}if(b.dataset.bcBattleBackupSwitch!==undefined){e.preventDefault();b.blur();return manualBattleBackupSwitch();}if(b.dataset.bcBattleRepair)return openBattleRepair(b.dataset.bcBattleRepair);if(b.dataset.bcRepairCard)return repairCard(b.dataset.bcRepairCard);if(b.dataset.bcPlaceCard)return placeCard(b.dataset.bcPlaceCard);if(b.dataset.bcRemoveField)return removeCardFromField(b.dataset.bcRemoveField);if(b.dataset.bcFavorite){const x=instance(b.dataset.bcFavorite);x.favorite=!x.favorite;persist();return showCardDetail(x.id)}if(b.dataset.bcLock){const x=instance(b.dataset.bcLock);x.locked=!x.locked;persist();return showCardDetail(x.id)}if(b.dataset.bcCardRebirthInfo!==undefined)return showCardRebirthInfo();if(b.dataset.bcCardRebirth)return rebirthCard(b.dataset.bcCardRebirth);if(b.dataset.bcHyperGeneration)return upgradeHyperGeneration(b.dataset.bcHyperGeneration);if(b.dataset.bcUpgrade)return upgradeCard(b.dataset.bcUpgrade);if(b.dataset.bcFieldPermit)return unlockAndPlaceCard(b.dataset.bcFieldPermit);if(b.dataset.bcShiny)return upgradeShiny(b.dataset.bcShiny);if(b.dataset.bcEquipAura)return equipAura(b.dataset.card,b.dataset.bcEquipAura);if(b.dataset.bcEquipCombatAura)return equipCombatAura(b.dataset.card,b.dataset.bcEquipCombatAura);if(b.dataset.bcEquipBind)return equipBind(b.dataset.card,b.dataset.bcEquipBind);if(b.dataset.bcRemoveAura)return removeAura(b.dataset.bcRemoveAura);if(b.dataset.bcRemoveCombatAura)return removeCombatAura(b.dataset.bcRemoveCombatAura);if(b.dataset.bcRemoveBind)return removeBind(b.dataset.bcRemoveBind);if(b.dataset.bcSell)return sellCard(b.dataset.bcSell);if(b.dataset.bcShred)return shredDuplicate(b.dataset.bcShred);if(b.dataset.bcExpPick!==undefined)return showExpeditionPicker(Number(b.dataset.bcExpPick));if(b.dataset.bcExpeditionCard)return showExpeditionConfig(b.dataset.bcExpeditionCard);if(b.dataset.bcExpStart!==undefined)return startExpedition(Number(b.dataset.bcExpSlot),b.dataset.bcExpCard,b.dataset.bcExpStart,Number(b.dataset.bcExpMinutes));if(b.dataset.bcExpClaim!==undefined)return claimExpedition(Number(b.dataset.bcExpClaim));if(b.dataset.bcFusionCard)return showFusionCard(b.dataset.bcFusionCard);if(b.dataset.bcFuseCard)return fuseCard(b.dataset.bcFuseCard,b.dataset.bcFuseTarget);if(b.dataset.bcSetToggle){e.preventDefault();const group=b.dataset.bcSetToggle;if(group==="normal")UI.setNormalOpen=!UI.setNormalOpen;else if(group==="crazy")UI.setCrazyOpen=!UI.setCrazyOpen;return refresh(true)}if(b.dataset.bcUltimateInfo!==undefined)return showUltimateSetInfo();if(b.dataset.bcUltimateClaim!==undefined)return claimUltimateSetReward();if(b.dataset.bcSetSelect){UI.setSelected=b.dataset.bcSetSelect;const def=SET_BY_ID[UI.setSelected];if(def?.group==="normal")UI.setNormalOpen=true;else if(def?.group==="crazy")UI.setCrazyOpen=true;return refresh(false)}if(b.dataset.bcSetMission)return claimSetMission(b.dataset.bcSetMission);if(b.dataset.bcBossRefresh!==undefined)return loadWeeklyBoss(true);if(b.dataset.bcBossPick)return setBossCard(Number(b.dataset.bcBossSlot),b.dataset.bcBossPick);if(b.dataset.bcBossSlot!==undefined)return showBossCardPicker(Number(b.dataset.bcBossSlot));if(b.dataset.bcBossAuto!==undefined)return autoBossTeam();if(b.dataset.bcBossAttack!==undefined)return attackWeeklyBoss();if(b.dataset.bcBossMilestone)return claimBossMilestone(b.dataset.bcBossMilestone);if(b.dataset.bcBossCommunity)return claimBossCommunity(b.dataset.bcBossCommunity);if(b.dataset.bcBossShop)return buyBossShop(b.dataset.bcBossShop);if(b.dataset.bcScoreInfo)return showCollectionScoreInfo(b.dataset.bcScoreInfo);if(b.dataset.bcSettingsReset!==undefined)return resetUiPreferences();if(b.dataset.bcMarketStats)return showMarketCardStats(b.dataset.bcMarketStats);if(b.dataset.bcModalClose!==undefined){if(UI.onlineStatus==="searching"&&UI.overlay.querySelector("[data-bc-online-search]"))return cancelOnlineMatchmaking();return closeModal();}if(b.dataset.bcClaim)return claimDaily(b.dataset.bcClaim);if(b.dataset.bcMarketRefresh!==undefined)return loadMarket(true);if(b.dataset.bcMarketInfo!==undefined)return showMarketInfo();if(b.dataset.bcScoreRefresh!==undefined)return loadLeaderboard(true);if(b.dataset.bcListCard)return promptListing(b.dataset.bcListCard);if(b.dataset.bcBuyListing)return buyListing(b.dataset.bcBuyListing);if(b.dataset.bcCancelListing)return cancelListing(b.dataset.bcCancelListing);if(b.dataset.bcRoleRefresh!==undefined)return loadRole(true);if(b.dataset.bcModLoadInventory!==undefined)return loadModInventoryAsync();if(b.dataset.bcModInventorySearchClear!==undefined){UI.modInventorySearch="";UI.modInventoryPage=0;return renderModInventoryData(true)}if(b.dataset.bcModInventoryPage!==undefined){UI.modInventoryPage=Math.max(0,Math.floor(Number(b.dataset.bcModInventoryPage)||0));return renderModInventoryData()}if(b.dataset.bcModSelectCard)return modSelectCardV426(b.dataset.bcModSelectCard);if(b.dataset.bcModGiveSelected!==undefined)return modGiveSelectedCardV426();if(b.dataset.bcModBulkEquip!==undefined)return modBulkEquipCardsV426();if(b.dataset.bcModLoadCards!==undefined)return loadModTestCardsAsync();if(b.dataset.bcModRemoveKind)return modRemoveInventory(b.dataset.bcModRemoveKind,b.dataset.bcModRemoveKey);if(b.dataset.bcModAction)return modAction(b.dataset.bcModAction)});
    UI.overlay.addEventListener("pointerdown",e=>{
      if(UI.tab!=="field"||e.button>0)return;const source=e.target.closest?.(".bc-slot.filled[data-bc-card][data-bc-slot]");if(!source)return;
      const sourceSlot=Number(source.dataset.bcSlot);if(!Number.isInteger(sourceSlot))return;clearFieldDragVisuals();UI.drag={pointerId:e.pointerId,cardId:source.dataset.bcCard,sourceSlot,floor:UI.floor,sourceEl:source,startX:e.clientX,startY:e.clientY,startAt:now(),targetSlot:sourceSlot,active:false,timer:0,ghost:null};
      UI.drag.timer=setTimeout(()=>{if(UI.drag?.pointerId===e.pointerId)startFieldDrag(e)},180);
    },{passive:true});
    UI.overlay.addEventListener("pointermove",e=>{const d=UI.drag;if(!d||d.pointerId!==e.pointerId)return;if(!d.active){const dist=Math.hypot(e.clientX-d.startX,e.clientY-d.startY);if(dist>12&&now()-d.startAt<160){clearTimeout(d.timer);UI.drag=null;}return;}updateFieldDrag(e);},{passive:false});
    UI.overlay.addEventListener("pointerup",e=>{if(UI.drag?.pointerId===e.pointerId)finishFieldDrag(e,false);},{passive:false});
    UI.overlay.addEventListener("pointercancel",e=>{if(UI.drag?.pointerId===e.pointerId)finishFieldDrag(e,true);},{passive:false});
    UI.overlay.addEventListener("contextmenu",e=>{if(e.target.closest?.(".bc-slot.filled[data-bc-card]"))e.preventDefault();});
    UI.overlay.addEventListener("scroll",e=>{if(e.target.matches?.("[data-bc-rarity-tabs]"))UI.rarityScroll=Math.max(0,e.target.scrollLeft||0);if(e.target.matches?.("[data-bc-main]"))UI.mainScroll[UI.tab]=Math.max(0,e.target.scrollTop||0);},true);UI.overlay.addEventListener("change",e=>{if(e.target.matches?.("[data-bc-mod-card-type]")){UI.modCardGrantType=e.target.value;return renderModCardGrantResults()}if(e.target.matches?.("[data-bc-mod-bulk-scope]")){const all=UI.overlay?.querySelector('[data-bc-mod-bulk-scope="all"]'),box=e.target;if(box.dataset.bcModBulkScope==="all"&&box.checked){for(const el of UI.overlay.querySelectorAll("[data-bc-mod-bulk-scope]"))if(el!==box)el.checked=false;}else if(box.checked&&all)all.checked=false;return}if(e.target.matches?.("[data-bc-setting]")){setUiPreference(e.target.dataset.bcSetting,e.target.checked);return}if(e.target.matches?.("[data-bc-rebirth-score-tier]")){UI.rebirthScoreTier=clamp(Math.floor(Number(e.target.value)||0),0,16);return renderCollectionFast();}const ht=e.target.closest?.("[data-bc-hyper-test-field]");if(ht){const i=clamp(Number(ht.dataset.bcHyperTestIndex)||0,0,3),field=ht.dataset.bcHyperTestField,cfg=ensureHyperTestConfigs()[i];cfg[field]=["rank","rebirth","shiny"].includes(field)?Number(ht.value):ht.value;return refresh(true);}if(e.target.matches("[data-bc-auto-pack]")){const laneIndex=clamp(Number(e.target.dataset.bcAutoPack)||0,0,AUTO_OPENER_MAX_LANES-1);if(S.autoOpenerLanes?.[laneIndex]&&laneIndex<S.autoOpenerCapacity){UI.autoLaneSelected=laneIndex;S.autoOpenerLanes[laneIndex].pack=e.target.value;persistPassive();refreshAutoOpenerControls();showAutoOpenerStatus(null,`Auto ${laneIndex+1}: ${RARITIES[RARITY_INDEX[e.target.value]??0]?.name||"Gewöhnlich"}`)}}});UI.overlay.addEventListener("input",e=>{if(e.target.matches("[data-bc-mod-inventory-search]")){UI.modInventorySearch=e.target.value;UI.modInventoryPage=0;clearTimeout(e.target._t);e.target._t=setTimeout(()=>renderModInventoryData(true),120);return}if(e.target.matches("[data-bc-mod-card-search]")){UI.modCardGrantSearch=e.target.value;clearTimeout(e.target._t);e.target._t=setTimeout(renderModCardGrantResults,100);return}if(e.target.matches("[data-bc-collection-search]")){UI.collectionSearch=e.target.value;UI.collectionPage=0;UI.collectionPageMenu=false;clearTimeout(e.target._t);e.target._t=setTimeout(renderCollectionFast,120)}});
    window.addEventListener("keydown",onKey);}
  function onKey(e){if(!UI.overlay)return;if(e.code==="Escape"){if(UI.onlineStatus==="searching")cancelOnlineMatchmaking();else if(UI.overlay.querySelector("[data-bc-modal]"))closeModal();else if(UI.overlay.querySelector("[data-bc-reveal]")){UI.packReveal=null;UI.overlay.querySelector("[data-bc-reveal]")?.remove()}else returnToTopGames()}}

  async function firebase(){try{return await window.LifeBuilderFirebaseCore?.load?.()}catch{return null}}
  window.addEventListener("lifebuilder-firestore-write-backoff",(event)=>{
    const until=Math.max(0,Number(event?.detail?.until)||0);
    if(!until)return;
    cloudBackoffUntil=Math.max(cloudBackoffUntil,until);
    if(cloudSaveTimer){clearTimeout(cloudSaveTimer);cloudSaveTimer=0;cloudSaveDueAt=0;}
    if(cloudReady&&!cloudMigrationPending)scheduleCloudSave(Math.max(CLOUD_SAVE_DELAY_MS,until-now()));
  });
  async function currentUser(){const fb=await firebase();if(!fb)return null;try{return fb.auth.currentUser||await window.LifeBuilderFirebaseCore.waitForAuth?.(5000)}catch{return fb.auth.currentUser}}
  function currentUidSync(){return window.LifeBuilderFirebaseCore?.getRuntime?.()?.auth?.currentUser?.uid||""}
  async function displayName(){const u=await currentUser();return u?.displayName||u?.email?.split("@")[0]||"Spieler"}
  function deviceId(){const key=`${SAVE_KEY}:device`;try{let id=localStorage.getItem(key);if(!id){id=`dev-${now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;localStorage.setItem(key,id)}return id}catch{return `dev-${Math.random().toString(36).slice(2,10)}`}}
  function cloudHash(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16).padStart(8,"0")}
  function utf8Size(text){try{return new TextEncoder().encode(text).length}catch{return unescape(encodeURIComponent(text)).length}}
  function splitCloudPayload(text){
    const out=[];let pos=0;
    while(pos<text.length){
      let high=Math.min(text.length,pos+CLOUD_CHUNK_CHARS),end=high;
      if(utf8Size(text.slice(pos,end))>CLOUD_CHUNK_MAX_BYTES){let low=pos+1;while(low<high){const mid=Math.floor((low+high+1)/2),part=text.slice(pos,mid);if(utf8Size(part)<=CLOUD_CHUNK_MAX_BYTES)low=mid;else high=mid-1;}end=low;}
      if(end<text.length){const c=text.charCodeAt(end-1);if(c>=0xD800&&c<=0xDBFF)end--;}
      if(end<=pos)throw new Error("Cloud-Chunk konnte nicht geteilt werden");out.push(text.slice(pos,end));pos=end;
    }
    return out.length?out:[""];
  }
  function cloudBucketIndex(key,count){
    let h=2166136261>>>0;for(const ch of String(key||"")){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h%Math.max(1,count);
  }
  function splitCloudBucket(kind,bucket,value){
    const full=JSON.stringify({kind,bucket,value});
    if(utf8Size(full)<=CLOUD_CHUNK_TARGET_BYTES)return {primary:full,overflow:[]};
    const entries=Object.entries(value||{}).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))),parts=[];let current={},count=0,currentBytes=utf8Size(JSON.stringify({kind,bucket,value:{}}));
    const flush=()=>{if(count){parts.push(current);current={};count=0;currentBytes=utf8Size(JSON.stringify({kind,bucket,value:{}}));}};
    for(const [key,row] of entries){
      const entryText=JSON.stringify({[key]:row}),entryBytes=Math.max(0,utf8Size(entryText)-2)+(count?1:0);
      if(count&&currentBytes+entryBytes>CLOUD_CHUNK_TARGET_BYTES)flush();
      current[key]=row;count++;currentBytes+=Math.max(0,utf8Size(entryText)-2)+(count>1?1:0);
      if(currentBytes>CLOUD_CHUNK_MAX_BYTES)throw new Error(`Cloud-Bucket ${bucket+1} enthält einen einzelnen Datensatz, der zu groß ist.`);
    }
    flush();if(!parts.length)parts.push({});
    const primary=JSON.stringify({kind,bucket,value:parts[0]}),overflow=parts.slice(1).map((partValue,index)=>JSON.stringify({kind,bucket,part:index+1,value:partValue}));
    for(const text of [primary,...overflow])if(utf8Size(text)>CLOUD_CHUNK_MAX_BYTES)throw new Error(`Cloud-Bucket ${bucket+1} konnte nicht sicher geteilt werden.`);
    return {primary,overflow};
  }
  function compactCloudInstance(inst){
    const row={...(inst||{})};
    const defaults={
      level:1,cardRebirth:0,rank:0,rankMastery:0,rankEliteWins:0,rankWins:0,rankedAt:0,
      backupCardId:null,aura:null,combatAura:null,bind:null,shiny:0,battlePotion:null,
      broken:false,brokenAt:0,favorite:false,locked:false,listed:false,
      vip:false,vipId:null,exclusive:false,exclusiveId:null,basePower:null,
      trail:null,fusion:"normal",win:false,winId:null,winPack:null,
      hyper:false,hyperId:null,hyperGeneration:1
    };
    for(const [key,value] of Object.entries(defaults)){
      if(Object.prototype.hasOwnProperty.call(row,key)&&row[key]===value)delete row[key];
    }
    if(Array.isArray(row.battlePotions)&&row.battlePotions.length===0)delete row.battlePotions;
    return row;
  }
  function buildCloudBucketPayloads(state){
    const meta={...state};delete meta.instances;delete meta.collection;
    const metaText=JSON.stringify({kind:"meta",value:meta});if(utf8Size(metaText)>CLOUD_CHUNK_MAX_BYTES)throw new Error("Cloud-Metadaten sind zu groß. Bitte Support melden.");
    const base=[metaText],overflow=[];
    const instBuckets=Array.from({length:CLOUD_INSTANCE_BUCKETS},()=>({}));
    for(const [key,value] of Object.entries(state.instances||{}))instBuckets[cloudBucketIndex(key,CLOUD_INSTANCE_BUCKETS)][key]=compactCloudInstance(value);
    for(let i=0;i<CLOUD_INSTANCE_BUCKETS;i++){const split=splitCloudBucket("instances",i,instBuckets[i]);base.push(split.primary);overflow.push(...split.overflow);}
    const colBuckets=Array.from({length:CLOUD_COLLECTION_BUCKETS},()=>({}));
    for(const [key,value] of Object.entries(state.collection||{}))colBuckets[cloudBucketIndex(key,CLOUD_COLLECTION_BUCKETS)][key]=value;
    for(let i=0;i<CLOUD_COLLECTION_BUCKETS;i++){const split=splitCloudBucket("collection",i,colBuckets[i]);base.push(split.primary);overflow.push(...split.overflow);}
    const out=base.concat(overflow);
    if(base.length!==CLOUD_BUCKET_CHUNKS)throw new Error("Cloud-Basis-Bucket-Anzahl stimmt nicht");
    if(out.length>CLOUD_MAX_CHUNKS)throw new Error(`BigCards-Spielstand ist für den Cloud-Speicher zu groß (${out.length} Chunks).`);
    return out;
  }
  function yieldBigCardsMainThreadV429(){return new Promise(resolve=>setTimeout(resolve,0));}
  async function buildCloudBucketPayloadsAsyncV429(state){
    const meta={...state};delete meta.instances;delete meta.collection;
    const metaText=JSON.stringify({kind:"meta",value:meta});if(utf8Size(metaText)>CLOUD_CHUNK_MAX_BYTES)throw new Error("Cloud-Metadaten sind zu groß. Bitte Support melden.");
    const base=[metaText],overflow=[],instBuckets=Array.from({length:CLOUD_INSTANCE_BUCKETS},()=>({}));
    let n=0;
    for(const key in (state.instances||{})){
      if(!Object.prototype.hasOwnProperty.call(state.instances,key))continue;
      instBuckets[cloudBucketIndex(key,CLOUD_INSTANCE_BUCKETS)][key]=compactCloudInstance(state.instances[key]);
      if(++n%900===0)await yieldBigCardsMainThreadV429();
    }
    for(let i=0;i<CLOUD_INSTANCE_BUCKETS;i++){
      const split=splitCloudBucket("instances",i,instBuckets[i]);base.push(split.primary);overflow.push(...split.overflow);
      if(i%3===2)await yieldBigCardsMainThreadV429();
    }
    const colBuckets=Array.from({length:CLOUD_COLLECTION_BUCKETS},()=>({}));n=0;
    for(const key in (state.collection||{})){
      if(!Object.prototype.hasOwnProperty.call(state.collection,key))continue;
      colBuckets[cloudBucketIndex(key,CLOUD_COLLECTION_BUCKETS)][key]=state.collection[key];
      if(++n%900===0)await yieldBigCardsMainThreadV429();
    }
    for(let i=0;i<CLOUD_COLLECTION_BUCKETS;i++){
      const split=splitCloudBucket("collection",i,colBuckets[i]);base.push(split.primary);overflow.push(...split.overflow);
      if(i%3===2)await yieldBigCardsMainThreadV429();
    }
    const out=base.concat(overflow);
    if(base.length!==CLOUD_BUCKET_CHUNKS)throw new Error("Cloud-Basis-Bucket-Anzahl stimmt nicht");
    if(out.length>CLOUD_MAX_CHUNKS)throw new Error(`BigCards-Spielstand ist für den Cloud-Speicher zu groß (${out.length} Chunks).`);
    return out;
  }
  function cloudHasFullSave(root){return Number(root?.schemaVersion)>=CLOUD_MIN_SCHEMA_VERSION&&typeof root?.saveId==="string"&&Number(root?.chunkCount)>0;}
  function meaningfulLocalProgress(raw){if(!raw||typeof raw!=="object")return false;return Object.keys(raw.instances||{}).length>0||Object.keys(raw.collection||{}).length>0||Object.keys(raw.exclusiveCollection||{}).length>0||Object.keys(raw.vipCollection||{}).length>0||Object.keys(raw.winCollection||{}).length>0||Object.keys(raw.hyperCollection||{}).length>0||Number(raw.points)>1000||Number(raw.level)>1||Number(raw.totalRebirths)>0||Number(raw.lifetimeScore)>0;}
  function mergeLegacyCheckpoint(raw,root){const out=Object.assign(defaultState(),raw||{});if(root){out.points=Math.max(0,Number(root.points)||out.points||1000);out.level=Math.max(1,Number(root.level)||out.level||1);out.totalRebirths=Math.max(0,Number(root.totalRebirths)||out.totalRebirths||0);out.lifetimeScore=Math.max(Number(out.lifetimeScore)||0,Number(root.lifetimeScore)||0);out.updatedAt=Math.max(Number(out.updatedAt)||0,Number(root.updatedAtMs)||0);}return out;}
  function cloudIntegrityError(message){const e=new Error(message);e.code="bigcards-cloud-integrity";e.cloudIntegrity=true;return e;}
  function cloudChunkRefId(index,hash){return `bucket-${String(index).padStart(3,"0")}-${String(hash||"").slice(0,16)}`;}
  async function readFullCloudState(fb,userId,root){
    if(!cloudHasFullSave(root))return null;
    const count=Math.floor(Number(root.chunkCount)||0);
    if(count<1||count>CLOUD_MAX_CHUNKS)throw cloudIntegrityError("Ungültige Cloud-Chunk-Anzahl");
    const expectedHashes=Array.isArray(root.chunkHashes)&&root.chunkHashes.length===count?root.chunkHashes:null;
    const immutable=root.cloudFormat===CLOUD_BUCKET_FORMAT;
    const legacyBuckets=root.cloudFormat===CLOUD_LEGACY_BUCKET_FORMAT;
    const refs=immutable&&Array.isArray(root.chunkRefs)&&root.chunkRefs.length===count?root.chunkRefs:null;
    if(immutable&&!refs)throw cloudIntegrityError("Cloud-Manifest enthält keine gültigen Bucket-Referenzen");
    const chunks=new Array(count),specs=[];
    for(let i=0;i<count;i++){
      const id=immutable?String(refs[i]||""):`${legacyBuckets?"bucket":"chunk"}-${String(i).padStart(3,"0")}`;
      if(!id)throw cloudIntegrityError(`Cloud-Chunk ${i+1}/${count} hat keine Referenz`);
      specs.push({i,id});
    }
    const validate=(i,id,snap)=>{
      if(!snap?.exists?.())throw cloudIntegrityError(`Cloud-Chunk ${i+1}/${count} fehlt`);
      const d=snap.data()||{};
      if(Number(d.index)!==i||typeof d.data!=="string")throw cloudIntegrityError(`Cloud-Chunk ${i+1} ist ungültig`);
      const actualHash=cloudHash(d.data);
      if(expectedHashes&&actualHash!==expectedHashes[i])throw cloudIntegrityError(`Cloud-Chunk ${i+1} Prüfsumme stimmt nicht`);
      if(immutable&&d.hash&&String(d.hash)!==actualHash)throw cloudIntegrityError(`Cloud-Chunk ${i+1} gespeicherte Prüfsumme stimmt nicht`);
      if(immutable&&id!==cloudChunkRefId(i,actualHash))throw cloudIntegrityError(`Cloud-Chunk ${i+1} Referenz stimmt nicht`);
      chunks[i]=d.data;
    };
    // V402: stabile, begrenzte Parallel-Ladung ohne documentId-IN-Sonderpfad.
    // V401 konnte je nach Firebase-Runtime/Browser zuerst eine nicht unterstützte
    // Query versuchen und danach sehr viele Einzelreads gleichzeitig starten.
    // 12 direkte Reads pro Runde sind deutlich schneller als der alte 6er-Weg,
    // bleiben aber vorhersagbar und kompatibel.
    for(let start=0;start<specs.length;start+=CLOUD_SAFE_READ_BATCH){
      const group=specs.slice(start,start+CLOUD_SAFE_READ_BATCH);
      const rows=await Promise.all(group.map(({i,id})=>fb.getDoc(fb.doc(fb.db,CLOUD_SAVE_COLLECTION,userId,"chunks",id)).then(snap=>({i,id,snap}))));
      for(const row of rows)validate(row.i,row.id,row.snap);
    }
    let raw;
    if(immutable||legacyBuckets){
      raw={instances:{},collection:{}};
      for(const text of chunks){
        const part=JSON.parse(text);
        if(!part||typeof part!=="object")throw cloudIntegrityError("Cloud-Bucket ist ungültig");
        if(part.kind==="meta")Object.assign(raw,part.value||{});
        else if(part.kind==="instances")Object.assign(raw.instances,part.value||{});
        else if(part.kind==="collection")Object.assign(raw.collection,part.value||{});
      }
    }else{
      const payload=chunks.join("");
      if(Number(root.payloadChars)&&payload.length!==Number(root.payloadChars))throw cloudIntegrityError("Cloud-Spielstand ist unvollständig");
      if(root.payloadHash&&cloudHash(payload)!==root.payloadHash)throw cloudIntegrityError("Cloud-Spielstand-Prüfsumme stimmt nicht");
      raw=JSON.parse(payload);
    }
    if(!raw||typeof raw!=="object")throw cloudIntegrityError("Cloud-Spielstand ist ungültig");
    if(Number.isFinite(Number(root.points)))raw.points=Math.max(0,Number(root.points));
    raw.updatedAt=Math.max(Number(raw.updatedAt)||0,Number(root.updatedAtMs)||0);
    return raw;
  }

  // V403 NOTFALL-WIEDERHERSTELLUNG
  // Seit bucket-v370 sind Chunk-Dokumente unveränderlich benannt (Index + Hash).
  // Alte Chunks werden beim Speichern absichtlich nicht gelöscht. Falls V401/V402
  // einen leeren Manifest-Stand an die Root geschrieben hat, können deshalb die
  // zuletzt vorhandenen Karten-Buckets aus der Chunk-Historie rekonstruiert werden.
  async function recoverHistoricalCloudState(fb,userId,currentRoot){
    const cutoff=Math.max(1,Number(currentRoot?.updatedAtMs)||now());
    try{
      const col=fb.collection(fb.db,CLOUD_SAVE_COLLECTION,userId,"chunks");
      const q=fb.query(col,fb.where("updatedAtMs","<",cutoff),fb.orderBy("updatedAtMs","desc"),fb.limit(3500));
      const snap=await fb.getDocs(q);if(!snap?.docs?.length)return null;
      const rows=[];
      for(const d of snap.docs){
        const data=d.data()||{},stamp=Number(data.updatedAtMs)||0;if(!stamp||stamp>=cutoff||typeof data.data!=="string")continue;
        try{const part=JSON.parse(data.data);if(part&&typeof part==="object"&&["meta","instances","collection"].includes(part.kind))rows.push({id:d.id,stamp,part,text:data.data});}catch{}
      }
      if(!rows.length)return null;
      // Es können seit dem Fehler bereits mehrere leere Saves entstanden sein.
      // Deshalb nicht nur den unmittelbar vorherigen Meta-Stand testen, sondern
      // bis zu 30 ältere Save-Zeitpunkte rückwärts durchsuchen und den jüngsten
      // Kandidaten mit echten Karten verwenden.
      const metaCandidates=[];const seenMetaTimes=new Set();
      for(const row of rows){
        if(row.part.kind!=="meta"||seenMetaTimes.has(row.stamp))continue;
        seenMetaTimes.add(row.stamp);metaCandidates.push(row);if(metaCandidates.length>=30)break;
      }
      const buildCandidate=(metaRow)=>{
        const restoreAt=metaRow.stamp,latest=new Map();
        for(const row of rows){
          if(row.stamp>restoreAt)continue;
          const part=row.part,key=part.kind==="meta"?"meta":`${part.kind}:${Number(part.bucket)||0}:${Math.max(0,Number(part.part)||0)}`;
          if(!latest.has(key))latest.set(key,row);
        }
        const meta=latest.get("meta")?.part?.value;if(!meta||typeof meta!=="object")return null;
        const raw={...meta,instances:{},collection:{}};
        const mergeKind=(kind,bucketCount,target)=>{
          for(let bucket=0;bucket<bucketCount;bucket++){
            const base=latest.get(`${kind}:${bucket}:0`);if(!base)continue;
            Object.assign(target,base.part.value||{});
            // Overflow-Teile existieren nur, wenn der Primärbucket nahezu voll war.
            // Dadurch werden sehr alte, längst nicht mehr referenzierte Overflow-Chunks
            // bei inzwischen kleinen Buckets nicht versehentlich wiederbelebt.
            if(utf8Size(base.text)<CLOUD_CHUNK_TARGET_BYTES*.72)continue;
            for(let partNo=1;partNo<32;partNo++){
              const extra=latest.get(`${kind}:${bucket}:${partNo}`);if(!extra)break;
              Object.assign(target,extra.part.value||{});
            }
          }
        };
        mergeKind("instances",CLOUD_INSTANCE_BUCKETS,raw.instances);
        mergeKind("collection",CLOUD_COLLECTION_BUCKETS,raw.collection);
        const instanceCount=Object.keys(raw.instances||{}).length,collectionCount=Object.keys(raw.collection||{}).length;
        if(instanceCount<1&&collectionCount<1)return null;
        raw.updatedAt=Math.max(Number(raw.updatedAt)||0,restoreAt);
        return {raw,restoreAt,instanceCount,collectionCount,scanned:snap.docs.length};
      };
      for(const metaRow of metaCandidates){const candidate=buildCandidate(metaRow);if(candidate)return candidate;}
      return null;
    }catch(e){console.warn("BigCards historische Wiederherstellung",e);return null;}
  }

  async function waitForBigCardsCloudWriteLane(maxWaitMs=45000){
    const started=now();
    while(now()-started<maxWaitMs){
      const gate=window.LifeBuilderFirebaseCore?.getWriteGateStatus?.()||{};
      const backoff=Math.max(0,Number(gate.backoffUntil)||0);
      if(backoff>now()){
        const e=new Error("Firestore-Schreibpause aktiv.");e.code="firestore-write-backoff";e.retryAfterMs=backoff-now();throw e;
      }
      const queued=Math.max(0,Number(gate.queueDepth)||0),coalesced=Math.max(0,Number(gate.coalescedDepth)||0);
      if(queued===0&&coalesced===0)return true;
      await new Promise(r=>setTimeout(r,2200));
    }
    return true;
  }

  function scheduleCloudSave(delay=CLOUD_SAVE_DELAY_MS){
    if(!cloudReady||cloudBooting||cloudMigrationPending)return;
    const t=now(),due=Math.max(t+Math.max(500,Number(delay)||CLOUD_SAVE_DELAY_MS),cloudBackoffUntil||0);
    if(cloudSaveTimer&&cloudSaveDueAt&&cloudSaveDueAt<=due)return;
    if(cloudSaveTimer)clearTimeout(cloudSaveTimer);
    cloudSaveDueAt=due;cloudSaveTimer=setTimeout(()=>{cloudSaveTimer=0;cloudSaveDueAt=0;syncProfile(false)},Math.max(500,due-now()));
  }
  async function writeProfile(fb,u){
    const ref=fb.doc(fb.db,PROFILE_COLLECTION,u.uid),profile={userId:u.uid,displayName:await displayName(),lifetimeScore:Math.floor(S.lifetimeScore||0),lifetimePointsEarned:Math.floor(S.lifetimePointsEarned||0),currentLevel:Math.max(1,Math.floor(S.level||1)),maxLevelEver:Math.floor(S.maxLevelEver||1),totalRebirths:Math.floor(lifetimeRebirthCount()),prestigeCount:prestigeCount(),prestigeJkEarned:Math.floor(S.prestigeJkEarned||0),highestProductionEver:Math.floor(S.highestProductionEver||0),highestXpProductionEver:Math.floor(S.highestXpProductionEver||0),collectionDiscovered:collectionCount(),exclusiveDiscovered:exclusiveCount(),unlockedFloors:Math.floor(S.unlockedFloors||1),currentProduction:Math.floor(productionPerSecond()),lastUpdated:fb.serverTimestamp()};
    // Lifetime-/Bestwerte bleiben High-Water-Werte. currentLevel wird absichtlich
    // NICHT mit Math.max() zusammengeführt: Nach einem Rebirth muss es sofort
    // z. B. von 101 auf 1/82 heruntergehen und danach wieder normal mitsteigen.
    try{const snap=await fb.getDoc(ref);if(snap.exists()){const old=snap.data()||{};for(const k of ["lifetimeScore","lifetimePointsEarned","maxLevelEver","totalRebirths","prestigeCount","prestigeJkEarned","highestProductionEver","highestXpProductionEver","collectionDiscovered","exclusiveDiscovered","unlockedFloors"])profile[k]=Math.max(Number(profile[k])||0,Number(old[k])||0);}}catch{}
    await fb.setDoc(ref,profile,{merge:true});
  }
  async function syncLeaderboardProfile(){if(cloudBackoffUntil>now())return false;const fb=await firebase(),u=await currentUser();if(!fb||!u)return false;try{await writeProfile(fb,u);cloudLastProfileWriteAt=now();return true}catch(e){console.warn("BigCards leaderboard current-level sync",e);return false;}}
  function scheduleLeaderboardProfileSync(delay=2500){clearTimeout(leaderboardProfileTimer);leaderboardProfileTimer=setTimeout(()=>{leaderboardProfileTimer=0;void syncLeaderboardProfile();},Math.max(100,Number(delay)||2500));}
  function cloudSafetyRegressionReasonV427(userId,raw=S,remoteRoot=null){
    const counts=cloudCacheCounts(raw),meta=readCloudMeta(userId),localHighCollection=Math.max(0,Math.floor(Number(meta?.safetyHighCollection)||0)),remoteCollection=Math.max(0,Math.floor(Number(remoteRoot?.collectionDiscovered)||0)),remoteInstances=Math.max(0,Math.floor(Number(remoteRoot?.instanceCount)||0));
    const protectedCollection=Math.max(localHighCollection,remoteCollection);
    if(protectedCollection>0&&counts.collection<protectedCollection)return `Sammlung waere kleiner (${counts.collection}) als der letzte sichere Stand (${protectedCollection}).`;
    if(remoteInstances>=1000&&counts.instances<Math.floor(remoteInstances*.25))return `Kartenbestand waere ploetzlich von ${remoteInstances} auf ${counts.instances} gefallen.`;
    if((remoteCollection>0||localHighCollection>0)&&counts.instances===0)return "Ein leerer Kartenbestand darf keinen vorhandenen Cloud-Spielstand ueberschreiben.";
    return "";
  }
  async function verifyCloudRootBeforeCommitV427(fb,u){
    const ref=fb.doc(fb.db,CLOUD_SAVE_COLLECTION,u.uid),snap=await fb.getDoc(ref),root=snap.exists()?snap.data()||{}:null;
    const reason=cloudSafetyRegressionReasonV427(u.uid,S,root);
    if(reason){
      const e=new Error(`V427 Cloud-Sicherheitsstopp: ${reason}`);e.code="bigcards-cloud-safety-stop";e.cloudSafety=true;throw e;
    }
    return root;
  }

  async function syncProfile(force=false){
    if((!cloudReady&&!force)||cloudMigrationPending||cloudSaving||!S){if(cloudSaving)cloudDirty=true;return false}
    if(cloudBackoffUntil>now()){scheduleCloudSave(Math.max(CLOUD_SAVE_DELAY_MS,cloudBackoffUntil-now()));return false}
    const globalGate=window.LifeBuilderFirebaseCore?.getWriteGateStatus?.()||{};
    if(Number(globalGate.backoffUntil||0)>now()){cloudBackoffUntil=Math.max(cloudBackoffUntil,Number(globalGate.backoffUntil)||0);scheduleCloudSave(Math.max(CLOUD_SAVE_DELAY_MS,cloudBackoffUntil-now()));return false}
    // V396: BigCards startet keinen grossen Chunk-Save, solange andere JK.Games-
    // Bereiche bereits mehrere Firestore-Writes in der globalen Schlange haben.
    // Lokal ist der Spielstand zu diesem Zeitpunkt bereits sicher gespeichert.
    if(!force&&(Number(globalGate.queueDepth||0)>0||Number(globalGate.coalescedDepth||0)>0)){scheduleCloudSave(Math.max(CLOUD_SAVE_DELAY_MS,240000));return false}
    const fb=await firebase(),u=await currentUser();if(!fb||!u)return false;cloudUid=u.uid;
    const localSafetyReason=cloudSafetyRegressionReasonV427(u.uid,S,null);
    if(localSafetyReason){cloudDirty=false;cloudMigrationPending=true;toast(`☁ Cloud-Sicherheitsstopp: ${localSafetyReason} Dein Online-Spielstand wird NICHT ueberschrieben.`,7000);console.error("BigCards V427 safety stop",localSafetyReason);return false;}
    cloudSaving=true;if(force&&cloudSaveTimer){clearTimeout(cloudSaveTimer);cloudSaveTimer=0;cloudSaveDueAt=0;}const mutationAtStart=cloudMutationCounter;cloudFastDirty=false;let cloudStage="Vorbereitung";
    try{
      updateFeaturedEarnings(now());const savedAt=now();S.updatedAt=savedAt;S.version=419;
      const chunks=await buildCloudBucketPayloadsAsyncV429(S),chunkHashes=chunks.map(cloudHash);if(chunks.length>CLOUD_MAX_CHUNKS)throw new Error(`BigCards-Spielstand ist für den Cloud-Speicher zu groß (${chunks.length} Chunks).`);
      const saveId=`v370-${savedAt.toString(36)}-${Math.random().toString(36).slice(2,9)}`;cloudStage="Buckets";
      const chunkRefs=new Array(chunks.length),changed=[];
      for(let i=0;i<chunks.length;i++){
        const reusable=cloudLastChunkHashes[i]===chunkHashes[i]&&typeof cloudLastChunkRefs[i]==="string"&&cloudLastChunkRefs[i];
        chunkRefs[i]=reusable?cloudLastChunkRefs[i]:cloudChunkRefId(i,chunkHashes[i]);
        if(!reusable)changed.push(i);
      }
      // V430: Unveraenderliche Chunks werden in kleinen atomaren Batches gebuendelt.
      // Das Root-Manifest wird weiterhin ERST nach bestaetigten Chunk-Batches umgeschaltet.
      // Max. 8 Chunks halten auch bei ~480 KB pro Chunk ausreichend Abstand zur 10-MiB-Request-Grenze,
      // reduzieren aber die Zahl der Write-Stream-Commits typischerweise um etwa Faktor 8.
      for(let start=0;start<changed.length;start+=CLOUD_WRITE_BATCH_SIZE){
        await waitForBigCardsCloudWriteLane(90000);
        const indices=changed.slice(start,start+CLOUD_WRITE_BATCH_SIZE);
        const batch=fb.writeBatch(fb.db);
        for(const i of indices){
          const id=chunkRefs[i];
          batch.set(fb.doc(fb.db,CLOUD_SAVE_COLLECTION,u.uid,"chunks",id),{saveId,index:i,hash:chunkHashes[i],data:chunks[i],updatedAtMs:savedAt});
        }
        await batch.commit();
        if(start+CLOUD_WRITE_BATCH_SIZE<changed.length)await new Promise(r=>setTimeout(r,CLOUD_WRITE_BATCH_PAUSE_MS));
      }
      if(changed.length)await new Promise(r=>setTimeout(r,6000));
      // Direkt vor dem einzigen kritischen Root-Write wird der aktuelle Remote-Root
      // erneut gelesen. Wenn Sammlung/Kartenbestand gegen den sicheren Stand einbrechen,
      // wird das Manifest NICHT umgeschaltet.
      await waitForBigCardsCloudWriteLane(90000);cloudStage="Sicherheitspruefung";await verifyCloudRootBeforeCommitV427(fb,u);
      cloudStage="Root";const payloadChars=chunks.reduce((sum,x)=>sum+x.length,0),root={uid:u.uid,points:Math.floor(S.points),level:Math.max(1,Math.floor(S.level)),totalRebirths:Math.max(0,Math.floor(S.totalRebirths)),lifetimeRebirths:Math.max(0,Math.floor(lifetimeRebirthCount())),prestigeCount:prestigeCount(),lifetimeScore:Math.max(0,Math.floor(S.lifetimeScore)),collectionDiscovered:collectionCount(),instanceCount:Object.keys(S.instances||{}).length,updatedAtMs:savedAt,schemaVersion:CLOUD_SCHEMA_VERSION,cloudFormat:CLOUD_BUCKET_FORMAT,bucketVersion:3,saveId,chunkCount:chunks.length,chunkHashes,chunkRefs,payloadChars,payloadHash:cloudHash(chunks.join("")),sourceDevice:deviceId(),cloudSavedAt:fb.serverTimestamp()};
      await fb.setDoc(fb.doc(fb.db,CLOUD_SAVE_COLLECTION,u.uid),root,{merge:true});
      if(force||savedAt-cloudLastProfileWriteAt>=CLOUD_PROFILE_SAVE_INTERVAL_MS){try{cloudStage="Profil";await writeProfile(fb,u);cloudLastProfileWriteAt=savedAt}catch(profileError){console.warn("BigCards leaderboard profile save",profileError)}}
      cloudLastSaveId=saveId;cloudLastRemoteUpdatedAt=savedAt;cloudLastChunkHashes=chunkHashes.slice();cloudLastChunkRefs=chunkRefs.slice();cloudBackoffUntil=0;markCloudCacheVerified(u.uid,saveId,savedAt,savedAt,S);writeLocalState(u.uid,true);if(cloudMutationCounter===mutationAtStart)cloudDirty=false;return true;
    }catch(e){
      console.warn(`BigCards full cloud save (${cloudStage})`,e);cloudDirty=true;
      const message=String(e?.message||e||"");
      const localSizeError=/Cloud-Bucket|Cloud-Metadaten|Cloud-Speicher zu groß/i.test(message);
      const resourceError=e?.code==="resource-exhausted"||/resource-exhausted|queued writes|maximum allowed queued writes|write stream exhausted/i.test(message);
      const gateBackoff=e?.code==="firestore-write-backoff"||e?.code==="firestore-write-pressure";
      const safetyStop=e?.code==="bigcards-cloud-safety-stop"||e?.cloudSafety===true;
      if(safetyStop){
        cloudDirty=false;cloudMigrationPending=true;cloudBackoffUntil=Math.max(cloudBackoffUntil,now()+CLOUD_RESOURCE_BACKOFF_MS);
        if(cloudSaveTimer){clearTimeout(cloudSaveTimer);cloudSaveTimer=0;cloudSaveDueAt=0;}
        toast("☁ Cloud-Sicherheitsstopp aktiv. Dein Online-Spielstand wurde NICHT ueberschrieben. BigCards muss den Cloud-Stand zuerst erneut verifizieren.",7500);
      }else if(localSizeError||resourceError||gateBackoff){
        const gateUntil=Number(window.LifeBuilderFirebaseCore?.getWriteGateStatus?.()?.backoffUntil)||0;
        const retryMs=localSizeError?CLOUD_SAVE_DELAY_MS:gateBackoff?Math.max(CLOUD_SAVE_DELAY_MS,Number(e?.retryAfterMs)||0,gateUntil-now()):CLOUD_RESOURCE_BACKOFF_MS;
        cloudBackoffUntil=Math.max(cloudBackoffUntil,now()+Math.max(CLOUD_SAVE_DELAY_MS,retryMs));
        // Ein lokaler Bucket-Größenfehler darf niemals die komplette JK.Games-Firebase
        // für alle anderen Module blockieren. Bei echtem resource-exhausted setzt der
        // zentrale Firebase-Runtime-Gate seine Schutzpause bereits selbst.
        if(cloudSaveTimer){clearTimeout(cloudSaveTimer);cloudSaveTimer=0;cloudSaveDueAt=0;}
        console.warn(`BigCards Cloud pausiert bis ${new Date(cloudBackoffUntil).toLocaleTimeString()} und versucht danach automatisch erneut.`);
      }
      return false;
    }finally{cloudSaving=false;if(cloudDirty&&cloudReady&&!cloudMigrationPending)scheduleCloudSave(cloudFastDirty?CLOUD_SAVE_DELAY_MS:CLOUD_PASSIVE_SAVE_DELAY_MS);}
  }
  function cloudCacheCounts(raw){return {instances:Object.keys(raw?.instances||{}).length,collection:Object.keys(raw?.collection||{}).length};}
  function markCloudCacheVerified(userId,saveId,remoteUpdatedAtMs,syncedLocalUpdatedAt,raw=S){const c=cloudCacheCounts(raw),prev=readCloudMeta(userId);writeCloudMeta(userId,{saveId,remoteUpdatedAtMs,syncedLocalUpdatedAt,cacheVerifiedSaveId:String(saveId||""),cacheVerifiedInstances:c.instances,cacheVerifiedCollection:c.collection,cacheVerifiedAt:now(),safetyHighInstances:Math.max(Number(prev?.safetyHighInstances)||0,c.instances),safetyHighCollection:Math.max(Number(prev?.safetyHighCollection)||0,c.collection)});}
  function cloudCacheMatchesManifest(localRaw,meta,root){
    if(!localRaw||typeof localRaw!=="object"||!cloudHasFullSave(root))return false;
    const c=cloudCacheCounts(localRaw),rootCollection=Math.max(0,Math.floor(Number(root.collectionDiscovered)||0));
    // V402 vertraut einem lokalen Schnellstart nur noch, wenn DIESE konkrete
    // IndexedDB-Kopie nach einem erfolgreichen Cloud-Lesen/-Speichern verifiziert
    // wurde. Ein alter/staler cloud-meta-saveId allein reicht nicht mehr.
    return String(meta?.saveId||"")===String(root.saveId||"")
      &&String(meta?.cacheVerifiedSaveId||"")===String(root.saveId||"")
      &&Number(meta?.cacheVerifiedInstances)===c.instances
      &&Number(meta?.cacheVerifiedCollection)===c.collection
      &&c.collection===rootCollection
      &&(rootCollection===0||c.instances>0);
  }
  function applyRootOnlyChangesToCachedState(localRaw,meta,root){
    const out=localRaw&&typeof localRaw==="object"?localRaw:null;if(!out||!root)return out;
    const localUnsynced=Number(out.updatedAt||0)>Number(meta?.syncedLocalUpdatedAt||0)+1000;
    // Ein Marktkauf kann nur Points/updatedAt direkt im Root ändern, ohne einen
    // neuen Chunk-saveId zu erzeugen. Solange lokal nichts Ungespeichertes liegt,
    // übernehmen wir diese kleinen Root-Felder ohne 60+ Chunks neu herunterzuladen.
    if(!localUnsynced&&Number(root.updatedAtMs||0)>Number(meta?.remoteUpdatedAtMs||0)){
      if(Number.isFinite(Number(root.points)))out.points=Math.max(0,Number(root.points));
      if(Number.isFinite(Number(root.level)))out.level=Math.max(1,Math.floor(Number(root.level)));
      if(Number.isFinite(Number(root.totalRebirths)))out.totalRebirths=Math.max(0,Math.floor(Number(root.totalRebirths)));
      if(Number.isFinite(Number(root.lifetimeScore)))out.lifetimeScore=Math.max(Number(out.lifetimeScore)||0,Number(root.lifetimeScore)||0);
      out.updatedAt=Math.max(Number(out.updatedAt)||0,Number(root.updatedAtMs)||0);
    }
    return out;
  }
  async function preloadLocalCloudPreview(){
    const userId=currentUidSync();if(!userId)return null;
    try{const raw=await readLocalStateForUser(userId);if(raw&&UI.overlay&&!cloudReady&&!cloudMigrationPending){cloudUid=userId;adoptState(raw,{saveLocal:false,userId});UI.floor=Math.min(UI.floor,S.unlockedFloors-1);refresh(false);}return {userId,raw};}
    catch{return null}
  }
  async function pullCloudIfNewer(showToast=false){
    if(!cloudReady||cloudBooting||cloudSaving||cloudMigrationPending||cloudDirty)return false;const fb=await firebase(),u=await currentUser();if(!fb||!u)return false;try{const snap=await fb.getDoc(fb.doc(fb.db,CLOUD_SAVE_COLLECTION,u.uid));if(!snap.exists())return false;const root=snap.data()||{},remoteAt=Number(root.updatedAtMs)||0;if(!cloudHasFullSave(root))return false;if(root.saveId===cloudLastSaveId&&remoteAt<=cloudLastRemoteUpdatedAt)return false;
      // V402 Fast-Path: gleicher immutable saveId = dieselben Chunk-Daten. Wenn
      // nur der Root (z. B. Markt-Points) neuer ist, werden NICHT alle Chunks erneut geladen.
      if(root.saveId===cloudLastSaveId&&S){const meta=readCloudMeta(u.uid);applyRootOnlyChangesToCachedState(S,meta,root);cloudLastRemoteUpdatedAt=remoteAt;writeCloudMeta(u.uid,{saveId:root.saveId,remoteUpdatedAtMs:remoteAt,syncedLocalUpdatedAt:Number(S.updatedAt)||remoteAt});writeLocalState(u.uid);if(UI.overlay)refresh(false);if(showToast||root.sourceDevice!==deviceId())toast("☁ BigCards-Spielstand aktualisiert.",2200);return true;}
      const raw=await readFullCloudState(fb,u.uid,root);if(!raw)return false;adoptState(raw,{saveLocal:true,userId:u.uid});cloudLastSaveId=root.saveId;cloudLastRemoteUpdatedAt=remoteAt;cloudLastChunkHashes=Array.isArray(root.chunkHashes)?root.chunkHashes.slice():[];cloudLastChunkRefs=Array.isArray(root.chunkRefs)?root.chunkRefs.slice():[];cloudDirty=false;markCloudCacheVerified(u.uid,root.saveId,remoteAt,Number(S.updatedAt)||remoteAt,S);UI.battleCard=null;UI.battleResult=null;UI.battleSession=null;resetOnlineUi();UI.floor=Math.min(UI.floor,S.unlockedFloors-1);if(UI.overlay)refresh(false);if(showToast||root.sourceDevice!==deviceId())toast("☁ BigCards-Spielstand von einem anderen Gerät aktualisiert.",3000);return true}catch(e){if(!e?.cloudIntegrity)console.warn("BigCards cloud pull",e);return false}}
  async function retryPendingCloudMigration(){if(!cloudMigrationPending||cloudBooting||cloudSaving||!UI.overlay)return false;const fb=await firebase(),u=await currentUser();if(!fb||!u)return false;try{const snap=await fb.getDoc(fb.doc(fb.db,CLOUD_SAVE_COLLECTION,u.uid));if(!snap.exists())return false;const root=snap.data()||{};if(!cloudHasFullSave(root))return false;const raw=await readFullCloudState(fb,u.uid,root);if(!raw)return false;cloudMigrationPending=false;cloudReady=true;adoptState(raw,{saveLocal:true,userId:u.uid});cloudLastSaveId=root.saveId;cloudLastRemoteUpdatedAt=Number(root.updatedAtMs)||0;cloudLastChunkHashes=Array.isArray(root.chunkHashes)?root.chunkHashes.slice():[];cloudLastChunkRefs=Array.isArray(root.chunkRefs)?root.chunkRefs.slice():[];cloudDirty=false;markCloudCacheVerified(u.uid,root.saveId,cloudLastRemoteUpdatedAt,Number(S.updatedAt)||cloudLastRemoteUpdatedAt,S);UI.floor=Math.min(UI.floor,S.unlockedFloors-1);refresh(false);startCloudWatchers();toast(`☁ Vollständiger PC-Spielstand geladen · ${Object.keys(S.instances||{}).length} Karten`,4200);return true}catch(e){if(!e?.cloudIntegrity)console.warn("BigCards migration retry",e);return false}}
  function stopCloudWatchers(){clearInterval(cloudPollTimer);cloudPollTimer=0;window.removeEventListener("focus",onCloudFocus);document.removeEventListener("visibilitychange",onCloudVisibility);}
  function onCloudFocus(){if(cloudMigrationPending)retryPendingCloudMigration();else pullCloudIfNewer(false)}
  function onCloudVisibility(){if(document.visibilityState==="visible"){if(cloudMigrationPending)retryPendingCloudMigration();else pullCloudIfNewer(false)}else{S.lastSeen=now();writeLocalState(cloudUid||currentUidSync(),true)}}
  function startCloudWatchers(){stopCloudWatchers();if(!cloudReady&&!cloudMigrationPending)return;cloudPollTimer=setInterval(()=>cloudMigrationPending?retryPendingCloudMigration():pullCloudIfNewer(false),CLOUD_POLL_MS);window.addEventListener("focus",onCloudFocus);document.addEventListener("visibilitychange",onCloudVisibility);}
  function startRuntimeTimers(){lastTick=performance.now();lastPassivePersistAt=now();clearInterval(tickTimer);tickTimer=setInterval(tick,400);clearInterval(autoTimer);autoTimer=setInterval(autoTick,2400);startCloudWatchers();}
  async function initializeCloudSession(localPreviewPromise=null){
    if(cloudBooting)return;cloudBooting=true;cloudReady=false;cloudMigrationPending=false;
    const preview=localPreviewPromise?await localPreviewPromise:null,fb=await firebase(),u=await currentUser();
    if(!fb||!u){const localOnly=preview?.raw||(await readIndexedState(""));if(localOnly)adoptState(localOnly,{saveLocal:false});cloudBooting=false;ensureDaily();applyOffline();refresh(false);loadRole();startRuntimeTimers();toast("☁ Nicht angemeldet – BigCards läuft lokal über sicheren Gerätespeicher. Für Handy/PC-Sync mit demselben JK.Games-Konto anmelden.",4200);return;}
    cloudUid=u.uid;const cachedLocalRaw=preview?.userId===u.uid&&preview?.raw?preview.raw:(await readLocalStateForUser(u.uid)),localRaw=cachedLocalRaw||S||defaultState(),meta=readCloudMeta(u.uid);let root=null,remoteRaw=null,rootSnap=null,cloudLoadError=null,usedFastCache=false,fastRootChanged=false,recoveredFromHistory=false,preservedLocalAgainstEmpty=false;
    // Wenn der Preview wegen noch nicht fertiger Auth nicht lief, zeigen wir den
    // IndexedDB-Spielstand spätestens jetzt an – noch bevor die Cloud-Chunks kommen.
    if(localRaw&&UI.overlay){adoptState(localRaw,{saveLocal:false,userId:u.uid});UI.floor=Math.min(UI.floor,S.unlockedFloors-1);refresh(false);}
    try{
      rootSnap=await fb.getDoc(fb.doc(fb.db,CLOUD_SAVE_COLLECTION,u.uid));if(rootSnap.exists())root=rootSnap.data()||{};
      if(cloudHasFullSave(root)){
        // Normaler Start auf demselben Gerät: Manifest/saveId unverändert. Der
        // vollständige Spielstand liegt bereits in IndexedDB und wird direkt benutzt.
        // Nach einer einmalig verifizierten Cloud-Ladung entfallen bei unverändertem saveId die Chunk-Reads komplett.
        if(cloudCacheMatchesManifest(cachedLocalRaw,meta,root)){fastRootChanged=Number(root.updatedAtMs||0)>Number(meta?.remoteUpdatedAtMs||0);applyRootOnlyChangesToCachedState(cachedLocalRaw,meta,root);remoteRaw=cachedLocalRaw;usedFastCache=true;}
        else remoteRaw=await readFullCloudState(fb,u.uid,root);
      }
    }catch(e){cloudLoadError=e;if(e?.cloudIntegrity)console.info("BigCards Cloud-Integrität: lokaler Sicherheitsstand/automatische Reparatur wird verwendet.",e.message);else console.warn("BigCards cloud load",e);}
    // V403: Wenn sowohl Cloud als auch lokaler Cache plötzlich 0 Karten enthalten,
    // NICHT weiter mit diesem leeren Stand arbeiten. Zuerst alte immutable Chunks
    // durchsuchen. Bis die Wiederherstellung entschieden ist, gibt es keinen Cloud-Write.
    const remoteLooksEmpty=!!remoteRaw&&Object.keys(remoteRaw.instances||{}).length===0&&Object.keys(remoteRaw.collection||{}).length===0&&Object.keys(remoteRaw.exclusiveCollection||{}).length===0&&Object.keys(remoteRaw.vipCollection||{}).length===0&&Object.keys(remoteRaw.winCollection||{}).length===0&&Object.keys(remoteRaw.hyperCollection||{}).length===0;
    const localLooksEmpty=Object.keys(localRaw?.instances||{}).length===0&&Object.keys(localRaw?.collection||{}).length===0&&Object.keys(localRaw?.exclusiveCollection||{}).length===0&&Object.keys(localRaw?.vipCollection||{}).length===0&&Object.keys(localRaw?.winCollection||{}).length===0&&Object.keys(localRaw?.hyperCollection||{}).length===0;
    if(root&&remoteLooksEmpty&&!localLooksEmpty){
      // Falls auf diesem Gerät noch ein vollständiger Cache existiert, hat er Vorrang
      // vor einem offensichtlich leeren Cloud-Manifest. So kann ein fehlgeschlagener
      // Recovery-Upload beim nächsten Start nicht wieder alles leer anzeigen.
      remoteRaw=localRaw;usedFastCache=false;preservedLocalAgainstEmpty=true;cloudDirty=true;
      toast(`🛟 Lokaler Sicherheitsstand erkannt · ${Object.keys(localRaw.instances||{}).length} Karten werden geschützt`,6000);
    }else if(root&&remoteLooksEmpty&&localLooksEmpty){
      toast("🛟 Alter Kartenbestand wird aus der Cloud-Historie gesucht …",7000);
      const recovered=await recoverHistoricalCloudState(fb,u.uid,root);
      if(recovered?.raw){
        remoteRaw=recovered.raw;usedFastCache=false;cloudLoadError=null;recoveredFromHistory=true;
        cloudLastChunkHashes=[];cloudLastChunkRefs=[];
        // Der rekonstruierte Stand wird anschließend als neuer vollständiger Save
        // geschrieben. Dadurch ist er wieder mit einem frischen Manifest abgesichert.
        cloudDirty=true;
        toast(`🛟 Wiederherstellung gefunden · ${recovered.instanceCount} Karten · alter Stand wird geladen`,6500);
      }else{
        remoteRaw=null;cloudMigrationPending=true;cloudDirty=false;
        toast("⚠️ Leerer Cloud-Stand erkannt. Automatisches Überschreiben ist gesperrt. Alte Karten konnten in diesem Durchlauf noch nicht rekonstruiert werden.",8000);
      }
    }
    if(root&&Array.isArray(root.chunkHashes))cloudLastChunkHashes=root.chunkHashes.slice();else cloudLastChunkHashes=[];
    if(root&&Array.isArray(root.chunkRefs))cloudLastChunkRefs=root.chunkRefs.slice();else cloudLastChunkRefs=[];
    if(remoteRaw){
      const localUnsynced=meta.saveId===root.saveId&&Number(localRaw?.updatedAt||0)>Number(meta.syncedLocalUpdatedAt||0)+1000;
      if(localUnsynced){adoptState(localRaw,{saveLocal:true,userId:u.uid});cloudLastSaveId=root.saveId;cloudLastRemoteUpdatedAt=Number(root.updatedAtMs)||0;cloudDirty=true;}
      else{
        if(meta.saveId&&meta.saveId!==root.saveId&&Number(localRaw?.updatedAt||0)>Number(meta.syncedLocalUpdatedAt||0)+1000)backupLocalConflict(u.uid,localRaw);
        adoptState(remoteRaw,{saveLocal:!usedFastCache,userId:u.uid});cloudLastSaveId=root.saveId;cloudLastRemoteUpdatedAt=Number(root.updatedAtMs)||0;
        const needsImmutableMigration=root.cloudFormat!==CLOUD_BUCKET_FORMAT||!Array.isArray(root.chunkRefs)||root.chunkRefs.length!==Number(root.chunkCount);
        cloudDirty=recoveredFromHistory||preservedLocalAgainstEmpty||needsImmutableMigration;
        if(needsImmutableMigration){cloudLastChunkHashes=[];cloudLastChunkRefs=[];}
        if(usedFastCache)writeCloudMeta(u.uid,{saveId:root.saveId,remoteUpdatedAtMs:cloudLastRemoteUpdatedAt,syncedLocalUpdatedAt:Number(S.updatedAt)||cloudLastRemoteUpdatedAt});
        else if(!recoveredFromHistory&&!preservedLocalAgainstEmpty)markCloudCacheVerified(u.uid,root.saveId,cloudLastRemoteUpdatedAt,Number(S.updatedAt)||cloudLastRemoteUpdatedAt,S);
        if(usedFastCache&&fastRootChanged)writeLocalState(u.uid);
      }
    }
    else if(root){
      const localHasCards=Object.keys(localRaw?.instances||{}).length>0||Object.keys(localRaw?.collection||{}).length>0||Object.keys(localRaw?.exclusiveCollection||{}).length>0||Object.keys(localRaw?.vipCollection||{}).length>0||Object.keys(localRaw?.winCollection||{}).length>0||Object.keys(localRaw?.hyperCollection||{}).length>0;
      if(cloudMigrationPending&&!cloudLoadError){adoptState(mergeLegacyCheckpoint(localRaw,root),{saveLocal:true,userId:u.uid});cloudDirty=false;}
      else if(cloudLoadError){
        // V402-Sicherheitsregel: Wenn der vollständige Cloud-Read fehlschlägt,
        // darf ein möglicherweise leerer/veralteter lokaler Stand NIEMALS den
        // vorhandenen Cloud-Spielstand überschreiben. Lokal anzeigen, Cloud sperren
        // und automatisch erneut lesen.
        adoptState(localHasCards?localRaw:mergeLegacyCheckpoint(localRaw,root),{saveLocal:true,userId:u.uid});
        cloudMigrationPending=true;cloudDirty=false;cloudLastChunkHashes=[];cloudLastChunkRefs=[];
        toast("☁ Spielstand konnte noch nicht vollständig geladen werden. Dein Online-Spielstand wird NICHT überschrieben – erneuter Ladeversuch läuft automatisch.",6500);
      }else if(localHasCards||meaningfulLocalProgress(localRaw)&&Number(root.collectionDiscovered||0)===0){adoptState(localRaw,{saveLocal:true,userId:u.uid});cloudDirty=true;}
      else{adoptState(mergeLegacyCheckpoint(localRaw,root),{saveLocal:true,userId:u.uid});if(Number(root.collectionDiscovered||0)>0&&!localHasCards){cloudMigrationPending=true;cloudDirty=false;}}
    }
    else{adoptState(localRaw,{saveLocal:true,userId:u.uid});cloudDirty=true;}
    cloudBooting=false;cloudReady=!cloudMigrationPending;ensureDaily();applyOffline();UI.floor=Math.min(UI.floor,S.unlockedFloors-1);refresh(false);
    // Rolle und Auszahlungen blockieren das sichtbare Laden nicht mehr. Der Spieler
    // kann BigCards bereits benutzen, während diese kleinen Online-Aufgaben nachlaufen.
    startRuntimeTimers();void loadRole();void claimPayouts();
    if(cloudMigrationPending){toast("🛟 SICHERHEITSSPERRE: Der leere Stand wird NICHT in die Cloud geschrieben. Bitte BigCards geöffnet lassen und den Fehlerlog senden, falls keine Karten wiederhergestellt wurden.",9000);return;}
    if(cloudDirty)void syncProfile(true);else toast(`${usedFastCache?"⚡":"☁"} BigCards geladen · ${Object.keys(S.instances||{}).length} Karten${usedFastCache?" · Schnellstart":""}`,2600);
  }
  async function loadRole(showToast=false){const fb=await firebase(),u=await currentUser();if(!fb||!u){UI.role="player";if(UI.tab==="mod")UI.tab="field";if(showToast)toast("Online-Rolle nicht verfügbar.");return refresh()}try{const snap=await fb.getDoc(fb.doc(fb.db,"staffRoles",u.uid));UI.role=String(snap.data()?.role||"player").toLowerCase();}catch{UI.role="player"}let changed=false;if(UI.role==="owner"&&!S.vipUnlocked){S.vipUnlocked=true;changed=true;}if(UI.role!=="owner"&&!S.vipUnlocked){for(const inst of Object.values(S.instances||{})){if(inst?.fieldPermit){inst.fieldPermit=false;changed=true;}}for(let floor=0;floor<(S.floors||[]).length;floor++){const max=floorMaxTier(floor),row=S.floors[floor]||[];for(let slot=0;slot<row.length;slot++){const inst=instance(row[slot]);if(inst&&!inst.exclusive&&!inst.vip&&inst.rarity>max){row[slot]=null;changed=true;}}}}if(changed)persist();if(UI.role!=="owner"&&UI.tab==="mod")UI.tab="field";refresh();}
  async function loadMarket(show=false){const supplied=marketMerchantListings();const fb=await firebase();if(!fb){UI.market=supplied.sort((a,b)=>(a.price||0)-(b.price||0));if(UI.tab==="market")refresh();if(show)toast(`${UI.market.length} Angebote geladen.`);return;}try{const q=fb.query(fb.collection(fb.db,MARKET_COLLECTION),fb.where("status","==","active"),fb.limit(40)),snap=await fb.getDocs(q),playerListings=snap.docs.map(d=>({id:d.id,...d.data()}));UI.market=[...playerListings,...supplied].sort((a,b)=>(a.price||0)-(b.price||0));await loadMarketStats(UI.market.map(x=>x.cardKey||marketCardKeyFromCard(x.card||{})));if(UI.tab==="market")refresh();if(show)toast(`${UI.market.length} Angebote geladen.`)}catch(e){console.warn(e);UI.market=supplied.sort((a,b)=>(a.price||0)-(b.price||0));if(UI.tab==="market")refresh();if(show)toast(`${UI.market.length} Angebote geladen.`)}}
  async function promptListing(id){const inst=instance(id);if(!inst)return;if(isCardOnExpedition(id))return toast("Diese Karte ist gerade auf Expedition und kann nicht gelistet werden.");if(id===S.featuredCardId)return toast("Wähle die persönliche Karte zuerst im Tab „Karte“ ab, bevor du sie online listest.");if(featuredCard()?.backupCardId===id)return toast("Entferne diese Karte zuerst im Rank-Menü als Backup-Karte.");if(inst.broken)return toast("Kaputte Karten müssen vor dem Marktplatz repariert werden.");if(potionQueueCount(inst)){returnPreparedPotions(inst);persist();toast("Vorbereitete Tränke wurden vor dem Listing zurück ins Inventar gelegt.");}if(inst.trail){const t=returnTrailToInventory(inst);persist();toast(`${t?.name||"Spur"} wurde vor dem Listing zurück ins Inventar gelegt.`);}const key=marketCardKeyFromInst(inst);await loadMarketStats([key]);const stats=marketStatsForKey(key),marketRef=marketAdjustedReference(stats),suggested=Math.max(sellValue(inst),marketRef||0),sold=Math.max(0,Math.floor(Number(stats?.salesCount)||0)),price=await gameNumberPrompt({title:"Karte online anbieten",message:`${cardMeta(inst).name} · ${fusionLabel(inst)}\nSpielwert: ${fmt(sellValue(inst))} Points${marketRef?`\nMarkt-Referenz nach Handelsfaktor: ${fmt(marketRef)} Points`:""}\nBisher erfolgreich verkauft: ${fmt(sold)}×\n\nJe öfter dieselbe Variante gehandelt wurde, desto kleiner wird ihr Sammlerfaktor. Deinen Angebotspreis bestimmst du trotzdem selbst.`,value:Math.max(1,suggested),min:1,max:Number.MAX_SAFE_INTEGER,confirmText:"Preis übernehmen",icon:"🏪"});if(price==null)return;const fb=await firebase(),u=await currentUser();if(!fb||!u)return toast("Für den Online-Marktplatz musst du angemeldet sein.");try{const m=cardMeta(inst),listing={sellerUid:u.uid,sellerName:await displayName(),status:"active",price,feeRate:marketFeeRate(),cardKey:key,card:{instanceId:inst.id,name:m.name,hyper:!!inst.hyper,hyperId:inst.hyperId||null,hyperGeneration:hyperGeneration(inst),rarity:inst.rarity,base:inst.base,rarityValue:m.rarityValue,level:inst.level,cardRebirth:cardRebirth(inst),rank:cardRank(inst),rankMastery:cardRankMastery(inst),rankEliteWins:cardRankEliteWins(inst),rankWins:0,rankedAt:Number(inst.rankedAt)||0,aura:inst.aura,combatAura:inst.combatAura,bind:inst.bind,shiny:inst.shiny,fusion:fusionVariant(inst),sets:setMembershipIds(inst),battlePotions:[],battlePotion:null,win:!!inst.win,winId:inst.winId||null,winPack:inst.winPack??null,vip:!!inst.vip,vipId:inst.vipId||null,exclusive:inst.exclusive,exclusiveId:inst.exclusiveId,basePower:inst.basePower,points:Math.floor(m.points),xp:Math.floor(m.xp),combatPower:Math.floor(m.combat.power),combatMin:Math.floor(m.combat.min),combatMax:Math.floor(m.combat.max)},createdAt:fb.serverTimestamp(),createdAtMs:now()};const ref=await fb.addDoc(fb.collection(fb.db,MARKET_COLLECTION),listing);clearBackupReferences(id);inst.listed=ref.id;persist();refresh();toast("Karte online gelistet.");loadMarket()}catch(e){console.warn(e);toast("Listing fehlgeschlagen.")}}
  async function cancelListing(id){const listing=UI.market.find(x=>x.id===id);if(!listing||listing.sellerUid!==currentUidSync())return;const fb=await firebase();if(!fb)return toast("Online-Verbindung nicht verfügbar.");try{await fb.updateDoc(fb.doc(fb.db,MARKET_COLLECTION,id),{status:"cancelled",cancelledAt:fb.serverTimestamp(),cancelledAtMs:now()});const inst=Object.values(S.instances).find(x=>x.listed===id);if(inst)inst.listed=false;persist();toast("Angebot zurückgenommen.");loadMarket()}catch(e){console.warn(e);toast("Angebot konnte nicht zurückgenommen werden.")}}
  async function buyListing(id){const listing=UI.market.find(x=>x.id===id);if(!listing)return;if(listing.marketMerchant)return buyMarketMerchantListing(listing);if(S.points<listing.price)return toast("Nicht genügend Points.");if(!await gameConfirm({title:"Marktkauf bestätigen",message:`${listing.card?.name||"Karte"}\nPreis: ${fmt(listing.price)} Points`,confirmText:`Für ${fmt(listing.price)} Points kaufen`,icon:"🏪",tone:"points"}))return;const fb=await firebase(),u=await currentUser();if(!fb||!u)return toast("Online-Anmeldung erforderlich.");try{await syncProfile();const ref=fb.doc(fb.db,MARKET_COLLECTION,id),buyerSave=fb.doc(fb.db,CLOUD_SAVE_COLLECTION,u.uid),buyerName=await displayName();await fb.runTransaction(fb.db,async tx=>{const [snap,walletSnap]=await Promise.all([tx.get(ref),tx.get(buyerSave)]);if(!snap.exists()||snap.data().status!=="active")throw new Error("Angebot nicht mehr aktiv");const serverListing=snap.data();if(serverListing.sellerUid===u.uid)throw new Error("Eigenes Angebot");const price=Math.floor(Number(serverListing.price)||0),serverPoints=Math.floor(Number(walletSnap.data()?.points)||0);if(serverPoints<price)throw new Error("Server-Spielstand hat nicht genügend Points. Kurz speichern und erneut versuchen.");const cardKey=String(serverListing.cardKey||marketCardKeyFromCard(serverListing.card||{})),statsRef=fb.doc(fb.db,MARKET_STATS_COLLECTION,cardKey),statsSnap=await tx.get(statsRef),old=statsSnap.exists()?statsSnap.data():{},saleAt=now(),sales=(Array.isArray(old.sales)?old.sales:[]).filter(x=>x&&Number(x.price)>0&&Number(x.at)>0).slice(-49);sales.push({price,at:saleAt});const salesCount=Math.max(0,Math.floor(Number(old.salesCount)||0))+1,high=Math.max(Number(old.allTimeHigh)||0,price),low=Number(old.allTimeLow)>0?Math.min(Number(old.allTimeLow),price):price;tx.update(buyerSave,{points:serverPoints-price,updatedAtMs:saleAt});tx.update(ref,{status:"sold",buyerUid:u.uid,buyerName,soldAt:fb.serverTimestamp(),soldAtMs:saleAt});const feeRate=clamp(Number(serverListing.feeRate)||MARKET_FEE,.01,.25),payout=Math.floor(price*(1-feeRate));tx.set(fb.doc(fb.db,PAYOUT_COLLECTION,serverListing.sellerUid,"items",id),{listingId:id,sellerUid:serverListing.sellerUid,buyerUid:u.uid,amount:payout,fee:price-payout,status:"pending",createdAt:fb.serverTimestamp()});tx.set(statsRef,{cardKey,salesCount,lastPrice:price,lastSoldAtMs:saleAt,allTimeHigh:high,allTimeLow:low,sales,lastListingId:id,lastBuyerUid:u.uid,updatedAtMs:saleAt},{merge:true});});S.points-=listing.price;receiveMarketCard(listing);UI.marketStatsLoaded=false;persist();toast("Karte gekauft · Marktdaten aktualisiert.");await loadMarket();refresh()}catch(e){console.warn(e);toast(e.message||"Kauf fehlgeschlagen.")}}
  async function claimPayouts(){const fb=await firebase(),u=await currentUser();if(!fb||!u)return;try{const q=fb.query(fb.collection(fb.db,PAYOUT_COLLECTION,u.uid,"items"),fb.where("status","==","pending"),fb.limit(50)),snap=await fb.getDocs(q);let sum=0,removedCard=false;for(const d of snap.docs){sum+=Math.max(0,Number(d.data().amount)||0);const sold=Object.values(S.instances).find(x=>x.listed===d.id);if(sold){for(const row of S.floors){const i=row.indexOf(sold.id);if(i>=0)row[i]=null}delete S.instances[sold.id];removedCard=true}await fb.updateDoc(d.ref,{status:"claimed",claimedAt:fb.serverTimestamp()})}if(removedCard)invalidateCardPowerCache();if(sum){S.points+=sum;persist();toast(`Marktplatz-Erlös: +${fmt(sum)} Points`)}}catch(e){console.warn("BigCards payout",e)}}
  async function loadLeaderboard(show=false){const fb=await firebase();if(!fb){if(show)toast("Online-Verbindung nicht verfügbar.");return}try{await syncLeaderboardProfile();const q=fb.query(fb.collection(fb.db,PROFILE_COLLECTION),fb.orderBy("lifetimeScore","desc"),fb.limit(50)),snap=await fb.getDocs(q);UI.leaderboard=snap.docs.map(d=>d.data());if(UI.tab==="score")refresh();if(show)toast("Bestenliste aktualisiert.")}catch(e){console.warn(e);if(show)toast("Bestenliste konnte nicht geladen werden.")}}

  async function modAction(action){
    if(UI.role!=="owner")return toast("Owner-Rechte erforderlich.");
    const q=s=>UI.overlay.querySelector(s);
    if(action==="points")S.points=Math.max(0,Number(q("[data-bc-mod-points]")?.value)||0);
    else if(action==="level")S.level=Math.max(1,Math.floor(Number(q("[data-bc-mod-level]")?.value)||1));
    else if(action==="featureStorage")S.featuredStorageTier=clamp(Math.floor(Number(q("[data-bc-mod-feature-storage]")?.value)||0),0,FEATURED_STORAGE_TIERS.length-1);
    else if(action==="featureRank"){const inst=featuredCard();if(!inst)return toast("Keine persönliche Karte gewählt.");inst.rank=clamp(Math.floor(Number(q("[data-bc-mod-feature-rank]")?.value)||0),0,FEATURED_RANK_MAX);inst.rankMastery=Math.max(0,Math.floor(Number(q("[data-bc-mod-feature-rank-mastery]")?.value)||0));inst.rankEliteWins=Math.max(0,Math.floor(Number(q("[data-bc-mod-feature-rank-elite]")?.value)||0));inst.rankWins=0;inst.rankedAt=inst.rank?now():0;applyRankStorageUnlock(inst);}
    else if(action==="fieldStorage"){const full=q("[data-bc-mod-field-storage]")?.value==="full";S.pendingPoints=full?Math.max(Number(S.pendingPoints)||0,fieldPointCapacity()):0;S.fieldStoredSeconds=0;}
    else if(action==="rebirth")S.totalRebirths=Math.max(0,Math.floor(Number(q("[data-bc-mod-rebirth]")?.value)||0));
    else if(action==="pack"){modGivePack(q("[data-bc-mod-pack]")?.value);}
    else if(action==="jkPackConfirm"){
      const val=String(q("[data-bc-mod-jk-pack]")?.value||"normal:0");
      if(val==="exclusive"){if(!await confirmJkPackPurchase("TEST EXCLUSIVE PACK · 5 Karten",100))return toast("JK/Coin-Test abgebrochen.");showPackReveal(Array.from({length:5},()=>rollExclusive()),{name:"TEST JK EXCLUSIVE",test:true,exclusive:true});}
      else if(val==="vip"){if(!await confirmJkPackPurchase("TEST VIP PACK · 5 Karten",500))return toast("JK/Coin-Test abgebrochen.");showPackReveal(Array.from({length:5},()=>rollVipPackCard()),{name:"TEST JK VIP",test:true,vip:true});}
      else if(val==="hyper"){if(!await confirmJkPackPurchase("TEST HYPER PACK · 2 Karten",HYPER_JK_PRICE))return toast("JK/Coin-Test abgebrochen.");showPackReveal(Array.from({length:2},()=>rollHyperCard()),{name:"TEST JK HYPER",test:true,hyper:true});}
      else{const ri=clamp(Math.floor(Number(val.split(":")[1])||0),0,RARITIES.length-1),r=RARITIES[ri];if(!await confirmJkPackPurchase(`TEST ${r.name}-Pack · 10 Karten`,r.jk))return toast("JK/Coin-Test abgebrochen.");showPackReveal(Array.from({length:10},()=>rollNormal(ri)),{name:`TEST JK ${r.name}`,test:true});}
      toast("Bestätigung getestet · im Mod-Test wurden keine JK/Coin abgezogen.",3600);
    }
    else if(action==="floor")S.unlockedFloors=Math.max(S.unlockedFloors,clamp(Number(q("[data-bc-mod-floor]")?.value)||1,1,4));
    else if(action==="battleTier"){S.battleTierUnlocked=clamp(Math.floor(Number(q("[data-bc-mod-battle-tier]")?.value)||0),0,RARITIES.length-1);S.battleTierWins=0;repairBattleTierProgressV423();}
    else if(action==="battleTierWins")S.battleTierWins=Math.max(0,Math.floor(Number(q("[data-bc-mod-battle-wins]")?.value)||0));
    else if(action==="totalBattleWins")S.battleWins=Math.max(0,Math.floor(Number(q("[data-bc-mod-total-battle-wins]")?.value)||0));
    else if(action==="wins")S.winsCurrency=clamp(Math.floor(Number(q("[data-bc-mod-wins]")?.value)||0),0,WIN_CAP);
    else if(action==="equipmentRewardsReset"){if(!await gameConfirm({title:"Gratis-Claims zurücksetzen",message:"Nur die einmaligen Gratis-Claim-Markierungen werden zurückgesetzt. Bereits vorhandene Auras/Bindungen bleiben erhalten.",confirmText:"Zurücksetzen",icon:"🧰",tone:"danger"}))return;S.equipmentRewards={};}
    else if(action==="aura"){const id=q("[data-bc-mod-aura]")?.value;S.auraInventory[id]=(S.auraInventory[id]||0)+1;}
    else if(action==="combatAura"){const id=q("[data-bc-mod-combat-aura]")?.value;S.combatAuraInventory[id]=(S.combatAuraInventory[id]||0)+1;}
    else if(action==="bind"){const id=q("[data-bc-mod-bind]")?.value;S.bindInventory[id]=(S.bindInventory[id]||0)+1;}
    else if(action==="repairKit"){const id=q("[data-bc-mod-repair-kit]")?.value;if(REPAIR_KIT_BY_ID[id])S.repairKits[id]=repairKitCount(id)+1;}
    else if(action==="potion"){const raw=q("[data-bc-mod-potion]")?.value||"common:life",[tierId,typeId]=raw.split(":");if(POTION_TYPES.some(p=>p.id===typeId)){const key=potionKey(tierId,typeId);S.potionInventory[key]=potionCount(tierId,typeId)+1;}}
    else if(action==="trail"){const id=q("[data-bc-mod-trail]")?.value;if(trailBy(id))S.trailInventory[id]=trailCount(id)+1;}
    else if(action==="trailTier"){S.trailTierUnlocked=clamp(Math.floor(Number(q("[data-bc-mod-trail-tier]")?.value)||0),0,TRAILS.length-1);}
    else if(action==="shinyTest"){const inst=instance(q("[data-bc-mod-shiny-card]")?.value);if(!inst)return toast("Keine Testkarte gewählt.");inst.shiny=clamp(Math.floor(Number(q("[data-bc-mod-shiny-level]")?.value)||0),0,3);}
    else if(action==="brokenTest"){const inst=instance(q("[data-bc-mod-broken-card]")?.value);if(!inst)return toast("Keine Testkarte gewählt.");const broken=q("[data-bc-mod-broken-state]")?.value!=="repair";inst.broken=broken;inst.brokenAt=broken?now():0;}
    else if(action==="latestResources"){const read=name=>Math.max(0,Math.floor(Number(q(`[data-bc-mod-resource="${name}"]`)?.value)||0));S.fusionDust=read("fusionDust");S.auraMaterial=read("auraMaterial");S.cosmeticFragments=read("cosmeticFragments");S.prismaticCatalysts=read("prismaticCatalysts");S.hyperCores=read("hyperCores");S.bossTokens=read("bossTokens");S.packFragments=read("packFragments");S.shards=read("shards");S.prestigeCount=read("prestigeCount");S.prestigeTokens=read("prestigeTokens");S.autoOpenerCapacity=clamp(read("autoOpenerCapacity"),0,AUTO_OPENER_MAX_LANES);S.autoOpenerWorkMs=Math.max(0,Number(q('[data-bc-mod-resource="autoOpenerHours"]')?.value)||0)*3600000;S.vipUnlocked=!!q('[data-bc-mod-resource-check="vipUnlocked"]')?.checked;S.bestCombatAutoUnlocked=!!q('[data-bc-mod-resource-check="bestCombatAutoUnlocked"]')?.checked;}
    else if(action==="reset"){if(await gameConfirm({title:"BigCards komplett zurücksetzen",message:"Der lokale BigCards-Spielstand wird vollständig neu gestartet. Diese Aktion ist endgültig.",confirmText:"Spielstand zurücksetzen",icon:"⚠️",tone:"danger"})){localStorage.removeItem(SAVE_KEY);if(cloudUid)localStorage.removeItem(localStateKey(cloudUid));S=defaultState();}}
    UI.modLoadToken++;UI.modInventoryData=null;persist();refresh();
  }

  function grantJkCoinPurchase(kind,amount=1){state();const qty=Math.max(1,Math.floor(Number(amount)||1));if(kind==="vipUnlock"){S.vipUnlocked=true;}else if(String(kind).startsWith("pack:")){const id=String(kind).split(":")[1];S.jkPackCredits[id]=(S.jkPackCredits[id]||0)+qty}else if(kind==="exclusivePack")S.exclusiveCredits+=qty;else if(kind==="autoOpenerHour"){S.autoOpenerWorkMs=Math.max(0,Number(S.autoOpenerWorkMs)||0)+qty*AUTO_OPENER_HOUR_MS;S.autoOpenerCapacity=Math.min(AUTO_OPENER_MAX_LANES,Math.max(1,Math.floor(Number(S.autoOpenerCapacity)||0)+qty));S.autoOpenerLastAt=now();}else if(kind==="autoCollectorHour")S.autoCollectorUntil=Math.max(now(),S.autoCollectorUntil||0)+qty*3600000;else if(kind==="bestCombatAutoUnlock")S.bestCombatAutoUnlocked=true;else if(/^vipClickBoost:(?:2|4|6|8|10)$/.test(String(kind))){S.jkVipClickMultiplier=Number(String(kind).split(":")[1]);S.jkVipClickUntil=now()+JK_VIP_CLICK_DURATION_MS;}else if(kind==="bossDamageBoost:2"){S.jkBossDamageMultiplier=2;S.jkBossDamageUntil=now()+JK_BOSS_DAMAGE_DURATION_MS;}else if(/^finishExpedition:[0-3]$/.test(String(kind))){const slot=Number(String(kind).split(":")[1]);if(!finishExpeditionWithJk(slot))return false;}else if(String(kind).startsWith("aura:")){const id=String(kind).split(":")[1];S.auraInventory[id]=(S.auraInventory[id]||0)+qty}else if(String(kind).startsWith("combatAura:")){const id=String(kind).split(":")[1];S.combatAuraInventory[id]=(S.combatAuraInventory[id]||0)+qty}else if(String(kind).startsWith("bind:")){const id=String(kind).split(":")[1];S.bindInventory[id]=(S.bindInventory[id]||0)+qty}else if(String(kind).startsWith("trail:")){const id=String(kind).split(":")[1];if(!trailBy(id))return false;S.trailInventory[id]=trailCount(id)+qty}else if(String(kind).startsWith("featuredStorage:")){const tier=clamp(Math.floor(Number(String(kind).split(":")[1])||0),0,FEATURED_STORAGE_TIERS.length-1);S.featuredStorageTier=Math.max(Math.floor(Number(S.featuredStorageTier)||0),tier)}else if(kind==="bulkLevelUnlock"){S.bulkLevelUntil=now()+BULK_LEVEL_ACCESS_MS;S.bulkLevelLegacyMigrated=true;S.bulkLevelUnlocked=false;}else if(kind==="bulkRebirthUnlock"){S.bulkRebirthUntil=now()+BULK_LEVEL_ACCESS_MS;}else if(/^pointsBoost:(?:2|4|6|8|10)$/.test(String(kind))){if(UI.overlay){updateFeaturedEarnings(now(),true);S.lastSeen=now();}else settleOfflineBeforePointsBooster();const mult=Number(String(kind).split(":")[1]);S.jkBoostPointsMultiplier=mult;S.jkBoostPointsUntil=now()+JK_BOOST_DURATION_MS;}else if(/^xpBoost:(?:2|4|6|8|10)$/.test(String(kind))){const mult=Number(String(kind).split(":")[1]);S.jkBoostXpMultiplier=mult;S.jkBoostXpUntil=now()+JK_BOOST_DURATION_MS;}else if(/^damageBoost:(?:20|40|60|80|100)$/.test(String(kind))){const pct=Number(String(kind).split(":")[1]);S.jkBoostDamageBonus=pct/100;S.jkBoostDamageUntil=now()+JK_BOOST_DURATION_MS;}else if(String(kind).startsWith("pointsMinutes:")){const mins=Number(String(kind).split(":")[1])||5;S.points+=Math.max(1000,productionPerSecond()*60*mins)*qty}else return false;persist();if(UI.overlay){refresh();toast("JK/Coin-Kauf in BigCards.kl gutgeschrieben.")}return true;}

  function open(phone){if(UI.overlay)return;state();S.autoOpenerLastAt=now();UI.autoOpenerCollapsed=!!uiPref("autoOpenerStartCollapsed");UI.phone=phone||UI.phone;UI.tab="field";UI.battleResult=null;UI.battleSession=null;resetOnlineUi();UI.floor=Math.min(UI.floor,S.unlockedFloors-1);const overlay=document.createElement("div");overlay.className="bc-overlay";overlay.dataset.bigcardsKl="1";overlay.innerHTML=renderShell();document.body.append(overlay);document.body.classList.add("bigcards-kl-open");UI.overlay=overlay;UI.main=overlay.querySelector("[data-bc-main]");bindEvents();refresh(false);toast("☁ BigCards-Spielstand wird online abgeglichen …",1800);const localPreview=preloadLocalCloudPreview();initializeCloudSession(localPreview).then(()=>recoverOnlineMatchIfAny()).catch(()=>recoverOnlineMatchIfAny());}
  function close(){if(!UI.overlay)return;updateFeaturedEarnings(now());clearTimeout(UI.battleEnemyTimer);UI.battleEnemyTimer=0;UI.battleSession=null;if(UI.onlineStatus==="searching")void cancelOnlineMatchmaking(true);else stopOnlineBattlePolling();clearFieldDragVisuals();UI.drag=null;S.lastSeen=now();persist();writeLocalState(cloudUid||currentUidSync(),true);/* V383: Beim Schließen nur lokal sichern. Der bereits geplante Cloud-Save wird nicht zusätzlich erzwungen. */stopCloudWatchers();window.removeEventListener("keydown",onKey);clearInterval(tickTimer);clearInterval(autoTimer);clearTimeout(UI.autoNoticeTimer);UI.autoNoticeTimer=0;UI.overlay.remove();UI.overlay=null;UI.main=null;UI.packReveal=null;document.body.classList.remove("bigcards-kl-open")}
  function returnToTopGames(){const phone=UI.phone;close();setTimeout(()=>{if(window.JKGamesOpenTopGames)window.JKGamesOpenTopGames(phone);else if(window.openDeviceInterface&&phone)window.openDeviceInterface(phone,"topgames",false)},80)}

  window.BigCardsKL=Object.freeze({version:VERSION,open,close,returnToTopGames,grantJkCoinPurchase,canApplyJkPurchase:(kind)=>{state();if(kind==="bestCombatAutoUnlock")return !S.bestCombatAutoUnlocked;if(/^finishExpedition:[0-3]$/.test(String(kind))){const slot=Number(String(kind).split(":")[1]),ex=expeditionAtSlot(slot);return !!ex&&Number(ex.endsAt)>now();}return true;},getState:()=>state(),getFeaturedStorageTier:()=>Math.floor(Number(state().featuredStorageTier)||0),hasBulkLevelUnlock:()=>bulkLevelUnlocked(),hasVip:()=>!!state().vipUnlocked,getBulkLevelAccessState:()=>{state();return {active:bulkLevelUnlocked(),until:Math.max(0,Number(S.bulkLevelUntil)||0),remainingMs:bulkLevelRemainingMs(),durationMs:BULK_LEVEL_ACCESS_MS};},getBulkRebirthAccessState:()=>{state();return {active:bulkRebirthUnlocked(),until:Math.max(0,Number(S.bulkRebirthUntil)||0),remainingMs:bulkRebirthRemainingMs(),durationMs:BULK_LEVEL_ACCESS_MS};},getJkBoosterState:(kind)=>{state();if(kind==="vipClicks")return {active:S.jkVipClickUntil>now(),value:jkVipClickMultiplier(),until:S.jkVipClickUntil,max:10};if(kind==="bossDamage")return {active:S.jkBossDamageUntil>now(),value:jkBossDamageMultiplier(),until:S.jkBossDamageUntil,max:2};return jkBoosterState(kind)},getAutoOpenerState:()=>{state();return {workMs:Math.max(0,Number(S.autoOpenerWorkMs)||0),capacity:Math.max(0,Number(S.autoOpenerCapacity)||0),active:autoActiveLaneIndexes().length};},featuredStorageTiers:FEATURED_STORAGE_TIERS,featuredRanks:FEATURED_RANKS,rarities:RARITIES,trails:TRAILS,baseNames:BASE_NAMES});
})();
