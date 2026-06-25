# PRD – WhatsApp Business/API Landingpage (Redesign + SMTP Inquiry Flow)

## Original Problem Statement
Die bestehende Landingpage soll vollständig modernisiert und erweitert werden: Dark-Premium SaaS-Optik mit WhatsApp-Grün als Akzent, Glassmorphism, dezente Glow-Effekte, Scroll-Reveal, Hero mit Parallax-Gefühl, klare Conversion-Struktur, vollständige Inhaltssektionen und professioneller Formflow ohne unseriöse Claims.

## Architektur-Entscheidungen
- **Frontend (React):** Einseitige Landingpage mit Motion-Reveal + Parallax-Hero, Glassmorphism-Komponenten, responsivem Layout und CTA-fokussierter Struktur.
- **Backend (FastAPI + MongoDB):** `/api/inquiries` validiert und speichert alle Formularangaben als strukturierte Anfrage.
- **E-Mail-Versand:** SMTP-Versand vollständig implementiert, ausschließlich ENV-basiert (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `INQUIRY_RECEIVER_EMAIL`).
- **Fail-Safe-Logik:** Bei SMTP-Fehler oder fehlender SMTP-Config wird Anfrage trotzdem gespeichert, Fehler intern geloggt und nutzerfreundliche Fallback-Meldung angezeigt.

## Implementiert
- Komplette Premium-Dark-SaaS-Landingpage mit WhatsApp-Grün als Akzent und modernen Glass-Cards.
- Sticky Navigation mit Scroll-Links (Vorteile, Pakete, Ablauf, FAQ, Kontakt) + klaren CTA-Pfaden.
- Hero mit hochwertigem Dashboard-/Chat-/KPI-/API-Key-Mockup inkl. Parallax-Gefühl.
- Hinweis-Banner, 3 Content-Cards, Leistungs-Premium-Card, Pricing (150€ Monat / 600€ Lifetime, Lifetime hervorgehoben), Timeline, Support/Sicherheit, FAQ, Footer.
- Neues Formular mit allen Pflichtfeldern + 4 Pflicht-Checkboxen + professionellem Hinweistext.
- Backend speichert Anfrage + versucht E-Mail-Zustellung an `INQUIRY_RECEIVER_EMAIL`; Antwort enthält `email_delivery_status` für UX-Meldung.
- Formular auf 4 Kernfelder reduziert (E-Mail, WhatsApp Business Account Name, Rufnummer(n), Paket) und API-Contract entsprechend vereinfacht.
- Hero-Kicker/Abstands-System überarbeitet, Timeline auf 01–05 geändert, Ablauf visuell aufgewertet und Mobile-Readability stark optimiert.

## Priorisierter Backlog
### P0
- Reale Impressum/Datenschutz/AGB/Kontakt-Zielseiten ergänzen.
- SMTP-Zugangsdaten im `.env` setzen und Live-Mailversand produktiv schalten.

### P1
- Optionales internes Admin-Panel für Anfrage-Status (neu, kontaktiert, abgeschlossen).
- Serverseitige Rate-Limits/Captcha als zusätzlicher Formularschutz.

### P2
- Erweiterte Vertrauenssektion (Use Cases, Kundenstimmen, Sicherheits-Hinweise).
- Conversion-A/B-Tests für Hero-Subheadline und Pricing-CTA-Texte.

## Nächste konkrete Tasks
1. SMTP-ENV befüllen und Testmail durchlaufen.
2. Footer-Platzhalter durch echte Rechtsseiten ersetzen.
3. Optionales Anfrage-Tracking im Backend ergänzen (Statuswechsel + Notizen).
