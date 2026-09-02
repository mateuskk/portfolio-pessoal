export const INTRO_COMPLETE_EVENT = "portfolio:intro-complete";

let introComplete = false;

export function startIntro() {
  introComplete = false;
}

export function isIntroComplete() {
  return introComplete;
}

export function completeIntro() {
  introComplete = true;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(INTRO_COMPLETE_EVENT));
  }
}
