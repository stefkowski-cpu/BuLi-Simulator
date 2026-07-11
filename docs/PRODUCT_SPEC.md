# BuLi Simulator Produktspezifikation

Diese Datei ist der zentrale Ort fuer die ausfuehrliche Produktspezifikation. Die urspruenglich erwartete Spezifikation in `AGENTS.md` war beim Einrichten des Projekts leer, deshalb beschreibt dieses Dokument den aktuellen, umgesetzten Startumfang und die naechsten Ausbauphasen.

## Produktvision

BuLi Simulator ist eine responsive Progressive Web App, in der Nutzer einen deutschen Fussballverein durch eine Saison fuehren. Die App soll schnell starten, offline nutzbar sein und spaeter ueber GitHub Pages bereitgestellt werden.

## Phase 1: Fundament

- React, TypeScript und Vite als App-Basis.
- Responsive PWA mit Manifest und Service Worker.
- Routing fuer Dashboard und Vereinsauswahl.
- Lokale Persistenz ueber IndexedDB/Dexie.
- Demo-Daten fuer Clubs und Spieltage.
- Validierung der Demo-Daten mit Zod.
- Tests fuer Kernlogik und Render-Verhalten.
- GitHub Actions fuer Test, Build und GitHub-Pages-Deployment.

## Phase 2: Erster spielbarer Teil

- Nutzer waehlt einen Verein.
- Dashboard zeigt Budget, Moral, Fan-Stimmung, Tabellenplatz und naechstes Spiel.
- Ein Spieltag kann simuliert werden.
- Ergebnis, Tabelle und Vereinswerte werden aktualisiert.
- Spielstand wird lokal gespeichert und kann zurueckgesetzt werden.

## Spaetere Phasen

- Importer fuer echte oder nutzerdefinierte Daten.
- Vollstaendige Saisonplanung.
- Transfermarkt, Kaderentwicklung und Verletzungen.
- Taktiksystem mit Formation, Pressing, Risiko und Rotation.
- Finanzsystem mit Sponsoren, Ticketing und Gehaeltern.
- Historie, Statistiken und Erfolge.
- Balancing- und Schwierigkeitssystem.
