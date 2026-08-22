/* JK.Games Firebase runtime – GitHub Pages compatible */
(() => {
  "use strict";
  if (window.LifeBuilderFirebaseCore?.version) return;

  const CONFIG = {
    apiKey: "AIzaSyB0rCUbDhATvtTQNOvJDNZQxK0PChnDK60",
    authDomain: "life-kl.firebaseapp.com",
    projectId: "life-kl",
    storageBucket: "life-kl.firebasestorage.app",
    messagingSenderId: "592179528713",
    appId: "1:592179528713:web:ee9396e2695fcbe31124d8",
    measurementId: "G-PFSGXC3QQ8"
  };
  const DATABASE_ID = "gamekl";
  const FUNCTIONS_REGION = "europe-west3";
  const FIREBASE_SDK_VERSION = "12.17.1";

  let runtime = null;
  let loading = null;
  let status = "idle";
  let lastError = "";
  let firestoreRecoveryTimer = 0;
  let firestoreRecoveryDueAt = 0;
  let firestoreRecoveryPromise = null;
  let lastFirestoreRecoveryAt = 0;

  // V377: eine zentrale Schreibschlange für ALLE JK.Games-Module. Dadurch können
  // BigCards, Hauptspiel, Telefon, Shop usw. Firestore nicht mehr gleichzeitig mit
  // hunderten Writes fluten. Das SDK sieht höchstens einen gestarteten Write zur Zeit.
  const FIRESTORE_WRITE_GAP_MS = 1200;
  // V432: resource-exhausted pausiert nicht mehr pauschal eine Stunde. Die Pause
  // beginnt bei 2 Minuten und steigt bei wiederholter echter Backend-Ueberlastung
  // bis maximal 10 Minuten. Kritische Spielaktionen bleiben dadurch nicht unnötig
  // eine Stunde gesperrt, waehrend der SDK-Stream trotzdem Zeit zum Leerlaufen hat.
  const FIRESTORE_RESOURCE_BACKOFF_MS = 120000;
  const FIRESTORE_RESOURCE_BACKOFF_MAX_MS = 600000;
  // V387: Während einer aktiven Firestore-Schreibpause werden neue UI-Schreibvorgänge
  // nicht mehr minutenlang als ungelöste Promises festgehalten. Sie brechen schnell
  // mit einem retry-fähigen Fehler ab; lokale Spielstände/Timer können später neu senden.
  // V432: Nur veraltbare Hintergrund-Synchronisation wird bei lokaler Last
  // begrenzt. Kritische Nutzeraktionen (Kauf, Nachricht, Kampf-Transaktion usw.)
  // werden niemals nur wegen der lokalen Queue verworfen.
  const FIRESTORE_MAX_APP_QUEUE = 4;
  const FIRESTORE_LOCAL_PRESSURE_BACKOFF_MS = 60000;
  // V470: Vor jedem neuen SDK-Write wird der bereits im Firestore-SDK wartende
  // Schreibstrom kontrolliert geleert. Das erfasst auch Writes von Altmodulen, die
  // versehentlich nicht ueber die JK.Games-Queue laufen.
  const FIRESTORE_SDK_DRAIN_TIMEOUT_MS = 18000;
  // V430: Schreibschutz gilt jetzt auch über Reloads und mehrere offene JK.Games-Tabs.
  // Ohne diesen gemeinsamen Zustand konnte jeder Tab seine eigene Schreibschlange starten.
  const FIRESTORE_BACKOFF_STORAGE_KEY = "jk-games-firestore-write-backoff-v432";
  const FIRESTORE_LAST_WRITE_STORAGE_KEY = "jk-games-firestore-last-write-v432";
  const FIRESTORE_CROSS_TAB_LOCK = "jk-games-firestore-write-lane-v432";
  const FIRESTORE_CROSS_TAB_LEASE_KEY = "jk-games-firestore-write-lease-v432";
  const FIRESTORE_DIAG_STORAGE_KEY = "jk-games-firestore-write-diagnostics-v432";
  const FIRESTORE_DIAG_EVENT_LIMIT = 180;
  const FIRESTORE_DIAG_TOP_LIMIT = 24;
  let firestoreWriteChain = Promise.resolve();
  let firestoreWriteLastAt = 0;
  let firestoreWriteBackoffUntil = 0;
  let firestoreWriteQueueDepth = 0;
  let firestoreWriteBackoffNoticeAt = 0;
  let firestoreResourceStrike = 0;
  let firestoreLastResourceErrorAt = 0;
  let runtimeRawSetDoc = null;
  let runtimeFirestoreDb = null;
  let runtimeRawWaitForPendingWrites = null;
  let firestoreSdkDrainPromise = null;
  let firestoreSdkDrainLastAt = 0;
  const firestoreCoalescedWrites = new Map();
  const firestoreWriteEvents = [];
  const firestoreWriteSourceStats = new Map();
  const firestoreWritePathStats = new Map();
  let firestoreDiagPersistTimer = 0;
  let firestoreDiagLastPressureWarnAt = 0;

  function emit(next, error = "") {
    status = next;
    lastError = String(error || "");
    document.documentElement.dataset.firebaseStatus = next;
    window.dispatchEvent(new CustomEvent("lifebuilder-firebase-status", {
      detail: { status: next, error: lastError }
    }));
  }

  function errorText(error) {
    return `${error?.code || ""} ${error?.message || error || ""}`.toLowerCase();
  }

  function isTargetCollisionError(error) {
    const text = errorText(error);
    return text.includes("target id already exists") || (text.includes("already-exists") && text.includes("target"));
  }

  function isRecoverableFirestoreError(error) {
    const text = errorText(error);
    return text.includes("client is offline")
      || text.includes("network-request-failed")
      || text.includes("unavailable")
      || text.includes("database-timeout")
      || isTargetCollisionError(error);
  }

  function isResourceExhaustedError(error) {
    const text = errorText(error);
    return text.includes("resource-exhausted")
      || text.includes("maximum allowed queued writes")
      || text.includes("write stream exhausted")
      || text.includes("queued writes");
  }

  function sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, Math.max(0, Number(ms) || 0)));
  }


  function firestorePathOf(ref) {
    if (!ref) return "";
    if (typeof ref.path === "string") return ref.path;
    try {
      const canonical = ref?._key?.path?.canonicalString?.();
      if (canonical) return String(canonical);
    } catch {}
    return "";
  }

  function firestoreCaller() {
    try {
      const lines = String(new Error().stack || "").split("\n").slice(2);
      const own = /firebase-runtime\.js(?:\?[^:]*)?:/i;
      const sdk = /gstatic\.com\/firebasejs|firebase-firestore|firebase-app/i;
      const line = lines.find((entry) => entry && !own.test(entry) && !sdk.test(entry)) || lines[0] || "";
      const match = line.match(/(?:https?:\/\/[^/]+\/)?([^/?#]+\.js)(?:\?[^:]*)?:(\d+):(\d+)/i);
      if (match) return { file: match[1], line: Number(match[2]) || 0, column: Number(match[3]) || 0, raw: line.trim() };
      return { file: "unknown", line: 0, column: 0, raw: line.trim().slice(0, 220) };
    } catch { return { file: "unknown", line: 0, column: 0, raw: "" }; }
  }

  function firestorePathGroup(path) {
    const parts = String(path || "").split("/").filter(Boolean);
    if (!parts.length) return "unknown";
    if (parts[0] === "fightKlCoopMatches" && parts.length >= 3) return `${parts[0]}/*/${parts[2]}`;
    if (parts[0] === "arenaKlRooms" && parts.length >= 3) return `${parts[0]}/*/${parts[2]}`;
    if (parts[0] === "bigCardsSaves" && parts[2] === "chunks") return "bigCardsSaves/*/chunks";
    return parts.length >= 2 ? `${parts[0]}/*` : parts[0];
  }

  function isPlayerProfilePresencePayload(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) return false;
    const keys = Object.keys(data);
    if (!keys.length) return false;
    const allowed = new Set(["cottbus3D", "online", "lastSeenAtMs", "updatedAtMs"]);
    if (!keys.every((key) => allowed.has(key))) return false;
    return Object.prototype.hasOwnProperty.call(data, "cottbus3D") || Object.prototype.hasOwnProperty.call(data, "online");
  }

  // Nur wirklich veraltbare Echtzeitdaten gelten als Hintergrund. Kontostand,
  // Spielstand, Käufe, Matchmaking, Kartenprofile usw. sind absichtlich NICHT hier
  // enthalten und werden selbst bei Queue-Druck niemals lokal verworfen.
  function isBackgroundFirestorePath(path, data = null) {
    const p = String(path || "");
    return p.startsWith("bigCardsProfiles/")
      || p.startsWith("centerPresenceV268/")
      || p.startsWith("centerStaffPresenceV270/")
      || (p.startsWith("playerProfiles/") && isPlayerProfilePresencePayload(data))
      || /^arenaKlRooms\/[^/]+\/participants\//.test(p)
      || /^arenaKlRooms\/[^/]+\/state\/live$/.test(p)
      || /^fightKlCoopMatches\/[^/]+\/players\//.test(p)
      || /^fightKlCoopMatches\/[^/]+\/frames\//.test(p);
  }

  function makeFirestoreWriteMeta(op, ref, extra = {}) {
    const path = firestorePathOf(ref);
    const caller = firestoreCaller();
    return {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      op: String(op || "write"),
      path,
      pathGroup: firestorePathGroup(path),
      caller,
      background: extra.background ?? isBackgroundFirestorePath(path, extra.data),
      batchPaths: Array.isArray(extra.batchPaths) ? extra.batchPaths.slice(0, 20) : [],
      requestedAt: Date.now()
    };
  }

  function incrementDiagMap(map, key, field, amount = 1) {
    const clean = String(key || "unknown").slice(0, 240);
    let row = map.get(clean);
    if (!row) { row = { key: clean, requested: 0, started: 0, ok: 0, failed: 0, coalesced: 0, pressureRejected: 0, lastAt: 0, lastError: "" }; map.set(clean, row); }
    row[field] = Math.max(0, Number(row[field] || 0) + amount);
    row.lastAt = Date.now();
    return row;
  }

  function sourceKeyForMeta(meta) {
    const caller = meta?.caller || {};
    return `${caller.file || "unknown"}:${Number(caller.line) || 0} · ${meta?.op || "write"} · ${meta?.pathGroup || "unknown"}`;
  }

  function rememberFirestoreEvent(meta, stage, error = null) {
    if (!meta) return;
    const event = {
      at: Date.now(), stage: String(stage || ""), id: meta.id,
      op: meta.op, path: String(meta.path || "").slice(0, 260), pathGroup: meta.pathGroup,
      source: sourceKeyForMeta(meta), queueDepth: firestoreWriteQueueDepth,
      background: !!meta.background,
      error: error ? String(error?.code || error?.message || error).slice(0, 260) : ""
    };
    firestoreWriteEvents.push(event);
    if (firestoreWriteEvents.length > FIRESTORE_DIAG_EVENT_LIMIT) firestoreWriteEvents.splice(0, firestoreWriteEvents.length - FIRESTORE_DIAG_EVENT_LIMIT);
    scheduleFirestoreDiagnosticsPersist();
  }

  function recordFirestoreRequest(meta) {
    if (!meta) return;
    incrementDiagMap(firestoreWriteSourceStats, sourceKeyForMeta(meta), "requested");
    incrementDiagMap(firestoreWritePathStats, meta.pathGroup || "unknown", "requested");
    rememberFirestoreEvent(meta, "requested");
    const now = Date.now();
    const recentSameSource = firestoreWriteEvents.filter((event) => event.stage === "requested" && event.source === sourceKeyForMeta(meta) && now - event.at <= 60000).length;
    if (recentSameSource >= 20 && now - firestoreDiagLastPressureWarnAt > 30000) {
      firestoreDiagLastPressureWarnAt = now;
      console.warn(`JK.Games Firestore-Monitor: ${recentSameSource} Write-Anforderungen/min von ${sourceKeyForMeta(meta)}. Hintergrund-Writes werden bei Queue-Druck zusammengefasst/geblockt.`);
    }
  }

  function recordFirestoreStage(meta, stage, error = null) {
    if (!meta) return;
    const field = stage === "started" ? "started" : stage === "ok" ? "ok" : stage === "failed" ? "failed" : stage === "coalesced" ? "coalesced" : stage === "pressure-rejected" ? "pressureRejected" : null;
    if (field) {
      const s = incrementDiagMap(firestoreWriteSourceStats, sourceKeyForMeta(meta), field);
      const p = incrementDiagMap(firestoreWritePathStats, meta.pathGroup || "unknown", field);
      if (error) { s.lastError = String(error?.code || error?.message || error).slice(0, 240); p.lastError = s.lastError; }
    }
    rememberFirestoreEvent(meta, stage, error);
  }

  function sortedDiagRows(map, field = "requested", limit = FIRESTORE_DIAG_TOP_LIMIT) {
    return [...map.values()].sort((a, b) => Number(b[field] || 0) - Number(a[field] || 0) || Number(b.lastAt || 0) - Number(a.lastAt || 0)).slice(0, limit).map((row) => ({ ...row }));
  }

  function getFirestoreDiagnostics() {
    return {
      runtimeVersion: "2026-08-16-v468-named-db-read-fallback",
      sdkVersion: FIREBASE_SDK_VERSION,
      generatedAt: Date.now(),
      status,
      gate: {
        queueDepth: firestoreWriteQueueDepth,
        maxBackgroundQueueDepth: FIRESTORE_MAX_APP_QUEUE,
        coalescedDepth: firestoreCoalescedWrites.size,
        lastWriteAt: firestoreWriteLastAt,
        backoffUntil: firestoreWriteBackoffUntil,
        minGapMs: FIRESTORE_WRITE_GAP_MS,
        resourceStrike: firestoreResourceStrike,
        lastResourceErrorAt: firestoreLastResourceErrorAt
      },
      topSources: sortedDiagRows(firestoreWriteSourceStats),
      topPaths: sortedDiagRows(firestoreWritePathStats),
      recentEvents: firestoreWriteEvents.slice(-80)
    };
  }

  function persistFirestoreDiagnostics() {
    clearTimeout(firestoreDiagPersistTimer); firestoreDiagPersistTimer = 0;
    try { sessionStorage.setItem(FIRESTORE_DIAG_STORAGE_KEY, JSON.stringify(getFirestoreDiagnostics())); } catch {}
  }

  function scheduleFirestoreDiagnosticsPersist() {
    if (firestoreDiagPersistTimer) return;
    firestoreDiagPersistTimer = window.setTimeout(persistFirestoreDiagnostics, 2500);
  }

  function printFirestoreDiagnostics() {
    const diag = getFirestoreDiagnostics();
    console.group("JK.Games Firestore V432 Diagnose");
    console.log("Gate", diag.gate);
    console.table(diag.topSources.slice(0, 15));
    console.table(diag.topPaths.slice(0, 15));
    console.log("Letzte Write-Ereignisse", diag.recentEvents);
    console.groupEnd();
    return diag;
  }

  function clearFirestoreDiagnostics() {
    firestoreWriteEvents.length = 0;
    firestoreWriteSourceStats.clear();
    firestoreWritePathStats.clear();
    try { sessionStorage.removeItem(FIRESTORE_DIAG_STORAGE_KEY); } catch {}
    return getFirestoreDiagnostics();
  }

  function loadPreviousFirestoreDiagnostics() {
    try {
      const raw = JSON.parse(sessionStorage.getItem(FIRESTORE_DIAG_STORAGE_KEY) || "null");
      if (raw?.recentEvents?.length) window.__JKFirestorePreviousDiagnostics = raw;
    } catch {}
  }

  function printPreviousFirestoreDiagnostics() {
    const diag = window.__JKFirestorePreviousDiagnostics || null;
    if (!diag) {
      console.info("JK.Games Firestore: Keine Diagnose aus der vorherigen Seitensitzung gespeichert.");
      return null;
    }
    console.group("JK.Games Firestore V432 Diagnose · vorherige Sitzung");
    console.log("Gate", diag.gate || {});
    console.table((diag.topSources || []).slice(0, 15));
    console.table((diag.topPaths || []).slice(0, 15));
    console.log("Letzte Write-Ereignisse", diag.recentEvents || []);
    console.groupEnd();
    return diag;
  }

  function readSharedNumber(key) {
    try {
      const value = Number(localStorage.getItem(key) || 0);
      return Number.isFinite(value) && value > 0 ? value : 0;
    } catch { return 0; }
  }

  function writeSharedNumber(key, value) {
    try { localStorage.setItem(key, String(Math.max(0, Math.floor(Number(value) || 0)))); } catch {}
  }

  function syncSharedFirestoreState() {
    const sharedBackoff = readSharedNumber(FIRESTORE_BACKOFF_STORAGE_KEY);
    if (sharedBackoff > firestoreWriteBackoffUntil) firestoreWriteBackoffUntil = sharedBackoff;
    return sharedBackoff;
  }

  function readSharedLease() {
    try {
      const raw = localStorage.getItem(FIRESTORE_CROSS_TAB_LEASE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed.token === "string" && Number(parsed.until) > 0 ? parsed : null;
    } catch { return null; }
  }

  async function runWithLocalStorageLease(operation) {
    const token = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    const started = Date.now();
    while (Date.now() - started < 30000) {
      const now = Date.now();
      const current = readSharedLease();
      if (!current || Number(current.until) <= now) {
        try {
          localStorage.setItem(FIRESTORE_CROSS_TAB_LEASE_KEY, JSON.stringify({ token, until: now + 30000 }));
          const verify = readSharedLease();
          if (verify?.token === token) {
            // Bei langsamer Verbindung die Lease erneuern. Sonst könnte sie nach
            // 30 s auslaufen, während der SDK-Write noch aktiv ist, und ein zweiter
            // Tab würde fälschlich parallel losschreiben.
            const renew = window.setInterval(() => {
              try {
                if (readSharedLease()?.token === token) localStorage.setItem(FIRESTORE_CROSS_TAB_LEASE_KEY, JSON.stringify({ token, until: Date.now() + 30000 }));
              } catch {}
            }, 10000);
            try { return await operation(); }
            finally {
              clearInterval(renew);
              try { if (readSharedLease()?.token === token) localStorage.removeItem(FIRESTORE_CROSS_TAB_LEASE_KEY); } catch {}
            }
          }
        } catch {
          // localStorage nicht verfügbar: die lokale Promise-Kette schützt weiterhin diesen Tab.
          return operation();
        }
      }
      await sleep(120 + Math.floor(Math.random() * 90));
    }
    const error = new Error("Firestore-Schreibspur ist in einem anderen Tab noch belegt.");
    error.code = "firestore-cross-tab-pressure";
    error.retryAfterMs = 1000;
    error.transient = true;
    throw error;
  }

  // V430: navigator.locks serialisiert Firestore-Writes zwischen mehreren offenen Tabs.
  // Der localStorage-Zeitstempel hält zusätzlich den Mindestabstand tabübergreifend ein.
  async function runInCrossTabFirestoreLane(operation) {
    const run = async () => {
      syncSharedFirestoreState();
      const now = Date.now();
      if (firestoreWriteBackoffUntil > now) {
        const error = new Error(`Firestore-Schreibpause aktiv. In ${Math.max(1, Math.ceil((firestoreWriteBackoffUntil - now) / 1000))}s erneut versuchen.`);
        error.code = "firestore-write-backoff";
        error.retryAfterMs = firestoreWriteBackoffUntil - now;
        error.transient = true;
        throw error;
      }
      const sharedLast = Math.max(firestoreWriteLastAt, readSharedNumber(FIRESTORE_LAST_WRITE_STORAGE_KEY));
      const gap = FIRESTORE_WRITE_GAP_MS - (Date.now() - sharedLast);
      if (gap > 0) await sleep(gap);
      const result = await operation();
      const completedAt = Date.now();
      firestoreWriteLastAt = completedAt;
      writeSharedNumber(FIRESTORE_LAST_WRITE_STORAGE_KEY, completedAt);
      return result;
    };
    if (navigator?.locks?.request) {
      return navigator.locks.request(FIRESTORE_CROSS_TAB_LOCK, { mode: "exclusive" }, run);
    }
    // Safari/ältere Browser: tabübergreifende Lease als Fallback statt paralleler Streams.
    return runWithLocalStorageLease(run);
  }

  async function waitForFirestoreWriteWindow() {
    syncSharedFirestoreState();
    const now = Date.now();
    if (firestoreWriteBackoffUntil > now) {
      const error = new Error(`Firestore-Schreibpause aktiv. In ${Math.max(1, Math.ceil((firestoreWriteBackoffUntil - now) / 1000))}s erneut versuchen.`);
      error.code = "firestore-write-backoff";
      error.retryAfterMs = firestoreWriteBackoffUntil - now;
      error.transient = true;
      throw error;
    }
    const gap = FIRESTORE_WRITE_GAP_MS - (Date.now() - firestoreWriteLastAt);
    if (gap > 0) await sleep(gap);
  }

  function setFirestoreWriteBackoff(ms = FIRESTORE_RESOURCE_BACKOFF_MS, reason = "resource-exhausted") {
    const resourceReason = /resource|exhaust|queued|write-stream/i.test(String(reason || ""));
    const now = Date.now();
    if (resourceReason) {
      if (now - firestoreLastResourceErrorAt > 15 * 60 * 1000) firestoreResourceStrike = 0;
      firestoreLastResourceErrorAt = now;
      firestoreResourceStrike = Math.min(4, firestoreResourceStrike + 1);
    }
    const requested = Math.max(1000, Number(ms) || FIRESTORE_RESOURCE_BACKOFF_MS);
    const adaptive = resourceReason ? Math.min(FIRESTORE_RESOURCE_BACKOFF_MAX_MS, Math.max(requested, FIRESTORE_RESOURCE_BACKOFF_MS * (2 ** Math.max(0, firestoreResourceStrike - 1)))) : requested;
    const until = now + adaptive;
    firestoreWriteBackoffUntil = Math.max(firestoreWriteBackoffUntil, until, readSharedNumber(FIRESTORE_BACKOFF_STORAGE_KEY));
    writeSharedNumber(FIRESTORE_BACKOFF_STORAGE_KEY, firestoreWriteBackoffUntil);
    persistFirestoreDiagnostics();
    if (now - firestoreWriteBackoffNoticeAt > 30000) {
      firestoreWriteBackoffNoticeAt = now;
      console.warn(`JK.Games Firestore-Schreibpause aktiv (${Math.ceil((firestoreWriteBackoffUntil - now) / 1000)}s) · ${reason}`);
      if (resourceReason) printFirestoreDiagnostics();
    }
    window.dispatchEvent(new CustomEvent("lifebuilder-firestore-write-backoff", { detail: { until: firestoreWriteBackoffUntil, reason, diagnostics: resourceReason ? getFirestoreDiagnostics() : null } }));
    return firestoreWriteBackoffUntil;
  }

  async function waitForSdkPendingWrites(timeoutMs = FIRESTORE_SDK_DRAIN_TIMEOUT_MS) {
    if (!runtimeFirestoreDb || typeof runtimeRawWaitForPendingWrites !== "function") return true;
    if (firestoreSdkDrainPromise) return firestoreSdkDrainPromise;
    const startedAt = Date.now();
    let timer = 0;
    firestoreSdkDrainPromise = Promise.race([
      Promise.resolve().then(() => runtimeRawWaitForPendingWrites(runtimeFirestoreDb)),
      new Promise((_, reject) => {
        timer = window.setTimeout(() => {
          const error = new Error("Firestore-SDK-Schreibstrom konnte nicht rechtzeitig geleert werden.");
          error.code = "firestore-write-drain-timeout";
          error.retryAfterMs = FIRESTORE_LOCAL_PRESSURE_BACKOFF_MS;
          error.transient = true;
          reject(error);
        }, Math.max(3000, Number(timeoutMs) || FIRESTORE_SDK_DRAIN_TIMEOUT_MS));
      })
    ]).then(() => {
      firestoreSdkDrainLastAt = Date.now();
      return true;
    }).finally(() => {
      if (timer) clearTimeout(timer);
      firestoreSdkDrainPromise = null;
    });
    try {
      return await firestoreSdkDrainPromise;
    } catch (error) {
      // Wenn der SDK-Strom schon festhaengt, schicken wir NICHT noch weitere Writes
      // hinterher. Dadurch entsteht kein neuer "maximum allowed queued writes"-Stau.
      if (Date.now() - startedAt >= 2500) {
        setFirestoreWriteBackoff(Math.max(FIRESTORE_LOCAL_PRESSURE_BACKOFF_MS, Number(error?.retryAfterMs) || 0), "sdk-write-drain");
      }
      throw error;
    }
  }

  function queueFirestoreWrite(label, operation, meta = null) {
    const writeMeta = meta || makeFirestoreWriteMeta(label || "write", null);
    if (!meta) recordFirestoreRequest(writeMeta);
    // V432: Nur veraltbare Hintergrund-Synchronisation darf bei lokaler Last
    // ausfallen. Kritische Nutzeraktionen bleiben in der seriellen App-Queue und
    // werden weiterhin exakt einmal an das SDK uebergeben.
    if (writeMeta.background && firestoreWriteQueueDepth >= FIRESTORE_MAX_APP_QUEUE) {
      const error = new Error(`JK.Games verschiebt einen Hintergrund-Firestore-Write: ${firestoreWriteQueueDepth} lokale Writes warten bereits.`);
      error.code = "firestore-write-pressure"; error.retryAfterMs = FIRESTORE_LOCAL_PRESSURE_BACKOFF_MS; error.transient = true;
      recordFirestoreStage(writeMeta, "pressure-rejected", error);
      window.dispatchEvent(new CustomEvent("lifebuilder-firestore-write-pressure", { detail: { queueDepth: firestoreWriteQueueDepth, maxQueueDepth: FIRESTORE_MAX_APP_QUEUE, source: sourceKeyForMeta(writeMeta), path: writeMeta.path } }));
      return Promise.reject(error);
    }
    firestoreWriteQueueDepth += 1;
    const execute = async () => {
      recordFirestoreStage(writeMeta, "started");
      try {
        await waitForFirestoreWriteWindow();
        // V470: SDK-Drain ist die zweite Schutzstufe neben der App-Queue.
        // So warten auch unbemerkte direkte Firestore-Writes erst aus, bevor der
        // naechste JK.Games-Write den WebChannel erreicht.
        await waitForSdkPendingWrites(writeMeta.background ? 10000 : FIRESTORE_SDK_DRAIN_TIMEOUT_MS);
        const result = await runInCrossTabFirestoreLane(operation);
        firestoreWriteLastAt = Date.now();
        writeSharedNumber(FIRESTORE_LAST_WRITE_STORAGE_KEY, firestoreWriteLastAt);
        recordFirestoreStage(writeMeta, "ok");
        return result;
      } catch (error) {
        recordFirestoreStage(writeMeta, "failed", error);
        if (isResourceExhaustedError(error)) {
          setFirestoreWriteBackoff(FIRESTORE_RESOURCE_BACKOFF_MS, `${label || "resource-exhausted"} · ${sourceKeyForMeta(writeMeta)}`);
          const diagnostics = getFirestoreDiagnostics();
          window.dispatchEvent(new CustomEvent("lifebuilder-firestore-resource-exhausted", { detail: { label: label || "resource-exhausted", source: sourceKeyForMeta(writeMeta), path: writeMeta.path, until: firestoreWriteBackoffUntil, diagnostics } }));
        }
        throw error;
      } finally {
        firestoreWriteQueueDepth = Math.max(0, firestoreWriteQueueDepth - 1);
      }
    };
    const result = firestoreWriteChain.then(execute, execute);
    firestoreWriteChain = result.catch(() => {});
    return result;
  }

  // V396: Presence/Profile-Writes koennen sehr schnell erneut mit neueren Daten
  // ankommen. Solange ein Write derselben Dokument-Pfadgruppe noch wartet/laeuft,
  // behalten wir nur den neuesten Stand statt weitere SDK-Writes aufzustauen.
  function coalescibleFirestorePath(ref, data = null) {
    const path = String(ref?.path || "");
    return path.startsWith("bigCardsProfiles/")
      || path.startsWith("centerPresenceV268/")
      || path.startsWith("centerStaffPresenceV270/")
      || (path.startsWith("playerProfiles/") && isPlayerProfilePresencePayload(data))
      || /^arenaKlRooms\/[^/]+\/participants\//.test(path)
      || /^arenaKlRooms\/[^/]+\/state\/live$/.test(path)
      || /^fightKlCoopMatches\/[^/]+\/players\//.test(path)
      || /^fightKlCoopMatches\/[^/]+\/frames\//.test(path);
  }

  function queueCoalescedSetDoc(args, meta) {
    const ref = args?.[0];
    if (!coalescibleFirestorePath(ref, args?.[1])) return queueFirestoreWrite(`setDoc:${String(ref?.path || "")}`, () => runtimeRawSetDoc(...args), meta);
    const key = `set:${String(ref.path)}`;
    let entry = firestoreCoalescedWrites.get(key);
    if (!entry) {
      entry = { args, meta, waiting: [], running: false, queued: false, dirty: false };
      firestoreCoalescedWrites.set(key, entry);
    } else {
      const oldArgs = entry.args;
      const oldMerge = oldArgs?.[2]?.merge === true;
      const newMerge = args?.[2]?.merge === true;
      // Bei merge:true koennen unterschiedliche Module am selben Profil arbeiten.
      // Deshalb Felder zusammenfuehren statt den vorherigen Payload zu verlieren.
      entry.args = oldMerge && newMerge && oldArgs?.[1] && args?.[1]
        ? [args[0], { ...oldArgs[1], ...args[1] }, args[2]]
        : args;
      entry.meta = meta;
      if (entry.running) entry.dirty = true;
      recordFirestoreStage(meta, "coalesced");
    }
    const promise = new Promise((resolve, reject) => entry.waiting.push({ resolve, reject }));
    const launch = () => {
      if (entry.running || entry.queued) return;
      entry.queued = true;
      queueMicrotask(async () => {
        entry.queued = false;
        entry.running = true;
        entry.dirty = false;
        const callArgs = entry.args;
        const callMeta = entry.meta || meta;
        const waiters = entry.waiting.splice(0);
        try {
          const result = await queueFirestoreWrite(`setDoc:${String(ref.path)}`, () => runtimeRawSetDoc(...callArgs), callMeta);
          waiters.forEach((w) => w.resolve(result));
        } catch (error) {
          waiters.forEach((w) => w.reject(error));
        } finally {
          entry.running = false;
          if (entry.dirty || entry.waiting.length) launch();
          else firestoreCoalescedWrites.delete(key);
        }
      });
    };
    launch();
    return promise;
  }

  function withTimeout(promise, timeoutMs = 15000, label = "Firebase") {
    let timer = 0;
    return Promise.race([
      Promise.resolve(promise).finally(() => clearTimeout(timer)),
      new Promise((_, reject) => {
        timer = window.setTimeout(() => reject(new Error(`${label} hat zu lange gebraucht.`)), Math.max(1000, Number(timeoutMs) || 15000));
      })
    ]);
  }

  async function createRuntime() {
    emit(navigator.onLine === false ? "offline" : "loading");
    if (navigator.onLine === false) throw new Error("Keine Internetverbindung.");

    const [appMod, authMod, dbMod, storageMod, functionsMod] = await withTimeout(Promise.all([
      import("https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js"),
      import("https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js"),
      import("https://www.gstatic.com/firebasejs/12.17.1/firebase-functions.js")
    ]), 20000, "Firebase-Bibliotheken");

    const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(CONFIG);
    const auth = authMod.getAuth(app);

    // V468: Kritische Einzel-Dokument-Lesevorgaenge koennen bei der benannten
    // Firestore-Datenbank "gamekl" bei einem WebChannel/Listen-Transportfehler
    // direkt ueber die offizielle Firestore-REST-Schnittstelle gelesen werden.
    // Dadurch ist z. B. der BigCards-Start nicht mehr davon abhaengig, dass ein
    // einzelner Listen-Stream im Browser fehlerfrei aufgebaut wird.
    function decodeFirestoreRestValue(value) {
      if (!value || typeof value !== "object") return null;
      if (Object.prototype.hasOwnProperty.call(value, "nullValue")) return null;
      if (Object.prototype.hasOwnProperty.call(value, "booleanValue")) return !!value.booleanValue;
      if (Object.prototype.hasOwnProperty.call(value, "integerValue")) {
        const n = Number(value.integerValue);
        return Number.isSafeInteger(n) ? n : String(value.integerValue);
      }
      if (Object.prototype.hasOwnProperty.call(value, "doubleValue")) return Number(value.doubleValue);
      if (Object.prototype.hasOwnProperty.call(value, "timestampValue")) return String(value.timestampValue || "");
      if (Object.prototype.hasOwnProperty.call(value, "stringValue")) return String(value.stringValue ?? "");
      if (Object.prototype.hasOwnProperty.call(value, "bytesValue")) return String(value.bytesValue || "");
      if (Object.prototype.hasOwnProperty.call(value, "referenceValue")) return String(value.referenceValue || "");
      if (Object.prototype.hasOwnProperty.call(value, "geoPointValue")) return {
        latitude: Number(value.geoPointValue?.latitude) || 0,
        longitude: Number(value.geoPointValue?.longitude) || 0
      };
      if (Object.prototype.hasOwnProperty.call(value, "arrayValue")) {
        return (value.arrayValue?.values || []).map(decodeFirestoreRestValue);
      }
      if (Object.prototype.hasOwnProperty.call(value, "mapValue")) {
        return decodeFirestoreRestFields(value.mapValue?.fields || {});
      }
      return null;
    }

    function decodeFirestoreRestFields(fields) {
      const out = {};
      for (const [key, value] of Object.entries(fields || {})) out[key] = decodeFirestoreRestValue(value);
      return out;
    }

    // V472: Escape.kl-Live-Presence nutzt absichtlich die Firestore REST-Dokument-API
    // statt des persistenten SDK-Write-Streams. Dadurch können schnelle, kleine
    // Positionsupdates den bereits geschützten JK.Games-Save-Write-Stream nicht
    // erneut mit "maximum allowed queued writes" überlasten.
    function encodeFirestoreRestValue(value) {
      if (value === null || value === undefined) return { nullValue: null };
      if (typeof value === "boolean") return { booleanValue: value };
      if (typeof value === "number") {
        if (!Number.isFinite(value)) return { doubleValue: 0 };
        if (Number.isInteger(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER) return { integerValue: String(value) };
        return { doubleValue: value };
      }
      if (typeof value === "string") return { stringValue: value };
      if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeFirestoreRestValue) } };
      if (typeof value === "object") return { mapValue: { fields: encodeFirestoreRestFields(value) } };
      return { stringValue: String(value) };
    }

    function encodeFirestoreRestFields(data) {
      const fields = {};
      for (const [key, value] of Object.entries(data || {})) fields[key] = encodeFirestoreRestValue(value);
      return fields;
    }

    function firestoreRestDocumentUrl(path) {
      const clean = String(path || "").split("/").filter(Boolean);
      if (!clean.length) throw new Error("Firestore REST: Dokumentpfad fehlt.");
      const encodedPath = clean.map((part) => encodeURIComponent(part)).join("/");
      return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(CONFIG.projectId)}/databases/${encodeURIComponent(DATABASE_ID)}/documents/${encodedPath}`;
    }

    async function firestorePresenceSetRest(path, data, options = {}) {
      const user = auth.currentUser;
      if (!user) throw new Error("Escape-Presence: Keine Firebase-Anmeldung vorhanden.");
      const timeoutMs = Math.max(2000, Number(options.timeoutMs) || 7000);
      let lastError = null;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const controller = typeof AbortController === "function" ? new AbortController() : null;
        const timer = controller ? window.setTimeout(() => controller.abort(), timeoutMs) : 0;
        try {
          const token = await authMod.getIdToken(user, attempt > 0);
          const response = await fetch(firestoreRestDocumentUrl(path), {
            method: "PATCH",
            cache: "no-store",
            keepalive: options.keepalive === true,
            signal: controller?.signal,
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ fields: encodeFirestoreRestFields(data) })
          });
          if (!response.ok) {
            const body = await response.text().catch(() => "");
            const error = new Error(`Escape-Presence REST ${response.status}: ${body.slice(0, 220)}`);
            error.code = `escape-presence-rest-${response.status}`;
            throw error;
          }
          return true;
        } catch (error) {
          lastError = error;
          if (attempt === 0 && /401|unauthenticated|token/i.test(String(error?.message || error || ""))) continue;
          break;
        } finally {
          if (timer) clearTimeout(timer);
        }
      }
      throw lastError || new Error("Escape-Presence konnte nicht gespeichert werden.");
    }

    async function firestorePresenceDeleteRest(path, options = {}) {
      const user = auth.currentUser;
      if (!user) return false;
      const timeoutMs = Math.max(1500, Number(options.timeoutMs) || 5000);
      const controller = typeof AbortController === "function" ? new AbortController() : null;
      const timer = controller ? window.setTimeout(() => controller.abort(), timeoutMs) : 0;
      try {
        const token = await authMod.getIdToken(user, false);
        const response = await fetch(firestoreRestDocumentUrl(path), {
          method: "DELETE",
          cache: "no-store",
          keepalive: options.keepalive === true,
          signal: controller?.signal,
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.ok || response.status === 404;
      } finally {
        if (timer) clearTimeout(timer);
      }
    }

    async function firestorePresenceQueryRest(collectionId, options = {}) {
      const user = auth.currentUser;
      if (!user) throw new Error("Escape-Presence: Keine Firebase-Anmeldung vorhanden.");
      const field = String(options.field || "worldId");
      const equals = options.equals;
      const limit = Math.max(1, Math.min(24, Math.floor(Number(options.limit) || 16)));
      const token = await authMod.getIdToken(user, false);
      const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(CONFIG.projectId)}/databases/${encodeURIComponent(DATABASE_ID)}/documents:runQuery`;
      const response = await fetch(url, {
        method: "POST",
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: String(collectionId || "") }],
            where: {
              fieldFilter: {
                field: { fieldPath: field },
                op: "EQUAL",
                value: encodeFirestoreRestValue(equals)
              }
            },
            limit
          }
        })
      });
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Escape-Presence Query REST ${response.status}: ${body.slice(0, 220)}`);
      }
      const rows = await response.json();
      return (Array.isArray(rows) ? rows : []).map((row) => row?.document).filter(Boolean).map((document) => {
        const name = String(document.name || "");
        return {
          id: name.split("/").pop() || "",
          data: decodeFirestoreRestFields(document.fields || {})
        };
      });
    }

    function makeRestDocumentSnapshot(ref, path, payload) {
      const exists = !!payload;
      const data = exists ? decodeFirestoreRestFields(payload.fields || {}) : undefined;
      const id = String(path || "").split("/").filter(Boolean).pop() || "";
      return {
        id,
        ref,
        metadata: { fromCache: false, hasPendingWrites: false },
        exists: () => exists,
        data: () => data,
        get: (field) => data?.[field]
      };
    }

    async function firestoreRestGetDoc(ref, options = {}) {
      const path = firestorePathOf(ref);
      if (!path) throw new Error("Firestore REST: Dokumentpfad fehlt.");
      const user = auth.currentUser;
      if (!user) throw new Error("Firestore REST: Keine Anmeldung vorhanden.");
      const encodedPath = path.split("/").map((part) => encodeURIComponent(part)).join("/");
      const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(CONFIG.projectId)}/databases/${encodeURIComponent(DATABASE_ID)}/documents/${encodedPath}`;
      const timeoutMs = Math.max(2500, Number(options.timeoutMs) || 10000);
      let lastError = null;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const controller = typeof AbortController === "function" ? new AbortController() : null;
        const timer = controller ? window.setTimeout(() => controller.abort(), timeoutMs) : 0;
        try {
          const token = await authMod.getIdToken(user, attempt > 0);
          const response = await fetch(url, {
            method: "GET",
            cache: "no-store",
            signal: controller?.signal,
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.status === 404) return makeRestDocumentSnapshot(ref, path, null);
          if (!response.ok) {
            const body = await response.text().catch(() => "");
            const error = new Error(`Firestore REST ${response.status}: ${body.slice(0, 240)}`);
            error.code = `firestore-rest-${response.status}`;
            throw error;
          }
          const payload = await response.json();
          return makeRestDocumentSnapshot(ref, path, payload);
        } catch (error) {
          lastError = error;
          if (attempt === 0 && /401|unauthenticated|token/i.test(String(error?.message || error || ""))) continue;
          break;
        } finally {
          if (timer) clearTimeout(timer);
        }
      }
      throw lastError || new Error("Firestore REST-Lesen fehlgeschlagen.");
    }

    async function reliableGetDoc(ref, options = {}) {
      const preferRest = options.preferRest === true;
      const label = String(options.label || "Firestore-Dokument");
      const timeoutMs = Math.max(2500, Number(options.timeoutMs) || 9000);
      const sdkRead = () => withTimeout(dbMod.getDoc(ref), timeoutMs, label);
      if (preferRest) {
        try { return await firestoreRestGetDoc(ref, { timeoutMs }); }
        catch (restError) {
          try { return await sdkRead(); }
          catch (sdkError) {
            sdkError.restFallbackError = restError;
            throw sdkError;
          }
        }
      }
      try { return await sdkRead(); }
      catch (sdkError) {
        try { return await firestoreRestGetDoc(ref, { timeoutMs }); }
        catch (restError) {
          sdkError.restFallbackError = restError;
          throw sdkError;
        }
      }
    }

    // V408: Firestore 12.17.1 + automatische Transport-Erkennung.
    // Kein erzwungenes Long-Polling: Firestore darf selbst zwischen Streaming und
    // Long-Polling wechseln. Ein 20-s-Polling-Timeout gilt nur, falls Auto-Detect
    // Long-Polling tatsächlich aktiviert.
    let db;
    try {
      db = dbMod.initializeFirestore(app, {
        // V408: Firestore entscheidet selbst, ob Long-Polling wirklich nötig ist.
        // Forced Long-Polling wurde entfernt, weil es beim Listen/WebChannel zu
        // wiederholten HTTP-400-Reconnects führen kann. Auto-Detect ist der von
        // Firebase vorgesehene Standardweg und nutzt Long-Polling nur bei Bedarf.
        experimentalAutoDetectLongPolling: true,
        experimentalLongPollingOptions: { timeoutSeconds: 20 }
      }, DATABASE_ID);
    } catch (error) {
      // Falls ein anderer Bereich die benannte Instanz wider Erwarten bereits
      // initialisiert hat, niemals eine zweite Firestore-Instanz erzeugen.
      const text = String(error?.message || error || "").toLowerCase();
      if (!text.includes("already") && !text.includes("initialized")) throw error;
      db = dbMod.getFirestore(app, DATABASE_ID);
    }

    runtimeFirestoreDb = db;
    runtimeRawWaitForPendingWrites = dbMod.waitForPendingWrites;
    runtimeRawSetDoc = dbMod.setDoc;
    const gatedSetDoc = (...args) => {
      const meta = makeFirestoreWriteMeta("setDoc", args[0], { data: args[1] }); recordFirestoreRequest(meta);
      return queueCoalescedSetDoc(args, meta);
    };
    const gatedUpdateDoc = (...args) => {
      const meta = makeFirestoreWriteMeta("updateDoc", args[0]); recordFirestoreRequest(meta);
      return queueFirestoreWrite(`updateDoc:${meta.path}`, () => dbMod.updateDoc(...args), meta);
    };
    const gatedDeleteDoc = (...args) => {
      const meta = makeFirestoreWriteMeta("deleteDoc", args[0], { background: false }); recordFirestoreRequest(meta);
      return queueFirestoreWrite(`deleteDoc:${meta.path}`, () => dbMod.deleteDoc(...args), meta);
    };
    const gatedAddDoc = (...args) => {
      const meta = makeFirestoreWriteMeta("addDoc", args[0], { background: false }); recordFirestoreRequest(meta);
      return queueFirestoreWrite(`addDoc:${meta.path}`, () => dbMod.addDoc(...args), meta);
    };
    const gatedRunTransaction = (...args) => {
      const meta = makeFirestoreWriteMeta("runTransaction", null, { background: false }); recordFirestoreRequest(meta);
      return queueFirestoreWrite("runTransaction", () => dbMod.runTransaction(...args), meta);
    };
    const gatedWriteBatch = (...args) => {
      const batch = dbMod.writeBatch(...args);
      const rawCommit = batch.commit.bind(batch);
      const batchPaths = [];
      let proxy = null;
      proxy = new Proxy(batch, {
        get(target, prop, receiver) {
          if (prop === "commit") return () => {
            const primaryPath = batchPaths[0] || "";
            const meta = makeFirestoreWriteMeta("writeBatch", { path: primaryPath }, { background: batchPaths.length > 0 && batchPaths.every(isBackgroundFirestorePath), batchPaths });
            recordFirestoreRequest(meta);
            return queueFirestoreWrite(`writeBatch:${firestorePathGroup(primaryPath)}`, rawCommit, meta);
          };
          const value = Reflect.get(target, prop, receiver);
          if (typeof value !== "function") return value;
          return (...callArgs) => {
            if (["set", "update", "delete"].includes(String(prop))) {
              const path = firestorePathOf(callArgs[0]); if (path) batchPaths.push(path);
            }
            const result = value.apply(target, callArgs);
            return result === target ? proxy : result;
          };
        }
      });
      return proxy;
    };

    runtime = {
      ...authMod,
      ...dbMod,
      ...storageMod,
      ...functionsMod,
      app,
      auth,
      db,
      setDoc: gatedSetDoc,
      updateDoc: gatedUpdateDoc,
      deleteDoc: gatedDeleteDoc,
      addDoc: gatedAddDoc,
      runTransaction: gatedRunTransaction,
      writeBatch: gatedWriteBatch,
      getDocReliable: reliableGetDoc,
      getDocRest: firestoreRestGetDoc,
      presenceSetRest: firestorePresenceSetRest,
      presenceDeleteRest: firestorePresenceDeleteRest,
      presenceQueryRest: firestorePresenceQueryRest,
      storage: storageMod.getStorage(app),
      functions: functionsMod.getFunctions(app, FUNCTIONS_REGION),
      databaseId: DATABASE_ID,
      functionsRegion: FUNCTIONS_REGION,
      sdkVersion: FIREBASE_SDK_VERSION
    };
    emit("ready");
    return runtime;
  }

  async function load() {
    if (runtime) return runtime;
    if (loading) return loading;
    loading = createRuntime().catch((error) => {
      emit(navigator.onLine === false ? "offline" : "error", error?.message || error);
      throw error;
    }).finally(() => {
      loading = null;
    });
    return loading;
  }

  async function waitForAuth(timeoutMs = 8000) {
    const fb = await load();
    if (fb.auth.currentUser) return fb.auth.currentUser;
    if (typeof fb.auth.authStateReady === "function") {
      await withTimeout(fb.auth.authStateReady(), Math.min(5000, timeoutMs), "Firebase-Anmeldung").catch(() => {});
      if (fb.auth.currentUser) return fb.auth.currentUser;
    }
    return new Promise((resolve) => {
      let done = false;
      let unsubscribe = () => {};
      const finish = (user) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        try { unsubscribe(); } catch {}
        resolve(user || null);
      };
      const timer = window.setTimeout(() => finish(fb.auth.currentUser), Math.max(500, Number(timeoutMs) || 8000));
      unsubscribe = fb.onAuthStateChanged(fb.auth, (user) => finish(user), () => finish(null));
    });
  }

  // V241: Firestore wird nicht mehr manuell per enableNetwork/disableNetwork
  // umgeschaltet. Das Web-SDK verwaltet den Transport selbst. Manuelle Toggles
  // während offener Writes/Listens waren die Hauptursache der Stream-Kollisionen.
  async function ensureFirestoreOnline(reason = "network-resume", options = {}) {
    if (navigator.onLine === false) {
      emit("offline", "Keine Internetverbindung.");
      return null;
    }
    const fb = await load();
    if (!fb?.db) return fb;
    if (firestoreRecoveryPromise) return firestoreRecoveryPromise;

    const now = Date.now();
    const force = options?.force === true;
    if (!force && now - lastFirestoreRecoveryAt < 1800) return fb;
    lastFirestoreRecoveryAt = now;

    firestoreRecoveryPromise = (async () => {
      try {
        // Kein enableNetwork(): wenn Firestore nie deaktiviert wird, gibt es hier
        // nichts zu reaktivieren. Offene SDK-Operationen dürfen ungestört auslaufen.
        emit("ready");
        window.dispatchEvent(new CustomEvent("lifebuilder-firestore-recovered", { detail: { reason } }));
        return fb;
      } finally {
        firestoreRecoveryPromise = null;
      }
    })();
    return firestoreRecoveryPromise;
  }

  async function reconnect(options = {}) {
    return ensureFirestoreOnline("reconnect", { force: options?.force === true });
  }

  function scheduleReconnect(delay = 800) {
    scheduleFirestoreRecovery(delay, "scheduled-reconnect");
  }

  async function recoverFirestore(reason = "transport") {
    return !!(await ensureFirestoreOnline(reason, { force: false }).catch(() => null));
  }

  function scheduleFirestoreRecovery(delay = 900, reason = "network-resume") {
    if (navigator.onLine === false) return;
    const wait = Math.max(250, Number(delay) || 900);
    const due = Date.now() + wait;
    // Bereits früher geplanter Versuch bleibt bestehen; so schieben viele Listener
    // denselben Recovery nicht immer weiter nach hinten.
    if (firestoreRecoveryTimer && firestoreRecoveryDueAt && firestoreRecoveryDueAt <= due) return;
    clearTimeout(firestoreRecoveryTimer);
    firestoreRecoveryDueAt = due;
    firestoreRecoveryTimer = window.setTimeout(() => {
      firestoreRecoveryTimer = 0;
      firestoreRecoveryDueAt = 0;
      ensureFirestoreOnline(reason, { force: false }).catch(() => {});
    }, wait);
  }

  syncSharedFirestoreState();
  loadPreviousFirestoreDiagnostics();
  window.addEventListener("storage", (event) => {
    if (event.key === FIRESTORE_BACKOFF_STORAGE_KEY) syncSharedFirestoreState();
  });
  window.addEventListener("online", () => scheduleFirestoreRecovery(300, "online"));
  window.addEventListener("offline", () => emit("offline", "Keine Internetverbindung."));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) persistFirestoreDiagnostics();
    else if (navigator.onLine !== false) scheduleFirestoreRecovery(900, "tab-visible");
  });
  window.addEventListener("pagehide", persistFirestoreDiagnostics);

  // Safety net: a Firestore INTERNAL ASSERTION poisons the SDK queue; after that
  // further reads/writes can no longer recover in-place. Flush the local save and
  // perform at most one clean page restart per 10 minutes instead of flooding the
  // console and continuously retrying a dead client.
  const HARD_RECOVERY_KEY = "jk-games-firestore-hard-recovery-at";
  let hardRecoveryScheduled = false;
  function isFatalFirestoreAssertion(error) {
    const text = errorText(error);
    return text.includes("firestore") && text.includes("internal assertion failed");
  }
  function scheduleHardFirestoreRecovery(error) {
    if (hardRecoveryScheduled || navigator.onLine === false) return false;
    const now = Date.now();
    let last = 0;
    try { last = Number(sessionStorage.getItem(HARD_RECOVERY_KEY) || 0); } catch {}
    if (now - last < 10 * 60 * 1000) return false;
    hardRecoveryScheduled = true;
    try { sessionStorage.setItem(HARD_RECOVERY_KEY, String(now)); } catch {}
    try { window.LifeBuilderSaveControl?.flush?.(); } catch {}
    emit("error", error?.message || error || "Firestore interner Zustand");
    window.dispatchEvent(new CustomEvent("lifebuilder-firestore-hard-recovery", {
      detail: { reason: "internal-assertion", at: now }
    }));
    window.setTimeout(() => {
      try { window.location.reload(); } catch {}
    }, 900);
    return true;
  }
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event?.reason;
    if (isFatalFirestoreAssertion(reason)) scheduleHardFirestoreRecovery(reason);
    if (isResourceExhaustedError(reason)) {
      // Falls ein SDK-interner Pfad die normale Write-Promise umgeht, verlieren wir
      // die Diagnose trotzdem nicht. Nicht doppelt hochzaehlen, wenn derselbe Fehler
      // gerade bereits durch queueFirestoreWrite erkannt wurde.
      if (Date.now() - firestoreLastResourceErrorAt > 5000) setFirestoreWriteBackoff(FIRESTORE_RESOURCE_BACKOFF_MS, "unhandled-resource-exhausted");
      else { persistFirestoreDiagnostics(); printFirestoreDiagnostics(); }
    }
  });
  window.addEventListener("error", (event) => {
    const candidate = event?.error || event?.message || "";
    if (isFatalFirestoreAssertion(candidate)) scheduleHardFirestoreRecovery(candidate);
  }, true);

  window.LifeBuilderFirebaseCore = {
    version: "2026-08-17-v472-escape-presence-rest",
    sdkVersion: FIREBASE_SDK_VERSION,
    load,
    waitForAuth,
    reconnect,
    scheduleReconnect,
    ensureFirestoreOnline,
    recoverFirestore,
    scheduleFirestoreRecovery,
    isRecoverableFirestoreError,
    isTargetCollisionError,
    isResourceExhaustedError,
    runWrite: queueFirestoreWrite,
    setWriteBackoff: setFirestoreWriteBackoff,
    getWriteGateStatus: () => ({ queueDepth: firestoreWriteQueueDepth, maxQueueDepth: FIRESTORE_MAX_APP_QUEUE, coalescedDepth: firestoreCoalescedWrites.size, lastWriteAt: firestoreWriteLastAt, backoffUntil: firestoreWriteBackoffUntil, minGapMs: FIRESTORE_WRITE_GAP_MS, resourceStrike: firestoreResourceStrike, sdkDrainActive: !!firestoreSdkDrainPromise, sdkDrainLastAt: firestoreSdkDrainLastAt }),
    waitForWriteDrain: (timeoutMs = FIRESTORE_SDK_DRAIN_TIMEOUT_MS) => waitForSdkPendingWrites(timeoutMs),
    getWriteDiagnostics: getFirestoreDiagnostics,
    printWriteDiagnostics: printFirestoreDiagnostics,
    clearWriteDiagnostics: clearFirestoreDiagnostics,
    getPreviousWriteDiagnostics: () => window.__JKFirestorePreviousDiagnostics || null,
    printPreviousWriteDiagnostics: printPreviousFirestoreDiagnostics,
    isFatalFirestoreAssertion,
    scheduleHardFirestoreRecovery,
    withTimeout,
    getDocReliable: async (ref, options = {}) => {
      const fb = await load();
      return fb.getDocReliable(ref, options);
    },
    getDocRest: async (ref, options = {}) => {
      const fb = await load();
      return fb.getDocRest(ref, options);
    },
    getRuntime: () => runtime,
    getStatus: () => status,
    getLastError: () => lastError
  };
  window.JKFirestoreDiagnostics = printFirestoreDiagnostics;
  window.JKFirestoreDiagnosticsPrevious = printPreviousFirestoreDiagnostics;
  window.JKFirestoreDiagnosticsClear = clearFirestoreDiagnostics;
  console.info("JK.Games Firebase Runtime V472 aktiv · Save-Write-Drain + BigCards REST-Recovery + Escape Presence REST-Lane.");
})();
