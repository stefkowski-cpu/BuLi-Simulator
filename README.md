# BuLi Simulator

Responsive React-TypeScript-PWA fuer einen Bundesliga-Management-Simulator. Die App nutzt Demo-Daten, speichert den Spielstand lokal in IndexedDB und ist fuer GitHub Pages unter `/BuLi-Simulator/` vorbereitet.

## Lokal starten

```bash
npm install
npm run dev
```

## Pruefen

```bash
npm run typecheck
npm test
npm run build
```

## GitHub Pages

Der Workflow `.github/workflows/pages.yml` prueft die App, baut `dist/` und veroeffentlicht den Build auf dem Branch `gh-pages`. In GitHub muss unter **Settings > Pages** als Source **Deploy from a branch** mit Branch `gh-pages` und Ordner `/ (root)` aktiviert werden.

## Aktueller Umfang

- Verein aus Demo-Daten auswaehlen.
- Spieltagsuebersicht mit allen Partien des aktuellen Spieltags.
- Jede Partie einzeln bearbeiten, manuell erfassen oder per Zufallsergebnis vorbereiten.
- Detailseite je Spiel mit Aufstellungen, Ersatzbank, Wechseln, Toren, Vorlagen, Karten, Minuten und Noten.
- Kontrolluebersicht vor dem Spieltagsabschluss.
- Tabelle, Vereinsstatistiken und Spielerstatistiken aus abgeschlossenen Spielen neu berechnen.
- Lokale Speicherung per IndexedDB, PWA-Manifest und Service Worker.

Die Produktspezifikation liegt in `docs/PRODUCT_SPEC.md`.
