import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

/* JK.Games V515 · iPhone Calibration Base.
   Nur das echte GLB wird gezeigt; stabile Frontansicht für die anschließende
   exakte Festlegung der vier Display-Eckpunkte. */
const VERSION = "2026-08-19-phone-models-v515-iphone-only-calibration";
const loader = new GLTFLoader();
const sceneCache = new Map();
const sessions = new WeakMap();
let activeSession = null;
let mainRendererBundle = null;
let shortcutRendererBundle = null;
let shortcutSession = null;
let shortcutScheduled = false;
let shortcutGeneration = 0;
/* V513: Rotation bleibt auch erhalten, wenn Home/App-Wechsel die Telefon-Shell neu rendert. */
let mainRotationY = 0;

function sceneForAsset(asset) {
  const key = String(asset || "");
  if (!sceneCache.has(key)) sceneCache.set(key, loader.loadAsync(key).then((gltf) => gltf.scene));
  return sceneCache.get(key).then((root) => root.clone(true));
}

function createRendererBundle(className, pixelRatio = 1.3) {
  const canvas = document.createElement("canvas");
  canvas.className = className;
  canvas.setAttribute("aria-hidden", "true");
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  /* Kein ShadowMap-Kontext mehr: beseitigt auch die alte ShadowMap-Warnung. */
  renderer.shadowMap.enabled = false;
  return { canvas, renderer };
}

function mainRendererFor(frame) {
  if (!mainRendererBundle) mainRendererBundle = createRendererBundle("phone-model-canvas-v511", 1.4);
  const { canvas } = mainRendererBundle;
  if (canvas.parentElement !== frame) {
    canvas.remove();
    frame.prepend(canvas);
  }
  return mainRendererBundle;
}

function shortcutRendererFor(host) {
  if (!shortcutRendererBundle) shortcutRendererBundle = createRendererBundle("phone-shortcut-canvas-v511", 1.15);
  const { canvas } = shortcutRendererBundle;
  if (canvas.parentElement !== host) {
    canvas.remove();
    host.replaceChildren(canvas);
  }
  return shortcutRendererBundle;
}

function tintMaterial(material, skin) {
  if (!material || !skin || skin.finish === "original" || !material.color) return material;
  const c = material.color;
  const brightness = (c.r + c.g + c.b) / 3;
  const metal = Number(material.metalness || 0);
  const likelyBody = metal > .12 && brightness > .055 && !(material.transparent && Number(material.opacity) < .72);
  if (!likelyBody) return material;
  const next = material.clone();
  next.color.set(skin.color || "#888888");
  if (skin.finish === "matte") { next.metalness = Math.max(.25, metal); next.roughness = .72; }
  else if (skin.finish === "gloss") { next.metalness = Math.max(.6, metal); next.roughness = .13; }
  else if (skin.finish === "gold") { next.metalness = .92; next.roughness = .2; }
  else { next.metalness = Math.max(.55, metal); next.roughness = Math.min(.34, Number(next.roughness ?? .35)); }
  return next;
}

function prepareModel(root, skin) {
  root.traverse((node) => {
    if (!node.isMesh) return;
    node.castShadow = false;
    node.receiveShadow = false;
    if (Array.isArray(node.material)) node.material = node.material.map((m) => tintMaterial(m, skin));
    else if (node.material) node.material = tintMaterial(node.material, skin);
  });
}

function centerModel(root) {
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.sub(center);
}

function fitOrthographic(root, camera, aspect = 0.48, margin = 1.035) {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const maxSpan = Math.max(size.x, size.y, size.z, 1e-6);
  const halfHeight = Math.max(size.y * .5 * margin, (size.x * .5 * margin) / Math.max(.1, aspect));
  camera.left = -halfHeight * aspect;
  camera.right = halfHeight * aspect;
  camera.top = halfHeight;
  camera.bottom = -halfHeight;
  camera.near = .001;
  camera.far = Math.max(100, maxSpan * 30);
  camera.position.set(0, 0, Math.max(3, maxSpan * 5));
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
}

function setBackClass(session) {
  const normalized = ((session.currentY % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const frontDistance = Math.min(normalized, Math.PI * 2 - normalized);
  const backDistance = Math.abs(normalized - Math.PI);
  const isBack = backDistance < Math.PI * .45;
  /* Das HTML-Display ist eine 2D-Projektion auf die echte Front. Sobald das
     Telefon deutlich seitlich oder rückwärts gedreht ist, wird diese Projektion
     ausgeblendet, damit kein flaches UI neben dem 3D-iPhone schwebt. */
  const screenHidden = frontDistance > Math.PI * .28;
  session.shell.classList.toggle("phone-back-visible-v511", isBack);
  session.shell.classList.toggle("phone-screen-hidden-v514", screenHidden);
  session.shell.dataset.phoneSideV511 = isBack ? "back" : (screenHidden ? "side" : "front");
}

function renderSession(session) {
  if (!session || session.disposed || activeSession !== session) return;
  if (!session.shell?.isConnected) { disposeSession(session.shell); return; }
  if (session.root) session.root.rotation.y = session.currentY;
  mainRotationY = session.currentY;
  session.renderer.render(session.scene, session.camera);
}

function disposeSession(shell) {
  const session = shell ? sessions.get(shell) : activeSession;
  if (!session) return;
  mainRotationY = Number.isFinite(session.currentY) ? session.currentY : mainRotationY;
  session.disposed = true;
  if (session.raf) cancelAnimationFrame(session.raf);
  try { session.resize?.disconnect?.(); } catch {}
  if (session.shell) sessions.delete(session.shell);
  if (activeSession === session) activeSession = null;
  /* Renderer/Context wird ABSICHTLICH behalten und beim nächsten Öffnen
     wiederverwendet. Dadurch entstehen beim App-Wechsel keine neuen Kontexte. */
}

function animateSession(session) {
  if (!session || session.disposed || session.raf) return;
  const step = () => {
    session.raf = 0;
    if (session.disposed || activeSession !== session || !session.shell?.isConnected) { disposeSession(session.shell); return; }
    const delta = session.targetY - session.currentY;
    if (Math.abs(delta) < .004) {
      session.currentY = session.targetY;
      session.animating = false;
      setBackClass(session);
      renderSession(session);
      return;
    }
    session.currentY += delta * .18;
    session.animating = true;
    setBackClass(session);
    renderSession(session);
    session.raf = requestAnimationFrame(step);
  };
  session.raf = requestAnimationFrame(step);
}

function setTarget(session, target) {
  if (!session || session.disposed) return;
  session.targetY = target;
  mainRotationY = target;
  session.animating = true;
  animateSession(session);
}

function toggleSide(shell) {
  const session = sessions.get(shell);
  if (!session) return;
  const normalized = ((session.currentY % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const nearerBack = Math.abs(normalized - Math.PI) < Math.PI / 2;
  setTarget(session, nearerBack ? 0 : Math.PI);
}
function front(shell) { const session = sessions.get(shell); if (session) setTarget(session, 0); }
function back(shell) { const session = sessions.get(shell); if (session) setTarget(session, Math.PI); }

function wireDrag(session) {
  for (const rail of session.shell.querySelectorAll("[data-phone-model-drag-v511]")) {
    if (rail.dataset.phoneDragBoundV512 === "1") continue;
    rail.dataset.phoneDragBoundV512 = "1";
    let pointer = null, startX = 0, startY = 0;
    rail.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch") return;
      pointer = event.pointerId;
      startX = event.clientX;
      startY = session.currentY;
      session.targetY = session.currentY;
      session.animating = false;
      if (session.raf) { cancelAnimationFrame(session.raf); session.raf = 0; }
      rail.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    });
    rail.addEventListener("pointermove", (event) => {
      if (pointer !== event.pointerId) return;
      session.currentY = startY + (event.clientX - startX) * .012;
      session.targetY = session.currentY;
      mainRotationY = session.currentY;
      setBackClass(session);
      renderSession(session);
      event.preventDefault();
    });
    const done = (event) => {
      if (pointer !== event.pointerId) return;
      pointer = null;
      try { rail.releasePointerCapture?.(event.pointerId); } catch {}
      /* V513: KEIN automatisches Einrasten mehr. Die freie PC-Drehung bleibt exakt
         dort stehen, wo der Nutzer die Maus losgelassen hat. */
      session.targetY = session.currentY;
      session.animating = false;
      mainRotationY = session.currentY;
      setBackClass(session);
      renderSession(session);
    };
    rail.addEventListener("pointerup", done);
    rail.addEventListener("pointercancel", done);
  }
}

async function mount(shell, { model, skin } = {}) {
  if (!shell?.isConnected || !model?.asset) return null;
  const fingerprint = `${model.asset}|${skin?.id || "original"}|${skin?.finish || "original"}|${skin?.color || ""}`;
  const existing = sessions.get(shell);
  if (existing && !existing.disposed && existing.fingerprint === fingerprint) {
    activeSession = existing;
    wireDrag(existing);
    renderSession(existing);
    return existing;
  }

  if (activeSession) disposeSession(activeSession.shell);
  const frame = shell.querySelector(".device-frame");
  if (!frame) return null;

  let bundle;
  try { bundle = mainRendererFor(frame); }
  catch (error) {
    console.warn("JK.Games V514 phone WebGL konnte nicht gestartet werden.", error);
    return null;
  }
  const { canvas, renderer } = bundle;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .001, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x17201d, 2.35));
  const key = new THREE.DirectionalLight(0xffffff, 3.0); key.position.set(3.5, 5, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0x8edfff, 1.85); rim.position.set(-5, 1, -5); scene.add(rim);

  const session = { shell, frame, canvas, renderer, scene, camera, root: null, currentY: 0, targetY: 0, animating: false, disposed: false, resize: null, raf: 0, fingerprint };
  sessions.set(shell, session);
  activeSession = session;

  const resize = () => {
    if (session.disposed || activeSession !== session) return;
    const rect = frame.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    renderer.setSize(w, h, false);
    const aspect = w / h;
    if (session.root) fitOrthographic(session.root, camera, aspect, 1.005);
    renderSession(session);
  };
  session.resize = new ResizeObserver(resize);
  session.resize.observe(frame);
  resize();
  wireDrag(session);

  try {
    const root = await sceneForAsset(model.asset);
    if (session.disposed || activeSession !== session || sessions.get(shell) !== session) return null;
    session.root = root;
    prepareModel(root, skin);
    scene.add(root);
    centerModel(root);
    const rect = frame.getBoundingClientRect();
    fitOrthographic(root, camera, Math.max(.1, rect.width / Math.max(1, rect.height)), 1.005);
    root.rotation.y = session.currentY;
    setBackClass(session);
    renderSession(session);
  } catch (error) {
    console.warn("JK.Games V514 phone GLB", model.asset, error);
    canvas.classList.add("phone-model-load-error-v511");
  }
  return session;
}

function clearShortcutSession() {
  const session = shortcutSession;
  if (!session) return;
  session.disposed = true;
  try { session.resize?.disconnect?.(); } catch {}
  shortcutSession = null;
  /* Auch hier bleibt derselbe Renderer erhalten und wird nur umgehängt. */
}

async function mountShortcutPreview() {
  const host = document.querySelector("[data-phone-shortcut-model-v511]");
  if (!host?.isConnected) { clearShortcutSession(); return; }
  const asset = String(host.dataset.modelAssetV511 || "");
  if (!asset) { clearShortcutSession(); return; }
  if (shortcutSession && !shortcutSession.disposed && shortcutSession.host === host && shortcutSession.asset === asset) return;

  clearShortcutSession();
  const generation = ++shortcutGeneration;
  let bundle;
  try { bundle = shortcutRendererFor(host); }
  catch (error) {
    console.warn("JK.Games V514 Dashboard-iPhone WebGL konnte nicht gestartet werden.", error);
    return;
  }
  const { canvas, renderer } = bundle;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .001, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x13211e, 2.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.8); key.position.set(3, 5, 6); scene.add(key);

  const record = { host, asset, canvas, renderer, scene, camera, root: null, resize: null, disposed: false, generation };
  shortcutSession = record;
  const render = () => {
    if (record.disposed || shortcutSession !== record || !host.isConnected) return;
    const rect = host.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    renderer.setSize(w, h, false);
    const aspect = w / h;
    if (record.root) fitOrthographic(record.root, camera, aspect, 1.045);
    renderer.render(scene, camera);
  };
  record.resize = new ResizeObserver(render);
  record.resize.observe(host);

  try {
    const root = await sceneForAsset(asset);
    if (record.disposed || shortcutSession !== record || generation !== shortcutGeneration || !host.isConnected) return;
    record.root = root;
    prepareModel(root, null);
    scene.add(root);
    centerModel(root);
    const rect = host.getBoundingClientRect();
    fitOrthographic(root, camera, Math.max(.1, rect.width / Math.max(1, rect.height)), 1.045);
    root.rotation.y = 0;
    root.rotation.x = 0;
    render();
  } catch (error) {
    console.warn("JK.Games V514 Dashboard-iPhone GLB", asset, error);
  }
}

function scheduleShortcutPreview() {
  if (shortcutScheduled) return;
  shortcutScheduled = true;
  requestAnimationFrame(() => {
    shortcutScheduled = false;
    mountShortcutPreview();
  });
}

const shortcutButton = document.querySelector("[data-phone-shortcut]");
if (shortcutButton) {
  new MutationObserver(scheduleShortcutPreview).observe(shortcutButton, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-phone-tier", "data-phone-real-model-v512"]
  });
}
window.addEventListener("jkgames-phone-shortcut-refresh-v512", scheduleShortcutPreview);
window.addEventListener("load", scheduleShortcutPreview, { once: true });
document.addEventListener("visibilitychange", () => { if (!document.hidden) scheduleShortcutPreview(); });
scheduleShortcutPreview();

window.JKGamesPhone3DV511 = Object.freeze({
  version: VERSION,
  mount,
  toggleSide,
  front,
  back,
  dispose: disposeSession,
  refreshShortcut: scheduleShortcutPreview
});
