(() => {
  "use strict";

  const VERSION = "2026-08-18-jkcoin-v491-reptisect-price";
  const PURCHASE_COLLECTION = "jkCoinPurchaseRequests";
  const GRANT_COLLECTION = "jkCoinGrants";
  const HYPE_COLLECTION = "jkHypeLeaderboard";
  const FRAGMENTS_PER_COIN = 100;
  const HYPE_MILESTONES = Object.freeze([
    { hype:10000, coins:10 },{ hype:20000, coins:20 },{ hype:30000, coins:30 },{ hype:40000, coins:40 },
    { hype:50000, coins:50 },{ hype:60000, coins:60 },{ hype:70000, coins:70 },{ hype:80000, coins:80 },
    { hype:90000, coins:90 },{ hype:100000, coins:1000 },{ hype:200000, coins:1000 },{ hype:1000000, coins:5000 }
  ]);
  const TOP_GAME_DROP_RULES = Object.freeze({
    runner:{ distance250:[{coins:100,chance:.00002},{coins:50,chance:.0002},{coins:10,chance:.002}] },
    city:{ double6:[{coins:100,chance:.001},{coins:50,chance:.01}] },
    match:{ match4:[{coins:100,chance:.01}],match3:[{coins:50,chance:.0001}] },
    fight:{ boss:[{coins:100,chance:.0001},{coins:50,chance:.01}] },
    dungeon:{ chest:[{coins:100,chance:.0001}] },
    money:{ collectAll:[{coins:100,chance:.000002},{coins:50,chance:.00002},{coins:10,chance:.0002}],cooldownMs:30000 }
  });
  const TOTAL_COLLECTIBLES = 6470;
  const JK_COIN_MIN_RATE = 102076;
  const JK_COIN_MAX_RATE = 232477;
  const PACKS = [
    { id:"pack-100", eur:0.99, coins:100, bonus:0 },
    { id:"pack-600", eur:4.99, coins:600, bonus:19 },
    { id:"pack-1350", eur:9.99, coins:1350, bonus:35 },
    { id:"pack-3500", eur:24.99, coins:3500, bonus:40 },
    { id:"pack-8000", eur:49.99, coins:8000, bonus:58 }
  ];
  const RARITIES = [
    { id:"common", name:"Gewöhnlich", color:"#c6d0d7", count:1000, value:[500,2500] },
    { id:"uncommon", name:"Ungewöhnlich", color:"#6cf0a4", count:1000, value:[2500,10000] },
    { id:"rare", name:"Selten", color:"#56a9ff", count:1000, value:[10000,50000] },
    { id:"epic", name:"Episch", color:"#b467ff", count:1000, value:[50000,200000] },
    { id:"legendary", name:"Legendär", color:"#ffd55f", count:800, value:[200000,1000000] },
    { id:"special", name:"Special", color:"#ff6e84", count:700, value:[1000000,5000000] },
    { id:"mystic", name:"Mystisch", color:"#e76cff", count:500, value:[5000000,20000000] },
    { id:"exotic", name:"Exotisch", color:"#49f2da", count:300, value:[20000000,100000000] },
    { id:"universe", name:"Universe", color:"#dbefff", count:100, value:[100000000,500000000] },
    { id:"blackhole", name:"Black Hole", color:"#9f73ff", count:50, value:[500000000,2500000000] },
    { id:"galaxy", name:"Galaxy", color:"#ff72d7", count:20, value:[2500000000,15000000000] }
  ];
  const NON_GALAXY_BOX_ITEM_CAP = 5667395;
  const COLLECTOR_UNIVERSE_MIN_VALUE = 6000000;
  const COLLECTOR_UNIVERSE_MAX_VALUE = 7000000;
  const COLLECTOR_BLACKHOLE_MIN_VALUE = 7000000;
  const COLLECTOR_BLACKHOLE_MAX_VALUE = 9000000;
  const COLLECTOR_GALAXY_MIN_VALUE = 10000000;
  const COLLECTOR_GALAXY_MAX_VALUE = 15000000;
  const BOXES = [
    // V404: JK/Coin-Lucky-Boxes bleiben klar stärker als die Euro-Stufe darunter; Geld, Haupt-EP und Cashback sind gebremst.
    { id:"reward-100", name:"Starter Lucky Box", cost:150, currency:"jk", type:"reward", tier:"starter", money:[12000,40000], xp:[40,120], clothingGuaranteed:0, clothingChance:.55, skinChance:.04, cashbackChance:.15, cashback:[4,12] },
    { id:"reward-500", name:"Premium Lucky Box", cost:550, currency:"jk", type:"reward", tier:"premium", money:[90000,300000], xp:[180,550], clothingGuaranteed:1, clothingChance:.42, skinChance:.16, cashbackChance:.22, cashback:[8,25] },
    { id:"reward-1000", name:"Elite Lucky Box", cost:1500, currency:"jk", type:"reward", tier:"elite", money:[400000,1200000], xp:[500,1500], clothingGuaranteed:2, clothingChance:.50, skinChance:.30, cashbackChance:.30, cashback:[20,60] },
    { id:"reward-2000", name:"Universe Lucky Box", cost:2500, currency:"jk", type:"reward", tier:"universe", money:[1200000,5500000], xp:[1200,3800], clothingGuaranteed:3, clothingChance:.58, skinChance:.52, cashbackChance:.38, cashback:[40,120] },
    { id:"reward-5000", name:"Galaxy Lucky Box", cost:5500, currency:"jk", type:"reward", tier:"galaxy", money:[80000000,400000000], xp:[3000,10000], clothingGuaranteed:4, clothingChance:.72, skinChance:.90, realGalaxyChance:.025, cashbackChance:.50, cashback:[100,300] },

    // V404: Euro-Lucky-Boxes geben weniger direktes Geld/EP; Premium-Drops bleiben weiterhin möglich.
    { id:"reward-euro-100", name:"Starter Lucky Box · 100K", cost:100000, currency:"euro", type:"reward", tier:"starter", money:[8000,30000], xp:[25,80], clothingGuaranteed:0, clothingChance:.28, skinChance:.018, cashbackChance:0, cashback:[0,0] },
    { id:"reward-euro-500", name:"Premium Lucky Box · 1M", cost:1000000, currency:"euro", type:"reward", tier:"premium", money:[65000,230000], xp:[100,350], clothingGuaranteed:.5, clothingChance:.21, skinChance:.08, cashbackChance:0, cashback:[0,0] },
    { id:"reward-euro-1000", name:"Elite Lucky Box · 10M", cost:10000000, currency:"euro", type:"reward", tier:"elite", money:[320000,1000000], xp:[300,900], clothingGuaranteed:1, clothingChance:.25, skinChance:.15, cashbackChance:0, cashback:[0,0] },
    { id:"reward-euro-2000", name:"Universe Lucky Box · 100M", cost:100000000, currency:"euro", type:"reward", tier:"universe", money:[800000,4000000], xp:[700,2200], clothingGuaranteed:1.5, clothingChance:.30, skinChance:.26, cashbackChance:0, cashback:[0,0] },
    { id:"reward-euro-5000", name:"Galaxy Lucky Box · 1B", cost:1000000000, currency:"euro", type:"reward", tier:"galaxy", money:[55000000,300000000], xp:[1800,6000], clothingGuaranteed:2, clothingChance:.36, skinChance:.45, realGalaxyChance:.012, cashbackChance:0, cashback:[0,0] },

    // Sammler-Kisten mit JK/Coin: bisherige Item-Anzahl und Chancen bleiben bestehen.
    { id:"collect-100", name:"Starter Sammler-Kiste · 100 JK", cost:100, currency:"jk", type:"collect", tier:"basic", items:5, itemValueCap:NON_GALAXY_BOX_ITEM_CAP },
    { id:"collect-500", name:"Premium Sammler-Kiste · 500 JK", cost:500, currency:"jk", type:"collect", tier:"premium", items:10, itemValueCap:NON_GALAXY_BOX_ITEM_CAP },
    { id:"collect-1000", name:"Elite Sammler-Kiste · 1K JK", cost:1000, currency:"jk", type:"collect", tier:"elite", items:15, itemValueCap:NON_GALAXY_BOX_ITEM_CAP },
    { id:"collect-2000", name:"Universe Sammler-Kiste · 2K JK", cost:2000, currency:"jk", type:"collect", tier:"master", items:20, itemValueCap:NON_GALAXY_BOX_ITEM_CAP },
    { id:"collect-5000", name:"Galaxy Sammler-Kiste · 5K JK", cost:5000, currency:"jk", type:"collect", tier:"galaxy", items:25, itemValueCap:NON_GALAXY_BOX_ITEM_CAP },

    // Euro-Sammler-Kisten: gleiche Item-Anzahl, aber wirtschaftlich deutlich strengere Chancen gegen Money-Glitches.
    { id:"collect-euro-100", name:"Starter Sammler-Kiste · 100K", cost:100000, currency:"euro", type:"collect", tier:"basic", economyBalanced:true, items:5, itemValueCap:NON_GALAXY_BOX_ITEM_CAP },
    { id:"collect-euro-500", name:"Premium Sammler-Kiste · 1M", cost:1000000, currency:"euro", type:"collect", tier:"premium", economyBalanced:true, items:10, itemValueCap:NON_GALAXY_BOX_ITEM_CAP },
    { id:"collect-euro-1000", name:"Elite Sammler-Kiste · 10M", cost:10000000, currency:"euro", type:"collect", tier:"elite", economyBalanced:true, items:15, itemValueCap:NON_GALAXY_BOX_ITEM_CAP },
    { id:"collect-euro-2000", name:"Universe Sammler-Kiste · 100M", cost:100000000, currency:"euro", type:"collect", tier:"master", economyBalanced:true, items:20, itemValueCap:NON_GALAXY_BOX_ITEM_CAP },
    { id:"collect-euro-5000", name:"Galaxy Sammler-Kiste · 1B", cost:1000000000, currency:"euro", type:"collect", tier:"galaxy", economyBalanced:true, items:25, itemValueCap:NON_GALAXY_BOX_ITEM_CAP }
  ];
  const COLLECT_CHANCES = {
    basic: { common:100,uncommon:90,rare:80,epic:40,legendary:24,special:11,mystic:8,exotic:5,universe:1,blackhole:.1,galaxy:.001 },
    premium: { common:100,uncommon:100,rare:94,epic:72,legendary:48,special:25,mystic:16,exotic:8,universe:2.5,blackhole:.6,galaxy:.005 },
    elite: { common:100,uncommon:100,rare:100,epic:100,legendary:80,special:50,mystic:30,exotic:5,universe:4,blackhole:2,galaxy:.01 },
    master: { common:100,uncommon:100,rare:100,epic:100,legendary:100,special:80,mystic:60,exotic:30,universe:10,blackhole:5,galaxy:.05 },
    galaxy: { common:100,uncommon:100,rare:100,epic:100,legendary:100,special:100,mystic:100,exotic:75,universe:50,blackhole:30,galaxy:.1 }
  };
  // Euro-Sammlerkisten sind bewusst deutlich konservativer. Besonders bei 100K/1M
  // sind Multi-Millionen-Treffer echte Jackpots statt eine planbare Geldquelle.
  const EURO_COLLECT_CHANCES = {
    basic:   { common:100,uncommon:68,rare:25,epic:1,legendary:.08,special:.001,mystic:.0001,exotic:.00002,universe:.00001,blackhole:.000001,galaxy:.0000001 },
    premium: { common:100,uncommon:94,rare:72,epic:10,legendary:1.5,special:.05,mystic:.002,exotic:.0002,universe:.001,blackhole:.00005,galaxy:.000001 },
    elite:   { common:100,uncommon:100,rare:94,epic:48,legendary:16,special:2,mystic:.3,exotic:.05,universe:.04,blackhole:.004,galaxy:.0001 },
    master:  { common:100,uncommon:100,rare:100,epic:94,legendary:58,special:18,mystic:7,exotic:2.5,universe:.8,blackhole:.12,galaxy:.004 },
    galaxy:  { common:100,uncommon:100,rare:100,epic:100,legendary:94,special:62,mystic:36,exotic:18,universe:8,blackhole:2.5,galaxy:.05 }
  };
  function collectChancesForBox(box){
    if(box?.currency==="euro")return EURO_COLLECT_CHANCES[box?.tier]||EURO_COLLECT_CHANCES.basic;
    const base=COLLECT_CHANCES[box?.tier]||COLLECT_CHANCES.basic;
    const scale=Math.max(0,Number(box?.chanceScale)||1);
    if(scale===1)return base;
    return Object.fromEntries(Object.entries(base).map(([id,value])=>[id,Math.max(0,Number(value)||0)*scale]));
  }
  const GAME_STORE = [
    { game:"runner", id:"runner-board-5", name:"5 Galaxy-Hoverboards", cost:120, text:"Fünf Zusammenstoß-Retter für Runner.KL.", grant:{kind:"hoverboard",amount:5} },
    { game:"runner", id:"runner-board-25", name:"25 Galaxy-Hoverboards", cost:450, text:"Großes Hoverboard-Paket für viele Runs.", grant:{kind:"hoverboard",amount:25} },
    { game:"runner", id:"runner-trail", name:"Galaxy-Laufspur", cost:350, text:"Exklusive kosmische Laufspur für deinen Runner.", grant:{kind:"galaxyTrail",amount:1} },
    { game:"runner", id:"runner-coins-2500", name:"2.500 CB-Coins", cost:120, text:"Runner.KL-Shopguthaben für Outfits und Boards.", grant:{kind:"runnerCoins",amount:2500} },
    { game:"runner", id:"runner-coins-10000", name:"10.000 CB-Coins", cost:390, text:"Großes Runner.KL-Shopguthaben.", grant:{kind:"runnerCoins",amount:10000} },
    { game:"runner", id:"runner-magnet-3", name:"3 Magnet-Starts", cost:150, text:"Die nächsten drei Runs beginnen mit 60 Sekunden Magnet.", grant:{kind:"magnetStart",amount:3} },
    { game:"runner", id:"runner-jetpack-3", name:"3 Raketen-Starts", cost:230, text:"Die nächsten drei Runs beginnen mit 25 Sekunden Raketenrucksack.", grant:{kind:"jetpackStart",amount:3} },
    { game:"runner", id:"runner-shoes-5", name:"5 Power-Schuh-Starts", cost:190, text:"Fünf Runs starten mit 60 Sekunden Power-Schuhen.", grant:{kind:"sneakersStart",amount:5} },
    { game:"runner", id:"runner-mult-5", name:"5 Punkte-Turbo-Starts", cost:220, text:"Fünf Runs starten mit 90 Sekunden doppelten Punkten.", grant:{kind:"multiplierStart",amount:5} },

    { game:"city", id:"city-founder", name:"Exklusiver Gründer", cost:300, text:"Schaltet einen exklusiven City.KL-Startspieler frei.", grant:{kind:"founder",amount:1} },
    { game:"city", id:"city-mogul", name:"Galaxy-Mogul", cost:650, text:"Kosmischer exklusiver City.KL-Startspieler.", grant:{kind:"galaxyMogul",amount:1} },
    { game:"city", id:"city-neon-mayor", name:"Neon-Bürgermeister", cost:340, text:"Exklusive leuchtende Spielfigur für City.KL.", grant:{kind:"neonMayor",amount:1} },
    { game:"city", id:"city-cyber-architect", name:"Cyber-Architekt", cost:420, text:"Exklusive futuristische City.KL-Spielfigur.", grant:{kind:"cyberArchitect",amount:1} },
    { game:"city", id:"city-gold-tycoon", name:"Gold-Tycoon", cost:520, text:"Goldene Premium-Spielfigur für City.KL.", grant:{kind:"goldTycoon",amount:1} },
    { game:"city", id:"city-star-investor", name:"Sternen-Investor", cost:580, text:"Kosmische Investor-Spielfigur für City.KL.", grant:{kind:"starInvestor",amount:1} },
    { game:"city", id:"city-crown-car", name:"Kronen-Limousine", cost:460, text:"Exklusive Luxusfahrzeug-Spielfigur.", grant:{kind:"crownCar",amount:1} },
    { game:"city", id:"city-quantum-train", name:"Quanten-Zug", cost:720, text:"Sehr seltene animierte City.KL-Spielfigur.", grant:{kind:"quantumTrain",amount:1} },

    { game:"match", id:"match-lives", name:"Leben vollständig auffüllen", cost:100, text:"Füllt alle fünf Match.KL-Herzen auf.", grant:{kind:"lives",amount:5} },
    { game:"match", id:"match-coins-1500", name:"1.500 Match Coins", cost:140, text:"Für Booster und Shopkäufe.", grant:{kind:"coins",amount:1500} },
    { game:"match", id:"match-coins-10000", name:"10.000 Match Coins", cost:480, text:"Großes Guthaben für Match.KL.", grant:{kind:"coins",amount:10000} },
    { game:"match", id:"match-coins-50000", name:"50.000 Match Coins", cost:1600, text:"Endgame-Paket für Match.KL.", grant:{kind:"coins",amount:50000} },
    { game:"match", id:"match-booster-5", name:"Galaxy-Booster-Set ×5", cost:220, text:"Je fünf Hammer, Bomben und +5-Züge.", grant:{kind:"boosterSet",amount:5} },
    { game:"match", id:"match-booster-15", name:"Galaxy-Booster-Set ×15", cost:540, text:"Je 15 Hammer, Bomben und +5-Züge.", grant:{kind:"boosterSet",amount:15} },
    { game:"match", id:"match-booster-40", name:"Galaxy-Booster-Set ×40", cost:1200, text:"Je 40 Hammer, Bomben und +5-Züge.", grant:{kind:"boosterSet",amount:40} },

    { game:"fight", id:"fight-wave25", name:"Startwelle 25", cost:220, text:"Schaltet Welle 25 als Startpunkt frei.", grant:{kind:"wave25",amount:1} },
    { game:"fight", id:"fight-wave50", name:"Startwelle 50", cost:500, text:"Schaltet Welle 50 als Startpunkt frei.", grant:{kind:"wave50",amount:1} },
    { game:"fight", id:"fight-wave80", name:"Startwelle 80", cost:900, text:"Schaltet Welle 80 als Startpunkt frei.", grant:{kind:"wave80",amount:1} },
    { game:"fight", id:"fight-godmode", name:"30-Sekunden-Godmode", cost:100, text:"Wird bei zehn Prozent Leben automatisch ausgelöst und schützt 30 Sekunden.", grant:{kind:"godmode",amount:1} },
    { game:"fight", id:"fight-godmode-5", name:"5× 30-Sekunden-Godmode", cost:420, text:"Fünf automatische Notfall-Godmode-Ladungen mit jeweils 30 Sekunden Schutz.", grant:{kind:"godmode",amount:5} },
    { game:"fight", id:"fight-star", name:"Stern-Booster", cost:200, text:"Erhöht ein gewähltes Fight.KL-Item um einen Stern.", grant:{kind:"star",amount:1} },
    { game:"fight", id:"fight-star-5", name:"5 Stern-Booster", cost:850, text:"Fünf frei einsetzbare Stern-Aufwertungen.", grant:{kind:"star",amount:5} },
    { game:"fight", id:"fight-legendary-crate", name:"Legendäre Arsenal-Kiste", cost:260, text:"Zufälliges legendäres Fight.KL-Item.", requiredFightLevel:15, grant:{kind:"legendaryItem",amount:1} },
    { game:"fight", id:"fight-universe-crate", name:"Universe-Arsenal-Kiste", cost:520, text:"Zufälliges Universe-Item für Fight.KL.", requiredFightLevel:50, grant:{kind:"universeItem",amount:1} },
    { game:"fight", id:"fight-blackhole-crate", name:"Black-Hole-Arsenal-Kiste", cost:820, text:"Zufälliges Black-Hole-Item für Fight.KL.", requiredFightLevel:80, grant:{kind:"blackholeItem",amount:1} },
    { game:"fight", id:"fight-galaxy-crate", name:"Galaxy-Arsenal-Kiste", cost:1200, text:"Zufälliges Galaxy-Endgame-Item für Fight.KL.", requiredFightLevel:100, grant:{kind:"galaxyItem",amount:1} },
    { game:"fight", id:"fight-galaxy-weapon", name:"Galaxy-Waffenkiste", cost:1450, text:"Garantiert eine Galaxy-Pistole, Langwaffe, Schrotflinte oder Nahkampfwaffe.", requiredFightLevel:100, grant:{kind:"galaxyWeapon",amount:1} },
    { game:"fight", id:"fight-galaxy-armor", name:"Galaxy-Rüstungskiste", cost:1450, text:"Garantiert Galaxy-Rüstung, Helm, Anzug oder Schuhe.", requiredFightLevel:100, grant:{kind:"galaxyArmor",amount:1} },

    { game:"dungeon", id:"dungeon-revive", name:"Wiederbelebungs-Siegel", cost:120, text:"Einmalige Wiederbelebung im Dungeon.", grant:{kind:"revive",amount:1} },
    { game:"dungeon", id:"dungeon-revive-5", name:"5 Wiederbelebungs-Siegel", cost:500, text:"Fünf Wiederbelebungen für lange Dungeon-Runs.", grant:{kind:"revive",amount:5} },
    { game:"dungeon", id:"dungeon-revive-15", name:"15 Wiederbelebungs-Siegel", cost:1250, text:"Großes Siegel-Paket.", grant:{kind:"revive",amount:15} },
    { game:"dungeon", id:"dungeon-loot", name:"Beute-Segen 30 Min.", cost:180, text:"Erhöht die Dungeon-Beute für 30 Minuten.", grant:{kind:"lootBoost",amount:1} },
    { game:"dungeon", id:"dungeon-loot-90", name:"Beute-Segen 90 Min.", cost:450, text:"Drei Beute-Segen direkt hintereinander.", grant:{kind:"lootBoost",amount:3} },
    { game:"dungeon", id:"dungeon-loot-180", name:"Beute-Segen 180 Min.", cost:790, text:"Sechs Beute-Segen für lange Sessions.", grant:{kind:"lootBoost",amount:6} },
    { game:"dungeon", id:"dungeon-key", name:"Nexus-Schlüssel", cost:350, text:"Exklusiver Dungeon-Zugangsschlüssel.", grant:{kind:"nexusKey",amount:1} },
    { game:"dungeon", id:"dungeon-key-5", name:"5 Nexus-Schlüssel", cost:1400, text:"Fünf exklusive Dungeon-Zugangsschlüssel.", grant:{kind:"nexusKey",amount:5} },

    { game:"money", id:"money-auto-30", name:"Auto-Collector 30 Min.", cost:200, text:"Sammelt 30 Minuten lang alle Money.KL-Erträge automatisch ein.", grant:{kind:"auto30",amount:1} },
    { game:"money", id:"money-production-2", name:"2× Produktion · 15 Min.", cost:200, text:"Verdoppelt die komplette Money.KL-Produktion für 15 Minuten.", grant:{kind:"production2",amount:1} },
    { game:"money", id:"money-production-4", name:"4× Produktion · 15 Min.", cost:400, text:"Vierfache Money.KL-Produktion für 15 Minuten.", grant:{kind:"production4",amount:1} },
    { game:"money", id:"money-production-6", name:"6× Produktion · 15 Min.", cost:600, text:"Sechsfache Money.KL-Produktion für 15 Minuten.", grant:{kind:"production6",amount:1} },
    { game:"money", id:"money-production-8", name:"8× Produktion · 15 Min.", cost:800, text:"Achtfache Money.KL-Produktion für 15 Minuten.", grant:{kind:"production8",amount:1} },
    { game:"money", id:"money-production-10", name:"10× Produktion · 15 Min.", cost:1000, text:"Zehnfache Money.KL-Produktion für 15 Minuten.", grant:{kind:"production10",amount:1} },
    { game:"money", id:"money-production-12", name:"12× Produktion · 15 Min.", cost:1200, text:"Zwölffache Money.KL-Produktion für 15 Minuten.", grant:{kind:"production12",amount:1} },
    { game:"money", id:"money-production-14", name:"14× Produktion · 15 Min.", cost:1400, text:"Vierzehnfache Money.KL-Produktion für 15 Minuten.", grant:{kind:"production14",amount:1} },
    { game:"money", id:"money-production-16", name:"16× Produktion · 15 Min.", cost:1600, text:"Sechzehnfache Money.KL-Produktion für 15 Minuten.", grant:{kind:"production16",amount:1} },
    { game:"money", id:"money-production-18", name:"18× Produktion · 15 Min.", cost:1800, text:"Achtzehnfache Money.KL-Produktion für 15 Minuten.", grant:{kind:"production18",amount:1} },
    { game:"money", id:"money-production-20", name:"20× Produktion · 15 Min.", cost:2000, text:"Maximaler Produktionsboost: zwanzigfache Produktion für 15 Minuten.", grant:{kind:"production20",amount:1} },
    { game:"money", id:"money-instant-10", name:"10 Min. Sofortertrag", cost:500, text:"Schreibt dir sofort den Ertrag von zehn Minuten deiner aktuellen Money.KL-Produktion gut.", grant:{kind:"instant10",amount:1} },

    { game:"money", id:"money-jk-maker-1", name:"JK Neon-Sammler", cost:100, text:"100 Billiarden pro Sekunde auf Level 1 · bis Level 20 ausbaubar.", grant:{kind:"jkMaker:jk-maker-1",amount:1} },
    { game:"money", id:"money-jk-maker-2", name:"JK Cash-Runner", cost:200, text:"500 Billiarden pro Sekunde auf Level 1 · bis Level 20 ausbaubar.", grant:{kind:"jkMaker:jk-maker-2",amount:1} },
    { game:"money", id:"money-jk-maker-3", name:"JK Quantum-Händler", cost:300, text:"2 Trillionen pro Sekunde auf Level 1 · bis Level 20 ausbaubar.", grant:{kind:"jkMaker:jk-maker-3",amount:1} },
    { game:"money", id:"money-jk-maker-4", name:"JK Galaxy-Broker", cost:500, text:"1 Quadrillion pro Sekunde auf Level 1 · bis Level 20 ausbaubar.", grant:{kind:"jkMaker:jk-maker-4",amount:1} },
    { game:"money", id:"money-jk-maker-5", name:"JK Hyper-Mogul", cost:1000, text:"1 Quintillion pro Sekunde auf Level 1 · bis Level 20 ausbaubar.", grant:{kind:"jkMaker:jk-maker-5",amount:1} },
    { game:"money", id:"money-jk-maker-6", name:"JK Orbit-Bankier", cost:2000, text:"1 Sextillion pro Sekunde auf Level 1 · bis Level 20 ausbaubar.", grant:{kind:"jkMaker:jk-maker-6",amount:1} },
    { game:"money", id:"money-jk-maker-7", name:"JK Multiversum-Tycoon", cost:3000, text:"Permanenter Produktions-Maker: 1 Septillion $ pro Sekunde auf Level 1 · bis Level 20 ausbaubar. Kein Zeit-Booster.", grant:{kind:"jkMaker:jk-maker-7",amount:1} },
    { game:"money", id:"money-jk-maker-8", name:"JK Infinity-Investor", cost:3500, text:"1 Octillion pro Sekunde auf Level 1 · bis Level 20 ausbaubar.", grant:{kind:"jkMaker:jk-maker-8",amount:1} },
    { game:"money", id:"money-jk-maker-9", name:"JK Black-Hole-Imperator", cost:4500, text:"1 Nonillion pro Sekunde auf Level 1 · bis Level 20 ausbaubar.", grant:{kind:"jkMaker:jk-maker-9",amount:1} },
    { game:"money", id:"money-jk-maker-10", name:"JK Money-Gott", cost:5000, text:"1 Decillion pro Sekunde auf Level 1 · bis Level 20 ausbaubar.", grant:{kind:"jkMaker:jk-maker-10",amount:1} },

    { game:"bigcards", id:"bigcards-vip", name:"BigCards VIP · Dauerhaft", cost:500, text:"Permanenter VIP-Zugang für BigCards.kl: tägliches Glücksrad, VIP-Klicker, 100 VIP-Karten, Boss-System, Klicker-Upgrades, Boss-Special-Attacken und die Möglichkeit, noch nicht regulär freigeschaltete Karten gegen hohe Point-Kosten vorzeitig fürs Spielfeld freizuschalten. Ohne VIP werden solche alten Vorzeit-Freigaben entfernt.", grant:{kind:"vipUnlock",amount:1} },
    { game:"bigcards", id:"bigcards-bulk-level-unlock", name:"Alle Karten leveln · 24 Stunden", cost:500, text:"Schaltet im BigCards-Sammlungsalbum „Alle Karten leveln“ für exakt 24 Stunden frei – auch für Exclusive/VIP, wenn diese Sammlung ausgewählt ist. Nach Ablauf muss der Zugang erneut gekauft werden.", grant:{kind:"bulkLevelUnlock",amount:1} },
    { game:"bigcards", id:"bigcards-bulk-rebirth-unlock", name:"Alle Karten rebirthen · 24 Stunden", cost:500, text:"Schaltet im BigCards-Sammlungsalbum „Alle Karten rebirthen“ für exakt 24 Stunden frei – auch für Exclusive/VIP, wenn diese Sammlung ausgewählt ist. Nach Ablauf muss der Zugang erneut gekauft werden.", grant:{kind:"bulkRebirthUnlock",amount:1} },
    { game:"bigcards", id:"bigcards-points-boost-2", name:"2× Points · 15 Min.", cost:200, text:"Verdoppelt 15 Minuten lang die Points-Produktion im Spielfeld UND im persönlichen Kartenslot.", grant:{kind:"pointsBoost:2",amount:1} },
    { game:"bigcards", id:"bigcards-points-boost-4", name:"4× Points · 15 Min.", cost:400, text:"Vierfache Points-Produktion für Spielfeld und persönliche Karte. Ersetzt die vorherige Stufe; Zeit wird nicht addiert.", grant:{kind:"pointsBoost:4",amount:1} },
    { game:"bigcards", id:"bigcards-points-boost-6", name:"6× Points · 15 Min.", cost:700, text:"Sechsfache Points-Produktion für Spielfeld und persönliche Karte für exakt 15 Minuten.", grant:{kind:"pointsBoost:6",amount:1} },
    { game:"bigcards", id:"bigcards-points-boost-8", name:"8× Points · 15 Min.", cost:1100, text:"Achtfache Points-Produktion für Spielfeld und persönliche Karte für exakt 15 Minuten.", grant:{kind:"pointsBoost:8",amount:1} },
    { game:"bigcards", id:"bigcards-points-boost-10", name:"10× Points · 15 Min.", cost:1600, text:"Maximaler BigCards-Points-Booster: zehnfache Produktion für exakt 15 Minuten.", grant:{kind:"pointsBoost:10",amount:1} },
    { game:"bigcards", id:"bigcards-xp-boost-2", name:"2× XP · 15 Min.", cost:200, text:"Verdoppelt 15 Minuten lang die BigCards-XP aus Spielfeld und persönlichem Kartenslot.", grant:{kind:"xpBoost:2",amount:1} },
    { game:"bigcards", id:"bigcards-xp-boost-4", name:"4× XP · 15 Min.", cost:450, text:"Vierfache BigCards-XP für exakt 15 Minuten. Ersetzt die vorherige Stufe.", grant:{kind:"xpBoost:4",amount:1} },
    { game:"bigcards", id:"bigcards-xp-boost-6", name:"6× XP · 15 Min.", cost:800, text:"Sechsfache BigCards-XP für exakt 15 Minuten.", grant:{kind:"xpBoost:6",amount:1} },
    { game:"bigcards", id:"bigcards-xp-boost-8", name:"8× XP · 15 Min.", cost:1250, text:"Achtfache BigCards-XP für exakt 15 Minuten.", grant:{kind:"xpBoost:8",amount:1} },
    { game:"bigcards", id:"bigcards-xp-boost-10", name:"10× XP · 15 Min.", cost:1800, text:"Maximaler BigCards-XP-Booster: zehnfache XP für exakt 15 Minuten.", grant:{kind:"xpBoost:10",amount:1} },
    { game:"bigcards", id:"bigcards-damage-boost-20", name:"+20 % Kampfschaden · 15 Min.", cost:150, text:"Erhöht deinen BigCards-Kampfschaden 15 Minuten lang auf ×1,20.", grant:{kind:"damageBoost:20",amount:1} },
    { game:"bigcards", id:"bigcards-damage-boost-40", name:"+40 % Kampfschaden · 15 Min.", cost:300, text:"Erhöht deinen BigCards-Kampfschaden 15 Minuten lang auf ×1,40.", grant:{kind:"damageBoost:40",amount:1} },
    { game:"bigcards", id:"bigcards-damage-boost-60", name:"+60 % Kampfschaden · 15 Min.", cost:500, text:"Erhöht deinen BigCards-Kampfschaden 15 Minuten lang auf ×1,60.", grant:{kind:"damageBoost:60",amount:1} },
    { game:"bigcards", id:"bigcards-damage-boost-80", name:"+80 % Kampfschaden · 15 Min.", cost:800, text:"Erhöht deinen BigCards-Kampfschaden 15 Minuten lang auf ×1,80.", grant:{kind:"damageBoost:80",amount:1} },
    { game:"bigcards", id:"bigcards-damage-boost-100", name:"+100 % Kampfschaden · 15 Min.", cost:1200, text:"Maximaler Kampfbooster: +100 % Schaden = insgesamt ×2,00 für exakt 15 Minuten.", grant:{kind:"damageBoost:100",amount:1} },
    { game:"bigcards", id:"bigcards-pack-common", name:"Gewöhnlich-Pack", cost:5, text:"1 Credit für ein BigCards.kl Gewöhnlich-Pack mit 10 Karten.", grant:{kind:"pack:common",amount:1} },
    { game:"bigcards", id:"bigcards-pack-uncommon", name:"Ungewöhnlich-Pack", cost:10, text:"1 Credit für ein Ungewöhnlich-Pack.", grant:{kind:"pack:uncommon",amount:1} },
    { game:"bigcards", id:"bigcards-pack-rare", name:"Selten-Pack", cost:18, text:"1 Credit für ein Selten-Pack.", grant:{kind:"pack:rare",amount:1} },
    { game:"bigcards", id:"bigcards-pack-epic", name:"Episch-Pack", cost:30, text:"1 Credit für ein Episch-Pack.", grant:{kind:"pack:epic",amount:1} },
    { game:"bigcards", id:"bigcards-pack-legendary", name:"Legendär-Pack", cost:50, text:"1 Credit für ein Legendär-Pack.", grant:{kind:"pack:legendary",amount:1} },
    { game:"bigcards", id:"bigcards-pack-special", name:"Special-Pack", cost:80, text:"1 Credit für ein Special-Pack.", grant:{kind:"pack:special",amount:1} },
    { game:"bigcards", id:"bigcards-pack-mythic", name:"Mythisch-Pack", cost:120, text:"1 Credit für ein Mythisch-Pack.", grant:{kind:"pack:mythic",amount:1} },
    { game:"bigcards", id:"bigcards-pack-exotic", name:"Exotisch-Pack", cost:200, text:"1 Credit für ein Exotisch-Pack.", grant:{kind:"pack:exotic",amount:1} },
    { game:"bigcards", id:"bigcards-pack-universe", name:"Universe-Pack", cost:400, text:"1 Credit für ein Universe-Pack.", grant:{kind:"pack:universe",amount:1} },
    { game:"bigcards", id:"bigcards-pack-blackhole", name:"Black-Hole-Pack", cost:750, text:"1 Credit für ein Black-Hole-Pack.", grant:{kind:"pack:blackhole",amount:1} },
    { game:"bigcards", id:"bigcards-pack-galaxy", name:"Galaxy-Pack", cost:1200, text:"1 Credit für ein Galaxy-Pack.", grant:{kind:"pack:galaxy",amount:1} },
    { game:"bigcards", id:"bigcards-pack-cosmic", name:"Kosmisch-Pack", cost:1800, text:"1 Credit für ein Kosmisch-Pack.", grant:{kind:"pack:cosmic",amount:1} },
    { game:"bigcards", id:"bigcards-pack-godly", name:"Göttlich-Pack", cost:2500, text:"1 Credit für ein Göttlich-Pack.", grant:{kind:"pack:godly",amount:1} },
    { game:"bigcards", id:"bigcards-exclusive", name:"EXCLUSIVE PACK", cost:100, text:"5 Ziehungen aus dem exklusiven Vampir-/Blutkarten-Pool.", grant:{kind:"exclusivePack",amount:1} },
    { game:"bigcards", id:"bigcards-auto-opener", name:"Auto-Opener · +1 Arbeitsstunde", cost:750, text:"Gibt 1 Stunde Auto-Opener-Arbeitszeit. Die ersten vier Käufe schalten zusätzlich Kanal 1–4 frei; mehrere aktive Kanäle teilen sich den Zeitpool und öffnen gleichzeitig.", grant:{kind:"autoOpenerHour",amount:1} },
    { game:"bigcards", id:"bigcards-best-combat", name:"Beste Kampfkarte · Dauerhaft", cost:100, text:"Schaltet die automatische Auswahl der aktuell stärksten erlaubten Kampfkarte dauerhaft frei. Der Button erscheint im Bereich Karte und im Kartenkampf.", grant:{kind:"bestCombatAutoUnlock",amount:1} },
    { game:"bigcards", id:"bigcards-vip-clicks-2", name:"VIP-Klicks ×2 · 1 Stunde", cost:150, text:"Verdoppelt den VIP-Klick-Ertrag für exakt 1 Stunde. Beim Kauf einer höheren Stufe wird die Laufzeit wieder auf genau 1 Stunde gesetzt.", grant:{kind:"vipClickBoost:2",amount:1} },
    { game:"bigcards", id:"bigcards-vip-clicks-4", name:"VIP-Klicks ×4 · 1 Stunde", cost:350, text:"Vierfacher VIP-Klick-Ertrag für exakt 1 Stunde. Ersetzt ×2; Restzeit wird nicht addiert.", grant:{kind:"vipClickBoost:4",amount:1} },
    { game:"bigcards", id:"bigcards-vip-clicks-6", name:"VIP-Klicks ×6 · 1 Stunde", cost:650, text:"Sechsfacher VIP-Klick-Ertrag für exakt 1 Stunde. Höhere Stufen werden bewusst deutlich teurer.", grant:{kind:"vipClickBoost:6",amount:1} },
    { game:"bigcards", id:"bigcards-vip-clicks-8", name:"VIP-Klicks ×8 · 1 Stunde", cost:1000, text:"Achtfacher VIP-Klick-Ertrag für exakt 1 Stunde. Die Stunde wird beim Kauf neu gestartet, nicht verlängert.", grant:{kind:"vipClickBoost:8",amount:1} },
    { game:"bigcards", id:"bigcards-vip-clicks-10", name:"VIP-Klicks ×10 · 1 Stunde", cost:1500, text:"Maximaler VIP-Klick-Booster: zehnfacher Klick-Ertrag für exakt 1 Stunde.", grant:{kind:"vipClickBoost:10",amount:1} },
    { game:"bigcards", id:"bigcards-boss-team-2", name:"Wochenboss Team-Schaden ×2 · 1 Stunde", cost:800, text:"Verdoppelt die berechnete Team-Power beim wöchentlichen Kartenboss für exakt 1 Stunde. Ein erneuter Kauf startet wieder genau 1 Stunde.", grant:{kind:"bossDamageBoost:2",amount:1} },
    { game:"bigcards", id:"bigcards-expedition-finish-1", name:"Expedition Slot 1 sofort abschließen", cost:120, text:"Beendet die aktuell laufende Expedition in Slot 1 sofort. Die Belohnung wird anschließend normal im Expeditionsbereich abgeholt.", grant:{kind:"finishExpedition:0",amount:1} },
    { game:"bigcards", id:"bigcards-expedition-finish-2", name:"Expedition Slot 2 sofort abschließen", cost:180, text:"Beendet die aktuell laufende Expedition in Slot 2 sofort. Funktioniert nur, wenn dort wirklich eine unfertige Expedition läuft.", grant:{kind:"finishExpedition:1",amount:1} },
    { game:"bigcards", id:"bigcards-expedition-finish-3", name:"Expedition Slot 3 sofort abschließen", cost:260, text:"Beendet die aktuell laufende Expedition in Slot 3 sofort. Die Expedition wird nicht dupliziert und kann danach normal eingesammelt werden.", grant:{kind:"finishExpedition:2",amount:1} },
    { game:"bigcards", id:"bigcards-expedition-finish-4", name:"Expedition Slot 4 sofort abschließen", cost:360, text:"Beendet die aktuell laufende Expedition in Slot 4 sofort. Gedacht als teurer Komfort für lange Expeditionen.", grant:{kind:"finishExpedition:3",amount:1} },
    { game:"bigcards", id:"bigcards-auto-collector", name:"Auto-Collector · 1 Stunde", cost:500, text:"Sammelt produzierte BigCards-Points eine Stunde automatisch ein.", grant:{kind:"autoCollectorHour",amount:1} },
    // V353: Einmalige Speicherstufen für den persönlichen Karten-Slot.
    { game:"bigcards", id:"bigcards-feature-storage-20m", name:"Karten-Slot Speicher · 5 Mio.", cost:1000, text:"Dauerhaftes Limit: 5 Mio. Points und 150.000 BigCards-XP für deine persönliche Karte.", grant:{kind:"featuredStorage:1",amount:1} },
    { game:"bigcards", id:"bigcards-feature-storage-100m", name:"Karten-Slot Speicher · 25 Mio.", cost:5000, text:"Dauerhaftes Limit: 25 Mio. Points und 500.000 BigCards-XP für deine persönliche Karte.", grant:{kind:"featuredStorage:2",amount:1} },
    { game:"bigcards", id:"bigcards-feature-storage-1b", name:"Karten-Slot Speicher · 250 Mio.", cost:10000, text:"Dauerhaftes MAX-Limit: 250 Mio. Points und 1.000.000 BigCards-XP für deine persönliche Karte.", grant:{kind:"featuredStorage:3",amount:1} },
    // V352: Vollständige BigCards-Ausrüstung im JK/Coin-Shop.
    // Normale Auras · Points-Produktion
    { game:"bigcards", id:"bigcards-aura-basic", name:"Basic Aura", cost:25, text:"Eine Basic Aura x1,10 Points für genau eine Karteninstanz.", grant:{kind:"aura:basic",amount:1} },
    { game:"bigcards", id:"bigcards-aura-rare", name:"Rare Aura", cost:60, text:"Eine Rare Aura x1,25 Points für genau eine Karteninstanz.", grant:{kind:"aura:rare",amount:1} },
    { game:"bigcards", id:"bigcards-aura-epic", name:"Epic Aura", cost:120, text:"Eine Epic Aura x1,50 Points für genau eine Karteninstanz.", grant:{kind:"aura:epic",amount:1} },
    { game:"bigcards", id:"bigcards-aura-legendary", name:"Legendary Aura", cost:220, text:"Eine Legendary Aura x1,80 Points für genau eine Karteninstanz.", grant:{kind:"aura:legendary",amount:1} },
    { game:"bigcards", id:"bigcards-aura-mythic", name:"Mythic Aura", cost:400, text:"Eine Mythic Aura x2,20 Points für genau eine Karteninstanz.", grant:{kind:"aura:mythic",amount:1} },
    { game:"bigcards", id:"bigcards-aura-exotic", name:"Exotic Aura", cost:650, text:"Eine Exotic Aura x3,00 Points für genau eine Karteninstanz.", grant:{kind:"aura:exotic",amount:1} },
    { game:"bigcards", id:"bigcards-aura-universe", name:"Universe Aura", cost:950, text:"Eine Universe Aura x4,00 Points für genau eine Karteninstanz.", grant:{kind:"aura:universe",amount:1} },
    { game:"bigcards", id:"bigcards-aura-blackhole", name:"Black Hole Aura", cost:1250, text:"Eine Black Hole Aura x5,00 Points für genau eine Karteninstanz.", grant:{kind:"aura:blackhole",amount:1} },
    { game:"bigcards", id:"bigcards-aura-galaxy", name:"Galaxy Aura", cost:1500, text:"Eine Galaxy Aura x6,00 Points für genau eine Karteninstanz.", grant:{kind:"aura:galaxy",amount:1} },
    { game:"bigcards", id:"bigcards-aura-cosmic", name:"Cosmic Aura", cost:2600, text:"Eine Cosmic Aura x8,00 Points für genau eine Karteninstanz.", grant:{kind:"aura:cosmic",amount:1} },

    // Kampf-Auras · Kartenkampf
    { game:"bigcards", id:"bigcards-combat-aura-basic", name:"Basic Kampf Aura", cost:40, text:"Eine Basic Kampf Aura x1,08 für Schaden und Kampfwert.", grant:{kind:"combatAura:basic",amount:1} },
    { game:"bigcards", id:"bigcards-combat-aura-rare", name:"Rare Kampf Aura", cost:90, text:"Eine Rare Kampf Aura x1,16 für Schaden und Kampfwert.", grant:{kind:"combatAura:rare",amount:1} },
    { game:"bigcards", id:"bigcards-combat-aura-epic", name:"Epic Kampf Aura", cost:180, text:"Eine Epic Kampf Aura x1,28 für Schaden und Kampfwert.", grant:{kind:"combatAura:epic",amount:1} },
    { game:"bigcards", id:"bigcards-combat-aura-legendary", name:"Legendary Kampf Aura", cost:320, text:"Eine Legendary Kampf Aura x1,42 für Schaden und Kampfwert.", grant:{kind:"combatAura:legendary",amount:1} },
    { game:"bigcards", id:"bigcards-combat-aura-mythic", name:"Mythic Kampf Aura", cost:550, text:"Eine Mythic Kampf Aura x1,60 für Schaden und Kampfwert.", grant:{kind:"combatAura:mythic",amount:1} },
    { game:"bigcards", id:"bigcards-combat-aura-exotic", name:"Exotic Kampf Aura", cost:850, text:"Eine Exotic Kampf Aura x1,85 für Schaden und Kampfwert.", grant:{kind:"combatAura:exotic",amount:1} },
    { game:"bigcards", id:"bigcards-combat-aura-universe", name:"Universe Kampf Aura", cost:1200, text:"Eine Universe Kampf Aura x2,15 für Schaden und Kampfwert.", grant:{kind:"combatAura:universe",amount:1} },
    { game:"bigcards", id:"bigcards-combat-aura-blackhole", name:"Black Hole Kampf Aura", cost:1600, text:"Eine Black Hole Kampf Aura x2,50 für Schaden und Kampfwert.", grant:{kind:"combatAura:blackhole",amount:1} },
    { game:"bigcards", id:"bigcards-combat-aura-galaxy", name:"Galaxy Kampf Aura", cost:2200, text:"Eine Galaxy Kampf Aura x2,90 für Schaden und Kampfwert.", grant:{kind:"combatAura:galaxy",amount:1} },
    { game:"bigcards", id:"bigcards-combat-aura-cosmic", name:"Cosmic Kampf Aura", cost:3200, text:"Eine Cosmic Kampf Aura x3,50 für Schaden und Kampfwert.", grant:{kind:"combatAura:cosmic",amount:1} },

    // Bindungen · internes BigCards-XP
    { game:"bigcards", id:"bigcards-bind-fire", name:"Feuerbindung", cost:50, text:"Eine Feuerbindung x1,50 internes BigCards-XP für genau eine Karteninstanz.", grant:{kind:"bind:fire",amount:1} },
    { game:"bigcards", id:"bigcards-bind-poison", name:"Giftbindung", cost:100, text:"Eine Giftbindung x1,80 internes BigCards-XP für genau eine Karteninstanz.", grant:{kind:"bind:poison",amount:1} },
    { game:"bigcards", id:"bigcards-bind-ice", name:"Eisbindung", cost:180, text:"Eine Eisbindung x2,00 internes BigCards-XP für genau eine Karteninstanz.", grant:{kind:"bind:ice",amount:1} },
    { game:"bigcards", id:"bigcards-bind-water", name:"Wasserbindung", cost:280, text:"Eine Wasserbindung x2,20 internes BigCards-XP für genau eine Karteninstanz.", grant:{kind:"bind:water",amount:1} },
    { game:"bigcards", id:"bigcards-bind-hell", name:"Höllenbindung", cost:450, text:"Eine Höllenbindung x2,50 internes BigCards-XP für genau eine Karteninstanz.", grant:{kind:"bind:hell",amount:1} },
    { game:"bigcards", id:"bigcards-bind-angel", name:"Engelsbindung", cost:650, text:"Eine Engelsbindung x2,80 internes BigCards-XP für genau eine Karteninstanz.", grant:{kind:"bind:angel",amount:1} },
    { game:"bigcards", id:"bigcards-bind-wizard", name:"Magierbindung", cost:900, text:"Eine Magierbindung x3,00 internes BigCards-XP für genau eine Karteninstanz.", grant:{kind:"bind:wizard",amount:1} },
    { game:"bigcards", id:"bigcards-trail-common", name:"Gewöhnliche Spur", cost:25, text:"Eine Gewöhnliche Spur für deine persönliche BigCards-Karte. Ausrüsten erst nach normaler Spuren-Freischaltung.", grant:{kind:"trail:common",amount:1} },
    { game:"bigcards", id:"bigcards-trail-uncommon", name:"Ungewöhnliche Spur", cost:50, text:"Eine Ungewöhnliche Spur für deine persönliche Karte.", grant:{kind:"trail:uncommon",amount:1} },
    { game:"bigcards", id:"bigcards-trail-rare", name:"Seltene Spur", cost:90, text:"Eine Seltene Spur mit stärkeren Karten-Slot- und Kampfboni.", grant:{kind:"trail:rare",amount:1} },
    { game:"bigcards", id:"bigcards-trail-epic", name:"Epische Spur", cost:150, text:"Eine Epische Spur für deine persönliche Karte.", grant:{kind:"trail:epic",amount:1} },
    { game:"bigcards", id:"bigcards-trail-legendary", name:"Legendäre Spur", cost:250, text:"Eine Legendäre Spur für deine persönliche Karte.", grant:{kind:"trail:legendary",amount:1} },
    { game:"bigcards", id:"bigcards-trail-special", name:"Special Spur", cost:400, text:"Eine Special Spur für deine persönliche Karte.", grant:{kind:"trail:special",amount:1} },
    { game:"bigcards", id:"bigcards-trail-mythic", name:"Mythische Spur", cost:650, text:"Eine Mythische Spur mit starken persönlichen Kartenboni.", grant:{kind:"trail:mythic",amount:1} },
    { game:"bigcards", id:"bigcards-trail-exotic", name:"Exotische Spur", cost:1000, text:"Eine Exotische Spur für deine persönliche Karte.", grant:{kind:"trail:exotic",amount:1} },
    { game:"bigcards", id:"bigcards-trail-universe", name:"Universe Spur", cost:1500, text:"Eine Universe Spur für deine persönliche Karte.", grant:{kind:"trail:universe",amount:1} },
    { game:"bigcards", id:"bigcards-trail-blackhole", name:"Black Hole Spur", cost:2200, text:"Black-Hole-Design plus sehr starke Karten-Slot- und Kampfboni.", grant:{kind:"trail:blackhole",amount:1} },
    { game:"bigcards", id:"bigcards-trail-galaxy", name:"Galaxy Spur", cost:3200, text:"Galaxy-Design plus sehr starke persönliche Kartenboni.", grant:{kind:"trail:galaxy",amount:1} },
    { game:"bigcards", id:"bigcards-trail-cosmic", name:"Kosmische Spur", cost:4500, text:"Kosmisches Design plus extreme Karten-Slot- und Kampfboni.", grant:{kind:"trail:cosmic",amount:1} },
    { game:"bigcards", id:"bigcards-trail-godly", name:"Göttliche Spur", cost:6500, text:"Die stärkste Spur mit göttlichem Design. Es gibt keine Exclusive-Spur.", grant:{kind:"trail:godly",amount:1} },
    { game:"bigcards", id:"bigcards-points-20m", name:"20 Min. dynamische Points", cost:300, text:"Points im Wert von ca. 20 Minuten deiner aktuellen BigCards-Produktion.", grant:{kind:"pointsMinutes:20",amount:1} },

    { game:"escape", id:"escape-treadmill-gold", name:"GOLD Laufband ×2,8", cost:250, text:"Permanentes GOLD-Laufband für Escape.kl.", grant:{kind:"speedTreadmill:gold",amount:1} },
    { game:"escape", id:"escape-treadmill-diamond", name:"DIAMOND Laufband ×4", cost:850, text:"Permanentes DIAMOND-Laufband für Escape.kl.", grant:{kind:"speedTreadmill:diamond",amount:1} },
    { game:"escape", id:"escape-treadmill-galaxy", name:"GALAXY Laufband ×6", cost:1200, text:"Spawnbares GALAXY-Laufband für Escape.kl.", grant:{kind:"speedTreadmill:galaxy",amount:1} },
    { game:"escape", id:"escape-treadmill-admin", name:"ADMIN Laufband ×10", cost:2000, text:"Spawnbares ADMIN-Laufband für Escape.kl.", grant:{kind:"speedTreadmill:admin",amount:1} },
    { game:"escape", id:"escape-trail-galaxy", name:"Galaxy Keyboard Trail", cost:300, text:"Galaxy-Partikelspur mit additivem Power-Bonus für Escape.kl.", grant:{kind:"trail:galaxy",amount:1} },
    { game:"escape", id:"escape-pet-eye", name:"EYE Pet", cost:500, text:"Fliegendes Escape-Pet mit +2 % Speed und +2 % Wins.", grant:{kind:"pet:cyclops-wing",amount:1} },
    { game:"escape", id:"escape-pet-reptisect", name:"Reptisect Pet", cost:400, text:"Animiertes Lauf-Pet. Folgt dir mit leichter Verzögerung und gibt +1,5 % Speed sowie +1,5 % Wins.", grant:{kind:"pet:reptisect",amount:1} },
    { game:"escape", id:"escape-pet-phoenix", name:"Phönix Pet", cost:3000, text:"Teuerstes Escape-Pet: animierter Flug-Follower mit +3,0 % Speed und +2,5 % Wins.", grant:{kind:"pet:phoenix",amount:1} },
    { game:"escape", id:"escape-demon", name:"Dämonenverwandlung", cost:800, text:"Permanente Escape-Verwandlung mit +1,5 % Speed und +1,5 % Wins.", grant:{kind:"character:demon-transformation",amount:1} },
    { game:"escape", id:"escape-demon-galaxy", name:"Dämon Galaxy-Upgrade", cost:1000, text:"Galaxy-Upgrade für die Dämonenverwandlung auf +2,5 % Speed und +2,5 % Wins.", grant:{kind:"character:demon-galaxy",amount:1} },
    { game:"escape", id:"escape-power-boost", name:"+50 % Power · 15 Min.", cost:180, text:"Temporärer +50-%-Bonus auf Lauf- und Laufband-Power in Escape.kl.", grant:{kind:"speedBoost:2",amount:1} },

    { game:"egoshoot", id:"egoshoot-kills-10", name:"10 Kills", cost:100, text:"10 Kills und 10 Kill-Punkte für Egoshoot.KL.", grant:{kind:"kills",amount:10} },
    { game:"egoshoot", id:"egoshoot-kills-44", name:"44 Kills · +10 %", cost:400, text:"40 Kills Basiswert plus 10 % Bonus: 44 Kills und Kill-Punkte.", grant:{kind:"kills",amount:44} },
    { game:"egoshoot", id:"egoshoot-kills-60", name:"60 Kills · +20 %", cost:500, text:"50 Kills Basiswert plus 20 % Bonus: 60 Kills und Kill-Punkte.", grant:{kind:"kills",amount:60} },
    { game:"egoshoot", id:"egoshoot-kills-140", name:"140 Kills · +40 %", cost:1000, text:"100 Kills Basiswert plus 40 % Bonus: 140 Kills und Kill-Punkte.", grant:{kind:"kills",amount:140} },

    { game:"weed", id:"weed-grow", name:"Galaxy-Growlicht", cost:250, text:"Exklusives Growlicht für das Weed-Business.", grant:{kind:"growLight",amount:1} },
    { game:"weed", id:"weed-grow-5", name:"5 Galaxy-Growlichter", cost:950, text:"Großes Growlicht-Paket für mehrere Plätze.", grant:{kind:"growLight",amount:5} },
    { game:"weed", id:"weed-crate", name:"Premium-Lieferkiste", cost:300, text:"Spezielle Lieferkiste mit Business-Material.", grant:{kind:"supplyCrate",amount:1} },
    { game:"weed", id:"weed-crate-5", name:"5 Premium-Lieferkisten", cost:1150, text:"Fünf Lieferkisten mit Samen und Material.", grant:{kind:"supplyCrate",amount:5} },
    { game:"weed", id:"weed-seed-vault", name:"Großes Samenpaket", cost:420, text:"6 Samen von jeder regulären Weed-Business-Sorte plus 20 zusätzliche Basic-Samen.", grant:{kind:"seedPack",amount:1} },
    { game:"weed", id:"weed-growline-seeds", name:"10 Growline-Samen", cost:500, text:"JK-Shop-exklusive Growline-Samen. 10 Samen werden direkt deinem Weed-Business gutgeschrieben.", grant:{kind:"growlineSeeds",amount:10} },
    { game:"weed", id:"weed-water", name:"Premium-Wasservorrat", cost:160, text:"100 zusätzliche Wasser-Einheiten.", grant:{kind:"waterPack",amount:100} },
    { game:"weed", id:"weed-soil", name:"Premium-Erde-Paket", cost:180, text:"30 Einheiten Premium-Erde und Töpfe.", grant:{kind:"soilPack",amount:30} },
    { game:"weed", id:"weed-starter", name:"Galaxy-Business-Paket", cost:900, text:"Growlicht, großes Samenpaket, 3 Growline-Samen und große Materiallieferung.", grant:{kind:"galaxyBusinessPack",amount:1} },

    { game:"casino", id:"casino-jetons", name:"Jetons zum Tageskurs", cost:1, text:"1 JK/Coin wird zum aktuellen Kurs in Casino-Jetons umgewandelt.", grant:{kind:"jetons",amount:1}, variable:true },
    { game:"casino", id:"casino-galaxy-table", name:"Galaxy-Tischdesign", cost:280, text:"Exklusives Galaxy-Design für alle Casino-Tische.", grant:{kind:"galaxyTable",amount:1} },
    { game:"casino", id:"casino-neon-cards", name:"Neon-Kartendeck", cost:220, text:"Exklusives leuchtendes Kartendesign für Blackjack und Poker.", grant:{kind:"neonCards",amount:1} },
    { game:"casino", id:"casino-cosmic-wheel", name:"Kosmisches Roulette-Rad", cost:320, text:"Exklusives animiertes Roulette-Design.", grant:{kind:"cosmicWheel",amount:1} },
    { game:"casino", id:"casino-galaxy-slots", name:"Galaxy-Slotmaschine", cost:260, text:"Exklusives Galaxy-Design für die Slotmaschine.", grant:{kind:"galaxySlots",amount:1} }
  ];

  // V383: Diese beiden BigCards-Komfortangebote sind Pflichtangebote. Sie werden
  // beim Rendern zusätzlich defensiv geprüft, damit sie weder durch eine ältere
  // GAME_STORE-Version noch durch Filter-/Dynamiklogik verschwinden können.
  const BIGCARDS_REQUIRED_COMFORT = Object.freeze([
    Object.freeze({ game:"bigcards", id:"bigcards-bulk-level-unlock", name:"Alle Karten leveln · 24 Stunden", cost:500, text:"Schaltet im BigCards-Sammlungsalbum „Alle Karten leveln“ für exakt 24 Stunden frei. Gilt auch für Exclusive/VIP, wenn diese Sammlung ausgewählt ist.", grant:{kind:"bulkLevelUnlock",amount:1} }),
    Object.freeze({ game:"bigcards", id:"bigcards-bulk-rebirth-unlock", name:"Alle Karten rebirthen · 24 Stunden", cost:500, text:"Schaltet im BigCards-Sammlungsalbum „Alle Karten rebirthen“ für exakt 24 Stunden frei. Gilt auch für Exclusive/VIP, wenn diese Sammlung ausgewählt ist.", grant:{kind:"bulkRebirthUnlock",amount:1} })
  ]);
  function ensureRequiredBigCardsComfort(items){
    const out=Array.isArray(items)?items.slice():[];
    if(ui?.game!=="all"&&ui?.game!=="bigcards")return out;
    for(const required of BIGCARDS_REQUIRED_COMFORT){
      if(!out.some(x=>String(x?.id||"")===required.id))out.push(required);
    }
    return out;
  }
  function bigCardsComfortPriority(entry){
    const id=String(entry?.id||"");
    if(id==="bigcards-bulk-level-unlock")return 0;
    if(id==="bigcards-bulk-rebirth-unlock")return 1;
    return 10;
  }
  const ADJECTIVES = ["Verlorenes","Neon","Antikes","Kosmisches","Goldenes","Schatten","Königliches","Mechanisches","Kristall","Verfluchtes","Legendäres","Digitales","Galaktisches","Obsidian","Sternen","Zeitloses","Rubin","Smaragd","Silbernes","Schwarzes"];
  const NOUNS = ["Abzeichen","Artefakt","Amulett","Poster","Modul","Relikt","Ticket","Siegel","Sammlerstück","Emblem","Helm","Ring","Kern","Würfel","Chip","Medaillon","Schlüssel","Totem","Fragment","Trophäe"];
  const NAV_STORAGE = "jk-games-jkcoin-nav-v215";
  function loadNavMemory(){try{return JSON.parse(sessionStorage.getItem(NAV_STORAGE)||"{}")||{};}catch{return {};}}
  const navMemory=loadNavMemory();
  const ui = { tab:"home", game:"all", gameCategory:"all", collectionRarity:"all", tabScroll:Math.max(0,Number(navMemory.tabScroll)||0), gameScroll:Math.max(0,Number(navMemory.gameScroll)||0), collectionScroll:Math.max(0,Number(navMemory.collectionScroll)||0), grantsListening:false, grantSyncBusy:false, profileSyncBusy:false, profileSyncSignature:"", toastTimer:0, lastGrantSync:0, grantCollectionDenied:false, gameOverlay:"", pageScroll:0, dynamicSignature:"" };
  const esc = v => String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const randInt = (min,max) => Math.floor(Math.random()*(max-min+1))+min;
  const clamp = (n,min,max) => Math.min(max,Math.max(min,Number(n)||0));
  const euro = n => `${Math.round(Number(n)||0).toLocaleString("de-DE")} €`;
  function stableRangeValue(seed,min,max){let h=2166136261>>>0;for(const ch of String(seed||"JK")){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return min+(h%(max-min+1));}

  function rootState(){ try{return typeof state!=="undefined"?state:null;}catch{return null;} }
  function persist(){ try{ if(typeof save==="function")save(); }catch(error){console.warn("JK/Coin speichern",error);} }
  function feed(text){try{if(typeof addFeed==="function")addFeed(text);}catch{}}
  function coinState(){
    const root=rootState(); if(!root)return null;
    root.jkCoin ||= { version:VERSION,balance:0,totalPurchased:0,totalSpent:0,totalGifted:0,totalEarned:0,ledger:[],requests:[],collectibles:[],collectionUnique:{},gamePurchases:{},entitlements:{},appliedEntitlements:{},lastGrantIds:[],createdAtMs:Date.now() };
    const c=root.jkCoin;c.version=VERSION;c.balance=Math.max(0,Math.floor(Number(c.balance)||0));c.totalPurchased=Math.max(0,Number(c.totalPurchased)||0);c.totalSpent=Math.max(0,Number(c.totalSpent)||0);c.totalGifted=Math.max(0,Number(c.totalGifted)||0);c.totalEarned=Math.max(0,Number(c.totalEarned)||0);c.ledger=Array.isArray(c.ledger)?c.ledger:[];c.requests=Array.isArray(c.requests)?c.requests:[];c.collectibles=Array.isArray(c.collectibles)?c.collectibles:[];if(c.collectibleBalanceVersion!=="v225"){for(const item of c.collectibles){if(item&&item.rarity!=="galaxy"&&Number(item.value)>NON_GALAXY_BOX_ITEM_CAP&&Number(item.sourceBoxCost||0)<5000)item.value=NON_GALAXY_BOX_ITEM_CAP;}c.collectibleBalanceVersion="v225";}if(c.collectorTierValueVersion!=="v228"){for(const item of c.collectibles){if(!String(item?.sourceBoxId||"").startsWith("collect-"))continue;if(item.rarity==="universe")item.value=stableRangeValue(item.catalogId,COLLECTOR_UNIVERSE_MIN_VALUE,COLLECTOR_UNIVERSE_MAX_VALUE);else if(item.rarity==="blackhole")item.value=stableRangeValue(item.catalogId,COLLECTOR_BLACKHOLE_MIN_VALUE,COLLECTOR_BLACKHOLE_MAX_VALUE);else if(item.rarity==="galaxy")item.value=stableRangeValue(item.catalogId,COLLECTOR_GALAXY_MIN_VALUE,COLLECTOR_GALAXY_MAX_VALUE);}c.collectorTierValueVersion="v228";}c.collectionUnique=c.collectionUnique&&typeof c.collectionUnique==="object"?c.collectionUnique:{};for(const item of c.collectibles){if(item?.catalogId)c.collectionUnique[item.catalogId]=true;}c.gamePurchases=c.gamePurchases&&typeof c.gamePurchases==="object"?c.gamePurchases:{};c.entitlements=c.entitlements&&typeof c.entitlements==="object"?c.entitlements:{};c.appliedEntitlements=c.appliedEntitlements&&typeof c.appliedEntitlements==="object"?c.appliedEntitlements:{};for(const bucket of [c.gamePurchases,c.entitlements,c.appliedEntitlements])for(const key of Object.keys(bucket))if(String(key).startsWith("speedcar-"))delete bucket[key];c.lastGrantIds=Array.isArray(c.lastGrantIds)?c.lastGrantIds:[];c.hype=c.hype&&typeof c.hype==="object"?c.hype:{};c.hype.points=Math.max(0,Math.round((Number(c.hype.points)||0)*2)/2);c.hype.totalBoxes=Math.max(0,Math.floor(Number(c.hype.totalBoxes)||0));c.hype.euroBoxes=Math.max(0,Math.floor(Number(c.hype.euroBoxes)||0));c.hype.jkBoxes=Math.max(0,Math.floor(Number(c.hype.jkBoxes)||0));c.hype.updatedAtMs=Math.max(0,Math.floor(Number(c.hype.updatedAtMs)||0));c.hype.claimedMilestones=Array.isArray(c.hype.claimedMilestones)?[...new Set(c.hype.claimedMilestones.map(v=>Math.max(0,Math.floor(Number(v)||0))).filter(Boolean))]:[];c.fragments=c.fragments&&typeof c.fragments==="object"?c.fragments:{};c.fragments.balance=Math.max(0,Math.floor(Number(c.fragments.balance)||0));c.fragments.lifetime=Math.max(c.fragments.balance,Math.floor(Number(c.fragments.lifetime)||0));c.fragments.converted=Math.max(0,Math.floor(Number(c.fragments.converted)||0));c.fragments.ledger=Array.isArray(c.fragments.ledger)?c.fragments.ledger.slice(0,80):[];c.fragments.rewardKeys=Array.isArray(c.fragments.rewardKeys)?c.fragments.rewardKeys.slice(-800):[];c.freeJk=c.freeJk&&typeof c.freeJk==="object"?c.freeJk:{};c.freeJk.attemptKeys=Array.isArray(c.freeJk.attemptKeys)?c.freeJk.attemptKeys.slice(-1000):[];c.freeJk.cooldowns=c.freeJk.cooldowns&&typeof c.freeJk.cooldowns==="object"?c.freeJk.cooldowns:{};return c;
  }
  function ledger(type,amount,text,meta={}){const c=coinState();if(!c)return;c.ledger.unshift({id:`jkc-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,type,amount:Number(amount)||0,text:String(text||""),at:Date.now(),...meta});c.ledger=c.ledger.slice(0,300);persist();}
  function spend(amount,text){const c=coinState(),value=Math.max(0,Math.floor(Number(amount)||0));if(!c||c.balance<value)return false;c.balance-=value;c.totalSpent+=value;ledger("spend",-value,text);return true;}
  function credit(amount,text,type="credit"){const c=coinState(),value=Math.max(0,Math.floor(Number(amount)||0));if(!c||!value)return false;c.balance+=value;c.totalEarned+=value;ledger(type,value,text);return true;}
  function processHypeMilestones(rewards){
    const c=coinState();if(!c)return 0;let total=0;
    for(const milestone of HYPE_MILESTONES){
      if(c.hype.points<milestone.hype||c.hype.claimedMilestones.includes(milestone.hype))continue;
      c.hype.claimedMilestones.push(milestone.hype);
      if(credit(milestone.coins,`Hype-Meilenstein ${milestone.hype.toLocaleString("de-DE")} %`,`hype-milestone`)){
        total+=milestone.coins;
        rewards?.push?.({kind:"jkcoin",name:`+${milestone.coins.toLocaleString("de-DE")} JK/Coin`,text:`Hype-Meilenstein ${milestone.hype.toLocaleString("de-DE")} % erreicht`,value:0});
      }
    }
    c.hype.claimedMilestones.sort((a,b)=>a-b);
    if(total){persist();syncProfileBalance().catch(()=>{});toast(`Hype-Meilenstein: +${total.toLocaleString("de-DE")} JK/Coin`);}
    return total;
  }
  function addFragments(amount,source="JK.Games",eventKey=""){
    const c=coinState(),value=Math.max(0,Math.floor(Number(amount)||0));if(!c||!value)return {added:0,coins:0,balance:c?.fragments?.balance||0};
    const key=String(eventKey||"").slice(0,180);if(key&&c.fragments.rewardKeys.includes(key))return {added:0,coins:0,balance:c.fragments.balance,duplicate:true};
    if(key){c.fragments.rewardKeys.push(key);c.fragments.rewardKeys=c.fragments.rewardKeys.slice(-800);}
    c.fragments.balance+=value;c.fragments.lifetime+=value;c.fragments.ledger.unshift({at:Date.now(),amount:value,source:String(source||"JK.Games").slice(0,120)});c.fragments.ledger=c.fragments.ledger.slice(0,80);
    const coins=Math.floor(c.fragments.balance/FRAGMENTS_PER_COIN);
    if(coins>0){c.fragments.balance-=coins*FRAGMENTS_PER_COIN;c.fragments.converted+=coins;credit(coins,`${coins*FRAGMENTS_PER_COIN} JK-Fragmente umgewandelt`,`fragments`);}
    persist();feed(`+${value} JK-Fragmente · ${source}${coins?` · +${coins} JK/Coin`:""}`);toast(`+${value} Fragmente${coins?` · +${coins} JK/Coin`:""}`);if(coins)syncProfileBalance().catch(()=>{});
    return {added:value,coins,balance:c.fragments.balance};
  }
  function rollTopGameDrop(game,trigger,eventKey=""){
    const c=coinState(),gameId=String(game||""),triggerId=String(trigger||""),cfg=TOP_GAME_DROP_RULES[gameId],rules=cfg?.[triggerId];if(!c||!Array.isArray(rules)||!rules.length)return 0;
    const key=String(eventKey||"").slice(0,180);if(key&&c.freeJk.attemptKeys.includes(key))return 0;
    if(gameId==="money"&&cfg.cooldownMs){const now=Date.now(),last=Number(c.freeJk.cooldowns.money||0);if(now-last<cfg.cooldownMs)return 0;c.freeJk.cooldowns.money=now;}
    if(key){c.freeJk.attemptKeys.push(key);c.freeJk.attemptKeys=c.freeJk.attemptKeys.slice(-1000);}
    const roll=Math.random();let cursor=0,won=0;for(const tier of rules){cursor+=Math.max(0,Number(tier.chance)||0);if(roll<cursor){won=Math.max(0,Math.floor(Number(tier.coins)||0));break;}}
    if(won&&credit(won,`${({runner:"Runner.KL",city:"City.KL",match:"Match.KL",fight:"Fight.KL",dungeon:"Dungeon.KL",money:"Money.KL"}[gameId]||"Top Game")} Gratis-Drop`,`topgame-drop`)){persist();syncProfileBalance().catch(()=>{});feed(`GRATIS-DROP: +${won} JK/Coin in ${gameId}.`);toast(`◆ GRATIS-DROP · +${won} JK/Coin`);return won;}
    return 0;
  }
  function currentRate(now=Date.now()){
    const bucket=Math.floor(now/(10*60*1000));
    let h=2166136261>>>0;
    for(const ch of `JKCoin:${bucket}`){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}
    // Jeder volle Euro zwischen 102.076 € und 232.477 € kann als Kurs auftreten.
    return JK_COIN_MIN_RATE+(h%(JK_COIN_MAX_RATE-JK_COIN_MIN_RATE+1));
  }
  function nextRateMinutes(){return Math.max(1,Math.ceil((10*60*1000-(Date.now()%(10*60*1000)))/60000));}
  function userName(){const s=rootState();return `${s?.firstName||"Spieler"} ${s?.lastName||""}`.trim();}
  async function runtime(){const core=window.LifeBuilderFirebaseCore;if(!core?.load)throw new Error("Firebase ist nicht geladen.");return core.load();}
  async function currentUser(fb){return await window.LifeBuilderFirebaseCore.waitForAuth?.(6000)||fb.auth.currentUser;}

  // V387: Finanzielle Aktionen bleiben komplett im Spiel. Keine Browser-confirm()/
  // prompt()-Fenster mehr für JK/Coin, Euro, Boxen, Verkäufe oder Spielkäufe.
  function jkcTopLayerElement(className,dataName){
    const supportsDialog=typeof HTMLDialogElement!=="undefined";
    const wrap=document.createElement(supportsDialog?"dialog":"div");
    wrap.className=className;
    if(dataName)wrap.dataset[dataName]="1";
    wrap.setAttribute("role","dialog");wrap.setAttribute("aria-modal","true");
    (document.fullscreenElement||document.body||document.documentElement).append(wrap);
    const show=()=>{if(!supportsDialog)return;try{if(!wrap.open)wrap.showModal();}catch(error){console.debug?.("JK/Coin Top-Layer-Fallback",error?.message||error);}};
    const close=()=>{try{if(supportsDialog&&wrap.open)wrap.close();}catch{}wrap.remove();};
    return{wrap,supportsDialog,show,close};
  }
  function jkcConfirm({title="Bitte bestätigen",message="",confirmText="Bestätigen",cancelText="Abbrechen",icon="◆",tone="normal"}={}){
    return new Promise(resolve=>{
      document.querySelector("[data-jkc-confirm]")?.remove();
      const layer=jkcTopLayerElement(`jkc-confirm-overlay tone-${tone}`,"jkcConfirm"),wrap=layer.wrap;
      wrap.innerHTML=`<div class="jkc-confirm-card"><div class="jkc-confirm-icon">${esc(icon)}</div><small>JK.GAMES · SICHERE BESTÄTIGUNG</small><h2>${esc(title)}</h2><div class="jkc-confirm-message">${esc(message).replace(/\n/g,"<br>")}</div><div class="jkc-confirm-actions"><button type="button" class="jkc-confirm-cancel">${esc(cancelText)}</button><button type="button" class="jkc-confirm-ok">${esc(confirmText)}</button></div></div>`;
      const finish=value=>{document.removeEventListener("keydown",onEsc,true);layer.close();resolve(value);};
      const onEsc=e=>{if(e.key!=="Escape")return;e.preventDefault();e.stopImmediatePropagation();finish(false);};
      wrap.querySelector(".jkc-confirm-cancel")?.addEventListener("click",()=>finish(false),{once:true});
      wrap.querySelector(".jkc-confirm-ok")?.addEventListener("click",()=>finish(true),{once:true});
      wrap.addEventListener("click",e=>{if(e.target===wrap)finish(false)});document.addEventListener("keydown",onEsc,true);
      if(layer.supportsDialog)wrap.addEventListener("cancel",e=>{e.preventDefault();finish(false);},{once:true});
      layer.show();setTimeout(()=>wrap.querySelector(".jkc-confirm-ok")?.focus(),0);
    });
  }
  function jkcNumberPrompt({title="Betrag eingeben",message="",value=1,min=1,max=Number.MAX_SAFE_INTEGER,confirmText="Übernehmen",icon="◆"}={}){
    return new Promise(resolve=>{
      document.querySelector("[data-jkc-confirm]")?.remove();
      const layer=jkcTopLayerElement("jkc-confirm-overlay","jkcConfirm"),wrap=layer.wrap;
      wrap.innerHTML=`<div class="jkc-confirm-card"><div class="jkc-confirm-icon">${esc(icon)}</div><small>JK.GAMES · EINGABE</small><h2>${esc(title)}</h2><div class="jkc-confirm-message">${esc(message).replace(/\n/g,"<br>")}</div><input class="jkc-confirm-input" type="number" min="${Number(min)||0}" max="${Number(max)||Number.MAX_SAFE_INTEGER}" step="1" value="${Math.max(Number(min)||0,Math.min(Number(max)||Number.MAX_SAFE_INTEGER,Number(value)||0))}"><div class="jkc-confirm-actions"><button type="button" class="jkc-confirm-cancel">Abbrechen</button><button type="button" class="jkc-confirm-ok">${esc(confirmText)}</button></div></div>`;
      const input=wrap.querySelector(".jkc-confirm-input");
      const finish=value=>{document.removeEventListener("keydown",onKey,true);layer.close();resolve(value);};
      const submit=()=>{const n=Math.floor(Number(String(input?.value||"").replace(",","."))||0);if(n<min||n>max){input?.focus();return;}finish(n);};
      const onKey=e=>{if(e.key==="Escape"){e.preventDefault();e.stopImmediatePropagation();finish(null);}else if(e.key==="Enter"){e.preventDefault();e.stopImmediatePropagation();submit();}};
      wrap.querySelector(".jkc-confirm-cancel")?.addEventListener("click",()=>finish(null),{once:true});wrap.querySelector(".jkc-confirm-ok")?.addEventListener("click",submit);wrap.addEventListener("click",e=>{if(e.target===wrap)finish(null)});document.addEventListener("keydown",onKey,true);
      if(layer.supportsDialog)wrap.addEventListener("cancel",e=>{e.preventDefault();finish(null);},{once:true});
      layer.show();setTimeout(()=>{input?.focus();input?.select();},0);
    });
  }

  function settingsCardHtml(){return `<section class="settings-v62-group settings-wide jkc-settings-card" data-jkc-settings><header><span>◈</span><div><b>JK/Coins</b><small>Kaufanfragen, Guthaben und Bonuspakete</small></div></header><div class="settings-v62-row settings-wide"><span><b>Aktuelles Guthaben</b><small>Deine JK/Coin-Pakete und Kontobewegungen.</small></span><strong data-jkc-settings-balance>${coinState()?.balance||0} JK/Coin</strong></div><div class="jkc-settings-pack-grid">${PACKS.map(p=>`<button type="button" data-jkc-request-pack="${p.id}"><b>${p.coins.toLocaleString("de-DE")} JK/Coin</b><small>${p.eur.toFixed(2).replace(".",",")} €${p.bonus?` · +${p.bonus}%`:""}</small></button>`).join("")}</div></section>`;}
  function installSettingsCard(){const panel=document.querySelector("#settingsView .settings-panel");if(!panel||panel.querySelector("[data-jkc-settings]"))return;const wrapper=document.createElement("div");wrapper.innerHTML=settingsCardHtml();const card=wrapper.firstElementChild;const support=panel.querySelector("[data-online-mod-settings]");if(support)panel.insertBefore(card,support);else panel.append(card);card.querySelectorAll("[data-jkc-request-pack]").forEach(b=>b.addEventListener("click",()=>requestPack(b.dataset.jkcRequestPack)));}

  async function requestPack(packId){
    const pack=PACKS.find(p=>p.id===packId);if(!pack)return;
    const c=coinState();if(!c)return toast("JK/Coin wartet noch auf deinen Spielstand.");
    if(!await jkcConfirm({title:"JK/Coin-Kaufanfrage",message:`${pack.coins.toLocaleString("de-DE")} JK/Coin\nPreis: ${pack.eur.toFixed(2).replace(".",",")} €\n\nDie Anfrage wird an den Owner gesendet.`,confirmText:"Anfrage senden",icon:"◆"}))return;
    const local={id:`local-${Date.now()}`,packId,status:"pending",coins:pack.coins,eur:pack.eur,createdAtMs:Date.now()};c.requests.unshift(local);persist();
    try{
      const fb=await runtime(),user=await currentUser(fb);if(!user)throw new Error("Bitte zuerst anmelden.");
      const ref=fb.doc(fb.collection(fb.db,PURCHASE_COLLECTION));
      const payload={requestId:ref.id,status:"pending",uid:user.uid,email:user.email||"",displayName:userName(),slot:Math.max(0,Number(typeof selectedSlot!=="undefined"?selectedSlot:0)),packId:pack.id,coins:pack.coins,eurCents:Math.round(pack.eur*100),bonusPercent:pack.bonus,createdAtMs:Date.now(),updatedAtMs:Date.now(),source:location.origin,currentBalance:c.balance};
      await fb.setDoc(ref,payload);local.id=ref.id;local.online=true;persist();toast("JK/Coin-Kaufanfrage wurde an den Owner gesendet.");
    }catch(error){toast(`Anfrage lokal gespeichert, aber Firebase meldet: ${String(error?.message||error).replace(/^FirebaseError:\s*/i,"")}`);}
    updateSettingsBalance();
  }
  function updateSettingsBalance(){document.querySelectorAll("[data-jkc-settings-balance]").forEach(el=>el.textContent=`${coinState()?.balance||0} JK/Coin`);}

  function saveNavMemory(){try{sessionStorage.setItem(NAV_STORAGE,JSON.stringify({tabScroll:ui.tabScroll,gameScroll:ui.gameScroll,collectionScroll:ui.collectionScroll}));}catch{}}
  function scrollNavHtml(kind,buttons){return `<div class="jkc-scroll-nav" data-jkc-scroll-nav="${kind}"><button type="button" class="jkc-scroll-arrow" data-jkc-scroll-dir="-1" aria-label="Nach links">‹</button><div class="jkc-scroll-track" data-jkc-scroll-track>${buttons}</div><button type="button" class="jkc-scroll-arrow" data-jkc-scroll-dir="1" aria-label="Nach rechts">›</button><div class="jkc-scroll-rail" data-jkc-scroll-rail role="scrollbar" aria-label="Navigation verschieben"><i data-jkc-scroll-thumb></i></div></div>`;}
  function rememberNav(shell){shell?.querySelectorAll?.("[data-jkc-scroll-nav]").forEach(nav=>{const track=nav.querySelector("[data-jkc-scroll-track]");if(!track)return;if(nav.dataset.jkcScrollNav==="tabs")ui.tabScroll=track.scrollLeft;else if(nav.dataset.jkcScrollNav==="games")ui.gameScroll=track.scrollLeft;});saveNavMemory();}
  function bindScrollNav(shell){shell.querySelectorAll("[data-jkc-scroll-nav]").forEach(nav=>{const kind=nav.dataset.jkcScrollNav,track=nav.querySelector("[data-jkc-scroll-track]"),rail=nav.querySelector("[data-jkc-scroll-rail]"),thumb=nav.querySelector("[data-jkc-scroll-thumb]");if(!track||!rail||!thumb)return;const key=kind==="tabs"?"tabScroll":"gameScroll";const update=()=>{const max=Math.max(0,track.scrollWidth-track.clientWidth),ratio=track.scrollWidth?Math.min(1,track.clientWidth/track.scrollWidth):1,railW=rail.clientWidth||1,thumbW=Math.max(34,railW*ratio),travel=Math.max(0,railW-thumbW);thumb.style.width=`${thumbW}px`;thumb.style.transform=`translateX(${max?travel*(track.scrollLeft/max):0}px)`;ui[key]=track.scrollLeft;saveNavMemory();};const restore=()=>{track.scrollLeft=Math.min(Math.max(0,Number(ui[key])||0),Math.max(0,track.scrollWidth-track.clientWidth));update();};nav.querySelectorAll("[data-jkc-scroll-dir]").forEach(btn=>btn.addEventListener("click",()=>track.scrollBy({left:Number(btn.dataset.jkcScrollDir||1)*Math.max(150,track.clientWidth*.72),behavior:"smooth"})));track.addEventListener("scroll",update,{passive:true});track.addEventListener("wheel",event=>{if(Math.abs(event.deltaY)>Math.abs(event.deltaX)){event.preventDefault();track.scrollLeft+=event.deltaY;}},{passive:false});let railPointer=null;const moveRail=event=>{if(railPointer!==event.pointerId)return;const rect=rail.getBoundingClientRect(),max=Math.max(0,track.scrollWidth-track.clientWidth),thumbW=thumb.getBoundingClientRect().width||34,travel=Math.max(1,rect.width-thumbW),x=Math.max(0,Math.min(travel,event.clientX-rect.left-thumbW/2));track.scrollLeft=max*(x/travel);};rail.addEventListener("pointerdown",event=>{event.preventDefault();railPointer=event.pointerId;try{rail.setPointerCapture(event.pointerId);}catch{}moveRail(event);});rail.addEventListener("pointermove",moveRail);const end=event=>{if(railPointer===event.pointerId)railPointer=null;};rail.addEventListener("pointerup",end);rail.addEventListener("pointercancel",end);requestAnimationFrame(restore);setTimeout(restore,80);});}
  function bindCollectionFilterScroll(shell){const track=shell.querySelector("[data-jkc-collection-filter-track]");if(!track)return;const update=()=>{ui.collectionScroll=Math.max(0,track.scrollLeft||0);saveNavMemory();};const restore=()=>{track.scrollLeft=Math.min(Math.max(0,Number(ui.collectionScroll)||0),Math.max(0,track.scrollWidth-track.clientWidth));};track.addEventListener("scroll",update,{passive:true});requestAnimationFrame(restore);setTimeout(restore,80);}

  function safeUpper(value){return String(value??"").toLocaleUpperCase("de-DE");}
  function safeText(value,fallback=""){const s=String(value??"").trim();return s||fallback;}

  function html(){
    const c=coinState();
    if(!c)return `<div class="jkc-app"><section class="jkc-section"><small>JK/COIN</small><h4>Spielstand wird geladen …</h4><p>JK/Coin ist gleich verfügbar.</p></section></div>`;
    const rate=currentRate();
    const tabs=[["home","Übersicht"],["boxes","Lucky Boxes"],["collectorBoxes","Sammlerkisten"],["games","Spiele"],["collection","Sammlung"],["fragments","Fragmente"],["ledger","Kontobewegungen"]].map(([id,label])=>`<button type="button" class="jkc-nav-pill ${ui.tab===id?"active":""}" data-jkc-tab="${id}">${label}</button>`).join("");
    return `<div class="jkc-app"><section class="jkc-hero"><div class="jkc-hero-head"><div style="display:flex;gap:12px"><span class="jkc-logo">JK</span><div><small>PREMIUM-WÄHRUNG</small><h3>JK/Coin</h3><p style="margin:0;color:#a5b5c2">Lucky Boxes, Sammlerkisten, Spiel-Extras und Sammlung.</p></div></div><div class="jkc-wallet"><small>GUTHABEN</small><b>${c.balance.toLocaleString("de-DE")}</b><em>1 JK/Coin = ${euro(rate)}</em></div></div></section>${scrollNavHtml("tabs",tabs)}${ui.tab==="boxes"?boxesHtml():ui.tab==="collectorBoxes"?collectorBoxesHtml():ui.tab==="games"?gamesHtml():ui.tab==="collection"?collectionHtml():ui.tab==="fragments"?fragmentsHtml():ui.tab==="ledger"?ledgerHtml():homeHtml()}</div>`;
  }
  function homeHtml(){const c=coinState(),rate=currentRate();return `<section class="jkc-section"><small>JK/COIN-MARKT</small><h4>Aktueller Umtauschkurs</h4><div class="jkc-rate"><div><small>NÄCHSTE ÄNDERUNG IN ${nextRateMinutes()} MIN.</small><b>1 JK/Coin = ${euro(rate)}</b><p>Normale Ingame-Euro-Währung kann nicht gegen JK/Coins getauscht werden.</p></div><button class="jkc-button gold" data-jkc-exchange>Umtauschen</button></div></section><section class="jkc-section"><small>JK/COIN-PAKETE</small><h4>JK/Coin-Pakete</h4><div class="jkc-grid">${PACKS.map(p=>`<article class="jkc-card highlight"><div class="jkc-pack"><span class="jkc-pack-icon">${p.coins>=3000?"◆":"JK"}</span><div><h5>${p.coins.toLocaleString("de-DE")} JK/Coin</h5><p>${p.bonus?`<span class="jkc-bonus">+${p.bonus}% Bonus</span>`:"Standardpaket"}</p></div><strong>${p.eur.toFixed(2).replace(".",",")} €</strong></div><div class="jkc-actions"><button class="jkc-button" data-jkc-request-pack="${p.id}">Anfrage senden</button></div></article>`).join("")}</div></section>`;}
  function boxesHtml(){return `<section class="jkc-section"><small>LUCKY BOXEN · JK/COIN</small><h4>Premium-Lucky-Boxes</h4><div class="jkc-grid">${BOXES.filter(b=>b.type==="reward"&&b.currency!=="euro").map(b=>boxCard(b)).join("")}</div></section><section class="jkc-section"><small>LUCKY BOXEN · EURO</small><h4>Euro-Lucky-Boxes</h4><div class="jkc-grid">${BOXES.filter(b=>b.type==="reward"&&b.currency==="euro").map(b=>boxCard(b)).join("")}</div></section>`;}
  function collectorBoxesHtml(){return `<section class="jkc-section"><small>SAMMLERKISTEN · JK/COIN · 6.470 MÖGLICHE ITEMS</small><h4>Premium-Sammlerkisten</h4><div class="jkc-grid">${BOXES.filter(b=>b.type==="collect"&&b.currency!=="euro").map(b=>boxCard(b)).join("")}</div></section><section class="jkc-section"><small>SAMMLERKISTEN · EURO</small><h4>Euro-Sammlerkisten</h4><div class="jkc-grid">${BOXES.filter(b=>b.type==="collect"&&b.currency==="euro").map(b=>boxCard(b)).join("")}</div></section>`;}
  function boxCard(b){const probs=b.type==="collect"?collectChancesForBox(b):null,payment=b.currency==="euro"?euro(b.cost):`${b.cost.toLocaleString("de-DE")} JK/Coin`,kindLabel=b.type==="collect"?"SAMMLER-KISTE":"LUCKY BOX",currencyLabel=b.currency==="euro"?"EURO":"JK/COIN",rewardText=b.type==="reward"?`Bankbonus, Haupt-EP, Kleidung, Hauptskins, Special-App-Items und Jetons.${b.currency!=="euro"?" Zusätzlich ist JK/Coin-Cashback möglich.":""}${b.tier==="galaxy"?" Extrem selten kann ein besonderer Galaxy-Hauptskin erscheinen.":""}`:`${Number(b.items)||1} Sammlerstücke pro Kiste. Mögliche Raritäten reichen von Gewöhnlich bis Galaxy; besonders hohe Treffer bleiben selten.`;return `<article class="jkc-card jkc-box" style="--box-color:${b.tier==="galaxy"?"#ff72d7":["elite","master","universe"].includes(b.tier)?"#a46cff":"#64e6ff"}"><div class="jkc-box-icon">${b.type==="collect"?"◈":"🎁"}</div><small>${currencyLabel} · ${kindLabel}</small><h5>${esc(b.name)}</h5><p>${rewardText}</p>${b.type==="reward"?`<div class="jkc-box-hype">🔥 +${hypeForBox(b).toLocaleString("de-DE")} % Hype</div>`:""}${probs?`<div class="jkc-prob-list">${["epic","legendary","special","universe","blackhole","galaxy"].map(id=>`<span>${RARITIES.find(r=>r.id===id).name}<br><b>${formatChance(probs[id])}%</b></span>`).join("")}</div>`:""}<div class="jkc-actions"><button class="jkc-button gold" data-jkc-open-box="${b.id}">${payment}</button></div></article>`;}
  function formatChance(value){const n=Math.max(0,Number(value)||0);return n>=1?String(Number(n.toFixed(3))).replace(".",","):String(Number(n.toFixed(6))).replace(".",",");}
  function bigCardsStorageTarget(entry){if(entry?.game!=="bigcards")return 0;const kind=String(entry?.grant?.kind||"");if(!kind.startsWith("featuredStorage:"))return 0;return Math.max(0,Math.floor(Number(kind.split(":")[1])||0));}
  function bigCardsPermanentOwned(entry){if(entry?.game!=="bigcards")return false;const kind=String(entry?.grant?.kind||"");try{if(kind==="bulkLevelUnlock"||kind==="bulkRebirthUnlock")return false;if(kind==="vipUnlock")return !!window.BigCardsKL?.hasVip?.()||Number(coinState()?.gamePurchases?.[entry.id]||0)>0;const target=bigCardsStorageTarget(entry);return target?Math.floor(Number(window.BigCardsKL?.getFeaturedStorageTier?.())||0)>=target:false;}catch{return false;}}
  function gamePermanentOwned(entry){if(bigCardsPermanentOwned(entry))return true;if(entry?.game!=="escape")return false;const kind=String(entry?.grant?.kind||"");if(kind==="speedBoost:2")return false;try{const st=window.EscapeKL?.getState?.()||{};if(kind.startsWith("pet:"))return Array.isArray(st.ownedPets)&&st.ownedPets.includes(kind.split(":")[1]);if(kind==="trail:galaxy")return Array.isArray(st.ownedTrails)&&st.ownedTrails.includes("galaxy");if(kind==="speedTreadmill:gold")return Number(st.jkTreadmillTier||0)>=1||st.ownedTreadmills?.includes?.("gold");if(kind==="speedTreadmill:diamond")return Number(st.jkTreadmillTier||0)>=2||st.ownedTreadmills?.includes?.("diamond");if(kind==="speedTreadmill:galaxy")return st.ownedTreadmills?.includes?.("galaxy");if(kind==="speedTreadmill:admin")return st.ownedTreadmills?.includes?.("admin");if(kind==="character:demon-transformation")return st.ownedSpecialCharacters?.includes?.("demon-transformation");if(kind==="character:demon-galaxy")return !!st.demonGalaxyUpgrade;}catch{}return Number(coinState()?.gamePurchases?.[entry.id]||0)>0;}
  function bigCardsBulkAccessMeta(entry){if(entry?.game!=="bigcards")return null;const kind=String(entry?.grant?.kind||"");if(kind!=="bulkLevelUnlock"&&kind!=="bulkRebirthUnlock")return null;try{const getter=kind==="bulkRebirthUnlock"?"getBulkRebirthAccessState":"getBulkLevelAccessState",st=window.BigCardsKL?.[getter]?.()||{};const until=Math.max(0,Number(st.until)||0),active=!!st.active&&until>Date.now(),ms=Math.max(0,until-Date.now()),sec=Math.max(0,Math.ceil(ms/1000)),h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),ss=sec%60;return {active,until,kind,remaining:`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(ss).padStart(2,"0")}`};}catch{return {active:false,until:0,kind,remaining:"00:00:00"};}}
  const GAME_SHOP_CATEGORIES = Object.freeze({
    packs:{label:"Packs & Kisten",icon:"🎴",desc:"Packs, Kisten und Ziehungen."},
    auras:{label:"Auras",icon:"✦",desc:"Produktions-Auras und passive Kartenboni."},
    combatAuras:{label:"Kampf-Auras",icon:"⚔",desc:"Auras speziell für Kartenkämpfe."},
    bindings:{label:"Bindungen",icon:"🔗",desc:"Bindungen und dauerhafte XP-Verstärker."},
    trails:{label:"Spuren",icon:"☄",desc:"Spuren und persönliche Karten-Effekte."},
    pets:{label:"Pets",icon:"🪽",desc:"Begleiter und dauerhafte Pet-Freischaltungen."},
    storage:{label:"Speicher & Slots",icon:"🗄",desc:"Dauerhafte Limits, Slots und Freischaltungen."},
    currency:{label:"Währung",icon:"💰",desc:"Spielwährungen und direkte Guthaben."},
    boosts:{label:"Booster",icon:"⚡",desc:"Tempo, Produktion, XP, Kampf- und Glücksboni."},
    vip:{label:"VIP",icon:"👑",desc:"Permanente VIP-Programme, tägliche Boni und exklusive VIP-Inhalte."},
    makers:{label:"Produktions-Maker",icon:"🏭",desc:"Permanente Money.KL-Maker. Keine Zeit-Booster."},
    equipment:{label:"Items & Versorgung",icon:"🎒",desc:"Ausrüstung, Verbrauchsitems, Reparatur und Versorgung."},
    cosmetics:{label:"Design & Exklusiv",icon:"✨",desc:"Skins, Figuren, Designs und optische Extras."},
    comfort:{label:"Komfort & Auto",icon:"🤖",desc:"Automatik und Komfort-Funktionen."},
    extras:{label:"Weitere Extras",icon:"◆",desc:"Weitere spielbezogene JK/Coin-Inhalte."}
  });
  function gameShopCategory(entry){
    const kind=String(entry?.grant?.kind||"").toLowerCase(),id=String(entry?.id||"").toLowerCase(),name=String(entry?.name||"").toLowerCase(),hay=`${kind} ${id} ${name}`;
    if(kind==="vipunlock"||(entry?.game==="bigcards"&&/\bvip\b/.test(hay)))return"vip";
    if(kind.startsWith("pack:")||kind==="exclusivepack"||/\bpack\b|crate|kiste|box/.test(hay))return"packs";
    if(kind.startsWith("combataura:"))return"combatAuras";
    if(kind.startsWith("aura:"))return"auras";
    if(kind.startsWith("bind:"))return"bindings";
    if(kind.startsWith("trail:"))return"trails";
    if(kind.startsWith("pet:"))return"pets";
    if(kind.startsWith("jkmaker:"))return"makers";
    if(kind.startsWith("featuredstorage:")||/storage|speicher|slot/.test(hay))return"storage";
    if(/skin|design|figure|figur|cosmetic|kleidung|outfit|theme|lack|farbe/.test(hay))return"cosmetics";
    if(/^finishexpedition:/.test(kind)||/auto|bulklevel|bulkrebirth|unlock|komfort|collector|opener/.test(hay))return"comfort";
    if(/^pointsboost:|^xpboost:|^damageboost:|^vipclickboost:|^bossdamageboost:|^production(?:2|4|6|8|10|12|14|16|18|20)$/.test(kind)||/boost|mult|multiplier|magnet|speed|tempo|xp|ep|luck|glück|damage|schaden|def|shield|leben|health|godmode|produktion|production|nitro/.test(hay))return"boosts";
    if(/coin|coins|gold|geld|cash|jeton|währung|currency|punkte|points/.test(hay))return"currency";
    if(/weapon|waffe|armor|rüstung|item|kit|repair|repar|revive|fuel|kanister|key|schlüssel|munition|ammo|trank|potion|chip|mine|booster/.test(hay))return"equipment";
    return"extras";
  }
  function gameShopIcon(entry){
    const category=gameShopCategory(entry),kind=String(entry?.grant?.kind||"").toLowerCase(),name=String(entry?.name||"").toLowerCase();
    if(kind==="vipunlock")return"👑";
    if(kind.startsWith("vipclickboost:"))return"👆";
    if(kind.startsWith("bossdamageboost:"))return"👹";
    if(kind.startsWith("finishexpedition:"))return"🧭";
    if(kind==="autoopenerhour")return"📦";
    if(kind.startsWith("combataura:"))return"⚔";
    if(kind.startsWith("aura:"))return"✦";
    if(kind.startsWith("bind:"))return"🔗";
    if(kind.startsWith("trail:"))return"☄";
    if(kind.startsWith("pet:"))return"🪽";
    if(kind.startsWith("pack:")||kind==="exclusivepack")return"🎴";
    if(/skin|design|figure|figur|outfit/.test(name))return"✨";
    return GAME_SHOP_CATEGORIES[category]?.icon||"◆";
  }
  function dynamicBoosterFamily(entry){const id=String(entry?.id||"");if(/^money-production-(?:2|4|6|8|10|12|14|16|18|20)$/.test(id))return"money-production";if(/^bigcards-points-boost-(?:2|4|6|8|10)$/.test(id))return"bigcards-points";if(/^bigcards-xp-boost-(?:2|4|6|8|10)$/.test(id))return"bigcards-xp";if(/^bigcards-damage-boost-(?:20|40|60|80|100)$/.test(id))return"bigcards-damage";if(/^bigcards-vip-clicks-(?:2|4|6|8|10)$/.test(id))return"bigcards-vip-clicks";if(/^bigcards-boss-team-2$/.test(id))return"bigcards-boss-damage";return"";}
  function dynamicBoosterStage(entry){const id=String(entry?.id||""),m=id.match(/-(\d+)$/);return m?Number(m[1]):0;}
  function dynamicBoosterState(family){try{if(family==="money-production")return window.MoneyKL?.getJkProductionBoostState?.()||{active:false,value:1,until:0,max:20};if(family==="bigcards-points")return window.BigCardsKL?.getJkBoosterState?.("points")||{active:false,value:1,until:0,max:10};if(family==="bigcards-xp")return window.BigCardsKL?.getJkBoosterState?.("xp")||{active:false,value:1,until:0,max:10};if(family==="bigcards-damage"){const st=window.BigCardsKL?.getJkBoosterState?.("damage")||{active:false,value:0,until:0,max:1};return {...st,value:Math.round((Number(st.value)||0)*100),max:100};}if(family==="bigcards-vip-clicks")return window.BigCardsKL?.getJkBoosterState?.("vipClicks")||{active:false,value:1,until:0,max:10};if(family==="bigcards-boss-damage")return window.BigCardsKL?.getJkBoosterState?.("bossDamage")||{active:false,value:1,until:0,max:2};}catch{}return {active:false,value:family==="bigcards-damage"?0:1,until:0,max:family==="money-production"?20:family==="bigcards-damage"?100:family==="bigcards-boss-damage"?2:10};}
  function dynamicBoosterRemaining(until){const ms=Math.max(0,Number(until||0)-Date.now());return ms?`${Math.ceil(ms/60000)} Min.`:"abgelaufen";}
  function collapseDynamicBoosters(items){const out=[],done=new Set();for(const entry of items){const family=dynamicBoosterFamily(entry);if(!family){out.push(entry);continue;}if(done.has(family))continue;done.add(family);const familyItems=items.filter(x=>dynamicBoosterFamily(x)===family).sort((a,b)=>dynamicBoosterStage(a)-dynamicBoosterStage(b)),st=dynamicBoosterState(family),current=st.active?Number(st.value)||0:0;let chosen;if(st.active&&current>=Number(st.max||0))chosen=familyItems.at(-1);else chosen=familyItems.find(x=>dynamicBoosterStage(x)>current)||familyItems[0];if(chosen)out.push(chosen);}return out;}
  function dynamicBoosterMeta(entry){const family=dynamicBoosterFamily(entry);if(!family)return null;const st=dynamicBoosterState(family),stage=dynamicBoosterStage(entry),maxActive=!!st.active&&Number(st.value)>=Number(st.max||0)&&stage>=Number(st.max||0),currentText=family==="bigcards-damage"?`+${Number(st.value)||0} %`:`×${Number(st.value)||1}`,nextText=family==="bigcards-damage"?`+${stage} %`:`×${stage}`;return {family,state:st,stage,maxActive,currentText,nextText,remaining:dynamicBoosterRemaining(st.until)};}
  function dynamicStoreSignature(){const boost=["money-production","bigcards-points","bigcards-xp","bigcards-damage","bigcards-vip-clicks","bigcards-boss-damage"].map(f=>{const st=dynamicBoosterState(f);return `${f}:${st.active?1:0}:${Number(st.value)||0}`}).join("|"),level=bigCardsBulkAccessMeta({game:"bigcards",grant:{kind:"bulkLevelUnlock"}}),rebirth=bigCardsBulkAccessMeta({game:"bigcards",grant:{kind:"bulkRebirthUnlock"}});return `${boost}|bigcards-level:${level?.active?1:0}|bigcards-rebirth:${rebirth?.active?1:0}`;}
  function shopScrollHost(root=document){const overlay=root.querySelector?.(".jkc-ingame-card")||document.querySelector(".jkc-ingame-card");if(overlay)return overlay;const app=root.querySelector?.(".jkc-app")||document.querySelector(".device-shell .jkc-app");let el=app;while(el&&el!==document.body){if(el.scrollHeight>el.clientHeight+8){const style=getComputedStyle(el);if(/auto|scroll/.test(style.overflowY))return el;}el=el.parentElement;}return null;}
  function rememberShopPageScroll(root=document){const host=shopScrollHost(root);if(host)ui.pageScroll=Math.max(0,host.scrollTop||0);}
  function restoreShopPageScroll(root=document){requestAnimationFrame(()=>{const host=shopScrollHost(root);if(host)host.scrollTop=Math.min(Math.max(0,Number(ui.pageScroll)||0),Math.max(0,host.scrollHeight-host.clientHeight));});setTimeout(()=>{const host=shopScrollHost(root);if(host)host.scrollTop=Math.min(Math.max(0,Number(ui.pageScroll)||0),Math.max(0,host.scrollHeight-host.clientHeight));},80);}

  function gameShopEffect(entry){
    const kind=String(entry?.grant?.kind||""),amount=Math.max(1,Number(entry?.grant?.amount)||1);
    if(kind.startsWith("pack:"))return `Gibt ${amount} Pack-Credit für ${safeText(entry.name,"dieses Pack")}.`;
    if(kind==="exclusivePack")return `Gibt ${amount} Exclusive-Pack-Credit für den exklusiven BigCards-Pool.`;
    if(kind.startsWith("aura:"))return "Wird deinem BigCards-Aura-Inventar gutgeschrieben und kann auf eine passende Karteninstanz gelegt werden.";
    if(kind.startsWith("combatAura:"))return "Wird deinem Kampf-Aura-Inventar gutgeschrieben und verstärkt eine ausgerüstete Karte im Kartenkampf.";
    if(kind.startsWith("bind:"))return "Wird deinem Bindungs-Inventar gutgeschrieben und kann auf eine konkrete Karte ausgerüstet werden.";
    if(kind.startsWith("trail:"))return "Gibt eine Spur für deine persönliche BigCards-Karte; die normale Rank-Freischaltung zum Ausrüsten bleibt bestehen.";
    if(kind.startsWith("featuredStorage:"))return "Dauerhafte Speicherfreischaltung für den persönlichen BigCards-Kartenslot.";
    if(kind==="vipUnlock")return "Permanente BigCards-VIP-Freischaltung: tägliches VIP-Glücksrad, VIP-Klicker, 100 VIP-Karten, Bosse, Klicker-Upgrades, Boss-Special-Attacken und vorzeitige Spielfeld-Freigaben für höhere Karten gegen sehr hohe Point-Kosten. Ohne VIP dürfen nur regulär freigeschaltete normale/Wins-Karten aufs Spielfeld; alte Vorzeit-Freigaben werden entfernt. Einmal gekauft bleibt VIP dauerhaft aktiv.";
    if(kind==="bulkLevelUnlock")return "24-Stunden-Komfortzugang: Die aktuell gewählte BigCards-Sammlung kann automatisch gelevelt werden – normale Raritäten, Exclusive oder VIP. Der Zugang läuft nach exakt 24 Stunden ab und muss dann erneut für 500 JK/Coin gekauft werden.";
    if(kind==="bulkRebirthUnlock")return "24-Stunden-Komfortzugang: Alle aktuell möglichen Level-5-Karten der gewählten BigCards-Sammlung – einschließlich Exclusive oder VIP – können gesammelt um genau eine Rebirth-Stufe erhöht werden. Der Zugang läuft nach exakt 24 Stunden ab und muss dann erneut für 500 JK/Coin gekauft werden.";
    if(kind.startsWith("pointsBoost:"))return "15-Minuten-Points-Booster für BigCards: wirkt gleichzeitig auf Stockwerk und persönliche Karte. Beim Upgrade wird die Zeit auf exakt 15 Minuten gesetzt, niemals addiert.";
    if(kind.startsWith("xpBoost:"))return "15-Minuten-XP-Booster für BigCards: wirkt auf Stockwerk und persönliche Karte. Die nächste Stufe ersetzt die vorige; keine Zeitstapelung.";
    if(kind.startsWith("damageBoost:"))return "15-Minuten-Kampfbooster für BigCards. +20/+40/+60/+80/+100 % entsprechen ×1,20 bis ×2,00 Gesamtschaden. Keine Zeitstapelung.";
    if(kind.startsWith("vipClickBoost:"))return "VIP-Klick-Booster für exakt 1 Stunde. Die Stufen ×2/×4/×6/×8/×10 erscheinen nacheinander im selben Shop-Feld. Ein Upgrade ersetzt die vorige Stufe und setzt die Laufzeit wieder auf genau 1 Stunde – Restzeit wird nicht addiert.";
    if(kind==="bossDamageBoost:2")return "Verdoppelt die gesamte berechnete Team-Power beim wöchentlichen Kartenboss für exakt 1 Stunde. Ein erneuter Kauf startet wieder genau eine Stunde; Zeit wird nicht gestapelt.";
    if(/^finishExpedition:[0-3]$/.test(kind)){const slot=Number(kind.split(":")[1])+1;return `Schließt eine aktuell laufende, noch nicht fertige Expedition in Slot ${slot} sofort ab. Du holst die normale Belohnung danach im Expeditionsbereich ab; es entsteht keine zweite Belohnung.`;}
    if(kind==="autoOpenerHour")return "Gibt 1 Stunde gemeinsame Auto-Opener-Arbeitszeit. Kauf 1–4 schaltet zusätzlich je einen Kanal frei. Mit mehreren aktiven Kanälen wird der Zeitpool parallel verbraucht; maximal vier Packs gleichzeitig.";
    if(kind.startsWith("jkMaker:"))return "Permanenter Money.KL-Produktions-Maker. Er bleibt im Besitz und kann im Money.KL-System bis Level 20 ausgebaut werden; er ist kein 15-Minuten-Booster.";
    if(entry?.variable)return "Du wählst beim Kauf selbst die Menge; der JK/Coin-Preis entspricht der gewählten Menge.";
    return safeText(entry?.text,"Der Inhalt wird nach dem Kauf direkt dem angegebenen Spiel gutgeschrieben.");
  }
  function gameShopCard(entry,labels){
    const gameKey=String(entry?.game||""),gameLabel=safeText(labels[gameKey]||GAME_LABELS?.[gameKey],"Spiel"),name=safeText(entry?.name,"Spiel-Inhalt"),description=safeText(entry?.text,"JK/Coin-Inhalt"),permanentOwned=gamePermanentOwned(entry),category=gameShopCategory(entry),meta=GAME_SHOP_CATEGORIES[category]||GAME_SHOP_CATEGORIES.extras,icon=gameShopIcon(entry),dyn=dynamicBoosterMeta(entry),timed=bigCardsBulkAccessMeta(entry),disabled=permanentOwned||!!dyn?.maxActive||!!timed?.active;
    const dynDuration=(dyn?.family==="bigcards-vip-clicks"||dyn?.family==="bigcards-boss-damage")?"exakt 1 Stunde":"exakt 15 Minuten";
    const dynState=dyn?`<div class="jkc-dynamic-boost"><b>${dyn.state.active?`Aktiv ${esc(dyn.currentText)} · ${esc(dyn.remaining)}`:"Bereit · Startstufe"}</b><small>${dyn.maxActive?"MAX aktiv · nach Ablauf erscheint wieder die erste Stufe":`Nächster Kauf: ${esc(dyn.nextText)} · ${dynDuration}`}</small></div>`:"";
    return `<article class="jkc-card jkc-game-store-card ${permanentOwned?"owned":""} ${dyn?"dynamic-booster":""} ${timed?"timed-bulk":""}" data-jkc-store-category="${category}"><div class="jkc-store-card-top"><span class="jkc-store-item-icon" aria-hidden="true">${icon}</span><div class="jkc-store-card-labels"><small>${esc(safeUpper(gameLabel))}</small><em>${esc(meta.label)}</em></div><button type="button" class="jkc-store-info" data-jkc-game-info="${esc(entry?.id||"")}" aria-label="Info zu ${esc(name)}">i</button></div><h5>${esc(name)}</h5><p>${esc(description)}</p>${dynState}${timed?`<div class="jkc-dynamic-boost"><b>${timed.active?`Aktiv · ${esc(timed.remaining)} Restzeit`:"Bereit · 24 Stunden"}</b><small>${timed.active?"Nach Ablauf kann der Zugang erneut für 500 JK/Coin gekauft werden.":"Kauf startet exakt 24 Stunden Zugriff; keine Dauerfreischaltung."}</small></div>`:""}${gameKey==="fight"&&entry?.requiredFightLevel?`<div class="jkc-fight-level-note">🔒 Kauf sofort möglich · Benutzung erst ab Fight-Level ${Number(entry.requiredFightLevel)||1}</div>`:""}<div class="jkc-actions"><button class="jkc-button" data-jkc-buy-game="${esc(entry?.id||"")}" ${disabled?"disabled":""}>${permanentOwned?"Freigeschaltet ✓":timed?.active?`Aktiv · ${esc(timed.remaining)}`:dyn?.maxActive?`MAX aktiv · ${esc(dyn.remaining)}`:entry?.variable?"Betrag wählen":`${Math.max(0,Number(entry?.cost)||0).toLocaleString("de-DE")} JK/Coin`}</button></div></article>`;
  }
  function gamesHtml(){
    ui.dynamicSignature=dynamicStoreSignature();
    const games=["all","runner","city","match","fight","dungeon","money","bigcards","escape","egoshoot","weed","casino"],labels={all:"Alle Spiele",runner:"Runner.KL",city:"City.KL",match:"Match.KL",fight:"Fight.KL",dungeon:"Dungeon.KL",money:"Money.KL",bigcards:"BigCards.kl",escape:"Escape.kl",egoshoot:"Egoshoot.KL",weed:"Weed Business",casino:"Casino"};
    const gameList=ensureRequiredBigCardsComfort(collapseDynamicBoosters(GAME_STORE.filter(item=>item&&typeof item==="object"&&(ui.game==="all"||String(item.game||"")===ui.game))));
    const present=[...new Set(gameList.map(gameShopCategory))];
    if(ui.gameCategory!=="all"&&!present.includes(ui.gameCategory))ui.gameCategory="all";
    const list=gameList.filter(item=>ui.gameCategory==="all"||gameShopCategory(item)===ui.gameCategory);
    const filters=games.map(g=>`<button class="jkc-button ${ui.game===g?"gold":"secondary"}" data-jkc-game-filter="${g}">${esc(labels[g]||g)}</button>`).join("");
    const categoryButtons=[`<button type="button" class="jkc-store-category-pill ${ui.gameCategory==="all"?"active":""}" data-jkc-game-category="all"><span>▦</span>Alle Kategorien</button>`,...present.map(id=>{const m=GAME_SHOP_CATEGORIES[id]||GAME_SHOP_CATEGORIES.extras;return `<button type="button" class="jkc-store-category-pill ${ui.gameCategory===id?"active":""}" data-jkc-game-category="${id}"><span>${m.icon}</span>${esc(m.label)}</button>`})].join("");
    const grouped=(ui.gameCategory==="all"?present.map(id=>({id,items:list.filter(x=>gameShopCategory(x)===id)})).filter(g=>g.items.length):[{id:ui.gameCategory,items:list}]).map(group=>group.id==="comfort"?{...group,items:group.items.slice().sort((a,b)=>bigCardsComfortPriority(a)-bigCardsComfortPriority(b))}:group);
    return `<section class="jkc-section jkc-store-shell"><div class="jkc-store-title"><div><small>SPIELE-SHOP · NEUE ÜBERSICHT</small><h4>JK/Coin-Inhalte</h4><p>Wähle zuerst ein Spiel und danach eine Kategorie. Mit <b>i</b> siehst du bei jedem Angebot genau, was es macht.</p></div><span class="jkc-store-count">${list.length.toLocaleString("de-DE")} Angebote</span></div>${scrollNavHtml("games",filters)}<div class="jkc-store-category-bar">${categoryButtons}</div>${grouped.map(group=>{const meta=GAME_SHOP_CATEGORIES[group.id]||GAME_SHOP_CATEGORIES.extras;return `<section class="jkc-store-category-section"><header><span>${meta.icon}</span><div><b>${esc(meta.label)}</b><small>${esc(meta.desc)}</small></div><em>${group.items.length}</em></header><div class="jkc-store-grid">${group.items.map(item=>gameShopCard(item,labels)).join("")}</div></section>`}).join("")||`<div class="jkc-store-empty">In dieser Auswahl gibt es aktuell keine Angebote.</div>`}</section>`;
  }
  function openGameItemInfo(id){
    const entry=GAME_STORE.find(x=>String(x?.id||"")===String(id||""));if(!entry)return;
    document.querySelector("[data-jkc-game-info-modal]")?.remove();
    const category=gameShopCategory(entry),meta=GAME_SHOP_CATEGORIES[category]||GAME_SHOP_CATEGORIES.extras,gameLabel=GAME_LABELS?.[entry.game]||entry.game||"JK.Games",permanentOwned=gamePermanentOwned(entry),dyn=dynamicBoosterMeta(entry),timed=bigCardsBulkAccessMeta(entry),price=permanentOwned?"Bereits freigeschaltet":timed?.active?`Aktiv · ${timed.remaining}`:dyn?.maxActive?`MAX aktiv · ${dyn.remaining}`:entry.variable?"Menge wählbar":`${Math.max(0,Number(entry.cost)||0).toLocaleString("de-DE")} JK/Coin`;
    const dialog=document.createElement("dialog");dialog.className="jkc-game-info-modal";dialog.dataset.jkcGameInfoModal="1";
    dialog.innerHTML=`<div class="jkc-game-info-card"><header><div><span class="jkc-game-info-icon">${gameShopIcon(entry)}</span><div><small>${esc(safeUpper(gameLabel))} · ${esc(safeUpper(meta.label))}</small><h2>${esc(safeText(entry.name,"JK/Coin-Inhalt"))}</h2></div></div><button type="button" data-jkc-game-info-close aria-label="Info schließen">×</button></header><div class="jkc-game-info-body"><article><small>WAS IST DAS?</small><p>${esc(safeText(entry.text,"Spielinhalt aus dem JK/Coin-Shop."))}</p></article><article><small>WIRKUNG</small><p>${esc(gameShopEffect(entry))}</p></article>${dyn?`<article><small>DYNAMISCHE BOOSTER-STUFE</small><p>${dyn.state.active?`Aktuell ${esc(dyn.currentText)} aktiv (${esc(dyn.remaining)}). `:""}${dyn.maxActive?"Maximalstufe aktiv. Nach Ablauf beginnt der Shop wieder bei der ersten Stufe.":`Dieser Kauf schaltet ${esc(dyn.nextText)} für exakt 15 Minuten. Die Restzeit der vorherigen Stufe wird nicht addiert.`}</p></article>`:""}${timed?`<article><small>24-STUNDEN-ZUGANG</small><p>${timed.active?`Aktuell noch ${esc(timed.remaining)} aktiv. Während dieser Zeit ist kein erneuter Kauf nötig.`:"Der Kauf startet sofort 24 Stunden Zugriff. Danach wird der Button wieder gesperrt und kann erneut für 500 JK/Coin gekauft werden."}</p></article>`:""}${entry.game==="fight"&&entry.requiredFightLevel?`<article><small>LEVEL-VORAUSSETZUNG</small><p>Kauf ist sofort möglich. Benutzbar ab Fight-Level ${Number(entry.requiredFightLevel)||1}.</p></article>`:""}<div class="jkc-game-info-price"><span>KOSTEN</span><b>${esc(price)}</b></div></div><div class="jkc-game-info-actions"><button type="button" class="jkc-button secondary" data-jkc-game-info-close>Schließen</button><button type="button" class="jkc-button gold" data-jkc-game-info-buy="${esc(entry.id)}" ${permanentOwned||dyn?.maxActive||timed?.active?"disabled":""}>${permanentOwned?"Freigeschaltet ✓":timed?.active?`Aktiv · ${esc(timed.remaining)}`:esc(price)}</button></div></div>`;
    (document.fullscreenElement||document.body||document.documentElement).append(dialog);
    const close=()=>{try{dialog.close();}catch{}dialog.remove();};
    dialog.querySelectorAll("[data-jkc-game-info-close]").forEach(b=>b.addEventListener("click",close));
    dialog.querySelector("[data-jkc-game-info-buy]")?.addEventListener("click",()=>{const sku=dialog.querySelector("[data-jkc-game-info-buy]")?.dataset.jkcGameInfoBuy;close();buyGameItem(sku,window.JKGamesOwnedPhoneItem?.()||"");});
    dialog.addEventListener("click",event=>{if(event.target===dialog)close();});
    try{dialog.showModal();}catch{dialog.setAttribute("open","");}
  }
  function collectionHtml(){const c=coinState(),unique=Object.keys(c.collectionUnique).length,pct=(unique/TOTAL_COLLECTIBLES*100);const filterIds=["all",...RARITIES.map(r=>r.id)],filterLabel=id=>id==="all"?"Alle":RARITIES.find(r=>r.id===id)?.name||id;const filters=filterIds.map(id=>`<button type="button" class="jkc-button ${ui.collectionRarity===id?"gold":"secondary"}" data-jkc-collection-filter="${id}">${esc(filterLabel(id))}</button>`).join("");const filtered=c.collectibles.filter(item=>ui.collectionRarity==="all"||item.rarity===ui.collectionRarity);const items=filtered.slice(0,200),sellLabel=ui.collectionRarity==="all"?"Alle verkaufen":`${filterLabel(ui.collectionRarity)} verkaufen`,sellTotal=filtered.reduce((sum,x)=>sum+Math.max(0,Number(x?.value)||0),0);return `<section class="jkc-section"><div class="jkc-collection-head"><div><small>JK-SAMMLUNG</small><h4>${unique.toLocaleString("de-DE")} / ${TOTAL_COLLECTIBLES.toLocaleString("de-DE")} entdeckt</h4></div><b>${pct.toFixed(3).replace(".",",")}%</b></div><div class="jkc-progress"><i style="width:${Math.min(100,pct)}%"></i></div><div class="jkc-collection-filter" data-jkc-collection-filter-track aria-label="Sammlung nach Seltenheit filtern">${filters}</div></section><section class="jkc-section"><div class="jkc-collection-result-head"><div><small>${esc(safeUpper(filterLabel(ui.collectionRarity)))}</small><b>${filtered.length.toLocaleString("de-DE")} im Besitz</b></div>${filtered.length?`<button type="button" class="jkc-button danger" data-jkc-sell-collection="${esc(ui.collectionRarity)}">${esc(sellLabel)} · ${euro(sellTotal)}</button>`:""}</div><div class="jkc-grid">${items.length?items.map(item=>`<article class="jkc-card jkc-collectible jkc-rarity-${item.rarity}"><small>${esc(item.rarityName)}</small><h5>${esc(item.name)}</h5><p>${esc(item.description)}</p><strong>${euro(item.value)}</strong><div class="jkc-actions"><button class="jkc-button danger" data-jkc-sell-collectible="${item.uid}">Verkaufen</button></div></article>`).join(""):`<p>In dieser Kategorie befinden sich aktuell keine Sammlerstücke in deinem Besitz.</p>`}</div>${filtered.length>items.length?`<small class="jkc-collection-limit">Es werden die neuesten ${items.length} von ${filtered.length.toLocaleString("de-DE")} Items angezeigt.</small>`:""}</section>`;}
  function fragmentsHtml(){const c=coinState(),f=c?.fragments||{balance:0,lifetime:0,converted:0,ledger:[]},pct=Math.min(100,(Number(f.balance||0)/FRAGMENTS_PER_COIN)*100);return `<section class="jkc-section jkc-fragments"><div class="jkc-fragment-head"><div><small>FREE-TO-PLAY</small><h4>JK-Fragmente</h4></div><button type="button" class="jkc-info-dot" data-jkc-fragment-info aria-label="Informationen zu JK-Fragmenten">i</button></div><div class="jkc-fragment-balance"><strong>${Number(f.balance||0).toLocaleString("de-DE")} / ${FRAGMENTS_PER_COIN}</strong><span>Fragmente bis zum nächsten JK/Coin</span><div class="jkc-progress"><i style="width:${pct}%"></i></div></div><div class="jkc-fragment-stats"><article><small>GESAMT GESAMMELT</small><b>${Number(f.lifetime||0).toLocaleString("de-DE")}</b></article><article><small>UMGEWANDELT</small><b>${Number(f.converted||0).toLocaleString("de-DE")} JK/Coin</b></article></div><p>Je ${FRAGMENTS_PER_COIN} Fragmente werden automatisch in 1 JK/Coin umgewandelt.</p></section><section class="jkc-section"><small>LETZTE FRAGMENTE</small><h4>Verlauf</h4><div class="jkc-ledger">${f.ledger?.length?f.ledger.slice(0,30).map(row=>`<article><div><b>${esc(row.source||"JK.Games")}</b><small>${new Date(Number(row.at)||Date.now()).toLocaleString("de-DE")}</small></div><strong class="plus">+${Number(row.amount||0)}</strong></article>`).join(""):`<p>Noch keine Fragmente gesammelt.</p>`}</div></section>`;}
  function openFragmentInfo(){const old=document.querySelector("[data-jkc-fragment-modal]");old?.remove();const dialog=document.createElement("dialog");dialog.className="jkc-fragment-modal";dialog.dataset.jkcFragmentModal="1";dialog.innerHTML=`<div class="jkc-fragment-info-card"><header><div><small>JK.GAMES · FREE TO PLAY</small><h2>So bekommst du Fragmente</h2></div><button type="button" data-jkc-fragment-close>×</button></header><div class="jkc-fragment-info-list"><article><b>🎁 Täglicher Login</b><p>Kleine Mengen bei den täglichen Geschenken. Serien-Tage geben etwas mehr.</p></article><article><b>✓ Tägliche Quests</b><p>Je nach Schwierigkeitsstufe 5, 8, 12 oder 20 Fragmente pro abgeschlossener Quest.</p></article><article><b>⚔ Fight.KL-Bosse</b><p>Jeder Hauptboss auf Welle 10, 20, 30 … gibt 10 Fragmente.</p></article><article><b>🗝 Dungeon.KL-Bosse</b><p>Besiegte Dungeon-Bosse geben 10 Fragmente.</p></article><article><b>🏆 Events</b><p>Event-Gewinner erhalten größere Fragment-Boni. Der aktuelle Gewinnerbonus wird in der Event-App angezeigt.</p></article></div><div class="jkc-fragment-convert"><b>${FRAGMENTS_PER_COIN} Fragmente = 1 JK/Coin</b><small>Die Umwandlung passiert automatisch.</small></div></div>`;document.body.append(dialog);const close=()=>{try{dialog.close();}catch{}dialog.remove();};dialog.querySelector("[data-jkc-fragment-close]")?.addEventListener("click",close);dialog.addEventListener("click",e=>{if(e.target===dialog)close();});try{dialog.showModal();}catch{dialog.setAttribute("open","");}}

  function ledgerHtml(){const c=coinState();return `<section class="jkc-section"><small>JK/COIN-KONTO</small><h4>Kontobewegungen</h4><div class="jkc-grid"><article class="jkc-card"><small>AKTUELL</small><h5>${c.balance.toLocaleString("de-DE")} JK/Coin</h5></article><article class="jkc-card"><small>GEKAUFT / GUTGESCHRIEBEN</small><h5>${Math.round(c.totalPurchased+c.totalEarned).toLocaleString("de-DE")}</h5></article><article class="jkc-card"><small>AUSGEGEBEN</small><h5>${Math.round(c.totalSpent).toLocaleString("de-DE")}</h5></article><article class="jkc-card"><small>VERSCHENKT</small><h5>${Math.round(c.totalGifted).toLocaleString("de-DE")}</h5></article></div><div class="jkc-ledger">${c.ledger.length?c.ledger.map(row=>`<article><span><b>${esc(row.text)}</b><small>${new Date(row.at).toLocaleString("de-DE")}</small></span><strong class="${row.amount>=0?"plus":"minus"}">${row.amount>=0?"+":""}${Math.round(row.amount).toLocaleString("de-DE")} JK/Coin</strong></article>`).join(""):`<p>Noch keine Kontobewegungen.</p>`}</div></section>`;}

  function bind(shell,item){
    bindScrollNav(shell);
    bindCollectionFilterScroll(shell);shell.querySelector("[data-jkc-fragment-info]")?.addEventListener("click",openFragmentInfo);
    shell.querySelectorAll("[data-jkc-tab]").forEach(b=>b.addEventListener("click",()=>{rememberNav(shell);ui.tab=b.dataset.jkcTab;refreshPhone(item);}));
    shell.querySelectorAll("[data-jkc-go]").forEach(b=>b.addEventListener("click",()=>{rememberNav(shell);ui.tab=b.dataset.jkcGo;refreshPhone(item);}));
    shell.querySelectorAll("[data-jkc-request-pack]").forEach(b=>b.addEventListener("click",()=>{rememberNav(shell);requestPack(b.dataset.jkcRequestPack).then(()=>refreshPhone(item));}));
    shell.querySelector("[data-jkc-exchange]")?.addEventListener("click",()=>exchangePrompt(item));
    shell.querySelectorAll("[data-jkc-open-box]").forEach(b=>b.addEventListener("click",()=>openBox(b.dataset.jkcOpenBox,item)));
    shell.querySelectorAll("[data-jkc-game-filter]").forEach(b=>b.addEventListener("click",()=>{rememberNav(shell);ui.game=b.dataset.jkcGameFilter;ui.gameCategory="all";refreshPhone(item);}));
    shell.querySelectorAll("[data-jkc-game-category]").forEach(b=>b.addEventListener("click",()=>{ui.gameCategory=b.dataset.jkcGameCategory||"all";refreshPhone(item);}));
    shell.querySelectorAll("[data-jkc-game-info]").forEach(b=>b.addEventListener("click",()=>openGameItemInfo(b.dataset.jkcGameInfo)));
    shell.querySelectorAll("[data-jkc-collection-filter]").forEach(b=>b.addEventListener("click",()=>{const track=b.closest("[data-jkc-collection-filter-track]");if(track)ui.collectionScroll=Math.max(0,track.scrollLeft||0);saveNavMemory();ui.collectionRarity=b.dataset.jkcCollectionFilter||"all";refreshPhone(item);}));
    shell.querySelectorAll("[data-jkc-buy-game]").forEach(b=>b.addEventListener("click",()=>buyGameItem(b.dataset.jkcBuyGame,item)));
    shell.querySelectorAll("[data-jkc-sell-collectible]").forEach(b=>b.addEventListener("click",()=>sellCollectible(b.dataset.jkcSellCollectible,item)));
    shell.querySelectorAll("[data-jkc-sell-collection]").forEach(b=>b.addEventListener("click",()=>sellCollectiblesByFilter(b.dataset.jkcSellCollection||"all",item)));
    syncGrants().catch(()=>{});
  }
  function refreshPhone(item){
    if(ui.gameOverlay && document.querySelector(".jkc-ingame-overlay")){ renderGameOverlay(ui.gameOverlay); return; }
    try{if(typeof openDeviceInterface==="function")openDeviceInterface(item||window.JKGamesOwnedPhoneItem?.()||"Smartphone","jkcoin",false);}catch{}
    restoreShopPageScroll();
  }
  async function exchangePrompt(item){const c=coinState();if(!c)return toast("JK/Coin wartet noch auf deinen Spielstand.");if(c.balance<1)return toast("Keine JK/Coins zum Umtauschen verfügbar.");const rate=currentRate();const amount=await jkcNumberPrompt({title:"JK/Coin in Euro tauschen",message:`Aktueller Kurs: 1 JK/Coin = ${euro(rate)}\nVerfügbar: ${c.balance.toLocaleString("de-DE")} JK/Coin`,value:Math.min(100,c.balance),min:1,max:c.balance,confirmText:"Betrag prüfen",icon:"€"});if(amount==null)return;if(!await jkcConfirm({title:"Umtausch bestätigen",message:`${amount.toLocaleString("de-DE")} JK/Coin → ${euro(amount*rate)}\n\nDieser Tausch kann nicht rückgängig gemacht werden.`,confirmText:"Jetzt tauschen",icon:"€",tone:"danger"}))return;if(!spend(amount,`Umtausch zu ${euro(rate)} je JK/Coin`))return;const root=rootState();root.bank=Number(root.bank||0)+amount*rate;ledger("exchange",0,`${amount} JK/Coin → ${euro(amount*rate)}`,{rate});persist();feed(`${amount} JK/Coin wurden zum Kurs ${euro(rate)} in ${euro(amount*rate)} umgetauscht.`);refreshPhone(item);}

  function availableEuroFunds(){const root=rootState();return Math.max(0,Number(root.bank)||0)+Math.max(0,Number(root.cash)||0);}
  function spendEuros(amount,label){const root=rootState(),value=Math.max(0,Math.floor(Number(amount)||0));if(!value||availableEuroFunds()<value)return false;let remaining=value;const bankAvailable=Math.max(0,Number(root.bank)||0),fromBank=Math.min(bankAvailable,remaining);root.bank=Number(root.bank||0)-fromBank;remaining-=fromBank;if(remaining>0){root.cash=Math.max(0,Number(root.cash)||0)-remaining;remaining=0;}try{if(typeof addFeed==="function")addFeed(`${label}: ${euro(value)} bezahlt.`);}catch{}return true;}
  async function openBox(boxId,item){const box=BOXES.find(b=>b.id===boxId),c=coinState();if(!box||!c)return toast("JK/Coin wartet noch auf deinen Spielstand.");const euroPayment=box.currency==="euro";if(euroPayment){if(availableEuroFunds()<box.cost)return toast("Nicht genug Euro auf Konto und in bar.");if(!await jkcConfirm({title:`${box.name} öffnen`,message:`Kosten: ${euro(box.cost)}\nDie Zahlung wird erst nach deiner Bestätigung abgezogen.`,confirmText:`Für ${euro(box.cost)} öffnen`,icon:"🎁"}))return;if(!spendEuros(box.cost,box.name))return;}else{if(c.balance<box.cost)return toast("Nicht genug JK/Coins.");if(!await jkcConfirm({title:`${box.name} öffnen`,message:`Kosten: ${box.cost.toLocaleString("de-DE")} JK/Coin\nDie JK/Coins werden erst nach deiner Bestätigung abgezogen.`,confirmText:"Jetzt öffnen",icon:"🎁"}))return;if(!spend(box.cost,box.name))return;}const rewards=box.type==="reward"?openRewardBox(box):openCollectBox(box);if(box.type==="reward"){addHypeForBox(box,rewards);syncHypeProfile().catch(()=>{});}persist();showRewards(box,rewards,()=>refreshPhone(item));}
  function luckyClothingCatalog(){try{return typeof shopMarketCatalog!=="undefined"&&Array.isArray(shopMarketCatalog?.clothing)?shopMarketCatalog.clothing.filter(entry=>entry&&entry.wear&&(entry.item||entry.name)):[];}catch{return [];} }
  function luckySkinTier(box){return box?.tier==="galaxy"?"Galaxy":box?.tier==="universe"?"Universe":box?.tier==="elite"?"Legend":"Premium";}
  function luckySkinValue(tier){return tier==="Galaxy"?2500000:tier==="Universe"?900000:tier==="Legend"?300000:125000;}
  function grantLuckyClothing(box,rewards){const root=rootState();root.wardrobe=Array.isArray(root.wardrobe)?root.wardrobe:[];const minPrice={starter:18,premium:39,elite:69,universe:109,galaxy:149}[box?.tier]||0;let pool=luckyClothingCatalog().filter(entry=>Number(entry.price||0)>=minPrice&&!root.wardrobe.includes(entry.item||entry.name));const guaranteedRaw=Math.max(0,Number(box?.clothingGuaranteed)||0),guaranteed=Math.floor(guaranteedRaw)+(Math.random()<(guaranteedRaw%1)?1:0),target=guaranteed+(Math.random()<Math.max(0,Math.min(1,Number(box?.clothingChance)||0))?1:0);for(let i=0;i<target;i++){if(!pool.length)break;const pickIndex=randInt(0,pool.length-1),entry=pool.splice(pickIndex,1)[0],name=String(entry.item||entry.name);root.wardrobe.push(name);rewards.push({kind:"clothing",name,text:"Kleidungsstück für deinen Hauptcharakter · im Kleiderschrank verfügbar",value:Math.max(0,Math.round(Number(entry.price)||0))});}}
  function grantLuckySkin(box,rewards){const root=rootState(),tier=luckySkinTier(box);root.wardrobe=Array.isArray(root.wardrobe)?root.wardrobe:[];const realGalaxySkin="The Real Galaxy Skin",realGalaxyChance=Math.max(0,Math.min(1,Number(box?.realGalaxyChance)||0));if(realGalaxyChance>0&&!root.wardrobe.includes(realGalaxySkin)&&Math.random()<realGalaxyChance){root.wardrobe.push(realGalaxySkin);coinState().entitlements[`main-skin:${realGalaxySkin}`]=1;rewards.push({kind:"special",name:realGalaxySkin,text:"Extrem seltener Galaxy-Hauptskin · Grafikdetail passt sich Minimum bis Ultra automatisch an",value:15000000});return;}if(Math.random()>=Math.max(0,Math.min(1,Number(box?.skinChance)||0)))return;let skin="";for(let tries=0;tries<20&&!skin;tries++){const candidate=`JK Exclusive ${tier} Skin #${randInt(1,999)}`;if(!root.wardrobe.includes(candidate))skin=candidate;}if(!skin)return;root.wardrobe.push(skin);coinState().entitlements[`main-skin:${skin}`]=1;rewards.push({kind:"special",name:skin,text:"Exklusiver Hauptcharakter-Skin · im Kleiderschrank verfügbar",value:luckySkinValue(tier)});}
  function grantLuckyCashback(box,rewards){if(Math.random()>=Math.max(0,Math.min(1,Number(box?.cashbackChance)||0)))return;const range=Array.isArray(box?.cashback)?box.cashback:[0,0],amount=randInt(Math.max(0,Math.floor(Number(range[0])||0)),Math.max(0,Math.floor(Number(range[1])||0)));if(!amount)return;credit(amount,`${box.name} · JK/Coin-Bonus`,"lucky");rewards.push({kind:"coin",name:`+${amount.toLocaleString("de-DE")} JK/Coin`,text:"JK/Coin-Bonus direkt gutgeschrieben",value:0});}
  function luckyTierIndex(box){return Math.max(0,["starter","premium","elite","universe","galaxy"].indexOf(String(box?.tier||"starter")));}
  function specialAppPool(){try{return window.LifeBuilderExpansion?.debug?.getSpecialItems?.()||[];}catch{return [];} }
  function weightedSpecialTier(box){const i=luckyTierIndex(box),euroBox=box?.currency==="euro";const weights=euroBox?[[97,2.8,.19,.01,0],[90,8.5,1.4,.09,.01],[78,18,3.5,.45,.05],[65,24,9,1.8,.2],[50,30,15,4.5,.5]][i]:[[92,7.5,.48,.02,0],[78,18,3.7,.28,.02],[58,28,11,2.8,.2],[40,30,20,9,1],[28,26,24,18,4]][i];let roll=Math.random()*weights.reduce((a,b)=>a+b,0);for(let tier=0;tier<weights.length;tier++){roll-=weights[tier];if(roll<=0)return tier;}return 0;}
  function grantLuckySpecialItems(box,rewards){const pool=specialAppPool();if(!pool.length)return;const i=luckyTierIndex(box),euroBox=box?.currency==="euro",chance=(euroBox?[.12,.25,.35,.45,.55]:[.28,.52,.72,.88,.98])[i];if(Math.random()>=chance)return;const maxDrops=euroBox?[1,1,1,2,2][i]:[1,1,2,3,4][i],drops=1+(maxDrops>1&&Math.random()<.38?randInt(0,maxDrops-1):0),root=rootState();root.specialCollection=root.specialCollection&&typeof root.specialCollection==="object"?root.specialCollection:{owned:{},discovered:{},equipped:[]};root.specialCollection.owned=root.specialCollection.owned&&typeof root.specialCollection.owned==="object"?root.specialCollection.owned:{};root.specialCollection.discovered=root.specialCollection.discovered&&typeof root.specialCollection.discovered==="object"?root.specialCollection.discovered:{};root.specialCollection.equipped=Array.isArray(root.specialCollection.equipped)?root.specialCollection.equipped:[];for(let n=0;n<drops;n++){const tier=weightedSpecialTier(box),tierPool=pool.filter(item=>Number(item?.tier)===tier);if(!tierPool.length)continue;const item=tierPool[randInt(0,tierPool.length-1)],already=!!root.specialCollection.discovered[item.id];root.specialCollection.owned[item.id]=Number(root.specialCollection.owned[item.id]||0)+1;root.specialCollection.discovered[item.id]=true;if(item.wearable){root.wardrobe=Array.isArray(root.wardrobe)?root.wardrobe:[];if(!root.wardrobe.includes(item.name))root.wardrobe.push(item.name);}rewards.push({kind:"appSpecial",name:item.name,text:`Special-App · ${item.rarity} · ${item.category}${already?" · Bereits entdeckt":" · Neu entdeckt"}`,value:Math.max(0,Math.round(Number(item.price)||0)),alreadyDiscovered:already});}}
  function grantLuckyJetons(box,rewards){const i=luckyTierIndex(box),euroBox=box?.currency==="euro",chance=(euroBox?[.14,.18,.23,.28,.34]:[.28,.36,.44,.52,.62])[i];if(Math.random()>=chance)return;let amount;if(euroBox){const minPct=[.01,.015,.02,.025,.03][i],maxPct=[.06,.08,.12,.16,.20][i];amount=Math.max(1,Math.round(Number(box.cost||0)*(minPct+Math.random()*(maxPct-minPct))));}else{const equivalent=Math.max(1,Math.round(Number(box.cost||0)*currentRate())),minPct=[.006,.007,.008,.01,.012][i],maxPct=[.02,.024,.028,.034,.04][i];amount=Math.max(1,Math.round(equivalent*(minPct+Math.random()*(maxPct-minPct))));}const root=rootState();root.casinoWalletCents=Math.max(0,Math.round(Number(root.casinoWalletCents||root.casinoWallet*100||0)+amount*100));root.casinoWallet=root.casinoWalletCents/100;rewards.push({kind:"jetons",name:`+${euro(amount)} Jetons`,text:"Direkt deinem Casino-Wallet gutgeschrieben",value:amount});}
  function hypeForBox(box){if(box?.type!=="reward"||!String(box?.id||"").startsWith("reward-"))return 0;if(box?.currency==="euro"){const euroHype={100000:.5,1000000:5,10000000:100,100000000:1000,1000000000:5000};return euroHype[Math.floor(Number(box.cost)||0)]||0;}const premiumHype={150:100,550:400,1500:1200,2500:3000,5500:15000};return premiumHype[Math.floor(Number(box.cost)||0)]||0;}
  function addHypeForBox(box,rewards){const c=coinState(),amount=hypeForBox(box);if(!c||!amount)return 0;c.hype.points+=amount;c.hype.totalBoxes+=1;if(box?.currency==="euro")c.hype.euroBoxes+=1;else c.hype.jkBoxes+=1;c.hype.updatedAtMs=Date.now();rewards?.push?.({kind:"hype",name:`+${amount.toLocaleString("de-DE")} % Hype`,text:`Hype-Status · ${c.hype.points.toLocaleString("de-DE")} % gesamt`,value:0});processHypeMilestones(rewards);return amount;}
  async function syncHypeProfile(){try{const c=coinState(),fb=await runtime(),user=await currentUser(fb);if(!c||!user)return false;await fb.setDoc(fb.doc(fb.db,HYPE_COLLECTION,user.uid),{uid:user.uid,displayName:userName().slice(0,80)||"Spieler",hype:Math.max(0,Math.round(Number(c.hype.points||0)*2)/2),totalBoxes:Math.max(0,Math.floor(c.hype.totalBoxes)),euroBoxes:Math.max(0,Math.floor(c.hype.euroBoxes)),jkBoxes:Math.max(0,Math.floor(c.hype.jkBoxes)),updatedAtMs:Date.now()},{merge:true});return true;}catch(error){console.debug?.("Hype-Sync pausiert",error?.message||error);return false;}}
  async function fetchHypeLeaderboard(){const fb=await runtime(),user=await currentUser(fb);if(!user)throw new Error("Bitte zuerst anmelden.");let snap;try{snap=await fb.getDocs(fb.query(fb.collection(fb.db,HYPE_COLLECTION),fb.orderBy("hype","desc"),fb.limit(100)));}catch{snap=await fb.getDocs(fb.query(fb.collection(fb.db,HYPE_COLLECTION),fb.limit(100)));}return snap.docs.map(docSnap=>({id:docSnap.id,...(docSnap.data()||{})})).sort((a,b)=>Number(b.hype||0)-Number(a.hype||0)||Number(b.totalBoxes||0)-Number(a.totalBoxes||0)).slice(0,100);}
  function hypeModal(){let modal=document.querySelector("[data-jkc-hype-modal]");if(modal)return modal;const supportsDialog=typeof HTMLDialogElement!=="undefined";modal=document.createElement(supportsDialog?"dialog":"div");modal.className="jkc-modal jkc-hype-modal";modal.dataset.jkcHypeModal="1";modal.setAttribute("role","dialog");modal.setAttribute("aria-modal","true");(document.fullscreenElement||document.body||document.documentElement).append(modal);if(supportsDialog){modal.addEventListener("cancel",event=>{event.preventDefault();try{modal.close();}catch{}modal.remove();});}return modal;}
  async function openHype(){processHypeMilestones();const c=coinState(),modal=hypeModal(),supportsDialog=typeof HTMLDialogElement!=="undefined"&&modal instanceof HTMLDialogElement;modal.innerHTML=`<div class="jkc-modal-card jkc-hype-card"><header class="jkc-hype-head"><div><small>JK.GAMES · ONLINE</small><h2>Hype</h2><p>Lucky-Box-Hype ohne Limit.</p></div><button type="button" class="jkc-hype-close" data-jkc-hype-close>×</button></header><section class="jkc-hype-own"><article><small>DEIN HYPE</small><b>${Number(c?.hype?.points||0).toLocaleString("de-DE")} %</b></article><article><small>LUCKY BOXEN</small><b>${Number(c?.hype?.totalBoxes||0).toLocaleString("de-DE")}</b></article><article><small>JK / EURO</small><b>${Number(c?.hype?.jkBoxes||0).toLocaleString("de-DE")} / ${Number(c?.hype?.euroBoxes||0).toLocaleString("de-DE")}</b></article></section><div class="jkc-hype-refresh-row"><button class="jkc-button secondary" data-jkc-hype-refresh>Aktualisieren</button></div><div class="jkc-hype-list-title">Online-Hype-Rangliste</div><div class="jkc-hype-list" data-jkc-hype-list><p>Rangliste wird geladen …</p></div><section class="jkc-hype-milestones"><div class="jkc-hype-list-title">Hype-Meilensteine · Gratis JK/Coin</div><div>${HYPE_MILESTONES.map(m=>{const claimed=c?.hype?.claimedMilestones?.includes(m.hype),reached=Number(c?.hype?.points||0)>=m.hype;return `<article class="${claimed?"claimed":reached?"ready":""}"><span>${m.hype.toLocaleString("de-DE")} %</span><b>+${m.coins.toLocaleString("de-DE")} JK/Coin</b><em>${claimed?"Erhalten":reached?"Wird gutgeschrieben":"Offen"}</em></article>`;}).join("")}</div></section></div>`;const close=()=>{try{if(supportsDialog&&modal.open)modal.close();}catch{}modal.remove();};modal.querySelector("[data-jkc-hype-close]")?.addEventListener("click",close);const load=async()=>{const list=modal.querySelector("[data-jkc-hype-list]");if(!list)return;list.innerHTML="<p>Rangliste wird geladen …</p>";await syncHypeProfile();try{const rows=await fetchHypeLeaderboard();list.innerHTML=rows.length?rows.map((row,index)=>`<article><span class="jkc-hype-rank">${index+1}</span><div><b>${esc(row.displayName||"Spieler")}</b><small>${Number(row.totalBoxes||0).toLocaleString("de-DE")} Lucky Boxen · JK ${Number(row.jkBoxes||0).toLocaleString("de-DE")} · Euro ${Number(row.euroBoxes||0).toLocaleString("de-DE")}</small></div><strong>${Number(row.hype||0).toLocaleString("de-DE")} %</strong></article>`).join(""):"<p>Noch keine Hype-Einträge vorhanden.</p>";}catch(error){list.innerHTML=`<p>Hype-Rangliste konnte gerade nicht geladen werden: ${esc(String(error?.message||error).replace(/^FirebaseError:\s*/i,""))}</p>`;}};modal.querySelector("[data-jkc-hype-refresh]")?.addEventListener("click",load);if(supportsDialog&&!modal.open){try{modal.showModal();}catch{}}load();}
  function installHypeShortcut(){document.querySelectorAll("[data-jkc-hype-open]").forEach(button=>{if(button.dataset.jkcHypeBound)return;button.dataset.jkcHypeBound="1";button.addEventListener("click",()=>openHype());});}
  function openRewardBox(box){const root=rootState();const money=randInt(box.money[0],box.money[1]);const xp=randInt(box.xp[0],box.xp[1]);root.bank=Number(root.bank||0)+money;try{if(typeof addXp==="function")addXp(xp,box.name);else root.xp=Number(root.xp||0)+xp;}catch{root.xp=Number(root.xp||0)+xp;}const rewards=[{kind:"xp",name:`+${xp} Haupt-EP`,text:"Charakterfortschritt",value:0},{kind:"money",name:`+${euro(money)}`,text:"Bankguthaben",value:money}];grantLuckyClothing(box,rewards);grantLuckySkin(box,rewards);grantLuckySpecialItems(box,rewards);grantLuckyJetons(box,rewards);grantLuckyCashback(box,rewards);if(rewards.length<=2){const bonusXp=Math.max(5,Math.round(xp*.15));try{if(typeof addXp==="function")addXp(bonusXp,`${box.name} Bonus`);else root.xp=Number(root.xp||0)+bonusXp;}catch{root.xp=Number(root.xp||0)+bonusXp;}rewards.push({kind:"xp",name:`+${bonusXp} Bonus-EP`,text:"Lucky-Bonus für deinen Hauptcharakter",value:0});}return rewards;}
  function rarityAtLeast(id){return Math.max(0,RARITIES.findIndex(r=>r.id===id));}
  function createCollectibleWeighted(minRarity="common",maxRarity="galaxy",valueCap=null,sourceBox=null){const min=rarityAtLeast(minRarity),max=Math.max(min,rarityAtLeast(maxRarity)),luckBoost=Math.max(1,Number(sourceBox?.luckBoost)||1);const roll=Math.pow(Math.random(),luckBoost);let idx=min;if(roll<.0002)idx=10;else if(roll<.003)idx=Math.max(min,9);else if(roll<.015)idx=Math.max(min,8);else if(roll<.06)idx=Math.max(min,7);else if(roll<.14)idx=Math.max(min,6);else if(roll<.28)idx=Math.max(min,5);else if(roll<.48)idx=Math.max(min,4);else if(roll<.7)idx=Math.max(min,3);else idx=Math.max(min,randInt(0,2));idx=Math.min(max,Math.min(10,idx));return createCollectible(RARITIES[idx],valueCap,sourceBox);}
  function weightedCollectRarity(probs,allowedIds){const allowed=new Set(allowedIds||[]),pool=RARITIES.map((rarity,index)=>({rarity,index,weight:Math.max(.001,Number(probs?.[rarity.id])||0)})).filter(x=>(!allowed.size||allowed.has(x.rarity.id))&&x.weight>0);const total=pool.reduce((sum,x)=>sum+x.weight,0);let roll=Math.random()*Math.max(total,.001);for(const row of pool){roll-=row.weight;if(roll<=0)return row.rarity;}return pool[0]?.rarity||RARITIES[0];}
  // V404: Euro-Sammlerkisten landen normalerweise knapp unter dem Kaufpreis. Echter Mehrwert ist als Basisfall nur ca. 0,1 % wahrscheinlich; extrem seltene High-End-Treffer dürfen darüber hinaus ausbrechen.
  function collectorTargetRatio(){const roll=Math.random();if(roll<.0001)return 1.15+Math.random()*.60;if(roll<.001)return 1.005+Math.random()*.105;if(roll<.006)return .985+Math.random()*.015;return .88+Math.random()*.115;}
  function rebalanceEuroCollectibles(box,items){
    if(box?.currency!=="euro"||!items.length)return items;
    const cost=Math.max(1,Math.floor(Number(box.cost)||1)),target=Math.max(items.length,Math.floor(cost*collectorTargetRatio())),weightByRarity={common:1,uncommon:1.45,rare:2.2,epic:3.6,legendary:5.8,special:9,mystic:14,exotic:22,universe:34,blackhole:55,galaxy:90},jackpots=[],regular=[];
    for(const item of items){const raw=Math.max(1,Math.floor(Number(item.value)||1)),highTier=["special","mystic","exotic","universe","blackhole","galaxy"].includes(item.rarity);if((highTier&&raw>cost)||item.rarity==="galaxy"){if(item.rarity==="galaxy")item.value=Math.max(raw,Math.floor(cost*(1.06+Math.random()*.64)));jackpots.push(item);}else regular.push(item);}
    const jackpotTotal=jackpots.reduce((sum,item)=>sum+Math.max(1,Number(item.value)||1),0),regularBudget=Math.max(regular.length,Math.floor(jackpotTotal>cost?cost*(.05+Math.random()*.10):Math.max(0,target-jackpotTotal)));
    if(regular.length){const rows=regular.map(item=>{const rarityWeight=weightByRarity[item.rarity]||1,natural=Math.max(1,Number(item.value)||1),naturalFactor=.82+Math.random()*.36;return{item,weight:rarityWeight*naturalFactor*(1+Math.min(.35,Math.log10(natural+1)/30))};}),totalWeight=Math.max(.0001,rows.reduce((sum,row)=>sum+row.weight,0));let assigned=0;rows.forEach((row,index)=>{const remaining=regularBudget-assigned,value=index===rows.length-1?remaining:Math.max(1,Math.floor(regularBudget*(row.weight/totalWeight)));row.item.value=Math.max(1,value);assigned+=row.item.value;});const total=regular.reduce((sum,item)=>sum+Math.max(1,Number(item.value)||1),0),diff=regularBudget-total;if(diff)regular[regular.length-1].value=Math.max(1,Math.floor(Number(regular[regular.length-1].value)||1)+diff);}
    return items;
  }
  function openCollectBox(box){const probs=collectChancesForBox(box),target=Math.max(1,Math.floor(Number(box.items)||1)),featured=["epic","legendary","special","universe","blackhole","galaxy"],picked=[];for(const id of featured){const rarity=RARITIES.find(r=>r.id===id),chance=Math.max(0,Number(probs[id])||0);if(rarity&&(chance>=100||Math.random()*100<chance))picked.push(rarity);}const fillerIds=["common","uncommon","rare","mystic","exotic",...featured.filter(id=>Number(probs[id])>=100)];while(picked.length<target)picked.push(weightedCollectRarity(probs,fillerIds));if(picked.length>target)picked.length=target;const collectibles=rebalanceEuroCollectibles(box,picked.map(rarity=>createCollectible(rarity,box.itemValueCap,box))),rewards=[];for(const collectible of collectibles){const already=!!coinState().collectionUnique[collectible.catalogId];addCollectible(collectible);rewards.push({kind:"item",rarity:collectible.rarity,name:collectible.name,text:`${collectible.rarityName} · ${euro(collectible.value)}${already?" · Bereits entdeckt":""}`,value:collectible.value,alreadyDiscovered:already});}return rewards;}
  function createCollectible(rarity,valueCap=null,sourceBox=null){const index=randInt(1,rarity.count),id=`${rarity.id}-${index}`;const name=`${ADJECTIVES[(index+rarity.count)%ADJECTIVES.length]} ${NOUNS[(index*7+rarity.count)%NOUNS.length]} #${String(index).padStart(4,"0")}`;const collectorBox=sourceBox?.type==="collect";let value;if(collectorBox&&rarity.id==="universe"){value=randInt(COLLECTOR_UNIVERSE_MIN_VALUE,COLLECTOR_UNIVERSE_MAX_VALUE);}else if(collectorBox&&rarity.id==="blackhole"){value=randInt(COLLECTOR_BLACKHOLE_MIN_VALUE,COLLECTOR_BLACKHOLE_MAX_VALUE);}else if(collectorBox&&rarity.id==="galaxy"){value=randInt(COLLECTOR_GALAXY_MIN_VALUE,COLLECTOR_GALAXY_MAX_VALUE);}else{const rawCap=Number(valueCap),cap=Number.isFinite(rawCap)&&rawCap>0?Math.floor(rawCap):Math.floor(rarity.value[1]);const maxValue=Math.max(1,Math.min(Math.floor(rarity.value[1]),cap));const naturalMin=Math.max(1,Math.floor(rarity.value[0]));const minValue=naturalMin<=maxValue?naturalMin:Math.max(1,Math.floor(maxValue*.72));value=randInt(minValue,maxValue);}return{uid:`collect-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,catalogId:id,rarity:rarity.id,rarityName:rarity.name,name,value,sourceBoxId:String(sourceBox?.id||""),sourceBoxCost:Math.max(0,Math.floor(Number(sourceBox?.cost)||0)),description:`Exklusives JK.Games-Sammlerstück. Serie ${index}/${rarity.count}. Sammlerwert, Prestige ${Math.max(1,RARITIES.indexOf(rarity)+1)} und Handelswert sind gespeichert.`,acquiredAt:Date.now()};}
  function addCollectible(item){const c=coinState();c.collectibles.unshift(item);c.collectibles=c.collectibles.slice(0,1000);c.collectionUnique[item.catalogId]=true;}
  async function sellCollectible(uid,item){const c=coinState(),idx=c.collectibles.findIndex(x=>x.uid===uid);if(idx<0)return;const collectible=c.collectibles[idx];if(!await jkcConfirm({title:"Sammlerstück verkaufen",message:`${collectible.name}\nVerkauf: ${euro(collectible.value)}`,confirmText:"Verkaufen",icon:"💰"}))return;c.collectibles.splice(idx,1);rootState().bank=Number(rootState().bank||0)+collectible.value;ledger("collectible",0,`${collectible.name} verkauft · ${euro(collectible.value)}`);persist();refreshPhone(item);}
  async function sellCollectiblesByFilter(rarity,item){const c=coinState(),filter=String(rarity||"all"),selected=c.collectibles.filter(x=>filter==="all"||x?.rarity===filter);if(!selected.length)return toast("Keine Sammlerstücke zum Verkaufen vorhanden.");const total=selected.reduce((sum,x)=>sum+Math.max(0,Number(x?.value)||0),0),label=filter==="all"?"alle Sammlerstücke":`${RARITIES.find(r=>r.id===filter)?.name||filter}-Sammlerstücke`;if(!await jkcConfirm({title:"Sammlerstücke verkaufen",message:`${selected.length.toLocaleString("de-DE")} ${label}\nGesamt: ${euro(total)}\n\nBereits entdeckte Einträge bleiben dauerhaft in deiner Sammlung registriert.`,confirmText:"Alle verkaufen",icon:"💰",tone:"danger"}))return;const ids=new Set(selected.map(x=>x.uid));c.collectibles=c.collectibles.filter(x=>!ids.has(x.uid));rootState().bank=Number(rootState().bank||0)+total;ledger("collectible",0,`${selected.length.toLocaleString("de-DE")} ${label} verkauft · ${euro(total)}`);persist();toast(`${selected.length.toLocaleString("de-DE")} Items verkauft · ${euro(total)}`);refreshPhone(item);}
  const rewardDelay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  function rewardIcon(reward){if(reward?.kind==="xp")return "XP";if(reward?.kind==="money")return "€";if(reward?.kind==="coin")return "JK";if(reward?.kind==="jetons")return "🎰";if(reward?.kind==="hype")return "🔥";if(reward?.kind==="appSpecial")return "✨";if(reward?.kind==="clothing")return "👕";if(reward?.kind==="special")return "★";return reward?.rarity==="galaxy"?"🌌":reward?.rarity==="blackhole"?"🕳️":"◈";}
  function showRewards(box,rewards,onClose){const collector=box?.type==="collect",currencyLabel=box?.currency==="euro"?"EURO":"JK",totalValue=rewards.reduce((sum,reward)=>sum+Math.max(0,Number(reward?.value)||0),0),supportsDialog=typeof HTMLDialogElement!=="undefined",modal=document.createElement(supportsDialog?"dialog":"div");modal.className=`jkc-modal jkc-reveal-modal ${collector?"jkc-collector-reveal":""}`;modal.setAttribute("role","dialog");modal.setAttribute("aria-modal","true");modal.innerHTML=`<div class="jkc-modal-card jkc-reveal-card"><small>${currencyLabel} ${collector?"SAMMLER-KISTE":"LUCKY-BOX"} WIRD GEÖFFNET</small><h2>${esc(box.name)}</h2><div class="jkc-reveal-stage" data-jkc-reveal-stage><div class="jkc-box-burst ${collector?"collector":"lucky"}"><span>${collector?"◈":"🎁"}</span><em>${currencyLabel} ${collector?"SAMMLER-KISTE":"LUCKY BOX"}</em></div><b>Belohnungen werden aufgedeckt …</b></div><div class="jkc-open-rewards jkc-reveal-summary" data-jkc-reveal-summary hidden></div><div class="jkc-actions jkc-reveal-actions" data-jkc-reveal-actions hidden><div class="jkc-crate-total"><small>GESAMTER KISTENWERT</small><b>${euro(totalValue)}</b></div><button class="jkc-button gold" data-jkc-close-rewards>Belohnungen übernehmen</button></div></div>`;const host=document.fullscreenElement||document.body||document.documentElement;host.append(modal);if(supportsDialog){try{modal.showModal();}catch{}}let closed=false;const close=()=>{if(closed)return;closed=true;try{if(supportsDialog&&modal.open)modal.close();}catch{}modal.remove();onClose?.();};if(supportsDialog)modal.addEventListener("cancel",event=>{event.preventDefault();close();});modal.querySelector("[data-jkc-close-rewards]").onclick=close;const stage=modal.querySelector("[data-jkc-reveal-stage]"),summary=modal.querySelector("[data-jkc-reveal-summary]"),actions=modal.querySelector("[data-jkc-reveal-actions]"),revealMs=collector?620:920,leaveMs=collector?180:260;(async()=>{await rewardDelay(collector?620:520);for(let i=0;i<rewards.length&&!closed;i++){const reward=rewards[i];stage.innerHTML=`<article class="jkc-reveal-reward jkc-reveal-${esc(reward.kind||"item")} ${reward.alreadyDiscovered?"already-discovered":""}"><span>${rewardIcon(reward)}</span><small>BELOHNUNG ${i+1} / ${rewards.length}${reward.alreadyDiscovered?" · BEREITS ENTDECKT":""}</small><b>${esc(reward.name)}</b><em>${esc(reward.text)}</em></article>`;const card=stage.firstElementChild;requestAnimationFrame(()=>card?.classList.add("show"));await rewardDelay(revealMs);card?.classList.add("leave");await rewardDelay(leaveMs);}if(closed)return;stage.innerHTML=`<div class="jkc-reveal-done"><span>✓</span><b>Alles aufgedeckt</b><small>${rewards.length} Belohnungen erhalten</small></div>`;summary.innerHTML=rewards.map(r=>`<article class="jkc-reward ${r.alreadyDiscovered?"already-discovered":""}"><b>${esc(r.name)}</b><small>${esc(r.text)}</small></article>`).join("");summary.hidden=false;actions.hidden=false;})().catch(()=>{if(closed)return;summary.innerHTML=rewards.map(r=>`<article class="jkc-reward ${r.alreadyDiscovered?"already-discovered":""}"><b>${esc(r.name)}</b><small>${esc(r.text)}</small></article>`).join("");summary.hidden=false;actions.hidden=false;});}

  async function buyGameItem(id,item){rememberShopPageScroll();const entry=GAME_STORE.find(x=>x.id===id),c=coinState();if(!entry||!c)return toast("JK/Coin wartet noch auf deinen Spielstand.");if(gamePermanentOwned(entry))return toast("Dieser Spielinhalt ist bereits dauerhaft freigeschaltet.");const timed=bigCardsBulkAccessMeta(entry);if(timed?.active)return toast(`„${entry.name.replace(" · 24 Stunden","")}“ ist noch ${timed.remaining} aktiv.`);if(entry.game==="bigcards"&&/^finishExpedition:[0-3]$/.test(String(entry.grant?.kind||""))){if(typeof window.BigCardsKL?.canApplyJkPurchase!=="function")return toast("Öffne BigCards.kl einmal, damit der Expeditions-Slot geprüft werden kann.");if(window.BigCardsKL.canApplyJkPurchase(entry.grant.kind)===false){const slot=Number(String(entry.grant.kind).split(":")[1])+1;return toast(`In Expeditions-Slot ${slot} läuft gerade keine unfertige Expedition.`);}}else if(entry.game==="bigcards"&&typeof window.BigCardsKL?.canApplyJkPurchase==="function"&&window.BigCardsKL.canApplyJkPurchase(entry.grant?.kind)===false)return toast("Dieser BigCards-Kauf kann gerade nicht angewendet werden.");else if(entry.game==="escape"&&typeof window.EscapeKL?.canApplyJkPurchase==="function"&&window.EscapeKL.canApplyJkPurchase(entry.grant?.kind)===false){if(entry.grant?.kind==="character:demon-galaxy"&&!window.EscapeKL?.getState?.()?.ownedSpecialCharacters?.includes?.("demon-transformation"))return toast("Kaufe zuerst die Dämonenverwandlung.");return toast("Dieser Escape.kl-Inhalt ist bereits freigeschaltet.");}let amount=entry.grant.amount;if(entry.variable){if(c.balance<1)return toast("Nicht genug JK/Coins.");const entered=await jkcNumberPrompt({title:"JK/Coin in Jetons umwandeln",message:`1 JK/Coin = ${euro(currentRate())} Jetons\nVerfügbar: ${c.balance.toLocaleString("de-DE")} JK/Coin`,value:Math.min(100,c.balance),min:1,max:c.balance,confirmText:"Betrag übernehmen",icon:"🎰"});if(entered==null)return;amount=entered;}const cost=entry.variable?amount:entry.cost;if(!await jkcConfirm({title:"JK/Coin-Kauf bestätigen",message:`${entry.name}\nKosten: ${cost.toLocaleString("de-DE")} JK/Coin\n\nDie JK/Coins werden erst nach deiner Bestätigung abgezogen.`,confirmText:`Für ${cost.toLocaleString("de-DE")} JK/Coin kaufen`,icon:"◆"}))return;if(!spend(cost,entry.name))return;grantGamePurchase(entry,{...entry.grant,amount});persist();toast(`${entry.name} wurde deinem Spiel hinzugefügt.`);refreshPhone(item);}
  function grantGamePurchase(entry,grant){const c=coinState();c.gamePurchases[entry.id]=Number(c.gamePurchases[entry.id]||0)+1;c.entitlements[entry.id]=Number(c.entitlements[entry.id]||0)+Number(grant.amount||1);const rate=currentRate();if(entry.game==="casino"&&grant.kind==="jetons"){const eur=grant.amount*rate;const root=rootState();root.casinoWalletCents=Math.round(Number(root.casinoWalletCents||root.casinoWallet*100||0)+eur*100);root.casinoWallet=root.casinoWalletCents/100;c.appliedEntitlements[entry.id]=Number(c.entitlements[entry.id]||0);return;}applyPendingGameEntitlements();}
  function applyPendingGameEntitlements(){const c=coinState();if(!c)return false;const apiMap={runner:window.RunnerKL,city:window.CityKL,match:window.MatchKL,fight:window.FightKL,dungeon:window.DungeonKL,money:window.MoneyKL,bigcards:window.BigCardsKL,escape:window.EscapeKL,egoshoot:window.EgoShootKL,weed:window.WeedKL,casino:window.JKCasinoV82};for(const entry of GAME_STORE){if(entry.game==="casino"&&entry.variable)continue;const total=Number(c.entitlements?.[entry.id]||0),applied=Number(c.appliedEntitlements?.[entry.id]||0),delta=Math.max(0,total-applied);if(!delta)continue;try{const api=apiMap[entry.game];const grant=api?.grantJkCoinPurchase;if(typeof grant!=="function")continue;const ok=grant.call(api,entry.grant.kind,delta,{sku:entry.id,name:entry.name});if(ok!==false)c.appliedEntitlements[entry.id]=total;}catch(error){console.warn("JK/Coin Spiel-Gutschrift",entry.game,error);}}persist();return true;}

  function bankPanelHtml(){const c=coinState();if(!c)return `<section class="jkc-bank-panel"><small>JK/COIN-KONTO</small><h3>Wird geladen …</h3></section>`;const rate=currentRate();return `<section class="jkc-bank-panel" data-jkc-bank-panel><small>JK/COIN-KONTO</small><h3>Premium-Währung</h3><div class="jkc-bank-summary"><div><small>GUTHABEN</small><b>${c.balance.toLocaleString("de-DE")} JK/Coin</b></div><div><small>AKTUELLER KURS</small><b>1 = ${euro(rate)}</b></div><div><small>AUSGEGEBEN</small><b>${Math.round(c.totalSpent).toLocaleString("de-DE")}</b></div></div><div class="jkc-actions"><button class="jkc-button gold" data-jkc-bank-exchange>JK/Coin in Euro tauschen</button><button class="jkc-button secondary" data-jkc-bank-ledger>Kontobewegungen</button></div></section>`;}
  function bindBank(container){
    const exchange=container?.querySelector("[data-jkc-bank-exchange]");
    if(exchange)exchange.onclick=()=>exchangePrompt(window.JKGamesOwnedPhoneItem?.()||"");
    const ledgerButton=container?.querySelector("[data-jkc-bank-ledger]");
    if(ledgerButton)ledgerButton.onclick=()=>{try{ui.tab="ledger";if(typeof openDeviceInterface==="function")openDeviceInterface(window.JKGamesOwnedPhoneItem?.()||"Smartphone","jkcoin",false);}catch{}};
  }

  async function syncProfileBalance(){if(ui.profileSyncBusy)return false;try{const fb=await runtime(),user=await currentUser(fb),c=coinState();if(!user||!c)return false;const signature=`${c.balance}|${c.totalSpent}|${c.totalPurchased}`;if(signature===ui.profileSyncSignature)return true;ui.profileSyncBusy=true;await fb.setDoc(fb.doc(fb.db,"playerProfiles",user.uid),{jkCoinBalance:c.balance,jkCoinSpent:c.totalSpent,jkCoinPurchased:c.totalPurchased,jkCoinUpdatedAtMs:Date.now()},{merge:true});ui.profileSyncSignature=signature;return true;}catch{return false;}finally{ui.profileSyncBusy=false;}}

  async function applyRemoteCoinAmount(amount, label, grantKey, type="purchase"){
    const c=coinState();
    if(!c || c.lastGrantIds.includes(grantKey)) return false;
    const raw=Math.floor(Number(amount)||0);
    if(!raw) return false;
    const applied=raw>0?raw:-Math.min(c.balance,Math.abs(raw));
    c.balance=Math.max(0,c.balance+applied);
    if(applied>0)c.totalPurchased+=applied;else c.totalGifted+=Math.abs(applied);
    c.lastGrantIds.push(grantKey);
    c.lastGrantIds=c.lastGrantIds.slice(-500);
    ledger(type,applied,label);
    toast(`${applied>0?"+":""}${applied.toLocaleString("de-DE")} JK/Coin ${applied>0?"gutgeschrieben":"korrigiert"}.`);
    persist();updateSettingsBalance();
    return true;
  }

  async function syncApprovedPurchaseRequests(fb,user){
    const c=coinState(); if(!c)return;
    const candidates=c.requests.filter(r=>r?.online&&r.id&&!String(r.id).startsWith("local-")&&!c.lastGrantIds.includes(`request:${r.id}`)&&!["rejected","deleted"].includes(String(r.status||"pending"))).slice(0,60);
    for(const local of candidates){
      try{
        const snap=await fb.getDoc(fb.doc(fb.db,PURCHASE_COLLECTION,local.id));
        if(!snap.exists()){local.status="deleted";local.deletedAtMs=Date.now();continue;}
        const data=snap.data()||{};
        if(data.uid&&data.uid!==user.uid)continue;
        local.status=data.status||local.status;
        if(data.status==="approved"){
          const applied=await applyRemoteCoinAmount(Number(data.approvedCoins??data.coins??local.coins)||0,`Kaufanfrage bestätigt · ${data.packId||local.packId||"JK/Coin"}`,`request:${local.id}`,"purchase");
          if(applied)local.claimedAtMs=Date.now();
        }else if(data.status==="rejected")local.rejectedAtMs=Number(data.rejectedAtMs||Date.now());
      }catch(error){
        const code=String(error?.code||"");
        if(!/permission-denied|unauthenticated/i.test(code))console.debug?.("JK/Coin Anfrage-Sync pausiert",error?.message||error);
      }
    }
    persist();
  }

  async function syncGrantCollection(fb,user){
    if(ui.grantCollectionDenied)return;
    const c=coinState();if(!c)return;
    try{
      const snap=await fb.getDocs(fb.query(fb.collection(fb.db,GRANT_COLLECTION,user.uid,"items"),fb.limit(100)));
      for(const docSnap of snap.docs){
        const data=docSnap.data()||{};
        if(data.status!=="ready")continue;
        const requestKey=data.requestId?`request:${data.requestId}`:"";
        if(requestKey&&c.lastGrantIds.includes(requestKey)){
          await fb.setDoc(docSnap.ref,{status:"claimed",claimedAtMs:Date.now(),appliedCoins:0},{merge:true}).catch(()=>{});
          continue;
        }
        if(c.lastGrantIds.includes(`grant:${docSnap.id}`))continue;
        const amount=Math.floor(Number(data.coins)||0);
        const applied=await applyRemoteCoinAmount(amount,amount>0?`JK/Coin-Gutschrift · ${data.packId||data.reason||"Owner"}`:`Owner-Korrektur · ${data.reason||"JK/Coin entfernt"}`,`grant:${docSnap.id}`,amount>0?"purchase":"correction");
        if(applied)await fb.setDoc(docSnap.ref,{status:"claimed",claimedAtMs:Date.now(),appliedCoins:amount},{merge:true}).catch(()=>{});
      }
    }catch(error){
      const code=String(error?.code||error?.message||"");
      if(/permission-denied|missing or insufficient permissions/i.test(code)){
        ui.grantCollectionDenied=true;
        return;
      }
      console.debug?.("JK/Coin Grant-Sync pausiert",error?.message||error);
    }
  }

  async function syncGrants(){
    if(ui.grantSyncBusy||Date.now()-ui.lastGrantSync<15000)return;
    ui.lastGrantSync=Date.now();
    ui.grantSyncBusy=true;
    try{
      const fb=await runtime(),user=await currentUser(fb);if(!user)return;
      await syncApprovedPurchaseRequests(fb,user);
      await syncGrantCollection(fb,user);
    }catch(error){
      const code=String(error?.code||error?.message||"");
      if(!/permission-denied|missing or insufficient permissions|unauthenticated/i.test(code))console.debug?.("JK/Coin Sync pausiert",error?.message||error);
    }finally{ui.grantSyncBusy=false;}
  }

  async function renderOwnerPanel(container,context={}){
    if(!container)return;
    container.innerHTML=`<header class="online-mod-page-head"><div><small>JK/COIN-ZENTRALE</small><h1>Kaufanfragen & Guthaben</h1><p>Nur der Owner bestätigt Kaufanfragen, vergibt JK/Coins oder zieht sie ab.</p></div><div class="online-mod-page-actions"><button data-jkc-owner-refresh>↻ Aktualisieren</button></div></header><div class="online-mod-loading"><i></i><p>Lade JK/Coin-Daten …</p></div>`;
    try{
      const fb=context.fb||await runtime();
      const [requestSnap,profileSnap]=await Promise.all([
        fb.getDocs(fb.query(fb.collection(fb.db,PURCHASE_COLLECTION),fb.limit(200))),
        fb.getDocs(fb.query(fb.collection(fb.db,"playerProfiles"),fb.limit(250))).catch(()=>({docs:[]}))
      ]);
      const rows=requestSnap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>Number(b.createdAtMs||0)-Number(a.createdAtMs||0));
      const balances=profileSnap.docs.map(d=>({uid:d.id,...d.data()})).filter(p=>Number(p.jkCoinBalance||0)>0||Number(p.jkCoinSpent||0)>0||Number(p.jkCoinPurchased||0)>0).sort((a,b)=>Number(b.jkCoinBalance||0)-Number(a.jkCoinBalance||0));
      container.innerHTML=`
        <header class="online-mod-page-head"><div><small>JK/COIN-ZENTRALE</small><h1>Kaufanfragen & Guthaben</h1><p>Kaufanfragen, Guthaben und Korrekturen verwalten.</p></div><div class="online-mod-page-actions"><button data-jkc-owner-refresh>↻ Aktualisieren</button></div></header>
        <section class="online-mod-metric-grid compact">
          <article><small>OFFENE ANFRAGEN</small><b>${rows.filter(r=>r.status==="pending").length}</b><span>Owner-Freigabe nötig</span></article>
          <article><small>SPIELER MIT JK/COIN</small><b>${balances.length}</b><span>Synchronisierte Konten</span></article>
          <article><small>GESAMTBESTAND</small><b>${balances.reduce((sum,p)=>sum+Number(p.jkCoinBalance||0),0).toLocaleString("de-DE")}</b><span>JK/Coin</span></article>
        </section>
        <section class="online-mod-card"><div class="online-mod-card-title"><span>◈</span><div><small>MANUELLE GUTSCHRIFT</small><h3>JK/Coins vergeben oder entfernen</h3></div></div><div class="online-mod-form-grid"><label>Ziel-UID<input data-jkc-owner-target placeholder="Firebase UID" list="jkc-owner-users"></label><datalist id="jkc-owner-users">${balances.map(p=>`<option value="${esc(p.uid)}">${esc(p.displayName||p.firstName||p.email||p.uid)} · ${Number(p.jkCoinBalance||0)} JK/Coin</option>`).join("")}</datalist><label>Betrag<input data-jkc-owner-amount type="number" min="1" value="100"></label><label class="wide">Grund<input data-jkc-owner-reason maxlength="160" placeholder="Eventgewinn, Korrektur …"></label><div class="online-mod-actions wide"><button data-jkc-owner-manual="add">Hinzufügen</button><button class="danger" data-jkc-owner-manual="remove">Entfernen</button></div></div></section>
        <section class="online-mod-card"><div class="online-mod-card-title"><span>🏦</span><div><small>KONTEN</small><h3>Aktuelle JK/Coin-Bestände</h3></div></div><div class="jkc-owner-requests">${balances.length?balances.slice(0,100).map(p=>`<article class="jkc-owner-request"><header><div><b>${esc(p.displayName||p.firstName||p.email||p.uid)}</b><small>${esc(p.uid)}</small></div><span class="approved">${Number(p.jkCoinBalance||0).toLocaleString("de-DE")}</span></header><p>Gekauft/Gutschrift: ${Number(p.jkCoinPurchased||0).toLocaleString("de-DE")} · Ausgegeben: ${Number(p.jkCoinSpent||0).toLocaleString("de-DE")}</p><div class="jkc-actions"><button class="jkc-button secondary" data-jkc-owner-select-uid="${esc(p.uid)}">Auswählen</button></div></article>`).join(""):`<p>Noch keine synchronisierten JK/Coin-Konten.</p>`}</div></section>
        <section class="online-mod-card"><div class="online-mod-card-title"><span>🧾</span><div><small>ANFRAGEN</small><h3>${rows.length} JK/Coin-Anfragen</h3></div></div><div class="jkc-owner-requests">${rows.length?rows.map(r=>`<article class="jkc-owner-request"><header><div><b>${esc(r.displayName||r.email||r.uid||"Spieler")}</b><small>${new Date(Number(r.createdAtMs||Date.now())).toLocaleString("de-DE")}</small></div><span class="${esc(r.status||"pending")}">${esc(r.status||"pending")}</span></header><p><strong>${Number(r.coins||0).toLocaleString("de-DE")} JK/Coin</strong> · ${(Number(r.eurCents||0)/100).toFixed(2).replace(".",",")} € · ${esc(r.packId||"")} · Bestand: ${Number(r.currentBalance||0).toLocaleString("de-DE")}</p><div class="jkc-actions">${r.status==="pending"?`<button class="jkc-button" data-jkc-owner-request="approve" data-request-id="${esc(r.id)}">Bestätigen</button><button class="jkc-button danger" data-jkc-owner-request="reject" data-request-id="${esc(r.id)}">Ablehnen</button>`:""}<button class="jkc-button secondary" data-jkc-owner-delete-request="${esc(r.id)}">Löschen</button></div></article>`).join(""):`<p>Keine Anfragen vorhanden.</p>`}</div></section>`;
      bindOwnerPanel(container,fb,rows,context);
    }catch(error){container.innerHTML+=`<p class="online-mod-message error">${esc(error?.message||error)}</p>`;}
  }
  function bindOwnerPanel(container,fb,rows,context){
    container.querySelector("[data-jkc-owner-refresh]")?.addEventListener("click",()=>renderOwnerPanel(container,context));
    container.querySelectorAll("[data-jkc-owner-select-uid]").forEach(btn=>btn.addEventListener("click",()=>{const input=container.querySelector("[data-jkc-owner-target]");if(input){input.value=btn.dataset.jkcOwnerSelectUid||"";input.scrollIntoView({behavior:"smooth",block:"center"});input.focus();}}));
    container.querySelectorAll("[data-jkc-owner-request]").forEach(btn=>btn.addEventListener("click",async()=>{
      const row=rows.find(r=>r.id===btn.dataset.requestId);if(!row)return;btn.disabled=true;
      try{
        if(btn.dataset.jkcOwnerRequest==="approve"){
          await fb.setDoc(fb.doc(fb.db,PURCHASE_COLLECTION,row.id),{status:"approved",approvedCoins:Number(row.coins||0),approvedAtMs:Date.now(),approvedByUid:context.currentUser?.uid||"owner",updatedAtMs:Date.now()},{merge:true});
          // Optionaler Kompatibilitätsweg für manuelle/ältere Grant-Regeln. Eine
          // fehlende Berechtigung blockiert die normale Kaufgutschrift nicht mehr.
          await fb.setDoc(fb.doc(fb.db,GRANT_COLLECTION,row.uid,"items",row.id),{status:"ready",coins:Number(row.coins||0),packId:row.packId||"",requestId:row.id,createdAtMs:Date.now(),createdByUid:context.currentUser?.uid||"owner"},{merge:true}).catch(()=>{});
        }else await fb.setDoc(fb.doc(fb.db,PURCHASE_COLLECTION,row.id),{status:"rejected",rejectedAtMs:Date.now(),rejectedByUid:context.currentUser?.uid||"owner",updatedAtMs:Date.now()},{merge:true});
        await renderOwnerPanel(container,context);
      }catch(error){toast(String(error?.message||error));btn.disabled=false;}
    }));
    container.querySelectorAll("[data-jkc-owner-delete-request]").forEach(btn=>btn.addEventListener("click",async()=>{
      const row=rows.find(r=>r.id===btn.dataset.jkcOwnerDeleteRequest);if(!row)return;
      const pending=row.status==="pending";if(!await jkcConfirm({title:"JK/Coin-Anfrage löschen",message:pending?"Offene JK/Coin-Anfrage wirklich löschen? Sie kann danach nicht mehr bestätigt werden.":"Diese JK/Coin-Anfrage wirklich dauerhaft aus der Liste löschen?",confirmText:"Anfrage löschen",icon:"🗑️",tone:"danger"}))return;
      btn.disabled=true;
      try{await fb.deleteDoc(fb.doc(fb.db,PURCHASE_COLLECTION,row.id));toast("JK/Coin-Anfrage gelöscht.");await renderOwnerPanel(container,context);}
      catch(error){toast(String(error?.message||error));btn.disabled=false;}
    }));
    container.querySelectorAll("[data-jkc-owner-manual]").forEach(btn=>btn.addEventListener("click",async()=>{
      const uid=container.querySelector("[data-jkc-owner-target]")?.value.trim(),amount=Math.max(1,Math.floor(Number(container.querySelector("[data-jkc-owner-amount]")?.value)||0)),reason=container.querySelector("[data-jkc-owner-reason]")?.value.trim();
      if(!uid||!reason)return toast("UID und Grund eintragen.");
      const id=`manual-${Date.now()}`;
      try{await fb.setDoc(fb.doc(fb.db,GRANT_COLLECTION,uid,"items",id),{status:"ready",coins:btn.dataset.jkcOwnerManual==="remove"?-amount:amount,manual:true,reason,createdAtMs:Date.now(),createdByUid:context.currentUser?.uid||"owner"});toast("JK/Coin-Korrektur vorgemerkt.");}
      catch(error){toast(String(error?.message||error));}
    }));
  }

  function toast(text){let el=document.querySelector(".jkc-toast");if(!el){el=document.createElement("div");el.className="jkc-toast";document.body.append(el);}el.textContent=text;clearTimeout(ui.toastTimer);requestAnimationFrame(()=>el.classList.add("show"));ui.toastTimer=setTimeout(()=>el.classList.remove("show"),2500);}
  function decorateActiveViews(){
    document.querySelectorAll(".device-shell .jkc-app").forEach(app=>{if(app.dataset.jkcBound)return;app.dataset.jkcBound="1";bind(app.closest(".device-shell")||document,window.JKGamesOwnedPhoneItem?.()||"Smartphone");});
    document.querySelectorAll(".jk-bank-app-v58, .device-active-bank").forEach(bank=>bindBank(bank));
  }
  const GAME_LABELS={runner:"Runner.KL",city:"City.KL",match:"Match.KL",fight:"Fight.KL",dungeon:"Dungeon.KL",money:"Money.KL",bigcards:"BigCards.kl",escape:"Escape.kl",egoshoot:"Egoshoot.KL",weed:"Weed Business",casino:"Casino"};

  function renderGameOverlay(game){
    const old=document.querySelector(".jkc-ingame-overlay");
    const requested=String(game||"").toLowerCase(),context=GAME_LABELS[requested]?requested:"runner";
    const hasDedicatedStore=GAME_STORE.some(entry=>entry.game===context);
    ui.gameOverlay=context;
    if(!old){ui.tab="games";ui.game=hasDedicatedStore?context:"all";}
    const host=old||document.createElement("div");
    host.className="jkc-ingame-overlay";
    host.dataset.jkcGameOverlay=context;
    host.innerHTML=`<div class="jkc-ingame-card"><header class="jkc-ingame-head"><div><small>JK/COIN · ${esc(GAME_LABELS[context]||context)}</small><h2>JK/Coin</h2><p>Der komplette JK/Coin-Bereich bleibt geöffnet – inklusive ${esc(GAME_LABELS[context]||context)} Extras.</p></div><button type="button" data-jkc-game-close aria-label="JK/Coin schließen">×</button></header><div class="jkc-ingame-app">${html()}</div></div>`;
    if(!old)document.body.append(host);
    host.querySelector("[data-jkc-game-close]")?.addEventListener("click",()=>{ui.gameOverlay="";host.remove();});
    bind(host,"");
    restoreShopPageScroll(host);
    syncGrants().catch(()=>{});
  }

  function openForGame(game){const key=String(game||"").toLowerCase();if(!GAME_LABELS[key])return false;renderGameOverlay(key);return true;}

  function installGameShortcuts(){
    // V217: Keine frei schwebenden JK/Coin-Schaltflächen mehr. Die Spiele besitzen
    // feste JK-Buttons an den vom jeweiligen UI vorgesehenen Stellen.
    document.querySelectorAll("[data-jkc-ingame-open]").forEach(button=>button.remove());
  }

  function init(){coinState();installSettingsCard();installHypeShortcut();const observer=new MutationObserver(()=>{installSettingsCard();decorateActiveViews();installGameShortcuts();installHypeShortcut();});observer.observe(document.documentElement,{childList:true,subtree:true});decorateActiveViews();installGameShortcuts();window.addEventListener("lifebuilder-local-save-flushed",()=>updateSettingsBalance());window.addEventListener("online",()=>syncHypeProfile().catch(()=>{}));setInterval(()=>syncGrants().catch(()=>{}),60000);setInterval(()=>{applyPendingGameEntitlements();syncProfileBalance();},120000);setInterval(()=>{if(ui.tab!=="games"||!document.querySelector(".jkc-app"))return;const sig=dynamicStoreSignature();if(ui.dynamicSignature&&sig!==ui.dynamicSignature){rememberShopPageScroll();ui.dynamicSignature=sig;refreshPhone(window.JKGamesOwnedPhoneItem?.()||"");}},5000);setTimeout(()=>{applyPendingGameEntitlements();processHypeMilestones();syncProfileBalance();installGameShortcuts();installHypeShortcut();},2500);}

  window.JKCoinApp=Object.freeze({version:VERSION,html,bind,bankPanelHtml,bindBank,requestPack,coinState,currentRate,renderOwnerPanel,credit,spend,syncGrants,syncProfileBalance,applyPendingGameEntitlements,openForGame,openHype,syncHypeProfile,addFragments,rollTopGameDrop,processHypeMilestones,fragmentRate:FRAGMENTS_PER_COIN,gameStore:GAME_STORE,boxes:BOXES});
  init();
})();
