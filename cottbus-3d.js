import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';

const C3D_VERSION = '2026-07-27-zentrale-online-v73-full-audio-fix';
const ONLINE_MAP_ID = 'spremberger-strasse-v1';
const ONLINE_WRITE_INTERVAL_MS = 1200;
const ONLINE_HEARTBEAT_MS = 10000;
const ONLINE_STALE_MS = 24000;
const ONLINE_QUERY_LIMIT = 24;
const MAX_REMOTE_PLAYERS = 8;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)));
const nextPaint = () => new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
const makeSessionId = () => {
  try { return crypto.randomUUID(); } catch { return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
};
const ASSET_ROOT = './assets/cottbus/';
const MODEL_PATHS = Object.freeze({
  male: `${ASSET_ROOT}player-male.glb`,
  female: `${ASSET_ROOT}player-female.glb`,
  owner: `${ASSET_ROOT}player-owner.glb`
});

const MOBILE_QUERY = '(max-width: 820px), (pointer: coarse)';
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
const lerpAngle = (from, to, amount) => {
  let delta = (to - from + Math.PI) % (Math.PI * 2) - Math.PI;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return from + delta * amount;
};
const isEditableTarget = (target) => !!target?.closest?.('input, textarea, select, [contenteditable="true"]');

function createElement(tag, className, html = '') {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (html) element.innerHTML = html;
  return element;
}

function safeSessionRole() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem('lifebuilder-2026-online-mod-session') || 'null');
    if (!parsed?.authorized || Number(parsed.expiresAt || 0) <= Date.now()) return '';
    return String(parsed.role || '').toLowerCase();
  } catch {
    return '';
  }
}

function roleSnapshot() {
  const api = window.LifeBuilderSettingsMenu || window.LifeBuilderOnlineMod;
  const role = String(api?.getRole?.()?.role || safeSessionRole() || '').toLowerCase();
  return {
    role,
    // Absichtlich strikt: Admins, Moderatoren und Supporter erhalten diesen Skin nie.
    isOwner: role === 'owner'
  };
}

function playerSnapshot() {
  const bridge = window.JKGamesCottbus3DBridge;
  const player = bridge?.getPlayer?.() || null;
  return {
    firstName: String(player?.firstName || 'Spieler'),
    lastName: String(player?.lastName || ''),
    gender: player?.gender === 'female' ? 'female' : 'male',
    level: Math.max(0, Math.floor(Number(player?.level || 0))),
    mapPosition: player?.mapPosition || null,
    slot: Math.max(0, Math.floor(Number(player?.slot || 0)))
  };
}

function seededRandom(seed = 1) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function makeCanvasTexture(draw, size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  draw(context, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

function makeCobbleTexture() {
  const random = seededRandom(2411);
  return makeCanvasTexture((context, size) => {
    context.fillStyle = '#756e63';
    context.fillRect(0, 0, size, size);
    const rows = 18;
    const height = size / rows;
    for (let row = 0; row < rows; row += 1) {
      const offset = row % 2 ? -size / 20 : 0;
      const count = 10;
      const width = size / count;
      for (let column = -1; column <= count; column += 1) {
        const x = column * width + offset;
        const y = row * height;
        const shade = Math.floor(90 + random() * 45);
        context.fillStyle = `rgb(${shade},${shade - 5},${shade - 12})`;
        context.strokeStyle = 'rgba(35,31,27,.72)';
        context.lineWidth = 3;
        context.beginPath();
        context.roundRect(x + 2, y + 2, width - 5, height - 5, 6);
        context.fill();
        context.stroke();
      }
    }
    const gradient = context.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, 'rgba(255,255,255,.08)');
    gradient.addColorStop(1, 'rgba(0,0,0,.16)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  });
}

function makePavementTexture() {
  const random = seededRandom(7727);
  return makeCanvasTexture((context, size) => {
    context.fillStyle = '#aaa397';
    context.fillRect(0, 0, size, size);
    const tile = size / 8;
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        const shade = Math.floor(150 + random() * 32);
        context.fillStyle = `rgb(${shade},${shade - 4},${shade - 10})`;
        context.strokeStyle = 'rgba(65,61,56,.42)';
        context.lineWidth = 2;
        context.fillRect(x * tile + 2, y * tile + 2, tile - 4, tile - 4);
        context.strokeRect(x * tile + 2, y * tile + 2, tile - 4, tile - 4);
      }
    }
  });
}

function makeBrickTexture(base = '#9b7052') {
  const random = seededRandom(base.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0));
  return makeCanvasTexture((context, size) => {
    context.fillStyle = '#6f5947';
    context.fillRect(0, 0, size, size);
    const rows = 16;
    const rowHeight = size / rows;
    for (let row = 0; row < rows; row += 1) {
      const brickWidth = size / 6;
      const offset = row % 2 ? -brickWidth / 2 : 0;
      for (let column = -1; column < 8; column += 1) {
        const color = new THREE.Color(base);
        color.offsetHSL(0, 0, (random() - .5) * .12);
        context.fillStyle = `#${color.getHexString()}`;
        context.strokeStyle = 'rgba(74,55,43,.74)';
        context.lineWidth = 3;
        context.fillRect(column * brickWidth + offset + 2, row * rowHeight + 2, brickWidth - 4, rowHeight - 4);
        context.strokeRect(column * brickWidth + offset + 2, row * rowHeight + 2, brickWidth - 4, rowHeight - 4);
      }
    }
  });
}

function makeSignTexture(title, subtitle = '', options = {}) {
  const width = options.width || 1024;
  const height = options.height || 320;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  const background = options.background || '#143b32';
  const border = options.border || '#cda95d';
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);
  context.strokeStyle = border;
  context.lineWidth = 18;
  context.strokeRect(14, 14, width - 28, height - 28);
  context.strokeStyle = 'rgba(255,255,255,.13)';
  context.lineWidth = 3;
  context.strokeRect(34, 34, width - 68, height - 68);
  context.fillStyle = options.color || '#f1d690';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = `900 ${options.titleSize || 104}px Georgia, serif`;
  context.fillText(title, width / 2, subtitle ? height * .42 : height * .51, width - 90);
  if (subtitle) {
    context.fillStyle = 'rgba(246,224,171,.82)';
    context.font = `700 ${options.subtitleSize || 42}px Georgia, serif`;
    context.fillText(subtitle, width / 2, height * .72, width - 100);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

class Cottbus3DGame {
  constructor() {
    this.overlay = null;
    this.canvas = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.initialized = false;
    this.opened = false;
    this.opening = false;
    this.raf = 0;
    this.lastFrameAt = 0;
    this.lastRenderedAt = 0;
    this.isMobile = window.matchMedia(MOBILE_QUERY).matches;
    this.input = { forward: 0, right: 0, sprint: false, jump: false };
    this.keys = new Set();
    this.yaw = 0;
    this.pitch = -0.08;
    this.firstPerson = false;
    this.velocityY = 0;
    this.onGround = true;
    this.player = null;
    this.modelPivot = null;
    this.playerModel = null;
    this.playerMixer = null;
    this.playerClip = null;
    this.playerSkin = '';
    this.walking = false;
    this.remotePlayers = new Map();
    this.remoteModelCache = new Map();
    this.remoteRoleCache = new Map();
    this.onlineFb = null;
    this.onlineUser = null;
    this.onlineDocRef = null;
    this.onlineUnsubscribe = null;
    this.onlineHeartbeatTimer = 0;
    this.onlinePublishTimer = 0;
    this.presenceWriteInFlight = false;
    this.onlineSessionId = makeSessionId();
    this.onlineConnected = false;
    this.onlineConnecting = false;
    this.lastPresenceWriteAt = 0;
    this.lastPresenceKey = '';
    this.colliders = [];
    this.hotspots = [];
    this.nearestHotspot = null;
    this.lookPointerId = null;
    this.lookLast = { x: 0, y: 0 };
    this.joystickPointerId = null;
    this.joystickCenter = { x: 0, y: 0 };
    this.resizeObserver = null;
    this.bodyOverflow = '';
    this.toastTimer = 0;
    this.rolePollTimer = 0;
    this.textureLoader = new THREE.TextureLoader();
    this.loadingManager = new THREE.LoadingManager();
    this.gltfLoader = new GLTFLoader(this.loadingManager);
    this.tmpVector = new THREE.Vector3();
    this.tmpVector2 = new THREE.Vector3();
    this.tmpBox = new THREE.Box3();
    this.worldBounds = { minX: -8.25, maxX: 8.25, minZ: -117, maxZ: 70 };
    this.buildOverlay();
    this.installEntryPoints();
    this.bindGlobalEvents();
  }

  buildOverlay() {
    const overlay = createElement('section', 'c3d-overlay is-third-person');
    overlay.id = 'cottbus3dOverlay';
    overlay.hidden = true;
    overlay.setAttribute('aria-label', 'Begehbare 3D-Karte der Spremberger Straße');
    overlay.innerHTML = `
      <div class="c3d-stage"><canvas aria-label="3D-Spielansicht" tabindex="0"></canvas></div>
      <div class="c3d-vignette"></div>
      <div class="c3d-crosshair" aria-hidden="true"></div>
      <header class="c3d-topbar">
        <div class="c3d-brand">
          <span class="c3d-brand-mark">JK</span>
          <div><small>WORLD.KL · ONLINE-WELT</small><strong>Spremberger Straße</strong></div>
        </div>
        <div class="c3d-top-actions">
          <div class="c3d-role-card" data-c3d-role-card><small>CHARAKTER</small><strong data-c3d-role>Spieler</strong></div>
          <div class="c3d-online-card is-connecting" data-c3d-online-card><i></i><span><small>ONLINE</small><strong><b data-c3d-online-count>1</b> Spieler</strong></span></div>
          <div class="c3d-level-card"><small>LEVEL</small><strong data-c3d-level>0</strong></div>
          <button class="c3d-icon-button" type="button" data-c3d-info title="Karteninfo">ⓘ</button>
          <button class="c3d-icon-button" type="button" data-c3d-close title="3D-Karte schließen">×</button>
        </div>
      </header>
      <div class="c3d-loading" data-c3d-loading>
        <div class="c3d-loading-card">
          <div class="c3d-loading-visual" aria-hidden="true">
            <div class="c3d-loading-skyline"><i></i><i></i><i></i><i></i><i></i></div>
            <div class="c3d-loading-tracks"></div>
            <div class="c3d-loading-tram"><span></span><b>JK</b></div>
            <div class="c3d-loading-player one"></div><div class="c3d-loading-player two"></div>
          </div>
          <span class="c3d-loading-emblem">JK</span>
          <small>JK.GAMES · WORLD.KL ONLINE</small>
          <h2>Spremberger Straße wird geöffnet</h2>
          <p data-c3d-loading-text>Gebäude, Charakter und Online-Spieler werden vorbereitet.</p>
          <div class="c3d-loading-online"><i></i><span data-c3d-online-status>Firebase-Verbindung wird vorbereitet …</span></div>
          <div class="c3d-loading-bar"><span data-c3d-loading-bar></span></div>
        </div>
      </div>
      <aside class="c3d-side-panel" data-c3d-panel>
        <header><div><small data-c3d-panel-kicker>KARTENINFO</small><h2 data-c3d-panel-title>Spremberger Straße</h2></div><button class="c3d-icon-button" type="button" data-c3d-panel-close>×</button></header>
        <div data-c3d-panel-body></div>
      </aside>
      <button class="c3d-interact" type="button" data-c3d-interact><kbd>E</kbd><span data-c3d-interact-label>Untersuchen</span></button>
      <div class="c3d-location"><strong data-c3d-location>Spremberger Straße</strong><span data-c3d-view-label>Außenperspektive · V zum Wechseln</span></div>
      <div class="c3d-controls-hint" aria-hidden="true">
        <span><kbd>WASD</kbd> Laufen</span><span><kbd>Shift</kbd> Sprint</span><span><kbd>V</kbd> Perspektive</span><span><kbd>E</kbd> Ansehen</span><span><kbd>Esc</kbd> Maus lösen</span>
      </div>
      <div class="c3d-mobile-controls">
        <div class="c3d-joystick" data-c3d-joystick><span class="c3d-joystick-knob" data-c3d-joystick-knob></span></div>
        <div class="c3d-mobile-actions">
          <button type="button" data-c3d-perspective title="Perspektive wechseln">◉</button>
          <button type="button" data-c3d-jump title="Springen">↑</button>
          <button type="button" data-c3d-sprint title="Sprinten">»</button>
          <button type="button" data-c3d-mobile-info title="Info anzeigen">ⓘ</button>
        </div>
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
    this.roleCard = overlay.querySelector('[data-c3d-role-card]');
    this.roleLabel = overlay.querySelector('[data-c3d-role]');
    this.levelLabel = overlay.querySelector('[data-c3d-level]');
    this.onlineCard = overlay.querySelector('[data-c3d-online-card]');
    this.onlineCount = overlay.querySelector('[data-c3d-online-count]');
    this.onlineStatus = overlay.querySelector('[data-c3d-online-status]');
    this.loadingOnline = this.onlineStatus?.closest('.c3d-loading-online') || null;
    this.toastElement = overlay.querySelector('[data-c3d-toast]');
    this.joystick = overlay.querySelector('[data-c3d-joystick]');
    this.joystickKnob = overlay.querySelector('[data-c3d-joystick-knob]');
    this.sprintButton = overlay.querySelector('[data-c3d-sprint]');

    overlay.querySelector('[data-c3d-close]').addEventListener('click', () => this.close());
    overlay.querySelector('[data-c3d-info]').addEventListener('click', () => this.showMapInfo());
    overlay.querySelector('[data-c3d-mobile-info]').addEventListener('click', () => this.showMapInfo());
    overlay.querySelector('[data-c3d-panel-close]').addEventListener('click', () => this.closePanel());
    overlay.querySelector('[data-c3d-perspective]').addEventListener('click', () => this.togglePerspective());
    overlay.querySelector('[data-c3d-jump]').addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.requestJump();
    });
    this.sprintButton.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.input.sprint = !this.input.sprint;
      this.sprintButton.classList.toggle('is-active', this.input.sprint);
    });
    this.interactButton.addEventListener('click', () => this.activateNearestHotspot());
    this.bindLookControls();
    this.bindJoystick();
  }

  installEntryPoints() {
    let installQueued = false;
    const ensureEntry = () => {
      installQueued = false;
      // Es gibt nur noch einen Zugang: die bisher gesperrte Zentrale im Dashboard.
      document.querySelectorAll('.c3d-tab-entry, [data-c3d-world-open]').forEach((entry) => entry.remove());
      const central = document.querySelector('[data-c3d-open].c3d-central-entry')
        || [...document.querySelectorAll('.dashboard-shortcut')].find((entry) => /zentrale/i.test(entry.textContent || ''));
      if (!central) return;
      central.classList.remove('upcoming');
      central.classList.add('c3d-central-entry');
      central.dataset.c3dOpen = '';
      delete central.dataset.upcomingArea;
      central.disabled = false;
      central.removeAttribute('disabled');
      central.removeAttribute('aria-disabled');
      central.setAttribute('aria-label', 'Center – Online-Welt betreten');
      central.title = 'Center – Online-Welt betreten';
      const label = central.querySelector('span');
      const icon = central.querySelector('b');
      if (label && label.textContent !== 'Center') label.textContent = 'Center';
      if (icon && icon.textContent !== '◉') icon.textContent = '◉';
    };
    const queueInstall = () => {
      if (installQueued) return;
      installQueued = true;
      requestAnimationFrame(ensureEntry);
    };

    document.addEventListener('click', (event) => {
      const entry = event.target.closest?.('[data-c3d-open]');
      if (!entry) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      this.open();
    }, true);

    queueInstall();
    const observer = new MutationObserver(queueInstall);
    observer.observe(document.body, { childList: true, subtree: true });
    this.entryObserver = observer;
  }

  bindGlobalEvents() {
    window.addEventListener('resize', () => {
      this.isMobile = window.matchMedia(MOBILE_QUERY).matches;
      if (this.opened) this.resize();
    });
    document.addEventListener('keydown', (event) => {
      if (!this.opened || isEditableTarget(event.target)) return;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight', 'Space', 'KeyV', 'KeyE'].includes(event.code)) {
        event.preventDefault();
      }
      this.keys.add(event.code);
      if (event.code === 'Space' && !event.repeat) this.requestJump();
      if (event.code === 'KeyV' && !event.repeat) this.togglePerspective();
      if (event.code === 'KeyE' && !event.repeat) this.activateNearestHotspot();
      if (event.code === 'Escape' && document.pointerLockElement !== this.canvas && !this.panel.classList.contains('is-open')) {
        this.close();
      }
    }, { passive: false });
    document.addEventListener('keyup', (event) => this.keys.delete(event.code));
    document.addEventListener('pointerlockchange', () => {
      this.overlay.classList.toggle('is-pointer-locked', document.pointerLockElement === this.canvas);
      if (document.pointerLockElement === this.canvas) this.toast('Maussteuerung aktiv · Esc löst die Maus.');
    });
    document.addEventListener('mousemove', (event) => {
      if (!this.opened || document.pointerLockElement !== this.canvas) return;
      this.applyLookDelta(event.movementX || 0, event.movementY || 0, 0.0021);
    });
  }

  bindLookControls() {
    this.canvas.addEventListener('pointerdown', (event) => {
      if (!this.opened || event.button !== 0) return;
      if (!this.isMobile && this.firstPerson && document.pointerLockElement !== this.canvas) {
        this.canvas.requestPointerLock?.();
        return;
      }
      this.lookPointerId = event.pointerId;
      this.lookLast.x = event.clientX;
      this.lookLast.y = event.clientY;
      this.canvas.setPointerCapture?.(event.pointerId);
    });
    this.canvas.addEventListener('pointermove', (event) => {
      if (!this.opened || this.lookPointerId !== event.pointerId || document.pointerLockElement === this.canvas) return;
      const dx = event.clientX - this.lookLast.x;
      const dy = event.clientY - this.lookLast.y;
      this.lookLast.x = event.clientX;
      this.lookLast.y = event.clientY;
      this.applyLookDelta(dx, dy, this.isMobile ? 0.006 : 0.0045);
    });
    const release = (event) => {
      if (event.pointerId !== this.lookPointerId) return;
      this.lookPointerId = null;
      try { this.canvas.releasePointerCapture?.(event.pointerId); } catch {}
    };
    this.canvas.addEventListener('pointerup', release);
    this.canvas.addEventListener('pointercancel', release);
    this.canvas.addEventListener('contextmenu', (event) => event.preventDefault());
    this.canvas.addEventListener('dblclick', () => {
      if (!this.isMobile) this.canvas.requestPointerLock?.();
    });
  }

  bindJoystick() {
    const updateJoystick = (clientX, clientY) => {
      const dx = clientX - this.joystickCenter.x;
      const dy = clientY - this.joystickCenter.y;
      const radius = 39;
      const distance = Math.hypot(dx, dy);
      const scale = distance > radius ? radius / distance : 1;
      const x = dx * scale;
      const y = dy * scale;
      this.joystickKnob.style.transform = `translate(${x}px, ${y}px)`;
      this.input.right = clamp(x / radius, -1, 1);
      this.input.forward = clamp(-y / radius, -1, 1);
    };
    this.joystick.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      const rect = this.joystick.getBoundingClientRect();
      this.joystickCenter.x = rect.left + rect.width / 2;
      this.joystickCenter.y = rect.top + rect.height / 2;
      this.joystickPointerId = event.pointerId;
      this.joystick.setPointerCapture?.(event.pointerId);
      updateJoystick(event.clientX, event.clientY);
    });
    this.joystick.addEventListener('pointermove', (event) => {
      if (event.pointerId !== this.joystickPointerId) return;
      event.preventDefault();
      updateJoystick(event.clientX, event.clientY);
    });
    const reset = (event) => {
      if (event.pointerId !== this.joystickPointerId) return;
      this.joystickPointerId = null;
      this.input.forward = 0;
      this.input.right = 0;
      this.joystickKnob.style.transform = 'translate(0, 0)';
      try { this.joystick.releasePointerCapture?.(event.pointerId); } catch {}
    };
    this.joystick.addEventListener('pointerup', reset);
    this.joystick.addEventListener('pointercancel', reset);
  }

  applyLookDelta(dx, dy, sensitivity) {
    this.yaw -= dx * sensitivity;
    this.pitch = clamp(this.pitch - dy * sensitivity, -1.15, 0.82);
  }

  async open() {
    if (this.opened || this.opening) return;
    this.opening = true;
    const loadingStartedAt = performance.now();
    const minimumLoadingMs = 4700 + Math.random() * 900;
    this.opened = true;
    this.bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    this.overlay.hidden = false;
    this.updatePlayerHud();
    this.loading.classList.remove('is-hidden');
    this.setOnlineUi('connecting', 'Firebase-Verbindung wird vorbereitet …', 1);
    this.setLoading(6, 'World.KL wird geöffnet. Historische Straßenzüge werden vorbereitet.');
    const onlinePreparation = this.prepareMultiplayer();
    try {
      await nextPaint();
      if (!this.initialized) await this.initialize();
      else await this.ensureCorrectPlayerModel();
      this.restorePosition();
      this.resize();
      this.setLoading(93, 'Online-Spieler werden mit Firebase verbunden.');

      // Firebase darf das Öffnen der 3D-Welt niemals blockieren. Nach 2,4 Sekunden
      // startet die Karte notfalls offline; eine spätere Verbindung wird im Hintergrund nachgeholt.
      const prepared = await Promise.race([onlinePreparation, wait(2400).then(() => null)]);
      this.setOnlineUi('connecting', prepared ? 'Online-Verbindung startet gleich …' : 'Online-Verbindung wird im Hintergrund fortgesetzt …', 1);

      const elapsed = performance.now() - loadingStartedAt;
      await wait(Math.max(0, minimumLoadingMs - elapsed));
      this.setLoading(100, this.onlineConnected ? 'Online-Welt bereit. Alle aktiven Spieler werden angezeigt.' : 'Welt bereit. Online-Verbindung läuft im Hintergrund.');
      await wait(180);
      this.loading.classList.add('is-hidden');
      this.lastFrameAt = performance.now();
      this.lastRenderedAt = 0;
      this.startLoop();
      this.canvas.focus({ preventScroll: true });
      this.toast(`${this.firstPerson ? 'Ego-' : 'Außen'}perspektive aktiv · Online-Verbindung wird aufgebaut.`);
      this.startRolePolling();

      // Erst nachdem die Szene sichtbar und bedienbar ist, darf Firebase Modelle
      // und Spieler nachladen. So bleibt der Browser während der Ladeanimation reaktionsfähig.
      if (prepared) {
        this.connectMultiplayer(prepared).catch(() => {});
      } else {
        onlinePreparation.then((latePrepared) => {
          if (this.opened && latePrepared) this.connectMultiplayer(latePrepared).catch(() => {});
          else if (this.opened) this.setOnlineUi('offline', 'Nicht angemeldet – Zentrale läuft offline.', 1);
        }).catch(() => {
          if (this.opened) this.setOnlineUi('offline', 'Firebase momentan nicht erreichbar.', 1);
        });
      }
    } catch (error) {
      console.error('Zentrale Online-Welt konnte nicht gestartet werden', error);
      cancelAnimationFrame(this.raf);
      this.raf = 0;
      this.setLoading(100, `World.KL konnte nicht geladen werden: ${error?.message || error}`);
      this.loading.querySelector('.c3d-loading-card h2').textContent = 'World.KL nicht verfügbar';
      this.setOnlineUi('offline', 'Online-Verbindung fehlgeschlagen.', 1);
    } finally {
      this.opening = false;
    }
  }

  close() {
    if (!this.opened) return;
    this.savePosition();
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
    this.closePanel();
    if (document.pointerLockElement === this.canvas) document.exitPointerLock?.();
    this.overlay.hidden = true;
    document.body.style.overflow = this.bodyOverflow;
    clearInterval(this.rolePollTimer);
    this.rolePollTimer = 0;
  }

  async initialize() {
    this.setLoading(16, 'WebGL-Renderer und Licht werden eingerichtet.');
    await nextPaint();
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xbac3b9, 0.0061);
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.08, 420);
    this.camera.rotation.order = 'YXZ';
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      powerPreference: 'high-performance',
      alpha: false,
      preserveDrawingBuffer: false
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.04;
    // Die frühere Schattenberechnung hat auf schwächeren PCs und Handys den
    // Browser blockiert. Die Welt bleibt beleuchtet, aber ohne teure Echtzeitschatten.
    this.renderer.shadowMap.enabled = false;

    this.buildSkyAndLights();
    await nextPaint();
    this.setLoading(28, 'Kopfsteinpflaster und Gehwege werden gebaut.');
    this.buildGround();
    await nextPaint();
    this.setLoading(39, 'Historische Häuserzeilen werden abschnittsweise aufgebaut.');
    await this.buildBuildings();
    this.setLoading(54, 'Spremberger Turm, Straßenbahn und Stadtmöbel werden gesetzt.');
    this.buildTower();
    await nextPaint();
    this.buildTram();
    this.buildStreetFurniture();
    await nextPaint();
    this.buildReferenceBoards();
    this.buildPlayerRoot();
    this.setLoading(70, 'Dein berechtigter Charakter wird geladen.');
    await this.ensureCorrectPlayerModel();
    await nextPaint();
    this.setLoading(94, 'Steuerung und Kollisionen werden aktiviert.');
    this.initialized = true;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.overlay);
    this.setLoading(90, '3D-Welt steht. Firebase-Onlinebereich wird verbunden.');
  }

  buildSkyAndLights() {
    const skyGeometry = new THREE.SphereGeometry(300, 28, 18);
    const skyMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color(0x5f94bc) },
        bottomColor: { value: new THREE.Color(0xe8d7b8) },
        offset: { value: 18 },
        exponent: { value: 0.68 }
      },
      vertexShader: 'varying vec3 vWorldPosition; void main(){ vec4 wp=modelMatrix*vec4(position,1.0); vWorldPosition=wp.xyz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 topColor; uniform vec3 bottomColor; uniform float offset; uniform float exponent; varying vec3 vWorldPosition; void main(){ float h=normalize(vWorldPosition+offset).y; gl_FragColor=vec4(mix(bottomColor,topColor,max(pow(max(h,0.0),exponent),0.0)),1.0); }'
    });
    this.scene.add(new THREE.Mesh(skyGeometry, skyMaterial));

    const hemisphere = new THREE.HemisphereLight(0xcde7ff, 0x5d5141, 2.1);
    this.scene.add(hemisphere);
    const sun = new THREE.DirectionalLight(0xffe2a8, 3.1);
    sun.position.set(-36, 62, 28);
    sun.castShadow = false;
    this.scene.add(sun);

    const ambient = new THREE.AmbientLight(0xffffff, .24);
    this.scene.add(ambient);
  }

  buildGround() {
    const cobble = makeCobbleTexture();
    cobble.repeat.set(4, 42);
    const pavement = makePavementTexture();
    pavement.repeat.set(3, 38);
    const roadMaterial = new THREE.MeshStandardMaterial({ map: cobble, roughness: .94, metalness: .02, color: 0xb0a99c });
    const pavementMaterial = new THREE.MeshStandardMaterial({ map: pavement, roughness: .93, color: 0xd0c9bd });
    const outerMaterial = new THREE.MeshStandardMaterial({ color: 0x6f725c, roughness: 1 });

    const outer = new THREE.Mesh(new THREE.PlaneGeometry(220, 300), outerMaterial);
    outer.rotation.x = -Math.PI / 2;
    outer.position.set(0, -0.035, -25);
    outer.receiveShadow = true;
    this.scene.add(outer);

    const road = new THREE.Mesh(new THREE.PlaneGeometry(12.2, 195), roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, -22.5);
    road.receiveShadow = true;
    this.scene.add(road);

    for (const side of [-1, 1]) {
      const sidewalk = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 195), pavementMaterial);
      sidewalk.rotation.x = -Math.PI / 2;
      sidewalk.position.set(side * 8.15, .018, -22.5);
      sidewalk.receiveShadow = true;
      this.scene.add(sidewalk);

      const curb = new THREE.Mesh(
        new THREE.BoxGeometry(.28, .18, 195),
        new THREE.MeshStandardMaterial({ color: 0xaaa398, roughness: .9 })
      );
      curb.position.set(side * 6.12, .085, -22.5);
      curb.castShadow = true;
      curb.receiveShadow = true;
      this.scene.add(curb);
    }

    const railMaterial = new THREE.MeshStandardMaterial({ color: 0x65696c, roughness: .35, metalness: .86 });
    for (const x of [-1.22, 1.22]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(.095, .07, 190), railMaterial);
      rail.position.set(x, .055, -25);
      rail.castShadow = true;
      rail.receiveShadow = true;
      this.scene.add(rail);
    }

    const drainMaterial = new THREE.MeshStandardMaterial({ color: 0x515454, roughness: .5, metalness: .55 });
    for (let z = 63; z > -112; z -= 10) {
      for (const side of [-1, 1]) {
        const drain = new THREE.Mesh(new THREE.BoxGeometry(.48, .035, .75), drainMaterial);
        drain.position.set(side * 5.72, .035, z);
        this.scene.add(drain);
      }
    }
  }

  addCollider(minX, maxX, minZ, maxZ, padding = 0) {
    this.colliders.push({
      minX: minX - padding,
      maxX: maxX + padding,
      minZ: minZ - padding,
      maxZ: maxZ + padding
    });
  }

  async buildBuildings() {
    const left = [
      [63, 12, 15.8, '#c7b298'], [50, 11, 18.6, '#c19a77'], [38, 13, 16.8, '#d0c1aa'], [23, 14, 20.5, '#b99272'],
      [8, 13, 17.2, '#d3c5ae'], [-7, 14, 19.4, '#a98568'], [-22, 12, 16.3, '#ceb79a'], [-36, 13, 20.1, '#b79b82'],
      [-51, 14, 17.4, '#d4c7b2'], [-66, 13, 18.8, '#b38767'], [-80, 13, 16.2, '#c9ad8c'], [-93, 11, 19.8, '#bca18a']
    ];
    const right = [
      [64, 11, 17.4, '#bd9574'], [51, 13, 19.3, '#d1b79b'], [36, 13, 16.5, '#c2a080'], [22, 14, 21.5, '#a97757'],
      [7, 13, 18.3, '#d0c0aa'], [-8, 14, 17.7, '#b58a6b'], [-23, 13, 20.4, '#c6ae93'], [-38, 14, 18.6, '#9d795f'],
      [-53, 13, 16.8, '#d2c2aa'], [-68, 14, 20.2, '#b68563'], [-83, 13, 17.1, '#c3a487'], [-96, 10, 18.4, '#aa8268']
    ];
    for (let index = 0; index < left.length; index += 1) {
      this.buildBuilding(-1, ...left[index], index);
      if (index % 3 === 2) await nextPaint();
    }
    for (let index = 0; index < right.length; index += 1) {
      this.buildBuilding(1, ...right[index], index);
      if (index % 3 === 2) await nextPaint();
    }
  }

  buildBuilding(side, z, length, height, color, index) {
    const facadeX = side * 10.18;
    const depth = 7.4 + (index % 3) * .8;
    const centerX = facadeX + side * depth / 2;
    const bodyMaterial = new THREE.MeshStandardMaterial({ color, roughness: .88, metalness: 0 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(depth, height, length), bodyMaterial);
    body.position.set(centerX, height / 2, z);
    body.castShadow = true;
    body.receiveShadow = true;
    this.scene.add(body);
    this.addCollider(
      side < 0 ? centerX - depth / 2 : facadeX - .15,
      side < 0 ? facadeX + .15 : centerX + depth / 2,
      z - length / 2,
      z + length / 2,
      .1
    );

    const floors = Math.max(2, Math.min(4, Math.floor(height / 4.1)));
    const trimColor = new THREE.Color(color).offsetHSL(0, -.05, .13);
    const trimMaterial = new THREE.MeshStandardMaterial({ color: trimColor, roughness: .82 });
    for (let floor = 1; floor < floors; floor += 1) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(.22, .18, length + .08), trimMaterial);
      strip.position.set(facadeX - side * .11, floor * height / floors, z);
      strip.castShadow = true;
      this.scene.add(strip);
    }

    const roofColor = index % 2 ? 0x6f3f31 : 0x4f4b45;
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(depth + .45, .65, length + .55),
      new THREE.MeshStandardMaterial({ color: roofColor, roughness: .9 })
    );
    roof.position.set(centerX, height + .3, z);
    roof.castShadow = true;
    this.scene.add(roof);

    const windowMaterial = new THREE.MeshStandardMaterial({
      color: index % 3 ? 0x78909a : 0x687d86,
      roughness: .38,
      metalness: .05,
      emissive: 0x132529,
      emissiveIntensity: .22
    });
    const columns = Math.max(2, Math.min(4, Math.floor(length / 3.4)));
    for (let floor = 0; floor < floors; floor += 1) {
      const y = 2.45 + floor * (height - 3.5) / Math.max(1, floors - 1);
      if (y > height - 1.25) continue;
      for (let column = 0; column < columns; column += 1) {
        const zz = z - length / 2 + (column + .5) * length / columns;
        if (floor === 0 && column === Math.floor(columns / 2)) continue;
        const windowPane = new THREE.Mesh(new THREE.BoxGeometry(.14, 1.45, .92), windowMaterial);
        windowPane.position.set(facadeX - side * .16, y, zz);
        this.scene.add(windowPane);
      }
    }

    const doorZ = z + ((index % 3) - 1) * Math.min(3.2, length * .22);
    const doorMaterial = new THREE.MeshStandardMaterial({ color: index % 2 ? 0x233e35 : 0x4b2f24, roughness: .7 });
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(.24, 2.65, 1.72), trimMaterial);
    doorFrame.position.set(facadeX - side * .13, 1.32, doorZ);
    doorFrame.castShadow = true;
    this.scene.add(doorFrame);
    const door = new THREE.Mesh(new THREE.BoxGeometry(.27, 2.35, 1.4), doorMaterial);
    door.position.set(facadeX - side * .25, 1.18, doorZ);
    this.scene.add(door);

    if (index % 2 === 0) {
      const awning = new THREE.Mesh(
        new THREE.BoxGeometry(1.45, .14, Math.min(3.4, length * .32)),
        new THREE.MeshStandardMaterial({ color: index % 4 ? 0x365d4d : 0x7c4b35, roughness: .82 })
      );
      awning.position.set(facadeX - side * .72, 2.82, doorZ);
      awning.rotation.z = side * -.14;
      awning.castShadow = true;
      this.scene.add(awning);
    }

    const names = side < 0
      ? ['HERM. BIELEFELD', 'CAFÉ COTTBUS', 'MODEHAUS', 'BUCHHANDLUNG', 'SCHNEIDEREI', 'KONDITOREI']
      : ['BIBELN & BÜCHER', 'FRANZ DAHSE', 'UHREN & SCHMUCK', 'APOTHEKE', 'KOLONIALWAREN', 'GASTHAUS'];
    if (index % 2 === 1 || index === 0) {
      const signTexture = makeSignTexture(names[index % names.length], 'SPREMBERGER STRASSE', { width: 900, height: 240, titleSize: 70, subtitleSize: 28 });
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(.16, 1.2, Math.min(4.6, length * .42)),
        [
          new THREE.MeshStandardMaterial({ color: 0x1b3b32, map: signTexture, roughness: .58 }),
          new THREE.MeshStandardMaterial({ color: 0x1b3b32, map: signTexture, roughness: .58 }),
          new THREE.MeshStandardMaterial({ color: 0x1b3b32, roughness: .72 }),
          new THREE.MeshStandardMaterial({ color: 0x1b3b32, roughness: .72 }),
          new THREE.MeshStandardMaterial({ color: 0x1b3b32, roughness: .72 }),
          new THREE.MeshStandardMaterial({ color: 0x1b3b32, roughness: .72 })
        ]
      );
      sign.position.set(facadeX - side * .28, 3.9, z - length * .12);
      sign.castShadow = true;
      this.scene.add(sign);
    }

    if (index % 3 === 1 && height > 17) {
      const balcony = new THREE.Mesh(new THREE.BoxGeometry(1.1, .18, 3.4), trimMaterial);
      balcony.position.set(facadeX - side * .55, height * .56, z + length * .18);
      balcony.castShadow = true;
      this.scene.add(balcony);
      const railMaterial = new THREE.MeshStandardMaterial({ color: 0x342f2b, roughness: .55, metalness: .42 });
      for (let step = -2; step <= 2; step += 1) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(.06, .72, .06), railMaterial);
        rail.position.set(facadeX - side * 1.02, height * .56 + .43, z + length * .18 + step * .65);
        this.scene.add(rail);
      }
      const topRail = new THREE.Mesh(new THREE.BoxGeometry(.07, .07, 3.25), railMaterial);
      topRail.position.set(facadeX - side * 1.03, height * .56 + .78, z + length * .18);
      this.scene.add(topRail);
    }
  }

  buildTower() {
    const towerZ = -107;
    const brick = makeBrickTexture('#8d6249');
    brick.repeat.set(5, 10);
    const towerMaterial = new THREE.MeshStandardMaterial({ map: brick, color: 0xb1886d, roughness: .92 });
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.75, 28, 32, 1, false), towerMaterial);
    tower.position.set(0, 14, towerZ);
    tower.castShadow = true;
    tower.receiveShadow = true;
    this.scene.add(tower);
    this.addCollider(-5.6, 5.6, towerZ - 5.6, towerZ + 5.6, .15);

    const bandMaterial = new THREE.MeshStandardMaterial({ color: 0x6f4c39, roughness: .84 });
    for (const y of [5.5, 18.5, 24.8]) {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(5.82, 5.82, .55, 32), bandMaterial);
      band.position.set(0, y, towerZ);
      band.castShadow = true;
      this.scene.add(band);
    }

    const crownMaterial = new THREE.MeshStandardMaterial({ color: 0x76503a, roughness: .88 });
    for (let index = 0; index < 16; index += 1) {
      const angle = index / 16 * Math.PI * 2;
      const block = new THREE.Mesh(new THREE.BoxGeometry(1.05, 2.15, .9), crownMaterial);
      block.position.set(Math.cos(angle) * 5.35, 28.7, towerZ + Math.sin(angle) * 5.35);
      block.rotation.y = -angle;
      block.castShadow = true;
      this.scene.add(block);
    }

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.7, 1.35, 20), new THREE.MeshStandardMaterial({ color: 0x4e514d, roughness: .7, metalness: .15 }));
    cap.position.set(0, 31.1, towerZ);
    cap.castShadow = true;
    this.scene.add(cap);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.45, 3.2, 20), new THREE.MeshStandardMaterial({ color: 0x344846, roughness: .63, metalness: .18 }));
    roof.position.set(0, 33.35, towerZ);
    roof.castShadow = true;
    this.scene.add(roof);

    const clockTexture = makeSignTexture('Ⅻ', '', { width: 512, height: 512, titleSize: 230, background: '#e4ddc9', border: '#3b342c', color: '#302b25' });
    const clock = new THREE.Mesh(new THREE.CircleGeometry(1.42, 32), new THREE.MeshStandardMaterial({ map: clockTexture, roughness: .75 }));
    clock.position.set(0, 21.2, towerZ + 5.22);
    this.scene.add(clock);

    this.hotspots.push({
      position: new THREE.Vector3(0, 0, -97.6),
      radius: 6,
      title: 'Spremberger Turm',
      kicker: 'WAHRZEICHEN',
      location: 'Am Spremberger Turm',
      text: 'Der Turm bildet den historischen Blickpunkt am Ende der begehbaren Straße. Die Map ist als kompakte, spielbare Interpretation der eingesendeten historischen Aufnahmen aufgebaut.'
    });
  }

  buildTram() {
    const group = new THREE.Group();
    group.position.set(0, 0, -34);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x7e3d27, roughness: .68, metalness: .08 });
    const trimMaterial = new THREE.MeshStandardMaterial({ color: 0xc09b54, roughness: .5, metalness: .45 });
    const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x1c211f, roughness: .35, metalness: .2 });
    const glassMaterial = new THREE.MeshStandardMaterial({ color: 0x6f929d, roughness: .19, metalness: .12, transparent: true, opacity: .9 });

    const lower = new THREE.Mesh(new THREE.BoxGeometry(3.05, 2.4, 7.7), bodyMaterial);
    lower.position.y = 1.8;
    lower.castShadow = true;
    lower.receiveShadow = true;
    group.add(lower);
    const upper = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1.55, 7.3), darkMaterial);
    upper.position.y = 3.65;
    upper.castShadow = true;
    group.add(upper);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(3.25, .35, 7.9), trimMaterial);
    roof.position.y = 4.55;
    roof.castShadow = true;
    group.add(roof);

    for (const side of [-1, 1]) {
      for (let index = -2; index <= 2; index += 1) {
        const window = new THREE.Mesh(new THREE.BoxGeometry(.08, 1.12, 1.05), glassMaterial);
        window.position.set(side * 1.48, 3.68, index * 1.28);
        group.add(window);
      }
    }
    for (const front of [-1, 1]) {
      const frontWindow = new THREE.Mesh(new THREE.BoxGeometry(2.25, 1.05, .08), glassMaterial);
      frontWindow.position.set(0, 3.65, front * 3.68);
      group.add(frontWindow);
      const lamp = new THREE.PointLight(0xffd083, .8, 10, 2);
      lamp.position.set(0, 1.7, front * 4.0);
      group.add(lamp);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(.18, 12, 8), new THREE.MeshStandardMaterial({ color: 0xffe2a2, emissive: 0xffb84d, emissiveIntensity: 2 }));
      bulb.position.copy(lamp.position);
      group.add(bulb);
    }
    for (const x of [-1.1, 1.1]) {
      for (const z of [-2.65, 2.65]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .26, 16), darkMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, .52, z);
        wheel.castShadow = true;
        group.add(wheel);
      }
    }
    const routeTexture = makeSignTexture('3', 'COTTBUS', { width: 512, height: 300, titleSize: 150, subtitleSize: 42, background: '#e5d8b8', border: '#2d2b27', color: '#1d1b18' });
    const route = new THREE.Mesh(new THREE.PlaneGeometry(1.25, .72), new THREE.MeshStandardMaterial({ map: routeTexture, roughness: .76 }));
    route.position.set(0, 4.15, 3.91);
    group.add(route);

    this.scene.add(group);
    this.addCollider(-1.8, 1.8, -38.3, -29.7, .22);
    this.hotspots.push({
      position: new THREE.Vector3(3.6, 0, -34),
      radius: 4.4,
      title: 'Historische Straßenbahn',
      kicker: 'VERKEHR',
      location: 'An der Straßenbahn',
      text: 'Die Straßenbahn orientiert sich an den alten Bildern der Spremberger Straße. Sie ist in dieser ersten Version ein begehbares Kulissenobjekt und kann später als fahrendes System erweitert werden.'
    });
  }

  buildStreetFurniture() {
    const metal = new THREE.MeshStandardMaterial({ color: 0x2f3532, roughness: .52, metalness: .46 });
    const stone = new THREE.MeshStandardMaterial({ color: 0xa8a092, roughness: .92 });
    const leaf = new THREE.MeshStandardMaterial({ color: 0x4f6e3c, roughness: .95 });
    const wood = new THREE.MeshStandardMaterial({ color: 0x684c34, roughness: .82 });

    for (let z = 58; z > -92; z -= 13) {
      for (const side of [-1, 1]) {
        const x = side * 7.28;
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(.08, .11, 4.2, 10), metal);
        pole.position.set(x, 2.1, z + (side > 0 ? 2.5 : 0));
        pole.castShadow = true;
        this.scene.add(pole);
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1.6, 8), metal);
        crown.rotation.z = Math.PI / 2;
        crown.position.set(x, 4.0, z + (side > 0 ? 2.5 : 0));
        crown.castShadow = true;
        this.scene.add(crown);
        for (const offset of [-.65, 0, .65]) {
          const globe = new THREE.Mesh(new THREE.SphereGeometry(.22, 12, 8), new THREE.MeshStandardMaterial({ color: 0xfff2c4, emissive: 0xffd47b, emissiveIntensity: .52, roughness: .35 }));
          globe.position.set(x, 4.28, z + (side > 0 ? 2.5 : 0) + offset);
          globe.castShadow = true;
          this.scene.add(globe);
        }
      }
    }

    for (const [x, z] of [[-7.25, 44], [7.2, 28], [-7.2, -8], [7.25, -54], [-7.1, -78]]) {
      const planter = new THREE.Mesh(new THREE.BoxGeometry(1.35, .65, 2.35), stone);
      planter.position.set(x, .34, z);
      planter.castShadow = true;
      planter.receiveShadow = true;
      this.scene.add(planter);
      for (let index = 0; index < 5; index += 1) {
        const shrub = new THREE.Mesh(new THREE.SphereGeometry(.48 + (index % 2) * .09, 10, 7), leaf);
        shrub.scale.y = 1.25;
        shrub.position.set(x + (index % 2 ? .25 : -.25), .92 + (index % 3) * .08, z - .78 + index * .38);
        shrub.castShadow = true;
        this.scene.add(shrub);
      }
      this.addCollider(x - .82, x + .82, z - 1.32, z + 1.32, .08);
    }

    for (const [x, z, rotation] of [[-7.3, 31, 0], [7.3, -5, Math.PI], [-7.3, -63, 0]]) {
      const bench = new THREE.Group();
      bench.position.set(x, 0, z);
      bench.rotation.y = rotation;
      for (const y of [.48, .82]) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(.16, .13, 2.25), wood);
        slat.position.set(0, y, 0);
        slat.castShadow = true;
        bench.add(slat);
      }
      for (const zLeg of [-.82, .82]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(.5, .08, .09), metal);
        leg.rotation.z = Math.PI / 2;
        leg.position.set(0, .32, zLeg);
        bench.add(leg);
      }
      this.scene.add(bench);
    }

    const bannerTexture = makeSignTexture('JK.GAMES', 'HISTORISCHES COTTBUS', { width: 900, height: 320, titleSize: 105, subtitleSize: 36 });
    for (const z of [17, -61]) {
      const banner = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 2.25), new THREE.MeshStandardMaterial({ map: bannerTexture, side: THREE.DoubleSide, roughness: .68 }));
      banner.position.set(0, 8.7, z);
      this.scene.add(banner);
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 19.5, 6), metal);
      cable.rotation.z = Math.PI / 2;
      cable.position.set(0, 9.95, z);
      this.scene.add(cable);
    }
  }

  buildReferenceBoards() {
    const boardMaterial = new THREE.MeshStandardMaterial({ color: 0x17372f, roughness: .66, metalness: .08 });
    const postMaterial = new THREE.MeshStandardMaterial({ color: 0x302f2b, roughness: .58, metalness: .38 });
    const entries = [
      { path: `${ASSET_ROOT}spremberger-historisch.jpg`, position: [-7.5, 1.55, 58], rotation: Math.PI / 2, title: 'Historische Spremberger Straße', text: 'Diese Aufnahme war eine der Vorlagen für die Häuserzeilen, Straßenbahn und Blickachse zum Turm.' },
      { path: `${ASSET_ROOT}spremberger-platz.jpg`, position: [7.5, 1.55, 51], rotation: -Math.PI / 2, title: 'Spremberger Straße im Wandel', text: 'Die zweite Vorlage zeigt die spätere Fußgängerzone und hilft bei Lampen, Pflanzkübeln und Straßenbreite.' }
    ];
    for (const entry of entries) {
      const group = new THREE.Group();
      group.position.set(...entry.position);
      group.rotation.y = entry.rotation;
      const board = new THREE.Mesh(new THREE.BoxGeometry(.18, 2.65, 3.75), boardMaterial);
      board.castShadow = true;
      group.add(board);
      const picture = new THREE.Mesh(new THREE.PlaneGeometry(3.38, 2.25), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .75 }));
      picture.position.set(-.101, 0, 0);
      picture.rotation.y = Math.PI / 2;
      group.add(picture);
      this.textureLoader.load(entry.path, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 4;
        picture.material.map = texture;
        picture.material.needsUpdate = true;
      });
      for (const z of [-1.35, 1.35]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, 1.6, 8), postMaterial);
        post.position.set(0, -2.12, z);
        post.castShadow = true;
        group.add(post);
      }
      this.scene.add(group);
      this.hotspots.push({
        position: new THREE.Vector3(entry.position[0] + (entry.position[0] < 0 ? 1.5 : -1.5), 0, entry.position[2]),
        radius: 3.2,
        title: entry.title,
        kicker: 'BILDVORLAGE',
        location: entry.title,
        text: entry.text,
        image: entry.path
      });
    }
  }

  buildPlayerRoot() {
    this.player = new THREE.Group();
    this.player.name = 'JKGamesPlayer';
    this.player.position.set(0, 0, 61);
    this.modelPivot = new THREE.Group();
    this.player.add(this.modelPivot);
    this.scene.add(this.player);
  }

  async ensureCorrectPlayerModel() {
    const role = roleSnapshot();
    const player = playerSnapshot();
    const skin = role.isOwner ? 'owner' : player.gender;
    this.updatePlayerHud();
    if (this.playerModel && this.playerSkin === skin) return;
    await this.loadPlayerModel(skin);
  }

  async loadPlayerModel(skin) {
    this.setLoading(74, skin === 'owner' ? 'Exklusiver Owner-Charakter wird geladen.' : skin === 'female' ? 'Frau-Charakter wird geladen.' : 'Mann-Charakter wird geladen.');
    if (this.playerModel) {
      this.modelPivot.remove(this.playerModel);
      this.playerModel.traverse((object) => {
        if (object.geometry) object.geometry.dispose?.();
      });
      this.playerModel = null;
      this.playerMixer = null;
    }
    const path = MODEL_PATHS[skin] || MODEL_PATHS.male;
    try {
      const gltf = await this.gltfLoader.loadAsync(path, (event) => {
        if (!event.total) return;
        const percent = 74 + Math.round(event.loaded / event.total * 16);
        this.setLoading(percent, `${skin === 'owner' ? 'Owner-Skin' : 'Charakter'} wird geladen · ${Math.round(event.loaded / event.total * 100)} %`);
      });
      const root = gltf.scene;
      root.updateMatrixWorld(true);
      const initial = new THREE.Box3().setFromObject(root);
      const height = Math.max(.01, initial.max.y - initial.min.y);
      const targetHeight = skin === 'owner' ? 1.86 : 1.76;
      root.scale.multiplyScalar(targetHeight / height);
      root.updateMatrixWorld(true);
      const scaled = new THREE.Box3().setFromObject(root);
      const center = scaled.getCenter(new THREE.Vector3());
      root.position.x -= center.x;
      root.position.z -= center.z;
      root.position.y -= scaled.min.y;
      root.rotation.y = skin === 'female' ? Math.PI : Math.PI;
      root.traverse((object) => {
        if (!object.isMesh) return;
        object.castShadow = false;
        object.receiveShadow = false;
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of materials) {
            if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
            material.envMapIntensity = .38;
          }
        }
      });
      this.modelPivot.add(root);
      this.playerModel = root;
      this.playerSkin = skin;
      if (gltf.animations?.length) {
        this.playerMixer = new THREE.AnimationMixer(root);
        this.playerClip = this.playerMixer.clipAction(gltf.animations[0]);
        this.playerClip.play();
        this.playerMixer.timeScale = 0;
      }
      this.applyPerspectiveVisibility();
      this.toast(skin === 'owner' ? 'Owner erkannt: exklusiver Owner-Skin aktiv.' : `${skin === 'female' ? 'Frau' : 'Mann'}-Charakter aus deinem Spielstand geladen.`);
    } catch (error) {
      console.warn('3D-Charakter konnte nicht geladen werden, Ersatzfigur wird verwendet', error);
      const fallback = this.makeFallbackCharacter(skin);
      this.modelPivot.add(fallback);
      this.playerModel = fallback;
      this.playerSkin = skin;
      this.playerMixer = null;
      this.applyPerspectiveVisibility();
    }
  }

  makeFallbackCharacter(skin) {
    const group = new THREE.Group();
    const owner = skin === 'owner';
    const material = new THREE.MeshStandardMaterial({ color: owner ? 0x1a1a1a : skin === 'female' ? 0x8e4f66 : 0x3c5870, roughness: .72 });
    const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xc89473, roughness: .8 });
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.36, .72, 5, 10), material);
    torso.position.y = 1.08;
    torso.castShadow = true;
    group.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.25, 14, 10), skinMaterial);
    head.position.y = 1.74;
    head.castShadow = true;
    group.add(head);
    if (owner) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(.3, .34, .13, 16), new THREE.MeshStandardMaterial({ color: 0x1b1b19, roughness: .75 }));
      cap.position.y = 1.99;
      group.add(cap);
    }
    return group;
  }

  updatePlayerHud() {
    const player = playerSnapshot();
    const role = roleSnapshot();
    this.levelLabel.textContent = String(player.level);
    this.roleLabel.textContent = role.isOwner ? 'Owner · Spezialskin' : role.role ? role.role.replaceAll('_', ' ') : player.gender === 'female' ? 'Frau' : 'Mann';
    this.roleCard.classList.toggle('owner', role.isOwner);
  }

  restorePosition() {
    const player = playerSnapshot();
    const saved = player.mapPosition;
    if (saved && Number.isFinite(Number(saved.x)) && Number.isFinite(Number(saved.z))) {
      const candidate = { x: clamp(saved.x, this.worldBounds.minX, this.worldBounds.maxX), z: clamp(saved.z, this.worldBounds.minZ, this.worldBounds.maxZ) };
      if (!this.collides(candidate.x, candidate.z)) {
        this.player.position.x = candidate.x;
        this.player.position.z = candidate.z;
      }
      this.yaw = Number.isFinite(Number(saved.yaw)) ? Number(saved.yaw) : this.yaw;
      this.firstPerson = saved.view === 'first';
    }
    this.applyPerspectiveVisibility();
    this.snapCamera();
  }

  savePosition() {
    if (!this.player) return;
    window.JKGamesCottbus3DBridge?.saveMapPosition?.({
      x: Number(this.player.position.x.toFixed(3)),
      z: Number(this.player.position.z.toFixed(3)),
      yaw: Number(this.yaw.toFixed(4)),
      view: this.firstPerson ? 'first' : 'third'
    });
  }

  togglePerspective() {
    this.firstPerson = !this.firstPerson;
    if (!this.firstPerson && document.pointerLockElement === this.canvas) document.exitPointerLock?.();
    this.applyPerspectiveVisibility();
    this.snapCamera();
    this.toast(this.firstPerson ? 'Ego-Perspektive aktiv. Klicke in die Karte für Maussteuerung.' : 'Außenperspektive aktiv.');
  }

  applyPerspectiveVisibility() {
    if (this.playerModel) this.playerModel.visible = !this.firstPerson;
    this.overlay.classList.toggle('is-third-person', !this.firstPerson);
    this.viewLabel.textContent = this.firstPerson ? 'Ego-Perspektive · V zum Wechseln' : 'Außenperspektive · V zum Wechseln';
  }

  requestJump() {
    if (!this.onGround) return;
    this.velocityY = 5.05;
    this.onGround = false;
  }

  currentKeyboardInput() {
    const forward = (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0) - (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0);
    const right = (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) - (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0);
    return { forward, right, sprint: this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') };
  }

  collides(x, z) {
    const radius = .42;
    if (x - radius < this.worldBounds.minX || x + radius > this.worldBounds.maxX || z - radius < this.worldBounds.minZ || z + radius > this.worldBounds.maxZ) return true;
    return this.colliders.some((box) => x + radius > box.minX && x - radius < box.maxX && z + radius > box.minZ && z - radius < box.maxZ);
  }

  updateMovement(delta) {
    const keyboard = this.currentKeyboardInput();
    const forwardInput = clamp(keyboard.forward + this.input.forward, -1, 1);
    const rightInput = clamp(keyboard.right + this.input.right, -1, 1);
    const moving = Math.abs(forwardInput) > .02 || Math.abs(rightInput) > .02;
    const sprint = keyboard.sprint || this.input.sprint;
    let moveX = 0;
    let moveZ = 0;
    if (moving) {
      const length = Math.hypot(forwardInput, rightInput) || 1;
      const f = forwardInput / Math.max(1, length);
      const r = rightInput / Math.max(1, length);
      const forwardX = -Math.sin(this.yaw);
      const forwardZ = -Math.cos(this.yaw);
      const rightX = Math.cos(this.yaw);
      const rightZ = -Math.sin(this.yaw);
      moveX = forwardX * f + rightX * r;
      moveZ = forwardZ * f + rightZ * r;
      const speed = sprint ? 7.1 : 4.25;
      const stepX = moveX * speed * delta;
      const stepZ = moveZ * speed * delta;
      const nextX = this.player.position.x + stepX;
      if (!this.collides(nextX, this.player.position.z)) this.player.position.x = nextX;
      const nextZ = this.player.position.z + stepZ;
      if (!this.collides(this.player.position.x, nextZ)) this.player.position.z = nextZ;
      const movementYaw = Math.atan2(-moveX, -moveZ);
      this.modelPivot.rotation.y = lerpAngle(this.modelPivot.rotation.y, movementYaw, Math.min(1, delta * 11));
    }

    this.velocityY -= 12.8 * delta;
    this.player.position.y += this.velocityY * delta;
    if (this.player.position.y <= 0) {
      this.player.position.y = 0;
      this.velocityY = 0;
      this.onGround = true;
    }

    if (this.playerMixer) {
      const desiredTimeScale = moving ? (sprint ? 1.55 : 1.0) : 0;
      this.playerMixer.timeScale += (desiredTimeScale - this.playerMixer.timeScale) * Math.min(1, delta * 8);
      this.playerMixer.update(delta);
    }
    this.walking = moving;
  }

  updateCamera(delta, snap = false) {
    const playerPosition = this.player.position;
    const forward = this.tmpVector.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = this.tmpVector2.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    if (this.firstPerson) {
      const desired = new THREE.Vector3(playerPosition.x, playerPosition.y + 1.63, playerPosition.z);
      if (snap) this.camera.position.copy(desired);
      else this.camera.position.lerp(desired, Math.min(1, delta * 18));
      this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
      return;
    }
    const target = new THREE.Vector3(playerPosition.x, playerPosition.y + 1.18, playerPosition.z);
    const desired = target.clone()
      .addScaledVector(forward, -4.5)
      .addScaledVector(right, .72)
      .add(new THREE.Vector3(0, 2.15 + Math.sin(-this.pitch) * 1.5, 0));
    if (snap) this.camera.position.copy(desired);
    else this.camera.position.lerp(desired, Math.min(1, delta * 8));
    const lookTarget = target.clone().addScaledVector(forward, 2.6 + Math.cos(this.pitch) * .7);
    lookTarget.y += this.pitch * 2.2;
    this.camera.lookAt(lookTarget);
  }

  snapCamera() {
    if (!this.camera || !this.player) return;
    this.updateCamera(1, true);
  }

  updateHotspots() {
    let nearest = null;
    let nearestDistance = Infinity;
    for (const hotspot of this.hotspots) {
      const dx = this.player.position.x - hotspot.position.x;
      const dz = this.player.position.z - hotspot.position.z;
      const distance = Math.hypot(dx, dz);
      if (distance < hotspot.radius && distance < nearestDistance) {
        nearest = hotspot;
        nearestDistance = distance;
      }
    }
    if (nearest !== this.nearestHotspot) {
      this.nearestHotspot = nearest;
      this.interactButton.classList.toggle('is-visible', !!nearest);
      this.interactLabel.textContent = nearest ? nearest.title : 'Untersuchen';
    }
    this.locationLabel.textContent = nearest?.location || this.locationFromPosition();
  }

  locationFromPosition() {
    const z = this.player.position.z;
    if (z > 43) return 'Eingang Spremberger Straße';
    if (z > 15) return 'Historische Geschäftszeile';
    if (z > -18) return 'Cottbuser Einkaufsstraße';
    if (z > -48) return 'Straßenbahnabschnitt';
    if (z > -82) return 'Altstadtpassage';
    return 'Am Spremberger Turm';
  }

  activateNearestHotspot() {
    if (!this.nearestHotspot) return;
    this.openPanel(this.nearestHotspot);
  }

  openPanel(data) {
    this.panelKicker.textContent = data.kicker || 'ORTSINFO';
    this.panelTitle.textContent = data.title || 'Spremberger Straße';
    this.panelBody.innerHTML = `
      <p>${data.text || ''}</p>
      ${data.image ? `<div class="c3d-photo-grid"><img src="${data.image}" alt="${data.title || 'Historische Aufnahme'}"></div>` : ''}
    `;
    this.panel.classList.add('is-open');
    if (document.pointerLockElement === this.canvas) document.exitPointerLock?.();
  }

  showMapInfo() {
    this.panelKicker.textContent = 'JK.GAMES · WORLD.KL ONLINE';
    this.panelTitle.textContent = 'Begehbare Spremberger Straße';
    this.panelBody.innerHTML = `
      <p>Die Zentrale setzt die eingesendeten historischen Bilder als frei begehbare Spielstraße um. Gebäude, Turm, Straßenbahn, Schilder, Lampen und Pflanzkübel sind echte 3D-Objekte und keine flache Hintergrundgrafik.</p>
      <ul>
        <li><b>PC:</b> WASD oder Pfeiltasten, Maus zum Umsehen, Shift zum Sprinten, Leertaste zum Springen.</li>
        <li><b>Handy:</b> linker Joystick zum Laufen, rechts über das Bild ziehen zum Umsehen.</li>
        <li><b>Perspektive:</b> Taste V oder der ◉-Button wechselt zwischen Ego- und Außenperspektive.</li>
        <li><b>Owner:</b> Nur die echte Owner-Rolle erhält automatisch den exklusiven Owner-Skin. Admins und Moderatoren verwenden weiterhin ihren normalen Mann-/Frau-Charakter.</li>
      </ul>
      <div class="c3d-photo-grid">
        <img src="${ASSET_ROOT}spremberger-historisch.jpg" alt="Historische Spremberger Straße">
        <img src="${ASSET_ROOT}spremberger-platz.jpg" alt="Spremberger Straße als Fußgängerzone">
      </div>
    `;
    this.panel.classList.add('is-open');
    if (document.pointerLockElement === this.canvas) document.exitPointerLock?.();
  }

  closePanel() {
    this.panel?.classList.remove('is-open');
  }

  toast(message) {
    if (!this.opened || !this.toastElement) return;
    clearTimeout(this.toastTimer);
    this.toastElement.textContent = message;
    this.toastElement.classList.add('is-visible');
    this.toastTimer = setTimeout(() => this.toastElement.classList.remove('is-visible'), 3000);
  }

  setLoading(percent, text) {
    this.loadingBar.style.width = `${clamp(percent, 0, 100)}%`;
    this.loadingText.textContent = text;
  }

  setOnlineUi(state, text, count = 1) {
    const stateClass = state === 'online' ? 'is-online' : state === 'offline' ? 'is-offline' : 'is-connecting';
    for (const element of [this.onlineCard, this.loadingOnline]) {
      if (!element) continue;
      element.classList.remove('is-connecting', 'is-online', 'is-offline');
      element.classList.add(stateClass);
    }
    if (this.onlineCount) this.onlineCount.textContent = String(Math.max(1, Math.floor(Number(count) || 1)));
    if (this.onlineStatus) this.onlineStatus.textContent = text || '';
  }

  presencePayload(online = true) {
    const player = playerSnapshot();
    const role = roleSnapshot();
    return {
      cottbus3D: {
        online: !!online,
        mapId: ONLINE_MAP_ID,
        sessionId: this.onlineSessionId,
        x: Number((this.player?.position?.x || 0).toFixed(3)),
        z: Number((this.player?.position?.z || 0).toFixed(3)),
        yaw: Number(this.yaw.toFixed(4)),
        bodyYaw: Number((this.modelPivot?.rotation?.y || 0).toFixed(4)),
        walking: !!this.walking,
        view: this.firstPerson ? 'first' : 'third',
        gender: player.gender,
        firstName: player.firstName.slice(0, 30),
        lastName: player.lastName.slice(0, 30),
        level: player.level,
        slot: player.slot,
        ownerClaim: role.isOwner,
        updatedAtMs: Date.now(),
        version: C3D_VERSION
      }
    };
  }

  async prepareMultiplayer() {
    const core = window.LifeBuilderFirebaseCore;
    if (!core?.load) return null;
    try {
      const fb = await core.load();
      const user = await core.waitForAuth?.(5200);
      return user?.uid ? { fb, user } : null;
    } catch (error) {
      console.warn('Firebase-Vorbereitung für die Zentrale', error);
      return null;
    }
  }

  async connectMultiplayer(prepared = null) {
    if (this.onlineConnected) return true;
    if (this.onlineConnecting) return false;
    this.onlineConnecting = true;
    this.setOnlineUi('connecting', 'Anmeldung und Online-Spieler werden geladen …', 1);
    const core = window.LifeBuilderFirebaseCore;
    if (!core?.load) {
      this.setOnlineUi('offline', 'Firebase ist in dieser Version nicht verfügbar.', 1);
      this.onlineConnecting = false;
      return false;
    }
    try {
      const resolved = prepared || await this.prepareMultiplayer();
      const fb = resolved?.fb;
      const user = resolved?.user;
      if (!fb || !user?.uid) {
        this.setOnlineUi('offline', 'Bitte zuerst mit deinem JK.Games-Account anmelden.', 1);
        this.onlineConnecting = false;
        return false;
      }
      this.onlineFb = fb;
      this.onlineUser = user;
      this.onlineDocRef = fb.doc(fb.db, 'playerProfiles', user.uid);
      await this.publishPresence(true);
      const q = fb.query(
        fb.collection(fb.db, 'playerProfiles'),
        fb.where('cottbus3D.online', '==', true),
        fb.limit(ONLINE_QUERY_LIMIT)
      );
      this.onlineUnsubscribe?.();
      this.onlineUnsubscribe = fb.onSnapshot(q, (snapshot) => {
        this.applyPresenceSnapshot(snapshot).catch((error) => console.warn('Zentrale Spieleranzeige', error));
      }, (error) => {
        console.warn('Zentrale Firebase-Liveverbindung', error);
        this.onlineConnected = false;
        this.setOnlineUi('offline', 'Live-Verbindung unterbrochen. Es wird erneut versucht.', 1 + this.remotePlayers.size);
      });
      clearInterval(this.onlineHeartbeatTimer);
      clearInterval(this.onlinePublishTimer);
      this.onlineHeartbeatTimer = setInterval(() => this.publishPresence(true).catch(() => {}), ONLINE_HEARTBEAT_MS);
      this.onlinePublishTimer = setInterval(() => this.publishPresence(false).catch(() => {}), ONLINE_WRITE_INTERVAL_MS);
      this.onlineConnected = true;
      this.onlineConnecting = false;
      this.setOnlineUi('online', 'Firebase Online-Welt verbunden.', 1 + this.remotePlayers.size);
      return true;
    } catch (error) {
      console.warn('Zentrale Online-Verbindung konnte nicht gestartet werden', error);
      this.onlineConnected = false;
      this.onlineConnecting = false;
      this.setOnlineUi('offline', 'Firebase-Verbindung nicht verfügbar. Die Karte startet offline.', 1);
      return false;
    }
  }

  async publishPresence(force = false) {
    if (!this.opened || !this.onlineFb || !this.onlineDocRef || !this.player || this.presenceWriteInFlight) return false;
    const now = Date.now();
    const payload = this.presencePayload(true);
    const live = payload.cottbus3D;
    const key = `${live.x.toFixed(2)}|${live.z.toFixed(2)}|${live.bodyYaw.toFixed(2)}|${live.walking}|${live.view}`;
    if (!force && (now - this.lastPresenceWriteAt < ONLINE_WRITE_INTERVAL_MS || key === this.lastPresenceKey)) return false;
    this.presenceWriteInFlight = true;
    try {
      await this.onlineFb.setDoc(this.onlineDocRef, payload, { merge: true });
      this.lastPresenceWriteAt = Date.now();
      this.lastPresenceKey = key;
      return true;
    } finally {
      this.presenceWriteInFlight = false;
    }
  }

  async disconnectMultiplayer() {
    clearInterval(this.onlineHeartbeatTimer);
    clearInterval(this.onlinePublishTimer);
    this.onlineHeartbeatTimer = 0;
    this.onlinePublishTimer = 0;
    try { this.onlineUnsubscribe?.(); } catch {}
    this.onlineUnsubscribe = null;
    const fb = this.onlineFb;
    const ref = this.onlineDocRef;
    this.onlineConnected = false;
    this.onlineConnecting = false;
    this.setOnlineUi('offline', 'World.KL verlassen.', 1);
    for (const uid of [...this.remotePlayers.keys()]) this.removeRemotePlayer(uid);
    if (fb && ref) {
      const payload = this.presencePayload(false);
      payload.cottbus3D.leftAtMs = Date.now();
      try { await fb.setDoc(ref, payload, { merge: true }); } catch {}
    }
    this.onlineFb = null;
    this.onlineUser = null;
    this.onlineDocRef = null;
    this.lastPresenceKey = '';
  }

  async applyPresenceSnapshot(snapshot) {
    if (!this.opened) return;
    const active = new Set();
    const ownUid = this.onlineUser?.uid || '';
    const now = Date.now();
    for (const docSnap of snapshot.docs || []) {
      if (active.size >= MAX_REMOTE_PLAYERS) break;
      const uid = docSnap.id;
      if (!uid || uid === ownUid) continue;
      const data = docSnap.data?.() || {};
      const live = data.cottbus3D || {};
      if (!live.online || live.mapId !== ONLINE_MAP_ID || now - Number(live.updatedAtMs || 0) > ONLINE_STALE_MS) continue;
      active.add(uid);
      this.remoteUpdateQueue ||= new Map();
      const previous = this.remoteUpdateQueue.get(uid) || Promise.resolve();
      const task = previous.catch(() => {}).then(() => this.upsertRemotePlayer(uid, data, live));
      this.remoteUpdateQueue.set(uid, task);
      task.finally(() => { if (this.remoteUpdateQueue?.get(uid) === task) this.remoteUpdateQueue.delete(uid); });
    }
    for (const uid of [...this.remotePlayers.keys()]) {
      if (!active.has(uid)) this.removeRemotePlayer(uid);
    }
    const total = 1 + this.remotePlayers.size;
    this.setOnlineUi(this.onlineConnected ? 'online' : 'connecting', `${total} aktive Spieler in World.KL.`, total);
  }

  async verifiedRemoteSkin(uid, live) {
    const gender = live.gender === 'female' ? 'female' : 'male';
    if (!live.ownerClaim || !this.onlineFb) return gender;
    const cached = this.remoteRoleCache.get(uid);
    if (cached && Date.now() - cached.checkedAt < 60000) return cached.isOwner ? 'owner' : gender;
    let isOwner = false;
    try {
      const snap = await this.onlineFb.getDoc(this.onlineFb.doc(this.onlineFb.db, 'staffRoles', uid));
      isOwner = snap.exists() && String(snap.data()?.role || '').toLowerCase() === 'owner';
    } catch {
      // Bei fehlender Leseberechtigung wird niemals ein Owner-Skin freigeschaltet.
      isOwner = false;
    }
    this.remoteRoleCache.set(uid, { isOwner, checkedAt: Date.now() });
    return isOwner ? 'owner' : gender;
  }

  async upsertRemotePlayer(uid, profile, live) {
    let remote = this.remotePlayers.get(uid);
    const name = String(profile.displayName || `${live.firstName || ''} ${live.lastName || ''}`.trim() || 'Spieler').slice(0, 44);
    if (!remote) {
      const group = new THREE.Group();
      group.name = `OnlinePlayer:${uid}`;
      group.position.set(Number(live.x || 0), 0, Number(live.z || 0));
      const pivot = new THREE.Group();
      group.add(pivot);
      const label = this.makePlayerLabel(name, Number(live.level || profile.level || 0));
      group.add(label);
      this.scene.add(group);
      remote = {
        uid, group, pivot, label, name, skin: '', mixer: null, clip: null,
        targetX: Number(live.x || 0), targetZ: Number(live.z || 0),
        targetYaw: Number(live.bodyYaw ?? live.yaw ?? 0), walking: !!live.walking,
        level: Number(live.level || profile.level || 0), lastSeenAt: Number(live.updatedAtMs || Date.now())
      };
      this.remotePlayers.set(uid, remote);
    }
    remote.targetX = clamp(live.x, this.worldBounds.minX, this.worldBounds.maxX);
    remote.targetZ = clamp(live.z, this.worldBounds.minZ, this.worldBounds.maxZ);
    remote.targetYaw = Number(live.bodyYaw ?? live.yaw ?? 0);
    remote.walking = !!live.walking;
    remote.lastSeenAt = Number(live.updatedAtMs || Date.now());
    const remoteLevel = Number(live.level || profile.level || 0);
    if (remote.name !== name || remote.level !== remoteLevel) {
      remote.name = name;
      remote.level = remoteLevel;
      remote.group.remove(remote.label);
      remote.label.material.map?.dispose?.();
      remote.label.material.dispose?.();
      remote.label = this.makePlayerLabel(name, remoteLevel);
      remote.group.add(remote.label);
    }
    const skin = await this.verifiedRemoteSkin(uid, live);
    if (remote.skin !== skin && remote.loadingSkin !== skin) {
      remote.loadingSkin = skin;
      try { await this.installRemoteModel(remote, skin); }
      finally { if (remote.loadingSkin === skin) remote.loadingSkin = ''; }
    }
  }

  makePlayerLabel(name, level) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(4,11,10,.88)';
    ctx.strokeStyle = 'rgba(242,215,149,.82)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(8, 12, 496, 104, 30);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff3d0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 38px system-ui, sans-serif';
    ctx.fillText(name, 256, 52, 430);
    ctx.fillStyle = '#e6c56f';
    ctx.font = '800 24px system-ui, sans-serif';
    ctx.fillText(`LEVEL ${Math.max(0, Math.floor(Number(level) || 0))} · ONLINE`, 256, 88, 430);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(0, 2.35, 0);
    sprite.scale.set(3.1, .78, 1);
    sprite.renderOrder = 999;
    return sprite;
  }

  async remoteTemplate(skin) {
    if (this.remoteModelCache.has(skin)) return this.remoteModelCache.get(skin);
    const promise = (async () => {
      const gltf = await this.gltfLoader.loadAsync(MODEL_PATHS[skin] || MODEL_PATHS.male);
      const root = gltf.scene;
      root.updateMatrixWorld(true);
      const initial = new THREE.Box3().setFromObject(root);
      const height = Math.max(.01, initial.max.y - initial.min.y);
      root.scale.multiplyScalar((skin === 'owner' ? 1.86 : 1.76) / height);
      root.updateMatrixWorld(true);
      const scaled = new THREE.Box3().setFromObject(root);
      const center = scaled.getCenter(new THREE.Vector3());
      root.position.x -= center.x;
      root.position.z -= center.z;
      root.position.y -= scaled.min.y;
      root.rotation.y = Math.PI;
      root.traverse((object) => {
        if (!object.isMesh) return;
        object.castShadow = false;
        object.receiveShadow = false;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          if (material?.map) material.map.colorSpace = THREE.SRGBColorSpace;
          if (material) material.envMapIntensity = .35;
        }
      });
      return { root, animations: gltf.animations || [] };
    })();
    this.remoteModelCache.set(skin, promise);
    try { return await promise; }
    catch (error) { this.remoteModelCache.delete(skin); throw error; }
  }

  async installRemoteModel(remote, skin) {
    remote.pivot.clear();
    remote.mixer = null;
    remote.clip = null;
    try {
      const template = await this.remoteTemplate(skin);
      const model = cloneSkeleton(template.root);
      remote.pivot.add(model);
      if (template.animations.length) {
        remote.mixer = new THREE.AnimationMixer(model);
        remote.clip = remote.mixer.clipAction(template.animations[0]);
        remote.clip.play();
        remote.mixer.timeScale = remote.walking ? 1 : 0;
      }
    } catch (error) {
      console.warn('Online-Charakter konnte nicht geladen werden', error);
      remote.pivot.add(this.makeFallbackCharacter(skin));
    }
    remote.skin = skin;
  }

  updateRemotePlayers(delta) {
    const now = Date.now();
    for (const [uid, remote] of this.remotePlayers) {
      if (now - remote.lastSeenAt > ONLINE_STALE_MS) {
        this.removeRemotePlayer(uid);
        continue;
      }
      const amount = 1 - Math.exp(-delta * 8.5);
      remote.group.position.x += (remote.targetX - remote.group.position.x) * amount;
      remote.group.position.z += (remote.targetZ - remote.group.position.z) * amount;
      remote.pivot.rotation.y = lerpAngle(remote.pivot.rotation.y, remote.targetYaw, Math.min(1, delta * 9));
      if (remote.mixer) {
        const desired = remote.walking ? 1 : 0;
        remote.mixer.timeScale += (desired - remote.mixer.timeScale) * Math.min(1, delta * 7);
        remote.mixer.update(delta);
      }
    }
  }

  removeRemotePlayer(uid) {
    const remote = this.remotePlayers.get(uid);
    if (!remote) return;
    remote.group.removeFromParent();
    remote.label?.material?.map?.dispose?.();
    remote.label?.material?.dispose?.();
    remote.mixer?.stopAllAction?.();
    this.remotePlayers.delete(uid);
  }

  startRolePolling() {
    clearInterval(this.rolePollTimer);
    this.rolePollTimer = setInterval(async () => {
      if (!this.opened) return;
      const before = this.playerSkin;
      const role = roleSnapshot();
      const player = playerSnapshot();
      const expected = role.isOwner ? 'owner' : player.gender;
      this.updatePlayerHud();
      if (before && before !== expected) {
        this.loading.classList.remove('is-hidden');
        this.setLoading(72, 'Rolle wurde aktualisiert. Richtiger Charakter wird geladen.');
        await this.ensureCorrectPlayerModel();
        this.loading.classList.add('is-hidden');
      }
    }, 2200);
  }

  startLoop() {
    cancelAnimationFrame(this.raf);
    const frame = (now) => {
      if (!this.opened) return;
      this.raf = requestAnimationFrame(frame);
      const minimumFrameMs = this.isMobile ? 33 : 24;
      if (now - this.lastRenderedAt < minimumFrameMs) return;
      this.lastRenderedAt = now;
      const delta = Math.min(.05, Math.max(.001, (now - this.lastFrameAt) / 1000));
      this.lastFrameAt = now;
      if (document.hidden) return;
      this.updateMovement(delta);
      this.updateRemotePlayers(delta);
      this.updateCamera(delta);
      this.updateHotspots();
      this.renderer.render(this.scene, this.camera);
    };
    this.raf = requestAnimationFrame(frame);
  }

  resize() {
    if (!this.renderer || !this.camera || this.overlay.hidden) return;
    const rect = this.overlay.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const maxRatio = this.isMobile ? 1 : 1.25;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxRatio));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}

const game = new Cottbus3DGame();
window.addEventListener('pagehide', () => game.disconnectMultiplayer().catch(() => {}));
window.JKGamesCottbus3D = Object.freeze({
  open: () => game.open(),
  close: () => game.close(),
  version: C3D_VERSION
});

if (new URLSearchParams(location.search).has('cottbus3d-preview')) {
  window.addEventListener('load', () => setTimeout(() => game.open(), 700), { once: true });
}
