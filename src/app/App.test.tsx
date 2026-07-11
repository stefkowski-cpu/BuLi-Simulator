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
});
