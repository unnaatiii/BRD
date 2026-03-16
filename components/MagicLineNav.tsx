"use client";

import { useState, useRef } from "react";

export interface MagicLineNavItem {
  label: string;
  value: string;
}

interface MagicLineNavProps {
  items: MagicLineNavItem[];
  activeValue: string;
  onChange: (value: string) => void;
}

export default function MagicLineNav({ items, activeValue, onChange }: MagicLineNavProps) {
  const [lineStyle, setLineStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const navRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = e.currentTarget;
    if (navRef.current) {
      const navRect = navRef.current.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setLineStyle({
        left: elRect.left - navRect.left,
        width: elRect.width,
        opacity: 1,
      });
    }
  };

  const handleMouseLeave = () => {
    setLineStyle((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <nav
      ref={navRef}
      className="magic-line-nav relative flex gap-1 border-b border-slate-200 pb-0"
      onMouseLeave={handleMouseLeave}
    >
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          onMouseEnter={handleMouseEnter}
          className={`relative z-10 px-3 py-2.5 text-sm font-medium transition-colors ${
            activeValue === item.value
              ? "text-slate-900"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          {item.label}
        </button>
      ))}
      <span
        className="magic-line absolute bottom-0 h-0.5 bg-slate-900 transition-all duration-300 ease-out"
        style={{
          left: lineStyle.left,
          width: lineStyle.width,
          opacity: lineStyle.opacity,
        }}
      />
    </nav>
  );
}
