
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '../context/AuthContext.jsx';

import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../api/client.js';

const DEMO_HOTEL_ID = '6ac5c6be34fd0e1d0236f8b9';

const EMPTY_FORM = {
  title: '',
  description: '',
  venue: '',
  coverImageUrl: '',
  startAt: '',
  endAt: '',
  isPublished: true,
};

const FILTERS = [
  'ALL',
  'UPCOMING',
  'LIVE',
  'COMPLETED',
];

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    'Something went wrong. Please try again.'
  );
}

function getEventStatus(event) {
  const now = Date.now();
  const start = new Date(event.startAt).getTime();
  const end = new Date(event.endAt).getTime();

  if (now < start) return 'UPCOMING';
  if (now < end) return 'LIVE';

  return 'COMPLETED';
}

function toLocalDateTime(value) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const localDate = new Date(
    date.getTime() -
      date.getTimezoneOffset() * 60000
  );

  return localDate.toISOString().slice(0, 16);
}

function formatDate(value) {
  if (!value) return 'Not scheduled';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatTime(value) {
  if (!value) return '';

  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({ status }) {
  const styles = {
    UPCOMING: 'bg-blue-50 text-blue-700 ring-blue-200',
    LIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    COMPLETED: 'bg-gray-100 text-gray-600 ring-gray-200',
  };

  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        styles[status] || styles.COMPLETED
      }`}
    >
      {status}
    </span>
  );
}

// ============================================================
// EVENT FORM
// ============================================================

function EventForm({
  initialEvent,
  onSave,
  onCancel,
  saving,
}) {
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    ...(initialEvent
      ? {
          title: initialEvent.title || '',
          description: initialEvent.description || '',
          venue: initialEvent.venue || '',
          coverImageUrl: initialEvent.coverImageUrl || '',
          startAt: toLocalDateTime(initialEvent.startAt),
          endAt: toLocalDateTime(initialEvent.endAt),
          isPublished: initialEvent.isPublished ?? true,
        }
      : {}),
  }));

  const [formError, setFormError] = useState('');

  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    const title = form.title.trim();
    const description = form.description.trim();
    const venue = form.venue.trim();
    const coverImageUrl = form.coverImageUrl.trim();

    if (title.length < 2 || title.length > 150) {
      setFormError(
        'Event title must contain between 2 and 150 characters.'
      );
      return;
    }

    if (description.length > 1000) {
      setFormError(
        'Description cannot exceed 1000 characters.'
      );
      return;
    }

    if (venue.length > 200) {
      setFormError(
        'Venue cannot exceed 200 characters.'
      );
      return;
    }

    if (!form.startAt || !form.endAt) {
      setFormError(
        'Please select both the start and end date/time.'
      );
      return;
    }

    const start = new Date(form.startAt);
    const end = new Date(form.endAt);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      setFormError(
        'The end date and time must be later than the start.'
      );
      return;
    }

    if (coverImageUrl) {
      try {
        const url = new URL(coverImageUrl);

        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('Invalid URL');
        }
      } catch {
        setFormError(
          'Please enter a valid HTTP or HTTPS image URL.'
        );
        return;
      }
    }

    onSave({
      title,
      description,
      venue,
      coverImageUrl,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      isPublished: form.isPublished,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 py-6 sm:items-center sm:p-6">
      <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#eadfd4] px-5 py-4 sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a52]">
              Rose & Aman
            </p>

            <h2 className="mt-1 text-xl font-bold text-[#2b211d]">
              {initialEvent ? 'Edit event' : 'Create event'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            aria-label="Close form"
            className="rounded-lg p-2 text-xl text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-5 sm:p-7"
        >
          {formError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {formError}
            </div>
          )}

          <div>
            <label
              htmlFor="event-title"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Event title *
            </label>

            <input
              id="event-title"
              name="title"
              value={form.title}
              onChange={handleChange}
              minLength={2}
              maxLength={150}
              required
              placeholder="e.g. Wedding Reception"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#7b2638] focus:ring-2 focus:ring-rose-100"
            />
          </div>

          <div>
            <label
              htmlFor="event-description"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Description
            </label>

            <textarea
              id="event-description"
              name="description"
              value={form.description}
              onChange={handleChange}
              maxLength={1000}
              rows={3}
              placeholder="Describe the wedding function..."
              className="w-full resize-y rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#7b2638] focus:ring-2 focus:ring-rose-100"
            />

            <p className="mt-1 text-right text-xs text-gray-400">
              {form.description.length}/1000
            </p>
          </div>

          <div>
            <label
              htmlFor="event-venue"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Venue
            </label>

            <input
              id="event-venue"
              name="venue"
              value={form.venue}
              onChange={handleChange}
              maxLength={200}
              placeholder="e.g. Grand Ballroom"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#7b2638] focus:ring-2 focus:ring-rose-100"
            />
          </div>

          <div>
            <label
              htmlFor="event-cover"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Cover image URL
            </label>

            <input
              id="event-cover"
              type="url"
              name="coverImageUrl"
              value={form.coverImageUrl}
              onChange={handleChange}
              placeholder="https://example.com/event-cover.jpg"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-[#7b2638] focus:ring-2 focus:ring-rose-100"
            />

            {form.coverImageUrl.trim() && (
              <img
                src={form.coverImageUrl}
                alt="Event cover preview"
                className="mt-3 h-36 w-full rounded-xl bg-gray-100 object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
                onLoad={(event) => {
                  event.currentTarget.style.display = 'block';
                }}
              />
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="event-start"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Start date & time *
              </label>

              <input
                id="event-start"
                type="datetime-local"
                name="startAt"
                value={form.startAt}
                onChange={handleChange}
                required
                className="w-full min-w-0 rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none focus:border-[#7b2638] focus:ring-2 focus:ring-rose-100"
              />
            </div>

            <div>
              <label
                htmlFor="event-end"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                End date & time *
              </label>

              <input
                id="event-end"
                type="datetime-local"
                name="endAt"
                value={form.endAt}
                onChange={handleChange}
                required
                className="w-full min-w-0 rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none focus:border-[#7b2638] focus:ring-2 focus:ring-rose-100"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-gray-200 p-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Publish event
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Published events can be displayed to guests when the
                public API filters unpublished events.
              </p>
            </div>

            <input
              type="checkbox"
              name="isPublished"
              checked={form.isPublished}
              onChange={handleChange}
              className="h-5 w-5 shrink-0 accent-[#7b2638]"
            />
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#7b2638] px-6 py-3 text-sm font-semibold text-white hover:bg-[#63202f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? 'Saving...'
                : initialEvent
                  ? 'Save changes'
                  : 'Create event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// EVENT CARD
// ============================================================

function EventCard({
  event,
  canManage,
  busy,
  onEdit,
  onDelete,
  onToggle,
}) {
  const status = getEventStatus(event);

  return (
    <article className="overflow-hidden rounded-2xl border border-[#eadfd4] bg-white shadow-sm transition hover:shadow-md">
      {event.coverImageUrl ? (
        <img
          src={event.coverImageUrl}
          alt={event.title}
          loading="lazy"
          className="h-44 w-full bg-[#f8f3ed] object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <div className="flex h-32 items-center justify-center bg-gradient-to-br from-[#f8eee9] to-[#f8f3ed]">
          <span
            className="font-serif text-4xl text-[#9a7a52]"
            aria-hidden="true"
          >
            R&A
          </span>
        </div>
      )}

      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="break-words font-serif text-xl font-semibold text-[#2b211d]">
              {event.title}
            </h3>

            <p className="mt-1 break-words text-sm text-gray-500">
              {event.venue || 'Venue not specified'}
            </p>
          </div>

          <StatusBadge status={status} />
        </div>

        <div className="space-y-2 rounded-xl bg-[#fffdf9] p-3 text-sm text-gray-600">
          <p>
            <span className="font-semibold text-[#5f554f]">
              Starts:
            </span>{' '}
            {formatDate(event.startAt)} · {formatTime(event.startAt)}
          </p>

          <p>
            <span className="font-semibold text-[#5f554f]">
              Ends:
            </span>{' '}
            {formatDate(event.endAt)} · {formatTime(event.endAt)}
          </p>
        </div>

        {event.description && (
          <p className="line-clamp-3 whitespace-pre-line text-sm leading-6 text-gray-600">
            {event.description}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-[#f0e8df] pt-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(event.isPublished)}
              aria-label={
                event.isPublished
                  ? 'Unpublish event'
                  : 'Publish event'
              }
              disabled={!canManage || busy}
              onClick={() =>
                onToggle(event, !event.isPublished)
              }
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${
                event.isPublished
                  ? 'bg-emerald-600'
                  : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                  event.isPublished
                    ? 'translate-x-6'
                    : 'translate-x-1'
                }`}
              />
            </button>

            <span className="text-xs font-medium text-gray-600">
              {event.isPublished ? 'Published' : 'Draft'}
            </span>
          </div>

          {canManage && (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => onEdit(event)}
                className="rounded-lg border border-[#e1d5ca] px-3 py-2 text-sm font-medium text-[#71303d] hover:bg-[#fffaf5] disabled:opacity-50"
              >
                Edit
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => onDelete(event)}
                className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

// ============================================================
// EVENTS PAGE
// ============================================================

export default function EventsPage() {
  const { user } = useAuth();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const canManage = [
    'SUPER_ADMIN',
    'HOTEL_ADMIN',
  ].includes(user?.role);

  const hotelId = isSuperAdmin
    ? DEMO_HOTEL_ID
    : user?.hotelId;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pageError, setPageError] = useState('');
  const [notice, setNotice] = useState('');

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [busyEventId, setBusyEventId] = useState('');

  // ----------------------------------------------------------
  // LOAD EVENTS
  // ----------------------------------------------------------

  const loadEvents = useCallback(async () => {
    if (!hotelId) {
      setEvents([]);
      setPageError(
        'No hotel is assigned to this account. Please check the account configuration.'
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setPageError('');

    try {
      const response = await getEvents({ hotelId });
      setEvents(response.events || []);
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // ----------------------------------------------------------
  // SUMMARY COUNTS
  // ----------------------------------------------------------

  const counts = useMemo(() => {
    const result = {
      total: events.length,
      published: events.filter(
        (event) => event.isPublished
      ).length,
      upcoming: 0,
      live: 0,
      completed: 0,
    };

    events.forEach((event) => {
      const status = getEventStatus(event);

      if (status === 'UPCOMING') result.upcoming += 1;
      if (status === 'LIVE') result.live += 1;
      if (status === 'COMPLETED') result.completed += 1;
    });

    return result;
  }, [events]);

  // ----------------------------------------------------------
  // SEARCH, FILTER AND SORT
  // ----------------------------------------------------------

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...events]
      .filter((event) => {
        const matchesSearch =
          !query ||
          event.title?.toLowerCase().includes(query) ||
          event.venue?.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query);

        const matchesStatus =
          filter === 'ALL' ||
          getEventStatus(event) === filter;

        return matchesSearch && matchesStatus;
      })
      .sort(
        (a, b) =>
          new Date(a.startAt).getTime() -
          new Date(b.startAt).getTime()
      );
  }, [events, search, filter]);

  // ----------------------------------------------------------
  // OPEN FORMS
  // ----------------------------------------------------------

  function openCreateForm() {
    setEditingEvent(null);
    setShowForm(true);
    setPageError('');
    setNotice('');
  }

  function openEditForm(event) {
    setEditingEvent(event);
    setShowForm(true);
    setPageError('');
    setNotice('');
  }

  // ----------------------------------------------------------
  // CREATE OR UPDATE
  // ----------------------------------------------------------

  async function handleSave(formData) {
    if (!hotelId) {
      setPageError(
        'A hotel must be assigned before saving events.'
      );
      return;
    }

    setSaving(true);
    setPageError('');
    setNotice('');

    try {
      if (editingEvent) {
        await updateEvent(editingEvent._id, formData);
        setNotice('Event updated successfully.');
      } else {
        await createEvent({
          ...formData,
          hotelId,
        });

        setNotice('Event created successfully.');
      }

      setShowForm(false);
      setEditingEvent(null);

      await loadEvents();
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  // ----------------------------------------------------------
  // PUBLISH OR UNPUBLISH
  // ----------------------------------------------------------

  async function handleToggle(event, isPublished) {
    setBusyEventId(event._id);
    setPageError('');
    setNotice('');

    try {
      await updateEvent(event._id, { isPublished });

      setEvents((current) =>
        current.map((item) =>
          item._id === event._id
            ? { ...item, isPublished }
            : item
        )
      );

      setNotice(
        isPublished
          ? 'Event published successfully.'
          : 'Event unpublished successfully.'
      );
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setBusyEventId('');
    }
  }

  // ----------------------------------------------------------
  // DELETE EVENT
  // ----------------------------------------------------------

  async function handleDelete(event) {
    const confirmed = window.confirm(
      `Delete "${event.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setBusyEventId(event._id);
    setPageError('');
    setNotice('');

    try {
      await deleteEvent(event._id);

      setEvents((current) =>
        current.filter((item) => item._id !== event._id)
      );

      setNotice('Event deleted successfully.');
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setBusyEventId('');
    }
  }

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9a7a52]">
            Rose & Aman Wedding
          </p>

          <h1 className="mt-1 font-serif text-3xl font-semibold text-[#2b211d] sm:text-4xl">
            Events
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Manage wedding functions, schedules and venues.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7b2638] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#63202f]"
          >
            <span className="text-lg leading-none">+</span>
            Create event
          </button>
        )}
      </div>

      {/* Error */}
      {pageError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{pageError}</span>

          <button
            type="button"
            onClick={() => setPageError('')}
            aria-label="Dismiss error"
            className="text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Success */}
      {notice && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          <span>{notice}</span>

          <button
            type="button"
            onClick={() => setNotice('')}
            aria-label="Dismiss notification"
            className="text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total events', value: counts.total },
          { label: 'Published', value: counts.published },
          { label: 'Upcoming', value: counts.upcoming },
          { label: 'Live now', value: counts.live },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-[#eadfd4] bg-white p-4 shadow-sm sm:p-5"
          >
            <p className="text-sm text-gray-500">
              {item.label}
            </p>

            <p className="mt-2 font-serif text-3xl font-semibold text-[#2b211d]">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Search and filters */}
      <section className="rounded-2xl border border-[#eadfd4] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search events, venues or descriptions..."
            className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#7b2638] focus:ring-2 focus:ring-rose-100"
          />

          <div className="flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`shrink-0 rounded-xl px-3 py-2.5 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                  filter === item
                    ? 'bg-[#7b2638] text-white'
                    : 'bg-[#f8f3ed] text-[#5f554f] hover:bg-[#f0e7dd]'
                }`}
              >
                {item === 'ALL'
                  ? 'All events'
                  : item.charAt(0) +
                    item.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Event list */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-72 animate-pulse rounded-2xl border border-[#eadfd4] bg-gray-100"
            />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d9c8b8] bg-white px-5 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f8eee9] font-serif text-xl text-[#7b2638]">
            R&A
          </div>

          <h2 className="mt-4 font-serif text-xl font-semibold text-[#2b211d]">
            {events.length === 0
              ? 'No events yet'
              : 'No matching events'}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            {events.length === 0
              ? 'Create your first wedding event to get started.'
              : 'Try another search term or choose a different status filter.'}
          </p>

          {canManage && events.length === 0 && (
            <button
              type="button"
              onClick={openCreateForm}
              className="mt-5 rounded-xl bg-[#7b2638] px-5 py-3 text-sm font-semibold text-white hover:bg-[#63202f]"
            >
              Create your first event
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-[#2b211d]">
              All events
            </h2>

            <span className="text-sm text-gray-500">
              {filteredEvents.length}{' '}
              {filteredEvents.length === 1 ? 'event' : 'events'}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredEvents.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                canManage={canManage}
                busy={busyEventId === event._id}
                onEdit={openEditForm}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </>
      )}

      {/* Form modal */}
      {showForm && (
        <EventForm
          key={editingEvent?._id || 'new-event'}
          initialEvent={editingEvent}
          onSave={handleSave}
          onCancel={() => {
            if (!saving) {
              setShowForm(false);
              setEditingEvent(null);
            }
          }}
          saving={saving}
        />
      )}
    </div>
  );
}
