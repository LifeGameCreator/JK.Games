import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/*
  Weed Farm KL – JK.Games Top Game V498
  - Zu Fuß ausschließlich Ego-Perspektive
  - Fahrzeuge mit Außenkamera
  - Eigenständiger localStorage-Spielstand, keine JK/Coin-/Firebase-Kopplung
  - Procedural Map + vom Nutzer gelieferte GLB-Spielassets
*/

const VERSION = '2026-08-18-v498';
const SAVE_KEY = 'weed-farm-kl-v497';
const MONEY_MAX = 1_000_000;
const GROW_STEP_MS = 45_000;
const ASSET = 'assets/weed-farm-kl/';
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const fmtMoney = n => '$ ' + Math.max(0, Math.floor(Number(n) || 0)).toLocaleString('de-DE');

const VAULT_LEVELS = [
  {capacity:1_000,price:0},{capacity:5_000,price:750},{capacity:10_000,price:3_500},
  {capacity:25_000,price:7_500},{capacity:50_000,price:18_000},{capacity:100_000,price:35_000},
  {capacity:250_000,price:80_000},{capacity:500_000,price:180_000},{capacity:750_000,price:330_000},
  {capacity:1_000_000,price:550_000}
];

const VEHICLES = [
  {id:'starter',name:'Low Poly Car 6',model:'low_poly_car_6.glb',price:35_000,top:28,accel:10,turn:1.65,fuel:48,consumption:7.5,length:4.2,modelYaw:Math.PI/2,radius:1.35,desc:'Günstiges erstes Auto für kleine Fahrten.'},
  {id:'mustang',name:'Mustang 1965',model:ASSET+'vehicle-mustang-1965.glb',price:75_000,top:34,accel:11,turn:1.55,fuel:60,consumption:10.5,length:4.7,modelYaw:0,radius:1.45,desc:'Klassiker mit brauchbarem Tempo und etwas Stauraum.'},
  {id:'rigged',name:'Low Poly Car Rigged',model:'low_poly_car_rigged.glb',price:110_000,top:38,accel:13,turn:1.72,fuel:55,consumption:9.2,length:4.5,modelYaw:0,radius:1.45,desc:'Sportlicher Midgame-Wagen mit guter Beschleunigung.'},
  {id:'sports',name:'Low Poly Sports Car',model:'low_poly_sports_car.glb',price:165_000,top:43,accel:15,turn:1.82,fuel:58,consumption:11.5,length:4.4,modelYaw:0,radius:1.45,desc:'Schneller Fluchtwagen mit wenig Stauraum.'},
  {id:'porsche',name:'Porsche 911',model:ASSET+'vehicle-porsche-911.glb',price:220_000,top:46,accel:16,turn:1.9,fuel:64,consumption:12.2,length:4.6,modelYaw:0,radius:1.5,desc:'Sehr schnell, präzise und auffällig.'},
  {id:'supercar',name:'Super Car',model:'super_car.glb',price:350_000,top:49,accel:18,turn:1.95,fuel:70,consumption:14.5,length:4.6,modelYaw:0,radius:1.5,desc:'High-End-Sportwagen mit sehr hoher Geschwindigkeit.'},
  {id:'kamaz',name:'Kamaz 5350',model:ASSET+'vehicle-kamaz-5350.glb?v=20260818-wf-v498-pbr',price:700_000,top:22,accel:6,turn:.82,fuel:250,consumption:34,length:8,modelYaw:0,radius:2.5,desc:'Endgame-LKW für große Transporte. Langsam, schwer und riesig.'},
  {id:'bugatti',name:'Bugatti Chiron',model:'lowpoly_bugatti_chiron.glb',price:950_000,top:56,accel:21,turn:2,fuel:100,consumption:18.8,length:4.9,modelYaw:0,radius:1.55,desc:'Fast Max-Money. Ultimative Geschwindigkeit und Prestige.'}
];

const WEAPONS = [
  {id:'bat',name:'Baseballschläger',model:'baseball-bat.glb',price:400,damage:35,rate:500,category:'Nahkampf',size:.85},
  {id:'knife',name:'Messer',model:'knife.glb',price:650,damage:45,rate:380,category:'Nahkampf',size:.55},
  {id:'glock',name:'Glock',model:'glock.glb',price:850,damage:34,rate:210,category:'Pistole',size:.46},
  {id:'pistolSand',name:'Pistole Grau/Sand',model:'sand-pistol.glb',price:1_200,damage:38,rate:220,category:'Pistole',size:.48},
  {id:'revolver',name:'Revolver',model:'revolver.glb',price:2_500,damage:58,rate:430,category:'Pistole',size:.52},
  {id:'deagle',name:'Desert Eagle',model:'desert-eagle.glb',price:4_500,damage:72,rate:460,category:'Pistole',size:.55},
  {id:'tech9',name:'Tech9',model:ASSET+'weapon-tech9.glb',price:5_500,damage:24,rate:105,category:'SMG',size:.58},
  {id:'miniUzi',name:'Mini Uzi',model:'mini-uzi.glb',price:7_000,damage:25,rate:90,category:'SMG',size:.6},
  {id:'uzi',name:'Uzi',model:'uzi.glb',price:8_500,damage:27,rate:95,category:'SMG',size:.62},
  {id:'ump9',name:'UMP 9',model:'ump9.glb',price:11_000,damage:31,rate:115,category:'SMG',size:.75},
  {id:'tommy',name:'Tommy Gun',model:'tommy-gun.glb',price:13_000,damage:32,rate:120,category:'SMG',size:.82},
  {id:'shotgun',name:'Shotgun',model:'shotgun.glb',price:14_000,damage:95,rate:720,category:'Schwer',size:.95},
  {id:'ak47',name:'AK47 Black/Brown',model:'ak47-black-brown.glb',price:18_000,damage:42,rate:135,category:'Sturmgewehr',size:.92},
  {id:'ak12',name:'AK12',model:'ak12.glb',price:21_000,damage:44,rate:125,category:'Sturmgewehr',size:.95},
  {id:'an94',name:'AN94',model:'an94.glb',price:24_000,damage:46,rate:120,category:'Sturmgewehr',size:.95},
  {id:'m4',name:'M4',model:'m4.glb',price:27_000,damage:45,rate:115,category:'Sturmgewehr',size:.95},
  {id:'scar',name:'SCAR',model:'scar.glb',price:31_000,damage:49,rate:125,category:'Sturmgewehr',size:1},
  {id:'suppressed',name:'Sturmgewehr mit Schalldämpfer',model:'suppressed-rifle.glb',price:38_000,damage:47,rate:120,category:'Sturmgewehr',size:1.05,heatMult:.45},
  {id:'barrett',name:'Barrett',model:'barrett.glb',price:75_000,damage:160,rate:1_050,category:'Schwer',size:1.15},
  {id:'katana',name:'Katana',model:'katana.glb',price:9_000,damage:82,rate:520,category:'Nahkampf',size:1.05}
];

const DEFAULT_STATE = {
  money:1_000,vaultLevel:1,weedLoose:0,packaged:{bag1:0,bag10:0,brick:0,strapped:0},
  ownedVehicles:[],vehicleFuel:{},ownedWeapons:[],equippedWeapon:null,
  plants:Array.from({length:4},()=>({stage:0,startedAt:0})),heat:0,health:100,totalHarvested:0,totalEarned:0,
  tutorialStep:0,
  phone:{offers:[],active:null,completed:0,reputation:0,lastRefreshAt:0}
};

const deepClone = v => JSON.parse(JSON.stringify(v));
function loadState(){
  try{
    const parsed=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');
    if(!parsed)return deepClone(DEFAULT_STATE);
    const s=Object.assign(deepClone(DEFAULT_STATE),parsed);
    s.packaged=Object.assign({},DEFAULT_STATE.packaged,parsed.packaged||{});
    s.plants=Array.isArray(parsed.plants)&&parsed.plants.length===4?parsed.plants:deepClone(DEFAULT_STATE.plants);
    s.ownedVehicles=Array.from(new Set(parsed.ownedVehicles||[]));
    s.ownedWeapons=Array.from(new Set(parsed.ownedWeapons||[]));
    s.vehicleFuel=parsed.vehicleFuel||{};
    s.phone=Object.assign({},DEFAULT_STATE.phone,parsed.phone||{});
    s.phone.offers=Array.isArray(s.phone.offers)?s.phone.offers.slice(0,3):[];
    s.phone.active=s.phone.active&&typeof s.phone.active==='object'?s.phone.active:null;
    s.tutorialStep=clamp(Math.floor(Number(s.tutorialStep)||0),0,6);
    s.money=clamp(Number(s.money)||0,0,MONEY_MAX);
    s.vaultLevel=clamp(Math.floor(Number(s.vaultLevel)||1),1,VAULT_LEVELS.length);
    s.health=clamp(Number(s.health)||100,1,100);s.heat=clamp(Number(s.heat)||0,0,100);
    return s;
  }catch(e){console.warn('[Weed Farm KL] Save load failed',e);return deepClone(DEFAULT_STATE);}
}
function isOwner(){
  try{return !!(window.LifeBuilderSettingsMenu?.isOwner?.()||window.LifeBuilderSettingsMenu?.getRole?.()?.role==='owner');}catch{return false;}
}

let ACTIVE=null;

function createOverlay(){
  const el=document.createElement('div');el.className='wfkl-overlay';el.innerHTML=`
    <div class="wfkl-canvas"><canvas aria-label="Weed Farm KL 3D"></canvas></div><div class="wfkl-vignette"></div>
    <div class="wfkl-hud" hidden data-wf-hud>
      <div class="wfkl-topbar"><div class="wfkl-stats">
        <div class="wfkl-stat"><small>MONEY</small><b data-wf-money>$ 1.000</b></div>
        <div class="wfkl-stat"><small>TRESOR</small><b data-wf-vault>$ 1.000 / $ 1.000</b></div>
        <div class="wfkl-stat"><small>WEED</small><b data-wf-weed>0 g</b></div>
        <div class="wfkl-stat"><small>LEBEN</small><b data-wf-health>100</b></div>
        <div class="wfkl-stat"><small>HEAT</small><b data-wf-heat>0</b></div>
      </div><div class="wfkl-top-actions"><button data-wf-help title="Hilfe">?</button><button data-wf-pause title="Pause">Ⅱ</button><button data-wf-exit title="Top Games">×</button></div></div>
      <div class="wfkl-location" data-wf-location>FARM HOUSE</div><div class="wfkl-objective" data-wf-objective><small>START</small><b>Gehe in den Grow Room und setze deine erste Pflanze.</b></div><div class="wfkl-crosshair" data-wf-crosshair></div>
      <div class="wfkl-prompt" data-wf-prompt></div><div class="wfkl-toast" data-wf-toast></div>
      <div class="wfkl-weapon-hud"><small>HAND</small><b data-wf-weapon>Fäuste</b></div>
      <div class="wfkl-vehicle-hud" hidden data-wf-vehicle-hud><small>FAHRZEUG</small><b data-wf-vehicle-name>–</b><div class="wfkl-vehicle-grid"><span><em>SPEED</em><strong data-wf-speed>0 km/h</strong></span><span><em>TANK</em><strong data-wf-fuel>0 / 0 L</strong></span></div></div>
      <div class="wfkl-touch"><div class="wfkl-look-hint">RECHTS ZIEHEN · KAMERA</div><div class="wfkl-stick" data-wf-stick><i></i></div><div class="wfkl-touch-actions"><button class="sprint" data-wf-sprint>SPRINT</button><button class="action" data-wf-action>AKTION</button><button class="fire" data-wf-fire>BENUTZEN</button><button data-wf-brake>BREMSE</button></div></div>
    </div>
    <div class="wfkl-start" data-wf-start-wrap><div class="wfkl-card"><small>JK.GAMES · TOP GAME · V498</small><h1>WEED FARM KL</h1><p>Dein Business beginnt im Farmhaus. Setze im Grow Room Pflanzen, ernte sie, verpacke die Ware am Weed Table und bestelle anschließend Kunden über dein Smartphone. Die Stadt besitzt Bahnhof, Hinterhöfe, Industrie, Waffenladen, Fahrzeughändler und Tankstelle.</p><div class="wfkl-controls"><article><b>W / S</b><span>Vorwärts / rückwärts</span></article><article><b>A / D</b><span>Links / rechts</span></article><article><b>Maus</b><span>Umsehen</span></article><article><b>E</b><span>Objekt / Shop / Auto</span></article><article><b>V</b><span>Smartphone öffnen</span></article><article><b>Shift</b><span>Sprint / stärker Gas</span></article><article><b>Linksklick</b><span>Waffe / Item benutzen</span></article><article><b>1 / 2</b><span>Waffe / Fäuste</span></article><article><b>3 / 4</b><span>Joint / Weed</span></article></div><button class="wfkl-primary" data-wf-start>SPIEL STARTEN</button><p>${isOwner()?'Owner-Test: F8 gibt 100.000 $ Testgeld · F7 setzt den Weed-Farm-Spielstand zurück.':'Spielstand wird ausschließlich lokal für Weed Farm KL gespeichert.'}</p></div></div>
    <div class="wfkl-phone" data-wf-phone hidden><div class="wfkl-phone-shell"><div class="wfkl-phone-notch"></div><header><div><small>WEED FARM KL</small><b>BUSINESS PHONE</b></div><button data-wf-phone-close>×</button></header><nav><button class="active" data-wf-phone-tab="home">HOME</button><button data-wf-phone-tab="clients">KUNDEN</button><button data-wf-phone-tab="guide">GUIDE</button></nav><main data-wf-phone-content></main><footer><span>V = schließen</span><span>WASD bleibt aktiv</span></footer></div></div>
    <div class="wfkl-modal-wrap" data-wf-modal hidden><div class="wfkl-card"><div class="wfkl-modal-head"><div data-wf-modal-content></div><button class="wfkl-close" data-wf-modal-close>×</button></div></div></div>`;
  document.body.append(el);document.body.classList.add('weed-farm-kl-open');return el;
}

function createSession(sourceDevice){
  const overlay=createOverlay();const q=s=>overlay.querySelector(s);const qa=s=>[...overlay.querySelectorAll(s)];
  const ui={canvas:q('canvas'),hud:q('[data-wf-hud]'),money:q('[data-wf-money]'),vault:q('[data-wf-vault]'),weed:q('[data-wf-weed]'),health:q('[data-wf-health]'),heat:q('[data-wf-heat]'),vehicleHud:q('[data-wf-vehicle-hud]'),vehicleName:q('[data-wf-vehicle-name]'),speed:q('[data-wf-speed]'),fuel:q('[data-wf-fuel]'),weapon:q('[data-wf-weapon]'),prompt:q('[data-wf-prompt]'),toast:q('[data-wf-toast]'),location:q('[data-wf-location]'),objective:q('[data-wf-objective]'),crosshair:q('[data-wf-crosshair]'),startWrap:q('[data-wf-start-wrap]'),phone:q('[data-wf-phone]'),phoneContent:q('[data-wf-phone-content]'),modal:q('[data-wf-modal]'),modalContent:q('[data-wf-modal-content]')};
  const state=loadState();const vaultCapacity=()=>VAULT_LEVELS[state.vaultLevel-1].capacity;
  const saveState=()=>{try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));}catch(e){console.warn('[Weed Farm KL] save failed',e);}};
  let toastTimer=0;function toast(msg,kind='info'){ui.toast.textContent=msg;ui.toast.className='wfkl-toast show '+kind;clearTimeout(toastTimer);toastTimer=setTimeout(()=>ui.toast.classList.remove('show'),2300);}
  function addMoney(amount,reason=''){amount=Math.max(0,Math.floor(amount));const room=Math.max(0,vaultCapacity()-state.money);const accepted=Math.min(room,amount);state.money+=accepted;state.totalEarned+=accepted;const overflow=amount-accepted;saveState();updateHUD();rebuildVaultCash();if(overflow>0)toast(`Tresor voll: ${fmtMoney(overflow)} passen nicht mehr hinein.`,'bad');else if(reason)toast(`+${fmtMoney(accepted)} · ${reason}`,'good');return accepted;}
  function spendMoney(amount){amount=Math.max(0,Math.floor(amount));if(state.money<amount){toast(`Nicht genug Money. Benötigt: ${fmtMoney(amount)}`,'bad');return false;}state.money-=amount;saveState();updateHUD();rebuildVaultCash();return true;}

  const scene=new THREE.Scene();scene.background=new THREE.Color(0x9fc9df);scene.fog=new THREE.Fog(0xa9cee0,125,365);
  const camera=new THREE.PerspectiveCamera(74,1,.06,700);camera.rotation.order='YXZ';
  const renderer=new THREE.WebGLRenderer({canvas:ui.canvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;
  scene.add(new THREE.HemisphereLight(0xeaf8ff,0x526549,1.85));const sun=new THREE.DirectionalLight(0xffedc9,2.8);sun.position.set(-90,130,-70);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-235;sun.shadow.camera.right=235;sun.shadow.camera.top=195;sun.shadow.camera.bottom=-195;sun.shadow.camera.far=350;scene.add(sun);
  const world=new THREE.Group();scene.add(world);const loader=new GLTFLoader();const modelCache=new Map();
  const obstacles=[];const cameraBlockers=[];const vehicleInstances=new Map();
  const MAP_X=208,MAP_Z=168;

  async function loadTemplate(url){if(modelCache.has(url))return modelCache.get(url);const promise=new Promise((resolve,reject)=>loader.load(url,g=>resolve(g.scene),undefined,reject));modelCache.set(url,promise);return promise;}
  async function cloneModel(url){const tpl=await loadTemplate(url);return tpl.clone(true);}
  function shadows(obj,cast=true,receive=true){obj.traverse(o=>{if(o.isMesh){o.castShadow=cast;o.receiveShadow=receive;}});return obj;}
  function fitObject(obj,{targetLength=null,targetHeight=null,targetMax=null,modelYaw=0,center=true}={}){obj.rotation.y=modelYaw;obj.updateMatrixWorld(true);let box=new THREE.Box3().setFromObject(obj),size=box.getSize(new THREE.Vector3()),scale=1;if(targetLength)scale=targetLength/Math.max(.001,size.z);else if(targetHeight)scale=targetHeight/Math.max(.001,size.y);else if(targetMax)scale=targetMax/Math.max(.001,size.x,size.y,size.z);obj.scale.setScalar(scale);obj.updateMatrixWorld(true);box=new THREE.Box3().setFromObject(obj);const c=box.getCenter(new THREE.Vector3());if(center){obj.position.x-=c.x;obj.position.z-=c.z;}obj.position.y-=box.min.y;return obj;}
  function addObstacle(x,z,w,d,tag='wall'){const o={minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,tag};obstacles.push(o);return o;}
  function boxMesh(x,y,z,w,h,d,color,{obstacle=true,cameraBlock=true,roughness=.86,metalness=0,group=world}={}){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness,metalness}));m.position.set(x,y+h/2,z);m.castShadow=true;m.receiveShadow=true;group.add(m);if(obstacle)addObstacle(x,z,w,d);if(cameraBlock&&obstacle)cameraBlockers.push(m);return m;}
  function planeRect(x,z,w,d,color,y=.012,group=world){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshStandardMaterial({color,roughness:1}));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.receiveShadow=true;group.add(m);return m;}
  function cylinder(x,y,z,rt,rb,h,color,segments=10,group=world){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),new THREE.MeshStandardMaterial({color,roughness:.9}));m.position.set(x,y+h/2,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
  function makeLabel(text,{scale=1,color='#fff',bg='rgba(3,10,6,.80)'}={}){const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=bg;if(ctx.roundRect){ctx.beginPath();ctx.roundRect(20,35,984,186,34);ctx.fill();}else ctx.fillRect(20,35,984,186);ctx.font='900 74px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,512,130);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:true}));s.scale.set(8*scale,2*scale,1);return s;}
  function addLabel(text,x,y,z,scale=.65){const s=makeLabel(text,{scale});s.position.set(x,y,z);world.add(s);return s;}
  function collidesXZ(x,z,r=.43,ignoreVehicle=null){if(Math.abs(x)>MAP_X||Math.abs(z)>MAP_Z)return true;for(const b of obstacles){const cx=clamp(x,b.minX,b.maxX),cz=clamp(z,b.minZ,b.maxZ),dx=x-cx,dz=z-cz;if(dx*dx+dz*dz<r*r)return true;}for(const inst of vehicleInstances.values()){if(inst===ignoreVehicle)continue;const p=inst.group.position,rr=r+inst.config.radius*.78;if((x-p.x)**2+(z-p.z)**2<rr*rr)return true;}return false;}


  // ---------------------------------------------------------------------------
  // World construction: bounded map, roads, rooms, train station and alleys.
  // ---------------------------------------------------------------------------
  const interactions=[];
  const locations=[];
  const plantGroups=[];
  const vaultCashGroup=new THREE.Group();world.add(vaultCashGroup);
  const processGroup=new THREE.Group();world.add(processGroup);
  const gasGroup=new THREE.Group();world.add(gasGroup);
  const enemyHitMeshes=[];const enemies=[];const corpses=[];
  const staticRay=new THREE.Raycaster();

  function road(x,z,w,d,axis='z'){
    planeRect(x,z,w,d,0x30363a,.018);
    // sidewalks
    if(axis==='z'){
      planeRect(x-w/2-2.2,z,4,d,0x8d8f8b,.03);planeRect(x+w/2+2.2,z,4,d,0x8d8f8b,.03);
      for(let zz=z-d/2+9;zz<z+d/2;zz+=18){planeRect(x,zz,.28,8,0xe6dbab,.035);}
    }else{
      planeRect(x,z-d/2-2.2,w,4,0x8d8f8b,.03);planeRect(x,z+d/2+2.2,w,4,0x8d8f8b,.03);
      for(let xx=x-w/2+9;xx<x+w/2;xx+=18){planeRect(xx,z,8,.28,0xe6dbab,.035);}
    }
  }
  function tree(x,z,s=1,type='broad'){
    const trunkColor=type==='birch'?0xb8aa8c:0x67482d;
    cylinder(x,0,z,.26*s,.34*s,2.7*s,trunkColor,8);
    if(type==='pine'){
      for(let i=0;i<3;i++){const crown=new THREE.Mesh(new THREE.ConeGeometry((1.55-i*.22)*s,2.5*s,8),new THREE.MeshStandardMaterial({color:i===0?0x244d34:0x315d3c,roughness:1}));crown.position.set(x,(3.0+i*.85)*s,z);crown.castShadow=true;world.add(crown);}
    }else{
      const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(1.25*s,1),new THREE.MeshStandardMaterial({color:type==='birch'?0x5d8647:0x3e7745,roughness:1}));crown.scale.set(1.1,1.2,.95);crown.position.set(x,3.55*s,z);crown.castShadow=true;world.add(crown);
      if(s>.8){const c2=crown.clone();c2.scale.multiplyScalar(.72);c2.position.set(x+.72*s,3.35*s,z-.42*s);world.add(c2);}
    }
    addObstacle(x,z,1.05*s,1.05*s,'tree');
  }
  function bush(x,z,s=1,color=0x3b743d){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(.7*s,1),new THREE.MeshStandardMaterial({color,roughness:1}));m.scale.set(1.45,.8,1);m.position.set(x,.55*s,z);m.castShadow=true;world.add(m);}
  function rock(x,z,s=1,color=0x74766f){const m=new THREE.Mesh(new THREE.DodecahedronGeometry(.8*s,0),new THREE.MeshStandardMaterial({color,roughness:1}));m.scale.set(1.4,.85,1.05);m.rotation.set(.15,.35,.08);m.position.set(x,.55*s,z);m.castShadow=true;m.receiveShadow=true;world.add(m);addObstacle(x,z,1.0*s,.8*s,'rock');}
  function lamp(x,z){
    cylinder(x,0,z,.07,.10,4.4,0x252b2d,7);
    const bulb=new THREE.Mesh(new THREE.SphereGeometry(.14,8,6),new THREE.MeshStandardMaterial({color:0xffe7ad,emissive:0xffc55c,emissiveIntensity:2.2}));bulb.position.set(x,4.3,z);world.add(bulb);
  }
  function mountain(x,z,s=1,rot=0,variant=0){
    const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;world.add(g);
    const colors=[0x596955,0x66745c,0x6d705e,0x52634e],rockColors=[0x88877d,0x7b817c,0x929085];
    const base=new THREE.Mesh(new THREE.ConeGeometry((10.5+variant%3*2.2)*s,(19+variant%4*3.1)*s,7+variant%3),new THREE.MeshStandardMaterial({color:colors[variant%colors.length],roughness:1}));base.position.y=(10+variant%4*1.2)*s;base.scale.z=.72+((variant*7)%5)*.06;base.castShadow=true;base.receiveShadow=true;g.add(base);
    if(variant%2===0){const cap=new THREE.Mesh(new THREE.DodecahedronGeometry(4.2*s,0),new THREE.MeshStandardMaterial({color:rockColors[variant%rockColors.length],roughness:1}));cap.scale.set(1.4,.85,.95);cap.position.set((variant%3-1)*2*s,(17+variant%3*2)*s,-1*s);g.add(cap);}
  }
  function crosswalk(x,z,axis='x'){for(let i=-3;i<=3;i++){const off=i*1.05;if(axis==='x')planeRect(x+off,z,.55,7.2,0xe9e6d9,.045);else planeRect(x,z+off,7.2,.55,0xe9e6d9,.045);}}
  function streetSign(text,x,z,yaw=0){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=yaw;world.add(g);const pole=new THREE.Mesh(new THREE.CylinderGeometry(.06,.08,2.4,7),new THREE.MeshStandardMaterial({color:0x343a3c}));pole.position.y=1.2;g.add(pole);const label=makeLabel(text,{scale:.25,bg:'rgba(23,56,33,.92)'});label.position.set(0,2.65,0);g.add(label);}
  function fence(x,z,w,d=0.22){boxMesh(x,0,z,w,1.25,d,0x504a40,{roughness:1});}
  function wallSegment(x,z,w,d,h=3.2,color=0xb8b2a2){return boxMesh(x,0,z,w,h,d,color,{roughness:.93});}
  function simpleBuilding({x,z,w=20,d=16,h=7,color=0xb7a98f,roof=0x53504a,label='',doorSide='south',doorOffset=0,doorWidth=3.2,accent=0x3f4c47}){
    planeRect(x,z,w,d,0x6d6c65,.032);
    const t=.55;
    wallSegment(x-w/2,z,t,d,h,color);wallSegment(x+w/2,z,t,d,h,color);
    if(doorSide==='south'){
      const start=x-w/2, doorX=x+doorOffset;const left=(doorX-doorWidth/2)-start;const right=(start+w)-(doorX+doorWidth/2);
      if(left>0)wallSegment(start+left/2,z-d/2,left,t,h,color);if(right>0)wallSegment(doorX+doorWidth/2+right/2,z-d/2,right,t,h,color);wallSegment(x,z+d/2,w,t,h,color);
    }else if(doorSide==='north'){
      wallSegment(x,z-d/2,w,t,h,color);const start=x-w/2,doorX=x+doorOffset;const left=(doorX-doorWidth/2)-start,right=(start+w)-(doorX+doorWidth/2);if(left>0)wallSegment(start+left/2,z+d/2,left,t,h,color);if(right>0)wallSegment(doorX+doorWidth/2+right/2,z+d/2,right,t,h,color);
    }else{wallSegment(x,z-d/2,w,t,h,color);wallSegment(x,z+d/2,w,t,h,color);}
    const r=new THREE.Mesh(new THREE.BoxGeometry(w+1,.55,d+1),new THREE.MeshStandardMaterial({color:roof,roughness:.95}));r.position.set(x,h+.25,z);r.castShadow=true;r.receiveShadow=true;world.add(r);cameraBlockers.push(r);
    // roof trim, windows, door frame and warm interior light make every building read as an actual place instead of an empty box.
    const trimMat=new THREE.MeshStandardMaterial({color:accent,roughness:.8}),winMat=new THREE.MeshStandardMaterial({color:0x85b6c6,emissive:0x13262b,emissiveIntensity:.22,roughness:.22,metalness:.06});
    for(const zz of [z-d/2-.03,z+d/2+.03])for(let xx=x-w/2+4;xx<=x+w/2-4;xx+=5.5){if(doorSide==='south'&&zz<z&&Math.abs(xx-(x+doorOffset))<doorWidth)continue;if(doorSide==='north'&&zz>z&&Math.abs(xx-(x+doorOffset))<doorWidth)continue;const pane=new THREE.Mesh(new THREE.PlaneGeometry(2.3,1.35),winMat);pane.position.set(xx,2.75,zz);pane.rotation.y=zz>z?Math.PI:0;world.add(pane);}
    for(const xx of [x-w/2-.03,x+w/2+.03])for(let zz=z-d/2+4;zz<=z+d/2-4;zz+=5.7){const pane=new THREE.Mesh(new THREE.PlaneGeometry(2.1,1.25),winMat);pane.position.set(xx,2.7,zz);pane.rotation.y=xx>x?Math.PI/2:-Math.PI/2;world.add(pane);}
    const fascia=new THREE.Mesh(new THREE.BoxGeometry(w+.4,.25,.34),trimMat);fascia.position.set(x,h-.25,z-d/2-.31);world.add(fascia);
    if(doorSide==='south'||doorSide==='north'){const dz=doorSide==='south'?z-d/2-.34:z+d/2+.34,doorX=x+doorOffset;const lintel=new THREE.Mesh(new THREE.BoxGeometry(doorWidth+.5,.22,.42),trimMat);lintel.position.set(doorX,3.05,dz);world.add(lintel);for(const side of [-1,1]){const jamb=new THREE.Mesh(new THREE.BoxGeometry(.22,3,.42),trimMat);jamb.position.set(doorX+side*(doorWidth/2+.12),1.5,dz);world.add(jamb);}}
    const interiorLight=new THREE.PointLight(0xffe4b9,.35,Math.max(w,d)*.85,2);interiorLight.position.set(x,h-.8,z);world.add(interiorLight);
    if(label)addLabel(label,x,h+1.8,z-d/2-.15,.52);
    return {x,z,w,d,h};
  }
  function addBench(x,z,yaw=0){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=yaw;world.add(g);const wood=new THREE.MeshStandardMaterial({color:0x704f32,roughness:1});const metal=new THREE.MeshStandardMaterial({color:0x33383a,roughness:.8});for(const zz of [-.34,.34]){const sl=new THREE.Mesh(new THREE.BoxGeometry(2.5,.16,.4),wood);sl.position.set(0,.75,zz);sl.castShadow=true;g.add(sl);}for(const xx of [-.95,.95]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.13,.72,.72),metal);leg.position.set(xx,.36,0);g.add(leg);}addObstacle(x,z,yaw%Math.PI?1.1:2.7,yaw%Math.PI?2.7:1.1,'bench');}

  // Ground / terrain
  planeRect(0,0,440,360,0x72935d,0);
  // Roads form a readable town grid.
  road(0,0,22,336,'z');road(0,0,416,22,'x');
  road(-116,-58,22,190,'z');road(108,45,22,235,'z');
  road(-55,105,298,18,'x');road(68,-88,150,18,'x');
  road(-77,-120,95,14,'x');

  // V498 perimeter: irregular ridges, forest clusters and rock faces instead of a repeated tree/mountain wall.
  const ridgeNorth=[[-188,.82,1],[-151,1.15,3],[-105,.9,5],[-48,1.28,7],[18,.88,9],[73,1.22,11],[132,.93,13],[187,1.18,15]];
  const ridgeSouth=[[-179,1.1,2],[-121,.78,4],[-66,1.3,6],[-4,.9,8],[55,1.18,10],[117,.82,12],[176,1.28,14]];
  ridgeNorth.forEach(([x,sc,v])=>mountain(x,-177,sc,0,v));ridgeSouth.forEach(([x,sc,v])=>mountain(x,177,sc,Math.PI,v));
  [[-216,-137,.95,3],[-216,-72,1.25,5],[-216,12,.84,8],[-216,81,1.18,10],[-216,145,.95,12]].forEach(([x,z,sc,v])=>mountain(x,z,sc,Math.PI/2,v));
  [[216,-146,1.18,4],[216,-82,.82,6],[216,-10,1.3,9],[216,63,.9,11],[216,139,1.15,15]].forEach(([x,z,sc,v])=>mountain(x,z,sc,-Math.PI/2,v));
  // Forest pockets and boulders make the horizon organic while the hard collision boundary remains MAP_X/MAP_Z.
  const forest=[[-188,-145],[-153,-151],[-96,-148],[74,-149],[151,-143],[188,-112],[-190,108],[-145,147],[-72,151],[44,149],[116,147],[186,118],[-185,22],[188,28]];
  forest.forEach(([x,z],idx)=>{for(let j=0;j<4+(idx%3);j++){const a=(idx*1.7+j*2.19),r=4+j*1.8;tree(x+Math.sin(a)*r,z+Math.cos(a)*r,.72+(j%3)*.12,j%3===0?'pine':j%3===1?'broad':'birch');}if(idx%2===0)rock(x+5,z-3,1.15);});
  // Street greenery is clustered instead of evenly copied around every road.
  [[-58,-30],[-83,-34],[66,32],[88,35],[-31,72],[12,74],[73,-61],[-152,49],[136,54]].forEach(([x,z],i)=>{tree(x,z,.72+(i%3)*.08,i%2?'broad':'birch');bush(x+2.2,z+1.4,.8);bush(x-1.8,z-.8,.62,0x4a7c42);});
  for(let z=-140;z<=140;z+=30){lamp(-15,z);lamp(15,z);}for(let x=-180;x<=180;x+=32){lamp(x,-15);lamp(x,15);}
  crosswalk(0,-58,'x');crosswalk(0,58,'x');crosswalk(-116,0,'z');crosswalk(108,0,'z');
  streetSign('FARM',-102,-112,Math.PI/2);streetSign('BAHNHOF',-111,92,0);streetSign('INDUSTRIE',98,96,0);streetSign('CITY CENTER',20,-6,Math.PI/2);

  // ---------------------------------------------------------------------------
  // FARM HOUSE – real multi-room walkable building.
  // ---------------------------------------------------------------------------
  const HX=-145,HZ=-108,HW=50,HD=42,HH=5.4,WT=.62;
  planeRect(HX,HZ,HW,HD,0x6f6d63,.04);
  // Outer walls with front door and rear service door gaps.
  wallSegment(HX-HW/2,HZ,WT,HD,HH,0xb8b19e);wallSegment(HX+HW/2,HZ,WT,HD,HH,0xb8b19e);
  // south front: door centered around x=-139
  wallSegment(HX-13,HZ-HD/2,24,WT,HH,0xb8b19e);wallSegment(HX+15,HZ-HD/2,18,WT,HH,0xb8b19e);
  // north rear: service opening around x=-155
  wallSegment(HX-6,HZ+HD/2,38,WT,HH,0xb8b19e);wallSegment(HX+22,HZ+HD/2,6,WT,HH,0xb8b19e);
  // Interior longitudinal hall / room dividers with door gaps.
  // divider x=-151 separates grow wing from hall
  wallSegment(-151,HZ-13,WT,16,HH,0xaba38f);wallSegment(-151,HZ+10,WT,20,HH,0xaba38f);
  // divider x=-135 separates processing/vault wing with two door gaps
  wallSegment(-135,HZ-13,WT,15,HH,0xaba38f);wallSegment(-135,HZ+1,WT,6,HH,0xaba38f);wallSegment(-135,HZ+13,WT,10,HH,0xaba38f);
  // horizontal division right wing: vault + office
  wallSegment(-122,HZ+2,25,WT,HH,0xaba38f);
  // roof + eaves
  const roof=new THREE.Mesh(new THREE.BoxGeometry(HW+1,.5,HD+1),new THREE.MeshStandardMaterial({color:0x4a4b45,roughness:1}));roof.position.set(HX,HH+.25,HZ);roof.castShadow=true;roof.receiveShadow=true;world.add(roof);cameraBlockers.push(roof);
  // windows – decorative and still wall-blocked.
  const glassMat=new THREE.MeshStandardMaterial({color:0x9dd4dd,transparent:true,opacity:.45,roughness:.25,metalness:.08});
  for(const z of [HZ-11,HZ+9]){const w=new THREE.Mesh(new THREE.PlaneGeometry(3.2,1.6),glassMat);w.rotation.y=Math.PI/2;w.position.set(HX-HW/2-.015,2.8,z);world.add(w);}
  for(const x of [HX-12,HX+8]){const w=new THREE.Mesh(new THREE.PlaneGeometry(3.2,1.6),glassMat);w.position.set(x,2.8,HZ-HD/2-.02);world.add(w);}
  addLabel('WEED FARM KL · FARM HOUSE',HX,7.4,HZ-HD/2-.25,.72);
  addLabel('GROW ROOM',-160,4.2,HZ+18,.36);addLabel('PROCESSING',-142,4.2,HZ+18,.36);addLabel('VAULT',-122,4.2,HZ+18,.36);
  // Distinct room floors, furniture and functional stations.
  planeRect(-160,HZ-5,17,29,0x3e4a3c,.055);planeRect(-142,HZ-7,13,25,0x565957,.055);planeRect(-122,HZ+10,23,16,0x444b4b,.055);planeRect(-122,HZ-10,23,15,0x665f54,.055);
  // The real Weed Table GLB gets only an invisible collision footprint – no visible hitbox block under it.
  addObstacle(-142,HZ-8,3.7,2.0,'weed-table');
  boxMesh(-122,0,HZ+11,7.5,2.25,3.2,0x3f4746,{roughness:.85,metalness:.12});
  boxMesh(-125,0,HZ-9,6.2,.82,2.8,0x725e45,{roughness:1});
  boxMesh(-128,0,HZ-17,5,.8,2.4,0x6b5743,{roughness:1});
  // Grow shelves / lamps and processing storage.
  for(const zz of [HZ-14,HZ+4]){boxMesh(-168,0,zz,1.1,2.4,6.5,0x404a40,{roughness:1});for(let yy=.7;yy<=2.0;yy+=.65)boxMesh(-167.4,yy,zz,.75,.08,5.8,0x77664d,{obstacle:false,cameraBlock:false,roughness:1});}
  for(const x of [-163,-158]){const light=new THREE.PointLight(0xb8ffd0,.85,8,2);light.position.set(x,4.5,HZ-7);world.add(light);}
  boxMesh(-147,0,HZ+10,2.1,2.3,6.4,0x596257,{roughness:1});
  addLabel('1. PFLANZEN → 2. ERNTEN',-160,3.25,HZ-17,.3);addLabel('3. HIER VERPACKEN',-142,3.25,HZ-17,.3);addLabel('4. V → KUNDEN',-122,3.25,HZ-17,.3);
  // small porch
  planeRect(-139,HZ-HD/2-4,12,7,0x8a8171,.05);addBench(-148,HZ-HD/2-5,0);

  // ---------------------------------------------------------------------------
  // Town buildings, back alleys and destinations.
  // ---------------------------------------------------------------------------
  simpleBuilding({x:-56,z:-58,w:32,d:28,h:8,color:0xa98968,roof:0x4a4037,label:'WEAPON SHOP',doorSide:'south'});
  // Weapon shop has a real interior; it opens only by walking to the counter and pressing E.
  planeRect(-56,-58,29,25,0x514c43,.045);boxMesh(-56,0,-50,12,1.15,2.1,0x4f4034,{roughness:1});
  for(const x of [-66,-62,-50,-46]){boxMesh(x,0,-66,2.8,2.2,.65,0x3e3832,{roughness:1});boxMesh(x,2.05,-66,2.5,.12,.5,0x745d45,{obstacle:false,cameraBlock:false,roughness:1});}
  for(const x of [-66,-61,-51,-46]){const lampShop=new THREE.PointLight(0xffe7bf,.55,10,2);lampShop.position.set(x,5.8,-58);world.add(lampShop);}
  addLabel('E · WAFFEN KAUFEN',-56,2.8,-49,.32);

  // Residential blocks create real alleys instead of empty plane.
  simpleBuilding({x:-62,z:52,w:27,d:25,h:8,color:0xa8a18f,roof:0x5b5b55,label:'APARTMENTS',doorSide:'south',doorOffset:7});
  simpleBuilding({x:-28,z:55,w:24,d:27,h:9,color:0x968b78,roof:0x53504a,label:'BLOCK B',doorSide:'south',doorOffset:-4});
  simpleBuilding({x:44,z:54,w:30,d:28,h:8,color:0xb0997e,roof:0x5a5149,label:'SHOPS',doorSide:'south',doorOffset:5});
  // Back alley: dumpsters, fire escape silhouettes, fences, pallets and a hidden customer spot.
  boxMesh(-46,0,72,3,1.45,1.5,0x35523f,{roughness:1});boxMesh(-38,0,72,3,1.45,1.5,0x35523f,{roughness:1});fence(-50,81,32,.25);addLabel('HINTERHOF',-43,3.2,77,.36);
  for(const z of [63,68])boxMesh(-72,0,z,4.5,.25,1.1,0x725b3e,{roughness:1});boxMesh(-18,0,72,1.2,2.4,1.2,0x777166,{roughness:1});
  for(const yy of [2.3,4.3,6.3]){const balcony=boxMesh(-75,yy,54,.8,.15,6.8,0x404346,{obstacle:false,cameraBlock:false,metalness:.25});balcony.castShadow=true;}

  // Additional city blocks, small businesses and a park make the map dense enough to explore on foot.
  simpleBuilding({x:42,z:-48,w:25,d:24,h:7.4,color:0xb79b79,roof:0x59483e,label:'MINI MARKET',doorSide:'south',doorOffset:-5,accent:0x6d3d32});
  simpleBuilding({x:75,z:-48,w:27,d:24,h:8.2,color:0x9da6a3,roof:0x485052,label:'MOTEL',doorSide:'south',doorOffset:5,accent:0x35616a});
  simpleBuilding({x:54,z:82,w:26,d:20,h:7.2,color:0xb6aa8d,roof:0x5f5748,label:'DINER',doorSide:'south',accent:0x7b3b31});
  simpleBuilding({x:-173,z:-68,w:24,d:20,h:6.5,color:0xa89070,roof:0x52483e,label:'FARM SUPPLY',doorSide:'south',doorOffset:4,accent:0x4c683d});
  simpleBuilding({x:-176,z:-20,w:20,d:18,h:6.3,color:0xb1a794,roof:0x5b554c,label:'HOUSE 01',doorSide:'south',accent:0x555f4c});
  simpleBuilding({x:-148,z:-20,w:20,d:18,h:6.3,color:0xa79c88,roof:0x514d46,label:'HOUSE 02',doorSide:'south',accent:0x5e5542});
  simpleBuilding({x:150,z:58,w:24,d:20,h:7,color:0x9e917f,roof:0x4d4842,label:'AUTO SERVICE',doorSide:'south',doorWidth:5,accent:0x60493b});
  // pocket park / pedestrian square
  planeRect(47,22,48,35,0x7e9f67,.026);for(const [x,z,t] of [[29,15,'birch'],[36,30,'broad'],[58,16,'pine'],[67,31,'broad']])tree(x,z,.8,t);addBench(43,14,Math.PI/2);addBench(55,31,Math.PI/2);for(const [x,z] of [[31,24],[63,23],[48,34]])bush(x,z,.8);addLabel('CITY PARK',48,4.1,22,.4);
  // small bus stop and street furniture
  boxMesh(22,0,-24,5,.18,2.1,0x555d5f,{obstacle:false,cameraBlock:false,roughness:.7});boxMesh(22,0,-25,5,2.4,.15,0x47727b,{obstacle:false,cameraBlock:false,roughness:.4});addBench(22,-23.2,0);addLabel('BUS',22,3,-25,.24);

  // Dealer showroom + landscaped parking lot.
  planeRect(124,-90,72,58,0x696d70,.035);
  simpleBuilding({x:154,z:-107,w:34,d:22,h:8,color:0x90979a,roof:0x3c4347,label:'CAR DEALER',doorSide:'south'});
  planeRect(154,-107,31,19,0x555a5c,.045);boxMesh(154,0,-100,12,1.0,2,0x4e5659,{roughness:.75});addLabel('GARAGE · E',154,2.5,-99,.31);
  for(let x=92;x<=145;x+=13){planeRect(x,-78,.16,18,0xe8e8e1,.04);}for(const x of [91,143]){tree(x,-110,.78,'broad');bush(x+2,-108,.75);}

  // Gas station lot, access markings and roadside landscaping.
  planeRect(126,26,72,58,0x686c6e,.035);addLabel('GAS STATION',126,7.2,1,.62);crosswalk(108,26,'z');
  for(const x of [98,154]){bush(x,3,1.1);bush(x,49,.9);tree(x,55,.72,'birch');}

  // Industrial zone / warehouse with loading bays, containers and yard lights.
  simpleBuilding({x:145,z:112,w:55,d:42,h:10,color:0x777c7c,roof:0x45494a,label:'INDUSTRIAL WAREHOUSE',doorSide:'south',doorWidth:8});
  planeRect(145,86,65,24,0x6a6d6c,.035);
  for(let i=0;i<5;i++){boxMesh(120+i*7,0,92,4.5,2.3,3.2,0x79664a,{roughness:1});}
  for(const [x,z,c] of [[167,89,0x3f5d78],[175,89,0x8b4a36],[169,96,0x556b4a]])boxMesh(x,0,z,7,2.6,2.7,c,{roughness:.8});lamp(112,79);lamp(178,79);

  // Train station in north-west: platform, tracks and terminal.
  simpleBuilding({x:-132,z:112,w:40,d:22,h:7,color:0xb9ad92,roof:0x4e4d47,label:'BAHNHOF',doorSide:'south',doorWidth:5});
  planeRect(-112,132,115,10,0xa5a39a,.05);planeRect(-112,146,115,10,0xa5a39a,.05);
  // rails + sleepers
  for(const zz of [137,141]){planeRect(-112,zz,120,.18,0x4a4b49,.07);}
  for(let xx=-168;xx<=-56;xx+=3){planeRect(xx,139,1.7,6,0x66513b,.055);}
  // parked train with windows, platform canopy and ticket area.
  const train=new THREE.Group();train.position.set(-120,.15,152);world.add(train);
  for(let i=0;i<3;i++){const car=boxMesh(-120+i*17,.15,152,15.5,3.4,3.6,i===0?0x8c2c31:0x315f7d,{obstacle:true,cameraBlock:true,group:world});car.position.y=1.85;for(let w=-5;w<=5;w+=2.5)planeRect(-120+i*17+w,150.14,1.5,.05,0x9bc2cf,2.15);}
  boxMesh(-128,3.6,128,42,.25,4,0x4c5556,{obstacle:false,cameraBlock:false,roughness:.8});for(const x of [-146,-132,-118,-104])cylinder(x,0,128,.08,.1,3.6,0x34393a,8);
  boxMesh(-133,0,116,8,1.05,2.2,0x5b5043,{roughness:1});addLabel('TICKETS',-133,2.3,115,.26);addLabel('GLEIS 1 · VERKAUF',-128,4.4,131,.43);
  addBench(-145,126,0);addBench(-112,126,0);addBench(-83,126,0);

  // Farm lanes / decorative fields.
  planeRect(-164,-47,60,34,0x5f7849,.025);for(let zz=-58;zz<=-37;zz+=5){planeRect(-164,zz,54,1.4,0x4e643c,.03);}
  fence(-194,-47,.25,36);fence(-134,-47,.25,36);

  // Starter workflow board makes the business loop understandable from the first minute.
  const guidePos=new THREE.Vector3(-130,0,HZ-17);addInteraction({position:guidePos,radius:3.3,prompt:()=> '[E] Arbeitsplan ansehen · So funktioniert dein Business',action:showBusinessGuide});

  // Locations for HUD.
  locations.push(
    {name:'FARM HOUSE',p:new THREE.Vector3(HX,0,HZ),radius:44},
    {name:'WEAPON SHOP',p:new THREE.Vector3(-56,0,-58),radius:32},
    {name:'HINTERHOF',p:new THREE.Vector3(-43,0,70),radius:30},
    {name:'CAR DEALER',p:new THREE.Vector3(124,0,-90),radius:45},
    {name:'GAS STATION',p:new THREE.Vector3(126,0,26),radius:40},
    {name:'INDUSTRIAL',p:new THREE.Vector3(145,0,112),radius:48},
    {name:'BAHNHOF',p:new THREE.Vector3(-130,0,128),radius:52}
  );

  function addInteraction(it){interactions.push(it);return it;}
  function interactionPosition(it){const p=typeof it.position==='function'?it.position():it.position;return p||null;}

  // ---------------------------------------------------------------------------
  // Player / first-person camera / input.
  // ---------------------------------------------------------------------------
  const player={position:new THREE.Vector3(-142.5,1.72,-124.5),yaw:0,pitch:0,health:state.health,mode:'foot'};
  const keys={};let pointerLocked=false,started=false,modalOpen=false,phoneOpen=false,paused=false,aiming=false;
  let currentInteraction=null,currentVehicle=null,lastShotAt=0,heldKind='fists',vehicleLookYaw=0,vehicleLookPitch=.36;
  let mobileX=0,mobileY=0,mobileSprint=false,mobileBrake=false;
  let moveTouch=null,lookPointer=null,touchFire=false;
  const raycaster=new THREE.Raycaster();
  const cameraRay=new THREE.Raycaster();

  const viewRoot=new THREE.Group();camera.add(viewRoot);scene.add(camera);
  const handMat=new THREE.MeshStandardMaterial({color:0xd7a47c,roughness:.88});
  function makeFirstPersonHand(side=1){const g=new THREE.Group();const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.052,.22,4,8),handMat);arm.rotation.z=-side*.34;arm.position.set(side*.035,-.045,.06);g.add(arm);const palm=new THREE.Mesh(new THREE.BoxGeometry(.115,.075,.145),handMat);palm.position.set(side*.085,.08,-.03);palm.rotation.y=-side*.12;g.add(palm);for(let i=0;i<4;i++){const finger=new THREE.Mesh(new THREE.CapsuleGeometry(.014,.07,3,6),handMat);finger.rotation.x=Math.PI/2;finger.position.set(side*(.047+i*.022),.105,-.105);g.add(finger);}const thumb=new THREE.Mesh(new THREE.CapsuleGeometry(.016,.06,3,6),handMat);thumb.rotation.z=side*.9;thumb.position.set(side*.135,.075,-.015);g.add(thumb);return g;}
  const rightHand=makeFirstPersonHand(1);rightHand.position.set(.28,-.36,-.58);rightHand.rotation.x=-.06;viewRoot.add(rightHand);
  const leftHand=makeFirstPersonHand(-1);leftHand.position.set(-.28,-.37,-.60);leftHand.rotation.x=-.04;viewRoot.add(leftHand);
  const heldGroup=new THREE.Group();viewRoot.add(heldGroup);const phoneGroup=new THREE.Group();viewRoot.add(phoneGroup);phoneGroup.visible=false;let equipToken=0,phoneModelLoaded=false,phoneTab='home',customerVisual=null;

  function actorPosition(){return currentVehicle?currentVehicle.group.position:player.position;}
  function requestPointer(){if(started&&!modalOpen&&!phoneOpen&&!paused&&document.pointerLockElement!==renderer.domElement)renderer.domElement.requestPointerLock?.();}
  function openModal(html){if(phoneOpen)closePhone(false);modalOpen=true;ui.modalContent.innerHTML=html;ui.modal.hidden=false;if(document.pointerLockElement)document.exitPointerLock();}
  function closeModal(){ui.modal.hidden=true;modalOpen=false;if(started&&!paused&&!phoneOpen)requestPointer();}
  function showBusinessGuide(){openModal(`<small>FARM HOUSE · BUSINESS GUIDE</small><h2>So verdienst du dein erstes Money</h2><div class="wfkl-map-list"><article><b>1 · Grow Room</b><small>Gehe an einen freien Grow Spot und drücke E. Ein Seed kostet $ 100. Die Pflanze wächst automatisch durch vier sichtbare Stufen.</small></article><article><b>2 · Ernten</b><small>Ist die Pflanze groß, zeigt der Spot „ERNTE“. E gibt dir loses Weed ins Inventar.</small></article><article><b>3 · Processing</b><small>Gehe zum echten Weed Table. Mit E verpackst du loses Weed als 1g, 10g, Brick oder Strapped Brick.</small></article><article><b>4 · Smartphone</b><small>Drücke V. Öffne KUNDEN, suche Angebote und bestelle einen Kunden. Während das Handy offen ist, kannst du mit WASD weiterlaufen; die Maus bedient nur das Telefon.</small></article><article><b>5 · Übergabe</b><small>Der aktive Kunde erscheint an seinem Treffpunkt. Gehe hin und drücke E. Passende Ware wird abgezogen und Money in deinen Tresor gelegt.</small></article><article><b>6 · Ausbau</b><small>Mit mehr Money kaufst du Waffen und Fahrzeuge und verbesserst den Tresor bis maximal 1.000.000 $.</small></article></div>`);}
  function tutorialObjective(){const active=state.phone.active;if(active)return `Kunde aktiv: ${active.name} · ${productLabel(active.product,active.qty)} · Treffpunkt ${active.placeName}`;switch(state.tutorialStep){case 0:return 'Grow Room: E an einem Grow Spot · Seed kostet $ 100';case 1:return 'Pflanze wächst: warte bis Stufe 4 und ernte mit E';case 2:return 'Processing Room: verpacke am Weed Table mindestens 1 g';case 3:return 'V öffnen → KUNDEN → Kunden suchen und bestellen';case 4:return 'Gehe zum markierten Kunden und übergib die Ware mit E';default:return 'Business läuft · Kunden, Fahrzeuge, Tresor und größere Pakete ausbauen';}}
  function updateObjective(){if(!ui.objective)return;ui.objective.querySelector('b').textContent=tutorialObjective();ui.objective.querySelector('small').textContent=state.phone.active?'AKTIVER KUNDE':'BUSINESS-ZIEL';}
  const PRODUCT_INFO={bag1:{label:'1g-Baggie',base:400},bag10:{label:'10g-Bag',base:4500},brick:{label:'100g-Brick',base:55000},strapped:{label:'250g-Strapped Brick',base:150000}};
  function productLabel(product,qty=1){const p=PRODUCT_INFO[product];return `${qty}× ${p?.label||product}`;}
  const CUSTOMER_PLACES=[{name:'HINTERHOF',x:-43,z:68,mult:1.05},{name:'BAHNHOF',x:-126,z:126,mult:1.15},{name:'INDUSTRIE',x:126,z:87,mult:1.22},{name:'CITY PARK',x:42,z:23,mult:1.1}];
  const CUSTOMER_NAMES=['Milo','Nico','Ben','Jay','Leon','Sam','Toni','Alex','Chris','Robin','Mika','Max'];
  function makeOffers(){const pool=state.totalHarvested<150?['bag1','bag10']:state.totalHarvested<700?['bag1','bag10','brick']:['bag10','brick','strapped'];state.phone.offers=Array.from({length:3},(_,i)=>{const product=pool[(Math.floor(Math.random()*pool.length)+i)%pool.length],place=CUSTOMER_PLACES[Math.floor(Math.random()*CUSTOMER_PLACES.length)],qty=product==='bag1'?1+Math.floor(Math.random()*5):product==='bag10'?1+Math.floor(Math.random()*3):1;const payout=Math.floor(PRODUCT_INFO[product].base*qty*place.mult*(1.05+state.phone.reputation*.01));return {id:`c${Date.now()}_${i}_${Math.random().toString(36).slice(2,6)}`,name:CUSTOMER_NAMES[Math.floor(Math.random()*CUSTOMER_NAMES.length)],product,qty,payout,placeName:place.name,x:place.x,z:place.z};});state.phone.lastRefreshAt=Date.now();saveState();}
  function phoneHomeHtml(){const active=state.phone.active;return `<section class="wfkl-phone-hero"><small>DEIN BUSINESS</small><strong>${fmtMoney(state.money)}</strong><span>Tresor ${fmtMoney(vaultCapacity())}</span></section><div class="wfkl-phone-cards"><article><small>LOSES WEED</small><b>${state.weedLoose} g</b></article><article><small>KUNDEN</small><b>${state.phone.completed}</b></article><article><small>REPUTATION</small><b>${state.phone.reputation}</b></article></div>${active?`<div class="wfkl-phone-active"><small>AKTIVER KUNDE</small><b>${active.name}</b><span>${productLabel(active.product,active.qty)} · ${fmtMoney(active.payout)}</span><span>Treffpunkt: ${active.placeName}</span></div>`:`<div class="wfkl-phone-empty">Kein aktiver Kunde. Öffne KUNDEN und bestelle einen Auftrag.</div>`}`;}
  function phoneClientsHtml(){if(!state.phone.offers.length)makeOffers();return `<div class="wfkl-phone-title"><b>KUNDEN</b><button data-phone-refresh>NEU SUCHEN</button></div>${state.phone.active?`<div class="wfkl-phone-active"><small>AKTIV</small><b>${state.phone.active.name}</b><span>${productLabel(state.phone.active.product,state.phone.active.qty)} · ${fmtMoney(state.phone.active.payout)}</span><span>${state.phone.active.placeName}</span></div>`:''}<div class="wfkl-phone-orders">${state.phone.offers.map(o=>`<article><div><b>${o.name}</b><small>${o.placeName}</small></div><strong>${fmtMoney(o.payout)}</strong><span>${productLabel(o.product,o.qty)}</span><button data-phone-order="${o.id}" ${state.phone.active?'disabled':''}>KUNDE BESTELLEN</button></article>`).join('')}</div>`;}
  function phoneGuideHtml(){return `<div class="wfkl-phone-guide"><b>BUSINESS LOOP</b><ol><li>Grow Spot mit E bepflanzen.</li><li>Stufe 4 ernten.</li><li>Am Weed Table verpacken.</li><li>Hier unter KUNDEN Auftrag bestellen.</li><li>Zum Treffpunkt und E drücken.</li><li>Tresor, Waffen und Autos ausbauen.</li></ol><button data-phone-open-map>KARTE / ORTE</button></div>`;}
  function renderPhone(){if(!ui.phoneContent)return;ui.phoneContent.innerHTML=phoneTab==='clients'?phoneClientsHtml():phoneTab==='guide'?phoneGuideHtml():phoneHomeHtml();qa('[data-wf-phone-tab]').forEach(b=>b.classList.toggle('active',b.dataset.wfPhoneTab===phoneTab));ui.phoneContent.querySelector('[data-phone-refresh]')?.addEventListener('click',()=>{makeOffers();renderPhone();});ui.phoneContent.querySelectorAll('[data-phone-order]').forEach(b=>b.addEventListener('click',()=>acceptCustomer(b.dataset.phoneOrder)));ui.phoneContent.querySelector('[data-phone-open-map]')?.addEventListener('click',()=>{closePhone(false);showMap();});updatePhoneTexture();}
  function acceptCustomer(id){if(state.phone.active)return;const o=state.phone.offers.find(x=>x.id===id);if(!o)return;state.phone.active={...o};state.phone.offers=state.phone.offers.filter(x=>x.id!==id);state.tutorialStep=Math.max(state.tutorialStep,4);saveState();renderCustomer();updateObjective();renderPhone();toast(`${o.name} wartet bei ${o.placeName}.`,'good');}
  function hasCustomerProduct(o){return Number(state.packaged[o.product]||0)>=o.qty;}
  function completeCustomer(){const o=state.phone.active;if(!o)return;if(!hasCustomerProduct(o)){toast(`Du brauchst ${productLabel(o.product,o.qty)}.`,'bad');return;}if(vaultCapacity()-state.money<o.payout){toast('Nicht genug Platz im Tresor. Erst upgraden.','bad');return;}state.packaged[o.product]-=o.qty;addMoney(o.payout,`Kunde ${o.name}`);state.phone.completed++;state.phone.reputation=Math.min(25,state.phone.reputation+1);state.phone.active=null;state.tutorialStep=5;saveState();renderCustomer();updateObjective();toast('Kunde erledigt · Money erhalten.','good');}
  function renderCustomer(){if(customerVisual){world.remove(customerVisual);customerVisual=null;}const o=state.phone.active;if(!o)return;const g=new THREE.Group();g.position.set(o.x,0,o.z);world.add(g);const body=new THREE.Mesh(new THREE.CapsuleGeometry(.34,.9,5,8),new THREE.MeshStandardMaterial({color:0x2e4f68,roughness:.9}));body.position.y=1;body.castShadow=true;g.add(body);const head=new THREE.Mesh(new THREE.SphereGeometry(.25,10,8),new THREE.MeshStandardMaterial({color:0xc59170}));head.position.y=1.95;g.add(head);const tag=makeLabel(`KUNDE · ${o.name}`,{scale:.35,color:'#a8ffbb'});tag.position.set(0,2.75,0);g.add(tag);customerVisual=g;}
  let phoneScreenCanvas=null,phoneScreenTexture=null;
  function updatePhoneTexture(){if(!phoneScreenCanvas)return;const c=phoneScreenCanvas,ctx=c.getContext('2d');ctx.fillStyle='#07130d';ctx.fillRect(0,0,c.width,c.height);const grad=ctx.createLinearGradient(0,0,c.width,c.height);grad.addColorStop(0,'#123b20');grad.addColorStop(1,'#07110b');ctx.fillStyle=grad;ctx.fillRect(18,18,c.width-36,c.height-36);ctx.fillStyle='#8cff9f';ctx.font='bold 46px Arial';ctx.fillText('WEED FARM',42,95);ctx.fillStyle='#ffffff';ctx.font='bold 76px Arial';ctx.fillText('$'+Math.floor(state.money).toLocaleString('de-DE'),42,190);ctx.fillStyle='#a9c9b1';ctx.font='32px Arial';ctx.fillText(state.phone.active?`Kunde: ${state.phone.active.name}`:'Kunden-App bereit',42,260);ctx.fillStyle='#72e68b';ctx.fillRect(42,310,c.width-84,110);ctx.fillStyle='#061009';ctx.font='bold 34px Arial';ctx.fillText('V  BUSINESS PHONE',72,378);phoneScreenTexture.needsUpdate=true;}
  async function loadPhoneModel(){if(phoneModelLoaded)return;phoneModelLoaded=true;try{const o=await cloneModel(ASSET+'smartphone.glb?v=20260818-wf-v498-phone');const backPreview=o.getObjectByName('Phone.004_5');backPreview?.parent?.remove(backPreview);fitObject(o,{targetMax:.78});shadows(o,false,false);o.position.set(.16,-.52,-.82);o.rotation.set(-.18,Math.PI+.05,-.08);phoneScreenCanvas=document.createElement('canvas');phoneScreenCanvas.width=512;phoneScreenCanvas.height=768;phoneScreenTexture=new THREE.CanvasTexture(phoneScreenCanvas);phoneScreenTexture.colorSpace=THREE.SRGBColorSpace;phoneScreenTexture.flipY=false;o.traverse(m=>{if(!m.isMesh)return;const mats=Array.isArray(m.material)?m.material:[m.material];mats.forEach(mat=>{if(mat?.name==='Screen_Color'){mat.map=phoneScreenTexture;mat.emissive=new THREE.Color(0x173322);mat.emissiveMap=phoneScreenTexture;mat.emissiveIntensity=.65;mat.roughness=.18;mat.needsUpdate=true;}});});phoneGroup.add(o);updatePhoneTexture();}catch(e){console.warn('[Weed Farm KL] smartphone',e);}}
  function openPhone(tab='home'){if(currentVehicle){toast('Handy erst nach dem Aussteigen benutzen.','bad');return;}if(modalOpen||paused)return;phoneTab=tab;phoneOpen=true;ui.phone.hidden=false;ui.crosshair.style.opacity='.15';heldGroup.visible=false;phoneGroup.visible=true;rightHand.visible=true;leftHand.visible=true;if(document.pointerLockElement)document.exitPointerLock();loadPhoneModel();renderPhone();document.body.classList.add('wfkl-phone-open');}
  function closePhone(relock=true){if(!phoneOpen)return;phoneOpen=false;ui.phone.hidden=true;ui.crosshair.style.opacity='1';phoneGroup.visible=false;heldGroup.visible=true;document.body.classList.remove('wfkl-phone-open');if(relock&&started&&!paused&&!modalOpen)setTimeout(requestPointer,0);}
  function togglePhone(){phoneOpen?closePhone(true):openPhone('home');}
  qa('[data-wf-phone-tab]').forEach(b=>b.addEventListener('click',()=>{phoneTab=b.dataset.wfPhoneTab||'home';renderPhone();}));q('[data-wf-phone-close]')?.addEventListener('click',()=>closePhone(true));
  function showPause(){if(phoneOpen)closePhone(false);paused=true;openModal(`<small>WEED FARM KL</small><h2>Pause</h2><p>Die Welt ist angehalten.</p><div class="wfkl-stack"><button class="wfkl-button gold" data-wf-resume>WEITER</button><button class="wfkl-button" data-wf-map>ORTE / KARTE</button><button class="wfkl-button secondary" data-wf-help-inner>STEUERUNG</button><button class="wfkl-button danger" data-wf-topgames>TOP GAMES</button></div>`);q('[data-wf-resume]')?.addEventListener('click',()=>{paused=false;closeModal();});q('[data-wf-map]')?.addEventListener('click',showMap);q('[data-wf-help-inner]')?.addEventListener('click',showHelp);q('[data-wf-topgames]')?.addEventListener('click',returnToTopGames);}
  function showHelp(){openModal(`<small>WEED FARM KL · V498</small><h2>Steuerung</h2><div class="wfkl-map-list"><article><b>Zu Fuß</b><small>W vorwärts · S rückwärts · A/D seitwärts · Maus umsehen · Shift sprinten.</small></article><article><b>Interaktion</b><small>E benutzt Pflanzen, den Weed Table, Tresor, Shops, Kunden, Tankstelle und Fahrzeuge.</small></article><article><b>Smartphone</b><small>V öffnet/schließt dein Business Phone. Die Maus wird frei und bedient das Handy; WASD läuft weiter, ohne dass die Kamera sich dreht.</small></article><article><b>Waffenladen</b><small>Kein Hotkey mehr. Gehe wirklich in den Weapon Shop und drücke E am Verkaufstresen.</small></article><article><b>Fahrzeuge</b><small>E einsteigen/aussteigen · Außenkamera · W/S Gas/Rückwärts · A/D lenken · Space bremsen.</small></article><article><b>Items</b><small>1 letzte Waffe · 2 Fäuste · 3 Joint · 4 Weed · Linksklick benutzen/schießen.</small></article></div><p>Die Karte ist begrenzt, aber der Rand besteht jetzt aus variierenden Felsrücken, Waldgruppen und Landschaft statt aus einer gleichförmigen Baumwand.</p>`);}
  function showMap(){openModal(`<small>WEED FARM KL · STADTPLAN</small><h2>Orte</h2><div class="wfkl-map-list">${locations.map(l=>`<article><b>${l.name}</b><small>${({FARM_HOUSE:'Deine Basis mit Grow Room, Processing und Tresor.',BAHNHOF:'Öffentlicher Verkaufsort mit etwas höherem Erlös.'}[l.name.replace(' ','_')]||'Begehbarer Bereich der Map.')}</small></article>`).join('')}</div>`);}

  q('[data-wf-modal-close]')?.addEventListener('click',()=>{if(paused)paused=false;closeModal();});
  q('[data-wf-help]')?.addEventListener('click',showHelp);q('[data-wf-pause]')?.addEventListener('click',showPause);q('[data-wf-exit]')?.addEventListener('click',returnToTopGames);
  q('[data-wf-start]')?.addEventListener('click',()=>{started=true;ui.startWrap.hidden=true;ui.hud.hidden=false;resize();requestPointer();updateObjective();renderCustomer();toast('Start: Grow Room → ernten → Weed Table → V für Kunden.','good');});

  function resize(){const r=overlay.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/Math.max(1,r.height);camera.updateProjectionMatrix();}
  window.addEventListener('resize',resize,{passive:true});
  document.addEventListener('pointerlockchange',()=>{pointerLocked=document.pointerLockElement===renderer.domElement;});
  document.addEventListener('mousemove',e=>{if(!pointerLocked||modalOpen||paused)return;if(currentVehicle){vehicleLookYaw=clamp(vehicleLookYaw-e.movementX*.0022,-1.45,1.45);vehicleLookPitch=clamp(vehicleLookPitch-e.movementY*.0015,.08,.78);}else{player.yaw-=e.movementX*.00215;player.pitch=clamp(player.pitch-e.movementY*.0019,-1.45,1.45);}});
  renderer.domElement.addEventListener('mousedown',e=>{if(!started||phoneOpen)return;if(!pointerLocked){requestPointer();return;}if(e.button===0&&!currentVehicle)usePrimary();if(e.button===2&&!currentVehicle)aiming=true;});
  renderer.domElement.addEventListener('mouseup',e=>{if(e.button===2)aiming=false;});renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());

  function keyDown(e){keys[e.code]=true;if(!started||e.repeat)return;if(e.code==='KeyV'){togglePhone();return;}if(e.code==='Escape'){if(phoneOpen){closePhone(true);return;}if(modalOpen){paused=false;closeModal();}else showPause();return;}if(phoneOpen)return;if(e.code==='KeyE'){if(currentVehicle)exitVehicle();else currentInteraction?.action?.();}if(e.code==='Digit1'&&state.equippedWeapon)equipWeapon(state.equippedWeapon);if(e.code==='Digit2')equipWeapon(null);if(e.code==='Digit3')equipHeldItem('joint');if(e.code==='Digit4')equipHeldItem('weed');if(e.code==='F8'&&isOwner())addDevMoney();if(e.code==='F7'&&isOwner()){if(confirm('Weed Farm KL Spielstand wirklich zurücksetzen?')){localStorage.removeItem(SAVE_KEY);close();setTimeout(()=>open(sourceDevice),30);}}}
  function keyUp(e){keys[e.code]=false;}
  document.addEventListener('keydown',keyDown);document.addEventListener('keyup',keyUp);

  // Touch movement and camera.
  const stick=q('[data-wf-stick]'),knob=stick?.querySelector('i');
  function updateStick(e){if(!moveTouch)return;const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,max=r.width*.34,len=Math.hypot(dx,dy)||1,k=Math.min(1,max/len);const xx=dx*k,yy=dy*k;mobileX=xx/max;mobileY=yy/max;if(knob)knob.style.transform=`translate(calc(-50% + ${xx}px),calc(-50% + ${yy}px))`;}
  stick?.addEventListener('pointerdown',e=>{moveTouch=e.pointerId;stick.setPointerCapture(e.pointerId);updateStick(e);});stick?.addEventListener('pointermove',e=>{if(e.pointerId===moveTouch)updateStick(e);});const stickOff=e=>{if(e.pointerId!==moveTouch)return;moveTouch=null;mobileX=mobileY=0;if(knob)knob.style.transform='translate(-50%,-50%)';};stick?.addEventListener('pointerup',stickOff);stick?.addEventListener('pointercancel',stickOff);
  const sprintBtn=q('[data-wf-sprint]');const sprintOn=e=>{e.preventDefault();mobileSprint=true;sprintBtn.classList.add('active')},sprintOff=e=>{e.preventDefault();mobileSprint=false;sprintBtn.classList.remove('active')};sprintBtn?.addEventListener('pointerdown',sprintOn);sprintBtn?.addEventListener('pointerup',sprintOff);sprintBtn?.addEventListener('pointercancel',sprintOff);
  q('[data-wf-action]')?.addEventListener('pointerdown',e=>{e.preventDefault();if(currentVehicle)exitVehicle();else currentInteraction?.action?.();});
  q('[data-wf-fire]')?.addEventListener('pointerdown',e=>{e.preventDefault();touchFire=true;if(!currentVehicle)usePrimary();});q('[data-wf-fire]')?.addEventListener('pointerup',()=>touchFire=false);q('[data-wf-fire]')?.addEventListener('pointercancel',()=>touchFire=false);
  q('[data-wf-brake]')?.addEventListener('pointerdown',e=>{e.preventDefault();mobileBrake=true;});q('[data-wf-brake]')?.addEventListener('pointerup',()=>mobileBrake=false);q('[data-wf-brake]')?.addEventListener('pointercancel',()=>mobileBrake=false);
  renderer.domElement.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'||e.clientX<innerWidth*.42||e.target.closest('.wfkl-touch'))return;lookPointer={id:e.pointerId,x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture?.(e.pointerId);});
  renderer.domElement.addEventListener('pointermove',e=>{if(!lookPointer||e.pointerId!==lookPointer.id)return;const dx=e.clientX-lookPointer.x,dy=e.clientY-lookPointer.y;lookPointer.x=e.clientX;lookPointer.y=e.clientY;if(currentVehicle){vehicleLookYaw=clamp(vehicleLookYaw-dx*.005,-1.45,1.45);vehicleLookPitch=clamp(vehicleLookPitch-dy*.003,.08,.78);}else{player.yaw-=dx*.005;player.pitch=clamp(player.pitch-dy*.004,-1.45,1.45);}});renderer.domElement.addEventListener('pointerup',e=>{if(lookPointer?.id===e.pointerId)lookPointer=null;});

  // ---------------------------------------------------------------------------
  // First person held items / weapons.
  // ---------------------------------------------------------------------------
  async function setViewModel(url,size=.6,position=new THREE.Vector3(.35,-.28,-.64),rotation=new THREE.Euler(-.08,Math.PI,.08)){
    const token=++equipToken;heldGroup.clear();if(!url)return;try{const obj=await cloneModel(url);if(token!==equipToken)return;fitObject(obj,{targetMax:size});shadows(obj,false,false);obj.position.copy(position);obj.rotation.copy(rotation);heldGroup.add(obj);}catch(e){console.warn('[Weed Farm KL] Viewmodel load',url,e);}
  }
  async function equipWeapon(id){heldKind='weapon';if(!id){heldKind='fists';state.equippedWeapon=null;setViewModel(null);ui.weapon.textContent='Fäuste';saveState();return;}const w=WEAPONS.find(x=>x.id===id);if(!w||!state.ownedWeapons.includes(id)){toast('Waffe nicht gekauft.','bad');return;}state.equippedWeapon=id;saveState();ui.weapon.textContent=w.name;await setViewModel(w.model,w.size,new THREE.Vector3(.36,-.32,-.66),new THREE.Euler(-.12,Math.PI,.05));}
  async function equipHeldItem(kind){if(kind==='joint'){heldKind='joint';ui.weapon.textContent='Joint';await setViewModel(ASSET+'joint.glb',.34,new THREE.Vector3(.28,-.24,-.48),new THREE.Euler(.1,Math.PI,.2));}else if(kind==='weed'){if(state.weedLoose<=0){toast('Kein loses Weed im Inventar.','bad');return;}heldKind='weed';ui.weapon.textContent='Weed Bag';await setViewModel(ASSET+'weed-10g.glb',.35,new THREE.Vector3(.28,-.25,-.52),new THREE.Euler(0,Math.PI,.05));}}
  function usePrimary(){if(heldKind==='joint'){state.heat=Math.max(0,state.heat-4);saveState();updateHUD();toast('Joint benutzt · Heat sinkt leicht.','good');return;}if(heldKind!=='weapon'||!state.equippedWeapon)return;const w=WEAPONS.find(x=>x.id===state.equippedWeapon);if(!w)return;const now=performance.now();if(now-lastShotAt<w.rate)return;lastShotAt=now;state.heat=clamp(state.heat+2.4*(w.heatMult??1),0,100);saveState();heldGroup.position.z=.045;setTimeout(()=>heldGroup.position.z=0,60);raycaster.setFromCamera(new THREE.Vector2(0,0),camera);raycaster.far=w.category==='Nahkampf'?2.6:140;const hits=raycaster.intersectObjects(enemyHitMeshes,true);if(hits.length){let o=hits[0].object;while(o&&!o.userData.enemyRef)o=o.parent;if(o?.userData.enemyRef)damageEnemy(o.userData.enemyRef,w.damage);}updateHUD();}

  // ---------------------------------------------------------------------------
  // Plants: four real GLB growth stages, each with a physical hitbox.
  // ---------------------------------------------------------------------------
  const plantPositions=[[-163,HZ-11],[-158,HZ-11],[-163,HZ-2],[-158,HZ-2]];
  const plantModels=[ASSET+'plant-small-1.glb',ASSET+'plant-small-2.glb',ASSET+'plant-medium.glb',ASSET+'plant-big.glb'];
  plantPositions.forEach(([x,z],i)=>{const g=new THREE.Group();g.position.set(x,.02,z);world.add(g);plantGroups[i]=g;boxMesh(x,0,z,2.25,.35,2.25,0x594b3a,{roughness:1});addInteraction({position:()=>g.position,radius:2.7,prompt:()=>plantPrompt(i),action:()=>plantAction(i)});});
  function plantPrompt(i){const p=state.plants[i];if(!p.stage)return `[E] Grow Spot ${i+1} · Seed setzen ($ 100)`;if(p.stage>=4)return `[E] Pflanze ${i+1} ernten · ca. 25 g`;const elapsed=Date.now()-p.startedAt,left=Math.max(0,GROW_STEP_MS-(elapsed%GROW_STEP_MS));return `[E] Pflanze ${i+1} · Stufe ${p.stage}/4 · ${Math.ceil(left/1000)}s`;}
  function plantAction(i){const p=state.plants[i];if(!p.stage){if(!spendMoney(100))return;p.stage=1;p.startedAt=Date.now();state.tutorialStep=Math.max(state.tutorialStep,1);saveState();renderPlant(i);updateObjective();toast('Pflanze gesetzt · sie wächst durch 4 Stufen.','good');return;}if(p.stage>=4){state.weedLoose+=25;state.totalHarvested+=25;p.stage=0;p.startedAt=0;state.tutorialStep=Math.max(state.tutorialStep,2);saveState();renderPlant(i);updateHUD();updateObjective();toast('+25 g geerntet · jetzt zum Weed Table.','good');return;}toast(`Pflanze wächst noch · Stufe ${p.stage}/4`);}
  async function renderPlant(i){const g=plantGroups[i];if(!g)return;const token=String(Date.now())+Math.random();g.userData.token=token;g.clear();const p=state.plants[i];if(!p.stage){const soil=new THREE.Mesh(new THREE.CylinderGeometry(.78,.9,.32,12),new THREE.MeshStandardMaterial({color:0x4d3829,roughness:1}));soil.position.y=.16;g.add(soil);return;}try{const o=await cloneModel(plantModels[p.stage-1]);if(g.userData.token!==token)return;fitObject(o,{targetHeight:p.stage===4?2.65:1.15+p.stage*.38});shadows(o,true,true);g.add(o);}catch(e){console.warn('[Weed Farm KL] plant',e);}}
  function updatePlantGrowth(){let changed=false;state.plants.forEach((p,i)=>{if(p.stage>0&&p.stage<4){const newStage=clamp(1+Math.floor((Date.now()-p.startedAt)/GROW_STEP_MS),1,4);if(newStage!==p.stage){p.stage=newStage;renderPlant(i);changed=true;if(newStage===4)toast(`Pflanze ${i+1} ist erntereif.`,'good');}}});if(changed)saveState();}

  // ---------------------------------------------------------------------------
  // Processing table and vault / physical cash.
  // ---------------------------------------------------------------------------
  processGroup.position.set(-142,.02,HZ-8);addLabel('WEED TABLE',-142,3.1,HZ-8,.3);addInteraction({position:()=>processGroup.position,radius:3,prompt:()=> '[E] Weed Table · verpacken',action:showProcessing});
  async function loadProcessTable(){try{const o=await cloneModel(ASSET+'weed-table.glb');fitObject(o,{targetMax:3.0});shadows(o,true,true);processGroup.add(o);}catch(e){console.warn('[Weed Farm KL] table',e);}}
  function showProcessing(){const p=state.packaged;openModal(`<small>FARM HOUSE · PROCESSING</small><h2>Weed Table</h2><div class="wfkl-two"><div><div class="wfkl-big">${state.weedLoose.toLocaleString('de-DE')} g</div><p>1g-Baggies: ${p.bag1}<br>10g-Bags: ${p.bag10}<br>100g-Bricks: ${p.brick}<br>250g-Strapped: ${p.strapped}</p></div><div class="wfkl-stack"><button class="wfkl-button" data-pack="bag1">1 g → 1g BAG</button><button class="wfkl-button" data-pack="bag10">10 g → 10g BAG</button><button class="wfkl-button" data-pack="brick">100 g → BRICK</button><button class="wfkl-button gold" data-pack="strapped">250 g → STRAPPED BRICK</button></div></div>`);ui.modalContent.querySelectorAll('[data-pack]').forEach(b=>b.onclick=()=>packWeed(b.dataset.pack));}
  function packWeed(kind){const req={bag1:1,bag10:10,brick:100,strapped:250}[kind];if(state.weedLoose<req){toast(`Du brauchst ${req} g loses Weed.`,'bad');return;}state.weedLoose-=req;state.packaged[kind]++;state.tutorialStep=Math.max(state.tutorialStep,3);saveState();updateHUD();updateObjective();toast(`${req} g verpackt · V öffnet jetzt deine Kunden-App.`, 'good');showProcessing();}
  addInteraction({position:new THREE.Vector3(-122,0,HZ+11),radius:4,prompt:()=>`[E] Tresor · ${fmtMoney(state.money)} / ${fmtMoney(vaultCapacity())}`,action:showVault});
  function showVault(){const lvl=state.vaultLevel,next=VAULT_LEVELS[lvl];openModal(`<small>FARM HOUSE · VAULT</small><h2>Tresor</h2><div class="wfkl-two"><div><div class="wfkl-big">${fmtMoney(state.money)}</div><p>Stufe ${lvl}/10 · Kapazität ${fmtMoney(vaultCapacity())}. Das sichtbare 3D-Geld im Raum wird aus deinem Kontostand erzeugt.</p></div><div>${next?`<span class="wfkl-pill">NÄCHSTES LIMIT ${fmtMoney(next.capacity)}</span><p>Upgrade kostet ${fmtMoney(next.price)}</p><button class="wfkl-button gold" data-vault-up>UPGRADEN</button>`:'<span class="wfkl-pill">MAXIMUM 1.000.000 $</span><p>Endgame-Tresor erreicht.</p>'}</div></div>`);q('[data-vault-up]')?.addEventListener('click',upgradeVault);}
  function upgradeVault(){const next=VAULT_LEVELS[state.vaultLevel];if(!next)return;if(!spendMoney(next.price))return;state.vaultLevel++;saveState();rebuildVaultCash();showVault();toast(`Tresor auf ${fmtMoney(next.capacity)} erweitert.`,'good');}
  async function rebuildVaultCash(){vaultCashGroup.clear();let remaining=Math.floor(state.money),slot=0;const spawnCash=async(url,targetMax)=>{const localSlot=slot++;try{const o=await cloneModel(url);fitObject(o,{targetMax});shadows(o,true,true);const col=localSlot%5,row=Math.floor(localSlot/5);o.position.set(-126+col*1.25,.05,HZ+9+row*1.2);o.rotation.y=(localSlot%3)*.25;vaultCashGroup.add(o);}catch{}};while(remaining>=100000&&slot<10){remaining-=100000;spawnCash(ASSET+'money-100k-bag.glb',1.05);}while(remaining>=5000&&slot<24){remaining-=5000;spawnCash(ASSET+'money-5k-stack.glb',.7);}while(remaining>=1000&&slot<28){remaining-=1000;spawnCash(ASSET+'money-1k-stack.glb',.58);}}

  // ---------------------------------------------------------------------------
  // Buyers at alley, station and industrial zone.
  // ---------------------------------------------------------------------------
  function inventoryValue(mult=1){return Math.floor((state.weedLoose*350+state.packaged.bag1*400+state.packaged.bag10*4500+state.packaged.brick*55000+state.packaged.strapped*150000)*mult);}
  function showBuyer(name,mult=1){const value=inventoryValue(mult);openModal(`<small>WEED FARM KL · BUYER</small><h2>${name}</h2><p>Dieser Ort zahlt ${Math.round(mult*100)} % des Basiswertes.</p><div class="wfkl-two"><div><div class="wfkl-big">${fmtMoney(value)}</div><p>Lose: ${state.weedLoose} g<br>1g: ${state.packaged.bag1}<br>10g: ${state.packaged.bag10}<br>Brick: ${state.packaged.brick}<br>Strapped: ${state.packaged.strapped}</p></div><div><button class="wfkl-button gold" data-sell-all ${value<=0?'disabled':''}>WARE VERKAUFEN</button><p>Verkäufe passen nur bis zum aktuellen Tresorlimit.</p></div></div>`);q('[data-sell-all]')?.addEventListener('click',()=>sellInventory(name,mult));}
  function sellInventory(name,mult){let room=vaultCapacity()-state.money;if(room<=0){toast('Tresor voll. Erst upgraden.','bad');return;}const base={strapped:150000,brick:55000,bag10:4500,bag1:400};let earned=0;for(const [k,v] of Object.entries(base)){const val=Math.max(1,Math.floor(v*mult));while(state.packaged[k]>0&&room>=val){state.packaged[k]--;earned+=val;room-=val;}}const gramVal=Math.max(1,Math.floor(350*mult)),grams=Math.min(state.weedLoose,Math.floor(room/gramVal));if(grams){state.weedLoose-=grams;earned+=grams*gramVal;}if(!earned){toast('Kein kompletter Verkauf passt mehr in den Tresor.','bad');return;}state.money+=earned;state.totalEarned+=earned;state.heat=clamp(state.heat+(mult>1?2.5:1),0,100);saveState();rebuildVaultCash();updateHUD();toast(`${name}: +${fmtMoney(earned)}`,'good');showBuyer(name,mult);}
  addInteraction({position:new THREE.Vector3(-43,0,69),radius:4.2,prompt:()=> '[E] Hinterhof-Käufer · verkaufen',action:()=>showBuyer('Hinterhof-Käufer',1.0)});
  addInteraction({position:new THREE.Vector3(-128,0,126),radius:4.2,prompt:()=> '[E] Bahnhof-Käufer · +12 %',action:()=>showBuyer('Bahnhof-Käufer',1.12)});
  addInteraction({position:new THREE.Vector3(119,0,83),radius:4.2,prompt:()=> '[E] Industrie-Abnehmer · +20 %',action:()=>showBuyer('Industrie-Abnehmer',1.20)});

  // Active smartphone customer interaction follows the accepted order.
  addInteraction({position:()=>state.phone.active?new THREE.Vector3(state.phone.active.x,0,state.phone.active.z):null,radius:3.1,prompt:()=>state.phone.active?`[E] ${state.phone.active.name} · ${productLabel(state.phone.active.product,state.phone.active.qty)} für ${fmtMoney(state.phone.active.payout)}`:'',action:completeCustomer});

  // ---------------------------------------------------------------------------
  // Weapon shop.
  // ---------------------------------------------------------------------------
  addInteraction({position:new THREE.Vector3(-56,0,-50),radius:2.6,prompt:()=> '[E] Verkaufstresen · Weapon Shop öffnen',action:showWeaponShop});
  function showWeaponShop(){const cards=WEAPONS.map(w=>{const owned=state.ownedWeapons.includes(w.id),eq=state.equippedWeapon===w.id;return `<article class="wfkl-shop-card ${owned?'owned':''}"><h3>${w.name}</h3><p>${w.category} · First-Person-Viewmodel</p><div class="price">${fmtMoney(w.price)}</div><div class="wfkl-meta"><span>Damage</span><b>${w.damage}</b></div><div class="wfkl-meta"><span>Status</span><b>${eq?'AUSGERÜSTET':owned?'GEKAUFT':'SHOP'}</b></div><button data-weapon="${w.id}">${eq?'AUSGERÜSTET':owned?'AUSRÜSTEN':'KAUFEN'}</button></article>`}).join('');openModal(`<small>WEAPON SHOP</small><h2>Waffen</h2><p>Alle gelieferten Waffen sind als kaufbare First-Person-Viewmodels vorbereitet.</p><div class="wfkl-grid">${cards}</div>`);ui.modalContent.querySelectorAll('[data-weapon]').forEach(b=>b.onclick=()=>weaponShopAction(b.dataset.weapon));}
  function weaponShopAction(id){const w=WEAPONS.find(x=>x.id===id);if(!w)return;if(!state.ownedWeapons.includes(id)){if(!spendMoney(w.price))return;state.ownedWeapons.push(id);saveState();toast(`${w.name} gekauft.`,'good');}equipWeapon(id);showWeaponShop();}

  // ---------------------------------------------------------------------------
  // Vehicles / dealer / external chase camera.
  // ---------------------------------------------------------------------------
  function vehicleSpawn(i){const col=i%4,row=Math.floor(i/4);return new THREE.Vector3(94+col*14,.02,-98+row*20);}
  async function createVehicleInstance(config,i){const group=new THREE.Group();group.position.copy(vehicleSpawn(i));group.rotation.y=Math.PI;world.add(group);const ph=new THREE.Mesh(new THREE.BoxGeometry(config.id==='kamaz'?3.2:2,config.id==='kamaz'?2.8:1.2,config.length),new THREE.MeshStandardMaterial({color:0x343b40,wireframe:true}));ph.position.y=config.id==='kamaz'?1.4:.6;group.add(ph);let label=makeLabel(`${config.name} · ${fmtMoney(config.price)}`,{scale:.48});label.position.set(0,config.id==='kamaz'?5.3:3.5,0);group.add(label);const inst={config,group,visual:null,label,speed:0,fuel:state.vehicleFuel[config.id]??config.fuel,occupied:false};vehicleInstances.set(config.id,inst);addInteraction({position:()=>group.position,radius:config.id==='kamaz'?4.7:3.3,prompt:()=>state.ownedVehicles.includes(config.id)?`[E] ${config.name} fahren`:`[E] ${config.name} · ${fmtMoney(config.price)}`,action:()=>state.ownedVehicles.includes(config.id)?enterVehicle(inst):showVehicleDetail(config.id)});try{const o=await cloneModel(config.model);fitObject(o,{targetLength:config.length,modelYaw:config.modelYaw});shadows(o,true,true);group.remove(ph);group.add(o);inst.visual=o;}catch(e){console.warn('[Weed Farm KL] vehicle',config.id,e);}updateVehicleLabel(inst);return inst;}
  function updateVehicleLabel(inst){if(!inst)return;if(inst.label)inst.group.remove(inst.label);const owned=state.ownedVehicles.includes(inst.config.id);inst.label=makeLabel(owned?`${inst.config.name} · OWNED`:`${inst.config.name} · ${fmtMoney(inst.config.price)}`,{scale:.44,color:owned?'#7df293':'#fff'});inst.label.position.set(0,inst.config.id==='kamaz'?5.3:3.5,0);inst.group.add(inst.label);}
  function enterVehicle(inst){if(!state.ownedVehicles.includes(inst.config.id)){showVehicleDetail(inst.config.id);return;}if(phoneOpen)closePhone(false);currentVehicle=inst;inst.occupied=true;player.mode='vehicle';inst.fuel=state.vehicleFuel[inst.config.id]??inst.config.fuel;viewRoot.visible=false;ui.vehicleHud.hidden=false;ui.crosshair.style.opacity='.18';vehicleLookYaw=0;vehicleLookPitch=.36;toast(`${inst.config.name} · Außenperspektive`,'good');requestPointer();}
  function exitVehicle(){const inst=currentVehicle;if(!inst)return;inst.occupied=false;state.vehicleFuel[inst.config.id]=inst.fuel;saveState();const right=new THREE.Vector3(Math.cos(inst.group.rotation.y),0,-Math.sin(inst.group.rotation.y));const p=inst.group.position.clone().addScaledVector(right,inst.config.radius+1.1);if(collidesXZ(p.x,p.z,.43,inst))p.copy(inst.group.position).addScaledVector(right,-inst.config.radius-1.1);player.position.set(p.x,1.72,p.z);player.yaw=inst.group.rotation.y;currentVehicle=null;player.mode='foot';viewRoot.visible=true;ui.vehicleHud.hidden=true;ui.crosshair.style.opacity='1';requestPointer();}
  function showVehicleDetail(id){const v=VEHICLES.find(x=>x.id===id);if(!v)return;const owned=state.ownedVehicles.includes(id);openModal(`<small>CAR DEALER</small><h2>${v.name}</h2><p>${v.desc}</p><div class="wfkl-two"><div><div class="wfkl-big">${fmtMoney(v.price)}</div><p>Top-Speed: ${Math.round(v.top*3.6)} km/h<br>Tank: ${v.fuel} L<br>Verbrauch: ${v.consumption.toFixed(1)} L/100 km</p></div><div><span class="wfkl-pill">${owned?'GEKAUFT':'NICHT GEKAUFT'}</span><p>Nach dem Kauf steht das Auto direkt auf dem Händlerplatz. E = einsteigen, dann Außenkamera.</p>${owned?'':`<button class="wfkl-button gold" data-buy-vehicle="${v.id}">KAUFEN</button>`}</div></div>`);q('[data-buy-vehicle]')?.addEventListener('click',()=>buyVehicle(id));}
  function buyVehicle(id){const v=VEHICLES.find(x=>x.id===id);if(!v||state.ownedVehicles.includes(id))return;if(!spendMoney(v.price))return;state.ownedVehicles.push(id);state.vehicleFuel[id]=v.fuel;saveState();updateVehicleLabel(vehicleInstances.get(id));toast(`${v.name} gekauft.`,'good');showGarage();}
  function showGarage(){const cards=VEHICLES.map(v=>{const owned=state.ownedVehicles.includes(v.id);return `<article class="wfkl-shop-card ${owned?'owned':''}"><h3>${v.name}</h3><p>${v.desc}</p><div class="price">${fmtMoney(v.price)}</div><div class="wfkl-meta"><span>Top Speed</span><b>${Math.round(v.top*3.6)} km/h</b></div><div class="wfkl-meta"><span>Tank</span><b>${v.fuel} L</b></div><button data-veh="${v.id}">${owned?'ANSEHEN':'DETAILS / KAUFEN'}</button></article>`}).join('');openModal(`<small>CAR DEALER · GARAGE</small><h2>Fahrzeuge</h2><p>Die Fahrzeuge sind für die erste Spielversion fahrbar. Größen, Modellrotation und Fahrwerte können wir danach pro Auto exakt feinjustieren.</p><div class="wfkl-grid">${cards}</div>`);ui.modalContent.querySelectorAll('[data-veh]').forEach(b=>b.onclick=()=>showVehicleDetail(b.dataset.veh));}
  addInteraction({position:new THREE.Vector3(146,0,-96),radius:6,prompt:()=> '[E] Car Dealer / Garage',action:showGarage});

  // Gas station supplied GLB. It remains scenery + a robust refuel trigger.
  gasGroup.position.set(126,.02,26);async function loadGasStation(){try{const o=await cloneModel('Tankstelle.glb');fitObject(o,{targetMax:30});shadows(o,true,true);gasGroup.add(o);}catch(e){console.warn('[Weed Farm KL] gas station',e);}}
  addInteraction({position:new THREE.Vector3(126,0,8),radius:7,prompt:()=> '[E] gekauftes Fahrzeug auftanken',action:refuelNearestVehicle});
  function refuelNearestVehicle(){let nearest=null,best=18;for(const inst of vehicleInstances.values()){if(!state.ownedVehicles.includes(inst.config.id))continue;const d=inst.group.position.distanceTo(new THREE.Vector3(126,0,8));if(d<best){best=d;nearest=inst;}}if(!nearest){toast('Stell ein gekauftes Fahrzeug an die Zapfsäule.','bad');return;}const missing=Math.max(0,nearest.config.fuel-nearest.fuel);if(missing<.1){toast('Tank ist bereits voll.');return;}const cost=Math.ceil(missing*3.1);if(!spendMoney(cost))return;nearest.fuel=nearest.config.fuel;state.vehicleFuel[nearest.config.id]=nearest.fuel;saveState();toast(`${nearest.config.name} vollgetankt · ${fmtMoney(cost)}`,'good');}

  // ---------------------------------------------------------------------------
  // Enemies, heat and police car.
  // ---------------------------------------------------------------------------
  function spawnBandit(x,z){const g=new THREE.Group();g.position.set(x,0,z);world.add(g);const body=new THREE.Mesh(new THREE.CapsuleGeometry(.36,1.0,5,8),new THREE.MeshStandardMaterial({color:0x632f2f,roughness:.9}));body.position.y=1.05;body.castShadow=true;g.add(body);const head=new THREE.Mesh(new THREE.SphereGeometry(.27,10,8),new THREE.MeshStandardMaterial({color:0xb87f61}));head.position.y=2.05;head.castShadow=true;g.add(head);const enemy={group:g,health:100,dead:false};body.userData.enemyRef=enemy;head.userData.enemyRef=enemy;enemyHitMeshes.push(body,head);enemies.push(enemy);return enemy;}
  spawnBandit(-42,64);spawnBandit(122,105);spawnBandit(-92,142);spawnBandit(170,-35);
  function damageEnemy(enemy,amount){if(enemy.dead)return;enemy.health-=amount;if(enemy.health<=0)killEnemy(enemy);}
  function killEnemy(enemy){enemy.dead=true;const p=enemy.group.position.clone();world.remove(enemy.group);state.heat=clamp(state.heat+8,0,100);saveState();const corpse=new THREE.Mesh(new THREE.BoxGeometry(.75,.22,1.8),new THREE.MeshStandardMaterial({color:0x552828}));corpse.position.set(p.x,.12,p.z);corpse.rotation.y=Math.random()*Math.PI;corpse.castShadow=true;world.add(corpse);corpses.push(corpse);addInteraction({position:()=>world.children.includes(corpse)?corpse.position:null,radius:2.5,prompt:()=> '[E] Privaten Entsorger rufen · $ 500',action:()=>{if(!world.children.includes(corpse))return;if(spendMoney(500)){world.remove(corpse);toast('Entsorger hat den Ort bereinigt.','good');}}});toast('Angreifer ausgeschaltet · Heat steigt.','bad');}
  const policeAI={group:new THREE.Group(),visual:null,active:false,speed:0};policeAI.group.visible=false;world.add(policeAI.group);async function loadPolice(){try{const o=await cloneModel('police_car_low_poly.glb');fitObject(o,{targetLength:4.8,modelYaw:Math.PI/2});shadows(o,true,true);policeAI.group.add(o);policeAI.visual=o;}catch(e){console.warn('[Weed Farm KL] police',e);}}
  function activatePolice(){if(policeAI.active)return;policeAI.active=true;policeAI.group.visible=true;policeAI.group.position.set(-10,0,145);policeAI.speed=0;toast('POLICE · Fahndung aktiv.','bad');}
  function createDroppedWeed(pos,grams){if(grams<=0)return;const m=new THREE.Mesh(new THREE.BoxGeometry(.65,.35,.5),new THREE.MeshStandardMaterial({color:0x315e33}));m.position.copy(pos);m.position.y=.2;world.add(m);addInteraction({position:()=>world.children.includes(m)?m.position:null,radius:2,prompt:()=>`[E] verlorene Ware aufnehmen · ${grams} g`,action:()=>{if(!world.children.includes(m))return;state.weedLoose+=grams;world.remove(m);saveState();updateHUD();toast(`${grams} g zurückgeholt.`,'good');}});}
  function hurtPlayer(amount){player.health-=amount;if(player.health<=0)playerDeath();}
  function playerDeath(){const p=actorPosition().clone();if(currentVehicle)exitVehicle();const dropped=Math.floor(state.weedLoose*.35);state.weedLoose-=dropped;createDroppedWeed(p,dropped);player.position.set(-142.5,1.72,-124.5);player.yaw=0;player.pitch=0;player.health=100;state.health=100;state.heat=Math.max(0,state.heat-18);saveState();updateHUD();toast(dropped?`K.O. · ${dropped} g am Ort verloren.`:'K.O. · zurück im Farmhaus.','bad');}

  function updateBandits(dt){const target=actorPosition(),risky=state.money>25_000||state.weedLoose>30||inventoryValue()>10_000;if(!risky)return;for(const e of enemies){if(e.dead)continue;const d=e.group.position.distanceTo(target);if(d<31){const dir=target.clone().sub(e.group.position);dir.y=0;if(dir.lengthSq()>.001){dir.normalize();const nx=e.group.position.x+dir.x*2.15*dt,nz=e.group.position.z+dir.z*2.15*dt;if(!collidesXZ(nx,nz,.38))e.group.position.set(nx,0,nz);e.group.rotation.y=Math.atan2(dir.x,dir.z);}if(d<1.55&&!currentVehicle)hurtPlayer(8*dt);}}}
  function updatePolice(dt){if(state.heat>=25)activatePolice();if(!policeAI.active)return;const target=actorPosition(),g=policeAI.group,dir=target.clone().sub(g.position);dir.y=0;const d=dir.length();if(d>.01){const desired=Math.atan2(dir.x,dir.z),diff=Math.atan2(Math.sin(desired-g.rotation.y),Math.cos(desired-g.rotation.y));g.rotation.y+=clamp(diff,-1.35*dt,1.35*dt);policeAI.speed=lerp(policeAI.speed,state.heat>55?18:12.5,1-Math.exp(-2*dt));const f=new THREE.Vector3(Math.sin(g.rotation.y),0,Math.cos(g.rotation.y)),next=g.position.clone().addScaledVector(f,policeAI.speed*dt);if(!collidesXZ(next.x,next.z,1.3))g.position.copy(next);else g.rotation.y+=1.8*dt;}if(d<5.4)hurtPlayer((currentVehicle?4.5:7)*dt);if(state.heat<5&&d>80){policeAI.active=false;g.visible=false;}}
  function updateHeat(dt){if(performance.now()-lastShotAt>7000&&state.heat>0)state.heat=Math.max(0,state.heat-dt*.28);state.health=player.health;}

  // ---------------------------------------------------------------------------
  // Movement and collision. W is now actual camera-forward.
  // ---------------------------------------------------------------------------
  function moveFoot(dt){let forward=(keys.KeyW?1:0)-(keys.KeyS?1:0)-mobileY,strafe=(keys.KeyD?1:0)-(keys.KeyA?1:0)+mobileX;if(Math.abs(forward)<.02&&Math.abs(strafe)<.02)return;const len=Math.hypot(forward,strafe)||1,lim=Math.max(1,len);forward/=lim;strafe/=lim;const speed=(keys.ShiftLeft||keys.ShiftRight||mobileSprint)?8.8:5.65;const sin=Math.sin(player.yaw),cos=Math.cos(player.yaw);const dx=(-sin*forward+cos*strafe)*speed*dt,dz=(-cos*forward-sin*strafe)*speed*dt;if(!collidesXZ(player.position.x+dx,player.position.z,.43))player.position.x+=dx;if(!collidesXZ(player.position.x,player.position.z+dz,.43))player.position.z+=dz;}
  function updateFootCamera(dt){camera.position.copy(player.position);camera.rotation.y=player.yaw;camera.rotation.x=player.pitch;camera.fov=lerp(camera.fov,aiming?53:74,1-Math.exp(-10*dt));camera.updateProjectionMatrix();const moving=keys.KeyW||keys.KeyS||keys.KeyA||keys.KeyD||Math.abs(mobileX)>.1||Math.abs(mobileY)>.1;viewRoot.position.y=moving?Math.sin(performance.now()*.012)*.018:0;}
  function updateVehicle(dt){const v=currentVehicle;if(!v)return;const c=v.config;const throttle=(keys.KeyW?1:0)-(keys.KeyS?1:0)-mobileY,steer=(keys.KeyA?1:0)-(keys.KeyD?1:0)-mobileX;if(v.fuel<=0&&throttle>0)v.speed=Math.max(0,v.speed-5*dt);else{if(throttle>0)v.speed+=c.accel*(keys.ShiftLeft||keys.ShiftRight||mobileSprint?1.18:1)*dt;else if(throttle<0)v.speed-=c.accel*.78*dt;else v.speed*=Math.exp(-1.35*dt);}v.speed=clamp(v.speed,-c.top*.32,c.top);if(keys.Space||mobileBrake)v.speed*=Math.exp(-5*dt);const speedRatio=clamp(Math.abs(v.speed)/8,.18,1);v.group.rotation.y+=steer*c.turn*speedRatio*Math.sign(v.speed||1)*dt;const fwd=new THREE.Vector3(Math.sin(v.group.rotation.y),0,Math.cos(v.group.rotation.y)),next=v.group.position.clone().addScaledVector(fwd,v.speed*dt);if(!collidesXZ(next.x,next.z,c.radius,v))v.group.position.copy(next);else v.speed*=-.16;const meters=Math.abs(v.speed)*dt;v.fuel=Math.max(0,v.fuel-(c.consumption/100000)*meters*8);state.vehicleFuel[c.id]=v.fuel;
    // External chase camera with wall clipping.
    const lookYaw=v.group.rotation.y+vehicleLookYaw,dist=c.id==='kamaz'?12:7.8,height=c.id==='kamaz'?4.3:2.8,target=v.group.position.clone().add(new THREE.Vector3(0,c.id==='kamaz'?2.2:1.2,0)),desired=new THREE.Vector3(target.x-Math.sin(lookYaw)*dist,target.y+height+vehicleLookPitch*2,target.z-Math.cos(lookYaw)*dist);const dir=desired.clone().sub(target),rayDist=dir.length();dir.normalize();cameraRay.set(target,dir);cameraRay.far=rayDist;const hits=cameraRay.intersectObjects(cameraBlockers,false);if(hits.length)desired.copy(target).addScaledVector(dir,Math.max(1.1,hits[0].distance-.35));camera.position.lerp(desired,1-Math.exp(-8*dt));camera.lookAt(target);camera.fov=lerp(camera.fov,76,1-Math.exp(-8*dt));camera.updateProjectionMatrix();}

  function updateInteraction(){if(currentVehicle){currentInteraction=null;ui.prompt.textContent='[E] Fahrzeug verlassen';ui.prompt.classList.add('show');return;}let best=null,bestD=Infinity;for(const it of interactions){const pos=interactionPosition(it);if(!pos)continue;const d=player.position.distanceTo(pos),radius=typeof it.radius==='function'?it.radius():it.radius;if(d<=radius&&d<bestD){best=it;bestD=d;}}currentInteraction=best;if(best){ui.prompt.textContent=typeof best.prompt==='function'?best.prompt():best.prompt;ui.prompt.classList.add('show');}else ui.prompt.classList.remove('show');}
  function updateLocation(){const p=actorPosition();let best='OPEN WORLD',bestD=Infinity;for(const l of locations){const d=p.distanceTo(l.p);if(d<bestD){bestD=d;best=l.name;}}ui.location.textContent=bestD<(locations.find(l=>l.name===best)?.radius||35)?best:'OPEN WORLD';}
  function updateHUD(){ui.money.textContent=fmtMoney(state.money);ui.vault.textContent=`${fmtMoney(state.money)} / ${fmtMoney(vaultCapacity())}`;ui.weed.textContent=`${state.weedLoose.toLocaleString('de-DE')} g`;ui.health.textContent=Math.max(0,Math.round(player.health));ui.heat.textContent=Math.round(state.heat);updateObjective();if(phoneOpen)updatePhoneTexture();if(currentVehicle){ui.vehicleName.textContent=currentVehicle.config.name;ui.speed.textContent=`${Math.round(Math.abs(currentVehicle.speed)*3.6)} km/h`;ui.fuel.textContent=`${currentVehicle.fuel.toFixed(1)} / ${currentVehicle.config.fuel} L`;}}
  function addDevMoney(){const target=Math.min(MONEY_MAX,state.money+100_000);while(state.vaultLevel<VAULT_LEVELS.length&&vaultCapacity()<target)state.vaultLevel++;state.money=target;saveState();updateHUD();rebuildVaultCash();toast('OWNER TEST · +100.000 $','good');}

  // Load all supplied core models. Failures leave procedural placeholders instead of breaking the game.
  const bootTasks=[];const boot=p=>bootTasks.push(Promise.resolve(p).catch(e=>console.warn('[Weed Farm KL] asset task',e)));
  VEHICLES.forEach((v,i)=>boot(createVehicleInstance(v,i)));boot(loadGasStation());boot(loadProcessTable());boot(loadPolice());plantGroups.forEach((_,i)=>boot(renderPlant(i)));boot(rebuildVaultCash());

  // decorative real assets in the farm house
  (async()=>{try{const bong=await cloneModel(ASSET+'bong.glb');fitObject(bong,{targetMax:.65});bong.position.set(-128,1.0,HZ-17);world.add(bong);}catch{}try{const joint=await cloneModel(ASSET+'joint.glb');fitObject(joint,{targetMax:.35});joint.position.set(-126.5,.85,HZ-17);world.add(joint);}catch{}})();

  let raf=0,lastAt=performance.now(),plantClock=0,saveClock=0;
  function loop(now){if(!overlay.isConnected)return;const dt=Math.min(.045,Math.max(.001,(now-lastAt)/1000));lastAt=now;if(started&&!modalOpen&&!paused){if(currentVehicle)updateVehicle(dt);else{moveFoot(dt);updateFootCamera(dt);}if(phoneOpen){phoneGroup.rotation.z=Math.sin(now*.0024)*.015;}updateBandits(dt);updatePolice(dt);updateHeat(dt);updateInteraction();updateLocation();updateHUD();plantClock+=dt;saveClock+=dt;if(plantClock>1){plantClock=0;updatePlantGrowth();}if(saveClock>5){saveClock=0;saveState();}}renderer.render(scene,camera);raf=requestAnimationFrame(loop);}

  function destroy(){cancelAnimationFrame(raf);saveState();document.removeEventListener('keydown',keyDown);document.removeEventListener('keyup',keyUp);window.removeEventListener('resize',resize);try{if(document.pointerLockElement===renderer.domElement)document.exitPointerLock();}catch{}try{renderer.dispose();}catch{}overlay.remove();document.body.classList.remove('weed-farm-kl-open');}
  resize();updateHUD();Promise.allSettled(bootTasks).then(()=>{updateHUD();});raf=requestAnimationFrame(loop);
  return {overlay,destroy,state,sourceDevice,showGarage,showWeaponShop,togglePhone};
}

function open(sourceDevice=''){
  if(ACTIVE)return;if(sourceDevice)sourceDevice=String(sourceDevice);else sourceDevice=window.JKGamesOwnedPhoneItem?.()||'';ACTIVE=createSession(sourceDevice);
}
function close(){if(!ACTIVE)return;ACTIVE.destroy();ACTIVE=null;}
function returnToTopGames(){const source=ACTIVE?.sourceDevice||'';close();requestAnimationFrame(()=>window.JKGamesOpenTopGames?.(source));}
function getState(){return loadState();}

window.WeedFarmKL={open,close,returnToTopGames,getState,version:VERSION};
