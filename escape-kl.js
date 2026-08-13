import * as THREE from 'three';
import { ESCAPE_WORLD_DEFS as WORLD_DEFS } from './escape-kl-worlds.js';
import { buildKeyboardLabWorld } from './escape-kl-world-keyboard-lab.js';

/* Escape.kl – JK.Games Top Game V1 · Keyboard Lab Foundation */
const VERSION = '2026-08-13-v1';
const LOCAL_KEY = 'jk-games-escape-kl-v1';
const PLAYER_HALF = 0.82;
const PLAYER_RADIUS = 0.38;
const GRAVITY = 24;
const JUMP_VELOCITY = 8.4;
const MAX_FALL = -24;
const LIMITERS = [0.25,0.5,0.75,1];
const SPEED_UPGRADES = Object.freeze([
  {level:1,name:'Speed-Multiplikator I',cost:2,mult:1.25},
  {level:2,name:'Speed-Multiplikator II',cost:5,mult:1.5},
  {level:3,name:'Speed-Multiplikator III',cost:12,mult:1.8},
  {level:4,name:'Speed-Multiplikator IV',cost:25,mult:2.2},
  {level:5,name:'Speed-Multiplikator V',cost:50,mult:3}
]);
const TRAILS = Object.freeze([
  {id:'none',name:'Kein Trail',cost:0,color:0xffffff},
  {id:'cyan',name:'Cyan Key Trail',cost:3,color:0x58e6ff},
  {id:'violet',name:'Glitch Trail',cost:8,color:0x9c6cff},
  {id:'gold',name:'Golden ESC Trail',cost:15,color:0xffcf55}
]);

const G = {
  overlay:null, scene:null, camera:null, renderer:null, clock:new THREE.Clock(), raf:0,
  sourceDevice:'', state:null, dirty:false, persistTimer:0, lastLocalSave:0,
  player:null, playerRoot:null, trail:null, trailPoints:[],
  platforms:[], interactables:[], decorative:[], portalFx:[],
  world:'hub', stage:0, checkpoint:null, deaths:0, runStartedAt:0, runFinished:false,
  pos:new THREE.Vector3(0,1.08,8), vel:new THREE.Vector3(), grounded:false, support:null,
  keys:new Set(), inputX:0, inputY:0, mobileX:0, mobileY:0, sprint:false,
  yaw:Math.PI, pitch:.32, camDistance:7.2, pointer:null,
  keyDown:null,keyUp:null,resizeHandler:null,pointerMove:null,pointerUp:null,
  lastGroundPos:new THREE.Vector3(), speedDistanceCarry:0, trainingCarry:0,
  prompt:null, activeInteractable:null, toastTimer:0, paused:false, modalOpen:false,
  particleClock:0, movingClock:0, hudClock:0, trailClock:0,
  materials:new Map(), geometries:new Map(), textures:new Map(),
  tmpV:new THREE.Vector3(), tmpV2:new THREE.Vector3()
};

function defaultProgress(){
  return {
    version:1,speed:0,wins:0,rebirths:0,speedUpgrade:0,limiter:1,
    trail:'none',ownedTrails:['none'],worldsUnlocked:['keyboard-lab'],
    worldStars:{},bestTimes:{},completions:{},hiddenKeys:{},totalDistance:0,
    lastPlayedAt:Date.now()
  };
}
function normalizeProgress(raw){
  const d={...defaultProgress(),...(raw&&typeof raw==='object'?raw:{})};
  d.speed=Math.max(0,Number(d.speed)||0);d.wins=Math.max(0,Math.floor(Number(d.wins)||0));d.rebirths=Math.max(0,Math.floor(Number(d.rebirths)||0));d.speedUpgrade=Math.max(0,Math.min(SPEED_UPGRADES.length,Math.floor(Number(d.speedUpgrade)||0)));d.limiter=LIMITERS.includes(Number(d.limiter))?Number(d.limiter):1;d.ownedTrails=Array.isArray(d.ownedTrails)?[...new Set(d.ownedTrails.filter(id=>TRAILS.some(t=>t.id===id)))]:['none'];if(!d.ownedTrails.includes('none'))d.ownedTrails.unshift('none');d.trail=d.ownedTrails.includes(d.trail)?d.trail:'none';d.worldsUnlocked=Array.isArray(d.worldsUnlocked)?[...new Set(d.worldsUnlocked)]:['keyboard-lab'];if(!d.worldsUnlocked.includes('keyboard-lab'))d.worldsUnlocked.unshift('keyboard-lab');d.worldStars=d.worldStars&&typeof d.worldStars==='object'?d.worldStars:{};d.bestTimes=d.bestTimes&&typeof d.bestTimes==='object'?d.bestTimes:{};d.completions=d.completions&&typeof d.completions==='object'?d.completions:{};d.hiddenKeys=d.hiddenKeys&&typeof d.hiddenKeys==='object'?d.hiddenKeys:{};d.totalDistance=Math.max(0,Number(d.totalDistance)||0);return d;
}
function loadProgress(){
  let raw=null;
  try{const root=window.JKGamesGetActiveState?.();if(root?.escapeKL)raw=root.escapeKL}catch{}
  if(!raw)try{raw=JSON.parse(localStorage.getItem(LOCAL_KEY)||'null')}catch{}
  G.state=normalizeProgress(raw);
  syncProgressToMain(false);
}
function syncProgressToMain(persist=true){
  if(!G.state)return;
  G.state.lastPlayedAt=Date.now();
  try{localStorage.setItem(LOCAL_KEY,JSON.stringify(G.state));G.lastLocalSave=Date.now()}catch{}
  try{const root=window.JKGamesGetActiveState?.();if(root){root.escapeKL=JSON.parse(JSON.stringify(G.state));if(persist)window.JKGamesPersistState?.();}}catch{}
  if(persist)G.dirty=false;
}
function queuePersist(delay=1200){
  if(!G.state)return;G.dirty=true;G.state.lastPlayedAt=Date.now();
  // Keep the active main-state mirror current without starting a new Firestore stream.
  try{const root=window.JKGamesGetActiveState?.();if(root)root.escapeKL=JSON.parse(JSON.stringify(G.state))}catch{}
  // Local safety copy while running; this never touches Firebase.
  if(Date.now()-G.lastLocalSave>1800){try{localStorage.setItem(LOCAL_KEY,JSON.stringify(G.state));G.lastLocalSave=Date.now()}catch{}}
  // Critical actions save quickly. Normal movement is cloud-saved at most every 15 s.
  if(delay<=250){clearTimeout(G.persistTimer);G.persistTimer=setTimeout(()=>{G.persistTimer=0;syncProgressToMain(true)},Math.max(80,delay));return}
  if(!G.persistTimer)G.persistTimer=setTimeout(()=>{G.persistTimer=0;syncProgressToMain(true)},15000);
}
function awardMainXp(amount,reason,key){try{return window.JKGamesAwardMainGameXp?.('escape',amount,reason,{eventKey:key,toast:true})||0}catch{return 0}}
function fmt(n){n=Number(n)||0;if(n<1000)return Math.floor(n).toLocaleString('de-DE');if(n<1e6)return `${(n/1e3).toFixed(n<1e4?1:0).replace('.',',')} Tsd`;if(n<1e9)return `${(n/1e6).toFixed(n<1e7?1:0).replace('.',',')} Mio`;return `${(n/1e9).toFixed(1).replace('.',',')} Mrd`;}
function timeText(sec){sec=Math.max(0,Number(sec)||0);const m=Math.floor(sec/60),s=sec-m*60;return `${m}:${s.toFixed(2).padStart(5,'0')}`;}
function gainMultiplier(){const up=SPEED_UPGRADES[Math.max(0,G.state.speedUpgrade)-1]?.mult||1;return up*(1+G.state.rebirths*.5);}
function movementSpeed(){const collected=Math.max(0,G.state.speed);const curve=4.6+Math.log10(1+collected)*2.35;const sprint=G.sprint?1.12:1;return Math.min(19.5,curve)*G.state.limiter*sprint;}

function mat(key,params){if(G.materials.has(key))return G.materials.get(key);const m=new THREE.MeshStandardMaterial(params);G.materials.set(key,m);return m;}
function geo(key,factory){if(G.geometries.has(key))return G.geometries.get(key);const g=factory();G.geometries.set(key,g);return g;}
function canvasTexture(key,text,bg='#182435',fg='#ffffff'){
  if(G.textures.has(key))return G.textures.get(key);const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,256,256);x.strokeStyle='rgba(255,255,255,.18)';x.lineWidth=7;x.strokeRect(9,9,238,238);x.fillStyle=fg;x.font=`900 ${text.length>5?42:text.length>2?58:78}px system-ui`;x.textAlign='center';x.textBaseline='middle';x.fillText(text,128,130);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;G.textures.set(key,t);return t;
}
function disposeAll(){for(const v of G.geometries.values())v.dispose?.();for(const v of G.materials.values())v.dispose?.();for(const v of G.textures.values())v.dispose?.();G.geometries.clear();G.materials.clear();G.textures.clear();}

function addPlatform({x=0,y=0,z=0,w=3,h=.45,d=3,color=0x223a58,label='',checkpoint=0,finish=false,motion=null,blink=false,kind='key',hub=false}){
  const side=mat(`side-${color}`,{color:new THREE.Color(color).multiplyScalar(.62),roughness:.7,metalness:.08});
  let top=mat(`top-${color}`,{color,roughness:.54,metalness:.08});
  if(label){top=new THREE.MeshStandardMaterial({map:canvasTexture(`key-${label}-${color}`,label,`#${new THREE.Color(color).getHexString()}`),roughness:.52,metalness:.05});G.materials.set(`labelmat-${label}-${color}-${G.platforms.length}`,top)}
  const mesh=new THREE.Mesh(geo(`box-${w}-${h}-${d}`,()=>new THREE.BoxGeometry(w,h,d)),[side,side,top,side,side,side]);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;G.scene.add(mesh);
  const p={mesh,w,h,d,base:new THREE.Vector3(x,y,z),motion,blink,active:true,checkpoint,finish,kind,hub,lastPos:new THREE.Vector3(x,y,z),delta:new THREE.Vector3()};G.platforms.push(p);return p;
}
function addSign(text,pos,color=0x58ddff,scale=1){const tex=canvasTexture(`sign-${text}-${color}`,text,'#07101b','#ffffff');const m=new THREE.MeshBasicMaterial({map:tex,transparent:false,toneMapped:false,side:THREE.DoubleSide});G.materials.set(`signmat-${text}-${G.decorative.length}`,m);const plane=new THREE.Mesh(new THREE.PlaneGeometry(3.2*scale,1.25*scale),m);plane.position.copy(pos);plane.rotation.y=Math.PI;G.scene.add(plane);G.decorative.push(plane);return plane;}
function boxDeco(x,y,z,w,h,d,color,emissive=0){const m=mat(`deco-${color}-${emissive}`,{color,emissive,emissiveIntensity:emissive?.35:0,roughness:.65,metalness:.12});const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;G.scene.add(o);G.decorative.push(o);return o;}
function addInteractable(id,label,x,y,z,radius,onUse){const marker={id,label,pos:new THREE.Vector3(x,y,z),radius,onUse};G.interactables.push(marker);return marker;}

function setupScene(){
  const canvas=G.overlay.querySelector('canvas');G.renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});G.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));G.renderer.outputColorSpace=THREE.SRGBColorSpace;G.renderer.toneMapping=THREE.ACESFilmicToneMapping;G.renderer.toneMappingExposure=1.05;G.renderer.shadowMap.enabled=true;G.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  G.scene=new THREE.Scene();G.scene.background=new THREE.Color(0x07111d);G.scene.fog=new THREE.Fog(0x07111d,38,210);G.camera=new THREE.PerspectiveCamera(63,1,.1,360);G.scene.add(new THREE.HemisphereLight(0xbfdcff,0x182010,1.55));const sun=new THREE.DirectionalLight(0xffe1b5,2.1);sun.position.set(-28,46,18);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-70;sun.shadow.camera.right=70;sun.shadow.camera.top=80;sun.shadow.camera.bottom=-80;G.scene.add(sun);
  buildHub();buildKeyboardLabWorld({addPlatform,addSign:(text,pos,color,scale)=>addSign(text,new THREE.Vector3(pos.x,pos.y,pos.z),color,scale),boxDeco,addInteractable,returnHub:()=>setWorld('hub')});createPlayer();resize();setWorld('hub',true);updateHud(true);
}
function clearWorldObjects(){for(const p of G.platforms)G.scene?.remove(p.mesh);for(const d of G.decorative)G.scene?.remove(d);for(const f of G.portalFx)G.scene?.remove(f);G.platforms=[];G.decorative=[];G.portalFx=[];G.interactables=[];}
function buildHub(){
  addPlatform({x:0,y:0,z:0,w:48,h:.5,d:48,color:0x13243b,kind:'hub',hub:true});
  for(let i=-2;i<=2;i++)for(let j=-2;j<=2;j++){if(Math.abs(i)<2&&Math.abs(j)<2)continue;boxDeco(i*12,-.05,j*12,10,.12,10,0x0c1929)}
  // Shop building
  boxDeco(11,2.1,-1,8,4.2,7,0x17324a);boxDeco(11,4.4,-1,8.6,.35,7.6,0x5a4218);boxDeco(11,1.35,2.45,4.2,2.4,.2,0x07101b);addSign('SPEED SHOP',new THREE.Vector3(11,4.15,2.65),0xf6c85b,.95);addInteractable('shop','Shop öffnen',11,1,2.2,4.6,()=>openShop());
  // Training area
  const tr=addPlatform({x:-11,y:.35,z:0,w:7,h:.35,d:12,color:0x1b5c58,label:'TRAIN',kind:'training',hub:true});tr.training=true;boxDeco(-14.3,1.4,0,.25,2.8,12.2,0x3bd8c8,0x115d58);boxDeco(-7.7,1.4,0,.25,2.8,12.2,0x3bd8c8,0x115d58);addSign('SPEED TRAINING',new THREE.Vector3(-11,3.4,6.1),0x62f2e1,.95);
  // Rebirth altar
  addPlatform({x:-10,y:.45,z:-13,w:6,h:.5,d:6,color:0x542c72,label:'REBIRTH',kind:'altar',hub:true});boxDeco(-10,2,-13,1.1,3,1.1,0x8f5cff,0x32195e);addInteractable('rebirth','Rebirth-Altar',-10,1,-13,4,()=>openRebirth());
  // World portal
  boxDeco(0,3,-16,9,.45,.7,0x1a6f84,0x124c63);boxDeco(-4.2,1.5,-16,.55,5.7,.7,0x1a6f84,0x124c63);boxDeco(4.2,1.5,-16,.55,5.7,.7,0x1a6f84,0x124c63);const portal=new THREE.Mesh(new THREE.PlaneGeometry(7.6,5.2),new THREE.MeshBasicMaterial({color:0x4ddffc,transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false}));portal.position.set(0,2.7,-16);portal.rotation.y=Math.PI;G.scene.add(portal);G.portalFx.push(portal);addSign('WORLD 1',new THREE.Vector3(0,5.4,-15.55),0x56ddff,.8);addInteractable('world1','Keyboard Lab betreten',0,1,-14.8,5.8,()=>enterWorld('keyboard-lab'));
  // Future portals visual only
  const futures=[['CANDY KEYS',13,-14,0xde6ba8],['TOXIC',18,-7,0x70db65],['CYBER',18,7,0x6d74ff]];for(const [name,x,z,c] of futures){addPlatform({x,y:.3,z,w:5,h:.35,d:5,color:c,label:'LOCK',kind:'locked',hub:true});addSign(name,new THREE.Vector3(x,2.4,z+2.55),c,.65);}
  // Leaderboard / info boards placeholder
  addSign('ESCAPE.KL',new THREE.Vector3(0,3.7,17),0xffcb5a,1.15);addSign('WASD + SPACE',new THREE.Vector3(0,2.15,17.02),0x6be5ff,.7);
}
function createPlayer(){
  const root=new THREE.Group();const bodyMat=mat('player-body',{color:0x3386b7,roughness:.72});const skin=mat('player-skin',{color:0xd6a77e,roughness:.85});const dark=mat('player-dark',{color:0x162331,roughness:.76});const torso=new THREE.Mesh(new THREE.BoxGeometry(.78,.9,.42),bodyMat);torso.position.y=.9;root.add(torso);const head=new THREE.Mesh(new THREE.BoxGeometry(.58,.58,.58),skin);head.position.y=1.63;root.add(head);for(const s of[-1,1]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.27,.72,.3),dark);leg.position.set(s*.21,.34,0);root.add(leg);const arm=new THREE.Mesh(new THREE.BoxGeometry(.22,.78,.26),bodyMat);arm.position.set(s*.51,.92,0);root.add(arm)}root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});G.scene.add(root);G.playerRoot=root;G.player=root;
  const trailGeo=new THREE.BufferGeometry();trailGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(36*3),3));const trailMat=new THREE.LineBasicMaterial({color:TRAILS.find(t=>t.id===G.state.trail)?.color||0xffffff,transparent:true,opacity:.72});G.materials.set('trail-line',trailMat);G.trail=new THREE.Line(trailGeo,trailMat);G.trail.frustumCulled=false;G.scene.add(G.trail);G.trailPoints=[];
}
function setTrailColor(){const t=TRAILS.find(x=>x.id===G.state.trail)||TRAILS[0];if(G.trail?.material)G.trail.material.color.setHex(t.color);}

function setWorld(id,initial=false){
  G.world=id;G.runFinished=false;G.activeInteractable=null;closeModal();
  if(id==='hub'){
    G.stage=0;G.deaths=0;G.runStartedAt=0;G.checkpoint={x:0,y:1.08,z:8};teleport(0,1.08,8);toast(initial?'Willkommen bei Escape.kl · Laufe zum Portal und starte Keyboard Lab.':'Zurück im Escape.kl Hub.','good',2600);
  }else if(id==='keyboard-lab'){
    G.stage=1;G.deaths=0;G.runStartedAt=performance.now();G.checkpoint={x:0,y:1.5,z:-70};teleport(0,1.5,-70);toast('Keyboard Lab gestartet · Checkpoints speichern deinen Lauf.','good',2500);
  }
  updateHud(true);
}
function enterWorld(id){const w=WORLD_DEFS.find(x=>x.id===id);if(!w)return;if(w.locked&&!G.state.worldsUnlocked.includes(id))return toast(`${w.name} ist für ein späteres Escape.kl-Update vorbereitet.`,'bad',3000);setWorld(id);}
function teleport(x,y,z){G.pos.set(x,y,z);G.vel.set(0,0,0);G.grounded=false;G.support=null;G.lastGroundPos.copy(G.pos);G.trailPoints=[];if(G.playerRoot)G.playerRoot.position.copy(G.pos);}
function respawn(){G.deaths++;const c=G.checkpoint||{x:0,y:1.08,z:8};teleport(c.x,c.y,c.z);toast(`Respawn · Checkpoint ${Math.max(1,G.stage)}`,'bad',1500);}

function updatePlatforms(t){
  for(const p of G.platforms){p.lastPos.copy(p.mesh.position);if(p.motion){const q=Math.sin(t*p.motion.speed+p.motion.phase)*p.motion.amp;p.mesh.position[p.motion.axis]=p.base[p.motion.axis]+q;}if(p.blink){const phase=(t*.55+(Math.abs(p.base.z)%7)*.13)%1;p.active=phase<.72;p.mesh.visible=true;p.mesh.material.forEach?.(m=>{m.transparent=true;m.opacity=p.active?1:.18});}else p.active=true;p.delta.subVectors(p.mesh.position,p.lastPos);}
  for(const fx of G.portalFx){fx.material.opacity=.16+Math.sin(t*2.2)*.07;fx.scale.setScalar(1+Math.sin(t*1.7)*.02)}
}
function platformUnder(x,z,fromBottom,toBottom){let best=null,bestTop=-Infinity;for(const p of G.platforms){if(!p.active)continue;const px=p.mesh.position.x,pz=p.mesh.position.z,top=p.mesh.position.y+p.h/2;if(Math.abs(x-px)>p.w/2-PLAYER_RADIUS*.18||Math.abs(z-pz)>p.d/2-PLAYER_RADIUS*.18)continue;if(fromBottom>=top-.18&&toBottom<=top+.32&&top>bestTop){best=p;bestTop=top}}return best?{p:best,top:bestTop}:null;}
function isOnTraining(){if(G.world!=='hub'||!G.grounded)return false;return !!G.support?.training;}
function processMovement(dt,t){
  if(G.paused||G.modalOpen||G.runFinished)return;
  const ix=Math.max(-1,Math.min(1,(G.keys.has('KeyD')?1:0)-(G.keys.has('KeyA')?1:0)+G.mobileX));const iy=Math.max(-1,Math.min(1,(G.keys.has('KeyW')?1:0)-(G.keys.has('KeyS')?1:0)-G.mobileY));G.sprint=G.keys.has('ShiftLeft')||G.keys.has('ShiftRight');
  const inputLen=Math.hypot(ix,iy);const forward=G.tmpV.set(-Math.sin(G.yaw),0,-Math.cos(G.yaw));const right=G.tmpV2.set(Math.cos(G.yaw),0,-Math.sin(G.yaw));let dx=0,dz=0;if(inputLen>.05){const nx=ix/inputLen,ny=iy/inputLen;dx=(right.x*nx+forward.x*ny);dz=(right.z*nx+forward.z*ny);const sp=movementSpeed();G.pos.x+=dx*sp*dt;G.pos.z+=dz*sp*dt;G.playerRoot.rotation.y=Math.atan2(dx,dz);}
  if(G.grounded&&G.support?.motion){G.pos.add(G.support.delta)}
  const prevBottom=G.pos.y-PLAYER_HALF;G.vel.y=Math.max(-22,G.vel.y-GRAVITY*dt);let nextY=G.pos.y+G.vel.y*dt;const nextBottom=nextY-PLAYER_HALF;let landed=null;if(G.vel.y<=0)landed=platformUnder(G.pos.x,G.pos.z,prevBottom,nextBottom);if(landed){nextY=landed.top+PLAYER_HALF;G.vel.y=0;G.grounded=true;G.support=landed.p;}else{const hold=G.grounded?platformUnder(G.pos.x,G.pos.z,prevBottom,prevBottom-.08):null;if(hold&&Math.abs(prevBottom-hold.top)<.28){nextY=hold.top+PLAYER_HALF;G.vel.y=0;G.grounded=true;G.support=hold.p;}else{G.grounded=false;G.support=null;}}
  G.pos.y=nextY;G.playerRoot.position.copy(G.pos);
  if(G.grounded&&inputLen>.05){const dist=G.lastGroundPos.distanceTo(G.pos);if(dist<3){G.speedDistanceCarry+=dist;G.state.totalDistance+=dist;while(G.speedDistanceCarry>=1){G.speedDistanceCarry-=1;G.state.speed+=gainMultiplier();queuePersist(1800)}}G.lastGroundPos.copy(G.pos);}else if(G.grounded)G.lastGroundPos.copy(G.pos);
  if(isOnTraining()){G.trainingCarry+=dt*5*gainMultiplier();if(G.trainingCarry>=1){const add=Math.floor(G.trainingCarry);G.trainingCarry-=add;G.state.speed+=add;queuePersist(1800)}}
  if(G.pos.y<MAX_FALL)respawn();
  detectCheckpointAndFinish();
}
function jump(){if(G.paused||G.modalOpen||G.runFinished)return;if(G.grounded){G.vel.y=JUMP_VELOCITY;G.grounded=false;G.support=null;}}
function detectCheckpointAndFinish(){
  const p=G.support;if(!p||G.world!=='keyboard-lab')return;
  if(p.checkpoint&&p.checkpoint>G.stage){G.stage=p.checkpoint;G.checkpoint={x:p.mesh.position.x,y:p.mesh.position.y+p.h/2+PLAYER_HALF+.05,z:p.mesh.position.z};toast(`Checkpoint ${G.stage}/10 erreicht`,'good',1200);queuePersist(1500);}
  if(p.finish&&!G.runFinished)finishWorld();
}
function finishWorld(){
  G.runFinished=true;const w=WORLD_DEFS[0];const sec=(performance.now()-G.runStartedAt)/1000;const previous=Number(G.state.bestTimes[w.id]||0);if(!previous||sec<previous)G.state.bestTimes[w.id]=sec;G.state.completions[w.id]=Math.max(0,Number(G.state.completions[w.id]||0))+1;let stars=1;if(sec<=w.time2)stars++;if(G.deaths===0&&sec<=w.time3)stars++;G.state.worldStars[w.id]=Math.max(Number(G.state.worldStars[w.id]||0),stars);const bonus=stars===3?2:stars===2?1:0;const reward=w.rewardWins+bonus;G.state.wins+=reward;queuePersist(100);awardMainXp(8+stars*2,'Escape.kl · Keyboard Lab',`escape-world1-${Date.now()}-${Math.round(sec*100)}`);showComplete(sec,stars,reward,previous);updateHud(true);
}

function updateCamera(dt){if(!G.playerRoot)return;const target=G.tmpV.set(G.pos.x,G.pos.y+1.05,G.pos.z);const horiz=G.camDistance*Math.cos(G.pitch);const desired=G.tmpV2.set(target.x+Math.sin(G.yaw)*horiz,target.y+2.0+Math.sin(G.pitch)*G.camDistance,target.z+Math.cos(G.yaw)*horiz);const k=1-Math.exp(-dt*7);G.camera.position.lerp(desired,k);G.camera.lookAt(target);}
function updateTrail(dt){G.trailClock+=dt;if(G.trailClock<.045||!G.trail)return;G.trailClock=0;if(G.state.trail==='none'){G.trail.visible=false;return}G.trail.visible=true;G.trailPoints.unshift(new THREE.Vector3(G.pos.x,G.pos.y+.35,G.pos.z));if(G.trailPoints.length>36)G.trailPoints.length=36;const a=G.trail.geometry.attributes.position.array;for(let i=0;i<36;i++){const p=G.trailPoints[Math.min(i,G.trailPoints.length-1)]||G.pos;a[i*3]=p.x;a[i*3+1]=p.y;a[i*3+2]=p.z}G.trail.geometry.attributes.position.needsUpdate=true;}
function detectInteraction(){let best=null,dist=Infinity;for(const i of G.interactables){const d=i.pos.distanceTo(G.pos);if(d<=i.radius&&d<dist){best=i;dist=d}}G.activeInteractable=best;const p=G.overlay?.querySelector('[data-ekl-prompt]');if(!p)return;if(best){p.innerHTML=`<kbd>${matchMedia('(pointer:coarse)').matches?'AKTION':'E'}</kbd>${best.label}`;p.classList.add('show')}else if(isOnTraining()){p.textContent=`Training aktiv · +${fmt(5*gainMultiplier())} Speed/s`;p.classList.add('show')}else p.classList.remove('show');}
function interact(){if(G.modalOpen){closeModal();return}if(G.activeInteractable?.onUse)G.activeInteractable.onUse();}
function updateHud(force=false){
  if(!G.overlay||!G.state)return;G.hudClock+=force?999:0;const set=(q,v)=>{const e=G.overlay.querySelector(q);if(e&&e.textContent!==String(v))e.textContent=String(v)};set('[data-ekl-speed]',fmt(G.state.speed));set('[data-ekl-wins]',fmt(G.state.wins));set('[data-ekl-rebirths]',G.state.rebirths);set('[data-ekl-gain]',`×${gainMultiplier().toFixed(2).replace('.',',')}`);set('[data-ekl-world]',G.world==='hub'?'ESCAPE HUB':'KEYBOARD LAB');set('[data-ekl-stage]',G.world==='hub'?'FREIE WELT':`STAGE ${Math.max(1,G.stage)}/10`);const progress=G.overlay.querySelector('[data-ekl-stage-bar]');if(progress)progress.style.width=`${G.world==='hub'?0:Math.min(100,G.stage*10)}%`;G.overlay.querySelectorAll('[data-ekl-limiter]').forEach(b=>b.classList.toggle('active',Number(b.dataset.eklLimiter)===G.state.limiter));}
function toast(message,tone='',ms=1900){const e=G.overlay?.querySelector('[data-ekl-toast]');if(!e)return;clearTimeout(G.toastTimer);e.textContent=message;e.className=`ekl-toast show ${tone}`;G.toastTimer=setTimeout(()=>e.className='ekl-toast',ms);}

function openModal(html){closeModal();G.modalOpen=true;const wrap=document.createElement('div');wrap.className='ekl-modal-wrap';wrap.dataset.eklModal='1';wrap.innerHTML=html;G.overlay.append(wrap);wrap.addEventListener('click',e=>{if(e.target===wrap)closeModal()});wrap.querySelectorAll('[data-ekl-modal-close]').forEach(b=>b.onclick=closeModal);return wrap;}
function closeModal(){G.overlay?.querySelector('[data-ekl-modal]')?.remove();G.modalOpen=false;}
function openShop(tab='speed'){
  const wrap=openModal(`<div class="ekl-modal"><div class="ekl-modal-head"><div><small>ECHTER IN-GAME SHOP · ESCAPE HUB</small><h2>🏪 Speed Shop</h2><p>Du stehst wirklich im Shop-Gebäude. Kaufe Upgrades mit deinen erspielten Wins.</p></div><button data-ekl-modal-close>×</button></div><div class="ekl-big-stat"><div><small>SPEED</small><b>${fmt(G.state.speed)}</b></div><div><small>WINS</small><b>${fmt(G.state.wins)}</b></div><div><small>GAIN</small><b>×${gainMultiplier().toFixed(2)}</b></div><div><small>TRAIL</small><b>${TRAILS.find(t=>t.id===G.state.trail)?.name||'Keiner'}</b></div></div><div class="ekl-tabs"><button data-ekl-shop-tab="speed">Speed</button><button data-ekl-shop-tab="trails">Trails</button><button data-ekl-shop-tab="worlds">Welten</button></div><div data-ekl-shop-body></div></div>`);
  wrap.querySelectorAll('[data-ekl-shop-tab]').forEach(b=>b.onclick=()=>renderShopBody(b.dataset.eklShopTab));renderShopBody(tab);
}
function renderShopBody(tab){const body=G.overlay?.querySelector('[data-ekl-shop-body]');if(!body)return;G.overlay.querySelectorAll('[data-ekl-shop-tab]').forEach(b=>b.classList.toggle('active',b.dataset.eklShopTab===tab));if(tab==='speed'){body.innerHTML=`<div class="ekl-shop-grid">${SPEED_UPGRADES.map(u=>{const owned=G.state.speedUpgrade>=u.level,available=G.state.speedUpgrade===u.level-1;return `<article class="${owned?'owned':''}"><small>STUFE ${u.level}</small><h3>${u.name}</h3><p>Dauerhaft ×${u.mult.toFixed(2).replace('.',',')} Speed-Gewinn durch echte Laufstrecke und Training.</p><button data-ekl-buy-speed="${u.level}" ${owned||!available?'disabled':''}>${owned?'GEKAUFT':available?`${u.cost} Wins`:'Vorherige Stufe'}</button></article>`}).join('')}</div>`;body.querySelectorAll('[data-ekl-buy-speed]').forEach(b=>b.onclick=()=>buySpeedUpgrade(Number(b.dataset.eklBuySpeed)));}
  else if(tab==='trails'){body.innerHTML=`<div class="ekl-shop-grid">${TRAILS.map(t=>{const owned=G.state.ownedTrails.includes(t.id),active=G.state.trail===t.id;return `<article class="${owned?'owned':''}"><small>${active?'AKTIV':'TRAIL'}</small><h3>${t.name}</h3><p>Kosmetische Spur hinter deinem Charakter. Kein Pay-to-Win-Bonus.</p><button data-ekl-trail="${t.id}" class="${t.id==='gold'?'gold':''}" ${active?'disabled':''}>${active?'AKTIV':owned?'Ausrüsten':`${t.cost} Wins`}</button></article>`}).join('')}</div>`;body.querySelectorAll('[data-ekl-trail]').forEach(b=>b.onclick=()=>buyOrEquipTrail(b.dataset.eklTrail));}
  else{body.innerHTML=`<div class="ekl-shop-grid">${WORLD_DEFS.map(w=>`<article class="${!w.locked?'owned':''}"><small>WELT ${w.number}</small><h3>${w.name}</h3><p>${w.description}</p><button disabled>${w.locked?`Geplant · ${w.requiredWins} Wins`:'SPIELBAR IM HUB'}</button></article>`).join('')}</div>`;}
}
function buySpeedUpgrade(level){const u=SPEED_UPGRADES.find(x=>x.level===level);if(!u||G.state.speedUpgrade!==level-1)return;if(G.state.wins<u.cost)return toast(`Du brauchst ${u.cost} Wins.`,'bad');G.state.wins-=u.cost;G.state.speedUpgrade=level;queuePersist(50);toast(`${u.name} gekauft · Speed-Gain ×${u.mult.toFixed(2)}`,'good',2200);updateHud(true);openShop('speed');}
function buyOrEquipTrail(id){const t=TRAILS.find(x=>x.id===id);if(!t)return;if(!G.state.ownedTrails.includes(id)){if(G.state.wins<t.cost)return toast(`Du brauchst ${t.cost} Wins.`,'bad');G.state.wins-=t.cost;G.state.ownedTrails.push(id)}G.state.trail=id;setTrailColor();queuePersist(50);updateHud(true);toast(`${t.name} ausgerüstet.`,'good');openShop('trails');}
function openRebirth(){const reqSpeed=100000*Math.pow(4,G.state.rebirths),reqWins=10+G.state.rebirths*10;const wrap=openModal(`<div class="ekl-modal"><div class="ekl-modal-head"><div><small>PERMANENTE PROGRESSION</small><h2>🔄 Rebirth ${G.state.rebirths+1}</h2><p>Setzt deinen gesammelten Speed zurück. Deine gekauften Trails und deine Bestzeiten bleiben erhalten.</p></div><button data-ekl-modal-close>×</button></div><div class="ekl-big-stat"><div><small>BENÖTIGT SPEED</small><b>${fmt(reqSpeed)}</b></div><div><small>BENÖTIGT WINS</small><b>${reqWins}</b></div><div><small>DEIN SPEED</small><b>${fmt(G.state.speed)}</b></div><div><small>PERMANENTER GAIN</small><b>+50 %</b></div></div><div class="ekl-modal-actions"><button data-ekl-rebirth-confirm class="gold" ${G.state.speed<reqSpeed||G.state.wins<reqWins?'disabled':''}>Rebirth durchführen</button><button data-ekl-modal-close>Abbrechen</button></div></div>`);wrap.querySelector('[data-ekl-rebirth-confirm]')?.addEventListener('click',()=>{if(G.state.speed<reqSpeed||G.state.wins<reqWins)return;G.state.speed=0;G.state.wins-=reqWins;G.state.rebirths++;queuePersist(50);closeModal();updateHud(true);toast(`Rebirth ${G.state.rebirths} abgeschlossen · permanenter Speed-Gain erhöht!`,'good',3000);awardMainXp(15,'Escape.kl Rebirth',`escape-rebirth-${G.state.rebirths}`)});}
function showHelp(){openModal(`<div class="ekl-modal"><div class="ekl-modal-head"><div><small>ESCAPE.KL · STEUERUNG</small><h2>Wie spiele ich?</h2><p>Escape.kl ist ein echtes 3D-Jump'n'Run mit langfristigem Speed-Fortschritt.</p></div><button data-ekl-modal-close>×</button></div><div class="ekl-help"><article><b>🎮 PC</b><p>WASD laufen · Space springen · E interagieren · Shift schneller laufen · Maus ziehen = Kamera · R = Checkpoint-Respawn.</p></article><article><b>📱 Handy</b><p>Linker virtueller Stick zum Laufen. Rechts befinden sich Springen und Aktion.</p></article><article><b>⚡ Speed sammeln</b><p>Nur echte zurückgelegte Strecke am Boden zählt. Ein Meter gibt Basis-Speed × deinen Multiplikator.</p></article><article><b>🏪 Shop</b><p>Laufe im Hub in das SPEED-SHOP-Gebäude. Upgrades werden mit Wins gekauft.</p></article><article><b>🏁 Keyboard Lab</b><p>10 Stages mit Checkpoints. Fällst du herunter, startest du am letzten Checkpoint.</p></article><article><b>🎚 Speed-Limiter</b><p>25/50/75/100 % bestimmt deine echte Laufgeschwindigkeit. Dein gesammelter Speed bleibt dabei unverändert.</p></article></div></div>`);}
function showPause(){G.paused=true;openModal(`<div class="ekl-modal"><div class="ekl-modal-head"><div><small>ESCAPE.KL</small><h2>Pause</h2><p>Dein Lauf ist angehalten.</p></div><button data-ekl-resume>×</button></div><div class="ekl-modal-actions"><button data-ekl-resume class="gold">Weiter</button><button data-ekl-hub>Zum Hub</button><button data-ekl-exit>Top Games</button><button data-ekl-help>Steuerung</button></div></div>`);G.overlay.querySelectorAll('[data-ekl-resume]').forEach(b=>b.onclick=()=>{closeModal();G.paused=false});G.overlay.querySelector('[data-ekl-hub]').onclick=()=>{G.paused=false;setWorld('hub')};G.overlay.querySelector('[data-ekl-exit]').onclick=returnToTopGames;G.overlay.querySelector('[data-ekl-help]').onclick=showHelp;}
function showComplete(sec,stars,reward,previous){const wrap=document.createElement('div');wrap.className='ekl-complete';wrap.dataset.eklComplete='1';wrap.innerHTML=`<div class="ekl-complete-card"><small>WORLD 1 COMPLETE</small><h2>Keyboard Lab geschafft!</h2><div class="ekl-stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div><p>Zeit <b>${timeText(sec)}</b>${previous?` · Vorher ${timeText(previous)}`:''}<br>Deaths <b>${G.deaths}</b> · Belohnung <b>+${reward} Wins</b></p><div class="ekl-modal-actions"><button data-ekl-again class="gold">Nochmal</button><button data-ekl-finish-hub>Zum Hub</button></div></div>`;G.overlay.append(wrap);wrap.querySelector('[data-ekl-again]').onclick=()=>{wrap.remove();setWorld('keyboard-lab')};wrap.querySelector('[data-ekl-finish-hub]').onclick=()=>{wrap.remove();setWorld('hub')};}

function bindInput(){
  G.keyDown=e=>{if(['KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft','ShiftRight','KeyE','KeyR','Escape'].includes(e.code))e.preventDefault();if(e.code==='Escape'){if(G.modalOpen){closeModal();G.paused=false}else showPause();return}if(e.code==='Space'){jump();return}if(e.code==='KeyE'){interact();return}if(e.code==='KeyR'){respawn();return}G.keys.add(e.code)};G.keyUp=e=>G.keys.delete(e.code);document.addEventListener('keydown',G.keyDown);document.addEventListener('keyup',G.keyUp);
  const canvas=G.overlay.querySelector('canvas');canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;G.pointer={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture?.(e.pointerId)});G.pointerMove=e=>{if(!G.pointer||e.pointerId!==G.pointer.id)return;const dx=e.clientX-G.pointer.x,dy=e.clientY-G.pointer.y;G.pointer.x=e.clientX;G.pointer.y=e.clientY;G.yaw-=dx*.006;G.pitch=Math.max(.08,Math.min(.68,G.pitch+dy*.004))};G.pointerUp=e=>{if(G.pointer&&e.pointerId===G.pointer.id)G.pointer=null};canvas.addEventListener('pointermove',G.pointerMove);canvas.addEventListener('pointerup',G.pointerUp);canvas.addEventListener('pointercancel',G.pointerUp);
  const stick=G.overlay.querySelector('[data-ekl-stick]'),knob=stick?.querySelector('.ekl-stick-knob');if(stick&&knob){let sid=null;const update=e=>{const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,max=r.width*.32,len=Math.hypot(dx,dy)||1,scale=Math.min(1,max/len);dx*=scale;dy*=scale;G.mobileX=dx/max;G.mobileY=dy/max;knob.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`};stick.addEventListener('pointerdown',e=>{sid=e.pointerId;stick.setPointerCapture?.(sid);update(e)});stick.addEventListener('pointermove',e=>{if(e.pointerId===sid)update(e)});const end=e=>{if(e.pointerId!==sid)return;sid=null;G.mobileX=G.mobileY=0;knob.style.transform='translate(-50%,-50%)'};stick.addEventListener('pointerup',end);stick.addEventListener('pointercancel',end)}
  G.overlay.querySelector('[data-ekl-jump]')?.addEventListener('pointerdown',e=>{e.preventDefault();jump()});G.overlay.querySelector('[data-ekl-interact]')?.addEventListener('pointerdown',e=>{e.preventDefault();interact()});
}
function resize(){if(!G.renderer||!G.camera)return;const r=G.overlay.getBoundingClientRect();G.renderer.setSize(r.width,r.height,false);G.camera.aspect=r.width/Math.max(1,r.height);G.camera.updateProjectionMatrix();}
function loop(){if(!G.overlay)return;const dt=Math.min(.034,G.clock.getDelta()||.016),t=performance.now()/1000;updatePlatforms(t);processMovement(dt,t);detectInteraction();updateCamera(dt);updateTrail(dt);G.hudClock+=dt;if(G.hudClock>.12){G.hudClock=0;updateHud()}G.renderer.render(G.scene,G.camera);G.raf=requestAnimationFrame(loop);}

function open(sourceDevice=''){
  if(G.overlay)return;if(sourceDevice)G.sourceDevice=String(sourceDevice);else G.sourceDevice=window.JKGamesOwnedPhoneItem?.()||'';loadProgress();const el=document.createElement('div');el.className='escape-kl-overlay';el.innerHTML=`<div class="ekl-stage"><div class="ekl-canvas"><canvas aria-label="Escape.kl 3D Jump and Run"></canvas></div><div class="ekl-vignette"></div><div class="ekl-hud"><div class="ekl-topbar"><div class="ekl-logo"><small>JK.GAMES · TOP GAME</small><b>Escape.kl</b></div><div class="ekl-statrow"><div class="ekl-stat"><small>SPEED</small><b data-ekl-speed>0</b></div><div class="ekl-stat"><small>WINS</small><b data-ekl-wins>0</b></div><div class="ekl-stat"><small>REBIRTH</small><b data-ekl-rebirths>0</b></div><div class="ekl-stat"><small>SPEED GAIN</small><b data-ekl-gain>×1</b></div></div><div class="ekl-top-actions"><button data-ekl-help title="Hilfe">?</button><button data-ekl-pause title="Pause">Ⅱ</button><button data-ekl-close title="Top Games">×</button></div></div><div class="ekl-world-chip"><small data-ekl-world>ESCAPE HUB</small><b data-ekl-stage>FREIE WELT</b><span>V1 · Keyboard Lab</span></div><div class="ekl-stage-progress"><div><span>WORLD-FORTSCHRITT</span><b>10 STAGES</b></div><i><span data-ekl-stage-bar></span></i></div><div class="ekl-prompt" data-ekl-prompt></div><div class="ekl-speed-limiter"><span>SPEED LIMIT</span>${LIMITERS.map(v=>`<button data-ekl-limiter="${v}">${Math.round(v*100)}%</button>`).join('')}</div><div class="ekl-toast" data-ekl-toast></div><div class="ekl-touch"><div class="ekl-stick" data-ekl-stick><i class="ekl-stick-knob"></i></div><div class="ekl-touch-actions"><button class="jump" data-ekl-jump>SPRINGEN</button><button class="interact" data-ekl-interact>AKTION</button></div></div></div></div>`;document.body.append(el);document.body.classList.add('escape-kl-open');G.overlay=el;setupScene();bindInput();el.querySelector('[data-ekl-close]').onclick=returnToTopGames;el.querySelector('[data-ekl-pause]').onclick=showPause;el.querySelector('[data-ekl-help]').onclick=showHelp;el.querySelectorAll('[data-ekl-limiter]').forEach(b=>b.onclick=()=>{G.state.limiter=Number(b.dataset.eklLimiter);queuePersist(500);updateHud(true);toast(`Speed-Limiter: ${Math.round(G.state.limiter*100)} %`,'good',900)});G.resizeHandler=resize;window.addEventListener('resize',G.resizeHandler,{passive:true});G.clock.start();G.raf=requestAnimationFrame(loop);console.info(`Escape.kl ${VERSION} aktiv`);
}
function close(){if(!G.overlay)return;clearTimeout(G.persistTimer);if(G.dirty)syncProgressToMain(true);cancelAnimationFrame(G.raf);document.removeEventListener('keydown',G.keyDown);document.removeEventListener('keyup',G.keyUp);window.removeEventListener('resize',G.resizeHandler);closeModal();G.overlay.querySelector('[data-ekl-complete]')?.remove();G.renderer?.dispose();clearWorldObjects();if(G.playerRoot)G.scene?.remove(G.playerRoot);if(G.trail)G.scene?.remove(G.trail);disposeAll();G.overlay.remove();document.body.classList.remove('escape-kl-open');G.overlay=null;G.scene=null;G.camera=null;G.renderer=null;G.player=null;G.playerRoot=null;G.trail=null;G.keys.clear();G.mobileX=G.mobileY=0;G.paused=false;G.modalOpen=false;}
function returnToTopGames(){const source=G.sourceDevice||'';close();requestAnimationFrame(()=>window.JKGamesOpenTopGames?.(source));}
function getState(){loadProgress();return JSON.parse(JSON.stringify(G.state));}

window.EscapeKL={open,close,returnToTopGames,getState,version:VERSION,worlds:WORLD_DEFS.map(w=>({...w}))};
