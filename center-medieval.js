import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';

const CENTER_VERSION = '2026-08-02-jkgames-v120-center-dynasty';
const ONLINE_MAP_ID = 'center-dynasty-valley-v1';
const WORLD_HALF = 430;
const WATER_LEVEL = -2.15;
const ONLINE_WRITE_INTERVAL_MS = 1250;
const ONLINE_HEARTBEAT_MS = 10000;
const ONLINE_STALE_MS = 26000;
const ONLINE_QUERY_LIMIT = 16;
const MAX_REMOTE_PLAYERS = 4;
const MOBILE_QUERY = '(max-width: 860px), (pointer: coarse)';
const ASSET_ROOT = './assets/cottbus/';
const MODEL_PATHS = Object.freeze({
  male: `${ASSET_ROOT}player-male.glb`,
  female: `${ASSET_ROOT}player-female.glb`,
  owner: `${ASSET_ROOT}player-owner.glb`
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
  campfire: { name: 'Lagerfeuer', icon: '🔥', wood: 6, logs: 0, stone: 2, size: 2.2, category: 'Lager' },
  house: { name: 'Wohnhaus', icon: '⌂', wood: 8, logs: 20, stone: 12, size: 6.2, category: 'Wohnen' },
  woodshed: { name: 'Holzfällerlager', icon: '🪵', wood: 6, logs: 12, stone: 6, size: 5.3, category: 'Produktion' },
  storage: { name: 'Lagerhaus', icon: '▣', wood: 8, logs: 18, stone: 14, size: 6.6, category: 'Lager' },
  well: { name: 'Brunnen', icon: '◉', wood: 5, logs: 8, stone: 16, size: 3.4, category: 'Versorgung' },
  workshop: { name: 'Werkstatt', icon: '⚒', wood: 10, logs: 25, stone: 15, size: 7, category: 'Produktion' },
  field: { name: 'Acker', icon: '▥', wood: 4, logs: 4, stone: 0, size: 8, category: 'Landwirtschaft' }
});
const RECIPES = Object.freeze({
  axe: { name: 'Steinaxt', icon: '🪓', cost: { wood: 3, stone: 2 }, durability: 100, skill: 'survival' },
  pickaxe: { name: 'Steinspitzhacke', icon: '⛏', cost: { wood: 4, stone: 4 }, durability: 100, skill: 'crafting' },
  spear: { name: 'Jagdspeer', icon: '➶', cost: { wood: 4, stone: 1 }, durability: 100, skill: 'hunting' },
  hammer: { name: 'Bauhammer', icon: '🔨', cost: { wood: 4, stone: 2 }, durability: 100, skill: 'building' },
  torch: { name: 'Fackel', icon: '🕯', cost: { wood: 2, leather: 1 }, durability: 80, skill: 'survival' },
  cookedMeat: { name: 'Gebratenes Fleisch', icon: '🍖', cost: { meat: 1, wood: 1 }, amount: 1, skill: 'survival' }
});
const SKILLS = Object.freeze({
  survival: { name: 'Überleben', icon: '⛺', text: 'Langsamerer Hunger- und Durstverlust.' },
  forestry: { name: 'Forstwirtschaft', icon: '🌲', text: 'Mehr Holz beim Fällen.' },
  mining: { name: 'Bergbau', icon: '⛏', text: 'Mehr Stein und Erz.' },
  hunting: { name: 'Jagd', icon: '➶', text: 'Mehr Fleisch und Leder.' },
  building: { name: 'Baukunst', icon: '⌂', text: 'Gebäude benötigen weniger Rohstoffe.' },
  diplomacy: { name: 'Diplomatie', icon: '♟', text: 'Bewohner lassen sich leichter anwerben.' }
});
const RESOURCE_LABELS = Object.freeze({ wood: 'Holz', logs: 'Stämme', stone: 'Stein', berries: 'Beeren', meat: 'Fleisch', cookedMeat: 'Gebratenes Fleisch', water: 'Wasser', leather: 'Leder', flax: 'Flachs', iron: 'Eisenerz', coins: 'Münzen' });
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
const nextPaint = () => new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
const distance2D = (a, b) => Math.hypot((a?.x || 0) - (b?.x || 0), (a?.z || 0) - (b?.z || 0));
const makeSessionId = () => { try { return crypto.randomUUID(); } catch { return `center-${Date.now()}-${Math.random().toString(36).slice(2)}`; } };
const isEditableTarget = (target) => !!target?.closest?.('input,textarea,select,[contenteditable="true"]');
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

function roleSnapshot() {
  const api = window.LifeBuilderSettingsMenu || window.LifeBuilderOnlineMod;
  let sessionRole = '';
  try {
    const parsed = JSON.parse(sessionStorage.getItem('lifebuilder-2026-online-mod-session') || 'null');
    if (parsed?.authorized && Number(parsed.expiresAt || 0) > Date.now()) sessionRole = String(parsed.role || '').toLowerCase();
  } catch {}
  const role = String(api?.getRole?.()?.role || sessionRole || '').toLowerCase();
  return { role, isOwner: role === 'owner' };
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
    version: 1,
    position: { x: -42, z: 176, yaw: Math.PI, view: 'third' },
    day: 1,
    season: 0,
    time: 8.25,
    weather: 'clear',
    weatherUntil: 14,
    needs: { health: 100, hunger: 92, thirst: 90, stamina: 100, warmth: 88 },
    inventory: { wood: 8, logs: 0, stone: 5, berries: 4, meat: 0, cookedMeat: 0, water: 2, leather: 0, flax: 0, iron: 0, coins: 120 },
    tools: { axe: 0, pickaxe: 0, spear: 0, hammer: 0, torch: 0 },
    xp: 0,
    skillPoints: 0,
    skills: { survival: 0, forestry: 0, mining: 0, hunting: 0, building: 0, diplomacy: 0 },
    settlement: { name: 'Waldhain', residents: 0, reputation: 0, food: 0, firewood: 0, morale: 70, taxDue: 0 },
    buildings: [],
    harvested: {},
    completedQuests: [],
    activeQuest: 'tools',
    stats: { trees: 0, rocks: 0, animals: 0, crafted: 0, built: 0, recruited: 0, distance: 0 },
    discovered: ['Siedlungsplatz'],
    lastSavedAt: Date.now()
  };
}

function normalizeSaveState(raw) {
  const base = defaultSaveState();
  if (!raw || typeof raw !== 'object') return base;
  const state = { ...base, ...raw };
  state.position = { ...base.position, ...(raw.position || {}) };
  state.needs = { ...base.needs, ...(raw.needs || {}) };
  state.inventory = { ...base.inventory, ...(raw.inventory || {}) };
  state.tools = { ...base.tools, ...(raw.tools || {}) };
  state.skills = { ...base.skills, ...(raw.skills || {}) };
  state.settlement = { ...base.settlement, ...(raw.settlement || {}) };
  state.stats = { ...base.stats, ...(raw.stats || {}) };
  state.buildings = Array.isArray(raw.buildings) ? raw.buildings.slice(0, 80).filter((entry) => entry && BUILDINGS[entry.type]) : [];
  state.harvested = raw.harvested && typeof raw.harvested === 'object' ? raw.harvested : {};
  state.completedQuests = Array.isArray(raw.completedQuests) ? [...new Set(raw.completedQuests.map(String))].slice(0, 40) : [];
  state.discovered = Array.isArray(raw.discovered) ? [...new Set(raw.discovered.map(String))].slice(0, 40) : ['Siedlungsplatz'];
  state.day = Math.max(1, Math.floor(Number(state.day) || 1));
  state.season = Math.floor(clamp(state.season, 0, 3));
  state.time = ((Number(state.time) || 8) % 24 + 24) % 24;
  state.weather = WEATHER[state.weather] ? state.weather : 'clear';
  for (const key of Object.keys(base.needs)) state.needs[key] = clamp(state.needs[key], 0, 100);
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
  let h = Math.sin(x * .021) * 2.2 + Math.cos(z * .018) * 2.4 + Math.sin((x + z) * .012) * 1.7;
  h += Math.sin(x * .006 + 1.2) * Math.cos(z * .007) * 4.2;
  const edge = Math.max(Math.abs(x), Math.abs(z));
  if (edge > 255) h += ((edge - 255) / 175) ** 1.8 * 66;
  h += gaussian(x, z, -335, -215, 120, 72);
  h += gaussian(x, z, 330, -265, 145, 85);
  h += gaussian(x, z, 280, 310, 135, 74);
  h += gaussian(x, z, -300, 295, 155, 62);
  h += gaussian(x, z, 48, -335, 110, 40);
  const riverDistance = Math.abs(x - riverCenter(z));
  h -= Math.exp(-(riverDistance ** 2) / (22 ** 2)) * 7.8;
  const clearings = [
    [-42, 176, 68, 4.2], [112, 72, 54, 5.8], [-182, -72, 58, 7.4], [174, -210, 60, 4.5], [-88, -286, 55, 8.1]
  ];
  for (const [cx, cz, radius, target] of clearings) {
    const d = Math.hypot(x - cx, z - cz);
    if (d < radius) {
      const t = (1 - d / radius) ** 2;
      h = h * (1 - t) + target * t;
    }
  }
  return h;
}

function makeTerrainGeometry(size = WORLD_HALF * 2, segments = 92) {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const colors = [];
  const indices = [];
  const color = new THREE.Color();
  for (let iz = 0; iz <= segments; iz += 1) {
    const z = -size / 2 + size * (iz / segments);
    for (let ix = 0; ix <= segments; ix += 1) {
      const x = -size / 2 + size * (ix / segments);
      const y = terrainHeightAt(x, z);
      vertices.push(x, y, z);
      const variation = clamp((y + 8) / 85, 0, 1);
      color.setHSL(.24 - variation * .03, .31, .32 + variation * .1);
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
    const initialPlayer = bridgeSnapshot();
    this.currentSlot = initialPlayer.slot;
    this.state = normalizeSaveState(initialPlayer.centerState);
    this.keys = new Set();
    this.input = { forward: 0, right: 0, sprint: false };
    this.player = null;
    this.modelPivot = null;
    this.playerModel = null;
    this.playerMixer = null;
    this.playerAction = null;
    this.playerSkin = '';
    this.walking = false;
    this.velocityY = 0;
    this.onGround = true;
    this.yaw = Number(this.state.position.yaw || Math.PI);
    this.pitch = -.12;
    this.firstPerson = this.state.position.view === 'first';
    this.lookPointerId = null;
    this.lookLast = { x: 0, y: 0 };
    this.joystickPointerId = null;
    this.joystickCenter = { x: 0, y: 0 };
    this.colliders = [];
    this.hotspots = [];
    this.resourceNodes = [];
    this.animals = [];
    this.npcs = [];
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
    this.rolePollTimer = 0;
    this.bodyOverflow = '';
    this.resizeObserver = null;
    this.loadingManager = new THREE.LoadingManager();
    this.gltfLoader = new GLTFLoader(this.loadingManager);
    this.remoteModelCache = new Map();
    this.remoteRoleCache = new Map();
    this.remotePlayers = new Map();
    this.onlineFb = null;
    this.onlineUser = null;
    this.onlineDocRef = null;
    this.onlineUnsubscribe = null;
    this.onlineHeartbeatTimer = 0;
    this.onlinePublishTimer = 0;
    this.onlineConnected = false;
    this.onlineConnecting = false;
    this.onlineSessionId = makeSessionId();
    this.presenceWriteInFlight = false;
    this.lastPresenceWriteAt = 0;
    this.lastPresenceKey = '';
    this.tmpVector = new THREE.Vector3();
    this.tmpVector2 = new THREE.Vector3();
    this.tmpBox = new THREE.Box3();
    this.worldBounds = { minX: -WORLD_HALF + 8, maxX: WORLD_HALF - 8, minZ: -WORLD_HALF + 8, maxZ: WORLD_HALF - 8 };
    this.weatherParticles = null;
    this.seasonMaterials = [];
    this.buildOverlay();
    this.installEntryPoint();
    this.bindGlobalEvents();
  }

  buildOverlay() {
    const overlay = createElement('section', 'c3d-overlay mdc-overlay is-third-person');
    overlay.id = 'centerDynastyOverlay';
    overlay.hidden = true;
    overlay.setAttribute('aria-label', 'Center – mittelalterliche Dynastie-Welt');
    overlay.innerHTML = `
      <div class="c3d-stage"><canvas aria-label="Center 3D-Spielwelt" tabindex="0"></canvas></div>
      <div class="c3d-vignette"></div><div class="c3d-crosshair" aria-hidden="true"></div>
      <header class="c3d-topbar mdc-topbar">
        <div class="c3d-brand"><span class="c3d-brand-mark">JK</span><div><small>CENTER · DYNASTIE-WELT</small><strong data-mdc-region>Das Grenztal</strong></div></div>
        <div class="mdc-world-status"><span data-mdc-season>🌱 Frühling</span><span data-mdc-day>Tag 1</span><span data-mdc-time>08:15</span><span data-mdc-weather>☀ Klar</span></div>
        <div class="c3d-top-actions">
          <div class="c3d-online-card is-connecting" data-c3d-online-card><i></i><span><small>KOOP</small><strong><b data-c3d-online-count>1</b>/4</strong></span></div>
          <button class="c3d-icon-button" type="button" data-mdc-menu title="Dorfverwaltung">☰</button>
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
          <div class="c3d-loading-online"><i></i><span data-c3d-online-status>Firebase-Koop wird vorbereitet …</span></div>
          <div class="c3d-loading-bar"><span data-c3d-loading-bar></span></div>
        </div>
      </div>
      <aside class="c3d-side-panel mdc-panel" data-c3d-panel>
        <header><div><small data-c3d-panel-kicker>VERWALTUNG</small><h2 data-c3d-panel-title>Dynastie</h2></div><button class="c3d-icon-button" type="button" data-c3d-panel-close>×</button></header>
        <div data-c3d-panel-body></div>
      </aside>
      <button class="c3d-interact mdc-interact" type="button" data-c3d-interact><kbd>E</kbd><span data-c3d-interact-label>Untersuchen</span></button>
      <div class="mdc-build-actions" data-mdc-build-actions hidden><button type="button" data-mdc-build-rotate>↻ Drehen</button><button type="button" data-mdc-build-place>✓ Bauen</button><button type="button" data-mdc-build-cancel>× Abbrechen</button></div>
      <div class="c3d-location mdc-location"><strong data-c3d-location>Siedlungsplatz</strong><span data-c3d-view-label>Außenperspektive · V wechseln</span></div>
      <div class="mdc-hotbar" data-mdc-hotbar></div>
      <div class="c3d-controls-hint mdc-controls-hint" aria-hidden="true"><span><kbd>WASD</kbd> Laufen</span><span><kbd>Shift</kbd> Sprint</span><span><kbd>E</kbd> Interagieren</span><span><kbd>M</kbd> Verwaltung</span><span><kbd>B</kbd> Bauen</span><span><kbd>V</kbd> Ansicht</span></div>
      <div class="c3d-mobile-controls mdc-mobile-controls">
        <div class="c3d-joystick" data-c3d-joystick><span class="c3d-joystick-knob" data-c3d-joystick-knob></span></div>
        <div class="c3d-mobile-actions"><button type="button" data-c3d-perspective>◉</button><button type="button" data-c3d-jump>↑</button><button type="button" data-c3d-sprint>»</button><button type="button" data-mdc-mobile-menu>☰</button><button type="button" data-mdc-mobile-build>⌂</button></div>
      </div>
      <div class="c3d-toast" data-c3d-toast></div>
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
    this.buildActions = overlay.querySelector('[data-mdc-build-actions]');
    this.seasonLabel = overlay.querySelector('[data-mdc-season]');
    this.dayLabel = overlay.querySelector('[data-mdc-day]');
    this.timeLabel = overlay.querySelector('[data-mdc-time]');
    this.weatherLabel = overlay.querySelector('[data-mdc-weather]');
    this.regionLabel = overlay.querySelector('[data-mdc-region]');
    this.compassLabel = overlay.querySelector('[data-mdc-compass]');

    overlay.querySelector('[data-c3d-close]').addEventListener('click', () => this.close());
    overlay.querySelector('[data-c3d-panel-close]').addEventListener('click', () => this.closePanel());
    overlay.querySelector('[data-mdc-menu]').addEventListener('click', () => this.openManagement('overview'));
    overlay.querySelector('[data-mdc-mobile-menu]').addEventListener('click', () => this.openManagement('overview'));
    overlay.querySelector('[data-mdc-mobile-build]').addEventListener('click', () => this.openManagement('building'));
    overlay.querySelector('[data-c3d-perspective]').addEventListener('click', () => this.togglePerspective());
    overlay.querySelector('[data-c3d-jump]').addEventListener('pointerdown', (event) => { event.preventDefault(); this.requestJump(); });
    this.sprintButton.addEventListener('pointerdown', (event) => { event.preventDefault(); this.input.sprint = !this.input.sprint; this.sprintButton.classList.toggle('is-active', this.input.sprint); });
    this.interactButton.addEventListener('click', () => this.buildMode ? this.placeBuilding() : this.activateNearestHotspot());
    overlay.querySelector('[data-mdc-build-rotate]').addEventListener('click', () => this.rotateBuildGhost());
    overlay.querySelector('[data-mdc-build-place]').addEventListener('click', () => this.placeBuilding());
    overlay.querySelector('[data-mdc-build-cancel]').addEventListener('click', () => this.cancelBuildMode());
    this.panelBody.addEventListener('click', (event) => this.handlePanelAction(event));
    this.hotbarElement.addEventListener('click', (event) => {
      const action = event.target.closest?.('[data-mdc-use]')?.dataset.mdcUse;
      if (action) this.useItem(action);
    });
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
      entry.setAttribute('aria-label', 'Center – Dynastie-Welt betreten');
      entry.title = 'Center – Dynastie-Welt betreten';
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
      const blocked = ['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','Space','KeyV','KeyE','KeyM','KeyB','KeyC','KeyI','KeyR'];
      if (blocked.includes(event.code)) event.preventDefault();
      this.keys.add(event.code);
      if (event.code === 'Space' && !event.repeat) this.requestJump();
      if (event.code === 'KeyV' && !event.repeat) this.togglePerspective();
      if (event.code === 'KeyE' && !event.repeat) this.buildMode ? this.placeBuilding() : this.activateNearestHotspot();
      if (event.code === 'KeyM' && !event.repeat) this.openManagement('overview');
      if (event.code === 'KeyI' && !event.repeat) this.openManagement('inventory');
      if (event.code === 'KeyC' && !event.repeat) this.openManagement('crafting');
      if (event.code === 'KeyB' && !event.repeat) this.openManagement('building');
      if (event.code === 'KeyR' && !event.repeat && this.buildMode) this.rotateBuildGhost();
      if (event.code === 'Escape') {
        if (this.buildMode) this.cancelBuildMode();
        else if (this.panel.classList.contains('is-open')) this.closePanel();
        else if (document.pointerLockElement === this.canvas) document.exitPointerLock?.();
        else this.close();
      }
    }, true);
    document.addEventListener('keyup', (event) => this.keys.delete(event.code), true);
    window.addEventListener('pagehide', () => { this.saveState(true); this.disconnectMultiplayer().catch(() => {}); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.opened) this.saveState(true); });
  }

  bindLookControls() {
    const start = (event) => {
      if (!this.opened || event.target.closest?.('button,.c3d-side-panel,.mdc-needs,.mdc-quest-card,.mdc-hotbar,.mdc-minimap,.c3d-topbar')) return;
      if (this.isMobile) {
        this.lookPointerId = event.pointerId;
        this.lookLast = { x: event.clientX, y: event.clientY };
        this.canvas.setPointerCapture?.(event.pointerId);
      } else if (event.button === 0) {
        this.canvas.requestPointerLock?.();
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
    const end = (event) => { if (event.pointerId === this.lookPointerId) this.lookPointerId = null; };
    this.canvas.addEventListener('pointerdown', start);
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerup', end, { passive: true });
    document.addEventListener('pointercancel', end, { passive: true });
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
    this.pitch = clamp(this.pitch - dy * sensitivity, -1.05, .62);
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
    this.loading.querySelector('h2').textContent = 'Das Grenztal entsteht';
    this.setLoading(4, 'Center-Dynastie wird vorbereitet.');
    const onlinePreparation = this.prepareMultiplayer();
    const started = performance.now();
    try {
      await nextPaint();
      if (!this.initialized) await this.initialize();
      else await this.ensureCorrectPlayerModel();
      this.restoreStateToWorld();
      this.resize();
      this.setLoading(94, 'Bewohner und Koop-Spieler werden verbunden.');
      const prepared = await Promise.race([onlinePreparation, wait(2200).then(() => null)]);
      await wait(Math.max(0, 2500 - (performance.now() - started)));
      this.setLoading(100, 'Das Grenztal ist bereit.');
      await wait(150);
      this.loading.classList.add('is-hidden');
      this.lastFrameAt = performance.now();
      this.lastRenderedAt = 0;
      this.lastNeedsAt = performance.now();
      this.startLoop();
      this.canvas.focus({ preventScroll: true });
      this.toast('Sammle Rohstoffe, fertige Werkzeuge und gründe dein Dorf.');
      this.startRolePolling();
      if (prepared) this.connectMultiplayer(prepared).catch(() => {});
      else onlinePreparation.then((late) => { if (this.opened && late) this.connectMultiplayer(late).catch(() => {}); else if (this.opened) this.setOnlineUi('offline', 'Offline-Welt aktiv.', 1); }).catch(() => this.setOnlineUi('offline', 'Offline-Welt aktiv.', 1));
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
    this.closePanel();
    if (document.pointerLockElement === this.canvas) document.exitPointerLock?.();
    this.overlay.hidden = true;
    document.body.style.overflow = this.bodyOverflow;
    clearInterval(this.rolePollTimer);
    this.rolePollTimer = 0;
  }

  async initialize() {
    this.setLoading(10, 'WebGL, Himmel und Beleuchtung werden aufgebaut.');
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(SEASONS[this.state.season].fog, .00245);
    this.camera = new THREE.PerspectiveCamera(62, 1, .08, 1150);
    this.camera.rotation.order = 'YXZ';
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, powerPreference: 'high-performance', alpha: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.shadowMap.enabled = false;
    this.buildSkyAndLights();
    await nextPaint();
    this.setLoading(22, 'Eine große Landschaft mit Bergen und Flusstal wird geformt.');
    this.buildTerrain();
    this.buildWater();
    await nextPaint();
    this.setLoading(38, 'Straßen, Brücken und Dörfer entstehen.');
    this.buildRoadNetwork();
    this.buildVillages();
    await nextPaint();
    this.setLoading(55, 'Wälder, Felsen und sammelbare Rohstoffe werden verteilt.');
    this.buildResources();
    await nextPaint();
    this.setLoading(70, 'Wildtiere und Bewohner ziehen in das Tal.');
    this.buildWildlife();
    this.buildLandmarks();
    this.buildSavedSettlement();
    this.buildPlayerRoot();
    await this.ensureCorrectPlayerModel();
    this.buildWeatherParticles();
    this.applySeasonVisuals(true);
    this.initialized = true;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.overlay);
    this.setLoading(88, 'Steuerung, Überleben und Dorfverwaltung werden aktiviert.');
  }

  buildSkyAndLights() {
    const geometry = new THREE.SphereGeometry(980, 28, 18);
    this.skyMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: { topColor: { value: new THREE.Color(0x679bca) }, bottomColor: { value: new THREE.Color(0xe2c993) }, offset: { value: 22 }, exponent: { value: .72 } },
      vertexShader: 'varying vec3 vWorldPosition;void main(){vec4 wp=modelMatrix*vec4(position,1.0);vWorldPosition=wp.xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: 'uniform vec3 topColor;uniform vec3 bottomColor;uniform float offset;uniform float exponent;varying vec3 vWorldPosition;void main(){float h=normalize(vWorldPosition+offset).y;gl_FragColor=vec4(mix(bottomColor,topColor,max(pow(max(h,0.0),exponent),0.0)),1.0);}'
    });
    this.sky = new THREE.Mesh(geometry, this.skyMaterial);
    this.scene.add(this.sky);
    this.hemisphere = new THREE.HemisphereLight(0xd4e8ff, 0x5c503b, 1.8);
    this.scene.add(this.hemisphere);
    this.sun = new THREE.DirectionalLight(0xffdd9b, 3.2);
    this.scene.add(this.sun);
    this.moon = new THREE.DirectionalLight(0x9fb9e8, 0);
    this.scene.add(this.moon);
    this.scene.add(new THREE.AmbientLight(0xffffff, .18));
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
    const segments = 82;
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

  addColliderFromCenter(x, z, halfW, halfD, rotation = 0, source = 'world') {
    const radius = Math.max(halfW, halfD) + Math.abs(Math.sin(rotation)) * 1.5;
    this.colliders.push({ x, z, radius, source });
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
    const matrix = new THREE.Matrix4();
    const scale = visible ? node.scale : 0.0001;
    const rotation = new THREE.Quaternion();
    if (node.type === 'tree') {
      const yaw = (node.instanceIndex * 1.618) % (Math.PI*2);
      rotation.setFromAxisAngle(new THREE.Vector3(0,1,0),yaw);
      matrix.compose(new THREE.Vector3(node.x,node.y+2.15*node.scale,node.z),rotation,new THREE.Vector3(scale,scale,scale));
      node.instanceMeshes[0].setMatrixAt(node.instanceIndex,matrix);
      matrix.compose(new THREE.Vector3(node.x,node.y+5.45*node.scale,node.z),rotation,new THREE.Vector3(scale,scale,scale));
      node.instanceMeshes[1].setMatrixAt(node.instanceIndex,matrix);
    } else if (node.type === 'rock') {
      rotation.setFromEuler(new THREE.Euler(node.instanceIndex*.17,node.instanceIndex*.39,node.instanceIndex*.11));
      matrix.compose(new THREE.Vector3(node.x,node.y+.65*node.scale,node.z),rotation,new THREE.Vector3(scale*1.15,scale*.8,scale));
      node.instanceMeshes[0].setMatrixAt(node.instanceIndex,matrix);
    } else {
      matrix.compose(new THREE.Vector3(node.x,node.y+.75*node.scale,node.z),rotation,new THREE.Vector3(scale*1.4,scale*.85,scale));
      node.instanceMeshes[0].setMatrixAt(node.instanceIndex,matrix);
    }
    node.instanceMeshes.forEach((mesh) => { mesh.instanceMatrix.needsUpdate = true; });
    node.active = visible;
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
    const random = seededRandom(314159);
    const types = ['deer','deer','boar','deer','wolf','boar','deer','wolf'];
    for (let i=0;i<24;i+=1) {
      const type = types[i % types.length];
      let x=(random()*2-1)*340,z=(random()*2-1)*340;
      if (Math.abs(x-riverCenter(z))<20) x+=35;
      const animal=this.createAnimal(type,x,z,i);
      this.animals.push(animal);
    }
  }

  createAnimal(type,x,z,index) {
    const group=new THREE.Group();
    const colors={deer:0x8b633f,boar:0x4a3a31,wolf:0x6d716f};
    const body=new THREE.Mesh(new THREE.CapsuleGeometry(type==='wolf'?.55:.7,1.35,3,7),new THREE.MeshStandardMaterial({color:colors[type],roughness:1}));
    body.rotation.z=Math.PI/2; body.position.y=1.25; group.add(body);
    const head=new THREE.Mesh(new THREE.SphereGeometry(type==='boar'?.52:.42,7,5),body.material);
    head.position.set(1.2,1.35,0); group.add(head);
    for(const sx of [-.65,.65]) for(const sz of [-.33,.33]) { const leg=new THREE.Mesh(new THREE.CylinderGeometry(.09,.12,.9,5),body.material); leg.position.set(sx,.48,sz); group.add(leg); }
    if(type==='deer') { for(const sz of [-.18,.18]) { const antler=new THREE.Mesh(new THREE.CylinderGeometry(.035,.055,.85,4),new THREE.MeshStandardMaterial({color:0x57402d})); antler.position.set(1.33,2.05,sz); antler.rotation.z=-.28; group.add(antler); } }
    group.position.set(x,terrainHeightAt(x,z),z);
    this.scene.add(group);
    return {id:`animal-${index}`,type,group,x,z,targetX:x,targetZ:z,speed:type==='wolf'?2.5:1.5,nextTurn:0,active:true,respawnAt:0};
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
  }

  createNpc(name,x,z,village,index) {
    const group=this.makeFallbackCharacter(index%2?'female':'male', index%3);
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
      for(let i=0;i<7;i+=1) { const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.32,0),stone); const a=i/7*Math.PI*2; rock.position.set(Math.cos(a)*1.05,.25,Math.sin(a)*1.05); group.add(rock); }
      for(const r of [-.45,.45]) { const log=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,2.1,6),wood); log.rotation.z=Math.PI/2; log.rotation.y=r; log.position.y=.35; group.add(log); }
      const flame=new THREE.Mesh(new THREE.ConeGeometry(.5,1.4,7),new THREE.MeshStandardMaterial({color:ghost?0x69c981:0xff8b2f,emissive:ghost?0x225b31:0xff3c00,emissiveIntensity:1.5,transparent,opacity:alpha})); flame.position.y=1; group.add(flame); group.userData.flame=flame;
    } else if(type==='well') {
      const base=new THREE.Mesh(new THREE.CylinderGeometry(2,2.2,1.2,12),stone); base.position.y=.6; group.add(base);
      for(const sx of [-1,1]) { const post=new THREE.Mesh(new THREE.BoxGeometry(.25,3.4,.25),wood); post.position.set(sx*1.55,2,0); group.add(post); }
      const beam=new THREE.Mesh(new THREE.BoxGeometry(3.6,.25,.25),wood); beam.position.y=3.6; group.add(beam);
    } else if(type==='field') {
      const soil=new THREE.Mesh(new THREE.BoxGeometry(12,.22,9),new THREE.MeshStandardMaterial({color:ghost?0x69c981:0x4d3422,transparent,opacity:alpha})); soil.position.y=.11; group.add(soil);
      for(let ix=-5;ix<=5;ix+=1.1) for(let iz=-3.5;iz<=3.5;iz+=1.3) { const crop=new THREE.Mesh(new THREE.ConeGeometry(.07,.55,4),new THREE.MeshStandardMaterial({color:ghost?0x69c981:0xb4a049,transparent,opacity:alpha})); crop.position.set(ix,.35,iz); group.add(crop); }
    } else {
      const large=type==='storage'||type==='workshop';
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
    const labels={house:'Haus betreten und schlafen',campfire:'Am Lagerfeuer kochen',well:'Wasser aus dem Brunnen holen',storage:'Lagerhaus verwalten',workshop:'Werkstatt benutzen',woodshed:'Holzfällerlager verwalten',field:'Acker bewirtschaften'};
    this.hotspots.push({id:`build-${saved.id}`,type:`own-${saved.type}`,x:saved.x,z:saved.z,radius:BUILDINGS[saved.type].size*.72,label:labels[saved.type]||'Gebäude verwalten',data:saved});
  }

  buildPlayerRoot() {
    this.player=new THREE.Group();
    this.modelPivot=new THREE.Group();
    this.player.add(this.modelPivot);
    this.scene.add(this.player);
  }

  async ensureCorrectPlayerModel() {
    const role=roleSnapshot();
    const player=bridgeSnapshot();
    const skin=role.isOwner?'owner':player.gender;
    if(this.playerSkin===skin&&this.playerModel) { this.updateRoleHud(); return; }
    this.modelPivot.clear(); this.playerModel=null; this.playerMixer=null; this.playerAction=null;
    try {
      const gltf=await this.gltfLoader.loadAsync(MODEL_PATHS[skin]||MODEL_PATHS.male);
      const root=gltf.scene;
      root.updateMatrixWorld(true);
      const box=new THREE.Box3().setFromObject(root); const height=Math.max(.01,box.max.y-box.min.y);
      root.scale.multiplyScalar((skin==='owner'?1.86:1.76)/height); root.updateMatrixWorld(true);
      const scaled=new THREE.Box3().setFromObject(root); const center=scaled.getCenter(new THREE.Vector3());
      root.position.x-=center.x; root.position.z-=center.z; root.position.y-=scaled.min.y; root.rotation.y=Math.PI;
      root.traverse((object)=>{if(object.isMesh){object.castShadow=false;object.receiveShadow=false;const mats=Array.isArray(object.material)?object.material:[object.material];mats.forEach((m)=>{if(m?.map)m.map.colorSpace=THREE.SRGBColorSpace;if(m)m.envMapIntensity=.25;});}});
      this.playerModel=root; this.modelPivot.add(root);
      if(gltf.animations?.length){this.playerMixer=new THREE.AnimationMixer(root);this.playerAction=this.playerMixer.clipAction(gltf.animations[0]);this.playerAction.play();this.playerMixer.timeScale=0;}
    } catch(error) { console.warn('Center-Charaktermodell konnte nicht geladen werden',error); this.playerModel=this.makeFallbackCharacter(skin); this.modelPivot.add(this.playerModel); }
    this.playerSkin=skin; this.updateRoleHud(); this.applyPerspectiveVisibility();
  }

  makeFallbackCharacter(skin='male',variant=0) {
    const group=new THREE.Group();
    const colors=skin==='owner'?[0x20211f,0x9a7a3c]:skin==='female'?[0x684f7a,0xd3a786]:[0x435f69,0xb88869];
    const body=new THREE.Mesh(new THREE.CapsuleGeometry(.36,.85,4,8),new THREE.MeshStandardMaterial({color:colors[0],roughness:.85})); body.position.y=1.05; group.add(body);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.27,12,8),new THREE.MeshStandardMaterial({color:colors[1],roughness:.9})); head.position.y=1.92; group.add(head);
    const hair=new THREE.Mesh(new THREE.SphereGeometry(.285,10,6,0,Math.PI*2,0,Math.PI*.58),new THREE.MeshStandardMaterial({color:variant%2?0x5a3824:0x2e241f})); hair.position.y=1.98; group.add(hair);
    for(const sx of [-1,1]) { const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.11,.65,3,6),body.material); arm.position.set(sx*.48,1.13,0); arm.rotation.z=sx*.12; group.add(arm); const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.13,.72,3,6),new THREE.MeshStandardMaterial({color:0x3d332e})); leg.position.set(sx*.2,.35,0); group.add(leg); }
    return group;
  }

  updateRoleHud() {
    const role=roleSnapshot();
    this.overlay.classList.toggle('is-owner',role.isOwner);
  }

  reloadLatestSave() {
    const latest = bridgeSnapshot();
    const nextState = normalizeSaveState(latest.centerState);
    const changedSlot = latest.slot !== this.currentSlot;
    this.currentSlot = latest.slot;
    this.state = nextState;
    this.yaw = Number(this.state.position.yaw || Math.PI);
    this.firstPerson = this.state.position.view === 'first';
    if (this.initialized) {
      for (const object of this.ownBuildingObjects.values()) object.removeFromParent();
      this.ownBuildingObjects.clear();
      this.hotspots = this.hotspots.filter((hotspot) => !String(hotspot.id || '').startsWith('build-'));
      this.colliders = this.colliders.filter((collider) => collider.source !== 'owned');
      this.buildSavedSettlement();
      this.restoreHarvestedNodes();
      if (changedSlot) this.toast(`Spielstand ${latest.slot + 1} geladen.`);
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
  }

  saveState(force=false) {
    if(!this.player) return;
    const now=Date.now();
    if(!force&&now-this.lastSaveAt<5000) return;
    this.lastSaveAt=now;
    this.state.position={x:Number(this.player.position.x.toFixed(2)),z:Number(this.player.position.z.toFixed(2)),yaw:Number(this.yaw.toFixed(4)),view:this.firstPerson?'first':'third'};
    this.state.lastSavedAt=now;
    const bridge=window.JKGamesCenterBridge;
    if(bridge?.saveCenterState) bridge.saveCenterState(this.state);
    else { try{localStorage.setItem('jk-games-center-medieval',JSON.stringify(this.state));}catch{} }
  }

  togglePerspective() { this.firstPerson=!this.firstPerson; this.applyPerspectiveVisibility(); this.toast(this.firstPerson?'Ego-Perspektive':'Außenperspektive'); }
  applyPerspectiveVisibility() { this.overlay.classList.toggle('is-first-person',this.firstPerson); this.overlay.classList.toggle('is-third-person',!this.firstPerson); if(this.playerModel)this.playerModel.visible=!this.firstPerson; if(this.viewLabel)this.viewLabel.textContent=`${this.firstPerson?'Ego':'Außen'}perspektive · V wechseln`; }
  requestJump() { if(this.onGround&&this.state.needs.stamina>8){this.velocityY=5.8;this.onGround=false;this.state.needs.stamina=Math.max(0,this.state.needs.stamina-5);} }

  currentInput() {
    const forward=(this.keys.has('KeyW')||this.keys.has('ArrowUp')?1:0)-(this.keys.has('KeyS')||this.keys.has('ArrowDown')?1:0)+this.input.forward;
    const right=(this.keys.has('KeyD')||this.keys.has('ArrowRight')?1:0)-(this.keys.has('KeyA')||this.keys.has('ArrowLeft')?1:0)+this.input.right;
    return {forward:clamp(forward,-1,1),right:clamp(right,-1,1),sprint:this.input.sprint||this.keys.has('ShiftLeft')||this.keys.has('ShiftRight')};
  }

  collides(x,z) { return this.colliders.some((c)=>Math.hypot(x-c.x,z-c.z)<c.radius+1); }

  updateMovement(delta) {
    const input=this.currentInput();
    const length=Math.hypot(input.forward,input.right);
    let moving=length>.05;
    const inWater=this.isInWater(this.player.position.x,this.player.position.z);
    let sprint=input.sprint&&this.state.needs.stamina>2&&!inWater;
    const speed=(sprint?8.8:5.1)*(inWater?.48:1)*(this.state.needs.health<25?.72:1);
    if(moving) {
      const f=input.forward/Math.max(1,length),r=input.right/Math.max(1,length);
      const sin=Math.sin(this.yaw),cos=Math.cos(this.yaw);
      const dx=(r*cos-f*sin)*speed*delta;
      const dz=(-r*sin-f*cos)*speed*delta;
      const nx=clamp(this.player.position.x+dx,this.worldBounds.minX,this.worldBounds.maxX);
      const nz=clamp(this.player.position.z+dz,this.worldBounds.minZ,this.worldBounds.maxZ);
      if(!this.collides(nx,nz)) { this.player.position.x=nx; this.player.position.z=nz; this.state.stats.distance+=Math.hypot(dx,dz); }
      const targetYaw=Math.atan2(dx,dz);
      if(Math.hypot(dx,dz)>.001)this.modelPivot.rotation.y=lerpAngle(this.modelPivot.rotation.y,targetYaw,Math.min(1,delta*11));
      if(sprint)this.state.needs.stamina=Math.max(0,this.state.needs.stamina-delta*10.5); else this.state.needs.stamina=Math.min(100,this.state.needs.stamina+delta*3.2);
    } else this.state.needs.stamina=Math.min(100,this.state.needs.stamina+delta*6.3);
    this.velocityY-=15.5*delta;
    this.player.position.y+=this.velocityY*delta;
    const ground=Math.max(terrainHeightAt(this.player.position.x,this.player.position.z),inWater?WATER_LEVEL-1.05:-999);
    if(this.player.position.y<=ground){this.player.position.y=ground;this.velocityY=0;this.onGround=true;}
    this.walking=moving;
    if(this.playerMixer){const desired=moving?(sprint?1.45:1):0;this.playerMixer.timeScale+=(desired-this.playerMixer.timeScale)*Math.min(1,delta*7);this.playerMixer.update(delta);}
    if(this.buildMode)this.updateBuildGhost();
  }

  isInWater(x,z) { const river=Math.abs(x-riverCenter(z))<14.5; const lake=Math.hypot(x-188,(z+185)/.72)<48; return river||lake; }

  updateCamera(delta,snap=false) {
    const head=this.tmpVector.set(this.player.position.x,this.player.position.y+1.65,this.player.position.z);
    if(this.firstPerson){this.camera.position.copy(head);this.camera.rotation.set(this.pitch,this.yaw,0);return;}
    const distance=6.6,height=2.65;
    const cp=Math.cos(this.pitch),sp=Math.sin(this.pitch),sy=Math.sin(this.yaw),cy=Math.cos(this.yaw);
    const target=this.tmpVector2.set(head.x+sy*cp*distance,head.y+height+sp*distance,head.z+cy*cp*distance);
    const terrainY=terrainHeightAt(target.x,target.z)+.7;
    if(target.y<terrainY)target.y=terrainY;
    const amount=snap?1:1-Math.exp(-delta*10);
    this.camera.position.lerp(target,amount);this.camera.lookAt(head.x,head.y+.15,head.z);
  }
  snapCamera(){this.updateCamera(.016,true);}

  updateWorldTime(delta) {
    const speed=2.25;
    this.state.time+=delta*speed/60;
    if(this.state.time>=24){this.state.time-=24;this.state.day+=1;this.dailySettlementTick();if((this.state.day-1)%3===0){this.state.season=(this.state.season+1)%4;this.applySeasonVisuals();this.toast(`${SEASONS[this.state.season].icon} ${SEASONS[this.state.season].name} hat begonnen.`);}}
    if(this.state.time>=this.state.weatherUntil)this.chooseWeather();
    const angle=(this.state.time/24)*Math.PI*2-Math.PI/2;
    this.sun.position.set(Math.cos(angle)*180,Math.sin(angle)*210,Math.sin(angle*.7)*120);
    const daylight=clamp(Math.sin(angle)*.65+.42,.04,1);
    this.sun.intensity=daylight*3.6;this.moon.intensity=(1-daylight)*.65;
    this.hemisphere.intensity=.35+daylight*1.55;
    this.moon.position.copy(this.sun.position).multiplyScalar(-1);
    const season=SEASONS[this.state.season];
    const nightColor=new THREE.Color(0x13233c),dayColor=new THREE.Color(season.sky);
    this.skyMaterial.uniforms.topColor.value.copy(nightColor).lerp(dayColor,daylight);
    this.skyMaterial.uniforms.bottomColor.value.set(0x2a3040).lerp(new THREE.Color(0xe1c895),daylight);
    this.renderer.toneMappingExposure=.55+daylight*.62;
    if(this.waterMaterials) this.waterMaterials.forEach((m)=>{m.opacity=.62+daylight*.2;});
  }

  chooseWeather() {
    const season=SEASONS[this.state.season].id;
    const roll=Math.random();
    let weather='clear';
    if(season==='winter') weather=roll<.42?'snow':roll<.66?'cloudy':roll<.78?'storm':'clear';
    else weather=roll<.16?'rain':roll<.23?'storm':roll<.48?'cloudy':'clear';
    this.state.weather=weather;this.state.weatherUntil=this.state.time+3+Math.random()*6;
    if(this.state.weatherUntil>=24)this.state.weatherUntil-=24;
    this.updateWeatherParticles();
    this.toast(`${WEATHER[weather].icon} Wetterwechsel: ${WEATHER[weather].name}`);
  }

  updateNeeds(delta) {
    const survival=this.state.skills.survival||0;
    const weather=WEATHER[this.state.weather];
    const factor=(1-survival*.075)*weather.drain;
    this.state.needs.hunger=Math.max(0,this.state.needs.hunger-delta*.035*factor);
    this.state.needs.thirst=Math.max(0,this.state.needs.thirst-delta*.052*factor);
    const hour=this.state.time;
    const baseTemp=SEASONS[this.state.season].temp+weather.temp+(hour<6||hour>20?-5:0);
    const nearFire=this.nearOwnedBuilding('campfire',8)||Math.hypot(this.player.position.x+40,this.player.position.z-177)<8;
    const warmthTarget=nearFire?100:clamp(70+baseTemp*2.2,0,100);
    this.state.needs.warmth+=(warmthTarget-this.state.needs.warmth)*Math.min(1,delta*.025);
    if(this.state.needs.hunger<=0||this.state.needs.thirst<=0||this.state.needs.warmth<8)this.state.needs.health=Math.max(0,this.state.needs.health-delta*.22);
    else if(this.state.needs.hunger>55&&this.state.needs.thirst>55)this.state.needs.health=Math.min(100,this.state.needs.health+delta*.025);
    if(this.state.needs.health<=0)this.respawnAfterCollapse();
  }

  nearOwnedBuilding(type,radius) { return this.state.buildings.some((b)=>b.type===type&&Math.hypot(this.player.position.x-b.x,this.player.position.z-b.z)<radius); }

  respawnAfterCollapse() {
    this.toast('Du bist zusammengebrochen und wachst im Lager wieder auf.');
    this.player.position.set(-42,terrainHeightAt(-42,176),176);
    this.state.needs={health:45,hunger:35,thirst:35,stamina:60,warmth:60};
    this.state.inventory.coins=Math.max(0,this.state.inventory.coins-20);
  }

  dailySettlementTick() {
    const s=this.state.settlement;
    const houses=this.state.buildings.filter((b)=>b.type==='house').length;
    const fields=this.state.buildings.filter((b)=>b.type==='field').length;
    const woodsheds=this.state.buildings.filter((b)=>b.type==='woodshed').length;
    s.food+=fields*5;
    s.firewood+=woodsheds*6;
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
    const random=Math.random;
    for(const animal of this.animals){
      if(!animal.active){if(animal.respawnAt&&Date.now()>animal.respawnAt){animal.active=true;animal.group.visible=true;animal.x=(random()*2-1)*330;animal.z=(random()*2-1)*330;}else continue;}
      if(now>animal.nextTurn||Math.hypot(animal.targetX-animal.x,animal.targetZ-animal.z)<2){animal.nextTurn=now+2500+random()*6000;const a=random()*Math.PI*2;animal.targetX=clamp(animal.x+Math.cos(a)*(18+random()*35),-370,370);animal.targetZ=clamp(animal.z+Math.sin(a)*(18+random()*35),-370,370);}
      const dx=animal.targetX-animal.x,dz=animal.targetZ-animal.z,d=Math.hypot(dx,dz)||1;
      const speed=animal.speed*(distance2D(animal,this.player)<10?2.3:1);
      animal.x+=dx/d*speed*delta;animal.z+=dz/d*speed*delta;
      animal.group.position.set(animal.x,terrainHeightAt(animal.x,animal.z),animal.z);animal.group.rotation.y=Math.atan2(dx,dz);
      animal.group.children.forEach((child,index)=>{if(child.geometry?.type==='CylinderGeometry')child.rotation.x=Math.sin(now*.008+index)*.35;});
    }
  }

  updateNpcs(delta,now) {
    for(const npc of this.npcs){npc.angle+=delta*.08;const base=this.villages.find((v)=>v.name===npc.village);if(!base)continue;const radius=8+(npc.name.length%5);const tx=base.x+Math.cos(npc.angle)*radius,tz=base.z+Math.sin(npc.angle)*radius;npc.x+=(tx-npc.x)*delta*.15;npc.z+=(tz-npc.z)*delta*.15;npc.group.position.set(npc.x,terrainHeightAt(npc.x,npc.z),npc.z);npc.group.rotation.y=Math.atan2(tx-npc.x,tz-npc.z);const hotspot=this.hotspots.find((h)=>h.id===npc.id);if(hotspot){hotspot.x=npc.x;hotspot.z=npc.z;}}
  }

  updateHotspots() {
    if(!this.player)return;
    const px=this.player.position.x,pz=this.player.position.z;
    let nearest=null,best=Infinity;
    for(const node of this.resourceNodes){
      if(!node.active)continue;const d=Math.hypot(px-node.x,pz-node.z);if(d<4.1&&d<best){best=d;nearest={id:node.id,type:node.type,x:node.x,z:node.z,label:node.type==='tree'?'Baum bearbeiten':node.type==='rock'?'Felsen abbauen':'Beerenstrauch sammeln',data:node};}
    }
    for(const animal of this.animals){if(!animal.active)continue;const d=Math.hypot(px-animal.x,pz-animal.z);if(d<5&&d<best){best=d;nearest={id:animal.id,type:'animal',x:animal.x,z:animal.z,label:`${animal.type==='deer'?'Rotwild':animal.type==='boar'?'Wildschwein':'Wolf'} jagen`,data:animal};}}
    for(const hotspot of this.hotspots){const d=Math.hypot(px-hotspot.x,pz-hotspot.z);if(d<(hotspot.radius||4)&&d<best){best=d;nearest=hotspot;}}
    if(this.buildMode){nearest={id:'build-place',type:'build-place',label:`${BUILDINGS[this.buildMode].name} errichten`};}
    this.nearestHotspot=nearest;
    this.interactButton.classList.toggle('is-visible',!!nearest);
    if(nearest)this.interactLabel.textContent=nearest.label;
    const region=this.locationFromPosition(px,pz);
    this.locationLabel.textContent=region;
    this.regionLabel.textContent=region;
  }

  locationFromPosition(x,z) {
    const places=[['Siedlungsplatz',-42,176,65],['Falkenau',112,72,58],['Steinfurt',-182,-72,62],['Seehof',174,-210,64],['Hochwald',-88,-286,58],['Ruinen von Altmark',48,-335,45],['Nordpass',286,305,62],['Bärenhöhle',-303,294,55]];
    for(const [name,cx,cz,r] of places)if(Math.hypot(x-cx,z-cz)<r){this.discover(name);return name;}
    if(terrainHeightAt(x,z)>35)return 'Bergland';
    if(Math.abs(x-riverCenter(z))<30)return 'Grenzfluss';
    return 'Das Grenztal';
  }

  discover(name) { if(!this.state.discovered.includes(name)){this.state.discovered.push(name);this.gainXp(10,`${name} entdeckt`);this.toast(`Neuer Ort entdeckt: ${name}`);} }

  activateNearestHotspot() {
    const hotspot=this.nearestHotspot;if(!hotspot)return;
    switch(hotspot.type){
      case 'tree':return this.harvestTree(hotspot.data);
      case 'rock':return this.harvestRock(hotspot.data);
      case 'bush':return this.harvestBush(hotspot.data);
      case 'water':case 'well':case 'own-well':return this.collectWater();
      case 'animal':return this.huntAnimal(hotspot.data);
      case 'npc':return this.talkToNpc(hotspot.data);
      case 'market':return this.openTrade(hotspot.data?.village||'Markt');
      case 'village':return this.openVillageInfo(hotspot.data?.village);
      case 'sleep':case 'own-house':return this.sleepUntilMorning();
      case 'campfire':case 'own-campfire':return this.openManagement('crafting');
      case 'own-storage':return this.openManagement('inventory');
      case 'own-workshop':return this.openManagement('crafting');
      case 'own-woodshed':return this.collectProduction('wood');
      case 'own-field':return this.collectProduction('food');
      case 'cave':return this.exploreCave();
      case 'landmark':return this.openInfo(hotspot.data?.title||'Ort',hotspot.data?.text||'');
      case 'build-place':return this.placeBuilding();
      default:return this.openManagement('overview');
    }
  }

  useTool(name,amount=1) {
    if((this.state.tools[name]||0)<=0)return false;
    this.state.tools[name]=Math.max(0,this.state.tools[name]-amount);
    if(this.state.tools[name]<=0)this.toast(`${RECIPES[name]?.name||name} ist zerbrochen.`);
    return true;
  }

  harvestTree(node) {
    const forestry=this.state.skills.forestry||0;
    if(!this.useTool('axe',4)){this.state.inventory.wood+=1;this.state.needs.stamina=Math.max(0,this.state.needs.stamina-5);this.toast('Ohne Axt sammelst du nur einen trockenen Ast.');this.gainXp(1,'Überleben');return;}
    const logs=3+Math.floor(forestry/2),wood=2+forestry;
    this.state.inventory.logs+=logs;this.state.inventory.wood+=wood;this.state.stats.trees+=1;this.state.needs.stamina=Math.max(0,this.state.needs.stamina-9);
    this.harvestNode(node,150000);this.gainXp(8+forestry*2,'Forstwirtschaft');this.toast(`+${logs} Stämme · +${wood} Holz`);this.checkQuestProgress();
  }

  harvestRock(node) {
    const mining=this.state.skills.mining||0;
    if(!this.useTool('pickaxe',5)){this.toast('Du brauchst eine Spitzhacke.');return;}
    const stone=3+mining,iron=Math.random()<.2+mining*.08?1:0;
    this.state.inventory.stone+=stone;this.state.inventory.iron+=iron;this.state.stats.rocks+=1;this.state.needs.stamina=Math.max(0,this.state.needs.stamina-10);
    this.harvestNode(node,180000);this.gainXp(9+mining*2,'Bergbau');this.toast(`+${stone} Stein${iron?' · +1 Eisenerz':''}`);
  }

  harvestBush(node) {
    const berries=2+Math.floor(Math.random()*4),flax=Math.random()<.45?1:0;
    this.state.inventory.berries+=berries;this.state.inventory.flax+=flax;this.harvestNode(node,90000);this.gainXp(3,'Sammeln');this.toast(`+${berries} Beeren${flax?' · +1 Flachs':''}`);
  }

  harvestNode(node,respawnMs) { this.setResourceVisible(node,false);this.state.harvested[node.id]=Date.now()+respawnMs; }

  collectWater() { this.state.inventory.water+=3;this.state.needs.thirst=Math.min(100,this.state.needs.thirst+14);this.gainXp(2,'Versorgung');this.toast('+3 Wasser · Durst gestillt'); }

  huntAnimal(animal) {
    if(!this.useTool('spear',8)){this.toast('Du brauchst einen Jagdspeer.');return;}
    const hunting=this.state.skills.hunting||0;
    if(animal.type==='wolf'&&Math.random()>.58+hunting*.06){this.state.needs.health=Math.max(0,this.state.needs.health-18);this.state.needs.stamina=Math.max(0,this.state.needs.stamina-15);this.toast('Der Wolf verletzt dich und entkommt.');animal.targetX+=30;return;}
    const meat=(animal.type==='deer'?4:animal.type==='boar'?5:2)+hunting;
    const leather=(animal.type==='deer'?2:1)+Math.floor(hunting/2);
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
    this.openPanel('DORF',name,`<div class="mdc-village-hero"><strong>${name}</strong><span>${village.people.length} bekannte Bewohner · Markt · Brunnen · Felder</span></div><p>Ein eigenständiges Dorf im Grenztal. Hier kannst du handeln, Aufgaben annehmen und neue Bewohner für Waldhain gewinnen.</p><button data-mdc-action="open-map">Auf Karte anzeigen</button>`);
  }

  exploreCave() {
    if(this.state.tools.torch<=0){this.toast('Für die dunkle Höhle brauchst du eine Fackel.');return;}
    this.useTool('torch',6);const stone=4+Math.floor(Math.random()*5),iron=1+Math.floor(Math.random()*3);this.state.inventory.stone+=stone;this.state.inventory.iron+=iron;this.state.needs.stamina=Math.max(0,this.state.needs.stamina-18);this.gainXp(18,'Höhle erkundet');this.toast(`Höhlenfund: +${stone} Stein · +${iron} Eisenerz`);
  }

  sleepUntilMorning() {
    this.state.day+=1;if((this.state.day-1)%3===0){this.state.season=(this.state.season+1)%4;this.applySeasonVisuals();}
    this.state.time=7;this.state.needs.stamina=100;this.state.needs.health=Math.min(100,this.state.needs.health+18);this.state.needs.hunger=Math.max(0,this.state.needs.hunger-10);this.state.needs.thirst=Math.max(0,this.state.needs.thirst-8);this.dailySettlementTick();this.toast(`Tag ${this.state.day} beginnt.`);this.renderHud(true);
  }

  collectProduction(kind) {
    if(kind==='wood'){this.state.inventory.logs+=4;this.state.settlement.firewood+=5;this.toast('+4 Stämme · +5 Dorf-Feuerholz');}
    else {this.state.settlement.food+=6;this.state.inventory.flax+=2;this.toast('+6 Dorfnahrung · +2 Flachs');}
    this.gainXp(7,'Dorfproduktion');
  }

  useItem(item) {
    if(item==='berries'){if(this.state.inventory.berries<1)return this.toast('Keine Beeren.');this.state.inventory.berries-=1;this.state.needs.hunger=Math.min(100,this.state.needs.hunger+9);}
    if(item==='cookedMeat'){if(this.state.inventory.cookedMeat<1)return this.toast('Kein gebratenes Fleisch.');this.state.inventory.cookedMeat-=1;this.state.needs.hunger=Math.min(100,this.state.needs.hunger+32);this.state.needs.health=Math.min(100,this.state.needs.health+4);}
    if(item==='water'){if(this.state.inventory.water<1)return this.toast('Kein Wasser.');this.state.inventory.water-=1;this.state.needs.thirst=Math.min(100,this.state.needs.thirst+30);}
    this.renderHud(true);this.saveState();
  }

  gainXp(amount,reason='Center') {
    const value=Math.max(0,Math.floor(Number(amount)||0));if(!value)return;
    this.state.xp+=value;
    while(this.state.xp>=100+this.state.skillPoints*35){this.state.xp-=100+this.state.skillPoints*35;this.state.skillPoints+=1;this.toast('Neuer Fähigkeitspunkt erhalten.');}
    window.JKGamesCenterBridge?.addMainXp?.(Math.max(1,Math.round(value*.25)),reason);
  }

  craft(recipeId) {
    const recipe=RECIPES[recipeId];if(!recipe)return;
    if(!this.hasCost(recipe.cost)){this.toast('Nicht genügend Rohstoffe.');return;}
    this.payCost(recipe.cost);
    if(recipeId==='cookedMeat')this.state.inventory.cookedMeat+=recipe.amount||1;else this.state.tools[recipeId]=Math.min(100,(this.state.tools[recipeId]||0)+recipe.durability);
    this.state.stats.crafted+=1;this.gainXp(8,`Herstellung: ${recipe.name}`);this.toast(`${recipe.name} hergestellt.`);this.openManagement('crafting');this.checkQuestProgress();
  }

  hasCost(cost,discount=false) { return Object.entries(cost||{}).every(([key,value])=>(this.state.inventory[key]||0)>=this.adjustCost(value,discount)); }
  payCost(cost,discount=false) { for(const [key,value] of Object.entries(cost||{}))this.state.inventory[key]=Math.max(0,(this.state.inventory[key]||0)-this.adjustCost(value,discount)); }
  adjustCost(value,discount=false) { const level=discount?(this.state.skills.building||0):0;return Math.max(value>0?1:0,Math.ceil(Number(value||0)*(1-level*.07))); }

  beginBuildMode(type) {
    if(!BUILDINGS[type])return;
    if(type!=='campfire'&&this.state.tools.hammer<=0){this.toast('Du brauchst einen Bauhammer.');return;}
    const cost={wood:BUILDINGS[type].wood,logs:BUILDINGS[type].logs,stone:BUILDINGS[type].stone};
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
    const type=this.buildMode,def=BUILDINGS[type];const cost={wood:def.wood,logs:def.logs,stone:def.stone};
    if(!this.hasCost(cost,true)){this.toast('Baumaterial reicht nicht mehr.');return;}
    this.payCost(cost,true);if(type!=='campfire')this.useTool('hammer',5);
    const id=`b-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;const saved={id,type,x:Number(this.buildGhost.position.x.toFixed(2)),z:Number(this.buildGhost.position.z.toFixed(2)),rotation:Number(this.buildRotation.toFixed(4)),condition:100,createdAt:Date.now()};
    this.state.buildings.push(saved);this.state.stats.built+=1;this.buildGhost.removeFromParent();this.buildGhost=null;this.buildMode='';this.buildActions.hidden=true;this.spawnSavedBuilding(saved);this.gainXp(20,`Gebaut: ${def.name}`);this.toast(`${def.name} wurde errichtet.`);this.checkQuestProgress();this.saveState(true);
  }

  cancelBuildMode() { if(this.buildGhost){this.buildGhost.removeFromParent();this.buildGhost=null;}this.buildMode='';if(this.buildActions)this.buildActions.hidden=true; }

  openManagement(tab='overview') {
    this.panelMode=tab;
    const tabs=['overview','inventory','crafting','building','skills','village','map'];
    const labels={overview:'Übersicht',inventory:'Inventar',crafting:'Herstellen',building:'Bauen',skills:'Fähigkeiten',village:'Dorf',map:'Karte'};
    const nav=`<nav class="mdc-panel-tabs">${tabs.map((id)=>`<button class="${id===tab?'active':''}" data-mdc-tab="${id}">${labels[id]}</button>`).join('')}</nav>`;
    let body='';
    if(tab==='overview')body=this.renderOverviewPanel();
    if(tab==='inventory')body=this.renderInventoryPanel();
    if(tab==='crafting')body=this.renderCraftingPanel();
    if(tab==='building')body=this.renderBuildingPanel();
    if(tab==='skills')body=this.renderSkillsPanel();
    if(tab==='village')body=this.renderVillagePanel();
    if(tab==='map')body=this.renderMapPanel();
    this.openPanel('CENTER',labels[tab],nav+body);
  }

  renderOverviewPanel() {
    const q=this.currentQuest();const season=SEASONS[this.state.season];
    return `<div class="mdc-overview-hero"><span>${season.icon}</span><div><small>${season.name} · Tag ${this.state.day}</small><h3>${this.state.settlement.name}</h3><p>${this.state.settlement.residents} Bewohner · ${this.state.settlement.reputation} Ruf</p></div></div>
      <div class="mdc-stat-grid"><article><small>Gesundheit</small><b>${Math.round(this.state.needs.health)}%</b></article><article><small>Münzen</small><b>${this.state.inventory.coins}</b></article><article><small>Gebäude</small><b>${this.state.buildings.length}</b></article><article><small>Fähigkeitspunkte</small><b>${this.state.skillPoints}</b></article></div>
      <div class="mdc-quest-detail"><small>AKTUELLE AUFGABE</small><h3>${q.title}</h3><p>${q.text}</p><strong>${q.progress}</strong></div>
      <div class="mdc-panel-actions"><button data-mdc-tab="crafting">Werkzeug herstellen</button><button data-mdc-tab="building">Gebäude planen</button><button data-mdc-action="sleep">Bis zum Morgen schlafen</button></div>`;
  }

  renderInventoryPanel() {
    const items=Object.entries(RESOURCE_LABELS).map(([id,name])=>`<article><span>${this.itemIcon(id)}</span><div><b>${name}</b><small>Im Rucksack</small></div><strong>${this.state.inventory[id]||0}</strong>${['berries','cookedMeat','water'].includes(id)?`<button data-mdc-use="${id}">Benutzen</button>`:''}</article>`).join('');
    const tools=Object.entries(RECIPES).filter(([id])=>id!=='cookedMeat').map(([id,r])=>`<article><span>${r.icon}</span><div><b>${r.name}</b><small>Haltbarkeit</small></div><strong>${Math.round(this.state.tools[id]||0)}%</strong></article>`).join('');
    return `<h3 class="mdc-section-title">Rohstoffe</h3><div class="mdc-inventory-list">${items}</div><h3 class="mdc-section-title">Werkzeuge</h3><div class="mdc-inventory-list">${tools}</div>`;
  }

  renderCraftingPanel() {
    return `<p class="mdc-note">Werkzeuge verschleißen bei Benutzung. Am Lagerfeuer kannst du Fleisch garen.</p><div class="mdc-recipe-grid">${Object.entries(RECIPES).map(([id,r])=>`<article><span>${r.icon}</span><div><h3>${r.name}</h3><p>${this.costText(r.cost)}</p><small>${id==='cookedMeat'?'Nahrung':'Haltbarkeit '+Math.round(this.state.tools[id]||0)+'%'}</small></div><button ${this.hasCost(r.cost)?'':'disabled'} data-mdc-action="craft" data-recipe="${id}">Herstellen</button></article>`).join('')}</div>`;
  }

  renderBuildingPanel() {
    return `<p class="mdc-note">Platziere Gebäude frei in der offenen Welt. Ein Bauhammer wird außer beim Lagerfeuer benötigt.</p><div class="mdc-building-grid">${Object.entries(BUILDINGS).map(([id,b])=>{const cost={wood:b.wood,logs:b.logs,stone:b.stone};return `<article><span>${b.icon}</span><div><small>${b.category}</small><h3>${b.name}</h3><p>${this.costText(cost,true)}</p></div><button ${this.hasCost(cost,true)?'':'disabled'} data-mdc-action="build" data-building="${id}">Platzieren</button></article>`;}).join('')}</div>`;
  }

  renderSkillsPanel() {
    return `<div class="mdc-skill-points"><span>FÄHIGKEITSPUNKTE</span><strong>${this.state.skillPoints}</strong></div><div class="mdc-skill-list">${Object.entries(SKILLS).map(([id,s])=>`<article><span>${s.icon}</span><div><h3>${s.name}</h3><p>${s.text}</p><small>Stufe ${this.state.skills[id]}/5</small></div><button ${this.state.skillPoints>0&&this.state.skills[id]<5?'':'disabled'} data-mdc-action="skill" data-skill="${id}">Verbessern</button></article>`).join('')}</div>`;
  }

  renderVillagePanel() {
    const s=this.state.settlement;const capacity=this.state.buildings.filter((b)=>b.type==='house').length*2;
    return `<div class="mdc-village-hero"><strong>${s.name}</strong><span>${s.residents}/${capacity} Bewohner · Moral ${Math.round(s.morale)}%</span></div>
      <div class="mdc-stat-grid"><article><small>Nahrung</small><b>${s.food}</b></article><article><small>Feuerholz</small><b>${s.firewood}</b></article><article><small>Ruf</small><b>${s.reputation}</b></article><article><small>Steuern</small><b>${s.taxDue}</b></article></div>
      <div class="mdc-resident-list">${(this.state.recruitedNames||[]).length?(this.state.recruitedNames||[]).map((n)=>`<article><span>♟</span><b>${n}</b><small>Bewohner von Waldhain</small></article>`).join(''):'<p>Noch hat sich niemand deiner Siedlung angeschlossen.</p>'}</div>
      <button ${s.taxDue>0&&this.state.inventory.coins>=s.taxDue?'':'disabled'} data-mdc-action="pay-tax">Steuern bezahlen (${s.taxDue})</button>`;
  }

  renderMapPanel() {
    const marker=(name,x,z,icon)=>{const left=((x+WORLD_HALF)/(WORLD_HALF*2)*100).toFixed(2),top=((z+WORLD_HALF)/(WORLD_HALF*2)*100).toFixed(2);return `<i style="left:${left}%;top:${top}%" title="${name}">${icon}</i>`;};
    return `<div class="mdc-world-map"><div class="river"></div>${marker('Waldhain',-42,176,'⌂')}${this.villages.map((v)=>marker(v.name,v.x,v.z,'♜')).join('')}${marker('Ruinen',48,-335,'▥')}${marker('Höhle',-303,294,'●')}${this.state.buildings.map((b)=>marker(BUILDINGS[b.type].name,b.x,b.z,BUILDINGS[b.type].icon)).join('')}<b style="left:${((this.player.position.x+WORLD_HALF)/(WORLD_HALF*2)*100).toFixed(2)}%;top:${((this.player.position.z+WORLD_HALF)/(WORLD_HALF*2)*100).toFixed(2)}%">▲</b></div><p class="mdc-note">Entdeckte Orte: ${this.state.discovered.join(' · ')}</p>`;
  }

  currentQuest() {
    const built=this.state.buildings.length,res=this.state.settlement.residents;
    const quests={
      tools:{title:'Das erste Werkzeug',text:'Stelle eine Steinaxt her.',done:this.state.tools.axe>0,progress:this.state.tools.axe>0?'Erledigt':'Steinaxt fehlt'},
      fire:{title:'Wärme in der Wildnis',text:'Errichte ein eigenes Lagerfeuer.',done:this.state.buildings.some((b)=>b.type==='campfire'),progress:`Lagerfeuer ${this.state.buildings.some((b)=>b.type==='campfire')?1:0}/1`},
      house:{title:'Ein Dach über dem Kopf',text:'Baue das erste Wohnhaus.',done:this.state.buildings.some((b)=>b.type==='house'),progress:`Wohnhaus ${this.state.buildings.some((b)=>b.type==='house')?1:0}/1`},
      resident:{title:'Gemeinsam stärker',text:'Wirb den ersten Bewohner an.',done:res>=1,progress:`Bewohner ${res}/1`},
      village:{title:'Dorf im Aufbruch',text:'Errichte vier Gebäude und gewinne zwei Bewohner.',done:built>=4&&res>=2,progress:`Gebäude ${Math.min(4,built)}/4 · Bewohner ${Math.min(2,res)}/2`},
      legacy:{title:'Eine neue Dynastie',text:'Erreiche zehn Gebäude, fünf Bewohner und 100 Ruf.',done:built>=10&&res>=5&&this.state.settlement.reputation>=100,progress:`${built}/10 Gebäude · ${res}/5 Bewohner · ${this.state.settlement.reputation}/100 Ruf`}
    };
    return quests[this.state.activeQuest]||quests.tools;
  }

  checkQuestProgress() {
    const order=['tools','fire','house','resident','village','legacy'];
    const q=this.currentQuest();if(!q.done)return;
    const id=this.state.activeQuest;
    if(!this.state.completedQuests.includes(id)){this.state.completedQuests.push(id);this.state.inventory.coins+=35;this.state.settlement.reputation+=10;this.gainXp(35,`Aufgabe: ${q.title}`);this.toast(`Aufgabe abgeschlossen: ${q.title} · +35 Münzen`);}
    const index=order.indexOf(id);this.state.activeQuest=order[Math.min(order.length-1,index+1)];this.renderHud(true);if(this.panel.classList.contains('is-open'))this.openManagement(this.panelMode||'overview');
  }

  itemIcon(id){return {wood:'🪵',logs:'▥',stone:'◆',berries:'●',meat:'🍖',cookedMeat:'♨',water:'💧',leather:'▱',flax:'🌾',iron:'⬢',coins:'◉'}[id]||'·';}
  costText(cost,discount=false){return Object.entries(cost||{}).filter(([,v])=>v>0).map(([k,v])=>`${this.adjustCost(v,discount)} ${RESOURCE_LABELS[k]||k}`).join(' · ')||'Kostenlos';}

  handlePanelAction(event) {
    const use=event.target.closest?.('[data-mdc-use]')?.dataset.mdcUse;if(use){this.useItem(use);if(this.panelMode==='inventory')this.openManagement('inventory');return;}
    const tab=event.target.closest?.('[data-mdc-tab]')?.dataset.mdcTab;if(tab)return this.openManagement(tab);
    const button=event.target.closest?.('[data-mdc-action]');if(!button)return;
    const action=button.dataset.mdcAction;
    if(action==='craft')this.craft(button.dataset.recipe);
    if(action==='build')this.beginBuildMode(button.dataset.building);
    if(action==='skill')this.upgradeSkill(button.dataset.skill);
    if(action==='npc-gift')this.giveNpcGift(button.dataset.npc);
    if(action==='npc-recruit')this.recruitNpc(button.dataset.npc);
    if(action==='trade-buy')this.trade(button.dataset.item,Number(button.dataset.price),true);
    if(action==='trade-sell')this.trade(button.dataset.item,Number(button.dataset.price),false);
    if(action==='sleep')this.sleepUntilMorning();
    if(action==='open-map')this.openManagement('map');
    if(action==='pay-tax')this.payTax();
  }

  upgradeSkill(id) { if(!SKILLS[id]||this.state.skillPoints<1||this.state.skills[id]>=5)return;this.state.skillPoints-=1;this.state.skills[id]+=1;this.toast(`${SKILLS[id].name} auf Stufe ${this.state.skills[id]}.`);this.openManagement('skills'); }
  payTax(){const due=this.state.settlement.taxDue;if(due<=0||this.state.inventory.coins<due)return;this.state.inventory.coins-=due;this.state.settlement.taxDue=0;this.state.settlement.morale=Math.min(100,this.state.settlement.morale+4);this.toast('Steuern bezahlt.');this.openManagement('village');}

  openInfo(title,text){this.openPanel('ENTDECKUNG',title,`<div class="mdc-dialogue-card"><p>${text}</p></div><button data-mdc-action="open-map">Karte öffnen</button>`);}
  openPanel(kicker,title,html){this.panelKicker.textContent=kicker;this.panelTitle.textContent=title;this.panelBody.innerHTML=html;this.panel.classList.add('is-open');}
  closePanel(){this.panel.classList.remove('is-open');}

  renderHud(force=false) {
    const now=performance.now();if(!force&&now-this.lastHudAt<200)return;this.lastHudAt=now;
    const needs=[['health','Leben','♥'],['hunger','Hunger','●'],['thirst','Durst','◆'],['stamina','Ausdauer','⚡'],['warmth','Wärme','♨']];
    this.needsElement.innerHTML=needs.map(([id,name,icon])=>`<div class="${id}"><span>${icon}</span><div><small>${name}</small><i><b style="width:${clamp(this.state.needs[id],0,100)}%"></b></i></div><strong>${Math.round(this.state.needs[id])}</strong></div>`).join('');
    const q=this.currentQuest();this.questElement.innerHTML=`<small>AUFGABE</small><strong>${q.title}</strong><span>${q.progress}</span>`;
    this.hotbarElement.innerHTML=`<button data-mdc-use="berries"><span>●</span><b>${this.state.inventory.berries}</b><small>Beeren</small></button><button data-mdc-use="cookedMeat"><span>🍖</span><b>${this.state.inventory.cookedMeat}</b><small>Fleisch</small></button><button data-mdc-use="water"><span>💧</span><b>${this.state.inventory.water}</b><small>Wasser</small></button><div><span>🪵</span><b>${this.state.inventory.logs}</b><small>Stämme</small></div><div><span>◆</span><b>${this.state.inventory.stone}</b><small>Stein</small></div><div><span>◉</span><b>${this.state.inventory.coins}</b><small>Münzen</small></div>`;
    const season=SEASONS[this.state.season],weather=WEATHER[this.state.weather];const hours=Math.floor(this.state.time),minutes=Math.floor((this.state.time-hours)*60);
    this.seasonLabel.textContent=`${season.icon} ${season.name}`;this.dayLabel.textContent=`Tag ${this.state.day}`;this.timeLabel.textContent=`${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}`;this.weatherLabel.textContent=`${weather.icon} ${weather.name}`;
    this.compassLabel.textContent=this.compassDirection();
    this.drawMinimap();
  }

  compassDirection(){const a=((this.yaw%(Math.PI*2))+Math.PI*2)%(Math.PI*2);return ['N','NW','W','SW','S','SO','O','NO'][Math.round(a/(Math.PI/4))%8];}

  drawMinimap() {
    const canvas=this.minimap;if(!canvas||!this.player)return;const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='rgba(18,31,20,.88)';ctx.beginPath();ctx.arc(w/2,h/2,w*.48,0,Math.PI*2);ctx.fill();ctx.save();ctx.beginPath();ctx.arc(w/2,h/2,w*.46,0,Math.PI*2);ctx.clip();const range=125,scale=w/(range*2);const px=this.player.position.x,pz=this.player.position.z;
    ctx.strokeStyle='rgba(75,145,176,.8)';ctx.lineWidth=10;ctx.beginPath();for(let z=pz-range;z<=pz+range;z+=4){const x=riverCenter(z);const sx=w/2+(x-px)*scale,sy=h/2+(z-pz)*scale;if(z===pz-range)ctx.moveTo(sx,sy);else ctx.lineTo(sx,sy);}ctx.stroke();
    ctx.fillStyle='#d4b36c';for(const v of this.villages){const x=w/2+(v.x-px)*scale,y=h/2+(v.z-pz)*scale;if(x>0&&x<w&&y>0&&y<h){ctx.fillRect(x-3,y-3,6,6);}}
    ctx.fillStyle='#e8f2d0';for(const b of this.state.buildings){const x=w/2+(b.x-px)*scale,y=h/2+(b.z-pz)*scale;if(x>0&&x<w&&y>0&&y<h){ctx.fillRect(x-2,y-2,4,4);}}
    ctx.translate(w/2,h/2);ctx.rotate(-this.yaw);ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(6,7);ctx.lineTo(0,4);ctx.lineTo(-6,7);ctx.closePath();ctx.fill();ctx.restore();ctx.strokeStyle='rgba(225,194,120,.85)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(w/2,h/2,w*.46,0,Math.PI*2);ctx.stroke();
  }

  setLoading(percent,text){if(this.loadingBar)this.loadingBar.style.width=`${clamp(percent,0,100)}%`;if(this.loadingText)this.loadingText.textContent=text||'';}
  setOnlineUi(state,text,count=1){const cls=state==='online'?'is-online':state==='offline'?'is-offline':'is-connecting';for(const el of [this.onlineCard,this.loadingOnline]){if(!el)continue;el.classList.remove('is-connecting','is-online','is-offline');el.classList.add(cls);}if(this.onlineCount)this.onlineCount.textContent=String(Math.min(4,Math.max(1,Math.floor(count||1))));if(this.onlineStatus)this.onlineStatus.textContent=text||'';}
  toast(message){clearTimeout(this.toastTimer);this.toastElement.textContent=message;this.toastElement.classList.add('show');this.toastTimer=setTimeout(()=>this.toastElement.classList.remove('show'),2800);}

  presencePayload(online=true) {
    const player=bridgeSnapshot(),role=roleSnapshot();
    return {centerWorld:{online:!!online,mapId:ONLINE_MAP_ID,sessionId:this.onlineSessionId,x:Number((this.player?.position.x||0).toFixed(3)),y:Number((this.player?.position.y||0).toFixed(3)),z:Number((this.player?.position.z||0).toFixed(3)),yaw:Number(this.yaw.toFixed(4)),bodyYaw:Number((this.modelPivot?.rotation.y||0).toFixed(4)),walking:!!this.walking,view:this.firstPerson?'first':'third',gender:player.gender,firstName:player.firstName.slice(0,30),lastName:player.lastName.slice(0,30),level:player.level,slot:player.slot,ownerClaim:role.isOwner,season:this.state.season,day:this.state.day,updatedAtMs:Date.now(),version:CENTER_VERSION}};
  }

  async prepareMultiplayer(){const core=window.LifeBuilderFirebaseCore;if(!core?.load)return null;try{const fb=await core.load();const user=await core.waitForAuth?.(5200);return user?.uid?{fb,user}:null;}catch(error){console.warn('Center Firebase-Vorbereitung',error);return null;}}

  async connectMultiplayer(prepared=null) {
    if(this.onlineConnected||this.onlineConnecting)return false;this.onlineConnecting=true;this.setOnlineUi('connecting','Koop-Spieler werden geladen …',1);
    try{const resolved=prepared||await this.prepareMultiplayer(),fb=resolved?.fb,user=resolved?.user;if(!fb||!user?.uid){this.onlineConnecting=false;this.setOnlineUi('offline','Offline-Welt aktiv.',1);return false;}this.onlineFb=fb;this.onlineUser=user;this.onlineDocRef=fb.doc(fb.db,'playerProfiles',user.uid);await this.publishPresence(true);const q=fb.query(fb.collection(fb.db,'playerProfiles'),fb.where('centerWorld.online','==',true),fb.limit(ONLINE_QUERY_LIMIT));this.onlineUnsubscribe?.();this.onlineUnsubscribe=fb.onSnapshot(q,(snapshot)=>this.applyPresenceSnapshot(snapshot).catch(()=>{}),()=>{this.onlineConnected=false;this.setOnlineUi('offline','Koop-Verbindung unterbrochen.',1+this.remotePlayers.size);});clearInterval(this.onlineHeartbeatTimer);clearInterval(this.onlinePublishTimer);this.onlineHeartbeatTimer=setInterval(()=>this.publishPresence(true).catch(()=>{}),ONLINE_HEARTBEAT_MS);this.onlinePublishTimer=setInterval(()=>this.publishPresence(false).catch(()=>{}),ONLINE_WRITE_INTERVAL_MS);this.onlineConnected=true;this.onlineConnecting=false;this.setOnlineUi('online','Center-Koop verbunden.',1+this.remotePlayers.size);return true;}catch(error){console.warn('Center Koop konnte nicht gestartet werden',error);this.onlineConnected=false;this.onlineConnecting=false;this.setOnlineUi('offline','Offline-Welt aktiv.',1);return false;}
  }

  async publishPresence(force=false){if(!this.opened||!this.onlineFb||!this.onlineDocRef||!this.player||this.presenceWriteInFlight)return false;const now=Date.now(),payload=this.presencePayload(true),live=payload.centerWorld,key=`${live.x.toFixed(2)}|${live.z.toFixed(2)}|${live.bodyYaw.toFixed(2)}|${live.walking}`;if(!force&&(now-this.lastPresenceWriteAt<ONLINE_WRITE_INTERVAL_MS||key===this.lastPresenceKey))return false;this.presenceWriteInFlight=true;try{await this.onlineFb.setDoc(this.onlineDocRef,payload,{merge:true});this.lastPresenceWriteAt=Date.now();this.lastPresenceKey=key;return true;}finally{this.presenceWriteInFlight=false;}}

  async disconnectMultiplayer(){clearInterval(this.onlineHeartbeatTimer);clearInterval(this.onlinePublishTimer);this.onlineHeartbeatTimer=0;this.onlinePublishTimer=0;try{this.onlineUnsubscribe?.();}catch{}this.onlineUnsubscribe=null;const fb=this.onlineFb,ref=this.onlineDocRef;this.onlineConnected=false;this.onlineConnecting=false;for(const uid of [...this.remotePlayers.keys()])this.removeRemotePlayer(uid);if(fb&&ref){const payload=this.presencePayload(false);payload.centerWorld.leftAtMs=Date.now();try{await fb.setDoc(ref,payload,{merge:true});}catch{}}this.onlineFb=null;this.onlineUser=null;this.onlineDocRef=null;this.lastPresenceKey='';}

  async applyPresenceSnapshot(snapshot){if(!this.opened)return;const active=new Set(),ownUid=this.onlineUser?.uid||'',now=Date.now();for(const docSnap of snapshot.docs||[]){if(active.size>=MAX_REMOTE_PLAYERS)break;const uid=docSnap.id;if(!uid||uid===ownUid)continue;const data=docSnap.data?.()||{},live=data.centerWorld||{};if(!live.online||live.mapId!==ONLINE_MAP_ID||now-Number(live.updatedAtMs||0)>ONLINE_STALE_MS)continue;active.add(uid);await this.upsertRemotePlayer(uid,data,live);}for(const uid of [...this.remotePlayers.keys()])if(!active.has(uid))this.removeRemotePlayer(uid);this.setOnlineUi(this.onlineConnected?'online':'connecting',`${1+this.remotePlayers.size} Spieler im Grenztal.`,1+this.remotePlayers.size);}

  async verifiedRemoteSkin(uid,live){const gender=live.gender==='female'?'female':'male';if(!live.ownerClaim||!this.onlineFb)return gender;const cached=this.remoteRoleCache.get(uid);if(cached&&Date.now()-cached.checkedAt<60000)return cached.isOwner?'owner':gender;let isOwner=false;try{const snap=await this.onlineFb.getDoc(this.onlineFb.doc(this.onlineFb.db,'staffRoles',uid));isOwner=snap.exists()&&String(snap.data()?.role||'').toLowerCase()==='owner';}catch{}this.remoteRoleCache.set(uid,{isOwner,checkedAt:Date.now()});return isOwner?'owner':gender;}

  async upsertRemotePlayer(uid,profile,live){let remote=this.remotePlayers.get(uid);const name=String(profile.displayName||`${live.firstName||''} ${live.lastName||''}`.trim()||'Spieler').slice(0,44);if(!remote){const group=new THREE.Group(),pivot=new THREE.Group();group.add(pivot);group.position.set(Number(live.x||0),terrainHeightAt(Number(live.x||0),Number(live.z||0)),Number(live.z||0));const label=this.makeLabel(name,`LEVEL ${Math.max(0,Math.floor(Number(live.level||0)))} · KOOP`);label.position.y=2.4;group.add(label);this.scene.add(group);remote={uid,group,pivot,label,name,skin:'',mixer:null,targetX:Number(live.x||0),targetZ:Number(live.z||0),targetYaw:Number(live.bodyYaw??live.yaw??0),walking:!!live.walking,lastSeenAt:Number(live.updatedAtMs||Date.now())};this.remotePlayers.set(uid,remote);}remote.targetX=clamp(live.x,this.worldBounds.minX,this.worldBounds.maxX);remote.targetZ=clamp(live.z,this.worldBounds.minZ,this.worldBounds.maxZ);remote.targetYaw=Number(live.bodyYaw??live.yaw??0);remote.walking=!!live.walking;remote.lastSeenAt=Number(live.updatedAtMs||Date.now());const skin=await this.verifiedRemoteSkin(uid,live);if(remote.skin!==skin)await this.installRemoteModel(remote,skin);}

  async remoteTemplate(skin){if(this.remoteModelCache.has(skin))return this.remoteModelCache.get(skin);const promise=(async()=>{const gltf=await this.gltfLoader.loadAsync(MODEL_PATHS[skin]||MODEL_PATHS.male);const root=gltf.scene;root.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(root),height=Math.max(.01,box.max.y-box.min.y);root.scale.multiplyScalar((skin==='owner'?1.86:1.76)/height);root.updateMatrixWorld(true);const scaled=new THREE.Box3().setFromObject(root),center=scaled.getCenter(new THREE.Vector3());root.position.x-=center.x;root.position.z-=center.z;root.position.y-=scaled.min.y;root.rotation.y=Math.PI;return{root,animations:gltf.animations||[]};})();this.remoteModelCache.set(skin,promise);try{return await promise;}catch(e){this.remoteModelCache.delete(skin);throw e;}}

  async installRemoteModel(remote,skin){remote.pivot.clear();remote.mixer=null;try{const template=await this.remoteTemplate(skin),model=cloneSkeleton(template.root);remote.pivot.add(model);if(template.animations.length){remote.mixer=new THREE.AnimationMixer(model);const action=remote.mixer.clipAction(template.animations[0]);action.play();}}catch{remote.pivot.add(this.makeFallbackCharacter(skin));}remote.skin=skin;}

  updateRemotePlayers(delta){const now=Date.now();for(const [uid,remote] of this.remotePlayers){if(now-remote.lastSeenAt>ONLINE_STALE_MS){this.removeRemotePlayer(uid);continue;}const amount=1-Math.exp(-delta*7);remote.group.position.x+=(remote.targetX-remote.group.position.x)*amount;remote.group.position.z+=(remote.targetZ-remote.group.position.z)*amount;remote.group.position.y=terrainHeightAt(remote.group.position.x,remote.group.position.z);remote.pivot.rotation.y=lerpAngle(remote.pivot.rotation.y,remote.targetYaw,Math.min(1,delta*9));if(remote.mixer){remote.mixer.timeScale+=((remote.walking?1:0)-remote.mixer.timeScale)*Math.min(1,delta*7);remote.mixer.update(delta);}}}

  removeRemotePlayer(uid){const remote=this.remotePlayers.get(uid);if(!remote)return;remote.group.removeFromParent();remote.label?.material?.map?.dispose?.();remote.label?.material?.dispose?.();remote.mixer?.stopAllAction?.();this.remotePlayers.delete(uid);}

  startRolePolling(){clearInterval(this.rolePollTimer);this.rolePollTimer=setInterval(async()=>{if(!this.opened)return;const expected=roleSnapshot().isOwner?'owner':bridgeSnapshot().gender;if(this.playerSkin&&this.playerSkin!==expected)await this.ensureCorrectPlayerModel();},2300);}

  startLoop() {
    cancelAnimationFrame(this.raf);
    const frame=(now)=>{if(!this.opened)return;this.raf=requestAnimationFrame(frame);const minFrame=this.isMobile?33:22;if(now-this.lastRenderedAt<minFrame)return;this.lastRenderedAt=now;const delta=Math.min(.05,Math.max(.001,(now-this.lastFrameAt)/1000));this.lastFrameAt=now;if(document.hidden)return;this.updateMovement(delta);this.updateWorldTime(delta);this.updateNeeds(delta);this.updateAnimals(delta,now);this.updateNpcs(delta,now);this.updateRemotePlayers(delta);this.animateWeather(delta);this.updateCamera(delta);this.updateHotspots();this.renderHud();this.saveState();this.renderer.render(this.scene,this.camera);};
    this.raf=requestAnimationFrame(frame);
  }

  resize(){if(!this.renderer||!this.camera||this.overlay.hidden)return;const rect=this.overlay.getBoundingClientRect(),w=Math.max(1,Math.round(rect.width)),h=Math.max(1,Math.round(rect.height));this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,this.isMobile?1:1.25));this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
}

const game=new CenterDynastyGame();
window.JKGamesCenterDynasty=Object.freeze({open:()=>game.open(),close:()=>game.close(),version:CENTER_VERSION});
if(new URLSearchParams(location.search).has('center-preview'))window.addEventListener('load',()=>setTimeout(()=>game.open(),700),{once:true});
