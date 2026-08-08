import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

(() => {
  'use strict';

  const VERSION = '2026-08-08-speed-car-kl-v250-touch-countdown-cop-ramp-fix';
  const STORAGE_KEY = 'jk-games-speed-car-kl-v242';
  const ASSET = 'assets/speed-car-kl/';
  const PACK_URL = `${ASSET}low_poly_cars.glb`;
  const GAS_STATION_URL = `${ASSET}Tankstelle.glb`;
  const CUSTOM_MAP_CONFIG_KEY = 'jk-games-speed-car-kl-custom-map';
  const MAX_REMOTE_PLAYERS = 32;

  const CAR_CATALOG = [
    { id:'street-01', name:'Street Compact', source:'pack', packIndex:0, speed:98, accel:28, price:0, className:'Starter', hp:100, fuel:100 },
    { id:'street-02', name:'City Sprint', source:'pack', packIndex:1, speed:112, accel:30, price:2500, className:'Street', hp:105, fuel:102 },
    { id:'street-03', name:'Urban GT', source:'pack', packIndex:2, speed:126, accel:32, price:7500, className:'Street+', hp:110, fuel:104 },
    { id:'street-04', name:'Night Coupe', source:'pack', packIndex:3, speed:142, accel:34, price:18000, className:'Sport', hp:112, fuel:106 },
    { id:'street-05', name:'Apex Roadster', source:'pack', packIndex:4, speed:158, accel:36, price:42000, className:'Sport', hp:115, fuel:108 },
    { id:'street-06', name:'Velocity RS', source:'pack', packIndex:6, speed:176, accel:39, price:90000, className:'Sport+', hp:118, fuel:110 },
    { id:'street-07', name:'Turbo X', source:'pack', packIndex:7, speed:196, accel:42, price:190000, className:'Super Street', hp:120, fuel:112 },
    { id:'street-08', name:'Phantom R', source:'pack', packIndex:8, speed:216, accel:45, price:380000, className:'Super Street', hp:122, fuel:114 },
    { id:'street-09', name:'Vortex GT', source:'pack', packIndex:9, speed:235, accel:48, price:700000, className:'Super', hp:125, fuel:116 },
    { id:'muscle', name:'Muscle RIGGED', source:'file', url:`${ASSET}low_poly_car_rigged.glb`, speed:248, accel:44, price:950000, className:'Muscle', hp:150, fuel:120 },
    { id:'sports', name:'Low Poly Sports', source:'file', url:`${ASSET}low_poly_sports_car.glb`, speed:268, accel:52, price:1350000, className:'Special Sport', hp:130, fuel:118 },
    { id:'super', name:'Super Car', source:'file', url:`${ASSET}super_car.glb`, speed:305, accel:60, price:2250000, className:'Super Car', hp:135, fuel:122 },
    { id:'owner-bugatti', name:'Owner Bugatti Chiron', source:'file', url:`${ASSET}lowpoly_bugatti_chiron.glb`, speed:390, accel:82, price:0, className:'OWNER', hp:500, fuel:250, ownerOnly:true, galaxy:true },
    { id:'owner-f22', name:'Owner F-22A Raptor', source:'file', url:`${ASSET}low_poly_11_usaf_f22a_raptor.glb`, speed:980, accel:180, price:0, className:'OWNER FLIGHT', hp:9999, fuel:9999, ownerOnly:true, aircraft:true, galaxy:true }
  ];

  const POLICE_CATALOG = [
    { id:'police-pack', name:'Interceptor Unit', source:'pack', packIndex:5 },
    { id:'police-6', name:'Police Transport 6', source:'file', url:`${ASSET}low_poly_car_6.glb` },
    { id:'police-low', name:'Police Low Poly', source:'file', url:`${ASSET}police_car_low_poly.glb` }
  ];

  const UI = {
    overlay:null,
    body:null,
    sourcePhone:'',
    session:null,
    keys:Object.create(null),
    touch:{ gas:false, brake:false, left:false, right:false, nitro:false },
    toastTimer:0,
    resizeHandler:null
  };

  const LOADER = new GLTFLoader();
  const MODEL_CACHE = new Map();
  let PACK_SCENE_PROMISE = null;
  let STATE_CACHE = null;

  function createGameTimer(){
    const timer = new THREE.Timer();
    try { timer.connect(document); } catch {}
    timer.update();
    return timer;
  }
  const clamp = (n,a,b) => Math.max(a, Math.min(b, Number(n)||0));
  const approach = (value,target,step) => value<target?Math.min(target,value+step):Math.max(target,value-step);
  const angleDelta = (from,to) => Math.atan2(Math.sin(to-from),Math.cos(to-from));
  const lerpAngle = (from,to,t) => from + angleDelta(from,to)*clamp(t,0,1);
  const speedText = (speed) => speed < -0.5 ? `R ${Math.round(Math.abs(speed))} km/h` : `${Math.round(Math.max(0,speed))} km/h`;
  const fmt = (n) => Math.max(0, Math.floor(Number(n)||0)).toLocaleString('de-DE');
  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const carById = (id) => CAR_CATALOG.find(car => car.id === id) || CAR_CATALOG[0];
  const isOwner = () => !!(window.LifeBuilderSettingsMenu?.isOwner?.() || window.LifeBuilderSettingsMenu?.getRole?.()?.role === 'owner');
  const rootState = () => window.JKGamesGetActiveState?.() || null;

  function defaultState(){
    return {
      version:2,
      coins:2500,
      selectedCar:'street-01',
      owned:{'street-01':true},
      tuning:{},
      consumables:{nitro:1,repairKit:0,fuelCan:0,tuneToken:0},
      stats:{bestDistance:0,totalDistance:0,chases:0,busted:0,lobbyDamage:0,lobbyKOs:0},
      settings:{quality:'auto'},
      customMapUrl:''
    };
  }

  function normalizeState(raw){
    const base=defaultState();
    const src=raw&&typeof raw==='object'?raw:{};
    base.coins=Math.max(0,Number(src.coins??base.coins)||0);
    base.selectedCar=String(src.selectedCar||base.selectedCar);
    base.owned={...base.owned,...(src.owned&&typeof src.owned==='object'?src.owned:{})};
    base.tuning=src.tuning&&typeof src.tuning==='object'?src.tuning:{};
    base.consumables={...base.consumables,...(src.consumables&&typeof src.consumables==='object'?src.consumables:{})};
    base.stats={...base.stats,...(src.stats&&typeof src.stats==='object'?src.stats:{})};
    base.settings={...base.settings,...(src.settings&&typeof src.settings==='object'?src.settings:{})};
    base.customMapUrl=String(src.customMapUrl||'');
    if(!carById(base.selectedCar) || (carById(base.selectedCar).ownerOnly&&!isOwner())) base.selectedCar='street-01';
    return base;
  }

  function state(){
    const root=rootState();
    if(root){
      if(root.speedCarKL?.version===2) return root.speedCarKL;
      root.speedCarKL=normalizeState(root.speedCarKL);
      return root.speedCarKL;
    }
    if(STATE_CACHE?.version===2) return STATE_CACHE;
    try{STATE_CACHE=normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'));}catch{STATE_CACHE=defaultState();}
    return STATE_CACHE;
  }

  function persist(data=state()){
    const root=rootState();
    if(root){
      root.speedCarKL=data;
      window.JKGamesPersistState?.();
    } else {
      try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data));}catch{}
    }
    window.dispatchEvent(new CustomEvent('speed-car-kl-state-changed',{detail:{coins:data.coins,selectedCar:data.selectedCar}}));
  }

  function tuningFor(data, carId){
    const t=data.tuning[carId]&&typeof data.tuning[carId]==='object'?data.tuning[carId]:{};
    const out={engine:clamp(Math.floor(t.engine||0),0,10),armor:clamp(Math.floor(t.armor||0),0,10),tank:clamp(Math.floor(t.tank||0),0,10)};
    data.tuning[carId]=out;
    return out;
  }

  function specs(data, carId){
    const car=carById(carId), t=tuningFor(data,carId);
    return {
      maxSpeed:car.speed*(1+t.engine*0.045),
      accel:car.accel*(1+t.engine*0.035),
      maxHp:car.hp*(1+t.armor*0.12),
      maxFuel:car.fuel*(1+t.tank*0.10),
      tuneTotal:t.engine+t.armor+t.tank
    };
  }

  function tuneCost(carId, type, next){
    const car=carById(carId);
    const factor={engine:1.5,armor:1.0,tank:.75}[type]||1;
    return Math.max(800,Math.round((Math.max(2500,car.price*.075)+2200*Math.pow(next,2.1))*factor));
  }

  function toast(text, tone=''){
    if(!UI.overlay)return;
    let node=UI.overlay.querySelector('[data-sckl-toast]');
    if(!node){node=document.createElement('div');node.className='sckl-toast';node.dataset.scklToast='1';UI.overlay.append(node);}
    node.textContent=String(text||'');node.className=`sckl-toast show ${tone}`;
    clearTimeout(UI.toastTimer);UI.toastTimer=setTimeout(()=>node?.classList.remove('show'),2600);
  }

  function roleBadge(){return isOwner()?'<span class="sckl-role owner">OWNER</span>':'<span class="sckl-role">PLAYER</span>';}

  function open(sourcePhone=''){
    close(false);
    UI.sourcePhone=sourcePhone||window.JKGamesOwnedPhoneItem?.()||'';
    const overlay=document.createElement('section');
    overlay.className='speed-car-kl-overlay';
    overlay.innerHTML=`<div class="sckl-shell"><header class="sckl-topbar"><div class="sckl-brand"><small>JK.GAMES · TOP GAME</small><h1>Speed Car.KL</h1></div><div class="sckl-top-stats"><span><small>SPEED COINS</small><b data-sckl-coins>0</b></span><span><small>BESTE FLUCHT</small><b data-sckl-best>0 m</b></span></div><div class="sckl-top-actions"><button type="button" data-sckl-jk>JK</button><button type="button" data-sckl-home>⌂</button><button type="button" data-sckl-close>×</button></div></header><main class="sckl-body" data-sckl-body></main></div>`;
    document.body.append(overlay);document.body.classList.add('speed-car-kl-open');UI.overlay=overlay;UI.body=overlay.querySelector('[data-sckl-body]');
    overlay.querySelector('[data-sckl-close]')?.addEventListener('click',()=>returnToTopGames());
    overlay.querySelector('[data-sckl-home]')?.addEventListener('click',()=>{stopWorld();renderHome();});
    overlay.querySelector('[data-sckl-jk]')?.addEventListener('click',()=>window.JKCoinApp?.openForGame?.('speedcar'));
    window.addEventListener('keydown',onKeyDown,{passive:false});window.addEventListener('keyup',onKeyUp,{passive:false});
    UI.resizeHandler=()=>resizeWorld();window.addEventListener('resize',UI.resizeHandler,{passive:true});
    renderHome();
    setTimeout(()=>window.JKCoinApp?.applyPendingGameEntitlements?.(),600);
  }

  function close(returnPhone=false){
    stopWorld();
    window.removeEventListener('keydown',onKeyDown);window.removeEventListener('keyup',onKeyUp);if(UI.resizeHandler)window.removeEventListener('resize',UI.resizeHandler);
    UI.overlay?.remove();UI.overlay=null;UI.body=null;document.body.classList.remove('speed-car-kl-open');
    if(returnPhone)returnToTopGames();
  }

  function returnToTopGames(){const phone=UI.sourcePhone;close(false);setTimeout(()=>window.JKGamesOpenTopGames?.(phone),70);}

  function refreshHeader(){const data=state();UI.overlay?.querySelector('[data-sckl-coins]')?.replaceChildren(document.createTextNode(fmt(data.coins)));UI.overlay?.querySelector('[data-sckl-best]')?.replaceChildren(document.createTextNode(`${fmt(data.stats.bestDistance)} m`));}

  function renderHome(){
    if(!UI.body)return;const data=state(),car=carById(data.selectedCar),sp=specs(data,car.id);refreshHeader();
    UI.body.innerHTML=`<div class="sckl-home"><section class="sckl-hero"><div class="sckl-hero-copy"><div>${roleBadge()}<span class="sckl-live-dot">ONLINE LOBBY</span></div><small>ENDLOSE VERFOLGUNG · OPEN LOBBY · TUNING</small><h2>Fahr. Tune. Entkomm der Polizei.</h2><p>Die Polizei wird mit jeder Sekunde und jedem Kilometer stärker. Tankstopps sind riskant: Bleibt der Cop fünf Sekunden hinter dir, wirst du erwischt.</p><div class="sckl-home-actions"><button class="primary" data-sckl-chase>Verfolgung starten</button><button data-sckl-lobby>Open Lobby</button></div></div><div class="sckl-selected-car ${car.galaxy?'galaxy':''}"><small>AKTIVES AUTO</small><h3>${esc(car.name)}</h3><div class="sckl-spec-row"><span><b>${Math.round(sp.maxSpeed)}</b><small>km/h</small></span><span><b>${Math.round(sp.maxHp)}</b><small>HP</small></span><span><b>${Math.round(sp.maxFuel)}</b><small>Tank</small></span><span><b>${sp.tuneTotal}</b><small>Tuning</small></span></div><button data-sckl-garage>Garage öffnen</button></div></section><section class="sckl-menu-grid"><button data-sckl-garage><span>🚘</span><b>Garage & Shop</b><small>12 normale Fahrzeuge, Special Cars und dein Fuhrpark.</small></button><button data-sckl-tuning><span>🔧</span><b>Tuning-Werkstatt</b><small>Motor, Panzerung und Tank bis Stufe 10 ausbauen.</small></button><button data-sckl-lobby><span>🌐</span><b>Open Lobby</b><small>Online herumfahren, andere Autos sehen, rammen und Safe Zones nutzen.</small></button><button data-sckl-chase><span>🚨</span><b>Endlose Flucht</b><small>Drei zufällige Polizeiwagen, Tankstellen und immer stärkerer Verfolger.</small></button>${isOwner()?`<button class="owner" data-sckl-owner><span>◆</span><b>Owner Mod-Menü</b><small>Bugatti, F-22-Flugmodus, Größe, Speed, Noclip und Godmode.</small></button>`:''}<button data-sckl-info><span>i</span><b>Spielinfo</b><small>Steuerung, Tank, Damage, Lobby und kommende Custom-Map.</small></button></section></div>`;
    bindMenu();
  }

  function bindMenu(){
    UI.body?.querySelectorAll('[data-sckl-garage]').forEach(b=>b.addEventListener('click',renderGarage));
    UI.body?.querySelectorAll('[data-sckl-tuning]').forEach(b=>b.addEventListener('click',renderTuning));
    UI.body?.querySelectorAll('[data-sckl-lobby]').forEach(b=>b.addEventListener('click',startLobby));
    UI.body?.querySelectorAll('[data-sckl-chase]').forEach(b=>b.addEventListener('click',startChase));
    UI.body?.querySelector('[data-sckl-owner]')?.addEventListener('click',renderOwnerMenu);
    UI.body?.querySelector('[data-sckl-info]')?.addEventListener('click',renderInfo);
  }

  function renderGarage(){
    stopWorld();const data=state();refreshHeader();
    const cars=CAR_CATALOG.filter(car=>!car.ownerOnly||isOwner());
    UI.body.innerHTML=`<div class="sckl-page"><header class="sckl-page-head"><div><small>GARAGE · SHOP</small><h2>Deine Fahrzeuge</h2><p>Du startest mit einem Standardauto. Schnellere Fahrzeuge kosten zunehmend mehr Speed Coins.</p></div><button data-sckl-back>← Zurück</button></header><div class="sckl-car-grid">${cars.map(car=>{const owned=!!data.owned[car.id]||car.ownerOnly&&isOwner(),selected=data.selectedCar===car.id,sp=specs(data,car.id);return `<article class="sckl-car-card ${selected?'selected':''} ${car.galaxy?'galaxy':''}"><div class="sckl-car-class">${esc(car.className)}</div><h3>${esc(car.name)}</h3><div class="sckl-car-bars"><label>Tempo <i style="--v:${Math.min(100,sp.maxSpeed/4)}%"></i></label><label>Beschleunigung <i style="--v:${Math.min(100,sp.accel)}%"></i></label><label>HP <i style="--v:${Math.min(100,sp.maxHp/5)}%"></i></label></div><p>${Math.round(sp.maxSpeed)} km/h · Tuning ${sp.tuneTotal}/30</p>${owned?`<button ${selected?'disabled':''} data-sckl-select="${car.id}">${selected?'Aktiv':'Auswählen'}</button>`:`<button class="primary" data-sckl-buy="${car.id}">${fmt(car.price)} Speed Coins</button>`}</article>`;}).join('')}</div></div>`;
    UI.body.querySelector('[data-sckl-back]')?.addEventListener('click',renderHome);
    UI.body.querySelectorAll('[data-sckl-select]').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.dataset.scklSelect;if(carById(id).ownerOnly&&!isOwner())return;data.selectedCar=id;data.owned[id]=true;persist(data);renderGarage();}));
    UI.body.querySelectorAll('[data-sckl-buy]').forEach(btn=>btn.addEventListener('click',()=>{const car=carById(btn.dataset.scklBuy);if(car.ownerOnly)return;if(data.owned[car.id])return;if(data.coins<car.price)return toast('Nicht genug Speed Coins.','error');if(!confirm(`${car.name} für ${fmt(car.price)} Speed Coins kaufen?`))return;data.coins-=car.price;data.owned[car.id]=true;data.selectedCar=car.id;persist(data);toast(`${car.name} gekauft.`,'good');renderGarage();}));
  }

  function renderTuning(){
    stopWorld();const data=state(),car=carById(data.selectedCar),t=tuningFor(data,car.id),sp=specs(data,car.id);refreshHeader();
    const tuneCard=(type,label,desc,level)=>{const next=level+1,cost=tuneCost(car.id,type,next),hasToken=Number(data.consumables.tuneToken||0)>0;return `<article class="sckl-tune-card"><div><small>${label.toUpperCase()}</small><h3>Stufe ${level}/10</h3><p>${desc}</p></div><div class="sckl-level-dots">${Array.from({length:10},(_,i)=>`<i class="${i<level?'on':''}"></i>`).join('')}</div>${level>=10?'<button disabled>MAX</button>':`<button data-sckl-tune="${type}">${hasToken?'1 Tuning-Chip':`${fmt(cost)} Speed Coins`}</button>`}</article>`;};
    UI.body.innerHTML=`<div class="sckl-page"><header class="sckl-page-head"><div><small>TUNING-WERKSTATT</small><h2>${esc(car.name)}</h2><p>${Math.round(sp.maxSpeed)} km/h · ${Math.round(sp.maxHp)} HP · ${Math.round(sp.maxFuel)} Tank</p></div><button data-sckl-back>← Zurück</button></header><div class="sckl-tune-grid">${tuneCard('engine','Motor','Mehr Höchstgeschwindigkeit und Beschleunigung.',t.engine)}${tuneCard('armor','Panzerung','Mehr Fahrzeugleben bei Zusammenstößen.',t.armor)}${tuneCard('tank','Tank','Mehr Reichweite zwischen den Tankstopps.',t.tank)}</div><section class="sckl-consumables"><span>⚡ Nitro: <b>${fmt(data.consumables.nitro)}</b></span><span>🧰 Repair Kits: <b>${fmt(data.consumables.repairKit)}</b></span><span>⛽ Kanister: <b>${fmt(data.consumables.fuelCan)}</b></span><span>🔧 Tuning-Chips: <b>${fmt(data.consumables.tuneToken)}</b></span></section></div>`;
    UI.body.querySelector('[data-sckl-back]')?.addEventListener('click',renderHome);
    UI.body.querySelectorAll('[data-sckl-tune]').forEach(btn=>btn.addEventListener('click',()=>{const type=btn.dataset.scklTune,level=tuningFor(data,car.id)[type]||0;if(level>=10)return;const next=level+1,cost=tuneCost(car.id,type,next);if(data.consumables.tuneToken>0){data.consumables.tuneToken--;tuningFor(data,car.id)[type]=next;}else{if(data.coins<cost)return toast('Nicht genug Speed Coins.','error');data.coins-=cost;tuningFor(data,car.id)[type]=next;}persist(data);toast(`${type==='engine'?'Motor':type==='armor'?'Panzerung':'Tank'} auf Stufe ${next}.`,'good');renderTuning();}));
  }

  function renderInfo(){
    stopWorld();UI.body.innerHTML=`<div class="sckl-page narrow"><header class="sckl-page-head"><div><small>SPIELINFO</small><h2>Speed Car.KL</h2></div><button data-sckl-back>← Zurück</button></header><div class="sckl-info-list"><article><b>🚨 Endlose Verfolgung</b><p>W gibt Gas. S bremst zuerst und fährt danach rückwärts. A/D lenkt das Fahrzeug selbst. Das Auto bleibt starr auf der Fahrbahn und die Kamera sitzt fest hinter dem Fahrzeug und dreht exakt mit. Der zufällige Polizeiwagen wird kontinuierlich schneller. Ist er nah genug oder bleibt beim Tankstopp fünf Sekunden hinter dir, ist die Flucht vorbei.</p></article><article><b>⛽ Tankstellen</b><p>Die echte Tankstelle erscheint während der Flucht immer wieder rechts neben der Strecke. Dein Tank leert sich spürbar, deshalb musst du regelmäßig rechts heranfahren und unter 16 km/h abbremsen. Während du tankst, fährt die Polizei weiter auf dich auf.</p></article><article><b>🌐 Open Lobby</b><p>Große provisorische Online-Lobby mit Shop, Werkstatt, Tankstelle, Safe Zones, Fahrzeug-Damage und anderen angemeldeten Spielern. Die Map ist bereits als austauschbarer Slot gebaut.</p></article><article><b>💥 Damage</b><p>Außerhalb der Safe Zones verursachen harte Zusammenstöße Schaden. Bei 0 HP respawnst du am Lobby-Start. Erfolgreicher Rammschaden gibt kleine Mengen Speed Coins.</p></article><article><b>◆ Owner</b><p>Nur der Owner bekommt das Speed-Car-Mod-Menü. Der Owner Bugatti und der F-22-Flugmodus werden auch an andere Lobby-Spieler synchronisiert.</p></article><article><b>🎮 Steuerung</b><p>PC: W/A/S/D oder Pfeiltasten. W = vorwärts, S = bremsen/rückwärts, A/D = lenken. Nitro: Shift. Interaktion: E. Im Owner-Flugmodus: Leertaste hoch, Shift runter. Mobil gibt es große Touch-Buttons.</p></article></div></div>`;UI.body.querySelector('[data-sckl-back]')?.addEventListener('click',renderHome);
  }

  function renderOwnerMenu(){
    if(!isOwner())return renderHome();stopWorld();const data=state();
    UI.body.innerHTML=`<div class="sckl-page owner-page"><header class="sckl-page-head"><div><small>OWNER ONLY</small><h2>Speed Car.KL Mod-Menü</h2><p>Diese Steuerung wird normalen Spielern niemals angezeigt.</p></div><button data-sckl-back>← Zurück</button></header><div class="sckl-owner-grid"><button data-owner-car="owner-bugatti"><b>◆ Owner Bugatti</b><small>Exklusiven Bugatti aktivieren.</small></button><button data-owner-lobby><b>🌐 Lobby mit Owner-Car</b><small>Direkt in die Open Lobby.</small></button><button data-owner-flight><b>✈ F-22 Flugmodus</b><small>In der Lobby automatisch in den F-22A Raptor wechseln.</small></button><button data-owner-coins><b>＋ 1.000.000 Speed Coins</b><small>Lokaler Owner-Testzuschuss.</small></button><button data-owner-unlock><b>Alle normalen Autos freigeben</b><small>Für Owner-Testzwecke.</small></button></div></div>`;
    UI.body.querySelector('[data-sckl-back]')?.addEventListener('click',renderHome);
    UI.body.querySelector('[data-owner-car]')?.addEventListener('click',()=>{data.selectedCar='owner-bugatti';data.owned['owner-bugatti']=true;persist(data);toast('Owner Bugatti aktiviert.','good');renderOwnerMenu();});
    UI.body.querySelector('[data-owner-lobby]')?.addEventListener('click',()=>{data.selectedCar='owner-bugatti';data.owned['owner-bugatti']=true;persist(data);startLobby({owner:true});});
    UI.body.querySelector('[data-owner-flight]')?.addEventListener('click',()=>startLobby({owner:true,flight:true}));
    UI.body.querySelector('[data-owner-coins]')?.addEventListener('click',()=>{data.coins+=1000000;persist(data);toast('+1.000.000 Speed Coins','good');refreshHeader();});
    UI.body.querySelector('[data-owner-unlock]')?.addEventListener('click',()=>{CAR_CATALOG.filter(c=>!c.ownerOnly).forEach(c=>data.owned[c.id]=true);persist(data);toast('Alle normalen Autos freigeschaltet.','good');});
  }

  function loadGLB(url){
    if(MODEL_CACHE.has(url))return MODEL_CACHE.get(url);
    const p=new Promise((resolve,reject)=>LOADER.load(url,g=>resolve(g.scene),undefined,reject));MODEL_CACHE.set(url,p);return p;
  }
  function loadPack(){if(!PACK_SCENE_PROMISE)PACK_SCENE_PROMISE=loadGLB(PACK_URL);return PACK_SCENE_PROMISE;}

  function normalizeModel(source,targetLength=4.3){
    const outer=new THREE.Group(),inner=new THREE.Group();outer.add(inner);inner.add(source);
    source.updateMatrixWorld(true);let box=new THREE.Box3().setFromObject(source),size=new THREE.Vector3();box.getSize(size);
    if(size.x>size.z*1.18){source.rotation.y+=Math.PI/2;source.updateMatrixWorld(true);box=new THREE.Box3().setFromObject(source);box.getSize(size);}
    const scale=targetLength/Math.max(.001,size.z,size.x);const center=new THREE.Vector3();box.getCenter(center);
    inner.scale.setScalar(scale);inner.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);
    outer.userData.vehicleVisual=inner;return outer;
  }

  function normalizeSceneryModel(source,targetFootprint=14){
    const outer=new THREE.Group();outer.add(source);source.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(source),size=new THREE.Vector3(),center=new THREE.Vector3();box.getSize(size);box.getCenter(center);
    const scale=targetFootprint/Math.max(.001,size.x,size.z);source.scale.setScalar(scale);source.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);
    source.traverse?.(node=>{if(node.isMesh){node.castShadow=true;node.receiveShadow=true;}});
    return outer;
  }

  async function makeVehicleModel(carId,opts={}){
    const car=carById(carId);let source;
    if(car.source==='pack'){
      const scene=await loadPack();const root=scene.getObjectByName('RootNode')||scene;
      const candidates=root.children.filter(x=>x.type==='Group'||x.children?.length);
      source=(candidates[car.packIndex]||candidates[0]||root).clone(true);
    }else source=(await loadGLB(car.url)).clone(true);
    const model=normalizeModel(source,car.aircraft?8.5:4.4);
    model.userData.carId=car.id;
    if(car.galaxy)addGalaxyAura(model,car.aircraft?2.4:1.0);
    if(opts.police)addPoliceLights(model);
    return model;
  }

  async function makePoliceModel(police){
    let source;if(police.source==='pack'){const scene=await loadPack(),root=scene.getObjectByName('RootNode')||scene,candidates=root.children.filter(x=>x.type==='Group'||x.children?.length);source=(candidates[police.packIndex]||candidates[candidates.length-1]||root).clone(true);}else source=(await loadGLB(police.url)).clone(true);
    const model=normalizeModel(source,4.5);addPoliceLights(model);model.userData.policeId=police.id;return model;
  }

  function addPoliceLights(model){
    const bar=new THREE.Group();bar.position.set(0,1.3,0);const red=new THREE.Mesh(new THREE.BoxGeometry(.5,.12,.22),new THREE.MeshStandardMaterial({color:0xff203d,emissive:0xff001f,emissiveIntensity:2.2}));const blue=red.clone();blue.material=red.material.clone();blue.material.color.set(0x2588ff);blue.material.emissive.set(0x006cff);red.position.x=-.28;blue.position.x=.28;bar.add(red,blue);model.add(bar);model.userData.siren={red,blue,phase:Math.random()*6};
  }
  function addGalaxyAura(model,scale=1){const ring=new THREE.Mesh(new THREE.TorusGeometry(2.15*scale,.055*scale,8,40),new THREE.MeshBasicMaterial({color:0xa655ff,transparent:true,opacity:.65}));ring.rotation.x=Math.PI/2;ring.position.y=.18;model.add(ring);const light=new THREE.PointLight(0x8f4cff,4,14*scale);light.position.y=1.8*scale;model.add(light);model.userData.galaxyRing=ring;}

  function disposeObject(obj){obj?.traverse?.(n=>{if(n.geometry?.dispose)n.geometry.dispose();if(n.material){const mats=Array.isArray(n.material)?n.material:[n.material];mats.forEach(m=>{if(m.map?.dispose)m.map.dispose();m.dispose?.();});}});}

  function baseRenderer(host){
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,window.innerWidth<700?1.35:1.75));renderer.shadowMap.enabled=window.innerWidth>700;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;host.append(renderer.domElement);return renderer;
  }
  function baseScene(){const scene=new THREE.Scene();scene.background=new THREE.Color(0x050a13);scene.fog=new THREE.FogExp2(0x07101d,.012);scene.add(new THREE.HemisphereLight(0xaac8ff,0x07120f,2.1));const moon=new THREE.DirectionalLight(0xffffff,2.2);moon.position.set(20,40,15);moon.castShadow=true;scene.add(moon);return scene;}

  function worldMarkup(mode){
    return `<div class="sckl-game"><div class="sckl-canvas-wrap" data-sckl-canvas></div><div class="sckl-hud top"><div><small>${mode==='chase'?'VERFOLGUNG':'OPEN LOBBY'}</small><b data-sckl-hud-speed>0 km/h</b></div><div><small>${mode==='chase'?'DISTANZ':'SPEED COINS'}</small><b data-sckl-hud-secondary>0</b></div><div><small>HP</small><b data-sckl-hud-hp>100/100</b></div><div><small>TANK</small><b data-sckl-hud-fuel>100%</b></div></div><div class="sckl-hud-message" data-sckl-message></div><div class="sckl-countdown" data-sckl-countdown hidden></div><div class="sckl-side-panel" data-sckl-side></div><div class="sckl-consume-hud"><button data-sckl-consume="repair">🧰 <span data-sckl-repair-count>0</span></button><button data-sckl-consume="fuel">⛽ <span data-sckl-fuel-count>0</span></button>${isOwner()?'<button class="owner" data-sckl-owner-ingame>◆ MOD</button>':''}</div><div class="sckl-touch-controls"><div class="steer"><button data-touch="left">◀</button><button data-touch="right">▶</button></div><div class="pedals"><button class="brake" data-touch="brake">BREMSE / R</button><button class="nitro" data-touch="nitro">NITRO</button><button class="gas" data-touch="gas">GAS</button></div></div><button class="sckl-world-exit" data-sckl-world-exit>×</button></div>`;
  }

  async function startLobby(options={}){
    stopWorld();const data=state();if(carById(data.selectedCar).ownerOnly&&!isOwner()){data.selectedCar='street-01';persist(data);}if(options.owner&&isOwner()){data.selectedCar='owner-bugatti';data.owned['owner-bugatti']=true;persist(data);}UI.body.innerHTML=worldMarkup('lobby');
    const host=UI.body.querySelector('[data-sckl-canvas]'),scene=baseScene(),camera=new THREE.PerspectiveCamera(62,1,.1,520),renderer=baseRenderer(host);
    const session={mode:'lobby',scene,camera,renderer,host,timer:createGameTimer(),raf:0,player:null,carId:(options.flight&&isOwner())?'owner-f22':data.selectedCar,x:0,y:0,z:18,heading:0,speed:0,hp:0,fuel:0,remote:new Map(),remoteObjects:new Map(),remoteUnsub:null,remoteRetryTimer:0,remoteWriteBusy:false,lastRemoteWrite:0,lastRemotePayloadKey:'',lastRamAt:0,safe:false,nearPlace:'',owner:{speedMult:1,size:1,noclip:false,godmode:false,flight:!!(options.flight&&isOwner())}};UI.session=session;
    const sp=specs(data,session.carId);session.hp=sp.maxHp;session.fuel=sp.maxFuel;
    createLobbyMap(session);bindWorldControls(session);resizeWorld();
    try{session.player=await makeVehicleModel(session.carId);if(UI.session!==session)return;scene.add(session.player);session.player.scale.setScalar(session.owner.size);}catch(err){console.error('Speed Car.KL Fahrzeug',err);toast('Fahrzeugmodell konnte nicht geladen werden.','error');}
    await startLobbySync(session).catch(err=>console.warn('Speed Car.KL Lobby Sync',err));
    session.raf=requestAnimationFrame((timestamp)=>animateLobby(session,timestamp));
  }

  function createLobbyMap(s){
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(190,190),new THREE.MeshStandardMaterial({color:0x0a221b,roughness:.96}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;s.scene.add(ground);
    const roadMat=new THREE.MeshStandardMaterial({color:0x111a22,roughness:.82,metalness:.12});
    [-58,0,58].forEach(v=>{const rz=new THREE.Mesh(new THREE.BoxGeometry(18,.05,180),roadMat);rz.position.set(v,.02,0);s.scene.add(rz);const rx=new THREE.Mesh(new THREE.BoxGeometry(180,.05,18),roadMat);rx.position.set(0,.025,v);s.scene.add(rx);});
    const lineMat=new THREE.MeshBasicMaterial({color:0xe8df9b});for(const axis of ['x','z'])for(const lane of [-58,0,58])for(let p=-80;p<=80;p+=12){const geo=axis==='z'?new THREE.BoxGeometry(.15,.03,5):new THREE.BoxGeometry(5,.03,.15);const line=new THREE.Mesh(geo,lineMat);line.position.set(axis==='z'?lane:p,.06,axis==='z'?p:lane);s.scene.add(line);}
    const buildingMat=[0x13253a,0x172b24,0x241b36,0x2b2520].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.8,metalness:.1}));
    for(let gx=-2;gx<=2;gx++)for(let gz=-2;gz<=2;gz++){const x=gx*29,z=gz*29;if(Math.abs(x)<13||Math.abs(z)<13)continue;const h=8+((gx*17+gz*29+99)%13);const b=new THREE.Mesh(new THREE.BoxGeometry(12,h,12),buildingMat[Math.abs(gx+gz)%buildingMat.length]);b.position.set(x,h/2,z);b.castShadow=true;s.scene.add(b);}
    addLobbyPlace(s,'SHOP',55,55,0x40e6a5,'SHOP · Autos kaufen');addLobbyPlace(s,'TUNING',-55,55,0xb768ff,'TUNING · Werkstatt');addLobbyPlace(s,'GAS',55,-55,0xffc857,'TANKSTELLE');addLobbyGasStationModel(s);addLobbyPlace(s,'SAFE',-55,-55,0x42a5ff,'SAFE ZONE');
    const wallMat=new THREE.MeshStandardMaterial({color:0x5b2034,emissive:0x260510,emissiveIntensity:.8});[[0,-94,188,2],[0,94,188,2],[-94,0,2,188],[94,0,2,188]].forEach(([x,z,w,d])=>{const wall=new THREE.Mesh(new THREE.BoxGeometry(w,3,d),wallMat);wall.position.set(x,1.5,z);s.scene.add(wall);});
    const mapUrl=String(state().customMapUrl||localStorage.getItem(CUSTOM_MAP_CONFIG_KEY)||'').trim();if(mapUrl)loadGLB(mapUrl).then(map=>{if(UI.session!==s)return;const group=normalizeModel(map.clone(true),130);group.position.y=.06;s.scene.add(group);toast('Eigene Open-Lobby-Map geladen.','good');}).catch(err=>console.warn('Speed Car.KL Custom Map',err));
  }
  function addLobbyPlace(s,id,x,z,color,label){const ring=new THREE.Mesh(new THREE.RingGeometry(10,13,48),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.55,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set(x,.08,z);s.scene.add(ring);const p=new THREE.PointLight(color,5,30);p.position.set(x,5,z);s.scene.add(p);const post=new THREE.Mesh(new THREE.BoxGeometry(7,4,1),new THREE.MeshStandardMaterial({color:0x07100f,emissive:color,emissiveIntensity:.35}));post.position.set(x,2,z);s.scene.add(post);s[`place${id}`]={x,z,radius:14,label};}
  function addLobbyGasStationModel(s){loadGLB(GAS_STATION_URL).then(scene=>{if(UI.session!==s)return;const model=normalizeSceneryModel(scene.clone(true),18);model.position.set(55,.04,-55);model.rotation.y=Math.PI/2;s.scene.add(model);s.lobbyGasModel=model;}).catch(err=>console.warn('Speed Car.KL Tankstellen-Modell',err));}

  async function startLobbySync(s){
    const fb=await window.LifeBuilderFirebaseCore?.load?.(),user=await window.LifeBuilderFirebaseCore?.waitForAuth?.(6000);if(!fb||!user||UI.session!==s)return;
    s.fb=fb;s.user=user;s.displayName=String(user.displayName||user.email?.split('@')[0]||'Spieler').slice(0,50);
    const q=fb.query(fb.collection(fb.db,'speedCarKlLobby'),fb.orderBy('updatedAtMs','desc'),fb.limit(MAX_REMOTE_PLAYERS));
    s.remoteUnsub=fb.onSnapshot(q,snap=>{if(UI.session!==s)return;const seen=new Set();snap.forEach(doc=>{if(doc.id===user.uid)return;const d=doc.data()||{};if(Date.now()-Number(d.updatedAtMs||0)>18000)return;seen.add(doc.id);s.remote.set(doc.id,{uid:doc.id,...d});updateRemoteCar(s,doc.id,{uid:doc.id,...d});});for(const uid of [...s.remote.keys()])if(!seen.has(uid)){s.remote.delete(uid);removeRemoteCar(s,uid);}renderLobbyPlayers(s);},err=>{
      s.remoteUnsub=null;
      if(UI.session!==s)return;
      if(window.LifeBuilderFirebaseCore?.isFatalFirestoreAssertion?.(err)){window.LifeBuilderFirebaseCore.scheduleHardFirestoreRecovery?.(err);return;}
      console.warn('Speed Car.KL Online-Lobby verbindet neu',err);
      clearTimeout(s.remoteRetryTimer);
      s.remoteRetryTimer=window.setTimeout(()=>{if(UI.session===s&&!s.remoteUnsub)startLobbySync(s).catch(retryError=>console.warn('Speed Car.KL Lobby Retry',retryError));},5000);
    });
  }

  async function updateRemoteCar(s,uid,d){
    let entry=s.remoteObjects.get(uid);if(entry&&entry.carId!==d.carId){s.scene.remove(entry.object);s.remoteObjects.delete(uid);entry=null;}
    if(!entry){try{const model=await makeVehicleModel(d.carId||'street-01');if(UI.session!==s)return;const label=makeTextSprite(`${d.displayName||'Spieler'} · T${Number(d.tune||0)}`);label.position.y=2.8;model.add(label);s.scene.add(model);entry={object:model,carId:d.carId||'street-01',target:new THREE.Vector3(),targetRot:0,targetScale:1,targetY:0};s.remoteObjects.set(uid,entry);}catch{return;}}
    const remoteY=String(d.mode||'drive')==='flight'?Number(d.y||0):0;
    entry.target.set(Number(d.x||0),remoteY,Number(d.z||0));entry.targetRot=Number(d.rot||0);entry.targetScale=clamp(Number(d.size||1),.35,4);entry.data=d;
  }
  function removeRemoteCar(s,uid){const e=s.remoteObjects.get(uid);if(e){s.scene.remove(e.object);s.remoteObjects.delete(uid);}}
  function makeTextSprite(text){const c=document.createElement('canvas');c.width=512;c.height=96;const x=c.getContext('2d');x.fillStyle='rgba(2,8,13,.78)';x.fillRect(0,10,512,76);x.font='700 30px system-ui';x.fillStyle='#eafff7';x.textAlign='center';x.fillText(String(text).slice(0,32),256,58);const tex=new THREE.CanvasTexture(c);const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));sp.scale.set(6,1.1,1);return sp;}

  function syncLobbyWrite(s,now){
    if(!s.fb||!s.user||s.remoteWriteBusy)return;
    const data=state(),t=tuningFor(data,s.carId);
    const stable={uid:s.user.uid,displayName:s.displayName||'Spieler',carId:s.carId,x:Number(s.x.toFixed(2)),y:Number(s.y.toFixed(2)),z:Number(s.z.toFixed(2)),rot:Number(s.heading.toFixed(4)),speed:Math.round(s.speed),health:Math.max(0,Math.round(s.hp)),tune:t.engine+t.armor+t.tank,size:Number(s.owner.size.toFixed(2)),mode:s.owner.flight?'flight':'drive'};
    const key=JSON.stringify(stable),changed=key!==s.lastRemotePayloadKey;
    const interval=changed?2200:10000;
    if(now-s.lastRemoteWrite<interval)return;
    s.lastRemoteWrite=now;s.remoteWriteBusy=true;
    const payload={...stable,updatedAtMs:Date.now()};
    s.fb.setDoc(s.fb.doc(s.fb.db,'speedCarKlLobby',s.user.uid),payload,{merge:false}).then(()=>{s.lastRemotePayloadKey=key;}).catch((error)=>{
      if(window.LifeBuilderFirebaseCore?.isFatalFirestoreAssertion?.(error))window.LifeBuilderFirebaseCore.scheduleHardFirestoreRecovery?.(error);
    }).finally(()=>s.remoteWriteBusy=false);
  }
  function renderLobbyPlayers(s){const host=UI.body?.querySelector('[data-sckl-side]');if(!host||UI.session!==s)return;const rows=[...s.remote.values()].slice(0,12);host.innerHTML=`<div class="sckl-online-list"><header><small>ONLINE</small><b>${rows.length+1} Fahrer</b></header>${rows.map(p=>`<article><span>${esc(p.displayName||'Spieler')}</span><small>${esc(carById(p.carId).name)} · T${Number(p.tune||0)}</small></article>`).join('')||'<p>Noch kein anderer Fahrer sichtbar.</p>'}</div>`;}

  function animateLobby(s,timestamp){
    if(UI.session!==s)return;s.timer.update(timestamp);const dt=Math.min(.05,s.timer.getDelta()),data=state(),sp=specs(data,s.carId),owner=isOwner()&&s.owner;
    const gas=input('gas'),reverse=input('brake'),left=input('left'),right=input('right'),nitro=input('nitro');const flight=owner.flight;
    let maxForward=sp.maxSpeed*(owner.speedMult||1);if(flight)maxForward=carById('owner-f22').speed*(owner.speedMult||1);
    const maxReverse=flight?0:Math.min(82,maxForward*.38),accel=sp.accel*(flight?3:1),brakeForce=sp.accel*(flight?2.15:2.5),reverseAccel=sp.accel*.82;
    if(flight){
      if(gas)s.speed+=accel*dt;else s.speed=approach(s.speed,0,Math.max(10,Math.abs(s.speed)*.13)*dt);if(reverse)s.speed-=brakeForce*dt;
    }else if(gas&&!reverse){
      if(s.speed<0)s.speed=approach(s.speed,0,brakeForce*dt);else s.speed+=accel*dt;
    }else if(reverse&&!gas){
      if(s.speed>4)s.speed=approach(s.speed,0,brakeForce*dt);else s.speed-=reverseAccel*dt;
    }else if(gas&&reverse){
      s.speed=approach(s.speed,0,brakeForce*dt);
    }else{
      s.speed=approach(s.speed,0,Math.max(7,Math.abs(s.speed)*.12)*dt);
    }
    if(nitro&&!flight&&data.consumables.nitro>0&&s.speed>0){s.speed+=85*dt;maxForward*=1.32;}
    s.speed=clamp(s.speed,-maxReverse,maxForward);
    const steer=(right?1:0)-(left?1:0),moving=Math.abs(s.speed)>1.2;
    if(moving&&steer){const speedFactor=Math.min(1,Math.abs(s.speed)/Math.max(45,maxForward*.45)),turnRate=(flight?.72:1.72)*(.22+speedFactor*.78);s.heading+=steer*turnRate*dt*Math.sign(s.speed||1);}
    const meters=s.speed/3.6*dt;s.x+=Math.sin(s.heading)*meters;s.z+=Math.cos(s.heading)*meters;
    if(flight){if(UI.keys.Space)s.y+=22*dt;if(UI.keys.ShiftLeft||UI.keys.ShiftRight)s.y-=22*dt;s.y=clamp(s.y,1.5,75);}else s.y=0;
    if(!owner.noclip&&!flight){const beforeX=s.x,beforeZ=s.z;s.x=clamp(s.x,-88,88);s.z=clamp(s.z,-88,88);if(beforeX!==s.x||beforeZ!==s.z){s.speed*=.42;if(!owner.godmode)s.hp-=8;}}
    const selectedSpecs=specs(data,s.carId);if(!flight){s.fuel=Math.max(0,s.fuel-(.008+Math.abs(s.speed)*.00017)*dt);if(s.fuel<=0)s.speed=approach(s.speed,0,55*dt);}else s.fuel=selectedSpecs.maxFuel;
    if(s.player){
      const groundY=flight?s.y:0;
      s.player.position.set(s.x,groundY,s.z);
      s.player.rotation.set(0,s.heading,0);
      s.player.scale.setScalar(owner.size||1);
      const visual=s.player.userData?.vehicleVisual;
      if(visual&&!flight){visual.rotation.x=0;visual.rotation.z=0;}
      animateVisual(s.player,performance.now()/1000);
    }
    const carForward=new THREE.Vector3(Math.sin(s.heading),0,Math.cos(s.heading)),behind=flight?15:10,height=flight?7:5.4;
    const cameraTarget=new THREE.Vector3(s.x-carForward.x*behind,(flight?s.y:0)+height,s.z-carForward.z*behind);
    if(flight)s.camera.position.lerp(cameraTarget,1-Math.pow(.001,dt));else s.camera.position.copy(cameraTarget);
    s.camera.up.set(0,1,0);
    s.camera.lookAt(s.x+carForward.x*8,(flight?s.y:0)+(flight?1.5:1),s.z+carForward.z*8);
    for(const e of s.remoteObjects.values()){e.object.position.lerp(e.target,1-Math.pow(.0004,dt));e.object.rotation.set(0,lerpAngle(e.object.rotation.y,e.targetRot,Math.min(1,dt*7)),0);e.object.scale.setScalar(e.targetScale);const remoteVisual=e.object.userData?.vehicleVisual;if(remoteVisual&&String(e.data?.mode||'drive')!=='flight'){remoteVisual.rotation.x=0;remoteVisual.rotation.z=0;}animateVisual(e.object,performance.now()/1000);}
    checkLobbyPlaces(s);checkRemoteRamming(s,dt);if(s.hp<=0&&!owner.godmode)respawnLobby(s);
    syncLobbyWrite(s,performance.now());updateLobbyHud(s,selectedSpecs);s.renderer.render(s.scene,s.camera);s.raf=requestAnimationFrame((nextTimestamp)=>animateLobby(s,nextTimestamp));
  }

  function animateVisual(obj,t){if(obj.userData?.siren){const on=Math.sin(t*12+obj.userData.siren.phase)>0;obj.userData.siren.red.visible=on;obj.userData.siren.blue.visible=!on;}if(obj.userData?.galaxyRing)obj.userData.galaxyRing.rotation.z=t*.7;}
  function checkLobbyPlaces(s){const d=(p)=>Math.hypot(s.x-p.x,s.z-p.z);const shop=s.placeSHOP,tune=s.placeTUNING,gas=s.placeGAS,safe=s.placeSAFE;s.safe=d(shop)<shop.radius||d(tune)<tune.radius||d(safe)<safe.radius;s.nearPlace=d(shop)<16?'shop':d(tune)<16?'tune':d(gas)<15?'gas':'';const msg=UI.body?.querySelector('[data-sckl-message]');if(s.nearPlace==='shop')msg.innerHTML='SHOP · <b>E</b> oder antippen zum Öffnen';else if(s.nearPlace==='tune')msg.innerHTML='TUNING · <b>E</b> oder antippen zum Öffnen';else if(s.nearPlace==='gas'){msg.innerHTML='TANKSTELLE · langsam werden zum Tanken';if(Math.abs(s.speed)<15){const sp=specs(state(),s.carId);s.fuel=Math.min(sp.maxFuel,s.fuel+25*.016);}}else msg.textContent=s.safe?'SAFE ZONE · Fahrzeugschaden deaktiviert':'';}
  function checkRemoteRamming(s){if(s.safe||Date.now()-s.lastRamAt<900)return;for(const e of s.remoteObjects.values()){const p=e.object.position;if(Math.hypot(s.x-p.x,s.z-p.z)<2.6&&Math.abs(s.y-p.y)<2.5){s.lastRamAt=Date.now();const impact=Math.max(2,Math.min(18,(s.speed+Number(e.data?.speed||0))*.035));if(!(s.owner.godmode&&isOwner()))s.hp-=impact;const data=state();const reward=Math.max(1,Math.floor(impact*.8));data.coins+=reward;data.stats.lobbyDamage+=impact;persist(data);toast(`Rammschaden +${reward} Speed Coins`,'good');break;}}}
  function respawnLobby(s){const data=state();data.stats.lobbyKOs++;persist(data);s.x=0;s.z=18;s.y=0;s.speed=0;const sp=specs(data,s.carId);s.hp=sp.maxHp;s.fuel=Math.max(s.fuel,sp.maxFuel*.55);toast('Fahrzeug zerstört · Respawn','error');}
  function updateLobbyHud(s,sp){updateConsumableHud();setHud('[data-sckl-hud-speed]',speedText(s.speed));setHud('[data-sckl-hud-secondary]',fmt(state().coins));setHud('[data-sckl-hud-hp]',`${Math.max(0,Math.round(s.hp))}/${Math.round(sp.maxHp)}`);setHud('[data-sckl-hud-fuel]',`${Math.round(s.fuel/sp.maxFuel*100)}%`);}

  async function startChase(){
    stopWorld();const data=state(),car=carById(data.selectedCar);if(car.ownerOnly&&!isOwner()){data.selectedCar='street-01';persist(data);}UI.body.innerHTML=worldMarkup('chase');const host=UI.body.querySelector('[data-sckl-canvas]'),scene=baseScene(),camera=new THREE.PerspectiveCamera(66,1,.1,500),renderer=baseRenderer(host),sp=specs(data,data.selectedCar);const police=POLICE_CATALOG[Math.floor(Math.random()*POLICE_CATALOG.length)];
    const s={mode:'chase',scene,camera,renderer,host,timer:createGameTimer(),raf:0,player:null,police:null,policeDef:police,x:0,heading:0,speed:0,copSpeed:1,gap:46,distance:0,elapsed:0,countdownActive:true,countdownRemaining:5,hp:sp.maxHp,fuel:sp.maxFuel,gasAt:950+Math.random()*650,gasGroup:null,traffic:[],arrest:0,nitroActive:false,nitroConsumed:false,finished:false};UI.session=s;createChaseWorld(s);bindWorldControls(s);resizeWorld();
    try{const [player,cop]=await Promise.all([makeVehicleModel(data.selectedCar),makePoliceModel(police)]);if(UI.session!==s)return;s.player=player;s.police=cop;scene.add(player,cop);player.position.set(0,0,0);cop.position.set(0,0,-s.gap);}catch(err){console.error('Speed Car.KL Modelle',err);toast('3D-Automodelle konnten nicht geladen werden.','error');}
    data.stats.chases++;persist(data);const countdownEl=UI.body?.querySelector('[data-sckl-countdown]');if(countdownEl){countdownEl.hidden=false;countdownEl.textContent='5';}s.raf=requestAnimationFrame((timestamp)=>animateChase(s,timestamp));
  }

  function createChaseWorld(s){
    s.roadSegments=[];for(let i=0;i<14;i++){const g=new THREE.Group(),road=new THREE.Mesh(new THREE.BoxGeometry(16,.08,42),new THREE.MeshStandardMaterial({color:i%2?0x121821:0x151d26,roughness:.82}));g.add(road);for(const x of [-3,3]){const mark=new THREE.Mesh(new THREE.BoxGeometry(.16,.04,16),new THREE.MeshBasicMaterial({color:0xe8e1a0}));mark.position.set(x,.08,0);g.add(mark);}for(const x of [-8.2,8.2]){const barrier=new THREE.Mesh(new THREE.BoxGeometry(.35,.7,42),new THREE.MeshStandardMaterial({color:0x52213c,emissive:0x220316,emissiveIntensity:.6}));barrier.position.set(x,.35,0);g.add(barrier);}g.position.z=i*42-18;g.userData.wrapLength=14*42;s.scene.add(g);s.roadSegments.push(g);}
    for(let i=0;i<24;i++){const pole=new THREE.Group(),mast=new THREE.Mesh(new THREE.CylinderGeometry(.05,.08,4,6),new THREE.MeshStandardMaterial({color:0x273746,metalness:.7}));mast.position.y=2;pole.add(mast);const lamp=new THREE.PointLight(i%2?0x42c9ff:0xd26cff,2.5,13);lamp.position.y=4;pole.add(lamp);pole.position.set(i%2?9:-9,0,i*28);pole.userData.wrapLength=24*28;s.scene.add(pole);s.roadSegments.push(pole);}
    for(let i=0;i<8;i++){const mesh=new THREE.Mesh(new THREE.BoxGeometry(1.8,1,4),new THREE.MeshStandardMaterial({color:[0x3a86ff,0xff595e,0x8ac926,0xffca3a][i%4],metalness:.25,roughness:.5}));mesh.position.set([-4.5,-1.5,1.5,4.5][i%4],.5,55+i*36);mesh.userData.trafficSpeed=55+(i%5)*18;mesh.userData.hit=false;s.scene.add(mesh);s.traffic.push(mesh);}
    s.gasGroup=makeGasStation();s.scene.add(s.gasGroup);s.gasGroup.visible=false;
  }
  function makeGasStation(){
    const g=new THREE.Group();
    const forecourt=new THREE.Mesh(new THREE.BoxGeometry(9,.08,14),new THREE.MeshStandardMaterial({color:0x22292c,roughness:.9}));forecourt.position.set(-2.6,.02,0);g.add(forecourt);
    const marker=new THREE.Mesh(new THREE.RingGeometry(2.1,2.65,40),new THREE.MeshBasicMaterial({color:0x55ffc2,transparent:true,opacity:.7,side:THREE.DoubleSide}));marker.rotation.x=-Math.PI/2;marker.position.set(-4.7,.09,0);g.add(marker);
    const beacon=new THREE.PointLight(0x55ffc2,5,28);beacon.position.set(-4.7,3.4,0);g.add(beacon);
    const placeholder=new THREE.Mesh(new THREE.BoxGeometry(6,3.8,7),new THREE.MeshStandardMaterial({color:0x18352d,emissive:0x0b2e24,emissiveIntensity:.45,transparent:true,opacity:.4}));placeholder.position.set(1.7,1.9,0);g.add(placeholder);
    loadGLB(GAS_STATION_URL).then(scene=>{if(!g.parent)return;const model=normalizeSceneryModel(scene.clone(true),14.5);model.position.set(1.8,.03,0);model.rotation.y=Math.PI/2;g.add(model);placeholder.visible=false;g.userData.realModel=model;}).catch(err=>console.warn('Speed Car.KL Tankstelle',err));
    return g;
  }

  function animateChase(s,timestamp){
    if(UI.session!==s||s.finished)return;s.timer.update(timestamp);const dt=Math.min(.05,s.timer.getDelta()),data=state(),carId=data.selectedCar,sp=specs(data,carId),gas=input('gas'),reverse=input('brake'),left=input('left'),right=input('right'),nitro=input('nitro');
    if(s.countdownActive){
      s.speed=0;s.copSpeed=1;s.arrest=0;
      if(s.player){s.player.position.set(s.x,0,0);s.player.rotation.set(0,s.heading,0);const visual=s.player.userData?.vehicleVisual;if(visual){visual.rotation.x=0;visual.rotation.z=0;}animateVisual(s.player,performance.now()/1000);}
      if(s.police){s.police.position.set(s.x,0,-s.gap);s.police.rotation.set(0,s.heading,0);const policeVisual=s.police.userData?.vehicleVisual;if(policeVisual){policeVisual.rotation.x=0;policeVisual.rotation.z=0;}animateVisual(s.police,performance.now()/1000);}
      cameraChase(s,dt);updateChaseHud(s,sp);
      const countdownEl=UI.body?.querySelector('[data-sckl-countdown]');
      s.countdownRemaining=Math.max(0,s.countdownRemaining-dt);
      if(countdownEl)countdownEl.textContent=String(Math.max(1,Math.ceil(s.countdownRemaining)));
      if(s.countdownRemaining<=0){s.countdownActive=false;if(countdownEl){countdownEl.textContent='LOS!';setTimeout(()=>{if(UI.session===s&&countdownEl){countdownEl.hidden=true;countdownEl.textContent='';}},650);}}
      s.renderer.render(s.scene,s.camera);s.raf=requestAnimationFrame((nextTimestamp)=>animateChase(s,nextTimestamp));return;
    }
    s.elapsed+=dt;
    let maxForward=sp.maxSpeed;const maxReverse=Math.min(70,maxForward*.34),brakeForce=sp.accel*2.55,reverseAccel=sp.accel*.78;
    if(gas&&!reverse){if(s.speed<0)s.speed=approach(s.speed,0,brakeForce*dt);else s.speed+=sp.accel*dt;}else if(reverse&&!gas){if(s.speed>4)s.speed=approach(s.speed,0,brakeForce*dt);else s.speed-=reverseAccel*dt;}else if(gas&&reverse){s.speed=approach(s.speed,0,brakeForce*dt);}else{s.speed=approach(s.speed,0,Math.max(7,Math.abs(s.speed)*.09)*dt);}
    if(nitro&&Number(data.consumables.nitro||0)>0&&s.speed>0){if(!s.nitroConsumed){data.consumables.nitro--;persist(data);s.nitroConsumed=true;toast('Nitro gezündet!','good');}maxForward*=1.34;s.speed+=sp.accel*1.8*dt;}else s.nitroConsumed=false;
    s.speed=clamp(s.speed,-maxReverse,maxForward);const steer=(right?1:0)-(left?1:0),moving=Math.abs(s.speed)>1.2;if(moving&&steer){const speedFactor=Math.min(1,Math.abs(s.speed)/Math.max(55,sp.maxSpeed*.5)),turnRate=1.55*(.22+speedFactor*.78);s.heading+=steer*turnRate*dt*Math.sign(s.speed||1);s.heading=clamp(s.heading,-.62,.62);}
    const meters=s.speed/3.6*dt,trackMeters=meters*Math.cos(s.heading);s.x=clamp(s.x+Math.sin(s.heading)*meters,-7.45,7.45);if(Math.abs(s.x)>=7.42){s.speed*=.985;s.heading*=.985;}s.distance+=Math.max(0,trackMeters);const fuelBurn=.55+Math.abs(s.speed)*.0032;s.fuel=Math.max(0,s.fuel-fuelBurn*dt);if(s.fuel<=0)s.speed=approach(s.speed,0,sp.accel*1.8*dt);
    const copCeiling=Math.max(130,sp.maxSpeed*1.18+45),copTarget=Math.min(copCeiling,1+s.elapsed*1.15+s.distance*.0085),copAccel=2.2+Math.min(5.8,s.elapsed*.025);if(s.copSpeed<copTarget)s.copSpeed=Math.min(copTarget,s.copSpeed+copAccel*dt);else s.copSpeed=Math.max(copTarget,s.copSpeed-3.2*dt);s.gap+=((s.speed*Math.cos(s.heading)-s.copSpeed)/3.6)*dt;s.gap=clamp(s.gap,1.1,96);
    if(Math.abs(s.speed)<12&&s.gap<14)s.arrest+=dt;else s.arrest=Math.max(0,s.arrest-dt*.8);
    if(s.player){
      s.player.position.set(s.x,0,0);
      s.player.rotation.set(0,s.heading,0);
      const visual=s.player.userData?.vehicleVisual;if(visual){visual.rotation.x=0;visual.rotation.z=0;}
      animateVisual(s.player,performance.now()/1000);
    }
    if(s.police){const pf=new THREE.Vector3(Math.sin(s.heading),0,Math.cos(s.heading));s.police.position.set(s.x-pf.x*Math.min(5,s.gap*.15),0,-pf.z*s.gap);s.police.rotation.set(0,s.heading,0);const policeVisual=s.police.userData?.vehicleVisual;if(policeVisual){policeVisual.rotation.x=0;policeVisual.rotation.z=0;}animateVisual(s.police,performance.now()/1000);}
    for(const obj of s.roadSegments){obj.position.z-=trackMeters;if(obj.position.z<-35)obj.position.z+=Number(obj.userData.wrapLength||588);else if(obj.position.z>Number(obj.userData.wrapLength||588)-35)obj.position.z-=Number(obj.userData.wrapLength||588);}
    updateTraffic(s,dt);updateGasStation(s,dt,sp);cameraChase(s,dt);updateChaseHud(s,sp);
    if(s.gap<=2.1||s.arrest>=5||s.hp<=0){finishChase(s,s.hp<=0?'Fahrzeug zerstört':s.arrest>=5?'Festnahme nach 5 Sekunden':'Polizei hat dich eingeholt');return;}
    s.renderer.render(s.scene,s.camera);s.raf=requestAnimationFrame((nextTimestamp)=>animateChase(s,nextTimestamp));
  }
  function updateTraffic(s,dt){const rel=s.speed*Math.cos(s.heading||0)/3.6;for(const t of s.traffic){t.position.z+=(t.userData.trafficSpeed/3.6-rel)*dt;if(t.position.z<-18){t.position.z=180+Math.random()*180;t.position.x=[-4.5,-1.5,1.5,4.5][Math.floor(Math.random()*4)];t.userData.hit=false;}if(!t.userData.hit&&Math.abs(t.position.z)<2.4&&Math.abs(t.position.x-s.x)<1.7){t.userData.hit=true;s.speed*=.62;s.hp-=12+Math.min(22,Math.abs(s.speed)*.06);toast('Kollision!','error');}}}
  function updateGasStation(s,dt,sp){
    const delta=s.gasAt-s.distance,fuelPct=clamp(s.fuel/sp.maxFuel*100,0,100);let message='';
    if(delta<300&&delta>-150){
      s.gasGroup.visible=true;s.gasGroup.position.set(11.2,0,delta);
      const inPumpZone=Math.abs(delta)<12&&s.x>5.45;
      if(inPumpZone&&Math.abs(s.speed)<16){
        s.fuel=Math.min(sp.maxFuel,s.fuel+36*dt);message=`⛽ TANKEN ${Math.round(s.fuel/sp.maxFuel*100)}% · Polizei ${s.gap.toFixed(1)} m hinter dir`;
      }else if(inPumpZone){message='⛽ Zum Tanken unter 16 km/h abbremsen';}
      else if(delta>0&&delta<210){message=`⛽ Tankstelle rechts in ${Math.round(delta)} m`; }
    }else{
      s.gasGroup.visible=false;if(delta<-150)s.gasAt+=1300+Math.random()*1100;
    }
    if(!message&&fuelPct<=18)message=`⚠ Tank fast leer · ${Math.round(fuelPct)}% · nächste Tankstelle rechts`;
    setMessage(message);
  }
  function cameraChase(s,dt){const carForward=new THREE.Vector3(Math.sin(s.heading||0),0,Math.cos(s.heading||0)),target=new THREE.Vector3(s.x-carForward.x*10.5,5.5,-carForward.z*10.5);s.camera.position.copy(target);s.camera.up.set(0,1,0);s.camera.lookAt(s.x+carForward.x*10,1,carForward.z*10);}
  function updateChaseHud(s,sp){updateConsumableHud();setHud('[data-sckl-hud-speed]',speedText(s.speed));setHud('[data-sckl-hud-secondary]',`${fmt(s.distance)} m`);setHud('[data-sckl-hud-hp]',`${Math.max(0,Math.round(s.hp))}/${Math.round(sp.maxHp)}`);setHud('[data-sckl-hud-fuel]',`${Math.round(s.fuel/sp.maxFuel*100)}%`);const host=UI.body?.querySelector('[data-sckl-side]');if(host)host.innerHTML=`<div class="sckl-chase-panel"><small>🚨 ${esc(s.policeDef.name)}</small><b>${s.gap.toFixed(1)} m hinter dir</b><span>Cop ${Math.round(s.copSpeed)} km/h</span><i><em style="width:${clamp(s.arrest/5*100,0,100)}%"></em></i><p>${s.arrest>0?`AUSSTEIGEN! Festnahme in ${(5-s.arrest).toFixed(1)} s`:'Die Einheit wird permanent schneller.'}</p></div>`;}
  function finishChase(s,reason){if(s.finished)return;s.finished=true;cancelAnimationFrame(s.raf);try{s.timer?.dispose?.();}catch{}const data=state(),distance=Math.floor(s.distance),reward=Math.max(25,Math.floor(distance/22));data.coins+=reward;data.stats.totalDistance+=distance;data.stats.bestDistance=Math.max(data.stats.bestDistance,distance);data.stats.busted++;persist(data);window.JKGamesAwardTopGameXp?.('speedcar',Math.max(2,Math.min(60,Math.floor(distance/700))),`Speed Car.KL · ${distance} m`,{toast:false});refreshHeader();const side=UI.body?.querySelector('[data-sckl-side]');if(side)side.innerHTML='';setMessage('');const modal=document.createElement('div');modal.className='sckl-result-modal';modal.innerHTML=`<div><small>FLUCHT BEENDET</small><h2>${esc(reason)}</h2><div class="sckl-result-stats"><span><b>${fmt(distance)} m</b><small>Distanz</small></span><span><b>+${fmt(reward)}</b><small>Speed Coins</small></span><span><b>${Math.round(s.copSpeed)} km/h</b><small>Cop-Speed</small></span></div><div><button class="primary" data-result-retry>Nochmal</button><button data-result-lobby>Open Lobby</button><button data-result-home>Hauptmenü</button></div></div>`;UI.body?.querySelector('.sckl-game')?.append(modal);modal.querySelector('[data-result-retry]')?.addEventListener('click',startChase);modal.querySelector('[data-result-lobby]')?.addEventListener('click',startLobby);modal.querySelector('[data-result-home]')?.addEventListener('click',()=>{stopWorld();renderHome();});}

  function bindWorldControls(s){
    UI.body?.querySelector('[data-sckl-world-exit]')?.addEventListener('click',()=>{stopWorld();renderHome();});
    UI.body?.querySelectorAll('[data-touch]').forEach(btn=>{const key=btn.dataset.touch;const down=e=>{e.preventDefault();UI.touch[key]=true;if(key==='nitro')setTimeout(()=>UI.touch[key]=false,900);};const up=e=>{e.preventDefault();if(key!=='nitro')UI.touch[key]=false;};btn.addEventListener('pointerdown',down);btn.addEventListener('pointerup',up);btn.addEventListener('pointercancel',up);btn.addEventListener('pointerleave',up);});
    UI.body?.querySelector('[data-sckl-message]')?.addEventListener('click',()=>interactWorld(s));
    UI.body?.querySelector('[data-sckl-consume="repair"]')?.addEventListener('click',()=>useConsumable(s,'repair'));
    UI.body?.querySelector('[data-sckl-consume="fuel"]')?.addEventListener('click',()=>useConsumable(s,'fuel'));
    UI.body?.querySelector('[data-sckl-owner-ingame]')?.addEventListener('click',()=>showOwnerIngameMenu(s));
    updateConsumableHud();
  }
  function input(kind){if(kind==='gas')return UI.keys.KeyW||UI.keys.ArrowUp||UI.touch.gas;if(kind==='brake')return UI.keys.KeyS||UI.keys.ArrowDown||UI.touch.brake;if(kind==='left')return UI.keys.KeyD||UI.keys.ArrowRight||UI.touch.right;if(kind==='right')return UI.keys.KeyA||UI.keys.ArrowLeft||UI.touch.left;if(kind==='nitro')return UI.keys.ShiftLeft||UI.keys.ShiftRight||UI.touch.nitro;return false;}
  function onKeyDown(e){if(!UI.overlay)return;UI.keys[e.code]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.code==='Escape'){e.preventDefault();stopWorld();renderHome();}if(e.code==='KeyE'&&UI.session?.mode==='lobby')interactWorld(UI.session);if(e.code==='KeyM'&&UI.session?.mode==='lobby'&&isOwner())showOwnerIngameMenu(UI.session);if(e.code==='KeyR'&&UI.session)useConsumable(UI.session,'repair');if(e.code==='KeyF'&&UI.session)useConsumable(UI.session,'fuel');}
  function onKeyUp(e){UI.keys[e.code]=false;}
  function interactWorld(s){if(s.mode!=='lobby')return;if(s.nearPlace==='shop'){stopWorld();renderGarage();}else if(s.nearPlace==='tune'){stopWorld();renderTuning();}}

  function showOwnerIngameMenu(s){if(!isOwner()||document.querySelector('[data-sckl-owner-float]'))return;const pop=document.createElement('div');pop.className='sckl-owner-float';pop.dataset.scklOwnerFloat='1';pop.innerHTML=`<header><b>OWNER MOD</b><button data-close>×</button></header><label>Speed <select data-mod-speed><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option><option value="8">8×</option></select></label><label>Größe <select data-mod-size><option value="0.5">0,5×</option><option value="1" selected>1×</option><option value="2">2×</option><option value="4">4×</option></select></label><button data-mod-god>Godmode: AUS</button><button data-mod-noclip>Noclip: AUS</button><button class="owner" data-mod-bugatti>Owner Bugatti</button><button class="owner" data-mod-flight>F-22 Flugmodus</button><small>Flug: Leertaste hoch · Shift runter</small>`;UI.overlay.append(pop);pop.querySelector('[data-close]').onclick=()=>pop.remove();pop.querySelector('[data-mod-speed]').value=String(s.owner.speedMult||1);pop.querySelector('[data-mod-speed]').onchange=e=>s.owner.speedMult=Number(e.target.value)||1;pop.querySelector('[data-mod-size]').value=String(s.owner.size||1);pop.querySelector('[data-mod-size]').onchange=e=>s.owner.size=Number(e.target.value)||1;pop.querySelector('[data-mod-god]').onclick=e=>{s.owner.godmode=!s.owner.godmode;e.currentTarget.textContent=`Godmode: ${s.owner.godmode?'AN':'AUS'}`;};pop.querySelector('[data-mod-noclip]').onclick=e=>{s.owner.noclip=!s.owner.noclip;e.currentTarget.textContent=`Noclip: ${s.owner.noclip?'AN':'AUS'}`;};pop.querySelector('[data-mod-bugatti]').onclick=()=>replaceOwnerVehicle(s,'owner-bugatti',false);pop.querySelector('[data-mod-flight]').onclick=()=>replaceOwnerVehicle(s,'owner-f22',true);}
  async function replaceOwnerVehicle(s,carId,flight){if(!isOwner()||UI.session!==s)return;try{const model=await makeVehicleModel(carId);if(UI.session!==s)return;if(s.player)s.scene.remove(s.player);s.player=model;s.scene.add(model);s.carId=carId;s.owner.flight=flight;s.owner.noclip=flight||s.owner.noclip;s.hp=specs(state(),carId).maxHp;s.fuel=specs(state(),carId).maxFuel;toast(flight?'F-22 Flugmodus aktiv.':'Owner Bugatti aktiv.','good');}catch{toast('Owner-Fahrzeug konnte nicht geladen werden.','error');}}

  function updateConsumableHud(){const data=state();setHud('[data-sckl-repair-count]',fmt(data.consumables.repairKit));setHud('[data-sckl-fuel-count]',fmt(data.consumables.fuelCan));}
  function useConsumable(s,kind){if(!s||UI.session!==s)return;const data=state(),sp=specs(data,s.carId||data.selectedCar);if(kind==='repair'){if(Number(data.consumables.repairKit||0)<=0)return toast('Kein Repair-Kit vorhanden.','error');if(s.hp>=sp.maxHp-1)return toast('Dein Fahrzeug ist bereits vollständig repariert.');data.consumables.repairKit--;s.hp=Math.min(sp.maxHp,s.hp+sp.maxHp*.6);persist(data);toast('Repair-Kit benutzt.','good');}else if(kind==='fuel'){if(Number(data.consumables.fuelCan||0)<=0)return toast('Kein Reservekanister vorhanden.','error');if(s.fuel>=sp.maxFuel-1)return toast('Der Tank ist bereits voll.');data.consumables.fuelCan--;s.fuel=Math.min(sp.maxFuel,s.fuel+sp.maxFuel*.55);persist(data);toast('Reservekanister benutzt.','good');}updateConsumableHud();}

  function setHud(sel,text){const el=UI.body?.querySelector(sel);if(el)el.textContent=text;}
  function setMessage(html){const el=UI.body?.querySelector('[data-sckl-message]');if(el)el.innerHTML=html||'';}
  function resizeWorld(){const s=UI.session;if(!s?.renderer||!s.host)return;const w=Math.max(1,s.host.clientWidth),h=Math.max(1,s.host.clientHeight);s.renderer.setSize(w,h,false);s.camera.aspect=w/h;s.camera.updateProjectionMatrix();}

  function stopWorld(){
    const s=UI.session;if(!s)return;UI.session=null;cancelAnimationFrame(s.raf);clearTimeout(s.remoteRetryTimer);try{s.timer?.dispose?.();}catch{}try{s.remoteUnsub?.();}catch{}if(s.fb&&s.user){s.fb.deleteDoc(s.fb.doc(s.fb.db,'speedCarKlLobby',s.user.uid)).catch(()=>{});}s.remoteObjects?.clear?.();try{s.renderer?.dispose?.();}catch{}UI.touch={gas:false,brake:false,left:false,right:false,nitro:false};UI.overlay?.querySelector('[data-sckl-owner-float]')?.remove();
  }

  function grantJkCoinPurchase(kind,amount=1){const data=state(),qty=Math.max(1,Math.floor(Number(amount)||1));if(kind==='nitro')data.consumables.nitro+=qty;else if(kind==='repairKit')data.consumables.repairKit+=qty;else if(kind==='fuelCan')data.consumables.fuelCan+=qty;else if(kind==='tuneToken')data.consumables.tuneToken+=qty;else if(kind==='speedCoins')data.coins+=50000*qty;else return false;persist(data);if(UI.overlay){toast(`JK/Coin Extra erhalten: ${kind} ×${qty}`,'good');refreshHeader();}return true;}

  function setLobbyMapUrl(url=''){const data=state();data.customMapUrl=String(url||'').trim();persist(data);try{if(data.customMapUrl)localStorage.setItem(CUSTOM_MAP_CONFIG_KEY,data.customMapUrl);else localStorage.removeItem(CUSTOM_MAP_CONFIG_KEY);}catch{}return data.customMapUrl;}

  window.SpeedCarKL=Object.freeze({version:VERSION,open,close,returnToTopGames,grantJkCoinPurchase,setLobbyMapUrl,state:()=>state(),cars:CAR_CATALOG.map(c=>({id:c.id,name:c.name,speed:c.speed,ownerOnly:!!c.ownerOnly}))});
})();
