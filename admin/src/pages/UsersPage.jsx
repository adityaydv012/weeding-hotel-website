
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getUsers,
  getHotels,
  createUser,
  updateUser,
  deactivateUser,
} from '../api/client';

const ROLES = [
  'SUPER_ADMIN',
  'HOTEL_ADMIN',
  'STAFF',
  'KITCHEN',
];

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  HOTEL_ADMIN: 'Hotel Admin',
  STAFF: 'Staff',
  KITCHEN: 'Kitchen',
};

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  role: 'STAFF',
  hotelId: '',
  isActive: true,
};

function getError(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Something went wrong. Please try again.'
  );
}

function formatDate(date) {
  if (!date) return '—';

  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getHotelName(user) {
  if (!user?.hotelId) return 'Platform-wide';
  if (typeof user.hotelId === 'object') {
    return user.hotelId.name || 'Assigned hotel';
  }
  return 'Assigned hotel';
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [notice, setNotice] = useState('');

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setPageError('');

    try {
      const [userResponse, hotelResponse] = await Promise.all([
        getUsers({
          search: search.trim(),
          role: roleFilter,
          status: statusFilter,
        }),
        getHotels(),
      ]);

      setUsers(userResponse.users || []);
      setHotels(hotelResponse.hotels || []);
    } catch (error) {
      setPageError(getError(error));
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);

    return () => clearTimeout(timer);
  }, [loadData]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((user) => user.isActive).length,
      inactive: users.filter((user) => !user.isActive).length,
      hotelAdmins: users.filter(
        (user) => user.role === 'HOTEL_ADMIN'
      ).length,
    };
  }, [users]);

  function openCreateModal() {
    setEditingUser(null);
    setForm({ ...EMPTY_FORM });
    setNotice('');
    setModalOpen(true);
  }

  function openEditModal(user) {
    setEditingUser(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'STAFF',
      hotelId:
        typeof user.hotelId === 'object'
          ? user.hotelId?._id || ''
          : user.hotelId || '',
      isActive: Boolean(user.isActive),
    });
    setNotice('');
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditingUser(null);
    setForm({ ...EMPTY_FORM });
  }

  function changeField(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'role' && value === 'SUPER_ADMIN'
        ? { hotelId: '' }
        : {}),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setPageError('');

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
      hotelId: form.role === 'SUPER_ADMIN' ? null : form.hotelId,
      isActive: form.isActive,
    };

    if (form.password.trim()) {
      payload.password = form.password;
    }

    if (!editingUser && !payload.password) {
      setPageError('A password is required when creating a user.');
      setSaving(false);
      return;
    }

    if (form.role !== 'SUPER_ADMIN' && !form.hotelId) {
      setPageError('Please select a hotel for this user.');
      setSaving(false);
      return;
    }

    try {
      if (editingUser) {
        await updateUser(editingUser._id, payload);
        setNotice('User details updated successfully.');
      } else {
        await createUser(payload);
        setNotice('User created successfully.');
      }

      setModalOpen(false);
      setEditingUser(null);
      setForm({ ...EMPTY_FORM });
      await loadData();
    } catch (error) {
      setPageError(getError(error));
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(user) {
    const action = user.isActive ? 'deactivate' : 'activate';
    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${user.name}?`
    );

    if (!confirmed) return;

    setActionId(user._id);
    setPageError('');
    setNotice('');

    try {
      if (user.isActive) {
        await deactivateUser(user._id);
      } else {
        await updateUser(user._id, { isActive: true });
      }

      setNotice(
        `${user.name} has been ${user.isActive ? 'deactivated' : 'activated'}.`
      );

      await loadData();
    } catch (error) {
      setPageError(getError(error));
    } finally {
      setActionId('');
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f5f2] text-[#28211f]">
      <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Page heading */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8d7770]">
              <span>Administration</span>
              <span className="text-[#c8b8ae]">/</span>
              <span className="text-[#762b38]">Users</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              User management
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#817772]">
              Manage team access, assign hotel roles and control account status.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-[#762b38] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#61212d] focus:outline-none focus:ring-4 focus:ring-[#762b38]/15 sm:self-auto"
          >
            <span className="text-lg leading-none">+</span>
            Add user
          </button>
        </header>

        {/* Feedback */}
        {pageError && (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <span>{pageError}</span>
            <button
              type="button"
              onClick={() => setPageError('')}
              className="font-bold"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {notice && !pageError && (
          <div
            role="status"
            className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice('')}
              className="font-bold"
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {/* Summary cards */}
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            label="Users in results"
            value={stats.total}
            description="Matching current filters"
            mark="U"
          />
          <StatCard
            label="Active accounts"
            value={stats.active}
            description="Currently enabled"
            mark="✓"
          />
          <StatCard
            label="Inactive accounts"
            value={stats.inactive}
            description="Access disabled"
            mark="–"
          />
          <StatCard
            label="Hotel admins"
            value={stats.hotelAdmins}
            description="Hotel-level managers"
            mark="H"
          />
        </section>

        {/* Main table panel */}
        <section className="overflow-hidden rounded-2xl border border-[#e9e2dc] bg-white shadow-[0_3px_16px_rgba(48,31,23,0.035)]">
          <div className="border-b border-[#eee8e3] p-4 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-base font-bold">All users</h2>
                <p className="mt-1 text-xs text-[#8b817b]">
                  Review accounts and manage permissions.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="relative block sm:col-span-1">
                  <span className="sr-only">Search users</span>
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9c9088]">
                    ⌕
                  </span>
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search name or email"
                    className="h-10 w-full rounded-lg border border-[#e8e0da] bg-[#fcfbfa] pl-9 pr-3 text-sm outline-none transition placeholder:text-[#a79c95] focus:border-[#762b38] focus:ring-2 focus:ring-[#762b38]/10"
                  />
                </label>

                <label>
                  <span className="sr-only">Filter by role</span>
                  <select
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value)}
                    className="h-10 w-full rounded-lg border border-[#e8e0da] bg-white px-3 text-sm outline-none focus:border-[#762b38]"
                  >
                    <option value="">All roles</option>
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="sr-only">Filter by status</span>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="h-10 w-full rounded-lg border border-[#e8e0da] bg-white px-3 text-sm outline-none focus:border-[#762b38]"
                  >
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left">
              <thead>
                <tr className="bg-[#fbf9f7] text-[10px] font-bold uppercase tracking-[0.12em] text-[#92857d]">
                  <th className="px-5 py-4">User</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4">Hotel</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Created</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f0ebe7]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-[#e9dce0] border-t-[#762b38]" />
                      <p className="text-sm text-[#8b817b]">
                        Loading users...
                      </p>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f7f1ed] text-xl text-[#762b38]">
                        U
                      </div>
                      <p className="text-sm font-semibold">
                        No users found
                      </p>
                      <p className="mt-1 text-xs text-[#92857d]">
                        Try different filters or create a new user.
                      </p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user._id}
                      className="transition hover:bg-[#fdfbf9]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f1e7e8] text-xs font-bold uppercase text-[#762b38]">
                            {user.name
                              ?.trim()
                              .split(/\s+/)
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join('') || 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-[220px] truncate text-sm font-semibold text-[#302724]">
                              {user.name}
                            </p>
                            <p className="mt-1 max-w-[220px] truncate text-xs text-[#91857d]">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <RoleBadge role={user.role} />
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm text-[#5d514b]">
                          {getHotelName(user)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge active={user.isActive} />
                      </td>

                      <td className="px-5 py-4 text-sm text-[#817772]">
                        {formatDate(user.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="rounded-lg border border-[#e8e0da] px-3 py-2 text-xs font-semibold text-[#6e2935] transition hover:border-[#762b38] hover:bg-[#fbf4f5]"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={actionId === user._id}
                            onClick={() => toggleStatus(user)}
                            className={[
                              'rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
                              user.isActive
                                ? 'border-[#eee0dc] text-[#a34d3e] hover:bg-[#fff5f2]'
                                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
                            ].join(' ')}
                          >
                            {actionId === user._id
                              ? 'Saving...'
                              : user.isActive
                                ? 'Deactivate'
                                : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 border-t border-[#eee8e3] px-5 py-4 text-xs text-[#8b817b] sm:flex-row sm:items-center sm:justify-between">
            <span>
              {loading
                ? 'Fetching records...'
                : `${users.length} user${users.length === 1 ? '' : 's'} displayed`}
            </span>
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="self-start font-semibold text-[#762b38] hover:underline disabled:opacity-50 sm:self-auto"
            >
              ↻ Refresh list
            </button>
          </div>
        </section>
      </div>

      {/* Create/edit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#201614]/50 p-3 backdrop-blur-[2px] sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-modal-title"
            className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-white/50 bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-[#eee8e3] px-5 py-5 sm:px-7">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9a7775]">
                  Account settings
                </p>
                <h2
                  id="user-modal-title"
                  className="mt-1 text-xl font-bold"
                >
                  {editingUser ? 'Edit user' : 'Create new user'}
                </h2>
                <p className="mt-1 text-xs text-[#8b817b]">
                  {editingUser
                    ? 'Update the account information and access.'
                    : 'Add a team member to your platform.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close dialog"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-[#8c8078] transition hover:bg-[#f6f1ed] disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-7">
                <div className="sm:col-span-2">
                  <FormLabel htmlFor="name">Full name</FormLabel>
                  <input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={changeField}
                    required
                    minLength={2}
                    maxLength={150}
                    placeholder="Enter full name"
                    className="form-control"
                  />
                </div>

                <div className="sm:col-span-2">
                  <FormLabel htmlFor="email">Email address</FormLabel>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={changeField}
                    required
                    placeholder="name@company.com"
                    className="form-control"
                  />
                </div>

                <div className="sm:col-span-2">
                  <FormLabel htmlFor="password">
                    Password {editingUser ? '(optional)' : ''}
                  </FormLabel>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={changeField}
                    required={!editingUser}
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    placeholder={
                      editingUser
                        ? 'Leave blank to keep the current password'
                        : 'Minimum 8 characters'
                    }
                    className="form-control"
                  />
                  {editingUser && (
                    <p className="mt-1.5 text-[11px] text-[#92857d]">
                      Only enter a password if you want to change it.
                    </p>
                  )}
                </div>

                <div>
                  <FormLabel htmlFor="role">User role</FormLabel>
                  <select
                    id="role"
                    name="role"
                    value={form.role}
                    onChange={changeField}
                    required
                    className="form-control"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FormLabel htmlFor="hotelId">Hotel assignment</FormLabel>
                  <select
                    id="hotelId"
                    name="hotelId"
                    value={form.role === 'SUPER_ADMIN' ? '' : form.hotelId}
                    onChange={changeField}
                    disabled={form.role === 'SUPER_ADMIN'}
                    required={form.role !== 'SUPER_ADMIN'}
                    className="form-control disabled:cursor-not-allowed disabled:bg-[#f5f2ef] disabled:text-[#a79c95]"
                  >
                    <option value="">
                      {form.role === 'SUPER_ADMIN'
                        ? 'Not required'
                        : 'Select a hotel'}
                    </option>
                    {hotels.map((hotel) => (
                      <option key={hotel._id} value={hotel._id}>
                        {hotel.name}
                      </option>
                    ))}
                  </select>
                  {form.role === 'SUPER_ADMIN' && (
                    <p className="mt-1.5 text-[11px] text-[#92857d]">
                      Super Admin accounts are platform-wide.
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-[#e9e2dc] bg-[#fcfaf8] p-4">
                    <span>
                      <span className="block text-sm font-semibold">
                        Account status
                      </span>
                      <span className="mt-1 block text-xs text-[#8b817b]">
                        {form.isActive
                          ? 'This user can access the platform.'
                          : 'This account will be inactive.'}
                      </span>
                    </span>

                    <input
                      type="checkbox"
                      name="isActive"
                      checked={form.isActive}
                      onChange={changeField}
                      className="h-4 w-4 accent-[#762b38]"
                    />
                  </label>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-[#eee8e3] bg-[#fcfaf8] px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-[#e5dcd5] px-5 py-3 text-sm font-semibold text-[#655750] transition hover:bg-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#762b38] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#61212d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? 'Saving...'
                    : editingUser
                      ? 'Save changes'
                      : 'Create user'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Scoped styles for modal inputs */}
      <style>{`
        .form-control {
          display: block;
          width: 100%;
          min-height: 42px;
          margin-top: 7px;
          border: 1px solid #e8e0da;
          border-radius: 9px;
          background: #fff;
          padding: 10px 12px;
          color: #302724;
          font-size: 13px;
          outline: none;
          transition: border-color 150ms, box-shadow 150ms;
        }
        .form-control:focus {
          border-color: #762b38;
          box-shadow: 0 0 0 3px rgba(118, 43, 56, 0.09);
        }
        .form-control::placeholder {
          color: #a79c95;
        }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, description, mark }) {
  return (
    <div className="rounded-2xl border border-[#e9e2dc] bg-white p-4 shadow-[0_3px_16px_rgba(48,31,23,0.025)] sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-[#817772]">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f4e9e9] text-sm font-bold text-[#762b38]">
          {mark}
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-[#302724]">
        {value}
      </p>
      <p className="mt-1 text-[11px] text-[#9a8f88]">{description}</p>
    </div>
  );
}

function FormLabel({ htmlFor, children }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-semibold text-[#51443e]"
    >
      {children}
    </label>
  );
}

function RoleBadge({ role }) {
  const styles = {
    SUPER_ADMIN: 'border-purple-200 bg-purple-50 text-purple-800',
    HOTEL_ADMIN: 'border-[#e8d4d8] bg-[#fbf0f2] text-[#762b38]',
    STAFF: 'border-blue-200 bg-blue-50 text-blue-800',
    KITCHEN: 'border-amber-200 bg-amber-50 text-amber-800',
  };

  return (
    <span
      className={[
        'inline-flex whitespace-nowrap rounded-full border px-2.5 py-1.5 text-[11px] font-semibold',
        styles[role] || 'border-gray-200 bg-gray-50 text-gray-700',
      ].join(' ')}
    >
      {ROLE_LABELS[role] || role}
    </span>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[11px] font-semibold',
        active
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-[#f3eee8] text-[#857a72]',
      ].join(' ')}
    >
      <span
        className={[
          'h-1.5 w-1.5 rounded-full',
          active ? 'bg-emerald-600' : 'bg-[#aa9b8e]',
        ].join(' ')}
      />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}
