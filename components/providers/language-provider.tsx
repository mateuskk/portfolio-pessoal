"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";

import { portfolioContent, type PortfolioContent } from "@/content/portfolio";
import { portfolioContentPt } from "@/content/portfolio-pt";
import { UI_COPY, type LanguageCode, type UiCopy } from "@/lib/ui-copy";

const CONTENT: Record<LanguageCode, PortfolioContent> = {
  en: portfolioContent,
  pt: portfolioContentPt,
};

/** Where the choice is kept, so a return visit opens in the same language. */
export const LANGUAGE_KEY = "portfolio-language";

/** What `<html lang>` becomes, which is what a screen reader reads the page in. */
const HTML_LANG: Record<LanguageCode, string> = { en: "en", pt: "pt-BR" };

export function isLanguageCode(value: unknown): value is LanguageCode {
  return value === "en" || value === "pt";
}

/**
 * The choice lives outside React, and React subscribes to it.
 *
 * `useSyncExternalStore` rather than state seeded by an effect: the stored
 * language is exactly the kind of thing that exists before the component does
 * and that the server cannot see. Read in an effect it would mean a render in
 * the wrong language and a cascading re-render to correct it; read here, React
 * renders the server's answer, compares, and settles in one pass.
 */
let cached: LanguageCode | null = null;
const listeners = new Set<() => void>();

function readStored(): LanguageCode {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_KEY);
    return isLanguageCode(stored) ? stored : "en";
  } catch {
    // Private browsing, or storage refused. English is a fine answer.
    return "en";
  }
}

function getSnapshot(): LanguageCode {
  cached ??= readStored();
  return cached;
}

/** The server has no storage to read, so it always renders English. */
function getServerSnapshot(): LanguageCode {
  return "en";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function writeLanguage(code: LanguageCode) {
  cached = code;
  try {
    window.localStorage.setItem(LANGUAGE_KEY, code);
  } catch {
    // Remembering is a convenience, not a requirement.
  }
  for (const listener of listeners) listener();
}

type LanguageValue = {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  content: PortfolioContent;
  copy: UiCopy;
};

const LanguageContext = createContext<LanguageValue>({
  language: "en",
  setLanguage: writeLanguage,
  content: portfolioContent,
  copy: UI_COPY.en,
});

export function useLanguage() {
  return useContext(LanguageContext);
}

/** The interface's own words, for the many components that need nothing else. */
export function useCopy() {
  return useContext(LanguageContext).copy;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Kept in step with the document itself, so assistive technology announces
  // the page in the language it is actually written in.
  useEffect(() => {
    document.documentElement.lang = HTML_LANG[language];
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: writeLanguage,
        content: CONTENT[language],
        copy: UI_COPY[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}
