import * as THREE from 'three';
import { ESCAPE_WORLD_DEFS as WORLD_DEFS, escapeWorldById } from './escape-kl-worlds.js?v=20260814-escape-v441';
import { buildKeyboardLabWorld } from './escape-kl-world-keyboard-lab.js?v=20260814-escape-v441';
import { buildCandyKeysWorld } from './escape-kl-world-candy-keys.js?v=20260814-escape-v441';
import { buildToxicKeyboardWorld } from './escape-kl-world-toxic-keyboard.js?v=20260814-escape-v441';
import { createEscapeCharacter } from './escape-kl-character.js?v=20260814-escape-v441';

/* Escape.kl – JK.Games Top Game V441 · level-based movement, particle trails and character studio */
const VERSION = '2026-08-14-v441';
const LOCAL_KEY = 'jk-games-escape-kl-v1';
const PLAYER_HALF = 0.82;
const PLAYER_RADIUS = 0.38;
const GRAVITY = 24;
const JUMP_VELOCITY = 8.4;
const MAX_FALL = -24;
const WORLD_FAIL_Y = -3.5;
const LEVEL_SCALE = 25;
const LEVEL_POWER = 2.3;
const TREADMILL_TICKS_PER_SECOND = 48;
const RUN_POINT_DISTANCE = .75;
const BASE_MOVE_SPEED = 3.8;
const MAX_MOVEMENT_BONUS_PCT = 300;
const LEVEL_MOVEMENT_BONUS_CAP_PCT = 300;
const SPRINT_MOVEMENT_BONUS_PCT = 35;
const MAX_MOVEMENT_LEVEL = 800;
const STEP_BUTTONS = Object.freeze([
  {tier:0,name:'+1 Speed / Laufpunkt',cost:0,gain:1},
  {tier:1,name:'+2 Speed / Laufpunkt',cost:3,gain:2},
  {tier:2,name:'+3 Speed / Laufpunkt',cost:15,gain:3},
  {tier:3,name:'+25 Speed / Laufpunkt',cost:100,gain:25},
  {tier:4,name:'+50 Speed / Laufpunkt',cost:500,gain:50},
  {tier:5,name:'+100 Speed / Laufpunkt',cost:2500,gain:100},
  {tier:6,name:'+250 Speed / Laufpunkt',cost:15000,gain:250},
  {tier:7,name:'+500 Speed / Laufpunkt',cost:50000,gain:500}
]);
const TRAILS = Object.freeze([
  {id:'none',name:'Keine Spur',cost:0,color:0xffffff,mult:1,effect:'none'},
  {id:'green',name:'Green Energy',cost:500,color:0x60f077,mult:1.5,effect:'energy'},
  {id:'blue',name:'Water Trail',cost:1500,color:0x5aa7ff,mult:2,effect:'water'},
  {id:'purple',name:'Magic Trail',cost:5000,color:0xa06cff,mult:3,effect:'magic'},
  {id:'red',name:'Fire Trail',cost:25000,color:0xff5b36,mult:4,effect:'fire'},
  {id:'rainbow',name:'Rainbow Trail',cost:100000,color:0xffcf55,mult:5,effect:'rainbow'},
  {id:'galaxy',name:'Galaxy Keyboard Trail',cost:0,color:0xbd78ff,mult:10,jk:true,effect:'galaxy'}
]);
const SPECIAL_CHARACTERS = Object.freeze([
  {id:'neon-runner',name:'Neon Runner',cost:25000,baseGender:'male',color:0x43e8ff,desc:'JK.Games Spezialcharakter mit cyanfarbenem Runner-Effekt.'},
  {id:'flame-runner',name:'Flame Runner',cost:75000,baseGender:'female',color:0xff743d,desc:'Spezialcharakter mit warmem Flame-Runner-Effekt.'}
]);
const AURAS = Object.freeze([
  {id:'none',name:'Keine Aura',cost:0,color:0xffffff,mult:1},
  {id:'medal',name:'Medal Aura',cost:0,color:0xffd45e,mult:2,questRunPoints:2500},
  {id:'glow',name:'Glow Aura',cost:1000000,color:0x72e8ff,mult:1.2},
  {id:'wind',name:'Wind Aura',cost:5000000,color:0xc3f4ff,mult:1.5},
  {id:'water',name:'Water Aura',cost:10000000,color:0x55aaff,mult:2},
  {id:'fire',name:'Fire Aura',cost:25000000,color:0xff714d,mult:3}
]);
const REBIRTH_TABLE = Object.freeze([
  {level:100,mult:1.25},{level:180,mult:1.5},{level:280,mult:1.75},{level:400,mult:2},
  {level:550,mult:2.5},{level:700,mult:3},{level:850,mult:4},{level:1000,mult:5},
  {level:1200,mult:7.5},{level:1450,mult:10},{level:1750,mult:15},{level:2100,mult:25}
]);
const SPEED_ITEMS = Object.freeze([
  {id:'speed25',name:'+25 % aktueller Speed',pct:.25,baseCost:750,scale:1.55,minSpeed:100,icon:'⚡'},
  {id:'speed50',name:'+50 % aktueller Speed',pct:.50,baseCost:3000,scale:1.70,minSpeed:500,icon:'⚡⚡'},
  {id:'speed100',name:'+100 % aktueller Speed',pct:1.00,baseCost:15000,scale:1.90,minSpeed:2500,icon:'🚀'}
]);

const G = {
  overlay:null, scene:null, camera:null, renderer:null, raf:0, lastFrameAt:0,
  sourceDevice:'', state:null, dirty:false, persistTimer:0, lastLocalSave:0,
  player:null, playerRoot:null, character:null, trail:null, trailPoints:[],trailParticles:[],trailEmitCarry:0,auraGroup:null, auraRings:[],specialFxGroup:null,
  platforms:[], interactables:[], decorative:[], portalFx:[], colliders:[],
  world:'hub', stage:0, checkpoint:null, deaths:0, runStartedAt:0, runFinished:false, stageClaims:new Set(),
  pos:new THREE.Vector3(0,1.08,8), vel:new THREE.Vector3(), moveVel:new THREE.Vector3(), grounded:false, support:null,lastSupport:null,
  keys:new Set(), inputX:0, inputY:0, mobileX:0, mobileY:0, sprint:false,mobileSprint:false,moveIntensity:0,jumpHeld:false,jumpQueuedUntil:0,lastGroundedAt:0,coyoteAvailable:false,
  yaw:0, pitch:.32, camDistance:7.2, pointer:null,
  keyDown:null,keyUp:null,resizeHandler:null,orientationHandler:null,pointerMove:null,pointerUp:null,stickMove:null,stickUp:null,stickTouchMove:null,stickTouchEnd:null,
  lastGroundPos:new THREE.Vector3(), speedDistanceCarry:0, trainingCarry:0, runPopTimer:0, lastLevelShown:0,
  prompt:null, activeInteractable:null, toastTimer:0, paused:false, modalOpen:false,
  particleClock:0, movingClock:0, hudClock:0, trailClock:0,footstepClock:0,landingPulse:0,
  materials:new Map(), geometries:new Map(), textures:new Map(),buildScope:'hub',autoTriggers:[],triggerLocks:new Map(),runFurthestZ:-70,
  audioCtx:null,audioUnlocked:false,lastMotionLabel:'IDLE',
  tmpV:new THREE.Vector3(), tmpV2:new THREE.Vector3(),tmpV3:new THREE.Vector3()
};

function defaultProgress(){
  return {
    version:8,speed:0,wins:0,lifetimeWins:0,stageWinsCollected:0,runPoints:0,rebirths:0,stepButtonTier:0,
    trail:'none',ownedTrails:['none'],trailPlacement:'feet',aura:'none',ownedAuras:['none'],worldsUnlocked:['keyboard-lab'],
    characterChoice:'male',ownedSpecialCharacters:[],
    worldStars:{},bestTimes:{},completions:{},hiddenKeys:{},totalDistance:0,
    lastWheelAt:0,dailyQuest:null,jkTreadmillTier:0,jkSpeedBoostUntil:0,speedItems:{speed25:0,speed50:0,speed100:0},speedItemPurchases:{speed25:0,speed50:0,speed100:0},lastPlayedAt:Date.now()
  };
}
function normalizeProgress(raw){
  const source=raw&&typeof raw==='object'?raw:{};
  const sourceVersion=Math.max(0,Math.floor(Number(source.version)||0));
  const d={...defaultProgress(),...source};
  d.speed=Math.max(0,Number(d.speed)||0);
  d.wins=Math.max(0,Math.floor(Number(d.wins)||0));
  d.lifetimeWins=Math.max(d.wins,Math.floor(Number(d.lifetimeWins)||0));
  d.stageWinsCollected=Math.max(0,Math.floor(Number(d.stageWinsCollected)||0));
  d.runPoints=Math.max(0,Math.floor(Number(d.runPoints)||0));
  d.rebirths=Math.max(0,Math.floor(Number(d.rebirths)||0));
  const legacyTier=Math.max(0,Math.floor(Number(d.speedUpgrade)||0));
  d.stepButtonTier=Math.max(0,Math.min(STEP_BUTTONS.length-1,Math.floor(Number(d.stepButtonTier ?? legacyTier)||0)));
  delete d.speedUpgrade;
  const legacyTrailMap={cyan:'green',violet:'purple',gold:'red',electric:'blue',toxic:'green'};
  const rawTrails=Array.isArray(d.ownedTrails)?d.ownedTrails.map(id=>legacyTrailMap[id]||id):['none'];
  d.ownedTrails=[...new Set(rawTrails.filter(id=>TRAILS.some(t=>t.id===id)))];
  if(!d.ownedTrails.includes('none'))d.ownedTrails.unshift('none');
  d.trail=legacyTrailMap[d.trail]||d.trail;d.trail=d.ownedTrails.includes(d.trail)?d.trail:'none';
  d.trailPlacement=d.trailPlacement==='back'?'back':'feet';
  const mainGender=(()=>{try{return window.JKGamesGetActiveState?.()?.gender==='female'?'female':'male'}catch{return 'male'}})();
  const validCharacterIds=['male','female',...SPECIAL_CHARACTERS.map(c=>c.id)];
  d.characterChoice=(source.characterChoice&&validCharacterIds.includes(source.characterChoice))?source.characterChoice:mainGender;
  d.ownedSpecialCharacters=Array.isArray(d.ownedSpecialCharacters)?[...new Set(d.ownedSpecialCharacters.filter(id=>SPECIAL_CHARACTERS.some(c=>c.id===id)))]:[];
  if(SPECIAL_CHARACTERS.some(c=>c.id===d.characterChoice)&&!d.ownedSpecialCharacters.includes(d.characterChoice))d.characterChoice=mainGender;
  d.ownedAuras=Array.isArray(d.ownedAuras)?[...new Set(d.ownedAuras.filter(id=>AURAS.some(a=>a.id===id)))]:['none'];
  if(!d.ownedAuras.includes('none'))d.ownedAuras.unshift('none');
  d.aura=d.ownedAuras.includes(d.aura)?d.aura:'none';
  d.worldsUnlocked=Array.isArray(d.worldsUnlocked)?[...new Set(d.worldsUnlocked)]:['keyboard-lab'];
  if(!d.worldsUnlocked.includes('keyboard-lab'))d.worldsUnlocked.unshift('keyboard-lab');
  d.worldStars=d.worldStars&&typeof d.worldStars==='object'?d.worldStars:{};
  d.bestTimes=d.bestTimes&&typeof d.bestTimes==='object'?d.bestTimes:{};
  d.completions=d.completions&&typeof d.completions==='object'?d.completions:{};
  d.hiddenKeys=d.hiddenKeys&&typeof d.hiddenKeys==='object'?d.hiddenKeys:{};
  d.totalDistance=Math.max(0,Number(d.totalDistance)||0);
  if(d.runPoints<=0&&d.totalDistance>0)d.runPoints=Math.floor(d.totalDistance/RUN_POINT_DISTANCE);
  d.lastWheelAt=Math.max(0,Number(d.lastWheelAt)||0);
  d.dailyQuest=d.dailyQuest&&typeof d.dailyQuest==='object'?d.dailyQuest:null;
  d.jkTreadmillTier=Math.max(0,Math.min(2,Math.floor(Number(d.jkTreadmillTier)||0)));
  d.jkSpeedBoostUntil=Math.max(0,Number(d.jkSpeedBoostUntil)||0);
  // V440 migration: old V438/V439 level curve unlocked worlds far too early.
  // Re-evaluate those unlocks once against the new long-term curve.
  if(sourceVersion<7){
    const migratedLevel=d.speed>0?Math.floor(Math.pow(d.speed/LEVEL_SCALE,1/LEVEL_POWER)):0;
    d.worldsUnlocked=['keyboard-lab'];
    if(migratedLevel>=250)d.worldsUnlocked.push('candy-keys');
    if(migratedLevel>=800)d.worldsUnlocked.push('toxic-keyboard');
  }
  d.speedItems=d.speedItems&&typeof d.speedItems==='object'?d.speedItems:{};
  d.speedItemPurchases=d.speedItemPurchases&&typeof d.speedItemPurchases==='object'?d.speedItemPurchases:{};
  for(const item of SPEED_ITEMS){
    d.speedItems[item.id]=Math.max(0,Math.floor(Number(d.speedItems[item.id])||0));
    d.speedItemPurchases[item.id]=Math.max(0,Math.floor(Number(d.speedItemPurchases[item.id])||0));
  }
  d.version=8;
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
function speedForLevel(level){
  level=Math.max(0,Math.floor(Number(level)||0));
  if(level<=0)return 0;
  return Math.max(1,Math.round(LEVEL_SCALE*Math.pow(level,LEVEL_POWER)));
}
function currentLevel(){
  const speed=Math.max(0,Number(G.state?.speed)||0);
  if(speed<=0)return 0;
  return Math.max(0,Math.floor(Math.pow(speed/LEVEL_SCALE,1/LEVEL_POWER)));
}
function levelProgress(){
  const level=currentLevel(),from=speedForLevel(level),to=speedForLevel(level+1),speed=Math.max(0,Number(G.state?.speed)||0);
  return {level,from,to,ratio:Math.max(0,Math.min(1,(speed-from)/Math.max(1,to-from)))};
}
function nextRebirthDef(){
  const r=Math.max(0,Math.floor(Number(G.state?.rebirths)||0));
  if(r<REBIRTH_TABLE.length)return REBIRTH_TABLE[r];
  const extra=r-REBIRTH_TABLE.length+1,last=REBIRTH_TABLE[REBIRTH_TABLE.length-1];
  return {level:last.level+extra*400,mult:last.mult*(1+extra*.5)};
}
function rebirthMultiplier(){
  const r=Math.max(0,Math.floor(Number(G.state?.rebirths)||0));if(r<=0)return 1;
  if(r<=REBIRTH_TABLE.length)return REBIRTH_TABLE[r-1]?.mult||1;
  const extra=r-REBIRTH_TABLE.length,last=REBIRTH_TABLE[REBIRTH_TABLE.length-1];
  return last.mult*(1+extra*.5);
}
function stepBaseGain(){return STEP_BUTTONS[Math.max(0,Math.min(STEP_BUTTONS.length-1,Number(G.state?.stepButtonTier)||0))]?.gain||1;}
function trailMultiplier(){return TRAILS.find(t=>t.id===G.state?.trail)?.mult||1;}
function auraMultiplier(){return AURAS.find(a=>a.id===G.state?.aura)?.mult||1;}
function speedPerRunPoint(){
  const boost=Date.now()<Number(G.state?.jkSpeedBoostUntil||0)?2:1;
  return stepBaseGain()*trailMultiplier()*auraMultiplier()*rebirthMultiplier()*boost;
}
function gainMultiplier(){return speedPerRunPoint();}
function speedItemCost(item){
  const bought=Math.max(0,Math.floor(Number(G.state?.speedItemPurchases?.[item.id])||0));
  return Math.max(1,Math.round(item.baseCost*Math.pow(item.scale,bought)));
}
function buySpeedItem(id){
  const item=SPEED_ITEMS.find(x=>x.id===id);if(!item)return false;
  const cost=speedItemCost(item);if(G.state.wins<cost)return toast(`Du brauchst ${cost.toLocaleString('de-DE')} Wins.`,'bad',1700);
  G.state.wins-=cost;G.state.speedItems[item.id]=(Number(G.state.speedItems[item.id])||0)+1;
  G.state.speedItemPurchases[item.id]=(Number(G.state.speedItemPurchases[item.id])||0)+1;
  soundBuy();queuePersist(50);updateHud(true);toast(`${item.icon} ${item.name} ins Inventar gelegt.`,'good',1900);openShop('items');return true;
}
function useSpeedItem(id){
  const item=SPEED_ITEMS.find(x=>x.id===id);if(!item)return false;
  const count=Math.max(0,Math.floor(Number(G.state.speedItems?.[id])||0));if(count<=0)return toast('Dieses Speed-Item ist nicht im Inventar.','bad');
  const current=Math.max(0,Number(G.state.speed)||0);if(current<item.minSpeed)return toast(`Erst ab ${fmt(item.minSpeed)} Speed sinnvoll nutzbar.`,'bad',1800);
  const add=Math.max(1,Math.floor(current*item.pct));G.state.speedItems[id]=count-1;addSpeed(add,true);queuePersist(50);updateHud(true);
  toast(`${item.icon} +${Math.round(item.pct*100)} % = +${fmt(add)} Speed`,'good',2200);openShop('items');return true;
}
function updateWorldUnlocks(){
  if(!G.state)return [];
  const unlocked=[],level=currentLevel();
  for(const w of WORLD_DEFS){
    if(w.locked||w.number===1)continue;
    if(G.state.worldsUnlocked.includes(w.id))continue;
    if(level>=Number(w.requiredLevel||0)){G.state.worldsUnlocked.push(w.id);unlocked.push(w);}
  }
  return unlocked;
}
function awardWins(amount,source='Wins',stageWin=false){
  amount=Math.max(0,Math.floor(Number(amount)||0));if(!amount)return 0;
  G.state.wins+=amount;G.state.lifetimeWins+=amount;if(stageWin)G.state.stageWinsCollected+=amount;
  queuePersist(80);updateHud(true);
  return amount;
}
function fmt(n){n=Number(n)||0;if(n<1000)return Math.floor(n).toLocaleString('de-DE');if(n<1e6)return `${(n/1e3).toFixed(n<1e4?1:0).replace('.',',')} Tsd`;if(n<1e9)return `${(n/1e6).toFixed(n<1e7?1:0).replace('.',',')} Mio`;if(n<1e12)return `${(n/1e9).toFixed(n<1e10?1:0).replace('.',',')} Mrd`;return n.toExponential(2).replace('.',',');}
function timeText(sec){sec=Math.max(0,Number(sec)||0);const m=Math.floor(sec/60),s=sec-m*60;return `${m}:${s.toFixed(2).padStart(5,'0')}`;}
function dayKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function ensureDailyQuest(){if(!G.state)return null;const key=dayKey();if(!G.state.dailyQuest||G.state.dailyQuest.day!==key){G.state.dailyQuest={day:key,runPointsStart:Number(G.state.runPoints)||0,completionsStart:Number(G.state.completions?.['keyboard-lab']||0),speedEarned:0,claimed:[]};queuePersist(1200);}if(!Array.isArray(G.state.dailyQuest.claimed))G.state.dailyQuest.claimed=[];if(!Number.isFinite(Number(G.state.dailyQuest.runPointsStart)))G.state.dailyQuest.runPointsStart=Number(G.state.runPoints)||0;G.state.dailyQuest.speedEarned=Math.max(0,Number(G.state.dailyQuest.speedEarned)||0);return G.state.dailyQuest;}
function flashRunPoints(points,speedGain){
  const e=G.overlay?.querySelector('[data-ekl-run-pop]');if(!e)return;
  clearTimeout(G.runPopTimer);e.textContent=`+${points.toLocaleString('de-DE')} LAUFPUNKT${points===1?'':'E'} · +${fmt(speedGain)} SPEED`;e.classList.add('show');
  G.runPopTimer=setTimeout(()=>e.classList.remove('show'),650);
}
function onLevelChanged(before,after){
  if(after<=before)return;
  const unlocks=updateWorldUnlocks(),nextRb=nextRebirthDef();
  soundCheckpoint();
  const msg=after>=Number(nextRb?.level||Infinity)&&before<Number(nextRb?.level||Infinity)
    ?`⬆ LEVEL ${after} · REBIRTH ${G.state.rebirths+1} FREIGESCHALTET!`
    :`⬆ LEVEL ${after}`;
  toast(msg,'good',1900);
  for(const w of unlocks)setTimeout(()=>toast(`🌍 LEVEL ${after}: Welt ${w.number} freigeschaltet · ${w.name}!`,'good',3200),450);
}
function addSpeed(amount,countDaily=true){amount=Math.max(0,Number(amount)||0);if(!amount)return 0;const before=currentLevel();G.state.speed+=amount;if(countDaily){const q=ensureDailyQuest();if(q)q.speedEarned+=amount;}const after=currentLevel();onLevelChanged(before,after);return amount;}
function awardRunPoints(points){
  points=Math.max(0,Math.floor(Number(points)||0));if(!points)return 0;
  const speedGain=points*speedPerRunPoint();G.state.runPoints+=points;addSpeed(speedGain,true);flashRunPoints(points,speedGain);return speedGain;
}
function levelMovementBonusPercent(){
  const level=currentLevel();
  return Math.min(LEVEL_MOVEMENT_BONUS_CAP_PCT,Math.max(0,level/MAX_MOVEMENT_LEVEL*LEVEL_MOVEMENT_BONUS_CAP_PCT));
}
function movementBonusPercent(){
  return Math.min(MAX_MOVEMENT_BONUS_PCT,levelMovementBonusPercent()+(G.sprint?SPRINT_MOVEMENT_BONUS_PCT:0));
}
function movementSpeed(){return BASE_MOVE_SPEED*(1+movementBonusPercent()/100);}


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
  G.pos.x=Math.max(-46.65,Math.min(46.65,G.pos.x));G.pos.z=Math.max(-46.65,Math.min(46.65,G.pos.z));
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
  G.buildScope='hub';createPlayer();resize();try{G.renderer.compileAsync?.(G.scene,G.camera)?.catch?.(()=>{});}catch{}setWorld('hub',true);updateHud(true);
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
  addPlatform({x:0,y:0,z:0,w:96,h:.5,d:96,color:0x0f2034,kind:'hub',hub:true});
  addPlatform({x:0,y:.28,z:-6,w:15,h:.08,d:76,color:0x18334d,kind:'hub-lane',hub:true});
  addPlatform({x:0,y:.29,z:18,w:78,h:.08,d:13,color:0x162e46,kind:'hub-lane',hub:true});
  addPlatform({x:-30,y:.30,z:2,w:26,h:.10,d:29,color:0x123c3d,kind:'hub-zone',hub:true});
  addPlatform({x:30,y:.30,z:2,w:26,h:.10,d:29,color:0x3a2f16,kind:'hub-zone',hub:true});
  addPlatform({x:-30,y:.30,z:31,w:26,h:.10,d:20,color:0x332445,kind:'hub-zone',hub:true});
  addPlatform({x:30,y:.30,z:31,w:26,h:.10,d:20,color:0x27354a,kind:'hub-zone',hub:true});
  addSign('TRAINING',new THREE.Vector3(-30,4.2,-10.8),0x59f0df,.78);
  addSign('SPEED UPGRADES',new THREE.Vector3(30,4.2,-10.8),0xffd260,.78);
  addSign('DAILY · REBIRTH',new THREE.Vector3(-30,4.2,21.7),0xd49cff,.70);
  addSign('SHOP · RACE · RECORDS',new THREE.Vector3(30,4.2,21.7),0x74dfff,.65);
  for(const z of[-47.35,47.35]){boxDeco(0,1.05,z,95.2,1.45,.32,0x16475c,0x0b3141);boxDeco(0,2.0,z,95.2,.10,.42,0x55dbf0,0x164e61);}
  for(const x of[-47.35,47.35]){boxDeco(x,1.05,0,.32,1.45,95.2,0x16475c,0x0b3141);boxDeco(x,2.0,0,.42,.10,95.2,0x55dbf0,0x164e61);}

  const addWorldPortal=(id,x,z,color)=>{
    const w=escapeWorldById(id);if(!w)return;
    addPlatform({x,y:.31,z,w:11.5,h:.30,d:8.6,color:new THREE.Color(color).multiplyScalar(.45).getHex(),label:`W${w.number}`,kind:'world-gate',hub:true});
    boxDeco(x-4.6,2.35,z-3.2,.48,4.7,.65,color,color);boxDeco(x+4.6,2.35,z-3.2,.48,4.7,.65,color,color);boxDeco(x,4.65,z-3.2,9.7,.42,.65,color,color);
    addRingDeco(x,2.75,z-2.92,2.35,.09,color,0);addGlowLight(x,2.9,z-2.2,color,1.0,11);
    addSign(`WORLD ${w.number} · ${w.name.toUpperCase()}`,new THREE.Vector3(x,5.65,z-2.75),color,.68);
    addSign(w.number===1?'DURCHLAUFEN = START':`LEVEL ${Number(w.requiredLevel||0)}+`,new THREE.Vector3(x,4.35,z-2.72),0xffd36a,.38);
    addAutoTrigger(`${id}-walkthrough`,x,z-3.0,8.8,2.5,()=>{soundKey('ENTER');enterWorld(id)});
  };
  addSign('WORLD AVENUE',new THREE.Vector3(0,6.1,-40.0),0xffffff,.82);
  addWorldPortal('keyboard-lab',-19,-36,0x58ddff);addWorldPortal('candy-keys',0,-36,0xff77bb);addWorldPortal('toxic-keyboard',19,-36,0x75ff72);
  addPlatform({x:36,y:.31,z:-36,w:10,h:.30,d:8.6,color:0x252a5b,label:'LOCK',kind:'locked',hub:true});
  addSign('WORLD 4 · CYBER CITY',new THREE.Vector3(36,4.2,-38.7),0x858bff,.56);addSign('COMING SOON',new THREE.Vector3(36,3.1,-38.68),0xffd36a,.34);

  const treadmillDefs=[
    {name:'FREE ×1',mult:1,tier:0,color:0x19544f,x:-38},{name:'GOLD ×3',mult:3,tier:1,color:0x82621f,x:-32.5},
    {name:'DIAMOND ×9',mult:9,tier:2,color:0x296b88,x:-27}
  ];
  for(const def of treadmillDefs){
    const tr=addPlatform({x:def.x,y:.36,z:1.5,w:3.5,h:.22,d:6.8,color:def.color,label:'',kind:'training',hub:true});tr.training=true;tr.trainingMult=def.mult;tr.trainingTier=def.tier;tr.trainingName=def.name;
    boxDeco(def.x,.50,1.5,3.0,.08,6.0,0x10161d);for(let sl=-2.35;sl<=2.35;sl+=.78)boxDeco(def.x,.555,1.5+sl,2.78,.025,.05,0x4a5966);
    boxDeco(def.x-1.57,.76,1.5,.14,.38,6.45,0x263745);boxDeco(def.x+1.57,.76,1.5,.14,.38,6.45,0x263745);
    for(const sx of[-1.18,1.18])boxDeco(def.x+sx,1.65,4.34,.14,2.1,.16,0x334a59);
    boxDeco(def.x,2.52,4.34,2.6,.15,.18,0x3d5667);boxDeco(def.x,2.18,4.16,1.55,.62,.34,0x101b25,0x0c2c3a);
    boxDeco(def.x,2.19,3.96,1.05,.30,.06,def.color,def.color);addSign(def.name,new THREE.Vector3(def.x,3.45,4.48),def.color,.45);
  }
  addSign(`LAUFBAND = SCHNELLER ALS LAUFEN`,new THREE.Vector3(-30,3.4,-5.5),0x9af7ea,.40);

  const buttonColors=[0x40603c,0x2f5b6c,0x5a4a7d,0x755928,0x7d363a,0x70417f,0x9a6930];
  STEP_BUTTONS.slice(1).forEach((def,index)=>{
    const row=index<4?0:1,col=row===0?index:index-4,x=20.2+col*6.3,z=row===0?-1.0:7.0;
    addPlatform({x,y:.37,z,w:5.1,h:.20,d:4.8,color:buttonColors[index],label:`+${def.gain}`,kind:'step-button',hub:true});
    addSign(`${def.cost.toLocaleString('de-DE')} WINS`,new THREE.Vector3(x,1.55,z+2.55),0xffd260,.31);addAutoTrigger(`step-button-${def.tier}`,x,z,4.8,4.5,()=>buyStepButton(def.tier,true));
  });
  addSign('DRAUFLAUFEN = KAUFEN',new THREE.Vector3(30,3.15,-6.5),0xffdd78,.42);

  addPlatform({x:-36,y:.40,z:30,w:13,h:.45,d:12,color:0x4c2968,label:'',kind:'altar',hub:true});
  boxDeco(-36,2.65,35.3,12.2,4.6,.36,0x21152f);addCollider(-36,35.3,12.2,.36);
  addSign('REBIRTH',new THREE.Vector3(-36,4.05,35.08),0xc694ff,.92);addSign('LEVEL → PERMANENTER BONUS',new THREE.Vector3(-36,2.82,35.06),0x69dcff,.42);
  addCylinderDeco(-36,1.15,30,1.3,1.6,1.45,0x6c3a91,0x32195e,18);addCylinderDeco(-36,2.65,30,.46,.62,2.4,0x9f68ff,0x452073,16);
  addRingDeco(-36,3.22,30,1.65,.075,0xbb78ff,Math.PI/2);addGlowLight(-36,3.1,30,0xb76cff,1.35,11);addInteractable('rebirth','Rebirth öffnen',-36,1.0,27.5,5.4,()=>openRebirth());

  addPlatform({x:-22,y:.34,z:31,w:11,h:.30,d:10,color:0x4e356e,label:'DAILY',kind:'wheel-floor',hub:true});
  boxDeco(-22,1.35,35.2,9.5,2.2,.36,0x171d2b);addCollider(-22,35.2,9.5,.36);addRingDeco(-22,2.55,34.8,2.05,.17,0xf0b85b,0);addRingDeco(-22,2.55,34.7,1.25,.08,0x69e4ff,0);
  addSign('DAILY WHEEL',new THREE.Vector3(-22,5.0,35.0),0xffc65a,.68);addInteractable('daily-wheel','Daily Wheel drehen',-22,1.0,31.0,5.1,()=>openDailyWheel());
  addPlatform({x:-8,y:.34,z:31,w:11,h:.30,d:10,color:0x254967,label:'QUEST',kind:'quest-floor',hub:true});
  boxDeco(-8,1.95,35.2,9.6,3.2,.32,0x0b1826);addCollider(-8,35.2,9.6,.32);addSign('DAILY QUESTS',new THREE.Vector3(-8,4.0,35.05),0x66e3ff,.66);addInteractable('daily-quests','Tagesquests ansehen',-8,1.0,31.0,5.1,()=>openDailyQuests());

  addPlatform({x:18,y:.32,z:30,w:15,h:.28,d:13,color:0x1d354a,label:'SHOP',kind:'shop-floor',hub:true});
  boxDeco(18,2.75,35.75,15,5.0,.35,0x17324a);boxDeco(10.7,2.75,30,.35,5.0,11.4,0x17324a);boxDeco(25.3,2.75,30,.35,5.0,11.4,0x17324a);
  addCollider(18,35.75,15,.35);addCollider(10.7,30,.35,11.4);addCollider(25.3,30,.35,11.4);addCollider(18,32.3,9,.85);boxDeco(18,1.25,32.3,9,1.35,.85,0x263c4d);
  addSign('SPEED & ITEM SHOP',new THREE.Vector3(18,5.2,35.55),0xf6c85b,.78);addGlowLight(18,3.5,30,0xffd36a,1.15,11);addInteractable('shop','Speed & Item Shop öffnen',18,1.05,30.3,5.2,()=>openShop());

  addPlatform({x:4,y:.34,z:31,w:10,h:.30,d:10,color:0x274257,label:'CHAR',kind:'character-floor',hub:true});
  boxDeco(4,1.8,35.2,9.4,2.9,.30,0x0d1d2a);addCollider(4,35.2,9.4,.30);
  addSign('CHARAKTER STUDIO',new THREE.Vector3(4,4.0,35.0),0x80dcff,.62);
  const charPads=[{x:1.0,label:'MANN',choice:'male',color:0x356a88},{x:4.0,label:'FRAU',choice:'female',color:0x73578f},{x:7.0,label:'SPECIAL',choice:'special',color:0x765b2b}];
  for(const cp of charPads){addPlatform({x:cp.x,y:.58,z:30.6,w:2.35,h:.16,d:3.1,color:cp.color,label:cp.label,kind:'character-pad',hub:true});addAutoTrigger(`character-${cp.choice}`,cp.x,30.6,2.1,2.8,()=>cp.choice==='special'?openCharacterStudio('special'):setCharacterChoice(cp.choice));}
  addSign('DRAUFLAUFEN = WÄHLEN',new THREE.Vector3(4,2.55,34.92),0xffd36a,.33);

  boxDeco(35,2.05,28,15,3.7,.28,0x0b1725);addCollider(35,28,15,.28);addSign('ESCAPE RECORDS',new THREE.Vector3(35,3.1,27.82),0xffcb5a,.78);addInteractable('records','Escape-Statistiken ansehen',35,1.0,25.6,5.4,()=>openRecords());
  addPlatform({x:35,y:.34,z:39,w:13,h:.30,d:10,color:0x7a3d2b,label:'RACE',kind:'race-gate',hub:true});boxDeco(35,1.75,43.5,12.4,3.0,.35,0x271711);addCollider(35,43.5,12.4,.35);addSign('SPEED RACE',new THREE.Vector3(35,3.25,43.7),0xff8b5d,.78);addInteractable('speed-race','Speed Race starten',35,1.0,39.0,5.5,()=>setWorld('race'));
}
function buildRaceCourse(){
  const x0=72,z0=20;addPlatform({x:x0,y:.4,z:z0,w:12,h:.55,d:8,color:0x783c2b,label:'START',checkpoint:1,kind:'race-start'});addSign('ESCAPE SPEED RACE',new THREE.Vector3(x0,4.2,z0+3.8),0xff895c,.92);addGlowLight(x0,2.5,z0+2.0,0xff7552,1.1,12);
  let z=z0-7;const names=['W','A','S','D','SHIFT','SPACE','1','2','3','GO','FAST','ESC','RUN','KEY','WIN','RACE'];for(let i=0;i<16;i++){z-=4.25;const cp=i===3?2:i===7?3:i===11?4:i===15?5:0;const motion=i===5||i===10?{axis:'x',amp:2.7,speed:.85,phase:i*.5}:null;addPlatform({x:x0+Math.sin(i*.9)*3.2,y:.65+(i%4===3?.35:0),z,w:i%5===4?5.4:2.8,h:.48,d:2.8,color:cp?0xb35538:0x7b4939,label:names[i],checkpoint:cp,kind:'race-key',motion});if(cp)addGlowLight(x0,2.1,z,0xff815c,.52,8);}
  z-=6.5;addPlatform({x:x0,y:1.05,z,w:12,h:.6,d:7,color:0xd27a38,label:'FINISH',finish:true,checkpoint:5,kind:'race-finish'});boxDeco(x0,4.5,z-2.8,12,.35,.55,0xffa24e,0x8b3e18);addSign('RACE FINISH',new THREE.Vector3(x0,5.1,z+3.45),0xffb35d,.92);addGlowLight(x0,3.2,z,0xff9a50,1.25,12);addInteractable('race-hub-return','Nach dem Rennen zum Hub',x0,1.8,z-2,5,()=>setWorld('hub'));
}
function activeCharacterDef(choice=G.state?.characterChoice){return SPECIAL_CHARACTERS.find(c=>c.id===choice)||null;}
function characterBaseGender(choice=G.state?.characterChoice){const special=activeCharacterDef(choice);if(special)return special.baseGender;return choice==='female'?'female':'male';}
function clearCharacterOnly(){
  try{G.character?.dispose?.()}catch{}G.character=null;G.player=null;G.playerRoot=null;G.auraGroup=null;G.auraRings=[];G.specialFxGroup=null;
}
function attachCharacterEffects(){
  if(!G.playerRoot)return;
  G.auraGroup=new THREE.Group();G.auraRings=[];
  for(const [i,r] of [0.58,0.83,1.05].entries()){
    const material=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.0,depthWrite:false,blending:THREE.AdditiveBlending});G.materials.set(`aura-${Date.now()}-${i}`,material);
    const ring=new THREE.Mesh(geo(`aura-ring-${r}-${i}`,()=>new THREE.TorusGeometry(r,.024+i*.006,7,30)),material);
    ring.rotation.x=Math.PI/2;ring.position.y=-PLAYER_HALF+.08+i*.16;G.auraGroup.add(ring);G.auraRings.push(ring);
  }
  G.playerRoot.add(G.auraGroup);
  const special=activeCharacterDef();
  if(special){
    G.specialFxGroup=new THREE.Group();
    const smat=new THREE.MeshBasicMaterial({color:special.color,transparent:true,opacity:.62,depthWrite:false,blending:THREE.AdditiveBlending});G.materials.set(`special-fx-${special.id}-${Date.now()}`,smat);
    for(const [i,r] of [0.36,.49,.61].entries()){const ring=new THREE.Mesh(geo(`special-ring-${r}-${i}`,()=>new THREE.TorusGeometry(r,.018,6,24)),smat.clone());G.materials.set(`special-ring-mat-${special.id}-${i}-${Date.now()}`,ring.material);ring.position.set(0,.15+i*.32,.14);ring.rotation.x=Math.PI/2;G.specialFxGroup.add(ring);}
    G.playerRoot.add(G.specialFxGroup);
  }
  setAuraStyle();
}
function mountCharacter(choice=G.state?.characterChoice,{toastReady=false}={}){
  if(!G.scene)return;clearCharacterOnly();
  const gender=characterBaseGender(choice);G.state.characterChoice=choice;
  G.character=createEscapeCharacter({gender,floorOffset:PLAYER_HALF,onReady:()=>{if(toastReady){const label=activeCharacterDef(choice)?.name||(gender==='female'?'Weiblicher Charakter':'Männlicher Charakter');toast(`${label} geladen`,'good',1500)}}});
  G.playerRoot=G.character.root;G.player=G.playerRoot;G.scene.add(G.playerRoot);G.playerRoot.position.copy(G.pos);attachCharacterEffects();
}
function setCharacterChoice(choice){
  if(!G.state)return false;
  if(choice==='special')return openCharacterStudio('special');
  if(!['male','female'].includes(choice)&&!G.state.ownedSpecialCharacters.includes(choice))return false;
  if(G.state.characterChoice===choice)return toast(`${choice==='female'?'Frau':choice==='male'?'Mann':activeCharacterDef(choice)?.name||'Charakter'} ist bereits aktiv.`,'good',1100);
  G.state.characterChoice=choice;queuePersist(50);mountCharacter(choice,{toastReady:true});updateHud(true);soundBuy();toast(`${choice==='female'?'Frau':choice==='male'?'Mann':activeCharacterDef(choice)?.name||'Spezialcharakter'} ausgewählt.`,'good',1800);return true;
}
function buySpecialCharacter(id){
  const def=SPECIAL_CHARACTERS.find(c=>c.id===id);if(!def)return false;
  if(G.state.ownedSpecialCharacters.includes(id))return setCharacterChoice(id);
  if(G.state.wins<def.cost)return toast(`Du brauchst ${def.cost.toLocaleString('de-DE')} Wins.`,'bad',1700);
  G.state.wins-=def.cost;G.state.ownedSpecialCharacters.push(id);queuePersist(50);soundBuy();setCharacterChoice(id);openCharacterStudio('special');return true;
}
function openCharacterStudio(tab='base'){
  const active=G.state.characterChoice,specialActive=activeCharacterDef(active);
  const wrap=openModal(`<div class="ekl-modal ekl-character-modal"><div class="ekl-modal-head"><div><small>ESCAPE HUB · CHARAKTER STUDIO</small><h2>🧍 Charakter wählen</h2><p>Mann und Frau sind jederzeit kostenlos wechselbar. Spezialcharaktere kommen aus dem Escape-Shop oder können später als eigene GLB-Dateien ergänzt werden.</p></div><button data-ekl-modal-close>×</button></div><div class="ekl-character-choice"><button data-ekl-character="male" class="${active==='male'?'active':''}"><b>♂ Mann</b><span>JK.Games Hauptskin + Mann-Animationen</span></button><button data-ekl-character="female" class="${active==='female'?'active':''}"><b>♀ Frau</b><span>JK.Games Hauptskin + Frau-Animationen</span></button></div><div class="ekl-character-special-head"><b>✨ Spezialcharaktere</b><span>${specialActive?`Aktiv: ${specialActive.name}`:'Kein Spezialcharakter aktiv'}</span></div><div class="ekl-shop-grid">${SPECIAL_CHARACTERS.map(c=>{const owned=G.state.ownedSpecialCharacters.includes(c.id),isActive=active===c.id;return `<article class="${owned?'owned':''}"><small>SPEZIALCHARAKTER</small><h3>${c.name}</h3><p>${c.desc}<br>Später kann dieser Slot auch durch eine von dir gelieferte GLB-Datei ersetzt werden.</p><button data-ekl-special="${c.id}" ${isActive?'disabled':''}>${isActive?'AKTIV':owned?'Ausrüsten':`${c.cost.toLocaleString('de-DE')} Wins`}</button></article>`}).join('')}</div><div class="ekl-character-trail-position"><b>Spur-Position</b><button data-ekl-trail-pos="feet" class="${G.state.trailPlacement==='feet'?'active':''}">👟 Fußspur</button><button data-ekl-trail-pos="back" class="${G.state.trailPlacement==='back'?'active':''}">🎒 Rückenspur</button></div></div>`);
  wrap.querySelectorAll('[data-ekl-character]').forEach(b=>b.onclick=()=>{setCharacterChoice(b.dataset.eklCharacter);openCharacterStudio('base')});
  wrap.querySelectorAll('[data-ekl-special]').forEach(b=>b.onclick=()=>buySpecialCharacter(b.dataset.eklSpecial));
  wrap.querySelectorAll('[data-ekl-trail-pos]').forEach(b=>b.onclick=()=>{setTrailPlacement(b.dataset.eklTrailPos);openCharacterStudio(tab)});
}
function createTrailPool(){
  G.trail=new THREE.Group();G.trail.name='escape-particle-trail';G.scene.add(G.trail);G.trailParticles=[];const particleGeo=geo('trail-particle',()=>new THREE.SphereGeometry(.09,7,5));
  for(let i=0;i<52;i++){const material=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});G.materials.set(`trail-particle-${i}`,material);const mesh=new THREE.Mesh(particleGeo,material);mesh.visible=false;G.trail.add(mesh);G.trailParticles.push({mesh,age:9,life:1,vel:new THREE.Vector3(),seed:Math.random()});}
}
function createPlayer(){mountCharacter(G.state.characterChoice);createTrailPool();}
function trailDef(){return TRAILS.find(x=>x.id===G.state?.trail)||TRAILS[0];}
function setTrailColor(){const t=trailDef();for(const p of G.trailParticles||[])p.mesh.material.color.setHex(t.color);}
function setTrailPlacement(place){G.state.trailPlacement=place==='back'?'back':'feet';queuePersist(50);toast(G.state.trailPlacement==='back'?'🎒 Rückenspur aktiviert.':'👟 Fußspur aktiviert.','good',1400);}
function setAuraStyle(){const a=AURAS.find(x=>x.id===G.state?.aura)||AURAS[0];for(const ring of G.auraRings){ring.material.color.setHex(a.color);ring.material.opacity=a.id==='none'?0:.36;ring.visible=a.id!=='none';}}
function updateAura(t){if(G.specialFxGroup){G.specialFxGroup.rotation.y=t*.7;G.specialFxGroup.children.forEach((r,i)=>{r.rotation.z=t*(i%2?-.9:.75)+i*.6;});}if(!G.auraGroup||G.state?.aura==='none')return;G.auraGroup.rotation.y=t*.55;G.auraRings.forEach((r,i)=>{r.rotation.z=t*(i%2?-.8:.65)+i*.8;const pulse=1+Math.sin(t*2+i)*.05;r.scale.setScalar(pulse);r.material.opacity=.25+i*.07+Math.sin(t*2.3+i)*.04;});}

function setWorld(id,initial=false){
  G.world=id;G.runFinished=false;G.activeInteractable=null;closeModal();G.yaw=0;G.jumpQueuedUntil=0;G.jumpHeld=false;G.stageClaims.clear();
  const w=escapeWorldById(id);
  if(id==='hub'){
    G.stage=0;G.deaths=0;G.runStartedAt=0;G.runFurthestZ=30;G.checkpoint={x:0,y:1.10,z:30};teleport(0,1.10,30);
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
    const need=Math.max(0,Number(w.requiredLevel||0)-currentLevel());
    if(need>0)return toast(`🔒 ${w.name}: noch ${need} Level benötigt · Ziel Level ${Number(w.requiredLevel||0)}.`,'bad',3000);
    G.state.worldsUnlocked.push(id);queuePersist(80);
  }
  setWorld(id);
}
function teleport(x,y,z){G.pos.set(x,y,z);G.vel.set(0,0,0);G.moveVel.set(0,0,0);G.grounded=false;G.lastGroundedAt=0;G.coyoteAvailable=false;G.support=null;G.lastSupport=null;G.lastGroundPos.copy(G.pos);G.trailPoints=[];G.trailEmitCarry=0;for(const tp of G.trailParticles||[]){tp.age=tp.life;tp.mesh.visible=false;}if(G.playerRoot)G.playerRoot.position.copy(G.pos);}
function respawn(){
  soundFail();
  if(isEscapeWorld()){
    const w=currentWorldDef();G.deaths++;G.stage=1;G.stageClaims.clear();G.runStartedAt=performance.now();G.runFurthestZ=Number(w?.start?.z)||-70;
    teleport(Number(w?.start?.x)||0,Number(w?.start?.y)||1.5,Number(w?.start?.z)||-70);
    toast(`Run verloren · ${w?.name||'Welt'} startet wieder bei Stage 1`,'bad',1900);updateHud(true);return;
  }
  G.deaths++;const c=G.checkpoint||{x:0,y:1.08,z:30};teleport(c.x,c.y,c.z);toast(G.world==='race'?`Race-Respawn · Checkpoint ${Math.max(1,G.stage)}`:'Respawn','bad',1500);
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
function trainingInfo(){if(G.world!=='hub'||!G.grounded||!G.support?.training)return null;const tier=Math.max(0,Number(G.support.trainingTier)||0),unlocked=tier===0||tier<=Math.max(0,Number(G.state.jkTreadmillTier)||0);return {platform:G.support,tier,unlocked,mult:Math.max(1,Number(G.support.trainingMult)||1),name:G.support.trainingName||'FREE ×1'};}
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

  if(G.grounded&&planarSpeed>.08){
    const dist=G.lastGroundPos.distanceTo(G.pos);
    if(dist<3){
      G.speedDistanceCarry+=dist;G.state.totalDistance+=dist;
      const runPoints=Math.floor(G.speedDistanceCarry/RUN_POINT_DISTANCE);
      if(runPoints>0){G.speedDistanceCarry-=runPoints*RUN_POINT_DISTANCE;awardRunPoints(runPoints);queuePersist(1800);}
    }
    G.lastGroundPos.copy(G.pos);
  }else if(G.grounded)G.lastGroundPos.copy(G.pos);
  if(isOnTraining()){
    const tr=trainingInfo();G.trainingCarry+=dt*TREADMILL_TICKS_PER_SECOND*speedPerRunPoint()*(tr?.mult||1);
    if(G.trainingCarry>=1){const add=Math.floor(G.trainingCarry);G.trainingCarry-=add;addSpeed(add,true);queuePersist(1800);}
  }
  if(G.grounded&&planarSpeed>.35){G.footstepClock+=dt*(.55+planarSpeed*.11);if(G.footstepClock>=1){G.footstepClock=0;if(G.support&&!G.support.label)tone(118+(G.sprint?18:0),.025,'triangle',.005,-16);}}else G.footstepClock=Math.min(G.footstepClock,.72);
  if(G.pos.y<(isEscapeWorld()||G.world==='race'?WORLD_FAIL_Y:MAX_FALL)){respawn();return;}detectCheckpointAndFinish();checkAutoTriggers();consumeBufferedJump();
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
  awardMainXp(Math.min(8,2+Math.floor(p.winStage/3)),`Escape.kl · ${w.name} Stage ${p.winStage}`,`escape-${w.id}-stage-${p.winStage}-${Date.now()}`);
  soundCheckpoint();
  // Keyboard-Escape-Cash-out: Wer das gelbe WIN-Pad nimmt, kassiert bewusst und
  // startet den Welt-Run wieder von vorn. Wer zur nächsten Stage will, lässt das
  // rechts liegende Pad aus und läuft über die mittlere Safe-Zone weiter.
  G.stage=1;G.stageClaims.clear();G.runStartedAt=performance.now();G.runFurthestZ=Number(w.start?.z)||-70;
  teleport(Number(w.start?.x)||0,Number(w.start?.y)||1.5,Number(w.start?.z)||-70);
  toast(`🏆 +${reward.toLocaleString('de-DE')} Wins abgeholt · zurück zum Start`,'good',2100);
  updateHud(true);
  return true;
}
function detectCheckpointAndFinish(){
  const p=G.support;if(!p)return;
  if(isEscapeWorld()){
    if(p.kind==='win-pad'&&claimStageWin(p))return;
    if(p.stage&&p.stage>G.stage)G.stage=Math.min(currentWorldDef()?.stageCount||p.stage,p.stage);
    if(p.finish&&!G.runFinished)finishWorld();
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
function trailParticleColor(def,particle,t){
  if(def.effect==='fire')return new THREE.Color().setHSL(.02+particle.seed*.08,1,.54+.12*Math.sin(t*4+particle.seed));
  if(def.effect==='water')return new THREE.Color().setHSL(.52+particle.seed*.06,.9,.58);
  if(def.effect==='rainbow')return new THREE.Color().setHSL((t*.18+particle.seed)%1,.95,.60);
  if(def.effect==='galaxy')return new THREE.Color().setHSL(.70+particle.seed*.16,.92,.64);
  return new THREE.Color(def.color);
}
function emitTrailParticle(def,indexOffset=0){
  const pool=G.trailParticles||[];const particle=pool.find(p=>p.age>=p.life)||pool.reduce((best,p)=>!best||p.age>best.age?p:best,null);if(!particle)return;
  particle.age=0;particle.life=.62+Math.random()*.58;const speed=Math.hypot(G.moveVel.x,G.moveVel.z),dir=G.tmpV3.set(G.moveVel.x,0,G.moveVel.z);if(dir.lengthSq()<.01)dir.set(-Math.sin(G.yaw),0,-Math.cos(G.yaw));else dir.normalize();const right=new THREE.Vector3(-dir.z,0,dir.x);
  if(G.state.trailPlacement==='back')particle.mesh.position.set(G.pos.x-dir.x*.34,G.pos.y+.25+Math.random()*.48,G.pos.z-dir.z*.34);
  else particle.mesh.position.set(G.pos.x+right.x*(indexOffset?.18:-.18),G.pos.y-PLAYER_HALF+.09+Math.random()*.05,G.pos.z+right.z*(indexOffset?.18:-.18));
  particle.vel.set(-dir.x*(.18+Math.random()*.18)+right.x*(Math.random()-.5)*.18,.14+Math.random()*.48,-dir.z*(.18+Math.random()*.18)+right.z*(Math.random()-.5)*.18);
  particle.mesh.visible=true;particle.mesh.scale.setScalar(.65+Math.random()*.75);particle.mesh.material.opacity=.82;particle.mesh.material.color.copy(trailParticleColor(def,particle,performance.now()/1000));
  if(def.effect==='fire')particle.vel.y+=.42;if(def.effect==='water')particle.vel.y-=.04;if(def.effect==='galaxy')particle.mesh.scale.multiplyScalar(1.15);
}
function updateTrail(dt){
  const def=trailDef(),moving=Math.hypot(G.moveVel.x,G.moveVel.z)>.18||isOnTraining();
  if(!G.trail)return;G.trail.visible=def.id!=='none';
  for(const p of G.trailParticles||[]){if(p.age>=p.life){p.mesh.visible=false;continue;}p.age+=dt;p.mesh.position.addScaledVector(p.vel,dt);p.vel.y+=(def.effect==='fire'?.32:-.12)*dt;const q=Math.max(0,1-p.age/p.life);p.mesh.material.opacity=q*.78;p.mesh.scale.multiplyScalar(Math.pow(.985,dt*60));if(def.effect==='rainbow'||def.effect==='galaxy'||def.effect==='fire')p.mesh.material.color.copy(trailParticleColor(def,p,performance.now()/1000));if(p.age>=p.life)p.mesh.visible=false;}
  if(def.id==='none'||!moving)return;G.trailEmitCarry+=dt*(G.state.trailPlacement==='feet'?18:13);while(G.trailEmitCarry>=1){G.trailEmitCarry-=1;if(G.state.trailPlacement==='feet'){emitTrailParticle(def,0);emitTrailParticle(def,1)}else emitTrailParticle(def,0);}
}
function detectInteraction(){let best=null,dist=Infinity;for(const i of G.interactables){if(i.scope!==G.world)continue;const d=i.pos.distanceTo(G.pos);if(d<=i.radius&&d<dist){best=i;dist=d}}G.activeInteractable=best;const p=G.overlay?.querySelector('[data-ekl-prompt]');if(!p)return;const tr=trainingInfo();if(best){p.innerHTML=`<kbd>${matchMedia('(pointer:coarse)').matches?'AKTION':'E'}</kbd>${best.label}`;p.classList.add('show')}else if(tr){if(tr.unlocked)p.textContent=`${tr.name} · Sprint-Training im Stand · +${fmt(TREADMILL_TICKS_PER_SECOND*gainMultiplier()*tr.mult)} Speed/s`;else p.textContent=`🔒 ${tr.name} · im JK/Coin-Shop freischalten`;p.classList.add('show')}else p.classList.remove('show');}
function interact(){if(G.modalOpen){closeModal();return}if(G.activeInteractable?.onUse)G.activeInteractable.onUse();}
function updateHud(force=false){
  if(!G.overlay||!G.state)return;G.hudClock+=force?999:0;const set=(q,v)=>{const e=G.overlay.querySelector(q);if(e&&e.textContent!==String(v))e.textContent=String(v)};
  const lp=levelProgress(),nextRb=nextRebirthDef();
  set('[data-ekl-speed]',fmt(G.state.speed));set('[data-ekl-level]',lp.level);set('[data-ekl-runpoints]',fmt(G.state.runPoints));set('[data-ekl-wins]',fmt(G.state.wins));set('[data-ekl-rebirths]',G.state.rebirths);set('[data-ekl-gain]',`+${fmt(speedPerRunPoint())}`);
  set('[data-ekl-level-next]',lp.level>=Number(nextRb?.level||Infinity)?`REBIRTH ${G.state.rebirths+1} BEREIT`:`NÄCHSTES LEVEL: ${fmt(lp.to)} SPEED`);
  const levelBar=G.overlay.querySelector('[data-ekl-level-bar]');if(levelBar)levelBar.style.width=`${Math.round(lp.ratio*100)}%`;
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
  const level=currentLevel(),trail=TRAILS.find(t=>t.id===G.state.trail)||TRAILS[0],aura=AURAS.find(a=>a.id===G.state.aura)||AURAS[0];
  const wrap=openModal(`<div class="ekl-modal"><div class="ekl-modal-head"><div><small>ECHTER IN-GAME SHOP · ESCAPE HUB</small><h2>🏪 Speed Shop</h2><p>Normales Laufen baut langsam Basis-Speed auf. Laufbänder trainieren deutlich schneller; Speed-Items geben große prozentuale Sprünge auf deinen aktuellen Speed.</p></div><button data-ekl-modal-close>×</button></div><div class="ekl-big-stat"><div><small>LEVEL</small><b>${level}</b></div><div><small>WINS</small><b>${fmt(G.state.wins)}</b></div><div><small>SPEED / SCHRITT</small><b>+${fmt(speedPerRunPoint())}</b></div><div><small>GEAR</small><b>×${(trail.mult*aura.mult).toFixed(2).replace('.',',')}</b></div></div><div class="ekl-tabs"><button data-ekl-shop-tab="speed">Schritt-Speed</button><button data-ekl-shop-tab="items">Speed-Items</button><button data-ekl-shop-tab="trails">Trails</button><button data-ekl-shop-tab="auras">Auren</button><button data-ekl-shop-tab="characters">Charaktere</button><button data-ekl-shop-tab="worlds">Welten</button><button data-ekl-shop-tab="jk">◆ JK/Coin</button></div><div data-ekl-shop-body></div></div>`);
  wrap.querySelectorAll('[data-ekl-shop-tab]').forEach(b=>b.onclick=()=>renderShopBody(b.dataset.eklShopTab));renderShopBody(tab);
}
function renderShopBody(tab){
  const body=G.overlay?.querySelector('[data-ekl-shop-body]');if(!body)return;
  G.overlay.querySelectorAll('[data-ekl-shop-tab]').forEach(b=>b.classList.toggle('active',b.dataset.eklShopTab===tab));
  if(tab==='speed'){
    body.innerHTML=`<div class="ekl-progression-note"><b>🏃 ${Number(G.state.runPoints||0).toLocaleString('de-DE')} Laufpunkte</b><span>Alle ${RUN_POINT_DISTANCE.toFixed(2).replace('.',',')} m zählt ein echter Laufpunkt. Jeder Laufpunkt gibt aktuell <strong>+${fmt(speedPerRunPoint())} Basis-Speed</strong>. Große Sprünge kommen aus Laufband-Training und Speed-Items.</span></div><div class="ekl-shop-grid">${STEP_BUTTONS.slice(1).map(u=>{const owned=G.state.stepButtonTier>=u.tier,available=G.state.stepButtonTier===u.tier-1;return `<article class="${owned?'owned':''}"><small>NUMBER BUTTON ${u.tier}</small><h3>${u.name}</h3><p>Erhöht den Speed pro Laufpunkt. Normales Laufen bleibt der langsame Grundweg; Laufbänder und Items sind für starke Progression gedacht.</p><button data-ekl-buy-step="${u.tier}" ${owned||!available?'disabled':''}>${owned?'GEKAUFT':available?`${u.cost.toLocaleString('de-DE')} Wins`:'Vorherigen Button kaufen'}</button></article>`}).join('')}</div>`;
    body.querySelectorAll('[data-ekl-buy-step]').forEach(b=>b.onclick=()=>buyStepButton(Number(b.dataset.eklBuyStep),false));
  }else if(tab==='items'){
    body.innerHTML=`<div class="ekl-progression-note"><b>🎒 SPEED-INVENTAR</b><span>Diese Items erhöhen deinen <strong>aktuellen</strong> Speed direkt. Beispiel: +50 % auf 100.000 Speed = +50.000 Speed. Die Shoppreise steigen nach jedem Kauf, damit die Progression nicht explodiert.</span></div><div class="ekl-shop-grid">${SPEED_ITEMS.map(item=>{const count=Math.max(0,Number(G.state.speedItems?.[item.id])||0),cost=speedItemCost(item),gain=Math.floor(Math.max(0,Number(G.state.speed)||0)*item.pct),canUse=count>0&&Number(G.state.speed)>=item.minSpeed;return `<article class="${count?'owned':''}"><small>${item.icon} SPEED ITEM · ${count}× IM INVENTAR</small><h3>${item.name}</h3><p>Beim Benutzen aktuell <b>+${fmt(gain)} Speed</b>.<br>Mindest-Speed: ${fmt(item.minSpeed)}.</p><div class="ekl-item-actions"><button data-ekl-buy-item="${item.id}">Kaufen · ${cost.toLocaleString('de-DE')} Wins</button><button data-ekl-use-item="${item.id}" ${canUse?'':'disabled'}>Benutzen (${count})</button></div></article>`}).join('')}</div>`;
    body.querySelectorAll('[data-ekl-buy-item]').forEach(b=>b.onclick=()=>buySpeedItem(b.dataset.eklBuyItem));
    body.querySelectorAll('[data-ekl-use-item]').forEach(b=>b.onclick=()=>useSpeedItem(b.dataset.eklUseItem));
  }else if(tab==='trails'){
    body.innerHTML=`<div class="ekl-progression-note"><b>✨ PARTIKELSPUREN</b><span>Jede Spur bleibt kurz hinter deinem Charakter stehen und blendet wieder aus. Wähle zwischen <strong>Fußspur</strong> (z. B. Feuer/Wasser an beiden Füßen) und <strong>Rückenspur</strong>.</span><div class="ekl-trail-pos-inline"><button data-ekl-trail-pos="feet" class="${G.state.trailPlacement==='feet'?'active':''}">👟 Fußspur</button><button data-ekl-trail-pos="back" class="${G.state.trailPlacement==='back'?'active':''}">🎒 Rückenspur</button></div></div><div class="ekl-shop-grid">${TRAILS.map(t=>{const owned=G.state.ownedTrails.includes(t.id),active=G.state.trail===t.id;return `<article class="${owned?'owned':''} ${t.jk?'jk':''}"><small>${active?'AKTIV':t.jk?'JK/COIN':'PARTIKELSPUR'}</small><h3>${t.name}</h3><p><b>×${t.mult.toFixed(2).replace('.',',')} Speed</b> auf Laufpunkte und Laufband. Effekt: ${t.effect==='fire'?'🔥 Feuer':t.effect==='water'?'💧 Wasser':t.effect==='rainbow'?'🌈 Rainbow':t.effect==='galaxy'?'🌌 Galaxy':t.effect==='magic'?'✨ Magie':t.effect==='energy'?'⚡ Energie':'–'}.</p><button data-ekl-trail="${t.id}" class="${t.jk?'jk':''}" ${active?'disabled':''}>${active?'AKTIV':owned?'Ausrüsten':t.jk?'Im JK/Coin-Shop':`${t.cost.toLocaleString('de-DE')} Wins`}</button></article>`}).join('')}</div>`;
    body.querySelectorAll('[data-ekl-trail]').forEach(b=>b.onclick=()=>buyOrEquipTrail(b.dataset.eklTrail));
    body.querySelectorAll('[data-ekl-trail-pos]').forEach(b=>b.onclick=()=>{setTrailPlacement(b.dataset.eklTrailPos);openShop('trails')});
  }else if(tab==='auras'){
    body.innerHTML=`<div class="ekl-shop-grid">${AURAS.map(a=>{const owned=G.state.ownedAuras.includes(a.id),active=G.state.aura===a.id,quest=a.questRunPoints&&!owned,questReady=quest&&G.state.runPoints>=a.questRunPoints;return `<article class="${owned?'owned':''}"><small>${active?'AKTIV':quest?'QUEST':'AURA'}</small><h3>${a.name}</h3><p><b>×${a.mult.toFixed(2).replace('.',',')} Speed</b> · stapelt mit Trail + Rebirth.${quest?`<br>Gratis-Quest: ${Number(a.questRunPoints).toLocaleString('de-DE')} Laufpunkte.`:''}</p><button data-ekl-aura="${a.id}" ${active||(!owned&&quest&&!questReady)?'disabled':''}>${active?'AKTIV':owned?'Ausrüsten':quest?(questReady?'Gratis freischalten':`${Number(G.state.runPoints||0).toLocaleString('de-DE')} / ${Number(a.questRunPoints).toLocaleString('de-DE')} LP`):`${a.cost.toLocaleString('de-DE')} Wins`}</button></article>`}).join('')}</div>`;
    body.querySelectorAll('[data-ekl-aura]').forEach(b=>b.onclick=()=>buyOrEquipAura(b.dataset.eklAura));
  }else if(tab==='characters'){
    const active=G.state.characterChoice;
    body.innerHTML=`<div class="ekl-progression-note"><b>🧍 CHARAKTER SHOP</b><span>Mann und Frau sind kostenlos wechselbar. Spezialcharaktere werden mit Wins gekauft und können später durch eigene GLB-Skins von dir erweitert oder ersetzt werden.</span></div><div class="ekl-character-choice"><button data-ekl-character-shop="male" class="${active==='male'?'active':''}"><b>♂ Mann</b><span>Hauptskin · Mann-Animationen</span></button><button data-ekl-character-shop="female" class="${active==='female'?'active':''}"><b>♀ Frau</b><span>Hauptskin · Frau-Animationen</span></button></div><div class="ekl-shop-grid">${SPECIAL_CHARACTERS.map(c=>{const owned=G.state.ownedSpecialCharacters.includes(c.id),isActive=active===c.id;return `<article class="${owned?'owned':''}"><small>SPEZIALCHARAKTER</small><h3>${c.name}</h3><p>${c.desc}</p><button data-ekl-special-shop="${c.id}" ${isActive?'disabled':''}>${isActive?'AKTIV':owned?'Ausrüsten':`${c.cost.toLocaleString('de-DE')} Wins`}</button></article>`}).join('')}</div>`;
    body.querySelectorAll('[data-ekl-character-shop]').forEach(b=>b.onclick=()=>{setCharacterChoice(b.dataset.eklCharacterShop);openShop('characters')});
    body.querySelectorAll('[data-ekl-special-shop]').forEach(b=>b.onclick=()=>{buySpecialCharacter(b.dataset.eklSpecialShop);openShop('characters')});
  }else if(tab==='worlds'){
    const level=currentLevel();
    body.innerHTML=`<div class="ekl-shop-grid">${WORLD_DEFS.map(w=>{const unlocked=w.number===1||G.state.worldsUnlocked.includes(w.id)||(!w.locked&&level>=Number(w.requiredLevel||0));const need=Math.max(0,Number(w.requiredLevel||0)-level);return `<article class="${unlocked&&!w.locked?'owned':''}"><small>WELT ${w.number} · ${w.difficulty||''}</small><h3>${w.name}</h3><p>${w.description}</p><button disabled>${w.locked?'COMING SOON':unlocked?'IM HUB FREIGESCHALTET':`Level ${w.requiredLevel} · noch ${need} Level`}</button></article>`}).join('')}</div><div class="ekl-world-economy-note"><b>Aktuell Level ${level}</b><span>World 2 und 3 werden – wie im Keyboard-Escape-Spielstil – über dein Speed-Level freigeschaltet. Einmal freigeschaltet bleiben sie offen, auch nach einem Rebirth.</span></div>`;
  }else{
    const balance=Number(window.JKCoinApp?.coinState?.()?.balance||0),items=[
      {name:'Gold Speed-Treadmill ×3',price:250,owned:Number(G.state.jkTreadmillTier||0)>=1,desc:'Permanentes Sport-Laufband mit ×3 Trainingsrate.'},
      {name:'Diamond Speed-Treadmill ×9',price:850,owned:Number(G.state.jkTreadmillTier||0)>=2,desc:'Permanentes Premium-Laufband mit ×9 Trainingsrate.'},
      {name:'Galaxy Keyboard Trail ×10',price:300,owned:G.state.ownedTrails.includes('galaxy'),desc:'Galaxy-Spur mit echtem ×10 Speed-Multiplikator.'},
      {name:'Speed-Gain ×2 · 15 Min.',price:180,owned:false,desc:'Temporärer ×2 Bonus auf Laufpunkte und Laufband-Speed.'}
    ];
    body.innerHTML=`<div class="ekl-jk-panel"><div><small>JK.GAMES · JK/COIN</small><h3>◆ Escape.kl Premium</h3><p>Premium beschleunigt die Progression, aber Level, Wins, Welten, Trails und Auren bleiben erspielbar.</p><b>${balance.toLocaleString('de-DE')} JK/Coin verfügbar</b></div><button class="jk" data-ekl-open-jk>JK/Coin-Shop öffnen</button></div><div class="ekl-shop-grid ekl-jk-grid">${items.map(i=>`<article class="jk ${i.owned?'owned':''}"><small>${i.owned?'DAUERHAFT FREIGESCHALTET':'JK/COIN'}</small><h3>${i.name}</h3><p>${i.desc}</p><button class="jk" data-ekl-open-jk ${i.owned?'disabled':''}>${i.owned?'GEKAUFT':`${i.price.toLocaleString('de-DE')} JK/Coin`}</button></article>`).join('')}</div>`;
    body.querySelectorAll('[data-ekl-open-jk]').forEach(b=>b.addEventListener('click',openJkCoinShop));
  }
}
function buyStepButton(tier,fromPad=false){
  const u=STEP_BUTTONS.find(x=>x.tier===tier);if(!u)return false;
  if(G.state.stepButtonTier>=tier){if(fromPad)toast(`${u.name} ist bereits aktiv.`,'good',1200);return false;}
  if(G.state.stepButtonTier!==tier-1){toast(`Erst Number Button ${G.state.stepButtonTier+1} freischalten.`,'bad',1600);return false;}
  if(G.state.wins<u.cost){toast(`Du brauchst ${u.cost.toLocaleString('de-DE')} Wins.`,'bad',1600);return false;}
  G.state.wins-=u.cost;G.state.stepButtonTier=tier;soundBuy();queuePersist(50);updateHud(true);toast(`⚡ ${u.name} gekauft!`,'good',2200);if(!fromPad)openShop('speed');return true;
}
function buyOrEquipTrail(id){
  const t=TRAILS.find(x=>x.id===id);if(!t)return;
  if(!G.state.ownedTrails.includes(id)){if(t.jk)return openJkCoinShop();if(G.state.wins<t.cost)return toast(`Du brauchst ${t.cost.toLocaleString('de-DE')} Wins.`,'bad');G.state.wins-=t.cost;G.state.ownedTrails.push(id);soundBuy();}
  G.state.trail=id;setTrailColor();queuePersist(50);updateHud(true);toast(`${t.name} ausgerüstet · ×${t.mult.toFixed(2).replace('.',',')} Speed.`,'good');openShop('trails');
}
function buyOrEquipAura(id){
  const a=AURAS.find(x=>x.id===id);if(!a)return;
  if(!G.state.ownedAuras.includes(id)){
    if(a.questRunPoints){if(G.state.runPoints<a.questRunPoints)return toast(`Noch ${Math.max(0,a.questRunPoints-G.state.runPoints).toLocaleString('de-DE')} Laufpunkte bis zur ${a.name}.`,'bad');}
    else if(G.state.wins<a.cost)return toast(`Du brauchst ${a.cost.toLocaleString('de-DE')} Wins.`,'bad');
    else G.state.wins-=a.cost;
    G.state.ownedAuras.push(id);soundBuy();
  }
  G.state.aura=id;setAuraStyle();queuePersist(50);updateHud(true);toast(`${a.name} ausgerüstet · ×${a.mult.toFixed(2).replace('.',',')} Speed.`,'good');openShop('auras');
}
function openJkCoinShop(){closeModal();if(window.JKCoinApp?.openForGame?.('escape')!==true)toast('JK/Coin-Shop wird noch geladen.','bad',1800);}
function canApplyJkPurchase(kind){kind=String(kind||'');if(kind==='speedTreadmill:gold')return Number(G.state?.jkTreadmillTier||0)<1;if(kind==='speedTreadmill:diamond')return Number(G.state?.jkTreadmillTier||0)<2;if(kind==='trail:galaxy')return !G.state?.ownedTrails?.includes('galaxy');return true;}
function grantJkCoinPurchase(kind,amount=1){if(!G.state)loadProgress();kind=String(kind||'');if(kind==='speedTreadmill:gold')G.state.jkTreadmillTier=Math.max(1,Number(G.state.jkTreadmillTier)||0);else if(kind==='speedTreadmill:diamond')G.state.jkTreadmillTier=Math.max(2,Number(G.state.jkTreadmillTier)||0);else if(kind==='trail:galaxy'){if(!G.state.ownedTrails.includes('galaxy'))G.state.ownedTrails.push('galaxy');}else if(kind==='speedBoost:2'){G.state.jkSpeedBoostUntil=Date.now()+15*60*1000;}else return false;queuePersist(50);updateHud(true);toast('◆ JK/Coin-Inhalt für Escape.kl aktiviert.','good',2400);return true;}
function openRebirth(){
  const next=nextRebirthDef(),level=currentLevel(),ready=level>=Number(next.level||Infinity),currentMult=rebirthMultiplier(),afterMult=Number(next.mult||currentMult);
  const wrap=openModal(`<div class="ekl-modal ekl-rebirth-modal"><div class="ekl-modal-head"><div><small>LEVEL-REBIRTH · PERMANENTE PROGRESSION</small><h2>🔄 Rebirth ${G.state.rebirths+1}</h2><p>Wie beim Keyboard-Escape-Loop: Rebirth setzt deinen aktuellen Speed und damit dein Speed-Level zurück. Wins, Laufpunkte, Number Buttons, Trails, Auren und Welten bleiben erhalten.</p></div><button data-ekl-modal-close>×</button></div><div class="ekl-rebirth-requirements"><article class="${ready?'ready':''}"><small>AKTUELLES LEVEL</small><b>${level} / ${next.level}</b><span>${ready?'✓ Rebirth bereit':`Noch ${Math.max(0,next.level-level)} Level`}</span></article><article><small>AKTUELLER SPEED</small><b>${fmt(G.state.speed)}</b><span>wird beim Rebirth auf 0 gesetzt</span></article><article class="bonus"><small>REBIRTH-MULTIPLIKATOR</small><b>×${currentMult.toLocaleString('de-DE')} → ×${afterMult.toLocaleString('de-DE')}</b><span>kontrollierter permanenter Bonus auf künftigen Speed</span></article></div><div class="ekl-modal-actions"><button data-ekl-rebirth-confirm class="gold" ${!ready?'disabled':''}>Rebirth ${G.state.rebirths+1} durchführen</button><button data-ekl-modal-close>Abbrechen</button></div></div>`);
  wrap.querySelector('[data-ekl-rebirth-confirm]')?.addEventListener('click',()=>{if(currentLevel()<next.level)return;G.state.speed=0;G.state.rebirths++;G.speedDistanceCarry=0;G.trainingCarry=0;queuePersist(50);closeModal();updateHud(true);toast(`Rebirth ${G.state.rebirths} abgeschlossen · permanenter Speed-Bonus ×${rebirthMultiplier().toLocaleString('de-DE')}!`,'good',3000);awardMainXp(15,'Escape.kl Rebirth',`escape-rebirth-${G.state.rebirths}`);});
}
function wheelRemaining(){return Math.max(0,24*60*60*1000-(Date.now()-(Number(G.state.lastWheelAt)||0)));}
function durationShort(ms){ms=Math.max(0,ms);const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000);return h>0?`${h} Std ${m} Min`:`${Math.max(1,m)} Min`;}
function openDailyWheel(){
  const remaining=wheelRemaining(),ready=remaining<=0;const wrap=openModal(`<div class="ekl-modal"><div class="ekl-modal-head"><div><small>TÄGLICHE BELOHNUNG · ESCAPE HUB</small><h2>🎡 Daily Wheel</h2><p>Ein kostenloser Dreh alle 24 Stunden. Der Gewinn wird sofort in Escape.kl gespeichert.</p></div><button data-ekl-modal-close>×</button></div><div class="ekl-wheel-zone"><div class="ekl-wheel" data-ekl-wheel><span style="--i:0">⚡</span><span style="--i:1">🏆</span><span style="--i:2">×2</span><span style="--i:3">⚡</span><span style="--i:4">🏆</span><span style="--i:5">★</span><i>▼</i></div><div class="ekl-wheel-info"><small>${ready?'BEREIT':'NÄCHSTER DREH'}</small><b data-ekl-wheel-status>${ready?'Jetzt drehen':durationShort(remaining)}</b><p>Speed · Wins · selten ein Trail</p></div></div><div class="ekl-modal-actions"><button data-ekl-spin class="gold" ${ready?'':'disabled'}>${ready?'KOSTENLOS DREHEN':'MORGEN WIEDER'}</button><button data-ekl-modal-close>Schließen</button></div></div>`);
  wrap.querySelector('[data-ekl-spin]')?.addEventListener('click',()=>spinDailyWheel(wrap));
}
function spinDailyWheel(wrap){
  if(wheelRemaining()>0)return;const button=wrap.querySelector('[data-ekl-spin]'),wheel=wrap.querySelector('[data-ekl-wheel]'),status=wrap.querySelector('[data-ekl-wheel-status]');if(button)button.disabled=true;
  const roll=Math.random();let text='';if(roll<.28){addSpeed(750,false);text='+750 Speed';}else if(roll<.50){awardWins(250,'Daily Wheel');text='+250 Wins';}else if(roll<.68){addSpeed(2500,false);text='+2.500 Speed';}else if(roll<.84){awardWins(750,'Daily Wheel');text='+750 Wins';}else if(roll<.96){awardWins(1500,'Daily Wheel');text='+1.500 Wins';}else if(!G.state.ownedTrails.includes('green')){G.state.ownedTrails.push('green');text='Green Trail ×1,5';}else{awardWins(5000,'Daily Wheel');text='+5.000 Wins · Jackpot';}
  G.state.lastWheelAt=Date.now();queuePersist(50);soundFinish();if(wheel){wheel.style.setProperty('--spin',`${1260+Math.floor(Math.random()*360)}deg`);wheel.classList.add('spinning');}if(status)status.textContent='Dreht …';setTimeout(()=>{if(status)status.textContent=text;toast(`Daily Wheel: ${text}`,'good',2600);updateHud(true);},1150);
}
function dailyQuestRows(){
  const q=ensureDailyQuest(),runPoints=Math.max(0,(Number(G.state.runPoints)||0)-(Number(q.runPointsStart)||0)),completions=Math.max(0,(Number(G.state.completions?.['keyboard-lab']||0))-(Number(q.completionsStart)||0));
  return [
    {id:'runpoints',icon:'🏃',name:'Laufpunkte',desc:'Sammle heute 500 Laufpunkte durch echte Bewegung.',progress:runPoints,target:500,reward:500},
    {id:'speed',icon:'⚡',name:'Speed Training',desc:'Verdiene heute 10.000 Speed durch Laufen oder Laufband.',progress:Number(q.speedEarned)||0,target:10000,reward:750},
    {id:'escape',icon:'🏁',name:'Daily Escape',desc:'Schließe Keyboard Lab heute einmal komplett ab.',progress:completions,target:1,reward:2500}
  ];
}
function openDailyQuests(){
  const q=ensureDailyQuest(),rows=dailyQuestRows();const wrap=openModal(`<div class="ekl-modal"><div class="ekl-modal-head"><div><small>ESCAPE.KL · TAGESAUFGABEN</small><h2>📋 Daily Quests</h2><p>Drei Aufgaben pro Tag. Fortschritt entsteht ausschließlich beim normalen Spielen.</p></div><button data-ekl-modal-close>×</button></div><div class="ekl-quest-list">${rows.map(r=>{const claimed=q.claimed.includes(r.id),done=r.progress>=r.target,pct=Math.min(100,r.progress/r.target*100);return `<article class="${done?'done':''} ${claimed?'claimed':''}"><span>${r.icon}</span><div><small>${claimed?'ABGEHOLT':done?'FERTIG':'TAGESQUEST'}</small><h3>${r.name}</h3><p>${r.desc}</p><i><b style="width:${pct}%"></b></i><em>${Math.min(r.target,Math.floor(r.progress)).toLocaleString('de-DE')} / ${r.target.toLocaleString('de-DE')}</em></div><button data-ekl-claim-quest="${r.id}" ${!done||claimed?'disabled':''}>${claimed?'✓':`+${r.reward} Wins`}</button></article>`}).join('')}</div></div>`);
  wrap.querySelectorAll('[data-ekl-claim-quest]').forEach(b=>b.onclick=()=>claimDailyQuest(b.dataset.eklClaimQuest));
}
function claimDailyQuest(id){const q=ensureDailyQuest(),row=dailyQuestRows().find(r=>r.id===id);if(!row||row.progress<row.target||q.claimed.includes(id))return;q.claimed.push(id);awardWins(row.reward,row.name);soundBuy();queuePersist(50);updateHud(true);toast(`${row.name}: +${row.reward} Wins`,'good',2000);openDailyQuests();}
function openRecords(){
  const raceBest=Number(G.state.bestTimes?.['speed-race']||0),races=Number(G.state.completions?.['speed-race']||0),level=currentLevel();
  const worlds=WORLD_DEFS.filter(w=>!w.locked).map(w=>({w,best:Number(G.state.bestTimes?.[w.id]||0),stars:Number(G.state.worldStars?.[w.id]||0),runs:Number(G.state.completions?.[w.id]||0)}));
  openModal(`<div class="ekl-modal"><div class="ekl-modal-head"><div><small>PERSÖNLICHE ESCAPE-REKORDE</small><h2>🏆 Records Board</h2><p>Deine Keyboard-Escape-Progression: Level, Laufpunkte, Speed, Wins, Gear und Weltrekorde.</p></div><button data-ekl-modal-close>×</button></div><div class="ekl-record-grid"><article><small>SPEED LEVEL</small><b>${level}</b><span>${fmt(G.state.speed)} Speed · nächstes Level bei ${fmt(speedForLevel(level+1))}</span></article><article><small>LAUFTEMPO</small><b>+${Math.round(movementBonusPercent())} %</b><span>Level erhöht dein echtes Lauftempo bis maximal +300 %. Mehr Speed danach erhöht weiter Level/Progression, aber nicht die Bewegung.</span></article><article><small>LAUFPUNKTE</small><b>${Number(G.state.runPoints||0).toLocaleString('de-DE')}</b><span>echte Laufpunkte durch Bewegung</span></article><article><small>SPEED / SCHRITT</small><b>+${fmt(speedPerRunPoint())}</b><span>Basis ${stepBaseGain()} · Trail ×${trailMultiplier()} · Aura ×${auraMultiplier()} · Rebirth ×${rebirthMultiplier()}</span></article>${worlds.map(({w,best,stars,runs})=>`<article><small>WORLD ${w.number}</small><b>${best?timeText(best):'–'}</b><span>${w.name} · ${runs} Runs · ${'★'.repeat(stars)}${'☆'.repeat(Math.max(0,3-stars))}</span></article>`).join('')}<article><small>STAGE-WINS</small><b>${Number(G.state.stageWinsCollected||0).toLocaleString('de-DE')}</b><span>über gelbe WIN-Pads gesammelt</span></article><article><small>LIFETIME WINS</small><b>${Number(G.state.lifetimeWins||0).toLocaleString('de-DE')}</b><span>gesamte jemals erspielte Wins</span></article><article><small>RACE BEST</small><b>${raceBest?timeText(raceBest):'–'}</b><span>Speed Race · ${races} Läufe</span></article><article><small>DISTANZ</small><b>${Math.floor(G.state.totalDistance).toLocaleString('de-DE')} m</b><span>Gesamtlaufstrecke</span></article><article><small>REBIRTHS</small><b>${G.state.rebirths}</b><span>Multiplikator ×${rebirthMultiplier().toLocaleString('de-DE')}</span></article></div></div>`);
}
function showHelp(){openModal(`<div class="ekl-modal"><div class="ekl-modal-head"><div><small>ESCAPE.KL · SPIELLOOP</small><h2>Wie spiele ich?</h2><p>Escape.kl orientiert sich jetzt deutlich stärker am Keyboard-Escape-Spielstil: laufen → Speed/Level → Stage-Wins → Gear → Rebirth → nächste Welt.</p></div><button data-ekl-modal-close>×</button></div><div class="ekl-help"><article><b>🏃 Laufpunkte</b><p>Alle ${RUN_POINT_DISTANCE.toFixed(2).replace('.',',')} m echte Bodenbewegung zählt als 1 Laufpunkt. Jeder Laufpunkt gibt Speed. Number Buttons im Hub erhöhen den Basis-Speed pro Laufpunkt dauerhaft bis +500.</p></article><article><b>⬆ Speed Level</b><p>Dein Level steigt automatisch mit deinem aktuellen Speed. Die Kurve steigt stark an: Level 100 braucht knapp 1 Mio. Speed, World 2 Level 250 und World 3 Level 800. Dadurch sind hohe Level wieder echte Langzeitziele.</p></article><article><b>🏆 Stage-Wins</b><p>Jede Stage hat rechts ein gelbes WIN-Pad. Drauflaufen = Wins kassieren und sofort zurück zum Weltstart. Wer weiter zur nächsten Stage will, lässt das Pad aus. Höhere Stages zahlen deutlich mehr.</p></article><article><b>🏃 Level → echtes Lauftempo</b><p>Am Anfang läufst du bewusst langsam. Mit jedem Level steigt dein echtes Bewegungstempo. Spätestens bei Level 800 ist die harte Obergrenze von +300 % erreicht; Sprint kann dich vorher schneller an diese Grenze bringen, aber niemals darüber. Jeder weitere Speed bleibt für Level und Progression wichtig, macht dich aber physisch nicht noch schneller.</p></article><article><b>🌈 Trails + Auren</b><p>Spuren sind jetzt echte ausblendende Partikel: Fußspur oder Rückenspur, z. B. Feuer, Wasser, Magie oder Galaxy. Zusätzlich verstärken Trail und Aura weiterhin deinen Speed-Gewinn.</p></article><article><b>🏃 Laufbänder</b><p>Laufbänder sind absichtlich schneller als normales Laufen: FREE trainiert bereits stärker als normales Herumlaufen, Gold ×3 und Diamond ×9 noch deutlich schneller. Sie erhöhen keine Laufpunkte.</p></article><article><b>🎒 Speed-Items</b><p>Im Speed Shop kannst du +25 %, +50 % und +100 % Speed-Items kaufen. Sie landen im Escape-Inventar und addieren den Prozentsatz auf deinen aktuellen Speed.</p></article><article><b>🔄 Rebirth</b><p>Rebirth basiert auf deinem Speed-Level, setzt Speed/Level auf 0 zurück und behält Wins, Laufpunkte, Number Buttons, Trails, Auren und freigeschaltete Welten.</p></article><article><b>🧍 Charakter Studio</b><p>Im Hub kannst du jederzeit Mann oder Frau wählen. Spezialcharaktere werden dort gekauft/ausgerüstet; die Slots sind so vorbereitet, dass später eigene GLB-Charaktere ergänzt werden können.</p></article><article><b>🎮 Steuerung</b><p>WASD laufen · Space springen mit Sprungpuffer · Shift sprinten · Maus ziehen = Kamera · Mausrad = Zoom · R = aktuellen Welt-Run neu starten.</p></article></div></div>`);}
function showPause(){G.paused=true;openModal(`<div class="ekl-modal"><div class="ekl-modal-head"><div><small>ESCAPE.KL</small><h2>Pause</h2><p>Dein Lauf ist angehalten.</p></div><button data-ekl-resume>×</button></div><div class="ekl-modal-actions"><button data-ekl-resume class="gold">Weiter</button><button data-ekl-hub>Zum Hub</button><button data-ekl-exit>Top Games</button><button data-ekl-help>Steuerung</button></div></div>`);G.overlay.querySelectorAll('[data-ekl-resume]').forEach(b=>b.onclick=()=>{closeModal();G.paused=false});G.overlay.querySelector('[data-ekl-hub]').onclick=()=>{G.paused=false;setWorld('hub')};G.overlay.querySelector('[data-ekl-exit]').onclick=returnToTopGames;G.overlay.querySelector('[data-ekl-help]').onclick=showHelp;}
function showComplete(w,sec,stars,reward,previous){const wrap=document.createElement('div');wrap.className='ekl-complete';wrap.dataset.eklComplete='1';wrap.innerHTML=`<div class="ekl-complete-card"><small>WORLD ${w.number} COMPLETE</small><h2>${w.name} geschafft!</h2><div class="ekl-stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div><p>Zeit <b>${timeText(sec)}</b>${previous?` · Vorher ${timeText(previous)}`:''}<br>Finish-Bonus <b>+${reward.toLocaleString('de-DE')} Wins</b><br><small>Gelbe WIN-Pads sind freiwillige Cash-outs: Einsammeln schickt dich sofort zurück zum Weltstart.</small></p><div class="ekl-modal-actions"><button data-ekl-again class="gold">Nochmal</button><button data-ekl-finish-hub>Zum Hub</button></div></div>`;G.overlay.append(wrap);wrap.querySelector('[data-ekl-again]').onclick=()=>{wrap.remove();setWorld(w.id)};wrap.querySelector('[data-ekl-finish-hub]').onclick=()=>{wrap.remove();setWorld('hub')};}

function showRaceComplete(sec,reward,previous,record){const wrap=document.createElement('div');wrap.className='ekl-complete';wrap.dataset.eklComplete='1';wrap.innerHTML=`<div class="ekl-complete-card"><small>SPEED RACE COMPLETE</small><h2>${record?'🏆 Neue Bestzeit!':'🏁 Rennen beendet!'}</h2><div class="ekl-stars">${record?'★★★':'★★☆'}</div><p>Zeit <b>${timeText(sec)}</b>${previous?` · Vorher ${timeText(previous)}`:''}<br>Deaths <b>${G.deaths}</b> · Belohnung <b>+${reward} Wins</b></p><div class="ekl-modal-actions"><button data-ekl-race-again class="gold">Nochmal</button><button data-ekl-race-hub>Zum Hub</button></div></div>`;G.overlay.append(wrap);wrap.querySelector('[data-ekl-race-again]').onclick=()=>{wrap.remove();setWorld('race')};wrap.querySelector('[data-ekl-race-hub]').onclick=()=>{wrap.remove();setWorld('hub')};}


function bindInput(){
  G.keyDown=e=>{ensureAudio();if(['KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft','ShiftRight','KeyE','KeyR','Escape'].includes(e.code))e.preventDefault();if(e.code==='Escape'){if(G.modalOpen){closeModal();G.paused=false}else showPause();return}if(e.code==='Space'){G.jumpHeld=true;requestJump();return}if(e.code==='KeyE'){interact();return}if(e.code==='KeyR'){respawn();return}G.keys.add(e.code)};
  G.keyUp=e=>{if(e.code==='Space'){G.jumpHeld=false;G.jumpQueuedUntil=0;return}G.keys.delete(e.code)};document.addEventListener('keydown',G.keyDown);document.addEventListener('keyup',G.keyUp);
  const canvas=G.overlay.querySelector('canvas');canvas.addEventListener('pointerdown',e=>{ensureAudio();if(e.pointerType==='touch')return;G.pointer={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture?.(e.pointerId)});G.pointerMove=e=>{if(!G.pointer||e.pointerId!==G.pointer.id)return;const dx=e.clientX-G.pointer.x,dy=e.clientY-G.pointer.y;G.pointer.x=e.clientX;G.pointer.y=e.clientY;G.yaw-=dx*.006;G.pitch=Math.max(.06,Math.min(.70,G.pitch+dy*.004))};G.pointerUp=e=>{if(G.pointer&&e.pointerId===G.pointer.id)G.pointer=null};canvas.addEventListener('pointermove',G.pointerMove);canvas.addEventListener('pointerup',G.pointerUp);canvas.addEventListener('pointercancel',G.pointerUp);canvas.addEventListener('wheel',e=>{e.preventDefault();G.camDistance=Math.max(4.6,Math.min(9.6,G.camDistance+Math.sign(e.deltaY)*.55));},{passive:false});

  // V439 iPhone-Joystick: Bewegung wird auf Window-Ebene verfolgt. Dadurch verliert
  // Safari den Stick nicht mehr, sobald der Finger den kleinen Kreis verlässt.
  const stick=G.overlay.querySelector('[data-ekl-stick]'),knob=stick?.querySelector('.ekl-stick-knob');
  if(stick&&knob){
    let pointerId=null,touchId=null;
    const reset=()=>{pointerId=null;touchId=null;G.mobileX=0;G.mobileY=0;knob.style.transform='translate(-50%,-50%)';stick.classList.remove('active')};
    const applyPoint=(clientX,clientY)=>{ensureAudio();const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,max=Math.max(24,r.width*.34);let dx=clientX-cx,dy=clientY-cy;const len=Math.hypot(dx,dy)||1,scale=Math.min(1,max/len);dx*=scale;dy*=scale;G.mobileX=Math.max(-1,Math.min(1,dx/max));G.mobileY=Math.max(-1,Math.min(1,dy/max));knob.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`};
    stick.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();e.stopPropagation();pointerId=e.pointerId;stick.classList.add('active');applyPoint(e.clientX,e.clientY);try{stick.setPointerCapture?.(e.pointerId)}catch{}},{passive:false});
    G.stickMove=e=>{if(pointerId===null||e.pointerId!==pointerId)return;e.preventDefault();applyPoint(e.clientX,e.clientY)};
    G.stickUp=e=>{if(pointerId===null||e.pointerId!==pointerId)return;e.preventDefault();reset()};
    window.addEventListener('pointermove',G.stickMove,{passive:false});window.addEventListener('pointerup',G.stickUp,{passive:false});window.addEventListener('pointercancel',G.stickUp,{passive:false});
    // TouchEvent fallback for older/inconsistent iOS WebViews.
    const touchFrom=e=>[...e.changedTouches,...e.touches].find(t=>touchId===null||t.identifier===touchId)||null;
    stick.addEventListener('touchstart',e=>{if(pointerId!==null)return;const t=e.changedTouches[0];if(!t)return;e.preventDefault();touchId=t.identifier;stick.classList.add('active');applyPoint(t.clientX,t.clientY)},{passive:false});
    G.stickTouchMove=e=>{if(pointerId!==null||touchId===null)return;const t=[...e.touches].find(x=>x.identifier===touchId);if(!t)return;e.preventDefault();applyPoint(t.clientX,t.clientY)};
    G.stickTouchEnd=e=>{if(pointerId!==null||touchId===null)return;if([...e.changedTouches].some(x=>x.identifier===touchId)){e.preventDefault();reset()}};
    window.addEventListener('touchmove',G.stickTouchMove,{passive:false});window.addEventListener('touchend',G.stickTouchEnd,{passive:false});window.addEventListener('touchcancel',G.stickTouchEnd,{passive:false});
  }
  const jumpBtn=G.overlay.querySelector('[data-ekl-jump]');if(jumpBtn){const jumpOn=e=>{e.preventDefault();ensureAudio();G.jumpHeld=true;requestJump()},jumpOff=e=>{e.preventDefault();G.jumpHeld=false;G.jumpQueuedUntil=0};jumpBtn.addEventListener('pointerdown',jumpOn,{passive:false});jumpBtn.addEventListener('pointerup',jumpOff,{passive:false});jumpBtn.addEventListener('pointercancel',jumpOff,{passive:false});}
  G.overlay.querySelector('[data-ekl-interact]')?.addEventListener('pointerdown',e=>{e.preventDefault();ensureAudio();interact()},{passive:false});
  const sprint=G.overlay.querySelector('[data-ekl-sprint]');if(sprint){const on=e=>{e.preventDefault();ensureAudio();G.mobileSprint=true;sprint.classList.add('active')},off=e=>{e.preventDefault();G.mobileSprint=false;sprint.classList.remove('active')};sprint.addEventListener('pointerdown',on,{passive:false});sprint.addEventListener('pointerup',off,{passive:false});sprint.addEventListener('pointercancel',off,{passive:false});}
}
function resize(){if(!G.renderer||!G.camera||!G.overlay)return;const r=G.overlay.getBoundingClientRect(),vv=window.visualViewport;const w=Math.max(1,Math.round(vv?.width||r.width)),h=Math.max(1,Math.round(vv?.height||r.height));G.overlay.style.setProperty('--ekl-vw',`${w}px`);G.overlay.style.setProperty('--ekl-vh',`${h}px`);G.overlay.classList.toggle('ekl-landscape',w>h);G.renderer.setSize(r.width,r.height,false);G.camera.aspect=r.width/Math.max(1,r.height);G.camera.updateProjectionMatrix();}
function loop(){if(!G.overlay)return;const now=performance.now(),dt=Math.min(.034,Math.max(.001,(now-(G.lastFrameAt||now-16))/1000)),t=now/1000;G.lastFrameAt=now;updatePlatforms(t,dt);processMovement(dt,t);const planarSpeed=Math.hypot(G.moveVel.x,G.moveVel.z);G.character?.update?.({grounded:G.grounded,verticalVelocity:G.vel.y,planarSpeed,sprint:G.sprint||isOnTraining(),moving:planarSpeed>.12,treadmill:isOnTraining()},dt,t);detectInteraction();updateCamera(dt);updateTrail(dt);updateAura(t);G.hudClock+=dt;if(G.hudClock>.12){G.hudClock=0;updateHud()}G.renderer.render(G.scene,G.camera);G.raf=requestAnimationFrame(loop);}

function open(sourceDevice=''){
  if(G.overlay)return;if(sourceDevice)G.sourceDevice=String(sourceDevice);else G.sourceDevice=window.JKGamesOwnedPhoneItem?.()||'';loadProgress();const el=document.createElement('div');el.className='escape-kl-overlay';el.innerHTML=`<div class="ekl-stage"><div class="ekl-canvas"><canvas aria-label="Escape.kl 3D Jump and Run"></canvas></div><div class="ekl-vignette"></div><div class="ekl-hud"><div class="ekl-topbar"><div class="ekl-statrow"><div class="ekl-stat"><small>SPEED</small><b data-ekl-speed>0</b></div><div class="ekl-stat level"><small>LEVEL</small><b data-ekl-level>0</b></div><div class="ekl-stat"><small>LAUFPUNKTE</small><b data-ekl-runpoints>0</b></div><div class="ekl-stat"><small>WINS</small><b data-ekl-wins>0</b></div><div class="ekl-stat"><small>REBIRTH</small><b data-ekl-rebirths>0</b></div><div class="ekl-stat"><small>SPEED / SCHRITT</small><b data-ekl-gain>+1</b></div></div><div class="ekl-level-progress"><div><span>LEVEL-FORTSCHRITT</span><b data-ekl-level-next>NÄCHSTES LEVEL</b></div><i><span data-ekl-level-bar></span></i></div><div class="ekl-top-actions"><button data-ekl-help title="Hilfe">?</button><button data-ekl-pause title="Pause">Ⅱ</button><button data-ekl-close title="Top Games">×</button></div></div><div class="ekl-world-chip" hidden><small data-ekl-world>WORLD 1 · KEYBOARD LAB</small><b data-ekl-stage>STAGE 1/15</b><span data-ekl-next-win>NÄCHSTES WIN-PAD: +1 WIN</span></div><div class="ekl-stage-progress" hidden><div><span>WORLD-FORTSCHRITT</span><b data-ekl-stage-total>15 STAGES</b></div><i><span data-ekl-stage-bar></span></i></div><div class="ekl-run-pop" data-ekl-run-pop>+1 LAUFPUNKT</div><div class="ekl-prompt" data-ekl-prompt></div><div class="ekl-toast" data-ekl-toast></div><div class="ekl-touch"><div class="ekl-stick" data-ekl-stick><i class="ekl-stick-knob"></i></div><div class="ekl-touch-actions"><button class="sprint" data-ekl-sprint>SPRINT</button><button class="jump" data-ekl-jump>SPRINGEN</button><button class="interact" data-ekl-interact>AKTION</button></div></div></div></div>`;document.body.append(el);document.body.classList.add('escape-kl-open');G.overlay=el;setupScene();bindInput();el.querySelector('[data-ekl-close]').onclick=returnToTopGames;el.querySelector('[data-ekl-pause]').onclick=showPause;el.querySelector('[data-ekl-help]').onclick=showHelp;G.resizeHandler=()=>requestAnimationFrame(resize);G.orientationHandler=()=>setTimeout(resize,90);window.addEventListener('resize',G.resizeHandler,{passive:true});window.addEventListener('orientationchange',G.orientationHandler,{passive:true});window.visualViewport?.addEventListener('resize',G.resizeHandler,{passive:true});G.lastFrameAt=performance.now();G.raf=requestAnimationFrame(loop);setTimeout(()=>window.JKCoinApp?.applyPendingGameEntitlements?.(),500);console.info(`Escape.kl ${VERSION} aktiv`);
}
function close(){if(!G.overlay)return;clearTimeout(G.persistTimer);if(G.dirty)syncProgressToMain(true);cancelAnimationFrame(G.raf);document.removeEventListener('keydown',G.keyDown);document.removeEventListener('keyup',G.keyUp);window.removeEventListener('resize',G.resizeHandler);window.removeEventListener('orientationchange',G.orientationHandler);window.visualViewport?.removeEventListener('resize',G.resizeHandler);if(G.stickMove){window.removeEventListener('pointermove',G.stickMove);window.removeEventListener('pointerup',G.stickUp);window.removeEventListener('pointercancel',G.stickUp)}if(G.stickTouchMove){window.removeEventListener('touchmove',G.stickTouchMove);window.removeEventListener('touchend',G.stickTouchEnd);window.removeEventListener('touchcancel',G.stickTouchEnd)}closeModal();G.overlay.querySelector('[data-ekl-complete]')?.remove();G.renderer?.dispose();clearWorldObjects();G.character?.dispose?.();if(G.trail)G.scene?.remove(G.trail);G.trailParticles=[];disposeAll();try{G.audioCtx?.close?.()}catch{}G.overlay.remove();document.body.classList.remove('escape-kl-open');G.overlay=null;G.scene=null;G.camera=null;G.renderer=null;G.player=null;G.playerRoot=null;G.character=null;G.trail=null;G.audioCtx=null;G.keys.clear();G.mobileX=G.mobileY=0;G.mobileSprint=false;G.jumpHeld=false;G.jumpQueuedUntil=0;G.moveVel.set(0,0,0);G.paused=false;G.modalOpen=false;}
function returnToTopGames(){const source=G.sourceDevice||'';close();requestAnimationFrame(()=>window.JKGamesOpenTopGames?.(source));}
function getState(){loadProgress();return JSON.parse(JSON.stringify(G.state));}

window.EscapeKL={open,close,returnToTopGames,getState,grantJkCoinPurchase,canApplyJkPurchase,version:VERSION,worlds:WORLD_DEFS.map(w=>({...w}))};
