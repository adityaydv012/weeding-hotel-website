import { useEffect, useMemo, useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';

import { getRoomMenu } from '../api/client.js';

function formatTime(dateString) {
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(dateString));
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString));
}

function formatDay(dateString) {
  const date = new Date(dateString);

  const today = new Date();

  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const sameDay = (first, second) =>
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate();

  if (sameDay(date, today)) {
    return 'Today';
  }

  if (sameDay(date, tomorrow)) {
    return 'Tomorrow';
  }

  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function EventImage({ event }) {
  if (event.coverImageUrl) {
    return (
      <img
        src={event.coverImageUrl}
        alt={event.title}
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-rose-100 via-amber-50 to-stone-100">
      <div className="absolute -left-8 -top-8 h-28 w-28 rounded-full bg-rose-200/40 blur-2xl" />
      <div className="absolute -bottom-10 -right-8 h-32 w-32 rounded-full bg-amber-200/40 blur-2xl" />

      <div className="relative text-center">
        <div className="text-4xl">✦</div>

        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-stone-500">
          Rose & Aman
        </p>
      </div>
    </div>
  );
}

function LiveEventCard({ event }) {
  return (
    <article className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-stone-100">
      <div className="relative h-64 sm:h-80">
        <EventImage event={event} />

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-5 pt-20 text-white">
          <span className="inline-flex items-center gap-2 rounded-full bg-red-500 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide shadow-lg">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Live now
          </span>

          <h2 className="mt-3 text-2xl font-bold tracking-tight">
            {event.title}
          </h2>

          {event.venue && (
            <p className="mt-1 text-sm text-white/80">
              📍 {event.venue}
            </p>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
              Happening now
            </p>

            <p className="mt-1 text-sm font-semibold text-stone-800">
              {formatTime(event.startAt)} –{' '}
              {formatTime(event.endAt)}
            </p>
          </div>

          <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600">
            LIVE
          </span>
        </div>

        {event.description && (
          <p className="mt-4 text-sm leading-6 text-stone-500">
            {event.description}
          </p>
        )}
      </div>
    </article>
  );
}

function UpcomingEventCard({ event }) {
  return (
    <article className="group overflow-hidden rounded-[24px] bg-white shadow-sm ring-1 ring-stone-100 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="grid grid-cols-[112px_1fr] sm:grid-cols-[150px_1fr]">
        <div className="h-full min-h-[150px] overflow-hidden">
          <EventImage event={event} />
        </div>

        <div className="min-w-0 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-600">
              Upcoming
            </span>

            <span className="text-[11px] font-medium text-stone-400">
              {formatDay(event.startAt)}
            </span>
          </div>

          <h2 className="mt-3 truncate text-lg font-bold text-stone-950">
            {event.title}
          </h2>

          <p className="mt-1 text-sm font-medium text-stone-600">
            {formatTime(event.startAt)} –{' '}
            {formatTime(event.endAt)}
          </p>

          {event.venue && (
            <p className="mt-2 truncate text-xs text-stone-400">
              📍 {event.venue}
            </p>
          )}

          {event.description && (
            <p className="mt-3 line-clamp-2 text-xs leading-5 text-stone-500">
              {event.description}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function EventsPage() {
  const { roomToken } = useParams();
  const navigate = useNavigate();

  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await getRoomMenu(roomToken);

      if (!response.success) {
        throw new Error(
          response.message || 'Unable to load events.'
        );
      }

      setContext(response.context);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to load events.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [roomToken]);

  /*
   * Refresh periodically so an event can automatically
   * change from UPCOMING → LIVE without the guest
   * manually refreshing the page.
   */
  useEffect(() => {
    const interval = setInterval(() => {
      loadEvents();
    }, 30000);

    return () => clearInterval(interval);
  }, [roomToken]);

  const events = context?.events || [];

  const liveEvents = useMemo(
    () =>
      events.filter(
        (event) => event.status === 'LIVE'
      ),
    [events]
  );

  const upcomingEvents = useMemo(
    () =>
      events.filter(
        (event) => event.status === 'UPCOMING'
      ),
    [events]
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf9f7]">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          <div className="h-10 w-10 animate-pulse rounded-full bg-stone-200" />

          <div className="mt-8 h-8 w-56 animate-pulse rounded-lg bg-stone-200" />

          <div className="mt-3 h-4 w-72 animate-pulse rounded bg-stone-200" />

          <div className="mt-8 h-72 animate-pulse rounded-[28px] bg-stone-200" />

          <div className="mt-8 h-32 animate-pulse rounded-[24px] bg-stone-200" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9f7] px-5">
        <div className="w-full max-w-md rounded-[28px] bg-white p-8 text-center shadow-sm ring-1 ring-stone-100">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-xl text-red-600">
            !
          </div>

          <h1 className="mt-5 text-xl font-bold">
            Events unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-stone-500">
            {error}
          </p>

          <button
            type="button"
            onClick={loadEvents}
            className="mt-6 rounded-2xl bg-stone-950 px-6 py-3.5 text-sm font-bold text-white"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf9f7] pb-12">
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-[#faf9f7]/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() =>
              navigate(`/order/${roomToken}`)
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg shadow-sm ring-1 ring-stone-100"
            aria-label="Back to menu"
          >
            ←
          </button>

          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
              {context?.hotel?.name}
            </p>

            <h1 className="truncate text-lg font-bold text-stone-950">
              What's Happening
            </h1>
          </div>

          <div className="ml-auto shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-stone-500 shadow-sm ring-1 ring-stone-100">
            Room {context?.room?.roomNumber}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-7 sm:px-6 sm:py-10">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
            Rose & Aman Wedding
          </p>

          <h2 className="mt-2 text-[32px] font-bold leading-tight tracking-[-0.04em] text-stone-950 sm:text-4xl">
            Celebrate every
            <br />
            moment with us.
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-6 text-stone-500 sm:text-base">
            Stay updated with the celebrations,
            ceremonies and special moments happening
            during your stay.
          </p>
        </section>

        {liveEvents.length > 0 && (
          <section className="mt-8 sm:mt-10">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />

              <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-stone-700">
                Live Now
              </h2>
            </div>

            <div className="space-y-5">
              {liveEvents.map((event) => (
                <LiveEventCard
                  key={event._id}
                  event={event}
                />
              ))}
            </div>
          </section>
        )}

        {upcomingEvents.length > 0 && (
          <section
            className={
              liveEvents.length
                ? 'mt-10 sm:mt-14'
                : 'mt-8 sm:mt-10'
            }
          >
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
                  Don't miss it
                </p>

                <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-950">
                  Upcoming
                </h2>
              </div>

              <span className="text-xs text-stone-400">
                {upcomingEvents.length}{' '}
                {upcomingEvents.length === 1
                  ? 'event'
                  : 'events'}
              </span>
            </div>

            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <UpcomingEventCard
                  key={event._id}
                  event={event}
                />
              ))}
            </div>
          </section>
        )}

        {liveEvents.length === 0 &&
          upcomingEvents.length === 0 && (
            <section className="mt-10 rounded-[28px] bg-white p-8 text-center shadow-sm ring-1 ring-stone-100">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-stone-50 text-2xl">
                ✦
              </div>

              <h2 className="mt-5 text-xl font-bold">
                Nothing scheduled right now
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-stone-500">
                There are no upcoming wedding events at
                the moment. Check back soon.
              </p>
            </section>
          )}

        <div className="mt-10">
          <Link
            to={`/order/${roomToken}`}
            className="flex w-full items-center justify-center rounded-2xl bg-stone-950 px-5 py-4 text-sm font-bold text-white shadow-lg"
          >
            Back to Menu
          </Link>
        </div>
      </div>
    </main>
  );
}

export default EventsPage;