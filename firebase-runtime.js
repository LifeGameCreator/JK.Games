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

  let runtime = null;
  let loading = null;
  let status = "idle";
  let lastError = "";
  let firestoreRecoveryTimer = 0;
  let firestoreRecoveryDueAt = 0;
  let firestoreRecoveryPromise = null;
  let lastFirestoreRecoveryAt = 0;

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
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js")
    ]), 20000, "Firebase-Bibliotheken");

    const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(CONFIG);
    const auth = authMod.getAuth(app);
    let db;
    try {
      db = dbMod.initializeFirestore(app, {
        experimentalForceLongPolling: true,
        experimentalLongPollingOptions: { timeoutSeconds: 30 },
        useFetchStreams: false
      }, DATABASE_ID);
    } catch {
      db = dbMod.getFirestore(app, DATABASE_ID);
    }

    runtime = {
      ...authMod,
      ...dbMod,
      ...storageMod,
      ...functionsMod,
      app,
      auth,
      db,
      storage: storageMod.getStorage(app),
      functions: functionsMod.getFunctions(app, FUNCTIONS_REGION),
      databaseId: DATABASE_ID,
      functionsRegion: FUNCTIONS_REGION
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

  // Wichtig: Firestore nur EINMAL zentral wieder aktivieren. Mehrfaches bzw.
  // paralleles disableNetwork()/enableNetwork() kann beim Web-SDK laufende
  // Snapshot-Targets gegeneinander laufen lassen ("Target ID already exists").
  // Deshalb kein disableNetwork mehr und alle Recovery-Aufrufe laufen single-flight.
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
        await withTimeout(fb.enableNetwork(fb.db), 12000, "Firestore-Wiederverbindung");
        emit("ready");
        window.dispatchEvent(new CustomEvent("lifebuilder-firestore-recovered", { detail: { reason } }));
        return fb;
      } catch (error) {
        // Ein Target-Konflikt entsteht gerade durch konkurrierende Reconnects.
        // Nicht erneut toggeln; die einzelnen Listener werden kontrolliert neu angehängt.
        if (isTargetCollisionError(error)) {
          emit("ready");
          return fb;
        }
        emit(navigator.onLine === false ? "offline" : "error", error?.message || error);
        throw error;
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

  window.LifeBuilderFirebaseCore = {
    version: "2026-08-07-v233-firestore-single-flight-recovery",
    load,
    waitForAuth,
    reconnect,
    scheduleReconnect,
    ensureFirestoreOnline,
    recoverFirestore,
    scheduleFirestoreRecovery,
    isRecoverableFirestoreError,
    isTargetCollisionError,
    withTimeout,
    getRuntime: () => runtime,
    getStatus: () => status,
    getLastError: () => lastError
  };
})();
