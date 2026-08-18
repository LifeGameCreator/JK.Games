import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/*
  Weed Farm KL – JK.Games Top Game V497
  - Zu Fuß ausschließlich Ego-Perspektive
  - Fahrzeuge mit Außenkamera
  - Eigenständiger localStorage-Spielstand, keine JK/Coin-/Firebase-Kopplung
  - Procedural Map + vom Nutzer gelieferte GLB-Spielassets
*/

const VERSION = '2026-08-18-v497';
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
  {id:'kamaz',name:'Kamaz 5350',model:ASSET+'vehicle-kamaz-5350.glb',price:700_000,top:22,accel:6,turn:.82,fuel:250,consumption:34,length:8,modelYaw:0,radius:2.5,desc:'Endgame-LKW für große Transporte. Langsam, schwer und riesig.'},
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
  plants:Array.from({length:4},()=>({stage:0,startedAt:0})),heat:0,health:100,totalHarvested:0,totalEarned:0
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
      <div class="wfkl-location" data-wf-location>FARM HOUSE</div><div class="wfkl-crosshair" data-wf-crosshair></div>
      <div class="wfkl-prompt" data-wf-prompt></div><div class="wfkl-toast" data-wf-toast></div>
      <div class="wfkl-weapon-hud"><small>HAND</small><b data-wf-weapon>Fäuste</b></div>
      <div class="wfkl-vehicle-hud" hidden data-wf-vehicle-hud><small>FAHRZEUG</small><b data-wf-vehicle-name>–</b><div class="wfkl-vehicle-grid"><span><em>SPEED</em><strong data-wf-speed>0 km/h</strong></span><span><em>TANK</em><strong data-wf-fuel>0 / 0 L</strong></span></div></div>
      <div class="wfkl-touch"><div class="wfkl-look-hint">RECHTS ZIEHEN · KAMERA</div><div class="wfkl-stick" data-wf-stick><i></i></div><div class="wfkl-touch-actions"><button class="sprint" data-wf-sprint>SPRINT</button><button class="action" data-wf-action>AKTION</button><button class="fire" data-wf-fire>BENUTZEN</button><button data-wf-brake>BREMSE</button></div></div>
    </div>
    <div class="wfkl-start" data-wf-start-wrap><div class="wfkl-card"><small>JK.GAMES · TOP GAME · V497</small><h1>WEED FARM KL</h1><p>Offene, begrenzte 3D-Welt mit begehbarem Farmhaus, Grow-Räumen, Tresor, Bahnhof, Hinterhöfen, Shops, Fahrzeugen, Tankstelle, Polizei und Käufern. Zu Fuß spielst du ausschließlich in Ego-Perspektive; im Auto folgt dir die Außenkamera.</p><div class="wfkl-controls"><article><b>W / S</b><span>Vorwärts / rückwärts</span></article><article><b>A / D</b><span>Links / rechts</span></article><article><b>Maus</b><span>Umsehen</span></article><article><b>E</b><span>Interagieren / Auto</span></article><article><b>Shift</b><span>Sprint / stärker Gas</span></article><article><b>Linksklick</b><span>Waffe / Item benutzen</span></article><article><b>1 / 2</b><span>Waffe / Fäuste</span></article><article><b>3 / 4</b><span>Joint / Weed</span></article><article><b>G</b><span>Garage</span></article></div><button class="wfkl-primary" data-wf-start>SPIEL STARTEN</button><p>${isOwner()?'Owner-Test: F8 gibt 100.000 $ Testgeld · F7 setzt den Weed-Farm-Spielstand zurück.':'Spielstand wird ausschließlich lokal für Weed Farm KL gespeichert.'}</p></div></div>
    <div class="wfkl-modal-wrap" data-wf-modal hidden><div class="wfkl-card"><div class="wfkl-modal-head"><div data-wf-modal-content></div><button class="wfkl-close" data-wf-modal-close>×</button></div></div></div>`;
  document.body.append(el);document.body.classList.add('weed-farm-kl-open');return el;
}

function createSession(sourceDevice){
  const overlay=createOverlay();const q=s=>overlay.querySelector(s);const qa=s=>[...overlay.querySelectorAll(s)];
  const ui={canvas:q('canvas'),hud:q('[data-wf-hud]'),money:q('[data-wf-money]'),vault:q('[data-wf-vault]'),weed:q('[data-wf-weed]'),health:q('[data-wf-health]'),heat:q('[data-wf-heat]'),vehicleHud:q('[data-wf-vehicle-hud]'),vehicleName:q('[data-wf-vehicle-name]'),speed:q('[data-wf-speed]'),fuel:q('[data-wf-fuel]'),weapon:q('[data-wf-weapon]'),prompt:q('[data-wf-prompt]'),toast:q('[data-wf-toast]'),location:q('[data-wf-location]'),crosshair:q('[data-wf-crosshair]'),startWrap:q('[data-wf-start-wrap]'),modal:q('[data-wf-modal]'),modalContent:q('[data-wf-modal-content]')};
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
  function tree(x,z,s=1){
    cylinder(x,0,z,.32*s,.42*s,2.8*s,0x67482d,8);
    const crown=new THREE.Mesh(new THREE.DodecahedronGeometry(1.55*s,0),new THREE.MeshStandardMaterial({color:0x346b3b,roughness:1}));crown.position.set(x,3.65*s,z);crown.castShadow=true;world.add(crown);
    addObstacle(x,z,1.2*s,1.2*s,'tree');
  }
  function lamp(x,z){
    cylinder(x,0,z,.07,.10,4.4,0x252b2d,7);
    const bulb=new THREE.Mesh(new THREE.SphereGeometry(.14,8,6),new THREE.MeshStandardMaterial({color:0xffe7ad,emissive:0xffc55c,emissiveIntensity:2.2}));bulb.position.set(x,4.3,z);world.add(bulb);
  }
  function mountain(x,z,s=1,rot=0){
    const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;world.add(g);
    const base=new THREE.Mesh(new THREE.ConeGeometry(11*s,24*s,7),new THREE.MeshStandardMaterial({color:0x60735a,roughness:1}));base.position.y=12*s;base.castShadow=true;base.receiveShadow=true;g.add(base);
    const rock=new THREE.Mesh(new THREE.ConeGeometry(6.5*s,12*s,7),new THREE.MeshStandardMaterial({color:0x8b9387,roughness:1}));rock.position.set(1.5*s,18*s,-1*s);g.add(rock);
  }
  function fence(x,z,w,d=0.22){boxMesh(x,0,z,w,1.25,d,0x504a40,{roughness:1});}
  function wallSegment(x,z,w,d,h=3.2,color=0xb8b2a2){return boxMesh(x,0,z,w,h,d,color,{roughness:.93});}
  function simpleBuilding({x,z,w=20,d=16,h=7,color=0xb7a98f,roof=0x53504a,label='',doorSide='south',doorOffset=0,doorWidth=3.2}){
    planeRect(x,z,w,d,0x79776e,.032);
    const t=.55;
    wallSegment(x-w/2,z,t,d,h,color);wallSegment(x+w/2,z,t,d,h,color);
    if(doorSide==='south'){
      const start=x-w/2, doorX=x+doorOffset;const left=(doorX-doorWidth/2)-start;const right=(start+w)-(doorX+doorWidth/2);
      if(left>0)wallSegment(start+left/2,z-d/2,left,t,h,color);if(right>0)wallSegment(doorX+doorWidth/2+right/2,z-d/2,right,t,h,color);wallSegment(x,z+d/2,w,t,h,color);
    }else if(doorSide==='north'){
      wallSegment(x,z-d/2,w,t,h,color);const start=x-w/2,doorX=x+doorOffset;const left=(doorX-doorWidth/2)-start,right=(start+w)-(doorX+doorWidth/2);if(left>0)wallSegment(start+left/2,z+d/2,left,t,h,color);if(right>0)wallSegment(doorX+doorWidth/2+right/2,z+d/2,right,t,h,color);
    }else{wallSegment(x,z-d/2,w,t,h,color);wallSegment(x,z+d/2,w,t,h,color);}
    const r=new THREE.Mesh(new THREE.BoxGeometry(w+1,.55,d+1),new THREE.MeshStandardMaterial({color:roof,roughness:.95}));r.position.set(x,h+.25,z);r.castShadow=true;r.receiveShadow=true;world.add(r);cameraBlockers.push(r);
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

  // Outer mountains and hard map boundary.
  for(let x=-198;x<=198;x+=24){mountain(x,-174,.9+((x+200)%48)/160);mountain(x,174,.9+((x+220)%60)/180,Math.PI);}
  for(let z=-148;z<=148;z+=24){mountain(-214,z,.85+((z+150)%48)/170,Math.PI/2);mountain(214,z,.85+((z+175)%54)/170,-Math.PI/2);}

  // Green strips / trees / lamps. All trunk positions collide.
  for(let x=-185;x<=185;x+=22){if(Math.abs(x)>18){tree(x,-32,.76);tree(x,32,.72);}}
  for(let z=-145;z<=145;z+=24){if(Math.abs(z)>20){tree(-32,z,.72);tree(32,z,.76);}}
  for(let z=-145;z<=145;z+=28){lamp(-15,z);lamp(15,z);}
  for(let x=-185;x<=185;x+=28){lamp(x,-15);lamp(x,15);}

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
  // furniture and hitboxes
  boxMesh(-142,0,HZ-8,5.3,1.05,2.5,0x65513f,{roughness:1});
  boxMesh(-122,0,HZ+11,7.5,2.25,3.2,0x3f4746,{roughness:.85,metalness:.12});
  boxMesh(-125,0,HZ-9,6.2,.82,2.8,0x725e45,{roughness:1});
  boxMesh(-128,0,HZ-17,5,.8,2.4,0x6b5743,{roughness:1});
  // small porch
  planeRect(-139,HZ-HD/2-4,12,7,0x8a8171,.05);addBench(-148,HZ-HD/2-5,0);

  // ---------------------------------------------------------------------------
  // Town buildings, back alleys and destinations.
  // ---------------------------------------------------------------------------
  simpleBuilding({x:-56,z:-58,w:32,d:28,h:8,color:0xa98968,roof:0x4a4037,label:'WEAPON SHOP',doorSide:'south'});
  // weapon shop counter collision
  boxMesh(-56,0,-50,12,1.15,2.1,0x4f4034,{roughness:1});

  // Residential blocks create real alleys instead of empty plane.
  simpleBuilding({x:-62,z:52,w:27,d:25,h:8,color:0xa8a18f,roof:0x5b5b55,label:'APARTMENTS',doorSide:'south',doorOffset:7});
  simpleBuilding({x:-28,z:55,w:24,d:27,h:9,color:0x968b78,roof:0x53504a,label:'BLOCK B',doorSide:'south',doorOffset:-4});
  simpleBuilding({x:44,z:54,w:30,d:28,h:8,color:0xb0997e,roof:0x5a5149,label:'SHOPS',doorSide:'south',doorOffset:5});
  // Back alley furniture / dumpsters
  boxMesh(-46,0,72,3,1.45,1.5,0x35523f,{roughness:1});boxMesh(-38,0,72,3,1.45,1.5,0x35523f,{roughness:1});fence(-50,81,32,.25);addLabel('HINTERHOF',-43,3.2,77,.36);

  // Dealer showroom + open parking lot.
  planeRect(124,-90,72,58,0x696d70,.035);
  simpleBuilding({x:154,z:-107,w:34,d:22,h:8,color:0x90979a,roof:0x3c4347,label:'CAR DEALER',doorSide:'south'});
  for(let x=92;x<=145;x+=13){planeRect(x,-78,.16,18,0xe8e8e1,.04);}

  // Gas station lot and location.
  planeRect(126,26,72,58,0x686c6e,.035);addLabel('GAS STATION',126,7.2,1,.62);

  // Industrial zone / warehouse.
  simpleBuilding({x:145,z:112,w:55,d:42,h:10,color:0x777c7c,roof:0x45494a,label:'INDUSTRIAL WAREHOUSE',doorSide:'south',doorWidth:8});
  planeRect(145,86,65,24,0x6a6d6c,.035);
  for(let i=0;i<5;i++){boxMesh(120+i*7,0,92,4.5,2.3,3.2,0x79664a,{roughness:1});}

  // Train station in north-west: platform, tracks and terminal.
  simpleBuilding({x:-132,z:112,w:40,d:22,h:7,color:0xb9ad92,roof:0x4e4d47,label:'BAHNHOF',doorSide:'south',doorWidth:5});
  planeRect(-112,132,115,10,0xa5a39a,.05);planeRect(-112,146,115,10,0xa5a39a,.05);
  // rails + sleepers
  for(const zz of [137,141]){planeRect(-112,zz,120,.18,0x4a4b49,.07);}
  for(let xx=-168;xx<=-56;xx+=3){planeRect(xx,139,1.7,6,0x66513b,.055);}
  // simple parked train gives the station visual identity.
  const train=new THREE.Group();train.position.set(-120,.15,152);world.add(train);
  for(let i=0;i<3;i++){const car=boxMesh(-120+i*17,.15,152,15.5,3.4,3.6,i===0?0x8c2c31:0x315f7d,{obstacle:true,cameraBlock:true,group:world});car.position.y=1.85;}
  addLabel('GLEIS 1 · VERKAUF',-128,4.4,131,.43);
  addBench(-145,126,0);addBench(-112,126,0);addBench(-83,126,0);

  // Farm lanes / decorative fields.
  planeRect(-164,-47,60,34,0x5f7849,.025);for(let zz=-58;zz<=-37;zz+=5){planeRect(-164,zz,54,1.4,0x4e643c,.03);}
  fence(-194,-47,.25,36);fence(-134,-47,.25,36);

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
  const keys={};let pointerLocked=false,started=false,modalOpen=false,paused=false,aiming=false;
  let currentInteraction=null,currentVehicle=null,lastShotAt=0,heldKind='fists',vehicleLookYaw=0,vehicleLookPitch=.36;
  let mobileX=0,mobileY=0,mobileSprint=false,mobileBrake=false;
  let moveTouch=null,lookPointer=null,touchFire=false;
  const raycaster=new THREE.Raycaster();
  const cameraRay=new THREE.Raycaster();

  const viewRoot=new THREE.Group();camera.add(viewRoot);scene.add(camera);
  const handMat=new THREE.MeshStandardMaterial({color:0xd7a47c,roughness:.88});
  const rightHand=new THREE.Mesh(new THREE.CapsuleGeometry(.065,.27,4,8),handMat);rightHand.rotation.z=-.5;rightHand.position.set(.33,-.28,-.5);viewRoot.add(rightHand);
  const leftHand=new THREE.Mesh(new THREE.CapsuleGeometry(.065,.25,4,8),handMat);leftHand.rotation.z=.5;leftHand.position.set(-.30,-.29,-.52);viewRoot.add(leftHand);
  const heldGroup=new THREE.Group();viewRoot.add(heldGroup);let equipToken=0;

  function actorPosition(){return currentVehicle?currentVehicle.group.position:player.position;}
  function requestPointer(){if(started&&!modalOpen&&!paused&&document.pointerLockElement!==renderer.domElement)renderer.domElement.requestPointerLock?.();}
  function openModal(html){modalOpen=true;ui.modalContent.innerHTML=html;ui.modal.hidden=false;if(document.pointerLockElement)document.exitPointerLock();}
  function closeModal(){ui.modal.hidden=true;modalOpen=false;if(started&&!paused)requestPointer();}
  function showPause(){paused=true;openModal(`<small>WEED FARM KL</small><h2>Pause</h2><p>Die Welt ist angehalten.</p><div class="wfkl-stack"><button class="wfkl-button gold" data-wf-resume>WEITER</button><button class="wfkl-button" data-wf-map>ORTE / KARTE</button><button class="wfkl-button secondary" data-wf-help-inner>STEUERUNG</button><button class="wfkl-button danger" data-wf-topgames>TOP GAMES</button></div>`);q('[data-wf-resume]')?.addEventListener('click',()=>{paused=false;closeModal();});q('[data-wf-map]')?.addEventListener('click',showMap);q('[data-wf-help-inner]')?.addEventListener('click',showHelp);q('[data-wf-topgames]')?.addEventListener('click',returnToTopGames);}
  function showHelp(){openModal(`<small>WEED FARM KL · V497</small><h2>Steuerung</h2><div class="wfkl-map-list"><article><b>Zu Fuß</b><small>W vorwärts · S rückwärts · A/D seitwärts · Maus umsehen · Shift sprinten.</small></article><article><b>Interaktion</b><small>E benutzt Pflanzen, Shops, Tresor, Käufer, Tankstelle und Fahrzeuge.</small></article><article><b>Fahrzeuge</b><small>E einsteigen/aussteigen · Außenkamera · W/S Gas/Rückwärts · A/D lenken · Space bremsen.</small></article><article><b>Items</b><small>1 letzte Waffe · 2 Fäuste · 3 Joint · 4 Weed · Linksklick benutzen/schießen.</small></article></div><p>Die Karte ist absichtlich begrenzt. Die Bergkette markiert das Ende der spielbaren Welt; die unsichtbare Grenze dahinter kann nicht überschritten werden.</p>`);}
  function showMap(){openModal(`<small>WEED FARM KL · STADTPLAN</small><h2>Orte</h2><div class="wfkl-map-list">${locations.map(l=>`<article><b>${l.name}</b><small>${({FARM_HOUSE:'Deine Basis mit Grow Room, Processing und Tresor.',BAHNHOF:'Öffentlicher Verkaufsort mit etwas höherem Erlös.'}[l.name.replace(' ','_')]||'Begehbarer Bereich der Map.')}</small></article>`).join('')}</div>`);}

  q('[data-wf-modal-close]')?.addEventListener('click',()=>{if(paused)paused=false;closeModal();});
  q('[data-wf-help]')?.addEventListener('click',showHelp);q('[data-wf-pause]')?.addEventListener('click',showPause);q('[data-wf-exit]')?.addEventListener('click',returnToTopGames);
  q('[data-wf-start]')?.addEventListener('click',()=>{started=true;ui.startWrap.hidden=true;ui.hud.hidden=false;resize();requestPointer();toast('Weed Farm KL gestartet. W läuft jetzt vorwärts.','good');});

  function resize(){const r=overlay.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/Math.max(1,r.height);camera.updateProjectionMatrix();}
  window.addEventListener('resize',resize,{passive:true});
  document.addEventListener('pointerlockchange',()=>{pointerLocked=document.pointerLockElement===renderer.domElement;});
  document.addEventListener('mousemove',e=>{if(!pointerLocked||modalOpen||paused)return;if(currentVehicle){vehicleLookYaw=clamp(vehicleLookYaw-e.movementX*.0022,-1.45,1.45);vehicleLookPitch=clamp(vehicleLookPitch-e.movementY*.0015,.08,.78);}else{player.yaw-=e.movementX*.00215;player.pitch=clamp(player.pitch-e.movementY*.0019,-1.45,1.45);}});
  renderer.domElement.addEventListener('mousedown',e=>{if(!started)return;if(!pointerLocked){requestPointer();return;}if(e.button===0&&!currentVehicle)usePrimary();if(e.button===2&&!currentVehicle)aiming=true;});
  renderer.domElement.addEventListener('mouseup',e=>{if(e.button===2)aiming=false;});renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());

  function keyDown(e){keys[e.code]=true;if(!started||e.repeat)return;if(e.code==='Escape'){if(modalOpen){paused=false;closeModal();}else showPause();return;}if(e.code==='KeyE'){if(currentVehicle)exitVehicle();else currentInteraction?.action?.();}if(e.code==='KeyG')showGarage();if(e.code==='KeyV')showWeaponShop();if(e.code==='Digit1'&&state.equippedWeapon)equipWeapon(state.equippedWeapon);if(e.code==='Digit2')equipWeapon(null);if(e.code==='Digit3')equipHeldItem('joint');if(e.code==='Digit4')equipHeldItem('weed');if(e.code==='F8'&&isOwner())addDevMoney();if(e.code==='F7'&&isOwner()){if(confirm('Weed Farm KL Spielstand wirklich zurücksetzen?')){localStorage.removeItem(SAVE_KEY);close();setTimeout(()=>open(sourceDevice),30);}}}
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
  function plantAction(i){const p=state.plants[i];if(!p.stage){if(!spendMoney(100))return;p.stage=1;p.startedAt=Date.now();saveState();renderPlant(i);toast('Pflanze gesetzt.','good');return;}if(p.stage>=4){state.weedLoose+=25;state.totalHarvested+=25;p.stage=0;p.startedAt=0;saveState();renderPlant(i);updateHUD();toast('+25 g geerntet.','good');return;}toast(`Pflanze wächst noch · Stufe ${p.stage}/4`);}
  async function renderPlant(i){const g=plantGroups[i];if(!g)return;const token=String(Date.now())+Math.random();g.userData.token=token;g.clear();const p=state.plants[i];if(!p.stage){const soil=new THREE.Mesh(new THREE.CylinderGeometry(.78,.9,.32,12),new THREE.MeshStandardMaterial({color:0x4d3829,roughness:1}));soil.position.y=.16;g.add(soil);return;}try{const o=await cloneModel(plantModels[p.stage-1]);if(g.userData.token!==token)return;fitObject(o,{targetHeight:p.stage===4?2.65:1.15+p.stage*.38});shadows(o,true,true);g.add(o);}catch(e){console.warn('[Weed Farm KL] plant',e);}}
  function updatePlantGrowth(){let changed=false;state.plants.forEach((p,i)=>{if(p.stage>0&&p.stage<4){const newStage=clamp(1+Math.floor((Date.now()-p.startedAt)/GROW_STEP_MS),1,4);if(newStage!==p.stage){p.stage=newStage;renderPlant(i);changed=true;if(newStage===4)toast(`Pflanze ${i+1} ist erntereif.`,'good');}}});if(changed)saveState();}

  // ---------------------------------------------------------------------------
  // Processing table and vault / physical cash.
  // ---------------------------------------------------------------------------
  processGroup.position.set(-142,.02,HZ-8);addLabel('WEED TABLE',-142,3.1,HZ-8,.3);addInteraction({position:()=>processGroup.position,radius:3,prompt:()=> '[E] Weed Table · verpacken',action:showProcessing});
  async function loadProcessTable(){try{const o=await cloneModel(ASSET+'weed-table.glb');fitObject(o,{targetMax:3.0});shadows(o,true,true);processGroup.add(o);}catch(e){console.warn('[Weed Farm KL] table',e);}}
  function showProcessing(){const p=state.packaged;openModal(`<small>FARM HOUSE · PROCESSING</small><h2>Weed Table</h2><div class="wfkl-two"><div><div class="wfkl-big">${state.weedLoose.toLocaleString('de-DE')} g</div><p>1g-Baggies: ${p.bag1}<br>10g-Bags: ${p.bag10}<br>100g-Bricks: ${p.brick}<br>250g-Strapped: ${p.strapped}</p></div><div class="wfkl-stack"><button class="wfkl-button" data-pack="bag1">1 g → 1g BAG</button><button class="wfkl-button" data-pack="bag10">10 g → 10g BAG</button><button class="wfkl-button" data-pack="brick">100 g → BRICK</button><button class="wfkl-button gold" data-pack="strapped">250 g → STRAPPED BRICK</button></div></div>`);ui.modalContent.querySelectorAll('[data-pack]').forEach(b=>b.onclick=()=>packWeed(b.dataset.pack));}
  function packWeed(kind){const req={bag1:1,bag10:10,brick:100,strapped:250}[kind];if(state.weedLoose<req){toast(`Du brauchst ${req} g loses Weed.`,'bad');return;}state.weedLoose-=req;state.packaged[kind]++;saveState();updateHUD();toast(`${req} g verpackt.`,'good');showProcessing();}
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

  // ---------------------------------------------------------------------------
  // Weapon shop.
  // ---------------------------------------------------------------------------
  addInteraction({position:new THREE.Vector3(-56,0,-44),radius:5,prompt:()=> '[E] Weapon Shop öffnen',action:showWeaponShop});
  function showWeaponShop(){const cards=WEAPONS.map(w=>{const owned=state.ownedWeapons.includes(w.id),eq=state.equippedWeapon===w.id;return `<article class="wfkl-shop-card ${owned?'owned':''}"><h3>${w.name}</h3><p>${w.category} · First-Person-Viewmodel</p><div class="price">${fmtMoney(w.price)}</div><div class="wfkl-meta"><span>Damage</span><b>${w.damage}</b></div><div class="wfkl-meta"><span>Status</span><b>${eq?'AUSGERÜSTET':owned?'GEKAUFT':'SHOP'}</b></div><button data-weapon="${w.id}">${eq?'AUSGERÜSTET':owned?'AUSRÜSTEN':'KAUFEN'}</button></article>`}).join('');openModal(`<small>WEAPON SHOP</small><h2>Waffen</h2><p>Alle gelieferten Waffen sind als kaufbare First-Person-Viewmodels vorbereitet.</p><div class="wfkl-grid">${cards}</div>`);ui.modalContent.querySelectorAll('[data-weapon]').forEach(b=>b.onclick=()=>weaponShopAction(b.dataset.weapon));}
  function weaponShopAction(id){const w=WEAPONS.find(x=>x.id===id);if(!w)return;if(!state.ownedWeapons.includes(id)){if(!spendMoney(w.price))return;state.ownedWeapons.push(id);saveState();toast(`${w.name} gekauft.`,'good');}equipWeapon(id);showWeaponShop();}

  // ---------------------------------------------------------------------------
  // Vehicles / dealer / external chase camera.
  // ---------------------------------------------------------------------------
  function vehicleSpawn(i){const col=i%4,row=Math.floor(i/4);return new THREE.Vector3(94+col*14,.02,-98+row*20);}
  async function createVehicleInstance(config,i){const group=new THREE.Group();group.position.copy(vehicleSpawn(i));group.rotation.y=Math.PI;world.add(group);const ph=new THREE.Mesh(new THREE.BoxGeometry(config.id==='kamaz'?3.2:2,config.id==='kamaz'?2.8:1.2,config.length),new THREE.MeshStandardMaterial({color:0x343b40,wireframe:true}));ph.position.y=config.id==='kamaz'?1.4:.6;group.add(ph);let label=makeLabel(`${config.name} · ${fmtMoney(config.price)}`,{scale:.48});label.position.set(0,config.id==='kamaz'?5.3:3.5,0);group.add(label);const inst={config,group,visual:null,label,speed:0,fuel:state.vehicleFuel[config.id]??config.fuel,occupied:false};vehicleInstances.set(config.id,inst);addInteraction({position:()=>group.position,radius:config.id==='kamaz'?4.7:3.3,prompt:()=>state.ownedVehicles.includes(config.id)?`[E] ${config.name} fahren`:`[E] ${config.name} · ${fmtMoney(config.price)}`,action:()=>state.ownedVehicles.includes(config.id)?enterVehicle(inst):showVehicleDetail(config.id)});try{const o=await cloneModel(config.model);fitObject(o,{targetLength:config.length,modelYaw:config.modelYaw});shadows(o,true,true);group.remove(ph);group.add(o);inst.visual=o;}catch(e){console.warn('[Weed Farm KL] vehicle',config.id,e);}updateVehicleLabel(inst);return inst;}
  function updateVehicleLabel(inst){if(!inst)return;if(inst.label)inst.group.remove(inst.label);const owned=state.ownedVehicles.includes(inst.config.id);inst.label=makeLabel(owned?`${inst.config.name} · OWNED`:`${inst.config.name} · ${fmtMoney(inst.config.price)}`,{scale:.44,color:owned?'#7df293':'#fff'});inst.label.position.set(0,inst.config.id==='kamaz'?5.3:3.5,0);inst.group.add(inst.label);}
  function enterVehicle(inst){if(!state.ownedVehicles.includes(inst.config.id)){showVehicleDetail(inst.config.id);return;}currentVehicle=inst;inst.occupied=true;player.mode='vehicle';inst.fuel=state.vehicleFuel[inst.config.id]??inst.config.fuel;viewRoot.visible=false;ui.vehicleHud.hidden=false;ui.crosshair.style.opacity='.18';vehicleLookYaw=0;vehicleLookPitch=.36;toast(`${inst.config.name} · Außenperspektive`,'good');requestPointer();}
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
  function updateHUD(){ui.money.textContent=fmtMoney(state.money);ui.vault.textContent=`${fmtMoney(state.money)} / ${fmtMoney(vaultCapacity())}`;ui.weed.textContent=`${state.weedLoose.toLocaleString('de-DE')} g`;ui.health.textContent=Math.max(0,Math.round(player.health));ui.heat.textContent=Math.round(state.heat);if(currentVehicle){ui.vehicleName.textContent=currentVehicle.config.name;ui.speed.textContent=`${Math.round(Math.abs(currentVehicle.speed)*3.6)} km/h`;ui.fuel.textContent=`${currentVehicle.fuel.toFixed(1)} / ${currentVehicle.config.fuel} L`;}}
  function addDevMoney(){const target=Math.min(MONEY_MAX,state.money+100_000);while(state.vaultLevel<VAULT_LEVELS.length&&vaultCapacity()<target)state.vaultLevel++;state.money=target;saveState();updateHUD();rebuildVaultCash();toast('OWNER TEST · +100.000 $','good');}

  // Load all supplied core models. Failures leave procedural placeholders instead of breaking the game.
  const bootTasks=[];const boot=p=>bootTasks.push(Promise.resolve(p).catch(e=>console.warn('[Weed Farm KL] asset task',e)));
  VEHICLES.forEach((v,i)=>boot(createVehicleInstance(v,i)));boot(loadGasStation());boot(loadProcessTable());boot(loadPolice());plantGroups.forEach((_,i)=>boot(renderPlant(i)));boot(rebuildVaultCash());

  // decorative real assets in the farm house
  (async()=>{try{const bong=await cloneModel(ASSET+'bong.glb');fitObject(bong,{targetMax:.65});bong.position.set(-128,1.0,HZ-17);world.add(bong);}catch{}try{const joint=await cloneModel(ASSET+'joint.glb');fitObject(joint,{targetMax:.35});joint.position.set(-126.5,.85,HZ-17);world.add(joint);}catch{}})();

  let raf=0,lastAt=performance.now(),plantClock=0,saveClock=0;
  function loop(now){if(!overlay.isConnected)return;const dt=Math.min(.045,Math.max(.001,(now-lastAt)/1000));lastAt=now;if(started&&!modalOpen&&!paused){if(currentVehicle)updateVehicle(dt);else{moveFoot(dt);updateFootCamera(dt);}updateBandits(dt);updatePolice(dt);updateHeat(dt);updateInteraction();updateLocation();updateHUD();plantClock+=dt;saveClock+=dt;if(plantClock>1){plantClock=0;updatePlantGrowth();}if(saveClock>5){saveClock=0;saveState();}}renderer.render(scene,camera);raf=requestAnimationFrame(loop);}

  function destroy(){cancelAnimationFrame(raf);saveState();document.removeEventListener('keydown',keyDown);document.removeEventListener('keyup',keyUp);window.removeEventListener('resize',resize);try{if(document.pointerLockElement===renderer.domElement)document.exitPointerLock();}catch{}try{renderer.dispose();}catch{}overlay.remove();document.body.classList.remove('weed-farm-kl-open');}
  resize();updateHUD();Promise.allSettled(bootTasks).then(()=>{updateHUD();});raf=requestAnimationFrame(loop);
  return {overlay,destroy,state,sourceDevice,showGarage,showWeaponShop};
}

function open(sourceDevice=''){
  if(ACTIVE)return;if(sourceDevice)sourceDevice=String(sourceDevice);else sourceDevice=window.JKGamesOwnedPhoneItem?.()||'';ACTIVE=createSession(sourceDevice);
}
function close(){if(!ACTIVE)return;ACTIVE.destroy();ACTIVE=null;}
function returnToTopGames(){const source=ACTIVE?.sourceDevice||'';close();requestAnimationFrame(()=>window.JKGamesOpenTopGames?.(source));}
function getState(){return loadState();}

window.WeedFarmKL={open,close,returnToTopGames,getState,version:VERSION};
