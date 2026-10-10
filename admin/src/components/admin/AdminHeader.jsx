import { useState } from 'react';

import { useAuth } from '../../context/AuthContext.jsx';

export default function AdminHeader({
  onMenuClick,
}) {
  const { user, logout } = useAuth();

  const [profileOpen, setProfileOpen] =
    useState(false);

  return (
    <header className="sticky top-0 z-30 h-[82px] border-b border-[#eadfd4] bg-white/95 backdrop-blur">
      <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Left */}
        <div className="flex items-center gap-3">

          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e4d9cf] text-[#594e47] transition hover:bg-[#f8f3ed] lg:hidden"
          >
            <MenuIcon />
          </button>

          <div className="lg:hidden">
            <p className="font-serif text-base font-semibold text-[#2b211d]">
              Rose & Aman
            </p>

            <p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-[#9a7a52]">
              Management
            </p>
          </div>

          <div className="hidden lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#a08e7d]">
              Hotel Management
            </p>

            <h1 className="mt-1 text-lg font-semibold text-[#2b211d]">
              Admin Dashboard
            </h1>
          </div>

        </div>

        {/* Right */}
        <div className="relative flex items-center gap-3">

          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-[#332a26]">
              {user?.name}
            </p>

            <p className="text-[11px] text-[#857a72]">
              {formatRole(user?.role)}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setProfileOpen((value) => !value)
            }
            aria-label="Open profile menu"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7b2638] text-xs font-semibold text-white ring-4 ring-[#7b2638]/10"
          >
            {getInitials(user?.name)}
          </button>

          {profileOpen && (
            <>
              <button
                type="button"
                aria-label="Close profile menu"
                onClick={() => setProfileOpen(false)}
                className="fixed inset-0 z-40 cursor-default"
              />

              <div className="absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-2xl border border-[#e5d9cf] bg-white shadow-[0_16px_45px_rgba(48,32,23,0.12)]">

                <div className="border-b border-[#eee4db] px-4 py-4">
                  <p className="truncate text-sm font-semibold text-[#2b211d]">
                    {user?.name}
                  </p>

                  <p className="mt-1 truncate text-xs text-[#857a72]">
                    {user?.email}
                  </p>

                  <span className="mt-3 inline-flex rounded-full bg-[#f7efe5] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#8d6844]">
                    {formatRole(user?.role)}
                  </span>
                </div>

                <div className="p-2">
                  <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#71303d] transition hover:bg-[#fff5f2]"
                  >
                    <LogoutIcon />
                    Sign out
                  </button>
                </div>

              </div>
            </>
          )}

        </div>

      </div>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
    </svg>
  );
}

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return 'A';

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatRole(role) {
  if (!role) return 'Administrator';

  return role
    .split('_')
    .map(
      (part) =>
        part.charAt(0) +
        part.slice(1).toLowerCase()
    )
    .join(' ');
}