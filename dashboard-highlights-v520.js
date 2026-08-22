/* JK.Games V520 · Hauptmenü-Highlighter
   Nutzt den bestehenden JK.Games-Spielstand (state/save) für Cloud-Persistenz.
   Keine zusätzliche Firestore-Collection und keine neuen Rules nötig. */
(() => {
  "use strict";

  const VERSION = 520;
  const DEFAULT_COLOR = "#6ee7ff";
  const PREF_KEY = "highlightV520";
  const STATE_KEY = "uiHighlightsV520";

  const TARGETS = [
    { key: "character", label: "Charakterbereich", get: () => document.querySelector("#gameScreen .status-panel > .portrait") },
    { key: "hunger", label: "Hunger", get: () => document.getElementById("hungerMeter")?.closest(".meter") },
    { key: "energy", label: "Energie", get: () => document.getElementById("energyMeter")?.closest(".meter") },
    { key: "thirst", label: "Durst", get: () => document.getElementById("thirstMeter")?.closest(".meter") },
    { key: "mood", label: "Stimmung", get: () => document.getElementById("moodMeter")?.closest(".meter") },
    { key: "cash", label: "Bargeld", get: () => document.getElementById("cashValue")?.closest(".mini-stat") },
    { key: "bank", label: "Konto", get: () => document.getElementById("bankValue")?.closest(".mini-stat") },
    { key: "home", label: "Haus", get: () => document.querySelector("#gameScreen [data-home-shortcut]") },
    { key: "hype", label: "Hype", get: () => document.querySelector("#gameScreen [data-jkc-hype-open]") },
    { key: "realestate", label: "Immobiliencenter", get: () => document.querySelector("#gameScreen [data-dashboard-tab=\"realestate\"]") },
    { key: "phone", label: "Handy", get: () => document.querySelector("#gameScreen [data-phone-shortcut]") },
    { key: "today", label: "Heute", get: () => document.querySelector("#gameScreen .tabs button[data-tab=\"overview\"]") },
    { key: "work", label: "Arbeit", get: () => document.querySelector("#gameScreen .tabs button[data-tab=\"work\"]") }
  ];

  let editorColor = "#ff3b4f";
  let selectionActive = false;
  let lastStateRef = null;
  let lastAppliedStamp = -1;
  let syncTimer = null;

  function cleanColor(value, fallback = DEFAULT_COLOR) {
    const color = String(value || "").trim().toLowerCase();
    return /^#[0-9a-f]{6}$/.test(color) ? color : fallback;
  }

  function contrastColor(hex) {
    const color = cleanColor(hex);
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return luminance > 0.58 ? "#07110d" : "#ffffff";
  }

  function normalizePref(value) {
    const raw = value && typeof value === "object" ? value : {};
    const overrides = {};
    const allowed = new Set(TARGETS.map((target) => target.key));
    if (raw.overrides && typeof raw.overrides === "object") {
      Object.entries(raw.overrides).forEach(([key, color]) => {
        if (allowed.has(key) && /^#[0-9a-f]{6}$/i.test(String(color || ""))) overrides[key] = cleanColor(color);
      });
    }
    return {
      version: VERSION,
      globalColor: cleanColor(raw.globalColor || DEFAULT_COLOR),
      overrides,
      updatedAtMs: Math.max(0, Number(raw.updatedAtMs || 0))
    };
  }

  function getLocalPref() {
    try { return normalizePref(settings?.[PREF_KEY]); }
    catch { return normalizePref(null); }
  }

  function writeLocalPref(pref) {
    try {
      settings[PREF_KEY] = normalizePref(pref);
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn("JK Highlighter lokal speichern", error);
    }
  }

  function getCloudPref() {
    try { return state ? normalizePref(state[STATE_KEY]) : null; }
    catch { return null; }
  }

  function writeCloudPref(pref) {
    try {
      if (!state) return false;
      state[STATE_KEY] = normalizePref(pref);
      if (typeof save === "function") save();
      return true;
    } catch (error) {
      console.warn("JK Highlighter Spielstand speichern", error);
      return false;
    }
  }

  function persist(pref, { cloud = true } = {}) {
    const normalized = normalizePref(pref);
    normalized.updatedAtMs = Math.max(Date.now(), normalized.updatedAtMs || 0);
    writeLocalPref(normalized);
    if (cloud) writeCloudPref(normalized);
    applyHighlights(normalized);
    updateSettingsUi(normalized);
    return normalized;
  }

  function resolvePreference() {
    const local = getLocalPref();
    const cloud = getCloudPref();
    if (!cloud) return local;
    if (cloud.updatedAtMs > local.updatedAtMs) {
      writeLocalPref(cloud);
      return cloud;
    }
    if (local.updatedAtMs > cloud.updatedAtMs) {
      writeCloudPref(local);
      return local;
    }
    if (!cloud.updatedAtMs && local.updatedAtMs) {
      writeCloudPref(local);
      return local;
    }
    return cloud.updatedAtMs ? cloud : local;
  }

  function applyHighlights(pref = resolvePreference()) {
    const normalized = normalizePref(pref);
    document.body.style.setProperty("--jk-highlight-global", normalized.globalColor);
    document.body.style.setProperty("--jk-highlight-global-contrast", contrastColor(normalized.globalColor));
    TARGETS.forEach((target) => {
      const node = target.get();
      if (!node) return;
      node.dataset.jkHighlightTarget = target.key;
      node.dataset.jkHighlightLabel = target.label;
      const color = cleanColor(normalized.overrides[target.key] || normalized.globalColor);
      node.style.setProperty("--jk-highlight", color);
      node.style.setProperty("--jk-highlight-contrast", contrastColor(color));
    });
    lastAppliedStamp = normalized.updatedAtMs;
  }

  function updateSettingsUi(pref = resolvePreference()) {
    const normalized = normalizePref(pref);
    const globalCustom = document.getElementById("highlightColorCustom");
    if (globalCustom && document.activeElement !== globalCustom) globalCustom.value = normalized.globalColor;
    document.querySelectorAll("[data-highlight-color]").forEach((button) => {
      button.classList.toggle("active", cleanColor(button.dataset.highlightColor) === normalized.globalColor);
    });
    const targetCustom = document.getElementById("highlightTargetColorCustom");
    if (targetCustom && document.activeElement !== targetCustom) targetCustom.value = editorColor;
    document.querySelectorAll("[data-highlight-target-color]").forEach((button) => {
      button.classList.toggle("active", cleanColor(button.dataset.highlightTargetColor) === editorColor);
    });
    const status = document.getElementById("highlightSingleStatus");
    if (status) {
      const custom = Object.keys(normalized.overrides).length;
      status.textContent = custom
        ? `${custom} Bereich${custom === 1 ? "" : "e"} haben eine eigene Farbe. Alle anderen verwenden ${normalized.globalColor.toUpperCase()}. Die Auswahl wird im Spielstand mitgespeichert.`
        : `Noch keine Einzelfarbe gesetzt. Alle Hauptmenü-Highlights verwenden ${normalized.globalColor.toUpperCase()}. Die Auswahl wird im Spielstand mitgespeichert.`;
    }
  }

  function setGlobalColor(color) {
    const pref = getLocalPref();
    pref.globalColor = cleanColor(color);
    persist(pref);
  }

  function setOverride(key, color) {
    const pref = getLocalPref();
    pref.overrides[key] = cleanColor(color);
    persist(pref);
  }

  function resetOverrides() {
    const pref = getLocalPref();
    pref.overrides = {};
    persist(pref);
  }

  function removePickerOverlay() {
    document.querySelector(".jk-highlight-picker-overlay-v520")?.remove();
  }

  function finishSelection({ reopen = true } = {}) {
    selectionActive = false;
    document.body.classList.remove("jk-highlight-editing-v520");
    removePickerOverlay();
    document.removeEventListener("click", captureTargetClick, true);
    document.removeEventListener("pointerdown", captureDisabledTargetPointerDown, true);
    document.removeEventListener("keydown", onSelectionKeydown, true);
    if (reopen && typeof openSettingsOverlay === "function") openSettingsOverlay();
  }

  function onSelectionKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      finishSelection({ reopen: true });
    }
  }


  function captureDisabledTargetPointerDown(event) {
    if (!selectionActive) return;
    const targetNode = event.target?.closest?.("[data-jk-highlight-target]");
    if (!targetNode || !targetNode.matches?.(":disabled")) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const key = targetNode.dataset.jkHighlightTarget;
    const label = targetNode.dataset.jkHighlightLabel || key;
    setOverride(key, editorColor);
    finishSelection({ reopen: true });
    const status = document.getElementById("highlightSingleStatus");
    if (status) status.textContent = `${label} verwendet jetzt ${editorColor.toUpperCase()}. Die Änderung ist gespeichert.`;
  }

  function captureTargetClick(event) {
    if (!selectionActive) return;
    const targetNode = event.target?.closest?.("[data-jk-highlight-target]");
    const cancel = event.target?.closest?.("[data-jk-highlight-cancel]");
    if (cancel) {
      event.preventDefault();
      event.stopImmediatePropagation();
      finishSelection({ reopen: true });
      return;
    }
    if (!targetNode) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const key = targetNode.dataset.jkHighlightTarget;
    const label = targetNode.dataset.jkHighlightLabel || key;
    setOverride(key, editorColor);
    finishSelection({ reopen: true });
    const status = document.getElementById("highlightSingleStatus");
    if (status) status.textContent = `${label} verwendet jetzt ${editorColor.toUpperCase()}. Die Änderung ist gespeichert.`;
  }

  function startSelection() {
    if (selectionActive) return;
    applyHighlights();
    selectionActive = true;
    document.body.classList.add("jk-highlight-editing-v520");
    document.body.style.setProperty("--jk-highlight-editor", editorColor);
    if (typeof closeSettingsOverlay === "function") closeSettingsOverlay();
    removePickerOverlay();
    const overlay = document.createElement("div");
    overlay.className = "jk-highlight-picker-overlay-v520";
    overlay.innerHTML = `<i></i><div><b>Bereich für ${editorColor.toUpperCase()} auswählen</b><small>Hover über den gewünschten Hauptmenü-Bereich und klicke ihn an. Der normale Button-Klick wird dabei nicht ausgeführt.</small></div><button type="button" data-jk-highlight-cancel>Abbrechen</button>`;
    document.body.appendChild(overlay);
    document.addEventListener("click", captureTargetClick, true);
    document.addEventListener("pointerdown", captureDisabledTargetPointerDown, true);
    document.addEventListener("keydown", onSelectionKeydown, true);
  }

  function bindSettingsUi() {
    document.querySelectorAll("[data-highlight-color]").forEach((button) => {
      if (button.dataset.jkHighlightBound === "1") return;
      button.dataset.jkHighlightBound = "1";
      button.addEventListener("click", () => setGlobalColor(button.dataset.highlightColor));
    });
    const globalCustom = document.getElementById("highlightColorCustom");
    if (globalCustom && globalCustom.dataset.jkHighlightBound !== "1") {
      globalCustom.dataset.jkHighlightBound = "1";
      globalCustom.addEventListener("change", () => setGlobalColor(globalCustom.value));
    }
    const toggle = document.getElementById("highlightSingleToggle");
    const panel = document.getElementById("highlightSinglePanel");
    if (toggle && toggle.dataset.jkHighlightBound !== "1") {
      toggle.dataset.jkHighlightBound = "1";
      toggle.addEventListener("click", () => {
        if (!panel) return;
        panel.hidden = !panel.hidden;
        toggle.textContent = panel.hidden ? "Button verändern" : "Editor schließen";
      });
    }
    document.querySelectorAll("[data-highlight-target-color]").forEach((button) => {
      if (button.dataset.jkHighlightBound === "1") return;
      button.dataset.jkHighlightBound = "1";
      button.addEventListener("click", () => {
        editorColor = cleanColor(button.dataset.highlightTargetColor, "#ff3b4f");
        updateSettingsUi();
      });
    });
    const targetCustom = document.getElementById("highlightTargetColorCustom");
    if (targetCustom && targetCustom.dataset.jkHighlightBound !== "1") {
      targetCustom.dataset.jkHighlightBound = "1";
      targetCustom.addEventListener("input", () => {
        editorColor = cleanColor(targetCustom.value, editorColor);
        updateSettingsUi();
      });
    }
    const pick = document.getElementById("highlightPickTargetBtn");
    if (pick && pick.dataset.jkHighlightBound !== "1") {
      pick.dataset.jkHighlightBound = "1";
      pick.addEventListener("click", startSelection);
    }
    const reset = document.getElementById("highlightResetOverridesBtn");
    if (reset && reset.dataset.jkHighlightBound !== "1") {
      reset.dataset.jkHighlightBound = "1";
      reset.addEventListener("click", resetOverrides);
    }
  }

  function syncFromGameState() {
    let currentState = null;
    try { currentState = state || null; } catch { currentState = null; }
    const stateChanged = currentState !== lastStateRef;
    lastStateRef = currentState;
    const resolved = resolvePreference();
    if (stateChanged || resolved.updatedAtMs !== lastAppliedStamp) {
      applyHighlights(resolved);
      updateSettingsUi(resolved);
    }
  }

  function init() {
    bindSettingsUi();
    const local = getLocalPref();
    if (!local.updatedAtMs) {
      local.updatedAtMs = Date.now();
      writeLocalPref(local);
    }
    applyHighlights(local);
    updateSettingsUi(local);
    syncFromGameState();
    syncTimer = window.setInterval(syncFromGameState, 1200);
    window.addEventListener("pagehide", () => { if (syncTimer) clearInterval(syncTimer); }, { once: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
