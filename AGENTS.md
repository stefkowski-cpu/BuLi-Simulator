# AGENTS.md

## Arbeitsregeln

- Hauptbranch: `main`.
- Zielplattform: responsive React-TypeScript-PWA mit Vite.
- Deployment-Ziel: GitHub Pages im Repository `stefkowski-cpu/BuLi-Simulator`.
- GitHub-Pages-Basispfad: `/BuLi-Simulator/`.
- Produktspezifikation: siehe [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md).
- Phase 1 und der erste spielbare Teil von Phase 2 sind aktuell priorisiert.
- Demo-Daten sind erlaubt, bis Importfunktionen vorhanden sind.

## Qualitätsregeln

- Vor einem Release mindestens ausführen: `npm run typecheck`, `npm test`, `npm run build`.
- Persistente Spieldaten werden lokal über IndexedDB/Dexie gespeichert.
- Neue Spiellogik soll durch fokussierte Tests abgesichert werden.
