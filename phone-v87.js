/* ==========================================================================
   JK.Games V87 · kompakte Charakter-, Hund- und Freundin-Anzeige
   Grundlage: V64 + V65 + V78, ohne alte Einzeldateien im GitHub-Paket.
   ========================================================================== */


/* ===== Integriert aus phone-v64.js ===== */
/* ========================================================================== 
   JK.Games Professional V64 · stabiles iPhone-Homescreen-Design
   ========================================================================== */
(() => {
  "use strict";

  const VERSION = "2026-07-29-jkgames-v87-pets-hotels-vehicles-electric";
  const PAGE_COUNT = 3;
  const FIRST_PAGE_SIZE = 16;
  const OTHER_PAGE_SIZE = 20;
  const PAGE_CAPACITY = FIRST_PAGE_SIZE + OTHER_PAGE_SIZE * (PAGE_COUNT - 1);
  const DOCK_IDS = ["phone", "sms", "bank", "settings"];
  const ORDER_PREFIX = "jkgames-phone-layout-v83";
  const PAGE_PREFIX = "jkgames-phone-page-v83";
  const WIDGET_PREFIX = "jkgames-phone-widgets-v66";
  const DOCK_PREFIX = "jkgames-phone-dock-v66";
  const LEGACY_ORDER_PREFIX = "jkgames-phone-layout-v63";
  const LEGACY_PAGE_PREFIX = "jkgames-phone-page-v63";
  const WIDGET_CATALOG_V85 = Object.freeze([
    { id: "status", label: "Ich, Hund & Freundin", icon: "❤" },
    { id: "calendar", label: "Kalender", icon: "29" },
    { id: "weather", label: "Wetter", icon: "☀" },
    { id: "bank", label: "Kontostand", icon: "€" },
    { id: "cash", label: "Bargeld", icon: "💶" },
    { id: "battery", label: "Handy-Akku", icon: "🔋" },
    { id: "level", label: "Level & EP", icon: "★" },
    { id: "location", label: "Aktueller Ort", icon: "⌖" },
    { id: "debt", label: "Schulden & Steuern", icon: "§" },
    { id: "clock", label: "Uhrzeit & Spieltag", icon: "◷" }
  ]);

  const baseClearDialogDynamicV64 = clearDialogDynamic;
  const baseOpenDeviceInterfaceV64 = openDeviceInterface;
  const basePhoneSettingsViewHtmlV64 = phoneSettingsViewHtml;

  function selectedSlotV64() {
    const raw = typeof selectedSlot !== "undefined" ? selectedSlot : (typeof activeSlot !== "undefined" ? activeSlot : 0);
    return Math.max(0, Math.min(3, Number(raw || 0)));
  }

  function accountKeyV64() {
    const uid = window.LifeBuilderFirebaseCore?.getUser?.()?.uid || "local";
    return `${uid}:${selectedSlotV64()}`;
  }

  function orderStorageKeyV64() {
    return `${ORDER_PREFIX}:${accountKeyV64()}`;
  }

  function pageStorageKeyV64() {
    return `${PAGE_PREFIX}:${accountKeyV64()}`;
  }

  function legacyOrderStorageKeyV64() {
    return `${LEGACY_ORDER_PREFIX}:${accountKeyV64()}`;
  }

  function legacyPageStorageKeyV64() {
    return `${LEGACY_PAGE_PREFIX}:${accountKeyV64()}`;
  }

  function widgetStorageKeyV64() {
    return `${WIDGET_PREFIX}:${accountKeyV64()}`;
  }

  function dockStorageKeyV64() {
    return `${DOCK_PREFIX}:${accountKeyV64()}`;
  }

  function readStoredPageV64() {
    const primary = localStorage.getItem(pageStorageKeyV64());
    const fallback = localStorage.getItem(legacyPageStorageKeyV64());
    const page = Number(primary ?? fallback ?? 0);
    return Number.isInteger(page) ? Math.max(0, Math.min(PAGE_COUNT - 1, page)) : 0;
  }

  function writeStoredPageV64(page) {
    localStorage.setItem(pageStorageKeyV64(), String(Math.max(0, Math.min(PAGE_COUNT - 1, page))));
  }

  function readStoredOrderV64() {
    for (const key of [orderStorageKeyV64(), legacyOrderStorageKeyV64()]) {
      try {
        const parsed = JSON.parse(localStorage.getItem(key) || "[]");
        if (Array.isArray(parsed) && parsed.length) return parsed;
      } catch {
        // Ungültige alte Anordnung wird ignoriert.
      }
    }
    return [];
  }

  function normalizeOrderV64(appIds) {
    const validIds = new Set(appIds);
    const seen = new Set();
    const slots = Array(PAGE_CAPACITY).fill(null);
    const stored = readStoredOrderV64();

    // Freie Plätze bleiben beim erneuten Öffnen exakt frei. Die alte Version
    // hat alle Apps wieder nach oben zusammengeschoben und dadurch Positionen
    // in den unteren Reihen verloren.
    stored.slice(0, PAGE_CAPACITY).forEach((id, index) => {
      if (typeof id !== "string" || !validIds.has(id) || seen.has(id)) return;
      slots[index] = id;
      seen.add(id);
    });

    appIds.forEach((id) => {
      if (seen.has(id)) return;
      const insertAt = slots.indexOf(null);
      if (insertAt < 0) return;
      slots[insertAt] = id;
      seen.add(id);
    });

    localStorage.setItem(orderStorageKeyV64(), JSON.stringify(slots));
    return slots;
  }

  function persistOrderV64(slots) {
    localStorage.setItem(orderStorageKeyV64(), JSON.stringify(slots.slice(0, PAGE_CAPACITY)));
  }

  function swapSlotsV64(slots, fromIndex, toIndex) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= PAGE_CAPACITY || toIndex >= PAGE_CAPACITY) return;
    const value = slots[fromIndex];
    if (!value) return;

    // Auf einen leeren Platz wird direkt verschoben. Bei einem belegten Platz
    // werden die dazwischenliegenden Apps weitergeschoben, damit eine App
    // wirklich zwischen zwei andere gelegt werden kann statt nur zu tauschen.
    if (!slots[toIndex]) {
      slots[fromIndex] = null;
      slots[toIndex] = value;
    } else if (fromIndex < toIndex) {
      for (let index = fromIndex; index < toIndex; index += 1) slots[index] = slots[index + 1];
      slots[toIndex] = value;
    } else {
      for (let index = fromIndex; index > toIndex; index -= 1) slots[index] = slots[index - 1];
      slots[toIndex] = value;
    }
    persistOrderV64(slots);
  }

  function readWidgetOrderV64() {
    const fallback = ["status", "calendar", "weather"];
    const allowed = new Set(WIDGET_CATALOG_V85.map((entry) => entry.id));
    try {
      const parsed = JSON.parse(localStorage.getItem(widgetStorageKeyV64()) || "[]");
      if (!Array.isArray(parsed)) return fallback;
      const valid = parsed.filter((id, index) => allowed.has(id) && parsed.indexOf(id) === index).slice(0, 3);
      fallback.forEach((id) => { if (valid.length < 3 && !valid.includes(id)) valid.push(id); });
      return valid.slice(0, 3);
    } catch {
      return fallback;
    }
  }

  function persistWidgetOrderV64(order) {
    const allowed = new Set(WIDGET_CATALOG_V85.map((entry) => entry.id));
    const valid = order.filter((id, index) => allowed.has(id) && order.indexOf(id) === index).slice(0, 3);
    localStorage.setItem(widgetStorageKeyV64(), JSON.stringify(valid.length === 3 ? valid : ["status", "calendar", "weather"]));
  }

  function normalizeDockV64(appIds) {
    const valid = new Set(appIds);
    const raw = localStorage.getItem(dockStorageKeyV64());
    if (raw == null) {
      const initial = DOCK_IDS.map((id) => valid.has(id) ? id : null);
      localStorage.setItem(dockStorageKeyV64(), JSON.stringify(initial));
      return initial;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error("invalid dock");
      const seen = new Set();
      const dock = Array.from({ length: 4 }, (_, index) => {
        const id = parsed[index];
        if (typeof id !== "string" || !valid.has(id) || seen.has(id)) return null;
        seen.add(id);
        return id;
      });
      localStorage.setItem(dockStorageKeyV64(), JSON.stringify(dock));
      return dock;
    } catch {
      const fallback = DOCK_IDS.map((id) => valid.has(id) ? id : null);
      localStorage.setItem(dockStorageKeyV64(), JSON.stringify(fallback));
      return fallback;
    }
  }

  function persistDockV64(dock) {
    localStorage.setItem(dockStorageKeyV64(), JSON.stringify(dock.slice(0, 4)));
  }

  function removeGameSettingsRowV64(html) {
    return String(html || "").replace(
      /<section class="ios-settings-group">\s*<button[^>]*data-phone-open-game-settings[\s\S]*?<\/section>/i,
      ""
    );
  }

  function addPhonePersonalizationRowsV85(html) {
    const rows = `<h4 class="ios-settings-section-label">Home-Bildschirm</h4>
      <section class="ios-settings-group ios-personalization-group-v85">
        <button type="button" class="ios-settings-row" data-phone-open-widgets-v85><span class="ios-settings-icon blue">▦</span><span><b>Widgets anpassen</b><small>Drei Widgets auswählen und anordnen</small></span><em>›</em></button>
        <button type="button" class="ios-settings-row" data-phone-open-wallpaper-v85><span class="ios-settings-icon indigo">▧</span><span><b>Hintergrund anpassen</b><small>Design wählen oder eigenes Bild verwenden</small></span><em>›</em></button>
      </section>`;
    return String(html || "").replace(/(<h4 class="ios-settings-section-label">Darstellung<\/h4>)/i, `${rows}$1`);
  }

  phoneSettingsViewHtml = function phoneSettingsViewHtmlV64() {
    return addPhonePersonalizationRowsV85(removeGameSettingsRowV64(basePhoneSettingsViewHtmlV64()));
  };

  clearDialogDynamic = function clearDialogDynamicV64() {
    els.dialog?.classList.remove("device-dialog-v64", "device-dialog-v63");
    document.documentElement.classList.remove("phone-v64-open", "phone-v63-open");
    document.body.classList.remove("phone-v64-open", "phone-v63-open");
    return baseClearDialogDynamicV64();
  };

  function closePhoneV64() {
    pendingDeviceScrollTop = null;
    clearDialogDynamic();
    if (els.dialog?.open) els.dialog.close();
  }

  function openPhoneHomeV64(item) {
    pendingDeviceScrollTop = null;
    openDeviceInterface(item || ownedPhoneItem(), "home", false);
  }

  function activateAppV64(item, app) {
    if (!app) return;
    if (app.locked) {
      openDeviceInterface(item, app.id, false);
      return;
    }
    if (settings.phoneHaptics && navigator.vibrate) navigator.vibrate(14);
    openDeviceAppDirect(item, app.id);
  }

  function installHomeBarBehaviorV64(shell, item, activeApp) {
    const bar = shell.querySelector(".device-home-bar");
    if (!bar) return;
    bar.classList.add("device-home-bar-v64");
    bar.setAttribute("role", "button");
    bar.setAttribute("tabindex", "0");
    bar.setAttribute("aria-label", activeApp === "home" ? "Smartphone schließen" : "Zum Home-Bildschirm");

    const run = (event) => {
      event?.preventDefault?.();
      event?.stopImmediatePropagation?.();
      if (activeApp === "home") closePhoneV64();
      else openPhoneHomeV64(item);
    };

    bar.addEventListener("click", run, { capture: true, once: true });
    bar.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") run(event);
    }, { once: true });
  }

  const WEATHER_CACHE_MS_V68 = 10 * 60 * 1000;

  function weatherCodeV68(code) {
    const value = Number(code);
    if (value === 0) return { icon: "☀️", text: "Klar" };
    if ([1, 2].includes(value)) return { icon: "🌤️", text: "Leicht bewölkt" };
    if (value === 3) return { icon: "☁️", text: "Bewölkt" };
    if ([45, 48].includes(value)) return { icon: "🌫️", text: "Nebel" };
    if ([51, 53, 55, 56, 57].includes(value)) return { icon: "🌦️", text: "Nieselregen" };
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(value)) return { icon: "🌧️", text: "Regen" };
    if ([71, 73, 75, 77, 85, 86].includes(value)) return { icon: "🌨️", text: "Schnee" };
    if ([95, 96, 99].includes(value)) return { icon: "⛈️", text: "Gewitter" };
    return { icon: "🌡️", text: "Wetter" };
  }

  function weatherCacheKeyV68(city) {
    return `jkgames-weather-v68:${String(city || "Cottbus").toLocaleLowerCase("de-DE")}`;
  }

  function readWeatherCacheV68(city) {
    try {
      const cached = JSON.parse(localStorage.getItem(weatherCacheKeyV68(city)) || "null");
      if (!cached || !Number.isFinite(Number(cached.temperature))) return null;
      return cached;
    } catch {
      return null;
    }
  }

  function weatherBlockHtmlV68(city, weather = readWeatherCacheV68(city)) {
    const info = weatherCodeV68(weather?.code);
    const temperature = Number.isFinite(Number(weather?.temperature)) ? `${Math.round(Number(weather.temperature))}°` : "…";
    const label = weather?.text || info.text;
    return `<div class="ios-weather-block-v68" data-weather-city="${escapeHtml(city)}"><i>${weather?.icon || info.icon}</i><strong>${temperature}</strong><em>${escapeHtml(label)}</em><small>${escapeHtml(city)}</small></div>`;
  }

  async function loadWeatherV68(city) {
    const cleanCity = String(city || "Cottbus").trim() || "Cottbus";
    const cached = readWeatherCacheV68(cleanCity);
    if (cached && Date.now() - Number(cached.atMs || 0) < WEATHER_CACHE_MS_V68) return cached;
    try {
      const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanCity)}&count=1&language=de&format=json&countryCode=DE`;
      const geocodeResponse = await fetch(geocodeUrl, { cache: "no-store" });
      if (!geocodeResponse.ok) throw new Error("Ort konnte nicht geladen werden");
      const geocode = await geocodeResponse.json();
      const place = geocode?.results?.[0];
      if (!place) throw new Error("Kein deutscher Ort gefunden");
      const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(place.latitude)}&longitude=${encodeURIComponent(place.longitude)}&current=temperature_2m,weather_code&timezone=Europe%2FBerlin`;
      const forecastResponse = await fetch(forecastUrl, { cache: "no-store" });
      if (!forecastResponse.ok) throw new Error("Wetter konnte nicht geladen werden");
      const forecast = await forecastResponse.json();
      const info = weatherCodeV68(forecast?.current?.weather_code);
      const next = {
        atMs: Date.now(),
        city: place.name || cleanCity,
        temperature: Number(forecast?.current?.temperature_2m),
        code: Number(forecast?.current?.weather_code),
        icon: info.icon,
        text: info.text
      };
      localStorage.setItem(weatherCacheKeyV68(cleanCity), JSON.stringify(next));
      return next;
    } catch (error) {
      return cached || { atMs: Date.now(), city: cleanCity, temperature: NaN, code: -1, icon: "🌡️", text: "Offline" };
    }
  }

  function updateWeatherWidgetsV68(root) {
    const blocks = [...root.querySelectorAll(".ios-weather-block-v68[data-weather-city]")];
    const cities = [...new Set(blocks.map((block) => block.dataset.weatherCity).filter(Boolean))];
    cities.forEach(async (city) => {
      const weather = await loadWeatherV68(city);
      [...root.querySelectorAll(".ios-weather-block-v68[data-weather-city]")]
        .filter((block) => block.dataset.weatherCity === city)
        .forEach((block) => {
          const fresh = document.createElement("div");
          fresh.innerHTML = weatherBlockHtmlV68(city, weather);
          block.replaceWith(fresh.firstElementChild);
        });
    });
  }

  function calendarWidgetHtmlV64() {
    const now = new Date();
    const weekday = now.toLocaleDateString("de-DE", { weekday: "long" });
    const month = now.toLocaleDateString("de-DE", { month: "long" });
    return `<article class="ios-widget-v64 ios-calendar-widget-v64 ios-calendar-unit-v78">
      <small>KALENDER</small>
      <div class="ios-calendar-date-v68"><em>${weekday}</em><b>${now.getDate()}</b><span>${month} · Tag ${Math.max(1, Number(state?.day || 1))}</span></div>
    </article>`;
  }

  function weatherWidgetHtmlV64() {
    const city = String(state?.worldLocation || state?.homeCity || "Cottbus");
    return `<article class="ios-widget-v64 ios-weather-widget-v78">
      <small>WETTER</small>
      ${weatherBlockHtmlV68(city)}
    </article>`;
  }

  function statusMetricV84(value, fallback = 100) {
    const number = Number(value);
    return Math.max(0, Math.min(100, Math.round(Number.isFinite(number) ? number : fallback)));
  }

  function statusAverageV84(values, fallback = 0) {
    const normalized = values
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value))
      .map((value) => Math.max(0, Math.min(100, value)));
    if (!normalized.length) return statusMetricV84(fallback, fallback);
    return Math.round(normalized.reduce((sum, value) => sum + value, 0) / normalized.length);
  }

  function activeStatusPetV84() {
    const pets = Array.isArray(state?.pets) ? state.pets.filter(Boolean) : [];
    return pets.find((pet) => pet?.id === state?.activePetId)
      || pets.find((pet) => pet?.active === true)
      || pets[0]
      || null;
  }

  function relationshipStatusV84() {
    try {
      const partner = typeof finderRelationshipPartner === "function" ? finderRelationshipPartner() : null;
      if (!partner) return { partner: null, values: [], value: 0, critical: false };
      const stats = typeof finderRelationshipStats === "function" ? finderRelationshipStats() : null;
      const values = [stats?.relationship, stats?.mood].map((value) => statusMetricV84(value, 0));
      return {
        partner,
        values,
        value: statusAverageV84(values, 0),
        critical: values.some((value) => value <= 20)
      };
    } catch {
      return { partner: null, values: [], value: 0, critical: false };
    }
  }

  function statusRowHtmlV84(label, value, critical = false, empty = false, title = "") {
    const safeValue = statusMetricV84(value, 0);
    const classes = ["ios-status-row-v84", critical ? "is-critical-v84" : "", empty ? "is-empty-v84" : ""].filter(Boolean).join(" ");
    return `<span class="${classes}"${title ? ` title="${escapeHtml(title)}"` : ""}><strong>${escapeHtml(label)}</strong><i style="--value:${safeValue}%"><u></u></i><em>${safeValue}%</em></span>`;
  }

  function statusWidgetHtmlV64() {
    const city = String(state?.worldLocation || state?.homeCity || "Cottbus");
    const playerName = String(state?.firstName || "JK.Games");

    const playerValues = [
      statusMetricV84(state?.health ?? 100),
      statusMetricV84(state?.hunger ?? 100),
      statusMetricV84(state?.thirst ?? 100),
      statusMetricV84(state?.energy ?? 100),
      statusMetricV84(state?.mood ?? 78)
    ];
    const playerValue = statusAverageV84(playerValues, 100);
    const playerCritical = playerValues.some((value) => value <= 20);

    const pet = activeStatusPetV84();
    const petValues = pet ? [
      statusMetricV84(pet?.hunger ?? 80),
      statusMetricV84(pet?.thirst ?? 80),
      statusMetricV84(pet?.happiness ?? 80),
      statusMetricV84(pet?.care ?? 80)
    ] : [];
    const petValue = pet ? statusAverageV84(petValues, 0) : 0;
    const petCritical = !!pet && petValues.some((value) => value <= 20);

    const relationship = relationshipStatusV84();
    const petTitle = pet
      ? `${String(pet.name || "Hund")} · Hunger, Durst, Freude und Pflege · ${petValue}%`
      : "Noch kein Hund aktiv";
    const partnerTitle = relationship.partner
      ? `${String(relationship.partner.name || "Freundin")} · Beziehung und Stimmung · ${relationship.value}%`
      : "Noch keine Freundin";

    return `<article class="ios-widget-v64 ios-status-widget-v64 ios-status-widget-v84">
      <header><b>${escapeHtml(playerName)}</b><small>${escapeHtml(city)}</small></header>
      <div class="ios-status-list-v84">
        ${statusRowHtmlV84("Ich", playerValue, playerCritical, false, `Leben, Hunger, Durst, Energie und Stimmung · ${playerValue}%`)}
        ${statusRowHtmlV84("Hund", petValue, petCritical, !pet, petTitle)}
        ${statusRowHtmlV84("Freundin", relationship.value, relationship.critical, !relationship.partner, partnerTitle)}
      </div>
    </article>`;
  }

  function compactNumberV85(value, suffix = "") {
    const number = Number(value || 0);
    const abs = Math.abs(number);
    const format = (amount, unit) => `${amount.toLocaleString("de-DE", { maximumFractionDigits: amount < 10 ? 1 : 0 })}${unit}${suffix}`;
    if (abs >= 1e9) return format(number / 1e9, " Mrd.");
    if (abs >= 1e6) return format(number / 1e6, " Mio.");
    if (abs >= 1e3) return format(number / 1e3, " Tsd.");
    return `${Math.round(number).toLocaleString("de-DE")}${suffix}`;
  }

  function genericWidgetHtmlV85(kind, eyebrow, value, detail, icon = "▦", tone = "blue") {
    return `<article class="ios-widget-v64 ios-generic-widget-v85 tone-${tone}" data-widget-kind-v85="${escapeHtml(kind)}">
      <small>${escapeHtml(eyebrow)}</small>
      <div><i>${escapeHtml(icon)}</i><b>${escapeHtml(value)}</b></div>
      <em>${escapeHtml(detail)}</em>
    </article>`;
  }

  function levelWidgetHtmlV85() {
    const level = Math.max(0, Math.floor(Number(state?.level || 0)));
    const current = Math.max(0, Number(state?.xp || 0));
    let needed = 100;
    try { if (typeof xpNeeded === "function") needed = Math.max(1, Number(xpNeeded(level) || 100)); } catch {}
    const percent = Math.max(0, Math.min(100, Math.round((current / needed) * 100)));
    return `<article class="ios-widget-v64 ios-generic-widget-v85 tone-gold" data-widget-kind-v85="level">
      <small>FORTSCHRITT</small><div><i>★</i><b>Level ${level}</b></div>
      <span class="ios-generic-progress-v85"><u style="width:${percent}%"></u></span><em>${Math.round(current).toLocaleString("de-DE")} / ${Math.round(needed).toLocaleString("de-DE")} EP</em>
    </article>`;
  }

  function clockWidgetHtmlV85() {
    const now = new Date();
    const time = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    const day = Math.max(1, Math.floor(Number(state?.day || 1)));
    return genericWidgetHtmlV85("clock", "ZEIT", time, `Spieltag ${day}`, "◷", "purple");
  }

  function widgetHtmlV85(widgetId) {
    const city = String(state?.worldLocation || state?.homeCity || "Cottbus");
    const tax = Math.max(0, Number(state?.taxLiability || 0));
    switch (widgetId) {
      case "calendar": return calendarWidgetHtmlV64();
      case "weather": return weatherWidgetHtmlV64();
      case "bank": return genericWidgetHtmlV85("bank", "BANK", compactNumberV85(state?.bank, " €"), state?.bankName || "Aktivkonto", "€", "blue");
      case "cash": return genericWidgetHtmlV85("cash", "BARGELD", compactNumberV85(state?.cash, " €"), "Im Portemonnaie", "💶", "green");
      case "battery": return genericWidgetHtmlV85("battery", "AKKU", `${Math.round(Number(state?.phoneBattery ?? 100))}%`, Number(state?.phoneBattery ?? 100) <= 20 ? "Bitte aufladen" : "Smartphone bereit", "🔋", Number(state?.phoneBattery ?? 100) <= 20 ? "red" : "green");
      case "level": return levelWidgetHtmlV85();
      case "location": return genericWidgetHtmlV85("location", "AKTUELLER ORT", city, String(state?.location || "Unterwegs"), "⌖", "purple");
      case "debt": return genericWidgetHtmlV85("debt", "OFFENE BETRÄGE", compactNumberV85(Number(state?.debt || 0) + tax, " €"), `Schulden ${compactNumberV85(state?.debt, " €")} · Steuern ${compactNumberV85(tax, " €")}`, "§", (Number(state?.debt || 0) + tax) > 0 ? "red" : "green");
      case "clock": return clockWidgetHtmlV85();
      case "status":
      default: return statusWidgetHtmlV64();
    }
  }

  function appIconButtonV64(templateButton, slotIndex, app, options = {}) {
    const button = templateButton.cloneNode(true);
    button.classList.remove("active");
    button.classList.add("ios-app-icon-v64");
    if (options.dock) button.classList.add("ios-dock-app-v64");
    button.dataset.phoneSlot = String(slotIndex);
    // Auf Touch-Geräten wird bewusst kein nativer HTML-Drag gestartet. Dieser
    // erzeugt in mobilen Browsern das schwarze Rechteck unter dem App-Symbol.
    button.draggable = !window.matchMedia?.("(pointer: coarse)")?.matches;
    button.setAttribute("aria-label", app?.label || button.textContent.trim());
    return button;
  }

  function buildHomeScreenV64(shell, item) {
    const screen = shell.querySelector(".device-screen");
    const grid = screen?.querySelector(".device-app-grid");
    if (!screen || !grid) return;

    shell.classList.add("device-home-v64");
    shell.classList.remove("device-app-open-v64", "device-active-settings");
    shell.classList.add("device-active-home-v64");
    screen.classList.remove("device-app-screen-v64");

    const appButtons = [...grid.querySelectorAll(":scope > button[data-device-app]")];
    const appMap = new Map(appButtons.map((button) => [button.dataset.deviceApp, button]));
    const apps = deviceAppsFor(item);
    const appById = new Map(apps.map((app) => [app.id, app]));
    const ids = appButtons.map((button) => button.dataset.deviceApp).filter(Boolean);
    let dockIds = normalizeDockV64(ids);
    const pageIds = ids.filter((id) => !dockIds.includes(id));
    const slots = normalizeOrderV64(pageIds);

    const home = document.createElement("section");
    home.className = "device-home-shell-v64";
    home.innerHTML = `
      <header class="ios-home-toolbar-v64">
        <span class="ios-home-edit-title-v64" data-phone-edit-title>Home-Bildschirm</span>
        <button type="button" data-phone-edit-done aria-label="Bearbeiten beenden">Fertig</button>
      </header>
      <div class="device-home-pages-viewport-v68"><div class="device-home-pages-v64" data-phone-pages></div></div>
      <div class="ios-page-dots-v64" data-phone-page-dots></div>
      <div class="ios-dock-v64" data-phone-dock></div>`;

    screen.replaceChildren(home);

    const pagesHost = home.querySelector("[data-phone-pages]");
    const dotsHost = home.querySelector("[data-phone-page-dots]");
    const dockHost = home.querySelector("[data-phone-dock]");
    const doneButton = home.querySelector("[data-phone-edit-done]");
    const editTitle = home.querySelector("[data-phone-edit-title]");
    let page = readStoredPageV64();
    let selectedSlot = null;
    let selectedWidget = "";
    let widgetOrder = readWidgetOrderV64();
    let editing = false;
    let longPressed = false;

    function pageStartIndex(pageIndex) {
      if (pageIndex <= 0) return 0;
      return FIRST_PAGE_SIZE + (pageIndex - 1) * OTHER_PAGE_SIZE;
    }

    function pageSize(pageIndex) {
      return pageIndex === 0 ? FIRST_PAGE_SIZE : OTHER_PAGE_SIZE;
    }

    function setEditingV64(next, selected = null, widgetId = "") {
      editing = !!next;
      selectedSlot = editing ? selected : null;
      selectedWidget = editing ? widgetId : "";
      home.classList.toggle("is-arranging", editing);
      doneButton.classList.toggle("visible", editing);
      editTitle.textContent = editing ? "Apps anordnen" : "Home-Bildschirm";
      home.querySelectorAll("[data-phone-slot]").forEach((node) => {
        node.classList.toggle("selected", Number(node.dataset.phoneSlot) === selectedSlot);
      });
      home.querySelectorAll("[data-phone-widget]").forEach((node) => {
        node.classList.toggle("selected", node.dataset.phoneWidget === selectedWidget);
      });
    }

    function renderDotsV64() {
      dotsHost.innerHTML = Array.from({ length: PAGE_COUNT }, (_, index) => `<button type="button" class="${index === page ? "active" : ""}" data-phone-dot="${index}" aria-label="Home-Bildschirm ${index + 1}"></button>`).join("");
      dotsHost.querySelectorAll("[data-phone-dot]").forEach((button) => button.addEventListener("click", () => goToPageV64(Number(button.dataset.phoneDot))));
    }

    function applyPagePositionV68(animate = true, dragOffset = 0) {
      pagesHost.classList.toggle("is-animating-v68", !!animate);
      const width = Math.max(1, pagesHost.parentElement?.clientWidth || pagesHost.clientWidth || 1);
      const percent = -(page * 100) + (dragOffset / width) * 100;
      pagesHost.style.transform = `translate3d(${percent}%,0,0)`;
    }

    function goToPageV64(nextPage, animate = true) {
      page = Math.max(0, Math.min(PAGE_COUNT - 1, Number(nextPage) || 0));
      writeStoredPageV64(page);
      applyPagePositionV68(animate, 0);
      renderDotsV64();
    }

    function handleSlotTargetV64(targetIndex) {
      if (!editing || !Number.isInteger(selectedSlot)) return false;
      moveLayoutItemV64(selectedSlot, targetIndex);
      selectedSlot = null;
      renderPagesV64();
      renderDockV64();
      return true;
    }

    function moveLayoutItemV64(fromIndex, toIndex) {
      if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex) || fromIndex === toIndex) return;
      const fromDock = fromIndex < 0;
      const toDock = toIndex < 0;
      if (!fromDock && !toDock) {
        swapSlotsV64(slots, fromIndex, toIndex);
        return;
      }

      const getValue = (index) => index < 0 ? dockIds[-index - 1] : slots[index];
      const setValue = (index, value) => {
        if (index < 0) dockIds[-index - 1] = value || null;
        else slots[index] = value || null;
      };
      const fromValue = getValue(fromIndex);
      if (!fromValue) return;
      const toValue = getValue(toIndex);
      setValue(toIndex, fromValue);
      setValue(fromIndex, toValue);
      persistOrderV64(slots);
      persistDockV64(dockIds);
    }

    function moveWidgetV64(targetId) {
      if (!editing || !selectedWidget || !targetId || selectedWidget === targetId) return false;
      const from = widgetOrder.indexOf(selectedWidget);
      const to = widgetOrder.indexOf(targetId);
      if (from < 0 || to < 0) return false;
      const [value] = widgetOrder.splice(from, 1);
      widgetOrder.splice(to, 0, value);
      persistWidgetOrderV64(widgetOrder);
      selectedWidget = "";
      renderPagesV64();
      return true;
    }

    function setCleanDragImageV68(event, source) {
      if (!event.dataTransfer || !source) return;
      const ghost = source.cloneNode(true);
      ghost.classList.add("phone-drag-ghost-v68");
      ghost.style.position = "fixed";
      ghost.style.left = "-9999px";
      ghost.style.top = "-9999px";
      ghost.style.margin = "0";
      ghost.style.background = "transparent";
      ghost.style.boxShadow = "none";
      ghost.style.pointerEvents = "none";
      document.body.appendChild(ghost);
      const icon = ghost.querySelector(":scope > span") || ghost;
      const rect = icon.getBoundingClientRect();
      event.dataTransfer.setDragImage(ghost, Math.max(1, rect.width / 2), Math.max(1, rect.height / 2));
      window.setTimeout(() => ghost.remove(), 0);
    }

    function wireAppButtonV64(templateButton, slotIndex, options = {}) {
      const appId = templateButton.dataset.deviceApp;
      const app = appById.get(appId);
      const button = appIconButtonV64(templateButton, slotIndex, app, options);
      const coarsePointer = !!window.matchMedia?.("(pointer: coarse)")?.matches;

      let holdTimer = null;
      let activePointerId = null;
      let startX = 0;
      let startY = 0;
      let touchDragging = false;
      let dragGhost = null;
      let dragTarget = null;
      let longPressResetTimer = null;
      let pointerMoved = false;
      let activePointerType = "";
      let directTouchTapAt = 0;

      const cancelHold = () => {
        if (holdTimer) window.clearTimeout(holdTimer);
        holdTimer = null;
      };

      const clearDragTarget = () => {
        home.querySelectorAll(".phone-drop-target-v77").forEach((node) => node.classList.remove("phone-drop-target-v77"));
        dragTarget = null;
      };

      const removeDragGhost = () => {
        clearDragTarget();
        dragGhost?.remove();
        dragGhost = null;
        touchDragging = false;
      };

      const createTouchGhost = (x, y) => {
        removeDragGhost();
        touchDragging = true;
        dragGhost = document.createElement("div");
        dragGhost.className = "phone-touch-drag-ghost-v77";
        const icon = button.querySelector(":scope > span")?.cloneNode(true);
        if (icon) dragGhost.appendChild(icon);
        else dragGhost.textContent = app?.icon || "□";
        document.body.appendChild(dragGhost);
        dragGhost.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-58%)`;
      };

      const updateTouchDrag = (x, y) => {
        if (!dragGhost) return;
        dragGhost.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-58%)`;
        clearDragTarget();
        const target = document.elementFromPoint(x, y)?.closest?.("[data-phone-slot]");
        if (!target || !home.contains(target)) return;
        const targetIndex = Number(target.dataset.phoneSlot);
        if (!Number.isInteger(targetIndex)) return;
        dragTarget = targetIndex;
        target.classList.add("phone-drop-target-v77");
      };

      const finishPointer = (event, cancelled = false) => {
        if (activePointerId == null || event.pointerId !== activePointerId) return;
        cancelHold();
        if (touchDragging) {
          if (event.cancelable) event.preventDefault();
          const destination = dragTarget;
          removeDragGhost();
          if (!cancelled && Number.isInteger(destination) && destination !== slotIndex) {
            moveLayoutItemV64(slotIndex, destination);
            renderPagesV64();
            renderDockV64();
          }
          setEditingV64(true);
          longPressed = true;
          window.clearTimeout(longPressResetTimer);
          longPressResetTimer = window.setTimeout(() => { longPressed = false; }, 650);
        }
        try { button.releasePointerCapture?.(event.pointerId); } catch {}
        activePointerId = null;
      };

      button.addEventListener("contextmenu", (event) => {
        if (coarsePointer || editing) event.preventDefault();
      });

      button.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        longPressed = false;
        cancelHold();
        activePointerId = event.pointerId;
        activePointerType = String(event.pointerType || "");
        pointerMoved = false;
        startX = event.clientX;
        startY = event.clientY;
        holdTimer = window.setTimeout(() => {
          longPressed = true;
          setEditingV64(true, slotIndex);
          if (coarsePointer || event.pointerType === "touch" || event.pointerType === "pen") {
            touchDragging = true;
            createTouchGhost(event.clientX, event.clientY);
            try { button.setPointerCapture?.(event.pointerId); } catch {}
          }
          if (settings.phoneHaptics && navigator.vibrate) navigator.vibrate([24, 28, 24]);
        }, 430);
      });

      button.addEventListener("pointermove", (event) => {
        if (event.pointerId !== activePointerId) return;
        if (!touchDragging) {
          if (Math.hypot(event.clientX - startX, event.clientY - startY) > 10) {
            pointerMoved = true;
            cancelHold();
          }
          return;
        }
        if (event.cancelable) event.preventDefault();
        updateTouchDrag(event.clientX, event.clientY);
      }, { passive: false });

      button.addEventListener("pointerup", (event) => {
        if (activePointerId == null || event.pointerId !== activePointerId) return;

        const pointerType = String(event.pointerType || activePointerType || "");
        const wasDragging = touchDragging;
        const wasLongPressed = longPressed;
        const wasMoved = pointerMoved;

        finishPointer(event, false);

        // V87: Auf Touch und Stift wird die App direkt beim ersten Loslassen
        // geöffnet. Der verzögerte Browser-Click ist dafür nicht mehr nötig.
        if ((pointerType === "touch" || pointerType === "pen")
          && !wasDragging
          && !wasLongPressed
          && !wasMoved
          && !editing) {
          if (event.cancelable) event.preventDefault();
          event.stopPropagation();
          directTouchTapAt = performance.now();
          activateAppV64(item, app);
        }
      }, { passive: false });

      button.addEventListener("pointercancel", (event) => {
        pointerMoved = true;
        finishPointer(event, true);
      });
      button.addEventListener("pointerleave", () => {
        if (!touchDragging) cancelHold();
      });

      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();

        // Nach dem direkten Touch-Pointer-Up erzeugen manche Browser noch einen
        // synthetischen Click. Dieser wird nur blockiert, damit die App nicht
        // zweimal geöffnet wird.
        if (directTouchTapAt && performance.now() - directTouchTapAt < 900) {
          directTouchTapAt = 0;
          return;
        }

        if (longPressed) {
          longPressed = false;
          return;
        }
        if (editing) {
          if (!Number.isInteger(selectedSlot)) setEditingV64(true, slotIndex);
          else if (!handleSlotTargetV64(slotIndex)) setEditingV64(true, slotIndex);
          return;
        }
        // Ein normaler einzelner Klick/Tipp öffnet die App immer direkt.
        activateAppV64(item, app);
      }, { capture: true });

      // Desktop behält sauberes Drag-and-drop; mobile Browser nutzen den eigenen
      // Pointer-Drag oben und erhalten deshalb niemals das schwarze native Vorschaubild.
      button.addEventListener("dragstart", (event) => {
        if (coarsePointer) {
          event.preventDefault();
          return;
        }
        setEditingV64(true, slotIndex);
        event.dataTransfer?.setData("text/plain", String(slotIndex));
        if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
        setCleanDragImageV68(event, button);
      });
      button.addEventListener("dragend", () => {
        if (!coarsePointer) setEditingV64(false);
      });
      return button;
    }

    function wireWidgetV64(widgetId, html) {
      const wrapper = document.createElement("div");
      wrapper.className = "ios-widget-slot-v64";
      wrapper.dataset.phoneWidget = widgetId;
      wrapper.draggable = true;
      wrapper.innerHTML = html;

      let holdTimer = null;
      const cancelHold = () => {
        if (holdTimer) window.clearTimeout(holdTimer);
        holdTimer = null;
      };

      wrapper.addEventListener("pointerdown", () => {
        cancelHold();
        holdTimer = window.setTimeout(() => {
          setEditingV64(true, null, widgetId);
          if (settings.phoneHaptics && navigator.vibrate) navigator.vibrate([24, 28, 24]);
        }, 500);
      });
      ["pointerup", "pointercancel", "pointerleave"].forEach((type) => wrapper.addEventListener(type, cancelHold));

      wrapper.addEventListener("click", (event) => {
        if (!editing) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!selectedWidget) setEditingV64(true, null, widgetId);
        else if (!moveWidgetV64(widgetId)) setEditingV64(true, null, widgetId);
      }, { capture: true });

      wrapper.addEventListener("dragstart", (event) => {
        setEditingV64(true, null, widgetId);
        event.dataTransfer?.setData("text/widget", widgetId);
        if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
        setCleanDragImageV68(event, wrapper);
      });
      wrapper.addEventListener("dragover", (event) => {
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      });
      wrapper.addEventListener("drop", (event) => {
        event.preventDefault();
        const fromId = event.dataTransfer?.getData("text/widget") || selectedWidget;
        if (fromId) {
          selectedWidget = fromId;
          moveWidgetV64(widgetId);
        }
      });
      wrapper.addEventListener("dragend", () => setEditingV64(false));
      return wrapper;
    }

    function createEmptySlotV64(slotIndex) {
      const empty = document.createElement("button");
      empty.type = "button";
      empty.className = "device-home-empty-v64";
      empty.dataset.phoneSlot = String(slotIndex);
      empty.setAttribute("aria-label", "Leerer App-Platz");
      empty.addEventListener("click", (event) => {
        event.preventDefault();
        if (handleSlotTargetV64(slotIndex)) return;
      });
      return empty;
    }

    function createEmptyDockSlotV64(dockIndex) {
      const encoded = -(dockIndex + 1);
      const empty = document.createElement("button");
      empty.type = "button";
      empty.className = "device-home-empty-v64 device-dock-empty-v66";
      empty.dataset.phoneSlot = String(encoded);
      empty.setAttribute("aria-label", "Leerer Dock-Platz");
      empty.addEventListener("click", (event) => {
        event.preventDefault();
        handleSlotTargetV64(encoded);
      });
      return empty;
    }

    function wireDropTargetV64(node, slotIndex) {
      node.addEventListener("dragover", (event) => {
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      });
      node.addEventListener("drop", (event) => {
        event.preventDefault();
        const rawFrom = event.dataTransfer?.getData("text/plain") || "";
        const from = /^-?\d+$/.test(rawFrom) ? Number(rawFrom) : NaN;
        if (Number.isInteger(from)) {
          moveLayoutItemV64(from, slotIndex);
          setEditingV64(false);
          renderPagesV64();
          renderDockV64();
        }
      });
    }

    function renderPagesV64() {
      pagesHost.replaceChildren();
      for (let pageIndex = 0; pageIndex < PAGE_COUNT; pageIndex += 1) {
        const pageNode = document.createElement("div");
        pageNode.className = `device-home-page-v64 ${pageIndex === 0 ? "has-widgets" : ""}`;
        if (pageIndex === 0) {
          const widgets = document.createElement("div");
          widgets.className = "ios-widgets-row-v64";
          widgetOrder.forEach((widgetId) => {
            widgets.append(wireWidgetV64(widgetId, widgetHtmlV85(widgetId)));
          });
          pageNode.append(widgets);
        }
        const icons = document.createElement("div");
        icons.className = "ios-icons-grid-v64";
        const start = pageStartIndex(pageIndex);
        const size = pageSize(pageIndex);
        for (let offset = 0; offset < size; offset += 1) {
          const slotIndex = start + offset;
          const appId = slots[slotIndex];
          const node = appId && appMap.has(appId)
            ? wireAppButtonV64(appMap.get(appId), slotIndex)
            : createEmptySlotV64(slotIndex);
          wireDropTargetV64(node, slotIndex);
          icons.append(node);
        }
        pageNode.append(icons);
        pagesHost.append(pageNode);
      }
      renderDotsV64();
      applyPagePositionV68(false, 0);
      updateWeatherWidgetsV68(home);
      setEditingV64(editing, selectedSlot, selectedWidget);
    }

    function renderDockV64() {
      dockHost.replaceChildren();
      dockIds.forEach((id, index) => {
        const encoded = -(index + 1);
        const template = id ? appMap.get(id) : null;
        const app = id ? appById.get(id) : null;
        const node = template && app
          ? wireAppButtonV64(template, encoded, { dock: true })
          : createEmptyDockSlotV64(index);
        wireDropTargetV64(node, encoded);
        dockHost.append(node);
      });
      setEditingV64(editing, selectedSlot, selectedWidget);
    }

    doneButton.addEventListener("click", () => setEditingV64(false));

    let swipeStartX = 0;
    let swipeStartY = 0;
    let swipePointerId = null;
    let swipeDragging = false;
    let swipeDx = 0;
    pagesHost.addEventListener("pointerdown", (event) => {
      if (editing || event.button !== 0) return;
      swipePointerId = event.pointerId;
      swipeStartX = event.clientX;
      swipeStartY = event.clientY;
      swipeDx = 0;
      swipeDragging = false;
      pagesHost.classList.remove("is-animating-v68");
    });
    pagesHost.addEventListener("pointermove", (event) => {
      if (swipePointerId !== event.pointerId || editing) return;
      const dx = event.clientX - swipeStartX;
      const dy = event.clientY - swipeStartY;
      if (!swipeDragging && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.15) {
        swipeDragging = true;
        try { pagesHost.setPointerCapture?.(event.pointerId); } catch {}
      }
      if (!swipeDragging) return;
      event.preventDefault();
      const atStart = page === 0 && dx > 0;
      const atEnd = page === PAGE_COUNT - 1 && dx < 0;
      swipeDx = (atStart || atEnd) ? dx * 0.28 : dx;
      applyPagePositionV68(false, swipeDx);
    }, { passive: false });
    const finishSwipeV68 = (event) => {
      if (swipePointerId !== event.pointerId) return;
      const width = Math.max(1, pagesHost.parentElement?.clientWidth || 1);
      const velocityDistance = Math.abs(swipeDx);
      let next = page;
      if (swipeDragging && velocityDistance > Math.min(72, width * 0.18)) next += swipeDx < 0 ? 1 : -1;
      try { pagesHost.releasePointerCapture?.(event.pointerId); } catch {}
      swipePointerId = null;
      swipeDragging = false;
      swipeDx = 0;
      goToPageV64(next, true);
    };
    pagesHost.addEventListener("pointerup", finishSwipeV68);
    pagesHost.addEventListener("pointercancel", finishSwipeV68);

    renderPagesV64();
    renderDockV64();
  }

  function decorateAppScreenV64(shell, item, activeApp) {
    shell.classList.remove("device-home-v64", "device-active-home-v64");
    shell.classList.add("device-app-open-v64");
    const screen = shell.querySelector(".device-screen");
    const view = screen?.querySelector(".device-app-view");
    if (!screen || !view) return;
    screen.classList.add("device-app-screen-v64");
    view.classList.add("device-app-window-v64");

    if (activeApp === "settings") {
      view.querySelector("[data-phone-open-game-settings]")?.closest(".ios-settings-group")?.remove();
    }
  }

  function decoratePhoneV64(item, activeApp) {
    if (!phoneItems().includes(item)) return;
    const dialog = els.dialog;
    const shell = dialog?.querySelector?.(".device-shell.device-phone");
    if (!dialog || !shell) return;

    dialog.classList.add("device-dialog-v64");
    shell.classList.add("device-shell-v64");
    document.documentElement.classList.add("phone-v64-open");
    document.body.classList.add("phone-v64-open");

    installHomeBarBehaviorV64(shell, item, activeApp);
    if (activeApp === "home") buildHomeScreenV64(shell, item);
    else decorateAppScreenV64(shell, item, activeApp);
  }

  openDeviceInterface = function openDeviceInterfaceV64(item, activeApp = "home", activeUse = true) {
    const normalizedApp = activeApp || "home";
    const result = baseOpenDeviceInterfaceV64(item, normalizedApp, activeUse);
    if (phoneItems().includes(item)) decoratePhoneV64(item, normalizedApp);
    return result;
  };

  window.addEventListener("lifebuilder-auth-changed", () => {
    if (els.dialog?.open && els.dialog.querySelector(".device-shell-v64.device-home-v64")) {
      openPhoneHomeV64(ownedPhoneItem());
    }
  });

  window.JKGamesPhoneV64 = Object.freeze({
    version: VERSION,
    resetLayout() {
      localStorage.removeItem(orderStorageKeyV64());
      localStorage.removeItem(pageStorageKeyV64());
      localStorage.removeItem(widgetStorageKeyV64());
      localStorage.removeItem(dockStorageKeyV64());
      if (els.dialog?.open && els.dialog.querySelector(".device-shell-v64")) openPhoneHomeV64(ownedPhoneItem());
    }
  });
})();


/* ===== Integriert aus phone-v65.js ===== */
/* ========================================================================== 
   JK.Games Professional V65 · nur noch das neue iPhone-Layout
   - entfernt die alte Dialog-Kopfzeile (Ultra Smartphone, X, Zurück, Fertig)
   - hält Telefon, SMS, Notizen, Bank und Einstellungen im festen iPhone-Rahmen
   - der untere Home-Indikator ist der einzige Zurück-/Schließen-Button
   - verkleinert die App-Hitbox auf Icon und Beschriftung
   ========================================================================== */
(() => {
  "use strict";

  const VERSION = "2026-07-29-jkgames-v87-pets-hotels-vehicles-electric";
  const baseOpenDeviceInterfaceV65 = openDeviceInterface;
  const baseClearDialogDynamicV65 = clearDialogDynamic;
  let enforcingV65 = false;

  function phoneDialogV65() {
    return (typeof els !== "undefined" && els?.dialog) || document.querySelector("#detailDialog");
  }

  function currentPhoneShellV65() {
    return phoneDialogV65()?.querySelector?.(".device-shell.device-phone") || null;
  }

  function restoreDialogChromeV65(dialog) {
    if (!dialog) return;
    ["closeDialog", "dialogTitle", "dialogText"].forEach((id) => {
      const node = dialog.querySelector(`:scope > #${id}`);
      if (!node) return;
      node.hidden = false;
      node.removeAttribute("aria-hidden");
      node.style.removeProperty("display");
      node.style.removeProperty("visibility");
      node.style.removeProperty("pointer-events");
    });
    const back = dialog.querySelector(":scope > #dialogBack");
    if (back) {
      back.removeAttribute("aria-hidden");
      back.style.removeProperty("display");
      back.style.removeProperty("visibility");
      back.style.removeProperty("pointer-events");
      // hidden wird von setDialogBack() verwaltet und darf hier nicht pauschal
      // aufgehoben werden.
    }
  }

  function captureSmsStateV65() {
    const shell = currentPhoneShellV65();
    if (!shell?.classList?.contains("device-active-sms")) return null;
    const bubbles = shell.querySelector(".ios-chat-bubbles");
    const list = shell.querySelector(".ios-message-list");
    const input = shell.querySelector("[data-sms-text]");
    const active = typeof state !== "undefined" ? String(state?.phoneActiveContact || "") : "";
    return {
      active,
      listTop: Number(list?.scrollTop || 0),
      bubbleDistance: bubbles ? Math.max(0, bubbles.scrollHeight - bubbles.scrollTop - bubbles.clientHeight) : 0,
      bubbleNearBottom: bubbles ? bubbles.scrollHeight - bubbles.scrollTop - bubbles.clientHeight < 72 : true,
      draft: input?.value || "",
      selectionStart: input?.selectionStart ?? 0,
      selectionEnd: input?.selectionEnd ?? 0,
      focused: document.activeElement === input
    };
  }

  function restoreSmsStateV65(snapshot) {
    if (!snapshot) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const shell = currentPhoneShellV65();
      if (!shell?.classList?.contains("device-active-sms")) return;
      const currentActive = typeof state !== "undefined" ? String(state?.phoneActiveContact || "") : "";
      if (snapshot.active !== currentActive) return;
      const bubbles = shell.querySelector(".ios-chat-bubbles");
      const list = shell.querySelector(".ios-message-list");
      const input = shell.querySelector("[data-sms-text]");
      if (list) list.scrollTop = Math.min(snapshot.listTop, Math.max(0, list.scrollHeight - list.clientHeight));
      if (bubbles) {
        if (snapshot.bubbleNearBottom) bubbles.scrollTop = bubbles.scrollHeight;
        else bubbles.scrollTop = Math.max(0, bubbles.scrollHeight - bubbles.clientHeight - snapshot.bubbleDistance);
      }
      if (input && snapshot.draft) {
        input.value = snapshot.draft;
        input.setSelectionRange?.(snapshot.selectionStart, snapshot.selectionEnd);
      }
      if (input && snapshot.focused) input.focus({ preventScroll: true });
    }));
  }

  function stripLegacyPhoneChromeV65(dialog, shell) {
    if (!dialog || !shell) return;

    dialog.classList.add("device-dialog-v64", "device-dialog-v65");
    shell.classList.add("device-shell-v64", "device-shell-v65");
    document.documentElement.classList.add("phone-v64-open", "phone-v65-open");
    document.body.classList.add("phone-v64-open", "phone-v65-open");

    // Die alte äußere Dialog-Kopfzeile darf im Smartphone nie mehr sichtbar sein.
    ["closeDialog", "dialogBack", "dialogTitle", "dialogText"].forEach((id) => {
      const node = dialog.querySelector(`:scope > #${id}`);
      if (!node) return;
      node.hidden = true;
      node.setAttribute("aria-hidden", "true");
      node.style.setProperty("display", "none", "important");
    });

    // Alte interne App-Kopfzeilen mit Zurück/Fertig vollständig entfernen.
    shell.querySelectorAll([
      "[data-native-app-header-v56]",
      "[data-native-app-header-v58]",
      ".device-native-window-header-v56",
      ".device-native-bank-header-v58"
    ].join(",")).forEach((node) => node.remove());

    shell.querySelectorAll([
      "[data-native-app-close-v56]",
      "[data-native-bank-close-v58]",
      ".device-native-close-v56",
      ".device-native-done-v56"
    ].join(",")).forEach((node) => node.remove());

    // Der neue Home-Indikator bleibt der einzige Navigationsknopf.
    const bar = shell.querySelector(".device-home-bar");
    if (bar) {
      bar.classList.add("device-home-bar-v64", "device-home-bar-v65");
      bar.setAttribute("title", "Zurück");
    }
  }

  function enforcePhoneV65() {
    if (enforcingV65) return;
    const dialog = phoneDialogV65();
    const shell = currentPhoneShellV65();
    if (!dialog) return;
    if (!shell) {
      restoreDialogChromeV65(dialog);
      return;
    }
    enforcingV65 = true;
    try {
      stripLegacyPhoneChromeV65(dialog, shell);
    } finally {
      enforcingV65 = false;
    }
  }

  clearDialogDynamic = function clearDialogDynamicV65() {
    const result = baseClearDialogDynamicV65();
    const dialog = phoneDialogV65();
    if (!dialog?.querySelector?.(".device-shell.device-phone")) {
      dialog?.classList.remove("device-dialog-v65");
      document.documentElement.classList.remove("phone-v65-open");
      document.body.classList.remove("phone-v65-open");
      restoreDialogChromeV65(dialog);
    }
    return result;
  };

  openDeviceInterface = function openDeviceInterfaceV65(item, activeApp = "home", activeUse = true) {
    const smsSnapshot = activeApp === "sms" ? captureSmsStateV65() : null;
    const result = baseOpenDeviceInterfaceV65(item, activeApp, activeUse);
    enforcePhoneV65();
    requestAnimationFrame(enforcePhoneV65);
    setTimeout(enforcePhoneV65, 0);
    if (smsSnapshot) restoreSmsStateV65(smsSnapshot);
    return result;
  };

  // Falls eine ältere, intern gespeicherte Funktion den Smartphone-Inhalt neu aufbaut,
  // wird die alte Kopfzeile sofort wieder entfernt, ohne die Online-Verbindungen anzufassen.
  const observer = new MutationObserver(() => enforcePhoneV65());
  const startObserver = () => {
    const dialog = phoneDialogV65();
    if (dialog) observer.observe(dialog, { childList: true, subtree: true });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startObserver, { once: true });
  else startObserver();

  // Verhindert, dass eventuell noch für einen Frame vorhandene alte Zurück-/Fertig-Knöpfe
  // die alte Smartphone-Version öffnen.
  document.addEventListener("click", (event) => {
    const legacy = event.target.closest?.("[data-native-app-close-v56],[data-native-bank-close-v58],.device-native-close-v56,.device-native-done-v56");
    if (!legacy || !currentPhoneShellV65()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openDeviceInterface(ownedPhoneItem(), "home", false);
  }, true);

  window.JKGamesPhoneV65 = Object.freeze({
    version: VERSION,
    refresh: enforcePhoneV65
  });
})();


/* ===== Integriert aus phone-v78.js ===== */
/* ========================================================================== 
   JK.Games V78 · Liquid-Glass-Handy, Bank-Scrollfix, Shop/Fobile und
   echte Marktdaten ohne künstliche Kursbewegungen · 2026-07-28
   ========================================================================== */
(() => {
  "use strict";

  const VERSION = "2026-07-29-jkgames-v87-pets-hotels-vehicles-electric";
  const PHONE_MARKET_APPS = new Set(["shop", "fobile"]);
  const SUBACCOUNT_DEFAULTS = [
    { id: "savings", name: "Sparkonto", icon: "◆", auto: "none" },
    { id: "tax", name: "Steuerkonto", icon: "§", auto: "tax" },
    { id: "debt", name: "Schuldenkonto", icon: "✓", auto: "debt" },
    { id: "reserve", name: "Rücklagenkonto", icon: "▣", auto: "none" }
  ];

  const baseDeviceAppActionsV68 = deviceAppActions;
  const baseOpenDeviceAppDirectV68 = openDeviceAppDirect;
  const baseOpenDeviceInterfaceV68 = openDeviceInterface;
  const baseDeviceBankViewHtmlV68 = deviceBankViewHtml;
  const baseRunDeviceBankActionV68 = runDeviceBankAction;
  const baseCompleteShopPurchaseV68 = completeShopPurchase;
  const baseSaveV68 = save;
  const baseCurrentMarketPriceV68 = currentMarketPrice;
  const baseMarketHistoryPointsV68 = marketHistoryPoints;
  const baseDeviceExchangeViewHtmlV68 = deviceExchangeViewHtml;
  const baseDeviceTradingViewHtmlV68 = deviceTradingViewHtml;
  const baseTradingLiveTickerHtmlV68 = tradingLiveTickerHtml;

  let bankWithdrawalTimerV68 = null;
  let liveRefreshPromiseV68 = null;
  let liveRefreshAtV68 = 0;
  let liveRerenderTimerV68 = null;

  function ensureSubaccountsV68() {
    if (!state) return [];
    if (!Array.isArray(state.bankSubaccountsV68)) state.bankSubaccountsV68 = [];
    const existing = new Map(state.bankSubaccountsV68.filter(Boolean).map((entry) => [String(entry.id), entry]));
    state.bankSubaccountsV68 = SUBACCOUNT_DEFAULTS.map((definition) => {
      const old = existing.get(definition.id) || {};
      return {
        ...definition,
        ...old,
        id: definition.id,
        auto: definition.auto,
        name: String(old.name || definition.name).slice(0, 28),
        balance: Math.max(0, Math.round(Number(old.balance || 0) * 100) / 100)
      };
    });
    if (!Array.isArray(state.bankSubaccountActivityV68)) state.bankSubaccountActivityV68 = [];
    return state.bankSubaccountsV68;
  }

  function subaccountByIdV68(id) {
    return ensureSubaccountsV68().find((entry) => entry.id === id) || null;
  }

  function addSubaccountActivityV68(account, amount, label) {
    state.bankSubaccountActivityV68.unshift({
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      accountId: account.id,
      accountName: account.name,
      amount: Math.round(Number(amount || 0) * 100) / 100,
      label: String(label || "Unterkonto"),
      atMs: Date.now()
    });
    state.bankSubaccountActivityV68 = state.bankSubaccountActivityV68.slice(0, 120);
  }

  function autoSettleSubaccountsV68() {
    if (!state) return false;
    let changed = false;
    for (const account of ensureSubaccountsV68()) {
      if (account.auto === "tax") {
        const due = Math.max(0, Math.round(Number(state.taxLiability || 0) * 100) / 100);
        const payment = Math.min(account.balance, due);
        if (payment > 0) {
          account.balance = Math.round((account.balance - payment) * 100) / 100;
          state.taxLiability = Math.max(0, Math.round((due - payment) * 100) / 100);
          state.taxAccount = Math.round((Number(state.taxAccount || 0) + payment) * 100) / 100;
          addSubaccountActivityV68(account, -payment, "Steuern automatisch bezahlt");
          addFeed(`Steuerkonto hat automatisch ${euro.format(payment)} Steuern bezahlt.`);
          changed = true;
        }
      }
      if (account.auto === "debt") {
        const due = Math.max(0, Math.round(Number(state.debt || 0) * 100) / 100);
        const payment = Math.min(account.balance, due);
        if (payment > 0) {
          account.balance = Math.round((account.balance - payment) * 100) / 100;
          state.debt = Math.max(0, Math.round((due - payment) * 100) / 100);
          state.publicTreasury = Math.round((Number(state.publicTreasury || 0) + payment) * 100) / 100;
          addSubaccountActivityV68(account, -payment, "Schulden automatisch getilgt");
          addFeed(`Schuldenkonto hat automatisch ${euro.format(payment)} Schulden getilgt.`);
          changed = true;
        }
      }
    }
    return changed;
  }

  save = function saveV68(...args) {
    ensureSubaccountsV68();
    autoSettleSubaccountsV68();
    return baseSaveV68(...args);
  };

  function subaccountsHtmlV68() {
    const rows = ensureSubaccountsV68().map((account) => {
      const autoText = account.auto === "tax"
        ? `Automatisch für offene Steuern: ${euro.format(Math.max(0, Number(state.taxLiability || 0)))}`
        : account.auto === "debt"
          ? `Automatisch für offene Schulden: ${euro.format(Math.max(0, Number(state.debt || 0)))}`
          : "Frei sparen und jederzeit zurückübertragen";
      return `<article class="jk-bank-subaccount-row-v68">
        <span>${account.icon}</span>
        <div><b>${escapeHtml(account.name)}</b><small>${escapeHtml(autoText)}</small></div>
        <strong>${euro.format(account.balance)}</strong>
        <div class="jk-bank-subaccount-actions-v68">
          <button type="button" data-bank-subaccount-in="${account.id}">Einzahlen</button>
          <button type="button" data-bank-subaccount-out="${account.id}" ${account.balance > 0 ? "" : "disabled"}>Zurück</button>
          <button type="button" data-bank-subaccount-rename="${account.id}" aria-label="Unterkonto umbenennen">✎</button>
        </div>
      </article>`;
    }).join("");
    return `<section class="jk-bank-white-card-v58 jk-bank-subaccounts-v68">
      <header><div><small>UNTERKONTEN</small><h3>Deine Unterkonten</h3></div><span>Auto</span></header>
      <p class="jk-bank-subaccounts-hint-v68">Geld auf dem Steuer- oder Schuldenkonto wird automatisch genutzt, sobald dort offene Beträge vorhanden sind.</p>
      <div>${rows}</div>
    </section>`;
  }

  function bankOverviewActionsHtmlV77() {
    return `<section class="jk-bank-white-card-v58 jk-bank-overview-actions-v77">
      <header><div><small>SCHNELLZUGRIFF</small><h3>Kontofunktionen</h3></div><span>Direkt</span></header>
      <div>
        <button type="button" data-jk-bank-view="transfer"><span>↕</span><b>Überweisen</b><small>Online oder intern</small></button>
        <button type="button" data-jk-bank-view="subaccounts"><span>▦</span><b>Unterkonten</b><small>Deine Unterkonten</small></button>
        <button type="button" data-device-bank-action="withdraw"><span>▥</span><b>Abheben</b><small>Zum Automaten</small></button>
      </div>
    </section>`;
  }

  function bankBottomNavHtmlV78(active = "overview") {
    const items = [
      ["overview", "▣", "Übersicht"],
      ["transfer", "↕", "Überweisen"],
      ["activity", "⌁", "Umsätze"],
      ["services", "⊞", "Services"]
    ];
    return `<nav class="jk-bank-bottom-nav-v58">${items.map(([id, icon, label]) => `<button type="button" class="${active === id ? "active" : ""}" data-jk-bank-view="${id}"><span>${icon}</span><b>${label}</b></button>`).join("")}</nav>`;
  }

  function subaccountsSummaryHtmlV78() {
    const accounts = ensureSubaccountsV68();
    const total = accounts.reduce((sum, account) => sum + Math.max(0, Number(account.balance || 0)), 0);
    return `<section class="jk-bank-white-card-v58 jk-bank-subaccounts-summary-v78">
      <button type="button" data-jk-bank-view="subaccounts">
        <span>▦</span>
        <div><small>UNTERKONTEN</small><b>Deine Unterkonten</b><em>${accounts.length} Konten verwalten</em></div>
        <strong>${euro.format(total)}</strong><i>›</i>
      </button>
    </section>`;
  }

  function subaccountsPageHtmlV78() {
    return `<div class="jk-bank-app-v58 jk-bank-light-page-v58 jk-bank-subaccounts-page-v78">
      <section class="jk-bank-page-head-v58">
        <button type="button" class="jk-bank-inline-back-v58" data-jk-bank-view="overview">‹</button>
        <small>DEINE FINANZEN</small><h2>Deine Unterkonten</h2>
        <p>Verteile Geld auf Sparkonto, Steuerkonto, Schuldenkonto und Rücklagenkonto. Steuer- und Schuldenkonto gleichen offene Beträge automatisch aus.</p>
      </section>
      ${subaccountsHtmlV68()}
      ${bankBottomNavHtmlV78("overview")}
    </div>`;
  }

  deviceBankViewHtml = function deviceBankViewHtmlV78() {
    ensureSubaccountsV68();
    const view = state.bankAppViewV58 || "overview";
    if (state?.onlineBanking && view === "subaccounts") return subaccountsPageHtmlV78();

    let html = baseDeviceBankViewHtmlV68();
    if (!state?.onlineBanking || !html.includes("jk-bank-bottom-nav-v58")) return html;

    // Die zusätzliche Infobox zur normalen Überweisung wird nicht mehr benötigt.
    html = html.replace(/<section class="jk-bank-info-v58">[\s\S]*?<\/section>/, "");

    if (view === "overview") {
      const activityMarker = '<section class="jk-bank-white-card-v58"><header><div><small>AKTUELLE UMSÄTZE</small>';
      html = html.replace(activityMarker, `${bankOverviewActionsHtmlV77()}${subaccountsSummaryHtmlV78()}${activityMarker}`);
    } else if (view === "services") {
      html = html.replace('<section class="jk-bank-service-list-v58">', `${subaccountsSummaryHtmlV78()}<section class="jk-bank-service-list-v58">`);
    }
    return html;
  };

  function rerenderBankV68(item = ownedPhoneItem()) {
    if (els.dialog?.open) openDeviceInterface(item || ownedPhoneItem(), "bank", false);
    else render();
  }

  function transferSubaccountV68(id, direction, item) {
    const account = subaccountByIdV68(id);
    if (!account) return;
    const available = direction === "in" ? Math.max(0, Number(state.bank || 0)) : account.balance;
    const raw = prompt(
      direction === "in" ? `Wie viel Geld möchtest du auf ${account.name} überweisen?` : `Wie viel Geld möchtest du von ${account.name} zurück aufs AktivKonto überweisen?`,
      String(Math.max(1, Math.min(500, Math.floor(available || 0))))
    );
    const amount = Math.round(Number(String(raw || "").replace(",", ".")) * 100) / 100;
    if (!amount || amount <= 0) return;
    if (amount > available) return addFeed(`Verfügbar sind nur ${euro.format(available)}.`);
    if (direction === "in") {
      state.bank = Math.round((Number(state.bank || 0) - amount) * 100) / 100;
      account.balance = Math.round((account.balance + amount) * 100) / 100;
      window.JKGamesBankLedgerContextV68 = `Übertrag auf ${account.name}`;
      addSubaccountActivityV68(account, amount, "Vom AktivKonto eingezahlt");
    } else {
      account.balance = Math.round((account.balance - amount) * 100) / 100;
      state.bank = Math.round((Number(state.bank || 0) + amount) * 100) / 100;
      window.JKGamesBankLedgerContextV68 = `Übertrag von ${account.name}`;
      addSubaccountActivityV68(account, -amount, "Zum AktivKonto zurückgebucht");
    }
    autoSettleSubaccountsV68();
    addFeed(`${euro.format(amount)} ${direction === "in" ? `auf ${account.name} überwiesen` : `von ${account.name} zurücküberwiesen`}.`);
    save();
    rerenderBankV68(item);
  }

  function renameSubaccountV68(id, item) {
    const account = subaccountByIdV68(id);
    if (!account) return;
    const name = String(prompt("Name des Unterkontos:", account.name) || "").trim().slice(0, 28);
    if (!name) return;
    account.name = name;
    save();
    rerenderBankV68(item);
  }

  function decorateBankLayoutV78(shell, item) {
    const view = shell?.querySelector?.(".device-app-window-v64");
    const app = view?.querySelector?.(".jk-bank-app-v58");
    const nav = app?.querySelector?.(":scope > .jk-bank-bottom-nav-v58");
    if (!view || !app || !nav) return;

    view.classList.add("device-bank-window-v68", "device-bank-window-v77", "device-bank-window-v78", "device-bank-window-v82");
    app.classList.add("jk-bank-fixed-layout-v68", "jk-bank-fixed-layout-v77", "jk-bank-fixed-layout-v78", "jk-bank-fixed-layout-v82");

    let scroll = app.querySelector(":scope > .jk-bank-scroll-v68");
    if (!scroll) {
      scroll = document.createElement("div");
      scroll.className = "jk-bank-scroll-v68 jk-bank-scroll-v77 jk-bank-scroll-v78 jk-bank-scroll-v82";
      scroll.tabIndex = 0;
      scroll.setAttribute("role", "region");
      scroll.setAttribute("aria-label", "Bank-Inhalt");
      [...app.children].filter((child) => child !== nav).forEach((child) => scroll.appendChild(child));
      app.insertBefore(scroll, nav);
    } else {
      scroll.classList.add("jk-bank-scroll-v78", "jk-bank-scroll-v82");
    }

    // Jede Bankseite beginnt sauber oben. Alte gespeicherte Scrollpositionen
    // haben die Unterkonten und Überschriften teilweise unter die Leiste geschoben.
    if (state.bankScrollPositionsV77 && typeof state.bankScrollPositionsV77 === "object") {
      state.bankScrollPositionsV77[String(state.bankAppViewV58 || "overview")] = 0;
    }
    requestAnimationFrame(() => { scroll.scrollTop = 0; });

    const scrollByDelta = (delta) => {
      const before = scroll.scrollTop;
      scroll.scrollTop = Math.max(0, Math.min(scroll.scrollHeight - scroll.clientHeight, before + delta));
      return Math.abs(scroll.scrollTop - before) > 0.5;
    };

    view.addEventListener("wheel", (event) => {
      if (event.target.closest?.(".jk-bank-bottom-nav-v58")) return;
      if (scrollByDelta(event.deltaY) && event.cancelable) event.preventDefault();
    }, { passive: false, capture: true });

    let lastTouchY = null;
    scroll.addEventListener("touchstart", (event) => {
      lastTouchY = event.touches?.[0]?.clientY ?? null;
    }, { passive: true });
    scroll.addEventListener("touchmove", (event) => {
      const nextY = event.touches?.[0]?.clientY;
      if (!Number.isFinite(nextY) || !Number.isFinite(lastTouchY)) return;
      const moved = scrollByDelta(lastTouchY - nextY);
      lastTouchY = nextY;
      if (moved && event.cancelable) event.preventDefault();
    }, { passive: false });
    scroll.addEventListener("touchend", () => { lastTouchY = null; }, { passive: true });
    scroll.addEventListener("touchcancel", () => { lastTouchY = null; }, { passive: true });

    shell.querySelectorAll("[data-bank-subaccount-in]").forEach((button) => button.addEventListener("click", () => transferSubaccountV68(button.dataset.bankSubaccountIn, "in", item)));
    shell.querySelectorAll("[data-bank-subaccount-out]").forEach((button) => button.addEventListener("click", () => transferSubaccountV68(button.dataset.bankSubaccountOut, "out", item)));
    shell.querySelectorAll("[data-bank-subaccount-rename]").forEach((button) => button.addEventListener("click", () => renameSubaccountV68(button.dataset.bankSubaccountRename, item)));
  }

  function showWithdrawalJourneyV68(item, amount) {
    const shell = els.dialog?.querySelector?.(".device-shell");
    const host = shell?.querySelector?.(".device-app-window-v64") || els.dialog;
    if (!host) return;
    host.querySelector(".jk-bank-withdraw-overlay-v68")?.remove();
    const overlay = document.createElement("div");
    overlay.className = "jk-bank-withdraw-overlay-v68";
    overlay.innerHTML = `<div><span>🏧</span><h3>Auf dem Weg zum Automaten</h3><p>Sie gehen gerade Geld abheben.</p><b data-bank-withdraw-countdown>5</b><small>Sekunden</small><button type="button" data-bank-withdraw-cancel>Abbrechen</button></div>`;
    host.appendChild(overlay);
    let remaining = 5;
    const countdown = overlay.querySelector("[data-bank-withdraw-countdown]");
    const cancel = () => {
      if (bankWithdrawalTimerV68) window.clearInterval(bankWithdrawalTimerV68);
      bankWithdrawalTimerV68 = null;
      overlay.remove();
    };
    overlay.querySelector("[data-bank-withdraw-cancel]")?.addEventListener("click", cancel);
    if (bankWithdrawalTimerV68) window.clearInterval(bankWithdrawalTimerV68);
    bankWithdrawalTimerV68 = window.setInterval(() => {
      remaining -= 1;
      if (countdown) countdown.textContent = String(Math.max(0, remaining));
      if (remaining > 0) return;
      window.clearInterval(bankWithdrawalTimerV68);
      bankWithdrawalTimerV68 = null;
      if (Number(state.bank || 0) < amount) {
        overlay.remove();
        return addFeed("Der Kontostand reicht am Automaten nicht mehr aus.");
      }
      state.bank = Math.round((Number(state.bank || 0) - amount) * 100) / 100;
      state.cash = Math.round((Number(state.cash || 0) + amount) * 100) / 100;
      window.JKGamesBankLedgerContextV68 = "Geld abgehoben";
      addFeed(`${euro.format(amount)} am Automaten abgehoben.`);
      save();
      overlay.remove();
      rerenderBankV68(item);
    }, 1000);
  }

  runDeviceBankAction = function runDeviceBankActionV68(action, item) {
    if (action !== "withdraw") return baseRunDeviceBankActionV68(action, item);
    if (bankWithdrawalTimerV68) return addFeed("Du bist bereits auf dem Weg zum Automaten.");
    const raw = prompt("Wie viel Euro möchtest du abheben?", "200");
    const amount = Math.round(Number(String(raw || "").replace(",", ".")) * 100) / 100;
    if (!amount || amount <= 0) return;
    if (Number(state.bank || 0) < amount) return addFeed("Nicht genug Geld auf dem Konto.");
    showWithdrawalJourneyV68(item, amount);
  };

  function phoneMarketEntriesV68(mode) {
    const vehicleMode = mode === "fobile";
    const entries = [];
    const seen = new Set();
    const add = (offer, marketKey = "", section = "Shop") => {
      if (!offer || !Number.isFinite(Number(offer.price))) return;
      const vehicle = isVehicleShopItem(offer);
      if (vehicle !== vehicleMode) return;
      if (!vehicleMode && isWorkshopTuningItem(offer)) return;
      const key = `${marketKey}|${offer.item || offer.name}|${offer.price}`;
      if (seen.has(key)) return;
      seen.add(key);
      entries.push({ offer, marketKey, section });
    };
    shopItems.forEach((parent) => {
      if (parent.market) {
        if (["usedCars", "newCars"].includes(parent.market) !== vehicleMode) return;
        (shopMarketCatalog[parent.market] || []).forEach((offer) => add(offer, parent.market, parent.name));
      } else {
        add(parent, "", parent.category || "Shop");
      }
    });
    return entries;
  }

  function phoneMarketStateV68(mode) {
    const key = mode === "fobile" ? "phoneFobileUiV68" : "phoneShopUiV68";
    state[key] ||= { query: "", category: "Alle" };
    return state[key];
  }

  function marketOfferStatusV68(entry) {
    const item = entry.offer;
    const progression = shopProgressionStatus(item, entry.marketKey);
    const missingNeed = item.needItem && !(isWorkshopTuningItem(item) ? vehicleCount() > 0 : state.items.includes(item.needItem));
    const missingProperty = item.needProperty && !hasProperty(item.needProperty);
    const owned = (!item.repeatable && item.item && !item.wear && (stateHasItemNamed(item.item) || (item.backpackSlots && Number(state.backpackSlots || 0) >= Number(item.backpackSlots)))) || (item.property && hasProperty(item.property.id));
    const noVehicleSlot = isVehicleShopItem(item) && vehicleCount() >= vehicleCapacity() && !owned;
    const locked = !!(progression.locked || missingNeed || missingProperty || owned || noVehicleSlot);
    const label = owned ? "Besitzt du" : noVehicleSlot ? "Garage voll" : progression.locked || missingNeed || missingProperty ? "Gesperrt" : "Kaufen";
    return { locked, label, detail: progression.text || "" };
  }

  function phoneMarketViewHtmlV68(mode) {
    const vehicleMode = mode === "fobile";
    const ui = phoneMarketStateV68(mode);
    const all = phoneMarketEntriesV68(mode);
    const categories = ["Alle", ...new Set(all.map((entry) => entry.section))];
    if (!categories.includes(ui.category)) ui.category = "Alle";
    const query = String(ui.query || "").trim().toLocaleLowerCase("de-DE");
    const shown = all.filter((entry) => {
      if (ui.category !== "Alle" && entry.section !== ui.category) return false;
      if (!query) return true;
      return `${entry.offer.name} ${entry.offer.item || ""} ${entry.offer.text || ""} ${entry.section}`.toLocaleLowerCase("de-DE").includes(query);
    });
    const cards = shown.map((entry) => {
      const index = all.indexOf(entry);
      const status = marketOfferStatusV68(entry);
      const fuel = vehicleMode ? `<small>${escapeHtml(vehicleFuelLabel(entry.offer.item || entry.offer.name))} · ${escapeHtml(vehicleSpecText(entry.offer.item || entry.offer.name))} · Fahrzeugplätze ${vehicleCount()}/${vehicleCapacity()}</small>` : "";
      return `<article class="phone-market-card-v68 ${status.locked ? "locked" : ""}">
        <div class="phone-market-card-icon-v68">${vehicleMode ? (/Yacht|Boot/i.test(entry.offer.name) ? "🛥️" : /Elektro/i.test(`${entry.offer.name} ${entry.offer.item || ""}`) ? "⚡" : "🚘") : "◈"}</div>
        <div><small>${escapeHtml(entry.section)}</small><h3>${escapeHtml(entry.offer.name)}</h3><p>${escapeHtml(entry.offer.text || "")}</p>${fuel}<strong>${euro.format(entry.offer.price)}</strong></div>
        <button type="button" data-phone-market-buy="${index}" ${status.locked ? "disabled" : ""}>${status.label}</button>
      </article>`;
    }).join("");
    return `<div class="phone-market-app-v68" data-phone-market-mode="${mode}">
      <section class="phone-market-hero-v68 ${vehicleMode ? "vehicles" : "shop"}">
        <small>${vehicleMode ? "MOBILITÄT" : "JK.GAMES STORE"}</small>
        <h2>${vehicleMode ? "Fobile.de" : "Online-Shop"}</h2>
        <p>${vehicleMode ? "Autos, Motorboote und Yachten in einer eigenen Fahrzeug-App." : "Kleidung, Technik, Haushalt und Verbrauchsartikel – vollständig im Handy."}</p>
        <div><b>${euro.format(state.bank)}</b><span>Konto</span><b>${euro.format(state.cash)}</b><span>Bar</span></div>
      </section>
      <label class="phone-market-search-v68"><span>⌕</span><input type="search" value="${escapeHtml(ui.query || "")}" placeholder="${vehicleMode ? "Fahrzeug suchen" : "Im Shop suchen"}" data-phone-market-search></label>
      <div class="phone-market-tabs-v68">${categories.map((category) => `<button type="button" class="${category === ui.category ? "active" : ""}" data-phone-market-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join("")}</div>
      <section class="phone-market-list-v68">${cards || `<div class="phone-market-empty-v68"><span>⌕</span><b>Keine Angebote gefunden</b><small>Ändere Suche oder Kategorie.</small></div>`}</section>
    </div>`;
  }

  deviceAppActions = function deviceAppActionsV68(appId, item = ownedPhoneItem()) {
    if (appId === "shop" || appId === "fobile") return phoneMarketViewHtmlV68(appId);
    return baseDeviceAppActionsV68(appId, item);
  };

  openDeviceAppDirect = function openDeviceAppDirectV68(item, appId) {
    if (PHONE_MARKET_APPS.has(appId)) return openDeviceInterface(item, appId, false);
    return baseOpenDeviceAppDirectV68(item, appId);
  };

  function decorateMarketWindowV68(shell, appId, item) {
    const view = shell?.querySelector?.(".device-app-window-v64");
    if (!view) return;
    view.classList.add("device-native-market-window-v68", `device-native-${appId}-v68`);
    [...view.children].filter((node) => node.matches?.(":scope > h3, :scope > p, :scope > .device-hint")).forEach((node) => node.remove());
    if (!view.querySelector("[data-native-market-header-v68]")) {
      const header = document.createElement("header");
      header.className = "device-native-market-header-v68";
      header.dataset.nativeMarketHeaderV68 = "1";
      header.innerHTML = `<button type="button" data-native-market-close-v68 aria-label="Zurück zum Home-Bildschirm">‹</button><div><span>${appId === "fobile" ? "F" : "□"}</span><p><small>${appId === "fobile" ? "FAHRZEUGMARKT" : "EINKAUFEN"}</small><b>${appId === "fobile" ? "Fobile.de" : "Shop"}</b></p></div><button type="button" data-native-market-close-v68>Fertig</button>`;
      view.prepend(header);
    }
    view.querySelectorAll("[data-native-market-close-v68]").forEach((button) => button.addEventListener("click", () => openDeviceInterface(item, "home", false), { once: true }));
  }

  function rerenderMarketAppV68(item, mode, preserveScroll = true, restoreSearchFocus = false, requestedCaret = null) {
    const currentSearch = els.dialog?.querySelector?.(`.phone-market-app-v68[data-phone-market-mode="${mode}"] [data-phone-market-search]`);
    const caret = Number.isFinite(Number(requestedCaret))
      ? Number(requestedCaret)
      : (currentSearch && Number.isFinite(Number(currentSearch.selectionStart)) ? Number(currentSearch.selectionStart) : null);
    if (preserveScroll) pendingDeviceScrollTop = els.dialog?.querySelector?.(".phone-market-list-v68")?.scrollTop ?? null;
    openDeviceInterface(item, mode, false);
    if (restoreSearchFocus) {
      const restore = () => {
        const search = els.dialog?.querySelector?.(`.phone-market-app-v68[data-phone-market-mode="${mode}"] [data-phone-market-search]`);
        if (!search) return;
        try { search.focus({ preventScroll: true }); } catch { search.focus(); }
        const position = Math.max(0, Math.min(search.value.length, caret == null ? search.value.length : caret));
        try { search.setSelectionRange(position, position); } catch {}
      };
      window.requestAnimationFrame ? window.requestAnimationFrame(restore) : window.setTimeout(restore, 0);
    }
  }

  function showPhoneMarketNoticeV184(mode, text, kind = "success") {
    const root = els.dialog?.querySelector?.(`.phone-market-app-v68[data-phone-market-mode="${mode}"]`);
    if (!root) return;
    root.querySelector(".phone-market-notice-v184")?.remove();
    const notice = document.createElement("div");
    notice.className = `phone-market-notice-v184 ${kind}`;
    notice.innerHTML = `<span>${kind === "success" ? "✓" : "!"}</span><b>${escapeHtml(text)}</b>`;
    root.appendChild(notice);
    window.setTimeout(() => notice.classList.add("show"), 0);
    window.setTimeout(() => {
      notice.classList.remove("show");
      window.setTimeout(() => notice.remove(), 220);
    }, 2800);
  }

  function phoneMarketInventoryNeedV184(offer) {
    if (!offer?.effect) return isStorableShopItem(offer) ? 1 : 0;
    return Number(state.consumables?.[offer.name]?.count || 0) > 0 ? 0 : 1;
  }

  function showPhonePaymentSheetV68(item, mode, entry, triggerButton = null) {
    const root = els.dialog?.querySelector?.(`.phone-market-app-v68[data-phone-market-mode="${mode}"]`);
    const list = root?.querySelector?.(".phone-market-list-v68");
    if (!root || !list) return;
    list.querySelector(".phone-market-inline-purchase-v184")?.remove();
    const offer = entry.offer;
    const bulk = !!offer.effect || !!offer.repeatable;
    const card = triggerButton?.closest?.(".phone-market-card-v68");
    if (!card) return;
    card.classList.add("purchase-open-v184");
    const panel = document.createElement("section");
    panel.className = "phone-market-inline-purchase-v184";
    panel.innerHTML = `<div class="phone-market-inline-head-v184">
      <div><small>${escapeHtml(entry.section)}</small><h3>${escapeHtml(offer.name)}</h3></div>
      <button type="button" data-phone-market-sheet-close aria-label="Zahlung schließen">×</button>
    </div>
    <p>${escapeHtml(offer.text || "")}</p>
    ${bulk ? `<label class="phone-market-inline-quantity-v184"><span>Anzahl</span><input type="number" min="1" max="99" value="1" inputmode="numeric" data-phone-market-quantity></label>` : ""}
    <div class="phone-market-inline-balances-v184">
      <span><small>BARGELD</small><b>${euro.format(state.cash)}</b></span>
      <span><small>KONTO</small><b>${euro.format(state.bank)}</b></span>
      <span><small>INVENTAR</small><b>${inventoryUsed()}/${inventoryCapacity()}</b></span>
    </div>
    <div class="phone-market-sheet-price-v68"><span>Gesamt</span><b data-phone-market-total>${euro.format(offer.price)}</b></div>
    <p class="phone-market-inline-status-v184" data-phone-market-status></p>
    <div class="phone-market-inline-actions-v184">
      <button type="button" class="cash" data-phone-market-pay="cash">Bar bezahlen</button>
      <button type="button" class="card" data-phone-market-pay="card">Mit Konto bezahlen</button>
    </div>`;
    card.insertAdjacentElement("afterend", panel);

    const quantity = panel.querySelector("[data-phone-market-quantity]");
    const status = panel.querySelector("[data-phone-market-status]");
    const update = () => {
      const count = bulk ? Math.max(1, Math.min(99, Math.floor(Number(quantity?.value || 1)))) : 1;
      if (quantity) quantity.value = String(count);
      const total = Number(offer.price || 0) * count;
      const requiredSlots = phoneMarketInventoryNeedV184(offer);
      const hasSpace = inventoryUsed() + requiredSlots <= inventoryCapacity();
      const cash = panel.querySelector('[data-phone-market-pay="cash"]');
      const cardButton = panel.querySelector('[data-phone-market-pay="card"]');
      panel.querySelector("[data-phone-market-total]").textContent = euro.format(total);
      cash.disabled = Number(state.cash || 0) < total || !hasSpace;
      cardButton.disabled = !canAffordWithMethod(total, "card") || !hasSpace;
      cash.textContent = `Bar ${euro.format(total)}`;
      cardButton.textContent = `Konto ${euro.format(total)}`;
      if (!hasSpace) {
        status.textContent = `Inventar voll (${inventoryUsed()}/${inventoryCapacity()}). Bereits vorhandene Lebensmittel lassen sich weiter stapeln; für eine neue Sorte brauchst du einen freien Platz.`;
        status.classList.add("error");
      } else {
        status.textContent = requiredSlots === 0
          ? "Dieser Artikel wird auf dem vorhandenen Stapel gespeichert."
          : `Der Kauf benötigt 1 freien Inventarplatz. Danach: ${inventoryUsed() + requiredSlots}/${inventoryCapacity()}.`;
        status.classList.remove("error");
      }
      return { count, total, hasSpace };
    };

    quantity?.addEventListener("input", update);
    panel.querySelector("[data-phone-market-sheet-close]")?.addEventListener("click", () => {
      card.classList.remove("purchase-open-v184");
      panel.remove();
    });
    panel.querySelectorAll("[data-phone-market-pay]").forEach((button) => button.addEventListener("click", () => {
      const current = update();
      if (!current.hasSpace) return;
      const method = button.dataset.phoneMarketPay;
      const listScroll = Number(list.scrollTop || 0);
      activePurchaseReturnContext = null;
      activeShopMarketKey = entry.marketKey || "";
      window.JKGamesPhonePurchaseContextV68 = {
        appId: mode,
        item,
        offerName: offer.name,
        quantity: current.count,
        total: current.total,
        method,
        listScroll,
        onResult(result) {
          if (result?.paid) return;
          update();
          status.textContent = result?.message || "Der Kauf konnte nicht abgeschlossen werden. Prüfe Geld und Inventarplatz.";
          status.classList.add("error");
        }
      };
      window.JKGamesBankLedgerContextV68 = method === "card" ? (mode === "fobile" ? "Fobile.de" : "Online-Shop") : "";
      completeShopPurchase(offer, method, current.count, entry.marketKey || "");
    }));
    update();
    window.requestAnimationFrame?.(() => panel.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  }

  function bindMarketWindowV68(shell, item, mode) {
    const root = shell?.querySelector?.(`.phone-market-app-v68[data-phone-market-mode="${mode}"]`);
    if (!root) return;
    const ui = phoneMarketStateV68(mode);
    const entries = phoneMarketEntriesV68(mode);
    root.querySelector("[data-phone-market-search]")?.addEventListener("input", (event) => {
      const search = event.currentTarget;
      ui.query = search.value;
      const caret = Number.isFinite(Number(search.selectionStart)) ? Number(search.selectionStart) : search.value.length;
      window.clearTimeout(search.__jkSearchTimerV68);
      search.__jkSearchTimerV68 = window.setTimeout(() => rerenderMarketAppV68(item, mode, false, true, caret), 180);
    });
    root.querySelectorAll("[data-phone-market-category]").forEach((button) => button.addEventListener("click", () => {
      ui.category = button.dataset.phoneMarketCategory || "Alle";
      rerenderMarketAppV68(item, mode, false);
    }));
    root.querySelectorAll("[data-phone-market-buy]").forEach((button) => button.addEventListener("click", () => {
      const entry = entries[Number(button.dataset.phoneMarketBuy)];
      if (entry) showPhonePaymentSheetV68(item, mode, entry, button);
    }));
  }

  completeShopPurchase = function completeShopPurchaseV68(item, method, quantity = 1, purchaseMarketKey = activeShopMarketKey) {
    const context = window.JKGamesPhonePurchaseContextV68;
    const beforeBank = Number(state.bank || 0);
    const beforeCash = Number(state.cash || 0);
    const beforeCount = Number(state.consumables?.[item?.name]?.count || 0);
    const result = baseCompleteShopPurchaseV68(item, method, quantity, purchaseMarketKey);
    const afterCount = Number(state.consumables?.[item?.name]?.count || 0);
    const paid = Number(state.bank || 0) !== beforeBank || Number(state.cash || 0) !== beforeCash || afterCount > beforeCount;
    window.JKGamesPhonePurchaseContextV68 = null;
    if (!paid) window.JKGamesBankLedgerContextV68 = "";
    context?.onResult?.({ paid, message: paid ? "" : "Kauf nicht ausgeführt. Prüfe Guthaben, Freischaltung und Inventarplatz." });
    if (context && paid) {
      const marketItem = context.item || ownedPhoneItem();
      window.setTimeout(() => {
        if (!els.dialog?.open) openDeviceInterface(marketItem, context.appId, false);
        else rerenderMarketAppV68(marketItem, context.appId, false);
        window.requestAnimationFrame?.(() => {
          const marketList = els.dialog?.querySelector?.(`.phone-market-app-v68[data-phone-market-mode="${context.appId}"] .phone-market-list-v68`);
          if (marketList) marketList.scrollTop = Number(context.listScroll || 0);
          showPhoneMarketNoticeV184(context.appId, `${context.offerName}${context.quantity > 1 ? ` (${context.quantity}x)` : ""} gekauft · ${context.method === "cash" ? "bar" : "Konto"}`);
        });
      }, 0);
    }
    return result;
  };

  /* --------------------------- Echte Marktdaten --------------------------- */
  const LIVE_STORAGE_KEY_V68 = "jkgames-live-market-v68";
  const CRYPTO_IDS_V68 = {
    Bitcoin: "bitcoin", Ethereum: "ethereum", Solana: "solana", BNB: "binancecoin", XRP: "ripple", Cardano: "cardano", Dogecoin: "dogecoin",
    Avalanche: "avalanche-2", Polkadot: "polkadot", Chainlink: "chainlink", Polygon: "matic-network", Litecoin: "litecoin", Stellar: "stellar",
    Cosmos: "cosmos", Arbitrum: "arbitrum", Optimism: "optimism", Near: "near", Aptos: "aptos", Uniswap: "uniswap", Render: "render-token"
  };
  const COINCAP_IDS_V68 = {
    Bitcoin: "bitcoin", Ethereum: "ethereum", Solana: "solana", BNB: "binance-coin", XRP: "xrp", Cardano: "cardano", Dogecoin: "dogecoin",
    Avalanche: "avalanche", Polkadot: "polkadot", Chainlink: "chainlink", Polygon: "polygon", Litecoin: "litecoin", Stellar: "stellar",
    Cosmos: "cosmos", Arbitrum: "arbitrum", Optimism: "optimism", Near: "near-protocol", Aptos: "aptos", Uniswap: "uniswap", Render: "render-token"
  };
  const STOOQ_SYMBOLS_V68 = {
    Apple: ["aapl.us", "USD"], Microsoft: ["msft.us", "USD"], Nvidia: ["nvda.us", "USD"], Amazon: ["amzn.us", "USD"], Alphabet: ["googl.us", "USD"], Meta: ["meta.us", "USD"], Tesla: ["tsla.us", "USD"], Netflix: ["nflx.us", "USD"], AMD: ["amd.us", "USD"], Intel: ["intc.us", "USD"],
    SAP: ["sap.de", "EUR"], Siemens: ["sie.de", "EUR"], Volkswagen: ["vow3.de", "EUR"], "Mercedes-Benz": ["mbg.de", "EUR"], BMW: ["bmw.de", "EUR"], Allianz: ["alv.de", "EUR"], "Deutsche Telekom": ["dte.de", "EUR"], BASF: ["bas.de", "EUR"], Bayer: ["bayn.de", "EUR"], Adidas: ["ads.de", "EUR"],
    "Coca-Cola": ["ko.us", "USD"], "McDonald's": ["mcd.us", "USD"], Visa: ["v.us", "USD"], Mastercard: ["ma.us", "USD"], JPMorgan: ["jpm.us", "USD"], Berkshire: ["brk-b.us", "USD"], Toyota: ["tm.us", "USD"], Sony: ["sony.us", "USD"], Samsung: ["005930.kr", "KRW"], TSMC: ["tsm.us", "USD"],
    Alibaba: ["baba.us", "USD"], Tencent: ["0700.hk", "HKD"], BYD: ["1211.hk", "HKD"], Shell: ["shel.us", "USD"], BP: ["bp.us", "USD"], TotalEnergies: ["tte.us", "USD"], Nestle: ["nesn.ch", "CHF"], Roche: ["rog.ch", "CHF"], "Novo Nordisk": ["novo-b.dk", "DKK"], LVMH: ["mc.fr", "EUR"], Nike: ["nke.us", "USD"], Starbucks: ["sbux.us", "USD"], Uber: ["uber.us", "USD"], Airbnb: ["abnb.us", "USD"], Coinbase: ["coin.us", "USD"], PayPal: ["pypl.us", "USD"], Shopify: ["shop.us", "USD"], Spotify: ["spot.us", "USD"], Roblox: ["rblx.us", "USD"], Palantir: ["pltr.us", "USD"],
    "iShares Core MSCI World": ["eunl.de", "EUR"], "Vanguard FTSE All-World": ["vwce.de", "EUR"], "SPDR S&P 500": ["spy.us", "USD"], "iShares Core S&P 500": ["sxr8.de", "EUR"], "iShares STOXX Europe 600": ["exsa.de", "EUR"], "iShares MSCI Emerging Markets": ["eimi.uk", "USD"], "Xtrackers MSCI World": ["xdwd.de", "EUR"], "Amundi MSCI World": ["cw8.fr", "EUR"], "Vanguard FTSE Developed Europe": ["veur.uk", "EUR"], "iShares Nasdaq 100": ["sxrv.de", "EUR"],
    "Global X Robotics & AI": ["botz.us", "USD"], "iShares Global Clean Energy": ["inrg.uk", "USD"], "iShares Global Healthcare": ["ixj.us", "USD"], "VanEck Semiconductor": ["smh.us", "USD"], "iShares Automation & Robotics": ["2b76.de", "EUR"], "iShares Global Water": ["ih2o.uk", "USD"], "iShares Physical Gold ETC": ["sgln.uk", "USD"], "iShares Global Real Estate": ["reet.us", "USD"], "iShares Euro Government Bond": ["ibgx.uk", "EUR"], "Vanguard Global Aggregate Bond": ["vagg.uk", "USD"]
  };

  function readLiveCacheV68() {
    try {
      const value = JSON.parse(localStorage.getItem(LIVE_STORAGE_KEY_V68) || "{}");
      return value && typeof value === "object" ? value : {};
    } catch {
      return {};
    }
  }

  let liveCacheV68 = readLiveCacheV68();
  let liveMarketBackendStateV86 = "idle";
  let liveMarketBackendErrorV86 = "";

  function persistLiveCacheV68() {
    try { localStorage.setItem(LIVE_STORAGE_KEY_V68, JSON.stringify(liveCacheV68)); } catch { /* Speicher kann voll sein. */ }
  }

  function updateLivePriceV68(group, name, price, source) {
    const numeric = Math.round(Number(price) * 10000) / 10000;
    if (!Number.isFinite(numeric) || numeric <= 0) return false;
    const key = marketAssetId(group, name);
    const previous = liveCacheV68[key] || {};
    const oldPrice = Number(previous.price || 0);
    const changed = !oldPrice || Math.abs(oldPrice - numeric) > Math.max(0.0001, oldPrice * 0.000001);
    const history = Array.isArray(previous.history) ? previous.history.filter((value) => Number.isFinite(Number(value))).slice(-17) : [];
    if (!history.length) history.push(numeric);
    if (changed && oldPrice) history.push(numeric);
    liveCacheV68[key] = { price: numeric, history: history.slice(-18), source, updatedAt: Date.now() };
    return changed;
  }

  currentMarketPrice = function currentMarketPriceV68(group, name, index = 0) {
    const cached = liveCacheV68[marketAssetId(group, name)];
    if (Number.isFinite(Number(cached?.price)) && Number(cached.price) > 0) return Number(cached.price);
    return marketBasePrice(group, name, index);
  };

  marketHistoryPoints = function marketHistoryPointsV68(group, name, index = 0) {
    const cached = liveCacheV68[marketAssetId(group, name)];
    const price = currentMarketPrice(group, name, index);
    const values = Array.isArray(cached?.history) ? cached.history.map(Number).filter(Number.isFinite) : [];
    if (!values.length) return Array(18).fill(price);
    while (values.length < 18) values.unshift(values[0]);
    return values.slice(-18);
  };

  async function fetchJsonV68(url) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 9000);
    try {
      const response = await fetch(url, { cache: "no-store", signal: controller.signal, headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      window.clearTimeout(timer);
    }
  }

  async function fetchTextV68(url) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 9000);
    try {
      const response = await fetch(url, { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } finally {
      window.clearTimeout(timer);
    }
  }

  async function exchangeRatesV68() {
    const cached = liveCacheV68.__rates;
    if (cached && Date.now() - Number(cached.updatedAt || 0) < 30 * 60 * 1000) return cached;
    try {
      const data = await fetchJsonV68("https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD,CHF,DKK,GBP,KRW,HKD");
      const rates = { EUR: 1, USD: Number(data?.rates?.USD), CHF: Number(data?.rates?.CHF), DKK: Number(data?.rates?.DKK), GBP: Number(data?.rates?.GBP), KRW: Number(data?.rates?.KRW), HKD: Number(data?.rates?.HKD), updatedAt: Date.now() };
      if (!rates.USD) throw new Error("Kein Wechselkurs");
      liveCacheV68.__rates = rates;
      return rates;
    } catch {
      // Ohne erfolgreich geladene Wechselkurse wird kein ausländischer Kurs
      // mit erfundenen Umrechnungswerten übernommen.
      return cached || { EUR: 1, updatedAt: 0 };
    }
  }

  function toEuroV68(value, currency, rates) {
    if (currency === "EUR") return value;
    const perEuro = Number(rates?.[currency]);
    return perEuro > 0 ? value / perEuro : NaN;
  }

  async function refreshCryptoV68(names) {
    const selected = [...new Set(names)].filter((name) => CRYPTO_IDS_V68[name]);
    if (!selected.length) return false;
    const idToName = new Map(selected.map((name) => [CRYPTO_IDS_V68[name], name]));
    let data;
    try {
      data = await fetchJsonV68(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent([...idToName.keys()].join(","))}&vs_currencies=eur`);
    } catch {
      const coinCapIdToName = new Map(selected.map((name) => [COINCAP_IDS_V68[name], name]).filter(([id]) => id));
      const ids = [...coinCapIdToName.keys()].join(",");
      const fallback = await fetchJsonV68(`https://api.coincap.io/v2/assets?ids=${encodeURIComponent(ids)}`);
      const rates = await exchangeRatesV68();
      data = {};
      (fallback?.data || []).forEach((entry) => {
        const name = coinCapIdToName.get(entry.id);
        const geckoId = name ? CRYPTO_IDS_V68[name] : "";
        if (geckoId) data[geckoId] = { eur: toEuroV68(Number(entry.priceUsd), "USD", rates) };
      });
    }
    let changed = false;
    idToName.forEach((name, id) => { changed = updateLivePriceV68("crypto", name, data?.[id]?.eur, "CoinGecko/CoinCap") || changed; });
    return changed;
  }

  async function refreshStooqAssetV68(group, name, rates) {
    const meta = STOOQ_SYMBOLS_V68[name];
    if (!meta) return false;
    const [symbol, currency] = meta;
    try {
      const csv = await fetchTextV68(`https://stooq.com/q/l/?s=${encodeURIComponent(symbol)}&f=sd2t2ohlcv&h&e=csv`);
      const lines = csv.trim().split(/\r?\n/);
      if (lines.length < 2) return false;
      const headers = lines[0].split(",").map((value) => value.trim().toLowerCase());
      const values = lines[1].split(",").map((value) => value.trim());
      const closeIndex = headers.indexOf("close");
      const close = Number(values[closeIndex]);
      const eurPrice = toEuroV68(close, currency, rates);
      return updateLivePriceV68(group, name, eurPrice, "Stooq");
    } catch {
      return false;
    }
  }

  function wantedLiveAssetsV68() {
    const group = state?.deviceExchangeGroup || "etf";
    const wanted = {
      crypto: new Set((marketCatalog.crypto || []).slice(0, group === "crypto" ? 12 : 3)),
      stocks: new Set((marketCatalog.stocks || []).slice(0, group === "stocks" ? 12 : 3)),
      etf: new Set((marketCatalog.etf || []).slice(0, group === "etf" ? 12 : 3))
    };
    (state?.portfolio || []).forEach((position) => wanted[position.group]?.add(position.name));
    return wanted;
  }

  async function refreshFirebaseMarketSnapshotV86(wanted) {
    liveMarketBackendStateV86 = "loading";
    liveMarketBackendErrorV86 = "";
    try {
      const response = await callFirebasePhoneFunction("liveMarketSnapshotV86", {
        assets: {
          crypto: [...wanted.crypto].slice(0, 20),
          stocks: [...wanted.stocks].slice(0, 20),
          etf: [...wanted.etf].slice(0, 20)
        }
      });
      const prices = Array.isArray(response?.prices) ? response.prices : [];
      let changed = false;
      prices.forEach((entry) => {
        if (!["crypto", "stocks", "etf"].includes(entry?.group)) return;
        changed = updateLivePriceV68(entry.group, String(entry.name || ""), entry.price, entry.source || "JK.Games Marktserver") || changed;
      });
      if (response?.rates && typeof response.rates === "object") {
        const rates = { EUR: 1, updatedAt: Number(response.fetchedAt || Date.now()) };
        ["USD", "CHF", "DKK", "GBP", "KRW", "HKD"].forEach((currency) => {
          const value = Number(response.rates[currency]);
          if (Number.isFinite(value) && value > 0) rates[currency] = value;
        });
        liveCacheV68.__rates = rates;
      }
      liveMarketBackendStateV86 = "ready";
      return changed;
    } catch (error) {
      liveMarketBackendStateV86 = "fallback";
      liveMarketBackendErrorV86 = String(error?.message || error || "Marktserver nicht erreichbar").replace(/^FirebaseError:\s*/i, "");
      return false;
    }
  }

  async function refreshLiveMarketsV68(force = false) {
    if (liveRefreshPromiseV68) return liveRefreshPromiseV68;
    if (!force && Date.now() - liveRefreshAtV68 < 60 * 1000) return false;
    liveRefreshAtV68 = Date.now();
    liveRefreshPromiseV68 = (async () => {
      const wanted = wantedLiveAssetsV68();
      const changed = await refreshFirebaseMarketSnapshotV86(wanted);
      persistLiveCacheV68();
      if (changed && els.dialog?.open) {
        const shell = els.dialog.querySelector(".device-shell");
        const active = shell?.classList.contains("device-active-invest") ? "invest" : shell?.classList.contains("device-active-trading") ? "trading" : "";
        if (active) {
          window.clearTimeout(liveRerenderTimerV68);
          liveRerenderTimerV68 = window.setTimeout(() => openDeviceInterface(ownedPhoneItem(), active, false), 80);
        }
      }
      return changed;
    })().finally(() => { liveRefreshPromiseV68 = null; });
    return liveRefreshPromiseV68;
  }

  function liveStatusHtmlV68() {
    const entries = Object.values(liveCacheV68).filter((entry) => entry && Number.isFinite(Number(entry.updatedAt)));
    const latest = entries.length ? Math.max(...entries.map((entry) => Number(entry.updatedAt))) : 0;
    const ready = liveMarketBackendStateV86 === "ready";
    const loading = liveMarketBackendStateV86 === "loading";
    const title = ready ? "Marktdaten verbunden" : loading ? "Marktdaten werden geladen" : "Stabiler Offline-Kursmodus";
    const detail = ready && latest
      ? `Letzte Serverabfrage: ${new Date(latest).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}.`
      : latest
        ? `Letzter gespeicherter Kurs: ${new Date(latest).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}.`
        : "Trading verwendet die internen Startkurse, bis der Marktserver veröffentlicht ist.";
    const hint = liveMarketBackendErrorV86 ? ` ${liveMarketBackendErrorV86}` : "";
    return `<div class="device-live-market-status-v68 ${ready ? "online" : "fallback"}"><span>●</span><div><b>${title}</b><small>${detail}${hint} Keine fehlerhaften Browser-Direktaufrufe.</small></div><button type="button" data-live-market-refresh-v68 aria-label="Marktdaten neu laden">↻</button></div>`;
  }

  deviceExchangeViewHtml = function deviceExchangeViewHtmlV68() {
    return `${liveStatusHtmlV68()}${baseDeviceExchangeViewHtmlV68()}`;
  };

  tradingLiveTickerHtml = function tradingLiveTickerHtmlV68() {
    return baseTradingLiveTickerHtmlV68().replace("Live-Kurse · neuer Marktschritt ca. alle 15 Sekunden", "Echte Kurse · Änderung nur bei neuer Marktdaten-Abfrage");
  };

  deviceTradingViewHtml = function deviceTradingViewHtmlV68() {
    return `${liveStatusHtmlV68()}${baseDeviceTradingViewHtmlV68()}`;
  };

  function bindLiveMarketV68(shell) {
    shell?.querySelectorAll?.("[data-live-market-refresh-v68]").forEach((button) => button.addEventListener("click", async () => {
      button.disabled = true;
      await refreshLiveMarketsV68(true);
      button.disabled = false;
    }));
  }

  function ensureFobileInstalledV68() {
    if (!Array.isArray(state.installedPhoneApps)) state.installedPhoneApps = [];
    if (!state.installedPhoneApps.includes("fobile")) state.installedPhoneApps.push("fobile");
  }

  openDeviceInterface = function openDeviceInterfaceV68(item, activeApp = "home", activeUse = true) {
    ensureSubaccountsV68();
    ensureFobileInstalledV68();
    const result = baseOpenDeviceInterfaceV68(item, activeApp, activeUse);
    const shell = els.dialog?.querySelector?.(".device-shell");
    if (!shell) return result;
    if (activeApp === "bank") decorateBankLayoutV78(shell, item);
    if (PHONE_MARKET_APPS.has(activeApp)) {
      decorateMarketWindowV68(shell, activeApp, item);
      bindMarketWindowV68(shell, item, activeApp);
    }
    if (activeApp === "invest" || activeApp === "trading") {
      bindLiveMarketV68(shell);
      refreshLiveMarketsV68(false).catch(() => {});
    }
    return result;
  };

  // Fobile bleibt als aktive App im App Store sichtbar und kann auch nach alten
  // Spielständen verwendet werden, ohne dass die frühere "gesperrt"-Markierung bleibt.
  const fobileCatalogV68 = phoneAppStoreCatalog.find((entry) => entry.id === "fobile");
  if (fobileCatalogV68) {
    fobileCatalogV68.status = "available";
    fobileCatalogV68.description = "Eigenständiger Fahrzeugmarkt für Autos, Motorboote, Yachten und weitere Fahrzeuge.";
  }

  window.setInterval(() => {
    if (document.visibilityState === "visible" && els.dialog?.open && els.dialog.querySelector(".device-active-invest, .device-active-trading")) refreshLiveMarketsV68(false).catch(() => {});
  }, 5 * 60 * 1000);

  window.JKGamesPhoneV82 = window.JKGamesPhoneV80 = window.JKGamesPhoneV78 = window.JKGamesPhoneV77 = window.JKGamesPhoneV68 = Object.freeze({
    version: VERSION,
    refreshMarkets: () => refreshLiveMarketsV68(true),
    subaccounts: () => ensureSubaccountsV68().map((entry) => ({ ...entry }))
  });
})();


/* ========================================================================== 
   JK.Games V87 · Ein-Klick-Fix, Widget-Auswahl und persönliche Hintergründe
   ========================================================================== */
(() => {
  "use strict";

  const VERSION = "2026-07-29-jkgames-v87-pets-hotels-vehicles-electric";
  const WIDGETS = Object.freeze([
    ["status", "Ich, Hund & Freundin", "❤"],
    ["calendar", "Kalender", "29"],
    ["weather", "Wetter", "☀"],
    ["bank", "Kontostand", "€"],
    ["cash", "Bargeld", "💶"],
    ["battery", "Handy-Akku", "🔋"],
    ["level", "Level & EP", "★"],
    ["location", "Aktueller Ort", "⌖"],
    ["debt", "Schulden & Steuern", "§"],
    ["clock", "Uhrzeit & Spieltag", "◷"]
  ]);
  const WALLPAPERS = Object.freeze([
    ["liquid", "Liquid Glass", "Original"],
    ["midnight", "Mitternacht", "Dunkelblau"],
    ["ocean", "Ozean", "Blau und Türkis"],
    ["sunset", "Sonnenuntergang", "Orange und Violett"],
    ["forest", "Wald", "Dunkelgrün"],
    ["rose", "Rose", "Pink und Rot"]
  ]);

  function slotV85() {
    const raw = typeof selectedSlot !== "undefined" ? selectedSlot : (typeof activeSlot !== "undefined" ? activeSlot : 0);
    return Math.max(0, Math.min(3, Number(raw || 0)));
  }

  function accountV85() {
    const uid = window.LifeBuilderFirebaseCore?.getUser?.()?.uid || "local";
    return `${uid}:${slotV85()}`;
  }

  function widgetKeyV85() { return `jkgames-phone-widgets-v66:${accountV85()}`; }
  function wallpaperKeyV85() { return `jkgames-phone-wallpaper-v85:${accountV85()}`; }
  function wallpaperImageKeyV85() { return `jkgames-phone-wallpaper-image-v85:${accountV85()}`; }

  function currentWidgetsV85() {
    const allowed = new Set(WIDGETS.map(([id]) => id));
    try {
      const parsed = JSON.parse(localStorage.getItem(widgetKeyV85()) || "[]");
      const values = Array.isArray(parsed) ? parsed.filter((id, index) => allowed.has(id) && parsed.indexOf(id) === index).slice(0, 3) : [];
      ["status", "calendar", "weather"].forEach((id) => { if (values.length < 3 && !values.includes(id)) values.push(id); });
      return values.slice(0, 3);
    } catch { return ["status", "calendar", "weather"]; }
  }

  function wallpaperStateV85() {
    let preset = localStorage.getItem(wallpaperKeyV85()) || "liquid";
    if (![...WALLPAPERS.map(([id]) => id), "custom"].includes(preset)) preset = "liquid";
    return { preset, image: localStorage.getItem(wallpaperImageKeyV85()) || "" };
  }

  function escapeV85(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  }

  function activePhoneShellV85() {
    return document.querySelector("#detailDialog .device-shell.device-phone") || document.querySelector(".device-shell.device-phone");
  }

  function applyWallpaperV85(shell = activePhoneShellV85()) {
    if (!shell) return;
    const { preset, image } = wallpaperStateV85();
    shell.dataset.phoneWallpaperV85 = preset === "custom" && image ? "custom" : preset;
    if (preset === "custom" && image) shell.style.setProperty("--phone-custom-wallpaper-v85", `url(${JSON.stringify(image)})`);
    else shell.style.removeProperty("--phone-custom-wallpaper-v85");
  }

  function closePanelV85(panel) { panel?.remove(); }

  function panelShellV85(title, subtitle) {
    const shell = activePhoneShellV85();
    if (!shell) return null;
    shell.querySelector(".phone-personalize-overlay-v85")?.remove();
    const panel = document.createElement("section");
    panel.className = "phone-personalize-overlay-v85";
    panel.innerHTML = `<div class="phone-personalize-card-v85"><header><button type="button" data-personalize-close-v85 aria-label="Schließen">‹</button><div><small>HANDY-EINSTELLUNGEN</small><h3>${escapeV85(title)}</h3><p>${escapeV85(subtitle)}</p></div></header><div class="phone-personalize-content-v85" data-personalize-content-v85></div></div>`;
    shell.append(panel);
    panel.querySelector("[data-personalize-close-v85]")?.addEventListener("click", () => closePanelV85(panel));
    return panel;
  }

  function renderWidgetManagerV85() {
    const panel = panelShellV85("Widgets anpassen", "Wähle genau drei Widgets für die obere Reihe aus.");
    if (!panel) return;
    const content = panel.querySelector("[data-personalize-content-v85]");
    let selected = currentWidgetsV85();

    const render = () => {
      content.innerHTML = `<div class="phone-widget-count-v85"><b>${selected.length}/3 gewählt</b><small>Die Reihenfolge entspricht der Anzeige von links nach rechts.</small></div>
        <div class="phone-widget-picker-v85">${WIDGETS.map(([id, label, icon]) => {
          const active = selected.includes(id);
          const position = selected.indexOf(id);
          return `<article class="${active ? "active" : ""}"><button type="button" class="phone-widget-select-v85" data-widget-toggle-v85="${id}"><i>${icon}</i><span><b>${escapeV85(label)}</b><small>${active ? `Position ${position + 1}` : "Nicht ausgewählt"}</small></span><em>${active ? "✓" : "+"}</em></button>${active ? `<div class="phone-widget-order-v85"><button type="button" data-widget-up-v85="${id}" ${position === 0 ? "disabled" : ""}>↑</button><button type="button" data-widget-down-v85="${id}" ${position === selected.length - 1 ? "disabled" : ""}>↓</button></div>` : ""}</article>`;
        }).join("")}</div>
        <button type="button" class="phone-personalize-save-v85" data-widget-save-v85 ${selected.length === 3 ? "" : "disabled"}>Widgets speichern</button>`;

      content.querySelectorAll("[data-widget-toggle-v85]").forEach((button) => button.addEventListener("click", () => {
        const id = button.dataset.widgetToggleV85;
        if (selected.includes(id)) selected = selected.filter((entry) => entry !== id);
        else if (selected.length < 3) selected.push(id);
        else {
          if (typeof addFeed === "function") addFeed("Es können gleichzeitig genau drei Widgets angezeigt werden.");
          return;
        }
        render();
      }));
      content.querySelectorAll("[data-widget-up-v85]").forEach((button) => button.addEventListener("click", () => {
        const index = selected.indexOf(button.dataset.widgetUpV85);
        if (index > 0) [selected[index - 1], selected[index]] = [selected[index], selected[index - 1]];
        render();
      }));
      content.querySelectorAll("[data-widget-down-v85]").forEach((button) => button.addEventListener("click", () => {
        const index = selected.indexOf(button.dataset.widgetDownV85);
        if (index >= 0 && index < selected.length - 1) [selected[index + 1], selected[index]] = [selected[index], selected[index + 1]];
        render();
      }));
      content.querySelector("[data-widget-save-v85]")?.addEventListener("click", () => {
        if (selected.length !== 3) return;
        localStorage.setItem(widgetKeyV85(), JSON.stringify(selected));
        closePanelV85(panel);
        openDeviceInterface(ownedPhoneItem(), "home", false);
      });
    };
    render();
  }

  function compressImageV85(file) {
    return new Promise((resolve, reject) => {
      if (!file || !String(file.type || "").startsWith("image/")) return reject(new Error("Bitte eine Bilddatei auswählen."));
      if (file.size > 12 * 1024 * 1024) return reject(new Error("Das Bild darf höchstens 12 MB groß sein."));
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Das Bild konnte nicht gelesen werden."));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error("Das Bildformat wird nicht unterstützt."));
        image.onload = () => {
          const maxSide = 1280;
          const scale = Math.min(1, maxSide / Math.max(image.naturalWidth || 1, image.naturalHeight || 1));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          const context = canvas.getContext("2d", { alpha: false });
          context.fillStyle = "#111";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          let data = canvas.toDataURL("image/webp", .78);
          if (!data.startsWith("data:image/webp")) data = canvas.toDataURL("image/jpeg", .78);
          if (data.length > 2_600_000) {
            const smaller = document.createElement("canvas");
            const resize = Math.min(1, 900 / Math.max(canvas.width, canvas.height));
            smaller.width = Math.max(1, Math.round(canvas.width * resize));
            smaller.height = Math.max(1, Math.round(canvas.height * resize));
            smaller.getContext("2d", { alpha: false }).drawImage(canvas, 0, 0, smaller.width, smaller.height);
            data = smaller.toDataURL("image/jpeg", .7);
          }
          if (data.length > 3_200_000) return reject(new Error("Das Bild ist nach dem Verkleinern noch zu groß. Bitte ein kleineres Bild verwenden."));
          resolve(data);
        };
        image.src = String(reader.result || "");
      };
      reader.readAsDataURL(file);
    });
  }

  function renderWallpaperManagerV85() {
    const panel = panelShellV85("Hintergrund anpassen", "Wähle ein Design oder lade ein eigenes Bild hoch.");
    if (!panel) return;
    const content = panel.querySelector("[data-personalize-content-v85]");
    const render = () => {
      const current = wallpaperStateV85();
      content.innerHTML = `<div class="phone-wallpaper-picker-v85">${WALLPAPERS.map(([id, label, text]) => `<button type="button" class="phone-wallpaper-option-v85 ${current.preset === id ? "active" : ""}" data-wallpaper-preset-v85="${id}"><i class="preview-${id}"></i><span><b>${escapeV85(label)}</b><small>${escapeV85(text)}</small></span><em>${current.preset === id ? "✓" : ""}</em></button>`).join("")}
        <button type="button" class="phone-wallpaper-option-v85 ${current.preset === "custom" && current.image ? "active" : ""}" data-wallpaper-custom-open-v85><i class="preview-custom" ${current.image ? `style="background-image:url(${escapeV85(current.image)})"` : ""}></i><span><b>Eigenes Bild</b><small>${current.image ? "Gespeichertes Bild verwenden" : "Foto aus deinen Dateien auswählen"}</small></span><em>${current.preset === "custom" && current.image ? "✓" : "+"}</em></button></div>
        <input type="file" accept="image/*" data-wallpaper-file-v85 hidden>
        ${current.image ? `<button type="button" class="phone-personalize-secondary-v85" data-wallpaper-delete-v85>Eigenes Bild entfernen</button>` : ""}`;
      content.querySelectorAll("[data-wallpaper-preset-v85]").forEach((button) => button.addEventListener("click", () => {
        localStorage.setItem(wallpaperKeyV85(), button.dataset.wallpaperPresetV85 || "liquid");
        applyWallpaperV85();
        render();
      }));
      const fileInput = content.querySelector("[data-wallpaper-file-v85]");
      content.querySelector("[data-wallpaper-custom-open-v85]")?.addEventListener("click", () => fileInput?.click());
      fileInput?.addEventListener("change", async () => {
        try {
          const data = await compressImageV85(fileInput.files?.[0]);
          localStorage.setItem(wallpaperImageKeyV85(), data);
          localStorage.setItem(wallpaperKeyV85(), "custom");
          applyWallpaperV85();
          render();
        } catch (error) {
          alert(error?.message || "Das Bild konnte nicht gespeichert werden.");
        }
      });
      content.querySelector("[data-wallpaper-delete-v85]")?.addEventListener("click", () => {
        localStorage.removeItem(wallpaperImageKeyV85());
        if (localStorage.getItem(wallpaperKeyV85()) === "custom") localStorage.setItem(wallpaperKeyV85(), "liquid");
        applyWallpaperV85();
        render();
      });
    };
    render();
  }

  // Capture verhindert, dass alte Listener einen ersten Klick nur markieren.
  document.addEventListener("click", (event) => {
    const widgetButton = event.target.closest?.("[data-phone-open-widgets-v85]");
    if (widgetButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      renderWidgetManagerV85();
      return;
    }
    const wallpaperButton = event.target.closest?.("[data-phone-open-wallpaper-v85]");
    if (wallpaperButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      renderWallpaperManagerV85();
    }
  }, true);

  const baseOpenDeviceInterfaceV85 = openDeviceInterface;
  openDeviceInterface = function openDeviceInterfaceV85(item, activeApp = "home", activeUse = true) {
    const result = baseOpenDeviceInterfaceV85(item, activeApp, activeUse);
    applyWallpaperV85();
    requestAnimationFrame(() => applyWallpaperV85());
    return result;
  };

  window.addEventListener("lifebuilder-auth-changed", () => requestAnimationFrame(() => applyWallpaperV85()));
  window.JKGamesPhoneV85 = Object.freeze({
    version: VERSION,
    openWidgets: renderWidgetManagerV85,
    openWallpaper: renderWallpaperManagerV85,
    refreshWallpaper: applyWallpaperV85
  });
})();
