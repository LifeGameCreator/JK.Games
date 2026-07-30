(() => {
  "use strict";

  const VERSION = "2026-07-27-expansion-v61-pet-needs";
  const DAY_MS = 86_400_000;
  const HOUR_MS = 3_600_000;
  const SPECIAL_TOTAL = 1000;
  const SPECIAL_PAGE_SIZE = 48;
  const BOT_AUCTION_COUNT = 36;

  const PET_TYPES = [
    {
      id: "dog", label: "Hund", basePrice: 850,
      icons: ["🐕", "🐕‍🦺", "🦮", "🐩", "🐶"],
      breeds: ["Mischling", "Schäferhund", "Labrador", "Pudel", "Terrier", "Husky", "Beagle", "Golden Retriever"],
      names: ["Balu", "Milo", "Rex", "Koda", "Loki", "Bruno", "Buddy", "Cooper", "Nero", "Rocky", "Sammy", "Oskar"],
      descriptions: ["treuer Begleiter mit viel Energie", "lernt schnell und liebt lange Spaziergänge", "ruhig, aufmerksam und familienfreundlich", "verspielt und immer für ein Abenteuer bereit"]
    },
    {
      id: "cat", label: "Katze", basePrice: 620,
      icons: ["🐈", "🐈‍⬛", "🐱"],
      breeds: ["Hauskatze", "Europäisch Kurzhaar", "Maine Coon", "Siam-Mix", "Britisch Kurzhaar", "Waldkatzen-Mix"],
      names: ["Luna", "Nala", "Mochi", "Minka", "Simba", "Pünktchen", "Pixel", "Sushi", "Mimi", "Keks", "Maja", "Flocke"],
      descriptions: ["neugierig und liebt erhöhte Schlafplätze", "verschmust, aber mit eigenem Kopf", "beobachtet erst alles und taut langsam auf", "spielt gern und sucht oft deine Nähe"]
    },
    {
      id: "rabbit", label: "Kaninchen", basePrice: 280,
      icons: ["🐇", "🐰"],
      breeds: ["Zwergkaninchen", "Löwenkopf-Mix", "Widderkaninchen", "Farbenzwerg"],
      names: ["Flocke", "Hoppel", "Cookie", "Wölkchen", "Möhrchen", "Fips", "Lilly", "Puschel"],
      descriptions: ["sanft und besonders futterneugierig", "flitzt gern herum und braucht Beschäftigung", "ruhig, freundlich und sehr aufmerksam", "mag kleine Verstecke und frisches Gemüse"]
    },
    {
      id: "hamster", label: "Hamster", basePrice: 120,
      icons: ["🐹", "🐭"],
      breeds: ["Goldhamster", "Zwerghamster", "Teddyhamster", "Campbell-Mix"],
      names: ["Krümel", "Nuss", "Pico", "Momo", "Wuschel", "Speedy", "Käthe", "Muffin"],
      descriptions: ["nachtaktiv und ein echter Vorratsprofi", "klein, schnell und sehr erkundungsfreudig", "baut begeistert Nester und Tunnel", "ruhig am Tag und abends voller Energie"]
    },
    {
      id: "bird", label: "Vogel", basePrice: 390,
      icons: ["🦜", "🐦", "🦉", "🕊️"],
      breeds: ["Wellensittich", "Nymphensittich", "Papageien-Mix", "Kanarienvogel"],
      names: ["Kiwi", "Rio", "Sunny", "Pepe", "Coco", "Sky", "Lotte", "Pico"],
      descriptions: ["kommunikativ und liebt abwechslungsreiches Spielzeug", "aufmerksam und besonders neugierig auf Geräusche", "singt gern und braucht tägliche Beschäftigung", "intelligent, sozial und schnell lernfähig"]
    },
    {
      id: "guinea-pig", label: "Meerschweinchen", basePrice: 170,
      icons: ["🐹", "🐾"],
      breeds: ["Glatthaar", "Rosetten-Mix", "Langhaar-Mix", "Rex-Meerschweinchen"],
      names: ["Pippa", "Knödel", "Peanut", "Tapsi", "Frida", "Böhnchen", "Lulu", "Moppel"],
      descriptions: ["gesellig und begrüßt Futter mit lautem Quieken", "freundlich, ruhig und gern in Gesellschaft", "liebt Heu, Verstecke und feste Tagesabläufe", "vorsichtig, aber nach kurzer Zeit sehr zutraulich"]
    },
    {
      id: "turtle", label: "Schildkröte", basePrice: 460,
      icons: ["🐢"],
      breeds: ["Landschildkröte", "Wasserschildkröten-Mix", "Steppenschildkröte"],
      names: ["Shelly", "Turbo", "Momo", "Olive", "Kiesel", "Theo", "Tilda", "Moos"],
      descriptions: ["gelassen und liebt warme, ruhige Plätze", "beobachtet ihre Umgebung ganz entspannt", "pflegeleicht, aber anspruchsvoll beim Lebensraum", "langsam unterwegs und trotzdem sehr neugierig"]
    },
    {
      id: "fish", label: "Aquarienfisch", basePrice: 90,
      icons: ["🐠", "🐟"],
      breeds: ["Guppy-Gruppe", "Kampffisch", "Neonsalmler", "Goldfisch", "Molly-Gruppe"],
      names: ["Bubbles", "Nemo", "Blue", "Koralle", "Flash", "Goldie", "Wave", "Finny"],
      descriptions: ["farbenfroh und ruhig zu beobachten", "aktiv und besonders auffällig gefärbt", "fühlt sich in einem gepflegten Aquarium wohl", "schwimmt gern durch Pflanzen und kleine Höhlen"]
    }
  ];

  const PET_AGES = [
    { label: "Baby", minYears: 0, maxYears: 1, priceFactor: 1.1 },
    { label: "Jung", minYears: 1, maxYears: 3, priceFactor: 1.0 },
    { label: "Erwachsen", minYears: 3, maxYears: 8, priceFactor: 0.92 },
    { label: "Senior", minYears: 8, maxYears: 14, priceFactor: 0.72 }
  ];
  const PET_TEMPERAMENTS = ["ruhig", "neugierig", "verspielt", "verschmust", "wachsam", "mutig", "sanft", "aufgeweckt"];

  const SPECIAL_CATEGORIES = ["Kleidung", "Technik", "Gaming", "Kunst", "Luxus", "Historisch", "Mystery", "Sport", "Musik", "Fahrzeugteil", "Sammlerstück", "Lifestyle"];
  const SPECIAL_PREFIXES = ["Neon", "Royal", "Retro", "Gold", "Shadow", "Limited", "Cyber", "Diamond", "Vintage", "Mythic", "Arctic", "Crimson", "Emerald", "Midnight", "Solar", "Phantom", "Titan", "Crystal", "Urban", "Signature"];
  const SPECIAL_ARCHETYPES = [
    ["Bomberjacke", "🧥", "Kleidung", "Exklusive Jacke aus einer streng limitierten Serie.", true],
    ["Designer-Sneaker", "👟", "Kleidung", "Sammler-Sneaker, die nicht im normalen Kleidershop erscheinen.", true],
    ["Street-Maske", "🥷", "Kleidung", "Seltene Gesichtsmaske für besondere Outfits.", true],
    ["Luxus-Hut", "🎩", "Kleidung", "Auffälliger Hut mit eigener Sammler-Edition.", true],
    ["Rennhelm", "⛑️", "Kleidung", "Signierter Helm aus einer fiktiven Rennserie.", true],
    ["Sonnenbrille", "🕶️", "Kleidung", "Limitierte Brille mit unverwechselbarem Design.", true],
    ["Premium-Uhr", "⌚", "Luxus", "Hochwertige Uhr mit nummerierter Rückseite.", false],
    ["Goldkette", "📿", "Luxus", "Schweres Schmuckstück für deine Sammlung.", true],
    ["Sammler-Ring", "💍", "Luxus", "Seltener Ring mit kleiner Gravur.", true],
    ["Designer-Tasche", "👜", "Lifestyle", "Limitierte Tasche aus einer besonderen Kollektion.", true],
    ["Retro-Konsole", "🎮", "Gaming", "Funktionsfähige Konsole aus einer seltenen Edition.", false],
    ["Arcade-Modul", "🕹️", "Gaming", "Seltenes Modul einer alten Spielhalle.", false],
    ["Game-Cartridge", "💾", "Gaming", "Originale Spiele-Cartridge mit Sammlerwert.", false],
    ["Gaming-Trophäe", "🏆", "Gaming", "Trophäe eines bekannten fiktiven Turniers.", false],
    ["Handheld", "🎮", "Technik", "Kompakte Konsole mit besonderer Gehäusefarbe.", false],
    ["Mini-PC", "🖥️", "Technik", "Kleiner Spezialrechner mit nummerierter Serie.", false],
    ["Smartphone-Prototyp", "📱", "Technik", "Seltener Prototyp aus einer frühen Testserie.", false],
    ["Kamera", "📷", "Technik", "Sammlerkamera mit ungewöhnlichem Objektiv.", false],
    ["Kopfhörer", "🎧", "Technik", "Limitierte Audio-Edition mit kräftigem Klang.", false],
    ["Roboterfigur", "🤖", "Technik", "Programmierbare Miniaturfigur aus einer Kleinserie.", false],
    ["Ölgemälde", "🖼️", "Kunst", "Einzelstück eines fiktiven modernen Künstlers.", false],
    ["Skulptur", "🗿", "Kunst", "Kleine nummerierte Skulptur für Sammler.", false],
    ["Graffiti-Print", "🎨", "Kunst", "Signierter Druck aus einer Street-Art-Serie.", false],
    ["Fotografie", "🌆", "Kunst", "Großformatige Aufnahme einer seltenen Szene.", false],
    ["Kunstkarte", "🃏", "Kunst", "Illustrierte Karte mit begrenzter Auflage.", false],
    ["Historische Münze", "🪙", "Historisch", "Alte Münze mit dokumentierter Herkunft.", false],
    ["Orden", "🎖️", "Historisch", "Sammlerorden aus einer fiktiven Epoche.", false],
    ["Antike Karte", "🗺️", "Historisch", "Detailreiche Landkarte mit Alterungsspuren.", false],
    ["Siegel", "🔏", "Historisch", "Seltenes Siegel mit ungewöhnlichem Wappen.", false],
    ["Taschenuhr", "🕰️", "Historisch", "Mechanische Uhr mit sichtbarem Uhrwerk.", false],
    ["Mystery-Box", "🎁", "Mystery", "Versiegelte Sammlerbox mit unbekannter Serie.", false],
    ["Kristall", "🔮", "Mystery", "Leuchtender Deko-Kristall aus einer Fantasy-Kollektion.", false],
    ["Geheimes Tagebuch", "📕", "Mystery", "Verschlossenes Buch mit rätselhaften Einträgen.", false],
    ["Alien-Figur", "👽", "Mystery", "Kultige Figur aus einer seltenen Sci-Fi-Reihe.", false],
    ["Phantom-Schlüssel", "🗝️", "Mystery", "Dekorativer Schlüssel mit unbekanntem Zweck.", false],
    ["Fußball-Trikot", "👕", "Sport", "Signiertes Trikot aus einer Sonderedition.", true],
    ["Boxhandschuhe", "🥊", "Sport", "Sammlerhandschuhe eines fiktiven Champions.", false],
    ["Basketball", "🏀", "Sport", "Limitierter Ball mit Turnierprägung.", false],
    ["Skateboard", "🛹", "Sport", "Seltenes Deck mit exklusiver Grafik.", false],
    ["Rennrad-Modell", "🚴", "Sport", "Detailreiches Modell eines Wettbewerbsrads.", false],
    ["Vinylplatte", "💿", "Musik", "Seltene Pressung mit besonderem Cover.", false],
    ["Goldenes Mikrofon", "🎤", "Musik", "Dekoratives Mikrofon einer Bühnenedition.", false],
    ["E-Gitarre", "🎸", "Musik", "Signierte Miniatur einer bekannten Bühnenform.", false],
    ["Kassettenbox", "📼", "Musik", "Komplette Retro-Kollektion in kleiner Auflage.", false],
    ["DJ-Pult", "🎛️", "Musik", "Kompaktes Sammlermodell eines Club-Pults.", false],
    ["Felgensatz", "🛞", "Fahrzeugteil", "Seltener Felgensatz für Ausstellungsfahrzeuge.", false],
    ["Motoremblem", "⚙️", "Fahrzeugteil", "Originales Emblem einer limitierten Baureihe.", false],
    ["Schaltknauf", "🕹️", "Fahrzeugteil", "Handgefertigter Schaltknauf mit Seriennummer.", false],
    ["Lenkrad", "🏎️", "Fahrzeugteil", "Sportlenkrad aus einer Kleinserie.", false],
    ["Modellauto", "🚗", "Sammlerstück", "Detailgetreues Modell in Sammlerverpackung.", false]
  ];

  const BOT_SELLERS = ["Mara87", "NovaDeals", "KianCollector", "LinaMarket", "RetroRico", "GoldMika", "TarekTrade", "FionaFinds", "SamWarehouse", "NoraStore", "EliasAuctions", "ZoeRare", "BenBids", "JamalShop", "KimSpecial", "LeonieLux"];
  const BOT_ASSETS = [
    { kind: "Fahrzeug", icon: "🚙", names: ["Gebrauchtwagen Kompakt", "Gebrauchtwagen Kombi", "Gebrauchtwagen SUV", "Youngtimer Coupé"], min: 6500, max: 42000 },
    { kind: "Neuwagen", icon: "🚘", names: ["Neuwagen City", "Neuwagen Business", "Neuwagen Elektro", "Neuwagen Premium"], min: 24000, max: 115000 },
    { kind: "Supercar", icon: "🏎️", names: ["Supercar V10", "Supersportwagen Carbon", "Hypercar Limited", "Luxus-Coupé Performance"], min: 180000, max: 950000 },
    { kind: "Motorboot", icon: "🚤", names: ["Motorboot Sport", "Motorboot Weekend", "Speedboat Classic", "Kajütboot Premium"], min: 18000, max: 145000 },
    { kind: "Luxusjacht", icon: "🛥️", names: ["Luxusjacht 18m", "Luxusjacht Ocean", "Explorer Yacht", "Superyacht Executive"], min: 320000, max: 2_400_000 },
    { kind: "Haustier", icon: "🐾", names: ["Seltenes Tierheim-Paket"], min: 150, max: 1600 },
    { kind: "Special", icon: "✨", names: ["Special-Sammlerstück"], min: 1000, max: 1_000_000 }
  ];

  const esc = (value) => typeof escapeHtml === "function"
    ? escapeHtml(value)
    : String(value ?? "").replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
  const money = (value) => typeof euro !== "undefined"
    ? euro.format(Number(value) || 0)
    : `${Math.round(Number(value) || 0).toLocaleString("de-DE")} €`;
  const now = () => Date.now();
  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const choose = (list) => list[Math.floor(Math.random() * list.length)];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
  const saveRender = () => {
    try { save(); } catch { /* primary save unavailable */ }
    try { render(); } catch { /* view may be closed */ }
  };

  function ensureState() {
    if (typeof state === "undefined" || !state) return null;
    state.pets = Array.isArray(state.pets) ? state.pets : [];
    let activePet = state.pets.find((pet) => pet?.id === state.activePetId) || state.pets.find((pet) => pet?.active === true) || state.pets[0] || null;
    state.activePetId = activePet?.id || "";
    state.pets.forEach((pet) => { if (pet) pet.active = !!activePet && pet.id === activePet.id; });
    state.petShelter ||= { lastRefreshAt: 0, offers: [] };
    state.auctionHouse ||= { listings: [], sold: [], favorites: [], botListings: [], botRefreshAt: 0, stats: {} };
    state.auctionHouse.listings = Array.isArray(state.auctionHouse.listings) ? state.auctionHouse.listings : [];
    state.auctionHouse.sold = Array.isArray(state.auctionHouse.sold) ? state.auctionHouse.sold : [];
    state.auctionHouse.botListings = Array.isArray(state.auctionHouse.botListings) ? state.auctionHouse.botListings : [];
    state.auctionHouse.stats ||= { bought: 0, sold: 0, highestSale: 0 };
    state.specialCollection ||= { owned: {}, discovered: {}, equipped: [] };
    state.specialCollection.owned ||= {};
    state.specialCollection.discovered ||= {};
    state.specialCollection.equipped = Array.isArray(state.specialCollection.equipped) ? state.specialCollection.equipped : [];
    state.petStats ||= { adopted: 0, careActions: 0, maxLevel: 0 };
    return state;
  }

  function openOverlay(overlay, html) {
    overlay.innerHTML = html;
    overlay.classList.add("show");
    document.body.classList.add("lbx-open");
  }

  function closeOverlay(overlay) {
    overlay?.classList.remove("show");
    if (!document.querySelector(".lbx-overlay.show")) document.body.classList.remove("lbx-open");
  }

  function petType(id) {
    return PET_TYPES.find((entry) => entry.id === id) || PET_TYPES[0];
  }

  function petNeed(pet, key) {
    return clamp(pet?.[key] ?? 80, 0, 100);
  }

  function normalizePetOffer(raw) {
    const type = petType(raw?.type);
    const variantIcon = raw?.icon || choose(type.icons);
    return {
      id: String(raw?.id || `pet-${now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`),
      type: type.id,
      label: type.label,
      icon: variantIcon,
      breed: String(raw?.breed || choose(type.breeds)),
      name: String(raw?.name || choose(type.names)),
      ageLabel: String(raw?.ageLabel || choose(PET_AGES).label),
      birthAtMs: Math.max(0, Number(raw?.birthAtMs || now())),
      price: Math.max(50, Math.round(Number(raw?.price || type.basePrice))),
      temperament: String(raw?.temperament || choose(PET_TEMPERAMENTS)),
      description: String(raw?.description || choose(type.descriptions))
    };
  }

  function createPetOffer(index = 0) {
    const type = PET_TYPES[index % PET_TYPES.length];
    const age = choose(PET_AGES);
    const ageYears = randomInt(age.minYears, age.maxYears);
    const breed = choose(type.breeds);
    const temperament = choose(PET_TEMPERAMENTS);
    const base = type.basePrice * age.priceFactor * (0.84 + Math.random() * 0.42);
    return normalizePetOffer({
      id: `pet-${now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 6)}`,
      type: type.id,
      label: type.label,
      icon: type.icons[index % type.icons.length],
      breed,
      name: choose(type.names),
      ageLabel: age.label,
      birthAtMs: now() - ageYears * 365.2425 * DAY_MS - randomInt(0, 300) * DAY_MS,
      price: Math.round(base),
      temperament,
      description: choose(type.descriptions)
    });
  }

  function openPetShelter(...args) {
    return window.LifeBuilderPetUI?.openPetShelter?.(...args);
  }

  function specialItems() {
    return Array.from({ length: SPECIAL_TOTAL }, (_, index) => {
      const archetype = SPECIAL_ARCHETYPES[index % SPECIAL_ARCHETYPES.length];
      const prefix = SPECIAL_PREFIXES[Math.floor(index / SPECIAL_ARCHETYPES.length) % SPECIAL_PREFIXES.length];
      const tier = Math.min(4, Math.floor(index / 200));
      const rarity = ["Ungewöhnlich", "Selten", "Episch", "Legendär", "Einzigartig"][tier];
      const serial = index + 1;
      const normalized = index / (SPECIAL_TOTAL - 1);
      const price = Math.round(1000 + Math.pow(normalized, 2.35) * 999000);
      return {
        id: `special-${String(serial).padStart(4, "0")}`,
        name: `${prefix} ${archetype[0]} #${serial}`,
        icon: archetype[1],
        category: archetype[2],
        description: archetype[3],
        wearable: archetype[4],
        rarity,
        tier,
        price
      };
    });
  }

  const SPECIAL = specialItems();

  function specialById(id) {
    return SPECIAL.find((item) => item.id === id);
  }

  function specialOverlay() {
    let overlay = document.querySelector("[data-special-overlay]");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.className = "lbx-overlay";
    overlay.dataset.specialOverlay = "1";
    overlay.dataset.filter = "all";
    overlay.dataset.search = "";
    overlay.dataset.page = "0";
    document.body.append(overlay);
    overlay.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      if (button.matches("[data-lbx-close]")) return closeOverlay(overlay);
      if (button.dataset.specialBuy) return buySpecial(button.dataset.specialBuy);
      if (button.dataset.specialFilter) { overlay.dataset.filter = button.dataset.specialFilter; overlay.dataset.page = "0"; return openSpecial(); }
      if (button.dataset.specialPage) { overlay.dataset.page = String(Math.max(0, Number(overlay.dataset.page || 0) + Number(button.dataset.specialPage))); return openSpecial(); }
    });
    overlay.addEventListener("input", (event) => {
      if (!event.target.matches("[data-special-search]")) return;
      overlay.dataset.search = event.target.value || "";
      overlay.dataset.page = "0";
      overlay.dataset.focusSearch = "1";
      window.clearTimeout(overlay._searchTimer);
      overlay._searchTimer = window.setTimeout(openSpecial, 120);
    });
    return overlay;
  }

  function filteredSpecialItems(overlay) {
    const filter = overlay.dataset.filter || "all";
    const query = String(overlay.dataset.search || "").trim().toLowerCase();
    return SPECIAL.filter((item) => {
      if (filter !== "all" && item.category !== filter) return false;
      if (!query) return true;
      return `${item.name} ${item.category} ${item.rarity} ${item.description}`.toLowerCase().includes(query);
    });
  }

  function openSpecial() {
    const data = ensureState();
    if (!data) return;
    const overlay = specialOverlay();
    const filtered = filteredSpecialItems(overlay);
    const maxPage = Math.max(0, Math.ceil(filtered.length / SPECIAL_PAGE_SIZE) - 1);
    const page = clamp(Math.floor(Number(overlay.dataset.page || 0)), 0, maxPage);
    overlay.dataset.page = String(page);
    const items = filtered.slice(page * SPECIAL_PAGE_SIZE, (page + 1) * SPECIAL_PAGE_SIZE);
    const discovered = Object.keys(data.specialCollection.discovered).filter((id) => data.specialCollection.discovered[id]).length;
    openOverlay(overlay, `<section class="lbx-shell special">
      <header><button data-lbx-close aria-label="Zurück">←</button><div><small>SPECIAL APP</small><h2>1.000 besondere Sammelobjekte</h2></div><b>${discovered.toLocaleString("de-DE")}/${SPECIAL_TOTAL.toLocaleString("de-DE")}</b></header>
      <main>
        <section class="lbx-hero special-hero"><span>✨</span><div><h3>Jedes Item sieht anders aus</h3><p>Dutzende erkennbare Symbole, Kategorien und Beschreibungen ersetzen die frühere Reihe identischer Zeichen. Der Katalog ist jetzt übersichtlich gefiltert und seitenweise geladen.</p></div></section>
        <section class="lbx-toolbar special-toolbar"><input data-special-search value="${esc(overlay.dataset.search || "")}" placeholder="Special-Item suchen"><nav><button class="${(overlay.dataset.filter || "all") === "all" ? "active" : ""}" data-special-filter="all">Alle</button>${SPECIAL_CATEGORIES.map((category) => `<button class="${overlay.dataset.filter === category ? "active" : ""}" data-special-filter="${category}">${category}</button>`).join("")}</nav></section>
        <div class="lbx-special-summary"><span><small>Treffer</small><b>${filtered.length}</b></span><span><small>Seite</small><b>${page + 1}/${maxPage + 1}</b></span><span><small>Entdeckt</small><b>${discovered}</b></span><span><small>Besitz</small><b>${Object.values(data.specialCollection.owned).reduce((sum, value) => sum + Number(value || 0), 0)}</b></span></div>
        <div class="lbx-special-grid">${items.map((item) => {
          const owned = Number(data.specialCollection.owned[item.id] || 0);
          return `<article class="rarity-${item.tier}"><span class="lbx-special-icon">${item.icon}</span><div><small>${item.rarity} · ${item.category}</small><h3>${esc(item.name)}</h3><p>${esc(item.description)}</p><em>${item.wearable ? "Im Kleiderschrank tragbar" : "Bleibt dauerhaft im Sammelheft"}</em></div><strong>${money(item.price)}</strong><button data-special-buy="${item.id}" ${owned ? "disabled" : ""}>${owned ? `Besitz ${owned}` : "Kaufen"}</button></article>`;
        }).join("")}</div>
        <div class="lbx-pagination"><button data-special-page="-1" ${page <= 0 ? "disabled" : ""}>← Vorherige</button><b>Seite ${page + 1} von ${maxPage + 1}</b><button data-special-page="1" ${page >= maxPage ? "disabled" : ""}>Nächste →</button></div>
      </main>
    </section>`);
    const search = overlay.querySelector("[data-special-search]");
    if (search && overlay.dataset.focusSearch === "1") {
      search.focus();
      search.setSelectionRange?.(search.value.length, search.value.length);
      overlay.dataset.focusSearch = "0";
    }
  }

  function buySpecial(id) {
    const data = ensureState();
    const item = specialById(id);
    if (!data || !item) return;
    const paid = typeof pay === "function" ? pay(item.price, false, { target: "treasury" }) : Number(state.cash || 0) + Number(state.bank || 0) >= item.price;
    if (!paid) return typeof addFeed === "function" ? addFeed("Nicht genug Geld für dieses Special-Item.") : undefined;
    if (typeof pay !== "function") {
      if (state.bank >= item.price) state.bank -= item.price;
      else { const rest = item.price - state.bank; state.bank = 0; state.cash -= rest; }
    }
    data.specialCollection.owned[item.id] = Number(data.specialCollection.owned[item.id] || 0) + 1;
    data.specialCollection.discovered[item.id] = true;
    if (item.wearable) {
      state.wardrobe ||= [];
      if (!state.wardrobe.includes(item.name)) state.wardrobe.push(item.name);
    }
    saveRender();
    openSpecial();
  }

  function collectionHtml() {
    const data = ensureState();
    const discovered = Object.keys(data.specialCollection.discovered).filter((id) => data.specialCollection.discovered[id]).length;
    const categoryCards = SPECIAL_CATEGORIES.map((category) => {
      const all = SPECIAL.filter((item) => item.category === category);
      const found = all.filter((item) => data.specialCollection.discovered[item.id]).length;
      return `<article><span>${all[0]?.icon || "✨"}</span><div><b>${category}</b><small>${found}/${all.length} entdeckt</small></div><i><em style="width:${all.length ? found / all.length * 100 : 0}%"></em></i></article>`;
    }).join("");
    const latest = SPECIAL.filter((item) => data.specialCollection.discovered[item.id]).slice(-80).reverse();
    return `<div class="lbx-collection"><section><h3>Sammelheft</h3><p>Ein einmal entdecktes Special bleibt dauerhaft eingetragen, auch wenn du es später versteigerst.</p><strong>${discovered}/${SPECIAL_TOTAL} gesammelt</strong><div class="lbx-collection-progress"><i style="width:${discovered / SPECIAL_TOTAL * 100}%"></i></div></section><div class="lbx-collection-categories">${categoryCards}</div><h3>Zuletzt entdeckte Items</h3><div class="lbx-collection-grid">${latest.length ? latest.map((item) => `<article class="found"><span>${item.icon}</span><b>${esc(item.name)}</b><small>${item.category} · ${item.rarity}</small></article>`).join("") : `<div class="lbx-empty">Noch kein Special-Item entdeckt.</div>`}</div></div>`;
  }

  function botAuctionItem(index = 0) {
    const type = BOT_ASSETS[index % BOT_ASSETS.length];
    const seller = BOT_SELLERS[index % BOT_SELLERS.length];
    if (type.kind === "Special") {
      const special = SPECIAL[(index * 37 + randomInt(0, 99)) % SPECIAL.length];
      const price = Math.max(1000, Math.round(special.price * (0.58 + Math.random() * 0.34)));
      return { id: `bot-auction-${now().toString(36)}-${index}`, seller, kind: "Special", icon: special.icon, name: special.name, price, marketValue: special.price, sourceId: `special:${special.id}`, endsAtMs: now() + randomInt(20, 180) * 60_000 };
    }
    if (type.kind === "Haustier") {
      const pet = createPetOffer(index + 100);
      const price = Math.max(80, Math.round(pet.price * (0.75 + Math.random() * 0.28)));
      return { id: `bot-auction-${now().toString(36)}-${index}`, seller, kind: "Haustier", icon: pet.icon, name: `${pet.name} · ${pet.breed}`, price, marketValue: pet.price, pet, sourceId: `pet-bot:${pet.id}`, endsAtMs: now() + randomInt(20, 180) * 60_000 };
    }
    const name = choose(type.names);
    const marketValue = randomInt(type.min, type.max);
    const price = Math.round(marketValue * (0.62 + Math.random() * 0.29));
    return { id: `bot-auction-${now().toString(36)}-${index}`, seller, kind: type.kind, icon: type.icon, name, price, marketValue, sourceId: `bot-asset:${type.kind}:${index}`, endsAtMs: now() + randomInt(20, 180) * 60_000 };
  }

  function refreshBotAuctions(force = false) {
    const data = ensureState();
    if (!data) return [];
    const active = data.auctionHouse.botListings.filter((listing) => Number(listing.endsAtMs || 0) > now());
    if (!force && active.length >= BOT_AUCTION_COUNT && now() - Number(data.auctionHouse.botRefreshAt || 0) < 30 * 60_000) {
      data.auctionHouse.botListings = active;
      return active;
    }
    data.auctionHouse.botListings = Array.from({ length: BOT_AUCTION_COUNT }, (_, index) => botAuctionItem(index));
    data.auctionHouse.botRefreshAt = now();
    saveRender();
    return data.auctionHouse.botListings;
  }

  function auctionOverlay() {
    let overlay = document.querySelector("[data-auction-overlay]");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.className = "lbx-overlay";
    overlay.dataset.auctionOverlay = "1";
    overlay.dataset.tab = "bots";
    overlay.dataset.filter = "all";
    document.body.append(overlay);
    overlay.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      if (button.matches("[data-lbx-close]")) return closeOverlay(overlay);
      if (button.dataset.auctionTab) { overlay.dataset.tab = button.dataset.auctionTab; return openAuction(); }
      if (button.dataset.auctionFilter) { overlay.dataset.filter = button.dataset.auctionFilter; return openAuction(); }
      if (button.dataset.auctionList) return listAuction(button.dataset.auctionList);
      if (button.dataset.auctionBuyOwn) return processOwnAuction(button.dataset.auctionBuyOwn);
      if (button.dataset.auctionBuyBot) return buyBotAuction(button.dataset.auctionBuyBot);
      if (button.matches("[data-auction-refresh-bots]")) { refreshBotAuctions(true); return openAuction(); }
    });
    return overlay;
  }

  function auctionCandidates() {
    const data = ensureState();
    const rows = [];
    const vehicleCandidates = typeof vehicleItems === "function" ? vehicleItems() : ["Auto", "Neuwagen", "Gebrauchtwagen", "Luxuswagen Supercar", "Motorboot", "Luxus-Yacht"];
    (state.items || []).forEach((name, index) => {
      if (!vehicleCandidates.some((candidate) => typeof itemMatchesName === "function" ? itemMatchesName(name, candidate) : String(name) === candidate)) return;
      const purchasePrice = Math.max(1000, Number(state.vehicleMeta?.[name]?.purchasePrice || 25000));
      rows.push({ id: `vehicle:${index}`, name: String(name), kind: /boot|yacht/i.test(name) ? "Boot" : "Fahrzeug", icon: /boot|yacht/i.test(name) ? "🛥️" : "🚘", base: purchasePrice });
    });
    (state.properties || []).forEach((property, index) => {
      const display = typeof property === "string" ? property : property?.name || property?.id || `Immobilie ${index + 1}`;
      const value = Math.max(50000, Number(property?.purchasePrice || property?.value || 100000));
      rows.push({ id: `property:${index}`, name: String(display), kind: "Immobilie", icon: "🏠", base: value });
    });
    const listedPetIds = new Set();
    const listedPetIndexes = new Set();
    (data.auctionHouse?.listings || []).forEach((listing) => {
      if (listing?.petId) listedPetIds.add(String(listing.petId));
      const source = String(listing?.sourceId || "");
      if (source.startsWith("petid:")) listedPetIds.add(source.slice(6));
      if (source.startsWith("pet:")) {
        const index = Number(source.slice(4));
        if (Number.isInteger(index)) listedPetIndexes.add(index);
      }
    });
    (data.pets || []).forEach((pet, index) => {
      if (listedPetIds.has(String(pet.id || "")) || listedPetIndexes.has(index)) return;
      rows.push({ id: `petid:${pet.id}`, petId: pet.id, name: pet.name, kind: "Haustier", icon: pet.icon || petType(pet.type).icons[0], base: Math.max(100, Number(pet.price || 500)) });
    });
    Object.entries(data.specialCollection.owned).filter(([, amount]) => Number(amount) > 0).forEach(([id]) => {
      const item = specialById(id);
      if (item) rows.push({ id: `special:${id}`, name: item.name, kind: "Special", icon: item.icon, base: item.price });
    });
    return rows;
  }

  function ownAuctionCards(data) {
    if (!data.auctionHouse.listings.length) return `<div class="lbx-empty">Noch keine eigenen Auktionen.</div>`;
    return data.auctionHouse.listings.map((listing) => `<article><span>${listing.icon || "🔨"}</span><div><small>${esc(listing.kind)} · dein Angebot</small><h3>${esc(listing.name)}</h3><p>${money(listing.price)} · Marktwert ungefähr ${money(listing.base || listing.price)}</p></div><strong>${Math.max(1, Math.ceil((listing.endsAtMs - now()) / 60_000))} Min.</strong><button data-auction-buy-own="${listing.id}">Bot-Gebote prüfen</button></article>`).join("");
  }

  function botAuctionCards(data, filter) {
    const listings = refreshBotAuctions().filter((listing) => filter === "all" || listing.kind === filter);
    return listings.map((listing) => `<article class="bot-auction"><span>${listing.icon || "🔨"}</span><div><small>${esc(listing.seller)} · ${esc(listing.kind)}</small><h3>${esc(listing.name)}</h3><p>Marktwert etwa ${money(listing.marketValue)} · Angebot ${Math.round(listing.price / listing.marketValue * 100)}%</p></div><strong>${money(listing.price)}</strong><button data-auction-buy-bot="${listing.id}">Kaufen</button></article>`).join("") || `<div class="lbx-empty">Aktuell keine Bot-Auktionen in dieser Kategorie.</div>`;
  }

  function openAuction() {
    const data = ensureState();
    if (!data) return;
    const overlay = auctionOverlay();
    const tab = overlay.dataset.tab || "bots";
    const filter = overlay.dataset.filter || "all";
    const candidates = auctionCandidates();
    const filters = ["all", ...new Set(refreshBotAuctions().map((listing) => listing.kind))];
    openOverlay(overlay, `<section class="lbx-shell auction">
      <header><button data-lbx-close aria-label="Zurück">←</button><div><small>F.ANZ</small><h2>FeinAnzeigen.KL</h2></div><button data-auction-refresh-bots title="Anzeigen aktualisieren">↻</button></header>
      <main>
        <section class="lbx-hero"><span>🔨</span><div><h3>Viele Händler, faire Marktbereiche</h3><p>Bot-Händler bieten Fahrzeuge, Boote, Haustiere und Special-Items zu nachvollziehbaren Preisen an. Eigene besondere Werte kannst du mit einem selbst gewählten Preis einstellen.</p></div></section>
        <nav class="lbx-auction-tabs"><button class="${tab === "bots" ? "active" : ""}" data-auction-tab="bots">Bot-Auktionen <i>${data.auctionHouse.botListings.length}</i></button><button class="${tab === "mine" ? "active" : ""}" data-auction-tab="mine">Eigene Angebote <i>${data.auctionHouse.listings.length}</i></button><button class="${tab === "sell" ? "active" : ""}" data-auction-tab="sell">Verkaufen <i>${candidates.length}</i></button></nav>
        ${tab === "bots" ? `<nav class="lbx-filters">${filters.map((entry) => `<button class="${filter === entry ? "active" : ""}" data-auction-filter="${entry}">${entry === "all" ? "Alle" : esc(entry)}</button>`).join("")}</nav><div class="lbx-auction-grid">${botAuctionCards(data, filter)}</div>` : ""}
        ${tab === "mine" ? `<div class="lbx-auction-grid">${ownAuctionCards(data)}</div><section class="lbx-auction-stats"><span><small>Verkauft</small><b>${data.auctionHouse.stats.sold || 0}</b></span><span><small>Gekauft</small><b>${data.auctionHouse.stats.bought || 0}</b></span><span><small>Höchster Verkauf</small><b>${money(data.auctionHouse.stats.highestSale || 0)}</b></span></section>` : ""}
        ${tab === "sell" ? `<div class="lbx-auction-grid">${candidates.length ? candidates.map((candidate) => `<article><span>${candidate.icon}</span><div><small>${candidate.kind}</small><h3>${esc(candidate.name)}</h3><p>Sofortverkauf ungefähr 20 %. Im Auktionshaus legst du den Preis selbst fest.</p></div><strong>Wert ${money(candidate.base)}</strong><button data-auction-list="${candidate.id}">Einstellen</button></article>`).join("") : `<div class="lbx-empty">Keine geeigneten Gegenstände vorhanden.</div>`}</div>` : ""}
      </main>
    </section>`);
  }

  function listAuction(id) {
    const data = ensureState();
    const candidate = auctionCandidates().find((entry) => entry.id === id);
    if (!data || !candidate) return false;
    const suggested = Math.round(candidate.base * 0.62);
    const price = Number(window.prompt(`Startpreis für ${candidate.name}`, suggested));
    if (!Number.isFinite(price) || price < 100) return false;
    if (!window.confirm(`${candidate.name} für ${money(Math.round(price))} auf FeinAnzeigen.KL einstellen?\n\nDas Tier bleibt bis zum erfolgreichen Verkauf bei dir. Beim Verkauf wird es automatisch übergeben.`)) return false;
    data.auctionHouse.listings.push({ ...candidate, id: `auc-${now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, price: Math.round(price), sourceId: id, endsAtMs: now() + 30 * 60_000 });
    saveRender();
    if (typeof queuePurchaseConfirmation === "function") queuePurchaseConfirmation({ kind: "use", title: "Inserat veröffentlicht", name: candidate.name, subtitle: `${money(Math.round(price))} auf FeinAnzeigen.KL`, icon: candidate.icon || "🔨" });
    auctionOverlay().dataset.tab = "mine";
    openAuction();
    return true;
  }

  function listPetOnFineAnzeigen(petId) {
    const data = ensureState();
    const pet = data?.pets?.find((entry) => String(entry.id || "") === String(petId || ""));
    if (!data || !pet) return false;
    const existing = (data.auctionHouse?.listings || []).find((listing) => listing?.petId === pet.id || listing?.sourceId === `petid:${pet.id}`);
    if (existing) {
      window.alert(`${pet.name} ist bereits für ${money(existing.price)} auf FeinAnzeigen.KL eingestellt.`);
      auctionOverlay().dataset.tab = "mine";
      openAuction();
      return false;
    }
    return listAuction(`petid:${pet.id}`);
  }

  function removeAuctionSource(data, sourceId) {
    const source = String(sourceId || "");
    if (source.startsWith("vehicle:")) {
      const index = Number(source.split(":")[1]);
      if (Number.isInteger(index) && state.items?.[index]) state.items.splice(index, 1);
    } else if (source.startsWith("property:")) {
      const index = Number(source.split(":")[1]);
      if (Number.isInteger(index) && state.properties?.[index] !== undefined) state.properties.splice(index, 1);
    } else if (source.startsWith("petid:")) {
      const petId = source.slice(6);
      const index = data.pets?.findIndex((pet) => String(pet?.id || "") === petId) ?? -1;
      if (index >= 0) data.pets.splice(index, 1);
      if (data.activePetId === petId) data.activePetId = data.pets?.[0]?.id || "";
      (data.pets || []).forEach((pet) => { pet.active = !!data.activePetId && pet.id === data.activePetId; });
    } else if (source.startsWith("pet:")) {
      const index = Number(source.split(":")[1]);
      const removedId = Number.isInteger(index) ? data.pets?.[index]?.id : "";
      if (Number.isInteger(index) && data.pets?.[index]) data.pets.splice(index, 1);
      if (removedId && data.activePetId === removedId) data.activePetId = data.pets?.[0]?.id || "";
      (data.pets || []).forEach((pet) => { pet.active = !!data.activePetId && pet.id === data.activePetId; });
    } else if (source.startsWith("special:")) {
      const specialId = source.slice(8);
      data.specialCollection.owned[specialId] = Math.max(0, Number(data.specialCollection.owned[specialId] || 0) - 1);
    }
  }

  function processOwnAuction(id) {
    const data = ensureState();
    const listing = data?.auctionHouse?.listings?.find((entry) => entry.id === id);
    if (!listing) return;
    const ratio = Number(listing.base || listing.price) / Math.max(1, listing.price);
    const chance = clamp(ratio * 0.48, 0.08, 0.92);
    if (Math.random() < chance) {
      removeAuctionSource(data, listing.sourceId);
      if (typeof payoutFromTreasury === "function") payoutFromTreasury(listing.price);
      else state.cash = Number(state.cash || 0) + listing.price;
      data.auctionHouse.sold.push({ ...listing, soldAtMs: now() });
      data.auctionHouse.listings = data.auctionHouse.listings.filter((entry) => entry.id !== id);
      data.auctionHouse.stats.sold = Number(data.auctionHouse.stats.sold || 0) + 1;
      data.auctionHouse.stats.highestSale = Math.max(Number(data.auctionHouse.stats.highestSale || 0), listing.price);
      if (typeof addFeed === "function") addFeed(`Auktion verkauft: ${listing.name} für ${money(listing.price)}.`);
    } else if (typeof addFeed === "function") addFeed("Noch kein Käufer. Ein realistischerer Preis erhöht die Chance.");
    saveRender();
    openAuction();
  }

  function buyBotAuction(id) {
    const data = ensureState();
    const listing = data?.auctionHouse?.botListings?.find((entry) => entry.id === id);
    if (!listing) return;
    const paid = typeof pay === "function" ? pay(listing.price, false, { target: "treasury" }) : Number(state.cash || 0) + Number(state.bank || 0) >= listing.price;
    if (!paid) return typeof addFeed === "function" ? addFeed("Nicht genug Geld für diese Auktion.") : undefined;
    if (typeof pay !== "function") {
      if (state.bank >= listing.price) state.bank -= listing.price;
      else { const rest = listing.price - state.bank; state.bank = 0; state.cash -= rest; }
    }
    if (listing.kind === "Special") {
      const specialId = String(listing.sourceId || "").replace("special:", "");
      data.specialCollection.owned[specialId] = Number(data.specialCollection.owned[specialId] || 0) + 1;
      data.specialCollection.discovered[specialId] = true;
    } else if (listing.kind === "Haustier" && listing.pet) {
      const wasEmpty = data.pets.length === 0;
      const acquiredPet = { ...normalizePetOffer(listing.pet), level: 1, xp: 0, hunger: 85, thirst: 85, happiness: 80, care: 90, adoptedAtMs: now(), active: wasEmpty };
      data.pets.push(acquiredPet);
      if (wasEmpty) data.activePetId = acquiredPet.id;
      data.petStats.adopted = Number(data.petStats.adopted || 0) + 1;
    } else {
      state.items ||= [];
      state.items.push(listing.name);
      state.vehicleMeta ||= {};
      state.vehicleMeta[listing.name] ||= { purchasePrice: listing.price, fuel: 100, condition: 100, boughtAtMs: now(), source: "auction" };
    }
    data.auctionHouse.botListings = data.auctionHouse.botListings.filter((entry) => entry.id !== id);
    data.auctionHouse.stats.bought = Number(data.auctionHouse.stats.bought || 0) + 1;
    if (typeof addFeed === "function") addFeed(`Auktion gewonnen: ${listing.name} für ${money(listing.price)}.`);
    saveRender();
    openAuction();
  }

  function installMap() {
    try {
      if (!Array.isArray(mapPlaces) || !Array.isArray(routes)) return;
      const license = mapPlaces.find((place) => place.id === "licenseoffice");
      if (license) { license.x = 29; license.y = 8; license.name = "Führerscheinstelle"; }
      const market = mapPlaces.find((place) => place.id === "market");
      if (market) market.y = 24;
      let shelter = mapPlaces.find((place) => place.id === "animal-shelter");
      if (!shelter) {
        shelter = { id: "animal-shelter", name: "Tierheim", icon: "🐾", x: 53, y: 7, kind: "Tiere", cost: 2, minutes: 12 };
        mapPlaces.push(shelter);
      } else { shelter.x = 53; shelter.y = 7; shelter.icon = "🐾"; }
      const known = new Set(mapPlaces.map((place) => place.id));
      [["blackcorner", "animal-shelter"], ["market", "animal-shelter"], ["airport", "animal-shelter"], ["market", "licenseoffice"]].forEach((route) => {
        if (!known.has(route[0]) || !known.has(route[1])) return;
        if (!routes.some((entry) => (entry[0] === route[0] && entry[1] === route[1]) || (entry[0] === route[1] && entry[1] === route[0]))) routes.push(route);
      });
      const baseHtml = localPlaceActionsHtml;
      localPlaceActionsHtml = function patchedLocalPlaceActionsHtml() {
        if (currentPlace()?.id !== "animal-shelter") return baseHtml();
        return `<div class="shop-section local-place-section"><h3>Tierheim</h3>${card("Tierheim & Tiermarkt", "Viele Tierarten, wechselnde Rassen, eigene Namen und ein vollständiges Pflege- und Levelsystem.", "Öffnen", "pet-shelter", false, "local-action")}</div>`;
      };
      if (typeof renderMap === "function" && state && !document.getElementById("gameScreen")?.classList.contains("hidden")) renderMap();
    } catch (error) {
      console.warn("Tierheim-Karte", error);
    }
  }

  function installCharacter() {
    try {
      const baseNav = characterHubNavHtml;
      characterHubNavHtml = function patchedCharacterHubNavHtml(section) {
        const original = baseNav(section);
        if (original.includes('data-character-section="collection"')) return original;
        return `${original}<button class="mini-button ${section === "collection" ? "gold" : ""}" data-character-section="collection" title="Sammelheft">Sammelheft</button>`;
      };
      const baseContent = characterHubContent;
      characterHubContent = function patchedCharacterHubContent(section) {
        if (section === "collection") return collectionHtml();
        return baseContent(section);
      };
      // Die Haustierdarstellung wird ausschließlich durch pet-ui-v16.js verwaltet.
      // Dadurch gibt es keine zweite, konkurrierende Tierkarte und keinen Sprung ins alte Tierheim-Menü.
    } catch (error) {
      console.warn("Charakter-Erweiterung", error);
    }
  }

  function installSkills() {
    try {
      const baseSkillTree = skillTreeHtml;
      skillTreeHtml = function patchedSkillTreeHtml() {
        const html = baseSkillTree();
        if (html.includes("data-skill-info")) return html;
        return html.replace(`<span>Freie Punkte: ${state.skillPoints || 0}</span>`, `<div class="skill-help-head"><button type="button" data-skill-info title="Skill-Erklärung">i</button><span>Freie Punkte: ${state.skillPoints || 0}</span></div>`);
      };
      const oldBind = bindCharacterHubContent;
      bindCharacterHubContent = function patchedSkillBind(root, section) {
        oldBind(root, section);
        root.querySelector("[data-skill-info]")?.addEventListener("click", () => {
          if (typeof openSkillInfoDialog === "function") openSkillInfoDialog();
          else window.alert("Skill-Informationen konnten nicht geöffnet werden.");
        });
      };
      const reduction = () => Math.max(0.64, 1 - (Math.max(1, Number(state?.skills?.Fahren || 1)) - 1) * 0.04);
      if (typeof consumeSpecificVehicleFuel === "function") {
        const oldConsume = consumeSpecificVehicleFuel;
        consumeSpecificVehicleFuel = function patchedFuel(vehicle, amount) { return oldConsume(vehicle, Number(amount || 0) * reduction()); };
      }
      if (typeof businessMapFuelCost === "function") {
        const oldCost = businessMapFuelCost;
        businessMapFuelCost = function patchedBusinessFuel(distance, vehicle) { return oldCost(distance, vehicle) * reduction(); };
      }
    } catch (error) {
      console.warn("Skill-Erweiterung", error);
    }
  }

  function installApps() {
    try {
      const entries = [
        { id: "special", label: "Special", icon: "✨", minTier: 1, status: "available", description: "1.000 erkennbare Special-Items, exklusive Kleidung und ein dauerhaftes Sammelheft." },
        { id: "fine-anzeigen", label: "F.ANZ", icon: "F", minTier: 1, status: "available", description: "FeinAnzeigen.KL mit Bot-Angeboten, eigenen Inseraten und dem bisherigen Auktionsmarkt." }
      ];
      entries.forEach((entry) => {
        const existing = phoneAppStoreCatalog.find((app) => app.id === entry.id);
        if (existing) Object.assign(existing, entry);
        else phoneAppStoreCatalog.push(entry);
      });

      const baseStoreHtml = phoneAppStoreHtml;
      phoneAppStoreHtml = function patchedExpansionStoreHtml(item) {
        return baseStoreHtml(item).replace(
          /<p class="device-hint">[\s\S]*?<\/p>\s*<\/div>\s*$/,
          `<p class="device-hint">F.ANZ öffnet FeinAnzeigen.KL. Special enthält den Sammlerkatalog. Heruntergeladene Apps bleiben bis zur Deinstallation installiert.</p></div>`
        );
      };

      const baseApps = deviceAppsFor;
      deviceAppsFor = function patchedDeviceAppsFor(item) {
        const apps = baseApps(item);
        if (!phoneItems().includes(item)) return apps;
        if (isPhoneAppInstalled("special") && !apps.some((app) => app.id === "special")) {
          apps.push({ id: "special", min: 1, data: false, label: "Special", icon: "✨", text: entries[0].description, layoutClass: "device-downloaded-app special-app-icon", locked: false, lockText: "" });
        }
        if (isPhoneAppInstalled("fine-anzeigen") && !apps.some((app) => app.id === "fine-anzeigen")) {
          apps.push({ id: "fine-anzeigen", min: 1, data: false, label: "F.ANZ", icon: "F", text: entries[1].description, layoutClass: "device-downloaded-app fine-anzeigen-app-icon", locked: false, lockText: "" });
        }
        return apps;
      };

      const baseActions = deviceAppActions;
      deviceAppActions = function patchedDeviceAppActions(id, item) {
        if (id === "special") return `<div class="special-phone-launch"><span>✨</span><h3>Special</h3><p>1.000 unterschiedliche Items mit klaren Symbolen, Kategorien und Sammelheft.</p><button class="primary-button" data-open-special>Öffnen</button></div>`;
        if (id === "fine-anzeigen") return `<div class="special-phone-launch fine-anzeigen-phone-launch"><span>F</span><h3>FeinAnzeigen.KL</h3><p>Bot-Angebote ansehen, eigene besondere Gegenstände inserieren und passende Anzeigen kaufen.</p><button class="primary-button" data-open-fine-anzeigen>FeinAnzeigen.KL öffnen</button></div>`;
        return baseActions(id, item);
      };

      const baseOpen = openDeviceAppDirect;
      openDeviceAppDirect = function patchedOpenDeviceAppDirect(item, id) {
        if (id === "special") {
          document.querySelector("#detailDialog")?.close?.();
          return openSpecial();
        }
        if (id === "fine-anzeigen") {
          document.querySelector("#detailDialog")?.close?.();
          return openAuction();
        }
        return baseOpen(item, id);
      };

      const baseInterface = openDeviceInterface;
      openDeviceInterface = function patchedOpenDeviceInterface(item, active = "home", use = true) {
        const result = baseInterface(item, active, use);
        if (active === "special") window.setTimeout(() => document.querySelector("#detailDialog [data-open-special]")?.addEventListener("click", () => { document.querySelector("#detailDialog")?.close?.(); openSpecial(); }), 0);
        if (active === "fine-anzeigen") window.setTimeout(() => document.querySelector("#detailDialog [data-open-fine-anzeigen]")?.addEventListener("click", () => { document.querySelector("#detailDialog")?.close?.(); openAuction(); }), 0);
        return result;
      };
    } catch (error) {
      console.warn("Download-Apps", error);
    }
  }

  function installCentral() {
    // Die Zentrale bleibt absichtlich geschlossen. FeinAnzeigen ist jetzt eine
    // eigenständige Download-App im Life App Store.
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-upcoming-area]");
      if (!button) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (typeof showNotice === "function") showNotice("Zentrale", "Wird noch hinzugefügt.");
      else window.alert("Zentrale: Wird noch hinzugefügt.");
    }, true);
  }

  function installAchievements() {
    try {
      const base = achievementDefinitions;
      achievementDefinitions = function patchedAchievementDefinitions() {
        const list = base();
        const additions = [
          { id: "pet-first", name: "Neues Familienmitglied", text: "Das erste Haustier adoptieren.", done: () => (state.pets || []).length >= 1 },
          { id: "pet-care-25", name: "Tierfreund", text: "25 Pflegeaktionen mit Haustieren durchführen.", done: () => Number(state.petStats?.careActions || 0) >= 25 },
          { id: "pet-level-10", name: "Tiertrainer", text: "Ein Haustier auf Level 10 bringen.", done: () => (state.pets || []).some((pet) => Number(pet.level || 1) >= 10) },
          { id: "auction-buy", name: "Auktionsgewinner", text: "Die erste Bot-Auktion gewinnen.", done: () => Number(state.auctionHouse?.stats?.bought || 0) >= 1 },
          { id: "auction-sell", name: "Unter dem Hammer", text: "Den ersten eigenen Gegenstand versteigern.", done: () => Number(state.auctionHouse?.stats?.sold || 0) >= 1 },
          { id: "special-10", name: "Sammlerstart", text: "10 Special-Items entdecken.", done: () => Object.keys(state.specialCollection?.discovered || {}).filter((id) => state.specialCollection.discovered[id]).length >= 10 },
          { id: "special-100", name: "Vitrine", text: "100 Special-Items entdecken.", done: () => Object.keys(state.specialCollection?.discovered || {}).filter((id) => state.specialCollection.discovered[id]).length >= 100 },
          { id: "special-500", name: "Großsammler", text: "500 Special-Items entdecken.", done: () => Object.keys(state.specialCollection?.discovered || {}).filter((id) => state.specialCollection.discovered[id]).length >= 500 },
          { id: "special-1000", name: "Komplettes Sammelheft", text: "Alle 1.000 Special-Items entdecken.", done: () => Object.keys(state.specialCollection?.discovered || {}).filter((id) => state.specialCollection.discovered[id]).length >= SPECIAL_TOTAL }
        ];
        const existing = new Set(list.map((entry) => entry.id));
        return [...list, ...additions.filter((entry) => !existing.has(entry.id))];
      };
    } catch (error) {
      console.warn("Erfolge-Erweiterung", error);
    }
  }

  function installCallDiagnostics() {
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-phone-diagnostics]");
      if (!button) return;
      const turn = !!window.LifeBuilderRtcConfig?.turnCredentialsUrl;
      const secure = location.protocol === "https:";
      const media = !!navigator.mediaDevices?.getUserMedia;
      window.alert(`HTTPS: ${secure ? "OK" : "FEHLT"}\nMikrofon/WebRTC: ${media ? "verfügbar" : "nicht verfügbar"}\nTURN-Server: ${turn ? "konfiguriert" : "nicht konfiguriert"}\n\nDirekte Gespräche im gleichen oder kompatiblen Netz können ohne TURN funktionieren. Bei Mobilfunk zu WLAN oder strengen Routern ist TURN notwendig. Ein echter 3er-Gesamt-Call benötigt zusätzlich einen Konferenzserver/SFU.`);
    });
    const observer = new MutationObserver(() => {
      document.querySelectorAll(".device-active-phone .device-screen,.device-phone-app").forEach((root) => {
        if (root.querySelector("[data-phone-diagnostics]")) return;
        const target = root.querySelector(".device-hint") || root;
        target.insertAdjacentHTML("beforeend", `<button class="mini-button phone-diagnostics" data-phone-diagnostics>Telefon-Verbindung prüfen</button>`);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function installSettingsLogout() {
    const addButton = () => {
      const panel = document.querySelector("#settingsView .settings-panel");
      if (!panel || document.getElementById("lifeLogoutBtn")) return;
      const button = document.createElement("button");
      button.id = "lifeLogoutBtn";
      button.type = "button";
      button.className = "secondary-button settings-wide life-logout-button";
      button.textContent = "Abmelden";
      const news = document.getElementById("whatsNewBtn");
      if (news?.parentElement === panel) news.insertAdjacentElement("afterend", button);
      else panel.append(button);
      button.addEventListener("click", async () => {
        if (!window.confirm("Vom JK.Games-Account abmelden? Deine Spielstände bleiben erhalten und werden beim nächsten Login erneut synchronisiert.")) return;
        button.disabled = true;
        button.textContent = "Wird abgemeldet …";
        try {
          const fb = await window.LifeBuilderOnline?.getFirebase?.();
          if (fb?.auth && typeof fb.signOut === "function") await fb.signOut(fb.auth);
        } catch (error) {
          console.warn("Abmeldung", error);
        }
        location.reload();
      });
    };
    addButton();
    new MutationObserver(addButton).observe(document.body, { childList: true, subtree: true });
  }

  function decayPets({ saveChanges = true } = {}) {
    const data = ensureState();
    if (!data) return false;
    const current = now();
    const storedLast = Number(data.petLastTickAt || 0);
    // Alte Spielstände hatten teilweise noch keinen Zeitanker. Ohne diese
    // Initialisierung wurde bei jedem Tick wieder "jetzt" verwendet und die
    // Tierwerte konnten deshalb niemals sinken.
    if (!Number.isFinite(storedLast) || storedLast <= 0 || storedLast > current) {
      data.petLastTickAt = current;
      if (saveChanges) { try { save(); } catch { /* no active save */ } }
      return false;
    }
    const elapsedMinutes = Math.min(72 * 60, Math.floor((current - storedLast) / 60_000));
    if (elapsedMinutes < 1) return false;
    let changed = false;
    data.pets.forEach((pet) => {
      if (!pet) return;
      const before = [petNeed(pet, "hunger"), petNeed(pet, "thirst"), petNeed(pet, "happiness"), petNeed(pet, "care")];
      const beforeToilet = pet.type === "dog" ? clamp(pet.toiletNeed ?? 25, 0, 100) : 0;
      // Langsame, aber sichtbar funktionierende Echtzeit-Abnahme. Die Werte
      // werden über den verstrichenen Zeitstempel berechnet, daher läuft kein
      // schwerer Dauertimer pro Tier und auch geschlossene Apps werden korrekt
      // nachgeholt.
      pet.hunger = clamp(before[0] - elapsedMinutes * 0.065, 0, 100);
      pet.thirst = clamp(before[1] - elapsedMinutes * 0.085, 0, 100);
      pet.happiness = clamp(before[2] - elapsedMinutes * 0.028, 0, 100);
      pet.care = clamp(before[3] - elapsedMinutes * 0.014, 0, 100);
      if (pet.type === "dog") pet.toiletNeed = clamp(beforeToilet + elapsedMinutes * 0.12, 0, 100);
      if (pet.hunger !== before[0] || pet.thirst !== before[1] || pet.happiness !== before[2] || pet.care !== before[3] || (pet.type === "dog" && pet.toiletNeed !== beforeToilet)) changed = true;
    });
    data.petLastTickAt = storedLast + elapsedMinutes * 60_000;
    if (changed) {
      try { window.LifeBuilderPetUI?.refreshOpenPetMeters?.(); } catch { /* Menü kann geschlossen sein */ }
      if (saveChanges) { try { save(); } catch { /* no active save */ } }
    }
    return changed;
  }

  let installed = false;
  function init() {
    if (installed) return;
    if (typeof mapPlaces === "undefined" || typeof routes === "undefined" || typeof localPlaceActionsHtml !== "function" || typeof handleLocalPlaceAction !== "function") {
      window.setTimeout(init, 100);
      return;
    }
    installed = true;
    installMap();
    installCharacter();
    installSkills();
    installApps();
    installCentral();
    installAchievements();
    // V52: technische Telefon-Diagnose nicht mehr in der sichtbaren Telefon-App einblenden.
    installSettingsLogout();
    if (typeof state !== "undefined" && state) { ensureState(); decayPets(); refreshBotAuctions(); }
    window.setInterval(() => { if (typeof state !== "undefined" && state) decayPets(); }, 60_000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden && typeof state !== "undefined" && state) decayPets(); });
    window.addEventListener("focus", () => { if (typeof state !== "undefined" && state) decayPets(); });
    window.LifeBuilderExpansion = {
      version: VERSION,
      openPetShelter: (...args) => window.LifeBuilderPetUI?.openPetShelter?.(...args) || openPetShelter(...args),
      openPetHome: (...args) => window.LifeBuilderPetUI?.openPetHome?.(...args),
      refreshPetNeeds: () => decayPets(),
      openAuction, listPetOnFineAnzeigen, openSpecial, specialCount: SPECIAL_TOTAL,
      debug: { getSpecialItems: () => SPECIAL.slice(), getPetTypes: () => PET_TYPES.slice(), refreshBotAuctions: (force = false) => refreshBotAuctions(force) }
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
