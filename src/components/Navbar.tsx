"use client";

import Link from "next/link";
import { useState } from "react";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl">💎</span>
            <span className="text-xl font-bold bg-gradient-to-r from-amber-700 to-amber-500 bg-clip-text text-transparent">
              投资名言
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-stone-600 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-400 transition-colors font-medium">
              首页
            </Link>
            <Link href="/masters" className="text-stone-600 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-400 transition-colors font-medium">
              投资大师
            </Link>
            <Link href="/topics" className="text-stone-600 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-400 transition-colors font-medium">
              主题分类
            </Link>
            <Link href="/quotes" className="text-stone-600 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-400 transition-colors font-medium">
              名言库
            </Link>
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Nav */}
        {open && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/" onClick={() => setOpen(false)} className="block px-4 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 font-medium">
              首页
            </Link>
            <Link href="/masters" onClick={() => setOpen(false)} className="block px-4 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 font-medium">
              投资大师
            </Link>
            <Link href="/topics" onClick={() => setOpen(false)} className="block px-4 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 font-medium">
              主题分类
            </Link>
            <Link href="/quotes" onClick={() => setOpen(false)} className="block px-4 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 font-medium">
              名言库
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
