"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClockCounterClockwiseIcon,
  FilmStripIcon,
  HouseIcon,
  PackageIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";

import {
  AiSettingsButton,
  AiSettingsDialog,
} from "@/components/ai-settings-dialog";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "홈", Icon: HouseIcon },
  { href: "/personas", label: "페르소나", Icon: UsersThreeIcon },
  { href: "/products", label: "제품·서비스", Icon: PackageIcon },
  { href: "/simulation", label: "시뮬레이션", Icon: FilmStripIcon },
  { href: "/history", label: "히스토리", Icon: ClockCounterClockwiseIcon },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-6 max-w-6xl flex h-14 items-center gap-1">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold shrink-0 mr-auto"
        >
          <span className="size-7 rounded-md bg-primary text-primary-foreground inline-flex items-center justify-center text-xs">
            PS
          </span>
          <span className="hidden sm:inline">Persona Simulator</span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV.map(({ href, label, Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <Icon weight={active ? "fill" : "regular"} className="size-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="w-px h-5 bg-border mx-1" aria-hidden />

        <AiSettingsButton onClick={() => setSettingsOpen(true)} />
      </div>

      <AiSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  );
}
