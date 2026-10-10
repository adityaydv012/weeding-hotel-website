import {
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

import { useCart } from '../context/CartContext.jsx';

function GuestBottomNav() {
  const { roomToken } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { cartCount } = useCart();

  const basePath = `/order/${roomToken}`;

  /*
   * EXACT PAGE MATCHING
   *
   * Home:
   * /order/:roomToken
   *
   * Menu:
   * /order/:roomToken/menu
   *
   * Events:
   * /order/:roomToken/events
   *
   * Cart:
   * /order/:roomToken/cart
   */

  const isHome =
    location.pathname === basePath ||
    location.pathname === `${basePath}/`;

  const isMenu =
    location.pathname === `${basePath}/menu`;

  const isEvents =
    location.pathname === `${basePath}/events`;

  const isCart =
    location.pathname === `${basePath}/cart` ||
    location.pathname === `${basePath}/checkout` ||
    location.pathname === `${basePath}/success` ||
    location.pathname.includes(`${basePath}/track/`);

  const navItems = [
    {
      key: 'home',
      label: 'Home',
      path: basePath,
      active: isHome,
      icon: '⌂',
    },
    {
      key: 'menu',
      label: 'Menu',
      path: `${basePath}/menu`,
      active: isMenu,
      icon: '▤',
    },
    {
      key: 'events',
      label: 'Events',
      path: `${basePath}/events`,
      active: isEvents,
      icon: '✦',
    },
    {
      key: 'cart',
      label: 'Cart',
      path: `${basePath}/cart`,
      active: isCart,
      icon: '♧',
    },
  ];

  return (
    <nav
      className="
        fixed
        inset-x-0
        bottom-0
        z-[100]
        h-[84px]
        border-t
        border-[#eadfe1]
        bg-[#fffdfb]/95
        px-4
        shadow-[0_-8px_30px_rgba(70,20,35,0.08)]
        backdrop-blur-xl
      "
    >
      <div
        className="
          mx-auto
          flex
          h-full
          max-w-3xl
          items-center
          justify-around
          pb-[max(4px,env(safe-area-inset-bottom))]
        "
      >
        {navItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => navigate(item.path)}
            className="
              group
              relative
              flex
              min-w-[68px]
              flex-col
              items-center
              justify-center
              gap-1
            "
          >
            <div
              className={[
                'relative flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-[19px] transition-all duration-200',
                item.active
                  ? 'bg-[#571629] text-[#f8e7ad] shadow-[0_5px_15px_rgba(87,22,41,0.18)]'
                  : 'bg-transparent text-stone-400 group-hover:bg-stone-100 group-hover:text-stone-700',
              ].join(' ')}
            >
              <span>{item.icon}</span>

              {item.key === 'cart' && cartCount > 0 && (
                <span
                  className="
                    absolute
                    -right-1
                    -top-1
                    flex
                    h-[18px]
                    min-w-[18px]
                    items-center
                    justify-center
                    rounded-full
                    border-2
                    border-[#fffdfb]
                    bg-[#571629]
                    px-1
                    text-[9px]
                    font-bold
                    text-white
                  "
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </div>

            <span
              className={[
                'text-[10px] font-semibold transition-colors',
                item.active
                  ? 'text-[#571629]'
                  : 'text-stone-400 group-hover:text-stone-700',
              ].join(' ')}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}

export default GuestBottomNav;