"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/features", label: "Features" },
  { href: "/add-feature", label: "Add Feature" },
  { href: "/users", label: "Users" },
  { href: "/developers", label: "Developers" },
  { href: "/qa", label: "QA" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [lineStyle, setLineStyle] = useState({ top: 0, height: 0, opacity: 0 });
  const navRef = useRef<HTMLElement>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget;
    if (navRef.current) {
      const navRect = navRef.current.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setLineStyle({
        top: elRect.top - navRect.top,
        height: elRect.height,
        opacity: 1,
      });
    }
  };

  const handleMouseLeave = () => {
    setLineStyle((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <aside className="group fixed left-0 top-0 z-40 flex h-screen w-16 shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-slate-50 transition-[width] duration-300 hover:w-64">
      <div className="flex h-16 shrink-0 items-center border-b border-slate-200 px-4">
        <Link
          href="/"
          className="sidebar-logo text-lg font-semibold text-slate-900 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        >
          BRD
        </Link>
      </div>

      {/* Vertical hamburger - 3 vertical bars in left column */}
      <div className="sidebar-hamburger flex flex-1 flex-row items-start justify-center pt-8">
        <div className="flex h-10 w-8 flex-row items-center gap-1.5">
          <span className="h-8 w-0.5 shrink-0 rounded-full bg-slate-800 transition-all duration-300 group-hover:translate-x-2 group-hover:opacity-0" />
          <span className="h-8 w-0.5 shrink-0 origin-center rounded-full bg-slate-800 transition-all duration-300 group-hover:scale-x-2" />
          <span className="h-8 w-0.5 shrink-0 rounded-full bg-slate-800 transition-all duration-300 group-hover:-translate-x-2 group-hover:opacity-0" />
        </div>
      </div>

      <div
        className="sidebar-menu absolute left-0 top-16 flex w-64 flex-col bg-slate-50 pt-6 transition-transform duration-300 -translate-x-full group-hover:translate-x-0"
        style={{ height: "calc(100vh - 4rem)" }}
      >
        <div className="sidebar-menu-label mb-6 px-6 text-xs font-semibold uppercase tracking-widest text-slate-400 opacity-0 transition-all duration-300 group-hover:opacity-100">
          Menu
        </div>
        <nav
          ref={navRef}
          className="sidebar-nav-magic relative space-y-0.5 px-4"
          onMouseLeave={handleMouseLeave}
        >
          <span
            className="sidebar-magic-line absolute left-2 w-0.5 rounded-full bg-slate-900 transition-all duration-300 ease-out"
            style={{
              top: lineStyle.top,
              height: lineStyle.height,
              opacity: lineStyle.opacity,
            }}
          />
          {navItems.map((item, i) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={handleMouseEnter}
                className="block opacity-0 transition-all duration-200 group-hover:opacity-100"
                style={{ transitionDelay: `calc(${i} * 50ms + 150ms)` }}
              >
                <span
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "sidebar-nav-underline text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
