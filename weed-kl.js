(() => {
  "use strict";

  const WK_APP_ID = "weed-kl";
  const WK_VERSION = "2026-07-28-weed-role-lock-v80";
  const WK_BACKUP_PREFIX = "lifebuilder-weedkl";
  const WK_BASE_CUSTOMERS = 4;
  const WK_MAX_CUSTOMERS = 14;
  const WK_MAX_PLANTS = 20;
  const WK_STAGE_WATER_NEEDS = [5, 6, 7, 8, 10];
  const WK_STAGE_THRESHOLDS = WK_STAGE_WATER_NEEDS.reduce((list, amount) => [...list, (list.at(-1) || 0) + amount], []);
  const WK_ALLOWED_ROLES = new Set(["moderator", "admin", "owner"]);

  function wkAccessRole() {
    try {
      const liveRole = window.LifeBuilderSettingsMenu?.getRole?.();
      if (liveRole?.active && WK_ALLOWED_ROLES.has(String(liveRole.role || "").toLowerCase())) {
        return String(liveRole.role).toLowerCase();
      }
    } catch {}
    try {
      const session = JSON.parse(sessionStorage.getItem("lifebuilder-2026-online-mod-session") || "null");
      const role = String(session?.role || "").toLowerCase();
      if (session?.authorized && Number(session?.expiresAt || 0) > Date.now() && WK_ALLOWED_ROLES.has(role)) return role;
    } catch {}
    return "";
  }

  function wkHasAccess() {
    return !!wkAccessRole();
  }

  function wkAccessDenied() {
    const message = "Weed Business ist nur für Moderator, Admin und Owner erreichbar.";
    if (typeof addFeed === "function") addFeed(message);
    return { ok: false, message };
  }

  function wkGuarded(action, fallback = null) {
    if (!wkHasAccess()) return wkAccessDenied() && fallback;
    return action();
  }

  // Seed prices are deliberately scaled game values. Relative tiers follow current catalog positioning
  // from established seed shops; gram sale prices remain fictional gameplay values.
  const WK_STRAINS = [
    { id: "basic", name: "Basic Weed", seedPrice: 2, sellPrice: 10, tier: 0, accent: "#7be39a", rarity: "Basis" },
    { id: "special-queen", name: "Special Queen #1", seedPrice: 4, sellPrice: 12, tier: 0, accent: "#86d96c", rarity: "Klassik" },
    { id: "northern-light", name: "Northern Light", seedPrice: 8, sellPrice: 14, tier: 0, accent: "#68d9bc", rarity: "Klassik" },
    { id: "white-widow", name: "White Widow", seedPrice: 8, sellPrice: 16, tier: 0, accent: "#c9e9dd", rarity: "Klassik" },
    { id: "blue-mystic", name: "Blue Mystic", seedPrice: 8, sellPrice: 17, tier: 1, accent: "#70a8ff", rarity: "Selten" },
    { id: "fruit-spirit", name: "Fruit Spirit", seedPrice: 8, sellPrice: 18, tier: 1, accent: "#ff9e72", rarity: "Selten" },
    { id: "power-flower", name: "Power Flower", seedPrice: 8, sellPrice: 19, tier: 1, accent: "#e2dd67", rarity: "Selten" },
    { id: "critical", name: "Critical", seedPrice: 9, sellPrice: 20, tier: 2, accent: "#f2c052", rarity: "Premium" },
    { id: "royal-moby", name: "Royal Moby", seedPrice: 9, sellPrice: 22, tier: 2, accent: "#af8cff", rarity: "Premium" },
    { id: "silver-haze", name: "Shining Silver Haze", seedPrice: 9, sellPrice: 23, tier: 3, accent: "#c4d9ff", rarity: "Elite" },
    { id: "amnesia-haze", name: "Amnesia Haze", seedPrice: 10, sellPrice: 25, tier: 3, accent: "#d69dff", rarity: "Elite" },
    { id: "special-kush", name: "Special Kush #1", seedPrice: 3, sellPrice: 15, tier: 4, accent: "#b87956", rarity: "Sammler" },
    { id: "og-kush", name: "OG Kush", seedPrice: 14, sellPrice: 30, tier: 5, accent: "#91c96d", rarity: "Master" },
    { id: "green-gelato", name: "Green Gelato", seedPrice: 15, sellPrice: 32, tier: 5, accent: "#7fe1a1", rarity: "Master" },
    { id: "runtz", name: "Runtz", seedPrice: 16, sellPrice: 34, tier: 5, accent: "#ff9fce", rarity: "Master" },
    { id: "gorilla-glue", name: "Gorilla Glue #4", seedPrice: 18, sellPrice: 38, tier: 6, accent: "#a7b47b", rarity: "Master+" },
    { id: "zkittlez", name: "Zkittlez", seedPrice: 18, sellPrice: 40, tier: 6, accent: "#f6a8ff", rarity: "Master+" },
    { id: "wedding-cake", name: "Wedding Cake", seedPrice: 19, sellPrice: 42, tier: 6, accent: "#f5d8ad", rarity: "Master+" },
    { id: "cookies-gelato", name: "Cookies Gelato", seedPrice: 22, sellPrice: 48, tier: 7, accent: "#c8a7ff", rarity: "Imperial" },
    { id: "blue-dream", name: "Blue Dream", seedPrice: 22, sellPrice: 50, tier: 7, accent: "#76b7ff", rarity: "Imperial" },
    { id: "jack-herer", name: "Jack Herer", seedPrice: 24, sellPrice: 52, tier: 7, accent: "#b7e66e", rarity: "Imperial" },
    { id: "sour-diesel", name: "Sour Diesel", seedPrice: 28, sellPrice: 58, tier: 8, accent: "#e2df65", rarity: "Legendär" },
    { id: "mimosa", name: "Mimosa", seedPrice: 30, sellPrice: 62, tier: 8, accent: "#ffb45e", rarity: "Legendär" },
    { id: "lemon-cherry-gelato", name: "Lemon Cherry Gelato", seedPrice: 35, sellPrice: 68, tier: 8, accent: "#ff7f9f", rarity: "Legendär" }
  ];

  const WK_SUPPLY_ITEMS = [
    { id: "pot", label: "Blumentopf", icon: "◉", amount: 1, price: 25, text: "Wird beim Pflanzen belegt und nach der letzten Ernte zurückgegeben." },
    { id: "soil", label: "Erde", icon: "▰", amount: 1, price: 12, text: "Eine Einheit wird für eine neue Pflanze verbraucht." },
    { id: "water", label: "Wasserkanister", icon: "◒", amount: 30, price: 15, text: "Enthält 30 Gießeinheiten." },
    { id: "water", label: "Großer Wassertank", icon: "◉", amount: 100, price: 38, text: "Enthält 100 Gießeinheiten und spart Geld." }
  ];

  const WK_UPGRADES = {
    slots: { label: "Pflanzenplätze", icon: "▦", max: 7, costs: [250, 450, 700, 1000, 1400, 1900, 2500], text: (level) => `${3 + level} von 10 Basisplätzen freigeschaltet.` },
    watering: { label: "Schnellbewässerung", icon: "◒", max: 5, costs: [250, 500, 850, 1300, 1900], text: (level) => `${Math.max(5, 15 - level * 2)} Sekunden Wartezeit zwischen zwei Gießvorgängen.` },
    yield: { label: "Erntequalität", icon: "✦", max: 5, costs: [450, 850, 1400, 2150, 3200], text: (level) => `+${level * 5}% Ertrag bei jedem Schnitt.` },
    customers: { label: "Kundennetzwerk", icon: "●", max: 5, costs: [300, 650, 1100, 1750, 2600], text: (level) => `Neue Anfragen ungefähr alle ${Math.max(14, 36 - level * 4)} Sekunden.` },
    orders: { label: "Großbestellungen", icon: "▤", max: 3, costs: [550, 1100, 2000], text: (level) => `Kunden können bis zu ${Math.min(4, 1 + level)} Sorten gleichzeitig anfragen.` },
    market: { label: "Sortenmarkt", icon: "◇", max: 4, costs: [650, 1300, 2200, 3500], text: (level) => `${WK_STRAINS.filter((strain) => strain.tier <= level).length} Basissorten im Shop freigeschaltet.` },
    discount: { label: "Einkaufsrabatt", icon: "%", max: 4, costs: [450, 900, 1650, 2750], text: (level) => `${level * 3}% Rabatt auf Shop-Einkäufe.` },
    autoWater: { label: "Gießanlage", icon: "⌁", max: 3, costs: [1200, 2400, 4200], text: (level) => level ? `Gießt automatisch alle ${[0, 30, 20, 12][level]} Sekunden eine bereite Pflanze.` : "Automatisches Gießen ist noch nicht aktiv." },
    reservoir: { label: "Wasserrecycling", icon: "♒", max: 4, costs: [400, 800, 1400, 2300], text: (level) => `${level * 8}% Chance, dass ein Gießvorgang kein Wasser verbraucht.` },
    recovery: { label: "Regeneration", icon: "↟", max: 3, costs: [700, 1350, 2400], text: (level) => `Pause zwischen Schnitten: ${[45, 30, 20, 12][level]} Sekunden.` },
    quality: { label: "Markenqualität", icon: "★", max: 4, costs: [750, 1450, 2450, 3800], text: (level) => `Kunden bieten bis zu ${level * 3}% mehr pro Gramm.` },
    soilSaver: { label: "Erde aufbereiten", icon: "♻", max: 3, costs: [500, 1000, 1800], text: (level) => `${level * 12}% Chance, dass beim Pflanzen keine Erde verbraucht wird.` },
    storage: { label: "Kundenlounge", icon: "◫", max: 3, costs: [600, 1200, 2100], text: (level) => `${WK_BASE_CUSTOMERS + level} gleichzeitige Kundenanfragen möglich.` },
    security: { label: "Kundenbindung", icon: "⌛", max: 3, costs: [700, 1400, 2500], text: (level) => `Kunden warten ${level * 15} Sekunden länger auf ihre Bestellung.` },
    safety: { label: "Sicherheitsnetz", icon: "⬡", max: 5, costs: [600, 1200, 2100, 3400, 5200], text: (level) => `Gefahr steigt bei Verkäufen ${level ? `${level * 10}% langsamer` : "noch ungebremst"}; Kontrollen werden unwahrscheinlicher.` },
    packaging: { label: "Diskrete Verpackung", icon: "▣", max: 4, costs: [450, 950, 1700, 2800], text: (level) => `+${level * 2}% Kundenangebot und -${level * 4}% zusätzliche Gefahr pro Verkauf.` }
  };

  const WK_ELITE_UPGRADES = {
    eliteSlots: { label: "Master-Pflanzenplätze", icon: "▦+", max: 10, costs: [25000,40000,60000,85000,120000,165000,225000,300000,400000,550000], text: (level) => `${10 + level} von maximal ${WK_MAX_PLANTS} Pflanzenplätzen.` },
    eliteWatering: { label: "Turbo-Bewässerung", icon: "◒+", max: 3, costs: [60000,150000,350000], text: (level) => `${[5,4,3,2][level]} Sekunden Wartezeit.` },
    eliteYield: { label: "Master-Erntequalität", icon: "✦+", max: 5, costs: [50000,90000,160000,280000,450000], text: (level) => `Insgesamt +${25 + level * 5}% Ertrag.` },
    eliteCustomers: { label: "Premium-Kundennetzwerk", icon: "●+", max: 3, costs: [70000,160000,360000], text: (level) => `Neue Anfragen ungefähr alle ${[14,12,10,8][level]} Sekunden.` },
    eliteOrders: { label: "Mega-Bestellungen", icon: "▤+", max: 4, costs: [80000,180000,380000,750000], text: (level) => `Bis zu ${4 + level} Sorten pro Bestellung.` },
    eliteMarket: { label: "Master-Sortenmarkt", icon: "◇+", max: 4, costs: [90000,220000,480000,900000], text: (level) => `${12 + level * 3} von 24 Sorten freigeschaltet.` },
    eliteDiscount: { label: "Großhandelsrabatt", icon: "%+", max: 4, costs: [100000,250000,500000,950000], text: (level) => `Insgesamt ${12 + level * 3}% Einkaufsrabatt.` },
    eliteAutoWater: { label: "Industrie-Gießanlage", icon: "⌁+", max: 3, costs: [120000,300000,700000], text: (level) => `Automatik arbeitet alle ${[12,8,4,2][level]} Sekunden.` },
    eliteReservoir: { label: "Kreislauf-Wassertank", icon: "♒+", max: 4, costs: [80000,180000,350000,650000], text: (level) => `${32 + level * 8}% Chance auf kostenlosen Gießvorgang.` },
    eliteRecovery: { label: "Schnellregeneration", icon: "↟+", max: 3, costs: [80000,190000,420000], text: (level) => `Pause zwischen Schnitten: ${[12,8,6,4][level]} Sekunden.` },
    eliteQuality: { label: "Luxusmarke", icon: "★+", max: 4, costs: [110000,250000,520000,1000000], text: (level) => `Zusätzlich +${level * 3}% Kundenangebot.` },
    eliteSoilSaver: { label: "Vollständige Erdaufbereitung", icon: "♻+", max: 4, costs: [75000,160000,320000,600000], text: (level) => `${Math.min(100,36 + level * 16)}% Chance, keine Erde zu verbrauchen.` },
    eliteStorage: { label: "VIP-Kundenlounge", icon: "◫+", max: 7, costs: [60000,120000,220000,360000,550000,800000,1100000], text: (level) => `${7 + level} von maximal ${WK_MAX_CUSTOMERS} gleichzeitigen Anfragen.` },
    eliteSecurity: { label: "Premium-Kundenbindung", icon: "⌛+", max: 3, costs: [70000,160000,350000], text: (level) => `Kunden warten insgesamt ${45 + level * 5} Sekunden länger.` },
    eliteSafety: { label: "Master-Sicherheitsnetz", icon: "⬡+", max: 5, costs: [100000,220000,450000,800000,1200000], text: (level) => `Zusätzlich ${level * 5}% weniger Gefahr pro Verkauf.` },
    elitePackaging: { label: "Premium-Verpackung", icon: "▣+", max: 4, costs: [90000,200000,420000,850000], text: (level) => `Zusätzlich +${level * 2}% Angebot und -${level * 3}% Gefahr.` }
  };

  const WK_CUSTOMER_NAMES = [
    "Mika", "Nora", "Alex", "Sam", "Leonie", "Jamal", "Toni", "Mara", "Ben", "Lina",
    "Noah", "Kim", "Elias", "Zoe", "Tarek", "Jule", "Rico", "Nina", "Kian", "Fiona",
    "Viktor", "Alina", "Milan", "Sofia", "Dario", "Mia", "Levi", "Elif", "Jona", "Aylin"
  ];

  const wkRuntime = {
    overlay: null,
    view: "plants",
    modal: "",
    tickTimer: null,
    autosaveTimer: null,
    toastTimer: null,
    lastRenderedCustomerCount: -1
  };

  const wkEscape = (value) => typeof escapeHtml === "function"
    ? escapeHtml(value)
    : String(value ?? "").replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
  const wkEuro = (value) => `${Math.round(Number(value || 0)).toLocaleString("de-DE")} €`;
  const wkClamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
  const wkRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const wkId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const wkNow = () => Date.now();
  const wkStrain = (id) => WK_STRAINS.find((entry) => entry.id === id) || WK_STRAINS[0];

  function wkSlotIndex() {
    return Math.max(0, Math.min(3, Number(typeof selectedSlot !== "undefined" ? selectedSlot : typeof activeSlot !== "undefined" ? activeSlot : 0)));
  }

  function wkBackupKey() {
    return `${WK_BACKUP_PREFIX}:${wkSlotIndex()}`;
  }

  function wkDefaultState() {
    const now = wkNow();
    return {
      version: WK_VERSION,
      capital: 0,
      danger: 5,
      supplies: { pot: 0, soil: 0, water: 0 },
      seeds: { basic: 0 },
      inventory: {},
      plants: [],
      customers: [],
      upgrades: { slots: 0, watering: 0, yield: 0, customers: 0, orders: 1, market: 0, discount: 0, autoWater: 0, reservoir: 0, recovery: 0, quality: 0, soilSaver: 0, storage: 0, security: 0, safety: 0, packaging: 0 },
      eliteUpgrades: Object.fromEntries(Object.keys(WK_ELITE_UPGRADES).map((id) => [id, 0])),
      eliteUnlockedAtMs: 0,
      stats: { revenue: 0, gramsSold: 0, customersServed: 0, harvests: 0, waterings: 0, stageUps: 0, bestSale: 0, moneySpent: 0, deposits: 0, withdrawals: 0, raids: 0, dangerPaid: 0 },
      milestones: {},
      nextCustomerAt: now + 22000,
      nextAutoWaterAt: now + 30000,
      createdAtMs: now,
      updatedAtMs: now
    };
  }

  function wkNormalize(raw) {
    const base = wkDefaultState();
    const data = raw && typeof raw === "object" ? raw : {};
    const normalized = {
      ...base,
      ...data,
      supplies: { ...base.supplies, ...(data.supplies || {}) },
      seeds: { ...base.seeds, ...(data.seeds || {}) },
      inventory: { ...(data.inventory || {}) },
      upgrades: { ...base.upgrades, ...(data.upgrades || {}) },
      eliteUpgrades: { ...base.eliteUpgrades, ...(data.eliteUpgrades || {}) },
      stats: { ...base.stats, ...(data.stats || {}) },
      milestones: { ...base.milestones, ...(data.milestones || {}) },
      plants: Array.isArray(data.plants) ? data.plants.slice(0, WK_MAX_PLANTS) : [],
      customers: Array.isArray(data.customers) ? data.customers.slice(0, WK_MAX_CUSTOMERS) : []
    };
    const legacyCapital = data.capital !== undefined
      ? Number(data.capital || 0)
      : Math.max(0, Number(data.cash || 0) - 1000); // altes kostenloses Startgeld nicht übernehmen
    normalized.capital = Math.max(0, legacyCapital);
    normalized.danger = wkClamp(Number(data.danger ?? normalized.danger ?? 5), 0, 100);
    delete normalized.cash;
    ["pot", "soil", "water"].forEach((key) => normalized.supplies[key] = Math.max(0, Math.floor(Number(normalized.supplies[key] || 0))));
    WK_STRAINS.forEach((strain) => {
      normalized.seeds[strain.id] = Math.max(0, Math.floor(Number(normalized.seeds[strain.id] || 0)));
      normalized.inventory[strain.id] = Math.max(0, Math.floor(Number(normalized.inventory[strain.id] || 0)));
    });
    Object.entries(WK_UPGRADES).forEach(([id, upgrade]) => {
      normalized.upgrades[id] = Math.max(0, Math.min(upgrade.max, Math.floor(Number(normalized.upgrades[id] || 0))));
    });
    Object.entries(WK_ELITE_UPGRADES).forEach(([id, upgrade]) => {
      normalized.eliteUpgrades[id] = Math.max(0, Math.min(upgrade.max, Math.floor(Number(normalized.eliteUpgrades[id] || 0))));
    });
    normalized.eliteUnlockedAtMs = Math.max(0, Number(normalized.eliteUnlockedAtMs || 0));
    normalized.plants = normalized.plants.map((plant) => ({
      id: String(plant.id || wkId("plant")),
      strainId: wkStrain(plant.strainId).id,
      waterings: Math.max(0, Math.floor(Number(plant.waterings || 0))),
      thresholds: [...WK_STAGE_THRESHOLDS],
      trims: Math.max(0, Math.min(3, Math.floor(Number(plant.trims || 0)))),
      nextWaterAt: Math.max(0, Number(plant.nextWaterAt || 0)),
      nextTrimAt: Math.max(0, Number(plant.nextTrimAt || 0)),
      plantedAtMs: Math.max(0, Number(plant.plantedAtMs || wkNow()))
    }));
    normalized.customers = normalized.customers.map((customer) => ({
      id: String(customer.id || wkId("customer")),
      name: String(customer.name || "Kunde").slice(0, 30),
      lines: Array.isArray(customer.lines) ? customer.lines.slice(0, 8).map((line) => ({
        strainId: wkStrain(line.strainId).id,
        grams: Math.max(1, Math.floor(Number(line.grams || 1))),
        unitPrice: Math.max(1, Number(line.unitPrice || wkStrain(line.strainId).sellPrice))
      })) : [],
      expiresAtMs: Number(customer.expiresAtMs || wkNow() + 90000),
      createdAtMs: Math.max(0, Number(customer.createdAtMs || wkNow())),
      mood: String(customer.mood || "Direktanfrage"),
      vip: !!customer.vip
    })).filter((customer) => customer.lines.length);
    normalized.version = WK_VERSION;
    normalized.updatedAtMs = Math.max(0, Number(normalized.updatedAtMs || 0));
    normalized.nextCustomerAt = Number(normalized.nextCustomerAt || 0);
    normalized.nextAutoWaterAt = Number(normalized.nextAutoWaterAt || 0);
    if (!Number.isFinite(normalized.nextCustomerAt) || normalized.nextCustomerAt <= 0) normalized.nextCustomerAt = wkNow() + 22000;
    if (!Number.isFinite(normalized.nextAutoWaterAt) || normalized.nextAutoWaterAt <= 0) normalized.nextAutoWaterAt = wkNow() + 30000;
    return normalized;
  }

  function wkReadBackup() {
    try {
      const parsed = JSON.parse(localStorage.getItem(wkBackupKey()) || "null");
      return parsed ? wkNormalize(parsed) : null;
    } catch {
      return null;
    }
  }

  function wkState() {
    if (!state) return null;
    const saveState = wkNormalize(state.weedKL);
    const backup = wkReadBackup();
    const chosen = backup && Number(backup.updatedAtMs || 0) > Number(saveState.updatedAtMs || 0) ? backup : saveState;
    state.weedKL = chosen;
    state.weedKL.jkCoin ||= { galaxyGrowLights:0, premiumSupplyCrates:0 };
    state.weedKL.jkCoin.galaxyGrowLights=Math.max(0,Math.floor(Number(state.weedKL.jkCoin.galaxyGrowLights)||0));
    state.weedKL.jkCoin.premiumSupplyCrates=Math.max(0,Math.floor(Number(state.weedKL.jkCoin.premiumSupplyCrates)||0));
    return state.weedKL;
  }

  function wkPersist(forceSave = true) {
    const data = wkState();
    if (!data) return;
    data.version = WK_VERSION;
    data.updatedAtMs = wkNow();
    try { localStorage.setItem(wkBackupKey(), JSON.stringify(data)); } catch { /* save remains primary */ }
    if (forceSave && typeof save === "function") save();
  }

  function wkBaseUpgradeProgress(data = wkState()) {
    const entries = Object.entries(WK_UPGRADES);
    const completed = data ? entries.filter(([id, definition]) => Number(data.upgrades?.[id] || 0) >= definition.max).length : 0;
    return { completed, total: entries.length };
  }

  function wkBaseMilestoneProgress(data = wkState()) {
    const entries = WK_BASE_MILESTONES;
    const completed = data ? entries.filter((milestone) => !!data.milestones?.[milestone.id] || milestone.done(data)).length : 0;
    return { completed, total: entries.length };
  }

  function wkBaseProgressComplete(data = wkState()) {
    if (!data) return false;
    const upgrades = wkBaseUpgradeProgress(data);
    const milestones = wkBaseMilestoneProgress(data);
    return upgrades.completed >= upgrades.total && milestones.completed >= milestones.total;
  }

  function wkEliteUnlocked(data = wkState()) {
    if (!data) return false;
    if (Number(data.eliteUnlockedAtMs || 0) > 0) return true;
    if (!wkBaseProgressComplete(data)) return false;
    data.eliteUnlockedAtMs = wkNow();
    return true;
  }

  function wkMarketTier(data = wkState()) {
    const base = Math.max(0, Math.min(4, Number(data?.upgrades?.market || 0)));
    if (!wkEliteUnlocked(data)) return base;
    return Math.min(8, 4 + Number(data?.eliteUpgrades?.eliteMarket || 0));
  }

  function wkUnlockedSlots(data = wkState()) {
    const base = 3 + Number(data?.upgrades?.slots || 0);
    const elite = wkEliteUnlocked(data) ? Number(data?.eliteUpgrades?.eliteSlots || 0) : 0;
    return Math.min(WK_MAX_PLANTS, base + elite);
  }

  function wkWaterCooldownMs(data = wkState()) {
    const baseSeconds = Math.max(5, 15 - Number(data?.upgrades?.watering || 0) * 2);
    const elite = wkEliteUnlocked(data) ? Math.max(0, Math.min(3, Number(data?.eliteUpgrades?.eliteWatering || 0))) : 0;
    return (elite ? [5, 4, 3, 2][elite] : baseSeconds) * 1000;
  }

  function wkCustomerIntervalMs(data = wkState()) {
    const baseSeconds = Math.max(14, 36 - Number(data?.upgrades?.customers || 0) * 4);
    const elite = wkEliteUnlocked(data) ? Math.max(0, Math.min(3, Number(data?.eliteUpgrades?.eliteCustomers || 0))) : 0;
    return (elite ? [14, 12, 10, 8][elite] : baseSeconds) * 1000;
  }

  function wkMaxCustomers(data = wkState()) {
    const base = WK_BASE_CUSTOMERS + Number(data?.upgrades?.storage || 0);
    const elite = wkEliteUnlocked(data) ? Number(data?.eliteUpgrades?.eliteStorage || 0) : 0;
    return Math.min(WK_MAX_CUSTOMERS, base + elite);
  }

  function wkAutoWaterIntervalMs(data = wkState()) {
    const elite = wkEliteUnlocked(data) ? Math.max(0, Math.min(3, Number(data?.eliteUpgrades?.eliteAutoWater || 0))) : 0;
    if (elite) return [0, 8000, 4000, 2000][elite];
    return [0, 30000, 20000, 12000][Math.max(0, Math.min(3, Number(data?.upgrades?.autoWater || 0)))] || 0;
  }

  function wkTrimCooldownMs(data = wkState()) {
    const elite = wkEliteUnlocked(data) ? Math.max(0, Math.min(3, Number(data?.eliteUpgrades?.eliteRecovery || 0))) : 0;
    if (elite) return [0, 8000, 6000, 4000][elite];
    return [45000, 30000, 20000, 12000][Math.max(0, Math.min(3, Number(data?.upgrades?.recovery || 0)))];
  }

  function wkWaterSaveChance(data = wkState()) {
    const base = Math.min(.32, Number(data?.upgrades?.reservoir || 0) * .08);
    const elite = wkEliteUnlocked(data) ? Number(data?.eliteUpgrades?.eliteReservoir || 0) * .08 : 0;
    return Math.min(.64, base + elite);
  }

  function wkWaterConsumesUnit(data = wkState()) {
    return Math.random() >= wkWaterSaveChance(data);
  }

  function wkMaxOrderLines(data = wkState()) {
    const base = Math.min(4, 1 + Number(data?.upgrades?.orders || 0));
    const elite = wkEliteUnlocked(data) ? Number(data?.eliteUpgrades?.eliteOrders || 0) : 0;
    return Math.min(8, base + elite);
  }

  function wkDiscount(data = wkState()) {
    const base = Math.min(.12, Number(data?.upgrades?.discount || 0) * .03);
    const elite = wkEliteUnlocked(data) ? Number(data?.eliteUpgrades?.eliteDiscount || 0) * .03 : 0;
    return Math.min(.24, base + elite);
  }

  function wkYieldBonus(data = wkState()) {
    const base = Number(data?.upgrades?.yield || 0) * .05;
    const elite = wkEliteUnlocked(data) ? Number(data?.eliteUpgrades?.eliteYield || 0) * .05 : 0;
    return Math.min(.50, base + elite);
  }

  function wkQualityBonus(data = wkState()) {
    const base = Number(data?.upgrades?.quality || 0) * .03 + Number(data?.upgrades?.packaging || 0) * .02;
    const elite = wkEliteUnlocked(data)
      ? Number(data?.eliteUpgrades?.eliteQuality || 0) * .03 + Number(data?.eliteUpgrades?.elitePackaging || 0) * .02
      : 0;
    return base + elite;
  }

  function wkSoilSaveChance(data = wkState()) {
    const base = Math.min(.36, Number(data?.upgrades?.soilSaver || 0) * .12);
    const elite = wkEliteUnlocked(data) ? Number(data?.eliteUpgrades?.eliteSoilSaver || 0) * .16 : 0;
    return Math.min(1, base + elite);
  }

  function wkCustomerExtraWaitSeconds(data = wkState()) {
    const base = Number(data?.upgrades?.security || 0) * 15;
    const elite = wkEliteUnlocked(data) ? Number(data?.eliteUpgrades?.eliteSecurity || 0) * 5 : 0;
    return Math.min(60, base + elite);
  }

  function wkPlayerCash() {
    return Math.max(0, Number(state?.cash || 0));
  }

  function wkCapital(data = wkState()) {
    return Math.max(0, Number(data?.capital || 0));
  }

  function wkDeposit(amount) {
    const data = wkState();
    const requested = amount === "max" ? Math.floor(wkPlayerCash()) : Math.max(0, Math.floor(Number(amount || 0)));
    if (!data || requested < 1) return wkToast("Wähle einen Einzahlungsbetrag.");
    if (wkPlayerCash() < requested) return wkToast("Du hast nicht genug Bargeld. Geld auf dem Konto muss zuerst abgehoben werden.");
    state.cash -= requested;
    data.capital = wkCapital(data) + requested;
    data.stats.deposits = Number(data.stats.deposits || 0) + requested;
    wkPersist();
    wkRender();
    wkToast(`${wkEuro(requested)} Bargeld als Betriebskapital eingezahlt.`);
  }

  function wkWithdraw(amount) {
    const data = wkState();
    const requested = amount === "max" ? Math.floor(wkCapital(data)) : Math.max(0, Math.floor(Number(amount || 0)));
    if (!data || requested < 1) return wkToast("Wähle einen Auszahlungsbetrag.");
    if (wkCapital(data) < requested) return wkToast("So viel Betriebskapital ist nicht vorhanden.");
    data.capital -= requested;
    state.cash = wkPlayerCash() + requested;
    data.stats.withdrawals = Number(data.stats.withdrawals || 0) + requested;
    wkPersist();
    wkRender();
    wkToast(`${wkEuro(requested)} aus dem Betrieb zurück ins Bargeld gelegt.`);
  }

  function wkSpendCapital(amount, label = "Ausgabe", data = wkState()) {
    const cost = Math.max(0, Math.round(Number(amount || 0)));
    if (!data || wkCapital(data) < cost) {
      wkToast(`Nicht genug Betriebskapital für ${label}. Zahle zuerst Bargeld ein.`);
      return false;
    }
    data.capital -= cost;
    data.stats.moneySpent = Number(data.stats.moneySpent || 0) + cost;
    return true;
  }

  function wkDangerLabel(value = wkState()?.danger || 0) {
    const danger = Number(value || 0);
    if (danger < 20) return "Unauffällig";
    if (danger < 45) return "Beobachtet";
    if (danger < 70) return "Riskant";
    if (danger < 90) return "Kritisch";
    return "Razzia droht";
  }

  function wkDangerGain(total, grams, data = wkState()) {
    const safetyReduction = Number(data?.upgrades?.safety || 0) * .10 + (wkEliteUnlocked(data) ? Number(data?.eliteUpgrades?.eliteSafety || 0) * .05 : 0);
    const packagingReduction = Number(data?.upgrades?.packaging || 0) * .04 + (wkEliteUnlocked(data) ? Number(data?.eliteUpgrades?.elitePackaging || 0) * .03 : 0);
    const raw = Math.max(1, Math.round(Number(grams || 0) / 7 + Number(total || 0) / 550));
    return Math.max(1, Math.round(raw * Math.max(.15, 1 - safetyReduction) * Math.max(.20, 1 - packagingReduction)));
  }

  function wkRunDangerCheck(data = wkState()) {
    if (!data || Number(data.danger || 0) < 65) return false;
    const safety = Number(data.upgrades?.safety || 0) + (wkEliteUnlocked(data) ? Number(data.eliteUpgrades?.eliteSafety || 0) * .6 : 0);
    const chance = Math.min(.42, Math.max(.02, (Number(data.danger || 0) - 58) / 100 * Math.max(.35, 1 - safety * .08)));
    if (Math.random() >= chance) return false;
    const confiscated = {};
    WK_STRAINS.forEach((strain) => {
      const owned = Number(data.inventory[strain.id] || 0);
      const lost = Math.min(owned, Math.floor(owned * (0.15 + Math.random() * .20)));
      if (lost > 0) {
        data.inventory[strain.id] -= lost;
        confiscated[strain.id] = lost;
      }
    });
    const fine = Math.min(wkCapital(data), Math.max(100, Math.round(wkCapital(data) * (.12 + Math.random() * .13))));
    data.capital -= fine;
    data.danger = Math.max(10, Number(data.danger || 0) - wkRandomInt(28, 42));
    data.stats.raids = Number(data.stats.raids || 0) + 1;
    const grams = Object.values(confiscated).reduce((sum, value) => sum + value, 0);
    wkToast(`Kontrolle: ${grams} g beschlagnahmt, ${wkEuro(fine)} Kosten. Gefahr fällt auf ${Math.round(data.danger)}%.`);
    return true;
  }

  function wkReduceDanger(percent, cost) {
    const data = wkState();
    const reduction = Math.max(1, Math.floor(Number(percent || 0)));
    if (!data) return;
    if (!wkSpendCapital(cost, "Gefahr senken", data)) return;
    const before = Number(data.danger || 0);
    data.danger = Math.max(0, before - reduction);
    data.stats.dangerPaid = Number(data.stats.dangerPaid || 0) + Number(cost || 0);
    wkPersist();
    wkRender();
    wkToast(`Kontakte bezahlt: Gefahr ${Math.round(before)}% → ${Math.round(data.danger)}%.`);
  }

  function wkBusinessLevel(data = wkState()) {
    return Math.max(1, Math.min(20, 1 + Math.floor(Number(data?.stats?.revenue || 0) / 1500)));
  }

  function wkInventoryGrams(data = wkState()) {
    return WK_STRAINS.reduce((sum, strain) => sum + Number(data?.inventory?.[strain.id] || 0), 0);
  }

  function wkPlantStage(plant) {
    const waterings = Number(plant.waterings || 0);
    if (waterings >= Number(plant.thresholds[3])) return 5;
    if (waterings >= Number(plant.thresholds[2])) return 4;
    if (waterings >= Number(plant.thresholds[1])) return 3;
    if (waterings >= Number(plant.thresholds[0])) return 2;
    return 1;
  }

  function wkPlantMature(plant) {
    return Number(plant?.waterings || 0) >= Number(plant?.thresholds?.[4] || WK_STAGE_THRESHOLDS[4]);
  }

  function wkStageLabel(stage, plant = null) {
    if (stage === 5) return wkPlantMature(plant) ? "Ausgewachsen" : "Blütephase";
    return ["", "Eingepflanzt", "Keimling", "Jungpflanze", "Große Pflanze"][stage] || "Pflanze";
  }

  function wkNextThreshold(plant) {
    const stage = wkPlantStage(plant);
    if (wkPlantMature(plant)) return Number(plant.thresholds[4]);
    return Number(plant.thresholds[Math.min(4, stage - 1)]);
  }

  function wkFormatTimer(ms) {
    const seconds = Math.max(0, Math.ceil(Number(ms || 0) / 1000));
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return minutes ? `${minutes}:${String(rest).padStart(2, "0")}` : `${rest}s`;
  }

  function wkCanPlant(data = wkState()) {
    const soilReady = data && (data.supplies.soil > 0 || wkSoilSaveChance(data) >= 1);
    return !!data && data.plants.length < wkUnlockedSlots(data) && data.supplies.pot > 0 && soilReady
      && WK_STRAINS.some((strain) => Number(data.seeds[strain.id] || 0) > 0);
  }

  function wkCreatePlant(strainId) {
    const data = wkState();
    const strain = wkStrain(strainId);
    if (!data || data.plants.length >= wkUnlockedSlots(data)) return wkToast("Alle freigeschalteten Pflanzenplätze sind belegt.");
    if (Number(data.seeds[strain.id] || 0) < 1) return wkToast("Von dieser Sorte ist kein Samen im Inventar.");
    if (data.supplies.pot < 1 || (data.supplies.soil < 1 && wkSoilSaveChance(data) < 1)) return wkToast("Du brauchst einen Topf und eine Einheit Erde.");
    data.seeds[strain.id] -= 1;
    data.supplies.pot -= 1;
    const soilSaved = wkSoilSaveChance(data) >= 1 || Math.random() < wkSoilSaveChance(data);
    if (!soilSaved) data.supplies.soil -= 1;
    data.plants.push({
      id: wkId("plant"), strainId: strain.id, waterings: 0,
      thresholds: [...WK_STAGE_THRESHOLDS], trims: 0,
      nextWaterAt: 0, nextTrimAt: 0, plantedAtMs: wkNow()
    });
    wkRuntime.modal = "";
    wkPersist();
    wkRender();
    wkToast(`${strain.name} wurde eingepflanzt.${soilSaved ? " Aufbereitete Erde wurde wiederverwendet." : ""}`);
    wkAnimatePlant("planted");
  }

  function wkWaterPlant(plantId) {
    const data = wkState();
    const plant = data?.plants.find((entry) => entry.id === plantId);
    if (!plant) return;
    if (wkPlantMature(plant)) return wkToast("Diese Pflanze ist vollständig ausgewachsen und kann geschnitten werden.");
    if (wkNow() < Number(plant.nextWaterAt || 0)) return wkToast("Die Pflanze kann noch nicht wieder gegossen werden.");
    if (data.supplies.water < 1) return wkToast("Das Wasser ist leer. Kaufe Nachschub im Shop.");
    const oldStage = wkPlantStage(plant);
    const wasMature = wkPlantMature(plant);
    if (wkWaterConsumesUnit(data)) data.supplies.water -= 1;
    plant.waterings += 1;
    plant.nextWaterAt = wkNow() + wkWaterCooldownMs(data);
    data.stats.waterings += 1;
    const newStage = wkPlantStage(plant);
    const becameMature = !wasMature && wkPlantMature(plant);
    if (newStage > oldStage || becameMature) data.stats.stageUps = Number(data.stats.stageUps || 0) + 1;
    wkPersist();
    wkRender();
    wkAnimatePlant(newStage > oldStage || becameMature ? "stage-up" : "water", plant.id);
    wkToast(becameMature ? `${wkStrain(plant.strainId).name} ist vollständig ausgewachsen.` : newStage > oldStage ? `${wkStrain(plant.strainId).name} erreicht Stufe ${newStage}.` : "Pflanze gegossen.");
  }

  function wkWaterAll() {
    const data = wkState();
    if (!data) return;
    const ready = data.plants.filter((plant) => !wkPlantMature(plant) && wkNow() >= Number(plant.nextWaterAt || 0));
    if (!ready.length) return wkToast("Aktuell ist keine Pflanze bereit.");
    if (data.supplies.water < 1) return wkToast("Das Wasser ist leer.");
    let amount = 0;
    let usedWater = 0;
    let stageUps = 0;
    for (const plant of ready) {
      const consumes = wkWaterConsumesUnit(data);
      if (consumes && data.supplies.water - usedWater < 1) break;
      const before = wkPlantStage(plant);
      const matureBefore = wkPlantMature(plant);
      plant.waterings += 1;
      plant.nextWaterAt = wkNow() + wkWaterCooldownMs(data);
      amount += 1;
      if (consumes) usedWater += 1;
      if (wkPlantStage(plant) > before || (!matureBefore && wkPlantMature(plant))) stageUps += 1;
    }
    data.supplies.water -= usedWater;
    data.stats.waterings += amount;
    data.stats.stageUps = Number(data.stats.stageUps || 0) + stageUps;
    wkPersist();
    wkRender();
    wkAnimatePlant(stageUps ? "stage-up" : "water");
    wkToast(`${amount} Pflanze${amount === 1 ? "" : "n"} gegossen · ${usedWater} Wasser verbraucht${stageUps ? ` · ${stageUps} Stufenaufstieg` : ""}.`);
  }

  function wkTrimPlant(plantId) {
    const data = wkState();
    const plant = data?.plants.find((entry) => entry.id === plantId);
    if (!plant || !wkPlantMature(plant)) return wkToast("Die Pflanze ist noch nicht vollständig ausgewachsen.");
    if (wkNow() < Number(plant.nextTrimAt || 0)) return wkToast("Die Pflanze regeneriert sich noch.");
    const ranges = [[12, 18], [12, 24], [20, 30]];
    const trimIndex = Math.min(2, Number(plant.trims || 0));
    const baseYield = wkRandomInt(ranges[trimIndex][0], ranges[trimIndex][1]);
    const multiplier = 1 + wkYieldBonus(data);
    const grams = Math.max(1, Math.round(baseYield * multiplier));
    data.inventory[plant.strainId] = Number(data.inventory[plant.strainId] || 0) + grams;
    data.stats.harvests += 1;
    plant.trims += 1;
    const strain = wkStrain(plant.strainId);
    if (plant.trims >= 3) {
      data.plants = data.plants.filter((entry) => entry.id !== plant.id);
      data.supplies.pot += 1;
      wkToast(`${grams} g ${strain.name} geerntet. Die Pflanze ist verbraucht; der Topf ist wieder frei.`);
    } else {
      plant.nextTrimAt = wkNow() + wkTrimCooldownMs(data);
      wkToast(`${grams} g ${strain.name} geerntet. Noch ${3 - plant.trims} Schnitt${3 - plant.trims === 1 ? "" : "e"}.`);
    }
    wkPersist();
    wkRender();
    wkAnimatePlant("harvest", plantId);
  }

  function wkShopPrice(basePrice, data = wkState()) {
    return Math.max(1, Math.round(Number(basePrice || 0) * (1 - wkDiscount(data))));
  }

  function wkBuySupply(id, amount, basePrice) {
    const data = wkState();
    const price = wkShopPrice(basePrice, data);
    if (!data || !wkSpendCapital(price, "Materialkauf", data)) return;
    data.supplies[id] = Number(data.supplies[id] || 0) + Number(amount || 1);
    wkPersist();
    wkRender();
    wkToast(`Einkauf abgeschlossen: ${wkEuro(price)} aus dem Betriebskapital.`);
  }

  function wkBuyStarterSet() {
    const data = wkState();
    const price = wkShopPrice(75, data);
    if (!data || !wkSpendCapital(price, "Starter-Set", data)) return;
    data.supplies.pot += 1;
    data.supplies.soil += 1;
    data.supplies.water += 50;
    data.seeds.basic = Number(data.seeds.basic || 0) + 2;
    wkPersist();
    wkRender();
    wkToast(`Starter-Set gekauft: Topf, Erde, 50 Wasser und 2 Basic-Samen.`);
  }

  function wkBuySeed(strainId) {
    const data = wkState();
    const strain = wkStrain(strainId);
    if (!data || strain.tier > wkMarketTier(data)) return wkToast("Diese Sorte ist noch nicht freigeschaltet.");
    const price = wkShopPrice(strain.seedPrice, data);
    if (!wkSpendCapital(price, "Samenkauf", data)) return;
    data.seeds[strain.id] = Number(data.seeds[strain.id] || 0) + 1;
    wkPersist();
    wkRender();
    wkToast(`${strain.name}: 1 Samen gekauft.`);
  }

  function wkUpgrade(id) {
    const data = wkState();
    const elite = Object.prototype.hasOwnProperty.call(WK_ELITE_UPGRADES, id);
    const definition = elite ? WK_ELITE_UPGRADES[id] : WK_UPGRADES[id];
    if (!data || !definition) return;
    if (elite && !wkEliteUnlocked(data)) return wkToast("Der Master-Ausbau wird erst nach allen Basis-Upgrades und Basis-Meilensteinen freigeschaltet.");
    const source = elite ? data.eliteUpgrades : data.upgrades;
    const level = Number(source[id] || 0);
    if (level >= definition.max) return wkToast("Diese Verbesserung ist bereits maximal.");
    const cost = definition.costs[level];
    if (!wkSpendCapital(cost, definition.label, data)) return;
    source[id] = level + 1;
    const justUnlocked = !elite && !Number(data.eliteUnlockedAtMs || 0) && wkBaseProgressComplete(data);
    if (justUnlocked) data.eliteUnlockedAtMs = wkNow();
    wkPersist();
    wkRender();
    wkToast(justUnlocked ? "Master-Ausbau und Master-Aufgaben wurden freigeschaltet." : `${definition.label} auf Stufe ${level + 1} verbessert.`);
  }

  function wkRandomCustomer(data = wkState()) {
    const unlocked = WK_STRAINS.filter((strain) => strain.tier <= wkMarketTier(data));
    const maxLines = Math.min(wkMaxOrderLines(data), unlocked.length);
    const master = wkEliteUnlocked(data);
    const vip = master && Math.random() < .32;
    const thousandOrdersUnlocked = Number(data?.stats?.customersServed || 0) >= 300;
    const thousandOrder = !vip && thousandOrdersUnlocked && Math.random() < .38;
    const minimumLines = vip
      ? Math.max(3, Math.min(maxLines, maxLines - 2))
      : thousandOrder
        ? Math.min(Math.max(2, maxLines - 1), maxLines)
        : 1;
    const lineCount = wkRandomInt(minimumLines, Math.max(minimumLines, maxLines));
    const shuffled = [...unlocked].sort(() => Math.random() - .5).slice(0, lineCount);
    const demandBoost = 1 + Math.min(.65, wkBusinessLevel(data) * .018);
    const qualityBonus = 1 + wkQualityBonus(data);
    const lines = shuffled.map((strain) => {
      const grams = vip
        ? wkRandomInt(12, Math.max(20, Math.round(32 * demandBoost)))
        : thousandOrder
          ? wkRandomInt(8, Math.max(14, Math.round(20 * demandBoost)))
          : wkRandomInt(2, Math.max(4, Math.round(8 * demandBoost)));
      const priceFactor = vip ? .98 + Math.random() * .34 : .92 + Math.random() * .28;
      const unitPrice = Math.max(1, Math.round(strain.sellPrice * priceFactor * qualityBonus));
      return { strainId: strain.id, grams, unitPrice };
    });
    if ((vip || thousandOrder) && lines.length) {
      const target = vip ? wkRandomInt(3000, 8000) : wkRandomInt(1000, 2400);
      const current = lines.reduce((sum, line) => sum + line.grams * line.unitPrice, 0);
      if (current < target) lines[0].grams += Math.ceil((target - current) / Math.max(1, lines[0].unitPrice));
    }
    const moods = vip
      ? ["VIP-Großkunde", "Event-Bestellung", "Premium-Abnahme", "Großhandel", "Exklusivkunde"]
      : thousandOrder
        ? ["1.000-€-Bestellung", "Großauftrag", "Stammkunden-Paket", "Wochenbestellung", "Premium-Anfrage"]
        : ["Direktanfrage", "Stammkunde", "Schnellkauf", "Qualitätskunde", "Großanfrage"];
    return {
      id: wkId("customer"),
      name: WK_CUSTOMER_NAMES[wkRandomInt(0, WK_CUSTOMER_NAMES.length - 1)],
      lines,
      expiresAtMs: wkNow() + (wkRandomInt(vip ? 105 : thousandOrder ? 90 : 75, vip ? 165 : thousandOrder ? 145 : 125) + wkCustomerExtraWaitSeconds(data)) * 1000,
      createdAtMs: wkNow(),
      mood: moods[wkRandomInt(0, moods.length - 1)],
      vip,
      thousandOrder
    };
  }

  function wkCustomerTotal(customer) {
    return customer.lines.reduce((sum, line) => sum + Number(line.grams || 0) * Number(line.unitPrice || 0), 0);
  }

  function wkCanServe(customer, data = wkState()) {
    return customer.lines.every((line) => Number(data?.inventory?.[line.strainId] || 0) >= Number(line.grams || 0));
  }

  function wkServeCustomer(customerId) {
    const data = wkState();
    const customer = data?.customers.find((entry) => entry.id === customerId);
    if (!customer) return;
    if (!wkCanServe(customer, data)) return wkToast("Für diese Anfrage fehlt Ware im Inventar.");
    let gramsSold = 0;
    customer.lines.forEach((line) => {
      data.inventory[line.strainId] -= line.grams;
      data.stats.gramsSold += line.grams;
      gramsSold += Number(line.grams || 0);
    });
    const total = wkCustomerTotal(customer);
    data.capital = wkCapital(data) + total;
    data.stats.revenue += total;
    data.stats.customersServed += 1;
    data.stats.bestSale = Math.max(Number(data.stats.bestSale || 0), total);
    data.customers = data.customers.filter((entry) => entry.id !== customerId);
    const dangerGain = wkDangerGain(total, gramsSold, data);
    data.danger = wkClamp(Number(data.danger || 0) + dangerGain, 0, 100);
    const raid = wkRunDangerCheck(data);
    wkPersist();
    wkRender();
    if (!raid) wkToast(`${customer.name}: ${wkEuro(total)} Betriebskapital · Gefahr +${dangerGain}%`);
  }

  function wkRejectCustomer(customerId) {
    const data = wkState();
    if (!data) return;
    data.customers = data.customers.filter((entry) => entry.id !== customerId);
    wkPersist();
    wkRender();
    wkToast("Anfrage abgelehnt.");
  }

  function wkProcessTime() {
    const data = wkState();
    if (!data) return false;
    const now = wkNow();
    const previousCount = data.customers.length;
    const eliteBefore = Number(data.eliteUnlockedAtMs || 0);
    if (wkBaseProgressComplete(data) && !data.eliteUnlockedAtMs) data.eliteUnlockedAtMs = now;
    data.customers = data.customers.filter((customer) => Number(customer.expiresAtMs || 0) > now);
    let guard = 0;
    const maxCustomers = wkMaxCustomers(data);
    while (now >= Number(data.nextCustomerAt || 0) && data.customers.length < maxCustomers && guard < 16) {
      data.customers.push(wkRandomCustomer(data));
      data.nextCustomerAt = Number(data.nextCustomerAt || now) + wkCustomerIntervalMs(data);
      guard += 1;
    }
    if (data.customers.length >= maxCustomers && now >= data.nextCustomerAt) data.nextCustomerAt = now + wkCustomerIntervalMs(data);

    let autoWatered = 0;
    const autoInterval = wkAutoWaterIntervalMs(data);
    if (autoInterval && now >= Number(data.nextAutoWaterAt || 0)) {
      const eliteAutomation = wkEliteUnlocked(data) ? Number(data.eliteUpgrades?.eliteAutoWater || 0) : 0;
      const batchSize = eliteAutomation >= 3 ? 3 : eliteAutomation >= 2 ? 2 : 1;
      const ready = data.plants.filter((plant) => !wkPlantMature(plant) && now >= Number(plant.nextWaterAt || 0)).slice(0, batchSize);
      for (const plant of ready) {
        if (data.supplies.water < 1 && wkWaterSaveChance(data) < 1) break;
        const before = wkPlantStage(plant);
        const matureBefore = wkPlantMature(plant);
        if (wkWaterConsumesUnit(data)) {
          if (data.supplies.water < 1) break;
          data.supplies.water -= 1;
        }
        plant.waterings += 1;
        plant.nextWaterAt = now + wkWaterCooldownMs(data);
        data.stats.waterings += 1;
        if (wkPlantStage(plant) > before || (!matureBefore && wkPlantMature(plant))) data.stats.stageUps = Number(data.stats.stageUps || 0) + 1;
        autoWatered += 1;
      }
      data.nextAutoWaterAt = now + autoInterval;
    }
    const changed = previousCount !== data.customers.length || guard > 0 || autoWatered > 0 || (!eliteBefore && data.eliteUnlockedAtMs);
    if (changed) wkPersist(false);
    return changed;
  }

  function wkPlantVisual(stage) {
    return `<div class="wk-plant-visual stage-${stage}" aria-label="Pflanzenstufe ${stage}">
      <span class="stem"></span><i class="leaf l1"></i><i class="leaf l2"></i><i class="leaf l3"></i><i class="leaf l4"></i><b>🌿</b>
    </div>`;
  }

  function wkAnimatePlant(kind = "water", plantId = "") {
    requestAnimationFrame(() => {
      const overlay = wkRuntime.overlay;
      if (!overlay) return;
      const card = plantId ? overlay.querySelector(`[data-wk-plant-card="${plantId}"]`) : overlay.querySelector(".wk-plant-card");
      if (card) {
        card.classList.remove("wk-anim-water", "wk-anim-stage-up", "wk-anim-harvest", "wk-anim-planted");
        void card.offsetWidth;
        card.classList.add(`wk-anim-${kind}`);
        setTimeout(() => card.classList.remove(`wk-anim-${kind}`), 1100);
      }
      const burst = document.createElement("div");
      burst.className = `wk-fx-burst ${kind}`;
      burst.innerHTML = Array.from({ length: 8 }, (_, index) => `<i style="--i:${index}"></i>`).join("");
      (card || overlay.querySelector(".wk-main"))?.appendChild(burst);
      setTimeout(() => burst.remove(), 1100);
    });
  }

  function wkHeaderHtml(data) {
    return `<header class="wk-header">
      <button class="wk-icon-button" data-wk-close aria-label="Schließen">×</button>
      <div class="wk-title"><small>BUSINESS-APP · ILLEGALES BUSINESS</small><h1>Weed Business</h1></div>
      <div class="wk-header-stats"><span><small>Betriebskapital</small><b>${wkEuro(wkCapital(data))}</b></span><span><small>Bargeld</small><b>${wkEuro(wkPlayerCash())}</b></span><span class="danger"><small>Gefahr</small><b>${Math.round(data.danger || 0)}%</b></span></div>
    </header>`;
  }

  function wkNavHtml(data) {
    const items = [
      ["plants", "🌱", "Pflanzen"], ["inventory", "▤", "Inventar"], ["customers", "●", "Kunden"],
      ["shop", "▣", "Shop"], ["upgrades", "↑", "Upgrades"]
    ];
    return `<nav class="wk-nav">${items.map(([id, icon, label]) => `<button class="${wkRuntime.view === id ? "active" : ""}" data-wk-view="${id}"><span>${icon}</span><b>${label}</b>${id === "customers" && data.customers.length ? `<i>${data.customers.length}</i>` : ""}</button>`).join("")}</nav>`;
  }

  function wkSummaryHtml(data) {
    const danger = Math.round(Number(data.danger || 0));
    return `<section class="wk-business-capital">
      <div class="wk-capital-copy"><small>BETRIEBSKAPITAL AUS DEINEM BARGELD</small><strong>${wkEuro(wkCapital(data))}</strong><p>Verfügbares Bargeld: <b>${wkEuro(wkPlayerCash())}</b>. Konto-Geld muss zuerst in der Bank-App abgehoben werden.</p></div>
      <div class="wk-capital-actions"><button data-wk-deposit="100">+100 €</button><button data-wk-deposit="500">+500 €</button><button data-wk-deposit="max">Alles einzahlen</button><button data-wk-withdraw="max">Alles auszahlen</button></div>
    </section>
    <section class="wk-danger-panel ${danger >= 70 ? "critical" : ""}">
      <div><small>GEFAHR · ${wkDangerLabel(danger)}</small><strong>${danger}%</strong><p>Gefahr steigt nur durch Verkäufe. Sie sinkt nicht automatisch. Bezahle Kontakte, bevor eine Kontrolle dein Lager trifft.</p></div>
      <div class="wk-danger-meter"><i style="width:${danger}%"></i></div>
      <div class="wk-danger-actions"><button data-wk-danger="10" data-wk-danger-cost="250">-10% · 250 €</button><button data-wk-danger="25" data-wk-danger-cost="700">-25% · 700 €</button><button data-wk-danger="50" data-wk-danger-cost="1400">-50% · 1.400 €</button></div>
    </section>
    <section class="wk-summary-grid">
      <article><small>Pflanzen</small><strong>${data.plants.length}/${wkUnlockedSlots(data)}</strong><span>maximal ${WK_MAX_PLANTS}</span></article>
      <article><small>Gesamtbestand</small><strong>${wkInventoryGrams(data)} g</strong><span>${Object.values(data.inventory).filter((value) => value > 0).length} Sorten</span></article>
      <article><small>Kunden</small><strong>${data.customers.length}/${wkMaxCustomers(data)}</strong><span>Nächste in <b data-wk-next-customer>${wkFormatTimer(data.nextCustomerAt - wkNow())}</b></span></article>
      <article><small>Umsatz</small><strong>${wkEuro(data.stats.revenue)}</strong><span>${data.stats.customersServed} Verkäufe</span></article>
    </section>`;
  }

  function wkPlantCardHtml(plant, data) {
    const strain = wkStrain(plant.strainId);
    const stage = wkPlantStage(plant);
    const mature = wkPlantMature(plant);
    const target = wkNextThreshold(plant);
    const previous = stage <= 1 ? 0 : Number(plant.thresholds[stage - 2] || 0);
    const segmentTotal = Math.max(1, target - previous);
    const segmentDone = Math.max(0, Number(plant.waterings || 0) - previous);
    const progress = mature ? 100 : Math.min(100, Math.round((segmentDone / segmentTotal) * 100));
    const waterReady = wkNow() >= Number(plant.nextWaterAt || 0);
    const trimReady = wkNow() >= Number(plant.nextTrimAt || 0);
    const remaining = Math.max(0, target - Number(plant.waterings || 0));
    return `<article class="wk-plant-card ${mature ? "mature" : "growing"}" data-wk-plant-card="${plant.id}" style="--wk-accent:${strain.accent}">
      <div class="wk-plant-top"><div><small>${strain.rarity}</small><h3>${wkEscape(strain.name)}</h3></div><span>Stufe ${stage}/5</span></div>
      ${wkPlantVisual(stage)}
      <div class="wk-stage-line"><b>${wkStageLabel(stage, plant)}</b><small>${mature ? `${plant.trims}/3 Schnitte` : `Noch ${remaining}× gießen · ${plant.waterings}/${target}`}</small></div>
      <div class="wk-progress"><i style="width:${progress}%"></i></div>
      <div class="wk-plant-actions">
        ${!mature ? `<button class="primary" data-wk-water="${plant.id}" ${waterReady && data.supplies.water > 0 ? "" : "disabled"}>${waterReady ? "Gießen" : `<span data-wk-water-timer="${plant.id}">${wkFormatTimer(plant.nextWaterAt - wkNow())}</span>`}</button>` : `<button class="harvest" data-wk-trim="${plant.id}" ${trimReady ? "" : "disabled"}>${trimReady ? `Schneiden ${plant.trims + 1}/3` : `<span data-wk-trim-timer="${plant.id}">${wkFormatTimer(plant.nextTrimAt - wkNow())}</span>`}</button>`}
        <span>Wasser ${data.supplies.water}</span>
      </div>
    </article>`;
  }

  function wkPlantsHtml(data) {
    return `<div class="wk-page wk-plants-page">
      ${wkSummaryHtml(data)}
      <section class="wk-page-head"><div><small>GROW ROOM</small><h2>Deine Pflanzen</h2><p>Jede Pflanze besitzt fünf Stufen und kann nach dem Auswachsen dreimal geschnitten werden.</p></div><div class="wk-page-actions"><button data-wk-water-all>Alle bereit gießen</button><button class="primary" data-wk-open-plant ${wkCanPlant(data) ? "" : "disabled"}>Neue Pflanze</button></div></section>
      <div class="wk-plant-grid">${data.plants.length ? data.plants.map((plant) => wkPlantCardHtml(plant, data)).join("") : `<div class="wk-empty"><span>🌱</span><h3>Noch keine Pflanze</h3><p>Du besitzt bereits Startmaterial. Lege deine erste Sorte in einen Topf.</p><button class="primary" data-wk-open-plant>Erste Pflanze setzen</button></div>`}</div>
    </div>`;
  }

  function wkBusinessStatsHtml(data) {
    return `<section class="wk-business-stats wk-business-stats-top"><header><div><small>GESCHÄFTSSTATISTIK</small><h3>Leistung deines Betriebs</h3></div><span>${wkEliteUnlocked(data) ? "Master-Ausbau aktiv" : "Basis-Ausbau"}</span></header><div><span><small>Umsatz</small><b>${wkEuro(data.stats.revenue)}</b></span><span><small>Verkauft</small><b>${data.stats.gramsSold} g</b></span><span><small>Kunden</small><b>${data.stats.customersServed}</b></span><span><small>Ernten</small><b>${data.stats.harvests}</b></span><span><small>Beste Bestellung</small><b>${wkEuro(data.stats.bestSale)}</b></span><span><small>Investiert</small><b>${wkEuro(data.stats.moneySpent)}</b></span><span><small>Kontrollen</small><b>${Number(data.stats.raids || 0)}</b></span><span><small>Gefahr bezahlt</small><b>${wkEuro(data.stats.dangerPaid || 0)}</b></span></div></section>`;
  }

  function wkInventoryHtml(data) {
    return `<div class="wk-page">
      ${wkBusinessStatsHtml(data)}
      ${wkSummaryHtml(data)}
      <section class="wk-page-head"><div><small>LAGER</small><h2>Inventar</h2><p>Samen, Verbrauchsmaterial und geerntete Ware bleiben im Weed Business getrennt vom übrigen Inventar.</p></div></section>
      <div class="wk-supply-grid">
        <article><span>◉</span><div><small>Freie Töpfe</small><strong>${data.supplies.pot}</strong></div></article>
        <article><span>▰</span><div><small>Erde</small><strong>${data.supplies.soil}</strong></div></article>
        <article><span>◒</span><div><small>Wasser</small><strong>${data.supplies.water}</strong></div></article>
        <article><span>◇</span><div><small>Samen</small><strong>${Object.values(data.seeds).reduce((sum, value) => sum + Number(value || 0), 0)}</strong></div></article>
      </div>
      <section class="wk-inventory-list"><header><h3>Geerntete Sorten</h3><b>${wkInventoryGrams(data)} g gesamt</b></header>
        ${WK_STRAINS.map((strain) => `<article class="${strain.tier > 4 ? "master-strain" : ""}" style="--wk-accent:${strain.accent}"><span></span><div><b>${wkEscape(strain.name)}</b><small>Spielwert ${wkEuro(strain.sellPrice)} pro Gramm</small></div><strong>${Number(data.inventory[strain.id] || 0)} g</strong></article>`).join("")}
      </section>
    </div>`;
  }

  function wkCustomerHtml(customer, data) {
    const canServe = wkCanServe(customer, data);
    const total = wkCustomerTotal(customer);
    return `<article class="wk-customer-card ${canServe ? "ready" : "missing"} ${customer.vip ? "vip" : ""}">
      <header><span>${customer.vip ? "★" : customer.name.slice(0, 1).toUpperCase()}</span><div><small>${wkEscape(customer.mood)}${customer.vip ? " · MASTER-KUNDE" : ""}</small><h3>${wkEscape(customer.name)}</h3></div><b data-wk-customer-timer="${customer.id}">${wkFormatTimer(customer.expiresAtMs - wkNow())}</b></header>
      <div class="wk-order-lines">${customer.lines.map((line) => {
        const strain = wkStrain(line.strainId);
        const owned = Number(data.inventory[line.strainId] || 0);
        return `<div style="--wk-accent:${strain.accent}"><span></span><b>${wkEscape(strain.name)}</b><small>${line.grams} g · Lager ${owned} g</small><strong>${wkEuro(line.grams * line.unitPrice)}</strong></div>`;
      }).join("")}</div>
      <footer><div><small>Gesamtangebot</small><strong>${wkEuro(total)}</strong></div><button data-wk-reject="${customer.id}">Ablehnen</button><button class="primary" data-wk-serve="${customer.id}" ${canServe ? "" : "disabled"}>${canServe ? "Verkaufen" : "Ware fehlt"}</button></footer>
    </article>`;
  }

  function wkCustomersHtml(data) {
    return `<div class="wk-page">
      ${wkSummaryHtml(data)}
      <section class="wk-page-head"><div><small>MARKT</small><h2>Kundenanfragen</h2><p>${wkEliteUnlocked(data) ? "Master-Kunden können acht Sorten und Bestellungen über 3.000 € verlangen." : Number(data.stats.customersServed || 0) >= 300 ? "Ab 300 Verkäufen erscheinen zusätzlich Bestellungen ab 1.000 €. Prüfe Lagerbestand und Gesamtangebot." : "Neue Kunden erscheinen automatisch. Prüfe Sorte, Menge, Lagerbestand und Gesamtangebot."}</p></div></section>
      <div class="wk-customer-grid">${data.customers.length ? data.customers.map((customer) => wkCustomerHtml(customer, data)).join("") : `<div class="wk-empty"><span>●</span><h3>Aktuell keine Anfrage</h3><p>Die nächste Anfrage erscheint in <b data-wk-next-customer>${wkFormatTimer(data.nextCustomerAt - wkNow())}</b>.</p></div>`}</div>
    </div>`;
  }

  function wkShopHtml(data) {
    const marketLevel = wkMarketTier(data);
    const master = wkEliteUnlocked(data);
    return `<div class="wk-page">
      <section class="wk-page-head"><div><small>SHOP</small><h2>Material & Samen</h2><p>Betriebskapital: <b>${wkEuro(wkCapital(data))}</b> · Bargeld: <b>${wkEuro(wkPlayerCash())}</b> · Einkaufsrabatt ${Math.round(wkDiscount(data) * 100)}%</p></div></section>
      <section class="wk-starter-card"><span>🌱</span><div><small>START OHNE GRATISGELD</small><h3>Business-Starter-Set</h3><p>1 Topf, 1 Erde, 50 Wasser und 2 Basic-Samen. Bezahlt aus deinem eingezahlten Bargeld.</p></div><strong>${wkEuro(wkShopPrice(75, data))}</strong><button data-wk-buy-starter>Starter-Set kaufen</button></section>
      <section class="wk-shop-section"><header><h3>Verbrauchsmaterial</h3><small>Alles wird aus dem eingezahlten Betriebskapital bezahlt.</small></header><div class="wk-material-stock-v77">
        <span><i>◉</i><small>Blumentöpfe</small><b>${Number(data.supplies.pot || 0)}</b></span>
        <span><i>▰</i><small>Erde</small><b>${Number(data.supplies.soil || 0)}</b></span>
        <span><i>◒</i><small>Wasser</small><b>${Number(data.supplies.water || 0)}</b></span>
        <span><i>◇</i><small>Samen gesamt</small><b>${Object.values(data.seeds).reduce((sum, value) => sum + Number(value || 0), 0)}</b></span>
      </div><div class="wk-shop-grid">
        ${WK_SUPPLY_ITEMS.map((item) => `<article><span>${item.icon}</span><div><b>${item.label}</b><em>Besitz: ${Number(data.supplies[item.id] || 0)}${item.id === "water" ? " Einheiten" : ""}</em><small>${item.text}</small></div><strong>${wkEuro(wkShopPrice(item.price, data))}</strong><button data-wk-buy-supply="${item.id}" data-wk-amount="${item.amount}" data-wk-price="${item.price}">Kaufen</button></article>`).join("")}
      </div></section>
      ${master ? `<section class="wk-master-banner"><span>★</span><div><small>MASTER-SORTENMARKT</small><h3>Neue Premium-Samen freigeschaltet</h3><p>Zwölf zusätzliche Sorten werden stufenweise über den Master-Sortenmarkt verfügbar.</p></div><b>${WK_STRAINS.filter((strain) => strain.tier <= marketLevel).length}/24</b></section>` : ""}
      <section class="wk-shop-section"><header><h3>Samenkatalog</h3><small>${master ? "Basis- und Master-Sorten mit deutlich höheren Spielwerten." : "Startsorten plus weitere Freischaltungen über den Sortenmarkt."}</small></header><div class="wk-seed-grid">
        ${WK_STRAINS.map((strain) => {
          const unlocked = strain.tier <= marketLevel;
          const lockName = strain.tier <= 4 ? `Markt ${strain.tier}` : `Master ${strain.tier - 4}`;
          return `<article class="${unlocked ? "" : "locked"} ${strain.tier > 4 ? "master-strain" : ""}" style="--wk-accent:${strain.accent}"><span></span><div><small>${strain.rarity}</small><b>${wkEscape(strain.name)}</b><em>Besitz: ${Number(data.seeds[strain.id] || 0)} Samen</em><i>Spielwert ${wkEuro(strain.sellPrice)}/g</i></div><strong>${unlocked ? wkEuro(wkShopPrice(strain.seedPrice, data)) : lockName}</strong><button data-wk-buy-seed="${strain.id}" ${unlocked ? "" : "disabled"}>${unlocked ? "Samen kaufen" : "Gesperrt"}</button></article>`;
        }).join("")}
      </div></section>
    </div>`;
  }

  const WK_BASE_MILESTONES = [
    { id: "water-25", label: "25× gegossen", reward: 120, done: (data) => Number(data.stats.waterings || 0) >= 25 },
    { id: "water-250", label: "250× gegossen", reward: 900, done: (data) => Number(data.stats.waterings || 0) >= 250 },
    { id: "harvest-3", label: "3 Ernten", reward: 180, done: (data) => Number(data.stats.harvests || 0) >= 3 },
    { id: "harvest-50", label: "50 Ernten", reward: 1800, done: (data) => Number(data.stats.harvests || 0) >= 50 },
    { id: "customers-5", label: "5 Kunden bedient", reward: 250, done: (data) => Number(data.stats.customersServed || 0) >= 5 },
    { id: "customers-100", label: "100 Kunden bedient", reward: 2400, done: (data) => Number(data.stats.customersServed || 0) >= 100 },
    { id: "sold-100", label: "100 g verkauft", reward: 400, done: (data) => Number(data.stats.gramsSold || 0) >= 100 },
    { id: "sold-2500", label: "2.500 g verkauft", reward: 3200, done: (data) => Number(data.stats.gramsSold || 0) >= 2500 },
    { id: "revenue-5000", label: "5.000 € Umsatz", reward: 650, done: (data) => Number(data.stats.revenue || 0) >= 5000 },
    { id: "revenue-50000", label: "50.000 € Umsatz", reward: 5000, done: (data) => Number(data.stats.revenue || 0) >= 50000 },
    { id: "best-sale-1000", label: "1.000-€-Bestellung", reward: 1500, done: (data) => Number(data.stats.bestSale || 0) >= 1000 },
    { id: "invested-25000", label: "25.000 € investiert", reward: 2500, done: (data) => Number(data.stats.moneySpent || 0) >= 25000 }
  ];

  const WK_ELITE_MILESTONES = [
    { id: "master-unlocked", label: "Master-Ausbau freigeschaltet", reward: 15000, done: (data) => wkEliteUnlocked(data) },
    { id: "master-sale-3000", label: "Bestellung über 3.000 €", reward: 20000, done: (data) => Number(data.stats.bestSale || 0) >= 3000 },
    { id: "master-plants-20", label: "20 Pflanzenplätze", reward: 35000, done: (data) => wkUnlockedSlots(data) >= 20 },
    { id: "master-strains-24", label: "24 Sorten freigeschaltet", reward: 45000, done: (data) => wkMarketTier(data) >= 8 },
    { id: "master-customers-14", label: "14 Kundenplätze", reward: 40000, done: (data) => wkMaxCustomers(data) >= 14 },
    { id: "master-water-2", label: "2-Sekunden-Bewässerung", reward: 50000, done: (data) => wkWaterCooldownMs(data) <= 2000 },
    { id: "master-revenue-250k", label: "250.000 € Umsatz", reward: 60000, done: (data) => Number(data.stats.revenue || 0) >= 250000 },
    { id: "master-revenue-1m", label: "1.000.000 € Umsatz", reward: 150000, done: (data) => Number(data.stats.revenue || 0) >= 1000000 },
    { id: "master-sold-10000", label: "10.000 g verkauft", reward: 90000, done: (data) => Number(data.stats.gramsSold || 0) >= 10000 },
    { id: "master-all-upgrades", label: "Alle Master-Upgrades maximal", reward: 250000, done: (data) => Object.entries(WK_ELITE_UPGRADES).every(([id, def]) => Number(data.eliteUpgrades?.[id] || 0) >= def.max) }
  ];

  const WK_MILESTONES = [...WK_BASE_MILESTONES, ...WK_ELITE_MILESTONES];

  function wkClaimMilestone(id) {
    const data = wkState();
    const milestone = WK_MILESTONES.find((entry) => entry.id === id);
    if (!data || !milestone || data.milestones[id]) return;
    if (!milestone.done(data)) return wkToast("Dieses Ziel ist noch nicht erreicht.");
    data.milestones[id] = true;
    data.capital = wkCapital(data) + milestone.reward;
    const justUnlocked = !Number(data.eliteUnlockedAtMs || 0) && wkBaseProgressComplete(data);
    if (justUnlocked) data.eliteUnlockedAtMs = wkNow();
    wkPersist();
    wkRender();
    wkToast(justUnlocked ? `Meilenstein erreicht · +${wkEuro(milestone.reward)} · Master-Bereich freigeschaltet.` : `Meilenstein erreicht · +${wkEuro(milestone.reward)}.`);
  }

  function wkUpgradeCardsHtml(definitions, values, master = false) {
    return Object.entries(definitions).map(([id, definition]) => {
      const level = Number(values[id] || 0);
      const maxed = level >= definition.max;
      const cost = maxed ? 0 : definition.costs[level];
      return `<article class="${master ? "master-upgrade" : ""}"><span>${definition.icon}</span><div><small>${master ? "MASTER · " : ""}STUFE ${level}/${definition.max}</small><h3>${definition.label}</h3><p>${definition.text(level)}</p></div><strong>${maxed ? "MAX" : wkEuro(cost)}</strong><button data-wk-upgrade="${id}" ${maxed ? "disabled" : ""}>${maxed ? "Maximal" : "Verbessern"}</button></article>`;
    }).join("");
  }

  function wkMilestoneCardsHtml(milestones, data, master = false) {
    return milestones.map((milestone) => {
      const claimed = !!data.milestones?.[milestone.id];
      const ready = milestone.done(data);
      return `<article class="${claimed ? "claimed" : ready ? "ready" : ""} ${master ? "master" : ""}"><div><b>${milestone.label}</b><small>${wkEuro(milestone.reward)} Belohnung</small></div><button data-wk-claim="${milestone.id}" ${claimed || !ready ? "disabled" : ""}>${claimed ? "Abgeholt" : ready ? "Abholen" : "Offen"}</button></article>`;
    }).join("");
  }

  function wkMilestonesHtml(data) {
    const unlocked = wkEliteUnlocked(data);
    const baseProgress = wkBaseMilestoneProgress(data);
    const baseHtml = `<section class="wk-milestones"><header><div><small>NORMALE BONI</small><h3>Basis-Meilensteine</h3></div><span>${baseProgress.completed}/${baseProgress.total} abgeschlossen</span></header><div class="wk-milestone-scroll">${wkMilestoneCardsHtml(WK_BASE_MILESTONES, data, false)}</div></section>`;
    if (!unlocked) return baseHtml;
    const masterDone = WK_ELITE_MILESTONES.filter((milestone) => !!data.milestones?.[milestone.id] || milestone.done(data)).length;
    return `${baseHtml}<section class="wk-milestones wk-master-milestones"><header><div><small>MASTER-AUFGABEN</small><h3>Master-Meilensteine</h3></div><span>${masterDone}/${WK_ELITE_MILESTONES.length} abgeschlossen</span></header><div class="wk-milestone-scroll">${wkMilestoneCardsHtml(WK_ELITE_MILESTONES, data, true)}</div></section>`;
  }

  function wkUpgradesHtml(data) {
    const master = wkEliteUnlocked(data);
    const upgradeProgress = wkBaseUpgradeProgress(data);
    const milestoneProgress = wkBaseMilestoneProgress(data);
    return `<div class="wk-page">
      <section class="wk-page-head"><div><small>VERBESSERUNGEN</small><h2>Business ausbauen</h2><p>Der Master-Bereich öffnet sich automatisch, sobald alle normalen Upgrades maximal und alle normalen Meilenstein-Ziele erreicht sind. Belohnungen dürfen auch später abgeholt werden.</p></div></section>
      <div class="wk-upgrade-grid">${wkUpgradeCardsHtml(WK_UPGRADES, data.upgrades, false)}</div>
      ${wkMilestonesHtml(data)}
      ${master ? `<section class="wk-master-upgrades"><header><div><small>MASTER-AUSBAU FREIGESCHALTET</small><h2>Die zweite Ausbauphase</h2><p>Bis zu 20 Pflanzen, 24 Sorten, 14 Kunden, acht Sorten pro Auftrag und 2-Sekunden-Bewässerung.</p></div><span>Basis ${upgradeProgress.completed}/${upgradeProgress.total} · Boni ${milestoneProgress.completed}/${milestoneProgress.total}</span></header><div class="wk-upgrade-grid">${wkUpgradeCardsHtml(WK_ELITE_UPGRADES, data.eliteUpgrades, true)}</div></section>` : `<section class="wk-master-locked"><span>★</span><div><small>MASTER-AUSBAU GESPERRT</small><h3>Basis vollständig abschließen</h3><p>Normale Upgrades: ${upgradeProgress.completed}/${upgradeProgress.total} maximal · Normale Meilensteine: ${milestoneProgress.completed}/${milestoneProgress.total} erreicht.</p></div></section>`}
    </div>`;
  }

  function wkPlantModalHtml(data) {
    if (wkRuntime.modal !== "plant") return "";
    const available = WK_STRAINS.filter((strain) => Number(data.seeds[strain.id] || 0) > 0);
    return `<div class="wk-modal-backdrop" data-wk-modal-close><section class="wk-modal" role="dialog" aria-modal="true"><header><div><small>NEUE PFLANZE</small><h2>Sorte auswählen</h2></div><button data-wk-modal-close>×</button></header><p>Benötigt 1 Samen, 1 freien Topf und 1 Einheit Erde.</p><div class="wk-modal-seeds">${available.length ? available.map((strain) => `<button data-wk-plant="${strain.id}" style="--wk-accent:${strain.accent}"><span></span><div><b>${wkEscape(strain.name)}</b><small>${Number(data.seeds[strain.id] || 0)} Samen vorhanden</small></div><strong>Pflanzen</strong></button>`).join("") : `<div class="wk-empty"><span>◇</span><h3>Keine Samen</h3><p>Kaufe zuerst Samen im Shop.</p></div>`}</div></section></div>`;
  }

  function wkMainHtml(data) {
    if (wkRuntime.view === "inventory") return wkInventoryHtml(data);
    if (wkRuntime.view === "customers") return wkCustomersHtml(data);
    if (wkRuntime.view === "shop") return wkShopHtml(data);
    if (wkRuntime.view === "upgrades") return wkUpgradesHtml(data);
    return wkPlantsHtml(data);
  }

  function wkOverlayHtml(data) {
    return `<section class="wk-app-shell">
      ${wkHeaderHtml(data)}
      <main class="wk-main">${wkMainHtml(data)}</main>
      ${wkNavHtml(data)}
      ${wkPlantModalHtml(data)}
      <div class="wk-toast" data-wk-toast></div>
    </section>`;
  }

  function wkEnsureOverlay() {
    if (wkRuntime.overlay) return wkRuntime.overlay;
    const overlay = document.createElement("div");
    overlay.className = "wk-overlay";
    overlay.dataset.wkOverlay = "1";
    overlay.addEventListener("click", wkClick);
    document.body.appendChild(overlay);
    wkRuntime.overlay = overlay;
    return overlay;
  }

  function wkCaptureScrollState(root = wkRuntime.overlay) {
    if (!root) return [];
    const selectors = [".wk-main", ".wk-modal", ".wk-milestone-scroll"];
    const captured = [];
    selectors.forEach((selector) => {
      root.querySelectorAll(selector).forEach((node, index) => {
        captured.push({ selector, index, top: Number(node.scrollTop || 0), left: Number(node.scrollLeft || 0) });
      });
    });
    return captured;
  }

  function wkRestoreScrollState(captured = [], root = wkRuntime.overlay) {
    if (!root || !captured.length) return;
    const restore = () => {
      captured.forEach((entry) => {
        const node = root.querySelectorAll(entry.selector)[entry.index];
        if (!node) return;
        const maxTop = Math.max(0, node.scrollHeight - node.clientHeight);
        const maxLeft = Math.max(0, node.scrollWidth - node.clientWidth);
        node.scrollTop = Math.min(entry.top, maxTop);
        node.scrollLeft = Math.min(entry.left, maxLeft);
      });
    };
    requestAnimationFrame(() => {
      restore();
      requestAnimationFrame(restore);
    });
  }

  function wkRender() {
    const data = wkState();
    if (!data || !wkRuntime.overlay?.classList.contains("show")) return;
    const scrollState = wkCaptureScrollState();
    wkRuntime.overlay.innerHTML = wkOverlayHtml(data);
    wkRestoreScrollState(scrollState);
  }

  function wkToast(message) {
    const text = String(message || "").trim();
    if (!text) return;
    const toast = wkRuntime.overlay?.querySelector("[data-wk-toast]");
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add("show");
    clearTimeout(wkRuntime.toastTimer);
    wkRuntime.toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function wkUpdateTimers() {
    const data = wkState();
    const overlay = wkRuntime.overlay;
    if (!data || !overlay?.classList.contains("show")) return;
    overlay.querySelectorAll("[data-wk-next-customer]").forEach((node) => node.textContent = wkFormatTimer(data.nextCustomerAt - wkNow()));
    overlay.querySelectorAll("[data-wk-water-timer]").forEach((node) => {
      const plant = data.plants.find((entry) => entry.id === node.dataset.wkWaterTimer);
      if (plant) node.textContent = wkFormatTimer(plant.nextWaterAt - wkNow());
    });
    overlay.querySelectorAll("[data-wk-trim-timer]").forEach((node) => {
      const plant = data.plants.find((entry) => entry.id === node.dataset.wkTrimTimer);
      if (plant) node.textContent = wkFormatTimer(plant.nextTrimAt - wkNow());
    });
    overlay.querySelectorAll("[data-wk-customer-timer]").forEach((node) => {
      const customer = data.customers.find((entry) => entry.id === node.dataset.wkCustomerTimer);
      if (customer) node.textContent = wkFormatTimer(customer.expiresAtMs - wkNow());
    });
  }

  function wkTick() {
    if (!wkHasAccess()) {
      if (wkRuntime.overlay?.classList.contains("show")) wkClose();
      return;
    }
    const changed = wkProcessTime();
    if (changed && wkRuntime.overlay?.classList.contains("show")) wkRender();
    else wkUpdateTimers();
  }

  function wkStartTimers() {
    clearInterval(wkRuntime.tickTimer);
    clearInterval(wkRuntime.autosaveTimer);
    wkRuntime.tickTimer = setInterval(wkTick, 1000);
    wkRuntime.autosaveTimer = setInterval(() => wkPersist(false), 10000);
  }

  function wkStopTimers() {
    clearInterval(wkRuntime.tickTimer);
    clearInterval(wkRuntime.autosaveTimer);
    wkRuntime.tickTimer = null;
    wkRuntime.autosaveTimer = null;
  }

  function wkOpen() {
    if (!wkHasAccess()) return wkAccessDenied();
    const data = wkState();
    if (!data) return typeof addFeed === "function" ? addFeed("Starte zuerst einen JK.Games-Spielstand.") : undefined;
    wkProcessTime();
    const overlay = wkEnsureOverlay();
    overlay.innerHTML = wkOverlayHtml(data);
    overlay.classList.add("show");
    document.body.classList.add("wk-open");
    wkStartTimers();
  }

  function wkClose() {
    wkPersist();
    wkRuntime.overlay?.classList.remove("show");
    document.body.classList.remove("wk-open");
    wkRuntime.modal = "";
    wkStopTimers();
  }

  async function wkClick(event) {
    const target = event.target.closest("button, [data-wk-modal-close]");
    if (!target) return;
    if (target.matches("[data-wk-close]")) return wkClose();
    if (target.matches("[data-wk-view]")) {
      wkRuntime.view = target.dataset.wkView;
      wkRuntime.modal = "";
      return wkRender();
    }
    if (target.matches("[data-wk-open-plant]")) {
      wkRuntime.modal = "plant";
      return wkRender();
    }
    if (target.matches("[data-wk-modal-close]")) {
      if (target.classList.contains("wk-modal-backdrop") && event.target !== target) return;
      wkRuntime.modal = "";
      return wkRender();
    }
    if (target.matches("[data-wk-plant]")) return wkCreatePlant(target.dataset.wkPlant);
    if (target.matches("[data-wk-water]")) return wkWaterPlant(target.dataset.wkWater);
    if (target.matches("[data-wk-water-all]")) return wkWaterAll();
    if (target.matches("[data-wk-trim]")) return wkTrimPlant(target.dataset.wkTrim);
    if (target.matches("[data-wk-deposit]")) return wkDeposit(target.dataset.wkDeposit);
    if (target.matches("[data-wk-withdraw]")) return wkWithdraw(target.dataset.wkWithdraw);
    if (target.matches("[data-wk-danger]")) return wkReduceDanger(Number(target.dataset.wkDanger), Number(target.dataset.wkDangerCost));
    if (target.matches("[data-wk-buy-starter]")) return wkBuyStarterSet();
    if (target.matches("[data-wk-buy-supply]")) return wkBuySupply(target.dataset.wkBuySupply, Number(target.dataset.wkAmount), Number(target.dataset.wkPrice));
    if (target.matches("[data-wk-buy-seed]")) return wkBuySeed(target.dataset.wkBuySeed);
    if (target.matches("[data-wk-upgrade]")) return wkUpgrade(target.dataset.wkUpgrade);
    if (target.matches("[data-wk-claim]")) return wkClaimMilestone(target.dataset.wkClaim);
    if (target.matches("[data-wk-serve]")) return wkServeCustomer(target.dataset.wkServe);
    if (target.matches("[data-wk-reject]")) return wkRejectCustomer(target.dataset.wkReject);
  }

  function wkAdminClone(value) {
    try { return JSON.parse(JSON.stringify(value)); }
    catch { return null; }
  }

  function wkAdminSnapshot() {
    const data = wkState();
    if (!data) return null;
    return {
      version: WK_VERSION,
      player: {
        cash: Math.max(0, Math.round(Number(state?.cash || 0))),
        bank: Math.max(0, Math.round(Number(state?.bank || 0)))
      },
      business: wkAdminClone(data),
      strains: WK_STRAINS.map((strain) => ({ ...strain })),
      upgrades: Object.entries(WK_UPGRADES).map(([id, definition]) => ({ id, label: definition.label, max: definition.max })),
      eliteUpgrades: Object.entries(WK_ELITE_UPGRADES).map(([id, definition]) => ({ id, label: definition.label, max: definition.max }))
    };
  }

  function wkAdminApply(payload = {}) {
    const data = wkState();
    if (!data || !payload || typeof payload !== "object") return { ok: false, message: "Kein aktiver Spielstand." };

    if (payload.capital !== undefined) data.capital = Math.max(0, Math.round(Number(payload.capital || 0)));
    if (payload.danger !== undefined) data.danger = wkClamp(payload.danger, 0, 100);
    if (payload.playerCash !== undefined && state) state.cash = Math.max(0, Math.round(Number(payload.playerCash || 0)));
    if (payload.playerBank !== undefined && state) state.bank = Math.max(0, Math.round(Number(payload.playerBank || 0)));

    if (payload.supplies && typeof payload.supplies === "object") {
      ["pot", "soil", "water"].forEach((id) => {
        if (payload.supplies[id] !== undefined) data.supplies[id] = Math.max(0, Math.floor(Number(payload.supplies[id] || 0)));
      });
    }

    if (payload.seeds && typeof payload.seeds === "object") {
      WK_STRAINS.forEach((strain) => {
        if (payload.seeds[strain.id] !== undefined) data.seeds[strain.id] = Math.max(0, Math.floor(Number(payload.seeds[strain.id] || 0)));
      });
    }

    if (payload.inventory && typeof payload.inventory === "object") {
      WK_STRAINS.forEach((strain) => {
        if (payload.inventory[strain.id] !== undefined) data.inventory[strain.id] = Math.max(0, Math.floor(Number(payload.inventory[strain.id] || 0)));
      });
    }

    if (payload.stats && typeof payload.stats === "object") {
      Object.keys(data.stats).forEach((id) => {
        if (payload.stats[id] !== undefined) data.stats[id] = Math.max(0, Number(payload.stats[id] || 0));
      });
    }

    if (payload.upgrades && typeof payload.upgrades === "object") {
      Object.entries(WK_UPGRADES).forEach(([id, definition]) => {
        if (payload.upgrades[id] !== undefined) data.upgrades[id] = Math.max(0, Math.min(definition.max, Math.floor(Number(payload.upgrades[id] || 0))));
      });
    }

    if (payload.eliteUpgrades && typeof payload.eliteUpgrades === "object") {
      Object.entries(WK_ELITE_UPGRADES).forEach(([id, definition]) => {
        if (payload.eliteUpgrades[id] !== undefined) data.eliteUpgrades[id] = Math.max(0, Math.min(definition.max, Math.floor(Number(payload.eliteUpgrades[id] || 0))));
      });
    }

    if (payload.eliteUnlocked === true) data.eliteUnlockedAtMs = wkNow();
    if (payload.eliteUnlocked === false) data.eliteUnlockedAtMs = 0;
    wkPersist();
    if (wkRuntime.overlay?.classList.contains("show")) wkRender();
    return { ok: true, message: "Weed-Business-Testwerte gespeichert.", snapshot: wkAdminSnapshot() };
  }

  function wkAdminSpawnCustomer(minimumTotal = 0) {
    const data = wkState();
    if (!data) return null;
    if (data.customers.length >= wkMaxCustomers(data)) data.customers.shift();
    const customer = wkRandomCustomer(data);
    if (minimumTotal > 0 && customer.lines.length) {
      customer.thousandOrder = minimumTotal >= 1000;
      customer.vip = minimumTotal >= 3000;
      customer.mood = minimumTotal >= 3000 ? "Owner-VIP-Testauftrag" : "Owner-Testauftrag ab 1.000 €";
      const current = wkCustomerTotal(customer);
      if (current < minimumTotal) {
        const first = customer.lines[0];
        first.grams += Math.ceil((minimumTotal - current) / Math.max(1, Number(first.unitPrice || 1)));
      }
    }
    data.customers.push(customer);
    data.nextCustomerAt = wkNow() + wkCustomerIntervalMs(data);
    return customer;
  }

  function wkAdminAction(action) {
    const data = wkState();
    if (!data) return { ok: false, message: "Kein aktiver Spielstand." };
    const name = String(action || "");
    if (name === "all-seeds" || name === "test-package") {
      WK_STRAINS.forEach((strain) => { data.seeds[strain.id] = Math.max(Number(data.seeds[strain.id] || 0), 999); });
    }
    if (name === "all-materials" || name === "test-package") {
      data.supplies.pot = Math.max(Number(data.supplies.pot || 0), 99);
      data.supplies.soil = Math.max(Number(data.supplies.soil || 0), 999);
      data.supplies.water = Math.max(Number(data.supplies.water || 0), 9999);
    }
    if (name === "all-inventory" || name === "test-package") {
      WK_STRAINS.forEach((strain) => { data.inventory[strain.id] = Math.max(Number(data.inventory[strain.id] || 0), 5000); });
    }
    if (name === "test-package") {
      data.capital = Math.max(wkCapital(data), 1000000);
      if (state) {
        state.cash = Math.max(Number(state.cash || 0), 1000000);
        state.bank = Math.max(Number(state.bank || 0), 1000000);
      }
      data.stats.customersServed = Math.max(Number(data.stats.customersServed || 0), 300);
    }
    if (name === "max-base" || name === "unlock-master" || name === "max-all") {
      Object.entries(WK_UPGRADES).forEach(([id, definition]) => { data.upgrades[id] = definition.max; });
    }
    if (name === "unlock-master" || name === "max-all") {
      data.stats.waterings = Math.max(Number(data.stats.waterings || 0), 250);
      data.stats.harvests = Math.max(Number(data.stats.harvests || 0), 50);
      data.stats.customersServed = Math.max(Number(data.stats.customersServed || 0), 300);
      data.stats.gramsSold = Math.max(Number(data.stats.gramsSold || 0), 2500);
      data.stats.revenue = Math.max(Number(data.stats.revenue || 0), 50000);
      data.stats.bestSale = Math.max(Number(data.stats.bestSale || 0), 1000);
      data.stats.moneySpent = Math.max(Number(data.stats.moneySpent || 0), 25000);
      data.eliteUnlockedAtMs = wkNow();
    }
    if (name === "max-all") {
      Object.entries(WK_ELITE_UPGRADES).forEach(([id, definition]) => { data.eliteUpgrades[id] = definition.max; });
    }
    if (name === "spawn-customer") wkAdminSpawnCustomer(0);
    if (name === "spawn-1000-order") {
      data.stats.customersServed = Math.max(Number(data.stats.customersServed || 0), 300);
      wkAdminSpawnCustomer(1000);
    }
    if (name === "spawn-3000-order") {
      data.stats.customersServed = Math.max(Number(data.stats.customersServed || 0), 300);
      wkAdminSpawnCustomer(3000);
    }
    if (name === "clear-plants") {
      data.supplies.pot += data.plants.length;
      data.plants = [];
    }
    if (name === "clear-customers") data.customers = [];
    if (name === "reset-business") {
      try { localStorage.removeItem(wkBackupKey()); } catch {}
      state.weedKL = wkDefaultState();
    }
    wkPersist();
    if (wkRuntime.overlay?.classList.contains("show")) wkRender();
    return { ok: true, message: "Weed-Business-Testaktion ausgeführt.", snapshot: wkAdminSnapshot() };
  }

  function wkGrantJkCoinPurchase(kind, amount = 1) {
    const data = wkState(); if (!data) return false; amount = Math.max(1, Math.floor(Number(amount) || 1));
    if (kind === "growLight") { data.jkCoin.galaxyGrowLights += amount; data.upgrades.autoWater = Math.min(WK_UPGRADES.autoWater.max, Math.max(Number(data.upgrades.autoWater || 0), amount)); }
    else if (kind === "supplyCrate") { data.jkCoin.premiumSupplyCrates += amount; data.seeds.basic = Number(data.seeds.basic || 0) + amount * 8; data.supplies.pot = Number(data.supplies.pot || 0) + amount * 5; data.supplies.soil = Number(data.supplies.soil || 0) + amount * 5; data.supplies.water = Number(data.supplies.water || 0) + amount * 20; }
    else return false;
    wkPersist(); if (wkRuntime.overlay?.classList.contains("show")) wkRender(); return true;
  }

  window.WeedKL = {
    open: wkOpen,
    close: wkClose,
    suspend: wkClose,
    version: WK_VERSION,
    grantJkCoinPurchase: wkGrantJkCoinPurchase,
    canAccess: wkHasAccess,
    accessRole: wkAccessRole,
    summary: () => wkGuarded(() => {
      const data = wkState();
      return data ? {
        capital: wkCapital(data), danger: Number(data.danger || 0), plants: data.plants.length,
        slots: wkUnlockedSlots(data), grams: wkInventoryGrams(data), master: wkEliteUnlocked(data),
        wateringSeconds: wkWaterCooldownMs(data) / 1000, customerSeconds: wkCustomerIntervalMs(data) / 1000,
        customerSlots: wkMaxCustomers(data), orderLines: wkMaxOrderLines(data), strains: WK_STRAINS.filter((strain) => strain.tier <= wkMarketTier(data)).length,
        discountPercent: Math.round(wkDiscount(data) * 100), yieldPercent: Math.round(wkYieldBonus(data) * 100),
        soilSavePercent: Math.round(wkSoilSaveChance(data) * 100), customerWaitSeconds: wkCustomerExtraWaitSeconds(data)
      } : null;
    }, null),
    debug: {
      getState: () => wkGuarded(() => wkState(), null),
      deposit: (...args) => wkGuarded(() => wkDeposit(...args), false),
      plant: (...args) => wkGuarded(() => wkCreatePlant(...args), false),
      water: (...args) => wkGuarded(() => wkWaterPlant(...args), false),
      trim: (...args) => wkGuarded(() => wkTrimPlant(...args), false),
      spawnCustomer: () => wkGuarded(() => wkAdminAction("spawn-customer"), { ok: false, message: "Kein Zugriff." })
    },
    admin: {
      snapshot: () => wkGuarded(() => wkAdminSnapshot(), null),
      apply: (payload) => wkGuarded(() => wkAdminApply(payload), { ok: false, message: "Kein Zugriff." }),
      action: (action) => wkGuarded(() => wkAdminAction(action), { ok: false, message: "Kein Zugriff." }),
      open: wkOpen
    }
  };

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && wkRuntime.overlay?.classList.contains("show")) wkClose();
  });

  window.addEventListener("beforeunload", () => {
    wkPersist(false);
    wkStopTimers();
  });
})();
