"use client";

export function SkipLink() {
  const moveFocusToContent = () => {
    window.setTimeout(() => document.getElementById("main-content")?.focus({ preventScroll: true }), 0);
  };

  return (
    <a
      href="#main-content"
      className="focus-ring fixed left-4 top-3 z-[190] -translate-y-[160%] bg-paper px-4 py-3 text-label uppercase text-ink transition-transform focus:translate-y-0"
      onClick={moveFocusToContent}
    >
      Skip to content
    </a>
  );
}
