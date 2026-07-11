import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../db/gameDb";
import { App } from "./App";

describe("App", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    vi.restoreAllMocks();
  });

  it("navigates from dashboard to table, club and player pages", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "BuLi Simulator" })).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: /Tabelle 1\. Bundesliga/ }));
    expect(await screen.findByRole("heading", { name: "1. Bundesliga" })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "FC Muenchen" }));
    expect(await screen.findByRole("heading", { name: "FC Muenchen" })).toBeInTheDocument();

    const squad = screen.getByRole("heading", { name: "Kader" }).closest("section")!;
    await user.click(within(squad).getAllByRole("link")[0]);
    expect(await screen.findByText(/Rueckennummer/)).toBeInTheDocument();
  });

  it("simulates all open matches and shows dice controls", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <MemoryRouter initialEntries={["/matchdays"]}>
        <App />
      </MemoryRouter>
    );

    const simulateAll = await screen.findByRole("button", { name: "Alle Spiele simulieren" });
    expect(simulateAll.querySelector("svg")).toBeInTheDocument();
    expect(simulateAll).toHaveAttribute("title", "Alle offenen Spiele dieses Spieltags simulieren");

    await user.click(simulateAll);
    expect(await screen.findAllByText("vorbereitet")).toHaveLength(3);
  });

  it("shows flags with accessible country names and keeps mobile nav reachable", async () => {
    render(
      <MemoryRouter initialEntries={["/players"]}>
        <App />
      </MemoryRouter>
    );

    expect((await screen.findAllByLabelText("Deutschland")).length).toBeGreaterThan(0);
    expect(screen.getByRole("navigation", { name: "Hauptnavigation" })).toHaveTextContent("Spieltage");
    expect(screen.getByRole("navigation", { name: "Hauptnavigation" })).toHaveTextContent("Statistiken");
  });

  it("opens a specific matchday directly and keeps it selected on reload", async () => {
    const first = render(
      <MemoryRouter initialEntries={["/matchdays/2"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Spieltag 2" })).toBeInTheDocument();
    first.unmount();

    // Simulating a browser reload: a fresh mount straight at the same deep link.
    render(
      <MemoryRouter initialEntries={["/matchdays/2"]}>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByRole("heading", { name: "Spieltag 2" })).toBeInTheDocument();
  });

  it("navigates forward and backward between matchdays", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/matchdays/2"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Spieltag 2" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Naechster Spieltag" }));
    expect(await screen.findByRole("heading", { name: "Spieltag 3" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Vorheriger Spieltag" }));
    expect(await screen.findByRole("heading", { name: "Spieltag 2" })).toBeInTheDocument();
  });

  it("redirects bare /matchdays to the current matchday", async () => {
    render(
      <MemoryRouter initialEntries={["/matchdays"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Spieltag 1" })).toBeInTheDocument();
  });

  it("redirects gracefully for missing or invalid ids instead of crashing", async () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={["/clubs/does-not-exist"]}>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByRole("heading", { name: "Alle Vereine" })).toBeInTheDocument();
    unmount();

    const playerRender = render(
      <MemoryRouter initialEntries={["/players/does-not-exist"]}>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByRole("heading", { name: "Alle Spieler" })).toBeInTheDocument();
    playerRender.unmount();

    const matchdayRender = render(
      <MemoryRouter initialEntries={["/matchdays/not-a-number"]}>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByRole("heading", { name: "Spieltag 1" })).toBeInTheDocument();
    matchdayRender.unmount();

    render(
      <MemoryRouter initialEntries={["/matches/does-not-exist"]}>
        <App />
      </MemoryRouter>
    );
    expect(await screen.findByRole("heading", { name: "Spieltag 1" })).toBeInTheDocument();
  });
});
