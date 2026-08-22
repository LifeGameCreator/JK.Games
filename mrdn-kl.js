(() => {
  "use strict";

  const AM_APP_ID = "aergermensch-kl";
  const AM_VERSION = "20260803-mrdn-v161-null-state-focus-fix";
  const AM_DATABASE_ID = "gamekl";
  const AM_COLLECTION = "angerMenschGames";
  const AM_MAX_LOG = 18;
  const AM_BOT_DELAY = 760;
  const AM_ROOM_SESSION_PREFIX = "lifebuilder-mrdn-room";
  const AM_OWNER_INGAME_KEY = "lifebuilder-mrdn-owner-ingame";
  const AM_BOARD_STYLES = new Set(["neon", "classic"]);

  // Firestore room creation rules intentionally allow only the established room fields.
  // The selected board is encoded in the already permitted version field until the
  // game starts, then it also lives inside gameState. This keeps old deployed rules
  // compatible and prevents "Missing or insufficient permissions" on room creation.
  function amEncodeRoomVersion(boardStyle = "neon") {
    const style = AM_BOARD_STYLES.has(boardStyle) ? boardStyle : "neon";
    return `${AM_VERSION}|board=${style}`;
  }

  function amRoomBoardStyle(room) {
    const direct = room?.boardStyle;
    if (AM_BOARD_STYLES.has(direct)) return direct;
    const gameStyle = room?.gameState?.boardStyle;
    if (AM_BOARD_STYLES.has(gameStyle)) return gameStyle;
    const match = String(room?.version || "").match(/(?:^|\|)board=(neon|classic)(?:\||$)/);
    return match?.[1] || "neon";
  }

  const AM_COLORS = [
    { id: "rot", label: "Rot", hex: "#ff4d5f", dark: "#7d1724", start: 0, base: [10.8, 10.8] },
    { id: "blau", label: "Blau", hex: "#4da3ff", dark: "#164c83", start: 10, base: [89.2, 10.8] },
    { id: "gelb", label: "Gelb", hex: "#ffd84d", dark: "#826b13", start: 20, base: [89.2, 89.2] },
    { id: "gruen", label: "Grün", hex: "#45d58a", dark: "#17643f", start: 30, base: [10.8, 89.2] }
  ];

  const AM_EXTRAS = [
    { id: "shield", cost: 1, icon: "◈", label: "Schutzschild", text: "Schützt eine eigene Figur bis zu deinem nächsten Zug vor Rauswurf und Extras.", target: "ownPawn" },
    { id: "reroll", cost: 2, icon: "↻", label: "Zweiter Wurf", text: "Vor dem Würfeln aktivieren: Der erste Wert wird verworfen und einmal neu gewürfelt.", target: "instant" },
    { id: "turbo", cost: 3, icon: "+2", label: "Turbo-Wurf", text: "Vor dem Würfeln aktivieren: Der nächste Würfelwert steigt um 2, höchstens auf 6.", target: "instant" },
    { id: "skip", cost: 4, icon: "Ⅱ", label: "Runde aussetzen", text: "Ein ausgewählter Gegner muss seinen nächsten Zug aussetzen.", target: "player" },
    { id: "reverse", cost: 5, icon: "⇤", label: "Rückwärtsgang", text: "Schiebt eine gegnerische Figur vier Felder zurück.", target: "enemyPawn" },
    { id: "swap", cost: 6, icon: "⇄", label: "Platztausch", text: "Tausche eine eigene Figur auf der Strecke mit einer gegnerischen Figur.", target: "swap" },
    { id: "sendhome", cost: 8, icon: "⌂", label: "Zurück ins Haus", text: "Schiebt eine gegnerische Figur direkt zurück in den Startbereich.", target: "enemyPawn" },
    { id: "wish", cost: 10, icon: "✦", label: "Wunschwurf", text: "Vor dem Würfeln auswählen: Bestimme den nächsten Würfelwert. Eine gewählte 6 gibt keinen Point.", target: "die" }
  ];

  const AM_BOT_NAMES = ["Mara Bot", "Kian Bot", "Nova Bot", "Rico Bot", "Lina Bot", "Tarek Bot"];

  const amRuntime = {
    view: "home",
    onlineDoc: null,
    onlineId: "",
    onlineUnsub: null,
    publicUnsub: null,
    publicRooms: [],
    firebasePromise: null,
    fb: null,
    overlay: null,
    pendingExtra: "",
    swapOwn: null,
    botTimer: null,
    autoResolveTimer: null,
    busy: false,
    appBusy: false,
    toastTimer: null,
    sideTab: "players",
    fullscreen: false,
    mobileSheetOpen: false,
    ownerPanelOpen: false,
    backgroundPaused: false,
    boardVisibleBeforeBackground: false,
    renderFrame: 0,
    lastRenderSignature: "",
    clickLockedUntil: 0
  };

  const amClone = (value) => typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

  const amEscape = (value) => typeof escapeHtml === "function"
    ? escapeHtml(value)
    : String(value ?? "").replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));

  function amStateRoot() {
    try {
      if (typeof state !== "undefined" && state && typeof state === "object") return state;
    } catch {}
    return null;
  }

  function amRootSave() {
    const root = amStateRoot();
    if (!root) return false;
    root.angerMensch ||= {};
    root.angerMensch.version = AM_VERSION;
    try { if (typeof save === "function") save(); } catch (error) { console.warn("MRDN.KL Speichern", error); }
    return true;
  }

  function amNormalizeLocalGame(game) {
    if (!game || typeof game !== "object" || !Array.isArray(game.players) || game.players.length < 2 || game.players.length > 4) return null;
    game.players = game.players.slice(0, 4).map((player, index) => ({
      id: String(player?.id || player?.uid || `player-${index}`),
      uid: String(player?.uid || player?.id || `player-${index}`),
      name: String(player?.name || (index ? `Bot ${index}` : "Du")).slice(0, 30),
      color: amPlayerColor(index).id,
      isBot: index === 0 ? false : player?.isBot !== false,
      points: Math.max(0, Math.min(999, Number(player?.points || 0))),
      skipTurns: Math.max(0, Math.min(2, Number(player?.skipTurns || 0)))
    }));
    game.pawns ||= {};
    game.players.forEach((player) => {
      const values = Array.isArray(game.pawns[player.id]) ? game.pawns[player.id].slice(0, 4) : [];
      while (values.length < 4) values.push(-1);
      game.pawns[player.id] = values.map((value) => Math.max(-1, Math.min(43, Number(value) || (Number(value) === 0 ? 0 : -1))));
    });
    game.turnIndex = Math.max(0, Math.min(game.players.length - 1, Number(game.turnIndex || 0)));
    game.turnCounter = Math.max(1, Number(game.turnCounter || 1));
    game.phase = ["roll", "move", "finished"].includes(game.phase) ? game.phase : "roll";
    game.status = ["playing", "finished"].includes(game.status) ? game.status : "playing";
    game.die = Math.max(0, Math.min(6, Number(game.die || 0)));
    game.naturalSix = !!game.naturalSix;
    game.usedExtraThisTurn = !!game.usedExtraThisTurn;
    game.queuedRollBoost = ["reroll", "turbo", "wish"].includes(game.queuedRollBoost) ? game.queuedRollBoost : "";
    game.queuedWishValue = Math.max(0, Math.min(6, Number(game.queuedWishValue || 0)));
    game.ownerForcedRolls = game.ownerForcedRolls && typeof game.ownerForcedRolls === "object" ? game.ownerForcedRolls : {};
    game.boardStyle = AM_BOARD_STYLES.has(game.boardStyle) ? game.boardStyle : "neon";
    game.shields = game.shields && typeof game.shields === "object" ? game.shields : {};
    game.log = Array.isArray(game.log) ? game.log.slice(0, AM_MAX_LOG).map(String) : ["Partie wiederhergestellt."];
    return game;
  }

  function amLocalGame() {
    const root = amStateRoot();
    if (!root) return null;
    root.angerMensch ||= {};
    const normalized = amNormalizeLocalGame(root.angerMensch.localGame);
    if (!normalized && root.angerMensch.localGame) {
      delete root.angerMensch.localGame;
      amRootSave();
    } else if (normalized) {
      root.angerMensch.localGame = normalized;
    }
    return normalized;
  }

  function amSetLocalGame(game) {
    const root = amStateRoot();
    if (!root) return false;
    root.angerMensch ||= {};
    root.angerMensch.localGame = game;
    amRootSave();
    return true;
  }

  function amCurrentGame() {
    // Während einer Online-Lobby darf niemals ein alter lokaler Bot-Spielstand
    // durchrutschen. Genau das konnte auf dem Handy eine unsichtbare Spielansicht
    // und den falschen Hinweis „Spiel beenden“ erzeugen.
    if (amRuntime.onlineDoc) return amRuntime.onlineDoc.gameState || null;
    return amLocalGame();
  }

  function amCurrentPlayers() {
    return amCurrentGame()?.players || [];
  }

  function amOwnUid() {
    try {
      return amRuntime.fb?.auth?.currentUser?.uid || amRuntime.onlineDoc?.viewerUid || "";
    } catch {
      return amRuntime.onlineDoc?.viewerUid || "";
    }
  }

  function amRoomSessionKey(uid = amOwnUid()) {
    return `${AM_ROOM_SESSION_PREFIX}:${String(uid || "guest")}`;
  }

  function amRememberRoom(code) {
    const normalized = String(code || "").trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(normalized)) return;
    try { sessionStorage.setItem(amRoomSessionKey(), normalized); } catch { /* optional browser memory */ }
  }

  function amForgetRoom() {
    try { sessionStorage.removeItem(amRoomSessionKey()); } catch { /* optional browser memory */ }
  }

  function amStoredRoom() {
    try {
      const value = String(sessionStorage.getItem(amRoomSessionKey()) || "").trim().toUpperCase();
      return /^[A-Z0-9]{6}$/.test(value) ? value : "";
    } catch {
      return "";
    }
  }

  function amOwnerAuthorized() {
    try { return !!window.LifeBuilderSettingsMenu?.isOwner?.(); }
    catch { return false; }
  }

  function amOwnerIngameStored() {
    try { return localStorage.getItem(AM_OWNER_INGAME_KEY) === "1"; }
    catch { return false; }
  }

  function amOwnerIngameVisible() {
    return amOwnerAuthorized() && !!amRuntime.ownerPanelOpen;
  }

  function amSetOwnerIngameVisible(value) {
    if (!amOwnerAuthorized()) return { ok: false, message: "Nur der Owner kann die Ingame-Steuerung anzeigen." };
    amRuntime.ownerPanelOpen = !!value;
    try { localStorage.setItem(AM_OWNER_INGAME_KEY, amRuntime.ownerPanelOpen ? "1" : "0"); } catch {}
    amRenderOverlay();
    return { ok: true, visible: amRuntime.ownerPanelOpen };
  }

  amRuntime.ownerPanelOpen = amOwnerIngameStored();

  function amOwnPlayerIndex(game = amCurrentGame()) {
    if (!game) return -1;
    if (!game.online) return 0;
    const uid = amRuntime.onlineDoc?.viewerUid || amOwnUid();
    return game.players.findIndex((player) => player.uid === uid);
  }

  function amOwnWon(game = amCurrentGame()) {
    const ownIndex = amOwnPlayerIndex(game);
    return ownIndex >= 0 && game?.status === "finished" && game?.winnerId === game.players?.[ownIndex]?.id;
  }

  function amRewardKey(game) {
    const scope = game?.online ? (amRuntime.onlineId || amRuntime.onlineDoc?.id || "online") : "local";
    return `${scope}:${Number(game?.createdAtMs || 0)}:${String(game?.winnerId || "")}`;
  }

  function amMaybeAwardWin(game = amCurrentGame()) {
    if (!amOwnWon(game) || typeof state === "undefined" || !state) return false;
    const key = amRewardKey(game);
    state.mrdnKlRewards ||= { seen: [] };
    const rewards = state.mrdnKlRewards;
    rewards.seen = Array.isArray(rewards.seen) ? rewards.seen : [];
    if (rewards.seen.includes(key)) return false;
    rewards.seen.push(key);
    rewards.seen = rewards.seen.slice(-100);

    const xp = 50;
    const prize = 250;
    if (typeof awardGameXp === "function") awardGameXp(xp, "MRDN.KL-Sieg");
    else if (typeof addXp === "function") addXp(xp, "MRDN.KL-Sieg");
    state.bank = Number(state.bank || 0) + prize;
    if (typeof improveMood === "function") improveMood(2, "MRDN.KL gewonnen");
    if (typeof addFeed === "function") addFeed(`MRDN.KL gewonnen: +${xp} EP und +${prize.toLocaleString("de-DE")} € auf dein Bankkonto.`);
    try { if (typeof save === "function") save(); } catch {}
    return true;
  }

  function amIsHost() {
    const uid = amOwnUid();
    return !!uid && amRuntime.onlineDoc?.hostUid === uid;
  }

  function amPlayerColor(index) {
    return AM_COLORS[index % AM_COLORS.length];
  }

  function amNewCode() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 6; i += 1) result += alphabet[Math.floor(Math.random() * alphabet.length)];
    return result;
  }

  function amPlayerDisplayName() {
    const fallback = `${state?.firstName || ""} ${state?.lastName || ""}`.trim() || "Spieler";
    try {
      return amRuntime.fb?.auth?.currentUser?.displayName || fallback;
    } catch {
      return fallback;
    }
  }

  function amCreatePlayers(total, online = false, humans = []) {
    const players = [];
    if (online) {
      humans.slice(0, total).forEach((human, index) => {
        players.push({
          id: human.uid,
          uid: human.uid,
          name: String(human.name || `Spieler ${index + 1}`).slice(0, 30),
          color: amPlayerColor(index).id,
          isBot: false,
          points: 0,
          skipTurns: 0
        });
      });
    } else {
      players.push({
        id: "local-human",
        uid: "local-human",
        name: `${state?.firstName || "Du"}`.trim() || "Du",
        color: AM_COLORS[0].id,
        isBot: false,
        points: 0,
        skipTurns: 0
      });
    }
    while (players.length < total) {
      const index = players.length;
      players.push({
        id: `bot-${Date.now()}-${index}`,
        uid: `bot-${index}`,
        name: AM_BOT_NAMES[(index - (online ? humans.length : 1) + AM_BOT_NAMES.length) % AM_BOT_NAMES.length],
        color: amPlayerColor(index).id,
        isBot: true,
        points: 0,
        skipTurns: 0
      });
    }
    return players;
  }

  function amCreateGame(players, online = false, boardStyle = "neon") {
    const pawns = {};
    players.forEach((player) => { pawns[player.id] = [-1, -1, -1, -1]; });
    return {
      version: AM_VERSION,
      online,
      status: "playing",
      players,
      pawns,
      turnIndex: 0,
      turnCounter: 1,
      phase: "roll",
      die: 0,
      naturalSix: false,
      usedExtraThisTurn: false,
      queuedRollBoost: "",
      queuedWishValue: 0,
      ownerForcedRolls: {},
      boardStyle: AM_BOARD_STYLES.has(boardStyle) ? boardStyle : "neon",
      shields: {},
      winnerId: "",
      winnerName: "",
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
      log: [`${players[0]?.name || "Spieler"} beginnt.`]
    };
  }

  function amLog(game, text) {
    game.log = [String(text), ...(game.log || [])].slice(0, AM_MAX_LOG);
    game.updatedAtMs = Date.now();
  }

  function amPawnKey(playerIndex, pawnIndex) {
    return `${playerIndex}:${pawnIndex}`;
  }

  function amBoardStartIndex(playerIndex, game = amCurrentGame()) {
    const base = amPlayerColor(playerIndex).start;
    // Beim klassischen Brett liegt das Startfeld im Original jeweils ein Feld
    // vor der bisherigen Markierung. Der Neon-Ring bleibt unverändert.
    return (base + (game?.boardStyle === "classic" ? 39 : 0)) % 40;
  }

  function amGlobalTrackIndex(playerIndex, progress, game = amCurrentGame()) {
    return (amBoardStartIndex(playerIndex, game) + Number(progress || 0) + 40) % 40;
  }

  function amShieldActive(game, playerIndex, pawnIndex) {
    const until = Number(game.shields?.[amPawnKey(playerIndex, pawnIndex)] || 0);
    return until > Number(game.turnCounter || 0);
  }

  function amCleanupEffects(game) {
    game.shields ||= {};
    Object.keys(game.shields).forEach((key) => {
      if (Number(game.shields[key] || 0) <= Number(game.turnCounter || 0)) delete game.shields[key];
    });
  }

  function amTrackOccupant(game, globalIndex, exclude = null) {
    for (let p = 0; p < game.players.length; p += 1) {
      const list = game.pawns[game.players[p].id] || [];
      for (let i = 0; i < list.length; i += 1) {
        if (exclude && exclude[0] === p && exclude[1] === i) continue;
        const progress = Number(list[i]);
        if (progress >= 0 && progress < 40 && amGlobalTrackIndex(p, progress, game) === globalIndex) {
          return { playerIndex: p, pawnIndex: i, progress };
        }
      }
    }
    return null;
  }

  function amOwnPawnAtProgress(game, playerIndex, progress, excludePawn = -1) {
    const list = game.pawns[game.players[playerIndex].id] || [];
    return list.findIndex((value, index) => index !== excludePawn && Number(value) === Number(progress));
  }

  function amCanMovePawn(game, playerIndex, pawnIndex, dieValue = game.die) {
    const player = game.players[playerIndex];
    if (!player || dieValue < 1 || dieValue > 6) return false;
    const pawns = game.pawns[player.id] || [];
    const progress = Number(pawns[pawnIndex]);

    if (progress < 0) {
      if (dieValue !== 6) return false;
      if (amOwnPawnAtProgress(game, playerIndex, 0) >= 0) return false;
      const occupant = amTrackOccupant(game, amGlobalTrackIndex(playerIndex, 0, game));
      if (occupant && occupant.playerIndex !== playerIndex && amShieldActive(game, occupant.playerIndex, occupant.pawnIndex)) return false;
      return true;
    }

    const target = progress + dieValue;
    if (target > 43) return false;
    if (amOwnPawnAtProgress(game, playerIndex, target, pawnIndex) >= 0) return false;

    if (target >= 40) {
      for (let step = Math.max(40, progress + 1); step <= target; step += 1) {
        if (amOwnPawnAtProgress(game, playerIndex, step, pawnIndex) >= 0) return false;
      }
      return true;
    }

    const targetGlobal = amGlobalTrackIndex(playerIndex, target, game);
    const occupant = amTrackOccupant(game, targetGlobal, [playerIndex, pawnIndex]);
    if (occupant?.playerIndex === playerIndex) return false;
    if (occupant && amShieldActive(game, occupant.playerIndex, occupant.pawnIndex)) return false;
    return true;
  }

  function amLegalMoves(game, playerIndex = game.turnIndex, dieValue = game.die) {
    const player = game.players[playerIndex];
    if (!player) return [];
    const pawns = game.pawns[player.id] || [];
    let legal = pawns.map((_, pawnIndex) => pawnIndex).filter((pawnIndex) => amCanMovePawn(game, playerIndex, pawnIndex, dieValue));

    if (dieValue === 6) {
      const basePawns = pawns.map((progress, index) => ({ progress, index })).filter((entry) => Number(entry.progress) < 0);
      if (basePawns.length) {
        const startPawn = pawns.findIndex((progress) => Number(progress) === 0);
        const baseLegal = basePawns.map((entry) => entry.index).filter((pawnIndex) => legal.includes(pawnIndex));
        if (baseLegal.length) return baseLegal;
        if (startPawn >= 0 && legal.includes(startPawn)) return [startPawn];
      }
    }
    return legal;
  }

  function amCaptureAt(game, movingPlayerIndex, pawnIndex, targetProgress) {
    if (targetProgress < 0 || targetProgress >= 40) return null;
    const global = amGlobalTrackIndex(movingPlayerIndex, targetProgress, game);
    const occupant = amTrackOccupant(game, global, [movingPlayerIndex, pawnIndex]);
    if (!occupant || occupant.playerIndex === movingPlayerIndex) return null;
    if (amShieldActive(game, occupant.playerIndex, occupant.pawnIndex)) return null;
    const enemy = game.players[occupant.playerIndex];
    game.pawns[enemy.id][occupant.pawnIndex] = -1;
    delete game.shields[amPawnKey(occupant.playerIndex, occupant.pawnIndex)];
    return enemy;
  }

  function amHasWon(game, playerIndex) {
    const player = game.players[playerIndex];
    return (game.pawns[player.id] || []).every((progress) => Number(progress) >= 40);
  }

  function amAdvanceTurn(game) {
    game.die = 0;
    game.naturalSix = false;
    game.phase = "roll";
    game.usedExtraThisTurn = false;
    game.queuedRollBoost = "";
    game.queuedWishValue = 0;
    game.turnCounter = Number(game.turnCounter || 0) + 1;
    let guard = 0;
    do {
      game.turnIndex = (Number(game.turnIndex || 0) + 1) % game.players.length;
      const next = game.players[game.turnIndex];
      if (Number(next.skipTurns || 0) > 0) {
        next.skipTurns -= 1;
        amLog(game, `${next.name} setzt eine Runde aus.`);
        game.turnCounter += 1;
      } else {
        break;
      }
      guard += 1;
    } while (guard < game.players.length * 2);
    amCleanupEffects(game);
  }

  function amRollMutation(game, forcedRoll = null, isWish = false) {
    if (game.status !== "playing" || game.phase !== "roll") return { ok: false, message: "Jetzt kann nicht gewürfelt werden." };
    const player = game.players[game.turnIndex];
    if (!player) return { ok: false, message: "Aktiver Spieler fehlt." };

    game.ownerForcedRolls ||= {};
    const ownerForced = Math.max(0, Math.min(6, Number(game.ownerForcedRolls[player.id] || 0)));
    if (ownerForced) delete game.ownerForcedRolls[player.id];

    const queued = game.queuedRollBoost || "";
    const baseRoll = Math.max(1, Math.min(6, Number(forcedRoll || Math.floor(Math.random() * 6) + 1)));
    let die = ownerForced || baseRoll;
    let naturalSource = !isWish && !ownerForced;

    if (!ownerForced && queued === "reroll") {
      const secondRoll = Math.floor(Math.random() * 6) + 1;
      die = secondRoll;
      naturalSource = true;
      amLog(game, `${player.name} verwirft die ${baseRoll} und würfelt erneut eine ${secondRoll}.`);
    } else if (!ownerForced && queued === "turbo") {
      die = Math.min(6, baseRoll + 2);
      naturalSource = false;
      amLog(game, `${player.name} aktiviert den Turbo-Wurf: ${baseRoll} + 2 = ${die}.`);
    } else if (!ownerForced && queued === "wish") {
      die = Math.max(1, Math.min(6, Number(game.queuedWishValue || 1)));
      naturalSource = false;
      amLog(game, `${player.name} nutzt den Wunschwurf und erhält eine ${die}.`);
    } else if (ownerForced) {
      naturalSource = true;
      amLog(game, `${player.name} würfelt eine ${die}.`);
    }

    game.queuedRollBoost = "";
    game.queuedWishValue = 0;
    game.die = die;
    game.phase = "move";
    game.naturalSix = die === 6 && naturalSource;

    if (game.naturalSix) {
      player.points = Math.min(999, Number(player.points || 0) + 1);
      amLog(game, `${player.name} würfelt eine 6 und erhält 1 Point.`);
    } else if (!queued && !ownerForced) {
      amLog(game, `${player.name} würfelt eine ${die}.`);
    }

    const legal = amLegalMoves(game, game.turnIndex, die);
    if (!legal.length) {
      amLog(game, `${player.name} kann mit der ${die} keine Figur ziehen.`);
      if (game.naturalSix) {
        game.phase = "roll";
        game.die = 0;
        game.naturalSix = false;
        amLog(game, `${player.name} darf wegen der 6 erneut würfeln.`);
      } else {
        amAdvanceTurn(game);
      }
      return { ok: true, die, autoPassed: true };
    }

    return { ok: true, die };
  }

  function amMoveMutation(game, pawnIndex) {
    if (game.status !== "playing" || game.phase !== "move") return { ok: false, message: "Würfle zuerst." };
    const playerIndex = game.turnIndex;
    const player = game.players[playerIndex];
    if (!amLegalMoves(game, playerIndex).includes(Number(pawnIndex))) return { ok: false, message: "Diese Figur kann mit dem aktuellen Wurf nicht ziehen." };
    const list = game.pawns[player.id];
    const before = Number(list[pawnIndex]);
    const target = before < 0 ? 0 : before + Number(game.die || 0);
    const captured = amCaptureAt(game, playerIndex, Number(pawnIndex), target);
    list[pawnIndex] = target;
    delete game.shields[amPawnKey(playerIndex, Number(pawnIndex))];

    if (captured) amLog(game, `${player.name} wirft ${captured.name} raus.`);
    if (target >= 40) amLog(game, `${player.name} bringt eine Figur ins Ziel.`);
    else if (!captured) amLog(game, `${player.name} zieht ${game.die} Felder.`);

    if (amHasWon(game, playerIndex)) {
      game.status = "finished";
      game.winnerId = player.id;
      game.winnerName = player.name;
      game.phase = "finished";
      game.die = 0;
      amLog(game, `${player.name} gewinnt MRDN.KL!`);
      return { ok: true, won: true };
    }

    if (game.naturalSix) {
      game.phase = "roll";
      game.die = 0;
      game.naturalSix = false;
      amLog(game, `${player.name} darf wegen der 6 noch einmal würfeln.`);
      amCleanupEffects(game);
    } else {
      amAdvanceTurn(game);
    }
    return { ok: true };
  }

  function amEndTurnMutation(game) {
    if (game.status !== "playing" || game.phase !== "move") return { ok: false };
    const player = game.players[game.turnIndex];
    if (amLegalMoves(game).length) return { ok: false, message: "Du hast noch einen gültigen Zug." };
    amLog(game, `${player.name} kann nicht ziehen.`);
    if (game.naturalSix) {
      game.phase = "roll";
      game.die = 0;
      game.naturalSix = false;
      amLog(game, `${player.name} darf wegen der 6 erneut würfeln.`);
    } else {
      amAdvanceTurn(game);
    }
    return { ok: true };
  }

  function amExtraById(extraId) {
    return AM_EXTRAS.find((entry) => entry.id === extraId) || null;
  }

  function amCanUseExtra(game, extraId) {
    const extra = amExtraById(extraId);
    const player = game.players[game.turnIndex];
    if (!extra || !player || game.status !== "playing" || game.usedExtraThisTurn) return false;
    if (game.phase !== "roll") return false;
    if (Number(player.points || 0) < extra.cost) return false;
    if (["reroll", "turbo", "wish"].includes(extraId) && game.queuedRollBoost) return false;
    return true;
  }

  function amChargeExtra(game, extraId) {
    const extra = amExtraById(extraId);
    const player = game.players[game.turnIndex];
    if (!amCanUseExtra(game, extraId)) return false;
    player.points -= extra.cost;
    game.usedExtraThisTurn = true;
    return true;
  }

  function amExtraMutation(game, extraId, payload = {}) {
    const extra = amExtraById(extraId);
    const actorIndex = game.turnIndex;
    const actor = game.players[actorIndex];
    if (!extra || !amCanUseExtra(game, extraId)) return { ok: false, message: "Dieses Extra ist gerade nicht verfügbar." };

    if (extraId === "reroll") {
      if (!amChargeExtra(game, extraId)) return { ok: false };
      game.queuedRollBoost = "reroll";
      game.queuedWishValue = 0;
      amLog(game, `${actor.name} bereitet einen zweiten Würfelwurf vor.`);
      return { ok: true };
    }

    if (extraId === "turbo") {
      if (!amChargeExtra(game, extraId)) return { ok: false };
      game.queuedRollBoost = "turbo";
      game.queuedWishValue = 0;
      amLog(game, `${actor.name} bereitet einen Turbo-Wurf vor.`);
      return { ok: true };
    }

    if (extraId === "wish") {
      const value = Math.max(1, Math.min(6, Number(payload.value || 0)));
      if (!value) return { ok: false };
      if (!amChargeExtra(game, extraId)) return { ok: false };
      game.queuedRollBoost = "wish";
      game.queuedWishValue = value;
      amLog(game, `${actor.name} legt den nächsten Wurf auf ${value} fest.`);
      return { ok: true };
    }

    if (extraId === "skip") {
      const targetIndex = Number(payload.playerIndex);
      const target = game.players[targetIndex];
      if (!target || targetIndex === actorIndex) return { ok: false, message: "Wähle einen Gegner." };
      if (!amChargeExtra(game, extraId)) return { ok: false };
      target.skipTurns = Math.min(2, Number(target.skipTurns || 0) + 1);
      amLog(game, `${actor.name} lässt ${target.name} eine Runde aussetzen.`);
      return { ok: true };
    }

    if (["shield", "reverse", "sendhome"].includes(extraId)) {
      const targetPlayerIndex = Number(payload.playerIndex);
      const pawnIndex = Number(payload.pawnIndex);
      const targetPlayer = game.players[targetPlayerIndex];
      const progress = Number(game.pawns[targetPlayer?.id]?.[pawnIndex]);
      if (!targetPlayer || !Number.isInteger(pawnIndex)) return { ok: false };

      if (extraId === "shield") {
        if (targetPlayerIndex !== actorIndex || progress < 0 || progress >= 40) return { ok: false, message: "Wähle eine eigene Figur auf der Strecke." };
        if (!amChargeExtra(game, extraId)) return { ok: false };
        game.shields[amPawnKey(targetPlayerIndex, pawnIndex)] = Number(game.turnCounter || 0) + game.players.length;
        amLog(game, `${actor.name} schützt eine Figur bis zum nächsten Zug.`);
        return { ok: true };
      }

      if (targetPlayerIndex === actorIndex || progress < 0 || progress >= 40) return { ok: false, message: "Wähle eine gegnerische Figur auf der Strecke." };
      if (amShieldActive(game, targetPlayerIndex, pawnIndex)) return { ok: false, message: "Diese Figur ist geschützt." };

      if (extraId === "reverse") {
        const targetProgress = progress - 4;
        if (targetProgress >= 0 && amOwnPawnAtProgress(game, targetPlayerIndex, targetProgress, pawnIndex) >= 0) return { ok: false, message: "Das Zielfeld ist durch eine eigene Figur blockiert." };
        if (targetProgress >= 0) {
          const occupied = amTrackOccupant(game, amGlobalTrackIndex(targetPlayerIndex, targetProgress, game), [targetPlayerIndex, pawnIndex]);
          if (occupied) return { ok: false, message: "Das Zielfeld ist bereits besetzt." };
        }
        if (!amChargeExtra(game, extraId)) return { ok: false };
        game.pawns[targetPlayer.id][pawnIndex] = targetProgress < 0 ? -1 : targetProgress;
        delete game.shields[amPawnKey(targetPlayerIndex, pawnIndex)];
        amLog(game, `${actor.name} schiebt ${targetPlayer.name} vier Felder zurück.`);
        return { ok: true };
      }

      if (extraId === "sendhome") {
        if (!amChargeExtra(game, extraId)) return { ok: false };
        game.pawns[targetPlayer.id][pawnIndex] = -1;
        delete game.shields[amPawnKey(targetPlayerIndex, pawnIndex)];
        amLog(game, `${actor.name} schiebt eine Figur von ${targetPlayer.name} zurück ins Haus.`);
        return { ok: true };
      }
    }

    if (extraId === "swap") {
      const ownPawnIndex = Number(payload.ownPawnIndex);
      const enemyPlayerIndex = Number(payload.enemyPlayerIndex);
      const enemyPawnIndex = Number(payload.enemyPawnIndex);
      const ownProgress = Number(game.pawns[actor.id]?.[ownPawnIndex]);
      const enemy = game.players[enemyPlayerIndex];
      const enemyProgress = Number(game.pawns[enemy?.id]?.[enemyPawnIndex]);
      if (!enemy || enemyPlayerIndex === actorIndex || ownProgress < 0 || ownProgress >= 40 || enemyProgress < 0 || enemyProgress >= 40) return { ok: false, message: "Für den Tausch müssen beide Figuren auf der Strecke stehen." };
      if (amShieldActive(game, enemyPlayerIndex, enemyPawnIndex)) return { ok: false, message: "Die gegnerische Figur ist geschützt." };
      const ownGlobal = amGlobalTrackIndex(actorIndex, ownProgress, game);
      const enemyGlobal = amGlobalTrackIndex(enemyPlayerIndex, enemyProgress, game);
      const newOwnProgress = (enemyGlobal - amPlayerColor(actorIndex).start + 40) % 40;
      const newEnemyProgress = (ownGlobal - amPlayerColor(enemyPlayerIndex).start + 40) % 40;
      if (newOwnProgress >= 40 || newEnemyProgress >= 40) return { ok: false };
      if (!amChargeExtra(game, extraId)) return { ok: false };
      game.pawns[actor.id][ownPawnIndex] = newOwnProgress;
      game.pawns[enemy.id][enemyPawnIndex] = newEnemyProgress;
      delete game.shields[amPawnKey(actorIndex, ownPawnIndex)];
      delete game.shields[amPawnKey(enemyPlayerIndex, enemyPawnIndex)];
      amLog(game, `${actor.name} tauscht den Platz mit ${enemy.name}.`);
      return { ok: true };
    }

    return { ok: false };
  }

  async function amFirebase() {
    if (amRuntime.firebasePromise) return amRuntime.firebasePromise;
    amRuntime.firebasePromise = (async () => {
      let runtime;
      if (typeof loadFirebasePhoneRuntime === "function") runtime = await loadFirebasePhoneRuntime();
      else {
        if (!window.LifeBuilderFirebaseCore?.load) throw new Error("Zentrale Firebase-Laufzeit wurde nicht geladen.");
        runtime = await window.LifeBuilderFirebaseCore.load();
      }
      amRuntime.fb = runtime;
      return runtime;
    })().catch((error) => {
      amRuntime.firebasePromise = null;
      throw error;
    });
    return amRuntime.firebasePromise;
  }

  function amRequireOnlineUser(fb) {
    const user = fb.auth.currentUser;
    if (!user) throw new Error("Bitte melde dich zuerst mit deinem JK.Games-Account an.");
    return user;
  }

  async function amMutate(mutator) {
    if (amRuntime.busy) return { ok: false, message: "Aktion läuft bereits." };
    amRuntime.busy = true;
    try {
      if (!amRuntime.onlineId) {
        const current = amLocalGame();
        if (!current) return { ok: false, message: "Kein Spiel aktiv." };
        const next = amClone(current);
        const result = mutator(next) || { ok: true };
        if (result.ok !== false) {
          next.updatedAtMs = Date.now();
          amSetLocalGame(next);
          amMaybeAwardWin(next);
          amRenderAll();
          amScheduleBot();
        }
        if (result.message) amToast(result.message);
        return result;
      }

      const fb = await amFirebase();
      const user = amRequireOnlineUser(fb);
      const ref = fb.doc(fb.db, AM_COLLECTION, amRuntime.onlineId);
      let mutationResult = { ok: false };
      await fb.runTransaction(fb.db, async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists()) throw new Error("Der Raum existiert nicht mehr.");
        const data = snapshot.data();
        const game = amClone(data.gameState);
        const current = game.players[game.turnIndex];
        const mayAct = current?.uid === user.uid || (current?.isBot && data.hostUid === user.uid);
        if (!mayAct) throw new Error("Du bist gerade nicht am Zug.");
        mutationResult = mutator(game) || { ok: true };
        if (mutationResult.ok === false) return;
        game.updatedAtMs = Date.now();
        transaction.update(ref, {
          gameState: game,
          status: game.status,
          winnerName: game.winnerName || "",
          updatedAtMs: Date.now()
        });
      });
      if (mutationResult.message) amToast(mutationResult.message);
      return mutationResult;
    } catch (error) {
      const message = String(error?.message || error || "Online-Aktion fehlgeschlagen.");
      amToast(message);
      return { ok: false, message };
    } finally {
      amRuntime.busy = false;
    }
  }

  async function amOwnerMutate(mutator) {
    if (!amOwnerAuthorized()) return { ok: false, message: "Diese Funktion ist ausschließlich für den Owner freigeschaltet." };
    if (amRuntime.busy) return { ok: false, message: "Aktion läuft bereits." };
    amRuntime.busy = true;
    try {
      if (!amRuntime.onlineId) {
        const current = amLocalGame();
        if (!current) throw new Error("Aktuell läuft keine MRDN.KL-Partie.");
        const next = amClone(current);
        const result = mutator(next) || { ok: true };
        if (result.ok === false) return result;
        next.updatedAtMs = Date.now();
        amSetLocalGame(next);
        amRenderAll();
        amScheduleBot();
        return result;
      }

      const fb = await amFirebase();
      amRequireOnlineUser(fb);
      const ref = fb.doc(fb.db, AM_COLLECTION, amRuntime.onlineId);
      let result = { ok: false };
      await fb.runTransaction(fb.db, async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists()) throw new Error("Der Online-Raum existiert nicht mehr.");
        const room = snapshot.data();
        const game = amClone(room.gameState);
        if (!game) throw new Error("Die Online-Partie wurde noch nicht gestartet.");
        result = mutator(game) || { ok: true };
        if (result.ok === false) return;
        game.updatedAtMs = Date.now();
        transaction.update(ref, { gameState: game, updatedAtMs: Date.now() });
        amRuntime.onlineDoc = { id: snapshot.id, viewerUid: amOwnUid(), ...room, gameState: game, updatedAtMs: Date.now() };
      });
      amRenderAll();
      amScheduleBot();
      return result;
    } catch (error) {
      return { ok: false, message: String(error?.message || error) };
    } finally {
      amRuntime.busy = false;
    }
  }

  function amOwnerSnapshot() {
    const game = amCurrentGame();
    if (!game) return { active: false, roomId: amRuntime.onlineId || "", players: [], ingameVisible: amOwnerIngameVisible(), boardStyle: "neon" };
    return {
      active: true,
      online: !!game.online,
      roomId: amRuntime.onlineId || "",
      status: game.status,
      phase: game.phase,
      boardStyle: game.boardStyle || "neon",
      ingameVisible: amOwnerIngameVisible(),
      turnIndex: Number(game.turnIndex || 0),
      turnPlayerId: game.players[game.turnIndex]?.id || "",
      players: game.players.map((player, index) => ({
        id: player.id,
        uid: player.uid,
        name: player.name,
        isBot: !!player.isBot,
        points: Number(player.points || 0),
        forcedRoll: Number(game.ownerForcedRolls?.[player.id] || 0),
        isTurn: index === game.turnIndex
      }))
    };
  }

  function amOwnerGrantPoints(playerId, amount) {
    const value = Math.max(-100, Math.min(100, Math.trunc(Number(amount || 0))));
    if (!value) return Promise.resolve({ ok: false, message: "Die Point-Änderung darf nicht 0 sein." });
    return amOwnerMutate((game) => {
      const player = game.players.find((entry) => entry.id === playerId || entry.uid === playerId);
      if (!player) return { ok: false, message: "Spieler wurde nicht gefunden." };
      const before = Number(player.points || 0);
      player.points = Math.max(0, Math.min(999, before + value));
      const change = player.points - before;
      return { ok: true, message: `${player.name}: ${change >= 0 ? "+" : ""}${change} Points` };
    });
  }

  function amOwnerSetNextRoll(playerId, value) {
    const raw = Math.floor(Number(value || 0));
    const die = raw <= 0 ? 0 : Math.max(1, Math.min(6, raw));
    return amOwnerMutate((game) => {
      const player = game.players.find((entry) => entry.id === playerId || entry.uid === playerId);
      if (!player) return { ok: false, message: "Spieler wurde nicht gefunden." };
      game.ownerForcedRolls ||= {};
      if (!die) {
        delete game.ownerForcedRolls[player.id];
        return { ok: true, message: `${player.name}: Owner-Würfel entfernt.` };
      }
      game.ownerForcedRolls[player.id] = die;
      return { ok: true, message: `${player.name} würfelt beim nächsten Wurf eine ${die}.` };
    });
  }

  function amCurrentCanAct(game = amCurrentGame()) {
    if (!game || game.status !== "playing") return false;
    const current = game.players[game.turnIndex];
    if (!game.online) return !current?.isBot;
    return current?.uid === amOwnUid();
  }

  function amMoveScore(game, playerIndex, pawnIndex, dieValue = game.die) {
    const player = game.players[playerIndex];
    const progress = Number(game.pawns[player.id][pawnIndex]);
    const target = progress < 0 ? 0 : progress + dieValue;
    let score = target * 1.5;
    if (progress < 0) score += 34;
    if (target >= 40) score += 68 + target * 2;
    if (target >= 0 && target < 40) {
      const occupant = amTrackOccupant(game, amGlobalTrackIndex(playerIndex, target, game), [playerIndex, pawnIndex]);
      if (occupant && occupant.playerIndex !== playerIndex) score += 110 + Number(game.pawns[game.players[occupant.playerIndex].id][occupant.pawnIndex] || 0);
      if (game.players.some((_, startPlayerIndex) => amBoardStartIndex(startPlayerIndex, game) === amGlobalTrackIndex(playerIndex, target, game))) score += 9;
      const threatened = game.players.some((enemy, enemyIndex) => {
        if (enemyIndex === playerIndex) return false;
        return (game.pawns[enemy.id] || []).some((enemyProgress) => {
          if (enemyProgress < 0 || enemyProgress >= 40) return false;
          const distance = (amGlobalTrackIndex(playerIndex, target, game) - amGlobalTrackIndex(enemyIndex, enemyProgress, game) + 40) % 40;
          return distance >= 1 && distance <= 6;
        });
      });
      if (threatened) score -= 14;
    }
    return score + Math.random() * 3;
  }

  function amBestMove(game, playerIndex = game.turnIndex, dieValue = game.die) {
    const legal = amLegalMoves(game, playerIndex, dieValue);
    if (!legal.length) return -1;
    return legal.map((pawnIndex) => ({ pawnIndex, score: amMoveScore(game, playerIndex, pawnIndex, dieValue) }))
      .sort((a, b) => b.score - a.score)[0].pawnIndex;
  }

  function amLeadingEnemyIndex(game, botIndex) {
    return game.players.map((player, index) => ({
      index,
      score: index === botIndex ? -1 : (game.pawns[player.id] || []).reduce((sum, progress) => sum + Math.max(0, Number(progress)), 0)
    })).sort((a, b) => b.score - a.score)[0]?.index ?? -1;
  }

  function amAdvancedEnemyPawn(game, botIndex) {
    let best = null;
    game.players.forEach((player, playerIndex) => {
      if (playerIndex === botIndex) return;
      (game.pawns[player.id] || []).forEach((progress, pawnIndex) => {
        if (progress >= 0 && progress < 40 && !amShieldActive(game, playerIndex, pawnIndex)) {
          if (!best || progress > best.progress) best = { playerIndex, pawnIndex, progress };
        }
      });
    });
    return best;
  }


  function amBestWishChoice(game, playerIndex) {
    let best = null;
    for (let die = 1; die <= 6; die += 1) {
      const pawnIndex = amBestMove(game, playerIndex, die);
      if (pawnIndex < 0) continue;
      const player = game.players[playerIndex];
      const before = Number(game.pawns[player.id][pawnIndex]);
      const target = before < 0 ? 0 : before + die;
      const score = amMoveScore(game, playerIndex, pawnIndex, die) + (target >= 40 ? 80 : 0);
      if (!best || score > best.score) best = { die, pawnIndex, score, target };
    }
    return best;
  }

  function amBestSwapChoice(game, playerIndex) {
    const player = game.players[playerIndex];
    let best = null;
    (game.pawns[player.id] || []).forEach((ownProgress, ownPawnIndex) => {
      if (ownProgress < 0 || ownProgress >= 40) return;
      const ownGlobal = amGlobalTrackIndex(playerIndex, ownProgress, game);
      game.players.forEach((enemy, enemyPlayerIndex) => {
        if (enemyPlayerIndex === playerIndex) return;
        (game.pawns[enemy.id] || []).forEach((enemyProgress, enemyPawnIndex) => {
          if (enemyProgress < 0 || enemyProgress >= 40 || amShieldActive(game, enemyPlayerIndex, enemyPawnIndex)) return;
          const enemyGlobal = amGlobalTrackIndex(enemyPlayerIndex, enemyProgress, game);
          const newOwnProgress = (enemyGlobal - amPlayerColor(playerIndex).start + 40) % 40;
          const newEnemyProgress = (ownGlobal - amPlayerColor(enemyPlayerIndex).start + 40) % 40;
          const gain = newOwnProgress - ownProgress;
          const enemyLoss = enemyProgress - newEnemyProgress;
          const score = gain * 2 + enemyLoss + (newOwnProgress >= 34 ? 35 : 0);
          if (gain >= 8 && (!best || score > best.score)) best = { ownPawnIndex, enemyPlayerIndex, enemyPawnIndex, score };
        });
      });
    });
    return best;
  }

  async function amBotStep() {
    const game = amCurrentGame();
    if (!game || game.status !== "playing") return;
    const bot = game.players[game.turnIndex];
    if (!bot?.isBot) return;
    if (game.online && !amIsHost()) return;

    const botIndex = game.turnIndex;
    const points = Number(bot.points || 0);

    if (!game.usedExtraThisTurn && game.phase === "roll") {
      const enemyIndex = amLeadingEnemyIndex(game, botIndex);
      const enemy = game.players[enemyIndex];
      const enemyHomeCount = enemy ? (game.pawns[enemy.id] || []).filter((p) => p >= 40).length : 0;
      const ownHomeCount = (game.pawns[bot.id] || []).filter((p) => p >= 40).length;

      // 10-Point-Wunschwurf nur für entscheidende Ziel- oder Rauswurfzüge.
      if (points >= 10) {
        const wish = amBestWishChoice(game, botIndex);
        if (wish && (ownHomeCount >= 3 && wish.target >= 40 || wish.score >= 175)) {
          await amMutate((next) => amExtraMutation(next, "wish", { value: wish.die }));
          return;
        }
      }

      if (points >= 4 && enemyIndex >= 0 && enemyHomeCount >= 3) {
        await amMutate((next) => amExtraMutation(next, "skip", { playerIndex: enemyIndex }));
        return;
      }

      const advanced = amAdvancedEnemyPawn(game, botIndex);
      if (points >= 8 && advanced?.progress >= 35) {
        await amMutate((next) => amExtraMutation(next, "sendhome", advanced));
        return;
      }
      if (points >= 6) {
        const swap = amBestSwapChoice(game, botIndex);
        if (swap?.score >= 28) {
          await amMutate((next) => amExtraMutation(next, "swap", swap));
          return;
        }
      }
      if (points >= 5 && advanced?.progress >= 29) {
        await amMutate((next) => amExtraMutation(next, "reverse", advanced));
        return;
      }

      const own = (game.pawns[bot.id] || []).map((progress, pawnIndex) => ({ progress, pawnIndex }))
        .filter((entry) => entry.progress >= 24 && entry.progress < 40 && !amShieldActive(game, botIndex, entry.pawnIndex))
        .sort((a, b) => b.progress - a.progress)[0];
      if (points >= 1 && own && Math.random() < 0.28) {
        await amMutate((next) => amExtraMutation(next, "shield", { playerIndex: botIndex, pawnIndex: own.pawnIndex }));
        return;
      }
      if (points >= 3 && Math.random() < 0.2) {
        await amMutate((next) => amExtraMutation(next, "turbo"));
        return;
      }
      if (points >= 2 && Math.random() < 0.12) {
        await amMutate((next) => amExtraMutation(next, "reroll"));
        return;
      }
    }

    if (game.phase === "roll") {
      await amMutate((next) => amRollMutation(next));
      return;
    }

    if (game.phase === "move") {
      const move = amBestMove(game);
      if (move >= 0) await amMutate((next) => amMoveMutation(next, move));
      else await amMutate((next) => amEndTurnMutation(next));
    }
  }

  function amScheduleBot() {
    clearTimeout(amRuntime.botTimer);
    amRuntime.botTimer = null;
    const game = amCurrentGame();
    if (!game || game.status !== "playing") return;
    const current = game.players[game.turnIndex];
    if (!current?.isBot) return;
    if (game.online && !amIsHost()) return;
    amRuntime.botTimer = setTimeout(() => amBotStep().catch((error) => amToast(amOnlineErrorText(error))), AM_BOT_DELAY);
  }

  function amRingPoint(index) {
    const angle = (-135 + index * 9) * Math.PI / 180;
    return { x: 50 + Math.cos(angle) * 36.5, y: 50 + Math.sin(angle) * 36.5 };
  }

  function amHomePoint(playerIndex, homeIndex) {
    const start = amRingPoint(amPlayerColor(playerIndex).start);
    const t = (homeIndex + 1) / 5.5;
    return { x: start.x + (50 - start.x) * t, y: start.y + (50 - start.y) * t };
  }

  function amBasePoint(playerIndex, pawnIndex) {
    const [cx, cy] = amPlayerColor(playerIndex).base;
    const offsets = [[-3.65, -3.65], [3.65, -3.65], [-3.65, 3.65], [3.65, 3.65]];
    return { x: cx + offsets[pawnIndex][0], y: cy + offsets[pawnIndex][1] };
  }

  function amPawnPosition(game, playerIndex, pawnIndex) {
    const player = game.players[playerIndex];
    const progress = Number(game.pawns[player.id][pawnIndex]);
    if (progress < 0) return amBasePoint(playerIndex, pawnIndex);
    if (progress < 40) return amRingPoint(amGlobalTrackIndex(playerIndex, progress, game));
    return amHomePoint(playerIndex, progress - 40);
  }

  function amNeonBoardSvg(game) {
    const activeIndex = Math.max(0, Math.min(game.players.length - 1, Number(game.turnIndex || 0)));
    const ring = Array.from({ length: 40 }, (_, index) => {
      const point = amRingPoint(index);
      const startPlayerRaw = AM_COLORS.findIndex((color) => color.start === index);
      const startPlayer = startPlayerRaw >= 0 && startPlayerRaw < game.players.length ? startPlayerRaw : -1;
      const color = startPlayer >= 0 ? amPlayerColor(startPlayer) : null;
      const fill = color ? color.hex : "rgba(226,239,255,.16)";
      return `<g class="am-path-slot ${startPlayer >= 0 ? "start" : ""}">
        ${startPlayer >= 0 ? `<circle cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="3.15" fill="${color.hex}22" stroke="${color.hex}66" stroke-width=".42"/>` : ""}
        <circle class="am-path-cell ${startPlayer >= 0 ? "start" : ""}" cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="2.05" fill="${fill}" data-cell="${index}"/>
      </g>`;
    }).join("");

    const bases = game.players.map((player, playerIndex) => {
      const color = amPlayerColor(playerIndex);
      const [cx, cy] = color.base;
      const isTurn = game.status === "playing" && activeIndex === playerIndex;
      const slots = Array.from({ length: 4 }, (_, pawnIndex) => {
        const point = amBasePoint(playerIndex, pawnIndex);
        return `<circle class="am-base-slot" cx="${point.x}" cy="${point.y}" r="2.72" fill="rgba(3,8,16,.78)" stroke="${color.hex}" stroke-width=".48"/>`;
      }).join("");
      return `<g class="am-base ${isTurn ? "active" : ""}" style="--base-color:${color.hex}">
        ${isTurn ? `<rect x="${cx - 9.3}" y="${cy - 9.3}" width="18.6" height="18.6" rx="5.6" fill="none" stroke="${color.hex}" stroke-width=".55" class="am-active-base-ring"/>` : ""}
        <rect x="${cx - 8.1}" y="${cy - 8.1}" width="16.2" height="16.2" rx="4.8" fill="${color.hex}18" stroke="${color.hex}" stroke-width=".7"/>
        ${slots}
        <text x="${cx}" y="${cy > 50 ? cy - 10.35 : cy + 11.1}" text-anchor="middle" class="am-base-title ${cy > 50 ? "above" : "below"}" fill="${color.hex}" font-family="Arial, sans-serif" font-size="2.15" font-weight="900" paint-order="stroke fill" stroke="rgba(3,8,16,.94)" stroke-width=".58">${amEscape(player.name).slice(0, 12)}</text>
      </g>`;
    }).join("");

    const homes = game.players.map((_, playerIndex) => {
      const color = amPlayerColor(playerIndex);
      const first = amHomePoint(playerIndex, 0);
      const last = amHomePoint(playerIndex, 3);
      const lane = `<line class="am-home-lane" x1="${first.x.toFixed(2)}" y1="${first.y.toFixed(2)}" x2="${last.x.toFixed(2)}" y2="${last.y.toFixed(2)}" stroke="${color.hex}"/>`;
      const cells = Array.from({ length: 4 }, (_, homeIndex) => {
        const point = amHomePoint(playerIndex, homeIndex);
        return `<circle class="am-home-cell" cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="2.25" fill="${color.hex}42" stroke="${color.hex}" stroke-width=".55"/>`;
      }).join("");
      return `<g>${lane}${cells}</g>`;
    }).join("");

    const legal = new Set(amCurrentCanAct(game) && game.phase === "move" ? amLegalMoves(game).map((index) => `${game.turnIndex}:${index}`) : []);
    const pawns = game.players.map((player, playerIndex) => (game.pawns[player.id] || []).map((_, pawnIndex) => {
      const point = amPawnPosition(game, playerIndex, pawnIndex);
      const color = amPlayerColor(playerIndex);
      const key = `${playerIndex}:${pawnIndex}`;
      const shield = amShieldActive(game, playerIndex, pawnIndex);
      const targetable = amPawnTargetable(game, playerIndex, pawnIndex);
      return `<g class="am-pawn ${legal.has(key) ? "legal" : ""} ${targetable ? "targetable" : ""} ${shield ? "shielded" : ""}" data-am-pawn="${key}" transform="translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})" role="button" tabindex="0" aria-label="Figur ${pawnIndex + 1} von ${amEscape(player.name)}">
        <circle class="am-pawn-hit" r="5.15" fill="transparent" pointer-events="all"/>
        ${legal.has(key) || targetable ? `<circle r="3.85" class="am-pawn-action-ring" fill="none" stroke="${targetable ? "#fff0a8" : "#ffffff"}"/>` : ""}
        ${shield ? `<circle r="4.25" class="am-shield-ring" fill="none" stroke="${color.hex}"/>` : ""}
        <circle class="am-pawn-body" r="2.78" fill="${color.hex}" stroke="rgba(255,255,255,.96)" stroke-width=".58"/>
        <circle r="1.22" fill="${color.dark}" opacity=".92"/>
        <text y=".7" text-anchor="middle" fill="#fff" font-size="2" font-weight="950">${pawnIndex + 1}</text>
      </g>`;
    }).join("")).join("");

    return `<svg class="am-board-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" role="img" aria-label="MRDN.KL Spielfeld">
      <defs>
        <radialGradient id="amBg" cx="50%" cy="44%" r="68%"><stop offset="0" stop-color="#27435f"/><stop offset=".55" stop-color="#12233a"/><stop offset="1" stop-color="#060d18"/></radialGradient>
        <linearGradient id="amBoardEdge" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#68ddff" stop-opacity=".34"/><stop offset=".5" stop-color="#776cff" stop-opacity=".13"/><stop offset="1" stop-color="#ff5ba8" stop-opacity=".25"/></linearGradient>
      </defs>
      <rect x="1.2" y="1.2" width="97.6" height="97.6" rx="12.5" fill="url(#amBg)" stroke="url(#amBoardEdge)" stroke-width=".7"/>
      <path d="M8 50a42 42 0 1 0 84 0a42 42 0 1 0-84 0" fill="none" stroke="rgba(111,221,255,.09)" stroke-width="1.4"/>
      <circle cx="50" cy="50" r="39.5" fill="none" stroke="rgba(255,255,255,.035)" stroke-dasharray="1 2.1" stroke-width=".45"/>
      ${bases}
      ${ring}
      ${homes}
      <g class="am-center">
        <circle cx="50" cy="50" r="6.25" fill="#06101d" stroke="#83eaff" stroke-width=".65"/>
        <circle cx="50" cy="50" r="5.1" fill="none" stroke="rgba(190,137,255,.34)" stroke-width=".35"/>
        <text x="50" y="50.6" text-anchor="middle" class="mrdn-logo" font-family="Arial, sans-serif" font-size="2.2" font-weight="900" fill="#9beeff">MRDN.KL</text>
      </g>
      <g>${pawns}</g>
    </svg>`;
  }


  const AM_CLASSIC_TRACK = [
    [1,4],[2,4],[3,4],[4,4],[4,3],[4,2],[4,1],[4,0],[5,0],[6,0],
    [6,1],[6,2],[6,3],[6,4],[7,4],[8,4],[9,4],[10,4],[10,5],[10,6],
    [9,6],[8,6],[7,6],[6,6],[6,7],[6,8],[6,9],[6,10],[5,10],[4,10],
    [4,9],[4,8],[4,7],[4,6],[3,6],[2,6],[1,6],[0,6],[0,5],[0,4]
  ];

  const AM_CLASSIC_HOMES = [
    [[1,5],[2,5],[3,5],[4,5]],
    [[5,1],[5,2],[5,3],[5,4]],
    [[9,5],[8,5],[7,5],[6,5]],
    [[5,9],[5,8],[5,7],[5,6]]
  ];

  const AM_CLASSIC_BASE_CENTERS = [[20,20],[80,20],[80,80],[20,80]];

  function amClassicGridPoint(gridPoint) {
    return { x: 10 + Number(gridPoint[0]) * 8, y: 10 + Number(gridPoint[1]) * 8 };
  }

  function amClassicTrackPoint(index) {
    return amClassicGridPoint(AM_CLASSIC_TRACK[((Number(index) % 40) + 40) % 40]);
  }

  function amClassicHomePoint(playerIndex, homeIndex) {
    return amClassicGridPoint(AM_CLASSIC_HOMES[playerIndex]?.[homeIndex] || AM_CLASSIC_HOMES[0][0]);
  }

  function amClassicBasePoint(playerIndex, pawnIndex) {
    const center = AM_CLASSIC_BASE_CENTERS[playerIndex] || AM_CLASSIC_BASE_CENTERS[0];
    const offsets = [[-5,-5],[5,-5],[-5,5],[5,5]];
    return { x: center[0] + offsets[pawnIndex][0], y: center[1] + offsets[pawnIndex][1] };
  }

  function amClassicPawnPosition(game, playerIndex, pawnIndex) {
    const player = game.players[playerIndex];
    const progress = Number(game.pawns[player.id][pawnIndex]);
    if (progress < 0) return amClassicBasePoint(playerIndex, pawnIndex);
    if (progress < 40) return amClassicTrackPoint(amGlobalTrackIndex(playerIndex, progress, game));
    return amClassicHomePoint(playerIndex, progress - 40);
  }

  function amClassicBoardSvg(game) {
    const activeIndex = Math.max(0, Math.min(game.players.length - 1, Number(game.turnIndex || 0)));
    const baseRects = [[5,5],[67,5],[67,67],[5,67]];
    const bases = game.players.map((player, playerIndex) => {
      const color = amPlayerColor(playerIndex);
      const [x, y] = baseRects[playerIndex];
      const [cx, cy] = AM_CLASSIC_BASE_CENTERS[playerIndex];
      const isTurn = game.status === "playing" && activeIndex === playerIndex;
      const slots = Array.from({ length: 4 }, (_, pawnIndex) => {
        const point = amClassicBasePoint(playerIndex, pawnIndex);
        return `<circle class="am-base-slot" cx="${point.x}" cy="${point.y}" r="3.25" fill="#ead7b5" stroke="${color.hex}" stroke-width=".72"/>`;
      }).join("");
      return `<g class="am-base am-classic-base ${isTurn ? "active" : ""}" style="--base-color:${color.hex}">
        <rect x="${x}" y="${y}" width="28" height="28" rx="6" fill="${color.hex}25" stroke="${color.hex}" stroke-width="1"/>
        ${isTurn ? `<rect x="${x - 1.5}" y="${y - 1.5}" width="31" height="31" rx="7.5" fill="none" stroke="${color.hex}" stroke-width=".72" class="am-active-base-ring"/>` : ""}
        ${slots}
        <text x="${cx}" y="${cy > 50 ? y - 2.4 : y + 33.7}" text-anchor="middle" class="am-base-title ${cy > 50 ? "above" : "below"}" fill="${color.dark}" font-family="Arial, sans-serif" font-size="2.15" font-weight="900" paint-order="stroke fill" stroke="#d5b98d" stroke-width=".66">${amEscape(player.name).slice(0, 12)}</text>
      </g>`;
    }).join("");

    const ring = AM_CLASSIC_TRACK.map((gridPoint, index) => {
      const point = amClassicGridPoint(gridPoint);
      const startPlayerRaw = AM_COLORS.findIndex((_, playerIndex) => amBoardStartIndex(playerIndex, game) === index);
      const startPlayer = startPlayerRaw >= 0 && startPlayerRaw < game.players.length ? startPlayerRaw : -1;
      const color = startPlayer >= 0 ? amPlayerColor(startPlayer) : null;
      return `<g class="am-path-slot ${startPlayer >= 0 ? "start" : ""}">
        <circle class="am-path-cell ${startPlayer >= 0 ? "start" : ""}" cx="${point.x}" cy="${point.y}" r="3.1" fill="${color ? color.hex : "#ead7b5"}" stroke="${color ? color.dark : "#70583d"}" stroke-width=".68" data-cell="${index}"/>
      </g>`;
    }).join("");

    const homes = game.players.map((_, playerIndex) => {
      const color = amPlayerColor(playerIndex);
      return AM_CLASSIC_HOMES[playerIndex].map((gridPoint) => {
        const point = amClassicGridPoint(gridPoint);
        return `<circle class="am-home-cell" cx="${point.x}" cy="${point.y}" r="3.1" fill="${color.hex}" stroke="${color.dark}" stroke-width=".7"/>`;
      }).join("");
    }).join("");

    const legal = new Set(amCurrentCanAct(game) && game.phase === "move" ? amLegalMoves(game).map((index) => `${game.turnIndex}:${index}`) : []);
    const pawns = game.players.map((player, playerIndex) => (game.pawns[player.id] || []).map((_, pawnIndex) => {
      const point = amClassicPawnPosition(game, playerIndex, pawnIndex);
      const color = amPlayerColor(playerIndex);
      const key = `${playerIndex}:${pawnIndex}`;
      const shield = amShieldActive(game, playerIndex, pawnIndex);
      const targetable = amPawnTargetable(game, playerIndex, pawnIndex);
      return `<g class="am-pawn ${legal.has(key) ? "legal" : ""} ${targetable ? "targetable" : ""} ${shield ? "shielded" : ""}" data-am-pawn="${key}" transform="translate(${point.x} ${point.y})" role="button" tabindex="0" aria-label="Figur ${pawnIndex + 1} von ${amEscape(player.name)}">
        <circle class="am-pawn-hit" r="5.55" fill="transparent" pointer-events="all"/>
        ${legal.has(key) || targetable ? `<circle r="4.35" class="am-pawn-action-ring" fill="none" stroke="${targetable ? "#ffdc75" : "#1a2732"}"/>` : ""}
        ${shield ? `<circle r="4.75" class="am-shield-ring" fill="none" stroke="${color.hex}"/>` : ""}
        <circle class="am-pawn-body" r="3.25" fill="${color.hex}" stroke="#fff" stroke-width=".72"/>
        <circle r="1.3" fill="${color.dark}" opacity=".94"/>
        <text y=".75" text-anchor="middle" fill="#fff" font-size="2.1" font-weight="950">${pawnIndex + 1}</text>
      </g>`;
    }).join("")).join("");

    return `<svg class="am-board-svg am-classic-board" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" role="img" aria-label="MRDN.KL klassisches Spielfeld">
      <rect x="1.5" y="1.5" width="97" height="97" rx="8" fill="#76583b" stroke="#3f2b1c" stroke-width="1.1"/>
      <rect x="4" y="4" width="92" height="92" rx="6" fill="#b89466" stroke="#6b4d31" stroke-width=".45"/>
      ${bases}
      <g>${ring}${homes}</g>
      <g class="am-classic-center">
        <path d="M42 42 L50 50 L42 58 Z" fill="${AM_COLORS[0].hex}" opacity=".88"/>
        <path d="M42 42 L50 50 L58 42 Z" fill="${AM_COLORS[1].hex}" opacity=".88"/>
        <path d="M58 42 L50 50 L58 58 Z" fill="${AM_COLORS[2].hex}" opacity=".88"/>
        <path d="M42 58 L50 50 L58 58 Z" fill="${AM_COLORS[3].hex}" opacity=".88"/>
        <circle cx="50" cy="50" r="2.2" fill="#e8d3ad" stroke="#513923" stroke-width=".45"/>
      </g>
      <g>${pawns}</g>
    </svg>`;
  }

  function amBoardSvg(game) {
    return game?.boardStyle === "classic" ? amClassicBoardSvg(game) : amNeonBoardSvg(game);
  }

  function amPawnTargetable(game, playerIndex, pawnIndex) {
    const extraId = amRuntime.pendingExtra;
    if (!extraId) return false;
    const progress = Number(game.pawns[game.players[playerIndex].id]?.[pawnIndex]);
    if (extraId === "shield") return playerIndex === game.turnIndex && progress >= 0 && progress < 40;
    if (["reverse", "sendhome"].includes(extraId)) return playerIndex !== game.turnIndex && progress >= 0 && progress < 40 && !amShieldActive(game, playerIndex, pawnIndex);
    if (extraId === "swap") {
      if (!amRuntime.swapOwn) return playerIndex === game.turnIndex && progress >= 0 && progress < 40;
      return playerIndex !== game.turnIndex && progress >= 0 && progress < 40 && !amShieldActive(game, playerIndex, pawnIndex);
    }
    return false;
  }

  function amPlayerCards(game) {
    return game.players.map((player, index) => {
      const color = amPlayerColor(index);
      const isTurn = game.status === "playing" && game.turnIndex === index;
      const home = (game.pawns[player.id] || []).filter((p) => p >= 40).length;
      return `<article class="am-player-card ${isTurn ? "turn" : ""}" style="--am-player:${color.hex}">
        <span class="am-player-dot"></span>
        <div><b>${amEscape(player.name)}</b><small>${player.isBot ? "Strategie-Bot" : game.online ? "Online-Spieler" : "Du"} · ${home}/4 im Ziel</small></div>
        <strong>${Number(player.points || 0)} <i>Points</i></strong>
        ${Number(player.skipTurns || 0) ? `<em>Pause ×${player.skipTurns}</em>` : ""}
      </article>`;
    }).join("");
  }

  function amExtraShop(game) {
    const player = game.players[game.turnIndex];
    const canAct = amCurrentCanAct(game);
    return `<div class="am-extra-grid">
      ${AM_EXTRAS.map((extra) => {
        const enabled = canAct && amCanUseExtra(game, extra.id);
        return `<button class="am-extra-card ${amRuntime.pendingExtra === extra.id ? "selected" : ""}" data-am-extra="${extra.id}" ${enabled ? "" : "disabled"}>
          <span>${extra.icon}</span><div><b>${extra.label}</b><small>${extra.text}</small></div><strong>${extra.cost}</strong>
        </button>`;
      }).join("")}
      <p class="am-extra-hint">${game.usedExtraThisTurn ? "Für diesen Zug wurde bereits ein Extra benutzt." : `${amEscape(player?.name || "Spieler")} hat ${Number(player?.points || 0)} Points.`}</p>
    </div>`;
  }

  function amTargetControls(game) {
    const extra = amExtraById(amRuntime.pendingExtra);
    if (!extra) return "";
    if (extra.target === "player") {
      return `<div class="am-target-panel"><b>Welcher Gegner soll aussetzen?</b><div>${game.players.map((player, index) => index === game.turnIndex ? "" : `<button data-am-target-player="${index}">${amEscape(player.name)}</button>`).join("")}</div><button class="ghost" data-am-cancel-extra>Abbrechen</button></div>`;
    }
    if (extra.target === "die") {
      return `<div class="am-target-panel"><b>Wunschwurf auswählen</b><div class="dice-pick">${[1,2,3,4,5,6].map((value) => `<button data-am-wish="${value}">${value}</button>`).join("")}</div><button class="ghost" data-am-cancel-extra>Abbrechen</button></div>`;
    }
    const prompt = extra.id === "swap" && amRuntime.swapOwn
      ? "Jetzt eine gegnerische Figur auf der Strecke wählen."
      : extra.id === "swap"
        ? "Zuerst eine eigene Figur auf der Strecke wählen."
        : extra.target === "ownPawn"
          ? "Wähle eine eigene Figur auf dem Spielfeld."
          : "Wähle eine gegnerische Figur auf dem Spielfeld.";
    return `<div class="am-target-panel"><b>${prompt}</b><button class="ghost" data-am-cancel-extra>Abbrechen</button></div>`;
  }

  function amDiceFace(value) {
    const dots = {
      1: "●", 2: "●  ●", 3: "●  ●  ●", 4: "● ●\n● ●", 5: "● ●\n ● \n● ●", 6: "● ●\n● ●\n● ●"
    };
    return dots[value] || "?";
  }

  function amOwnerIngameHtml(game) {
    if (!amOwnerIngameVisible()) return "";
    const colors = AM_COLORS.map((entry) => entry.hex);
    return `<aside class="am-owner-ingame" data-am-owner-ingame>
      <header><div><small>OWNER · NUR FÜR DICH</small><h3>MRDN.KL-Steuerung</h3></div><button type="button" data-am-owner-toggle aria-label="Owner-Steuerung ausblenden">×</button></header>
      <div class="am-owner-ingame-scroll">${game.players.map((player, index) => {
        const forced = Number(game.ownerForcedRolls?.[player.id] || 0);
        return `<article style="--owner-player:${colors[index % colors.length]}">
          <div class="am-owner-player-head"><span>${index + 1}</span><div><b>${amEscape(player.name)}</b><small>${index === game.turnIndex ? "AM ZUG" : player.isBot ? "BOT" : "SPIELER"}</small></div><strong>${Number(player.points || 0)} P</strong></div>
          <div class="am-owner-inline-actions"><small>Points</small><div><button data-am-owner-ingame-points="${amEscape(player.id)}" data-am-owner-amount="-5">−5</button><button data-am-owner-ingame-points="${amEscape(player.id)}" data-am-owner-amount="1">+1</button><button data-am-owner-ingame-points="${amEscape(player.id)}" data-am-owner-amount="5">+5</button><button data-am-owner-ingame-points="${amEscape(player.id)}" data-am-owner-amount="10">+10</button></div></div>
          <div class="am-owner-inline-actions dice"><small>Nächster Würfel</small><div><button class="clear ${forced ? "" : "active"}" data-am-owner-ingame-roll="${amEscape(player.id)}" data-am-owner-roll-value="0">×</button>${[1,2,3,4,5,6].map((value) => `<button class="${forced === value ? "active" : ""}" data-am-owner-ingame-roll="${amEscape(player.id)}" data-am-owner-roll-value="${value}">${value}</button>`).join("")}</div></div>
        </article>`;
      }).join("")}</div>
      <footer>Eine erzwungene 6 zählt wie eine normale 6: +1 Point und ein weiterer Wurf.</footer>
    </aside>`;
  }

  function amGameOverlayHtml(game) {
    const current = game.players[game.turnIndex];
    const currentColor = amPlayerColor(game.turnIndex);
    const canAct = amCurrentCanAct(game);
    const legal = game.phase === "move" ? amLegalMoves(game) : [];
    const roomLabel = game.online ? `Online-Raum ${amEscape(amRuntime.onlineId)}` : "Bot-Spiel";
    const statusText = game.status === "finished"
      ? `${amEscape(game.winnerName)} gewinnt!`
      : `${amEscape(current?.name || "Spieler")} ist am Zug`;
    const actionText = game.status === "finished"
      ? "Partie beendet"
      : !canAct
        ? current?.isBot ? "Bot berechnet den besten Zug …" : "Warte auf den anderen Spieler …"
        : game.phase === "roll"
          ? "Würfle jetzt"
          : legal.length
            ? `${legal.length} Figur${legal.length === 1 ? "" : "en"} kann${legal.length === 1 ? "" : " können"} ziehen`
            : "Kein gültiger Zug – automatisch weiter";
    const phaseText = game.status === "finished" ? "ENDE" : game.phase === "roll" ? "WÜRFELN" : "ZIEHEN";
    const fullscreenText = document.fullscreenElement ? "Fenster" : "Vollbild";
    const sideTab = ["players", "shop", "log"].includes(amRuntime.sideTab) ? amRuntime.sideTab : "players";
    const scoreStrip = game.players.map((player, index) => {
      const color = amPlayerColor(index);
      const home = (game.pawns[player.id] || []).filter((progress) => Number(progress) >= 40).length;
      return `<span style="--p:${color.hex}" class="${index === amOwnPlayerIndex(game) ? "own" : ""}"><i></i><b>${amEscape(player.name)}</b><strong>${Number(player.points || 0)}P</strong><small>${home}/4</small></span>`;
    }).join("");
    const ownPoints = Number(game.players[amOwnPlayerIndex(game)]?.points || 0);
    const ownerAllowed = amOwnerAuthorized();
    const ownerVisible = amOwnerIngameVisible();

    return `<section class="am-game-shell" style="--turn-color:${currentColor.hex}">
      <header class="am-game-head">
        <div class="am-head-copy"><p>MRDN.KL · ${roomLabel}</p><h2>${statusText}</h2><small>${actionText}</small></div>
        <div class="am-head-actions">${ownerAllowed ? `<button class="am-owner-head-toggle ${ownerVisible ? "active" : ""}" data-am-owner-toggle>Owner</button>` : ""}<button data-am-fullscreen>${fullscreenText}</button>${game.online ? `<button data-am-copy-code>Code kopieren</button>` : `<button class="am-end-local" data-am-end-local>Spiel beenden</button>`}<button data-am-minimize>Minimieren</button></div>
      </header>
      <div class="am-mobile-score-strip" aria-label="Spieler, Points und Zielfiguren">${scoreStrip}</div>
      <div class="am-game-layout">
        <main class="am-board-panel">
          <div class="am-board-stage">
            ${amBoardSvg(game)}
            ${amTargetControls(game)}
          </div>
          <div class="am-control-deck">
            <div class="am-turn-strip">
              <span class="am-turn-dot"></span><div><small>Aktueller Zug</small><b>${amEscape(current?.name || "Spieler")}</b></div><em>${phaseText}</em>
            </div>
            <div class="am-main-controls">
              <div class="am-dice ${game.die ? "rolled" : ""}"><span>${amDiceFace(game.die)}</span><b>${game.die || "–"}</b></div>
              <div class="am-action-buttons">
                <button class="am-roll-button" data-am-roll ${canAct && game.phase === "roll" && game.status === "playing" ? "" : "disabled"}>Würfeln</button>
              </div>
              <small class="am-control-hint">PC: Leertaste zum Würfeln · Leuchtende Figur anklicken</small>
            </div>
          </div>
        </main>
        <nav class="am-mobile-tools" aria-label="Spielinformationen"><button data-am-side-tab="players">Spieler</button><button class="boosts" data-am-side-tab="shop">Boosts <strong>${ownPoints}</strong></button><button data-am-side-tab="log">Verlauf</button></nav>
        <aside class="am-side-panel ${amRuntime.mobileSheetOpen ? "sheet-open" : "sheet-closed"}" data-am-side-panel>
          <nav class="am-side-tabs" aria-label="Spielinformationen"><button class="am-sheet-close" data-am-sheet-close aria-label="Informationen schließen">×</button>
            <button class="${sideTab === "players" ? "active" : ""}" data-am-side-tab="players">Spieler</button>
            <button class="${sideTab === "shop" ? "active" : ""}" data-am-side-tab="shop">Extras</button>
            <button class="${sideTab === "log" ? "active" : ""}" data-am-side-tab="log">Verlauf</button>
          </nav>
          <section class="am-side-section ${sideTab === "players" ? "active" : ""}" data-am-side-section="players"><div class="am-player-list">${amPlayerCards(game)}</div></section>
          <section class="am-shop-panel am-side-section ${sideTab === "shop" ? "active" : ""}" data-am-side-section="shop"><h3>Point-Shop</h3><p>Jede natürlich gewürfelte 6 bringt genau 1 Point.</p>${amExtraShop(game)}</section>
          <section class="am-log-panel am-side-section ${sideTab === "log" ? "active" : ""}" data-am-side-section="log"><h3>Spielverlauf</h3>${(game.log || []).map((entry, index) => `<p class="${index === 0 ? "latest" : ""}">${amEscape(entry)}</p>`).join("")}</section>
        </aside>
      </div>
      ${amOwnerIngameHtml(game)}
      ${game.status === "finished" ? `<div class="am-winner-panel"><span>🏆</span><h2>${amEscape(game.winnerName)} gewinnt MRDN.KL</h2><p>Alle vier Figuren sind im Ziel.${amOwnWon(game) ? " Deine Belohnung: 50 EP und 250 € auf das Bankkonto." : ""}</p><div>${game.online && amIsHost() ? `<button data-am-rematch>Revanche starten</button>` : !game.online ? `<button data-am-local-rematch>Noch eine Runde</button>` : ""}<button data-am-minimize>Zur App</button></div></div>` : ""}
      <div class="am-toast" data-am-toast></div>
    </section>`;
  }

  function amEnsureOverlay() {
    if (amRuntime.overlay) return amRuntime.overlay;
    const overlay = document.createElement("div");
    overlay.className = "am-overlay";
    overlay.dataset.amOverlay = "1";
    document.body.appendChild(overlay);
    overlay.addEventListener("click", amOverlayClick);
    overlay.addEventListener("keydown", (event) => {
      if (!["Enter", " "].includes(event.key)) return;
      const pawn = event.target.closest?.("[data-am-pawn]");
      if (!pawn) return;
      event.preventDefault();
      pawn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    amRuntime.overlay = overlay;
    return overlay;
  }

  function amHideBoardForLobby() {
    clearTimeout(amRuntime.botTimer);
    amRuntime.botTimer = null;
    window.clearTimeout(amRuntime.autoResolveTimer);
    amRuntime.autoResolveTimer = null;
    amRuntime.backgroundPaused = false;
    amRuntime.boardVisibleBeforeBackground = false;
    if (amRuntime.renderFrame) cancelAnimationFrame(amRuntime.renderFrame);
    amRuntime.renderFrame = 0;
    amRuntime.lastRenderSignature = "";
    amRuntime.overlay?.classList.remove("show");
    document.body.classList.remove("am-game-open");
    amRuntime.pendingExtra = "";
    amRuntime.swapOwn = null;
    amRuntime.mobileSheetOpen = false;
  }

  function amPauseForBackground() {
    const game = amCurrentGame();
    if (!game) return;
    amRuntime.boardVisibleBeforeBackground = !!amRuntime.overlay?.classList.contains("show");
    amRuntime.backgroundPaused = true;
    clearTimeout(amRuntime.botTimer);
    amRuntime.botTimer = null;
    window.clearTimeout(amRuntime.autoResolveTimer);
    amRuntime.autoResolveTimer = null;
  }

  function amResumeFromBackground() {
    if (!amRuntime.backgroundPaused) return;
    const shouldShowBoard = amRuntime.boardVisibleBeforeBackground;
    amRuntime.backgroundPaused = false;
    amRuntime.boardVisibleBeforeBackground = false;
    const game = amCurrentGame();
    if (!game) return;
    if (shouldShowBoard && !amRuntime.overlay?.classList.contains("show")) amOpenBoard();
    else if (shouldShowBoard) {
      amScheduleBot();
      amAutoResolveNoMove();
    }
  }

  function amOpenBoardAfterDialogClose() {
    const dialog = document.querySelector("#detailDialog");
    if (dialog?.open) {
      try { dialog.close(); } catch { dialog.removeAttribute("open"); }
    }
    return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => {
      amOpenBoard();
      resolve(true);
    })));
  }

  function amOpenBoard() {
    const game = amCurrentGame();
    if (!game) return amToast("Es ist noch kein Spiel aktiv.");
    amMaybeAwardWin(game);
    const deviceDialog = document.querySelector("#detailDialog");
    if (deviceDialog?.open) {
      try { deviceDialog.close(); } catch { deviceDialog.removeAttribute("open"); }
    }
    const overlay = amEnsureOverlay();
    if (amRuntime.renderFrame) cancelAnimationFrame(amRuntime.renderFrame);
    amRuntime.renderFrame = 0;
    overlay.innerHTML = amGameOverlayHtml(game);
    amRuntime.lastRenderSignature = amRenderSignature(game);
    overlay.classList.add("show");
    document.body.classList.add("am-game-open");
    amRuntime.backgroundPaused = false;
    amRuntime.boardVisibleBeforeBackground = false;
    amScheduleBot();
    amAutoResolveNoMove();
  }

  function amEndLocalGame() {
    const game = amCurrentGame();
    if (!game || game.online) return;
    if (!confirm("Bot-Partie wirklich beenden? Der aktuelle Spielstand dieser Runde wird gelöscht.")) return;
    clearTimeout(amRuntime.botTimer);
    amRuntime.botTimer = null;
    amSetLocalGame(null);
    amRuntime.pendingExtra = "";
    amRuntime.swapOwn = null;
    amRuntime.mobileSheetOpen = false;
    amRuntime.view = "home";
    amRuntime.backgroundPaused = false;
    amRuntime.boardVisibleBeforeBackground = false;
    amCloseBoard();
    amRefreshApp();
  }

  function amCloseBoard() {
    const game = amCurrentGame();
    // Lokale Bot-Züge dürfen nach dem Minimieren nicht im Hintergrund weiterlaufen.
    // Bei Online-Partien bleibt nur die für alle Teilnehmer wichtige Host-Simulation aktiv.
    if (!game?.online) {
      clearTimeout(amRuntime.botTimer);
      amRuntime.botTimer = null;
    }
    window.clearTimeout(amRuntime.autoResolveTimer);
    amRuntime.autoResolveTimer = null;
    amRuntime.overlay?.classList.remove("show");
    document.body.classList.remove("am-game-open");
    amRuntime.backgroundPaused = false;
    amRuntime.boardVisibleBeforeBackground = false;
    amRuntime.pendingExtra = "";
    amRuntime.swapOwn = null;
    amRuntime.mobileSheetOpen = false;
    amRefreshApp();
  }

  function amRenderSignature(game) {
    return JSON.stringify([
      game?.updatedAtMs, game?.turnCounter, game?.turnIndex, game?.phase, game?.status, game?.die,
      game?.pawns, game?.players?.map((player) => [player.points, player.skipTurns]), game?.shields,
      amRuntime.pendingExtra, amRuntime.swapOwn, amRuntime.sideTab, amRuntime.mobileSheetOpen,
      amRuntime.ownerPanelOpen, amRuntime.fullscreen
    ]);
  }

  function amRenderOverlay(force = false) {
    const game = amCurrentGame();
    if (!amRuntime.overlay?.classList.contains("show") || !game) return;
    const signature = amRenderSignature(game);
    if (!force && signature === amRuntime.lastRenderSignature) return;
    if (amRuntime.renderFrame) cancelAnimationFrame(amRuntime.renderFrame);
    amRuntime.renderFrame = requestAnimationFrame(() => {
      amRuntime.renderFrame = 0;
      const liveGame = amCurrentGame();
      if (!amRuntime.overlay?.classList.contains("show") || !liveGame) return;
      const liveSignature = amRenderSignature(liveGame);
      if (!force && liveSignature === amRuntime.lastRenderSignature) return;
      const previousScroll = amRuntime.overlay.querySelector("[data-am-side-panel]")?.scrollTop || 0;
      amRuntime.overlay.innerHTML = amGameOverlayHtml(liveGame);
      amRuntime.lastRenderSignature = liveSignature;
      const panel = amRuntime.overlay?.querySelector("[data-am-side-panel]");
      if (panel) panel.scrollTop = previousScroll;
    });
  }

  function amRenderAll() {
    amRenderOverlay();
    amRefreshApp();
  }

  function amAutoResolveNoMove() {
    window.clearTimeout(amRuntime.autoResolveTimer);
    amRuntime.autoResolveTimer = null;
    const game = amCurrentGame();
    if (!game || game.status !== "playing" || game.phase !== "move" || amLegalMoves(game).length || amRuntime.busy) return;
    const current = game.players[game.turnIndex];
    const mayResolve = !game.online ? !current?.isBot : current?.uid === amOwnUid() || (current?.isBot && amIsHost());
    if (!mayResolve) return;
    amRuntime.autoResolveTimer = window.setTimeout(() => {
      amRuntime.autoResolveTimer = null;
      amMutate((next) => amEndTurnMutation(next)).catch((error) => amToast(amOnlineErrorText(error)));
    }, 80);
  }

  function amOnlineErrorText(error) {
    const text = String(error?.message || error || "Unbekannter Fehler");
    const code = String(error?.code || "");
    if (code.includes("permission-denied") || /missing or insufficient permissions/i.test(text)) {
      return "Der Online-Raum wurde abgelehnt. Prüfe deine Anmeldung und versuche es erneut.";
    }
    return text;
  }

  function amToast(message) {
    const text = String(message || "").trim();
    if (!text) return;
    const overlay = amRuntime.overlay;
    const toast = overlay?.querySelector("[data-am-toast]");
    if (toast) {
      toast.textContent = text;
      toast.classList.add("show");
      clearTimeout(amRuntime.toastTimer);
      amRuntime.toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
    } else if (typeof addFeed === "function") {
      addFeed(text);
    }
  }

  async function amToggleFullscreen() {
    const shell = amRuntime.overlay?.querySelector(".am-game-shell");
    try {
      if (!document.fullscreenElement) await (shell?.requestFullscreen?.() || amRuntime.overlay?.requestFullscreen?.());
      else await document.exitFullscreen?.();
    } catch (error) {
      amToast("Vollbild konnte auf diesem Gerät nicht geöffnet werden.");
    }
  }

  async function amOverlayClick(event) {
    const button = event.target.closest("button, [data-am-pawn]");
    if (!button) return;
    const game = amCurrentGame();
    if (!game) return;

    if (button.matches("[data-am-minimize]")) return amCloseBoard();
    if (button.matches("[data-am-end-local]")) return amEndLocalGame();
    if (button.matches("[data-am-fullscreen]")) { await amToggleFullscreen(); return; }
    if (button.matches("[data-am-owner-toggle]")) {
      const result = amSetOwnerIngameVisible(!amOwnerIngameVisible());
      if (result.ok === false) amToast(result.message);
      return;
    }
    if (button.matches("[data-am-owner-ingame-points]")) {
      if (!amOwnerAuthorized()) return;
      button.disabled = true;
      const result = await amOwnerGrantPoints(button.dataset.amOwnerIngamePoints, Number(button.dataset.amOwnerAmount || 0));
      amToast(result?.message || "Points aktualisiert.");
      amRenderOverlay();
      return;
    }
    if (button.matches("[data-am-owner-ingame-roll]")) {
      if (!amOwnerAuthorized()) return;
      button.disabled = true;
      const result = await amOwnerSetNextRoll(button.dataset.amOwnerIngameRoll, Number(button.dataset.amOwnerRollValue || 0));
      amToast(result?.message || "Owner-Würfel aktualisiert.");
      amRenderOverlay();
      return;
    }
    if (button.matches("[data-am-side-tab]")) {
      const nextTab = button.dataset.amSideTab || "players";
      if (window.matchMedia("(max-width: 850px)").matches && amRuntime.mobileSheetOpen && amRuntime.sideTab === nextTab) amRuntime.mobileSheetOpen = false;
      else { amRuntime.sideTab = nextTab; amRuntime.mobileSheetOpen = true; }
      amRenderOverlay();
      return;
    }
    if (button.matches("[data-am-sheet-close]")) { amRuntime.mobileSheetOpen = false; amRenderOverlay(); return; }
    if (button.matches("[data-am-copy-code]")) {
      try { await navigator.clipboard.writeText(amRuntime.onlineId); amToast("Raumcode kopiert."); }
      catch { amToast(`Raumcode: ${amRuntime.onlineId}`); }
      return;
    }
    if (button.matches("[data-am-roll]")) {
      if (!amCurrentCanAct(game)) return;
      await amMutate((next) => amRollMutation(next));
      return;
    }
    if (button.matches("[data-am-pass]")) {
      await amMutate((next) => amEndTurnMutation(next));
      return;
    }
    if (button.matches("[data-am-cancel-extra]")) {
      amRuntime.pendingExtra = "";
      amRuntime.swapOwn = null;
      amRenderOverlay();
      return;
    }
    if (button.matches("[data-am-extra]")) {
      const extraId = button.dataset.amExtra;
      const extra = amExtraById(extraId);
      if (!extra || !amCanUseExtra(game, extraId)) return;
      if (["reroll", "turbo"].includes(extraId)) {
        await amMutate((next) => amExtraMutation(next, extraId));
      } else {
        amRuntime.pendingExtra = extraId;
        amRuntime.swapOwn = null;
        amRenderOverlay();
      }
      return;
    }
    if (button.matches("[data-am-target-player]")) {
      const extraId = amRuntime.pendingExtra;
      const playerIndex = Number(button.dataset.amTargetPlayer);
      const result = await amMutate((next) => amExtraMutation(next, extraId, { playerIndex }));
      if (result.ok) { amRuntime.pendingExtra = ""; amRuntime.swapOwn = null; }
      amRenderOverlay();
      return;
    }
    if (button.matches("[data-am-wish]")) {
      const value = Number(button.dataset.amWish);
      const result = await amMutate((next) => amExtraMutation(next, "wish", { value }));
      if (result.ok) amRuntime.pendingExtra = "";
      amRenderOverlay();
      return;
    }
    if (button.matches("[data-am-pawn]")) {
      const now = performance.now();
      if (now < amRuntime.clickLockedUntil || amRuntime.busy) return;
      amRuntime.clickLockedUntil = now + 180;
      const [playerIndex, pawnIndex] = button.dataset.amPawn.split(":").map(Number);
      if (amRuntime.pendingExtra) {
        const extraId = amRuntime.pendingExtra;
        if (extraId === "swap") {
          if (!amRuntime.swapOwn) {
            if (playerIndex !== game.turnIndex || !amPawnTargetable(game, playerIndex, pawnIndex)) return amToast("Wähle zuerst eine eigene Figur auf der Strecke.");
            amRuntime.swapOwn = { playerIndex, pawnIndex };
            amRenderOverlay();
            return;
          }
          const result = await amMutate((next) => amExtraMutation(next, "swap", {
            ownPawnIndex: amRuntime.swapOwn.pawnIndex,
            enemyPlayerIndex: playerIndex,
            enemyPawnIndex: pawnIndex
          }));
          if (result.ok) { amRuntime.pendingExtra = ""; amRuntime.swapOwn = null; }
          amRenderOverlay();
          return;
        }
        const result = await amMutate((next) => amExtraMutation(next, extraId, { playerIndex, pawnIndex }));
        if (result.ok) { amRuntime.pendingExtra = ""; amRuntime.swapOwn = null; }
        amRenderOverlay();
        return;
      }
      if (playerIndex === game.turnIndex && amCurrentCanAct(game)) await amMutate((next) => amMoveMutation(next, pawnIndex));
      return;
    }
    if (button.matches("[data-am-local-rematch]")) {
      const players = amClone(game.players).map((player) => ({ ...player, points: 0, skipTurns: 0 }));
      amSetLocalGame(amCreateGame(players, false, game.boardStyle));
      amRenderAll();
      amScheduleBot();
      return;
    }
    if (button.matches("[data-am-rematch]")) {
      await amOnlineRematch();
    }
  }

  function amHomeHtml() {
    const local = amLocalGame();
    const online = amRuntime.onlineDoc?.gameState;
    const active = online || local;
    return `<div class="am-app-home">
      <section class="am-app-hero"><span>🎲</span><div><p>BRETTSPIEL · BOT · ONLINE</p><h4>MRDN.KL</h4><small>Das taktische 2–4-Spieler-Brettspiel mit Points, Extras, öffentlichen Räumen und Privatcodes.</small></div></section>
      ${active ? `<button class="am-resume-card" data-am-app="resume"><span>▶</span><div><b>${active.online ? `Online-Partie · Raum ${amEscape(amRuntime.onlineId)}` : "Botpartie fortsetzen"}</b><small>${active.status === "finished" ? `${amEscape(active.winnerName)} hat gewonnen.` : `${amEscape(active.players[active.turnIndex]?.name)} ist am Zug.`}</small></div></button>` : ""}
      <div class="am-battle-hub-title"><h4>Spielmodus</h4><small>2–4 SPIELER</small></div>
      <div class="am-mode-grid am-mode-grid-standalone">
        <button data-am-app="local-setup"><span>🤖</span><b>Gegen Bots</b><small>1 vs 1 bis vier Spieler mit taktischen Bots.</small></button>
        <button data-am-app="online"><span>🌐</span><b>Online spielen</b><small>Öffentlich sichtbar oder privat mit Raumcode.</small></button>
        <button data-am-app="rules"><span>?</span><b>Regeln & Point-Shop</b><small>Alle Regeln, Points und Extras erklärt.</small></button>
      </div>
      <div class="am-feature-strip"><span>Bot-Modus</span><span>Online-Lobbys</span><span>Privatcodes</span><span>Point-Shop</span><span>PC & Handy</span></div>
    </div>`;
  }

  function amBoardChoiceHtml(name, selected = "neon") {
    return `<fieldset class="am-board-choice"><legend>Spielfeld wählen</legend>
      <label class="${selected === "neon" ? "selected" : ""}"><input type="radio" name="${name}" value="neon" ${selected === "neon" ? "checked" : ""}><span class="am-board-thumb neon"><i></i></span><div><b>Neon-Ring</b><small>Das aktuelle runde MRDN.KL-Spielfeld.</small></div></label>
      <label class="${selected === "classic" ? "selected" : ""}"><input type="radio" name="${name}" value="classic" ${selected === "classic" ? "checked" : ""}><span class="am-board-thumb classic"><i></i></span><div><b>Klassisch</b><small>Traditionelles Kreuz-Spielfeld mit vier Farbhäusern.</small></div></label>
    </fieldset>`;
  }

  function amLocalSetupHtml() {
    return `<div class="am-app-page"><button class="am-app-back" data-am-app="home">← Zurück</button><h4>Bot-Spiel erstellen</h4><p>Du spielst Rot. Die übrigen Plätze werden mit taktischen Bots besetzt.</p>
      <label>Spieleranzahl<select data-am-local-count><option value="2">1 vs 1</option><option value="3">1 vs 1 vs 1</option><option value="4" selected>1 vs 1 vs 1 vs 1</option></select></label>
      ${amBoardChoiceHtml("am-local-board", "neon")}
      <div class="am-setup-preview">${AM_COLORS.map((color, index) => `<span style="--c:${color.hex}">${index === 0 ? "Du" : `Bot ${index}`}</span>`).join("")}</div>
      <button class="am-primary" data-am-start-local>Partie starten</button>
      <small class="am-note">Die Bots priorisieren Rauswürfe, Zielzüge, sichere Felder, Pflichtauszüge und setzen Points taktisch ein.</small>
    </div>`;
  }

  function amRulesHtml() {
    return `<div class="am-app-page"><button class="am-app-back" data-am-app="home">← Zurück</button><h4>Regeln & Point-Shop</h4>
      <div class="am-rule-list"><p><b>1.</b> Eine Figur verlässt das Haus nur mit einer 6. Wenn möglich, muss bei einer 6 zuerst eine Figur herausgesetzt werden.</p><p><b>2.</b> Eigene Figuren dürfen nicht auf demselben Feld stehen. Für den Zieleinlauf brauchst du die passende Augenzahl.</p><p><b>3.</b> Landest du auf einer ungeschützten gegnerischen Figur, wird sie zurück ins Haus geschickt.</p><p><b>4.</b> Nach einer natürlich gewürfelten 6 erhältst du 1 Point und würfelst nach deinem Zug erneut.</p><p><b>5.</b> Pro eigenem Zug darf höchstens ein Extra gekauft werden.</p></div>
      <div class="am-rules-extras">${AM_EXTRAS.map((extra) => `<article><span>${extra.icon}</span><div><b>${extra.label}</b><small>${extra.text}</small></div><strong>${extra.cost}</strong></article>`).join("")}</div>
    </div>`;
  }

  function amOnlineHtml() {
    const connected = !!amRuntime.onlineDoc;
    if (connected && amRuntime.onlineDoc.status === "lobby") return amLobbyHtml();
    if (connected && amRuntime.onlineDoc.gameState) return `<div class="am-app-page"><button class="am-app-back" data-am-leave-view>← Menü</button><h4>Online-Partie</h4><div class="am-room-code"><small>Raumcode</small><b>${amEscape(amRuntime.onlineId)}</b></div><button class="am-primary" data-am-app="resume">Spielbrett öffnen</button><button class="am-danger" data-am-online-disconnect>Raum verlassen</button></div>`;
    return `<div class="am-app-page am-online-page"><button class="am-app-back" data-am-app="home">← Zurück</button><h4>Online spielen</h4>
      <section class="am-online-create"><h5>Neuen Raum erstellen</h5><label>Spieleranzahl<select data-am-online-count><option value="2">2 Spieler</option><option value="3">3 Spieler</option><option value="4" selected>4 Spieler</option></select></label><label>Sichtbarkeit<select data-am-online-visibility><option value="public">Öffentlich sichtbar</option><option value="private">Privat · nur mit Code</option></select></label>${amBoardChoiceHtml("am-online-board", "neon")}<label class="am-check"><input type="checkbox" data-am-fill-bots checked> Freie Plätze beim Start mit Bots auffüllen</label><button class="am-primary" data-am-create-room>Raum erstellen</button></section>
      <section class="am-code-join"><h5>Mit Code beitreten</h5><div><input data-am-room-code maxlength="6" placeholder="ABC123"><button data-am-join-code>Beitreten</button></div></section>
      <section class="am-public-rooms"><div><h5>Öffentliche Räume</h5><button data-am-refresh-rooms>Aktualisieren</button></div>${amPublicRoomsHtml()}</section>
    </div>`;
  }

  function amPublicRoomsHtml() {
    if (!amRuntime.publicRooms.length) return `<p class="am-empty">Aktuell wartet kein öffentlicher Raum. Erstelle den ersten.</p>`;
    return amRuntime.publicRooms.map((room) => `<article><span>${room.players?.length || 1}/${room.maxPlayers || 4}</span><div><b>${amEscape(room.hostName || "Spieler")}</b><small>Raum ${amEscape(room.gameId || room.id)} · ${amRoomBoardStyle(room) === "classic" ? "Klassisch" : "Neon"} · ${room.fillBots ? "Bots erlaubt" : "nur Online-Spieler"}</small></div><button data-am-join-room="${amEscape(room.gameId || room.id)}">Beitreten</button></article>`).join("");
  }

  function amLobbyHtml() {
    const room = amRuntime.onlineDoc;
    const players = room.players || [];
    const host = amIsHost();
    return `<div class="am-app-page am-lobby-page"><button class="am-app-back" data-am-leave-room>← Raum verlassen</button><h4>Warteraum</h4>
      <div class="am-room-code"><small>${room.visibility === "private" ? "Privater Raumcode" : "Raumcode"}</small><b>${amEscape(amRuntime.onlineId)}</b><button data-am-copy-room-code>Kopieren</button></div>
      <div class="am-lobby-status"><span class="pulse"></span><b>Spiel startet gleich</b><small>${amRoomBoardStyle(room) === "classic" ? "Klassisches Kreuz-Spielfeld" : "Neon-Ring-Spielfeld"} · Andere Spieler sehen öffentliche Räume direkt in ihrer App.</small></div>
      <div class="am-lobby-players">${Array.from({ length: room.maxPlayers || 4 }, (_, index) => {
        const player = players[index];
        const color = amPlayerColor(index);
        return `<article style="--c:${color.hex}"><span>${player ? player.isBot ? "BOT" : index + 1 : "+"}</span><div><b>${player ? amEscape(player.name) : "Freier Platz"}</b><small>${player ? player.uid === room.hostUid ? "Host" : player.isBot ? "Strategie-Bot" : "Online verbunden" : "Wartet auf Spieler"}</small></div></article>`;
      }).join("")}</div>
      ${host ? `<label class="am-check"><input type="checkbox" data-am-lobby-fill-bots ${room.fillBots ? "checked" : ""}> Beim Start freie Plätze mit Bots füllen</label><button class="am-primary" data-am-start-online ${players.length >= 2 || room.fillBots ? "" : "disabled"}>Spiel starten</button>` : `<p class="am-wait-host">Der Host startet die Partie, sobald genug Spieler da sind.</p>`}
    </div>`;
  }

  function amAppHtml() {
    if (amRuntime.view === "local-setup") return amLocalSetupHtml();
    if (amRuntime.view === "rules") return amRulesHtml();
    if (amRuntime.view === "online") return amOnlineHtml();
    return amHomeHtml();
  }

  function amRefreshApp() {
    const shells = [...document.querySelectorAll("#detailDialog .device-shell")];
    const shell = shells.reverse().find((entry) => entry.classList.contains(`device-active-${AM_APP_ID}`)) || shells[0];
    if (!shell?.classList.contains(`device-active-${AM_APP_ID}`)) return;
    const phone = typeof ownedPhoneItem === "function" ? ownedPhoneItem() : "";
    if (phone && typeof openDeviceInterface === "function") {
      const scroll = shell.querySelector(".device-screen")?.scrollTop || 0;
      openDeviceInterface(phone, AM_APP_ID, false);
      requestAnimationFrame(() => {
        const next = document.querySelector("#detailDialog .device-shell .device-screen");
        if (next) next.scrollTop = scroll;
      });
    }
  }

  async function amStartLocal(shell) {
    try {
      const activeShell = shell?.isConnected ? shell : document.querySelector("#detailDialog .device-shell:last-of-type");
      const total = Math.max(2, Math.min(4, Number(activeShell?.querySelector("[data-am-local-count]")?.value || 4)));
      const boardStyle = activeShell?.querySelector('input[name="am-local-board"]:checked')?.value === "classic" ? "classic" : "neon";
      clearTimeout(amRuntime.botTimer);
      amRuntime.onlineUnsub?.();
      amRuntime.onlineUnsub = null;
      amRuntime.onlineId = "";
      amRuntime.onlineDoc = null;
      amRuntime.pendingExtra = "";
      amRuntime.swapOwn = null;
      amRuntime.mobileSheetOpen = false;
      const players = amCreatePlayers(total, false);
      amSetLocalGame(amCreateGame(players, false, boardStyle));
      amRuntime.view = "home";
      await amOpenBoardAfterDialogClose();
      return true;
    } catch (error) {
      console.error("MRDN.KL Bot-Partie", error);
      amToast(`Bot-Partie konnte nicht gestartet werden: ${error?.message || error}`);
      return false;
    }
  }

  async function amCreateRoom(shell) {
    const fb = await amFirebase();
    const user = amRequireOnlineUser(fb);
    const activeShell = shell?.isConnected ? shell : document.querySelector("#detailDialog .device-shell:last-of-type");
    const maxPlayers = Math.max(2, Math.min(4, Number(activeShell?.querySelector("[data-am-online-count]")?.value || 4)));
    const visibility = activeShell?.querySelector("[data-am-online-visibility]")?.value === "private" ? "private" : "public";
    const fillBots = !!activeShell?.querySelector("[data-am-fill-bots]")?.checked;
    const boardStyle = activeShell?.querySelector('input[name="am-online-board"]:checked')?.value === "classic" ? "classic" : "neon";
    let code = "";
    let ref = null;
    let freeCodeFound = false;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      code = amNewCode();
      ref = fb.doc(fb.db, AM_COLLECTION, code);
      if (!(await fb.getDoc(ref)).exists()) {
        freeCodeFound = true;
        break;
      }
    }
    if (!freeCodeFound || !ref) throw new Error("Es konnte kein freier Raumcode erzeugt werden. Bitte erneut versuchen.");
    const player = { uid: user.uid, name: user.displayName || amPlayerDisplayName(), isBot: false };
    const room = {
      gameId: code,
      hostUid: user.uid,
      hostName: player.name,
      visibility,
      maxPlayers,
      fillBots,
      status: "lobby",
      playerUids: [user.uid],
      players: [player],
      gameState: null,
      winnerName: "",
      createdAtMs: Date.now(),
      updatedAtMs: Date.now(),
      version: amEncodeRoomVersion(boardStyle)
    };
    await fb.setDoc(ref, room);

    // Lobby sofort lokal darstellen, statt auf den ersten Snapshot zu warten.
    // Das verhindert auf Mobilgeräten eine scheinbar leere/alte App-Ansicht.
    amRuntime.onlineId = code;
    amRuntime.onlineDoc = { id: code, viewerUid: user.uid, ...room };
    amRuntime.view = "online";
    amRememberRoom(code);
    amHideBoardForLobby();
    amRefreshApp();
    await amWatchRoom(code, false);
  }

  async function amJoinRoom(codeRaw) {
    const code = String(codeRaw || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    if (code.length !== 6) throw new Error("Der Raumcode muss sechs Zeichen haben.");
    const fb = await amFirebase();
    const user = amRequireOnlineUser(fb);
    const ref = fb.doc(fb.db, AM_COLLECTION, code);
    await fb.runTransaction(fb.db, async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw new Error("Dieser Raum wurde nicht gefunden.");
      const room = snapshot.data();
      if (room.status !== "lobby") throw new Error("Diese Partie läuft bereits.");
      const players = Array.isArray(room.players) ? [...room.players] : [];
      if (players.some((entry) => entry.uid === user.uid)) return;
      if (players.length >= Number(room.maxPlayers || 4)) throw new Error("Der Raum ist bereits voll.");
      players.push({ uid: user.uid, name: user.displayName || amPlayerDisplayName(), isBot: false });
      transaction.update(ref, { players, playerUids: players.map((entry) => entry.uid), updatedAtMs: Date.now() });
    });
    const joinedSnapshot = await fb.getDoc(ref);
    if (!joinedSnapshot.exists()) throw new Error("Dieser Raum wurde nicht gefunden.");
    amRuntime.onlineId = code;
    amRuntime.onlineDoc = { id: code, viewerUid: user.uid, ...joinedSnapshot.data() };
    amRuntime.view = "online";
    amRememberRoom(code);
    amHideBoardForLobby();
    amRefreshApp();
    await amWatchRoom(code, false);
  }

  async function amWatchRoom(code, waitForFirstSnapshot = true) {
    const fb = await amFirebase();
    const user = amRequireOnlineUser(fb);
    amRuntime.onlineUnsub?.();
    amRuntime.onlineId = code;
    const ref = fb.doc(fb.db, AM_COLLECTION, code);

    let settleFirst = null;
    const firstSnapshot = waitForFirstSnapshot ? new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        if (settleFirst) settleFirst = null;
        reject(new Error("Der Online-Raum antwortet nicht. Bitte Verbindung prüfen und erneut versuchen."));
      }, 12000);
      settleFirst = {
        resolve(value) { window.clearTimeout(timer); settleFirst = null; resolve(value); },
        reject(error) { window.clearTimeout(timer); settleFirst = null; reject(error); }
      };
    }) : Promise.resolve(null);

    amRuntime.onlineUnsub = fb.onSnapshot(ref, (snapshot) => {
      const previousStatus = amRuntime.onlineDoc?.status || "";
      if (!snapshot.exists()) {
        const error = new Error("Der Online-Raum wurde geschlossen.");
        settleFirst?.reject(error);
        amToast(error.message);
        amForgetRoom();
        amDisconnectRoom(false);
        return;
      }
      const nextDoc = { id: snapshot.id, viewerUid: user.uid, ...snapshot.data() };
      if (nextDoc.gameState) nextDoc.gameState = amNormalizeLocalGame(nextDoc.gameState);
      amRuntime.onlineDoc = nextDoc;
      if (nextDoc.gameState) amMaybeAwardWin(nextDoc.gameState);
      amRememberRoom(code);
      settleFirst?.resolve(nextDoc);

      if (nextDoc.status === "lobby") {
        amRuntime.view = "online";
        amHideBoardForLobby();
      }

      const openedBoard = nextDoc.status === "playing" && previousStatus !== "playing" && nextDoc.gameState;
      if (openedBoard) {
        // Das Brett öffnet sich auch dann zuverlässig, wenn der erste Snapshot
        // bereits nach dem Start eintrifft oder die Lobbyansicht neu gerendert wurde.
        amOpenBoard();
        amRefreshApp();
      } else {
        amRenderAll();
      }
      amScheduleBot();
      amAutoResolveNoMove();
    }, (error) => {
      const readable = new Error(amOnlineErrorText(error));
      settleFirst?.reject(readable);
      amToast(`Raumverbindung: ${readable.message}`);
    });

    return firstSnapshot;
  }

  async function amStartOnline(shell) {
    const fb = await amFirebase();
    const user = amRequireOnlineUser(fb);
    const roomId = amRuntime.onlineId;
    if (!roomId) throw new Error("Kein Online-Raum ausgewählt.");
    const ref = fb.doc(fb.db, AM_COLLECTION, roomId);
    let startedRoom = null;
    await fb.runTransaction(fb.db, async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw new Error("Raum nicht gefunden.");
      const room = snapshot.data();
      if (room.hostUid !== user.uid) throw new Error("Nur der Host kann starten.");
      if (room.status !== "lobby") {
        startedRoom = room;
        return;
      }
      const activeShell = shell?.isConnected ? shell : document.querySelector("#detailDialog .device-shell:last-of-type");
      const fillBots = !!activeShell?.querySelector("[data-am-lobby-fill-bots]")?.checked;
      const humans = (room.players || []).filter((entry) => !entry.isBot);
      if (humans.length < 2 && !fillBots) throw new Error("Mindestens zwei Online-Spieler werden benötigt.");
      const requestedTotal = Math.max(2, Math.min(4, Number(room.maxPlayers || 4)));
      const actualTotal = fillBots ? requestedTotal : Math.max(2, humans.length);
      const players = amCreatePlayers(actualTotal, true, humans);
      const gameState = amCreateGame(players, true, amRoomBoardStyle(room));
      startedRoom = {
        ...room,
        fillBots,
        players: players.map((player) => ({ uid: player.uid, name: player.name, isBot: player.isBot })),
        playerUids: humans.map((entry) => entry.uid),
        gameState,
        status: "playing",
        updatedAtMs: Date.now()
      };
      transaction.update(ref, {
        fillBots: startedRoom.fillBots,
        players: startedRoom.players,
        playerUids: startedRoom.playerUids,
        gameState,
        status: "playing",
        updatedAtMs: startedRoom.updatedAtMs
      });
    });

    if (!startedRoom?.gameState) {
      const snapshot = await fb.getDoc(ref);
      if (!snapshot.exists()) throw new Error("Raum wurde während des Starts geschlossen.");
      startedRoom = snapshot.data();
    }
    amRuntime.onlineDoc = { id: roomId, viewerUid: user.uid, ...startedRoom };
    await amOpenBoardAfterDialogClose();
    amRefreshApp();
  }

  async function amOnlineRematch() {
    if (!amRuntime.onlineId || !amIsHost()) return;
    const fb = await amFirebase();
    const ref = fb.doc(fb.db, AM_COLLECTION, amRuntime.onlineId);
    await fb.runTransaction(fb.db, async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw new Error("Raum nicht gefunden.");
      const room = snapshot.data();
      const players = amClone(room.gameState?.players || []).map((player) => ({ ...player, points: 0, skipTurns: 0 }));
      transaction.update(ref, { gameState: amCreateGame(players, true, room.gameState?.boardStyle || amRoomBoardStyle(room)), status: "playing", winnerName: "", updatedAtMs: Date.now() });
    });
  }

  async function amLeaveRoom() {
    if (!amRuntime.onlineId) return;
    try {
      const fb = await amFirebase();
      const user = amRequireOnlineUser(fb);
      const ref = fb.doc(fb.db, AM_COLLECTION, amRuntime.onlineId);
      await fb.runTransaction(fb.db, async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists()) return;
        const room = snapshot.data();
        if (room.status !== "lobby") return;
        if (room.hostUid === user.uid) {
          transaction.delete(ref);
          return;
        }
        const players = (room.players || []).filter((entry) => entry.uid !== user.uid);
        transaction.update(ref, { players, playerUids: players.map((entry) => entry.uid), updatedAtMs: Date.now() });
      });
    } catch (error) {
      amToast(amOnlineErrorText(error));
    }
    amDisconnectRoom(false);
  }

  function amDisconnectRoom(refresh = true) {
    amForgetRoom();
    amRuntime.onlineUnsub?.();
    amRuntime.onlineUnsub = null;
    amRuntime.onlineDoc = null;
    amRuntime.onlineId = "";
    amRuntime.view = "online";
    amCloseBoard();
    if (refresh) amRefreshApp();
  }

  function amStopPublicRooms() {
    amRuntime.publicUnsub?.();
    amRuntime.publicUnsub = null;
    amRuntime.publicRooms = [];
  }

  async function amRestoreOnlineRoom() {
    if (amRuntime.onlineId && amRuntime.onlineDoc) return true;
    const code = amStoredRoom();
    if (!code) return false;
    try {
      await amWatchRoom(code, true);
      amRuntime.view = "online";
      amRefreshApp();
      return true;
    } catch (error) {
      amForgetRoom();
      amRuntime.onlineId = "";
      amRuntime.onlineDoc = null;
      amToast(amOnlineErrorText(error));
      return false;
    }
  }

  async function amListenPublicRooms() {
    const fb = await amFirebase();
    amRequireOnlineUser(fb);
    amRuntime.publicUnsub?.();
    const query = fb.query(fb.collection(fb.db, AM_COLLECTION), fb.where("visibility", "==", "public"), fb.where("status", "==", "lobby"), fb.limit(30));
    amRuntime.publicUnsub = fb.onSnapshot(query, (snapshot) => {
      amRuntime.publicRooms = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((room) => room.status === "lobby" && room.visibility === "public" && (room.players?.length || 0) < Number(room.maxPlayers || 4))
        .sort((a, b) => Number(b.updatedAtMs || 0) - Number(a.updatedAtMs || 0));
      if (amRuntime.view === "online") amRefreshApp();
    }, (error) => amToast(`Lobby-Liste: ${amOnlineErrorText(error)}`));
  }

  async function amRunAppAction(button, action) {
    if (amRuntime.appBusy) return;
    amRuntime.appBusy = true;
    const previousDisabled = !!button?.disabled;
    if (button) button.disabled = true;
    try {
      await action();
    } catch (error) {
      console.error("MRDN.KL Online-Aktion", error);
      amToast(amOnlineErrorText(error));
    } finally {
      amRuntime.appBusy = false;
      if (button?.isConnected) button.disabled = previousDisabled;
    }
  }

  async function amAppDelegatedClick(event) {
    const shell = event.currentTarget;
    const button = event.target.closest("button");
    if (!button || !shell.contains(button)) return;

    const appAction = button.dataset.amApp;
    if (appAction) {
      if (appAction === "resume") { amOpenBoard(); return; }
      if (appAction === "online") {
        amRuntime.view = "online";
        amRefreshApp();
        await amRunAppAction(button, async () => {
          const restored = await amRestoreOnlineRoom();
          if (!restored) await amListenPublicRooms();
        });
        return;
      }
      amStopPublicRooms();
      amRuntime.view = appAction;
      amRefreshApp();
      return;
    }
    if (button.matches("[data-am-start-local]")) {
      await amRunAppAction(button, () => amStartLocal(shell));
      return;
    }
    if (button.matches("[data-am-create-room]")) {
      await amRunAppAction(button, () => amCreateRoom(shell));
      return;
    }
    if (button.matches("[data-am-join-code]")) {
      await amRunAppAction(button, () => amJoinRoom(shell.querySelector("[data-am-room-code]")?.value));
      return;
    }
    if (button.matches("[data-am-join-room]")) {
      await amRunAppAction(button, () => amJoinRoom(button.dataset.amJoinRoom));
      return;
    }
    if (button.matches("[data-am-refresh-rooms]")) {
      await amRunAppAction(button, () => amListenPublicRooms());
      return;
    }
    if (button.matches("[data-am-start-online]")) {
      await amRunAppAction(button, () => amStartOnline(shell));
      return;
    }
    if (button.matches("[data-am-leave-room]")) { await amLeaveRoom(); return; }
    if (button.matches("[data-am-online-disconnect]")) { amDisconnectRoom(); return; }
    if (button.matches("[data-am-leave-view]")) {
      amStopPublicRooms();
      amRuntime.view = "home";
      amRefreshApp();
      return;
    }
    if (button.matches("[data-am-copy-room-code]")) {
      try { await navigator.clipboard.writeText(amRuntime.onlineId); amToast("Raumcode kopiert."); }
      catch { amToast(`Raumcode: ${amRuntime.onlineId}`); }
    }
  }

  function amAppDelegatedChange(event) {
    const input = event.target;
    if (!input?.matches?.('input[type="radio"][name="am-local-board"], input[type="radio"][name="am-online-board"]')) return;
    const fieldset = input.closest(".am-board-choice");
    fieldset?.querySelectorAll(":scope > label").forEach((label) => label.classList.toggle("selected", label.contains(input)));
  }

  function amBindApp(shell) {
    if (!shell) return;
    // Event-Delegation bleibt auch dann aktiv, wenn die Handy-App ihren Inhalt
    // beim Wechsel zwischen Menü, Lobby und Spielstatus komplett neu rendert.
    if (shell.dataset.amDelegatedVersion === AM_VERSION) return;
    shell.dataset.amDelegatedVersion = AM_VERSION;
    shell.addEventListener("click", amAppDelegatedClick);
    shell.addEventListener("change", amAppDelegatedChange);
  }

  // MRDN.KL bleibt als eigenständige Multiplayer-App im Life App Store.
  const storeApps = [
    {
      id: AM_APP_ID,
      label: "MRDN.KL",
      icon: "M",
      minTier: 1,
      status: "available",
      description: "Taktisches Brettspiel für 2–4 Spieler mit Bots, Online-Lobbys, Privatcodes, Points und Extras."
    }
  ];
  storeApps.forEach((entry) => {
    const existing = phoneAppStoreCatalog.find((app) => app.id === entry.id);
    if (existing) Object.assign(existing, entry);
    else phoneAppStoreCatalog.push(entry);
  });

  const amBasePhoneAppStoreHtml = phoneAppStoreHtml;
  phoneAppStoreHtml = function amPhoneAppStoreHtml(item) {
    return amBasePhoneAppStoreHtml(item).replace(
      /<p class="device-hint">[\s\S]*?<\/p>\s*<\/div>\s*$/,
      `<p class="device-hint">MRDN.KL wird einzeln installiert. Die Installation bleibt nach dem Neuladen erhalten.</p></div>`
    );
  };

  const amBaseDeviceAppsFor = deviceAppsFor;
  deviceAppsFor = function amDeviceAppsFor(item) {
    const apps = amBaseDeviceAppsFor(item);
    if (!phoneItems().includes(item)) return apps;
    const tier = deviceTier(item);
    const missingTier = tier < 1;
    const missingSim = !hasPhoneSim();

    if (isPhoneAppInstalled(AM_APP_ID) && !apps.some((app) => app.id === AM_APP_ID)) {
      apps.push({
        id: AM_APP_ID,
        min: 1,
        data: true,
        label: "MRDN.KL",
        icon: "M",
        text: "Taktisches Brettspiel mit Point-Shop – gegen Bots oder online für zwei bis vier Spieler.",
        layoutClass: "device-downloaded-app am-app-icon",
        locked: missingTier,
        lockText: missingTier ? "Benötigt mindestens ein Einsteiger-Smartphone." : missingSim ? "Bot-Spiele funktionieren ohne SIM. Für Online-Lobbys wird eine SIM-Karte benötigt." : ""
      });
    }
    return apps;
  };

  const amBaseDeviceAppActions = deviceAppActions;
  deviceAppActions = function amDeviceAppActions(appId, item) {
    if (appId === AM_APP_ID) return amAppHtml();
    return amBaseDeviceAppActions(appId, item);
  };

  const amBaseOpenDeviceAppDirect = openDeviceAppDirect;
  openDeviceAppDirect = function amOpenDeviceAppDirect(item, appId) {
    if (appId === AM_APP_ID) return openDeviceInterface(item, AM_APP_ID, false);
    return amBaseOpenDeviceAppDirect(item, appId);
  };

  const amBaseOpenDeviceInterface = openDeviceInterface;
  openDeviceInterface = function amOpenDeviceInterface(item, activeApp = "home", activeUse = true) {
    const result = amBaseOpenDeviceInterface(item, activeApp, activeUse);
    const shell = document.querySelector("#detailDialog .device-shell:last-of-type") || document.querySelector("#detailDialog .device-shell");
    if (activeApp === AM_APP_ID) amBindApp(shell);
    return result;
  };

  document.addEventListener("keydown", (event) => {
    if (!amRuntime.overlay?.classList.contains("show")) return;
    if (event.target?.matches?.("input, textarea, select")) return;
    const game = amCurrentGame();
    if (!game) return;
    if (event.key === "Escape") {
      if (amRuntime.pendingExtra) {
        amRuntime.pendingExtra = "";
        amRuntime.swapOwn = null;
        amRenderOverlay();
      } else {
        amCloseBoard();
      }
      return;
    }
    if (event.code === "Space") {
      event.preventDefault();
      if (!amCurrentCanAct(game) || amRuntime.busy) return;
      if (game.phase === "roll") amMutate((next) => amRollMutation(next));
      else if (game.phase === "move" && !amLegalMoves(game).length) amMutate((next) => amEndTurnMutation(next));
    }
  });

  document.addEventListener("fullscreenchange", () => {
    amRuntime.fullscreen = !!document.fullscreenElement;
    amRenderOverlay();
  });

  window.MRDNKL = window.AergerMenschKL = {
    version: AM_VERSION,
    openBotParty: (total = 4, boardStyle = "neon") => {
      const count = Math.max(2, Math.min(4, Number(total || 4)));
      const players = amCreatePlayers(count, false);
      amRuntime.onlineId = "";
      amRuntime.onlineDoc = null;
      amRuntime.backgroundPaused = false;
      amRuntime.boardVisibleBeforeBackground = false;
      amSetLocalGame(amCreateGame(players, false, boardStyle));
      amRuntime.view = "home";
      amOpenBoard();
      return true;
    },
    resume: amOpenBoard,
    getGame: amCurrentGame,
    suspend: amPauseForBackground,
    ownerSnapshot: amOwnerSnapshot,
    ownerGrantPoints: amOwnerGrantPoints,
    ownerSetNextRoll: amOwnerSetNextRoll,
    ownerIngameVisible: amOwnerIngameVisible,
    setOwnerIngameVisible: amSetOwnerIngameVisible,
    debug: {
      createGame: (total = 4, boardStyle = "neon") => amCreateGame(amCreatePlayers(Math.max(2, Math.min(4, Number(total || 4))), false), false, boardStyle),
      roll: amRollMutation,
      move: amMoveMutation,
      legalMoves: amLegalMoves,
      boardHtml: amBoardSvg,
      extra: amExtraMutation,
      normalizeGame: amNormalizeLocalGame,
      appHtml: amAppHtml,
      gameHtml: amGameOverlayHtml,
      bindApp: amBindApp
    }
  };

  document.addEventListener("click", (event) => {
    const button = event.target.closest?.("[data-am-start-local]");
    if (!button) return;
    // Der Start wird zentral im Capture-Handler ausgeführt. Dadurch funktioniert
    // er auch dann, wenn die Handyansicht kurz zuvor neu gerendert wurde und ein
    // direkter Button-Listener verloren gegangen wäre.
    const shell = button.closest(".device-shell") || document.querySelector("#detailDialog .device-shell:last-of-type");
    // In der normalen App übernimmt der delegierte Shell-Handler. Der Capture-
    // Fallback ist nur für sehr alte oder noch nicht gebundene Handyansichten da.
    if (shell?.dataset.amDelegatedVersion === AM_VERSION) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const count = Number(shell?.querySelector("[data-am-local-count]")?.value || 4);
    const boardStyle = shell?.querySelector('input[name="am-local-board"]:checked')?.value === "classic" ? "classic" : "neon";
    Promise.resolve(amStartLocal(shell)).then((started) => {
      window.setTimeout(() => {
        if (!started || !amRuntime.overlay?.classList.contains("show")) {
          console.warn("MRDN.KL: direkter Start fehlgeschlagen, sicherer Fallback wird verwendet.");
          window.AergerMenschKL.openBotParty(count, boardStyle);
        }
      }, 120);
    }).catch((error) => {
      console.error("MRDN.KL Bot-Start", error);
      window.AergerMenschKL.openBotParty(count, boardStyle);
    });
  }, true);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) amPauseForBackground();
    else amResumeFromBackground();
  });
  window.addEventListener("pageshow", amResumeFromBackground);

  window.addEventListener("beforeunload", () => {
    amRuntime.onlineUnsub?.();
    amStopPublicRooms();
  });
})();
