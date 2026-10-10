import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import { getRoomMenu } from '../api/client.js';

import CategoryCard from '../components/CategoryCard.jsx';
import FoodCard from '../components/FoodCard.jsx';
import CustomizationSheet from '../components/CustomizationSheet.jsx';

import { useCart } from '../context/CartContext.jsx';

function getSavedOrders(roomToken) {
  if (!roomToken) {
    return [];
  }

  try {
    const historyKey =
      `hotel-orders-${roomToken}`;

    const saved =
      localStorage.getItem(historyKey);

    if (saved) {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        return parsed;
      }
    }

    /*
     * Backward compatibility:
     * If an older session exists but the new
     * order-history array hasn't been created yet,
     * recover it.
     */
    const oldSession =
      localStorage.getItem(
        `hotel-order-${roomToken}`
      );

    if (oldSession) {
      const parsed =
        JSON.parse(oldSession);

      if (
        parsed?.order &&
        parsed?.trackingToken
      ) {
        return [
          {
            orderId: parsed.order.id,
            orderNumber:
              parsed.order.orderNumber,
            trackingToken:
              parsed.trackingToken,
            roomNumber:
              parsed.order.roomNumber,
            total:
              parsed.order.total,
          },
        ];
      }
    }
  } catch (error) {
    console.error(
      'Unable to read saved orders:',
      error
    );
  }

  return [];
}

function MenuPage() {
  const { roomToken } = useParams();

  const navigate = useNavigate();

  const {
    addItem,
    cartCount,
    subtotal,
    setTaxPercent,
  } = useCart();

  const [menu, setMenu] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [activeCategory, setActiveCategory] =
    useState(null);

  const [selectedFood, setSelectedFood] =
    useState(null);

  const [search, setSearch] =
    useState('');

  const [vegOnly, setVegOnly] =
    useState(false);

  const [orderNumber, setOrderNumber] =
    useState('');

  const [trackError, setTrackError] =
    useState('');

  const [tracking, setTracking] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadMenu = async () => {
      try {
        setLoading(true);
        setError('');

        const response =
          await getRoomMenu(roomToken);

        if (!response.success) {
          throw new Error(
            response.message ||
              'Unable to load the menu.'
          );
        }

        const context =
          response.context;

        if (!cancelled) {
          setMenu(context);

          setTaxPercent(
            Number(
              context.hotel.taxPercent ||
                0
            )
          );

          if (
            context.categories?.length
          ) {
            setActiveCategory(
              context.categories[0]._id
            );
          }
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              err.message ||
              'Unable to load the menu.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadMenu();

    return () => {
      cancelled = true;
    };
  }, [roomToken, setTaxPercent]);

  const visibleFoods = useMemo(() => {
    if (!menu) {
      return [];
    }

    let foods = menu.foods || [];

    if (activeCategory) {
      foods = foods.filter(
        (food) =>
          food.categoryId ===
          activeCategory
      );
    }

    if (vegOnly) {
      foods = foods.filter(
        (food) => food.isVeg
      );
    }

    if (search.trim()) {
      const query =
        search.trim().toLowerCase();

      foods = foods.filter(
        (food) =>
          food.name
            ?.toLowerCase()
            .includes(query) ||
          food.description
            ?.toLowerCase()
            .includes(query)
      );
    }

    return foods;
  }, [
    menu,
    activeCategory,
    vegOnly,
    search,
  ]);

  const activeCategoryObject =
    menu?.categories?.find(
      (category) =>
        category._id ===
        activeCategory
    );

  const handleFoodAdd = (food) => {
    if (food.customizations?.length) {
      setSelectedFood(food);
      return;
    }

    addItem(food);
  };

  const handleCustomizedAdd = (
    food,
    customizations
  ) => {
    addItem(
      food,
      customizations
    );

    setSelectedFood(null);
  };

  const handleSearchSuggestion = (
    value
  ) => {
    setSearch(value);
  };

  const handleTrackOrder = () => {
    const cleanedOrderNumber =
      orderNumber.trim();

    setTrackError('');

    if (!cleanedOrderNumber) {
      setTrackError(
        'Please enter your Order ID.'
      );

      return;
    }

    setTracking(true);

    try {
      const savedOrders =
        getSavedOrders(roomToken);

      const matchedOrder =
        savedOrders.find(
          (savedOrder) =>
            String(
              savedOrder.orderNumber
            ).toLowerCase() ===
            cleanedOrderNumber.toLowerCase()
        );

      if (!matchedOrder) {
        setTrackError(
          'We couldn’t find this order on this device. Please check your Order ID or open the tracking option from your order confirmation.'
        );

        return;
      }

      if (
        !matchedOrder.orderId ||
        !matchedOrder.trackingToken
      ) {
        setTrackError(
          'This order tracking session is unavailable. Please place or open the order again from this device.'
        );

        return;
      }

      navigate(
        `/order/${roomToken}/track/${matchedOrder.orderId}`,
        {
          state: {
            trackingToken:
              matchedOrder.trackingToken,
          },
        }
      );
    } finally {
      setTracking(false);
    }
  };

  const handleTrackInputKeyDown = (
    event
  ) => {
    if (event.key === 'Enter') {
      handleTrackOrder();
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f5f0] px-5 pb-[100px]">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#4b1725] text-amber-200 shadow-lg">
            <span className="font-serif text-xl">
              R
            </span>
          </div>

          <div className="mx-auto mt-5 h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-[#4b1725]" />

          <p className="mt-4 text-sm text-stone-500">
            Preparing your menu...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f5f0] px-5 pb-[100px]">
        <div className="w-full max-w-md rounded-[32px] bg-white p-8 text-center shadow-sm ring-1 ring-stone-100">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-2xl text-[#4b1725]">
            ✦
          </div>

          <h1 className="mt-5 text-xl font-bold text-stone-950">
            Menu unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-stone-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-6 rounded-2xl bg-[#4b1725] px-6 py-3.5 text-sm font-bold text-white shadow-lg"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f5f0] text-stone-950">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-32 h-72 w-72 rounded-full bg-rose-200/20 blur-3xl" />

        <div className="absolute -right-32 top-[45%] h-80 w-80 rounded-full bg-amber-200/20 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-[#f8f5f0]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/order/${roomToken}`
                )
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg shadow-sm ring-1 ring-stone-100 transition active:scale-95"
              aria-label="Back to home"
            >
              ←
            </button>

            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#4b1725]">
                {menu.hotel.logoUrl ? (
                  <img
                    src={
                      menu.hotel.logoUrl
                    }
                    alt={
                      menu.hotel.name
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-serif text-lg text-amber-100">
                    {menu.hotel.name.charAt(
                      0
                    )}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-stone-400">
                  Staying at
                </p>

                <h1 className="truncate text-sm font-bold text-stone-900">
                  {menu.hotel.name}
                </h1>
              </div>
            </div>
          </div>

          <div className="shrink-0 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-stone-600 shadow-sm ring-1 ring-stone-100">
            Room {menu.room.roomNumber}
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 pb-[180px] sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="pt-8 sm:pt-12">
          <div className="relative overflow-hidden rounded-[32px] bg-[#4b1725] px-6 py-8 text-white shadow-xl sm:px-9 sm:py-10">
            <div className="absolute -left-12 -top-16 h-40 w-40 rounded-full border border-white/10" />

            <div className="absolute -bottom-20 -right-12 h-48 w-48 rounded-full border border-white/10" />

            <div className="absolute right-8 top-7 text-amber-200/70">
              ✦
            </div>

            <div className="relative">
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-amber-200/75">
                Rose & Aman Wedding
              </p>

              <h2 className="mt-3 max-w-2xl font-serif text-[34px] font-semibold leading-[1.05] tracking-[-0.04em] sm:text-5xl">
                Something delicious
                <br />
                for your celebration.
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-6 text-white/65 sm:text-base">
                Explore the hotel menu and have your
                favourites delivered straight to your room.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/10 px-3 py-2 text-[10px] font-semibold text-white/80 backdrop-blur">
                  ✦ In-room dining
                </span>

                <span className="rounded-full bg-white/10 px-3 py-2 text-[10px] font-semibold text-white/80 backdrop-blur">
                  Room {menu.room.roomNumber}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Track Order */}
        <section className="mt-5 sm:mt-6">
          <div className="relative overflow-hidden rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-stone-100 sm:p-6">
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber-100/60 blur-2xl" />

            <div className="relative">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#4b1725] text-lg text-amber-100">
                  ↗
                </div>

                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">
                    Already ordered?
                  </p>

                  <h3 className="mt-1 font-serif text-xl font-semibold tracking-tight text-stone-950 sm:text-2xl">
                    Track your order
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-stone-500 sm:text-sm">
                    Enter your Order ID to check the latest status.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(event) => {
                    setOrderNumber(
                      event.target.value
                    );

                    if (trackError) {
                      setTrackError('');
                    }
                  }}
                  onKeyDown={
                    handleTrackInputKeyDown
                  }
                  placeholder="Enter Order ID"
                  autoComplete="off"
                  className="min-w-0 flex-1 rounded-2xl border border-stone-200 bg-[#f8f5f0] px-4 py-3.5 text-sm font-semibold text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#4b1725] focus:ring-2 focus:ring-[#4b1725]/10"
                />

                <button
                  type="button"
                  onClick={handleTrackOrder}
                  disabled={tracking}
                  className="shrink-0 rounded-2xl bg-[#4b1725] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#39111c] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[145px]"
                >
                  {tracking
                    ? 'Checking...'
                    : 'Track Order →'}
                </button>
              </div>

              {trackError && (
                <div className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-xs leading-5 text-rose-700 ring-1 ring-rose-100">
                  {trackError}
                </div>
              )}

              <p className="mt-3 text-[10px] leading-4 text-stone-400">
                Your order can be tracked from this device after placing it.
              </p>
            </div>
          </div>
        </section>

        {/* Search */}
        <section className="mt-6 sm:mt-8">
          <div className="relative overflow-hidden rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-stone-100 sm:p-7">
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-amber-100/50 blur-2xl" />

            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">
                    Discover
                  </p>

                  <h3 className="mt-1 font-serif text-2xl font-semibold tracking-tight">
                    What are you craving?
                  </h3>
                </div>

                <span className="hidden rounded-full bg-stone-50 px-3 py-1.5 text-[10px] font-semibold text-stone-500 sm:inline-flex">
                  {menu.foods?.length || 0}{' '}
                  dishes
                </span>
              </div>

              <div className="mt-5 flex overflow-hidden rounded-2xl bg-[#f8f5f0] ring-1 ring-stone-200">
                <span className="flex w-11 shrink-0 items-center justify-center text-stone-400">
                  ⌕
                </span>

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search dishes..."
                  className="min-w-0 flex-1 bg-transparent py-4 pr-3 text-sm outline-none placeholder:text-stone-400"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearch('')
                    }
                    className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-xl bg-white text-sm text-stone-500 shadow-sm"
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {[
                  {
                    label: 'All dishes',
                    value: '',
                  },
                  {
                    label: 'Quick bites',
                    value: 'snack',
                  },
                  {
                    label: 'Must tries',
                    value: '',
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() =>
                      handleSearchSuggestion(
                        item.value
                      )
                    }
                    className="whitespace-nowrap rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-600 transition hover:border-[#4b1725] hover:text-[#4b1725] active:scale-95"
                  >
                    ✦ {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="mt-9 sm:mt-12">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">
                Explore
              </p>

              <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
                Categories
              </h2>
            </div>

            <span className="text-xs text-stone-400">
              {menu.categories.length}{' '}
              {menu.categories.length === 1
                ? 'category'
                : 'categories'}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {menu.categories.map(
              (category) => (
                <CategoryCard
                  key={category._id}
                  category={category}
                  active={
                    activeCategory ===
                    category._id
                  }
                  onClick={() =>
                    setActiveCategory(
                      category._id
                    )
                  }
                />
              )
            )}
          </div>
        </section>

        {/* Menu */}
        <section className="mt-10 sm:mt-14">
          {/* Category filter */}
          <div className="sticky top-[67px] z-20 -mx-4 border-y border-stone-200/70 bg-[#f8f5f0]/95 px-4 py-3 backdrop-blur-xl sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
            <div className="flex items-center gap-2">
              <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
                {menu.categories.map(
                  (category) => (
                    <button
                      key={category._id}
                      type="button"
                      onClick={() =>
                        setActiveCategory(
                          category._id
                        )
                      }
                      className={[
                        'whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition active:scale-95',
                        activeCategory ===
                        category._id
                          ? 'bg-[#4b1725] text-amber-100 shadow-sm'
                          : 'bg-white text-stone-600 ring-1 ring-stone-200',
                      ].join(' ')}
                    >
                      {category.name}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setVegOnly(
                    (value) => !value
                  )
                }
                className={[
                  'flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition active:scale-95',
                  vegOnly
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-stone-200 bg-white text-stone-600',
                ].join(' ')}
              >
                <span className="h-3 w-3 rounded-full border border-green-600 bg-green-500" />
                Veg
              </button>
            </div>
          </div>

          {/* Food heading */}
          <div className="mt-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">
                  Today's selection
                </p>

                <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight">
                  {activeCategoryObject?.name ||
                    'Menu'}
                </h2>

                <div className="mt-2 h-0.5 w-10 bg-[#4b1725]" />
              </div>

              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-stone-400 shadow-sm ring-1 ring-stone-100">
                {visibleFoods.length}{' '}
                items
              </span>
            </div>

            {/* Food cards */}
            <div className="mt-5">
              {visibleFoods.length > 0 ? (
                <div className="space-y-3">
                  {visibleFoods.map(
                    (food) => (
                      <FoodCard
                        key={food._id}
                        food={food}
                        onAdd={
                          handleFoodAdd
                        }
                      />
                    )
                  )}
                </div>
              ) : (
                <div className="rounded-[28px] bg-white px-6 py-16 text-center shadow-sm ring-1 ring-stone-100">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-50 text-xl">
                    ✦
                  </div>

                  <p className="mt-4 text-base font-bold text-stone-800">
                    No dishes found
                  </p>

                  <p className="mt-1 text-sm text-stone-500">
                    Try another category or search.
                  </p>

                  {(search ||
                    vegOnly) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        setVegOnly(false);
                      }}
                      className="mt-5 rounded-xl bg-[#4b1725] px-5 py-2.5 text-xs font-bold text-white"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Floating Cart */}
      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-[100px] z-[90] px-4 pb-1">
          <div className="mx-auto flex max-w-2xl items-center justify-between rounded-[22px] bg-[#4b1725] p-2 pl-4 text-white shadow-[0_12px_35px_rgba(70,20,35,0.22)] ring-1 ring-white/10">
            <div>
              <p className="text-[10px] font-medium text-white/60">
                {cartCount}{' '}
                {cartCount === 1
                  ? 'item'
                  : 'items'}{' '}
                in your cart
              </p>

              <p className="mt-0.5 font-bold">
                ₹{subtotal}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/order/${roomToken}/cart`
                )
              }
              className="rounded-xl bg-amber-100 px-5 py-3 text-xs font-bold text-[#4b1725] shadow-sm transition active:scale-95"
            >
              View cart →
            </button>
          </div>
        </div>
      )}

      {/* Customization */}
      {selectedFood && (
        <CustomizationSheet
          food={selectedFood}
          onClose={() =>
            setSelectedFood(null)
          }
          onAdd={
            handleCustomizedAdd
          }
        />
      )}
    </div>
  );
}

export default MenuPage;