"use client";

import { useEffect } from "react";

function isEditableElement(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName.toLowerCase();

  if (tag === "textarea" || tag === "select") return true;
  if (tag === "input") {
    const input = el as HTMLInputElement;
    const type = (input.getAttribute("type") || "text").toLowerCase();
    // Treat most input types as editable; exclude obvious non-text controls.
    return ![
      "button",
      "submit",
      "reset",
      "checkbox",
      "radio",
      "range",
      "color",
      "file",
      "image",
    ].includes(type);
  }

  // contenteditable
  if ((el as HTMLElement).isContentEditable) return true;

  return false;
}

function getKeyboardMetrics() {
  const vv = window.visualViewport;
  const innerH = window.innerHeight;

  const viewportH = vv?.height ?? innerH;
  const offsetTop = vv?.offsetTop ?? 0;

  // Approximate keyboard height as the part of the layout viewport not visible in the visual viewport.
  // Subtract offsetTop to handle cases where the visual viewport is shifted (iOS).
  const keyboardPx = vv ? Math.max(0, innerH - vv.height - offsetTop) : 0;

  return { viewportH, keyboardPx };
}

export function MobileUiGuards() {
  useEffect(() => {
    const root = document.documentElement;
    let focusActive = false;
    let raf = 0;
    let debounceTimer: number | undefined;

    const updateIsMobile = () => {
      const isMobile =
        window.matchMedia?.("(max-width: 640px)").matches ||
        window.matchMedia?.("(pointer: coarse)").matches ||
        window.matchMedia?.("(hover: none)").matches;
      root.dataset.isMobile = isMobile ? "1" : "0";
    };

    const updateStickyPresence = () => {
      const hasSticky = !!document.querySelector(
        "[data-sticky-footer-actions='1'], [data-form-sticky-actions='1']"
      );
      root.dataset.hasStickyFooter = hasSticky ? "1" : "0";
    };

    const updateViewportVars = () => {
      const { viewportH, keyboardPx } = getKeyboardMetrics();
      root.style.setProperty("--visual-viewport-height", `${viewportH}px`);
      root.style.setProperty("--keyboard-height", `${keyboardPx}px`);

      // Only treat keyboard as "open" when an editable is focused.
      // This avoids false positives on address bar / toolbar changes.
      const kbOpen = focusActive && keyboardPx > 120;
      root.dataset.kbOpen = kbOpen ? "1" : "0";
    };

    const scheduleUpdate = () => {
      // iOS keyboard transitions can fire many visualViewport events.
      // Debounce slightly so bottom-anchored UI doesn't resize through intermediate states.
      if (debounceTimer) window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          updateIsMobile();
          updateStickyPresence();
          updateViewportVars();
        });
      }, 60);
    };

    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as Element | null;
      if (isEditableElement(target)) {
        focusActive = true;
        root.dataset.inputFocus = "1";
        scheduleUpdate();
      }
    };

    const onFocusOut = () => {
      // Defer: focus may move to another input immediately.
      window.setTimeout(() => {
        const active = document.activeElement as Element | null;
        focusActive = isEditableElement(active);
        root.dataset.inputFocus = focusActive ? "1" : "0";
        scheduleUpdate();
      }, 0);
    };

    const mo = new MutationObserver(() => {
      updateStickyPresence();
    });

    updateIsMobile();
    updateStickyPresence();
    updateViewportVars();

    window.addEventListener("resize", scheduleUpdate, { passive: true });
    window.addEventListener("orientationchange", scheduleUpdate, { passive: true });
    document.addEventListener("focusin", onFocusIn, true);
    document.addEventListener("focusout", onFocusOut, true);
    window.visualViewport?.addEventListener("resize", scheduleUpdate, { passive: true });
    window.visualViewport?.addEventListener("scroll", scheduleUpdate, { passive: true });
    mo.observe(document.body, { subtree: true, childList: true, attributes: true });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (debounceTimer) window.clearTimeout(debounceTimer);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("orientationchange", scheduleUpdate);
      document.removeEventListener("focusin", onFocusIn, true);
      document.removeEventListener("focusout", onFocusOut, true);
      window.visualViewport?.removeEventListener("resize", scheduleUpdate);
      window.visualViewport?.removeEventListener("scroll", scheduleUpdate);
      mo.disconnect();
    };
  }, []);

  return null;
}

