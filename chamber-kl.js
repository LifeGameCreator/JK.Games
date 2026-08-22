(() => {
  "use strict";

  const VERSION = "20260822-chamber-kl-v2";
  const ROOM_COLLECTION = "chamberKlRooms";
  const COMMAND_COLLECTION = "commands";
  const MAX_HP = 4;
  const TURN_MS = 25000;
  const DEALER_KEY_PREFIX = "jkgames-chamber-kl-dealer:";
  const LOCAL_SETTLED_KEY = "jkgames-chamber-kl-settled-v2";
  const BOT_PREFIX = "chamber-bot:";
  const ITEM_DEFS = Object.freeze({
    scanner: { icon:"◉", name:"Scanner", text:"Zeigt dir geheim, ob die nächste Patrone scharf oder leer ist." },
    ejector: { icon:"↥", name:"Auswerfer", text:"Wirft die aktuelle Patrone sichtbar aus der Kammer." },
    double: { icon:"Ⅱ", name:"Doppelladung", text:"Dein nächster scharfer Treffer verursacht 2 Schaden." },
    bandage: { icon:"＋", name:"Verband", text:"Heilt 1 Leben bis maximal 4." },
    jammer: { icon:"⌁", name:"Störsender", text:"Das gewählte Ziel kann in seinem nächsten Zug keine Items einsetzen.", target:true },
    steal: { icon:"◇", name:"Diebstahl", text:"Stiehlt dem gewählten Gegner ein zufälliges Item.", target:true },
    plate: { icon:"⬡", name:"Schutzplatte", text:"Blockiert den nächsten scharfen Treffer vollständig." },
    reverse: { icon:"↻", name:"Richtungswechsel", text:"Dreht die Zugrichtung am Vierertisch um." }
  });
  const SHOTGUN_SKINS = Object.freeze({
    standard:{name:"Walnut",tier:"free",price:0,className:"standard",accent:"#b7844d"},
    ash:{name:"Ashwood",tier:"chamber",price:220,className:"ash",accent:"#a7a19a"},
    forest:{name:"Forest",tier:"chamber",price:380,className:"forest",accent:"#53775d"},
    cobalt:{name:"Cobalt",tier:"chamber",price:520,className:"cobalt",accent:"#315f9e"},
    ivory:{name:"Ivory",tier:"chamber",price:760,className:"ivory",accent:"#ded3bb"},
    carbon:{name:"Carbon",tier:"jk",price:200,className:"carbon",accent:"#5a6670"},
    redline:{name:"Redline",tier:"jk",price:200,className:"redline",accent:"#e0443c"},
    galaxy:{name:"Galaxy",tier:"jk",price:350,className:"galaxy",accent:"#8b67ff"},
    gold:{name:"Gold",tier:"jk",price:500,className:"gold",accent:"#e5bb55"},
    crystal:{name:"Crystal",tier:"jk",price:650,className:"crystal",accent:"#7cecff"},
    obsidian:{name:"Obsidian Core",tier:"jk",price:800,className:"obsidian",accent:"#ba6cff"},
    inferno:{name:"Inferno",tier:"jk",price:900,className:"inferno",accent:"#ff5b25"}
  });
  const SHELL_SKINS = Object.freeze({
    live:{
      standard:{name:"Signal Red",tier:"free",price:0,color:"#a92b25",metal:"#c99c55"},
      ember:{name:"Ember",tier:"chamber",price:180,color:"#e25b24",metal:"#b9783f"},
      toxic:{name:"Toxic",tier:"chamber",price:360,color:"#68a33c",metal:"#9b8d51"},
      plasma:{name:"Plasma",tier:"jk",price:180,color:"#ff3b9d",metal:"#7bf4ff"},
      royal:{name:"Royal",tier:"jk",price:240,color:"#562b9d",metal:"#e9c868"},
      void:{name:"Void",tier:"jk",price:320,color:"#17151d",metal:"#a47cff"}
    },
    blank:{
      standard:{name:"Midnight",tier:"free",price:0,color:"#11181d",metal:"#b08a51"},
      slate:{name:"Slate",tier:"chamber",price:180,color:"#4b5962",metal:"#7d8588"},
      frost:{name:"Frost",tier:"chamber",price:360,color:"#d9eef0",metal:"#7aa5b8"},
      neon:{name:"Neon",tier:"jk",price:180,color:"#10333a",metal:"#67fff2"},
      eclipse:{name:"Eclipse",tier:"jk",price:240,color:"#251832",metal:"#ff7ac9"},
      phantom:{name:"Phantom",tier:"jk",price:320,color:"#dfe8ef",metal:"#8edfff"}
    }
  });
  const ITEM_SKINS = Object.freeze({
    standard:{name:"Field Kit",tier:"free",price:0,className:"standard"},
    military:{name:"Military",tier:"chamber",price:300,className:"military"},
    noir:{name:"Noir",tier:"chamber",price:520,className:"noir"},
    arcade:{name:"Arcade",tier:"chamber",price:760,className:"arcade"},
    holo:{name:"Hologram",tier:"jk",price:280,className:"holo"},
    royal:{name:"Royal Vault",tier:"jk",price:420,className:"royal"},
    singularity:{name:"Singularity",tier:"jk",price:650,className:"singularity"}
  });
  const BOT_DIFFICULTIES = Object.freeze({
    easy:{name:"Leicht",xp:80,coins:30,think:[1100,1900]},
    medium:{name:"Mittel",xp:140,coins:55,think:[800,1500]},
    hard:{name:"Schwer",xp:220,coins:90,think:[500,1050]}
  });
  const SKINS = SHOTGUN_SKINS;

  const UI = {
    overlay:null,
    shell:null,
    phoneItem:"",
    roomId:"",
    room:null,
    roomUnsub:null,
    commandUnsub:null,
    ownCommandUnsubs:new Map(),
    hostQueue:Promise.resolve(),
    view:"home",
    selectedTarget:"",
    lastEventId:"",
    toastTimer:0,
    ticker:0,
    lobbyBusy:false,
    actionBusy:false,
    publicRooms:[],
    publicLoading:false,
    lastRoomSignature:"",
    lastCommandResult:"",
    botTimer:0,
    botBusy:false,
    sceneMounted:false,
    selectedInventoryTab:"shotgun",
    tutorialPage:0
  };

  function esc(value){return String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]));}
  function clamp(value,min,max){return Math.max(min,Math.min(max,Number(value)||0));}
  function now(){return Date.now();}
  function randomInt(max){
    const n=Math.max(1,Math.floor(max||1));
    try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n;}catch{return Math.floor(Math.random()*n);}
  }
  function shuffle(input){const a=[...input];for(let i=a.length-1;i>0;i--){const j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
  function randomRoomId(){const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let out="";for(let i=0;i<6;i++)out+=chars[randomInt(chars.length)];return out;}
  function rootState(){return window.JKGamesGetActiveState?.() || null;}
  function chamberState(){
    const root=rootState();
    if(!root)return null;
    root.chamberKL ||= {};
    const s=root.chamberKL;
    s.coins=Math.max(0,Math.floor(Number(s.coins)||0));
    s.level=Math.max(1,Math.floor(Number(s.level)||1));
    s.xp=Math.max(0,Math.floor(Number(s.xp)||0));
    s.ownedSkins=Array.isArray(s.ownedSkins)?[...new Set(["standard",...s.ownedSkins.filter(id=>SHOTGUN_SKINS[id])])]:["standard"];
    s.equippedSkin=s.ownedSkins.includes(s.equippedSkin)?s.equippedSkin:"standard";
    s.cosmetics ||= {};
    s.cosmetics.ownedLiveShells=Array.isArray(s.cosmetics.ownedLiveShells)?[...new Set(["standard",...s.cosmetics.ownedLiveShells.filter(id=>SHELL_SKINS.live[id])])]:["standard"];
    s.cosmetics.ownedBlankShells=Array.isArray(s.cosmetics.ownedBlankShells)?[...new Set(["standard",...s.cosmetics.ownedBlankShells.filter(id=>SHELL_SKINS.blank[id])])]:["standard"];
    s.cosmetics.ownedItemSkins=Array.isArray(s.cosmetics.ownedItemSkins)?[...new Set(["standard",...s.cosmetics.ownedItemSkins.filter(id=>ITEM_SKINS[id])])]:["standard"];
    s.cosmetics.liveShell=s.cosmetics.ownedLiveShells.includes(s.cosmetics.liveShell)?s.cosmetics.liveShell:"standard";
    s.cosmetics.blankShell=s.cosmetics.ownedBlankShells.includes(s.cosmetics.blankShell)?s.cosmetics.blankShell:"standard";
    s.cosmetics.itemSkin=s.cosmetics.ownedItemSkins.includes(s.cosmetics.itemSkin)?s.cosmetics.itemSkin:"standard";
    s.stats ||= {matches:0,wins:0,shots:0,liveShots:0,blankShots:0,itemsUsed:0,eliminations:0,fourTableWins:0,botWins:0,hardBotWins:0};
    for(const key of ["matches","wins","shots","liveShots","blankShots","itemsUsed","eliminations","fourTableWins","botWins","hardBotWins"])s.stats[key]=Math.max(0,Math.floor(Number(s.stats[key])||0));
    s.tutorialSeen=!!s.tutorialSeen;
    return s;
  }
  function persist(){try{window.JKGamesPersistState?.();}catch(error){console.warn("Chamber.KL speichern",error);}}
  function xpNeeded(level){return 180+Math.max(0,Number(level||1)-1)*85;}
  function grantChamberRewards(xp=0,coins=0){const s=chamberState();if(!s)return; s.xp+=Math.max(0,Math.round(xp));s.coins+=Math.max(0,Math.round(coins));while(s.level<100&&s.xp>=xpNeeded(s.level)){s.xp-=xpNeeded(s.level);s.level++;toast(`Chamber-Level ${s.level} erreicht.`,"good");}persist();}
  function isOwner(){try{return !!(window.LifeBuilderSettingsMenu?.isOwner?.()||window.LifeBuilderSettingsMenu?.getRole?.()?.role==="owner");}catch{return false;}}
  function isBotUid(uid){return String(uid||"").startsWith(BOT_PREFIX);}
  function currentSkin(){return chamberState()?.equippedSkin||"standard";}
  function profileFromState(uid){
    const root=rootState()||{};const appearance=root.appearance||{};const s=chamberState()||{};
    const full=`${root.firstName||"Spieler"} ${root.lastName||""}`.trim().replace(/\s+/g," ").slice(0,60)||"Spieler";
    const hair=String(appearance.hairColor||appearance.hair||"#3b2b24").slice(0,24);
    const skin=String(appearance.skinColor||appearance.skinTone||"#d6a77f").slice(0,24);
    return {uid,name:full,gender:root.gender==="female"?"female":"male",hairColor:hair,skinColor:skin,shotgunSkin:currentSkin(),liveShellSkin:s.cosmetics?.liveShell||"standard",blankShellSkin:s.cosmetics?.blankShell||"standard",itemSkin:s.cosmetics?.itemSkin||"standard",seat:0,isBot:false,botDifficulty:""};
  }
  function botProfile(uid,difficulty="easy",seat=1){const names={easy:["Milo","Nora","Ben","Lia"],medium:["Vega","Mara","Jax","Noah"],hard:["Nyx","Rook","Iris","Kane"]};const pool=names[difficulty]||names.easy;return {uid,name:`${pool[randomInt(pool.length)]} · BOT`,gender:randomInt(2)?"male":"female",hairColor:["#1e1b19","#402b21","#c3aa78","#6d4133"][randomInt(4)],skinColor:["#d6a77f","#b87c5d","#8e5c45","#efd0ad"][randomInt(4)],shotgunSkin:difficulty==="hard"?"redline":difficulty==="medium"?"cobalt":"standard",liveShellSkin:"standard",blankShellSkin:"standard",itemSkin:difficulty==="hard"?"noir":"standard",seat,isBot:true,botDifficulty:difficulty};}

  async function firebase(){
    const core=window.LifeBuilderFirebaseCore;
    if(!core?.load)throw new Error("Firebase ist noch nicht bereit.");
    const fb=await core.load();
    let user=fb.auth?.currentUser||null;
    if(!user&&core.waitForAuth)user=await core.waitForAuth(7000);
    if(!user)throw new Error("Melde dich zuerst bei JK.Games an.");
    return {fb,user};
  }
  function roomRef(fb,roomId=UI.roomId){return fb.doc(fb.db,ROOM_COLLECTION,String(roomId||""));}
  function commandRef(fb,roomId,id){return fb.doc(fb.db,ROOM_COLLECTION,roomId,COMMAND_COLLECTION,id);}
  function isHost(room=UI.room,uid=""){const authUid=uid||window.LifeBuilderFirebaseCore?.getRuntime?.()?.auth?.currentUser?.uid||"";return !!room&&room.hostUid===authUid;}
  function isParticipant(room=UI.room,uid=""){const authUid=uid||window.LifeBuilderFirebaseCore?.getRuntime?.()?.auth?.currentUser?.uid||"";return !!room&&Array.isArray(room.playerUids)&&room.playerUids.includes(authUid);}
  function ownUid(){return window.LifeBuilderFirebaseCore?.getRuntime?.()?.auth?.currentUser?.uid||"";}
  function aliveUids(room=UI.room){return (room?.turnOrder||room?.playerUids||[]).filter(uid=>Number(room?.hp?.[uid]||0)>0);}
  function roomPlayer(room,uid){return room?.profiles?.[uid]||{uid,name:"Spieler",gender:"male",shotgunSkin:"standard"};}

  function toast(text,tone=""){
    if(!UI.overlay)return;
    let node=UI.overlay.querySelector("[data-chkl-toast]");
    if(!node){node=document.createElement("div");node.className="chkl-toast";node.dataset.chklToast="1";UI.overlay.append(node);}
    node.textContent=String(text||"");node.dataset.tone=tone;
    clearTimeout(UI.toastTimer);requestAnimationFrame(()=>node.classList.add("show"));UI.toastTimer=setTimeout(()=>node.classList.remove("show"),2600);
  }
  function setBusy(value){UI.actionBusy=!!value;UI.overlay?.classList.toggle("chkl-busy",!!value);}

  function renderBase(){
    if(!UI.overlay)return;
    UI.overlay.innerHTML=`<div class="chkl-shell" data-chkl-shell></div><div class="chkl-toast" data-chkl-toast></div>`;
    UI.shell=UI.overlay.querySelector("[data-chkl-shell]");
  }
  function topbar(subtitle="TOP GAME"){
    return `<header class="chkl-topbar"><div><small>JK.GAMES · ${esc(subtitle)}</small><h1>CHAMBER<span>.KL</span></h1></div><div class="chkl-top-actions"><button type="button" data-chkl-jk aria-label="JK/Coin öffnen">JK</button><button type="button" data-chkl-exit aria-label="Chamber.KL schließen">×</button></div></header>`;
  }
  function bindTopbar(){
    UI.shell?.querySelector("[data-chkl-exit]")?.addEventListener("click",requestClose);
    UI.shell?.querySelector("[data-chkl-jk]")?.addEventListener("click",()=>window.JKCoinApp?.openForGame?.("chamber"));
  }
  function renderLoading(){
    UI.view="loading";
    UI.shell.innerHTML=`<main class="chkl-loading"><div class="chkl-loading-orbit"><div class="chkl-shotgun skin-standard"><i class="chkl-stock"></i><i class="chkl-body"></i><i class="chkl-barrel"></i></div><span class="chkl-load-shell live"></span><span class="chkl-load-shell blank"></span><span class="chkl-load-shell live"></span><span class="chkl-load-shell blank"></span></div><small>JK.GAMES · TOP GAME</small><h1>CHAMBER.KL</h1><p>Tisch, Kammer und Online-Dealer werden vorbereitet …</p><div class="chkl-loading-bar"><i></i></div></main>`;
    setTimeout(()=>{if(UI.view==="loading")renderHome();},900);
  }
  function statsHtml(){
    const s=chamberState();if(!s)return"";const need=xpNeeded(s.level);const pct=clamp((s.xp/Math.max(1,need))*100,0,100);
    return `<div class="chkl-stats-strip v2"><span><small>CHAMBER LEVEL</small><b>${s.level}</b><em><i style="width:${pct}%"></i></em></span><span><small>CHAMBER COINS</small><b>◈ ${s.coins.toLocaleString("de-DE")}</b></span><span><small>SIEGE</small><b>${s.stats.wins}</b></span><span><small>ELIM.</small><b>${s.stats.eliminations}</b></span></div>`;
  }
  function currencyLabel(meta){return meta.tier==="jk"?`${meta.price} JK/Coin`:meta.tier==="chamber"?`${meta.price} Chamber-Coins`:"Inklusive";}
  function renderHome(){
    UI.view="home";UI.roomId="";UI.room=null;stopRoomListeners();destroyScene();
    const skin=SHOTGUN_SKINS[currentSkin()]||SHOTGUN_SKINS.standard;const s=chamberState();
    UI.shell.innerHTML=`${topbar("THE TABLE · V2")}
      <main class="chkl-home chkl-home-v2">
        <section class="chkl-v2-hero">
          <div class="chkl-v2-hero-noise"></div><div class="chkl-v2-hero-copy"><small>JK.GAMES ORIGINAL · 1–4 SITZPLÄTZE</small><h2>Ein Tisch.<br><span>Eine unbekannte Kammer.</span></h2><p>Online gegen echte Spieler oder allein gegen bis zu drei Bots. Jede Entscheidung wird live synchronisiert, jede Patrone verändert den Tisch.</p><div class="chkl-hero-actions"><button class="primary" data-chkl-bot>GEGEN BOT SPIELEN</button><button data-chkl-quick>ONLINE-DUELL</button><button data-chkl-public>RÄUME</button></div></div>
          <div class="chkl-v2-hero-visual"><div class="chkl-hero-chair far"></div><div class="chkl-hero-silhouette"><i></i><b></b></div><div class="chkl-hero-table"></div><div class="chkl-shotgun skin-${skin.className}"><i class="chkl-stock"></i><i class="chkl-body"></i><i class="chkl-barrel"></i><i class="chkl-trigger"></i></div><div class="chkl-hero-light"></div></div>
        </section>
        ${statsHtml()}
        <section class="chkl-v2-dashboard">
          <article class="chkl-launch-card"><small>EIGENER TISCH</small><h3>Match konfigurieren</h3><div class="chkl-config-grid"><label>Plätze<select data-chkl-size><option value="2">2 Plätze</option><option value="3">3 Plätze</option><option value="4">4 Plätze</option></select></label><label>Bots<select data-chkl-bots><option value="0">Keine</option><option value="1">1 Bot</option><option value="2">2 Bots</option><option value="3">3 Bots</option></select></label><label>Bot-Stärke<select data-chkl-bot-diff><option value="easy">Leicht</option><option value="medium">Mittel</option><option value="hard">Schwer</option></select></label></div><div class="chkl-card-actions"><button data-chkl-create-public>Öffentlich</button><button data-chkl-create-private>Privat</button></div></article>
          <article><small>PRIVATE LOBBY</small><h3>Code beitreten</h3><p>Sechs Zeichen genügen. Private Räume erscheinen nie in der öffentlichen Liste.</p><div class="chkl-code-row"><input maxlength="6" data-chkl-code placeholder="ABC234" autocomplete="off"><button data-chkl-join-code>Beitreten</button></div></article>
          <article><small>LOADOUT</small><h3>Skin-Inventar</h3><p>Shotgun, scharfe Patronen, leere Patronen und komplette Item-Sets getrennt ausrüsten.</p><div class="chkl-loadout-mini"><span class="gun skin-${skin.className}"></span><span class="shell live"></span><span class="shell blank"></span><span class="kit">◉</span></div><button data-chkl-skins>Inventar & Shop</button></article>
          <article><small>TUTORIAL</small><h3>Den Tisch verstehen</h3><p>Patronen, Selbstschuss, Items, Bots, Chamber-Coins, XP und Multiplayer Schritt für Schritt erklärt.</p><button data-chkl-rules>Tutorial starten</button></article>
          ${isOwner()?`<article class="owner"><small>OWNER ONLY</small><h3>Chamber Control</h3><p>Alle Cosmetics, Preise und Freischaltungen prüfen und dir zum Testen direkt geben.</p><button data-chkl-owner>Owner Mod-Menü</button></article>`:""}
        </section>
      </main>`;
    bindTopbar();
    const size=()=>clamp(Number(UI.shell.querySelector("[data-chkl-size]")?.value)||2,2,4);const bots=()=>clamp(Number(UI.shell.querySelector("[data-chkl-bots]")?.value)||0,0,3);const diff=()=>String(UI.shell.querySelector("[data-chkl-bot-diff]")?.value||"easy");
    UI.shell.querySelector("[data-chkl-quick]")?.addEventListener("click",quickDuel);UI.shell.querySelector("[data-chkl-bot]")?.addEventListener("click",()=>createRoom("private",2,{bots:1,difficulty:"medium",autoStart:true}));UI.shell.querySelector("[data-chkl-public]")?.addEventListener("click",showPublicRooms);
    UI.shell.querySelector("[data-chkl-create-public]")?.addEventListener("click",()=>createRoom("public",size(),{bots:Math.min(bots(),size()-1),difficulty:diff()}));UI.shell.querySelector("[data-chkl-create-private]")?.addEventListener("click",()=>createRoom("private",size(),{bots:Math.min(bots(),size()-1),difficulty:diff()}));
    UI.shell.querySelector("[data-chkl-join-code]")?.addEventListener("click",()=>joinByCode(UI.shell.querySelector("[data-chkl-code]")?.value));UI.shell.querySelector("[data-chkl-code]")?.addEventListener("input",e=>e.target.value=e.target.value.toUpperCase().replace(/[^A-Z2-9]/g,"").slice(0,6));UI.shell.querySelector("[data-chkl-code]")?.addEventListener("keydown",e=>{if(e.key==="Enter")joinByCode(e.target.value);});
    UI.shell.querySelector("[data-chkl-skins]")?.addEventListener("click",renderSkins);UI.shell.querySelector("[data-chkl-rules]")?.addEventListener("click",()=>renderTutorial(0));UI.shell.querySelector("[data-chkl-owner]")?.addEventListener("click",renderOwnerMenu);
  }
  const TUTORIAL_PAGES=[
    {k:"01",title:"Das Prinzip",text:"Zu Beginn siehst du nur, wie viele scharfe und leere Patronen geladen werden. Ihre Reihenfolge bleibt verborgen. Reduziere alle Gegner auf 0 Leben und bleib als Letzter am Tisch.",tips:["Scharf = Schaden","Leer = kein Schaden","4 Leben pro Spieler"]},
    {k:"02",title:"Dein Zug",text:"Wähle einen lebenden Spieler oder dich selbst als Ziel. Schießt du auf dich und die Patrone ist leer, bleibst du am Zug. Bei einem scharfen Selbsttreffer oder jedem Schuss auf einen Gegner wechselt der Zug.",tips:["25 Sekunden pro Zug","Ziel durch Klick auf Spieler wählen","Leerer Selbstschuss kann Tempo geben"]},
    {k:"03",title:"Special Items",text:"Nach neuen Kammern erhältst du zusätzliche Items. Scanner, Auswerfer, Doppelladung, Verband, Störsender, Diebstahl, Schutzplatte und Richtungswechsel erzeugen taktische Kombinationen.",tips:["Scanner-Ergebnis sieht nur der Nutzer","Schutzplatte stoppt einen Treffer","Items sind nicht Teil des LifeBuilder-Inventars"]},
    {k:"04",title:"Bots",text:"Du kannst mit einem bis drei Bots spielen. Leichte Bots handeln ungenau, mittlere Bots nutzen sichtbare Wahrscheinlichkeiten und schwere Bots kombinieren Items aggressiver. Sie lesen die geheime Reihenfolge nicht einfach aus.",tips:["Leicht: +80 Chamber-XP Bonus","Mittel: +140 Chamber-XP Bonus","Schwer: +220 Chamber-XP Bonus"]},
    {k:"05",title:"Belohnungen",text:"Matches geben Chamber-XP und Chamber-Coins. Siege geben mehr. Ein Sieg gibt zusätzlich 100 XP an deinen normalen JK.Games-Hauptcharakter. Cosmetics sind rein optisch und niemals Pay-to-Win.",tips:["Chamber-Coins durch Spielen","JK/Coin = Premium-Cosmetics","Level bis 100"]},
    {k:"06",title:"Online & Firebase",text:"Räume, sichtbare Tischdaten und Aktionen werden über Firebase synchronisiert. Gäste senden Aktionen an den Host-Dealer. Die noch unbekannte Patronenreihenfolge steht nicht als lesbares Feld im Match-Dokument.",tips:["Öffentliche und private Räume","6-stelliger Raumcode","Reconnect über denselben Raumzustand"]}
  ];
  function renderRules(){renderTutorial(0);}
  function renderTutorial(page=0){UI.view="tutorial";UI.tutorialPage=clamp(page,0,TUTORIAL_PAGES.length-1);const t=TUTORIAL_PAGES[UI.tutorialPage];UI.shell.innerHTML=`${topbar("TUTORIAL")}<main class="chkl-page chkl-tutorial"><button class="chkl-back" data-chkl-back>← Zurück</button><section class="chkl-tutorial-card"><aside><small>KAPITEL ${t.k}</small><div class="chkl-tutorial-progress">${TUTORIAL_PAGES.map((_,i)=>`<i class="${i<=UI.tutorialPage?"on":""}"></i>`).join("")}</div><b>${UI.tutorialPage+1}/${TUTORIAL_PAGES.length}</b></aside><div><small>CHAMBER.KL ACADEMY</small><h2>${esc(t.title)}</h2><p>${esc(t.text)}</p><ul>${t.tips.map(x=>`<li>${esc(x)}</li>`).join("")}</ul><div class="chkl-card-actions"><button data-chkl-prev ${UI.tutorialPage===0?"disabled":""}>Zurück</button><button class="primary" data-chkl-next>${UI.tutorialPage===TUTORIAL_PAGES.length-1?"Tutorial abschließen":"Weiter"}</button></div></div></section></main>`;bindTopbar();UI.shell.querySelector("[data-chkl-back]")?.addEventListener("click",renderHome);UI.shell.querySelector("[data-chkl-prev]")?.addEventListener("click",()=>renderTutorial(UI.tutorialPage-1));UI.shell.querySelector("[data-chkl-next]")?.addEventListener("click",()=>{if(UI.tutorialPage>=TUTORIAL_PAGES.length-1){const s=chamberState();if(s){s.tutorialSeen=true;persist();}renderHome();}else renderTutorial(UI.tutorialPage+1);});}
  function ownedFor(kind,id,s=chamberState()){if(!s)return false;if(kind==="shotgun")return s.ownedSkins.includes(id);if(kind==="live")return s.cosmetics.ownedLiveShells.includes(id);if(kind==="blank")return s.cosmetics.ownedBlankShells.includes(id);if(kind==="items")return s.cosmetics.ownedItemSkins.includes(id);return false;}
  function equippedFor(kind,s=chamberState()){if(kind==="shotgun")return s?.equippedSkin||"standard";if(kind==="live")return s?.cosmetics?.liveShell||"standard";if(kind==="blank")return s?.cosmetics?.blankShell||"standard";return s?.cosmetics?.itemSkin||"standard";}
  function grantCosmetic(kind,id){const s=chamberState();if(!s)return false;if(kind==="shotgun"&&SHOTGUN_SKINS[id]){if(!s.ownedSkins.includes(id))s.ownedSkins.push(id);return true;}if(kind==="live"&&SHELL_SKINS.live[id]){if(!s.cosmetics.ownedLiveShells.includes(id))s.cosmetics.ownedLiveShells.push(id);return true;}if(kind==="blank"&&SHELL_SKINS.blank[id]){if(!s.cosmetics.ownedBlankShells.includes(id))s.cosmetics.ownedBlankShells.push(id);return true;}if(kind==="items"&&ITEM_SKINS[id]){if(!s.cosmetics.ownedItemSkins.includes(id))s.cosmetics.ownedItemSkins.push(id);return true;}return false;}
  function equipCosmetic(kind,id){const s=chamberState();if(!ownedFor(kind,id,s))return false;if(kind==="shotgun")s.equippedSkin=id;else if(kind==="live")s.cosmetics.liveShell=id;else if(kind==="blank")s.cosmetics.blankShell=id;else s.cosmetics.itemSkin=id;persist();return true;}
  function catalogFor(kind){return kind==="shotgun"?SHOTGUN_SKINS:kind==="live"?SHELL_SKINS.live:kind==="blank"?SHELL_SKINS.blank:ITEM_SKINS;}
  function previewCosmetic(kind,id,meta){if(kind==="shotgun")return `<div class="chkl-shotgun skin-${meta.className}"><i class="chkl-stock"></i><i class="chkl-body"></i><i class="chkl-barrel"></i><i class="chkl-trigger"></i></div>`;if(kind==="live"||kind==="blank")return `<div class="chkl-big-shell ${kind}" style="--shell:${meta.color};--metal:${meta.metal}"><i></i></div>`;return `<div class="chkl-item-set-preview skin-${meta.className}">${Object.values(ITEM_DEFS).slice(0,4).map(x=>`<i>${x.icon}</i>`).join("")}</div>`;}
  function renderSkins(tab=UI.selectedInventoryTab||"shotgun"){UI.view="skins";UI.selectedInventoryTab=tab;const s=chamberState();const catalog=catalogFor(tab);const label={shotgun:"Shotgun",live:"Scharfe Patronen",blank:"Leere Patronen",items:"Special Items"}[tab];UI.shell.innerHTML=`${topbar("LOADOUT & SKINS")}<main class="chkl-page chkl-inventory"><button class="chkl-back" data-chkl-back>← Zurück</button><section class="chkl-inventory-head"><div><small>CHAMBER ARMORY</small><h2>${label}</h2><p>Chamber-Coins erspielst du. JK/Coin-Cosmetics sind Premium und bleiben trotzdem rein kosmetisch.</p></div><div class="chkl-wallet"><span><small>CHAMBER</small><b>◈ ${s.coins.toLocaleString("de-DE")}</b></span><span><small>LEVEL</small><b>${s.level}</b></span></div></section><nav class="chkl-inventory-tabs">${[["shotgun","Shotgun"],["live","Scharf"],["blank","Leer"],["items","Items"]].map(([id,n])=>`<button class="${tab===id?"active":""}" data-chkl-tab="${id}">${n}</button>`).join("")}</nav><div class="chkl-cosmetic-grid">${Object.entries(catalog).map(([id,meta])=>{const owned=ownedFor(tab,id,s),active=equippedFor(tab,s)===id;return `<article class="${active?"active":""} tier-${meta.tier}">${previewCosmetic(tab,id,meta)}<div class="chkl-cosmetic-copy"><small>${meta.tier==="jk"?"JK/COIN PREMIUM":meta.tier==="chamber"?"CHAMBER REWARD":"STANDARD"}</small><h3>${esc(meta.name)}</h3><span>${currencyLabel(meta)}</span></div>${owned?`<button data-chkl-equip-kind="${tab}" data-chkl-equip-id="${id}" ${active?"disabled":""}>${active?"Ausgerüstet":"Ausrüsten"}</button>`:meta.tier==="chamber"?`<button data-chkl-buy-cc="${tab}:${id}">Für ${meta.price} ◈ kaufen</button>`:`<button data-chkl-open-jk="${tab}:${id}">JK/Coin-Shop</button>`}</article>`;}).join("")}</div></main>`;bindTopbar();UI.shell.querySelector("[data-chkl-back]")?.addEventListener("click",renderHome);UI.shell.querySelectorAll("[data-chkl-tab]").forEach(b=>b.addEventListener("click",()=>renderSkins(b.dataset.chklTab)));UI.shell.querySelectorAll("[data-chkl-equip-kind]").forEach(b=>b.addEventListener("click",()=>{equipCosmetic(b.dataset.chklEquipKind,b.dataset.chklEquipId);renderSkins(tab);}));UI.shell.querySelectorAll("[data-chkl-buy-cc]").forEach(b=>b.addEventListener("click",()=>{const [kind,id]=b.dataset.chklBuyCc.split(":");const meta=catalogFor(kind)[id];if(!meta||meta.tier!=="chamber")return;if(s.coins<meta.price)return toast(`Dir fehlen ${meta.price-s.coins} Chamber-Coins.`,"error");s.coins-=meta.price;grantCosmetic(kind,id);persist();toast(`${meta.name} freigeschaltet.`,"good");renderSkins(tab);}));UI.shell.querySelectorAll("[data-chkl-open-jk]").forEach(b=>b.addEventListener("click",()=>window.JKCoinApp?.openForGame?.("chamber")));}
  function renderOwnerMenu(){if(!isOwner())return renderHome();UI.view="owner";const groups=[["shotgun","SHOTGUN",SHOTGUN_SKINS],["live","SCHARFE PATRONEN",SHELL_SKINS.live],["blank","LEERE PATRONEN",SHELL_SKINS.blank],["items","SPECIAL ITEMS",ITEM_SKINS]];UI.shell.innerHTML=`${topbar("OWNER CONTROL")}<main class="chkl-page chkl-owner-page"><button class="chkl-back" data-chkl-back>← Zurück</button><section class="chkl-page-head"><small>OWNER ONLY · TESTWERKZEUG</small><h2>Chamber Control</h2><p>Alle V2-Cosmetics, Preise und Währungen. Freischalten wirkt nur auf deinen aktiven JK.Games-Spielstand.</p></section><div class="chkl-owner-actions"><button data-owner-coins="1000">+1.000 Chamber-Coins</button><button data-owner-xp="500">+500 Chamber-XP</button></div>${groups.map(([kind,title,cat])=>`<section class="chkl-owner-group"><h3>${title}</h3><div>${Object.entries(cat).map(([id,m])=>`<article>${previewCosmetic(kind,id,m)}<span><b>${esc(m.name)}</b><small>${currencyLabel(m)}</small></span><button data-owner-grant="${kind}:${id}">${ownedFor(kind,id)?"Besitzt":"Geben"}</button></article>`).join("")}</div></section>`).join("")}</main>`;bindTopbar();UI.shell.querySelector("[data-chkl-back]")?.addEventListener("click",renderHome);UI.shell.querySelectorAll("[data-owner-grant]").forEach(b=>b.addEventListener("click",()=>{const [kind,id]=b.dataset.ownerGrant.split(":");grantCosmetic(kind,id);persist();renderOwnerMenu();}));UI.shell.querySelector("[data-owner-coins]")?.addEventListener("click",()=>{grantChamberRewards(0,1000);renderOwnerMenu();});UI.shell.querySelector("[data-owner-xp]")?.addEventListener("click",()=>{grantChamberRewards(500,0);renderOwnerMenu();});}

  async function uniqueRoomId(fb){for(let i=0;i<12;i++){const id=randomRoomId();const snap=await fb.getDoc(roomRef(fb,id));if(!snap.exists())return id;}throw new Error("Kein freier Raumcode gefunden.");}
  function emptyRoom(id,hostUid,profile,visibility,maxPlayers){
    return {roomId:id,hostUid,visibility,maxPlayers,currentPlayers:1,playerUids:[hostUid],profiles:{[hostUid]:{...profile,seat:0}},status:"waiting",phase:"waiting",round:0,turnOrder:[],activeUid:"",turnStartedAtMs:0,direction:1,hp:{},items:{},effects:{},shellLive:0,shellBlank:0,shellTotal:0,eventSeq:0,lastEvent:{id:"",type:"waiting",actorUid:"",targetUid:"",itemId:"",shell:"",damage:0,text:"Warteraum geöffnet",atMs:now()},winnerUid:"",winnerName:"",dealerEpoch:0,createdAtMs:now(),updatedAtMs:now(),version:VERSION};
  }
  async function createRoom(visibility="public",maxPlayers=2,options={}){
    if(UI.lobbyBusy)return;UI.lobbyBusy=true;setBusy(true);
    try{
      const {fb,user}=await firebase();const id=await uniqueRoomId(fb);const size=clamp(Math.floor(maxPlayers),2,4);const data=emptyRoom(id,user.uid,profileFromState(user.uid),visibility,size);await fb.setDoc(roomRef(fb,id),data);
      const count=clamp(Number(options.bots||0),0,size-1);if(count){const uids=[user.uid],profiles={...data.profiles};for(let i=0;i<count;i++){const botUid=`${BOT_PREFIX}${id}:${i}:${randomInt(9999)}`;uids.push(botUid);profiles[botUid]=botProfile(botUid,String(options.difficulty||"easy"),uids.length-1);}await fb.updateDoc(roomRef(fb,id),{playerUids:uids,profiles,currentPlayers:uids.length,updatedAtMs:now()});}
      openRoom(id);if(options.autoStart)autoStartWhenReady(id);
    }catch(error){toast(error.message||error,"error");}finally{UI.lobbyBusy=false;setBusy(false);}
  }
  function autoStartWhenReady(roomId,attempt=0){if(UI.roomId!==roomId)return;if(UI.room?.status==="waiting"&&Number(UI.room.currentPlayers||0)>=2){startMatch().catch(()=>{});return;}if(attempt<10)setTimeout(()=>autoStartWhenReady(roomId,attempt+1),300);}
  async function addBotToLobby(difficulty="easy"){
    const room=UI.room;if(!room||!isHost(room)||room.status!=="waiting"||room.currentPlayers>=room.maxPlayers)return false;setBusy(true);try{const {fb}=await firebase();const uid=`${BOT_PREFIX}${room.roomId}:${now()}:${randomInt(9999)}`;const uids=[...(room.playerUids||[]),uid],profiles={...(room.profiles||{}),[uid]:botProfile(uid,difficulty,uids.length-1)};await fb.updateDoc(roomRef(fb,room.roomId),{playerUids:uids,profiles,currentPlayers:uids.length,updatedAtMs:now()});return true;}catch(error){toast(error.message||error,"error");return false;}finally{setBusy(false);}
  }
  async function removeBotFromLobby(uid){const room=UI.room;if(!room||!isHost(room)||!isBotUid(uid)||room.status!=="waiting")return false;setBusy(true);try{const {fb}=await firebase();const uids=(room.playerUids||[]).filter(x=>x!==uid),profiles={...(room.profiles||{})};delete profiles[uid];uids.forEach((id,i)=>{if(profiles[id])profiles[id].seat=i;});await fb.updateDoc(roomRef(fb,room.roomId),{playerUids:uids,profiles,currentPlayers:uids.length,updatedAtMs:now()});return true;}catch(error){toast(error.message||error,"error");return false;}finally{setBusy(false);}}
  async function quickDuel(){
    if(UI.lobbyBusy)return;UI.lobbyBusy=true;setBusy(true);
    try{
      const {fb,user}=await firebase();
      const q=fb.query(fb.collection(fb.db,ROOM_COLLECTION),fb.where("visibility","==","public"),fb.where("status","==","waiting"),fb.where("maxPlayers","==",2),fb.limit(12));
      const snaps=await fb.getDocs(q);
      const candidate=snaps.docs.map(d=>d.data()).find(r=>Array.isArray(r.playerUids)&&!r.playerUids.includes(user.uid)&&Number(r.currentPlayers||0)<2);
      if(candidate){await joinRoom(candidate.roomId);return;}
      const id=await uniqueRoomId(fb);await fb.setDoc(roomRef(fb,id),emptyRoom(id,user.uid,profileFromState(user.uid),"public",2));openRoom(id);
    }catch(error){toast(error.message||error,"error");}finally{UI.lobbyBusy=false;setBusy(false);}
  }
  async function joinByCode(raw){const id=String(raw||"").trim().toUpperCase();if(!/^[A-Z2-9]{6}$/.test(id))return toast("Bitte einen gültigen sechsstelligen Code eingeben.","error");joinRoom(id);}
  async function joinRoom(roomId){
    if(UI.lobbyBusy)return;UI.lobbyBusy=true;setBusy(true);
    try{
      const {fb,user}=await firebase();const ref=roomRef(fb,roomId);const profile=profileFromState(user.uid);
      await fb.runTransaction(fb.db,async tx=>{
        const snap=await tx.get(ref);if(!snap.exists())throw new Error("Dieser Raum existiert nicht mehr.");
        const room=snap.data();if(room.status!=="waiting")throw new Error("Dieses Match läuft bereits.");
        if(room.playerUids?.includes(user.uid))return;
        if(Number(room.currentPlayers||0)>=Number(room.maxPlayers||2))throw new Error("Der Tisch ist bereits voll.");
        const uids=[...(room.playerUids||[]),user.uid];const profiles={...(room.profiles||{}),[user.uid]:{...profile,seat:uids.length-1}};
        tx.update(ref,{playerUids:uids,profiles,currentPlayers:uids.length,updatedAtMs:now()});
      });
      openRoom(roomId);
    }catch(error){toast(error.message||error,"error");}finally{UI.lobbyBusy=false;setBusy(false);}
  }
  async function showPublicRooms(){
    UI.view="public";UI.publicLoading=true;
    UI.shell.innerHTML=`${topbar("ÖFFENTLICHE RÄUME")}<main class="chkl-page"><button class="chkl-back" data-chkl-back>← Zurück</button><section class="chkl-page-head"><small>LIVE FIRESTORE</small><h2>Offene Tische</h2><p>Es werden nur öffentliche Chamber.KL-Warteräume angezeigt.</p></section><div class="chkl-room-list" data-chkl-room-list><div class="chkl-empty">Räume werden geladen …</div></div></main>`;
    bindTopbar();UI.shell.querySelector("[data-chkl-back]")?.addEventListener("click",renderHome);
    try{const {fb,user}=await firebase();const q=fb.query(fb.collection(fb.db,ROOM_COLLECTION),fb.where("visibility","==","public"),fb.where("status","==","waiting"),fb.limit(20));const snap=await fb.getDocs(q);UI.publicRooms=snap.docs.map(d=>d.data()).filter(r=>Number(r.currentPlayers||0)<Number(r.maxPlayers||2)&&!r.playerUids?.includes(user.uid));renderPublicList();}
    catch(error){const list=UI.shell?.querySelector("[data-chkl-room-list]");if(list)list.innerHTML=`<div class="chkl-empty error">${esc(error.message||error)}</div>`;}
    finally{UI.publicLoading=false;}
  }
  function renderPublicList(){const list=UI.shell?.querySelector("[data-chkl-room-list]");if(!list)return;if(!UI.publicRooms.length){list.innerHTML=`<div class="chkl-empty">Gerade ist kein freier öffentlicher Tisch offen.<button data-chkl-create-empty>Neuen Tisch öffnen</button></div>`;list.querySelector("[data-chkl-create-empty]")?.addEventListener("click",()=>createRoom("public",2));return;}list.innerHTML=UI.publicRooms.map(room=>`<article><div><small>${room.maxPlayers===2?"DUELL":`${room.maxPlayers}ER-TISCH`}</small><b>${esc(roomPlayer(room,room.hostUid).name)}</b><span>${room.currentPlayers}/${room.maxPlayers} Spieler · Code ${esc(room.roomId)}</span></div><button data-chkl-join-room="${esc(room.roomId)}">Beitreten</button></article>`).join("");list.querySelectorAll("[data-chkl-join-room]").forEach(btn=>btn.addEventListener("click",()=>joinRoom(btn.dataset.chklJoinRoom)));}

  function stopRoomListeners(){
    try{UI.roomUnsub?.();}catch{}UI.roomUnsub=null;
    try{UI.commandUnsub?.();}catch{}UI.commandUnsub=null;
    for(const unsub of UI.ownCommandUnsubs.values())try{unsub();}catch{}
    UI.ownCommandUnsubs.clear();
    clearInterval(UI.ticker);UI.ticker=0;
    clearTimeout(UI.botTimer);UI.botTimer=0;UI.botBusy=false;
    if(UI._hostWatch){clearInterval(UI._hostWatch);UI._hostWatch=0;}
  }
  async function openRoom(roomId){
    stopRoomListeners();UI.roomId=roomId;UI.view="room";UI.selectedTarget="";UI.lastEventId="";
    try{const {fb}=await firebase();const ref=roomRef(fb,roomId);UI.roomUnsub=fb.onSnapshot(ref,snap=>{if(!snap.exists()){toast("Der Chamber-Tisch wurde geschlossen.","error");return renderHome();}UI.room={id:snap.id,...snap.data()};onRoomSnapshot();},error=>{toast(`Firebase: ${error.message||error}`,"error");});}
    catch(error){toast(error.message||error,"error");renderHome();}
  }
  function onRoomSnapshot(){
    const room=UI.room;if(!room)return;
    if(!isParticipant(room)&&room.status!=="waiting"){toast("Du bist nicht mehr Teil dieses Matches.","error");return renderHome();}
    if(room.status==="waiting")renderLobby();else renderGame();
    if(isHost(room)&&room.status==="playing")ensureHostRuntime();else if(UI.commandUnsub){try{UI.commandUnsub();}catch{}UI.commandUnsub=null;}
    if(room.lastEvent?.id&&room.lastEvent.id!==UI.lastEventId){UI.lastEventId=room.lastEvent.id;animateEvent(room.lastEvent);}
  }
  function characterHtml(profile,alive=true){
    const hair=/^#/.test(profile?.hairColor||"")?profile.hairColor:"#30231d";const skin=/^#/.test(profile?.skinColor||"")?profile.skinColor:"#d2a278";
    return `<div class="chkl-character ${profile?.gender==="female"?"female":"male"} ${alive?"":"out"}" style="--hair:${esc(hair)};--skin:${esc(skin)}"><i class="chair"></i><i class="hair"></i><i class="head"></i><i class="torso"></i><i class="arm left"></i><i class="arm right"></i><i class="leg left"></i><i class="leg right"></i></div>`;
  }
  function destroyScene(){try{window.ChamberKLScene?.destroy?.();}catch{}UI.sceneMounted=false;}
  function sceneCosmetics(room){const active=roomPlayer(room,room?.activeUid||room?.hostUid);return {shotgunSkin:active.shotgunSkin||"standard",liveShellSkin:active.liveShellSkin||"standard",blankShellSkin:active.blankShellSkin||"standard",itemSkin:active.itemSkin||"standard"};}
  function mountScene(room,mode="game"){
    const host=UI.shell?.querySelector("[data-chkl-scene]");if(!host)return;const api=window.ChamberKLScene;if(!api?.mount)return;try{api.mount(host,{room,mode,ownUid:ownUid(),cosmetics:sceneCosmetics(room),onSelectTarget:(uid)=>{if(UI.room?.status==="playing"&&UI.room.activeUid===ownUid()&&Number(UI.room.hp?.[uid]||0)>0){UI.selectedTarget=uid;renderGame();}}});UI.sceneMounted=true;}catch(error){console.warn("Chamber.KL 3D",error);}}
  function renderLobby(){
    const room=UI.room;if(!room||!UI.shell)return;UI.view="lobby";destroyScene();
    const botCount=(room.playerUids||[]).filter(isBotUid).length;
    UI.shell.innerHTML=`${topbar(room.visibility==="private"?"PRIVATER TISCH":"ÖFFENTLICHER TISCH")}<main class="chkl-lobby chkl-lobby-v2"><section class="chkl-lobby-scene"><div class="chkl-scene-frame" data-chkl-scene><div class="chkl-scene-fallback"><span>3D TABLE</span></div></div><div class="chkl-room-badge"><small>RAUMCODE</small><strong>${esc(room.roomId)}</strong><span>${room.visibility==="private"?"PRIVAT":"ÖFFENTLICH"}</span></div><div class="chkl-lobby-roster">${Array.from({length:room.maxPlayers},(_,seat)=>{const uid=room.playerUids?.[seat],p=uid?roomPlayer(room,uid):null;return `<article class="${uid?"filled":"empty"}">${p?`${characterHtml(p,true)}<div><small>${uid===room.hostUid?"HOST":isBotUid(uid)?`BOT · ${String(p.botDifficulty||"easy").toUpperCase()}`:"SPIELER"}</small><b>${esc(p.name)}</b></div>${isHost(room)&&isBotUid(uid)?`<button data-chkl-remove-bot="${esc(uid)}">×</button>`:""}`:`<i>+</i><div><small>SITZ ${seat+1}</small><b>Frei</b></div>`}</article>`;}).join("")}</div></section><aside class="chkl-lobby-panel"><small>CHAMBER.KL · V2</small><h2>${room.currentPlayers}/${room.maxPlayers} am Tisch</h2><p>${room.currentPlayers<2?"Füge einen Bot hinzu oder warte auf einen Spieler.":"Der Tisch ist bereit. Die Patronen werden erst beim Matchstart erzeugt."}</p>${isHost(room)?`<div class="chkl-bot-box"><b>Bots hinzufügen</b><select data-chkl-lobby-bot-diff><option value="easy">Leicht</option><option value="medium">Mittel</option><option value="hard">Schwer</option></select><button data-chkl-add-bot ${room.currentPlayers>=room.maxPlayers?"disabled":""}>+ Bot auf freien Sitz</button><small>${botCount} Bot${botCount===1?"":"s"} aktiv</small></div><button class="primary massive" data-chkl-start ${room.currentPlayers<2?"disabled":""}>MATCH STARTEN</button>`:`<div class="chkl-waiting"><span></span>Warte auf den Host …</div>`}<button data-chkl-leave>Tisch verlassen</button></aside></main>`;
    bindTopbar();mountScene(room,"lobby");UI.shell.querySelector("[data-chkl-start]")?.addEventListener("click",startMatch);UI.shell.querySelector("[data-chkl-leave]")?.addEventListener("click",leaveRoom);UI.shell.querySelector("[data-chkl-add-bot]")?.addEventListener("click",()=>addBotToLobby(UI.shell.querySelector("[data-chkl-lobby-bot-diff]")?.value||"easy"));UI.shell.querySelectorAll("[data-chkl-remove-bot]").forEach(b=>b.addEventListener("click",()=>removeBotFromLobby(b.dataset.chklRemoveBot)));
  }
  async function deleteRoomTree(fb,room,userUid=ownUid()){
    if(!room||room.hostUid!==userUid)return false;
    try{
      const commands=await fb.getDocs(fb.collection(fb.db,ROOM_COLLECTION,room.roomId,COMMAND_COLLECTION));
      await Promise.all(commands.docs.map(doc=>fb.deleteDoc(doc.ref).catch(()=>{})));
    }catch(error){console.warn("Chamber.KL Command-Cleanup",error);}
    await fb.deleteDoc(roomRef(fb,room.roomId));clearDealer(room.roomId,userUid);return true;
  }
  async function leaveRoom(){
    const room=UI.room;if(!room)return renderHome();setBusy(true);
    try{const {fb,user}=await firebase();const ref=roomRef(fb,room.roomId);
      if(room.status==="waiting"){
        if(room.hostUid===user.uid){await deleteRoomTree(fb,room,user.uid);}
        else await fb.runTransaction(fb.db,async tx=>{const snap=await tx.get(ref);if(!snap.exists())return;const data=snap.data();if(data.status!=="waiting")return;const uids=(data.playerUids||[]).filter(uid=>uid!==user.uid);const profiles={...(data.profiles||{})};delete profiles[user.uid];tx.update(ref,{playerUids:uids,profiles,currentPlayers:uids.length,updatedAtMs:now()});});
      }else if(room.status==="playing"){
        if(room.hostUid===user.uid){await deleteRoomTree(fb,room,user.uid);}
        else await sendAction("leave",{});
      }
    }catch(error){toast(error.message||error,"error");}
    finally{setBusy(false);renderHome();}
  }
  async function requestClose(){
    if(UI.room&&UI.room.status==="waiting"){await leaveRoom();return;}
    if(UI.room&&UI.room.status==="playing"){
      if(isHost(UI.room)){
        try{const {fb,user}=await firebase();await deleteRoomTree(fb,UI.room,user.uid);}catch{}
      }else await sendAction("leave",{}).catch(()=>{});
    }else if(UI.room&&UI.room.status==="finished"&&isHost(UI.room)){
      try{const {fb,user}=await firebase();await deleteRoomTree(fb,UI.room,user.uid);}catch{}
    }
    close();
  }

  function dealerKey(roomId,uid=ownUid()){return `${DEALER_KEY_PREFIX}${uid}:${roomId}`;}
  function readDealer(roomId=UI.roomId,uid=ownUid()){try{const raw=localStorage.getItem(dealerKey(roomId,uid));return raw?JSON.parse(raw):null;}catch{return null;}}
  function writeDealer(data,roomId=UI.roomId,uid=ownUid()){try{localStorage.setItem(dealerKey(roomId,uid),JSON.stringify(data));}catch{}}
  function clearDealer(roomId=UI.roomId,uid=ownUid()){try{localStorage.removeItem(dealerKey(roomId,uid));}catch{}}
  function createDeck(playerCount,round){
    const base=playerCount>=4?7:playerCount===3?6:5;const total=clamp(base+Math.min(2,Math.floor((round-1)/2)),4,8);const live=clamp(1+randomInt(total-1),1,total-1);const blank=total-live;return shuffle([...Array(live).fill("live"),...Array(blank).fill("blank")]);
  }
  function saveDeck(deck,round,epoch){const data={roomId:UI.roomId,hostUid:ownUid(),round,epoch,deck:[...deck],updatedAtMs:now()};writeDealer(data);return data;}
  function ensureDealerForRoom(room){
    let dealer=readDealer(room.roomId,room.hostUid);
    const expected=Math.max(0,Number(room.shellTotal||0));
    if(!dealer||dealer.round!==room.round||dealer.epoch!==room.dealerEpoch||!Array.isArray(dealer.deck)||dealer.deck.length!==expected){
      // Host-Recovery: falls der Browser-Secret verloren ging, wird nur aus den noch sichtbaren Counts neu gemischt.
      const deck=shuffle([...Array(Math.max(0,Number(room.shellLive||0))).fill("live"),...Array(Math.max(0,Number(room.shellBlank||0))).fill("blank")]);
      dealer=saveDeck(deck,room.round,room.dealerEpoch);
    }
    return dealer;
  }
  function nextItems(existing=[],count=2){const ids=Object.keys(ITEM_DEFS);const out=[...(Array.isArray(existing)?existing:[])];for(let i=0;i<count&&out.length<8;i++)out.push(ids[randomInt(ids.length)]);return out;}
  function initialGameState(room,deck,epoch){
    const order=shuffle(room.playerUids||[]);const hp={},items={},effects={};for(const uid of order){hp[uid]=MAX_HP;items[uid]=nextItems([],2);effects[uid]={doubleNext:false,plate:false,jammed:false};}
    const live=deck.filter(x=>x==="live").length,blank=deck.length-live;
    return {status:"playing",phase:"playing",round:1,turnOrder:order,activeUid:order[0]||room.hostUid,turnStartedAtMs:now(),direction:1,hp,items,effects,shellLive:live,shellBlank:blank,shellTotal:deck.length,eventSeq:Number(room.eventSeq||0)+1,lastEvent:{id:`reload-${epoch}-1`,type:"reload",actorUid:room.hostUid,targetUid:"",itemId:"",shell:"",damage:0,text:`${live} scharfe · ${blank} leere Patronen werden geladen`,atMs:now()},winnerUid:"",winnerName:"",dealerEpoch:epoch,updatedAtMs:now()};
  }
  async function startMatch(){
    const room=UI.room;if(!room||!isHost(room)||room.currentPlayers<2)return;setBusy(true);
    try{const {fb,user}=await firebase();const epoch=now()+randomInt(100000);const deck=createDeck(room.currentPlayers,1);saveDeck(deck,1,epoch);await fb.updateDoc(roomRef(fb,room.roomId),initialGameState(room,deck,epoch));}
    catch(error){toast(error.message||error,"error");}finally{setBusy(false);}
  }

  function hpHtml(hp){return `<div class="chkl-hp">${Array.from({length:MAX_HP},(_,i)=>`<i class="${i<hp?"on":""}">♥</i>`).join("")}</div>`;}
  function lastEventText(room){const e=room.lastEvent||{};if(e.type==="shot-live")return `${roomPlayer(room,e.actorUid).name} → ${roomPlayer(room,e.targetUid).name}: ${e.damage>0?`${e.damage} Schaden`:"Schutzplatte blockiert"}`;if(e.type==="shot-blank")return `${roomPlayer(room,e.actorUid).name}: KLICK — leer`;if(e.type==="reload")return e.text||"Neue Kammer wird geladen";if(e.type==="item")return e.text||"Item eingesetzt";if(e.type==="eject")return `${roomPlayer(room,e.actorUid).name} wirft eine ${e.shell==="live"?"scharfe":"leere"} Patrone aus`;if(e.type==="eliminated")return e.text||"Spieler ausgeschieden";if(e.type==="timeout")return e.text||"Zug übersprungen";return e.text||"Match läuft";}
  function itemCard(room,id,index){const item=ITEM_DEFS[id]||{icon:"?",name:id,text:""};const skin=roomPlayer(room,ownUid()).itemSkin||chamberState()?.cosmetics?.itemSkin||"standard";return `<button class="chkl-v2-item skin-${esc(skin)}" data-chkl-item="${esc(id)}" data-chkl-item-index="${index}" title="${esc(item.text)}"><i>${item.icon}</i><span><b>${esc(item.name)}</b><small>${esc(item.text)}</small></span></button>`;}
  function targetStrip(room){const own=ownUid();return `<div class="chkl-target-strip"><small>ZIEL AUSWÄHLEN</small><div>${aliveUids(room).map(uid=>{const p=roomPlayer(room,uid),hp=Number(room.hp?.[uid]||0),sel=UI.selectedTarget===uid;return `<button class="${sel?"active":""} ${uid===own?"self":""}" data-chkl-target="${esc(uid)}"><span>${uid===own?"DU":isBotUid(uid)?"BOT":"SPIELER"}</span><b>${esc(p.name)}</b>${hpHtml(hp)}</button>`;}).join("")}</div></div>`;}
  function matchHud(room){const active=roomPlayer(room,room.activeUid),own=ownUid();return `<div class="chkl-game-hud"><div class="chkl-round"><small>RUNDE</small><b>${room.round}</b></div><div class="chkl-event"><small>LETZTE AKTION</small><b>${esc(lastEventText(room))}</b></div><div class="chkl-ammo"><span class="live"><i></i><b>${room.shellLive}</b><small>SCHARF</small></span><span class="blank"><i></i><b>${room.shellBlank}</b><small>LEER</small></span></div><div class="chkl-active"><small>${room.activeUid===own?"DEIN ZUG":"AM ZUG"}</small><b>${esc(active.name)}</b><span data-chkl-timer>--</span></div></div>`;}
  function actionHtml(room){const uid=ownUid(),alive=Number(room.hp?.[uid]||0)>0,ownTurn=room.activeUid===uid&&alive,target=UI.selectedTarget&&Number(room.hp?.[UI.selectedTarget]||0)>0?UI.selectedTarget:"",items=room.items?.[uid]||[],jammed=!!room.effects?.[uid]?.jammed;if(room.phase==="reloading")return `<section class="chkl-v2-controls reload"><div><small>KAMMER OFFEN</small><b>Patronen werden geladen …</b><span>Du siehst die Anzahl, nicht die Reihenfolge.</span></div></section>`;if(!alive)return `<section class="chkl-v2-controls spectate"><div><small>AUSGESCHIEDEN</small><b>Du beobachtest den restlichen Tisch live.</b></div></section>`;if(!ownTurn)return `<section class="chkl-v2-controls spectate"><div><small>LIVE TABLE</small><b>${esc(roomPlayer(room,room.activeUid).name)} entscheidet.</b><span>Alle Aktionen werden über Firebase synchronisiert.</span></div></section>`;return `<section class="chkl-v2-controls ready">${targetStrip(room)}<div class="chkl-v2-item-drawer"><div class="chkl-panel-title"><div><small>DEINE SPECIAL ITEMS</small><b>${jammed?"STÖRSENDER — ITEMS GESPERRT":"Vor dem Schuss einsetzbar"}</b></div><span>${items.length}/8</span></div><div class="chkl-v2-items">${items.length?items.map((id,i)=>itemCard(room,id,i)).join(""):`<div class="chkl-no-items">Keine Items mehr</div>`}</div></div><div class="chkl-v2-fire"><div><small>AUSGEWÄHLT</small><b>${target?esc(roomPlayer(room,target).name):"Noch kein Ziel"}</b><span>${target===uid?"Leere Patrone: du bleibst am Zug":"Ziel kann Schaden erhalten"}</span></div><button class="primary danger" data-chkl-shoot ${target?"":"disabled"}><i></i>ABZIEHEN</button></div></section>`;}
  function renderGame(){
    const room=UI.room;if(!room||!UI.shell)return;UI.view="game";destroyScene();const living=aliveUids(room);if(!UI.selectedTarget||!living.includes(UI.selectedTarget)){const own=ownUid();UI.selectedTarget=living.find(uid=>uid!==own)||living[0]||"";}if(room.status==="finished")return renderFinished();
    UI.shell.innerHTML=`${topbar(`RUNDE ${room.round}`)}<main class="chkl-game chkl-game-v2"><section class="chkl-v2-stage"><div class="chkl-scene-frame game" data-chkl-scene><div class="chkl-scene-fallback"><span>3D TABLE</span></div></div>${matchHud(room)}<div class="chkl-seat-tags">${(room.turnOrder||room.playerUids||[]).map((uid,index)=>{const p=roomPlayer(room,uid),hp=Number(room.hp?.[uid]||0),eff=room.effects?.[uid]||{};return `<button class="seat-${index} ${room.activeUid===uid?"active":""} ${UI.selectedTarget===uid?"target":""} ${hp<=0?"out":""}" data-chkl-target="${esc(uid)}" ${hp<=0?"disabled":""}><small>${uid===ownUid()?"DU":isBotUid(uid)?`BOT · ${String(p.botDifficulty||"easy").toUpperCase()}`:uid===room.hostUid?"HOST":"SPIELER"}</small><b>${esc(p.name)}</b>${hpHtml(hp)}<span>${eff.plate?"⬡":""}${eff.doubleNext?"Ⅱ":""}${eff.jammed?"⌁":""}</span></button>`;}).join("")}</div></section>${actionHtml(room)}</main>`;
    bindTopbar();mountScene(room,"game");UI.shell.querySelectorAll("[data-chkl-target]").forEach(btn=>btn.addEventListener("click",()=>{if(UI.room?.activeUid!==ownUid())return;UI.selectedTarget=btn.dataset.chklTarget;renderGame();}));UI.shell.querySelector("[data-chkl-shoot]")?.addEventListener("click",()=>sendAction("shoot",{targetUid:UI.selectedTarget}));UI.shell.querySelectorAll("[data-chkl-item]").forEach(btn=>btn.addEventListener("click",()=>{const id=btn.dataset.chklItem,item=ITEM_DEFS[id];if(UI.room?.effects?.[ownUid()]?.jammed)return toast("Der Störsender blockiert deine Items in diesem Zug.","error");if(item?.target&&(!UI.selectedTarget||UI.selectedTarget===ownUid()))return toast("Wähle zuerst einen anderen lebenden Spieler als Ziel.","error");sendAction("item",{itemId:id,targetUid:item?.target?UI.selectedTarget:""});}));startTicker();
  }
  function startTicker(){clearInterval(UI.ticker);const update=()=>{const node=UI.shell?.querySelector("[data-chkl-timer]");if(!node||!UI.room)return;const left=Math.max(0,TURN_MS-(now()-Number(UI.room.turnStartedAtMs||now())));node.textContent=`${Math.ceil(left/1000)}s`;node.classList.toggle("urgent",left<6000);};update();UI.ticker=setInterval(update,500);}
  function rewardForRoom(room,won){const botProfiles=(room.playerUids||[]).filter(isBotUid).map(uid=>roomPlayer(room,uid));const rank={easy:1,medium:2,hard:3};let hardest="";for(const p of botProfiles)if((rank[p.botDifficulty]||0)>(rank[hardest]||0))hardest=p.botDifficulty;const bot=hardest?BOT_DIFFICULTIES[hardest]:null;let xp=35,coins=12;if(won){xp+=130;coins+=85;if(bot){xp+=bot.xp+Math.max(0,botProfiles.length-1)*35;coins+=bot.coins+Math.max(0,botProfiles.length-1)*18;}else{xp+=90;coins+=45;}if(Number(room.maxPlayers||0)===4){xp+=70;coins+=35;}}return {xp,coins,hardest,botCount:botProfiles.length};}
  function renderFinished(){
    const room=UI.room;if(!room)return;destroyScene();const reward=settleLocalStats(room);const winner=roomPlayer(room,room.winnerUid);const ownWin=room.winnerUid===ownUid();
    UI.shell.innerHTML=`${topbar("MATCH BEENDET")}<main class="chkl-finished chkl-finished-v2"><div class="chkl-finish-stage" data-chkl-scene></div><div class="chkl-finish-card"><small>${ownWin?"VICTORY":"MATCH COMPLETE"}</small><h2>${ownWin?"Du kontrollierst den Tisch.":`${esc(winner.name)} gewinnt.`}</h2><p>${room.currentPlayers>=4?"Vierertisch":"Duell"} · Runde ${room.round}</p>${reward?`<div class="chkl-reward-grid"><span><small>CHAMBER XP</small><b>+${reward.xp}</b></span><span><small>CHAMBER COINS</small><b>+${reward.coins} ◈</b></span>${ownWin?`<span><small>HAUPTCHARAKTER</small><b>+100 XP</b></span>`:""}</div>`:""}<div class="chkl-finish-actions"><button class="primary" data-chkl-home>Weiter in Chamber.KL</button><button data-chkl-topgames>Top Games</button></div>${statsHtml()}</div></main>`;
    bindTopbar();mountScene(room,"finish");UI.shell.querySelector("[data-chkl-home]")?.addEventListener("click",async()=>{const finished=UI.room;if(finished&&isHost(finished)){try{const {fb,user}=await firebase();await deleteRoomTree(fb,finished,user.uid);}catch{}}renderHome();});UI.shell.querySelector("[data-chkl-topgames]")?.addEventListener("click",requestClose);
  }
  function settledSet(){try{return new Set(JSON.parse(localStorage.getItem(LOCAL_SETTLED_KEY)||"[]"));}catch{return new Set();}}
  function settleLocalStats(room){const set=settledSet();if(set.has(room.roomId))return null;set.add(room.roomId);try{localStorage.setItem(LOCAL_SETTLED_KEY,JSON.stringify([...set].slice(-100)));}catch{}const s=chamberState();if(!s)return null;const won=room.winnerUid===ownUid(),reward=rewardForRoom(room,won);s.stats.matches++;if(won){s.stats.wins++;if(Number(room.maxPlayers||0)===4)s.stats.fourTableWins++;const bots=(room.playerUids||[]).filter(isBotUid);if(bots.length){s.stats.botWins++;if(bots.some(uid=>roomPlayer(room,uid).botDifficulty==="hard"))s.stats.hardBotWins++;}try{if(window.JKGamesAwardExactMainXp)window.JKGamesAwardExactMainXp(100,"Chamber.KL Sieg",{eventKey:`chamber-v2:${room.roomId}`});else window.JKGamesAwardTopGameXp?.("chamber",100,"Chamber.KL Sieg",{eventKey:`chamber-v2:${room.roomId}`});}catch{}}grantChamberRewards(reward.xp,reward.coins);persist();return reward;}
  function animateEvent(event){if(!UI.overlay||UI.view!=="game")return;try{window.ChamberKLScene?.playEvent?.(event,UI.room);}catch(error){console.warn("Chamber.KL scene event",error);}const feed=UI.overlay.querySelector(".chkl-event b");if(feed){feed.classList.remove("flash");void feed.offsetWidth;feed.classList.add("flash");}}

  async function sendAction(action,payload={}){
    if(UI.actionBusy||!UI.room||UI.room.status!=="playing")return false;if(UI.room.phase!=="playing")return toast("Die Kammer wird gerade neu geladen.","error");const uid=ownUid();if(UI.room.activeUid!==uid&&action!=="leave")return toast("Du bist gerade nicht am Zug.","error");setBusy(true);
    try{
      if(isHost(UI.room)){
        const result=await hostProcessCommand({id:`local-${now()}`,uid,action,targetUid:String(payload.targetUid||""),itemId:String(payload.itemId||""),createdAtMs:now(),status:"pending"},true);
        if(result?.privateResult)toast(result.privateResult,"good");
      }else{
        const {fb}=await firebase();const id=`${uid.slice(0,8)}-${now()}-${randomInt(9999)}`;const data={uid,action,targetUid:String(payload.targetUid||""),itemId:String(payload.itemId||""),createdAtMs:now(),status:"pending"};const ref=commandRef(fb,UI.room.roomId,id);await fb.setDoc(ref,data);listenOwnCommand(fb,ref,id,action,payload);
      }
      return true;
    }catch(error){toast(error.message||error,"error");return false;}finally{setTimeout(()=>setBusy(false),220);}
  }
  function applyGuestCommandStats(action,payload,result){
    const s=chamberState();if(!s)return;
    if(action==="item"){s.stats.itemsUsed++;persist();return;}
    if(action!=="shoot")return;
    s.stats.shots++;
    const blank=String(result||"").toUpperCase().includes("KLICK");
    if(blank)s.stats.blankShots++;else s.stats.liveShots++;
    const targetUid=String(payload?.targetUid||"");
    if(!blank&&targetUid&&targetUid!==ownUid()){
      setTimeout(()=>{const latest=UI.room;if(Number(latest?.hp?.[targetUid]||0)<=0){const state=chamberState();if(state){state.stats.eliminations++;persist();}}},120);
    }
    persist();
  }
  function listenOwnCommand(fb,ref,id,action,payload={}){
    const unsub=fb.onSnapshot(ref,snap=>{if(!snap.exists())return;const d=snap.data();if(d.status==="done"||d.status==="denied"){if(d.status==="done")applyGuestCommandStats(action,payload,d.result);if(d.result)toast(d.result,d.status==="done"?"good":"error");try{unsub();}catch{}UI.ownCommandUnsubs.delete(id);setTimeout(()=>fb.deleteDoc(ref).catch(()=>{}),5000);}},()=>{});UI.ownCommandUnsubs.set(id,unsub);
  }

  function ensureHostRuntime(){
    if(!UI.room||!isHost(UI.room))return;ensureDealerForRoom(UI.room);
    if(!UI.commandUnsub)startHostCommandListener();
    if(!UI.ticker)startTicker();
    if(!UI._hostWatch){UI._hostWatch=setInterval(()=>hostTimeoutCheck().catch(()=>{}),1000);}
    maybeScheduleBotTurn();
  }
  function botOpponentTarget(room,uid,difficulty="easy"){
    const alive=aliveUids(room).filter(x=>x!==uid);if(!alive.length)return uid;if(difficulty==="easy")return alive[randomInt(alive.length)];return [...alive].sort((a,b)=>Number(room.hp?.[a]||0)-Number(room.hp?.[b]||0))[0]||alive[0];
  }
  function botItemTarget(room,uid){return botOpponentTarget(room,uid,"hard");}
  async function runBotTurn(uid){
    if(UI.botBusy||!UI.room||!isHost(UI.room)||UI.room.activeUid!==uid||!isBotUid(uid)||UI.room.phase!=="playing")return;UI.botBusy=true;
    try{
      let room=UI.room;const p=roomPlayer(room,uid),difficulty=String(p.botDifficulty||"easy");const items=[...(room.items?.[uid]||[])];const hp=Number(room.hp?.[uid]||0),total=Math.max(1,Number(room.shellTotal||1)),liveChance=Number(room.shellLive||0)/total;let knownShell="";
      const use=async(id,targetUid="")=>{if(!items.includes(id))return null;const result=await hostProcessCommand({id:`bot-${now()}-${randomInt(9999)}`,uid,action:"item",targetUid,itemId:id,createdAtMs:now(),status:"pending"},true);const idx=items.indexOf(id);if(idx>=0)items.splice(idx,1);return result;};
      if(hp<MAX_HP&&items.includes("bandage")&&(difficulty!=="easy"||randomInt(100)<60))await use("bandage");
      if(items.includes("scanner")&&((difficulty==="hard"&&randomInt(100)<72)||(difficulty==="medium"&&randomInt(100)<42))){const r=await use("scanner");knownShell=String(r?.privateResult||"").includes("SCHARF")?"live":String(r?.privateResult||"").includes("LEER")?"blank":"";}
      if(!knownShell&&items.includes("ejector")&&difficulty!=="easy"&&liveChance>.68&&hp<=2&&randomInt(100)<50)await use("ejector");
      if(items.includes("plate")&&!room.effects?.[uid]?.plate&&((difficulty==="hard"&&randomInt(100)<52)||(difficulty==="medium"&&randomInt(100)<28)))await use("plate");
      if(items.includes("double")&&(knownShell==="live"||(difficulty==="hard"&&liveChance>.56)||(difficulty==="medium"&&liveChance>.68)))await use("double");
      if(items.includes("jammer")&&difficulty==="hard"&&randomInt(100)<38)await use("jammer",botItemTarget(room,uid));else if(items.includes("steal")&&difficulty!=="easy"&&randomInt(100)<35)await use("steal",botItemTarget(room,uid));else if(items.includes("reverse")&&Number(room.maxPlayers||0)>=3&&difficulty!=="easy"&&randomInt(100)<25)await use("reverse");
      const latest=UI.room&&UI.room.activeUid===uid?UI.room:room;let target=botOpponentTarget(latest,uid,difficulty);
      if(knownShell==="blank")target=uid;else if(!knownShell){if(difficulty==="easy"&&randomInt(100)<24)target=uid;else if(difficulty==="medium"&&liveChance<.38&&randomInt(100)<65)target=uid;else if(difficulty==="hard"&&liveChance<.43)target=uid;}
      await hostProcessCommand({id:`bot-shot-${now()}-${randomInt(9999)}`,uid,action:"shoot",targetUid:target,itemId:"",createdAtMs:now(),status:"pending"},true);
    }catch(error){console.warn("Chamber.KL Bot",error);}finally{UI.botBusy=false;clearTimeout(UI.botTimer);UI.botTimer=0;}
  }
  function maybeScheduleBotTurn(){const room=UI.room;if(!room||!isHost(room)||room.status!=="playing"||room.phase!=="playing"||!isBotUid(room.activeUid)){if(UI.botTimer){clearTimeout(UI.botTimer);UI.botTimer=0;}return;}if(UI.botBusy||UI.botTimer)return;const p=roomPlayer(room,room.activeUid),cfg=BOT_DIFFICULTIES[p.botDifficulty]||BOT_DIFFICULTIES.easy;const captured=room.activeUid,delay=cfg.think[0]+randomInt(Math.max(1,cfg.think[1]-cfg.think[0]));UI.botTimer=setTimeout(()=>{UI.botTimer=0;if(UI.room?.activeUid===captured)runBotTurn(captured);},delay);}
  async function startHostCommandListener(){
    try{const {fb}=await firebase();const q=fb.query(fb.collection(fb.db,ROOM_COLLECTION,UI.roomId,COMMAND_COLLECTION),fb.where("status","==","pending"),fb.limit(25));UI.commandUnsub=fb.onSnapshot(q,snap=>{for(const change of snap.docChanges()){if(change.type!=="added"&&change.type!=="modified")continue;const data=change.doc.data();if(data.status!=="pending")continue;UI.hostQueue=UI.hostQueue.then(()=>hostProcessCommand({id:change.doc.id,...data},false)).catch(error=>console.warn("Chamber.KL Host Command",error));}},error=>console.warn("Chamber.KL Commands",error));}
    catch(error){console.warn("Chamber.KL Host Listener",error);}
  }
  async function resolveCommandDoc(fb,cmd,status,result=""){if(cmd.id.startsWith("local-")||cmd.id.startsWith("bot-"))return;try{await fb.updateDoc(commandRef(fb,UI.roomId,cmd.id),{status,result:String(result||"").slice(0,120),resolvedAtMs:now()});}catch(error){console.warn("Chamber.KL Command resolve",error);}}
  function validTarget(room,uid){return !!uid&&Array.isArray(room.playerUids)&&room.playerUids.includes(uid)&&Number(room.hp?.[uid]||0)>0;}
  function nextTurn(room,currentUid){const order=room.turnOrder||[];if(!order.length)return currentUid;const direction=Number(room.direction||1)>=0?1:-1;let index=order.indexOf(currentUid);for(let step=1;step<=order.length;step++){const next=order[(index+direction*step+order.length*10)%order.length];if(Number(room.hp?.[next]||0)>0)return next;}return currentUid;}
  function cloneMap(value){return value&&typeof value==="object"&&!Array.isArray(value)?JSON.parse(JSON.stringify(value)):{};}
  function roomUpdateBase(room){return {hp:cloneMap(room.hp),items:cloneMap(room.items),effects:cloneMap(room.effects),direction:Number(room.direction||1)>=0?1:-1,round:Number(room.round||1),activeUid:room.activeUid,turnStartedAtMs:Number(room.turnStartedAtMs||now()),shellLive:Number(room.shellLive||0),shellBlank:Number(room.shellBlank||0),shellTotal:Number(room.shellTotal||0),eventSeq:Number(room.eventSeq||0),status:room.status,phase:room.phase,winnerUid:room.winnerUid||"",winnerName:room.winnerName||"",dealerEpoch:Number(room.dealerEpoch||0)};}
  function inventoryRemove(list,id){const out=[...(Array.isArray(list)?list:[])],idx=out.indexOf(id);if(idx<0)return null;out.splice(idx,1);return out;}
  function makeEvent(state,type,actorUid,targetUid="",extra={}){state.eventSeq++;return {id:`${type}-${state.eventSeq}-${now()}`,type,actorUid,targetUid,itemId:extra.itemId||"",shell:extra.shell||"",damage:Number(extra.damage||0),text:String(extra.text||"").slice(0,180),atMs:now()};}
  function reloadState(room,state,dealer){
    state.round++;const deck=createDeck(aliveUids({...room,hp:state.hp}).length,state.round);state.dealerEpoch=now()+randomInt(99999);saveDeck(deck,state.round,state.dealerEpoch);dealer.deck=deck;dealer.round=state.round;dealer.epoch=state.dealerEpoch;
    state.shellLive=deck.filter(x=>x==="live").length;state.shellBlank=deck.length-state.shellLive;state.shellTotal=deck.length;state.phase="playing";state.turnStartedAtMs=now();
    for(const uid of aliveUids({...room,hp:state.hp})){state.items[uid]=nextItems(state.items[uid],2);}
    return makeEvent(state,"reload",room.hostUid,"",{text:`Neue Kammer: ${state.shellLive} scharfe · ${state.shellBlank} leere Patronen`});
  }
  function scheduleReload(roomId,expectedEventSeq){
    setTimeout(()=>hostReloadEmptyRoom(roomId,expectedEventSeq).catch(error=>console.warn("Chamber.KL Reload",error)),900);
  }
  async function hostReloadEmptyRoom(roomId,expectedEventSeq){
    if(!roomId||UI.roomId!==roomId)return;
    const {fb}=await firebase();const ref=roomRef(fb,roomId);const snap=await fb.getDoc(ref);if(!snap.exists())return;const room={id:snap.id,...snap.data()};
    if(!isHost(room)||room.status!=="playing"||room.phase!=="reloading"||Number(room.shellTotal||0)>0||Number(room.eventSeq||0)!==Number(expectedEventSeq||0))return;
    const dealer=ensureDealerForRoom(room);const state=roomUpdateBase(room);const event=reloadState(room,state,dealer);
    await fb.updateDoc(ref,{phase:state.phase,round:state.round,turnStartedAtMs:state.turnStartedAtMs,items:state.items,shellLive:state.shellLive,shellBlank:state.shellBlank,shellTotal:state.shellTotal,dealerEpoch:state.dealerEpoch,eventSeq:state.eventSeq,lastEvent:event,updatedAtMs:now()});
  }
  async function hostProcessCommand(cmd,local=false){
    const {fb}=await firebase();const ref=roomRef(fb,UI.roomId);const snap=await fb.getDoc(ref);if(!snap.exists())throw new Error("Raum nicht gefunden.");const room={id:snap.id,...snap.data()};
    if(room.status!=="playing"){await resolveCommandDoc(fb,cmd,"denied","Das Match läuft nicht mehr.");return;}
    if(room.phase!=="playing"&&cmd.action!=="leave"){await resolveCommandDoc(fb,cmd,"denied","Die Kammer wird gerade neu geladen.");return;}
    if(!room.playerUids?.includes(cmd.uid)){await resolveCommandDoc(fb,cmd,"denied","Du gehörst nicht zu diesem Tisch.");return;}
    if(cmd.action==="leave"){
      const state=roomUpdateBase(room);state.hp[cmd.uid]=0;const remaining=aliveUids({...room,hp:state.hp});let event;if(remaining.length<=1){state.status="finished";state.phase="finished";state.winnerUid=remaining[0]||"";state.winnerName=state.winnerUid?roomPlayer(room,state.winnerUid).name:"";event=makeEvent(state,"eliminated",cmd.uid,cmd.uid,{text:`${roomPlayer(room,cmd.uid).name} hat den Tisch verlassen.`});}else{if(state.activeUid===cmd.uid){state.activeUid=nextTurn({...room,hp:state.hp},cmd.uid);state.turnStartedAtMs=now();}event=makeEvent(state,"eliminated",cmd.uid,cmd.uid,{text:`${roomPlayer(room,cmd.uid).name} hat den Tisch verlassen.`});}
      await fb.updateDoc(ref,{...state,lastEvent:event,updatedAtMs:now()});await resolveCommandDoc(fb,cmd,"done","Tisch verlassen.");return {ok:true};
    }
    if(room.activeUid!==cmd.uid){await resolveCommandDoc(fb,cmd,"denied","Dein Zug ist bereits vorbei.");return;}
    const dealer=ensureDealerForRoom(room);const state=roomUpdateBase(room);let event=null,privateResult="";
    if(cmd.action==="item"){
      const id=String(cmd.itemId||"");const def=ITEM_DEFS[id];if(!def){await resolveCommandDoc(fb,cmd,"denied","Unbekanntes Item.");return;}
      if(state.effects?.[cmd.uid]?.jammed){await resolveCommandDoc(fb,cmd,"denied","Der Störsender blockiert deine Items in diesem Zug.");return;}
      const updated=inventoryRemove(state.items[cmd.uid],id);if(!updated){await resolveCommandDoc(fb,cmd,"denied","Dieses Item ist nicht mehr in deinem Inventar.");return;}
      if(def.target&&(!validTarget(room,cmd.targetUid)||cmd.targetUid===cmd.uid)){await resolveCommandDoc(fb,cmd,"denied","Ungültiges Ziel.");return;}
      if(id==="bandage"&&Number(state.hp[cmd.uid]||0)>=MAX_HP){await resolveCommandDoc(fb,cmd,"denied","Du hast bereits volles Leben.");return;}
      state.items[cmd.uid]=updated;state.effects[cmd.uid] ||= {doubleNext:false,plate:false,jammed:false};
      if(id==="scanner"){const shell=dealer.deck[0]||"";privateResult=shell==="live"?"Scanner: Die nächste Patrone ist SCHARF.":"Scanner: Die nächste Patrone ist LEER.";event=makeEvent(state,"item",cmd.uid,"",{itemId:id,text:`${roomPlayer(room,cmd.uid).name} benutzt den Scanner.`});}
      else if(id==="ejector"){
        const shell=dealer.deck.shift();if(!shell){await resolveCommandDoc(fb,cmd,"denied","Die Kammer wird gerade neu geladen.");return;}
        if(shell==="live")state.shellLive=Math.max(0,state.shellLive-1);else state.shellBlank=Math.max(0,state.shellBlank-1);state.shellTotal=Math.max(0,state.shellTotal-1);writeDealer(dealer);
        event=makeEvent(state,"eject",cmd.uid,"",{itemId:id,shell,text:`${roomPlayer(room,cmd.uid).name} wirft eine Patrone aus.`});if(state.shellTotal<=0)state.phase="reloading";
      }
      else if(id==="double"){state.effects[cmd.uid].doubleNext=true;event=makeEvent(state,"item",cmd.uid,"",{itemId:id,text:`${roomPlayer(room,cmd.uid).name} aktiviert Doppelladung.`});}
      else if(id==="bandage"){state.hp[cmd.uid]=Math.min(MAX_HP,Number(state.hp[cmd.uid]||0)+1);event=makeEvent(state,"item",cmd.uid,cmd.uid,{itemId:id,text:`${roomPlayer(room,cmd.uid).name} heilt 1 Leben.`});}
      else if(id==="jammer"){state.effects[cmd.targetUid] ||= {doubleNext:false,plate:false,jammed:false};state.effects[cmd.targetUid].jammed=true;event=makeEvent(state,"item",cmd.uid,cmd.targetUid,{itemId:id,text:`${roomPlayer(room,cmd.uid).name} stört ${roomPlayer(room,cmd.targetUid).name}.`});}
      else if(id==="steal"){
        const targetItems=[...(state.items[cmd.targetUid]||[])];if(!targetItems.length){state.items[cmd.uid].push(id);await resolveCommandDoc(fb,cmd,"denied","Das Ziel besitzt kein Item zum Stehlen.");return;}
        const pick=randomInt(targetItems.length),stolen=targetItems.splice(pick,1)[0];state.items[cmd.targetUid]=targetItems;state.items[cmd.uid]=[...(state.items[cmd.uid]||[]),stolen].slice(0,8);event=makeEvent(state,"item",cmd.uid,cmd.targetUid,{itemId:id,text:`${roomPlayer(room,cmd.uid).name} stiehlt ein Item von ${roomPlayer(room,cmd.targetUid).name}.`});privateResult=`Gestohlen: ${ITEM_DEFS[stolen]?.name||stolen}`;
      }
      else if(id==="plate"){state.effects[cmd.uid].plate=true;event=makeEvent(state,"item",cmd.uid,cmd.uid,{itemId:id,text:`${roomPlayer(room,cmd.uid).name} legt eine Schutzplatte an.`});}
      else if(id==="reverse"){state.direction*=-1;event=makeEvent(state,"item",cmd.uid,"",{itemId:id,text:`${roomPlayer(room,cmd.uid).name} dreht die Zugrichtung um.`});}
      await fb.updateDoc(ref,{phase:state.phase,items:state.items,effects:state.effects,hp:state.hp,direction:state.direction,round:state.round,shellLive:state.shellLive,shellBlank:state.shellBlank,shellTotal:state.shellTotal,dealerEpoch:state.dealerEpoch,eventSeq:state.eventSeq,lastEvent:event,updatedAtMs:now()});
      if(state.phase==="reloading")scheduleReload(room.roomId,state.eventSeq);
      const s=chamberState();if(cmd.uid===ownUid()&&s){s.stats.itemsUsed++;persist();}
      await resolveCommandDoc(fb,cmd,"done",privateResult);return {ok:true,privateResult};
    }
    if(cmd.action!=="shoot"){await resolveCommandDoc(fb,cmd,"denied","Unbekannte Aktion.");return;}
    if(!validTarget(room,cmd.targetUid)){await resolveCommandDoc(fb,cmd,"denied","Dieses Ziel ist nicht mehr im Match.");return;}
    const shell=dealer.deck.shift();if(!shell){event=reloadState(room,state,dealer);await fb.updateDoc(ref,{round:state.round,items:state.items,shellLive:state.shellLive,shellBlank:state.shellBlank,shellTotal:state.shellTotal,dealerEpoch:state.dealerEpoch,eventSeq:state.eventSeq,lastEvent:event,updatedAtMs:now()});await resolveCommandDoc(fb,cmd,"done","Kammer neu geladen – schieße erneut.");return;}
    writeDealer(dealer);state.shellTotal=Math.max(0,state.shellTotal-1);if(shell==="live")state.shellLive=Math.max(0,state.shellLive-1);else state.shellBlank=Math.max(0,state.shellBlank-1);
    state.effects[cmd.uid] ||= {doubleNext:false,plate:false,jammed:false};state.effects[cmd.targetUid] ||= {doubleNext:false,plate:false,jammed:false};let damage=0;
    if(shell==="live"){
      damage=state.effects[cmd.uid].doubleNext?2:1;state.effects[cmd.uid].doubleNext=false;
      if(state.effects[cmd.targetUid].plate){damage=0;state.effects[cmd.targetUid].plate=false;}
      state.hp[cmd.targetUid]=Math.max(0,Number(state.hp[cmd.targetUid]||0)-damage);
      event=makeEvent(state,"shot-live",cmd.uid,cmd.targetUid,{shell,damage,text:"Scharfe Patrone"});
    }else event=makeEvent(state,"shot-blank",cmd.uid,cmd.targetUid,{shell,damage:0,text:"Leere Patrone"});
    state.effects[cmd.uid].jammed=false;
    const remaining=aliveUids({...room,hp:state.hp});if(remaining.length<=1){state.status="finished";state.phase="finished";state.winnerUid=remaining[0]||"";state.winnerName=state.winnerUid?roomPlayer(room,state.winnerUid).name:"";}
    else{
      const selfBlank=shell==="blank"&&cmd.targetUid===cmd.uid;if(!selfBlank)state.activeUid=nextTurn({...room,hp:state.hp,direction:state.direction},cmd.uid);state.turnStartedAtMs=now();if(state.shellTotal<=0)state.phase="reloading";
    }
    await fb.updateDoc(ref,{status:state.status,phase:state.phase,round:state.round,activeUid:state.activeUid,turnStartedAtMs:state.turnStartedAtMs,direction:state.direction,hp:state.hp,items:state.items,effects:state.effects,shellLive:state.shellLive,shellBlank:state.shellBlank,shellTotal:state.shellTotal,eventSeq:state.eventSeq,lastEvent:event,winnerUid:state.winnerUid,winnerName:state.winnerName,dealerEpoch:state.dealerEpoch,updatedAtMs:now()});
    if(state.phase==="reloading")scheduleReload(room.roomId,state.eventSeq);
    const s=chamberState();if(cmd.uid===ownUid()&&s){s.stats.shots++;if(shell==="live")s.stats.liveShots++;else s.stats.blankShots++;if(shell==="live"&&Number(state.hp[cmd.targetUid]||0)<=0&&cmd.targetUid!==cmd.uid)s.stats.eliminations++;persist();}
    await resolveCommandDoc(fb,cmd,"done",shell==="live"?(damage?`${damage} Schaden.`:"Schutzplatte blockiert den Treffer."):"KLICK – leer.");return {ok:true};
  }
  async function hostTimeoutCheck(){
    const room=UI.room;if(!room||!isHost(room)||room.status!=="playing"||room.phase!=="playing"||now()-Number(room.turnStartedAtMs||now())<TURN_MS+1200)return;
    const {fb}=await firebase();const snap=await fb.getDoc(roomRef(fb,room.roomId));if(!snap.exists())return;const latest={id:snap.id,...snap.data()};if(latest.status!=="playing"||latest.phase!=="playing"||now()-Number(latest.turnStartedAtMs||now())<TURN_MS)return;const state=roomUpdateBase(latest);state.effects[state.activeUid] ||= {doubleNext:false,plate:false,jammed:false};state.effects[state.activeUid].jammed=false;const actor=state.activeUid;state.activeUid=nextTurn(latest,actor);state.turnStartedAtMs=now();const event=makeEvent(state,"timeout",actor,"",{text:`${roomPlayer(latest,actor).name}s Zug wurde wegen Zeitüberschreitung beendet.`});await fb.updateDoc(roomRef(fb,room.roomId),{activeUid:state.activeUid,turnStartedAtMs:state.turnStartedAtMs,effects:state.effects,eventSeq:state.eventSeq,lastEvent:event,updatedAtMs:now()});
  }

  function parseGrantKind(kind){const raw=String(kind||"");if(raw.startsWith("skin:"))return ["shotgun",raw.slice(5)];const parts=raw.split(":");if(parts[0]==="shotgun")return ["shotgun",parts[1]||""];if(parts[0]==="shellLive")return ["live",parts[1]||""];if(parts[0]==="shellBlank")return ["blank",parts[1]||""];if(parts[0]==="itemSet")return ["items",parts[1]||""];return ["shotgun",raw];}
  function grantJkCoinPurchase(kind,amount=1){const [type,id]=parseGrantKind(kind);const meta=catalogFor(type)?.[id];if(!meta||meta.tier!=="jk")return false;const ok=grantCosmetic(type,id);if(!ok)return false;persist();if(UI.view==="skins")renderSkins(UI.selectedInventoryTab);if(UI.view==="owner")renderOwnerMenu();return true;}
  function isJkPurchaseOwned(kind){const [type,id]=parseGrantKind(kind);return ownedFor(type,id);}
  function getState(){const s=chamberState();return s?JSON.parse(JSON.stringify(s)):null;}

  function open(phoneItem=""){
    if(UI.overlay)return true;chamberState();UI.phoneItem=phoneItem||window.JKGamesOwnedPhoneItem?.()||"";
    const overlay=document.createElement("div");overlay.className="chamber-kl-overlay";overlay.dataset.chamberKl="1";document.body.append(overlay);UI.overlay=overlay;renderBase();renderLoading();return true;
  }
  function close(){
    stopRoomListeners();destroyScene();if(UI._hostWatch){clearInterval(UI._hostWatch);UI._hostWatch=0;}try{UI.overlay?.remove();}catch{}UI.overlay=null;UI.shell=null;UI.room=null;UI.roomId="";UI.view="";const phone=UI.phoneItem;UI.phoneItem="";setTimeout(()=>window.JKGamesOpenTopGames?.(phone),40);
  }

  window.ChamberKL=Object.freeze({version:VERSION,open,close,getState,grantJkCoinPurchase,isJkPurchaseOwned,items:ITEM_DEFS,skins:SHOTGUN_SKINS,shellSkins:SHELL_SKINS,itemSkins:ITEM_SKINS,botDifficulties:BOT_DIFFICULTIES});
})();
