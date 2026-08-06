(() => {
  "use strict";

  const VERSION = "2026-08-06-jkcoin-v207";
  const PURCHASE_COLLECTION = "jkCoinPurchaseRequests";
  const GRANT_COLLECTION = "jkCoinGrants";
  const TOTAL_COLLECTIBLES = 6470;
  const PACKS = [
    { id:"pack-100", eur:0.99, coins:100, bonus:0 },
    { id:"pack-600", eur:4.99, coins:600, bonus:19 },
    { id:"pack-1200", eur:9.99, coins:1200, bonus:19 },
    { id:"pack-3000", eur:24.99, coins:3000, bonus:19 },
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
  const BOXES = [
    { id:"reward-100", name:"Starter Lucky Box", cost:100, type:"reward", money:[10000,50000], xp:[30,150], items:1, minRarity:"common" },
    { id:"reward-500", name:"Premium Lucky Box", cost:500, type:"reward", money:[75000,400000], xp:[200,800], items:2, minRarity:"rare" },
    { id:"reward-1000", name:"Elite Lucky Box", cost:1000, type:"reward", money:[250000,1500000], xp:[600,2200], items:3, minRarity:"epic" },
    { id:"reward-2000", name:"Universe Lucky Box", cost:2000, type:"reward", money:[1000000,20000000], xp:[1500,6000], items:5, minRarity:"legendary" },
    { id:"reward-5000", name:"Galaxy Lucky Box", cost:5000, type:"reward", money:[100000000,1500000000], xp:[5000,25000], items:10, minRarity:"special" },
    { id:"collect-100", name:"Sammler-Kiste 100", cost:100, type:"collect", tier:"basic" },
    { id:"collect-500", name:"Sammler-Kiste 500", cost:500, type:"collect", tier:"premium" },
    { id:"collect-1000", name:"Sammler-Kiste 1000", cost:1000, type:"collect", tier:"elite" }
  ];
  const COLLECT_CHANCES = {
    basic: { common:100,uncommon:90,rare:80,epic:40,legendary:24,special:11,mystic:8,exotic:5,universe:1,blackhole:.1,galaxy:.001 },
    premium: { common:100,uncommon:100,rare:94,epic:72,legendary:48,special:25,mystic:16,exotic:8,universe:2.5,blackhole:.6,galaxy:.005 },
    elite: { common:100,uncommon:100,rare:100,epic:100,legendary:80,special:50,mystic:30,exotic:5,universe:4,blackhole:2,galaxy:.01 }
  };
  const GAME_STORE = [
    { game:"runner", id:"runner-board-5", name:"5 Galaxy-Hoverboards", cost:120, text:"Fünf Zusammenstoß-Retter für Runner.KL.", grant:{kind:"hoverboard",amount:5} },
    { game:"runner", id:"runner-board-25", name:"25 Galaxy-Hoverboards", cost:450, text:"Großes Hoverboard-Paket.", grant:{kind:"hoverboard",amount:25} },
    { game:"runner", id:"runner-trail", name:"Galaxy-Laufspur", cost:350, text:"Exklusive kosmische Laufspur.", grant:{kind:"galaxyTrail",amount:1} },
    { game:"city", id:"city-founder", name:"Exklusiver Gründer", cost:300, text:"Schaltet einen exklusiven Startspieler frei.", grant:{kind:"founder",amount:1} },
    { game:"city", id:"city-mogul", name:"Galaxy-Mogul", cost:650, text:"Exklusiver City.KL-Startspieler.", grant:{kind:"galaxyMogul",amount:1} },
    { game:"match", id:"match-lives", name:"5 Match-Leben", cost:100, text:"Füllt alle fünf Herzen auf.", grant:{kind:"lives",amount:5} },
    { game:"match", id:"match-coins-1500", name:"1.500 Match Coins", cost:140, text:"Für Booster und Shopkäufe.", grant:{kind:"coins",amount:1500} },
    { game:"match", id:"match-booster", name:"Galaxy-Booster-Set", cost:220, text:"Je fünf Hammer, Bombe und +5-Züge.", grant:{kind:"boosterSet",amount:5} },
    { game:"fight", id:"fight-wave50", name:"Startwelle 50", cost:500, text:"Schaltet Welle 50 als Startpunkt frei.", grant:{kind:"wave50",amount:1} },
    { game:"fight", id:"fight-godmode", name:"1-Minute-Godmode", cost:100, text:"Wird bei 10 % Leben automatisch ausgelöst.", grant:{kind:"godmode",amount:1} },
    { game:"fight", id:"fight-star", name:"Stern-Booster", cost:200, text:"Erhöht ein gewähltes Fight.KL-Item um einen Stern.", grant:{kind:"star",amount:1} },
    { game:"fight", id:"fight-galaxy-crate", name:"Galaxy-Arsenal-Kiste", cost:850, text:"Exklusives Endgame-Item für Fight.KL.", grant:{kind:"galaxyItem",amount:1} },
    { game:"dungeon", id:"dungeon-revive", name:"Wiederbelebungs-Siegel", cost:120, text:"Einmalige Wiederbelebung im Dungeon.", grant:{kind:"revive",amount:1} },
    { game:"dungeon", id:"dungeon-loot", name:"Beute-Segen 30 Min.", cost:180, text:"Erhöht die Beutechance für 30 Minuten.", grant:{kind:"lootBoost",amount:1} },
    { game:"dungeon", id:"dungeon-key", name:"Nexus-Schlüssel", cost:350, text:"Exklusiver Dungeon-Zugangsschlüssel.", grant:{kind:"nexusKey",amount:1} },
    { game:"weed", id:"weed-grow", name:"Galaxy-Growlicht", cost:250, text:"Exklusives Growlicht für das Weed-Business.", grant:{kind:"growLight",amount:1} },
    { game:"weed", id:"weed-crate", name:"Premium-Lieferkiste", cost:300, text:"Spezielle Lieferkiste mit Business-Material.", grant:{kind:"supplyCrate",amount:1} },
    { game:"casino", id:"casino-jetons", name:"Jetons zum Tageskurs", cost:1, text:"1 JK/Coin wird zum aktuellen Kurs in Casino-Jetons umgewandelt.", grant:{kind:"jetons",amount:1}, variable:true }
  ];
  const ADJECTIVES = ["Verlorenes","Neon","Antikes","Kosmisches","Goldenes","Schatten","Königliches","Mechanisches","Kristall","Verfluchtes","Legendäres","Digitales","Galaktisches","Obsidian","Sternen","Zeitloses","Rubin","Smaragd","Silbernes","Schwarzes"];
  const NOUNS = ["Abzeichen","Artefakt","Amulett","Poster","Modul","Relikt","Ticket","Siegel","Sammlerstück","Emblem","Helm","Ring","Kern","Würfel","Chip","Medaillon","Schlüssel","Totem","Fragment","Trophäe"];
  const ui = { tab:"home", game:"all", grantsListening:false, toastTimer:0, lastGrantSync:0 };
  const esc = v => String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const randInt = (min,max) => Math.floor(Math.random()*(max-min+1))+min;
  const clamp = (n,min,max) => Math.min(max,Math.max(min,Number(n)||0));
  const euro = n => `${Math.round(Number(n)||0).toLocaleString("de-DE")} €`;

  function rootState(){ try{return typeof state!=="undefined"?state:null;}catch{return null;} }
  function persist(){ try{ if(typeof save==="function")save(); }catch(error){console.warn("JK/Coin speichern",error);} }
  function feed(text){try{if(typeof addFeed==="function")addFeed(text);}catch{}}
  function coinState(){
    const root=rootState(); if(!root)return null;
    root.jkCoin ||= { version:VERSION,balance:0,totalPurchased:0,totalSpent:0,totalGifted:0,totalEarned:0,ledger:[],requests:[],collectibles:[],collectionUnique:{},gamePurchases:{},entitlements:{},appliedEntitlements:{},lastGrantIds:[],createdAtMs:Date.now() };
    const c=root.jkCoin;c.version=VERSION;c.balance=Math.max(0,Math.floor(Number(c.balance)||0));c.totalPurchased=Math.max(0,Number(c.totalPurchased)||0);c.totalSpent=Math.max(0,Number(c.totalSpent)||0);c.totalGifted=Math.max(0,Number(c.totalGifted)||0);c.totalEarned=Math.max(0,Number(c.totalEarned)||0);c.ledger=Array.isArray(c.ledger)?c.ledger:[];c.requests=Array.isArray(c.requests)?c.requests:[];c.collectibles=Array.isArray(c.collectibles)?c.collectibles:[];c.collectionUnique=c.collectionUnique&&typeof c.collectionUnique==="object"?c.collectionUnique:{};c.gamePurchases=c.gamePurchases&&typeof c.gamePurchases==="object"?c.gamePurchases:{};c.entitlements=c.entitlements&&typeof c.entitlements==="object"?c.entitlements:{};c.appliedEntitlements=c.appliedEntitlements&&typeof c.appliedEntitlements==="object"?c.appliedEntitlements:{};c.lastGrantIds=Array.isArray(c.lastGrantIds)?c.lastGrantIds:[];return c;
  }
  function ledger(type,amount,text,meta={}){const c=coinState();if(!c)return;c.ledger.unshift({id:`jkc-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,type,amount:Number(amount)||0,text:String(text||""),at:Date.now(),...meta});c.ledger=c.ledger.slice(0,300);persist();}
  function spend(amount,text){const c=coinState(),value=Math.max(0,Math.floor(Number(amount)||0));if(!c||c.balance<value)return false;c.balance-=value;c.totalSpent+=value;ledger("spend",-value,text);return true;}
  function credit(amount,text,type="credit"){const c=coinState(),value=Math.max(0,Math.floor(Number(amount)||0));if(!c||!value)return false;c.balance+=value;c.totalEarned+=value;ledger(type,value,text);return true;}
  function currentRate(now=Date.now()){
    const bucket=Math.floor(now/(15*60*1000));let h=2166136261>>>0;for(const ch of String(bucket)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}const noise=(h%51)-25;const wave=Math.sin(bucket/2.7)*92+Math.sin(bucket/9.3)*58;return Math.round(clamp(100+wave+noise,10,340));
  }
  function nextRateMinutes(){return Math.max(1,Math.ceil((15*60*1000-(Date.now()%(15*60*1000)))/60000));}
  function userName(){const s=rootState();return `${s?.firstName||"Spieler"} ${s?.lastName||""}`.trim();}
  async function runtime(){const core=window.LifeBuilderFirebaseCore;if(!core?.load)throw new Error("Firebase ist nicht geladen.");return core.load();}
  async function currentUser(fb){return await window.LifeBuilderFirebaseCore.waitForAuth?.(6000)||fb.auth.currentUser;}

  function settingsCardHtml(){return `<section class="settings-v62-group settings-wide jkc-settings-card" data-jkc-settings><header><span>◈</span><div><b>JK/Coins</b><small>Kaufanfrage, Guthaben und Bonuspakete</small></div></header><div class="settings-v62-row settings-wide"><span><b>Aktuelles Guthaben</b><small>Kaufanfragen werden vom Owner bestätigt. Hier wird keine automatische Zahlung verarbeitet.</small></span><strong data-jkc-settings-balance>${coinState()?.balance||0} JK/Coin</strong></div><div class="jkc-settings-pack-grid">${PACKS.map(p=>`<button type="button" data-jkc-request-pack="${p.id}"><b>${p.coins.toLocaleString("de-DE")} JK/Coin</b><small>${p.eur.toFixed(2).replace(".",",")} €${p.bonus?` · +${p.bonus}%`:""}</small></button>`).join("")}</div><p class="device-hint">Kaufanfrage: Der Owner prüft und bestätigt oder lehnt ab. Eine echte Zahlungsabwicklung ist in dieser Webversion nicht eingebaut.</p></section>`;}
  function installSettingsCard(){const panel=document.querySelector("#settingsView .settings-panel");if(!panel||panel.querySelector("[data-jkc-settings]"))return;const wrapper=document.createElement("div");wrapper.innerHTML=settingsCardHtml();const card=wrapper.firstElementChild;const support=panel.querySelector("[data-online-mod-settings]");if(support)panel.insertBefore(card,support);else panel.append(card);card.querySelectorAll("[data-jkc-request-pack]").forEach(b=>b.addEventListener("click",()=>requestPack(b.dataset.jkcRequestPack)));}

  async function requestPack(packId){
    const pack=PACKS.find(p=>p.id===packId);if(!pack)return;
    if(!confirm(`${pack.coins.toLocaleString("de-DE")} JK/Coin für ${pack.eur.toFixed(2).replace(".",",")} € anfragen?\n\nDies erstellt nur eine Anfrage an den Owner. Es findet keine automatische Zahlung statt.`))return;
    const c=coinState();const local={id:`local-${Date.now()}`,packId,status:"pending",coins:pack.coins,eur:pack.eur,createdAtMs:Date.now()};c.requests.unshift(local);persist();
    try{
      const fb=await runtime(),user=await currentUser(fb);if(!user)throw new Error("Bitte zuerst anmelden.");
      const ref=fb.doc(fb.collection(fb.db,PURCHASE_COLLECTION));
      const payload={requestId:ref.id,status:"pending",uid:user.uid,email:user.email||"",displayName:userName(),slot:Math.max(0,Number(typeof selectedSlot!=="undefined"?selectedSlot:0)),packId:pack.id,coins:pack.coins,eurCents:Math.round(pack.eur*100),bonusPercent:pack.bonus,createdAtMs:Date.now(),updatedAtMs:Date.now(),source:location.origin,currentBalance:c.balance};
      await fb.setDoc(ref,payload);local.id=ref.id;local.online=true;persist();toast("JK/Coin-Kaufanfrage wurde an den Owner gesendet.");
    }catch(error){toast(`Anfrage lokal gespeichert, aber Firebase meldet: ${String(error?.message||error).replace(/^FirebaseError:\s*/i,"")}`);}
    updateSettingsBalance();
  }
  function updateSettingsBalance(){document.querySelectorAll("[data-jkc-settings-balance]").forEach(el=>el.textContent=`${coinState()?.balance||0} JK/Coin`);}

  function html(){
    const c=coinState(),rate=currentRate();
    return `<div class="jkc-app"><section class="jkc-hero"><div class="jkc-hero-head"><div style="display:flex;gap:12px"><span class="jkc-logo">JK</span><div><small>PREMIUM-WÄHRUNG</small><h3>JK/Coin</h3><p style="margin:0;color:#a5b5c2">Kaufanfragen, Lucky Boxes, Spiel-Extras und Sammlung.</p></div></div><div class="jkc-wallet"><small>GUTHABEN</small><b>${c.balance.toLocaleString("de-DE")}</b><em>1 JK/Coin = ${euro(rate)}</em></div></div></section><nav class="jkc-tabs">${[["home","Übersicht"],["boxes","Lucky Boxes"],["games","Spiele"],["collection","Sammlung"],["ledger","Konto"]].map(([id,label])=>`<button type="button" class="${ui.tab===id?"active":""}" data-jkc-tab="${id}">${label}</button>`).join("")}</nav>${ui.tab==="boxes"?boxesHtml():ui.tab==="games"?gamesHtml():ui.tab==="collection"?collectionHtml():ui.tab==="ledger"?ledgerHtml():homeHtml()}</div>`;
  }
  function homeHtml(){const c=coinState(),rate=currentRate();return `<section class="jkc-section"><small>JK/COIN-MARKT</small><h4>Aktueller Umtauschkurs</h4><div class="jkc-rate"><div><small>NÄCHSTE ÄNDERUNG IN ${nextRateMinutes()} MIN.</small><b>1 JK/Coin = ${euro(rate)}</b><p>Der Kurs schwankt zwischen 10 € und 340 €. Euro können nicht zurück in JK/Coins getauscht werden.</p></div><button class="jkc-button gold" data-jkc-exchange>Umtauschen</button></div></section><section class="jkc-section"><small>ECHTGELD-KAUFANFRAGE</small><h4>JK/Coin-Pakete</h4><div class="jkc-grid">${PACKS.map(p=>`<article class="jkc-card highlight"><div class="jkc-pack"><span class="jkc-pack-icon">${p.coins>=3000?"◆":"JK"}</span><div><h5>${p.coins.toLocaleString("de-DE")} JK/Coin</h5><p>${p.bonus?`<span class="jkc-bonus">+${p.bonus}% Bonus</span>`:"Standardpaket"}</p></div><strong>${p.eur.toFixed(2).replace(".",",")} €</strong></div><div class="jkc-actions"><button class="jkc-button" data-jkc-request-pack="${p.id}">Anfrage senden</button></div></article>`).join("")}</div><p class="device-hint">Es wird keine automatische Kartenzahlung verarbeitet. Die Anfrage erscheint im Owner-Menü und wird manuell bestätigt oder abgelehnt.</p></section><section class="jkc-section"><small>SCHNELLZUGRIFF</small><div class="jkc-grid"><article class="jkc-card"><h5>Lucky Boxes</h5><p>Euro, Haupt-EP, exklusive Inhalte und sammelbare Gegenstände.</p><button class="jkc-button secondary" data-jkc-go="boxes">Öffnen</button></article><article class="jkc-card"><h5>Spiele-Shop</h5><p>Erlaubte Extras für Runner.KL, City.KL, Match.KL, Fight.KL, Dungeon.KL, Weed und Casino.</p><button class="jkc-button secondary" data-jkc-go="games">Öffnen</button></article></div></section>`;}
  function boxesHtml(){return `<section class="jkc-section"><small>LUCKY BOXEN</small><h4>Belohnungspakete</h4><div class="jkc-grid">${BOXES.filter(b=>b.type==="reward").map(b=>boxCard(b)).join("")}</div></section><section class="jkc-section"><small>SAMMLER-KISTEN · 6.470 MÖGLICHE ITEMS</small><h4>Exklusive Sammlerstücke</h4><div class="jkc-grid">${BOXES.filter(b=>b.type==="collect").map(b=>boxCard(b)).join("")}</div></section>`;}
  function boxCard(b){const probs=b.type==="collect"?COLLECT_CHANCES[b.tier]:null;return `<article class="jkc-card jkc-box" style="--box-color:${b.cost>=5000?"#ff72d7":b.cost>=1000?"#a46cff":"#64e6ff"}"><div class="jkc-box-icon">${b.type==="collect"?"◈":"🎁"}</div><small>${b.type==="collect"?"SAMMLER-KISTE":"LUCKY BOX"}</small><h5>${esc(b.name)}</h5><p>${b.type==="reward"?`${euro(b.money[0])} bis ${euro(b.money[1])}, ${b.xp[0]}–${b.xp[1]} Haupt-EP und exklusive Belohnungen.`:"Mehrere unabhängige Seltenheitswürfe. Sehr seltene Items besitzen extrem hohen Sammlerwert."}</p>${probs?`<div class="jkc-prob-list">${["epic","legendary","special","universe","blackhole","galaxy"].map(id=>`<span>${RARITIES.find(r=>r.id===id).name}<br><b>${probs[id]}%</b></span>`).join("")}</div>`:""}<div class="jkc-actions"><button class="jkc-button gold" data-jkc-open-box="${b.id}">${b.cost.toLocaleString("de-DE")} JK/Coin</button></div></article>`;}
  function gamesHtml(){const games=["all","runner","city","match","fight","dungeon","weed","casino"];const labels={all:"Alle",runner:"Runner.KL",city:"City.KL",match:"Match.KL",fight:"Fight.KL",dungeon:"Dungeon.KL",weed:"Weed Business",casino:"Casino"};const list=GAME_STORE.filter(x=>ui.game==="all"||x.game===ui.game);return `<section class="jkc-section"><small>SPIELE-SHOP</small><h4>JK/Coin-Inhalte</h4><div class="jkc-game-filter">${games.map(g=>`<button class="jkc-button ${ui.game===g?"gold":"secondary"}" data-jkc-game-filter="${g}">${labels[g]}</button>`).join("")}</div><div class="jkc-grid">${list.map(item=>`<article class="jkc-card"><small>${labels[item.game].toUpperCase()}</small><h5>${esc(item.name)}</h5><p>${esc(item.text)}</p><div class="jkc-actions"><button class="jkc-button" data-jkc-buy-game="${item.id}">${item.variable?"Betrag wählen":`${item.cost} JK/Coin`}</button></div></article>`).join("")}</div><p class="device-hint">Mensch ärgere dich nicht, Trading, Börse, Business-Handel und die normalen Games bleiben unverändert.</p></section>`;}
  function collectionHtml(){const c=coinState(),unique=Object.keys(c.collectionUnique).length,pct=(unique/TOTAL_COLLECTIBLES*100);const items=c.collectibles.slice(0,200);return `<section class="jkc-section"><div class="jkc-collection-head"><div><small>JK-SAMMLUNG</small><h4>${unique.toLocaleString("de-DE")} / ${TOTAL_COLLECTIBLES.toLocaleString("de-DE")} entdeckt</h4></div><b>${pct.toFixed(3).replace(".",",")}%</b></div><div class="jkc-progress"><i style="width:${Math.min(100,pct)}%"></i></div></section><section class="jkc-section"><div class="jkc-grid">${items.length?items.map(item=>`<article class="jkc-card jkc-collectible jkc-rarity-${item.rarity}"><small>${esc(item.rarityName)}</small><h5>${esc(item.name)}</h5><p>${esc(item.description)}</p><strong>${euro(item.value)}</strong><div class="jkc-actions"><button class="jkc-button danger" data-jkc-sell-collectible="${item.uid}">Verkaufen</button></div></article>`).join(""):`<p>Noch keine Sammlerstücke. Öffne eine Sammler-Kiste.</p>`}</div></section>`;}
  function ledgerHtml(){const c=coinState();return `<section class="jkc-section"><small>JK/COIN-KONTO</small><h4>Kontobewegungen</h4><div class="jkc-grid"><article class="jkc-card"><small>AKTUELL</small><h5>${c.balance.toLocaleString("de-DE")} JK/Coin</h5></article><article class="jkc-card"><small>GEKAUFT / GUTGESCHRIEBEN</small><h5>${Math.round(c.totalPurchased+c.totalEarned).toLocaleString("de-DE")}</h5></article><article class="jkc-card"><small>AUSGEGEBEN</small><h5>${Math.round(c.totalSpent).toLocaleString("de-DE")}</h5></article><article class="jkc-card"><small>VERSCHENKT</small><h5>${Math.round(c.totalGifted).toLocaleString("de-DE")}</h5></article></div><div class="jkc-ledger">${c.ledger.length?c.ledger.map(row=>`<article><span><b>${esc(row.text)}</b><small>${new Date(row.at).toLocaleString("de-DE")}</small></span><strong class="${row.amount>=0?"plus":"minus"}">${row.amount>=0?"+":""}${Math.round(row.amount).toLocaleString("de-DE")} JK/Coin</strong></article>`).join(""):`<p>Noch keine Kontobewegungen.</p>`}</div></section>`;}

  function bind(shell,item){
    shell.querySelectorAll("[data-jkc-tab]").forEach(b=>b.addEventListener("click",()=>{ui.tab=b.dataset.jkcTab;refreshPhone(item);}));
    shell.querySelectorAll("[data-jkc-go]").forEach(b=>b.addEventListener("click",()=>{ui.tab=b.dataset.jkcGo;refreshPhone(item);}));
    shell.querySelectorAll("[data-jkc-request-pack]").forEach(b=>b.addEventListener("click",()=>requestPack(b.dataset.jkcRequestPack).then(()=>refreshPhone(item))));
    shell.querySelector("[data-jkc-exchange]")?.addEventListener("click",()=>exchangePrompt(item));
    shell.querySelectorAll("[data-jkc-open-box]").forEach(b=>b.addEventListener("click",()=>openBox(b.dataset.jkcOpenBox,item)));
    shell.querySelectorAll("[data-jkc-game-filter]").forEach(b=>b.addEventListener("click",()=>{ui.game=b.dataset.jkcGameFilter;refreshPhone(item);}));
    shell.querySelectorAll("[data-jkc-buy-game]").forEach(b=>b.addEventListener("click",()=>buyGameItem(b.dataset.jkcBuyGame,item)));
    shell.querySelectorAll("[data-jkc-sell-collectible]").forEach(b=>b.addEventListener("click",()=>sellCollectible(b.dataset.jkcSellCollectible,item)));
    syncGrants().catch(()=>{});
  }
  function refreshPhone(item){try{if(typeof openDeviceInterface==="function")openDeviceInterface(item||window.JKGamesOwnedPhoneItem?.()||"Smartphone","jkcoin",false);}catch{}}
  function exchangePrompt(item){const c=coinState(),rate=currentRate();const raw=prompt(`Wie viele JK/Coins möchtest du zum Kurs 1 = ${euro(rate)} umtauschen?\nVerfügbar: ${c.balance}`);if(raw==null)return;const amount=Math.max(0,Math.floor(Number(String(raw).replace(",","."))||0));if(!amount||amount>c.balance)return toast("Ungültiger Betrag oder nicht genug JK/Coins.");if(!confirm(`${amount} JK/Coin gegen ${euro(amount*rate)} tauschen? Dieser Tausch kann nicht rückgängig gemacht werden.`))return;if(!spend(amount,`Umtausch zu ${euro(rate)} je JK/Coin`))return;const root=rootState();root.bank=Number(root.bank||0)+amount*rate;ledger("exchange",0,`${amount} JK/Coin → ${euro(amount*rate)}`,{rate});persist();feed(`${amount} JK/Coin wurden zum Kurs ${euro(rate)} in ${euro(amount*rate)} umgetauscht.`);refreshPhone(item);}

  function openBox(boxId,item){const box=BOXES.find(b=>b.id===boxId),c=coinState();if(!box)return;if(c.balance<box.cost)return toast("Nicht genug JK/Coins.");if(!confirm(`${box.name} für ${box.cost} JK/Coin öffnen?`))return;if(!spend(box.cost,box.name))return;const rewards=box.type==="reward"?openRewardBox(box):openCollectBox(box);persist();showRewards(box,rewards,()=>refreshPhone(item));}
  function openRewardBox(box){const root=rootState();const money=randInt(box.money[0],box.money[1]);const xp=randInt(box.xp[0],box.xp[1]);root.bank=Number(root.bank||0)+money;try{if(typeof addXp==="function")addXp(xp,box.name);}catch{root.xp=Number(root.xp||0)+xp;}const rewards=[{name:euro(money),text:"Bankguthaben"},{name:`${xp} Haupt-EP`,text:"Charakterfortschritt"}];
    if(box.cost>=500&&Math.random()<Math.min(.8,.18+box.cost/9000)){const skin=`JK Exclusive ${box.cost>=5000?"Galaxy":box.cost>=2000?"Universe":box.cost>=1000?"Legend":"Premium"} Skin #${randInt(1,999)}`;root.wardrobe=Array.isArray(root.wardrobe)?root.wardrobe:[];if(!root.wardrobe.includes(skin))root.wardrobe.push(skin);coinState().entitlements[`main-skin:${skin}`]=1;rewards.push({name:skin,text:"Exklusiver Hauptcharakter-Skin"});}
    for(let i=0;i<box.items;i++){const collectible=createCollectibleWeighted(box.minRarity);addCollectible(collectible);rewards.push({name:collectible.name,text:`${collectible.rarityName} · ${euro(collectible.value)}`});}return rewards;}
  function rarityAtLeast(id){return Math.max(0,RARITIES.findIndex(r=>r.id===id));}
  function createCollectibleWeighted(minRarity="common"){const min=rarityAtLeast(minRarity);const roll=Math.random();let idx=min;if(roll<.0002)idx=10;else if(roll<.003)idx=Math.max(min,9);else if(roll<.015)idx=Math.max(min,8);else if(roll<.06)idx=Math.max(min,7);else if(roll<.14)idx=Math.max(min,6);else if(roll<.28)idx=Math.max(min,5);else if(roll<.48)idx=Math.max(min,4);else if(roll<.7)idx=Math.max(min,3);else idx=Math.max(min,randInt(0,2));return createCollectible(RARITIES[Math.min(10,idx)]);}
  function openCollectBox(box){const probs=COLLECT_CHANCES[box.tier],rewards=[];RARITIES.forEach(rarity=>{if(Math.random()*100<probs[rarity.id]){const item=createCollectible(rarity);addCollectible(item);rewards.push({name:item.name,text:`${item.rarityName} · ${euro(item.value)}`});}});if(!rewards.length){const item=createCollectible(RARITIES[0]);addCollectible(item);rewards.push({name:item.name,text:`${item.rarityName} · ${euro(item.value)}`});}return rewards;}
  function createCollectible(rarity){const index=randInt(1,rarity.count),id=`${rarity.id}-${index}`;const name=`${ADJECTIVES[(index+rarity.count)%ADJECTIVES.length]} ${NOUNS[(index*7+rarity.count)%NOUNS.length]} #${String(index).padStart(4,"0")}`;const value=randInt(rarity.value[0],rarity.value[1]);return{uid:`collect-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,catalogId:id,rarity:rarity.id,rarityName:rarity.name,name,value,description:`Exklusives JK.Games-Sammlerstück. Serie ${index}/${rarity.count}. Sammlerwert, Prestige ${Math.max(1,RARITIES.indexOf(rarity)+1)} und Handelswert sind gespeichert.`,acquiredAt:Date.now()};}
  function addCollectible(item){const c=coinState();c.collectibles.unshift(item);c.collectibles=c.collectibles.slice(0,1000);c.collectionUnique[item.catalogId]=true;}
  function sellCollectible(uid,item){const c=coinState(),idx=c.collectibles.findIndex(x=>x.uid===uid);if(idx<0)return;const collectible=c.collectibles[idx];if(!confirm(`${collectible.name} für ${euro(collectible.value)} verkaufen?`))return;c.collectibles.splice(idx,1);rootState().bank=Number(rootState().bank||0)+collectible.value;ledger("collectible",0,`${collectible.name} verkauft · ${euro(collectible.value)}`);persist();refreshPhone(item);}
  function showRewards(box,rewards,onClose){const modal=document.createElement("div");modal.className="jkc-modal";modal.innerHTML=`<div class="jkc-modal-card"><small>GEÖFFNET</small><h2>${esc(box.name)}</h2><div class="jkc-open-rewards">${rewards.map(r=>`<article class="jkc-reward"><b>${esc(r.name)}</b><small>${esc(r.text)}</small></article>`).join("")}</div><div class="jkc-actions"><button class="jkc-button gold" data-jkc-close-rewards>Belohnungen übernehmen</button></div></div>`;document.body.append(modal);modal.querySelector("[data-jkc-close-rewards]").onclick=()=>{modal.remove();onClose?.();};}

  function buyGameItem(id,item){const entry=GAME_STORE.find(x=>x.id===id);if(!entry)return;let amount=entry.grant.amount;if(entry.variable){const raw=prompt(`Wie viele JK/Coins möchtest du zum aktuellen Kurs in Jetons umwandeln?\n1 JK/Coin = ${euro(currentRate())} Jetons`);if(raw==null)return;amount=Math.max(1,Math.floor(Number(raw)||0));if(amount>coinState().balance)return toast("Nicht genug JK/Coins.");}const cost=entry.variable?amount:entry.cost;if(!confirm(`${entry.name} für ${cost} JK/Coin kaufen?`))return;if(!spend(cost,entry.name))return;grantGamePurchase(entry,{...entry.grant,amount});persist();toast(`${entry.name} wurde deinem Spiel hinzugefügt.`);refreshPhone(item);}
  function grantGamePurchase(entry,grant){const c=coinState();c.gamePurchases[entry.id]=Number(c.gamePurchases[entry.id]||0)+1;c.entitlements[entry.id]=Number(c.entitlements[entry.id]||0)+Number(grant.amount||1);const rate=currentRate();if(entry.game==="casino"&&grant.kind==="jetons"){const eur=grant.amount*rate;const root=rootState();root.casinoWalletCents=Math.round(Number(root.casinoWalletCents||root.casinoWallet*100||0)+eur*100);root.casinoWallet=root.casinoWalletCents/100;c.appliedEntitlements[entry.id]=Number(c.entitlements[entry.id]||0);return;}applyPendingGameEntitlements();}
  function applyPendingGameEntitlements(){const c=coinState(),apiMap={runner:window.RunnerKL,city:window.CityKL,match:window.MatchKL,fight:window.FightKL,dungeon:window.DungeonKL,weed:window.WeedKL};for(const entry of GAME_STORE){if(entry.game==="casino")continue;const total=Number(c.entitlements[entry.id]||0),applied=Number(c.appliedEntitlements[entry.id]||0),delta=Math.max(0,total-applied);if(!delta)continue;try{const ok=apiMap[entry.game]?.grantJkCoinPurchase?.(entry.grant.kind,delta,{sku:entry.id,name:entry.name});if(ok!==false&&apiMap[entry.game]?.grantJkCoinPurchase)c.appliedEntitlements[entry.id]=total;}catch(error){console.warn("JK/Coin Spiel-Gutschrift",entry.game,error);}}persist();}

  function bankPanelHtml(){const c=coinState(),rate=currentRate();return `<section class="jkc-bank-panel" data-jkc-bank-panel><small>JK/COIN-KONTO</small><h3>Premium-Währung</h3><div class="jkc-bank-summary"><div><small>GUTHABEN</small><b>${c.balance.toLocaleString("de-DE")} JK/Coin</b></div><div><small>AKTUELLER KURS</small><b>1 = ${euro(rate)}</b></div><div><small>AUSGEGEBEN</small><b>${Math.round(c.totalSpent).toLocaleString("de-DE")}</b></div></div><div class="jkc-actions"><button class="jkc-button gold" data-jkc-bank-exchange>JK/Coin in Euro tauschen</button><button class="jkc-button secondary" data-jkc-bank-ledger>Kontobewegungen</button></div></section>`;}
  function bindBank(container){container?.querySelector("[data-jkc-bank-exchange]")?.addEventListener("click",()=>exchangePrompt(window.JKGamesOwnedPhoneItem?.()||""));container?.querySelector("[data-jkc-bank-ledger]")?.addEventListener("click",()=>{try{ui.tab="ledger";if(typeof openDeviceInterface==="function")openDeviceInterface(window.JKGamesOwnedPhoneItem?.()||"Smartphone","jkcoin",false);}catch{}});}

  async function syncProfileBalance(){try{const fb=await runtime(),user=await currentUser(fb),c=coinState();if(!user||!c)return;await fb.setDoc(fb.doc(fb.db,"playerProfiles",user.uid),{jkCoinBalance:c.balance,jkCoinSpent:c.totalSpent,jkCoinPurchased:c.totalPurchased,jkCoinUpdatedAtMs:Date.now()},{merge:true});}catch{}}

  async function syncGrants(){if(Date.now()-ui.lastGrantSync<5000)return;ui.lastGrantSync=Date.now();try{const fb=await runtime(),user=await currentUser(fb);if(!user)return;const snap=await fb.getDocs(fb.query(fb.collection(fb.db,GRANT_COLLECTION,user.uid,"items"),fb.limit(100)));for(const docSnap of snap.docs){if(coinState().lastGrantIds.includes(docSnap.id))continue;const data=docSnap.data();if(data.status!=="ready")continue;const amount=Math.floor(Number(data.coins)||0);if(amount){const c=coinState();const applied=amount>0?amount:-Math.min(c.balance,Math.abs(amount));c.balance=Math.max(0,c.balance+applied);if(applied>0)c.totalPurchased+=applied;else c.totalGifted+=Math.abs(applied);c.lastGrantIds.push(docSnap.id);ledger(applied>0?"purchase":"correction",applied,applied>0?`Kaufanfrage bestätigt · ${data.packId||data.reason||"JK/Coin"}`:`Owner-Korrektur · ${data.reason||"JK/Coin entfernt"}`);await fb.setDoc(docSnap.ref,{status:"claimed",claimedAtMs:Date.now(),appliedCoins:applied},{merge:true}).catch(()=>{});toast(`${applied>0?"+":""}${applied.toLocaleString("de-DE")} JK/Coin ${applied>0?"gutgeschrieben":"korrigiert"}.`);persist();updateSettingsBalance();}}}catch(error){console.warn("JK/Coin-Gutschriften",error?.message||error);}}

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
        <header class="online-mod-page-head"><div><small>JK/COIN-ZENTRALE</small><h1>Kaufanfragen & Guthaben</h1><p>Kaufanfragen manuell prüfen. Die Web-App verarbeitet keine automatische Zahlung.</p></div><div class="online-mod-page-actions"><button data-jkc-owner-refresh>↻ Aktualisieren</button></div></header>
        <section class="online-mod-metric-grid compact">
          <article><small>OFFENE ANFRAGEN</small><b>${rows.filter(r=>r.status==="pending").length}</b><span>Owner-Freigabe nötig</span></article>
          <article><small>SPIELER MIT JK/COIN</small><b>${balances.length}</b><span>Synchronisierte Konten</span></article>
          <article><small>GESAMTBESTAND</small><b>${balances.reduce((sum,p)=>sum+Number(p.jkCoinBalance||0),0).toLocaleString("de-DE")}</b><span>JK/Coin</span></article>
        </section>
        <section class="online-mod-card"><div class="online-mod-card-title"><span>◈</span><div><small>MANUELLE GUTSCHRIFT</small><h3>JK/Coins vergeben oder entfernen</h3></div></div><div class="online-mod-form-grid"><label>Ziel-UID<input data-jkc-owner-target placeholder="Firebase UID" list="jkc-owner-users"></label><datalist id="jkc-owner-users">${balances.map(p=>`<option value="${esc(p.uid)}">${esc(p.displayName||p.firstName||p.email||p.uid)} · ${Number(p.jkCoinBalance||0)} JK/Coin</option>`).join("")}</datalist><label>Betrag<input data-jkc-owner-amount type="number" min="1" value="100"></label><label class="wide">Grund<input data-jkc-owner-reason maxlength="160" placeholder="Eventgewinn, Korrektur …"></label><div class="online-mod-actions wide"><button data-jkc-owner-manual="add">Hinzufügen</button><button class="danger" data-jkc-owner-manual="remove">Entfernen</button></div></div></section>
        <section class="online-mod-card"><div class="online-mod-card-title"><span>🏦</span><div><small>KONTEN</small><h3>Aktuelle JK/Coin-Bestände</h3></div></div><div class="jkc-owner-requests">${balances.length?balances.slice(0,100).map(p=>`<article class="jkc-owner-request"><header><div><b>${esc(p.displayName||p.firstName||p.email||p.uid)}</b><small>${esc(p.uid)}</small></div><span class="approved">${Number(p.jkCoinBalance||0).toLocaleString("de-DE")}</span></header><p>Gekauft/Gutschrift: ${Number(p.jkCoinPurchased||0).toLocaleString("de-DE")} · Ausgegeben: ${Number(p.jkCoinSpent||0).toLocaleString("de-DE")}</p><div class="jkc-actions"><button class="jkc-button secondary" data-jkc-owner-select-uid="${esc(p.uid)}">Auswählen</button></div></article>`).join(""):`<p>Noch keine synchronisierten JK/Coin-Konten.</p>`}</div></section>
        <section class="online-mod-card"><div class="online-mod-card-title"><span>🧾</span><div><small>ANFRAGEN</small><h3>${rows.length} JK/Coin-Anfragen</h3></div></div><div class="jkc-owner-requests">${rows.length?rows.map(r=>`<article class="jkc-owner-request"><header><div><b>${esc(r.displayName||r.email||r.uid||"Spieler")}</b><small>${new Date(Number(r.createdAtMs||Date.now())).toLocaleString("de-DE")}</small></div><span class="${esc(r.status||"pending")}">${esc(r.status||"pending")}</span></header><p><strong>${Number(r.coins||0).toLocaleString("de-DE")} JK/Coin</strong> · ${(Number(r.eurCents||0)/100).toFixed(2).replace(".",",")} € · ${esc(r.packId||"")} · Bestand: ${Number(r.currentBalance||0).toLocaleString("de-DE")}</p>${r.status==="pending"?`<div class="jkc-actions"><button class="jkc-button" data-jkc-owner-request="approve" data-request-id="${esc(r.id)}">Bestätigen</button><button class="jkc-button danger" data-jkc-owner-request="reject" data-request-id="${esc(r.id)}">Ablehnen</button></div>`:""}</article>`).join(""):`<p>Keine Anfragen vorhanden.</p>`}</div></section>`;
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
          await fb.setDoc(fb.doc(fb.db,GRANT_COLLECTION,row.uid,"items",row.id),{status:"ready",coins:Number(row.coins||0),packId:row.packId||"",requestId:row.id,createdAtMs:Date.now(),createdByUid:context.currentUser?.uid||"owner"},{merge:true});
          await fb.setDoc(fb.doc(fb.db,PURCHASE_COLLECTION,row.id),{status:"approved",approvedAtMs:Date.now(),approvedByUid:context.currentUser?.uid||"owner",updatedAtMs:Date.now()},{merge:true});
        }else await fb.setDoc(fb.doc(fb.db,PURCHASE_COLLECTION,row.id),{status:"rejected",rejectedAtMs:Date.now(),rejectedByUid:context.currentUser?.uid||"owner",updatedAtMs:Date.now()},{merge:true});
        await renderOwnerPanel(container,context);
      }catch(error){toast(String(error?.message||error));btn.disabled=false;}
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
    document.querySelectorAll(".jk-bank-app-v58, .device-active-bank").forEach(bank=>{if(!bank.querySelector("[data-jkc-bank-panel]")){bank.insertAdjacentHTML("beforeend",bankPanelHtml());bindBank(bank);}});
  }
  function init(){coinState();installSettingsCard();const observer=new MutationObserver(()=>{installSettingsCard();decorateActiveViews();});observer.observe(document.documentElement,{childList:true,subtree:true});decorateActiveViews();window.addEventListener("lifebuilder-local-save-flushed",()=>updateSettingsBalance());setInterval(()=>syncGrants().catch(()=>{}),15000);setInterval(()=>{applyPendingGameEntitlements();syncProfileBalance();},30000);setTimeout(()=>{applyPendingGameEntitlements();syncProfileBalance();},2500);}

  window.JKCoinApp=Object.freeze({version:VERSION,html,bind,bankPanelHtml,bindBank,requestPack,coinState,currentRate,renderOwnerPanel,credit,spend,syncGrants,syncProfileBalance,applyPendingGameEntitlements,gameStore:GAME_STORE,boxes:BOXES});
  init();
})();
