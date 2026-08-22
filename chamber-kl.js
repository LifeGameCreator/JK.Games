(() => {
  "use strict";

  const VERSION = "20260822-chamber-kl-v1";
  const ROOM_COLLECTION = "chamberKlRooms";
  const COMMAND_COLLECTION = "commands";
  const MAX_HP = 4;
  const TURN_MS = 25000;
  const DEALER_KEY_PREFIX = "jkgames-chamber-kl-dealer:";
  const LOCAL_SETTLED_KEY = "jkgames-chamber-kl-settled-v1";
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
  const SKINS = Object.freeze({
    standard: { name:"Standard", className:"standard" },
    carbon: { name:"Carbon", className:"carbon" },
    redline: { name:"Redline", className:"redline" },
    galaxy: { name:"Galaxy", className:"galaxy" },
    gold: { name:"Gold", className:"gold" },
    crystal: { name:"Crystal", className:"crystal" }
  });

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
    lastCommandResult:""
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
    s.ownedSkins = Array.isArray(s.ownedSkins) ? [...new Set(["standard",...s.ownedSkins.filter(id=>SKINS[id])])] : ["standard"];
    s.equippedSkin = s.ownedSkins.includes(s.equippedSkin) ? s.equippedSkin : "standard";
    s.stats ||= { matches:0,wins:0,shots:0,liveShots:0,blankShots:0,itemsUsed:0,eliminations:0,fourTableWins:0 };
    s.stats.matches=Math.max(0,Math.floor(Number(s.stats.matches)||0));
    s.stats.wins=Math.max(0,Math.floor(Number(s.stats.wins)||0));
    s.stats.shots=Math.max(0,Math.floor(Number(s.stats.shots)||0));
    s.stats.liveShots=Math.max(0,Math.floor(Number(s.stats.liveShots)||0));
    s.stats.blankShots=Math.max(0,Math.floor(Number(s.stats.blankShots)||0));
    s.stats.itemsUsed=Math.max(0,Math.floor(Number(s.stats.itemsUsed)||0));
    s.stats.eliminations=Math.max(0,Math.floor(Number(s.stats.eliminations)||0));
    s.stats.fourTableWins=Math.max(0,Math.floor(Number(s.stats.fourTableWins)||0));
    return s;
  }
  function persist(){try{window.JKGamesPersistState?.();}catch(error){console.warn("Chamber.KL speichern",error);}}
  function currentSkin(){return chamberState()?.equippedSkin || "standard";}
  function profileFromState(uid){
    const root=rootState()||{};
    const appearance=root.appearance||{};
    const full=`${root.firstName||"Spieler"} ${root.lastName||""}`.trim().replace(/\s+/g," ").slice(0,60)||"Spieler";
    const hair=String(appearance.hairColor||appearance.hair||"#3b2b24").slice(0,24);
    const skin=String(appearance.skinColor||appearance.skinTone||"#d6a77f").slice(0,24);
    return {uid,name:full,gender:root.gender==="female"?"female":"male",hairColor:hair,skinColor:skin,shotgunSkin:currentSkin()};
  }

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
    const s=chamberState();if(!s)return"";
    return `<div class="chkl-stats-strip"><span><small>MATCHES</small><b>${s.stats.matches}</b></span><span><small>SIEGE</small><b>${s.stats.wins}</b></span><span><small>SCHÜSSE</small><b>${s.stats.shots}</b></span><span><small>ELIM.</small><b>${s.stats.eliminations}</b></span></div>`;
  }
  function renderHome(){
    UI.view="home";UI.roomId="";UI.room=null;stopRoomListeners();
    const skin=SKINS[currentSkin()]||SKINS.standard;
    UI.shell.innerHTML=`${topbar("RISK TABLE")}
      <main class="chkl-home">
        <section class="chkl-hero"><div class="chkl-hero-copy"><small>2–4 SPIELER · ONLINE</small><h2>Niemand kennt die nächste Patrone.</h2><p>Setz dich an den Tisch, nutze deine Items und entscheide, ob du das Risiko gegen dich selbst oder gegen einen Gegner nimmst.</p><div class="chkl-hero-actions"><button class="primary" data-chkl-quick>⚡ Schnelles Duell</button><button data-chkl-public>Öffentliche Räume</button></div></div><div class="chkl-hero-gun"><div class="chkl-shotgun skin-${skin.className}"><i class="chkl-stock"></i><i class="chkl-body"></i><i class="chkl-barrel"></i></div><small>AKTIV</small><b>${esc(skin.name)}</b></div></section>
        ${statsHtml()}
        <section class="chkl-home-grid">
          <article><small>RAUM ERSTELLEN</small><h3>Eigener Tisch</h3><p>Öffentlich oder privat, für zwei bis vier Spieler.</p><div class="chkl-room-create-row"><select data-chkl-size><option value="2">2 Spieler</option><option value="3">3 Spieler</option><option value="4">4 Spieler</option></select><button data-chkl-create-public>Öffentlich</button><button data-chkl-create-private>Privat</button></div></article>
          <article><small>PRIVATER CODE</small><h3>Freunden beitreten</h3><p>Sechsstelligen Chamber-Code eingeben.</p><div class="chkl-code-row"><input maxlength="6" data-chkl-code placeholder="ABC234" autocomplete="off"><button data-chkl-join-code>Beitreten</button></div></article>
          <article><small>JK/COIN</small><h3>Shotgun-Designs</h3><p>Nur kosmetisch. Jede Shotgun besitzt exakt dieselbe Spielstärke.</p><div class="chkl-skin-preview-row">${Object.entries(SKINS).map(([id,meta])=>`<span class="skin-${meta.className} ${chamberState()?.ownedSkins.includes(id)?"owned":""}" title="${esc(meta.name)}"></span>`).join("")}</div><button data-chkl-skins>Skins verwalten</button></article>
          <article><small>REGELN</small><h3>Vier Leben. Eine Kammer.</h3><p>Leere Patrone auf dich selbst: du bleibst dran. Scharfe Treffer kosten Leben. Nach leerer Kammer gibt es neue Items.</p><button data-chkl-rules>Items ansehen</button></article>
        </section>
      </main>`;
    bindTopbar();
    UI.shell.querySelector("[data-chkl-quick]")?.addEventListener("click",quickDuel);
    UI.shell.querySelector("[data-chkl-public]")?.addEventListener("click",showPublicRooms);
    UI.shell.querySelector("[data-chkl-create-public]")?.addEventListener("click",()=>createRoom("public",Number(UI.shell.querySelector("[data-chkl-size]")?.value)||2));
    UI.shell.querySelector("[data-chkl-create-private]")?.addEventListener("click",()=>createRoom("private",Number(UI.shell.querySelector("[data-chkl-size]")?.value)||2));
    UI.shell.querySelector("[data-chkl-join-code]")?.addEventListener("click",()=>joinByCode(UI.shell.querySelector("[data-chkl-code]")?.value));
    UI.shell.querySelector("[data-chkl-code]")?.addEventListener("input",e=>e.target.value=e.target.value.toUpperCase().replace(/[^A-Z2-9]/g,"").slice(0,6));
    UI.shell.querySelector("[data-chkl-code]")?.addEventListener("keydown",e=>{if(e.key==="Enter")joinByCode(e.target.value);});
    UI.shell.querySelector("[data-chkl-skins]")?.addEventListener("click",renderSkins);
    UI.shell.querySelector("[data-chkl-rules]")?.addEventListener("click",renderRules);
  }
  function renderRules(){
    UI.view="rules";
    UI.shell.innerHTML=`${topbar("SPIELREGELN")}<main class="chkl-page"><button class="chkl-back" data-chkl-back>← Zurück</button><section class="chkl-page-head"><small>VERSION 1</small><h2>Items & Tischregeln</h2><p>Alle Effekte sind Teil von Chamber.KL und verändern niemals dein LifeBuilder-Geld oder Inventar.</p></section><div class="chkl-item-guide">${Object.entries(ITEM_DEFS).map(([id,item])=>`<article><i>${item.icon}</i><div><b>${esc(item.name)}</b><p>${esc(item.text)}</p></div></article>`).join("")}</div><section class="chkl-rule-card"><b>Leere Patrone auf dich selbst</b><p>Du bleibst am Zug. Bei einem scharfen Treffer oder einem Schuss auf einen Gegner wechselt der Zug.</p></section><section class="chkl-rule-card"><b>Dealer</b><p>Die noch unbekannte Patronenreihenfolge wird nicht in das öffentlich lesbare Match-Dokument geschrieben. Firestore synchronisiert nur sichtbare Ergebnisse und Spielaktionen.</p></section></main>`;
    bindTopbar();UI.shell.querySelector("[data-chkl-back]")?.addEventListener("click",renderHome);
  }
  function renderSkins(){
    UI.view="skins";const s=chamberState();
    UI.shell.innerHTML=`${topbar("SHOTGUN SKINS")}<main class="chkl-page"><button class="chkl-back" data-chkl-back>← Zurück</button><section class="chkl-page-head"><small>JK/COIN · NUR KOSMETIK</small><h2>Deine Shotgun</h2><p>Gekaufte Designs haben keinen Einfluss auf Schaden, Items oder Patronen.</p></section><div class="chkl-skin-grid">${Object.entries(SKINS).map(([id,meta])=>{const owned=s?.ownedSkins.includes(id);const active=s?.equippedSkin===id;return `<article class="${active?"active":""}"><div class="chkl-shotgun skin-${meta.className}"><i class="chkl-stock"></i><i class="chkl-body"></i><i class="chkl-barrel"></i></div><small>${id==="standard"?"INKLUSIVE":"JK/COIN"}</small><h3>${esc(meta.name)}</h3>${owned?`<button data-chkl-equip="${id}" ${active?"disabled":""}>${active?"Ausgerüstet":"Ausrüsten"}</button>`:`<button data-chkl-open-jk="${id}">Im JK/Coin-Shop ansehen</button>`}</article>`;}).join("")}</div></main>`;
    bindTopbar();UI.shell.querySelector("[data-chkl-back]")?.addEventListener("click",renderHome);
    UI.shell.querySelectorAll("[data-chkl-equip]").forEach(btn=>btn.addEventListener("click",()=>{const id=btn.dataset.chklEquip;if(!s?.ownedSkins.includes(id))return;s.equippedSkin=id;persist();renderSkins();}));
    UI.shell.querySelectorAll("[data-chkl-open-jk]").forEach(btn=>btn.addEventListener("click",()=>window.JKCoinApp?.openForGame?.("chamber")));
  }

  async function uniqueRoomId(fb){for(let i=0;i<12;i++){const id=randomRoomId();const snap=await fb.getDoc(roomRef(fb,id));if(!snap.exists())return id;}throw new Error("Kein freier Raumcode gefunden.");}
  function emptyRoom(id,hostUid,profile,visibility,maxPlayers){
    return {roomId:id,hostUid,visibility,maxPlayers,currentPlayers:1,playerUids:[hostUid],profiles:{[hostUid]:{...profile,seat:0}},status:"waiting",phase:"waiting",round:0,turnOrder:[],activeUid:"",turnStartedAtMs:0,direction:1,hp:{},items:{},effects:{},shellLive:0,shellBlank:0,shellTotal:0,eventSeq:0,lastEvent:{id:"",type:"waiting",actorUid:"",targetUid:"",itemId:"",shell:"",damage:0,text:"Warteraum geöffnet",atMs:now()},winnerUid:"",winnerName:"",dealerEpoch:0,createdAtMs:now(),updatedAtMs:now(),version:VERSION};
  }
  async function createRoom(visibility="public",maxPlayers=2){
    if(UI.lobbyBusy)return;UI.lobbyBusy=true;setBusy(true);
    try{const {fb,user}=await firebase();const id=await uniqueRoomId(fb);const data=emptyRoom(id,user.uid,profileFromState(user.uid),visibility,clamp(Math.floor(maxPlayers),2,4));await fb.setDoc(roomRef(fb,id),data);openRoom(id);}
    catch(error){toast(error.message||error,"error");}finally{UI.lobbyBusy=false;setBusy(false);}
  }
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
    return `<div class="chkl-character ${profile?.gender==="female"?"female":"male"} ${alive?"":"out"}" style="--hair:${esc(hair)};--skin:${esc(skin)}"><i class="hair"></i><i class="head"></i><i class="body"></i></div>`;
  }
  function renderLobby(){
    const room=UI.room;if(!room||!UI.shell)return;UI.view="lobby";
    UI.shell.innerHTML=`${topbar(room.visibility==="private"?"PRIVATER TISCH":"ÖFFENTLICHER TISCH")}<main class="chkl-lobby"><section class="chkl-lobby-code"><small>RAUMCODE</small><strong>${esc(room.roomId)}</strong><span>${room.visibility==="private"?"Nur mit Code beitretbar":"Öffentlich sichtbar"}</span></section><section class="chkl-lobby-table"><div class="chkl-table-surface"><div class="chkl-table-logo">CHAMBER.KL</div>${Array.from({length:room.maxPlayers},(_,seat)=>{const uid=room.playerUids?.[seat];const p=uid?roomPlayer(room,uid):null;return `<article class="chkl-lobby-seat seat-${seat} ${uid?"filled":"empty"}">${p?`${characterHtml(p,true)}<b>${esc(p.name)}</b><small>${uid===room.hostUid?"HOST":"BEREIT"}</small>`:`<span>+</span><b>Freier Platz</b>`}</article>`;}).join("")}</div></section><section class="chkl-lobby-controls"><div><b>${room.currentPlayers}/${room.maxPlayers} Spieler am Tisch</b><small>${room.currentPlayers<2?"Mindestens zwei Spieler werden benötigt.":"Der Host kann das Match starten."}</small></div>${isHost(room)?`<button class="primary" data-chkl-start ${room.currentPlayers<2?"disabled":""}>Match starten</button>`:`<span class="chkl-waiting">Warte auf den Host …</span>`}<button data-chkl-leave>Raum verlassen</button></section></main>`;
    bindTopbar();UI.shell.querySelector("[data-chkl-start]")?.addEventListener("click",startMatch);UI.shell.querySelector("[data-chkl-leave]")?.addEventListener("click",leaveRoom);
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

  function shotgunHtml(room){const active=roomPlayer(room,room.activeUid);const skin=SKINS[active.shotgunSkin]||SKINS.standard;const shells=[...Array(Math.max(0,Number(room.shellLive)||0)).fill("live"),...Array(Math.max(0,Number(room.shellBlank)||0)).fill("blank")];return `<div class="chkl-shotgun-stage" data-chkl-gun-stage><div class="chkl-reload-shells" aria-hidden="true">${shells.map((type,index)=>`<i class="${type}" style="--i:${index}"></i>`).join("")}</div><div class="chkl-shotgun skin-${skin.className}" data-chkl-shotgun><i class="chkl-stock"></i><i class="chkl-body"></i><i class="chkl-barrel"></i><i class="chkl-trigger"></i></div><div class="chkl-shell-counter"><span class="live"><i></i>${room.shellLive} scharf</span><span class="blank"><i></i>${room.shellBlank} leer</span></div></div>`;}
  function hpHtml(hp){return `<div class="chkl-hp">${Array.from({length:MAX_HP},(_,i)=>`<i class="${i<hp?"on":""}">♥</i>`).join("")}</div>`;}
  function seatHtml(room,uid,index){const p=roomPlayer(room,uid),hp=Number(room.hp?.[uid]||0),alive=hp>0,active=room.activeUid===uid,own=uid===ownUid(),target=UI.selectedTarget===uid;const effect=room.effects?.[uid]||{};return `<button type="button" class="chkl-seat seat-${index} ${alive?"alive":"out"} ${active?"active":""} ${own?"own":""} ${target?"target":""}" data-chkl-target="${esc(uid)}" ${alive?"":"disabled"}>${characterHtml(p,alive)}<div class="chkl-seat-copy"><small>${own?"DU":uid===room.hostUid?"HOST":"SPIELER"}</small><b>${esc(p.name)}</b>${hpHtml(hp)}<div class="chkl-effect-row">${effect.plate?"<span title='Schutzplatte'>⬡</span>":""}${effect.doubleNext?"<span title='Doppelladung'>Ⅱ</span>":""}${effect.jammed?"<span title='Störsender'>⌁</span>":""}</div></div></button>`;}
  function lastEventText(room){const e=room.lastEvent||{};if(e.type==="shot-live")return `${roomPlayer(room,e.actorUid).name} feuert auf ${roomPlayer(room,e.targetUid).name}: ${e.damage>0?`${e.damage} Schaden`:"Schutzplatte blockiert"}.`;if(e.type==="shot-blank")return `${roomPlayer(room,e.actorUid).name}: KLICK – leere Patrone.`;if(e.type==="reload")return e.text||"Neue Kammer wird geladen.";if(e.type==="item")return e.text||"Item eingesetzt.";if(e.type==="eject")return `${roomPlayer(room,e.actorUid).name} wirft eine ${e.shell==="live"?"scharfe":"leere"} Patrone aus.`;if(e.type==="eliminated")return e.text||"Spieler ausgeschieden.";if(e.type==="timeout")return e.text||"Zug übersprungen.";return e.text||"Match läuft.";}
  function itemsHtml(room){const uid=ownUid(),items=room.items?.[uid]||[],jammed=!!room.effects?.[uid]?.jammed;return `<div class="chkl-items"><div class="chkl-panel-title"><div><small>DEINE ITEMS</small><b>${jammed?"Störsender aktiv":"Beliebig vor dem Schuss nutzen"}</b></div><span>${items.length}/8</span></div><div class="chkl-item-row">${items.length?items.map((id,index)=>{const item=ITEM_DEFS[id]||{icon:"?",name:id,text:""};return `<button data-chkl-item="${esc(id)}" data-chkl-item-index="${index}" ${jammed?"disabled":""} title="${esc(item.text)}"><i>${item.icon}</i><b>${esc(item.name)}</b></button>`;}).join(""):`<div class="chkl-no-items">Keine Items</div>`}</div></div>`;}
  function actionHtml(room){const uid=ownUid(),alive=Number(room.hp?.[uid]||0)>0,ownTurn=room.activeUid===uid&&alive,active=roomPlayer(room,room.activeUid);const target=UI.selectedTarget&&Number(room.hp?.[UI.selectedTarget]||0)>0?UI.selectedTarget:"";if(room.phase==="reloading")return `<section class="chkl-action-panel waiting"><div class="chkl-turn-info"><small>KAMMER</small><b>Neue Patronen werden geladen</b><span>…</span></div><div class="chkl-watch"><span class="pulse"></span><p>Die Shotgun wird neu bestückt. Danach läuft der Zug automatisch weiter.</p></div></section>`;return `<section class="chkl-action-panel ${ownTurn?"ready":"waiting"}"><div class="chkl-turn-info"><small>${ownTurn?"DEIN ZUG":"AKTUELL AM ZUG"}</small><b>${ownTurn?"Ziel wählen und entscheiden":esc(active.name)}</b><span data-chkl-timer>--</span></div>${ownTurn?`${itemsHtml(room)}<div class="chkl-shoot-row"><div><small>AUSGEWÄHLTES ZIEL</small><b>${target?esc(roomPlayer(room,target).name):"Noch niemand"}</b><em>${target===uid?"Leere Patrone = du bleibst dran":"Scharfer Treffer = Leben verlieren"}</em></div><button class="primary danger" data-chkl-shoot ${target?"":"disabled"}>SHOTGUN AUSLÖSEN</button></div>`:`<div class="chkl-watch"><span class="pulse"></span><p>Du siehst jede Aktion dieses Spielers live über Firebase.</p></div>`}</section>`;}
  function renderGame(){
    const room=UI.room;if(!room||!UI.shell)return;UI.view="game";
    const living=aliveUids(room);if(!UI.selectedTarget||!living.includes(UI.selectedTarget)){const own=ownUid();UI.selectedTarget=living.find(uid=>uid!==own)||living[0]||"";}
    if(room.status==="finished")return renderFinished();
    UI.shell.innerHTML=`${topbar(`RUNDE ${room.round}`)}<main class="chkl-game"><section class="chkl-table-wrap"><div class="chkl-table"><div class="chkl-table-center">${shotgunHtml(room)}<div class="chkl-event-feed" data-chkl-event>${esc(lastEventText(room))}</div></div>${(room.turnOrder||room.playerUids||[]).map((uid,index)=>seatHtml(room,uid,index)).join("")}</div></section>${actionHtml(room)}</main>`;
    bindTopbar();
    UI.shell.querySelectorAll("[data-chkl-target]").forEach(btn=>btn.addEventListener("click",()=>{if(UI.room?.activeUid!==ownUid())return;UI.selectedTarget=btn.dataset.chklTarget;renderGame();}));
    UI.shell.querySelector("[data-chkl-shoot]")?.addEventListener("click",()=>sendAction("shoot",{targetUid:UI.selectedTarget}));
    UI.shell.querySelectorAll("[data-chkl-item]").forEach(btn=>btn.addEventListener("click",()=>{const id=btn.dataset.chklItem,item=ITEM_DEFS[id];if(item?.target&&(!UI.selectedTarget||UI.selectedTarget===ownUid()))return toast("Wähle zuerst einen anderen lebenden Spieler als Ziel.","error");sendAction("item",{itemId:id,targetUid:item?.target?UI.selectedTarget:""});}));
    startTicker();
  }
  function startTicker(){clearInterval(UI.ticker);const update=()=>{const node=UI.shell?.querySelector("[data-chkl-timer]");if(!node||!UI.room)return;const left=Math.max(0,TURN_MS-(now()-Number(UI.room.turnStartedAtMs||now())));node.textContent=`${Math.ceil(left/1000)}s`;node.classList.toggle("urgent",left<6000);};update();UI.ticker=setInterval(update,500);}
  function renderFinished(){
    const room=UI.room;if(!room)return;settleLocalStats(room);
    const winner=roomPlayer(room,room.winnerUid);const ownWin=room.winnerUid===ownUid();
    UI.shell.innerHTML=`${topbar("MATCH BEENDET")}<main class="chkl-finished"><div class="chkl-winner-glow"></div>${characterHtml(winner,true)}<small>${ownWin?"DU GEWINNST":"GEWINNER"}</small><h2>${esc(winner.name)}</h2><p>${room.currentPlayers>=4?"Vierertisch beendet":"Duell beendet"} · Runde ${room.round}</p><div class="chkl-finish-actions"><button class="primary" data-chkl-home>Zurück zu Chamber.KL</button><button data-chkl-topgames>Top Games</button></div>${statsHtml()}</main>`;
    bindTopbar();UI.shell.querySelector("[data-chkl-home]")?.addEventListener("click",async()=>{const finished=UI.room;if(finished&&isHost(finished)){try{const {fb,user}=await firebase();await deleteRoomTree(fb,finished,user.uid);}catch{}}renderHome();});UI.shell.querySelector("[data-chkl-topgames]")?.addEventListener("click",requestClose);
  }
  function settledSet(){try{return new Set(JSON.parse(localStorage.getItem(LOCAL_SETTLED_KEY)||"[]"));}catch{return new Set();}}
  function settleLocalStats(room){
    const set=settledSet();if(set.has(room.roomId))return;set.add(room.roomId);try{localStorage.setItem(LOCAL_SETTLED_KEY,JSON.stringify([...set].slice(-80)));}catch{}
    const s=chamberState();if(!s)return;s.stats.matches++;if(room.winnerUid===ownUid()){s.stats.wins++;if(Number(room.maxPlayers||0)===4)s.stats.fourTableWins++;try{window.JKGamesAwardTopGameXp?.("chamber",60,"Chamber.KL Sieg",{eventKey:`chamber:${room.roomId}`});}catch{}}persist();
  }

  function animateEvent(event){
    if(!UI.overlay||UI.view!=="game")return;const stage=UI.overlay.querySelector("[data-chkl-gun-stage]"),gun=UI.overlay.querySelector("[data-chkl-shotgun]");if(!stage||!gun)return;
    stage.classList.remove("reload","fire","blank","item");void stage.offsetWidth;
    if(event.type==="reload")stage.classList.add("reload");else if(event.type==="shot-live")stage.classList.add("fire");else if(event.type==="shot-blank")stage.classList.add("blank");else stage.classList.add("item");
    setTimeout(()=>stage?.classList.remove("reload","fire","blank","item"),1200);
  }

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
  }
  async function startHostCommandListener(){
    try{const {fb}=await firebase();const q=fb.query(fb.collection(fb.db,ROOM_COLLECTION,UI.roomId,COMMAND_COLLECTION),fb.where("status","==","pending"),fb.limit(25));UI.commandUnsub=fb.onSnapshot(q,snap=>{for(const change of snap.docChanges()){if(change.type!=="added"&&change.type!=="modified")continue;const data=change.doc.data();if(data.status!=="pending")continue;UI.hostQueue=UI.hostQueue.then(()=>hostProcessCommand({id:change.doc.id,...data},false)).catch(error=>console.warn("Chamber.KL Host Command",error));}},error=>console.warn("Chamber.KL Commands",error));}
    catch(error){console.warn("Chamber.KL Host Listener",error);}
  }
  async function resolveCommandDoc(fb,cmd,status,result=""){if(cmd.id.startsWith("local-"))return;try{await fb.updateDoc(commandRef(fb,UI.roomId,cmd.id),{status,result:String(result||"").slice(0,120),resolvedAtMs:now()});}catch(error){console.warn("Chamber.KL Command resolve",error);}}
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

  function grantJkCoinPurchase(kind,amount=1){
    const id=String(kind||"").replace(/^skin:/,"");if(!SKINS[id]||id==="standard")return false;const s=chamberState();if(!s)return false;if(!s.ownedSkins.includes(id))s.ownedSkins.push(id);persist();if(UI.view==="skins")renderSkins();return true;
  }
  function isJkPurchaseOwned(kind){const id=String(kind||"").replace(/^skin:/,"");return !!chamberState()?.ownedSkins?.includes(id);}
  function getState(){const s=chamberState();return s?JSON.parse(JSON.stringify(s)):null;}

  function open(phoneItem=""){
    if(UI.overlay)return true;chamberState();UI.phoneItem=phoneItem||window.JKGamesOwnedPhoneItem?.()||"";
    const overlay=document.createElement("div");overlay.className="chamber-kl-overlay";overlay.dataset.chamberKl="1";document.body.append(overlay);UI.overlay=overlay;renderBase();renderLoading();return true;
  }
  function close(){
    stopRoomListeners();if(UI._hostWatch){clearInterval(UI._hostWatch);UI._hostWatch=0;}try{UI.overlay?.remove();}catch{}UI.overlay=null;UI.shell=null;UI.room=null;UI.roomId="";UI.view="";const phone=UI.phoneItem;UI.phoneItem="";setTimeout(()=>window.JKGamesOpenTopGames?.(phone),40);
  }

  window.ChamberKL=Object.freeze({version:VERSION,open,close,getState,grantJkCoinPurchase,isJkPurchaseOwned,items:ITEM_DEFS,skins:SKINS});
})();
