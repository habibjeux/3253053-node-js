"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Ellipsis, X } from "lucide-react";
import { NAV, TAB_HREFS, isActive } from "@/lib/nav";
import { cn } from "@/components/ui";

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-violet to-violet-deep font-display text-lg font-semibold shadow-[0_0_20px_-4px_rgb(124_58_237/.9)]">
        T
      </span>
      <span className="leading-tight">
        <span className="block font-display text-[15px] font-semibold tracking-tight">Dans ta tête</span>
        <span className="block text-[10px] uppercase tracking-[.2em] text-violet-soft">Studio</span>
      </span>
    </Link>
  );
}

/** Barre latérale (tablette et ordinateur). */
export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-ink/80 px-4 py-6 backdrop-blur-xl md:flex">
      <Brand />
      <p className="mt-3 text-xs text-muted">Comprendre ce qui se passe en nous.</p>
      <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Navigation principale">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                active ? "bg-violet/15 text-text shadow-[inset_2px_0_0_var(--color-violet)]" : "text-muted hover:bg-surface-2 hover:text-text",
              )}
            >
              <Icon className={cn("size-[18px]", active && "text-violet-soft")} aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

/** En-tête compact (iPhone). */
export function MobileHeader() {
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between border-b border-line/60 bg-ink/80 px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur-xl md:hidden">
      <Brand />
    </div>
  );
}

/** Barre d'onglets en bas d'écran (iPhone) + panneau « Plus ». */
export function TabBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const tabs = NAV.filter((n) => TAB_HREFS.includes(n.href));
  const more = NAV.filter((n) => !TAB_HREFS.includes(n.href));
  const moreActive = more.some((n) => isActive(pathname, n.href));

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Autres modules">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-label="Fermer" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-line bg-surface px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
            <div className="mb-2 flex items-center justify-between">
              <p className="font-display text-lg font-semibold">Modules</p>
              <button onClick={() => setOpen(false)} className="grid size-11 place-items-center rounded-full text-muted" aria-label="Fermer">
                <X className="size-5" />
              </button>
            </div>
            <ul className="grid gap-1">
              {more.map(({ href, label, icon: Icon, description }) => (
                <li key={href}>
                  <Link href={href} onClick={() => setOpen(false)} className={cn("flex min-h-14 items-center gap-3 rounded-2xl px-3", isActive(pathname, href) ? "bg-violet/15" : "active:bg-surface-2")}>
                    <span className="grid size-10 place-items-center rounded-xl bg-surface-2">
                      <Icon className="size-5 text-violet-soft" aria-hidden />
                    </span>
                    <span>
                      <span className="block text-sm font-medium">{label}</span>
                      <span className="block text-xs text-muted">{description}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-ink/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
        aria-label="Navigation principale"
      >
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className="flex min-h-14 flex-col items-center justify-center gap-1 text-[11px]">
              <Icon className={cn("size-[22px]", active ? "text-violet-soft" : "text-muted")} aria-hidden />
              <span className={active ? "text-text" : "text-muted"}>{label}</span>
            </Link>
          );
        })}
        <button onClick={() => setOpen(true)} className="flex min-h-14 flex-col items-center justify-center gap-1 text-[11px]" aria-haspopup="dialog">
          <Ellipsis className={cn("size-[22px]", moreActive ? "text-violet-soft" : "text-muted")} aria-hidden />
          <span className={moreActive ? "text-text" : "text-muted"}>Plus</span>
        </button>
      </nav>
    </>
  );
}
