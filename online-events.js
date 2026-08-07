(() => {
  const ONLINE_VERSION = "2026-08-07-v241-firestore-stream-stability";
  const FIRESTORE_DATABASE_ID = "gamekl";
  const DATABASE_VERIFY_TIMEOUT_MS = 12000;
  const DATABASE_RETRY_MS = 15000;
  const CLOUD_UPLOAD_TIMEOUT_MS = 12000;
  const CLOUD_SAVE_MIN_INTERVAL_MS = 20000;
  const CLOUD_CONFLICT_BACKUP_PREFIX = "lifebuilder-2026-cloud-conflict:";
  const CLOUD_DEVICE_ID_KEY = "lifebuilder-2026-device-id";
  const AUDIT_STORAGE_PREFIX = "lifebuilder-2026-online-audit:";
  const HEARTBEAT_MS = 45000;
  const ONLINE_WINDOW_MS = 120000;
  const ACCOUNT_UID_KEY = "lifebuilder-2026-account-uid";
  const ACCOUNT_SLOTS_PREFIX = "lifebuilder-2026-account-slots:";
  const ACCOUNT_ACTIVE_PREFIX = "lifebuilder-2026-account-active-slot:";
  const RESET_CONTROL_PATH_V180 = ["global", "resetControlV180"];
  const RESET_TARGET_VERSION_V180 = 180;
  // V180 aktiviert den angekündigten Pre-Beta-Reset. Firebase-Auth und E-Mail
  // bleiben bestehen; Spielstände und spielbezogene Profile werden neu begonnen.
  const RESET_RUNTIME_ENABLED_V180 = true;
  const RESET_TARGET_GENERATION_V180 = 180;
  const LOCAL_RESET_GENERATION_KEY_V180 = "lifebuilder-2026-reset-generation-v180";
  const hostedOnlineMode = /^https?:$/.test(window.location.protocol)
    && !["localhost", "127.0.0.1", "::1", "0.0.0.0"].includes(String(window.location.hostname || "").toLowerCase());

  let firebasePromise = null;
  let onlineUser = null;
  let authWaitPromise = null;
  let authWaitResolve = null;
  let authWaitReject = null;
  let playerSyncTimer = null;
  let heartbeatTimer = null;
  let commandsUnsubscribe = null;
  let eventUnsubscribe = null;
  let participantUnsubscribe = null;
  let moderationUnsubscribe = null;
  let currentEvent = null;
  let currentParticipant = null;
  let processingCommands = new Set();
  let interactiveAuthInProgress = false;
  let identityCheckPromise = null;
  let cloudSaveTimer = null;
  let cloudSaveInFlight = false;
  let cloudSaveDirty = false;
  let cloudSaveLastAt = 0;
  let cloudHydrationPromise = null;
  let cloudHydrationGeneration = 0;
  let cloudHydrationUid = "";
  let cloudSaveReadyUid = "";
  let databaseReadyUid = "";
  let databaseVerificationPromise = null;
  let databaseConnectionError = "";
  let databaseRetryTimer = null;
  let cloudHydrationRetryTimer = null;
  const serviceRestartTimers = new Map();
  let onlineServicesUid = "";
  let playerSyncInFlight = false;
  let playerSyncDirty = false;
  let playerSyncLastAt = 0;
  let cloudSlotRevisions = [0, 0, 0, 0];
  let cloudSlotLoaded = [false, false, false, false];
  let cloudConflicts = [];

  const htmlEscape = (value) => typeof escapeHtml === "function"
    ? escapeHtml(value)
    : String(value ?? "").replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));

  function deviceId() {
    try {
      let id = String(localStorage.getItem(CLOUD_DEVICE_ID_KEY) || "");
      if (!id) {
        id = `device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem(CLOUD_DEVICE_ID_KEY, id);
      }
      return id;
    } catch {
      return "device-unknown";
    }
  }

  function yieldToMainThread(timeout = 900) {
    return new Promise((resolve) => {
      if (typeof requestIdleCallback === "function") {
        requestIdleCallback(() => resolve(), { timeout: Math.max(100, Number(timeout) || 900) });
      } else {
        setTimeout(resolve, 0);
      }
    });
  }

  function onlineRequired() {
    return hostedOnlineMode;
  }


  function accountSlotsKey(uid) {
    return `${ACCOUNT_SLOTS_PREFIX}${String(uid || "")}`;
  }

  function accountActiveKey(uid) {
    return `${ACCOUNT_ACTIVE_PREFIX}${String(uid || "")}`;
  }

  function backupCurrentSlotsForUid(uid) {
    if (!uid) return;
    try {
      window.LifeBuilderSaveControl?.flush?.();
      // flushLocalSaveNow hat SAVE_SLOTS_KEY bereits erzeugt. Wir kopieren den
      // Text nur noch in den Account-Speicher, statt den großen Zustand ein
      // zweites Mal auf dem Hauptthread zu serialisieren.
      const slotsJson = localStorage.getItem(SAVE_SLOTS_KEY);
      if (slotsJson) localStorage.setItem(accountSlotsKey(uid), slotsJson);
      localStorage.setItem(accountActiveKey(uid), String(activeSlot));
    } catch (error) {
      console.warn("Account-Spielstand konnte lokal nicht gesichert werden", error);
    }
  }

  function readAccountSlots(uid) {
    if (!uid) return null;
    try {
      const parsed = JSON.parse(localStorage.getItem(accountSlotsKey(uid)) || "null");
      if (!Array.isArray(parsed)) return null;
      return Array.from({ length: 4 }, (_, index) => migrateState(parsed[index] || null));
    } catch {
      return null;
    }
  }

  function switchLocalAccount(user) {
    const uid = String(user?.uid || "");
    if (!uid) return;
    const previousUid = String(localStorage.getItem(ACCOUNT_UID_KEY) || "");

    if (!previousUid) {
      // Ein bisher generischer Browser-Spielstand wird nicht blind als Cloud-Stand
      // dieses Accounts markiert. Existiert bereits ein anderer Besitzer im Slot,
      // wird er isoliert, statt den angemeldeten Account zu überschreiben.
      const foreignOwner = (saveSlots || []).map((slot) => String(slot?.onlineAccountUid || "")).find((owner) => owner && owner !== uid);
      if (foreignOwner) {
        try {
          localStorage.setItem(`${ACCOUNT_SLOTS_PREFIX}orphan:${Date.now()}`, JSON.stringify(saveSlots));
        } catch {}
        saveSlots = [null, null, null, null];
        activeSlot = 0;
        selectedSlot = 0;
        state = null;
      }
      localStorage.setItem(ACCOUNT_UID_KEY, uid);
      cloudSlotRevisions = [0, 0, 0, 0];
      cloudSlotLoaded = [false, false, false, false];
      cloudConflicts = [];
      return;
    }
    if (previousUid === uid) return;

    backupCurrentSlotsForUid(previousUid);
    clearTimeout(cloudSaveTimer);
    cloudSaveTimer = null;
    clearTimeout(playerSyncTimer);
    playerSyncTimer = null;
    const accountSlots = readAccountSlots(uid);
    saveSlots = accountSlots || [null, null, null, null];
    let nextActive = Number(localStorage.getItem(accountActiveKey(uid)) || 0);
    if (!Number.isInteger(nextActive) || nextActive < 0 || nextActive > 3) nextActive = 0;
    activeSlot = nextActive;
    selectedSlot = nextActive;
    state = saveSlots[nextActive] || null;
    localStorage.setItem(ACCOUNT_UID_KEY, uid);
    window.__lifeBuilderCloudReady = false;
    cloudSaveReadyUid = "";
    cloudSaveDirty = false;
    cloudSlotRevisions = [0, 0, 0, 0];
    cloudSlotLoaded = [false, false, false, false];
    cloudConflicts = [];
    try {
      localStorage.setItem(ACTIVE_SLOT_KEY, String(activeSlot));
      localStorage.removeItem(STORAGE_KEY);
      window.LifeBuilderSaveControl?.schedule?.(0);
    } catch (error) {
      console.warn("Account-Spielstand konnte nicht aktiviert werden", error);
    }
    if (typeof renderSaveSlots === "function") renderSaveSlots();
    if (state && typeof render === "function") render();
  }

  async function loadOnlineFirebase() {
    if (firebasePromise) return firebasePromise;
    firebasePromise = (async () => {
      if (window.LifeBuilderFirebaseCore?.load) {
        return window.LifeBuilderFirebaseCore.load();
      }
      const [appMod, authMod, dbMod] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
        import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js")
      ]);
      const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(firebasePhoneConfig);
      const auth = authMod.getAuth(app);
      try { await authMod.setPersistence(auth, authMod.browserLocalPersistence); } catch {}
      const db = dbMod.getFirestore(app, FIRESTORE_DATABASE_ID);
      return { ...authMod, ...dbMod, auth, db };
    })().catch((error) => {
      firebasePromise = null;
      throw error;
    });
    return firebasePromise;
  }

  function databaseTimeoutError() {
    const error = new Error("Die Datenbankprüfung hat zu lange gedauert.");
    error.code = "database-timeout";
    return error;
  }

  function withDatabaseTimeout(promise, timeoutMs = DATABASE_VERIFY_TIMEOUT_MS) {
    // V241: Firestore-Promises dürfen NICHT per Promise.race künstlich abgebrochen
    // werden. Der alte Timeout ließ die echte SDK-Operation im Hintergrund weiterlaufen
    // und startete anschließend schon den nächsten Write/Retry. Genau dadurch stapelten
    // sich WriteStreams bis zu FIRESTORE INTERNAL ASSERTION FAILED: Unexpected state.
    return Promise.resolve(promise);
  }

  function databaseErrorText(error) {
    const raw = String(error?.message || error || "");
    const code = String(error?.code || error?.name || "");
    if (/database.*does not exist/i.test(raw) || raw.includes("Cloud Firestore database")) {
      return `Die Online-Datenbank ist gerade nicht erreichbar.`;
    }
    if (code.includes("permission-denied")) {
      return `Die Firestore-Datenbank ${FIRESTORE_DATABASE_ID} ist erreichbar, aber ihre Sicherheitsregeln lehnen den Zugriff ab. Veröffentliche die aktuellen Regeln ausdrücklich in ${FIRESTORE_DATABASE_ID}.`;
    }
    if (code.includes("database-timeout")) {
      return "Die Live-Datenbank antwortet gerade zu langsam. Das Spiel startet trotzdem und versucht die Verbindung automatisch erneut.";
    }
    if (code.includes("unavailable") || code.includes("network-request-failed") || code.includes("failed-precondition")) {
      return "Die Online-Dienste sind gerade nicht erreichbar. Prüfe deine Internetverbindung und versuche es erneut.";
    }
    return raw || "Die Live-Datenbank konnte nicht verbunden werden.";
  }

  function firestoreErrorText(error) {
    return `${error?.code || ""} ${error?.message || error || ""}`.toLowerCase();
  }

  function isFirestoreTargetCollision(error) {
    if (window.LifeBuilderFirebaseCore?.isTargetCollisionError?.(error)) return true;
    const text = firestoreErrorText(error);
    return text.includes("target id already exists") || (text.includes("already-exists") && text.includes("target"));
  }

  function isFirestoreOfflineError(error) {
    const text = firestoreErrorText(error);
    return text.includes("client is offline")
      || text.includes("failed to get document because the client is offline")
      || text.includes("unavailable")
      || text.includes("network-request-failed")
      || text.includes("database-timeout");
  }

  function waitOnlineRetry(delay = 500) {
    return new Promise((resolve) => setTimeout(resolve, Math.max(100, Number(delay) || 500)));
  }

  async function recoverOnlineFirestore(reason = "online-events") {
    if (navigator.onLine === false) return false;
    const core = window.LifeBuilderFirebaseCore;
    try {
      if (core?.ensureFirestoreOnline) return !!(await core.ensureFirestoreOnline(reason, { force: false }));
      if (core?.reconnect) return !!(await core.reconnect({ force: false }));
    } catch (error) {
      if (!isFirestoreTargetCollision(error)) return false;
    }
    return true;
  }

  function scheduleCloudHydrationRetry(user = onlineUser, delay = 900) {
    clearTimeout(cloudHydrationRetryTimer);
    cloudHydrationRetryTimer = null;
    if (!hostedOnlineMode || !user?.uid || navigator.onLine === false) return;
    if (cloudSaveReadyUid === user.uid && window.__lifeBuilderCloudReady === true) return;
    const expectedUid = String(user.uid);
    cloudHydrationRetryTimer = setTimeout(async () => {
      cloudHydrationRetryTimer = null;
      if (!onlineUser || String(onlineUser.uid) !== expectedUid) return;
      if (cloudSaveReadyUid === expectedUid && window.__lifeBuilderCloudReady === true) return;
      try {
        await recoverOnlineFirestore("cloud-slot-retry");
        const fb = await loadOnlineFirebase();
        await verifyOnlineDatabase(fb, onlineUser, true);
        await hydrateCloudSlots(onlineUser);
      } catch (error) {
        if (isFirestoreOfflineError(error) || isFirestoreTargetCollision(error)) {
          window.LifeBuilderFirebaseCore?.scheduleFirestoreRecovery?.(700, "cloud-slot-retry");
          scheduleCloudHydrationRetry(onlineUser, Math.min(15000, Math.max(1200, Number(delay) * 1.8)));
          return;
        }
        console.warn("Cloud-Spielstände konnten nicht geladen werden", error);
      }
    }, Math.max(250, Number(delay) || 900));
  }

  function handleCloudHydrationFailure(error, user = onlineUser) {
    if (isFirestoreOfflineError(error) || isFirestoreTargetCollision(error)) {
      databaseConnectionError = databaseErrorText(error);
      updateOnlineStatusBadge();
      updateAuthOverlayState();
      window.LifeBuilderFirebaseCore?.scheduleFirestoreRecovery?.(500, "cloud-slots-offline");
      scheduleCloudHydrationRetry(user, 700);
      return;
    }
    console.warn("Cloud-Spielstände konnten nicht geladen werden", error);
  }

  function scheduleServiceRestart(key, starter, delay = 1800, recoverNetwork = false) {
    const previous = serviceRestartTimers.get(key);
    if (previous) clearTimeout(previous);
    const timer = setTimeout(async () => {
      serviceRestartTimers.delete(key);
      if (!onlineUser || navigator.onLine === false) return;
      if (recoverNetwork) await recoverOnlineFirestore(`${key}-listener`).catch(() => {});
      Promise.resolve().then(starter).catch((error) => {
        if (isFirestoreOfflineError(error) || isFirestoreTargetCollision(error)) scheduleServiceRestart(key, starter, 2600, isFirestoreOfflineError(error));
        else console.warn(`${key} listener restart`, error);
      });
    }, Math.max(700, Number(delay) || 1800));
    serviceRestartTimers.set(key, timer);
  }

  function handleServiceListenerError(key, error, clearListener, starter) {
    try { clearListener?.(); } catch {}
    if (isFirestoreTargetCollision(error)) {
      scheduleServiceRestart(key, starter, 1600, false);
      return;
    }
    if (isFirestoreOfflineError(error)) {
      window.LifeBuilderFirebaseCore?.scheduleFirestoreRecovery?.(600, `${key}-offline`);
      scheduleServiceRestart(key, starter, 2200, true);
      return;
    }
    console.warn(`${key} listener`, error);
    scheduleServiceRestart(key, starter, 5000, false);
  }

  async function verifyOnlineDatabase(fb = null, user = onlineUser, force = false) {
    if (!user) throw new Error("Bitte zuerst anmelden.");
    if (!force && databaseReadyUid === user.uid) return true;
    if (databaseVerificationPromise) return databaseVerificationPromise;
    databaseVerificationPromise = (async () => {
      const runtime = fb || await loadOnlineFirebase();
      try {
        // V241: keine künstliche Server-Probe und kein connectionChecks-Schreibzugriff
        // mehr. Beides erzeugte bei jedem Recovery zusätzliche Listen/Write-Kanäle.
        // Die Anmeldung ist der Start-Gate; echte Datenzugriffe melden ihre Fehler selbst.
        if (!runtime?.auth?.currentUser || runtime.auth.currentUser.uid !== user.uid) {
          const error = new Error("Firebase-Anmeldung ist noch nicht vollständig bereit.");
          error.code = "auth-not-ready";
          throw error;
        }
        databaseReadyUid = user.uid;
        databaseConnectionError = "";
        clearTimeout(databaseRetryTimer);
        databaseRetryTimer = null;
        updateOnlineStatusBadge();
        updateAuthOverlayState();
        return true;
      } catch (error) {
        databaseReadyUid = "";
        databaseConnectionError = databaseErrorText(error);
        updateOnlineStatusBadge();
        updateAuthOverlayState();
        throw error;
      }
    })().finally(() => { databaseVerificationPromise = null; });
    return databaseVerificationPromise;
  }

  function resolvePendingAuth(user = onlineUser) {
    const hadPendingAuth = !!authWaitResolve;
    if (authWaitResolve && user) authWaitResolve(user);
    authWaitResolve = null;
    authWaitReject = null;
    authWaitPromise = null;

    // Bei einer wiederhergestellten Firebase-Sitzung konnte das Login-Fenster
    // sichtbar bleiben, obwohl die Anmeldung bereits erfolgreich war. Sobald
    // eine wartende Spielstart-Anfrage erfüllt ist, wird es daher sicher geschlossen.
    if (hadPendingAuth && user) {
      document.querySelector("[data-online-auth-overlay]")?.classList.remove("show");
    }
  }

  function scheduleDatabaseRetry(user = onlineUser, delay = DATABASE_RETRY_MS) {
    clearTimeout(databaseRetryTimer);
    databaseRetryTimer = null;
    if (!hostedOnlineMode || !user || databaseReadyUid === user.uid) return;
    const expectedUid = user.uid;
    databaseRetryTimer = setTimeout(async () => {
      if (!onlineUser || onlineUser.uid !== expectedUid || databaseReadyUid === expectedUid) return;
      try {
        const fb = await loadOnlineFirebase();
        await verifyOnlineDatabase(fb, onlineUser, true);
        try {
          await ensureOnlineIdentity(fb, onlineUser);
        } catch (error) {
          console.warn("Online-Identität wird nach erfolgreicher Datenbankverbindung später synchronisiert", error);
        }
        startOnlineServices();
        // Cloud-Spielstände werden im Hintergrund geladen. Eine langsame oder
        // blockierte Schreiboperation darf den sichtbaren Spielstart nicht festhalten.
        hydrateCloudSlots(onlineUser).catch((error) => handleCloudHydrationFailure(error, onlineUser));
      } catch (error) {
        databaseConnectionError = databaseErrorText(error);
        updateOnlineStatusBadge();
        updateAuthOverlayState();
        scheduleDatabaseRetry(onlineUser, DATABASE_RETRY_MS);
      }
    }, Math.max(0, Number(delay) || 0));
  }

  function authErrorText(error) {
    const code = String(error?.code || error?.name || "");
    if (code.includes("username-taken")) return "Dieser Spielername ist bereits vergeben. Bitte einen anderen Namen wählen.";
    if (code.includes("username-locked")) return "Der Spielername dieses Accounts ist bereits fest vergeben.";
    if (code.includes("invalid-username")) return "Der Spielername muss 3 bis 30 Zeichen haben. Erlaubt sind Buchstaben, Zahlen, Leerzeichen, Punkt, Minus und Unterstrich.";
    if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) return "E-Mail oder Passwort ist falsch.";
    if (code.includes("email-already-in-use") || code.includes("email-already-exists")) return "Für diese E-Mail gibt es bereits einen Account.";
    if (code.includes("weak-password")) return "Das Passwort muss mindestens 8 Zeichen sowie Buchstaben und Zahlen enthalten.";
    if (code.includes("invalid-email")) return "Bitte eine gültige E-Mail-Adresse eingeben.";
    if (code.includes("too-many-requests")) return "Zu viele Versuche. Bitte kurz warten und erneut probieren.";
    const rawMessage = String(error?.message || "");
    if (/database.*does not exist/i.test(rawMessage) || rawMessage.includes("Cloud Firestore database")) {
      return `Die Online-Datenbank ist gerade nicht erreichbar.`;
    }
    if (code.includes("permission-denied")) return "Der Online-Profilzugriff wurde abgelehnt. Bitte später erneut versuchen.";
    if (code.includes("network-request-failed") || code.includes("unavailable")) return "Online ist gerade nicht erreichbar. Internetverbindung prüfen und erneut versuchen.";
    return rawMessage || "Online-Anmeldung fehlgeschlagen.";
  }

  function normalizePlayerName(value) {
    return String(value || "")
      .normalize("NFKC")
      .trim()
      .replace(/\s+/g, " ");
  }

  function playerNameKey(value) {
    return normalizePlayerName(value).toLocaleLowerCase("de-DE");
  }

  function validatePlayerName(value) {
    const name = normalizePlayerName(value);
    if (name.length < 3 || name.length > 30) return { ok: false, name, key: "", message: authErrorText({ code: "invalid-username" }) };
    if (!/^[A-Za-z0-9ÄÖÜäöüß._ -]+$/u.test(name)) return { ok: false, name, key: "", message: authErrorText({ code: "invalid-username" }) };
    return { ok: true, name, key: playerNameKey(name), message: "" };
  }

  function usernameError(code, message = "") {
    const error = new Error(message || code);
    error.code = code;
    return error;
  }

  async function reserveUniquePlayerName(fb, user, requestedName) {
    const checked = validatePlayerName(requestedName);
    if (!checked.ok) throw usernameError("invalid-username", checked.message);
    const usernameRef = fb.doc(fb.db, "usernames", checked.key);
    const accountRef = fb.doc(fb.db, "accounts", user.uid);
    const now = Date.now();

    await fb.runTransaction(fb.db, async (transaction) => {
      const [usernameSnapshot, accountSnapshot] = await Promise.all([
        transaction.get(usernameRef),
        transaction.get(accountRef)
      ]);
      const usernameData = usernameSnapshot.exists() ? usernameSnapshot.data() : null;
      const accountData = accountSnapshot.exists() ? accountSnapshot.data() : null;
      const lockedKey = String(accountData?.usernameKey || "");

      if (usernameData && usernameData.uid !== user.uid) throw usernameError("username-taken");
      if (lockedKey && lockedKey !== checked.key) throw usernameError("username-locked");

      if (!usernameSnapshot.exists()) {
        transaction.set(usernameRef, {
          uid: user.uid,
          usernameKey: checked.key,
          displayName: checked.name,
          createdAtMs: now
        });
      }

      transaction.set(accountRef, {
        uid: user.uid,
        email: user.email || "",
        displayName: checked.name,
        usernameKey: checked.key,
        createdAtMs: Number(accountData?.createdAtMs || now),
        updatedAtMs: now
      }, { merge: true });
    });

    if (user.displayName !== checked.name) await fb.updateProfile(user, { displayName: checked.name });
    return { displayName: checked.name, usernameKey: checked.key };
  }

  function uniqueNameOverlay() {
    let overlay = document.querySelector("[data-unique-name-overlay]");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.className = "online-auth-overlay";
    overlay.dataset.uniqueNameOverlay = "1";
    overlay.innerHTML = `
      <section class="online-auth-card" role="dialog" aria-modal="true" aria-labelledby="uniqueNameTitle">
        <p class="eyebrow">JK.Games Online</p>
        <h2 id="uniqueNameTitle">Einmaligen Spielernamen festlegen</h2>
        <p class="online-auth-copy">Jeder Spielername darf im gesamten Online-Spiel nur einmal vorkommen. Dieser Name wird fest mit deinem Account verbunden.</p>
        <label>Spielername<input data-unique-name maxlength="30" autocomplete="nickname" placeholder="Max Mustermann"></label>
        <p class="online-auth-message" data-unique-name-message></p>
        <div class="online-auth-actions">
          <button class="primary-button" data-unique-name-save>Namen speichern</button>
          <button class="secondary-button" data-unique-name-logout>Abmelden</button>
        </div>
        <small>Dein Passwort wird sicher verwaltet und nicht im JK.Games-Spielstand gespeichert.</small>
      </section>`;
    document.body.appendChild(overlay);
    return overlay;
  }

  function askForUniquePlayerName(fb, user, suggestion = "", reason = "") {
    const overlay = uniqueNameOverlay();
    const input = overlay.querySelector("[data-unique-name]");
    const message = overlay.querySelector("[data-unique-name-message]");
    const saveButton = overlay.querySelector("[data-unique-name-save]");
    const logoutButton = overlay.querySelector("[data-unique-name-logout]");
    input.value = normalizePlayerName(suggestion).slice(0, 30);
    message.textContent = reason || "Bitte wähle einen noch freien Spielernamen.";
    overlay.classList.add("show");

    return new Promise((resolve, reject) => {
      const cleanup = () => {
        saveButton.removeEventListener("click", save);
        logoutButton.removeEventListener("click", logout);
        input.removeEventListener("keydown", keydown);
      };
      const save = async () => {
        const checked = validatePlayerName(input.value);
        if (!checked.ok) { message.textContent = checked.message; return; }
        saveButton.disabled = true;
        message.textContent = "Spielername wird reserviert …";
        try {
          const identity = await reserveUniquePlayerName(fb, user, checked.name);
          overlay.classList.remove("show");
          cleanup();
          resolve(identity);
        } catch (error) {
          message.textContent = authErrorText(error);
        } finally {
          saveButton.disabled = false;
        }
      };
      const logout = async () => {
        cleanup();
        overlay.classList.remove("show");
        await fb.signOut(fb.auth).catch(() => {});
        reject(usernameError("name-required", "Ohne eindeutigen Spielernamen kann der Online-Modus nicht gestartet werden."));
      };
      const keydown = (event) => { if (event.key === "Enter") { event.preventDefault(); save(); } };
      saveButton.addEventListener("click", save);
      logoutButton.addEventListener("click", logout);
      input.addEventListener("keydown", keydown);
      setTimeout(() => input.focus(), 40);
    });
  }

  async function ensureOnlineIdentity(fb, user) {
    if (!user) throw usernameError("auth-required");
    if (identityCheckPromise) return identityCheckPromise;
    identityCheckPromise = (async () => {
      const accountRef = fb.doc(fb.db, "accounts", user.uid);
      const accountSnapshot = await fb.getDoc(accountRef);
      const account = accountSnapshot.exists() ? accountSnapshot.data() : {};
      const existingKey = String(account?.usernameKey || "");
      const existingName = normalizePlayerName(account?.displayName || user.displayName || "");

      if (existingKey && existingName) {
        const usernameSnapshot = await fb.getDoc(fb.doc(fb.db, "usernames", existingKey));
        if (usernameSnapshot.exists() && usernameSnapshot.data()?.uid === user.uid) {
          if (user.displayName !== existingName) await fb.updateProfile(user, { displayName: existingName });
          return { displayName: existingName, usernameKey: existingKey };
        }
        try {
          return await reserveUniquePlayerName(fb, user, existingName);
        } catch (error) {
          const code = String(error?.code || "");
          if (!code.includes("username-taken") && !code.includes("invalid-username")) throw error;
        }
      }

      const suggestion = existingName || normalizePlayerName(String(user.email || "").split("@")[0]);
      if (suggestion) {
        try {
          return await reserveUniquePlayerName(fb, user, suggestion);
        } catch (error) {
          const code = String(error?.code || "");
          if (!code.includes("username-taken") && !code.includes("invalid-username")) throw error;
        }
      }
      return askForUniquePlayerName(fb, user, suggestion, suggestion ? `„${suggestion}“ ist bereits vergeben. Bitte wähle einen anderen Namen.` : "Bitte lege deinen einmaligen Spielernamen fest.");
    })().finally(() => { identityCheckPromise = null; });
    return identityCheckPromise;
  }

  function authOverlay() {
    let overlay = document.querySelector("[data-online-auth-overlay]");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.className = "online-auth-overlay";
    overlay.dataset.onlineAuthOverlay = "1";
    overlay.innerHTML = `
      <section class="online-auth-card" role="dialog" aria-modal="true" aria-labelledby="onlineAuthTitle">
        <button class="icon-button online-auth-close" data-online-auth-close aria-label="Schließen">×</button>
        <p class="eyebrow">JK.Games Online</p>
        <h2 id="onlineAuthTitle">Account anmelden</h2>
        <p class="online-auth-copy">Dein JK.Games-Account verbindet Events, Online-Spieler, Shops, Nachrichten und Belohnungen eindeutig mit deinem Charakter.</p>
        <div class="online-auth-tabs">
          <button class="active" data-online-auth-tab="login">Anmelden</button>
          <button data-online-auth-tab="register">Registrieren</button>
        </div>
        <label class="online-auth-name" hidden>Spielername<input data-online-auth-name maxlength="30" autocomplete="nickname" placeholder="Max Mustermann"></label>
        <label>E-Mail<input data-online-auth-email type="email" autocomplete="email" placeholder="name@beispiel.de"></label>
        <label>Passwort<input data-online-auth-password type="password" minlength="8" autocomplete="current-password" placeholder="Mindestens 8 Zeichen"></label>
        <p class="online-auth-message" data-online-auth-message></p>
        <div class="online-auth-actions">
          <button class="primary-button" data-online-auth-submit>Anmelden</button>
          <button class="secondary-button" data-online-auth-continue hidden>Weiter zum Spiel</button>
          <button class="secondary-button" data-online-auth-recover hidden>Verbindung neu starten</button>
          <button class="secondary-button" data-online-auth-logout hidden>Abmelden</button>
        </div>
        <small>Jede E-Mail und jeder Spielername kann nur einmal verwendet werden. Passwörter werden sicher verwaltet und niemals im Spielstand gespeichert.</small>
      </section>`;
    document.body.appendChild(overlay);

    let mode = "login";
    const setMode = (next) => {
      mode = next === "register" ? "register" : "login";
      overlay.querySelectorAll("[data-online-auth-tab]").forEach((button) => button.classList.toggle("active", button.dataset.onlineAuthTab === mode));
      overlay.querySelector(".online-auth-name").hidden = mode !== "register";
      overlay.querySelector("[data-online-auth-submit]").textContent = mode === "register" ? "Account erstellen" : "Anmelden";
      overlay.querySelector("[data-online-auth-password]").autocomplete = mode === "register" ? "new-password" : "current-password";
      overlay.querySelector("[data-online-auth-message]").textContent = "";
    };
    overlay.querySelectorAll("[data-online-auth-tab]").forEach((button) => button.addEventListener("click", () => setMode(button.dataset.onlineAuthTab)));
    overlay.querySelector("[data-online-auth-close]").addEventListener("click", () => {
      overlay.classList.remove("show");
      if (authWaitReject) authWaitReject(new Error("Anmeldung abgebrochen."));
      authWaitResolve = null;
      authWaitReject = null;
      authWaitPromise = null;
    });
    overlay.querySelector("[data-online-auth-continue]").addEventListener("click", () => {
      const message = overlay.querySelector("[data-online-auth-message]");
      message.textContent = databaseReadyUid === onlineUser?.uid
        ? "Live-Datenbank verbunden."
        : "Account ist angemeldet. Die Live-Datenbank wird automatisch im Hintergrund verbunden.";
      overlay.classList.remove("show");
      resolvePendingAuth(onlineUser);
      scheduleDatabaseRetry(onlineUser, 0);
    });
    overlay.querySelector("[data-online-auth-recover]").addEventListener("click", async () => {
      const button = overlay.querySelector("[data-online-auth-recover]");
      const message = overlay.querySelector("[data-online-auth-message]");
      button.disabled = true;
      message.textContent = "Online-Verbindung wird sauber neu gestartet …";
      try {
        await recoverOnlineConnection();
        message.textContent = "Online-Verbindung wurde neu aufgebaut.";
      } catch (error) {
        message.textContent = `Neustart fehlgeschlagen: ${error.message || error}`;
      } finally {
        button.disabled = false;
      }
    });
    overlay.querySelector("[data-online-auth-logout]").addEventListener("click", async () => {
      const fb = await loadOnlineFirebase();
      await setPlayerOffline().catch(() => {});
      await fb.signOut(fb.auth);
      updateAuthOverlayState();
    });
    overlay.querySelector("[data-online-auth-submit]").addEventListener("click", async () => {
      const message = overlay.querySelector("[data-online-auth-message]");
      const submit = overlay.querySelector("[data-online-auth-submit]");
      const email = overlay.querySelector("[data-online-auth-email]").value.trim().toLocaleLowerCase("de-DE");
      const password = overlay.querySelector("[data-online-auth-password]").value;
      const checkedName = validatePlayerName(overlay.querySelector("[data-online-auth-name]").value);
      if (!email || !password || (mode === "register" && !checkedName.ok)) {
        message.textContent = mode === "register"
          ? (!checkedName.ok ? checkedName.message : "Spielername, E-Mail und Passwort ausfüllen.")
          : "E-Mail und Passwort ausfüllen.";
        return;
      }
      if (mode === "register" && (password.length < 8 || !/[A-Za-zÄÖÜäöüß]/u.test(password) || !/\d/.test(password))) {
        message.textContent = "Das Passwort muss mindestens 8 Zeichen sowie mindestens einen Buchstaben und eine Zahl enthalten.";
        return;
      }
      submit.disabled = true;
      interactiveAuthInProgress = true;
      message.textContent = mode === "register" ? "Account und Spielername werden erstellt …" : "Anmeldung läuft …";
      let newlyCreatedUser = null;
      let fb = null;
      try {
        fb = await loadOnlineFirebase();
        let credentials;
        if (mode === "register") {
          credentials = await fb.createUserWithEmailAndPassword(fb.auth, email, password);
          newlyCreatedUser = credentials.user;
          try {
            await reserveUniquePlayerName(fb, credentials.user, checkedName.name);
          } catch (identityError) {
            await fb.deleteUser(credentials.user).catch(() => {});
            await fb.signOut(fb.auth).catch(() => {});
            throw identityError;
          }
        } else {
          credentials = await fb.signInWithEmailAndPassword(fb.auth, email, password);
          // Auth ist der entscheidende Login. Die Namens-/Profilsynchronisierung
          // läuft danach und darf alte Accounts nicht aus dem Spiel aussperren.
          onlineUser = credentials.user;
          try {
            await ensureOnlineIdentity(fb, credentials.user);
          } catch (identityError) {
            console.warn("Firebase-Anmeldung erfolgreich; Online-Profil folgt später", identityError);
          }
        }
        onlineUser = credentials.user;
        message.textContent = `Angemeldet als ${credentials.user.displayName || credentials.user.email}. Live-Datenbank wird geprüft …`;
        let databaseConnected = false;
        try {
          await verifyOnlineDatabase(fb, credentials.user, true);
          databaseConnected = true;
          message.textContent = `Live verbunden als ${credentials.user.displayName || credentials.user.email}. Spiel wird geöffnet …`;
          startOnlineServices();
          // Nicht mehr auf den kompletten Cloud-Abgleich warten. Der Slot-Bildschirm
          // öffnet sofort und wird nach dem Laden automatisch neu gerendert.
          hydrateCloudSlots(credentials.user).catch((error) => {
            handleCloudHydrationFailure(error, credentials.user);
          });
        } catch (databaseError) {
          databaseConnectionError = databaseErrorText(databaseError);
          console.warn("Firebase-Login erfolgreich; Firestore verbindet sich im Hintergrund", databaseError);
          scheduleDatabaseRetry(credentials.user, 1500);
        }
        updateAuthOverlayState();
        message.textContent = databaseConnected
          ? `Live verbunden als ${credentials.user.displayName || credentials.user.email}.`
          : `Angemeldet als ${credentials.user.displayName || credentials.user.email}. Das Spiel startet; die Live-Datenbank wird automatisch erneut verbunden.`;
        setTimeout(() => {
          overlay.classList.remove("show");
          resolvePendingAuth(credentials.user);
        }, databaseConnected ? 350 : 900);
      } catch (error) {
        if (newlyCreatedUser && fb?.auth?.currentUser?.uid === newlyCreatedUser.uid) {
          await fb.signOut(fb.auth).catch(() => {});
        }
        message.textContent = authErrorText(error);
      } finally {
        interactiveAuthInProgress = false;
        submit.disabled = false;
      }
    });
    setMode("login");
    return overlay;
  }

  function updateAuthOverlayState() {
    const overlay = authOverlay();
    const loggedIn = !!onlineUser;
    overlay.querySelector("[data-online-auth-submit]").hidden = loggedIn;
    overlay.querySelector("[data-online-auth-continue]").hidden = !loggedIn;
    overlay.querySelector("[data-online-auth-recover]").hidden = !loggedIn;
    overlay.querySelector("[data-online-auth-logout]").hidden = !loggedIn;
    overlay.querySelectorAll("[data-online-auth-tab]").forEach((button) => button.hidden = loggedIn);
    overlay.querySelectorAll("label").forEach((label) => {
      if (!label.classList.contains("online-auth-name")) label.hidden = loggedIn;
    });
    overlay.querySelector(".online-auth-name").hidden = true;
    const title = overlay.querySelector("#onlineAuthTitle");
    const copy = overlay.querySelector(".online-auth-copy");
    const message = overlay.querySelector("[data-online-auth-message]");
    if (loggedIn) {
      title.textContent = databaseReadyUid === onlineUser.uid ? "JK.Games live verbunden" : "JK.Games-Account angemeldet";
      copy.textContent = databaseReadyUid === onlineUser.uid
        ? "Account, Spielstände, Tickets, Events und Online-Funktionen sind mit der Firestore-Datenbank verbunden."
        : "Der Account ist gültig angemeldet. Die Live-Datenbank wird automatisch im Hintergrund verbunden und blockiert den Spielstart nicht mehr.";
      const accountLabel = `${onlineUser.displayName || "Spieler"}${onlineUser.email ? ` · ${onlineUser.email}` : ""} · Konto ${String(onlineUser.uid || "").slice(0, 8)}`;
      message.textContent = databaseReadyUid === onlineUser.uid
        ? `${accountLabel} · Live-Datenbank verbunden`
        : databaseConnectionError
          ? `${accountLabel} · ${databaseConnectionError} Automatischer neuer Versuch läuft.`
          : `${accountLabel} · Datenbankverbindung läuft …`;
    } else {
      title.textContent = "Account anmelden";
      copy.textContent = "Dein JK.Games-Account verbindet Events, Online-Spieler, Shops, Nachrichten und Belohnungen eindeutig mit deinem Charakter.";
      message.textContent = "";
    }
    updateOnlineStatusBadge();
  }

  function showAuthOverlay() {
    const overlay = authOverlay();
    updateAuthOverlayState();
    overlay.classList.add("show");
    setTimeout(() => overlay.querySelector(onlineUser ? "[data-online-auth-continue]" : "[data-online-auth-email]")?.focus(), 50);
    return overlay;
  }

  async function requireUser(auth = null) {
    const fb = await loadOnlineFirebase();
    const activeAuth = auth || fb.auth;
    if (activeAuth.currentUser) {
      // Firebase Authentication reicht für den Spielstart. Firestore verbindet
      // sich danach im Hintergrund und kann den gültigen Login nicht mehr festhalten.
      onlineUser = activeAuth.currentUser;
      if (hostedOnlineMode && databaseReadyUid !== onlineUser.uid) scheduleDatabaseRetry(onlineUser, 0);
      return onlineUser;
    }
    if (!authWaitPromise) {
      authWaitPromise = new Promise((resolve, reject) => { authWaitResolve = resolve; authWaitReject = reject; });
      showAuthOverlay();
    }
    return authWaitPromise;
  }

  async function recoverOnlineConnection() {
    const fb = await loadOnlineFirebase();
    const user = fb.auth.currentUser || onlineUser;
    if (!user) throw new Error("Bitte zuerst anmelden.");
    onlineUser = user;
    window.LifeBuilderSaveControl?.flush?.();
    stopOnlineServices(false);
    databaseReadyUid = "";
    databaseConnectionError = "";
    cloudSaveReadyUid = "";
    cloudSaveDirty = false;
    cloudSlotRevisions = [0, 0, 0, 0];
    cloudSlotLoaded = [false, false, false, false];
    cloudConflicts = [];
    window.__lifeBuilderCloudReady = false;
    window.dispatchEvent(new CustomEvent("lifebuilder-online-reset", { detail: { uid: user.uid, phase: "start" } }));
    if (typeof user.getIdToken === "function") {
      await window.LifeBuilderFirebaseCore?.withTimeout?.(user.getIdToken(true), 8000, "Firebase-Account")?.catch?.(() => {});
    }
    await window.LifeBuilderFirebaseCore?.reconnect?.({ force: true });
    await verifyOnlineDatabase(fb, user, true);
    await hydrateCloudSlots(user);
    startOnlineServices();
    window.dispatchEvent(new CustomEvent("lifebuilder-online-reset", { detail: { uid: user.uid, phase: "ready" } }));
    updateOnlineStatusBadge();
    updateAuthOverlayState();
    return true;
  }

  function updateOnlineStatusBadge() {
    let badge = document.querySelector("[data-online-account-badge]");
    if (!badge) {
      badge = document.createElement("button");
      badge.type = "button";
      badge.className = "online-account-badge";
      badge.dataset.onlineAccountBadge = "1";
      badge.addEventListener("click", showAuthOverlay);
      document.querySelector(".start-actions")?.insertAdjacentElement("afterend", badge);
    }
    if (!badge) return;
    const liveConnected = !!onlineUser && databaseReadyUid === onlineUser.uid;
    badge.classList.toggle("online", liveConnected);
    badge.classList.toggle("error", !!onlineUser && !liveConnected && !!databaseConnectionError);
    const shortAccount = onlineUser ? `${onlineUser.email || onlineUser.displayName || "Account"} · ${String(onlineUser.uid || "").slice(0, 8)}` : "";
    badge.innerHTML = liveConnected
      ? `<span></span><b>Live</b><small>${htmlEscape(shortAccount)}</small>`
      : onlineUser
        ? databaseConnectionError
          ? `<span></span><b>Wird neu verbunden</b><small>${htmlEscape(databaseConnectionError)}</small>`
          : `<span></span><b>Verbinden …</b><small>${htmlEscape(shortAccount)}</small>`
        : `<span></span><b>Offline</b><small>${hostedOnlineMode ? "Anmeldung erforderlich" : "Lokaler Testmodus"}</small>`;

    let recovery = document.querySelector("[data-online-recovery-fab]");
    if (!recovery) {
      recovery = document.createElement("button");
      recovery.type = "button";
      recovery.className = "online-recovery-fab";
      recovery.dataset.onlineRecoveryFab = "1";
      recovery.innerHTML = `<b>Online neu verbinden</b><small>Account und Apps wiederherstellen</small>`;
      recovery.addEventListener("click", async () => {
        if (recovery.disabled) return;
        recovery.disabled = true;
        recovery.classList.add("working");
        recovery.querySelector("b").textContent = "Verbindung wird repariert …";
        try {
          await recoverOnlineConnection();
          recovery.querySelector("b").textContent = "Wieder verbunden";
          setTimeout(() => updateOnlineStatusBadge(), 900);
        } catch (error) {
          databaseConnectionError = databaseErrorText(error);
          recovery.querySelector("b").textContent = "Erneut versuchen";
          recovery.querySelector("small").textContent = databaseConnectionError;
          recovery.hidden = false;
        } finally {
          recovery.disabled = false;
          recovery.classList.remove("working");
        }
      });
      document.body.appendChild(recovery);
    }
    const needsRecovery = !!onlineUser && !liveConnected && !!databaseConnectionError;
    recovery.hidden = !needsRecovery;
    if (needsRecovery) {
      recovery.querySelector("b").textContent = "Online neu verbinden";
      recovery.querySelector("small").textContent = "Account und Apps wiederherstellen";
    }
  }

  function cloudSlotRef(fb, uid, slotIndex) {
    return fb.doc(fb.db, "gameSaves", uid, "slots", `slot-${Number(slotIndex) + 1}`);
  }

  function cloudConflictBackupKey(uid, slotIndex) {
    return `${CLOUD_CONFLICT_BACKUP_PREFIX}${uid}:${Number(slotIndex)}:${Date.now()}`;
  }

  function mergeFightKlOnCloudLoad(localState, remoteState) {
    if (!localState || !remoteState) return remoteState;
    const localFight = localState.fightKl;
    const remoteFight = remoteState.fightKl;
    const localItems = Array.isArray(localFight?.inventory) ? localFight.inventory.length : 0;
    const remoteItems = Array.isArray(remoteFight?.inventory) ? remoteFight.inventory.length : 0;
    const localUpdated = Number(localFight?.inventoryUpdatedAtMs || localState.onlineUpdatedAtMs || 0);
    const remoteUpdated = Number(remoteFight?.inventoryUpdatedAtMs || remoteState.onlineUpdatedAtMs || 0);
    const localRevision = Math.max(0, Number(localFight?.inventoryRevision || 0));
    const remoteRevision = Math.max(0, Number(remoteFight?.inventoryRevision || 0));
    const localIsNewer = localRevision > remoteRevision
      || (localRevision === remoteRevision && localUpdated > remoteUpdated)
      || (remoteRevision === 0 && localRevision > 0 && localUpdated >= remoteUpdated);
    if (localItems > 0 && (remoteItems === 0 || localIsNewer)) {
      remoteState.fightKl = JSON.parse(JSON.stringify(localFight));
      remoteState.fightKl.inventoryRecoveredFromLocalV148 = true;
      remoteState.fightKl.inventoryUpdatedAtMs = Math.max(Date.now(), localUpdated);
    }
    return remoteState;
  }

  function slotSummary(slotState) {
    if (!slotState || typeof slotState !== "object") return { empty: true };
    return {
      name: `${slotState.firstName || ""} ${slotState.lastName || ""}`.trim() || "Spielstand",
      day: Math.max(0, Number(slotState.day || 0)),
      level: Math.max(0, Number(slotState.level || 0)),
      xp: Math.max(0, Number(slotState.xp || 0)),
      pets: Array.isArray(slotState.pets) ? slotState.pets.filter(Boolean).length : 0,
      petIds: Array.isArray(slotState.pets) ? slotState.pets.filter(Boolean).map((pet) => String(pet.id || pet.name || "")).filter(Boolean).sort() : [],
      items: Array.isArray(slotState.items) ? slotState.items.length : 0,
      properties: Array.isArray(slotState.properties) ? slotState.properties.length : 0,
      fightItems: Array.isArray(slotState.fightKl?.inventory) ? slotState.fightKl.inventory.length : 0,
      fightLevel: Math.max(0, Number(slotState.fightKl?.level || 0)),
      fightBestWave: Math.max(0, Number(slotState.fightKl?.bestWave || 0)),
      fightUpdatedAtMs: Math.max(0, Number(slotState.fightKl?.inventoryUpdatedAtMs || 0)),
      updatedAtMs: Math.max(0, Number(slotState.onlineUpdatedAtMs || 0))
    };
  }

  function summariesDiffer(a, b) {
    return JSON.stringify(slotSummary(a)) !== JSON.stringify(slotSummary(b));
  }

  function backupConflictSlot(uid, slotIndex, localState, reason = "cloud-newer") {
    if (!uid || !localState) return "";
    const key = cloudConflictBackupKey(uid, slotIndex);
    try {
      localStorage.setItem(key, JSON.stringify({ reason, slotIndex, savedAtMs: Date.now(), state: localState }));
      localStorage.setItem(`${CLOUD_CONFLICT_BACKUP_PREFIX}${uid}:latest`, key);
      return key;
    } catch (error) {
      console.warn("Lokale Konflikt-Sicherung konnte nicht gespeichert werden", error);
      return "";
    }
  }

  function queueCloudConflict(slotIndex, localState, remoteState, remoteRevision, reason = "cloud-newer") {
    if (!localState || !remoteState || !summariesDiffer(localState, remoteState)) return;
    const localSummary = slotSummary(localState);
    const remoteSummary = slotSummary(remoteState);
    const extraLocalPets = localSummary.petIds.filter((id) => !remoteSummary.petIds.includes(id));
    const meaningful = extraLocalPets.length > 0
      || localSummary.day > remoteSummary.day
      || localSummary.level > remoteSummary.level
      || localSummary.items > remoteSummary.items + 3
      || localSummary.properties > remoteSummary.properties
      || localSummary.fightItems > remoteSummary.fightItems
      || localSummary.fightBestWave > remoteSummary.fightBestWave;
    const backupKey = backupConflictSlot(onlineUser?.uid || "", slotIndex, localState, reason);
    if (!meaningful) return;
    cloudConflicts.push({ slotIndex, localState, remoteState, remoteRevision, localSummary, remoteSummary, extraLocalPets, backupKey });
  }

  function persistLocalSlotsAfterCloudLoad() {
    state = saveSlots[activeSlot] || null;
    try {
      localStorage.setItem(ACTIVE_SLOT_KEY, String(activeSlot));
      localStorage.removeItem(STORAGE_KEY);
      if (onlineUser?.uid) localStorage.setItem(ACCOUNT_UID_KEY, onlineUser.uid);
      // Große Slot-Daten werden im Leerlauf geschrieben. So blockiert das Laden
      // mehrerer Cloud-Slots den iPhone-Hauptthread nicht mehr.
      window.LifeBuilderSaveControl?.schedule?.(0);
    } catch (error) {
      console.warn("Cloud-Spielstand konnte lokal nicht übernommen werden", error);
    }
    if (typeof renderSaveSlots === "function") renderSaveSlots();
    // Ein später Firebase-Snapshot darf ein geöffnetes Smartphone/Fenster nicht
    // komplett neu aufbauen. Der sichtbare Bereich aktualisiert sich beim nächsten
    // gezielten Rendern beziehungsweise App-Wechsel.
    if (!els?.dialog?.open && typeof render === "function") render();
  }

  function cloudRevisionConflict(slotIndex, expectedRevision, actualRevision) {
    const error = new Error(`Cloud-Konflikt in Slot ${Number(slotIndex) + 1}: erwartet ${expectedRevision}, vorhanden ${actualRevision}.`);
    error.code = "lifebuilder-cloud-revision-conflict";
    error.slotIndex = Number(slotIndex);
    error.expectedRevision = Number(expectedRevision || 0);
    error.actualRevision = Number(actualRevision || 0);
    return error;
  }

  async function serializeCloudState(slotState) {
    await yieldToMainThread(1200);
    const stateJson = JSON.stringify(slotState);
    if (stateJson.length > 880000) {
      const error = new Error("Der Spielstand ist zu groß für den Online-Speicher. Alte Verlaufseinträge müssen bereinigt werden.");
      error.code = "lifebuilder-cloud-save-too-large";
      throw error;
    }
    return stateJson;
  }

  async function writeCloudSlot(slotIndex, slotState = saveSlots?.[slotIndex] || null, options = {}) {
    const ownerUid = String(onlineUser?.uid || "");
    if (!ownerUid || !slotState) return null;
    const allowBeforeReady = options.allowBeforeReady === true;
    if (!allowBeforeReady && (cloudSaveReadyUid !== ownerUid || window.__lifeBuilderCloudReady !== true || !cloudSlotLoaded[slotIndex])) return null;
    const fb = await loadOnlineFirebase();
    if (fb.auth.currentUser?.uid !== ownerUid || onlineUser?.uid !== ownerUid) return null;

    const expectedRevision = Math.max(0, Number(options.expectedRevision ?? cloudSlotRevisions[slotIndex] ?? 0));
    const updatedAtMs = Date.now();
    const cloudState = { ...slotState, onlineUpdatedAtMs: updatedAtMs, onlineAccountUid: ownerUid };
    const stateJson = await serializeCloudState(cloudState);
    const ref = cloudSlotRef(fb, ownerUid, slotIndex);
    let committedRevision = expectedRevision;

    await fb.runTransaction(fb.db, async (transaction) => {
      const snapshot = await transaction.get(ref);
      const currentRevision = snapshot.exists() ? Math.max(0, Number(snapshot.data()?.revision || 0)) : 0;
      if (snapshot.exists() && currentRevision !== expectedRevision) {
        throw cloudRevisionConflict(slotIndex, expectedRevision, currentRevision);
      }
      if (!snapshot.exists() && expectedRevision !== 0) {
        throw cloudRevisionConflict(slotIndex, expectedRevision, 0);
      }
      const nextRevision = currentRevision + 1;
      transaction.set(ref, {
        uid: ownerUid,
        slot: Number(slotIndex),
        stateJson,
        updatedAtMs,
        revision: nextRevision,
        writerDeviceId: deviceId(),
        version: ONLINE_VERSION
      });
      committedRevision = nextRevision;
    });

    if (onlineUser?.uid !== ownerUid) return null;
    slotState.onlineUpdatedAtMs = updatedAtMs;
    slotState.onlineAccountUid = ownerUid;
    cloudSlotRevisions[slotIndex] = committedRevision;
    cloudSlotLoaded[slotIndex] = true;
    cloudSaveLastAt = Date.now();
    return committedRevision;
  }

  async function deleteCloudSlot(slotIndex) {
    const ownerUid = String(onlineUser?.uid || "");
    if (!ownerUid) return;
    const fb = await loadOnlineFirebase();
    if (fb.auth.currentUser?.uid !== ownerUid) return;
    await fb.deleteDoc(cloudSlotRef(fb, ownerUid, slotIndex));
    cloudSlotRevisions[slotIndex] = 0;
    cloudSlotLoaded[slotIndex] = true;
  }

  async function readCloudSlotFromServer(slotIndex) {
    const fb = await loadOnlineFirebase();
    const ref = cloudSlotRef(fb, onlineUser.uid, slotIndex);
    // Ein einzelner SDK-Lesevorgang. Keine parallelen getDocFromServer-Retries mehr.
    return fb.getDoc(ref);
  }

  async function resolveCloudRevisionConflict(slotIndex, localState) {
    const snapshot = await readCloudSlotFromServer(slotIndex);
    if (!snapshot.exists()) {
      cloudSlotRevisions[slotIndex] = 0;
      cloudSlotLoaded[slotIndex] = true;
      return;
    }
    const data = snapshot.data() || {};
    let remoteState = null;
    try { remoteState = migrateState(JSON.parse(String(data.stateJson || "null"))); }
    catch (error) { console.warn("Cloud-Konflikt konnte nicht gelesen werden", error); }
    if (!remoteState) return;
    const revision = Math.max(0, Number(data.revision || 0));
    queueCloudConflict(slotIndex, localState, remoteState, revision, "revision-conflict");
    remoteState.onlineUpdatedAtMs = Number(data.updatedAtMs || remoteState.onlineUpdatedAtMs || Date.now());
    remoteState.onlineAccountUid = onlineUser.uid;
    remoteState = mergeFightKlOnCloudLoad(localState, remoteState);
    saveSlots[slotIndex] = remoteState;
    cloudSlotRevisions[slotIndex] = revision;
    cloudSlotLoaded[slotIndex] = true;
    persistLocalSlotsAfterCloudLoad();
    showCloudConflictRecovery();
  }

  async function runCloudSave() {
    if (cloudSaveInFlight || !cloudSaveDirty) return;
    if (!onlineUser || databaseReadyUid !== onlineUser.uid || cloudSaveReadyUid !== onlineUser.uid || window.__lifeBuilderCloudReady !== true || window.__lifeBuilderCloudHydrating || window.__lifeBuilderRemoteApplying || !state) return;
    const slotIndex = selectedSlot;
    if (!cloudSlotLoaded[slotIndex]) return;
    cloudSaveInFlight = true;
    cloudSaveDirty = false;
    const localState = saveSlots?.[slotIndex] || state;
    try {
      await writeCloudSlot(slotIndex, localState);
    } catch (error) {
      if (String(error?.code || "") === "lifebuilder-cloud-revision-conflict") {
        cloudSaveDirty = false;
        await resolveCloudRevisionConflict(slotIndex, localState).catch((conflictError) => console.warn("Cloud-Konflikt konnte nicht aufgelöst werden", conflictError));
      } else {
        cloudSaveDirty = true;
        console.warn("Cloud-Spielstand konnte nicht gespeichert werden", error);
        const message = String(error?.message || "");
        if (!/database.*does not exist/i.test(message)) {
          clearTimeout(cloudSaveTimer);
          cloudSaveTimer = setTimeout(() => {
            cloudSaveTimer = null;
            runCloudSave().catch(() => {});
          }, 15000);
        }
      }
    } finally {
      cloudSaveInFlight = false;
      if (cloudSaveDirty && !cloudSaveTimer) {
        cloudSaveTimer = setTimeout(() => {
          cloudSaveTimer = null;
          runCloudSave().catch(() => {});
        }, 5000);
      }
    }
  }

  function scheduleCloudSave(delay = 3500) {
    // Entscheidender Schutz: Vor dem vollständigen Cloud-Laden darf ein lokaler,
    // eventuell älterer Browser-Stand niemals den Online-Stand überschreiben.
    if (!onlineUser || databaseReadyUid !== onlineUser.uid || cloudSaveReadyUid !== onlineUser.uid || window.__lifeBuilderCloudReady !== true || window.__lifeBuilderCloudHydrating || window.__lifeBuilderRemoteApplying || !state) return;
    if (!cloudSlotLoaded[selectedSlot]) return;
    cloudSaveDirty = true;
    if (cloudSaveTimer) return;
    const sinceLast = Date.now() - cloudSaveLastAt;
    const wait = Math.max(Number(delay) || 0, sinceLast < CLOUD_SAVE_MIN_INTERVAL_MS ? CLOUD_SAVE_MIN_INTERVAL_MS - sinceLast : 0);
    cloudSaveTimer = setTimeout(() => {
      cloudSaveTimer = null;
      runCloudSave().catch(() => {});
    }, wait);
  }

  function mergeMissingPets(remoteState, localState) {
    const merged = migrateState(JSON.parse(JSON.stringify(remoteState)));
    merged.pets = Array.isArray(merged.pets) ? merged.pets.filter(Boolean) : [];
    const known = new Set(merged.pets.map((pet) => String(pet.id || pet.name || "")));
    (Array.isArray(localState?.pets) ? localState.pets : []).filter(Boolean).forEach((pet) => {
      const id = String(pet.id || pet.name || "");
      if (id && !known.has(id)) {
        merged.pets.push(JSON.parse(JSON.stringify(pet)));
        known.add(id);
      }
    });
    if (!merged.activePetId && merged.pets[0]) merged.activePetId = merged.pets[0].id || "";
    return merged;
  }

  async function applyConflictChoice(conflict, choice) {
    if (!conflict || !onlineUser) return;
    const slotIndex = conflict.slotIndex;
    if (choice === "pets") {
      const merged = mergeMissingPets(saveSlots[slotIndex] || conflict.remoteState, conflict.localState);
      saveSlots[slotIndex] = merged;
      if (slotIndex === selectedSlot) state = merged;
      await writeCloudSlot(slotIndex, merged, { expectedRevision: cloudSlotRevisions[slotIndex] });
      persistLocalSlotsAfterCloudLoad();
      if (typeof addFeed === "function") addFeed(`Cloud-Reparatur: fehlende Tiere aus der lokalen Sicherung wurden in Slot ${slotIndex + 1} übernommen.`);
    } else if (choice === "local") {
      const restored = migrateState(JSON.parse(JSON.stringify(conflict.localState)));
      restored.onlineAccountUid = onlineUser.uid;
      saveSlots[slotIndex] = restored;
      if (slotIndex === selectedSlot) state = restored;
      await writeCloudSlot(slotIndex, restored, { expectedRevision: cloudSlotRevisions[slotIndex] });
      persistLocalSlotsAfterCloudLoad();
      if (typeof addFeed === "function") addFeed(`Cloud-Reparatur: der lokale Stand aus Slot ${slotIndex + 1} wurde bewusst übernommen.`);
    }
  }

  function showCloudConflictRecovery() {
    if (!cloudConflicts.length || document.querySelector("[data-cloud-conflict-overlay]")) return;
    const conflict = cloudConflicts.shift();
    const overlay = document.createElement("div");
    overlay.className = "cloud-conflict-overlay";
    overlay.dataset.cloudConflictOverlay = "1";
    const hasMissingPets = conflict.extraLocalPets.length > 0;
    overlay.innerHTML = `
      <section>
        <p class="eyebrow">Cloud-Sicherung erkannt</p>
        <h2>Unterschiedliche Spielstände in Slot ${conflict.slotIndex + 1}</h2>
        <p>Der Online-Stand wurde sicher geladen. Auf diesem Gerät liegt zusätzlich eine ältere oder abweichende lokale Sicherung. Sie wurde nicht automatisch über die Cloud geschrieben.</p>
        <div class="cloud-conflict-grid">
          <article><small>ONLINE</small><b>${htmlEscape(conflict.remoteSummary.name)}</b><span>Tag ${conflict.remoteSummary.day} · Level ${conflict.remoteSummary.level} · ${conflict.remoteSummary.pets} Tiere</span></article>
          <article><small>DIESES GERÄT</small><b>${htmlEscape(conflict.localSummary.name)}</b><span>Tag ${conflict.localSummary.day} · Level ${conflict.localSummary.level} · ${conflict.localSummary.pets} Tiere</span></article>
        </div>
        <div class="cloud-conflict-actions">
          ${hasMissingPets ? `<button class="primary-button" data-cloud-conflict-pets>Nur fehlende Tiere retten</button>` : ""}
          <button class="secondary-button" data-cloud-conflict-local>Kompletten lokalen Stand verwenden</button>
          <button class="secondary-button" data-cloud-conflict-cloud>Online-Stand behalten</button>
        </div>
        <small>Eine lokale Sicherheitskopie bleibt im Browser gespeichert.</small>
      </section>`;
    document.body.appendChild(overlay);
    const finish = () => {
      overlay.remove();
      if (cloudConflicts.length) setTimeout(showCloudConflictRecovery, 150);
    };
    overlay.querySelector("[data-cloud-conflict-cloud]")?.addEventListener("click", finish);
    overlay.querySelector("[data-cloud-conflict-pets]")?.addEventListener("click", async () => {
      const button = overlay.querySelector("[data-cloud-conflict-pets]");
      button.disabled = true;
      try { await applyConflictChoice(conflict, "pets"); finish(); }
      catch (error) { button.disabled = false; button.textContent = `Fehler: ${error.message || error}`; }
    });
    overlay.querySelector("[data-cloud-conflict-local]")?.addEventListener("click", async () => {
      const button = overlay.querySelector("[data-cloud-conflict-local]");
      button.disabled = true;
      try { await applyConflictChoice(conflict, "local"); finish(); }
      catch (error) { button.disabled = false; button.textContent = `Fehler: ${error.message || error}`; }
    });
  }

  async function preparedResetControlV180(fb) {
    const builtIn = {
      active: true,
      version: RESET_TARGET_VERSION_V180,
      generation: RESET_TARGET_GENERATION_V180,
      startBank: 0,
      bankOpeningCredit: 10000,
      startCash: 1000,
      characterSlots: 4,
      systemBankStart: 1000000000000,
      casinoBankStart: 100000000000,
      note: "Account Reset · Pre-Beta"
    };
    try {
      const snapshot = await fb.getDoc(fb.doc(fb.db, ...RESET_CONTROL_PATH_V180));
      if (!snapshot.exists()) return builtIn;
      const remote = { id: snapshot.id, ...snapshot.data() };
      return Number(remote.version || 0) >= RESET_TARGET_VERSION_V180 ? { ...builtIn, ...remote, active: true } : builtIn;
    } catch (error) {
      console.warn("Reset-V180-Steuerung konnte nicht gelesen werden; aktive Build-Konfiguration wird verwendet", error);
      return builtIn;
    }
  }

  async function applyAccountResetV180IfNeeded(user) {
    if (!RESET_RUNTIME_ENABLED_V180 || !user?.uid) return false;
    const fb = await loadOnlineFirebase();
    const control = await preparedResetControlV180(fb);
    if (!control?.active || Number(control.version || 0) < RESET_TARGET_VERSION_V180) return false;
    const targetGeneration = Math.max(RESET_TARGET_GENERATION_V180, Number(control.generation || RESET_TARGET_GENERATION_V180));
    const accountRef = fb.doc(fb.db, "accounts", user.uid);
    const accountSnapshot = await fb.getDoc(accountRef).catch(() => null);
    const appliedGeneration = Math.max(0, Number(accountSnapshot?.data?.()?.resetGeneration || 0));
    let localAppliedGeneration = 0;
    try { localAppliedGeneration = Math.max(0, Number(localStorage.getItem(LOCAL_RESET_GENERATION_KEY_V180) || 0)); } catch {}
    const needsServerReset = appliedGeneration < targetGeneration;
    const needsLocalReset = localAppliedGeneration < targetGeneration;
    if (!needsServerReset && !needsLocalReset) return false;

    // Die Firebase-Authentifizierung und E-Mail bleiben erhalten. Gelöscht werden
    // nur Spielstände und spielbezogene Profildaten des angemeldeten Accounts.
    if (needsServerReset) {
    const batch = fb.writeBatch(fb.db);
    for (let slotIndex = 0; slotIndex < 4; slotIndex += 1) batch.delete(cloudSlotRef(fb, user.uid, slotIndex));
    batch.delete(fb.doc(fb.db, "playerProfiles", user.uid));
    batch.delete(fb.doc(fb.db, "playerPrivate", user.uid));
    batch.set(accountRef, {
      resetGeneration: targetGeneration,
      resetAppliedAtMs: Date.now(),
      resetVersion: Number(control.version || RESET_TARGET_VERSION_V180),
      resetPreservedAuth: true,
      updatedAtMs: Date.now()
    }, { merge: true });
    await batch.commit();
    }

    saveSlots = [null, null, null, null];
    state = null;
    activeSlot = 0;
    selectedSlot = 0;
    cloudSlotRevisions = [0, 0, 0, 0];
    cloudSlotLoaded = [true, true, true, true];
    try {
      localStorage.removeItem(SAVE_SLOTS_KEY);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(ACTIVE_SLOT_KEY, "0");
      localStorage.removeItem(`${ACCOUNT_SLOTS_PREFIX}${user.uid}`);
      localStorage.removeItem(`${ACCOUNT_ACTIVE_PREFIX}${user.uid}`);
      localStorage.setItem(LOCAL_RESET_GENERATION_KEY_V180, String(targetGeneration));
    } catch {}
    if (typeof renderSaveSlots === "function") renderSaveSlots();
    if (typeof setSetupView === "function") setSetupView("slots");
    window.dispatchEvent(new CustomEvent("lifebuilder-account-reset-v180-applied", { detail: { uid: user.uid, generation: targetGeneration } }));
    alert("ACCOUNT RESET abgeschlossen. Deine E-Mail-Anmeldung bleibt erhalten. Die Pre-Beta startet neu: vier Charakterplätze, Level 1, 1.000 € Bargeld und 10.000 € erst nach Smartphone plus Kontoeröffnung.");
    return true;
  }

  async function hydrateCloudSlots(user = onlineUser) {
    if (!user) return;
    switchLocalAccount(user);
    if (cloudSaveReadyUid === user.uid && window.__lifeBuilderCloudReady === true) return;
    if (cloudHydrationPromise && cloudHydrationUid === user.uid) return cloudHydrationPromise;
    if (cloudHydrationPromise && cloudHydrationUid !== user.uid) {
      try { await Promise.race([cloudHydrationPromise, new Promise((resolve) => setTimeout(resolve, 1500))]); } catch {}
    }
    const hydrationUid = user.uid;
    const hydrationGeneration = cloudHydrationGeneration;
    cloudHydrationUid = hydrationUid;
    const assertCurrentAccount = () => {
      if (onlineUser?.uid !== hydrationUid || hydrationGeneration !== cloudHydrationGeneration) {
        const error = new Error("Cloud-Ladevorgang gehört zu einem früheren Account und wurde verworfen.");
        error.code = "lifebuilder-stale-account-load";
        throw error;
      }
    };
    cloudHydrationPromise = (async () => {
      assertCurrentAccount();
      const resetApplied = await applyAccountResetV180IfNeeded(user);
      assertCurrentAccount();
      if (resetApplied) {
        cloudSaveReadyUid = user.uid;
        window.__lifeBuilderCloudReady = true;
        return;
      }
      window.__lifeBuilderCloudHydrating = true;
      window.__lifeBuilderCloudReady = false;
      cloudSlotLoaded = [false, false, false, false];
      cloudConflicts = [];
      try {
        // Der aktuell gewählte Slot wird zuerst geladen. Die übrigen Slots folgen
        // nacheinander, damit vier große JSON-Dokumente das Handy nicht gleichzeitig blockieren.
        const order = [activeSlot, 0, 1, 2, 3].filter((value, index, list) => list.indexOf(value) === index);
        const uploads = [];
        for (const index of order) {
          assertCurrentAccount();
          const localState = saveSlots?.[index] || null;
          const snapshot = await readCloudSlotFromServer(index);
          assertCurrentAccount();
          if (snapshot.exists()) {
            const remoteData = snapshot.data() || {};
            let remoteState = null;
            try {
              await yieldToMainThread(700);
              remoteState = migrateState(JSON.parse(String(remoteData.stateJson || "null")));
            } catch (error) {
              console.warn("Cloud-Slot beschädigt", index, error);
            }
            if (remoteState) {
              const revision = Math.max(0, Number(remoteData.revision || 0));
              queueCloudConflict(index, localState, remoteState, revision, "initial-hydration");
              remoteState.onlineUpdatedAtMs = Number(remoteData.updatedAtMs || remoteState.onlineUpdatedAtMs || Date.now());
              remoteState.onlineAccountUid = user.uid;
              remoteState = mergeFightKlOnCloudLoad(localState, remoteState);
              saveSlots[index] = remoteState;
              cloudSlotRevisions[index] = revision;
            }
          } else if (localState) {
            localState.onlineAccountUid = user.uid;
            uploads.push({ index, state: localState });
          } else {
            cloudSlotRevisions[index] = 0;
          }
          cloudSlotLoaded[index] = true;
          if (index === activeSlot) persistLocalSlotsAfterCloudLoad();
          await yieldToMainThread(500);
        }

        for (const upload of uploads) {
          assertCurrentAccount();
          try {
            await writeCloudSlot(upload.index, upload.state, { allowBeforeReady: true, expectedRevision: 0 });
          } catch (error) {
            if (String(error?.code || "") === "lifebuilder-cloud-revision-conflict") {
              await resolveCloudRevisionConflict(upload.index, upload.state);
            } else {
              console.warn("Neuer lokaler Slot konnte noch nicht in die Cloud geladen werden", error);
            }
          }
        }

        assertCurrentAccount();
        persistLocalSlotsAfterCloudLoad();
        cloudSaveReadyUid = hydrationUid;
        window.__lifeBuilderCloudReady = true;
        clearTimeout(cloudHydrationRetryTimer);
        cloudHydrationRetryTimer = null;
        databaseConnectionError = "";
        showCloudConflictRecovery();
      } finally {
        window.__lifeBuilderCloudHydrating = false;
      }
    })().catch((error) => {
      if (String(error?.code || "") !== "lifebuilder-stale-account-load") window.__lifeBuilderCloudReady = false;
      throw error;
    }).finally(() => {
      if (cloudHydrationUid === hydrationUid) {
        cloudHydrationPromise = null;
        cloudHydrationUid = "";
      }
    });
    return cloudHydrationPromise;
  }

  function inventoryCounts() {
    const counts = {};
    (state?.items || []).forEach((name) => { counts[name] = (counts[name] || 0) + 1; });
    Object.entries(state?.consumables || {}).forEach(([name, entry]) => { counts[name] = (counts[name] || 0) + Math.max(0, Number(entry?.count || 0)); });
    (state?.blackBusiness?.weapons || []).forEach((entry) => {
      const name = entry?.name || entry?.item || "Unbekannte Ware";
      counts[name] = (counts[name] || 0) + 1;
    });
    return counts;
  }

  function auditSnapshot() {
    const counts = inventoryCounts();
    return {
      at: Date.now(),
      money: Math.round(Number(state?.bank || 0) + Number(state?.cash || 0)),
      bank: Math.round(Number(state?.bank || 0)),
      cash: Math.round(Number(state?.cash || 0)),
      level: Math.round(Number(state?.level || 0)),
      xp: Math.round(Number(state?.xp || 0)),
      itemCount: Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0)
    };
  }

  function evaluateAudit(uid) {
    const current = auditSnapshot();
    let previous = null;
    try { previous = JSON.parse(localStorage.getItem(`${AUDIT_STORAGE_PREFIX}${uid}`) || "null"); } catch { previous = null; }
    const reasons = [];
    let riskScore = 0;
    const elapsed = previous ? Math.max(1, current.at - Number(previous.at || 0)) : 0;
    const adminGrace = Date.now() - Number(state?.onlineLastAdminCommandAt || 0) < 120000;
    if (!adminGrace && previous && elapsed < 120000) {
      const moneyGain = current.money - Number(previous.money || 0);
      const levelGain = current.level - Number(previous.level || 0);
      const itemGain = current.itemCount - Number(previous.itemCount || 0);
      if (moneyGain > 5000000) { reasons.push(`Ungewöhnlicher Geldanstieg: +${moneyGain.toLocaleString("de-DE")} € in ${Math.ceil(elapsed / 1000)} s`); riskScore += 60; }
      if (levelGain > 5) { reasons.push(`Ungewöhnlicher Levelanstieg: +${levelGain}`); riskScore += 35; }
      // Viele reguläre Käufe dürfen keinen Hack-/Mod-Status erzeugen. Ein reiner
      // Inventaranstieg wird nur noch als Prüfhinweis gewertet, wenn gleichzeitig
      // unerklärlich Geld hinzugekommen ist. Der Status selbst bleibt immer manuell.
      if (itemGain > 500 && moneyGain > 0) { reasons.push(`Inventar- und Geldanstieg gleichzeitig: +${itemGain} Items`); riskScore += 15; }
    }
    if (current.bank < 0 || current.cash < 0 || current.level < 0 || current.xp < 0) {
      reasons.push("Ungültige negative Spielwerte erkannt.");
      riskScore += 100;
    }
    localStorage.setItem(`${AUDIT_STORAGE_PREFIX}${uid}`, JSON.stringify(current));
    return { ...current, reasons, riskScore: Math.min(100, riskScore), suspicious: riskScore >= 50 };
  }

  function publicProfilePayload(audit, online = true) {
    const displayName = onlineUser?.displayName || `${state?.firstName || ""} ${state?.lastName || ""}`.trim() || "Spieler";
    return {
      uid: onlineUser.uid,
      displayName,
      displayNameLower: playerNameKey(displayName),
      level: Math.max(0, Math.round(Number(state?.level || 0))),
      city: String(state?.worldLocation || state?.homeCity || "Unbekannt").slice(0, 80),
      job: String(state?.job || "Kein Job").slice(0, 100),
      slot: Math.max(0, Math.round(Number(typeof selectedSlot !== "undefined" ? selectedSlot : 0))),
      online,
      lastSeenAtMs: Date.now(),
      updatedAtMs: Date.now(),
      version: ONLINE_VERSION,
      suspicious: !!audit.suspicious,
      riskScore: Number(audit.riskScore || 0),
      bankIban: String(state?.bankIbanV58 || "").replace(/\s+/g, "").slice(0, 34),
      bankIbanNormalized: String(state?.bankIbanV58 || "").replace(/\s+/g, "").toUpperCase().slice(0, 34)
    };
  }

  function onlineStatisticsPayload() {
    const relationship = state?.finder?.relationshipStats || state?.relationshipStats || {};
    const rawSkills = state?.skills && typeof state.skills === "object" ? state.skills : {};
    const skills = Object.fromEntries(Object.entries(rawSkills).slice(0, 80).map(([key, value]) => [String(key).slice(0, 60), Math.round(Number(value || 0))]));
    return {
      day: Math.max(1, Math.round(Number(state?.day || 1))),
      age: Math.max(0, Math.round(Number(state?.age || 0))),
      job: String(state?.job || "Kein Job").slice(0, 100),
      location: String(state?.location || "home").slice(0, 80),
      worldLocation: String(state?.worldLocation || state?.homeCity || "").slice(0, 80),
      homeCity: String(state?.homeCity || "").slice(0, 80),
      creditScore: Math.round(Number(state?.creditScore || state?.credit || 0)),
      casinoWallet: Math.round(Number(state?.casinoWalletCents ?? ((state?.casinoWallet || 0) * 100))) / 100,
      salaryPayouts: Math.max(0, Math.round(Number(state?.salaryPayouts || 0))),
      workDays: Math.max(0, Math.round(Number(state?.workDays || state?.workStats?.days || 0))),
      workSkillPoints: Math.max(0, Math.round(Number(state?.workSkillPoints || 0))),
      backpackSlots: Math.max(0, Math.round(Number(state?.backpackSlots || 0))),
      wardrobeCount: Array.isArray(state?.wardrobe) ? state.wardrobe.length : 0,
      propertyCount: Array.isArray(state?.properties) ? state.properties.length : 0,
      achievementCount: Array.isArray(state?.achievements) ? state.achievements.length : Object.keys(state?.achievements || {}).length,
      relationship: Math.round(Number(relationship.relationship || 0)),
      relationshipMood: Math.round(Number(relationship.mood || 0)),
      logisticsEmployees: Math.max(0, Math.round(Number(state?.logistics?.employees || state?.logisticsEmployees || 0))),
      logisticsSkillPoints: Math.max(0, Math.round(Number(state?.logistics?.skillPoints || state?.logisticsSkillPoints || 0))),
      shopSales: Math.max(0, Math.round(Number(state?.playerShop?.stats?.totalSales || 0))),
      shopRevenue: Math.max(0, Math.round(Number(state?.playerShop?.stats?.revenue || 0))),
      skills
    };
  }

  function privateProfilePayload(audit) {
    const counts = inventoryCounts();
    return {
      uid: onlineUser.uid,
      bank: Math.round(Number(state?.bank || 0)),
      cash: Math.round(Number(state?.cash || 0)),
      debt: Math.round(Number(state?.debt || 0)),
      phoneCredit: Math.round(Number(state?.phoneCredit || 0)),
      dirtyMoney: Math.round(Number(state?.dirtyMoney || 0)),
      hunger: Math.round(Number(state?.hunger || 0)),
      thirst: Math.round(Number(state?.thirst || 0)),
      energy: Math.round(Number(state?.energy || 0)),
      mood: Math.round(Number(state?.mood || 0)),
      health: Math.round(Number(state?.health || 0)),
      level: Math.round(Number(state?.level || 0)),
      xp: Math.round(Number(state?.xp || 0)),
      itemCounts: counts,
      itemCount: Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0),
      properties: (state?.properties || []).slice(0, 100),
      statistics: onlineStatisticsPayload(),
      shop: {
        created: !!state?.playerShop?.created,
        name: String(state?.playerShop?.name || "").slice(0, 60),
        danger: Math.round(Number(state?.playerShop?.danger || 0)),
        reputation: Math.round(Number(state?.playerShop?.reputation || 0)),
        onlineEnabled: state?.playerShop?.onlineEnabled !== false,
        storageLevel: Math.max(0, Math.min(3, Math.round(Number(state?.playerShop?.storageLevel || 0)))),
        storageCapacity: [0, 500, 1000, 5000][Math.max(0, Math.min(3, Math.round(Number(state?.playerShop?.storageLevel || 0))))],
        listings: Array.isArray(state?.playerShop?.listings) ? state.playerShop.listings.length : 0
      },
      audit: {
        checkedAtMs: audit.at,
        suspicious: !!audit.suspicious,
        riskScore: Number(audit.riskScore || 0),
        reasons: audit.reasons.slice(0, 10)
      },
      updatedAtMs: Date.now(),
      version: ONLINE_VERSION
    };
  }

  async function syncPlayerOnline(force = false) {
    if (!onlineUser || !state) return;
    if (playerSyncInFlight) {
      playerSyncDirty = true;
      return;
    }
    playerSyncInFlight = true;
    playerSyncDirty = false;
    try {
      const fb = await loadOnlineFirebase();
      const audit = evaluateAudit(onlineUser.uid);
      const batch = fb.writeBatch(fb.db);
      batch.set(fb.doc(fb.db, "playerProfiles", onlineUser.uid), publicProfilePayload(audit, true), { merge: true });
      batch.set(fb.doc(fb.db, "playerPrivate", onlineUser.uid), privateProfilePayload(audit), { merge: true });
      await batch.commit();
      playerSyncLastAt = Date.now();
      if (force) updateOnlineStatusBadge();
    } finally {
      playerSyncInFlight = false;
      if (playerSyncDirty) schedulePlayerSync(1800);
    }
  }

  function schedulePlayerSync(delay = 1800) {
    if (!onlineUser || !state || window.__lifeBuilderRemoteApplying) return;
    playerSyncDirty = true;
    if (playerSyncTimer) return;
    const sinceLast = Date.now() - playerSyncLastAt;
    const wait = Math.max(Number(delay) || 0, sinceLast < 15000 ? 15000 - sinceLast : 0);
    playerSyncTimer = setTimeout(() => {
      playerSyncTimer = null;
      syncPlayerOnline().catch((error) => console.warn("Player sync", error));
    }, wait);
  }

  async function setPlayerOffline() {
    if (!onlineUser) return;
    const fb = await loadOnlineFirebase();
    await fb.setDoc(fb.doc(fb.db, "playerProfiles", onlineUser.uid), { online: false, lastSeenAtMs: Date.now(), updatedAtMs: Date.now() }, { merge: true });
  }

  function removeInventoryItemById(itemId, amount = 1) {
    const record = typeof findCatalogItemById === "function" ? findCatalogItemById(itemId) : null;
    const name = record?.name || itemId;
    const entry = record?.entry || {};
    let remaining = Math.max(1, Math.round(Number(amount || 1)));
    let removed = 0;

    if (record?.source === "weapon" && Array.isArray(state?.blackBusiness?.weapons)) {
      state.blackBusiness.weapons = state.blackBusiness.weapons.filter((weapon) => {
        const weaponName = weapon?.name || weapon?.item;
        if (remaining > 0 && (weaponName === name || (typeof itemMatchesName === "function" && itemMatchesName(weaponName, name)))) {
          remaining -= 1; removed += 1; return false;
        }
        return true;
      });
      return { removed, name };
    }

    if ((record?.source === "property" || entry.property) && Array.isArray(state?.properties)) {
      const propertyId = entry.property?.id || entry.id;
      if (propertyId && state.properties.includes(propertyId) && remaining > 0) {
        state.properties = state.properties.filter((id) => id !== propertyId);
        if (state.propertyMeta) delete state.propertyMeta[propertyId];
        removed = 1; remaining = 0;
      }
      return { removed, name };
    }

    if (entry.wear && Array.isArray(state?.wardrobe)) {
      const wearName = entry.item || entry.name || name;
      const index = state.wardrobe.findIndex((owned) => owned === wearName || (typeof itemMatchesName === "function" && itemMatchesName(owned, wearName)));
      if (index >= 0) { state.wardrobe.splice(index, 1); removed = 1; remaining -= 1; }
    }

    const consumable = state?.consumables?.[name];
    if (remaining > 0 && consumable?.count > 0) {
      const take = Math.min(remaining, Number(consumable.count));
      consumable.count -= take;
      remaining -= take;
      removed += take;
      if (consumable.count <= 0) delete state.consumables[name];
    }
    if (remaining > 0 && Array.isArray(state?.items)) {
      state.items = state.items.filter((owned) => {
        if (remaining > 0 && (owned === name || (typeof itemMatchesName === "function" && itemMatchesName(owned, name)))) {
          remaining -= 1; removed += 1; return false;
        }
        return true;
      });
    }
    return { removed, name };
  }

  async function applyPlayerCommand(fb, commandDoc) {
    const command = commandDoc.data();
    if (!command || command.status !== "pending" || processingCommands.has(commandDoc.id)) return;
    processingCommands.add(commandDoc.id);
    let result = "Keine Änderung";
    try {
      if (command.kind === "reloadCloudSlot") {
        const slotIndex = Math.max(0, Math.min(3, Math.round(Number(command.slot || 0))));
        const remoteSnapshot = await fb.getDoc(cloudSlotRef(fb, onlineUser.uid, slotIndex));
        if (!remoteSnapshot.exists()) throw new Error("Der aktualisierte Cloud-Spielstand wurde nicht gefunden.");
        const remoteData = remoteSnapshot.data() || {};
        const remoteUpdatedAtMs = Number(remoteData.updatedAtMs || 0);
        if (Number(command.expectedUpdatedAtMs || 0) > remoteUpdatedAtMs) throw new Error("Die Cloud-Änderung ist noch nicht verfügbar.");
        let remoteState = null;
        try { remoteState = migrateState(JSON.parse(String(remoteData.stateJson || "null"))); }
        catch { throw new Error("Der aktualisierte Cloud-Spielstand ist beschädigt."); }
        if (!remoteState) throw new Error("Der aktualisierte Cloud-Spielstand ist leer.");
        remoteState.onlineUpdatedAtMs = remoteUpdatedAtMs || Date.now();
        remoteState.onlineAccountUid = onlineUser.uid;
        remoteState.onlineLastAdminCommandAt = Date.now();
        saveSlots[slotIndex] = remoteState;
        localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(saveSlots));
        const currentSlot = Math.max(0, Number(typeof selectedSlot !== "undefined" ? selectedSlot : activeSlot || 0));
        if (currentSlot === slotIndex) {
          state = remoteState;
          localStorage.removeItem(STORAGE_KEY);
          if (typeof addFeed === "function") addFeed("Online-Admin: Cloud-Änderung wurde übernommen.");
          if (typeof render === "function") render();
        }
        if (typeof renderSaveSlots === "function") renderSaveSlots();
        result = `Cloud-Slot ${slotIndex + 1} neu geladen`;
        await fb.updateDoc(commandDoc.ref, { status: "done", result, appliedAtMs: Date.now() });
        return;
      }
      state.onlineLastAdminCommandAt = Date.now();
      const amount = Math.max(1, Math.round(Number(command.amount || 1)));
      if (command.kind === "giveItem") {
        const given = giveInventoryItemById(command.itemId, amount);
        if (!given?.ok) throw new Error(given?.message || "Item-ID nicht gefunden");
        result = `${given.name} ${given.amount}x gegeben`;
      } else if (command.kind === "removeItem") {
        const removed = removeInventoryItemById(command.itemId, amount);
        result = `${removed.name} ${removed.removed}x entfernt`;
      } else if (["addMoney", "removeMoney", "setMoney"].includes(command.kind)) {
        const target = ["cash", "bank", "phoneCredit", "dirtyMoney"].includes(command.target) ? command.target : "bank";
        const value = Math.max(0, Math.round(Number(command.value || 0)));
        if (command.kind === "setMoney") state[target] = value;
        else state[target] = Math.max(0, Number(state[target] || 0) + (command.kind === "addMoney" ? value : -value));
        result = `${target} ${command.kind === "setMoney" ? "gesetzt" : command.kind === "addMoney" ? "erhöht" : "verringert"}: ${value}`;
      } else if (command.kind === "setShop") {
        state.playerShop ||= typeof createPlayerShopState === "function" ? createPlayerShopState() : {};
        if (typeof command.owned === "boolean") state.playerShop.created = command.owned;
        if (typeof command.created === "boolean") state.playerShop.created = command.created;
        if (Number.isFinite(Number(command.danger))) state.playerShop.danger = Math.max(0, Math.min(100, Number(command.danger)));
        if (Number.isFinite(Number(command.reputation))) state.playerShop.reputation = Math.max(0, Math.min(100, Number(command.reputation)));
        if (Number.isFinite(Number(command.storageLevel))) {
          state.playerShop.storageLevel = Math.max(0, Math.min(3, Math.round(Number(command.storageLevel))));
        } else if (Number.isFinite(Number(command.storageCapacity))) {
          const capacity = Math.max(0, Math.round(Number(command.storageCapacity)));
          state.playerShop.storageLevel = capacity >= 5000 ? 3 : capacity >= 1000 ? 2 : capacity >= 500 ? 1 : 0;
        }
        if (typeof command.onlineEnabled === "boolean") state.playerShop.onlineEnabled = command.onlineEnabled;
        result = "Shopdaten angepasst";
      } else if (command.kind === "setCharacter") {
        if (Number.isFinite(Number(command.level))) state.level = Math.max(0, Math.round(Number(command.level)));
        if (Number.isFinite(Number(command.xp))) state.xp = Math.max(0, Math.round(Number(command.xp)));
        if (Number.isFinite(Number(command.age))) state.age = Math.max(16, Math.min(120, Math.round(Number(command.age))));
        if (typeof command.job === "string" && command.job.trim()) state.job = command.job.trim().slice(0, 100);
        result = "Charakterdaten angepasst";
      } else if (command.kind === "setNeeds") {
        for (const key of ["hunger", "thirst", "energy", "mood", "health"]) {
          if (Number.isFinite(Number(command[key]))) state[key] = Math.max(0, Math.min(100, Math.round(Number(command[key]))));
        }
        result = "Statuswerte angepasst";
      } else if (command.kind === "setPhone") {
        if (Number.isFinite(Number(command.phoneCredit))) state.phoneCredit = Math.max(0, Math.round(Number(command.phoneCredit)));
        if (Number.isFinite(Number(command.battery))) state.phoneBattery = Math.max(0, Math.min(100, Math.round(Number(command.battery))));
        if (typeof command.simPlan === "string") state.phonePlan = command.simPlan.slice(0, 40);
        state.installedPhoneApps = Array.isArray(state.installedPhoneApps) ? state.installedPhoneApps : [];
        for (const appId of Array.isArray(command.installApps) ? command.installApps : []) {
          if (["finder", "finster", "event"].includes(appId) && !state.installedPhoneApps.includes(appId)) state.installedPhoneApps.push(appId);
        }
        if (command.resetFinder === true) state.finder = {};
        if (command.resetFinster === true) state.finster = {};
        result = "Smartphone angepasst";
      } else if (command.kind === "setWork") {
        if (Number.isFinite(Number(command.workSkillPoints))) state.workSkillPoints = Math.max(0, Math.round(Number(command.workSkillPoints)));
        state.logistics ||= {};
        if (Number.isFinite(Number(command.logisticsEmployees))) state.logistics.employees = Math.max(0, Math.min(20, Math.round(Number(command.logisticsEmployees))));
        if (Number.isFinite(Number(command.logisticsSkillPoints))) state.logistics.skillPoints = Math.max(0, Math.round(Number(command.logisticsSkillPoints)));
        if (command.resetWorkedDay === true) state.workedDay = 0;
        result = "Arbeit angepasst";
      } else if (command.kind === "setGame") {
        if (command.resetLimits === true) {
          state.cooldowns = {};
          state.gameLimits = {};
          state.dailyGameLimits = {};
        }
        if (Number.isFinite(Number(command.kingdomCoins))) state.kingdomCoins = Math.max(0, Math.round(Number(command.kingdomCoins)));
        if (Number.isFinite(Number(command.strongResources))) state.strongResources = Math.max(0, Math.round(Number(command.strongResources)));
        result = "Games angepasst";
      } else if (command.kind === "setWorld") {
        if (typeof command.worldLocation === "string" && command.worldLocation.trim()) state.worldLocation = command.worldLocation.trim().slice(0, 80);
        if (typeof command.location === "string" && command.location.trim()) state.location = command.location.trim().slice(0, 80);
        if (command.finishLocalTravel === true) state.localTravel = null;
        if (command.finishWorldTravel === true) state.worldTravel = null;
        if (command.clearStationBan === true) state.stationBanUntil = 0;
        result = "Stadtkarte und Flughafen angepasst";
      } else if (command.kind === "setProperty") {
        state.properties = Array.isArray(state.properties) ? state.properties : [];
        if (command.clearAll === true) {
          state.properties = [];
          state.propertyMeta = {};
        }
        if (typeof command.addPropertyId === "string" && command.addPropertyId.trim() && !state.properties.includes(command.addPropertyId.trim())) state.properties.push(command.addPropertyId.trim());
        result = "Immobilien angepasst";
      } else if (command.kind === "resetPlayer") {
        const identity = { firstName: state.firstName, lastName: state.lastName, gender: state.gender, age: state.age, homeCity: state.homeCity };
        const fresh = typeof createInitialState === "function" ? createInitialState(identity) : null;
        if (!fresh) throw new Error("Spielstand-Reset ist in dieser Version nicht verfügbar");
        Object.keys(state).forEach((key) => delete state[key]);
        Object.assign(state, fresh);
        result = "Spielstand zurückgesetzt";
      } else {
        throw new Error(`Unbekannter Admin-Befehl: ${command.kind}`);
      }
      if (typeof addFeed === "function") addFeed(`Online-Admin: ${result}.`);
      save();
      if (typeof render === "function") render();
      await fb.updateDoc(commandDoc.ref, { status: "done", result, appliedAtMs: Date.now() });
    } catch (error) {
      await fb.updateDoc(commandDoc.ref, { status: "failed", result: error.message || String(error), appliedAtMs: Date.now() }).catch(() => {});
    } finally {
      processingCommands.delete(commandDoc.id);
    }
  }

  async function startCommandListener() {
    if (!onlineUser) return;
    const fb = await loadOnlineFirebase();
    commandsUnsubscribe?.();
    commandsUnsubscribe = fb.onSnapshot(fb.collection(fb.db, "playerCommands", onlineUser.uid, "queue"), (snapshot) => {
      snapshot.docs.forEach((docSnap) => applyPlayerCommand(fb, docSnap));
    }, (error) => handleServiceListenerError("Admin command", error, () => { commandsUnsubscribe = null; }, () => startCommandListener()));
  }

  function eventIsActive(eventData = currentEvent) {
    if (!eventData || eventData.status !== "active") return false;
    const now = Date.now();
    if (eventData.startsAtMs && now < eventData.startsAtMs) return false;
    if (eventData.endsAtMs && now > eventData.endsAtMs) return false;
    return true;
  }

  function eventCountdownText(eventData) {
    if (!eventData) return "";
    const now = Date.now();
    const target = now < Number(eventData.startsAtMs || 0) ? Number(eventData.startsAtMs) : Number(eventData.endsAtMs || 0);
    if (!target) return "Ohne feste Endzeit";
    const left = target - now;
    if (left <= 0) return now < Number(eventData.startsAtMs || 0) ? "Startet jetzt" : "Beendet";
    const minutes = Math.ceil(left / 60000);
    if (minutes < 60) return `${minutes} Min.`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return `${hours} Std. ${rest} Min.`;
  }

  function rewardItemsHtml(items) {
    if (!Array.isArray(items) || !items.length) return `<span>Keine Item-Belohnung</span>`;
    return items.map((entry) => `<span><b>${Math.max(1, Number(entry.amount || 1))}×</b> ${htmlEscape(entry.label || entry.itemId || "Item")}</span>`).join("");
  }

  function eventAppHtml() {
    if (!onlineUser) {
      return `<div class="event-app-empty"><span class="event-app-logo">E</span><h4>Event-App</h4><p>Bitte melde dich mit deinem JK.Games-Account an, damit Live-Events und Belohnungen geladen werden.</p><button class="mini-button gold" data-event-login>Anmelden</button></div>`;
    }
    const eventData = currentEvent;
    if (!eventData || eventData.status !== "active") {
      return `<div class="event-app-empty"><span class="event-app-logo">E</span><p class="eyebrow">JK.Games Events</p><h4>Aktuell ist kein Event gestartet.</h4><p>Hier werden Community-Events geplant und gestartet. Sobald ein Event aktiv ist, siehst du Aufgabe, Laufzeit, Preise, Teilnehmer und Gewinner direkt in dieser App.</p><div class="event-app-feature-grid"><span>🏆 Preise & Geschenke</span><span>⏱ Live-Laufzeit</span><span>👥 Online-Teilnehmer</span><span>✓ Gewinnerliste</span></div><button class="mini-button" data-event-refresh>Neu laden</button></div>`;
    }
    const active = eventIsActive(eventData);
    const winners = Array.isArray(eventData.winners) ? eventData.winners : [];
    const joined = !!currentParticipant;
    return `
      <div class="event-app-live ${active ? "active" : "waiting"}">
        <header><span class="event-app-logo">E</span><div><p class="eyebrow">${active ? "Live-Event" : "Geplantes Event"}</p><h4>${htmlEscape(eventData.title || "JK.Games Event")}</h4></div><b>${eventCountdownText(eventData)}</b></header>
        <p class="event-app-description">${htmlEscape(eventData.description || "")}</p>
        <section class="event-app-task"><small>DEINE AUFGABE</small><strong>${htmlEscape(eventData.task || "Warte auf die Aufgabenbeschreibung des Event-Teams.")}</strong>${eventData.proofHint ? `<p>${htmlEscape(eventData.proofHint)}</p>` : ""}</section>
        <section class="event-app-rewards"><h5>Belohnungen</h5><div>${eventData.rewardMoney ? `<span><b>${Number(eventData.rewardMoney).toLocaleString("de-DE")} €</b> Spielgeld</span>` : ""}${rewardItemsHtml(eventData.rewardItems)}<span><b>50 JK-Fragmente</b> Gewinnerbonus</span></div><small>${Math.max(1, Number(eventData.maxWinners || 1))} Gewinnerplatz/-plätze</small></section>
        <section class="event-app-meta"><span><small>Teilnehmer</small><b>${Number(eventData.participantCount || 0)}</b></span><span><small>Gewinner</small><b>${winners.length}</b></span><span><small>Status</small><b>${active ? "Läuft" : "Wartet"}</b></span></section>
        ${joined ? `<section class="event-app-progress"><b>Du nimmst teil</b><small>${htmlEscape(currentParticipant.statusText || "Noch kein Fortschritt gemeldet.")}</small><textarea data-event-progress maxlength="300" placeholder="Kurz beschreiben, was du erledigt hast …"></textarea><button class="mini-button gold" data-event-progress-send>Fortschritt senden</button></section>` : `<button class="mini-button gold event-join-button" data-event-join ${active ? "" : "disabled"}>${active ? "Am Event teilnehmen" : "Event startet später"}</button>`}
        ${winners.length ? `<section class="event-app-winners"><h5>Gewinner</h5>${winners.map((winner, index) => `<span><b>${index + 1}.</b> ${htmlEscape(winner.displayName || "Spieler")}</span>`).join("")}</section>` : ""}
        <button class="mini-button" data-event-refresh>Aktualisieren</button>
      </div>`;
  }

  function maybeGrantEventWinnerFragments(eventData) {
    if (!onlineUser || !eventData || !Array.isArray(eventData.winners)) return;
    const winner = eventData.winners.find((row) => String(row?.uid || row?.userId || row?.playerUid || row?.userUid || row?.targetUid || row?.id || "") === String(onlineUser.uid));
    if (!winner) return;
    const eventKey = `${String(eventData.title || "event").slice(0,60)}:${Number(eventData.startsAtMs || 0)}:${Number(eventData.endsAtMs || 0)}`;
    window.JKCoinApp?.addFragments?.(50, `Event-Gewinner · ${eventData.title || "JK.Games Event"}`, `event-winner:${eventKey}`);
  }

  async function loadOwnParticipant() {
    participantUnsubscribe?.();
    currentParticipant = null;
    if (!onlineUser || !currentEvent?.id) return;
    const fb = await loadOnlineFirebase();
    const ref = fb.doc(fb.db, "events", "current", "participants", onlineUser.uid);
    participantUnsubscribe = fb.onSnapshot(ref, (snapshot) => {
      currentParticipant = snapshot.exists() ? snapshot.data() : null;
      refreshOpenEventApp();
    }, (error) => handleServiceListenerError("Event participant", error, () => { participantUnsubscribe = null; }, () => loadOwnParticipant()));
  }

  async function startEventListener() {
    const fb = await loadOnlineFirebase();
    eventUnsubscribe?.();
    eventUnsubscribe = fb.onSnapshot(fb.doc(fb.db, "events", "current"), (snapshot) => {
      currentEvent = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
      maybeGrantEventWinnerFragments(currentEvent);
      loadOwnParticipant().catch(() => {});
      refreshOpenEventApp();
    }, (error) => handleServiceListenerError("Event", error, () => { eventUnsubscribe = null; }, () => startEventListener()));
  }

  function refreshOpenEventApp() {
    if (!document.querySelector('[data-device-app="event"].active')) return;
    const phone = typeof ownedPhoneItem === "function" ? ownedPhoneItem() : "";
    if (phone && typeof openDeviceInterface === "function") {
      pendingDeviceScrollTop = document.querySelector(".device-screen")?.scrollTop ?? null;
      openDeviceInterface(phone, "event", false);
    }
  }

  async function joinCurrentEvent() {
    if (!onlineUser) return requireUser();
    if (!eventIsActive()) return addFeed?.("Dieses Event ist noch nicht aktiv oder bereits beendet.");
    const fb = await loadOnlineFirebase();
    const displayName = onlineUser.displayName || `${state?.firstName || ""} ${state?.lastName || ""}`.trim() || "Spieler";
    await fb.setDoc(fb.doc(fb.db, "events", "current", "participants", onlineUser.uid), {
      uid: onlineUser.uid,
      displayName,
      displayNameLower: playerNameKey(displayName),
      joinedAtMs: Date.now(),
      updatedAtMs: Date.now(),
      status: "joined",
      statusText: "Teilnahme bestätigt"
    }, { merge: true });
    await fb.setDoc(fb.doc(fb.db, "events", "current"), { participantCount: fb.increment(1), updatedAtMs: Date.now() }, { merge: true }).catch(() => {});
  }

  async function sendEventProgress(text) {
    const clean = String(text || "").trim().slice(0, 300);
    if (!onlineUser || !currentParticipant || !clean) return;
    const fb = await loadOnlineFirebase();
    await fb.setDoc(fb.doc(fb.db, "events", "current", "participants", onlineUser.uid), {
      status: "submitted",
      statusText: clean,
      submittedAtMs: Date.now(),
      updatedAtMs: Date.now()
    }, { merge: true });
  }

  function bindEventApp(shell) {
    shell.querySelector("[data-event-login]")?.addEventListener("click", showAuthOverlay);
    shell.querySelectorAll("[data-event-refresh]").forEach((button) => button.addEventListener("click", () => startEventListener().catch((error) => addFeed?.(`Event konnte nicht geladen werden: ${error.message || error}`))));
    shell.querySelector("[data-event-join]")?.addEventListener("click", () => joinCurrentEvent().catch((error) => addFeed?.(`Event-Teilnahme fehlgeschlagen: ${error.message || error}`)));
    shell.querySelector("[data-event-progress-send]")?.addEventListener("click", () => sendEventProgress(shell.querySelector("[data-event-progress]")?.value).catch((error) => addFeed?.(`Fortschritt konnte nicht gesendet werden: ${error.message || error}`)));
  }

  function moderationOverlay() {
    let overlay = document.querySelector("[data-online-moderation-overlay]");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.className = "online-moderation-overlay";
    overlay.dataset.onlineModerationOverlay = "1";
    overlay.innerHTML = `<section><p class="eyebrow">JK.Games Moderation</p><h2 data-moderation-title>Zugriff eingeschränkt</h2><p data-moderation-text></p><button class="primary-button" data-moderation-logout>Abmelden</button></section>`;
    document.body.appendChild(overlay);
    overlay.querySelector("[data-moderation-logout]").addEventListener("click", async () => {
      const fb = await loadOnlineFirebase();
      await fb.signOut(fb.auth);
      overlay.classList.remove("show");
    });
    return overlay;
  }

  function renderModerationState(data = {}) {
    const now = Date.now();
    const bannedUntil = Number(data.bannedUntilMs || 0);
    const timeoutUntil = Number(data.timeoutUntilMs || 0);
    const kickNonce = Number(data.kickNonce || 0);
    const kickKey = onlineUser ? `lifebuilder-kick-nonce:${onlineUser.uid}` : "";
    const seenKick = Number(kickKey ? sessionStorage.getItem(kickKey) || 0 : 0);
    const overlay = moderationOverlay();
    if (bannedUntil > now) {
      overlay.querySelector("[data-moderation-title]").textContent = "Account vorübergehend gebannt";
      overlay.querySelector("[data-moderation-text]").textContent = `${data.reason || "Moderationsmaßnahme"} · Ende: ${new Date(bannedUntil).toLocaleString("de-DE")}`;
      overlay.classList.add("show");
      return;
    }
    if (kickNonce > seenKick && kickKey) {
      sessionStorage.setItem(kickKey, String(kickNonce));
      overlay.querySelector("[data-moderation-title]").textContent = "Du wurdest aus der Sitzung entfernt";
      overlay.querySelector("[data-moderation-text]").textContent = data.reason || "Bitte melde dich erneut an.";
      overlay.classList.add("show");
      return;
    }
    overlay.classList.remove("show");
    document.body.classList.toggle("online-timeout-active", timeoutUntil > now);
    let badge = document.querySelector("[data-timeout-badge]");
    if (timeoutUntil > now) {
      if (!badge) {
        badge = document.createElement("div");
        badge.className = "online-timeout-badge";
        badge.dataset.timeoutBadge = "1";
        document.body.appendChild(badge);
      }
      badge.textContent = `Timeout bis ${new Date(timeoutUntil).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`;
    } else badge?.remove();
  }

  async function startModerationListener() {
    if (!onlineUser) return;
    const fb = await loadOnlineFirebase();
    moderationUnsubscribe?.();
    moderationUnsubscribe = fb.onSnapshot(fb.doc(fb.db, "moderation", onlineUser.uid), (snapshot) => renderModerationState(snapshot.exists() ? snapshot.data() : {}), (error) => handleServiceListenerError("Moderation", error, () => { moderationUnsubscribe = null; }, () => startModerationListener()));
  }

  function startOnlineServices() {
    if (!onlineUser) return;
    if (onlineServicesUid === onlineUser.uid && heartbeatTimer) return;
    stopOnlineServices(false);
    onlineServicesUid = onlineUser.uid;
    heartbeatTimer = setInterval(() => {
      if (!document.hidden && navigator.onLine !== false) syncPlayerOnline().catch(() => {});
    }, HEARTBEAT_MS);
    syncPlayerOnline(true).catch(() => {});
    startCommandListener().catch(() => {});
    startEventListener().catch(() => {});
    startModerationListener().catch(() => {});
  }

  function stopOnlineServices(clearCurrent = true) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
    clearTimeout(playerSyncTimer);
    playerSyncTimer = null;
    commandsUnsubscribe?.(); commandsUnsubscribe = null;
    eventUnsubscribe?.(); eventUnsubscribe = null;
    participantUnsubscribe?.(); participantUnsubscribe = null;
    moderationUnsubscribe?.(); moderationUnsubscribe = null;
    serviceRestartTimers.forEach((timer) => clearTimeout(timer));
    serviceRestartTimers.clear();
    onlineServicesUid = "";
    if (clearCurrent) {
      currentEvent = null;
      currentParticipant = null;
    }
  }

  async function initializeAuthState() {
    try {
      const fb = await loadOnlineFirebase();
      fb.onAuthStateChanged(fb.auth, (user) => {
        cloudHydrationGeneration += 1;
        if (!user) {
          // Der generische lokale Slot bleibt beim normalen Abmelden erhalten.
          // Eine zusätzliche vollständige Kopie würde besonders auf iPhones
          // unnötig Speicher belegen. Erst bei einem echten UID-Wechsel wird
          // der vorherige Account separat gesichert.
          onlineUser = null;
          cloudSaveReadyUid = "";
          cloudHydrationUid = "";
          databaseReadyUid = "";
          databaseConnectionError = "";
          window.__lifeBuilderCloudReady = false;
          cloudSaveDirty = false;
          cloudSlotRevisions = [0, 0, 0, 0];
          cloudSlotLoaded = [false, false, false, false];
          cloudConflicts = [];
          clearTimeout(cloudSaveTimer);
          clearTimeout(databaseRetryTimer);
          databaseRetryTimer = null;
          updateOnlineStatusBadge();
          updateAuthOverlayState();
          stopOnlineServices();
          window.dispatchEvent(new CustomEvent("lifebuilder-online-user-ready", { detail: { user: null, uid: "" } }));
          return;
        }
        onlineUser = user;
        switchLocalAccount(user);
        updateOnlineStatusBadge();
        updateAuthOverlayState();
        resolvePendingAuth(user);
        window.dispatchEvent(new CustomEvent("lifebuilder-online-user-ready", { detail: { user, uid: user.uid, email: user.email || "" } }));
        scheduleDatabaseRetry(user, 0);
      });
    } catch (error) {
      console.warn("Firebase Auth konnte nicht geladen werden", error);
      updateOnlineStatusBadge();
    }
  }

  // Event-App in den App Store einfügen.
  if (!phoneAppStoreCatalog.some((app) => app.id === "event")) {
    phoneAppStoreCatalog.push({
      id: "event",
      label: "Event",
      icon: "E",
      minTier: 1,
      status: "available",
      description: "Live-Events, Aufgaben, Preise, Teilnehmer, Fortschritt und Gewinner werden online geladen."
    });
  }

  const basePhoneAppStoreHtml = phoneAppStoreHtml;
  phoneAppStoreHtml = function patchedPhoneAppStoreHtml(item) {
    return basePhoneAppStoreHtml(item).replace(
      /<p class="device-hint">Top Games, Finder\.KL[\s\S]*?<\/p>/,
      `<p class="device-hint">Top Games, Finder.KL, Finster.KL, Casino, Event, Tägliche Geschenke und Tägliche Quests erscheinen nach dem Download als eigene Apps unten im Handy.</p>`
    );
  };

  const baseDeviceAppsFor = deviceAppsFor;
  deviceAppsFor = function patchedDeviceAppsFor(item) {
    const apps = baseDeviceAppsFor(item);
    const isPhone = phoneItems().includes(item);
    if (!isPhone || !isPhoneAppInstalled("event") || apps.some((app) => app.id === "event")) return apps;
    const tier = deviceTier(item);
    const missingTier = tier < 1;
    const missingSim = !hasPhoneSim();
    apps.push({
      id: "event",
      min: 1,
      data: true,
      label: "Event",
      icon: "E",
      text: "Hier werden Events geplant und gestartet. Aufgaben, Geschenke, Geldpreise, Teilnehmer und Gewinner werden live online geladen.",
      layoutClass: "device-downloaded-app",
      locked: missingTier || missingSim,
      lockText: missingTier ? "Benötigt mindestens ein Einsteiger-Smartphone." : missingSim ? "Benötigt eine SIM-Karte für Online-Events." : ""
    });
    return apps;
  };

  const baseDeviceAppActions = deviceAppActions;
  deviceAppActions = function patchedDeviceAppActions(appId, item) {
    if (appId === "event") return eventAppHtml();
    return baseDeviceAppActions(appId, item);
  };

  const baseOpenDeviceInterface = openDeviceInterface;
  openDeviceInterface = function patchedOpenDeviceInterface(item, activeApp = "home", activeUse = true) {
    const result = baseOpenDeviceInterface(item, activeApp, activeUse);
    const shell = document.querySelector("#detailDialog .device-shell:last-of-type") || document.querySelector("#detailDialog .device-shell");
    if (shell && activeApp === "event") bindEventApp(shell);
    return result;
  };

  function cloudLoadGate() {
    let overlay = document.querySelector("[data-cloud-load-gate]");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.className = "cloud-load-gate";
    overlay.dataset.cloudLoadGate = "1";
    overlay.innerHTML = `<section><span class="cloud-load-spinner"></span><h2>Online-Spielstand wird geladen</h2><p data-cloud-load-text>Dein Online-Spielstand wird abgeglichen. Lokale Daten werden erst danach freigegeben.</p><div><button class="secondary-button" data-cloud-load-retry hidden>Erneut versuchen</button><button class="secondary-button" data-cloud-load-local hidden>Nur lokalen Stand öffnen</button></div></section>`;
    document.body.appendChild(overlay);
    return overlay;
  }

  async function selectSaveSlotAfterCloud(index, baseSelect) {
    if (!hostedOnlineMode || !onlineUser || (cloudSaveReadyUid === onlineUser.uid && window.__lifeBuilderCloudReady === true && cloudSlotLoaded[index])) {
      return baseSelect(index);
    }
    const gate = cloudLoadGate();
    gate.classList.add("show");
    const text = gate.querySelector("[data-cloud-load-text]");
    const retry = gate.querySelector("[data-cloud-load-retry]");
    const local = gate.querySelector("[data-cloud-load-local]");
    retry.hidden = true;
    local.hidden = true;
    text.textContent = "Der aktuelle Online-Spielstand wird geladen …";
    try {
      const fb = await loadOnlineFirebase();
      if (databaseReadyUid !== onlineUser.uid) await verifyOnlineDatabase(fb, onlineUser, true);
      await hydrateCloudSlots(onlineUser);
      gate.classList.remove("show");
      return baseSelect(index);
    } catch (error) {
      text.textContent = `Cloud-Spielstand konnte nicht geladen werden: ${databaseErrorText(error)}`;
      retry.hidden = false;
      local.hidden = false;
      retry.onclick = () => selectSaveSlotAfterCloud(index, baseSelect);
      local.onclick = () => {
        gate.classList.remove("show");
        baseSelect(index);
      };
    }
  }

  const baseSelectSaveSlot = selectSaveSlot;
  selectSaveSlot = function cloudAwareSelectSaveSlot(index) {
    return selectSaveSlotAfterCloud(Number(index), baseSelectSaveSlot);
  };

  const baseSave = save;
  save = function patchedSave(...args) {
    const result = baseSave.apply(this, args);
    if (!window.__lifeBuilderRemoteApplying) {
      schedulePlayerSync();
      scheduleCloudSave();
    }
    return result;
  };

  // GitHub/Firebase-Start erzwingt die Anmeldung. Lokale Dateien bleiben für Entwicklung nutzbar.
  els.openSlotsBtn?.addEventListener("click", (event) => {
    if (!onlineRequired()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    requireUser().then((user) => {
      if (!user) return;

      // Der Slot-Bildschirm öffnet direkt nach erfolgreicher Firebase-Anmeldung.
      // Firestore-Abgleich und Online-Synchronisierung laufen danach im Hintergrund.
      setSetupView("slots");
      if (databaseReadyUid === user.uid) {
        hydrateCloudSlots(user).catch((error) => handleCloudHydrationFailure(error, user));
        syncPlayerOnline(true).catch(() => {});
      } else {
        scheduleDatabaseRetry(user, 0);
      }
    }).catch(() => {});
  }, true);

  if (hostedOnlineMode && els.openSlotsBtn) els.openSlotsBtn.textContent = "Anmelden & Spiel starten";
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      schedulePlayerSync(100);
      scheduleDatabaseRetry(onlineUser, 250);
    } else {
      if (cloudSaveDirty) runCloudSave().catch(() => {});
      setPlayerOffline().catch(() => {});
    }
  });
  window.addEventListener("online", () => {
    scheduleDatabaseRetry(onlineUser, 100);
    scheduleCloudHydrationRetry(onlineUser, 450);
  });
  window.addEventListener("lifebuilder-firestore-recovered", () => {
    if (onlineUser && (cloudSaveReadyUid !== onlineUser.uid || window.__lifeBuilderCloudReady !== true)) scheduleCloudHydrationRetry(onlineUser, 180);
  });
  window.addEventListener("pagehide", () => {
    if (cloudSaveDirty) runCloudSave().catch(() => {});
    setPlayerOffline().catch(() => {});
  });

  window.LifeBuilderOnline = {
    requireUser,
    showLogin: showAuthOverlay,
    getUser: () => onlineUser,
    getFirebase: loadOnlineFirebase,
    verifyDatabase: (force = false) => verifyOnlineDatabase(null, onlineUser, force),
    isDatabaseReady: () => !!onlineUser && databaseReadyUid === onlineUser.uid,
    getDatabaseError: () => databaseConnectionError,
    recover: recoverOnlineConnection,
    syncPlayer: syncPlayerOnline,
    saveSlot: writeCloudSlot,
    deleteSlot: deleteCloudSlot,
    hydrateSlots: hydrateCloudSlots,
    checkAccountResetV180: () => onlineUser ? applyAccountResetV180IfNeeded(onlineUser) : Promise.resolve(false),
    checkPreparedResetV179: () => onlineUser ? applyAccountResetV180IfNeeded(onlineUser) : Promise.resolve(false),
    getCloudStatus: () => ({
      uid: onlineUser?.uid || "",
      ready: cloudSaveReadyUid === onlineUser?.uid && window.__lifeBuilderCloudReady === true,
      hydrating: window.__lifeBuilderCloudHydrating === true,
      revisions: [...cloudSlotRevisions],
      loadedSlots: [...cloudSlotLoaded],
      dirty: cloudSaveDirty,
      deviceId: deviceId(),
      accountUidKey: String(localStorage.getItem(ACCOUNT_UID_KEY) || ""),
      onlineEmail: onlineUser?.email || "",
      hydrationUid: cloudHydrationUid,
      hydrationGeneration: cloudHydrationGeneration
    }),
    getCurrentEvent: () => currentEvent,
    onlineWindowMs: ONLINE_WINDOW_MS
  };


  const moderationStyle = document.createElement("style");
  moderationStyle.textContent = `.online-moderation-overlay{position:fixed;inset:0;z-index:100050;display:none;place-items:center;padding:18px;background:rgba(0,0,0,.9);backdrop-filter:blur(10px)}.online-moderation-overlay.show{display:grid}.online-moderation-overlay section{width:min(520px,100%);padding:24px;border:1px solid rgba(255,115,105,.35);border-radius:20px;background:#14231d;color:#fff;text-align:center;box-shadow:0 30px 90px rgba(0,0,0,.55)}.online-timeout-badge{position:fixed;z-index:10000;right:14px;top:14px;padding:8px 12px;border-radius:999px;background:#7b311f;color:#fff;font-weight:900;box-shadow:0 10px 30px rgba(0,0,0,.35)}`;
  document.head.appendChild(moderationStyle);
  const onlineAuthFixStyle = document.createElement("style");
  onlineAuthFixStyle.textContent = `.online-auth-card [hidden],.online-auth-name[hidden]{display:none!important}.online-recovery-fab{position:fixed;z-index:100040;right:max(12px,env(safe-area-inset-right));bottom:max(14px,calc(env(safe-area-inset-bottom) + 10px));display:grid;gap:2px;max-width:min(280px,calc(100vw - 24px));padding:11px 14px;border:1px solid rgba(255,197,87,.42);border-radius:15px;background:linear-gradient(145deg,rgba(111,53,20,.97),rgba(33,24,17,.98));color:#fff;text-align:left;box-shadow:0 16px 45px rgba(0,0,0,.5);cursor:pointer}.online-recovery-fab[hidden]{display:none!important}.online-recovery-fab b{font-size:.79rem}.online-recovery-fab small{color:#f3d18a;font-size:.66rem}.online-recovery-fab.working{opacity:.78;pointer-events:none}`;
  document.head.appendChild(onlineAuthFixStyle);
  updateOnlineStatusBadge();
  initializeAuthState();
})();
