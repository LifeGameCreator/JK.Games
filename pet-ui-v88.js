(() => {
  "use strict";

  const VERSION = "2026-07-29-pet-ui-v88-unified-shop-design";
  const DAY_MS = 86_400_000;
  const OFFER_COUNT = 30;
  const OFFER_REFRESH_MS = 6 * 60 * 60 * 1000;
  const PET_XP_STEP = 50;
  const GAME_IDS = new Set(["aergermensch-kl", "mrdn-kl"]);

  const SHOP_CATEGORIES = [
    { id: "all", label: "Alle", icon: "▦" },
    { id: "food", label: "Futter & Trinken", icon: "🥫" },
    { id: "play", label: "Spielzeug", icon: "🧸" },
    { id: "care", label: "Pflege", icon: "✨" },
    { id: "travel", label: "Unterwegs", icon: "🦮" }
  ];

  const SUPPLIES = [
    { id: "food", category: "food", name: "Tierfutter", icon: "🥫", price: 18, text: "Futter für Hunde und Katzen." },
    { id: "water", category: "food", name: "Frisches Wasser", icon: "💧", price: 8, text: "Eine Portion frisches Trinkwasser." },
    { id: "treats", category: "food", name: "Leckerli", icon: "🦴", price: 12, text: "Kleine Belohnung für Hund oder Katze." },
    { id: "toy", category: "play", name: "Spielzeug", icon: "🧸", price: 36, text: "Mehrfach verwendbar und für viele Tierarten geeignet.", reusable: true },
    { id: "care", category: "care", name: "Pflege-Set", icon: "🧴", price: 22, text: "Für Fell, Krallen und allgemeine Pflege." },
    { id: "poopBags", category: "travel", name: "Kotbeutel 10er-Pack", icon: "🛍️", price: 4, amount: 10, text: "Zehn Beutel für den nächsten Gassigang. Wenn dein Hund muss, brauchst du einen Beutel." },
    { id: "hay", category: "food", name: "Heu", icon: "🌾", price: 14, text: "Grundfutter für Kaninchen und Meerschweinchen." },
    { id: "vegetables", category: "food", name: "Frischgemüse", icon: "🥕", price: 16, text: "Frische Portion für kleine Pflanzenfresser." },
    { id: "smallFood", category: "food", name: "Kleintierfutter", icon: "🌰", price: 13, text: "Geeignet für Hamster und kleine Nager." },
    { id: "birdFood", category: "food", name: "Vogelfutter", icon: "🌻", price: 15, text: "Körner und Saaten für Vögel." },
    { id: "cageCare", category: "care", name: "Gehege-Pflege", icon: "🧹", price: 20, text: "Neue Einstreu und Reinigung für Käfig oder Gehege." },
    { id: "reptileFood", category: "food", name: "Schildkrötenfutter", icon: "🥬", price: 17, text: "Artgerechte Portion für Schildkröten." },
    { id: "fishFood", category: "food", name: "Fischfutter", icon: "🫧", price: 10, text: "Eine kleine Portion für Aquarienfische." },
    { id: "aquariumCare", category: "care", name: "Aquarium-Pflege", icon: "🧪", price: 24, text: "Wasserpflege und Reinigung für das Aquarium." },
    { id: "aquariumDecor", category: "play", name: "Aquarium-Deko", icon: "🪸", price: 44, text: "Mehrfach verwendbare Beschäftigung und Dekoration.", reusable: true }
  ];

  const ACTIONS = {
    dog: [
      { id: "feed", label: "Füttern", icon: "🥫", item: "food", xp: 2, hunger: 34 },
      { id: "water", label: "Wasser geben", icon: "💧", item: "water", xp: 1, thirst: 40 },
      { id: "treat", label: "Leckerli", icon: "🦴", item: "treats", xp: 2, happiness: 12 },
      { id: "play", label: "Spielen", icon: "🧸", item: "toy", xp: 4, happiness: 24 },
      { id: "walk", label: "Gassi gehen", icon: "🦮", xp: 5, happiness: 27, care: 8, toiletWalk: true },
      { id: "pet", label: "Streicheln", icon: "🤍", xp: 1, happiness: 10 },
      { id: "care", label: "Pflegen", icon: "🧴", item: "care", xp: 3, care: 23 }
    ],
    cat: [
      { id: "feed", label: "Füttern", icon: "🥫", item: "food", xp: 2, hunger: 34 },
      { id: "water", label: "Wasser geben", icon: "💧", item: "water", xp: 1, thirst: 40 },
      { id: "treat", label: "Leckerli", icon: "🐟", item: "treats", xp: 2, happiness: 12 },
      { id: "play", label: "Spielen", icon: "🧶", item: "toy", xp: 4, happiness: 24 },
      { id: "pet", label: "Streicheln", icon: "🤍", xp: 1, happiness: 10 },
      { id: "care", label: "Bürsten", icon: "🪮", item: "care", xp: 3, care: 23 },
      { id: "clean", label: "Katzenplatz reinigen", icon: "🧹", item: "cageCare", xp: 3, care: 20 }
    ],
    rabbit: [
      { id: "hay", label: "Heu geben", icon: "🌾", item: "hay", xp: 2, hunger: 32 },
      { id: "water", label: "Wasser geben", icon: "💧", item: "water", xp: 1, thirst: 40 },
      { id: "vegetables", label: "Gemüse geben", icon: "🥕", item: "vegetables", xp: 2, hunger: 18, happiness: 8 },
      { id: "play", label: "Beschäftigen", icon: "🧸", item: "toy", xp: 4, happiness: 22 },
      { id: "pet", label: "Sanft streicheln", icon: "🤍", xp: 1, happiness: 9 },
      { id: "clean", label: "Gehege reinigen", icon: "🧹", item: "cageCare", xp: 3, care: 25 }
    ],
    "guinea-pig": [
      { id: "hay", label: "Heu geben", icon: "🌾", item: "hay", xp: 2, hunger: 32 },
      { id: "water", label: "Wasser geben", icon: "💧", item: "water", xp: 1, thirst: 40 },
      { id: "vegetables", label: "Gemüse geben", icon: "🥕", item: "vegetables", xp: 2, hunger: 18, happiness: 8 },
      { id: "play", label: "Beschäftigen", icon: "🧸", item: "toy", xp: 4, happiness: 22 },
      { id: "pet", label: "Streicheln", icon: "🤍", xp: 1, happiness: 9 },
      { id: "clean", label: "Gehege reinigen", icon: "🧹", item: "cageCare", xp: 3, care: 25 }
    ],
    hamster: [
      { id: "smallFood", label: "Füttern", icon: "🌰", item: "smallFood", xp: 2, hunger: 34 },
      { id: "water", label: "Wasser geben", icon: "💧", item: "water", xp: 1, thirst: 40 },
      { id: "play", label: "Beschäftigen", icon: "🎡", item: "toy", xp: 4, happiness: 22 },
      { id: "clean", label: "Gehege reinigen", icon: "🧹", item: "cageCare", xp: 3, care: 25 },
      { id: "observe", label: "Beobachten", icon: "👀", xp: 1, happiness: 7 }
    ],
    bird: [
      { id: "birdFood", label: "Füttern", icon: "🌻", item: "birdFood", xp: 2, hunger: 34 },
      { id: "water", label: "Wasser geben", icon: "💧", item: "water", xp: 1, thirst: 40 },
      { id: "talk", label: "Mit ihm reden", icon: "💬", xp: 2, happiness: 12 },
      { id: "play", label: "Spielzeug anbieten", icon: "🪁", item: "toy", xp: 4, happiness: 22 },
      { id: "flight", label: "Freiflug", icon: "🪽", xp: 5, happiness: 27, care: 7 },
      { id: "clean", label: "Käfig reinigen", icon: "🧹", item: "cageCare", xp: 3, care: 25 }
    ],
    turtle: [
      { id: "reptileFood", label: "Füttern", icon: "🥬", item: "reptileFood", xp: 2, hunger: 34 },
      { id: "water", label: "Wasser erneuern", icon: "💧", item: "water", xp: 2, thirst: 38, care: 6 },
      { id: "warm", label: "Wärmeplatz prüfen", icon: "☀️", xp: 2, happiness: 8, care: 12 },
      { id: "clean", label: "Lebensraum reinigen", icon: "🧹", item: "cageCare", xp: 3, care: 25 },
      { id: "observe", label: "Beobachten", icon: "👀", xp: 1, happiness: 7 },
      { id: "play", label: "Umgebung gestalten", icon: "🪨", item: "toy", xp: 3, happiness: 16 }
    ],
    fish: [
      { id: "fishFood", label: "Füttern", icon: "🫧", item: "fishFood", xp: 2, hunger: 34 },
      { id: "aquariumCare", label: "Wasserwerte pflegen", icon: "🧪", item: "aquariumCare", xp: 3, thirst: 38, care: 22 },
      { id: "clean", label: "Aquarium reinigen", icon: "🧹", item: "aquariumCare", xp: 4, care: 28 },
      { id: "decorate", label: "Aquarium dekorieren", icon: "🪸", item: "aquariumDecor", xp: 3, happiness: 19 },
      { id: "observe", label: "Fische beobachten", icon: "👀", xp: 1, happiness: 8 }
    ]
  };

  const euroFmt = typeof euro?.format === "function" ? euro : new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
  const esc = (value) => typeof escapeHtml === "function" ? escapeHtml(value) : String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));
  const randomInt = (min, max) => Math.floor(min + Math.random() * (Math.max(min, max) - min + 1));
  const choice = (list) => list[Math.floor(Math.random() * list.length)];
  const money = (value) => euroFmt.format(Number(value || 0));

  function types() {
    return window.LifeBuilderExpansion?.debug?.getPetTypes?.() || [];
  }

  function typeOfPet(id) {
    return types().find((entry) => entry.id === id) || {
      id: id || "pet", label: "Haustier", basePrice: 250, icons: ["🐾"], breeds: ["Mischling"], names: ["Buddy"], descriptions: ["Treuer Begleiter"]
    };
  }

  function supply(id) { return SUPPLIES.find((item) => item.id === id); }
  function petIcon(pet) { return pet?.icon || typeOfPet(pet?.type).icons?.[0] || "🐾"; }
  function petText(pet) { return pet?.description || typeOfPet(pet?.type).descriptions?.[0] || "Treuer Begleiter"; }
  function petLevel(pet) { return Math.max(1, Math.min(10, Math.floor(Number(pet?.level || 1)))); }
  function petXpNeed(level) { return level >= 10 ? 0 : Math.max(1, Math.min(9, Number(level || 1))) * PET_XP_STEP; }
  function petNeed(pet, key) { return clamp(pet?.[key] ?? 80); }
  function petAgeYears(pet) { return Math.max(0, Math.floor((Date.now() - Number(pet?.birthAtMs || Date.now())) / (365.2425 * DAY_MS))); }
  function note(text) { try { if (typeof addFeed === "function") addFeed(text); } catch {} }

  function ensurePetState() {
    if (typeof state === "undefined" || !state) return null;
    state.pets = Array.isArray(state.pets) ? state.pets.filter(Boolean) : [];
    state.petShelter ||= { lastRefreshAt: 0, offers: [] };
    state.petShelter.offers = Array.isArray(state.petShelter.offers) ? state.petShelter.offers : [];
    state.petInventory ||= {};
    const defaults = { food: 3, water: 3, treats: 2, toy: 1, care: 1, poopBags: 10, hay: 2, vegetables: 1, smallFood: 2, birdFood: 2, cageCare: 1, reptileFood: 1, fishFood: 3, aquariumCare: 1, aquariumDecor: 1 };
    Object.entries(defaults).forEach(([id, amount]) => {
      if (!Number.isFinite(Number(state.petInventory[id]))) state.petInventory[id] = amount;
      state.petInventory[id] = Math.max(0, Math.floor(Number(state.petInventory[id] || 0)));
    });
    state.petStats ||= { adopted: 0, careActions: 0, maxLevel: 0 };

    state.pets.forEach((pet, index) => {
      pet.id = String(pet.id || `pet-${Date.now()}-${index}`);
      pet.level = petLevel(pet);
      pet.xp = Math.max(0, Number(pet.xp || 0));
      if (pet.xpMode !== "cumulative50") {
        pet.xp = Math.min(450, Math.max(0, (pet.level - 1) * PET_XP_STEP + pet.xp));
        pet.xpMode = "cumulative50";
      }
      pet.level = Math.min(10, Math.max(1, Math.floor(pet.xp / PET_XP_STEP) + 1));
      pet.hunger = petNeed(pet, "hunger");
      pet.thirst = petNeed(pet, "thirst");
      pet.happiness = petNeed(pet, "happiness");
      pet.care = petNeed(pet, "care");
      if (pet.type === "dog") pet.toiletNeed = clamp(pet.toiletNeed ?? 25);
    });

    let active = state.pets.find((pet) => pet.id === state.activePetId);
    if (!active) active = state.pets.find((pet) => pet.active === true);
    if (!active) active = state.pets[0] || null;
    state.activePetId = active?.id || "";
    state.pets.forEach((pet) => { pet.active = !!active && pet.id === active.id; });
    return state;
  }

  function activePet(data = ensurePetState()) {
    return data?.pets?.find((pet) => pet.id === data.activePetId) || data?.pets?.[0] || null;
  }

  function saveAll({ rerender = true } = {}) {
    try { if (typeof save === "function") save(); } catch {}
    if (!rerender) return;
    try { if (typeof render === "function") render(); }
    catch {
      try { if (typeof renderCharacter === "function") renderCharacter(); } catch {}
      try { if (typeof updateHeaderStatusUi === "function") updateHeaderStatusUi(true); } catch {}
    }
  }

  function setActivePet(id, { refreshCharacter = true } = {}) {
    const data = ensurePetState();
    const pet = data?.pets?.find((entry) => entry.id === String(id || ""));
    if (!pet) return false;
    data.activePetId = pet.id;
    data.pets.forEach((entry) => { entry.active = entry.id === pet.id; });
    saveAll();
    note(`${pet.name} wird jetzt bei deinem Charakter angezeigt.`);
    if (refreshCharacter && document.querySelector("#detailDialog .character-hub") && typeof openCharacterHub === "function") {
      openCharacterHub("overview");
    }
    return true;
  }

  function normalizeOffer(raw, index = 0) {
    const type = typeOfPet(raw?.type);
    const icon = raw?.icon || choice(type.icons || ["🐾"]);
    const years = Math.max(0, Number(raw?.ageYears ?? randomInt(0, type.id === "fish" ? 3 : 9)));
    return {
      id: String(raw?.id || `pet-offer-${Date.now()}-${index}-${randomInt(100, 999)}`),
      type: type.id,
      name: String(raw?.name || choice(type.names || ["Buddy"])) .slice(0, 24),
      icon,
      breed: String(raw?.breed || choice(type.breeds || [type.label])),
      description: String(raw?.description || choice(type.descriptions || ["Treuer Begleiter"])),
      temperament: String(raw?.temperament || choice(["ruhig", "neugierig", "verspielt", "sanft", "aufgeweckt"])),
      birthAtMs: Number(raw?.birthAtMs || Date.now() - years * 365.2425 * DAY_MS),
      price: Math.max(35, Math.round(Number(raw?.price || type.basePrice || 250) * (0.78 + Math.random() * 0.45) / 5) * 5)
    };
  }

  function generateOffers(force = false) {
    const data = ensurePetState();
    if (!data) return [];
    const fresh = Date.now() - Number(data.petShelter.lastRefreshAt || 0) < OFFER_REFRESH_MS;
    if (!force && fresh && data.petShelter.offers.length >= 16) {
      data.petShelter.offers = data.petShelter.offers.map(normalizeOffer);
      return data.petShelter.offers;
    }
    const allTypes = types();
    if (!allTypes.length) return data.petShelter.offers;
    data.petShelter.offers = Array.from({ length: OFFER_COUNT }, (_, index) => normalizeOffer({ type: allTypes[index % allTypes.length].id }, index));
    data.petShelter.lastRefreshAt = Date.now();
    try { if (typeof save === "function") save(); } catch {}
    return data.petShelter.offers;
  }

  function overlay() {
    let node = document.querySelector("[data-lbpet-overlay-v16]");
    if (node) return node;
    node = document.createElement("div");
    node.className = "lbx-overlay lbpet-overlay-v16";
    node.dataset.lbpetOverlayV16 = "1";
    node.addEventListener("click", handleOverlayClick);
    node.addEventListener("input", handleOverlayInput);
    document.body.appendChild(node);
    return node;
  }

  function closeOverlay() {
    const node = overlay();
    node.classList.remove("show");
    node.innerHTML = "";
    if (!document.querySelector(".lbx-overlay.show")) document.body.classList.remove("lbx-open");
  }

  function showOverlay(html, mode = "", petId = "") {
    const node = overlay();
    node.dataset.mode = mode;
    node.dataset.petId = petId;
    node.innerHTML = html;
    node.classList.add("show");
    document.body.classList.add("lbx-open");
  }

  function statBar(label, value, icon, key = "") {
    const safe = Math.round(clamp(value));
    return `<div class="lbpet-meter" ${key ? `data-lbpet-meter="${esc(key)}"` : ""}><span>${icon} ${esc(label)}</span><b>${safe}%</b><i><em style="width:${safe}%"></em></i></div>`;
  }

  function refreshOpenPetMeters() {
    const node = overlay();
    if (!node?.classList.contains("show") || node.dataset.mode !== "home") return false;
    const data = ensurePetState();
    const pet = data?.pets?.find((entry) => entry.id === String(node.dataset.petId || "")) || activePet(data);
    if (!pet) return false;
    const values = { hunger: pet.hunger, thirst: pet.thirst, happiness: pet.happiness, care: pet.care, toiletNeed: pet.toiletNeed || 0 };
    Object.entries(values).forEach(([key, value]) => {
      const meter = node.querySelector(`[data-lbpet-meter="${key}"]`);
      if (!meter) return;
      const safe = Math.round(clamp(value));
      const label = meter.querySelector("b");
      const bar = meter.querySelector("em");
      if (label) label.textContent = `${safe}%`;
      if (bar) bar.style.width = `${safe}%`;
    });
    return true;
  }

  function inventoryHtml(data = ensurePetState()) {
    return `<div class="lbpet-stock">${SUPPLIES.map((item) => `<span title="${esc(item.name)}">${item.icon} ${esc(item.name)} <b>${Number(data?.petInventory?.[item.id] || 0)}</b></span>`).join("")}</div>`;
  }

  function shopCategoryLabel(id) {
    return SHOP_CATEGORIES.find((entry) => entry.id === id)?.label || "Tierbedarf";
  }

  function shopInventoryCount(item, data = ensurePetState()) {
    return Math.max(0, Math.floor(Number(data?.petInventory?.[item.id] || 0)));
  }

  function shopHtml() {
    const data = ensurePetState();
    const totalStock = SUPPLIES.reduce((sum, item) => sum + shopInventoryCount(item, data), 0);
    return `<section class="lbpet-market-v88" data-lbpet-market-v88 data-shop-category="all">
      <section class="lbpet-market-hero-v88">
        <div class="lbpet-market-hero-copy-v88"><small>TIERHEIM-SHOP</small><h3>Alles für dein Haustier</h3><p>Futter, Trinken, Spielzeug, Pflegeartikel und Zubehör im einheitlichen JK.Games-Shop-Design.</p></div>
        <div class="lbpet-market-hero-icon-v88">🐾</div>
        <div class="lbpet-market-stats-v88"><span>Bargeld<b data-lbpet-shop-cash>${money(state?.cash || 0)}</b></span><span>Artikel<b>${SUPPLIES.length}</b></span><span>Dein Bestand<b data-lbpet-shop-total>${totalStock}</b></span></div>
      </section>
      <label class="lbpet-market-search-v88"><span>⌕</span><input type="search" placeholder="Im Tierheim-Shop suchen" autocomplete="off" data-lbpet-shop-search></label>
      <nav class="lbpet-market-tabs-v88" aria-label="Tierheim-Shop Kategorien">${SHOP_CATEGORIES.map((category) => `<button type="button" class="${category.id === "all" ? "active" : ""}" data-lbpet-shop-category="${category.id}"><span>${category.icon}</span>${esc(category.label)}</button>`).join("")}</nav>
      <div class="lbpet-market-list-v88" data-lbpet-shop-list>${SUPPLIES.map((item) => {
        const count = shopInventoryCount(item, data);
        const search = `${item.name} ${item.text} ${shopCategoryLabel(item.category)}`.toLocaleLowerCase("de-DE");
        return `<article class="lbpet-market-card-v88" data-lbpet-shop-card data-category="${item.category}" data-search="${esc(search)}">
          <span class="lbpet-market-card-icon-v88">${item.icon}</span>
          <div><small>${esc(shopCategoryLabel(item.category))} · BESTAND <b data-lbpet-stock-id="${item.id}">${count}</b></small><h4>${esc(item.name)}</h4><p>${esc(item.text)}</p><strong>${money(item.price)}${item.amount > 1 ? ` · +${item.amount} Stück` : ""}</strong></div>
          <button type="button" data-lbpet-buy-sheet="${item.id}">Kaufen</button>
        </article>`;
      }).join("")}</div>
      <div class="lbpet-market-empty-v88" data-lbpet-shop-empty hidden><span>⌕</span><b>Keine Artikel gefunden</b><small>Ändere die Suche oder wähle eine andere Kategorie.</small></div>
    </section>`;
  }

  function offerCard(pet) {
    const type = typeOfPet(pet.type);
    return `<article class="lbpet-offer-card lbpet-market-offer-v88"><span class="lbpet-offer-icon">${petIcon(pet)}</span><div><small>${esc(type.label)} · ${esc(pet.breed)} · ${petAgeYears(pet)} Jahre</small><h3>${esc(pet.name)}</h3><p>${esc(petText(pet))} · ${esc(pet.temperament || "neugierig")}</p><strong>${money(pet.price)}</strong></div><button data-lbpet-adopt="${esc(pet.id)}">Adoptieren</button></article>`;
  }

  function openPetShelter(forceRefresh = false) {
    const data = ensurePetState();
    const offers = generateOffers(forceRefresh);
    const allTypes = types();
    showOverlay(`<section class="lbx-shell lbx-pets-shell lbpet-shell-v16">
      <header><button data-lbpet-close aria-label="Schließen">×</button><div><small>TIERHEIM</small><h2>Adoption & Tierheim-Shop</h2></div><button class="lbpet-refresh" data-lbpet-refresh>Neue Tiere</button></header>
      <main class="lbpet-shelter-main-v88">
        <nav class="lbpet-shelter-shortcuts-v86"><button type="button" data-lbpet-jump="shop">🛒 Tierheim-Shop</button><button type="button" data-lbpet-jump="adoption">🐾 Tiere adoptieren</button></nav>
        <div data-lbpet-section="shop">${shopHtml()}</div>
        <section class="lbpet-section lbpet-adoption-section-v88" data-lbpet-section="adoption"><div class="lbpet-section-head"><div><small>ADOPTION</small><h3>${offers.length} Tiere warten auf ein Zuhause</h3></div><p>Besessene Tiere verwaltest du direkt über den Charakter. ${allTypes.map((type) => type.label).join(" · ")}</p></div><div class="lbpet-offer-grid">${offers.map(offerCard).join("") || `<div class="lbx-empty">Aktuell werden neue Tiere geladen.</div>`}</div></section>
      </main>
    </section>`, "shelter");
    return data;
  }

  function actionListFor(pet) {
    return ACTIONS[pet?.type] || ACTIONS.dog;
  }

  function actionCard(pet, action, data) {
    const item = action.item ? supply(action.item) : null;
    const amount = item ? Number(data.petInventory[item.id] || 0) : null;
    const disabled = item && amount <= 0;
    const toiletNeeded = !!(action.toiletWalk && pet?.type === "dog" && Number(pet.toiletNeed || 0) >= 40);
    const bagCount = Number(data.petInventory.poopBags || 0);
    const requirement = action.toiletWalk
      ? (toiletNeeded
          ? `🛍️ Hund muss raus · Kotbeutel: ${bagCount}${bagCount <= 0 ? " · 10 % Bußgeld-Risiko" : ""}`
          : `🦮 Gassi möglich · Kotbeutel: ${bagCount}`)
      : item
        ? `${item.icon} ${esc(item.name)}: ${amount}${item.reusable ? " · bleibt erhalten" : ""}`
        : `Ohne Gegenstand · +${action.xp} Tier-EP`;
    return `<button class="lbpet-action-card" data-lbpet-action="${action.id}" ${disabled ? "disabled" : ""}><span>${action.icon}</span><strong>${esc(action.label)}</strong><small>${requirement}</small></button>`;
  }

  function petTabsHtml(data, selectedId) {
    if (data.pets.length <= 1) return "";
    return `<nav class="lbpet-tabs" aria-label="Eigene Haustiere">${data.pets.map((pet) => `<button class="${pet.id === selectedId ? "active" : ""}" data-lbpet-open="${esc(pet.id)}"><span>${petIcon(pet)}</span><small>${esc(pet.name)}</small>${pet.active ? `<b>ANGEZEIGT</b>` : ""}</button>`).join("")}</nav>`;
  }

  function openPetHome(id = "") {
    try { window.LifeBuilderExpansion?.refreshPetNeeds?.(); } catch { /* Werte werden beim nächsten Tick nachgeholt */ }
    const data = ensurePetState();
    if (!data?.pets?.length) return openPetShelter(false);
    const pet = data.pets.find((entry) => entry.id === String(id || "")) || activePet(data) || data.pets[0];
    const type = typeOfPet(pet.type);
    const need = petXpNeed(petLevel(pet));
    showOverlay(`<section class="lbx-shell lbx-pets-shell lbpet-shell-v16">
      <header><button data-lbpet-close aria-label="Schließen">×</button><div><small>${esc(type.label).toUpperCase()} · PERSÖNLICHES MENÜ</small><h2>${petIcon(pet)} ${esc(pet.name)}</h2></div><span class="lbpet-local-only">PFLEGE</span></header>
      <main>
        ${petTabsHtml(data, pet.id)}
        <section class="lbpet-pet-hero ${pet.active ? "is-active" : ""}"><div class="lbpet-big-pet">${petIcon(pet)}</div><div class="lbpet-pet-copy"><small>${esc(type.label)} · ${esc(pet.breed || type.label)} · ${petAgeYears(pet)} Jahre</small><h3>${esc(pet.name)}</h3><p>${esc(petText(pet))}</p><div class="lbpet-level"><span>Level ${petLevel(pet)}/10</span><b>${petLevel(pet) >= 10 ? "MAX" : `${Math.round(Number(pet.xp || 0))}/${need} Tier-EP`}</b><i><em style="width:${petLevel(pet) >= 10 ? 100 : Math.min(100, (Number(pet.xp || 0) / Math.max(1, need)) * 100)}%"></em></i></div><div class="lbpet-hero-buttons"><button data-lbpet-active="${esc(pet.id)}" ${pet.active ? "disabled" : ""}>${pet.active ? "✓ Wird angezeigt" : "Bei Charakter anzeigen"}</button><button class="ghost" data-lbpet-rename="${esc(pet.id)}">Umbenennen</button><button class="lbpet-market-button" data-lbpet-sell="${esc(pet.id)}">Auf FeinAnzeigen.KL verkaufen</button><button class="lbpet-return-button" data-lbpet-return="${esc(pet.id)}">Kostenlos zurückgeben</button></div></div></section>
        <section class="lbpet-meter-grid">${statBar("Hunger", pet.hunger, "🍽️", "hunger")}${statBar("Durst", pet.thirst, "💧", "thirst")}${statBar("Freude", pet.happiness, "💛", "happiness")}${statBar("Pflege", pet.care, "✨", "care")}${pet.type === "dog" ? statBar("Muss raus", pet.toiletNeed || 0, "💩", "toiletNeed") : ""}</section>
        <section class="lbpet-section"><div class="lbpet-section-head"><div><small>AKTIONEN FÜR ${esc(pet.name).toUpperCase()}</small><h3>${esc(type.label)} versorgen</h3></div><p>Jedes neue Level liegt 50 Tier-EP höher. Nachschub gibt es nur im Tierheim-Shop auf der Stadtkarte.</p></div><div class="lbpet-action-grid">${actionListFor(pet).map((action) => actionCard(pet, action, data)).join("")}</div>${inventoryHtml(data)}</section>
        <p class="lbpet-map-shop-hint">Futter, Spielzeug und Pflegeartikel kaufst du ausschließlich vor Ort: Ausgang → Stadtkarte → Tierheim.</p>
      </main>
    </section>`, "home", pet.id);
  }

  function payCash(amount) {
    const price = Math.max(0, Number(amount || 0));
    if (!price) return true;
    if (typeof pay === "function") return !!pay(price, true, { method: "cash", target: "treasury", awardXp: false });
    if (Number(state?.cash || 0) < price) return false;
    state.cash -= price;
    return true;
  }

  function reopenCurrent() {
    const node = overlay();
    return node.dataset.mode === "home" ? openPetHome(node.dataset.petId || "") : openPetShelter(false);
  }

  function showPurchaseReceipt(details = {}) {
    try {
      if (typeof queuePurchaseConfirmation === "function") {
        queuePurchaseConfirmation(details);
        return;
      }
    } catch {}
    const title = details.title || "Kauf bestätigt";
    const name = details.name || "Artikel";
    const total = Number(details.total || 0);
    window.alert(`${title}\n${name}${total ? `\n${money(total)}` : ""}`);
  }

  function refreshShelterShopStockV88() {
    const node = overlay();
    const data = ensurePetState();
    if (!node?.classList.contains("show") || node.dataset.mode !== "shelter" || !data) return;
    SUPPLIES.forEach((item) => {
      node.querySelectorAll(`[data-lbpet-stock-id="${item.id}"]`).forEach((label) => { label.textContent = String(shopInventoryCount(item, data)); });
    });
    const total = SUPPLIES.reduce((sum, item) => sum + shopInventoryCount(item, data), 0);
    node.querySelectorAll("[data-lbpet-shop-total]").forEach((label) => { label.textContent = String(total); });
    node.querySelectorAll("[data-lbpet-shop-cash]").forEach((label) => { label.textContent = money(state?.cash || 0); });
  }

  function applyShelterShopFilterV88() {
    const node = overlay();
    const market = node.querySelector("[data-lbpet-market-v88]");
    if (!market) return;
    const query = String(market.querySelector("[data-lbpet-shop-search]")?.value || "").trim().toLocaleLowerCase("de-DE");
    const category = market.dataset.shopCategory || "all";
    let visible = 0;
    market.querySelectorAll("[data-lbpet-shop-card]").forEach((card) => {
      const categoryMatch = category === "all" || card.dataset.category === category;
      const queryMatch = !query || String(card.dataset.search || "").includes(query);
      const show = categoryMatch && queryMatch;
      card.hidden = !show;
      if (show) visible += 1;
    });
    const empty = market.querySelector("[data-lbpet-shop-empty]");
    if (empty) empty.hidden = visible > 0;
  }

  function closeSupplySheetV88() {
    overlay().querySelector(".lbpet-market-sheet-v88")?.remove();
  }

  function showSupplyPurchaseSheetV88(id) {
    const node = overlay();
    const item = supply(id);
    if (!item || !node.classList.contains("show")) return;
    closeSupplySheetV88();
    const canChooseQuantity = !item.reusable;
    const sheet = document.createElement("div");
    sheet.className = "lbpet-market-sheet-v88";
    sheet.innerHTML = `<div class="lbpet-market-sheet-card-v88">
      <span class="lbpet-market-sheet-handle-v88"></span>
      <div class="lbpet-market-sheet-title-v88"><span>${item.icon}</span><div><small>${esc(shopCategoryLabel(item.category))}</small><h3>${esc(item.name)}</h3></div></div>
      <p>${esc(item.text)}</p>
      ${canChooseQuantity ? `<label>Packungen<input type="number" min="1" max="99" value="1" inputmode="numeric" data-lbpet-buy-quantity></label>` : ""}
      <div class="lbpet-market-sheet-stock-v88"><span>Aktueller Bestand</span><b>${shopInventoryCount(item)}</b></div>
      <div class="lbpet-market-sheet-price-v88"><span>Gesamt</span><b data-lbpet-buy-total>${money(item.price)}</b></div>
      <button type="button" class="cash" data-lbpet-buy-confirm="${item.id}">Bar bezahlen</button>
      <button type="button" class="cancel" data-lbpet-buy-sheet-close>Abbrechen</button>
    </div>`;
    node.querySelector(".lbpet-shell-v16")?.appendChild(sheet);
    const update = () => {
      const input = sheet.querySelector("[data-lbpet-buy-quantity]");
      const quantity = canChooseQuantity ? Math.max(1, Math.min(99, Math.floor(Number(input?.value || 1)))) : 1;
      if (input) input.value = String(quantity);
      const total = Number(item.price || 0) * quantity;
      const label = sheet.querySelector("[data-lbpet-buy-total]");
      if (label) label.textContent = money(total);
      const payButton = sheet.querySelector("[data-lbpet-buy-confirm]");
      if (payButton) {
        payButton.disabled = Number(state?.cash || 0) < total;
        payButton.textContent = Number(state?.cash || 0) < total ? `Bargeld fehlt · ${money(total)}` : `Bar ${money(total)} bezahlen`;
      }
      return quantity;
    };
    sheet.querySelector("[data-lbpet-buy-quantity]")?.addEventListener("input", update);
    sheet.addEventListener("click", (event) => { if (event.target === sheet) closeSupplySheetV88(); });
    update();
  }

  function buySupply(id, quantity = 1) {
    const data = ensurePetState();
    const item = supply(id);
    if (!data || !item) return;
    const count = item.reusable ? 1 : Math.max(1, Math.min(99, Math.floor(Number(quantity || 1))));
    const total = Number(item.price || 0) * count;
    if (!payCash(total)) return note("Nicht genug Bargeld für den Tierheim-Shop.");
    data.petInventory[item.id] = Number(data.petInventory[item.id] || 0) + Math.max(1, Number(item.amount || 1)) * count;
    saveAll();
    closeSupplySheetV88();
    refreshShelterShopStockV88();
    const pieces = Math.max(1, Number(item.amount || 1)) * count;
    note(`${count}x ${item.name} gekauft${pieces > count ? ` · +${pieces} Stück` : ""}.`);
    showPurchaseReceipt({ title: "Tierheim-Kauf bestätigt", name: `${count}x ${item.name}`, total, method: "Bargeld", icon: item.icon });
  }

  function adoptPet(id) {
    const data = ensurePetState();
    const offer = data?.petShelter?.offers?.find((entry) => entry.id === String(id || ""));
    if (!offer) return;
    const type = typeOfPet(offer.type);
    const adoptionText = `${offer.name} (${type.label} · ${offer.breed}) für ${money(offer.price)} adoptieren?\n\nNach der Bestätigung gehört das Tier zu dir.`;
    if (!window.confirm(adoptionText)) return;
    if (!payCash(offer.price)) return note("Für die Adoption brauchst du genügend Bargeld.");
    const wasEmpty = !data.pets.length;
    const pet = { ...normalizeOffer(offer), level: 1, xp: 0, hunger: 85, thirst: 85, happiness: 80, care: 90, toiletNeed: offer.type === "dog" ? 25 : 0, adoptedAtMs: Date.now(), active: wasEmpty };
    data.pets.push(pet);
    data.petShelter.offers = data.petShelter.offers.filter((entry) => entry.id !== offer.id);
    data.petStats.adopted = Number(data.petStats.adopted || 0) + 1;
    if (wasEmpty) data.activePetId = pet.id;
    ensurePetState();
    saveAll();
    note(`${pet.name} ist jetzt dein Haustier. Klicke das Tier beim Charakter an, um es zu versorgen.`);
    showPurchaseReceipt({ title: "Adoption bestätigt", name: `${petIcon(pet)} ${pet.name}`, subtitle: `${type.label} · ${pet.breed}`, total: offer.price, method: "Bargeld", icon: petIcon(pet) });
    openPetHome(pet.id);
  }

  function petAuctionListing(data, pet, index) {
    return (data?.auctionHouse?.listings || []).find((listing) =>
      listing?.petId === pet.id ||
      listing?.sourceId === `petid:${pet.id}` ||
      listing?.sourceId === `pet:${index}`
    ) || null;
  }

  function returnPetToShelter(id) {
    const data = ensurePetState();
    const index = data?.pets?.findIndex((entry) => entry.id === String(id || "")) ?? -1;
    if (index < 0) return;
    const pet = data.pets[index];
    const listed = petAuctionListing(data, pet, index);
    const extra = listed ? "\n\nDas aktive FeinAnzeigen.KL-Inserat wird dabei ebenfalls entfernt." : "";
    if (!window.confirm(`${pet.name} kostenlos an das Tierheim zurückgeben?\n\nDu erhältst dafür kein Geld und das Tier wird endgültig aus deinem Spielstand entfernt.${extra}`)) return;
    if (listed && data.auctionHouse?.listings) {
      data.auctionHouse.listings = data.auctionHouse.listings.filter((entry) => entry !== listed);
    }
    data.pets.splice(index, 1);
    const nextPet = data.pets[0] || null;
    data.activePetId = nextPet?.id || "";
    data.pets.forEach((entry) => { entry.active = !!nextPet && entry.id === nextPet.id; });
    ensurePetState();
    saveAll();
    note(`${pet.name} wurde kostenlos an das Tierheim zurückgegeben. Du hast kein Geld erhalten.`);
    showPurchaseReceipt({ kind: "warning", title: "Tier zurückgegeben", name: pet.name, subtitle: "Keine Auszahlung", icon: "🏡" });
    if (nextPet) openPetHome(nextPet.id);
    else openPetShelter(false);
  }

  function sellPetOnFineAnzeigen(id) {
    const data = ensurePetState();
    const pet = data?.pets?.find((entry) => entry.id === String(id || ""));
    if (!pet) return;
    const index = data.pets.indexOf(pet);
    const existing = petAuctionListing(data, pet, index);
    if (existing) {
      window.alert(`${pet.name} ist bereits für ${money(existing.price)} auf FeinAnzeigen.KL eingestellt.`);
      closeOverlay();
      try {
        const auction = document.querySelector("[data-lbx-auction-overlay]") || document.querySelector(".lbx-overlay.auction-overlay");
        if (auction) auction.dataset.tab = "mine";
        window.LifeBuilderExpansion?.openAuction?.();
      } catch {}
      return;
    }
    if (window.LifeBuilderExpansion?.listPetOnFineAnzeigen) {
      const listed = window.LifeBuilderExpansion.listPetOnFineAnzeigen(pet.id);
      if (listed) closeOverlay();
      return;
    }
    window.alert("FeinAnzeigen.KL ist noch nicht vollständig geladen. Öffne die App gleich erneut.");
  }

  function renamePet(id) {
    const data = ensurePetState();
    const pet = data?.pets?.find((entry) => entry.id === String(id || ""));
    if (!pet) return;
    const value = window.prompt("Neuer Name", pet.name);
    if (!value?.trim()) return;
    pet.name = value.trim().slice(0, 24);
    saveAll();
    openPetHome(pet.id);
  }

  function levelPet(pet, gainedXp) {
    const before = petLevel(pet);
    pet.xp = Math.min(450, Math.max(0, Number(pet.xp || 0) + Math.max(0, Number(gainedXp || 0))));
    pet.xpMode = "cumulative50";
    pet.level = Math.min(10, Math.max(1, Math.floor(pet.xp / PET_XP_STEP) + 1));
    return pet.level > before;
  }


  function applyDogWasteFineV86(pet) {
    const fine = 35;
    state.debt = Math.round((Number(state.debt || 0) + fine) * 100) / 100;
    state.unpaidFines = Math.round((Number(state.unpaidFines || 0) + fine) * 100) / 100;
    state.criminalRecord ||= [];
    state.criminalRecord.unshift({
      title: "Ordnungsamt · Hundekot",
      text: `${pet.name} musste beim Gassigehen. Ohne Kotbeutel wurde die Hinterlassenschaft nicht beseitigt.`,
      fine,
      day: state.day,
      at: Date.now()
    });
    state.criminalRecord = state.criminalRecord.slice(0, 80);
    try { if (typeof lowerCredit === "function") lowerCredit(1, "offenes Hundekot-Bußgeld"); } catch {}
    note(`Ordnungsamt: Kein Kotbeutel dabei. Bußgeld ${money(fine)} wurde als offene Schuld eingetragen.`);
  }

  function petAction(id, actionId) {
    const data = ensurePetState();
    const pet = data?.pets?.find((entry) => entry.id === String(id || ""));
    const action = actionListFor(pet).find((entry) => entry.id === actionId);
    if (!pet || !action) return;
    const item = action.item ? supply(action.item) : null;
    if (item && Number(data.petInventory[item.id] || 0) <= 0) {
      note(`${item.name} fehlt. Kaufe Nachschub im Tierheim auf der Stadtkarte.`);
      return openPetHome(pet.id);
    }
    if (item && !item.reusable) data.petInventory[item.id] = Math.max(0, Number(data.petInventory[item.id] || 0) - 1);

    if (pet.type === "dog") {
      if (["feed", "treat"].includes(action.id)) pet.toiletNeed = clamp(Number(pet.toiletNeed || 0) + 18);
      if (action.id === "water") pet.toiletNeed = clamp(Number(pet.toiletNeed || 0) + 24);
      if (action.toiletWalk && Number(pet.toiletNeed || 0) >= 40) {
        const bags = Number(data.petInventory.poopBags || 0);
        if (bags > 0) {
          data.petInventory.poopBags = bags - 1;
          note(`${pet.name} hat sich beim Gassigehen erleichtert. Ein Kotbeutel wurde benutzt.`);
        } else if (Math.random() < 0.10) {
          applyDogWasteFineV86(pet);
        } else {
          note(`${pet.name} hat sich beim Gassigehen erleichtert. Du hattest keinen Kotbeutel dabei – diesmal kam keine Kontrolle.`);
        }
        pet.toiletNeed = 0;
      }
    }

    ["hunger", "thirst", "happiness", "care"].forEach((key) => {
      if (Number(action[key] || 0)) pet[key] = clamp(petNeed(pet, key) + Number(action[key] || 0));
    });
    const leveled = levelPet(pet, action.xp || 1);
    data.petStats.careActions = Number(data.petStats.careActions || 0) + 1;
    data.petStats.maxLevel = Math.max(Number(data.petStats.maxLevel || 0), petLevel(pet));
    saveAll();
    note(`${pet.name}: ${action.label} · +${action.xp || 1} Tier-EP${leveled ? ` · Level ${petLevel(pet)} erreicht` : ""}.`);
    openPetHome(pet.id);
  }

  function handleOverlayInput(event) {
    if (event.target?.matches?.("[data-lbpet-shop-search]")) applyShelterShopFilterV88();
  }

  function handleOverlayClick(event) {
    const target = event.target.closest?.("button");
    if (!target) return;
    if (target.matches("[data-lbpet-close]")) return closeOverlay();
    if (target.matches("[data-lbpet-shelter]")) return openPetShelter(false);
    if (target.matches("[data-lbpet-refresh]")) return openPetShelter(true);
    if (target.dataset.lbpetShopCategory) {
      const market = overlay().querySelector("[data-lbpet-market-v88]");
      if (market) {
        market.dataset.shopCategory = target.dataset.lbpetShopCategory || "all";
        market.querySelectorAll("[data-lbpet-shop-category]").forEach((button) => button.classList.toggle("active", button === target));
        applyShelterShopFilterV88();
      }
      return;
    }
    if (target.matches("[data-lbpet-buy-sheet-close]")) return closeSupplySheetV88();
    if (target.dataset.lbpetBuySheet) return showSupplyPurchaseSheetV88(target.dataset.lbpetBuySheet);
    if (target.dataset.lbpetBuyConfirm) {
      const quantity = Number(overlay().querySelector("[data-lbpet-buy-quantity]")?.value || 1);
      return buySupply(target.dataset.lbpetBuyConfirm, quantity);
    }
    if (target.dataset.lbpetJump) {
      const section = overlay().querySelector(`[data-lbpet-section="${target.dataset.lbpetJump}"]`);
      section?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      return;
    }
    if (target.dataset.lbpetOpen) return openPetHome(target.dataset.lbpetOpen);
    if (target.dataset.lbpetBuy) return showSupplyPurchaseSheetV88(target.dataset.lbpetBuy);
    if (target.dataset.lbpetAdopt) return adoptPet(target.dataset.lbpetAdopt);
    if (target.dataset.lbpetRename) return renamePet(target.dataset.lbpetRename);
    if (target.dataset.lbpetSell) return sellPetOnFineAnzeigen(target.dataset.lbpetSell);
    if (target.dataset.lbpetReturn) return returnPetToShelter(target.dataset.lbpetReturn);
    if (target.dataset.lbpetActive) return setActivePet(target.dataset.lbpetActive, { refreshCharacter: false }) && openPetHome(target.dataset.lbpetActive);
    if (target.dataset.lbpetAction) return petAction(overlay().dataset.petId, target.dataset.lbpetAction);
  }

  function partnerPetData(partner) {
    if (!partner || typeof partner !== "object") return null;
    const raw = partner.pet || partner.activePet || partner.haustier || null;
    if (!raw) return null;
    if (typeof raw === "string") return { id: `partner-${partner.id || "pet"}`, name: raw, icon: "🐾", type: "pet" };
    return { id: String(raw.id || `partner-${partner.id || "pet"}`), name: String(raw.name || "Haustier"), icon: raw.icon || typeOfPet(raw.type).icons?.[0] || "🐾", type: raw.type || "pet", description: raw.description || "Begleitet deinen Partner." };
  }

  function selectorHtml(data, current) {
    if (!data?.pets?.length) return "";
    return `<section class="lbpet-character-selector"><div><small>ANGEZEIGTES HAUSTIER</small><h4>${data.pets.length > 1 ? "Wähle dein Tier" : "Dein Haustier"}</h4></div><div class="lbpet-character-options">${data.pets.map((pet) => `<button type="button" class="${pet.id === current?.id ? "active" : ""}" data-lbpet-character-select="${esc(pet.id)}"><span>${petIcon(pet)}</span><b>${esc(pet.name)}</b><small>${pet.id === current?.id ? "ÖFFNEN" : "AUSWÄHLEN"}</small></button>`).join("")}</div></section>`;
  }

  function patchCharacter() {
    if (typeof characterOverviewHtml !== "function" || characterOverviewHtml._lbPetV16) return;
    const baseOverview = characterOverviewHtml;
    characterOverviewHtml = function patchedCharacterOverviewHtmlV16() {
      const data = ensurePetState();
      let html = baseOverview();
      const current = activePet(data);
      const partner = typeof finderRelationshipPartner === "function" ? finderRelationshipPartner() : null;
      const partnerPet = partnerPetData(partner);
      if (current && !html.includes("data-pet-home-open")) {
        const chip = `<button class="character-pet-chip" type="button" data-pet-home-open="${esc(current.id)}" aria-label="${esc(current.name)} öffnen" title="${esc(current.name)} öffnen"><span class="character-pet-emoji">${petIcon(current)}</span></button>`;
        html = html.replace(/(<button class="character-avatar-button character-person-card"[\s\S]*?<\/button>)/, `$1${chip}`);
      }
      if (current && !html.includes("data-lbpet-character-select")) {
        html = html.replace(/(<section class="character-tools-v15">)/, `${selectorHtml(data, current)}$1`);
      }
      if (partnerPet && !html.includes("data-partner-pet-open")) {
        const partnerChip = `<button class="character-pet-chip character-partner-pet-chip" type="button" data-partner-pet-open="${esc(partnerPet.id)}" aria-label="${esc(partnerPet.name)} ansehen" title="${esc(partnerPet.name)} ansehen"><span class="character-pet-emoji">${esc(partnerPet.icon)}</span></button>`;
        html = html.replace(/(<button class="character-partner-card character-person-card"[\s\S]*?<\/button>)/, `$1${partnerChip}`);
      }
      return html;
    };
    characterOverviewHtml._lbPetV16 = true;

    if (typeof bindCharacterHubContent === "function" && !bindCharacterHubContent._lbPetV16) {
      const baseBind = bindCharacterHubContent;
      bindCharacterHubContent = function patchedBindCharacterHubContentV16(root, section) {
        baseBind(root, section);
        root.querySelectorAll("[data-pet-home-open]").forEach((button) => button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          try { document.querySelector("#detailDialog")?.close?.(); } catch {}
          openPetHome(button.dataset.petHomeOpen || "");
        }));
        root.querySelectorAll("[data-lbpet-character-select]").forEach((button) => button.addEventListener("click", () => {
          const petId = button.dataset.lbpetCharacterSelect || "";
          const data = ensurePetState();
          const current = activePet(data);
          if (current?.id === petId) {
            try { document.querySelector("#detailDialog")?.close?.(); } catch {}
            openPetHome(petId);
            return;
          }
          setActivePet(petId);
        }));
        root.querySelectorAll("[data-partner-pet-open]").forEach((button) => button.addEventListener("click", () => {
          const currentPartner = typeof finderRelationshipPartner === "function" ? finderRelationshipPartner() : null;
          const pet = partnerPetData(currentPartner);
          if (!pet) return;
          try { document.querySelector("#detailDialog")?.close?.(); } catch {}
          showOverlay(`<section class="lbx-shell lbx-pets-shell lbpet-shell-v16"><header><button data-lbpet-close>×</button><div><small>HAUSTIER DEINES PARTNERS</small><h2>${esc(pet.name)}</h2></div><span></span></header><main><section class="lbx-hero"><span>${esc(pet.icon)}</span><div><h3>${esc(currentPartner?.name || "Partner")} & ${esc(pet.name)}</h3><p>${esc(pet.description || "Begleitet deinen Partner.")}</p></div></section><div class="lbx-empty">Dieses Tier gehört deinem Partner. Pflegeaktionen werden in dessen Profil verwaltet.</div></main></section>`, "partner", pet.id);
        }));
      };
      bindCharacterHubContent._lbPetV16 = true;
    }
  }

  function installGlobalPetClick() {
    if (document.documentElement.dataset.lbPetClickV16 === "1") return;
    document.documentElement.dataset.lbPetClickV16 = "1";
    const openNode = (node, event) => {
      if (!node) return;
      event?.preventDefault?.();
      event?.stopPropagation?.();
      event?.stopImmediatePropagation?.();
      try { document.querySelector("#detailDialog")?.close?.(); } catch {}
      openPetHome(node.dataset.portraitPetOpen || node.dataset.petHomeOpen || "");
    };
    document.addEventListener("pointerdown", (event) => {
      const node = event.target.closest?.("[data-portrait-pet-open]");
      if (!node) return;
      node.classList.add("is-pressed");
      setTimeout(() => node.classList.remove("is-pressed"), 180);
    }, true);
    document.addEventListener("click", (event) => {
      const node = event.target.closest?.("[data-portrait-pet-open]");
      if (node) openNode(node, event);
    }, true);
    document.addEventListener("keydown", (event) => {
      const node = event.target.closest?.("[data-portrait-pet-open]");
      if (node && ["Enter", " "].includes(event.key)) openNode(node, event);
    }, true);
  }

  function patchDeviceApps() {
    if (typeof deviceAppsFor !== "function" || deviceAppsFor._lbPetV16) return;
    const base = deviceAppsFor;
    deviceAppsFor = function patchedDeviceAppsForV16(item) {
      const apps = base(item);
      apps.forEach((app) => { if (GAME_IDS.has(String(app.id || "").toLowerCase())) app.text = ""; });
      return apps;
    };
    deviceAppsFor._lbPetV16 = true;
  }

  function install() {
    ensurePetState();
    patchDeviceApps();
    patchCharacter();
    installGlobalPetClick();
    window.LifeBuilderPetUI = { version: VERSION, openPetShelter, openPetHome, refreshOpenPetMeters, setActivePet, returnPetToShelter, sellPetOnFineAnzeigen, activePet: () => activePet(ensurePetState()), petXpNeed, supplies: () => SUPPLIES.slice() };
    if (window.LifeBuilderExpansion) {
      window.LifeBuilderExpansion.openPetShelter = openPetShelter;
      window.LifeBuilderExpansion.openPetHome = openPetHome;
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();
