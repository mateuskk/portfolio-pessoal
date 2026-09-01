import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { INTRO_COMPLETE_EVENT, INTRO_SESSION_KEY } from "@/lib/intro";
import { useIntroReady } from "./use-intro-ready";

function IntroState() {
  const ready = useIntroReady();
  return <output aria-label="Intro state">{ready ? "ready" : "waiting"}</output>;
}

describe("useIntroReady", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("releases opening motion only after the loader completes", () => {
    render(<IntroState />);
    expect(screen.getByRole("status", { name: "Intro state" })).toHaveTextContent("waiting");

    act(() => {
      window.sessionStorage.setItem(INTRO_SESSION_KEY, "true");
      window.dispatchEvent(new Event(INTRO_COMPLETE_EVENT));
    });

    expect(screen.getByRole("status", { name: "Intro state" })).toHaveTextContent("ready");
  });
});
