/* BigCards.kl – JK.Games Top Game V358 */
(() => {
  "use strict";

  const VERSION = "2026-08-10-bigcards-v358-rank-backup-card";
  const SAVE_KEY = "jk-games-bigcards-kl-v332";
  const CLOUD_SAVE_COLLECTION = "bigCardsSaves";
  const CLOUD_SCHEMA_VERSION = 356;
  const CLOUD_MIN_SCHEMA_VERSION = 354;
  const CLOUD_CHUNK_CHARS = 180000;
  const CLOUD_CHUNK_MAX_BYTES = 180000;
  const LOCAL_DB_NAME = "jk-games-bigcards-kl-cache";
  const LOCAL_DB_VERSION = 1;
  const LOCAL_DB_STORE = "saves";
  const LOCAL_SAVE_DELAY_MS = 900;
  const CLOUD_MAX_CHUNKS = 160;
  const CLOUD_SAVE_DELAY_MS = 12000;
  const CLOUD_POLL_MS = 15000;
  const PROFILE_COLLECTION = "bigCardsProfiles";
  const MARKET_COLLECTION = "bigCardsMarket";
  const PAYOUT_COLLECTION = "bigCardsPayouts";
  const MARKET_FEE = 0.05;
  const MAX_OFFLINE_MS = 4 * 60 * 60 * 1000;
  const OFFLINE_RATE = 0.35;

  const RARITIES = Object.freeze([
    {id:"common",name:"Gewöhnlich",symbol:"⚪",price:1000,jk:5,min:1,max:25},
    {id:"uncommon",name:"Ungewöhnlich",symbol:"🟢",price:5000,jk:10,min:10,max:80},
    {id:"rare",name:"Selten",symbol:"🔵",price:40000,jk:18,min:50,max:350},
    {id:"epic",name:"Episch",symbol:"🟣",price:80000,jk:30,min:250,max:1500},
    {id:"legendary",name:"Legendär",symbol:"🟠",price:150000,jk:50,min:1000,max:8000},
    {id:"special",name:"Special",symbol:"🔴",price:300000,jk:80,min:5000,max:50000},
    {id:"mythic",name:"Mythisch",symbol:"🟡",price:600000,jk:120,min:25000,max:250000},
    {id:"exotic",name:"Exotisch",symbol:"🩵",price:2500000,jk:200,min:100000,max:2500000},
    {id:"universe",name:"Universe",symbol:"🌌",price:10000000,jk:400,min:1000000,max:20000000},
    {id:"blackhole",name:"Black Hole",symbol:"⚫",price:40000000,jk:750,min:10000000,max:100000000},
    {id:"galaxy",name:"Galaxy",symbol:"🌠",price:160000000,jk:1200,min:50000000,max:300000000},
    {id:"cosmic",name:"Kosmisch",symbol:"🔥",price:650000000,jk:1800,min:100000000,max:650000000},
    // Basismaximum bewusst auf 1 Mrd / x2.2 begrenzt, damit Kartenlevel 5 <= 1 Mrd bleibt.
    {id:"godly",name:"Göttlich",symbol:"👑",price:2500000000,jk:2500,min:250000000,max:454545454}
  ]);
  const RARITY_INDEX = Object.freeze(Object.fromEntries(RARITIES.map((r,i)=>[r.id,i])));

  // V344: Reparatur-Kits sind Verbrauchsitems. Normale Kits steigen mit der
  // Kartenrarität stark im Preis; Exclusive besitzt ein eigenes, mit dem
  // aktuellen Account-Kampfbereich skalierendes Reparatur-Siegel.
  const REPAIR_KITS = Object.freeze([
    {id:"common",name:"Gewöhnliches Reparatur-Kit",icon:"🧰",price:2000},
    {id:"uncommon",name:"Ungewöhnliches Reparatur-Kit",icon:"🧰",price:8000},
    {id:"rare",name:"Seltenes Reparatur-Kit",icon:"🛠️",price:35000},
    {id:"epic",name:"Episches Reparatur-Kit",icon:"🛠️",price:75000},
    {id:"legendary",name:"Legendäres Reparatur-Kit",icon:"⚒️",price:160000},
    {id:"special",name:"Special Reparatur-Kit",icon:"⚒️",price:350000},
    {id:"mythic",name:"Mythisches Reparatur-Kit",icon:"🔧",price:800000},
    {id:"exotic",name:"Exotisches Reparatur-Kit",icon:"🔧",price:2000000},
    {id:"universe",name:"Universe Reparatur-Kit",icon:"🌌",price:6000000},
    {id:"blackhole",name:"Black-Hole Reparatur-Kit",icon:"⚫",price:20000000},
    {id:"galaxy",name:"Galaxy Reparatur-Kit",icon:"🌠",price:65000000},
    {id:"cosmic",name:"Kosmisches Reparatur-Kit",icon:"🔥",price:220000000},
    {id:"godly",name:"Göttliches Reparatur-Kit",icon:"👑",price:750000000},
    {id:"exclusive",name:"Exclusive Reparatur-Siegel",icon:"🩸",price:0,exclusive:true}
  ]);
  const REPAIR_KIT_BY_ID = Object.freeze(Object.fromEntries(REPAIR_KITS.map(k=>[k.id,k])));

  // V346: Kampfkarten können für genau einen Kampf einen Trank vorbereiten.
  // Jede Rarität besitzt dieselben drei Trankarten; höhere Raritäten verstärken
  // denselben Effekt prozentual stärker. Ein ausgerüsteter Trank wird beim
  // nächsten gestarteten Kartenkampf verbraucht.
  const POTION_TYPES = Object.freeze([
    {id:"life",name:"Lebens-Trank",icon:"❤️",desc:"Erhöht das maximale Leben für einen Kampf.",priceMult:.35},
    {id:"power",name:"Kraft-Trank",icon:"💪",desc:"Erhöht deinen verursachten Schaden für einen Kampf.",priceMult:.50},
    {id:"guard",name:"Schutz-Trank",icon:"🛡️",desc:"Verringert erlittenen Schaden für einen Kampf.",priceMult:.65}
  ]);

  // V347: Spuren sind ein eigenes Ausrüstungssystem für genau die Karte, die im
  // neuen Tab „Karte“ als persönliche Karte ausgewählt wurde. Es gibt bewusst
  // keine Exclusive-Spur. Jede Spur kann auf jede Kartenrarität gelegt werden.
  // Die Spur bleibt an der Karteninstanz gespeichert, ihre Werte wirken jedoch
  // nur solange genau diese Karte im persönlichen Karten-Slot ausgewählt ist.
  const TRAILS = Object.freeze([
    {id:"common",name:"Gewöhnliche Spur",icon:"〰️",pointPrice:5000,jk:25,levelReq:1,unlockCost:0,points:.10,xp:.05,damage:.04,hp:.04},
    {id:"uncommon",name:"Ungewöhnliche Spur",icon:"🍃",pointPrice:25000,jk:50,levelReq:5,unlockCost:100000,points:.18,xp:.10,damage:.07,hp:.06},
    {id:"rare",name:"Seltene Spur",icon:"💧",pointPrice:150000,jk:90,levelReq:10,unlockCost:500000,points:.30,xp:.16,damage:.11,hp:.09},
    {id:"epic",name:"Epische Spur",icon:"🔮",pointPrice:350000,jk:150,levelReq:15,unlockCost:2500000,points:.45,xp:.24,damage:.16,hp:.13},
    {id:"legendary",name:"Legendäre Spur",icon:"✨",pointPrice:800000,jk:250,levelReq:20,unlockCost:12000000,points:.65,xp:.35,damage:.22,hp:.18},
    {id:"special",name:"Special Spur",icon:"🔻",pointPrice:1800000,jk:400,levelReq:25,unlockCost:60000000,points:.90,xp:.50,damage:.30,hp:.24},
    {id:"mythic",name:"Mythische Spur",icon:"🌟",pointPrice:4000000,jk:650,levelReq:30,unlockCost:300000000,points:1.25,xp:.70,damage:.40,hp:.32},
    {id:"exotic",name:"Exotische Spur",icon:"💠",pointPrice:12000000,jk:1000,levelReq:40,unlockCost:1500000000,points:1.70,xp:.95,damage:.52,hp:.42},
    {id:"universe",name:"Universe Spur",icon:"🌌",pointPrice:45000000,jk:1500,levelReq:50,unlockCost:7500000000,points:2.30,xp:1.30,damage:.66,hp:.54},
    {id:"blackhole",name:"Black Hole Spur",icon:"⚫",pointPrice:160000000,jk:2200,levelReq:60,unlockCost:37500000000,points:3.10,xp:1.75,damage:.82,hp:.68},
    {id:"galaxy",name:"Galaxy Spur",icon:"🌠",pointPrice:600000000,jk:3200,levelReq:75,unlockCost:190000000000,points:4.10,xp:2.30,damage:1.00,hp:.85},
    {id:"cosmic",name:"Kosmische Spur",icon:"🔥",pointPrice:2200000000,jk:4500,levelReq:90,unlockCost:950000000000,points:5.40,xp:3.00,damage:1.22,hp:1.05},
    {id:"godly",name:"Göttliche Spur",icon:"👑",pointPrice:8000000000,jk:6500,levelReq:100,unlockCost:4750000000000,points:7.00,xp:4.00,damage:1.50,hp:1.30}
  ].map((x,index)=>Object.freeze({...x,index})));
  const TRAIL_BY_ID = Object.freeze(Object.fromEntries(TRAILS.map(x=>[x.id,x])));

  // V353: Der persönliche Karten-Slot besitzt einen festen Premium-Speicher.
  // Die drei Erweiterungen sind ausschließlich über den JK/Coin-Shop erhältlich.
  const FEATURED_STORAGE_TIERS = Object.freeze([
    Object.freeze({tier:0,name:"Standard",points:1_000_000,xp:50_000,jk:0}),
    Object.freeze({tier:1,name:"20-Mio.-Speicher",points:20_000_000,xp:150_000,jk:1000}),
    Object.freeze({tier:2,name:"100-Mio.-Speicher",points:100_000_000,xp:500_000,jk:5000}),
    Object.freeze({tier:3,name:"1-Mrd.-Speicher",points:1_000_000_000,xp:1_000_000,jk:10000})
  ]);

  // V357: Karten-Ranks sind jetzt eine echte Meisterschaft der persönlichen Karte.
  // Kartenlevel und Rank laufen getrennt: Das Level wird beim Rank-Up NICHT mehr zurückgesetzt.
  // Meisterschaft gibt es nur durch Siege mit genau dieser persönlichen Karte. Je stärker
  // der Gegner, desto mehr Meisterschaftspunkte; Siege gegen stärkere Gegner zählen zusätzlich
  // als Elite-Siege. Rank-Meilensteine geben eigene Perks und weiterhin Gratis-Speicher.
  const FEATURED_RANKS = Object.freeze([
    Object.freeze({rank:0,title:"Unranked",mastery:0,elite:0,levelReq:1,bonus:0,storageTier:0,backupTier:-1,perk:"Noch keine Rank-Boni"}),
    Object.freeze({rank:1,title:"Anwärter",mastery:20,elite:0,levelReq:2,bonus:.02,storageTier:1,backupTier:0,perk:"20-Mio.-Speicher gratis"}),
    Object.freeze({rank:2,title:"Kämpfer",mastery:55,elite:0,levelReq:2,bonus:.04,storageTier:1,backupTier:1,perk:"Kampf-Tränke +5 % Wirkung"}),
    Object.freeze({rank:3,title:"Veteran",mastery:105,elite:2,levelReq:3,bonus:.06,storageTier:1,backupTier:2,perk:"Special-Attacken +5 % Schaden"}),
    Object.freeze({rank:4,title:"Elite",mastery:175,elite:4,levelReq:3,bonus:.08,storageTier:1,backupTier:3,perk:"Kampfbelohnungen +5 %"}),
    Object.freeze({rank:5,title:"Champion",mastery:270,elite:8,levelReq:4,bonus:.10,storageTier:2,backupTier:4,perk:"100-Mio.-Speicher gratis"}),
    Object.freeze({rank:6,title:"Meister",mastery:390,elite:12,levelReq:4,bonus:.12,storageTier:2,backupTier:5,perk:"5 % weniger erlittener Kampfschaden"}),
    Object.freeze({rank:7,title:"Großmeister",mastery:545,elite:18,levelReq:5,bonus:.14,storageTier:2,backupTier:6,perk:"Kampf-Tränke insgesamt +10 % Wirkung"}),
    Object.freeze({rank:8,title:"Titan",mastery:745,elite:25,levelReq:5,bonus:.16,storageTier:2,backupTier:8,perk:"Special-Attacken insgesamt +10 % Schaden"}),
    Object.freeze({rank:9,title:"Legende",mastery:995,elite:35,levelReq:5,bonus:.18,storageTier:2,backupTier:11,perk:"Kampfbelohnungen insgesamt +10 %"}),
    Object.freeze({rank:10,title:"Apex",mastery:1350,elite:50,levelReq:5,bonus:.25,storageTier:3,backupTier:12,perk:"1-Mrd.-Speicher + Apex-Bonus + 10 % Schadensreduktion"})
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
  const LEVEL_MULT = Object.freeze([1,1,1.25,1.5,1.8,2.2]);
  const DUPE_COST = Object.freeze([0,0,2,5,12,25]);

  const AURAS = Object.freeze([
    {id:"basic",name:"Basic Aura",mult:1.10,icon:"✦"},{id:"rare",name:"Rare Aura",mult:1.25,icon:"✧"},
    {id:"epic",name:"Epic Aura",mult:1.50,icon:"✹"},{id:"legendary",name:"Legendary Aura",mult:1.80,icon:"✺"},
    {id:"mythic",name:"Mythic Aura",mult:2.20,icon:"✷"},{id:"exotic",name:"Exotic Aura",mult:3.00,icon:"◈"},
    {id:"universe",name:"Universe Aura",mult:4.00,icon:"✵"},{id:"blackhole",name:"Black Hole Aura",mult:5.00,icon:"◉"},
    {id:"galaxy",name:"Galaxy Aura",mult:6.00,icon:"✯"},{id:"cosmic",name:"Cosmic Aura",mult:8.00,icon:"☼"}
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
    {unlock:1,wins:10,cost:100000},
    {unlock:2,wins:20,cost:500000},
    {unlock:3,wins:30,cost:2500000},
    {unlock:4,wins:45,cost:12000000},
    {unlock:5,wins:65,cost:60000000},
    {unlock:6,wins:90,cost:300000000},
    {unlock:7,wins:125,cost:1500000000},
    {unlock:8,wins:175,cost:7500000000},
    {unlock:9,wins:240,cost:37500000000},
    {unlock:10,wins:325,cost:190000000000},
    {unlock:11,wins:425,cost:950000000000},
    {unlock:12,wins:550,cost:4750000000000}
  ]);
  const BINDS = Object.freeze([
    {id:"fire",name:"Feuerbindung",mult:1.5,icon:"🔥"},{id:"poison",name:"Giftbindung",mult:1.8,icon:"☣"},
    {id:"ice",name:"Eisbindung",mult:2.0,icon:"❄"},{id:"water",name:"Wasserbindung",mult:2.2,icon:"💧"},
    {id:"hell",name:"Höllenbindung",mult:2.5,icon:"♨"},{id:"angel",name:"Engelsbindung",mult:2.8,icon:"🪽"},
    {id:"wizard",name:"Magierbindung",mult:3.0,icon:"🔮"}
  ]);

  // V350: Jede Aura, Kampf-Aura und Bindung ist im normalen BigCards-Shop mit
  // Points kaufbar. Zusätzlich gibt es pro Stufe einen einmaligen kostenlosen
  // Freischaltweg über echten Spielfortschritt. Kaufen überspringt das Ziel nicht,
  // sondern ist eine alternative Beschaffung; die Gratis-Belohnung kann später
  // trotzdem noch einmal verdient werden.
  const EQUIPMENT_POINT_PRICES = Object.freeze({
    aura:Object.freeze({basic:25000,rare:100000,epic:400000,legendary:1500000,mythic:6000000,exotic:25000000,universe:100000000,blackhole:400000000,galaxy:1500000000,cosmic:6000000000}),
    combatAura:Object.freeze({basic:50000,rare:200000,epic:800000,legendary:3000000,mythic:12000000,exotic:50000000,universe:200000000,blackhole:800000000,galaxy:3000000000,cosmic:12000000000}),
    bind:Object.freeze({fire:100000,poison:500000,ice:2000000,water:8000000,hell:35000000,angel:150000000,wizard:750000000})
  });

  const EXCLUSIVES = Object.freeze([
    {id:"blood-initiate",name:"BLOOD INITIATE",rarityValue:100,chance:35,strength:.80},
    {id:"crimson-familiar",name:"CRIMSON FAMILIAR",rarityValue:80,chance:25,strength:.90},
    {id:"nightfang-stalker",name:"NIGHTFANG STALKER",rarityValue:60,chance:17,strength:1.00},
    {id:"bloodmoon-countess",name:"BLOODMOON COUNTESS",rarityValue:40,chance:10,strength:1.10},
    {id:"sanguine-reaper",name:"SANGUINE REAPER",rarityValue:20,chance:6,strength:1.25},
    {id:"nosferatu-warden",name:"NOSFERATU WARDEN",rarityValue:10,chance:3.5,strength:1.40},
    {id:"crimson-archduke",name:"CRIMSON ARCHDUKE",rarityValue:5,chance:2,strength:1.60},
    {id:"blood-eclipse",name:"BLOOD ECLIPSE",rarityValue:1,chance:.9,strength:1.90},
    {id:"throne-of-night",name:"THRONE OF NIGHT",rarityValue:.5,chance:.5,strength:2.20},
    {id:"blood-sovereign",name:"THE BLOOD SOVEREIGN",rarityValue:.1,chance:.1,strength:2.75}
  ]);

  const PREFIXES = Object.freeze(["","Iron","Shadow","Storm","Frost","Flame","Void","Crystal","Cyber","Ancient","Royal","Phantom","Solar","Lunar","Toxic","Arcane","Titan","Neon","Infernal","Celestial"]);
  const MOTIFS = Object.freeze(["Viking","Samurai","Knight","Dragon","Wolf","Raven","Phoenix","Golem","Hunter","Assassin","Guardian","Sorcerer","Reaper","Colossus","Valkyrie","Ronin","Warden","Berserker","Nomad","Pirate","Gladiator","Monk","Ranger","Engineer","Beast"]);
  const BASE_NAMES = Object.freeze(PREFIXES.flatMap(prefix=>MOTIFS.map(motif=>prefix?`${prefix} ${motif}`:motif)));

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

  const UI={overlay:null,main:null,phone:null,tab:"field",floor:0,collectionTier:0,collectionPage:0,collectionPageMenu:false,collectionSearch:"",selectedSlot:null,selectedCard:null,packReveal:null,role:"player",market:[],leaderboard:[],battleCard:null,battleResult:null,battleSession:null,battleEnemyTimer:0,lastHeader:0,toastTimer:0,rarityScroll:0,mainScroll:{},drag:null,suppressClickUntil:0};
  let S=null,tickTimer=0,cloudSaveTimer=0,cloudPollTimer=0,autoTimer=0,lastTick=performance.now(),cloudReady=false,cloudBooting=false,cloudDirty=false,cloudSaving=false,cloudMutationCounter=0,cloudLastSaveId="",cloudLastRemoteUpdatedAt=0,cloudUid="",cloudMigrationPending=false,localDbPromise=null,localSaveTimer=0,localSaveUser="",localSaveBusy=false,localSaveQueued=false;

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
  async function flushLocalState(userId=""){
    if(!S)return false;if(localSaveBusy){localSaveQueued=true;return false}localSaveBusy=true;
    const target=userId||cloudUid||currentUidSync()||"";let snapshot;
    try{snapshot=JSON.parse(JSON.stringify(S));await putIndexedState(target,snapshot);clearLegacyFullCopies(target);return true;}
    catch(e){
      console.warn("BigCards IndexedDB local save",e);
      // Nur als Notfall genau EINE localStorage-Kopie versuchen. Keine doppelte Vollkopie mehr.
      try{const json=JSON.stringify(snapshot||S);if(json.length>1500000){console.warn("BigCards local fallback übersprungen: Spielstand ist zu groß für localStorage.");return false}localStorage.setItem(SAVE_KEY,json);return true}catch(fallback){console.warn("BigCards local fallback save",fallback);return false}
    }finally{localSaveBusy=false;if(localSaveQueued){localSaveQueued=false;setTimeout(()=>flushLocalState(target),120)}}
  }
  function writeLocalState(userId="",immediate=false){
    if(!S)return;localSaveUser=userId||cloudUid||currentUidSync()||localSaveUser||"";
    if(immediate){clearTimeout(localSaveTimer);localSaveTimer=0;void flushLocalState(localSaveUser);return}
    if(localSaveTimer)return;localSaveTimer=setTimeout(()=>{localSaveTimer=0;void flushLocalState(localSaveUser);},LOCAL_SAVE_DELAY_MS);
  }
  async function readLocalStateForUser(userId){
    const indexed=await readIndexedState(userId);if(indexed&&typeof indexed==="object")return indexed;
    const scoped=readStoredJson(localStateKey(userId)),global=readStoredJson(SAVE_KEY);
    const legacy=scoped&&global?(Number(scoped.updatedAt||0)>=Number(global.updatedAt||0)?scoped:global):(scoped||global);
    if(legacy){try{await putIndexedState(userId,legacy);clearLegacyFullCopies(userId);}catch(e){console.warn("BigCards legacy cache migration",e)}return legacy;}
    return null;
  }
  function readCloudMeta(userId){return readStoredJson(cloudMetaKey(userId))||{};}
  function writeCloudMeta(userId,data){try{localStorage.setItem(cloudMetaKey(userId),JSON.stringify(data||{}))}catch{}}
  function backupLocalConflict(userId,raw){if(!raw)return;void putIndexedState(`conflict:${userId}:${now()}`,raw).catch(()=>{});}
  function persist(){if(!S)return;S.updatedAt=now();writeLocalState(cloudUid||currentUidSync());cloudDirty=true;cloudMutationCounter++;scheduleCloudSave();}
  function defaultState(){return {version:358,points:1000,pendingPoints:0,fieldStoredSeconds:0,level:1,xp:0,totalRebirths:0,phase:0,phaseRebirths:0,unlockedFloors:1,instances:{},floors:Array.from({length:4},()=>Array(10).fill(null)),collection:{},exclusiveCollection:{},shards:0,auraInventory:{},combatAuraInventory:{},bindInventory:{},repairKits:{},potionInventory:{},trailInventory:{},trailTierUnlocked:0,equipmentRewards:{},featuredCardId:null,featuredPendingPoints:0,featuredPendingXp:0,featuredStorageTier:0,featuredLastAt:now(),jkPackCredits:{},exclusiveCredits:0,autoCollectorUntil:0,autoCollectorPointStep:0,autoOpenerUntil:0,autoPack:"common",autoEnabled:false,battleWins:0,battleLosses:0,battleStreak:0,battleBestStreak:0,battleCooldownUntil:0,battleTierUnlocked:0,battleTierWins:0,battleUpgradeSpent:0,lifetimePointsEarned:0,lifetimeScore:0,maxLevelEver:1,highestProductionEver:0,highestXpProductionEver:0,highestUpgrade:{},shinyMilestones:{},floorScore:{1:true},daily:{day:"",opened:0,upgraded:0,newCards:0,claimed:{}},lastSeen:now(),createdAt:now(),updatedAt:now(),packHistory:[]};}
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
  function adoptState(raw,{saveLocal=false,userId=""}={}){
    S=raw&&typeof raw==="object"?Object.assign(defaultState(),raw):defaultState();
    S.instances||={};S.collection||={};S.exclusiveCollection||={};S.auraInventory||={};S.combatAuraInventory||={};S.bindInventory||={};S.repairKits||={};S.potionInventory||={};S.trailInventory||={};S.equipmentRewards||={};
    const potionInventoryMigrated=normalizePotionInventory();
    if(S.daily?.claimed?.new)S.equipmentRewards[equipmentRewardKey("aura","basic")]=true;
    if((Number(S.battleWins)||0)>0)S.equipmentRewards[equipmentRewardKey("combatAura","basic")]=true;
    S.trailTierUnlocked=clamp(Math.floor(Number(S.trailTierUnlocked)||0),0,TRAILS.length-1);
    S.featuredStorageTier=clamp(Math.floor(Number(S.featuredStorageTier)||0),0,FEATURED_STORAGE_TIERS.length-1);
    S.featuredPendingPoints=Math.max(0,Number(S.featuredPendingPoints)||0);S.featuredPendingXp=Math.max(0,Number(S.featuredPendingXp)||0);S.featuredLastAt=Math.max(0,Number(S.featuredLastAt)||now());
    S.fieldStoredSeconds=Math.max(0,Number(S.fieldStoredSeconds)||0);
    S.battleWins=Math.max(0,Math.floor(Number(S.battleWins)||0));S.battleLosses=Math.max(0,Math.floor(Number(S.battleLosses)||0));S.battleStreak=Math.max(0,Math.floor(Number(S.battleStreak)||0));S.battleBestStreak=Math.max(S.battleStreak,Math.floor(Number(S.battleBestStreak)||0));S.battleCooldownUntil=Math.max(0,Number(S.battleCooldownUntil)||0);S.battleTierUnlocked=clamp(Math.floor(Number(S.battleTierUnlocked)||0),0,RARITIES.length-1);S.battleTierWins=Math.max(0,Math.floor(Number(S.battleTierWins)||0));S.battleUpgradeSpent=Math.max(0,Number(S.battleUpgradeSpent)||0);S.autoCollectorPointStep=Math.max(0,Math.floor(Number(S.autoCollectorPointStep)||0));if((Number(S.autoCollectorUntil)||0)<=now())S.autoCollectorPointStep=0;
    for(const inst of Object.values(S.instances)){if(!inst)continue;if(inst.combatAura===undefined)inst.combatAura=null;if(inst.broken===undefined)inst.broken=false;if(inst.brokenAt===undefined)inst.brokenAt=0;if(inst.battlePotion===undefined)inst.battlePotion=null;if(inst.trail===undefined)inst.trail=null;if(inst.backupCardId===undefined)inst.backupCardId=null;inst.rank=clamp(Math.floor(Number(inst.rank)||0),0,FEATURED_RANK_MAX);if(inst.rankMastery===undefined)inst.rankMastery=Math.max(0,Math.floor(Number(inst.rankWins)||0))*4;inst.rankMastery=Math.max(0,Math.floor(Number(inst.rankMastery)||0));if(inst.rankEliteWins===undefined)inst.rankEliteWins=0;inst.rankEliteWins=Math.max(0,Math.floor(Number(inst.rankEliteWins)||0));inst.rankWins=0;if(inst.rankedAt===undefined)inst.rankedAt=0;}
    S.floors=Array.from({length:4},(_,i)=>Array.isArray(S.floors?.[i])?S.floors[i].slice(0,10).concat(Array(10).fill(null)).slice(0,10):Array(10).fill(null));S.unlockedFloors=clamp(S.unlockedFloors||1,1,4);S.phase=clamp(S.phase||0,0,3);S.phaseRebirths=clamp(S.phaseRebirths||0,0,5);S.level=Math.max(1,Math.floor(S.level||1));
    if(S.featuredCardId&&(!S.instances[S.featuredCardId]||S.instances[S.featuredCardId]?.listed))S.featuredCardId=null;
    for(const inst of Object.values(S.instances)){if(!inst?.backupCardId)continue;const backup=S.instances[inst.backupCardId];if(!backup||backup.id===inst.id||backup.listed)inst.backupCardId=null;}
    if(S.featuredCardId){for(const row of S.floors){const i=row.indexOf(S.featuredCardId);if(i>=0)row[i]=null;}}
    S.version=358;const repaired=normalizeFloorUniqueCards();updateFeaturedEarnings(now());if(saveLocal||repaired||potionInventoryMigrated)writeLocalState(userId||cloudUid||currentUidSync());return S;
  }
  function state(){
    if(S)return S;
    return adoptState(readStoredJson(SAVE_KEY),{saveLocal:false});
  }

  function rarityValue(index){return INTERNAL_VALUES[clamp(index,0,499)]??100;}
  function variantKey(rarityIndex,baseIndex){return `${rarityIndex}:${baseIndex}`;}
  function collectionKey(inst){return inst.exclusive?`x:${inst.exclusiveId}`:variantKey(inst.rarity,inst.base);}
  function rarityUnlockedIndex(){const phase=FLOOR_PHASES[S.phase]||FLOOR_PHASES[0];let max=phase.tiers[0][1];for(const [r,t] of phase.tiers)if(S.phaseRebirths>=r)max=t;return max;}
  function floorMaxTier(floorIndex){if(floorIndex>S.phase)return -1;const phase=FLOOR_PHASES[floorIndex];let max=phase.tiers[0][1];const rebirths=floorIndex<S.phase?5:S.phaseRebirths;for(const [r,t] of phase.tiers)if(rebirths>=r)max=t;return max;}
  function rebirthMultiplier(){const completed=S.phase,local=[1,2,3,4,5,5][S.phaseRebirths]||1;return Math.min(125,Math.pow(5,completed)*local);}
  function cardBaseProduction(rarityIndex,baseIndex){const r=RARITIES[rarityIndex],rv=rarityValue(baseIndex);const scarcity=clamp(1-Math.pow((rv-.1)/99.9,.58),0,1);return r.min+(r.max-r.min)*scarcity;}
  function cardBaseXp(inst){const p=inst.exclusive?Math.max(1,inst.basePower||1):cardBaseProduction(inst.rarity,inst.base);return Math.max(.25,Math.sqrt(p)*(.55+(inst.exclusive?1:(inst.rarity+1)*.08)));}
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
  function effectivePoints(inst){if(!inst)return 0;let base=inst.exclusive?Math.max(1,Number(inst.basePower)||1):cardBaseProduction(inst.rarity,inst.base);let value=base*(LEVEL_MULT[inst.level]||1)*rebirthMultiplier();if(inst.aura)value*=auraBy(inst.aura)?.mult||1;if(inst.shiny>=2)value*=1.15;return Math.max(0,value);}
  function effectiveXp(inst){if(!inst)return 0;let value=cardBaseXp(inst)*(1+(inst.level-1)*.14);if(inst.bind)value*=bindBy(inst.bind)?.mult||1;if(inst.shiny>=1)value*=1.10;value*=Math.min(5,Math.sqrt(rebirthMultiplier()));return value;}
  function trailBy(id){return TRAIL_BY_ID[id]||null;}
  function trailCount(id){return Math.max(0,Math.floor(Number(S?.trailInventory?.[id])||0));}
  function returnTrailToInventory(inst){if(!inst?.trail)return null;const t=trailBy(inst.trail);if(t)S.trailInventory[t.id]=trailCount(t.id)+1;inst.trail=null;return t;}
  function trailUnlocked(id){const t=trailBy(id);return !!t&&t.index<=clamp(Math.floor(Number(S?.trailTierUnlocked)||0),0,TRAILS.length-1);}
  function featuredCard(){const inst=instance(S?.featuredCardId);return inst&&!inst.listed?inst:null;}
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
  function backupCardEligible(main,candidate){if(!main||!candidate||candidate.id===main.id||candidate.listed)return false;if(candidate.exclusive)return cardRank(main)>=1;return cardRank(main)>=1&&candidate.rarity<=rankBackupMaxTier(main);}
  function usableFeaturedBackup(main=featuredCard()){const backup=featuredBackupCard(main);return backup&&backupCardEligible(main,backup)&&!backup.broken?backup:null;}
  function clearBackupReferences(cardId){for(const inst of Object.values(S?.instances||{}))if(inst?.backupCardId===cardId)inst.backupCardId=null;}
  function activeTrail(inst){return inst&&S?.featuredCardId===inst.id?trailBy(inst.trail):null;}
  function featurePointRate(inst=featuredCard()){if(!inst)return 0;const t=activeTrail(inst);return effectivePoints(inst)*(1+(t?.points||0))*rankBonusMultiplier(inst);}
  function featureXpRate(inst=featuredCard()){if(!inst)return 0;const t=activeTrail(inst);return effectiveXp(inst)*(1+(t?.xp||0))*rankBonusMultiplier(inst);}
  function featuredStorageMeta(){return FEATURED_STORAGE_TIERS[clamp(Math.floor(Number(S?.featuredStorageTier)||0),0,FEATURED_STORAGE_TIERS.length-1)]||FEATURED_STORAGE_TIERS[0];}
  function featuredStorageNext(){return FEATURED_STORAGE_TIERS[featuredStorageMeta().tier+1]||null;}
  function updateFeaturedEarnings(at=now()){
    if(!S)return;const last=Math.max(0,Number(S.featuredLastAt)||at),dt=Math.max(0,(at-last)/1000);S.featuredLastAt=at;const inst=featuredCard();if(!inst||dt<=0)return;const lim=featuredStorageMeta(),oldPoints=Math.max(0,Number(S.featuredPendingPoints)||0),oldXp=Math.max(0,Number(S.featuredPendingXp)||0);
    // Bereits vor V353 angesammelte Werte oberhalb des neuen Limits werden nicht gelöscht.
    // Es kommt lediglich nichts Neues hinzu, bis der Spieler eingesammelt hat.
    S.featuredPendingPoints=oldPoints>=lim.points?oldPoints:Math.min(lim.points,oldPoints+featurePointRate(inst)*dt);
    S.featuredPendingXp=oldXp>=lim.xp?oldXp:Math.min(lim.xp,oldXp+featureXpRate(inst)*dt);
  }

  // Spielfeld-Speicher: kein fester Geldbetrag, sondern ein mit dem Fortschritt
  // wachsendes Produktionsfenster. Dadurch bleibt das Limit bei später sehr hoher
  // Produktion automatisch groß genug und verhindert trotzdem unbegrenztes AFK-Farmen.
  function fieldStorageMinutes(){const lvl=Math.max(1,Math.floor(Number(S?.level)||1)),reb=Math.max(0,Math.floor(Number(S?.totalRebirths)||0)),floors=Math.max(1,Math.floor(Number(S?.unlockedFloors)||1));return Math.min(720,20+(lvl-1)*1.5+reb*12+(floors-1)*30);}
  function fieldStorageSecondsLimit(){return fieldStorageMinutes()*60;}
  function fieldStorageRemainingSeconds(){return Math.max(0,fieldStorageSecondsLimit()-Math.max(0,Number(S?.fieldStoredSeconds)||0));}
  function fieldStoragePercent(){return Math.min(100,Math.max(0,Number(S?.fieldStoredSeconds)||0)/Math.max(1,fieldStorageSecondsLimit())*100);}
  function fieldPointCapacity(){const lvl=Math.max(1,Math.floor(Number(S?.level)||1)),rate=Math.max(0,productionPerSecond());return Math.max(100000*lvl*lvl,rate*fieldStorageSecondsLimit());}
  function fieldStorageLabel(){const mins=Math.max(1,Math.round(fieldStorageMinutes())),full=fieldStorageRemainingSeconds()<=.01;return `${full?"VOLL · ":""}Limit ~${fmt(fieldPointCapacity())} Points · ${mins} Min Produktion`; }
  function trailBonusText(t){if(!t)return"";return `+${Math.round(t.points*100)} % Karten-Slot-Points · +${Math.round(t.xp*100)} % Karten-Slot-XP · +${Math.round(t.damage*100)} % Kampfschaden · +${Math.round(t.hp*100)} % Kampf-Leben`;}
  function trailClass(inst){const t=inst?trailBy(inst.trail):null;return t?`trail-${t.id}`:"";}
  function exclusiveCombatTier(){
    // Exclusive-Karten orientieren sich am aktuellen BigCards-Accountfortschritt statt
    // an ihrer extrem seltenen Exclusive-Dropchance. Bei Level ~20–39 liegen sie damit
    // bewusst im blauen/seltenen Kampfbereich und wachsen erst mit dem Account weiter.
    const level=Math.max(1,Math.floor(Number(S?.level)||1));
    if(level<10)return 0;
    if(level<20)return 1;
    if(level<40)return 2;
    if(level<55)return 3;
    if(level<70)return 4;
    if(level<82)return 5;
    if(level<90)return 6;
    if(level<95)return 7;
    if(level<98)return 8;
    if(level<99)return 9;
    if(level<100)return 10;
    return clamp(10+Math.floor(Math.max(0,Number(S?.totalRebirths)||0)/5),10,12);
  }
  function combatTier(inst){if(!inst)return 0;return inst.exclusive?exclusiveCombatTier():clamp(Math.floor(inst.rarity||0),0,COMBAT_RANGES.length-1);}
  function repairKitId(inst){return inst?.exclusive?"exclusive":(RARITIES[clamp(Math.floor(inst?.rarity||0),0,RARITIES.length-1)]?.id||"common");}
  function repairKitMeta(id){return REPAIR_KIT_BY_ID[id]||REPAIR_KIT_BY_ID.common;}
  function repairKitPrice(id){
    const kit=repairKitMeta(id);
    if(!kit.exclusive)return Math.max(1,Math.floor(kit.price||1));
    const tier=exclusiveCombatTier(),r=RARITIES[tier]||RARITIES[0];
    // Exclusive bleibt im aktuellen Kampfbereich bezahlbar, kostet aber spürbar
    // mehr als das normale Kit derselben Account-Kampfstufe.
    return Math.max(12000,Math.ceil((r.price*1.75)/1000)*1000);
  }
  function repairKitCount(id){return Math.max(0,Math.floor(Number(S?.repairKits?.[id])||0));}
  function potionTierId(inst){return inst?.exclusive?"exclusive":(RARITIES[clamp(Math.floor(inst?.rarity||0),0,RARITIES.length-1)]?.id||"common");}
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
      exclusive:"exclusive",exklusiv:"exclusive"
    };
    if(raw==="exclusive"||RARITY_INDEX[raw]!==undefined)return raw;
    return aliases[compact]||null;
  }
  function normalizePotionTypeId(value){
    const raw=String(value??"").trim().toLowerCase(),simple=raw.normalize?.("NFD").replace(/[\u0300-\u036f]/g,"")||raw,compact=simple.replace(/[._\s-]+/g,"");
    const aliases={life:"life",leben:"life",lebens:"life",lebenstrank:"life",lebenstrank:"life",hp:"life",health:"life",power:"power",kraft:"power",krafttrank:"power",schaden:"power",damage:"power",guard:"guard",schutz:"guard",schutztrank:"guard",defense:"guard",defence:"guard"};
    if(POTION_TYPES.some(x=>x.id===raw))return raw;
    return aliases[compact]||null;
  }
  function potionTierIndex(tierId){const normalized=normalizePotionTierId(tierId)||"common";return normalized==="exclusive"?exclusiveCombatTier():clamp(RARITY_INDEX[normalized]??0,0,RARITIES.length-1);}
  function potionType(typeId){const normalized=normalizePotionTypeId(typeId)||"life";return POTION_TYPES.find(x=>x.id===normalized)||POTION_TYPES[0];}
  function potionKey(tierId,typeId){return `${normalizePotionTierId(tierId)||tierId}:${normalizePotionTypeId(typeId)||typeId}`;}
  function potionCount(tierId,typeId){const t=normalizePotionTierId(tierId),type=normalizePotionTypeId(typeId);if(!t||!type)return 0;return Math.max(0,Math.floor(Number(S?.potionInventory?.[`${t}:${type}`])||0));}
  function potionTierTotal(tierId){return POTION_TYPES.reduce((sum,p)=>sum+potionCount(tierId,p.id),0);}
  function potionInventoryTotal(){return [...RARITIES.map(r=>r.id),"exclusive"].reduce((sum,tier)=>sum+potionTierTotal(tier),0);}
  function potionTierLabel(tierId){const t=normalizePotionTierId(tierId)||tierId;if(t==="exclusive")return "Exclusive";return RARITIES[RARITY_INDEX[t]]?.name||String(tierId||"");}
  function normalizePotionInventory(){
    if(!S)return false;
    const out={},setCount=(tierId,typeId,value)=>{const tier=normalizePotionTierId(tierId),type=normalizePotionTypeId(typeId),count=Math.max(0,Math.floor(Number(value)||0));if(!tier||!type||count<1)return;const key=`${tier}:${type}`;out[key]=Math.max(out[key]||0,count);};
    const parseFlat=(key,value)=>{
      const parts=String(key||"").split(/[:|/._-]+/).filter(Boolean);
      if(parts.length>=2){const aTier=normalizePotionTierId(parts[0]),aType=normalizePotionTypeId(parts.slice(1).join("")),bType=normalizePotionTypeId(parts[0]),bTier=normalizePotionTierId(parts.slice(1).join(""));if(aTier&&aType)return setCount(aTier,aType,value);if(bTier&&bType)return setCount(bTier,bType,value);}
      const compact=String(key||"").replace(/[:|/._\s-]+/g,"");for(const tier of [...RARITIES.map(r=>r.id),"exclusive"]){for(const type of POTION_TYPES.map(x=>x.id)){if(compact.toLowerCase()===`${tier}${type}`||compact.toLowerCase()===`${type}${tier}`)return setCount(tier,type,value);}}
    };
    const ingest=source=>{if(!source||typeof source!=="object")return;for(const [key,value] of Object.entries(source)){if(value&&typeof value==="object"&&!Array.isArray(value)){const tier=normalizePotionTierId(key);if(tier){for(const [type,count] of Object.entries(value))setCount(tier,type,count);continue;}const type=normalizePotionTypeId(key);if(type){for(const [nestedTier,count] of Object.entries(value))setCount(nestedTier,type,count);continue;}}parseFlat(key,value);}};
    ingest(S.potionInventory);ingest(S.potions);ingest(S.potionStock);ingest(S.potionItems);
    const before=JSON.stringify(S.potionInventory||{}),after=JSON.stringify(out);if(before===after)return false;S.potionInventory=out;return true;
  }
  function potionEffect(tierId,typeId){
    const tier=potionTierIndex(tierId),exclusive=tierId==="exclusive",boost=exclusive?1.06:1;
    let pct=0;if(typeId==="life")pct=(.25+tier*.035)*boost;else if(typeId==="power")pct=(.20+tier*.03)*boost;else pct=(.12+tier*.025)*boost;
    const cap=typeId==="life"?.70:typeId==="power"?.60:.45;return Math.min(cap,pct);
  }
  function potionPrice(tierId,typeId){
    const tier=potionTierIndex(tierId),r=RARITIES[tier]||RARITIES[0],type=potionType(typeId),base=tierId==="exclusive"?Math.max(12000,r.price*1.15):r.price;
    const raw=Math.max(500,base*type.priceMult),round=raw>=1e9?1e6:raw>=1e7?1e5:raw>=1e5?1000:raw>=1e4?100:50;return Math.ceil(raw/round)*round;
  }
  function potionEffectValueText(typeId,effect){const pct=Math.round(Math.max(0,Number(effect)||0)*100);return typeId==="life"?`+${pct} % Leben`:typeId==="power"?`+${pct} % Schaden`:`-${pct} % erlittener Schaden`;}
  function potionEffectText(tierId,typeId){return potionEffectValueText(typeId,potionEffect(tierId,typeId));}
  function preparedPotionMeta(inst){if(!inst?.battlePotion)return null;const tierId=inst.battlePotion.tierId||potionTierId(inst),typeId=inst.battlePotion.typeId||inst.battlePotion;const type=potionType(typeId);return {tierId,typeId,name:type.name,icon:type.icon,effect:potionEffect(tierId,typeId),effectText:potionEffectText(tierId,typeId)};}
  function returnPreparedPotion(inst){const p=preparedPotionMeta(inst);if(!p)return;const key=potionKey(p.tierId,p.typeId);S.potionInventory[key]=potionCount(p.tierId,p.typeId)+1;inst.battlePotion=null;}
  function battleUnlockedTier(){return clamp(Math.floor(Number(S?.battleTierUnlocked)||0),0,RARITIES.length-1);}
  function battleCardUnlocked(inst){return !!inst&&(inst.exclusive||combatTier(inst)<=battleUnlockedTier());}
  function battleUpgradeInfo(){
    const current=battleUnlockedTier(),next=BATTLE_UPGRADES[current]||null;
    return {current,next,wins:Math.max(0,Math.floor(Number(S?.battleTierWins)||0)),max:current>=RARITIES.length-1};
  }
  function battleTierLabel(inst){const tier=combatTier(inst);return RARITIES[tier]?.name||`Stufe ${tier+1}`;}
  function combatStats(inst){
    if(!inst)return {tier:0,min:0,max:0,hp:0,power:0,aura:null};
    const tier=combatTier(inst),range=COMBAT_RANGES[tier]||COMBAT_RANGES[0];
    const rv=inst.exclusive?(EXCLUSIVES.find(x=>x.id===inst.exclusiveId)?.rarityValue||100):rarityValue(inst.base);
    const scarcity=clamp(1-(Math.max(.1,rv)-.1)/99.9,0,1);
    let quality=.90+scarcity*.20;
    if(inst.exclusive){
      const exIndex=Math.max(0,EXCLUSIVES.findIndex(x=>x.id===inst.exclusiveId));
      quality=.94+(exIndex/Math.max(1,EXCLUSIVES.length-1))*.12;
    }
    const levelMult=COMBAT_LEVEL_MULT[clamp(inst.level||1,1,5)]||1;
    const shinyMult=1+clamp(inst.shiny||0,0,3)*.07;
    const aura=combatAuraBy(inst.combatAura),auraMult=aura?.mult||1,trail=activeTrail(inst),trailDamage=1+(trail?.damage||0),trailHp=1+(trail?.hp||0),rankMult=rankBonusMultiplier(inst);
    const baseMin=Math.max(1,Math.floor(range.min*quality*levelMult*shinyMult*auraMult*trailDamage));
    const baseMax=Math.max(baseMin+1,Math.ceil(range.max*quality*levelMult*shinyMult*auraMult*trailDamage));
    const min=Math.max(1,Math.floor(baseMin*rankMult)),max=Math.max(min+1,Math.ceil(baseMax*rankMult)),avg=(min+max)/2,baseAvg=(baseMin+baseMax)/2;
    // Persönliche Spuren und Ranks verstärken Kampfwerte nur, solange die Karte im persönlichen Karten-Slot aktiv ist.
    const hp=Math.max(45,Math.round((baseAvg*5.5+(tier+1)*35*Math.sqrt(levelMult))*trailHp*rankMult));
    const power=Math.max(1,Math.round(avg+hp*.16));
    return {tier,min,max,hp,power,aura,trail};
  }
  function rollCombatDamage(stats){return Math.max(1,Math.floor(stats.min+Math.random()*(stats.max-stats.min+1)));}
  function combatAbilityProfile(inst){
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
    const tier=combatTier(inst),r=RARITIES[tier]||RARITIES[0];
    const rarityBase=Math.max(1000,Number(r.price)||1000);
    const exclusivePremium=inst.exclusive?1.35:1;
    return Math.max(500,Math.ceil((rarityBase*(0.16+level*.055)*exclusivePremium)/50)*50);
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
  function sellValue(inst){if(!inst)return 0;if(inst.exclusive){const p=Math.max(1,(inst.basePower||1)*(LEVEL_MULT[inst.level]||1));return Math.max(1,Math.floor(p*4.5*(1+(inst.shiny||0)*.22)));}const r=RARITIES[inst.rarity],rv=rarityValue(inst.base),scarcity=1+2.5*Math.pow(1-rv/100,2),levelValue=1+(inst.level-1)*.45,shiny=1+(inst.shiny||0)*.22;return Math.max(1,Math.floor(r.price*.06*scarcity*levelValue*shiny));}
  function instance(id){return id?S.instances[id]||null:null;}
  function duplicateIds(inst){if(!inst)return[];const key=collectionKey(inst),deployed=new Set(S.floors.flat().filter(Boolean));return Object.values(S.instances).filter(x=>x.id!==inst.id&&x.id!==S.featuredCardId&&collectionKey(x)===key&&!x.listed&&!x.locked&&!x.favorite&&!deployed.has(x.id)).map(x=>x.id);}
  function collectionCount(){return Object.keys(S.collection).length;}
  function exclusiveCount(){return Object.keys(S.exclusiveCollection).length;}

  // V338: Sammlungs-Score. Jede Kartenvariante bringt maximal 5 Level-Punkte.
  // Dadurch sind exakt 100 % erreicht, wenn jede aktuell im Spiel definierte Karte
  // mindestens einmal bis Stufe 5 gebracht wurde. Neue Serien/Raritäten erweitern
  // den Nenner automatisch und der Gesamtscore passt sich damit zukünftigen Updates an.
  function collectionTierScore(tier){
    if(tier===13){
      const max=EXCLUSIVES.length*5;if(!max)return 0;let got=0;
      for(const ex of EXCLUSIVES){const row=S.exclusiveCollection?.[`x:${ex.id}`];got+=clamp(Number(row?.highestLevel)||0,0,5);}
      return clamp(got/max*100,0,100);
    }
    const max=BASE_NAMES.length*5;if(!max)return 0;let got=0;
    for(let base=0;base<BASE_NAMES.length;base++){const row=S.collection?.[variantKey(tier,base)];got+=clamp(Number(row?.highestLevel)||0,0,5);}
    return clamp(got/max*100,0,100);
  }
  function overallCollectionScore(){
    const totalVariants=RARITIES.length*BASE_NAMES.length+EXCLUSIVES.length;if(!totalVariants)return 0;let earned=0;
    for(let tier=0;tier<RARITIES.length;tier++)earned+=collectionTierScore(tier)*(BASE_NAMES.length/100);
    earned+=collectionTierScore(13)*(EXCLUSIVES.length/100);
    return clamp(earned/totalVariants*100,0,100);
  }
  function scorePct(n){const v=clamp(n,0,100);return v.toLocaleString("de-DE",{minimumFractionDigits:v>=100?0:1,maximumFractionDigits:2})+" %";}
  function collectionComplete(){return overallCollectionScore()>=99.999999;}

  const FIELD_PERMIT_COSTS=Object.freeze([0,50000,100000,500000,1500000,3000000,7500000,20000000,75000000,250000000,750000000,2000000000,5000000000]);
  function fieldPermitCost(inst){if(!inst||inst.exclusive)return 0;return Math.max(0,Number(FIELD_PERMIT_COSTS[clamp(inst.rarity,0,FIELD_PERMIT_COSTS.length-1)])||0);}
  function needsFieldPermit(inst,floor=UI.floor){if(!inst||inst.exclusive)return false;return inst.rarity>floorMaxTier(floor)&&!inst.fieldPermit;}

  function addInstance(data){const id=uid(),inst={id,rarity:Math.floor(data.rarity||0),base:Math.floor(data.base||0),level:1,rank:0,rankMastery:0,rankEliteWins:0,rankWins:0,rankedAt:0,backupCardId:null,aura:null,combatAura:null,bind:null,shiny:0,battlePotion:null,broken:false,brokenAt:0,favorite:false,locked:false,listed:false,exclusive:!!data.exclusive,exclusiveId:data.exclusiveId||null,basePower:data.basePower||null,createdAt:now()};S.instances[id]=inst;const key=collectionKey(inst),col=inst.exclusive?S.exclusiveCollection:S.collection;const wasNew=!col[key];col[key]=col[key]||{firstAt:now(),highestLevel:1};if(wasNew){S.daily.newCards=(S.daily.newCards||0)+1;raiseScore(inst.exclusive?2500+Math.round(20000/(Math.max(.1,data.rarityValue||100))):100+Math.round((inst.rarity+1)*80+250/Math.max(.1,rarityValue(inst.base))),"collection");}return {inst,wasNew};}
  function rollWeighted(rows){let total=rows.reduce((s,x)=>s+Number(x[1]||0),0),r=Math.random()*total;for(const row of rows){r-=row[1];if(r<=0)return row[0]}return rows.at(-1)[0];}
  function rollBaseIndex(){let r=Math.random()*INTERNAL_WEIGHT_SUM;for(let i=0;i<500;i++){r-=INTERNAL_VALUES[i];if(r<=0)return i}return 499;}
  function rollNormal(packRarity){const table=DROP_TABLES[RARITIES[packRarity].id],rarity=rollWeighted(table),base=rollBaseIndex(),tierChance=(table.find(x=>x[0]===rarity)?.[1]||0)/100,actual=tierChance*(rarityValue(base)/INTERNAL_WEIGHT_SUM)*100;const added=addInstance({rarity,base});return {...added,actualChance:actual,rarityValue:rarityValue(base)};}
  function strongestUsableNormalBase(){let best=1;for(const inst of Object.values(S.instances)){if(inst.exclusive||inst.rarity>rarityUnlockedIndex())continue;best=Math.max(best,cardBaseProduction(inst.rarity,inst.base)*(LEVEL_MULT[inst.level]||1));}return best;}
  function rollExclusive(){const ex=EXCLUSIVES[rollWeighted(EXCLUSIVES.map((x,i)=>[i,x.chance]))],basePower=strongestUsableNormalBase()*ex.strength,added=addInstance({exclusive:true,exclusiveId:ex.id,basePower,rarityValue:ex.rarityValue});return {...added,exclusiveMeta:ex,actualChance:ex.chance,rarityValue:ex.rarityValue};}

  function awardMainXp(amount,reason,key,showToast=false){try{return window.JKGamesAwardMainGameXp?.("bigcards",amount,reason,{eventKey:key,toast:!!showToast})||0}catch{return 0}}
  function raiseScore(amount){S.lifetimeScore=Math.max(Number(S.lifetimeScore)||0,(Number(S.lifetimeScore)||0)+Math.max(0,Math.floor(amount||0)));}
  function updateScoreHighWater(){const p=productionPerSecond(),x=xpPerSecond();if(p>S.highestProductionEver){raiseScore(Math.max(1,Math.round(Math.log10(1+p)*160)),"production");S.highestProductionEver=p}if(x>S.highestXpProductionEver){raiseScore(Math.max(1,Math.round(Math.log10(1+x)*100)),"xp");S.highestXpProductionEver=x}S.maxLevelEver=Math.max(S.maxLevelEver||1,S.level||1);}
  function xpNeed(level){const l=Math.max(1,level);return Math.floor(45*Math.pow(l,1.64)*(1+S.phase*.18));}
  function addXp(xp){S.xp+=Math.max(0,xp);let guard=0;while(S.xp>=xpNeed(S.level)&&guard++<100){S.xp-=xpNeed(S.level);S.level++;S.maxLevelEver=Math.max(S.maxLevelEver,S.level);raiseScore(12+Math.floor(Math.sqrt(S.level)*6));if(S.level%10===0)toast(`BigCards Level ${S.level} erreicht!`)}return S.level;}
  function activeInstances(){const out=[];for(let f=0;f<S.unlockedFloors;f++)for(const id of S.floors[f]){const inst=instance(id);if(inst)out.push(inst)}return out;}
  function productionPerSecond(){return activeInstances().reduce((sum,x)=>sum+effectivePoints(x),0);}
  function xpPerSecond(){return activeInstances().reduce((sum,x)=>sum+effectiveXp(x),0);}
  function collectPending(){const amount=Math.floor(S.pendingPoints||0),stored=Math.max(0,Number(S.fieldStoredSeconds)||0);if(!amount&&!stored)return toast("Noch keine Points zum Einsammeln.");S.fieldStoredSeconds=0;if(amount){S.pendingPoints-=amount;S.points+=amount;S.lifetimePointsEarned+=amount;raiseScore(Math.max(1,Math.floor(Math.log10(1+amount)*2)));awardMainXp(Math.min(12,1+Math.floor(Math.log10(1+amount))),"BigCards.kl Collect",`bc-collect-${Math.floor(now()/5000)}`);}persist();refresh();toast(amount?`+${fmt(amount)} Points eingesammelt · Spielfeld-Speicher geleert`:"Spielfeld-Speicher geleert. Die Produktion läuft wieder.");}

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

  function confirmJkPackPurchase(packName,cost){
    return confirm(`JK/Coin-Ausgabe bestätigen\n\n${packName}\nKosten: ${fmt(cost)} JK/Coin\n\nMöchtest du dieses Pack wirklich mit JK/Coin öffnen?`);
  }
  function openNormalPack(rarityIndex,currency="points"){
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
      if(!confirmJkPackPurchase(`${r.name}-Pack · 10 Karten`,r.jk))return;
      if(!window.JKCoinApp?.spend?.(r.jk,`BigCards ${r.name}-Pack`))return toast("Nicht genügend JK-Coins.");
    }
    const results=Array.from({length:10},()=>rollNormal(rarityIndex));S.daily.opened=(S.daily.opened||0)+1;addXp(20+(rarityIndex+1)*10);awardMainXp(2+(rarityIndex>7?3:1),"BigCards.kl Pack",`bc-pack-${now()}-${Math.random()}`);showPackReveal(results,{name:`${r.name}-Pack`,exclusive:false,paid:r.price});persist();
  }
  function openExclusivePack(currency="jk"){
    if(currency==="credit"){
      if(S.exclusiveCredits<1)return false;S.exclusiveCredits--;
    }else{
      if(!confirmJkPackPurchase("EXCLUSIVE PACK · 5 Karten",500))return;
      if(!window.JKCoinApp?.spend?.(500,"BigCards EXCLUSIVE PACK"))return toast("Du brauchst 500 JK-Coins.");
    }
    const results=Array.from({length:5},()=>rollExclusive());S.daily.opened=(S.daily.opened||0)+1;addXp(160);awardMainXp(8,"BigCards.kl Exclusive Pack",`bc-exclusive-${now()}`);showPackReveal(results,{name:"EXCLUSIVE PACK",exclusive:true,paidJk:500});persist();
  }
  function resultCard(result,index,total){const inst=result.inst,meta=cardMeta(inst),status=result.wasNew?"NEU":"DUPLIKAT";return `<article class="bc-reveal-card ${meta.className} ${inst.exclusive?"exclusive":""} ${result.rarityValue<=.4?"secret":""}"><div class="bc-card-art"><span>${meta.icon}</span><em class="bc-reveal-status ${result.wasNew?"is-new":"is-dupe"}">${status}</em></div><small>${inst.exclusive?"EXCLUSIVE":meta.rarity.name} · ${index+1}/${total}</small><h2>${esc(meta.name)}</h2><div class="bc-card-tags"><b>Raritätswert ${pct(result.rarityValue)}</b><b>Packchance ${pct(result.actualChance)}</b></div><p>${fmt(meta.points)} Points/s · ${fmt(meta.xp)} XP/s</p><p>⚔ Kampfwert ${fmt(meta.combat.power)} · Schaden ${fmt(meta.combat.min)}–${fmt(meta.combat.max)}</p><p>Wert ${fmt(meta.value)} Points</p></article>`;}
  function showPackReveal(results,pack){UI.packReveal={results,pack,index:-1};renderReveal();}
  function renderReveal(){const pr=UI.packReveal;if(!pr||!UI.overlay)return;let modal=UI.overlay.querySelector("[data-bc-reveal]");if(!modal){modal=document.createElement("div");modal.className="bc-reveal-overlay";modal.dataset.bcReveal="1";UI.overlay.append(modal)}if(pr.index<0){modal.innerHTML=`<div class="bc-pack-stage ${packClass(pr.pack)}"><button class="bc-skip" data-bc-skip-reveal>Alles überspringen</button><button class="bc-pack-object" data-bc-start-reveal aria-label="Pack öffnen"><span>BIG</span><b>CARDS</b><small>${esc(pr.pack.name)}</small></button><div class="bc-pack-energy"></div><h2>Dein Pack ist bereit</h2><p>${pr.pack.exclusive?"Tippe auf das Pack und öffne den Blutnebel selbst.":"Klicke auf das Pack, wenn du es öffnen möchtest."}</p><strong class="bc-pack-tap">PACK ANTIPPEN / ANKLICKEN</strong></div>`;return}
    if(pr.index<pr.results.length){const result=pr.results[pr.index];modal.innerHTML=`<div class="bc-reveal-stage ${result.rarityValue<=.4?"bc-secret-stage":""}"><button class="bc-skip" data-bc-skip-reveal>Alles überspringen</button>${resultCard(result,pr.index,pr.results.length)}<button class="bc-next-card" data-bc-next-card>Nächste Karte →</button></div>`;return}
    const rows=pr.results.map(r=>cardMeta(r.inst)),newCount=pr.results.filter(r=>r.wasNew).length,rarest=Math.min(...pr.results.map(r=>r.rarityValue)),prod=rows.reduce((s,m)=>s+m.points,0),value=rows.reduce((s,m)=>s+m.value,0),bestTier=Math.max(...pr.results.filter(r=>!r.inst.exclusive).map(r=>r.inst.rarity),0),grade=packGrade(value,rarest,bestTier,pr.pack.exclusive);S.packHistory.unshift({at:now(),name:pr.pack.name,rarest,value,prod,newCount});S.packHistory=S.packHistory.slice(0,20);modal.innerHTML=`<div class="bc-pack-summary"><small>GESAMTPACK</small><h2>${grade}</h2><div class="bc-summary-stats"><b>${pr.results.length} Karten</b><b>Seltenste: ${pct(rarest)}</b><b>Produktion: ${fmt(prod)}/s</b><b>Gesamtwert: ${fmt(value)}</b><b>Neue Karten: ${newCount}</b><b>Duplikate: ${pr.results.length-newCount}</b></div><div class="bc-summary-grid">${pr.results.map((r,i)=>`<div class="bc-mini-card ${cardMeta(r.inst).className}"><span class="bc-mini-status ${r.wasNew?"is-new":"is-dupe"}">${r.wasNew?"NEU":"DUPLIKAT"}</span><b>${esc(cardMeta(r.inst).name)}</b><small>${r.inst.exclusive?"EXCLUSIVE":RARITIES[r.inst.rarity].name} · ${pct(r.rarityValue)} · ⚔ ${fmt(cardMeta(r.inst).combat.power)}</small></div>`).join("")}</div><button class="bc-primary" data-bc-close-reveal>Pack übernehmen</button></div>`;persist();}
  function packClass(pack){return pack.exclusive?"exclusive-pack":"normal-pack"}
  function packGrade(value,rare,best,exclusive){if(exclusive&&rare<=.5)return "GOD PACK";if(rare<=.1||best>=12)return "GOD PACK";if(rare<=.4||best>=11)return "INSANE PACK";if(best>=9)return "EPIC PACK";if(best>=6)return "GREAT PACK";return "GOOD PACK"}

  function cardMeta(inst){if(!inst)return null;const combat=combatStats(inst);if(inst.exclusive){const ex=EXCLUSIVES.find(x=>x.id===inst.exclusiveId)||EXCLUSIVES[0];return {name:ex.name,rarity:{id:"exclusive",name:"Exclusive"},className:"rar-exclusive",icon:"🩸",rarityValue:ex.rarityValue,points:effectivePoints(inst),xp:effectiveXp(inst),value:sellValue(inst),combat}}const r=RARITIES[inst.rarity];return {name:BASE_NAMES[inst.base],rarity:r,className:`rar-${r.id}`,icon:motifIcon(BASE_NAMES[inst.base]),rarityValue:rarityValue(inst.base),points:effectivePoints(inst),xp:effectiveXp(inst),value:sellValue(inst),combat}}
  function motifIcon(name){if(/Dragon/.test(name))return"🐉";if(/Wolf/.test(name))return"🐺";if(/Raven/.test(name))return"🐦‍⬛";if(/Phoenix/.test(name))return"🔥";if(/Golem/.test(name))return"🗿";if(/Reaper/.test(name))return"☠";if(/Sorcerer/.test(name))return"🔮";if(/Knight|Guardian|Warden/.test(name))return"🛡";if(/Samurai|Ronin/.test(name))return"⚔";if(/Viking|Berserker/.test(name))return"🪓";return"◆"}
  function cardEffectBadges(inst){
    if(!inst)return"";const aura=auraBy(inst.aura),combat=combatAuraBy(inst.combatAura),potion=preparedPotionMeta(inst),trail=trailBy(inst.trail);if(!aura&&!combat&&!potion&&!trail)return"";
    return `<span class="bc-card-effect-badges">${aura?`<span class="bc-mini-effect aura" title="${esc(aura.name)}">${aura.icon}</span>`:""}${combat?`<span class="bc-mini-effect combat" title="${esc(combat.name)}"><span class="bc-cross-weapons"><i class="blade">🗡</i><i class="axe">🪓</i></span><small>⚔</small></span>`:""}${potion?`<span class="bc-mini-effect potion" title="${esc(potion.name)} · ${esc(potion.effectText)}">🧪</span>`:""}${trail?`<span class="bc-mini-effect trail" title="${esc(trail.name)}${S?.featuredCardId===inst.id?" · AKTIV":" · gespeichert"}">☄</span>`:""}</span>`;
  }

  function upgradeCard(id){const inst=instance(id);if(!inst||inst.level>=5)return;if(inst.listed)return toast("Gelistete Karten sind bis zum Ende des Angebots gesperrt.");const next=inst.level+1,dupes=duplicateIds(inst),need=DUPE_COST[next],cost=upgradeCost(inst,next);if(dupes.length<need)return toast(`Du brauchst ${need} zusätzliche Exemplare (${dupes.length} vorhanden).`);if(S.points<cost)return toast(`Upgrade kostet ${fmt(cost)} Points.`);if(!confirm(`${cardMeta(inst).name} auf Stufe ${next} upgraden?\n${need} Duplikate + ${fmt(cost)} Points`))return;S.points-=cost;for(const rid of dupes.slice(0,need))delete S.instances[rid];inst.level=next;const key=collectionKey(inst),col=inst.exclusive?S.exclusiveCollection:S.collection;col[key].highestLevel=Math.max(col[key].highestLevel||1,next);S.daily.upgraded=(S.daily.upgraded||0)+1;raiseScore(150*next*(inst.exclusive?3:inst.rarity+1));addXp(50*next);persist();showCardDetail(id);refresh();}
  function upgradeCost(inst,next){const base=inst.exclusive?Math.max(100,inst.basePower):cardBaseProduction(inst.rarity,inst.base);const rarity=inst.exclusive?12:inst.rarity;return Math.max(100,Math.floor(base*(8+rarity*2)*Math.pow(next,2.25)));}
  function upgradeShiny(id){const inst=instance(id);if(!inst||inst.shiny>=3)return;if(inst.listed)return toast("Gelistete Karten sind gesperrt.");const next=inst.shiny+1,needLevel=[0,3,4,5][next];if(inst.level<needLevel)return toast(`Shiny ${next} benötigt Kartenlevel ${needLevel}.`);const base=Math.max(100,sellValue(inst)),mult=[0,12,70,900][next],cost=Math.floor(base*mult);if(S.points<cost)return toast(`Shiny kostet ${fmt(cost)} Points.`);if(!confirm(`Shiny Stufe ${next} für ${fmt(cost)} Points aktivieren?`))return;S.points-=cost;inst.shiny=next;raiseScore(600*next);persist();showCardDetail(id);refresh();}
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
  function equipPotion(id,typeId){const inst=instance(id),type=POTION_TYPES.find(x=>x.id===typeId);if(!inst||!type)return;if(inst.listed)return toast("Gelistete Karten sind gesperrt.");const tierId=potionTierId(inst),owned=potionCount(tierId,typeId);if(owned<1)return toast(`Du besitzt keinen passenden ${type.name} für ${tierId==="exclusive"?"Exclusive":RARITIES[potionTierIndex(tierId)].name}.`);const modalScroll=cardDetailModalScroll(),inCardDetail=modalScroll!==null;if(inst.battlePotion)returnPreparedPotion(inst);S.potionInventory[potionKey(tierId,typeId)]=owned-1;inst.battlePotion={tierId,typeId};persist();if(inCardDetail){showCardDetail(id);restoreCardDetailModalScroll(modalScroll);refresh();}else refresh(true);toast(`${type.name} vorbereitet · ${potionEffectText(tierId,typeId)} im nächsten Kampf.`);}
  function removePotion(id){const inst=instance(id);if(!inst?.battlePotion)return;const modalScroll=cardDetailModalScroll(),inCardDetail=modalScroll!==null,p=preparedPotionMeta(inst);returnPreparedPotion(inst);persist();if(inCardDetail){showCardDetail(id);restoreCardDetailModalScroll(modalScroll);refresh();}else refresh(true);toast(`${p?.name||"Trank"} zurück ins Inventar gelegt.`);}
  function buyPotion(tierId,typeId){const type=POTION_TYPES.find(x=>x.id===typeId);if(!type||(tierId!=="exclusive"&&RARITY_INDEX[tierId]===undefined))return;const price=potionPrice(tierId,typeId);if(S.points<price)return toast(`Dir fehlen ${fmt(price-S.points)} Points für ${type.name}.`);S.points-=price;const key=potionKey(tierId,typeId);S.potionInventory[key]=potionCount(tierId,typeId)+1;persist();showPotionTierShop(tierId);refresh(true);toast(`${type.name} gekauft · -${fmt(price)} Points`);}
  function showPotionShop(){const tiers=[...RARITIES.map(r=>r.id),"exclusive"];showModal(`<div class="bc-potion-shop"><small>KAMPF-APOTHEKE</small><h2>Tränke</h2><p>Wähle zuerst die Kartenrarität. Jede Rarität hat dieselben drei Trankarten, aber die Wirkung wird mit höheren Karten deutlich stärker. Ein vorbereiteter Trank wird <b>beim Start des nächsten Kartenkampfs verbraucht</b>.</p><div class="bc-potion-tier-grid">${tiers.map(id=>{const ex=id==="exclusive",r=ex?null:RARITIES[RARITY_INDEX[id]];return `<button class="${ex?"rar-exclusive":`rar-${id}`}" data-bc-potion-tier="${id}"><span>${ex?"🩸":r.symbol}</span><div><b>${ex?"Exclusive":r.name}</b><small>${potionTierTotal(id)} Tränke im Inventar</small></div><em>Öffnen →</em></button>`}).join("")}</div><div class="bc-repair-explain"><b>So nutzt du Tränke:</b><span>Shop → Tränke kaufen → Sammlung → Karte öffnen → Trank vorbereiten. Im nächsten Kartenkampf wird er automatisch aktiviert und danach verbraucht.</span></div></div>`);}
  function showPotionTierShop(tierId){const ex=tierId==="exclusive",r=RARITIES[potionTierIndex(tierId)]||RARITIES[0];showModal(`<div class="bc-potion-shop bc-potion-tier-shop"><button class="bc-potion-back" data-bc-potion-shop>← Alle Raritäten</button><small>${ex?"EXCLUSIVE":r.name.toUpperCase()} · KAMPF-APOTHEKE</small><h2>${ex?"Exclusive":r.name}-Tränke</h2><p>${ex?`Exclusive-Tränke skalieren mit deinem aktuellen Kampfbereich (${r.name}).`:`Diese Tränke können nur für ${r.name}-Karten vorbereitet werden.`}</p><div class="bc-potion-list">${POTION_TYPES.map(type=>`<article class="${ex?"rar-exclusive":`rar-${r.id}`}"><span>${type.icon}</span><div><b>${type.name}</b><small>${type.desc}</small><strong>${potionEffectText(tierId,type.id)}</strong><em>Inventar ×${potionCount(tierId,type.id)}</em></div><button data-bc-buy-potion="${type.id}" data-tier="${tierId}">${fmt(potionPrice(tierId,type.id))} Points</button></article>`).join("")}</div></div>`);}
  function cardPotionSection(inst){
    const tierId=potionTierId(inst),p=preparedPotionMeta(inst),r=RARITIES[potionTierIndex(tierId)]||RARITIES[0],available=POTION_TYPES.filter(x=>potionCount(tierId,x.id)>0),total=potionInventoryTotal();
    const otherOwned=[...RARITIES.map(x=>x.id),"exclusive"].filter(t=>t!==tierId&&potionTierTotal(t)>0).map(t=>`${potionTierLabel(t)} ×${potionTierTotal(t)}`);
    const matchingHtml=available.length?available.map(x=>`<button data-bc-equip-potion="${x.id}" data-card="${inst.id}">${x.icon} ${x.name} · ${potionEffectText(tierId,x.id)} ×${potionCount(tierId,x.id)}</button>`).join(""):`<span>${total>0?`Keine passenden ${tierId==="exclusive"?"Exclusive":r.name}-Tränke vorhanden.`:"Noch keine Tränke im Inventar."}</span>`;
    const inventoryHint=otherOwned.length?`<small><b>Weitere gekaufte Tränke:</b> ${otherOwned.join(" · ")}. Diese sind für andere Kartenraritäten und werden deshalb hier nicht ausrüstbar angezeigt.</small>`:"";
    return `<section class="bc-card-potion-section"><h3>🧪 Kampf-Trank · 1 Kampf</h3><p>${p?`Vorbereitet: <b>${p.icon} ${p.name}</b> · ${p.effectText}. Wird beim nächsten Kampf verbraucht.`:`Kein Trank vorbereitet. Für diese Karte gelten ${tierId==="exclusive"?`Exclusive-Tränke (${r.name}-Skalierung)`:r.name+"-Tränke"}.`}</p><div class="bc-equip-list">${matchingHtml}${p?`<button data-bc-remove-potion="${inst.id}">Trank entfernen</button>`:""}<button class="bc-potion-open-inline" data-bc-potion-shop>Tränke kaufen</button>${inventoryHint}</div></section>`;
  }
  function buyTrail(id){
    const t=trailBy(id);if(!t)return;if(!trailUnlocked(id))return toast(`${t.name} ist noch gesperrt. Freischaltung erfolgt im Tab „Karte“.`,3600);
    if(S.points<t.pointPrice)return toast(`Dir fehlen ${fmt(t.pointPrice-S.points)} Points für ${t.name}.`);
    S.points-=t.pointPrice;S.trailInventory[id]=trailCount(id)+1;persist();showTrailShop();toast(`${t.name} gekauft · -${fmt(t.pointPrice)} Points`);
  }
  function equipTrail(cardId,trailId){
    const inst=instance(cardId),t=trailBy(trailId);if(!inst||!t)return;if(S.featuredCardId!==inst.id)return toast("Spuren können nur auf deine aktuell ausgewählte Karte gelegt werden.");if(inst.listed)return toast("Gelistete Karten sind gesperrt.");if(!trailUnlocked(t.id))return toast(`${t.name} ist noch nicht freigeschaltet.`);if(trailCount(t.id)<1)return toast(`Du besitzt keine ${t.name}.`);
    updateFeaturedEarnings(now());if(inst.trail)returnTrailToInventory(inst);S.trailInventory[t.id]=trailCount(t.id)-1;inst.trail=t.id;persist();refresh(false);toast(`${t.name} auf ${cardMeta(inst).name} ausgerüstet.`,3200);
  }
  function removeTrail(cardId){const inst=instance(cardId);if(!inst?.trail)return;updateFeaturedEarnings(now());const t=returnTrailToInventory(inst);persist();refresh(false);toast(`${t?.name||"Spur"} zurück ins Inventar gelegt.`);}
  function unlockNextTrail(){
    const current=clamp(Math.floor(Number(S.trailTierUnlocked)||0),0,TRAILS.length-1),next=TRAILS[current+1],inst=featuredCard();if(!next)return toast("Alle Spuren bis Göttlich sind bereits freigeschaltet.");if(!inst)return toast("Wähle im Tab „Karte“ zuerst deine persönliche Karte aus.");const currentTrail=TRAILS[current];if(inst.trail!==currentTrail.id)return toast(`Rüste zuerst die ${currentTrail.name} auf deiner ausgewählten Karte aus. So wird die nächste Spur freischaltbar.`,4200);if(S.level<next.levelReq)return toast(`${next.name} benötigt BigCards Level ${next.levelReq}. Aktuell: Level ${S.level}.`);if(S.points<next.unlockCost)return toast(`${fmt(next.unlockCost)} Points für die Freischaltung von ${next.name} benötigt.`);S.points-=next.unlockCost;S.trailTierUnlocked=current+1;persist();refresh(false);toast(`${next.name} freigeschaltet! Du kannst sie jetzt im Shop mit Points kaufen.`,4200);
  }
  function showTrailShop(){
    const unlocked=clamp(Math.floor(Number(S.trailTierUnlocked)||0),0,TRAILS.length-1);showModal(`<div class="bc-trail-shop"><small>SPURENWERKSTATT</small><h2>Spuren</h2><p>Spuren sind exklusiv für deine persönliche <b>Karte</b>. Sie verbessern den separaten Karten-Slot-Ertrag und den Kartenkampf. Es gibt absichtlich <b>keine Exclusive-Spur</b> – jede normale Spur kann aber auf eine Exclusive-Karte gelegt werden.</p><div class="bc-trail-grid">${TRAILS.map(t=>{const locked=t.index>unlocked;return `<article class="rar-${t.id} ${locked?"locked":""}"><span>${t.icon}</span><div><b>${t.name}</b><small>${trailBonusText(t)}</small><em>Inventar ×${trailCount(t.id)}${locked?` · 🔒 Freischaltung im Tab Karte`:" · freigeschaltet"}</em></div><button data-bc-buy-trail="${t.id}" ${locked?"disabled":""}>${locked?"Gesperrt":`${fmt(t.pointPrice)} Points`}</button></article>`}).join("")}</div><div class="bc-repair-explain"><b>JK/Coin:</b><span>Alle Spuren können zusätzlich direkt im BigCards-Bereich des JK/Coin-Shops gekauft werden. Ein JK/Coin-Kauf legt die Spur ins Inventar, die normale Freischaltung zum Ausrüsten bleibt bestehen.</span></div></div>`);
  }
  function showFeaturedPicker(){
    const cards=Object.values(S.instances).filter(x=>x&&!x.listed).sort((a,b)=>{const af=a.id===S.featuredCardId,bf=b.id===S.featuredCardId;if(af!==bf)return af?-1:1;return cardMeta(b).combat.power-cardMeta(a).combat.power||effectivePoints(b)-effectivePoints(a)}).slice(0,250);showModal(`<div class="bc-feature-picker"><small>DEINE PERSÖNLICHE KARTE</small><h2>Karte auswählen</h2><p>Die ausgewählte Karte wird sofort aus allen Stockwerken entfernt. Solange sie im persönlichen Karten-Slot liegt, kann sie nicht auf ein Stockwerk gesetzt werden. Du kannst sie trotzdem im Kartenkampf benutzen.</p><div class="bc-feature-picker-grid">${cards.length?cards.map(inst=>{const m=cardMeta(inst),current=inst.id===S.featuredCardId;return `<button data-bc-feature-select="${inst.id}" class="${m.className} ${current?"current":""} ${inst.broken?"broken":""}"><span>${m.icon}</span><div><b>${esc(m.name)}</b><small>${inst.exclusive?"EXCLUSIVE":m.rarity.name} · Lv ${inst.level}/5 · Rank ${cardRank(inst)}/10 · ⚔ ${fmt(m.combat.power)}${inst.trail?` · ☄ ${trailBy(inst.trail)?.name||"Spur"}`:""}</small></div><em>${current?"AKTIV":"Auswählen"}</em></button>`}).join(""):`<div class="bc-empty-state"><span>🃏</span><h3>Noch keine Karte vorhanden</h3></div>`}</div></div>`);
  }
  function showFeaturedBackupPicker(){
    const main=featuredCard();if(!main)return toast("Wähle zuerst eine persönliche Karte aus.");if(cardRank(main)<1)return toast("Die erste Backup-Karte wird mit Rank 1 freigeschaltet.");
    const maxTier=rankBackupMaxTier(main),cards=Object.values(S.instances).filter(x=>x&&!x.listed&&x.id!==main.id).sort((a,b)=>{const ae=backupCardEligible(main,a),be=backupCardEligible(main,b);if(ae!==be)return ae?-1:1;if(!!a.broken!==!!b.broken)return a.broken?1:-1;return cardMeta(b).combat.power-cardMeta(a).combat.power||b.level-a.level;}).slice(0,250);
    showModal(`<div class="bc-backup-picker"><small>RANK-BACKUP · ${esc(cardMeta(main).name)}</small><h2>🛡 Backup-Karte wählen</h2><p>Rank ${cardRank(main)} erlaubt normale Backup-Karten bis <b>${esc(rankBackupTierName(main))}</b>. <b>Exclusive-Karten sind ab Rank 1 immer erlaubt</b>, weil sie mit deinem Account skalieren. Die Backup-Karte bleibt auf dem Spielfeld nutzbar und bekommt keine Spur- oder persönlichen Rank-Boni.</p><div class="bc-feature-picker-grid">${cards.length?cards.map(inst=>{const m=cardMeta(inst),eligible=backupCardEligible(main,inst),current=main.backupCardId===inst.id,locked=!eligible||inst.broken;const req=inst.exclusive?1:backupRankRequirementForTier(inst.rarity);return `<button data-bc-backup-select="${inst.id}" class="${m.className} ${current?"current":""} ${inst.broken?"broken":""} ${!eligible?"battle-locked":""}" ${locked?"disabled":""}><span>${m.icon}</span><div><b>${esc(m.name)}</b><small>${inst.exclusive?"EXCLUSIVE · immer erlaubt ab Rank 1":`${m.rarity.name} · benötigt Rank ${req}`} · Lv ${inst.level}/5 · ⚔ ${fmt(m.combat.power)}${S.floors.flat().includes(inst.id)?" · 🏢 im Spielfeld":""}${inst.trail?" · ☄ Spur wird entfernt":""}</small></div><em>${current?"AKTIV":inst.broken?"KAPUTT":eligible?"Als Backup":"GESPERRT"}</em></button>`}).join(""):`<div class="bc-empty-state"><span>🃏</span><h3>Keine Backup-Karte verfügbar</h3></div>`}</div></div>`);
  }
  function setFeaturedBackupCard(id){
    const main=featuredCard(),backup=instance(id);if(!main||!backup)return;if(cardRank(main)<1)return toast("Backup-Karten werden ab Rank 1 freigeschaltet.");if(backup.broken)return toast("Eine kaputte Karte kann nicht als Backup gesetzt werden.");if(!backupCardEligible(main,backup)){const req=backup.exclusive?1:backupRankRequirementForTier(backup.rarity);return toast(`${cardMeta(backup).name} benötigt für den Backup-Slot Rank ${req}.`);}
    if(backup.trail){const t=returnTrailToInventory(backup);toast(`${t?.name||"Spur"} wurde von der Backup-Karte entfernt und ins Inventar gelegt.`,3600);}
    main.backupCardId=backup.id;persist();closeModal();showFeaturedRank();toast(`${cardMeta(backup).name} ist jetzt deine Backup-Karte. Sie bleibt im Spielfeld nutzbar.`,4200);
  }
  function clearFeaturedBackup(){const main=featuredCard();if(!main?.backupCardId)return;const backup=featuredBackupCard(main);main.backupCardId=null;persist();showFeaturedRank();toast(`${backup?cardMeta(backup).name:"Backup-Karte"} als Backup entfernt.`);}

  function selectFeaturedCard(id){
    const inst=instance(id);if(!inst)return;if(inst.listed)return toast("Online gelistete Karten können nicht als persönliche Karte gewählt werden.");updateFeaturedEarnings(now());for(const row of S.floors){const i=row.indexOf(id);if(i>=0)row[i]=null;}S.featuredCardId=id;S.featuredLastAt=now();UI.battleCard=UI.battleCard||id;persist();closeModal();UI.tab="card";refresh(false);toast(`${cardMeta(inst).name} ist jetzt deine persönliche Karte. Sie wurde aus dem Spielfeld entfernt.`,4200);
  }
  function clearFeaturedCard(){const inst=featuredCard();if(!inst)return;updateFeaturedEarnings(now());S.featuredCardId=null;S.featuredLastAt=now();persist();refresh(false);toast(`${cardMeta(inst).name} abgewählt. Du kannst sie jetzt wieder auf ein Stockwerk setzen.`);}
  function collectFeatured(){updateFeaturedEarnings(now());const points=Math.floor(Number(S.featuredPendingPoints)||0),xp=Math.floor(Number(S.featuredPendingXp)||0);if(points<1&&xp<1)return toast("Deine Karte hat noch nichts gesammelt.");S.featuredPendingPoints=Math.max(0,S.featuredPendingPoints-points);S.featuredPendingXp=Math.max(0,S.featuredPendingXp-xp);if(points){S.points+=points;S.lifetimePointsEarned+=points;}if(xp)addXp(xp);raiseScore(Math.max(1,Math.floor(Math.log10(1+points)*3)));persist();refresh(false);toast(`Karten-Slot eingesammelt: +${fmt(points)} Points${xp?` · +${fmt(xp)} XP`:""}`,3600);}
  function rankStorageRequirement(tier){const row=FEATURED_RANKS.find(x=>(x.storageTier||0)>=tier);return row?.rank??null;}
  function applyRankStorageUnlock(inst){
    const tier=rankMeta(cardRank(inst)).storageTier||0;if(tier<=S.featuredStorageTier)return null;
    S.featuredStorageTier=tier;return FEATURED_STORAGE_TIERS[tier]||null;
  }
  function showFeaturedRankInfo(){
    showModal(`<div class="bc-rank-info"><small>PERSÖNLICHE KARTE · MEISTERSCHAFT</small><h2>Wie funktioniert der neue Karten-Rank?</h2><p><b>Rank und Kartenlevel sind zwei getrennte Systeme.</b> Dein Kartenlevel bleibt beim Rank-Up erhalten. Rank zeigt, wie gut du genau dieses Kartenexemplar im Kartenkampf gemeistert hast.</p><ol><li>Wähle im Tab <b>„Karte“</b> eine persönliche Karte. Nur dieses Exemplar kann Meisterschaft sammeln.</li><li>Gewinne Kartenkämpfe mit genau dieser Karte. Ein Sieg gibt je nach Gegnerstärke <b>1 / 2 / 4 / 7 / 12 Meisterschaftspunkte</b> – sehr starke Gegner bringen also viel mehr.</li><li>Siege gegen Gegner mit höherer Kampfstufe zählen zusätzlich als <b>Elite-Siege</b>. Für hohe Ranks brauchst du beides: Meisterschaft + Elite-Siege.</li><li>Jeder Rank hat außerdem eine kleine Kartenlevel-Anforderung. Das Kartenlevel wird dabei <b>nie zurückgesetzt</b>.</li><li>Wenn alle Bedingungen erfüllt sind, drückst du im Rank-Menü auf <b>Rank meistern</b>. Der Rank bleibt dauerhaft auf diesem Kartenexemplar gespeichert.</li></ol><p><b>Grundbonus:</b> Rank 1–9 geben jeweils insgesamt +2 % pro Rank auf persönliche Karten-Slot-Points, Karten-Slot-XP, Kampfschaden und Kampf-Leben. Rank 10 ist „Apex“ und erhöht diesen Grundbonus auf insgesamt <b>+25 %</b>.</p><p><b>Meilenstein-Perks:</b> Höhere Ranks verstärken zusätzlich Tränke, Special-Attacken, Kampfbelohnungen und Schadensreduktion. Diese Perks gelten nur, solange das Exemplar deine persönliche Karte ist.</p><p><b>Speicher gratis:</b> Rank 1 → 20 Mio. Points / 150.000 XP, Rank 5 → 100 Mio. / 500.000 XP, Rank 10 → 1 Mrd. / 1 Mio. XP. JK/Coin-Upgrades bleiben als alternative Sofort-Freischaltung bestehen.</p><p><b>Backup-Karte:</b> Ab Rank 1 bekommst du einen zweiten Kampfslot. Rank 1 erlaubt Gewöhnlich, Rank 2 Ungewöhnlich, Rank 3 Selten, Rank 4 Episch, Rank 5 Legendär, Rank 6 Special, Rank 7 Mythisch, Rank 8 bis Universe, Rank 9 bis Kosmisch und Rank 10 bis Göttlich. <b>Exclusive ist ab Rank 1 immer erlaubt.</b> Die Backup-Karte bleibt im Spielfeld nutzbar, erhält keine Spur und keine persönlichen Rank-Boni. Fällt deine Hauptkarte auf höchstens 15 % Leben, wird automatisch auf die Backup-Karte gewechselt; bei einem K.O. wird die Hauptkarte zerbrochen und das Backup kämpft weiter.</p><button data-bc-feature-rank>Zum Rank-Menü</button></div>`);
  }
  function showFeaturedRank(){
    const inst=featuredCard();if(!inst)return toast("Wähle zuerst eine persönliche Karte aus.");
    const rank=cardRank(inst),meta=rankMeta(rank),next=nextRankMeta(inst),mastery=cardRankMastery(inst),elite=cardRankEliteWins(inst),m=cardMeta(inst),max=rank>=FEATURED_RANK_MAX;
    const levelReady=!!next&&inst.level>=next.levelReq,masteryReady=!!next&&mastery>=next.mastery,eliteReady=!!next&&elite>=next.elite,ready=!!next&&levelReady&&masteryReady&&eliteReady&&!inst.broken;
    const masteryPct=next?Math.min(100,mastery/Math.max(1,next.mastery)*100):100,elitePct=next?.elite?Math.min(100,elite/Math.max(1,next.elite)*100):100;
    const track=FEATURED_RANKS.slice(1).map(r=>`<span class="${r.rank<rank?"done":r.rank===rank?"current":r.rank===rank+1?"next":""}" title="${esc(r.perk)} · Backup bis ${r.backupTier>=0?(RARITIES[r.backupTier]?.name||"Karte"):"–"}"><b>R${r.rank}</b><small>${esc(r.title)}</small><em>+${Math.round(r.bonus*100)}%</em></span>`).join("");
    const currentStorage=S.featuredStorageTier||0,nextStorageTier=next?.storageTier||0;
    const storageText=nextStorageTier>currentStorage?`Dieser Rank schaltet zusätzlich <b>${FEATURED_STORAGE_TIERS[nextStorageTier].name}</b> kostenlos frei.`:rank<5&&currentStorage<2?`Nächster gratis Speicher-Meilenstein: <b>Rank 5</b> · 100 Mio. Points / 500.000 XP.`:rank<10&&currentStorage<3?`Nächster gratis Speicher-Meilenstein: <b>Rank 10</b> · 1 Mrd. Points / 1 Mio. XP.`:`Dein aktuell freigeschalteter Speicher bleibt dauerhaft erhalten.`;
    const perks=FEATURED_RANKS.slice(1).map(r=>`<li class="${r.rank<=rank?"done":""}"><b>Rank ${r.rank} · ${esc(r.title)}</b><span>${esc(r.perk)} · Backup bis ${esc(RARITIES[Math.max(0,r.backupTier)]?.name||"–")}${r.rank>=1?" + Exclusive":""}</span></li>`).join("");
    showModal(`<div class="bc-rank-panel"><div class="bc-manager-title"><div><small>PERSÖNLICHE KARTE · MEISTERSCHAFT</small><h2>🏅 Karten-Rank</h2><p>${esc(m.name)} · Level ${inst.level}/5 · Rank ${rank}/10 · ${esc(meta.title)}</p></div><button class="bc-manager-info" data-bc-rank-info title="Wie funktioniert Rank?" aria-label="Rank Info">i</button></div><div class="bc-rank-summary"><div><span>Aktueller Rank</span><strong>${rank}/10</strong><small>${esc(meta.title)} · +${Math.round(meta.bonus*100)} % Grundbonus</small></div><div><span>Meisterschaft</span><strong>${next?`${fmt(mastery)} / ${fmt(next.mastery)}`:"MAX"}</strong><small>Stärkere Gegner geben mehr Punkte.</small></div><div><span>Elite-Siege</span><strong>${next?`${fmt(elite)} / ${fmt(next.elite)}`:"MAX"}</strong><small>Nur Siege gegen stärkere Gegner.</small></div></div><div class="bc-rank-track">${track}</div>${max?`<div class="bc-rank-max"><b>🏆 RANK 10 · APEX</b><span>+25 % persönliche Points, XP, Kampfschaden und Kampf-Leben.</span><span>+10 % Trankwirkung · +10 % Special-Schaden · 10 % weniger erlittener Schaden · +10 % Kampfbelohnungen.</span><span>Maximaler Speicher: ${fmt(FEATURED_STORAGE_TIERS[3].points)} Points / ${fmt(FEATURED_STORAGE_TIERS[3].xp)} XP.</span></div>`:`<section class="bc-rank-next"><small>NÄCHSTER RANK · ${esc(next.title)} · RANK ${next.rank}</small><h3>${fmt(next.mastery)} Meisterschaft${next.elite?` + ${fmt(next.elite)} Elite-Siege`:""} + Level ${next.levelReq}</h3><p>Meisterschaft: <b>${fmt(mastery)} / ${fmt(next.mastery)}</b>. Ein Sieg gibt 1–12 Punkte abhängig von der Gegnerstärke.</p><i class="bc-rank-meter"><u style="width:${masteryPct}%"></u></i>${next.elite?`<p>Elite-Siege: <b>${fmt(elite)} / ${fmt(next.elite)}</b>.</p><i class="bc-rank-meter elite"><u style="width:${elitePct}%"></u></i>`:""}<p>Kartenlevel: <b>${inst.level}/5</b> · benötigt Level ${next.levelReq}. ${storageText}</p><p><b>Rank-Belohnung:</b> +${Math.round(next.bonus*100)} % Grundbonus · ${esc(next.perk)}.</p>${inst.broken?`<em class="bc-rank-warning">💥 Repariere die Karte vor dem Rank-Up.</em>`:""}<button data-bc-rank-upgrade ${ready?"":"disabled"}>${ready?`🏅 Rank ${next.rank} meistern · Level bleibt ${inst.level}`:`🔒 Rank ${next.rank} noch nicht bereit`}</button></section>`}<section class="bc-rank-backup"><div><small>BACKUP-KARTE · RANK-PERK</small><h3>${cardRank(inst)<1?"🔒 Freischaltung ab Rank 1":featuredBackupCard(inst)?`🛡 ${esc(cardMeta(featuredBackupCard(inst)).name)}`:"Noch keine Backup-Karte gewählt"}</h3><p>${cardRank(inst)<1?"Erreiche Rank 1, um den Backup-Slot zu aktivieren.":`Mit Rank ${rank} darf deine normale Backup-Karte bis <b>${esc(rankBackupTierName(inst))}</b> gehen. Exclusive ist immer erlaubt. Backup-Karten bleiben im Spielfeld nutzbar und bekommen keine Spur-/persönlichen Rank-Boni.`}</p>${cardRank(inst)>=1?`<div class="bc-rank-backup-actions"><button data-bc-backup-picker>${featuredBackupCard(inst)?"Backup wechseln":"Backup wählen"}</button>${featuredBackupCard(inst)?`<button class="secondary" data-bc-backup-clear>Backup entfernen</button>`:""}</div>`:""}</section><section class="bc-rank-perks"><small>RANK-MEILENSTEINE</small><ul>${perks}</ul></section><p class="bc-rank-foot">Meisterschaft, Elite-Siege und Rank gehören dauerhaft zu diesem Kartenexemplar. Wechselst du deine persönliche Karte, pausieren die Rank-Boni dieses Exemplars, gehen aber nicht verloren.</p></div>`);
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
  function featuredTrailVisual(inst){const t=activeTrail(inst);if(!t)return"";return `<div class="bc-feature-trail-sweep ${trailClass(inst)}" aria-hidden="true"><i></i><b>${t.icon}</b></div>`;}
  function featureCardHtml(){
    updateFeaturedEarnings(now());const inst=featuredCard(),unlocked=clamp(Math.floor(Number(S.trailTierUnlocked)||0),0,TRAILS.length-1),currentTrail=TRAILS[unlocked],next=TRAILS[unlocked+1]||null,storage=featuredStorageMeta(),storageNext=featuredStorageNext();if(!inst)return `<section class="bc-section bc-feature-page"><div class="bc-section-title"><div><small>PERSÖNLICHER KARTEN-SLOT</small><h2>Karte</h2><p>Wähle eine einzelne Karte als persönliche Karte. Der Standard-Speicher fasst <b>1 Mio. Points und 50.000 XP</b>. Größere Limits gibt es per JK/Coin oder kostenlos über Karten-Ranks.</p></div></div><div class="bc-empty-state bc-feature-empty"><span>🃏</span><h3>Noch keine persönliche Karte gewählt</h3><p>Die Karte wird aus dem Spielfeld herausgenommen, bleibt aber für Kartenkampf und alle Upgrades verfügbar.</p><button data-bc-feature-picker>Karte auswählen</button></div></section>`;
    const m=cardMeta(inst),t=trailBy(inst.trail),rank=cardRank(inst),pointRate=featurePointRate(inst),xpRate=featureXpRate(inst),available=TRAILS.filter(x=>trailUnlocked(x.id)&&trailCount(x.id)>0),nextReady=next&&S.level>=next.levelReq&&inst.trail===currentTrail.id&&S.points>=next.unlockCost,pPct=Math.min(100,Math.max(0,Number(S.featuredPendingPoints)||0)/storage.points*100),xPct=Math.min(100,Math.max(0,Number(S.featuredPendingXp)||0)/storage.xp*100);
    return `<section class="bc-section bc-feature-page"><div class="bc-section-title"><div><small>PERSÖNLICHER KARTEN-SLOT</small><h2>Karte</h2><p>Diese Karte ist vom normalen Spielfeld getrennt. Ihre Produktion zählt <b>nicht</b> zur Anzeige „Produktion“ oben.</p></div><div class="bc-feature-top-actions"><button data-bc-feature-picker>Karte wechseln</button><button class="secondary" data-bc-feature-clear>Abwählen</button><button class="rank" data-bc-feature-rank>🏅 Rank</button><button class="rank-info" data-bc-rank-info title="Wie funktioniert Rank?" aria-label="Rank Info">i</button></div></div><div class="bc-feature-layout"><article class="bc-feature-card ${m.className} shiny-${inst.shiny} ${trailClass(inst)} ${inst.broken?"broken":""}">${featuredTrailVisual(inst)}<div class="bc-feature-card-art"><span>${m.icon}</span>${cardEffectBadges(inst)}${inst.broken?'<span class="bc-card-crack" aria-hidden="true"></span>':""}</div><small>${inst.exclusive?"EXCLUSIVE":m.rarity.name} · Rarität ${pct(m.rarityValue)}</small><h2>${esc(m.name)}</h2><div class="bc-feature-card-stats"><span>★ Level ${inst.level}/5</span><span>🏅 Rank ${rank}/10 · ${esc(rankMeta(rank).title)}</span><span>⚔ ${fmt(m.combat.power)}</span><span>❤️ ${fmt(m.combat.hp)}</span><span>💥 ${fmt(m.combat.min)}–${fmt(m.combat.max)}</span><span>📈 Meisterschaft +${Math.round(rankMeta(rank).bonus*100)}%</span></div><div class="bc-feature-equipment"><span>${inst.aura?`${auraBy(inst.aura)?.icon||"✦"} ${auraBy(inst.aura)?.name}`:"✦ Keine Aura"}</span><span>${inst.combatAura?`⚔ ${combatAuraBy(inst.combatAura)?.name}`:"⚔ Keine Kampf-Aura"}</span><span>${inst.bind?`${bindBy(inst.bind)?.icon||"🔗"} ${bindBy(inst.bind)?.name}`:"🔗 Keine Bindung"}</span><span>${inst.shiny?`⚡ Shiny ${inst.shiny}/3`:"⚡ Kein Shiny"}</span><span>${inst.battlePotion?`🧪 ${preparedPotionMeta(inst)?.name||"Trank"}`:"🧪 Kein Trank"}</span><span>${t?`${t.icon} ${t.name}`:"☄ Keine Spur"}</span><span>${featuredBackupCard(inst)?`🛡 Backup: ${esc(cardMeta(featuredBackupCard(inst)).name)}`:cardRank(inst)>=1?"🛡 Backup frei":"🛡 Backup ab Rank 1"}</span></div><button class="bc-feature-detail" data-bc-card="${inst.id}">Karte & Ausrüstung bearbeiten</button></article><div class="bc-feature-side"><section class="bc-feature-vault"><small>KARTEN-SLOT-SPEICHER · ${storage.name.toUpperCase()}</small><h3>Eigener Ertrag</h3><div class="bc-feature-vault-values"><div><span>Gesammelt</span><b data-bc-feature-pending>${fmt(S.featuredPendingPoints)}</b><small>von ${fmt(storage.points)} Points</small><i class="bc-storage-meter"><u data-bc-feature-point-meter style="width:${pPct}%"></u></i></div><div><span>Gesammelte XP</span><b data-bc-feature-xp>${fmt(S.featuredPendingXp)}</b><small>von ${fmt(storage.xp)} BigCards XP</small><i class="bc-storage-meter"><u data-bc-feature-xp-meter style="width:${xPct}%"></u></i></div></div><p>Aktuell <b data-bc-feature-rate>+${fmt(pointRate)}/s</b> Points und <b data-bc-feature-xp-rate>+${fmt(xpRate)}/s XP</b>. Sobald ein Limit voll ist, sammelt dieser Teil erst nach dem Einsammeln wieder weiter.</p>${storageNext?`<div class="bc-feature-storage-upgrade"><b>Nächste Speicherstufe · JK/Coin oder Rank ${rankStorageRequirement(storageNext.tier)} gratis</b><span>${fmt(storageNext.points)} Points · ${fmt(storageNext.xp)} XP</span><em>${fmt(storageNext.jk)} JK/Coin</em><button data-bc-jkshop>Im JK-Shop upgraden</button></div>`:`<div class="bc-feature-storage-upgrade max"><b>MAX-SPEICHER FREIGESCHALTET</b><span>${fmt(storage.points)} Points · ${fmt(storage.xp)} XP</span></div>`}<button class="bc-feature-collect" data-bc-feature-collect>💰 Geld einsammeln</button></section>${cardPotionSection(inst)}<section class="bc-feature-trail-panel"><small>SPUR</small><h3>${t?`${t.icon} ${t.name}`:"Keine Spur ausgerüstet"}</h3><p>${t?trailBonusText(t):"Spuren verändern das Design deiner Karte und erhöhen Karten-Slot-Points, XP, Kampfschaden und Kampf-Leben."}</p><div class="bc-feature-trail-actions">${available.map(x=>`<button data-bc-equip-trail="${x.id}" data-card="${inst.id}">${x.icon} ${x.name} ×${trailCount(x.id)}</button>`).join("")||'<span>Keine freigeschaltete Spur im Inventar.</span>'}${t?`<button class="secondary" data-bc-remove-trail="${inst.id}">Spur entfernen</button>`:""}<button data-bc-trail-shop>Spuren kaufen</button></div></section><section class="bc-trail-progression"><small>SPUREN-FREISCHALTUNG ${unlocked+1}/${TRAILS.length}</small><h3>Freigeschaltet bis ${currentTrail.name}</h3>${next?`<p>Für <b>${next.name}</b>: BigCards Level ${next.levelReq}, ${fmt(next.unlockCost)} Points und die <b>${currentTrail.name}</b> muss auf deiner persönlichen Karte ausgerüstet sein.</p><button data-bc-trail-unlock ${nextReady?"":"disabled"}>${nextReady?`${next.name} freischalten · ${fmt(next.unlockCost)}`:`🔒 ${next.name} · Level ${next.levelReq}`}</button>`:'<p><b>MAX:</b> Alle Spuren bis Göttlich freigeschaltet.</p>'}</section></div></div></section>`;
  }

  function sellCard(id){const inst=instance(id);if(!inst)return;if(id===S.featuredCardId)return toast("Wähle die Karte im Tab „Karte“ zuerst ab, bevor du sie verkaufst.");if(featuredCard()?.backupCardId===id)return toast("Entferne diese Karte zuerst im Rank-Menü als Backup-Karte.");if(inst.broken)return toast("Repariere die Karte vor dem Verkauf.");if(inst.favorite||inst.locked)return toast("Favorisierte/gesperrte Karten können nicht verkauft werden.");if(S.floors.flat().includes(id))return toast("Nimm die Karte zuerst vom Stockwerk.");if(inst.listed)return toast("Die Karte ist im Online-Marktplatz gelistet.");const m=cardMeta(inst),warning=(inst.aura||inst.combatAura||inst.bind)?"\nAura/Kampf-Aura/Bindung werden mitverkauft. Entferne sie vorher, wenn du sie behalten willst.":"";if(!confirm(`${m.name} für ${fmt(m.value)} Points verkaufen?${warning}\nDer Verkauf ist endgültig.`))return;if(inst.battlePotion)returnPreparedPotion(inst);if(inst.trail)returnTrailToInventory(inst);clearBackupReferences(id);delete S.instances[id];S.points+=m.value;persist();refresh();closeModal();toast(`+${fmt(m.value)} Points`);}
  function shredDuplicate(id){const inst=instance(id);if(!inst||id===S.featuredCardId||featuredCard()?.backupCardId===id||inst.favorite||inst.locked||S.floors.flat().includes(id)||inst.listed)return;if(inst.battlePotion)returnPreparedPotion(inst);if(inst.trail)returnTrailToInventory(inst);const gain=Math.max(1,Math.round((inst.exclusive?20:inst.rarity+1)*4/Math.max(.3,Math.sqrt(cardMeta(inst).rarityValue))));clearBackupReferences(id);delete S.instances[id];S.shards+=gain;persist();refresh();toast(`+${gain} Card Shards`);}

  function findCardPlacement(id){for(let floor=0;floor<S.floors.length;floor++){const slot=S.floors[floor].indexOf(id);if(slot>=0)return {floor,slot};}return null;}
  function sameVariantOnFloor(inst,floor,excludeId=null){if(!inst||!S.floors[floor])return null;const key=collectionKey(inst);for(const id of S.floors[floor]){if(!id||id===excludeId)continue;const other=instance(id);if(other&&collectionKey(other)===key)return other;}return null;}
  function placeCard(id,floor=UI.floor,slot=UI.selectedSlot){
    const inst=instance(id);if(!inst)return;if(id===S.featuredCardId)return toast("Diese Karte liegt im persönlichen Karten-Slot. Wähle sie dort zuerst ab, bevor du sie aufs Spielfeld setzt.");if(inst.listed)return toast("Diese Karte ist im Online-Marktplatz gesperrt.");if(floor>=S.unlockedFloors)return toast("Stockwerk noch gesperrt.");
    const max=floorMaxTier(floor),required=inst.exclusive?0:inst.rarity;if(required>max&&!inst.fieldPermit)return toast(`${cardMeta(inst).name} ist regulär noch nicht für Stockwerk ${floor+1} freigeschaltet. Kaufe bei dieser Karteninstanz zuerst die vorzeitige Spielfeld-Freigabe.`);
    const same=sameVariantOnFloor(inst,floor,id);if(same)return toast(`${cardMeta(inst).name} ist auf Stockwerk ${floor+1} bereits eingesetzt. Pro Stockwerk ist jede Kartenvariante nur 1× erlaubt.`);
    if(S.floors.flat().includes(id))for(const row of S.floors){const i=row.indexOf(id);if(i>=0)row[i]=null}
    let target=Number.isInteger(slot)?slot:S.floors[floor].findIndex(x=>!x);if(target<0)return toast("Dieses Stockwerk hat keinen freien Kartenplatz. Entferne zuerst eine Karte oder nutze Bestes Setup.");
    S.floors[floor][target]=id;UI.selectedSlot=null;addXp(8);persist();refresh();closeModal();
  }
  function removeFromSlot(floor,slot){if(!S.floors[floor]||slot<0||slot>=S.floors[floor].length)return;S.floors[floor][slot]=null;persist();refresh();}
  function unlockAndPlaceCard(id){
    const inst=instance(id);if(!inst||inst.exclusive)return placeCard(id);
    const max=floorMaxTier(UI.floor);if(inst.rarity<=max||inst.fieldPermit)return placeCard(id);
    const same=sameVariantOnFloor(inst,UI.floor,id);if(same)return toast(`${cardMeta(inst).name} ist auf Stockwerk ${UI.floor+1} bereits eingesetzt.`);
    const target=Number.isInteger(UI.selectedSlot)?UI.selectedSlot:S.floors[UI.floor].findIndex(x=>!x);if(target<0)return toast("Kein freier Kartenplatz. Entferne zuerst eine Karte.");
    const cost=fieldPermitCost(inst);if(S.points<cost)return toast(`Vorzeitige Spielfeld-Freigabe kostet ${fmt(cost)} Points.`);
    if(!confirm(`${cardMeta(inst).name} vorzeitig für das Spielfeld freischalten?\nDiese Freigabe gilt dauerhaft für genau diese Karteninstanz.\nKosten: ${fmt(cost)} Points`))return;
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
  function smartSetup(floor=UI.floor){
    const max=floorMaxTier(floor),used=new Set(S.floors.flat().filter(Boolean));for(const id of S.floors[floor])used.delete(id);
    const sorted=Object.values(S.instances).filter(x=>!x.listed&&x.id!==S.featuredCardId&&(x.exclusive||x.rarity<=max||x.fieldPermit)&&!used.has(x.id)).sort((a,b)=>effectivePoints(b)-effectivePoints(a));
    const unique=[],seenKeys=new Set();for(const inst of sorted){const key=collectionKey(inst);if(seenKeys.has(key))continue;seenKeys.add(key);unique.push(inst);if(unique.length>=10)break;}
    S.floors[floor]=Array.from({length:10},(_,i)=>unique[i]?.id||null);persist();refresh();toast("Bestes Setup gesetzt · jede Kartenvariante maximal 1× auf diesem Stockwerk.");
  }

  function doRebirth(skip=false){
    if(!skip&&S.level<100)return toast("Level 100 wird für den normalen Rebirth benötigt.");
    const beforeMult=rebirthMultiplier(),nextLocal=Math.min(5,S.phaseRebirths+1),nextMult=Math.min(125,Math.pow(5,S.phase)*([1,2,3,4,5,5][nextLocal]||5));
    if(!confirm(`Rebirth durchführen?\nALLE aktuellen BigCards-Points und noch nicht eingesammelten Points werden auf 0 gesetzt.\nDas interne Level startet wieder bei Level 1.\nALLE Karten und Duplikate bleiben vollständig erhalten – inklusive Feldbelegung, Kartenlevel, Aura, Kampf-Aura, Bindung und Shiny.\nSammlung und freigeschaltete Stockwerke bleiben ebenfalls erhalten.\nNächster Multiplikator: x${nextMult}${skip?"\nKosten: 300 JK-Coins":""}`))return;
    if(skip&&!window.JKCoinApp?.spend?.(300,"BigCards Rebirth-Skip"))return toast("Nicht genügend JK-Coins.");

    // V336: Kartenfortschritt ist beim Rebirth ausdrücklich geschützt. Selbst wenn die
    // Reset-Logik später erweitert wird, dürfen Karteninstanzen/Duplikate/Slots nicht verschwinden.
    const keepCards={
      instances:S.instances,
      collection:S.collection,
      exclusiveCollection:S.exclusiveCollection,
      floors:S.floors,
      highestUpgrade:S.highestUpgrade,
      shinyMilestones:S.shinyMilestones
    };

    S.totalRebirths++;S.phaseRebirths=nextLocal;S.points=0;S.pendingPoints=0;S.fieldStoredSeconds=0;S.level=1;S.xp=0;
    if(S.phaseRebirths>=5&&S.phase<3){S.phase++;S.phaseRebirths=0;S.unlockedFloors=Math.max(S.unlockedFloors,S.phase+1);raiseScore(5000*S.unlockedFloors);S.auraInventory.basic=(S.auraInventory.basic||0)+1;S.bindInventory.fire=(S.bindInventory.fire||0)+1;}

    S.instances=keepCards.instances;S.collection=keepCards.collection;S.exclusiveCollection=keepCards.exclusiveCollection;S.floors=keepCards.floors;S.highestUpgrade=keepCards.highestUpgrade;S.shinyMilestones=keepCards.shinyMilestones;
    normalizeFloorUniqueCards();
    raiseScore(1000+S.totalRebirths*150);awardMainXp(15,"BigCards.kl Rebirth",`bc-rebirth-${S.totalRebirths}`);persist();refresh();toast(`Rebirth ${S.totalRebirths} abgeschlossen · Points: 0 · alle Karten behalten · vorher x${beforeMult}`);
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
  function toggleAuto(){if((S.autoOpenerUntil||0)<=now())return toast("Auto-Opener-Zeit fehlt. Im JK-Coin-Shop erhältlich.");S.autoEnabled=!S.autoEnabled;persist();refresh();}

  function tick(){if(!S)return;const t=performance.now(),dt=Math.min(2,(t-lastTick)/1000);lastTick=t;if(!UI.overlay)return;updateFeaturedEarnings(now());const stepReset=syncCollectorPointStep(),act=activeInstances(),autoCollect=(S.autoCollectorUntil||0)>now();let usableDt=dt;if(act.length){if(autoCollect){S.fieldStoredSeconds=0;}else{usableDt=Math.min(dt,fieldStorageRemainingSeconds());S.fieldStoredSeconds=Math.min(fieldStorageSecondsLimit(),Math.max(0,Number(S.fieldStoredSeconds)||0)+usableDt);}}let pending=0,direct=0,xp=0;for(const inst of act){const p=effectivePoints(inst)*usableDt;if(autoCollect||inst.shiny>=3)direct+=p;else pending+=p;xp+=effectiveXp(inst)*usableDt}if(direct){S.points+=direct;S.lifetimePointsEarned+=direct}S.pendingPoints+=pending;if(xp)addXp(xp);updateScoreHighWater();S.lastSeen=now();if(t-UI.lastHeader>700){UI.lastHeader=t;refreshHeader();refreshFieldLive();refreshFeaturedLive();if(UI.tab==="battle"){const btn=UI.overlay.querySelector("[data-bc-battle-start]"),left=Math.max(0,Math.ceil(((S.battleCooldownUntil||0)-now())/1000));if(btn){btn.disabled=left>0;btn.textContent=left?`Nächster Kampf in ${left}s`:"⚔ Kampf starten";}}}if(stepReset||Math.random()<.06)persist();}
  function autoTick(){if(!UI.overlay||!S.autoEnabled||(S.autoOpenerUntil||0)<=now())return;const ri=RARITY_INDEX[S.autoPack]??0,r=RARITIES[ri];if(ri<=rarityUnlockedIndex()&&S.points>=r.price&&!UI.packReveal)openNormalPack(ri,"points");}
  function applyOffline(){updateFeaturedEarnings(now());const tNow=now(),delta=Math.min(MAX_OFFLINE_MS,Math.max(0,tNow-(S.lastSeen||tNow)));if(delta<30000)return;const rate=productionPerSecond(),totalSec=delta/1000,start=tNow-delta,autoSec=Math.max(0,Math.min(totalSec,((Number(S.autoCollectorUntil)||0)-start)/1000)),normalSec=Math.max(0,totalSec-autoSec),storedSec=Math.min(normalSec,fieldStorageRemainingSeconds()),directGain=rate*autoSec*OFFLINE_RATE,pendingGain=rate*storedSec*OFFLINE_RATE,gain=directGain+pendingGain;if(directGain>0){S.points+=directGain;S.lifetimePointsEarned+=directGain}if(pendingGain>0)S.pendingPoints+=pendingGain;S.fieldStoredSeconds=Math.min(fieldStorageSecondsLimit(),Math.max(0,Number(S.fieldStoredSeconds)||0)+storedSec);if(gain>0)setTimeout(()=>toast(`Offline-Ertrag: +${fmt(gain)} Points (${Math.round(OFFLINE_RATE*100)} %)${normalSec>storedSec+.1?" · Spielfeld-Limit erreicht":""}`,5000),400);S.lastSeen=tNow;persist();}

  function battleCards(includeBroken=true){return Object.values(S.instances).filter(x=>x&&!x.listed&&(includeBroken||!x.broken)).sort((a,b)=>{const au=battleCardUnlocked(a),bu=battleCardUnlocked(b),as=combatStats(a),bs=combatStats(b);if(au!==bu)return au?-1:1;if(!!a.broken!==!!b.broken)return a.broken?1:-1;if(au)return bs.tier-as.tier||bs.power-as.power||b.level-a.level;return as.tier-bs.tier||bs.power-as.power||b.level-a.level;});}
  function ensureBattleCard(){const current=instance(UI.battleCard);if(current&&!current.listed&&!current.broken&&battleCardUnlocked(current))return current;const first=battleCards(false).find(battleCardUnlocked)||null;UI.battleCard=first?.id||null;return first;}
  function showBattlePicker(){const cards=battleCards(true).slice(0,200),maxTier=battleUnlockedTier();showModal(`<div class="bc-battle-picker"><small>DEINE KARTEN</small><h2>Kampfkarte wählen</h2><p>Aktuell freigeschaltet bis <b>${RARITIES[maxTier].name}</b>. Höhere normale Karten werden über die Kartenkampf-Stufe freigeschaltet. <b>Exclusive-Karten sind immer sofort nutzbar</b>, weil ihr Kampfwert mit deinem Account mitskaliert.</p><div class="bc-battle-picker-grid">${cards.length?cards.map(inst=>{const m=cardMeta(inst),profile=combatAbilityProfile(inst),specials=profile.specials.filter(x=>inst.level>=(x.req||1)).length,locked=!battleCardUnlocked(inst),disabled=inst.broken||locked;return `<button data-bc-battle-pick="${inst.id}" class="${m.className} ${inst.broken?"broken":""} ${locked?"battle-locked":""}" ${disabled?"disabled":""}><span>${m.icon}</span><b>${esc(m.name)}</b><small>${inst.exclusive?`EXCLUSIVE · Kampfstufe ${battleTierLabel(inst)}`:m.rarity.name} · Lv ${inst.level}/5 · Rank ${cardRank(inst)}/10${inst.id===S.featuredCardId?" · ★ Persönliche Karte":""}</small><small>⚔ ${fmt(m.combat.power)} · ${fmt(m.combat.min)}–${fmt(m.combat.max)} Schaden · ${specials} Special${specials===1?"":"s"}${inst.battlePotion?` · 🧪 ${preparedPotionMeta(inst)?.name||"Trank"}`:""}</small>${locked?`<em>🔒 Kartenkampf erst bis ${RARITIES[maxTier].name} freigeschaltet</em>`:inst.broken?`<em>💥 KAPUTT · in Sammlung reparieren</em>`:""}</button>`}).join(""):`<div class="bc-empty-state"><span>🃏</span><h3>Noch keine Karte vorhanden</h3></div>`}</div></div>`);}
  function upgradeBattleTier(){
    if(UI.battleSession)return toast("Während eines laufenden Kampfes kann die Kartenkampf-Stufe nicht erhöht werden.");
    const info=battleUpgradeInfo();if(info.max||!info.next)return toast("Alle Kartenkampf-Raritäten sind bereits freigeschaltet.");
    if(info.wins<info.next.wins)return toast(`Noch ${info.next.wins-info.wins} Sieg${info.next.wins-info.wins===1?"":"e"} mit ${RARITIES[info.current].name}-Karten oder Exclusive nötig.`);
    if(S.points<info.next.cost)return toast(`${fmt(info.next.cost)} Points für das Kartenkampf-Upgrade auf ${RARITIES[info.next.unlock].name} benötigt.`);
    S.points-=info.next.cost;S.battleUpgradeSpent=(S.battleUpgradeSpent||0)+info.next.cost;S.battleTierUnlocked=info.next.unlock;S.battleTierWins=0;UI.battleCard=null;persist();refresh(false);toast(`Kartenkampf verbessert: ${RARITIES[info.next.unlock].name}-Karten sind jetzt freigeschaltet!`,4200);
  }
  function makeBattleEnemy(player){
    const ps=combatStats(player),roll=Math.random();
    let shift=0;if(roll<.08)shift=2;else if(roll<.27)shift=1;else if(roll>.90)shift=-2;else if(roll>.72)shift=-1;
    const tier=clamp(ps.tier+shift,0,RARITIES.length-1),base=Math.floor(Math.random()*BASE_NAMES.length);
    const levelShift=Math.random()<.18?1:(Math.random()<.12?-1:0),level=clamp((player.level||1)+levelShift,1,5),shiny=Math.random()<.07?1:0;
    return {id:"enemy-"+uid(),rarity:tier,base,level,aura:null,combatAura:null,bind:null,shiny,broken:false,exclusive:false,basePower:null,difficultyShift:shift};
  }
  function battleBackupForSession(session=UI.battleSession){if(!session?.backupPlayerId)return null;const main=instance(session.primaryPlayerId),backup=instance(session.backupPlayerId);return main&&backup&&backupCardEligible(main,backup)&&!backup.broken&&!backup.listed?backup:null;}
  function deployBattleBackup(reason="manual"){
    const session=UI.battleSession;if(!session||session.activeRole==="backup")return false;const main=instance(session.primaryPlayerId),backup=battleBackupForSession(session);if(!main||!backup)return false;
    session.primaryRemainingHp=Math.max(0,Number(session.playerHp)||0);session.primaryMaxHp=Math.max(1,Number(session.playerMaxHp)||1);session.primaryState=session.playerState;session.activeRole="backup";session.playerId=backup.id;const bs=combatStats(backup);session.playerHp=bs.hp;session.playerMaxHp=bs.hp;session.playerState=battleActorState();session.playerPotion=null;session.backupUsed=true;session.lastHit=null;session.turn="player";session.log.push(reason==="ko"?`🛡 Hauptkarte K.O. – ${cardMeta(backup).name} übernimmt als Backup.`:reason==="emergency"?`🛡 Notfallwechsel bei ≤15 % Leben – ${cardMeta(backup).name} übernimmt.`:`🛡 Du wechselst auf ${cardMeta(backup).name}.`);session.log=session.log.slice(-12);refresh(true);return true;
  }
  function manualBattleBackupSwitch(){const session=UI.battleSession;if(!session||session.turn!=="player")return toast("Du kannst nur in deinem Zug auf die Backup-Karte wechseln.");if(session.activeRole==="backup")return toast("Die Backup-Karte ist bereits aktiv.");if(!battleBackupForSession(session))return toast("Keine einsatzbereite Backup-Karte vorhanden.");deployBattleBackup("manual");}

  function startBattle(){
    const player=ensureBattleCard();
    if(!player)return toast("Du brauchst zuerst mindestens eine Karte für den Kartenkampf.");
    if(player.broken)return toast("Diese Karte ist kaputt. Repariere sie zuerst in der Sammlung.");
    if(!battleCardUnlocked(player))return toast(`${battleTierLabel(player)}-Karten sind im Kartenkampf noch gesperrt. Verbessere zuerst deine Kartenkampf-Stufe.`);
    if(UI.battleSession)return toast("Der Kampf läuft bereits.");
    if((S.battleCooldownUntil||0)>now())return toast(`Nächster Kampf in ${Math.ceil((S.battleCooldownUntil-now())/1000)} Sek.`);
    const enemy=makeBattleEnemy(player),ps=combatStats(player),es=combatStats(enemy),pm=cardMeta(player),em=cardMeta(enemy),prepared=preparedPotionMeta(player),configuredBackup=player.id===S.featuredCardId?usableFeaturedBackup(player):null;
    const potionBoost=rankPotionBonus(player),activePotion=prepared?(()=>{const effect=prepared.effect*(1+potionBoost);return {...prepared,effect,effectText:potionEffectValueText(prepared.typeId,effect),lifePct:prepared.typeId==="life"?effect:0,damagePct:prepared.typeId==="power"?effect:0,guardPct:prepared.typeId==="guard"?effect:0,rankBoost:potionBoost};})():null;
    if(prepared)player.battlePotion=null;
    const playerMaxHp=Math.max(1,Math.round(ps.hp*(1+(activePotion?.lifePct||0))));
    UI.battleResult=null;
    UI.battleSession={id:uid(),primaryPlayerId:player.id,playerId:player.id,backupPlayerId:configuredBackup?.id||null,activeRole:"primary",backupUsed:false,primaryFallen:false,primaryRemainingHp:playerMaxHp,primaryMaxHp:playerMaxHp,enemy,playerHp:playerMaxHp,playerMaxHp,enemyHp:es.hp,playerState:battleActorState(),enemyState:battleActorState(),playerPotion:activePotion,usedPotion:activePotion,lastHit:null,turn:"player",round:1,log:[`Gegner aufgedeckt: ${em.name} · ${RARITIES[enemy.rarity]?.name||"Karte"} · Lv ${enemy.level}.${activePotion?` ${activePotion.icon} ${activePotion.name} aktiviert (${activePotion.effectText}).`:""}${configuredBackup?` Backup bereit: ${cardMeta(configuredBackup).name}.`:""}`],startedAt:now()};
    persist();refresh(true);
    toast(enemy.difficultyShift>0?"Achtung: Dieser Gegner ist stärker als deine aktuelle Kampfstufe.":enemy.difficultyShift<0?"Dieser Gegner ist etwas schwächer.":"Gegner aufgedeckt – du beginnst.",3000);
  }
  function performPlayerBattleAction(abilityId){
    const session=UI.battleSession;if(!session||session.turn!=="player")return;
    const player=instance(session.playerId);if(!player||player.broken){UI.battleSession=null;return refresh(false)}
    const abilities=combatAbilities(player,session.playerState),ability=abilities.find(x=>x.id===abilityId);if(!ability||ability.locked)return toast("Diese Fähigkeit ist gerade nicht verfügbar.");
    if(!ability.normal&&player.level<(ability.req||1))return toast(`Diese Fähigkeit wird erst auf Kartenstufe ${ability.req} freigeschaltet.`);
    const pm=cardMeta(player),dmg=abilityDamage(player,pm.combat,ability,1+(session.playerPotion?.damagePct||0));session.enemyHp=Math.max(0,session.enemyHp-dmg);session.lastHit={target:"enemy",damage:dmg,icon:ability.icon,name:ability.name,at:now()};applyAbilityUse(player,session.playerState,ability);session.log.push(`Du: ${ability.icon} ${ability.name} → ${fmt(dmg)} Schaden.`);session.log=session.log.slice(-12);
    if(session.enemyHp<=0)return finishBattle(true);
    session.turn="enemy";refresh(true);clearTimeout(UI.battleEnemyTimer);const sid=session.id;UI.battleEnemyTimer=setTimeout(()=>enemyBattleTurn(sid),760);
  }
  function enemyBattleTurn(sessionId){
    const session=UI.battleSession;if(!session||session.id!==sessionId||session.turn!=="enemy")return;
    const player=instance(session.playerId),enemy=session.enemy;if(!player||!enemy)return;
    const choices=combatAbilities(enemy,session.enemyState),specials=choices.filter(x=>!x.normal&&!x.locked&&enemy.level>=(x.req||1));
    let ability=choices[0];if(specials.length&&Math.random()<Math.min(.82,.52+enemy.rarity*.025))ability=specials[Math.floor(Math.random()*specials.length)];
    const em=cardMeta(enemy),rawDmg=abilityDamage(enemy,em.combat,ability),rankGuard=rankDamageReduction(player),dmg=Math.max(1,Math.round(rawDmg*(1-(session.playerPotion?.guardPct||0))*(1-rankGuard)));session.playerHp=Math.max(0,session.playerHp-dmg);session.lastHit={target:"player",damage:dmg,icon:ability.icon,name:ability.name,at:now()};applyAbilityUse(enemy,session.enemyState,ability);session.log.push(`Gegner: ${ability.icon} ${ability.name} → ${fmt(dmg)} Schaden${session.playerPotion?.guardPct?` (Schutz-Trank aktiv)`:""}${rankGuard?` (Rank-Schutz ${Math.round(rankGuard*100)} %)`:""}.`);session.log=session.log.slice(-12);
    if(session.playerHp<=0){
      if(session.activeRole==="primary"&&battleBackupForSession(session)){player.broken=true;player.brokenAt=now();session.primaryFallen=true;session.round++;if(deployBattleBackup("ko")){persist();toast("💥 Hauptkarte K.O. – Backup-Karte übernimmt!",3200);return;}}
      return finishBattle(false);
    }
    if(session.activeRole==="primary"&&battleBackupForSession(session)&&session.playerHp/session.playerMaxHp<=.15){session.round++;if(deployBattleBackup("emergency")){toast("🛡 Notfallwechsel – Backup-Karte übernimmt bei niedrigem Leben.",3200);return;}}
    session.round++;session.turn="player";refresh(true);
  }
  function finishBattle(won){
    const session=UI.battleSession;if(!session)return;clearTimeout(UI.battleEnemyTimer);UI.battleEnemyTimer=0;
    const player=instance(session.playerId),primary=instance(session.primaryPlayerId||session.playerId),backup=instance(session.backupPlayerId),enemy=session.enemy,pm=player?cardMeta(player):null,primaryMeta=primary?cardMeta(primary):null,em=cardMeta(enemy),es=em.combat;
    const rankSource=primary&&primary.id===S.featuredCardId?primary:player,rewardMult=won?rankBattleRewardMultiplier(rankSource):1,baseRewardPoints=Math.max(75,Math.round((es.tier+1)*70*(primary?.level||player?.level||1))),baseRewardShards=Math.max(1,1+Math.floor(es.tier/3)),rewardPoints=won?Math.round(baseRewardPoints*rewardMult):0,rewardShards=won?Math.max(1,Math.round(baseRewardShards*rewardMult)):0,firstWin=won&&(S.battleWins||0)===0;
    let rankMasteryEarned=0,rankEliteEarned=false,rankMasteryNow=rankSource?cardRankMastery(rankSource):0,rankEliteNow=rankSource?cardRankEliteWins(rankSource):0,rankNext=rankSource?nextRankMeta(rankSource):null;
    if(won){
      S.battleWins=(S.battleWins||0)+1;S.battleStreak=(S.battleStreak||0)+1;S.battleBestStreak=Math.max(S.battleBestStreak||0,S.battleStreak);S.points+=rewardPoints;S.shards+=rewardShards;addXp(16+(es.tier+1)*4);raiseScore(55+(es.tier+1)*22);
      if(firstWin){S.combatAuraInventory.basic=(S.combatAuraInventory.basic||0)+1;S.equipmentRewards[equipmentRewardKey("combatAura","basic")]=true;}
      const progressTier=battleUnlockedTier();if(progressTier<RARITIES.length-1&&primary&&(primary.exclusive||combatTier(primary)===progressTier))S.battleTierWins=(S.battleTierWins||0)+1;
      if(rankSource&&rankSource.id===S.featuredCardId&&cardRank(rankSource)<FEATURED_RANK_MAX){
        rankMasteryEarned=rankMasteryGain(enemy);rankSource.rankMastery=cardRankMastery(rankSource)+rankMasteryEarned;rankMasteryNow=rankSource.rankMastery;
        if(Number(enemy?.difficultyShift)>0){rankSource.rankEliteWins=cardRankEliteWins(rankSource)+1;rankEliteEarned=true;}rankEliteNow=cardRankEliteWins(rankSource);rankNext=nextRankMeta(rankSource);
        session.log.push(`Meisterschaft: +${fmt(rankMasteryEarned)} MP${rankEliteEarned?" · +1 Elite-Sieg":""}${rankNext?` · Rank ${rankNext.rank}: ${fmt(rankMasteryNow)}/${fmt(rankNext.mastery)} MP${rankNext.elite?` · Elite ${fmt(rankEliteNow)}/${fmt(rankNext.elite)}`:""}`:""}.`);
      }
    }else{
      S.battleLosses=(S.battleLosses||0)+1;S.battleStreak=0;addXp(5+(es.tier+1));if(player){player.broken=true;player.brokenAt=now();}
    }
    S.battleCooldownUntil=now()+2200;
    const brokenIds=[];if(primary?.broken)brokenIds.push(primary.id);if(backup?.broken&&!brokenIds.includes(backup.id))brokenIds.push(backup.id);
    UI.battleResult={won,round:session.round,playerId:player?.id||null,primaryId:primary?.id||null,backupId:backup?.id||null,backupUsed:!!session.backupUsed,primaryFallen:!!session.primaryFallen,brokenIds,playerBroken:!won&&!!player,player:{name:pm?.name||"Karte",icon:pm?.icon||"🃏",className:pm?.className||"",hp:session.playerHp,maxHp:session.playerMaxHp||pm?.combat.hp||0,power:pm?.combat.power||0,min:pm?.combat.min||0,max:pm?.combat.max||0},primary:primaryMeta?{name:primaryMeta.name,icon:primaryMeta.icon,className:primaryMeta.className,broken:!!primary.broken}:null,enemy:{name:em.name,icon:em.icon,className:em.className,hp:session.enemyHp,maxHp:es.hp,power:es.power,min:es.min,max:es.max,level:enemy.level},rewardPoints,rewardShards,firstWin,potion:session.usedPotion||null,rankMasteryEarned,rankEliteEarned,rankMasteryNow,rankEliteNow,rankNextRank:rankNext?.rank||null,rankNextMastery:rankNext?.mastery||null,rankNextElite:rankNext?.elite||0,log:session.log.slice(-12)};
    UI.battleSession=null;persist();refresh(true);
    const rankToast=rankMasteryEarned&&rankNext?` · Meisterschaft +${fmt(rankMasteryEarned)} MP${rankEliteEarned?" + Elite-Sieg":""}`:"",backupToast=session.backupUsed?" · Backup eingesetzt":"";
    toast(won?`Sieg! +${fmt(rewardPoints)} Points · +${rewardShards} Shards${firstWin?" · Basic Kampf Aura erhalten!":""}${backupToast}${rankToast}`:session.backupUsed?"Niederlage – auch deine Backup-Karte ist gefallen und muss repariert werden.":"Niederlage – deine Kampfkarte ist zerbrochen und muss in der Sammlung repariert werden.",5200);
  }
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
    const normal=REPAIR_KITS.filter(k=>!k.exclusive),exclusive=repairKitMeta("exclusive");
    showModal(`<div class="bc-repair-shop"><small>KARTENWERKSTATT</small><h2>Reparatur-Kits</h2><p>Eine zerbrochene Karte braucht <b>1 passendes Reparatur-Kit + Points</b>. Das Kit wird bei der Reparatur verbraucht. Normale Karten benötigen exakt das Kit ihrer Rarität.</p><div class="bc-repair-kit-grid">${normal.map(k=>`<article class="rar-${k.id}"><span>${k.icon}</span><div><b>${k.name}</b><small>Für ${RARITIES[RARITY_INDEX[k.id]]?.name||k.id}-Karten</small><em>Inventar ×${repairKitCount(k.id)}</em></div><button data-bc-buy-repair-kit="${k.id}">${fmt(repairKitPrice(k.id))} Points</button></article>`).join("")}</div><article class="bc-exclusive-repair-kit rar-exclusive"><span>${exclusive.icon}</span><div><b>${exclusive.name}</b><small>Nur für Exclusive-Karten · Preis skaliert mit deinem aktuellen BigCards-Kampfbereich (${RARITIES[exclusiveCombatTier()]?.name||"Gewöhnlich"}).</small><em>Inventar ×${repairKitCount("exclusive")}</em></div><button data-bc-buy-repair-kit="exclusive">${fmt(repairKitPrice("exclusive"))} Points</button></article><div class="bc-repair-explain"><b>So reparierst du:</b><span>Sammlung → kaputte Karte anklicken → „Karte reparieren“. Dort siehst du Kit, Inventarbestand und die zusätzlichen Point-Kosten.</span></div></div>`);
  }
  function openBattleRepair(id){const inst=instance(id);if(!inst)return;rememberViewScroll();UI.tab="collection";UI.collectionTier=inst.exclusive?13:inst.rarity;UI.collectionPage=inst.exclusive?0:Math.floor((inst.base||0)/48);UI.collectionSearch="";refresh(false);setTimeout(()=>showCardDetail(id),0);}
  function navItems(){const items=[["field","Spielfeld"],["packs","Packs"],["collection","Sammlung"],["shop","Shop"],["market","Markt"],["score","Beste Spieler"],["battle","Kartenkampf"],["card","Karte"]];if(UI.role==="owner")items.push(["mod","Mod"]);return items;}
  function renderNav(){const nav=UI.overlay?.querySelector("[data-bc-nav]");if(!nav)return;nav.classList.toggle("owner-nav",UI.role==="owner");nav.classList.toggle("player-nav",UI.role!=="owner");nav.innerHTML=navItems().map(([id,label])=>`<button data-bc-tab="${id}" class="${UI.tab===id?"active":""}">${label}</button>`).join("");}
  function renderShell(){return `<div class="bc-shell"><header class="bc-header"><div class="bc-brand"><button class="bc-back" data-bc-close>←</button><div><small>JK.GAMES · TOP GAME</small><h1>BigCards<span>.kl</span></h1></div></div><div class="bc-head-stats" data-bc-head-stats></div></header><nav class="bc-nav" data-bc-nav></nav><main class="bc-main" data-bc-main></main><div class="bc-toast" data-bc-toast></div></div>`}
  function refreshHeader(){const el=UI.overlay?.querySelector("[data-bc-head-stats]");if(!el)return;const need=xpNeed(S.level),prod=productionPerSecond();el.innerHTML=`<div><small>POINTS</small><b>${fmt(S.points)}</b></div><div><small>PRODUKTION</small><b>+${fmt(prod)}/s</b></div><div><small>LEVEL</small><b>${S.level}</b><em>${Math.floor(S.xp)}/${fmt(need)} XP</em></div><div><small>REBIRTH</small><b>${S.totalRebirths} · x${fmt(rebirthMultiplier())}</b></div><div><small>SAMMLUNG</small><b>${scorePct(overallCollectionScore())}</b></div>`}
  function refreshFieldLive(){if(UI.tab!=="field"||!UI.overlay)return;const collected=UI.overlay.querySelector("[data-bc-collect] b"),cap=UI.overlay.querySelector("[data-bc-field-cap]");if(collected)collected.textContent=fmt(S.pendingPoints);if(cap)cap.textContent=fieldStorageLabel();const auto=UI.overlay.querySelector(".bc-auto");if(!auto)return;const timer=auto.querySelector(":scope > b"),button=auto.querySelector("[data-bc-buy-collector]"),remaining=collectorRemainingMinutes();if(timer)timer.textContent=timeLeft(S.autoCollectorUntil);if(button){button.disabled=remaining>=15;button.textContent=remaining>=15?"Point-Verlängerung bei < 15 Min Restzeit":`${fmt(collectorPointPrice())} Points = +1 Min`;}}
  function refreshFeaturedLive(){if(UI.tab!=="card"||!UI.overlay)return;updateFeaturedEarnings(now());const p=UI.overlay.querySelector("[data-bc-feature-pending]"),x=UI.overlay.querySelector("[data-bc-feature-xp]"),pr=UI.overlay.querySelector("[data-bc-feature-rate]"),xr=UI.overlay.querySelector("[data-bc-feature-xp-rate]"),pm=UI.overlay.querySelector("[data-bc-feature-point-meter]"),xm=UI.overlay.querySelector("[data-bc-feature-xp-meter]"),lim=featuredStorageMeta();if(p)p.textContent=fmt(S.featuredPendingPoints);if(x)x.textContent=fmt(S.featuredPendingXp);if(pm)pm.style.width=`${Math.min(100,(Number(S.featuredPendingPoints)||0)/lim.points*100)}%`;if(xm)xm.style.width=`${Math.min(100,(Number(S.featuredPendingXp)||0)/lim.xp*100)}%`;const inst=featuredCard();if(pr)pr.textContent=`+${fmt(featurePointRate(inst))}/s`;if(xr)xr.textContent=`+${fmt(featureXpRate(inst))}/s`;}
  function rememberViewScroll(){if(!UI.overlay)return;const main=UI.main||UI.overlay.querySelector("[data-bc-main]");if(main)UI.mainScroll[UI.tab]=Math.max(0,main.scrollTop||0);const rarity=UI.overlay.querySelector("[data-bc-rarity-tabs]");if(rarity)UI.rarityScroll=Math.max(0,rarity.scrollLeft||0);}
  function restoreViewScroll(preserve=true){requestAnimationFrame(()=>{if(!UI.overlay)return;const main=UI.main||UI.overlay.querySelector("[data-bc-main]");if(main)main.scrollTop=preserve?Math.min(Math.max(0,Number(UI.mainScroll[UI.tab])||0),Math.max(0,main.scrollHeight-main.clientHeight)):0;const rarity=UI.overlay.querySelector("[data-bc-rarity-tabs]");if(rarity){const max=Math.max(0,rarity.scrollWidth-rarity.clientWidth);rarity.scrollLeft=Math.min(Math.max(0,Number(UI.rarityScroll)||0),max);}});}
  function refresh(preserve=true){if(!UI.overlay)return;if(preserve)rememberViewScroll();refreshHeader();renderNav();renderMain();restoreViewScroll(preserve);}
  function renderMain(){const el=UI.main||UI.overlay?.querySelector("[data-bc-main]");if(!el)return;UI.main=el;if(UI.tab==="mod"&&UI.role!=="owner")UI.tab="field";if(UI.tab==="field")el.innerHTML=fieldHtml();else if(UI.tab==="packs")el.innerHTML=packsHtml();else if(UI.tab==="collection")el.innerHTML=collectionHtml();else if(UI.tab==="shop")el.innerHTML=shopHtml();else if(UI.tab==="market")el.innerHTML=marketHtml();else if(UI.tab==="score")el.innerHTML=scoreHtml();else if(UI.tab==="battle")el.innerHTML=battleHtml();else if(UI.tab==="card")el.innerHTML=featureCardHtml();else if(UI.tab==="mod"&&UI.role==="owner")el.innerHTML=modHtml();else el.innerHTML=fieldHtml();}
  function fieldHtml(){const floor=UI.floor,max=floorMaxTier(floor),phase=FLOOR_PHASES[floor];const slots=S.floors[floor]||[];return `<section class="bc-atlas"><div class="bc-atlas-toolbar"><div><small>AKTIVES STOCKWERK</small><div class="bc-floor-tabs">${Array.from({length:4},(_,i)=>`<button data-bc-floor="${i}" class="${floor===i?"active":""}" ${i>=S.unlockedFloors?"disabled":""}>${i+1}</button>`).join("")}</div></div><div><small>FREIGESCHALTET BIS</small><b>${RARITIES[max]?.symbol||"🔒"} ${RARITIES[max]?.name||"Gesperrt"}</b></div><div class="bc-field-actions"><button data-bc-smart>⚡ Bestes Setup</button><small>💡 Karte gedrückt halten und auf einen anderen Platz ziehen</small></div></div><div class="bc-map-stage"><div class="bc-map-deco bc-citadel"><span>🏰</span><b>${phase?.name||"Stockwerk"}</b><small>Stockwerk ${floor+1}</small></div><div class="bc-map-path"></div><div class="bc-slot-column left">${slots.slice(0,5).map((id,i)=>slotHtml(id,i)).join("")}</div><div class="bc-slot-column right">${slots.slice(5,10).map((id,i)=>slotHtml(id,i+5)).join("")}</div><button class="bc-collector" data-bc-collect><small>GESAMMELT</small><b>${fmt(S.pendingPoints)}</b><span>Einsammeln</span><em data-bc-field-cap>${fieldStorageLabel()}</em></button></div><div class="bc-field-bottom"><div class="bc-level-panel"><small>BIGCARDS LEVEL</small><b>Level ${S.level}</b><div><i style="width:${Math.min(100,S.xp/xpNeed(S.level)*100)}%"></i></div><span>${fmt(S.xp)} / ${fmt(xpNeed(S.level))} XP</span><em class="bc-field-storage-note">AFK-Speicher: ${Math.round(fieldStorageMinutes())} Min · wächst pro Level, Stockwerk und Rebirth</em></div><button class="bc-rebirth ${S.level>=100?"ready":"locked"}" data-bc-rebirth><small>${S.level>=100?"BEREIT":"🔒 GESPERRT BIS LEVEL 100"}</small><b>REBIRTH</b><span>Level ${S.level} / 100 · x${fmt(rebirthMultiplier())}</span></button><div class="bc-auto"><small>AUTO-COLLECTOR</small><b>${timeLeft(S.autoCollectorUntil)}</b><button data-bc-buy-collector ${collectorRemainingMinutes()>=15?"disabled":""}>${collectorRemainingMinutes()>=15?"Point-Verlängerung bei < 15 Min Restzeit":`${fmt(collectorPointPrice())} Points = +1 Min`}</button><em>Startet nach vollständigem Ablauf wieder günstig. Jede zusätzlich vorgemerkte Point-Minute wird deutlich teurer.</em></div></div><section class="bc-daily"><h3>Daily Card Quests</h3>${dailyQuestHtml()}</section></section>`}
  function slotHtml(id,slot){const inst=instance(id);if(!inst)return `<button class="bc-slot empty" data-bc-slot="${slot}"><span>+</span><b>Kartenplatz ${slot+1}</b><small>Karte einsetzen</small></button>`;const m=cardMeta(inst);return `<button class="bc-slot filled ${m.className} shiny-${inst.shiny} ${inst.broken?"broken":""}" data-bc-card="${id}" data-bc-slot="${slot}"><div class="bc-slot-art">${m.icon}${cardEffectBadges(inst)}${inst.broken?'<span class="bc-card-crack" aria-hidden="true"></span>':""}</div><small>${inst.exclusive?"EXCLUSIVE":m.rarity.name} · ${pct(m.rarityValue)}</small><b>${esc(m.name)}</b><span>★${inst.level} · ${fmt(m.points)}/s · ⚔ ${fmt(m.combat.power)}</span><em>${inst.broken?"💥":""}${inst.aura?"✦":""}${inst.combatAura?"⚔":""}${inst.bind?"🔗":""}${inst.shiny?"⚡"+inst.shiny:""}</em></button>`}
  function packsHtml(){const unlocked=rarityUnlockedIndex();return `<section class="bc-section"><div class="bc-section-title"><div><small>PACK DISTRICT</small><h2>Kartenpacks</h2><p>Jede normale Box enthält 10 getrennte Ziehungen. Duplikate sind möglich.</p></div><div class="bc-auto-opener"><small>AUTO-OPENER</small><b>${timeLeft(S.autoOpenerUntil)}</b><select data-bc-auto-pack>${RARITIES.map(r=>`<option value="${r.id}" ${S.autoPack===r.id?"selected":""}>${r.name}</option>`).join("")}</select><button data-bc-toggle-auto class="${S.autoEnabled?"active":""}">${S.autoEnabled?"Stoppen":"Starten"}</button></div></div><div class="bc-pack-grid">${RARITIES.map((r,i)=>`<article class="bc-pack-card rar-${r.id} ${i>unlocked?"locked":""}"><div class="bc-pack-badge">${r.symbol}</div><small>${i>unlocked?`🔒 REGULÄR NOCH GESPERRT`:"POINT PACK"}</small><h3>${r.name}</h3><p>10 Karten · breiter Drop-Pool</p><b>${fmt(r.price)} Points</b><div><button data-bc-open-pack="${i}" data-currency="points" ${i>unlocked?"disabled":""}>Mit Points</button><button data-bc-open-pack="${i}" data-currency="jk">${r.jk} JK/Coin</button>${(S.jkPackCredits[r.id]||0)>0?`<button data-bc-open-pack="${i}" data-currency="credit">Credit ×${S.jkPackCredits[r.id]}</button>`:""}</div></article>`).join("")}<article class="bc-pack-card exclusive"><div class="bc-pack-badge">🩸</div><small>5 KARTEN · NUR JK/COIN</small><h3>EXCLUSIVE PACK</h3><p>10 Vampir-/Blutkarten im eigenen Pool. The Blood Sovereign: 0,1 %.</p><b>500 JK/Coin</b><div><button data-bc-exclusive="jk">Öffnen</button>${S.exclusiveCredits?`<button data-bc-exclusive="credit">Credit ×${S.exclusiveCredits}</button>`:""}</div></article></div></section>`}
  function collectionHtml(){
    const tier=UI.collectionTier,exclusive=tier===13,search=UI.collectionSearch.trim().toLowerCase(),ownedByKey=new Map();
    for(const inst of Object.values(S.instances)){
      if(exclusive?!inst.exclusive:inst.exclusive||inst.rarity!==tier)continue;
      const key=collectionKey(inst),arr=ownedByKey.get(key)||[];arr.push(inst);ownedByKey.set(key,arr);
    }
    let entries=exclusive?EXCLUSIVES.map((ex,i)=>({key:`x:${ex.id}`,name:ex.name,base:i,exclusive:true,rarityValue:ex.rarityValue})):
      BASE_NAMES.map((name,base)=>({key:variantKey(tier,base),name,base,exclusive:false,rarityValue:rarityValue(base)}));
    if(search)entries=entries.filter(e=>e.name.toLowerCase().includes(search));
    const per=48,pages=Math.max(1,Math.ceil(entries.length/per)),page=Math.min(UI.collectionPage,pages-1),slice=entries.slice(page*per,page*per+per),discovered=exclusive?exclusiveCount():Object.keys(S.collection).filter(k=>k.startsWith(`${tier}:`)).length;
    const totalScore=overallCollectionScore(),complete=collectionComplete();
    return `<section class="bc-section bc-collection"><div class="bc-section-title bc-collection-title"><div><small>MUSEUM & INVENTAR</small><h2>Sammlungsalbum</h2><p>${collectionCount()} / ${RARITIES.length*BASE_NAMES.length} normal · ${exclusiveCount()} / ${EXCLUSIVES.length} Exclusive</p></div><div class="bc-total-collection-score ${complete?"complete":""}"><small>GESAMTER SCORE</small><strong>${scorePct(totalScore)}</strong><em>${complete?"✓ SPIEL DURCHGESPIELT":"Alle Karten auf Stufe 5 = 100 %"}</em></div></div><div class="bc-collection-search-row"><input data-bc-collection-search placeholder="Karte suchen …" value="${esc(UI.collectionSearch)}"></div><div class="bc-rarity-tabs" data-bc-rarity-tabs>${RARITIES.map((r,i)=>`<div class="bc-rarity-score-item"><span>${scorePct(collectionTierScore(i))}</span><button class="rar-${r.id} ${tier===i?"active":""}" data-bc-tier="${i}">${r.name}</button></div>`).join("")}<div class="bc-rarity-score-item exclusive-score"><span>${scorePct(collectionTierScore(13))}</span><button class="exclusive ${exclusive?"active":""}" data-bc-tier="13">Exclusive</button></div></div><div class="bc-album-progress"><b>${exclusive?`${discovered}/${EXCLUSIVES.length}`:`${discovered}/${BASE_NAMES.length}`} entdeckt · Score ${scorePct(collectionTierScore(tier))}</b><div><i style="width:${Math.min(100,collectionTierScore(tier))}%"></i></div></div><div class="bc-card-grid">${slice.map(entry=>albumCardHtml(entry,ownedByKey.get(entry.key)||[],tier)).join("")||`<div class="bc-empty-state"><span>🔎</span><h3>Keine Treffer</h3></div>`}</div><div class="bc-pagination"><button data-bc-page="${page-1}" ${page<=0?"disabled":""}>←</button><div class="bc-page-jump ${UI.collectionPageMenu?"open":""}"><button class="bc-page-current" data-bc-page-menu title="Seite auswählen">${page+1}</button><span>/</span><button class="bc-page-max" data-bc-page="${pages-1}" title="Zur letzten Seite">${pages}</button>${UI.collectionPageMenu?`<div class="bc-page-popup">${Array.from({length:pages},(_,i)=>`<button data-bc-page-choice="${i}" class="${i===page?"active":""}">${i+1}</button>`).join("")}</div>`:""}</div><button data-bc-page="${page+1}" ${page>=pages-1?"disabled":""}>→</button></div></section>`;
  }
  function albumCardHtml(entry,owned,tier){
    if(!owned.length){const r=entry.exclusive?{id:"exclusive",name:"Exclusive"}:RARITIES[tier];return `<article class="bc-inventory-card unknown ${entry.exclusive?"rar-exclusive":`rar-${r.id}`}"><div class="bc-card-art"><span>?</span></div><small>${entry.exclusive?"EXCLUSIVE":r.name} · ${pct(entry.rarityValue)}</small><b>???</b><span>Nicht entdeckt</span><i>Sammlungsplatz ${entry.base+1}</i></article>`;}
    const sorter=(a,b)=>effectivePoints(b)-effectivePoints(a)||b.level-a.level;
    const brokenOwned=owned.filter(x=>x.broken).sort(sorter),best=(brokenOwned[0]||owned.slice().sort(sorter)[0]),m=cardMeta(best),copies=owned.length,dupes=Math.max(0,copies-1),brokenCount=brokenOwned.length;
    return `<button class="bc-inventory-card ${m.className} shiny-${best.shiny} ${best.broken?"broken":""}" data-bc-card="${best.id}"><div class="bc-card-art"><span>${m.icon}</span>${cardEffectBadges(best)}${best.broken?'<span class="bc-card-crack" aria-hidden="true"></span>':""}${best.favorite?'<em class="bc-favorite-badge">★</em>':""}<em class="bc-copy-count"><strong>×${copies}</strong><small>${dupes} ${dupes===1?"Duplikat":"Duplikate"}</small>${brokenCount?`<small class="bc-broken-copy">💥 ${brokenCount} kaputt</small>`:""}</em></div><small>${best.exclusive?"EXCLUSIVE":m.rarity.name} · ${pct(m.rarityValue)}</small><b>${esc(m.name)}</b><span>Lv ${best.level}/5 · ${fmt(m.points)}/s · ${copies} Exemplar${copies===1?"":"e"}</span><i>⚔ Kampfwert ${fmt(m.combat.power)} · Schaden ${fmt(m.combat.min)}–${fmt(m.combat.max)}</i>${best.broken?`<i class="bc-broken-label">KAPUTT · ${repairKitMeta(repairKitId(best)).name} + ${fmt(repairCost(best))} Points</i>`:""}<i>${best.aura?`${auraBy(best.aura)?.icon} ${auraBy(best.aura)?.name}`:"Keine Aura"} · ${best.combatAura?`${combatAuraBy(best.combatAura)?.icon} ${combatAuraBy(best.combatAura)?.name}`:"Keine Kampf-Aura"}</i><i>${best.bind?`${bindBy(best.bind)?.icon} ${bindBy(best.bind)?.name}`:"Keine Bindung"}</i></button>`;
  }
  function shopHtml(){const auraCount=Object.values(S.auraInventory).reduce((a,b)=>a+b,0),combatAuraCount=Object.values(S.combatAuraInventory).reduce((a,b)=>a+b,0);return `<section class="bc-section"><div class="bc-section-title"><div><small>MARKTHALLE AM KARTENHAFEN</small><h2>BigCards Shop</h2><p>Upgrades, Spuren, Ausrüstung, Verkauf und Komfort. Packs bleiben im eigenen oberen Tab.</p></div><button class="bc-jk" data-bc-jkshop>JK/Coin-Shop öffnen</button></div><div class="bc-shop-panels"><article class="bc-shop-trail-card"><span>☄️</span><h3>Spuren</h3><p>Exklusive Designs und starke Boni für deine persönliche Karte. Freigeschaltet bis: ${TRAILS[S.trailTierUnlocked]?.name||TRAILS[0].name}.</p><button data-bc-trail-shop>Spuren öffnen</button></article><article><span>⚒️</span><h3>Karten verbessern</h3><p>Level 1–5 mit Duplikaten + Points. Zerbrochene Karten brauchen ein passendes Reparatur-Kit.</p><div class="bc-shop-dual-actions"><button data-bc-tab="collection">Smlg. öffnen</button><button class="bc-potion-short" data-bc-potion-shop>Tränke</button><button class="bc-rep-short" data-bc-repair-shop>Rep.</button></div><small class="bc-repair-stock">Reparatur-Kits im Inventar: ${Object.values(S.repairKits||{}).reduce((a,b)=>a+(Number(b)||0),0)}</small></article><article class="bc-shop-info-card"><button class="bc-shop-info" data-bc-equipment-info="aura" title="Info zu Auras" aria-label="Info zu Auras">i</button><span>✦</span><h3>Auras</h3><p>Alle Auras mit Points kaufbar oder kostenlos erspielbar. Points-Auras: ${auraCount} · Kampf-Auras: ${combatAuraCount}</p><button data-bc-equipment="aura">Auras · Kaufen & Freischalten</button></article><article class="bc-shop-info-card"><button class="bc-shop-info" data-bc-equipment-info="bind" title="Info zu Bindungen" aria-label="Info zu Bindungen">i</button><span>🔗</span><h3>Bindungen</h3><p>Alle Bindungen mit Points kaufbar oder kostenlos erspielbar. Inventar: ${Object.values(S.bindInventory).reduce((a,b)=>a+b,0)}</p><button data-bc-equipment="bind">Bindungen · Kaufen & Freischalten</button></article><article class="bc-shop-info-card"><button class="bc-shop-info" data-bc-equipment-info="shiny" title="Info zu Shiny" aria-label="Info zu Shiny">i</button><span>⚡</span><h3>Shiny</h3><p>Electric ab Lv3 · Explosive ab Lv4 · Void ab Lv5.</p><button data-bc-equipment="shiny">Shiny verwalten</button></article><article><span>♻️</span><h3>Card Shards</h3><p>${fmt(S.shards)} Shards. Zerlege nicht benötigte Duplikate im Kartendetail.</p><button data-bc-shards-info>Info</button></article></div><div class="bc-rebirth-shop"><div><small>REBIRTH CENTER</small><h3>${S.level>=100?"Normaler Rebirth bereit":"🔒 Gesperrt bis Level 100"}</h3><p>Aktuell Level ${S.level}. Rebirth behält Karten, Sammlung, Upgrades, Auras, Kampf-Auras, Bindungen und Shiny.</p><button data-bc-rebirth ${S.level<100?"disabled":""}>Normaler Rebirth</button></div><div><small>JK/COIN SKIP</small><h3>Rebirth für exakt 300 JK-Coins</h3><p>Überspringt nur die Level-100-Anforderung und zählt als vollständiger Rebirth.</p><button data-bc-rebirth-skip>300 JK/Coin</button></div></div></section>`}
  function marketHtml(){return `<section class="bc-section"><div class="bc-section-title"><div><small>FIREBASE PLAYER MARKET</small><h2>Online-Marktplatz</h2><p>Handel ausschließlich mit Points · 5 % Verkäufergebühr.</p></div><button data-bc-market-refresh>Aktualisieren</button></div><div class="bc-market-note">Gelistete Karten werden gesperrt. Kauf/Statuswechsel werden über Firestore geprüft. JK-Coins werden hier nicht zwischen Spielern gehandelt.</div><div class="bc-market-grid">${UI.market.length?UI.market.map(marketListingHtml).join(""):`<div class="bc-empty-state"><span>🏪</span><h3>Keine Angebote geladen</h3><p>Drücke auf Aktualisieren oder stelle eine Karte aus deinem Album ein.</p></div>`}</div><h3>Eigene Karte einstellen</h3><div class="bc-market-own">${Object.values(S.instances).filter(x=>!x.listed&&!x.broken&&!S.floors.flat().includes(x.id)&&!x.locked).sort((a,b)=>sellValue(b)-sellValue(a)).slice(0,12).map(x=>`<button data-bc-list-card="${x.id}">${esc(cardMeta(x).name)}<small>${fmt(sellValue(x))} Richtwert</small></button>`).join("")||"Keine freie Karte verfügbar."}</div></section>`}
  function marketListingHtml(l){const d=l.card||{},r=d.exclusive?{name:"Exclusive",id:"exclusive"}:RARITIES[d.rarity]||RARITIES[0];return `<article class="bc-market-card rar-${r.id}"><small>${esc(r.name)} · ${pct(d.rarityValue||100)}</small><h3>${esc(d.name||"Karte")}</h3><p>Lv ${d.level||1} · ${fmt(d.points||0)}/s · ${fmt(d.xp||0)} XP/s</p><p>⚔ Kampfwert ${d.combatPower?fmt(d.combatPower):"–"}${d.combatMin?` · Schaden ${fmt(d.combatMin)}–${fmt(d.combatMax||d.combatMin)}`:""}</p><span>Verkäufer: ${esc(l.sellerName||"Spieler")}</span><b>${fmt(l.price)} Points</b>${l.sellerUid===currentUidSync()?`<button data-bc-cancel-listing="${esc(l.id)}">Eigenes Angebot zurücknehmen</button>`:`<button data-bc-buy-listing="${esc(l.id)}">Kaufen</button>`}</article>`}
  function scoreHtml(){return `<section class="bc-section"><div class="bc-section-title"><div><small>LIFETIME SCORE</small><h2>Beste Spieler</h2><p>Der Score kann nur steigen und nutzt Bestwerte sowie Lifetime-Fortschritt.</p></div><button data-bc-score-refresh>Online aktualisieren</button></div><div class="bc-own-score"><div><small>DEIN SCORE</small><b>${fmt(S.lifetimeScore)}</b></div><div><small>MAX LEVEL</small><b>${S.maxLevelEver}</b></div><div><small>REBIRTHS</small><b>${S.totalRebirths}</b></div><div><small>BESTE PRODUKTION</small><b>${fmt(S.highestProductionEver)}/s</b></div><div><small>BESTE XP</small><b>${fmt(S.highestXpProductionEver)}/s</b></div></div><div class="bc-leaderboard">${UI.leaderboard.length?UI.leaderboard.map((p,i)=>`<article><strong>#${i+1}</strong><div><b>${esc(p.displayName||"Spieler")}</b><small>Level ${p.maxLevelEver||1} · ${p.collectionDiscovered||0}/6.500 · ${p.totalRebirths||0} Rebirths</small></div><span>${fmt(p.lifetimeScore)}</span></article>`).join(""):`<div class="bc-empty-state"><span>🏆</span><h3>Online-Rangliste noch nicht geladen</h3><p>Dein lokaler Lifetime-Score läuft bereits.</p></div>`}</div></section>`}
  function battleAbilityOrbHtml(ability,player,session){
    if(!ability||!player||!session)return "";
    const levelLocked=!ability.normal&&player.level<(ability.req||1);
    const disabled=!!ability.locked||levelLocked||session.turn!=="player";
    const hint=levelLocked?`ab Stufe ${ability.req}`:(ability.normal?(session.playerState.mustNormal?"Pflichtschlag":"Normaler Schlag"):(ability.desc||"Special"));
    return `<button type="button" data-bc-battle-action="${ability.id}" class="bc-battle-orb ${ability.normal?"normal":"special"}" ${disabled?"disabled":""} title="${esc(ability.name)} – ${esc(hint)}"><span>${ability.icon}</span><b>${esc(ability.name)}</b><small>${esc(hint)}</small></button>`;
  }
  function battleHitHtml(session,target){const hit=session?.lastHit;if(!hit||hit.target!==target)return"";return `<div class="bc-battle-hit ${target}"><strong>-${fmt(hit.damage)}</strong><small>${esc(hit.icon||"💥")} ${esc(hit.name||"Treffer")}</small></div>`;}
  function battleHtml(){
    const selected=ensureBattleCard(),m=selected?cardMeta(selected):null,r=UI.battleResult,session=UI.battleSession,cooldown=Math.max(0,Math.ceil(((S.battleCooldownUntil||0)-now())/1000));
    const player=session?instance(session.playerId):selected,pm=player?cardMeta(player):m,enemy=session?.enemy||null,em=enemy?cardMeta(enemy):null;
    const playerHp=session?session.playerHp:(pm?.combat.hp||0),playerMaxHp=session?(session.playerMaxHp||pm?.combat.hp||0):(pm?.combat.hp||0),enemyHp=session?session.enemyHp:(em?.combat.hp||0),playerPct=session&&playerMaxHp?clamp(playerHp/playerMaxHp*100,0,100):100,enemyPct=session&&em?.combat.hp?clamp(enemyHp/em.combat.hp*100,0,100):100;
    const abilities=session&&player?combatAbilities(player,session.playerState):[];
    const battleProgress=battleUpgradeInfo(),currentBattleRarity=RARITIES[battleProgress.current],nextBattleRarity=battleProgress.next?RARITIES[battleProgress.next.unlock]:null,progressPct=battleProgress.next?clamp(battleProgress.wins/battleProgress.next.wins*100,0,100):100;
    const playerCard=selected?`<article class="bc-battle-fighter ${m.className} ${selected.broken?"broken":""}"><small>DEINE KAMPFKARTE</small><div class="bc-battle-icon">${m.icon}${cardEffectBadges(selected)}${selected.broken?'<span class="bc-card-crack" aria-hidden="true"></span>':""}</div><h3>${esc(m.name)}</h3><b>⚔ Kampfwert ${fmt(m.combat.power)}</b><span>Schaden ${fmt(m.combat.min)}–${fmt(m.combat.max)} · Leben ${fmt(m.combat.hp)}</span><em>${selected.exclusive?`EXCLUSIVE · skaliert mit Account-Level ${S.level}`:`${m.rarity.name}`} · Kartenstufe ${selected.level}/5 · Rank ${cardRank(selected)}/10${selected.id===S.featuredCardId?" · ★ Persönliche Karte":""}${selected.combatAura?` · ${combatAuraBy(selected.combatAura)?.name}`:""}</em>${selected.id===S.featuredCardId&&featuredBackupCard(selected)?`<span class="bc-battle-backup-ready">🛡 Backup: ${esc(cardMeta(featuredBackupCard(selected)).name)} · ${featuredBackupCard(selected).broken?"KAPUTT":"bereit"}</span>`:""}${selected.broken?`<div class="bc-battle-broken"><b>💥 KARTE KAPUTT</b><span>Reparatur: 1× ${repairKitMeta(repairKitId(selected)).name} + ${fmt(repairCost(selected))} Points</span><div class="bc-battle-broken-actions"><button data-bc-battle-picker>Andere Karte wählen</button><button data-bc-battle-repair="${selected.id}">In Sammlung reparieren</button></div></div>`:`<div class="bc-battle-actions"><button data-bc-battle-picker>Karte wechseln</button><button class="primary" data-bc-battle-start ${cooldown||session?"disabled":""}>${session?"Kampf läuft":cooldown?`Nächster Kampf in ${cooldown}s`:"⚔ Kampf starten"}</button></div>`}</article>`:"";
    const fightPlayer=session&&pm?`<article class="bc-battle-fighter ${pm.className} ${session.lastHit?.target==="player"?"hit-now":""}"><small>${session.activeRole==="backup"?"🛡 BACKUP-KARTE AKTIV":"DEINE HAUPTKARTE"} · RUNDE ${session.round}</small>${battleHitHtml(session,"player")}<div class="bc-battle-icon">${pm.icon}${cardEffectBadges(player)}</div><h3>${esc(pm.name)}</h3><div class="bc-battle-hp"><span><i style="width:${playerPct}%"></i></span><b>${fmt(playerHp)} / ${fmt(playerMaxHp)} HP</b></div><small>⚔ ${fmt(pm.combat.power)} · Schaden ${fmt(pm.combat.min)}–${fmt(pm.combat.max)} · Rank ${cardRank(player)}/10</small>${session.playerPotion?`<em class="bc-active-potion">${session.playerPotion.icon} ${session.playerPotion.name} · ${session.playerPotion.effectText}</em>`:""}</article>`:"";
    const fightEnemy=session&&em?`<article class="bc-battle-fighter enemy ${em.className} ${session.lastHit?.target==="enemy"?"hit-now":""}"><small>${enemy.difficultyShift>0?"⚠ STÄRKERER GEGNER":enemy.difficultyShift<0?"SCHWÄCHERER GEGNER":"GEGNER"}</small>${battleHitHtml(session,"enemy")}<div class="bc-battle-icon">${em.icon}</div><h3>${esc(em.name)}</h3><div class="bc-battle-hp"><span><i style="width:${enemyPct}%"></i></span><b>${fmt(enemyHp)} / ${fmt(em.combat.hp)} HP</b></div><span>${RARITIES[enemy.rarity]?.name} · Lv ${enemy.level}/5</span><small>⚔ ${fmt(em.combat.power)} · Schaden ${fmt(em.combat.min)}–${fmt(em.combat.max)}</small></article>`:"";
    const normalAbility=abilities.find(a=>a.normal)||null,specialAbilities=abilities.filter(a=>!a.normal);
    const backupSwitch=session&&session.activeRole!=="backup"&&battleBackupForSession(session)?`<button class="bc-battle-backup-switch" data-bc-battle-backup-switch ${session.turn!=="player"?"disabled":""}>🛡 Auf Backup wechseln · ${esc(cardMeta(battleBackupForSession(session)).name)}</button>`:"";
    const middleControls=session?`<div class="bc-battle-center-controls"><small class="bc-battle-turn-state ${session.turn}">${session.turn==="player"?(session.playerState.mustNormal?"NORMALER SCHLAG PFLICHT":"DU BIST DRAN"):"GEGNER GREIFT AN …"}</small><div class="bc-battle-control-row"><div class="bc-battle-action-side normal-side">${battleAbilityOrbHtml(normalAbility,player,session)}</div><div class="bc-battle-vs compact"><span>VS</span><small>RUNDE ${session.round}</small></div><div class="bc-battle-action-side special-side count-${specialAbilities.length}">${specialAbilities.length?specialAbilities.map(a=>battleAbilityOrbHtml(a,player,session)).join(""):`<div class="bc-battle-no-special"><span>—</span><small>Kein Special</small></div>`}</div></div>${backupSwitch}<p>${session.playerState.mustNormal?"Nach diesem Schlag werden deine Specials wieder verfügbar.":session.activeRole==="backup"?"Backup aktiv · die Hauptkarte kann in diesem Kampf nicht zurückgewechselt werden.":"Links normal schlagen · rechts Special-Fähigkeiten wählen."}</p></div>`:"";
    const arena=session?`<div class="bc-battle-arena active-fight">${fightPlayer}${middleControls}${fightEnemy}</div><div class="bc-battle-live-panel"><div><small>AKTUELLER KAMPF</small><b>Letzte Aktionen</b></div><div class="bc-battle-live-log">${session.log.slice(-8).map(x=>`<span>${esc(x)}</span>`).join("")}</div></div>`:(selected?`<div class="bc-battle-arena">${playerCard}<div class="bc-battle-vs"><span>VS</span><small>Gegner wird erst nach „Kampf starten“ aufgedeckt</small></div><article class="bc-battle-fighter enemy hidden-enemy"><small>GEGNER</small><div class="bc-battle-icon">❓</div><h3>Noch unbekannt</h3><b>Zufällige Stärke</b><span>Der Gegner kann schwächer, ähnlich oder auch deutlich stärker sein.</span><em>Bei einer Niederlage zerbricht deine Karte.</em></article></div>`:`<div class="bc-empty-state"><span>⚔</span><h3>Keine Kampfkarte vorhanden</h3><p>Öffne ein Pack oder repariere deine kaputten Karten in der Sammlung.</p><button data-bc-tab="collection">Zur Sammlung</button></div>`);
    const progression=`<section class="bc-battle-progression"><div class="bc-battle-progression-head"><div><small>KARTENKAMPF-STUFE ${battleProgress.current+1} / ${RARITIES.length}</small><h3>Freigeschaltet bis ${currentBattleRarity.name}</h3></div>${nextBattleRarity?`<strong>Nächstes Ziel: ${nextBattleRarity.name}</strong>`:`<strong>MAXIMAL</strong>`}</div>${battleProgress.next?`<div class="bc-battle-progress-row"><div><span>Siege mit ${currentBattleRarity.name} / Exclusive</span><b>${battleProgress.wins} / ${battleProgress.next.wins}</b></div><div class="bc-battle-progress-bar"><i style="width:${progressPct}%"></i></div></div><div class="bc-battle-upgrade-row"><p>Nach ${battleProgress.next.wins} Siegen kannst du <b>${nextBattleRarity.name}</b> für ${fmt(battleProgress.next.cost)} Points freischalten. Siege mit niedrigeren normalen Karten zählen nicht; <b>Exclusive zählt immer</b>.</p><button data-bc-battle-upgrade ${battleProgress.wins<battleProgress.next.wins?"disabled":""}>${battleProgress.wins<battleProgress.next.wins?`Noch ${battleProgress.next.wins-battleProgress.wins} Siege`:`${nextBattleRarity.name} freischalten · ${fmt(battleProgress.next.cost)}`}</button></div>`:`<p class="bc-battle-max-note">Alle normalen Kampfraritäten bis Göttlich sind freigeschaltet.</p>`}</section>`;
    const result=r?`<section class="bc-battle-result ${r.won?"win":"loss"}"><div class="bc-battle-result-title"><span>${r.won?"🏆":"💥"}</span><div><small>LETZTER KAMPF · ${r.round} RUNDEN</small><h3>${r.won?"SIEG":"NIEDERLAGE"}</h3><p>${r.won?`+${fmt(r.rewardPoints)} Points · +${r.rewardShards} Shards${r.firstWin?" · Basic Kampf Aura freigeschaltet":""}${r.backupUsed?" · 🛡 Backup eingesetzt":""}${r.primaryFallen?" · Hauptkarte zerbrochen":""}${r.rankMasteryEarned&&r.rankNextRank?` · 🏅 +${fmt(r.rankMasteryEarned)} Meisterschaft${r.rankEliteEarned?" · +1 Elite-Sieg":""} · Rank ${r.rankNextRank}: ${fmt(r.rankMasteryNow)}/${fmt(r.rankNextMastery)} MP`:""}`:r.backupUsed?"Auch die Backup-Karte ist gefallen. Zerbrochene Karten müssen repariert werden.":"Deine eingesetzte Karte ist zerbrochen und muss repariert werden."}${r.potion?` · Trank: ${r.potion.icon} ${r.potion.name}`:""}</p></div></div><div class="bc-battle-result-grid"><article class="${r.player.className}"><b>${esc(r.player.name)}</b><span>Restleben ${fmt(r.player.hp)} / ${fmt(r.player.maxHp)}</span><small>⚔ ${fmt(r.player.power)} · ${fmt(r.player.min)}–${fmt(r.player.max)}</small>${(r.brokenIds||[]).map(id=>`<button data-bc-battle-repair="${id}">💥 ${esc(cardMeta(instance(id))?.name||"Karte")} reparieren</button>`).join("")}</article><article class="${r.enemy.className}"><b>${esc(r.enemy.name)}</b><span>Restleben ${fmt(r.enemy.hp)} / ${fmt(r.enemy.maxHp)}</span><small>Lv ${r.enemy.level} · ⚔ ${fmt(r.enemy.power)} · ${fmt(r.enemy.min)}–${fmt(r.enemy.max)}</small></article></div><div class="bc-battle-log">${r.log.map(x=>`<span>${esc(x)}</span>`).join("")}</div></section>`:"";
    return `<section class="bc-section bc-battle"><div class="bc-section-title"><div><small>KARTEN ARENA</small><h2>Kartenkampf</h2><p>Echter rundenbasierter Kampf: du greifst an, danach der Gegner. Niederlagen zerbrechen die eingesetzte Karte.</p></div><div class="bc-battle-record"><b>${S.battleWins||0} Siege</b><span>${S.battleLosses||0} Niederlagen · Serie ${S.battleStreak||0} · Rekord ${S.battleBestStreak||0}</span></div></div>${progression}${arena}${result}</section>`;
  }
  function modHtml(){
    if(UI.role!=="owner")return `<section class="bc-section"><div class="bc-empty-state"><span>🔒</span><h3>BigCards Owner-Testmenü</h3><p>Dieser Bereich ist ausschließlich für den Owner sichtbar.</p></div></section>`;
    const feature=featuredCard(),testCards=Object.values(S.instances).filter(Boolean).sort((a,b)=>cardMeta(b).combat.power-cardMeta(a).combat.power).slice(0,180),cardOpts=testCards.map(x=>{const m=cardMeta(x);return `<option value="${x.id}">${esc(m.name)} · ${x.exclusive?"EXCLUSIVE":m.rarity.name} · Lv ${x.level}${x.broken?" · KAPUTT":""}</option>`}).join("");
    return `<section class="bc-section"><div class="bc-section-title"><div><small>OWNER ONLY</small><h2>BigCards Mod-Menü</h2><p>Owner-Testwerkzeuge für Balancing, Karten, Kartenkampf, Ausrüstung und Kaufabläufe.</p></div></div><div class="bc-mod-grid"><label>Points setzen<input type="number" data-bc-mod-points value="${Math.floor(S.points)}"><button data-bc-mod-action="points">Setzen</button></label><label>BigCards Level<input type="number" data-bc-mod-level value="${S.level}"><button data-bc-mod-action="level">Setzen</button></label><label>Persönlicher Karten-Speicher<select data-bc-mod-feature-storage>${FEATURED_STORAGE_TIERS.map(x=>`<option value="${x.tier}" ${x.tier===S.featuredStorageTier?"selected":""}>${x.name} · ${fmt(x.points)} / ${fmt(x.xp)} XP</option>`).join("")}</select><button data-bc-mod-action="featureStorage">Speicher setzen</button></label><label>Persönliche Karte · Rank<select data-bc-mod-feature-rank ${feature?"":"disabled"}>${FEATURED_RANKS.map(x=>`<option value="${x.rank}" ${feature&&x.rank===cardRank(feature)?"selected":""}>Rank ${x.rank} · ${x.title} · +${Math.round(x.bonus*100)}%</option>`).join("")}</select><input type="number" min="0" placeholder="Meisterschaft" data-bc-mod-feature-rank-mastery value="${feature?cardRankMastery(feature):0}" ${feature?"":"disabled"}><input type="number" min="0" placeholder="Elite-Siege" data-bc-mod-feature-rank-elite value="${feature?cardRankEliteWins(feature):0}" ${feature?"":"disabled"}><button data-bc-mod-action="featureRank" ${feature?"":"disabled"}>Rank testen</button></label><label>Spielfeld-Speicher<select data-bc-mod-field-storage><option value="empty">Leer / Produktion frei</option><option value="full">Voll / Limit testen</option></select><button data-bc-mod-action="fieldStorage">Status setzen</button></label><label>Rebirths<input type="number" data-bc-mod-rebirth value="${S.totalRebirths}"><button data-bc-mod-action="rebirth">Setzen</button></label><label>Pack geben<select data-bc-mod-pack>${RARITIES.map((r,i)=>`<option value="${i}">${r.name}</option>`).join("")}</select><button data-bc-mod-action="pack">10 Karten ziehen</button></label><label>JK/Coin-Pack-Bestätigung testen<select data-bc-mod-jk-pack>${RARITIES.map((r,i)=>`<option value="${i}">${r.name} · ${r.jk} JK/Coin</option>`).join("")}<option value="exclusive">EXCLUSIVE · 500 JK/Coin</option></select><button data-bc-mod-action="jkPackConfirm">Bestätigung testen</button></label><label>Stockwerk freischalten<select data-bc-mod-floor>${[1,2,3,4].map(x=>`<option>${x}</option>`).join("")}</select><button data-bc-mod-action="floor">Freischalten</button></label><label>Kartenkampf freigeschaltet bis<select data-bc-mod-battle-tier>${RARITIES.map((r,i)=>`<option value="${i}" ${i===battleUnlockedTier()?"selected":""}>${r.name}</option>`).join("")}</select><button data-bc-mod-action="battleTier">Kampfstufe setzen</button></label><label>Siege für nächste Kampfstufe<input type="number" min="0" data-bc-mod-battle-wins value="${Math.floor(S.battleTierWins||0)}"><button data-bc-mod-action="battleTierWins">Siegzähler setzen</button></label><label>Gesamte Kartenkampf-Siege<input type="number" min="0" data-bc-mod-total-battle-wins value="${Math.floor(S.battleWins||0)}"><button data-bc-mod-action="totalBattleWins">Gesamtsiege setzen</button></label><label>Gratis-Ausrüstungsmeilensteine<button data-bc-mod-action="equipmentRewardsReset">Gratis-Claims zurücksetzen</button></label><label>Test-Aura<select data-bc-mod-aura>${AURAS.map(a=>`<option value="${a.id}">${a.name}</option>`).join("")}</select><button data-bc-mod-action="aura">Geben</button></label><label>Test-Kampf-Aura<select data-bc-mod-combat-aura>${COMBAT_AURAS.map(a=>`<option value="${a.id}">${a.name}</option>`).join("")}</select><button data-bc-mod-action="combatAura">Geben</button></label><label>Test-Bindung<select data-bc-mod-bind>${BINDS.map(b=>`<option value="${b.id}">${b.name}</option>`).join("")}</select><button data-bc-mod-action="bind">Geben</button></label><label>Reparatur-Kit geben<select data-bc-mod-repair-kit>${REPAIR_KITS.map(k=>`<option value="${k.id}">${k.name} · aktuell ×${repairKitCount(k.id)}</option>`).join("")}</select><button data-bc-mod-action="repairKit">Kit geben</button></label><label>Kampf-Trank geben<select data-bc-mod-potion>${[...RARITIES.map(r=>r.id),"exclusive"].flatMap(t=>POTION_TYPES.map(p=>`<option value="${t}:${p.id}">${t==="exclusive"?"Exclusive":RARITIES[RARITY_INDEX[t]].name} · ${p.name}</option>`)).join("")}</select><button data-bc-mod-action="potion">Trank geben</button></label><label>Spur geben<select data-bc-mod-trail>${TRAILS.map(t=>`<option value="${t.id}">${t.name} · aktuell ×${trailCount(t.id)}</option>`).join("")}</select><button data-bc-mod-action="trail">Spur geben</button></label><label>Spuren freigeschaltet bis<select data-bc-mod-trail-tier>${TRAILS.map(t=>`<option value="${t.index}" ${t.index===S.trailTierUnlocked?"selected":""}>${t.name}</option>`).join("")}</select><button data-bc-mod-action="trailTier">Spurstufe setzen</button></label><label>Shiny direkt testen<select data-bc-mod-shiny-card ${cardOpts?"":"disabled"}>${cardOpts||'<option value="">Keine Karte vorhanden</option>'}</select><select data-bc-mod-shiny-level><option value="0">Kein Shiny</option><option value="1">Electric</option><option value="2">Explosive</option><option value="3">Void</option></select><button data-bc-mod-action="shinyTest" ${cardOpts?"":"disabled"}>Shiny setzen</button></label><label>Kartenbruch / Reparatur testen<select data-bc-mod-broken-card ${cardOpts?"":"disabled"}>${cardOpts||'<option value="">Keine Karte vorhanden</option>'}</select><select data-bc-mod-broken-state><option value="broken">Kaputt setzen</option><option value="repair">Reparieren</option></select><button data-bc-mod-action="brokenTest" ${cardOpts?"":"disabled"}>Status setzen</button></label><label>Exclusive Pack<button data-bc-mod-action="exclusive">5 Karten ziehen</button></label><label>Spielstand<button class="danger" data-bc-mod-action="reset">BigCards zurücksetzen</button></label></div></section>`;
  }

  function showCardDetail(id){const inst=instance(id);if(!inst)return;UI.selectedCard=id;const m=cardMeta(inst),dupes=duplicateIds(inst).length,next=inst.level<5?inst.level+1:null,cost=next?upgradeCost(inst,next):0,placement=findCardPlacement(id),permitNeeded=needsFieldPermit(inst,UI.floor),permitCost=fieldPermitCost(inst),repair=inst.broken?repairCost(inst):0,repairKit=inst.broken?repairKitMeta(repairKitId(inst)):null,repairKitOwned=repairKit?repairKitCount(repairKit.id):0;showModal(`<div class="bc-card-detail"><div class="bc-detail-card ${m.className} shiny-${inst.shiny} ${inst.broken?"broken":""}"><div class="bc-card-art"><span>${m.icon}</span>${cardEffectBadges(inst)}${inst.broken?'<span class="bc-card-crack" aria-hidden="true"></span>':""}</div><small>${inst.exclusive?"EXCLUSIVE":m.rarity.name}</small><h2>${esc(m.name)}</h2><b>Raritätswert ${pct(m.rarityValue)}</b><p>Level ${inst.level}/5 · Rank ${cardRank(inst)}/10 · ${fmt(m.points)} Points/s · ${fmt(m.xp)} XP/s</p><p class="bc-combat-value"><b>⚔ Kampfwert ${fmt(m.combat.power)}</b> · Schaden ${fmt(m.combat.min)}–${fmt(m.combat.max)} · Leben ${fmt(m.combat.hp)}</p>${inst.exclusive?`<p class="bc-exclusive-combat-note">Exclusive-Kampfwert folgt deinem aktuellen BigCards-Level ${S.level} · aktuelle Kampfstufe: ${RARITIES[m.combat.tier]?.name||m.combat.tier}</p>`:""}${S.featuredCardId===id?`<p class="bc-feature-selected-note">★ PERSÖNLICHE KARTE · nicht auf Stockwerken einsetzbar · Spur-/Rank-Boni aktiv</p>`:inst.trail?`<p class="bc-feature-selected-note dormant">☄ ${trailBy(inst.trail)?.name||"Spur"} gespeichert · wirkt wieder, sobald diese Karte im Tab „Karte“ ausgewählt wird.</p>`:""}<p>Direkter Kartenwert: ${fmt(m.value)} Points</p>${placement?`<p><b>Aktiv:</b> Stockwerk ${placement.floor+1} · Platz ${placement.slot+1}</p>`:""}${inst.broken?`<div class="bc-repair-box"><b>💥 KARTE ZERBROCHEN</b><span>Im Kartenkampf nicht einsetzbar.</span><span><strong>Benötigt:</strong> 1× ${repairKit.name} · Inventar ×${repairKitOwned}</span><span><strong>Zusätzlich:</strong> ${fmt(repair)} Points</span><div class="bc-repair-box-actions"><button data-bc-repair-card="${id}">🛠️ Karte reparieren</button><button class="secondary" data-bc-repair-shop>Rep-Shop</button></div></div>`:""}</div><div class="bc-detail-actions"><div class="bc-detail-row"><button data-bc-place-card="${id}" ${S.featuredCardId===id?"disabled":""}>${S.featuredCardId===id?"★ Persönliche Karte aktiv":`Auf Stockwerk ${UI.floor+1} setzen`}</button><button data-bc-favorite="${id}">${inst.favorite?"★ Favorit":"☆ Favorit"}</button><button data-bc-lock="${id}">${inst.locked?"🔒 Gesperrt":"🔓 Sperren"}</button>${placement?`<button class="bc-remove-field" data-bc-remove-field="${id}">↩ Entfernen</button>`:""}</div><section><h3>Kartenupgrade & Spielfeld</h3>${next?`<p>Stufe ${next}: ${DUPE_COST[next]} Duplikate (${dupes} frei) + ${fmt(cost)} Points</p>`:`<p><b>★★★★★ MAX</b></p>`}<div class="bc-upgrade-field-row">${next?`<button data-bc-upgrade="${id}">Auf Stufe ${next}</button>`:""}${permitNeeded?`<button class="bc-field-permit" data-bc-field-permit="${id}">Für ${fmt(permitCost)} aufs Spielfeld</button>`:inst.fieldPermit?`<span class="bc-field-permit-owned">✓ Vorzeitige Spielfeld-Freigabe</span>`:""}</div>${permitNeeded?`<small class="bc-field-permit-note">${m.rarity.name} ist auf Stockwerk ${UI.floor+1} regulär noch gesperrt. Diese Freigabe gilt dauerhaft nur für dieses Exemplar.</small>`:""}</section><section><h3>Kampffähigkeiten</h3><div class="bc-detail-abilities">${combatAbilities(inst,{mustNormal:false}).map(a=>`<article class="${a.normal?"normal":"special"} ${!a.normal&&inst.level<(a.req||1)?"locked":""}"><span>${a.icon}</span><div><b>${a.name}</b><small>${!a.normal&&inst.level<(a.req||1)?`🔒 Freischaltung auf Stufe ${a.req}`:a.desc}</small></div></article>`).join("")}</div></section><section><h3>Aura-Slot · nur Points</h3><p>${inst.aura?`${auraBy(inst.aura)?.name} x${auraBy(inst.aura)?.mult}`:"Keine Aura"}</p><div class="bc-equip-list">${AURAS.filter(a=>(S.auraInventory[a.id]||0)>0).map(a=>`<button data-bc-equip-aura="${a.id}" data-card="${id}">${a.icon} ${a.name} ×${S.auraInventory[a.id]}</button>`).join("")||"Keine Aura im Inventar."}${inst.aura?`<button data-bc-remove-aura="${id}">Aura entfernen</button>`:""}</div></section><section><h3>Kampf-Aura-Slot · nur Kartenkampf</h3><p>${inst.combatAura?`${combatAuraBy(inst.combatAura)?.name} x${combatAuraBy(inst.combatAura)?.mult} Schaden/Kampfwert`:"Keine Kampf-Aura"}</p><div class="bc-equip-list">${COMBAT_AURAS.filter(a=>(S.combatAuraInventory[a.id]||0)>0).map(a=>`<button data-bc-equip-combat-aura="${a.id}" data-card="${id}">${a.icon} ${a.name} ×${S.combatAuraInventory[a.id]}</button>`).join("")||"Keine Kampf-Aura im Inventar."}${inst.combatAura?`<button data-bc-remove-combat-aura="${id}">Kampf-Aura entfernen</button>`:""}</div></section>${cardPotionSection(inst)}<section class="bc-card-trail-section"><h3>☄ Spur · persönliche Karte</h3><p>${inst.trail?`${trailBy(inst.trail)?.icon||"☄"} ${trailBy(inst.trail)?.name||"Spur"} · ${trailBonusText(trailBy(inst.trail))}${S.featuredCardId===id?" · <b>AKTIV</b>":" · aktuell inaktiv"}`:"Keine Spur auf diesem Exemplar."}</p>${S.featuredCardId===id?`<div class="bc-equip-list">${TRAILS.filter(t=>trailUnlocked(t.id)&&trailCount(t.id)>0).map(t=>`<button data-bc-equip-trail="${t.id}" data-card="${id}">${t.icon} ${t.name} ×${trailCount(t.id)}</button>`).join("")||"Keine freigeschaltete Spur im Inventar."}${inst.trail?`<button data-bc-remove-trail="${id}">Spur entfernen</button>`:""}<button data-bc-trail-shop>Spuren kaufen</button></div>`:`<small>Spuren lassen sich nur ausrüsten, wenn dieses Exemplar im Tab „Karte“ deine persönliche Karte ist.</small>`}</section><section><h3>Bindungs-Slot · nur XP</h3><p>${inst.bind?`${bindBy(inst.bind)?.name} x${bindBy(inst.bind)?.mult}`:"Keine Bindung"}</p><div class="bc-equip-list">${BINDS.filter(b=>(S.bindInventory[b.id]||0)>0).map(b=>`<button data-bc-equip-bind="${b.id}" data-card="${id}">${b.icon} ${b.name} ×${S.bindInventory[b.id]}</button>`).join("")||"Keine Bindung im Inventar."}${inst.bind?`<button data-bc-remove-bind="${id}">Bindung entfernen</button>`:""}</div></section><section><h3>Shiny</h3><p>${["Kein Shiny","Electric Shiny · x1,10 XP","Explosive Shiny · + x1,15 Points","Void Shiny · Auto-Collect"][inst.shiny]}</p>${inst.shiny<3?`<button data-bc-shiny="${id}">Nächste Shiny-Stufe</button>`:"<b>VOID MAX</b>"}</section><div class="bc-detail-row danger-row"><button data-bc-shred="${id}">In Shards zerlegen</button><button class="danger" data-bc-sell="${id}">Für ${fmt(m.value)} Points verkaufen</button></div></div></div>`);}
  function showEquipmentInfo(kind){
    if(kind==="aura")return showModal(`<div class="bc-help-info"><small>AUSRÜSTUNG · INFO</small><h2>Wie funktionieren Auras?</h2><p class="bc-bigcards-definition"><b>BigCards</b> bedeutet einfach dieses Kartenspiel <b>BigCards.kl</b>. Gemeint sind also dein BigCards-Level, deine Sammlung und deine Kartenkampf-Siege hier im Spiel.</p><div class="bc-help-grid"><article><span>✦</span><div><h3>Normale Auras</h3><p>Eine normale Aura verstärkt ausschließlich die <b>Points-Produktion</b> der Karte.</p></div></article><article><span>⚔</span><div><h3>Kampf-Auras</h3><p>Kampf-Auras erhöhen nur <b>Kampfwert und Schaden im Kartenkampf</b>. Beide Aura-Arten können gleichzeitig auf derselben Karte liegen.</p></div></article></div><h3>Kostenlose Wege · normale Auras</h3>${equipmentUnlockList("aura",AURAS)}<h3>Kostenlose Wege · Kampf-Auras</h3>${equipmentUnlockList("combatAura",COMBAT_AURAS)}<p><b>Alternative:</b> Jede normale Aura und jede Kampf-Aura kann unabhängig vom Fortschritt direkt im BigCards-Shop mit Points gekauft werden. Kaufen nimmt dir die kostenlose Meilenstein-Belohnung nicht weg.</p><p>Zum Ausrüsten: <b>Sammlung → Karte</b>. Entfernst du eine Aura, wandert sie zurück ins Inventar.</p><button class="bc-primary" data-bc-modal-close>Verstanden</button></div>`);
    if(kind==="bind")return showModal(`<div class="bc-help-info"><small>AUSRÜSTUNG · INFO</small><h2>Wie funktionieren Bindungen?</h2><p class="bc-bigcards-definition"><b>BigCards</b> = dieses Kartenspiel <b>BigCards.kl</b>. Das BigCards-Level ist das interne Kartenlevel, das oben im Spiel angezeigt wird.</p><div class="bc-help-grid single"><article><span>🔗</span><div><h3>XP-Verstärker für eine Karte</h3><p>Eine Bindung erhöht ausschließlich das <b>interne BigCards-XP</b> dieser Karte. Points-Produktion und Kartenkampf werden dadurch nicht stärker.</p></div></article></div><h3>Kostenlose Freischaltwege</h3>${equipmentUnlockList("bind",BINDS)}<p><b>Alternative:</b> Jede Bindung kann jederzeit direkt im BigCards-Shop mit Points gekauft werden. Die Magierbindung kann zusätzlich weiterhin im JK/Coin-Shop angeboten werden.</p><p>Zum Ausrüsten: <b>Sammlung → Karte → Bindungs-Slot</b>. Pro Karte kann genau eine Bindung aktiv sein; beim Entfernen geht sie zurück ins Inventar.</p><button class="bc-primary" data-bc-modal-close>Verstanden</button></div>`);
    return showModal(`<div class="bc-help-info"><small>KARTENFORTSCHRITT · INFO</small><h2>Wie funktioniert Shiny?</h2><p>Shiny wird <b>nicht aus Packs gezogen</b>. Du entwickelst eine vorhandene Karte direkt im Kartendetail mit Points weiter. Die Shiny-Stufen werden nacheinander freigeschaltet und bleiben dauerhaft auf diesem Kartenexemplar.</p><div class="bc-shiny-info-steps"><article><b>⚡ Electric Shiny</b><span>Kartenlevel 3 erforderlich · x1,10 internes XP.</span></article><article><b>💥 Explosive Shiny</b><span>Kartenlevel 4 erforderlich · zusätzlich x1,15 Points-Produktion.</span></article><article><b>🌑 Void Shiny</b><span>Kartenlevel 5 erforderlich · Points dieser Karte werden automatisch direkt eingesammelt.</span></article></div><p>So geht es: <b>Sammlung → Karte öffnen → Shiny → Nächste Shiny-Stufe</b>. Die Point-Kosten richten sich nach dem Wert der Karte.</p><button class="bc-primary" data-bc-modal-close>Verstanden</button></div>`);
  }
  function equipmentShopRow(kind,x){const inv=equipmentInventory(kind),info=equipmentRewardInfo(kind,x.id),price=equipmentPointPrice(kind,x.id),suffix=kind==="aura"?`x${x.mult} Points`:kind==="combatAura"?`x${x.mult} Kampf`:`x${x.mult} XP`;return `<article class="bc-equipment-shop-row ${info.ready&&!info.claimed?'free-ready':''}"><span>${x.icon}</span><div class="bc-equipment-shop-copy"><b>${x.name}</b><small>${suffix} · Inventar ×${inv[x.id]||0}</small><em>${esc(equipmentProgressText(info))}</em></div><div class="bc-equipment-shop-actions"><button data-bc-equipment-buy="${kind}:${x.id}">${fmt(price)} Points</button>${equipmentFreeButton(kind,x.id)}</div></article>`;}
  function showEquipment(kind){
    if(kind==="shiny"){const cards=Object.values(S.instances).filter(x=>!x.listed).sort((a,b)=>b.level-a.level||effectivePoints(b)-effectivePoints(a)).slice(0,60);return showModal(`<div class="bc-equipment bc-shiny-manager"><div class="bc-manager-title"><div><small>KARTENFORTSCHRITT</small><h2>Shiny verwalten</h2></div><button class="bc-manager-info" data-bc-equipment-info="shiny" title="Shiny Info" aria-label="Shiny Info">i</button></div><p>Wähle eine Karte. Electric ist ab Kartenlevel 3, Explosive ab Level 4 und Void ab Level 5 möglich.</p><div class="bc-shiny-card-list">${cards.length?cards.map(inst=>{const m=cardMeta(inst);return `<button data-bc-card="${inst.id}"><b>${esc(m.name)}</b><small>${inst.exclusive?"EXCLUSIVE":m.rarity.name} · Lv ${inst.level}/5 · Shiny ${inst.shiny}/3</small></button>`}).join(""):`<span>Noch keine Karten vorhanden.</span>`}</div></div>`);}
    if(kind==="aura")return showModal(`<div class="bc-aura-manager bc-equipment-store"><div class="bc-aura-manager-head bc-manager-title"><div><small>AUSRÜSTUNG · KAUFEN ODER ERSPIELEN</small><h2>Auras verwalten</h2><p>Jede Aura ist mit Points kaufbar. Die Meilensteine geben dir jede Stufe zusätzlich einmal kostenlos.</p></div><button class="bc-manager-info" data-bc-equipment-info="aura" title="Aura Info" aria-label="Aura Info">i</button></div><div class="bc-aura-split bc-aura-store-split"><section><h3>✦ Normale Auras</h3>${AURAS.map(x=>equipmentShopRow("aura",x)).join("")}</section><section class="combat"><h3>⚔ Kampf-Auras</h3>${COMBAT_AURAS.map(x=>equipmentShopRow("combatAura",x)).join("")}</section></div><p class="bc-aura-manager-note">Zum Ausrüsten anschließend eine konkrete Karte in der Sammlung öffnen.</p></div>`);
    const list=BINDS;showModal(`<div class="bc-equipment bc-equipment-store"><div class="bc-manager-title"><div><small>XP AUSRÜSTUNG · KAUFEN ODER ERSPIELEN</small><h2>Bindungen</h2><p>Alle Bindungen sind direkt mit Points kaufbar und besitzen zusätzlich einen kostenlosen Meilenstein.</p></div><button class="bc-manager-info" data-bc-equipment-info="bind" title="Bindungs Info" aria-label="Bindungs Info">i</button></div><div class="bc-binding-store-list">${list.map(x=>equipmentShopRow("bind",x)).join("")}</div><p>Zum Ausrüsten anschließend eine konkrete Karte in der Sammlung öffnen.</p></div>`);
  }
  function showShardInfo(){showModal(`<div class="bc-shards-info"><small>CARD SHARDS</small><h2>So zerlegst du Duplikate</h2><ol><li>Öffne die <b>Sammlung</b>.</li><li>Klicke eine bereits mehrfach vorhandene Karte an. Die Duplikat-Anzahl steht direkt auf der Karte.</li><li>Im Kartendetail drückst du auf <b>„In Shards zerlegen“</b>.</li><li>Favorisierte, gesperrte, auf dem Spielfeld eingesetzte oder online gelistete Exemplare werden geschützt und können nicht versehentlich zerlegt werden.</li></ol><p><b>Aktuell:</b> ${fmt(S.shards)} Card Shards.</p><button data-bc-modal-close>Verstanden</button></div>`);}
  function showModal(html){closeModal();const modal=document.createElement("div");modal.className="bc-modal";modal.dataset.bcModal="1";modal.innerHTML=`<div class="bc-modal-card"><button class="bc-modal-x" data-bc-modal-close>×</button>${html}</div>`;UI.overlay.append(modal)}
  function closeModal(){UI.overlay?.querySelector("[data-bc-modal]")?.remove();}
  function toast(text,ms=2600){const el=UI.overlay?.querySelector("[data-bc-toast]");if(!el)return;el.textContent=text;el.classList.add("show");clearTimeout(UI.toastTimer);UI.toastTimer=setTimeout(()=>el.classList.remove("show"),ms)}
  function timeLeft(until){const ms=Math.max(0,(Number(until)||0)-now());if(!ms)return"Aus";const h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000),s=Math.floor(ms%60000/1000);return h?`${h}h ${m}m`:`${m}:${String(s).padStart(2,"0")}`}

  function bindEvents(){UI.overlay.addEventListener("click",async e=>{const b=e.target.closest("button");if(!b)return;if(cloudBooting&&b.dataset.bcClose===undefined){e.preventDefault();e.stopPropagation();return toast("☁ Cloud-Spielstand wird geladen …",1800);}if(now()<UI.suppressClickUntil){e.preventDefault();e.stopPropagation();return;}if(b.dataset.bcClose!==undefined)return returnToTopGames();if(b.dataset.bcTab){if(b.dataset.bcTab==="mod"&&UI.role!=="owner")return toast("Das BigCards-Mod-Menü ist ausschließlich für den Owner.");rememberViewScroll();UI.tab=b.dataset.bcTab;refresh(false);if(UI.tab==="market")loadMarket();if(UI.tab==="score")loadLeaderboard();return}if(b.dataset.bcFloor!==undefined){UI.floor=Number(b.dataset.bcFloor);refresh();return}if(b.dataset.bcSlot!==undefined&&!b.dataset.bcCard){rememberViewScroll();UI.selectedSlot=Number(b.dataset.bcSlot);UI.tab="collection";refresh(false);toast(`Karte für Slot ${UI.selectedSlot+1} auswählen.`);return}if(b.dataset.bcCard)return showCardDetail(b.dataset.bcCard);if(b.dataset.bcCollect!==undefined)return collectPending();if(b.dataset.bcSmart!==undefined)return smartSetup();if(b.dataset.bcOpenPack!==undefined)return openNormalPack(Number(b.dataset.bcOpenPack),b.dataset.currency||"points");if(b.dataset.bcExclusive)return openExclusivePack(b.dataset.bcExclusive);if(b.dataset.bcStartReveal!==undefined){if(UI.packReveal&&UI.packReveal.index<0){UI.packReveal.index=0;return renderReveal()}return}if(b.dataset.bcNextCard!==undefined){UI.packReveal.index++;return renderReveal()}if(b.dataset.bcSkipReveal!==undefined){UI.packReveal.index=UI.packReveal.results.length;return renderReveal()}if(b.dataset.bcCloseReveal!==undefined){UI.packReveal=null;b.closest("[data-bc-reveal]")?.remove();refresh();return}if(b.dataset.bcTier!==undefined){rememberViewScroll();UI.collectionTier=Number(b.dataset.bcTier);UI.collectionPage=0;UI.collectionPageMenu=false;return refresh()}if(b.dataset.bcPageMenu!==undefined){UI.collectionPageMenu=!UI.collectionPageMenu;return refresh()}if(b.dataset.bcPageChoice!==undefined){rememberViewScroll();UI.collectionPage=Math.max(0,Number(b.dataset.bcPageChoice));UI.collectionPageMenu=false;UI.mainScroll.collection=0;return refresh(false)}if(b.dataset.bcPage!==undefined){rememberViewScroll();UI.collectionPage=Math.max(0,Number(b.dataset.bcPage));UI.collectionPageMenu=false;UI.mainScroll.collection=0;return refresh(false)}if(b.dataset.bcRebirth!==undefined)return doRebirth(false);if(b.dataset.bcRebirthSkip!==undefined)return doRebirth(true);if(b.dataset.bcBuyCollector!==undefined)return buyCollectorPoints();if(b.dataset.bcToggleAuto!==undefined)return toggleAuto();if(b.dataset.bcJkshop!==undefined)return window.JKCoinApp?.openForGame?.("bigcards");if(b.dataset.bcRepairShop!==undefined)return showRepairShop();if(b.dataset.bcTrailShop!==undefined)return showTrailShop();if(b.dataset.bcBuyTrail)return buyTrail(b.dataset.bcBuyTrail);if(b.dataset.bcTrailUnlock!==undefined)return unlockNextTrail();if(b.dataset.bcFeaturePicker!==undefined)return showFeaturedPicker();if(b.dataset.bcFeatureSelect)return selectFeaturedCard(b.dataset.bcFeatureSelect);if(b.dataset.bcFeatureClear!==undefined)return clearFeaturedCard();if(b.dataset.bcFeatureRank!==undefined)return showFeaturedRank();if(b.dataset.bcRankInfo!==undefined)return showFeaturedRankInfo();if(b.dataset.bcBackupPicker!==undefined)return showFeaturedBackupPicker();if(b.dataset.bcBackupSelect)return setFeaturedBackupCard(b.dataset.bcBackupSelect);if(b.dataset.bcBackupClear!==undefined)return clearFeaturedBackup();if(b.dataset.bcRankUpgrade!==undefined)return upgradeFeaturedRank();if(b.dataset.bcFeatureCollect!==undefined)return collectFeatured();if(b.dataset.bcEquipTrail)return equipTrail(b.dataset.card,b.dataset.bcEquipTrail);if(b.dataset.bcRemoveTrail)return removeTrail(b.dataset.bcRemoveTrail);if(b.dataset.bcPotionShop!==undefined)return showPotionShop();if(b.dataset.bcPotionTier)return showPotionTierShop(b.dataset.bcPotionTier);if(b.dataset.bcBuyPotion)return buyPotion(b.dataset.tier,b.dataset.bcBuyPotion);if(b.dataset.bcEquipPotion)return equipPotion(b.dataset.card,b.dataset.bcEquipPotion);if(b.dataset.bcRemovePotion)return removePotion(b.dataset.bcRemovePotion);if(b.dataset.bcBuyRepairKit)return buyRepairKit(b.dataset.bcBuyRepairKit);if(b.dataset.bcEquipmentBuy){const [kind,id]=String(b.dataset.bcEquipmentBuy).split(":");return buyEquipment(kind,id)}if(b.dataset.bcEquipmentFree){const [kind,id]=String(b.dataset.bcEquipmentFree).split(":");return claimFreeEquipment(kind,id)}if(b.dataset.bcEquipmentInfo)return showEquipmentInfo(b.dataset.bcEquipmentInfo);if(b.dataset.bcEquipment)return showEquipment(b.dataset.bcEquipment);if(b.dataset.bcShardsInfo!==undefined)return showShardInfo();if(b.dataset.bcBattlePicker!==undefined)return showBattlePicker();if(b.dataset.bcBattlePick){UI.battleCard=b.dataset.bcBattlePick;UI.battleResult=null;UI.battleSession=null;closeModal();refresh(false);return}if(b.dataset.bcBattleStart!==undefined)return startBattle();if(b.dataset.bcBattleUpgrade!==undefined)return upgradeBattleTier();if(b.dataset.bcBattleAction){e.preventDefault();b.blur();return performPlayerBattleAction(b.dataset.bcBattleAction);}if(b.dataset.bcBattleBackupSwitch!==undefined){e.preventDefault();b.blur();return manualBattleBackupSwitch();}if(b.dataset.bcBattleRepair)return openBattleRepair(b.dataset.bcBattleRepair);if(b.dataset.bcRepairCard)return repairCard(b.dataset.bcRepairCard);if(b.dataset.bcPlaceCard)return placeCard(b.dataset.bcPlaceCard);if(b.dataset.bcRemoveField)return removeCardFromField(b.dataset.bcRemoveField);if(b.dataset.bcFavorite){const x=instance(b.dataset.bcFavorite);x.favorite=!x.favorite;persist();return showCardDetail(x.id)}if(b.dataset.bcLock){const x=instance(b.dataset.bcLock);x.locked=!x.locked;persist();return showCardDetail(x.id)}if(b.dataset.bcUpgrade)return upgradeCard(b.dataset.bcUpgrade);if(b.dataset.bcFieldPermit)return unlockAndPlaceCard(b.dataset.bcFieldPermit);if(b.dataset.bcShiny)return upgradeShiny(b.dataset.bcShiny);if(b.dataset.bcEquipAura)return equipAura(b.dataset.card,b.dataset.bcEquipAura);if(b.dataset.bcEquipCombatAura)return equipCombatAura(b.dataset.card,b.dataset.bcEquipCombatAura);if(b.dataset.bcEquipBind)return equipBind(b.dataset.card,b.dataset.bcEquipBind);if(b.dataset.bcRemoveAura)return removeAura(b.dataset.bcRemoveAura);if(b.dataset.bcRemoveCombatAura)return removeCombatAura(b.dataset.bcRemoveCombatAura);if(b.dataset.bcRemoveBind)return removeBind(b.dataset.bcRemoveBind);if(b.dataset.bcSell)return sellCard(b.dataset.bcSell);if(b.dataset.bcShred)return shredDuplicate(b.dataset.bcShred);if(b.dataset.bcModalClose!==undefined)return closeModal();if(b.dataset.bcClaim)return claimDaily(b.dataset.bcClaim);if(b.dataset.bcMarketRefresh!==undefined)return loadMarket(true);if(b.dataset.bcScoreRefresh!==undefined)return loadLeaderboard(true);if(b.dataset.bcListCard)return promptListing(b.dataset.bcListCard);if(b.dataset.bcBuyListing)return buyListing(b.dataset.bcBuyListing);if(b.dataset.bcCancelListing)return cancelListing(b.dataset.bcCancelListing);if(b.dataset.bcRoleRefresh!==undefined)return loadRole(true);if(b.dataset.bcModAction)return modAction(b.dataset.bcModAction)});
    UI.overlay.addEventListener("pointerdown",e=>{
      if(UI.tab!=="field"||e.button>0)return;const source=e.target.closest?.(".bc-slot.filled[data-bc-card][data-bc-slot]");if(!source)return;
      const sourceSlot=Number(source.dataset.bcSlot);if(!Number.isInteger(sourceSlot))return;clearFieldDragVisuals();UI.drag={pointerId:e.pointerId,cardId:source.dataset.bcCard,sourceSlot,floor:UI.floor,sourceEl:source,startX:e.clientX,startY:e.clientY,startAt:now(),targetSlot:sourceSlot,active:false,timer:0,ghost:null};
      UI.drag.timer=setTimeout(()=>{if(UI.drag?.pointerId===e.pointerId)startFieldDrag(e)},180);
    },{passive:true});
    UI.overlay.addEventListener("pointermove",e=>{const d=UI.drag;if(!d||d.pointerId!==e.pointerId)return;if(!d.active){const dist=Math.hypot(e.clientX-d.startX,e.clientY-d.startY);if(dist>12&&now()-d.startAt<160){clearTimeout(d.timer);UI.drag=null;}return;}updateFieldDrag(e);},{passive:false});
    UI.overlay.addEventListener("pointerup",e=>{if(UI.drag?.pointerId===e.pointerId)finishFieldDrag(e,false);},{passive:false});
    UI.overlay.addEventListener("pointercancel",e=>{if(UI.drag?.pointerId===e.pointerId)finishFieldDrag(e,true);},{passive:false});
    UI.overlay.addEventListener("contextmenu",e=>{if(e.target.closest?.(".bc-slot.filled[data-bc-card]"))e.preventDefault();});
    UI.overlay.addEventListener("scroll",e=>{if(e.target.matches?.("[data-bc-rarity-tabs]"))UI.rarityScroll=Math.max(0,e.target.scrollLeft||0);if(e.target.matches?.("[data-bc-main]"))UI.mainScroll[UI.tab]=Math.max(0,e.target.scrollTop||0);},true);UI.overlay.addEventListener("change",e=>{if(e.target.matches("[data-bc-auto-pack]")){S.autoPack=e.target.value;persist()}});UI.overlay.addEventListener("input",e=>{if(e.target.matches("[data-bc-collection-search]")){UI.collectionSearch=e.target.value;UI.collectionPage=0;UI.collectionPageMenu=false;clearTimeout(e.target._t);e.target._t=setTimeout(refresh,180)}});
    window.addEventListener("keydown",onKey);}
  function onKey(e){if(!UI.overlay)return;if(e.code==="Escape"){if(UI.overlay.querySelector("[data-bc-modal]"))closeModal();else if(UI.overlay.querySelector("[data-bc-reveal]")){UI.packReveal=null;UI.overlay.querySelector("[data-bc-reveal]")?.remove()}else returnToTopGames()}}

  async function firebase(){try{return await window.LifeBuilderFirebaseCore?.load?.()}catch{return null}}
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
  function cloudHasFullSave(root){return Number(root?.schemaVersion)>=CLOUD_MIN_SCHEMA_VERSION&&typeof root?.saveId==="string"&&Number(root?.chunkCount)>0;}
  function meaningfulLocalProgress(raw){if(!raw||typeof raw!=="object")return false;return Object.keys(raw.instances||{}).length>0||Object.keys(raw.collection||{}).length>0||Object.keys(raw.exclusiveCollection||{}).length>0||Number(raw.points)>1000||Number(raw.level)>1||Number(raw.totalRebirths)>0||Number(raw.lifetimeScore)>0;}
  function mergeLegacyCheckpoint(raw,root){const out=Object.assign(defaultState(),raw||{});if(root){out.points=Math.max(0,Number(root.points)||out.points||1000);out.level=Math.max(1,Number(root.level)||out.level||1);out.totalRebirths=Math.max(0,Number(root.totalRebirths)||out.totalRebirths||0);out.lifetimeScore=Math.max(Number(out.lifetimeScore)||0,Number(root.lifetimeScore)||0);out.updatedAt=Math.max(Number(out.updatedAt)||0,Number(root.updatedAtMs)||0);}return out;}
  async function readFullCloudState(fb,userId,root){
    if(!cloudHasFullSave(root))return null;const count=Math.floor(Number(root.chunkCount)||0);if(count<1||count>CLOUD_MAX_CHUNKS)throw new Error("Ungültige Cloud-Chunk-Anzahl");
    const chunks=new Array(count);for(let start=0;start<count;start+=8){const jobs=[];for(let i=start;i<Math.min(count,start+8);i++){const id=`chunk-${String(i).padStart(3,"0")}`;jobs.push(fb.getDoc(fb.doc(fb.db,CLOUD_SAVE_COLLECTION,userId,"chunks",id)).then(snap=>({i,snap})));}const rows=await Promise.all(jobs);for(const {i,snap} of rows){if(!snap.exists())throw new Error(`Cloud-Chunk ${i+1}/${count} fehlt`);const d=snap.data()||{};if(d.saveId!==root.saveId||Number(d.index)!==i||typeof d.data!=="string")throw new Error(`Cloud-Chunk ${i+1} gehört nicht zum aktuellen Spielstand`);chunks[i]=d.data;}}
    const payload=chunks.join("");if(Number(root.payloadChars)&&payload.length!==Number(root.payloadChars))throw new Error("Cloud-Spielstand ist unvollständig");if(root.payloadHash&&cloudHash(payload)!==root.payloadHash)throw new Error("Cloud-Spielstand-Prüfsumme stimmt nicht");const raw=JSON.parse(payload);if(!raw||typeof raw!=="object")throw new Error("Cloud-Spielstand ist ungültig");
    // Der Point-Wert im Root-Dokument ist für Marktplatz-Transaktionen autoritativ.
    if(Number.isFinite(Number(root.points)))raw.points=Math.max(0,Number(root.points));raw.updatedAt=Math.max(Number(raw.updatedAt)||0,Number(root.updatedAtMs)||0);return raw;
  }
  function scheduleCloudSave(delay=CLOUD_SAVE_DELAY_MS){if(!cloudReady||cloudBooting||cloudMigrationPending)return;if(cloudSaveTimer)return;cloudSaveTimer=setTimeout(()=>{cloudSaveTimer=0;syncProfile(false)},Math.max(500,delay));}
  async function writeProfile(fb,u){
    const ref=fb.doc(fb.db,PROFILE_COLLECTION,u.uid),profile={userId:u.uid,displayName:await displayName(),lifetimeScore:Math.floor(S.lifetimeScore||0),lifetimePointsEarned:Math.floor(S.lifetimePointsEarned||0),maxLevelEver:Math.floor(S.maxLevelEver||1),totalRebirths:Math.floor(S.totalRebirths||0),highestProductionEver:Math.floor(S.highestProductionEver||0),highestXpProductionEver:Math.floor(S.highestXpProductionEver||0),collectionDiscovered:collectionCount(),exclusiveDiscovered:exclusiveCount(),unlockedFloors:Math.floor(S.unlockedFloors||1),currentProduction:Math.floor(productionPerSecond()),lastUpdated:fb.serverTimestamp()};
    // Bestehende High-Water-Werte nie kleiner schreiben, damit ältere Geräte/Profiles
    // nicht an den Sicherheitsregeln scheitern und der Vollsave trotzdem synchronisiert.
    try{const snap=await fb.getDoc(ref);if(snap.exists()){const old=snap.data()||{};for(const k of ["lifetimeScore","lifetimePointsEarned","maxLevelEver","totalRebirths","highestProductionEver","highestXpProductionEver","collectionDiscovered","exclusiveDiscovered","unlockedFloors"])profile[k]=Math.max(Number(profile[k])||0,Number(old[k])||0);}}catch{}
    await fb.setDoc(ref,profile,{merge:true});
  }
  async function syncProfile(force=false){
    if((!cloudReady&&!force)||cloudMigrationPending||cloudSaving||!S){if(cloudSaving)cloudDirty=true;return false}const fb=await firebase(),u=await currentUser();if(!fb||!u)return false;cloudUid=u.uid;cloudSaving=true;if(force&&cloudSaveTimer){clearTimeout(cloudSaveTimer);cloudSaveTimer=0;}const mutationAtStart=cloudMutationCounter;let cloudStage="Vorbereitung";
    try{updateFeaturedEarnings(now());const savedAt=now();S.updatedAt=savedAt;S.version=358;const payload=JSON.stringify(S),chunks=splitCloudPayload(payload);if(chunks.length>CLOUD_MAX_CHUNKS)throw new Error(`BigCards-Spielstand ist für den Cloud-Speicher zu groß (${chunks.length} Chunks).`);const saveId=`v358-${savedAt.toString(36)}-${Math.random().toString(36).slice(2,9)}`;cloudStage="Chunks";
      for(let start=0;start<chunks.length;start+=6){const jobs=[];for(let i=start;i<Math.min(chunks.length,start+6);i++){const id=`chunk-${String(i).padStart(3,"0")}`;jobs.push(fb.setDoc(fb.doc(fb.db,CLOUD_SAVE_COLLECTION,u.uid,"chunks",id),{saveId,index:i,data:chunks[i],updatedAtMs:savedAt}));}await Promise.all(jobs);}
      cloudStage="Root";const root={uid:u.uid,points:Math.floor(S.points),level:Math.max(1,Math.floor(S.level)),totalRebirths:Math.max(0,Math.floor(S.totalRebirths)),lifetimeScore:Math.max(0,Math.floor(S.lifetimeScore)),collectionDiscovered:collectionCount(),updatedAtMs:savedAt,schemaVersion:CLOUD_SCHEMA_VERSION,saveId,chunkCount:chunks.length,payloadChars:payload.length,payloadHash:cloudHash(payload),sourceDevice:deviceId(),cloudSavedAt:fb.serverTimestamp()};
      await fb.setDoc(fb.doc(fb.db,CLOUD_SAVE_COLLECTION,u.uid),root,{merge:true});
      // Profil/Bestenliste ist Zusatzdaten. Ein alter High-Water-Konflikt darf niemals
      // den eigentlichen Karten-Vollsave als fehlgeschlagen markieren.
      try{cloudStage="Profil";await writeProfile(fb,u)}catch(profileError){console.warn("BigCards leaderboard profile save",profileError)}
      cloudLastSaveId=saveId;cloudLastRemoteUpdatedAt=savedAt;writeCloudMeta(u.uid,{saveId,remoteUpdatedAtMs:savedAt,syncedLocalUpdatedAt:savedAt});writeLocalState(u.uid,true);if(cloudMutationCounter===mutationAtStart)cloudDirty=false;return true;
    }catch(e){console.warn(`BigCards full cloud save (${cloudStage})`,e);cloudDirty=true;return false}finally{cloudSaving=false;if(cloudDirty&&cloudReady&&!cloudMigrationPending)scheduleCloudSave();}
  }
  async function pullCloudIfNewer(showToast=false){
    if(!cloudReady||cloudBooting||cloudSaving||cloudMigrationPending||cloudDirty)return false;const fb=await firebase(),u=await currentUser();if(!fb||!u)return false;try{const snap=await fb.getDoc(fb.doc(fb.db,CLOUD_SAVE_COLLECTION,u.uid));if(!snap.exists())return false;const root=snap.data()||{},remoteAt=Number(root.updatedAtMs)||0;if(!cloudHasFullSave(root))return false;if(root.saveId===cloudLastSaveId&&remoteAt<=cloudLastRemoteUpdatedAt)return false;const raw=await readFullCloudState(fb,u.uid,root);if(!raw)return false;adoptState(raw,{saveLocal:true,userId:u.uid});cloudLastSaveId=root.saveId;cloudLastRemoteUpdatedAt=remoteAt;cloudDirty=false;writeCloudMeta(u.uid,{saveId:root.saveId,remoteUpdatedAtMs:remoteAt,syncedLocalUpdatedAt:Number(S.updatedAt)||remoteAt});UI.battleCard=null;UI.battleResult=null;UI.battleSession=null;UI.floor=Math.min(UI.floor,S.unlockedFloors-1);if(UI.overlay)refresh(false);if(showToast||root.sourceDevice!==deviceId())toast("☁ BigCards-Spielstand von einem anderen Gerät aktualisiert.",3000);return true}catch(e){console.warn("BigCards cloud pull",e);return false}}
  async function retryPendingCloudMigration(){if(!cloudMigrationPending||cloudBooting||cloudSaving||!UI.overlay)return false;const fb=await firebase(),u=await currentUser();if(!fb||!u)return false;try{const snap=await fb.getDoc(fb.doc(fb.db,CLOUD_SAVE_COLLECTION,u.uid));if(!snap.exists())return false;const root=snap.data()||{};if(!cloudHasFullSave(root))return false;const raw=await readFullCloudState(fb,u.uid,root);if(!raw)return false;cloudMigrationPending=false;cloudReady=true;adoptState(raw,{saveLocal:true,userId:u.uid});cloudLastSaveId=root.saveId;cloudLastRemoteUpdatedAt=Number(root.updatedAtMs)||0;cloudDirty=false;writeCloudMeta(u.uid,{saveId:root.saveId,remoteUpdatedAtMs:cloudLastRemoteUpdatedAt,syncedLocalUpdatedAt:Number(S.updatedAt)||cloudLastRemoteUpdatedAt});UI.floor=Math.min(UI.floor,S.unlockedFloors-1);refresh(false);startCloudWatchers();toast(`☁ Vollständiger PC-Spielstand geladen · ${Object.keys(S.instances||{}).length} Karten`,4200);return true}catch(e){console.warn("BigCards migration retry",e);return false}}
  function stopCloudWatchers(){clearInterval(cloudPollTimer);cloudPollTimer=0;window.removeEventListener("focus",onCloudFocus);document.removeEventListener("visibilitychange",onCloudVisibility);}
  function onCloudFocus(){if(cloudMigrationPending)retryPendingCloudMigration();else pullCloudIfNewer(false)}
  function onCloudVisibility(){if(document.visibilityState==="visible"){if(cloudMigrationPending)retryPendingCloudMigration();else pullCloudIfNewer(false)}else if(cloudReady&&cloudDirty)syncProfile(true)}
  function startCloudWatchers(){stopCloudWatchers();if(!cloudReady&&!cloudMigrationPending)return;cloudPollTimer=setInterval(()=>cloudMigrationPending?retryPendingCloudMigration():pullCloudIfNewer(false),CLOUD_POLL_MS);window.addEventListener("focus",onCloudFocus);document.addEventListener("visibilitychange",onCloudVisibility);}
  function startRuntimeTimers(){lastTick=performance.now();clearInterval(tickTimer);tickTimer=setInterval(tick,250);clearInterval(autoTimer);autoTimer=setInterval(autoTick,2400);startCloudWatchers();}
  async function initializeCloudSession(){
    if(cloudBooting)return;cloudBooting=true;cloudReady=false;cloudMigrationPending=false;const fb=await firebase(),u=await currentUser();
    if(!fb||!u){const localOnly=await readIndexedState("");if(localOnly)adoptState(localOnly,{saveLocal:false});cloudBooting=false;ensureDaily();applyOffline();refresh(false);loadRole();startRuntimeTimers();toast("☁ Nicht angemeldet – BigCards läuft lokal über sicheren Gerätespeicher. Für Handy/PC-Sync mit demselben JK.Games-Konto anmelden.",4200);return;}
    cloudUid=u.uid;const localRaw=(await readLocalStateForUser(u.uid))||S||defaultState(),meta=readCloudMeta(u.uid);let root=null,remoteRaw=null,rootSnap=null;
    try{rootSnap=await fb.getDoc(fb.doc(fb.db,CLOUD_SAVE_COLLECTION,u.uid));if(rootSnap.exists())root=rootSnap.data()||{};if(cloudHasFullSave(root))remoteRaw=await readFullCloudState(fb,u.uid,root);}catch(e){console.warn("BigCards cloud load",e);}
    if(remoteRaw){const localUnsynced=meta.saveId===root.saveId&&Number(localRaw?.updatedAt||0)>Number(meta.syncedLocalUpdatedAt||0)+1000;if(localUnsynced){adoptState(localRaw,{saveLocal:true,userId:u.uid});cloudLastSaveId=root.saveId;cloudLastRemoteUpdatedAt=Number(root.updatedAtMs)||0;cloudDirty=true;}else{if(meta.saveId&&meta.saveId!==root.saveId&&Number(localRaw?.updatedAt||0)>Number(meta.syncedLocalUpdatedAt||0)+1000)backupLocalConflict(u.uid,localRaw);adoptState(remoteRaw,{saveLocal:true,userId:u.uid});cloudLastSaveId=root.saveId;cloudLastRemoteUpdatedAt=Number(root.updatedAtMs)||0;cloudDirty=false;writeCloudMeta(u.uid,{saveId:root.saveId,remoteUpdatedAtMs:cloudLastRemoteUpdatedAt,syncedLocalUpdatedAt:Number(S.updatedAt)||cloudLastRemoteUpdatedAt});}}
    else if(root){const localHasCards=Object.keys(localRaw?.instances||{}).length>0||Object.keys(localRaw?.collection||{}).length>0||Object.keys(localRaw?.exclusiveCollection||{}).length>0;if(localHasCards||meaningfulLocalProgress(localRaw)&&Number(root.collectionDiscovered||0)===0){adoptState(localRaw,{saveLocal:true,userId:u.uid});cloudDirty=true;}else{adoptState(mergeLegacyCheckpoint(localRaw,root),{saveLocal:true,userId:u.uid});if(Number(root.collectionDiscovered||0)>0&&!localHasCards){cloudMigrationPending=true;cloudDirty=false;}}}
    else{adoptState(localRaw,{saveLocal:true,userId:u.uid});cloudDirty=true;}
    cloudBooting=false;cloudReady=!cloudMigrationPending;ensureDaily();applyOffline();UI.floor=Math.min(UI.floor,S.unlockedFloors-1);refresh(false);await loadRole();await claimPayouts();startRuntimeTimers();
    if(cloudMigrationPending){toast("☁ Der alte Firebase-Stand enthält noch keinen Kartenbestand. Öffne diese Version einmal auf dem PC/anderen Gerät, auf dem deine Karten vorhanden sind. Das Handy prüft danach automatisch erneut und übernimmt den vollständigen Stand.",7000);return;}
    if(cloudDirty)await syncProfile(true);else toast(`☁ BigCards synchronisiert · ${Object.keys(S.instances||{}).length} Karten geladen`,3000);
  }
  async function loadRole(showToast=false){const fb=await firebase(),u=await currentUser();if(!fb||!u){UI.role="player";if(UI.tab==="mod")UI.tab="field";if(showToast)toast("Firebase-Rolle nicht verfügbar.");return refresh()}try{const snap=await fb.getDoc(fb.doc(fb.db,"staffRoles",u.uid));UI.role=String(snap.data()?.role||"player").toLowerCase();}catch{UI.role="player"}if(UI.role!=="owner"&&UI.tab==="mod")UI.tab="field";refresh();}
  async function loadMarket(show=false){const fb=await firebase();if(!fb){if(show)toast("Firebase nicht verfügbar.");return}try{const q=fb.query(fb.collection(fb.db,MARKET_COLLECTION),fb.where("status","==","active"),fb.limit(40)),snap=await fb.getDocs(q);UI.market=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.price||0)-(b.price||0));if(UI.tab==="market")refresh();if(show)toast(`${UI.market.length} Angebote geladen.`)}catch(e){console.warn(e);if(show)toast("Marktplatz konnte nicht geladen werden.")}}
  async function promptListing(id){const inst=instance(id);if(!inst)return;if(id===S.featuredCardId)return toast("Wähle die persönliche Karte zuerst im Tab „Karte“ ab, bevor du sie online listest.");if(featuredCard()?.backupCardId===id)return toast("Entferne diese Karte zuerst im Rank-Menü als Backup-Karte.");if(inst.broken)return toast("Kaputte Karten müssen vor dem Marktplatz repariert werden.");if(inst.battlePotion){returnPreparedPotion(inst);persist();toast("Vorbereiteter Trank wurde vor dem Listing zurück ins Inventar gelegt.");}if(inst.trail){const t=returnTrailToInventory(inst);persist();toast(`${t?.name||"Spur"} wurde vor dem Listing zurück ins Inventar gelegt.`);}const suggested=sellValue(inst),raw=prompt(`${cardMeta(inst).name} online listen.\nPreis in Points:`,String(suggested*2));if(raw==null)return;const price=Math.max(1,Math.floor(Number(raw)||0));if(!price)return;const fb=await firebase(),u=await currentUser();if(!fb||!u)return toast("Für den Online-Marktplatz musst du angemeldet sein.");try{const m=cardMeta(inst),listing={sellerUid:u.uid,sellerName:await displayName(),status:"active",price,feeRate:MARKET_FEE,card:{instanceId:inst.id,name:m.name,rarity:inst.rarity,base:inst.base,rarityValue:m.rarityValue,level:inst.level,rank:cardRank(inst),rankMastery:cardRankMastery(inst),rankEliteWins:cardRankEliteWins(inst),rankWins:0,rankedAt:Number(inst.rankedAt)||0,aura:inst.aura,combatAura:inst.combatAura,bind:inst.bind,shiny:inst.shiny,battlePotion:inst.battlePotion||null,exclusive:inst.exclusive,exclusiveId:inst.exclusiveId,basePower:inst.basePower,points:Math.floor(m.points),xp:Math.floor(m.xp),combatPower:Math.floor(m.combat.power),combatMin:Math.floor(m.combat.min),combatMax:Math.floor(m.combat.max)},createdAt:fb.serverTimestamp(),createdAtMs:now()};const ref=await fb.addDoc(fb.collection(fb.db,MARKET_COLLECTION),listing);clearBackupReferences(id);inst.listed=ref.id;persist();refresh();toast("Karte online gelistet.");loadMarket()}catch(e){console.warn(e);toast("Listing fehlgeschlagen.")}}
  async function cancelListing(id){const listing=UI.market.find(x=>x.id===id);if(!listing||listing.sellerUid!==currentUidSync())return;const fb=await firebase();if(!fb)return toast("Firebase nicht verfügbar.");try{await fb.updateDoc(fb.doc(fb.db,MARKET_COLLECTION,id),{status:"cancelled",cancelledAt:fb.serverTimestamp(),cancelledAtMs:now()});const inst=Object.values(S.instances).find(x=>x.listed===id);if(inst)inst.listed=false;persist();toast("Angebot zurückgenommen.");loadMarket()}catch(e){console.warn(e);toast("Angebot konnte nicht zurückgenommen werden.")}}
  async function buyListing(id){const listing=UI.market.find(x=>x.id===id);if(!listing)return;if(S.points<listing.price)return toast("Nicht genügend Points.");if(!confirm(`${listing.card?.name||"Karte"} für ${fmt(listing.price)} Points kaufen?`))return;const fb=await firebase(),u=await currentUser();if(!fb||!u)return toast("Firebase-Anmeldung erforderlich.");try{await syncProfile();const ref=fb.doc(fb.db,MARKET_COLLECTION,id),buyerSave=fb.doc(fb.db,CLOUD_SAVE_COLLECTION,u.uid),buyerName=await displayName();await fb.runTransaction(fb.db,async tx=>{const [snap,walletSnap]=await Promise.all([tx.get(ref),tx.get(buyerSave)]);if(!snap.exists()||snap.data().status!=="active")throw new Error("Angebot nicht mehr aktiv");if(snap.data().sellerUid===u.uid)throw new Error("Eigenes Angebot");const price=Math.floor(Number(snap.data().price)||0),serverPoints=Math.floor(Number(walletSnap.data()?.points)||0);if(serverPoints<price)throw new Error("Server-Spielstand hat nicht genügend Points. Kurz speichern und erneut versuchen.");tx.update(buyerSave,{points:serverPoints-price,updatedAtMs:now()});tx.update(ref,{status:"sold",buyerUid:u.uid,buyerName,soldAt:fb.serverTimestamp(),soldAtMs:now()});const payout=Math.floor(price*(1-MARKET_FEE));tx.set(fb.doc(fb.db,PAYOUT_COLLECTION,snap.data().sellerUid,"items",id),{listingId:id,sellerUid:snap.data().sellerUid,buyerUid:u.uid,amount:payout,fee:price-payout,status:"pending",createdAt:fb.serverTimestamp()});});S.points-=listing.price;const c=listing.card||{};const added=addInstance({rarity:c.rarity||0,base:c.base||0,exclusive:!!c.exclusive,exclusiveId:c.exclusiveId||null,basePower:c.basePower||null,rarityValue:c.rarityValue||100});added.inst.level=clamp(c.level||1,1,5);added.inst.rank=clamp(Math.floor(Number(c.rank)||0),0,FEATURED_RANK_MAX);added.inst.rankMastery=Math.max(0,Math.floor(Number(c.rankMastery)||Math.floor(Number(c.rankWins)||0)*4));added.inst.rankEliteWins=Math.max(0,Math.floor(Number(c.rankEliteWins)||0));added.inst.rankWins=0;added.inst.rankedAt=Math.max(0,Number(c.rankedAt)||0);added.inst.aura=c.aura||null;added.inst.combatAura=c.combatAura||null;added.inst.bind=c.bind||null;added.inst.shiny=clamp(c.shiny||0,0,3);added.inst.battlePotion=c.battlePotion||null;persist();toast("Karte gekauft.");loadMarket();refresh()}catch(e){console.warn(e);toast(e.message||"Kauf fehlgeschlagen.")}}
  async function claimPayouts(){const fb=await firebase(),u=await currentUser();if(!fb||!u)return;try{const q=fb.query(fb.collection(fb.db,PAYOUT_COLLECTION,u.uid,"items"),fb.where("status","==","pending"),fb.limit(50)),snap=await fb.getDocs(q);let sum=0;for(const d of snap.docs){sum+=Math.max(0,Number(d.data().amount)||0);const sold=Object.values(S.instances).find(x=>x.listed===d.id);if(sold){for(const row of S.floors){const i=row.indexOf(sold.id);if(i>=0)row[i]=null}delete S.instances[sold.id]}await fb.updateDoc(d.ref,{status:"claimed",claimedAt:fb.serverTimestamp()})}if(sum){S.points+=sum;persist();toast(`Marktplatz-Erlös: +${fmt(sum)} Points`)}}catch(e){console.warn("BigCards payout",e)}}
  async function loadLeaderboard(show=false){const fb=await firebase();if(!fb){if(show)toast("Firebase nicht verfügbar.");return}try{const q=fb.query(fb.collection(fb.db,PROFILE_COLLECTION),fb.orderBy("lifetimeScore","desc"),fb.limit(50)),snap=await fb.getDocs(q);UI.leaderboard=snap.docs.map(d=>d.data());if(UI.tab==="score")refresh();if(show)toast("Bestenliste aktualisiert.")}catch(e){console.warn(e);if(show)toast("Bestenliste konnte nicht geladen werden.")}}

  function modAction(action){
    if(UI.role!=="owner")return toast("Owner-Rechte erforderlich.");
    const q=s=>UI.overlay.querySelector(s);
    if(action==="points")S.points=Math.max(0,Number(q("[data-bc-mod-points]")?.value)||0);
    else if(action==="level")S.level=Math.max(1,Math.floor(Number(q("[data-bc-mod-level]")?.value)||1));
    else if(action==="featureStorage")S.featuredStorageTier=clamp(Math.floor(Number(q("[data-bc-mod-feature-storage]")?.value)||0),0,FEATURED_STORAGE_TIERS.length-1);
    else if(action==="featureRank"){const inst=featuredCard();if(!inst)return toast("Keine persönliche Karte gewählt.");inst.rank=clamp(Math.floor(Number(q("[data-bc-mod-feature-rank]")?.value)||0),0,FEATURED_RANK_MAX);inst.rankMastery=Math.max(0,Math.floor(Number(q("[data-bc-mod-feature-rank-mastery]")?.value)||0));inst.rankEliteWins=Math.max(0,Math.floor(Number(q("[data-bc-mod-feature-rank-elite]")?.value)||0));inst.rankWins=0;inst.rankedAt=inst.rank?now():0;applyRankStorageUnlock(inst);}
    else if(action==="fieldStorage")S.fieldStoredSeconds=q("[data-bc-mod-field-storage]")?.value==="full"?fieldStorageSecondsLimit():0;
    else if(action==="rebirth")S.totalRebirths=Math.max(0,Math.floor(Number(q("[data-bc-mod-rebirth]")?.value)||0));
    else if(action==="pack"){const ri=Number(q("[data-bc-mod-pack]")?.value)||0;const results=Array.from({length:10},()=>rollNormal(ri));showPackReveal(results,{name:`TEST ${RARITIES[ri].name}`,test:true});}
    else if(action==="jkPackConfirm"){
      const val=q("[data-bc-mod-jk-pack]")?.value;
      if(val==="exclusive"){
        if(!confirmJkPackPurchase("TEST EXCLUSIVE PACK · 5 Karten",500))return toast("JK/Coin-Test abgebrochen.");
        showPackReveal(Array.from({length:5},()=>rollExclusive()),{name:"TEST JK EXCLUSIVE",test:true,exclusive:true});
      }else{
        const ri=clamp(Math.floor(Number(val)||0),0,RARITIES.length-1),r=RARITIES[ri];
        if(!confirmJkPackPurchase(`TEST ${r.name}-Pack · 10 Karten`,r.jk))return toast("JK/Coin-Test abgebrochen.");
        showPackReveal(Array.from({length:10},()=>rollNormal(ri)),{name:`TEST JK ${r.name}`,test:true});
      }
      toast("Bestätigung getestet · im Mod-Test wurden keine JK/Coin abgezogen.",3600);
    }
    else if(action==="floor")S.unlockedFloors=Math.max(S.unlockedFloors,clamp(Number(q("[data-bc-mod-floor]")?.value)||1,1,4));
    else if(action==="battleTier"){S.battleTierUnlocked=clamp(Math.floor(Number(q("[data-bc-mod-battle-tier]")?.value)||0),0,RARITIES.length-1);S.battleTierWins=0;}
    else if(action==="battleTierWins")S.battleTierWins=Math.max(0,Math.floor(Number(q("[data-bc-mod-battle-wins]")?.value)||0));
    else if(action==="totalBattleWins")S.battleWins=Math.max(0,Math.floor(Number(q("[data-bc-mod-total-battle-wins]")?.value)||0));
    else if(action==="equipmentRewardsReset"){if(!confirm("Nur die einmaligen Gratis-Claim-Markierungen zurücksetzen? Bereits vorhandene Auras/Bindungen bleiben erhalten."))return;S.equipmentRewards={};}
    else if(action==="aura"){const id=q("[data-bc-mod-aura]")?.value;S.auraInventory[id]=(S.auraInventory[id]||0)+1;}
    else if(action==="combatAura"){const id=q("[data-bc-mod-combat-aura]")?.value;S.combatAuraInventory[id]=(S.combatAuraInventory[id]||0)+1;}
    else if(action==="bind"){const id=q("[data-bc-mod-bind]")?.value;S.bindInventory[id]=(S.bindInventory[id]||0)+1;}
    else if(action==="repairKit"){const id=q("[data-bc-mod-repair-kit]")?.value;if(REPAIR_KIT_BY_ID[id])S.repairKits[id]=repairKitCount(id)+1;}
    else if(action==="potion"){const raw=q("[data-bc-mod-potion]")?.value||"common:life",[tierId,typeId]=raw.split(":");if(POTION_TYPES.some(p=>p.id===typeId)){const key=potionKey(tierId,typeId);S.potionInventory[key]=potionCount(tierId,typeId)+1;}}
    else if(action==="trail"){const id=q("[data-bc-mod-trail]")?.value;if(trailBy(id))S.trailInventory[id]=trailCount(id)+1;}
    else if(action==="trailTier"){S.trailTierUnlocked=clamp(Math.floor(Number(q("[data-bc-mod-trail-tier]")?.value)||0),0,TRAILS.length-1);}
    else if(action==="shinyTest"){const inst=instance(q("[data-bc-mod-shiny-card]")?.value);if(!inst)return toast("Keine Testkarte gewählt.");inst.shiny=clamp(Math.floor(Number(q("[data-bc-mod-shiny-level]")?.value)||0),0,3);}
    else if(action==="brokenTest"){const inst=instance(q("[data-bc-mod-broken-card]")?.value);if(!inst)return toast("Keine Testkarte gewählt.");const broken=q("[data-bc-mod-broken-state]")?.value!=="repair";inst.broken=broken;inst.brokenAt=broken?now():0;}
    else if(action==="exclusive"){showPackReveal(Array.from({length:5},()=>rollExclusive()),{name:"TEST EXCLUSIVE",test:true,exclusive:true});}
    else if(action==="reset"){if(confirm("BigCards.kl-Spielstand wirklich vollständig zurücksetzen?")){localStorage.removeItem(SAVE_KEY);if(cloudUid)localStorage.removeItem(localStateKey(cloudUid));S=defaultState();}}
    persist();refresh();
  }

  function grantJkCoinPurchase(kind,amount=1){state();const qty=Math.max(1,Math.floor(Number(amount)||1));if(String(kind).startsWith("pack:")){const id=String(kind).split(":")[1];S.jkPackCredits[id]=(S.jkPackCredits[id]||0)+qty}else if(kind==="exclusivePack")S.exclusiveCredits+=qty;else if(kind==="autoOpenerHour")S.autoOpenerUntil=Math.max(now(),S.autoOpenerUntil||0)+qty*3600000;else if(kind==="autoCollectorHour")S.autoCollectorUntil=Math.max(now(),S.autoCollectorUntil||0)+qty*3600000;else if(String(kind).startsWith("aura:")){const id=String(kind).split(":")[1];S.auraInventory[id]=(S.auraInventory[id]||0)+qty}else if(String(kind).startsWith("combatAura:")){const id=String(kind).split(":")[1];S.combatAuraInventory[id]=(S.combatAuraInventory[id]||0)+qty}else if(String(kind).startsWith("bind:")){const id=String(kind).split(":")[1];S.bindInventory[id]=(S.bindInventory[id]||0)+qty}else if(String(kind).startsWith("trail:")){const id=String(kind).split(":")[1];if(!trailBy(id))return false;S.trailInventory[id]=trailCount(id)+qty}else if(String(kind).startsWith("featuredStorage:")){const tier=clamp(Math.floor(Number(String(kind).split(":")[1])||0),0,FEATURED_STORAGE_TIERS.length-1);S.featuredStorageTier=Math.max(Math.floor(Number(S.featuredStorageTier)||0),tier)}else if(String(kind).startsWith("pointsMinutes:")){const mins=Number(String(kind).split(":")[1])||5;S.points+=Math.max(1000,productionPerSecond()*60*mins)*qty}else return false;persist();if(UI.overlay){refresh();toast("JK/Coin-Kauf in BigCards.kl gutgeschrieben.")}return true;}

  function open(phone){if(UI.overlay)return;state();UI.phone=phone||UI.phone;UI.tab="field";UI.battleResult=null;UI.battleSession=null;UI.floor=Math.min(UI.floor,S.unlockedFloors-1);const overlay=document.createElement("div");overlay.className="bc-overlay";overlay.dataset.bigcardsKl="1";overlay.innerHTML=renderShell();document.body.append(overlay);document.body.classList.add("bigcards-kl-open");UI.overlay=overlay;UI.main=overlay.querySelector("[data-bc-main]");bindEvents();refresh(false);toast("☁ BigCards-Spielstand wird mit Firebase abgeglichen …",2400);initializeCloudSession();}
  function close(){if(!UI.overlay)return;updateFeaturedEarnings(now());clearTimeout(UI.battleEnemyTimer);UI.battleEnemyTimer=0;UI.battleSession=null;clearFieldDragVisuals();UI.drag=null;S.lastSeen=now();persist();writeLocalState(cloudUid||currentUidSync(),true);if(cloudReady&&!cloudMigrationPending)syncProfile(true);stopCloudWatchers();window.removeEventListener("keydown",onKey);clearInterval(tickTimer);clearInterval(autoTimer);UI.overlay.remove();UI.overlay=null;UI.main=null;UI.packReveal=null;document.body.classList.remove("bigcards-kl-open")}
  function returnToTopGames(){const phone=UI.phone;close();setTimeout(()=>{if(window.JKGamesOpenTopGames)window.JKGamesOpenTopGames(phone);else if(window.openDeviceInterface&&phone)window.openDeviceInterface(phone,"topgames",false)},80)}

  window.BigCardsKL=Object.freeze({version:VERSION,open,close,returnToTopGames,grantJkCoinPurchase,getState:()=>state(),getFeaturedStorageTier:()=>Math.floor(Number(state().featuredStorageTier)||0),featuredStorageTiers:FEATURED_STORAGE_TIERS,featuredRanks:FEATURED_RANKS,rarities:RARITIES,trails:TRAILS,baseNames:BASE_NAMES});
})();
