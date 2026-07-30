/* ========================================================================== 
   JK.Games V82 · Casino komplett neu aufgebaut
   Blackjack · Poker Bots/Online · Slots · High or Lower · Roulette
   ========================================================================== */
(() => {
  "use strict";

  const VERSION = "82.0";
  const ONLINE_COLLECTION = "casinoPokerRoomsV82";
  const SUITS = ["♠", "♥", "♦", "♣"];
  const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
  const GAME_NAMES = {
    blackjack: "Blackjack",
    poker: "Texas Hold’em Poker",
    slots: "Slots",
    highlow: "High or Lower",
    roulette: "Roulette"
  };
  const INFO_TEXT = {
    blackjack: "Ziel: näher an 21 als der Dealer, ohne 21 zu überschreiten. Blackjack zahlt 3:2. Double verdoppelt den Einsatz und gibt genau eine Karte. Split ist bei zwei gleichwertigen Startkarten möglich.",
    poker: "Texas Hold’em: Zwei Handkarten und bis zu fünf Gemeinschaftskarten. Du kannst gegen mehrere Bots oder über Firebase gegen Online-Spieler antreten. Check/Call, Raise und Fold entscheiden jede Setzrunde.",
    slots: "Zahle Scheine aus deinem Casino-Wallet in den Automaten ein. Wähle den Einsatz und starte die Walzen. Gewinnlinien zahlen in das Automaten-Guthaben, das du jederzeit zurück ins Casino-Wallet buchen kannst.",
    highlow: "Tippe, ob die nächste Karte höher oder niedriger ist. Die Basis-Gewinnchance liegt bei etwa 40 %. Nach langen Verlustserien greift ein Ausgleich, der anschließend wieder sinkt.",
    roulette: "Setze Chips auf einzelne Zahlen oder Außenwetten. Das Rad und die Kugel drehen sichtbar. Zahl 0–36 zahlt 35:1, Rot/Schwarz und Gerade/Ungerade 1:1, Dutzende 2:1."
  };

  const runtime = {
    timers: new Map(),
    online: {
      fb: null,
      user: null,
      roomId: "",
      room: null,
      unsub: null,
      busy: false,
      error: ""
    }
  };

  function now() { return Date.now(); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value) || 0)); }
  function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function escapeText(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }
  function playerName() {
    return [state?.firstName, state?.lastName].filter(Boolean).join(" ").trim() || "Spieler";
  }
  function vipName() {
    try { return casinoLevelConfig().name || "Classic"; } catch { return "Classic"; }
  }
  function vipIndex() {
    return ({ 0: 0, 1: 1, 2: 2, 4: 3 })[Number(state?.casinoLevel || 0)] ?? 0;
  }
  function vipLimitCents() {
    return [1_000_000, 500_000_000, 1_000_000_000_000, 10_000_000_000_000][vipIndex()];
  }
  function vipMinCents() { return [1_000, 10_000, 100_000, 1_000_000][vipIndex()]; }
  function vipPresetCents() {
    const sets = [
      [1_000, 2_500, 5_000, 10_000, 25_000, 100_000, 500_000, 1_000_000],
      [10_000, 50_000, 100_000, 500_000, 1_000_000, 10_000_000, 100_000_000, 500_000_000],
      [100_000, 1_000_000, 10_000_000, 100_000_000, 1_000_000_000, 10_000_000_000, 100_000_000_000, 1_000_000_000_000],
      [1_000_000, 10_000_000, 100_000_000, 1_000_000_000, 10_000_000_000, 100_000_000_000, 1_000_000_000_000, 10_000_000_000_000]
    ];
    return sets[vipIndex()];
  }
  function formatEuroCents(cents, compact = false) {
    const euros = Number(cents || 0) / 100;
    if (!compact || Math.abs(euros) < 100_000) {
      return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: euros % 1 ? 2 : 0 }).format(euros);
    }
    const abs = Math.abs(euros);
    let divisor = 1;
    let suffix = "";
    if (abs >= 1_000_000_000) { divisor = 1_000_000_000; suffix = "Mrd"; }
    else if (abs >= 1_000_000) { divisor = 1_000_000; suffix = "M"; }
    else { divisor = 1_000; suffix = "K"; }
    const scaled = euros / divisor;
    return `${scaled.toLocaleString("de-DE", { maximumFractionDigits: Math.abs(scaled) < 100 ? 1 : 0 })}${suffix} €`;
  }
  function formatNumber(value) {
    return new Intl.NumberFormat("de-DE").format(Math.round(Number(value || 0)));
  }
  function saveGame() {
    try { save(); } catch (error) { console.warn("Casino V82 speichern", error); }
  }
  function refresh() {
    saveGame();
    try { refreshCasinoPanelStable({ fallback: true }); }
    catch { try { render(); } catch {} }
  }
  function addTimer(key, callback, delay) {
    const old = runtime.timers.get(key);
    if (old) clearTimeout(old);
    const timer = setTimeout(() => {
      runtime.timers.delete(key);
      callback();
    }, Math.max(20, Number(delay) || 20));
    runtime.timers.set(key, timer);
  }
  function wallet() {
    try { return walletCents(); } catch { return Math.max(0, Math.round(Number(state?.casinoWalletCents || 0))); }
  }
  function debitWallet(cents) {
    cents = Math.max(0, Math.round(cents));
    if (!cents || wallet() < cents) return false;
    try { return takeWallet(cents); }
    catch {
      state.casinoWalletCents = wallet() - cents;
      state.casinoWallet = state.casinoWalletCents / 100;
      state.casinoAccount = Number(state.casinoAccount || 0) + cents / 100;
      state.casinoDailyProfit = Number(state.casinoDailyProfit || 0) + cents / 100;
      return true;
    }
  }
  function creditWallet(cents) {
    cents = Math.max(0, Math.round(cents));
    if (!cents) return;
    try { payoutFromCasino(cents); }
    catch {
      state.casinoAccount = Math.max(0, Number(state.casinoAccount || 0) - cents / 100);
      state.casinoDailyProfit = Number(state.casinoDailyProfit || 0) - cents / 100;
      state.casinoWalletCents = wallet() + cents;
      state.casinoWallet = state.casinoWalletCents / 100;
    }
  }
  function creditMachine(cents) {
    cents = Math.max(0, Math.round(cents));
    state.casinoAccount = Math.max(0, Number(state.casinoAccount || 0) - cents / 100);
    state.casinoDailyProfit = Number(state.casinoDailyProfit || 0) - cents / 100;
  }
  function houseTakes(cents) {
    cents = Math.max(0, Math.round(cents));
    state.casinoAccount = Number(state.casinoAccount || 0) + cents / 100;
    state.casinoDailyProfit = Number(state.casinoDailyProfit || 0) + cents / 100;
  }

  function makeDeck(count = 1) {
    const deck = [];
    for (let copy = 0; copy < count; copy += 1) {
      SUITS.forEach((suit) => RANKS.forEach((rank) => deck.push({ rank, suit })));
    }
    for (let i = deck.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }
  function rankValue(rank) {
    if (rank === "A") return 14;
    if (rank === "K") return 13;
    if (rank === "Q") return 12;
    if (rank === "J") return 11;
    return Number(rank);
  }
  function blackjackValue(cards = []) {
    let total = cards.reduce((sum, card) => sum + (card.rank === "A" ? 11 : ["K", "Q", "J"].includes(card.rank) ? 10 : Number(card.rank)), 0);
    let aces = cards.filter((card) => card.rank === "A").length;
    while (total > 21 && aces > 0) { total -= 10; aces -= 1; }
    return total;
  }
  function cardMarkup(card, options = {}) {
    if (!card || options.hidden) return `<span class="c82-card is-back"><i>♛</i></span>`;
    const red = card.suit === "♥" || card.suit === "♦";
    return `<span class="c82-card ${red ? "is-red" : ""}"><b>${escapeText(card.rank)}</b><i>${escapeText(card.suit)}</i><em>${escapeText(card.rank)}</em></span>`;
  }
  function cardsMarkup(cards = [], hiddenFirst = false) {
    return cards.map((card, index) => cardMarkup(card, { hidden: hiddenFirst && index === 0 })).join("");
  }
  function stakeControl(game, stakeCents, locked = false) {
    const presets = vipPresetCents().slice(0, 8);
    return `<section class="c82-stake-panel">
      <div class="c82-stake-heading"><span><small>EINSATZ</small><b>${formatEuroCents(stakeCents, true)}</b></span><em>${vipName()} · max. ${formatEuroCents(vipLimitCents(), true)}</em></div>
      <div class="c82-chip-row">${presets.map((value) => `<button class="c82-chip ${value === stakeCents ? "is-active" : ""}" data-c82-action="stake-preset" data-game="${game}" data-value="${value}" ${locked ? "disabled" : ""}>${formatEuroCents(value, true)}</button>`).join("")}</div>
      <div class="c82-custom-stake"><input data-c82-stake-input="${game}" type="number" inputmode="decimal" min="${vipMinCents() / 100}" max="${vipLimitCents() / 100}" value="${Math.round(stakeCents / 100)}" ${locked ? "disabled" : ""}><button data-c82-action="stake-custom" data-game="${game}" ${locked ? "disabled" : ""}>Eigener Einsatz</button></div>
    </section>`;
  }
  function infoButton(game) {
    return `<button class="c82-icon-button" data-c82-action="info" data-game="${game}" aria-label="Spielregeln">i</button>`;
  }
  function baseHeader(game, subtitle = "") {
    return `<header class="c82-game-head"><button class="c82-back" data-casino-floor-back aria-label="Zur Casino-Map">←</button><div><small>${escapeText(subtitle || "JK.GAMES CASINO")}</small><h2>${escapeText(GAME_NAMES[game])}</h2></div><div class="c82-head-balance"><span><small>WALLET</small><b>${formatEuroCents(wallet(), true)}</b></span>${infoButton(game)}</div></header>`;
  }
  function infoModal(game) {
    const active = state.casinoV82.info === game;
    if (!active) return "";
    return `<div class="c82-info-backdrop" data-c82-action="close-info"><article class="c82-info-card" onclick="event.stopPropagation()"><button data-c82-action="close-info">×</button><small>SO FUNKTIONIERT ES</small><h3>${escapeText(GAME_NAMES[game])}</h3><p>${escapeText(INFO_TEXT[game])}</p><div><span>VIP-Stufe</span><b>${escapeText(vipName())}</b></div><div><span>Maximaler Einsatz</span><b>${formatEuroCents(vipLimitCents(), true)}</b></div></article></div>`;
  }
  function messageMarkup(text, kind = "") {
    return `<p class="c82-message ${kind ? `is-${kind}` : ""}">${escapeText(text || "Bereit.")}</p>`;
  }

  function ensureState() {
    if (!state) return null;
    const root = state.casinoV82 ||= {};
    root.version = VERSION;
    root.info ||= "";
    root.stakes ||= {};
    root.stakes.blackjack = clamp(root.stakes.blackjack || 5_000, vipMinCents(), vipLimitCents());
    root.stakes.poker = clamp(root.stakes.poker || 10_000, vipMinCents(), vipLimitCents());
    root.stakes.highlow = clamp(root.stakes.highlow || 2_500, vipMinCents(), vipLimitCents());
    root.stakes.roulette = clamp(root.stakes.roulette || 1_000, vipMinCents(), vipLimitCents());
    root.blackjack ||= { status: "idle", deck: [], dealer: [], hands: [], activeHand: 0, message: "Einsatz wählen und neue Runde starten.", stats: { rounds: 0, wins: 0, blackjack: 0, biggest: 0 } };
    root.poker ||= { mode: "menu", status: "idle", stakeCents: root.stakes.poker, players: [], board: [], deck: [], street: "preflop", potCents: 0, playerBetCents: 0, message: "Wähle Bot-Tisch oder Online-Lobby.", stats: { hands: 0, wins: 0, biggest: 0 }, onlineRoomId: "", onlinePaidCents: 0 };
    root.slots ||= { machineCreditCents: 0, betCents: 200, reels: Array.from({ length: 15 }, () => "★"), spinning: false, finishAt: 0, pending: null, lastWinCents: 0, message: "Scheine einführen und START drücken.", auto: false, autoLeft: 0, stats: { spins: 0, wins: 0, biggest: 0 } };
    root.highlow ||= { status: "idle", stakeCents: root.stakes.highlow, current: null, next: null, round: 0, riskCents: 0, lossStreak: 0, message: "Einsatz wählen und Runde starten.", history: [], stats: { rounds: 0, wins: 0, biggest: 0 } };
    root.roulette ||= { bets: [], selectedChipCents: root.stakes.roulette, spinning: false, finishAt: 0, winningNumber: null, rotation: 0, history: [], message: "Chip auswählen und auf das Tableau setzen.", stats: { spins: 0, wins: 0, biggest: 0 } };
    root.slots.betCents = clamp(root.slots.betCents || 200, 100, vipLimitCents());
    root.roulette.selectedChipCents = clamp(root.roulette.selectedChipCents || root.stakes.roulette, 100, vipLimitCents());
    return root;
  }

  /* -------------------------------- Blackjack -------------------------------- */
  function blackjackState() { return ensureState().blackjack; }
  function startBlackjackV82() {
    const root = ensureState();
    const game = root.blackjack;
    const bet = clamp(root.stakes.blackjack, vipMinCents(), vipLimitCents());
    if (game.status === "playing") return;
    if (!debitWallet(bet)) { game.message = "Nicht genug Guthaben im Casino-Wallet."; return refresh(); }
    const deckCount = [2, 4, 6, 8][vipIndex()];
    const deck = makeDeck(deckCount);
    const hand = { cards: [deck.pop(), deck.pop()], betCents: bet, status: "playing", result: "" };
    game.status = "playing";
    game.deck = deck;
    game.dealer = [deck.pop(), deck.pop()];
    game.hands = [hand];
    game.activeHand = 0;
    game.message = "Deine Runde läuft.";
    game.stats.rounds += 1;
    if (blackjackValue(hand.cards) === 21) settleBlackjackV82();
    refresh();
  }
  function activeBjHand() {
    const game = blackjackState();
    return game.hands[game.activeHand] || null;
  }
  function nextBjHandOrDealer() {
    const game = blackjackState();
    const next = game.hands.findIndex((hand, index) => index > game.activeHand && hand.status === "playing");
    if (next >= 0) { game.activeHand = next; game.message = `Hand ${next + 1} ist dran.`; return refresh(); }
    settleBlackjackV82();
  }
  function blackjackHitV82() {
    const game = blackjackState();
    const hand = activeBjHand();
    if (game.status !== "playing" || !hand) return;
    hand.cards.push(game.deck.pop());
    const value = blackjackValue(hand.cards);
    if (value > 21) { hand.status = "bust"; hand.result = "Überkauft"; nextBjHandOrDealer(); }
    else if (value === 21) { hand.status = "stand"; nextBjHandOrDealer(); }
    else { game.message = `Hand ${game.activeHand + 1}: ${value} Punkte.`; refresh(); }
  }
  function blackjackStandV82() {
    const hand = activeBjHand();
    if (!hand) return;
    hand.status = "stand";
    nextBjHandOrDealer();
  }
  function blackjackDoubleV82() {
    const game = blackjackState();
    const hand = activeBjHand();
    if (!hand || hand.cards.length !== 2 || !debitWallet(hand.betCents)) return;
    hand.betCents *= 2;
    hand.cards.push(game.deck.pop());
    hand.status = blackjackValue(hand.cards) > 21 ? "bust" : "stand";
    nextBjHandOrDealer();
  }
  function blackjackSplitV82() {
    const game = blackjackState();
    const hand = activeBjHand();
    if (!hand || game.hands.length > 1 || hand.cards.length !== 2) return;
    const same = rankValue(hand.cards[0].rank) === rankValue(hand.cards[1].rank);
    if (!same || !debitWallet(hand.betCents)) return;
    const secondCard = hand.cards.pop();
    hand.cards.push(game.deck.pop());
    const second = { cards: [secondCard, game.deck.pop()], betCents: hand.betCents, status: "playing", result: "" };
    game.hands.push(second);
    game.message = "Split aktiv. Spiele beide Hände nacheinander.";
    refresh();
  }
  function settleBlackjackV82() {
    const game = blackjackState();
    if (game.status !== "playing") return;
    while (blackjackValue(game.dealer) < 17) game.dealer.push(game.deck.pop());
    const dealerValue = blackjackValue(game.dealer);
    let totalPayout = 0;
    const results = [];
    game.hands.forEach((hand, index) => {
      const value = blackjackValue(hand.cards);
      const natural = hand.cards.length === 2 && value === 21 && game.hands.length === 1;
      let payout = 0;
      let result = "Verloren";
      if (value > 21) result = "Überkauft";
      else if (natural && dealerValue !== 21) { payout = Math.round(hand.betCents * 2.5); result = "Blackjack 3:2"; game.stats.blackjack += 1; }
      else if (dealerValue > 21 || value > dealerValue) { payout = hand.betCents * 2; result = "Gewonnen"; }
      else if (value === dealerValue) { payout = hand.betCents; result = "Push"; }
      if (payout > 0) totalPayout += payout;
      hand.status = "done";
      hand.result = result;
      results.push(`Hand ${index + 1}: ${result}`);
    });
    if (totalPayout) {
      creditWallet(totalPayout);
      if (totalPayout > game.hands.reduce((sum, hand) => sum + hand.betCents, 0)) game.stats.wins += 1;
      game.stats.biggest = Math.max(game.stats.biggest, totalPayout);
    }
    game.status = "done";
    game.message = `${results.join(" · ")} · Dealer ${dealerValue}`;
    refresh();
  }
  function blackjackRender() {
    const root = ensureState();
    const game = root.blackjack;
    const playing = game.status === "playing";
    const dealerHidden = playing;
    const dealerValue = dealerHidden ? "?" : blackjackValue(game.dealer || []);
    const hand = game.hands[game.activeHand] || game.hands[0];
    const canSplit = playing && game.hands.length === 1 && hand?.cards?.length === 2 && rankValue(hand.cards[0].rank) === rankValue(hand.cards[1].rank) && wallet() >= hand.betCents;
    const canDouble = playing && hand?.cards?.length === 2 && wallet() >= hand.betCents;
    return `<div class="c82-shell is-blackjack">
      ${baseHeader("blackjack", "BLACK JACK ♠")}
      <main class="c82-blackjack-table">
        <section class="c82-bj-rules"><b>REGELN</b><span>Dealer zieht bis 17</span><span>Blackjack zahlt 3:2</span><span>Double: eine Karte</span></section>
        <section class="c82-bj-dealer"><small>DEALER</small><div class="c82-card-row">${game.dealer?.length ? cardsMarkup(game.dealer, dealerHidden) : `${cardMarkup(null, { hidden: true })}${cardMarkup(null, { hidden: true })}`}</div><b>${dealerValue}</b></section>
        <section class="c82-bj-player"><small>DEINE HAND${game.hands.length > 1 ? ` ${game.activeHand + 1}/${game.hands.length}` : ""}</small><div class="c82-card-row">${hand ? cardsMarkup(hand.cards) : `${cardMarkup(null, { hidden: true })}${cardMarkup(null, { hidden: true })}`}</div><b>${hand ? blackjackValue(hand.cards) : 0}</b></section>
        <section class="c82-bj-actions"><button class="is-green" data-c82-action="bj-hit" ${!playing ? "disabled" : ""}><span>🂠</span>HIT</button><button class="is-blue" data-c82-action="bj-stand" ${!playing ? "disabled" : ""}><span>✋</span>STAND</button><button class="is-gold" data-c82-action="bj-double" ${!canDouble ? "disabled" : ""}><span>2×</span>DOUBLE</button><button class="is-purple" data-c82-action="bj-split" ${!canSplit ? "disabled" : ""}><span>▥</span>SPLIT</button></section>
        <aside class="c82-bj-side"><span><small>Guthaben</small><b>${formatEuroCents(wallet(), true)}</b></span><span><small>Runden</small><b>${formatNumber(game.stats.rounds)}</b></span><span><small>Größter Gewinn</small><b>${formatEuroCents(game.stats.biggest, true)}</b></span></aside>
        <section class="c82-bj-bottom">${stakeControl("blackjack", root.stakes.blackjack, playing)}<button class="c82-new-round" data-c82-action="bj-start" ${playing ? "disabled" : ""}>↻ NEUE RUNDE</button></section>
      </main>${messageMarkup(game.message)}${infoModal("blackjack")}
    </div>`;
  }

  /* -------------------------------- Poker Bots -------------------------------- */
  const BOT_NAMES = ["Sophia", "Ethan", "Mason", "Chloe", "Justin"];
  function pokerState() { return ensureState().poker; }
  function startPokerBotsV82() {
    const root = ensureState();
    const game = root.poker;
    const stake = clamp(root.stakes.poker, vipMinCents(), vipLimitCents());
    if (!debitWallet(stake)) { game.message = "Nicht genug Casino-Guthaben für den Bot-Tisch."; return refresh(); }
    const deck = makeDeck(1);
    const count = clamp(Number(game.botCount || 3), 2, 5);
    const players = [{ id: "you", name: playerName(), isBot: false, folded: false, hand: [deck.pop(), deck.pop()], stackLabel: wallet() }];
    BOT_NAMES.slice(0, count).forEach((name, index) => players.push({ id: `bot-${index}`, name, isBot: true, folded: false, hand: [deck.pop(), deck.pop()], stackLabel: stake * randomInt(8, 28) }));
    game.mode = "bots";
    game.status = "playing";
    game.stakeCents = stake;
    game.deck = deck;
    game.players = players;
    game.board = [deck.pop(), deck.pop(), deck.pop(), deck.pop(), deck.pop()];
    game.reveal = 0;
    game.street = "preflop";
    game.potCents = stake * players.length;
    game.playerBetCents = stake;
    game.message = "Preflop: Deine Entscheidung.";
    game.stats.hands += 1;
    refresh();
  }
  function botPokerDecision(player, street, board) {
    const score = pokerScore([...(player.hand || []), ...board]);
    const strength = Number(score?.[0] || 0) + Math.random() * 2.6;
    const foldThreshold = street === "preflop" ? 1.1 : 1.9;
    if (strength < foldThreshold && Math.random() < 0.42) return "fold";
    return Math.random() < 0.22 ? "raise" : "call";
  }
  function pokerBotsActionV82(action) {
    const game = pokerState();
    if (game.status !== "playing" || game.mode !== "bots") return;
    if (action === "fold") {
      game.players[0].folded = true;
      game.status = "done";
      game.message = "Du hast gefoldet. Der Einsatz bleibt am Tisch.";
      return refresh();
    }
    if (action === "raise") {
      const extra = game.stakeCents;
      if (!debitWallet(extra)) { game.message = "Für Raise fehlt Casino-Guthaben."; return refresh(); }
      game.potCents += extra;
      game.playerBetCents += extra;
    }
    const visibleBoard = game.board.slice(0, game.reveal);
    game.players.slice(1).forEach((bot) => {
      if (bot.folded) return;
      const decision = botPokerDecision(bot, game.street, visibleBoard);
      if (decision === "fold") bot.folded = true;
      else if (decision === "raise") game.potCents += game.stakeCents;
    });
    const active = game.players.filter((player) => !player.folded);
    if (active.length === 1) return finishPokerBotsV82(active[0]);
    if (game.street === "preflop") { game.street = "flop"; game.reveal = 3; game.message = "Flop liegt. Check/Call, Raise oder Fold."; }
    else if (game.street === "flop") { game.street = "turn"; game.reveal = 4; game.message = "Turn-Karte liegt."; }
    else if (game.street === "turn") { game.street = "river"; game.reveal = 5; game.message = "River-Karte liegt. Letzte Entscheidung."; }
    else finishPokerBotsV82();
    refresh();
  }
  function finishPokerBotsV82(forcedWinner = null) {
    const game = pokerState();
    const active = game.players.filter((player) => !player.folded);
    let winners = forcedWinner ? [forcedWinner] : pokerWinners(active, game.board);
    const youWin = winners.some((winner) => winner.id === "you");
    if (youWin) {
      const share = Math.floor((game.potCents * 0.95) / winners.length);
      creditWallet(share);
      game.stats.wins += 1;
      game.stats.biggest = Math.max(game.stats.biggest, share);
      game.message = winners.length > 1 ? `Split Pot: ${formatEuroCents(share, true)} gewonnen.` : `Du gewinnst ${formatEuroCents(share, true)}.`;
    } else {
      game.message = `${winners.map((winner) => winner.name).join(" & ")} gewinnt den Pot.`;
    }
    game.reveal = 5;
    game.status = "done";
  }
  function pokerScore(cards) {
    try {
      if (typeof evaluatePokerCards === "function") {
        const result = evaluatePokerCards(cards);
        if (Array.isArray(result)) return result;
        if (Array.isArray(result?.score)) return result.score;
      }
    } catch {}
    const sorted = [...cards].sort((a, b) => rankValue(b.rank) - rankValue(a.rank));
    return [0, ...sorted.slice(0, 5).map((card) => rankValue(card.rank))];
  }
  function compareScores(a, b) {
    const max = Math.max(a.length, b.length);
    for (let i = 0; i < max; i += 1) {
      if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) - (b[i] || 0);
    }
    return 0;
  }
  function pokerWinners(players, board) {
    const scored = players.map((player) => ({ player, score: pokerScore([...(player.hand || []), ...board]) }));
    scored.sort((a, b) => compareScores(b.score, a.score));
    return scored.filter((entry) => compareScores(entry.score, scored[0].score) === 0).map((entry) => entry.player);
  }
  function pokerSeatMarkup(player, index, reveal = false) {
    const initials = player.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
    return `<article class="c82-poker-seat seat-${index} ${player.folded ? "is-folded" : ""} ${player.id === "you" ? "is-you" : ""}"><div class="c82-avatar">${escapeText(initials)}</div><b>${escapeText(player.name)}</b><span>${formatEuroCents(player.stackLabel || 0, true)}</span><div class="c82-mini-cards">${reveal || player.id === "you" ? cardsMarkup(player.hand || []) : `${cardMarkup(null, { hidden: true })}${cardMarkup(null, { hidden: true })}`}</div>${player.folded ? "<em>FOLD</em>" : ""}</article>`;
  }

  /* ------------------------------ Poker Online ------------------------------- */
  async function onlineCore() {
    if (runtime.online.fb && runtime.online.user) return runtime.online;
    if (!window.LifeBuilderFirebaseCore?.load) throw new Error("Firebase ist nicht verfügbar.");
    const fb = await window.LifeBuilderFirebaseCore.load();
    const user = await window.LifeBuilderFirebaseCore.waitForAuth(8000);
    if (!user) throw new Error("Melde dich zuerst mit deinem JK.Games-Konto an.");
    runtime.online.fb = fb;
    runtime.online.user = user;
    return runtime.online;
  }
  function roomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }
  async function subscribeRoom(roomId) {
    const rt = await onlineCore();
    try { rt.unsub?.(); } catch {}
    rt.roomId = roomId;
    rt.unsub = rt.fb.onSnapshot(rt.fb.doc(rt.fb.db, ONLINE_COLLECTION, roomId), async (snapshot) => {
      if (!snapshot.exists()) {
        rt.room = null;
        rt.error = "Die Online-Lobby wurde geschlossen.";
        ensureState().poker.onlineRoomId = "";
        refresh();
        return;
      }
      rt.room = { id: roomId, ...snapshot.data() };
      ensureState().poker.onlineRoomId = roomId;
      await claimOnlinePayoutIfNeeded();
      refresh();
    }, (error) => {
      rt.error = String(error?.message || error || "Online-Lobby nicht erreichbar.");
      refresh();
    });
  }
  async function createOnlinePokerRoom() {
    const rt = await onlineCore();
    const game = pokerState();
    const stake = clamp(ensureState().stakes.poker, vipMinCents(), vipLimitCents());
    if (!debitWallet(stake)) throw new Error("Nicht genug Casino-Guthaben für den Online-Buy-in.");
    let code = roomCode();
    const ref = rt.fb.doc(rt.fb.db, ONLINE_COLLECTION, code);
    const player = { uid: rt.user.uid, name: playerName(), vip: vipIndex(), paidCents: stake, folded: false, joinedAtMs: now() };
    try {
      await rt.fb.setDoc(ref, {
        roomId: code,
        version: VERSION,
        visibility: "public",
        hostUid: rt.user.uid,
        hostName: player.name,
        status: "lobby",
        requiredVip: vipIndex(),
        stakeCents: stake,
        maxPlayers: 6,
        playerUids: [rt.user.uid],
        players: { [rt.user.uid]: player },
        order: [rt.user.uid],
        game: null,
        claims: {},
        createdAtMs: now(),
        updatedAtMs: now()
      });
    } catch (error) {
      creditWallet(stake);
      throw error;
    }
    game.mode = "online";
    game.onlineRoomId = code;
    game.onlinePaidCents = stake;
    await subscribeRoom(code);
  }
  async function joinOnlinePokerRoom() {
    const rt = await onlineCore();
    const code = String(prompt("Sechsstelligen Poker-Lobby-Code eingeben:", "") || "").trim().toUpperCase();
    if (!code) return;
    const ref = rt.fb.doc(rt.fb.db, ONLINE_COLLECTION, code);
    const snapshot = await rt.fb.getDoc(ref);
    if (!snapshot.exists()) throw new Error("Diese Lobby wurde nicht gefunden.");
    const room = snapshot.data();
    if (room.status !== "lobby") throw new Error("Diese Lobby läuft bereits.");
    if (Number(room.requiredVip || 0) > vipIndex()) throw new Error(`Für diese Lobby brauchst du VIP ${Number(room.requiredVip || 0)}.`);
    if ((room.playerUids || []).length >= Number(room.maxPlayers || 6)) throw new Error("Die Lobby ist voll.");
    const stake = Number(room.stakeCents || 0);
    if (!debitWallet(stake)) throw new Error(`Du brauchst ${formatEuroCents(stake, true)} im Casino-Wallet.`);
    try {
      await rt.fb.runTransaction(rt.fb.db, async (transaction) => {
        const snap = await transaction.get(ref);
        if (!snap.exists()) throw new Error("Lobby nicht gefunden.");
        const data = snap.data();
        if (data.status !== "lobby") throw new Error("Lobby läuft bereits.");
        const uids = [...(data.playerUids || [])];
        if (uids.includes(rt.user.uid)) return;
        if (uids.length >= Number(data.maxPlayers || 6)) throw new Error("Lobby ist voll.");
        uids.push(rt.user.uid);
        transaction.update(ref, {
          playerUids: uids,
          order: [...(data.order || []), rt.user.uid],
          [`players.${rt.user.uid}`]: { uid: rt.user.uid, name: playerName(), vip: vipIndex(), paidCents: stake, folded: false, joinedAtMs: now() },
          updatedAtMs: now()
        });
      });
    } catch (error) {
      creditWallet(stake);
      throw error;
    }
    const game = pokerState();
    game.mode = "online";
    game.onlineRoomId = code;
    game.onlinePaidCents = stake;
    await subscribeRoom(code);
  }
  async function startOnlinePokerGame() {
    const rt = await onlineCore();
    const room = rt.room;
    if (!room || room.hostUid !== rt.user.uid || room.status !== "lobby") return;
    if ((room.playerUids || []).length < 2) throw new Error("Mindestens zwei Online-Spieler werden benötigt.");
    const ref = rt.fb.doc(rt.fb.db, ONLINE_COLLECTION, room.id);
    const deck = makeDeck(1);
    const hands = {};
    (room.order || []).forEach((uid) => { hands[uid] = [deck.pop(), deck.pop()]; });
    const board = [deck.pop(), deck.pop(), deck.pop(), deck.pop(), deck.pop()];
    const players = Object.fromEntries((room.order || []).map((uid) => [uid, { ...(room.players?.[uid] || {}), folded: false }]));
    await rt.fb.updateDoc(ref, {
      status: "playing",
      players,
      game: {
        deck,
        hands,
        board,
        reveal: 0,
        street: "preflop",
        potCents: Number(room.stakeCents || 0) * (room.order || []).length,
        turnIndex: 0,
        actedUids: [],
        winners: [],
        payoutCents: 0,
        message: "Preflop läuft."
      },
      updatedAtMs: now()
    });
  }
  function nextActiveIndex(order, players, currentIndex) {
    if (!order.length) return 0;
    for (let offset = 1; offset <= order.length; offset += 1) {
      const index = (currentIndex + offset) % order.length;
      if (!players?.[order[index]]?.folded) return index;
    }
    return currentIndex;
  }
  function onlineShowdownData(room, game) {
    const active = (room.order || []).filter((uid) => !room.players?.[uid]?.folded);
    const playerObjects = active.map((uid) => ({ id: uid, name: room.players?.[uid]?.name || "Spieler", hand: game.hands?.[uid] || [] }));
    const winners = pokerWinners(playerObjects, game.board || []).map((player) => player.id);
    return { winners, payoutCents: Math.floor(Number(game.potCents || 0) * 0.97) };
  }
  async function onlinePokerAction(action) {
    const rt = await onlineCore();
    const room = rt.room;
    if (!room || room.status !== "playing") return;
    const ref = rt.fb.doc(rt.fb.db, ONLINE_COLLECTION, room.id);
    let chargedRaise = false;
    if (action === "raise") {
      if (!debitWallet(Number(room.stakeCents || 0))) throw new Error("Für Raise fehlt Casino-Guthaben.");
      chargedRaise = true;
    }
    try {
      await rt.fb.runTransaction(rt.fb.db, async (transaction) => {
        const snap = await transaction.get(ref);
        const data = snap.data();
        const game = { ...(data.game || {}) };
        const order = [...(data.order || [])];
        const players = { ...(data.players || {}) };
        const currentUid = order[Number(game.turnIndex || 0)];
        if (currentUid !== rt.user.uid) throw new Error("Du bist noch nicht am Zug.");
        if (action === "fold") players[rt.user.uid] = { ...players[rt.user.uid], folded: true };
        if (action === "raise") game.potCents = Number(game.potCents || 0) + Number(data.stakeCents || 0);
        const acted = new Set(game.actedUids || []);
        acted.add(rt.user.uid);
        const active = order.filter((uid) => !players?.[uid]?.folded);
        if (active.length <= 1) {
          game.winners = active;
          game.payoutCents = Math.floor(Number(game.potCents || 0) * 0.97);
          game.reveal = 5;
          game.message = `${players?.[active[0]]?.name || "Spieler"} gewinnt durch Fold.`;
          transaction.update(ref, { players, game, status: "finished", updatedAtMs: now() });
          return;
        }
        const allActed = active.every((uid) => acted.has(uid));
        if (allActed) {
          game.actedUids = [];
          if (game.street === "preflop") { game.street = "flop"; game.reveal = 3; game.message = "Flop liegt."; }
          else if (game.street === "flop") { game.street = "turn"; game.reveal = 4; game.message = "Turn liegt."; }
          else if (game.street === "turn") { game.street = "river"; game.reveal = 5; game.message = "River liegt."; }
          else {
            const result = onlineShowdownData({ ...data, players }, game);
            game.winners = result.winners;
            game.payoutCents = result.payoutCents;
            game.message = "Showdown beendet.";
            transaction.update(ref, { players, game, status: "finished", updatedAtMs: now() });
            return;
          }
        } else game.actedUids = [...acted];
        game.turnIndex = nextActiveIndex(order, players, Number(game.turnIndex || 0));
        transaction.update(ref, { players, game, updatedAtMs: now() });
      });
    } catch (error) {
      if (chargedRaise) creditWallet(Number(room.stakeCents || 0));
      throw error;
    }
  }
  async function claimOnlinePayoutIfNeeded() {
    const rt = runtime.online;
    const room = rt.room;
    if (!room || room.status !== "finished" || !rt.user || !room.game?.winners?.includes(rt.user.uid) || room.claims?.[rt.user.uid]) return;
    const share = Math.floor(Number(room.game.payoutCents || 0) / Math.max(1, room.game.winners.length));
    const ref = rt.fb.doc(rt.fb.db, ONLINE_COLLECTION, room.id);
    let claimed = false;
    await rt.fb.runTransaction(rt.fb.db, async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.claims?.[rt.user.uid]) return;
      transaction.update(ref, { [`claims.${rt.user.uid}`]: true, updatedAtMs: now() });
      claimed = true;
    });
    if (claimed && share > 0) {
      creditWallet(share);
      const game = pokerState();
      game.stats.wins += 1;
      game.stats.biggest = Math.max(game.stats.biggest, share);
      saveGame();
    }
  }
  async function leaveOnlinePokerRoom() {
    const rt = runtime.online;
    const room = rt.room;
    if (!room || !rt.user || !rt.fb) return;
    const ref = rt.fb.doc(rt.fb.db, ONLINE_COLLECTION, room.id);
    if (room.status === "lobby") {
      const paid = Number(room.players?.[rt.user.uid]?.paidCents || 0);
      if (room.hostUid === rt.user.uid) await rt.fb.deleteDoc(ref);
      else {
        await rt.fb.runTransaction(rt.fb.db, async (transaction) => {
          const snap = await transaction.get(ref);
          if (!snap.exists()) return;
          const data = snap.data();
          const playerUids = (data.playerUids || []).filter((uid) => uid !== rt.user.uid);
          const order = (data.order || []).filter((uid) => uid !== rt.user.uid);
          const players = { ...(data.players || {}) };
          delete players[rt.user.uid];
          transaction.update(ref, { playerUids, order, players, updatedAtMs: now() });
        });
      }
      if (paid) creditWallet(paid);
    }
    try { rt.unsub?.(); } catch {}
    rt.unsub = null; rt.room = null; rt.roomId = ""; rt.error = "";
    const game = pokerState();
    game.onlineRoomId = ""; game.onlinePaidCents = 0; game.mode = "menu";
    refresh();
  }
  function onlinePokerRender() {
    const rt = runtime.online;
    const room = rt.room;
    if (!room) {
      return `<section class="c82-online-lobby"><div class="c82-online-status"><span class="pulse"></span><div><small>FIREBASE ONLINE</small><b>${escapeText(rt.error || "Bereit für Online-Poker")}</b></div></div><div class="c82-online-actions"><button data-c82-action="poker-online-create">Lobby erstellen</button><button data-c82-action="poker-online-join">Mit Code beitreten</button><button data-c82-action="poker-menu">Zurück</button></div></section>`;
    }
    const user = rt.user;
    const game = room.game || {};
    const turnUid = room.order?.[Number(game.turnIndex || 0)] || "";
    const myTurn = room.status === "playing" && turnUid === user?.uid;
    const reveal = Number(game.reveal || 0);
    const players = (room.order || []).map((uid) => ({ ...(room.players?.[uid] || {}), id: uid, hand: game.hands?.[uid] || [] }));
    return `<section class="c82-online-room">
      <div class="c82-room-code"><span><small>LOBBY-CODE</small><b>${escapeText(room.id)}</b></span><span><small>EINSATZ</small><b>${formatEuroCents(room.stakeCents, true)}</b></span><span><small>STATUS</small><b>${escapeText(room.status)}</b></span></div>
      <div class="c82-poker-table online"><div class="c82-poker-pot"><small>POT</small><b>${formatEuroCents(game.potCents || room.stakeCents * players.length, true)}</b></div><div class="c82-community-cards">${Array.from({ length: 5 }, (_, index) => index < reveal ? cardMarkup(game.board?.[index]) : cardMarkup(null, { hidden: true })).join("")}</div>${players.map((player, index) => pokerSeatMarkup(player, index, room.status === "finished")).join("")}</div>
      ${room.status === "lobby" ? `<div class="c82-lobby-player-list">${players.map((player) => `<span>${escapeText(player.name)} <b>VIP ${player.vip}</b></span>`).join("")}</div>` : ""}
      ${room.status === "lobby" && room.hostUid === user?.uid ? `<button class="c82-main-action" data-c82-action="poker-online-start" ${players.length < 2 ? "disabled" : ""}>Online-Runde starten</button>` : ""}
      ${room.status === "playing" ? `<div class="c82-poker-actions"><button data-c82-action="poker-online-action" data-value="check" ${!myTurn ? "disabled" : ""}>CHECK / CALL</button><button class="raise" data-c82-action="poker-online-action" data-value="raise" ${!myTurn ? "disabled" : ""}>RAISE ${formatEuroCents(room.stakeCents, true)}</button><button class="fold" data-c82-action="poker-online-action" data-value="fold" ${!myTurn ? "disabled" : ""}>FOLD</button></div>` : ""}
      ${messageMarkup(room.status === "playing" ? (myTurn ? "Du bist am Zug." : `${escapeText(room.players?.[turnUid]?.name || "Spieler")} ist am Zug.`) : room.status === "finished" ? (game.winners || []).map((uid) => room.players?.[uid]?.name).filter(Boolean).join(" & ") + " gewinnt." : "Warte auf weitere Spieler.")}
      <button class="c82-leave-room" data-c82-action="poker-online-leave">${room.status === "lobby" ? "Lobby verlassen" : "Online-Tisch schließen"}</button>
    </section>`;
  }
  function pokerRender() {
    const root = ensureState();
    const game = root.poker;
    if (game.mode === "online") {
      if (game.onlineRoomId && !runtime.online.room && !runtime.online.busy && runtime.online.roomId !== game.onlineRoomId) {
        runtime.online.roomId = game.onlineRoomId;
        setTimeout(() => safeAsync(() => subscribeRoom(game.onlineRoomId)), 0);
      }
      return `<div class="c82-shell is-poker">${baseHeader("poker", "ONLINE CASINO")}${onlinePokerRender()}${infoModal("poker")}</div>`;
    }
    if (game.mode === "menu") {
      return `<div class="c82-shell is-poker">${baseHeader("poker", "TEXAS HOLD’EM")}
        <main class="c82-poker-menu"><section><span>🤖</span><small>SOFORT SPIELEN</small><h3>Bot-Tisch</h3><p>Spiele gegen zwei bis fünf Casino-Bots. Die Einsätze richten sich nach deiner VIP-Stufe.</p><label>Bots <select data-c82-poker-bots>${[2,3,4,5].map((count) => `<option ${Number(game.botCount || 3) === count ? "selected" : ""}>${count}</option>`).join("")}</select></label><button data-c82-action="poker-bots-start">Bot-Tisch öffnen</button></section><section><span>🌐</span><small>FIREBASE LIVE</small><h3>Online-Poker</h3><p>Erstelle eine Lobby oder tritt mit einem sechsstelligen Code bei. Zwei bis sechs Spieler.</p><button data-c82-action="poker-online-menu">Online-Lobby öffnen</button></section></main>
        ${stakeControl("poker", root.stakes.poker, false)}${messageMarkup(game.message)}${infoModal("poker")}</div>`;
    }
    const reveal = Number(game.reveal || 0);
    const showAll = game.status === "done";
    return `<div class="c82-shell is-poker">${baseHeader("poker", "TEXAS HOLD’EM")}
      <main class="c82-poker-table"><div class="c82-poker-pot"><small>POT</small><b>${formatEuroCents(game.potCents, true)}</b></div><div class="c82-community-cards">${Array.from({ length: 5 }, (_, index) => index < reveal ? cardMarkup(game.board[index]) : cardMarkup(null, { hidden: true })).join("")}</div>${(game.players || []).map((player, index) => pokerSeatMarkup(player, index, showAll)).join("")}</main>
      <div class="c82-poker-actions"><button data-c82-action="poker-bot-action" data-value="check" ${game.status !== "playing" ? "disabled" : ""}>CHECK / CALL</button><button class="raise" data-c82-action="poker-bot-action" data-value="raise" ${game.status !== "playing" ? "disabled" : ""}>RAISE ${formatEuroCents(game.stakeCents, true)}</button><button class="fold" data-c82-action="poker-bot-action" data-value="fold" ${game.status !== "playing" ? "disabled" : ""}>FOLD</button></div>
      ${messageMarkup(game.message)}<div class="c82-bottom-actions"><button data-c82-action="poker-menu">Tisch verlassen</button><button data-c82-action="poker-bots-start" ${game.status === "playing" ? "disabled" : ""}>Neue Bot-Hand</button></div>${infoModal("poker")}</div>`;
  }

  /* ---------------------------------- Slots ---------------------------------- */
  const SLOT_SYMBOLS = [
    { id: "7", icon: "7", weight: 4, mult: 45 },
    { id: "diamond", icon: "◆", weight: 7, mult: 24 },
    { id: "bell", icon: "🔔", weight: 12, mult: 12 },
    { id: "star", icon: "★", weight: 16, mult: 8 },
    { id: "bar", icon: "BAR", weight: 22, mult: 5 },
    { id: "cherry", icon: "🍒", weight: 30, mult: 3 },
    { id: "sun", icon: "☀", weight: 3, mult: 0 }
  ];
  const SLOT_LINES = [[0,1,2,3,4], [5,6,7,8,9], [10,11,12,13,14], [0,6,12,8,4], [10,6,2,8,14]];
  function slotPick() {
    const total = SLOT_SYMBOLS.reduce((sum, symbol) => sum + symbol.weight, 0);
    let roll = Math.random() * total;
    for (const symbol of SLOT_SYMBOLS) { roll -= symbol.weight; if (roll <= 0) return symbol.id; }
    return "cherry";
  }
  function slotSymbol(id) { return SLOT_SYMBOLS.find((symbol) => symbol.id === id) || SLOT_SYMBOLS.at(-2); }
  function slotScore(reels, bet) {
    let win = 0;
    SLOT_LINES.forEach((line) => {
      const ids = line.map((index) => reels[index]);
      const first = ids[0];
      let count = 1;
      while (count < ids.length && ids[count] === first) count += 1;
      if (count >= 3 && first !== "sun") {
        const factor = count === 5 ? 1 : count === 4 ? 0.45 : 0.18;
        win += Math.floor(bet * slotSymbol(first).mult * factor / SLOT_LINES.length);
      }
    });
    const scatters = reels.filter((id) => id === "sun").length;
    if (scatters >= 3) win += Math.floor(bet * (scatters === 5 ? 20 : scatters === 4 ? 8 : 3));
    return win;
  }
  function insertSlotCash(cents) {
    const game = ensureState().slots;
    cents = Math.max(0, Math.round(cents));
    if (!cents || wallet() < cents) { game.message = "Nicht genug Guthaben im Casino-Wallet."; return refresh(); }
    addWallet(-cents);
    game.machineCreditCents += cents;
    game.message = `${formatEuroCents(cents, true)} in den Automaten eingezahlt.`;
    refresh();
  }
  function slotCashOut() {
    const game = ensureState().slots;
    if (game.spinning || game.machineCreditCents <= 0) return;
    addWallet(game.machineCreditCents);
    game.message = `${formatEuroCents(game.machineCreditCents, true)} zurück ins Casino-Wallet gebucht.`;
    game.machineCreditCents = 0;
    refresh();
  }
  function spinSlotV82(fromAuto = false) {
    const game = ensureState().slots;
    if (game.spinning) return;
    const bet = clamp(game.betCents, 100, vipLimitCents());
    if (game.machineCreditCents < bet) {
      game.auto = false; game.autoLeft = 0; game.message = "Zu wenig Automaten-Guthaben."; return refresh();
    }
    game.machineCreditCents -= bet;
    houseTakes(bet);
    const reels = Array.from({ length: 15 }, slotPick);
    const win = slotScore(reels, bet);
    game.spinning = true;
    game.finishAt = now() + 950;
    game.pending = { reels, win, bet };
    game.message = "Walzen drehen …";
    game.stats.spins += 1;
    refresh();
    addTimer("slot-finish", finishSlotV82, 960);
    if (fromAuto) game.autoLeft = Math.max(0, game.autoLeft - 1);
  }
  function finishSlotV82() {
    const game = ensureState().slots;
    if (!game.spinning || !game.pending) return;
    game.reels = game.pending.reels;
    game.lastWinCents = game.pending.win;
    if (game.pending.win > 0) {
      creditMachine(game.pending.win);
      game.machineCreditCents += game.pending.win;
      game.stats.wins += 1;
      game.stats.biggest = Math.max(game.stats.biggest, game.pending.win);
      game.message = `Gewinn: ${formatEuroCents(game.pending.win, true)}`;
    } else game.message = "Kein Gewinn. Nächster Dreh?";
    game.spinning = false;
    game.finishAt = 0;
    game.pending = null;
    refresh();
    if (game.auto && game.autoLeft > 0 && game.machineCreditCents >= game.betCents) addTimer("slot-auto", () => spinSlotV82(true), 650);
    else { game.auto = false; game.autoLeft = 0; saveGame(); }
  }
  function toggleAutoSlot() {
    const game = ensureState().slots;
    if (game.auto) { game.auto = false; game.autoLeft = 0; return refresh(); }
    game.auto = true; game.autoLeft = 10;
    refresh();
    spinSlotV82(true);
  }
  function slotRender() {
    const root = ensureState();
    const game = root.slots;
    const billValues = vipPresetCents().filter((value) => value >= 1_000).slice(0, 6);
    const symbols = game.spinning ? Array.from({ length: 15 }, (_, index) => SLOT_SYMBOLS[(index + Math.floor(now() / 100)) % SLOT_SYMBOLS.length].id) : game.reels;
    return `<div class="c82-shell is-slots">${baseHeader("slots", "PREMIUM SLOT MACHINE")}
      <main class="c82-slot-machine"><section class="c82-slot-paytable"><div><b>7</b><span>5× 45</span><span>4× 20</span><span>3× 8</span></div><div><b>◆</b><span>5× 24</span><span>4× 11</span><span>3× 4</span></div><div><b>★</b><span>5× 8</span><span>4× 4</span><span>3× 2</span></div><div><b>☀</b><span>3+ Bonus</span></div></section>
        <section class="c82-slot-reels ${game.spinning ? "is-spinning" : ""}">${symbols.map((id) => `<span class="symbol-${id}">${escapeText(slotSymbol(id).icon)}</span>`).join("")}</section>
        <section class="c82-slot-display"><span><small>BANK</small><b>${formatEuroCents(game.machineCreditCents, true)}</b></span><span><small>GEWINN</small><b>${formatEuroCents(game.lastWinCents, true)}</b></span><span><small>EINSATZ</small><b>${formatEuroCents(game.betCents, true)}</b></span></section>
        <section class="c82-slot-buttons"><button class="start" data-c82-action="slot-spin" ${game.spinning ? "disabled" : ""}>START</button><button data-c82-action="slot-bet-minus" ${game.spinning ? "disabled" : ""}>−</button><button data-c82-action="slot-bet-plus" ${game.spinning ? "disabled" : ""}>+</button><button class="risk" data-c82-action="slot-max" ${game.spinning ? "disabled" : ""}>MAX</button><button class="auto ${game.auto ? "is-active" : ""}" data-c82-action="slot-auto">${game.auto ? `STOP ${game.autoLeft}` : "AUTOSTART"}</button></section>
        <section class="c82-slot-cash"><div><small>SCHEIN AUSWÄHLEN UND EINFÜHREN</small><div>${billValues.map((value) => `<button data-c82-action="slot-insert" data-value="${value}" ${wallet() < value ? "disabled" : ""}>${formatEuroCents(value, true)}</button>`).join("")}</div></div><div class="c82-slot-inlet"><span>SWIPE / KARTE</span><i></i></div><button data-c82-action="slot-cashout" ${game.spinning || game.machineCreditCents <= 0 ? "disabled" : ""}>AUSZAHLEN</button></section>
      </main>${messageMarkup(game.message)}${infoModal("slots")}</div>`;
  }

  /* ------------------------------ High or Lower ------------------------------ */
  function highlowState() { return ensureState().highlow; }
  function highlowChance(lossStreak) {
    if (lossStreak < 10) return 0.40;
    return Math.min(0.68, 0.40 + (lossStreak - 9) * 0.04);
  }
  function randomMiddleCard() {
    const rank = RANKS[randomInt(2, 10)];
    return { rank, suit: SUITS[randomInt(0, 3)] };
  }
  function cardForOutcome(current, choice, win) {
    const currentValue = rankValue(current.rank);
    const valid = RANKS.map((rank) => ({ rank, value: rankValue(rank) })).filter((entry) => choice === "higher" ? (win ? entry.value > currentValue : entry.value <= currentValue) : (win ? entry.value < currentValue : entry.value >= currentValue));
    const picked = valid.length ? valid[randomInt(0, valid.length - 1)].rank : current.rank;
    return { rank: picked, suit: SUITS[randomInt(0, 3)] };
  }
  function startHighlowV82() {
    const root = ensureState();
    const game = root.highlow;
    const stake = clamp(root.stakes.highlow, vipMinCents(), vipLimitCents());
    if (!debitWallet(stake)) { game.message = "Nicht genug Casino-Guthaben."; return refresh(); }
    game.status = "playing";
    game.stakeCents = stake;
    game.current = randomMiddleCard();
    game.next = null;
    game.round = 0;
    game.riskCents = stake;
    game.message = "Ist die nächste Karte höher oder niedriger?";
    game.stats.rounds += 1;
    refresh();
  }
  function guessHighlowV82(choice) {
    const game = highlowState();
    if (game.status !== "playing") return;
    const chance = highlowChance(game.lossStreak);
    const win = Math.random() < chance;
    game.next = cardForOutcome(game.current, choice, win);
    if (win) {
      game.round += 1;
      game.lossStreak = Math.max(0, game.lossStreak - 2);
      game.riskCents = Math.floor(game.stakeCents * Math.pow(1.72, game.round));
      game.history.unshift({ card: game.next, choice, win: true });
      game.current = game.next;
      game.next = null;
      game.message = `Richtig! Stufe ${game.round}/10 · ${formatEuroCents(game.riskCents, true)}`;
      if (game.round >= 10) collectHighlowV82(true);
      else refresh();
    } else {
      game.lossStreak += 1;
      game.history.unshift({ card: game.next, choice, win: false });
      game.status = "done";
      game.riskCents = 0;
      game.message = `Falsch. Verlustserie: ${game.lossStreak}. Die Ausgleichschance steigt ab 10 Niederlagen.`;
      refresh();
    }
  }
  function collectHighlowV82(auto = false) {
    const game = highlowState();
    if (game.status !== "playing" || game.round <= 0 || game.riskCents <= 0) return;
    creditWallet(game.riskCents);
    game.stats.wins += 1;
    game.stats.biggest = Math.max(game.stats.biggest, game.riskCents);
    game.status = "done";
    game.message = `${auto ? "10er-Serie geschafft" : "Gewinn gesichert"}: ${formatEuroCents(game.riskCents, true)}`;
    refresh();
  }
  function highlowRender() {
    const root = ensureState();
    const game = root.highlow;
    const chance = Math.round(highlowChance(game.lossStreak) * 100);
    return `<div class="c82-shell is-highlow">${baseHeader("highlow", "HIGH OR LOWER")}
      <main class="c82-highlow-table"><aside class="c82-highlow-stats"><span><small>STREAK</small><b>${game.round}</b></span><span><small>VERLUSTSERIE</small><b>${game.lossStreak}</b></span><span><small>AKTUELLE CHANCE</small><b>${chance}%</b></span></aside><section class="c82-highlow-cards"><div><small>AKTUELLE KARTE</small>${game.current ? cardMarkup(game.current) : cardMarkup(null, { hidden: true })}</div><b>VS</b><div><small>NÄCHSTE KARTE</small>${game.next ? cardMarkup(game.next) : cardMarkup(null, { hidden: true })}</div></section><section class="c82-highlow-win"><small>AKTUELLER GEWINN</small><b>${formatEuroCents(game.riskCents, true)}</b><div>${Array.from({ length: 10 }, (_, index) => `<i class="${index < game.round ? "done" : ""}"></i>`).join("")}</div></section><section class="c82-highlow-buttons"><button class="higher" data-c82-action="highlow-guess" data-value="higher" ${game.status !== "playing" ? "disabled" : ""}>▲ HIGHER</button><button class="lower" data-c82-action="highlow-guess" data-value="lower" ${game.status !== "playing" ? "disabled" : ""}>▼ LOWER</button></section></main>
      ${stakeControl("highlow", root.stakes.highlow, game.status === "playing")}
      <div class="c82-bottom-actions"><button data-c82-action="highlow-start" ${game.status === "playing" ? "disabled" : ""}>Neue Runde</button><button data-c82-action="highlow-collect" ${game.status !== "playing" || game.round < 1 ? "disabled" : ""}>Gewinn nehmen</button></div>${messageMarkup(game.message)}${infoModal("highlow")}</div>`;
  }

  /* -------------------------------- Roulette -------------------------------- */
  const RED_NUMBERS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
  function rouletteState() { return ensureState().roulette; }
  function addRouletteBetV82(type) {
    const game = rouletteState();
    if (game.spinning) return;
    const chip = clamp(game.selectedChipCents, 100, vipLimitCents());
    const total = game.bets.reduce((sum, bet) => sum + bet.amountCents, 0);
    if (total + chip > wallet()) { game.message = "Der vorgemerkte Einsatz ist höher als dein Wallet."; return refresh(); }
    const existing = game.bets.find((bet) => bet.type === type);
    if (existing) existing.amountCents += chip;
    else game.bets.push({ type, amountCents: chip });
    game.message = `${rouletteLabel(type)} · ${formatEuroCents((existing?.amountCents || chip), true)}`;
    refresh();
  }
  function rouletteLabel(type) {
    if (type.startsWith("n:")) return `Zahl ${type.slice(2)}`;
    return ({ red: "Rot", black: "Schwarz", even: "Gerade", odd: "Ungerade", low: "1–18", high: "19–36", d1: "1. Dutzend", d2: "2. Dutzend", d3: "3. Dutzend" })[type] || type;
  }
  function rouletteWins(type, number) {
    if (type.startsWith("n:")) return Number(type.slice(2)) === number ? 36 : 0;
    if (type === "red") return RED_NUMBERS.has(number) ? 2 : 0;
    if (type === "black") return number !== 0 && !RED_NUMBERS.has(number) ? 2 : 0;
    if (type === "even") return number !== 0 && number % 2 === 0 ? 2 : 0;
    if (type === "odd") return number % 2 === 1 ? 2 : 0;
    if (type === "low") return number >= 1 && number <= 18 ? 2 : 0;
    if (type === "high") return number >= 19 && number <= 36 ? 2 : 0;
    if (type === "d1") return number >= 1 && number <= 12 ? 3 : 0;
    if (type === "d2") return number >= 13 && number <= 24 ? 3 : 0;
    if (type === "d3") return number >= 25 && number <= 36 ? 3 : 0;
    return 0;
  }
  function spinRouletteV82() {
    const game = rouletteState();
    if (game.spinning || !game.bets.length) return;
    const total = game.bets.reduce((sum, bet) => sum + bet.amountCents, 0);
    if (!debitWallet(total)) { game.message = "Nicht genug Guthaben für alle gesetzten Chips."; return refresh(); }
    game.spinning = true;
    game.finishAt = now() + 3300;
    game.winningNumber = randomInt(0, 36);
    game.rotation = Number(game.rotation || 0) + 1440 + randomInt(0, 359);
    game.message = "Das Roulette-Rad dreht …";
    game.stats.spins += 1;
    refresh();
    addTimer("roulette-finish", finishRouletteV82, 3320);
  }
  function finishRouletteV82() {
    const game = rouletteState();
    if (!game.spinning) return;
    const number = Number(game.winningNumber);
    let payout = 0;
    game.bets.forEach((bet) => { payout += bet.amountCents * rouletteWins(bet.type, number); });
    if (payout > 0) {
      creditWallet(payout);
      game.stats.wins += 1;
      game.stats.biggest = Math.max(game.stats.biggest, payout);
      game.message = `Kugel auf ${number}. Gewinn ${formatEuroCents(payout, true)}.`;
    } else game.message = `Kugel auf ${number}. Kein Gewinn.`;
    game.history.unshift(number);
    game.history = game.history.slice(0, 12);
    game.bets = [];
    game.spinning = false;
    game.finishAt = 0;
    refresh();
  }
  function rouletteBetAmount(type) {
    return rouletteState().bets.find((bet) => bet.type === type)?.amountCents || 0;
  }
  function rouletteCell(type, label, extra = "") {
    const amount = rouletteBetAmount(type);
    return `<button class="${extra} ${amount ? "has-chip" : ""}" data-c82-action="roulette-bet" data-value="${type}"><span>${escapeText(label)}</span>${amount ? `<i>${formatEuroCents(amount, true)}</i>` : ""}</button>`;
  }
  function rouletteRender() {
    const root = ensureState();
    const game = root.roulette;
    const total = game.bets.reduce((sum, bet) => sum + bet.amountCents, 0);
    return `<div class="c82-shell is-roulette">${baseHeader("roulette", "EUROPEAN ROULETTE")}
      <main class="c82-roulette-layout"><section class="c82-wheel-wrap"><div class="c82-wheel ${game.spinning ? "is-spinning" : ""}" style="--wheel-rotation:${game.rotation}deg"><div class="c82-wheel-numbers">${Array.from({ length: 37 }, (_, index) => `<i style="--i:${index}">${index}</i>`).join("")}</div><div class="c82-wheel-center">♛</div><span class="c82-ball"></span></div><div class="c82-hot-numbers"><small>LETZTE ZAHLEN</small>${game.history.map((number) => `<b class="${number === 0 ? "green" : RED_NUMBERS.has(number) ? "red" : "black"}">${number}</b>`).join("") || "–"}</div></section>
        <section class="c82-roulette-board"><div class="c82-number-grid">${rouletteCell("n:0", "0", "zero")}${Array.from({ length: 36 }, (_, index) => { const number = index + 1; return rouletteCell(`n:${number}`, String(number), RED_NUMBERS.has(number) ? "red" : "black"); }).join("")}</div><div class="c82-outside-grid">${rouletteCell("d1", "1st 12")}${rouletteCell("d2", "2nd 12")}${rouletteCell("d3", "3rd 12")}${rouletteCell("low", "1–18")}${rouletteCell("even", "GERADE")}${rouletteCell("red", "ROT", "red")}${rouletteCell("black", "SCHWARZ", "black")}${rouletteCell("odd", "UNGERADE")}${rouletteCell("high", "19–36")}</div></section>
        <aside class="c82-roulette-control"><span><small>EINSATZ</small><b>${formatEuroCents(total, true)}</b></span><div class="c82-chip-column">${vipPresetCents().slice(0, 7).map((value) => `<button class="${game.selectedChipCents === value ? "is-active" : ""}" data-c82-action="roulette-chip" data-value="${value}">${formatEuroCents(value, true)}</button>`).join("")}</div><button class="spin" data-c82-action="roulette-spin" ${game.spinning || !game.bets.length ? "disabled" : ""}>↻ DREHEN</button><button data-c82-action="roulette-clear" ${game.spinning || !game.bets.length ? "disabled" : ""}>CHIPS LÖSCHEN</button></aside></main>
      ${messageMarkup(game.message)}${infoModal("roulette")}</div>`;
  }

  /* ----------------------------- Render / Events ----------------------------- */
  function renderGame(gameName) {
    ensureState();
    tick();
    if (gameName === "blackjack") return blackjackRender();
    if (gameName === "poker") return pokerRender();
    if (gameName === "slots") return slotRender();
    if (gameName === "highlow") return highlowRender();
    return rouletteRender();
  }
  function setStake(game, cents) {
    const root = ensureState();
    root.stakes[game] = clamp(Math.round(cents), vipMinCents(), vipLimitCents());
    if (game === "poker") root.poker.stakeCents = root.stakes.poker;
    if (game === "highlow") root.highlow.stakeCents = root.stakes.highlow;
    if (game === "roulette") root.roulette.selectedChipCents = root.stakes.roulette;
    refresh();
  }
  async function safeAsync(work) {
    if (runtime.online.busy) return;
    runtime.online.busy = true;
    try { await work(); }
    catch (error) { runtime.online.error = String(error?.message || error || "Online-Aktion fehlgeschlagen."); pokerState().message = runtime.online.error; }
    finally { runtime.online.busy = false; refresh(); }
  }
  function bind(root) {
    if (!root || root.dataset.casinoV82Bound === "true") return;
    root.dataset.casinoV82Bound = "true";
    const panel = root.closest(".casino-world-panel");
    if (panel && root.querySelector(".c82-shell")) panel.classList.add("casino-v82-game-panel");
    root.addEventListener("click", (event) => {
      const button = event.target.closest("[data-c82-action]");
      if (!button || button.disabled) return;
      const action = button.dataset.c82Action;
      const value = button.dataset.value;
      if (action === "info") { ensureState().info = button.dataset.game; return refresh(); }
      if (action === "close-info") { ensureState().info = ""; return refresh(); }
      if (action === "stake-preset") return setStake(button.dataset.game, Number(button.dataset.value));
      if (action === "stake-custom") {
        const input = root.querySelector(`[data-c82-stake-input="${button.dataset.game}"]`);
        return setStake(button.dataset.game, Math.round(Number(input?.value || 0) * 100));
      }
      if (action === "bj-start") return startBlackjackV82();
      if (action === "bj-hit") return blackjackHitV82();
      if (action === "bj-stand") return blackjackStandV82();
      if (action === "bj-double") return blackjackDoubleV82();
      if (action === "bj-split") return blackjackSplitV82();
      if (action === "poker-bots-start") return startPokerBotsV82();
      if (action === "poker-bot-action") return pokerBotsActionV82(value);
      if (action === "poker-menu") { pokerState().mode = "menu"; return refresh(); }
      if (action === "poker-online-menu") { pokerState().mode = "online"; runtime.online.error = ""; return refresh(); }
      if (action === "poker-online-create") return safeAsync(createOnlinePokerRoom);
      if (action === "poker-online-join") return safeAsync(joinOnlinePokerRoom);
      if (action === "poker-online-start") return safeAsync(startOnlinePokerGame);
      if (action === "poker-online-action") return safeAsync(() => onlinePokerAction(value));
      if (action === "poker-online-leave") return safeAsync(leaveOnlinePokerRoom);
      if (action === "slot-insert") return insertSlotCash(Number(value));
      if (action === "slot-cashout") return slotCashOut();
      if (action === "slot-spin") return spinSlotV82(false);
      if (action === "slot-auto") return toggleAutoSlot();
      if (action === "slot-bet-minus") { const game = ensureState().slots; game.betCents = Math.max(100, Math.floor(game.betCents / 2)); return refresh(); }
      if (action === "slot-bet-plus") { const game = ensureState().slots; game.betCents = Math.min(vipLimitCents(), Math.max(100, game.betCents * 2)); return refresh(); }
      if (action === "slot-max") { ensureState().slots.betCents = Math.min(vipLimitCents(), ensureState().slots.machineCreditCents); return refresh(); }
      if (action === "highlow-start") return startHighlowV82();
      if (action === "highlow-guess") return guessHighlowV82(value);
      if (action === "highlow-collect") return collectHighlowV82(false);
      if (action === "roulette-chip") { rouletteState().selectedChipCents = Number(value); return refresh(); }
      if (action === "roulette-bet") return addRouletteBetV82(value);
      if (action === "roulette-spin") return spinRouletteV82();
      if (action === "roulette-clear") { rouletteState().bets = []; rouletteState().message = "Alle Chips entfernt."; return refresh(); }
    });
    root.addEventListener("change", (event) => {
      if (event.target.matches("[data-c82-poker-bots]")) { pokerState().botCount = Number(event.target.value); saveGame(); }
    });
  }
  function tick() {
    const root = ensureState();
    const current = now();
    if (root.slots.spinning && root.slots.finishAt && current >= root.slots.finishAt) finishSlotV82();
    if (root.roulette.spinning && root.roulette.finishAt && current >= root.roulette.finishAt) finishRouletteV82();
  }
  function leave() {
    try { runtime.online.unsub?.(); } catch {}
    runtime.online.unsub = null;
    runtime.online.room = null;
    runtime.online.roomId = "";
  }

  window.JKCasinoV82 = Object.freeze({
    version: VERSION,
    render: renderGame,
    bind,
    tick,
    leave,
    ensureState
  });
})();
