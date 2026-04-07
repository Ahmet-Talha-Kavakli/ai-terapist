'use client';

import { useTranslations } from 'next-intl';
import { SignInButton, UserButton } from '@clerk/nextjs';
import { LanguageSwitcher } from './language-switcher';

interface NavbarProps {
  isSignedIn: boolean;
}

export function Navbar({ isSignedIn }: NavbarProps) {
  const t = useTranslations('nav');

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Blur backdrop */}
      <div className="absolute inset-0 border-b border-white/5 bg-[#080810]/80 backdrop-blur-xl" />

      <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 select-none">
          <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-xl font-bold tracking-tight text-transparent">
            Lyra
          </span>
        </a>

        {/* Center links */}
        <ul className="hidden items-center gap-8 md:flex">
          <li>
            <a href="#features" className="text-sm text-gray-400 transition-colors hover:text-white">
              {t('features')}
            </a>
          </li>
          <li>
            <a href="#about" className="text-sm text-gray-400 transition-colors hover:text-white">
              {t('about')}
            </a>
          </li>
        </ul>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher />

          {isSignedIn ? (
            <UserButton />
          ) : (
            <SignInButton mode="modal">
              <button className="rounded-full border border-white/20 bg-white/5 px-5 py-2 text-sm font-medium text-white backdrop-blur transition-all hover:border-white/40 hover:bg-white/10">
                {t('login')}
              </button>
            </SignInButton>
          )}
        </div>
      </nav>
    </header>
  );
}
