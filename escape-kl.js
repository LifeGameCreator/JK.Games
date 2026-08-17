import * as THREE from 'three';
import { ESCAPE_WORLD_DEFS as WORLD_DEFS, escapeWorldById } from './escape-kl-worlds.js?v=20260816-escape-v461';
import { buildKeyboardLabWorld } from './escape-kl-world-keyboard-lab.js?v=20260817-escape-v471-finish-circle-long-frame';
import { buildCandyKeysWorld } from './escape-kl-world-candy-keys.js?v=20260817-escape-v471-finish-circle-long-frame';
import { buildToxicKeyboardWorld } from './escape-kl-world-toxic-keyboard.js?v=20260817-escape-v471-finish-circle-long-frame';
import { createEscapeCharacter } from './escape-kl-character.js?v=20260816-escape-v457-animation-sync';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/* Escape.kl – JK.Games Top Game V477 · Dual-Pets + Follow-Animation */
const VERSION = '2026-08-17-v477';
const LOCAL_KEY = 'jk-games-escape-kl-v1';
const PLAYER_HALF = 0.82;
const PLAYER_RADIUS = 0.38;
const GRAVITY = 24;
const JUMP_VELOCITY = 8.4;
const MAX_FALL = -24;
const WORLD_FAIL_Y = -2.25;
const RUN_POINT_DISTANCE = .75;

// V443: Speed is a physical stat again. Regular players are hard-capped at 300 in every world.
// Level progression uses separate Training-Power (XP), so no millions/billions are shown as player Speed.
const REGULAR_SPEED_CAP = 300;
const OWNER_SPEED_SOFT_CAP = 9999;
const BASE_MOVE_SPEED = 5.0;
const MAX_REGULAR_MOVE_SPEED = 20.0; // Level 0 / Speed 5 starts at movement 5.0; Speed 300 reaches the hard +300% movement ceiling.
const START_SPEED_STAT = 5;
const SPRINT_SPEED_STAT_BONUS = 18;
const LEVEL_XP_SCALE = 60;
const LEVEL_XP_POWER = 2.15;
const TREADMILL_TICKS_PER_SECOND = 24;
const CAMERA_PITCH_MIN = -.18;
const CAMERA_PITCH_MAX = .78;
const TOUCH_LOOK_SENSITIVITY_X = .0062;
const TOUCH_LOOK_SENSITIVITY_Y = .0048;
const REVIVE_WINDOW_MS = 5000;
const REVIVE_COSTS = Object.freeze({'keyboard-lab':20,'candy-keys':20,'toxic-keyboard':20});
const DAY_NIGHT_CYCLE_SECONDS = 300;
const SKYRUN_SPEED_STAT = 100;
const SKYRUN_FINISH_REWARD = 50000;
const SKYRUN_MILESTONE_REWARDS = Object.freeze([250,500,1000,2000,3500,5000,7500,10000,15000]);
const ESCAPE_PRESENCE_COLLECTION = 'escapeKlPresenceV474';
const ESCAPE_ONLINE_ACTIVE_WRITE_MS = 1200;
const ESCAPE_ONLINE_SOLO_WRITE_MS = 5000;
const ESCAPE_ONLINE_HEARTBEAT_MS = 10000;
const ESCAPE_ONLINE_STALE_MS = 18000;
const ESCAPE_ONLINE_LIMIT = 16;
const ESCAPE_ONLINE_FALLBACK_POLL_MS = 2600;

const STEP_BUTTONS = Object.freeze([
  {tier:0,name:'+1 Power / Bewegung',cost:0,gain:1},
  {tier:1,name:'+2 Power / Bewegung',cost:3,gain:2},
  {tier:2,name:'+3 Power / Bewegung',cost:15,gain:3},
  {tier:3,name:'+25 Power / Bewegung',cost:100,gain:25},
  {tier:4,name:'+50 Power / Bewegung',cost:500,gain:50},
  {tier:5,name:'+100 Power / Bewegung',cost:2500,gain:100},
  {tier:6,name:'+250 Power / Bewegung',cost:15000,gain:250},
  {tier:7,name:'+500 Power / Bewegung',cost:50000,gain:500}
]);
const TRAILS = Object.freeze([
  {id:'none',name:'Keine Spur',cost:0,color:0xffffff,mult:1,effect:'none'},
  {id:'green',name:'Green Energy',cost:500,color:0x60f077,mult:1.05,effect:'energy'},
  {id:'blue',name:'Water Trail',cost:1500,color:0x5aa7ff,mult:1.08,effect:'water'},
  {id:'purple',name:'Magic Trail',cost:5000,color:0xa06cff,mult:1.12,effect:'magic'},
  {id:'red',name:'Fire Trail',cost:25000,color:0xff5b36,mult:1.16,effect:'fire'},
  {id:'rainbow',name:'Rainbow Trail',cost:100000,color:0xffcf55,mult:1.22,effect:'rainbow'},
  {id:'galaxy',name:'Galaxy Keyboard Trail',cost:0,color:0xbd78ff,mult:1.30,jk:true,effect:'galaxy'}
]);
const SPECIAL_CHARACTERS = Object.freeze([
  {id:'neon-runner',name:'Neon Runner',cost:25000,currency:'wins',baseGender:'male',color:0x43e8ff,desc:'JK.Games Spezialcharakter mit cyanfarbenem Runner-Effekt.'},
  {id:'flame-runner',name:'Flame Runner',cost:75000,currency:'wins',baseGender:'female',color:0xff743d,desc:'Spezialcharakter mit warmem Flame-Runner-Effekt.'},
  {id:'demon-transformation',name:'Dämonenverwandlung',cost:800,currency:'jk',baseGender:'male',color:0xbf6cff,desc:'Verwandelt dich in den gelieferten Dämonen-Charakter. Bonus: +1,5 % Speed und +1,5 % Wins.',speedBonus:.015,winsBonus:.015,asset:'./escape-demon-transformation.glb?v=20260816-escape-v452',galaxyAsset:'./escape-demon-transformation-galaxy.glb?v=20260816-escape-v454-red-galaxy',upgradeCost:1000,upgradeSpeedBonus:.025,upgradeWinsBonus:.025,upgradeName:'Galaxy-Skin-Upgrade'}
]);
const PET_DEFS = Object.freeze([
  {id:'none',name:'Kein Pet',cost:0,currency:'none',category:'none',speedBonus:0,winsBonus:0,desc:'Kein aktives Pet.'},
  {id:'cyclops-wing',name:'EYE Pet',cost:500,currency:'jk',category:'jk',speedBonus:.02,winsBonus:.02,asset:'./escape-pet-cyclops.glb?v=20260816-escape-v452',movement:'orbit',targetHeight:.80,desc:'Fliegendes Eye-Pet. Gibt +2 % Speed und +2 % Wins.'},
  {id:'reptisect',name:'Reptisect',cost:600,currency:'jk',category:'jk',speedBonus:.015,winsBonus:.015,asset:'./escape-pet-reptisect.glb?v=20260817-escape-v477',movement:'ground-follow',targetHeight:.72,animationHint:/niet|basic|walk|run|move/i,desc:'Animiertes Lauf-Pet. Folgt dir mit leichter Verzögerung. +1,5 % Speed und +1,5 % Wins.'},
  {id:'phoenix',name:'Phönix',cost:3000,currency:'jk',category:'jk',speedBonus:.03,winsBonus:.025,asset:'./escape-pet-phoenix.glb?v=20260817-escape-v477-optimized',movement:'fly-follow',targetHeight:1.02,animationHint:/fly|flight|take|wing/i,desc:'Premium-Flug-Pet. Fliegt dir weich hinterher und steigt beim Springen mit. +3,0 % Speed und +2,5 % Wins.'}
]);
const AURAS = Object.freeze([
  {id:'none',name:'Keine Aura',cost:0,color:0xffffff,mult:1,speedPct:0},
  {id:'medal',name:'Medal Aura',cost:0,color:0xffd45e,mult:1.08,speedPct:.005,questRunPoints:2500},
  {id:'glow',name:'Glow Aura',cost:1000000,color:0x72e8ff,mult:1.10,speedPct:.0075},
  {id:'wind',name:'Wind Aura',cost:5000000,color:0xc3f4ff,mult:1.14,speedPct:.01},
  {id:'water',name:'Water Aura',cost:10000000,color:0x55aaff,mult:1.18,speedPct:.015},
  {id:'fire',name:'Fire Aura',cost:25000000,color:0xff714d,mult:1.25,speedPct:.02}
]);
const REBIRTH_TABLE = Object.freeze([
  {level:500,mult:1.15},{level:650,mult:1.30},{level:800,mult:1.45},{level:900,mult:1.60},
  {level:1000,mult:1.80},{level:1125,mult:2.00},{level:1250,mult:2.25},{level:1400,mult:2.50},
  {level:1600,mult:2.80},{level:1850,mult:3.10},{level:2150,mult:3.50},{level:2500,mult:4.00}
]);
const SPEED_ITEMS = Object.freeze([
  {id:'speed25',name:'Speed Chip',pct:.004,maxLevel:5,baseCost:1000,scale:1.55,icon:'⚡',desc:'+0,4 % effektiver Speed pro Stufe'},
  {id:'speed50',name:'Turbo Chip',pct:.007,maxLevel:5,baseCost:5000,scale:1.65,icon:'⚡⚡',desc:'+0,7 % effektiver Speed pro Stufe'},
  {id:'speed100',name:'Hyper Chip',pct:.010,maxLevel:5,baseCost:25000,scale:1.75,icon:'🚀',desc:'+1,0 % effektiver Speed pro Stufe'}
]);
const CORE_UPGRADES = Object.freeze({
  training:Object.freeze([
    {tier:1,cost:2500,bonus:.03,name:'Training Core I'},{tier:2,cost:15000,bonus:.06,name:'Training Core II'},{tier:3,cost:75000,bonus:.09,name:'Training Core III'}
  ]),
  treadmill:Object.freeze([
    {tier:1,cost:10000,bonus:.05,name:'Treadmill Core I'},{tier:2,cost:50000,bonus:.10,name:'Treadmill Core II'},{tier:3,cost:250000,bonus:.15,name:'Treadmill Core III'}
  ]),
  speed:Object.freeze([
    {tier:1,cost:10000,bonus:.01,name:'Speed Core I'},{tier:2,cost:75000,bonus:.02,name:'Speed Core II'},{tier:3,cost:300000,bonus:.03,name:'Speed Core III'}
  ]),
  win:Object.freeze([
    {tier:1,cost:5000,bonus:.01,name:'Win Core I'},{tier:2,cost:30000,bonus:.02,name:'Win Core II'},{tier:3,cost:150000,bonus:.03,name:'Win Core III'}
  ])
});
const TREADMILLS = Object.freeze([
  {id:'starter',name:'FREE',mult:1.30,color:0x2f8d78,access:'free',desc:'Starter-Laufband · immer verfügbar',hubPhysical:true},
  {id:'free-plus',name:'FREE+',mult:1.60,color:0x4d879f,access:'level',level:120,desc:'Kostenlos ab Level 120 der aktiven Trainingswelt',hubPhysical:true},
  {id:'silver',name:'SILBER',mult:2.00,color:0x9faeb8,access:'wins',cost:8000,desc:'Mit Wins dauerhaft freischaltbar',hubPhysical:true},
  {id:'gold',name:'GOLD',mult:2.80,color:0xd6a83a,access:'jk',jkTier:1,jkCost:250,desc:'Premium-Laufband · JK/Coin',hubPhysical:true},
  {id:'diamond',name:'DIAMOND',mult:4.00,color:0x5bdcff,access:'jk',jkTier:2,jkCost:850,desc:'Stärkstes reguläres Hub-Laufband',hubPhysical:true},
  {id:'galaxy',name:'GALAXY',mult:6.00,color:0xa85cff,access:'jk',jkCost:1200,desc:'Kosmisches Spawn-Laufband · nur über Pause → Laufband erzeugbar',portableOnly:true},
  {id:'admin',name:'ADMIN',mult:10.00,color:0xff496d,access:'jk',jkCost:2000,desc:'Maximales Spawn-Laufband · nur über Pause → Laufband erzeugbar',portableOnly:true}
]);

const G = {
  overlay:null, scene:null, camera:null, renderer:null, raf:0, lastFrameAt:0,
  sourceDevice:'', state:null, dirty:false, persistTimer:0, lastLocalSave:0,
  player:null, playerRoot:null, character:null, trail:null, trailPoints:[],trailParticles:[],trailEmitCarry:0,auraGroup:null, auraRings:[],specialFxGroup:null, petVisuals:[], petLoadSeq:0, formModel:null, formWrapper:null, formMixer:null, formActions:null, formAction:null, formLoadSeq:0, gltfLoader:null,
  platforms:[], interactables:[], decorative:[], portalFx:[], colliders:[], hazards:[],
  world:'hub', stage:0, checkpoint:null, deaths:0, runStartedAt:0, runFinished:false, stageClaims:new Set(),
  pos:new THREE.Vector3(0,1.08,8), vel:new THREE.Vector3(), moveVel:new THREE.Vector3(), grounded:false, support:null,lastSupport:null,
  keys:new Set(), inputX:0, inputY:0, mobileX:0, mobileY:0, sprint:false,mobileSprint:false,moveIntensity:0,jumpHeld:false,jumpQueuedUntil:0,lastGroundedAt:0,coyoteAvailable:false,
  yaw:0, pitch:.32, camDistance:7.2, pointer:null,lookPointer:null,lookTouchId:null,
  keyDown:null,keyUp:null,resizeHandler:null,orientationHandler:null,pointerMove:null,pointerUp:null,stickMove:null,stickUp:null,stickTouchMove:null,stickTouchEnd:null,lookTouchMove:null,lookTouchEnd:null,
  lastGroundPos:new THREE.Vector3(), reviveAnchor:new THREE.Vector3(),reviveSupport:null,reviveOffsetX:0,reviveOffsetZ:0,reviveYaw:0,reviveStage:1,reviveStageClaims:null,reviveOfferAnchor:new THREE.Vector3(),reviveOfferSupport:null,reviveOfferOffsetX:0,reviveOfferOffsetZ:0,reviveOfferYaw:0,reviveOfferStage:1,reviveOfferStageClaims:null,revivePending:false,reviveTimer:0,reviveTicker:0,reviveStartedAt:0, speedDistanceCarry:0, trainingCarry:0, runPopTimer:0, lastLevelShown:0,
  prompt:null, activeInteractable:null, toastTimer:0, paused:false, modalOpen:false,
  particleClock:0, movingClock:0, hudClock:0, trailClock:0,footstepClock:0,landingPulse:0,
  runCombo:0,comboLastAt:0,comboVisited:new Set(),perfectLandingClaims:new Set(),trainingStreakSeconds:0,trainingStreakTier:0,
  hitboxDebugEnabled:false,hitboxDebugGroup:null,hitboxDebugItems:[],hitboxDebugPlayer:null,
  summonedTreadmill:null,
  hemiLight:null,sunLight:null,hubSkyDome:null,hubStars:null,hubMoon:null,hubSun:null,hubAuroraMats:[],lastDayNightMode:'',
  materials:new Map(), geometries:new Map(), textures:new Map(),buildScope:'hub',autoTriggers:[],triggerLocks:new Map(),runFurthestZ:-70,
  audioCtx:null,audioUnlocked:false,lastMotionLabel:'IDLE',
  onlineFb:null,onlineUser:null,onlineSessionId:'',onlineUnsub:null,onlineWorld:'',onlineTickTimer:0,onlinePollTimer:0,onlineReconnectTimer:0,
  onlineLastWriteAt:0,onlineLastKey:'',onlineWriteInFlight:false,onlineStatus:'offline',onlineLastError:'',remotePlayers:new Map(),
  tmpV:new THREE.Vector3(), tmpV2:new THREE.Vector3(),tmpV3:new THREE.Vector3()
};


function onlineLerpAngle(a,b,t){const d=Math.atan2(Math.sin(b-a),Math.cos(b-a));return a+d*Math.max(0,Math.min(1,t));}
function escapeOnlineDisplayName(){
  try{
    const root=window.JKGamesGetActiveState?.()||{};
    const direct=String(root.displayName||root.name||'').trim();
    if(direct)return direct.slice(0,50);
    const first=String(root.firstName||root.player?.firstName||'').trim(),last=String(root.lastName||root.player?.lastName||'').trim();
    const combined=`${first} ${last}`.trim();if(combined)return combined.slice(0,50);
  }catch{}
  return String(G.onlineUser?.displayName||'Spieler').trim().slice(0,50)||'Spieler';
}
function setEscapeOnlineHud(status=G.onlineStatus,count=1,message=''){
  G.onlineStatus=status;const el=G.overlay?.querySelector?.('[data-ekl-online]');if(!el)return;
  const total=Math.max(1,Math.floor(Number(count)||1)),online=status==='online',connecting=status==='connecting';
  el.textContent=online?`● ${total}`:connecting?'● …':'○ OFF';
  el.title=message||(online?`${total} Spieler in dieser Escape-Welt · Firebase Live`:`Escape Multiplayer ${connecting?'verbindet':'offline'}`);
  el.style.color=online?'#8dffb0':connecting?'#ffe08a':'#a7b2c1';
  el.style.borderColor=online?'rgba(89,255,140,.35)':connecting?'rgba(255,214,105,.34)':'rgba(170,185,204,.24)';
}
function escapeOnlinePresencePath(uid=G.onlineUser?.uid){return uid?`${ESCAPE_PRESENCE_COLLECTION}/${uid}`:'';}
function escapeOnlinePresencePayload(online=true){
  const choice=String(G.state?.characterChoice||'male').slice(0,40),gender=characterBaseGender(choice);
  const speed=Math.max(0,Math.min(10000,Number(currentSpeedStat()||0)));
  return {
    uid:String(G.onlineUser?.uid||'').slice(0,128),
    sessionId:String(G.onlineSessionId||'').slice(0,80),
    online:!!online,worldId:String(G.world||'hub').slice(0,40),
    x:Number((G.pos?.x||0).toFixed(3)),y:Number((G.pos?.y||0).toFixed(3)),z:Number((G.pos?.z||0).toFixed(3)),
    yaw:Number((G.playerRoot?.rotation?.y||0).toFixed(4)),
    vx:Number((G.moveVel?.x||0).toFixed(3)),vy:Number((G.vel?.y||0).toFixed(3)),vz:Number((G.moveVel?.z||0).toFixed(3)),
    grounded:!!G.grounded,sprint:!!G.sprint,speed:Number(speed.toFixed(2)),stage:Math.max(0,Math.min(500,Math.floor(Number(G.stage)||0))),
    gender,characterChoice:choice,displayName:escapeOnlineDisplayName(),updatedAtMs:Date.now(),version:VERSION
  };
}
function escapeOnlinePresenceKey(payload){
  return `${payload.worldId}|${Math.round(payload.x*20)}|${Math.round(payload.y*20)}|${Math.round(payload.z*20)}|${Math.round(payload.yaw*25)}|${payload.grounded?1:0}|${payload.sprint?1:0}|${payload.characterChoice}`;
}
async function publishEscapePresence(force=false,online=true){
  if(!G.overlay||!G.onlineFb||!G.onlineUser?.uid||G.onlineWriteInFlight)return false;
  const now=Date.now();
  if(!force&&now<Number(G.onlinePermissionRetryAt||0))return false;
  const fb=G.onlineFb;if(typeof fb.presenceSetRest!=='function')return false;
  const payload=escapeOnlinePresencePayload(online),key=escapeOnlinePresenceKey(payload),activePeers=G.remotePlayers.size>0;
  const minGap=activePeers?ESCAPE_ONLINE_ACTIVE_WRITE_MS:ESCAPE_ONLINE_SOLO_WRITE_MS;
  const changed=key!==G.onlineLastKey,heartbeat=now-G.onlineLastWriteAt>=ESCAPE_ONLINE_HEARTBEAT_MS;
  if(!force&&(!changed||now-G.onlineLastWriteAt<minGap)&&!heartbeat)return false;
  G.onlineWriteInFlight=true;
  try{
    await fb.presenceSetRest(escapeOnlinePresencePath(),payload,{timeoutMs:6500});
    G.onlineLastWriteAt=Date.now();G.onlineLastKey=key;G.onlineLastError='';
    return true;
  }catch(error){
    G.onlineLastError=String(error?.message||error||'');
    const denied=/403|permission[_ -]?denied|missing or insufficient permissions/i.test(G.onlineLastError);
    if(denied){
      G.onlinePermissionRetryAt=Date.now()+30000;
      const last=Number(G.onlinePermissionWarnAt||0);
      if(Date.now()-last>28000){
        G.onlinePermissionWarnAt=Date.now();
        console.warn('Escape.kl Multiplayer: Firestore-Presence ist in Datenbank gamekl noch nicht freigeschaltet. Bitte V474 firestore.rules fuer gamekl veroeffentlichen.');
      }
      setEscapeOnlineHud('offline',1+G.remotePlayers.size,'Firebase-Regel fuer Escape Presence fehlt/ist noch nicht aktiv · neuer Versuch in 30 s');
    }else if(!/abort|offline|network/i.test(G.onlineLastError))console.warn('Escape.kl Presence schreiben',error);
    return false;
  }finally{G.onlineWriteInFlight=false}
}
function disposeRemotePlayer(remote){
  if(!remote)return;try{remote.character?.dispose?.()}catch{}
  try{remote.label?.material?.map?.dispose?.()}catch{}try{remote.label?.material?.dispose?.()}catch{}
  try{remote.group?.removeFromParent?.()}catch{}
}
function removeEscapeRemotePlayer(uid){
  const remote=G.remotePlayers.get(uid);if(!remote)return;disposeRemotePlayer(remote);G.remotePlayers.delete(uid);
  setEscapeOnlineHud(G.onlineStatus,1+G.remotePlayers.size);
}
function clearEscapeRemotePlayers(){for(const uid of [...G.remotePlayers.keys()])removeEscapeRemotePlayer(uid);G.remotePlayers.clear();}
function makeEscapeRemoteLabel(name){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,512,96);ctx.fillStyle='rgba(4,12,22,.80)';ctx.beginPath();ctx.roundRect?.(10,12,492,70,24);if(ctx.roundRect)ctx.fill();else ctx.fillRect(10,12,492,70);
  ctx.font='700 30px system-ui,Segoe UI,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#f7fbff';ctx.fillText(String(name||'Spieler').slice(0,28),256,47);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const mat=new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false,depthTest:true});
  const sprite=new THREE.Sprite(mat);sprite.scale.set(3.8,.72,1);sprite.position.set(0,1.38,0);sprite.renderOrder=30;return sprite;
}
function createEscapeRemotePlayer(uid,data){
  const group=new THREE.Group();group.name=`escape-remote-${uid}`;group.position.set(Number(data.x)||0,Number(data.y)||1,Number(data.z)||0);
  const gender=data.gender==='female'?'female':'male',character=createEscapeCharacter({gender,floorOffset:PLAYER_HALF});
  group.add(character.root);const label=makeEscapeRemoteLabel(data.displayName||'Spieler');group.add(label);G.scene?.add(group);
  const remote={uid,group,character,label,gender,name:String(data.displayName||'Spieler'),target:new THREE.Vector3(group.position.x,group.position.y,group.position.z),velocity:new THREE.Vector3(),targetYaw:Number(data.yaw)||0,grounded:!!data.grounded,sprint:!!data.sprint,speed:Number(data.speed)||0,serverUpdatedAt:Number(data.updatedAtMs)||Date.now(),receivedAt:performance.now(),sessionId:String(data.sessionId||'')};
  G.remotePlayers.set(uid,remote);return remote;
}
function updateEscapeRemoteFromData(uid,data){
  if(!uid||uid===G.onlineUser?.uid||!data||data.online!==true||String(data.worldId||'')!==String(G.world||''))return;
  const updatedAt=Math.max(0,Number(data.updatedAtMs)||0);if(!updatedAt||Date.now()-updatedAt>ESCAPE_ONLINE_STALE_MS){removeEscapeRemotePlayer(uid);return}
  let remote=G.remotePlayers.get(uid),gender=data.gender==='female'?'female':'male';
  if(!remote)remote=createEscapeRemotePlayer(uid,data);
  if(remote.gender!==gender){disposeRemotePlayer(remote);G.remotePlayers.delete(uid);remote=createEscapeRemotePlayer(uid,data)}
  const newSession=remote.sessionId&&String(data.sessionId||'')!==remote.sessionId;
  const next=new THREE.Vector3(Number(data.x)||0,Number(data.y)||0,Number(data.z)||0);
  if(newSession||next.distanceTo(remote.group.position)>30)remote.group.position.copy(next);
  remote.target.copy(next);remote.velocity.set(Number(data.vx)||0,Number(data.vy)||0,Number(data.vz)||0);
  remote.targetYaw=Number(data.yaw)||0;remote.grounded=!!data.grounded;remote.sprint=!!data.sprint;remote.speed=Math.max(0,Number(data.speed)||0);
  remote.serverUpdatedAt=updatedAt;remote.receivedAt=performance.now();remote.sessionId=String(data.sessionId||'');
  const name=String(data.displayName||'Spieler').slice(0,50);
  if(name&&name!==remote.name){remote.name=name;try{remote.label?.material?.map?.dispose?.();remote.label?.material?.dispose?.()}catch{}remote.label?.removeFromParent?.();remote.label=makeEscapeRemoteLabel(name);remote.group.add(remote.label)}
}
function applyEscapePresenceRows(rows){
  const seen=new Set(),now=Date.now();
  for(const row of rows||[]){
    const uid=String(row?.id||row?.uid||row?.data?.uid||''),data=typeof row?.data==='function'?row.data():row?.data||row;
    if(!uid||uid===G.onlineUser?.uid)continue;
    if(data?.online===true&&String(data.worldId||'')===String(G.world||'')&&now-Number(data.updatedAtMs||0)<=ESCAPE_ONLINE_STALE_MS){seen.add(uid);updateEscapeRemoteFromData(uid,data)}
  }
  for(const uid of [...G.remotePlayers.keys()])if(!seen.has(uid))removeEscapeRemotePlayer(uid);
  setEscapeOnlineHud('online',1+G.remotePlayers.size,'Firebase Live · Positionen werden lokal weich interpoliert');
}
function stopEscapePresencePolling(){if(G.onlinePollTimer){clearInterval(G.onlinePollTimer);G.onlinePollTimer=0}}
async function pollEscapePresenceOnce(){
  if(!G.onlineFb?.presenceQueryRest||!G.onlineUser?.uid||!G.overlay)return false;
  try{
    const rows=await G.onlineFb.presenceQueryRest(ESCAPE_PRESENCE_COLLECTION,{field:'worldId',equals:G.world,limit:ESCAPE_ONLINE_LIMIT});
    applyEscapePresenceRows(rows);return true;
  }catch(error){G.onlineLastError=String(error?.message||error||'');setEscapeOnlineHud('offline',1+G.remotePlayers.size,'Firebase Live-Abfrage wird erneut versucht');return false}
}
function startEscapePresencePolling(){
  if(G.onlinePollTimer||!G.overlay)return;pollEscapePresenceOnce();G.onlinePollTimer=setInterval(()=>pollEscapePresenceOnce(),ESCAPE_ONLINE_FALLBACK_POLL_MS);
}
function clearEscapeOnlineListener(){
  try{G.onlineUnsub?.()}catch{}G.onlineUnsub=null;stopEscapePresencePolling();
  if(G.onlineReconnectTimer){clearTimeout(G.onlineReconnectTimer);G.onlineReconnectTimer=0}
}
function subscribeEscapePresenceWorld(){
  if(!G.overlay||!G.onlineFb||!G.onlineUser?.uid)return false;
  clearEscapeOnlineListener();clearEscapeRemotePlayers();G.onlineWorld=String(G.world||'hub');
  setEscapeOnlineHud('connecting',1,'Firebase-Spieler dieser Welt werden geladen …');
  const fb=G.onlineFb;
  try{
    const q=fb.query(fb.collection(fb.db,ESCAPE_PRESENCE_COLLECTION),fb.where('worldId','==',G.onlineWorld),fb.limit(ESCAPE_ONLINE_LIMIT));
    G.onlineUnsub=fb.onSnapshot(q,(snapshot)=>{
      if(!G.overlay||String(G.world||'')!==G.onlineWorld)return;
      applyEscapePresenceRows(snapshot.docs.map(doc=>({id:doc.id,data:doc.data()})));
    },(error)=>{
      if(!G.overlay)return;G.onlineLastError=String(error?.message||error||'');console.warn('Escape.kl Firebase Live-Listener · REST-Fallback aktiv',error);
      try{G.onlineUnsub?.()}catch{}G.onlineUnsub=null;startEscapePresencePolling();
      G.onlineReconnectTimer=setTimeout(()=>{G.onlineReconnectTimer=0;if(G.overlay&&G.onlineFb)subscribeEscapePresenceWorld()},12000);
    });
    return true;
  }catch(error){
    G.onlineLastError=String(error?.message||error||'');startEscapePresencePolling();return false;
  }
}
async function connectEscapeMultiplayer(){
  if(!G.overlay||G.onlineUser?.uid)return true;
  const core=window.LifeBuilderFirebaseCore;if(!core?.load){setEscapeOnlineHud('offline',1,'Firebase Runtime fehlt');return false}
  setEscapeOnlineHud('connecting',1,'Firebase-Anmeldung …');
  try{
    const fb=await core.load(),user=await core.waitForAuth?.(6500);
    if(!G.overlay)return false;if(!fb||!user?.uid){setEscapeOnlineHud('offline',1,'Für Online-Multiplayer bitte mit JK.Games anmelden');return false}
    G.onlineFb=fb;G.onlineUser=user;G.onlineSessionId=crypto?.randomUUID?.()||`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
    await publishEscapePresence(true,true);subscribeEscapePresenceWorld();
    if(G.onlineTickTimer)clearInterval(G.onlineTickTimer);
    G.onlineTickTimer=setInterval(()=>publishEscapePresence(false,true),250);
    setEscapeOnlineHud('online',1,'Firebase Online-Multiplayer verbunden');return true;
  }catch(error){
    G.onlineLastError=String(error?.message||error||'');console.warn('Escape.kl Multiplayer konnte nicht starten',error);setEscapeOnlineHud('offline',1,'Escape startet offline · Firebase wird beim nächsten Öffnen erneut versucht');return false;
  }
}
function refreshEscapeMultiplayerWorld(){
  if(!G.onlineUser?.uid||!G.onlineFb||!G.overlay)return;
  G.onlineLastKey='';publishEscapePresence(true,true).finally(()=>{if(G.overlay&&G.onlineFb)subscribeEscapePresenceWorld()});
}
function stopEscapeMultiplayer(markOffline=true){
  if(G.onlineTickTimer){clearInterval(G.onlineTickTimer);G.onlineTickTimer=0}clearEscapeOnlineListener();clearEscapeRemotePlayers();
  const fb=G.onlineFb,path=escapeOnlinePresencePath();
  if(markOffline&&fb&&path){
    const payload=escapeOnlinePresencePayload(false);
    // Normaler Exit löscht das eine Presence-Dokument vollständig. Nur falls der
    // DELETE beim Browser-Schließen nicht mehr durchkommt, bleibt online:false als
    // Fallback. So sammeln sich keine alten Offline-Dokumente in Firebase an.
    fb.presenceDeleteRest?.(path,{timeoutMs:2500,keepalive:true}).catch(()=>fb.presenceSetRest?.(path,payload,{timeoutMs:2500,keepalive:true}).catch(()=>{}));
  }
  G.onlineFb=null;G.onlineUser=null;G.onlineWorld='';G.onlineLastKey='';G.onlineLastWriteAt=0;G.onlineWriteInFlight=false;G.onlineStatus='offline';
}
function updateEscapeRemotePlayers(dt,t){
  const nowPerf=performance.now(),now=Date.now(),pred=new THREE.Vector3();
  for(const [uid,remote] of [...G.remotePlayers]){
    if(now-remote.serverUpdatedAt>ESCAPE_ONLINE_STALE_MS){removeEscapeRemotePlayer(uid);continue}
    const age=Math.max(0,Math.min(1.0,(nowPerf-remote.receivedAt)/1000));pred.copy(remote.target).addScaledVector(remote.velocity,age*.72);
    const distance=remote.group.position.distanceTo(pred),alpha=distance>12?1:1-Math.exp(-dt*9.5);
    remote.group.position.lerp(pred,alpha);remote.character.root.rotation.y=onlineLerpAngle(remote.character.root.rotation.y,remote.targetYaw,1-Math.exp(-dt*12));
    const planar=Math.hypot(remote.velocity.x,remote.velocity.z);
    remote.character.update?.({grounded:remote.grounded,verticalVelocity:remote.velocity.y,planarSpeed:planar,sprint:remote.sprint,moving:planar>.12,treadmill:false,animationRate:1},dt,t);
  }
}

function emptyWorldProgress(){return {xp:0,itemSpeedBonus:0,adminSpeedOverride:null};}
function defaultProgress(){
  return {
    version:12,speed:0,wins:0,lifetimeWins:0,stageWinsCollected:0,runPoints:0,rebirths:0,stepButtonTier:0,bestRunCombo:0,
    trail:'none',ownedTrails:['none'],trailPlacement:'feet',aura:'none',ownedAuras:['none'],worldsUnlocked:['keyboard-lab'],
    worldProgress:{'keyboard-lab':emptyWorldProgress(),'candy-keys':emptyWorldProgress(),'toxic-keyboard':emptyWorldProgress()},activeTrainingWorld:'keyboard-lab',
    ownedTreadmills:['starter'],ownerEventMultiplier:1,
    characterChoice:'male',ownedSpecialCharacters:[],demonGalaxyUpgrade:false,
    activePet:'none',activePets:[],ownedPets:['none'],
    trainingCoreTier:0,treadmillCoreTier:0,speedCoreTier:0,winCoreTier:0,
    worldStars:{},bestTimes:{},completions:{},hiddenKeys:{},totalDistance:0,
    lastWheelAt:0,dailyQuest:null,jkTreadmillTier:0,jkSpeedBoostUntil:0,speedItems:{speed25:0,speed50:0,speed100:0},speedItemPurchases:{speed25:0,speed50:0,speed100:0},speedItemLevels:{speed25:0,speed50:0,speed100:0},lastPlayedAt:Date.now()
  };
}
function normalizeProgress(raw){
  const source=raw&&typeof raw==='object'?raw:{};
  const sourceVersion=Math.max(0,Math.floor(Number(source.version)||0));
  const d={...defaultProgress(),...source};
  const legacySpeed=Math.max(0,Number(source.speed)||0);
  d.speed=0; // legacy field stays only for backwards-compatible serialization; V443 uses worldProgress.
  d.wins=Math.max(0,Math.floor(Number(d.wins)||0));
  d.lifetimeWins=Math.max(d.wins,Math.floor(Number(d.lifetimeWins)||0));
  d.stageWinsCollected=Math.max(0,Math.floor(Number(d.stageWinsCollected)||0));
  d.runPoints=Math.max(0,Math.floor(Number(d.runPoints)||0));
  d.bestRunCombo=Math.max(0,Math.floor(Number(d.bestRunCombo)||0));
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
  d.demonGalaxyUpgrade=!!d.demonGalaxyUpgrade;
  if(SPECIAL_CHARACTERS.some(c=>c.id===d.characterChoice)&&!d.ownedSpecialCharacters.includes(d.characterChoice))d.characterChoice=mainGender;
  d.ownedPets=Array.isArray(d.ownedPets)?[...new Set(d.ownedPets.filter(id=>PET_DEFS.some(p=>p.id===id)))]:['none'];
  if(!d.ownedPets.includes('none'))d.ownedPets.unshift('none');
  const legacyPet=d.ownedPets.includes(d.activePet)&&d.activePet!=='none'?d.activePet:'';
  const requestedPets=Array.isArray(d.activePets)?d.activePets:(legacyPet?[legacyPet]:[]);
  d.activePets=[...new Set(requestedPets.filter(id=>id!=='none'&&d.ownedPets.includes(id)&&PET_DEFS.some(p=>p.id===id)))].slice(0,2);
  d.activePet=d.activePets[0]||'none';
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
  d.speedItems=d.speedItems&&typeof d.speedItems==='object'?d.speedItems:{};
  d.speedItemPurchases=d.speedItemPurchases&&typeof d.speedItemPurchases==='object'?d.speedItemPurchases:{};
  d.speedItemLevels=d.speedItemLevels&&typeof d.speedItemLevels==='object'?d.speedItemLevels:{};
  for(const item of SPEED_ITEMS){
    d.speedItems[item.id]=Math.max(0,Math.floor(Number(d.speedItems[item.id])||0));
    d.speedItemPurchases[item.id]=Math.max(0,Math.floor(Number(d.speedItemPurchases[item.id])||0));
    d.speedItemLevels[item.id]=Math.max(0,Math.min(item.maxLevel||5,Math.floor(Number(d.speedItemLevels[item.id])||0)));
  }
  d.worldProgress=d.worldProgress&&typeof d.worldProgress==='object'?d.worldProgress:{};
  for(const w of WORLD_DEFS.filter(x=>!x.locked)){
    const src=d.worldProgress[w.id]&&typeof d.worldProgress[w.id]==='object'?d.worldProgress[w.id]:{};
    const rawAdminOverride=src.adminSpeedOverride;
    const validAdminOverride=rawAdminOverride!==null&&rawAdminOverride!==undefined&&rawAdminOverride!==''&&Number.isFinite(Number(rawAdminOverride));
    d.worldProgress[w.id]={
      xp:Math.max(0,Number(src.xp)||0),
      itemSpeedBonus:Math.max(0,Number(src.itemSpeedBonus)||0),
      // null means: no Owner/Admin override. Never coerce null to numeric 0.
      // Old V449 saves may contain 0 because of that coercion bug; treat 0 as "no override"
      // so normal Level -> Speed progression becomes visible again immediately.
      adminSpeedOverride:validAdminOverride&&Number(rawAdminOverride)>0?Math.max(0,Number(rawAdminOverride)):null
    };
  }
  d.activeTrainingWorld=escapeWorldById(d.activeTrainingWorld)&&!escapeWorldById(d.activeTrainingWorld)?.locked?d.activeTrainingWorld:'keyboard-lab';
  d.ownedTreadmills=Array.isArray(d.ownedTreadmills)?[...new Set(d.ownedTreadmills.filter(id=>TREADMILLS.some(t=>t.id===id)))]:['starter'];
  if(!d.ownedTreadmills.includes('starter'))d.ownedTreadmills.unshift('starter');
  // Legacy JK tiers remain valid, but V463 stores each premium treadmill explicitly so
  // Galaxy and Admin can be bought independently without auto-unlocking each other.
  if(d.jkTreadmillTier>=1&&!d.ownedTreadmills.includes('gold'))d.ownedTreadmills.push('gold');
  if(d.jkTreadmillTier>=2&&!d.ownedTreadmills.includes('diamond'))d.ownedTreadmills.push('diamond');
  d.ownerEventMultiplier=[1,2,3,5,10,25,50,100].includes(Number(d.ownerEventMultiplier))?Number(d.ownerEventMultiplier):1;
  d.trainingCoreTier=Math.max(0,Math.min(3,Math.floor(Number(d.trainingCoreTier)||0)));
  d.treadmillCoreTier=Math.max(0,Math.min(3,Math.floor(Number(d.treadmillCoreTier)||0)));
  d.speedCoreTier=Math.max(0,Math.min(3,Math.floor(Number(d.speedCoreTier)||0)));
  d.winCoreTier=Math.max(0,Math.min(3,Math.floor(Number(d.winCoreTier)||0)));

  // One-time V443 migration: preserve a sensible fraction of old progress without carrying
  // millions/billions of legacy Speed into the new 0–300 physical-speed system.
  if(sourceVersion<9){
    const oldLevel=legacySpeed>0?Math.max(0,Math.floor(Math.pow(legacySpeed/25,1/2.3))):0;
    const migratedLevel=Math.min(1000,oldLevel);
    const factor=Number(escapeWorldById('keyboard-lab')?.progressionFactor)||1;
    d.worldProgress['keyboard-lab'].xp=Math.max(d.worldProgress['keyboard-lab'].xp,Math.round(LEVEL_XP_SCALE*Math.pow(migratedLevel,LEVEL_XP_POWER)*factor));
    d.worldProgress['keyboard-lab'].itemSpeedBonus=0;d.worldProgress['keyboard-lab'].adminSpeedOverride=null;
    d.worldProgress['candy-keys']=emptyWorldProgress();d.worldProgress['toxic-keyboard']=emptyWorldProgress();
    d.worldsUnlocked=['keyboard-lab'];d.activeTrainingWorld='keyboard-lab';
  }
  // V462 Balance-Migration: alte direkte Speed-Item-Punkte würden die neue
  // prozentuale Balance umgehen. Sie werden entfernt; wer bereits direkte
  // Speed-Items benutzt hatte, erhält als faire Migration eine Speed-Chip-Stufe.
  if(sourceVersion<11){
    let hadLegacyDirectSpeed=false;
    for(const w of WORLD_DEFS.filter(x=>!x.locked)){
      const p=d.worldProgress[w.id];
      if(Number(p?.itemSpeedBonus||0)>0)hadLegacyDirectSpeed=true;
      if(p)p.itemSpeedBonus=0;
    }
    if(hadLegacyDirectSpeed&&Object.values(d.speedItemLevels).every(v=>Number(v||0)===0))d.speedItemLevels.speed25=1;
  }
  d.version=12;
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
function progressWorldId(){
  if(isEscapeWorld())return G.world;
  return escapeWorldById(G.state?.activeTrainingWorld)&&!escapeWorldById(G.state?.activeTrainingWorld)?.locked?G.state.activeTrainingWorld:'keyboard-lab';
}
function progressForWorld(id=progressWorldId()){
  if(!G.state)return emptyWorldProgress();
  if(!G.state.worldProgress||typeof G.state.worldProgress!=='object')G.state.worldProgress={};
  if(!G.state.worldProgress[id])G.state.worldProgress[id]=emptyWorldProgress();
  return G.state.worldProgress[id];
}
function worldProgressionFactor(id=progressWorldId()){return Math.max(1,Number(escapeWorldById(id)?.progressionFactor)||1);}
function powerForLevel(level,id=progressWorldId()){
  level=Math.max(0,Math.floor(Number(level)||0));if(level<=0)return 0;
  return Math.max(1,Math.round(LEVEL_XP_SCALE*Math.pow(level,LEVEL_XP_POWER)*worldProgressionFactor(id)));
}
function currentLevel(id=progressWorldId()){
  const xp=Math.max(0,Number(progressForWorld(id).xp)||0);if(xp<=0)return 0;
  return Math.max(0,Math.floor(Math.pow(xp/(LEVEL_XP_SCALE*worldProgressionFactor(id)),1/LEVEL_XP_POWER)));
}
function levelProgress(id=progressWorldId()){
  const level=currentLevel(id),from=powerForLevel(level,id),to=powerForLevel(level+1,id),xp=Math.max(0,Number(progressForWorld(id).xp)||0);
  return {level,from,to,xp,ratio:Math.max(0,Math.min(1,(xp-from)/Math.max(1,to-from)))};
}
function baseSpeedForLevel(level){
  level=Math.max(0,Number(level)||0);
  // V452: identische Speed-Kurve in allen Welten. Nur der Power-Aufwand pro Level
  // wird durch die jeweilige Welt schwieriger.
  const anchors=[[0,5],[5,6],[50,30],[100,80],[250,150],[800,260],[1000,300]];
  if(level<=0)return 5;
  for(let i=1;i<anchors.length;i++){
    const [l1,s1]=anchors[i-1],[l2,s2]=anchors[i];
    if(level<=l2){const t=(level-l1)/Math.max(1,l2-l1);return s1+(s2-s1)*t;}
  }
  return REGULAR_SPEED_CAP;
}
function specialCharacterState(choice=G.state?.characterChoice){
  const def=SPECIAL_CHARACTERS.find(c=>c.id===choice);
  if(!def)return null;
  const upgraded=def.id==='demon-transformation'&&!!G.state?.demonGalaxyUpgrade;
  return {def,upgraded,speedBonus:upgraded?(def.upgradeSpeedBonus||def.speedBonus||0):(def.speedBonus||0),winsBonus:upgraded?(def.upgradeWinsBonus||def.winsBonus||0):(def.winsBonus||0)};
}
function activePetDefs(){
  if(!G.state)return [];
  const ids=Array.isArray(G.state.activePets)?G.state.activePets:(G.state.activePet&&G.state.activePet!=='none'?[G.state.activePet]:[]);
  return ids.map(id=>PET_DEFS.find(p=>p.id===id)).filter(Boolean).slice(0,2);
}
function activePetDef(){return activePetDefs()[0]||PET_DEFS[0];}
function syncLegacyActivePet(){if(G.state)G.state.activePet=G.state.activePets?.[0]||'none';}
function petBonusTotals(){return activePetDefs().reduce((sum,p)=>({speed:sum.speed+Number(p.speedBonus||0),wins:sum.wins+Number(p.winsBonus||0)}),{speed:0,wins:0});}
function speedItemBonusPct(){return SPEED_ITEMS.reduce((sum,item)=>sum+Math.max(0,Math.min(item.maxLevel||5,Number(G.state?.speedItemLevels?.[item.id])||0))*Number(item.pct||0),0);}
function auraSpeedBonus(){return Number((AURAS.find(a=>a.id===G.state?.aura)||AURAS[0]).speedPct||0);}
function speedCoreBonus(){return [0,.01,.02,.03][Math.max(0,Math.min(3,Number(G.state?.speedCoreTier)||0))]||0;}
function totalSpeedBonus(){const special=specialCharacterState(),pets=petBonusTotals();return Number(special?.speedBonus||0)+pets.speed+auraSpeedBonus()+speedCoreBonus()+speedItemBonusPct();}
function totalWinsBonus(){const special=specialCharacterState(),pets=petBonusTotals();return Number(special?.winsBonus||0)+pets.wins;}
function trainingCoreBonus(){return [0,.03,.06,.09][Math.max(0,Math.min(3,Number(G.state?.trainingCoreTier)||0))]||0;}
function treadmillCoreBonus(){return [0,.05,.10,.15][Math.max(0,Math.min(3,Number(G.state?.treadmillCoreTier)||0))]||0;}
function winCoreBonus(){return [0,.01,.02,.03][Math.max(0,Math.min(3,Number(G.state?.winCoreTier)||0))]||0;}
function rawSpeedStat(id=progressWorldId()){
  const p=progressForWorld(id),rawOverride=p.adminSpeedOverride;
  const hasAdminOverride=rawOverride!==null&&rawOverride!==undefined&&rawOverride!==''&&Number.isFinite(Number(rawOverride))&&Number(rawOverride)>0;
  if(hasAdminOverride)return Math.min(OWNER_SPEED_SOFT_CAP,Number(rawOverride));
  return Math.min(REGULAR_SPEED_CAP,baseSpeedForLevel(currentLevel(id)));
}
function currentSpeedStat(id=progressWorldId()){
  // JK SKYRUN is a fair time-trial: every player has exactly Speed 100.
  // Character, pet, aura, core, item and owner-speed bonuses do not change it.
  if(G.world==='only-up')return SKYRUN_SPEED_STAT;
  return rawSpeedStat(id)*(1+totalSpeedBonus());
}
function regularSpeedRemaining(id=progressWorldId()){
  const p=progressForWorld(id),rawOverride=p.adminSpeedOverride;
  const hasAdminOverride=rawOverride!==null&&rawOverride!==undefined&&rawOverride!==''&&Number.isFinite(Number(rawOverride))&&Number(rawOverride)>0;
  if(hasAdminOverride)return 0;
  return Math.max(0,REGULAR_SPEED_CAP-rawSpeedStat(id));
}
function escapeStaffRole(){try{return String(window.LifeBuilderSettingsMenu?.getRole?.()?.role||'').toLowerCase()}catch{return ''}}
function isEscapeOwner(){
  try{return !!(window.LifeBuilderSettingsMenu?.isOwner?.()||escapeStaffRole()==='owner');}catch{return false;}
}
function hasEscapeAdminRights(){const role=escapeStaffRole();return isEscapeOwner()||role==='admin';}
function directSpeedGrant(amount,{allowAdmin=false,worldId=progressWorldId(),countDaily=true}={}){
  amount=Math.max(0,Number(amount)||0);if(!amount)return 0;
  const p=progressForWorld(worldId),before=rawSpeedStat(worldId);
  if(allowAdmin&&hasEscapeAdminRights()){
    const target=Math.min(OWNER_SPEED_SOFT_CAP,before+amount);p.adminSpeedOverride=target;queuePersist(50);updateHud(true);return target-before;
  }
  // Reguläre Belohnungen verändern seit V462 nicht mehr den 0–300 Basis-Speed direkt.
  // Dieser kommt ausschließlich vom Level; normale Grants werden zu Training-Power.
  addLevelPower(amount*2500,countDaily,worldId);queuePersist(80);updateHud(true);return 0;
}
function nextRebirthDef(){
  const r=Math.max(0,Math.floor(Number(G.state?.rebirths)||0));
  if(r<REBIRTH_TABLE.length)return REBIRTH_TABLE[r];
  const extra=r-REBIRTH_TABLE.length+1,last=REBIRTH_TABLE[REBIRTH_TABLE.length-1];
  return {level:last.level+extra*350,mult:last.mult+extra*.45};
}
function rebirthMultiplier(){
  const r=Math.max(0,Math.floor(Number(G.state?.rebirths)||0));if(r<=0)return 1;
  if(r<=REBIRTH_TABLE.length)return REBIRTH_TABLE[r-1]?.mult||1;
  const extra=r-REBIRTH_TABLE.length,last=REBIRTH_TABLE[REBIRTH_TABLE.length-1];return last.mult+extra*.45;
}
function stepBaseGain(){return STEP_BUTTONS[Math.max(0,Math.min(STEP_BUTTONS.length-1,Number(G.state?.stepButtonTier)||0))]?.gain||1;}
function trailMultiplier(){return TRAILS.find(t=>t.id===G.state?.trail)?.mult||1;}
function auraMultiplier(){return AURAS.find(a=>a.id===G.state?.aura)?.mult||1;}
function ownerEventMultiplier(){return Math.max(1,Number(G.state?.ownerEventMultiplier)||1);}
function normalPowerMultiplier(){
  const timedBonus=Date.now()<Number(G.state?.jkSpeedBoostUntil||0)?.50:0;
  // V462: normale Boni addieren sich. So kann Trail × Aura × Rebirth × Boost
  // nicht mehr exponentiell explodieren. Owner-Events bleiben bewusst separat.
  return Math.max(1,1+(trailMultiplier()-1)+(auraMultiplier()-1)+(rebirthMultiplier()-1)+trainingCoreBonus()+timedBonus);
}
function levelPowerPerRunPoint(){return stepBaseGain()*normalPowerMultiplier()*ownerEventMultiplier();}
function speedPerRunPoint(){return levelPowerPerRunPoint();} // legacy internal name, now Training-Power.
function gainMultiplier(){return levelPowerPerRunPoint();}
function speedItemCost(item){
  const bought=Math.max(0,Math.floor(Number(G.state?.speedItemPurchases?.[item.id])||0));
  return Math.max(1,Math.round(item.baseCost*Math.pow(item.scale,bought)));
}
function speedItemLevel(item){return Math.max(0,Math.min(item?.maxLevel||5,Math.floor(Number(G.state?.speedItemLevels?.[item?.id])||0)));}
function buySpeedItem(id){
  const item=SPEED_ITEMS.find(x=>x.id===id);if(!item)return false;
  if(speedItemLevel(item)>=item.maxLevel)return toast(`${item.name} ist bereits maximal ausgebaut.`,'good',1600);
  const cost=speedItemCost(item);if(G.state.wins<cost)return toast(`Du brauchst ${cost.toLocaleString('de-DE')} Wins.`,'bad',1700);
  G.state.wins-=cost;G.state.speedItems[item.id]=(Number(G.state.speedItems[item.id])||0)+1;G.state.speedItemPurchases[item.id]=(Number(G.state.speedItemPurchases[item.id])||0)+1;
  soundBuy();queuePersist(50);updateHud(true);toast(`${item.icon} ${item.name} ins Inventar gelegt.`,'good',1900);openShop('items');return true;
}
function useSpeedItem(id){
  const item=SPEED_ITEMS.find(x=>x.id===id);if(!item)return false;
  const count=Math.max(0,Math.floor(Number(G.state.speedItems?.[id])||0)),level=speedItemLevel(item);
  if(count<=0)return toast('Dieses Speed-Item ist nicht im Inventar.','bad');
  if(level>=item.maxLevel)return toast(`${item.name} ist bereits Stufe ${item.maxLevel}/${item.maxLevel}.`,'good',1600);
  G.state.speedItems[id]=count-1;G.state.speedItemLevels[id]=level+1;
  soundBuy();queuePersist(50);updateHud(true);
  toast(`${item.icon} ${item.name} Stufe ${level+1}/${item.maxLevel} · dauerhaft +${(item.pct*100).toFixed(1).replace('.',',')} % effektiver Speed`,'good',2600);
  openShop('items');return true;
}
function worldUnlockStatus(w){
  if(!w||w.locked)return {unlocked:false,locked:true,reason:'COMING SOON'};
  if(w.number===1)return {unlocked:true,sourceId:null,level:0,requiredLevel:0,completionReady:true};
  if(G.state?.worldsUnlocked?.includes(w.id))return {unlocked:true,sourceId:w.unlockFrom||null,level:currentLevel(w.unlockFrom||'keyboard-lab'),requiredLevel:Number(w.requiredLevel)||0,completionReady:true};
  const sourceId=w.unlockFrom||'keyboard-lab',level=currentLevel(sourceId),requiredLevel=Math.max(0,Number(w.requiredLevel)||0),requiredRuns=Math.max(0,Number(w.requiredCompletions)||0),runs=Math.max(0,Number(G.state?.completions?.[sourceId])||0);
  const completionReady=runs>=requiredRuns;
  return {unlocked:level>=requiredLevel&&completionReady,sourceId,level,requiredLevel,runs,requiredRuns,completionReady,reason:`${escapeWorldById(sourceId)?.name||sourceId}: Level ${requiredLevel}${requiredRuns?` + ${requiredRuns} Finish`:''}`};
}
function updateWorldUnlocks(){
  if(!G.state)return [];
  const unlocked=[];
  for(const w of WORLD_DEFS){
    if(w.locked||w.number===1||G.state.worldsUnlocked.includes(w.id))continue;
    if(worldUnlockStatus(w).unlocked){G.state.worldsUnlocked.push(w.id);unlocked.push(w);}
  }
  if(unlocked.length)refreshHubWorldPortalStatus();
  return unlocked;
}
function awardWins(amount,source='Wins',stageWin=false){
  amount=Math.max(0,Math.floor(Number(amount)||0));if(!amount)return 0;
  const finalAmount=Math.max(0,Math.round(amount*(1+totalWinsBonus()+winCoreBonus())));
  G.state.wins+=finalAmount;G.state.lifetimeWins+=finalAmount;if(stageWin)G.state.stageWinsCollected+=finalAmount;queuePersist(80);updateHud(true);return finalAmount;
}
function awardFixedWins(amount,source='JK SKYRUN'){
  // Competitive SKYRUN rewards are identical for everybody; no Pet/Win-Core multipliers.
  amount=Math.max(0,Math.floor(Number(amount)||0));if(!amount)return 0;
  G.state.wins+=amount;G.state.lifetimeWins+=amount;queuePersist(80);updateHud(true);return amount;
}
function fmt(n){n=Number(n)||0;if(n<1000)return Math.floor(n).toLocaleString('de-DE');if(n<1e6)return `${(n/1e3).toFixed(n<1e4?1:0).replace('.',',')} Tsd`;if(n<1e9)return `${(n/1e6).toFixed(n<1e7?1:0).replace('.',',')} Mio`;if(n<1e12)return `${(n/1e9).toFixed(n<1e10?1:0).replace('.',',')} Mrd`;return n.toExponential(2).replace('.',',');}
function timeText(sec){sec=Math.max(0,Number(sec)||0);const m=Math.floor(sec/60),s=sec-m*60;return `${m}:${s.toFixed(2).padStart(5,'0')}`;}
function dayKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function ensureDailyQuest(){if(!G.state)return null;const key=dayKey();if(!G.state.dailyQuest||G.state.dailyQuest.day!==key){G.state.dailyQuest={day:key,runPointsStart:Number(G.state.runPoints)||0,completionsStart:Number(G.state.completions?.['keyboard-lab']||0),speedEarned:0,claimed:[]};queuePersist(1200);}if(!Array.isArray(G.state.dailyQuest.claimed))G.state.dailyQuest.claimed=[];if(!Number.isFinite(Number(G.state.dailyQuest.runPointsStart)))G.state.dailyQuest.runPointsStart=Number(G.state.runPoints)||0;G.state.dailyQuest.speedEarned=Math.max(0,Number(G.state.dailyQuest.speedEarned)||0);return G.state.dailyQuest;}
function flashRunPoints(){/* V451: Laufpunkte bleiben absichtlich vollständig intern. */}
function onLevelChanged(before,after,worldId=progressWorldId()){
  if(after<=before)return;const unlocks=updateWorldUnlocks(),nextRb=nextRebirthDef();soundCheckpoint();
  const worldName=escapeWorldById(worldId)?.name||'Welt';const msg=after>=Number(nextRb?.level||Infinity)&&before<Number(nextRb?.level||Infinity)?`⬆ ${worldName} LEVEL ${after} · REBIRTH ${G.state.rebirths+1} BEREIT!`:`⬆ ${worldName} LEVEL ${after}`;toast(msg,'good',1900);
  for(const w of unlocks)setTimeout(()=>toast(`🌍 ${w.name} freigeschaltet!`,'good',3200),450);
}
function addLevelPower(amount,countDaily=true,worldId=progressWorldId()){
  amount=Math.max(0,Number(amount)||0);if(!amount)return 0;const before=currentLevel(worldId),p=progressForWorld(worldId);p.xp+=amount;
  if(countDaily){const q=ensureDailyQuest();if(q)q.speedEarned+=amount;}const after=currentLevel(worldId);onLevelChanged(before,after,worldId);return amount;
}
function awardRunPoints(points){
  points=Math.max(0,Math.floor(Number(points)||0));if(!points)return 0;const powerGain=points*levelPowerPerRunPoint();G.state.runPoints+=points;addLevelPower(powerGain,true,progressWorldId());flashRunPoints(points,powerGain);return powerGain;
}
function movementSpeedStat(){
  // No sprint/stat override in JK SKYRUN: fixed Speed 100 for every run.
  if(G.world==='only-up')return SKYRUN_SPEED_STAT;
  const stat=rawSpeedStat();if(stat>REGULAR_SPEED_CAP)return stat;
  const sprintBonus=G.sprint?SPRINT_SPEED_STAT_BONUS:0;return Math.min(REGULAR_SPEED_CAP,stat+sprintBonus);
}
function movementSpeed(){
  const stat=movementSpeedStat();let baseMove;
  if(stat<=REGULAR_SPEED_CAP){
    const t=Math.max(0,Math.min(1,(stat-START_SPEED_STAT)/Math.max(1,REGULAR_SPEED_CAP-START_SPEED_STAT)));
    baseMove=BASE_MOVE_SPEED+(MAX_REGULAR_MOVE_SPEED-BASE_MOVE_SPEED)*t;
  }else baseMove=Math.min(80,MAX_REGULAR_MOVE_SPEED+Math.log1p((stat-REGULAR_SPEED_CAP)/80)*3.2);
  // SKYRUN deliberately ignores every normal additive Speed bonus.
  return G.world==='only-up'?baseMove:baseMove*(1+totalSpeedBonus());
}
function movementBonusPercent(){return Math.max(0,(movementSpeed()/BASE_MOVE_SPEED-1)*100);}
function characterAnimationRate(){
  const t=Math.max(0,Math.min(1,(movementSpeed()-BASE_MOVE_SPEED)/Math.max(.01,MAX_REGULAR_MOVE_SPEED-BASE_MOVE_SPEED)));
  return .82+t*1.28; // Speed 5 = natural jog cadence, Speed 300 = visibly faster legs without cartoon-fast playback.
}
function trainingStreakBonus(){return G.trainingStreakSeconds>=60?.15:G.trainingStreakSeconds>=30?.10:G.trainingStreakSeconds>=10?.05:0;}


function mat(key,params){if(G.materials.has(key))return G.materials.get(key);const m=new THREE.MeshStandardMaterial(params);G.materials.set(key,m);return m;}
function geo(key,factory){if(G.geometries.has(key))return G.geometries.get(key);const g=factory();G.geometries.set(key,g);return g;}
function canvasTexture(key,text,bg='#182435',fg='#ffffff'){
  if(G.textures.has(key))return G.textures.get(key);const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,256,256);x.strokeStyle='rgba(255,255,255,.18)';x.lineWidth=7;x.strokeRect(9,9,238,238);x.fillStyle=fg;x.font=`900 ${text.length>5?42:text.length>2?58:78}px Inter,system-ui`;x.textAlign='center';x.textBaseline='middle';x.fillText(text,128,130);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;G.textures.set(key,t);return t;
}
function signTexture(key,text,color=0x58ddff){
  if(G.textures.has(key))return G.textures.get(key);
  const c=document.createElement('canvas');c.width=1024;c.height=256;const x=c.getContext('2d'),hex=`#${new THREE.Color(color).getHexString()}`;
  x.clearRect(0,0,c.width,c.height);
  const grd=x.createLinearGradient(0,0,1024,0);grd.addColorStop(0,'rgba(4,13,23,.90)');grd.addColorStop(.5,'rgba(7,20,34,.97)');grd.addColorStop(1,'rgba(4,13,23,.90)');
  x.fillStyle=grd;x.beginPath();x.roundRect(14,18,996,220,38);x.fill();
  x.strokeStyle='rgba(255,255,255,.12)';x.lineWidth=4;x.stroke();
  x.fillStyle=hex;x.fillRect(42,36,10,184);x.fillRect(972,36,10,184);
  let size=88;x.font=`800 ${size}px Inter,system-ui,-apple-system,"Segoe UI",sans-serif`;
  while(x.measureText(text).width>850&&size>38){size-=3;x.font=`800 ${size}px Inter,system-ui,-apple-system,"Segoe UI",sans-serif`;}
  x.textAlign='center';x.textBaseline='middle';x.shadowColor=hex;x.shadowBlur=18;x.fillStyle='#f6fbff';x.fillText(text,512,130);x.shadowBlur=0;
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;G.textures.set(key,t);return t;
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
function addSign(text,pos,color=0x58ddff,scale=1){
  const width=Math.max(3.3,Math.min(9.6,2.6+String(text).length*.18))*scale,height=1.02*scale;
  const tex=signTexture(`sign-v451-${text}-${color}`,text,color),m=new THREE.MeshBasicMaterial({map:tex,transparent:true,toneMapped:false,side:THREE.FrontSide,depthWrite:false});
  G.materials.set(`signmat-${text}-${G.decorative.length}`,m);const plane=tagScope(new THREE.Mesh(geo(`sign-v451-${width.toFixed(2)}-${height.toFixed(2)}`,()=>new THREE.PlaneGeometry(width,height)),m));
  plane.position.copy(pos);plane.rotation.y=pos.z>10?Math.PI:0;plane.renderOrder=4;G.scene.add(plane);G.decorative.push(plane);return plane;
}
function boxDeco(x,y,z,w,h,d,color,emissive=0){const m=mat(`deco-${color}-${emissive}`,{color,emissive,emissiveIntensity:emissive?.35:0,roughness:.65,metalness:.12});const o=tagScope(new THREE.Mesh(geo(`deco-box-${w}-${h}-${d}`,()=>new THREE.BoxGeometry(w,h,d)),m));o.position.set(x,y,z);o.castShadow=false;o.receiveShadow=true;G.scene.add(o);G.decorative.push(o);return o;}
function addInteractable(id,label,x,y,z,radius,onUse){const marker={id,label,pos:new THREE.Vector3(x,y,z),radius,onUse,scope:G.buildScope};G.interactables.push(marker);return marker;}
function addAutoTrigger(id,x,z,w,d,onEnter){const trigger={id,x,z,w,d,onEnter,scope:G.buildScope,inside:false};G.autoTriggers.push(trigger);return trigger;}
function addCylinderDeco(x,y,z,rTop,rBottom,h,color,emissive=0,segments=16){const m=mat(`cyl-${color}-${emissive}`,{color,emissive,emissiveIntensity:emissive?.45:0,roughness:.52,metalness:.18});const o=tagScope(new THREE.Mesh(geo(`cyl-${rTop}-${rBottom}-${h}-${segments}`,()=>new THREE.CylinderGeometry(rTop,rBottom,h,segments)),m));o.position.set(x,y,z);o.castShadow=false;o.receiveShadow=true;G.scene.add(o);G.decorative.push(o);return o;}
function addRingDeco(x,y,z,r,tube,color,rotX=Math.PI/2){const m=mat(`ring-${color}`,{color,emissive:color,emissiveIntensity:.72,roughness:.36,metalness:.28});const o=tagScope(new THREE.Mesh(geo(`ring-${r}-${tube}`,()=>new THREE.TorusGeometry(r,tube,8,28)),m));o.position.set(x,y,z);o.rotation.x=rotX;o.castShadow=false;G.scene.add(o);G.decorative.push(o);return o;}
function addGlowLight(x,y,z,color=0x67e8ff,intensity=1.4,distance=11){const l=tagScope(new THREE.PointLight(color,intensity,distance,2));l.position.set(x,y,z);G.scene.add(l);G.decorative.push(l);return l;}
function addCollider(x,z,w,d){G.colliders.push({x,z,w,d,scope:G.buildScope});}
function addHazardBox({x=0,y=2,z=0,w=4,h=4,d=1,color=0xff345f,emissive=0xff123d,motion=null,kind='hazard'}){
  const m=mat(`hazard-${color}-${emissive}`,{color,emissive,emissiveIntensity:.55,roughness:.34,metalness:.18,transparent:true,opacity:.92});
  const mesh=tagScope(new THREE.Mesh(geo(`hazard-box-${w}-${h}-${d}`,()=>new THREE.BoxGeometry(w,h,d)),m));mesh.position.set(x,y,z);mesh.castShadow=false;mesh.receiveShadow=false;G.scene.add(mesh);G.decorative.push(mesh);
  const hz={mesh,scope:G.buildScope,kind,w,h,d,base:new THREE.Vector3(x,y,z),motion,active:true,chase:false,started:false,startZ:z,endZ:z,triggerZ:z,speed:0};G.hazards.push(hz);return hz;
}
function addChaseWall({x=0,y=2.7,startZ=0,triggerZ=-5,endZ=-45,w=22,h=6,d=1.2,speed=12.5,color=0x7dff58}){
  const hz=addHazardBox({x,y,z:startZ,w,h,d,color,emissive:color,kind:'chase-wall'});hz.chase=true;hz.started=false;hz.startZ=startZ;hz.triggerZ=triggerZ;hz.endZ=endZ;hz.speed=Math.max(1,Number(speed)||12.5);return hz;
}
function resetHazardsForWorld(scope=G.world){for(const h of G.hazards){if(h.scope!==scope)continue;h.started=false;h.active=true;h.mesh.position.copy(h.base);if(h.chase)h.mesh.position.z=h.startZ;h.mesh.visible=h.scope===G.world;}}
function hazardTouchesPlayer(h){
  if(!h?.mesh?.visible||!h.active)return false;const r=currentPlayerRadius();
  return Math.abs(G.pos.x-h.mesh.position.x)<=h.w/2+r&&Math.abs(G.pos.z-h.mesh.position.z)<=h.d/2+r&&Math.abs(G.pos.y-h.mesh.position.y)<=h.h/2+PLAYER_HALF;
}
function updateHazards(dt){
  for(const h of G.hazards){if(h.scope!==G.world){h.mesh.visible=false;continue;}h.mesh.visible=true;
    if(h.chase){if(!h.started&&G.pos.z<=h.triggerZ){h.started=true;toast('☣ TOXIC WALL · LAUF!','bad',1400);tone(95,.16,'sawtooth',.022,35);}if(h.started&&h.active){h.mesh.position.z-=h.speed*dt;if(h.mesh.position.z<=h.endZ){h.active=false;h.mesh.visible=false;}}}
    else if(h.motion){const t=performance.now()/1000,q=Math.sin(t*h.motion.speed+(h.motion.phase||0))*h.motion.amp;h.mesh.position[h.motion.axis]=h.base[h.motion.axis]+q;}
    if(hazardTouchesPlayer(h)){if(isEscapeWorld())beginReviveOffer();else respawn();return true;}
  }return false;
}
function resolveHubColliders(prevX,prevZ){
  if(G.world!=='hub')return;
  G.pos.x=Math.max(-54.35,Math.min(54.35,G.pos.x));G.pos.z=Math.max(-54.35,Math.min(54.35,G.pos.z));
  for(const c of G.colliders){const inside=Math.abs(G.pos.x-c.x)<c.w/2+currentPlayerRadius()&&Math.abs(G.pos.z-c.z)<c.d/2+currentPlayerRadius();if(!inside)continue;const oldX=Math.abs(prevX-c.x)<c.w/2+currentPlayerRadius(),oldZ=Math.abs(prevZ-c.z)<c.d/2+currentPlayerRadius();if(!oldX)G.pos.x=prevX;else if(!oldZ)G.pos.z=prevZ;else{G.pos.x=prevX;G.pos.z=prevZ;}G.moveVel.x*=.35;G.moveVel.z*=.35;}
}
function ensureAudio(){if(G.audioCtx)return G.audioCtx;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;G.audioCtx=new C();G.audioUnlocked=true;if(G.audioCtx.state==='suspended')G.audioCtx.resume().catch(()=>{});return G.audioCtx}catch{return null}}
function tone(freq=240,duration=.05,type='sine',gain=.025,slide=0){const ctx=ensureAudio();if(!ctx||ctx.state==='closed')return;try{const now=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(Math.max(30,freq),now);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),now+duration);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),now+.006);g.gain.exponentialRampToValueAtTime(.0001,now+duration);o.connect(g).connect(ctx.destination);o.start(now);o.stop(now+duration+.02)}catch{}}
function soundKey(label=''){const seed=[...String(label||'KEY')].reduce((a,c)=>a+c.charCodeAt(0),0);tone(150+(seed%85),.035,'square',.013,-25);setTimeout(()=>tone(82+(seed%35),.024,'triangle',.008,-8),18)}
function soundJump(){tone(205,.08,'triangle',.022,115)}
function soundCheckpoint(){tone(420,.08,'sine',.024,180);setTimeout(()=>tone(650,.10,'sine',.018,120),78)}
function soundFail(){tone(170,.11,'sawtooth',.018,-80)}
function soundBuy(){tone(520,.055,'triangle',.02,130);setTimeout(()=>tone(760,.08,'sine',.016,80),62)}
function soundFinish(){[0,100,210,330].forEach((ms,i)=>setTimeout(()=>tone([392,523,659,784][i],.16,'triangle',.025,45),ms))}

function buildHubSky(){
  const skyMat=new THREE.MeshBasicMaterial({color:0x132a46,side:THREE.BackSide,fog:false});G.materials.set('hub-sky-mat',skyMat);
  const dome=tagScope(new THREE.Mesh(geo('hub-sky-dome',()=>new THREE.SphereGeometry(165,24,14)),skyMat),'hub');dome.position.set(0,30,0);G.scene.add(dome);G.decorative.push(dome);G.hubSkyDome=dome;
  const positions=[];for(let i=0;i<290;i++){const a=Math.random()*Math.PI*2,r=58+Math.random()*92,y=12+Math.random()*75;positions.push(Math.cos(a)*r,y,Math.sin(a)*r);}
  const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));G.geometries.set('hub-stars-geo',starGeo);
  const starMat=new THREE.PointsMaterial({color:0xd7ecff,size:.34,transparent:true,opacity:.78,sizeAttenuation:true,fog:false});G.materials.set('hub-stars-mat',starMat);
  const stars=tagScope(new THREE.Points(starGeo,starMat),'hub');G.scene.add(stars);G.decorative.push(stars);G.hubStars=stars;
  const moonMat=new THREE.MeshBasicMaterial({color:0xc7e8ff,transparent:true,opacity:.42,fog:false});G.materials.set('hub-moon-mat',moonMat);
  const moon=tagScope(new THREE.Mesh(geo('hub-moon',()=>new THREE.SphereGeometry(7.5,18,12)),moonMat),'hub');moon.position.set(-58,52,-74);G.scene.add(moon);G.decorative.push(moon);G.hubMoon=moon;
  const sunMat=new THREE.MeshBasicMaterial({color:0xffefb1,transparent:true,opacity:0,fog:false});G.materials.set('hub-sun-disc-mat',sunMat);
  const sunDisc=tagScope(new THREE.Mesh(geo('hub-sun-disc',()=>new THREE.SphereGeometry(6.2,18,12)),sunMat),'hub');sunDisc.position.set(60,45,-80);G.scene.add(sunDisc);G.decorative.push(sunDisc);G.hubSun=sunDisc;
  // Lightweight aurora ribbons: strong at night, nearly invisible during the day.
  [[0x4ee6ff,-10,34,-82,-.08],[0x8d73ff,18,41,-91,.10],[0x55ffb0,-28,27,-88,.18]].forEach(([color,x,y,z,rot],i)=>{
    const m=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.055,side:THREE.DoubleSide,depthWrite:false,fog:false,blending:THREE.AdditiveBlending});m.userData.escapeAurora=true;G.hubAuroraMats.push(m);G.materials.set(`hub-aurora-${i}`,m);
    const band=tagScope(new THREE.Mesh(geo(`hub-aurora-geo-${i}`,()=>new THREE.PlaneGeometry(94-i*9,8+i*2)),m),'hub');band.position.set(x,y,z);band.rotation.z=rot;G.scene.add(band);G.decorative.push(band);
  });
}
function updateDayNight(t){
  const dynamic=G.world==='hub'||G.world==='only-up';
  if(!dynamic){if(G.lastDayNightMode!=='fixed'){G.lastDayNightMode='fixed';if(G.sunLight)G.sunLight.intensity=2.0;if(G.hemiLight)G.hemiLight.intensity=1.5;}return;}
  G.lastDayNightMode='dynamic';const phase=((t/DAY_NIGHT_CYCLE_SECONDS)+.24)%1,ang=phase*Math.PI*2-Math.PI/2,sunHeight=Math.sin(ang),day=Math.max(0,Math.min(1,(sunHeight+.16)/.68)),twilight=Math.max(0,1-Math.abs(sunHeight)*3.1);
  const night=new THREE.Color(0x142a47),dawn=new THREE.Color(0x8a4f7c),dayColor=new THREE.Color(0xa8dcff);let sky=night.clone().lerp(dawn,twilight*.62).lerp(dayColor,day*.96);
  if(G.world==='hub'&&G.hubSkyDome?.material?.color)G.hubSkyDome.material.color.copy(sky);G.scene.background.copy(sky);G.scene.fog.color.copy(sky.clone().multiplyScalar(.78));
  if(G.sunLight){G.sunLight.intensity=.72+day*2.95;G.sunLight.color.set(day>.2?0xfff0cf:0xffa68f);G.sunLight.position.set(Math.cos(ang)*58,10+Math.max(-.2,sunHeight)*58,Math.sin(ang)*44);}
  if(G.hemiLight){G.hemiLight.intensity=1.05+day*1.55;G.hemiLight.color.set(day>.35?0xeaf6ff:0xaab9ee);}
  if(G.hubStars?.material)G.hubStars.material.opacity=.78*(1-day*.95);if(G.hubMoon){G.hubMoon.material.opacity=.48*(1-day);G.hubMoon.position.set(-Math.cos(ang)*62,18+Math.max(0,-sunHeight)*48,-66);}
  if(G.hubSun){G.hubSun.material.opacity=Math.max(0,day*.92);G.hubSun.position.set(Math.cos(ang)*70,18+Math.max(0,sunHeight)*53,-78+Math.sin(ang)*18);}
  for(const m of G.hubAuroraMats)m.opacity=.07*(1-day*.88);if(G.renderer)G.renderer.toneMappingExposure=1.14+day*.18;
}

function prewarmEscapeScenes(){
  try{
    for(const p of G.platforms)p.mesh.visible=true;for(const d of G.decorative)d.visible=true;for(const f of G.portalFx)f.visible=true;
    G.scene.updateMatrixWorld(true);G.renderer.compile(G.scene,G.camera);
  }catch(error){console.debug('Escape.kl prewarm übersprungen',error?.message||error)}
}
function refreshHubWorldPortalStatus(){
  if(!G.state||!G.decorative?.length)return;
  for(const obj of G.decorative){
    const statusId=obj?.userData?.escapeWorldStatusId;
    if(statusId){
      const w=escapeWorldById(statusId);if(!w)continue;const status=worldUnlockStatus(w),unlocked=status.unlocked;
      const text=w.number===1?'BETRETEN':unlocked?'FREIGESCHALTET':`LEVEL ${status.requiredLevel} + VORWELT`;
      const color=unlocked?0x98efb5:0xffcb66;
      const tex=signTexture(`sign-v458-live-${statusId}-${text}-${color}`,text,color);
      if(obj.material?.map!==tex){obj.material.map=tex;obj.material.needsUpdate=true;}
    }
    const lightId=obj?.userData?.escapeWorldPortalId;
    if(lightId&&obj.isPointLight){const w=escapeWorldById(lightId);if(w)obj.intensity=worldUnlockStatus(w).unlocked?1.0:.35;}
  }
}

function setupScene(){
  const canvas=G.overlay.querySelector('canvas');
  G.renderer=new THREE.WebGLRenderer({canvas,antialias:(window.devicePixelRatio||1)<2,powerPreference:'high-performance'});
  G.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.35));G.renderer.outputColorSpace=THREE.SRGBColorSpace;G.renderer.toneMapping=THREE.ACESFilmicToneMapping;G.renderer.toneMappingExposure=1.14;
  G.renderer.shadowMap.enabled=true;G.renderer.shadowMap.type=THREE.PCFShadowMap;
  G.scene=new THREE.Scene();G.scene.background=new THREE.Color(0x13283f);G.scene.fog=new THREE.Fog(0x13283f,42,220);G.camera=new THREE.PerspectiveCamera(63,1,.1,380);
  G.hemiLight=new THREE.HemisphereLight(0xd8ecff,0x283526,1.65);G.scene.add(G.hemiLight);G.sunLight=new THREE.DirectionalLight(0xffedcf,2.35);G.sunLight.position.set(-28,46,18);G.sunLight.castShadow=true;G.sunLight.shadow.mapSize.set(1024,1024);G.sunLight.shadow.camera.left=-74;G.sunLight.shadow.camera.right=74;G.sunLight.shadow.camera.top=82;G.sunLight.shadow.camera.bottom=-82;G.scene.add(G.sunLight);
  const worldApi={addPlatform,addSign:(text,pos,color,scale)=>addSign(text,new THREE.Vector3(pos.x,pos.y,pos.z),color,scale),boxDeco,addCylinderDeco,addRingDeco,addGlowLight,addInteractable,addAutoTrigger,addHazardBox,addChaseWall,returnHub:()=>setWorld('hub'),finishAndReturnHub:()=>finishWorldAndReturnHub()};
  G.buildScope='hub';buildHubSky();buildHub();G.buildScope='race';buildRaceCourse();G.buildScope='only-up';buildOnlyUpCourse();
  G.buildScope='keyboard-lab';buildKeyboardLabWorld(worldApi);G.buildScope='candy-keys';buildCandyKeysWorld(worldApi);G.buildScope='toxic-keyboard';buildToxicKeyboardWorld(worldApi);
  G.buildScope='hub';createPlayer();resize();prewarmEscapeScenes();setWorld('hub',true);updateHud(true);
}
function clearWorldObjects(){for(const p of G.platforms)G.scene?.remove(p.mesh);for(const d of G.decorative)G.scene?.remove(d);for(const f of G.portalFx)G.scene?.remove(f);G.platforms=[];G.decorative=[];G.portalFx=[];G.interactables=[];G.colliders=[];G.hazards=[];G.autoTriggers=[];G.triggerLocks.clear();}
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
  // V451 HUB: clean futuristic campus. Upgrades live only inside the Escape Shop.
  // No giant center circle, no brown Speed-Lab floor, no walk-over purchase buttons.
  addPlatform({x:0,y:0,z:0,w:110,h:.55,d:110,color:0x091725,kind:'hub',hub:true});

  // Subtle architectural floor: dark stone + thin illuminated navigation paths.
  addPlatform({x:0,y:.292,z:4,w:12,h:.075,d:92,color:0x10283b,kind:'hub-lane',hub:true});
  addPlatform({x:0,y:.296,z:-31,w:78,h:.075,d:10,color:0x10283b,kind:'hub-lane',hub:true});
  addPlatform({x:0,y:.297,z:30,w:92,h:.075,d:11,color:0x0f2537,kind:'hub-lane',hub:true});
  // V461: giant JK.GAMES landmark – readable from the main plaza without blocking movement.
  boxDeco(0,13.6,-8.0,28,.38,.55,0x0b2033,0x1e5f86);boxDeco(-13.2,8.0,-8.0,.42,11.2,.55,0x14344d,0x175a7a);boxDeco(13.2,8.0,-8.0,.42,11.2,.55,0x14344d,0x175a7a);
  addSign('JK.GAMES',{x:0,y:14.65,z:-7.68},0xffffff,1.72);addSign('ESCAPE.KL',{x:0,y:12.95,z:-7.66},0x6ee7ff,.58);
  for(const x of[-5.9,5.9])boxDeco(x,.355,4,.055,.035,92,0x53def7,0x143f55);
  for(const z of[-35.9,-26.1])boxDeco(0,.356,z,78,.035,.055,0x53def7,0x143f55);
  for(const z of[24.6,35.4])boxDeco(0,.356,z,92,.035,.055,0x3b91ad,0x143f55);

  // Outer safety wall and stylized skyline.
  for(const z of[-54.55,54.55]){boxDeco(0,1.0,z,109.2,1.35,.32,0x102a3d,0x071b29);boxDeco(0,1.83,z,109.2,.08,.36,0x4cdcf5,0x123f51);}
  for(const x of[-54.55,54.55]){boxDeco(x,1.0,0,.32,1.35,109.2,0x102a3d,0x071b29);boxDeco(x,1.83,0,.36,.08,109.2,0x4cdcf5,0x123f51);}
  for(let i=0;i<14;i++){
    const x=-50+i*7.7,h=4.5+(i%5)*1.65,shade=i%2?0x0a2032:0x0c2639;
    boxDeco(x,h/2-1,-51.7,4.8,h,3.2,shade,i%3===0?0x071d2d:0);
    boxDeco(x,h/2-1,51.7,4.8,h,3.2,shade,i%4===0?0x071d2d:0);
    if(i%2===0){boxDeco(x,1.2,-49.95,1.8,.06,.08,0x5ce6ff,0x17475a);boxDeco(x,1.2,49.95,1.8,.06,.08,0x5ce6ff,0x17475a);}
  }

  // Arrival deck: deliberately flat/open instead of the old giant blue circle.
  boxDeco(-7.2,2.4,42,.36,4.8,.55,0x183b52,0x0b2d43);boxDeco(7.2,2.4,42,.36,4.8,.55,0x183b52,0x0b2d43);
  boxDeco(0,4.65,42,14.7,.36,.55,0x183b52,0x0b2d43);addGlowLight(0,4.2,39.5,0x5ce6ff,.85,14);
  addSign('ESCAPE.KL',{x:0,y:5.55,z:41.65},0x5ce6ff,.78);
  addSign('TRAINIEREN  ·  WINS  ·  REBIRTH  ·  ESCAPE',{x:0,y:4.42,z:41.64},0xffcf69,.34);

  // World Avenue – clean portals with readable headers.
  const addWorldPortal=(id,x,z,color)=>{
    const w=escapeWorldById(id);if(!w)return;const status=worldUnlockStatus(w),unlocked=status.unlocked;
    addPlatform({x,y:.33,z,w:12.3,h:.20,d:8.2,color:0x102538,kind:'world-gate',hub:true});
    for(const sx of[-5.0,5.0])boxDeco(x+sx,2.75,z-3.1,.42,5.25,.58,0x173348,color);
    boxDeco(x,5.15,z-3.1,10.4,.38,.58,0x173348,color);
    addRingDeco(x,2.86,z-3.0,2.38,.075,color,0);const portalLight=addGlowLight(x,3.0,z-2.5,color,unlocked?1.0:.35,11);portalLight.userData.escapeWorldPortalId=id;
    addSign(`WORLD ${w.number}  ·  ${w.name.toUpperCase()}`,new THREE.Vector3(x,6.05,z-2.9),color,.53);
    const statusSign=addSign(w.number===1?'BETRETEN':unlocked?'FREIGESCHALTET':`LEVEL ${status.requiredLevel} + VORWELT`,new THREE.Vector3(x,4.72,z-2.88),unlocked?0x98efb5:0xffcb66,.29);statusSign.userData.escapeWorldStatusId=id;
    addAutoTrigger(`${id}-walkthrough`,x,z-3.0,8.6,2.5,()=>{soundKey('ENTER');enterWorld(id)});
  };
  addSign('WELTEN',{x:0,y:7.15,z:-48.0},0xffffff,.62);
  addWorldPortal('keyboard-lab',-21,-42,0x58ddff);
  addWorldPortal('candy-keys',0,-42,0xff77bb);
  addWorldPortal('toxic-keyboard',21,-42,0x75ff72);
  addPlatform({x:42,y:.33,z:-42,w:11,h:.20,d:8.2,color:0x111a30,kind:'locked',hub:true});
  boxDeco(42,3.0,-45.1,9.6,5.3,.48,0x151c35,0x232857);addSign('WORLD 4  ·  CYBER CITY',{x:42,y:5.65,z:-44.82},0x858bff,.45);addSign('COMING SOON',{x:42,y:4.35,z:-44.80},0xffd36a,.28);

  // Training Hall – the only place where treadmills physically live.
  addPlatform({x:-36,y:.31,z:-3,w:30,h:.13,d:29,color:0x0c252b,kind:'hub-zone',hub:true});
  boxDeco(-36,3.35,-17.0,28.5,5.8,.38,0x0b2028,0x0a3f48);addCollider(-36,-17.0,28.5,.38);
  addSign('TRAINING HALL',{x:-36,y:5.7,z:-16.78},0x72f0de,.58);addSign('LAUFBÄNDER',{x:-36,y:4.55,z:-16.76},0xd7f9ff,.28);
  const xs=[-47,-41.5,-36,-30.5,-25];
  TREADMILLS.filter(def=>def.hubPhysical).forEach((def,index)=>{
    const x=xs[index],z=-2.6,tr=addPlatform({x,y:.38,z,w:4.25,h:.24,d:7.2,color:new THREE.Color(def.color).multiplyScalar(.40).getHex(),label:'',kind:'training',hub:true});
    tr.training=true;tr.trainingMult=def.mult;tr.trainingId=def.id;tr.trainingName=`${def.name} ×${String(def.mult).replace('.',',')}`;
    boxDeco(x,.52,z,3.65,.09,6.35,0x0c141a);for(let sl=-2.5;sl<=2.5;sl+=.72)boxDeco(x,.58,z+sl,3.35,.025,.06,0x4e5d67);
    boxDeco(x-1.88,.78,z,.14,.42,6.8,0x283b49);boxDeco(x+1.88,.78,z,.14,.42,6.8,0x283b49);
    for(const sx of[-1.35,1.35])boxDeco(x+sx,1.75,z+3.1,.15,2.25,.18,0x385363);
    boxDeco(x,2.68,z+3.1,2.9,.16,.20,0x426071);boxDeco(x,2.28,z+2.9,1.8,.72,.38,0x08141c,0x0b2734);boxDeco(x,2.29,z+2.68,1.24,.34,.06,def.color,def.color);
    addSign(def.name,{x,y:3.62,z:z+3.30},def.color,.27);
    addInteractable(`treadmill-${def.id}`,`${def.name} Laufband`,x,1.0,z+3.2,2.6,()=>openTreadmillStation(def.id));
  });
  addPlatform({x:-36,y:.37,z:10.4,w:12,h:.20,d:6.0,color:0x153c47,kind:'training-world',hub:true});
  addSign('TRAININGSWELT',{x:-36,y:2.7,z:13.05},0x8af9ee,.33);addInteractable('training-world','Trainingswelt auswählen',-36,1.0,10.4,5.0,()=>openTrainingWorldSelector());

  // Escape Shop – all Gear, Items and Power upgrades exist here and nowhere else in the hub.
  addPlatform({x:36,y:.31,z:-3,w:30,h:.13,d:29,color:0x0d2132,kind:'hub-zone',hub:true});
  boxDeco(36,2.7,-13.3,24,4.9,.52,0x0b1c2b,0x0b2b43);addCollider(36,-13.3,24,.52);
  boxDeco(25.0,2.0,-3,.42,3.7,18,0x132f44,0x0a2537);boxDeco(47.0,2.0,-3,.42,3.7,18,0x132f44,0x0a2537);
  addSign('ESCAPE SHOP',{x:36,y:5.35,z:-13.0},0xffd06c,.67);addSign('UPGRADES  ·  ITEMS  ·  TRAILS  ·  AUREN',{x:36,y:4.15,z:-12.98},0x9ee8ff,.28);
  addPlatform({x:36,y:.40,z:1.0,w:13,h:.24,d:8,color:0x173852,kind:'shop-floor',hub:true});
  boxDeco(36,1.62,4.4,8.2,2.05,.42,0x0b1825,0x102d45);addSign('SHOP ÖFFNEN',{x:36,y:2.7,z:4.18},0xffd36a,.35);
  addInteractable('shop','Escape Shop öffnen',36,1.0,1.0,6.0,()=>openShop());

  // Lower plaza: each utility has its own small building, with clean spacing.
  addPlatform({x:0,y:.31,z:31,w:94,h:.13,d:22,color:0x0b1e2c,kind:'hub-zone',hub:true});

  // Rebirth.
  boxDeco(-43,2.7,36.4,13.5,4.8,.38,0x17152a,0x2f1b54);addCollider(-43,36.4,13.5,.38);
  for(const sx of[-4.7,4.7])boxDeco(-43+sx,2.0,30.7,.45,3.6,.45,0x392557,0x4a276e);
  addSign('REBIRTH',{x:-43,y:4.95,z:36.15},0xc998ff,.50);addSign('PERMANENTE POWER',{x:-43,y:3.85,z:36.13},0x88dcff,.25);
  addInteractable('rebirth','Rebirth öffnen',-43,1.0,30.3,5.5,()=>openRebirth());

  // Daily.
  boxDeco(-25,2.45,36.4,14,4.3,.38,0x151f2c,0x2b2910);addCollider(-25,36.4,14,.38);
  addRingDeco(-25,2.3,35.7,1.75,.14,0xf0b85b,0);addRingDeco(-25,2.3,35.62,1.02,.06,0x69e4ff,0);
  addSign('DAILY',{x:-25,y:4.75,z:36.16},0xffc65a,.47);
  addInteractable('daily-wheel','Daily Wheel drehen',-28.0,1.0,30.4,3.8,()=>openDailyWheel());
  addInteractable('daily-quests','Daily Quests ansehen',-22.0,1.0,30.4,3.8,()=>openDailyQuests());

  // Character Studio.
  boxDeco(-7,2.45,36.4,14,4.3,.38,0x102433,0x14364b);addCollider(-7,36.4,14,.38);
  addSign('CHARAKTER STUDIO',{x:-7,y:4.75,z:36.16},0x80dcff,.46);
  for(const [dx,label,color] of [[-3.5,'MANN',0x5ccfff],[0,'FRAU',0xff8fcf],[3.5,'SPECIAL',0xc18cff]]){boxDeco(-7+dx,.47,30.5,2.7,.16,3.0,0x142a3b,color);addSign(label,{x:-7+dx,y:1.55,z:31.9},color,.20);}
  addInteractable('character-studio','Charakter Studio öffnen',-7,1.0,30.3,6.0,()=>openCharacterStudio());

  // Records.
  boxDeco(12,2.45,36.4,14,4.3,.38,0x111f2f,0x0d3045);addCollider(12,36.4,14,.38);
  addSign('RECORDS',{x:12,y:4.75,z:36.16},0x72eaff,.48);addInteractable('records','Escape-Statistiken ansehen',12,1.0,30.3,5.5,()=>openRecords());

  // Race.
  boxDeco(32,2.45,36.4,16,4.3,.38,0x251713,0x4b2517);addCollider(32,36.4,16,.38);
  addSign('SPEED RACE',{x:32,y:4.75,z:36.16},0xff9064,.52);
  addPlatform({x:32,y:.37,z:30.4,w:10,h:.20,d:5.4,color:0x4a2b23,kind:'race-gate',hub:true});
  addInteractable('speed-race','Speed Race starten',32,1.0,30.4,5.3,()=>setWorld('race'));

  // JK SKYRUN – fair vertical time-trial, separate from Worlds 1–3.
  boxDeco(45,2.45,18.3,15,4.3,.38,0x101b31,0x263f78);addCollider(45,18.3,15,.38);
  addSign('JK SKYRUN',{x:45,y:4.78,z:18.05},0x9aa7ff,.56);addSign('100 SPEED · ZEITJAGD',{x:45,y:3.72,z:18.03},0xd6dcff,.25);
  addPlatform({x:45,y:.38,z:12.0,w:10,h:.22,d:5.2,color:0x27345c,kind:'only-up-gate',hub:true});
  addInteractable('only-up','JK SKYRUN starten',45,1.0,12.0,5.2,()=>setWorld('only-up'));

  // Atmospheric light columns and low decorative benches keep the plaza alive without clutter.
  for(const [x,z,c] of [[-14,14,0x5ce6ff],[14,14,0x7a91ff],[-14,-22,0x67e7dc],[14,-22,0xffcf69]]){
    addCylinderDeco(x,1.55,z,.22,.32,2.5,0x173248,c,12);addGlowLight(x,2.6,z,c,.55,7);
    boxDeco(x+2.2,.58,z,3.2,.32,1.0,0x102332);
  }
}

function buildRaceCourse(){
  const x0=72,z0=20;addPlatform({x:x0,y:.4,z:z0,w:12,h:.55,d:8,color:0x783c2b,label:'START',checkpoint:1,kind:'race-start'});addSign('ESCAPE SPEED RACE',new THREE.Vector3(x0,4.2,z0+3.8),0xff895c,.92);addGlowLight(x0,2.5,z0+2.0,0xff7552,1.1,12);
  let z=z0-7;const names=['W','A','S','D','SHIFT','SPACE','1','2','3','GO','FAST','ESC','RUN','KEY','WIN','RACE'];for(let i=0;i<16;i++){z-=4.25;const cp=i===3?2:i===7?3:i===11?4:i===15?5:0;const motion=i===5||i===10?{axis:'x',amp:2.7,speed:.85,phase:i*.5}:null;addPlatform({x:x0+Math.sin(i*.9)*3.2,y:.65+(i%4===3?.35:0),z,w:i%5===4?5.4:2.8,h:.48,d:2.8,color:cp?0xb35538:0x7b4939,label:names[i],checkpoint:cp,kind:'race-key',motion});if(cp)addGlowLight(x0,2.1,z,0xff815c,.52,8);}
  z-=6.5;addPlatform({x:x0,y:1.05,z,w:12,h:.6,d:7,color:0xd27a38,label:'FINISH',finish:true,checkpoint:5,kind:'race-finish'});boxDeco(x0,4.5,z-2.8,12,.35,.55,0xffa24e,0x8b3e18);addSign('RACE FINISH',new THREE.Vector3(x0,5.1,z+3.45),0xffb35d,.92);addGlowLight(x0,3.2,z,0xff9a50,1.25,12);addInteractable('race-hub-return','Nach dem Rennen zum Hub',x0,1.8,z-2,5,()=>setWorld('hub'));
}
function buildOnlyUpCourse(){
  // V467 JK SKYRUN: no checkpoints, fixed Speed 100, height milestones pay fixed Wins.
  const startX=0,startY=1.15,startZ=0;
  addPlatform({x:startX,y:startY,z:startZ,w:11,h:.6,d:9,color:0x27325c,label:'JK SKYRUN',kind:'only-up-start'});
  addSign('JK.GAMES · JK SKYRUN',{x:0,y:5.2,z:3.8},0xa8b7ff,.92);addSign('100 SPEED · KEINE CHECKPOINTS',{x:0,y:4.05,z:3.82},0xffd56b,.34);
  let lastX=0,lastZ=0,y=1.35;
  const total=144;
  for(let i=1;i<=total;i++){
    const tier=i/total,angle=i*(.46+tier*.12),radius=5.2+tier*5.8+Math.sin(i*.17)*1.25;
    const x=Math.cos(angle)*radius,z=Math.sin(angle)*radius;
    y+=1.05+(i%17===0?.10:0);
    const milestone=i%16===0,rest=i%10===0,w=milestone?7.2:rest?4.6:3.2,d=milestone?5.8:rest?3.6:2.8;
    const milestoneIndex=milestone?Math.max(0,Math.min(SKYRUN_MILESTONE_REWARDS.length-1,Math.floor(i/16)-1)):-1;
    const milestoneReward=milestone?SKYRUN_MILESTONE_REWARDS[milestoneIndex]:0;
    const color=milestone?0xd2a83b:rest?0x43569b:(i%2?0x293963:0x344777);
    const motion=i>42&&i%13===0?{axis:'x',amp:1.2+tier*1.3,speed:.42+tier*.28,phase:i*.33}:null;
    addPlatform({x,y,z,w,h:.42,d,color,label:milestone?`+${milestoneReward.toLocaleString('de-DE')} WINS`:'',winReward:milestoneReward,winStage:milestone?Math.floor(i/16):0,kind:milestone?'skyrun-win':'only-up-key',motion});
    if(milestone){addRingDeco(x,y+1.9,z,1.45,.055,0xffdc68,Math.PI/2);addGlowLight(x,y+1.2,z,0xffc84e,.58,9);}
    lastX=x;lastZ=z;
  }
  y+=1.05;addPlatform({x:lastX,y,z:lastZ,w:11,h:.62,d:8,color:0xc69d3b,label:'FINISH',finish:true,kind:'only-up-finish'});
  addSign('JK SKYRUN · ZIEL',{x:lastX,y:y+4.2,z:lastZ+3.6},0xffd66b,.78);addSign('150+ METER GESCHAFFT',{x:lastX,y:y+3.1,z:lastZ+3.62},0xcad0ff,.32);addGlowLight(lastX,y+2,lastZ,0xffd66b,1.1,13);
}
function claimSkyrunMilestone(p){
  if(G.world!=='only-up'||!p?.winReward||!p.winStage)return false;
  const claimKey=`jk-skyrun:${p.winStage}`;if(G.stageClaims.has(claimKey))return false;
  G.stageClaims.add(claimKey);const reward=awardFixedWins(p.winReward,'JK SKYRUN Höhen-Wins');soundCheckpoint();
  toast(`🏆 Höhe ${p.winStage}/9 · +${reward.toLocaleString('de-DE')} Wins`,'good',1500);return true;
}
function finishOnlyUp(){
  if(G.runFinished)return;G.runFinished=true;soundFinish();
  const sec=Math.max(0,(performance.now()-G.runStartedAt)/1000),key='jk-skyrun',previous=Number(G.state.bestTimes[key]||0),record=!previous||sec<previous;
  if(record)G.state.bestTimes[key]=sec;G.state.completions[key]=Math.max(0,Number(G.state.completions[key]||0))+1;
  const reward=awardFixedWins(SKYRUN_FINISH_REWARD,'JK SKYRUN Finish');queuePersist(50);
  const wrap=document.createElement('div');wrap.className='ekl-complete';wrap.dataset.eklComplete='1';wrap.innerHTML=`<div class="ekl-complete-card"><small>JK.GAMES · JK SKYRUN</small><h2>${record?'🏆 Neue Bestzeit!':'🏔️ Ganz oben!'}</h2><div class="ekl-stars">★★★</div><p>Speed <b>100</b> · Höhe <b>150+ Meter</b> · Zeit <b>${timeText(sec)}</b>${previous?` · Vorher ${timeText(previous)}`:''}<br>Feste Ziel-Belohnung <b>+${reward.toLocaleString('de-DE')} Wins</b></p><div class="ekl-modal-actions"><button data-ekl-only-again class="gold">Nochmal</button><button data-ekl-only-hub>Zum Hub</button></div></div>`;G.overlay.append(wrap);wrap.querySelector('[data-ekl-only-again]').onclick=()=>{wrap.remove();setWorld('only-up')};wrap.querySelector('[data-ekl-only-hub]').onclick=()=>{wrap.remove();setWorld('hub')};updateHud(true);
}

function activeCharacterDef(choice=G.state?.characterChoice){return SPECIAL_CHARACTERS.find(c=>c.id===choice)||null;}
function characterBaseGender(choice=G.state?.characterChoice){const special=activeCharacterDef(choice);if(special)return special.baseGender;return choice==='female'?'female':'male';}
function currentPlayerRadius(){return G.state?.characterChoice==='demon-transformation'?.46:PLAYER_RADIUS;}
function createSharedLoader(){if(!G.gltfLoader)G.gltfLoader=new GLTFLoader();return G.gltfLoader;}
function removeNamedPlayerChildren(name){
  if(!G.playerRoot)return;
  for(const child of [...G.playerRoot.children])if(child?.name===name)child.removeFromParent?.();
}
function disposeExternalObject(root){
  try{root?.traverse?.(o=>{if(!o?.isMesh)return;try{o.geometry?.dispose?.()}catch{}const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){if(!m)continue;try{m.map?.dispose?.();m.normalMap?.dispose?.();m.emissiveMap?.dispose?.();m.metalnessMap?.dispose?.();m.roughnessMap?.dispose?.();m.dispose?.()}catch{}}});}catch{}
}
function clearPetVisuals(){
  G.petLoadSeq++;
  for(const visual of G.petVisuals||[]){try{visual.mixer?.stopAllAction?.()}catch{}visual.wrapper?.removeFromParent?.();disposeExternalObject(visual.wrapper);}
  G.petVisuals=[];
}
function clearCustomVisuals(){
  clearPetVisuals();G.formLoadSeq++;
  if(G.formMixer){try{G.formMixer.stopAllAction?.()}catch{}G.formMixer=null;}
  G.formActions=null;G.formAction=null;
  removeNamedPlayerChildren('escape-form-wrapper');
  if(G.formWrapper){G.formWrapper.removeFromParent?.();G.formWrapper=null;}G.formModel=null;
  if(G.character?.visualRoot)G.character.visualRoot.visible=true;
}
function normalizeExternalModel(root,{targetHeight=1.65}={}){
  const wrap=new THREE.Group();wrap.add(root);root.updateMatrixWorld?.(true);
  const box=new THREE.Box3().setFromObject(root),size=new THREE.Vector3();box.getSize(size);
  const height=Math.max(.01,size.y||1),scale=targetHeight/height;wrap.scale.setScalar(scale);
  root.position.x-=(box.min.x+box.max.x)/2;root.position.y-=box.min.y;root.position.z-=(box.min.z+box.max.z)/2;
  wrap.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){if(m?.map)m.map.colorSpace=THREE.SRGBColorSpace;if(m){m.envMapIntensity=.28;if(m.roughness!==undefined)m.roughness=Math.max(.28,Number(m.roughness)||.55);}}}});
  return wrap;
}
function tintGalaxyModel(root){
  root.traverse(o=>{if(!o.isMesh)return;const mats=Array.isArray(o.material)?o.material:[o.material];const list=mats.map(mat=>{const clone=mat?.clone?mat.clone():new THREE.MeshStandardMaterial({color:0xffffff});if(clone.color)clone.color.offsetHSL(.08,.18,.08);if(clone.emissive?.setHex)clone.emissive.setHex(0x5f2cff);else clone.emissive=new THREE.Color(0x5f2cff);clone.emissiveIntensity=.42;clone.roughness=Math.max(.18,Number(clone.roughness)||.45);clone.metalness=Math.max(.08,Number(clone.metalness)||0);return clone;});o.material=Array.isArray(o.material)?list:list[0];});
}
function petTargetHeight(def){return Math.max(.35,Math.min(1.25,Number(def?.targetHeight)||.8));}
function petAnimationClip(def,clips=[]){
  const hint=def?.animationHint;if(hint){const byHint=clips.find(a=>{hint.lastIndex=0;return hint.test(String(a?.name||''));});if(byHint)return byHint;}
  if(def?.movement==='fly-follow'||def?.movement==='orbit')return clips.find(a=>/fly|flight|wing|take/i.test(a.name||''))||clips.find(a=>/idle/i.test(a.name||''))||clips[0];
  return clips.find(a=>/walk|run|move|basic|niet/i.test(a.name||''))||clips.find(a=>!/attack|hit|bite/i.test(a.name||''))||clips[0];
}
function loadPetVisuals(){
  if(!G.scene||!G.playerRoot||!G.state)return;
  clearPetVisuals();const seq=G.petLoadSeq,pets=activePetDefs();
  pets.forEach((pet,slot)=>{
    if(!pet?.asset)return;
    createSharedLoader().load(pet.asset,gltf=>{
      if(seq!==G.petLoadSeq||!G.scene||!activePetDefs().some(p=>p.id===pet.id))return;
      const wrap=new THREE.Group();wrap.name=`escape-pet-wrapper-${pet.id}`;
      const model=normalizeExternalModel(gltf.scene,{targetHeight:petTargetHeight(pet)});model.position.set(0,0,0);
      if(pet.id==='cyclops-wing')model.rotation.y=Math.PI*.2;
      wrap.add(model);G.scene.add(wrap);
      const clips=gltf.animations||[],clip=petAnimationClip(pet,clips);let mixer=null,action=null;
      if(clip){mixer=new THREE.AnimationMixer(gltf.scene);action=mixer.clipAction(clip).reset().setLoop(THREE.LoopRepeat,Infinity).play();action.setEffectiveTimeScale?.(pet.movement==='ground-follow'?1.05:1);}
      const visual={def:pet,slot,wrapper:wrap,model,mixer,action};G.petVisuals.push(visual);
      const yaw=G.playerRoot?.rotation.y||0,forwardX=Math.sin(yaw),forwardZ=Math.cos(yaw),side=slot===0?-.72:.72,rightX=Math.cos(yaw),rightZ=-Math.sin(yaw);
      const back=pet.movement==='fly-follow'?2.25:pet.movement==='ground-follow'?1.65:1.05;
      wrap.position.set(G.pos.x-forwardX*back+rightX*side,pet.movement==='fly-follow'?G.pos.y+.18:G.pos.y-PLAYER_HALF+.04,G.pos.z-forwardZ*back+rightZ*side);
      if(pet.movement==='orbit')wrap.position.set(G.pos.x+Math.cos(slot*Math.PI)*1.0,G.pos.y+.18,G.pos.z-1.0);
    },undefined,err=>{if(seq===G.petLoadSeq)console.warn(`Escape.kl: Pet-GLB ${pet.id} konnte nicht geladen werden.`,err)});
  });
}
function loadCharacterFormVisual(choice=G.state?.characterChoice){
  const seq=++G.formLoadSeq;
  if(G.formMixer){try{G.formMixer.stopAllAction?.()}catch{}G.formMixer=null;}
  removeNamedPlayerChildren('escape-form-wrapper');
  if(G.formWrapper){G.formWrapper.removeFromParent?.();G.formWrapper=null;}G.formModel=null;G.formActions=null;G.formAction=null;
  const special=activeCharacterDef(choice);if(!special?.asset||!G.playerRoot||!G.character?.visualRoot)return;
  G.character.visualRoot.visible=false;
  const asset=choice==='demon-transformation'&&G.state?.demonGalaxyUpgrade&&special.galaxyAsset?special.galaxyAsset:special.asset;
  createSharedLoader().load(asset,gltf=>{
    if(seq!==G.formLoadSeq||!G.playerRoot||G.state?.characterChoice!==choice)return;
    // Never allow a stale transformation instance to remain inside the player.
    removeNamedPlayerChildren('escape-form-wrapper');
    if(G.formMixer){try{G.formMixer.stopAllAction?.()}catch{}G.formMixer=null;}
    const wrap=new THREE.Group();wrap.name='escape-form-wrapper';
    const model=normalizeExternalModel(gltf.scene,{targetHeight:choice==='demon-transformation'?1.84:1.88});
    model.position.set(0,-PLAYER_HALF+.025,0);
    if(choice==='demon-transformation'){model.scale.multiplyScalar(1.06);model.rotation.y=Math.PI;}
    wrap.add(model);G.playerRoot.add(wrap);G.formWrapper=wrap;G.formModel=model;
    const clips=gltf.animations||[],find=re=>clips.find(a=>re.test(a.name||''));
    if(clips.length){
      G.formMixer=new THREE.AnimationMixer(gltf.scene);G.formActions={};
      for(const [key,clip] of [['idle',find(/idle/i)||clips[0]],['walk',find(/walk/i)],['run',find(/run/i)]]){if(!clip)continue;const action=G.formMixer.clipAction(clip);action.enabled=true;action.setLoop(THREE.LoopRepeat,Infinity);G.formActions[key]=action;}
      G.formAction=G.formActions.idle||G.formActions.walk||G.formActions.run||null;G.formAction?.reset().play();
    }
  },undefined,err=>{if(seq===G.formLoadSeq){console.warn('Escape.kl: Spezialcharakter-GLB konnte nicht geladen werden.',err);if(G.character?.visualRoot)G.character.visualRoot.visible=true;}});
}
function refreshCompanionVisuals(){
  loadPetVisuals();
  const choice=G.state?.characterChoice,special=activeCharacterDef(choice);
  if(special?.asset)loadCharacterFormVisual(choice);else if(G.character?.visualRoot)G.character.visualRoot.visible=true;
}
function updateCustomVisuals(dt,t){
  for(const visual of G.petVisuals||[]){
    visual.mixer?.update?.(dt);const pet=visual.def,slot=visual.slot||0,wrap=visual.wrapper;if(!wrap||!G.playerRoot)continue;
    const yaw=G.playerRoot.rotation.y||0,forwardX=Math.sin(yaw),forwardZ=Math.cos(yaw),rightX=Math.cos(yaw),rightZ=-Math.sin(yaw),side=slot===0?-.72:.72;
    let tx=G.pos.x,ty=G.pos.y,tz=G.pos.z;
    if(pet.movement==='orbit'){
      const a=t*1.12+slot*Math.PI;tx+=Math.cos(a)*(1.02+slot*.12);tz+=Math.sin(a)*(1.02+slot*.12);ty+=.16+Math.sin(t*2.4+slot)*.08;
      wrap.rotation.y+=dt*.18;
    }else{
      const back=pet.movement==='fly-follow'?2.25:1.65;tx-=forwardX*back;tz-=forwardZ*back;tx+=rightX*side;tz+=rightZ*side;
      if(pet.movement==='fly-follow')ty=G.pos.y+.18+(!G.grounded?.42:0)+Math.sin(t*4.2+slot)*.045;
      else ty=G.grounded?G.pos.y-PLAYER_HALF+.035:wrap.position.y;
      const dx=tx-wrap.position.x,dz=tz-wrap.position.z;if(Math.hypot(dx,dz)>.04){const wanted=Math.atan2(dx,dz);wrap.rotation.y=onlineLerpAngle(wrap.rotation.y,wanted,1-Math.exp(-dt*8));}
    }
    G.tmpV3.set(tx,ty,tz);const distance=wrap.position.distanceTo(G.tmpV3),follow=pet.movement==='fly-follow'?4.7:pet.movement==='ground-follow'?6.3:8.5,alpha=distance>10?1:1-Math.exp(-dt*follow);wrap.position.lerp(G.tmpV3,alpha);
  }
  if(G.formModel){
    const planar=Math.hypot(G.moveVel.x,G.moveVel.z),training=isOnTraining(),wanted=training?'run':planar>.15?(G.sprint||planar>9?'run':'walk'):'idle',next=G.formActions?.[wanted]||G.formActions?.walk||G.formActions?.idle||G.formActions?.run;
    if(next&&next!==G.formAction){G.formAction?.fadeOut?.(.12);next.reset().fadeIn(.12).play();G.formAction=next;}
    if(G.formAction){const rate=wanted==='idle'?1:characterAnimationRate()*(wanted==='walk'?.90:1);G.formAction.setEffectiveTimeScale?.(Math.max(.68,Math.min(2.2,rate)));}
    G.formMixer?.update?.(dt);
    if(G.state?.characterChoice==='demon-transformation'&&G.state?.demonGalaxyUpgrade)G.formModel.position.y=-PLAYER_HALF+.025+Math.sin(t*2.1)*.03;
  }
}
function clearCharacterOnly(){
  clearCustomVisuals();
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
  G.character=createEscapeCharacter({gender,floorOffset:PLAYER_HALF,onReady:()=>{refreshCompanionVisuals();if(toastReady){const label=activeCharacterDef(choice)?.name||(gender==='female'?'Weiblicher Charakter':'Männlicher Charakter');toast(`${label} geladen`,'good',1500)}}});
  G.playerRoot=G.character.root;G.player=G.playerRoot;G.scene.add(G.playerRoot);G.playerRoot.position.copy(G.pos);attachCharacterEffects();refreshCompanionVisuals();
}
function setCharacterChoice(choice){
  if(!G.state)return false;
  if(choice==='special')return openCharacterStudio('special');
  if(!['male','female'].includes(choice)&&!G.state.ownedSpecialCharacters.includes(choice))return false;
  if(G.state.characterChoice===choice)return toast(`${choice==='female'?'Frau':choice==='male'?'Mann':activeCharacterDef(choice)?.name||'Charakter'} ist bereits aktiv.`,'good',1100);
  G.state.characterChoice=choice;queuePersist(50);mountCharacter(choice,{toastReady:true});updateHud(true);publishEscapePresence(true,true).catch(()=>{});soundBuy();toast(`${choice==='female'?'Frau':choice==='male'?'Mann':activeCharacterDef(choice)?.name||'Spezialcharakter'} ausgewählt.`,'good',1800);return true;
}
function spendJkCoins(cost,reason='Escape.kl'){
  const spend=window.JKCoinApp?.spend;
  if(typeof spend!=='function'){toast('JK/Coin-Shop wird noch geladen.','bad',1800);return false;}
  const ok=spend.call(window.JKCoinApp,cost,reason);
  if(ok!==true){toast('Nicht genug JK/Coin.','bad',1800);return false;}
  return true;
}
function buySpecialCharacter(id){
  const def=SPECIAL_CHARACTERS.find(c=>c.id===id);if(!def)return false;
  if(G.state.ownedSpecialCharacters.includes(id))return setCharacterChoice(id);
  if(def.currency==='jk'){
    if(!spendJkCoins(def.cost,`Escape.kl · ${def.name}`))return false;
  }else{
    if(G.state.wins<def.cost)return toast(`Du brauchst ${def.cost.toLocaleString('de-DE')} Wins.`,'bad',1700);
    G.state.wins-=def.cost;
  }
  G.state.ownedSpecialCharacters.push(id);queuePersist(50);soundBuy();setCharacterChoice(id);openCharacterStudio('special');return true;
}
function upgradeDemonTransformation(){
  const def=SPECIAL_CHARACTERS.find(c=>c.id==='demon-transformation');
  if(!def||!G.state.ownedSpecialCharacters.includes('demon-transformation'))return false;
  if(G.state.demonGalaxyUpgrade)return toast('Galaxy-Skin-Upgrade ist bereits aktiv.','good',1600);
  if(!spendJkCoins(def.upgradeCost||1000,'Escape.kl · Dämonenverwandlung Galaxy-Upgrade'))return false;
  G.state.demonGalaxyUpgrade=true;queuePersist(50);soundBuy();
  if(G.state.characterChoice==='demon-transformation')mountCharacter('demon-transformation',{toastReady:false});
  updateHud(true);toast('🌌 Dämonenverwandlung jetzt mit Galaxy-Skin · +2,5 % Speed und +2,5 % Wins.','good',2800);openCharacterStudio('special');return true;
}
function characterPriceLabel(c){return c.currency==='jk'?`${c.cost.toLocaleString('de-DE')} JK/Coin`:`${c.cost.toLocaleString('de-DE')} Wins`;}
function petPercent(value){return `${(Number(value||0)*100).toFixed(1).replace('.',',')} %`;}
function petEquipped(id){return Array.isArray(G.state?.activePets)&&G.state.activePets.includes(id);}
function petSelectionSummary(){
  const pets=activePetDefs(),tot=petBonusTotals();
  return pets.length?`${pets.map(p=>p.name).join(' + ')} · +${petPercent(tot.speed)} Speed / +${petPercent(tot.wins)} Wins`:'Keine Pets ausgerüstet';
}
function petCardHtml(p){
  const owned=G.state.ownedPets.includes(p.id),active=petEquipped(p.id),free=p.category==='free'||p.currency==='wins';
  return `<article class="${owned?'owned':''} ${p.currency==='jk'?'jk':''}"><small>${free?'FREE PET':'JK/COIN PET'}</small><h3>${p.name}</h3><p>${p.desc}<br><b>+${petPercent(p.speedBonus)} Speed</b> · <b>+${petPercent(p.winsBonus)} Wins</b></p><button data-ekl-pet-pick="${p.id}">${active?'Ablegen':owned?'Ausrüsten':p.currency==='jk'?`${p.cost.toLocaleString('de-DE')} JK/Coin`:'Freischalten'}</button></article>`;
}
function refreshPetSelection({returnTo='menu'}={}){
  syncLegacyActivePet();queuePersist(50);refreshCompanionVisuals();updateHud(true);
  if(returnTo==='studio')openCharacterStudio('base');else if(returnTo==='shop')openShop('pets');else openPetEquipMenu();
}
function buyOrEquipPet(id,returnTo='menu'){
  const pet=PET_DEFS.find(p=>p.id===id);if(!pet||id==='none')return false;
  G.state.activePets=Array.isArray(G.state.activePets)?G.state.activePets:[];
  if(petEquipped(id)){
    G.state.activePets=G.state.activePets.filter(x=>x!==id);soundBuy();toast(`${pet.name} abgelegt.`,'good',1400);refreshPetSelection({returnTo});return true;
  }
  if(!G.state.ownedPets.includes(id)){
    if(pet.currency==='jk'){
      if(!spendJkCoins(pet.cost,`Escape.kl · ${pet.name}`))return false;
      G.state.ownedPets.push(id);
    }else return toast(`${pet.name} ist noch nicht freigeschaltet.`,'bad',1800),false;
  }
  if(G.state.activePets.length>=2)return toast('Du kannst maximal 2 Pets gleichzeitig benutzen. Lege zuerst ein Pet ab.','bad',2300),false;
  G.state.activePets.push(id);G.state.activePets=[...new Set(G.state.activePets)].slice(0,2);soundBuy();
  toast(`${pet.name} ausgerüstet · +${petPercent(pet.speedBonus)} Speed / +${petPercent(pet.winsBonus)} Wins.`,'good',2300);refreshPetSelection({returnTo});return true;
}
function unequipAllPets(){
  G.state.activePets=[];syncLegacyActivePet();queuePersist(50);refreshCompanionVisuals();updateHud(true);toast('Alle Pets abgelegt.','good',1400);openPetEquipMenu();
}
function equipBestPets(){
  const owned=PET_DEFS.filter(p=>p.id!=='none'&&G.state.ownedPets.includes(p.id)).sort((a,b)=>((b.speedBonus+b.winsBonus)-(a.speedBonus+a.winsBonus))||(b.speedBonus-a.speedBonus)||(b.winsBonus-a.winsBonus));
  G.state.activePets=owned.slice(0,2).map(p=>p.id);syncLegacyActivePet();queuePersist(50);refreshCompanionVisuals();updateHud(true);
  toast(G.state.activePets.length?`Beste Pets ausgerüstet: ${activePetDefs().map(p=>p.name).join(' + ')}`:'Du besitzt noch kein Pet.','good',2200);openPetEquipMenu();
}
function openPetEquipMenu(){
  const active=activePetDefs(),free=PET_DEFS.filter(p=>p.id!=='none'&&(p.category==='free'||p.currency==='wins')),paid=PET_DEFS.filter(p=>p.id!=='none'&&p.currency==='jk');
  const wrap=openModal(`<div class="ekl-modal"><div class="ekl-modal-head"><div><small>ESCAPE.KL · PETS</small><h2>🪽 Pets ausrüsten</h2><p>Maximal zwei Pets gleichzeitig. Lauf- und Flug-Pets folgen dir mit eigener Animation; ihre Speed- und Win-Boni werden addiert.</p></div><button data-ekl-modal-close>×</button></div><div class="ekl-big-stat"><div><small>SLOTS</small><b>${active.length}/2</b></div><div><small>PET-SPEED</small><b>+${petPercent(petBonusTotals().speed)}</b></div><div><small>PET-WINS</small><b>+${petPercent(petBonusTotals().wins)}</b></div></div><div class="ekl-modal-actions"><button class="gold" data-ekl-best-pets>⭐ Beste Pets</button><button data-ekl-clear-pets>Alle ablegen</button><button class="jk" data-ekl-pets-jk-shop>◆ JK-Shop</button></div><div class="ekl-character-special-head"><b>🆓 Free Pets</b><span>Kostenlos erspielte Pets</span></div>${free.length?`<div class="ekl-shop-grid">${free.map(petCardHtml).join('')}</div>`:`<div class="ekl-world-economy-note"><b>Noch keine Free Pets im aktuellen Katalog.</b><span>Die Kategorie ist vorbereitet; spätere kostenlose Pets erscheinen automatisch hier.</span></div>`}<div class="ekl-character-special-head"><b>◆ JK Pets</b><span>Premium-Pets · dauerhaft im Besitz</span></div><div class="ekl-shop-grid">${paid.map(petCardHtml).join('')}</div><div class="ekl-world-economy-note"><b>Aktiv:</b><span>${petSelectionSummary()}</span></div></div>`);
  wrap.querySelectorAll('[data-ekl-pet-pick]').forEach(b=>b.onclick=()=>buyOrEquipPet(b.dataset.eklPetPick,'menu'));
  wrap.querySelector('[data-ekl-best-pets]')?.addEventListener('click',equipBestPets);wrap.querySelector('[data-ekl-clear-pets]')?.addEventListener('click',unequipAllPets);wrap.querySelector('[data-ekl-pets-jk-shop]')?.addEventListener('click',openJkCoinShop);
}
function openCharacterStudio(tab='base'){
  const active=G.state.characterChoice,specialActive=activeCharacterDef(active);
  const wrap=openModal(`<div class="ekl-modal ekl-character-modal"><div class="ekl-modal-head"><div><small>ESCAPE HUB · CHARAKTER STUDIO</small><h2>🧍 Charakter wählen</h2><p>Mann und Frau sind jederzeit kostenlos wechselbar. Spezialcharaktere und Pets sind getrennte Systeme; bis zu zwei Pets können gleichzeitig aktiv sein.</p></div><button data-ekl-modal-close>×</button></div><div class="ekl-character-choice"><button data-ekl-character="male" class="${active==='male'?'active':''}"><b>♂ Mann</b><span>JK.Games Hauptskin + Mann-Animationen</span></button><button data-ekl-character="female" class="${active==='female'?'active':''}"><b>♀ Frau</b><span>JK.Games Hauptskin + Frau-Animationen</span></button></div><div class="ekl-character-special-head"><b>✨ Spezialcharaktere</b><span>${specialActive?`Aktiv: ${specialActive.name}`:'Kein Spezialcharakter aktiv'}</span></div><div class="ekl-shop-grid">${SPECIAL_CHARACTERS.map(c=>{const owned=G.state.ownedSpecialCharacters.includes(c.id),isActive=active===c.id,isDemon=c.id==='demon-transformation',upgraded=isDemon&&G.state.demonGalaxyUpgrade;return `<article class="${owned?'owned':''}"><small>${c.currency==='jk'?'JK/COIN':'SPEZIALCHARAKTER'}</small><h3>${c.name}</h3><p>${c.desc}${isDemon?`<br>Galaxy-Upgrade: ${c.upgradeCost.toLocaleString('de-DE')} JK/Coin · danach +2,5 % Speed / Wins.`:''}</p><div class="ekl-item-actions"><button data-ekl-special="${c.id}" ${isActive?'disabled':''}>${isActive?'AKTIV':owned?'Ausrüsten':characterPriceLabel(c)}</button>${isDemon&&owned?`<button data-ekl-special-upgrade="${c.id}" ${upgraded?'disabled':''}>${upgraded?'Galaxy aktiv':`${c.upgradeCost.toLocaleString('de-DE')} JK/Coin`}</button>`:''}</div></article>`}).join('')}</div><div class="ekl-character-special-head"><b>🪽 Pets</b><span>${petSelectionSummary()}</span></div><div class="ekl-modal-actions"><button data-ekl-open-pets>Pets ausrüsten</button><button data-ekl-best-pets-studio>⭐ Beste Pets</button></div><div class="ekl-character-trail-position"><b>Spur-Position</b><button data-ekl-trail-pos="feet" class="${G.state.trailPlacement==='feet'?'active':''}">👟 Fußspur</button><button data-ekl-trail-pos="back" class="${G.state.trailPlacement==='back'?'active':''}">🎒 Rückenspur</button></div></div>`);
  wrap.querySelectorAll('[data-ekl-character]').forEach(b=>b.onclick=()=>{setCharacterChoice(b.dataset.eklCharacter);openCharacterStudio('base')});
  wrap.querySelectorAll('[data-ekl-special]').forEach(b=>b.onclick=()=>buySpecialCharacter(b.dataset.eklSpecial));
  wrap.querySelectorAll('[data-ekl-special-upgrade]').forEach(b=>b.onclick=()=>upgradeDemonTransformation());
  wrap.querySelector('[data-ekl-open-pets]')?.addEventListener('click',openPetEquipMenu);wrap.querySelector('[data-ekl-best-pets-studio]')?.addEventListener('click',equipBestPets);
  wrap.querySelectorAll('[data-ekl-trail-pos]').forEach(b=>b.onclick=()=>{setTrailPlacement(b.dataset.eklTrailPos);openCharacterStudio(tab)});
}
function createTrailPool(){
  if(G.trail){try{G.scene?.remove(G.trail)}catch{}G.trail=null;}
  G.trail=new THREE.Group();G.trail.name='escape-particle-trail';G.scene.add(G.trail);G.trailParticles=[];
  const particleGeo=geo('trail-particle',()=>new THREE.SphereGeometry(.09,7,5));
  for(let i=0;i<52;i++){
    const material=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
    G.materials.set(`trail-particle-${i}`,material);
    const mesh=new THREE.Mesh(particleGeo,material);mesh.visible=false;G.trail.add(mesh);
    G.trailParticles.push({mesh,age:9,life:1,vel:new THREE.Vector3(),seed:Math.random()});
  }
}
function createPlayer(){mountCharacter(G.state.characterChoice);createTrailPool();}
function trailDef(){return TRAILS.find(x=>x.id===G.state?.trail)||TRAILS[0];}
function setTrailColor(){const t=trailDef();for(const p of G.trailParticles||[])p.mesh.material.color.setHex(t.color);}
function setTrailPlacement(place){G.state.trailPlacement=place==='back'?'back':'feet';queuePersist(50);toast(G.state.trailPlacement==='back'?'🎒 Rückenspur aktiviert.':'👟 Fußspur aktiviert.','good',1400);}
function setAuraStyle(){const a=AURAS.find(x=>x.id===G.state?.aura)||AURAS[0];for(const ring of G.auraRings){ring.material.color.setHex(a.color);ring.material.opacity=a.id==='none'?0:.36;ring.visible=a.id!=='none';}}
function updateAura(t){if(G.specialFxGroup){G.specialFxGroup.rotation.y=t*.7;G.specialFxGroup.children.forEach((r,i)=>{r.rotation.z=t*(i%2?-.9:.75)+i*.6;});}if(!G.auraGroup||G.state?.aura==='none')return;G.auraGroup.rotation.y=t*.55;G.auraRings.forEach((r,i)=>{r.rotation.z=t*(i%2?-.8:.65)+i*.8;const pulse=1+Math.sin(t*2+i)*.05;r.scale.setScalar(pulse);r.material.opacity=.25+i*.07+Math.sin(t*2.3+i)*.04;});}

function disposeHitboxDebug(){
  if(G.hitboxDebugGroup){G.hitboxDebugGroup.traverse(o=>{if(o.isMesh){try{o.geometry?.dispose?.();o.material?.dispose?.()}catch{}}});G.hitboxDebugGroup.removeFromParent?.();}
  G.hitboxDebugGroup=null;G.hitboxDebugItems=[];G.hitboxDebugPlayer=null;
}
function rebuildHitboxDebug(){
  disposeHitboxDebug();if(!G.scene||!G.hitboxDebugEnabled)return;
  const group=new THREE.Group();group.name='escape-owner-hitbox-debug';G.scene.add(group);G.hitboxDebugGroup=group;
  const mk=(color,opacity=.18)=>new THREE.MeshBasicMaterial({color,wireframe:true,transparent:true,opacity,depthTest:false,depthWrite:false});
  const debugOnly=mesh=>{mesh.renderOrder=999;mesh.frustumCulled=false;mesh.userData.escapeHitboxDebug=true;mesh.raycast=()=>{};return mesh;};
  // V460: Debug-Hitboxen sind ausschließlich eine sichtbare Overlay-Hilfe. Sie werden
  // niemals als Kollisions-, Trigger- oder Raycast-Flächen benutzt und können die
  // Spielerbewegung deshalb nicht blockieren oder verändern.
  for(const p of G.platforms){const mesh=debugOnly(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),mk(p.kind==='win-pad'?0xffd84d:0x56ff9a,.42)));mesh.scale.set(p.w,p.h,p.d);group.add(mesh);G.hitboxDebugItems.push({mesh,p,scope:p.scope});}
  for(const c of G.colliders){const mesh=debugOnly(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),mk(0xff5f68,.5)));mesh.scale.set(c.w,3.2,c.d);mesh.position.set(c.x,1.6,c.z);group.add(mesh);G.hitboxDebugItems.push({mesh,c,scope:c.scope,collider:true});}
  for(const tr of G.autoTriggers){const mesh=debugOnly(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),mk(0xffd65c,.48)));mesh.scale.set(tr.w,.18,tr.d);mesh.position.set(tr.x,.75,tr.z);group.add(mesh);G.hitboxDebugItems.push({mesh,tr,scope:tr.scope,trigger:true});}
  for(const h of G.hazards){const mesh=debugOnly(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),mk(0xff304f,.58)));mesh.scale.set(h.w,h.h,h.d);mesh.position.copy(h.mesh.position);group.add(mesh);G.hitboxDebugItems.push({mesh,h,scope:h.scope,hazard:true});}
  const player=debugOnly(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),mk(0x55d9ff,.75)));player.renderOrder=1000;group.add(player);G.hitboxDebugPlayer=player;updateHitboxDebug();
}
function updateHitboxDebug(){
  if(!G.hitboxDebugEnabled||!G.hitboxDebugGroup)return;
  for(const it of G.hitboxDebugItems){it.mesh.visible=it.scope===G.world;if(!it.mesh.visible)continue;if(it.p)it.mesh.position.copy(it.p.mesh.position);else if(it.h)it.mesh.position.copy(it.h.mesh.position);}
  if(G.hitboxDebugPlayer){G.hitboxDebugPlayer.visible=true;G.hitboxDebugPlayer.position.copy(G.pos);G.hitboxDebugPlayer.scale.set(currentPlayerRadius()*2,PLAYER_HALF*2,currentPlayerRadius()*2);}
}
function setHitboxDebug(enabled){G.hitboxDebugEnabled=!!enabled;if(G.hitboxDebugEnabled)rebuildHitboxDebug();else disposeHitboxDebug();toast(G.hitboxDebugEnabled?'🧰 Hitbox-Debug AN · Grün=Sprungflächen · Rot=Wände · Gelb=Trigger':'🧰 Hitbox-Debug AUS','good',2100);}
function resetRunTech(){G.runCombo=0;G.comboLastAt=0;G.comboVisited.clear();G.perfectLandingClaims.clear();}
function registerRunLanding(p){
  if(!isEscapeWorld()||!p||p.kind==='win-pad'||p.kind==='start')return;const key=p.mesh?.uuid||`${p.scope}:${p.stage}:${p.label}`;if(G.comboVisited.has(key))return;G.comboVisited.add(key);
  const now=performance.now();G.runCombo=(G.comboLastAt&&now-G.comboLastAt<=4500)?G.runCombo+1:1;G.comboLastAt=now;
  if(G.runCombo>G.state.bestRunCombo){G.state.bestRunCombo=G.runCombo;queuePersist(1800);}
  const dx=Math.abs(G.pos.x-p.mesh.position.x),dz=Math.abs(G.pos.z-p.mesh.position.z),perfect=dx<=Math.max(.2,p.w*.18)&&dz<=Math.max(.2,p.d*.18);
  if(perfect&&!G.perfectLandingClaims.has(key)){G.perfectLandingClaims.add(key);const bonus=Math.max(1,Math.round(levelPowerPerRunPoint()*(.20+Math.min(10,G.runCombo)*.05)));addLevelPower(bonus,true,G.world);toast(`🎯 PERFECT LANDING · COMBO ×${G.runCombo} · +${fmt(bonus)} Power`,'good',1050);}
}
function setWorld(id,initial=false){
  cancelReviveOffer(true);removeSummonedTreadmill();
  G.world=id;G.runFinished=false;G.activeInteractable=null;closeModal();G.yaw=0;G.jumpQueuedUntil=0;G.jumpHeld=false;G.stageClaims.clear();resetRunTech();G.trainingStreakSeconds=0;G.trainingStreakTier=0;
  const w=escapeWorldById(id);
  if(id==='hub'){
    G.stage=0;G.deaths=0;G.runStartedAt=0;G.runFurthestZ=30;G.checkpoint={x:0,y:1.10,z:30};teleport(0,1.10,30);G.reviveAnchor.copy(G.pos);G.reviveSupport=null;G.reviveStage=0;
    G.scene.background.setHex(0x07111d);G.scene.fog.color.setHex(0x07111d);G.scene.fog.near=38;G.scene.fog.far=225;
    if(initial)toast('Willkommen im neuen Escape.kl Hub · Training, Welten und Upgrades sind jetzt klar getrennt.','good',2500);
  }else if(w&&!w.locked){
    G.state.activeTrainingWorld=w.id;queuePersist(700);
    G.stage=1;G.deaths=0;G.runStartedAt=performance.now();G.runFurthestZ=Number(w.start?.z)||-70;G.checkpoint=null;
    teleport(Number(w.start?.x)||0,Number(w.start?.y)||1.5,Number(w.start?.z)||-70);G.reviveAnchor.copy(G.pos);G.reviveSupport=null;G.reviveStage=1;G.reviveYaw=0;
    G.scene.background.setHex(Number(w.background)||0x07111d);G.scene.fog.color.setHex(Number(w.fog)||Number(w.background)||0x07111d);G.scene.fog.near=38;G.scene.fog.far=225;
    toast(`${w.name} · Speed ${Math.round(currentSpeedStat(w.id))}/300 · Bei einem Fall hast du 5 Sekunden für JK/Coin-Revive.`,'good',2400);
  }else if(id==='only-up'){
    const startY=1.15+.6/2+PLAYER_HALF+.08;G.stage=1;G.deaths=0;G.runStartedAt=performance.now();G.runFurthestZ=0;G.checkpoint=null;G.stageClaims.clear();teleport(0,startY,0);G.scene.background.setHex(0x101a36);G.scene.fog.color.setHex(0x101a36);G.scene.fog.near=55;G.scene.fog.far=260;toast('JK SKYRUN · alle haben Speed 100 · keine Checkpoints · Bestzeit zählt!','good',2600);
  }else if(id==='race'){
    const raceY=.4+.55/2+PLAYER_HALF+.08;
    G.stage=1;G.deaths=0;G.runStartedAt=performance.now();G.runFurthestZ=20;G.checkpoint={x:72,y:raceY,z:20};teleport(72,raceY,20);
    G.scene.background.setHex(0x1b0c08);G.scene.fog.color.setHex(0x1b0c08);
    toast('Speed Race gestartet · 5 Race-Checkpoints · Bestzeit zählt!','good',2000);
  }
  resetHazardsForWorld(id);applyWorldVisibility();if(id==='hub')refreshHubWorldPortalStatus();if(G.hitboxDebugEnabled)rebuildHitboxDebug();updateHud(true);refreshEscapeMultiplayerWorld();
}
function enterWorld(id){
  const w=escapeWorldById(id);if(!w)return;
  if(w.locked)return toast(`${w.name} kommt in einem späteren Escape.kl-Update.`,'bad',2600);
  const status=worldUnlockStatus(w);
  if(!status.unlocked){
    const sourceName=escapeWorldById(status.sourceId)?.name||'Vorwelt';
    const parts=[];
    if(status.level<status.requiredLevel)parts.push(`${sourceName} Level ${status.level}/${status.requiredLevel}`);
    if(!status.completionReady)parts.push(`${status.runs||0}/${status.requiredRuns||1} Finish`);
    return toast(`🔒 ${w.name}: ${parts.join(' · ')||status.reason}`,'bad',3200);
  }
  if(!G.state.worldsUnlocked.includes(id)){G.state.worldsUnlocked.push(id);queuePersist(80);}
  G.state.activeTrainingWorld=id;
  setWorld(id);
}
function teleport(x,y,z){G.pos.set(x,y,z);G.vel.set(0,0,0);G.moveVel.set(0,0,0);G.grounded=false;G.lastGroundedAt=0;G.coyoteAvailable=false;G.support=null;G.lastSupport=null;G.lastGroundPos.copy(G.pos);G.trailPoints=[];G.trailEmitCarry=0;for(const tp of G.trailParticles||[]){tp.age=tp.life;tp.mesh.visible=false;}if(G.playerRoot)G.playerRoot.position.copy(G.pos);}
function reviveCostForWorld(id=G.world){return Math.max(0,Number(REVIVE_COSTS[id])||0);}
function clearReviveUi(){G.overlay?.querySelector('[data-ekl-revive]')?.remove();}
function cancelReviveOffer(unpause=true){
  if(G.reviveTimer){clearTimeout(G.reviveTimer);G.reviveTimer=0;}if(G.reviveTicker){clearInterval(G.reviveTicker);G.reviveTicker=0;}
  G.revivePending=false;clearReviveUi();if(unpause)G.paused=false;
}
function resetEscapeRun({countDeath=true,showToast=true}={}){
  const w=currentWorldDef();if(!w)return;
  if(countDeath)G.deaths++;
  G.stage=1;G.stageClaims.clear();resetRunTech();G.runStartedAt=performance.now();G.runFurthestZ=Number(w?.start?.z)||-70;
  resetHazardsForWorld(w.id);
  teleport(Number(w?.start?.x)||0,Number(w?.start?.y)||1.5,Number(w?.start?.z)||-70);
  G.reviveAnchor.copy(G.pos);G.reviveSupport=null;G.reviveStage=1;G.reviveYaw=0;
  if(showToast)toast(`Run verloren · ${w?.name||'Welt'} startet wieder bei Stage 1`,'bad',1750);
  updateHud(true);
}
function updateReviveCard(){
  const card=G.overlay?.querySelector('[data-ekl-revive]');if(!card||!G.revivePending)return;
  const left=Math.max(0,G.reviveDeadline-Date.now()),seconds=(left/1000).toFixed(1).replace('.',',');
  const balance=Math.max(0,Math.floor(Number(window.JKCoinApp?.coinState?.()?.balance)||0)),cost=reviveCostForWorld();
  const time=card.querySelector('[data-ekl-revive-time]'),wallet=card.querySelector('[data-ekl-revive-wallet]'),button=card.querySelector('[data-ekl-revive-buy]');
  if(time)time.textContent=`${seconds}s`;
  if(wallet)wallet.textContent=`${balance.toLocaleString('de-DE')} JK/Coin verfügbar`;
  if(button){button.disabled=balance<cost;button.textContent=balance>=cost?`${cost} JK/Coin · ZURÜCK`:`${cost} JK/Coin benötigt`;}
}
function finishReviveWindow(){
  if(!G.revivePending)return;
  // V473: Der Spieler ist bereits sofort am Weltstart und darf weiterspielen.
  // Nach 5 Sekunden verschwindet nur noch das optionale 20-JK/Coin-Rueckkehrangebot.
  cancelReviveOffer(false);G.paused=false;
}
function tryReviveWithJk(){
  if(!G.revivePending||!isEscapeWorld())return false;
  const cost=reviveCostForWorld(),w=currentWorldDef(),spend=window.JKCoinApp?.spend;
  if(typeof spend!=='function')return toast('JK/Coin-System ist noch nicht bereit.','bad',1600),false;
  const balance=Math.max(0,Math.floor(Number(window.JKCoinApp?.coinState?.()?.balance)||0));
  if(balance<cost)return toast(`Du brauchst ${cost.toLocaleString('de-DE')} JK/Coin.`,'bad',1600),false;
  if(spend.call(window.JKCoinApp,cost,`Escape.kl · World ${w?.number||'?'} Rückkehr zur letzten Plattform`)!==true)return toast('Rückkehr konnte nicht bezahlt werden.','bad',1600),false;
  // V476: Das bezahlte Rueckkehrziel wird beim Sturz separat eingefroren und kann nicht mehr
  // durch die sofortige Weiterbewegung am Weltstart ueberschrieben werden.
  const elapsed=Math.max(0,performance.now()-G.reviveStartedAt),anchor=G.reviveOfferAnchor.clone(),stage=Math.max(1,G.reviveOfferStage||1),yaw=G.reviveOfferYaw;
  if(G.reviveOfferSupport?.scope===G.world&&G.reviveOfferSupport?.mesh){const p=G.reviveOfferSupport;anchor.set(p.mesh.position.x+G.reviveOfferOffsetX,p.mesh.position.y+p.h/2+PLAYER_HALF+.10,p.mesh.position.z+G.reviveOfferOffsetZ);}
  const offerSupport=G.reviveOfferSupport,offerOffsetX=G.reviveOfferOffsetX,offerOffsetZ=G.reviveOfferOffsetZ;
  const savedClaims=G.reviveOfferStageClaims instanceof Set?new Set(G.reviveOfferStageClaims):null;
  cancelReviveOffer(false);G.paused=false;if(G.runStartedAt)G.runStartedAt+=elapsed;resetHazardsForWorld(G.world);
  teleport(anchor.x,anchor.y+.08,anchor.z);G.stage=stage;if(savedClaims)G.stageClaims=savedClaims;if(G.playerRoot)G.playerRoot.rotation.y=yaw;
  G.reviveAnchor.copy(anchor);G.reviveSupport=offerSupport;G.reviveOffsetX=offerOffsetX;G.reviveOffsetZ=offerOffsetZ;G.reviveStage=stage;G.reviveYaw=yaw;
  soundFinish();toast(`◆ Zurück zur letzten Plattform · ${cost} JK/Coin · Stage ${stage}`,'good',1900);updateHud(true);return true;
}
function beginReviveOffer(){
  if(!isEscapeWorld())return;
  // Ein weiterer Sturz waehrend des kleinen 5-Sekunden-Angebots darf das Spiel nie festhaengen.
  if(G.revivePending)cancelReviveOffer(false);
  const w=currentWorldDef(),cost=reviveCostForWorld();if(!w||!cost)return resetEscapeRun();
  // V473: letzte sichere Stelle zuerst sichern, dann SOFORT am Weltstart weiterspielen.
  const savedAnchor=G.reviveAnchor.clone(),savedSupport=G.reviveSupport,savedOffsetX=G.reviveOffsetX,savedOffsetZ=G.reviveOffsetZ,savedStage=Math.max(1,G.reviveStage||G.stage||1),savedYaw=G.reviveYaw,savedClaims=new Set(G.stageClaims||[]);
  soundFail();G.deaths++;resetRunTech();G.revivePending=true;G.paused=false;G.reviveStartedAt=performance.now();G.reviveDeadline=Date.now()+REVIVE_WINDOW_MS;G.vel.set(0,0,0);G.moveVel.set(0,0,0);G.mobileX=G.mobileY=0;G.mobileSprint=false;
  G.stage=1;G.stageClaims.clear();G.runStartedAt=performance.now();G.runFurthestZ=Number(w?.start?.z)||-70;resetHazardsForWorld(w.id);
  teleport(Number(w?.start?.x)||0,Number(w?.start?.y)||1.5,Number(w?.start?.z)||-70);
  // V476: Das Angebot merkt sich die Plattform VOR dem Sturz separat.
  G.reviveOfferAnchor.copy(savedAnchor);G.reviveOfferSupport=savedSupport;G.reviveOfferOffsetX=savedOffsetX;G.reviveOfferOffsetZ=savedOffsetZ;G.reviveOfferStage=savedStage;G.reviveOfferYaw=savedYaw;G.reviveOfferStageClaims=savedClaims;
  // Der normale Anker gehoert ab jetzt wieder zum neuen Lauf am Weltstart.
  G.reviveAnchor.copy(G.pos);G.reviveSupport=null;G.reviveOffsetX=0;G.reviveOffsetZ=0;G.reviveStage=1;G.reviveYaw=G.playerRoot?.rotation.y||0;G.reviveStageClaims=null;
  const card=document.createElement('div');card.className='ekl-revive ekl-revive-compact';card.dataset.eklRevive='1';
  card.innerHTML=`<div class="ekl-revive-card"><div class="ekl-revive-main"><span><small>STAGE ${savedStage}</small><b>Zur letzten Plattform?</b></span><strong data-ekl-revive-time>5,0s</strong></div><div class="ekl-revive-actions"><span data-ekl-revive-wallet>JK/Coin wird geladen …</span><button data-ekl-revive-buy>${cost} JK/Coin · ZURÜCK</button></div></div>`;
  G.overlay?.append(card);card.querySelector('[data-ekl-revive-buy]')?.addEventListener('click',tryReviveWithJk);
  updateReviveCard();G.reviveTicker=setInterval(updateReviveCard,100);G.reviveTimer=setTimeout(finishReviveWindow,REVIVE_WINDOW_MS+40);updateHud(true);
}
function respawn(){
  if(G.revivePending){cancelReviveOffer(false);G.paused=false;}
  soundFail();
  if(isEscapeWorld()){resetEscapeRun({countDeath:true,showToast:true});return;}
  if(G.world==='only-up'){
    // JK SKYRUN has neither checkpoints nor JK/Coin revive. Falling starts a fresh timed attempt.
    G.deaths++;G.runFinished=false;G.stage=1;G.stageClaims.clear();G.runStartedAt=performance.now();G.runFurthestZ=0;G.checkpoint=null;G.vel.set(0,0,0);G.moveVel.set(0,0,0);
    const startY=1.15+.6/2+PLAYER_HALF+.08;teleport(0,startY,0);toast('JK SKYRUN · abgestürzt · neuer Versuch von ganz unten.','bad',1700);updateHud(true);return;
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
function platformUnder(x,z,fromBottom,toBottom){let best=null,bestTop=-Infinity;for(const p of G.platforms){if(p.scope!==G.world||!p.active)continue;const px=p.mesh.position.x,pz=p.mesh.position.z,top=p.mesh.position.y+p.h/2;if(Math.abs(x-px)>p.w/2+currentPlayerRadius()*.20||Math.abs(z-pz)>p.d/2+currentPlayerRadius()*.20)continue;if(fromBottom>=top-.24&&toBottom<=top+.34&&top>bestTop){best=p;bestTop=top}}return best?{p:best,top:bestTop}:null;}
function treadmillDef(id){return TREADMILLS.find(t=>t.id===id)||TREADMILLS[0];}
function treadmillUnlocked(def,worldId=progressWorldId()){
  if(!def)return false;
  if(def.access==='free')return true;
  if(def.access==='level')return currentLevel(worldId)>=Math.max(0,Number(def.level)||0);
  if(def.access==='wins')return Array.isArray(G.state?.ownedTreadmills)&&G.state.ownedTreadmills.includes(def.id);
  if(def.access==='jk'){
    if(Array.isArray(G.state?.ownedTreadmills)&&G.state.ownedTreadmills.includes(def.id))return true;
    // Backwards compatibility for old Gold/Diamond entitlements.
    if(def.id==='gold')return Number(G.state?.jkTreadmillTier||0)>=1;
    if(def.id==='diamond')return Number(G.state?.jkTreadmillTier||0)>=2;
    return false;
  }
  return false;
}
function treadmillRequirement(def,worldId=progressWorldId()){
  if(!def)return '';
  if(def.access==='free')return 'Immer verfügbar';
  if(def.access==='level')return `${escapeWorldById(worldId)?.name||'Trainingswelt'} Level ${def.level}`;
  if(def.access==='wins')return `${Number(def.cost||0).toLocaleString('de-DE')} Wins`;
  if(def.access==='jk')return `${def.name} · ${Number(def.jkCost||0).toLocaleString('de-DE')} JK/Coin`;
  return '';
}
function trainingInfo(){
  if(G.world!=='hub'||!G.grounded||!G.support?.training)return null;
  const def=treadmillDef(G.support.trainingId);
  return {platform:G.support,def,unlocked:treadmillUnlocked(def),mult:def.mult,name:def.name};
}
function isOnTraining(){return !!trainingInfo()?.unlocked;}
function removeSummonedTreadmill(){
  const rt=G.summonedTreadmill;if(!rt)return false;
  if(G.support&&rt.platforms?.includes(G.support)){G.support=null;G.grounded=false;}
  for(const p of rt.platforms||[]){p.mesh?.removeFromParent?.();const i=G.platforms.indexOf(p);if(i>=0)G.platforms.splice(i,1);}
  for(const o of rt.decorative||[]){o?.removeFromParent?.();const i=G.decorative.indexOf(o);if(i>=0)G.decorative.splice(i,1);}
  G.summonedTreadmill=null;if(G.hitboxDebugEnabled)rebuildHitboxDebug();return true;
}
function spawnSummonedTreadmill(id){
  const def=treadmillDef(id),worldId=progressWorldId();if(!def||!treadmillUnlocked(def,worldId))return false;
  const old=G.summonedTreadmill;
  const oldIsSupport=!!(old&&G.support&&old.platforms?.includes(G.support));
  const floorTop=oldIsSupport?Number(old.floorTop):G.support?(G.support.mesh.position.y+G.support.h/2):(G.pos.y-PLAYER_HALF);
  removeSummonedTreadmill();
  const prevScope=G.buildScope;G.buildScope=G.world;
  const p0=G.platforms.length,d0=G.decorative.length;
  const x=G.pos.x,z=G.pos.z,y=(Number.isFinite(floorTop)?floorTop:0)+.005;
  const beltColor=def.id==='galaxy'?0x140b25:def.id==='admin'?0x19090e:0x0c141a;
  const railColor=def.id==='galaxy'?0x4e2a72:def.id==='admin'?0x652132:0x314858;
  const tr=addPlatform({x,y,z,w:4.35,h:.24,d:7.0,color:new THREE.Color(def.color).multiplyScalar(.42).getHex(),label:'',kind:'training',hub:G.world==='hub'});
  tr.training=true;tr.trainingMult=def.mult;tr.trainingId=def.id;tr.trainingName=`${def.name} ×${String(def.mult).replace('.',',')}`;tr.summoned=true;
  boxDeco(x,y+.145,z,3.72,.075,6.18,beltColor);for(let sl=-2.45;sl<=2.45;sl+=.70)boxDeco(x,y+.19,z+sl,3.35,.022,.055,def.id==='galaxy'?0x9d6cff:def.id==='admin'?0xff657d:0x53636e);
  boxDeco(x-1.88,y+.42,z,.14,.54,6.55,railColor,def.color);boxDeco(x+1.88,y+.42,z,.14,.54,6.55,railColor,def.color);
  for(const sx of[-1.34,1.34])boxDeco(x+sx,y+1.35,z+3.0,.15,2.25,.18,railColor,def.color);
  boxDeco(x,y+2.35,z+3.0,2.9,.16,.20,railColor,def.color);boxDeco(x,y+1.97,z+2.82,1.9,.72,.38,0x071019,def.color);boxDeco(x,y+1.98,z+2.59,1.28,.34,.06,def.color,def.color);
  if(def.id==='galaxy'){addRingDeco(x,y+.42,z,2.0,.035,0xc996ff,Math.PI/2);addRingDeco(x,y+.46,z,1.55,.025,0x6bdcff,Math.PI/2);}
  if(def.id==='admin'){addRingDeco(x,y+.42,z,2.0,.04,0xff496d,Math.PI/2);addRingDeco(x,y+.46,z,1.55,.027,0xffd36a,Math.PI/2);}
  addSign(`${def.name}  ×${String(def.mult).replace('.',',')}`,{x,y:y+3.35,z:z+3.12},def.color,.36);
  const platforms=G.platforms.slice(p0),decorative=G.decorative.slice(d0);G.buildScope=prevScope;
  G.summonedTreadmill={id:def.id,scope:G.world,platform:tr,platforms,decorative,floorTop:Number.isFinite(floorTop)?floorTop:0,wasUsed:true};
  // Spawn directly under the player: no awkward searching after closing the pause menu.
  G.pos.y=tr.mesh.position.y+tr.h/2+PLAYER_HALF+.08;G.vel.set(0,0,0);G.moveVel.set(0,0,0);G.support=tr;G.grounded=true;G.lastGroundPos.copy(G.pos);if(G.playerRoot)G.playerRoot.position.copy(G.pos);
  if(G.hitboxDebugEnabled)rebuildHitboxDebug();
  queuePersist(500);updateHud(true);soundBuy();toast(`🏃 ${def.name} ×${String(def.mult).replace('.',',')} erzeugt · einfach herunterlaufen zum Verlassen.`,'good',2300);return true;
}
function openTreadmillSpawnMenu(){
  const worldId=progressWorldId(),cards=TREADMILLS.map(def=>{const unlocked=treadmillUnlocked(def,worldId),active=G.summonedTreadmill?.id===def.id&&G.summonedTreadmill?.scope===G.world;const req=treadmillRequirement(def,worldId);const power=Math.max(1,Math.round(TREADMILL_TICKS_PER_SECOND*levelPowerPerRunPoint()*def.mult*(1+treadmillCoreBonus())));return `<button class="ekl-training-world-card ${active?'active':''}" data-ekl-summon-treadmill="${def.id}" ${unlocked?'':'data-locked="1"'}><b>${def.name} · ×${String(def.mult).replace('.',',')}</b><span>${active?'AKTUELL ERZEUGT':unlocked?`FREI · ca. +${fmt(power)} Power/s`:`🔒 ${req}`}</span></button>`;}).join('');
  const wrap=openModal(`<div class="ekl-modal ekl-treadmill-modal"><div class="ekl-modal-head"><div><small>PAUSE · LAUFBAND ERZEUGEN</small><h2>🏃 Laufband auswählen</h2><p>Erzeuge genau ein Laufband direkt unter deinem Charakter. FREE bis DIAMOND können hier ebenfalls benutzt werden. GALAXY ×6 und ADMIN ×10 existieren ausschließlich als erzeugbare Premium-Laufbänder und stehen nicht dauerhaft im Training Hall.</p></div><button data-ekl-modal-close>×</button></div><div class="ekl-training-world-grid">${cards}</div><div class="ekl-progression-note"><b>TRAININGSWELT</b><span>${escapeWorldById(worldId)?.name||worldId} · Level ${currentLevel(worldId)} · Speed ${Math.round(currentSpeedStat(worldId))}/300</span></div><div class="ekl-modal-actions"><button data-ekl-remove-summoned ${G.summonedTreadmill?'':'disabled'}>Erzeugtes Laufband entfernen</button><button class="jk" data-ekl-open-jk>JK/Coin-Shop</button><button data-ekl-back-pause>Zurück</button></div></div>`);
  wrap.querySelectorAll('[data-ekl-modal-close],[data-ekl-back-pause]').forEach(b=>b.onclick=()=>{closeModal();setTimeout(showPause,0);});
  wrap.querySelectorAll('[data-ekl-summon-treadmill]').forEach(b=>b.onclick=()=>{const def=treadmillDef(b.dataset.eklSummonTreadmill);if(!treadmillUnlocked(def,worldId)){if(def.access==='jk')return openJkCoinShop();return toast(`🔒 ${treadmillRequirement(def,worldId)}`,'bad',1800);}if(spawnSummonedTreadmill(def.id)){closeModal();G.paused=false;}});
  wrap.querySelector('[data-ekl-remove-summoned]')?.addEventListener('click',()=>{removeSummonedTreadmill();closeModal();G.paused=false;toast('Erzeugtes Laufband entfernt.','good',1500);});
  wrap.querySelector('[data-ekl-open-jk]')?.addEventListener('click',openJkCoinShop);
}
function openTrainingWorldSelector(){
  const cards=WORLD_DEFS.filter(w=>!w.locked).map(w=>{
    const st=worldUnlockStatus(w),active=G.state.activeTrainingWorld===w.id;
    return `<button class="ekl-training-world-card ${active?'active':''}" data-ekl-train-world="${w.id}" ${st.unlocked?'':'disabled'}><b>WORLD ${w.number} · ${w.name}</b><span>${active?'AKTIVE TRAININGSWELT':st.unlocked?`Level ${currentLevel(w.id)} · Speed ${Math.round(currentSpeedStat(w.id))}/300`:`🔒 ${st.reason||'gesperrt'}`}</span></button>`;
  }).join('');
  const wrap=openModal(`<div class="ekl-modal"><div class="ekl-modal-head"><div><small>TRAINING HALL · WELT-FORTSCHRITT</small><h2>🌍 Trainingswelt wählen</h2><p>Laufen und Laufband-Power im Hub gehen auf die ausgewählte Welt. So bleibt jede Welt eine eigene Progression.</p></div><button data-ekl-modal-close>×</button></div><div class="ekl-training-world-grid">${cards}</div></div>`);
  wrap.querySelectorAll('[data-ekl-train-world]').forEach(b=>b.onclick=()=>{
    G.state.activeTrainingWorld=b.dataset.eklTrainWorld;queuePersist(50);closeModal();updateHud(true);
    toast(`${escapeWorldById(G.state.activeTrainingWorld)?.name||'Welt'} ist jetzt deine Trainingswelt.`,'good',1900);
  });
}
function openTreadmillStation(id){
  const def=treadmillDef(id),worldId=G.state.activeTrainingWorld||'keyboard-lab',unlocked=treadmillUnlocked(def,worldId);
  const currentPower=Math.max(1,Math.round(TREADMILL_TICKS_PER_SECOND*levelPowerPerRunPoint()*def.mult*(1+treadmillCoreBonus())));
  const requirement=treadmillRequirement(def,worldId);
  const canBuy=def.access==='wins'&&!unlocked&&G.state.wins>=Number(def.cost||0);
  const wrap=openModal(`<div class="ekl-modal ekl-treadmill-modal"><div class="ekl-modal-head"><div><small>TRAINING HALL · ${def.name}</small><h2>🏃 ${def.name} Laufband</h2><p>${def.desc}. Laufband-Training ist bewusst stärker als normales Laufen und erhöht Level-Power, nicht direkt deinen physischen Speed über das 300er-Limit.</p></div><button data-ekl-modal-close>×</button></div><div class="ekl-big-stat"><div><small>TRAININGSWELT</small><b>${escapeWorldById(worldId)?.name||worldId}</b></div><div><small>LEVEL</small><b>${currentLevel(worldId)}</b></div><div><small>SPEED</small><b>${Math.round(currentSpeedStat(worldId))}/300</b></div><div><small>POWER / SEK.</small><b>+${fmt(currentPower)}</b></div></div><div class="ekl-progression-note"><b>${unlocked?'✓ FREIGESCHALTET':'🔒 GESPERRT'}</b><span>${requirement}</span></div><div class="ekl-modal-actions">${def.access==='wins'&&!unlocked?`<button class="gold" data-ekl-buy-treadmill ${canBuy?'':'disabled'}>Silber kaufen · ${Number(def.cost||0).toLocaleString('de-DE')} Wins</button>`:''}${def.access==='jk'&&!unlocked?`<button class="jk" data-ekl-open-jk>JK/Coin-Shop öffnen</button>`:''}<button data-ekl-train-world-select>Trainingswelt ändern</button><button data-ekl-modal-close>Schließen</button></div></div>`);
  wrap.querySelector('[data-ekl-buy-treadmill]')?.addEventListener('click',()=>{
    if(G.state.wins<Number(def.cost||0))return toast('Nicht genug Wins.','bad');
    G.state.wins-=Number(def.cost||0);if(!G.state.ownedTreadmills.includes(def.id))G.state.ownedTreadmills.push(def.id);soundBuy();queuePersist(50);closeModal();toast('🥈 Silber-Laufband dauerhaft freigeschaltet.','good',2200);updateHud(true);
  });
  wrap.querySelector('[data-ekl-open-jk]')?.addEventListener('click',openJkCoinShop);
  wrap.querySelector('[data-ekl-train-world-select]')?.addEventListener('click',openTrainingWorldSelector);
}

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
    const w=currentWorldDef(),half=Math.max(8,Number(w?.laneHalfWidth)||13.2),startZ=Number(w?.start?.z)||-70;
    G.pos.x=Math.max(-half,Math.min(half,G.pos.x));
    // V459: Bereits geschaffte Stages bleiben vollständig rückwärts begehbar.
    // runFurthestZ wird nur noch als Fortschritts-/Diagnosewert geführt und begrenzt
    // die Bewegung nicht mehr. So kann der Spieler für weite Sprünge jederzeit
    // mehrere Keycaps zurücklaufen und wieder echten Anlauf nehmen.
    G.runFurthestZ=Math.min(Number.isFinite(G.runFurthestZ)?G.runFurthestZ:G.pos.z,G.pos.z);
    // Nur hinter den eigentlichen Weltstart darf man nicht weiter hinauslaufen.
    // Keyboard Lab behält den etwas größeren Portalbereich für den Rückweg zum Hub.
    const startBackLimit=startZ+(G.world==='keyboard-lab'?9:6.5);
    G.pos.z=Math.min(startBackLimit,G.pos.z);
  }
  const planarSpeed=Math.hypot(G.moveVel.x,G.moveVel.z);G.moveIntensity=movementSpeed()>0?Math.min(1,planarSpeed/movementSpeed()):0;
  if(planarSpeed>.08&&G.playerRoot){const wanted=Math.atan2(G.moveVel.x,G.moveVel.z),diff=Math.atan2(Math.sin(wanted-G.playerRoot.rotation.y),Math.cos(wanted-G.playerRoot.rotation.y)),turn=1-Math.exp(-dt*(G.sprint?13:10));G.playerRoot.rotation.y+=diff*turn;}

  const wasGrounded=G.grounded,prevBottom=G.pos.y-PLAYER_HALF;G.vel.y=Math.max(-22,G.vel.y-GRAVITY*dt);let nextY=G.pos.y+G.vel.y*dt;const nextBottom=nextY-PLAYER_HALF;let landed=null;if(G.vel.y<=0)landed=platformUnder(G.pos.x,G.pos.z,prevBottom,nextBottom);
  if(landed){nextY=landed.top+PLAYER_HALF;G.vel.y=0;G.grounded=true;G.support=landed.p;}else{const hold=G.grounded?platformUnder(G.pos.x,G.pos.z,prevBottom,prevBottom-.08):null;if(hold&&Math.abs(prevBottom-hold.top)<.28){nextY=hold.top+PLAYER_HALF;G.vel.y=0;G.grounded=true;G.support=hold.p;}else{G.grounded=false;G.support=null;}}
  if(G.grounded){G.lastGroundedAt=performance.now();G.coyoteAvailable=true;}if(!wasGrounded&&G.grounded)G.landingPulse=1;G.landingPulse=Math.max(0,G.landingPulse-dt*7);
  // V465: Ein über Pause erzeugtes Laufband ist nur temporär. Sobald der Spieler
  // wirklich davon heruntergeht und wieder auf einer anderen Fläche landet,
  // verschwindet es automatisch. Ein Sprung direkt über dem Laufband löscht es
  // nicht mitten in der Luft; feste Training-Hall-Laufbänder sind nicht betroffen.
  if(G.summonedTreadmill){
    const rt=G.summonedTreadmill,onSummoned=!!(G.grounded&&G.support&&rt.platforms?.includes(G.support));
    if(onSummoned)rt.wasUsed=true;
    else if(rt.wasUsed&&G.grounded&&G.support){removeSummonedTreadmill();}
  }
  if(G.grounded&&G.support!==G.lastSupport){handlePlatformContact(G.support);registerRunLanding(G.support);G.lastSupport=G.support;}else if(!G.grounded)G.lastSupport=null;
  if(G.grounded&&isEscapeWorld()&&G.support&&G.support.kind!=='win-pad'){
    const p=G.support,margin=Math.min(.55,Math.max(.18,Math.min(p.w,p.d)*.14)),minX=p.mesh.position.x-p.w/2+margin,maxX=p.mesh.position.x+p.w/2-margin,minZ=p.mesh.position.z-p.d/2+margin,maxZ=p.mesh.position.z+p.d/2-margin;
    G.reviveAnchor.set(Math.max(minX,Math.min(maxX,G.pos.x)),p.mesh.position.y+p.h/2+PLAYER_HALF+.10,Math.max(minZ,Math.min(maxZ,G.pos.z)));
    G.reviveSupport=p;G.reviveOffsetX=G.reviveAnchor.x-p.mesh.position.x;G.reviveOffsetZ=G.reviveAnchor.z-p.mesh.position.z;
    G.reviveStage=Math.max(1,G.stage,Number(p.stage)||0);G.reviveYaw=G.playerRoot?.rotation.y||0;
  }
  G.pos.y=nextY;if(G.playerRoot)G.playerRoot.position.copy(G.pos);

  if(G.grounded&&planarSpeed>.08){
    const dist=G.lastGroundPos.distanceTo(G.pos);
    if(dist<3){
      G.speedDistanceCarry+=dist;G.state.totalDistance+=dist;
      const runPoints=Math.floor(G.speedDistanceCarry/RUN_POINT_DISTANCE);
      if(runPoints>0){G.speedDistanceCarry-=runPoints*RUN_POINT_DISTANCE;if(G.world!=='only-up'){awardRunPoints(runPoints);queuePersist(1800);}}
    }
    G.lastGroundPos.copy(G.pos);
  }else if(G.grounded)G.lastGroundPos.copy(G.pos);
  if(isOnTraining()){
    const tr=trainingInfo(),worldId=G.state.activeTrainingWorld||'keyboard-lab';G.trainingStreakSeconds+=dt;
    const tier=G.trainingStreakSeconds>=60?3:G.trainingStreakSeconds>=30?2:G.trainingStreakSeconds>=10?1:0;if(tier>G.trainingStreakTier){G.trainingStreakTier=tier;toast(`🔥 TRAINING-STREAK · +${Math.round(trainingStreakBonus()*100)} % Power`,'good',1400);}
    G.trainingCarry+=dt*TREADMILL_TICKS_PER_SECOND*levelPowerPerRunPoint()*(tr?.mult||1)*(1+treadmillCoreBonus()+trainingStreakBonus());
    if(G.trainingCarry>=1){const add=Math.floor(G.trainingCarry);G.trainingCarry-=add;addLevelPower(add,true,worldId);queuePersist(1800);}
  }else{G.trainingStreakSeconds=0;G.trainingStreakTier=0;}
  if(G.grounded&&planarSpeed>.35){G.footstepClock+=dt*(.55+planarSpeed*.11);if(G.footstepClock>=1){G.footstepClock=0;if(G.support&&!G.support.label)tone(118+(G.sprint?18:0),.025,'triangle',.005,-16);}}else G.footstepClock=Math.min(G.footstepClock,.72);
  if(updateHazards(dt))return;
  if(G.pos.y<(isEscapeWorld()||G.world==='race'||G.world==='only-up'?WORLD_FAIL_Y:MAX_FALL)){if(isEscapeWorld())beginReviveOffer();else respawn();return;}detectCheckpointAndFinish();checkAutoTriggers();consumeBufferedJump();
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
  // Das letzte WIN-Pad beendet die Welt vollständig: Stage-Wins kassieren,
  // Finish registrieren, Folge-Welt prüfen und direkt zurück in den Hub.
  if(p.winStage>=Number(w.stageCount||0)){
    finishWorld({autoHub:true,source:'final-win-pad',stageReward:reward});
    return true;
  }
  // Frühere WIN-Pads bleiben freiwillige Cash-outs und starten den Run neu.
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
    // V471: Finish-Flaeche und Endkreis benutzen denselben Cash-out-Pfad.
    // Dadurch werden die letzten Stage-Wins immer vor dem World-Finish vergeben.
    if(p.finish&&!G.runFinished){finishWorldAndReturnHub();return;}
  }else if(G.world==='race'){
    if(p.checkpoint&&p.checkpoint>G.stage){G.stage=p.checkpoint;G.checkpoint={x:p.mesh.position.x,y:p.mesh.position.y+p.h/2+PLAYER_HALF+.10,z:p.mesh.position.z};soundCheckpoint();toast(`Race Checkpoint ${G.stage}/5`,'good',850);}
    if(p.finish&&!G.runFinished)finishRace();
  }else if(G.world==='only-up'){
    if(p.kind==='skyrun-win')claimSkyrunMilestone(p);
    if(p.finish&&!G.runFinished)finishOnlyUp();
  }
}
function finishRace(){
  G.runFinished=true;soundFinish();const sec=(performance.now()-G.runStartedAt)/1000,key='speed-race',previous=Number(G.state.bestTimes[key]||0),record=!previous||sec<previous;if(record)G.state.bestTimes[key]=sec;G.state.completions[key]=Math.max(0,Number(G.state.completions[key]||0))+1;const reward=record?8:5;awardWins(reward,'Speed Race');awardMainXp(record?8:5,'Escape.kl · Speed Race',`escape-race-${Date.now()}-${Math.round(sec*100)}`);showRaceComplete(sec,reward,previous,record);updateHud(true);
}
function finishWorld(options={}){
  const w=currentWorldDef();if(!w||G.runFinished)return null;
  G.runFinished=true;soundFinish();const sec=Math.max(0,(performance.now()-G.runStartedAt)/1000),previous=Number(G.state.bestTimes[w.id]||0);if(!previous||sec<previous)G.state.bestTimes[w.id]=sec;
  G.state.completions[w.id]=Math.max(0,Number(G.state.completions[w.id]||0))+1;
  let stars=1;if(sec<=Number(w.time2||9999))stars++;if(G.deaths===0&&sec<=Number(w.time3||9999))stars++;
  G.state.worldStars[w.id]=Math.max(Number(G.state.worldStars[w.id]||0),stars);
  const finishBonus=Math.max(0,Number(w.finishBonusWins)||0),starBonus=stars===3?Math.ceil(finishBonus*.5):stars===2?Math.ceil(finishBonus*.2):0,reward=finishBonus+starBonus;
  if(reward)awardWins(reward,`${w.name} Finish-Bonus`);
  const unlocked=updateWorldUnlocks();
  queuePersist(50);awardMainXp(10+stars*3,`Escape.kl · ${w.name}`,`escape-${w.id}-${Date.now()}-${Math.round(sec*100)}`);
  if(options.autoHub){
    const stageReward=Math.max(0,Number(options.stageReward)||0),unlockText=unlocked.length?` · 🌍 ${unlocked.map(x=>x.name).join(', ')} freigeschaltet!`:'';
    setWorld('hub');
    toast(`🏁 ${w.name} geschafft${stageReward?` · +${stageReward.toLocaleString('de-DE')} Stage-Wins`:''}${reward?` · +${reward.toLocaleString('de-DE')} Finish-Wins`:''}${unlockText}`,'good',4200);
  }else{
    for(const u of unlocked)setTimeout(()=>toast(`🌍 ${u.name} freigeschaltet!`,'good',3200),250);
    showComplete(w,sec,stars,reward,previous);
  }
  updateHud(true);return {world:w,sec,stars,reward,unlocked};
}
function finishWorldAndReturnHub(){
  const w=currentWorldDef();if(!w)return setWorld('hub');
  const finalStage=Math.max(1,Number(w.stageCount)||1),claimKey=`${w.id}:${finalStage}`;
  let stageReward=0;
  if(!G.stageClaims.has(claimKey)){
    // V471: Das letzte gelbe WIN-Pad existiert nicht mehr. Die finale Belohnung
    // liegt direkt auf dem Finish-Marker, damit Kreis, Finish-Streifen und E-Fallback
    // garantiert denselben Reward auszahlen.
    const finalRewardSource=G.platforms.find(p=>p.scope===w.id&&Number(p.winStage)===finalStage&&Number(p.winReward)>0&&(p.finish||p.kind==='win-pad'));
    if(finalRewardSource?.winReward){G.stageClaims.add(claimKey);stageReward=awardWins(finalRewardSource.winReward,`${w.name} Stage ${finalStage}`,true);awardMainXp(Math.min(8,2+Math.floor(finalStage/3)),`Escape.kl · ${w.name} Stage ${finalStage}`,`escape-${w.id}-stage-${finalStage}-${Date.now()}`);}
  }
  return finishWorld({autoHub:true,source:'end-interaction',stageReward});
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
function detectInteraction(){
  let best=null,dist=Infinity;
  for(const i of G.interactables){if(i.scope!==G.world)continue;const d=i.pos.distanceTo(G.pos);if(d<=i.radius&&d<dist){best=i;dist=d}}
  G.activeInteractable=best;const p=G.overlay?.querySelector('[data-ekl-prompt]');if(!p)return;const tr=trainingInfo();
  if(best){p.innerHTML=`<kbd>${matchMedia('(pointer:coarse)').matches?'AKTION':'E'}</kbd>${best.label}`;p.classList.add('show')}
  else if(tr){
    const worldId=G.state.activeTrainingWorld||'keyboard-lab';
    if(tr.unlocked)p.textContent=`${tr.name} · Auto-Run · +${fmt(TREADMILL_TICKS_PER_SECOND*levelPowerPerRunPoint()*tr.mult*(1+treadmillCoreBonus()+trainingStreakBonus()))} Power/s · Streak ${Math.floor(G.trainingStreakSeconds)}s${trainingStreakBonus()?` (+${Math.round(trainingStreakBonus()*100)}%)`:''} · ${escapeWorldById(worldId)?.name||'Welt'}`;
    else p.textContent=`🔒 ${tr.name} · ${treadmillRequirement(tr.def,worldId)}`;
    p.classList.add('show');
  }else p.classList.remove('show');
}
function interact(){if(G.modalOpen){closeModal();return}if(G.activeInteractable?.onUse)G.activeInteractable.onUse();}
function updateHud(force=false){
  if(!G.overlay||!G.state)return;G.hudClock+=force?999:0;const set=(q,v)=>{const e=G.overlay.querySelector(q);if(e&&e.textContent!==String(v))e.textContent=String(v)};
  const worldId=progressWorldId(),lp=levelProgress(worldId),nextRb=nextRebirthDef(),speed=currentSpeedStat(worldId),displaySpeedCap=G.world==='only-up'?SKYRUN_SPEED_STAT:REGULAR_SPEED_CAP;
  set('[data-ekl-speed]',`${Math.round(speed)} / ${displaySpeedCap}`);set('[data-ekl-level]',lp.level);set('[data-ekl-wins]',fmt(G.state.wins));set('[data-ekl-rebirths]',G.state.rebirths);
  const worldName=escapeWorldById(worldId)?.name||'Welt';
  set('[data-ekl-level-next]',lp.level>=Number(nextRb?.level||Infinity)?`REBIRTH ${G.state.rebirths+1} BEREIT · ${worldName}`:`NÄCHSTES LEVEL: noch ${fmt(lp.to-lp.xp)} POWER`);
  const levelBar=G.overlay.querySelector('[data-ekl-level-bar]');if(levelBar)levelBar.style.width=`${Math.round(lp.ratio*100)}%`;
}

function toast(message,tone='',ms=1900){const e=G.overlay?.querySelector('[data-ekl-toast]');if(!e)return;clearTimeout(G.toastTimer);e.textContent=message;e.className=`ekl-toast show ${tone}`;G.toastTimer=setTimeout(()=>e.className='ekl-toast',ms);}

function openModal(html){closeModal();G.modalOpen=true;const wrap=document.createElement('div');wrap.className='ekl-modal-wrap';wrap.dataset.eklModal='1';wrap.innerHTML=html;G.overlay.append(wrap);wrap.addEventListener('click',e=>{if(e.target===wrap)closeModal()});wrap.querySelectorAll('[data-ekl-modal-close]').forEach(b=>b.onclick=closeModal);return wrap;}
function closeModal(){G.overlay?.querySelector('[data-ekl-modal]')?.remove();G.modalOpen=false;}
function coreTierValue(kind){return Math.max(0,Math.min(3,Number(G.state?.[`${kind}CoreTier`])||0));}
function coreUpgradeDef(kind,tier){return CORE_UPGRADES[kind]?.find(x=>x.tier===tier)||null;}
function buyCoreUpgrade(kind){
  if(!CORE_UPGRADES[kind])return false;
  const next=coreTierValue(kind)+1,def=coreUpgradeDef(kind,next);if(!def)return toast('Dieses Upgrade ist bereits maximal.','good',1500);
  if(G.state.wins<def.cost)return toast(`Du brauchst ${def.cost.toLocaleString('de-DE')} Wins.`,'bad',1700);
  G.state.wins-=def.cost;G.state[`${kind}CoreTier`]=next;soundBuy();queuePersist(50);updateHud(true);toast(`${def.name} freigeschaltet.`,'good',1900);openShop('upgrades');return true;
}
function openShop(tab='speed'){
  const worldId=progressWorldId(),level=currentLevel(worldId),speed=currentSpeedStat(worldId),trail=TRAILS.find(t=>t.id===G.state.trail)||TRAILS[0],aura=AURAS.find(a=>a.id===G.state.aura)||AURAS[0];
  const wrap=openModal(`<div class="ekl-modal"><div class="ekl-modal-head"><div><small>ESCAPE HUB · SHOP</small><h2>🏪 Escape Shop</h2><p>Level erzeugt deinen Basis-Speed bis 300. Alles darüber kommt nur aus kleinen additiven Prozent-Boni von Items, Auren, Pets und Upgrades. Power-Boni stacken ebenfalls kontrolliert.</p></div><button data-ekl-modal-close>×</button></div><div class="ekl-big-stat"><div><small>TRAININGSWELT</small><b>${escapeWorldById(worldId)?.name||worldId}</b></div><div><small>LEVEL</small><b>${level}</b></div><div><small>SPEED</small><b>${Math.round(speed)}/300</b></div><div><small>POWER / BEWEGUNG</small><b>+${fmt(levelPowerPerRunPoint())}</b></div><div><small>WINS</small><b>${fmt(G.state.wins)}</b></div><div><small>EXTRA SPEED</small><b>+${(totalSpeedBonus()*100).toFixed(1).replace('.',',')}%</b></div></div><div class="ekl-tabs"><button data-ekl-shop-tab="speed">Power</button><button data-ekl-shop-tab="treadmills">Laufbänder</button><button data-ekl-shop-tab="items">Speed-Items</button><button data-ekl-shop-tab="trails">Trails</button><button data-ekl-shop-tab="auras">Auren</button><button data-ekl-shop-tab="upgrades">Upgrades</button><button data-ekl-shop-tab="pets">Pets</button><button data-ekl-shop-tab="characters">Charaktere</button><button data-ekl-shop-tab="worlds">Welten</button><button data-ekl-shop-tab="jk">◆ JK/Coin</button></div><div data-ekl-shop-body></div></div>`);
  wrap.querySelectorAll('[data-ekl-shop-tab]').forEach(b=>b.onclick=()=>renderShopBody(b.dataset.eklShopTab));renderShopBody(tab);
}
function renderShopBody(tab){
  const body=G.overlay?.querySelector('[data-ekl-shop-body]');if(!body)return;
  const worldId=progressWorldId(),speed=currentSpeedStat(worldId);
  G.overlay.querySelectorAll('[data-ekl-shop-tab]').forEach(b=>b.classList.toggle('active',b.dataset.eklShopTab===tab));
  if(tab==='speed'){
    body.innerHTML=`<div class="ekl-progression-note"><b>⚡ LEVEL-POWER</b><span>Normales Laufen erzeugt aktuell <strong>+${fmt(levelPowerPerRunPoint())} Power pro Bewegungseinheit</strong>. Diese Power erhöht dein Welt-Level. Der physische Speed bleibt ein eigener 0–300-Wert.</span></div><div class="ekl-shop-grid">${STEP_BUTTONS.slice(1).map(u=>{const owned=G.state.stepButtonTier>=u.tier,available=G.state.stepButtonTier===u.tier-1;return `<article class="${owned?'owned':''}"><small>POWER STUFE ${u.tier}</small><h3>${u.name}</h3><p>Erhöht die Level-Power beim Laufen und auf dem Laufband.</p><button data-ekl-buy-step="${u.tier}" ${owned||!available?'disabled':''}>${owned?'GEKAUFT':available?`${u.cost.toLocaleString('de-DE')} Wins`:'Vorherige Stufe benötigt'}</button></article>`}).join('')}</div>`;
    body.querySelectorAll('[data-ekl-buy-step]').forEach(b=>b.onclick=()=>buyStepButton(Number(b.dataset.eklBuyStep),false));
  }else if(tab==='treadmills'){
    body.innerHTML=`<div class="ekl-progression-note"><b>🏃 TRAINING HALL</b><span>Die Laufbänder sind stärker als normales Laufen. FREE+ wird über Level freigeschaltet, Silber mit Wins, Gold/Diamond über JK/Coin. Aktive Trainingswelt: <strong>${escapeWorldById(G.state.activeTrainingWorld)?.name||'Keyboard Lab'}</strong>.</span></div><div class="ekl-shop-grid">${TREADMILLS.map(t=>{const unlocked=treadmillUnlocked(t),req=treadmillRequirement(t);return `<article class="${unlocked?'owned':''}"><small>${unlocked?'FREIGESCHALTET':'TRAININGSSTUFE'}</small><h3>${t.name} · ×${t.mult}</h3><p>${t.desc}<br>${unlocked?'Bereit zum Benutzen.':`Benötigt: ${req}`}</p><button data-ekl-treadmill="${t.id}">${unlocked?'Details':t.access==='wins'?`${t.cost.toLocaleString('de-DE')} Wins`:t.access==='jk'?'JK/Coin ansehen':'Details'}</button></article>`}).join('')}</div>`;
    body.querySelectorAll('[data-ekl-treadmill]').forEach(b=>b.onclick=()=>openTreadmillStation(b.dataset.eklTreadmill));
  }else if(tab==='items'){
    body.innerHTML=`<div class="ekl-progression-note"><b>🎒 SPEED-INVENTAR · Basis ${Math.round(rawSpeedStat(worldId))}/300 · Effektiv ${Math.round(speed)}</b><span>V462-Balance: Speed-Items geben nur noch kleine <strong>permanente Prozent-Boni</strong>. Alle normalen Speed-Boni addieren sich statt sich gegenseitig zu multiplizieren. Maximaler Item-Bonus: +10,5 %.</span></div><div class="ekl-shop-grid">${SPEED_ITEMS.map(item=>{const count=Math.max(0,Number(G.state.speedItems?.[item.id])||0),cost=speedItemCost(item),level=speedItemLevel(item),max=item.maxLevel||5,total=level*item.pct,canUse=count>0&&level<max;return `<article class="${level?'owned':''}"><small>${item.icon} SPEED ITEM · STUFE ${level}/${max} · ${count}× INVENTAR</small><h3>${item.name}</h3><p>${item.desc}.<br><b>Aktuell: +${(total*100).toFixed(1).replace('.',',')} % effektiver Speed</b> · maximal +${(item.pct*max*100).toFixed(1).replace('.',',')} %.</p><div class="ekl-item-actions"><button data-ekl-buy-item="${item.id}" ${level>=max?'disabled':''}>${level>=max?'MAXIMAL':`Kaufen · ${cost.toLocaleString('de-DE')} Wins`}</button><button data-ekl-use-item="${item.id}" ${canUse?'':'disabled'}>Erweitern (${count})</button></div></article>`}).join('')}</div>`;
    body.querySelectorAll('[data-ekl-buy-item]').forEach(b=>b.onclick=()=>buySpeedItem(b.dataset.eklBuyItem));
    body.querySelectorAll('[data-ekl-use-item]').forEach(b=>b.onclick=()=>useSpeedItem(b.dataset.eklUseItem));
  }else if(tab==='trails'){
    body.innerHTML=`<div class="ekl-progression-note"><b>✨ PARTIKELSPUREN</b><span>Fuß- oder Rückenspur. Trails geben nur noch einen kleinen additiven <strong>Power-Bonus</strong> und beeinflussen den physischen Speed nicht direkt.</span><div class="ekl-trail-pos-inline"><button data-ekl-trail-pos="feet" class="${G.state.trailPlacement==='feet'?'active':''}">👟 Fußspur</button><button data-ekl-trail-pos="back" class="${G.state.trailPlacement==='back'?'active':''}">🎒 Rückenspur</button></div></div><div class="ekl-shop-grid">${TRAILS.map(t=>{const owned=G.state.ownedTrails.includes(t.id),active=G.state.trail===t.id;return `<article class="${owned?'owned':''} ${t.jk?'jk':''}"><small>${active?'AKTIV':t.jk?'JK/COIN':'TRAIL'}</small><h3>${t.name}</h3><p><b>+${Math.round((t.mult-1)*100)} % Power</b> · ${t.effect==='fire'?'🔥 Feuer':t.effect==='water'?'💧 Wasser':t.effect==='rainbow'?'🌈 Rainbow':t.effect==='galaxy'?'🌌 Galaxy':t.effect==='magic'?'✨ Magie':t.effect==='energy'?'⚡ Energie':'–'}.</p><button data-ekl-trail="${t.id}" class="${t.jk?'jk':''}" ${active?'disabled':''}>${active?'AKTIV':owned?'Ausrüsten':t.jk?'Im JK/Coin-Shop':`${t.cost.toLocaleString('de-DE')} Wins`}</button></article>`}).join('')}</div>`;
    body.querySelectorAll('[data-ekl-trail]').forEach(b=>b.onclick=()=>buyOrEquipTrail(b.dataset.eklTrail));
    body.querySelectorAll('[data-ekl-trail-pos]').forEach(b=>b.onclick=()=>{setTrailPlacement(b.dataset.eklTrailPos);openShop('trails')});
  }else if(tab==='auras'){
    body.innerHTML=`<div class="ekl-shop-grid">${AURAS.map(a=>{const owned=G.state.ownedAuras.includes(a.id),active=G.state.aura===a.id,quest=a.questRunPoints&&!owned,questReady=quest&&G.state.runPoints>=a.questRunPoints,questPct=quest?Math.min(100,Math.floor((Number(G.state.runPoints)||0)/a.questRunPoints*100)):100;return `<article class="${owned?'owned':''}"><small>${active?'AKTIV':quest?'BEWEGUNGS-QUEST':'AURA'}</small><h3>${a.name}</h3><p><b>+${Math.round((a.mult-1)*100)} % Level-Power · +${(Number(a.speedPct||0)*100).toFixed(1).replace('.',',')} % Speed</b>.${quest?`<br>Gratis durch aktives Spielen freischaltbar.`:''}</p><button data-ekl-aura="${a.id}" ${active||(!owned&&quest&&!questReady)?'disabled':''}>${active?'AKTIV':owned?'Ausrüsten':quest?(questReady?'Gratis freischalten':`Quest ${questPct}%`):`${a.cost.toLocaleString('de-DE')} Wins`}</button></article>`}).join('')}</div>`;
    body.querySelectorAll('[data-ekl-aura]').forEach(b=>b.onclick=()=>buyOrEquipAura(b.dataset.eklAura));
  }else if(tab==='upgrades'){
    const cards=[
      {kind:'training',icon:'⚙️',title:'Training Core',tier:coreTierValue('training'),bonus:[0,3,6,9][coreTierValue('training')],desc:'Kleiner permanenter Bonus auf Level-Power aus Laufen und Laufbändern.'},
      {kind:'treadmill',icon:'🏃',title:'Treadmill Core',tier:coreTierValue('treadmill'),bonus:[0,5,10,15][coreTierValue('treadmill')],desc:'Zusätzlicher Bonus ausschließlich auf Laufband-Training.'},
      {kind:'speed',icon:'💨',title:'Speed Core',tier:coreTierValue('speed'),bonus:[0,1,2,3][coreTierValue('speed')],desc:'Erhöht deinen effektiven Speed prozentual und darf dadurch auch über Basis-Speed 300 hinausgehen.'},
      {kind:'win',icon:'🏆',title:'Win Core',tier:coreTierValue('win'),bonus:[0,1,2,3][coreTierValue('win')],desc:'Erhöht jede eingesammelte Win-Belohnung und stackt mit Pet/Verwandlung.'}
    ];
    body.innerHTML=`<div class="ekl-progression-note"><b>🧩 ESCAPE UPGRADES</b><span>Permanente, bewusst kleine Upgrades. Die 0–300 Level-Speed-Kurve bleibt unverändert; Speed Core, Auren, Pets und Speed-Chips dürfen den effektiven Wert kontrolliert über 300 anheben.</span></div><div class="ekl-shop-grid">${cards.map(c=>{const next=coreUpgradeDef(c.kind,c.tier+1);return `<article class="${c.tier>=3?'owned':''}"><small>${c.icon} STUFE ${c.tier}/3</small><h3>${c.title}</h3><p>${c.desc}<br><b>Aktuell: +${c.bonus}%</b>${next?` · Nächste Stufe: +${Math.round(next.bonus*100)}%`:''}</p><button data-ekl-core="${c.kind}" ${next?'':'disabled'}>${next?`${next.cost.toLocaleString('de-DE')} Wins`:'MAXIMAL'}</button></article>`}).join('')}</div>`;
    body.querySelectorAll('[data-ekl-core]').forEach(b=>b.onclick=()=>buyCoreUpgrade(b.dataset.eklCore));
  }else if(tab==='pets'){
    const free=PET_DEFS.filter(p=>p.id!=='none'&&(p.category==='free'||p.currency==='wins')),paid=PET_DEFS.filter(p=>p.id!=='none'&&p.currency==='jk');
    body.innerHTML=`<div class="ekl-progression-note"><b>🪽 PET SHOP · ${activePetDefs().length}/2 AKTIV</b><span>Maximal zwei Pets gleichzeitig. Reptisect läuft dir animiert hinterher; der Phönix fliegt mit seiner Fluganimation weich und leicht verzögert hinter dir.</span><div class="ekl-trail-pos-inline"><button class="gold" data-ekl-best-pets-shop>⭐ Beste Pets</button><button data-ekl-pets-menu-shop>Pets ausrüsten</button></div></div><div class="ekl-character-special-head"><b>🆓 Free Pets</b><span>Kostenlos erspielbare Pets</span></div>${free.length?`<div class="ekl-shop-grid">${free.map(petCardHtml).join('')}</div>`:`<div class="ekl-world-economy-note"><b>Aktuell keine Free Pets im Katalog.</b><span>Die Kategorie bleibt für zukünftige kostenlose Pets bestehen.</span></div>`}<div class="ekl-character-special-head"><b>◆ JK Pets</b><span>Dauerhafte Premium-Pets</span></div><div class="ekl-shop-grid">${paid.map(petCardHtml).join('')}</div><div class="ekl-world-economy-note"><b>Aktiv:</b><span>${petSelectionSummary()}</span></div>`;
    body.querySelectorAll('[data-ekl-pet-pick]').forEach(b=>b.onclick=()=>buyOrEquipPet(b.dataset.eklPetPick,'shop'));body.querySelector('[data-ekl-best-pets-shop]')?.addEventListener('click',equipBestPets);body.querySelector('[data-ekl-pets-menu-shop]')?.addEventListener('click',openPetEquipMenu);
  }else if(tab==='characters'){
    const active=G.state.characterChoice;
    body.innerHTML=`<div class="ekl-progression-note"><b>🧍 CHARAKTER SHOP</b><span>Mann/Frau jederzeit kostenlos. Der Dämonen-Slot nutzt deine gelieferte GLB-Datei und kann nach dem Kauf per JK/Coin zum Galaxy-Skin aufgewertet werden.</span></div><div class="ekl-character-choice"><button data-ekl-character-shop="male" class="${active==='male'?'active':''}"><b>♂ Mann</b><span>Hauptskin</span></button><button data-ekl-character-shop="female" class="${active==='female'?'active':''}"><b>♀ Frau</b><span>Hauptskin</span></button></div><div class="ekl-shop-grid">${SPECIAL_CHARACTERS.map(c=>{const owned=G.state.ownedSpecialCharacters.includes(c.id),isActive=active===c.id,isDemon=c.id==='demon-transformation',upgraded=isDemon&&G.state.demonGalaxyUpgrade;return `<article class="${owned?'owned':''} ${c.currency==='jk'?'jk':''}"><small>${c.currency==='jk'?'JK/COIN':'SPEZIALCHARAKTER'}</small><h3>${c.name}</h3><p>${c.desc}${isDemon?`<br><b>Galaxy-Upgrade</b>: ${c.upgradeCost.toLocaleString('de-DE')} JK/Coin → +2,5 % Speed / Wins.`:''}</p><div class="ekl-item-actions"><button data-ekl-special-shop="${c.id}" ${isActive?'disabled':''}>${isActive?'AKTIV':owned?'Ausrüsten':characterPriceLabel(c)}</button>${isDemon&&owned?`<button data-ekl-special-upgrade-shop="${c.id}" ${upgraded?'disabled':''}>${upgraded?'Galaxy aktiv':`${c.upgradeCost.toLocaleString('de-DE')} JK/Coin`}</button>`:''}</div></article>`}).join('')}</div>`;
    body.querySelectorAll('[data-ekl-character-shop]').forEach(b=>b.onclick=()=>{setCharacterChoice(b.dataset.eklCharacterShop);openShop('characters')});
    body.querySelectorAll('[data-ekl-special-shop]').forEach(b=>b.onclick=()=>{buySpecialCharacter(b.dataset.eklSpecialShop);openShop('characters')});
    body.querySelectorAll('[data-ekl-special-upgrade-shop]').forEach(b=>b.onclick=()=>{upgradeDemonTransformation();openShop('characters')});
  }else if(tab==='worlds'){
    body.innerHTML=`<div class="ekl-shop-grid">${WORLD_DEFS.map(w=>{const st=worldUnlockStatus(w);return `<article class="${st.unlocked&&!w.locked?'owned':''}"><small>WELT ${w.number} · ${w.difficulty||''}</small><h3>${w.name}</h3><p>${w.description}</p><button disabled>${w.locked?'COMING SOON':st.unlocked?'IM HUB FREIGESCHALTET':`🔒 ${st.reason}`}</button></article>`}).join('')}</div><div class="ekl-world-economy-note"><b>Jede Welt hat eigene Level-Power und eigenen Speed 0–300.</b><span>World 2 wächst langsamer als World 1; World 3 ist absichtlich extrem grindig. Freischaltungen hängen an der Vorwelt.</span></div>`;
  }else{
    const balance=Number(window.JKCoinApp?.coinState?.()?.balance||0),items=[
      {name:'Gold Speed-Treadmill ×2,8',price:250,owned:Number(G.state.jkTreadmillTier||0)>=1,desc:'Permanentes Gold-Laufband mit ×2,8 Training.'},
      {name:'Diamond Speed-Treadmill ×4',price:850,owned:Number(G.state.jkTreadmillTier||0)>=2,desc:'Permanentes Diamond-Laufband mit ×4 Training.'},
      {name:'Galaxy Keyboard Trail +30 % Power',price:300,owned:G.state.ownedTrails.includes('galaxy'),desc:'Galaxy-Partikelspur mit +30 % additiver Level-Power.'},
      {name:'EYE Pet',price:500,owned:G.state.ownedPets.includes('cyclops-wing'),desc:'+2 % effektiver Speed und +2 % Wins · gleichzeitig mit Spezialcharakter nutzbar.'},
      {name:'Reptisect Pet',price:600,owned:G.state.ownedPets.includes('reptisect'),desc:'+1,5 % Speed und +1,5 % Wins · animiertes Lauf-Pet mit Follow-Verhalten.'},
      {name:'Phönix Pet',price:3000,owned:G.state.ownedPets.includes('phoenix'),desc:'+3,0 % Speed und +2,5 % Wins · Premium-Flug-Pet mit verzögertem Follow.'},
      {name:'Dämonenverwandlung',price:800,owned:G.state.ownedSpecialCharacters.includes('demon-transformation'),desc:'+1,5 % Speed/Wins · echte gelieferte GLB-Verwandlung.'},
      {name:'Dämon Galaxy-Upgrade',price:1000,owned:!!G.state.demonGalaxyUpgrade,desc:'Galaxy-Skin +2,5 % Speed/Wins statt +1,5 %.'},
      {name:'Power +50 % · 15 Min.',price:180,owned:false,desc:'Temporärer +50-%-Bonus auf Lauf- und Laufband-Power.'}
    ];
    body.innerHTML=`<div class="ekl-jk-panel"><div><small>JK.GAMES · JK/COIN</small><h3>◆ Escape.kl Premium</h3><p>Premium beschleunigt die Progression kontrolliert. Basis-Speed bleibt durch Level auf 300 begrenzt; kleine prozentuale Extras dürfen den effektiven Wert darüber anheben.</p><b>${balance.toLocaleString('de-DE')} JK/Coin verfügbar</b></div><button class="jk" data-ekl-open-jk>JK/Coin-Shop öffnen</button></div><div class="ekl-shop-grid ekl-jk-grid">${items.map(i=>`<article class="jk ${i.owned?'owned':''}"><small>${i.owned?'DAUERHAFT FREIGESCHALTET':'JK/COIN'}</small><h3>${i.name}</h3><p>${i.desc}</p><button class="jk" data-ekl-open-jk ${i.owned?'disabled':''}>${i.owned?'GEKAUFT':`${i.price.toLocaleString('de-DE')} JK/Coin`}</button></article>`).join('')}</div>`;
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
  G.state.trail=id;setTrailColor();queuePersist(50);updateHud(true);toast(`${t.name} ausgerüstet · +${Math.round((t.mult-1)*100)} % Level-Power.`,'good');openShop('trails');
}
function buyOrEquipAura(id){
  const a=AURAS.find(x=>x.id===id);if(!a)return;
  if(!G.state.ownedAuras.includes(id)){
    if(a.questRunPoints){if(G.state.runPoints<a.questRunPoints)return toast(`Bewegungs-Quest für ${a.name} noch nicht abgeschlossen.`,'bad');}
    else if(G.state.wins<a.cost)return toast(`Du brauchst ${a.cost.toLocaleString('de-DE')} Wins.`,'bad');
    else G.state.wins-=a.cost;
    G.state.ownedAuras.push(id);soundBuy();
  }
  G.state.aura=id;setAuraStyle();queuePersist(50);updateHud(true);toast(`${a.name} ausgerüstet · +${Math.round((a.mult-1)*100)} % Power / +${(Number(a.speedPct||0)*100).toFixed(1).replace('.',',')} % Speed.`,'good');openShop('auras');
}
function openJkCoinShop(){closeModal();if(window.JKCoinApp?.openForGame?.('escape')!==true)toast('JK/Coin-Shop wird noch geladen.','bad',1800);}
function canApplyJkPurchase(kind){
  if(!G.state)loadProgress();kind=String(kind||'');
  if(kind==='speedTreadmill:gold')return Number(G.state?.jkTreadmillTier||0)<1;
  if(kind==='speedTreadmill:diamond')return !G.state?.ownedTreadmills?.includes('diamond')&&Number(G.state?.jkTreadmillTier||0)<2;
  if(kind==='speedTreadmill:galaxy')return !G.state?.ownedTreadmills?.includes('galaxy');
  if(kind==='speedTreadmill:admin')return !G.state?.ownedTreadmills?.includes('admin');
  if(kind==='trail:galaxy')return !G.state?.ownedTrails?.includes('galaxy');
  if(kind==='pet:cyclops-wing')return !G.state?.ownedPets?.includes('cyclops-wing');
  if(kind==='pet:reptisect')return !G.state?.ownedPets?.includes('reptisect');
  if(kind==='pet:phoenix')return !G.state?.ownedPets?.includes('phoenix');
  if(kind==='character:demon-transformation')return !G.state?.ownedSpecialCharacters?.includes('demon-transformation');
  if(kind==='character:demon-galaxy')return G.state?.ownedSpecialCharacters?.includes('demon-transformation')&&!G.state?.demonGalaxyUpgrade;
  return true;
}
function grantJkCoinPurchase(kind,amount=1){
  if(!G.state)loadProgress();kind=String(kind||'');
  if(kind==='speedTreadmill:gold'){G.state.jkTreadmillTier=Math.max(1,Number(G.state.jkTreadmillTier)||0);if(!G.state.ownedTreadmills.includes('gold'))G.state.ownedTreadmills.push('gold');}
  else if(kind==='speedTreadmill:diamond'){G.state.jkTreadmillTier=Math.max(2,Number(G.state.jkTreadmillTier)||0);if(!G.state.ownedTreadmills.includes('diamond'))G.state.ownedTreadmills.push('diamond');}
  else if(kind==='speedTreadmill:galaxy'){if(!G.state.ownedTreadmills.includes('galaxy'))G.state.ownedTreadmills.push('galaxy');}
  else if(kind==='speedTreadmill:admin'){if(!G.state.ownedTreadmills.includes('admin'))G.state.ownedTreadmills.push('admin');}
  else if(kind==='trail:galaxy'){if(!G.state.ownedTrails.includes('galaxy'))G.state.ownedTrails.push('galaxy');}
  else if(kind==='speedBoost:2'){G.state.jkSpeedBoostUntil=Date.now()+15*60*1000;}
  else if(kind==='pet:cyclops-wing'||kind==='pet:reptisect'||kind==='pet:phoenix'){const id=kind.split(':')[1];if(!G.state.ownedPets.includes(id))G.state.ownedPets.push(id);G.state.activePets=Array.isArray(G.state.activePets)?G.state.activePets:[];if(!G.state.activePets.includes(id)&&G.state.activePets.length<2)G.state.activePets.push(id);syncLegacyActivePet();refreshCompanionVisuals();}
  else if(kind==='character:demon-transformation'){if(!G.state.ownedSpecialCharacters.includes('demon-transformation'))G.state.ownedSpecialCharacters.push('demon-transformation');}
  else if(kind==='character:demon-galaxy'){if(!G.state.ownedSpecialCharacters.includes('demon-transformation'))return false;G.state.demonGalaxyUpgrade=true;if(G.state.characterChoice==='demon-transformation')mountCharacter('demon-transformation');}
  else return false;
  queuePersist(50);updateHud(true);toast('◆ JK/Coin-Inhalt für Escape.kl aktiviert.','good',2400);return true;
}
function openRebirth(){
  const worldId=progressWorldId(),w=escapeWorldById(worldId),next=nextRebirthDef(),level=currentLevel(worldId),ready=level>=Number(next.level||Infinity),currentMult=rebirthMultiplier(),afterMult=Number(next.mult||currentMult),speed=currentSpeedStat(worldId);
  const wrap=openModal(`<div class="ekl-modal ekl-rebirth-modal"><div class="ekl-modal-head"><div><small>${w?.name||'WELT'} · LANGZEIT-PROGRESSION</small><h2>🔄 Rebirth ${G.state.rebirths+1}</h2><p>Rebirth ist absichtlich langsam. Er setzt nur die aktive Trainingswelt zurück und gibt einen kontrollierten permanenten Power-Bonus. Wins, Gear und andere Weltfortschritte bleiben erhalten.</p></div><button data-ekl-modal-close>×</button></div><div class="ekl-rebirth-requirements"><article class="${ready?'ready':''}"><small>AKTUELLES LEVEL</small><b>${level} / ${next.level}</b><span>${ready?'✓ Rebirth bereit':`Noch ${Math.max(0,next.level-level)} Level`}</span></article><article><small>SPEED</small><b>${Math.round(speed)} / 300</b><span>aktive Welt wird auf Start-Speed zurückgesetzt</span></article><article class="bonus"><small>PERMANENTER POWER-BONUS</small><b>×${currentMult.toFixed(2).replace('.',',')} → ×${afterMult.toFixed(2).replace('.',',')}</b><span>gilt auf Laufen und Laufband-Training</span></article></div><div class="ekl-modal-actions"><button data-ekl-rebirth-confirm class="gold" ${!ready?'disabled':''}>Rebirth ${G.state.rebirths+1} durchführen</button><button data-ekl-modal-close>Abbrechen</button></div></div>`);
  wrap.querySelector('[data-ekl-rebirth-confirm]')?.addEventListener('click',()=>{
    if(currentLevel(worldId)<next.level)return;
    const p=progressForWorld(worldId);p.xp=0;p.itemSpeedBonus=0;p.adminSpeedOverride=null;G.state.rebirths++;G.speedDistanceCarry=0;G.trainingCarry=0;
    queuePersist(50);closeModal();updateHud(true);toast(`Rebirth ${G.state.rebirths} · Power jetzt ×${rebirthMultiplier().toFixed(2).replace('.',',')}!`,'good',2800);awardMainXp(15,'Escape.kl Rebirth',`escape-rebirth-${G.state.rebirths}`);
  });
}
function wheelRemaining(){return Math.max(0,24*60*60*1000-(Date.now()-(Number(G.state.lastWheelAt)||0)));}
function durationShort(ms){ms=Math.max(0,ms);const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000);return h>0?`${h} Std ${m} Min`:`${Math.max(1,m)} Min`;}
function openDailyWheel(){
  const remaining=wheelRemaining(),ready=remaining<=0;const wrap=openModal(`<div class="ekl-modal"><div class="ekl-modal-head"><div><small>TÄGLICHE BELOHNUNG · ESCAPE HUB</small><h2>🎡 Daily Wheel</h2><p>Ein kostenloser Dreh alle 24 Stunden. Der Gewinn wird sofort in Escape.kl gespeichert.</p></div><button data-ekl-modal-close>×</button></div><div class="ekl-wheel-zone"><div class="ekl-wheel" data-ekl-wheel><span style="--i:0">⚡</span><span style="--i:1">🏆</span><span style="--i:2">×2</span><span style="--i:3">⚡</span><span style="--i:4">🏆</span><span style="--i:5">★</span><i>▼</i></div><div class="ekl-wheel-info"><small>${ready?'BEREIT':'NÄCHSTER DREH'}</small><b data-ekl-wheel-status>${ready?'Jetzt drehen':durationShort(remaining)}</b><p>Power · Wins · selten ein Trail</p></div></div><div class="ekl-modal-actions"><button data-ekl-spin class="gold" ${ready?'':'disabled'}>${ready?'KOSTENLOS DREHEN':'MORGEN WIEDER'}</button><button data-ekl-modal-close>Schließen</button></div></div>`);
  wrap.querySelector('[data-ekl-spin]')?.addEventListener('click',()=>spinDailyWheel(wrap));
}
function spinDailyWheel(wrap){
  if(wheelRemaining()>0)return;const button=wrap.querySelector('[data-ekl-spin]'),wheel=wrap.querySelector('[data-ekl-wheel]'),status=wrap.querySelector('[data-ekl-wheel-status]');if(button)button.disabled=true;
  const roll=Math.random();let text='';
  if(roll<.24){const a=directSpeedGrant(5,{countDaily:false});text=a?`+${a.toFixed(0)} Speed`:'+Power-Bonus';}
  else if(roll<.46){awardWins(250,'Daily Wheel');text='+250 Wins';}
  else if(roll<.64){const a=directSpeedGrant(12,{countDaily:false});text=a?`+${a.toFixed(0)} Speed`:'+Power-Bonus';}
  else if(roll<.80){awardWins(750,'Daily Wheel');text='+750 Wins';}
  else if(roll<.94){addLevelPower(18000,false);text='+18.000 Level-Power';}
  else if(!G.state.ownedTrails.includes('green')){G.state.ownedTrails.push('green');text='Green Energy Trail';}
  else{awardWins(5000,'Daily Wheel');text='+5.000 Wins · Jackpot';}
  G.state.lastWheelAt=Date.now();queuePersist(50);soundFinish();if(wheel){wheel.style.setProperty('--spin',`${1260+Math.floor(Math.random()*360)}deg`);wheel.classList.add('spinning');}if(status)status.textContent='Dreht …';setTimeout(()=>{if(status)status.textContent=text;toast(`Daily Wheel: ${text}`,'good',2600);updateHud(true);},1150);
}
function dailyQuestRows(){
  const q=ensureDailyQuest(),runPoints=Math.max(0,(Number(G.state.runPoints)||0)-(Number(q.runPointsStart)||0)),completions=Math.max(0,(Number(G.state.completions?.['keyboard-lab']||0))-(Number(q.completionsStart)||0));
  return [
    {id:'runpoints',icon:'🏃',name:'Bewegung',desc:'Bewege dich heute aktiv durch Escape.kl.',progress:runPoints,target:500,reward:500},
    {id:'speed',icon:'⚡',name:'Training-Power',desc:'Verdiene heute 25.000 Level-Power durch Laufen oder Laufband.',progress:Number(q.speedEarned)||0,target:25000,reward:750},
    {id:'escape',icon:'🏁',name:'Daily Escape',desc:'Schließe Keyboard Lab heute einmal komplett ab.',progress:completions,target:1,reward:2500}
  ];
}
function openDailyQuests(){
  const q=ensureDailyQuest(),rows=dailyQuestRows();const wrap=openModal(`<div class="ekl-modal"><div class="ekl-modal-head"><div><small>ESCAPE.KL · TAGESAUFGABEN</small><h2>📋 Daily Quests</h2><p>Drei Aufgaben pro Tag. Fortschritt entsteht ausschließlich beim normalen Spielen.</p></div><button data-ekl-modal-close>×</button></div><div class="ekl-quest-list">${rows.map(r=>{const claimed=q.claimed.includes(r.id),done=r.progress>=r.target,pct=Math.min(100,r.progress/r.target*100);return `<article class="${done?'done':''} ${claimed?'claimed':''}"><span>${r.icon}</span><div><small>${claimed?'ABGEHOLT':done?'FERTIG':'TAGESQUEST'}</small><h3>${r.name}</h3><p>${r.desc}</p><i><b style="width:${pct}%"></b></i><em>${Math.min(r.target,Math.floor(r.progress)).toLocaleString('de-DE')} / ${r.target.toLocaleString('de-DE')}</em></div><button data-ekl-claim-quest="${r.id}" ${!done||claimed?'disabled':''}>${claimed?'✓':`+${r.reward} Wins`}</button></article>`}).join('')}</div></div>`);
  wrap.querySelectorAll('[data-ekl-claim-quest]').forEach(b=>b.onclick=()=>claimDailyQuest(b.dataset.eklClaimQuest));
}
function claimDailyQuest(id){const q=ensureDailyQuest(),row=dailyQuestRows().find(r=>r.id===id);if(!row||row.progress<row.target||q.claimed.includes(id))return;q.claimed.push(id);awardWins(row.reward,row.name);soundBuy();queuePersist(50);updateHud(true);toast(`${row.name}: +${row.reward} Wins`,'good',2000);openDailyQuests();}
function openRecords(){
  const worldId=progressWorldId(),level=currentLevel(worldId),speed=currentSpeedStat(worldId),lp=levelProgress(worldId),raceBest=Number(G.state.bestTimes?.['speed-race']||0),races=Number(G.state.completions?.['speed-race']||0),onlyBest=Number(G.state.bestTimes?.['jk-skyrun']||0),onlyRuns=Number(G.state.completions?.['jk-skyrun']||0);
  const worlds=WORLD_DEFS.filter(w=>!w.locked).map(w=>({w,best:Number(G.state.bestTimes?.[w.id]||0),stars:Number(G.state.worldStars?.[w.id]||0),runs:Number(G.state.completions?.[w.id]||0)}));
  openModal(`<div class="ekl-modal"><div class="ekl-modal-head"><div><small>PERSÖNLICHE ESCAPE-REKORDE</small><h2>🏆 Records Board</h2><p>Level, Speed, Wins und deine Welt-Bestzeiten auf einen Blick.</p></div><button data-ekl-modal-close>×</button></div><div class="ekl-record-grid"><article><small>AKTIVE WELT</small><b>${escapeWorldById(worldId)?.name||worldId}</b><span>Trainingswelt im Hub</span></article><article><small>LEVEL</small><b>${level}</b><span>noch ${fmt(Math.max(0,lp.to-lp.xp))} Power bis Level ${level+1}</span></article><article><small>EFFEKTIVER SPEED</small><b>${Math.round(speed)}</b><span>Basis ${Math.round(rawSpeedStat(worldId))}/300 · Extras +${(totalSpeedBonus()*100).toFixed(1).replace('.',',')} %</span></article><article><small>LAUFTEMPO</small><b>${movementSpeed().toFixed(1).replace('.',',')} u/s</b><span>Speed 300 = reguläres Bewegungslimit</span></article><article><small>POWER-MULTIPLIKATOR</small><b>×${normalPowerMultiplier().toFixed(2).replace('.',',')}</b><span>Additiv: Trail · Aura · Rebirth · Core · Zeitboost</span></article>${worlds.map(({w,best,stars,runs})=>`<article><small>WORLD ${w.number}</small><b>Lv ${currentLevel(w.id)} · Sp ${Math.round(currentSpeedStat(w.id))}</b><span>${w.name} · ${runs} Finishes · ${best?timeText(best):'keine Bestzeit'} · ${'★'.repeat(stars)}${'☆'.repeat(Math.max(0,3-stars))}</span></article>`).join('')}<article><small>STAGE-WINS</small><b>${Number(G.state.stageWinsCollected||0).toLocaleString('de-DE')}</b><span>über gelbe WIN-Pads gesammelt</span></article><article><small>RACE BEST</small><b>${raceBest?timeText(raceBest):'–'}</b><span>${races} Läufe</span></article><article><small>JK SKYRUN BEST</small><b>${onlyBest?timeText(onlyBest):'–'}</b><span>${onlyRuns} Finishes · Speed 100 · 150+ Meter</span></article><article><small>REBIRTHS</small><b>${G.state.rebirths}</b><span>Power-Multiplikator ×${rebirthMultiplier().toFixed(2).replace('.',',')}</span></article><article><small>BEST RUN COMBO</small><b>×${G.state.bestRunCombo||0}</b><span>Neue Plattformen ohne langen Unterbruch</span></article></div></div>`);
}
function showHelp(){
  openModal(`<div class="ekl-modal"><div class="ekl-modal-head"><div><small>ESCAPE.KL · V477</small><h2>Wie funktioniert Escape.kl?</h2><p>Laufen und Training erzeugen Level-Power. Level erhöht deinen physischen Speed bis regulär 300. Wins, Gear und Rebirth beschleunigen deinen Fortschritt. Normale Speed- und Power-Boni sind bewusst additiv gebalanced.</p></div><button data-ekl-modal-close>×</button></div><div class="ekl-help"><article><b>⚡ Speed 0–300</b><p>Dein Basis-Speed steigt mit dem Level und erreicht bei Level 1000 regulär 300. Kleine additive Prozent-Boni aus Speed-Chips, Auren, Pets, Verwandlung und Speed Core dürfen den effektiven Speed darüber anheben.</p></article><article><b>⬆ Level-Power</b><p>Normales Laufen und Laufbänder erzeugen intern Trainings-Power. Die internen Bewegungspunkte werden nicht im HUD angezeigt.</p></article><article><b>🏆 WIN-Pads</b><p>Gelbes WIN-Pad rechts = Wins kassieren und zurück zum Weltstart. Wer weiter zur nächsten Stage will, lässt das Pad aus.</p></article><article><b>◆ Wiederbelebung</b><p>Fällst du in World 1, 2 oder 3 herunter, wirst du sofort am Weltstart eingesetzt und kannst ohne Pause weiterspielen. Für 5 Sekunden kannst du optional für feste 20 JK/Coin an die letzte sichere Plattform zurückspringen. Ohne Kauf spielst du einfach vom Start weiter.</p></article><article><b>🏃 Laufbänder</b><p>FREE ×1,3 · FREE+ ×1,6 · SILBER ×2 · GOLD ×2,8 · DIAMOND ×4. Im Pausenmenü kannst du freigeschaltete Laufbänder selbst erzeugen; GALAXY ×6 und ADMIN ×10 gibt es nur dort als Premium-Spawn-Laufbänder.</p></article><article><b>🏪 Escape Shop</b><p>Power-Upgrades, Speed-Items, Trails, Auren, Charaktere, Pets und Premium-Inhalte befinden sich ausschließlich im Shop – nicht mehr als Kaufbuttons auf dem Hub-Boden.</p></article><article><b>🌈 Trails + Auren</b><p>Fuß- oder Rückenspuren bleiben kurz als Partikel hinter dir. Trails geben kleine Power-Boni. Auren geben zusätzlich einen kleinen Speed-Prozentbonus; alle normalen Boni werden addiert statt miteinander multipliziert.</p></article><article><b>🪽 Pets + Verwandlung</b><p>Du kannst maximal zwei Pets gleichzeitig benutzen. EYE: +2 % Speed/Wins. Reptisect: +1,5 % Speed/Wins und läuft dir animiert hinterher. Phönix: +3,0 % Speed / +2,5 % Wins und folgt dir dauerhaft fliegend mit leichter Verzögerung. Die Dämonenverwandlung bleibt ein getrenntes System und kann gleichzeitig mit Pets aktiv sein.</p></article><article><b>🧩 Core-Upgrades</b><p>Training Core, Treadmill Core, Speed Core und Win Core werden mit Wins ausgebaut und haben jeweils drei Stufen. Speed Core darf den effektiven Speed kontrolliert über 300 anheben.</p></article><article><b>🔄 Rebirth</b><p>Rebirth braucht hohe Level, setzt die aktive Welt zurück und gibt einen permanenten Power-Multiplikator.</p></article><article><b>👑 Owner-Mod-Menü</b><p>Nur der Owner sieht das Escape-Mod-Menü für Level, Speed, Wins, Rebirths, Weltfreischaltung, Perks und Events.</p></article><article><b>🌅 Tag / Nacht</b><p>Der Hub und JK SKYRUN wechseln automatisch zwischen Nacht, Sonnenaufgang, Tag und Sonnenuntergang.</p></article><article><b>🏔️ JK SKYRUN</b><p>Vertikale Zeitjagd über 140 Plattformen und 150+ Meter. Jeder hat exakt Speed 100; Speed-Items, Auren, Pets und Sprint geben dort keinen Vorteil. Es gibt keine Checkpoints und kein JK/Coin-Revive. Ein Sturz bedeutet Neustart ganz unten. An neun Höhenmarken gibt es feste Wins; am Ziel immer dieselbe feste Win-Belohnung.</p></article><article><b>🎮 Steuerung</b><p>PC: WASD · Space · Shift · Maus. Handy: linker Daumen Bewegung, rechter Daumen Kamera sowie separate Sprint-, Springen- und Aktion-Buttons.</p></article></div></div>`);
}
function ownerSetExactSpeed(worldId,value){
  if(!isEscapeOwner())return false;
  const p=progressForWorld(worldId);value=Math.max(0,Math.min(OWNER_SPEED_SOFT_CAP,Number(value)||0));
  p.adminSpeedOverride=value;return true;
}
function ownerSetExactLevel(worldId,value){
  if(!isEscapeOwner())return false;
  value=Math.max(0,Math.min(100000,Math.floor(Number(value)||0)));const p=progressForWorld(worldId);p.xp=powerForLevel(value,worldId);return true;
}
function ownerSetPowerTier(value){
  if(!isEscapeOwner())return false;
  G.state.stepButtonTier=Math.max(0,Math.min(STEP_BUTTONS.length-1,Math.floor(Number(value)||0)));return true;
}
function ownerSetActiveTrail(id){
  if(!isEscapeOwner())return false;id=String(id||'none');
  if(!TRAILS.some(t=>t.id===id))id='none';
  if(id!=='none'&&!G.state.ownedTrails.includes(id))G.state.ownedTrails.push(id);
  G.state.trail=id;setTrailColor();return true;
}
function ownerSetActiveAura(id){
  if(!isEscapeOwner())return false;id=String(id||'none');
  if(!AURAS.some(a=>a.id===id))id='none';
  if(id!=='none'&&!G.state.ownedAuras.includes(id))G.state.ownedAuras.push(id);
  G.state.aura=id;setAuraStyle();return true;
}
function ownerClearActivePerks({resetPowerTier=true}={}){
  if(!isEscapeOwner())return false;
  G.state.trail='none';G.state.aura='none';G.state.activePets=[];G.state.activePet='none';if(SPECIAL_CHARACTERS.some(c=>c.id===G.state.characterChoice))G.state.characterChoice='male';G.state.jkSpeedBoostUntil=0;G.state.ownerEventMultiplier=1;
  if(resetPowerTier)G.state.stepButtonTier=0;
  setTrailColor();setAuraStyle();mountCharacter(G.state.characterChoice);queuePersist(50);updateHud(true);return true;
}
function openOwnerModMenu(){
  if(!isEscapeOwner())return toast('Nur für den Owner.','bad');
  const worldId=G.state.activeTrainingWorld||'keyboard-lab';
  const options=WORLD_DEFS.filter(w=>!w.locked).map(w=>`<option value="${w.id}" ${w.id===worldId?'selected':''}>World ${w.number} · ${w.name}</option>`).join('');
  const powerOptions=STEP_BUTTONS.map(u=>`<option value="${u.tier}" ${Number(G.state.stepButtonTier||0)===u.tier?'selected':''}>Stufe ${u.tier} · +${u.gain} Power</option>`).join('');
  const trailOptions=TRAILS.map(t=>`<option value="${t.id}" ${G.state.trail===t.id?'selected':''}>${t.name}</option>`).join('');
  const auraOptions=AURAS.map(a=>`<option value="${a.id}" ${G.state.aura===a.id?'selected':''}>${a.name}</option>`).join('');
  const wrap=openModal(`<div class="ekl-modal ekl-owner-mod"><div class="ekl-modal-head"><div><small>OWNER ONLY · ESCAPE.KL</small><h2>👑 Mod-Menü</h2><p>Direkte Entwicklungs-/Eventsteuerung. Zusätzlich kannst du alle aktiven Perks, Trails, Auren und Boosts sofort ablegen. Bereits gekaufte Trails/Auren bleiben im Besitz.</p></div><button data-ekl-modal-close>×</button></div><div class="ekl-owner-mod-grid"><label><span>Welt</span><select data-mod-world>${options}</select></label><label><span>Level</span><input data-mod-level type="number" min="0" max="100000" value="${currentLevel(worldId)}"></label><label><span>Speed</span><input data-mod-speed type="number" min="0" max="${OWNER_SPEED_SOFT_CAP}" step="1" value="${Math.round(rawSpeedStat(worldId))}"></label><label><span>Wins</span><input data-mod-wins type="number" min="0" step="1" value="${Math.floor(G.state.wins)}"></label><label><span>Rebirths</span><input data-mod-rebirth type="number" min="0" max="10000" step="1" value="${G.state.rebirths}"></label><label><span>Admin-Event Power</span><select data-mod-event>${[1,2,3,5,10,25,50,100].map(v=>`<option value="${v}" ${Number(G.state.ownerEventMultiplier||1)===v?'selected':''}>×${v}</option>`).join('')}</select></label><label><span>Power-Perk</span><select data-mod-power-tier>${powerOptions}</select></label><label><span>Aktive Spur</span><select data-mod-trail>${trailOptions}</select></label><label><span>Aktive Aura</span><select data-mod-aura>${auraOptions}</select></label></div><div class="ekl-owner-quick"><button data-mod-level-plus>+100 Level</button><button data-mod-speed-plus>+25 Speed</button><button data-mod-speed-max>Speed 300</button><button data-mod-unlock>Alle Welten frei</button><button data-mod-reset-world>Welt zurücksetzen</button><button data-mod-reset-rebirth>Rebirths 0</button><button data-mod-clear-trail>Spur entfernen</button><button data-mod-clear-aura>Aura entfernen</button><button data-mod-clear-boosts>Boosts / Event aus</button><button class="owner" data-mod-clear-all>Alle Perks & Effekte entfernen</button><button class="owner" data-mod-hitboxes>Hitboxen ${G.hitboxDebugEnabled?'AUS':'AN'}</button></div><div class="ekl-modal-actions"><button class="gold" data-mod-apply>Werte übernehmen</button><button data-ekl-modal-close>Schließen</button></div></div>`);
  // V460: X/Schließen im Owner-Menü führt sauber zurück ins Pause-Menü. So bleibt
  // kein unsichtbarer Pause-Zustand hängen.
  wrap.querySelectorAll('[data-ekl-modal-close]').forEach(b=>b.onclick=()=>{closeModal();setTimeout(showPause,0);});
  const selected=()=>wrap.querySelector('[data-mod-world]')?.value||worldId;
  const refresh=()=>{
    const id=selected();wrap.querySelector('[data-mod-level]').value=currentLevel(id);wrap.querySelector('[data-mod-speed]').value=Math.round(rawSpeedStat(id));
    const event=wrap.querySelector('[data-mod-event]');if(event)event.value=String(G.state.ownerEventMultiplier||1);
    const tier=wrap.querySelector('[data-mod-power-tier]');if(tier)tier.value=String(G.state.stepButtonTier||0);
    const trail=wrap.querySelector('[data-mod-trail]');if(trail)trail.value=G.state.trail||'none';
    const aura=wrap.querySelector('[data-mod-aura]');if(aura)aura.value=G.state.aura||'none';
  };
  wrap.querySelector('[data-mod-world]')?.addEventListener('change',refresh);
  wrap.querySelector('[data-mod-apply]')?.addEventListener('click',()=>{
    const id=selected();ownerSetExactLevel(id,wrap.querySelector('[data-mod-level]').value);ownerSetExactSpeed(id,wrap.querySelector('[data-mod-speed]').value);
    G.state.wins=Math.max(0,Math.floor(Number(wrap.querySelector('[data-mod-wins]').value)||0));G.state.rebirths=Math.max(0,Math.floor(Number(wrap.querySelector('[data-mod-rebirth]').value)||0));G.state.ownerEventMultiplier=Math.max(1,Number(wrap.querySelector('[data-mod-event]').value)||1);G.state.activeTrainingWorld=id;
    ownerSetPowerTier(wrap.querySelector('[data-mod-power-tier]').value);ownerSetActiveTrail(wrap.querySelector('[data-mod-trail]').value);ownerSetActiveAura(wrap.querySelector('[data-mod-aura]').value);
    updateWorldUnlocks();queuePersist(50);updateHud(true);soundBuy();toast('👑 Owner-Werte & aktive Perks übernommen.','good',1900);closeModal();setTimeout(showPause,0);
  });
  wrap.querySelector('[data-mod-level-plus]')?.addEventListener('click',()=>{const id=selected();ownerSetExactLevel(id,currentLevel(id)+100);refresh();});
  wrap.querySelector('[data-mod-speed-plus]')?.addEventListener('click',()=>{const id=selected();ownerSetExactSpeed(id,rawSpeedStat(id)+25);refresh();});
  wrap.querySelector('[data-mod-speed-max]')?.addEventListener('click',()=>{ownerSetExactSpeed(selected(),300);refresh();});
  wrap.querySelector('[data-mod-unlock]')?.addEventListener('click',()=>{G.state.worldsUnlocked=[...new Set(WORLD_DEFS.filter(w=>!w.locked).map(w=>w.id))];queuePersist(50);toast('Alle vorhandenen Escape-Welten freigeschaltet.','good');});
  wrap.querySelector('[data-mod-reset-world]')?.addEventListener('click',()=>{const id=selected();G.state.worldProgress[id]=emptyWorldProgress();refresh();queuePersist(50);updateHud(true);toast('Weltfortschritt zurückgesetzt.','good');});
  wrap.querySelector('[data-mod-reset-rebirth]')?.addEventListener('click',()=>{G.state.rebirths=0;wrap.querySelector('[data-mod-rebirth]').value=0;queuePersist(50);updateHud(true);toast('Rebirths auf 0 gesetzt.','good');});
  wrap.querySelector('[data-mod-clear-trail]')?.addEventListener('click',()=>{ownerSetActiveTrail('none');refresh();queuePersist(50);updateHud(true);toast('Spur abgelegt. Besitz bleibt erhalten.','good');});
  wrap.querySelector('[data-mod-clear-aura]')?.addEventListener('click',()=>{ownerSetActiveAura('none');refresh();queuePersist(50);updateHud(true);toast('Aura abgelegt. Besitz bleibt erhalten.','good');});
  wrap.querySelector('[data-mod-clear-boosts]')?.addEventListener('click',()=>{G.state.jkSpeedBoostUntil=0;G.state.ownerEventMultiplier=1;refresh();queuePersist(50);updateHud(true);toast('Temporäre Boosts und Admin-Event-Multiplikator entfernt.','good');});
  wrap.querySelector('[data-mod-clear-all]')?.addEventListener('click',()=>{ownerClearActivePerks({resetPowerTier:true});refresh();toast('Alle aktiven Perks, Spur, Aura und Boosts entfernt.','good',2200);});
  wrap.querySelector('[data-mod-hitboxes]')?.addEventListener('click',()=>{
    setHitboxDebug(!G.hitboxDebugEnabled);
    // V460: Nach dem Umschalten direkt zurück ins Spiel. Das Pause-/Mod-Modal
    // darf die Bewegung nicht weiter blockieren, während die Hitboxen sichtbar sind.
    closeModal();G.paused=false;G.keys.clear();G.mobileX=G.mobileY=0;G.mobileSprint=false;
    toast(G.hitboxDebugEnabled?'🧰 Hitboxen sichtbar · Debug-Overlay aktiv · Bewegung frei':'🧰 Hitboxen ausgeblendet · Bewegung frei','good',2200);
  });
}
function showPause(){
  G.paused=true;const owner=isEscapeOwner();
  openModal(`<div class="ekl-modal"><div class="ekl-modal-head"><div><small>ESCAPE.KL</small><h2>Pause</h2><p>Dein Lauf ist angehalten.${owner?' · Owner-Mod-Menü verfügbar.':''}</p></div><button data-ekl-resume>×</button></div><div class="ekl-modal-actions"><button data-ekl-resume class="gold">Weiter</button><button data-ekl-treadmills>🏃 Laufband</button><button data-ekl-pets>🪽 Pets ausrüsten</button><button data-ekl-hub>Zum Hub</button>${owner?'<button class="owner" data-ekl-owner-mod>👑 Mod-Menü</button>':''}<button data-ekl-exit>Top Games</button><button data-ekl-help>Steuerung</button></div></div>`);
  G.overlay.querySelectorAll('[data-ekl-resume]').forEach(b=>b.onclick=()=>{closeModal();G.paused=false});
  G.overlay.querySelector('[data-ekl-treadmills]')?.addEventListener('click',openTreadmillSpawnMenu);G.overlay.querySelector('[data-ekl-pets]')?.addEventListener('click',openPetEquipMenu);
  G.overlay.querySelector('[data-ekl-hub]').onclick=()=>{G.paused=false;setWorld('hub')};
  G.overlay.querySelector('[data-ekl-exit]').onclick=returnToTopGames;
  G.overlay.querySelector('[data-ekl-help]').onclick=showHelp;
  G.overlay.querySelector('[data-ekl-owner-mod]')?.addEventListener('click',openOwnerModMenu);
}
function showComplete(w,sec,stars,reward,previous){const wrap=document.createElement('div');wrap.className='ekl-complete';wrap.dataset.eklComplete='1';wrap.innerHTML=`<div class="ekl-complete-card"><small>WORLD ${w.number} COMPLETE</small><h2>${w.name} geschafft!</h2><div class="ekl-stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div><p>Zeit <b>${timeText(sec)}</b>${previous?` · Vorher ${timeText(previous)}`:''}<br>Finish-Bonus <b>+${reward.toLocaleString('de-DE')} Wins</b><br><small>Gelbe WIN-Pads sind freiwillige Cash-outs: Einsammeln schickt dich sofort zurück zum Weltstart.</small></p><div class="ekl-modal-actions"><button data-ekl-again class="gold">Nochmal</button><button data-ekl-finish-hub>Zum Hub</button></div></div>`;G.overlay.append(wrap);wrap.querySelector('[data-ekl-again]').onclick=()=>{wrap.remove();setWorld(w.id)};wrap.querySelector('[data-ekl-finish-hub]').onclick=()=>{wrap.remove();setWorld('hub')};}

function showRaceComplete(sec,reward,previous,record){const wrap=document.createElement('div');wrap.className='ekl-complete';wrap.dataset.eklComplete='1';wrap.innerHTML=`<div class="ekl-complete-card"><small>SPEED RACE COMPLETE</small><h2>${record?'🏆 Neue Bestzeit!':'🏁 Rennen beendet!'}</h2><div class="ekl-stars">${record?'★★★':'★★☆'}</div><p>Zeit <b>${timeText(sec)}</b>${previous?` · Vorher ${timeText(previous)}`:''}<br>Deaths <b>${G.deaths}</b> · Belohnung <b>+${reward} Wins</b></p><div class="ekl-modal-actions"><button data-ekl-race-again class="gold">Nochmal</button><button data-ekl-race-hub>Zum Hub</button></div></div>`;G.overlay.append(wrap);wrap.querySelector('[data-ekl-race-again]').onclick=()=>{wrap.remove();setWorld('race')};wrap.querySelector('[data-ekl-race-hub]').onclick=()=>{wrap.remove();setWorld('hub')};}


function bindInput(){
  G.keyDown=e=>{ensureAudio();if(['KeyW','KeyA','KeyS','KeyD','Space','ShiftLeft','ShiftRight','KeyE','KeyR','Escape'].includes(e.code))e.preventDefault();if(e.code==='Escape'){if(G.modalOpen){closeModal();G.paused=false}else showPause();return}if(e.code==='Space'){G.jumpHeld=true;requestJump();return}if(e.code==='KeyE'){interact();return}if(e.code==='KeyR'){respawn();return}G.keys.add(e.code)};
  G.keyUp=e=>{if(e.code==='Space'){G.jumpHeld=false;G.jumpQueuedUntil=0;return}G.keys.delete(e.code)};document.addEventListener('keydown',G.keyDown);document.addEventListener('keyup',G.keyUp);
  const canvas=G.overlay.querySelector('canvas');
  const clampPitch=value=>Math.max(CAMERA_PITCH_MIN,Math.min(CAMERA_PITCH_MAX,value));
  const applyCameraLook=(dx,dy,touch=false)=>{
    const sx=touch?TOUCH_LOOK_SENSITIVITY_X:.006,sy=touch?TOUCH_LOOK_SENSITIVITY_Y:.004;
    G.yaw-=dx*sx;G.pitch=clampPitch(G.pitch+dy*sy);
  };
  canvas.addEventListener('pointerdown',e=>{
    ensureAudio();
    if(e.pointerType==='touch'){
      const rect=G.overlay.getBoundingClientRect();
      // Rechte Bildschirmhälfte gehört der Kamera. Linke Seite bleibt für den Laufstick frei.
      if(e.clientX<rect.left+rect.width*.43)return;
      e.preventDefault();
      G.lookPointer={id:e.pointerId,x:e.clientX,y:e.clientY};
      G.overlay.classList.add('ekl-looking');
      try{canvas.setPointerCapture?.(e.pointerId)}catch{}
      return;
    }
    G.pointer={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture?.(e.pointerId);
  },{passive:false});
  G.pointerMove=e=>{
    if(G.lookPointer&&e.pointerId===G.lookPointer.id){
      e.preventDefault();const dx=e.clientX-G.lookPointer.x,dy=e.clientY-G.lookPointer.y;G.lookPointer.x=e.clientX;G.lookPointer.y=e.clientY;applyCameraLook(dx,dy,true);return;
    }
    if(!G.pointer||e.pointerId!==G.pointer.id)return;
    const dx=e.clientX-G.pointer.x,dy=e.clientY-G.pointer.y;G.pointer.x=e.clientX;G.pointer.y=e.clientY;applyCameraLook(dx,dy,false);
  };
  G.pointerUp=e=>{
    if(G.lookPointer&&e.pointerId===G.lookPointer.id){G.lookPointer=null;G.overlay?.classList.remove('ekl-looking')}
    if(G.pointer&&e.pointerId===G.pointer.id)G.pointer=null;
  };
  canvas.addEventListener('pointermove',G.pointerMove,{passive:false});canvas.addEventListener('pointerup',G.pointerUp);canvas.addEventListener('pointercancel',G.pointerUp);
  canvas.addEventListener('wheel',e=>{e.preventDefault();G.camDistance=Math.max(4.6,Math.min(9.6,G.camDistance+Math.sign(e.deltaY)*.55));},{passive:false});

  // TouchEvent-Fallback für ältere/in Browser-WebViews inkonsistente iPhones.
  canvas.addEventListener('touchstart',e=>{
    if(G.lookPointer||G.lookTouchId!==null)return;
    const rect=G.overlay.getBoundingClientRect();
    const t=[...e.changedTouches].find(x=>x.clientX>=rect.left+rect.width*.43);
    if(!t)return;e.preventDefault();ensureAudio();G.lookTouchId=t.identifier;G._lookTouchX=t.clientX;G._lookTouchY=t.clientY;G.overlay.classList.add('ekl-looking');
  },{passive:false});
  G.lookTouchMove=e=>{
    if(G.lookPointer||G.lookTouchId===null)return;
    const t=[...e.touches].find(x=>x.identifier===G.lookTouchId);if(!t)return;
    e.preventDefault();const dx=t.clientX-(G._lookTouchX??t.clientX),dy=t.clientY-(G._lookTouchY??t.clientY);G._lookTouchX=t.clientX;G._lookTouchY=t.clientY;applyCameraLook(dx,dy,true);
  };
  G.lookTouchEnd=e=>{
    if(G.lookTouchId===null)return;
    if([...e.changedTouches].some(x=>x.identifier===G.lookTouchId)){e.preventDefault();G.lookTouchId=null;G._lookTouchX=G._lookTouchY=null;G.overlay?.classList.remove('ekl-looking')}
  };
  window.addEventListener('touchmove',G.lookTouchMove,{passive:false});window.addEventListener('touchend',G.lookTouchEnd,{passive:false});window.addEventListener('touchcancel',G.lookTouchEnd,{passive:false});

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
function loop(){if(!G.overlay)return;const now=performance.now(),dt=Math.min(.034,Math.max(.001,(now-(G.lastFrameAt||now-16))/1000)),t=now/1000;G.lastFrameAt=now;updateDayNight(t);updatePlatforms(t,dt);processMovement(dt,t);const planarSpeed=Math.hypot(G.moveVel.x,G.moveVel.z);G.character?.update?.({grounded:G.grounded,verticalVelocity:G.vel.y,planarSpeed,sprint:G.sprint||isOnTraining(),moving:planarSpeed>.12,treadmill:isOnTraining(),animationRate:characterAnimationRate()},dt,t);updateEscapeRemotePlayers(dt,t);detectInteraction();updateCamera(dt);updateTrail(dt);updateAura(t);updateCustomVisuals(dt,t);updateHitboxDebug();G.hudClock+=dt;if(G.hudClock>.12){G.hudClock=0;updateHud()}G.renderer.render(G.scene,G.camera);G.raf=requestAnimationFrame(loop);}

function open(sourceDevice=''){
  if(G.overlay)return;
  if(sourceDevice)G.sourceDevice=String(sourceDevice);else G.sourceDevice=window.JKGamesOwnedPhoneItem?.()||'';
  loadProgress();
  const el=document.createElement('div');el.className='escape-kl-overlay';
  el.innerHTML=`<div class="ekl-stage"><div class="ekl-canvas"><canvas aria-label="Escape.kl 3D Jump and Run"></canvas></div><div class="ekl-vignette"></div><div class="ekl-hud"><div class="ekl-topbar"><div class="ekl-statrow"><div class="ekl-stat speed"><small>SPEED</small><b data-ekl-speed>5 / 300</b></div><div class="ekl-stat level"><small>LEVEL</small><b data-ekl-level>0</b></div><div class="ekl-stat wins"><small>WINS</small><b data-ekl-wins>0</b></div><div class="ekl-stat rebirth"><small>REBIRTH</small><b data-ekl-rebirths>0</b></div></div><div class="ekl-level-progress"><div><span>LEVEL</span><b data-ekl-level-next>NÄCHSTES LEVEL</b></div><i><span data-ekl-level-bar></span></i></div><div class="ekl-top-actions"><span data-ekl-online title="Escape Multiplayer" style="display:inline-flex;align-items:center;justify-content:center;min-width:44px;height:30px;padding:0 8px;border:1px solid rgba(170,185,204,.24);border-radius:999px;background:rgba(5,14,24,.72);font:800 10px/1 system-ui;color:#a7b2c1;letter-spacing:.04em;white-space:nowrap">○ OFF</span><button data-ekl-help title="Hilfe">?</button><button data-ekl-pause title="Pause">Ⅱ</button><button data-ekl-close title="Top Games">×</button></div></div><div class="ekl-prompt" data-ekl-prompt></div><div class="ekl-toast" data-ekl-toast></div><div class="ekl-touch"><div class="ekl-look-hint" aria-hidden="true"><span>↕</span>KAMERA<span>↔</span></div><div class="ekl-stick" data-ekl-stick><i class="ekl-stick-knob"></i></div><div class="ekl-touch-actions"><button class="sprint" data-ekl-sprint>SPRINT</button><button class="jump" data-ekl-jump>SPRINGEN</button><button class="interact" data-ekl-interact>AKTION</button></div></div></div></div>`;
  document.body.append(el);document.body.classList.add('escape-kl-open');G.overlay=el;setupScene();bindInput();
  el.querySelector('[data-ekl-close]').onclick=returnToTopGames;el.querySelector('[data-ekl-pause]').onclick=showPause;el.querySelector('[data-ekl-help]').onclick=showHelp;
  G.resizeHandler=()=>requestAnimationFrame(resize);G.orientationHandler=()=>setTimeout(resize,90);window.addEventListener('resize',G.resizeHandler,{passive:true});window.addEventListener('orientationchange',G.orientationHandler,{passive:true});window.visualViewport?.addEventListener('resize',G.resizeHandler,{passive:true});
  G.lastFrameAt=performance.now();G.raf=requestAnimationFrame(loop);connectEscapeMultiplayer().catch(()=>{});setTimeout(()=>window.JKCoinApp?.applyPendingGameEntitlements?.(),500);console.info(`Escape.kl ${VERSION} aktiv`);
}
function close(){if(!G.overlay)return;stopEscapeMultiplayer(true);cancelReviveOffer(false);removeSummonedTreadmill();clearTimeout(G.persistTimer);if(G.dirty)syncProgressToMain(true);cancelAnimationFrame(G.raf);document.removeEventListener('keydown',G.keyDown);document.removeEventListener('keyup',G.keyUp);window.removeEventListener('resize',G.resizeHandler);window.removeEventListener('orientationchange',G.orientationHandler);window.visualViewport?.removeEventListener('resize',G.resizeHandler);if(G.stickMove){window.removeEventListener('pointermove',G.stickMove);window.removeEventListener('pointerup',G.stickUp);window.removeEventListener('pointercancel',G.stickUp)}if(G.stickTouchMove){window.removeEventListener('touchmove',G.stickTouchMove);window.removeEventListener('touchend',G.stickTouchEnd);window.removeEventListener('touchcancel',G.stickTouchEnd)}if(G.lookTouchMove){window.removeEventListener('touchmove',G.lookTouchMove);window.removeEventListener('touchend',G.lookTouchEnd);window.removeEventListener('touchcancel',G.lookTouchEnd)}G.lookPointer=null;G.lookTouchId=null;closeModal();G.overlay.querySelector('[data-ekl-complete]')?.remove();disposeHitboxDebug();G.renderer?.dispose();clearWorldObjects();clearCustomVisuals();G.character?.dispose?.();if(G.trail)G.scene?.remove(G.trail);G.trailParticles=[];disposeAll();try{G.audioCtx?.close?.()}catch{}G.overlay.remove();document.body.classList.remove('escape-kl-open');G.overlay=null;G.scene=null;G.camera=null;G.renderer=null;G.player=null;G.playerRoot=null;G.character=null;G.trail=null;G.petVisuals=[];G.formWrapper=null;G.formModel=null;G.formMixer=null;G.formActions=null;G.formAction=null;G.audioCtx=null;G.keys.clear();G.mobileX=G.mobileY=0;G.mobileSprint=false;G.jumpHeld=false;G.jumpQueuedUntil=0;G.moveVel.set(0,0,0);G.paused=false;G.modalOpen=false;}
function returnToTopGames(){const source=G.sourceDevice||'';close();requestAnimationFrame(()=>window.JKGamesOpenTopGames?.(source));}
function getState(){if(!G.state)loadProgress();return JSON.parse(JSON.stringify(G.state));}
function grantAdminSpeed(amount,worldId=progressWorldId()){
  if(!hasEscapeAdminRights())return false;
  const applied=directSpeedGrant(amount,{allowAdmin:true,worldId,countDaily:false});queuePersist(50);return applied;
}

window.EscapeKL={open,close,returnToTopGames,getState,grantJkCoinPurchase,canApplyJkPurchase,grantAdminSpeed,version:VERSION,worlds:WORLD_DEFS.map(w=>({...w}))};
