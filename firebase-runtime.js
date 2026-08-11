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
  const FIRESTORE_WRITE_GAP_MS = 1400;
  const FIRESTORE_RESOURCE_BACKOFF_MS = 900000;
  // V387: Während einer aktiven Firestore-Schreibpause werden neue UI-Schreibvorgänge
  // nicht mehr minutenlang als ungelöste Promises festgehalten. Sie brechen schnell
  // mit einem retry-fähigen Fehler ab; lokale Spielstände/Timer können später neu senden.
  let firestoreWriteChain = Promise.resolve();
  let firestoreWriteLastAt = 0;
  let firestoreWriteBackoffUntil = 0;
  let firestoreWriteQueueDepth = 0;
  let firestoreWriteBackoffNoticeAt = 0;
  let runtimeRawSetDoc = null;
  const firestoreCoalescedWrites = new Map();

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

  async function waitForFirestoreWriteWindow() {
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
    const requested = Math.max(1000, Number(ms) || FIRESTORE_RESOURCE_BACKOFF_MS);
    const until = Date.now() + (resourceReason ? Math.max(FIRESTORE_RESOURCE_BACKOFF_MS, requested) : requested);
    firestoreWriteBackoffUntil = Math.max(firestoreWriteBackoffUntil, until);
    const now = Date.now();
    if (now - firestoreWriteBackoffNoticeAt > 30000) {
      firestoreWriteBackoffNoticeAt = now;
      console.warn(`JK.Games Firestore-Schreibpause aktiv (${Math.ceil((firestoreWriteBackoffUntil - now) / 1000)}s) · ${reason}`);
    }
    window.dispatchEvent(new CustomEvent("lifebuilder-firestore-write-backoff", { detail: { until: firestoreWriteBackoffUntil, reason } }));
    return firestoreWriteBackoffUntil;
  }

  function queueFirestoreWrite(label, operation) {
    firestoreWriteQueueDepth += 1;
    const execute = async () => {
      try {
        await waitForFirestoreWriteWindow();
        const result = await operation();
        firestoreWriteLastAt = Date.now();
        return result;
      } catch (error) {
        firestoreWriteLastAt = Date.now();
        if (isResourceExhaustedError(error)) setFirestoreWriteBackoff(FIRESTORE_RESOURCE_BACKOFF_MS, label || "resource-exhausted");
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
  function coalescibleFirestorePath(ref) {
    const path = String(ref?.path || "");
    return path.startsWith("centerPresenceV268/")
      || path.startsWith("centerStaffPresenceV270/")
      || path.startsWith("playerProfiles/");
  }

  function queueCoalescedSetDoc(args) {
    const ref = args?.[0];
    if (!coalescibleFirestorePath(ref)) return queueFirestoreWrite("setDoc", () => runtimeRawSetDoc(...args));
    const key = `set:${String(ref.path)}`;
    let entry = firestoreCoalescedWrites.get(key);
    if (!entry) {
      entry = { args, waiting: [], running: false, queued: false, dirty: false };
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
      if (entry.running) entry.dirty = true;
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
        const waiters = entry.waiting.splice(0);
        try {
          const result = await queueFirestoreWrite(`setDoc:${String(ref.path)}`, () => runtimeRawSetDoc(...callArgs));
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
    // V245: Firestore 12.17.1 + automatische Transport-Erkennung.
    // Kein erzwungenes Long-Polling: Firestore darf selbst zwischen Streaming und
    // Long-Polling wechseln. Ein etwas kuerzerer 25-s-Polling-Timeout hilft bei
    // Proxies/Router-Sessions, die 30-s-Hanging-GETs vorzeitig beenden.
    let db;
    try {
      db = dbMod.initializeFirestore(app, {
        // V396: Der Nutzer hatte wiederholt abgebrochene WebChannel-/Listen-
        // Verbindungen. Erzwungenes Long-Polling ist langsamer, aber bei solchen
        // Proxy/Router-Problemen wesentlich robuster und verhindert reconnect-Spikes.
        experimentalForceLongPolling: true,
        experimentalLongPollingOptions: { timeoutSeconds: 20 }
      }, DATABASE_ID);
    } catch (error) {
      // Falls ein anderer Bereich die benannte Instanz wider Erwarten bereits
      // initialisiert hat, niemals eine zweite Firestore-Instanz erzeugen.
      const text = String(error?.message || error || "").toLowerCase();
      if (!text.includes("already") && !text.includes("initialized")) throw error;
      db = dbMod.getFirestore(app, DATABASE_ID);
    }

    runtimeRawSetDoc = dbMod.setDoc;
    const gatedSetDoc = (...args) => queueCoalescedSetDoc(args);
    const gatedUpdateDoc = (...args) => queueFirestoreWrite("updateDoc", () => dbMod.updateDoc(...args));
    const gatedDeleteDoc = (...args) => queueFirestoreWrite("deleteDoc", () => dbMod.deleteDoc(...args));
    const gatedAddDoc = (...args) => queueFirestoreWrite("addDoc", () => dbMod.addDoc(...args));
    const gatedRunTransaction = (...args) => queueFirestoreWrite("runTransaction", () => dbMod.runTransaction(...args));
    const gatedWriteBatch = (...args) => {
      const batch = dbMod.writeBatch(...args);
      const rawCommit = batch.commit.bind(batch);
      let proxy = null;
      proxy = new Proxy(batch, {
        get(target, prop, receiver) {
          if (prop === "commit") return () => queueFirestoreWrite("writeBatch", rawCommit);
          const value = Reflect.get(target, prop, receiver);
          if (typeof value !== "function") return value;
          return (...callArgs) => {
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

  window.addEventListener("online", () => scheduleFirestoreRecovery(300, "online"));
  window.addEventListener("offline", () => emit("offline", "Keine Internetverbindung."));
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && navigator.onLine !== false) scheduleFirestoreRecovery(900, "tab-visible");
  });

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
    if (isFatalFirestoreAssertion(event?.reason)) scheduleHardFirestoreRecovery(event.reason);
  });
  window.addEventListener("error", (event) => {
    const candidate = event?.error || event?.message || "";
    if (isFatalFirestoreAssertion(candidate)) scheduleHardFirestoreRecovery(candidate);
  }, true);

  window.LifeBuilderFirebaseCore = {
    version: "2026-08-11-v396-firestore-coalesce-longpoll-backoff",
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
    getWriteGateStatus: () => ({ queueDepth: firestoreWriteQueueDepth, coalescedDepth: firestoreCoalescedWrites.size, lastWriteAt: firestoreWriteLastAt, backoffUntil: firestoreWriteBackoffUntil, minGapMs: FIRESTORE_WRITE_GAP_MS }),
    isFatalFirestoreAssertion,
    scheduleHardFirestoreRecovery,
    withTimeout,
    getRuntime: () => runtime,
    getStatus: () => status,
    getLastError: () => lastError
  };
})();
