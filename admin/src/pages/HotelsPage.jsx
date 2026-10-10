
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  createHotel,
  deleteHotel,
  getHotels,
  updateHotel,
} from '../api/client.js';

const EMPTY_FORM = {
  name: '',
  slug: '',
  logoUrl: '',
  address: '',
  phone: '',
  email: '',
  taxPercent: '0',
  currency: 'INR',
  isActive: true,
};

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    'Something went wrong.'
  );
}

function HotelForm({ initialData, onCancel, onSave, saving }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    ...(initialData || {}),
    taxPercent: String(initialData?.taxPercent ?? 0),
  }));

  const [slugEdited, setSlugEdited] = useState(Boolean(initialData));

  function changeField(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => {
      const next = {
        ...previous,
        [name]: type === 'checkbox' ? checked : value,
      };

      if (name === 'name' && !slugEdited) {
        next.slug = slugify(value);
      }

      return next;
    });
  }

  async function submit(event) {
    event.preventDefault();

    const payload = {
      name: form.name.trim(),
      slug: slugify(form.slug),
      logoUrl: form.logoUrl.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      taxPercent: Number(form.taxPercent),
      currency: form.currency.trim().toUpperCase(),
      isActive: form.isActive,
    };

    if (
      !payload.name ||
      payload.name.length < 2 ||
      !payload.slug ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug)
    ) {
      window.alert('Enter a valid hotel name and URL slug.');
      return;
    }

    if (
      payload.logoUrl &&
      !/^https?:\/\/.+/i.test(payload.logoUrl)
    ) {
      window.alert('Logo URL must start with http:// or https://');
      return;
    }

    if (
      payload.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)
    ) {
      window.alert('Enter a valid email address.');
      return;
    }

    if (
      !Number.isFinite(payload.taxPercent) ||
      payload.taxPercent < 0 ||
      payload.taxPercent > 100
    ) {
      window.alert('Tax percentage must be between 0 and 100.');
      return;
    }

    await onSave(payload);
  }

  const inputClass =
    'mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-rose-800 focus:ring-2 focus:ring-rose-100';

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-stone-700">
          Hotel name *
          <input
            className={inputClass}
            name="name"
            value={form.name}
            onChange={changeField}
            placeholder="e.g. Demo Grand Hotel"
            required
            minLength={2}
            maxLength={150}
          />
        </label>

        <label className="text-sm font-medium text-stone-700">
          URL slug *
          <input
            className={inputClass}
            name="slug"
            value={form.slug}
            onChange={(event) => {
              setSlugEdited(true);
              setForm((previous) => ({
                ...previous,
                slug: event.target.value,
              }));
            }}
            placeholder="demo-grand-hotel"
            required
          />
          <span className="mt-1 block text-xs text-stone-400">
            Lowercase letters, numbers and hyphens.
          </span>
        </label>

        <label className="text-sm font-medium text-stone-700">
          Logo URL
          <input
            className={inputClass}
            name="logoUrl"
            type="url"
            value={form.logoUrl}
            onChange={changeField}
            placeholder="https://example.com/logo.png"
          />
        </label>

        <label className="text-sm font-medium text-stone-700">
          Phone
          <input
            className={inputClass}
            name="phone"
            value={form.phone}
            onChange={changeField}
            maxLength={30}
            placeholder="Hotel contact number"
          />
        </label>

        <label className="text-sm font-medium text-stone-700 sm:col-span-2">
          Email
          <input
            className={inputClass}
            name="email"
            type="email"
            value={form.email}
            onChange={changeField}
            placeholder="contact@example.com"
          />
        </label>

        <label className="text-sm font-medium text-stone-700 sm:col-span-2">
          Address
          <textarea
            className={inputClass}
            name="address"
            value={form.address}
            onChange={changeField}
            rows={3}
            maxLength={500}
            placeholder="Full hotel address"
          />
        </label>

        <label className="text-sm font-medium text-stone-700">
          Tax percentage
          <input
            className={inputClass}
            name="taxPercent"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={form.taxPercent}
            onChange={changeField}
          />
        </label>

        <label className="text-sm font-medium text-stone-700">
          Currency
          <select
            className={inputClass}
            name="currency"
            value={form.currency}
            onChange={changeField}
          >
            <option value="INR">INR — Indian Rupee</option>
            <option value="USD">USD — US Dollar</option>
            <option value="GBP">GBP — British Pound</option>
            <option value="EUR">EUR — Euro</option>
          </select>
        </label>
      </div>

      <label className="flex items-center gap-3 text-sm text-stone-700">
        <input
          type="checkbox"
          name="isActive"
          checked={form.isActive}
          onChange={changeField}
          className="h-4 w-4 accent-rose-900"
        />
        Hotel is active
      </label>

      <div className="flex flex-wrap justify-end gap-3 border-t border-stone-100 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-xl border border-stone-200 px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-rose-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-950 disabled:opacity-50"
        >
          {saving
            ? 'Saving...'
            : initialData
              ? 'Save changes'
              : 'Create hotel'}
        </button>
      </div>
    </form>
  );
}

export default function HotelsPage() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editingHotel, setEditingHotel] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const loadHotels = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getHotels();
      setHotels(response.hotels || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHotels();
  }, [loadHotels]);

  const filteredHotels = useMemo(() => {
    const query = search.trim().toLowerCase();

    return hotels.filter((hotel) => {
      const matchesSearch =
        !query ||
        [
          hotel.name,
          hotel.slug,
          hotel.email,
          hotel.phone,
          hotel.address,
        ].some((value) =>
          String(value || '').toLowerCase().includes(query)
        );

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && hotel.isActive) ||
        (statusFilter === 'INACTIVE' && !hotel.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [hotels, search, statusFilter]);

  const activeCount = hotels.filter((hotel) => hotel.isActive).length;
  const inactiveCount = hotels.length - activeCount;

  function openCreateForm() {
    setEditingHotel(null);
    setFormOpen(true);
  }

  function openEditForm(hotel) {
    setEditingHotel(hotel);
    setFormOpen(true);
  }

  async function saveHotel(payload) {
    setSaving(true);
    setError('');

    try {
      if (editingHotel) {
        await updateHotel(editingHotel._id, payload);
      } else {
        await createHotel(payload);
      }

      setFormOpen(false);
      setEditingHotel(null);
      await loadHotels();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleHotel(hotel) {
    const action = hotel.isActive ? 'deactivate' : 'activate';

    if (
      !window.confirm(
        `Are you sure you want to ${action} "${hotel.name}"?`
      )
    ) {
      return;
    }

    setError('');

    try {
      await updateHotel(hotel._id, {
        isActive: !hotel.isActive,
      });

      await loadHotels();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function removeHotel(hotel) {
    if (
      !window.confirm(
        `Delete "${hotel.name}" permanently? This cannot be undone.`
      )
    ) {
      return;
    }

    setError('');

    try {
      await deleteHotel(hotel._id);
      await loadHotels();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <main className="min-h-full bg-[#f7f3ee] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-800">
              Administration
            </p>

            <h1 className="mt-1 font-serif text-4xl font-bold text-stone-900">
              Hotels
            </h1>

            <p className="mt-2 text-sm text-stone-500">
              Manage properties, hotel information and activation status.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={loadHotels}
              disabled={loading}
              className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
            >
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreateForm}
              className="rounded-xl bg-rose-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-rose-950"
            >
              + Add hotel
            </button>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError('')}
              className="font-bold"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Total hotels', value: hotels.length },
            { label: 'Active hotels', value: activeCount },
            { label: 'Inactive hotels', value: inactiveCount },
          ].map((item) => (
            <article
              key={item.label}
              className="rounded-2xl border border-[#eaded2] bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-stone-500">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-stone-900">
                {item.value}
              </p>
            </article>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#eaded2] bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-stone-100 p-4 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search hotel, slug, email or phone..."
              className="min-w-0 flex-1 rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-rose-800"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm"
              aria-label="Filter hotel status"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-stone-500">
              Loading hotels...
            </div>
          ) : filteredHotels.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl">⌂</div>
              <h2 className="mt-3 text-lg font-bold text-stone-900">
                {hotels.length === 0
                  ? 'No hotels yet'
                  : 'No matching hotels'}
              </h2>
              <p className="mt-2 text-sm text-stone-500">
                {hotels.length === 0
                  ? 'Create your first hotel to get started.'
                  : 'Try changing your search or status filter.'}
              </p>

              {hotels.length === 0 && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-5 rounded-xl bg-rose-900 px-5 py-3 text-sm font-semibold text-white"
                >
                  + Create first hotel
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                      <th className="px-5 py-4">Hotel</th>
                      <th className="px-5 py-4">Contact</th>
                      <th className="px-5 py-4">Tax / Currency</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-stone-100">
                    {filteredHotels.map((hotel) => (
                      <tr key={hotel._id} className="hover:bg-stone-50/70">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {hotel.logoUrl ? (
                              <img
                                src={hotel.logoUrl}
                                alt=""
                                className="h-11 w-11 rounded-xl border border-stone-100 object-cover"
                              />
                            ) : (
                              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 font-serif text-lg font-bold text-rose-900">
                                {hotel.name?.charAt(0)?.toUpperCase() || 'H'}
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="font-semibold text-stone-900">
                                {hotel.name}
                              </p>
                              <p className="mt-1 text-xs text-stone-400">
                                /{hotel.slug}
                              </p>
                              {hotel.address && (
                                <p className="mt-1 max-w-xs truncate text-xs text-stone-500">
                                  {hotel.address}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-stone-600">
                          <p>{hotel.email || '—'}</p>
                          <p className="mt-1 text-xs text-stone-400">
                            {hotel.phone || 'No phone'}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-stone-600">
                          <p>{hotel.taxPercent ?? 0}% tax</p>
                          <p className="mt-1 text-xs text-stone-400">
                            {hotel.currency || 'INR'}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                              hotel.isActive
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-stone-100 text-stone-500'
                            }`}
                          >
                            {hotel.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(hotel)}
                              className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold hover:bg-stone-50"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleHotel(hotel)}
                              className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold hover:bg-stone-50"
                            >
                              {hotel.isActive ? 'Deactivate' : 'Activate'}
                            </button>

                            <button
                              type="button"
                              onClick={() => removeHotel(hotel)}
                              className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 p-3 md:hidden">
                {filteredHotels.map((hotel) => (
                  <article
                    key={hotel._id}
                    className="rounded-xl border border-stone-100 p-4"
                  >
                    <div className="flex items-start gap-3">
                      {hotel.logoUrl ? (
                        <img
                          src={hotel.logoUrl}
                          alt=""
                          className="h-12 w-12 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 font-serif text-xl font-bold text-rose-900">
                          {hotel.name?.charAt(0)?.toUpperCase() || 'H'}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h2 className="font-bold text-stone-900">
                          {hotel.name}
                        </h2>
                        <p className="mt-1 text-xs text-stone-400">
                          /{hotel.slug}
                        </p>
                        <p className="mt-2 break-words text-sm text-stone-600">
                          {hotel.email || hotel.phone || 'No contact details'}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2 py-1 text-xs font-bold ${
                          hotel.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        {hotel.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openEditForm(hotel)}
                        className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleHotel(hotel)}
                        className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold"
                      >
                        {hotel.isActive ? 'Deactivate' : 'Activate'}
                      </button>

                      <button
                        type="button"
                        onClick={() => removeHotel(hotel)}
                        className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {!loading && filteredHotels.length > 0 && (
            <div className="border-t border-stone-100 px-5 py-4 text-xs text-stone-400">
              Showing {filteredHotels.length} of {hotels.length} hotels
            </div>
          )}
        </section>
      </div>

      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-stone-950/50 p-4 sm:items-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setFormOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="hotel-form-title"
            className="my-4 w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-800">
                  Hotel management
                </p>
                <h2
                  id="hotel-form-title"
                  className="mt-1 font-serif text-2xl font-bold text-stone-900"
                >
                  {editingHotel ? 'Edit hotel' : 'Add a hotel'}
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Enter the hotel's details below.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => setFormOpen(false)}
                className="rounded-lg px-3 py-2 text-xl text-stone-500 hover:bg-stone-100 disabled:opacity-50"
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            <HotelForm
              key={editingHotel?._id || 'new-hotel'}
              initialData={editingHotel}
              onCancel={() => setFormOpen(false)}
              onSave={saveHotel}
              saving={saving}
            />
          </section>
        </div>
      )}
    </main>
  );
}
