import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../db/gameDb";
import { App } from "./App";

describe("App", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it("lets the user pick a club and open the dashboard", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/clubs"]}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "BuLi Simulator" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Borussia Dortmund/i }));

    expect(await screen.findByRole("heading", { name: "Borussia Dortmund" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Spieltag simulieren" })).toBeEnabled();
  });
});
