import * as THREE from 'three';
import { ESCAPE_WORLD_DEFS as WORLD_DEFS, escapeWorldById } from './escape-kl-worlds.js?v=20260813-escape-v437';
import { buildKeyboardLabWorld } from './escape-kl-world-keyboard-lab.js?v=20260813-escape-v437';
import { buildCandyKeysWorld } from './escape-kl-world-candy-keys.js?v=20260813-escape-v437';
import { buildToxicKeyboardWorld } from './escape-kl-world-toxic-keyboard.js?v=20260813-escape-v437';
import { createEscapeCharacter } from './escape-kl-character.js?v=20260813-escape-v437';

/* Escape.kl – JK.Games Top Game V437 · stage-win economy + three-world difficulty ladder */
const VERSION = '2026-08-13-v437';
const LOCAL_KEY = 'jk-games-escape-kl-v1';
const PLAYER_HALF = 0.82;
const PLAYER_RADIUS = 0.38;
const GRAVITY = 24;
const JUMP_VELOCITY = 8.4;
const MAX_FALL = -24;
const SPEED_UPGRADES = Object.freeze([
  {level:1,name:'Speed-Multiplikator I',cost:5,mult:1.25},
  {level:2,name:'Speed-Multiplikator II',cost:20,mult:1.5},
  {level:3,name:'Speed-Multiplikator III',cost:60,mult:2},
  {level:4,name:'Speed-Multiplikator IV',cost:150,mult:3},
  {level:5,name:'Speed-Multiplikator V',cost:400,mult:5}
]);
const TRAILS = Object.freeze([
  {id:'none',name:'Kein Trail',cost:0,color:0xffffff},
  {id:'cyan',name:'Cyan Key Trail',cost:10,color:0x58e6ff},
  {id:'violet',name:'Glitch Trail',cost:35,color:0x9c6cff},
  {id:'gold',name:'Golden ESC Trail',cost:80,color:0xffcf55},
  {id:'electric',name:'Electric Key Trail',cost:180,color:0x73a7ff},
  {id:'toxic',name:'Toxic Keyboard Trail',cost:350,color:0x7cff72},
  {id:'galaxy',name:'Galaxy Keyboard Trail',cost:0,color:0xbd78ff,jk:true}
]);

const G = {
  overlay:null, scene:null, camera:null, renderer:null, raf:0, lastFrameAt:0,
  sourceDevice:'', state:null, dirty:false, persistTimer:0, lastLocalSave:0,
  player:null, playerRoot:null, character:null, trail:null, trailPoints:[],
  platforms:[], interactables:[], decorative:[], portalFx:[], colliders:[],
  world:'hub', stage:0, checkpoint:null, deaths:0, runStartedAt:0, runFinished:false, stageClaims:new Set(),
  pos:new THREE.Vector3(0,1.08,8), vel:new THREE.Vector3(), moveVel:new THREE.Vector3(), grounded:false, support:null,lastSupport:null,
  keys:new Set(), inputX:0, inputY:0, mobileX:0, mobileY:0, sprint:false,mobileSprint:false,moveIntensity:0,jumpHeld:false,jumpQueuedUntil:0,lastGroundedAt:0,coyoteAvailable:false,
  yaw:0, pitch:.32, camDistance:7.2, pointer:null,
  keyDown:null,keyUp:null,resizeHandler:null,pointerMove:null,pointerUp:null,
  lastGroundPos:new THREE.Vector3(), speedDistanceCarry:0, trainingCarry:0,
  prompt:null, activeInteractable:null, toastTimer:0, paused:false, modalOpen:false,
  particleClock:0, movingClock:0, hudClock:0, trailClock:0,footstepClock:0,landingPulse:0,
  materials:new Map(), geometries:new Map(), textures:new Map(),buildScope:'hub',autoTriggers:[],triggerLocks:new Map(),runFurthestZ:-70,
  audioCtx:null,audioUnlocked:false,lastMotionLabel:'IDLE',
  tmpV:new THREE.Vector3(), tmpV2:new THREE.Vector3(),tmpV3:new THREE.Vector3()
};

function defaultProgress(){
  return {
    version:5,speed:0,wins:0,lifetimeWins:0,stageWinsCollected:0,rebirths:0,speedUpgrade:0,
    trail:'none',ownedTrails:['none'],worldsUnlocked:['keyboard-lab'],
    worldStars:{},bestTimes:{},completions:{},hiddenKeys:{},totalDistance:0,
    lastWheelAt:0,dailyQuest:null,jkTreadmillTier:0,jkSpeedBoostUntil:0,lastPlayedAt:Date.now()
  };
}
function normalizeProgress(raw){
  const d={...defaultProgress(),...(raw&&typeof raw==='object'?raw:{})};
  d.speed=Math.max(0,Number(d.speed)||0);
  d.wins=Math.max(0,Math.floor(Number(d.wins)||0));
  d.lifetimeWins=Math.max(d.wins,Math.floor(Number(d.lifetimeWins)||0));
  d.stageWinsCollected=Math.max(0,Math.floor(Number(d.stageWinsCollected)||0));
  d.rebirths=Math.max(0,Math.floor(Number(d.rebirths)||0));
  d.speedUpgrade=Math.max(0,Math.min(SPEED_UPGRADES.length,Math.floor(Number(d.speedUpgrade)||0)));
  d.ownedTrails=Array.isArray(d.ownedTrails)?[...new Set(d.ownedTrails.filter(id=>TRAILS.some(t=>t.id===id)))]:['none'];
  if(!d.ownedTrails.includes('none'))d.ownedTrails.unshift('none');
  d.trail=d.ownedTrails.includes(d.trail)?d.trail:'none';
  d.worldsUnlocked=Array.isArray(d.worldsUnlocked)?[...new Set(d.worldsUnlocked)]:['keyboard-lab'];
  if(!d.worldsUnlocked.includes('keyboard-lab'))d.worldsUnlocked.unshift('keyboard-lab');
  d.worldStars=d.worldStars&&typeof d.worldStars==='object'?d.worldStars:{};
  d.bestTimes=d.bestTimes&&typeof d.bestTimes==='object'?d.bestTimes:{};
  d.completions=d.completions&&typeof d.completions==='object'?d.completions:{};
  d.hiddenKeys=d.hiddenKeys&&typeof d.hiddenKeys==='object'?d.hiddenKeys:{};
  d.totalDistance=Math.max(0,Number(d.totalDistance)||0);
  d.lastWheelAt=Math.max(0,Number(d.lastWheelAt)||0);
  d.dailyQuest=d.dailyQuest&&typeof d.dailyQuest==='object'?d.dailyQuest:null;
  d.jkTreadmillTier=Math.max(0,Math.min(2,Math.floor(Number(d.jkTreadmillTier)||0)));
  d.jkSpeedBoostUntil=Math.max(0,Number(d.jkSpeedBoostUntil)||0);
  d.version=5;
  return d;
}
function loadProgress(){
  let raw=null;
  try{const root=window.JKGamesGetActiveState?.();if(root?.escapeKL)raw=root.escapeKL}catch{}
  if(!raw)try{raw=JSON.parse(localStorage.getItem(LOCAL_KEY)||'null')}catch{}
  G.state=normalizeProgress(raw);
  updateWorldUnlocks();
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
function currentWorldDef(){return escapeWorldById(G.world);}
function isEscapeWorld(id=G.world){const w=escapeWorldById(id);return !!w&&!w.locked;}
function updateWorldUnlocks(){
  if(!G.state)return [];
  const unlocked=[];
  for(const w of WORLD_DEFS){
    if(w.locked||w.number===1)continue;
    if(G.state.worldsUnlocked.includes(w.id))continue;
    if(G.state.lifetimeWins>=Number(w.requiredLifetimeWins||0)){G.state.worldsUnlocked.push(w.id);unlocked.push(w);}
  }
  return unlocked;
}
function awardWins(amount,source='Wins',stageWin=false){
  amount=Math.max(0,Math.floor(Number(amount)||0));if(!amount)return 0;
  G.state.wins+=amount;G.state.lifetimeWins+=amount;if(stageWin)G.state.stageWinsCollected+=amount;
  const newlyUnlocked=updateWorldUnlocks();queuePersist(80);updateHud(true);
  for(const w of newlyUnlocked)setTimeout(()=>toast(`🌍 Welt ${w.number} freigeschaltet: ${w.name}!`,'good',3200),350);
  return amount;
}
function fmt(n){n=Number(n)||0;if(n<1000)return Math.floor(n).toLocaleString('de-DE');if(n<1e6)return `${(n/1e3).toFixed(n<1e4?1:0).replace('.',',')} Tsd`;if(n<1e9)return `${(n/1e6).toFixed(n<1e7?1:0).replace('.',',')} Mio`;return `${(n/1e9).toFixed(1).replace('.',',')} Mrd`;}
function timeText(sec){sec=Math.max(0,Number(sec)||0);const m=Math.floor(sec/60),s=sec-m*60;return `${m}:${s.toFixed(2).padStart(5,'0')}`;}
function gainMultiplier(){const up=SPEED_UPGRADES[Math.max(0,G.state.speedUpgrade)-1]?.mult||1,boost=Date.now()<Number(G.state.jkSpeedBoostUntil||0)?2:1;return up*(1+G.state.rebirths*.5)*boost;}
function dayKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function ensureDailyQuest(){if(!G.state)return null;const key=dayKey();if(!G.state.dailyQuest||G.state.dailyQuest.day!==key){G.state.dailyQuest={day:key,distanceStart:Number(G.state.totalDistance)||0,completionsStart:Number(G.state.completions?.['keyboard-lab']||0),speedEarned:0,claimed:[]};queuePersist(1200);}if(!Array.isArray(G.state.dailyQuest.claimed))G.state.dailyQuest.claimed=[];G.state.dailyQuest.speedEarned=Math.max(0,Number(G.state.dailyQuest.speedEarned)||0);return G.state.dailyQuest;}
function addSpeed(amount,countDaily=true){amount=Math.max(0,Number(amount)||0);if(!amount)return;G.state.speed+=amount;if(countDaily){const q=ensureDailyQuest();if(q)q.speedEarned+=amount;}}
function movementSpeed(){const collected=Math.max(0,G.state.speed),curve=4.6+Math.log10(1+collected)*2.35,sprint=G.sprint?1.12:1;return Math.min(19.5,curve)*sprint;}

function mat(key,params){if(G.materials.has(key))return G.materials.get(key);const m=new THREE.MeshStandardMaterial(params);G.materials.set(key,m);return m;}
function geo(key,factory){if(G.geometries.has(key))return G.geometries.get(key);const g=factory();G.geometries.set(key,g);return g;}
function canvasTexture(key,text,bg='#182435',fg='#ffffff'){
  if(G.textures.has(key))return G.textures.get(key);const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,256,256);x.strokeStyle='rgba(255,255,255,.18)';x.lineWidth=7;x.strokeRect(9,9,238,238);x.fillStyle=fg;x.font=`900 ${text.length>5?42:text.length>2?58:78}px system-ui`;x.textAlign='center';x.textBaseline='middle';x.fillText(text,128,130);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;G.textures.set(key,t);return t;
}
function disposeAll(){for(const v of G.geometries.values())v.dispose?.();for(const v of G.materials.values())v.dispose?.();for(const v of G.textures.values())v.dispose?.();G.geometries.clear();G.materials.clear();G.textures.clear();}

function addPlatform({x=0,y=0,z=0,w=3,h=.45,d=3,color=0x223a58,label='',checkpoint=0,stage=0,finish=false,winReward=0,winStage=0,motion=null,blink=false,kind='key',hub=false}){
  const sharedSide=mat(`side-${color}`,{color:new THREE.Color(color).multiplyScalar(.62),roughness:.68,metalness:.1});const side=blink?sharedSide.clone():sharedSide;if(blink)G.materials.set(`blink-side-${color}-${G.platforms.length}`,side);
  let top=mat(`top-${color}`,{color,roughness:.48,metalness:.1});
  if(label){top=new THREE.MeshStandardMaterial({map:canvasTexture(`key-${label}-${color}`,label,`#${new THREE.Color(color).getHexString()}`),roughness:.46,metalness:.06});G.materials.set(`labelmat-${label}-${color}-${G.platforms.length}`,top)}else if(blink){top=top.clone();G.materials.set(`blink-top-${color}-${G.platforms.length}`,top)}
  const mesh=new THREE.Mesh(geo(`box-${w}-${h}-${d}`,()=>new THREE.BoxGeometry(w,h,d)),[side,side,top,side,side,side]);mesh.position.set(x,y,z);mesh.castShadow=kind==='hub'||kind==='shop-floor'||kind==='start'||kind==='finish';mesh.receiveShadow=true;G.scene.add(mesh);
  const p={mesh,w,h,d,label,base:new THREE.Vector3(x,y,z),motion,blink,active:true,checkpoint,stage,finish,winReward:Math.max(0,Number(winReward)||0),winStage:Math.max(0,Number(winStage)||0),kind,hub,scope:G.buildScope,lastPos:new THREE.Vector3(x,y,z),delta:new THREE.Vector3(),press:0,lastContactAt:0};tagScope(mesh,p.scope);mesh.userData.escapePlatform=p;G.platforms.push(p);return p;
}
function tagScope(object,scope=G.buildScope){if(object?.userData)object.userData.escapeScope=scope;return object;}
function addSign(text,pos,color=0x58ddff,scale=1){const tex=canvasTexture(`sign-${text}-${color}`,text,'#07101b','#ffffff');const m=new THREE.MeshBasicMaterial({map:tex,transparent:false,toneMapped:false,side:THREE.FrontSide});G.materials.set(`signmat-${text}-${G.decorative.length}`,m);const plane=tagScope(new THREE.Mesh(geo(`sign-${3.2*scale}-${1.25*scale}`,()=>new THREE.PlaneGeometry(3.2*scale,1.25*scale)),m));plane.position.copy(pos);plane.rotation.y=pos.z>10?Math.PI:0;G.scene.add(plane);G.decorative.push(plane);return plane;}
function boxDeco(x,y,z,w,h,d,color,emissive=0){const m=mat(`deco-${color}-${emissive}`,{color,emissive,emissiveIntensity:emissive?.35:0,roughness:.65,metalness:.12});const o=tagScope(new THREE.Mesh(geo(`deco-box-${w}-${h}-${d}`,()=>new THREE.BoxGeometry(w,h,d)),m));o.position.set(x,y,z);o.castShadow=false;o.receiveShadow=true;G.scene.add(o);G.decorative.push(o);return o;}
function addInteractable(id,label,x,y,z,radius,onUse){const marker={id,label,pos:new THREE.Vector3(x,y,z),radius,onUse,scope:G.buildScope};G.interactables.push(marker);return marker;}
function addAutoTrigger(id,x,z,w,d,onEnter){const trigger={id,x,z,w,d,onEnter,scope:G.buildScope,inside:false};G.autoTriggers.push(trigger);return trigger;}
function addCylinderDeco(x,y,z,rTop,rBottom,h,color,emissive=0,segments=16){const m=mat(`cyl-${color}-${emissive}`,{color,emissive,emissiveIntensity:emissive?.45:0,roughness:.52,metalness:.18});const o=tagScope(new THREE.Mesh(geo(`cyl-${rTop}-${rBottom}-${h}-${segments}`,()=>new THREE.CylinderGeometry(rTop,rBottom,h,segments)),m));o.position.set(x,y,z);o.castShadow=false;o.receiveShadow=true;G.scene.add(o);G.decorative.push(o);return o;}
function addRingDeco(x,y,z,r,tube,color,rotX=Math.PI/2){const m=mat(`ring-${color}`,{color,emissive:color,emissiveIntensity:.72,roughness:.36,metalness:.28});const o=tagScope(new THREE.Mesh(geo(`ring-${r}-${tube}`,()=>new THREE.TorusGeometry(r,tube,8,28)),m));o.position.set(x,y,z);o.rotation.x=rotX;o.castShadow=false;G.scene.add(o);G.decorative.push(o);return o;}
function addGlowLight(x,y,z,color=0x67e8ff,intensity=1.4,distance=11){const l=tagScope(new THREE.PointLight(color,intensity,distance,2));l.position.set(x,y,z);G.scene.add(l);G.decorative.push(l);return l;}
function addCollider(x,z,w,d){G.colliders.push({x,z,w,d,scope:G.buildScope});}
function resolveHubColliders(prevX,prevZ){
  if(G.world!=='hub')return;
  G.pos.x=Math.max(-26.65,Math.min(26.65,G.pos.x));G.pos.z=Math.max(-26.65,Math.min(26.65,G.pos.z));
  for(const c of G.colliders){const inside=Math.abs(G.pos.x-c.x)<c.w/2+PLAYER_RADIUS&&Math.abs(G.pos.z-c.z)<c.d/2+PLAYER_RADIUS;if(!inside)continue;const oldX=Math.abs(prevX-c.x)<c.w/2+PLAYER_RADIUS,oldZ=Math.abs(prevZ-c.z)<c.d/2+PLAYER_RADIUS;if(!oldX)G.pos.x=prevX;else if(!oldZ)G.pos.z=prevZ;else{G.pos.x=prevX;G.pos.z=prevZ;}G.moveVel.x*=.35;G.moveVel.z*=.35;}
}
function ensureAudio(){if(G.audioCtx)return G.audioCtx;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;G.audioCtx=new C();G.audioUnlocked=true;if(G.audioCtx.state==='suspended')G.audioCtx.resume().catch(()=>{});return G.audioCtx}catch{return null}}
function tone(freq=240,duration=.05,type='sine',gain=.025,slide=0){const ctx=ensureAudio();if(!ctx||ctx.state==='closed')return;try{const now=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(Math.max(30,freq),now);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),now+duration);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),now+.006);g.gain.exponentialRampToValueAtTime(.0001,now+duration);o.connect(g).connect(ctx.destination);o.start(now);o.stop(now+duration+.02)}catch{}}
function soundKey(label=''){const seed=[...String(label||'KEY')].reduce((a,c)=>a+c.charCodeAt(0),0);tone(150+(seed%85),.035,'square',.013,-25);setTimeout(()=>tone(82+(seed%35),.024,'triangle',.008,-8),18)}
function soundJump(){tone(205,.08,'triangle',.022,115)}
function soundCheckpoint(){tone(420,.08,'sine',.024,180);setTimeout(()=>tone(650,.10,'sine',.018,120),78)}
function soundFail(){tone(170,.11,'sawtooth',.018,-80)}
function soundBuy(){tone(520,.055,'triangle',.02,130);setTimeout(()=>tone(760,.08,'sine',.016,80),62)}
function soundFinish(){[0,100,210,330].forEach((ms,i)=>setTimeout(()=>tone([392,523,659,784][i],.16,'triangle',.025,45),ms))}

function setupScene(){
  const canvas=G.overlay.querySelector('canvas');G.renderer=new THREE.WebGLRenderer({canvas,antialias:(window.devicePixelRatio||1)<2,powerPreference:'high-performance'});G.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.35));G.renderer.outputColorSpace=THREE.SRGBColorSpace;G.renderer.toneMapping=THREE.ACESFilmicToneMapping;G.renderer.toneMappingExposure=1.05;G.renderer.shadowMap.enabled=true;G.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  G.scene=new THREE.Scene();G.scene.background=new THREE.Color(0x07111d);G.scene.fog=new THREE.Fog(0x07111d,38,210);G.camera=new THREE.PerspectiveCamera(63,1,.1,360);G.scene.add(new THREE.HemisphereLight(0xbfdcff,0x182010,1.55));const sun=new THREE.DirectionalLight(0xffe1b5,2.1);sun.position.set(-28,46,18);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-70;sun.shadow.camera.right=70;sun.shadow.camera.top=80;sun.shadow.camera.bottom=-80;G.scene.add(sun);
  const worldApi={addPlatform,addSign:(text,pos,color,scale)=>addSign(text,new THREE.Vector3(pos.x,pos.y,pos.z),color,scale),boxDeco,addCylinderDeco,addRingDeco,addGlowLight,addInteractable,returnHub:()=>setWorld('hub')};
  G.buildScope='hub';buildHub();G.buildScope='race';buildRaceCourse();
  G.buildScope='keyboard-lab';buildKeyboardLabWorld(worldApi);
  G.buildScope='candy-keys';buildCandyKeysWorld(worldApi);
  G.buildScope='toxic-keyboard';buildToxicKeyboardWorld(worldApi);
  G.buildScope='hub';createPlayer();resize();setWorld('hub',true);updateHud(true);
}
function clearWorldObjects(){for(const p of G.platforms)G.scene?.remove(p.mesh);for(const d of G.decorative)G.scene?.remove(d);for(const f of G.portalFx)G.scene?.remove(f);G.platforms=[];G.decorative=[];G.portalFx=[];G.interactables=[];G.colliders=[];G.autoTriggers=[];G.triggerLocks.clear();}
function applyWorldVisibility(){
  for(const p of G.platforms)p.mesh.visible=p.scope===G.world;
  for(const d of G.decorative){const scope=d?.userData?.escapeScope;if(scope)d.visible=scope===G.world;}
  for(const f of G.portalFx){const scope=f?.userData?.escapeScope||'hub';f.visible=scope===G.world;}
}
function checkAutoTriggers(){
  for(const tr of G.autoTriggers){
    if(tr.scope!==G.world){tr.inside=false;continue}
    const inside=Math.abs(G.pos.x-tr.x)<=tr.w/2&&Math.abs(G.pos.z-tr.z)<=tr.d/2;
    if(inside&&!tr.inside){tr.inside=true;try{tr.onEnter?.()}catch(error){console.warn('Escape.kl Auto-Trigger',tr.id,error)}}
    else if(!inside)tr.inside=false;
  }
}
function buildHub(){
  addPlatform({x:0,y:0,z:0,w:56,h:.5,d:56,color:0x13243b,kind:'hub',hub:true});
  // Floor inlays make the hub feel like a giant illuminated keyboard deck.
  for(let row=-2;row<=2;row++)for(let col=-4;col<=4;col++){const x=col*5.25,z=row*5.15;if(Math.abs(x)<4&&Math.abs(z)<4)continue;const key=addPlatform({x,y:.285,z,w:4.55,h:.08,d:4.4,color:(row+col)%2?0x142b43:0x10243a,label:Math.abs(col)===4?'ESC':'',kind:'hub-key',hub:true});key.press=0;}
  for(const x of[-26,26])for(let z=-22;z<=22;z+=22){addCylinderDeco(x,1.25,z,.09,.14,2.5,0x2cbfd8,0x155b70,10);addGlowLight(x,2.2,z,0x5cecff,.62,7);}
  // Visible safety rail + hard hub bounds: players can no longer fall off the spawn hub.
  for(const z of[-27.35,27.35]){boxDeco(0,1.05,z,55.2,1.45,.32,0x1c5268,0x0c3445);boxDeco(0,2.0,z,55.2,.10,.42,0x55dbf0,0x164e61);}
  for(const x of[-27.35,27.35]){boxDeco(x,1.05,0,.32,1.45,55.2,0x1c5268,0x0c3445);boxDeco(x,2.0,0,.42,.10,55.2,0x55dbf0,0x164e61);}

  // Real walk-in Speed Shop: open front, counter, shelves and warm interior light.
  addPlatform({x:12,y:.32,z:-1,w:10,h:.28,d:9,color:0x1d354a,label:'SHOP',kind:'shop-floor',hub:true});
  boxDeco(12,2.55,-5.15,10,4.5,.35,0x17324a);boxDeco(7.15,2.55,-1,.35,4.5,8.6,0x17324a);boxDeco(16.85,2.55,-1,.35,4.5,8.6,0x17324a);boxDeco(12,4.88,-1,10.4,.32,9.2,0x594118);
  addCollider(12,-5.15,10,.35);addCollider(7.15,-1,.35,8.6);addCollider(16.85,-1,.35,8.6);addCollider(12,-2.8,6.7,.75);
  boxDeco(12,1.18,-2.8,6.7,1.25,.75,0x263c4d);boxDeco(12,1.88,-4.72,7.2,.12,.32,0xe4b84f,0x705513);
  for(const sx of[9.1,12,14.9]){boxDeco(sx,2.6,-4.9,1.65,.12,.25,0xf0c85c,0x745814);boxDeco(sx,3.3,-4.9,1.65,.12,.25,0x60ddff,0x164c67);}
  addSign('SPEED SHOP',new THREE.Vector3(12,4.4,3.52),0xf6c85b,1.02);addGlowLight(12,3.5,-1,0xffd36a,1.35,12);addInteractable('shop','Am Tresen einkaufen',12,1.05,-1.9,4.1,()=>{soundKey('SHOP');openShop()});

  // Sport-Laufbänder: kurzer Gurt, Seitenrahmen, Frontbügel und Konsole.
  const treadmillDefs=[
    {name:'FREE ×1',mult:1,tier:0,color:0x19544f,x:-15.2},
    {name:'GOLD ×3',mult:3,tier:1,color:0x82621f,x:-11.7},
    {name:'DIAMOND ×9',mult:9,tier:2,color:0x296b88,x:-8.2}
  ];
  for(const def of treadmillDefs){
    const tr=addPlatform({x:def.x,y:.36,z:.25,w:2.55,h:.22,d:5.35,color:def.color,label:'',kind:'training',hub:true});tr.training=true;tr.trainingMult=def.mult;tr.trainingTier=def.tier;tr.trainingName=def.name;
    // Belt + deck
    boxDeco(def.x,.50,.25,2.2,.08,4.75,0x111820);for(let sl=-1.85;sl<=1.85;sl+=.74)boxDeco(def.x,.555,.25+sl,2.02,.025,.045,0x4a5966);
    // Low side rails along the belt
    boxDeco(def.x-1.22,.72,.25,.12,.32,5.2,0x263745);boxDeco(def.x+1.22,.72,.25,.12,.32,5.2,0x263745);
    // Front upright + hand rail/console, like a gym treadmill
    for(const sx of[-.92,.92])boxDeco(def.x+sx,1.48,2.48,.12,1.95,.14,0x334a59);
    boxDeco(def.x,2.28,2.48,2.05,.13,.16,0x3d5667);boxDeco(def.x,2.02,2.38,1.18,.46,.28,0x101b25,0x0c2c3a);
    boxDeco(def.x,2.03,2.20,.82,.22,.06,def.color,def.color);addSign(def.name,new THREE.Vector3(def.x,2.92,2.56),def.color,.44);
  }
  addSign('SPEED TRAINING',new THREE.Vector3(-11.7,4.0,3.1),0x62f2e1,.92);addGlowLight(-11.7,2.8,.2,0x4ef1db,.82,11);

  // Rebirth-Station: Beschriftung steht vor dem Spieler und wird nicht mehr vom Altar verdeckt.
  addPlatform({x:-11,y:.45,z:-15,w:7,h:.5,d:7,color:0x542c72,label:'',kind:'altar',hub:true});addCollider(-11,-15,2.9,2.9);
  boxDeco(-11,2.35,-18.15,7.4,4.4,.34,0x21152f);addCollider(-11,-18.15,7.4,.34);addSign('REBIRTH',new THREE.Vector3(-11,3.65,-17.94),0xc694ff,.86);addSign('PERMANENT SPEED',new THREE.Vector3(-11,2.48,-17.92),0x69dcff,.48);
  addCylinderDeco(-11,1.1,-15,1.15,1.45,1.35,0x6c3a91,0x32195e,18);addCylinderDeco(-11,2.5,-15,.42,.55,2.3,0x9f68ff,0x452073,16);addRingDeco(-11,3.05,-15,1.45,.07,0xbb78ff,Math.PI/2);addRingDeco(-11,3.05,-15,1.05,.045,0x69dcff,Math.PI/2);addGlowLight(-11,3,-15,0xb76cff,1.55,12);addInteractable('rebirth','Rebirth öffnen',-11,1,-13.0,4.0,()=>{soundKey('REBIRTH');openRebirth()});

  // World 1 portal: offener Durchgang. Kein E mehr – einfach hindurchlaufen.
  boxDeco(0,3.2,-18,10,.45,.8,0x1a6f84,0x124c63);boxDeco(-4.65,1.65,-18,.62,6.5,.8,0x1a6f84,0x124c63);boxDeco(4.65,1.65,-18,.62,6.5,.8,0x1a6f84,0x124c63);addCollider(-4.65,-18,.62,.9);addCollider(4.65,-18,.62,.9);addRingDeco(0,2.75,-17.86,3.05,.08,0x5be9ff,0);addGlowLight(0,2.8,-17.4,0x45dfff,1.55,13);
  const portal=tagScope(new THREE.Mesh(new THREE.PlaneGeometry(8.1,5.7),new THREE.MeshBasicMaterial({color:0x4ddffc,transparent:true,opacity:.11,side:THREE.DoubleSide,depthWrite:false})));portal.position.set(0,2.85,-18);portal.rotation.y=Math.PI;G.scene.add(portal);G.portalFx.push(portal);addSign('WORLD 1 · KEYBOARD LAB',new THREE.Vector3(0,5.85,-17.55),0x56ddff,.82);addSign('DURCHLAUFEN = START',new THREE.Vector3(0,4.55,-17.53),0xf7c95b,.48);
  boxDeco(-2.0,.50,-15.6,.10,.05,4.0,0x42dff5,0x16839b);boxDeco(2.0,.50,-15.6,.10,.05,4.0,0x42dff5,0x16839b);
  addAutoTrigger('world1-walkthrough',0,-18.0,7.8,2.2,()=>{soundKey('ENTER');enterWorld('keyboard-lab')});

  // Weitere Welten: ebenfalls ohne E. Lifetime-Wins schalten die Portale permanent frei.
  const addWorldPortal=(id,x,z,color)=>{
    const w=escapeWorldById(id);if(!w)return;
    addPlatform({x,y:.30,z,w:6.4,h:.34,d:5.8,color,label:`W${w.number}`,kind:'world-gate',hub:true});
    boxDeco(x-2.8,2.0,z-2.45,.42,3.8,.55,color,color);boxDeco(x+2.8,2.0,z-2.45,.42,3.8,.55,color,color);boxDeco(x,3.78,z-2.45,6.0,.38,.55,color,color);
    addRingDeco(x,2.25,z-2.25,1.75,.07,color,0);addGlowLight(x,2.4,z-1.9,color,.9,9);
    addSign(`WORLD ${w.number} · ${w.name.toUpperCase()}`,new THREE.Vector3(x,4.65,z-2.15),color,.58);
    addSign(`${w.requiredLifetimeWins.toLocaleString('de-DE')} LIFETIME WINS`,new THREE.Vector3(x,3.72,z-2.13),0xffd36a,.34);
    addAutoTrigger(`${id}-walkthrough`,x,z-2.4,5.5,2.2,()=>{soundKey('ENTER');enterWorld(id)});
  };
  addWorldPortal('candy-keys',18,-16,0xde6ba8);
  addWorldPortal('toxic-keyboard',24,-5,0x70db65);
  const cyber=escapeWorldById('cyber-city');addPlatform({x:20,y:.3,z:7,w:5.8,h:.35,d:5.8,color:0x4650a5,label:'LOCK',kind:'locked',hub:true});addSign('WORLD 4 · CYBER CITY',new THREE.Vector3(20,2.9,9.95),0x7f86ff,.55);addSign('COMING SOON',new THREE.Vector3(20,2.05,9.97),0xffd36a,.36);

  // Speed Race gate – short replayable race with its own best time.
  addPlatform({x:22,y:.34,z:20,w:7,h:.3,d:6,color:0x7a3d2b,label:'RACE',kind:'race-gate',hub:true});boxDeco(22,1.7,22.55,6.6,3.0,.35,0x271711);addCollider(22,22.55,6.6,.35);addSign('SPEED RACE',new THREE.Vector3(22,3.2,22.75),0xff8b5d,.78);addGlowLight(22,2.3,21.8,0xff7655,1.05,9);addInteractable('speed-race','Speed Race starten',22,1.0,20.4,4.5,()=>{soundKey('RACE');setWorld('race')});

  // Daily wheel – a real physical machine in the hub.
  addPlatform({x:-21,y:.34,z:14,w:6,h:.3,d:6,color:0x4e356e,label:'DAILY',kind:'wheel-floor',hub:true});boxDeco(-21,1.25,16.3,5.5,2.0,.35,0x171d2b);addCollider(-21,16.3,5.5,.35);addRingDeco(-21,2.25,16.05,1.55,.15,0xf0b85b,0);addRingDeco(-21,2.25,15.96,.92,.08,0x69e4ff,0);addCylinderDeco(-21,.95,15.85,.16,.28,1.4,0xd5a24d,0x6d4b10,12);addGlowLight(-21,2.25,15.2,0xffcb68,1.1,9);addSign('DAILY WHEEL',new THREE.Vector3(-21,4.0,16.18),0xffc65a,.72);addInteractable('daily-wheel','Daily Wheel drehen',-21,1.1,14.2,4.2,()=>{soundKey('DAILY');openDailyWheel()});

  // Daily quest terminal.
  addPlatform({x:12,y:.32,z:17,w:7,h:.28,d:6,color:0x254967,label:'QUEST',kind:'quest-floor',hub:true});boxDeco(12,1.85,19.55,6.6,3.2,.32,0x0b1826);addCollider(12,19.55,6.6,.32);boxDeco(12,1.9,19.35,5.5,2.1,.12,0x163953,0x0b2d45);addSign('DAILY QUESTS',new THREE.Vector3(12,3.35,19.72),0x66e3ff,.76);addGlowLight(12,2.5,18.8,0x58dfff,.9,8);addInteractable('daily-quests','Tagesquests ansehen',12,1.0,17.8,4.3,()=>{soundKey('QUEST');openDailyQuests()});

  // Records board / personal leaderboard. No continuous Firestore writer is needed.
  boxDeco(-1.0,1.8,22,15,3.4,.28,0x0b1725);addCollider(-1,22,15,.28);addSign('ESCAPE.KL',new THREE.Vector3(-1,2.75,21.82),0xffcb5a,1.22);addSign('RECORDS · RUN · JUMP',new THREE.Vector3(-1,1.45,21.8),0x6be5ff,.65);addGlowLight(-1,2.6,20.8,0xffcb5a,.75,9);addInteractable('records','Escape-Statistiken ansehen',-1,1.0,20.0,5.7,()=>{soundKey('RECORD');openRecords()});
}
function buildRaceCourse(){
  const x0=72,z0=20;addPlatform({x:x0,y:.4,z:z0,w:12,h:.55,d:8,color:0x783c2b,label:'START',checkpoint:1,kind:'race-start'});addSign('ESCAPE SPEED RACE',new THREE.Vector3(x0,4.2,z0+3.8),0xff895c,.92);addGlowLight(x0,2.5,z0+2.0,0xff7552,1.1,12);
  let z=z0-7;const names=['W','A','S','D','SHIFT','SPACE','1','2','3','GO','FAST','ESC','RUN','KEY','WIN','RACE'];for(let i=0;i<16;i++){z-=4.25;const cp=i===3?2:i===7?3:i===11?4:i===15?5:0;const motion=i===5||i===10?{axis:'x',amp:2.7,speed:.85,phase:i*.5}:null;addPlatform({x:x0+Math.sin(i*.9)*3.2,y:.65+(i%4===3?.35:0),z,w:i%5===4?5.4:2.8,h:.48,d:2.8,color:cp?0xb35538:0x7b4939,label:names[i],checkpoint:cp,kind:'race-key',motion});if(cp)addGlowLight(x0,2.1,z,0xff815c,.52,8);}
  z-=6.5;addPlatform({x:x0,y:1.05,z,w:12,h:.6,d:7,color:0xd27a38,label:'FINISH',finish:true,checkpoint:5,kind:'race-finish'});boxDeco(x0,4.5,z-2.8,12,.35,.55,0xffa24e,0x8b3e18);addSign('RACE FINISH',new THREE.Vector3(x0,5.1,z+3.45),0xffb35d,.92);addGlowLight(x0,3.2,z,0xff9a50,1.25,12);addInteractable('race-hub-return','Nach dem Rennen zum Hub',x0,1.8,z-2,5,()=>setWorld('hub'));
}
function createPlayer(){
  let gender='male';try{gender=window.JKGamesGetActiveState?.()?.gender==='female'?'female':'male'}catch{}
  G.character=createEscapeCharacter({gender,floorOffset:PLAYER_HALF,onReady:()=>toast(`${gender==='female'?'Weiblicher':'Männlicher'} JK.Games-Charakter · Idle/Walk/Run geladen`,'good',1900)});
  G.playerRoot=G.character.root;G.player=G.playerRoot;G.scene.add(G.playerRoot);
  const trailGeo=new THREE.BufferGeometry();trailGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(48*3),3));const trailMat=new THREE.LineBasicMaterial({color:TRAILS.find(t=>t.id===G.state.trail)?.color||0xffffff,transparent:true,opacity:.72});G.materials.set('trail-line',trailMat);G.trail=new THREE.Line(trailGeo,trailMat);G.trail.frustumCulled=false;G.scene.add(G.trail);G.trailPoints=[];
}
function setTrailColor(){const t=TRAILS.find(x=>x.id===G.state.trail)||TRAILS[0];if(G.trail?.material)G.trail.material.color.setHex(t.color);}

function setWorld(id,initial=false){
  G.world=id;G.runFinished=false;G.activeInteractable=null;closeModal();G.yaw=0;G.jumpQueuedUntil=0;G.jumpHeld=false;G.stageClaims.clear();
  const w=escapeWorldById(id);
  if(id==='hub'){
    G.stage=0;G.deaths=0;G.runStartedAt=0;G.runFurthestZ=8;G.checkpoint={x:0,y:1.10,z:8};teleport(0,1.10,8);
    G.scene.background.setHex(0x07111d);G.scene.fog.color.setHex(0x07111d);G.scene.fog.near=38;G.scene.fog.far=210;
    toast(initial?'Willkommen bei Escape.kl · Welt 1 ist leicht, weitere Welten werden deutlich anspruchsvoller.':'Zurück im Escape.kl Hub.','good',2400);
  }else if(w&&!w.locked){
    G.stage=1;G.deaths=0;G.runStartedAt=performance.now();G.runFurthestZ=Number(w.start?.z)||-70;G.checkpoint=null;
    teleport(Number(w.start?.x)||0,Number(w.start?.y)||1.5,Number(w.start?.z)||-70);
    G.scene.background.setHex(Number(w.background)||0x07111d);G.scene.fog.color.setHex(Number(w.fog)||Number(w.background)||0x07111d);G.scene.fog.near=38;G.scene.fog.far=210;
    toast(`${w.name} gestartet · ${w.stageCount} Stages · gelbe WIN-Pads abholen · Fall = Neustart.`,'good',2700);
  }else if(id==='race'){
    const raceY=.4+.55/2+PLAYER_HALF+.08;
    G.stage=1;G.deaths=0;G.runStartedAt=performance.now();G.runFurthestZ=20;G.checkpoint={x:72,y:raceY,z:20};teleport(72,raceY,20);
    G.scene.background.setHex(0x1b0c08);G.scene.fog.color.setHex(0x1b0c08);
    toast('Speed Race gestartet · 5 Race-Checkpoints · Bestzeit zählt!','good',2200);
  }
  applyWorldVisibility();updateHud(true);
}
function enterWorld(id){
  const w=escapeWorldById(id);if(!w)return;
  if(w.locked)return toast(`${w.name} kommt in einem späteren Escape.kl-Update.`,'bad',2600);
  if(!G.state.worldsUnlocked.includes(id)){
    const need=Math.max(0,Number(w.requiredLifetimeWins||0)-Number(G.state.lifetimeWins||0));
    if(need>0)return toast(`🔒 ${w.name}: noch ${need.toLocaleString('de-DE')} Lifetime Wins benötigt.`,'bad',3000);
    G.state.worldsUnlocked.push(id);queuePersist(80);
  }
  setWorld(id);
}
function teleport(x,y,z){G.pos.set(x,y,z);G.vel.set(0,0,0);G.moveVel.set(0,0,0);G.grounded=false;G.lastGroundedAt=0;G.coyoteAvailable=false;G.support=null;G.lastSupport=null;G.lastGroundPos.copy(G.pos);G.trailPoints=[];if(G.playerRoot)G.playerRoot.position.copy(G.pos);}
function respawn(){
  soundFail();
  if(isEscapeWorld()){
    const w=currentWorldDef();G.deaths++;G.stage=1;G.stageClaims.clear();G.runStartedAt=performance.now();G.runFurthestZ=Number(w?.start?.z)||-70;
    teleport(Number(w?.start?.x)||0,Number(w?.start?.y)||1.5,Number(w?.start?.z)||-70);
    toast(`Run verloren · ${w?.name||'Welt'} startet wieder bei Stage 1`,'bad',1900);updateHud(true);return;
  }
  G.deaths++;const c=G.checkpoint||{x:0,y:1.08,z:8};teleport(c.x,c.y,c.z);toast(G.world==='race'?`Race-Respawn · Checkpoint ${Math.max(1,G.stage)}`:'Respawn','bad',1500);
}

function updatePlatforms(t,dt=.016){
  for(const p of G.platforms){
    if(p.scope!==G.world){p.mesh.visible=false;continue;}p.mesh.visible=true;
    p.lastPos.copy(p.mesh.position);p.mesh.position.copy(p.base);
    if(p.motion){const q=Math.sin(t*p.motion.speed+p.motion.phase)*p.motion.amp;p.mesh.position[p.motion.axis]=p.base[p.motion.axis]+q;}
    p.press=Math.max(0,(Number(p.press)||0)-dt*5.6);p.mesh.position.y-=Math.sin(Math.min(1,p.press)*Math.PI*.5)*.055;
    if(p.blink){const phase=(t*.55+(Math.abs(p.base.z)%7)*.13)%1;p.active=phase<.72;p.mesh.visible=true;p.mesh.material.forEach?.(m=>{m.transparent=true;m.opacity=p.active?1:.16;});}else p.active=true;
    p.delta.subVectors(p.mesh.position,p.lastPos);
  }
  for(const fx of G.portalFx){if((fx.userData?.escapeScope||'hub')!==G.world){fx.visible=false;continue;}fx.visible=true;fx.material.opacity=.12+Math.sin(t*2.2)*.05;fx.scale.setScalar(1+Math.sin(t*1.7)*.02);fx.rotation.z=Math.sin(t*.55)*.025;}
}
function platformUnder(x,z,fromBottom,toBottom){let best=null,bestTop=-Infinity;for(const p of G.platforms){if(p.scope!==G.world||!p.active)continue;const px=p.mesh.position.x,pz=p.mesh.position.z,top=p.mesh.position.y+p.h/2;if(Math.abs(x-px)>p.w/2+PLAYER_RADIUS*.20||Math.abs(z-pz)>p.d/2+PLAYER_RADIUS*.20)continue;if(fromBottom>=top-.24&&toBottom<=top+.34&&top>bestTop){best=p;bestTop=top}}return best?{p:best,top:bestTop}:null;}
function trainingInfo(){if(G.world!=='hub'||!G.grounded||!G.support?.training)return null;const tier=Math.max(0,Number(G.support.trainingTier)||0),unlocked=tier<=Math.max(0,Number(G.state.jkTreadmillTier)||0);return {platform:G.support,tier,unlocked,mult:Math.max(1,Number(G.support.trainingMult)||1),name:G.support.trainingName||'FREE ×1'};}
function isOnTraining(){return !!trainingInfo()?.unlocked;}
function handlePlatformContact(p){
  if(!p)return;const now=performance.now();p.press=1;
  if(now-(p.lastContactAt||0)>150){p.lastContactAt=now;if(p.label||p.kind==='key'||p.kind==='hub-key'||p.kind==='start'||p.kind==='finish')soundKey(p.label||p.kind);}
}
function processMovement(dt,t){
  if(G.paused||G.modalOpen||G.runFinished)return;
  const ix=Math.max(-1,Math.min(1,(G.keys.has('KeyD')?1:0)-(G.keys.has('KeyA')?1:0)+G.mobileX));
  const iy=Math.max(-1,Math.min(1,(G.keys.has('KeyW')?1:0)-(G.keys.has('KeyS')?1:0)-G.mobileY));
  G.sprint=G.keys.has('ShiftLeft')||G.keys.has('ShiftRight')||G.mobileSprint;
  const inputLen=Math.min(1,Math.hypot(ix,iy)),forward=G.tmpV.set(-Math.sin(G.yaw),0,-Math.cos(G.yaw)),right=G.tmpV2.set(Math.cos(G.yaw),0,-Math.sin(G.yaw));
  let targetX=0,targetZ=0;if(inputLen>.05){const nx=ix/(Math.hypot(ix,iy)||1),ny=iy/(Math.hypot(ix,iy)||1);targetX=(right.x*nx+forward.x*ny)*movementSpeed()*inputLen;targetZ=(right.z*nx+forward.z*ny)*movementSpeed()*inputLen;}
  const accel=G.grounded?(inputLen>.05?(G.sprint?12.5:10.5):14):3.1,k=1-Math.exp(-dt*accel);G.moveVel.x+=(targetX-G.moveVel.x)*k;G.moveVel.z+=(targetZ-G.moveVel.z)*k;
  if(Math.abs(G.moveVel.x)<.004)G.moveVel.x=0;if(Math.abs(G.moveVel.z)<.004)G.moveVel.z=0;
  if(G.grounded&&G.support?.motion)G.pos.add(G.support.delta);
  const prevX=G.pos.x,prevZ=G.pos.z;G.pos.x+=G.moveVel.x*dt;G.pos.z+=G.moveVel.z*dt;
  if(G.world==='hub')resolveHubColliders(prevX,prevZ);
  else if(isEscapeWorld()){
    const w=currentWorldDef(),half=Math.max(8,Number(w?.laneHalfWidth)||13.2),back=Math.max(2,Number(w?.backtrackAllowance)||4.6),startZ=Number(w?.start?.z)||-70;
    G.pos.x=Math.max(-half,Math.min(half,G.pos.x));
    G.runFurthestZ=Math.min(Number.isFinite(G.runFurthestZ)?G.runFurthestZ:G.pos.z,G.pos.z);
    G.pos.z=Math.min(startZ+6.5,G.pos.z,G.runFurthestZ+back);
  }
  const planarSpeed=Math.hypot(G.moveVel.x,G.moveVel.z);G.moveIntensity=movementSpeed()>0?Math.min(1,planarSpeed/movementSpeed()):0;
  if(planarSpeed>.08&&G.playerRoot){const wanted=Math.atan2(G.moveVel.x,G.moveVel.z),diff=Math.atan2(Math.sin(wanted-G.playerRoot.rotation.y),Math.cos(wanted-G.playerRoot.rotation.y)),turn=1-Math.exp(-dt*(G.sprint?13:10));G.playerRoot.rotation.y+=diff*turn;}

  const wasGrounded=G.grounded,prevBottom=G.pos.y-PLAYER_HALF;G.vel.y=Math.max(-22,G.vel.y-GRAVITY*dt);let nextY=G.pos.y+G.vel.y*dt;const nextBottom=nextY-PLAYER_HALF;let landed=null;if(G.vel.y<=0)landed=platformUnder(G.pos.x,G.pos.z,prevBottom,nextBottom);
  if(landed){nextY=landed.top+PLAYER_HALF;G.vel.y=0;G.grounded=true;G.support=landed.p;}else{const hold=G.grounded?platformUnder(G.pos.x,G.pos.z,prevBottom,prevBottom-.08):null;if(hold&&Math.abs(prevBottom-hold.top)<.28){nextY=hold.top+PLAYER_HALF;G.vel.y=0;G.grounded=true;G.support=hold.p;}else{G.grounded=false;G.support=null;}}
  if(G.grounded){G.lastGroundedAt=performance.now();G.coyoteAvailable=true;}if(!wasGrounded&&G.grounded)G.landingPulse=1;G.landingPulse=Math.max(0,G.landingPulse-dt*7);
  if(G.grounded&&G.support!==G.lastSupport){handlePlatformContact(G.support);G.lastSupport=G.support;}else if(!G.grounded)G.lastSupport=null;
  G.pos.y=nextY;if(G.playerRoot)G.playerRoot.position.copy(G.pos);

  if(G.grounded&&planarSpeed>.08){const dist=G.lastGroundPos.distanceTo(G.pos);if(dist<3){G.speedDistanceCarry+=dist;G.state.totalDistance+=dist;while(G.speedDistanceCarry>=1){G.speedDistanceCarry-=1;addSpeed(gainMultiplier(),true);queuePersist(1800);}}G.lastGroundPos.copy(G.pos);}else if(G.grounded)G.lastGroundPos.copy(G.pos);
  if(isOnTraining()){const tr=trainingInfo();G.trainingCarry+=dt*5*gainMultiplier()*(tr?.mult||1);if(G.trainingCarry>=1){const add=Math.floor(G.trainingCarry);G.trainingCarry-=add;addSpeed(add,true);queuePersist(1800);}}
  if(G.grounded&&planarSpeed>.35){G.footstepClock+=dt*(.55+planarSpeed*.11);if(G.footstepClock>=1){G.footstepClock=0;if(G.support&&!G.support.label)tone(118+(G.sprint?18:0),.025,'triangle',.005,-16);}}else G.footstepClock=Math.min(G.footstepClock,.72);
  if(G.pos.y<MAX_FALL){respawn();return;}detectCheckpointAndFinish();checkAutoTriggers();consumeBufferedJump();
}
function performJump(){
  if(G.paused||G.modalOpen||G.runFinished)return false;
  soundJump();G.vel.y=JUMP_VELOCITY;G.grounded=false;G.coyoteAvailable=false;G.support=null;G.lastSupport=null;G.jumpQueuedUntil=0;return true;
}
function requestJump(){
  if(G.paused||G.modalOpen||G.runFinished)return false;
  const now=performance.now();G.jumpQueuedUntil=now+230;
  // Coyote-Time: auch direkt nach dem Verlassen einer Keycap reagiert Space noch.
  if(G.grounded||(G.coyoteAvailable&&now-G.lastGroundedAt<=145))return performJump();
  return false;
}
function consumeBufferedJump(){
  if(G.paused||G.modalOpen||G.runFinished||!G.grounded)return false;
  const now=performance.now();
  if(G.jumpHeld||now<=G.jumpQueuedUntil)return performJump();
  return false;
}
function jump(){return requestJump();}
function claimStageWin(p){
  const w=currentWorldDef();if(!w||!p?.winReward||!p.winStage)return false;
  const claimKey=`${w.id}:${p.winStage}`;if(G.stageClaims.has(claimKey))return false;
  G.stageClaims.add(claimKey);const reward=awardWins(p.winReward,`${w.name} Stage ${p.winStage}`,true);
  soundCheckpoint();toast(`🏆 Stage ${p.winStage} geschafft · +${reward.toLocaleString('de-DE')} Wins`,'good',1800);
  const next=Math.min(w.stageCount,p.winStage+1);G.stage=Math.max(G.stage,next);
  awardMainXp(Math.min(8,2+Math.floor(p.winStage/3)),`Escape.kl · ${w.name} Stage ${p.winStage}`,`escape-${w.id}-stage-${p.winStage}-${Date.now()}`);
  return true;
}
function detectCheckpointAndFinish(){
  const p=G.support;if(!p)return;
  if(isEscapeWorld()){
    if(p.kind==='win-pad')claimStageWin(p);
    if(p.stage&&p.stage>G.stage)G.stage=Math.min(currentWorldDef()?.stageCount||p.stage,p.stage);
    if(p.finish&&!G.runFinished&&G.stageClaims.has(`${G.world}:${p.winStage||currentWorldDef()?.stageCount}`))finishWorld();
  }else if(G.world==='race'){
    if(p.checkpoint&&p.checkpoint>G.stage){G.stage=p.checkpoint;G.checkpoint={x:p.mesh.position.x,y:p.mesh.position.y+p.h/2+PLAYER_HALF+.10,z:p.mesh.position.z};soundCheckpoint();toast(`Race Checkpoint ${G.stage}/5`,'good',850);}
    if(p.finish&&!G.runFinished)finishRace();
  }
}
function finishRace(){
  G.runFinished=true;soundFinish();const sec=(performance.now()-G.runStartedAt)/1000,key='speed-race',previous=Number(G.state.bestTimes[key]||0),record=!previous||sec<previous;if(record)G.state.bestTimes[key]=sec;G.state.completions[key]=Math.max(0,Number(G.state.completions[key]||0))+1;const reward=record?8:5;awardWins(reward,'Speed Race');awardMainXp(record?8:5,'Escape.kl · Speed Race',`escape-race-${Date.now()}-${Math.round(sec*100)}`);showRaceComplete(sec,reward,previous,record);updateHud(true);
}
function finishWorld(){
  const w=currentWorldDef();if(!w)return;
  G.runFinished=true;soundFinish();const sec=(performance.now()-G.runStartedAt)/1000,previous=Number(G.state.bestTimes[w.id]||0);if(!previous||sec<previous)G.state.bestTimes[w.id]=sec;
  G.state.completions[w.id]=Math.max(0,Number(G.state.completions[w.id]||0))+1;
  let stars=1;if(sec<=Number(w.time2||9999))stars++;if(G.deaths===0&&sec<=Number(w.time3||9999))stars++;
  G.state.worldStars[w.id]=Math.max(Number(G.state.worldStars[w.id]||0),stars);
  const finishBonus=Math.max(0,Number(w.finishBonusWins)||0),starBonus=stars===3?Math.ceil(finishBonus*.5):stars===2?Math.ceil(finishBonus*.2):0,reward=finishBonus+starBonus;
  if(reward)awardWins(reward,`${w.name} Finish-Bonus`);
  queuePersist(80);awardMainXp(10+stars*3,`Escape.kl · ${w.name}`,`escape-${w.id}-${Date.now()}-${Math.round(sec*100)}`);
  showComplete(w,sec,stars,reward,previous);updateHud(true);
}

function updateCamera(dt){if(!G.playerRoot)return;const speed=Math.hypot(G.moveVel.x,G.moveVel.z),ratio=Math.min(1,speed/17),bob=G.grounded&&speed>.35?Math.sin(performance.now()*.012*(G.sprint?1.3:1))*Math.min(.032,speed*.002):0;const target=G.tmpV.set(G.pos.x,G.pos.y+.25+bob,G.pos.z);const horiz=G.camDistance*Math.cos(G.pitch);const desired=G.tmpV2.set(target.x+Math.sin(G.yaw)*horiz,target.y+1.52+Math.sin(G.pitch)*G.camDistance,target.z+Math.cos(G.yaw)*horiz);const k=1-Math.exp(-dt*7.5);G.camera.position.lerp(desired,k);G.camera.lookAt(target);const targetFov=63+ratio*7+(G.sprint&&speed>.5?2:0);G.camera.fov+=(targetFov-G.camera.fov)*(1-Math.exp(-dt*5.5));G.camera.updateProjectionMatrix();}
function updateTrail(dt){G.trailClock+=dt;if(G.trailClock<.038||!G.trail)return;G.trailClock=0;if(G.state.trail==='none'){G.trail.visible=false;return}G.trail.visible=true;G.trailPoints.unshift(new THREE.Vector3(G.pos.x,G.pos.y-.28,G.pos.z));if(G.trailPoints.length>48)G.trailPoints.length=48;const a=G.trail.geometry.attributes.position.array;for(let i=0;i<48;i++){const p=G.trailPoints[Math.min(i,G.trailPoints.length-1)]||G.pos;a[i*3]=p.x;a[i*3+1]=p.y;a[i*3+2]=p.z}G.trail.geometry.attributes.position.needsUpdate=true;}
function detectInteraction(){let best=null,dist=Infinity;for(const i of G.interactables){if(i.scope!==G.world)continue;const d=i.pos.distanceTo(G.pos);if(d<=i.radius&&d<dist){best=i;dist=d}}G.activeInteractable=best;const p=G.overlay?.querySelector('[data-ekl-prompt]');if(!p)return;const tr=trainingInfo();if(best){p.innerHTML=`<kbd>${matchMedia('(pointer:coarse)').matches?'AKTION':'E'}</kbd>${best.label}`;p.classList.add('show')}else if(tr){if(tr.unlocked)p.textContent=`${tr.name} · Sprint-Training im Stand · +${fmt(5*gainMultiplier()*tr.mult)} Speed/s`;else p.textContent=`🔒 ${tr.name} · im JK/Coin-Shop freischalten`;p.classList.add('show')}else p.classList.remove('show');}
function interact(){if(G.modalOpen){closeModal();return}if(G.activeInteractable?.onUse)G.activeInteractable.onUse();}
function updateHud(force=false){
  if(!G.overlay||!G.state)return;G.hudClock+=force?999:0;const set=(q,v)=>{const e=G.overlay.querySelector(q);if(e&&e.textContent!==String(v))e.textContent=String(v)};
  set('[data-ekl-speed]',fmt(G.state.speed));set('[data-ekl-wins]',fmt(G.state.wins));set('[data-ekl-rebirths]',G.state.rebirths);set('[data-ekl-gain]',`×${gainMultiplier().toFixed(2).replace('.',',')}`);
  const race=G.world==='race',hub=G.world==='hub',w=currentWorldDef(),total=race?5:(w?.stageCount||1),worldChip=G.overlay.querySelector('.ekl-world-chip'),progressWrap=G.overlay.querySelector('.ekl-stage-progress');
  if(worldChip)worldChip.hidden=hub;if(progressWrap)progressWrap.hidden=hub;
  if(!hub){
    set('[data-ekl-world]',race?'SPEED RACE':`WORLD ${w?.number||'?'} · ${w?.name||'ESCAPE'}`);
    set('[data-ekl-stage]',race?`CHECKPOINT ${Math.max(1,G.stage)}/5`:`STAGE ${Math.max(1,G.stage)}/${total}`);
    const nextReward=!race&&w?.stageRewards?.[Math.max(0,Math.min(total-1,G.stage-1))];
    set('[data-ekl-next-win]',race?'BESTZEIT-RUN':nextReward?`NÄCHSTES WIN-PAD: +${Number(nextReward).toLocaleString('de-DE')} WINS`:'FINISH');
  }
  set('[data-ekl-stage-total]',race?'5 CHECKPOINTS':`${total} STAGES`);const progress=G.overlay.querySelector('[data-ekl-stage-bar]');if(progress)progress.style.width=`${hub?0:Math.min(100,G.stage/total*100)}%`;
}

function toast(message,tone='',ms=1900){const e=G.overlay?.querySelector('[data-ekl-toast]');if(!e)return;clearTimeout(G.toastTimer);e.textContent=message;e.className=`ekl-toast show ${tone}`;G.toastTimer=setTimeout(()=>e.className='ekl-toast',ms);}

function openModal(html){closeModal();G.modalOpen=true;const wrap=document.createElement('div');wrap.className='ekl-modal-wrap';wrap.dataset.eklModal='1';wrap.innerHTML=html;G.overlay.append(wrap);wrap.addEventListener('click',e=>{if(e.target===wrap)closeModal()});wrap.querySelectorAll('[data-ekl-modal-close]').forEach(b=>b.onclick=closeModal);return wrap;}
function closeModal(){G.overlay?.querySelector('[data-ekl-modal]')?.remove();G.modalOpen=false;}
function openShop(tab='speed'){
  const wrap=openModal(`<div class="ekl-modal"><div class="ekl-modal-head"><div><small>ECHTER IN-GAME SHOP · ESCAPE HUB</small><h2>🏪 Speed Shop</h2><p>Du stehst wirklich im Shop-Gebäude. Kaufe Upgrades mit deinen erspielten Wins.</p></div><button data-ekl-modal-close>×</button></div><div class="ekl-big-stat"><div><small>SPEED</small><b>${fmt(G.state.speed)}</b></div><div><small>WINS</small><b>${fmt(G.state.wins)}</b></div><div><small>GAIN</small><b>×${gainMultiplier().toFixed(2)}</b></div><div><small>TRAIL</small><b>${TRAILS.find(t=>t.id===G.state.trail)?.name||'Keiner'}</b></div></div><div class="ekl-tabs"><button data-ekl-shop-tab="speed">Speed</button><button data-ekl-shop-tab="trails">Trails</button><button data-ekl-shop-tab="worlds">Welten</button><button data-ekl-shop-tab="jk">◆ JK/Coin</button></div><div data-ekl-shop-body></div></div>`);
  wrap.querySelectorAll('[data-ekl-shop-tab]').forEach(b=>b.onclick=()=>renderShopBody(b.dataset.eklShopTab));renderShopBody(tab);
}
function renderShopBody(tab){const body=G.overlay?.querySelector('[data-ekl-shop-body]');if(!body)return;G.overlay.querySelectorAll('[data-ekl-shop-tab]').forEach(b=>b.classList.toggle('active',b.dataset.eklShopTab===tab));if(tab==='speed'){body.innerHTML=`<div class="ekl-shop-grid">${SPEED_UPGRADES.map(u=>{const owned=G.state.speedUpgrade>=u.level,available=G.state.speedUpgrade===u.level-1;return `<article class="${owned?'owned':''}"><small>STUFE ${u.level}</small><h3>${u.name}</h3><p>Dauerhaft ×${u.mult.toFixed(2).replace('.',',')} Speed-Gewinn durch echte Laufstrecke und Training.</p><button data-ekl-buy-speed="${u.level}" ${owned||!available?'disabled':''}>${owned?'GEKAUFT':available?`${u.cost} Wins`:'Vorherige Stufe'}</button></article>`}).join('')}</div>`;body.querySelectorAll('[data-ekl-buy-speed]').forEach(b=>b.onclick=()=>buySpeedUpgrade(Number(b.dataset.eklBuySpeed)));}
  else if(tab==='trails'){body.innerHTML=`<div class="ekl-shop-grid">${TRAILS.map(t=>{const owned=G.state.ownedTrails.includes(t.id),active=G.state.trail===t.id;return `<article class="${owned?'owned':''} ${t.jk?'jk':''}"><small>${active?'AKTIV':t.jk?'JK/COIN':'TRAIL'}</small><h3>${t.name}</h3><p>Kosmetische Spur hinter deinem Charakter. Kein versteckter Laufgeschwindigkeitsbonus.</p><button data-ekl-trail="${t.id}" class="${t.jk?'jk':t.id==='gold'?'gold':''}" ${active?'disabled':''}>${active?'AKTIV':owned?'Ausrüsten':t.jk?'Im JK/Coin-Shop':`${t.cost} Wins`}</button></article>`}).join('')}</div>`;body.querySelectorAll('[data-ekl-trail]').forEach(b=>b.onclick=()=>buyOrEquipTrail(b.dataset.eklTrail));}
  else if(tab==='worlds'){body.innerHTML=`<div class="ekl-shop-grid">${WORLD_DEFS.map(w=>{const unlocked=w.number===1||G.state.worldsUnlocked.includes(w.id)||(!w.locked&&G.state.lifetimeWins>=Number(w.requiredLifetimeWins||0));const need=Math.max(0,Number(w.requiredLifetimeWins||0)-Number(G.state.lifetimeWins||0));return `<article class="${unlocked&&!w.locked?'owned':''}"><small>WELT ${w.number} · ${w.difficulty||''}</small><h3>${w.name}</h3><p>${w.description}</p><button disabled>${w.locked?'COMING SOON':unlocked?'IM HUB FREIGESCHALTET':`Noch ${need.toLocaleString('de-DE')} Lifetime Wins`}</button></article>`}).join('')}</div><div class="ekl-world-economy-note"><b>${Number(G.state.lifetimeWins||0).toLocaleString('de-DE')} Lifetime Wins</b><span>Ausgegebene Wins zählen weiterhin für Welt-Freischaltungen. Jede Stage besitzt ein eigenes gelbes WIN-Pad.</span></div>`;}
  else{
    const balance=Number(window.JKCoinApp?.coinState?.()?.balance||0),items=[
      {name:'Gold Speed-Treadmill ×3',price:250,owned:Number(G.state.jkTreadmillTier||0)>=1,desc:'Permanentes Sport-Laufband mit ×3 Trainingsrate.'},
      {name:'Diamond Speed-Treadmill ×9',price:850,owned:Number(G.state.jkTreadmillTier||0)>=2,desc:'Permanentes Premium-Laufband mit ×9 Trainingsrate.'},
      {name:'Galaxy Keyboard Trail',price:300,owned:G.state.ownedTrails.includes('galaxy'),desc:'Kosmetische Galaxy-Spur für Escape.kl.'},
      {name:'Speed-Gain ×2 · 15 Min.',price:180,owned:false,desc:'Temporärer ×2 Speed-Gain für Laufstrecke und Training.'}
    ];
    body.innerHTML=`<div class="ekl-jk-panel"><div><small>JK.GAMES · JK/COIN</small><h3>◆ Escape.kl Premium</h3><p>Alle Käufe laufen über den zentralen JK.Games-JK/Coin-Shop mit normaler Kaufbestätigung. Welten und der Kern-Parcours bleiben erspielbar.</p><b>${balance.toLocaleString('de-DE')} JK/Coin verfügbar</b></div><button class="jk" data-ekl-open-jk>JK/Coin-Shop öffnen</button></div><div class="ekl-shop-grid ekl-jk-grid">${items.map(i=>`<article class="jk ${i.owned?'owned':''}"><small>${i.owned?'DAUERHAFT FREIGESCHALTET':'JK/COIN'}</small><h3>${i.name}</h3><p>${i.desc}</p><button class="jk" data-ekl-open-jk ${i.owned?'disabled':''}>${i.owned?'GEKAUFT':`${i.price.toLocaleString('de-DE')} JK/Coin`}</button></article>`).join('')}</div>`;body.querySelectorAll('[data-ekl-open-jk]').forEach(b=>b.addEventListener('click',openJkCoinShop));
  }
}
function buySpeedUpgrade(level){const u=SPEED_UPGRADES.find(x=>x.level===level);if(!u||G.state.speedUpgrade!==level-1)return;if(G.state.wins<u.cost)return toast(`Du brauchst ${u.cost} Wins.`,'bad');G.state.wins-=u.cost;G.state.speedUpgrade=level;soundBuy();queuePersist(50);toast(`${u.name} gekauft · Speed-Gain ×${u.mult.toFixed(2)}`,'good',2200);updateHud(true);openShop('speed');}
function buyOrEquipTrail(id){const t=TRAILS.find(x=>x.id===id);if(!t)return;if(!G.state.ownedTrails.includes(id)){if(t.jk)return openJkCoinShop();if(G.state.wins<t.cost)return toast(`Du brauchst ${t.cost} Wins.`,'bad');G.state.wins-=t.cost;G.state.ownedTrails.push(id);soundBuy()}G.state.trail=id;setTrailColor();queuePersist(50);updateHud(true);toast(`${t.name} ausgerüstet.`,'good');openShop('trails');}
function openJkCoinShop(){closeModal();if(window.JKCoinApp?.openForGame?.('escape')!==true)toast('JK/Coin-Shop wird noch geladen.','bad',1800);}
function canApplyJkPurchase(kind){kind=String(kind||'');if(kind==='speedTreadmill:gold')return Number(G.state?.jkTreadmillTier||0)<1;if(kind==='speedTreadmill:diamond')return Number(G.state?.jkTreadmillTier||0)<2;if(kind==='trail:galaxy')return !G.state?.ownedTrails?.includes('galaxy');return true;}
function grantJkCoinPurchase(kind,amount=1){if(!G.state)loadProgress();kind=String(kind||'');if(kind==='speedTreadmill:gold')G.state.jkTreadmillTier=Math.max(1,Number(G.state.jkTreadmillTier)||0);else if(kind==='speedTreadmill:diamond')G.state.jkTreadmillTier=Math.max(2,Number(G.state.jkTreadmillTier)||0);else if(kind==='trail:galaxy'){if(!G.state.ownedTrails.includes('galaxy'))G.state.ownedTrails.push('galaxy');}else if(kind==='speedBoost:2'){G.state.jkSpeedBoostUntil=Date.now()+15*60*1000;}else return false;queuePersist(50);updateHud(true);toast('◆ JK/Coin-Inhalt für Escape.kl aktiviert.','good',2400);return true;}
function openRebirth(){const reqSpeed=100000*Math.pow(4,G.state.rebirths),reqWins=100+G.state.rebirths*150,hasSpeed=G.state.speed>=reqSpeed,hasWins=G.state.wins>=reqWins;const wrap=openModal(`<div class="ekl-modal ekl-rebirth-modal"><div class="ekl-modal-head"><div><small>PERMANENTE PROGRESSION</small><h2>🔄 Rebirth ${G.state.rebirths+1}</h2><p>Speed wird auf 0 gesetzt. Trails, Bestzeiten, Welten und JK/Coin-Freischaltungen bleiben erhalten.</p></div><button data-ekl-modal-close>×</button></div><div class="ekl-rebirth-requirements"><article class="${hasSpeed?'ready':''}"><small>SPEED</small><b>${fmt(G.state.speed)} / ${fmt(reqSpeed)}</b><span>${hasSpeed?'✓ Bereit':'Noch Speed sammeln'}</span></article><article class="${hasWins?'ready':''}"><small>WINS</small><b>${G.state.wins} / ${reqWins}</b><span>${hasWins?'✓ Bereit':'Noch Wins benötigt'}</span></article><article class="bonus"><small>NACH REBIRTH</small><b>+50 % Speed Gain</b><span>permanent · stapelbar</span></article></div><div class="ekl-modal-actions"><button data-ekl-rebirth-confirm class="gold" ${!hasSpeed||!hasWins?'disabled':''}>Rebirth ${G.state.rebirths+1} durchführen</button><button data-ekl-modal-close>Abbrechen</button></div></div>`);wrap.querySelector('[data-ekl-rebirth-confirm]')?.addEventListener('click',()=>{if(G.state.speed<reqSpeed||G.state.wins<reqWins)return;G.state.speed=0;G.state.wins-=reqWins;G.state.rebirths++;queuePersist(50);closeModal();updateHud(true);toast(`Rebirth ${G.state.rebirths} abgeschlossen · +50 % permanenter Speed-Gain!`,'good',3000);awardMainXp(15,'Escape.kl Rebirth',`escape-rebirth-${G.state.rebirths}`)});}
function wheelRemaining(){return Math.max(0,24*60*60*1000-(Date.now()-(Number(G.state.lastWheelAt)||0)));}
function durationShort(ms){ms=Math.max(0,ms);const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000);return h>0?`${h} Std ${m} Min`:`${Math.max(1,m)} Min`;}
function openDailyWheel(){
  const remaining=wheelRemaining(),ready=remaining<=0;const wrap=openModal(`<div class="ekl-modal"><div class="ekl-modal-head"><div><small>TÄGLICHE BELOHNUNG · ESCAPE HUB</small><h2>🎡 Daily Wheel</h2><p>Ein kostenloser Dreh alle 24 Stunden. Der Gewinn wird sofort in Escape.kl gespeichert.</p></div><button data-ekl-modal-close>×</button></div><div class="ekl-wheel-zone"><div class="ekl-wheel" data-ekl-wheel><span style="--i:0">⚡</span><span style="--i:1">🏆</span><span style="--i:2">×2</span><span style="--i:3">⚡</span><span style="--i:4">🏆</span><span style="--i:5">★</span><i>▼</i></div><div class="ekl-wheel-info"><small>${ready?'BEREIT':'NÄCHSTER DREH'}</small><b data-ekl-wheel-status>${ready?'Jetzt drehen':durationShort(remaining)}</b><p>Speed · Wins · selten ein kosmetischer Bonus</p></div></div><div class="ekl-modal-actions"><button data-ekl-spin class="gold" ${ready?'':'disabled'}>${ready?'KOSTENLOS DREHEN':'MORGEN WIEDER'}</button><button data-ekl-modal-close>Schließen</button></div></div>`);
  wrap.querySelector('[data-ekl-spin]')?.addEventListener('click',()=>spinDailyWheel(wrap));
}
function spinDailyWheel(wrap){
  if(wheelRemaining()>0)return;const button=wrap.querySelector('[data-ekl-spin]'),wheel=wrap.querySelector('[data-ekl-wheel]'),status=wrap.querySelector('[data-ekl-wheel-status]');if(button)button.disabled=true;
  const roll=Math.random();let text='';if(roll<.28){addSpeed(750,false);text='+750 Speed';}else if(roll<.50){awardWins(5,'Daily Wheel');text='+5 Wins';}else if(roll<.68){addSpeed(2000,false);text='+2.000 Speed';}else if(roll<.84){awardWins(15,'Daily Wheel');text='+15 Wins';}else if(roll<.96){awardWins(30,'Daily Wheel');text='+30 Wins';}else if(!G.state.ownedTrails.includes('cyan')){G.state.ownedTrails.push('cyan');text='Cyan Key Trail';}else{awardWins(60,'Daily Wheel');text='+60 Wins · Jackpot';}
  G.state.lastWheelAt=Date.now();queuePersist(50);soundFinish();if(wheel){wheel.style.setProperty('--spin',`${1260+Math.floor(Math.random()*360)}deg`);wheel.classList.add('spinning');}if(status)status.textContent='Dreht …';setTimeout(()=>{if(status)status.textContent=text;toast(`Daily Wheel: ${text}`,'good',2600);updateHud(true);},1150);
}
function dailyQuestRows(){
  const q=ensureDailyQuest(),distance=Math.max(0,(Number(G.state.totalDistance)||0)-(Number(q.distanceStart)||0)),completions=Math.max(0,(Number(G.state.completions?.['keyboard-lab']||0))-(Number(q.completionsStart)||0));
  return [
    {id:'distance',icon:'🏃',name:'Laufstrecke',desc:'Lege heute 300 Meter zu Fuß zurück.',progress:distance,target:300,reward:10},
    {id:'speed',icon:'⚡',name:'Speed Training',desc:'Verdiene heute 1.500 Speed durch Laufen oder Training.',progress:Number(q.speedEarned)||0,target:1500,reward:15},
    {id:'escape',icon:'🏁',name:'Daily Escape',desc:'Schließe Keyboard Lab heute einmal ab.',progress:completions,target:1,reward:25}
  ];
}
function openDailyQuests(){
  const q=ensureDailyQuest(),rows=dailyQuestRows();const wrap=openModal(`<div class="ekl-modal"><div class="ekl-modal-head"><div><small>ESCAPE.KL · TAGESAUFGABEN</small><h2>📋 Daily Quests</h2><p>Drei Aufgaben pro Tag. Fortschritt entsteht ausschließlich beim normalen Spielen.</p></div><button data-ekl-modal-close>×</button></div><div class="ekl-quest-list">${rows.map(r=>{const claimed=q.claimed.includes(r.id),done=r.progress>=r.target,pct=Math.min(100,r.progress/r.target*100);return `<article class="${done?'done':''} ${claimed?'claimed':''}"><span>${r.icon}</span><div><small>${claimed?'ABGEHOLT':done?'FERTIG':'TAGESQUEST'}</small><h3>${r.name}</h3><p>${r.desc}</p><i><b style="width:${pct}%"></b></i><em>${Math.min(r.target,Math.floor(r.progress)).toLocaleString('de-DE')} / ${r.target.toLocaleString('de-DE')}</em></div><button data-ekl-claim-quest="${r.id}" ${!done||claimed?'disabled':''}>${claimed?'✓':`+${r.reward} Wins`}</button></article>`}).join('')}</div></div>`);
  wrap.querySelectorAll('[data-ekl-claim-quest]').forEach(b=>b.onclick=()=>claimDailyQuest(b.dataset.eklClaimQuest));
}
function claimDailyQuest(id){const q=ensureDailyQuest(),row=dailyQuestRows().find(r=>r.id===id);if(!row||row.progress<row.target||q.claimed.includes(id))return;q.claimed.push(id);awardWins(row.reward,row.name);soundBuy();queuePersist(50);updateHud(true);toast(`${row.name}: +${row.reward} Wins`,'good',2000);openDailyQuests();}
function openRecords(){const raceBest=Number(G.state.bestTimes?.['speed-race']||0),races=Number(G.state.completions?.['speed-race']||0);const worlds=WORLD_DEFS.filter(w=>!w.locked).map(w=>({w,best:Number(G.state.bestTimes?.[w.id]||0),stars:Number(G.state.worldStars?.[w.id]||0),runs:Number(G.state.completions?.[w.id]||0)}));openModal(`<div class="ekl-modal"><div class="ekl-modal-head"><div><small>PERSÖNLICHE ESCAPE-REKORDE</small><h2>🏆 Records Board</h2><p>Stage-Wins, Weltabschlüsse und Bestzeiten aus deinem Escape.kl-Spielstand.</p></div><button data-ekl-modal-close>×</button></div><div class="ekl-record-grid">${worlds.map(({w,best,stars,runs})=>`<article><small>WORLD ${w.number}</small><b>${best?timeText(best):'–'}</b><span>${w.name} · ${runs} Runs · ${'★'.repeat(stars)}${'☆'.repeat(Math.max(0,3-stars))}</span></article>`).join('')}<article><small>STAGE-WINS</small><b>${Number(G.state.stageWinsCollected||0).toLocaleString('de-DE')}</b><span>über gelbe WIN-Pads gesammelt</span></article><article><small>LIFETIME WINS</small><b>${Number(G.state.lifetimeWins||0).toLocaleString('de-DE')}</b><span>zählt für Welt-Freischaltungen</span></article><article><small>RACE BEST</small><b>${raceBest?timeText(raceBest):'–'}</b><span>Speed Race · ${races} Läufe</span></article><article><small>DISTANZ</small><b>${Math.floor(G.state.totalDistance).toLocaleString('de-DE')} m</b><span>Gesamtlaufstrecke</span></article><article><small>SPEED</small><b>${fmt(G.state.speed)}</b><span>Aktueller Speed</span></article><article><small>REBIRTHS</small><b>${G.state.rebirths}</b><span>Permanente Progression</span></article></div></div>`);}

function showHelp(){openModal(`<div class="ekl-modal"><div class="ekl-modal-head"><div><small>ESCAPE.KL · STEUERUNG</small><h2>Wie spiele ich?</h2><p>Speed sammeln, gelbe WIN-Pads erreichen, Upgrades kaufen und schwierigere Welten freischalten.</p></div><button data-ekl-modal-close>×</button></div><div class="ekl-help"><article><b>🎮 PC</b><p>WASD laufen · Space springen mit Sprungpuffer · Shift sprinten · Maus ziehen = Kamera · Mausrad = Zoom · R = aktuellen Welt-Run neu starten.</p></article><article><b>🏆 Stage-Wins</b><p>Jede Stage endet in einer Safe-Zone mit gelbem WIN-Pad. Erst wenn du auf das Pad läufst, werden die Wins gebucht. Höhere Stages zahlen mehr.</p></article><article><b>🌍 Schwierigkeit</b><p>World 1 hat 15 breite, faire Anfänger-Stages. World 2 führt bewegliche Candy-Keys ein. World 3 ist deutlich schwerer mit schmaleren, beweglichen und instabilen Toxic-Keys.</p></article><article><b>⚡ Speed</b><p>Jeder echte Meter erhöht deinen Speed. Wins kaufst du im begehbaren Speed Shop für permanente Multiplikatoren.</p></article><article><b>🏃 Laufbänder</b><p>Auf einem freigeschalteten Laufband sprintet dein Charakter auf der Stelle und sammelt Training-Speed. Vorwärts bewegst du dich nur selbst.</p></article><article><b>🔓 Welten</b><p>Welten werden über Lifetime Wins dauerhaft freigeschaltet. Ausgegebene Wins nehmen dir eine bereits erreichte Freischaltung nicht wieder weg.</p></article><article><b>🔄 Rebirth</b><p>Rebirth setzt Speed zurück und erhöht den permanenten Speed-Gain. Welten, Trails, Bestzeiten und JK/Coin-Inhalte bleiben erhalten.</p></article></div></div>`);}

function showPause(){G.paused=true;openModal(`<div class="ekl-modal"><div class="ekl-modal-head"><div><small>ESCAPE.KL</small><h2>Pause</h2><p>Dein Lauf ist angehalten.</p></div><button data-ekl-resume>×</button></div><div class="ekl-modal-actions"><button data-ekl-resume class="gold">Weiter</button><button data-ekl-hub>Zum Hub</button><button data-ekl-exit>Top Games</button><button data-ekl-help>Steuerung</button></div></div>`);G.overlay.querySelectorAll('[data-ekl-resume]').forEach(b=>b.onclick=()=>{closeModal();G.paused=false});G.overlay.querySelector('[data-ekl-hub]').onclick=()=>{G.paused=false;setWorld('hub')};G.overlay.querySelector('[data-ekl-exit]').onclick=returnToTopGames;G.overlay.querySelector('[data-ekl-help]').onclick=showHelp;}
function showComplete(w,sec,stars,reward,previous){const runStageWins=(w?.stageRewards||[]).reduce((sum,value,index)=>sum+(G.stageClaims.has(`${w.id}:${index+1}`)?Number(value||0):0),0);const wrap=document.createElement('div');wrap.className='ekl-complete';wrap.dataset.eklComplete='1';wrap.innerHTML=`<div class="ekl-complete-card"><small>WORLD ${w.number} COMPLETE</small><h2>${w.name} geschafft!</h2><div class="ekl-stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div><p>Zeit <b>${timeText(sec)}</b>${previous?` · Vorher ${timeText(previous)}`:''}<br>Stage-Wins <b>+${runStageWins.toLocaleString('de-DE')}</b> · Finish-Bonus <b>+${reward.toLocaleString('de-DE')}</b></p><div class="ekl-modal-actions"><button data-ekl-again class="gold">Nochmal</button><button data-ekl-finish-hub>Zum Hub</button></div></div>`;G.overlay.append(wrap);wrap.querySelector('[data-ekl-again]').onclick=()=>{wrap.remove();setWorld(w.id)};wrap.querySelector('[data-ekl-finish-hub]').onclick=()=>{wrap.remove();setWorld('hub')};}

function showRaceComplete(sec,reward,previous,record){const wrap=document.createElement('div');wrap.className='ekl-complete';wrap.dataset.eklComplete='1';wrap.innerHTML=`<div class="ekl-complete-card"><small>SPEED RACE COMPLETE</small><h2>${record?'🏆 Neue Bestzeit!':'🏁 Rennen beendet!'}</h2><div class="ekl-stars">${record?'★★★':'★★☆'}</div><p>Zeit <b>${timeText(sec)}</b>${previous?` · Vorher ${timeText(previous)}`:''}<br>Deaths <b>${G.deaths}</b> · Belohnung <b>+${reward} Wins</b></p><div class="ekl-modal-actions"><button data-ekl-race-again class="gold">Nochmal</button><button data-ekl-race-hub>Zum Hub</button></div></div>`;G.overlay.append(wrap);wrap.querySelector('[data-ekl-race-again]').onclick=()=>{wrap.remove();setWorld('race')};wrap.querySelector('[data-ekl-race-hub]').onclick=()=>{wrap.remove();setWorld('hub')};}


function bindInput(){
  G.keyDown=e=>{ensureAudio();if(['KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft','ShiftRight','KeyE','KeyR','Escape'].includes(e.code))e.preventDefault();if(e.code==='Escape'){if(G.modalOpen){closeModal();G.paused=false}else showPause();return}if(e.code==='Space'){G.jumpHeld=true;requestJump();return}if(e.code==='KeyE'){interact();return}if(e.code==='KeyR'){respawn();return}G.keys.add(e.code)};
  G.keyUp=e=>{if(e.code==='Space'){G.jumpHeld=false;G.jumpQueuedUntil=0;return}G.keys.delete(e.code)};document.addEventListener('keydown',G.keyDown);document.addEventListener('keyup',G.keyUp);
  const canvas=G.overlay.querySelector('canvas');canvas.addEventListener('pointerdown',e=>{ensureAudio();if(e.pointerType==='touch')return;G.pointer={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture?.(e.pointerId)});G.pointerMove=e=>{if(!G.pointer||e.pointerId!==G.pointer.id)return;const dx=e.clientX-G.pointer.x,dy=e.clientY-G.pointer.y;G.pointer.x=e.clientX;G.pointer.y=e.clientY;G.yaw-=dx*.006;G.pitch=Math.max(.06,Math.min(.70,G.pitch+dy*.004))};G.pointerUp=e=>{if(G.pointer&&e.pointerId===G.pointer.id)G.pointer=null};canvas.addEventListener('pointermove',G.pointerMove);canvas.addEventListener('pointerup',G.pointerUp);canvas.addEventListener('pointercancel',G.pointerUp);canvas.addEventListener('wheel',e=>{e.preventDefault();G.camDistance=Math.max(4.6,Math.min(9.6,G.camDistance+Math.sign(e.deltaY)*.55));},{passive:false});
  const stick=G.overlay.querySelector('[data-ekl-stick]'),knob=stick?.querySelector('.ekl-stick-knob');if(stick&&knob){let sid=null;const update=e=>{ensureAudio();const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,max=r.width*.32,len=Math.hypot(dx,dy)||1,scale=Math.min(1,max/len);dx*=scale;dy*=scale;G.mobileX=dx/max;G.mobileY=dy/max;knob.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`};stick.addEventListener('pointerdown',e=>{sid=e.pointerId;stick.setPointerCapture?.(sid);update(e)});stick.addEventListener('pointermove',e=>{if(e.pointerId===sid)update(e)});const end=e=>{if(e.pointerId!==sid)return;sid=null;G.mobileX=G.mobileY=0;knob.style.transform='translate(-50%,-50%)'};stick.addEventListener('pointerup',end);stick.addEventListener('pointercancel',end)}
  const jumpBtn=G.overlay.querySelector('[data-ekl-jump]');if(jumpBtn){const jumpOn=e=>{e.preventDefault();ensureAudio();G.jumpHeld=true;requestJump()},jumpOff=e=>{e.preventDefault();G.jumpHeld=false;G.jumpQueuedUntil=0};jumpBtn.addEventListener('pointerdown',jumpOn);jumpBtn.addEventListener('pointerup',jumpOff);jumpBtn.addEventListener('pointercancel',jumpOff);jumpBtn.addEventListener('pointerleave',e=>{if(G.jumpHeld)jumpOff(e)});}G.overlay.querySelector('[data-ekl-interact]')?.addEventListener('pointerdown',e=>{e.preventDefault();ensureAudio();interact()});
  const sprint=G.overlay.querySelector('[data-ekl-sprint]');if(sprint){const on=e=>{e.preventDefault();ensureAudio();G.mobileSprint=true;sprint.classList.add('active')},off=e=>{e.preventDefault();G.mobileSprint=false;sprint.classList.remove('active')};sprint.addEventListener('pointerdown',on);sprint.addEventListener('pointerup',off);sprint.addEventListener('pointercancel',off);sprint.addEventListener('pointerleave',e=>{if(G.mobileSprint)off(e)});}
}
function resize(){if(!G.renderer||!G.camera)return;const r=G.overlay.getBoundingClientRect();G.renderer.setSize(r.width,r.height,false);G.camera.aspect=r.width/Math.max(1,r.height);G.camera.updateProjectionMatrix();}
function loop(){if(!G.overlay)return;const now=performance.now(),dt=Math.min(.034,Math.max(.001,(now-(G.lastFrameAt||now-16))/1000)),t=now/1000;G.lastFrameAt=now;updatePlatforms(t,dt);processMovement(dt,t);const planarSpeed=Math.hypot(G.moveVel.x,G.moveVel.z);G.character?.update?.({grounded:G.grounded,verticalVelocity:G.vel.y,planarSpeed,sprint:G.sprint||isOnTraining(),moving:planarSpeed>.12,treadmill:isOnTraining()},dt,t);detectInteraction();updateCamera(dt);updateTrail(dt);G.hudClock+=dt;if(G.hudClock>.12){G.hudClock=0;updateHud()}G.renderer.render(G.scene,G.camera);G.raf=requestAnimationFrame(loop);}

function open(sourceDevice=''){
  if(G.overlay)return;if(sourceDevice)G.sourceDevice=String(sourceDevice);else G.sourceDevice=window.JKGamesOwnedPhoneItem?.()||'';loadProgress();const el=document.createElement('div');el.className='escape-kl-overlay';el.innerHTML=`<div class="ekl-stage"><div class="ekl-canvas"><canvas aria-label="Escape.kl 3D Jump and Run"></canvas></div><div class="ekl-vignette"></div><div class="ekl-hud"><div class="ekl-topbar"><div class="ekl-statrow"><div class="ekl-stat"><small>SPEED</small><b data-ekl-speed>0</b></div><div class="ekl-stat"><small>WINS</small><b data-ekl-wins>0</b></div><div class="ekl-stat"><small>REBIRTH</small><b data-ekl-rebirths>0</b></div><div class="ekl-stat"><small>SPEED GAIN</small><b data-ekl-gain>×1</b></div></div><div class="ekl-top-actions"><button data-ekl-help title="Hilfe">?</button><button data-ekl-pause title="Pause">Ⅱ</button><button data-ekl-close title="Top Games">×</button></div></div><div class="ekl-world-chip" hidden><small data-ekl-world>WORLD 1 · KEYBOARD LAB</small><b data-ekl-stage>STAGE 1/15</b><span data-ekl-next-win>NÄCHSTES WIN-PAD: +1 WIN</span></div><div class="ekl-stage-progress" hidden><div><span>WORLD-FORTSCHRITT</span><b data-ekl-stage-total>15 STAGES</b></div><i><span data-ekl-stage-bar></span></i></div><div class="ekl-prompt" data-ekl-prompt></div><div class="ekl-toast" data-ekl-toast></div><div class="ekl-touch"><div class="ekl-stick" data-ekl-stick><i class="ekl-stick-knob"></i></div><div class="ekl-touch-actions"><button class="sprint" data-ekl-sprint>SPRINT</button><button class="jump" data-ekl-jump>SPRINGEN</button><button class="interact" data-ekl-interact>AKTION</button></div></div></div></div>`;document.body.append(el);document.body.classList.add('escape-kl-open');G.overlay=el;setupScene();bindInput();el.querySelector('[data-ekl-close]').onclick=returnToTopGames;el.querySelector('[data-ekl-pause]').onclick=showPause;el.querySelector('[data-ekl-help]').onclick=showHelp;G.resizeHandler=resize;window.addEventListener('resize',G.resizeHandler,{passive:true});G.lastFrameAt=performance.now();G.raf=requestAnimationFrame(loop);setTimeout(()=>window.JKCoinApp?.applyPendingGameEntitlements?.(),500);console.info(`Escape.kl ${VERSION} aktiv`);
}
function close(){if(!G.overlay)return;clearTimeout(G.persistTimer);if(G.dirty)syncProgressToMain(true);cancelAnimationFrame(G.raf);document.removeEventListener('keydown',G.keyDown);document.removeEventListener('keyup',G.keyUp);window.removeEventListener('resize',G.resizeHandler);closeModal();G.overlay.querySelector('[data-ekl-complete]')?.remove();G.renderer?.dispose();clearWorldObjects();G.character?.dispose?.();if(G.trail)G.scene?.remove(G.trail);disposeAll();try{G.audioCtx?.close?.()}catch{}G.overlay.remove();document.body.classList.remove('escape-kl-open');G.overlay=null;G.scene=null;G.camera=null;G.renderer=null;G.player=null;G.playerRoot=null;G.character=null;G.trail=null;G.audioCtx=null;G.keys.clear();G.mobileX=G.mobileY=0;G.mobileSprint=false;G.jumpHeld=false;G.jumpQueuedUntil=0;G.moveVel.set(0,0,0);G.paused=false;G.modalOpen=false;}
function returnToTopGames(){const source=G.sourceDevice||'';close();requestAnimationFrame(()=>window.JKGamesOpenTopGames?.(source));}
function getState(){loadProgress();return JSON.parse(JSON.stringify(G.state));}

window.EscapeKL={open,close,returnToTopGames,getState,grantJkCoinPurchase,canApplyJkPurchase,version:VERSION,worlds:WORLD_DEFS.map(w=>({...w}))};
