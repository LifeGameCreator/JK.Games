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
  let reconnectTimer = 0;

  function emit(next, error = "") {
    status = next;
    lastError = String(error || "");
    document.documentElement.dataset.firebaseStatus = next;
    window.dispatchEvent(new CustomEvent("lifebuilder-firebase-status", {
      detail: { status: next, error: lastError }
    }));
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
        experimentalAutoDetectLongPolling: true,
        useFetchStreams: false
      }, DATABASE_ID);
    } catch {
      db = dbMod.getFirestore(app, DATABASE_ID);
    }

    const next = {
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
    runtime = next;
    emit("ready");
    return next;
  }

  async function load(options = {}) {
    const force = options?.force === true;
    if (runtime && !force) return runtime;
    if (loading && !force) return loading;
    if (force) {
      runtime = null;
      loading = null;
    }
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

  async function reconnect(options = {}) {
    if (navigator.onLine === false) {
      emit("offline", "Keine Internetverbindung.");
      return null;
    }
    return load({ force: options?.force === true || status === "error" || status === "offline" });
  }

  function scheduleReconnect(delay = 800) {
    clearTimeout(reconnectTimer);
    reconnectTimer = window.setTimeout(() => reconnect({ force: false }).catch(() => {}), Math.max(100, Number(delay) || 800));
  }

  window.addEventListener("online", () => scheduleReconnect(250));
  window.addEventListener("offline", () => emit("offline", "Keine Internetverbindung."));

  window.LifeBuilderFirebaseCore = {
    version: "2026-07-30-v101",
    load,
    waitForAuth,
    reconnect,
    scheduleReconnect,
    withTimeout,
    getRuntime: () => runtime,
    getStatus: () => status,
    getLastError: () => lastError
  };
})();
