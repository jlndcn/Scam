# PRD – WhatsApp Business Stabilitätslösung Landingpage

## Original Problem Statement
Erstellung einer professionellen, modernen Landingpage für das fiktive Produkt „WhatsApp Business Stabilitätslösung" mit klarer Positionierung (nur WhatsApp Business), Garantie- und Bedingungenstexten, Paketdarstellung, Anfrageformular ohne Login, Ablaufsektion, FAQ und rechtlichem Footer.

## Architektur-Entscheidungen
- **Frontend:** React Single-Page Landingpage mit modularen UI-Abschnitten, Shadcn-Komponenten (Button, Input, Select, Checkbox, Accordion, Textarea), Sonner-Toasts, Framer-Motion für Entrance-Animationen.
- **Backend:** FastAPI Endpoint `/api/inquiries` zur Speicherung von Anfragen in MongoDB; Validierung via Pydantic inkl. paketabhängiger Rufnummernlimits.
- **Datenmodell:** Anfrage enthält E-Mail, `business_numbers[]`, Pakettyp, optional Name/Firma, akzeptierte Bedingungen, Status und Zeitstempel.
- **Design:** Vollständig deutschsprachig, Dark-Premium Stil, ohne Anzugfoto, mit technischer Hero-Visualisierung und QR-Platzhalter.

## Was implementiert wurde
- Vollständige Landingpage mit allen geforderten Bereichen (Hero, Hinweis, Problem, Lösung, Garantie, Pakete, Formular, Ablauf, FAQ, Footer).
- Formularfluss mit Live-Validierung und Backend-Speicherung inkl. Erfolgsmeldung.
- Neue Mehrfach-Rufnummernlogik: **Monatlich max. 5**, **Lifetime max. 3** (Frontend + Backend abgesichert).
- Titel geändert auf: **„API-Einstellung und Anleitung anfordern“**.
- Dark-Premium Redesign umgesetzt und Bild mit Anzug entfernt.
- API- und Regressionstests aktualisiert; aktuelle Tests bestanden.

## Priorisierter Backlog
### P0
- Rechtstexte als echte Seiten/Inhalte hinter Impressum, Datenschutz, AGB, Garantiebedingungen, Kontakt verlinken.
- E-Mail-Workflow für Zahlungsaufforderung und Anleitung automatisieren.

### P1
- Admin-Übersicht für eingegangene Anfragen (Filter nach Paket, Datum, Rufnummernanzahl).
- Soft-CRM Export (CSV) für Follow-up und Rechnungsprozesse.

### P2
- A/B-Tests für Hero-Text und CTA-Texte.
- Trust-Elemente erweitern (z. B. Fallbeispiele, Qualitätskennzahlen).

## Nächste konkrete Tasks
1. Echte rechtliche Zielseiten ergänzen und Footer-Buttons darauf routen.
2. Transaktionale E-Mail-Anbindung für Zahlungsaufforderung integrieren.
3. Optionales Captcha/Spam-Schutz für das Formular ergänzen.
