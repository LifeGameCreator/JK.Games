/*
 JK.Games WebRTC-Konfiguration · Telefon/TURN-Fix V74 2026-07-28

 Firebase/Firestore übernimmt das Signaling. STUN reicht für viele direkte
 Verbindungen. Für Gespräche zwischen unterschiedlichen Mobilfunk-, Firmen-
 oder streng gefilterten WLAN-Netzen wird zusätzlich ein TURN-Dienst benötigt.

 turnCredentialsUrl darf eine HTTPS-Adresse sein, die ein ICE-Server-Array
 oder { "iceServers": [...] } zurückgibt. Keine geheimen TURN-Passwörter direkt
 in dieses öffentliche GitHub-Repository eintragen.
*/
window.LifeBuilderRtcConfig = {
  iceServers: [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302"
      ]
    }
  ],

  // Kurzlebige Cloudflare-TURN-Zugangsdaten werden serverseitig erzeugt.
  // Die geheimen TURN-Schlüssel bleiben als Worker-Secrets bei Cloudflare.
  turnCredentialsUrl: "https://arena-kl-realtime.arena-kl-julian.workers.dev/turn-credentials"
};


/*
 V74-Hinweis:
 app.js filtert Cloudflare-Port 53 sowie überzählige Transportvarianten.
 Verwendet werden vorrangig TURN/UDP 3478 und TURN/TLS 443.
*/
