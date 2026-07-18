"use client";

import type { MouseEvent, ReactNode } from "react";

type DocShellLayoutProps = {
  left: ReactNode;
  right?: ReactNode;
  children: ReactNode;
};

/** Scroll a section into view inside the center doc column (not the window). */
export function scrollDocSection(id: string) {
  const el = document.getElementById(id);
  const scroller = document.querySelector<HTMLElement>(".doc-shell-main");
  if (!el || !scroller) return;

  const offset = 16;
  const top =
    scroller.scrollTop + (el.getBoundingClientRect().top - scroller.getBoundingClientRect().top) - offset;
  scroller.scrollTo({ top, behavior: "smooth" });
  window.history.replaceState(null, "", `#${id}`);
}

export function onDocSectionClick(id: string) {
  return (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    scrollDocSection(id);
  };
}

/** Three-column doc chrome: fixed side panels, scrollable center article only. */
export function DocShellLayout({ left, right, children }: DocShellLayoutProps) {
  return (
    <div className="doc-shell-body">
      <div className="doc-shell-columns">
        <aside className="doc-shell-rail-col hidden lg:block">
          <div className="doc-shell-rail-inner">{left}</div>
        </aside>

        <article className="doc-shell-main">{children}</article>

        {right ? (
          <aside className="doc-shell-rail-col hidden xl:block">
            <div className="doc-shell-rail-inner">{right}</div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
