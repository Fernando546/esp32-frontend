"use client";
import React from 'react';
import classNames from 'classnames';

interface Props {
  theme: 'night' | 'hacker' | 'darkness' | 'powder';
  onChange: () => void;
}

const names: Record<string,string> = {
  night: 'Noc',
  hacker: 'Haker',
  darkness: 'Grafit',
  powder: 'Ocean'
};

const themeStyles: Record<Props['theme'], { base: string; glow: string; text: string; ring: string; }> = {
  night: {
    base: 'bg-gradient-to-r from-cyan-600/50 to-indigo-700/50 hover:from-cyan-600 hover:to-indigo-700',
    glow: 'from-cyan-400/40 to-indigo-400/40',
    text: 'text-white',
    ring: 'focus:ring-cyan-300/40'
  },
  hacker: {
    base: 'bg-gradient-to-r from-emerald-600/60 to-lime-600/60 hover:from-emerald-500 hover:to-lime-500',
    glow: 'from-emerald-300/40 to-lime-300/40',
    text: 'text-emerald-100',
    ring: 'focus:ring-emerald-400/40'
  },
  darkness: {
    base: 'bg-gradient-to-r from-neutral-700/70 to-neutral-600/70 hover:from-neutral-600 hover:to-neutral-500',
    glow: 'from-neutral-400/30 to-neutral-200/30',
    text: 'text-neutral-100',
    ring: 'focus:ring-neutral-300/30'
  },
  powder: {
    base: 'bg-gradient-to-r from-cyan-700/60 to-slate-700/60 hover:from-cyan-600 hover:to-slate-600',
    glow: 'from-cyan-400/40 to-slate-400/40',
    text: 'text-cyan-100',
    ring: 'focus:ring-cyan-300/40'
  }
};

export const ThemeToggle: React.FC<Props> = ({ theme, onChange }) => {
  const style = themeStyles[theme];
  return (
    <button
      onClick={onChange}
      className={classNames(
        'group relative rounded-full px-5 py-2 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 transition-colors duration-300 border border-white/10 backdrop-blur',
        style.base,
        style.text,
        style.ring
      )}
      aria-label="Zmień motyw"
    >
      <span className="pr-1">Motyw:</span>
      <span className="font-bold">{names[theme]}</span>
      <span className="ml-2 text-[10px] opacity-70 group-hover:opacity-90">(kliknij)</span>
      <div className={classNames('absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r', style.glow)} />
    </button>
  );
};

export default ThemeToggle;
