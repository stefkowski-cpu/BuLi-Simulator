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

Der Workflow `.github/workflows/pages.yml` baut die App und deployed `dist/` nach GitHub Pages. In GitHub muss unter **Settings > Pages** als Source **GitHub Actions** aktiviert werden.

## Aktueller Umfang

- Verein aus Demo-Daten auswaehlen.
- Dashboard mit Budget, Moral, Fan-Stimmung, Tabellenplatz und naechstem Spiel.
- Spieltag simulieren.
- Tabelle und Vereinswerte lokal speichern.
- PWA-Manifest und Service Worker.

Die Produktspezifikation liegt in `docs/PRODUCT_SPEC.md`.
