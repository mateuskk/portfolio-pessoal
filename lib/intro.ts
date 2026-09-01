export const INTRO_SESSION_KEY = "portfolio-intro-complete";
export const INTRO_COMPLETE_EVENT = "portfolio:intro-complete";

export function completeIntro() {
  window.sessionStorage.setItem(INTRO_SESSION_KEY, "true");
  window.dispatchEvent(new Event(INTRO_COMPLETE_EVENT));
}
