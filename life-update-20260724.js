(() => {
  "use strict";

  const UPDATE_VERSION = "2026-07-27-jkgames-v61-status-pet-food";
  const DRIVER_APPLICATION_FEE = 3200;
  const DRIVER_THEORY_RETRY_FEE = 450;
  const DRIVER_PRACTICAL_RETRY_FEE = 650;

  const PATCH_SECTIONS = [
    {
      icon: "🛡️",
      title: "Sicherheitsrelevante Updates & wichtige Bugfixes",
      bullets: [
        "Telefon, SMS und Notizen wurden technisch stabilisiert und öffnen sich jetzt in eigenen App-Fenstern.",
        "Online-Telefonnummern werden korrekt zugeordnet: andere Spieler können dich anrufen und du kannst sie anrufen.",
        "Annehmen, Ablehnen und Auflegen wurden überarbeitet, damit Anrufe nicht mehr in einem festhängenden Zustand bleiben.",
        "Neue Nachrichten und Anrufe werden klar angezeigt, ohne den geöffneten Smartphone-Bereich unnötig neu aufzubauen."
      ]
    },
    {
      icon: "🏦",
      title: "Komplett neue Bank-App",
      bullets: [
        "Die Bank öffnet sich jetzt wie Telefon und SMS in einem eigenen, modernen App-Fenster.",
        "Kontostand, IBAN, Kreditrahmen, Bargeld, Schulden, Steuern und die letzten Umsätze werden übersichtlich angezeigt.",
        "Ein neues Kontodiagramm zeigt Einnahmen und Ausgaben der letzten 30 Tage.",
        "Empfänger werden nur noch gezielt per IBAN oder Namen gesucht und anschließend als Bankkontakt gespeichert.",
        "Jeder angemeldete Spieler erhält eine eigene persönliche IBAN.",
        "Überweisungen erscheinen bei Sender und Empfänger mit Name, Betrag, Status und Verwendungszweck."
      ]
    },
    {
      icon: "⚡",
      title: "Normale Überweisung & Blitzüberweisung",
      bullets: [
        "Normale Überweisungen werden online vorgemerkt und nach einer echten Stunde zur Buchung freigegeben.",
        "Blitzüberweisungen werden sofort gebucht und kosten 1.000 € Gebühr.",
        "Die Gebühr wird erst in der Auswahl der Blitzüberweisung angezeigt.",
        "Normale Überweisungen werden nach einer Stunde gebucht; JK.Games kann währenddessen geschlossen werden.",
        "Auch nach dem Schließen der App bleibt die Überweisung vorgemerkt und wird beim nächsten Online-Kontakt des Empfängers zugestellt."
      ]
    },
    {
      icon: "📱",
      title: "Neues Design bei Telefon, SMS und Notizen",
      bullets: [
        "Telefon, SMS und Notizen besitzen eigene Fenster und müssen nicht mehr unter den App-Symbolen gesucht werden.",
        "Chats bleiben an der aktuellen Position und springen nach neuen Nachrichten nicht mehr automatisch nach oben.",
        "Kontakte, einzelne Unterhaltungen, Klingelton, Freizeichen und die Anrufsteuerung wurden verbessert.",
        "SMS und Anrufe lassen sich über die obere Benachrichtigung direkt öffnen."
      ]
    },
    {
      icon: "👤",
      title: "Charakter, Haustier und Bedienung",
      bullets: [
        "Das Charakterfenster steht im Anpassungsmenü oben; die Auswahl für Inventar, Skills, Friseur und weitere Bereiche liegt darunter.",
        "Charakter und Füße bleiben auf Handy und PC vollständig sichtbar.",
        "Das aktive Haustier bleibt neben den Füßen anklickbar und wird beim Verschieben des Charakterbereichs mitgeführt.",
        "Mehrere mobile Layout- und Scrollfehler wurden korrigiert."
      ]
    },
    {
      icon: "🎮",
      title: "Spiele und Karten",
      bullets: [
        "Mehrere Spiele-Bugs und fehlerhafte Aktualisierungsschleifen wurden weiter reduziert.",
        "Casino- und Business-Karten lassen sich auf dem Handy in alle Richtungen verschieben und berücksichtigen die iPhone-Sicherheitsbereiche.",
        "Der Startbildschirm lädt wichtige App- und Online-Bausteine bereits während des Ladebalkens vor.",
        "App-interne Neuheiten werden künftig pro Spielstand einmal angezeigt und bleiben über Einstellungen → Neuheiten erneut abrufbar."
      ]
    },
    {
      icon: "📊",
      title: "Grafik, Statusfelder und Ladebild",
      bullets: [
        "Beim Wechsel der Grafikstufe verwendet JK.Games auf dem Handy jetzt dasselbe bildschirmfüllende Hochformat-Ladebild wie beim App-Start.",
        "Hunger, Energie, Durst, Stimmung und Zentrale wurden auf kleinen Displays kompakter, mittig und besser lesbar angeordnet.",
        "Das Vorladen bleibt aktiv, bevor die neue Grafikansicht wieder freigegeben wird."
      ]
    },
    {
      icon: "❤️",
      title: "Charakterwerte und Leben geprüft",
      bullets: [
        "Hunger, Durst und Energie verändern sich wieder langsam mit der verstrichenen Zeit und zusätzlich beim Schlafen beziehungsweise bei Aktionen.",
        "Das Leben sinkt nicht grundlos: Abzüge entstehen erst bei Vernachlässigung, sehr schlechten Bedürfnissen, Krankheit oder dauerhaft schlechter Stimmung.",
        "Ungültige alte Zeitwerte können das Statussystem nicht mehr dauerhaft einfrieren."
      ]
    },
    {
      icon: "🐾",
      title: "Haustierwerte funktionieren wieder",
      bullets: [
        "Hunger, Durst, Freude und Pflege der Haustiere sinken wieder zuverlässig mit der verstrichenen Zeit.",
        "Der Fehler bei älteren Spielständen ohne gespeicherten Tier-Zeitpunkt wurde behoben.",
        "Auch nach einer geschlossenen App werden die verstrichenen Tierwerte beim nächsten Öffnen korrekt nachgeholt."
      ]
    },
    {
      icon: "🍽️",
      title: "Mehr Essen und Getränke",
      bullets: [
        "Kaufhalle und Supermärkte bieten zusätzliche Getränke wie Zitronenwasser, Mate, Multivitaminsaft, Sportdrink, Smoothie und Kakao.",
        "Neue Essensvarianten umfassen unter anderem Käsebrötchen, Wrap, Obstbecher, Müsli-Joghurt, Pizza-Stück und Reis-Gemüse-Bowl.",
        "Die neuen Artikel landen wie gewohnt im Inventar und wirken auf Hunger, Durst, Energie oder Gesundheit."
      ]
    },
    {
      icon: "🏠",
      title: "Finanz- und Wohnhilfe geschützt",
      bullets: [
        "Finanz- und Wohnhilfe kann nur bei aktivem Obdachlosenstatus geöffnet werden.",
        "Sobald wieder eine feste Unterkunft vorhanden ist, wird der Bereich automatisch gesperrt.",
        "Der Button zeigt klar an, ob Krisenhilfe verfügbar oder gesperrt ist.",
        "Alle bisherigen Hilfen und Rückzahlungsfunktionen bleiben unverändert erhalten."
      ]
    }
  ];

  const LEVEL_MILESTONES = {
    2: {
      title: "Level 2 erreicht",
      subtitle: "Dein erster großer Freizeitbereich ist verfügbar.",
      bullets: ["Das Casino kann jetzt betreten werden.", "Roulette, Blackjack, Slots und weitere Casino-Bereiche stehen bereit.", "Tippe auf gesperrte Bereiche, um künftig die jeweilige Voraussetzung zu sehen."]
    },
    3: {
      title: "Level 3 erreicht",
      subtitle: "Wohnen und Logistik werden wichtiger.",
      bullets: ["Der Immobilienbereich ist jetzt freigeschaltet.", "Das Logistikzentrum kann über Arbeit → Arbeitshelfer geöffnet werden.", "Automatische Arbeit, manuelle Arbeit und der Arbeit-Skillbaum bleiben weiterhin frei verfügbar."]
    },
    5: {
      title: "Level 5 erreicht",
      subtitle: "Dein Smartphone wird zur Wirtschafts-Zentrale.",
      bullets: ["Business, Trading und Börse können jetzt geöffnet werden.", "Für Online-Funktionen werden weiterhin ein geeignetes Smartphone und eine SIM benötigt.", "Weed Business und Business Map werden innerhalb der Business-App noch später freigeschaltet."]
    },
    6: {
      title: "Level 6 erreicht",
      subtitle: "Riskante Geschäfte werden erweitert.",
      bullets: ["Weed Business ist jetzt in der Business-App verfügbar.", "Die Business Map kann jetzt geöffnet werden.", "Gefahr, Lager und Schutzsysteme sollten vor jedem Verkauf geprüft werden."]
    },
    7: {
      title: "Level 7 erreicht",
      subtitle: "Du kannst deinen eigenen Markt aufbauen.",
      bullets: ["Der eigene Shop kann jetzt erstellt und verwaltet werden.", "Großhandel, Lagerbestand und Online-Angebote stehen zur Verfügung.", "Legale und riskante Ware besitzen unterschiedliche Folgen."]
    }
  };

  const PHONE_TUTORIALS = {
    0: ["Notizen und einfache Telefonfunktionen stehen bereit.", "Für moderne Apps brauchst du ein Smartphone und eine SIM."],
    1: ["Telefon, SMS, Bank, Shop, Stadtkarte, Games und App Store sind verfügbar.", "Online-Apps benötigen eine SIM-Karte; manche Funktionen zusätzlich Online-Banking."],
    2: ["Das Mittelklasse-Smartphone arbeitet schneller und unterstützt die Wirtschafts-Apps.", "Business, Trading und Börse benötigen zusätzlich das passende Charakter-Level."],
    3: ["Das Pro-Smartphone bietet die beste normale App-Leistung und mehr Komfort.", "Heruntergeladene Apps bleiben nach dem Neuladen installiert."],
    4: ["Das Ultra-Smartphone besitzt die schnellste Bedienung und volle Geräteklasse.", "Alle Apps bleiben weiterhin an ihre eigenen Level-, SIM- und Guthabenregeln gebunden."]
  };

  const THEORY_POOL = [
    { q: "Was bedeutet ein rotes Ampellicht?", answers: ["Anhalten", "Schneller fahren", "Nur hupen"], correct: 0 },
    { q: "Wer muss sich im Auto anschnallen?", answers: ["Nur der Fahrer", "Alle Insassen", "Nur Kinder"], correct: 1 },
    { q: "Was ist vor dem Abbiegen wichtig?", answers: ["Blinken und Verkehr prüfen", "Radio lauter stellen", "Motor ausschalten"], correct: 0 },
    { q: "Was gilt an einem Zebrastreifen?", answers: ["Fußgänger durchlassen", "Immer beschleunigen", "Parken erlaubt"], correct: 0 },
    { q: "Was solltest du bei Müdigkeit tun?", answers: ["Pause machen", "Schneller fahren", "Licht ausschalten"], correct: 0 },
    { q: "Wofür ist der Sicherheitsabstand da?", answers: ["Damit genug Bremsweg bleibt", "Damit niemand überholt", "Nur für LKW"], correct: 0 },
    { q: "Darfst du während der Fahrt das Handy in der Hand bedienen?", answers: ["Ja, immer", "Nein", "Nur bei Regen"], correct: 1 },
    { q: "Was bedeutet ein Stoppschild?", answers: ["Vollständig anhalten", "Nur langsamer werden", "Vorbeifahren ohne Prüfung"], correct: 0 },
    { q: "Wie verhältst du dich bei Blaulicht und Martinshorn?", answers: ["Platz schaffen", "Dicht auffahren", "Stehen bleiben, egal wo"], correct: 0 },
    { q: "Wann muss das Licht eingeschaltet werden?", answers: ["Bei Dunkelheit und schlechter Sicht", "Nur im Sommer", "Nur in der Stadt"], correct: 0 },
    { q: "Was prüfst du vor einer längeren Fahrt?", answers: ["Reifen, Licht und Kraftstoff", "Nur die Musik", "Nur den Kofferraum"], correct: 0 },
    { q: "Was ist bei Glätte sinnvoll?", answers: ["Langsam und vorsichtig fahren", "Stark beschleunigen", "Dicht auffahren"], correct: 0 }
  ];

  let guideOverlay = null;
  let guideQueue = [];
  let guideBusy = false;
  const queuedLevelTutorials = new Set();
  let driverOverlay = null;
  let theorySession = null;
  let practicalTimer = null;

  const level = () => Math.max(0, Math.floor(Number(state?.level || 0)));
  const hasLicense = () => Array.isArray(state?.items) && state.items.includes("Führerschein");
  const randomPick = (rows, amount) => [...rows].sort(() => Math.random() - 0.5).slice(0, amount);

  function safeSaveAndRender() {
    try { save?.(); } catch (error) { console.warn("Update speichern", error); }
    try { render?.(); } catch (error) { console.warn("Update rendern", error); }
  }

  function showLocked(area, required) {
    const name = String(area || "Dieser Bereich");
    const text = `${name} ist erst ab Level ${required} verfügbar. Aktuell bist du Level ${level()}.`;
    try { addFeed(text); } catch { /* UI fallback follows */ }
    showNotice(name, text);
    return false;
  }

  function showNotice(title, text) {
    const node = document.createElement("div");
    node.className = "life-update-toast";
    node.innerHTML = `<b>${escapeHtml?.(title) || title}</b><span>${escapeHtml?.(text) || text}</span>`;
    document.body.appendChild(node);
    requestAnimationFrame(() => node.classList.add("show"));
    setTimeout(() => {
      node.classList.remove("show");
      setTimeout(() => node.remove(), 250);
    }, 3100);
  }

  function ensureGuidanceState() {
    if (!state) return null;
    state.updateGuidance ||= {};
    state.updateGuidance.seenLevels = Array.isArray(state.updateGuidance.seenLevels)
      ? [...new Set(state.updateGuidance.seenLevels.map(Number).filter((entry) => LEVEL_MILESTONES[entry]))]
      : [];
    state.updateGuidance.seenPhoneTiers = Array.isArray(state.updateGuidance.seenPhoneTiers) ? state.updateGuidance.seenPhoneTiers : [];
    // V16 behebt die alte Migration, die niedrigere Level pauschal als gesehen markierte.
    // Bereits wirklich abgeschlossene Hinweise bleiben erhalten; fehlende Hinweise werden
    // beim nächsten Start in aufsteigender Reihenfolge nachgeholt.
    if (state.updateGuidance.levelTutorialSchema !== 2) {
      // Alte Versionen konnten Hinweise fälschlich als gesehen markieren, ohne sie
      // tatsächlich anzuzeigen. V16 setzt diese Liste einmal zurück, damit jeder
      // vorhandene Charakter seine wichtigen Freischaltungen zuverlässig erhält.
      state.updateGuidance.seenLevels = [];
      state.updateGuidance.levelTutorialSchema = 2;
      state.updateGuidance.levelMigrationDone = true;
    }
    return state.updateGuidance;
  }

  function ensureGuideOverlay() {
    if (guideOverlay) return guideOverlay;
    guideOverlay = document.createElement("div");
    guideOverlay.className = "life-guide-overlay";
    guideOverlay.innerHTML = `<section class="life-guide-card"><header><div><small data-guide-eyebrow>JK.GAMES UPDATE</small><h2 data-guide-title>Neuheiten</h2><p data-guide-subtitle></p></div><button type="button" data-guide-close aria-label="Schließen">×</button></header><div class="life-guide-scroll" data-guide-content></div><footer><button type="button" class="primary-button" data-guide-confirm>Verstanden</button></footer></section>`;
    guideOverlay.querySelectorAll("[data-guide-close],[data-guide-confirm]").forEach((button) => button.addEventListener("click", closeGuide));
    guideOverlay.addEventListener("click", (event) => { if (event.target === guideOverlay) closeGuide(); });
    document.body.appendChild(guideOverlay);
    return guideOverlay;
  }

  function showGuide({ eyebrow = "JK.GAMES", title, subtitle = "", sections = [], onClose = null }) {
    guideQueue.push({ eyebrow, title, subtitle, sections, onClose });
    runGuideQueue();
  }

  function runGuideQueue() {
    if (guideBusy || !guideQueue.length) return;
    guideBusy = true;
    const item = guideQueue.shift();
    const overlay = ensureGuideOverlay();
    overlay.dataset.closeAction = "pending";
    overlay._onClose = item.onClose;
    overlay.querySelector("[data-guide-eyebrow]").textContent = item.eyebrow;
    overlay.querySelector("[data-guide-title]").textContent = item.title;
    overlay.querySelector("[data-guide-subtitle]").textContent = item.subtitle;
    overlay.querySelector("[data-guide-content]").innerHTML = item.sections.map((section) => `<article class="life-guide-section"><span>${section.icon || "✓"}</span><div><h3>${escapeHtml?.(section.title) || section.title}</h3><ul>${(section.bullets || []).map((bullet) => `<li>${escapeHtml?.(bullet) || bullet}</li>`).join("")}</ul></div></article>`).join("");
    overlay.classList.add("show");
    document.body.classList.add("life-guide-open");
  }

  function closeGuide() {
    if (!guideBusy || !guideOverlay) return;
    const callback = guideOverlay._onClose;
    guideOverlay._onClose = null;
    guideOverlay.classList.remove("show");
    document.body.classList.remove("life-guide-open");
    guideBusy = false;
    try { callback?.(); } catch (error) { console.warn("Tutorial-Abschluss", error); }
    setTimeout(runGuideQueue, 180);
  }

  const PATCH_SEEN_STORAGE_KEY = "jkgames-whats-new-seen-version";

  function storedPatchVersion() {
    try { return String(localStorage.getItem(PATCH_SEEN_STORAGE_KEY) || ""); }
    catch { return ""; }
  }

  function markPatchVersionSeen(guidance) {
    if (guidance) guidance.patchVersion = UPDATE_VERSION;
    try { localStorage.setItem(PATCH_SEEN_STORAGE_KEY, UPDATE_VERSION); } catch { /* Speicher kann blockiert sein */ }
  }

  function showPatchNotes(force = false) {
    if (!state && !force) return;
    const guidance = ensureGuidanceState();
    // Automatisch nur einmal pro Update anzeigen. Die lokale Markierung schützt
    // zusätzlich davor, dass ein älterer Cloud-/Browser-Spielstand die Anzeige
    // beim nächsten App-Start erneut öffnet. Über Einstellungen → Neuheiten kann
    // die Übersicht weiterhin jederzeit manuell geöffnet werden.
    const alreadySeen = guidance?.patchVersion === UPDATE_VERSION || storedPatchVersion() === UPDATE_VERSION;
    if (!force && alreadySeen) {
      // Falls nur die lokale Markierung vorhanden ist, den Spielstand nachziehen.
      if (guidance && guidance.patchVersion !== UPDATE_VERSION) {
        guidance.patchVersion = UPDATE_VERSION;
        try { save?.(); } catch { /* Beim nächsten regulären Speichern erneut */ }
      }
      return;
    }
    showGuide({
      eyebrow: "NEUES JK.GAMES-UPDATE",
      title: "Was ist neu?",
      subtitle: "Die wichtigsten Änderungen dieses Updates. Du kannst diese Übersicht später im Einstellungsmenü erneut öffnen.",
      sections: PATCH_SECTIONS,
      onClose: () => {
        markPatchVersionSeen(guidance);
        safeSaveAndRender();
        checkCurrentMilestone();
      }
    });
  }

  function queueLevelTutorial(milestoneLevel) {
    const data = LEVEL_MILESTONES[milestoneLevel];
    const guidance = ensureGuidanceState();
    if (!data || !guidance || guidance.seenLevels.includes(milestoneLevel) || queuedLevelTutorials.has(milestoneLevel)) return;
    queuedLevelTutorials.add(milestoneLevel);
    showGuide({
      eyebrow: "NEUE FREISCHALTUNG",
      title: data.title,
      subtitle: data.subtitle,
      sections: [{ icon: "🔓", title: "Jetzt verfügbar", bullets: data.bullets }],
      onClose: () => {
        queuedLevelTutorials.delete(milestoneLevel);
        const currentGuidance = ensureGuidanceState();
        if (currentGuidance && !currentGuidance.seenLevels.includes(milestoneLevel)) currentGuidance.seenLevels.push(milestoneLevel);
        safeSaveAndRender();
      }
    });
  }

  function checkCurrentMilestone() {
    const current = level();
    const guidance = ensureGuidanceState();
    if (!guidance) return;
    Object.keys(LEVEL_MILESTONES)
      .map(Number)
      .filter((milestone) => milestone <= current && !guidance.seenLevels.includes(milestone))
      .sort((a, b) => a - b)
      .forEach((milestone, index) => setTimeout(() => queueLevelTutorial(milestone), index * 180));
  }

  function queuePhoneTutorial(tier) {
    const guidance = ensureGuidanceState();
    const rows = PHONE_TUTORIALS[tier];
    if (!guidance || !rows || guidance.seenPhoneTiers.includes(tier)) return;
    guidance.seenPhoneTiers.push(tier);
    safeSaveAndRender();
    showGuide({
      eyebrow: "NEUES GERÄT",
      title: tier >= 4 ? "Ultra-Smartphone eingerichtet" : tier >= 3 ? "Pro-Smartphone eingerichtet" : tier >= 2 ? "Mittelklasse-Smartphone eingerichtet" : tier >= 1 ? "Einsteiger-Smartphone eingerichtet" : "Basishandy eingerichtet",
      subtitle: "Diese Funktionen sind mit deinem neuen Gerät wichtig.",
      sections: [{ icon: "📱", title: "Smartphone-Tutorial", bullets: rows }]
    });
  }

  function ensureDriverState() {
    if (!state) return null;
    state.drivingSchool ||= {};
    const data = state.drivingSchool;
    data.theoryAttempts = Math.max(0, Math.floor(Number(data.theoryAttempts || 0)));
    data.practicalFailures = Math.max(0, Math.floor(Number(data.practicalFailures || 0)));
    data.theoryPassed = !!data.theoryPassed;
    data.licenseGranted = hasLicense() || !!data.licenseGranted;
    return data;
  }

  function ensureDriverOverlay() {
    if (driverOverlay) return driverOverlay;
    driverOverlay = document.createElement("div");
    driverOverlay.className = "driver-school-overlay";
    driverOverlay.addEventListener("click", driverClick);
    document.body.appendChild(driverOverlay);
    return driverOverlay;
  }

  function driverShell(content) {
    return `<section class="driver-school-card"><header><button data-driver-close aria-label="Schließen">×</button><div><small>FÜHRERSCHEINSTELLE</small><h2>Führerschein Klasse B</h2></div><span>🚘</span></header><main>${content}</main></section>`;
  }

  function openDrivingSchool() {
    if (!state) return;
    const data = ensureDriverState();
    const overlay = ensureDriverOverlay();
    clearInterval(practicalTimer);
    practicalTimer = null;
    if (hasLicense()) {
      overlay.innerHTML = driverShell(`<div class="driver-result success"><span>✓</span><h3>Führerschein vorhanden</h3><p>Dein Führerschein Klasse B ist dauerhaft gültig und im Inventar gespeichert.</p><button data-driver-close class="primary-button">Schließen</button></div>`);
    } else if (data.theoryPassed) {
      renderPracticalIntro();
      return;
    } else {
      const fee = data.theoryAttempts > 0 ? DRIVER_THEORY_RETRY_FEE : DRIVER_APPLICATION_FEE;
      overlay.innerHTML = driverShell(`<section class="driver-welcome"><div class="driver-road-preview"><i></i><b>🚗</b><span></span></div><h3>Ausbildung starten</h3><p>Beantworte fünf wechselnde, einfache Theoriefragen. Danach folgt die animierte praktische Prüfung.</p><div class="driver-fee"><small>${data.theoryAttempts ? "Theorie-Wiederholung" : "Anmeldung & Prüfung"}</small><b>${euro.format(fee)}</b></div><button class="primary-button" data-driver-start-theory data-driver-fee="${fee}">${data.theoryAttempts ? "Theorie wiederholen" : "Prüfung beginnen"}</button></section>`);
    }
    overlay.classList.add("show");
    document.body.classList.add("driver-school-open");
  }

  function startTheory(fee) {
    if (!pay(Number(fee), false, { method: "auto", target: "treasury", taxRate: 0 })) {
      return showNotice("Führerscheinstelle", `Für die Prüfung werden ${euro.format(Number(fee))} benötigt.`);
    }
    const data = ensureDriverState();
    data.theoryAttempts += 1;
    theorySession = { questions: randomPick(THEORY_POOL, 5), index: 0, correct: 0 };
    safeSaveAndRender();
    renderTheoryQuestion();
  }

  function renderTheoryQuestion() {
    const overlay = ensureDriverOverlay();
    const session = theorySession;
    const question = session?.questions?.[session.index];
    if (!question) return finishTheory();
    overlay.innerHTML = driverShell(`<section class="driver-theory"><div class="driver-progress-label"><b>Frage ${session.index + 1}/5</b><span>${session.correct} richtig</span></div><div class="driver-progress"><i style="width:${session.index / 5 * 100}%"></i></div><h3>${escapeHtml?.(question.q) || question.q}</h3><div class="driver-answers">${question.answers.map((answer, index) => `<button data-driver-answer="${index}">${escapeHtml?.(answer) || answer}</button>`).join("")}</div><small>Mindestens vier richtige Antworten sind nötig.</small></section>`);
    overlay.classList.add("show");
  }

  function answerTheory(index) {
    const question = theorySession?.questions?.[theorySession.index];
    if (!question) return;
    if (Number(index) === question.correct) theorySession.correct += 1;
    theorySession.index += 1;
    renderTheoryQuestion();
  }

  function finishTheory() {
    const data = ensureDriverState();
    const passed = theorySession?.correct >= 4;
    if (passed) data.theoryPassed = true;
    safeSaveAndRender();
    const overlay = ensureDriverOverlay();
    overlay.innerHTML = driverShell(`<div class="driver-result ${passed ? "success" : "failed"}"><span>${passed ? "✓" : "!"}</span><h3>${passed ? "Theorie bestanden" : "Theorie nicht bestanden"}</h3><p>${theorySession?.correct || 0} von 5 Antworten waren richtig.${passed ? " Du kannst jetzt zur praktischen Prüfung antreten." : " Du kannst die fünf Fragen mit einer neuen Auswahl wiederholen."}</p><button class="primary-button" ${passed ? "data-driver-practical-intro" : "data-driver-retry-theory"}>${passed ? "Zur Praxis" : "Zurück"}</button></div>`);
    theorySession = null;
  }

  function renderPracticalIntro() {
    const data = ensureDriverState();
    const retry = data.practicalFailures > 0;
    const overlay = ensureDriverOverlay();
    overlay.innerHTML = driverShell(`<section class="driver-welcome practical"><div class="driver-road-preview"><i></i><b>🚙</b><span></span></div><h3>Praktische Prüfung</h3><p>Das Prüfungsfahrzeug fährt eine vollständige Strecke ab. Verkehrsbeobachtung und Fahrfehler werden während jedes Streckenabschnitts geprüft.</p>${retry ? `<div class="driver-fee"><small>Wiederholungsfahrt</small><b>${euro.format(DRIVER_PRACTICAL_RETRY_FEE)}</b></div>` : ""}<button class="primary-button" data-driver-start-practical data-driver-fee="${retry ? DRIVER_PRACTICAL_RETRY_FEE : 0}">${retry ? "Praktische Prüfung wiederholen" : "Praktische Prüfung starten"}</button></section>`);
    overlay.classList.add("show");
    document.body.classList.add("driver-school-open");
  }

  function startPractical(fee) {
    if (Number(fee) > 0 && !pay(Number(fee), false, { method: "auto", target: "treasury", taxRate: 0 })) {
      return showNotice("Führerscheinstelle", `Für die Wiederholung werden ${euro.format(Number(fee))} benötigt.`);
    }
    const data = ensureDriverState();
    const guaranteed = data.practicalFailures >= 2;
    const overlay = ensureDriverOverlay();
    let progress = 0;
    let direction = "right";
    overlay.innerHTML = driverShell(`<section class="driver-practical"><div class="driver-practical-stats"><b>Prüfungsfahrt</b><span data-driver-percent>0%</span></div><div class="driver-route direction-right" data-driver-route><span class="road-line"></span><b data-driver-car>🚗</b><i data-driver-fill></i><em data-driver-direction>Geradeaus fahren</em></div><div class="driver-progress large"><i data-driver-progress style="width:0%"></i></div><p data-driver-status>Fahrzeug und Spiegel werden geprüft …</p></section>`);
    const percentNode = overlay.querySelector("[data-driver-percent]");
    const progressNode = overlay.querySelector("[data-driver-progress]");
    const route = overlay.querySelector("[data-driver-route]");
    const status = overlay.querySelector("[data-driver-status]");
    const directionNode = overlay.querySelector("[data-driver-direction]");
    clearInterval(practicalTimer);
    practicalTimer = setInterval(() => {
      progress += 1;
      const chance = progress >= 90 ? 0.85 : 0.95;
      const success = guaranteed || Math.random() <= chance;
      if (!success) {
        clearInterval(practicalTimer);
        practicalTimer = null;
        data.practicalFailures += 1;
        safeSaveAndRender();
        setTimeout(() => renderPracticalResult(false, progress), 280);
        return;
      }
      if ([20, 40, 60, 80].includes(progress)) {
        direction = direction === "right" ? "up" : direction === "up" ? "left" : direction === "left" ? "down" : "right";
        route.className = `driver-route direction-${direction}`;
        directionNode.textContent = direction === "right" ? "Geradeaus fahren" : direction === "up" ? "Nach oben abbiegen" : direction === "left" ? "Links abbiegen" : "Gefällestrecke fahren";
      }
      percentNode.textContent = `${progress}%`;
      progressNode.style.width = `${progress}%`;
      route.style.setProperty("--driver-progress", `${progress}%`);
      status.textContent = progress < 25 ? "Stadtverkehr wird geprüft …" : progress < 50 ? "Kreuzungen und Vorfahrt werden geprüft …" : progress < 75 ? "Landstraße und Geschwindigkeit werden geprüft …" : progress < 90 ? "Einparken und Beobachtung werden geprüft …" : "Letzter Prüfungsabschnitt …";
      if (progress >= 100) {
        clearInterval(practicalTimer);
        practicalTimer = null;
        setTimeout(() => renderPracticalResult(true, 100), 300);
      }
    }, 72);
  }

  function renderPracticalResult(passed, progress) {
    const data = ensureDriverState();
    if (passed) {
      state.items ||= [];
      if (!state.items.includes("Führerschein")) state.items.push("Führerschein");
      data.licenseGranted = true;
      data.passedAtMs = Date.now();
      try { improveSkill("Fahren", 2); } catch { /* no-op */ }
      try { addXp(40, "Führerschein bestanden"); } catch { /* no-op */ }
      try { addFeed("Führerschein Klasse B bestanden und im Inventar gespeichert."); } catch { /* no-op */ }
    }
    safeSaveAndRender();
    const overlay = ensureDriverOverlay();
    overlay.innerHTML = driverShell(`<div class="driver-result ${passed ? "success" : "failed"}"><span>${passed ? "🏁" : "!"}</span><h3>${passed ? "Prüfung bestanden" : "Prüfungsfahrt beendet"}</h3><p>${passed ? "Du hast Theorie und Praxis erfolgreich abgeschlossen. Der Führerschein wurde deinem Charakter dauerhaft hinzugefügt." : `Die Fahrt wurde bei ${progress}% beendet. Übe weiter und starte anschließend eine neue Prüfungsfahrt.`}</p><button class="primary-button" ${passed ? "data-driver-close" : "data-driver-practical-intro"}>${passed ? "Fertig" : "Zur Wiederholung"}</button></div>`);
  }

  function closeDrivingSchool() {
    clearInterval(practicalTimer);
    practicalTimer = null;
    driverOverlay?.classList.remove("show");
    document.body.classList.remove("driver-school-open");
  }

  function driverClick(event) {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.matches("[data-driver-close]")) return closeDrivingSchool();
    if (button.matches("[data-driver-start-theory]")) return startTheory(button.dataset.driverFee);
    if (button.matches("[data-driver-answer]")) return answerTheory(button.dataset.driverAnswer);
    if (button.matches("[data-driver-retry-theory]")) return openDrivingSchool();
    if (button.matches("[data-driver-practical-intro]")) return renderPracticalIntro();
    if (button.matches("[data-driver-start-practical]")) return startPractical(button.dataset.driverFee);
  }

  function installDriverOffice() {
    try {
      if (!mapPlaces.some((place) => place.id === "licenseoffice")) {
        mapPlaces.push({ id: "licenseoffice", name: "Führerscheinstelle", icon: "F", x: 28, y: 7, kind: "Behörde", cost: 3, minutes: 16 });
      }
      if (!routes.some((route) => route.includes("licenseoffice"))) routes.push(["market", "licenseoffice"]);
      if (typeof renderMap === "function" && state && !document.getElementById("gameScreen")?.classList.contains("hidden")) renderMap();
    } catch (error) {
      console.error("Führerscheinstelle konnte nicht zur Karte hinzugefügt werden", error);
    }

    try {
      const originalLocalHtml = localPlaceActionsHtml;
      localPlaceActionsHtml = function patchedLocalPlaceActionsHtml() {
        const place = currentPlace();
        if (place?.id !== "licenseoffice") return originalLocalHtml();
        const data = ensureDriverState();
        const description = hasLicense()
          ? "Führerschein Klasse B vorhanden. Dein Dokument ist dauerhaft im Inventar gespeichert."
          : data.theoryPassed
            ? `Theorie bestanden. Praktische Fehlversuche: ${data.practicalFailures}.`
            : "Fünf einfache Theoriefragen und anschließend eine animierte praktische Prüfung.";
        return `<div class="shop-section local-place-section driver-office-place"><h3>Führerscheinstelle</h3>${card("Führerschein Klasse B", description, hasLicense() ? "Vorhanden" : data.theoryPassed ? "Praxis" : "Prüfung", "driving-school", hasLicense(), "local-action")}</div>`;
      };
      const originalAction = handleLocalPlaceAction;
      handleLocalPlaceAction = function patchedLocalPlaceAction(action) {
        if (action === "driving-school") return openDrivingSchool();
        return originalAction(action);
      };
    } catch (error) {
      console.error("Führerscheinstelle-Aktionen", error);
    }
  }

  function removeLicenseFromShop() {
    const isLicense = (item) => item?.item === "Führerschein" || /Führerschein Klasse B/i.test(String(item?.name || ""));
    try {
      for (let index = shopItems.length - 1; index >= 0; index -= 1) if (isLicense(shopItems[index])) shopItems.splice(index, 1);
      Object.values(shopMarketCatalog || {}).forEach((rows) => {
        if (!Array.isArray(rows)) return;
        for (let index = rows.length - 1; index >= 0; index -= 1) if (isLicense(rows[index])) rows.splice(index, 1);
      });
    } catch (error) {
      console.error("Führerschein aus Shop entfernen", error);
    }
  }

  function installLevelRules() {
    try {
      requiredMainTabLevel = function patchedRequiredMainTabLevel(tabName) {
        if (tabName === "casino") return 2;
        if (tabName === "realestate") return 3;
        return 0;
      };
      updateDashboardLevelLocks = function patchedDashboardLocks() {
        if (!state) return;
        document.querySelectorAll("[data-dashboard-tab]").forEach((button) => {
          const required = requiredMainTabLevel(button.dataset.dashboardTab);
          const locked = level() < required;
          button.classList.toggle("level-locked", locked);
          button.setAttribute("aria-disabled", locked ? "true" : "false");
          button.title = locked ? "Noch nicht freigeschaltet" : "Öffnen";
          button.querySelectorAll("[data-level-lock]").forEach((badge) => badge.remove());
        });
      };
    } catch (error) { console.error("Dashboard-Levelregeln", error); }

    try {
      const originalLogistics = openLogisticsCenterDialog;
      openLogisticsCenterDialog = function patchedOpenLogisticsCenterDialog(...args) {
        if (level() < 3) return showLocked("Logistikzentrum", 3);
        return originalLogistics(...args);
      };
      const originalPlayerShop = openPlayerShopDialog;
      openPlayerShopDialog = function patchedOpenPlayerShopDialog(...args) {
        if (level() < 7) return showLocked("Eigener Shop", 7);
        return originalPlayerShop(...args);
      };
      const originalBusinessMap = openBusinessMap;
      openBusinessMap = function patchedOpenBusinessMap(...args) {
        if (level() < 6) return showLocked("Business Map", 6);
        return originalBusinessMap(...args);
      };
      if (window.WeedKL?.open) {
        const originalWeedOpen = window.WeedKL.open.bind(window.WeedKL);
        window.WeedKL.open = (...args) => level() < 6 ? showLocked("Weed Business", 6) : originalWeedOpen(...args);
      }
    } catch (error) { console.error("Bereichs-Levelregeln", error); }

    document.addEventListener("click", (event) => {
      const upcoming = event.target.closest("[data-upcoming-area]");
      if (upcoming) {
        event.preventDefault();
        event.stopImmediatePropagation();
        showNotice("Zentrale", "Wird noch hinzugefügt.");
        return;
      }
      const weed = event.target.closest("[data-business-weed]");
      if (weed && level() < 6) {
        event.preventDefault();
        event.stopImmediatePropagation();
        showLocked("Weed Business", 6);
        return;
      }
      const businessMap = event.target.closest("[data-business-map-open]");
      if (businessMap && level() < 6) {
        event.preventDefault();
        event.stopImmediatePropagation();
        showLocked("Business Map", 6);
      }
    }, true);
  }

  function installTutorialHooks() {
    try {
      introSteps.splice(0, introSteps.length,
        ["Dein Profil", "Tippe auf deinen Charakter, um Inventar, Skills, Erfolge, Aussehen, Weltinfo, Dokumente und dein ausgewähltes Haustier zu öffnen."],
        ["Status & Geld", "Hunger, Durst und Energie führen zum Inventar. Bargeld bleibt mindestens 0 €. Dein Bankkonto darf bis zur angezeigten Dispo-Grenze ins Minus gehen."],
        ["Zuhause & Stadt", "Jeder neue Charakter erhält eine zugängliche Startwohnung. Über Zuhause oder Ausgang erreichst du deine Räume und anschließend die Stadtkarte – auch ohne Handy."],
        ["Arbeit", "Automatische und manuelle Arbeit sind sofort verfügbar. In der Mine bewegt sich das Ziel nach jedem Treffer; Auto-Clicker-Muster werden erkannt und nicht vergütet."],
        ["Smartphone & Online", "Apps können SIM, Guthaben, Online-Banking oder ein bestimmtes Level benötigen. Finder.KL und Finster.KL verbinden dich mit echten Online-Spielern."],
        ["Haustiere & Charakter", "Haustiere werden über Tierheim und persönliches Tiermenü versorgt. Welches Tier am Charakter erscheint, wählst du in Charakter anpassen aus."],
        ["Level-Tutorials", "Sobald ein Level einen wichtigen Bereich freischaltet, erscheint automatisch eine kurze Übersicht. Verpasste Freischaltungen werden geordnet nachgeholt."],
        ["Start", "Baue dein Leben Schritt für Schritt auf. Gesperrte Bereiche zeigen beim Anklicken ihre Voraussetzung; Notlagen blockieren niemals den Ausgang zur Stadtkarte."]
      );
    } catch (error) { console.error("Starttutorial", error); }

    try {
      const originalAddXp = addXp;
      addXp = function patchedAddXp(...args) {
        const before = level();
        const result = originalAddXp(...args);
        const after = level();
        if (after > before) {
          for (let current = before + 1; current <= after; current += 1) if (LEVEL_MILESTONES[current]) setTimeout(() => queueLevelTutorial(current), 450);
        }
        return result;
      };
      const originalPurchase = completeShopPurchase;
      completeShopPurchase = function patchedCompleteShopPurchase(...args) {
        const beforeTier = (() => { try { const item = ownedPhoneItem(); return item ? deviceTier(item) : -1; } catch { return -1; } })();
        const result = originalPurchase(...args);
        setTimeout(() => {
          try {
            const item = ownedPhoneItem();
            const afterTier = item ? deviceTier(item) : -1;
            if (afterTier > beforeTier) queuePhoneTutorial(afterTier);
          } catch { /* no-op */ }
        }, 250);
        return result;
      };
    } catch (error) { console.error("Tutorial-Hooks", error); }
  }

  function installUiBindings() {
    document.getElementById("whatsNewBtn")?.addEventListener("click", () => showPatchNotes(true));
    const settingsPanel = document.querySelector("#settingsView .settings-panel");
    if (settingsPanel && !document.getElementById("whatsNewBtn")) {
      const button = document.createElement("button");
      button.id = "whatsNewBtn";
      button.className = "secondary-button settings-wide whats-new-settings-button";
      button.textContent = "Neuheiten";
      button.addEventListener("click", () => showPatchNotes(true));
      settingsPanel.appendChild(button);
    }
  }

  function installGenericLockLabels() {
    try {
      const originalDeviceAppsFor = deviceAppsFor;
      deviceAppsFor = function patchedDeviceAppsFor(item) {
        return originalDeviceAppsFor(item).map((app) => ({
          ...app,
          shortLockLabel: app.locked ? "Gesperrt" : ""
        }));
      };
    } catch (error) { console.error("App-Sperrhinweise", error); }
  }

  function bootWhenReady() {
    const timer = setInterval(() => {
      if (!state || document.getElementById("gameScreen")?.classList.contains("hidden")) return;
      // Das normale Starttutorial darf nicht vom Neuheitenfenster überlagert werden.
      if (!state.introDone || document.querySelector("dialog[open]")) return;
      clearInterval(timer);
      ensureGuidanceState();
      ensureDriverState();
      updateDashboardLevelLocks?.();
      setTimeout(() => showPatchNotes(false), 350);
    }, 350);
    setTimeout(() => clearInterval(timer), 90000);
  }

  removeLicenseFromShop();
  installDriverOffice();
  installLevelRules();
  installTutorialHooks();
  installUiBindings();
  installGenericLockLabels();
  bootWhenReady();

  window.LifeBuilderUpdate20260724 = {
    version: UPDATE_VERSION,
    showPatchNotes: () => showPatchNotes(true),
    openDrivingSchool,
    showLevelTutorial: (value) => queueLevelTutorial(Number(value)),
    getDrivingSchoolState: () => ensureDriverState()
  };
})();
