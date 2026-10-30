
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getRoomMenu } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import weddingVideo from '../assets/IMG_3443.MP4';

function formatTime(dateString) {
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(dateString));
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(dateString));
}

function GuestHomePage() {
  const { roomToken } = useParams();
  const navigate = useNavigate();

  const { cartCount, subtotal } = useCart();

  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHome = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await getRoomMenu(roomToken);

      if (!response.success) {
        throw new Error(
          response.message || 'Unable to load guest experience.'
        );
      }

      setContext(response.context);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to load the guest experience.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHome();
  }, [roomToken]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadHome();
    }, 30000);

    return () => clearInterval(interval);
  }, [roomToken]);

  const events = context?.events || [];

  const liveEvent = useMemo(
    () => events.find((event) => event.status === 'LIVE'),
    [events]
  );

  const upcomingEvent = useMemo(
    () => events.find((event) => event.status === 'UPCOMING'),
    [events]
  );

  const featuredEvent = liveEvent || upcomingEvent;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f5f0] pb-24">
        <div className="mx-auto max-w-md px-5 py-8">
          <div className="h-5 w-28 animate-pulse rounded bg-stone-200" />
          <div className="mt-8 h-48 animate-pulse rounded-[32px] bg-stone-200" />
          <div className="mt-8 h-6 w-48 animate-pulse rounded bg-stone-200" />

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="h-36 animate-pulse rounded-[24px] bg-stone-200" />
            <div className="h-36 animate-pulse rounded-[24px] bg-stone-200" />
          </div>

          <div className="mt-4 h-24 animate-pulse rounded-[24px] bg-stone-200" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f5f0] px-5 pb-24">
        <div className="w-full max-w-md rounded-[32px] bg-white p-8 text-center shadow-sm ring-1 ring-stone-100">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-2xl text-rose-700">
            ✦
          </div>

          <h1 className="mt-5 text-xl font-bold text-stone-950">
            Welcome unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-stone-500">
            {error}
          </p>

          <button
            type="button"
            onClick={loadHome}
            className="mt-6 rounded-2xl bg-stone-950 px-6 py-3.5 text-sm font-bold text-white"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f5f0] pb-32 text-stone-950">
      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 top-20 h-64 w-64 rounded-full bg-rose-200/30 blur-3xl" />
        <div className="absolute -right-24 top-72 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-orange-100/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        {/* Top bar */}
        <header className="flex items-center justify-between pt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-stone-100">
              <span className="font-serif text-lg text-stone-800">R</span>
            </div>

            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">
                Rose & Aman
              </p>

              <p className="text-xs font-semibold text-stone-700">
                Wedding Guest
              </p>
            </div>
          </div>

          <div className="rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-stone-600 shadow-sm ring-1 ring-stone-100">
            Room {context?.room?.roomNumber}
          </div>
        </header>

        {/* Rose & Aman hero banner */}
        <section className="relative mt-5 overflow-hidden rounded-[36px] bg-[#4b1725] px-6 py-9 text-center text-white shadow-xl sm:mt-6 sm:px-12 sm:py-12 lg:mt-8 lg:min-h-[390px] lg:px-20 lg:py-16">
          <div className="absolute -left-12 -top-12 h-36 w-36 rounded-full border border-white/10 lg:-left-24 lg:-top-24 lg:h-64 lg:w-64" />

          <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full border border-white/10 lg:-bottom-32 lg:-right-32 lg:h-80 lg:w-80" />

          <div className="absolute left-5 top-5 text-amber-200/70 lg:left-10 lg:top-8 lg:text-xl">
            ✦
          </div>

          <div className="absolute bottom-7 right-7 text-amber-200/50 lg:bottom-10 lg:right-12 lg:text-xl">
            ✧
          </div>

          <div className="relative mx-auto flex h-full max-w-4xl flex-col items-center justify-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/80 lg:text-[11px] lg:tracking-[0.45em]">
              A celebration of love
            </p>

            <div className="relative mt-5 lg:mt-6">
              <p className="font-serif text-5xl leading-none tracking-[-0.06em] sm:text-6xl lg:text-[72px]">
                Rose
              </p>

              <div className="my-2 flex items-center justify-center gap-3 lg:my-3 lg:gap-5">
                <span className="h-px w-10 bg-amber-200/50 lg:w-20" />
                <span className="font-serif text-2xl italic text-amber-200 lg:text-3xl">
                  &
                </span>
                <span className="h-px w-10 bg-amber-200/50 lg:w-20" />
              </div>

              <p className="font-serif text-5xl leading-none tracking-[-0.06em] sm:text-6xl lg:text-[72px]">
                Aman
              </p>
            </div>

            <p className="relative mt-6 text-sm text-white/70 lg:mt-7 lg:text-base">
              Welcome to our wedding celebration
            </p>

            <div className="relative mx-auto mt-5 flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-medium text-white/80 backdrop-blur lg:mt-6 lg:px-5 lg:py-2.5">
              <span>✦</span>
              <span>{context?.hotel?.name}</span>
            </div>
          </div>
        </section>

        {/* Wedding invitation */}
        <section className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-[32px] bg-white shadow-sm ring-1 ring-stone-100">
          <div className="px-6 pb-5 pt-8 text-center sm:px-10 sm:pt-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-rose-800">
              A special invitation
            </p>

            <h2 className="mt-4 font-serif text-3xl leading-tight text-[#4b1725] sm:text-4xl">
              Some stories are written in the stars,
              <br className="hidden sm:block" />
              some are destined by the heart.
            </h2>

            <p className="mt-3 text-2xl">❤️✨</p>

            <p className="mt-3 font-serif text-xl italic text-stone-700">
              And this is the beginning of ours.
            </p>

            <div className="mx-auto my-6 h-px w-16 bg-amber-300" />

            <p className="font-serif text-2xl font-semibold tracking-wide text-[#4b1725] sm:text-3xl">
              AMAN & ROSE JAISWAL
            </p>

            <p className="mt-3 text-sm font-medium leading-6 text-stone-600">
              Two stories. One beautiful beginning. A lifetime of forever.
            </p>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-stone-500">
              With immense love and joy, we invite you to be a part of our
              wedding celebrations and bless us as we begin this beautiful
              new chapter together.
            </p>
          </div>

          {/* Portrait wedding video */}
          <div className="px-4 pb-5 sm:px-8 sm:pb-8">
            <div className="mb-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-rose-800">
                Our special moments
              </p>

              <h3 className="mt-2 font-serif text-2xl text-[#4b1725]">
                Our wedding film awaits…
              </h3>
            </div>

            {/* Portrait video container */}
            <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-[24px] bg-black shadow-lg">
              <video
                src={weddingVideo}
                className="mx-auto block h-auto max-h-[75vh] w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                controls
                preload="metadata"
              >
                Your browser does not support HTML video.
              </video>
            </div>

            <p className="mt-5 text-center font-serif text-lg italic text-stone-600">
              With love,
            </p>

            <p className="mt-1 text-center font-serif text-xl font-semibold text-[#4b1725]">
              Aman & Rose ❤️
            </p>
          </div>
        </section>

        {/* Your stay */}
        <div className="mx-auto max-w-2xl">
          <section className="mt-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-stone-400">
              Your stay
            </p>

            <h1 className="mt-2 font-serif text-[32px] font-semibold leading-tight tracking-[-0.04em] text-stone-950">
              Make yourself at home.
            </h1>

            <p className="mt-2 max-w-lg text-sm leading-6 text-stone-500">
              Everything you need during the celebration is right here.
            </p>
          </section>

          {/* Event highlight */}
          {featuredEvent && (
            <section className="mt-6">
              <button
                type="button"
                onClick={() => navigate(`/order/${roomToken}/events`)}
                className="group relative w-full overflow-hidden rounded-[28px] bg-white text-left shadow-sm ring-1 ring-stone-100 transition active:scale-[0.99]"
              >
                {featuredEvent.coverImageUrl ? (
                  <img
                    src={featuredEvent.coverImageUrl}
                    alt={featuredEvent.title}
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="relative h-44 overflow-hidden bg-gradient-to-br from-rose-100 via-amber-50 to-orange-50">
                    <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-rose-300/30 blur-2xl" />
                    <div className="absolute -bottom-12 -right-10 h-48 w-48 rounded-full bg-amber-300/30 blur-2xl" />

                    <div className="relative flex h-full flex-col items-center justify-center">
                      <span className="font-serif text-5xl text-stone-700/70">
                        R & A
                      </span>

                      <span className="mt-2 text-[9px] font-bold uppercase tracking-[0.3em] text-stone-500">
                        Wedding Celebration
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    {featuredEvent.status === 'LIVE' ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-red-600">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                        Live now
                      </span>
                    ) : (
                      <span className="rounded-full bg-stone-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-stone-600">
                        Next celebration
                      </span>
                    )}

                    <span className="text-xs font-semibold text-stone-400">
                      View all →
                    </span>
                  </div>

                  <h2 className="mt-3 text-xl font-bold tracking-tight text-stone-950">
                    {featuredEvent.title}
                  </h2>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
                    <span>
                      {featuredEvent.status === 'LIVE'
                        ? 'Happening now'
                        : formatDate(featuredEvent.startAt)}
                    </span>

                    <span>•</span>

                    <span>{formatTime(featuredEvent.startAt)}</span>

                    {featuredEvent.venue && (
                      <>
                        <span>•</span>
                        <span>{featuredEvent.venue}</span>
                      </>
                    )}
                  </div>
                </div>
              </button>
            </section>
          )}

          {/* Guest services */}
          <section className="mt-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-400">
                Guest services
              </p>

              <h2 className="mt-1 font-serif text-2xl font-semibold text-stone-950">
                What would you like?
              </h2>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {/* Food */}
              <button
                type="button"
                onClick={() => navigate(`/order/${roomToken}/menu`)}
                className="group relative overflow-hidden rounded-[26px] bg-white p-5 text-left shadow-sm ring-1 ring-stone-100 transition active:scale-[0.98]"
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-orange-100" />

                <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-xl">
                  🍽
                </div>

                <h3 className="relative mt-5 text-lg font-bold">
                  Order Food
                </h3>

                <p className="relative mt-1 text-xs leading-5 text-stone-500">
                  Delicious favourites delivered to your room.
                </p>

                <div className="relative mt-5 text-xs font-bold text-stone-800">
                  Explore menu →
                </div>
              </button>

              {/* Events */}
              <button
                type="button"
                onClick={() => navigate(`/order/${roomToken}/events`)}
                className="group relative overflow-hidden rounded-[26px] bg-[#4b1725] p-5 text-left text-white shadow-sm transition active:scale-[0.98]"
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-200/10" />

                <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-xl">
                  ✦
                </div>

                <h3 className="relative mt-5 text-lg font-bold">
                  Events
                </h3>

                <p className="relative mt-1 text-xs leading-5 text-white/60">
                  Ceremonies, celebrations and special moments.
                </p>

                <div className="relative mt-5 text-xs font-bold text-amber-200">
                  See what's happening →
                </div>
              </button>
            </div>
          </section>

          {/* Cart */}
          {cartCount > 0 && (
            <section className="mt-4">
              <button
                type="button"
                onClick={() => navigate(`/order/${roomToken}/cart`)}
                className="flex w-full items-center justify-between rounded-[24px] bg-white p-4 text-left shadow-sm ring-1 ring-stone-100"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100">
                    🛍
                  </div>

                  <div>
                    <p className="text-sm font-bold text-stone-950">
                      Your cart
                    </p>

                    <p className="mt-0.5 text-xs text-stone-500">
                      {cartCount} {cartCount === 1 ? 'item' : 'items'} · ₹
                      {subtotal}
                    </p>
                  </div>
                </div>

                <span className="text-sm font-bold text-stone-700">
                  View →
                </span>
              </button>
            </section>
          )}

          {/* Hotel info */}
          <section className="mt-8 rounded-[28px] bg-white/70 p-5 ring-1 ring-stone-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">
                  Staying at
                </p>

                <p className="mt-1 text-sm font-bold text-stone-800">
                  {context?.hotel?.name}
                </p>
              </div>

              <div className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-500">
                Room {context?.room?.roomNumber}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default GuestHomePage;
