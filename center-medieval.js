import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';

const CENTER_VERSION = '2026-08-08-jkgames-v272-staff-beam-hold-attack';
const ONLINE_MAP_ID = 'center-dynasty-open-world-v3';
const WORLD_HALF = 6000;
const CHUNK_SIZE = 180;
const WORLD_SEED = 20260802;
const MIN_RENDER_DISTANCE = 1;
const MAX_RENDER_DISTANCE = 5;
const WATER_LEVEL = -2.15;
const ONLINE_WRITE_INTERVAL_MS = 100;
const ONLINE_HEARTBEAT_MS = 3500;
const ONLINE_STALE_MS = 45000;
const ONLINE_REMOTE_GRACE_MS = 7500;
const ONLINE_QUERY_LIMIT = 48;
const PERF_TASK_INTERVALS = Object.freeze({ world:100, needs:250, animals:55, ambient:60, npcs:105, death:450, thrown:34, effects:34, weather:40, hotspots:110 });
const MAX_REMOTE_PLAYERS = 16;
const CHARACTER_MODEL_YAW = 0;
const COLLIDER_CELL_SIZE = 16;
const PLAYER_COLLIDER_RADIUS = .56;
const MIN_WORLD_CLEARANCE = .08;
const MAX_FLY_HEIGHT = 165;
const PRIMARY_ACTION_COOLDOWN_MS = 520;
const DAYS_PER_SEASON = 12;
const WORLD_TIME_HOURS_PER_MINUTE = 1.35;
const CONTROLS_HINT_DURATION_MS = 6500;
const GRAPHICS_QUALITIES = Object.freeze(['minimal','performance','low','medium','high','ultra','maximum','extreme']);
const SHADOW_MODES = Object.freeze(['off','character','world']);
const OWNER_SPEED_LEVELS = Object.freeze([1, 1.65, 2.6]);
const OWNER_MAX_SPEED_MULTIPLIER = 12;
const DEFAULT_KEYBINDS = Object.freeze({ overview:'KeyM', inventory:'KeyI', crafting:'KeyC', building:'KeyB', perspective:'KeyV', interact:'KeyE', jump:'Space', staffMenu:'Period', vanish:'KeyG', god:'KeyH', fly:'KeyF', transform:'KeyT' });
const KEYBIND_OPTIONS = Object.freeze(['KeyM','KeyI','KeyC','KeyB','KeyV','KeyE','KeyF','KeyG','KeyH','KeyJ','KeyK','KeyL','KeyO','KeyP','KeyR','KeyT','KeyU','KeyY','Period','NumpadDecimal','Space']);
const KEYBIND_LABELS = Object.freeze({KeyM:'M',KeyI:'I',KeyC:'C',KeyB:'B',KeyV:'V',KeyE:'E',KeyF:'F',KeyG:'G',KeyH:'H',KeyJ:'J',KeyK:'K',KeyL:'L',KeyO:'O',KeyP:'P',KeyR:'R',KeyT:'T',KeyU:'U',KeyY:'Y',Period:'.',NumpadDecimal:'Numpad .',Space:'Leertaste'});
const STAFF_ROLE_LEVELS = Object.freeze({ player: 0, supporter: 1, moderator: 2, admin: 3, owner: 4 });
const STAFF_ROLE_LABELS = Object.freeze({ player:'Spieler', member:'Teammitglied', supporter:'Supporter', moderator:'Moderator', admin:'Admin', owner:'Owner', testsupporter:'Testsupporter', testmoderator:'Testmoderator', testmember:'Testmitglied' });
const STAFF_THEME_IDS = Object.freeze(['owner','admin','moderator','supporter','member']);
const STAFF_THEME_CONFIG = Object.freeze({
  owner:Object.freeze({label:'Owner Galaxy',primary:0x8b4dff,secondary:0xff4fa3,accent:0x55c7ff,dark:0x17052d,emissive:0x4d168c,css:'owner'}),
  admin:Object.freeze({label:'Admin Red Galaxy',primary:0xff314f,secondary:0xff7a3d,accent:0xffb1bd,dark:0x31030a,emissive:0x8f1028,css:'admin'}),
  moderator:Object.freeze({label:'Moderator Grün',primary:0x2ee878,secondary:0x8cff68,accent:0xc2ffd7,dark:0x042914,emissive:0x08763a,css:'moderator'}),
  supporter:Object.freeze({label:'Supporter Blau',primary:0x348dff,secondary:0x4fdcff,accent:0xc7edff,dark:0x031d47,emissive:0x0b4b9c,css:'supporter'}),
  member:Object.freeze({label:'Team Weiß',primary:0xf0f2f4,secondary:0xbec5cc,accent:0xffffff,dark:0x24282c,emissive:0x686f76,css:'member'})
});
const ANIMAL_FORM_IDS = Object.freeze(['fox','shark','cow','orca','horse','owl','wolf1','wolf2','spider','clownfish','bird']);
const STAFF_CAPABILITY_MATRIX = Object.freeze({
  supporter: Object.freeze({ menu:true, vanish:true, god:true, heal:true, online:true, teleport:true, fly:true, noclip:false, speed:false, freezeTime:false, size:false, forms:Object.freeze(['normal']), items:Object.freeze(['none','sword','staff','eternalFlame']), vehicles:Object.freeze(['none']), world:false, resources:false, ownerCosmetics:true }),
  moderator: Object.freeze({ menu:true, vanish:true, god:true, heal:false, online:true, teleport:true, fly:true, noclip:false, speed:true, freezeTime:false, size:false, forms:Object.freeze(['normal','crystal','bush','tree','rock','grass']), items:Object.freeze(['none','sword','staff','eternalFlame']), vehicles:Object.freeze(['none']), world:false, resources:false, ownerCosmetics:true }),
  admin: Object.freeze({ menu:true, vanish:true, god:true, heal:true, online:true, teleport:true, fly:true, noclip:true, speed:true, freezeTime:true, size:true, forms:Object.freeze(['normal','ball','crystal','bush','tree','rock','grass',...ANIMAL_FORM_IDS]), items:Object.freeze(['none','shovel','pickaxe','hoe','axe','hammer','sword','staff','eternalFlame']), vehicles:Object.freeze(['none','scooter','plane']), world:true, resources:true, ownerCosmetics:true }),
  owner: Object.freeze({ menu:true, vanish:true, god:true, heal:true, online:true, teleport:true, fly:true, noclip:true, speed:true, freezeTime:true, size:true, forms:Object.freeze(['normal','ball','crystal','bush','tree','rock','grass',...ANIMAL_FORM_IDS]), items:Object.freeze(['none','shovel','pickaxe','hoe','axe','hammer','sword','staff','eternalFlame']), vehicles:Object.freeze(['none','scooter','plane']), world:true, resources:true, ownerCosmetics:true })
});
const TEST_MEMBER_CAPS = Object.freeze({ menu:true, vanish:false, god:false, heal:false, online:true, teleport:false, fly:false, noclip:false, speed:false, freezeTime:false, size:false, forms:Object.freeze(['normal']), items:Object.freeze(['none']), vehicles:Object.freeze(['none']), world:false, resources:false, ownerCosmetics:false });
const TEST_SUPPORTER_CAPS = Object.freeze({ menu:true, vanish:true, god:true, heal:true, online:true, teleport:true, fly:true, noclip:false, speed:false, freezeTime:false, size:false, forms:Object.freeze(['normal']), items:Object.freeze(['none']), vehicles:Object.freeze(['none']), world:false, resources:false, ownerCosmetics:false });
function detailedStaffRole(value='') {
  const compact=String(value||'').toLowerCase().replace(/[\s._-]+/g,'');
  if(compact==='owner')return 'owner';
  if(compact==='admin'||compact==='administrator')return 'admin';
  if(compact==='testmoderator'||compact==='testmod')return 'testmoderator';
  if(compact==='moderator'||compact==='mod')return 'moderator';
  if(compact==='testsupporter'||compact==='testsupport')return 'testsupporter';
  if(compact==='supporter'||compact==='support')return 'supporter';
  if(compact==='testmember'||compact==='testmitglied'||compact==='member'||compact==='mitglied')return 'testmember';
  return 'player';
}
function canonicalStaffRole(value='') {
  const detail=detailedStaffRole(value);
  if(detail==='owner'||detail==='admin')return detail;
  if(detail==='moderator'||detail==='testmoderator')return 'moderator';
  if(detail==='supporter'||detail==='testsupporter'||detail==='testmember')return 'supporter';
  return 'player';
}
function staffThemeForDetailedRole(value='') {
  const detail=detailedStaffRole(value);
  if(detail==='owner')return 'owner';if(detail==='admin')return 'admin';
  if(detail==='moderator'||detail==='testmoderator')return 'moderator';
  if(detail==='supporter')return 'supporter';
  if(detail==='testsupporter'||detail==='testmember')return 'member';
  return 'member';
}
function normalizeStaffTheme(value='owner',allowNone=false){const theme=String(value||'').toLowerCase();if(allowNone&&theme==='none')return 'none';return STAFF_THEME_IDS.includes(theme)?theme:'owner';}
function staffThemeConfig(theme='owner'){return STAFF_THEME_CONFIG[normalizeStaffTheme(theme)]||STAFF_THEME_CONFIG.owner;}
function staffCapabilities(role='player',detailRole=role) {
  const detail=detailedStaffRole(detailRole);
  if(detail==='testmember')return TEST_MEMBER_CAPS;
  if(detail==='testsupporter')return TEST_SUPPORTER_CAPS;
  return STAFF_CAPABILITY_MATRIX[canonicalStaffRole(role)] || Object.freeze({ menu:false, forms:Object.freeze(['normal']), items:Object.freeze(['none']) });
}
function detectPerformanceTier(isMobile=false){
  const cores=Math.max(1,Number(navigator.hardwareConcurrency)||4),memory=Math.max(1,Number(navigator.deviceMemory)||4);
  if(isMobile)return memory<=4||cores<=4?'low':'balanced';
  if(memory<=4||cores<=4)return 'low';
  if(memory>=8&&cores>=8)return 'high';
  return 'balanced';
}
function isFirestoreIndexError(error){const code=String(error?.code||'').toLowerCase(),message=String(error?.message||'').toLowerCase();return code.includes('failed-precondition')||message.includes('index')&&message.includes('firestore');}
const installJkPointerLockGuard = () => {
  if (window.__jkPointerLockGuardInstalled) return;
  window.__jkPointerLockGuardInstalled = true;
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const name = String(reason?.name || '');
    const message = String(reason?.message || reason || '');
    if (name === 'SecurityError' && /pointer\s*lock/i.test(message) && /immediately|exited|acquired/i.test(message)) {
      event.preventDefault();
    }
  });
};
installJkPointerLockGuard();

const MOBILE_QUERY = '(max-width: 860px), (pointer: coarse)';
const ASSET_ROOT = './assets/cottbus/';
const CENTER_ASSET_ROOT = './assets/center-open-world/';
const MODEL_PATHS = Object.freeze({
  // V269: Normale Spieler benutzen die echten Ego-Shooter-Walk-Modelle.
  male: `./man-walk.glb?v=20260808-v269`,
  female: `./woman-walk.glb?v=20260808-v269`,
  // Admin und Owner teilen sich bewusst denselben weißen Staff-Skin.
  owner: `${ASSET_ROOT}player-owner.glb?v=20260808-v269`
});
const RUN_MODEL_PATHS = Object.freeze({
  male: `./man-run.glb?v=20260808-v269`,
  female: `./woman-run.glb?v=20260808-v269`
});
const CENTER_ASSET_PATHS = Object.freeze({
  basicTools: `${CENTER_ASSET_ROOT}basic-tools.glb`,
  naturePack: `${CENTER_ASSET_ROOT}baum-wolken-pack.glb`,
  firewood: `${CENTER_ASSET_ROOT}feuerholz.glb`,
  fox: `${CENTER_ASSET_ROOT}fuchs.glb?v=20260808-v260-pbr`,
  shark: `${CENTER_ASSET_ROOT}hai.glb?v=20260808-v260-pbr`,
  cow: `${CENTER_ASSET_ROOT}kuh.glb`,
  campfire: `${CENTER_ASSET_ROOT}lagerfeuer.glb`,
  farmer: `${CENTER_ASSET_ROOT}npc-farmer-man.glb`,
  orca: `${CENTER_ASSET_ROOT}orca.glb`,
  horse: `${CENTER_ASSET_ROOT}reitpferd.glb`,
  owl: `${CENTER_ASSET_ROOT}uhu.glb`,
  wolf1: `${CENTER_ASSET_ROOT}wolf-baby-1.glb?v=20260808-v260-pbr`,
  wolf2: `${CENTER_ASSET_ROOT}wolf-baby-2.glb?v=20260808-v260-pbr`,
  spider: `${CENTER_ASSET_ROOT}zauber-spinne.glb`,
  cowWalk: `${CENTER_ASSET_ROOT}kuh-lauf.glb`,
  clownfish: `${CENTER_ASSET_ROOT}clownfisch-nemo.glb`,
  birds: `${CENTER_ASSET_ROOT}voegel.glb`,
  firstPersonArms: `./assets/shared/arme-first-person.glb`,
  scooter: `${CENTER_ASSET_ROOT}electro-scooter-weiss.glb`,
  ownerWings: `${CENTER_ASSET_ROOT}angel_wings.glb?v=20260808-v264`,
  staffPlane: `${CENTER_ASSET_ROOT}saegelflugzeug.glb?v=20260808-v264`
});
const ANIMAL_PROFILES = Object.freeze({
  fox:{label:'Fuchs',asset:'fox',size:1.55,speed:2.4,run:4.9,zone:'land',idle:/idle|look|sit/i,move:/walk|trot|run/i},
  cow:{label:'Kuh',asset:'cow',walkAsset:'cowWalk',size:2.45,speed:1.2,run:2.1,zone:'land',idle:/idle|eating/i,move:/walk|run|trot/i},
  horse:{label:'Reitpferd',asset:'horse',size:2.5,speed:2.6,run:7.2,zone:'land',idle:null,move:null,yawOffset:0,proceduralWalk:true},
  owl:{label:'Uhu',asset:'owl',size:1.25,speed:4.3,run:6.2,zone:'air',idle:/idle|headtwist/i,move:/fly/i},
  wolf1:{label:'Wolf Baby I',asset:'wolf1',size:1.15,speed:2.35,run:4.6,zone:'land',idle:/idle|look|sit/i,move:/walk|run/i},
  wolf2:{label:'Wolf Baby II',asset:'wolf2',size:1.15,speed:2.45,run:4.8,zone:'land',idle:/idle|look|sit/i,move:/walk|run/i},
  spider:{label:'Zauberspinne',asset:'spider',size:1.75,speed:1.55,run:3.1,zone:'land',idle:null,move:/walk|run|animation/i,yawOffset:Math.PI,singleMoveAnimation:true},
  clownfish:{label:'Clownfisch Nemo',asset:'clownfish',size:.72,speed:2.2,run:3.8,zone:'water',idle:/idle/i,move:/swim/i},
  bird:{label:'Vogel',asset:'birds',size:1.0,speed:5.2,run:8.5,zone:'air',idle:/scene|idle/i,move:/scene|fly/i},
  shark:{label:'Hai',asset:'shark',size:4.2,speed:3.4,run:5.1,zone:'water',idle:/swim/i,move:/swim/i,predator:true},
  orca:{label:'Orka',asset:'orca',size:4.9,speed:3.2,run:5.4,zone:'water',idle:/berenang|swim/i,move:/berenang|swim/i,predator:true,yawOffset:Math.PI/2}
});
const SEASONS = Object.freeze([
  { id: 'spring', name: 'Frühling', icon: '🌱', ground: 0x6d8f4d, foliage: 0x4f823f, fog: 0xb8d4c1, sky: 0x78a9cf, temp: 13 },
  { id: 'summer', name: 'Sommer', icon: '☀', ground: 0x77984b, foliage: 0x3f7e36, fog: 0xc5d9c0, sky: 0x69a4d9, temp: 23 },
  { id: 'autumn', name: 'Herbst', icon: '🍂', ground: 0x8a7748, foliage: 0xa3622e, fog: 0xcab997, sky: 0x849db1, temp: 9 },
  { id: 'winter', name: 'Winter', icon: '❄', ground: 0xc4c9c3, foliage: 0x87968d, fog: 0xd9e1e3, sky: 0x9eb9ca, temp: -7 }
]);
const WEATHER = Object.freeze({
  clear: { name: 'Klar', icon: '☀', temp: 2, fog: 1, drain: 1 },
  cloudy: { name: 'Bewölkt', icon: '☁', temp: 0, fog: 1.15, drain: 1 },
  rain: { name: 'Regen', icon: '🌧', temp: -3, fog: 1.45, drain: 1.22 },
  storm: { name: 'Sturm', icon: '⛈', temp: -5, fog: 1.7, drain: 1.42 },
  snow: { name: 'Schnee', icon: '🌨', temp: -8, fog: 1.55, drain: 1.55 }
});
const BUILDINGS = Object.freeze({
  campfire: { name: 'Lagerfeuer', icon: '🔥', wood: 0, firewood: 4, logs: 0, stone: 2, size: 2.2, category: 'Lager' },
  house: { name: 'Wohnhaus', icon: '⌂', wood: 8, logs: 20, stone: 12, size: 6.2, category: 'Wohnen' },
  woodshed: { name: 'Holzfällerlager', icon: '🪵', wood: 6, logs: 12, stone: 6, size: 5.3, category: 'Produktion' },
  storage: { name: 'Lagerhaus', icon: '▣', wood: 8, logs: 18, stone: 14, size: 6.6, category: 'Lager' },
  well: { name: 'Brunnen', icon: '◉', wood: 5, logs: 8, stone: 16, size: 3.4, category: 'Versorgung' },
  workshop: { name: 'Werkstatt', icon: '⚒', wood: 10, logs: 25, stone: 15, size: 7, category: 'Produktion' },
  field: { name: 'Acker', icon: '▥', wood: 4, logs: 4, stone: 0, size: 8, category: 'Landwirtschaft' },
  barn: { name: 'Scheune', icon: '🌾', wood: 12, logs: 28, stone: 10, size: 8.4, category: 'Landwirtschaft' },
  huntingLodge: { name: 'Jagdhütte', icon: '🏹', wood: 10, logs: 22, stone: 8, size: 7.2, category: 'Jagd' },
  mine: { name: 'Bergwerk', icon: '⛏', wood: 16, logs: 32, stone: 28, size: 8.8, category: 'Bergbau' },
  tavern: { name: 'Taverne', icon: '🍲', wood: 14, logs: 30, stone: 20, size: 8.6, category: 'Gemeinschaft' }
});
const RECIPES = Object.freeze({
  axe: { name: 'Steinaxt', icon: '🪓', cost: { wood: 3, stone: 2 }, durability: 100, skill: 'survival' },
  pickaxe: { name: 'Steinspitzhacke', icon: '⛏', cost: { wood: 4, stone: 4 }, durability: 100, skill: 'crafting' },
  spear: { name: 'Jagdspeer', icon: '➶', cost: { wood: 4, stone: 1 }, durability: 100, skill: 'hunting' },
  hammer: { name: 'Bauhammer', icon: '🔨', cost: { wood: 4, stone: 2 }, durability: 100, skill: 'building' },
  torch: { name: 'Fackel', icon: '🕯', cost: { wood: 2, leather: 1 }, durability: 80, skill: 'survival' },
  cookedMeat: { name: 'Gebratenes Fleisch', icon: '🍖', cost: { meat: 1, wood: 1 }, amount: 1, skill: 'survival' },
  bow: { name: 'Jägerbogen', icon: '🏹', cost: { wood: 6, leather: 3, flax: 2 }, durability: 120, skill: 'hunting' },
  ironAxe: { name: 'Eisenaxt', icon: '🪓', cost: { wood: 3, iron: 4, leather: 1 }, durability: 180, skill: 'crafting' },
  medicine: { name: 'Heilkräuter', icon: '🌿', cost: { herbs: 3, water: 1 }, amount: 1, skill: 'survival' }
});
const SKILLS = Object.freeze({
  survival: { name: 'Überleben', icon: '⛺', text: 'Langsamerer Hunger- und Durstverlust.' },
  forestry: { name: 'Forstwirtschaft', icon: '🌲', text: 'Mehr Holz beim Fällen.' },
  mining: { name: 'Bergbau', icon: '⛏', text: 'Mehr Stein und Erz.' },
  hunting: { name: 'Jagd', icon: '➶', text: 'Mehr Fleisch und Leder.' },
  building: { name: 'Baukunst', icon: '⌂', text: 'Gebäude benötigen weniger Rohstoffe.' },
  diplomacy: { name: 'Diplomatie', icon: '♟', text: 'Bewohner lassen sich leichter anwerben.' },
  agriculture: { name: 'Landwirtschaft', icon: '🌾', text: 'Felder und Bauern erzeugen mehr Nahrung.' },
  crafting: { name: 'Handwerk', icon: '⚒', text: 'Werkzeuge halten länger und Werkstätten produzieren mehr.' }
});
const RESOURCE_LABELS = Object.freeze({ wood: 'Holz', firewood: 'Feuerholz', logs: 'Stämme', stone: 'Stein', berries: 'Beeren', mushrooms: 'Pilze', meat: 'Fleisch', cookedMeat: 'Gebratenes Fleisch', water: 'Wasser', leather: 'Leder', flax: 'Flachs', iron: 'Eisenerz', herbs: 'Kräuter', grain: 'Getreide', medicine: 'Heilmittel', coins: 'Münzen' });
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
const nextPaint = () => new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
const distance2D = (a, b) => Math.hypot((a?.x || 0) - (b?.x || 0), (a?.z || 0) - (b?.z || 0));
const pointSegmentDistance = (px,pz,ax,az,bx,bz) => { const vx=bx-ax,vz=bz-az,wx=px-ax,wz=pz-az,t=clamp((wx*vx+wz*vz)/Math.max(.0001,vx*vx+vz*vz),0,1); return Math.hypot(px-(ax+vx*t),pz-(az+vz*t)); };
const makeSessionId = () => { try { return crypto.randomUUID(); } catch { return `center-${Date.now()}-${Math.random().toString(36).slice(2)}`; } };
const isEditableTarget = (target) => !!target?.closest?.('input,textarea,select,[contenteditable="true"]');
const isFirebasePermissionError = (error) => {
  const code=String(error?.code||'').toLowerCase(),message=String(error?.message||error||'').toLowerCase();
  return code.includes('permission-denied')||message.includes('missing or insufficient permissions')||message.includes('permission denied');
};
const lerpAngle = (from, to, amount) => {
  let delta = (to - from + Math.PI) % (Math.PI * 2) - Math.PI;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return from + delta * amount;
};

function seededRandom(seed = 1) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function hash2(x, z, seed = WORLD_SEED) {
  let h = (Math.imul(Math.floor(x), 374761393) + Math.imul(Math.floor(z), 668265263) + Math.imul(seed, 69069)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function chunkKey(cx, cz) { return `${cx}:${cz}`; }
function worldToChunk(value) { return Math.floor((Number(value) + WORLD_HALF) / CHUNK_SIZE); }
function chunkOrigin(index) { return -WORLD_HALF + index * CHUNK_SIZE; }
function densityMultiplier(value) { return value === 'low' ? .58 : value === 'high' ? 1.42 : 1; }

function roleSnapshot() {
  const api = window.LifeBuilderSettingsMenu || window.LifeBuilderOnlineMod;
  let sessionRole = '';
  try {
    const parsed = JSON.parse(sessionStorage.getItem('lifebuilder-2026-online-mod-session') || 'null');
    if (parsed?.authorized && Number(parsed.expiresAt || 0) > Date.now()) sessionRole = String(parsed.role || '').toLowerCase();
  } catch {}
  const rawRole = String(api?.getRole?.()?.role || sessionRole || '').toLowerCase();
  const detailRole = detailedStaffRole(rawRole);
  const role = canonicalStaffRole(detailRole);
  return { rawRole, detailRole, role, level: STAFF_ROLE_LEVELS[role] || 0, isStaff: detailRole !== 'player', isOwner: detailRole === 'owner' };
}

function bridgeSnapshot() {
  const bridge = window.JKGamesCenterBridge;
  const legacy = window.JKGamesCottbus3DBridge;
  const player = bridge?.getPlayer?.() || legacy?.getPlayer?.() || null;
  return {
    firstName: String(player?.firstName || 'Spieler'),
    lastName: String(player?.lastName || ''),
    gender: player?.gender === 'female' ? 'female' : 'male',
    level: Math.max(0, Math.floor(Number(player?.level || 0))),
    slot: Math.max(0, Math.floor(Number(player?.slot || 0))),
    centerState: player?.centerState && typeof player.centerState === 'object' ? player.centerState : null
  };
}

function createElement(tag, className, html = '') {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (html) element.innerHTML = html;
  return element;
}

function defaultSaveState() {
  return {
    version: 7,
    position: { x: 0, z: 0, yaw: Math.PI, view: 'third' },
    world: { spawnAssigned: false, spawnIndex: -1, spawnX: 0, spawnZ: 0, renderDistance: 2, density: 'normal', landmarkDensity: 'normal', graphicsQuality: 'medium', shadowMode: 'off', controlsHint: 'auto', shadows: false, onlineEnabled: false },
    day: 1,
    season: 0,
    time: 8.25,
    weather: 'clear',
    weatherUntil: 14,
    weatherRemaining: 5.75,
    needs: { health: 100, hunger: 92, thirst: 90, stamina: 100, warmth: 88 },
    inventory: { wood: 0, firewood: 0, logs: 0, stone: 0, berries: 0, mushrooms: 0, meat: 0, cookedMeat: 0, water: 1, leather: 0, flax: 0, iron: 0, herbs: 0, grain: 0, medicine: 0, coins: 0 },
    tools: { axe: 0, pickaxe: 0, spear: 0, hammer: 0, torch: 0, bow: 0, ironAxe: 0 },
    equippedTool: '',
    ownerAppearance: { skin: 'normal', staffSkinTheme: 'none', aura: false, auraTheme: 'owner', size: 1, heldItem: 'none', heldItemTheme: 'owner', cape: false, capeTheme: 'owner', hat: false, hatTheme: 'owner', vehicle: 'none', scooterTuning: 0, quickForm: 'fox', treeVariant: 0, publicMode: 'staff', publicGender: 'male', publicAlias: 'Center Spieler', staffMaxHealth: 500, staffDamage: 180 },
    keybinds: { ...DEFAULT_KEYBINDS },
    deathLoot: null,
    tutorial: { done: false, step: 'sticks', sticks: 0, stones: 0, berries: 0, mushrooms: 0, treeChopped: false },
    xp: 0,
    skillPoints: 0,
    skills: { survival: 0, forestry: 0, mining: 0, hunting: 0, building: 0, diplomacy: 0, agriculture: 0, crafting: 0 },
    settlement: { name: 'Waldhain', residents: 0, reputation: 0, food: 0, firewood: 0, morale: 70, taxDue: 0, jobs: { woodcutter: 0, farmer: 0, hunter: 0, miner: 0, crafter: 0 } },
    family: { partner: '', affection: 0, heir: '', generation: 1 },
    buildings: [],
    harvested: {},
    completedQuests: [],
    activeQuest: 'tools',
    stats: { trees: 0, rocks: 0, animals: 0, crafted: 0, built: 0, recruited: 0, distance: 0, horsesTamed: 0 },
    discovered: ['Siedlungsplatz'],
    visitedVillages: [],
    landmarkRewards: {},
    encounterHistory: {},
    horseTamed: false,
    lastSavedAt: Date.now()
  };
}

function normalizeSaveState(raw) {
  const base = defaultSaveState();
  if (!raw || typeof raw !== 'object') return base;
  const state = { ...base, ...raw };
  state.position = { ...base.position, ...(raw.position || {}) };
  state.world = { ...base.world, ...(raw.world || {}) };
  state.world.renderDistance = Math.floor(clamp(state.world.renderDistance, MIN_RENDER_DISTANCE, MAX_RENDER_DISTANCE));
  state.world.density = ['low','normal','high'].includes(state.world.density) ? state.world.density : 'normal';
  state.world.landmarkDensity = ['low','normal','high'].includes(state.world.landmarkDensity) ? state.world.landmarkDensity : 'normal';
  state.world.graphicsQuality = GRAPHICS_QUALITIES.includes(state.world.graphicsQuality) ? state.world.graphicsQuality : (state.world.shadows ? 'ultra' : 'medium');
  state.world.shadowMode = SHADOW_MODES.includes(state.world.shadowMode) ? state.world.shadowMode : (state.world.shadows ? 'world' : (state.world.graphicsQuality === 'high' ? 'character' : state.world.graphicsQuality === 'ultra' ? 'world' : 'off'));
  state.world.controlsHint = ['auto','always','hidden'].includes(state.world.controlsHint) ? state.world.controlsHint : 'auto';
  state.world.spawnAssigned = !!state.world.spawnAssigned;
  state.world.shadows = state.world.shadowMode !== 'off';
  state.world.onlineEnabled = !!(raw.world?.onlineEnabled ?? raw.world?.onlineKoop ?? state.world.onlineEnabled);
  delete state.world.onlineKoop;
  state.needs = { ...base.needs, ...(raw.needs || {}) };
  state.inventory = { ...base.inventory, ...(raw.inventory || {}) };
  state.tutorial = { ...base.tutorial, ...(raw.tutorial || {}) };
  state.tutorial.done = !!state.tutorial.done;
  state.tutorial.step = String(state.tutorial.step || 'sticks');
  for (const key of ['sticks','stones','berries','mushrooms']) state.tutorial[key] = Math.max(0, Math.floor(Number(state.tutorial[key]) || 0));
  state.tutorial.treeChopped = !!state.tutorial.treeChopped;
  state.tools = { ...base.tools, ...(raw.tools || {}) };
  state.equippedTool = RECIPES[raw.equippedTool] ? String(raw.equippedTool) : '';
  state.ownerAppearance = { ...base.ownerAppearance, ...(raw.ownerAppearance || {}) };
  const legacyAuraSkin = ['shadow','oaura'].includes(String(state.ownerAppearance.skin||''));
  const legacyGalaxySkin = state.ownerAppearance.skin === 'galaxy' || legacyAuraSkin;
  state.ownerAppearance.skin = legacyGalaxySkin ? 'normal' : state.ownerAppearance.skin;
  state.ownerAppearance.skin = ['normal','ball','crystal','bush','tree','rock','grass',...ANIMAL_FORM_IDS].includes(state.ownerAppearance.skin) ? state.ownerAppearance.skin : 'normal';
  state.ownerAppearance.staffSkinTheme = normalizeStaffTheme(raw.ownerAppearance?.staffSkinTheme ?? (legacyGalaxySkin?'owner':'none'),true);
  state.ownerAppearance.aura = !!(raw.ownerAppearance?.aura ?? legacyAuraSkin);
  const legacyVisualTheme = raw.ownerAppearance?.publicMode === 'admin' ? 'admin' : 'owner';
  state.ownerAppearance.auraTheme = normalizeStaffTheme(raw.ownerAppearance?.auraTheme ?? legacyVisualTheme);
  state.ownerAppearance.heldItemTheme = normalizeStaffTheme(raw.ownerAppearance?.heldItemTheme ?? legacyVisualTheme);
  state.ownerAppearance.capeTheme = normalizeStaffTheme(raw.ownerAppearance?.capeTheme ?? legacyVisualTheme);
  state.ownerAppearance.hatTheme = normalizeStaffTheme(raw.ownerAppearance?.hatTheme ?? legacyVisualTheme);
  state.ownerAppearance.size = clamp(Number(state.ownerAppearance.size) || 1, .45, 2.5);
  state.ownerAppearance.heldItem = ['none','sword','shovel','pickaxe','hoe','axe','staff','torch','hammer','eternalFlame'].includes(state.ownerAppearance.heldItem) ? state.ownerAppearance.heldItem : 'none';
  state.ownerAppearance.cape = !!state.ownerAppearance.cape;
  state.ownerAppearance.hat = !!state.ownerAppearance.hat;
  state.ownerAppearance.vehicle = ['none','scooter','plane'].includes(state.ownerAppearance.vehicle) ? state.ownerAppearance.vehicle : 'none';
  state.ownerAppearance.scooterTuning = Math.floor(clamp(Number(state.ownerAppearance.scooterTuning)||0,0,3));
  state.ownerAppearance.quickForm = ['normal','ball','crystal','bush','tree','rock','grass',...ANIMAL_FORM_IDS].includes(state.ownerAppearance.quickForm) ? state.ownerAppearance.quickForm : 'fox';
  state.ownerAppearance.treeVariant = Math.max(0,Math.floor(Number(state.ownerAppearance.treeVariant)||0))%8;
  state.ownerAppearance.publicMode = ['staff','owner','admin','moderator','supporter','player'].includes(state.ownerAppearance.publicMode) ? state.ownerAppearance.publicMode : 'staff';
  state.ownerAppearance.publicGender = state.ownerAppearance.publicGender === 'female' ? 'female' : 'male';
  state.ownerAppearance.publicAlias = String(state.ownerAppearance.publicAlias || 'Center Spieler').trim().slice(0,30) || 'Center Spieler';
  state.ownerAppearance.staffMaxHealth = Math.floor(clamp(Number(state.ownerAppearance.staffMaxHealth)||500,100,10000));
  state.ownerAppearance.staffDamage = Math.floor(clamp(Number(state.ownerAppearance.staffDamage)||180,10,2500));
  state.horseTamed = !!raw.horseTamed;
  state.keybinds = { ...DEFAULT_KEYBINDS, ...(raw.keybinds || {}) };
  for (const [action, fallback] of Object.entries(DEFAULT_KEYBINDS)) if (!KEYBIND_OPTIONS.includes(state.keybinds[action])) state.keybinds[action] = fallback;
  state.deathLoot = raw.deathLoot && typeof raw.deathLoot === 'object' && Number(raw.deathLoot.expiresAt||0) > Date.now() ? raw.deathLoot : null;
  state.skills = { ...base.skills, ...(raw.skills || {}) };
  state.settlement = { ...base.settlement, ...(raw.settlement || {}) };
  state.settlement.jobs = { ...base.settlement.jobs, ...(raw.settlement?.jobs || {}) };
  state.family = { ...base.family, ...(raw.family || {}) };
  state.landmarkRewards = raw.landmarkRewards && typeof raw.landmarkRewards === 'object' ? raw.landmarkRewards : {};
  state.encounterHistory = raw.encounterHistory && typeof raw.encounterHistory === 'object' ? raw.encounterHistory : {};
  state.stats = { ...base.stats, ...(raw.stats || {}) };
  state.buildings = Array.isArray(raw.buildings) ? raw.buildings.slice(0, 140).filter((entry) => entry && BUILDINGS[entry.type]) : [];
  state.harvested = raw.harvested && typeof raw.harvested === 'object' ? raw.harvested : {};
  state.completedQuests = Array.isArray(raw.completedQuests) ? [...new Set(raw.completedQuests.map(String))].slice(0, 40) : [];
  state.discovered = Array.isArray(raw.discovered) ? [...new Set(raw.discovered.map(String))].slice(0, 250) : ['Siedlungsplatz'];
  state.visitedVillages = Array.isArray(raw.visitedVillages) ? [...new Set(raw.visitedVillages.map(String))].slice(0, 250) : [];
  state.day = Math.max(1, Math.floor(Number(state.day) || 1));
  state.season = Math.floor(clamp(state.season, 0, 3));
  state.time = ((Number(state.time) || 8) % 24 + 24) % 24;
  state.weather = WEATHER[state.weather] ? state.weather : 'clear';
  state.weatherRemaining = Number.isFinite(Number(state.weatherRemaining)) ? clamp(state.weatherRemaining, .5, 12) : 4 + Math.random() * 4;
  const storedHealthCap=Math.floor(clamp(Number(raw.ownerAppearance?.staffMaxHealth)||500,100,10000));
  for (const key of Object.keys(base.needs)) state.needs[key] = clamp(state.needs[key], 0, key==='health'?storedHealthCap:100);
  for (const key of Object.keys(base.inventory)) state.inventory[key] = Math.max(0, Math.floor(Number(state.inventory[key]) || 0));
  for (const key of Object.keys(base.tools)) state.tools[key] = clamp(state.tools[key], 0, 100);
  for (const key of Object.keys(base.skills)) state.skills[key] = Math.floor(clamp(state.skills[key], 0, 5));
  return state;
}

function gaussian(x, z, cx, cz, radius, height) {
  const d = ((x - cx) ** 2 + (z - cz) ** 2) / (radius ** 2);
  return Math.exp(-d * 2.4) * height;
}

function riverCenter(z) {
  return 35 * Math.sin(z * .0095) + 17 * Math.sin(z * .022) - 12;
}

function terrainHeightAt(x, z) {
  const large = Math.sin(x * .00155 + .7) * Math.cos(z * .00125 - .4) * 18;
  const rolling = Math.sin(x * .0063) * 5.5 + Math.cos(z * .0054) * 5 + Math.sin((x + z) * .0038) * 4.2;
  const detail = Math.sin(x * .018 + z * .006) * 1.7 + Math.cos(z * .016 - x * .004) * 1.5;
  let h = large + rolling + detail;
  const mountainCell = 620;
  const gx = Math.floor(x / mountainCell);
  const gz = Math.floor(z / mountainCell);
  for (let dz = -1; dz <= 1; dz += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      const cx = gx + dx, cz = gz + dz;
      const chance = hash2(cx, cz, WORLD_SEED + 91);
      if (chance < .56) continue;
      const px = (cx + .16 + hash2(cx, cz, WORLD_SEED + 113) * .68) * mountainCell;
      const pz = (cz + .16 + hash2(cx, cz, WORLD_SEED + 157) * .68) * mountainCell;
      const radius = 150 + hash2(cx, cz, WORLD_SEED + 191) * 210;
      const height = 28 + hash2(cx, cz, WORLD_SEED + 211) * 72;
      h += gaussian(x, z, px, pz, radius, height);
    }
  }
  const riverDistance = Math.abs(x - riverCenter(z));
  h -= Math.exp(-(riverDistance ** 2) / (24 ** 2)) * 13.5;
  return clamp(h, -9, 112);
}

function makeTerrainGeometry(size = CHUNK_SIZE, segments = 22, originX = 0, originZ = 0) {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const colors = [];
  const indices = [];
  const color = new THREE.Color();
  for (let iz = 0; iz <= segments; iz += 1) {
    const localZ = size * (iz / segments);
    const z = originZ + localZ;
    for (let ix = 0; ix <= segments; ix += 1) {
      const localX = size * (ix / segments);
      const x = originX + localX;
      const y = terrainHeightAt(x, z);
      vertices.push(localX, y, localZ);
      const altitude = clamp((y + 8) / 95, 0, 1);
      if (altitude > .72) color.setHSL(.12, .08, .42 + altitude * .16);
      else color.setHSL(.245 - altitude * .035, .34, .28 + altitude * .12);
      colors.push(color.r, color.g, color.b);
    }
  }
  for (let iz = 0; iz < segments; iz += 1) {
    for (let ix = 0; ix < segments; ix += 1) {
      const a = iz * (segments + 1) + ix;
      const b = a + 1;
      const c = a + segments + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function roundedTexture(title, subtitle = '', options = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = options.width || 512;
  canvas.height = options.height || 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = options.background || 'rgba(23,24,16,.9)';
  ctx.strokeStyle = options.border || '#d1ad63';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(6, 6, canvas.width - 12, canvas.height - 12, 26);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = options.color || '#fff1c9';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${options.titleSize || 34}px system-ui, sans-serif`;
  ctx.fillText(title, canvas.width / 2, subtitle ? canvas.height * .39 : canvas.height / 2, canvas.width - 40);
  if (subtitle) {
    ctx.fillStyle = options.subColor || '#d7b86d';
    ctx.font = `700 ${options.subtitleSize || 20}px system-ui, sans-serif`;
    ctx.fillText(subtitle, canvas.width / 2, canvas.height * .72, canvas.width - 40);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

class CenterDynastyGame {
  constructor() {
    this.overlay = null;
    this.canvas = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.initialized = false;
    this.opened = false;
    this.opening = false;
    this.isMobile = window.matchMedia(MOBILE_QUERY).matches;
    this.performanceTier = detectPerformanceTier(this.isMobile);
    this.perfTaskAt = Object.create(null);
    this.frameCostEma = 0;
    this.performanceScale = 1;
    this.performanceLastAdjustAt = 0;
    const initialPlayer = bridgeSnapshot();
    this.currentSlot = initialPlayer.slot;
    this.state = normalizeSaveState(initialPlayer.centerState);
    this.keys = new Set();
    this.input = { forward: 0, right: 0, sprint: false };
    this.player = null;
    this.modelPivot = null;
    this.flightVisualPivot = null;
    this.playerModel = null;
    this.playerMixer = null;
    this.playerAction = null;
    this.playerWalkAction = null;
    this.playerRunAction = null;
    this.playerActiveAction = null;
    this.playerActionWasMoving = false;
    this.idleBlend = 1;
    this.idleStartedAt = performance.now();
    this.playerBones = {};
    this.actionAnimation = null;
    this.nextPunchSide = 'right';
    this.sprintLockedUntilRelease = false;
    this.npcModelTemplate = null;
    this.npcModelPromise = null;
    this.ownerHeldObject = null;
    this.ownerHeldAnchor = null;
    this.firstPersonHeldObject = null;
    this.firstPersonArmsObject = null;
    this.firstPersonArmsMixer = null;
    this.firstPersonArmsActions = new Map();
    this.firstPersonArmsCurrent = '';
    this.firstPersonArmsReturnTimer = 0;
    this.ownerGalaxySkinTexture = null;
    this.staffSkinTextureCache = new Map();
    this.ownerFormObject = null;
    this.ownerCapeObject = null;
    this.ownerHatObject = null;
    this.ownerPlaneObject = null;
    this.ownerPlaneMixer = null;
    this.ownerPlaneAction = null;
    this.webglContextLost = false;
    this.webglContextRestoreAt = 0;
    this.ownerItemLight = null;
    this.ownerThrownObjects = [];
    this.staffLightningEffects = [];
    this.staffShotSeq = 0;
    this.staffShotAtMs = 0;
    this.staffShotTheme = 'owner';
    this.staffShotEnd = new THREE.Vector3();
    this.staffBeamActive = false;
    this.staffBeamPointerId = null;
    this.staffBeamVisual = null;
    this.staffBeamLastDamageAt = 0;
    this.staffBeamLastPresenceAt = 0;
    this.staffBeamStartedAt = 0;
    this.flightEffects = null;
    this.flightVerticalVelocity = 0;
    this.flightInputMagnitude = 0;
    this.flightLean = 0;
    this.flightRoll = 0;
    this.flightTakeoffTargetY = null;
    this.flightTakeoffActive = false;
    this.deathLootObject = null;
    this.deathScreenOpen = false;
    this.tutorialNodes = [];
    this.collectingTutorialNode = null;
    this.actionCooldownUntil = 0;
    this.warningState = { hunger: false, thirst: false, warmth: false, health: false };
    this.lastSafePosition = new THREE.Vector3(Number(this.state.position.x||0), terrainHeightAt(Number(this.state.position.x||0),Number(this.state.position.z||0)), Number(this.state.position.z||0));
    this.runtimeErrorAt = 0;
    this.animatedFireLights = [];
    this.fallStartY = null;
    this.currentRegion = '';
    this.playerSkin = '';
    this.playerModelInstallToken = 0;
    this.walking = false;
    this.sprinting = false;
    this.motionVelocityX = 0;
    this.motionVelocityY = 0;
    this.motionVelocityZ = 0;
    this.velocityY = 0;
    this.onGround = true;
    this.yaw = Number(this.state.position.yaw || Math.PI);
    this.pitch = -.12;
    this.firstPerson = this.state.position.view === 'first';
    this.lookPointerId = null;
    this.lookLast = { x: 0, y: 0 };
    this.pointerLockBlockedUntil = 0;
    this.pointerLockRequestInFlight = false;
    this.joystickPointerId = null;
    this.joystickCenter = { x: 0, y: 0 };
    this.colliders = [];
    this.collisionBuckets = new Map();
    this.hotspots = [];
    this.resourceNodes = [];
    this.animals = [];
    this.npcs = [];
    this.villageDoors = new Map();
    this.villages = [];
    this.ownBuildingObjects = new Map();
    this.nearestHotspot = null;
    this.buildMode = '';
    this.buildGhost = null;
    this.buildRotation = 0;
    this.panelMode = '';
    this.raf = 0;
    this.lastFrameAt = 0;
    this.lastRenderedAt = 0;
    this.lastHudAt = 0;
    this.lastSaveAt = 0;
    this.lastNeedsAt = 0;
    this.toastTimer = 0;
    this.controlsHintTimer = 0;
    this.controlsHintElement = null;
    this.exitConfirm = null;
    this.rolePollTimer = 0;
    this.bodyOverflow = '';
    this.resizeObserver = null;
    this.loadingManager = new THREE.LoadingManager();
    this.gltfLoader = new GLTFLoader(this.loadingManager);
    this.centerAssetTemplates = new Map();
    this.centerAssetLoadPromise = null;
    // V269: Nur eindeutig bodengebundene Baumgruppen. Group4/5/6 wurden aus dem
    // Pack entfernt, weil sie je nach Export wie schwebende Baum-Wolken erschienen.
    this.natureTreeNames = ['ARVORE_SEM','Branches01','Componen12','Group23','Group27'];
    this.natureCloudNames = [];
    this.ownerScooterObject = null;
    this.scooterTuningBar = null;
    this.lastScooterTuningUiKey = '';
    this.magicSpider = null;
    this.ambientBirds = [];
    this.oceanFish = [];
    this.mountAnimal = null;
    this.mountedHorse = null;
    this.firewoodPickups = [];
    this.remoteModelCache = new Map();
    this.remoteRoleCache = new Map();
    this.remotePlayers = new Map();
    this.onlineFb = null;
    this.onlineUser = null;
    this.onlineDocRef = null;
    this.onlinePresenceRef = null;
    this.onlineStaffPresenceRef = null;
    this.onlinePresenceAvailable = false;
    this.onlineUnsubscribe = null;
    this.presenceSourceDocs = new Map();
    this.onlineRoster = new Map();
    this.onlineHeartbeatTimer = 0;
    this.onlinePublishTimer = 0;
    this.onlineRetryTimer = 0;
    this.onlineRefreshTimer = 0;
    this.onlineRefreshInFlight = false;
    this.onlineRetryAttempt = 0;
    this.onlineCompatibilityMode = false;
    this.onlineConnected = false;
    this.onlineConnecting = false;
    this.onlineSessionId = makeSessionId();
    this.presenceWriteInFlight = false;
    this.presenceWriteQueued = false;
    this.lastPresenceWriteAt = 0;
    this.lastPresenceKey = '';
    this.lastProfilePresenceWriteAt = 0;
    this.lastStaffPresenceWriteAt = 0;
    this.presenceRebuildInFlight = false;
    this.presenceRebuildQueued = false;
    this.isStaffActive = false;
    this.activeStaffRole = 'player';
    this.activeStaffDetailRole = 'player';
    this.staffCapabilities = staffCapabilities('player','player');
    this.isOwnerActive = false;
    this.ownerVerificationChecked = false;
    this.ownerVerifiedByFirebase = false;
    this.verifiedStaffRole = 'player';
    this.verifiedStaffRoleRaw = 'player';
    this.ownerFlags = { vanish: false, god: false, noclip: false, fly: false, speedLevel: 0, speedMultiplier: 1, freezeTime: false };
    this.ownerAura = null;
    this.transformationEffects = [];
    this.wingGeometryTemplate = null;
    this.transformationAutoFly = false;
    this.ownerPanel = null;
    this.ownerPanelBody = null;
    this.ownerMenuButton = null;
    this.tmpVector = new THREE.Vector3();
    this.tmpVector2 = new THREE.Vector3();
    this.tmpQuaternion = new THREE.Quaternion();
    this.tmpQuaternion2 = new THREE.Quaternion();
    this.tmpBox = new THREE.Box3();
    this.worldBounds = { minX: -WORLD_HALF + 8, maxX: WORLD_HALF - 8, minZ: -WORLD_HALF + 8, maxZ: WORLD_HALF - 8 };
    this.chunks = new Map();
    this.chunkUpdateAt = 0;
    this.chunkBuildQueue = [];
    this.chunkBuildBusy = false;
    this.loadedVillageCount = 0;
    this.lastChunkCenter = '';
    this.ensureOpenWorldState();
    this.weatherParticles = null;
    this.seasonMaterials = [];
    this.buildOverlay();
    this.installEntryPoint();
    this.bindGlobalEvents();
  }


  isPublicPlayerMode(){return !!(this.isStaffActive&&['owner','admin'].includes(this.activeStaffRole)&&this.state.ownerAppearance?.publicMode==='player');}
  effectivePublicStaffStyle(){
    if(!this.isStaffActive)return 'player';
    const mode=this.state.ownerAppearance?.publicMode||'staff';
    if(mode==='player'&&['owner','admin'].includes(this.activeStaffRole))return 'player';
    if(this.activeStaffRole==='owner'&&['owner','admin','moderator','supporter'].includes(mode))return mode;
    return staffThemeForDetailedRole(this.activeStaffDetailRole||this.activeStaffRole);
  }
  effectivePublicStaffRole(){const style=this.effectivePublicStaffStyle();return style==='member'?'supporter':style;}
  staffVisualTheme(){return this.effectivePublicStaffStyle()==='player'?'member':this.effectivePublicStaffStyle();}
  allowedCosmeticThemes(){
    if(this.isOwnerActive)return ['owner','admin','moderator','supporter'];
    const theme=staffThemeForDetailedRole(this.activeStaffDetailRole||this.activeStaffRole);
    return ['admin','moderator','supporter'].includes(theme)?[theme]:[];
  }
  effectiveStaffSkinTheme(){
    if(!this.isStaffActive||this.isPublicPlayerMode())return 'none';
    const selected=normalizeStaffTheme(this.state.ownerAppearance?.staffSkinTheme||'none',true);
    if(selected==='none')return 'none';
    return this.allowedCosmeticThemes().includes(selected)?selected:'none';
  }
  appearanceTheme(slot='heldItem'){
    const appearance=this.state.ownerAppearance||{},key=slot==='heldItem'?'heldItemTheme':`${slot}Theme`,value=normalizeStaffTheme(appearance[key]||'owner');
    if(this.isOwnerActive)return value;
    const ownTheme=staffThemeForDetailedRole(this.activeStaffDetailRole||this.activeStaffRole);
    return ['admin','moderator','supporter'].includes(ownTheme)?ownTheme:'member';
  }
  canSeeVanishedStaffRole(role='player'){
    const viewer=canonicalStaffRole(this.activeStaffRole||roleSnapshot().role),target=canonicalStaffRole(role);
    if(viewer==='owner')return target!=='player';
    if(viewer==='admin')return target==='owner'||target==='admin';
    return false;
  }
  effectiveRenderDistance(){
    const requested=Math.floor(clamp(this.state.world?.renderDistance||2,MIN_RENDER_DISTANCE,MAX_RENDER_DISTANCE)),quality=this.state.world?.graphicsQuality||'medium';
    const qualityCap=quality==='minimal'?1:quality==='performance'?1:quality==='low'?2:quality==='medium'?2:quality==='high'?3:quality==='ultra'?4:5;
    const hardwareCap=['maximum','extreme'].includes(quality)?5:(this.performanceTier==='low'?2:this.performanceTier==='balanced'?3:4);
    return Math.max(MIN_RENDER_DISTANCE,Math.min(requested,qualityCap,hardwareCap));
  }
  maxVisibleRemotePlayers(){
    const quality=this.state.world?.graphicsQuality||'medium';
    if(quality==='minimal')return 4;if(quality==='performance')return 6;if(quality==='low')return 9;
    if(quality==='extreme')return MAX_REMOTE_PLAYERS;
    return this.performanceTier==='low'?8:this.performanceTier==='balanced'?12:MAX_REMOTE_PLAYERS;
  }
  performanceDensityFactor(){
    const quality=this.state.world?.graphicsQuality||'medium';
    const q=quality==='minimal'?.22:quality==='performance'?.34:quality==='low'?.56:quality==='medium'?.75:quality==='high'?.9:quality==='ultra'?1:quality==='maximum'?1.18:1.30;
    const h=['maximum','extreme'].includes(quality)?1:(this.performanceTier==='low'?.76:this.performanceTier==='balanced'?.9:1);
    return clamp(q*h,.18,1.32);
  }
  performancePixelRatio(){
    const quality=this.state.world?.graphicsQuality||'medium',device=Math.max(1,Number(window.devicePixelRatio)||1);
    const qualityCap=quality==='minimal'?.40:quality==='performance'?.50:quality==='low'?.68:quality==='medium'?.90:quality==='high'?1.16:quality==='ultra'?1.42:quality==='maximum'?2.0:2.4;
    const hardwareCap=quality==='extreme'?2.4:quality==='maximum'?2.0:(this.performanceTier==='low'?.80:this.performanceTier==='balanced'?1.02:1.34);
    return Math.max(.38,Math.min(device,qualityCap,hardwareCap)*this.performanceScale);
  }
  remoteCosmeticTier(){
    const q=this.state.world?.graphicsQuality||'medium';
    if(q==='minimal'||q==='performance')return 'minimal';
    if(q==='low')return 'low';
    if(q==='medium'||q==='high')return 'medium';
    return 'high';
  }
  effectiveMaxHealth(){
    return this.isStaffActive&&['owner','admin'].includes(this.activeStaffRole)?Math.floor(clamp(Number(this.state.ownerAppearance?.staffMaxHealth)||500,100,10000)):100;
  }
  staffDamageAmount(){
    return Math.floor(clamp(Number(this.state.ownerAppearance?.staffDamage)||180,10,2500));
  }
  runPerfTask(name,now,interval,callback){
    const previous=Number(this.perfTaskAt[name]||0);if(previous&&now-previous<interval)return;this.perfTaskAt[name]=now;const dt=previous?Math.min(.25,Math.max(.001,(now-previous)/1000)):.016;callback(dt);
  }
  recordFrameCost(cost,now){
    this.frameCostEma=this.frameCostEma?this.frameCostEma*.9+cost*.1:cost;if(now-this.performanceLastAdjustAt<3500)return;this.performanceLastAdjustAt=now;
    const old=this.performanceScale;if(this.frameCostEma>27)this.performanceScale=Math.max(.70,this.performanceScale-.08);else if(this.frameCostEma<14)this.performanceScale=Math.min(1,this.performanceScale+.035);
    if(Math.abs(old-this.performanceScale)>.001)this.resize();
  }

  ensureOpenWorldState() {
    this.state.world ||= { spawnAssigned: false, spawnIndex: -1, renderDistance: this.isMobile ? 2 : 3, density: 'normal' };
    this.state.world.renderDistance = Math.floor(clamp(this.state.world.renderDistance || (this.isMobile ? 2 : 3), MIN_RENDER_DISTANCE, MAX_RENDER_DISTANCE));
    this.state.world.density = ['low','normal','high'].includes(this.state.world.density) ? this.state.world.density : 'normal';
    this.state.world.landmarkDensity = ['low','normal','high'].includes(this.state.world.landmarkDensity) ? this.state.world.landmarkDensity : 'normal';
    this.state.world.graphicsQuality = GRAPHICS_QUALITIES.includes(this.state.world.graphicsQuality) ? this.state.world.graphicsQuality : 'medium';
    this.state.world.shadowMode = SHADOW_MODES.includes(this.state.world.shadowMode) ? this.state.world.shadowMode : (this.state.world.graphicsQuality === 'high' ? 'character' : this.state.world.graphicsQuality === 'ultra' ? 'world' : 'off');
    this.state.world.controlsHint = ['auto','always','hidden'].includes(this.state.world.controlsHint) ? this.state.world.controlsHint : 'auto';
    this.state.world.shadows = this.state.world.shadowMode !== 'off';
    this.state.world.onlineEnabled = !!(this.state.world.onlineEnabled ?? this.state.world.onlineKoop);
    delete this.state.world.onlineKoop;
    const needsSpawn = !this.state.world.spawnAssigned;
    if (Number(this.state.version || 0) < 7) this.state.version = 7;
    if (!needsSpawn) return;
    const maxAttempts = 900;
    const randomIndex = Math.floor((crypto?.getRandomValues ? crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296 : Math.random()) * maxAttempts);
    let selected = null;
    for (let offset = 0; offset < maxAttempts; offset += 1) {
      const index = (randomIndex + offset) % maxAttempts;
      const angle = index * 2.399963229728653;
      const radius = 700 + ((index * 977) % 5000);
      const x = clamp(Math.cos(angle) * radius + (hash2(index, 9, WORLD_SEED + 401) - .5) * 260, -WORLD_HALF + 240, WORLD_HALF - 240);
      const z = clamp(Math.sin(angle) * radius + (hash2(index, 17, WORLD_SEED + 433) - .5) * 260, -WORLD_HALF + 240, WORLD_HALF - 240);
      const y = terrainHeightAt(x, z);
      const slope = Math.max(Math.abs(terrainHeightAt(x + 4, z) - y), Math.abs(terrainHeightAt(x, z + 4) - y));
      if (y > -2 && y < 42 && slope < 3.4 && Math.abs(x - riverCenter(z)) > 32) { selected = { x, z, index }; break; }
    }
    selected ||= { x: 0, z: 0, index: 0 };
    this.state.position = { x: Number(selected.x.toFixed(2)), z: Number(selected.z.toFixed(2)), yaw: Math.PI * 2 * hash2(selected.index, 3, WORLD_SEED + 449), view: 'third' };
    this.state.world.spawnAssigned = true;
    this.state.world.spawnIndex = selected.index;
    this.state.world.spawnX = Number(selected.x.toFixed(2));
    this.state.world.spawnZ = Number(selected.z.toFixed(2));
    this.state.version = 7;
    this.state.discovered = ['Unbekannte Wildnis'];
  }

  buildOverlay() {
    const overlay = createElement('section', 'c3d-overlay mdc-overlay is-third-person');
    overlay.id = 'centerDynastyOverlay';
    overlay.hidden = true;
    overlay.setAttribute('aria-label', 'Center – mittelalterliche Dynastie-Welt');
    overlay.innerHTML = `
      <div class="c3d-stage"><canvas aria-label="Center 3D-Spielwelt" tabindex="0"></canvas></div>
      <div class="c3d-vignette"></div><div class="mdc-danger-vignette" aria-hidden="true"></div><div class="c3d-crosshair" aria-hidden="true"></div>
      <header class="c3d-topbar mdc-topbar">
        <div class="mdc-world-status"><span data-mdc-season>🌱 Frühling</span><span data-mdc-daytime>Tag 1 · 08:15</span><span data-mdc-weather>☀ Klar</span></div>
        <div class="c3d-top-actions">
          <button class="c3d-icon-button mdc-owner-menu-button" type="button" data-mdc-owner-menu title="Team-Menü (Punkt)">◆</button>
          <button class="c3d-icon-button" type="button" data-mdc-menu title="Center-Menü öffnen oder schließen">☰</button>
          <button class="c3d-icon-button" type="button" data-c3d-close title="Center verlassen">×</button>
        </div>
      </header>
      <div class="mdc-needs" data-mdc-needs></div>
      <aside class="mdc-quest-card" data-mdc-quest></aside>
      <div class="mdc-compass"><span>W</span><strong data-mdc-compass>N</strong><span>O</span></div>
      <canvas class="mdc-minimap" data-mdc-minimap width="220" height="220"></canvas>
      <div class="c3d-loading mdc-loading" data-c3d-loading>
        <div class="c3d-loading-card">
          <div class="mdc-loading-scene"><i class="mountain one"></i><i class="mountain two"></i><i class="hut"></i><i class="tree a"></i><i class="tree b"></i><i class="tree c"></i></div>
          <span class="c3d-loading-emblem">JK</span><small>JK.GAMES · CENTER ONLINE</small>
          <h2>Das Grenztal entsteht</h2><p data-c3d-loading-text>Berge, Dörfer und Wälder werden vorbereitet.</p>
          <div class="c3d-loading-online"><i></i><span data-c3d-online-status>Online-Verbindung wird vorbereitet …</span></div>
          <div class="c3d-loading-bar"><span data-c3d-loading-bar></span></div>
        </div>
      </div>
      <aside class="c3d-side-panel mdc-panel" data-c3d-panel>
        <header><div><small data-c3d-panel-kicker>VERWALTUNG</small><h2 data-c3d-panel-title>Dynastie</h2></div><button class="c3d-icon-button" type="button" data-c3d-panel-close>×</button></header>
        <div data-c3d-panel-body></div>
      </aside>
      <aside class="mdc-owner-panel" data-mdc-owner-panel aria-hidden="true">
        <header><div><small>TEAM · CENTER-KONTROLLE</small><h2>Weltensteuerung</h2></div><button class="c3d-icon-button" type="button" data-mdc-owner-close>×</button></header>
        <div class="mdc-owner-panel-body" data-mdc-owner-body></div>
      </aside>
      <button class="c3d-interact mdc-interact" type="button" data-c3d-interact><kbd>E</kbd><span data-c3d-interact-label>Untersuchen</span></button>
      <div class="mdc-build-actions" data-mdc-build-actions hidden><button type="button" data-mdc-build-rotate>↻ Drehen</button><button type="button" data-mdc-build-place>✓ Bauen</button><button type="button" data-mdc-build-cancel>× Abbrechen</button></div>
      <div class="mdc-scooter-tuning" data-mdc-scooter-tuning hidden></div>
      <div class="mdc-hotbar" data-mdc-hotbar></div>
      <div class="c3d-controls-hint mdc-controls-hint" aria-hidden="true"><span><kbd>WASD</kbd> Laufen</span><span><kbd>Shift</kbd> Sprint</span><span><kbd>Space</kbd> Springen</span><span><kbd>E</kbd> Interagieren</span><span><kbd>M</kbd> Center-Menü</span><span><kbd>C</kbd> Herstellen</span></div>
      <div class="c3d-mobile-controls mdc-mobile-controls">
        <div class="c3d-joystick" data-c3d-joystick><span class="c3d-joystick-knob" data-c3d-joystick-knob></span></div>
        <div class="c3d-mobile-actions"><button type="button" data-c3d-attack>⚔</button><button type="button" data-c3d-perspective>◉</button><button type="button" data-c3d-jump>↑</button><button type="button" data-c3d-sprint>»</button><button type="button" data-mdc-mobile-menu>☰</button><button type="button" data-mdc-mobile-build>⌂</button></div>
      </div>
      <div class="c3d-toast" data-c3d-toast></div>
      <div class="mdc-death-screen" data-mdc-death-screen hidden>
        <div role="dialog" aria-modal="true" aria-labelledby="mdcDeathTitle">
          <small>DU BIST GESTORBEN</small><h2 id="mdcDeathTitle">Deine Ausrüstung liegt am Todesort.</h2>
          <p>Der Loot bleibt zehn Minuten erhalten und wird auf Karte und Minikarte markiert.</p>
          <div><button type="button" data-mdc-death-respawn>Wiederbeleben</button><button type="button" data-mdc-death-leave>Spiel beenden</button></div>
        </div>
      </div>
      <div class="mdc-exit-confirm" data-mdc-exit-confirm hidden>
        <div role="dialog" aria-modal="true" aria-labelledby="mdcExitTitle">
          <small>CENTER VERLASSEN</small><h2 id="mdcExitTitle">Möchtest du das Spiel wirklich verlassen?</h2>
          <p>Dein aktueller Center-Spielstand wird vorher gespeichert.</p>
          <div><button type="button" data-mdc-exit-stay>Weiterspielen</button><button type="button" data-mdc-exit-leave>Spiel verlassen</button></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    this.overlay = overlay;
    this.canvas = overlay.querySelector('canvas');
    this.loading = overlay.querySelector('[data-c3d-loading]');
    this.loadingText = overlay.querySelector('[data-c3d-loading-text]');
    this.loadingBar = overlay.querySelector('[data-c3d-loading-bar]');
    this.panel = overlay.querySelector('[data-c3d-panel]');
    this.panelKicker = overlay.querySelector('[data-c3d-panel-kicker]');
    this.panelTitle = overlay.querySelector('[data-c3d-panel-title]');
    this.panelBody = overlay.querySelector('[data-c3d-panel-body]');
    this.interactButton = overlay.querySelector('[data-c3d-interact]');
    this.interactLabel = overlay.querySelector('[data-c3d-interact-label]');
    this.locationLabel = overlay.querySelector('[data-c3d-location]');
    this.viewLabel = overlay.querySelector('[data-c3d-view-label]');
    this.onlineCard = overlay.querySelector('[data-c3d-online-card]');
    this.onlineCount = overlay.querySelector('[data-c3d-online-count]');
    this.onlineStatus = overlay.querySelector('[data-c3d-online-status]');
    this.loadingOnline = this.onlineStatus?.closest('.c3d-loading-online') || null;
    this.toastElement = overlay.querySelector('[data-c3d-toast]');
    this.joystick = overlay.querySelector('[data-c3d-joystick]');
    this.joystickKnob = overlay.querySelector('[data-c3d-joystick-knob]');
    this.sprintButton = overlay.querySelector('[data-c3d-sprint]');
    this.minimap = overlay.querySelector('[data-mdc-minimap]');
    this.needsElement = overlay.querySelector('[data-mdc-needs]');
    this.questElement = overlay.querySelector('[data-mdc-quest]');
    this.hotbarElement = overlay.querySelector('[data-mdc-hotbar]');
    this.scooterTuningBar = overlay.querySelector('[data-mdc-scooter-tuning]');
    this.buildActions = overlay.querySelector('[data-mdc-build-actions]');
    this.seasonLabel = overlay.querySelector('[data-mdc-season]');
    this.dayTimeLabel = overlay.querySelector('[data-mdc-daytime]');
    this.dayLabel = null;
    this.timeLabel = null;
    this.weatherLabel = overlay.querySelector('[data-mdc-weather]');
    this.regionLabel = null;
    this.compassLabel = overlay.querySelector('[data-mdc-compass]');
    this.ownerPanel = overlay.querySelector('[data-mdc-owner-panel]');
    this.ownerPanelBody = overlay.querySelector('[data-mdc-owner-body]');
    this.ownerMenuButton = overlay.querySelector('[data-mdc-owner-menu]');
    this.controlsHintElement = overlay.querySelector('.mdc-controls-hint');
    this.exitConfirm = overlay.querySelector('[data-mdc-exit-confirm]');
    this.deathScreen = overlay.querySelector('[data-mdc-death-screen]');

    overlay.querySelector('[data-c3d-close]').addEventListener('click', () => this.openExitConfirmation());
    overlay.querySelector('[data-mdc-exit-stay]').addEventListener('click', () => this.closeExitConfirmation());
    overlay.querySelector('[data-mdc-exit-leave]').addEventListener('click', () => { this.closeExitConfirmation(); this.close(); });
    overlay.querySelector('[data-mdc-death-respawn]').addEventListener('click', () => this.respawnFromDeath());
    overlay.querySelector('[data-mdc-death-leave]').addEventListener('click', () => { this.hideDeathScreen(); this.close(); });
    overlay.querySelector('[data-c3d-panel-close]').addEventListener('click', () => this.closePanel());
    overlay.querySelector('[data-mdc-owner-close]').addEventListener('click', () => this.closeOwnerMenu());
    this.ownerMenuButton.addEventListener('click', () => this.toggleOwnerMenu());
    this.ownerPanelBody.addEventListener('click', (event) => this.handleOwnerAction(event));
    this.ownerPanelBody.addEventListener('input', (event) => this.handleOwnerInput(event));
    this.ownerPanelBody.addEventListener('change', (event) => this.handleKeybindChange(event));
    this.panelBody.addEventListener('change', (event) => this.handleKeybindChange(event));
    overlay.querySelector('[data-mdc-menu]').addEventListener('click', () => this.toggleManagement('overview'));
    overlay.querySelector('[data-mdc-mobile-menu]').addEventListener('click', () => this.toggleManagement('overview'));
    overlay.querySelector('[data-mdc-mobile-build]').addEventListener('click', () => this.toggleManagement('building'));
    overlay.querySelector('[data-c3d-perspective]').addEventListener('click', () => this.togglePerspective());
    overlay.querySelector('[data-c3d-jump]').addEventListener('pointerdown', (event) => { event.preventDefault(); this.requestJump(); });
    this.attackButton = overlay.querySelector('[data-c3d-attack]');
    this.attackButton.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      if(this.canCastStaffLightning()) this.beginStaffBeam(event.pointerId);
      else this.performPrimaryAction();
    });
    const stopMobileStaffBeam=(event)=>{if(this.staffBeamActive&&(this.staffBeamPointerId==null||event?.pointerId===this.staffBeamPointerId))this.endStaffBeam();};
    this.attackButton.addEventListener('pointerup',stopMobileStaffBeam);
    this.attackButton.addEventListener('pointercancel',stopMobileStaffBeam);
    this.attackButton.addEventListener('lostpointercapture',stopMobileStaffBeam);
    this.sprintButton.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      if(this.sprintLockedUntilRelease||this.state.needs.stamina<=2){this.input.sprint=false;this.sprintButton.classList.remove('is-active');this.toast('Ausdauer erschöpft. Sprint erneut aktivieren, sobald sie sich erholt hat.');return;}
      this.input.sprint = !this.input.sprint;
      this.sprintButton.classList.toggle('is-active', this.input.sprint);
    });
    this.interactButton.addEventListener('click', () => this.buildMode ? this.placeBuilding() : this.activateNearestHotspot());
    overlay.querySelector('[data-mdc-build-rotate]').addEventListener('click', () => this.rotateBuildGhost());
    overlay.querySelector('[data-mdc-build-place]').addEventListener('click', () => this.placeBuilding());
    overlay.querySelector('[data-mdc-build-cancel]').addEventListener('click', () => this.cancelBuildMode());
    this.panelBody.addEventListener('click', (event) => this.handlePanelAction(event));
    this.hotbarElement.addEventListener('click', (event) => {
      const action = event.target.closest?.('[data-mdc-use]')?.dataset.mdcUse;
      if (action) this.useItem(action);
    });
    this.scooterTuningBar?.addEventListener('click',(event)=>{const button=event.target.closest?.('[data-scooter-tuning]');if(!button)return;const value=Math.floor(clamp(Number(button.dataset.scooterTuning)||0,0,3));this.state.ownerAppearance.scooterTuning=value;this.saveState(true);this.renderScooterTuningBar();this.toast(`🛴 Scooter ${value?`Tuning ${value}`:'Standard'} · ${[40,80,120,150][value]} km/h`);});
    this.bindLookControls();
    this.bindJoystick();
    this.renderHud(true);
  }

  installEntryPoint() {
    let queued = false;
    const ensure = () => {
      queued = false;
      const entry = document.querySelector('[data-c3d-open].c3d-central-entry') || [...document.querySelectorAll('.dashboard-shortcut')].find((button) => /center|zentrale/i.test(button.textContent || ''));
      if (!entry) return;
      entry.dataset.c3dOpen = '';
      entry.classList.remove('upcoming');
      entry.disabled = false;
      entry.removeAttribute('disabled');
      entry.setAttribute('aria-label', 'Center – riesige Open World betreten');
      entry.title = 'Center – riesige Open World betreten';
      const label = entry.querySelector('span');
      const icon = entry.querySelector('b');
      if (label) label.textContent = 'Center';
      if (icon) icon.textContent = '♜';
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(ensure); } };
    document.addEventListener('click', (event) => {
      const entry = event.target.closest?.('[data-c3d-open]');
      if (!entry) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      this.open();
    }, true);
    queue();
    this.entryObserver = new MutationObserver(queue);
    this.entryObserver.observe(document.body, { childList: true, subtree: true });
  }

  bindGlobalEvents() {
    window.addEventListener('resize', () => { this.isMobile = window.matchMedia(MOBILE_QUERY).matches; if (this.opened) this.resize(); });
    document.addEventListener('keydown', (event) => {
      if (!this.opened || isEditableTarget(event.target)) return;
      const blocked = [...new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','ControlLeft','ControlRight','Space','KeyV','KeyE','KeyM','KeyB','KeyC','KeyI','KeyR','Period','NumpadDecimal',...Object.values(this.state.keybinds||{})])];
      if (blocked.includes(event.code)) event.preventDefault();
      this.keys.add(event.code);
      const binds=this.state.keybinds||DEFAULT_KEYBINDS;
      if (event.code === binds.staffMenu && !event.repeat) { this.toggleOwnerMenu(); return; }
      if (event.code === binds.jump && !event.repeat) this.requestJump();
      if (event.code === binds.perspective && !event.repeat) this.togglePerspective();
      if (event.code === binds.interact && !event.repeat) this.buildMode ? this.placeBuilding() : this.activateNearestHotspot();
      if (event.code === binds.overview && !event.repeat) { this.toggleManagement('overview'); return; }
      if (event.code === binds.inventory && !event.repeat) { this.toggleManagement('inventory'); return; }
      if (event.code === binds.crafting && !event.repeat) { this.toggleManagement('crafting'); return; }
      if (event.code === binds.building && !event.repeat) { this.toggleManagement('building'); return; }
      if (!event.repeat && this.isStaffActive && event.code===binds.vanish && this.canStaff('vanish')) { this.toggleStaffFlag('vanish'); return; }
      if (!event.repeat && this.isStaffActive && event.code===binds.god && this.canStaff('god')) { this.toggleStaffFlag('god'); return; }
      if (!event.repeat && this.isStaffActive && event.code===binds.fly && this.canStaff('fly')) { this.toggleStaffFlag('fly'); return; }
      if (!event.repeat && this.isStaffActive && event.code===binds.transform && (this.staffCapabilities?.forms||[]).length>1) { this.activateQuickTransformation(); return; }
      if (event.code === 'KeyR' && !event.repeat && this.buildMode) this.rotateBuildGhost();
      if (event.code === 'Escape') {
        if (this.exitConfirm && !this.exitConfirm.hidden) this.closeExitConfirmation();
        else if (this.ownerPanel?.classList.contains('is-open')) this.closeOwnerMenu();
        else if (this.buildMode) this.cancelBuildMode();
        else if (this.panel.classList.contains('is-open')) this.closePanel();
        else if (document.pointerLockElement === this.canvas) { document.exitPointerLock?.(); this.openExitConfirmation(); }
        else this.openExitConfirmation();
      }
    }, true);
    document.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
      if(event.code==='ShiftLeft'||event.code==='ShiftRight')this.releaseSprintLockIfReady();
    }, true);
    const resumeCenterOnline = (delay=450) => {
      if(!this.opened||!this.state.world?.onlineEnabled||navigator.onLine===false)return;
      this.setOnlineUi('connecting','Online-Verbindung wird wiederhergestellt …',1+this.remotePlayers.size);
      window.LifeBuilderFirebaseCore?.reconnect?.({force:false}).catch(()=>{});
      this.clearOnlineReconnect();
      this.onlineRetryTimer=setTimeout(()=>{
        this.onlineRetryTimer=0;
        if(this.opened&&this.state.world?.onlineEnabled&&!this.onlineConnected&&!this.onlineConnecting)this.connectMultiplayer().catch(()=>{});
      },Math.max(150,Number(delay)||450));
    };
    window.addEventListener('pagehide', () => { this.saveState(true); this.disconnectMultiplayer().catch(() => {}); });
    window.addEventListener('pageshow', () => resumeCenterOnline(550));
    window.addEventListener('online', () => resumeCenterOnline(300));
    document.addEventListener('visibilitychange', () => {
      if(document.hidden&&this.opened)this.saveState(true);
      else if(!document.hidden)resumeCenterOnline(700);
    });
    document.addEventListener('pointerlockchange', () => {
      this.pointerLockRequestInFlight = false;
      if (this.opened && document.pointerLockElement !== this.canvas) this.pointerLockBlockedUntil = performance.now() + 1800;
    });
    document.addEventListener('pointerlockerror', () => {
      this.pointerLockRequestInFlight = false;
      this.pointerLockBlockedUntil = performance.now() + 2200;
    });
  }

  safeRequestPointerLock() {
    if (!this.opened || this.isMobile || !this.canvas || document.pointerLockElement === this.canvas || this.pointerLockRequestInFlight) return;
    if (this.panel?.classList.contains('is-open') || this.ownerPanel?.classList.contains('is-open') || (this.exitConfirm && !this.exitConfirm.hidden)) return;
    if (performance.now() < this.pointerLockBlockedUntil) return;
    if (!document.hasFocus() || document.visibilityState !== 'visible') return;
    this.pointerLockRequestInFlight = true;
    let request;
    try {
      request = this.canvas.requestPointerLock?.();
    } catch (error) {
      this.pointerLockRequestInFlight = false;
      this.pointerLockBlockedUntil = performance.now() + 2200;
      if (String(error?.name || '') !== 'SecurityError') console.warn('Pointer-Lock konnte nicht aktiviert werden', error);
      return;
    }
    Promise.resolve(request).catch((error) => {
      this.pointerLockBlockedUntil = performance.now() + 2200;
      if (String(error?.name || '') !== 'SecurityError') console.warn('Pointer-Lock konnte nicht aktiviert werden', error);
    }).finally(() => {
      this.pointerLockRequestInFlight = false;
    });
  }

  bindLookControls() {
    const start = (event) => {
      if (!this.opened || event.target.closest?.('button,.c3d-side-panel,.mdc-owner-panel,.mdc-needs,.mdc-quest-card,.mdc-hotbar,.mdc-minimap,.c3d-topbar')) return;
      if (this.isMobile) {
        this.lookPointerId = event.pointerId;
        this.lookLast = { x: event.clientX, y: event.clientY };
        this.canvas.setPointerCapture?.(event.pointerId);
      } else if (event.button === 0) {
        if (document.pointerLockElement === this.canvas) {
          if(this.canCastStaffLightning()) this.beginStaffBeam(event.pointerId);
          else this.performPrimaryAction();
        } else this.safeRequestPointerLock();
      }
    };
    const move = (event) => {
      if (!this.opened) return;
      if (!this.isMobile && document.pointerLockElement === this.canvas) {
        this.applyLookDelta(event.movementX, event.movementY, .00225);
      } else if (this.isMobile && event.pointerId === this.lookPointerId) {
        const dx = event.clientX - this.lookLast.x;
        const dy = event.clientY - this.lookLast.y;
        this.lookLast = { x: event.clientX, y: event.clientY };
        this.applyLookDelta(dx, dy, .0053);
      }
    };
    const end = (event) => {
      if (event.pointerId === this.lookPointerId) this.lookPointerId = null;
      if(this.staffBeamActive&&(this.staffBeamPointerId==null||event.pointerId===this.staffBeamPointerId))this.endStaffBeam();
    };
    this.canvas.addEventListener('pointerdown', start);
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerup', end, { passive: true });
    document.addEventListener('pointercancel', end, { passive: true });
    window.addEventListener('blur',()=>this.endStaffBeam(true));
  }

  bindJoystick() {
    const update = (clientX, clientY) => {
      const dx = clientX - this.joystickCenter.x;
      const dy = clientY - this.joystickCenter.y;
      const radius = Math.max(34, this.joystick.getBoundingClientRect().width * .36);
      const distance = Math.hypot(dx, dy) || 1;
      const factor = Math.min(1, distance / radius);
      const nx = dx / distance * factor;
      const ny = dy / distance * factor;
      this.input.right = nx;
      this.input.forward = -ny;
      this.joystickKnob.style.transform = `translate(${nx * radius}px,${ny * radius}px)`;
    };
    const reset = () => { this.input.right = 0; this.input.forward = 0; this.joystickKnob.style.transform = 'translate(0,0)'; this.joystickPointerId = null; };
    this.joystick.addEventListener('pointerdown', (event) => {
      if (!this.opened) return;
      event.preventDefault();
      const rect = this.joystick.getBoundingClientRect();
      this.joystickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      this.joystickPointerId = event.pointerId;
      this.joystick.setPointerCapture?.(event.pointerId);
      update(event.clientX, event.clientY);
    });
    this.joystick.addEventListener('pointermove', (event) => { if (event.pointerId === this.joystickPointerId) update(event.clientX, event.clientY); });
    this.joystick.addEventListener('pointerup', (event) => { if (event.pointerId === this.joystickPointerId) reset(); });
    this.joystick.addEventListener('pointercancel', reset);
  }

  applyLookDelta(dx, dy, sensitivity) {
    this.yaw -= dx * sensitivity;
    const vertical = this.firstPerson ? -dy : dy;
    this.pitch = clamp(this.pitch + vertical * sensitivity, -1.05, .62);
  }

  openExitConfirmation() {
    if (!this.opened || !this.exitConfirm) return;
    if (document.pointerLockElement === this.canvas) document.exitPointerLock?.();
    this.keys.clear();
    this.exitConfirm.hidden = false;
    this.overlay.classList.add('is-exit-confirm-open');
    this.exitConfirm.querySelector('[data-mdc-exit-stay]')?.focus?.({ preventScroll: true });
  }

  closeExitConfirmation() {
    if (!this.exitConfirm) return;
    this.exitConfirm.hidden = true;
    this.overlay?.classList.remove('is-exit-confirm-open');
    this.canvas?.focus?.({ preventScroll: true });
  }

  scheduleControlsHint(force = false) {
    clearTimeout(this.controlsHintTimer);clearTimeout(this.firstPersonArmsReturnTimer);
    if (!this.controlsHintElement) return;
    const mode = this.state.world?.controlsHint || 'auto';
    const visible = force || mode !== 'hidden';
    this.controlsHintElement.classList.toggle('is-hidden', !visible);
    if (visible && mode === 'auto' && !force) {
      this.controlsHintTimer = setTimeout(() => this.controlsHintElement?.classList.add('is-hidden'), CONTROLS_HINT_DURATION_MS);
    }
  }

  async open() {
    if (this.opened || this.opening) return;
    this.reloadLatestSave();
    this.opening = true;
    this.opened = true;
    this.bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    this.overlay.hidden = false;
    this.loading.classList.remove('is-hidden');
    this.loading.querySelector('h2').textContent = 'Die Open World entsteht';
    this.setLoading(4, 'Dein persönlicher Spawnpunkt und die ersten Weltregionen werden vorbereitet.');
    if(this.state.world?.onlineEnabled)this.setOnlineUi('connecting','Online-Verbindung wird aufgebaut …',1);
    const onlinePreparation = this.state.world?.onlineEnabled ? this.prepareMultiplayer() : Promise.resolve(null);
    const started = performance.now();
    try {
      await nextPaint();
      if (!this.initialized) await this.initialize();
      else await this.ensureCorrectPlayerModel();
      this.restoreStateToWorld();
      this.resize();
      this.setLoading(94, 'Bewohner und Online-Spieler werden verbunden.');
      const prepared = await Promise.race([onlinePreparation, wait(2200).then(() => null)]);
      await wait(Math.max(0, 2500 - (performance.now() - started)));
      this.setLoading(100, 'Deine Open World ist bereit.');
      await wait(150);
      this.loading.classList.add('is-hidden');
      this.lastFrameAt = performance.now();
      this.lastRenderedAt = 0;
      this.lastNeedsAt = performance.now();
      this.startLoop();
      this.scheduleControlsHint();
      this.canvas.focus({ preventScroll: true });
      this.toast('Du bist an einem einzigartigen Ort gespawnt. Erkunde Wälder, Wege, Berge und Dörfer.');
      this.startRolePolling();
      if (this.state.world?.onlineEnabled && prepared) this.connectMultiplayer(prepared).catch(() => {});
      else if (this.state.world?.onlineEnabled) onlinePreparation.then((late) => { if (this.opened && late) this.connectMultiplayer(late).catch(() => {}); else if (this.opened) this.scheduleOnlineReconnect('Online ist aktiviert. Firebase wird noch vorbereitet.',3500); }).catch(() => this.scheduleOnlineReconnect('Online ist aktiviert. Firebase wird erneut vorbereitet.',3500));
      else this.setOnlineUi('offline', 'Online ist in den Einstellungen ausgeschaltet.', 1);
    } catch (error) {
      console.error('Center-Dynastie konnte nicht gestartet werden', error);
      this.setLoading(100, `Center konnte nicht geladen werden: ${error?.message || error}`);
      this.loading.querySelector('h2').textContent = 'Center nicht verfügbar';
    } finally {
      this.opening = false;
    }
  }

  close() {
    if (!this.opened) return;
    this.saveState(true);
    this.endStaffBeam(true);
    clearTimeout(this.controlsHintTimer);clearTimeout(this.firstPersonArmsReturnTimer);
    this.closeExitConfirmation();
    this.disconnectMultiplayer().catch(() => {});
    this.opened = false;
    this.opening = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.keys.clear();
    this.input.forward = 0;
    this.input.right = 0;
    this.input.sprint = false;
    this.sprintButton.classList.remove('is-active');
    this.cancelBuildMode();
    this.dismountHorse(true);
    this.closeOwnerMenu();
    this.closePanel();
    if (document.pointerLockElement === this.canvas) document.exitPointerLock?.();
    this.overlay.hidden = true;
    if(this.scooterTuningBar)this.scooterTuningBar.hidden=true;
    document.body.style.overflow = this.bodyOverflow;
    clearInterval(this.rolePollTimer);
    this.rolePollTimer = 0;
    for(const effect of this.transformationEffects.splice(0))this.disposeTransformationEffect(effect);
  }

  async initialize() {
    this.setLoading(10, 'WebGL, Himmel und Beleuchtung werden aufgebaut.');
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(SEASONS[this.state.season].fog, .00165);
    this.camera = new THREE.PerspectiveCamera(62, 1, .08, 1800);
    this.camera.rotation.order = 'YXZ';
    this.scene.add(this.camera);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, powerPreference: 'high-performance', alpha: false });
    this.canvas.addEventListener('webglcontextlost',(event)=>{event.preventDefault();this.webglContextLost=true;this.webglContextRestoreAt=performance.now();console.warn('Center WebGL-Kontext kurzzeitig verloren – Rendering wird bis zur Wiederherstellung pausiert.');},{passive:false});
    this.canvas.addEventListener('webglcontextrestored',()=>{this.webglContextLost=false;this.webglContextRestoreAt=performance.now();this.renderer?.resetState?.();this.refreshSceneMaterialsAfterContextRestore();console.info('Center WebGL-Kontext wiederhergestellt.');});
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.shadowMap.enabled = this.state.world?.shadowMode !== 'off';
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.buildSkyAndLights();
    await nextPaint();
    this.setLoading(20, 'Neue Center-Assets, Tiere, Werkzeuge und Natur werden geladen.');
    await this.prepareCenterAssetTemplates();
    this.installNatureClouds();
    this.setLoading(27, 'Die endlose Welt wird in dynamische Regionen aufgeteilt.');
    await this.prepareNpcWhiteTemplate();
    this.initializeStreamingWorld();
    this.buildWater();
    this.buildOceanZone();
    await nextPaint();
    this.setLoading(48, 'Der persönliche Spawnpunkt wird vorbereitet.');
    this.buildSavedSettlement();
    this.buildPlayerRoot();
    this.restoreStateToWorld();
    this.buildWildlife();
    this.spawnMagicSpider();
    this.spawnAmbientBirds();
    this.spawnOceanFish();
    await this.updateChunkStreaming(true);
    this.buildStarterTutorialNodes();
    await nextPaint();
    this.setLoading(70, 'Wälder, Dörfer, Wege und Berge werden in Sichtweite erzeugt.');
    await this.ensureCorrectPlayerModel();
    this.buildWeatherParticles();
    this.applySeasonVisuals(true);
    this.applyWorldRenderSettings(true);
    this.applyGraphicsQuality();
    this.initialized = true;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.overlay);
    this.setLoading(88, `Performanceprofil ${this.performanceTier} · Streaming und Online-System werden aktiviert.`);
  }


  sanitizeLegacySpecGlossGlb(buffer){
    try{
      const bytes=new Uint8Array(buffer);if(bytes.length<20)return buffer;const view=new DataView(buffer);if(view.getUint32(0,true)!==0x46546c67)return buffer;
      const chunks=[];let offset=12,jsonIndex=-1;
      while(offset+8<=bytes.length){const len=view.getUint32(offset,true),type=view.getUint32(offset+4,true);offset+=8;if(offset+len>bytes.length)return buffer;const data=bytes.slice(offset,offset+len);if(type===0x4e4f534a)jsonIndex=chunks.length;chunks.push({type,data});offset+=len;}
      if(jsonIndex<0)return buffer;const decoder=new TextDecoder(),encoder=new TextEncoder(),jsonText=decoder.decode(chunks[jsonIndex].data).replace(/\u0000+$/,'').trim();const gltf=JSON.parse(jsonText);let touched=false;
      if(Array.isArray(gltf.extensionsUsed)){const next=gltf.extensionsUsed.filter((id)=>id!=='KHR_materials_pbrSpecularGlossiness');if(next.length!==gltf.extensionsUsed.length){gltf.extensionsUsed=next;touched=true;}}
      if(Array.isArray(gltf.extensionsRequired)){const next=gltf.extensionsRequired.filter((id)=>id!=='KHR_materials_pbrSpecularGlossiness');if(next.length!==gltf.extensionsRequired.length){gltf.extensionsRequired=next;touched=true;}}
      for(const material of gltf.materials||[]){const ext=material?.extensions?.KHR_materials_pbrSpecularGlossiness;if(!ext)continue;material.pbrMetallicRoughness=material.pbrMetallicRoughness||{};if(ext.diffuseFactor&&!material.pbrMetallicRoughness.baseColorFactor)material.pbrMetallicRoughness.baseColorFactor=ext.diffuseFactor;if(ext.diffuseTexture&&!material.pbrMetallicRoughness.baseColorTexture)material.pbrMetallicRoughness.baseColorTexture=ext.diffuseTexture;if(Number.isFinite(ext.glossinessFactor)&&material.pbrMetallicRoughness.roughnessFactor===undefined)material.pbrMetallicRoughness.roughnessFactor=clamp(1-ext.glossinessFactor,0.04,1);delete material.extensions.KHR_materials_pbrSpecularGlossiness;if(!Object.keys(material.extensions).length)delete material.extensions;touched=true;}
      if(!touched)return buffer;
      const encoded=encoder.encode(JSON.stringify(gltf)),padded=(encoded.length+3)&~3,jsonData=new Uint8Array(padded);jsonData.fill(0x20);jsonData.set(encoded);chunks[jsonIndex]={type:0x4e4f534a,data:jsonData};
      const total=12+chunks.reduce((sum,c)=>sum+8+c.data.length,0),out=new ArrayBuffer(total),outBytes=new Uint8Array(out),outView=new DataView(out);outView.setUint32(0,0x46546c67,true);outView.setUint32(4,2,true);outView.setUint32(8,total,true);let pos=12;for(const chunk of chunks){outView.setUint32(pos,chunk.data.length,true);outView.setUint32(pos+4,chunk.type,true);pos+=8;outBytes.set(chunk.data,pos);pos+=chunk.data.length;}return out;
    }catch{return buffer;}
  }

  async loadCenterGltf(url){
    const response=await fetch(url,{cache:'force-cache'});if(!response.ok)throw new Error(`Center-Asset HTTP ${response.status}: ${url}`);let buffer=await response.arrayBuffer();buffer=this.sanitizeLegacySpecGlossGlb(buffer);return await this.gltfLoader.parseAsync(buffer,new URL(url,location.href).href.replace(/[^/]*$/,''));
  }

  async prepareCenterAssetTemplates() {
    if(this.centerAssetLoadPromise)return this.centerAssetLoadPromise;
    this.centerAssetLoadPromise=(async()=>{
      const entries=Object.entries(CENTER_ASSET_PATHS);
      const loaded=await Promise.allSettled(entries.map(async([key,url])=>{
        const gltf=await this.loadCenterGltf(url);
        gltf.scene.updateMatrixWorld(true);
        this.centerAssetTemplates.set(key,{root:gltf.scene,animations:gltf.animations||[],url});
        return key;
      }));
      const failed=loaded.filter((entry)=>entry.status==='rejected');
      if(failed.length)console.warn(`Center-Assetpaket: ${failed.length} Datei(en) konnten nicht geladen werden.`,failed.map((entry)=>entry.reason));
      return this.centerAssetTemplates;
    })();
    return this.centerAssetLoadPromise;
  }

  cloneCenterAsset(key,{nodeName='',targetSize=0,targetHeight=0,bottomAlign=true,rotateY=0,center=true,shareGeometry=false}={}) {
    const template=this.centerAssetTemplates.get(key);if(!template?.root)return null;
    template.root.updateMatrixWorld(true);
    let source=template.root;
    if(nodeName){source=template.root.getObjectByName(nodeName)||[...template.root.children].find((child)=>String(child.name||'').toLowerCase()===String(nodeName).toLowerCase());if(!source)return null;}
    let clone=nodeName?source.clone(true):cloneSkeleton(source);
    if(nodeName){const p=new THREE.Vector3(),q=new THREE.Quaternion(),sc=new THREE.Vector3();source.matrixWorld.decompose(p,q,sc);clone.position.copy(p);clone.quaternion.copy(q);clone.scale.copy(sc);}
    clone.traverse((object)=>{
      if(object.isLight||object.isCamera){object.visible=false;return;}
      if(object.isMesh||object.isSkinnedMesh){if(!shareGeometry&&object.geometry?.clone)object.geometry=object.geometry.clone();const mats=Array.isArray(object.material)?object.material:[object.material];const cloned=mats.map((mat)=>{const next=mat?.clone?.()||mat;if(next?.map)next.map.colorSpace=THREE.SRGBColorSpace;if(next){next.envMapIntensity=.28;next.needsUpdate=true;}return next;});object.material=Array.isArray(object.material)?cloned:cloned[0];object.castShadow=!!this.state.world?.shadows;object.receiveShadow=!!this.state.world?.shadows;}
    });
    clone.updateMatrixWorld(true);
    let box=new THREE.Box3().setFromObject(clone);if(box.isEmpty())return clone;
    const size=box.getSize(new THREE.Vector3());const scaleBy=targetHeight>0?targetHeight/Math.max(.0001,size.y):targetSize>0?targetSize/Math.max(.0001,size.x,size.y,size.z):1;
    if(Number.isFinite(scaleBy)&&scaleBy>0&&scaleBy!==1)clone.scale.multiplyScalar(scaleBy);
    clone.updateMatrixWorld(true);box=new THREE.Box3().setFromObject(clone);
    if(center){const centerPoint=box.getCenter(new THREE.Vector3());clone.position.x-=centerPoint.x;clone.position.z-=centerPoint.z;}
    if(bottomAlign)clone.position.y-=box.min.y;
    if(rotateY)clone.rotation.y+=rotateY;
    clone.updateMatrixWorld(true);return clone;
  }

  makeAnimalClipInPlace(clip){
    if(!clip?.clone)return clip;const next=clip.clone();
    for(const track of next.tracks||[]){if(!/\.position$/i.test(track.name)||!/root|center|hips|pelvis/i.test(track.name)||!track.values)continue;const stride=track.getValueSize?.()||3;if(stride<3)continue;const x=track.values[0],z=track.values[2];for(let i=0;i<track.values.length;i+=stride){track.values[i]=x;track.values[i+2]=z;}}
    return next;
  }

  createAnimalVisual(type){
    const profile=ANIMAL_PROFILES[type];if(!profile)return null;
    const nodeName=type==='horse'?'Cylinder':'';
    const raw=this.cloneCenterAsset(profile.asset,{nodeName,targetSize:profile.size,bottomAlign:profile.zone==='land'});
    if(!raw)return null;
    // Die interne GLB-Achse bleibt unberührt. Nur dieser Wrapper korrigiert die
    // Blickrichtung, damit Animation, Bewegung und Verwandlung dieselbe Achse nutzen.
    const root=new THREE.Group();root.name=`center-animal-visual-${type}`;root.add(raw);
    root.rotation.y=Number(profile.yawOffset||0);
    const template=this.centerAssetTemplates.get(profile.asset),walkTemplate=profile.walkAsset?this.centerAssetTemplates.get(profile.walkAsset):null;let mixer=null,idleAction=null,moveAction=null;
    if(!nodeName&&(template?.animations?.length||walkTemplate?.animations?.length)){
      mixer=new THREE.AnimationMixer(raw);
      const idleClips=(template?.animations||[]).map((clip)=>this.makeAnimalClipInPlace(clip));
      const moveClips=(walkTemplate?.animations||template?.animations||[]).map((clip)=>this.makeAnimalClipInPlace(clip));
      const matchedMove=moveClips.find((clip)=>profile.move?.test?.(clip.name||''));
      if(profile.singleMoveAnimation){
        const moveClip=matchedMove||moveClips[0]||idleClips[0];
        if(moveClip){moveAction=mixer.clipAction(moveClip);moveAction.play();moveAction.paused=true;}
      }else{
        const idleClip=idleClips.find((clip)=>profile.idle?.test?.(clip.name||''))||idleClips[0]||moveClips[0];
        const moveClip=matchedMove||moveClips[0]||idleClip;
        if(idleClip){idleAction=mixer.clipAction(idleClip);idleAction.play();}
        if(moveClip){moveAction=mixer.clipAction(moveClip);if(moveAction!==idleAction){moveAction.play();moveAction.enabled=false;}}
      }
    }
    if(type==='cow'){
      const names=['FrontUpperLeg.L_6','FrontUpperLeg.R_9','BackUpperLeg.L_14','BackUpperLeg.R_18'];
      root.userData.proceduralLegs=names.map((name)=>raw.getObjectByName(name)).filter(Boolean);
    }
    if(type==='horse'){
      root.userData.proceduralHorseRoot=raw;
      raw.userData.__centerHorseBasePosition=raw.position.clone();
      raw.userData.__centerHorseBaseRotation=raw.rotation.clone();
    }
    root.userData.centerAnimalType=type;root.userData.assetRoot=raw;root.userData.mixer=mixer;root.userData.idleAction=idleAction;root.userData.moveAction=moveAction;root.userData.singleMoveAction=!!profile.singleMoveAnimation;root.userData.proceduralWalk=!!profile.proceduralWalk;return root;
  }

  applyProceduralAnimalWalk(visual,moving=true,delta=.016){
    if(!visual?.userData?.proceduralWalk)return;
    const strength=moving?1:0,now=performance.now(),phase=now*.0075;
    const legs=visual.userData.proceduralLegs||[];
    if(legs.length){
      for(let i=0;i<legs.length;i+=1){
        const bone=legs[i];
        if(!bone?.isBone)continue;
        const direction=(i===0||i===3)?1:-1;
        bone.rotateX(Math.sin(phase+i*.35)*.34*strength*direction);
      }
    }
    const horse=visual.userData.proceduralHorseRoot;
    if(horse){
      const baseP=horse.userData.__centerHorseBasePosition,baseR=horse.userData.__centerHorseBaseRotation;
      if(baseP){horse.position.copy(baseP);horse.position.y+=strength*(.018+Math.abs(Math.sin(phase*1.35))*.045);horse.position.z+=strength*Math.sin(phase*.68)*.018;}
      if(baseR){horse.rotation.copy(baseR);horse.rotation.x+=strength*Math.sin(phase*.68)*.028;horse.rotation.z+=strength*Math.sin(phase*1.35)*.012;}
    }
  }

  setAnimalAnimation(animal,moving=true,delta=.016){
    const visual=animal?.visual||animal;
    const mixer=animal?.mixer||visual?.userData?.mixer,idle=animal?.idleAction||visual?.userData?.idleAction,move=animal?.moveAction||visual?.userData?.moveAction,singleMove=!!visual?.userData?.singleMoveAction;
    if(mixer){
      if(singleMove&&move){
        if(moving){move.enabled=true;move.paused=false;}else{move.paused=true;move.time=0;}
      }else if(move&&idle&&move!==idle){if(moving&&!move.enabled){idle.fadeOut(.22);move.enabled=true;move.reset().fadeIn(.22).play();}else if(!moving&&move.enabled){move.fadeOut(.25);move.enabled=false;idle.reset().fadeIn(.25).play();}}
      mixer.update(delta);
    }
    this.applyProceduralAnimalWalk(visual,moving,delta);
  }

  installNatureClouds(){
    if(!this.cloudGroup)return;
    this.cloudGroup.clear();
    // V258: Keine Cloud-Nodes mehr aus dem Baum/Wolken-Pack. Einige davon
    // enthielten importierte Zweige/Objekte und erschienen als schwebende Stöcke.
    // Die Wolken werden vollständig prozedural und damit sauber kontrollierbar gebaut.
    const rnd=seededRandom(WORLD_SEED+7401);
    const cloudGeo=new THREE.IcosahedronGeometry(1,2);
    for(let i=0;i<13;i+=1){
      const cloud=new THREE.Group();cloud.name='center-procedural-cloud';cloud.userData.baseOpacity=.28+rnd()*.16;
      const puffCount=4+Math.floor(rnd()*4);
      for(let p=0;p<puffCount;p+=1){
        const mat=new THREE.MeshStandardMaterial({color:0xf0f3f5,roughness:1,metalness:0,transparent:true,opacity:cloud.userData.baseOpacity,depthWrite:false,fog:true});
        const puff=new THREE.Mesh(cloudGeo,mat);
        const sx=4.8+rnd()*5.8,sy=1.7+rnd()*2.4,sz=3.2+rnd()*4.8;
        puff.scale.set(sx,sy,sz);
        puff.position.set((p-(puffCount-1)/2)*(3.8+rnd()*1.4)+(rnd()-.5)*2.2,(rnd()-.5)*1.7,(rnd()-.5)*4.2);
        cloud.add(puff);
      }
      cloud.position.set(-305+rnd()*610,78+rnd()*58,-245+rnd()*490);
      cloud.rotation.y=rnd()*Math.PI*2;
      cloud.scale.setScalar(.72+rnd()*.58);
      this.cloudGroup.add(cloud);
    }
  }

decorateChunkWithAssetTrees(chunk){
    if(!this.centerAssetTemplates.has('naturePack'))return;const rnd=seededRandom((Math.imul(chunk.cx+2701,1103515245)^Math.imul(chunk.cz+4409,12345)^(WORLD_SEED+991))>>>0),quality=this.state.world?.graphicsQuality||'medium';const count=quality==='minimal'?0:quality==='extreme'?6:quality==='maximum'?5:quality==='ultra'&&this.performanceTier==='high'?4:quality==='high'?3:quality==='performance'?1:2;
    for(let i=0;i<count;i+=1){const lx=18+rnd()*(CHUNK_SIZE-36),lz=18+rnd()*(CHUNK_SIZE-36),x=chunk.originX+lx,z=chunk.originZ+lz;if(Math.abs(x-riverCenter(z))<27||this.pointNearChunkRoad(chunk,x,z,4)||chunk.villages.some((v)=>Math.hypot(x-v.x,z-v.z)<48))continue;const y=terrainHeightAt(x,z);if(y>58)continue;const name=this.natureTreeNames[Math.floor(rnd()*this.natureTreeNames.length)],tree=this.cloneCenterAsset('naturePack',{nodeName:name,targetSize:5.6+rnd()*4.8,bottomAlign:true});if(!tree)continue;tree.position.set(lx,y,lz);tree.rotation.y=rnd()*Math.PI*2;tree.name='asset-tree';chunk.group.add(tree);const radius=.75+(rnd()*.55);const collider=this.registerCollider(x,z,radius,'decorative-tree',chunk.key,tree);chunk.colliders.push(collider);}
  }

  createFirewoodVisual(targetSize=1.6){const root=this.cloneCenterAsset('firewood',{targetSize,bottomAlign:true});if(root)root.name='center-firewood-asset';return root;}
  createCampfireAsset(ghost=false){
    const root=this.cloneCenterAsset('campfire',{targetSize:2.35,bottomAlign:true});if(!root)return null;root.name='center-campfire-asset';const tint=ghost?new THREE.Color(0x69c981):null;root.traverse((object)=>{if(!object.isMesh)return;const mats=Array.isArray(object.material)?object.material:[object.material];for(const mat of mats){if(!mat)continue;if(ghost){mat.transparent=true;mat.opacity=.48;mat.color?.lerp?.(tint,.7);}else if(mat.emissive){const n=String(object.name||'').toLowerCase();if(/fire|flame|ember|glow/.test(n)){mat.emissive.set(0xff4a00);mat.emissiveIntensity=2.6;}}}});if(!ghost){const light=new THREE.PointLight(0xff7a28,3.4,20,2);light.position.set(0,1.2,0);light.castShadow=!!this.state.world?.shadows;root.add(light);root.userData.fireLight=light;this.animatedFireLights.push({group:root,light,flame:null,seed:Math.random()*100});}return root;
  }

  createScooterVisual(){
    const root=this.cloneCenterAsset('scooter',{targetSize:1.55,bottomAlign:true,rotateY:Math.PI/2});if(!root)return null;root.name='center-admin-owner-scooter';root.position.y=.02;root.traverse((object)=>{if(object.isMesh){const mats=Array.isArray(object.material)?object.material:[object.material];for(const mat of mats){if(mat){mat.metalness=Math.max(.15,Number(mat.metalness)||0);mat.roughness=Math.min(.62,Number(mat.roughness)||.5);}}}});return root;
  }

  buildSkyAndLights() {
    const geometry = new THREE.SphereGeometry(980, 28, 18);
    this.skyMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: { topColor: { value: new THREE.Color(0x679bca) }, bottomColor: { value: new THREE.Color(0xe2c993) }, offset: { value: 22 }, exponent: { value: .72 } },
      vertexShader: 'varying vec3 vWorldPosition;void main(){vWorldPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: 'uniform vec3 topColor;uniform vec3 bottomColor;uniform float offset;uniform float exponent;varying vec3 vWorldPosition;void main(){float h=normalize(vWorldPosition+offset).y;gl_FragColor=vec4(mix(bottomColor,topColor,max(pow(max(h,0.0),exponent),0.0)),1.0);}'
    });
    this.sky = new THREE.Mesh(geometry, this.skyMaterial);
    this.sky.frustumCulled=false;this.sky.renderOrder=-1000;
    this.scene.add(this.sky);
    this.hemisphere = new THREE.HemisphereLight(0xd4e8ff, 0x5c503b, 1.8);
    this.scene.add(this.hemisphere);
    this.sun = new THREE.DirectionalLight(0xffdd9b, 3.2);
    this.sun.castShadow=this.state.world?.shadowMode !== 'off';
    this.sun.shadow.mapSize.set(1024,1024);
    this.sun.shadow.camera.near=.5;this.sun.shadow.camera.far=520;
    this.sun.shadow.camera.left=-85;this.sun.shadow.camera.right=85;this.sun.shadow.camera.top=85;this.sun.shadow.camera.bottom=-85;
    this.sun.shadow.bias=-.00045;
    this.sunTarget=new THREE.Object3D();this.scene.add(this.sunTarget);this.sun.target=this.sunTarget;
    this.scene.add(this.sun);
    this.moon = new THREE.DirectionalLight(0x9fb9e8, 0);
    this.scene.add(this.moon);
    const sunMat=new THREE.MeshBasicMaterial({color:0xffe7a8,fog:false,transparent:true,opacity:1,depthWrite:false,blending:THREE.AdditiveBlending});
    this.sunDisc=new THREE.Mesh(new THREE.SphereGeometry(11,24,16),sunMat);this.sunDisc.renderOrder=4;this.scene.add(this.sunDisc);
    const glowCanvas=document.createElement('canvas');glowCanvas.width=128;glowCanvas.height=128;const glowCtx=glowCanvas.getContext('2d');const grad=glowCtx.createRadialGradient(64,64,3,64,64,62);grad.addColorStop(0,'rgba(255,244,188,1)');grad.addColorStop(.25,'rgba(255,213,104,.8)');grad.addColorStop(1,'rgba(255,176,52,0)');glowCtx.fillStyle=grad;glowCtx.fillRect(0,0,128,128);const glowTex=new THREE.CanvasTexture(glowCanvas);glowTex.colorSpace=THREE.SRGBColorSpace;this.sunGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,transparent:true,depthWrite:false,fog:false,blending:THREE.AdditiveBlending}));this.sunGlow.scale.set(70,70,1);this.sunGlow.renderOrder=3;this.scene.add(this.sunGlow);
    this.moonMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,uniforms:{phase:{value:.5},glow:{value:new THREE.Color(0xdce8ff)}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform float phase;uniform vec3 glow;varying vec2 vUv;void main(){vec2 p=vUv*2.0-1.0;float r=dot(p,p);if(r>1.0)discard;float edge=smoothstep(1.0,.82,r);float shift=(phase-.5)*1.7;float lit=smoothstep(-.08,.08,p.x+shift);if(phase>.5)lit=1.0-lit;float full=1.0-abs(phase-.5)*2.0;float mask=max(full,lit*(1.0-full));gl_FragColor=vec4(glow,edge*mask*.96);}' });
    this.moonDisc=new THREE.Mesh(new THREE.PlaneGeometry(15,15),this.moonMaterial);this.moonDisc.renderOrder=3;this.scene.add(this.moonDisc);
    this.cloudGroup=new THREE.Group();this.cloudGroup.name='center-asset-clouds';this.scene.add(this.cloudGroup);
    const starGeo=new THREE.BufferGeometry(),starPos=new Float32Array(750*3);for(let i=0;i<750;i+=1){const a=Math.random()*Math.PI*2,b=Math.acos(Math.random()*.82+.18),r=700;starPos[i*3]=Math.sin(b)*Math.cos(a)*r;starPos[i*3+1]=Math.cos(b)*r;starPos[i*3+2]=Math.sin(b)*Math.sin(a)*r;}starGeo.setAttribute('position',new THREE.BufferAttribute(starPos,3));this.starMaterial=new THREE.PointsMaterial({color:0xffffff,size:1.15,transparent:true,opacity:0,depthWrite:false,fog:false});this.stars=new THREE.Points(starGeo,this.starMaterial);this.scene.add(this.stars);
    this.scene.add(new THREE.AmbientLight(0xffffff, .18));
  }

applyGraphicsQuality() {
    const quality = GRAPHICS_QUALITIES.includes(this.state.world?.graphicsQuality) ? this.state.world.graphicsQuality : 'medium';
    this.renderer?.setPixelRatio?.(this.performancePixelRatio());
    if (this.renderer) this.renderer.toneMappingExposure = quality === 'extreme' ? 1.13 : quality === 'maximum' ? 1.10 : quality === 'ultra' ? 1.06 : quality === 'high' ? 1.03 : 1;
    this.applyShadowSettings();
    this.applyWorldRenderSettings(true);
    // Jeder Client entscheidet selbst, wie teuer fremde Wings/Auren/Staff-Effekte sind.
    for(const remote of this.remotePlayers.values()){remote.lastCosmeticKey='';remote.lastHeldKey='';this.applyRemoteOwnerAura(remote);this.applyRemoteHeldItem(remote);}
    this.resize();
  }

  applyShadowSettings() {
    const mode = SHADOW_MODES.includes(this.state.world?.shadowMode) ? this.state.world.shadowMode : 'off';
    const enabled = mode !== 'off';
    const worldShadows = mode === 'world';
    this.state.world.shadows = enabled;
    if(this.renderer){this.renderer.shadowMap.enabled=enabled;this.renderer.shadowMap.needsUpdate=true;}
    if(this.sun){
      this.sun.castShadow=enabled;
      const quality=this.state.world?.graphicsQuality||'medium';
      const mapSize=quality==='extreme'?4096:quality==='maximum'?3072:quality==='ultra'?2048:quality==='high'?1024:512;
      this.sun.shadow.mapSize.set(mapSize,mapSize);
      this.sun.shadow.map?.dispose?.();
      this.sun.shadow.map=null;
    }
    this.scene?.traverse?.((object)=>{
      if(!object?.isMesh&&!object?.isInstancedMesh)return;
      if(object===this.sky||object===this.sunDisc||object===this.moonDisc)return;
      const isGround=/terrain|ground|soil|field|road|path/i.test(object.name||'')||object.geometry?.type==='PlaneGeometry';
      const belongsToPlayer=!!this.playerModel&&(object===this.playerModel||this.playerModel.children?.includes?.(object));
      object.castShadow=enabled&&(worldShadows&&!isGround||belongsToPlayer);
      object.receiveShadow=enabled&&(isGround||worldShadows);
    });
    if(this.playerModel)this.playerModel.traverse((object)=>{if(object.isMesh){object.castShadow=enabled;object.receiveShadow=worldShadows;}});
    if(this.ownerHeldObject)this.ownerHeldObject.traverse((object)=>{if(object.isMesh){object.castShadow=enabled;object.receiveShadow=worldShadows;}});
    if(this.ownerFormObject)this.ownerFormObject.traverse((object)=>{if(object.isMesh){object.castShadow=enabled;object.receiveShadow=worldShadows;}});
  }

  initializeStreamingWorld() {
    this.chunks.clear();
    this.chunkBuildQueue.length = 0;
    this.chunkBuildBusy = false;
    this.lastChunkCenter = '';
  }

applyWorldRenderSettings(force = false) {
    const distance = this.effectiveRenderDistance();
    if (this.camera) this.camera.far = Math.max(500, distance * CHUNK_SIZE * 2.15);
    if (this.camera) this.camera.updateProjectionMatrix();
    if (this.scene?.fog) this.scene.fog.density = clamp(.00335 - distance * .00045, .00082, .0029);
    if (force) this.lastChunkCenter = '';
  }

async updateChunkStreaming(force = false) {
    if (!this.player || !this.scene) return;
    const now = performance.now();
    const interval=this.performanceTier==='low'?390:this.performanceTier==='balanced'?310:260;
    if (!force && now - this.chunkUpdateAt < interval) return;
    this.chunkUpdateAt = now;
    const cx = worldToChunk(this.player.position.x), cz = worldToChunk(this.player.position.z), centerKey = chunkKey(cx, cz);
    const radius = this.effectiveRenderDistance();
    if (!force && centerKey === this.lastChunkCenter && this.chunks.size) return;
    this.lastChunkCenter = centerKey;
    const wanted = new Set(), candidates = [];
    for (let dz = -radius; dz <= radius; dz += 1) for (let dx = -radius; dx <= radius; dx += 1) {
      const tx = cx + dx, tz = cz + dz;
      if (chunkOrigin(tx) < -WORLD_HALF || chunkOrigin(tx) >= WORLD_HALF || chunkOrigin(tz) < -WORLD_HALF || chunkOrigin(tz) >= WORLD_HALF) continue;
      const key = chunkKey(tx, tz);wanted.add(key);if (!this.chunks.has(key)) candidates.push({ cx: tx, cz: tz, key, distance: Math.hypot(dx, dz) });
    }
    candidates.sort((a,b) => a.distance - b.distance);
    for (const [key, chunk] of [...this.chunks]) if (!wanted.has(key)) this.unloadWorldChunk(key, chunk);
    for (const candidate of candidates) { this.loadWorldChunk(candidate.cx, candidate.cz); if (force && candidate.distance <= 1.5) await nextPaint(); }
    this.loadedVillageCount = [...this.chunks.values()].reduce((sum, chunk) => sum + (chunk.villages?.length || 0), 0);
  }

  loadWorldChunk(cx, cz) {
    const key = chunkKey(cx, cz);
    if (this.chunks.has(key)) return this.chunks.get(key);
    const group = new THREE.Group();
    group.name = `world-chunk-${key}`;
    const originX = chunkOrigin(cx), originZ = chunkOrigin(cz);
    group.position.set(originX, 0, originZ);
    const quality = this.state.world?.density || 'normal';
    const segments = quality === 'low' ? 16 : quality === 'high' ? 26 : 21;
    const terrainMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
    const terrain = new THREE.Mesh(makeTerrainGeometry(CHUNK_SIZE, segments, originX, originZ), terrainMaterial);
    group.add(terrain);
    const chunk = { key, cx, cz, group, originX, originZ, resources: [], hotspots: [], villages: [], colliders: [], npcs: [], doors: [] };
    this.buildChunkVillage(chunk);
    this.buildChunkLandmarks(chunk);
    this.buildChunkPaths(chunk);
    this.buildChunkForest(chunk);
    this.decorateChunkWithAssetTrees(chunk);
    this.buildChunkRocksAndBushes(chunk);
    this.buildChunkGrass(chunk);
    this.scene.add(group);
    this.chunks.set(key, chunk);
    return chunk;
  }

  createTerrainStrip(chunk,worldAx,worldAz,worldBx,worldBz,width,material,segments=4) {
    const dx=worldBx-worldAx,dz=worldBz-worldAz,length=Math.hypot(dx,dz)||1;
    const px=-dz/length*width*.5,pz=dx/length*width*.5;
    const vertices=[],uvs=[],indices=[];
    for(let i=0;i<=segments;i+=1){
      const t=i/segments,cx=worldAx+dx*t,cz=worldAz+dz*t;
      const leftX=cx+px,leftZ=cz+pz,rightX=cx-px,rightZ=cz-pz;
      vertices.push(leftX-chunk.originX,terrainHeightAt(leftX,leftZ)+.012,leftZ-chunk.originZ,rightX-chunk.originX,terrainHeightAt(rightX,rightZ)+.012,rightZ-chunk.originZ);
      uvs.push(0,t,1,t);
      if(i<segments){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();
    const mesh=new THREE.Mesh(geo,material);mesh.name='terrain-road-strip';mesh.receiveShadow=!!this.state.world?.shadows;chunk.group.add(mesh);return mesh;
  }

  createTerrainCircle(chunk,worldX,worldZ,radius,material,segments=32) {
    const vertices=[worldX-chunk.originX,terrainHeightAt(worldX,worldZ)+.01,worldZ-chunk.originZ],indices=[];
    for(let i=0;i<=segments;i+=1){const a=i/segments*Math.PI*2,x=worldX+Math.cos(a)*radius,z=worldZ+Math.sin(a)*radius;vertices.push(x-chunk.originX,terrainHeightAt(x,z)+.011,z-chunk.originZ);if(i<segments)indices.push(0,i+1,i+2);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,material);mesh.name='terrain-road-junction';mesh.receiveShadow=!!this.state.world?.shadows;chunk.group.add(mesh);return mesh;
  }

  buildChunkPaths(chunk) {
    const random = seededRandom((Math.imul(chunk.cx + 4096, 73856093) ^ Math.imul(chunk.cz + 4096, 19349663) ^ WORLD_SEED) >>> 0);
    const material = new THREE.MeshStandardMaterial({ color: 0x756146, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 });
    const hub = chunk.villages[0]
      ? { x: chunk.villages[0].x - chunk.originX, z: chunk.villages[0].z - chunk.originZ }
      : { x: CHUNK_SIZE * (.43 + random() * .14), z: CHUNK_SIZE * (.43 + random() * .14) };
    const horizontalOffset = (boundaryZ) => 18 + hash2(chunk.cx, boundaryZ, WORLD_SEED + 5101) * (CHUNK_SIZE - 36);
    const verticalOffset = (boundaryX) => 18 + hash2(boundaryX, chunk.cz, WORLD_SEED + 5107) * (CHUNK_SIZE - 36);
    const endpoints = [
      { x: horizontalOffset(chunk.cz), z: -.35, seed: 11 },
      { x: horizontalOffset(chunk.cz + 1), z: CHUNK_SIZE + .35, seed: 23 },
      { x: -.35, z: verticalOffset(chunk.cx), seed: 37 },
      { x: CHUNK_SIZE + .35, z: verticalOffset(chunk.cx + 1), seed: 53 }
    ];
    chunk.roadSegments = [];
    const addRoad = (from, to, seed = 0, width = 5.8) => {
      const bend = (hash2(chunk.cx + seed, chunk.cz - seed, WORLD_SEED + 5147) - .5) * 19;
      const vx = to.x - from.x, vz = to.z - from.z, length = Math.hypot(vx, vz) || 1;
      const px = -vz / length, pz = vx / length;
      const control = { x: (from.x + to.x) * .5 + px * bend, z: (from.z + to.z) * .5 + pz * bend };
      let previous = from;
      const pieces = 9;
      for (let i = 1; i <= pieces; i += 1) {
        const t = i / pieces, it = 1 - t;
        const current = { x: it * it * from.x + 2 * it * t * control.x + t * t * to.x, z: it * it * from.z + 2 * it * t * control.z + t * t * to.z };
        const worldA = { x: chunk.originX + previous.x, z: chunk.originZ + previous.z };
        const worldB = { x: chunk.originX + current.x, z: chunk.originZ + current.z };
        this.createTerrainStrip(chunk,worldA.x,worldA.z,worldB.x,worldB.z,width,material,5);
        chunk.roadSegments.push({ ax: worldA.x, az: worldA.z, bx: worldB.x, bz: worldB.z, width });
        previous = current;
      }
    };
    endpoints.forEach((endpoint) => addRoad(hub, endpoint, endpoint.seed));
    for (const hotspot of chunk.hotspots || []) {
      if (!['cave','mine','landmark','encounter'].includes(hotspot.type)) continue;
      addRoad(hub, { x: hotspot.x - chunk.originX, z: hotspot.z - chunk.originZ }, 71 + String(hotspot.id || '').length, 3.2);
    }
    this.createTerrainCircle(chunk,chunk.originX+hub.x,chunk.originZ+hub.z,7.2,material,28);
  }

  pointNearChunkRoad(chunk, x, z, padding = 0) {
    for (const segment of chunk.roadSegments || []) {
      const vx = segment.bx - segment.ax, vz = segment.bz - segment.az;
      const wx = x - segment.ax, wz = z - segment.az;
      const t = clamp((wx * vx + wz * vz) / Math.max(.001, vx * vx + vz * vz), 0, 1);
      const px = segment.ax + vx * t, pz = segment.az + vz * t;
      if (Math.hypot(x - px, z - pz) < segment.width * .5 + padding) return true;
    }
    return false;
  }

  buildChunkForest(chunk) {
    const random = seededRandom((Math.imul(chunk.cx + 8192, 83492791) ^ Math.imul(chunk.cz + 8192, 2971215073) ^ (WORLD_SEED + 77)) >>> 0);
    const density = densityMultiplier(this.state.world?.density)*this.performanceDensityFactor();
    const forestProfile=hash2(chunk.cx,chunk.cz,WORLD_SEED+8811);
    const localDensity=forestProfile>.72?1.34:forestProfile<.2?.7:1;
    const minTreeSpacing=forestProfile>.72?4.15:forestProfile<.2?7.2:5.35;
    const count = Math.floor((88 + random() * 96) * density * localDensity);
    const nodes = [];
    for (let i = 0; i < count; i += 1) {
      const lx = 5 + random() * (CHUNK_SIZE - 10), lz = 5 + random() * (CHUNK_SIZE - 10);
      const x = chunk.originX + lx, z = chunk.originZ + lz, y = terrainHeightAt(x, z);
      if (y > 62 || Math.abs(x - riverCenter(z)) < 25 || this.pointNearChunkRoad(chunk, x, z, 2.8) || chunk.villages.some((v)=>Math.hypot(x-v.x,z-v.z)<50)) continue;
      const prospectiveScale=.58+random()*1.18;
      if(nodes.some((other)=>Math.hypot(x-other.x,z-other.z)<Math.max(minTreeSpacing,(other.scale+prospectiveScale)*1.35)))continue;
      const roll = random();
      const localBiome=hash2(Math.floor(x/360),Math.floor(z/360),WORLD_SEED+911);
      const livingType=localBiome<.24?'pine':localBiome<.47?'birch':localBiome<.69?'darkpine':'broadleaf';
      const archetype = roll < .055 ? 'fallen' : roll < .105 ? 'broken' : roll < .15 ? 'dead' : roll < .24 ? 'giant' : livingType;
      const scale = archetype === 'giant' ? 1.65 + random() * 1.15 : archetype === 'fallen' ? .9 + random() * 1.25 : prospectiveScale;
      if(nodes.some((other)=>Math.hypot(x-other.x,z-other.z)<Math.max(minTreeSpacing,(other.scale+scale)*(archetype==='fallen'?.9:1.55))))continue;
      nodes.push({ id: `tree-${chunk.key}-${i}`, type: 'tree', archetype, x, z, y, scale, yaw: random() * Math.PI * 2, active: true, chunkKey: chunk.key, instanceEntries: [] });
    }
    if (!nodes.length) return;
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x593722, roughness: 1 });
    const deadMat = new THREE.MeshStandardMaterial({ color: 0x69513c, roughness: 1, flatShading: true });
    const leafMat = new THREE.MeshStandardMaterial({ color: SEASONS[this.state.season].foliage, roughness: 1, flatShading: true });
    const leafMat2 = leafMat.clone(); leafMat2.color.offsetHSL(.02, .03, .06);
    const birchTrunkMat=new THREE.MeshStandardMaterial({color:0xd8d2ba,roughness:1,flatShading:true});
    const birchLeafMat=leafMat.clone();birchLeafMat.color.offsetHSL(.08,.02,.12);
    const darkLeafMat=leafMat.clone();darkLeafMat.color.set(0x173c25);
    const up = new THREE.Vector3(0,1,0);
    const byType = (type) => nodes.filter((node) => node.archetype === type);
    const addPart = (list, geometry, material, transform) => {
      if (!list.length) return;
      const mesh = new THREE.InstancedMesh(geometry, material, list.length);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      const matrix = new THREE.Matrix4();
      list.forEach((node, index) => {
        transform(node, matrix);
        mesh.setMatrixAt(index, matrix);
        node.instanceEntries.push({ mesh, index, matrix: matrix.clone() });
      });
      chunk.group.add(mesh);
    };
    const local = (node, yOffset = 0) => new THREE.Vector3(node.x - chunk.originX, node.y + yOffset, node.z - chunk.originZ);
    const yawQ = (node) => new THREE.Quaternion().setFromAxisAngle(up, node.yaw);
    const pine = [...byType('pine'), ...byType('giant')];
    const darkPine=byType('darkpine');
    addPart(pine, new THREE.CylinderGeometry(.36,.54,4.4,7), trunkMat, (n,m)=>m.compose(local(n,2.2*n.scale),yawQ(n),new THREE.Vector3(n.scale,n.scale,n.scale)));
    addPart(pine, new THREE.ConeGeometry(2.35,4.8,8,2), leafMat, (n,m)=>m.compose(local(n,5.0*n.scale),yawQ(n),new THREE.Vector3(n.scale,n.scale,n.scale)));
    addPart(pine, new THREE.ConeGeometry(1.8,4.2,8,2), leafMat2, (n,m)=>m.compose(local(n,7.2*n.scale),yawQ(n),new THREE.Vector3(n.scale,n.scale,n.scale)));
    addPart(darkPine,new THREE.CylinderGeometry(.38,.58,4.8,7),trunkMat,(n,m)=>m.compose(local(n,2.4*n.scale),yawQ(n),new THREE.Vector3(n.scale,n.scale,n.scale)));
    addPart(darkPine,new THREE.ConeGeometry(2.45,5.2,8,2),darkLeafMat,(n,m)=>m.compose(local(n,5.25*n.scale),yawQ(n),new THREE.Vector3(n.scale,n.scale,n.scale)));
    addPart(darkPine,new THREE.ConeGeometry(1.72,4.1,8,2),darkLeafMat,(n,m)=>m.compose(local(n,7.35*n.scale),yawQ(n),new THREE.Vector3(n.scale,n.scale,n.scale)));
    const birch=byType('birch');
    addPart(birch,new THREE.CylinderGeometry(.32,.48,5.2,8),birchTrunkMat,(n,m)=>m.compose(local(n,2.6*n.scale),yawQ(n),new THREE.Vector3(n.scale,n.scale,n.scale)));
    addPart(birch,new THREE.IcosahedronGeometry(2.05,1),birchLeafMat,(n,m)=>m.compose(local(n,5.6*n.scale),yawQ(n),new THREE.Vector3(n.scale*1.05,n.scale*.9,n.scale)));
    const broad = byType('broadleaf');
    addPart(broad, new THREE.CylinderGeometry(.4,.62,4.8,8), trunkMat, (n,m)=>m.compose(local(n,2.4*n.scale),yawQ(n),new THREE.Vector3(n.scale,n.scale,n.scale)));
    addPart(broad, new THREE.IcosahedronGeometry(2.25,1), leafMat, (n,m)=>m.compose(local(n,5.45*n.scale),yawQ(n),new THREE.Vector3(n.scale*1.18,n.scale*.95,n.scale*1.1)));
    addPart(broad, new THREE.IcosahedronGeometry(1.65,1), leafMat2, (n,m)=>m.compose(new THREE.Vector3(n.x-chunk.originX+Math.cos(n.yaw)*1.5*n.scale,n.y+5.2*n.scale,n.z-chunk.originZ+Math.sin(n.yaw)*1.5*n.scale),yawQ(n),new THREE.Vector3(n.scale,n.scale*.85,n.scale)));
    const dead = [...byType('dead'), ...byType('broken')];
    addPart(dead, new THREE.CylinderGeometry(.28,.5,4.8,6), deadMat, (n,m)=>m.compose(local(n,(n.archetype==='broken'?1.45:2.4)*n.scale),yawQ(n),new THREE.Vector3(n.scale,n.scale*(n.archetype==='broken'?.6:1),n.scale)));
    addPart(byType('dead'), new THREE.CylinderGeometry(.11,.18,2.5,5), deadMat, (n,m)=>{const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,n.yaw,1.05));m.compose(local(n,4.4*n.scale),q,new THREE.Vector3(n.scale,n.scale,n.scale));});
    const fallen = byType('fallen');
    addPart(fallen, new THREE.CylinderGeometry(.32,.48,5.4,7), deadMat, (n,m)=>{const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI/2,n.yaw,0));m.compose(local(n,.48*n.scale),q,new THREE.Vector3(n.scale,n.scale,n.scale));});
    addPart(fallen, new THREE.CylinderGeometry(.12,.2,2.4,5), deadMat, (n,m)=>{const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI/2,n.yaw+.75,.5));m.compose(new THREE.Vector3(n.x-chunk.originX+Math.cos(n.yaw)*.8*n.scale,n.y+.65*n.scale,n.z-chunk.originZ+Math.sin(n.yaw)*.8*n.scale),q,new THREE.Vector3(n.scale,n.scale,n.scale));});
    this.seasonMaterials.push({ material: leafMat, kind: 'foliage', chunkKey: chunk.key }, { material: leafMat2, kind: 'foliage', chunkKey: chunk.key }, {material:birchLeafMat,kind:'foliage',chunkKey:chunk.key},{material:darkLeafMat,kind:'dark-foliage',chunkKey:chunk.key});
    nodes.forEach((node) => {
      const radius = node.archetype === 'fallen' ? 2.2 * node.scale : node.archetype === 'giant' ? .95 * node.scale : .63 * node.scale;
      node.collider = this.registerCollider(node.x, node.z, radius, 'resource', chunk.key, node);
      if(node.archetype==='fallen'){node.collider.shape='segment';node.collider.length=5.4*node.scale;node.collider.yaw=node.yaw;node.collider.radius=.42*node.scale;node.collider.walkable=true;node.collider.height=.92*node.scale;}
      chunk.colliders.push(node.collider);
    });
    const interactive = nodes.filter((node,index)=>['fallen','broken','dead'].includes(node.archetype)||index%Math.max(7,Math.floor(nodes.length/12))===0).slice(0,22);
    chunk.resources.push(...interactive); this.resourceNodes.push(...interactive);
    for (const node of interactive) { const until=Number(this.state.harvested[node.id]||0); if(until>Date.now())this.setResourceVisible(node,false); }
  }

  buildChunkRocksAndBushes(chunk) {
    const random = seededRandom((Math.imul(chunk.cx + 2048, 2654435761) ^ Math.imul(chunk.cz + 2048, 1597334677) ^ (WORLD_SEED + 129)) >>> 0);
    const density = densityMultiplier(this.state.world?.density)*this.performanceDensityFactor();
    const create = (type, count) => {
      const nodes=[];
      for(let i=0;i<count;i+=1){
        const lx=6+random()*(CHUNK_SIZE-12),lz=6+random()*(CHUNK_SIZE-12),x=chunk.originX+lx,z=chunk.originZ+lz,y=terrainHeightAt(x,z);
        if(y>72||Math.abs(x-riverCenter(z))<18||this.pointNearChunkRoad(chunk,x,z,type==='bush'?1.1:2.1)||chunk.villages.some((v)=>Math.hypot(x-v.x,z-v.z)<42))continue;
        const dense=type==='bush' ? random()<.46 : true;
        nodes.push({id:`${type}-${chunk.key}-${i}`,type,x,z,y,scale:.42+random()*(type==='rock'?1.25:.82),yaw:random()*Math.PI*2,active:true,dense,chunkKey:chunk.key,instanceEntries:[]});
      }
      if(!nodes.length)return;
      const isRock=type==='rock';
      const mat=new THREE.MeshStandardMaterial({color:isRock?0x747976:0x486f37,roughness:1,flatShading:true});
      const geometry=isRock?new THREE.DodecahedronGeometry(1.25,0):new THREE.IcosahedronGeometry(1.1,1);
      const mesh=new THREE.InstancedMesh(geometry,mat,nodes.length);const matrix=new THREE.Matrix4(),q=new THREE.Quaternion();
      nodes.forEach((node,index)=>{
        if(isRock)q.setFromEuler(new THREE.Euler(index*.17,node.yaw,index*.11));else q.setFromAxisAngle(new THREE.Vector3(0,1,0),node.yaw);
        const scale=isRock?new THREE.Vector3(node.scale*1.15,node.scale*.8,node.scale):new THREE.Vector3(node.scale*1.4,node.scale*.85,node.scale);
        const yoff=isRock?.65*node.scale:.75*node.scale;
        matrix.compose(new THREE.Vector3(node.x-chunk.originX,node.y+yoff,node.z-chunk.originZ),q,scale);mesh.setMatrixAt(index,matrix);
        node.instanceEntries.push({mesh,index,matrix:matrix.clone()});
        if(isRock||node.dense){node.collider=this.registerCollider(node.x,node.z,(isRock?.86:.66)*node.scale,'resource',chunk.key,node);chunk.colliders.push(node.collider);}
      });
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);chunk.group.add(mesh);
      const interactive=nodes.filter((_,i)=>i%Math.max(5,Math.floor(nodes.length/7))===0).slice(0,10);chunk.resources.push(...interactive);this.resourceNodes.push(...interactive);for(const node of interactive){const until=Number(this.state.harvested[node.id]||0);if(until>Date.now())this.setResourceVisible(node,false);}
    };
    create('rock',Math.floor((15+random()*16)*density));
    create('bush',Math.floor((16+random()*20)*density));
  }

buildChunkGrass(chunk) {
    const random=seededRandom((Math.imul(chunk.cx+7001,1103515245)^Math.imul(chunk.cz+9001,12345)^(WORLD_SEED+333))>>>0),quality=this.state.world?.graphicsQuality||'medium';
    const density=densityMultiplier(this.state.world?.density)*this.performanceDensityFactor(),grassBase=quality==='minimal'?28:quality==='performance'?58:quality==='low'?105:quality==='medium'?165:quality==='high'?245:quality==='ultra'?310:quality==='maximum'?420:520,count=Math.floor(grassBase*density);
    if(count<1)return;
    const seasonColors=[0x5f8a45,0x5c8b43,0x718044,0x9aa58f],matA=new THREE.MeshStandardMaterial({color:seasonColors[this.state.season]||seasonColors[0],roughness:1,side:THREE.DoubleSide,transparent:true,opacity:.94}),matB=matA.clone();matB.color.offsetHSL(.02,-.03,.035);
    const geo=new THREE.PlaneGeometry(.48,.28);geo.translate(0,.14,0);const meshA=new THREE.InstancedMesh(geo,matA,count),meshB=new THREE.InstancedMesh(geo,matB,count),meshC=['minimal','performance','low'].includes(quality)?null:new THREE.InstancedMesh(geo,matA.clone(),count);
    const matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),q2=new THREE.Quaternion(),scale=new THREE.Vector3();let used=0;
    for(let i=0;i<count*4&&used<count;i+=1){const lx=3+random()*(CHUNK_SIZE-6),lz=3+random()*(CHUNK_SIZE-6),x=chunk.originX+lx,z=chunk.originZ+lz,y=terrainHeightAt(x,z);if(y>70||Math.abs(x-riverCenter(z))<14||this.pointNearChunkRoad(chunk,x,z,.55)||chunk.villages.some(v=>Math.hypot(x-v.x,z-v.z)<30))continue;const yaw=random()*Math.PI*2,sc=.55+random()*.65;q.setFromEuler(new THREE.Euler((random()-.5)*.1,yaw,(random()-.5)*.2));q2.setFromEuler(new THREE.Euler((random()-.5)*.1,yaw+Math.PI/2,(random()-.5)*.2));scale.set(sc*(.8+random()*.35),sc,sc);const pos=new THREE.Vector3(lx,y+.012,lz);matrix.compose(pos,q,scale);meshA.setMatrixAt(used,matrix);matrix.compose(pos,q2,scale);meshB.setMatrixAt(used,matrix);if(meshC){q2.setFromEuler(new THREE.Euler((random()-.5)*.08,yaw+Math.PI/4,(random()-.5)*.16));matrix.compose(pos,q2,scale.clone().multiplyScalar(.88));meshC.setMatrixAt(used,matrix);}used++;}
    for(const mesh of [meshA,meshB,meshC].filter(Boolean)){mesh.count=used;mesh.instanceMatrix.needsUpdate=true;}meshA.name='grass-clumps-a';meshB.name='grass-clumps-b';chunk.group.add(meshA,meshB);if(meshC){meshC.name='grass-clumps-c';chunk.group.add(meshC);}this.seasonMaterials.push({material:matA,kind:'grass',chunkKey:chunk.key},{material:matB,kind:'grassAlt',chunkKey:chunk.key});
  }

  async prepareNpcWhiteTemplate() {
    if(this.npcModelTemplate)return this.npcModelTemplate;
    if(this.npcModelPromise)return this.npcModelPromise;
    this.npcModelPromise=(async()=>{
      try{
        const gltf=await this.gltfLoader.loadAsync(MODEL_PATHS.owner);
        const root=cloneSkeleton(gltf.scene);
        root.updateMatrixWorld(true);
        const box=new THREE.Box3().setFromObject(root),height=Math.max(.01,box.max.y-box.min.y);
        root.scale.multiplyScalar(1.72/height);root.updateMatrixWorld(true);
        const scaled=new THREE.Box3().setFromObject(root),center=scaled.getCenter(new THREE.Vector3());
        root.position.x-=center.x;root.position.z-=center.z;root.position.y-=scaled.min.y;root.rotation.y=CHARACTER_MODEL_YAW;
        root.traverse((object)=>{
          if(!object.isMesh)return;
          const originals=Array.isArray(object.material)?object.material:[object.material];
          const whites=originals.map((material)=>{
            const next=material?.clone?.()||new THREE.MeshStandardMaterial();
            next.map=null;next.normalMap=null;next.roughnessMap=null;next.metalnessMap=null;
            next.color?.set?.(0xf2f4f3);next.emissive?.set?.(0x000000);next.emissiveIntensity=0;
            next.roughness=.78;next.metalness=0;next.transparent=false;next.opacity=1;next.depthWrite=true;
            return next;
          });
          object.material=Array.isArray(object.material)?whites:whites[0];object.castShadow=!!this.state.world?.shadows;object.receiveShadow=!!this.state.world?.shadows;
        });
        this.npcModelTemplate=root;return root;
      }catch(error){console.warn('Weißes Dorf-NPC-Modell konnte nicht vorbereitet werden',error);return null;}
    })();
    return this.npcModelPromise;
  }

  makeWhiteNpcCharacter(index=0) {
    if(index%3===0&&this.centerAssetTemplates.has('farmer')){
      const farmer=this.cloneCenterAsset('farmer',{targetHeight:1.76,bottomAlign:true});
      if(farmer){farmer.name='center-farmer-npc';farmer.rotation.y=CHARACTER_MODEL_YAW;farmer.traverse((object)=>{if(object.isMesh){object.castShadow=!!this.state.world?.shadows;object.receiveShadow=!!this.state.world?.shadows;}});return farmer;}
    }
    if(this.npcModelTemplate){
      const model=cloneSkeleton(this.npcModelTemplate);
      model.rotation.y=CHARACTER_MODEL_YAW;
      const bones=[];
      model.traverse((object)=>{if(object.isBone)bones.push(object);if(object.isMesh){object.castShadow=!!this.state.world?.shadows;object.receiveShadow=!!this.state.world?.shadows;}});
      const find=(pattern)=>bones.find((bone)=>pattern.test(bone.name||''));
      const rotate=(bone,euler)=>{if(!bone)return;bone.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(euler.x||0,euler.y||0,euler.z||0)));};
      rotate(find(/(?:a r m_up_R|upperarm.*r|right.*upperarm)/i),{z:1.42});
      rotate(find(/(?:a r m_up_L|upperarm.*l|left.*upperarm)/i),{z:-1.42});
      rotate(find(/(?:a r m_dawn_R|forearm.*r|right.*forearm)/i),{x:-.08});
      rotate(find(/(?:a r m_dawn_L|forearm.*l|left.*forearm)/i),{x:-.08});
      const upperRight=find(/(?:a r m_up_R|upperarm.*r|right.*upperarm)/i),upperLeft=find(/(?:a r m_up_L|upperarm.*l|left.*upperarm)/i),legRight=find(/(?:thigh.*r|upperleg.*r|right.*thigh|leg_up_R)/i),legLeft=find(/(?:thigh.*l|upperleg.*l|left.*thigh|leg_up_L)/i);
      model.userData.npcWalkBones={upperRight,upperLeft,legRight,legLeft,bases:new Map([upperRight,upperLeft,legRight,legLeft].filter(Boolean).map((b)=>[b,b.quaternion.clone()]))};
      return model;
    }
    return this.makeFallbackCharacter('npcwhite',index);
  }

  createVillageNpcPlaceholder(chunk,lx,lz,worldX,worldZ,index=0) {
    const holder=new THREE.Group();
    holder.position.set(lx,terrainHeightAt(worldX,worldZ),lz);
    holder.rotation.y=(index*.83)%(Math.PI*2);
    const model=this.makeWhiteNpcCharacter(index);holder.add(model);
    holder.userData.npcModel=model;holder.userData.chunkOriginX=chunk.originX;holder.userData.chunkOriginZ=chunk.originZ;
    chunk.group.add(holder);
    return holder;
  }

  buildChunkVillage(chunk) {
    const chance=hash2(chunk.cx,chunk.cz,WORLD_SEED+707);
    if(chance<.76)return;
    const random=seededRandom((Math.imul(chunk.cx+512,1640531513)^Math.imul(chunk.cz+512,2246822519)^(WORLD_SEED+701))>>>0);
    const lx=45+random()*(CHUNK_SIZE-90),lz=45+random()*(CHUNK_SIZE-90),x=chunk.originX+lx,z=chunk.originZ+lz,y=terrainHeightAt(x,z);
    if(y>48||y<-3||Math.abs(x-riverCenter(z))<38)return;
    const syllablesA=['Eichen','Falken','Stein','Wald','Berg','Fluss','Birken','Raben','Sonnen','Nebel','Hirsch','Linden','Fichten','Mühlen','Drachen','Königs'];
    const syllablesB=['hain','furt','dorf','heim','brück','tal','rode','au','feld','berg','wacht','see','mark','hof'];
    const name=`${syllablesA[Math.floor(random()*syllablesA.length)]}${syllablesB[Math.floor(random()*syllablesB.length)]}`;
    const villageType=random()<.26?'Bergdorf':random()<.55?'Bauerndorf':random()<.78?'Handelsdorf':'Jägerdorf';
    const wallColors={Bergdorf:0xaaa391,Bauerndorf:0xbda77c,Handelsdorf:0xc0aa82,Jägerdorf:0x9e8e69};
    const wallMat=new THREE.MeshStandardMaterial({color:wallColors[villageType],roughness:1});
    const timberMat=new THREE.MeshStandardMaterial({color:0x513321,roughness:1});
    const roofMat=new THREE.MeshStandardMaterial({color:villageType==='Bergdorf'?0x494541:0x5b3326,roughness:1});
    const glassMat=new THREE.MeshStandardMaterial({color:0xb8d5dc,emissive:0x182d32,emissiveIntensity:.22,roughness:.3});
    const roadMat=new THREE.MeshStandardMaterial({color:0x76644c,roughness:1,polygonOffset:true,polygonOffsetFactor:-3});
    this.createTerrainCircle(chunk,x,z,15,roadMat,40);

    const houseCount=7+Math.floor(random()*6);
    const housePositions=[];
    for(let i=0;i<houseCount;i+=1){
      const angle=i/houseCount*Math.PI*2+(random()-.5)*.22;
      const radius=21+(i%2)*10+random()*3;
      const hx=x+Math.cos(angle)*radius,hz=z+Math.sin(angle)*radius,hy=terrainHeightAt(hx,hz),yaw=-angle+Math.PI/2;
      const localX=hx-chunk.originX,localZ=hz-chunk.originZ;
      const group=new THREE.Group();group.position.set(localX,hy,localZ);group.rotation.y=yaw;
      const w=5.8+(i%3)*.55,d=4.8+(i%2)*.65,h=3.5+(i%2)*.35,doorW=1.15;
      const floor=new THREE.Mesh(new THREE.BoxGeometry(w,.12,d),new THREE.MeshStandardMaterial({color:0x765b3d,roughness:1}));floor.position.y=.03;floor.name='house-floor';group.add(floor);
      const back=new THREE.Mesh(new THREE.BoxGeometry(w,h,.22),wallMat);back.position.set(0,h/2,-d/2);group.add(back);
      for(const sx of [-1,1]){const side=new THREE.Mesh(new THREE.BoxGeometry(.22,h,d),wallMat);side.position.set(sx*w/2,h/2,0);group.add(side);}
      const frontWidth=(w-doorW)/2;
      for(const sx of [-1,1]){const front=new THREE.Mesh(new THREE.BoxGeometry(frontWidth,h,.22),wallMat);front.position.set(sx*(doorW/2+frontWidth/2),h/2,d/2);group.add(front);}
      const lintel=new THREE.Mesh(new THREE.BoxGeometry(doorW,.75,.22),wallMat);lintel.position.set(0,h-.375,d/2);group.add(lintel);
      const roof=new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*.73,2.65,4),roofMat);roof.position.y=h+1.15;roof.rotation.y=Math.PI/4;roof.scale.z=d/w;group.add(roof);
      const doorId=`door-${chunk.key}-${i}`;const doorPivot=new THREE.Group();doorPivot.position.set(-doorW/2,0,d/2+.14);const door=new THREE.Mesh(new THREE.BoxGeometry(doorW,2.15,.16),timberMat);door.position.set(doorW/2,1.075,0);doorPivot.add(door);group.add(doorPivot);this.villageDoors.set(doorId,{pivot:doorPivot,open:false,chunkKey:chunk.key});chunk.doors.push(doorId);
      for(const sx of [-1,1]){const beam=new THREE.Mesh(new THREE.BoxGeometry(.18,h+.18,.18),timberMat);beam.position.set(sx*(w/2-.18),h/2,d/2+.12);group.add(beam);const win=new THREE.Mesh(new THREE.BoxGeometry(.78,.72,.12),glassMat);win.position.set(sx*w*.31,2.05,d/2+.13);group.add(win);}
      const cross=new THREE.Mesh(new THREE.BoxGeometry(w-.3,.15,.15),timberMat);cross.position.set(0,h*.56,d/2+.14);group.add(cross);
      const bed=new THREE.Mesh(new THREE.BoxGeometry(1.8,.35,.8),new THREE.MeshStandardMaterial({color:0x6f4b35,roughness:1}));bed.position.set(-w*.22,.24,-d*.22);group.add(bed);
      const chest=new THREE.Mesh(new THREE.BoxGeometry(.9,.65,.65),new THREE.MeshStandardMaterial({color:0x5c351d,roughness:1}));chest.position.set(w*.28,.33,-d*.26);group.add(chest);
      if(i%3===0){const chimney=new THREE.Mesh(new THREE.BoxGeometry(.55,1.8,.55),new THREE.MeshStandardMaterial({color:0x69645c,roughness:1}));chimney.position.set(w*.24,h+1.25,0);group.add(chimney);}
      group.traverse((object)=>{if(object.isMesh){object.castShadow=!!this.state.world?.shadows;object.receiveShadow=!!this.state.world?.shadows;}});
      chunk.group.add(group);
      const addWallCollider=(ox,oz,radiusValue,heightValue=h+2.5)=>{const c=Math.cos(yaw),sn=Math.sin(yaw),wx=hx+ox*c+oz*sn,wz=hz-ox*sn+oz*c,collider=this.registerCollider(wx,wz,radiusValue,'village',chunk.key);collider.height=heightValue;chunk.colliders.push(collider);};
      for(let sx=-w/2+.55;sx<=w/2-.55;sx+=1.05)addWallCollider(sx,-d/2,.55);
      for(let sz=-d/2+.55;sz<=d/2-.55;sz+=1.05){addWallCollider(-w/2,sz,.55);addWallCollider(w/2,sz,.55);}
      for(let sx=-w/2+.55;sx<-doorW/2-.12;sx+=1)addWallCollider(sx,d/2,.52);
      for(let sx=doorW/2+.2;sx<=w/2-.55;sx+=1)addWallCollider(sx,d/2,.52);
      const frontX=hx+Math.sin(yaw)*(d/2+1.05),frontZ=hz+Math.cos(yaw)*(d/2+1.05);
      const doorHotspot={id:doorId,type:'door',x:frontX,z:frontZ,radius:2.2,label:'Haustür öffnen',data:{doorId,house:`${name} Haus ${i+1}`},chunkKey:chunk.key};chunk.hotspots.push(doorHotspot);this.hotspots.push(doorHotspot);
      housePositions.push({x:hx,z:hz,lx:localX,lz:localZ,w,d});
      const length=Math.max(4,radius-8),roadEndX=x+Math.cos(angle)*(radius-2.2),roadEndZ=z+Math.sin(angle)*(radius-2.2);this.createTerrainStrip(chunk,x,z,roadEndX,roadEndZ,3.35,roadMat,Math.max(6,Math.ceil(length/3)));
    }

    const stoneMat=new THREE.MeshStandardMaterial({color:0x7f817d,roughness:1});
    const wellGroup=new THREE.Group();const well=new THREE.Mesh(new THREE.CylinderGeometry(2.05,2.35,1.25,16),stoneMat);well.position.y=.62;wellGroup.add(well);
    for(const sx of [-1,1]){const post=new THREE.Mesh(new THREE.BoxGeometry(.22,3.2,.22),timberMat);post.position.set(sx*1.55,2,0);wellGroup.add(post);}
    const beam=new THREE.Mesh(new THREE.BoxGeometry(3.5,.22,.22),timberMat);beam.position.y=3.45;wellGroup.add(beam);wellGroup.position.set(lx,y,lz);chunk.group.add(wellGroup);
    {const collider=this.registerCollider(x,z,2.1,'village',chunk.key);collider.height=1.35;chunk.colliders.push(collider);}

    const market=new THREE.Group();market.position.set(lx+8,y,lz+5);
    const table=new THREE.Mesh(new THREE.BoxGeometry(5,.32,2.3),timberMat);table.position.y=1;market.add(table);
    for(const sx of [-1,1])for(const sz of [-1,1]){const post=new THREE.Mesh(new THREE.BoxGeometry(.18,3,.18),timberMat);post.position.set(sx*2.1,1.55,sz*.9);market.add(post);}
    const canopy=new THREE.Mesh(new THREE.BoxGeometry(5.4,.12,2.8),new THREE.MeshStandardMaterial({color:villageType==='Handelsdorf'?0x9b4237:0x4f7663,roughness:.9}));canopy.position.y=3.05;market.add(canopy);
    for(let crate=0;crate<4;crate++){const box=new THREE.Mesh(new THREE.BoxGeometry(.72,.55,.72),new THREE.MeshStandardMaterial({color:0x76502e,roughness:1}));box.position.set(-1.7+crate*1.1,.3,1.4);market.add(box);}
    market.traverse((object)=>{if(object.isMesh){object.castShadow=!!this.state.world?.shadows;object.receiveShadow=!!this.state.world?.shadows;}});
    chunk.group.add(market);
    for(const [ox,oz,radius,height] of [[8,5,2.35,1.25],[5.9,5,0.34,3.2],[10.1,5,0.34,3.2]]){const collider=this.registerCollider(x+ox,z+oz,radius,'village',chunk.key);collider.height=height;chunk.colliders.push(collider);}

    const fieldCount=villageType==='Bauerndorf'?4:2;
    const soilMat=new THREE.MeshStandardMaterial({color:0x5b3b23,roughness:1}),furrowMat=new THREE.MeshStandardMaterial({color:0x79522e,roughness:1}),cropMat=new THREE.MeshStandardMaterial({color:0xa8b64f,roughness:1});
    for(let f=0;f<fieldCount;f+=1){
      const fieldAngle=2.25+(f%2)*.42,fieldDistance=48+Math.floor(f/2)*15,worldFx=x+Math.cos(fieldAngle)*fieldDistance,worldFz=z+Math.sin(fieldAngle)*fieldDistance;
      if(housePositions.some(hp=>Math.hypot(worldFx-hp.x,worldFz-hp.z)<15))continue;
      const dirX=Math.cos(fieldAngle+.35),dirZ=Math.sin(fieldAngle+.35),perpX=-dirZ,perpZ=dirX;
      for(let row=-4;row<=4;row+=1.45){
        const cx=worldFx+perpX*row,cz=worldFz+perpZ*row;
        this.createTerrainStrip(chunk,cx-dirX*6,cz-dirZ*6,cx+dirX*6,cz+dirZ*6,1.08,row===-4||row>3.5?soilMat:furrowMat,6);
        for(let c=-5.2;c<=5.2;c+=1.25){const px=cx+dirX*c,pz=cz+dirZ*c;const crop=new THREE.Mesh(new THREE.ConeGeometry(.09,.5,5),cropMat);crop.position.set(px-chunk.originX,terrainHeightAt(px,pz)+.25,pz-chunk.originZ);crop.castShadow=!!this.state.world?.shadows;chunk.group.add(crop);}
      }
      for(const side of [-1,1])for(let c=-6;c<=6;c+=1.5){const px=worldFx+dirX*c+perpX*side*5.2,pz=worldFz+dirZ*c+perpZ*side*5.2;const post=new THREE.Mesh(new THREE.BoxGeometry(.12,1.05,.12),timberMat);post.position.set(px-chunk.originX,terrainHeightAt(px,pz)+.52,pz-chunk.originZ);post.castShadow=!!this.state.world?.shadows;chunk.group.add(post);}
    }

    const barn=new THREE.Group();barn.position.set(lx-27,terrainHeightAt(x-27,z-20),lz-20);
    const barnBase=new THREE.Mesh(new THREE.BoxGeometry(9,4.8,7),timberMat);barnBase.position.y=2.4;barn.add(barnBase);
    const barnRoof=new THREE.Mesh(new THREE.ConeGeometry(6.7,3.3,4),roofMat);barnRoof.position.y=6;barnRoof.rotation.y=Math.PI/4;barnRoof.scale.z=.78;barn.add(barnRoof);
    const barnDoor=new THREE.Mesh(new THREE.BoxGeometry(2.4,3.2,.2),new THREE.MeshStandardMaterial({color:0x342116,roughness:1}));barnDoor.position.set(0,1.6,3.6);barn.add(barnDoor);chunk.group.add(barn);
    {const collider=this.registerCollider(x-27,z-20,4.1,'village',chunk.key);collider.height=7;chunk.colliders.push(collider);}

    const peopleCount=6+Math.floor(random()*4);
    const firstNames=['Mara','Freya','Liv','Runa','Hilda','Edda','Alrik','Konrad','Sven','Borin','Tamme','Jorin','Lene','Falk','Rika'];
    const people=Array.from({length:peopleCount},(_,i)=>firstNames[(i+Math.floor(random()*firstNames.length))%firstNames.length]);
    const village={name,x,z,people,buildings:houseCount+2,npcs:[],chunkKey:chunk.key,type:villageType};
    chunk.villages.push(village);this.villages.push(village);
    for(let i=0;i<peopleCount;i+=1){
      const angle=random()*Math.PI*2,radius=5+random()*12,worldPx=x+Math.cos(angle)*radius,worldPz=z+Math.sin(angle)*radius,px=worldPx-chunk.originX,pz=worldPz-chunk.originZ;
      const group=this.createVillageNpcPlaceholder(chunk,px,pz,worldPx,worldPz,i);
      const npc={id:`npc-${chunk.key}-${i}`,name:people[i],village:name,group,x:worldPx,z:worldPz,angle:angle+random()*2,nextTurn:0,chunkKey:chunk.key};
      village.npcs.push(npc);chunk.npcs.push(npc);this.npcs.push(npc);
      const hotspot={id:npc.id,type:'npc',x:worldPx,z:worldPz,radius:2.4,label:`Mit ${people[i]} sprechen`,data:npc,chunkKey:chunk.key};chunk.hotspots.push(hotspot);this.hotspots.push(hotspot);
    }
    const villageHotspot={id:`village-${chunk.key}`,type:'village',x,z,radius:30,label:`${name} besuchen`,data:{village:name},chunkKey:chunk.key};
    const marketHotspot={id:`market-${chunk.key}`,type:'market',x:x+8,z:z+5,radius:8,label:`Mit ${name} handeln`,data:{village:name},chunkKey:chunk.key};
    const wellHotspot={id:`well-${chunk.key}`,type:'well',x,z,radius:5,label:'Am Dorfbrunnen Wasser holen',data:{village:name},chunkKey:chunk.key};
    chunk.hotspots.push(villageHotspot,marketHotspot,wellHotspot);this.hotspots.push(villageHotspot,marketHotspot,wellHotspot);
  }

  buildChunkLandmarks(chunk) {
    const density=this.state.world?.landmarkDensity==='low'?.55:this.state.world?.landmarkDensity==='high'?1.45:1;
    const chance=hash2(chunk.cx,chunk.cz,WORLD_SEED+1901);
    if(chance<1-.24*density)return;
    const random=seededRandom((Math.imul(chunk.cx+1701,1103515245)^Math.imul(chunk.cz+2903,12345)^(WORLD_SEED+1907))>>>0);
    const lx=24+random()*(CHUNK_SIZE-48),lz=24+random()*(CHUNK_SIZE-48),x=chunk.originX+lx,z=chunk.originZ+lz,y=terrainHeightAt(x,z);
    if(y<-2||Math.abs(x-riverCenter(z))<24||chunk.villages.some(v=>Math.hypot(x-v.x,z-v.z)<55))return;
    const roll=random();
    let type=roll<.25?'cave':roll<.5?'ruin':roll<.72?'hunter-camp':roll<.88?'shrine':'mine';
    const group=new THREE.Group();group.position.set(lx,y,lz);chunk.group.add(group);
    const rock=new THREE.MeshStandardMaterial({color:0x5f625d,roughness:1,flatShading:true}),wood=new THREE.MeshStandardMaterial({color:0x5c3c28,roughness:1}),stone=new THREE.MeshStandardMaterial({color:0x777268,roughness:1});
    let title='',text='',hotspotType='landmark',label='Ort untersuchen';
    if(type==='cave'||type==='mine'){
      for(let i=0;i<9;i++){const a=Math.PI*i/8;const boulder=new THREE.Mesh(new THREE.DodecahedronGeometry(1.8+random()*1.2,0),rock);boulder.position.set(Math.cos(a)*5,1.2+Math.sin(a)*3.6,Math.sin(a)*1.4);boulder.scale.y=1.2;boulder.rotation.set(random(),random(),random());group.add(boulder);}
      const dark=new THREE.Mesh(new THREE.CircleGeometry(4.3,20),new THREE.MeshBasicMaterial({color:0x030404}));dark.position.set(0,2.4,-.35);group.add(dark);
      title=type==='mine'?'Altes Erzbergwerk':'Verborgene Höhle';text=type==='mine'?'Ein verlassenes Bergwerk mit Eisenerz und tiefen Stollen.':'Eine natürliche Höhle, in der seltene Rohstoffe und Gefahren warten.';hotspotType=type==='mine'?'mine':'cave';label=type==='mine'?'Bergwerk erkunden':'Höhle erkunden';
    }else if(type==='ruin'){
      for(let i=0;i<8;i++){const block=new THREE.Mesh(new THREE.BoxGeometry(2.4+random()*2,1.8+random()*3,.9+random()*.5),stone);block.position.set((i%4)*3.4-5,block.geometry.parameters.height/2,Math.floor(i/4)*6-3);block.rotation.y=(random()-.5)*.5;group.add(block);}title='Vergessene Ruinen';text='Verfallene Mauern einer alten Siedlung. Zwischen den Steinen können Münzen und Wissen verborgen sein.';label='Ruinen durchsuchen';
    }else if(type==='hunter-camp'){
      const tent=new THREE.Mesh(new THREE.ConeGeometry(4,3.5,4),new THREE.MeshStandardMaterial({color:0x72583c,roughness:1,side:THREE.DoubleSide}));tent.rotation.y=Math.PI/4;tent.position.set(0,1.75,0);group.add(tent);for(let i=0;i<6;i++){const log=new THREE.Mesh(new THREE.CylinderGeometry(.15,.18,2,6),wood);log.rotation.z=Math.PI/2;log.rotation.y=i;log.position.set(6*Math.cos(i),.3,6*Math.sin(i));group.add(log);}title='Verlassenes Jägerlager';text='Ein Lager mit Spuren von Jägern. Vorräte könnten noch brauchbar sein.';hotspotType='encounter';label='Jägerlager durchsuchen';
    }else{
      const base=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.7,1.1,8),stone);base.position.y=.55;group.add(base);const pillar=new THREE.Mesh(new THREE.BoxGeometry(1.1,5.5,1.1),stone);pillar.position.y=3.5;group.add(pillar);const flame=new THREE.Mesh(new THREE.SphereGeometry(.45,8,6),new THREE.MeshStandardMaterial({color:0xffd36a,emissive:0xff8a20,emissiveIntensity:1.4}));flame.position.y=6.4;group.add(flame);title='Alter Wegschrein';text='Ein Schrein früher Reisender. Eine kurze Rast stärkt Moral und Wärme.';label='Am Schrein rasten';
    }
    const id=`landmark-${type}-${chunk.key}`;
    const hotspot={id,type:hotspotType,x,z,radius:9,label,data:{id,title,text,type},chunkKey:chunk.key};
    chunk.hotspots.push(hotspot);this.hotspots.push(hotspot);
  }

  unloadWorldChunk(key, chunk) {
    if (!chunk) return;
    chunk.group.removeFromParent();
    chunk.group.traverse((object)=>{if(object.geometry)object.geometry.dispose?.();const mats=Array.isArray(object.material)?object.material:[object.material];mats.forEach((mat)=>mat?.dispose?.());});
    for (const collider of chunk.colliders || []) this.unregisterCollider(collider);
    const resources=new Set(chunk.resources||[]),hotspots=new Set(chunk.hotspots||[]),villages=new Set(chunk.villages||[]),npcs=new Set(chunk.npcs||[]);
    this.resourceNodes=this.resourceNodes.filter((node)=>!resources.has(node));
    this.hotspots=this.hotspots.filter((node)=>!hotspots.has(node));
    this.villages=this.villages.filter((v)=>!villages.has(v));
    this.npcs=this.npcs.filter((npc)=>!npcs.has(npc));
    for(const doorId of chunk.doors||[])this.villageDoors.delete(doorId);
    this.seasonMaterials=this.seasonMaterials.filter((entry)=>entry.chunkKey!==key);
    this.chunks.delete(key);
  }

  rebuildStreamedWorld() {
    for (const [key,chunk] of [...this.chunks]) this.unloadWorldChunk(key,chunk);
    this.lastChunkCenter='';
    this.applyWorldRenderSettings(true);
    this.updateChunkStreaming(true);
  }

  buildTerrain() {
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, color: 0xffffff });
    this.terrainMaterial = material;
    this.terrain = new THREE.Mesh(makeTerrainGeometry(), material);
    this.terrain.receiveShadow = false;
    this.scene.add(this.terrain);
    this.seasonMaterials.push({ material, kind: 'ground' });
    const mountainMat = new THREE.MeshStandardMaterial({ color: 0x73776d, roughness: 1, flatShading: true });
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xe8eeec, roughness: .92, flatShading: true });
    const peaks = [[-350,-230,72,90],[340,-275,88,104],[292,322,76,92],[-318,310,82,86],[58,-360,62,68]];
    for (const [x,z,r,h] of peaks) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 9, 4), mountainMat.clone());
      cone.position.set(x, terrainHeightAt(x,z) + h * .34, z);
      cone.rotation.y = x * .01;
      this.scene.add(cone);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(r * .43, h * .3, 9, 1), snowMat.clone());
      cap.position.set(x, cone.position.y + h * .35, z);
      cap.rotation.y = cone.rotation.y;
      this.scene.add(cap);
      this.seasonMaterials.push({ material: cone.material, kind: 'rock' }, { material: cap.material, kind: 'snowcap' });
    }
  }

  buildWater() {
    const material = new THREE.MeshPhysicalMaterial({ color: 0x3e7890, transparent: true, opacity: .78, roughness: .22, metalness: .05, transmission: .08, side: THREE.DoubleSide });
    const vertices = [];
    const indices = [];
    const segments = 360;
    for (let i = 0; i <= segments; i += 1) {
      const z = -WORLD_HALF + (WORLD_HALF * 2) * i / segments;
      const center = riverCenter(z);
      const width = 14 + 4 * Math.sin(i * .29) ** 2;
      vertices.push(center - width, WATER_LEVEL, z, center + width, WATER_LEVEL, z);
      if (i < segments) {
        const a = i * 2;
        indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    this.river = new THREE.Mesh(geometry, material);
    this.scene.add(this.river);
    const lake = new THREE.Mesh(new THREE.CircleGeometry(48, 48), material.clone());
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(188, WATER_LEVEL + .02, -185);
    lake.scale.y = .72;
    this.scene.add(lake);
    this.waterMaterials = [material, lake.material];
    this.hotspots.push({ id: 'river-water', type: 'water', x: -5, z: 120, radius: 40, label: 'Wasser schöpfen' });
    this.hotspots.push({ id: 'lake-water', type: 'water', x: 188, z: -185, radius: 55, label: 'Wasser schöpfen' });
  }

  buildOceanZone(){
    const mat=new THREE.MeshPhysicalMaterial({color:0x245c78,transparent:true,opacity:.86,roughness:.15,metalness:.02,transmission:.06,side:THREE.DoubleSide});
    // Das Meer liegt bewusst sichtbar oberhalb der normalen Bodendecke und nah genug,
    // dass es ohne Owner-Teleport erreichbar bleibt. Fische schwimmen unter dieser Hoehe.
    const seaX=760,seaZ=-520,seaY=1.15,seaWidth=620,seaDepth=500;
    const sea=new THREE.Mesh(new THREE.PlaneGeometry(seaWidth,seaDepth,1,1),mat);sea.rotation.x=-Math.PI/2;sea.position.set(seaX,seaY,seaZ);sea.name='center-ocean-zone';this.scene.add(sea);this.oceanZone={x:seaX,z:seaZ,y:seaY,width:seaWidth,depth:seaDepth,mesh:sea};this.waterMaterials.push(mat);
    this.hotspots.push({id:'ocean-water',type:'water',x:seaX-seaWidth*.34,z:seaZ,radius:72,label:'Meerwasser'});
  }

  spawnMagicSpider(){
    this.magicSpider?.group?.removeFromParent?.();this.magicSpider=null;const profile=ANIMAL_PROFILES.spider;if(!profile||!this.player)return;
    const x=clamp(this.state.world.spawnX+78,this.worldBounds.minX+20,this.worldBounds.maxX-20),z=clamp(this.state.world.spawnZ-64,this.worldBounds.minZ+20,this.worldBounds.maxZ-20);const animal=this.createAnimal('spider',x,z,9001);if(!animal)return;animal.homeX=x;animal.homeZ=z;animal.roamRadius=34;animal.hp=145;animal.maxHp=145;animal.aggressive=true;animal.group.name='center-magic-spider';this.animals.push(animal);this.magicSpider=animal;
  }

  spawnAmbientBirds(){
    for(const bird of this.ambientBirds)bird.group?.removeFromParent?.();this.ambientBirds=[];if(!this.centerAssetTemplates.has('birds')||!this.player)return;const count=this.isMobile?2:4;
    for(let i=0;i<count;i+=1){const visual=this.createAnimalVisual('bird');if(!visual)continue;const group=new THREE.Group();group.add(visual);this.scene.add(group);const bird={group,visual,angle:i/count*Math.PI*2,radius:28+i*11,height:12+i*2,speed:.28+i*.04,phase:i*1.7};this.ambientBirds.push(bird);}
  }

  spawnOceanFish(){
    for(const fish of this.oceanFish)fish.group?.removeFromParent?.();this.oceanFish=[];if(!this.oceanZone)return;const types=['clownfish','clownfish','clownfish','shark','orca','clownfish'];
    types.forEach((type,i)=>{const visual=this.createAnimalVisual(type);if(!visual)return;const group=new THREE.Group();group.add(visual);this.scene.add(group);const fish={group,visual,type,angle:i/types.length*Math.PI*2,radius:45+i*18,speed:.16+i*.014,phase:i*.9};this.oceanFish.push(fish);});
  }

  updateAmbientCreatures(delta,now=performance.now()){
    const px=this.player?.position.x||0,pz=this.player?.position.z||0;
    for(const bird of this.ambientBirds){bird.angle+=delta*bird.speed;const r=bird.radius+Math.sin(now*.0004+bird.phase)*8,bx=px+Math.cos(bird.angle)*r,bz=pz+Math.sin(bird.angle)*r,by=terrainHeightAt(bx,bz)+bird.height+Math.sin(now*.002+bird.phase)*2;bird.group.position.set(bx,by,bz);bird.group.rotation.y=-bird.angle+Math.PI/2;this.setAnimalAnimation(bird.visual,true,delta);}
    if(this.oceanZone){for(const fish of this.oceanFish){fish.angle+=delta*fish.speed;const bx=this.oceanZone.x+Math.cos(fish.angle+fish.phase)*fish.radius,bz=this.oceanZone.z+Math.sin(fish.angle*1.13+fish.phase)*Math.min(this.oceanZone.depth*.34,fish.radius*1.35),by=(this.oceanZone.y??WATER_LEVEL)-1.35-Math.sin(now*.0014+fish.phase)*.35;fish.group.position.set(bx,by,bz);fish.group.rotation.y=-fish.angle;this.setAnimalAnimation(fish.visual,true,delta);}}
  }

  makePath(points, width = 5.5, color = 0x776246) {
    const material = new THREE.MeshStandardMaterial({ color, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1 });
    for (let i = 0; i < points.length - 1; i += 1) {
      const [x1,z1] = points[i];
      const [x2,z2] = points[i + 1];
      const dx = x2 - x1;
      const dz = z2 - z1;
      const length = Math.hypot(dx, dz);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, length), material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = -Math.atan2(dx, dz);
      const x = (x1 + x2) / 2;
      const z = (z1 + z2) / 2;
      mesh.position.set(x, terrainHeightAt(x,z) + .07, z);
      this.scene.add(mesh);
    }
  }

  buildRoadNetwork() {
    this.makePath([[-42,176],[-10,130],[54,104],[112,72],[148,20],[158,-54],[174,-126],[174,-210]], 6.2);
    this.makePath([[-42,176],[-90,116],[-135,20],[-182,-72],[-144,-158],[-88,-286]], 5.6);
    this.makePath([[-182,-72],[-80,-55],[20,-44],[92,-102],[174,-210]], 5);
    const bridgePositions = [118,-48,-192];
    for (const z of bridgePositions) this.createBridge(riverCenter(z), z, 34, 7);
  }

  createBridge(x, z, length = 34, width = 7) {
    const group = new THREE.Group();
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x765039, roughness: .9 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x4f3424, roughness: 1 });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(length, .45, width), deckMat);
    deck.position.y = WATER_LEVEL + 1.75;
    group.add(deck);
    for (const side of [-1,1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(length, .22, .18), railMat);
      rail.position.set(0, WATER_LEVEL + 2.65, side * (width / 2 - .22));
      group.add(rail);
      for (let px = -length / 2 + 1; px < length / 2; px += 3.2) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(.18, 1.5, .18), railMat);
        post.position.set(px, WATER_LEVEL + 2.15, side * (width / 2 - .22));
        group.add(post);
      }
    }
    group.position.set(x, 0, z);
    group.rotation.y = Math.PI / 2;
    this.scene.add(group);
  }

  buildVillages() {
    const configs = [
      { name: 'Falkenau', x: 112, z: 72, color: 0x9b6a3e, people: ['Alrik','Mara','Hilda'] },
      { name: 'Steinfurt', x: -182, z: -72, color: 0x77543b, people: ['Edda','Konrad','Runa'] },
      { name: 'Seehof', x: 174, z: -210, color: 0x8d7144, people: ['Borin','Liv','Tamme'] },
      { name: 'Hochwald', x: -88, z: -286, color: 0x6c6941, people: ['Wigand','Freya','Sven'] }
    ];
    for (const config of configs) this.createVillage(config);
  }

  createVillage(config) {
    const village = { ...config, buildings: [], npcs: [] };
    const houseOffsets = [[-18,-14,0.2],[2,-20,-.25],[20,-8,.5],[-22,12,-.65],[12,15,.15]];
    houseOffsets.forEach(([dx,dz,rot], index) => {
      const house = this.createHouse(config.x + dx, config.z + dz, 1 + (index % 2) * .12, rot, config.color);
      village.buildings.push(house);
    });
    const inn = this.createHouse(config.x + 2, config.z + 2, 1.45, .08, 0x8b5b3b, true);
    village.buildings.push(inn);
    this.createWell(config.x - 6, config.z + 4);
    this.createMarket(config.x + 20, config.z + 14, config.name);
    this.createField(config.x - 28, config.z + 30, 16, 12);
    this.createField(config.x - 8, config.z + 34, 16, 12);
    config.people.forEach((name, index) => {
      const angle = index / config.people.length * Math.PI * 2;
      const npc = this.createNpc(name, config.x + Math.cos(angle) * 10, config.z + Math.sin(angle) * 10, config.name, index);
      village.npcs.push(npc);
    });
    this.hotspots.push({ id: `village-${config.name}`, type: 'village', x: config.x, z: config.z, radius: 30, label: `${config.name} ansehen`, data: { village: config.name } });
    this.villages.push(village);
  }

  createHouse(x, z, scale = 1, rotation = 0, color = 0x8b5d3d, large = false) {
    const group = new THREE.Group();
    const w = (large ? 8.6 : 6.3) * scale;
    const d = (large ? 6.5 : 5.1) * scale;
    const h = (large ? 4.6 : 3.8) * scale;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 1 }));
    wall.position.y = h / 2;
    group.add(wall);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d) * .72, h * .62, 4), new THREE.MeshStandardMaterial({ color: 0x4e3327, roughness: 1 }));
    roof.position.y = h + h * .28;
    roof.rotation.y = Math.PI / 4;
    roof.scale.z = d / w;
    group.add(roof);
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.15 * scale, 2.1 * scale, .16), new THREE.MeshStandardMaterial({ color: 0x3d2619 }));
    door.position.set(0, 1.05 * scale, d / 2 + .09);
    group.add(door);
    for (const sx of [-1,1]) {
      const windowMesh = new THREE.Mesh(new THREE.PlaneGeometry(.9 * scale, .8 * scale), new THREE.MeshStandardMaterial({ color: 0xc9d7b4, emissive: 0x30240d, emissiveIntensity: .35 }));
      windowMesh.position.set(sx * w * .28, 2.25 * scale, d / 2 + .091);
      group.add(windowMesh);
    }
    group.position.set(x, terrainHeightAt(x,z), z);
    group.rotation.y = rotation;
    this.scene.add(group);
    this.addColliderFromCenter(x, z, w * .52, d * .52, rotation);
    return group;
  }

  createWell(x, z) {
    const group = new THREE.Group();
    const stone = new THREE.MeshStandardMaterial({ color: 0x77736a, roughness: 1 });
    const wood = new THREE.MeshStandardMaterial({ color: 0x5b3923, roughness: 1 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.2, 1.25, 12), stone);
    base.position.y = .63;
    group.add(base);
    for (const sx of [-1,1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(.25, 3.4, .25), wood);
      post.position.set(sx * 1.6, 2.1, 0);
      group.add(post);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(3.6, .25, .25), wood);
    beam.position.y = 3.65;
    group.add(beam);
    group.position.set(x, terrainHeightAt(x,z), z);
    this.scene.add(group);
    this.hotspots.push({ id: `well-${x}-${z}`, type: 'well', x, z, radius: 4, label: 'Am Brunnen Wasser holen' });
  }

  createMarket(x, z, village) {
    const group = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: 0x6b452c, roughness: 1 });
    const cloth = new THREE.MeshStandardMaterial({ color: village === 'Seehof' ? 0x416f85 : 0x8e4e3b, side: THREE.DoubleSide });
    const table = new THREE.Mesh(new THREE.BoxGeometry(5, .35, 2.4), wood);
    table.position.y = 1.05;
    group.add(table);
    for (const sx of [-1,1]) for (const sz of [-1,1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(.2, 3.2, .2), wood);
      post.position.set(sx * 2.2, 1.6, sz * .9);
      group.add(post);
    }
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 3), cloth);
    roof.rotation.x = -Math.PI / 2;
    roof.position.y = 3.15;
    group.add(roof);
    group.position.set(x, terrainHeightAt(x,z), z);
    this.scene.add(group);
    this.hotspots.push({ id: `market-${village}`, type: 'market', x, z, radius: 5, label: `Mit ${village} handeln`, data: { village } });
  }

  createField(x, z, width, depth) {
    const group = new THREE.Group();
    const soil = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), new THREE.MeshStandardMaterial({ color: 0x5a402b, roughness: 1 }));
    soil.rotation.x = -Math.PI / 2;
    soil.position.y = .05;
    group.add(soil);
    const cropMat = new THREE.MeshStandardMaterial({ color: 0xb2a14d, roughness: 1 });
    for (let ix = -width/2 + 1; ix < width/2; ix += 1.4) {
      for (let iz = -depth/2 + 1; iz < depth/2; iz += 1.5) {
        const crop = new THREE.Mesh(new THREE.ConeGeometry(.09, .65, 4), cropMat);
        crop.position.set(ix, .35, iz);
        group.add(crop);
      }
    }
    group.position.set(x, terrainHeightAt(x,z), z);
    this.scene.add(group);
  }

  colliderBucketKey(x, z) { return `${Math.floor(x / COLLIDER_CELL_SIZE)}:${Math.floor(z / COLLIDER_CELL_SIZE)}`; }

  registerCollider(x, z, radius, source = 'world', chunkKeyValue = '', node = null) {
    const inferredHeight=node?.type==='bush'?1.05:node?.archetype==='fallen'?.85:node?.type==='rock'?Math.max(.75,(node?.scale||1)*1.45):node?.archetype==='broken'?Math.max(1.5,(node?.scale||1)*3):source==='village'?6.5:source==='owned'?7:Math.max(3,(node?.scale||1)*6);
    const collider = { x: Number(x), z: Number(z), radius: Math.max(.18, (Number(radius) || 1) * .86), height: inferredHeight, source, chunkKey: chunkKeyValue, node, active: true, bucketKeys: [] };
    const minX=Math.floor((collider.x-collider.radius)/COLLIDER_CELL_SIZE),maxX=Math.floor((collider.x+collider.radius)/COLLIDER_CELL_SIZE),minZ=Math.floor((collider.z-collider.radius)/COLLIDER_CELL_SIZE),maxZ=Math.floor((collider.z+collider.radius)/COLLIDER_CELL_SIZE);
    for(let gx=minX;gx<=maxX;gx+=1)for(let gz=minZ;gz<=maxZ;gz+=1){const key=`${gx}:${gz}`;let bucket=this.collisionBuckets.get(key);if(!bucket){bucket=new Set();this.collisionBuckets.set(key,bucket);}bucket.add(collider);collider.bucketKeys.push(key);}
    this.colliders.push(collider); return collider;
  }

  unregisterCollider(collider) {
    if(!collider)return;
    for(const key of collider.bucketKeys||[]){const bucket=this.collisionBuckets.get(key);bucket?.delete(collider);if(bucket&&!bucket.size)this.collisionBuckets.delete(key);}
    const index=this.colliders.indexOf(collider);if(index>=0)this.colliders.splice(index,1);collider.active=false;
  }

  addColliderFromCenter(x, z, halfW, halfD, rotation = 0, source = 'world') {
    const radius = Math.max(halfW, halfD) + Math.abs(Math.sin(rotation)) * 1.5;
    return this.registerCollider(x,z,radius,source);
  }

  buildResources() {
    const random = seededRandom(742019);
    const treeNodes = [];
    const rockNodes = [];
    const bushNodes = [];
    const avoid = (x,z) => {
      if (Math.abs(x - riverCenter(z)) < 23) return true;
      for (const village of this.villages) if (Math.hypot(x-village.x,z-village.z) < 52) return true;
      if (Math.hypot(x+42,z-176) < 55) return true;
      return terrainHeightAt(x,z) > 45;
    };
    for (let i = 0; i < 220; i += 1) {
      let x, z, guard = 0;
      do { x = (random() * 2 - 1) * 392; z = (random() * 2 - 1) * 392; guard += 1; } while (avoid(x,z) && guard < 40);
      treeNodes.push({ id: `tree-${i}`, type: 'tree', x, z, y: terrainHeightAt(x,z), scale: .72 + random() * .8, active: true });
    }
    for (let i = 0; i < 115; i += 1) {
      let x, z, guard = 0;
      do { x = (random() * 2 - 1) * 400; z = (random() * 2 - 1) * 400; guard += 1; } while ((avoid(x,z) || terrainHeightAt(x,z) < -1) && guard < 40);
      rockNodes.push({ id: `rock-${i}`, type: 'rock', x, z, y: terrainHeightAt(x,z), scale: .45 + random() * 1.1, active: true });
    }
    for (let i = 0; i < 145; i += 1) {
      let x, z;
      do { x = (random() * 2 - 1) * 396; z = (random() * 2 - 1) * 396; } while (Math.abs(x-riverCenter(z)) < 18 || terrainHeightAt(x,z) > 42);
      bushNodes.push({ id: `bush-${i}`, type: 'bush', x, z, y: terrainHeightAt(x,z), scale: .6 + random() * .7, active: true });
    }
    this.createTreeInstances(treeNodes);
    this.createRockInstances(rockNodes);
    this.createBushInstances(bushNodes);
    this.resourceNodes.push(...treeNodes, ...rockNodes, ...bushNodes);
    this.restoreHarvestedNodes();
  }

  createTreeInstances(nodes) {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3824, roughness: 1 });
    const leafMat = new THREE.MeshStandardMaterial({ color: SEASONS[this.state.season].foliage, roughness: 1, flatShading: true });
    const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.36,.52,4.3,6), trunkMat, nodes.length);
    const crowns = new THREE.InstancedMesh(new THREE.ConeGeometry(2.25,5.8,7,2), leafMat, nodes.length);
    const matrix = new THREE.Matrix4();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const position = new THREE.Vector3();
    nodes.forEach((node,index) => {
      const yaw = (index * 1.618) % (Math.PI * 2);
      rotation.setFromAxisAngle(new THREE.Vector3(0,1,0), yaw);
      scale.set(node.scale,node.scale,node.scale);
      position.set(node.x,node.y+2.15*node.scale,node.z);
      matrix.compose(position,rotation,scale); trunks.setMatrixAt(index,matrix);
      position.set(node.x,node.y+5.45*node.scale,node.z);
      matrix.compose(position,rotation,scale); crowns.setMatrixAt(index,matrix);
      node.instanceIndex = index; node.instanceMeshes = [trunks,crowns];
    });
    trunks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    crowns.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(trunks,crowns);
    this.treeLeafMaterial = leafMat;
  }

  createRockInstances(nodes) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x777b77, roughness: 1, flatShading: true });
    const mesh = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1.35,0), mat, nodes.length);
    const matrix = new THREE.Matrix4();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    nodes.forEach((node,index) => {
      rotation.setFromEuler(new THREE.Euler(index*.17,index*.39,index*.11));
      scale.set(node.scale*1.15,node.scale*.8,node.scale);
      matrix.compose(new THREE.Vector3(node.x,node.y+.65*node.scale,node.z),rotation,scale);
      mesh.setMatrixAt(index,matrix);
      node.instanceIndex=index; node.instanceMeshes=[mesh];
    });
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(mesh);
    this.rockMaterial = mat;
  }

  createBushInstances(nodes) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x486f37, roughness: 1, flatShading: true });
    const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.2,1), mat, nodes.length);
    const matrix = new THREE.Matrix4();
    nodes.forEach((node,index) => {
      matrix.compose(new THREE.Vector3(node.x,node.y+.75*node.scale,node.z),new THREE.Quaternion(),new THREE.Vector3(node.scale*1.4,node.scale*.85,node.scale));
      mesh.setMatrixAt(index,matrix);
      node.instanceIndex=index; node.instanceMeshes=[mesh];
    });
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.scene.add(mesh);
    this.bushMaterial = mat;
  }

  setResourceVisible(node, visible) {
    if (node.instanceEntries?.length) {
      const hiddenMatrix=new THREE.Matrix4().makeScale(.0001,.0001,.0001);
      for(const entry of node.instanceEntries){entry.mesh.setMatrixAt(entry.index,visible?entry.matrix:hiddenMatrix);entry.mesh.instanceMatrix.needsUpdate=true;}
      node.active=visible;if(node.collider)node.collider.active=visible;return;
    }
    const matrix = new THREE.Matrix4();
    const scale = visible ? node.scale : 0.0001;
    const rotation = new THREE.Quaternion();
    if (node.type === 'tree') {
      const yaw = (node.instanceIndex * 1.618) % (Math.PI*2);
      rotation.setFromAxisAngle(new THREE.Vector3(0,1,0),yaw);
      const px=node.localCoordinates?node.x-node.chunkOriginX:node.x,pz=node.localCoordinates?node.z-node.chunkOriginZ:node.z;
      matrix.compose(new THREE.Vector3(px,node.y+2.15*node.scale,pz),rotation,new THREE.Vector3(scale,scale,scale));
      node.instanceMeshes[0].setMatrixAt(node.instanceIndex,matrix);
      matrix.compose(new THREE.Vector3(px,node.y+5.45*node.scale,pz),rotation,new THREE.Vector3(scale,scale,scale));
      node.instanceMeshes[1].setMatrixAt(node.instanceIndex,matrix);
    } else if (node.type === 'rock') {
      rotation.setFromEuler(new THREE.Euler(node.instanceIndex*.17,node.instanceIndex*.39,node.instanceIndex*.11));
      {const px=node.localCoordinates?node.x-node.chunkOriginX:node.x,pz=node.localCoordinates?node.z-node.chunkOriginZ:node.z;matrix.compose(new THREE.Vector3(px,node.y+.65*node.scale,pz),rotation,new THREE.Vector3(scale*1.15,scale*.8,scale));}
      node.instanceMeshes[0].setMatrixAt(node.instanceIndex,matrix);
    } else {
      {const px=node.localCoordinates?node.x-node.chunkOriginX:node.x,pz=node.localCoordinates?node.z-node.chunkOriginZ:node.z;matrix.compose(new THREE.Vector3(px,node.y+.75*node.scale,pz),rotation,new THREE.Vector3(scale*1.4,scale*.85,scale));}
      node.instanceMeshes[0].setMatrixAt(node.instanceIndex,matrix);
    }
    node.instanceMeshes.forEach((mesh) => { mesh.instanceMatrix.needsUpdate = true; });
    node.active = visible;if(node.collider)node.collider.active=visible;
  }

  restoreHarvestedNodes() {
    const now = Date.now();
    for (const node of this.resourceNodes) {
      const until = Number(this.state.harvested[node.id] || 0);
      if (until > now) this.setResourceVisible(node,false);
      else { this.setResourceVisible(node,true); if (until) delete this.state.harvested[node.id]; }
    }
  }

  buildWildlife() {
    for(const animal of this.animals){animal.mixer?.stopAllAction?.();animal.group?.removeFromParent();}
    this.animals.length=0;this.mountedHorse=null;
    const random=seededRandom((this.state.world?.spawnIndex||1)+314159),cx=this.player?.position.x??this.state.position.x??0,cz=this.player?.position.z??this.state.position.z??0;
    const types=['fox','cow','horse','owl','wolf1','wolf2','fox','cow','horse','wolf1','wolf2','owl','fox','cow','wolf1','wolf2','horse','fox','cow','owl','shark','orca','shark','orca'];
    for(let i=0;i<types.length;i+=1){const type=types[i],profile=ANIMAL_PROFILES[type];let x=cx,z=cz,y=0;if(profile.zone==='water'){z=clamp(cz+(random()*2-1)*(80+random()*240),-WORLD_HALF+40,WORLD_HALF-40);x=riverCenter(z)+(random()*2-1)*6;y=WATER_LEVEL-1.2-(random()*.65);}else{const angle=random()*Math.PI*2,radius=55+random()*310;x=clamp(cx+Math.cos(angle)*radius,-WORLD_HALF+20,WORLD_HALF-20);z=clamp(cz+Math.sin(angle)*radius,-WORLD_HALF+20,WORLD_HALF-20);if(Math.abs(x-riverCenter(z))<28)x+=x<riverCenter(z)?-38:38;y=terrainHeightAt(x,z)+(profile.zone==='air'?7+random()*9:0);}const animal=this.createAnimal(type,x,z,i,y);if(animal)this.animals.push(animal);}
  }

  createAnimal(type,x,z,index,y=null) {
    const profile=ANIMAL_PROFILES[type];if(!profile)return null;const group=new THREE.Group();group.name=`center-animal-${type}-${index}`;const visual=this.createAnimalVisual(type);
    if(visual)group.add(visual);else{const fallback=new THREE.Mesh(new THREE.CapsuleGeometry(.42,.9,3,7),new THREE.MeshStandardMaterial({color:0x776b5c,roughness:1}));fallback.rotation.z=Math.PI/2;fallback.position.y=.6;group.add(fallback);}
    const baseY=y===null?(profile.zone==='water'?WATER_LEVEL-1.3:terrainHeightAt(x,z)):y;group.position.set(x,baseY,z);this.scene.add(group);
    return {id:`animal-${type}-${index}`,type,profile,group,visual,mixer:visual?.userData?.mixer||null,idleAction:visual?.userData?.idleAction||null,moveAction:visual?.userData?.moveAction||null,x,z,y:baseY,targetX:x,targetZ:z,targetY:baseY,speed:profile.speed,nextTurn:0,active:true,respawnAt:0,hp:100,predatorTarget:null,attackCooldown:0,tamed:type==='horse'&&!!this.state.horseTamed};
  }

  relocateAnimal(animal,minRadius=100,maxRadius=310){
    if(!animal?.profile)return;const px=this.player?.position.x||0,pz=this.player?.position.z||0,random=Math.random;const profile=animal.profile;
    if(profile.zone==='water'){animal.z=clamp(pz+(random()*2-1)*(minRadius+random()*(maxRadius-minRadius)),-WORLD_HALF+40,WORLD_HALF-40);animal.x=riverCenter(animal.z)+(random()*2-1)*6;animal.y=WATER_LEVEL-1.25-random()*.7;}
    else{const angle=random()*Math.PI*2,radius=minRadius+random()*(maxRadius-minRadius);animal.x=clamp(px+Math.cos(angle)*radius,-WORLD_HALF+20,WORLD_HALF-20);animal.z=clamp(pz+Math.sin(angle)*radius,-WORLD_HALF+20,WORLD_HALF-20);if(Math.abs(animal.x-riverCenter(animal.z))<28)animal.x+=animal.x<riverCenter(animal.z)?-38:38;animal.y=terrainHeightAt(animal.x,animal.z)+(profile.zone==='air'?7+random()*9:0);}
    animal.targetX=animal.x;animal.targetZ=animal.z;animal.targetY=animal.y;animal.group.position.set(animal.x,animal.y,animal.z);
  }

  interactHorse(animal){
    if(!animal||animal.type!=='horse')return;if(!this.state.horseTamed){this.state.horseTamed=true;animal.tamed=true;this.state.stats.horsesTamed=(this.state.stats.horsesTamed||0)+1;this.gainXp(25,'Reitpferd gezähmt');this.toast('🐎 Das Reitpferd vertraut dir jetzt. Noch einmal E drücken zum Aufsteigen.');this.saveState(true);return;}
    animal.tamed=true;if(this.mountedHorse===animal){this.dismountHorse();return;}if(this.mountedHorse)this.dismountHorse(true);this.mountedHorse=animal;animal.predatorTarget=null;animal.nextTurn=Infinity;this.toast('🐎 Aufgestiegen · W/A/S/D bewegen · Shift für Galopp · E zum Absteigen');this.saveState(true);
  }

  dismountHorse(silent=false){const horse=this.mountedHorse;if(!horse)return;this.mountedHorse=null;horse.nextTurn=performance.now()+1800;horse.targetX=horse.x+Math.cos(this.modelPivot?.rotation.y||0)*5;horse.targetZ=horse.z+Math.sin(this.modelPivot?.rotation.y||0)*5;if(!silent)this.toast('Vom Reitpferd abgestiegen.');}

  applyRidingPose(delta=.016){
    this.applyIdlePose(delta,false);const alpha=1-Math.exp(-Math.max(.001,delta)*8),q=(bone,euler)=>{if(!bone)return;const base=bone.userData.__centerIdleQuaternion||bone.userData.__centerBindQuaternion;if(!base)return;const target=base.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(euler.x||0,euler.y||0,euler.z||0)));bone.quaternion.slerp(target,alpha);};
    q(this.playerBones.upperRight,{x:-.48,z:-.18});q(this.playerBones.upperLeft,{x:-.48,z:.18});q(this.playerBones.lowerRight,{x:-.42});q(this.playerBones.lowerLeft,{x:-.42});q(this.playerBones.upperLegRight,{x:-.72,z:.2});q(this.playerBones.upperLegLeft,{x:-.72,z:-.2});q(this.playerBones.lowerLegRight,{x:1.05});q(this.playerBones.lowerLegLeft,{x:1.05});
  }

  buildLandmarks() {
    this.createRuins(48,-335);
    this.createCave(-303,294);
    this.createWatchTower(286,305);
    this.createStarterCamp(-42,176);
  }

  createRuins(x,z) {
    const mat=new THREE.MeshStandardMaterial({color:0x777268,roughness:1});
    for(let i=0;i<7;i+=1) { const block=new THREE.Mesh(new THREE.BoxGeometry(3+((i*7)%4),2.5+(i%3)*1.4,1.2),mat); block.position.set(x+(i%3)*4-4,terrainHeightAt(x,z)+(2.5+(i%3)*1.4)/2,z+Math.floor(i/3)*4-4); block.rotation.y=i*.36; this.scene.add(block); }
    this.hotspots.push({id:'ruins',type:'landmark',x,z,radius:10,label:'Alte Ruinen untersuchen',data:{title:'Ruinen von Altmark',text:'Verfallene Mauern erzählen von einer Siedlung, die vor vielen Generationen aufgegeben wurde.'}});
  }

  createCave(x,z) {
    const mat=new THREE.MeshStandardMaterial({color:0x464744,roughness:1,side:THREE.DoubleSide});
    const arch=new THREE.Mesh(new THREE.TorusGeometry(5.5,2.2,8,16,Math.PI),mat); arch.rotation.z=Math.PI; arch.position.set(x,terrainHeightAt(x,z)+2,z); this.scene.add(arch);
    const dark=new THREE.Mesh(new THREE.CircleGeometry(4.8,24),new THREE.MeshBasicMaterial({color:0x050606})); dark.position.set(x,terrainHeightAt(x,z)+1.7,z-.6); this.scene.add(dark);
    this.hotspots.push({id:'cave',type:'cave',x,z,radius:8,label:'Höhle erkunden'});
  }

  createWatchTower(x,z) {
    const wood=new THREE.MeshStandardMaterial({color:0x59402d,roughness:1});
    const group=new THREE.Group();
    for(const sx of [-1,1]) for(const sz of [-1,1]) { const post=new THREE.Mesh(new THREE.CylinderGeometry(.25,.35,12,6),wood); post.position.set(sx*2,6,sz*2); group.add(post); }
    const deck=new THREE.Mesh(new THREE.BoxGeometry(5.4,.45,5.4),wood); deck.position.y=9.5; group.add(deck);
    const roof=new THREE.Mesh(new THREE.ConeGeometry(4.2,3.4,4),new THREE.MeshStandardMaterial({color:0x463126})); roof.position.y=12; roof.rotation.y=Math.PI/4; group.add(roof);
    group.position.set(x,terrainHeightAt(x,z),z); this.scene.add(group);
    this.hotspots.push({id:'tower',type:'landmark',x,z,radius:8,label:'Wachturm besteigen',data:{title:'Wachturm am Nordpass',text:'Von hier aus überblickst du fast das gesamte Grenztal.'}});
  }

  createStarterCamp(x,z) {
    const fire=this.createBuildObject('campfire',x+2,z+1,0,false);
    fire.userData.decorative=true;
    const tentMat=new THREE.MeshStandardMaterial({color:0x6d5b3c,side:THREE.DoubleSide,roughness:1});
    const tent=new THREE.Mesh(new THREE.ConeGeometry(3.6,4.2,4),tentMat); tent.position.set(x-5,terrainHeightAt(x-5,z)+2.1,z+2); tent.rotation.y=Math.PI/4; this.scene.add(tent);
    this.hotspots.push({id:'starter-bed',type:'sleep',x:x-5,z:z+2,radius:5,label:'Bis zum Morgen schlafen'});
    this.hotspots.push({id:'starter-fire',type:'campfire',x:x+2,z:z+1,radius:4,label:'Am Lagerfeuer rasten'});
    const firewood=this.createFirewoodVisual(1.45);if(firewood){firewood.position.set(x+4.3,terrainHeightAt(x+4.3,z+2.4),z+2.4);firewood.rotation.y=.65;this.scene.add(firewood);const data={group:firewood,availableAt:0};this.firewoodPickups.push(data);this.hotspots.push({id:'starter-firewood',type:'firewood',x:x+4.3,z:z+2.4,radius:3,label:'Feuerholz aufnehmen',data});}
  }

  createNpc(name,x,z,village,index) {
    const group=this.makeWhiteNpcCharacter(index%3);
    group.scale.setScalar(.95);
    group.position.set(x,terrainHeightAt(x,z),z);
    this.scene.add(group);
    const label=this.makeLabel(name,village);
    label.position.y=2.35; group.add(label);
    const npc={id:`npc-${village}-${name}`,name,village,group,x,z,angle:index*1.9,recruited:false};
    this.npcs.push(npc);
    this.hotspots.push({id:npc.id,type:'npc',x,z,radius:4,label:`Mit ${name} sprechen`,data:npc});
    return npc;
  }

  makeLabel(title,subtitle) {
    const texture=roundedTexture(title,subtitle,{width:420,height:110,titleSize:31,subtitleSize:18});
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false}));
    sprite.scale.set(3.1,.82,1); sprite.renderOrder=999; return sprite;
  }

  buildSavedSettlement() {
    for(const saved of this.state.buildings) this.spawnSavedBuilding(saved);
  }

  spawnSavedBuilding(saved) {
    const object=this.createBuildObject(saved.type,Number(saved.x),Number(saved.z),Number(saved.rotation)||0,true);
    object.userData.buildId=saved.id;
    this.ownBuildingObjects.set(saved.id,object);
    this.addBuildingHotspots(saved);
  }

  createBuildObject(type,x,z,rotation=0,owned=true,ghost=false) {
    const group=new THREE.Group();
    const alpha=ghost?.45:1;
    const transparent=!!ghost;
    const wood=new THREE.MeshStandardMaterial({color:ghost?0x69c981:0x68462f,roughness:1,transparent,opacity:alpha});
    const stone=new THREE.MeshStandardMaterial({color:ghost?0x69c981:0x77736a,roughness:1,transparent,opacity:alpha});
    const roofMat=new THREE.MeshStandardMaterial({color:ghost?0x69c981:0x493026,roughness:1,transparent,opacity:alpha});
    if(type==='campfire') {
      const campfire=this.createCampfireAsset(ghost);if(campfire){group.add(campfire);group.userData.flame=campfire.userData.flame||null;group.userData.fireLight=campfire.userData.fireLight||null;}
      else {const fallback=new THREE.Mesh(new THREE.CylinderGeometry(.8,1,.35,8),ghost?stone:wood);fallback.position.y=.18;group.add(fallback);}
    } else if(type==='well') {
      const base=new THREE.Mesh(new THREE.CylinderGeometry(2,2.2,1.2,12),stone); base.position.y=.6; group.add(base);
      for(const sx of [-1,1]) { const post=new THREE.Mesh(new THREE.BoxGeometry(.25,3.4,.25),wood); post.position.set(sx*1.55,2,0); group.add(post); }
      const beam=new THREE.Mesh(new THREE.BoxGeometry(3.6,.25,.25),wood); beam.position.y=3.6; group.add(beam);
    } else if(type==='field') {
      const soil=new THREE.Mesh(new THREE.BoxGeometry(12,.22,9),new THREE.MeshStandardMaterial({color:ghost?0x69c981:0x4d3422,transparent,opacity:alpha})); soil.position.y=.11; group.add(soil);
      for(let ix=-5;ix<=5;ix+=1.1) for(let iz=-3.5;iz<=3.5;iz+=1.3) { const crop=new THREE.Mesh(new THREE.ConeGeometry(.07,.55,4),new THREE.MeshStandardMaterial({color:ghost?0x69c981:0xb4a049,transparent,opacity:alpha})); crop.position.set(ix,.35,iz); group.add(crop); }
    } else {
      const large=['storage','workshop','barn','huntingLodge','mine','tavern'].includes(type);
      const w=large?9:7.2,d=large?7:5.7,h=type==='woodshed'?3.2:4.3;
      if(type==='woodshed') {
        const floor=new THREE.Mesh(new THREE.BoxGeometry(w,.3,d),wood); floor.position.y=.15; group.add(floor);
        for(const sx of [-1,1]) for(const sz of [-1,1]) { const post=new THREE.Mesh(new THREE.BoxGeometry(.3,3.5,.3),wood); post.position.set(sx*w*.42,1.75,sz*d*.4); group.add(post); }
      } else {
        const base=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),type==='storage'?wood:stone); base.position.y=h/2; group.add(base);
        const door=new THREE.Mesh(new THREE.BoxGeometry(1.25,2.25,.18),wood); door.position.set(0,1.13,d/2+.1); group.add(door);
      }
      const roof=new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*.73,3.2,4),roofMat); roof.position.y=h+1.4; roof.rotation.y=Math.PI/4; roof.scale.z=d/w; group.add(roof);
    }
    group.position.set(x,terrainHeightAt(x,z),z); group.rotation.y=rotation; group.userData={type,owned,ghost}; this.scene.add(group);
    if(owned&&!ghost&&type!=='campfire'&&type!=='field'&&type!=='well') this.addColliderFromCenter(x,z,BUILDINGS[type]?.size||5,BUILDINGS[type]?.size||5,rotation,'owned');
    return group;
  }

  addBuildingHotspots(saved) {
    const labels={house:'Haus betreten und schlafen',campfire:'Am Lagerfeuer kochen',well:'Wasser aus dem Brunnen holen',storage:'Lagerhaus verwalten',workshop:'Werkstatt benutzen',woodshed:'Holzfällerlager verwalten',field:'Acker bewirtschaften',barn:'Scheunenproduktion abholen',huntingLodge:'Jagdhüttenproduktion abholen',mine:'Bergwerksproduktion abholen',tavern:'Taverne und Beziehungen verwalten'};
    this.hotspots.push({id:`build-${saved.id}`,type:`own-${saved.type}`,x:saved.x,z:saved.z,radius:BUILDINGS[saved.type].size*.72,label:labels[saved.type]||'Gebäude verwalten',data:saved});
  }

  buildPlayerRoot() {
    this.player=new THREE.Group();
    this.modelPivot=new THREE.Group();
    this.flightVisualPivot=new THREE.Group();
    this.flightVisualPivot.name='center-flight-visual-pivot';
    this.modelPivot.add(this.flightVisualPivot);
    this.player.add(this.modelPivot);
    this.scene.add(this.player);
  }

  makeInPlaceLocomotionClip(clip) {
    if(!clip?.clone)return clip;
    const cloned=clip.clone();
    for(const track of cloned.tracks||[]){
      if(!/hips|rootjoint|pelvis/i.test(track.name)||!/\.position$/i.test(track.name)||!track.values)continue;
      const stride=track.getValueSize?.()||3;if(stride<3)continue;const firstX=track.values[0],firstZ=track.values[2];
      for(let i=0;i<track.values.length;i+=stride){track.values[i]=firstX;track.values[i+2]=firstZ;}
    }
    cloned.name=`${clip.name||'locomotion'}-in-place`;return cloned;
  }

  selectLocomotionClip(animations=[]) {
    const clip=animations.find((entry)=>/walk|run|jog|locom/i.test(entry?.name||''))||animations[0]||null;
    return this.makeInPlaceLocomotionClip(clip);
  }


  normalizedRigNodeName(name=''){
    return String(name||'').replace(/_\d+$/,'').replace(/[\s._:-]+/g,'').toLowerCase();
  }

  retargetLocomotionClip(clip,root,label='run'){
    if(!clip?.clone||!root)return null;
    const byName=new Map();root.traverse?.((object)=>{if(object?.name){const key=this.normalizedRigNodeName(object.name);if(key&&!byName.has(key))byName.set(key,object.name);}});
    const cloned=this.makeInPlaceLocomotionClip(clip);
    const tracks=[];
    for(const track of cloned?.tracks||[]){
      const dot=String(track.name||'').lastIndexOf('.');if(dot<1){tracks.push(track);continue;}
      const source=track.name.slice(0,dot),property=track.name.slice(dot),target=byName.get(this.normalizedRigNodeName(source));
      if(!target)continue;track.name=`${target}${property}`;tracks.push(track);
    }
    if(!tracks.length)return null;
    return new THREE.AnimationClip(`${label}-${cloned.name||'locomotion'}`,cloned.duration,tracks,cloned.blendMode);
  }

  switchPlayerLocomotion(action){
    if(!action)return;
    if(this.playerActiveAction===action){action.enabled=true;action.paused=false;return;}
    const previous=this.playerActiveAction;
    if(previous&&previous!==action){previous.fadeOut?.(.12);previous.enabled=true;previous.paused=false;}
    action.enabled=true;action.paused=false;action.reset?.();action.fadeIn?.(.12);action.play?.();this.playerActiveAction=action;
  }

  cachePlayerBones(root) {
    const all=[];
    root?.traverse?.((object)=>{
      if(object?.isBone){
        object.userData.__centerBindQuaternion=object.quaternion.clone();
        object.userData.__centerBindPosition=object.position.clone();
      }
      if(object?.isBone||/arm|palm|hand|spine|chest|neck|head|shoulder/i.test(object?.name||''))all.push(object);
    });
    const find=(pattern)=>all.find((object)=>pattern.test(object.name||''));
    this.playerBones={
      upperRight:find(/(?:a r m_up_R|right(?:upper)?arm|upperarm.*right|bip R UpperArm|mixamorig:RightArm)/i),
      lowerRight:find(/(?:a r m_dawn_R|right.*forearm|forearm.*right|bip R Forearm|mixamorig:RightForeArm)/i),
      handRight:find(/(?:palm_R|right.*hand|hand.*right|bip R Hand|mixamorig:RightHand)/i),
      upperLeft:find(/(?:a r m_up_L|left(?:upper)?arm|upperarm.*left|bip L UpperArm|mixamorig:LeftArm)/i),
      lowerLeft:find(/(?:a r m_dawn_L|left.*forearm|forearm.*left|bip L Forearm|mixamorig:LeftForeArm)/i),
      handLeft:find(/(?:palm_L|left.*hand|hand.*left|bip L Hand|mixamorig:LeftHand)/i),
      shoulderRight:find(/(?:shoulder_R|right.*shoulder|bip R Clavicle|mixamorig:RightShoulder)/i),
      shoulderLeft:find(/(?:shoulder_L|left.*shoulder|bip L Clavicle|mixamorig:LeftShoulder)/i),
      chest:find(/(?:^chest|spine_?2|upperchest)/i),
      neck:find(/(?:^neck|neck_)/i),
      head:find(/(?:^head|head_)/i),
      upperLegRight:find(/(?:thigh.*r|right.*thigh|right.*upleg|bip R Thigh|mixamorig:RightUpLeg|leg_up_R)/i),
      lowerLegRight:find(/(?:calf.*r|right.*calf|right.*leg|bip R Calf|mixamorig:RightLeg|leg_dawn_R)/i),
      footRight:find(/(?:foot.*r|right.*foot|bip R Foot|mixamorig:RightFoot)/i),
      toeRight:find(/(?:toe.*r|right.*toe)/i),
      upperLegLeft:find(/(?:thigh.*l|left.*thigh|left.*upleg|bip L Thigh|mixamorig:LeftUpLeg|leg_up_L)/i),
      lowerLegLeft:find(/(?:calf.*l|left.*calf|left.*leg|bip L Calf|mixamorig:LeftLeg|leg_dawn_L)/i),
      footLeft:find(/(?:foot.*l|left.*foot|bip L Foot|mixamorig:LeftFoot)/i),
      toeLeft:find(/(?:toe.*l|left.*toe)/i),
      fingersRight:all.filter((object)=>object?.isBone&&/(?:finger|thumb|index|middle|ring|little).*[_ .-]R(?:_|\.|$)/i.test(object.name||'')&&!/^Tgt\.|^control\./i.test(object.name||'')),
      fingersLeft:all.filter((object)=>object?.isBone&&/(?:finger|thumb|index|middle|ring|little).*[_ .-]L(?:_|\.|$)/i.test(object.name||'')&&!/^Tgt\.|^control\./i.test(object.name||''))
    };
    this.prepareIdlePoseTargets();
  }

  prepareIdlePoseTargets() {
    const setTarget=(bone,rotation)=>{
      if(!bone?.userData.__centerBindQuaternion)return;
      const q=bone.userData.__centerBindQuaternion.clone();
      q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(rotation.x||0,rotation.y||0,rotation.z||0,'XYZ')));
      bone.userData.__centerIdleQuaternion=q;
      bone.userData.__centerIdlePosition=bone.userData.__centerBindPosition?.clone?.()||bone.position.clone();
    };
    // V258: Arme deutlich enger am Körper. Der weiße Owner-Skin und die
    // Standardfiguren stehen damit entspannt statt breit/T-Pose-artig.
    setTarget(this.playerBones.upperRight,{x:.025,y:.018,z:1.49});
    setTarget(this.playerBones.upperLeft,{x:.025,y:-.018,z:-1.49});
    setTarget(this.playerBones.lowerRight,{x:-.075,y:-.012,z:.025});
    setTarget(this.playerBones.lowerLeft,{x:-.075,y:.012,z:-.025});
    setTarget(this.playerBones.shoulderRight,{z:.01});
    setTarget(this.playerBones.shoulderLeft,{z:-.01});
    setTarget(this.playerBones.chest,{x:.01});
    setTarget(this.playerBones.neck,{x:.01});
    setTarget(this.playerBones.head,{x:.01});
  }

  applyIdlePose(delta=.016,instant=false) {
    if(!this.playerModel)return;
    const alpha=instant?1:1-Math.exp(-Math.max(.001,delta)*3.8);
    const now=performance.now();
    const breathe=Math.sin(now*.00155)*.018;
    const lookCycle=Math.sin(now*.00031);
    const look=Math.sin(now*.00057)*.12*(.35+Math.abs(lookCycle)*.65);
    this.playerModel.traverse((object)=>{
      if(!object?.isBone)return;
      const targetQ=object.userData.__centerIdleQuaternion||object.userData.__centerBindQuaternion;
      const targetP=object.userData.__centerIdlePosition||object.userData.__centerBindPosition;
      if(targetQ)object.quaternion.slerp(targetQ,alpha);
      if(targetP)object.position.lerp(targetP,alpha);
    });
    if(this.playerBones.chest){this.playerBones.chest.rotateX(breathe);this.playerBones.chest.rotateY(look*.18);}
    if(this.playerBones.neck)this.playerBones.neck.rotateY(look*.42);
    if(this.playerBones.head){this.playerBones.head.rotateY(look*.62);this.playerBones.head.rotateX(Math.sin(now*.00041)*.025);}
    if(this.playerBones.upperRight)this.playerBones.upperRight.rotateX(Math.sin(now*.00115)*.018);
    if(this.playerBones.upperLeft)this.playerBones.upperLeft.rotateX(-Math.sin(now*.00115)*.018);
    this.idleBlend=Math.min(1,this.idleBlend+alpha*.28);
  }

  resetLocomotionToIdle(instant=false) {
    for(const action of [this.playerWalkAction,this.playerRunAction,this.playerAction])if(action){action.paused=true;action.enabled=true;}
    if(this.playerMixer)this.playerMixer.timeScale=1;
    this.playerActiveAction=null;this.playerActionWasMoving=false;
    this.idleStartedAt=performance.now();this.idleBlend=instant?1:0;this.applyIdlePose(.016,instant);
  }

  updatePlayerAnimation(delta,moving,sprint) {
    const flying=this.isStaffActive&&this.ownerFlags.fly,appearance=this.state.ownerAppearance||{},scooter=this.isStaffActive&&appearance.vehicle==='scooter'&&!!this.ownerScooterObject,plane=this.isStaffActive&&appearance.vehicle==='plane'&&!!this.ownerPlaneObject,mounted=!!this.mountedHorse,animalForm=this.isStaffActive&&ANIMAL_FORM_IDS.includes(appearance.skin),humanMoving=moving&&!flying&&!scooter&&!plane&&!mounted&&!animalForm;
    if(this.playerMixer&&(this.playerWalkAction||this.playerAction)){
      if(humanMoving){const desired=sprint&&this.playerRunAction?this.playerRunAction:(this.playerWalkAction||this.playerAction);this.switchPlayerLocomotion(desired);const size=this.isStaffActive&&this.staffCapabilities?.size?clamp(Number(appearance.size)||1,.45,2.5):1;this.playerMixer.timeScale=((desired===this.playerRunAction)?1:(sprint&&!this.playerRunAction?1.32:1.02))/Math.sqrt(size);this.playerMixer.update(delta);this.playerActionWasMoving=true;this.idleBlend=0;}
      else{if(this.playerActionWasMoving){for(const action of [this.playerWalkAction,this.playerRunAction,this.playerAction])if(action){action.fadeOut?.(.10);action.paused=true;}this.playerActionWasMoving=false;this.playerActiveAction=null;this.idleStartedAt=performance.now();this.idleBlend=0;}if(!flying&&!scooter&&!plane&&!mounted)this.applyIdlePose(delta,false);}
    }else if(!humanMoving&&!flying&&!scooter&&!plane&&!mounted)this.applyIdlePose(delta,false);
    const now=performance.now(),airborne=!this.onGround&&!flying,isBall=this.isStaffActive&&appearance.skin==='ball';
    this.modelPivot.position.y=isBall?0:(flying?Math.sin(now*.0022)*.045:airborne?0:Math.sin(now*.0016)*.008);
    const lift=mounted?1.05:scooter?.08:plane?.34:0;if(this.flightVisualPivot)this.flightVisualPivot.position.y+=(lift-this.flightVisualPivot.position.y)*(1-Math.exp(-delta*12));
    this.modelPivot.rotation.x+=(0-this.modelPivot.rotation.x)*(1-Math.exp(-delta*10));
    const forwardInput=flying?clamp(this.flightForwardInput||0,-1,1):0,rightInput=flying?clamp(this.flightRightInput||0,-1,1):0;
    const targetLean=flying?(Math.max(0,forwardInput)*(.62+(sprint?.26:0))-Math.max(0,-forwardInput)*.26):0,targetRoll=flying?(rightInput*(.38+(sprint?.08:0))):0;
    this.flightLean+=(targetLean-this.flightLean)*(1-Math.exp(-delta*(flying?5.8:8.5)));this.flightRoll+=(targetRoll-this.flightRoll)*(1-Math.exp(-delta*(flying?6.4:9)));
    if(this.flightVisualPivot){this.flightVisualPivot.rotation.x=this.flightLean;this.flightVisualPivot.rotation.z=this.flightRoll;}
    if(scooter)this.applyScooterPose(delta);else if(mounted)this.applyRidingPose(delta);else if(flying&&!animalForm&&!plane)this.applyFlyingPose(delta,moving,sprint);
    this.updateStaffPlane(delta,moving);
    this.updateOwnerFormAnimation(delta,moving);if(animalForm&&this.ownerFormObject){if(appearance.skin==='owl'&&flying){this.ownerFormObject.rotation.x=this.flightLean*.45;this.ownerFormObject.rotation.z=this.flightRoll*.55;}else{this.ownerFormObject.rotation.x*=Math.exp(-delta*8);this.ownerFormObject.rotation.z*=Math.exp(-delta*8);}}
    this.updateFlightEffects(delta,moving,sprint);this.applyActionAnimation(now);this.updateHeldItemTransform(now);this.updateFirstPersonArms(delta);this.updateOwnerAura(delta,now);this.updateOwnerWearables(delta,now);
  }

  applyFlyingPose(delta=.016,moving=false,sprint=false) {
    if(!this.playerModel)return;
    const alpha=1-Math.exp(-Math.max(.001,delta)*8.5);
    this.applyIdlePose(delta,false);
    const q=(bone,euler)=>{if(!bone)return;const base=bone.userData.__centerIdleQuaternion||bone.userData.__centerBindQuaternion;if(!base)return;const target=base.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(euler.x||0,euler.y||0,euler.z||0)));bone.quaternion.slerp(target,alpha);};
    const now=performance.now(),hover=Math.sin(now*.0024)*.018,motion=clamp(this.flightInputMagnitude,0,1);
    q(this.playerBones.upperRight,{x:.015+motion*.01,z:.015});q(this.playerBones.upperLeft,{x:.015+motion*.01,z:-.015});
    q(this.playerBones.lowerRight,{x:-.018});q(this.playerBones.lowerLeft,{x:-.018});
    q(this.playerBones.upperLegRight,{x:-.18-hover});q(this.playerBones.lowerLegRight,{x:.42+hover*.35});q(this.playerBones.footRight,{x:-.06});
    q(this.playerBones.upperLegLeft,{x:.025});q(this.playerBones.lowerLegLeft,{x:.02});q(this.playerBones.footLeft,{x:.01});
    const headPitch=clamp(-this.flightLean*.24-this.pitch*.12,-.14,.22);
    q(this.playerBones.chest,{x:-.015});q(this.playerBones.neck,{x:headPitch*.35});q(this.playerBones.head,{x:headPitch*.65});
  }

  ensureFlightEffects() {
    if(this.flightEffects||!this.modelPivot)return;
    const root=new THREE.Group();root.name='owner-flight-boot-flames';
    const flameMaterial=new THREE.MeshBasicMaterial({color:0xffb13b,transparent:true,opacity:.86,depthWrite:false,blending:THREE.AdditiveBlending});
    const coreMaterial=new THREE.MeshBasicMaterial({color:0xdff8ff,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending});
    const makeFlame=(toe,foot,fallbackX)=>{
      const holder=new THREE.Group();
      holder.name='flight-thruster-ball-of-foot';
      const outer=new THREE.Mesh(new THREE.ConeGeometry(.075,.42,8),flameMaterial.clone());outer.rotation.z=Math.PI;outer.position.y=-.23;holder.add(outer);
      const core=new THREE.Mesh(new THREE.ConeGeometry(.035,.25,7),coreMaterial.clone());core.rotation.z=Math.PI;core.position.y=-.14;holder.add(core);
      holder.userData.outer=outer;holder.userData.core=core;
      const anchor=toe||foot;
      if(anchor){anchor.add(holder);holder.position.set(0,-.018,toe?0:(-.13));holder.userData.worldDown=true;}else{root.add(holder);holder.position.set(fallbackX,.08,-.12);}
      return holder;
    };
    this.modelPivot.add(root);
    const left=makeFlame(this.playerBones.toeLeft,this.playerBones.footLeft,-.14),right=makeFlame(this.playerBones.toeRight,this.playerBones.footRight,.14);
    this.flightEffects={root,left,right};
    root.visible=false;
  }

  updateFlightEffects(delta,moving,sprint) {
    this.ensureFlightEffects();
    if(!this.flightEffects)return;
    const flying=this.isStaffActive&&this.ownerFlags.fly&&!this.ownerFlags.vanish&&['normal','galaxy'].includes(this.state.ownerAppearance?.skin||'normal')&&this.state.ownerAppearance?.vehicle!=='plane';
    this.flightEffects.root.visible=flying;
    for(const holder of [this.flightEffects.left,this.flightEffects.right])holder.visible=flying;
    if(!flying)return;
    const speedMultiplier=clamp(Number(this.ownerFlags.speedMultiplier)||OWNER_SPEED_LEVELS[Math.floor(clamp(this.ownerFlags.speedLevel,0,OWNER_SPEED_LEVELS.length-1))]||1,1,OWNER_MAX_SPEED_MULTIPLIER);
    const inputBoost=moving?.22:0;
    const strength=.74+Math.min(2.2,(speedMultiplier-1)*.22)+(sprint?.38:0)+inputBoost+Math.min(.36,Math.abs(this.flightVerticalVelocity)*.04);
    const pulse=1+Math.sin(performance.now()*.018)*.08;
    for(const holder of [this.flightEffects.left,this.flightEffects.right]){
      if(holder.userData.worldDown&&holder.parent){
        holder.parent.getWorldQuaternion(this.tmpQuaternion);
        holder.quaternion.copy(this.tmpQuaternion).invert();
      }
      holder.userData.outer.scale.set(.88+strength*.14,strength*pulse,1);
      holder.userData.core.scale.set(.8+strength*.1,strength*.82*pulse,1);
    }
  }

  triggerActionAnimation(kind='chop',duration=560) {
    this.actionAnimation={kind,start:performance.now(),duration};
  }

  curlFingers(side='right',amount=1) {
    const list=side==='left'?this.playerBones.fingersLeft:this.playerBones.fingersRight;
    for(const finger of list||[])finger.rotateX(-.72*amount);
  }

  applyActionAnimation(now=performance.now()) {
    const action=this.actionAnimation;
    if(!action)return;
    const t=clamp((now-action.start)/action.duration,0,1);
    const swing=Math.sin(t*Math.PI),strike=Math.sin(Math.min(1,t*1.35)*Math.PI);
    const rightUpper=this.playerBones.upperRight,rightLower=this.playerBones.lowerRight,leftUpper=this.playerBones.upperLeft,leftLower=this.playerBones.lowerLeft,chest=this.playerBones.chest;
    if(action.kind==='jump'){
      if(rightUpper){rightUpper.rotateX(-.12*swing);rightUpper.rotateZ(-.12*swing);}
      if(leftUpper){leftUpper.rotateX(-.12*swing);leftUpper.rotateZ(.12*swing);}
      if(rightLower)rightLower.rotateX(-.08*swing);if(leftLower)leftLower.rotateX(-.08*swing);
      if(this.playerBones.upperLegRight)this.playerBones.upperLegRight.rotateX(-.245*swing);
      if(this.playerBones.lowerLegRight)this.playerBones.lowerLegRight.rotateX(.42*swing);
      if(this.playerBones.upperLegLeft)this.playerBones.upperLegLeft.rotateX(-.19*swing);
      if(this.playerBones.lowerLegLeft)this.playerBones.lowerLegLeft.rotateX(.34*swing);
      if(this.playerBones.footRight)this.playerBones.footRight.rotateX(-.08*swing);
      if(this.playerBones.footLeft)this.playerBones.footLeft.rotateX(-.06*swing);
      if(chest)chest.rotateX(.012*swing);
    }else if(action.kind==='punch-right'||action.kind==='punch-left'){
      const left=action.kind==='punch-left',upper=left?leftUpper:rightUpper,lower=left?leftLower:rightLower;
      if(upper){upper.rotateX(-1.1*strike);upper.rotateZ((left?.18:-.18)*strike);}
      if(lower)lower.rotateX(-.48*strike);
      if(chest)chest.rotateY((left?.13:-.13)*strike);
      this.curlFingers(left?'left':'right',swing);
    }else if(action.kind==='weapon-attack'||action.kind==='attack'){
      if(rightUpper){rightUpper.rotateX(-1.35*swing);rightUpper.rotateZ(-.28*swing);}
      if(rightLower)rightLower.rotateX(-.72*swing);
      if(chest)chest.rotateY(.16*swing);
      this.curlFingers('right',swing);
    }else if(action.kind==='gather'){
      if(rightUpper)rightUpper.rotateX(-.45*swing);
      if(rightLower)rightLower.rotateX(-.5*swing);
    }else{
      if(rightUpper){rightUpper.rotateX(-1.15*swing);rightUpper.rotateZ(-.42*swing);}
      if(rightLower)rightLower.rotateX(-.55*swing);
      if(chest)chest.rotateY((action.kind==='mine'?.22:.14)*swing);
      this.curlFingers('right',swing);
    }
    if(t>=1){this.actionAnimation=null;if(!this.walking)this.applyIdlePose(.08,false);}
  }

  createGalaxyTexture(width=128,height=256,theme='owner') {
    theme=normalizeStaffTheme(theme);const cfg=staffThemeConfig(theme),canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');
    const hex=(value)=>`#${Number(value).toString(16).padStart(6,'0')}`;
    const primary=new THREE.Color(cfg.primary),secondary=new THREE.Color(cfg.secondary),accent=new THREE.Color(cfg.accent),dark=new THREE.Color(cfg.dark);
    const rgb=(c,a)=>`rgba(${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)},${a})`;
    const gradient=ctx.createLinearGradient(0,0,width,height);gradient.addColorStop(0,hex(cfg.dark));gradient.addColorStop(.22,hex(cfg.emissive));gradient.addColorStop(.48,hex(cfg.primary));gradient.addColorStop(.7,hex(cfg.secondary));gradient.addColorStop(1,hex(cfg.dark));ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
    const nebula=ctx.createRadialGradient(width*.34,height*.42,2,width*.34,height*.42,width*.62);nebula.addColorStop(0,rgb(secondary,.72));nebula.addColorStop(.36,rgb(primary,.42));nebula.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=nebula;ctx.fillRect(0,0,width,height);
    const nebula2=ctx.createRadialGradient(width*.78,height*.72,1,width*.78,height*.72,width*.48);nebula2.addColorStop(0,rgb(accent,.58));nebula2.addColorStop(.4,rgb(primary,.31));nebula2.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=nebula2;ctx.fillRect(0,0,width,height);
    const rnd=seededRandom(20060806+STAFF_THEME_IDS.indexOf(theme)*991);for(let i=0;i<260;i+=1){const x=rnd()*width,y=rnd()*height,r=rnd()<.08?1.5+rnd()*1.8:.35+rnd()*.8;ctx.beginPath();ctx.fillStyle=rnd()<.18?rgb(accent,.95):rnd()<.52?rgb(secondary,.98):'rgba(255,255,255,.96)';ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(1,2);texture.userData.__centerRuntimeGalaxyTexture=true;texture.userData.__centerStaffTheme=theme;texture.needsUpdate=true;return texture;
  }

createGalaxyAuraGroup(compact=false,theme='owner') {
    theme=normalizeStaffTheme(theme);const cfg=staffThemeConfig(theme),root=new THREE.Group();root.name=compact?`remote-${theme}-staff-aura`:`${theme}-staff-aura`;root.userData.compact=compact;root.userData.theme=theme;
    const particleCount=compact?(this.performanceTier==='low'?22:34):(this.performanceTier==='low'?42:72),positions=new Float32Array(particleCount*3),colors=new Float32Array(particleCount*3),seeds=new Float32Array(particleCount*5),palette=[cfg.primary,cfg.secondary,cfg.accent,0xffffff].map(c=>new THREE.Color(c)),rnd=seededRandom((compact?2621:2622)+STAFF_THEME_IDS.indexOf(theme)*80);
    for(let i=0;i<particleCount;i+=1){const radius=.22+rnd()*.82,angle=rnd()*Math.PI*2,height=.02+rnd()*2.12,twinkle=.55+rnd()*1.35;positions[i*3]=Math.cos(angle)*radius;positions[i*3+1]=height;positions[i*3+2]=Math.sin(angle)*radius;const c=palette[Math.floor(rnd()*palette.length)];colors[i*3]=c.r;colors[i*3+1]=c.g;colors[i*3+2]=c.b;seeds[i*5]=radius;seeds[i*5+1]=angle;seeds[i*5+2]=height;seeds[i*5+3]=.35+rnd()*.8;seeds[i*5+4]=twinkle;}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));const material=new THREE.PointsMaterial({size:compact?.021:.032,vertexColors:true,transparent:true,opacity:.68,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true}),points=new THREE.Points(geometry,material);root.add(points);
    const starGeo=new THREE.BufferGeometry(),starPos=new Float32Array((compact?8:18)*3);for(let i=0;i<starPos.length/3;i++){const a=rnd()*Math.PI*2,r=.28+rnd()*.72;starPos[i*3]=Math.cos(a)*r;starPos[i*3+1]=.12+rnd()*1.9;starPos[i*3+2]=Math.sin(a)*r;}starGeo.setAttribute('position',new THREE.BufferAttribute(starPos,3));const stars=new THREE.Points(starGeo,new THREE.PointsMaterial({color:cfg.accent,size:compact?.026:.04,transparent:true,opacity:.66,depthWrite:false,blending:THREE.AdditiveBlending}));root.add(stars);
    const light=new THREE.PointLight(cfg.primary,compact?.30:.62,compact?3.4:5.2,2);light.position.set(0,1.05,.05);root.add(light);root.userData.points=points;root.userData.stars=stars;root.userData.seeds=seeds;root.userData.light=light;root.visible=false;return root;
  }

  animateGalaxyAura(aura,delta=.016,now=performance.now()) {
    if(!aura?.visible)return;const points=aura.userData.points,seeds=aura.userData.seeds;if(points&&seeds){const arr=points.geometry.attributes.position.array;for(let i=0;i<seeds.length/5;i++){const radius=seeds[i*5],baseAngle=seeds[i*5+1],baseHeight=seeds[i*5+2],speed=seeds[i*5+3],twinkle=seeds[i*5+4],angle=baseAngle+now*.00022*speed,rise=(baseHeight+now*.000055*speed)%2.14,pulse=1+Math.sin(now*.0021*twinkle+baseAngle)*.055;arr[i*3]=Math.cos(angle)*radius*pulse;arr[i*3+1]=.02+rise;arr[i*3+2]=Math.sin(angle)*radius*pulse;}points.geometry.attributes.position.needsUpdate=true;points.material.opacity=.60+Math.sin(now*.0023)*.10;}if(aura.userData.stars){aura.userData.stars.rotation.y+=delta*.11;aura.userData.stars.material.opacity=.54+Math.sin(now*.004)*.16;}if(aura.userData.light)aura.userData.light.intensity=(aura.userData.compact?.38:.82)+Math.sin(now*.002)*.12;
  }

ensureOwnerAura() {
    if(!this.modelPivot)return null;const active=!!(this.isStaffActive&&this.staffCapabilities?.ownerCosmetics&&!this.isPublicPlayerMode()&&this.state.ownerAppearance?.aura);if(!active){if(this.ownerAura)this.ownerAura.visible=false;return this.ownerAura;}const theme=this.appearanceTheme('aura');if(this.ownerAura&&this.ownerAura.userData?.theme!==theme){this.disposeGeneratedVisual(this.ownerAura);this.ownerAura=null;}if(this.ownerAura)return this.ownerAura;this.ownerAura=this.createGalaxyAuraGroup(false,theme);this.modelPivot.add(this.ownerAura);return this.ownerAura;
  }

updateOwnerAura(delta=.016,now=performance.now()) {
    const active=!!(this.isStaffActive&&this.staffCapabilities?.ownerCosmetics&&!this.isPublicPlayerMode()&&this.state.ownerAppearance?.aura&&!this.ownerFlags.vanish&&!this.firstPerson);if(!active){if(this.ownerAura)this.ownerAura.visible=false;return;}const aura=this.ensureOwnerAura();if(!aura)return;aura.visible=true;this.animateGalaxyAura(aura,delta,now);
  }


  applyStaffTheme(root,theme='owner'){
    theme=normalizeStaffTheme(theme);if(theme==='owner')return root;const cfg=staffThemeConfig(theme);root?.traverse?.((object)=>{
      if(object.isLight){object.color?.set?.(cfg.primary);return;}if(!object.isMesh&&!object.isLine&&!object.isLineSegments&&!object.isPoints)return;
      const mats=Array.isArray(object.material)?object.material:[object.material];for(const material of mats){if(!material)continue;if(material.map?.userData?.__centerRuntimeGalaxyTexture){const tex=this.createGalaxyTexture(material.map.image?.width||96,material.map.image?.height||192,theme);tex.repeat.copy?.(material.map.repeat);material.map=tex;if('emissiveMap'in material)material.emissiveMap=tex;}
        material.color?.set?.(object.isPoints?cfg.accent:0xffffff);material.emissive?.set?.(cfg.emissive);if('emissiveIntensity'in material)material.emissiveIntensity=Math.max(.7,Number(material.emissiveIntensity)||0);material.needsUpdate=true;this.sanitizeMaterialUniformCompatibility(material);}
    });root.userData.staffTheme=theme;return root;
  }
  applyAdminGrayTheme(root){return this.applyStaffTheme(root,'member');}

  createHeldItemMesh(kind='none',theme='owner') {
    if(kind==='none')return null;const group=new THREE.Group();group.userData.kind=kind;
    const steel=new THREE.MeshStandardMaterial({color:0xcfd7df,roughness:.24,metalness:.84}),wood=new THREE.MeshStandardMaterial({color:0x5b351f,roughness:.9});
    const addCylinder=(r1,r2,h,mat,y=0,segments=14)=>{const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),mat);mesh.position.y=y;group.add(mesh);return mesh;};
    if(['shovel','pickaxe','hoe','axe','hammer'].includes(kind)){
      // V264: Basic-Tools werden über ihre echte Gesamtlänge skaliert. Die Modelle
      // liegen intern überwiegend auf der Z-Achse; targetHeight hatte Axt/Hammer
      // deshalb extrem vergrößert. Jetzt liegen sie größenmäßig beim Galaxy-Stab.
      const toolSize={shovel:1.32,pickaxe:1.24,hoe:1.27,axe:1.28,hammer:1.13}[kind]||1.22;
      const gripOffset={shovel:-.12,pickaxe:-.105,hoe:-.11,axe:-.105,hammer:-.09}[kind]||-.1;
      const asset=this.cloneCenterAsset('basicTools',{nodeName:kind,targetSize:toolSize,bottomAlign:false});if(!asset)return null;
      asset.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(asset),c=b.getCenter(new THREE.Vector3());asset.position.y-=c.y;asset.position.z-=c.z;asset.position.y+=gripOffset;
      group.add(asset);group.userData.assetBased=true;
      group.rotation.set(.06,0,-.10);
    }else if(kind==='sword'){
      const galaxyTexture=this.createGalaxyTexture(96,256,theme),galaxyMetal=new THREE.MeshStandardMaterial({map:galaxyTexture,emissiveMap:galaxyTexture,emissive:0x3f0c72,emissiveIntensity:1.25,metalness:.86,roughness:.14});
      const violetGlow=new THREE.MeshStandardMaterial({color:0xdac9ef,emissive:0x6e35a4,emissiveIntensity:1.8,metalness:.68,roughness:.12});addCylinder(.04,.05,.34,galaxyMetal,-.02);const pommel=new THREE.Mesh(new THREE.OctahedronGeometry(.075,1),violetGlow);pommel.position.y=-.22;group.add(pommel);const guard=new THREE.Mesh(new THREE.BoxGeometry(.45,.055,.085),galaxyMetal);guard.position.y=.18;group.add(guard);const blade=new THREE.Mesh(new THREE.ConeGeometry(.105,1.38,4),galaxyMetal);blade.position.y=.85;blade.rotation.y=Math.PI/4;group.add(blade);const ridge=new THREE.Mesh(new THREE.BoxGeometry(.016,1.05,.025),violetGlow);ridge.position.y=.77;group.add(ridge);const light=new THREE.PointLight(0x7650b8,1.55,6,2);light.position.y=.8;group.add(light);group.userData.light=light;group.rotation.set(.06,0,-.24);
    }else if(kind==='staff'){
      const galaxyTexture=this.createGalaxyTexture(128,320,theme),shaftMat=new THREE.MeshStandardMaterial({map:galaxyTexture,emissiveMap:galaxyTexture,emissive:0x23103d,emissiveIntensity:.88,roughness:.18,metalness:.84});
      const trim=new THREE.MeshStandardMaterial({color:0x15131b,emissive:0x241332,emissiveIntensity:.45,metalness:.9,roughness:.2});
      const crystalMat=new THREE.MeshStandardMaterial({color:0xa78dcc,emissive:0x60409a,emissiveIntensity:2.25,metalness:.22,roughness:.06,transparent:true,opacity:.94});
      addCylinder(.034,.046,2.3,shaftMat,-.18,18);const grip=addCylinder(.048,.052,.4,trim,-.45,18);const pommel=new THREE.Mesh(new THREE.OctahedronGeometry(.095,1),crystalMat);pommel.position.y=-1.37;group.add(pommel);
      for(let i=0;i<3;i+=1){const ring=new THREE.Mesh(new THREE.TorusGeometry(.15+i*.038,.012,8,48),trim.clone());ring.position.y=.9+i*.14;ring.rotation.x=Math.PI/2+(i-1)*.18;ring.rotation.z=i*.5;group.add(ring);}
      const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.235,1),crystalMat);crystal.position.y=1.08;group.add(crystal);group.userData.crystal=crystal;
      const crystalShell=new THREE.Mesh(new THREE.OctahedronGeometry(.285,1),new THREE.MeshBasicMaterial({color:0x7e63b8,transparent:true,opacity:.09,depthWrite:false,blending:THREE.AdditiveBlending,wireframe:true}));crystalShell.position.copy(crystal.position);group.add(crystalShell);group.userData.crystalShell=crystalShell;
      const orbitMat=new THREE.MeshBasicMaterial({color:0x8c73bd,transparent:true,opacity:.42,depthWrite:false,blending:THREE.AdditiveBlending});const orbitA=new THREE.Mesh(new THREE.TorusGeometry(.31,.008,6,64),orbitMat),orbitB=new THREE.Mesh(new THREE.TorusGeometry(.27,.006,6,64),orbitMat.clone());orbitA.position.y=1.08;orbitB.position.y=1.08;orbitA.rotation.x=1.1;orbitB.rotation.x=.35;orbitB.rotation.y=.75;group.add(orbitA,orbitB);group.userData.orbitA=orbitA;group.userData.orbitB=orbitB;
      const glow=new THREE.PointLight(0x7552aa,2.35,10,2);glow.position.y=1.08;group.add(glow);group.userData.light=glow;
      const segments=7,geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(segments*6),3));const lightning=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:0xa88bdb,transparent:true,opacity:.48,depthWrite:false,blending:THREE.AdditiveBlending}));lightning.position.y=1.08;group.add(lightning);group.userData.lightning=lightning;
      const pCount=20,pPos=new Float32Array(pCount*3);for(let i=0;i<pCount;i+=1){const a=i/pCount*Math.PI*2,r=.2+(i%4)*.018;pPos[i*3]=Math.cos(a)*r;pPos[i*3+1]=(i%5-2)*.035;pPos[i*3+2]=Math.sin(a)*r;}const pGeo=new THREE.BufferGeometry();pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));const sparkles=new THREE.Points(pGeo,new THREE.PointsMaterial({color:0xd9d0ea,size:.025,transparent:true,opacity:.72,depthWrite:false,blending:THREE.AdditiveBlending}));sparkles.position.y=1.08;group.add(sparkles);group.userData.sparkles=sparkles;group.rotation.set(.02,0,-.13);
    }else if(kind==='eternalFlame'){
      // V258: Die fehlerhaft exportierte GLB wird absichtlich nicht mehr gerendert.
      // Stattdessen entsteht die Ewige Flamme vollständig im Galaxy-Design.
      const galaxyTexture=this.createGalaxyTexture(96,220,theme);
      const handleMat=new THREE.MeshStandardMaterial({map:galaxyTexture,emissiveMap:galaxyTexture,emissive:0x2e174e,emissiveIntensity:.75,metalness:.82,roughness:.2});
      const trimMat=new THREE.MeshStandardMaterial({color:0x15131c,emissive:0x251638,emissiveIntensity:.38,metalness:.9,roughness:.18});
      addCylinder(.038,.05,.92,handleMat,-.15,18);const pommel=new THREE.Mesh(new THREE.OctahedronGeometry(.085,1),new THREE.MeshStandardMaterial({color:0x7657a7,emissive:0x5b2f93,emissiveIntensity:1.45,metalness:.35,roughness:.12}));pommel.position.y=-.67;group.add(pommel);
      const cup=new THREE.Mesh(new THREE.CylinderGeometry(.16,.11,.16,16),trimMat);cup.position.y=.38;group.add(cup);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.19,.018,8,36),new THREE.MeshBasicMaterial({color:0x8c6acb,transparent:true,opacity:.72,blending:THREE.AdditiveBlending,depthWrite:false}));ring.position.y=.48;ring.rotation.x=Math.PI/2;group.add(ring);group.userData.flameRing=ring;
      const flameParts=[];
      const makeFlame=(radius,height,y,color,emissive,opacity,scaleZ=1)=>{const mat=new THREE.MeshStandardMaterial({color,emissive,emissiveIntensity:3.2,transparent:true,opacity,roughness:.18,metalness:0,depthWrite:false,blending:THREE.AdditiveBlending});const flame=new THREE.Mesh(new THREE.ConeGeometry(radius,height,14),mat);flame.position.y=y;flame.scale.z=scaleZ;group.add(flame);flameParts.push(flame);return flame;};
      makeFlame(.18,.68,.82,0x7e51d9,0x4c1fa2,.82,.8);makeFlame(.12,.56,.9,0x55b9ff,0x2677d6,.72,.72);makeFlame(.075,.44,.98,0xff557f,0xb52358,.6,.7);
      const core=new THREE.Mesh(new THREE.SphereGeometry(.085,12,8),new THREE.MeshBasicMaterial({color:0xe3d8ff,transparent:true,opacity:.82,blending:THREE.AdditiveBlending,depthWrite:false}));core.position.y=.68;group.add(core);group.userData.flameCore=core;group.userData.flameParts=flameParts;
      const glow=new THREE.PointLight(0x8e62ff,4.4,20,2);glow.position.set(0,.82,.05);group.add(glow);group.userData.light=glow;const blue=new THREE.PointLight(0x4ca6ff,1.65,9,2);blue.position.set(0,.92,.12);group.add(blue);group.userData.blueLight=blue;group.rotation.set(.02,0,-.08);
    }else if(kind==='torch'){
      addCylinder(.05,.07,1.02,wood,.18);const wrap=new THREE.Mesh(new THREE.CylinderGeometry(.1,.085,.26,8),new THREE.MeshStandardMaterial({color:0x3b2719,roughness:1}));wrap.position.y=.76;group.add(wrap);const flameMat=new THREE.MeshStandardMaterial({color:0xffd45c,emissive:0xff4a00,emissiveIntensity:3,transparent:true,opacity:.94});const flame=new THREE.Mesh(new THREE.ConeGeometry(.13,.43,10),flameMat);flame.position.y=1.04;group.add(flame);group.userData.flame=flame;const light=new THREE.PointLight(0xff8b32,4.2,18,2);light.position.y=1.02;group.add(light);group.userData.light=light;group.rotation.set(.02,0,-.12);
    }else if(kind==='spear'){
      addCylinder(.025,.035,1.8,wood,.32,12);const tip=new THREE.Mesh(new THREE.ConeGeometry(.07,.28,5),steel);tip.position.y=1.36;group.add(tip);group.rotation.set(.02,0,-.1);
    }else if(kind==='bow'){
      const curve=new THREE.Mesh(new THREE.TorusGeometry(.48,.025,8,40,Math.PI*1.45),wood);curve.rotation.z=.78;curve.position.y=.52;group.add(curve);const lineGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.31,.13,0),new THREE.Vector3(.32,.91,0)]);group.add(new THREE.Line(lineGeo,new THREE.LineBasicMaterial({color:0xd9d2c6})));group.rotation.set(.03,0,-.08);
    }
    const scale={staff:.74,sword:.50,shovel:1,pickaxe:1,hoe:1,axe:1,hammer:1,eternalFlame:.72,torch:.58,spear:.68,bow:.75}[kind]||.65;group.scale.setScalar(scale);group.traverse((object)=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;}});if(theme!=='owner'&&['sword','staff','eternalFlame'].includes(kind))this.applyStaffTheme(group,theme);group.userData.theme=theme;return group;
  }

  createOwnerForm(kind='ball') {
    const form=new THREE.Group();
    form.userData.kind=kind;
    if(kind==='ball'){
      const ball=new THREE.Mesh(new THREE.SphereGeometry(.72,28,20),new THREE.MeshStandardMaterial({color:0xd7b356,metalness:.28,roughness:.32}));
      ball.position.y=.72;ball.castShadow=true;form.add(ball);form.userData.rollingMesh=ball;
    }else if(kind==='crystal'){
      const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.82,2),new THREE.MeshStandardMaterial({color:0x79e7ff,emissive:0x235f85,emissiveIntensity:1.15,transparent:true,opacity:.88,metalness:.18,roughness:.15}));
      crystal.position.y=.88;crystal.castShadow=true;form.add(crystal);
      const glow=new THREE.PointLight(0x62cfff,2.2,10,2);glow.position.y=.9;form.add(glow);
    }else if(kind==='bush'){
      const mat=new THREE.MeshStandardMaterial({color:0x3e7b39,roughness:1,flatShading:true});
      for(const [x,y,z,scale] of [[0,.48,0,.7],[-.48,.38,.1,.52],[.46,.38,.05,.5],[0,.34,-.42,.48]]){
        const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry(scale,1),mat);leaf.position.set(x,y,z);leaf.castShadow=true;form.add(leaf);
      }
    }else if(kind==='tree'){
      const variant=Math.max(0,Math.floor(Number(this.state.ownerAppearance?.treeVariant)||0))%Math.max(1,this.natureTreeNames.length);
      const nodeName=this.natureTreeNames[variant];
      const assetTree=this.cloneCenterAsset('naturePack',{nodeName,targetSize:3.2,bottomAlign:true});
      if(assetTree){assetTree.name=`owner-tree-variant-${variant}`;form.add(assetTree);form.userData.treeVariant=variant;form.userData.treeName=nodeName;}
      else{
        const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.2,.28,1.7,9),new THREE.MeshStandardMaterial({color:0x6d3d22,roughness:1}));trunk.position.y=.85;trunk.castShadow=true;form.add(trunk);
        const leafMat=new THREE.MeshStandardMaterial({color:0x2f7138,roughness:1,flatShading:true});
        const crown=new THREE.Mesh(new THREE.ConeGeometry(.95,1.65,9),leafMat);crown.position.y=2.05;crown.castShadow=true;form.add(crown);
      }
    }else if(kind==='rock'){
      const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.82,1),new THREE.MeshStandardMaterial({color:0x707671,roughness:1,flatShading:true}));rock.position.y=.62;rock.scale.set(1.2,.8,1);rock.castShadow=true;form.add(rock);
    }else if(kind==='grass'){
      const mat=new THREE.MeshStandardMaterial({color:0x4f873e,roughness:1,side:THREE.DoubleSide});
      for(let i=0;i<14;i+=1){const blade=new THREE.Mesh(new THREE.PlaneGeometry(.12,.65),mat);blade.position.set((Math.random()-.5)*.55,.32,(Math.random()-.5)*.55);blade.rotation.y=Math.random()*Math.PI;blade.rotation.z=(Math.random()-.5)*.25;form.add(blade);}
    }else if(ANIMAL_FORM_IDS.includes(kind)){
      const visual=this.createAnimalVisual(kind);if(visual){const profile=ANIMAL_PROFILES[kind];visual.position.y=profile?.zone==='water'?.95:0;form.add(visual);form.userData.animalVisual=visual;form.userData.mixer=visual.userData.mixer||null;form.userData.idleAction=visual.userData.idleAction||null;form.userData.moveAction=visual.userData.moveAction||null;form.userData.singleMoveAction=!!visual.userData.singleMoveAction;}
    }
    return form;
  }

  updateOwnerFormAnimation(delta=.016,moving=false){
    const form=this.ownerFormObject;if(!form||!ANIMAL_FORM_IDS.includes(form.userData.kind))return;const mixer=form.userData.mixer,idle=form.userData.idleAction,move=form.userData.moveAction,wantsMove=form.userData.kind==='owl'?(this.ownerFlags.fly||moving):moving,singleMove=!!form.userData.singleMoveAction;if(mixer){if(singleMove&&move){if(wantsMove){move.enabled=true;move.paused=false;}else{move.paused=true;move.time=0;}}else if(move&&idle&&move!==idle){if(wantsMove&&!move.enabled){idle.fadeOut(.18);move.enabled=true;move.reset().fadeIn(.18).play();}else if(!wantsMove&&move.enabled){move.fadeOut(.2);move.enabled=false;idle.reset().fadeIn(.2).play();}}mixer.update(delta);}this.applyProceduralAnimalWalk(form.userData.animalVisual||form,wantsMove,delta);
  }

  aimBoneChainAtLocalTarget(bone,child,targetLocal,alpha=.8){
    if(!bone||!child||!this.modelPivot)return;
    this.modelPivot.updateWorldMatrix?.(true,true);bone.updateWorldMatrix?.(true,true);child.updateWorldMatrix?.(true,true);
    const bonePos=new THREE.Vector3(),childPos=new THREE.Vector3(),targetWorld=targetLocal.clone();bone.getWorldPosition(bonePos);child.getWorldPosition(childPos);this.modelPivot.localToWorld(targetWorld);
    const currentDir=childPos.sub(bonePos).normalize(),desiredDir=targetWorld.sub(bonePos).normalize();if(currentDir.lengthSq()<.001||desiredDir.lengthSq()<.001)return;
    const deltaQ=new THREE.Quaternion().setFromUnitVectors(currentDir,desiredDir),worldQ=new THREE.Quaternion();bone.getWorldQuaternion(worldQ);const desiredWorldQ=deltaQ.multiply(worldQ),parentWorldQ=new THREE.Quaternion();bone.parent?.getWorldQuaternion?.(parentWorldQ);const desiredLocalQ=parentWorldQ.invert().multiply(desiredWorldQ);bone.quaternion.slerp(desiredLocalQ,clamp(alpha,0,1));bone.updateWorldMatrix?.(true,true);
  }

  applyScooterPose(delta=.016){
    if(!this.playerModel)return;
    this.applyIdlePose(delta,false);
    const alpha=1-Math.exp(-Math.max(.001,delta)*11);
    // Die Ziele liegen fest relativ zum Fahrzeug: beide Hände am Lenker,
    // beide Füße mittig auf dem Brett, der linke Fuß etwas weiter vorn.
    this.aimBoneChainAtLocalTarget(this.playerBones.upperRight,this.playerBones.lowerRight,new THREE.Vector3(.18,1.08,.30),alpha);
    this.aimBoneChainAtLocalTarget(this.playerBones.lowerRight,this.playerBones.handRight,new THREE.Vector3(.19,1.08,.52),alpha);
    this.aimBoneChainAtLocalTarget(this.playerBones.upperLeft,this.playerBones.lowerLeft,new THREE.Vector3(-.18,1.08,.30),alpha);
    this.aimBoneChainAtLocalTarget(this.playerBones.lowerLeft,this.playerBones.handLeft,new THREE.Vector3(-.19,1.08,.52),alpha);
    this.aimBoneChainAtLocalTarget(this.playerBones.upperLegRight,this.playerBones.lowerLegRight,new THREE.Vector3(.08,.58,-.08),alpha);
    this.aimBoneChainAtLocalTarget(this.playerBones.lowerLegRight,this.playerBones.footRight,new THREE.Vector3(.08,.12,-.18),alpha);
    this.aimBoneChainAtLocalTarget(this.playerBones.upperLegLeft,this.playerBones.lowerLegLeft,new THREE.Vector3(-.07,.59,.16),alpha);
    this.aimBoneChainAtLocalTarget(this.playerBones.lowerLegLeft,this.playerBones.footLeft,new THREE.Vector3(-.07,.12,.08),alpha);
    const chest=this.playerBones.chest;if(chest?.userData.__centerIdleQuaternion){const target=chest.userData.__centerIdleQuaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-.055,0,0)));chest.quaternion.slerp(target,alpha);}
  }

  renderScooterTuningBar(){
    const bar=this.scooterTuningBar;if(!bar)return;const active=this.opened&&this.isStaffActive&&this.state.ownerAppearance?.vehicle==='scooter';bar.hidden=!active;if(!active){this.lastScooterTuningUiKey='';return;}const level=Math.floor(clamp(Number(this.state.ownerAppearance?.scooterTuning)||0,0,3)),speeds=[40,80,120,150],key=`${level}`;if(this.lastScooterTuningUiKey===key)return;this.lastScooterTuningUiKey=key;bar.innerHTML=`<button data-scooter-tuning="0" class="${level===0?'active':''}">Standard <b>40</b></button>${[1,2,3].map(i=>`<button data-scooter-tuning="${i}" class="${level===i?'active':''}">Tuning ${i} <b>${speeds[i]}</b></button>`).join('')}<span>km/h</span>`;
  }

  async ensureFirstPersonArms(){
    if(this.firstPersonArmsObject||!this.camera)return this.firstPersonArmsObject;const template=this.centerAssetTemplates.get('firstPersonArms');if(!template?.root)return null;
    const raw=cloneSkeleton(template.root);raw.traverse((o)=>{if(o.isMesh||o.isSkinnedMesh){o.frustumCulled=false;o.renderOrder=998;const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){if(m){m.depthTest=false;m.depthWrite=false;m.transparent=false;}}}});
    raw.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(raw),size=box.getSize(new THREE.Vector3()),max=Math.max(.001,size.x,size.y,size.z);raw.scale.multiplyScalar(1.5/max);raw.rotation.y=Math.PI;raw.position.set(0,-.72,-.58);
    const group=new THREE.Group();group.name='center-first-person-arms';group.add(raw);group.visible=this.firstPerson&&!this.ownerFlags.vanish;this.camera.add(group);this.firstPersonArmsObject=group;
    const mixer=new THREE.AnimationMixer(raw);this.firstPersonArmsMixer=mixer;this.firstPersonArmsActions=new Map();for(const clip of template.animations||[]){const key=String(clip.name||'').replace(/^.*\|/,'').toLowerCase();this.firstPersonArmsActions.set(key,mixer.clipAction(clip));}
    this.playFirstPersonArmsAction(this.currentFirstPersonArmsIdle(),true);return group;
  }

  currentFirstPersonArmsIdle(){const kind=this.ownerHeldObject?.userData?.kind||this.firstPersonHeldObject?.userData?.kind||'';return kind==='sword'||kind==='shovel'||kind==='hoe'||kind==='axe'||kind==='hammer'||kind==='pickaxe'||kind==='eternalFlame'||kind==='torch'||kind==='spear'?'knife_idle':'guard_idle';}
  playFirstPersonArmsAction(name,loop=false){const action=this.firstPersonArmsActions?.get?.(String(name||'').toLowerCase());if(!action)return;for(const other of this.firstPersonArmsActions.values())if(other!==action)other.fadeOut?.(.08);action.reset();action.enabled=true;action.setLoop(loop?THREE.LoopRepeat:THREE.LoopOnce,loop?Infinity:1);action.clampWhenFinished=!loop;action.fadeIn?.(.08).play();this.firstPersonArmsCurrent=name;}
  updateFirstPersonArms(delta=.016){if(this.firstPersonArmsObject)this.firstPersonArmsObject.visible=this.firstPerson&&!this.ownerFlags.vanish&&['normal','galaxy'].includes(this.state.ownerAppearance?.skin||'normal')&&!['scooter','plane'].includes(this.state.ownerAppearance?.vehicle);if(this.firstPersonArmsMixer)this.firstPersonArmsMixer.update(delta);}

  createStaffPlaneVisual(){
    const template=this.centerAssetTemplates.get('staffPlane');if(!template?.root)return null;const root=this.cloneCenterAsset('staffPlane',{targetSize:4.85,bottomAlign:false,center:true});if(!root)return null;root.name='center-admin-owner-plane';root.rotation.y=Math.PI;root.position.set(0,.55,0);root.traverse((object)=>{if(object.isMesh){object.castShadow=!!this.state.world?.shadows;object.receiveShadow=false;const mats=Array.isArray(object.material)?object.material:[object.material];for(const mat of mats){if(!mat)continue;mat.metalness=Math.max(.18,Number(mat.metalness)||0);mat.roughness=Math.min(.68,Number(mat.roughness)||.5);}}});
    const mixer=new THREE.AnimationMixer(root),clip=(template.animations||[]).find((c)=>/helice|prop|rotor/i.test(c.name||''))||(template.animations||[])[0]||null,action=clip?mixer.clipAction(clip):null;if(action){action.setLoop(THREE.LoopRepeat,Infinity);action.play();action.paused=true;}root.userData.mixer=mixer;root.userData.propellerAction=action;return root;
  }

  updateStaffPlane(delta=.016,moving=false){
    const plane=this.ownerPlaneObject;if(!plane)return;const action=plane.userData?.propellerAction,mixer=plane.userData?.mixer,flying=this.isStaffActive&&this.ownerFlags.fly,vertical=Math.abs(this.flightVerticalVelocity||0)>.05,shouldSpin=flying||!this.onGround||moving||vertical;if(action){action.paused=!shouldSpin;action.timeScale=shouldSpin?(flying?1.65:1.15):0;}if(mixer&&shouldSpin)mixer.update(delta);const targetPitch=flying?this.flightLean*.55:0,targetRoll=flying?this.flightRoll*.72:0;plane.rotation.x+=(targetPitch-plane.rotation.x)*(1-Math.exp(-delta*5.2));plane.rotation.z+=(targetRoll-plane.rotation.z)*(1-Math.exp(-delta*5.8));
  }

applyStaffVehicle(){
    if(!this.modelPivot)return;const appearance=this.state.ownerAppearance||{},allowed=this.staffCapabilities?.vehicles||['none'],disguised=this.isPublicPlayerMode(),desired=!disguised&&this.isStaffActive&&['normal','galaxy'].includes(appearance.skin)&&allowed.includes(appearance.vehicle)?appearance.vehicle:'none',current=this.ownerPlaneObject?'plane':this.ownerScooterObject?'scooter':'none';if(current===desired)return;
    this.disposeGeneratedVisual(this.ownerScooterObject);this.disposeGeneratedVisual(this.ownerPlaneObject);this.ownerScooterObject=null;this.ownerPlaneObject=null;this.ownerPlaneMixer=null;this.ownerPlaneAction=null;if(desired==='scooter'){const scooter=this.createScooterVisual();if(!scooter)return;scooter.position.set(0,.01,0);this.modelPivot.add(scooter);this.ownerScooterObject=scooter;return;}if(desired==='plane'){const plane=this.createStaffPlaneVisual();if(!plane)return;this.modelPivot.add(plane);this.ownerPlaneObject=plane;this.ownerPlaneMixer=plane.userData.mixer||null;this.ownerPlaneAction=plane.userData.propellerAction||null;}
  }

  cacheOriginalMaterial(material) {
    if(!material||material.userData.__centerOriginalMaterial)return;
    material.userData.__centerOriginalMaterial={
      color:material.color?.getHex?.(),
      emissive:material.emissive?.getHex?.(),
      emissiveIntensity:material.emissiveIntensity,
      opacity:material.opacity,
      transparent:material.transparent,
      depthWrite:material.depthWrite,
      map:material.map||null,
      emissiveMap:material.emissiveMap||null,
      metalness:material.metalness,
      roughness:material.roughness
    };
  }

  materialSupportsEmissive(material){
    return !!(material&&(material.isMeshLambertMaterial||material.isMeshPhongMaterial||material.isMeshToonMaterial||material.isMeshStandardMaterial||material.isMeshPhysicalMaterial));
  }

  sanitizeMaterialUniformCompatibility(material){
    if(!material)return false;let changed=false;
    // Three r185 liest emissiveMap bereits in refreshUniformsCommon. Ein dynamisch
    // gesetztes emissiveMap auf MeshBasic/Normal/Depth-Materialien hat dort aber
    // kein passendes Shader-Uniform und kann den Renderer genau mit
    // "Cannot set properties of undefined (setting 'value')" abbrechen.
    if(!this.materialSupportsEmissive(material)&&material.emissiveMap){material.emissiveMap=null;changed=true;}
    if(changed)material.needsUpdate=true;return changed;
  }

  applyGalaxyMaterialMode(material,active,texture=null){
    if(!material)return;this.cacheOriginalMaterial(material);const original=material.userData.__centerOriginalMaterial||{};let programChanged=false;
    if(active){
      const galaxyTexture=texture||this.ownerGalaxySkinTexture,cfg=staffThemeConfig(galaxyTexture?.userData?.__centerStaffTheme||'owner');
      if('map' in material&&galaxyTexture&&material.map!==galaxyTexture){material.map=galaxyTexture;programChanged=true;}
      if(this.materialSupportsEmissive(material)){
        if(galaxyTexture&&material.emissiveMap!==galaxyTexture){material.emissiveMap=galaxyTexture;programChanged=true;}
        material.emissive?.set?.(cfg.emissive);if('emissiveIntensity' in material)material.emissiveIntensity=1.7;
      }else if(material.emissiveMap){material.emissiveMap=null;programChanged=true;}
      material.color?.set?.(0xffffff);if('metalness' in material)material.metalness=.48;if('roughness' in material)material.roughness=.24;
    }else{
      if('map' in material&&material.map!==original.map){material.map=original.map||null;programChanged=true;}
      if(this.materialSupportsEmissive(material)){
        if(material.emissiveMap!==original.emissiveMap){material.emissiveMap=original.emissiveMap||null;programChanged=true;}
        if(original.emissive!==undefined)material.emissive?.setHex?.(original.emissive);if(original.emissiveIntensity!==undefined&&'emissiveIntensity' in material)material.emissiveIntensity=original.emissiveIntensity;
      }else if(material.emissiveMap){material.emissiveMap=null;programChanged=true;}
      if(original.color!==undefined)material.color?.setHex?.(original.color);if(original.metalness!==undefined&&'metalness' in material)material.metalness=original.metalness;if(original.roughness!==undefined&&'roughness' in material)material.roughness=original.roughness;
    }
    if(this.sanitizeMaterialUniformCompatibility(material))programChanged=true;if(programChanged)material.needsUpdate=true;
  }

  getStaffSkinTexture(theme='owner'){
    theme=normalizeStaffTheme(theme);let texture=this.staffSkinTextureCache.get(theme);if(texture)return texture;texture=this.createGalaxyTexture(256,512,theme);texture.repeat.set(1.35,2.7);texture.userData.__centerSharedStaffSkinTexture=true;this.staffSkinTextureCache.set(theme,texture);return texture;
  }

  setShadowCharacterMode(active,theme='owner') {
    theme=normalizeStaffTheme(theme);const texture=active?this.getStaffSkinTexture(theme):null;if(active)this.ownerGalaxySkinTexture=texture;this.playerModel?.traverse?.((object)=>{if(!object.isMesh)return;const mats=Array.isArray(object.material)?object.material:[object.material];for(const material of mats)this.applyGalaxyMaterialMode(material,active,texture);});
  }

  disposeHeldVisual(object){this.disposeGeneratedVisual(object);}

createFirstPersonHeldItem(kind){
    this.disposeHeldVisual(this.firstPersonHeldObject);this.firstPersonHeldObject=null;if(!this.camera||kind==='none')return;const theme=this.appearanceTheme('heldItem'),item=this.createHeldItemMesh(kind,theme);if(!item)return;
    item.name='center-first-person-held-item';item.userData.theme=theme;item.scale.multiplyScalar(kind==='staff'?.42:['shovel','pickaxe','hoe','axe','hammer'].includes(kind)?.46:.58);item.traverse((object)=>{object.renderOrder=999;if(object.material){const mats=Array.isArray(object.material)?object.material:[object.material];for(const mat of mats){if(mat){mat.depthTest=false;mat.depthWrite=false;}}}});
    const fpTransforms={sword:{p:[.34,-.34,-.72],r:[-.12,-.18,-.48]},shovel:{p:[.33,-.43,-.78],r:[-.18,-.08,-.34]},pickaxe:{p:[.34,-.38,-.73],r:[-.14,-.08,-.42]},hoe:{p:[.33,-.42,-.77],r:[-.18,-.08,-.36]},axe:{p:[.34,-.37,-.72],r:[-.14,-.08,-.42]},hammer:{p:[.34,-.38,-.72],r:[-.12,-.06,-.4]},staff:{p:[.42,-.47,-.86],r:[.08,.04,-.2]},eternalFlame:{p:[.38,-.42,-.76],r:[-.05,.02,-.24]},torch:{p:[.35,-.38,-.72],r:[-.08,0,-.3]},spear:{p:[.39,-.42,-.82],r:[.02,.03,-.18]},bow:{p:[.37,-.34,-.72],r:[-.1,0,-.3]}};const tr=fpTransforms[kind]||fpTransforms.sword;item.position.set(...tr.p);item.rotation.set(...tr.r);this.camera.add(item);this.firstPersonHeldObject=item;
  }

applyHeldItemVisual() {
    const appearance=this.state.ownerAppearance||{skin:'normal',heldItem:'none'},disguised=this.isPublicPlayerMode(),effectiveSkin=disguised?'normal':appearance.skin,effectiveVehicle=disguised?'none':appearance.vehicle,formAllowsItems=(!this.isStaffActive||['normal','galaxy'].includes(effectiveSkin))&&!['scooter','plane'].includes(effectiveVehicle),selectedKind=this.isStaffActive&&!disguised?appearance.heldItem:'none',allowedItems=this.staffCapabilities?.items||['none'],staffKind=allowedItems.includes(selectedKind)?selectedKind:'none',toolKind=this.state.equippedTool==='axe'||this.state.equippedTool==='ironAxe'?'axe':this.state.equippedTool==='pickaxe'?'pickaxe':this.state.equippedTool==='hammer'?'hammer':this.state.equippedTool==='torch'?'torch':this.state.equippedTool==='spear'?'spear':this.state.equippedTool==='bow'?'bow':'none',kind=formAllowsItems?(staffKind&&staffKind!=='none'?staffKind:toolKind):'none',theme=this.appearanceTheme('heldItem'),currentKind=this.ownerHeldObject?.userData?.kind||'none',currentTheme=this.ownerHeldObject?.userData?.theme||'owner';
    if(kind==='none'){this.disposeHeldVisual(this.ownerHeldObject);this.ownerHeldObject=null;this.ownerHeldAnchor?.removeFromParent?.();this.ownerHeldAnchor=null;this.ownerItemLight=null;this.disposeHeldVisual(this.firstPersonHeldObject);this.firstPersonHeldObject=null;return;}
    if(currentKind===kind&&currentTheme===theme&&this.ownerHeldAnchor){if(!this.firstPersonHeldObject||this.firstPersonHeldObject.userData?.kind!==kind||this.firstPersonHeldObject.userData?.theme!==theme)this.createFirstPersonHeldItem(kind);this.syncOwnerHeldAnchorPose();this.updateHeldItemTransform(performance.now(),true);this.applyOwnerVisualState();return;}
    this.disposeHeldVisual(this.ownerHeldObject);this.ownerHeldObject=null;this.ownerHeldAnchor?.removeFromParent?.();this.ownerHeldAnchor=null;this.ownerItemLight=null;this.disposeHeldVisual(this.firstPersonHeldObject);this.firstPersonHeldObject=null;
    const mesh=this.createHeldItemMesh(kind,theme);if(!mesh)return;const hand=this.playerBones.handRight;if(hand){const anchor=new THREE.Group();anchor.name='center-held-item-grip';anchor.userData.kind=kind;anchor.userData.theme=theme;if(['sword','staff','eternalFlame','shovel','pickaxe','hoe','axe','hammer'].includes(kind)){anchor.userData.worldLockedGrip=true;this.modelPivot.add(anchor);}else{hand.add(anchor);const grips={torch:{p:[.012,-.08,.068],r:[Math.PI-.18,.03,-.15]},spear:{p:[.012,-.09,.07],r:[Math.PI-.12,.02,-.1]},bow:{p:[.01,-.07,.065],r:[Math.PI-.2,.02,-.2]}};const tr=grips[kind]||{p:[.012,-.08,.068],r:[Math.PI-.18,.03,-.15]};anchor.position.set(...tr.p);anchor.rotation.set(...tr.r);}anchor.add(mesh);mesh.userData.fixedToHand=true;this.ownerHeldAnchor=anchor;}else this.modelPivot.add(mesh);this.ownerHeldObject=mesh;this.ownerItemLight=mesh.userData.light||null;this.syncOwnerHeldAnchorPose();this.createFirstPersonHeldItem(kind);if(this.firstPerson)this.ensureFirstPersonArms().then(()=>this.playFirstPersonArmsAction(this.currentFirstPersonArmsIdle(),true)).catch(()=>{});this.updateHeldItemTransform(performance.now(),true);this.applyOwnerVisualState();
  }

  syncOwnerHeldAnchorPose(){
    const anchor=this.ownerHeldAnchor;if(!anchor?.userData?.worldLockedGrip||!this.modelPivot)return;
    const hand=this.playerBones.handRight;if(!hand)return;
    this.modelPivot.updateWorldMatrix?.(true,false);hand.updateWorldMatrix?.(true,false);hand.getWorldPosition(this.tmpVector);this.modelPivot.worldToLocal(this.tmpVector);anchor.position.copy(this.tmpVector);
    const kind=anchor.userData.kind||this.ownerHeldObject?.userData?.kind||'sword';
    const transforms={
      sword:{p:[.02,-.085,.055],r:[.70,.02,-.08]},
      staff:{p:[.015,-.035,.07],r:[.53,.01,-.055]},
      eternalFlame:{p:[.018,-.03,.06],r:[.48,.01,-.06]},
      shovel:{p:[.018,-.045,.055],r:[.52,.015,-.075]},
      pickaxe:{p:[.018,-.04,.052],r:[.50,.015,-.08]},
      hoe:{p:[.018,-.043,.054],r:[.51,.015,-.075]},
      axe:{p:[.02,-.04,.052],r:[.50,.015,-.08]},
      hammer:{p:[.02,-.038,.05],r:[.49,.015,-.075]}
    };
    const tr=transforms[kind]||transforms.sword;anchor.position.x+=tr.p[0];anchor.position.y+=tr.p[1];anchor.position.z+=tr.p[2];anchor.rotation.set(...tr.r);
  }

  animateHeldItemEffects(item,now=performance.now()) {
    if(!item)return;const kind=item.userData.kind;
    if(kind==='staff'){
      const lightning=item.userData.lightning;if(lightning){const arr=lightning.geometry.attributes.position.array;for(let i=0;i<arr.length/6;i+=1){const a=now*.0017+i*.9,r=.16+(i%3)*.035;arr[i*6]=Math.cos(a)*r;arr[i*6+1]=Math.sin(a*1.3)*.065;arr[i*6+2]=Math.sin(a)*r;arr[i*6+3]=Math.cos(a+.55)*r*.42;arr[i*6+4]=Math.sin(a*1.7+.4)*.045;arr[i*6+5]=Math.sin(a+.55)*r*.42;}lightning.geometry.attributes.position.needsUpdate=true;lightning.rotation.y=now*.0007;lightning.material.opacity=.32+Math.sin(now*.003)*.1;}
      if(item.userData.crystal){item.userData.crystal.rotation.y=now*.0008;item.userData.crystal.rotation.x=Math.sin(now*.0007)*.06;item.userData.crystal.material.emissiveIntensity=1.9+Math.sin(now*.0028)*.32;}
      if(item.userData.crystalShell){item.userData.crystalShell.rotation.y=-now*.001;item.userData.crystalShell.material.opacity=.065+Math.sin(now*.0024)*.018;}
      if(item.userData.orbitA){item.userData.orbitA.rotation.z=now*.00065;item.userData.orbitA.rotation.y=now*.00032;}if(item.userData.orbitB){item.userData.orbitB.rotation.z=-now*.00052;item.userData.orbitB.rotation.y=-now*.0004;}
      if(item.userData.sparkles)item.userData.sparkles.rotation.y=now*.001;if(item.userData.light)item.userData.light.intensity=2.05+Math.sin(now*.003)*.28;
    }
    if(kind==='eternalFlame'){const parts=item.userData.flameParts||[];parts.forEach((flame,index)=>{const pulse=1+Math.sin(now*.009+index*1.7)*(.08+index*.02);flame.scale.y=pulse;flame.rotation.y=now*(.0014+index*.0005)*(index%2?-1:1);flame.rotation.z=Math.sin(now*.006+index)*.045;});if(item.userData.flameRing){item.userData.flameRing.rotation.z=now*.0012;item.userData.flameRing.material.opacity=.56+Math.sin(now*.004)*.12;}if(item.userData.flameCore)item.userData.flameCore.scale.setScalar(.92+Math.sin(now*.012)*.12);if(item.userData.light)item.userData.light.intensity=4.1+Math.sin(now*.01)*.65;if(item.userData.blueLight)item.userData.blueLight.intensity=1.35+Math.sin(now*.014+1)*.28;}
    if(kind==='torch'&&item.userData.flame){item.userData.flame.scale.y=.82+Math.sin(now*.018)*.18;item.userData.flame.rotation.y=now*.004;if(item.userData.light)item.userData.light.intensity=3.6+Math.sin(now*.02)*.7;}
  }

  updateHeldItemTransform(now=performance.now()) {
    this.syncOwnerHeldAnchorPose();
    this.animateHeldItemEffects(this.ownerHeldObject,now);this.animateHeldItemEffects(this.firstPersonHeldObject,now);
  }

  configureWearableFollower(object,parent,bone,desiredPosition,desiredQuaternion=new THREE.Quaternion()){
    if(!object||!parent||!bone)return false;
    parent.updateWorldMatrix?.(true,true);bone.updateWorldMatrix?.(true,false);
    const boneWorldPos=new THREE.Vector3(),boneWorldQ=new THREE.Quaternion(),parentWorldQ=new THREE.Quaternion();
    bone.getWorldPosition(boneWorldPos);bone.getWorldQuaternion(boneWorldQ);parent.getWorldQuaternion(parentWorldQ);
    const boneLocalPos=parent.worldToLocal(boneWorldPos.clone()),boneLocalQ=parentWorldQ.clone().invert().multiply(boneWorldQ);
    const offset=desiredPosition.clone().sub(boneLocalPos).applyQuaternion(boneLocalQ.clone().invert());
    const rotationCorrection=boneLocalQ.clone().invert().multiply(desiredQuaternion.clone());
    object.userData.centerWearableFollower={parent,bone,offset,rotationCorrection};
    object.position.copy(desiredPosition);object.quaternion.copy(desiredQuaternion);return true;
  }

  updateWearableFollower(object){
    const follow=object?.userData?.centerWearableFollower;if(!follow?.parent||!follow?.bone)return;
    const {parent,bone,offset,rotationCorrection}=follow;
    parent.updateWorldMatrix?.(true,true);bone.updateWorldMatrix?.(true,false);
    const worldPos=new THREE.Vector3(),worldQ=new THREE.Quaternion(),parentQ=new THREE.Quaternion();
    bone.getWorldPosition(worldPos);bone.getWorldQuaternion(worldQ);parent.getWorldQuaternion(parentQ);
    const localPos=parent.worldToLocal(worldPos.clone()),localQ=parentQ.clone().invert().multiply(worldQ);
    object.position.copy(localPos).add(offset.clone().applyQuaternion(localQ));
    object.quaternion.copy(localQ).multiply(rotationCorrection);
  }

  disposeGeneratedVisual(object){
    if(!object)return;const geometries=new Set(),materials=new Set(),textures=new Set();
    object.traverse?.((child)=>{if(child.geometry)geometries.add(child.geometry);const mats=Array.isArray(child.material)?child.material:[child.material];for(const mat of mats){if(!mat)continue;materials.add(mat);for(const key of ['map','emissiveMap','alphaMap','normalMap','roughnessMap','metalnessMap']){const tex=mat[key];if(tex?.userData?.__centerRuntimeGalaxyTexture&&!tex?.userData?.__centerSharedStaffSkinTexture)textures.add(tex);}}});
    object.removeFromParent?.();for(const geo of geometries)geo.dispose?.();for(const mat of materials)mat.dispose?.();for(const tex of textures)tex.dispose?.();
  }

  disposeClonedModelMaterials(object){
    if(!object)return;const materials=new Set(),textures=new Set();object.traverse?.((child)=>{const mats=Array.isArray(child.material)?child.material:[child.material];for(const mat of mats){if(!mat)continue;materials.add(mat);for(const key of ['map','emissiveMap','alphaMap','normalMap','roughnessMap','metalnessMap']){const tex=mat[key];if(tex?.userData?.__centerRuntimeGalaxyTexture&&!tex?.userData?.__centerSharedStaffSkinTexture)textures.add(tex);}}});for(const mat of materials)mat.dispose?.();for(const tex of textures)tex.dispose?.();
  }

  refreshSceneMaterialsAfterContextRestore(){
    if(!this.scene)return;this.scene.traverse?.((object)=>{const mats=Array.isArray(object.material)?object.material:[object.material];for(const mat of mats){if(!mat)continue;this.sanitizeMaterialUniformCompatibility(mat);for(const key of ['map','emissiveMap','alphaMap','normalMap','roughnessMap','metalnessMap']){const tex=mat[key];if(tex?.userData?.__centerRuntimeGalaxyTexture)tex.needsUpdate=true;}}});
  }

  splitAngelWingGeometry(sourceMesh){
    if(!sourceMesh?.geometry)return null;sourceMesh.updateWorldMatrix?.(true,false);let geometry=sourceMesh.geometry.clone();geometry.applyMatrix4(sourceMesh.matrixWorld);geometry=geometry.toNonIndexed();geometry.computeBoundingBox();const box=geometry.boundingBox,center=box.getCenter(new THREE.Vector3());geometry.translate(-center.x,-center.y,-center.z);
    const pos=geometry.getAttribute('position'),normal=geometry.getAttribute('normal'),uv=geometry.getAttribute('uv');if(!pos)return null;
    const sides={left:{p:[],n:[],u:[]},right:{p:[],n:[],u:[]}};
    for(let i=0;i<pos.count;i+=3){const cx=(pos.getX(i)+pos.getX(i+1)+pos.getX(i+2))/3,target=cx<0?sides.left:sides.right;for(let j=0;j<3;j++){const k=i+j;target.p.push(pos.getX(k),pos.getY(k),pos.getZ(k));if(normal)target.n.push(normal.getX(k),normal.getY(k),normal.getZ(k));if(uv)target.u.push(uv.getX(k),uv.getY(k));}}
    geometry.dispose();const make=(data)=>{if(!data.p.length)return null;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(data.p,3));if(data.n.length)g.setAttribute('normal',new THREE.Float32BufferAttribute(data.n,3));else g.computeVertexNormals();if(data.u.length)g.setAttribute('uv',new THREE.Float32BufferAttribute(data.u,2));g.computeBoundingBox();g.computeBoundingSphere();return g;};
    return {left:make(sides.left),right:make(sides.right)};
  }

createGalaxyOwnerCape(theme='owner',compact=false){
    theme=normalizeStaffTheme(theme);const cfg=staffThemeConfig(theme),root=new THREE.Group();root.name=compact?`remote-${theme}-angel-wings`:`${theme}-angel-wings`;root.userData.theme=theme;root.userData.compact=compact;const template=this.centerAssetTemplates.get('ownerWings');if(!template?.root)return root;
    const source=cloneSkeleton(template.root),box=new THREE.Box3().setFromObject(source),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());source.position.sub(center);source.scale.multiplyScalar((compact?1.58:1.72)/Math.max(.01,size.x,size.y));source.rotation.set(0,Math.PI,0);root.add(source);
    let texture=null;const makeMat=()=>{texture||=this.createGalaxyTexture(compact?96:256,compact?144:384,theme);texture.repeat.set(1.15,2.35);return new THREE.MeshStandardMaterial({map:texture,emissiveMap:texture,color:0xffffff,emissive:cfg.emissive,emissiveIntensity:compact?.82:1.7,metalness:.22,roughness:.24,side:THREE.DoubleSide,transparent:true,opacity:.94});};source.traverse?.((object)=>{if(object.isMesh){object.material=makeMat();object.castShadow=!compact;object.receiveShadow=false;}});
    const sparkleCount=compact?(['minimal','performance'].includes(this.state.world?.graphicsQuality)?2:6):(this.performanceTier==='low'?10:18);if(sparkleCount>0){const pos=new Float32Array(sparkleCount*3),rnd=seededRandom(26488+STAFF_THEME_IDS.indexOf(theme)*80);for(let i=0;i<sparkleCount;i++){const side=i%2?-1:1;pos[i*3]=side*(.22+rnd()*1.05);pos[i*3+1]=-.42+rnd()*.92;pos[i*3+2]=-.08+rnd()*.18;}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));const sparkles=new THREE.Points(geo,new THREE.PointsMaterial({color:cfg.accent,size:.024,transparent:true,opacity:compact?.42:.62,depthWrite:false,blending:THREE.AdditiveBlending}));root.add(sparkles);root.userData.sparkles=sparkles;}if(!compact){const light=new THREE.PointLight(cfg.primary,.62,4,2);light.position.set(0,.02,.12);root.add(light);root.userData.light=light;}root.rotation.x=.02;return root;
  }

createGalaxyOwnerHat(theme='owner',compact=false){
    theme=normalizeStaffTheme(theme);const cfg=staffThemeConfig(theme),group=new THREE.Group();group.name=compact?`remote-${theme}-crown`:`${theme}-crown`;group.userData.theme=theme;group.userData.compact=compact;const texture=this.createGalaxyTexture(compact?96:192,compact?48:96,theme),metal=new THREE.MeshStandardMaterial({map:texture,emissiveMap:texture,emissive:cfg.emissive,emissiveIntensity:1.55,metalness:.58,roughness:.2}),glow=new THREE.MeshBasicMaterial({color:cfg.accent,transparent:true,opacity:.58,depthWrite:false,blending:THREE.AdditiveBlending});
    const band=new THREE.Mesh(new THREE.TorusGeometry(.205,.025,8,36),metal);band.rotation.x=Math.PI/2;group.add(band);for(let i=0;i<5;i++){const a=(i/5)*Math.PI*2,crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.055+i%2*.012,1),metal.clone());crystal.position.set(Math.cos(a)*.19,.06+((i%2)*.025),Math.sin(a)*.19);crystal.rotation.y=a;group.add(crystal);}const halo=new THREE.Mesh(new THREE.TorusGeometry(.25,.008,6,42),glow);halo.rotation.x=Math.PI/2;halo.position.y=.08;group.add(halo);if(!compact){const light=new THREE.PointLight(cfg.primary,.42,2.6,2);light.position.y=.1;group.add(light);group.userData.light=light;}group.userData.halo=halo;group.userData.galaxyTexture=texture;return group;
  }

applyOwnerWearables(){
    const appearance=this.state.ownerAppearance||{},capeTheme=this.appearanceTheme('cape'),hatTheme=this.appearanceTheme('hat'),allowed=!!(this.isStaffActive&&this.staffCapabilities?.ownerCosmetics&&!this.isPublicPlayerMode()&&['normal','galaxy'].includes(appearance.skin||'normal')),wantCape=allowed&&!!appearance.cape,wantHat=allowed&&!!appearance.hat;
    if(this.ownerCapeObject&&this.ownerCapeObject.userData?.theme!==capeTheme){this.disposeGeneratedVisual(this.ownerCapeObject);this.ownerCapeObject=null;}if(this.ownerHatObject&&this.ownerHatObject.userData?.theme!==hatTheme){this.disposeGeneratedVisual(this.ownerHatObject);this.ownerHatObject=null;}
    if(!wantCape&&this.ownerCapeObject){this.disposeGeneratedVisual(this.ownerCapeObject);this.ownerCapeObject=null;}if(!wantHat&&this.ownerHatObject){this.disposeGeneratedVisual(this.ownerHatObject);this.ownerHatObject=null;}
    if(wantCape&&!this.ownerCapeObject){const cape=this.createGalaxyOwnerCape(capeTheme);this.modelPivot.add(cape);this.ownerCapeObject=cape;const chest=this.playerBones.chest||this.playerBones.neck;if(!this.configureWearableFollower(cape,this.modelPivot,chest,new THREE.Vector3(0,1.46,-.24),new THREE.Quaternion()))cape.position.set(0,1.46,-.24);}
    if(wantHat&&!this.ownerHatObject){const hat=this.createGalaxyOwnerHat(hatTheme);this.modelPivot.add(hat);this.ownerHatObject=hat;const head=this.playerBones.head||this.playerBones.neck;if(!this.configureWearableFollower(hat,this.modelPivot,head,new THREE.Vector3(0,1.84,.005),new THREE.Quaternion()))hat.position.set(0,1.84,.005);}
  }

  wingFlightPose(flying=false,motion=0,vertical=0,now=performance.now()){
    const moving=clamp(Number(motion)||0,0,1),up=flying&&vertical>.22,down=flying&&vertical<-.22;let sweep=.075+Math.sin(now*.0018)*.018,spread=.075;
    if(flying){
      if(down){sweep=.035+Math.sin(now*.0024)*.035;spread=.055+Math.sin(now*.0018)*.012;}
      else if(up){sweep=.18+Math.sin(now*.0125)*.34;spread=.095;}
      else if(moving>.06){sweep=.15+Math.sin(now*.0105)*(.24+moving*.10);spread=.085;}
      else{sweep=.105+Math.sin(now*.0046)*.105;spread=.08;}
    }
    return {sweep,spread};
  }

  updateOwnerWearables(delta=.016,now=performance.now()){
    if(this.ownerCapeObject){
      this.updateWearableFollower(this.ownerCapeObject);const left=this.ownerCapeObject.userData?.left?.pivot,right=this.ownerCapeObject.userData?.right?.pivot,flying=this.isStaffActive&&this.ownerFlags.fly,motion=clamp(this.flightInputMagnitude||0,0,1),vertical=this.flightVerticalVelocity||0,{sweep,spread}=this.wingFlightPose(flying,motion,vertical,now);
      // V265: Der eigentliche Flügelschlag läuft jetzt um die Y-Achse. Dadurch
      // schwingen die Flügel hinter dem Rücken nach vorn/hinten statt zum Boden/Himmel.
      if(left){left.rotation.x=.01;left.rotation.y=-sweep;left.rotation.z=spread;}if(right){right.rotation.x=.01;right.rotation.y=sweep;right.rotation.z=-spread;}
      if(this.ownerCapeObject.userData?.sparkles)this.ownerCapeObject.userData.sparkles.rotation.y=Math.sin(now*.0013)*.08;if(this.ownerCapeObject.userData?.light)this.ownerCapeObject.userData.light.intensity=.66+Math.sin(now*.003)*.11;
    }
    if(this.ownerHatObject){this.updateWearableFollower(this.ownerHatObject);if(this.ownerHatObject.userData?.halo)this.ownerHatObject.userData.halo.rotation.z=now*.00055;if(this.ownerHatObject.userData?.light)this.ownerHatObject.userData.light.intensity=.44+Math.sin(now*.002)*.07;}
  }

  spawnTransformationEffectAt(position,compact=false){
    if(!this.scene||!position)return;
    const group=new THREE.Group();group.name='center-transformation-cloud';group.position.copy(position);group.position.y+=compact?.68:.88;
    const radius=compact?.52:.7,puffSize=compact?.11:.15,colors=[0xe8e4ff,0xa36cff,0x6dd7ff,0xff7bd5];
    const geometry=new THREE.IcosahedronGeometry(puffSize,1),puffs=[];
    for(let i=0;i<14;i+=1){
      const angle=(i/14)*Math.PI*2+Math.random()*.35,up=(Math.random()-.15)*.5;
      const material=new THREE.MeshBasicMaterial({color:colors[i%colors.length],transparent:true,opacity:.58,depthWrite:false,blending:THREE.AdditiveBlending});
      const puff=new THREE.Mesh(geometry,material),r=.12+Math.random()*radius*.35;
      puff.position.set(Math.cos(angle)*r,(Math.random()-.35)*.34,Math.sin(angle)*r);
      puff.scale.setScalar(.65+Math.random()*.75);group.add(puff);
      puffs.push({mesh:puff,velocity:new THREE.Vector3(Math.cos(angle)*(radius*.78+Math.random()*.35),up+.34+Math.random()*.28,Math.sin(angle)*(radius*.78+Math.random()*.35)),spin:(Math.random()-.5)*3});
    }
    const ring=new THREE.Mesh(new THREE.TorusGeometry(compact?.34:.46,.025,8,32),new THREE.MeshBasicMaterial({color:0xb96cff,transparent:true,opacity:.48,depthWrite:false,blending:THREE.AdditiveBlending}));ring.rotation.x=Math.PI/2;ring.position.y=-.42;group.add(ring);
    const light=new THREE.PointLight(0x8a4cff,compact?.6:1.05,compact?2.4:3.6,2);light.position.y=.1;group.add(light);
    this.scene.add(group);this.transformationEffects.push({group,puffs,ring,light,geometry,start:performance.now(),duration:compact?620:760});
    while(this.transformationEffects.length>10){const old=this.transformationEffects.shift();this.disposeTransformationEffect(old);}
  }

  disposeTransformationEffect(effect){
    if(!effect)return;effect.group?.removeFromParent?.();effect.group?.traverse?.((object)=>{if(object.material){const mats=Array.isArray(object.material)?object.material:[object.material];for(const mat of mats)mat?.dispose?.();}if(object.geometry&&object.geometry!==effect.geometry)object.geometry.dispose?.();});effect.geometry?.dispose?.();
  }

  updateTransformationEffects(delta=.016,now=performance.now()){
    for(let i=this.transformationEffects.length-1;i>=0;i-=1){const effect=this.transformationEffects[i],t=clamp((now-effect.start)/effect.duration,0,1),fade=1-t;for(const puff of effect.puffs){puff.mesh.position.addScaledVector(puff.velocity,delta);puff.mesh.rotation.y+=puff.spin*delta;puff.mesh.rotation.x+=puff.spin*.45*delta;puff.mesh.scale.multiplyScalar(1+delta*.55);puff.mesh.material.opacity=.58*fade*fade;}if(effect.ring){const scale=1+t*1.7;effect.ring.scale.setScalar(scale);effect.ring.material.opacity=.45*fade;}if(effect.light)effect.light.intensity=(1-t)*(effect.duration<700?.6:1.05);if(t>=1){this.disposeTransformationEffect(effect);this.transformationEffects.splice(i,1);}}
  }

applyOwnerAppearance() {
    if(!this.playerModel)return;const appearance=this.state.ownerAppearance||{skin:'normal',size:1,heldItem:'none'},caps=this.staffCapabilities||staffCapabilities(this.activeStaffRole,this.activeStaffDetailRole),disguised=this.isPublicPlayerMode(),size=!disguised&&this.isStaffActive&&caps.size?clamp(Number(appearance.size)||1,.45,2.5):1;this.modelPivot.scale.setScalar(size);
    if(this.ownerFormObject){this.disposeGeneratedVisual(this.ownerFormObject);this.ownerFormObject=null;}const requestedSkin=disguised?'normal':this.isStaffActive?appearance.skin:'normal',skin=caps.forms?.includes(requestedSkin)?requestedSkin:'normal';if(!disguised&&appearance.skin!==skin)appearance.skin=skin;if(!disguised&&skin!=='normal'&&appearance.vehicle!=='none')appearance.vehicle='none';const staffSkinTheme=this.effectiveStaffSkinTheme();this.setShadowCharacterMode(staffSkinTheme!=='none'&&skin==='normal',staffSkinTheme==='none'?'owner':staffSkinTheme);const effectiveVehicle=disguised?'none':appearance.vehicle;this.playerModel.visible=!this.firstPerson&&skin==='normal'&&effectiveVehicle!=='plane';if(this.isStaffActive&&!disguised&&skin!=='normal'){const form=this.createOwnerForm(skin);this.modelPivot.add(form);this.ownerFormObject=form;form.visible=!this.firstPerson;}this.applyStaffVehicle();this.applyHeldItemVisual();this.applyOwnerWearables();this.applyOwnerVisualState();this.updateOwnerAura(.016,performance.now());
  }

applyOwnerVisualState() {
    if(!this.playerModel)return;const appearance=this.state.ownerAppearance||{skin:'normal'},disguised=this.isPublicPlayerMode(),skin=disguised?'normal':appearance.skin,vehicle=disguised?'none':appearance.vehicle,staffSkinTheme=this.effectiveStaffSkinTheme(),themedSkin=staffSkinTheme!=='none'&&skin==='normal',vanished=this.isStaffActive&&this.ownerFlags.vanish,cosmeticAllowed=this.isStaffActive&&this.staffCapabilities?.ownerCosmetics&&!disguised;
    this.playerModel.traverse((object)=>{if(!object.isMesh)return;const materials=Array.isArray(object.material)?object.material:[object.material];for(const material of materials){if(!material)continue;this.cacheOriginalMaterial(material);const original=material.userData.__centerOriginalMaterial;const opacity=vanished?.24:(original.opacity??1);material.transparent=vanished||!!original.transparent||opacity<1;material.opacity=opacity;material.depthWrite=!vanished&&original.depthWrite!==false;}});
    if(this.ownerFormObject)this.ownerFormObject.traverse((object)=>{if(!object.isMesh)return;const mats=Array.isArray(object.material)?object.material:[object.material];for(const mat of mats){if(!mat)continue;mat.transparent=vanished||mat.transparent;mat.opacity=vanished?.24:(mat.userData.__formOpacity??mat.opacity??1);mat.depthWrite=!vanished;}});
    if(this.ownerAura)this.ownerAura.visible=cosmeticAllowed&&!!appearance.aura&&!vanished&&!this.firstPerson;const applyItem=(root)=>root?.traverse?.((object)=>{if(object.isLight){if(object.userData.__centerBaseIntensity===undefined)object.userData.__centerBaseIntensity=object.intensity;object.intensity=vanished?0:object.userData.__centerBaseIntensity;return;}if(!object.isMesh&&!object.isLine&&!object.isLineSegments&&!object.isPoints)return;const mats=Array.isArray(object.material)?object.material:[object.material];for(const material of mats){if(!material)continue;this.cacheOriginalMaterial(material);const original=material.userData.__centerOriginalMaterial;material.transparent=vanished||!!original.transparent;material.opacity=vanished?0:(original.opacity??1);material.depthWrite=!vanished&&original.depthWrite!==false;}});applyItem(this.ownerHeldObject);applyItem(this.firstPersonHeldObject);applyItem(this.ownerCapeObject);applyItem(this.ownerHatObject);applyItem(this.ownerScooterObject);applyItem(this.ownerPlaneObject);
    if(this.ownerHeldAnchor)this.ownerHeldAnchor.visible=!this.firstPerson&&!vanished;if(this.firstPersonHeldObject)this.firstPersonHeldObject.visible=this.firstPerson&&!vanished;if(this.ownerCapeObject)this.ownerCapeObject.visible=!this.firstPerson&&!vanished&&cosmeticAllowed&&!!appearance.cape&&vehicle!=='plane';if(this.ownerHatObject)this.ownerHatObject.visible=!this.firstPerson&&!vanished&&cosmeticAllowed&&!!appearance.hat&&vehicle!=='plane';if(this.ownerScooterObject)this.ownerScooterObject.visible=!this.firstPerson&&!vanished&&this.isStaffActive&&vehicle==='scooter';if(this.ownerPlaneObject)this.ownerPlaneObject.visible=!this.firstPerson&&!vanished&&this.isStaffActive&&vehicle==='plane';if(this.playerModel&&vehicle==='plane')this.playerModel.visible=false;
  }

async ensureCorrectPlayerModel() {
    const player=bridgeSnapshot(),staffWhite=this.isStaffActive&&!this.isPublicPlayerMode(),skin=staffWhite?'owner':this.isPublicPlayerMode()?this.state.ownerAppearance.publicGender:player.gender;
    if(this.playerSkin===skin&&this.playerModel){this.updateRoleHud();return;}
    const token=(this.playerModelInstallToken||0)+1;this.playerModelInstallToken=token;
    this.playerMixer?.stopAllAction?.();
    if(this.ownerHeldObject)this.disposeGeneratedVisual(this.ownerHeldObject);if(this.ownerCapeObject)this.disposeGeneratedVisual(this.ownerCapeObject);if(this.ownerHatObject)this.disposeGeneratedVisual(this.ownerHatObject);if(this.ownerScooterObject)this.disposeGeneratedVisual(this.ownerScooterObject);if(this.ownerPlaneObject)this.disposeGeneratedVisual(this.ownerPlaneObject);if(this.ownerAura)this.disposeGeneratedVisual(this.ownerAura);if(this.ownerFormObject)this.disposeGeneratedVisual(this.ownerFormObject);if(this.playerModel)this.disposeClonedModelMaterials(this.playerModel);
    this.modelPivot.clear();const installPivot=new THREE.Group();installPivot.name='center-flight-visual-pivot';this.flightVisualPivot=installPivot;this.modelPivot.add(installPivot);this.playerModel=null;this.playerMixer=null;this.playerAction=null;this.playerWalkAction=null;this.playerRunAction=null;this.playerActiveAction=null;this.playerBones={};this.ownerHeldObject=null;this.ownerHeldAnchor=null;this.firstPersonHeldObject=null;this.ownerFormObject=null;this.ownerCapeObject=null;this.ownerHatObject=null;this.ownerScooterObject=null;this.ownerPlaneObject=null;this.ownerPlaneMixer=null;this.ownerPlaneAction=null;this.ownerAura=null;this.flightEffects=null;this.flightLean=0;this.flightInputMagnitude=0;
    try{
      const gltf=await this.gltfLoader.loadAsync(MODEL_PATHS[skin]||MODEL_PATHS.male);if(token!==this.playerModelInstallToken)return;const root=gltf.scene;root.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(root),height=Math.max(.01,box.max.y-box.min.y);root.scale.multiplyScalar((skin==='owner'?1.86:1.76)/height);root.updateMatrixWorld(true);const scaled=new THREE.Box3().setFromObject(root),center=scaled.getCenter(new THREE.Vector3());root.position.x-=center.x;root.position.z-=center.z;root.position.y-=scaled.min.y-.035;root.rotation.y=CHARACTER_MODEL_YAW;root.traverse((object)=>{if(object.isMesh){object.castShadow=!!this.state.world?.shadows;object.receiveShadow=!!this.state.world?.shadows;const mats=Array.isArray(object.material)?object.material:[object.material];mats.forEach((m)=>{if(m?.map)m.map.colorSpace=THREE.SRGBColorSpace;if(m){m.envMapIntensity=.25;this.cacheOriginalMaterial(m);}});}});if(token!==this.playerModelInstallToken)return;this.playerModel=root;installPivot.add(root);this.cachePlayerBones(root);
      const walkClip=this.selectLocomotionClip(gltf.animations||[]);let runClip=null;
      if(RUN_MODEL_PATHS[skin]){try{const runGltf=await this.gltfLoader.loadAsync(RUN_MODEL_PATHS[skin]);if(token!==this.playerModelInstallToken)return;const source=this.selectLocomotionClip(runGltf.animations||[]);runClip=this.retargetLocomotionClip(source,root,'run');}catch(error){if(token!==this.playerModelInstallToken)return;console.warn('Center-Rennanimation konnte nicht geladen werden',error);}}
      if(token!==this.playerModelInstallToken)return;if(walkClip||runClip){this.playerMixer=new THREE.AnimationMixer(root);if(walkClip){this.playerWalkAction=this.playerMixer.clipAction(walkClip);this.playerWalkAction.play();this.playerWalkAction.paused=true;this.playerAction=this.playerWalkAction;}if(runClip){this.playerRunAction=this.playerMixer.clipAction(runClip);this.playerRunAction.play();this.playerRunAction.paused=true;}this.resetLocomotionToIdle(true);}
    } catch(error){if(token!==this.playerModelInstallToken)return;console.warn('Center-Charaktermodell konnte nicht geladen werden',error);this.playerModel=this.makeFallbackCharacter(skin);installPivot.add(this.playerModel);}
    if(token!==this.playerModelInstallToken)return;this.playerSkin=skin;this.updateRoleHud();this.applyPerspectiveVisibility();this.applyOwnerAppearance();
  }

  makeFallbackCharacter(skin='male',variant=0) {
    const group=new THREE.Group();
    const colors=skin==='npcwhite'?[0xe8eceb,0xe8eceb]:skin==='owner'?[0x20211f,0x9a7a3c]:skin==='female'?[0x684f7a,0xd3a786]:[0x435f69,0xb88869];
    const body=new THREE.Mesh(new THREE.CapsuleGeometry(.36,.85,4,8),new THREE.MeshStandardMaterial({color:colors[0],roughness:.85})); body.position.y=1.05; group.add(body);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.27,12,8),new THREE.MeshStandardMaterial({color:colors[1],roughness:.9})); head.position.y=1.92; group.add(head);
    const hair=new THREE.Mesh(new THREE.SphereGeometry(.285,10,6,0,Math.PI*2,0,Math.PI*.58),new THREE.MeshStandardMaterial({color:variant%2?0x5a3824:0x2e241f})); hair.position.y=1.98; group.add(hair);
    for(const sx of [-1,1]) { const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.11,.65,3,6),body.material); arm.position.set(sx*.48,1.13,0); arm.rotation.z=sx*.12; group.add(arm); const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.13,.72,3,6),new THREE.MeshStandardMaterial({color:0x3d332e})); leg.position.set(sx*.2,.35,0); group.add(leg); }
    return group;
  }

updateRoleHud() {
    const previousRole=this.activeStaffRole,previousDetail=this.activeStaffDetailRole,local=roleSnapshot();let detailRole=local.detailRole||detailedStaffRole(local.rawRole),activeRole=canonicalStaffRole(detailRole);if(this.onlineUser&&this.ownerVerificationChecked){detailRole=detailedStaffRole(this.verifiedStaffRoleRaw||this.verifiedStaffRole);activeRole=canonicalStaffRole(detailRole);}this.activeStaffDetailRole=detailRole;this.activeStaffRole=activeRole;this.staffCapabilities=staffCapabilities(activeRole,detailRole);this.isStaffActive=detailRole!=='player';this.isOwnerActive=detailRole==='owner';if(!['owner','admin'].includes(activeRole)&&Number(this.state?.needs?.health)>100)this.state.needs.health=100;
    this.overlay.classList.toggle('is-owner',this.isOwnerActive);this.overlay.classList.toggle('is-staff',this.isStaffActive);this.overlay.dataset.staffRole=detailRole;if(this.ownerMenuButton){this.ownerMenuButton.hidden=!this.isStaffActive;this.ownerMenuButton.title=`${STAFF_ROLE_LABELS[detailRole]||STAFF_ROLE_LABELS[activeRole]||'Team'}-Menü (Punkt)`;}
    const caps=this.staffCapabilities,appearance=this.state.ownerAppearance,before=`${appearance.skin}|${appearance.staffSkinTheme}|${appearance.aura}|${appearance.auraTheme}|${appearance.size}|${appearance.heldItem}|${appearance.heldItemTheme}|${appearance.cape}|${appearance.capeTheme}|${appearance.hat}|${appearance.hatTheme}|${appearance.vehicle}|${appearance.publicMode}|${appearance.publicGender}`;if(!caps.size)appearance.size=1;if(!caps.forms.includes(appearance.skin))appearance.skin='normal';if(!caps.items.includes(appearance.heldItem))appearance.heldItem='none';if(!(caps.vehicles||['none']).includes(appearance.vehicle))appearance.vehicle='none';if(!caps.ownerCosmetics){appearance.aura=false;appearance.cape=false;appearance.hat=false;}const ownTheme=staffThemeForDetailedRole(detailRole);if(!this.isOwnerActive){if(['admin','moderator','supporter'].includes(ownTheme)){appearance.auraTheme=ownTheme;appearance.capeTheme=ownTheme;appearance.hatTheme=ownTheme;appearance.heldItemTheme=ownTheme;if(!['none',ownTheme].includes(appearance.staffSkinTheme))appearance.staffSkinTheme='none';}else{appearance.staffSkinTheme='none';appearance.aura=false;appearance.cape=false;appearance.hat=false;appearance.heldItem='none';}}if(!['owner','admin'].includes(activeRole))appearance.publicMode='staff';else if(activeRole==='admin'&&!['admin','player','staff'].includes(appearance.publicMode))appearance.publicMode='admin';
    for(const [flag,cap] of [['vanish','vanish'],['god','god'],['noclip','noclip'],['fly','fly'],['freezeTime','freezeTime']])if(!caps[cap])this.ownerFlags[flag]=false;if(!caps.speed){this.ownerFlags.speedLevel=0;this.ownerFlags.speedMultiplier=1;}else if(!Number.isFinite(Number(this.ownerFlags.speedMultiplier)))this.ownerFlags.speedMultiplier=OWNER_SPEED_LEVELS[Math.floor(clamp(this.ownerFlags.speedLevel,0,OWNER_SPEED_LEVELS.length-1))]||1;if(!this.isStaffActive)this.closeOwnerMenu();const after=`${appearance.skin}|${appearance.staffSkinTheme}|${appearance.aura}|${appearance.auraTheme}|${appearance.size}|${appearance.heldItem}|${appearance.heldItemTheme}|${appearance.cape}|${appearance.capeTheme}|${appearance.hat}|${appearance.hatTheme}|${appearance.vehicle}|${appearance.publicMode}|${appearance.publicGender}`;if(previousRole!==activeRole||previousDetail!==detailRole||before!==after||!this.playerModel)this.applyOwnerAppearance();else this.applyOwnerVisualState();
  }

  async verifyLocalOwnerRole() {
    this.ownerVerificationChecked=false;this.ownerVerifiedByFirebase=false;this.verifiedStaffRole='player';this.verifiedStaffRoleRaw='player';const local=roleSnapshot();
    if(!this.onlineFb||!this.onlineUser?.uid){this.verifiedStaffRoleRaw=local.detailRole||local.rawRole;this.verifiedStaffRole=canonicalStaffRole(this.verifiedStaffRoleRaw);this.ownerVerifiedByFirebase=this.verifiedStaffRoleRaw==='owner';this.ownerVerificationChecked=true;this.updateRoleHud();return local.isStaff;}
    try{const snap=await this.onlineFb.getDoc(this.onlineFb.doc(this.onlineFb.db,'staffRoles',this.onlineUser.uid));const raw=snap.exists()?String(snap.data()?.role||''):'player';this.verifiedStaffRoleRaw=detailedStaffRole(raw);this.verifiedStaffRole=canonicalStaffRole(this.verifiedStaffRoleRaw);this.ownerVerifiedByFirebase=this.verifiedStaffRoleRaw==='owner';}
    catch(error){if(isFirebasePermissionError(error)){this.verifiedStaffRoleRaw=local.detailRole||local.rawRole;this.verifiedStaffRole=canonicalStaffRole(this.verifiedStaffRoleRaw);this.ownerVerifiedByFirebase=this.verifiedStaffRoleRaw==='owner';}else{console.warn('Center Teamrolle konnte nicht bestätigt werden',error);this.verifiedStaffRoleRaw='player';this.verifiedStaffRole='player';this.ownerVerifiedByFirebase=false;}}
    this.ownerVerificationChecked=true;this.updateRoleHud();return this.isStaffActive;
  }

  reloadLatestSave() {
    const latest = bridgeSnapshot();
    const nextState = normalizeSaveState(latest.centerState);
    const changedSlot = latest.slot !== this.currentSlot;
    this.currentSlot = latest.slot;
    this.state = nextState;
    this.ensureOpenWorldState();
    this.yaw = Number(this.state.position.yaw || Math.PI);
    this.firstPerson = this.state.position.view === 'first';
    if (this.initialized) {
      for (const object of this.ownBuildingObjects.values()) object.removeFromParent();
      this.ownBuildingObjects.clear();
      this.hotspots = this.hotspots.filter((hotspot) => !String(hotspot.id || '').startsWith('build-'));
      for (const collider of [...this.colliders]) if (collider.source === 'owned') this.unregisterCollider(collider);
      this.buildSavedSettlement();
      this.restoreHarvestedNodes();
      if (changedSlot) { this.rebuildStreamedWorld(); this.toast(`Spielstand ${latest.slot + 1} geladen · neuer Weltbereich.`); }
    }
  }

  restoreStateToWorld() {
    const pos=this.state.position;
    const x=clamp(pos.x,this.worldBounds.minX,this.worldBounds.maxX);
    const z=clamp(pos.z,this.worldBounds.minZ,this.worldBounds.maxZ);
    this.player.position.set(x,terrainHeightAt(x,z),z);
    this.yaw=Number(pos.yaw||Math.PI);
    this.firstPerson=pos.view==='first';
    this.applyPerspectiveVisibility();
    this.snapCamera();
    this.restoreHarvestedNodes();
    this.renderHud(true);
    this.updateChunkStreaming(true);
  }

saveState(force=false) {
    if(!this.player) return;
    const now=Date.now();
    if(!force&&now-this.lastSaveAt<5000) return;
    this.lastSaveAt=now;
    this.state.version=7;
    this.state.position={x:Number(this.player.position.x.toFixed(2)),z:Number(this.player.position.z.toFixed(2)),yaw:Number(this.yaw.toFixed(4)),view:this.firstPerson?'first':'third'};
    this.state.lastSavedAt=now;
    const bridge=window.JKGamesCenterBridge;
    if(bridge?.saveCenterState) bridge.saveCenterState(this.state);
    else { try{localStorage.setItem('jk-games-center-medieval',JSON.stringify(this.state));}catch{} }
  }

  togglePerspective() { this.firstPerson=!this.firstPerson; this.applyPerspectiveVisibility(); if(this.firstPerson&&this.state.ownerAppearance?.vehicle!=='plane')this.ensureFirstPersonArms().catch(()=>{}); this.toast(this.firstPerson?'Ego-Perspektive':'Außenperspektive'); }
applyPerspectiveVisibility(){this.overlay.classList.toggle('is-first-person',this.firstPerson);this.overlay.classList.toggle('is-third-person',!this.firstPerson);const disguised=this.isPublicPlayerMode(),appearance=this.state.ownerAppearance||{},skin=disguised?'normal':appearance.skin||'normal',vehicle=disguised?'none':appearance.vehicle||'none',cosmeticAllowed=this.isStaffActive&&this.staffCapabilities?.ownerCosmetics&&!disguised;if(this.playerModel)this.playerModel.visible=!this.firstPerson&&['normal','galaxy'].includes(skin)&&vehicle!=='plane';if(this.ownerFormObject)this.ownerFormObject.visible=!this.firstPerson&&!disguised;if(this.ownerHeldAnchor)this.ownerHeldAnchor.visible=!this.firstPerson&&!(this.isStaffActive&&this.ownerFlags.vanish);if(this.firstPersonHeldObject)this.firstPersonHeldObject.visible=this.firstPerson&&!(this.isStaffActive&&this.ownerFlags.vanish);if(this.ownerCapeObject)this.ownerCapeObject.visible=!this.firstPerson&&cosmeticAllowed&&!!appearance.cape&&vehicle!=='plane';if(this.ownerHatObject)this.ownerHatObject.visible=!this.firstPerson&&cosmeticAllowed&&!!appearance.hat&&vehicle!=='plane';if(this.ownerScooterObject)this.ownerScooterObject.visible=!this.firstPerson&&this.isStaffActive&&vehicle==='scooter';if(this.ownerPlaneObject)this.ownerPlaneObject.visible=!this.firstPerson&&this.isStaffActive&&vehicle==='plane';if(this.firstPersonArmsObject)this.firstPersonArmsObject.visible=this.firstPerson&&!(this.isStaffActive&&this.ownerFlags.vanish)&&['normal','galaxy'].includes(skin)&&!['scooter','plane'].includes(vehicle);if(this.firstPerson&&vehicle!=='plane')this.ensureFirstPersonArms().catch(()=>{});this.applyOwnerAppearance();}
  requestJump() {
    if(this.isStaffActive&&this.ownerFlags.fly)return;
    const god=this.isStaffActive&&this.ownerFlags.god;
    if(!this.onGround||(!god&&this.state.needs.stamina<=8))return;
    this.fallStartY=this.player.position.y;this.velocityY=6.15;this.onGround=false;
    if(!god)this.state.needs.stamina=Math.max(0,this.state.needs.stamina-5);
    this.triggerActionAnimation('jump',780);
    // Kurze Sprünge dürfen im 1,25-s-Presence-Takt nicht verschwinden. Zwei
    // gezielte Zwischenstände machen die Höhe für andere Spieler sichtbar.
    setTimeout(()=>{if(this.opened&&!this.onGround&&!(this.isStaffActive&&this.ownerFlags.fly))this.publishPresence(true).catch(()=>{});},120);
    setTimeout(()=>{if(this.opened&&!this.onGround&&!(this.isStaffActive&&this.ownerFlags.fly))this.publishPresence(true).catch(()=>{});},420);
  }

  exhaustSprint() {
    this.sprintLockedUntilRelease=true;
    this.input.sprint=false;
    this.sprintButton?.classList.remove('is-active');
  }

  releaseSprintLockIfReady() {
    if(this.keys.has('ShiftLeft')||this.keys.has('ShiftRight'))return;
    this.sprintLockedUntilRelease=false;
  }

  currentInput() {
    const forward=(this.keys.has('KeyW')||this.keys.has('ArrowUp')?1:0)-(this.keys.has('KeyS')||this.keys.has('ArrowDown')?1:0)+this.input.forward;
    const right=(this.keys.has('KeyD')||this.keys.has('ArrowRight')?1:0)-(this.keys.has('KeyA')||this.keys.has('ArrowLeft')?1:0)+this.input.right;
    const keyboardSprint=this.keys.has('ShiftLeft')||this.keys.has('ShiftRight');
    if(!keyboardSprint&&!this.input.sprint)this.releaseSprintLockIfReady();
    return {forward:clamp(forward,-1,1),right:clamp(right,-1,1),sprint:!this.sprintLockedUntilRelease&&(this.input.sprint||keyboardSprint)};
  }

  nearbyColliders(x,z) {
    const found=new Set(),gx=Math.floor(x/COLLIDER_CELL_SIZE),gz=Math.floor(z/COLLIDER_CELL_SIZE);
    for(let dx=-1;dx<=1;dx+=1)for(let dz=-1;dz<=1;dz+=1){const bucket=this.collisionBuckets.get(`${gx+dx}:${gz+dz}`);if(bucket)for(const collider of bucket)found.add(collider);}
    return found;
  }

  colliderDistance(collider,x,z) {
    if(collider.shape==='segment'){
      const half=Number(collider.length||0)*.5,dx=Math.sin(Number(collider.yaw||0))*half,dz=Math.cos(Number(collider.yaw||0))*half;
      return pointSegmentDistance(x,z,collider.x-dx,collider.z-dz,collider.x+dx,collider.z+dz);
    }
    return Math.hypot(x-collider.x,z-collider.z);
  }

  supportHeightAt(x,z,currentY=this.player?.position.y||0) {
    let support=terrainHeightAt(x,z);
    for(const collider of this.nearbyColliders(x,z)){
      if(!collider.walkable||collider.active===false||collider.node?.active===false)continue;
      if(this.colliderDistance(collider,x,z)>Math.max(.28,collider.radius*.62))continue;
      const top=terrainHeightAt(collider.x,collider.z)+Number(collider.height||0);
      if(currentY>=top-1.15&&currentY<=top+1.6)support=Math.max(support,top);
    }
    return support;
  }

  collides(x,z,y=this.player?.position.y||0) {
    if(this.isStaffActive&&this.ownerFlags.noclip)return false;
    for(const collider of this.nearbyColliders(x,z)){
      if(collider.active===false||collider.node?.active===false)continue;
      const ground=terrainHeightAt(collider.x,collider.z),top=ground+Number(collider.height||4);
      if(y>top+.18)continue;
      if(collider.walkable&&y>=top-.16)continue;
      if(this.colliderDistance(collider,x,z)<collider.radius+PLAYER_COLLIDER_RADIUS)return true;
    }
    return false;
  }

  updateMovement(delta) {
    if(this.deathScreenOpen)return;
    const input=this.currentInput(),length=Math.hypot(input.forward,input.right),moving=length>.05,startX=this.player.position.x,startY=this.player.position.y,startZ=this.player.position.z;
    const owner=this.isStaffActive,fly=owner&&this.ownerFlags.fly,god=owner&&this.ownerFlags.god,scooter=owner&&this.state.ownerAppearance?.vehicle==='scooter'&&!!this.ownerScooterObject,plane=owner&&this.state.ownerAppearance?.vehicle==='plane'&&!!this.ownerPlaneObject,mounted=!!this.mountedHorse;
    const inWater=!fly&&!mounted&&!scooter&&!plane&&this.isInWater(this.player.position.x,this.player.position.z);
    const sprint=input.sprint&&(god||this.state.needs.stamina>2)&&!inWater;
    const speedBoost=owner?clamp(Number(this.ownerFlags.speedMultiplier)||OWNER_SPEED_LEVELS[Math.floor(clamp(this.ownerFlags.speedLevel,0,OWNER_SPEED_LEVELS.length-1))]||1,1,OWNER_MAX_SPEED_MULTIPLIER):1;
    const scooterKmh=[40,80,120,150][Math.floor(clamp(Number(this.state.ownerAppearance?.scooterTuning)||0,0,3))]||40;
    const baseSpeed=plane?(fly?(sprint?27:20):7.2):scooter?scooterKmh/3.6:mounted?(sprint?13.2:8.9):(sprint?8.8:5.1);
    const healthRatio=this.state.needs.health/Math.max(1,this.effectiveMaxHealth());const speed=baseSpeed*(inWater?.48:1)*((healthRatio<.25&&!god)?.72:1)*((scooter||plane)?1:speedBoost);
    let movedDistance=0;
    if(moving){
      const f=input.forward/Math.max(1,length),r=input.right/Math.max(1,length),sin=Math.sin(this.yaw),cos=Math.cos(this.yaw);
      const dx=(r*cos-f*sin)*speed*delta,dz=(-r*sin-f*cos)*speed*delta;
      const oldX=this.player.position.x,oldZ=this.player.position.z,currentY=this.player.position.y;
      const nx=clamp(oldX+dx,this.worldBounds.minX,this.worldBounds.maxX),nz=clamp(oldZ+dz,this.worldBounds.minZ,this.worldBounds.maxZ);
      let movedX=oldX,movedZ=oldZ;
      if(!this.collides(nx,nz,currentY)){movedX=nx;movedZ=nz;}else{
        if(!this.collides(nx,oldZ,currentY))movedX=nx;
        if(!this.collides(movedX,nz,currentY))movedZ=nz;
      }
      movedDistance=Math.hypot(movedX-oldX,movedZ-oldZ);this.player.position.x=movedX;this.player.position.z=movedZ;this.state.stats.distance+=movedDistance;
      if(movedDistance>.0005&&!fly){const targetYaw=Math.atan2(movedX-oldX,movedZ-oldZ);this.modelPivot.rotation.y=lerpAngle(this.modelPivot.rotation.y,targetYaw,Math.min(1,delta*9));}
      if(!fly&&!god&&!scooter&&!plane){if(sprint){this.state.needs.stamina=Math.max(0,this.state.needs.stamina-delta*(mounted?5.2:10.5));if(this.state.needs.stamina<=.05)this.exhaustSprint();}else this.state.needs.stamina=Math.min(100,this.state.needs.stamina+delta*3.2);}else if(scooter||plane)this.state.needs.stamina=Math.min(100,this.state.needs.stamina+delta*4.5);
      if(owner&&this.state.ownerAppearance?.skin==='ball'&&this.ownerFormObject?.userData?.rollingMesh){const ball=this.ownerFormObject.userData.rollingMesh;ball.rotation.x-=movedDistance*1.4;ball.rotation.z+=movedDistance*.35;ball.position.y=.72;}
    }else if(!fly&&!god)this.state.needs.stamina=Math.min(100,this.state.needs.stamina+delta*6.3);

    this.flightInputMagnitude=fly?clamp(length,0,1):0;
    this.flightForwardInput=fly?clamp(input.forward,-1,1):0;
    this.flightRightInput=fly?clamp(input.right,-1,1):0;
    if(fly){
      const lookYaw=this.yaw+Math.PI;
      this.modelPivot.rotation.y=lerpAngle(this.modelPivot.rotation.y,lookYaw,Math.min(1,delta*10));
    }
    const terrainFloor=terrainHeightAt(this.player.position.x,this.player.position.z)+MIN_WORLD_CLEARANCE;
    if(fly){
      const vertical=(this.keys.has('Space')?1:0)-((this.keys.has('ControlLeft')||this.keys.has('ControlRight'))?1:0);
      const minimumY=terrainFloor+.22,maximumY=Math.min(MAX_FLY_HEIGHT,terrainFloor+150);
      let targetVertical=vertical*speed*.78;
      if(this.flightTakeoffActive&&vertical===0&&this.flightTakeoffTargetY!==null){const gap=this.flightTakeoffTargetY-this.player.position.y;if(gap>.08)targetVertical=Math.min(3.2,Math.max(.75,gap*1.9));else{this.flightTakeoffActive=false;this.flightTakeoffTargetY=null;targetVertical=0;}}
      this.flightVerticalVelocity+=(targetVertical-this.flightVerticalVelocity)*(1-Math.exp(-delta*8));
      if(!Number.isFinite(this.flightVerticalVelocity))this.flightVerticalVelocity=0;
      const nextY=clamp(this.player.position.y+this.flightVerticalVelocity*delta,minimumY,maximumY);
      if(this.ownerFlags.noclip||!this.collides(this.player.position.x,this.player.position.z,nextY))this.player.position.y=nextY;else this.flightVerticalVelocity=0;
      this.player.position.y=clamp(this.player.position.y,minimumY,maximumY);this.velocityY=0;this.onGround=false;this.fallStartY=null;if(god)this.state.needs.stamina=100;
    }else if(this.onGround&&this.velocityY<=0){
      this.flightVerticalVelocity*=Math.exp(-delta*12);
      const ground=this.supportHeightAt(this.player.position.x,this.player.position.z,this.player.position.y);
      const amount=1-Math.exp(-delta*22);this.player.position.y+=(ground-this.player.position.y)*amount;
      if(Math.abs(this.player.position.y-ground)<.006)this.player.position.y=ground;
      this.velocityY=0;this.onGround=true;this.fallStartY=null;
    }else{
      const wasGrounded=this.onGround;if(!wasGrounded&&this.fallStartY===null)this.fallStartY=this.player.position.y;
      this.velocityY-=15.5*delta;this.player.position.y+=this.velocityY*delta;
      const ground=Math.max(this.supportHeightAt(this.player.position.x,this.player.position.z,this.player.position.y),inWater?WATER_LEVEL-1.05:-999);
      if(this.player.position.y<=ground){this.player.position.y=ground;this.velocityY=0;this.onGround=true;
        if(!wasGrounded&&this.fallStartY!==null){const fallDistance=Math.max(0,this.fallStartY-ground);if(fallDistance>4.25&&!god){const damage=Math.min(100,Math.max(1,Math.round(Math.pow(fallDistance-3.5,1.22)*8.6)));this.state.needs.health=Math.max(0,this.state.needs.health-damage);this.toast(`Fallschaden: -${damage} Leben`);}this.publishPresence(true).catch(()=>{});}
        this.fallStartY=null;
      }else this.onGround=false;
    }
    this.ensureValidWorldPosition();
    if(this.onGround&&!this.collides(this.player.position.x,this.player.position.z,this.player.position.y))this.lastSafePosition.copy(this.player.position);
    this.walking=moving;this.sprinting=!!(moving&&sprint);const invDt=1/Math.max(.001,delta);this.motionVelocityX=clamp((this.player.position.x-startX)*invDt,-200,200);this.motionVelocityY=clamp((this.player.position.y-startY)*invDt,-200,200);this.motionVelocityZ=clamp((this.player.position.z-startZ)*invDt,-200,200);if(!moving){this.motionVelocityX*=.2;this.motionVelocityZ*=.2;}this.renderScooterTuningBar();this.updatePlayerAnimation(delta,moving&&!(!this.onGround&&!fly),sprint);this.updateCurrentRegion();if(this.buildMode)this.updateBuildGhost();
  }

  isInWater(x,z) { const river=Math.abs(x-riverCenter(z))<14.5; const lake=Math.hypot(x-188,(z+185)/.72)<48; const ocean=this.oceanZone&&Math.abs(x-this.oceanZone.x)<this.oceanZone.width*.5&&Math.abs(z-this.oceanZone.z)<this.oceanZone.depth*.5; return river||lake||!!ocean; }

  updateCurrentRegion() {
    if(!this.player)return;
    const px=this.player.position.x,pz=this.player.position.z;
    const nearest=[...this.villages].sort((a,b)=>Math.hypot(a.x-px,a.z-pz)-Math.hypot(b.x-px,b.z-pz))[0];
    let region='';
    if(nearest&&Math.hypot(nearest.x-px,nearest.z-pz)<58){
      region=nearest.name;
      if(!this.state.discovered.includes(nearest.name)){
        this.state.discovered.push(nearest.name);
        this.toast(`Ort entdeckt: ${nearest.name}`);
        this.saveState(true);
      }
    }else{
      const biome=hash2(Math.floor(px/360),Math.floor(pz/360),WORLD_SEED+911);
      region=biome<.24?'Fichtenwald':biome<.46?'Birkenwald':biome<.68?'Dunkelwald':biome<.84?'Braunwald':'Offene Wildnis';
    }
    this.currentRegion=region;
  }

  updateCamera(delta,snap=false) {
    const size=this.isStaffActive&&this.staffCapabilities?.size?clamp(Number(this.state.ownerAppearance?.size)||1,.45,2.5):1;
    const headHeight=1.65*size;
    const head=this.tmpVector.set(this.player.position.x,this.player.position.y+headHeight,this.player.position.z);
    if(this.firstPerson){this.camera.position.copy(head);this.camera.rotation.set(this.pitch,this.yaw,0);return;}
    const distance=6.6*Math.max(.72,Math.sqrt(size)),height=2.65*Math.max(.7,size*.72);
    const cp=Math.cos(this.pitch),sp=Math.sin(this.pitch),sy=Math.sin(this.yaw),cy=Math.cos(this.yaw);
    const target=this.tmpVector2.set(head.x+sy*cp*distance,head.y+height+sp*distance,head.z+cy*cp*distance);
    const terrainY=terrainHeightAt(target.x,target.z)+.7;
    if(target.y<terrainY)target.y=terrainY;
    const amount=snap?1:1-Math.exp(-delta*10);
    this.camera.position.lerp(target,amount);this.camera.lookAt(head.x,head.y+.15,head.z);
  }
  snapCamera(){this.updateCamera(.016,true);}

  updateWorldTime(delta) {
    const speed=this.isStaffActive&&this.ownerFlags.freezeTime?0:WORLD_TIME_HOURS_PER_MINUTE;
    this.state.time+=delta*speed/60;
    if(this.state.time>=24){this.state.time-=24;this.state.day+=1;this.dailySettlementTick();if((this.state.day-1)%DAYS_PER_SEASON===0){this.state.season=(this.state.season+1)%4;this.applySeasonVisuals();this.toast(`${SEASONS[this.state.season].icon} ${SEASONS[this.state.season].name} hat begonnen.`);}}
    if(speed>0){this.state.weatherRemaining=Math.max(0,Number(this.state.weatherRemaining||0)-delta*speed/60);if(this.state.weatherRemaining<=0)this.chooseWeather();}
    const solarAngle=((this.state.time-6)/24)*Math.PI*2;
    const moonAngle=((this.state.time-18)/24)*Math.PI*2;
    const sunAltitude=Math.sin(solarAngle);
    const moonAltitude=Math.sin(moonAngle);
    const skyOrigin=this.camera?.position||this.player.position;
    if(this.sky)this.sky.position.copy(skyOrigin);
    if(this.stars)this.stars.position.copy(skyOrigin);
    if(this.cloudGroup)this.cloudGroup.position.set(this.player.position.x,0,this.player.position.z);
    const solarRadius=260,solarHeight=230;
    const sunVector=this.tmpVector.set(-Math.cos(solarAngle)*solarRadius,sunAltitude*solarHeight,-42+Math.sin(solarAngle*.5)*26);
    this.sun.position.copy(skyOrigin).add(sunVector);
    const daylight=clamp((sunAltitude+.12)*2.25,.025,1);
    this.sun.intensity=daylight*3.65;
    this.moon.intensity=clamp((-sunAltitude+.08)*.8,0,.72);
    this.hemisphere.intensity=.28+daylight*1.62;
    const moonVector=this.tmpVector2.set(-Math.cos(moonAngle)*245,moonAltitude*205,-52);
    this.moon.position.copy(skyOrigin).add(moonVector);
    if(this.sunTarget){this.sunTarget.position.set(this.player.position.x,this.player.position.y+1,this.player.position.z);this.sunTarget.updateMatrixWorld();}
    if(this.sunDisc){this.sunDisc.position.copy(sunVector).normalize().multiplyScalar(720).add(skyOrigin);this.sunDisc.visible=sunAltitude>-.08;}
    if(this.sunGlow){this.sunGlow.position.copy(this.sunDisc.position);this.sunGlow.visible=this.sunDisc.visible;this.sunGlow.material.opacity=clamp((sunAltitude+.12)*2.5,0,1);}
    if(this.moonDisc){this.moonDisc.position.copy(moonVector).normalize().multiplyScalar(700).add(skyOrigin);this.moonDisc.lookAt(this.camera.position);this.moonDisc.visible=moonAltitude>-.1;const lunarDay=((this.state.day-1)%29.53)/29.53;this.moonMaterial.uniforms.phase.value=lunarDay;}
    if(this.starMaterial)this.starMaterial.opacity=clamp((.38-daylight)*3.1,0,.92);
    if(this.cloudGroup){const weatherCloud={clear:.16,cloudy:.62,rain:.82,storm:.94,snow:.72}[this.state.weather]??.3;this.cloudGroup.visible=weatherCloud>.05;this.cloudGroup.children.forEach((cloud)=>{cloud.position.x+=delta*(this.state.weather==='storm'?8:2.2);if(cloud.position.x>320)cloud.position.x=-320;cloud.traverse((node)=>{if(!node.isMesh)return;const mats=Array.isArray(node.material)?node.material:[node.material];for(const mat of mats){if(!mat)continue;mat.transparent=true;mat.opacity=(cloud.userData.baseOpacity||.4)*weatherCloud*(daylight*.5+.32);mat.color?.set?.(this.state.weather==='storm'?0x59616b:0xe7edf2);}});});}
    const season=SEASONS[this.state.season];
    const nightColor=new THREE.Color(0x071225);
    const clearDay=new THREE.Color(season.sky);
    const weatherDay=new THREE.Color(['rain','storm'].includes(this.state.weather)?0x657580:this.state.weather==='cloudy'?0x91a3ad:season.sky);
    const horizonDay=new THREE.Color(['rain','storm'].includes(this.state.weather)?0x9ca5a4:this.state.weather==='cloudy'?0xbac2bd:0xe6d5ad);
    this.skyMaterial.uniforms.topColor.value.copy(nightColor).lerp(weatherDay,daylight);
    this.skyMaterial.uniforms.bottomColor.value.set(0x151d2d).lerp(horizonDay,daylight);
    this.renderer.setClearColor(this.skyMaterial.uniforms.topColor.value,1);
    this.renderer.toneMappingExposure=.58+daylight*.7;
    if(this.waterMaterials) this.waterMaterials.forEach((m)=>{m.opacity=.62+daylight*.2;});
    if(this.state.world?.shadows&&this.sun?.shadow?.camera){this.sun.shadow.camera.updateProjectionMatrix();}
  }

  chooseWeather() {
    const season=SEASONS[this.state.season].id;
    const roll=Math.random();
    let weather='clear';
    if(season==='winter') weather=roll<.42?'snow':roll<.66?'cloudy':roll<.78?'storm':'clear';
    else weather=roll<.16?'rain':roll<.23?'storm':roll<.48?'cloudy':'clear';
    this.state.weather=weather;this.state.weatherRemaining=3.5+Math.random()*5.5;this.state.weatherUntil=(this.state.time+this.state.weatherRemaining)%24;
    this.updateWeatherParticles();
    this.toast(`${WEATHER[weather].icon} Wetterwechsel: ${WEATHER[weather].name}`);
  }

  updateNeeds(delta) {
    const invulnerable=this.isStaffActive&&this.ownerFlags.god;
    if(invulnerable){for(const key of Object.keys(this.state.needs))this.state.needs[key]=key==='health'?this.effectiveMaxHealth():100;this.updateSurvivalWarnings();return;}
    const survival=this.state.skills.survival||0,weather=WEATHER[this.state.weather],factor=(1-survival*.075)*weather.drain;
    this.state.needs.hunger=Math.max(0,this.state.needs.hunger-delta*.035*factor);this.state.needs.thirst=Math.max(0,this.state.needs.thirst-delta*.052*factor);
    const hour=this.state.time,baseTemp=SEASONS[this.state.season].temp+weather.temp+(hour<6||hour>20?-5:0),nearFire=this.nearOwnedBuilding('campfire',8)||Math.hypot(this.player.position.x+40,this.player.position.z-177)<8;
    const warmthTarget=nearFire?100:clamp(70+baseTemp*2.2,0,100);this.state.needs.warmth+=(warmthTarget-this.state.needs.warmth)*Math.min(1,delta*.025);
    const emptyNeeds=(this.state.needs.hunger<=0?1:0)+(this.state.needs.thirst<=0?1:0)+(this.state.needs.warmth<=0?1:0);
    if(emptyNeeds>0)this.state.needs.health=Math.max(0,this.state.needs.health-delta*emptyNeeds);else if(this.state.needs.hunger>55&&this.state.needs.thirst>55)this.state.needs.health=Math.min(this.effectiveMaxHealth(),this.state.needs.health+delta*.025);
    this.updateSurvivalWarnings();if(this.state.needs.health<=0&&!this.deathScreenOpen)this.respawnAfterCollapse();
  }

  updateSurvivalWarnings() {
    const maxHealth=this.effectiveMaxHealth(),healthPct=this.state.needs.health/Math.max(1,maxHealth)*100,labels={hunger:'Hunger ist kritisch – iss schnell etwas.',thirst:'Durst ist kritisch – trink schnell etwas.',warmth:'Wärme ist kritisch – suche Feuer oder Schutz.',health:'Dein Leben ist kritisch.'};
    for(const key of Object.keys(this.warningState)){const value=key==='health'?healthPct:this.state.needs[key],low=value<=20;if(low&&!this.warningState[key])this.toast(labels[key]);this.warningState[key]=low;}
    this.overlay?.classList.toggle('is-critical-health',healthPct<=20);
    this.overlay?.classList.toggle('is-critical-needs',this.state.needs.hunger<=20||this.state.needs.thirst<=20||this.state.needs.warmth<=20);
  }

  nearOwnedBuilding(type,radius) { return this.state.buildings.some((b)=>b.type===type&&Math.hypot(this.player.position.x-b.x,this.player.position.z-b.z)<radius); }

  respawnAfterCollapse() {
    if(this.deathScreenOpen)return;
    const dropped={inventory:{...this.state.inventory},tools:{...this.state.tools},equippedTool:this.state.equippedTool||'',x:Number(this.player.position.x),y:Number(this.player.position.y),z:Number(this.player.position.z),expiresAt:Date.now()+600000};
    this.state.deathLoot=dropped;
    const fresh=defaultSaveState();this.state.inventory={...fresh.inventory};this.state.tools={...fresh.tools};this.state.equippedTool='';
    this.ownerFlags.fly=false;this.ownerFlags.noclip=false;this.velocityY=0;this.input.sprint=false;this.keys.clear();this.applyHeldItemVisual();this.ensureDeathLootMarker();this.showDeathScreen();this.saveState(true);
  }

  showDeathScreen(){this.deathScreenOpen=true;if(this.deathScreen)this.deathScreen.hidden=false;if(document.pointerLockElement===this.canvas)document.exitPointerLock?.();}
  hideDeathScreen(){this.deathScreenOpen=false;if(this.deathScreen)this.deathScreen.hidden=true;}
  respawnFromDeath(){
    this.hideDeathScreen();const x=Number(this.state.world?.spawnX||0),z=Number(this.state.world?.spawnZ||0),y=terrainHeightAt(x,z);this.player.position.set(x,y,z);this.lastSafePosition.copy(this.player.position);this.onGround=true;this.velocityY=0;this.fallStartY=null;this.state.needs={health:this.effectiveMaxHealth(),hunger:70,thirst:70,stamina:100,warmth:75};this.lastChunkCenter='';this.updateChunkStreaming(true);this.snapCamera();this.renderHud(true);this.saveState(true);this.toast('Du wurdest wiederbelebt. Dein Loot ist zehn Minuten auf der Karte markiert.');
  }
  ensureDeathLootMarker(){
    const loot=this.state.deathLoot;if(!loot||Number(loot.expiresAt||0)<=Date.now()){this.clearDeathLoot();return null;}if(this.deathLootObject?.parent)return this.deathLootObject;
    const group=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:0x38235f,emissive:0x6c2cff,emissiveIntensity:1.2,roughness:.45,metalness:.25});
    const chest=new THREE.Mesh(new THREE.BoxGeometry(.8,.5,.55),mat);chest.position.y=.28;group.add(chest);const beam=new THREE.Mesh(new THREE.CylinderGeometry(.035,.08,3.2,8),new THREE.MeshBasicMaterial({color:0xb66cff,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false}));beam.position.y=1.8;group.add(beam);group.position.set(Number(loot.x)||0,terrainHeightAt(Number(loot.x)||0,Number(loot.z)||0),Number(loot.z)||0);this.scene?.add(group);this.deathLootObject=group;return group;
  }
  clearDeathLoot(){this.deathLootObject?.removeFromParent?.();this.deathLootObject=null;this.state.deathLoot=null;}
  collectDeathLoot(){const loot=this.state.deathLoot;if(!loot||Date.now()>=Number(loot.expiresAt||0)){this.clearDeathLoot();this.toast('Dein verlorener Loot ist verschwunden.');return;}for(const [id,amount] of Object.entries(loot.inventory||{}))if(id in this.state.inventory)this.state.inventory[id]+=Number(amount)||0;for(const [id,amount] of Object.entries(loot.tools||{}))if(id in this.state.tools)this.state.tools[id]=Math.max(this.state.tools[id]||0,Number(amount)||0);if(loot.equippedTool&&this.state.tools[loot.equippedTool]>0)this.state.equippedTool=loot.equippedTool;this.clearDeathLoot();this.applyHeldItemVisual();this.renderHud(true);this.saveState(true);this.toast('Dein verlorener Loot wurde vollständig aufgenommen.');}

  dailySettlementTick() {
    const s=this.state.settlement,jobs=s.jobs||{};
    const houses=this.state.buildings.filter((b)=>b.type==='house').length,fields=this.state.buildings.filter((b)=>b.type==='field').length,barns=this.state.buildings.filter((b)=>b.type==='barn').length,woodsheds=this.state.buildings.filter((b)=>b.type==='woodshed').length,lodges=this.state.buildings.filter((b)=>b.type==='huntingLodge').length,mines=this.state.buildings.filter((b)=>b.type==='mine').length,workshops=this.state.buildings.filter((b)=>b.type==='workshop').length;
    const agriculture=1+(this.state.skills.agriculture||0)*.12,crafting=1+(this.state.skills.crafting||0)*.1;
    s.food+=Math.round((fields*4+barns*3+(jobs.farmer||0)*4+(jobs.hunter||0)*3+lodges*2)*agriculture);
    s.firewood+=Math.round((woodsheds*5+(jobs.woodcutter||0)*5)*crafting);
    this.state.inventory.iron+=Math.floor((mines+(jobs.miner||0))*.65);
    this.state.inventory.wood+=Math.floor((workshops+(jobs.crafter||0))*.55);
    const foodNeed=s.residents*2,woodNeed=s.residents*(this.state.season===3?3:1);
    s.food=Math.max(0,s.food-foodNeed);s.firewood=Math.max(0,s.firewood-woodNeed);
    if(s.residents>0){s.morale=clamp(s.morale+(s.food>=foodNeed&&s.firewood>=woodNeed?3:-8),0,100);s.taxDue+=s.residents*4+houses*2;}
    for(const b of this.state.buildings.filter((entry)=>entry.type==='field')) b.readyAt=Date.now()+90000;
    this.checkQuestProgress();
  }

  applySeasonVisuals(initial=false) {
    const season=SEASONS[this.state.season];
    if(this.treeLeafMaterial)this.treeLeafMaterial.color.set(season.foliage);
    if(this.bushMaterial)this.bushMaterial.color.set(this.state.season===3?0x89948c:season.foliage).offsetHSL(0,-.08,-.08);
    if(this.terrainMaterial)this.terrainMaterial.color.set(this.state.season===3?0xdde1dc:season.ground).offsetHSL(0,-.1,.2);
    for(const entry of this.seasonMaterials){
      if(!entry?.material)continue;
      if(entry.kind==='foliage')entry.material.color.set(this.state.season===3?0x87968d:season.foliage);
      if(entry.kind==='grass')entry.material.color.set([0x5f8a45,0x5c8b43,0x718044,0x9aa58f][this.state.season]||0x5f8a45);
      if(entry.kind==='grassAlt')entry.material.color.set([0x688f49,0x648f48,0x7b8449,0xa5ad99][this.state.season]||0x688f49);
      if(entry.kind==='ground')entry.material.color.set(this.state.season===3?0xdde1dc:0xffffff);
    }
    if(this.scene?.fog)this.scene.fog.color.set(season.fog);
    if(!initial)this.updateWeatherParticles();
  }

  buildWeatherParticles() {
    const count=this.isMobile?450:850;
    const positions=new Float32Array(count*3);
    for(let i=0;i<count;i+=1){positions[i*3]=(Math.random()*2-1)*45;positions[i*3+1]=Math.random()*45;positions[i*3+2]=(Math.random()*2-1)*45;}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
    const material=new THREE.PointsMaterial({color:0xd8ecff,size:.12,transparent:true,opacity:.72,depthWrite:false});
    this.weatherParticles=new THREE.Points(geometry,material);this.weatherParticles.visible=false;this.scene.add(this.weatherParticles);
    this.updateWeatherParticles();
  }

  updateWeatherParticles() {
    if(!this.weatherParticles)return;
    const active=['rain','storm','snow'].includes(this.state.weather);
    this.weatherParticles.visible=active;
    this.weatherParticles.material.color.set(this.state.weather==='snow'?0xffffff:0x8ec7e8);
    this.weatherParticles.material.size=this.state.weather==='snow'?.22:.09;
  }

  animateWeather(delta) {
    if(!this.weatherParticles?.visible)return;
    this.weatherParticles.position.set(this.player.position.x,this.player.position.y+4,this.player.position.z);
    const positions=this.weatherParticles.geometry.attributes.position.array;
    const fall=this.state.weather==='snow'?3.5:18;
    for(let i=0;i<positions.length;i+=3){positions[i+1]-=delta*fall;if(positions[i+1]<-3){positions[i+1]=42;positions[i]=(Math.random()*2-1)*45;positions[i+2]=(Math.random()*2-1)*45;}if(this.state.weather==='storm')positions[i]+=delta*4;}
    this.weatherParticles.geometry.attributes.position.needsUpdate=true;
  }

  updateAnimals(delta,now) {
    const random=Math.random,px=this.player?.position.x||0,pz=this.player?.position.z||0,playerVanished=!!(this.isStaffActive&&this.ownerFlags.vanish);
    for(const animal of this.animals){
      if(!animal.active){if(animal.respawnAt&&Date.now()>animal.respawnAt){animal.active=true;animal.group.visible=true;animal.hp=animal.maxHp||100;animal.predatorTarget=null;if(animal.type==='spider'){animal.x=animal.homeX;animal.z=animal.homeZ;animal.y=terrainHeightAt(animal.x,animal.z);animal.targetX=animal.homeX;animal.targetZ=animal.homeZ;animal.group.position.set(animal.x,animal.y,animal.z);}else this.relocateAnimal(animal,100,300);}else continue;}
      if(this.mountedHorse===animal){animal.x=this.player.position.x;animal.z=this.player.position.z;animal.y=terrainHeightAt(animal.x,animal.z);animal.group.position.set(animal.x,animal.y,animal.z);animal.group.rotation.y=this.modelPivot.rotation.y;this.setAnimalAnimation(animal,this.walking,delta);continue;}
      const profile=animal.profile||ANIMAL_PROFILES[animal.type];if(!profile)continue;
      if(animal.type!=='spider'&&Math.hypot(animal.x-px,animal.z-pz)>650)this.relocateAnimal(animal,140,310);
      if(profile.predator&&(!animal.predatorTarget||!animal.predatorTarget.active||now>animal.predatorUntil)){if(random()<delta*.04){const targets=this.animals.filter((other)=>other!==animal&&other.active&&other.profile?.predator&&other.type!==animal.type&&Math.hypot(other.x-animal.x,other.z-animal.z)<75);if(targets.length){animal.predatorTarget=targets[Math.floor(random()*targets.length)];animal.predatorUntil=now+5000+random()*4500;}}}
      if(animal.predatorTarget?.active){animal.targetX=animal.predatorTarget.x;animal.targetZ=animal.predatorTarget.z;animal.targetY=animal.predatorTarget.y;const clash=Math.hypot(animal.x-animal.predatorTarget.x,animal.z-animal.predatorTarget.z);if(clash<4.6&&now>animal.attackCooldown){animal.attackCooldown=now+1400+random()*900;animal.predatorTarget.hp-=18+Math.floor(random()*18);if(animal.predatorTarget.hp<=0){animal.predatorTarget.active=false;animal.predatorTarget.group.visible=false;animal.predatorTarget.respawnAt=Date.now()+90000;animal.predatorTarget=null;}}}
      else if(now>animal.nextTurn||Math.hypot(animal.targetX-animal.x,animal.targetZ-animal.z)<2){animal.nextTurn=now+2200+random()*5400;const a=random()*Math.PI*2;if(animal.type==='spider'){const rr=5+random()*Math.max(6,animal.roamRadius||34);animal.targetX=animal.homeX+Math.cos(a)*rr;animal.targetZ=animal.homeZ+Math.sin(a)*rr;animal.targetY=terrainHeightAt(animal.targetX,animal.targetZ);}else if(profile.zone==='water'){animal.targetZ=clamp(animal.z+Math.sin(a)*(25+random()*55),-WORLD_HALF+30,WORLD_HALF-30);animal.targetX=riverCenter(animal.targetZ)+(random()*2-1)*7;animal.targetY=WATER_LEVEL-1.2-random()*.75;}else if(profile.zone==='air'){animal.targetX=clamp(animal.x+Math.cos(a)*(25+random()*60),px-540,px+540);animal.targetZ=clamp(animal.z+Math.sin(a)*(25+random()*60),pz-540,pz+540);animal.targetY=terrainHeightAt(animal.targetX,animal.targetZ)+6+random()*13;}else{animal.targetX=clamp(animal.x+Math.cos(a)*(16+random()*42),px-530,px+530);animal.targetZ=clamp(animal.z+Math.sin(a)*(16+random()*42),pz-530,pz+530);if(Math.abs(animal.targetX-riverCenter(animal.targetZ))<26)animal.targetX+=animal.targetX<riverCenter(animal.targetZ)?-34:34;animal.targetY=terrainHeightAt(animal.targetX,animal.targetZ);}}
      const playerDistance=Math.hypot(animal.x-px,animal.z-pz);
      if(animal.type==='spider'&&animal.aggressive&&!playerVanished){const homeDistance=Math.hypot(px-animal.homeX,pz-animal.homeZ);if(playerDistance<15&&homeDistance<animal.roamRadius+18){animal.targetX=px;animal.targetZ=pz;if(playerDistance<2.05&&now>(animal.attackCooldown||0)){animal.attackCooldown=now+1250;if(!(this.isStaffActive&&this.ownerFlags.god)){this.state.needs.health=Math.max(0,this.state.needs.health-(6+Math.floor(Math.random()*7)));this.toast('🕷 Zauberspinne hat dich getroffen.');}}}else if(homeDistance>animal.roamRadius+18){const a=Math.atan2(animal.homeX-animal.x,animal.homeZ-animal.z);animal.targetX=animal.homeX+Math.sin(a)*3;animal.targetZ=animal.homeZ+Math.cos(a)*3;}}
      else if(!playerVanished&&profile.zone==='land'&&!animal.tamed&&playerDistance<11&&animal.type!=='cow'){animal.targetX=animal.x+(animal.x-px)/Math.max(1,playerDistance)*34;animal.targetZ=animal.z+(animal.z-pz)/Math.max(1,playerDistance)*34;}
      const dx=animal.targetX-animal.x,dz=animal.targetZ-animal.z,d=Math.hypot(dx,dz)||1,dy=(animal.targetY??animal.y)-animal.y;let speed=profile.speed;if(animal.predatorTarget||(!playerVanished&&animal.type==='spider'&&playerDistance<15)||(!playerVanished&&playerDistance<11&&profile.zone==='land'&&!animal.tamed))speed=profile.run;animal.x+=dx/d*speed*delta;animal.z+=dz/d*speed*delta;
      if(profile.zone==='water')animal.y+=(dy-animal.y*.0)*Math.min(1,delta*2.8);else if(profile.zone==='air')animal.y+=dy*Math.min(1,delta*1.9);else animal.y=terrainHeightAt(animal.x,animal.z);
      animal.group.position.set(animal.x,animal.y,animal.z);animal.group.rotation.y=Math.atan2(dx,dz);if(profile.zone==='water')animal.group.rotation.z=Math.sin(now*.0016+animal.x*.01)*.035;if(profile.zone==='air')animal.group.rotation.z=Math.sin(now*.002+animal.z*.01)*.08;
      this.setAnimalAnimation(animal,d>2||!!animal.predatorTarget,delta);
    }
  }

  updateNpcs(delta,now) {
    for(const npc of this.npcs){
      const base=this.villages.find((v)=>v.name===npc.village);if(!base||!npc.group?.parent)continue;
      if(now>(npc.nextTurn||0)){npc.nextTurn=now+2600+Math.random()*5200;npc.angle+=((Math.random()-.5)*1.5);npc.roamRadius=6+Math.random()*10;}
      const radius=npc.roamRadius||8+(npc.name.length%5),tx=base.x+Math.cos(npc.angle)*radius,tz=base.z+Math.sin(npc.angle)*radius;
      const dx=tx-npc.x,dz=tz-npc.z,d=Math.hypot(dx,dz)||1,speed=.5+(npc.name.length%4)*.08;
      npc.x+=dx/d*Math.min(speed*delta,d);npc.z+=dz/d*Math.min(speed*delta,d);
      const ox=npc.group.userData.chunkOriginX||0,oz=npc.group.userData.chunkOriginZ||0;
      npc.group.position.set(npc.x-ox,terrainHeightAt(npc.x,npc.z),npc.z-oz);npc.group.rotation.y=Math.atan2(dx,dz);
      const limbs=npc.group.userData.npcLimbs,walk=Math.min(1,d/2),phase=now*.006+(npc.name.length||0);
      if(limbs){limbs.arms?.forEach((arm,i)=>arm.rotation.x=Math.sin(phase+i*Math.PI)*.42*walk);limbs.legs?.forEach((leg,i)=>leg.rotation.x=Math.sin(phase+i*Math.PI)*.5*walk);}
      else if(npc.group.userData.npcModel){const model=npc.group.userData.npcModel;model.position.y=Math.abs(Math.sin(phase))*0.018*walk;model.rotation.z=Math.sin(phase)*.008*walk;const wb=model.userData.npcWalkBones;if(wb?.bases){for(const [bone,baseQ] of wb.bases){const sign=(bone===wb.upperRight||bone===wb.legLeft)?1:-1,amount=(bone===wb.upperRight||bone===wb.upperLeft)?.34:.46;const target=baseQ.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.sin(phase)*sign*amount*walk,0,0)));bone.quaternion.slerp(target,Math.min(1,delta*10));}}}
      const hotspot=this.hotspots.find((h)=>h.id===npc.id);if(hotspot){hotspot.x=npc.x;hotspot.z=npc.z;}
    }
  }

  updateHotspots() {
    if(!this.player)return;
    const px=this.player.position.x,pz=this.player.position.z;
    const groundGap=this.player.position.y-this.supportHeightAt(px,pz,this.player.position.y);
    let nearest=null,best=Infinity;
    this.ensureDeathLootMarker();
    const lost=this.state.deathLoot;if(groundGap<1.65&&lost&&Date.now()<Number(lost.expiresAt||0)){const d=Math.hypot(px-Number(lost.x||0),pz-Number(lost.z||0));if(d<3.2&&d<best){best=d;nearest={id:'death-loot',type:'death-loot',x:Number(lost.x||0),z:Number(lost.z||0),label:'Verlorenen Loot aufnehmen',data:lost};}}
    if(groundGap<1.65){for(const node of this.tutorialNodes){if(!node.active)continue;const d=Math.hypot(px-node.x,pz-node.z);if(d<3.3&&d<best){best=d;nearest={id:node.id,type:'tutorial-pickup',x:node.x,z:node.z,label:node.label,data:node};}}}
    if(groundGap<1.65)for(const node of this.resourceNodes){
      if(!node.active)continue;const d=Math.hypot(px-node.x,pz-node.z);if(d<4.1&&d<best){best=d;nearest={id:node.id,type:node.type,x:node.x,z:node.z,label:node.type==='tree'?(node.archetype==='fallen'?'Umgestürzten Baum verwerten':node.archetype==='broken'?'Gebrochenen Baum fällen':'Baum bearbeiten'):node.type==='rock'?'Felsen abbauen':'Beerenstrauch sammeln',data:node};}
    }
    if(groundGap<1.65)for(const animal of this.animals){if(!animal.active)continue;const d=Math.hypot(px-animal.x,pz-animal.z);if(d<5.5&&d<best){best=d;const label=animal.type==='horse'?(this.state.horseTamed?'Reitpferd besteigen':'Reitpferd zähmen'):`${animal.profile?.label||animal.type} ${animal.type==='spider'?'bekämpfen':['fox','cow','wolf1','wolf2'].includes(animal.type)?'jagen':'beobachten'}`;nearest={id:animal.id,type:'animal',x:animal.x,z:animal.z,label,data:animal};}}
    if(groundGap<1.65)for(const hotspot of this.hotspots){if(hotspot.type==='village'&&this.state.visitedVillages?.includes?.(hotspot.data?.village))continue;const d=Math.hypot(px-hotspot.x,pz-hotspot.z);if(d<(hotspot.radius||4)&&d<best){best=d;nearest=hotspot;}}
    if(this.buildMode){nearest={id:'build-place',type:'build-place',label:`${BUILDINGS[this.buildMode].name} errichten`};}
    this.nearestHotspot=nearest;
    this.interactButton.classList.toggle('is-visible',!!nearest);
    if(nearest)this.interactLabel.textContent=nearest.label;
    const region=this.locationFromPosition(px,pz);
    if(this.locationLabel)this.locationLabel.textContent=region;
    if(this.regionLabel)this.regionLabel.textContent=region;
  }

  locationFromPosition(x,z) {
    let nearestVillage=null,nearestDistance=Infinity;
    for(const village of this.villages){const d=Math.hypot(x-village.x,z-village.z);if(d<nearestDistance){nearestVillage=village;nearestDistance=d;}}
    if(nearestVillage&&nearestDistance<46){this.discover(nearestVillage.name);return nearestVillage.name;}
    const height=terrainHeightAt(x,z);
    if(height>62)return 'Hochgebirge';
    if(height>38)return 'Bergland';
    if(Math.abs(x-riverCenter(z))<30)return 'Großer Grenzfluss';
    const biome=hash2(Math.floor(x/420),Math.floor(z/420),WORLD_SEED+811);
    return biome<.25?'Dichter Wald':biome<.5?'Weites Hügelland':biome<.75?'Altes Jagdgebiet':'Offene Wildnis';
  }

  discover(name) { if(!this.state.discovered.includes(name)){this.state.discovered.push(name);this.gainXp(10,`${name} entdeckt`);this.toast(`Neuer Ort entdeckt: ${name}`);} }

  activateNearestHotspot() {
    const hotspot=this.nearestHotspot;if(!hotspot)return;
    if(this.isOwnerActive&&this.state.ownerAppearance?.heldItem==='staff'&&['tree','rock','bush','animal','npc'].includes(hotspot.type))return this.ownerTelekinesis(hotspot);
    switch(hotspot.type){
      case 'death-loot':return this.collectDeathLoot();
      case 'tutorial-pickup':return this.collectTutorialPickup(hotspot.data);
      case 'tree':return this.harvestTree(hotspot.data);
      case 'rock':return this.harvestRock(hotspot.data);
      case 'bush':return this.harvestBush(hotspot.data);
      case 'water':case 'well':case 'own-well':return this.collectWater();
      case 'animal':return hotspot.data?.type==='horse'?this.interactHorse(hotspot.data):['fox','cow','wolf1','wolf2','spider'].includes(hotspot.data?.type)?this.huntAnimal(hotspot.data):this.observeAnimal(hotspot.data);
      case 'firewood':return this.collectFirewoodPickup(hotspot.data);
      case 'npc':return this.talkToNpc(hotspot.data);
      case 'market':return this.openTrade(hotspot.data?.village||'Markt');
      case 'village':{const villageName=hotspot.data?.village;if(villageName&&!this.state.visitedVillages.includes(villageName))this.state.visitedVillages.push(villageName);this.saveState(true);return this.openVillageInfo(villageName);}
      case 'door':return this.toggleVillageDoor(hotspot.data?.doorId,hotspot);
      case 'sleep':case 'own-house':return this.sleepUntilMorning();
      case 'campfire':case 'own-campfire':return this.openManagement('crafting');
      case 'own-storage':return this.openManagement('inventory');
      case 'own-workshop':return this.openManagement('crafting');
      case 'own-woodshed':return this.collectProduction('wood');
      case 'own-field':return this.collectProduction('food');
      case 'own-barn':return this.collectProduction('grain');
      case 'own-huntingLodge':return this.collectProduction('hunt');
      case 'own-mine':return this.collectProduction('mine');
      case 'own-tavern':return this.openManagement('dynasty');
      case 'cave':return this.exploreCave(hotspot);
      case 'mine':return this.exploreMine(hotspot);
      case 'encounter':return this.resolveWorldEncounter(hotspot);
      case 'landmark':return this.discoverLandmark(hotspot);
      case 'build-place':return this.placeBuilding();
      default:return this.openManagement('overview');
    }
  }


  canCastStaffLightning(){
    return !!(this.isStaffActive&&this.staffCapabilities?.items?.includes('staff')&&!this.isPublicPlayerMode()&&this.state.ownerAppearance?.heldItem==='staff'&&!this.ownerFlags.vanish);
  }

  staffLightningDamage(theme=this.appearanceTheme('heldItem')){
    const base=this.staffDamageAmount(),multiplier={owner:1,admin:.58,moderator:.40,supporter:.28,member:.18}[normalizeStaffTheme(theme)]??.28;
    return Math.max(1,Math.round(base*multiplier));
  }

  staffLightningTarget(maxDistance=105){
    const origin=new THREE.Vector3(),direction=new THREE.Vector3();this.camera.getWorldPosition(origin);this.camera.getWorldDirection(direction).normalize();const ray=new THREE.Ray(origin,direction),end=origin.clone().addScaledVector(direction,maxDistance);let best=null,bestT=maxDistance;
    const consider=(point,radius,data,type)=>{const t=clamp(point.clone().sub(origin).dot(direction),0,maxDistance);if(t<=.45||t>=bestT)return;const closest=origin.clone().addScaledVector(direction,t);if(closest.distanceTo(point)<=radius){bestT=t;best={point:point.clone(),data,type};}};
    for(const animal of this.animals){if(!animal?.active||!animal.group?.visible)continue;animal.group.getWorldPosition(this.tmpVector);this.tmpVector.y+=Math.max(.35,(animal.profile?.size||1)*.35);consider(this.tmpVector,Math.max(.65,(animal.profile?.size||1)*.38),animal,'animal');}
    for(const npc of this.npcs){if(!npc?.group?.visible)continue;npc.group.getWorldPosition(this.tmpVector);this.tmpVector.y+=1;consider(this.tmpVector,.8,npc,'npc');}
    if(best)end.copy(origin).addScaledVector(direction,bestT);
    else if(direction.y<-.015){for(let t=2;t<=maxDistance;t+=1.5){const p=origin.clone().addScaledVector(direction,t),ground=terrainHeightAt(p.x,p.z)+.05;if(p.y<=ground){p.y=ground;end.copy(p);break;}}}
    return {origin,end,hit:best,ray,direction};
  }

  staffLightningOrigin(fallbackOrigin,direction){
    const point=new THREE.Vector3(),staff=this.firstPerson?this.firstPersonHeldObject:this.ownerHeldObject,crystal=staff?.userData?.crystal;
    if(crystal?.getWorldPosition){crystal.getWorldPosition(point);return point;}
    if(staff?.getWorldPosition){staff.getWorldPosition(point);if(direction)point.addScaledVector(direction,.28);return point;}
    return fallbackOrigin.clone().addScaledVector(direction||new THREE.Vector3(0,0,-1),.48);
  }

  createStaffBeamVisual(theme='owner',compact=false){
    theme=normalizeStaffTheme(theme);const cfg=staffThemeConfig(theme),quality=this.state.world?.graphicsQuality||'medium',segments=compact?(['minimal','performance'].includes(quality)?6:9):(['minimal','performance'].includes(quality)?8:14),group=new THREE.Group(),positions=new Float32Array((segments+1)*3),geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));
    const line=new THREE.Line(geo,new THREE.LineBasicMaterial({color:cfg.primary,transparent:true,opacity:.98,blending:THREE.AdditiveBlending,depthWrite:false}));group.add(line);
    let impact=null;if(!compact&&!['minimal','performance'].includes(quality)){impact=new THREE.Mesh(new THREE.SphereGeometry(.11,8,6),new THREE.MeshBasicMaterial({color:cfg.accent,transparent:true,opacity:.84,blending:THREE.AdditiveBlending,depthWrite:false}));group.add(impact);}
    group.userData={theme,segments,line,impact,positions};this.scene.add(group);return group;
  }

  updateStaffBeamVisual(group,origin,end,theme='owner',now=performance.now()){
    if(!group)return;theme=normalizeStaffTheme(theme);const cfg=staffThemeConfig(theme),segments=group.userData.segments||8,arr=group.userData.positions||group.userData.line?.geometry?.attributes?.position?.array;if(!arr)return;
    const dir=end.clone().sub(origin),length=Math.max(.001,dir.length()),forward=dir.clone().multiplyScalar(1/length),axis=Math.abs(forward.y)>.92?new THREE.Vector3(1,0,0):new THREE.Vector3(0,1,0),right=new THREE.Vector3().crossVectors(forward,axis).normalize(),up=new THREE.Vector3().crossVectors(right,forward).normalize();
    for(let i=0;i<=segments;i++){const t=i/segments,p=origin.clone().lerp(end,t),fade=Math.sin(t*Math.PI),wave=Math.sin(now*.020+i*1.73)*.055*fade,side=Math.sin(now*.014+i*2.31)*.045*fade;p.addScaledVector(right,wave).addScaledVector(up,side);arr[i*3]=p.x;arr[i*3+1]=p.y;arr[i*3+2]=p.z;}
    const attr=group.userData.line?.geometry?.attributes?.position;if(attr)attr.needsUpdate=true;const mat=group.userData.line?.material;if(mat){mat.color.setHex(cfg.primary);mat.opacity=.90+Math.sin(now*.028)*.08;}if(group.userData.impact){group.userData.impact.position.copy(end);group.userData.impact.material.color.setHex(cfg.accent);group.userData.impact.scale.setScalar(.86+Math.sin(now*.022)*.14);}group.visible=true;
  }

  spawnStaffLightning(origin,end,theme='owner'){
    theme=normalizeStaffTheme(theme);const group=this.createStaffBeamVisual(theme,true);this.updateStaffBeamVisual(group,origin,end,theme,performance.now());this.staffLightningEffects.push({group,start:performance.now(),duration:220});
  }

  updateStaffLightningEffects(now=performance.now()){
    for(let i=this.staffLightningEffects.length-1;i>=0;i--){const fx=this.staffLightningEffects[i],t=(now-fx.start)/fx.duration;if(t>=1){this.disposeGeneratedVisual(fx.group);this.staffLightningEffects.splice(i,1);continue;}fx.group.traverse?.((o)=>{const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats)if(m?.transparent)m.opacity=Math.max(0,1-t);});}
  }

  applyStaffLightningDamage(target,damage){
    if(target.hit?.type==='animal'){const animal=target.hit.data;animal.maxHp=Math.max(1,Number(animal.maxHp||145));animal.hp=Math.max(0,Number(animal.hp??animal.maxHp)-damage);animal.hitFlashUntil=performance.now()+180;if(animal.hp<=0){animal.active=false;if(animal.group)animal.group.visible=false;animal.respawnAt=Date.now()+120000;this.state.stats.animals+=1;this.toast(`⚡ ${animal.profile?.label||'Tier'} besiegt · ${damage} Schaden`);}}
    else if(target.hit?.type==='npc'){const npc=target.hit.data;npc.staffEventHealth=Math.max(0,Number(npc.staffEventHealth??100)-damage);npc.hitFlashUntil=performance.now()+180;}
  }

  beginStaffBeam(pointerId=null){
    if(!this.canCastStaffLightning())return false;this.staffBeamActive=true;this.staffBeamPointerId=pointerId??null;this.staffBeamStartedAt=performance.now();this.staffBeamLastDamageAt=0;this.staffBeamLastPresenceAt=0;this.triggerActionAnimation('weapon-attack',360);this.updateActiveStaffBeam(performance.now(),true);this.renderHud(true);return true;
  }

  endStaffBeam(silent=false){
    if(!this.staffBeamActive&&!this.staffBeamVisual)return;this.staffBeamActive=false;this.staffBeamPointerId=null;if(this.staffBeamVisual){this.disposeGeneratedVisual(this.staffBeamVisual);this.staffBeamVisual=null;}this.staffShotSeq=(Math.floor(Number(this.staffShotSeq)||0)+1)%1000000000;this.staffShotAtMs=0;if(!silent&&this.opened&&this.onlineConnected)this.publishPresence(true).catch(()=>{});this.renderHud(true);
  }

  updateActiveStaffBeam(now=performance.now(),force=false){
    if(!this.staffBeamActive)return;if(!this.canCastStaffLightning()||!this.opened||this.panel?.classList.contains('is-open')||this.ownerPanel?.classList.contains('is-open')){this.endStaffBeam();return;}
    const theme=this.appearanceTheme('heldItem'),target=this.staffLightningTarget(),origin=this.staffLightningOrigin(target.origin,target.direction),damage=this.staffLightningDamage(theme);
    if(this.staffBeamVisual?.userData?.theme!==normalizeStaffTheme(theme)){this.disposeGeneratedVisual(this.staffBeamVisual);this.staffBeamVisual=null;}if(!this.staffBeamVisual)this.staffBeamVisual=this.createStaffBeamVisual(theme,false);this.updateStaffBeamVisual(this.staffBeamVisual,origin,target.end,theme,now);
    if(force||now-this.staffBeamLastDamageAt>=260){this.staffBeamLastDamageAt=now;this.applyStaffLightningDamage(target,damage);}
    if(force||now-this.staffBeamLastPresenceAt>=90){this.staffBeamLastPresenceAt=now;this.staffShotSeq=(Math.floor(Number(this.staffShotSeq)||0)+1)%1000000000;this.staffShotAtMs=Date.now();this.staffShotTheme=theme;this.staffShotEnd.copy(target.end);this.publishPresence(false).catch(()=>{});}
  }

  castStaffLightning(){
    if(!this.canCastStaffLightning())return false;this.beginStaffBeam(null);setTimeout(()=>{if(this.staffBeamActive&&this.staffBeamPointerId==null)this.endStaffBeam();},150);return true;
  }

  performPrimaryAction() {
    if(this.deathScreenOpen)return;
    if(!this.opened||this.panel?.classList.contains('is-open')||this.ownerPanel?.classList.contains('is-open')||this.buildMode)return;
    const now=performance.now();if(now<this.actionCooldownUntil)return;this.actionCooldownUntil=now+PRIMARY_ACTION_COOLDOWN_MS;
    const hotspot=this.nearestHotspot,groundGap=this.player.position.y-this.supportHeightAt(this.player.position.x,this.player.position.z,this.player.position.y);
    if(this.castStaffLightning())return;
    if(groundGap>1.65){this.toast('In der Luft kannst du keine Ressourcen bearbeiten.');return;}
    if(this.isOwnerActive&&this.state.ownerAppearance?.heldItem==='staff'&&hotspot&&['tree','rock','bush','animal','npc'].includes(hotspot.type)){this.ownerTelekinesis(hotspot);return;}
    if(this.firstPerson&&this.firstPersonArmsActions?.size){const kind=this.state.ownerAppearance?.heldItem!=='none'?this.state.ownerAppearance.heldItem:this.state.equippedTool||'none',clip=['sword','shovel','hoe','axe','ironAxe','hammer','pickaxe','eternalFlame','torch','spear'].includes(kind)?'knife_hit_01':kind==='none'?(this.nextPunchSide==='right'?'jab.r':'jab.l'):'jab.r';this.playFirstPersonArmsAction(clip,false);clearTimeout(this.firstPersonArmsReturnTimer);this.firstPersonArmsReturnTimer=setTimeout(()=>{if(this.opened)this.playFirstPersonArmsAction(this.currentFirstPersonArmsIdle(),true);},430);}
    if(hotspot?.type==='tutorial-pickup'){this.collectTutorialPickup(hotspot.data);return;}
    if(hotspot?.type==='tree'&&['axe','ironAxe'].includes(this.state.equippedTool)){this.triggerActionAnimation('chop',500);this.harvestTree(hotspot.data);return;}
    if(hotspot?.type==='rock'&&this.state.equippedTool==='pickaxe'){this.triggerActionAnimation('mine',500);this.harvestRock(hotspot.data);return;}
    if(hotspot?.type==='bush'){this.triggerActionAnimation('gather',430);this.harvestBush(hotspot.data);return;}
    if(hotspot?.type==='animal'&&(['spear','bow'].includes(this.state.equippedTool)||hotspot.data?.type==='spider')){this.triggerActionAnimation('weapon-attack',520);this.huntAnimal(hotspot.data);return;}
    if(this.state.equippedTool||this.state.ownerAppearance?.heldItem!=='none'){this.triggerActionAnimation('weapon-attack',520);return;}
    const side=this.nextPunchSide;this.nextPunchSide=side==='right'?'left':'right';this.triggerActionAnimation(`punch-${side}`,430);
  }

  buildStarterTutorialNodes() {
    for(const node of this.tutorialNodes)node.group?.removeFromParent?.();this.tutorialNodes.length=0;
    if(this.state.tutorial?.done||!this.player)return;
    const sx=Number(this.player.position.x),sz=Number(this.player.position.z);
    const add=(id,kind,ox,oz,label)=>{const x=sx+ox,z=sz+oz,y=terrainHeightAt(x,z),group=new THREE.Group();let mesh;
      if(kind==='stick'){mesh=new THREE.Mesh(new THREE.CylinderGeometry(.045,.065,1.05,7),new THREE.MeshStandardMaterial({color:0x81502b,roughness:1}));mesh.rotation.z=Math.PI/2;mesh.rotation.y=(ox+oz)*.2;mesh.position.y=.14;}
      else if(kind==='stone'){mesh=new THREE.Mesh(new THREE.DodecahedronGeometry(.24,0),new THREE.MeshStandardMaterial({color:0x7b817e,roughness:1,flatShading:true}));mesh.position.y=.2;}
      else if(kind==='berry'){mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(.62,1),new THREE.MeshStandardMaterial({color:0x3f7136,roughness:1,flatShading:true}));mesh.position.y=.55;for(let i=0;i<7;i++){const berry=new THREE.Mesh(new THREE.SphereGeometry(.07,7,5),new THREE.MeshStandardMaterial({color:0xc7352e,roughness:.7}));berry.position.set(Math.sin(i*2.1)*.48,.5+(i%3)*.16,Math.cos(i*1.7)*.4);group.add(berry);}}
      else {mesh=new THREE.Mesh(new THREE.CylinderGeometry(.045,.065,.24,7),new THREE.MeshStandardMaterial({color:0xe7dfc8,roughness:1}));mesh.position.y=.12;const cap=new THREE.Mesh(new THREE.SphereGeometry(.18,8,5,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:this.state.season===2?0xa94b31:0x9b7654,roughness:1}));cap.position.y=.26;group.add(cap);}
      group.add(mesh);group.position.set(x,y,z);this.scene.add(group);this.tutorialNodes.push({id:`tutorial-${id}`,kind,x,z,label,group,active:true});};
    add('stick-1','stick',3.2,1.4,'Trockenen Ast suchen');add('stick-2','stick',-2.7,3.1,'Trockenen Ast suchen');add('stick-3','stick',4.5,-2.4,'Trockenen Ast suchen');add('stone-1','stone',-4.1,-1.6,'Kleinen Stein suchen');add('stone-2','stone',1.2,-4.5,'Kleinen Stein suchen');add('berry','berry',6.4,4.2,'Rote Beeren sammeln');
    const mushroomCount=this.state.season===2?5:this.state.season===0?2:1;for(let i=0;i<mushroomCount;i++)add(`mushroom-${i}`,'mushroom',-6+i*1.15,5.3+(i%2)*.8,'Pilz sammeln');
  }

  async collectTutorialPickup(node) {
    if(!node?.active||node.collecting||this.collectingTutorialNode)return;
    node.collecting=true;this.collectingTutorialNode=node.id;this.triggerActionAnimation('gather',700);
    const labels={stick:'Du suchst nach einem brauchbaren Ast …',stone:'Du suchst nach einem passenden Stein …',berry:'Du pflückst die reifen Beeren …',mushroom:'Du prüfst und sammelst den Pilz …'};
    this.toast(labels[node.kind]||'Du sammelst den Fund …');
    await wait(node.kind==='stone'?950:node.kind==='stick'?820:700);
    const stillNear=this.opened&&node.active&&Math.hypot(this.player.position.x-node.x,this.player.position.z-node.z)<3.8&&this.player.position.y-this.supportHeightAt(this.player.position.x,this.player.position.z,this.player.position.y)<1.65;
    node.collecting=false;this.collectingTutorialNode=null;if(!stillNear){this.toast('Sammeln abgebrochen.');return;}
    node.active=false;node.group?.removeFromParent?.();
    if(node.kind==='stick'){this.state.inventory.wood+=1;this.state.tutorial.sticks+=1;this.toast('+1 trockener Ast');}
    else if(node.kind==='stone'){this.state.inventory.stone+=1;this.state.tutorial.stones+=1;this.toast('+1 kleiner Stein');}
    else if(node.kind==='berry'){this.state.inventory.berries+=2;this.state.tutorial.berries+=2;this.toast('+2 Beeren');}
    else {this.state.inventory.mushrooms+=1;this.state.tutorial.mushrooms+=1;this.toast('+1 Pilz');}
    this.checkTutorialProgress();this.renderHud(true);this.saveState(true);
  }

  checkTutorialProgress() {
    const t=this.state.tutorial;if(!t||t.done)return;
    if(t.step==='sticks'&&t.sticks>=3)t.step='stones';
    if(t.step==='stones'&&t.stones>=2)t.step='axe';
    if(t.step==='axe'&&this.state.tools.axe>0)t.step='tree';
    if(t.step==='tree'&&t.treeChopped)t.step='berries';
    if(t.step==='berries'&&t.berries>=1)t.step='mushrooms';
    if(t.step==='mushrooms'&&t.mushrooms>=1){t.done=true;t.step='done';this.state.activeQuest='fire';for(const node of this.tutorialNodes){node.active=false;node.group?.removeFromParent?.();}this.toast('Center-Grundtutorial abgeschlossen. Jetzt kannst du dein erstes Lagerfeuer bauen.');}
    this.renderHud(true);
  }

  ensureValidWorldPosition() {
    if(!this.player)return;const x=this.player.position.x,z=this.player.position.z,ground=terrainHeightAt(x,z);
    const invalid=!Number.isFinite(x)||!Number.isFinite(z)||!Number.isFinite(this.player.position.y)||this.player.position.y<ground-1||this.player.position.y>MAX_FLY_HEIGHT+80;
    if(!invalid)return;const safe=this.lastSafePosition?.clone?.()||new THREE.Vector3(Number(this.state.world.spawnX||0),terrainHeightAt(Number(this.state.world.spawnX||0),Number(this.state.world.spawnZ||0)),Number(this.state.world.spawnZ||0));
    safe.y=Math.max(terrainHeightAt(safe.x,safe.z),safe.y);this.player.position.copy(safe);this.velocityY=0;this.onGround=true;this.ownerFlags.fly=false;this.fallStartY=null;this.snapCamera();this.toast('Sicherheitsrettung: Du wurdest auf festen Boden gesetzt.');
  }

  ownerTelekinesis(hotspot) {
    if(!this.ownerOnly()||this.state.ownerAppearance?.heldItem!=='staff')return;
    const data=hotspot?.data||{};
    const target=data.group||null;
    let proxy=null;
    if(target){
      const world=new THREE.Vector3();target.getWorldPosition(world);proxy=target.clone(true);proxy.position.copy(world);proxy.rotation.copy(target.rotation);proxy.scale.copy(target.scale);this.scene.add(proxy);
      if(hotspot.type==='npc'||hotspot.type==='animal')target.visible=false;
    }else{
      const color=hotspot.type==='tree'?0x5d3924:hotspot.type==='rock'?0x737b78:0x44733a;
      const geometry=hotspot.type==='tree'?new THREE.CylinderGeometry(.35,.52,4.5,8):hotspot.type==='rock'?new THREE.DodecahedronGeometry(1.05,0):new THREE.IcosahedronGeometry(.85,1);
      proxy=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:1,flatShading:true}));proxy.position.set(hotspot.x,terrainHeightAt(hotspot.x,hotspot.z)+(hotspot.type==='tree'?2.3:.9),hotspot.z);this.scene.add(proxy);
    }
    if(['tree','rock','bush'].includes(hotspot.type)&&data.id)this.harvestNode(data,120000);
    const forward=new THREE.Vector3(-Math.sin(this.yaw),.25,-Math.cos(this.yaw)).normalize();
    const start=proxy.position.clone(),hover=this.player.position.clone().add(new THREE.Vector3(0,3.2,0)).add(forward.clone().multiplyScalar(4.5));
    this.ownerThrownObjects.push({proxy,source:target,sourceType:hotspot.type,start,hover,velocity:forward.multiplyScalar(18).add(new THREE.Vector3(0,7,0)),phase:'lift',createdAt:performance.now(),throwAt:performance.now()+850,removeAt:performance.now()+6500});
    this.triggerActionAnimation('gather',700);this.toast(`${hotspot.type==='npc'?'NPC':hotspot.type==='animal'?'Tier':'Objekt'} mit dem Weltenstab erfasst.`);
  }

  updateOwnerThrownObjects(delta,now=performance.now()) {
    for(let i=this.ownerThrownObjects.length-1;i>=0;i--){
      const item=this.ownerThrownObjects[i];if(!item?.proxy){this.ownerThrownObjects.splice(i,1);continue;}
      if(item.phase==='lift'){
        const t=clamp((now-item.createdAt)/850,0,1),ease=1-Math.pow(1-t,3);item.proxy.position.lerpVectors(item.start,item.hover,ease);item.proxy.rotation.y+=delta*3.2;
        if(now>=item.throwAt)item.phase='throw';
      }else{
        item.velocity.y-=15*delta;item.proxy.position.addScaledVector(item.velocity,delta);item.proxy.rotation.x+=delta*5;item.proxy.rotation.z+=delta*3.5;
        const ground=terrainHeightAt(item.proxy.position.x,item.proxy.position.z)+.25;if(item.proxy.position.y<ground){item.proxy.position.y=ground;item.velocity.y=Math.abs(item.velocity.y)*.28;item.velocity.x*=.72;item.velocity.z*=.72;}
      }
      if(now>=item.removeAt){item.proxy.removeFromParent();if(item.source&&(item.sourceType==='npc'||item.sourceType==='animal'))item.source.visible=true;this.ownerThrownObjects.splice(i,1);}
    }
    for(const fire of this.animatedFireLights){if(!fire?.group?.parent)continue;const wave=Math.sin(now*.018+fire.seed);if(fire.light)fire.light.intensity=3.1+wave*.55;if(fire.flame)fire.flame.scale.y=.88+wave*.13;}
  }

  toggleVillageDoor(doorId,hotspot=null) {
    const door=this.villageDoors.get(String(doorId||''));if(!door?.pivot)return;
    door.open=!door.open;door.pivot.rotation.y=door.open?-Math.PI*.52:0;
    if(hotspot)hotspot.label=door.open?'Haustür schließen':'Haustür öffnen';
    this.toast(door.open?'Tür geöffnet. Du kannst das Haus betreten.':'Tür geschlossen.');
  }

  useTool(name,amount=1) {
    if((this.state.tools[name]||0)<=0)return false;
    this.state.tools[name]=Math.max(0,this.state.tools[name]-amount);
    if(this.state.tools[name]<=0){
      this.toast(`${RECIPES[name]?.name||name} ist zerbrochen.`);
      if(this.state.equippedTool===name){this.state.equippedTool='';this.applyHeldItemVisual();}
    }
    return true;
  }

  harvestTree(node) {
    const forestry=this.state.skills.forestry||0;
    const axeId=(this.state.tools.ironAxe||0)>0?'ironAxe':'axe';this.state.equippedTool=axeId;this.applyHeldItemVisual();this.triggerActionAnimation('chop',620);
    if(!this.useTool(axeId,axeId==='ironAxe'?2:4)){this.state.inventory.wood+=1;if(!(this.isStaffActive&&this.ownerFlags.god))this.state.needs.stamina=Math.max(0,this.state.needs.stamina-5);this.toast('Ohne Axt sammelst du nur einen trockenen Ast.');this.gainXp(1,'Überleben');return;}
    const bonus=node?.archetype==='fallen'?2:node?.archetype==='broken'?1:0;const logs=3+Math.floor(forestry/2)+bonus,wood=2+forestry+bonus,firewood=1+Math.floor(forestry/2)+bonus;
    this.state.inventory.logs+=logs;this.state.inventory.wood+=wood;this.state.inventory.firewood=(this.state.inventory.firewood||0)+firewood;this.state.stats.trees+=1;if(this.state.tutorial&&!this.state.tutorial.done){this.state.tutorial.treeChopped=true;this.checkTutorialProgress();}if(!(this.isStaffActive&&this.ownerFlags.god))this.state.needs.stamina=Math.max(0,this.state.needs.stamina-9);
    this.harvestNode(node,150000);this.gainXp(8+forestry*2,'Forstwirtschaft');this.toast(`+${logs} Stämme · +${wood} Holz · +${firewood} Feuerholz`);this.checkQuestProgress();
  }

  harvestRock(node) {
    const mining=this.state.skills.mining||0;
    this.state.equippedTool='pickaxe';this.applyHeldItemVisual();this.triggerActionAnimation('mine',650);
    if(!this.useTool('pickaxe',5)){this.toast('Du brauchst eine Spitzhacke.');return;}
    const stone=3+mining,iron=Math.random()<.2+mining*.08?1:0;
    this.state.inventory.stone+=stone;this.state.inventory.iron+=iron;this.state.stats.rocks+=1;if(!(this.isStaffActive&&this.ownerFlags.god))this.state.needs.stamina=Math.max(0,this.state.needs.stamina-10);
    this.harvestNode(node,180000);this.gainXp(9+mining*2,'Bergbau');this.toast(`+${stone} Stein${iron?' · +1 Eisenerz':''}`);
  }

  harvestBush(node) {
    this.triggerActionAnimation('gather',420);
    const berries=2+Math.floor(Math.random()*4),flax=Math.random()<.45?1:0,herbs=Math.random()<.38?1+Math.floor(Math.random()*2):0;
    this.state.inventory.berries+=berries;this.state.inventory.flax+=flax;this.state.inventory.herbs+=herbs;this.harvestNode(node,90000);this.gainXp(3+herbs,'Sammeln');this.toast(`+${berries} Beeren${flax?' · +1 Flachs':''}${herbs?` · +${herbs} Kräuter`:''}`);
  }

  harvestNode(node,respawnMs) { this.setResourceVisible(node,false);this.state.harvested[node.id]=Date.now()+respawnMs; }

  collectWater() { this.state.inventory.water+=3;this.state.needs.thirst=Math.min(100,this.state.needs.thirst+14);this.gainXp(2,'Versorgung');this.toast('+3 Wasser · Durst gestillt'); }

  collectFirewoodPickup(data){if(!data)return;const now=Date.now();if(now<Number(data.availableAt||0)){this.toast('Hier liegt gerade kein trockenes Feuerholz mehr.');return;}this.state.inventory.firewood=(this.state.inventory.firewood||0)+3;data.availableAt=now+60000;if(data.group)data.group.visible=false;setTimeout(()=>{if(data.group)data.group.visible=true;},60000);this.gainXp(2,'Überleben');this.toast('+3 Feuerholz');this.renderHud(true);this.saveState(true);}

  observeAnimal(animal) {
    if(!animal?.profile)return;const key=`tier:${animal.type}`;if(!this.state.discovered.includes(key)){this.state.discovered.push(key);this.gainXp(6,`${animal.profile.label} beobachtet`);this.toast(`🔎 ${animal.profile.label} entdeckt.`);}else this.toast(`${animal.profile.label} beobachten · friedliche Interaktion`);
  }

  huntAnimal(animal) {
    if(!animal?.active||!['fox','cow','wolf1','wolf2','spider'].includes(animal.type)){return this.observeAnimal(animal);}
    if(animal.type==='spider'){
      const held=this.state.ownerAppearance?.heldItem||'none',hasWeapon=['sword','shovel','pickaxe','hoe','axe','hammer','staff','eternalFlame'].includes(held)||['spear','bow','axe','ironAxe','pickaxe'].includes(this.state.equippedTool);
      if(!hasWeapon&&!this.isStaffActive){this.toast('Du brauchst eine Waffe gegen die Zauberspinne.');return;}
      const hunting=this.state.skills.hunting||0,damage=this.isStaffActive?95:42+hunting*6;animal.hp=Math.max(0,Number(animal.hp||animal.maxHp||145)-damage);this.toast(`🕷 Zauberspinne getroffen · ${Math.ceil(animal.hp)}/${animal.maxHp||145} Leben`);
      if(animal.hp>0)return;
      animal.active=false;animal.group.visible=false;animal.respawnAt=Date.now()+120000;animal.targetX=animal.homeX;animal.targetZ=animal.homeZ;this.state.stats.animals+=1;
      if(Math.random()<.78){this.state.inventory.medicine=(this.state.inventory.medicine||0)+1;this.toast('🧪 Zauberspinne besiegt · +1 Heiltrank');}else{this.state.inventory.herbs=(this.state.inventory.herbs||0)+3;this.toast('🌿 Zauberspinne besiegt · +3 Kräuter');}
      this.gainXp(24+hunting*3,'Jagd');this.renderHud(true);this.saveState(true);return;
    }
    const usedBow=(this.state.tools.bow||0)>0;
    if(usedBow){this.useTool('bow',5);}else if(!this.useTool('spear',8)){this.toast('Du brauchst einen Jagdspeer oder Jägerbogen.');return;}
    const hunting=this.state.skills.hunting||0,isWolf=['wolf1','wolf2'].includes(animal.type);
    if(isWolf&&Math.random()>.58+hunting*.06){if(!(this.isStaffActive&&this.ownerFlags.god)){this.state.needs.health=Math.max(0,this.state.needs.health-14);this.state.needs.stamina=Math.max(0,this.state.needs.stamina-12);}this.toast('Der junge Wolf wehrt sich und entkommt.');animal.targetX+=30;animal.targetZ+=18;return;}
    const base={fox:[2,1],cow:[6,3],wolf1:[2,1],wolf2:[2,1]}[animal.type]||[2,1],meat=base[0]+hunting,leather=base[1]+Math.floor(hunting/2);
    this.state.inventory.meat+=meat;this.state.inventory.leather+=leather;this.state.stats.animals+=1;animal.active=false;animal.group.visible=false;animal.respawnAt=Date.now()+180000;
    this.gainXp(12+hunting*3,'Jagd');this.toast(`+${meat} Fleisch · +${leather} Leder`);
  }

  talkToNpc(npc) {
    const already=this.state.settlement.residents>0&&this.state.recruitedNames?.includes?.(npc.name);
    const houseCapacity=this.state.buildings.filter((b)=>b.type==='house').length*2;
    const canRecruit=!already&&houseCapacity>this.state.settlement.residents&&this.state.settlement.reputation>=15;
    this.openPanel('GESPRÄCH',npc.name,`
      <div class="mdc-dialogue-card"><p>„Das Tal ist rau, aber wer zusammenhält, kann hier eine Zukunft aufbauen.“</p><small>${npc.village} · ${npc.name}</small></div>
      <div class="mdc-panel-actions">
        <button data-mdc-action="npc-gift" data-npc="${npc.name}">Beeren schenken (+Ruf)</button>
        <button ${canRecruit?'':'disabled'} data-mdc-action="npc-recruit" data-npc="${npc.name}">${already?'Bereits Bewohner':houseCapacity<=this.state.settlement.residents?'Kein freier Schlafplatz':this.state.settlement.reputation<15?'15 Ruf benötigt':'Für Waldhain anwerben'}</button>
      </div>`);
  }

  recruitNpc(name) {
    this.state.recruitedNames=Array.isArray(this.state.recruitedNames)?this.state.recruitedNames:[];
    if(this.state.recruitedNames.includes(name))return;
    const capacity=this.state.buildings.filter((b)=>b.type==='house').length*2;
    if(capacity<=this.state.settlement.residents||this.state.settlement.reputation<15){this.toast('Voraussetzungen nicht erfüllt.');return;}
    this.state.recruitedNames.push(name);this.state.settlement.residents+=1;this.state.stats.recruited+=1;this.state.settlement.reputation+=3;this.gainXp(25,'Bewohner angeworben');this.toast(`${name} schließt sich Waldhain an.`);this.closePanel();this.checkQuestProgress();
  }

  giveNpcGift(name) { if(this.state.inventory.berries<2){this.toast('Du brauchst 2 Beeren.');return;}this.state.inventory.berries-=2;this.state.settlement.reputation+=3;this.gainXp(4,'Diplomatie');this.toast(`${name} freut sich über das Geschenk.`);this.talkToNpc(this.npcs.find((n)=>n.name===name)||{name,village:'Grenztal'}); }

  openTrade(village) {
    this.openPanel('HANDEL',village,`
      <div class="mdc-trade-grid">
        ${this.tradeRow('wood','Holz',2,1)}${this.tradeRow('stone','Stein',3,2)}${this.tradeRow('berries','Beeren',2,1)}${this.tradeRow('water','Wasser',4,2)}${this.tradeRow('leather','Leder',8,5)}${this.tradeRow('meat','Fleisch',7,4)}
      </div><p class="mdc-note">Kaufen und verkaufen verändert deine Münzen direkt.</p>`);
  }
  tradeRow(id,name,buy,sell){return `<article><div><b>${name}</b><small>Bestand: ${this.state.inventory[id]||0}</small></div><button data-mdc-action="trade-buy" data-item="${id}" data-price="${buy}">Kaufen ${buy}</button><button data-mdc-action="trade-sell" data-item="${id}" data-price="${sell}">Verkaufen ${sell}</button></article>`;}

  trade(item,price,buying){
    if(buying){if(this.state.inventory.coins<price){this.toast('Nicht genug Münzen.');return;}this.state.inventory.coins-=price;this.state.inventory[item]=(this.state.inventory[item]||0)+1;}
    else {if((this.state.inventory[item]||0)<1){this.toast('Kein Bestand.');return;}this.state.inventory[item]-=1;this.state.inventory.coins+=price;}
    this.openTrade(this.panelTitle.textContent||'Markt');this.renderHud(true);
  }

  openVillageInfo(name) {
    const village=this.villages.find((v)=>v.name===name);if(!village)return;
    this.openPanel('DORF',name,`<div class="mdc-village-hero"><strong>${name}</strong><span>${village.type||'Dorf'} · ${village.people.length} Bewohner · ${village.buildings||0} Gebäude</span></div><p>Ein eigenständiges Dorf mit Markt, Brunnen, Feldern, Scheune und Bewohnern. Hier kannst du handeln, neue Orte entdecken und Menschen für ${this.state.settlement.name} anwerben.</p><button data-mdc-action="open-map">Auf Karte anzeigen</button>`);
  }

  exploreCave(hotspot=null) {
    if(this.state.tools.torch<=0){this.toast('Für die dunkle Höhle brauchst du eine Fackel.');return;}
    this.useTool('torch',6);const stone=4+Math.floor(Math.random()*5),iron=1+Math.floor(Math.random()*3),coins=Math.random()<.28?8+Math.floor(Math.random()*18):0;this.state.inventory.stone+=stone;this.state.inventory.iron+=iron;this.state.inventory.coins+=coins;if(!(this.isStaffActive&&this.ownerFlags.god))this.state.needs.stamina=Math.max(0,this.state.needs.stamina-18);this.gainXp(18,'Höhle erkundet');if(hotspot?.data?.title)this.discover(hotspot.data.title);this.toast(`Höhlenfund: +${stone} Stein · +${iron} Eisenerz${coins?` · +${coins} Münzen`:''}`);
  }

  exploreMine(hotspot=null) {
    if(this.state.tools.pickaxe<=0){this.toast('Für das Bergwerk brauchst du eine Spitzhacke.');return;}
    this.useTool('pickaxe',9);const mining=this.state.skills.mining||0,stone=6+mining+Math.floor(Math.random()*5),iron=2+Math.floor(Math.random()*(3+mining));this.state.inventory.stone+=stone;this.state.inventory.iron+=iron;if(!(this.isStaffActive&&this.ownerFlags.god))this.state.needs.stamina=Math.max(0,this.state.needs.stamina-22);this.gainXp(24+mining*2,'Bergwerk erkundet');if(hotspot?.data?.title)this.discover(hotspot.data.title);this.toast(`Bergwerksfund: +${stone} Stein · +${iron} Eisenerz`);
  }

  discoverLandmark(hotspot) {
    const data=hotspot?.data||{},id=String(data.id||hotspot?.id||'landmark');
    this.discover(data.title||'Unbekannter Ort');
    if(!this.state.landmarkRewards[id]){const coins=12+Math.floor(hash2(id.length,Math.floor(hotspot.x||0),WORLD_SEED+2701)*34);this.state.landmarkRewards[id]=Date.now();this.state.inventory.coins+=coins;this.state.settlement.reputation+=3;this.gainXp(15,'Wahrzeichen entdeckt');this.toast(`${data.title||'Ort'} entdeckt · +${coins} Münzen`);}
    this.openInfo(data.title||'Ort',data.text||'Ein besonderer Ort in der offenen Welt.');
  }

  resolveWorldEncounter(hotspot) {
    const id=String(hotspot?.data?.id||hotspot?.id||'encounter'),last=Number(this.state.encounterHistory[id]||0);
    if(Date.now()-last<120000){this.toast('Dieses Lager wurde bereits durchsucht.');return;}
    this.state.encounterHistory[id]=Date.now();const danger=Math.random();
    if(danger<.28){const loss=5+Math.floor(Math.random()*10);if(!(this.isStaffActive&&this.ownerFlags.god))this.state.needs.health=Math.max(1,this.state.needs.health-loss);this.state.inventory.leather+=1;this.toast(`Ein Wolf überrascht dich: -${loss} Gesundheit · +1 Leder`);}
    else{const meat=1+Math.floor(Math.random()*3),coins=8+Math.floor(Math.random()*20),herbs=Math.floor(Math.random()*3);this.state.inventory.meat+=meat;this.state.inventory.coins+=coins;this.state.inventory.herbs+=herbs;this.toast(`Jägerlager: +${meat} Fleisch · +${coins} Münzen${herbs?` · +${herbs} Kräuter`:''}`);}
    this.gainXp(14,'Weltbegegnung');
  }

  sleepUntilMorning() {
    this.state.day+=1;if((this.state.day-1)%DAYS_PER_SEASON===0){this.state.season=(this.state.season+1)%4;this.applySeasonVisuals();}
    this.state.time=7;this.state.needs.stamina=100;this.state.needs.health=Math.min(this.effectiveMaxHealth(),this.state.needs.health+18);this.state.needs.hunger=Math.max(0,this.state.needs.hunger-10);this.state.needs.thirst=Math.max(0,this.state.needs.thirst-8);this.dailySettlementTick();this.toast(`Tag ${this.state.day} beginnt.`);this.renderHud(true);
  }

  collectProduction(kind) {
    if(kind==='wood'){this.state.inventory.logs+=4;this.state.settlement.firewood+=5;this.toast('+4 Stämme · +5 Dorf-Feuerholz');}
    else if(kind==='grain'){this.state.inventory.grain+=5;this.state.inventory.flax+=2;this.state.settlement.food+=4;this.toast('+5 Getreide · +2 Flachs · +4 Dorfnahrung');}
    else if(kind==='hunt'){this.state.inventory.meat+=3;this.state.inventory.leather+=2;this.state.settlement.food+=3;this.toast('+3 Fleisch · +2 Leder · +3 Dorfnahrung');}
    else if(kind==='mine'){this.state.inventory.stone+=5;this.state.inventory.iron+=2;this.toast('+5 Stein · +2 Eisenerz');}
    else {this.state.settlement.food+=6;this.state.inventory.flax+=2;this.toast('+6 Dorfnahrung · +2 Flachs');}
    this.gainXp(7,'Dorfproduktion');
  }

  useItem(item) {
    if(item==='berries'){if(this.state.inventory.berries<1)return this.toast('Keine Beeren.');this.state.inventory.berries-=1;this.state.needs.hunger=Math.min(100,this.state.needs.hunger+9);}
    if(item==='cookedMeat'){if(this.state.inventory.cookedMeat<1)return this.toast('Kein gebratenes Fleisch.');this.state.inventory.cookedMeat-=1;this.state.needs.hunger=Math.min(100,this.state.needs.hunger+32);this.state.needs.health=Math.min(this.effectiveMaxHealth(),this.state.needs.health+4);}
    if(item==='mushrooms'){if(this.state.inventory.mushrooms<1)return this.toast('Keine Pilze.');this.state.inventory.mushrooms-=1;this.state.needs.hunger=Math.min(100,this.state.needs.hunger+12);}
    if(item==='water'){if(this.state.inventory.water<1)return this.toast('Kein Wasser.');this.state.inventory.water-=1;this.state.needs.thirst=Math.min(100,this.state.needs.thirst+30);}
    if(item==='medicine'){if(this.state.inventory.medicine<1)return this.toast('Kein Heilmittel.');this.state.inventory.medicine-=1;this.state.needs.health=Math.min(this.effectiveMaxHealth(),this.state.needs.health+45);this.state.needs.warmth=Math.min(100,this.state.needs.warmth+12);}
    this.renderHud(true);this.saveState();
  }

  gainXp(amount,reason='Center') {
    const value=Math.max(0,Math.floor(Number(amount)||0));if(!value)return;
    this.state.xp+=value;
    while(this.state.xp>=100+this.state.skillPoints*35){this.state.xp-=100+this.state.skillPoints*35;this.state.skillPoints+=1;this.toast('Neuer Fähigkeitspunkt erhalten.');}
    window.JKGamesCenterBridge?.addMainXp?.(Math.max(1,Math.round(value*.25)),reason);
  }

  equipTool(id) {
    if(!RECIPES[id]||['cookedMeat','medicine'].includes(id)||Number(this.state.tools[id]||0)<=0)return;
    this.state.equippedTool=this.state.equippedTool===id?'':id;
    this.applyHeldItemVisual();
    this.saveState(true);
    this.openManagement('inventory');
    this.toast(this.state.equippedTool?`${RECIPES[id].name} ausgerüstet.`:'Werkzeug abgelegt.');
  }

  craft(recipeId) {
    const recipe=RECIPES[recipeId];if(!recipe)return;
    if(!this.hasCost(recipe.cost)){this.toast('Nicht genügend Rohstoffe.');return;}
    this.payCost(recipe.cost);
    if(recipeId==='cookedMeat')this.state.inventory.cookedMeat+=recipe.amount||1;else if(recipeId==='medicine')this.state.inventory.medicine+=recipe.amount||1;else {this.state.tools[recipeId]=Math.min(recipeId==='ironAxe'?180:120,(this.state.tools[recipeId]||0)+recipe.durability);if(!this.state.equippedTool)this.state.equippedTool=recipeId;this.applyHeldItemVisual();}
    this.state.stats.crafted+=1;if(recipeId==='axe')this.checkTutorialProgress();this.gainXp(8,`Herstellung: ${recipe.name}`);this.toast(`${recipe.name} hergestellt.`);this.openManagement('crafting');this.checkQuestProgress();
  }

  buildingCost(def){const cost={wood:Number(def?.wood||0),logs:Number(def?.logs||0),stone:Number(def?.stone||0)};if(Number(def?.firewood||0)>0)cost.firewood=Number(def.firewood);return cost;}
  hasCost(cost,discount=false) { return Object.entries(cost||{}).every(([key,value])=>(this.state.inventory[key]||0)>=this.adjustCost(value,discount)); }
  payCost(cost,discount=false) { for(const [key,value] of Object.entries(cost||{}))this.state.inventory[key]=Math.max(0,(this.state.inventory[key]||0)-this.adjustCost(value,discount)); }
  adjustCost(value,discount=false) { const level=discount?(this.state.skills.building||0):0;return Math.max(value>0?1:0,Math.ceil(Number(value||0)*(1-level*.07))); }

  beginBuildMode(type) {
    if(!BUILDINGS[type])return;
    if(type!=='campfire'&&this.state.tools.hammer<=0){this.toast('Du brauchst einen Bauhammer.');return;}
    const cost=this.buildingCost(BUILDINGS[type]);
    if(!this.hasCost(cost,true)){this.toast('Nicht genügend Baumaterial.');return;}
    this.cancelBuildMode();this.buildMode=type;this.buildRotation=0;this.buildGhost=this.createBuildObject(type,0,0,0,false,true);this.buildActions.hidden=false;this.closePanel();this.updateBuildGhost();this.toast(`${BUILDINGS[type].name}: Position wählen und mit E bauen.`);
  }

  updateBuildGhost() {
    if(!this.buildGhost||!this.player)return;
    const distance=8;const x=this.player.position.x-Math.sin(this.yaw)*distance;const z=this.player.position.z-Math.cos(this.yaw)*distance;
    this.buildGhost.position.set(x,terrainHeightAt(x,z)+.03,z);this.buildGhost.rotation.y=this.buildRotation;
    const valid=this.canPlaceBuilding(x,z,BUILDINGS[this.buildMode].size);
    this.buildGhost.traverse((object)=>{if(object.isMesh&&object.material?.color)object.material.color.set(valid?0x69c981:0xd65a52);});
    this.buildGhost.userData.valid=valid;
  }

  canPlaceBuilding(x,z,size) {
    if(Math.abs(x)>WORLD_HALF-20||Math.abs(z)>WORLD_HALF-20)return false;
    if(this.isInWater(x,z))return false;
    if(terrainHeightAt(x,z)>35)return false;
    if(this.colliders.some((c)=>Math.hypot(x-c.x,z-c.z)<c.radius+size*.65))return false;
    if(this.state.buildings.some((b)=>Math.hypot(x-b.x,z-b.z)<(BUILDINGS[b.type].size+size)*.72))return false;
    return true;
  }

  rotateBuildGhost() { if(!this.buildMode)return;this.buildRotation=(this.buildRotation+Math.PI/4)%(Math.PI*2);this.updateBuildGhost(); }

  placeBuilding() {
    if(!this.buildMode||!this.buildGhost)return;
    if(!this.buildGhost.userData.valid){this.toast('Hier kann nicht gebaut werden.');return;}
    const type=this.buildMode,def=BUILDINGS[type];const cost=this.buildingCost(def);
    if(!this.hasCost(cost,true)){this.toast('Baumaterial reicht nicht mehr.');return;}
    this.payCost(cost,true);if(type!=='campfire')this.useTool('hammer',5);
    const id=`b-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;const saved={id,type,x:Number(this.buildGhost.position.x.toFixed(2)),z:Number(this.buildGhost.position.z.toFixed(2)),rotation:Number(this.buildRotation.toFixed(4)),condition:100,createdAt:Date.now()};
    this.state.buildings.push(saved);this.state.stats.built+=1;this.buildGhost.removeFromParent();this.buildGhost=null;this.buildMode='';this.buildActions.hidden=true;this.spawnSavedBuilding(saved);this.gainXp(20,`Gebaut: ${def.name}`);this.toast(`${def.name} wurde errichtet.`);this.checkQuestProgress();this.saveState(true);
  }

  cancelBuildMode() { if(this.buildGhost){this.buildGhost.removeFromParent();this.buildGhost=null;}this.buildMode='';if(this.buildActions)this.buildActions.hidden=true; }

  toggleManagement(tab='overview') {
    if (this.panel?.classList.contains('is-open') && this.panelMode === tab) {
      this.closePanel();
      return;
    }
    this.openManagement(tab);
  }

  openManagement(tab='overview') {
    this.panelMode=tab;
    this.closeOwnerMenu();
    if (document.pointerLockElement===this.canvas) document.exitPointerLock?.();
    this.keys.clear();
    this.input.forward=0;
    this.input.right=0;
    const tabs=['overview','inventory','crafting','building','skills','village','dynasty','map','settings'];
    const labels={overview:'Übersicht',inventory:'Inventar',crafting:'Herstellen',building:'Bauen',skills:'Fähigkeiten',village:'Dorf',dynasty:'Dynastie',map:'Karte',settings:'Welt'};
    const nav=`<nav class="mdc-panel-tabs">${tabs.map((id)=>`<button class="${id===tab?'active':''}" data-mdc-tab="${id}">${labels[id]}</button>`).join('')}</nav>`;
    let body='';
    if(tab==='overview')body=this.renderOverviewPanel();
    if(tab==='inventory')body=this.renderInventoryPanel();
    if(tab==='crafting')body=this.renderCraftingPanel();
    if(tab==='building')body=this.renderBuildingPanel();
    if(tab==='skills')body=this.renderSkillsPanel();
    if(tab==='village')body=this.renderVillagePanel();
    if(tab==='dynasty')body=this.renderDynastyPanel();
    if(tab==='map')body=this.renderMapPanel();
    if(tab==='settings')body=this.renderWorldSettingsPanel();
    this.openPanel('CENTER',labels[tab],nav+body);
  }

  renderOverviewPanel() {
    const q=this.currentQuest();const season=SEASONS[this.state.season];
    return `<div class="mdc-overview-hero"><span>${season.icon}</span><div><small>${season.name} · Tag ${this.state.day}</small><h3>${this.state.settlement.name}</h3><p>${this.state.settlement.residents} Bewohner · ${this.state.settlement.reputation} Ruf</p></div></div>
      <div class="mdc-stat-grid"><article><small>Gesundheit</small><b>${Math.round(this.state.needs.health)}%</b></article><article><small>Münzen</small><b>${this.state.inventory.coins}</b></article><article><small>Geladene Regionen</small><b>${this.chunks.size}</b></article><article><small>Dörfer in Sicht</small><b>${this.loadedVillageCount}</b></article></div>
      <div class="mdc-quest-detail"><small>AKTUELLE AUFGABE</small><h3>${q.title}</h3><p>${q.text}</p><strong>${q.progress}</strong></div>
      <div class="mdc-panel-actions"><button data-mdc-tab="crafting">Werkzeug herstellen</button><button data-mdc-tab="building">Gebäude planen</button><button data-mdc-tab="dynasty">Beziehungen & Dynastie</button><button data-mdc-tab="settings">Einstellungen & Keybinds</button><button data-mdc-action="sleep">Bis zum Morgen schlafen</button></div>`;
  }

  renderInventoryPanel() {
    const items=Object.entries(RESOURCE_LABELS).map(([id,name])=>`<article><span>${this.itemIcon(id)}</span><div><b>${name}</b><small>Im Rucksack</small></div><strong>${this.state.inventory[id]||0}</strong>${['berries','mushrooms','cookedMeat','water','medicine'].includes(id)?`<button data-mdc-use="${id}">Benutzen</button>`:''}</article>`).join('');
    const tools=Object.entries(RECIPES).filter(([id])=>!['cookedMeat','medicine'].includes(id)).map(([id,r])=>{const amount=Math.round(this.state.tools[id]||0),equipped=this.state.equippedTool===id;return `<article class="${equipped?'is-equipped':''}"><span>${r.icon}</span><div><b>${r.name}</b><small>${equipped?'In der Hand':'Haltbarkeit'}</small></div><strong>${amount}%</strong><button ${amount>0?'':'disabled'} data-mdc-action="equip-tool" data-tool="${id}">${equipped?'Ablegen':'Ausrüsten'}</button></article>`;}).join('');
    return `<h3 class="mdc-section-title">Rohstoffe</h3><div class="mdc-inventory-list">${items}</div><h3 class="mdc-section-title">Werkzeuge</h3><p class="mdc-note">Ausrüsten zeigt das Werkzeug direkt in der Hand. Mit C öffnest und schließt du dieses Menü.</p><div class="mdc-inventory-list">${tools}</div>`;
  }

  renderCraftingPanel() {
    return `<p class="mdc-note">Werkzeuge verschleißen bei Benutzung. Am Lagerfeuer kannst du Fleisch garen.</p><div class="mdc-recipe-grid">${Object.entries(RECIPES).map(([id,r])=>`<article><span>${r.icon}</span><div><h3>${r.name}</h3><p>${this.costText(r.cost)}</p><small>${['cookedMeat','medicine'].includes(id)?'Verbrauchsgegenstand':'Haltbarkeit '+Math.round(this.state.tools[id]||0)+'%'}</small></div><button ${this.hasCost(r.cost)?'':'disabled'} data-mdc-action="craft" data-recipe="${id}">Herstellen</button></article>`).join('')}</div>`;
  }

  renderBuildingPanel() {
    return `<p class="mdc-note">Platziere Gebäude frei in der offenen Welt. Ein Bauhammer wird außer beim Lagerfeuer benötigt.</p><div class="mdc-building-grid">${Object.entries(BUILDINGS).map(([id,b])=>{const cost=this.buildingCost(b);return `<article><span>${b.icon}</span><div><small>${b.category}</small><h3>${b.name}</h3><p>${this.costText(cost,true)}</p></div><button ${this.hasCost(cost,true)?'':'disabled'} data-mdc-action="build" data-building="${id}">Platzieren</button></article>`;}).join('')}</div>`;
  }

  renderSkillsPanel() {
    return `<div class="mdc-skill-points"><span>FÄHIGKEITSPUNKTE</span><strong>${this.state.skillPoints}</strong></div><div class="mdc-skill-list">${Object.entries(SKILLS).map(([id,s])=>`<article><span>${s.icon}</span><div><h3>${s.name}</h3><p>${s.text}</p><small>Stufe ${this.state.skills[id]}/5</small></div><button ${this.state.skillPoints>0&&this.state.skills[id]<5?'':'disabled'} data-mdc-action="skill" data-skill="${id}">Verbessern</button></article>`).join('')}</div>`;
  }

  renderVillagePanel() {
    const s=this.state.settlement,capacity=this.state.buildings.filter((b)=>b.type==='house').length*2,jobs=s.jobs||{},assigned=Object.values(jobs).reduce((sum,value)=>sum+Number(value||0),0),free=Math.max(0,s.residents-assigned);
    const jobDefs={woodcutter:['🪵','Holzfäller'],farmer:['🌾','Bauer'],hunter:['🏹','Jäger'],miner:['⛏','Bergarbeiter'],crafter:['⚒','Handwerker']};
    return `<div class="mdc-village-hero"><strong>${s.name}</strong><span>${s.residents}/${capacity} Bewohner · Moral ${Math.round(s.morale)}% · ${free} frei</span></div>
      <div class="mdc-stat-grid"><article><small>Nahrung</small><b>${s.food}</b></article><article><small>Feuerholz</small><b>${s.firewood}</b></article><article><small>Ruf</small><b>${s.reputation}</b></article><article><small>Steuern</small><b>${s.taxDue}</b></article></div>
      <h3 class="mdc-section-title">Berufe zuweisen</h3><div class="mdc-job-grid">${Object.entries(jobDefs).map(([id,[icon,name]])=>`<article><span>${icon}</span><div><b>${name}</b><small>${jobs[id]||0} Bewohner</small></div><button data-mdc-action="job-minus" data-job="${id}" ${(jobs[id]||0)>0?'':'disabled'}>−</button><button data-mdc-action="job-plus" data-job="${id}" ${free>0?'':'disabled'}>+</button></article>`).join('')}</div>
      <h3 class="mdc-section-title">Bewohner</h3><div class="mdc-resident-list">${(this.state.recruitedNames||[]).length?(this.state.recruitedNames||[]).map((n,index)=>`<article><span>♟</span><b>${n}</b><small>${Object.keys(jobDefs)[index%Object.keys(jobDefs).length]||'Bewohner'} von ${s.name}</small></article>`).join(''):'<p>Noch hat sich niemand deiner Siedlung angeschlossen.</p>'}</div>
      <button ${s.taxDue>0&&this.state.inventory.coins>=s.taxDue?'':'disabled'} data-mdc-action="pay-tax">Steuern bezahlen (${s.taxDue})</button>`;
  }

  renderDynastyPanel() {
    const family=this.state.family||{partner:'',affection:0,heir:'',generation:1};
    const partnerText=family.partner?family.partner:`Noch keine Partnerschaft · ${Math.round(family.affection)}% Beziehung`;
    return `<div class="mdc-dynasty-hero"><span>♛</span><div><small>GENERATION ${family.generation||1}</small><h3>Dynastie von ${escapeHtml(this.state.settlement.name)}</h3><p>Ruf ${this.state.settlement.reputation} · ${this.state.settlement.residents} Bewohner</p></div></div>
      <div class="mdc-family-grid"><article><small>Partner</small><b>${partnerText}</b></article><article><small>Erbe</small><b>${family.heir||'Noch kein Erbe'}</b></article><article><small>Vermächtnis</small><b>${this.state.completedQuests.length} Kapitel</b></article></div>
      <p class="mdc-note">Besuche Dorffeste, verbessere deinen Ruf und baue eine Taverne, um Beziehungen zu vertiefen. Eine Familie sichert deine nächste Generation.</p>
      <div class="mdc-panel-actions"><button data-mdc-action="courtship" ${family.partner||this.state.inventory.coins<20?'disabled':''}>Dorffest besuchen · 20 Münzen</button><button data-mdc-action="family" ${!family.partner||family.heir||this.state.inventory.coins<50?'disabled':''}>Familie gründen · 50 Münzen</button></div>`;
  }

  renderMapPanel() {
    const px=this.player?.position.x||0,pz=this.player?.position.z||0,range=Math.max(650,(this.state.world?.renderDistance||2)*CHUNK_SIZE*1.25);
    const marker=(name,x,z,icon,known=true)=>{if(!known)return'';const left=clamp(50+(x-px)/range*50,2,98).toFixed(2),top=clamp(50+(z-pz)/range*50,2,98).toFixed(2);return `<i style="left:${left}%;top:${top}%" title="${escapeHtml(name)}"><span>${icon}</span><em>${escapeHtml(name)}</em></i>`;};
    const villages=this.villages.map((v)=>marker(v.name,v.x,v.z,'♜',this.state.discovered.includes(v.name)||Math.hypot(v.x-px,v.z-pz)<80)).join('');
    const landmarks=this.hotspots.filter((h)=>['cave','mine','landmark','encounter'].includes(h.type)&&Math.hypot(h.x-px,h.z-pz)<range).map((h)=>{const name=h.data?.title||h.label;return marker(name,h.x,h.z,h.type==='cave'?'◒':h.type==='mine'?'⛏':h.type==='encounter'?'⛺':'◆',this.state.discovered.includes(name));}).join('');
    const buildings=this.state.buildings.filter((b)=>Math.hypot(b.x-px,b.z-pz)<range).map((b)=>marker(BUILDINGS[b.type].name,b.x,b.z,BUILDINGS[b.type].icon,true)).join('');
    const lost=this.state.deathLoot&&Date.now()<Number(this.state.deathLoot.expiresAt||0)?marker(`Verlorener Loot · ${Math.round(Math.hypot(Number(this.state.deathLoot.x||0)-px,Number(this.state.deathLoot.z||0)-pz))} m`,Number(this.state.deathLoot.x||0),Number(this.state.deathLoot.z||0),'☠',true):'';
    return `<div class="mdc-map-current"><small>AKTUELLER ORT</small><strong>${escapeHtml(this.currentRegion||'Offene Wildnis')}</strong></div><div class="mdc-world-map streamed"><div class="local-grid"></div>${villages}${landmarks}${buildings}${lost}<b style="left:50%;top:50%" title="Deine Position">▲</b></div><p class="mdc-note">Entdeckte Dörfer und Orte bleiben dauerhaft auf der Karte sichtbar. Du befindest dich aktuell in <b>${escapeHtml(this.currentRegion||'Offene Wildnis')}</b>.</p>`;
  }

  renderWorldSettingsPanel() {
    const distance=this.state.world?.renderDistance||2,density=this.state.world?.density||'normal',landmarks=this.state.world?.landmarkDensity||'normal',onlineEnabled=!!this.state.world?.onlineEnabled;
    const quality=GRAPHICS_QUALITIES.includes(this.state.world?.graphicsQuality)?this.state.world.graphicsQuality:'medium';
    const shadowMode=SHADOW_MODES.includes(this.state.world?.shadowMode)?this.state.world.shadowMode:'off';
    const controls=this.state.world?.controlsHint||'auto';
    return `<div class="mdc-settings-card"><small>ONLINE</small><h3>Online-Modus</h3><p>Wenn Online aktiviert ist, siehst du andere Spieler im Center, die Online ebenfalls eingeschaltet haben. Die Einstellung bleibt aktiv und verbindet sich bei einer kurzen Unterbrechung automatisch neu.</p><div class="mdc-setting-options"><button class="${onlineEnabled?'active':''}" data-mdc-action="world-online" data-value="${onlineEnabled?'off':'on'}">${onlineEnabled?'Online ausschalten':'Online einschalten'}<small>${onlineEnabled?'Aktiviert':'Ausgeschaltet'}</small></button></div></div>
      <div class="mdc-settings-card"><small>GRAFIKQUALITÄT</small><h3>Darstellung und Leistung</h3><p>Minimal reduziert auch fremde Wings/Auren stark. Extreme ist die neue HD-Stufe mit maximaler Dichte, Auflösung und hochwertigen Online-Effekten.</p><div class="mdc-setting-options">${[['minimal','Minimal'],['performance','Performance'],['low','Niedrig'],['medium','Mittel'],['high','Hoch'],['ultra','Ultra'],['maximum','Maximum'],['extreme','Extreme HD']].map(([id,label])=>`<button class="${quality===id?'active':''}" data-mdc-action="world-quality" data-value="${id}">${label}<small>${id==='minimal'?'Extrem sparsam · Remote-Effekte reduziert':id==='performance'?'Sehr geringe Last':id==='low'?'Sparsam':id==='medium'?'Ausgewogen':id==='high'?'Mehr Details':id==='ultra'?'HD & Welt-Schatten':id==='maximum'?'Sehr hohe Dichte':'Höchste lokale & Online-Details'}</small></button>`).join('')}</div></div>
      <div class="mdc-settings-card"><small>SCHATTEN</small><h3>Schattenmodus</h3><p>Der Modus kann unabhängig von der Grafikstufe angepasst werden.</p><div class="mdc-setting-options three">${[['off','Aus'],['character','Nur Charakter'],['world','Gesamte Welt']].map(([id,label])=>`<button class="${shadowMode===id?'active':''}" data-mdc-action="world-shadow-mode" data-value="${id}">${label}</button>`).join('')}</div></div>
      <div class="mdc-settings-card"><small>TASTENBELEGUNG</small><h3>Menüs und Aktionen</h3><p>Du kannst die wichtigsten Center-Tasten direkt ändern.</p><div class="mdc-keybind-grid">${[['overview','Übersicht'],['inventory','Inventar'],['crafting','Herstellen'],['building','Bauen'],['perspective','Perspektive'],['interact','Interagieren'],['jump','Springen']].map(([id,label])=>`<label>${label}<select data-keybind-action="${id}">${this.keybindOptions(this.state.keybinds?.[id])}</select></label>`).join('')}</div></div>
      <div class="mdc-settings-card"><small>STEUERUNGSHILFE</small><h3>Tastenanzeige</h3><p>Standardmäßig wird die Tastenhilfe beim Betreten nur einige Sekunden eingeblendet.</p><div class="mdc-setting-options three">${[['auto','Kurz beim Start'],['always','Immer anzeigen'],['hidden','Ausblenden']].map(([id,label])=>`<button class="${controls===id?'active':''}" data-mdc-action="world-controls" data-value="${id}">${label}</button>`).join('')}</div></div>
      <div class="mdc-settings-card"><small>DYNAMISCHES WELT-STREAMING</small><h3>Sichtweite</h3><p>Nur Regionen rund um dich werden geladen. Entfernte Regionen werden automatisch aus dem Speicher entfernt.</p><div class="mdc-setting-options">${[1,2,3,4,5].map((value)=>`<button class="${distance===value?'active':''}" data-mdc-action="world-distance" data-value="${value}">${value===1?'Kurz':value===2?'Mittel':value===3?'Weit':value===4?'Sehr weit':'Extrem'}<small>${(value*CHUNK_SIZE).toLocaleString('de-DE')} m Radius</small></button>`).join('')}</div></div>
      <div class="mdc-settings-card"><small>OBJEKTDICHTE</small><h3>Wälder und Landschaft</h3><p>Bestimmt, wie viele Bäume, Felsen und Büsche pro Region erzeugt werden.</p><div class="mdc-setting-options three">${[['low','Niedrig'],['normal','Normal'],['high','Sehr dicht']].map(([id,label])=>`<button class="${density===id?'active':''}" data-mdc-action="world-density" data-value="${id}">${label}</button>`).join('')}</div></div>
      <div class="mdc-settings-card"><small>ENTDECKUNGEN</small><h3>Höhlen, Ruinen und Lager</h3><p>Bestimmt, wie häufig besondere Orte und zufällige Begegnungen in neuen Regionen entstehen.</p><div class="mdc-setting-options three">${[['low','Selten'],['normal','Normal'],['high','Häufig']].map(([id,label])=>`<button class="${landmarks===id?'active':''}" data-mdc-action="landmark-density" data-value="${id}">${label}</button>`).join('')}</div></div>
      <div class="mdc-stat-grid"><article><small>Geladene Regionen</small><b>${this.chunks.size}</b></article><article><small>Dörfer in Sicht</small><b>${this.loadedVillageCount}</b></article><article><small>Weltgröße</small><b>12 km</b></article><article><small>Spawnpunkt</small><b>#${this.state.world?.spawnIndex??0}</b></article></div>`;
  }

  currentQuest() {
    const t=this.state.tutorial;
    if(t&&!t.done){const tutorial={sticks:{title:'Erste Äste finden',text:'Suche drei trockene Äste in der Nähe deines Startpunkts.',progress:`Äste ${Math.min(3,t.sticks)}/3`},stones:{title:'Kleine Steine suchen',text:'Sammle zwei kleine Steine vom Boden.',progress:`Steine ${Math.min(2,t.stones)}/2`},axe:{title:'Die erste Steinaxt',text:'Öffne mit C die Herstellung und baue aus Ästen und Steinen eine Steinaxt.',progress:this.state.tools.axe>0?'Axt hergestellt':'Steinaxt fehlt'},tree:{title:'Den ersten Baum fällen',text:'Rüste die Steinaxt aus und schlage mit der linken Maustaste auf einen Baum.',progress:t.treeChopped?'Baum gefällt':'Baum 0/1'},berries:{title:'Nahrung aus Sträuchern',text:'Finde einen Strauch mit roten Beeren und sammle ihn.',progress:`Beeren ${Math.min(1,t.berries)}/1`},mushrooms:{title:'Pilze der Jahreszeit',text:'Sammle einen Pilz. Im Herbst wachsen deutlich mehr Pilze.',progress:`Pilze ${Math.min(1,t.mushrooms)}/1`}};return tutorial[t.step]||tutorial.sticks;}
    const built=this.state.buildings.length,res=this.state.settlement.residents;
    const quests={
      tools:{title:'Das erste Werkzeug',text:'Stelle eine Steinaxt her.',done:this.state.tools.axe>0,progress:this.state.tools.axe>0?'Erledigt':'Steinaxt fehlt'},
      fire:{title:'Wärme in der Wildnis',text:'Errichte ein eigenes Lagerfeuer.',done:this.state.buildings.some((b)=>b.type==='campfire'),progress:`Lagerfeuer ${this.state.buildings.some((b)=>b.type==='campfire')?1:0}/1`},
      house:{title:'Ein Dach über dem Kopf',text:'Baue das erste Wohnhaus.',done:this.state.buildings.some((b)=>b.type==='house'),progress:`Wohnhaus ${this.state.buildings.some((b)=>b.type==='house')?1:0}/1`},
      resident:{title:'Gemeinsam stärker',text:'Wirb den ersten Bewohner an.',done:res>=1,progress:`Bewohner ${res}/1`},
      village:{title:'Dorf im Aufbruch',text:'Errichte vier Gebäude und gewinne zwei Bewohner.',done:built>=4&&res>=2,progress:`Gebäude ${Math.min(4,built)}/4 · Bewohner ${Math.min(2,res)}/2`},
      legacy:{title:'Eine neue Dynastie',text:'Erreiche zehn Gebäude, fünf Bewohner und 100 Ruf.',done:built>=10&&res>=5&&this.state.settlement.reputation>=100,progress:`${built}/10 Gebäude · ${res}/5 Bewohner · ${this.state.settlement.reputation}/100 Ruf`},
      profession:{title:'Ein arbeitendes Dorf',text:'Weise mindestens drei Bewohnern Berufe zu.',done:Object.values(this.state.settlement.jobs||{}).reduce((sum,value)=>sum+Number(value||0),0)>=3,progress:`${Math.min(3,Object.values(this.state.settlement.jobs||{}).reduce((sum,value)=>sum+Number(value||0),0))}/3 Berufe`},
      dynasty:{title:'Das Vermächtnis',text:'Gründe eine Familie und sichere einen Erben.',done:!!this.state.family?.heir,progress:this.state.family?.heir?`Erbe: ${this.state.family.heir}`:`Beziehung ${Math.round(this.state.family?.affection||0)}%`}
    };
    return quests[this.state.activeQuest]||quests.tools;
  }

  checkQuestProgress() {
    const order=['tools','fire','house','resident','village','profession','legacy','dynasty'];
    if(this.state.tutorial&&!this.state.tutorial.done){this.checkTutorialProgress();return;}
    const q=this.currentQuest();if(!q.done)return;
    const id=this.state.activeQuest;
    if(!this.state.completedQuests.includes(id)){this.state.completedQuests.push(id);this.state.inventory.coins+=35;this.state.settlement.reputation+=10;this.gainXp(35,`Aufgabe: ${q.title}`);this.toast(`Aufgabe abgeschlossen: ${q.title} · +35 Münzen`);}
    const index=order.indexOf(id);this.state.activeQuest=order[Math.min(order.length-1,index+1)];this.renderHud(true);if(this.panel.classList.contains('is-open'))this.openManagement(this.panelMode||'overview');
  }

  itemIcon(id){return {wood:'🪵',firewood:'🔥',logs:'▥',stone:'◆',berries:'●',mushrooms:'🍄',meat:'🍖',cookedMeat:'♨',water:'💧',leather:'▱',flax:'🌾',iron:'⬢',herbs:'🌿',grain:'🌾',medicine:'✚',coins:'◉'}[id]||'·';}
  collectedText(entries=[]){return entries.filter(([,amount])=>Number(amount)>0).map(([id,amount])=>`+${amount} ${RESOURCE_LABELS[id]||id}`).join(' · ');}
  costText(cost,discount=false){return Object.entries(cost||{}).filter(([,v])=>v>0).map(([k,v])=>`${this.adjustCost(v,discount)} ${RESOURCE_LABELS[k]||k}`).join(' · ')||'Kostenlos';}

  handlePanelAction(event) {
    const use=event.target.closest?.('[data-mdc-use]')?.dataset.mdcUse;if(use){this.useItem(use);if(this.panelMode==='inventory')this.openManagement('inventory');return;}
    const tab=event.target.closest?.('[data-mdc-tab]')?.dataset.mdcTab;if(tab)return this.openManagement(tab);
    const button=event.target.closest?.('[data-mdc-action]');if(!button)return;
    const action=button.dataset.mdcAction;
    if(action==='craft')this.craft(button.dataset.recipe);
    if(action==='equip-tool')this.equipTool(button.dataset.tool);
    if(action==='build')this.beginBuildMode(button.dataset.building);
    if(action==='skill')this.upgradeSkill(button.dataset.skill);
    if(action==='npc-gift')this.giveNpcGift(button.dataset.npc);
    if(action==='npc-recruit')this.recruitNpc(button.dataset.npc);
    if(action==='trade-buy')this.trade(button.dataset.item,Number(button.dataset.price),true);
    if(action==='trade-sell')this.trade(button.dataset.item,Number(button.dataset.price),false);
    if(action==='sleep')this.sleepUntilMorning();
    if(action==='open-map')this.openManagement('map');
    if(action==='pay-tax')this.payTax();
    if(action==='world-distance'){this.state.world.renderDistance=Math.floor(clamp(Number(button.dataset.value),MIN_RENDER_DISTANCE,MAX_RENDER_DISTANCE));this.applyWorldRenderSettings(true);this.rebuildStreamedWorld();this.saveState(true);this.openManagement('settings');this.toast(`Sichtweite: ${this.state.world.renderDistance} Regionen.`);}
    if(action==='world-density'){const value=button.dataset.value;this.state.world.density=['low','normal','high'].includes(value)?value:'normal';this.rebuildStreamedWorld();this.saveState(true);this.openManagement('settings');this.toast(`Objektdichte: ${this.state.world.density}.`);}
    if(action==='landmark-density'){const value=button.dataset.value;this.state.world.landmarkDensity=['low','normal','high'].includes(value)?value:'normal';this.rebuildStreamedWorld();this.saveState(true);this.openManagement('settings');this.toast(`Besondere Orte: ${this.state.world.landmarkDensity}.`);}
    if(action==='world-online'){
      const enabled=button.dataset.value==='on';
      this.state.world.onlineEnabled=enabled;
      this.saveState(true);
      if(enabled){
        this.onlineRetryAttempt=0;
        this.connectMultiplayer().catch(()=>this.scheduleOnlineReconnect('Online-Verbindung wird erneut versucht.'));
      }else{
        this.disconnectMultiplayer(true).catch(()=>{});
      }
      this.openManagement('settings');
      this.toast(enabled?'Online ist aktiviert. Spieler werden verbunden.':'Online ausgeschaltet.');
    }
    if(action==='world-quality'){const value=button.dataset.value;this.state.world.graphicsQuality=GRAPHICS_QUALITIES.includes(value)?value:'medium';this.state.world.shadowMode=['ultra','maximum','extreme'].includes(value)?'world':value==='high'?'character':'off';this.applyGraphicsQuality();this.saveState(true);this.openManagement('settings');const labels={minimal:'Minimal',performance:'Performance',low:'Niedrig',medium:'Mittel',high:'Hoch',ultra:'Ultra',maximum:'Maximum',extreme:'Extreme HD'};this.toast(`Grafikqualität: ${labels[value]||'Mittel'}.`);}
    if(action==='world-shadow-mode'){const value=button.dataset.value;this.state.world.shadowMode=SHADOW_MODES.includes(value)?value:'off';this.applyShadowSettings();this.saveState(true);this.openManagement('settings');this.toast(value==='off'?'Schatten ausgeschaltet.':value==='character'?'Nur Charakterschatten aktiv.':'Vollständige Weltschatten aktiv.');}
    if(action==='world-controls'){const value=button.dataset.value;this.state.world.controlsHint=['auto','always','hidden'].includes(value)?value:'auto';this.scheduleControlsHint(value==='always');if(value==='hidden')this.controlsHintElement?.classList.add('is-hidden');this.saveState(true);this.openManagement('settings');}
    if(action==='job-plus')this.adjustVillageJob(button.dataset.job,1);
    if(action==='job-minus')this.adjustVillageJob(button.dataset.job,-1);
    if(action==='courtship')this.advanceRelationship();
    if(action==='family')this.startFamily();
  }

  adjustVillageJob(id,delta){const jobs=this.state.settlement.jobs||{},assigned=Object.values(jobs).reduce((sum,value)=>sum+Number(value||0),0);if(delta>0&&assigned>=this.state.settlement.residents)return;if(delta<0&&(jobs[id]||0)<=0)return;jobs[id]=Math.max(0,(jobs[id]||0)+delta);this.state.settlement.jobs=jobs;this.saveState(true);this.openManagement('village');}
  advanceRelationship(){const family=this.state.family;if(family.partner||this.state.inventory.coins<20)return;this.state.inventory.coins-=20;family.affection=clamp((family.affection||0)+18+Math.floor(Math.random()*18),0,100);this.state.settlement.reputation+=2;if(family.affection>=100){const names=['Mara','Freya','Liv','Runa','Hilda','Edda','Alrik','Konrad','Sven','Borin'];family.partner=names[Math.floor(Math.random()*names.length)];this.toast(`${family.partner} möchte dein Leben mit dir teilen.`);}else this.toast(`Beziehung verbessert: ${Math.round(family.affection)}%.`);this.saveState(true);this.openManagement('dynasty');}
  startFamily(){const family=this.state.family;if(!family.partner||family.heir||this.state.inventory.coins<50)return;this.state.inventory.coins-=50;const names=['Aren','Elin','Tilda','Falk','Rika','Jorin','Lene','Marten'];family.heir=names[Math.floor(Math.random()*names.length)];this.state.settlement.morale=Math.min(100,this.state.settlement.morale+10);this.state.settlement.reputation+=15;this.gainXp(45,'Dynastie gegründet');this.toast(`${family.heir} ist der neue Erbe deiner Dynastie.`);this.saveState(true);this.openManagement('dynasty');}

  upgradeSkill(id) { if(!SKILLS[id]||this.state.skillPoints<1||this.state.skills[id]>=5)return;this.state.skillPoints-=1;this.state.skills[id]+=1;this.toast(`${SKILLS[id].name} auf Stufe ${this.state.skills[id]}.`);this.openManagement('skills'); }
  payTax(){const due=this.state.settlement.taxDue;if(due<=0||this.state.inventory.coins<due)return;this.state.inventory.coins-=due;this.state.settlement.taxDue=0;this.state.settlement.morale=Math.min(100,this.state.settlement.morale+4);this.toast('Steuern bezahlt.');this.openManagement('village');}

  openInfo(title,text){this.openPanel('ENTDECKUNG',title,`<div class="mdc-dialogue-card"><p>${text}</p></div><button data-mdc-action="open-map">Karte öffnen</button>`);}
  openPanel(kicker,title,html){
    this.panelKicker.textContent=kicker;
    this.panelTitle.textContent=title;
    this.panelBody.innerHTML=html;
    this.panel.classList.add('is-open');
    this.overlay.classList.add('is-panel-open');
    if(document.pointerLockElement===this.canvas)document.exitPointerLock?.();
    this.keys.clear();this.input.forward=0;this.input.right=0;
  }
  closePanel(){
    if(!this.panel)return;
    this.panel.classList.remove('is-open');
    this.overlay.classList.remove('is-panel-open');
    this.canvas?.focus?.({preventScroll:true});
  }

  renderHud(force=false) {
    const now=performance.now();if(!force&&now-this.lastHudAt<200)return;this.lastHudAt=now;
    const needs=[['health','Leben','♥'],['hunger','Hunger','●'],['thirst','Durst','◆'],['stamina','Ausdauer','⚡'],['warmth','Wärme','♨']],maxHealth=this.effectiveMaxHealth();
    this.needsElement.innerHTML=needs.map(([id,name,icon])=>{const max=id==='health'?maxHealth:100,value=this.state.needs[id],pct=clamp(value/Math.max(1,max)*100,0,100),low=pct<=20,display=id==='health'&&max>100?`${Math.round(value)}/${max}`:Math.round(value);return `<div class="${id} ${low?'is-low':''}"><span>${icon}</span><div><small>${name}</small><i><b style="width:${pct}%"></b></i></div><strong>${display}</strong></div>`;}).join('');
    const q=this.currentQuest();this.questElement.innerHTML=`<small>AUFGABE</small><strong>${q.title}</strong><span>${q.progress}</span>`;
    const equipped=this.state.equippedTool&&RECIPES[this.state.equippedTool]?`<div class="mdc-equipped-tool"><span>${RECIPES[this.state.equippedTool].icon}</span><b>${Math.round(this.state.tools[this.state.equippedTool]||0)}%</b><small>${RECIPES[this.state.equippedTool].name}</small></div>`:'';
    const staffAttack=this.canCastStaffLightning()?`<div class="mdc-equipped-tool" title="Linksklick bzw. Angriff gedrückt halten"><span>⚡</span><b>${this.staffLightningDamage()} Schaden</b><small>${this.staffBeamActive?'BLITZSTRAHL AKTIV':'BLITZATTACKE · HALTEN'}</small></div>`:'';
    this.hotbarElement.innerHTML=`${staffAttack}${equipped}<button data-mdc-use="berries"><span>●</span><b>${this.state.inventory.berries}</b><small>Beeren</small></button><button data-mdc-use="mushrooms"><span>🍄</span><b>${this.state.inventory.mushrooms}</b><small>Pilze</small></button><button data-mdc-use="cookedMeat"><span>🍖</span><b>${this.state.inventory.cookedMeat}</b><small>Fleisch</small></button><button data-mdc-use="water"><span>💧</span><b>${this.state.inventory.water}</b><small>Wasser</small></button><div><span>🪵</span><b>${this.state.inventory.logs}</b><small>Stämme</small></div><div><span>◆</span><b>${this.state.inventory.stone}</b><small>Stein</small></div><button data-mdc-use="medicine"><span>✚</span><b>${this.state.inventory.medicine}</b><small>Heilmittel</small></button><div><span>◉</span><b>${this.state.inventory.coins}</b><small>Münzen</small></div>`;
    const season=SEASONS[this.state.season],weather=WEATHER[this.state.weather];const hours=Math.floor(this.state.time),minutes=Math.floor((this.state.time-hours)*60);
    this.seasonLabel.textContent=`${season.icon} ${season.name}`;if(this.dayTimeLabel)this.dayTimeLabel.textContent=`Tag ${this.state.day} · ${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}`;this.weatherLabel.textContent=`${weather.icon} ${weather.name}`;
    this.compassLabel.textContent=this.compassDirection();
    this.drawMinimap();
  }

  compassDirection(){const a=((this.yaw%(Math.PI*2))+Math.PI*2)%(Math.PI*2);return ['N','NW','W','SW','S','SO','O','NO'][Math.round(a/(Math.PI/4))%8];}

  drawMinimap() {
    const canvas=this.minimap;if(!canvas||!this.player)return;const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='rgba(18,31,20,.88)';ctx.beginPath();ctx.arc(w/2,h/2,w*.48,0,Math.PI*2);ctx.fill();ctx.save();ctx.beginPath();ctx.arc(w/2,h/2,w*.46,0,Math.PI*2);ctx.clip();const range=125,scale=w/(range*2);const px=this.player.position.x,pz=this.player.position.z;
    ctx.strokeStyle='rgba(75,145,176,.8)';ctx.lineWidth=10;ctx.beginPath();for(let z=pz-range;z<=pz+range;z+=4){const x=riverCenter(z);const sx=w/2+(x-px)*scale,sy=h/2+(z-pz)*scale;if(z===pz-range)ctx.moveTo(sx,sy);else ctx.lineTo(sx,sy);}ctx.stroke();
    ctx.fillStyle='#d4b36c';ctx.font='bold 9px system-ui';for(const v of this.villages){const x=w/2+(v.x-px)*scale,y=h/2+(v.z-pz)*scale;if(x>0&&x<w&&y>0&&y<h){ctx.fillRect(x-3,y-3,6,6);if(this.state.discovered.includes(v.name)||Math.hypot(v.x-px,v.z-pz)<70){ctx.fillStyle='rgba(255,244,206,.92)';ctx.fillText(v.name,x+5,y-5);ctx.fillStyle='#d4b36c';}}}
    ctx.fillStyle='#d98b60';for(const hspot of this.hotspots){if(!['cave','mine','landmark','encounter'].includes(hspot.type))continue;const x=w/2+(hspot.x-px)*scale,y=h/2+(hspot.z-pz)*scale;if(x>0&&x<w&&y>0&&y<h){ctx.beginPath();ctx.arc(x,y,2.5,0,Math.PI*2);ctx.fill();}}
    ctx.fillStyle='#e8f2d0';for(const b of this.state.buildings){const x=w/2+(b.x-px)*scale,y=h/2+(b.z-pz)*scale;if(x>0&&x<w&&y>0&&y<h){ctx.fillRect(x-2,y-2,4,4);}}const lost=this.state.deathLoot;if(lost&&Date.now()<Number(lost.expiresAt||0)){const x=w/2+(Number(lost.x||0)-px)*scale,y=h/2+(Number(lost.z||0)-pz)*scale;if(x>0&&x<w&&y>0&&y<h){ctx.fillStyle='#c26cff';ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 8px system-ui';ctx.fillText(`${Math.round(Math.hypot(Number(lost.x||0)-px,Number(lost.z||0)-pz))}m`,x+7,y-5);}}
    ctx.translate(w/2,h/2);ctx.rotate(-this.yaw);ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(6,7);ctx.lineTo(0,4);ctx.lineTo(-6,7);ctx.closePath();ctx.fill();ctx.restore();ctx.strokeStyle='rgba(225,194,120,.85)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(w/2,h/2,w*.46,0,Math.PI*2);ctx.stroke();
  }

  setLoading(percent,text){if(this.loadingBar)this.loadingBar.style.width=`${clamp(percent,0,100)}%`;if(this.loadingText)this.loadingText.textContent=text||'';}
  setOnlineUi(state,text,count=1){const cls=state==='online'?'is-online':state==='offline'?'is-offline':'is-connecting';for(const el of [this.onlineCard,this.loadingOnline]){if(!el)continue;el.classList.remove('is-connecting','is-online','is-offline');el.classList.add(cls);}if(this.onlineCount)this.onlineCount.textContent=String(Math.min(4,Math.max(1,Math.floor(count||1))));if(this.onlineStatus)this.onlineStatus.textContent=text||'';}
  toast(message){clearTimeout(this.toastTimer);this.toastElement.textContent=message;this.toastElement.classList.add('show');this.toastTimer=setTimeout(()=>this.toastElement.classList.remove('show'),2800);}

presencePayload(online=true, compatibility=this.onlineCompatibilityMode) {
    const player=bridgeSnapshot(),disguised=this.isPublicPlayerMode(),publicAlias=String(this.state.ownerAppearance?.publicAlias||'Center Spieler').trim().slice(0,30)||'Center Spieler',publicGender=this.state.ownerAppearance?.publicGender==='female'?'female':'male',visibleStaffStyle=this.effectivePublicStaffStyle(),visibleStaffRole=this.effectivePublicStaffRole(),staffVisualClaim=!disguised&&visibleStaffStyle!=='player',vanished=!!(this.isStaffActive&&this.ownerFlags.vanish),skinTheme=staffVisualClaim?this.effectiveStaffSkinTheme():'none';
    const base={online:!!online&&!vanished,mapId:ONLINE_MAP_ID,sessionId:this.onlineSessionId,x:Number((this.player?.position.x||0).toFixed(3)),z:Number((this.player?.position.z||0).toFixed(3)),yaw:Number(this.yaw.toFixed(4)),bodyYaw:Number((this.modelPivot?.rotation.y||0).toFixed(4)),walking:!!this.walking,sprinting:!!this.sprinting,velocityX:Number((this.motionVelocityX||0).toFixed(3)),velocityY:Number((this.motionVelocityY||0).toFixed(3)),velocityZ:Number((this.motionVelocityZ||0).toFixed(3)),view:this.firstPerson?'first':'third',gender:disguised?publicGender:player.gender,firstName:disguised?publicAlias:player.firstName.slice(0,30),lastName:disguised?'':player.lastName.slice(0,30),level:player.level,slot:player.slot,ownerClaim:staffVisualClaim,updatedAtMs:Date.now(),leftAtMs:online?0:Date.now(),version:CENTER_VERSION};if(compatibility){const {sprinting,velocityX,velocityY,velocityZ,...legacy}=base;return {cottbus3D:legacy};}
    return {cottbus3D:{...base,mode:'center',y:Number((this.player?.position.y||0).toFixed(3)),staffRole:visibleStaffRole,staffStyle:visibleStaffStyle,staffSkinTheme:skinTheme,vanished,flying:!!(this.isStaffActive&&this.ownerFlags.fly),season:this.state.season,day:this.state.day,appearanceSkin:disguised?'normal':this.isStaffActive?this.state.ownerAppearance.skin:'normal',appearanceSize:disguised?1:this.isStaffActive&&this.staffCapabilities?.size?Number(this.state.ownerAppearance.size||1):1,heldItem:disguised?'none':this.isStaffActive?this.state.ownerAppearance.heldItem:'none',vehicle:disguised?'none':this.isStaffActive?this.state.ownerAppearance.vehicle:'none',ownerCape:!!(staffVisualClaim&&this.staffCapabilities?.ownerCosmetics&&this.state.ownerAppearance.cape),ownerCapeTheme:this.appearanceTheme('cape'),ownerHat:!!(staffVisualClaim&&this.staffCapabilities?.ownerCosmetics&&this.state.ownerAppearance.hat),ownerHatTheme:this.appearanceTheme('hat'),ownerAura:!!(staffVisualClaim&&this.staffCapabilities?.ownerCosmetics&&this.state.ownerAppearance.aura),ownerAuraTheme:this.appearanceTheme('aura'),heldItemTheme:this.appearanceTheme('heldItem'),staffShotTheme:normalizeStaffTheme(this.staffShotTheme||this.appearanceTheme('heldItem')),staffShotSeq:Math.max(0,Math.floor(Number(this.staffShotSeq)||0)),staffShotAtMs:Math.max(0,Math.floor(Number(this.staffShotAtMs)||0)),staffShotX:Number((this.staffShotEnd?.x||0).toFixed(3)),staffShotY:Number((this.staffShotEnd?.y||0).toFixed(3)),staffShotZ:Number((this.staffShotEnd?.z||0).toFixed(3))}};
  }

  async prepareMultiplayer(){
    const core=window.LifeBuilderFirebaseCore;
    if(!core?.load)return null;
    try{
      const fb=await core.load();
      const user=await core.waitForAuth?.(7000);
      return user?.uid?{fb,user}:null;
    }catch(error){
      if(!isFirebasePermissionError(error))console.warn('Center Firebase-Vorbereitung',error);
      return null;
    }
  }

  clearOnlineReconnect(){
    clearTimeout(this.onlineRetryTimer);
    this.onlineRetryTimer=0;
  }

  scheduleOnlineReconnect(message='Online-Verbindung wird wiederhergestellt.', delay=0){
    if(!this.opened||!this.state.world?.onlineEnabled||this.onlineConnected||this.onlineConnecting)return;
    this.clearOnlineReconnect();
    this.onlineRetryAttempt=Math.min(8,(this.onlineRetryAttempt||0)+1);
    const waitMs=delay>0?delay:Math.min(15000,1800+this.onlineRetryAttempt*1200);
    this.setOnlineUi('connecting',`${message} Neuer Versuch in ${Math.ceil(waitMs/1000)} s.`,1+this.remotePlayers.size);
    this.onlineRetryTimer=setTimeout(()=>{
      this.onlineRetryTimer=0;
      if(this.opened&&this.state.world?.onlineEnabled)this.connectMultiplayer().catch(()=>{});
    },waitMs);
  }

  handleOnlineListenerError(error){
    window.LifeBuilderFirebaseCore?.scheduleFirestoreRecovery?.(900,'center-online-listen-error');
    this.onlineConnected=false;
    this.onlineConnecting=false;
    clearInterval(this.onlineHeartbeatTimer);
    clearInterval(this.onlinePublishTimer);
    clearInterval(this.onlineRefreshTimer);
    this.onlineHeartbeatTimer=0;
    this.onlinePublishTimer=0;
    this.onlineRefreshTimer=0;
    this.onlineRefreshInFlight=false;
    try{this.onlineUnsubscribe?.();}catch{}
    this.onlineUnsubscribe=null;
    const permission=isFirebasePermissionError(error);
    if(permission&&!this.onlineCompatibilityMode)this.onlineCompatibilityMode=true;
    if(!permission)console.warn('Center-Online-Verbindung wurde unterbrochen',error);
    this.scheduleOnlineReconnect(permission?'Online bleibt aktiviert. Firebase-Zugriff wird erneut geprüft.':'Online bleibt aktiviert. Verbindung wurde kurz unterbrochen.');
  }

async connectMultiplayer(prepared=null) {
    if(!this.state.world?.onlineEnabled)return false;
    if(this.onlineConnected)return true;
    if(this.onlineConnecting)return false;
    this.clearOnlineReconnect();
    this.onlineConnecting=true;
    this.setOnlineUi('connecting','Online-Spieler werden geladen …',1+this.onlineRoster.size);
    try{
      const resolved=prepared||await this.prepareMultiplayer(),fb=resolved?.fb,user=resolved?.user;
      if(!fb||!user?.uid){this.onlineConnecting=false;this.scheduleOnlineReconnect('Online ist aktiviert. Anmeldung wird noch geladen.',3500);return false;}
      this.onlineFb=fb;this.onlineUser=user;
      this.onlineDocRef=fb.doc(fb.db,'playerProfiles',user.uid);
      this.onlinePresenceRef=fb.doc(fb.db,'centerPresenceV268',user.uid);
      this.onlinePresenceAvailable=false;
      await this.verifyLocalOwnerRole();
      this.onlineStaffPresenceRef=this.isStaffActive?fb.doc(fb.db,'centerStaffPresenceV270',user.uid):null;
      await this.publishPresence(true);

      // V270: Beide öffentlichen Presence-Quellen werden IMMER parallel gelesen.
      // Dadurch kann kein Spieler mehr einseitig verschwinden, nur weil sein Client
      // noch über playerProfiles sendet, während ein anderer schon centerPresenceV268 nutzt.
      this.presenceSourceDocs.clear();
      const unsubscribers=[];
      const attach=(source,query,privileged=false)=>{
        try{
          const unsub=fb.onSnapshot(query,(snapshot)=>{
            this.onlineConnected=true;this.onlineRetryAttempt=0;
            this.ingestPresenceSnapshot(source,snapshot,privileged).catch((error)=>console.warn(`Center-Presence ${source} konnte nicht verarbeitet werden`,error));
          },(error)=>{
            this.presenceSourceDocs.delete(source);
            this.rebuildMergedPresence().catch(()=>{});
            if(!isFirebasePermissionError(error))console.warn(`Center-Presence-Quelle ${source} wurde unterbrochen`,error);
          });
          unsubscribers.push(unsub);
        }catch(error){if(!isFirebasePermissionError(error))console.warn(`Center-Presence-Quelle ${source} konnte nicht gestartet werden`,error);}
      };

      // Owner/Admin lesen bewusst alle Einträge der aktuellen Center-Map und filtern
      // Online/Freshness anschließend lokal. Das ist robuster als ausschließlich auf
      // cottbus3D.online zu filtern und behebt einseitige Sichtbarkeit bei älteren Clients.
      const profileQuery=fb.query(fb.collection(fb.db,'playerProfiles'),fb.where('cottbus3D.mapId','==',ONLINE_MAP_ID));
      const dedicatedQuery=fb.query(fb.collection(fb.db,'centerPresenceV268'),fb.where('cottbus3D.mapId','==',ONLINE_MAP_ID));
      attach('profiles',profileQuery,false);
      attach('dedicated',dedicatedQuery,false);

      // Getrennter, rollenbasierter Vanish-Kanal. Owner sehen alle verschwundenen
      // Teammitglieder; Admins nur Owner/Admin. Moderatoren/Supporter erhalten
      // diesen Kanal überhaupt nicht.
      if(this.activeStaffRole==='owner'){
        attach('staff',fb.query(fb.collection(fb.db,'centerStaffPresenceV270')),true);
      }else if(this.activeStaffRole==='admin'){
        attach('staff',fb.query(fb.collection(fb.db,'centerStaffPresenceV270'),fb.where('role','in',['owner','admin'])),true);
      }

      try{this.onlineUnsubscribe?.();}catch{}
      this.onlineUnsubscribe=()=>{for(const unsub of unsubscribers)try{unsub?.();}catch{}};

      clearInterval(this.onlineHeartbeatTimer);clearInterval(this.onlinePublishTimer);clearInterval(this.onlineRefreshTimer);
      this.onlineHeartbeatTimer=setInterval(()=>this.publishPresence(true).catch((error)=>this.handleOnlineListenerError(error)),ONLINE_HEARTBEAT_MS);
      this.onlinePublishTimer=setInterval(()=>this.publishPresence(false).catch((error)=>this.handleOnlineListenerError(error)),ONLINE_WRITE_INTERVAL_MS);
      this.onlineRefreshTimer=setInterval(()=>{
        const now=Date.now();
        for(const sourceMap of this.presenceSourceDocs.values())for(const [uid,entry] of sourceMap)if(now-Number(entry.updated||0)>52000)sourceMap.delete(uid);
        this.rebuildMergedPresence().catch(()=>{});
      },5000);
      this.onlineConnected=true;this.onlineConnecting=false;this.onlineRetryAttempt=0;
      this.setOnlineUi('online','Online verbunden.',1+this.onlineRoster.size);
      return true;
    }catch(error){
      const permission=isFirebasePermissionError(error);
      if(permission&&!this.onlineCompatibilityMode){this.onlineCompatibilityMode=true;this.onlineConnecting=false;this.setOnlineUi('connecting','Online bleibt aktiviert. Kompatibler Verbindungsmodus wird gestartet.',1+this.onlineRoster.size);this.scheduleOnlineReconnect('Kompatibler Online-Modus wird verbunden.',650);return false;}
      if(!permission)console.warn('Center-Online-Verbindung konnte nicht gestartet werden',error);
      this.onlineConnected=false;this.onlineConnecting=false;this.ownerVerificationChecked=false;this.ownerVerifiedByFirebase=false;this.updateRoleHud();
      this.scheduleOnlineReconnect(permission?'Online bleibt aktiviert. Firebase-Berechtigung wird erneut geprüft.':'Online bleibt aktiviert. Verbindung wird erneut hergestellt.');
      return false;
    }
  }

  async publishPresence(force=false){
    if(!this.opened||!this.state.world?.onlineEnabled||!this.onlineFb||!this.onlineDocRef||!this.player)return false;if(this.presenceWriteInFlight){this.presenceWriteQueued=true;return false;}
    const now=Date.now();let payload=this.presencePayload(true),live=payload.cottbus3D;const key=`${Number(live.x||0).toFixed(2)}|${Number(live.y||0).toFixed(2)}|${Number(live.z||0).toFixed(2)}|${Number(live.bodyYaw||0).toFixed(2)}|${!!live.walking}|${!!live.sprinting}|${Number(live.velocityX||0).toFixed(1)}|${Number(live.velocityY||0).toFixed(1)}|${Number(live.velocityZ||0).toFixed(1)}|${!!live.vanished}|${!!live.flying}|${live.staffStyle||'player'}|${live.staffSkinTheme||'none'}|${live.appearanceSkin||'normal'}|${live.heldItem||'none'}|${live.heldItemTheme||'owner'}|${live.vehicle||'none'}|${!!live.ownerAura}|${live.ownerAuraTheme||'owner'}|${!!live.ownerCape}|${live.ownerCapeTheme||'owner'}|${!!live.ownerHat}|${live.ownerHatTheme||'owner'}|${Number(live.staffShotSeq||0)}`;
    if(!force&&(now-this.lastPresenceWriteAt<ONLINE_WRITE_INTERVAL_MS||key===this.lastPresenceKey))return false;this.presenceWriteInFlight=true;
    try{
      const jobs=[];let dedicatedOk=false,profileOk=false,staffOk=false;
      if(this.onlinePresenceRef&&!this.onlineCompatibilityMode){const dedicated=this.presencePayload(true,false);jobs.push(this.onlineFb.setDoc(this.onlinePresenceRef,{cottbus3D:dedicated.cottbus3D},{merge:false}).then(()=>{dedicatedOk=true;this.onlinePresenceAvailable=true;}).catch((error)=>{this.onlinePresenceAvailable=false;if(!isFirebasePermissionError(error))console.warn('Center-Präsenzkanal konnte nicht geschrieben werden; Profil-Fallback bleibt aktiv.',error);}));}
      const writeProfile=force||!this.onlinePresenceAvailable||now-this.lastProfilePresenceWriteAt>2500;if(writeProfile){jobs.push(this.onlineFb.setDoc(this.onlineDocRef,payload,{merge:true}).then(()=>{profileOk=true;this.lastProfilePresenceWriteAt=Date.now();}).catch(async(error)=>{if(!this.onlineCompatibilityMode&&isFirebasePermissionError(error)){this.onlineCompatibilityMode=true;const legacy=this.presencePayload(true,true);await this.onlineFb.setDoc(this.onlineDocRef,legacy,{merge:true});profileOk=true;this.lastProfilePresenceWriteAt=Date.now();}else if(!isFirebasePermissionError(error))console.warn('Center-Profilpresence konnte nicht geschrieben werden',error);}));}
      const vanished=!!live.vanished,writeStaff=this.onlineStaffPresenceRef&&this.isStaffActive&&(vanished||force||now-this.lastStaffPresenceWriteAt>1400);if(writeStaff){const staffPayload=this.presencePayload(true,false);jobs.push(this.onlineFb.setDoc(this.onlineStaffPresenceRef,{role:this.activeStaffRole,cottbus3D:staffPayload.cottbus3D},{merge:false}).then(()=>{staffOk=true;this.lastStaffPresenceWriteAt=Date.now();}).catch((error)=>{if(!isFirebasePermissionError(error))console.warn('Center-Staff-Vanish-Presence konnte nicht geschrieben werden',error);}));}
      if(jobs.length)await Promise.allSettled(jobs);if(dedicatedOk||profileOk||staffOk||!jobs.length){this.lastPresenceWriteAt=Date.now();this.lastPresenceKey=key;return true;}return false;
    }finally{this.presenceWriteInFlight=false;if(this.presenceWriteQueued&&this.opened&&this.onlineConnected){this.presenceWriteQueued=false;queueMicrotask(()=>this.publishPresence(false).catch(()=>{}));}}
  }

  async disconnectMultiplayer(userInitiated=false){
    if(userInitiated)this.clearOnlineReconnect();
    clearInterval(this.onlineHeartbeatTimer);clearInterval(this.onlinePublishTimer);clearInterval(this.onlineRefreshTimer);
    this.onlineHeartbeatTimer=0;this.onlinePublishTimer=0;this.onlineRefreshTimer=0;this.onlineRefreshInFlight=false;
    try{this.onlineUnsubscribe?.();}catch{}this.onlineUnsubscribe=null;
    const fb=this.onlineFb,ref=this.onlineDocRef;
    this.onlineConnected=false;this.onlineConnecting=false;
    for(const uid of [...this.remotePlayers.keys()])this.removeRemotePlayer(uid);
    this.onlineRoster.clear();this.presenceSourceDocs.clear();
    if(fb&&ref){
      const payload=this.presencePayload(false,this.onlineCompatibilityMode);payload.cottbus3D.leftAtMs=Date.now();
      try{await fb.setDoc(ref,payload,{merge:true});}catch{}
      if(this.onlinePresenceRef)try{await fb.setDoc(this.onlinePresenceRef,{cottbus3D:payload.cottbus3D},{merge:false});}catch{}
      if(this.onlineStaffPresenceRef&&this.isStaffActive)try{const staffPayload=this.presencePayload(false,false);staffPayload.cottbus3D.leftAtMs=Date.now();await fb.setDoc(this.onlineStaffPresenceRef,{role:this.activeStaffRole,cottbus3D:staffPayload.cottbus3D},{merge:false});}catch{}
    }
    this.onlineFb=null;this.onlineUser=null;this.onlineDocRef=null;this.onlinePresenceRef=null;this.onlineStaffPresenceRef=null;this.onlinePresenceAvailable=false;
    this.ownerVerificationChecked=false;this.ownerVerifiedByFirebase=false;this.verifiedStaffRole='player';this.verifiedStaffRoleRaw='player';this.updateRoleHud();this.lastPresenceKey='';
    this.setOnlineUi('offline',userInitiated?'Online ausgeschaltet.':'Online-Verbindung beendet.',1);
  }

  async ingestPresenceSnapshot(source,snapshot,privileged=false){
    const map=new Map();
    for(const docSnap of snapshot?.docs||[]){
      const uid=docSnap.id,data=docSnap.data?.()||{},baseLive=data.cottbus3D||{},live={...baseLive},updated=Number(live.updatedAtMs||0);
      if(!uid||!updated)continue;
      if(privileged){
        const realRole=canonicalStaffRole(data.role||'player');
        live.__realStaffRole=realRole;
        live.__realStaffDetailRole=detailedStaffRole(data.role||realRole);
        live.__viewerCanSeeVanish=this.canSeeVanishedStaffRole(realRole);
      }
      map.set(uid,{uid,data,live,updated,source,privileged,realRole:canonicalStaffRole(data.role||live.staffRole||'player'),realDetailRole:detailedStaffRole(data.role||live.staffStyle||live.staffRole||'player')});
    }
    this.presenceSourceDocs.set(source,map);
    await this.rebuildMergedPresence();
  }

  async rebuildMergedPresence(){
    if(this.presenceRebuildInFlight){this.presenceRebuildQueued=true;return;}if(!this.opened||!this.player)return;this.presenceRebuildInFlight=true;
    try{const ownUid=this.onlineUser?.uid||'',now=Date.now(),merged=new Map();

    for(const [source,sourceMap] of this.presenceSourceDocs){
      for(const [uid,entry] of sourceMap){
        if(!uid||uid===ownUid)continue;
        const live=entry.live||{},updated=Number(entry.updated||live.updatedAtMs||0),sameCenter=live.mapId===ONLINE_MAP_ID||live.mode==='center';
        if(!sameCenter||!updated||now-updated>52000)continue;
        const isPrivilegedVanish=!!(entry.privileged&&live.vanished&&live.__viewerCanSeeVanish);
        if(live.vanished&&!isPrivilegedVanish)continue;
        const freshOfflineGrace=!live.vanished&&!live.online&&Number(live.leftAtMs||0)===0&&now-updated<Math.max(4200,ONLINE_HEARTBEAT_MS+1200);
        if(!live.vanished&&!live.online&&!freshOfflineGrace)continue;
        const previous=merged.get(uid);
        // Ein berechtigter Staff-Vanish-Eintrag gewinnt immer gegen einen älteren
        // öffentlichen "online"-Rest. Ansonsten gewinnt schlicht der neueste Stand.
        if(!previous||isPrivilegedVanish&&!previous.isPrivilegedVanish||updated>previous.updated||(updated===previous.updated&&source==='dedicated')){
          merged.set(uid,{...entry,isPrivilegedVanish});
        }
      }
    }

    const candidates=[],roster=new Map();
    for(const [uid,entry] of merged){
      const live={...(entry.live||{})};live.__viewerCanSeeVanish=!!entry.isPrivilegedVanish;live.__realStaffRole=entry.live?.__realStaffRole||entry.realRole||'player';live.__realStaffDetailRole=entry.live?.__realStaffDetailRole||entry.realDetailRole||live.__realStaffRole;
      const x=Number(live.x||0),y=Number.isFinite(Number(live.y))?Number(live.y):terrainHeightAt(x,Number(live.z||0)),z=Number(live.z||0);
      const name=String(`${live.firstName||''} ${live.lastName||''}`.trim()||entry.data?.displayName||'Spieler').slice(0,44);
      const dx=x-this.player.position.x,dz=z-this.player.position.z,dist2=dx*dx+dz*dz;
      const item={uid,data:entry.data,live,updated:entry.updated,dist2,name,x,y,z,vanished:!!live.vanished,realStaffRole:canonicalStaffRole(live.__realStaffRole||live.staffRole),realStaffDetailRole:detailedStaffRole(live.__realStaffDetailRole||live.staffStyle||live.staffRole)};
      roster.set(uid,item);candidates.push(item);
    }
    this.onlineRoster=roster;

    candidates.sort((a,b)=>a.dist2-b.dist2||b.updated-a.updated);
    const selected=candidates.slice(0,this.maxVisibleRemotePlayers()),active=new Set(selected.map((entry)=>entry.uid));
    await Promise.allSettled(selected.map(({uid,data,live})=>this.upsertRemotePlayer(uid,data,live)));
    for(const uid of [...this.remotePlayers.keys()])if(!active.has(uid)){const remote=this.remotePlayers.get(uid);if(!remote)continue;if(!remote.missingSince)remote.missingSince=now;if(now-remote.missingSince>ONLINE_REMOTE_GRACE_MS)this.removeRemotePlayer(uid);}else{const remote=this.remotePlayers.get(uid);if(remote)remote.missingSince=0;}

    this.setOnlineUi(this.onlineConnected?'online':'connecting',`${1+this.onlineRoster.size} Spieler im Center.`,1+this.onlineRoster.size);if(this.ownerPanel?.classList.contains('is-open')&&this.isStaffActive)this.renderOwnerMenu();
    }finally{this.presenceRebuildInFlight=false;if(this.presenceRebuildQueued){this.presenceRebuildQueued=false;queueMicrotask(()=>this.rebuildMergedPresence().catch(()=>{}));}}
  }

  // Altaufrufe bleiben kompatibel; intern wird alles in den V270-Merge eingespeist.
  async applyPresenceSnapshot(snapshot){return this.ingestPresenceSnapshot('legacy',snapshot,false);}

async verifiedRemoteSkin(uid,live){
    const gender=live.gender==='female'?'female':'male',claimedStyle=String(live.staffStyle||live.staffRole||'player').toLowerCase();let actualDetail='player';const privilegedDetail=detailedStaffRole(live.__realStaffDetailRole||'');
    if(privilegedDetail!=='player')actualDetail=privilegedDetail;else{const cached=this.remoteRoleCache.get(uid);if(cached&&Date.now()-cached.checkedAt<120000)actualDetail=cached.detailRole||detailedStaffRole(cached.role);else if(this.onlineFb)try{const snap=await this.onlineFb.getDoc(this.onlineFb.doc(this.onlineFb.db,'staffRoles',uid));actualDetail=detailedStaffRole(snap.exists()?snap.data()?.role:'player');this.remoteRoleCache.set(uid,{role:canonicalStaffRole(actualDetail),detailRole:actualDetail,checkedAt:Date.now()});}catch{actualDetail='player';}}
    const actualRole=canonicalStaffRole(actualDetail);let visibleStyle='player';if(actualDetail==='owner'&&['owner','admin','moderator','supporter','player'].includes(claimedStyle))visibleStyle=claimedStyle;else if(actualDetail==='admin')visibleStyle=claimedStyle==='player'?'player':'admin';else if(actualDetail==='moderator'||actualDetail==='testmoderator')visibleStyle='moderator';else if(actualDetail==='supporter')visibleStyle='supporter';else if(actualDetail==='testsupporter'||actualDetail==='testmember')visibleStyle='member';
    return {skin:visibleStyle==='player'?gender:'owner',role:visibleStyle,actualRole,actualDetailRole:actualDetail};
  }

async upsertRemotePlayer(uid,profile,live){
    let remote=this.remotePlayers.get(uid);const existed=!!remote,previousAppearance=remote?.appearanceSkin||'',name=String(`${live.firstName||''} ${live.lastName||''}`.trim()||profile.displayName||'Spieler').slice(0,44),level=Math.max(0,Math.floor(Number(live.level||0)));
    if(!remote){const group=new THREE.Group(),pivot=new THREE.Group();group.add(pivot);group.position.set(Number(live.x||0),Number.isFinite(Number(live.y))?Number(live.y):terrainHeightAt(Number(live.x||0),Number(live.z||0)),Number(live.z||0));const label=this.makeLabel(name,`LEVEL ${level} · ONLINE`);label.position.y=2.4;group.add(label);this.scene.add(group);remote={uid,group,pivot,label,name,skin:'',staffVisualRole:'player',mixer:null,cape:null,hat:null,aura:null,formObject:null,vehicleObject:null,heldObject:null,heldAnchor:null,renderedHeldItem:'',renderedAppearanceSkin:'',renderedVehicle:'',lastVisualKey:'',lastFormKey:'',lastCosmeticKey:'',lastHeldKey:'',lastMaterialThemeKey:'',targetX:Number(live.x||0),targetY:Number(live.y||0),targetZ:Number(live.z||0),targetYaw:Number(live.bodyYaw??live.yaw??0),walking:!!live.walking,sprinting:!!live.sprinting,flying:!!live.flying,vanished:!!live.vanished,velocityX:Number(live.velocityX||0),velocityY:Number(live.velocityY||0),velocityZ:Number(live.velocityZ||0),verticalVelocity:Number(live.velocityY||0),lastSnapshotReceivedAt:performance.now(),lastSeenAt:Date.now(),sourceUpdatedAt:Number(live.updatedAtMs||Date.now()),lastShotSeq:0,staffBeamVisual:null,staffBeamUntil:0,staffBeamEnd:new THREE.Vector3(),staffBeamTheme:'owner',modelInstallToken:0,modelInstallPromise:null,pendingSkin:'',missingSince:0};this.remotePlayers.set(uid,remote);}else if(remote.name!==name){remote.label?.removeFromParent?.();remote.label?.material?.map?.dispose?.();remote.label?.material?.dispose?.();remote.label=this.makeLabel(name,`LEVEL ${level} · ONLINE`);remote.label.position.y=2.4;remote.group.add(remote.label);remote.name=name;}
    remote.appearanceSkin=['shadow','oaura','galaxy'].includes(String(live.appearanceSkin||''))?'normal':String(live.appearanceSkin||'normal');if(existed&&previousAppearance&&previousAppearance!==remote.appearanceSkin)this.spawnTransformationEffectAt(remote.group.position,true);remote.staffSkinTheme=normalizeStaffTheme(live.staffSkinTheme||(String(live.appearanceSkin||'')==='galaxy'?'owner':'none'),true);remote.vehicle=String(live.vehicle||'none');remote.heldItem=String(live.heldItem||'none');remote.appearanceSize=clamp(Number(live.appearanceSize)||1,.45,2.5);remote.ownerAura=!!live.ownerAura;remote.ownerAuraTheme=normalizeStaffTheme(live.ownerAuraTheme||'owner');remote.ownerCape=!!live.ownerCape;remote.ownerCapeTheme=normalizeStaffTheme(live.ownerCapeTheme||'owner');remote.ownerHat=!!live.ownerHat;remote.ownerHatTheme=normalizeStaffTheme(live.ownerHatTheme||'owner');remote.heldItemTheme=normalizeStaffTheme(live.heldItemTheme||'owner');remote.staffShotTheme=normalizeStaffTheme(live.staffShotTheme||'owner');remote.viewerCanSeeVanish=!!live.__viewerCanSeeVanish;
    const nextSeen=Number(live.updatedAtMs||Date.now()),nextY=Number(live.y||terrainHeightAt(Number(live.x||0),Number(live.z||0))),remoteDt=Math.max(.08,(nextSeen-Number(remote.sourceUpdatedAt||nextSeen))/1000);remote.verticalVelocity=Number.isFinite(Number(live.velocityY))?clamp(Number(live.velocityY),-200,200):(nextY-Number(remote.targetY??nextY))/remoteDt;remote.velocityX=clamp(Number(live.velocityX)||0,-200,200);remote.velocityY=remote.verticalVelocity;remote.velocityZ=clamp(Number(live.velocityZ)||0,-200,200);remote.targetX=clamp(live.x,this.worldBounds.minX,this.worldBounds.maxX);remote.targetY=nextY;remote.targetZ=clamp(live.z,this.worldBounds.minZ,this.worldBounds.maxZ);remote.targetYaw=Number(live.bodyYaw??live.yaw??0);remote.walking=!!live.walking;remote.sprinting=!!live.sprinting;remote.flying=!!live.flying;remote.vanished=!!live.vanished;remote.sourceUpdatedAt=nextSeen;remote.lastSnapshotReceivedAt=performance.now();remote.lastSeenAt=Date.now();remote.pivot.scale.setScalar(remote.appearanceSize);
    const identity=await this.verifiedRemoteSkin(uid,live);remote.staffVisualRole=identity.role;remote.realStaffRole=identity.actualRole||'player';remote.realStaffDetailRole=identity.actualDetailRole||identity.actualRole||'player';remote.ownerVisual=identity.role!=='player';if(remote.skin!==identity.skin)await this.installRemoteModel(remote,identity.skin);const shotSeq=Math.max(0,Math.floor(Number(live.staffShotSeq)||0)),shotAt=Number(live.staffShotAtMs||0);if(shotSeq>Number(remote.lastShotSeq||0)){remote.lastShotSeq=shotSeq;if(shotAt>0&&Date.now()-shotAt<900&&remote.staffVisualRole!=='player'&&remote.heldItem==='staff'){remote.staffBeamUntil=Date.now()+320;remote.staffBeamTheme=remote.staffShotTheme;remote.staffBeamEnd.set(Number(live.staffShotX||remote.group.position.x),Number(live.staffShotY||remote.group.position.y+1.45),Number(live.staffShotZ||remote.group.position.z));}else remote.staffBeamUntil=0;}const formKey=`${remote.skin}|${remote.staffVisualRole}|${remote.appearanceSkin}|${remote.vehicle}|${remote.appearanceSize.toFixed(2)}|${remote.vanished?1:0}|${remote.viewerCanSeeVanish?1:0}`,cosmeticKey=`${remote.staffVisualRole}|${remote.staffSkinTheme}|${remote.appearanceSkin}|${remote.vehicle}|${remote.ownerAura?1:0}|${remote.ownerAuraTheme}|${remote.ownerCape?1:0}|${remote.ownerCapeTheme}|${remote.ownerHat?1:0}|${remote.ownerHatTheme}|${remote.vanished?1:0}|${remote.viewerCanSeeVanish?1:0}|${this.remoteCosmeticTier()}`,heldKey=`${remote.staffVisualRole}|${remote.heldItem}|${remote.heldItemTheme}|${remote.vehicle}|${remote.appearanceSkin}|${remote.vanished?1:0}|${remote.viewerCanSeeVanish?1:0}`;if(remote.lastFormKey!==formKey){this.applyRemoteFormAndVehicle(remote);remote.lastFormKey=formKey;remote.lastCosmeticKey='';remote.lastHeldKey='';}if(remote.lastCosmeticKey!==cosmeticKey){this.applyRemoteOwnerAura(remote);remote.lastCosmeticKey=cosmeticKey;}if(remote.lastHeldKey!==heldKey){this.applyRemoteHeldItem(remote);remote.lastHeldKey=heldKey;}remote.lastVisualKey=`${formKey}|${cosmeticKey}|${heldKey}`;remote.group.visible=!remote.vanished||remote.viewerCanSeeVanish;remote.missingSince=0;
  }

  async remoteTemplate(skin){if(this.remoteModelCache.has(skin))return this.remoteModelCache.get(skin);const promise=(async()=>{const gltf=await this.gltfLoader.loadAsync(MODEL_PATHS[skin]||MODEL_PATHS.male);const root=gltf.scene;root.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(root),height=Math.max(.01,box.max.y-box.min.y);root.scale.multiplyScalar((skin==='owner'?1.86:1.76)/height);root.updateMatrixWorld(true);const scaled=new THREE.Box3().setFromObject(root),center=scaled.getCenter(new THREE.Vector3());root.position.x-=center.x;root.position.z-=center.z;root.position.y-=scaled.min.y-.035;root.rotation.y=CHARACTER_MODEL_YAW;let runAnimations=[];if(RUN_MODEL_PATHS[skin])try{const run=await this.gltfLoader.loadAsync(RUN_MODEL_PATHS[skin]);runAnimations=run.animations||[];}catch{}return{root,animations:gltf.animations||[],runAnimations};})();this.remoteModelCache.set(skin,promise);try{return await promise;}catch(e){this.remoteModelCache.delete(skin);throw e;}}

  collectRemotePoseBones(root){
    const all=[];root?.traverse?.((object)=>{if(object?.isBone){object.userData.__centerRemoteBaseQuaternion=object.quaternion.clone();object.userData.__centerRemoteBasePosition=object.position.clone();all.push(object);}});const find=(pattern)=>all.find((bone)=>pattern.test(bone.name||'')),result={all,
      upperRight:find(/(?:a r m_up_R|right(?:upper)?arm|upperarm.*right|bip R UpperArm|mixamorig:RightArm)/i),lowerRight:find(/(?:a r m_dawn_R|right.*forearm|forearm.*right|bip R Forearm|mixamorig:RightForeArm)/i),
      upperLeft:find(/(?:a r m_up_L|left(?:upper)?arm|upperarm.*left|bip L UpperArm|mixamorig:LeftArm)/i),lowerLeft:find(/(?:a r m_dawn_L|left.*forearm|forearm.*left|bip L Forearm|mixamorig:LeftForeArm)/i),
      shoulderRight:find(/(?:shoulder_R|right.*shoulder|bip R Clavicle|mixamorig:RightShoulder)/i),shoulderLeft:find(/(?:shoulder_L|left.*shoulder|bip L Clavicle|mixamorig:LeftShoulder)/i),
      upperLegRight:find(/(?:thigh.*r|right.*thigh|right.*upleg|bip R Thigh|mixamorig:RightUpLeg|leg_up_R)/i),lowerLegRight:find(/(?:calf.*r|right.*calf|right.*leg|bip R Calf|mixamorig:RightLeg|leg_dawn_R)/i),
      upperLegLeft:find(/(?:thigh.*l|left.*thigh|left.*upleg|bip L Thigh|mixamorig:LeftUpLeg|leg_up_L)/i),lowerLegLeft:find(/(?:calf.*l|left.*calf|left.*leg|bip L Calf|mixamorig:LeftLeg|leg_dawn_L)/i),
      chest:find(/(?:^chest|spine_?2|upperchest)/i),neck:find(/(?:^neck|neck_)/i),head:find(/(?:^head|head_)/i),handRight:find(/(?:right.*hand|hand.*right|bip R Hand|mixamorig:RightHand|hand_R)/i)
    };
    const set=(bone,rot)=>{if(!bone?.userData.__centerRemoteBaseQuaternion)return;bone.userData.__centerRemoteIdleQuaternion=bone.userData.__centerRemoteBaseQuaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(rot.x||0,rot.y||0,rot.z||0)));};
    set(result.upperRight,{x:.025,y:.018,z:1.49});set(result.upperLeft,{x:.025,y:-.018,z:-1.49});set(result.lowerRight,{x:-.075,y:-.012,z:.025});set(result.lowerLeft,{x:-.075,y:.012,z:-.025});set(result.shoulderRight,{z:.01});set(result.shoulderLeft,{z:-.01});set(result.chest,{x:.01});set(result.neck,{x:.01});set(result.head,{x:.01});return result;
  }


  applyRemoteIdlePose(remote,delta=.016,instant=false){
    const bones=remote?.bones;if(!bones)return;const alpha=instant?1:1-Math.exp(-Math.max(.001,delta)*4.5),now=performance.now(),breathe=Math.sin(now*.00155+remote.uid.length)*.018,look=Math.sin(now*.00057+remote.uid.length*.21)*.12;
    for(const bone of bones.all||[]){const q=bone.userData.__centerRemoteIdleQuaternion||bone.userData.__centerRemoteBaseQuaternion,p=bone.userData.__centerRemoteBasePosition;if(q)bone.quaternion.slerp(q,alpha);if(p)bone.position.lerp(p,alpha);}
    if(bones.chest){bones.chest.rotateX(breathe);bones.chest.rotateY(look*.18);}if(bones.neck)bones.neck.rotateY(look*.42);if(bones.head){bones.head.rotateY(look*.62);bones.head.rotateX(Math.sin(now*.00041+remote.uid.length)*.025);}if(bones.upperRight)bones.upperRight.rotateX(Math.sin(now*.00115)*.018);if(bones.upperLeft)bones.upperLeft.rotateX(-Math.sin(now*.00115)*.018);
  }

  applyRemoteSpecialPose(remote,delta=.016,airborne=false){
    const bones=remote?.bones;if(!bones)return;const alpha=1-Math.exp(-Math.max(.001,delta)*8),q=(bone,euler)=>{if(!bone?.userData.__centerRemoteBaseQuaternion)return;const target=bone.userData.__centerRemoteBaseQuaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(euler.x||0,euler.y||0,euler.z||0)));bone.quaternion.slerp(target,alpha);};
    if(remote.flying){q(bones.upperRight,{x:-.18,z:-.12});q(bones.upperLeft,{x:-.18,z:.12});q(bones.lowerRight,{x:-.08});q(bones.lowerLeft,{x:-.08});q(bones.upperLegRight,{x:-.24});q(bones.lowerLegRight,{x:.48});q(bones.upperLegLeft,{x:.04});q(bones.lowerLegLeft,{x:.06});q(bones.chest,{x:-.05});}
    else if(airborne){q(bones.upperRight,{x:-.16,z:-.16});q(bones.upperLeft,{x:-.16,z:.16});q(bones.upperLegRight,{x:-.28});q(bones.lowerLegRight,{x:.5});q(bones.upperLegLeft,{x:-.2});q(bones.lowerLegLeft,{x:.4});q(bones.chest,{x:.025});}
  }

  async installRemoteModel(remote,skin){
    if(!remote)return;if(remote.skin===skin&&remote.model)return;if(remote.pendingSkin===skin&&remote.modelInstallPromise)return remote.modelInstallPromise;const token=(remote.modelInstallToken||0)+1;remote.modelInstallToken=token;remote.pendingSkin=skin;
    const task=(async()=>{let template=null,fallback=null;try{template=await this.remoteTemplate(skin);}catch{fallback=this.makeFallbackCharacter(skin);}if(token!==remote.modelInstallToken||!this.remotePlayers.has(remote.uid))return;
      remote.mixer?.stopAllAction?.();remote.vehicleObject?.userData?.mixer?.stopAllAction?.();this.disposeGeneratedVisual(remote.cape);this.disposeGeneratedVisual(remote.hat);this.disposeGeneratedVisual(remote.aura);this.disposeGeneratedVisual(remote.formObject);this.disposeGeneratedVisual(remote.vehicleObject);this.disposeGeneratedVisual(remote.heldObject);this.disposeGeneratedVisual(remote.staffBeamVisual);remote.staffBeamVisual=null;remote.heldAnchor?.removeFromParent?.();this.disposeClonedModelMaterials(remote.model);remote.pivot.clear();remote.mixer=null;remote.action=null;remote.walkAction=null;remote.runAction=null;remote.activeAction=null;remote.wasWalking=false;remote.model=null;remote.bones=null;remote.aura=null;remote.cape=null;remote.hat=null;remote.formObject=null;remote.vehicleObject=null;remote.heldObject=null;remote.heldAnchor=null;remote.renderedHeldItem='';remote.renderedAppearanceSkin='';remote.renderedVehicle='';remote.lastVisualKey='';remote.lastFormKey='';remote.lastCosmeticKey='';remote.lastHeldKey='';remote.lastMaterialThemeKey='';
      if(template){const model=cloneSkeleton(template.root);model.traverse((object)=>{if(object.isMesh&&object.material)object.material=Array.isArray(object.material)?object.material.map((m)=>m.clone()):object.material.clone();});remote.model=model;remote.bones=this.collectRemotePoseBones(model);remote.pivot.add(model);const walk=this.selectLocomotionClip(template.animations),runSource=this.selectLocomotionClip(template.runAnimations||[]),run=this.retargetLocomotionClip(runSource,model,'remote-run');if(walk||run){remote.mixer=new THREE.AnimationMixer(model);if(walk){remote.walkAction=remote.mixer.clipAction(walk);remote.walkAction.play();remote.walkAction.paused=true;remote.action=remote.walkAction;}if(run){remote.runAction=remote.mixer.clipAction(run);remote.runAction.play();remote.runAction.paused=true;}remote.mixer.update(0);this.applyRemoteIdlePose(remote,.016,true);}}else{remote.model=fallback||this.makeFallbackCharacter(skin);remote.pivot.add(remote.model);}remote.skin=skin;this.applyRemoteOwnerAura(remote);
    })();remote.modelInstallPromise=task;try{return await task;}finally{if(remote.modelInstallToken===token){remote.modelInstallPromise=null;remote.pendingSkin='';}}
  }

  applyRemoteFormAndVehicle(remote) {
    if(!remote?.model)return;const hidden=!!(remote.vanished&&!remote.viewerCanSeeVanish),visibleForms=['ball','crystal','bush','tree','rock','grass',...ANIMAL_FORM_IDS],appearance=visibleForms.includes(remote.appearanceSkin)?remote.appearanceSkin:['normal','galaxy'].includes(remote.appearanceSkin)?remote.appearanceSkin:'normal',vehicle=['scooter','plane'].includes(remote.vehicle)?remote.vehicle:'none';
    if(remote.renderedAppearanceSkin!==appearance){this.disposeGeneratedVisual(remote.formObject);remote.formObject=null;remote.renderedAppearanceSkin=appearance;if(visibleForms.includes(appearance)){const form=this.createOwnerForm(appearance);if(form){remote.pivot.add(form);remote.formObject=form;}}}
    if(remote.model)remote.model.visible=!remote.formObject&&!hidden;
    if(remote.renderedVehicle!==vehicle){this.disposeGeneratedVisual(remote.vehicleObject);remote.vehicleObject=null;remote.renderedVehicle=vehicle;if(vehicle==='scooter'&&!remote.formObject){const scooter=this.createScooterVisual();if(scooter){remote.pivot.add(scooter);remote.vehicleObject=scooter;}}else if(vehicle==='plane'&&!remote.formObject){const plane=this.createStaffPlaneVisual();if(plane){remote.pivot.add(plane);remote.vehicleObject=plane;}}}
    if(remote.model){remote.model.position.y=remote.vehicleObject?.08:0;remote.model.visible=!remote.formObject&&!hidden&&vehicle!=='plane';}
    if(remote.vehicleObject)remote.vehicleObject.visible=!hidden;
    if(remote.formObject)remote.formObject.visible=!hidden;
  }

  updateRemoteAnimalForm(remote,delta=.016){
    const form=remote?.formObject;if(!form||!ANIMAL_FORM_IDS.includes(form.userData.kind))return;const mixer=form.userData.mixer,idle=form.userData.idleAction,move=form.userData.moveAction,wantsMove=form.userData.kind==='owl'?(remote.flying||remote.walking):remote.walking,singleMove=!!form.userData.singleMoveAction;if(mixer){if(singleMove&&move){if(wantsMove){move.enabled=true;move.paused=false;}else{move.paused=true;move.time=0;}}else if(move&&idle&&move!==idle){if(wantsMove&&!move.enabled){idle.fadeOut(.18);move.enabled=true;move.reset().fadeIn(.18).play();}else if(!wantsMove&&move.enabled){move.fadeOut(.2);move.enabled=false;idle.reset().fadeIn(.2).play();}}mixer.update(delta);}this.applyProceduralAnimalWalk(form.userData.animalVisual||form,wantsMove,delta);if(form.userData.kind==='owl'&&remote.flying){form.rotation.x=-.12;form.rotation.z=Math.sin(performance.now()*.002)*.04;}else{form.rotation.x*=Math.exp(-delta*8);form.rotation.z*=Math.exp(-delta*8);}
  }


  createCheapRemoteWings(theme='owner'){
    theme=normalizeStaffTheme(theme);const cfg=staffThemeConfig(theme),root=new THREE.Group();root.name=`remote-${theme}-wings-lite`;root.userData.theme=theme;root.userData.compact=true;const mat=new THREE.MeshBasicMaterial({color:cfg.primary,transparent:true,opacity:.82,side:THREE.DoubleSide,depthWrite:true});
    const make=(side)=>{const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(side*.72,.26);shape.lineTo(side*1.05,.02);shape.lineTo(side*.82,-.28);shape.lineTo(side*.22,-.15);shape.closePath();const geo=new THREE.ShapeGeometry(shape),pivot=new THREE.Group(),mesh=new THREE.Mesh(geo,mat.clone());mesh.position.z=-.02;pivot.position.x=side*.10;pivot.add(mesh);root.add(pivot);return{pivot,mesh};};root.userData.left=make(-1);root.userData.right=make(1);return root;
  }
  createCheapRemoteAura(theme='owner'){
    theme=normalizeStaffTheme(theme);const cfg=staffThemeConfig(theme),root=new THREE.Group();root.name='remote-aura-lite';root.userData.theme=theme;const mat=new THREE.MeshBasicMaterial({color:cfg.primary,transparent:true,opacity:.38,depthWrite:false,blending:THREE.AdditiveBlending});const ring=new THREE.Mesh(new THREE.TorusGeometry(.78,.018,5,24),mat);ring.rotation.x=Math.PI/2;ring.position.y=1.0;root.add(ring);root.userData.rings=[ring];return root;
  }

  simplifyRemoteVisual(root,tier='medium'){
    if(!root)return;root.traverse?.((object)=>{if(object.isLight)object.visible=tier==='high';if(object.isPoints)object.visible=tier!=='minimal'&&tier!=='low';if(object.isMesh){object.castShadow=tier==='high'&&!!this.state.world?.shadows;object.receiveShadow=false;}});
  }

applyRemoteOwnerAura(remote) {
    if(!remote?.model)return;const role=remote.staffVisualRole||'player',isStaffVisual=role!=='player',hidden=!!(remote.vanished&&!remote.viewerCanSeeVanish),skinTheme=normalizeStaffTheme(remote.staffSkinTheme||'none',true),tier=this.remoteCosmeticTier(),auraTheme=normalizeStaffTheme(remote.ownerAuraTheme||'owner'),capeTheme=normalizeStaffTheme(remote.ownerCapeTheme||'owner'),hatTheme=normalizeStaffTheme(remote.ownerHatTheme||'owner'),auraActive=isStaffVisual&&remote.ownerAura&&!hidden&&tier!=='minimal',materialKey=`${role}|${skinTheme}|${remote.vanished?1:0}|${remote.viewerCanSeeVanish?1:0}|${tier}`;
    if(remote.lastMaterialThemeKey!==materialKey){const skinTexture=skinTheme!=='none'&&tier!=='minimal'?this.getStaffSkinTexture(skinTheme):null,cfg=skinTheme==='none'?null:staffThemeConfig(skinTheme);remote.model.traverse((object)=>{if(!object.isMesh)return;const mats=Array.isArray(object.material)?object.material:[object.material];for(const mat of mats){if(!mat)continue;this.applyGalaxyMaterialMode(mat,skinTheme!=='none'&&tier!=='minimal',skinTexture);const original=mat.userData.__centerOriginalMaterial||{};if(skinTheme!=='none'&&tier==='minimal'){mat.color?.set?.(cfg.primary);mat.emissive?.set?.(cfg.emissive);if('emissiveIntensity'in mat)mat.emissiveIntensity=.42;}const opacity=remote.vanished?.3:(original.opacity??1);mat.transparent=remote.vanished||!!original.transparent||opacity<1;mat.opacity=opacity;mat.depthWrite=!remote.vanished&&original.depthWrite!==false;mat.needsUpdate=true;}});remote.lastMaterialThemeKey=materialKey;}
    if(remote.aura&&(remote.aura.userData?.theme!==auraTheme||remote.aura.userData?.qualityTier!==tier)){this.disposeGeneratedVisual(remote.aura);remote.aura=null;}if(auraActive&&!remote.aura){remote.aura=tier==='low'?this.createCheapRemoteAura(auraTheme):this.createGalaxyAuraGroup(true,auraTheme);remote.aura.userData.qualityTier=tier;this.simplifyRemoteVisual(remote.aura,tier);remote.pivot.add(remote.aura);}if(remote.aura)remote.aura.visible=auraActive;
    const visible=isStaffVisual&&!hidden&&!remote.formObject&&remote.vehicle!=='plane';if(remote.cape&&(remote.cape.userData?.theme!==capeTheme||remote.cape.userData?.qualityTier!==tier)){this.disposeGeneratedVisual(remote.cape);remote.cape=null;}if(remote.hat&&(remote.hat.userData?.theme!==hatTheme||remote.hat.userData?.qualityTier!==tier)){this.disposeGeneratedVisual(remote.hat);remote.hat=null;}
    if(visible&&remote.ownerCape&&!remote.cape){remote.cape=tier==='minimal'||tier==='low'?this.createCheapRemoteWings(capeTheme):this.createGalaxyOwnerCape(capeTheme,tier!=='high');remote.cape.userData.qualityTier=tier;remote.cape.scale.setScalar(tier==='minimal'?.82:.9);this.simplifyRemoteVisual(remote.cape,tier);remote.pivot.add(remote.cape);const chest=remote.bones?.chest;if(!this.configureWearableFollower(remote.cape,remote.pivot,chest,new THREE.Vector3(0,1.46,-.24),new THREE.Quaternion()))remote.cape.position.set(0,1.46,-.24);}if(remote.cape)remote.cape.visible=visible&&remote.ownerCape;
    if(visible&&remote.ownerHat&&tier!=='minimal'&&!remote.hat){remote.hat=this.createGalaxyOwnerHat(hatTheme,tier!=='high');remote.hat.userData.qualityTier=tier;this.simplifyRemoteVisual(remote.hat,tier);remote.pivot.add(remote.hat);const head=remote.bones?.head;if(!this.configureWearableFollower(remote.hat,remote.pivot,head,new THREE.Vector3(0,1.84,.005),new THREE.Quaternion()))remote.hat.position.set(0,1.84,.01);}if(remote.hat)remote.hat.visible=visible&&remote.ownerHat&&tier!=='minimal';
  }

  syncRemoteHeldAnchorPose(remote){
    const anchor=remote?.heldAnchor;if(!anchor||!remote?.pivot)return;const hand=remote.bones?.handRight,kind=anchor.userData.kind||remote.heldItem||'none';
    if(hand){remote.pivot.updateWorldMatrix?.(true,false);hand.updateWorldMatrix?.(true,false);hand.getWorldPosition(this.tmpVector);remote.pivot.worldToLocal(this.tmpVector);anchor.position.copy(this.tmpVector);}else anchor.position.set(.42,1.13,.02);
    const transforms={sword:{p:[.02,-.085,.055],r:[.70,.02,-.08]},staff:{p:[.015,-.035,.07],r:[.53,.01,-.055]},eternalFlame:{p:[.018,-.03,.06],r:[.48,.01,-.06]},shovel:{p:[.018,-.045,.055],r:[.52,.015,-.075]},pickaxe:{p:[.018,-.04,.052],r:[.50,.015,-.08]},hoe:{p:[.018,-.043,.054],r:[.51,.015,-.075]},axe:{p:[.02,-.04,.052],r:[.50,.015,-.08]},hammer:{p:[.02,-.038,.05],r:[.49,.015,-.075]}};const tr=transforms[kind]||transforms.sword;anchor.position.x+=tr.p[0];anchor.position.y+=tr.p[1];anchor.position.z+=tr.p[2];anchor.rotation.set(...tr.r);
  }

applyRemoteHeldItem(remote){
    if(!remote?.pivot)return;const hidden=!!(remote.vanished&&!remote.viewerCanSeeVanish),allowed=['sword','shovel','pickaxe','hoe','axe','hammer','staff','eternalFlame'],kind=allowed.includes(remote.heldItem)?remote.heldItem:'none',theme=normalizeStaffTheme(remote.heldItemTheme||'owner'),show=kind!=='none'&&!hidden&&!remote.formObject&&remote.vehicle==='none',same=remote.renderedHeldItem===kind&&remote.heldObject?.userData?.theme===theme;if(!same){this.disposeGeneratedVisual(remote.heldObject);remote.heldAnchor?.removeFromParent?.();remote.heldObject=null;remote.heldAnchor=null;remote.renderedHeldItem=kind;if(kind!=='none'){const mesh=this.createHeldItemMesh(kind,theme);if(mesh){this.simplifyRemoteVisual(mesh,this.remoteCosmeticTier());const anchor=new THREE.Group();anchor.name='remote-center-held-item-grip';anchor.userData.kind=kind;anchor.userData.theme=theme;anchor.add(mesh);remote.pivot.add(anchor);remote.heldAnchor=anchor;remote.heldObject=mesh;this.syncRemoteHeldAnchorPose(remote);}}}if(remote.heldAnchor)remote.heldAnchor.visible=show;
  }

  updateRemoteStaffBeam(remote,now=Date.now(),perfNow=performance.now()){
    if(!remote)return;const active=remote.staffBeamUntil>now&&remote.heldItem==='staff'&&remote.group.visible&&!(remote.vanished&&!remote.viewerCanSeeVanish);
    if(!active){if(remote.staffBeamVisual)remote.staffBeamVisual.visible=false;return;}
    const theme=normalizeStaffTheme(remote.staffBeamTheme||remote.heldItemTheme||'owner');if(remote.staffBeamVisual?.userData?.theme!==theme){this.disposeGeneratedVisual(remote.staffBeamVisual);remote.staffBeamVisual=null;}if(!remote.staffBeamVisual)remote.staffBeamVisual=this.createStaffBeamVisual(theme,true);
    let origin=new THREE.Vector3();const crystal=remote.heldObject?.userData?.crystal;if(crystal?.getWorldPosition)crystal.getWorldPosition(origin);else remote.group.getWorldPosition(origin).add(new THREE.Vector3(0,1.35,0));
    this.updateStaffBeamVisual(remote.staffBeamVisual,origin,remote.staffBeamEnd||origin,theme,perfNow);
  }


  updateRemotePlayers(delta){
    const now=Date.now(),perfNow=performance.now(),quality=this.state.world?.graphicsQuality||'medium';
    for(const [uid,remote] of this.remotePlayers){
      if(now-remote.lastSeenAt>ONLINE_STALE_MS+ONLINE_REMOTE_GRACE_MS){this.removeRemotePlayer(uid);continue;}
      const prediction=clamp((perfNow-Number(remote.lastSnapshotReceivedAt||perfNow))/1000,0,(remote.flying||remote.sprinting)?.46:.34),predictMotion=remote.walking||remote.flying;
      const predictedX=clamp(remote.targetX+(predictMotion?remote.velocityX*prediction:0),this.worldBounds.minX,this.worldBounds.maxX),predictedZ=clamp(remote.targetZ+(predictMotion?remote.velocityZ*prediction:0),this.worldBounds.minZ,this.worldBounds.maxZ),predictedY=remote.targetY+(remote.flying?remote.velocityY*prediction:0);
      const gap=Math.hypot(predictedX-remote.group.position.x,predictedZ-remote.group.position.z);if(gap>16){remote.group.position.x=predictedX;remote.group.position.z=predictedZ;}else{const amount=1-Math.exp(-delta*(remote.sprinting?23:19));remote.group.position.x+=(predictedX-remote.group.position.x)*amount;remote.group.position.z+=(predictedZ-remote.group.position.z)*amount;}
      const groundY=terrainHeightAt(remote.group.position.x,remote.group.position.z),airborne=!remote.flying&&remote.targetY>groundY+.24,targetY=(remote.flying||airborne)?predictedY:groundY,yAmount=1-Math.exp(-delta*19);remote.group.position.y+=(targetY-remote.group.position.y)*yAmount;remote.pivot.rotation.y=lerpAngle(remote.pivot.rotation.y,remote.targetYaw,Math.min(1,delta*18));
      if(remote.aura?.visible&&quality!=='minimal'&&quality!=='performance')this.animateGalaxyAura(remote.aura,delta,now);
      if(remote.cape?.visible){this.updateWearableFollower(remote.cape);const l=remote.cape.userData?.left?.pivot,r=remote.cape.userData?.right?.pivot,{sweep,spread}=this.wingFlightPose(remote.flying,remote.walking?1:0,remote.verticalVelocity||0,now);if(l){l.rotation.x=.01;l.rotation.y=-sweep;l.rotation.z=spread;}if(r){r.rotation.x=.01;r.rotation.y=sweep;r.rotation.z=-spread;}}
      if(remote.vehicleObject?.userData?.mixer){const a=remote.vehicleObject.userData.propellerAction,spin=remote.flying||remote.walking||remote.targetY>terrainHeightAt(remote.group.position.x,remote.group.position.z)+.24;if(a){a.paused=!spin;a.timeScale=remote.flying?1.5:1.05;}if(spin)remote.vehicleObject.userData.mixer.update(delta);}
      if(remote.hat?.visible)this.updateWearableFollower(remote.hat);if(remote.heldAnchor?.visible){this.syncRemoteHeldAnchorPose(remote);if(!['minimal','performance'].includes(quality))this.animateHeldItemEffects(remote.heldObject,now);}this.updateRemoteStaffBeam(remote,now,perfNow);
      this.updateRemoteAnimalForm(remote,delta);const humanWalking=remote.walking&&!remote.formObject&&!remote.vehicleObject&&!airborne&&!remote.flying;
      if(remote.mixer&&(remote.walkAction||remote.action)){if(humanWalking){const desired=remote.sprinting&&remote.runAction?remote.runAction:(remote.walkAction||remote.action);if(remote.activeAction!==desired){if(remote.activeAction&&remote.activeAction!==desired){remote.activeAction.fadeOut?.(.10);remote.activeAction.paused=false;}desired.enabled=true;desired.paused=false;desired.reset?.();desired.fadeIn?.(.10);desired.play?.();remote.activeAction=desired;}else desired.paused=false;remote.mixer.timeScale=remote.sprinting&&!remote.runAction?1.32:1;remote.mixer.update(delta);remote.wasWalking=true;}else{if(remote.wasWalking){for(const a of [remote.walkAction,remote.runAction,remote.action])if(a){a.fadeOut?.(.08);a.paused=true;}remote.activeAction=null;remote.wasWalking=false;}this.applyRemoteIdlePose(remote,delta,false);}}
      else if(!humanWalking)this.applyRemoteIdlePose(remote,delta,false);
      if(!remote.formObject&&!remote.vehicleObject&&(remote.flying||airborne))this.applyRemoteSpecialPose(remote,delta,airborne);
      if(remote.model){const targetTilt=remote.flying?.12:airborne?-.025:0;remote.model.rotation.x+=(targetTilt-remote.model.rotation.x)*(1-Math.exp(-delta*6));}
    }
  }

  removeRemotePlayer(uid){const remote=this.remotePlayers.get(uid);if(!remote)return;remote.modelInstallToken=(remote.modelInstallToken||0)+1;remote.mixer?.stopAllAction?.();remote.vehicleObject?.userData?.mixer?.stopAllAction?.();this.disposeGeneratedVisual(remote.cape);this.disposeGeneratedVisual(remote.hat);this.disposeGeneratedVisual(remote.aura);this.disposeGeneratedVisual(remote.formObject);this.disposeGeneratedVisual(remote.vehicleObject);this.disposeGeneratedVisual(remote.heldObject);remote.heldAnchor?.removeFromParent?.();this.disposeClonedModelMaterials(remote.model);remote.group.removeFromParent();remote.label?.material?.map?.dispose?.();remote.label?.material?.dispose?.();this.remotePlayers.delete(uid);}

  ownerOnly(silent=false){if(this.isOwnerActive)return true;if(!silent)this.toast('Diese Funktion ist ausschließlich für den Owner.');return false;}
  staffOnly(silent=false){if(this.isStaffActive)return true;if(!silent)this.toast('Dieses Center-Teammenü ist nur für Supporter, Moderatoren, Admins und den Owner.');return false;}
  canStaff(capability){return !!(this.isStaffActive&&this.staffCapabilities?.[capability]);}

  toggleOwnerMenu(){if(!this.staffOnly())return;if(this.ownerPanel.classList.contains('is-open'))this.closeOwnerMenu();else this.openOwnerMenu();}
  openOwnerMenu(){if(!this.staffOnly())return;this.closePanel();this.renderOwnerMenu();this.ownerPanel.classList.add('is-open');this.ownerPanel.setAttribute('aria-hidden','false');this.overlay.classList.add('is-owner-panel-open');if(document.pointerLockElement===this.canvas)document.exitPointerLock?.();this.keys.clear();this.input.forward=0;this.input.right=0;}
  closeOwnerMenu(){if(!this.ownerPanel)return;this.ownerPanel.classList.remove('is-open');this.ownerPanel.setAttribute('aria-hidden','true');this.overlay?.classList.remove('is-owner-panel-open');this.canvas?.focus?.({preventScroll:true});}
  ownerToggleButton(action,label,enabled,description=''){return `<button class="mdc-owner-toggle ${enabled?'active':''}" data-owner-action="${action}"><span>${enabled?'✓':'○'}</span><b>${label}</b><small>${description}</small></button>`;}

renderOwnerMenu(){
    if(!this.staffOnly())return;const f=this.ownerFlags,caps=this.staffCapabilities,detailRole=this.activeStaffDetailRole||this.activeStaffRole,roleLabel=STAFF_ROLE_LABELS[detailRole]||STAFF_ROLE_LABELS[this.activeStaffRole]||'Team',appearance=this.state.ownerAppearance||{},disguised=this.isPublicPlayerMode(),speedMultiplier=clamp(Number(f.speedMultiplier)||1,1,OWNER_MAX_SPEED_MULTIPLIER),onlinePlayers=[...this.onlineRoster.values()].sort((a,b)=>String(a.name).localeCompare(String(b.name),'de')),villages=[...this.villages].sort((a,b)=>distance2D(a,this.player.position)-distance2D(b,this.player.position)).slice(0,5),landmarks=this.hotspots.filter((h)=>['cave','mine','landmark','encounter'].includes(h.type)).sort((a,b)=>distance2D(a,this.player.position)-distance2D(b,this.player.position)).slice(0,5);
    const movement=[caps.vanish&&this.ownerToggleButton('toggle-vanish','Vanish',f.vanish,'Spieler/NPCs sehen dich nicht · Owner sieht Team · Admin sieht Owner/Admin'),caps.god&&this.ownerToggleButton('toggle-god','Unbesiegbar',f.god,'Alle Überlebenswerte bleiben voll'),caps.noclip&&this.ownerToggleButton('toggle-noclip','Noclip',f.noclip,'Durch Objekte laufen'),caps.fly&&this.ownerToggleButton('toggle-fly','Fly',f.fly,'Fliegen · Leertaste hoch · Strg runter'),caps.freezeTime&&this.ownerToggleButton('toggle-time','Zeit anhalten',f.freezeTime,'Nur deine lokale Weltzeit einfrieren')].filter(Boolean).join(''),utility=[caps.heal&&'<button data-owner-action="heal">❤ Alles heilen</button>',(caps.fly||caps.noclip)&&'<button data-owner-action="ground">↓ Sicher landen</button>',(caps.fly||caps.noclip)&&'<button data-owner-action="unstuck">↺ Befreien</button>',caps.world&&'<button data-owner-action="reveal">⌖ Orte aufdecken</button>'].filter(Boolean).join(''),formLabels={normal:'Normal',ball:'Rollender Ball',crystal:'Kristall',bush:'Busch',tree:'Baum',rock:'Stein',grass:'Grasbüschel',fox:'Fuchs',shark:'Hai',cow:'Kuh',orca:'Orka',horse:'Reitpferd',owl:'Uhu',wolf1:'Wolf Baby I',wolf2:'Wolf Baby II',spider:'Zauberspinne',clownfish:'Clownfisch Nemo',bird:'Vogel'},forms=(caps.forms||['normal']).map((id)=>[id,id==='tree'?`Baum ${Math.max(0,Math.floor(Number(appearance.treeVariant)||0))+1}/${Math.max(1,this.natureTreeNames.length)}`:(formLabels[id]||id)]),itemLabels={none:'Leer',shovel:'Schaufel · Basic Tools',pickaxe:'Spitzhacke · Basic Tools',hoe:'Hacke · Basic Tools',axe:'Axt · Basic Tools',hammer:'Hammer · Basic Tools',sword:'Spezial-Schwert',staff:'Spezial-Stab',eternalFlame:'Ewige Flamme'},teamToolIds=['none',...(caps.items||[]).filter((id)=>['shovel','pickaxe','hoe','axe','hammer'].includes(id))].filter((id,index,list)=>list.indexOf(id)===index),sections=[];
    const themeSection=(theme,title)=>{const cls=`mdc-${theme}-action`,heading=`mdc-${theme}-heading`,skinOn=appearance.staffSkinTheme===theme,item=(kind)=>appearance.heldItem===kind&&appearance.heldItemTheme===theme,toggle=(key)=>!!appearance[key]&&appearance[`${key}Theme`]===theme;return `<h3 class="${heading}">${title}</h3><div class="mdc-owner-actions three"><button class="${cls} ${skinOn?'active':''}" data-owner-action="toggle-staff-skin" data-owner-theme="${theme}">${skinOn?'✓':'○'} ${staffThemeConfig(theme).label} Skin</button><button class="${cls} ${item('sword')?'active':''}" data-owner-action="admin-item" data-owner-item="sword" data-owner-theme="${theme}">${title} Schwert</button><button class="${cls} ${item('staff')?'active':''}" data-owner-action="admin-item" data-owner-item="staff" data-owner-theme="${theme}">${title} Stab</button><button class="${cls} ${item('eternalFlame')?'active':''}" data-owner-action="admin-item" data-owner-item="eternalFlame" data-owner-theme="${theme}">${title} Ewige Flamme</button><button class="${cls} ${toggle('aura')?'active':''}" data-owner-action="toggle-aura" data-owner-theme="${theme}">${toggle('aura')?'✓':'○'} ${title} Aura</button><button class="${cls} ${toggle('cape')?'active':''}" data-owner-action="toggle-cape" data-owner-theme="${theme}">${toggle('cape')?'✓':'○'} ${title} Wings</button><button class="${cls} ${toggle('hat')?'active':''}" data-owner-action="toggle-hat" data-owner-theme="${theme}">${toggle('hat')?'✓':'○'} ${title} Krone</button></div>`;};
    sections.push(`<div class="mdc-owner-status"><span>◆</span><div><small>${roleLabel.toUpperCase()} AKTIV</small><b>${escapeHtml(bridgeSnapshot().firstName)} · Center-Kontrolle</b><p>Öffnen und schließen mit der Punkt-Taste.</p></div></div>`);
    if(['owner','admin'].includes(this.activeStaffRole)){const publicStyle=this.effectivePublicStaffStyle(),roleButtons=this.isOwnerActive?`<button class="${publicStyle==='owner'?'active ':''}" data-owner-action="public-mode-owner">Als Owner</button><button class="${publicStyle==='admin'?'active ':''}" data-owner-action="public-mode-admin">Als Admin</button><button class="${publicStyle==='moderator'?'active ':''}" data-owner-action="public-mode-moderator">Als Moderator</button><button class="${publicStyle==='supporter'?'active ':''}" data-owner-action="public-mode-supporter">Als Supporter</button><button class="${disguised?'active ':''}" data-owner-action="public-mode-player">Als normaler Spieler</button>`:`<button class="${publicStyle==='admin'?'active ':''}" data-owner-action="public-mode-admin">Als Admin</button><button class="${disguised?'active ':''}" data-owner-action="public-mode-player">Als normaler Spieler</button>`;sections.push(`<h3>Öffentliche Identität</h3><div class="mdc-owner-character"><div class="mdc-owner-actions three">${roleButtons}</div><div class="mdc-owner-actions"><button class="${appearance.publicGender==='male'?'active ':''}" data-owner-action="public-gender-male">Mann</button><button class="${appearance.publicGender==='female'?'active ':''}" data-owner-action="public-gender-female">Frau</button></div><label>Öffentlicher Spielername<input data-owner-public-alias maxlength="30" value="${escapeHtml(appearance.publicAlias||'Center Spieler')}"></label><p class="mdc-note">Der Owner kann sich öffentlich als Owner, Admin, Moderator, Supporter oder normaler Spieler darstellen. Die echten Rechte bleiben intern erhalten.</p></div>`);}
    sections.push(`<h3>Schutz und Bewegung</h3><div class="mdc-owner-toggle-grid">${movement}</div>${utility?`<div class="mdc-owner-actions">${utility}</div>`:''}`);
    if(['owner','admin'].includes(this.activeStaffRole)){const maxHealth=this.effectiveMaxHealth(),staffDamage=this.staffDamageAmount();sections.push(`<h3>Staff-Kampfwerte</h3><div class="mdc-owner-character"><label>Maximales Leben <input data-owner-health-max type="number" min="100" max="10000" step="50" value="${maxHealth}"><b>${maxHealth}</b></label><label>Stab-Schaden <input data-owner-staff-damage type="number" min="10" max="2500" step="10" value="${staffDamage}"><b>${staffDamage}</b></label><div class="mdc-owner-actions"><button data-owner-action="fill-staff-health">❤ Leben auf Maximum</button></div></div>`);}
    if(caps.speed)sections.push(`<h3>Geschwindigkeit</h3><div class="mdc-owner-character"><label>Tempo <input data-owner-speed type="range" min="1" max="${OWNER_MAX_SPEED_MULTIPLIER}" step="0.25" value="${speedMultiplier}"><b>${speedMultiplier.toFixed(2)}×</b></label></div>`);
    if(caps.size||forms.length>1)sections.push(`<h3>Charakter</h3><div class="mdc-owner-character">${caps.size?`<label>Größe <input data-owner-size type="range" min="0.45" max="2.5" step="0.05" value="${appearance.size}"><b>${Number(appearance.size).toFixed(2)}×</b></label>`:''}<div class="mdc-owner-actions three">${forms.map(([id,label])=>`<button class="${appearance.skin===id?'active ':''}" data-owner-action="skin-${id}">${label}</button>`).join('')}</div></div>`);
    if(teamToolIds.length>1)sections.push(`<h3>Team-Werkzeuge</h3><div class="mdc-owner-actions three">${teamToolIds.map((id)=>`<button class="${appearance.heldItem===id?'active ':''}" data-owner-action="admin-item" data-owner-item="${id}">${itemLabels[id]||id}</button>`).join('')}</div>`);
    const availableThemes=this.allowedCosmeticThemes();if(availableThemes.length){const titles={owner:'Owner Galaxy',admin:'Admin Red Galaxy',moderator:'Moderator Grün',supporter:'Supporter Blau'};for(const theme of availableThemes)sections.push(themeSection(theme,titles[theme]));}else if(this.isStaffActive)sections.push(`<h3>Team-Skin</h3><div class="mdc-owner-character"><p class="mdc-note">${detailRole==='testsupporter'?'Testsupporter':'Teammitglied'} nutzt den weißen Team-Skin${detailRole==='testsupporter'?' und darf Fly benutzen':''}.</p></div>`);
    if((caps.vehicles||[]).some((id)=>id==='scooter'||id==='plane'))sections.push(`<h3>Team-Fahrzeuge</h3><div class="mdc-owner-actions">${(caps.vehicles||[]).includes('scooter')?`<button class="${appearance.vehicle==='scooter'?'active ':''}" data-owner-action="admin-vehicle" data-owner-vehicle="scooter">🛴 Electro Scooter</button>`:''}${(caps.vehicles||[]).includes('plane')?`<button class="${appearance.vehicle==='plane'?'active ':''}" data-owner-action="admin-vehicle" data-owner-vehicle="plane">✈ Sägelflugzeug</button>`:''}${appearance.vehicle!=='none'?'<button data-owner-action="admin-vehicle" data-owner-vehicle="none">Fahrzeug abstellen</button>':''}</div>`);
    if(caps.world)sections.push(`<h3>Welt und Zeit</h3><div class="mdc-owner-actions three"><button data-owner-action="time-day">☀ Tag</button><button data-owner-action="time-night">☾ Nacht</button><button data-owner-action="weather-clear">Klar</button><button data-owner-action="weather-rain">Regen</button><button data-owner-action="weather-snow">Schnee</button><button data-owner-action="season-next">Jahreszeit +</button></div>`);
    if(caps.resources)sections.push(`<h3>Ressourcen und Fortschritt</h3><div class="mdc-owner-grant"><select data-owner-resource>${Object.entries(RESOURCE_LABELS).map(([id,name])=>`<option value="${id}">${escapeHtml(name)}</option>`).join('')}</select><input data-owner-amount type="number" min="1" max="9999" value="100"><button data-owner-action="grant-resource">Hinzufügen</button></div><div class="mdc-owner-actions"><button data-owner-action="grant-all">Alle Ressourcen +100</button><button data-owner-action="grant-tools">Alle Werkzeuge 100 %</button><button data-owner-action="grant-skills">Skills und XP</button><button data-owner-action="respawn-resources">Ressourcen regenerieren</button></div>`);
    const staffBindRows=[['staffMenu','Team-Menü'],caps.vanish&&['vanish','Vanish'],caps.god&&['god','Unbesiegbar'],caps.fly&&['fly','Fly']].filter(Boolean),quickFormOptions=(caps.forms||[]).filter((id)=>ANIMAL_FORM_IDS.includes(id));if(staffBindRows.length||quickFormOptions.length)sections.push(`<h3>Keybinds</h3><div class="mdc-keybind-grid">${staffBindRows.map(([id,label])=>`<label>${label}<select data-keybind-action="${id}">${this.keybindOptions(this.state.keybinds?.[id])}</select></label>`).join('')}${quickFormOptions.length?`<label>Tier-Verwandlung<select data-owner-quick-form>${quickFormOptions.map((id)=>`<option value="${id}" ${appearance.quickForm===id?'selected':''}>${escapeHtml(formLabels[id]||ANIMAL_PROFILES[id]?.label||id)}</option>`).join('')}</select></label><label>Tier-Keybind<select data-keybind-action="transform">${this.keybindOptions(this.state.keybinds?.transform)}</select></label>`:''}</div>`);
    if(caps.online)sections.push(`<h3>Online-Spieler im Center</h3><div class="mdc-owner-player-list">${onlinePlayers.length?onlinePlayers.map((p,i)=>`<article><span>●</span><div><b>${escapeHtml(p.name)}</b><small>${Math.round(Math.hypot(Number(p.x||0)-this.player.position.x,Number(p.z||0)-this.player.position.z))} m entfernt${p.vanished?' · Vanish':''}</small></div>${caps.teleport?`<button data-owner-action="tp-player" data-owner-index="${i}">Teleportieren</button>`:''}</article>`).join(''):'<p>Aktuell ist kein weiterer Spieler im Center verbunden.</p>'}</div>`);
    if(caps.teleport)sections.push(`<h3>Teleportieren</h3><div class="mdc-owner-teleports"><button data-owner-action="tp-spawn">Siedlungs-Spawn</button><button data-owner-action="tp-river">Nächster Fluss</button><button data-owner-action="tp-random">Sicherer Zufallsort</button>${villages.map((v,i)=>`<button data-owner-action="tp-village" data-owner-index="${i}">Dorf: ${escapeHtml(v.name)}</button>`).join('')}${landmarks.map((h,i)=>`<button data-owner-action="tp-landmark" data-owner-index="${i}">${escapeHtml(h.data?.title||h.label||'Weltort')}</button>`).join('')}</div>`);this.ownerPanelBody.innerHTML=sections.join('');this.ownerTeleportPlayers=onlinePlayers;this.ownerTeleportVillages=villages;this.ownerTeleportLandmarks=landmarks;
  }

  teleportOwner(x,z,y=null,label='Ort'){if(!this.canStaff('teleport')&&!this.canStaff('fly')&&!this.canStaff('noclip'))return;const tx=clamp(Number(x)||0,this.worldBounds.minX,this.worldBounds.maxX),tz=clamp(Number(z)||0,this.worldBounds.minZ,this.worldBounds.maxZ);this.player.position.set(tx,y===null?terrainHeightAt(tx,tz):Number(y),tz);this.velocityY=0;this.lastChunkCenter='';this.updateChunkStreaming(true);this.snapCamera();this.toast(`Teleportiert: ${label}`);this.publishPresence(true).catch(()=>{});}

  applyStaffForm(skin,{cycleTree=true}={}){
    const caps=this.staffCapabilities||staffCapabilities(this.activeStaffRole);if(!this.isStaffActive||!caps.forms?.includes(skin)){this.toast('Diese Form ist für deine Teamrolle gesperrt.');return false;}
    const current=this.state.ownerAppearance.skin,same=current===skin,isAnimal=ANIMAL_FORM_IDS.includes(skin);
    if(isAnimal&&same){this.spawnTransformationEffectAt(this.player.position);this.state.ownerAppearance.skin='normal';if(current==='owl'&&this.transformationAutoFly){this.ownerFlags.fly=false;this.flightTakeoffActive=false;this.flightTakeoffTargetY=null;this.flightVerticalVelocity=0;}this.transformationAutoFly=false;this.applyOwnerAppearance();this.saveState(true);if(this.ownerPanel?.classList.contains('is-open'))this.renderOwnerMenu();this.publishPresence(true).catch(()=>{});return true;}
    if(skin==='tree'&&same&&cycleTree){this.state.ownerAppearance.treeVariant=(Math.max(0,Math.floor(Number(this.state.ownerAppearance.treeVariant)||0))+1)%Math.max(1,this.natureTreeNames.length);this.spawnTransformationEffectAt(this.player.position);}
    else if(!same)this.spawnTransformationEffectAt(this.player.position);
    if(this.mountedHorse)this.dismountHorse(true);if(ANIMAL_FORM_IDS.includes(skin))this.state.ownerAppearance.vehicle='none';if(current==='owl'&&skin!=='owl'&&this.transformationAutoFly){this.ownerFlags.fly=false;this.flightTakeoffActive=false;this.flightTakeoffTargetY=null;this.flightVerticalVelocity=0;this.transformationAutoFly=false;}this.state.ownerAppearance.skin=skin;
    if(skin==='owl'&&caps.fly&&!this.ownerFlags.fly){this.ownerFlags.fly=true;this.transformationAutoFly=true;this.velocityY=0;const floor=terrainHeightAt(this.player.position.x,this.player.position.z)+MIN_WORLD_CLEARANCE;this.flightTakeoffTargetY=floor+2;this.flightTakeoffActive=true;}
    this.applyOwnerAppearance();this.saveState(true);if(this.ownerPanel?.classList.contains('is-open'))this.renderOwnerMenu();this.publishPresence(true).catch(()=>{});return true;
  }

  activateQuickTransformation(){
    if(!this.isStaffActive)return;const caps=this.staffCapabilities||staffCapabilities(this.activeStaffRole),fallback=(caps.forms||[]).find((id)=>ANIMAL_FORM_IDS.includes(id))||'normal';let form=this.state.ownerAppearance.quickForm||fallback;if(!caps.forms?.includes(form))form=fallback;this.state.ownerAppearance.quickForm=form;this.applyStaffForm(form,{cycleTree:true});
  }

  keybindOptions(selected){return KEYBIND_OPTIONS.map((code)=>`<option value="${code}" ${code===selected?'selected':''}>${KEYBIND_LABELS[code]||code}</option>`).join('');}
  handleKeybindChange(event){const quick=event.target.closest?.('[data-owner-quick-form]');if(quick){const form=quick.value,caps=this.staffCapabilities||staffCapabilities(this.activeStaffRole);if(caps.forms?.includes(form)){this.state.ownerAppearance.quickForm=form;this.saveState(true);this.toast(`Verwandlungs-Keybind: ${form}`);}return;}const select=event.target.closest?.('[data-keybind-action]');if(!select)return;const action=select.dataset.keybindAction,code=select.value;if(!(action in DEFAULT_KEYBINDS)||!KEYBIND_OPTIONS.includes(code))return;this.state.keybinds[action]=code;this.saveState(true);this.toast(`Tastenbelegung gespeichert: ${KEYBIND_LABELS[code]||code}`);}
  toggleStaffFlag(key){if(!this.isStaffActive)return;const capability={vanish:'vanish',god:'god',fly:'fly'}[key];if(!capability||!this.canStaff(capability))return;this.ownerFlags[key]=!this.ownerFlags[key];if(key==='vanish')this.applyOwnerVisualState();if(key==='god'&&this.ownerFlags.god)for(const need of Object.keys(this.state.needs))this.state.needs[need]=need==='health'?this.effectiveMaxHealth():100;if(key==='fly'){this.flightVerticalVelocity=0;this.flightInputMagnitude=0;const floor=terrainHeightAt(this.player.position.x,this.player.position.z)+MIN_WORLD_CLEARANCE;if(this.ownerFlags.fly){this.velocityY=0;this.player.position.y=Math.max(this.player.position.y,floor);this.flightTakeoffTargetY=floor+2;this.flightTakeoffActive=true;}else{this.flightTakeoffActive=false;this.flightTakeoffTargetY=null;this.flightLean=0;this.flightRoll=0;if(this.flightVisualPivot){this.flightVisualPivot.rotation.x=0;this.flightVisualPivot.rotation.z=0;}}}this.renderOwnerMenu();this.publishPresence(true).catch(()=>{});}

handleOwnerInput(event){
    if(!this.staffOnly())return;const alias=event.target.closest?.('[data-owner-public-alias]');if(alias&&['owner','admin'].includes(this.activeStaffRole)){this.state.ownerAppearance.publicAlias=String(alias.value||'Center Spieler').trim().slice(0,30)||'Center Spieler';this.saveState(true);if(this.isPublicPlayerMode())this.publishPresence(true).catch(()=>{});return;}
    const healthInput=event.target.closest?.('[data-owner-health-max]');if(healthInput&&['owner','admin'].includes(this.activeStaffRole)){const old=this.effectiveMaxHealth(),value=Math.floor(clamp(Number(healthInput.value)||old,100,10000));this.state.ownerAppearance.staffMaxHealth=value;if(value>old)this.state.needs.health=Math.min(value,this.state.needs.health+(value-old));else this.state.needs.health=Math.min(value,this.state.needs.health);const label=healthInput.parentElement?.querySelector('b');if(label)label.textContent=String(value);this.renderHud(true);this.saveState(true);return;}
    const damageInput=event.target.closest?.('[data-owner-staff-damage]');if(damageInput&&['owner','admin'].includes(this.activeStaffRole)){const value=Math.floor(clamp(Number(damageInput.value)||180,10,2500));this.state.ownerAppearance.staffDamage=value;const label=damageInput.parentElement?.querySelector('b');if(label)label.textContent=String(value);this.saveState(true);return;}
    const speedInput=event.target.closest?.('[data-owner-speed]');if(speedInput&&this.canStaff('speed')){this.ownerFlags.speedMultiplier=clamp(Number(speedInput.value)||1,1,OWNER_MAX_SPEED_MULTIPLIER);this.ownerFlags.speedLevel=0;const label=speedInput.parentElement?.querySelector('b');if(label)label.textContent=`${this.ownerFlags.speedMultiplier.toFixed(2)}×`;return;}const sizeInput=event.target.closest?.('[data-owner-size]');if(sizeInput&&this.canStaff('size')){this.state.ownerAppearance.size=clamp(Number(sizeInput.value)||1,.45,2.5);const label=sizeInput.parentElement?.querySelector('b');if(label)label.textContent=`${this.state.ownerAppearance.size.toFixed(2)}×`;this.applyOwnerAppearance();this.saveState(true);this.publishPresence(true).catch(()=>{});}
  }

  async handleOwnerAction(event){
    const button=event.target.closest?.('[data-owner-action]');if(!button||!this.staffOnly())return;const action=button.dataset.ownerAction,caps=this.staffCapabilities,requestedTheme=STAFF_THEME_IDS.includes(button.dataset.ownerTheme)?button.dataset.ownerTheme:null;
    const required={ ground:'fly',unstuck:'fly','toggle-vanish':'vanish','toggle-god':'god','toggle-noclip':'noclip','toggle-fly':'fly','toggle-time':'freezeTime',heal:'heal',reveal:'world','time-day':'world','time-night':'world','weather-clear':'world','weather-rain':'world','weather-snow':'world','season-next':'world','grant-resource':'resources','grant-all':'resources','grant-tools':'resources','grant-skills':'resources','respawn-resources':'resources','tp-spawn':'teleport','tp-river':'teleport','tp-random':'teleport','tp-player':'teleport','tp-village':'teleport','tp-landmark':'teleport'}[action];
    if(required&&!caps[required]){this.toast('Deine Teamrolle darf diese Funktion nicht verwenden.');return;}
    if(['public-mode-owner','public-mode-admin','public-mode-moderator','public-mode-supporter','public-mode-player','public-mode-staff'].includes(action)){if(!['owner','admin'].includes(this.activeStaffRole))return;let mode=action.replace('public-mode-','');if(mode==='staff')mode=this.activeStaffRole;if(['owner','moderator','supporter'].includes(mode)&&!this.isOwnerActive)return;if(mode==='admin'&&!['owner','admin'].includes(this.activeStaffRole))return;this.state.ownerAppearance.publicMode=mode;this.spawnTransformationEffectAt(this.player.position);await this.ensureCorrectPlayerModel();this.applyOwnerAppearance();this.saveState(true);this.renderOwnerMenu();this.publishPresence(true).catch(()=>{});return;}
    if(action==='public-gender-male'||action==='public-gender-female'){if(!['owner','admin'].includes(this.activeStaffRole))return;this.state.ownerAppearance.publicGender=action.endsWith('female')?'female':'male';if(this.isPublicPlayerMode())await this.ensureCorrectPlayerModel();this.saveState(true);this.renderOwnerMenu();this.publishPresence(true).catch(()=>{});return;}
    if(action.startsWith('toggle-')){const map={'toggle-vanish':'vanish','toggle-god':'god','toggle-noclip':'noclip','toggle-fly':'fly','toggle-time':'freezeTime'},key=map[action];if(key){if(['vanish','god','fly'].includes(key)){this.toggleStaffFlag(key);return;}this.ownerFlags[key]=!this.ownerFlags[key];this.renderOwnerMenu();this.publishPresence(true).catch(()=>{});return;}}
    if(action==='toggle-owner-galaxy-skin'||action==='toggle-staff-skin'){
      const theme=requestedTheme||'owner';if(!this.allowedCosmeticThemes().includes(theme))return;const appearance=this.state.ownerAppearance;appearance.staffSkinTheme=appearance.staffSkinTheme===theme?'none':theme;this.spawnTransformationEffectAt(this.player.position);this.setShadowCharacterMode(appearance.staffSkinTheme!=='none',appearance.staffSkinTheme==='none'?'owner':appearance.staffSkinTheme);this.applyOwnerAppearance();this.saveState(true);this.renderOwnerMenu();this.publishPresence(true).catch(()=>{});return;
    }
    if(action.startsWith('skin-')){const skin=action.replace('skin-','')==='shadow'?'galaxy':action.replace('skin-','');this.applyStaffForm(skin,{cycleTree:true});return;}
    if(action==='admin-item'){const item=button.dataset.ownerItem||'none';if(!caps.items.includes(item)){this.toast('Dieses Item ist ausschließlich für eine höhere Teamrolle.');return;}const appearance=this.state.ownerAppearance,nextTheme=requestedTheme||this.appearanceTheme('heldItem'),same=item!=='none'&&appearance.heldItem===item&&appearance.heldItemTheme===nextTheme;appearance.heldItem=same?'none':item;if(item!=='none')appearance.heldItemTheme=nextTheme;this.applyHeldItemVisual();this.saveState(true);this.renderOwnerMenu();this.publishPresence(true).catch(()=>{});return;}
    if(action==='admin-vehicle'){const vehicle=button.dataset.ownerVehicle||'none';if(!(caps.vehicles||['none']).includes(vehicle)){this.toast('Dieses Fahrzeug ist für deine Teamrolle gesperrt.');return;}if(this.mountedHorse)this.dismountHorse(true);const previousVehicle=this.state.ownerAppearance.vehicle||'none';this.state.ownerAppearance.skin=['normal','galaxy'].includes(this.state.ownerAppearance.skin)?this.state.ownerAppearance.skin:'normal';if(vehicle==='scooter'){this.ownerFlags.fly=false;this.flightTakeoffActive=false;this.flightTakeoffTargetY=null;this.flightVerticalVelocity=0;this.state.ownerAppearance.vehicle='scooter';this.toast(`🛴 Electro Scooter aktiviert · ${[40,80,120,150][this.state.ownerAppearance.scooterTuning||0]} km/h.`);}else if(vehicle==='plane'){this.state.ownerAppearance.vehicle='plane';this.ownerFlags.fly=true;this.velocityY=0;const floor=terrainHeightAt(this.player.position.x,this.player.position.z)+MIN_WORLD_CLEARANCE;this.flightTakeoffTargetY=floor+2.4;this.flightTakeoffActive=true;this.toast('✈ Sägelflugzeug aktiviert · Fly automatisch AN.');}else{this.state.ownerAppearance.vehicle='none';if(previousVehicle==='plane'){this.ownerFlags.fly=false;this.flightTakeoffActive=false;this.flightTakeoffTargetY=null;this.flightVerticalVelocity=0;}this.toast('Fahrzeug abgestellt.');}this.applyOwnerAppearance();this.renderScooterTuningBar();this.saveState(true);this.renderOwnerMenu();this.publishPresence(true).catch(()=>{});return;}
    if(action==='toggle-aura'||action==='toggle-cape'||action==='toggle-hat'){if(!caps.ownerCosmetics){this.toast('Diese Spezialausrüstung ist für deine aktuelle Teamrolle gesperrt.');return;}const key=action==='toggle-aura'?'aura':action==='toggle-cape'?'cape':'hat',themeKey=`${key}Theme`,appearance=this.state.ownerAppearance,nextTheme=requestedTheme||this.appearanceTheme(key),same=!!appearance[key]&&appearance[themeKey]===nextTheme;appearance[key]=!same;if(appearance[key])appearance[themeKey]=nextTheme;if(key==='aura'){if(appearance.aura)this.ensureOwnerAura();this.updateOwnerAura(.016,performance.now());}else this.applyOwnerWearables();this.applyOwnerVisualState();this.saveState(true);this.renderOwnerMenu();this.publishPresence(true).catch(()=>{});return;}
    if(action==='fill-staff-health'){this.state.needs.health=this.effectiveMaxHealth();this.toast(`Leben auf ${this.effectiveMaxHealth()} gesetzt.`);}
    else if(action==='heal'){for(const key of Object.keys(this.state.needs))this.state.needs[key]=key==='health'?this.effectiveMaxHealth():100;this.toast('Leben, Hunger, Durst, Ausdauer und Wärme vollständig geheilt.');}
    else if(action==='ground')this.teleportOwner(this.player.position.x,this.player.position.z,null,'sicherer Boden');
    else if(action==='unstuck')this.teleportOwner(this.player.position.x+Math.sin(this.yaw)*-6,this.player.position.z+Math.cos(this.yaw)*-6,null,'freie Position');
    else if(action==='time-day'){this.state.time=12;this.toast('Mittag eingestellt. Zeit anhalten bleibt aus, bis du es ausdrücklich aktivierst.');}
    else if(action==='time-night'){this.state.time=0;this.toast('Mitternacht eingestellt. Zeit anhalten bleibt aus, bis du es ausdrücklich aktivierst.');}
    else if(action.startsWith('weather-')){this.state.weather=action.replace('weather-','');this.state.weatherRemaining=8;this.state.weatherUntil=(this.state.time+8)%24;this.updateWeatherParticles();this.toast(`Wetter: ${WEATHER[this.state.weather]?.name||this.state.weather}`);}
    else if(action==='season-next'){this.state.season=(this.state.season+1)%SEASONS.length;this.applySeasonVisuals();this.toast(`${SEASONS[this.state.season].icon} ${SEASONS[this.state.season].name}`);}
    else if(action==='grant-resource'){const id=this.ownerPanelBody.querySelector('[data-owner-resource]')?.value,amount=Math.floor(clamp(this.ownerPanelBody.querySelector('[data-owner-amount]')?.value,1,9999));if(id in this.state.inventory){this.state.inventory[id]+=amount;this.toast(`+${amount} ${RESOURCE_LABELS[id]||id}`);}}
    else if(action==='grant-all'){for(const id of Object.keys(this.state.inventory))this.state.inventory[id]+=100;this.toast('Alle Center-Ressourcen +100.');}
    else if(action==='grant-tools'){for(const id of Object.keys(this.state.tools))this.state.tools[id]=Math.max(100,this.state.tools[id]||0);this.toast('Alle Werkzeuge auf 100 %.');}
    else if(action==='grant-skills'){for(const id of Object.keys(this.state.skills))this.state.skills[id]=5;this.state.skillPoints+=25;this.state.xp+=2500;this.toast('Alle Center-Skills auf 5 · +25 Skillpunkte · +2.500 XP.');}
    else if(action==='respawn-resources'){for(const id of Object.keys(this.state.harvested))delete this.state.harvested[id];this.restoreHarvestedNodes();this.toast('Geladene Ressourcen wurden regeneriert.');}
    else if(action==='reveal'){for(const v of this.villages)if(!this.state.discovered.includes(v.name))this.state.discovered.push(v.name);for(const h of this.hotspots){const name=h.data?.title;if(name&&!this.state.discovered.includes(name))this.state.discovered.push(name);}this.toast('Alle aktuell geladenen Orte wurden aufgedeckt.');}
    else if(action==='tp-spawn')this.teleportOwner(this.state.world.spawnX,this.state.world.spawnZ,null,'Siedlungs-Spawn');
    else if(action==='tp-river'){const z=this.player.position.z,x=riverCenter(z)+(this.player.position.x<riverCenter(z)?-20:20);this.teleportOwner(x,z,null,'Grenzfluss');}
    else if(action==='tp-random'){for(let i=0;i<80;i+=1){const x=(Math.random()*2-1)*(WORLD_HALF-150),z=(Math.random()*2-1)*(WORLD_HALF-150),y=terrainHeightAt(x,z);if(y>-2&&y<48&&Math.abs(x-riverCenter(z))>28){this.teleportOwner(x,z,null,'sicherer Zufallsort');break;}}}
    else if(action==='tp-player'){const p=this.ownerTeleportPlayers?.[Number(button.dataset.ownerIndex)];if(p)this.teleportOwner(Number(p.x||0)+1.8,Number(p.z||0)+1.8,Number.isFinite(Number(p.y))?Number(p.y):null,`Spieler ${p.name}`);}
    else if(action==='tp-village'){const v=this.ownerTeleportVillages?.[Number(button.dataset.ownerIndex)];if(v)this.teleportOwner(v.x+10,v.z+10,null,v.name);}
    else if(action==='tp-landmark'){const h=this.ownerTeleportLandmarks?.[Number(button.dataset.ownerIndex)];if(h)this.teleportOwner(h.x+7,h.z+7,null,h.data?.title||h.label);}
    this.renderOwnerMenu();this.renderHud(true);this.saveState(true);
  }

startRolePolling(){clearInterval(this.rolePollTimer);this.rolePollTimer=setInterval(async()=>{if(!this.opened)return;this.updateRoleHud();const expected=(this.isStaffActive&&!this.isPublicPlayerMode())?'owner':this.isPublicPlayerMode()?this.state.ownerAppearance.publicGender:bridgeSnapshot().gender;if(this.playerSkin&&this.playerSkin!==expected)await this.ensureCorrectPlayerModel();},3000);}

startLoop() {
    cancelAnimationFrame(this.raf);const frame=(now)=>{if(!this.opened)return;this.raf=requestAnimationFrame(frame);const quality=this.state.world?.graphicsQuality||'medium',minFrame=quality==='minimal'?66:quality==='performance'?50:quality==='low'?Math.max(33,this.performanceTier==='low'?40:33):this.performanceTier==='low'?33:this.performanceTier==='balanced'?22:16;if(now-this.lastRenderedAt<minFrame)return;this.lastRenderedAt=now;const delta=Math.min(.06,Math.max(.001,(now-this.lastFrameAt)/1000));this.lastFrameAt=now;if(document.hidden)return;const workStart=performance.now(),slow=quality==='minimal'?2.5:quality==='performance'?1.9:quality==='low'?1.35:1;try{this.updateMovement(delta);this.updateActiveStaffBeam(now);this.updateChunkStreaming();this.runPerfTask('world',now,PERF_TASK_INTERVALS.world*slow,(d)=>this.updateWorldTime(d));this.runPerfTask('needs',now,PERF_TASK_INTERVALS.needs*slow,(d)=>this.updateNeeds(d));this.runPerfTask('animals',now,(this.performanceTier==='low'?90:PERF_TASK_INTERVALS.animals)*slow,(d)=>this.updateAnimals(d,now));this.runPerfTask('ambient',now,(this.performanceTier==='low'?100:PERF_TASK_INTERVALS.ambient)*slow,(d)=>this.updateAmbientCreatures(d,now));this.runPerfTask('npcs',now,(this.performanceTier==='low'?150:PERF_TASK_INTERVALS.npcs)*slow,(d)=>this.updateNpcs(d,now));this.runPerfTask('death',now,PERF_TASK_INTERVALS.death*slow,()=>this.ensureDeathLootMarker());this.runPerfTask('thrown',now,PERF_TASK_INTERVALS.thrown*slow,(d)=>this.updateOwnerThrownObjects(d,now));this.runPerfTask('remote',now,quality==='minimal'?80:quality==='performance'?66:quality==='low'?40:16,(d)=>this.updateRemotePlayers(d));this.runPerfTask('effects',now,PERF_TASK_INTERVALS.effects*slow,(d)=>{this.updateTransformationEffects(d,now);this.updateStaffLightningEffects(now);});this.runPerfTask('weather',now,PERF_TASK_INTERVALS.weather*slow,(d)=>this.animateWeather(d));this.updateCamera(delta);this.runPerfTask('hotspots',now,PERF_TASK_INTERVALS.hotspots*slow,()=>this.updateHotspots());this.renderHud();this.saveState();if(!this.webglContextLost)this.renderer.render(this.scene,this.camera);this.recordFrameCost(performance.now()-workStart,now);}catch(error){this.ensureValidWorldPosition();const msg=String(error?.message||error||'');if(/Cannot set properties of undefined|refreshMaterialUniforms/i.test(msg)){this.renderer?.resetState?.();if(now-this.runtimeErrorAt>5000){this.runtimeErrorAt=now;console.warn('Center-Materialzustand wurde bereinigt:',error);}return;}if(now-this.runtimeErrorAt>5000){this.runtimeErrorAt=now;console.warn('Center-Laufzeitfehler wurde abgefangen:',error);this.toast('Ein Weltfehler wurde abgefangen. Deine Position wurde gesichert.');}}};this.raf=requestAnimationFrame(frame);
  }

resize(){if(!this.renderer||!this.camera||this.overlay.hidden)return;const rect=this.overlay.getBoundingClientRect(),w=Math.max(1,Math.round(rect.width)),h=Math.max(1,Math.round(rect.height));this.renderer.setPixelRatio(this.performancePixelRatio());this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
}

const game=new CenterDynastyGame();
window.JKGamesCenterDynasty=Object.freeze({open:()=>game.open(),close:()=>game.close(),version:CENTER_VERSION});
if(new URLSearchParams(location.search).has('center-preview'))window.addEventListener('load',()=>setTimeout(()=>game.open(),700),{once:true});
