"use client";

import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Languages } from "lucide-react";

import { useLanguage } from "@/components/providers/language-provider";
import type { LanguageCode } from "@/lib/ui-copy";
import { cn } from "@/lib/utils";

type Language = {
  code: LanguageCode;
  /** Named in its own language, the way a reader looking for it would scan. */
  label: string;
};

export const LANGUAGES: Language[] = [
  { code: "en", label: "English" },
  { code: "pt", label: "Português" },
];

export function LanguageSwitch() {
  const { language, setLanguage, copy } = useLanguage();
  /*
    Controlled so that choosing closes it. Left to itself the panel stayed open
    over a page that had just changed language underneath it, which reads as the
    click not having landed.
  */
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root onOpenChange={setOpen} open={open}>
      <Popover.Trigger
        aria-label={copy.language}
        className="focus-ring grid size-10 [@media(pointer:coarse)]:size-11 place-items-center rounded-full border border-white/15 text-paper transition-colors hover:bg-paper hover:text-ink data-popup-open:bg-paper data-popup-open:text-ink"
        data-testid="language-switch"
      >
        <Languages aria-hidden="true" className="size-[18px]" />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner align="end" className="isolate z-[130]" side="bottom" sideOffset={10}>
          <Popover.Popup
            className="w-48 origin-(--transform-origin) rounded-xl border border-white/15 bg-graphite p-1.5 shadow-2xl data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
            data-testid="language-panel"
          >
            {/*
              Radio inputs rather than buttons with a role: this is one choice
              out of a fixed set, which is what a radio group is for, and using
              the real element is what makes arrow keys and the "one of two"
              announcement work without writing either.
            */}
            <fieldset>
              <legend className="sr-only">{copy.siteLanguage}</legend>
              {LANGUAGES.map((option) => {
                const selected = option.code === language;

                return (
                  <label
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      "has-focus-visible:outline has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-paper",
                      selected
                        ? "bg-white/10 text-paper"
                        : "text-muted-foreground hover:bg-white/10 hover:text-paper",
                    )}
                    data-testid={`language-option-${option.code}`}
                    key={option.code}
                  >
                    <input
                      checked={selected}
                      className="sr-only"
                      name="site-language"
                      /*
                        Both handlers close it, and each covers a case the other
                        misses. `change` never fires for a radio that is already
                        the selected one, so picking the language the site is in
                        left the panel sitting open, which reads as the tap not
                        landing; `click` never fires when the choice is moved
                        with the arrow keys. Choosing is the intent to close,
                        whether or not anything changed.
                      */
                      onChange={() => {
                        setLanguage(option.code);
                        setOpen(false);
                      }}
                      onClick={() => setOpen(false)}
                      type="radio"
                      value={option.code}
                    />
                    <span>{option.label}</span>
                    {selected ? <span aria-hidden="true">✓</span> : null}
                  </label>
                );
              })}
            </fieldset>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
