
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const navigation = [
  {
    label: 'Overview',
    items: [
      {
        label: 'Dashboard',
        path: '/',
        icon: 'dashboard',
        roles: ['SUPER_ADMIN', 'HOTEL_ADMIN', 'STAFF', 'KITCHEN'],
      },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        label: 'Orders',
        path: '/orders',
        icon: 'orders',
        roles: ['SUPER_ADMIN', 'HOTEL_ADMIN', 'STAFF', 'KITCHEN'],
      },
      {
        label: 'Food Items',
        path: '/food-items',
        icon: 'food',
        roles: ['SUPER_ADMIN', 'HOTEL_ADMIN', 'STAFF'],
      },
      {
        label: 'Categories',
        path: '/categories',
        icon: 'category',
        roles: ['SUPER_ADMIN', 'HOTEL_ADMIN', 'STAFF'],
      },
      {
        label: 'Rooms',
        path: '/rooms',
        icon: 'rooms',
        roles: ['SUPER_ADMIN', 'HOTEL_ADMIN', 'STAFF'],
      },
      {
        label: 'Events',
        path: '/events',
        icon: 'events',
        roles: ['SUPER_ADMIN', 'HOTEL_ADMIN', 'STAFF'],
      },
    ],
  },
  {
    label: 'Administration',
    items: [
      {
        label: 'Hotels',
        path: '/hotels',
        icon: 'hotel',
        roles: ['SUPER_ADMIN'],
      },
      {
        label: 'Users',
        path: '/users',
        icon: 'users',
        roles: ['SUPER_ADMIN'],
      },
      {
        label: 'Settings',
        path: '/settings',
        icon: 'settings',
        roles: ['SUPER_ADMIN', 'HOTEL_ADMIN'],
      },
    ],
  },
];


const IMPLEMENTED_ROUTES = [
  '/',
  '/orders',
  '/food-items',
  '/categories',
  '/rooms',
  '/events',
  '/hotels',
  '/users',
];


export default function AdminSidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth();
  const role = user?.role;

  const visibleSections = navigation
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.roles.includes(role)
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/35 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col',
          'border-r border-[#eadfd4] bg-[#fffdf9]',
          'transition-transform duration-300',
          mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        {/* Brand */}
        <div className="flex h-[82px] shrink-0 items-center border-b border-[#eadfd4] px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7b2638] text-sm font-semibold tracking-tight text-[#f8e8c8]">
              R&A
            </div>

            <div>
              <p className="font-serif text-[17px] font-semibold tracking-wide text-[#2b211d]">
                Rose & Aman
              </p>

              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9a7a52]">
                Management
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="ml-auto rounded-lg p-2 text-[#756b64] hover:bg-[#f6f0e9] lg:hidden"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-5">
          {visibleSections.map((section) => (
            <div
              key={section.label}
              className="mb-7 last:mb-0"
            >
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#aa9b8e]">
                {section.label}
              </p>

              <nav className="space-y-1">
                {section.items.map((item) => {
                  const isImplemented =
                    IMPLEMENTED_ROUTES.includes(item.path);

                  if (!isImplemented) {
                    return (
                      <div
                        key={item.path}
                        className="flex cursor-default items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#a69a91]"
                        title="This module will be enabled next"
                      >
                        <Icon
                          name={item.icon}
                          size={18}
                        />

                        <span className="flex-1">
                          {item.label}
                        </span>

                        <span className="rounded-md bg-[#f3eee8] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#aa9b8e]">
                          Soon
                        </span>
                      </div>
                    );
                  }

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      end={item.path === '/'}
                      className={({ isActive }) =>
                        [
                          'flex items-center gap-3 rounded-xl px-3 py-2.5',
                          'text-sm font-medium transition',
                          isActive
                            ? 'bg-[#7b2638] text-white shadow-sm'
                            : 'text-[#5f554f] hover:bg-[#f6f0e9] hover:text-[#2b211d]',
                        ].join(' ')
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            name={item.icon}
                            size={18}
                            active={isActive}
                          />

                          <span>{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* User and logout */}
        <div className="shrink-0 border-t border-[#eadfd4] p-4">
          <div className="rounded-2xl bg-[#f8f3ed] p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7b2638] text-xs font-semibold text-white">
                {getInitials(user?.name)}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#332a26]">
                  {user?.name || 'Administrator'}
                </p>

                <p className="truncate text-[11px] text-[#857a72]">
                  {formatRole(user?.role)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#e1d5ca] bg-white px-3 py-2 text-xs font-semibold text-[#71303d] transition hover:bg-[#fffaf5]"
            >
              <LogoutIcon />
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

// ============================================================
// NAVIGATION ICONS
// ============================================================

function Icon({ name, size = 20, active = false }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: active ? 'text-[#f8e8c8]' : 'text-current',
    'aria-hidden': true,
  };

  if (name === 'dashboard' || name === 'category') {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  }

  if (name === 'orders') {
    return (
      <svg {...common}>
        <path d="M6 3h12" />
        <path d="M7 3v3.5a5 5 0 0 0 10 0V3" />
        <path d="M9 13h6" />
        <path d="M8 17h8" />
        <path d="M5 21h14" />
      </svg>
    );
  }

  if (name === 'food') {
    return (
      <svg {...common}>
        <path d="M4 3v18" />
        <path d="M8 3v7" />
        <path d="M4 10h4" />
        <path d="M7 10V3" />
        <path d="M15 3v18" />
        <path d="M20 3v18" />
        <path d="M15 9c0-3 1.7-6 5-6" />
      </svg>
    );
  }

  if (name === 'rooms') {
    return (
      <svg {...common}>
        <path d="M4 20V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14" />
        <path d="M4 17h16" />
        <path d="M7 17v3" />
        <path d="M17 17v3" />
        <path d="M8 9h3" />
        <path d="M8 12h3" />
        <path d="M14 9h3" />
        <path d="M14 12h3" />
      </svg>
    );
  }

  if (name === 'events') {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4" />
        <path d="M8 3v4" />
        <path d="M3 10h18" />
        <path d="m9 16 2 2 4-4" />
      </svg>
    );
  }

  if (name === 'hotel') {
    return (
      <svg {...common}>
        <path d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16" />
        <path d="M2 21h20" />
        <path d="M8 7h2" />
        <path d="M14 7h2" />
        <path d="M8 11h2" />
        <path d="M14 11h2" />
        <path d="M8 15h2" />
        <path d="M14 15h2" />
      </svg>
    );
  }

  if (name === 'users') {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20a6 6 0 0 1 12 0" />
        <path d="M16 5.5a3 3 0 0 1 0 5.8" />
        <path d="M18 14a5 5 0 0 1 3 4.5" />
      </svg>
    );
  }

  if (name === 'settings') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.42 1.42-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-2v-.48a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.42-1.42.06-.06A1.7 1.7 0 0 0 9.4 15a1.7 1.7 0 0 0-1.56-1.03H7v-2h.84A1.7 1.7 0 0 0 9.4 11a1.7 1.7 0 0 0-.34-1.88L9 9.06l1.42-1.42.06.06 1.88.34A1.7 1.7 0 0 0 13.39 6.5V6h2v.5a1.7 1.7 0 0 0 1.03 1.54 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.42 1.42-.06.06A1.7 1.7 0 0 0 19.4 11a1.7 1.7 0 0 0 1.56 1.03H21v2h-.04A1.7 1.7 0 0 0 19.4 15Z" />
      </svg>
    );
  }

  return null;
}

// ============================================================
// LOGOUT ICON
// ============================================================

function LogoutIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
    </svg>
  );
}

// ============================================================
// CLOSE ICON
// ============================================================

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

// ============================================================
// USER HELPERS
// ============================================================

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return 'A';

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${
    parts[parts.length - 1][0]
  }`.toUpperCase();
}

function formatRole(role) {
  if (!role) return 'Administrator';

  return role
    .split('_')
    .map(
      (part) =>
        part.charAt(0) + part.slice(1).toLowerCase()
    )
    .join(' ');
}
