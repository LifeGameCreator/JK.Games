(() => {
  "use strict";

  const VERSION = "20260823-royal-bluff-v1";
  const COLLECTION = "royalBluffKlRooms";
  const MAX_PLAYERS = 4;
  const MAX_CARDS_TOTAL = 5;
  const MAX_PLAY_CARDS = 3;
  const START_LIVES = 6;
  const BOT_NAMES = ["Mara", "Viktor", "Nova"];
  const RANKS = Object.freeze([
    { id: "K", label: "K", name: "König", table: "KING'S TABLE" },
    { id: "A", label: "A", name: "Ass", table: "ACE TABLE" },
    { id: "Q", label: "Q", name: "Dame", table: "QUEEN'S TABLE" },
    { id: "J", label: "J", name: "Bube", table: "JACK'S TABLE" },
    { id: "10", label: "10", name: "Zehn", table: "TEN TABLE" }
  ]);
  const RANK_BY_ID = Object.freeze(Object.fromEntries(RANKS.map((rank) => [rank.id, rank])));
  const SUITS = Object.freeze(["♠", "♥", "♦", "♣"]);
  const BOT_LEVELS = Object.freeze({
    easy: { id: "easy", name: "Leicht", challenge: .24, hiddenChallenge: .10, bluff: .42, hiddenBluff: .30, think: 1050 },
    medium: { id: "medium", name: "Mittel", challenge: .42, hiddenChallenge: .18, bluff: .32, hiddenBluff: .22, think: 820 },
    hard: { id: "hard", name: "Schwer", challenge: .62, hiddenChallenge: .28, bluff: .23, hiddenBluff: .14, think: 620 }
  });
  const CARD_SKINS = Object.freeze([
    { id: "bronze", name: "Bronze", price: 0, desc: "Warme Kupferprägung." },
    { id: "silver", name: "Silber", price: 0, desc: "Kühle Metallkante." },
    { id: "gold", name: "Gold", price: 0, desc: "Royal-Gold mit schwarzem Kern." },
    { id: "diamond", name: "Diamant", price: 0, desc: "Kristalloptik mit Eisglanz." },
    { id: "platinum", name: "Platin", price: 150, desc: "Animierter Premium-Rand für JK/Coin." }
  ]);
  const TABLE_SKINS = Object.freeze([
    { id: "velvet", name: "Black Velvet", price: 0, desc: "Dunkler klassischer Bluff-Tisch." },
    { id: "oak", name: "Royal Oak", price: 0, desc: "Dunkles Holz mit grünem Filz." },
    { id: "silver", name: "Silver Hall", price: 0, desc: "Kühles Metall und anthrazitfarbener Filz." },
    { id: "diamond", name: "Diamond Night", price: 0, desc: "Blaues Licht auf schwarzem Filz." },
    { id: "platinum", name: "Platinum Vault", price: 250, desc: "Premium-Tisch mit wanderndem Platinlicht." }
  ]);

  let overlay = null;
  let phoneItem = "";
  let game = null;
  let selectedCards = new Set();
  let selectedPlayers = 2;
  let selectedBotDifficulty = "medium";
  let onlineLobby = null;
  let botTimer = 0;
  let pendingTimer = 0;
  let resolutionSeen = "";
  let dealAnimationRound = -1;
  let toastTimer = 0;

  const esc = (value) => String(value ?? "").replace(/[&<>\"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const uidSafe = (value) => String(value || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 100);
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function appState() {
    try { return window.JKGamesGetActiveState?.() || null; } catch { return null; }
  }

  function profileName() {
    const root = appState();
    const value = `${root?.firstName || ""} ${root?.lastName || ""}`.trim();
    return value || "Spieler";
  }

  function cosmeticState() {
    const root = appState();
    if (!root) return { cardSkin: "bronze", tableSkin: "velvet", ownedCardSkins: ["bronze", "silver", "gold", "diamond"], ownedTableSkins: ["velvet", "oak", "silver", "diamond"], stats: {} };
    root.royalBluffKl ||= {};
    const data = root.royalBluffKl;
    data.ownedCardSkins = Array.isArray(data.ownedCardSkins) ? data.ownedCardSkins : ["bronze", "silver", "gold", "diamond"];
    data.ownedTableSkins = Array.isArray(data.ownedTableSkins) ? data.ownedTableSkins : ["velvet", "oak", "silver", "diamond"];
    ["bronze", "silver", "gold", "diamond"].forEach((id) => { if (!data.ownedCardSkins.includes(id)) data.ownedCardSkins.push(id); });
    ["velvet", "oak", "silver", "diamond"].forEach((id) => { if (!data.ownedTableSkins.includes(id)) data.ownedTableSkins.push(id); });
    data.cardSkin = data.ownedCardSkins.includes(data.cardSkin) ? data.cardSkin : "bronze";
    data.tableSkin = data.ownedTableSkins.includes(data.tableSkin) ? data.tableSkin : "velvet";
    data.stats ||= {};
    data.stats.matches = Math.max(0, Number(data.stats.matches) || 0);
    data.stats.wins = Math.max(0, Number(data.stats.wins) || 0);
    data.stats.exposes = Math.max(0, Number(data.stats.exposes) || 0);
    data.stats.jokerSaves = Math.max(0, Number(data.stats.jokerSaves) || 0);
    return data;
  }

  function persist() {
    try { window.JKGamesPersistState?.(); } catch {}
  }

  function awardXp(amount, reason) {
    try { window.JKGamesAwardTopGameXp?.("royalbluff", amount, reason, { cooldownMs: 0 }); } catch {}
  }

  function toast(message) {
    if (!overlay) return;
    let node = overlay.querySelector(".rbkl-toast");
    if (!node) { node = document.createElement("div"); node.className = "rbkl-toast"; overlay.append(node); }
    node.textContent = String(message || "");
    node.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node?.classList.remove("show"), 2400);
  }

  function randomId(prefix = "rb") {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function roomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i += 1) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }


  function createHandKey() {
    const bytes = new Uint8Array(32);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  }

  function hexBytes(hex) {
    const clean = String(hex || "");
    if (!/^[0-9a-f]{64}$/i.test(clean)) throw new Error("Ungültiger Hand-Schlüssel.");
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i += 1) bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
    return bytes;
  }

  function bytesBase64(bytes) {
    let text = "";
    bytes.forEach((value) => { text += String.fromCharCode(value); });
    return btoa(text);
  }

  function base64Bytes(value) {
    const text = atob(String(value || ""));
    const bytes = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i += 1) bytes[i] = text.charCodeAt(i);
    return bytes;
  }

  async function importHandKey(keyHex, usages) {
    if (!window.crypto?.subtle) throw new Error("Sichere Kartenverschlüsselung wird von diesem Browser nicht unterstützt.");
    return window.crypto.subtle.importKey("raw", hexBytes(keyHex), { name: "AES-GCM" }, false, usages);
  }

  async function encryptPrivateCards(payload, keyHex) {
    const key = await importHandKey(keyHex, ["encrypt"]);
    const iv = new Uint8Array(12);
    window.crypto.getRandomValues(iv);
    const plain = new TextEncoder().encode(JSON.stringify(payload));
    const cipher = new Uint8Array(await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain));
    return `${bytesBase64(iv)}.${bytesBase64(cipher)}`;
  }

  async function decryptPrivateCards(value, keyHex) {
    if (!value || !keyHex) return null;
    try {
      const [ivPart, cipherPart] = String(value).split(".");
      if (!ivPart || !cipherPart) return null;
      const key = await importHandKey(keyHex, ["decrypt"]);
      const plain = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: base64Bytes(ivPart) }, key, base64Bytes(cipherPart));
      return JSON.parse(new TextDecoder().decode(plain));
    } catch (error) {
      console.warn("Royal Bluff.KL private hand decrypt", error);
      return null;
    }
  }

  function buildDeck() {
    const deck = [];
    RANKS.forEach((rank) => {
      for (let copy = 0; copy < 2; copy += 1) {
        SUITS.forEach((suit, suitIndex) => deck.push({ id: `${rank.id}-${copy}-${suitIndex}-${randomId("c")}`, rank: rank.id, suit, joker: false }));
      }
    });
    for (let i = 0; i < 3; i += 1) deck.push({ id: `JK-${i}-${randomId("c")}`, rank: "JK", suit: "★", joker: true });
    return deck;
  }

  function shuffle(array) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function rankLabel(card) {
    return card?.joker ? "JOKER" : (RANK_BY_ID[card?.rank]?.label || "?");
  }

  function cardHtml(card, { back = false, small = false, selectable = false, selected = false, index = 0, deal = false, skin = "bronze" } = {}) {
    const classes = ["rbkl-card", `skin-${skin}`];
    if (back) classes.push("back");
    if (small) classes.push("small");
    if (selectable) classes.push("selectable");
    if (selected) classes.push("selected");
    if (deal) classes.push("deal-in");
    const red = !card?.joker && (card?.suit === "♥" || card?.suit === "♦");
    if (red) classes.push("red");
    const attrs = selectable ? ` data-rbkl-card-id="${esc(card.id)}"` : "";
    const style = deal ? ` style="--deal-delay:${Math.min(1500, index * 95)}ms"` : "";
    if (back) return `<button type="button" class="${classes.join(" ")}"${attrs}${style} aria-label="Verdeckte Karte"><span class="rbkl-card-back-mark">RB</span><i>ROYAL<br>BLUFF</i></button>`;
    if (card?.joker) return `<button type="button" class="${classes.join(" ")}"${attrs}${style}><span class="rbkl-corner">★</span><strong>JOKER</strong><em>♛</em><span class="rbkl-corner bottom">★</span></button>`;
    return `<button type="button" class="${classes.join(" ")}"${attrs}${style}><span class="rbkl-corner">${esc(rankLabel(card))}<small>${esc(card?.suit || "")}</small></span><strong>${esc(rankLabel(card))}</strong><em>${esc(card?.suit || "")}</em><span class="rbkl-corner bottom">${esc(rankLabel(card))}<small>${esc(card?.suit || "")}</small></span></button>`;
  }

  function makePlayers(humans, total, difficulty) {
    const players = humans.map((human, index) => ({
      id: index,
      uid: human.uid || `local-${index}`,
      name: human.name || `Spieler ${index + 1}`,
      bot: false,
      difficulty: "",
      lives: START_LIVES,
      eliminated: false,
      hand: [],
      hidden: null,
      hiddenUsedRound: 0
    }));
    while (players.length < total) {
      const index = players.length;
      players.push({ id: index, uid: `bot-${index}`, name: BOT_NAMES[index - humans.length] || `Bot ${index}`, bot: true, difficulty, lives: START_LIVES, eliminated: false, hand: [], hidden: null, hiddenUsedRound: 0 });
    }
    return players;
  }

  function newMatch(players, meta = {}) {
    const state = {
      version: VERSION,
      matchId: randomId("match"),
      online: !!meta.online,
      roomId: meta.roomId || "",
      phase: "playing",
      round: 0,
      turn: 0,
      players: players.map((p, index) => ({ ...p, id: index, lives: START_LIVES, eliminated: false, hand: [], hidden: null, hiddenUsedRound: 0 })),
      activeIndex: 0,
      tableRank: "K",
      tableCard: null,
      pile: [],
      lastPlay: null,
      deckCount: 0,
      log: [],
      lastResolution: null,
      winnerIndex: -1,
      updatedAtMs: Date.now(),
      roundStartedAtMs: Date.now(),
      lastCommandId: ""
    };
    beginRound(state, { reason: "match-start" });
    return state;
  }

  function livingPlayers(state = game) {
    return (state?.players || []).filter((player) => !player.eliminated);
  }

  function nextLivingIndex(state, fromIndex, requireCards = false) {
    const total = state.players.length;
    for (let step = 1; step <= total; step += 1) {
      const index = (fromIndex + step) % total;
      const player = state.players[index];
      if (!player?.eliminated && (!requireCards || player.hand.length > 0)) return index;
    }
    return -1;
  }

  function addLog(state, text, tone = "") {
    state.log.unshift({ id: randomId("log"), text: String(text), tone, at: Date.now() });
    state.log = state.log.slice(0, 14);
  }

  function drawTableCard(deck) {
    let tries = 0;
    let working = deck;
    while (tries < 12) {
      if (!working.length) working = shuffle(buildDeck());
      const card = working.shift();
      if (!card?.joker) {
        const marker = { ...card, id: `table-${card.id}` };
        working.push(card);
        working = shuffle(working);
        return { card: marker, deck: working, reshuffles: tries };
      }
      working.push(card);
      working = shuffle(working);
      tries += 1;
    }
    const fallback = working.findIndex((card) => !card.joker);
    const [card] = working.splice(Math.max(0, fallback), 1);
    return { card, deck: working, reshuffles: tries };
  }

  function beginRound(state, { reason = "round", natural = false } = {}) {
    if (!state) return;
    if (livingPlayers(state).length <= 1) return finishMatch(state);

    if (natural) {
      state.players.forEach((player) => {
        if (player.eliminated || !player.hidden) return;
        player.lives = Math.min(START_LIVES, player.lives + 1);
        addLog(state, `${player.name}s verdeckte Karte blieb unangetastet: +1 Leben.`, "joker");
        player.hidden = null;
      });
    }

    state.round += 1;
    state.turn = 1;
    state.phase = "playing";
    state.pile = [];
    state.lastPlay = null;
    let deck = shuffle(buildDeck());
    const table = drawTableCard(deck);
    deck = table.deck;
    state.tableCard = table.card;
    state.tableRank = table.card.rank;
    if (table.reshuffles > 0) addLog(state, `Joker als erste Karte: ${table.reshuffles}× neu gemischt.`, "joker");

    state.players.forEach((player) => {
      if (player.eliminated) { player.hand = []; return; }
      const targetHand = Math.max(0, MAX_CARDS_TOTAL - (player.hidden ? 1 : 0));
      player.hand = [];
      player.hiddenUsedRound = player.hidden ? state.round : 0;
      while (player.hand.length < targetHand && deck.length) player.hand.push(deck.shift());
    });
    state.deckCount = deck.length;
    const aliveIndexes = state.players.map((p, i) => !p.eliminated ? i : -1).filter((i) => i >= 0);
    state.activeIndex = aliveIndexes[(state.round - 1) % aliveIndexes.length] ?? aliveIndexes[0] ?? 0;
    state.roundStartedAtMs = Date.now();
    state.updatedAtMs = Date.now();
    addLog(state, `${RANK_BY_ID[state.tableRank]?.table || "ROYAL TABLE"} startet.`, "table");
    if (reason === "match-start") addLog(state, "Deck gemischt. Karten werden aus der Mitte ausgeteilt.", "deal");
  }

  function finishMatch(state) {
    const winnerIndex = state.players.findIndex((player) => !player.eliminated);
    state.winnerIndex = winnerIndex;
    state.phase = "finished";
    state.activeIndex = -1;
    state.updatedAtMs = Date.now();
    if (winnerIndex >= 0) addLog(state, `${state.players[winnerIndex].name} gewinnt Royal Bluff.KL.`, "win");
  }

  function cardIsTableTruth(card, state = game) {
    return !!card && (card.joker || card.rank === state.tableRank);
  }

  function removeCardsFromHand(player, ids) {
    const wanted = new Set(ids);
    const removed = [];
    player.hand = player.hand.filter((card) => {
      if (wanted.has(card.id)) { removed.push(card); wanted.delete(card.id); return false; }
      return true;
    });
    return removed;
  }

  function applyRisk(state, playerIndex, count, reason) {
    const player = state.players[playerIndex];
    const spins = [];
    for (let i = 0; i < count && player && !player.eliminated; i += 1) {
      const before = Math.max(1, player.lives);
      const hit = Math.random() < (1 / before);
      if (hit) {
        player.lives = 0;
        player.eliminated = true;
        player.hand = [];
        spins.push({ before, hit: true });
        addLog(state, `${player.name}: Risiko ${i + 1}/${count} – ausgeschieden.`, "danger");
      } else {
        player.lives = Math.max(1, before - 1);
        spins.push({ before, hit: false, after: player.lives });
        addLog(state, `${player.name}: Risiko ${i + 1}/${count} überlebt. ${player.lives} Leben verbleiben.`, "safe");
      }
    }
    return { playerIndex, playerName: player?.name || "", reason, spins };
  }

  function rewardLife(state, playerIndex, reason) {
    const player = state.players[playerIndex];
    if (!player || player.eliminated) return { playerIndex, before: 0, after: 0, reason };
    const before = player.lives;
    player.lives = Math.min(START_LIVES, player.lives + 1);
    const after = player.lives;
    addLog(state, `${player.name}: ${after > before ? "+1 Leben" : "bereits bei 6 Leben"} (${reason}).`, "joker");
    return { playerIndex, before, after, reason };
  }

  function naturalRoundCheck(state) {
    const alive = livingPlayers(state);
    if (!alive.length) return finishMatch(state);
    if (alive.every((player) => player.hand.length === 0)) {
      state.lastResolution = { id: randomId("res"), type: "natural", title: "RUNDE OHNE EXPOSE", text: "Alle Hände sind leer. Ungestörte verdeckte Karten geben +1 Leben.", at: Date.now() };
      beginRound(state, { reason: "natural", natural: true });
      return true;
    }
    return false;
  }

  function advanceTurn(state, fromIndex) {
    if (livingPlayers(state).length <= 1) return finishMatch(state);
    if (naturalRoundCheck(state)) return;
    const next = nextLivingIndex(state, fromIndex, true);
    if (next < 0) return beginRound(state, { reason: "no-cards", natural: true });
    state.activeIndex = next;
    state.turn += 1;
    state.updatedAtMs = Date.now();
  }

  function playCards(state, actorIndex, ids) {
    const player = state.players[actorIndex];
    const clean = [...new Set(ids)].slice(0, MAX_PLAY_CARDS);
    if (!player || clean.length < 1 || clean.length > MAX_PLAY_CARDS) throw new Error("Wähle 1 bis 3 Karten.");
    const cards = removeCardsFromHand(player, clean);
    if (cards.length !== clean.length) throw new Error("Mindestens eine Karte ist nicht mehr auf deiner Hand.");
    const play = { id: randomId("play"), actorIndex, count: cards.length, cards, declaredRank: state.tableRank, turn: state.turn, at: Date.now() };
    state.pile.push({ id: play.id, actorIndex, count: cards.length });
    state.pile = state.pile.slice(-22);
    state.lastPlay = play;
    addLog(state, `${player.name} legt ${cards.length} ${cards.length === 1 ? "Karte" : "Karten"}: „${RANK_BY_ID[state.tableRank]?.name || "Table"}“.`, "play");
    advanceTurn(state, actorIndex);
  }

  function playHidden(state, actorIndex, id) {
    const player = state.players[actorIndex];
    if (!player) throw new Error("Spieler fehlt.");
    if (player.hidden) throw new Error("Du hast bereits eine aktive verdeckte Karte.");
    if (player.hiddenUsedRound === state.round) throw new Error("Du hast in dieser Runde bereits eine verdeckte Karte benutzt.");
    const cards = removeCardsFromHand(player, [id]);
    if (cards.length !== 1) throw new Error("Diese Karte ist nicht mehr auf deiner Hand.");
    player.hidden = { id: randomId("hidden"), card: cards[0], placedRound: state.round, placedTurn: state.turn };
    player.hiddenUsedRound = state.round;
    state.lastPlay = null;
    addLog(state, `${player.name} legt eine persönliche Karte verdeckt ab und behauptet: „Joker“.`, "joker");
    advanceTurn(state, actorIndex);
  }

  function challengePlay(state, challengerIndex) {
    const play = state.lastPlay;
    if (!play) throw new Error("Es gibt keinen unmittelbar vorherigen Table-Zug zum Exposen.");
    if (play.actorIndex === challengerIndex) throw new Error("Du kannst deinen eigenen Zug nicht exposen.");
    const actor = state.players[play.actorIndex];
    const challenger = state.players[challengerIndex];
    const truthful = play.cards.every((card) => cardIsTableTruth(card, state));
    const resolution = {
      id: randomId("res"), type: "table-expose", challengerIndex, actorIndex: play.actorIndex,
      title: truthful ? "WAHRHEIT" : "LÜGE AUFGEDECKT", truthful,
      revealed: play.cards, hiddenRevealed: null, risks: [], rewards: [], at: Date.now()
    };

    if (truthful) {
      addLog(state, `${challenger.name} exposed ${actor.name} – aber die Table-Karten waren korrekt.`, "safe");
      resolution.risks.push(applyRisk(state, challengerIndex, 1, "Falscher Expose"));
      resolution.text = `${actor.name}s Table-Karten waren korrekt. Die persönliche verdeckte Karte bleibt geheim.`;
    } else {
      addLog(state, `${challenger.name} erwischt ${actor.name} beim Bluff.`, "danger");
      resolution.risks.push(applyRisk(state, play.actorIndex, 1, "Table-Lüge"));
      resolution.text = `${actor.name}s Table-Karten waren falsch.`;
      if (actor.hidden) {
        resolution.hiddenRevealed = actor.hidden.card;
        if (actor.hidden.card.joker) {
          const reward = rewardLife(state, play.actorIndex, "echter verdeckter Joker");
          resolution.rewards.push(reward);
          resolution.text += " Der zusätzlich aufgedeckte verdeckte Joker war echt: +1 Leben (max. 6).";
        } else {
          resolution.risks.push(applyRisk(state, play.actorIndex, 2, "Falscher verdeckter Joker"));
          resolution.text += " Die persönliche verdeckte Karte war ebenfalls kein Joker: +2 weitere Risiken.";
        }
        actor.hidden = null;
      }
    }

    state.lastResolution = resolution;
    const stats = cosmeticState().stats;
    if (state.players[challengerIndex]?.uid === localUid()) stats.exposes += 1;
    if (livingPlayers(state).length <= 1) finishMatch(state);
    else beginRound(state, { reason: "expose" });
  }

  function challengeHidden(state, challengerIndex, targetIndex) {
    const target = state.players[targetIndex];
    const challenger = state.players[challengerIndex];
    if (!target?.hidden) throw new Error("Diese verdeckte Karte existiert nicht mehr.");
    if (targetIndex === challengerIndex) throw new Error("Du kannst deine eigene verdeckte Karte nicht exposen.");
    const card = target.hidden.card;
    const truthful = !!card.joker;
    const resolution = {
      id: randomId("res"), type: "hidden-expose", challengerIndex, actorIndex: targetIndex,
      title: truthful ? "ECHTER JOKER" : "JOKER-BLUFF ERWISCHT", truthful,
      revealed: [], hiddenRevealed: card, risks: [], rewards: [], at: Date.now()
    };
    if (truthful) {
      resolution.rewards.push(rewardLife(state, targetIndex, "echter verdeckter Joker"));
      resolution.risks.push(applyRisk(state, challengerIndex, 1, "Falscher Joker-Expose"));
      resolution.text = `${target.name} hat tatsächlich einen Joker gelegt. ${target.name} erhält +1 Leben, ${challenger.name} trägt 1 Risiko.`;
      if (target.uid === localUid()) cosmeticState().stats.jokerSaves += 1;
    } else {
      resolution.risks.push(applyRisk(state, targetIndex, 2, "Falscher verdeckter Joker"));
      resolution.text = `${target.name} hat beim persönlichen Joker geblufft und trägt 2 Risiken hintereinander.`;
    }
    target.hidden = null;
    state.lastResolution = resolution;
    if (state.players[challengerIndex]?.uid === localUid()) cosmeticState().stats.exposes += 1;
    if (livingPlayers(state).length <= 1) finishMatch(state);
    else beginRound(state, { reason: "hidden-expose" });
  }

  function applyAction(state, actorUid, type, payload = {}) {
    if (!state || state.phase !== "playing") throw new Error("Diese Aktion ist gerade nicht möglich.");
    const actorIndex = state.players.findIndex((player) => player.uid === actorUid);
    if (actorIndex < 0) throw new Error("Spieler nicht gefunden.");
    if (actorIndex !== state.activeIndex) throw new Error("Du bist gerade nicht dran.");
    const actor = state.players[actorIndex];
    if (actor.eliminated) throw new Error("Du bist bereits ausgeschieden.");
    if (type === "play") playCards(state, actorIndex, Array.isArray(payload.cardIds) ? payload.cardIds : []);
    else if (type === "hidden") playHidden(state, actorIndex, String(payload.cardId || ""));
    else if (type === "challengePlay") challengePlay(state, actorIndex);
    else if (type === "challengeHidden") challengeHidden(state, actorIndex, Number(payload.targetIndex));
    else throw new Error("Unbekannte Aktion.");
    state.updatedAtMs = Date.now();
    persist();
    return state;
  }

  function localUid() {
    if (onlineLobby?.uid) return onlineLobby.uid;
    return "local-player";
  }

  function localPlayerIndex() {
    return game?.players?.findIndex((player) => player.uid === localUid()) ?? -1;
  }

  function playerSeatClass(index) {
    const own = Math.max(0, localPlayerIndex());
    const total = game?.players?.length || 2;
    const relative = (index - own + total) % total;
    if (total === 2) return relative === 0 ? "seat-bottom" : "seat-top";
    if (total === 3) return ["seat-bottom", "seat-right", "seat-left"][relative] || "seat-top";
    return ["seat-bottom", "seat-right", "seat-top", "seat-left"][relative] || "seat-top";
  }

  function handVisible(player, index) {
    return index === localPlayerIndex() || (!game?.online && !player.bot && index === 0);
  }

  function livesHtml(player) {
    let html = "";
    for (let i = 0; i < START_LIVES; i += 1) html += `<i class="${i < player.lives ? "on" : "off"}"></i>`;
    return `<span class="rbkl-lives" title="${player.lives} von 6 Leben">${html}<b>${player.eliminated ? "OUT" : `${player.lives}/6`}</b></span>`;
  }

  function playerSeatHtml(player, index) {
    const active = game.activeIndex === index && game.phase === "playing";
    const own = index === localPlayerIndex();
    const hidden = player.hidden;
    const skin = cosmeticState().cardSkin;
    const deal = dealAnimationRound !== game.round;
    return `<section class="rbkl-player ${playerSeatClass(index)} ${active ? "active" : ""} ${own ? "own" : ""} ${player.eliminated ? "eliminated" : ""}">
      <header><span class="rbkl-avatar">${player.bot ? "BOT" : esc((player.name || "?").slice(0, 2).toUpperCase())}</span><div><b>${esc(player.name)}${own ? " · DU" : ""}</b><small>${player.bot ? `BOT · ${esc(BOT_LEVELS[player.difficulty]?.name || "Mittel")}` : "ONLINE"}</small></div></header>
      ${livesHtml(player)}
      <div class="rbkl-opponent-hand">${player.hand.map((card, i) => cardHtml(card, { back: !handVisible(player, index), small: true, skin, index: (index * MAX_CARDS_TOTAL) + i, deal })).join("")}</div>
      ${hidden ? `<button type="button" class="rbkl-hidden-card" data-rbkl-challenge-hidden="${index}" ${own || game.activeIndex !== localPlayerIndex() ? "disabled" : ""}><span>?</span><b>VERDECKT</b><small>Behauptet: JOKER</small></button>` : ""}
    </section>`;
  }

  function tablePileHtml() {
    const skin = cosmeticState().cardSkin;
    if (!game.pile.length) return `<div class="rbkl-empty-pile"><span>♛</span><small>Hier landen die Table-Karten</small></div>`;
    const cards = [];
    let idx = 0;
    game.pile.forEach((play) => {
      for (let i = 0; i < play.count; i += 1) {
        cards.push(`<div class="rbkl-pile-card" style="--pile-i:${idx++}">${cardHtml({ id: `pile-${idx}` }, { back: true, small: true, skin })}</div>`);
      }
    });
    return cards.join("");
  }

  function ownHandHtml() {
    const index = localPlayerIndex();
    const player = game.players[index];
    if (!player) return "";
    const skin = cosmeticState().cardSkin;
    const deal = dealAnimationRound !== game.round;
    return `<div class="rbkl-hand-row">${player.hand.map((card, i) => cardHtml(card, { selectable: game.activeIndex === index && game.phase === "playing", selected: selectedCards.has(card.id), index: (index * MAX_CARDS_TOTAL) + i, deal, skin })).join("")}</div>`;
  }

  function actionPanelHtml() {
    const ownIndex = localPlayerIndex();
    const own = game.players[ownIndex];
    if (game.phase === "finished") return `<div class="rbkl-actions finished"><b>Match beendet</b><button type="button" data-rbkl-rematch>Neues Match</button><button type="button" class="ghost" data-rbkl-menu>Menü</button></div>`;
    if (!own || own.eliminated) return `<div class="rbkl-actions waiting"><b>Du bist ausgeschieden.</b><small>Du kannst das Match weiter beobachten.</small></div>`;
    const mine = game.activeIndex === ownIndex;
    if (!mine) return `<div class="rbkl-actions waiting"><b>${esc(game.players[game.activeIndex]?.name || "Spieler")} ist dran</b><small>Beobachte den Bluff – deine verdeckte Karte kann weiterhin Ziel eines Expose werden.</small></div>`;
    const canHidden = !own.hidden && own.hiddenUsedRound !== game.round && own.hand.length > 0;
    const canPlay = selectedCards.size >= 1 && selectedCards.size <= MAX_PLAY_CARDS;
    return `<div class="rbkl-actions">
      <div class="rbkl-turn-badge"><span>DEIN ZUG</span><b>${selectedCards.size ? `${selectedCards.size} ausgewählt` : "Wähle Karten oder expose"}</b></div>
      <div class="rbkl-action-buttons">
        <button type="button" data-rbkl-play ${canPlay ? "" : "disabled"}>${selectedCards.size ? `${selectedCards.size} KARTE${selectedCards.size > 1 ? "N" : ""} LEGEN` : "1–3 KARTEN LEGEN"}</button>
        <button type="button" class="joker" data-rbkl-hidden ${canHidden && selectedCards.size === 1 ? "" : "disabled"}>1 KARTE VERDECKT · „JOKER“</button>
        <button type="button" class="expose" data-rbkl-challenge-play ${game.lastPlay ? "" : "disabled"}>LETZTEN TABLE-ZUG EXPOSEN</button>
      </div>
      <small>Eine Aktion pro Zug: normale Table-Karten <b>oder</b> eine persönliche verdeckte Karte.</small>
    </div>`;
  }

  function resolutionHtml(resolution) {
    if (!resolution?.id || resolutionSeen === resolution.id) return "";
    const skin = cosmeticState().cardSkin;
    const revealCards = (resolution.revealed || []).map((card) => cardHtml(card, { small: true, skin })).join("");
    const hidden = resolution.hiddenRevealed ? `<div class="rbkl-resolution-hidden"><small>VERDECKTE KARTE</small>${cardHtml(resolution.hiddenRevealed, { small: true, skin })}</div>` : "";
    const risks = (resolution.risks || []).map((risk) => `<div class="rbkl-risk-sequence"><b>${esc(risk.playerName)}</b>${(risk.spins || []).map((spin, i) => `<span class="${spin.hit ? "hit" : "safe"}">${i + 1}. ${spin.hit ? "AUSGESCHIEDEN" : `SAFE · ${spin.after}/6`}</span>`).join("")}</div>`).join("");
    const lastSpin = (resolution.risks || []).flatMap((risk) => risk.spins || []).slice(-1)[0];
    const cylinder = risks ? `<div class="rbkl-cylinder ${lastSpin?.hit ? "hit" : "safe"}"><div>${Array.from({ length: 6 }, (_, i) => `<i class="${lastSpin && i >= Number(lastSpin.before || 6) ? "spent" : ""}"></i>`).join("")}</div><b>ROYAL CYLINDER</b><small>${lastSpin?.hit ? "AUSGESCHIEDEN" : "RISIKO ÜBERLEBT"}</small></div>` : "";
    return `<div class="rbkl-resolution" data-rbkl-resolution="${esc(resolution.id)}"><div class="rbkl-resolution-card"><small>EXPOSE-AUFLÖSUNG</small><h2>${esc(resolution.title || "AUFGELÖST")}</h2><p>${esc(resolution.text || "")}</p>${revealCards ? `<div class="rbkl-reveal-row">${revealCards}</div>` : ""}${hidden}${cylinder}${risks}<button type="button" data-rbkl-resolution-close>WEITER</button></div></div>`;
  }

  function gameHtml() {
    const cosmetics = cosmeticState();
    const table = RANK_BY_ID[game.tableRank] || RANKS[0];
    const ownIndex = localPlayerIndex();
    const winner = game.phase === "finished" ? game.players[game.winnerIndex] : null;
    return `<div class="rbkl-game table-${esc(cosmetics.tableSkin)}" data-rbkl-game>
      <header class="rbkl-game-top"><button type="button" class="rbkl-icon-button" data-rbkl-menu>‹</button><div><small>ROYAL BLUFF.KL · RUNDE ${game.round}</small><h2>${esc(table.table)}</h2></div><div class="rbkl-top-meta"><span>${game.online ? "ONLINE" : "BOTS"}</span><button type="button" class="rbkl-icon-button" data-rbkl-rules>?</button></div></header>
      <main class="rbkl-table-wrap">
        <div class="rbkl-table">
          <div class="rbkl-table-glow"></div>
          <div class="rbkl-deck-center"><div class="rbkl-deck-stack">${cardHtml({ id: "deck" }, { back: true, small: true, skin: cosmetics.cardSkin })}<span>${game.deckCount}</span></div><div class="rbkl-table-card">${cardHtml(game.tableCard, { small: true, skin: cosmetics.cardSkin })}<b>${esc(table.table)}</b></div></div>
          <div class="rbkl-pile">${tablePileHtml()}</div>
          ${game.players.map(playerSeatHtml).join("")}
          ${winner ? `<div class="rbkl-winner"><small>ROYAL SURVIVOR</small><b>${esc(winner.name)}</b><span>gewinnt das Match</span></div>` : ""}
        </div>
      </main>
      <section class="rbkl-bottom-panel"><div class="rbkl-own-hand"><header><span>DEINE HAND</span><small>${game.players[ownIndex]?.hidden ? "4 Handkarten + 1 verdeckte Karte = max. 5" : "Maximal 5 Karten"}</small></header>${ownHandHtml()}</div>${actionPanelHtml()}<aside class="rbkl-log">${game.log.slice(0, 5).map((entry) => `<p class="${esc(entry.tone || "")}">${esc(entry.text)}</p>`).join("")}</aside></section>
      ${resolutionHtml(game.lastResolution)}
    </div>`;
  }

  function menuHtml() {
    const cosmetics = cosmeticState();
    return `<div class="rbkl-shell"><header class="rbkl-hero"><button type="button" class="rbkl-close" data-rbkl-close>×</button><div class="rbkl-logo"><span>♛</span><div><small>JK.GAMES · TOP GAME</small><h1>ROYAL BLUFF.KL</h1><p>Bluff. Expose. Survive.</p></div></div><div class="rbkl-hero-cards"><span>K</span><span>A</span><span>JOKER</span></div></header>
      <section class="rbkl-menu-grid">
        <article class="rbkl-menu-card primary"><small>SOFORT SPIELEN</small><h2>Gegen Bots</h2><p>1 gegen 1 oder ein voller Tisch mit bis zu vier Spielern.</p><label>Spieler am Tisch<select data-rbkl-player-count>${[2,3,4].map((n) => `<option value="${n}" ${n === selectedPlayers ? "selected" : ""}>${n} Spieler</option>`).join("")}</select></label><label>Bot-Stärke<select data-rbkl-bot-level>${Object.values(BOT_LEVELS).map((d) => `<option value="${d.id}" ${d.id === selectedBotDifficulty ? "selected" : ""}>${d.name}</option>`).join("")}</select></label><button type="button" data-rbkl-start-bots>BOT-MATCH STARTEN</button></article>
        <article class="rbkl-menu-card online"><small>FIREBASE MULTIPLAYER</small><h2>Online</h2><p>Erstelle einen Raum, teile den sechsstelligen Code oder suche einen öffentlichen Tisch. Freie Plätze können Bots übernehmen.</p><button type="button" data-rbkl-online>ONLINE-LOBBY</button></article>
        <article class="rbkl-menu-card rules"><small>SPIELPRINZIP</small><h2>Joker-Bluff</h2><p>Jeder Spieler kann genau eine persönliche Karte verdeckt als „Joker“ deklarieren. Ein falscher Joker kostet beim Expose zwei Risiken.</p><button type="button" class="ghost" data-rbkl-rules>REGELN ANSEHEN</button></article>
        <article class="rbkl-menu-card shop"><small>JK/COIN · COSMETICS</small><h2>Royal Shop</h2><p>Aktiv: ${esc(CARD_SKINS.find((s) => s.id === cosmetics.cardSkin)?.name || "Bronze")} · ${esc(TABLE_SKINS.find((s) => s.id === cosmetics.tableSkin)?.name || "Black Velvet")}</p><button type="button" class="gold" data-rbkl-shop>DESIGNS ÖFFNEN</button></article>
      </section></div>`;
  }

  function rulesHtml() {
    return `<div class="rbkl-shell rbkl-doc"><header><button type="button" class="rbkl-icon-button" data-rbkl-back>‹</button><div><small>ROYAL BLUFF.KL</small><h1>Regeln</h1></div></header><div class="rbkl-rule-grid">
      <article><b>1 · Deck & Table</b><p>Das Deck enthält 8 Asse, 8 Könige, 8 Damen, 8 Buben, 8 Zehnen und 3 Joker – nach diesen Kartenwerten also 43 Karten. Zuerst wird gemischt. Die erste offene Nicht-Joker-Karte bestimmt den Table. Ein zuerst gezogener Joker löst sofort ein neues Mischen aus. Die Table-Karte kommt danach zurück in den gemischten Stapel; dadurch bleiben z. B. beim King's Table alle 8 Könige + 3 Joker = maximal 11 gültige Karten verfügbar.</p></article>
      <article><b>2 · Hand</b><p>Jeder Spieler besitzt maximal fünf Karten insgesamt. Liegt bereits deine persönliche verdeckte Karte vor dir, erhältst du beim neuen Austeilen nur vier Handkarten.</p></article>
      <article><b>3 · Normaler Zug</b><p>Du legst 1 bis 3 Karten verdeckt in die Mitte und behauptest, dass sie zum aktuellen Table passen. Beim King's Table sind Könige und Joker wahr. Alle anderen Karten sind ein Bluff.</p></article>
      <article><b>4 · Persönliche verdeckte Karte</b><p>Statt Table-Karten darfst du genau eine Handkarte separat verdeckt vor dir ablegen und behaupten: „Das ist ein Joker.“ Jeder Spieler kann seine eigene solche Karte besitzen, aber niemals zwei gleichzeitig und nur einmal pro Runde.</p></article>
      <article><b>5 · Normaler Expose</b><p>Beim Expose des letzten Table-Zugs werden ZUERST ausschließlich dessen gerade gelegte Table-Karten aufgedeckt. Sind sie korrekt, trägt der Challenger 1 Risiko und die persönliche verdeckte Karte des Spielers bleibt vollständig geheim.</p></article>
      <article><b>6 · Doppel-Bluff</b><p>Waren die Table-Karten falsch, trägt der Lügner 1 Risiko. Hat er zusätzlich eine persönliche verdeckte Karte, wird erst jetzt auch diese aufgedeckt. Kein Joker: +2 weitere Risiken, also maximal 3 hintereinander. Echter Joker: +1 Leben bis maximal 6.</p></article>
      <article><b>7 · Joker direkt exposen</b><p>Die persönliche verdeckte Karte kann in einem späteren eigenen Zug direkt challenged werden. Ist sie kein Joker, trägt ihr Besitzer 2 Risiken. Ist sie ein echter Joker, erhält der Besitzer +1 Leben und der falsche Challenger trägt 1 Risiko.</p></article>
      <article><b>8 · Risiko-System</b><p>Du startest mit 6 Leben. Beim ersten Risiko beträgt die Ausscheidungsgefahr 1/6. Überlebst du, bleiben 5 Leben und das nächste Risiko liegt bei 1/5. Danach 1/4, 1/3, 1/2 und bei einem Leben 100 %. Ein Joker kann bis maximal 6 auffüllen.</p></article>
      <article><b>9 · Rundenende</b><p>Nach jedem Expose wird neu gemischt und ausgeteilt. Eine persönliche verdeckte Karte bleibt verborgen, wenn sie durch einen korrekten Table-Zug geschützt wurde. Endet eine Runde dagegen natürlich ohne Expose und die Karte wurde nie geprüft, gibt sie +1 Leben und wird abgelegt.</p></article>
    </div><footer><button type="button" data-rbkl-back>ZURÜCK</button></footer></div>`;
  }

  function shopHtml() {
    const data = cosmeticState();
    const balance = window.JKCoinApp?.coinState?.()?.balance ?? 0;
    const cards = CARD_SKINS.map((skin) => {
      const owned = data.ownedCardSkins.includes(skin.id);
      const active = data.cardSkin === skin.id;
      return `<article class="rbkl-shop-item skin-${skin.id}"><div class="rbkl-shop-preview">${cardHtml({ id: "preview", rank: "K", suit: "♠", joker: false }, { skin: skin.id })}</div><div><small>KARTENDESIGN</small><h3>${esc(skin.name)}</h3><p>${esc(skin.desc)}</p></div><button type="button" data-rbkl-buy-card="${skin.id}" ${active ? "disabled" : ""}>${active ? "AKTIV" : owned ? "AUSRÜSTEN" : `${skin.price} JK/Coin`}</button></article>`;
    }).join("");
    const tables = TABLE_SKINS.map((skin) => {
      const owned = data.ownedTableSkins.includes(skin.id);
      const active = data.tableSkin === skin.id;
      return `<article class="rbkl-shop-item"><div class="rbkl-table-swatch table-${skin.id}"><span>♛</span></div><div><small>TISCHDESIGN</small><h3>${esc(skin.name)}</h3><p>${esc(skin.desc)}</p></div><button type="button" data-rbkl-buy-table="${skin.id}" ${active ? "disabled" : ""}>${active ? "AKTIV" : owned ? "AUSRÜSTEN" : `${skin.price} JK/Coin`}</button></article>`;
    }).join("");
    return `<div class="rbkl-shell rbkl-shop"><header><button type="button" class="rbkl-icon-button" data-rbkl-back>‹</button><div><small>ROYAL SHOP</small><h1>Designs</h1></div><strong>${Number(balance).toLocaleString("de-DE")} JK/Coin</strong></header><h2>Kartendesigns</h2><div class="rbkl-shop-grid">${cards}</div><h2>Tischdesigns</h2><div class="rbkl-shop-grid">${tables}</div></div>`;
  }

  async function buyCosmetic(kind, id) {
    const data = cosmeticState();
    const list = kind === "card" ? CARD_SKINS : TABLE_SKINS;
    const ownedKey = kind === "card" ? "ownedCardSkins" : "ownedTableSkins";
    const activeKey = kind === "card" ? "cardSkin" : "tableSkin";
    const item = list.find((entry) => entry.id === id);
    if (!item) return;
    if (!data[ownedKey].includes(id)) {
      if (item.price > 0) {
        const coin = window.JKCoinApp;
        if (!coin?.spend) return toast("JK/Coin ist noch nicht geladen.");
        const balance = Number(coin.coinState?.()?.balance || 0);
        if (balance < item.price) return toast(`Du brauchst ${item.price} JK/Coin.`);
        if (!window.confirm(`${item.name} für ${item.price} JK/Coin kaufen?`)) return;
        if (!coin.spend(item.price, `Royal Bluff.KL · ${item.name}`)) return toast("Kauf konnte nicht abgeschlossen werden.");
      }
      data[ownedKey].push(id);
    }
    data[activeKey] = id;
    persist();
    renderShop();
  }

  function renderMenu() {
    ensureOverlay();
    game = null;
    selectedCards.clear();
    clearTimeout(botTimer);
    overlay.innerHTML = menuHtml();
    bindCommon();
    overlay.querySelector("[data-rbkl-player-count]")?.addEventListener("change", (event) => { selectedPlayers = clamp(Number(event.target.value) || 2, 2, 4); });
    overlay.querySelector("[data-rbkl-bot-level]")?.addEventListener("change", (event) => { selectedBotDifficulty = BOT_LEVELS[event.target.value] ? event.target.value : "medium"; });
    overlay.querySelector("[data-rbkl-start-bots]")?.addEventListener("click", startBotMatch);
    overlay.querySelector("[data-rbkl-online]")?.addEventListener("click", renderOnlineMenu);
    overlay.querySelector("[data-rbkl-shop]")?.addEventListener("click", renderShop);
  }

  function renderRules() {
    ensureOverlay();
    overlay.innerHTML = rulesHtml();
    overlay.querySelectorAll("[data-rbkl-back]").forEach((button) => button.addEventListener("click", () => game ? renderGame() : renderMenu()));
  }

  function renderShop() {
    ensureOverlay();
    overlay.innerHTML = shopHtml();
    overlay.querySelector("[data-rbkl-back]")?.addEventListener("click", renderMenu);
    overlay.querySelectorAll("[data-rbkl-buy-card]").forEach((button) => button.addEventListener("click", () => buyCosmetic("card", button.dataset.rbklBuyCard)));
    overlay.querySelectorAll("[data-rbkl-buy-table]").forEach((button) => button.addEventListener("click", () => buyCosmetic("table", button.dataset.rbklBuyTable)));
  }

  function bindCommon() {
    overlay?.querySelector("[data-rbkl-close]")?.addEventListener("click", close);
    overlay?.querySelectorAll("[data-rbkl-rules]").forEach((button) => button.addEventListener("click", renderRules));
  }

  function startBotMatch() {
    const humans = [{ uid: "local-player", name: profileName() }];
    game = newMatch(makePlayers(humans, selectedPlayers, selectedBotDifficulty), { online: false });
    cosmeticState().stats.matches += 1;
    persist();
    awardXp(12, "Royal Bluff.KL · Match gestartet");
    selectedCards.clear();
    dealAnimationRound = -1;
    renderGame();
  }

  function renderGame() {
    if (!game) return renderMenu();
    ensureOverlay();
    overlay.innerHTML = gameHtml();
    dealAnimationRound = game.round;
    bindGame();
    maybeShowResolution();
    scheduleBotIfNeeded();
    if (game.phase === "finished") handleLocalWinOnce();
  }

  function bindGame() {
    overlay.querySelectorAll("[data-rbkl-card-id]").forEach((button) => button.addEventListener("click", () => {
      const id = button.dataset.rbklCardId;
      if (selectedCards.has(id)) selectedCards.delete(id);
      else {
        if (selectedCards.size >= MAX_PLAY_CARDS) return toast("Maximal 3 Table-Karten pro Zug.");
        selectedCards.add(id);
      }
      renderGame();
    }));
    overlay.querySelector("[data-rbkl-play]")?.addEventListener("click", () => performLocalAction("play", { cardIds: [...selectedCards] }));
    overlay.querySelector("[data-rbkl-hidden]")?.addEventListener("click", () => {
      if (selectedCards.size !== 1) return toast("Wähle genau eine Karte für den verdeckten Joker-Bluff.");
      performLocalAction("hidden", { cardId: [...selectedCards][0] });
    });
    overlay.querySelector("[data-rbkl-challenge-play]")?.addEventListener("click", () => performLocalAction("challengePlay", {}));
    overlay.querySelectorAll("[data-rbkl-challenge-hidden]").forEach((button) => button.addEventListener("click", () => performLocalAction("challengeHidden", { targetIndex: Number(button.dataset.rbklChallengeHidden) })));
    overlay.querySelectorAll("[data-rbkl-menu]").forEach((button) => button.addEventListener("click", () => { if (game?.online) leaveOnline(); else renderMenu(); }));
    overlay.querySelectorAll("[data-rbkl-rules]").forEach((button) => button.addEventListener("click", renderRules));
    overlay.querySelector("[data-rbkl-rematch]")?.addEventListener("click", () => game?.online ? renderOnlineMenu() : startBotMatch());
    overlay.querySelector("[data-rbkl-resolution-close]")?.addEventListener("click", () => {
      if (game?.lastResolution?.id) resolutionSeen = game.lastResolution.id;
      overlay.querySelector(".rbkl-resolution")?.remove();
    });
  }

  function maybeShowResolution() {
    if (!game?.lastResolution?.id || game.lastResolution.id === resolutionSeen) return;
    const node = overlay.querySelector(".rbkl-resolution");
    if (node) requestAnimationFrame(() => node.classList.add("show"));
  }

  function handleLocalWinOnce() {
    if (!game || game.rewardedMatchId === game.matchId) return;
    game.rewardedMatchId = game.matchId;
    const own = localPlayerIndex();
    if (game.winnerIndex === own) {
      cosmeticState().stats.wins += 1;
      awardXp(100, "Royal Bluff.KL · Sieg");
      try { window.JKCoinApp?.addFragments?.(8, "Royal Bluff.KL Sieg", `royal-bluff-win:${game.matchId}`); } catch {}
    } else awardXp(25, "Royal Bluff.KL · Match beendet");
    persist();
  }

  async function performLocalAction(type, payload) {
    try {
      selectedCards.clear();
      if (game?.online && onlineLobby && !onlineLobby.isHost) {
        await sendOnlineCommand(type, payload);
        return;
      }
      applyAction(game, localUid(), type, payload);
      if (game?.online && onlineLobby?.isHost) await publishOnlineState();
      renderGame();
    } catch (error) { toast(error?.message || error); }
  }

  function scheduleBotIfNeeded() {
    clearTimeout(botTimer);
    if (!game || game.phase !== "playing") return;
    if (game.online && !onlineLobby?.isHost) return;
    const bot = game.players[game.activeIndex];
    if (!bot?.bot || bot.eliminated) return;
    const config = BOT_LEVELS[bot.difficulty] || BOT_LEVELS.medium;
    botTimer = setTimeout(async () => {
      try { botAct(game.activeIndex); if (game.online && onlineLobby?.isHost) await publishOnlineState(); renderGame(); } catch (error) { console.warn("Royal Bluff.KL Bot", error); }
    }, config.think + Math.floor(Math.random() * 380));
  }

  function botAct(index) {
    const bot = game.players[index];
    const config = BOT_LEVELS[bot.difficulty] || BOT_LEVELS.medium;
    if (!bot || game.activeIndex !== index) return;

    if (game.lastPlay) {
      const visibleClaim = game.lastPlay.count;
      const ownTruth = bot.hand.filter((card) => cardIsTableTruth(card, game)).length + (bot.hidden?.card?.joker ? 1 : 0);
      const impossiblePressure = (visibleClaim + ownTruth) > 9;
      const challengeChance = clamp(config.challenge + (impossiblePressure ? .28 : 0) + (visibleClaim >= 3 ? .10 : 0), 0, .92);
      if (Math.random() < challengeChance) return challengePlay(game, index);
    }

    const hiddenTargets = game.players.map((p, i) => ({ p, i })).filter(({ p, i }) => i !== index && !p.eliminated && p.hidden);
    if (hiddenTargets.length && Math.random() < config.hiddenChallenge) {
      const target = hiddenTargets[Math.floor(Math.random() * hiddenTargets.length)];
      return challengeHidden(game, index, target.i);
    }

    if (!bot.hidden && bot.hiddenUsedRound !== game.round && bot.hand.length && Math.random() < .18) {
      const joker = bot.hand.find((card) => card.joker);
      const card = joker && Math.random() > config.hiddenBluff ? joker : bot.hand[Math.floor(Math.random() * bot.hand.length)];
      return playHidden(game, index, card.id);
    }

    if (!bot.hand.length) return advanceTurn(game, index);
    const valid = bot.hand.filter((card) => cardIsTableTruth(card, game));
    const invalid = bot.hand.filter((card) => !cardIsTableTruth(card, game));
    const count = Math.min(bot.hand.length, 1 + (Math.random() < .44 ? 1 : 0) + (Math.random() < .16 ? 1 : 0), MAX_PLAY_CARDS);
    const wantsBluff = Math.random() < config.bluff || valid.length === 0;
    const chosen = [];
    if (!wantsBluff) chosen.push(...valid.slice(0, count));
    while (chosen.length < count) {
      const pool = wantsBluff && invalid.length ? invalid : bot.hand;
      const card = pool.find((candidate) => !chosen.includes(candidate));
      if (!card) break;
      chosen.push(card);
    }
    return playCards(game, index, chosen.map((card) => card.id));
  }

  function ensureOverlay() {
    if (overlay?.isConnected) return overlay;
    overlay = document.createElement("div");
    overlay.className = "rbkl-overlay";
    overlay.dataset.rbklOverlay = "1";
    document.body.append(overlay);
    return overlay;
  }

  function open(item = "") {
    phoneItem = item || phoneItem || "";
    cosmeticState();
    renderMenu();
  }

  function close() {
    clearTimeout(botTimer);
    clearTimeout(pendingTimer);
    cleanupOnlineListeners();
    overlay?.remove();
    overlay = null;
    game = null;
    selectedCards.clear();
    if (phoneItem) setTimeout(() => { try { window.JKGamesOpenTopGames?.(phoneItem); } catch {} }, 80);
  }

  // -------------------- ONLINE / FIREBASE --------------------
  async function firebase() {
    const core = window.LifeBuilderFirebaseCore;
    if (!core?.load) throw new Error("Firebase ist noch nicht geladen.");
    const fb = await core.load();
    const user = await core.waitForAuth?.(8000) || fb.auth.currentUser;
    if (!user) throw new Error("Für Online-Matches musst du angemeldet sein.");
    return { fb, user };
  }

  async function onlineIdentity() {
    const { fb, user } = await firebase();
    return { fb, user, uid: user.uid, name: profileName().slice(0, 40) || user.displayName || "Spieler" };
  }

  function cleanupOnlineListeners() {
    if (!onlineLobby) return;
    (onlineLobby.unsubs || []).forEach((fn) => { try { fn(); } catch {} });
    clearInterval(onlineLobby.heartbeatTimer);
    onlineLobby = null;
  }

  function onlineMenuHtml(message = "") {
    return `<div class="rbkl-shell rbkl-online"><header><button type="button" class="rbkl-icon-button" data-rbkl-back>‹</button><div><small>FIREBASE MULTIPLAYER</small><h1>Online-Lobby</h1></div></header>${message ? `<p class="rbkl-online-message">${esc(message)}</p>` : ""}<div class="rbkl-online-grid">
      <article><small>RAUM ERSTELLEN</small><h2>Eigener Tisch</h2><label>Plätze<select data-rbkl-online-seats>${[2,3,4].map((n) => `<option value="${n}" ${n === selectedPlayers ? "selected" : ""}>${n}</option>`).join("")}</select></label><label>Bot-Stärke<select data-rbkl-online-diff>${Object.values(BOT_LEVELS).map((d) => `<option value="${d.id}" ${d.id === selectedBotDifficulty ? "selected" : ""}>${d.name}</option>`).join("")}</select></label><label class="rbkl-check"><input type="checkbox" data-rbkl-fill-bots checked><span>Freie Plätze beim Start mit Bots auffüllen</span></label><button type="button" data-rbkl-create-public>ÖFFENTLICH ERSTELLEN</button><button type="button" class="ghost" data-rbkl-create-private>PRIVATEN CODE ERSTELLEN</button></article>
      <article><small>BEITRETEN</small><h2>Raumcode</h2><input type="text" maxlength="6" placeholder="ABC123" data-rbkl-room-code><button type="button" data-rbkl-join-code>CODE BEITRETEN</button><hr><button type="button" class="gold" data-rbkl-quick-join>SCHNELLBEITRITT</button></article>
    </div></div>`;
  }

  function renderOnlineMenu(message = "") {
    cleanupOnlineListeners();
    game = null;
    ensureOverlay();
    overlay.innerHTML = onlineMenuHtml(message);
    overlay.querySelector("[data-rbkl-back]")?.addEventListener("click", renderMenu);
    overlay.querySelector("[data-rbkl-online-seats]")?.addEventListener("change", (event) => { selectedPlayers = clamp(Number(event.target.value) || 2, 2, 4); });
    overlay.querySelector("[data-rbkl-online-diff]")?.addEventListener("change", (event) => { selectedBotDifficulty = BOT_LEVELS[event.target.value] ? event.target.value : "medium"; });
    overlay.querySelector("[data-rbkl-create-public]")?.addEventListener("click", () => createOnlineRoom("public"));
    overlay.querySelector("[data-rbkl-create-private]")?.addEventListener("click", () => createOnlineRoom("private"));
    overlay.querySelector("[data-rbkl-join-code]")?.addEventListener("click", () => joinOnlineRoom(String(overlay.querySelector("[data-rbkl-room-code]")?.value || "").trim().toUpperCase()));
    overlay.querySelector("[data-rbkl-quick-join]")?.addEventListener("click", quickJoinOnline);
  }

  async function createOnlineRoom(visibility) {
    try {
      const identity = await onlineIdentity();
      const fillBots = !!overlay.querySelector("[data-rbkl-fill-bots]")?.checked;
      const id = roomCode();
      const roomRef = identity.fb.doc(identity.fb.db, COLLECTION, id);
      const now = Date.now();
      await identity.fb.setDoc(roomRef, {
        hostUid: identity.uid, status: "waiting", visibility, maxPlayers: selectedPlayers, currentPlayers: 1,
        playerUids: [identity.uid], playerNames: { [identity.uid]: identity.name }, fillBots, botDifficulty: selectedBotDifficulty,
        createdAtMs: now, updatedAtMs: now, version: VERSION
      });
      await enterOnlineLobby(identity, id, true);
    } catch (error) { renderOnlineMenu(error?.message || String(error)); }
  }

  async function joinOnlineRoom(code) {
    if (!/^[A-Z0-9]{6}$/.test(code)) return toast("Bitte einen gültigen sechsstelligen Raumcode eingeben.");
    try {
      const identity = await onlineIdentity();
      const roomRef = identity.fb.doc(identity.fb.db, COLLECTION, code);
      await identity.fb.runTransaction(identity.fb.db, async (transaction) => {
        const snap = await transaction.get(roomRef);
        if (!snap.exists()) throw new Error("Raum nicht gefunden.");
        const room = snap.data();
        if (room.status !== "waiting") throw new Error("Dieses Match läuft bereits.");
        const players = Array.isArray(room.playerUids) ? room.playerUids.slice() : [];
        if (players.includes(identity.uid)) return;
        if (players.length >= Number(room.maxPlayers || 4)) throw new Error("Dieser Tisch ist voll.");
        players.push(identity.uid);
        transaction.update(roomRef, { playerUids: players, currentPlayers: players.length, playerNames: { ...(room.playerNames || {}), [identity.uid]: identity.name }, updatedAtMs: Date.now() });
      });
      await enterOnlineLobby(identity, code, false);
    } catch (error) { renderOnlineMenu(error?.message || String(error)); }
  }

  async function quickJoinOnline() {
    try {
      const identity = await onlineIdentity();
      const q = identity.fb.query(identity.fb.collection(identity.fb.db, COLLECTION), identity.fb.where("status", "==", "waiting"), identity.fb.where("visibility", "==", "public"), identity.fb.limit(10));
      const snap = await identity.fb.getDocs(q);
      const candidate = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })).find((room) => (room.playerUids || []).length < Number(room.maxPlayers || 4));
      if (!candidate) return renderOnlineMenu("Aktuell ist kein freier öffentlicher Tisch verfügbar. Erstelle selbst einen.");
      await joinOnlineRoom(candidate.id);
    } catch (error) { renderOnlineMenu(error?.message || String(error)); }
  }

  async function enterOnlineLobby(identity, roomId, isHost) {
    cleanupOnlineListeners();
    const localHandKey = createHandKey();
    onlineLobby = { ...identity, roomId, isHost, unsubs: [], room: null, stateRef: identity.fb.doc(identity.fb.db, COLLECTION, roomId, "state", "live"), commandSeq: 0, processed: new Set(), pendingCommand: "", localHandKey, handKeys: { [identity.uid]: localHandKey } };
    const roomRef = identity.fb.doc(identity.fb.db, COLLECTION, roomId);
    onlineLobby.roomRef = roomRef;
    const secretRef = identity.fb.doc(identity.fb.db, COLLECTION, roomId, "secrets", identity.uid);
    await identity.fb.setDoc(secretRef, { uid: identity.uid, key: localHandKey, createdAtMs: Date.now(), updatedAtMs: Date.now() });
    if (isHost) subscribeHandSecrets();
    onlineLobby.unsubs.push(identity.fb.onSnapshot(roomRef, (snapshot) => {
      if (!onlineLobby || onlineLobby.roomId !== roomId || !snapshot.exists()) return;
      onlineLobby.room = { id: snapshot.id, ...snapshot.data() };
      if (onlineLobby.room.status === "running") {
        if (!game && !isHost) subscribeOnlineState();
      } else if (onlineLobby.room.status === "finished") {
        if (game) game.phase = "finished";
      }
      renderOnlineLobby();
    }, (error) => renderOnlineMenu(`Lobby-Verbindung: ${error.message || error}`)));
    if (isHost) subscribeHostCommands();
    renderOnlineLobby();
  }

  function renderOnlineLobby() {
    if (!onlineLobby || game) return;
    const room = onlineLobby.room;
    if (!room) {
      overlay.innerHTML = `<div class="rbkl-loading"><span></span><b>Online-Lobby wird geladen …</b></div>`;
      return;
    }
    const names = (room.playerUids || []).map((uid, index) => `<li><span>${index + 1}</span><b>${esc(room.playerNames?.[uid] || "Spieler")}</b><small>${uid === room.hostUid ? "HOST" : "ONLINE"}</small></li>`).join("");
    const botCount = room.fillBots ? Math.max(0, Number(room.maxPlayers) - Number(room.currentPlayers)) : 0;
    const privacyReady = !onlineLobby.isHost || (room.playerUids || []).every((uid) => !!onlineLobby.handKeys?.[uid]);
    overlay.innerHTML = `<div class="rbkl-shell rbkl-lobby"><header><button type="button" class="rbkl-icon-button" data-rbkl-leave>‹</button><div><small>${esc(room.visibility === "private" ? "PRIVATER TISCH" : "ÖFFENTLICHER TISCH")}</small><h1>${esc(onlineLobby.roomId)}</h1></div><button type="button" class="rbkl-code-copy" data-rbkl-copy>${esc(onlineLobby.roomId)} · KOPIEREN</button></header><section><div class="rbkl-lobby-info"><b>${room.currentPlayers}/${room.maxPlayers} Menschen</b><span>${botCount ? `+ ${botCount} Bot${botCount > 1 ? "s" : ""} beim Start` : "Keine Bots"}</span></div><ol>${names}${Array.from({ length: botCount }, (_, i) => `<li class="bot"><span>${Number(room.currentPlayers) + i + 1}</span><b>${esc(BOT_NAMES[i] || `Bot ${i + 1}`)}</b><small>BOT · ${esc(BOT_LEVELS[room.botDifficulty]?.name || "Mittel")}</small></li>`).join("")}</ol>${onlineLobby.isHost ? `${!privacyReady ? `<p class="rbkl-privacy-wait">Sichere Handkarten-Schlüssel der Online-Spieler werden vorbereitet …</p>` : ""}<button type="button" class="rbkl-start-online" data-rbkl-start-online ${(privacyReady && (room.fillBots || room.currentPlayers >= 2)) ? "" : "disabled"}>MATCH STARTEN</button>` : `<div class="rbkl-waiting"><span></span><b>Host startet das Match …</b></div>`}</section></div>`;
    overlay.querySelector("[data-rbkl-leave]")?.addEventListener("click", leaveOnline);
    overlay.querySelector("[data-rbkl-copy]")?.addEventListener("click", async () => { try { await navigator.clipboard.writeText(onlineLobby.roomId); toast("Raumcode kopiert."); } catch { toast(onlineLobby.roomId); } });
    overlay.querySelector("[data-rbkl-start-online]")?.addEventListener("click", startOnlineHostMatch);
  }

  async function startOnlineHostMatch() {
    if (!onlineLobby?.isHost || !onlineLobby.room) return;
    try {
      const room = onlineLobby.room;
      if (!(room.playerUids || []).every((uid) => !!onlineLobby.handKeys?.[uid])) throw new Error("Die privaten Handkarten-Schlüssel sind noch nicht vollständig synchronisiert.");
      const humans = (room.playerUids || []).map((uid) => ({ uid, name: room.playerNames?.[uid] || "Spieler" }));
      const total = room.fillBots ? Number(room.maxPlayers || 2) : humans.length;
      if (total < 2) throw new Error("Mindestens zwei Spieler werden benötigt.");
      game = newMatch(makePlayers(humans, total, room.botDifficulty || "medium"), { online: true, roomId: onlineLobby.roomId });
      cosmeticState().stats.matches += 1;
      persist();
      await onlineLobby.fb.updateDoc(onlineLobby.roomRef, { status: "running", currentPlayers: humans.length, startedAtMs: Date.now(), updatedAtMs: Date.now() });
      await publishOnlineState(true);
      subscribeOnlineState(true);
      renderGame();
    } catch (error) { toast(error?.message || error); }
  }

  async function serializeGameForOnline(state) {
    const encryptedHands = {};
    const publicPlayers = [];
    for (const player of state.players) {
      const publicHidden = player.hidden ? { id: player.hidden.id, placedRound: player.hidden.placedRound, placedTurn: player.hidden.placedTurn } : null;
      publicPlayers.push({
        id: player.id, uid: player.uid, name: player.name, bot: !!player.bot, difficulty: player.difficulty || "",
        lives: player.lives, eliminated: !!player.eliminated, handCount: player.hand.length,
        hidden: publicHidden, hiddenUsedRound: player.hiddenUsedRound || 0
      });
      if (!player.bot) {
        const key = onlineLobby?.handKeys?.[player.uid];
        if (!key) throw new Error(`Privater Handkarten-Schlüssel fehlt für ${player.name}.`);
        encryptedHands[player.uid] = await encryptPrivateCards({ hand: player.hand, hiddenCard: player.hidden?.card || null }, key);
      }
    }
    const lastPlay = state.lastPlay ? {
      id: state.lastPlay.id, actorIndex: state.lastPlay.actorIndex, count: state.lastPlay.count,
      declaredRank: state.lastPlay.declaredRank, turn: state.lastPlay.turn, at: state.lastPlay.at
    } : null;
    return {
      version: state.version, matchId: state.matchId, online: true, roomId: state.roomId,
      phase: state.phase, round: state.round, turn: state.turn, players: publicPlayers,
      encryptedHands, activeIndex: state.activeIndex, tableRank: state.tableRank, tableCard: state.tableCard,
      pile: state.pile, lastPlay, deckCount: state.deckCount, log: state.log,
      lastResolution: state.lastResolution, winnerIndex: state.winnerIndex,
      updatedAtMs: state.updatedAtMs, roundStartedAtMs: state.roundStartedAtMs,
      lastCommandId: state.lastCommandId || ""
    };
  }

  async function hydrateOnlineGame(incoming) {
    const ownUid = onlineLobby?.uid || "";
    const privatePayload = await decryptPrivateCards(incoming?.encryptedHands?.[ownUid], onlineLobby?.localHandKey);
    const players = (incoming?.players || []).map((player) => {
      const count = clamp(Number(player.handCount) || 0, 0, MAX_CARDS_TOTAL);
      const hydrated = { ...player, hand: Array.from({ length: count }, (_, index) => ({ id: `hidden-${player.id}-${index}`, rank: "?", suit: "", joker: false })) };
      if (player.uid === ownUid && privatePayload) {
        hydrated.hand = Array.isArray(privatePayload.hand) ? privatePayload.hand : [];
        if (hydrated.hidden && privatePayload.hiddenCard) hydrated.hidden = { ...hydrated.hidden, card: privatePayload.hiddenCard };
      }
      return hydrated;
    });
    return { ...incoming, players };
  }

  async function publishOnlineState(force = false) {
    if (!onlineLobby?.isHost || !game) return;
    game.updatedAtMs = Math.max(Date.now(), Number(game.updatedAtMs || 0) + 1);
    const payload = await serializeGameForOnline(game);
    await onlineLobby.fb.setDoc(onlineLobby.stateRef, payload);
    if (game.phase === "finished") {
      const winner = game.players[game.winnerIndex];
      await onlineLobby.fb.updateDoc(onlineLobby.roomRef, { status: "finished", winnerUid: winner?.uid || "", winnerName: winner?.name || "", finishedAtMs: Date.now(), updatedAtMs: Date.now() }).catch(() => {});
    }
  }

  function subscribeOnlineState(hostToo = false) {
    if (!onlineLobby || onlineLobby.stateSubscribed) return;
    if (onlineLobby.isHost && !hostToo) return;
    onlineLobby.stateSubscribed = true;
    onlineLobby.unsubs.push(onlineLobby.fb.onSnapshot(onlineLobby.stateRef, async (snapshot) => {
      if (!snapshot.exists() || !onlineLobby) return;
      const incoming = snapshot.data();
      if (onlineLobby.isHost) return;
      if (game && Number(incoming.updatedAtMs || 0) <= Number(game.updatedAtMs || 0)) return;
      const hydrated = await hydrateOnlineGame(incoming);
      if (!onlineLobby) return;
      game = hydrated;
      selectedCards.clear();
      if (onlineLobby.pendingCommand && incoming.lastCommandId === onlineLobby.pendingCommand) onlineLobby.pendingCommand = "";
      renderGame();
    }, (error) => toast(`Online-Sync: ${error.message || error}`)));
  }


  function subscribeHandSecrets() {
    if (!onlineLobby?.isHost || onlineLobby.secretSubscribed) return;
    onlineLobby.secretSubscribed = true;
    const ref = onlineLobby.fb.collection(onlineLobby.fb.db, COLLECTION, onlineLobby.roomId, "secrets");
    onlineLobby.unsubs.push(onlineLobby.fb.onSnapshot(ref, (snapshot) => {
      if (!onlineLobby?.isHost) return;
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data?.uid && /^[0-9a-f]{64}$/i.test(String(data.key || ""))) onlineLobby.handKeys[data.uid] = data.key;
      });
      if (!game) renderOnlineLobby();
    }, (error) => console.warn("Royal Bluff.KL privacy keys", error)));
  }

  function subscribeHostCommands() {
    if (!onlineLobby?.isHost || onlineLobby.commandSubscribed) return;
    onlineLobby.commandSubscribed = true;
    const ref = onlineLobby.fb.collection(onlineLobby.fb.db, COLLECTION, onlineLobby.roomId, "commands");
    onlineLobby.unsubs.push(onlineLobby.fb.onSnapshot(ref, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type !== "added") return;
        const command = { id: change.doc.id, ...change.doc.data() };
        if (onlineLobby.processed.has(command.id)) return;
        onlineLobby.processed.add(command.id);
        processHostCommand(command).catch((error) => console.warn("Royal Bluff.KL command", error));
      });
    }, (error) => console.warn("Royal Bluff.KL commands", error)));
  }

  async function processHostCommand(command) {
    if (!onlineLobby?.isHost || !game || command.processed) return;
    try {
      applyAction(game, command.uid, command.type, command.payload || {});
      game.lastCommandId = command.id;
      await publishOnlineState();
    } catch (error) {
      addLog(game, `Online-Aktion abgelehnt: ${error?.message || error}`, "danger");
      game.lastCommandId = command.id;
      await publishOnlineState();
    } finally {
      const ref = onlineLobby.fb.doc(onlineLobby.fb.db, COLLECTION, onlineLobby.roomId, "commands", command.id);
      onlineLobby.fb.deleteDoc(ref).catch(() => {});
      renderGame();
    }
  }

  async function sendOnlineCommand(type, payload) {
    if (!onlineLobby || onlineLobby.pendingCommand) return toast("Deine letzte Aktion wird noch verarbeitet.");
    const seq = ++onlineLobby.commandSeq;
    const id = `${uidSafe(onlineLobby.uid)}_${Date.now()}_${seq}`;
    onlineLobby.pendingCommand = id;
    const ref = onlineLobby.fb.doc(onlineLobby.fb.db, COLLECTION, onlineLobby.roomId, "commands", id);
    await onlineLobby.fb.setDoc(ref, { uid: onlineLobby.uid, seq, type, payload: payload || {}, createdAtMs: Date.now(), processed: false });
    clearTimeout(pendingTimer);
    pendingTimer = setTimeout(() => { if (onlineLobby?.pendingCommand === id) { onlineLobby.pendingCommand = ""; toast("Online-Aktion dauert ungewöhnlich lange. Prüfe die Verbindung."); } }, 12000);
  }

  async function leaveOnline() {
    const current = onlineLobby;
    if (!current) return renderMenu();
    cleanupOnlineListeners();
    game = null;
    selectedCards.clear();
    try {
      if (current.room?.status === "waiting") {
        if (current.isHost) await current.fb.updateDoc(current.roomRef, { status: "cancelled", updatedAtMs: Date.now() });
        else await current.fb.runTransaction(current.fb.db, async (transaction) => {
          const snap = await transaction.get(current.roomRef);
          if (!snap.exists()) return;
          const room = snap.data();
          const uids = (room.playerUids || []).filter((uid) => uid !== current.uid);
          const names = { ...(room.playerNames || {}) }; delete names[current.uid];
          transaction.update(current.roomRef, { playerUids: uids, playerNames: names, currentPlayers: uids.length, updatedAtMs: Date.now() });
        });
      }
    } catch {}
    renderOnlineMenu();
  }

  window.RoyalBluffKL = Object.freeze({
    version: VERSION,
    open,
    close,
    getGame: () => game,
    getCosmetics: cosmeticState
  });
})();
