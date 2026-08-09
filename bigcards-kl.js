/* BigCards.kl – JK.Games Top Game V345 */
(() => {
  "use strict";

  const VERSION = "2026-08-09-bigcards-v345-battle-center-controls-scroll-fix";
  const SAVE_KEY = "jk-games-bigcards-kl-v332";
  const CLOUD_SAVE_COLLECTION = "bigCardsSaves";
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
  let S=null,tickTimer=0,cloudSaveTimer=0,autoTimer=0,lastTick=performance.now();

  const clamp=(n,a,b)=>Math.min(b,Math.max(a,Number(n)||0));
  const esc=(v)=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
  const fmt=(n)=>{n=Number(n)||0;if(Math.abs(n)<1000)return Math.floor(n).toLocaleString("de-DE");const u=[[1e18,"Qi"],[1e15,"Qa"],[1e12,"Bio"],[1e9,"Mrd"],[1e6,"Mio"],[1e3,"Tsd"]];for(const [v,s] of u)if(Math.abs(n)>=v)return `${(n/v).toLocaleString("de-DE",{maximumFractionDigits:2})} ${s}`;return n.toLocaleString("de-DE")};
  const pct=(n)=>Number(n).toLocaleString("de-DE",{maximumFractionDigits:5})+" %";
  const now=()=>Date.now();
  const uid=()=>`bc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
  function persist(){if(!S)return;S.updatedAt=now();try{localStorage.setItem(SAVE_KEY,JSON.stringify(S));}catch(e){console.warn("BigCards save",e)}scheduleCloudSave();}
  function defaultState(){return {version:345,points:1000,pendingPoints:0,level:1,xp:0,totalRebirths:0,phase:0,phaseRebirths:0,unlockedFloors:1,instances:{},floors:Array.from({length:4},()=>Array(10).fill(null)),collection:{},exclusiveCollection:{},shards:0,auraInventory:{},combatAuraInventory:{},bindInventory:{},repairKits:{},jkPackCredits:{},exclusiveCredits:0,autoCollectorUntil:0,autoCollectorPointStep:0,autoOpenerUntil:0,autoPack:"common",autoEnabled:false,battleWins:0,battleLosses:0,battleStreak:0,battleBestStreak:0,battleCooldownUntil:0,battleTierUnlocked:0,battleTierWins:0,battleUpgradeSpent:0,lifetimePointsEarned:0,lifetimeScore:0,maxLevelEver:1,highestProductionEver:0,highestXpProductionEver:0,highestUpgrade:{},shinyMilestones:{},floorScore:{1:true},daily:{day:"",opened:0,upgraded:0,newCards:0,claimed:{}},lastSeen:now(),createdAt:now(),updatedAt:now(),packHistory:[]};}
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
  function state(){if(S)return S;try{const raw=JSON.parse(localStorage.getItem(SAVE_KEY)||"null");S=raw&&typeof raw==="object"?Object.assign(defaultState(),raw):defaultState();}catch{S=defaultState()}S.instances||={};S.collection||={};S.exclusiveCollection||={};S.auraInventory||={};S.combatAuraInventory||={};S.bindInventory||={};S.repairKits||={};S.battleWins=Math.max(0,Math.floor(Number(S.battleWins)||0));S.battleLosses=Math.max(0,Math.floor(Number(S.battleLosses)||0));S.battleStreak=Math.max(0,Math.floor(Number(S.battleStreak)||0));S.battleBestStreak=Math.max(S.battleStreak,Math.floor(Number(S.battleBestStreak)||0));S.battleCooldownUntil=Math.max(0,Number(S.battleCooldownUntil)||0);S.battleTierUnlocked=clamp(Math.floor(Number(S.battleTierUnlocked)||0),0,RARITIES.length-1);S.battleTierWins=Math.max(0,Math.floor(Number(S.battleTierWins)||0));S.battleUpgradeSpent=Math.max(0,Number(S.battleUpgradeSpent)||0);S.autoCollectorPointStep=Math.max(0,Math.floor(Number(S.autoCollectorPointStep)||0));if((Number(S.autoCollectorUntil)||0)<=now())S.autoCollectorPointStep=0;for(const inst of Object.values(S.instances)){if(!inst)continue;if(inst.combatAura===undefined)inst.combatAura=null;if(inst.broken===undefined)inst.broken=false;if(inst.brokenAt===undefined)inst.brokenAt=0;}S.floors=Array.from({length:4},(_,i)=>Array.isArray(S.floors?.[i])?S.floors[i].slice(0,10).concat(Array(10).fill(null)).slice(0,10):Array(10).fill(null));S.unlockedFloors=clamp(S.unlockedFloors||1,1,4);S.phase=clamp(S.phase||0,0,3);S.phaseRebirths=clamp(S.phaseRebirths||0,0,5);S.level=Math.max(1,Math.floor(S.level||1));S.version=345;const repaired=normalizeFloorUniqueCards();if(repaired){try{localStorage.setItem(SAVE_KEY,JSON.stringify(S));}catch{}}return S;}

  function rarityValue(index){return INTERNAL_VALUES[clamp(index,0,499)]??100;}
  function variantKey(rarityIndex,baseIndex){return `${rarityIndex}:${baseIndex}`;}
  function collectionKey(inst){return inst.exclusive?`x:${inst.exclusiveId}`:variantKey(inst.rarity,inst.base);}
  function rarityUnlockedIndex(){const phase=FLOOR_PHASES[S.phase]||FLOOR_PHASES[0];let max=phase.tiers[0][1];for(const [r,t] of phase.tiers)if(S.phaseRebirths>=r)max=t;return max;}
  function floorMaxTier(floorIndex){if(floorIndex>S.phase)return -1;const phase=FLOOR_PHASES[floorIndex];let max=phase.tiers[0][1];const rebirths=floorIndex<S.phase?5:S.phaseRebirths;for(const [r,t] of phase.tiers)if(rebirths>=r)max=t;return max;}
  function rebirthMultiplier(){const completed=S.phase,local=[1,2,3,4,5,5][S.phaseRebirths]||1;return Math.min(125,Math.pow(5,completed)*local);}
  function cardBaseProduction(rarityIndex,baseIndex){const r=RARITIES[rarityIndex],rv=rarityValue(baseIndex);const scarcity=clamp(1-Math.pow((rv-.1)/99.9,.58),0,1);return r.min+(r.max-r.min)*scarcity;}
  function cardBaseXp(inst){const p=inst.exclusive?Math.max(1,inst.basePower||1):cardBaseProduction(inst.rarity,inst.base);return Math.max(.25,Math.sqrt(p)*(.55+(inst.exclusive?1:(inst.rarity+1)*.08)));}
  function auraBy(id){return AURAS.find(a=>a.id===id)||null}function combatAuraBy(id){return COMBAT_AURAS.find(a=>a.id===id)||null}function bindBy(id){return BINDS.find(b=>b.id===id)||null}
  function effectivePoints(inst){if(!inst)return 0;let base=inst.exclusive?Math.max(1,Number(inst.basePower)||1):cardBaseProduction(inst.rarity,inst.base);let value=base*(LEVEL_MULT[inst.level]||1)*rebirthMultiplier();if(inst.aura)value*=auraBy(inst.aura)?.mult||1;if(inst.shiny>=2)value*=1.15;return Math.max(0,value);}
  function effectiveXp(inst){if(!inst)return 0;let value=cardBaseXp(inst)*(1+(inst.level-1)*.14);if(inst.bind)value*=bindBy(inst.bind)?.mult||1;if(inst.shiny>=1)value*=1.10;value*=Math.min(5,Math.sqrt(rebirthMultiplier()));return value;}
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
  function battleUnlockedTier(){return clamp(Math.floor(Number(S?.battleTierUnlocked)||0),0,RARITIES.length-1);}
  function battleCardUnlocked(inst){return !!inst&&combatTier(inst)<=battleUnlockedTier();}
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
    const aura=combatAuraBy(inst.combatAura),auraMult=aura?.mult||1;
    const min=Math.max(1,Math.floor(range.min*quality*levelMult*shinyMult*auraMult));
    const max=Math.max(min+1,Math.ceil(range.max*quality*levelMult*shinyMult*auraMult));
    const avg=(min+max)/2;
    // Mehr Leben als in V340: Kämpfe dauern mehrere echte Spieler-/Gegnerzüge.
    const hp=Math.max(45,Math.round(avg*5.5+(tier+1)*35*Math.sqrt(levelMult)));
    const power=Math.max(1,Math.round(avg+hp*.16));
    return {tier,min,max,hp,power,aura};
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
  function abilityDamage(inst,stats,ability){
    const level=clamp(inst?.level||1,1,5),levelSkill=1+(level-1)*.055;
    const base=rollCombatDamage(stats),mult=ability.normal?(.90+Math.random()*.20):(Number(ability.mult)||1)*levelSkill;
    return Math.max(1,Math.round(base*mult));
  }
  function sellValue(inst){if(!inst)return 0;if(inst.exclusive){const p=Math.max(1,(inst.basePower||1)*(LEVEL_MULT[inst.level]||1));return Math.max(1,Math.floor(p*4.5*(1+(inst.shiny||0)*.22)));}const r=RARITIES[inst.rarity],rv=rarityValue(inst.base),scarcity=1+2.5*Math.pow(1-rv/100,2),levelValue=1+(inst.level-1)*.45,shiny=1+(inst.shiny||0)*.22;return Math.max(1,Math.floor(r.price*.06*scarcity*levelValue*shiny));}
  function instance(id){return id?S.instances[id]||null:null;}
  function duplicateIds(inst){if(!inst)return[];const key=collectionKey(inst),deployed=new Set(S.floors.flat().filter(Boolean));return Object.values(S.instances).filter(x=>x.id!==inst.id&&collectionKey(x)===key&&!x.listed&&!x.locked&&!x.favorite&&!deployed.has(x.id)).map(x=>x.id);}
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

  function addInstance(data){const id=uid(),inst={id,rarity:Math.floor(data.rarity||0),base:Math.floor(data.base||0),level:1,aura:null,combatAura:null,bind:null,shiny:0,broken:false,brokenAt:0,favorite:false,locked:false,listed:false,exclusive:!!data.exclusive,exclusiveId:data.exclusiveId||null,basePower:data.basePower||null,createdAt:now()};S.instances[id]=inst;const key=collectionKey(inst),col=inst.exclusive?S.exclusiveCollection:S.collection;const wasNew=!col[key];col[key]=col[key]||{firstAt:now(),highestLevel:1};if(wasNew){S.daily.newCards=(S.daily.newCards||0)+1;raiseScore(inst.exclusive?2500+Math.round(20000/(Math.max(.1,data.rarityValue||100))):100+Math.round((inst.rarity+1)*80+250/Math.max(.1,rarityValue(inst.base))),"collection");}return {inst,wasNew};}
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
  function collectPending(){const amount=Math.floor(S.pendingPoints||0);if(!amount)return toast("Noch keine Points zum Einsammeln.");S.pendingPoints-=amount;S.points+=amount;S.lifetimePointsEarned+=amount;raiseScore(Math.max(1,Math.floor(Math.log10(1+amount)*2)));awardMainXp(Math.min(12,1+Math.floor(Math.log10(1+amount))),"BigCards.kl Collect",`bc-collect-${Math.floor(now()/5000)}`);persist();refresh();toast(`+${fmt(amount)} Points eingesammelt`);}

  function dailyKey(){const d=new Date();return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;}
  function ensureDaily(){const key=dailyKey();if(S.daily?.day!==key)S.daily={day:key,opened:0,upgraded:0,newCards:0,claimed:{}};}
  function dailyQuestHtml(){ensureDaily();const quests=[{id:"packs",label:"5 Packs öffnen",v:S.daily.opened||0,max:5,reward:"250 Shards"},{id:"up",label:"2 Karten upgraden",v:S.daily.upgraded||0,max:2,reward:"500 Shards"},{id:"new",label:"3 neue Karten finden",v:S.daily.newCards||0,max:3,reward:"Basic Aura"}];return quests.map(q=>`<div class="bc-quest"><div><b>${q.label}</b><small>${Math.min(q.v,q.max)}/${q.max} · ${q.reward} · <strong>+50 Haupt-XP</strong></small></div>${q.v>=q.max&&!S.daily.claimed[q.id]?`<button data-bc-claim="${q.id}">Holen</button>`:`<span>${S.daily.claimed[q.id]?"✓":"…"}</span>`}</div>`).join("")}
  function claimDaily(id){
    ensureDaily();if(S.daily.claimed[id])return;
    const req=id==="packs"?5:id==="up"?2:3,val=id==="packs"?S.daily.opened:id==="up"?S.daily.upgraded:S.daily.newCards;
    if((val||0)<req)return;
    if(id==="packs")S.shards+=250;if(id==="up")S.shards+=500;if(id==="new")S.auraInventory.basic=(S.auraInventory.basic||0)+1;
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
    if(!inst)return"";const aura=auraBy(inst.aura),combat=combatAuraBy(inst.combatAura);if(!aura&&!combat)return"";
    return `<span class="bc-card-effect-badges">${aura?`<span class="bc-mini-effect aura" title="${esc(aura.name)}">${aura.icon}</span>`:""}${combat?`<span class="bc-mini-effect combat" title="${esc(combat.name)}"><span class="bc-cross-weapons"><i class="blade">🗡</i><i class="axe">🪓</i></span><small>⚔</small></span>`:""}</span>`;
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
  function sellCard(id){const inst=instance(id);if(!inst)return;if(inst.broken)return toast("Repariere die Karte vor dem Verkauf.");if(inst.favorite||inst.locked)return toast("Favorisierte/gesperrte Karten können nicht verkauft werden.");if(S.floors.flat().includes(id))return toast("Nimm die Karte zuerst vom Stockwerk.");if(inst.listed)return toast("Die Karte ist im Online-Marktplatz gelistet.");const m=cardMeta(inst),warning=(inst.aura||inst.combatAura||inst.bind)?"\nAura/Kampf-Aura/Bindung werden mitverkauft. Entferne sie vorher, wenn du sie behalten willst.":"";if(!confirm(`${m.name} für ${fmt(m.value)} Points verkaufen?${warning}\nDer Verkauf ist endgültig.`))return;delete S.instances[id];S.points+=m.value;persist();refresh();closeModal();toast(`+${fmt(m.value)} Points`);}
  function shredDuplicate(id){const inst=instance(id);if(!inst||inst.favorite||inst.locked||S.floors.flat().includes(id)||inst.listed)return;const gain=Math.max(1,Math.round((inst.exclusive?20:inst.rarity+1)*4/Math.max(.3,Math.sqrt(cardMeta(inst).rarityValue))));delete S.instances[id];S.shards+=gain;persist();refresh();toast(`+${gain} Card Shards`);}

  function findCardPlacement(id){for(let floor=0;floor<S.floors.length;floor++){const slot=S.floors[floor].indexOf(id);if(slot>=0)return {floor,slot};}return null;}
  function sameVariantOnFloor(inst,floor,excludeId=null){if(!inst||!S.floors[floor])return null;const key=collectionKey(inst);for(const id of S.floors[floor]){if(!id||id===excludeId)continue;const other=instance(id);if(other&&collectionKey(other)===key)return other;}return null;}
  function placeCard(id,floor=UI.floor,slot=UI.selectedSlot){
    const inst=instance(id);if(!inst)return;if(inst.listed)return toast("Diese Karte ist im Online-Marktplatz gesperrt.");if(floor>=S.unlockedFloors)return toast("Stockwerk noch gesperrt.");
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
    const sorted=Object.values(S.instances).filter(x=>!x.listed&&(x.exclusive||x.rarity<=max||x.fieldPermit)&&!used.has(x.id)).sort((a,b)=>effectivePoints(b)-effectivePoints(a));
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

    S.totalRebirths++;S.phaseRebirths=nextLocal;S.points=0;S.pendingPoints=0;S.level=1;S.xp=0;
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

  function tick(){if(!S)return;const t=performance.now(),dt=Math.min(2,(t-lastTick)/1000);lastTick=t;if(!UI.overlay)return;const stepReset=syncCollectorPointStep(),act=activeInstances();let pending=0,direct=0,xp=0;for(const inst of act){const p=effectivePoints(inst)*dt;if((S.autoCollectorUntil||0)>now()||inst.shiny>=3)direct+=p;else pending+=p;xp+=effectiveXp(inst)*dt}if(direct){S.points+=direct;S.lifetimePointsEarned+=direct}S.pendingPoints+=pending;addXp(xp);updateScoreHighWater();S.lastSeen=now();if(t-UI.lastHeader>700){UI.lastHeader=t;refreshHeader();refreshFieldLive();if(UI.tab==="battle"){const btn=UI.overlay.querySelector("[data-bc-battle-start]"),left=Math.max(0,Math.ceil(((S.battleCooldownUntil||0)-now())/1000));if(btn){btn.disabled=left>0;btn.textContent=left?`Nächster Kampf in ${left}s`:"⚔ Kampf starten";}}}if(stepReset||Math.random()<.06)persist();}
  function autoTick(){if(!UI.overlay||!S.autoEnabled||(S.autoOpenerUntil||0)<=now())return;const ri=RARITY_INDEX[S.autoPack]??0,r=RARITIES[ri];if(ri<=rarityUnlockedIndex()&&S.points>=r.price&&!UI.packReveal)openNormalPack(ri,"points");}
  function applyOffline(){const delta=Math.min(MAX_OFFLINE_MS,Math.max(0,now()-(S.lastSeen||now())));if(delta<30000)return;const gain=productionPerSecond()*(delta/1000)*OFFLINE_RATE;if(gain>0){S.points+=gain;S.lifetimePointsEarned+=gain;setTimeout(()=>toast(`Offline-Ertrag: +${fmt(gain)} Points (${Math.round(OFFLINE_RATE*100)} %)`,5000),400)}S.lastSeen=now();persist();}

  function battleCards(includeBroken=true){return Object.values(S.instances).filter(x=>x&&!x.listed&&(includeBroken||!x.broken)).sort((a,b)=>{const au=battleCardUnlocked(a),bu=battleCardUnlocked(b),as=combatStats(a),bs=combatStats(b);if(au!==bu)return au?-1:1;if(!!a.broken!==!!b.broken)return a.broken?1:-1;if(au)return bs.tier-as.tier||bs.power-as.power||b.level-a.level;return as.tier-bs.tier||bs.power-as.power||b.level-a.level;});}
  function ensureBattleCard(){const current=instance(UI.battleCard);if(current&&!current.listed&&!current.broken&&battleCardUnlocked(current))return current;const first=battleCards(false).find(battleCardUnlocked)||null;UI.battleCard=first?.id||null;return first;}
  function showBattlePicker(){const cards=battleCards(true).slice(0,200),maxTier=battleUnlockedTier();showModal(`<div class="bc-battle-picker"><small>DEINE KARTEN</small><h2>Kampfkarte wählen</h2><p>Aktuell freigeschaltet bis <b>${RARITIES[maxTier].name}</b>. Höhere Karten werden über die Kartenkampf-Stufe freigeschaltet. Exclusive-Karten zählen nach ihrer aktuellen Account-Kampfstufe.</p><div class="bc-battle-picker-grid">${cards.length?cards.map(inst=>{const m=cardMeta(inst),profile=combatAbilityProfile(inst),specials=profile.specials.filter(x=>inst.level>=(x.req||1)).length,locked=!battleCardUnlocked(inst),disabled=inst.broken||locked;return `<button data-bc-battle-pick="${inst.id}" class="${m.className} ${inst.broken?"broken":""} ${locked?"battle-locked":""}" ${disabled?"disabled":""}><span>${m.icon}</span><b>${esc(m.name)}</b><small>${inst.exclusive?`EXCLUSIVE · Kampfstufe ${battleTierLabel(inst)}`:m.rarity.name} · Lv ${inst.level}/5</small><small>⚔ ${fmt(m.combat.power)} · ${fmt(m.combat.min)}–${fmt(m.combat.max)} Schaden · ${specials} Special${specials===1?"":"s"}</small>${locked?`<em>🔒 Kartenkampf erst bis ${RARITIES[maxTier].name} freigeschaltet</em>`:inst.broken?`<em>💥 KAPUTT · in Sammlung reparieren</em>`:""}</button>`}).join(""):`<div class="bc-empty-state"><span>🃏</span><h3>Noch keine Karte vorhanden</h3></div>`}</div></div>`);}
  function upgradeBattleTier(){
    if(UI.battleSession)return toast("Während eines laufenden Kampfes kann die Kartenkampf-Stufe nicht erhöht werden.");
    const info=battleUpgradeInfo();if(info.max||!info.next)return toast("Alle Kartenkampf-Raritäten sind bereits freigeschaltet.");
    if(info.wins<info.next.wins)return toast(`Noch ${info.next.wins-info.wins} Sieg${info.next.wins-info.wins===1?"":"e"} mit ${RARITIES[info.current].name}-Karten nötig.`);
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
  function startBattle(){
    const player=ensureBattleCard();
    if(!player)return toast("Du brauchst zuerst mindestens eine Karte für den Kartenkampf.");
    if(player.broken)return toast("Diese Karte ist kaputt. Repariere sie zuerst in der Sammlung.");
    if(!battleCardUnlocked(player))return toast(`${battleTierLabel(player)}-Karten sind im Kartenkampf noch gesperrt. Verbessere zuerst deine Kartenkampf-Stufe.`);
    if(UI.battleSession)return toast("Der Kampf läuft bereits.");
    if((S.battleCooldownUntil||0)>now())return toast(`Nächster Kampf in ${Math.ceil((S.battleCooldownUntil-now())/1000)} Sek.`);
    const enemy=makeBattleEnemy(player),ps=combatStats(player),es=combatStats(enemy),pm=cardMeta(player),em=cardMeta(enemy);
    UI.battleResult=null;
    UI.battleSession={id:uid(),playerId:player.id,enemy,playerHp:ps.hp,enemyHp:es.hp,playerState:battleActorState(),enemyState:battleActorState(),turn:"player",round:1,log:[`Gegner aufgedeckt: ${em.name} · ${RARITIES[enemy.rarity]?.name||"Karte"} · Lv ${enemy.level}.`],startedAt:now()};
    refresh(true);
    toast(enemy.difficultyShift>0?"Achtung: Dieser Gegner ist stärker als deine aktuelle Kampfstufe.":enemy.difficultyShift<0?"Dieser Gegner ist etwas schwächer.":"Gegner aufgedeckt – du beginnst.",3000);
  }
  function performPlayerBattleAction(abilityId){
    const session=UI.battleSession;if(!session||session.turn!=="player")return;
    const player=instance(session.playerId);if(!player||player.broken){UI.battleSession=null;return refresh(false)}
    const abilities=combatAbilities(player,session.playerState),ability=abilities.find(x=>x.id===abilityId);if(!ability||ability.locked)return toast("Diese Fähigkeit ist gerade nicht verfügbar.");
    if(!ability.normal&&player.level<(ability.req||1))return toast(`Diese Fähigkeit wird erst auf Kartenstufe ${ability.req} freigeschaltet.`);
    const pm=cardMeta(player),dmg=abilityDamage(player,pm.combat,ability);session.enemyHp=Math.max(0,session.enemyHp-dmg);applyAbilityUse(player,session.playerState,ability);session.log.push(`Du: ${ability.icon} ${ability.name} → ${fmt(dmg)} Schaden.`);session.log=session.log.slice(-12);
    if(session.enemyHp<=0)return finishBattle(true);
    session.turn="enemy";refresh(true);clearTimeout(UI.battleEnemyTimer);const sid=session.id;UI.battleEnemyTimer=setTimeout(()=>enemyBattleTurn(sid),520);
  }
  function enemyBattleTurn(sessionId){
    const session=UI.battleSession;if(!session||session.id!==sessionId||session.turn!=="enemy")return;
    const player=instance(session.playerId),enemy=session.enemy;if(!player||!enemy)return;
    const choices=combatAbilities(enemy,session.enemyState),specials=choices.filter(x=>!x.normal&&!x.locked&&enemy.level>=(x.req||1));
    let ability=choices[0];if(specials.length&&Math.random()<Math.min(.82,.52+enemy.rarity*.025))ability=specials[Math.floor(Math.random()*specials.length)];
    const em=cardMeta(enemy),dmg=abilityDamage(enemy,em.combat,ability);session.playerHp=Math.max(0,session.playerHp-dmg);applyAbilityUse(enemy,session.enemyState,ability);session.log.push(`Gegner: ${ability.icon} ${ability.name} → ${fmt(dmg)} Schaden.`);session.log=session.log.slice(-12);
    if(session.playerHp<=0)return finishBattle(false);
    session.round++;session.turn="player";refresh(true);
  }
  function finishBattle(won){
    const session=UI.battleSession;if(!session)return;clearTimeout(UI.battleEnemyTimer);UI.battleEnemyTimer=0;
    const player=instance(session.playerId),enemy=session.enemy,pm=player?cardMeta(player):null,em=cardMeta(enemy),es=em.combat;
    const rewardPoints=won?Math.max(75,Math.round((es.tier+1)*70*(player?.level||1))):0,rewardShards=won?Math.max(1,1+Math.floor(es.tier/3)):0,firstWin=won&&(S.battleWins||0)===0;
    if(won){S.battleWins=(S.battleWins||0)+1;S.battleStreak=(S.battleStreak||0)+1;S.battleBestStreak=Math.max(S.battleBestStreak||0,S.battleStreak);S.points+=rewardPoints;S.shards+=rewardShards;addXp(16+(es.tier+1)*4);raiseScore(55+(es.tier+1)*22);if(firstWin)S.combatAuraInventory.basic=(S.combatAuraInventory.basic||0)+1;const progressTier=battleUnlockedTier();if(progressTier<RARITIES.length-1&&player&&combatTier(player)===progressTier)S.battleTierWins=(S.battleTierWins||0)+1;}
    else{S.battleLosses=(S.battleLosses||0)+1;S.battleStreak=0;addXp(5+(es.tier+1));if(player){player.broken=true;player.brokenAt=now();}}
    S.battleCooldownUntil=now()+2200;
    UI.battleResult={won,round:session.round,playerId:player?.id||null,playerBroken:!won&&!!player,player:{name:pm?.name||"Karte",icon:pm?.icon||"🃏",className:pm?.className||"",hp:session.playerHp,maxHp:pm?.combat.hp||0,power:pm?.combat.power||0,min:pm?.combat.min||0,max:pm?.combat.max||0},enemy:{name:em.name,icon:em.icon,className:em.className,hp:session.enemyHp,maxHp:es.hp,power:es.power,min:es.min,max:es.max,level:enemy.level},rewardPoints,rewardShards,firstWin,log:session.log.slice(-12)};
    UI.battleSession=null;persist();refresh(true);toast(won?`Sieg! +${fmt(rewardPoints)} Points · +${rewardShards} Shards${firstWin?" · Basic Kampf Aura erhalten!":""}`:"Niederlage – deine Kampfkarte ist zerbrochen und muss in der Sammlung repariert werden.",4400);
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
  function navItems(){const items=[["field","Spielfeld"],["packs","Packs"],["collection","Sammlung"],["shop","Shop"],["market","Markt"],["score","Beste Spieler"],["battle","Kartenkampf"]];if(UI.role==="owner")items.push(["mod","Mod"]);return items;}
  function renderNav(){const nav=UI.overlay?.querySelector("[data-bc-nav]");if(!nav)return;nav.innerHTML=navItems().map(([id,label])=>`<button data-bc-tab="${id}" class="${UI.tab===id?"active":""}">${label}</button>`).join("");}
  function renderShell(){return `<div class="bc-shell"><header class="bc-header"><div class="bc-brand"><button class="bc-back" data-bc-close>←</button><div><small>JK.GAMES · TOP GAME</small><h1>BigCards<span>.kl</span></h1></div></div><div class="bc-head-stats" data-bc-head-stats></div></header><nav class="bc-nav" data-bc-nav></nav><main class="bc-main" data-bc-main></main><div class="bc-toast" data-bc-toast></div></div>`}
  function refreshHeader(){const el=UI.overlay?.querySelector("[data-bc-head-stats]");if(!el)return;const need=xpNeed(S.level),prod=productionPerSecond();el.innerHTML=`<div><small>POINTS</small><b>${fmt(S.points)}</b></div><div><small>PRODUKTION</small><b>+${fmt(prod)}/s</b></div><div><small>LEVEL</small><b>${S.level}</b><em>${Math.floor(S.xp)}/${fmt(need)} XP</em></div><div><small>REBIRTH</small><b>${S.totalRebirths} · x${fmt(rebirthMultiplier())}</b></div><div><small>SAMMLUNG</small><b>${scorePct(overallCollectionScore())}</b></div>`}
  function refreshFieldLive(){if(UI.tab!=="field"||!UI.overlay)return;const collected=UI.overlay.querySelector("[data-bc-collect] b");if(collected)collected.textContent=fmt(S.pendingPoints);const auto=UI.overlay.querySelector(".bc-auto");if(!auto)return;const timer=auto.querySelector(":scope > b"),button=auto.querySelector("[data-bc-buy-collector]"),remaining=collectorRemainingMinutes();if(timer)timer.textContent=timeLeft(S.autoCollectorUntil);if(button){button.disabled=remaining>=15;button.textContent=remaining>=15?"Point-Verlängerung bei < 15 Min Restzeit":`${fmt(collectorPointPrice())} Points = +1 Min`;}}
  function rememberViewScroll(){if(!UI.overlay)return;const main=UI.main||UI.overlay.querySelector("[data-bc-main]");if(main)UI.mainScroll[UI.tab]=Math.max(0,main.scrollTop||0);const rarity=UI.overlay.querySelector("[data-bc-rarity-tabs]");if(rarity)UI.rarityScroll=Math.max(0,rarity.scrollLeft||0);}
  function restoreViewScroll(preserve=true){requestAnimationFrame(()=>{if(!UI.overlay)return;const main=UI.main||UI.overlay.querySelector("[data-bc-main]");if(main)main.scrollTop=preserve?Math.min(Math.max(0,Number(UI.mainScroll[UI.tab])||0),Math.max(0,main.scrollHeight-main.clientHeight)):0;const rarity=UI.overlay.querySelector("[data-bc-rarity-tabs]");if(rarity){const max=Math.max(0,rarity.scrollWidth-rarity.clientWidth);rarity.scrollLeft=Math.min(Math.max(0,Number(UI.rarityScroll)||0),max);}});}
  function refresh(preserve=true){if(!UI.overlay)return;if(preserve)rememberViewScroll();refreshHeader();renderNav();renderMain();restoreViewScroll(preserve);}
  function renderMain(){const el=UI.main||UI.overlay?.querySelector("[data-bc-main]");if(!el)return;UI.main=el;if(UI.tab==="mod"&&UI.role!=="owner")UI.tab="field";if(UI.tab==="field")el.innerHTML=fieldHtml();else if(UI.tab==="packs")el.innerHTML=packsHtml();else if(UI.tab==="collection")el.innerHTML=collectionHtml();else if(UI.tab==="shop")el.innerHTML=shopHtml();else if(UI.tab==="market")el.innerHTML=marketHtml();else if(UI.tab==="score")el.innerHTML=scoreHtml();else if(UI.tab==="battle")el.innerHTML=battleHtml();else if(UI.tab==="mod"&&UI.role==="owner")el.innerHTML=modHtml();else el.innerHTML=fieldHtml();}
  function fieldHtml(){const floor=UI.floor,max=floorMaxTier(floor),phase=FLOOR_PHASES[floor];const slots=S.floors[floor]||[];return `<section class="bc-atlas"><div class="bc-atlas-toolbar"><div><small>AKTIVES STOCKWERK</small><div class="bc-floor-tabs">${Array.from({length:4},(_,i)=>`<button data-bc-floor="${i}" class="${floor===i?"active":""}" ${i>=S.unlockedFloors?"disabled":""}>${i+1}</button>`).join("")}</div></div><div><small>FREIGESCHALTET BIS</small><b>${RARITIES[max]?.symbol||"🔒"} ${RARITIES[max]?.name||"Gesperrt"}</b></div><div class="bc-field-actions"><button data-bc-smart>⚡ Bestes Setup</button><small>💡 Karte gedrückt halten und auf einen anderen Platz ziehen</small></div></div><div class="bc-map-stage"><div class="bc-map-deco bc-citadel"><span>🏰</span><b>${phase?.name||"Stockwerk"}</b><small>Stockwerk ${floor+1}</small></div><div class="bc-map-path"></div><div class="bc-slot-column left">${slots.slice(0,5).map((id,i)=>slotHtml(id,i)).join("")}</div><div class="bc-slot-column right">${slots.slice(5,10).map((id,i)=>slotHtml(id,i+5)).join("")}</div><button class="bc-collector" data-bc-collect><small>GESAMMELT</small><b>${fmt(S.pendingPoints)}</b><span>Einsammeln</span></button></div><div class="bc-field-bottom"><div class="bc-level-panel"><small>BIGCARDS LEVEL</small><b>Level ${S.level}</b><div><i style="width:${Math.min(100,S.xp/xpNeed(S.level)*100)}%"></i></div><span>${fmt(S.xp)} / ${fmt(xpNeed(S.level))} XP</span></div><button class="bc-rebirth ${S.level>=100?"ready":"locked"}" data-bc-rebirth><small>${S.level>=100?"BEREIT":"🔒 GESPERRT BIS LEVEL 100"}</small><b>REBIRTH</b><span>Level ${S.level} / 100 · x${fmt(rebirthMultiplier())}</span></button><div class="bc-auto"><small>AUTO-COLLECTOR</small><b>${timeLeft(S.autoCollectorUntil)}</b><button data-bc-buy-collector ${collectorRemainingMinutes()>=15?"disabled":""}>${collectorRemainingMinutes()>=15?"Point-Verlängerung bei < 15 Min Restzeit":`${fmt(collectorPointPrice())} Points = +1 Min`}</button><em>Startet nach vollständigem Ablauf wieder günstig. Jede zusätzlich vorgemerkte Point-Minute wird deutlich teurer.</em></div></div><section class="bc-daily"><h3>Daily Card Quests</h3>${dailyQuestHtml()}</section></section>`}
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
  function shopHtml(){const auraCount=Object.values(S.auraInventory).reduce((a,b)=>a+b,0),combatAuraCount=Object.values(S.combatAuraInventory).reduce((a,b)=>a+b,0);return `<section class="bc-section"><div class="bc-section-title"><div><small>MARKTHALLE AM KARTENHAFEN</small><h2>BigCards Shop</h2><p>Packs, Upgrades, Ausrüstung, Verkauf und Komfort.</p></div><button class="bc-jk" data-bc-jkshop>JK/Coin-Shop öffnen</button></div><div class="bc-shop-panels"><article><span>📦</span><h3>Packs</h3><p>Alle Point-Packs und JK-Coin-Varianten.</p><button data-bc-tab="packs">Zu den Packs</button></article><article><span>⚒️</span><h3>Karten verbessern</h3><p>Level 1–5 mit Duplikaten + Points. Zerbrochene Karten brauchen ein passendes Reparatur-Kit.</p><div class="bc-shop-dual-actions"><button data-bc-tab="collection">Sammlung öffnen</button><button class="bc-rep-short" data-bc-repair-shop>Rep.</button></div><small class="bc-repair-stock">Reparatur-Kits im Inventar: ${Object.values(S.repairKits||{}).reduce((a,b)=>a+(Number(b)||0),0)}</small></article><article class="bc-shop-info-card"><button class="bc-shop-info" data-bc-equipment-info="aura" title="Info zu Auras" aria-label="Info zu Auras">i</button><span>✦</span><h3>Auras</h3><p>Points-Auras: ${auraCount} · Kampf-Auras: ${combatAuraCount}</p><button data-bc-equipment="aura">Auras verwalten</button></article><article class="bc-shop-info-card"><button class="bc-shop-info" data-bc-equipment-info="bind" title="Info zu Bindungen" aria-label="Info zu Bindungen">i</button><span>🔗</span><h3>Bindungen</h3><p>Nur internes XP. Maximal x3. Inventar: ${Object.values(S.bindInventory).reduce((a,b)=>a+b,0)}</p><button data-bc-equipment="bind">Bindungen verwalten</button></article><article class="bc-shop-info-card"><button class="bc-shop-info" data-bc-equipment-info="shiny" title="Info zu Shiny" aria-label="Info zu Shiny">i</button><span>⚡</span><h3>Shiny</h3><p>Electric ab Lv3 · Explosive ab Lv4 · Void ab Lv5.</p><button data-bc-equipment="shiny">Shiny verwalten</button></article><article><span>♻️</span><h3>Card Shards</h3><p>${fmt(S.shards)} Shards. Zerlege nicht benötigte Duplikate im Kartendetail.</p><button data-bc-shards-info>Info</button></article></div><div class="bc-rebirth-shop"><div><small>REBIRTH CENTER</small><h3>${S.level>=100?"Normaler Rebirth bereit":"🔒 Gesperrt bis Level 100"}</h3><p>Aktuell Level ${S.level}. Rebirth behält Karten, Sammlung, Upgrades, Auras, Kampf-Auras, Bindungen und Shiny.</p><button data-bc-rebirth ${S.level<100?"disabled":""}>Normaler Rebirth</button></div><div><small>JK/COIN SKIP</small><h3>Rebirth für exakt 300 JK-Coins</h3><p>Überspringt nur die Level-100-Anforderung und zählt als vollständiger Rebirth.</p><button data-bc-rebirth-skip>300 JK/Coin</button></div></div></section>`}
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
  function battleHtml(){
    const selected=ensureBattleCard(),m=selected?cardMeta(selected):null,r=UI.battleResult,session=UI.battleSession,cooldown=Math.max(0,Math.ceil(((S.battleCooldownUntil||0)-now())/1000));
    const player=session?instance(session.playerId):selected,pm=player?cardMeta(player):m,enemy=session?.enemy||null,em=enemy?cardMeta(enemy):null;
    const playerHp=session?session.playerHp:(pm?.combat.hp||0),enemyHp=session?session.enemyHp:(em?.combat.hp||0),playerPct=session&&pm?.combat.hp?clamp(playerHp/pm.combat.hp*100,0,100):100,enemyPct=session&&em?.combat.hp?clamp(enemyHp/em.combat.hp*100,0,100):100;
    const abilities=session&&player?combatAbilities(player,session.playerState):[];
    const battleProgress=battleUpgradeInfo(),currentBattleRarity=RARITIES[battleProgress.current],nextBattleRarity=battleProgress.next?RARITIES[battleProgress.next.unlock]:null,progressPct=battleProgress.next?clamp(battleProgress.wins/battleProgress.next.wins*100,0,100):100;
    const playerCard=selected?`<article class="bc-battle-fighter ${m.className} ${selected.broken?"broken":""}"><small>DEINE KAMPFKARTE</small><div class="bc-battle-icon">${m.icon}${cardEffectBadges(selected)}${selected.broken?'<span class="bc-card-crack" aria-hidden="true"></span>':""}</div><h3>${esc(m.name)}</h3><b>⚔ Kampfwert ${fmt(m.combat.power)}</b><span>Schaden ${fmt(m.combat.min)}–${fmt(m.combat.max)} · Leben ${fmt(m.combat.hp)}</span><em>${selected.exclusive?`EXCLUSIVE · skaliert mit Account-Level ${S.level}`:`${m.rarity.name}`} · Kartenstufe ${selected.level}/5${selected.combatAura?` · ${combatAuraBy(selected.combatAura)?.name}`:""}</em>${selected.broken?`<div class="bc-battle-broken"><b>💥 KARTE KAPUTT</b><span>Reparatur: 1× ${repairKitMeta(repairKitId(selected)).name} + ${fmt(repairCost(selected))} Points</span><div class="bc-battle-broken-actions"><button data-bc-battle-picker>Andere Karte wählen</button><button data-bc-battle-repair="${selected.id}">In Sammlung reparieren</button></div></div>`:`<div class="bc-battle-actions"><button data-bc-battle-picker>Karte wechseln</button><button class="primary" data-bc-battle-start ${cooldown||session?"disabled":""}>${session?"Kampf läuft":cooldown?`Nächster Kampf in ${cooldown}s`:"⚔ Kampf starten"}</button></div>`}</article>`:"";
    const fightPlayer=session&&pm?`<article class="bc-battle-fighter ${pm.className}"><small>DEINE KAMPFKARTE · RUNDE ${session.round}</small><div class="bc-battle-icon">${pm.icon}${cardEffectBadges(player)}</div><h3>${esc(pm.name)}</h3><div class="bc-battle-hp"><span><i style="width:${playerPct}%"></i></span><b>${fmt(playerHp)} / ${fmt(pm.combat.hp)} HP</b></div><small>⚔ ${fmt(pm.combat.power)} · Schaden ${fmt(pm.combat.min)}–${fmt(pm.combat.max)}</small></article>`:"";
    const fightEnemy=session&&em?`<article class="bc-battle-fighter enemy ${em.className}"><small>${enemy.difficultyShift>0?"⚠ STÄRKERER GEGNER":enemy.difficultyShift<0?"SCHWÄCHERER GEGNER":"GEGNER"}</small><div class="bc-battle-icon">${em.icon}</div><h3>${esc(em.name)}</h3><div class="bc-battle-hp"><span><i style="width:${enemyPct}%"></i></span><b>${fmt(enemyHp)} / ${fmt(em.combat.hp)} HP</b></div><span>${RARITIES[enemy.rarity]?.name} · Lv ${enemy.level}/5</span><small>⚔ ${fmt(em.combat.power)} · Schaden ${fmt(em.combat.min)}–${fmt(em.combat.max)}</small></article>`:"";
    const normalAbility=abilities.find(a=>a.normal)||null,specialAbilities=abilities.filter(a=>!a.normal);
    const middleControls=session?`<div class="bc-battle-center-controls"><small class="bc-battle-turn-state ${session.turn}">${session.turn==="player"?(session.playerState.mustNormal?"NORMALER SCHLAG PFLICHT":"DU BIST DRAN"):"GEGNER GREIFT AN …"}</small><div class="bc-battle-control-row"><div class="bc-battle-action-side normal-side">${battleAbilityOrbHtml(normalAbility,player,session)}</div><div class="bc-battle-vs compact"><span>VS</span><small>RUNDE ${session.round}</small></div><div class="bc-battle-action-side special-side count-${specialAbilities.length}">${specialAbilities.length?specialAbilities.map(a=>battleAbilityOrbHtml(a,player,session)).join(""):`<div class="bc-battle-no-special"><span>—</span><small>Kein Special</small></div>`}</div></div><p>${session.playerState.mustNormal?"Nach diesem Schlag werden deine Specials wieder verfügbar.":"Links normal schlagen · rechts Special-Fähigkeiten wählen."}</p></div>`:"";
    const arena=session?`<div class="bc-battle-arena active-fight">${fightPlayer}${middleControls}${fightEnemy}</div><div class="bc-battle-live-panel"><div><small>AKTUELLER KAMPF</small><b>Letzte Aktionen</b></div><div class="bc-battle-live-log">${session.log.slice(-8).map(x=>`<span>${esc(x)}</span>`).join("")}</div></div>`:(selected?`<div class="bc-battle-arena">${playerCard}<div class="bc-battle-vs"><span>VS</span><small>Gegner wird erst nach „Kampf starten“ aufgedeckt</small></div><article class="bc-battle-fighter enemy hidden-enemy"><small>GEGNER</small><div class="bc-battle-icon">❓</div><h3>Noch unbekannt</h3><b>Zufällige Stärke</b><span>Der Gegner kann schwächer, ähnlich oder auch deutlich stärker sein.</span><em>Bei einer Niederlage zerbricht deine Karte.</em></article></div>`:`<div class="bc-empty-state"><span>⚔</span><h3>Keine Kampfkarte vorhanden</h3><p>Öffne ein Pack oder repariere deine kaputten Karten in der Sammlung.</p><button data-bc-tab="collection">Zur Sammlung</button></div>`);
    const progression=`<section class="bc-battle-progression"><div class="bc-battle-progression-head"><div><small>KARTENKAMPF-STUFE ${battleProgress.current+1} / ${RARITIES.length}</small><h3>Freigeschaltet bis ${currentBattleRarity.name}</h3></div>${nextBattleRarity?`<strong>Nächstes Ziel: ${nextBattleRarity.name}</strong>`:`<strong>MAXIMAL</strong>`}</div>${battleProgress.next?`<div class="bc-battle-progress-row"><div><span>Siege mit ${currentBattleRarity.name}-Karten</span><b>${battleProgress.wins} / ${battleProgress.next.wins}</b></div><div class="bc-battle-progress-bar"><i style="width:${progressPct}%"></i></div></div><div class="bc-battle-upgrade-row"><p>Nach ${battleProgress.next.wins} Siegen kannst du <b>${nextBattleRarity.name}</b> für ${fmt(battleProgress.next.cost)} Points freischalten. Siege mit niedrigeren Karten zählen für diese Stufe nicht.</p><button data-bc-battle-upgrade ${battleProgress.wins<battleProgress.next.wins?"disabled":""}>${battleProgress.wins<battleProgress.next.wins?`Noch ${battleProgress.next.wins-battleProgress.wins} Siege`:`${nextBattleRarity.name} freischalten · ${fmt(battleProgress.next.cost)}`}</button></div>`:`<p class="bc-battle-max-note">Alle normalen Kampfraritäten bis Göttlich sind freigeschaltet.</p>`}</section>`;
    const result=r?`<section class="bc-battle-result ${r.won?"win":"loss"}"><div class="bc-battle-result-title"><span>${r.won?"🏆":"💥"}</span><div><small>LETZTER KAMPF · ${r.round} RUNDEN</small><h3>${r.won?"SIEG":"NIEDERLAGE"}</h3><p>${r.won?`+${fmt(r.rewardPoints)} Points · +${r.rewardShards} Shards${r.firstWin?" · Basic Kampf Aura freigeschaltet":""}`:"Deine eingesetzte Karte ist zerbrochen und muss repariert werden."}</p></div></div><div class="bc-battle-result-grid"><article class="${r.player.className}"><b>${esc(r.player.name)}</b><span>Restleben ${fmt(r.player.hp)} / ${fmt(r.player.maxHp)}</span><small>⚔ ${fmt(r.player.power)} · ${fmt(r.player.min)}–${fmt(r.player.max)}</small>${r.playerBroken&&r.playerId?`<button data-bc-battle-repair="${r.playerId}">Zur Reparatur</button>`:""}</article><article class="${r.enemy.className}"><b>${esc(r.enemy.name)}</b><span>Restleben ${fmt(r.enemy.hp)} / ${fmt(r.enemy.maxHp)}</span><small>Lv ${r.enemy.level} · ⚔ ${fmt(r.enemy.power)} · ${fmt(r.enemy.min)}–${fmt(r.enemy.max)}</small></article></div><div class="bc-battle-log">${r.log.map(x=>`<span>${esc(x)}</span>`).join("")}</div></section>`:"";
    return `<section class="bc-section bc-battle"><div class="bc-section-title"><div><small>KARTEN ARENA</small><h2>Kartenkampf</h2><p>Echter rundenbasierter Kampf: du greifst an, danach der Gegner. Niederlagen zerbrechen die eingesetzte Karte.</p></div><div class="bc-battle-record"><b>${S.battleWins||0} Siege</b><span>${S.battleLosses||0} Niederlagen · Serie ${S.battleStreak||0} · Rekord ${S.battleBestStreak||0}</span></div></div>${progression}${arena}${result}</section>`;
  }
  function modHtml(){
    if(UI.role!=="owner")return `<section class="bc-section"><div class="bc-empty-state"><span>🔒</span><h3>BigCards Owner-Testmenü</h3><p>Dieser Bereich ist ausschließlich für den Owner sichtbar.</p></div></section>`;
    const testCards=Object.values(S.instances).filter(Boolean).sort((a,b)=>cardMeta(b).combat.power-cardMeta(a).combat.power).slice(0,180),cardOpts=testCards.map(x=>{const m=cardMeta(x);return `<option value="${x.id}">${esc(m.name)} · ${x.exclusive?"EXCLUSIVE":m.rarity.name} · Lv ${x.level}${x.broken?" · KAPUTT":""}</option>`}).join("");
    return `<section class="bc-section"><div class="bc-section-title"><div><small>OWNER ONLY</small><h2>BigCards Mod-Menü</h2><p>Owner-Testwerkzeuge für Balancing, Karten, Kartenkampf, Ausrüstung und Kaufabläufe.</p></div></div><div class="bc-mod-grid"><label>Points setzen<input type="number" data-bc-mod-points value="${Math.floor(S.points)}"><button data-bc-mod-action="points">Setzen</button></label><label>BigCards Level<input type="number" data-bc-mod-level value="${S.level}"><button data-bc-mod-action="level">Setzen</button></label><label>Rebirths<input type="number" data-bc-mod-rebirth value="${S.totalRebirths}"><button data-bc-mod-action="rebirth">Setzen</button></label><label>Pack geben<select data-bc-mod-pack>${RARITIES.map((r,i)=>`<option value="${i}">${r.name}</option>`).join("")}</select><button data-bc-mod-action="pack">10 Karten ziehen</button></label><label>JK/Coin-Pack-Bestätigung testen<select data-bc-mod-jk-pack>${RARITIES.map((r,i)=>`<option value="${i}">${r.name} · ${r.jk} JK/Coin</option>`).join("")}<option value="exclusive">EXCLUSIVE · 500 JK/Coin</option></select><button data-bc-mod-action="jkPackConfirm">Bestätigung testen</button></label><label>Stockwerk freischalten<select data-bc-mod-floor>${[1,2,3,4].map(x=>`<option>${x}</option>`).join("")}</select><button data-bc-mod-action="floor">Freischalten</button></label><label>Kartenkampf freigeschaltet bis<select data-bc-mod-battle-tier>${RARITIES.map((r,i)=>`<option value="${i}" ${i===battleUnlockedTier()?"selected":""}>${r.name}</option>`).join("")}</select><button data-bc-mod-action="battleTier">Kampfstufe setzen</button></label><label>Siege für nächste Kampfstufe<input type="number" min="0" data-bc-mod-battle-wins value="${Math.floor(S.battleTierWins||0)}"><button data-bc-mod-action="battleTierWins">Siegzähler setzen</button></label><label>Test-Aura<select data-bc-mod-aura>${AURAS.map(a=>`<option value="${a.id}">${a.name}</option>`).join("")}</select><button data-bc-mod-action="aura">Geben</button></label><label>Test-Kampf-Aura<select data-bc-mod-combat-aura>${COMBAT_AURAS.map(a=>`<option value="${a.id}">${a.name}</option>`).join("")}</select><button data-bc-mod-action="combatAura">Geben</button></label><label>Test-Bindung<select data-bc-mod-bind>${BINDS.map(b=>`<option value="${b.id}">${b.name}</option>`).join("")}</select><button data-bc-mod-action="bind">Geben</button></label><label>Reparatur-Kit geben<select data-bc-mod-repair-kit>${REPAIR_KITS.map(k=>`<option value="${k.id}">${k.name} · aktuell ×${repairKitCount(k.id)}</option>`).join("")}</select><button data-bc-mod-action="repairKit">Kit geben</button></label><label>Shiny direkt testen<select data-bc-mod-shiny-card ${cardOpts?"":"disabled"}>${cardOpts||'<option value="">Keine Karte vorhanden</option>'}</select><select data-bc-mod-shiny-level><option value="0">Kein Shiny</option><option value="1">Electric</option><option value="2">Explosive</option><option value="3">Void</option></select><button data-bc-mod-action="shinyTest" ${cardOpts?"":"disabled"}>Shiny setzen</button></label><label>Kartenbruch / Reparatur testen<select data-bc-mod-broken-card ${cardOpts?"":"disabled"}>${cardOpts||'<option value="">Keine Karte vorhanden</option>'}</select><select data-bc-mod-broken-state><option value="broken">Kaputt setzen</option><option value="repair">Reparieren</option></select><button data-bc-mod-action="brokenTest" ${cardOpts?"":"disabled"}>Status setzen</button></label><label>Exclusive Pack<button data-bc-mod-action="exclusive">5 Karten ziehen</button></label><label>Spielstand<button class="danger" data-bc-mod-action="reset">BigCards zurücksetzen</button></label></div></section>`;
  }

  function showCardDetail(id){const inst=instance(id);if(!inst)return;UI.selectedCard=id;const m=cardMeta(inst),dupes=duplicateIds(inst).length,next=inst.level<5?inst.level+1:null,cost=next?upgradeCost(inst,next):0,placement=findCardPlacement(id),permitNeeded=needsFieldPermit(inst,UI.floor),permitCost=fieldPermitCost(inst),repair=inst.broken?repairCost(inst):0,repairKit=inst.broken?repairKitMeta(repairKitId(inst)):null,repairKitOwned=repairKit?repairKitCount(repairKit.id):0;showModal(`<div class="bc-card-detail"><div class="bc-detail-card ${m.className} shiny-${inst.shiny} ${inst.broken?"broken":""}"><div class="bc-card-art"><span>${m.icon}</span>${cardEffectBadges(inst)}${inst.broken?'<span class="bc-card-crack" aria-hidden="true"></span>':""}</div><small>${inst.exclusive?"EXCLUSIVE":m.rarity.name}</small><h2>${esc(m.name)}</h2><b>Raritätswert ${pct(m.rarityValue)}</b><p>Level ${inst.level}/5 · ${fmt(m.points)} Points/s · ${fmt(m.xp)} XP/s</p><p class="bc-combat-value"><b>⚔ Kampfwert ${fmt(m.combat.power)}</b> · Schaden ${fmt(m.combat.min)}–${fmt(m.combat.max)} · Leben ${fmt(m.combat.hp)}</p>${inst.exclusive?`<p class="bc-exclusive-combat-note">Exclusive-Kampfwert folgt deinem aktuellen BigCards-Level ${S.level} · aktuelle Kampfstufe: ${RARITIES[m.combat.tier]?.name||m.combat.tier}</p>`:""}<p>Direkter Kartenwert: ${fmt(m.value)} Points</p>${placement?`<p><b>Aktiv:</b> Stockwerk ${placement.floor+1} · Platz ${placement.slot+1}</p>`:""}${inst.broken?`<div class="bc-repair-box"><b>💥 KARTE ZERBROCHEN</b><span>Im Kartenkampf nicht einsetzbar.</span><span><strong>Benötigt:</strong> 1× ${repairKit.name} · Inventar ×${repairKitOwned}</span><span><strong>Zusätzlich:</strong> ${fmt(repair)} Points</span><div class="bc-repair-box-actions"><button data-bc-repair-card="${id}">🛠️ Karte reparieren</button><button class="secondary" data-bc-repair-shop>Rep-Shop</button></div></div>`:""}</div><div class="bc-detail-actions"><div class="bc-detail-row"><button data-bc-place-card="${id}">Auf Stockwerk ${UI.floor+1} setzen</button><button data-bc-favorite="${id}">${inst.favorite?"★ Favorit":"☆ Favorit"}</button><button data-bc-lock="${id}">${inst.locked?"🔒 Gesperrt":"🔓 Sperren"}</button>${placement?`<button class="bc-remove-field" data-bc-remove-field="${id}">↩ Entfernen</button>`:""}</div><section><h3>Kartenupgrade & Spielfeld</h3>${next?`<p>Stufe ${next}: ${DUPE_COST[next]} Duplikate (${dupes} frei) + ${fmt(cost)} Points</p>`:`<p><b>★★★★★ MAX</b></p>`}<div class="bc-upgrade-field-row">${next?`<button data-bc-upgrade="${id}">Auf Stufe ${next}</button>`:""}${permitNeeded?`<button class="bc-field-permit" data-bc-field-permit="${id}">Für ${fmt(permitCost)} aufs Spielfeld</button>`:inst.fieldPermit?`<span class="bc-field-permit-owned">✓ Vorzeitige Spielfeld-Freigabe</span>`:""}</div>${permitNeeded?`<small class="bc-field-permit-note">${m.rarity.name} ist auf Stockwerk ${UI.floor+1} regulär noch gesperrt. Diese Freigabe gilt dauerhaft nur für dieses Exemplar.</small>`:""}</section><section><h3>Kampffähigkeiten</h3><div class="bc-detail-abilities">${combatAbilities(inst,{mustNormal:false}).map(a=>`<article class="${a.normal?"normal":"special"} ${!a.normal&&inst.level<(a.req||1)?"locked":""}"><span>${a.icon}</span><div><b>${a.name}</b><small>${!a.normal&&inst.level<(a.req||1)?`🔒 Freischaltung auf Stufe ${a.req}`:a.desc}</small></div></article>`).join("")}</div></section><section><h3>Aura-Slot · nur Points</h3><p>${inst.aura?`${auraBy(inst.aura)?.name} x${auraBy(inst.aura)?.mult}`:"Keine Aura"}</p><div class="bc-equip-list">${AURAS.filter(a=>(S.auraInventory[a.id]||0)>0).map(a=>`<button data-bc-equip-aura="${a.id}" data-card="${id}">${a.icon} ${a.name} ×${S.auraInventory[a.id]}</button>`).join("")||"Keine Aura im Inventar."}${inst.aura?`<button data-bc-remove-aura="${id}">Aura entfernen</button>`:""}</div></section><section><h3>Kampf-Aura-Slot · nur Kartenkampf</h3><p>${inst.combatAura?`${combatAuraBy(inst.combatAura)?.name} x${combatAuraBy(inst.combatAura)?.mult} Schaden/Kampfwert`:"Keine Kampf-Aura"}</p><div class="bc-equip-list">${COMBAT_AURAS.filter(a=>(S.combatAuraInventory[a.id]||0)>0).map(a=>`<button data-bc-equip-combat-aura="${a.id}" data-card="${id}">${a.icon} ${a.name} ×${S.combatAuraInventory[a.id]}</button>`).join("")||"Keine Kampf-Aura im Inventar."}${inst.combatAura?`<button data-bc-remove-combat-aura="${id}">Kampf-Aura entfernen</button>`:""}</div></section><section><h3>Bindungs-Slot · nur XP</h3><p>${inst.bind?`${bindBy(inst.bind)?.name} x${bindBy(inst.bind)?.mult}`:"Keine Bindung"}</p><div class="bc-equip-list">${BINDS.filter(b=>(S.bindInventory[b.id]||0)>0).map(b=>`<button data-bc-equip-bind="${b.id}" data-card="${id}">${b.icon} ${b.name} ×${S.bindInventory[b.id]}</button>`).join("")||"Keine Bindung im Inventar."}${inst.bind?`<button data-bc-remove-bind="${id}">Bindung entfernen</button>`:""}</div></section><section><h3>Shiny</h3><p>${["Kein Shiny","Electric Shiny · x1,10 XP","Explosive Shiny · + x1,15 Points","Void Shiny · Auto-Collect"][inst.shiny]}</p>${inst.shiny<3?`<button data-bc-shiny="${id}">Nächste Shiny-Stufe</button>`:"<b>VOID MAX</b>"}</section><div class="bc-detail-row danger-row"><button data-bc-shred="${id}">In Shards zerlegen</button><button class="danger" data-bc-sell="${id}">Für ${fmt(m.value)} Points verkaufen</button></div></div></div>`);}
  function showEquipmentInfo(kind){
    if(kind==="aura")return showModal(`<div class="bc-help-info"><small>AUSRÜSTUNG · INFO</small><h2>Wie funktionieren Auras?</h2><div class="bc-help-grid"><article><span>✦</span><div><h3>Normale Auras</h3><p>Eine normale Aura sitzt im eigenen Aura-Slot einer Karte und verstärkt ausschließlich deren <b>Points-Produktion</b>. Sie verändert weder XP noch Kartenkampf.</p></div></article><article><span>⚔</span><div><h3>Kampf-Auras</h3><p>Kampf-Auras besitzen einen zweiten, getrennten Slot und erhöhen nur <b>Kampfwert und Schaden im Kartenkampf</b>. Normale Aura und Kampf-Aura können gleichzeitig auf derselben Karte liegen.</p></div></article></div><h3>Wie bekomme ich Auras?</h3><ul><li><b>Basic Aura:</b> über die Daily Card Quest „3 neue Karten finden“.</li><li><b>Basic Kampf Aura:</b> wird beim ersten gewonnenen Kartenkampf freigeschaltet.</li><li><b>Galaxy Aura und Cosmic Aura:</b> sind im BigCards-Bereich des JK/Coin-Shops direkt erhältlich.</li><li>Weitere Aura- oder Kampf-Aura-Stufen werden im Inventar angezeigt, sobald dein Account sie über eine BigCards-Belohnung oder Gutschrift erhalten hat.</li></ul><h3>Wie rüste ich sie aus?</h3><p>Öffne <b>Sammlung → Karte</b>. Im Kartendetail findest du den normalen Aura-Slot und den Kampf-Aura-Slot. Entfernst du eine Aura wieder, wandert sie zurück in dein Inventar und geht nicht verloren.</p><button class="bc-primary" data-bc-modal-close>Verstanden</button></div>`);
    if(kind==="bind")return showModal(`<div class="bc-help-info"><small>AUSRÜSTUNG · INFO</small><h2>Wie funktionieren Bindungen?</h2><div class="bc-help-grid single"><article><span>🔗</span><div><h3>XP-Verstärker für eine Karte</h3><p>Eine Bindung sitzt im eigenen Bindungs-Slot und erhöht ausschließlich das <b>interne BigCards-XP</b> dieser Karte. Points-Produktion und Kartenkampf werden dadurch nicht stärker.</p></div></article></div><h3>Wie bekomme ich Bindungen?</h3><ul><li>Im aktuellen Stand ist die <b>Magierbindung x3 XP</b> direkt im BigCards-Bereich des JK/Coin-Shops erhältlich.</li><li>Andere Bindungen erscheinen in deinem Bindungs-Inventar, sobald sie deinem Account als BigCards-Belohnung oder Gutschrift gegeben wurden.</li></ul><h3>Wie rüste ich sie aus?</h3><p>Öffne <b>Sammlung → Karte → Bindungs-Slot</b>. Pro Karte kann genau eine Bindung aktiv sein. Beim Entfernen geht sie zurück ins Inventar.</p><button class="bc-primary" data-bc-modal-close>Verstanden</button></div>`);
    return showModal(`<div class="bc-help-info"><small>KARTENFORTSCHRITT · INFO</small><h2>Wie funktioniert Shiny?</h2><p>Shiny wird <b>nicht aus Packs gezogen</b>. Du entwickelst eine vorhandene Karte direkt im Kartendetail mit Points weiter. Die Shiny-Stufen werden nacheinander freigeschaltet und bleiben dauerhaft auf diesem Kartenexemplar.</p><div class="bc-shiny-info-steps"><article><b>⚡ Electric Shiny</b><span>Kartenlevel 3 erforderlich · x1,10 internes XP.</span></article><article><b>💥 Explosive Shiny</b><span>Kartenlevel 4 erforderlich · zusätzlich x1,15 Points-Produktion.</span></article><article><b>🌑 Void Shiny</b><span>Kartenlevel 5 erforderlich · Points dieser Karte werden automatisch direkt eingesammelt.</span></article></div><p>So geht es: <b>Sammlung → Karte öffnen → Shiny → Nächste Shiny-Stufe</b>. Die Point-Kosten richten sich nach dem Wert der Karte und steigen mit jeder Shiny-Stufe.</p><button class="bc-primary" data-bc-modal-close>Verstanden</button></div>`);
  }
  function showEquipment(kind){if(kind==="shiny"){const cards=Object.values(S.instances).filter(x=>!x.listed).sort((a,b)=>b.level-a.level||effectivePoints(b)-effectivePoints(a)).slice(0,60);return showModal(`<div class="bc-equipment bc-shiny-manager"><div class="bc-manager-title"><div><small>KARTENFORTSCHRITT</small><h2>Shiny verwalten</h2></div><button class="bc-manager-info" data-bc-equipment-info="shiny" title="Shiny Info" aria-label="Shiny Info">i</button></div><p>Wähle eine Karte. Electric ist ab Kartenlevel 3, Explosive ab Level 4 und Void ab Level 5 möglich.</p><div class="bc-shiny-card-list">${cards.length?cards.map(inst=>{const m=cardMeta(inst);return `<button data-bc-card="${inst.id}"><b>${esc(m.name)}</b><small>${inst.exclusive?"EXCLUSIVE":m.rarity.name} · Lv ${inst.level}/5 · Shiny ${inst.shiny}/3</small></button>`}).join(""):`<span>Noch keine Karten vorhanden.</span>`}</div></div>`)}if(kind==="aura")return showModal(`<div class="bc-aura-manager"><div class="bc-aura-manager-head bc-manager-title"><div><small>AUSRÜSTUNG</small><h2>Auras verwalten</h2><p>Links normale Points-Auras, rechts die Kampf-Auras. Beide besitzen einen eigenen Karten-Slot.</p></div><button class="bc-manager-info" data-bc-equipment-info="aura" title="Aura Info" aria-label="Aura Info">i</button></div><div class="bc-aura-split"><section><h3>✦ Normale Auras</h3>${AURAS.map(x=>`<article><span>${x.icon}</span><div><b>${x.name}</b><small>x${x.mult} Points</small></div><strong>×${S.auraInventory[x.id]||0}</strong></article>`).join("")}</section><section class="combat"><h3>⚔ Kampf-Auras</h3>${COMBAT_AURAS.map(x=>`<article><span>${x.icon}</span><div><b>${x.name}</b><small>x${x.mult} Kampf</small></div><strong>×${S.combatAuraInventory[x.id]||0}</strong></article>`).join("")}</section></div><p class="bc-aura-manager-note">Zum Ausrüsten eine konkrete Karte in der Sammlung öffnen.</p></div>`);const list=BINDS,inv=S.bindInventory;showModal(`<div class="bc-equipment"><div class="bc-manager-title"><div><small>XP AUSRÜSTUNG</small><h2>Bindungen</h2></div><button class="bc-manager-info" data-bc-equipment-info="bind" title="Bindungs Info" aria-label="Bindungs Info">i</button></div>${list.map(x=>`<article><span>${x.icon}</span><div><b>${x.name}</b><small>x${x.mult} XP</small></div><strong>×${inv[x.id]||0}</strong></article>`).join("")}<p>Zum Ausrüsten eine konkrete Karte in der Sammlung öffnen.</p></div>`)}
  function showShardInfo(){showModal(`<div class="bc-shards-info"><small>CARD SHARDS</small><h2>So zerlegst du Duplikate</h2><ol><li>Öffne die <b>Sammlung</b>.</li><li>Klicke eine bereits mehrfach vorhandene Karte an. Die Duplikat-Anzahl steht direkt auf der Karte.</li><li>Im Kartendetail drückst du auf <b>„In Shards zerlegen“</b>.</li><li>Favorisierte, gesperrte, auf dem Spielfeld eingesetzte oder online gelistete Exemplare werden geschützt und können nicht versehentlich zerlegt werden.</li></ol><p><b>Aktuell:</b> ${fmt(S.shards)} Card Shards.</p><button data-bc-modal-close>Verstanden</button></div>`);}
  function showModal(html){closeModal();const modal=document.createElement("div");modal.className="bc-modal";modal.dataset.bcModal="1";modal.innerHTML=`<div class="bc-modal-card"><button class="bc-modal-x" data-bc-modal-close>×</button>${html}</div>`;UI.overlay.append(modal)}
  function closeModal(){UI.overlay?.querySelector("[data-bc-modal]")?.remove();}
  function toast(text,ms=2600){const el=UI.overlay?.querySelector("[data-bc-toast]");if(!el)return;el.textContent=text;el.classList.add("show");clearTimeout(UI.toastTimer);UI.toastTimer=setTimeout(()=>el.classList.remove("show"),ms)}
  function timeLeft(until){const ms=Math.max(0,(Number(until)||0)-now());if(!ms)return"Aus";const h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000),s=Math.floor(ms%60000/1000);return h?`${h}h ${m}m`:`${m}:${String(s).padStart(2,"0")}`}

  function bindEvents(){UI.overlay.addEventListener("click",async e=>{const b=e.target.closest("button");if(!b)return;if(now()<UI.suppressClickUntil){e.preventDefault();e.stopPropagation();return;}if(b.dataset.bcClose!==undefined)return returnToTopGames();if(b.dataset.bcTab){if(b.dataset.bcTab==="mod"&&UI.role!=="owner")return toast("Das BigCards-Mod-Menü ist ausschließlich für den Owner.");rememberViewScroll();UI.tab=b.dataset.bcTab;refresh(false);if(UI.tab==="market")loadMarket();if(UI.tab==="score")loadLeaderboard();return}if(b.dataset.bcFloor!==undefined){UI.floor=Number(b.dataset.bcFloor);refresh();return}if(b.dataset.bcSlot!==undefined&&!b.dataset.bcCard){rememberViewScroll();UI.selectedSlot=Number(b.dataset.bcSlot);UI.tab="collection";refresh(false);toast(`Karte für Slot ${UI.selectedSlot+1} auswählen.`);return}if(b.dataset.bcCard)return showCardDetail(b.dataset.bcCard);if(b.dataset.bcCollect!==undefined)return collectPending();if(b.dataset.bcSmart!==undefined)return smartSetup();if(b.dataset.bcOpenPack!==undefined)return openNormalPack(Number(b.dataset.bcOpenPack),b.dataset.currency||"points");if(b.dataset.bcExclusive)return openExclusivePack(b.dataset.bcExclusive);if(b.dataset.bcStartReveal!==undefined){if(UI.packReveal&&UI.packReveal.index<0){UI.packReveal.index=0;return renderReveal()}return}if(b.dataset.bcNextCard!==undefined){UI.packReveal.index++;return renderReveal()}if(b.dataset.bcSkipReveal!==undefined){UI.packReveal.index=UI.packReveal.results.length;return renderReveal()}if(b.dataset.bcCloseReveal!==undefined){UI.packReveal=null;b.closest("[data-bc-reveal]")?.remove();refresh();return}if(b.dataset.bcTier!==undefined){rememberViewScroll();UI.collectionTier=Number(b.dataset.bcTier);UI.collectionPage=0;UI.collectionPageMenu=false;return refresh()}if(b.dataset.bcPageMenu!==undefined){UI.collectionPageMenu=!UI.collectionPageMenu;return refresh()}if(b.dataset.bcPageChoice!==undefined){rememberViewScroll();UI.collectionPage=Math.max(0,Number(b.dataset.bcPageChoice));UI.collectionPageMenu=false;UI.mainScroll.collection=0;return refresh(false)}if(b.dataset.bcPage!==undefined){rememberViewScroll();UI.collectionPage=Math.max(0,Number(b.dataset.bcPage));UI.collectionPageMenu=false;UI.mainScroll.collection=0;return refresh(false)}if(b.dataset.bcRebirth!==undefined)return doRebirth(false);if(b.dataset.bcRebirthSkip!==undefined)return doRebirth(true);if(b.dataset.bcBuyCollector!==undefined)return buyCollectorPoints();if(b.dataset.bcToggleAuto!==undefined)return toggleAuto();if(b.dataset.bcJkshop!==undefined)return window.JKCoinApp?.openForGame?.("bigcards");if(b.dataset.bcRepairShop!==undefined)return showRepairShop();if(b.dataset.bcBuyRepairKit)return buyRepairKit(b.dataset.bcBuyRepairKit);if(b.dataset.bcEquipmentInfo)return showEquipmentInfo(b.dataset.bcEquipmentInfo);if(b.dataset.bcEquipment)return showEquipment(b.dataset.bcEquipment);if(b.dataset.bcShardsInfo!==undefined)return showShardInfo();if(b.dataset.bcBattlePicker!==undefined)return showBattlePicker();if(b.dataset.bcBattlePick){UI.battleCard=b.dataset.bcBattlePick;UI.battleResult=null;UI.battleSession=null;closeModal();refresh(false);return}if(b.dataset.bcBattleStart!==undefined)return startBattle();if(b.dataset.bcBattleUpgrade!==undefined)return upgradeBattleTier();if(b.dataset.bcBattleAction){e.preventDefault();b.blur();return performPlayerBattleAction(b.dataset.bcBattleAction);}if(b.dataset.bcBattleRepair)return openBattleRepair(b.dataset.bcBattleRepair);if(b.dataset.bcRepairCard)return repairCard(b.dataset.bcRepairCard);if(b.dataset.bcPlaceCard)return placeCard(b.dataset.bcPlaceCard);if(b.dataset.bcRemoveField)return removeCardFromField(b.dataset.bcRemoveField);if(b.dataset.bcFavorite){const x=instance(b.dataset.bcFavorite);x.favorite=!x.favorite;persist();return showCardDetail(x.id)}if(b.dataset.bcLock){const x=instance(b.dataset.bcLock);x.locked=!x.locked;persist();return showCardDetail(x.id)}if(b.dataset.bcUpgrade)return upgradeCard(b.dataset.bcUpgrade);if(b.dataset.bcFieldPermit)return unlockAndPlaceCard(b.dataset.bcFieldPermit);if(b.dataset.bcShiny)return upgradeShiny(b.dataset.bcShiny);if(b.dataset.bcEquipAura)return equipAura(b.dataset.card,b.dataset.bcEquipAura);if(b.dataset.bcEquipCombatAura)return equipCombatAura(b.dataset.card,b.dataset.bcEquipCombatAura);if(b.dataset.bcEquipBind)return equipBind(b.dataset.card,b.dataset.bcEquipBind);if(b.dataset.bcRemoveAura)return removeAura(b.dataset.bcRemoveAura);if(b.dataset.bcRemoveCombatAura)return removeCombatAura(b.dataset.bcRemoveCombatAura);if(b.dataset.bcRemoveBind)return removeBind(b.dataset.bcRemoveBind);if(b.dataset.bcSell)return sellCard(b.dataset.bcSell);if(b.dataset.bcShred)return shredDuplicate(b.dataset.bcShred);if(b.dataset.bcModalClose!==undefined)return closeModal();if(b.dataset.bcClaim)return claimDaily(b.dataset.bcClaim);if(b.dataset.bcMarketRefresh!==undefined)return loadMarket(true);if(b.dataset.bcScoreRefresh!==undefined)return loadLeaderboard(true);if(b.dataset.bcListCard)return promptListing(b.dataset.bcListCard);if(b.dataset.bcBuyListing)return buyListing(b.dataset.bcBuyListing);if(b.dataset.bcCancelListing)return cancelListing(b.dataset.bcCancelListing);if(b.dataset.bcRoleRefresh!==undefined)return loadRole(true);if(b.dataset.bcModAction)return modAction(b.dataset.bcModAction)});
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
  function scheduleCloudSave(){clearTimeout(cloudSaveTimer);cloudSaveTimer=setTimeout(syncProfile,1800)}
  async function syncProfile(){const fb=await firebase(),u=await currentUser();if(!fb||!u||!S)return false;try{const profile={userId:u.uid,displayName:await displayName(),lifetimeScore:Math.floor(S.lifetimeScore||0),lifetimePointsEarned:Math.floor(S.lifetimePointsEarned||0),maxLevelEver:Math.floor(S.maxLevelEver||1),totalRebirths:Math.floor(S.totalRebirths||0),highestProductionEver:Math.floor(S.highestProductionEver||0),highestXpProductionEver:Math.floor(S.highestXpProductionEver||0),collectionDiscovered:collectionCount(),exclusiveDiscovered:exclusiveCount(),unlockedFloors:Math.floor(S.unlockedFloors||1),currentProduction:Math.floor(productionPerSecond()),lastUpdated:fb.serverTimestamp()};await fb.setDoc(fb.doc(fb.db,PROFILE_COLLECTION,u.uid),profile,{merge:true});await fb.setDoc(fb.doc(fb.db,CLOUD_SAVE_COLLECTION,u.uid),{uid:u.uid,points:Math.floor(S.points),level:S.level,totalRebirths:S.totalRebirths,lifetimeScore:Math.floor(S.lifetimeScore),collectionDiscovered:collectionCount(),updatedAtMs:now()},{merge:true});return true}catch(e){console.warn("BigCards cloud profile",e);return false}}
  async function loadRole(showToast=false){const fb=await firebase(),u=await currentUser();if(!fb||!u){UI.role="player";if(UI.tab==="mod")UI.tab="field";if(showToast)toast("Firebase-Rolle nicht verfügbar.");return refresh()}try{const snap=await fb.getDoc(fb.doc(fb.db,"staffRoles",u.uid));UI.role=String(snap.data()?.role||"player").toLowerCase();}catch{UI.role="player"}if(UI.role!=="owner"&&UI.tab==="mod")UI.tab="field";refresh();}
  async function loadMarket(show=false){const fb=await firebase();if(!fb){if(show)toast("Firebase nicht verfügbar.");return}try{const q=fb.query(fb.collection(fb.db,MARKET_COLLECTION),fb.where("status","==","active"),fb.limit(40)),snap=await fb.getDocs(q);UI.market=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.price||0)-(b.price||0));if(UI.tab==="market")refresh();if(show)toast(`${UI.market.length} Angebote geladen.`)}catch(e){console.warn(e);if(show)toast("Marktplatz konnte nicht geladen werden.")}}
  async function promptListing(id){const inst=instance(id);if(!inst)return;if(inst.broken)return toast("Kaputte Karten müssen vor dem Marktplatz repariert werden.");const suggested=sellValue(inst),raw=prompt(`${cardMeta(inst).name} online listen.\nPreis in Points:`,String(suggested*2));if(raw==null)return;const price=Math.max(1,Math.floor(Number(raw)||0));if(!price)return;const fb=await firebase(),u=await currentUser();if(!fb||!u)return toast("Für den Online-Marktplatz musst du angemeldet sein.");try{const m=cardMeta(inst),listing={sellerUid:u.uid,sellerName:await displayName(),status:"active",price,feeRate:MARKET_FEE,card:{instanceId:inst.id,name:m.name,rarity:inst.rarity,base:inst.base,rarityValue:m.rarityValue,level:inst.level,aura:inst.aura,combatAura:inst.combatAura,bind:inst.bind,shiny:inst.shiny,exclusive:inst.exclusive,exclusiveId:inst.exclusiveId,basePower:inst.basePower,points:Math.floor(m.points),xp:Math.floor(m.xp),combatPower:Math.floor(m.combat.power),combatMin:Math.floor(m.combat.min),combatMax:Math.floor(m.combat.max)},createdAt:fb.serverTimestamp(),createdAtMs:now()};const ref=await fb.addDoc(fb.collection(fb.db,MARKET_COLLECTION),listing);inst.listed=ref.id;persist();refresh();toast("Karte online gelistet.");loadMarket()}catch(e){console.warn(e);toast("Listing fehlgeschlagen.")}}
  async function cancelListing(id){const listing=UI.market.find(x=>x.id===id);if(!listing||listing.sellerUid!==currentUidSync())return;const fb=await firebase();if(!fb)return toast("Firebase nicht verfügbar.");try{await fb.updateDoc(fb.doc(fb.db,MARKET_COLLECTION,id),{status:"cancelled",cancelledAt:fb.serverTimestamp(),cancelledAtMs:now()});const inst=Object.values(S.instances).find(x=>x.listed===id);if(inst)inst.listed=false;persist();toast("Angebot zurückgenommen.");loadMarket()}catch(e){console.warn(e);toast("Angebot konnte nicht zurückgenommen werden.")}}
  async function buyListing(id){const listing=UI.market.find(x=>x.id===id);if(!listing)return;if(S.points<listing.price)return toast("Nicht genügend Points.");if(!confirm(`${listing.card?.name||"Karte"} für ${fmt(listing.price)} Points kaufen?`))return;const fb=await firebase(),u=await currentUser();if(!fb||!u)return toast("Firebase-Anmeldung erforderlich.");try{await syncProfile();const ref=fb.doc(fb.db,MARKET_COLLECTION,id),buyerSave=fb.doc(fb.db,CLOUD_SAVE_COLLECTION,u.uid),buyerName=await displayName();await fb.runTransaction(fb.db,async tx=>{const [snap,walletSnap]=await Promise.all([tx.get(ref),tx.get(buyerSave)]);if(!snap.exists()||snap.data().status!=="active")throw new Error("Angebot nicht mehr aktiv");if(snap.data().sellerUid===u.uid)throw new Error("Eigenes Angebot");const price=Math.floor(Number(snap.data().price)||0),serverPoints=Math.floor(Number(walletSnap.data()?.points)||0);if(serverPoints<price)throw new Error("Server-Spielstand hat nicht genügend Points. Kurz speichern und erneut versuchen.");tx.update(buyerSave,{points:serverPoints-price,updatedAtMs:now()});tx.update(ref,{status:"sold",buyerUid:u.uid,buyerName,soldAt:fb.serverTimestamp(),soldAtMs:now()});const payout=Math.floor(price*(1-MARKET_FEE));tx.set(fb.doc(fb.db,PAYOUT_COLLECTION,snap.data().sellerUid,"items",id),{listingId:id,sellerUid:snap.data().sellerUid,buyerUid:u.uid,amount:payout,fee:price-payout,status:"pending",createdAt:fb.serverTimestamp()});});S.points-=listing.price;const c=listing.card||{};const added=addInstance({rarity:c.rarity||0,base:c.base||0,exclusive:!!c.exclusive,exclusiveId:c.exclusiveId||null,basePower:c.basePower||null,rarityValue:c.rarityValue||100});added.inst.level=clamp(c.level||1,1,5);added.inst.aura=c.aura||null;added.inst.combatAura=c.combatAura||null;added.inst.bind=c.bind||null;added.inst.shiny=clamp(c.shiny||0,0,3);persist();toast("Karte gekauft.");loadMarket();refresh()}catch(e){console.warn(e);toast(e.message||"Kauf fehlgeschlagen.")}}
  async function claimPayouts(){const fb=await firebase(),u=await currentUser();if(!fb||!u)return;try{const q=fb.query(fb.collection(fb.db,PAYOUT_COLLECTION,u.uid,"items"),fb.where("status","==","pending"),fb.limit(50)),snap=await fb.getDocs(q);let sum=0;for(const d of snap.docs){sum+=Math.max(0,Number(d.data().amount)||0);const sold=Object.values(S.instances).find(x=>x.listed===d.id);if(sold){for(const row of S.floors){const i=row.indexOf(sold.id);if(i>=0)row[i]=null}delete S.instances[sold.id]}await fb.updateDoc(d.ref,{status:"claimed",claimedAt:fb.serverTimestamp()})}if(sum){S.points+=sum;persist();toast(`Marktplatz-Erlös: +${fmt(sum)} Points`)}}catch(e){console.warn("BigCards payout",e)}}
  async function loadLeaderboard(show=false){const fb=await firebase();if(!fb){if(show)toast("Firebase nicht verfügbar.");return}try{const q=fb.query(fb.collection(fb.db,PROFILE_COLLECTION),fb.orderBy("lifetimeScore","desc"),fb.limit(50)),snap=await fb.getDocs(q);UI.leaderboard=snap.docs.map(d=>d.data());if(UI.tab==="score")refresh();if(show)toast("Bestenliste aktualisiert.")}catch(e){console.warn(e);if(show)toast("Bestenliste konnte nicht geladen werden.")}}

  function modAction(action){
    if(UI.role!=="owner")return toast("Owner-Rechte erforderlich.");
    const q=s=>UI.overlay.querySelector(s);
    if(action==="points")S.points=Math.max(0,Number(q("[data-bc-mod-points]")?.value)||0);
    else if(action==="level")S.level=Math.max(1,Math.floor(Number(q("[data-bc-mod-level]")?.value)||1));
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
    else if(action==="aura"){const id=q("[data-bc-mod-aura]")?.value;S.auraInventory[id]=(S.auraInventory[id]||0)+1;}
    else if(action==="combatAura"){const id=q("[data-bc-mod-combat-aura]")?.value;S.combatAuraInventory[id]=(S.combatAuraInventory[id]||0)+1;}
    else if(action==="bind"){const id=q("[data-bc-mod-bind]")?.value;S.bindInventory[id]=(S.bindInventory[id]||0)+1;}
    else if(action==="repairKit"){const id=q("[data-bc-mod-repair-kit]")?.value;if(REPAIR_KIT_BY_ID[id])S.repairKits[id]=repairKitCount(id)+1;}
    else if(action==="shinyTest"){const inst=instance(q("[data-bc-mod-shiny-card]")?.value);if(!inst)return toast("Keine Testkarte gewählt.");inst.shiny=clamp(Math.floor(Number(q("[data-bc-mod-shiny-level]")?.value)||0),0,3);}
    else if(action==="brokenTest"){const inst=instance(q("[data-bc-mod-broken-card]")?.value);if(!inst)return toast("Keine Testkarte gewählt.");const broken=q("[data-bc-mod-broken-state]")?.value!=="repair";inst.broken=broken;inst.brokenAt=broken?now():0;}
    else if(action==="exclusive"){showPackReveal(Array.from({length:5},()=>rollExclusive()),{name:"TEST EXCLUSIVE",test:true,exclusive:true});}
    else if(action==="reset"){if(confirm("BigCards.kl-Spielstand wirklich vollständig zurücksetzen?")){localStorage.removeItem(SAVE_KEY);S=defaultState();}}
    persist();refresh();
  }

  function grantJkCoinPurchase(kind,amount=1){state();const qty=Math.max(1,Math.floor(Number(amount)||1));if(String(kind).startsWith("pack:")){const id=String(kind).split(":")[1];S.jkPackCredits[id]=(S.jkPackCredits[id]||0)+qty}else if(kind==="exclusivePack")S.exclusiveCredits+=qty;else if(kind==="autoOpenerHour")S.autoOpenerUntil=Math.max(now(),S.autoOpenerUntil||0)+qty*3600000;else if(kind==="autoCollectorHour")S.autoCollectorUntil=Math.max(now(),S.autoCollectorUntil||0)+qty*3600000;else if(String(kind).startsWith("aura:")){const id=String(kind).split(":")[1];S.auraInventory[id]=(S.auraInventory[id]||0)+qty}else if(String(kind).startsWith("combatAura:")){const id=String(kind).split(":")[1];S.combatAuraInventory[id]=(S.combatAuraInventory[id]||0)+qty}else if(String(kind).startsWith("bind:")){const id=String(kind).split(":")[1];S.bindInventory[id]=(S.bindInventory[id]||0)+qty}else if(String(kind).startsWith("pointsMinutes:")){const mins=Number(String(kind).split(":")[1])||5;S.points+=Math.max(1000,productionPerSecond()*60*mins)*qty}else return false;persist();if(UI.overlay){refresh();toast("JK/Coin-Kauf in BigCards.kl gutgeschrieben.")}return true;}

  function open(phone){if(UI.overlay)return;state();UI.phone=phone||UI.phone;UI.tab="field";UI.battleResult=null;UI.battleSession=null;UI.floor=Math.min(UI.floor,S.unlockedFloors-1);const overlay=document.createElement("div");overlay.className="bc-overlay";overlay.dataset.bigcardsKl="1";overlay.innerHTML=renderShell();document.body.append(overlay);document.body.classList.add("bigcards-kl-open");UI.overlay=overlay;UI.main=overlay.querySelector("[data-bc-main]");bindEvents();ensureDaily();applyOffline();refresh(false);loadRole();claimPayouts();syncProfile();lastTick=performance.now();clearInterval(tickTimer);tickTimer=setInterval(tick,250);clearInterval(autoTimer);autoTimer=setInterval(autoTick,2400);}
  function close(){if(!UI.overlay)return;clearTimeout(UI.battleEnemyTimer);UI.battleEnemyTimer=0;UI.battleSession=null;clearFieldDragVisuals();UI.drag=null;S.lastSeen=now();persist();syncProfile();window.removeEventListener("keydown",onKey);clearInterval(tickTimer);clearInterval(autoTimer);UI.overlay.remove();UI.overlay=null;UI.main=null;UI.packReveal=null;document.body.classList.remove("bigcards-kl-open")}
  function returnToTopGames(){const phone=UI.phone;close();setTimeout(()=>{if(window.JKGamesOpenTopGames)window.JKGamesOpenTopGames(phone);else if(window.openDeviceInterface&&phone)window.openDeviceInterface(phone,"topgames",false)},80)}

  window.BigCardsKL=Object.freeze({version:VERSION,open,close,returnToTopGames,grantJkCoinPurchase,getState:()=>state(),rarities:RARITIES,baseNames:BASE_NAMES});
})();
