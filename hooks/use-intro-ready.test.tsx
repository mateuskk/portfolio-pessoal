import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { completeIntro, startIntro } from "@/lib/intro";
import { useIntroReady } from "./use-intro-ready";

function IntroState() {
  const ready = useIntroReady();
  return <output aria-label="Intro state">{ready ? "ready" : "waiting"}</output>;
}

describe("useIntroReady", () => {
  beforeEach(() => startIntro());

  it("releases opening motion only after the loader completes", () => {
    render(<IntroState />);
    expect(screen.getByRole("status", { name: "Intro state" })).toHaveTextContent("waiting");

    act(() => {
      completeIntro();
    });

    expect(screen.getByRole("status", { name: "Intro state" })).toHaveTextContent("ready");
  });
});
