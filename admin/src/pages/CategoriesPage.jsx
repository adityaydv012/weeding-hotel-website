import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '../context/AuthContext.jsx';

import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../api/client.js';

const DEMO_HOTEL_ID =
  '6ac5c6be34fd0e1d0236f8b9';

const EMPTY_FORM = {
  name: '',
  imageUrl: '',
  displayOrder: '0',
  isActive: true,
};

function CategoriesPage() {
  const { user } = useAuth();

  const isSuperAdmin =
    user?.role === 'SUPER_ADMIN';

  const hotelId =
    isSuperAdmin
      ? DEMO_HOTEL_ID
      : user?.hotelId;

  const [categories, setCategories] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('ALL');

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingCategory, setEditingCategory] =
    useState(null);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [deleteTarget, setDeleteTarget] =
    useState(null);

  // ============================================================
  // LOAD CATEGORIES
  // ============================================================

  async function loadCategories() {
    if (!hotelId) {
      setCategories([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response =
        await getCategories({
          hotelId,
        });

      if (!response.success) {
        throw new Error(
          response.message ||
            'Unable to load categories.'
        );
      }

      setCategories(
        response.categories || []
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to load categories.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, [hotelId]);

  // ============================================================
  // FILTERING
  // ============================================================

  const filteredCategories = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return categories.filter(
      (category) => {
        const matchesSearch =
          !query ||
          category.name
            ?.toLowerCase()
            .includes(query);

        const matchesStatus =
          statusFilter === 'ALL' ||
          (statusFilter === 'ACTIVE' &&
            category.isActive) ||
          (statusFilter === 'INACTIVE' &&
            !category.isActive);

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );
  }, [
    categories,
    search,
    statusFilter,
  ]);

  // ============================================================
  // STATS
  // ============================================================

  const stats = useMemo(() => {
    const active =
      categories.filter(
        (category) =>
          category.isActive
      ).length;

    const inactive =
      categories.length - active;

    return {
      total: categories.length,
      active,
      inactive,
    };
  }, [categories]);

  // ============================================================
  // MODAL
  // ============================================================

  function openCreateModal() {
    setEditingCategory(null);
    setForm(EMPTY_FORM);
    setError('');
    setSuccess('');
    setModalOpen(true);
  }

  function openEditModal(category) {
    setEditingCategory(category);

    setForm({
      name: category.name || '',
      imageUrl: category.imageUrl || '',
      displayOrder: String(
        category.displayOrder ?? 0
      ),
      isActive:
        category.isActive !== false,
    });

    setError('');
    setSuccess('');
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingCategory(null);
    setForm(EMPTY_FORM);
  }

  // ============================================================
  // FORM
  // ============================================================

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  // ============================================================
  // CREATE / UPDATE
  // ============================================================

  async function handleSubmit(event) {
    event.preventDefault();

    if (!hotelId) {
      setError(
        'Hotel information is not available.'
      );
      return;
    }

    const name = form.name.trim();

    if (!name) {
      setError(
        'Category name is required.'
      );
      return;
    }

    const displayOrder =
      Number(form.displayOrder);

    if (
      !Number.isInteger(displayOrder) ||
      displayOrder < 0
    ) {
      setError(
        'Display order must be a valid non-negative number.'
      );
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        name,
        imageUrl:
          form.imageUrl.trim(),
        displayOrder,
        isActive:
          Boolean(form.isActive),
      };

      if (editingCategory) {
        const response =
          await updateCategory(
            editingCategory._id,
            payload
          );

        if (!response.success) {
          throw new Error(
            response.message ||
              'Unable to update category.'
          );
        }

        setSuccess(
          'Category updated successfully.'
        );
      } else {
        const response =
          await createCategory({
            hotelId,
            ...payload,
          });

        if (!response.success) {
          throw new Error(
            response.message ||
              'Unable to create category.'
          );
        }

        setSuccess(
          'Category created successfully.'
        );
      }

      await loadCategories();

      setModalOpen(false);
      setEditingCategory(null);
      setForm(EMPTY_FORM);

      window.setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          err.message ||
          'Something went wrong.'
      );
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // DELETE
  // ============================================================

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      setSaving(true);
      setError('');

      const response =
        await deleteCategory(
          deleteTarget._id
        );

      if (!response.success) {
        throw new Error(
          response.message ||
            'Unable to delete category.'
        );
      }

      setDeleteTarget(null);

      await loadCategories();

      setSuccess(
        'Category deleted successfully.'
      );

      window.setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to delete category.'
      );
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // TOGGLE STATUS
  // ============================================================

  async function toggleCategoryStatus(
    category
  ) {
    try {
      setError('');

      const response =
        await updateCategory(
          category._id,
          {
            isActive:
              !category.isActive,
          }
        );

      if (!response.success) {
        throw new Error(
          response.message ||
            'Unable to update category.'
        );
      }

      setCategories((current) =>
        current.map((item) =>
          item._id === category._id
            ? {
                ...item,
                isActive:
                  !item.isActive,
              }
            : item
        )
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to update category.'
      );
    }
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-[#f8f5f0] px-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7b2638] text-xl font-serif text-[#f8e8c8] shadow-lg">
            R
          </div>

          <div className="mx-auto mt-5 h-8 w-8 animate-spin rounded-full border-4 border-[#eadfd4] border-t-[#7b2638]" />

          <p className="mt-4 text-sm text-[#756b64]">
            Loading categories...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f8f5f0]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9a7a52]">
              Menu Management
            </p>

            <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-[#2b211d] sm:text-4xl">
              Categories
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#756b64]">
              Organize your hotel menu into
              clear food categories.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7b2638] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#682031] active:scale-[0.98]"
          >
            <span className="text-lg leading-none">
              +
            </span>
            Add Category
          </button>
        </div>

        {/* ================================================== */}
        {/* SUCCESS */}
        {/* ================================================== */}

        {success && (
          <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {success}
          </div>
        )}

        {/* ================================================== */}
        {/* ERROR */}
        {/* ================================================== */}

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* ================================================== */}
        {/* STATS */}
        {/* ================================================== */}

        <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label="Total Categories"
            value={stats.total}
          />

          <StatCard
            label="Active"
            value={stats.active}
          />

          <StatCard
            label="Inactive"
            value={stats.inactive}
          />
        </div>

        {/* ================================================== */}
        {/* FILTERS */}
        {/* ================================================== */}

        <div className="mt-6 rounded-2xl border border-[#eadfd4] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative min-w-0 flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[#aa9b8e]">
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
                placeholder="Search categories..."
                className="w-full rounded-xl border border-[#e5dbd1] bg-[#fffdf9] py-3 pl-11 pr-4 text-sm text-[#2b211d] outline-none transition placeholder:text-[#aa9b8e] focus:border-[#7b2638] focus:ring-2 focus:ring-[#7b2638]/10"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {[
                {
                  label: 'All',
                  value: 'ALL',
                },
                {
                  label: 'Active',
                  value: 'ACTIVE',
                },
                {
                  label: 'Inactive',
                  value: 'INACTIVE',
                },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    setStatusFilter(
                      item.value
                    )
                  }
                  className={[
                    'shrink-0 rounded-xl px-4 py-3 text-xs font-semibold transition',
                    statusFilter ===
                    item.value
                      ? 'bg-[#7b2638] text-white'
                      : 'bg-[#f8f3ed] text-[#756b64] hover:bg-[#efe6dc]',
                  ].join(' ')}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ================================================== */}
        {/* DESKTOP TABLE */}
        {/* ================================================== */}

        <div className="mt-6 hidden overflow-hidden rounded-2xl border border-[#eadfd4] bg-white shadow-sm lg:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-[#eadfd4] bg-[#fffdf9] text-left">
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#aa9b8e]">
                    Category
                  </th>

                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#aa9b8e]">
                    Order
                  </th>

                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#aa9b8e]">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-[#aa9b8e]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredCategories.map(
                  (category) => (
                    <tr
                      key={category._id}
                      className="border-b border-[#f0e7df] last:border-b-0"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <CategoryImage
                            category={category}
                          />

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#332a26]">
                              {category.name}
                            </p>

                            <p className="mt-0.5 text-[11px] text-[#aa9b8e]">
                              ID:{' '}
                              {category._id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-lg bg-[#f8f3ed] px-3 py-1.5 text-xs font-semibold text-[#756b64]">
                          #
                          {category.displayOrder ??
                            0}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          active={
                            category.isActive
                          }
                        />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              toggleCategoryStatus(
                                category
                              )
                            }
                            className="rounded-lg border border-[#e5dbd1] px-3 py-2 text-xs font-semibold text-[#756b64] transition hover:bg-[#f8f3ed]"
                          >
                            {category.isActive
                              ? 'Disable'
                              : 'Enable'}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                category
                              )
                            }
                            className="rounded-lg bg-[#f8f3ed] px-3 py-2 text-xs font-semibold text-[#7b2638] transition hover:bg-[#efe6dc]"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget(
                                category
                              )
                            }
                            className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {filteredCategories.length === 0 && (
            <EmptyState
              search={search}
              onAdd={openCreateModal}
            />
          )}
        </div>

        {/* ================================================== */}
        {/* MOBILE CARDS */}
        {/* ================================================== */}

        <div className="mt-6 space-y-3 lg:hidden">
          {filteredCategories.map(
            (category) => (
              <div
                key={category._id}
                className="rounded-2xl border border-[#eadfd4] bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <CategoryImage
                    category={category}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#332a26]">
                          {category.name}
                        </p>

                        <p className="mt-1 text-[11px] text-[#aa9b8e]">
                          Display order #
                          {category.displayOrder ??
                            0}
                        </p>
                      </div>

                      <StatusBadge
                        active={
                          category.isActive
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      toggleCategoryStatus(
                        category
                      )
                    }
                    className="rounded-xl border border-[#e5dbd1] px-3 py-2.5 text-xs font-semibold text-[#756b64]"
                  >
                    {category.isActive
                      ? 'Disable'
                      : 'Enable'}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openEditModal(
                        category
                      )
                    }
                    className="rounded-xl bg-[#f8f3ed] px-3 py-2.5 text-xs font-semibold text-[#7b2638]"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDeleteTarget(
                        category
                      )
                    }
                    className="rounded-xl border border-red-100 px-3 py-2.5 text-xs font-semibold text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          )}

          {filteredCategories.length ===
            0 && (
            <EmptyState
              search={search}
              onAdd={openCreateModal}
            />
          )}
        </div>
      </div>

      {/* ====================================================== */}
      {/* CREATE / EDIT MODAL */}
      {/* ====================================================== */}

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] bg-[#fffdf9] shadow-2xl sm:max-w-lg sm:rounded-[28px]">
            <div className="sticky top-0 z-10 border-b border-[#eadfd4] bg-[#fffdf9] px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9a7a52]">
                    {editingCategory
                      ? 'Edit category'
                      : 'New category'}
                  </p>

                  <h2 className="mt-1 font-serif text-2xl font-semibold text-[#2b211d]">
                    {editingCategory
                      ? 'Update Category'
                      : 'Add Category'}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f8f3ed] text-[#756b64] hover:bg-[#efe6dc]"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-5 sm:p-6"
            >
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#756b64]">
                  Category Name
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    updateForm(
                      'name',
                      event.target.value
                    )
                  }
                  placeholder="e.g. Main Course"
                  maxLength={80}
                  required
                  className="w-full rounded-xl border border-[#e5dbd1] bg-white px-4 py-3 text-sm outline-none focus:border-[#7b2638] focus:ring-2 focus:ring-[#7b2638]/10"
                />
              </div>

              {/* Image URL */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#756b64]">
                  Image URL
                  <span className="ml-2 font-normal normal-case tracking-normal text-[#aa9b8e]">
                    Optional
                  </span>
                </label>

                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(event) =>
                    updateForm(
                      'imageUrl',
                      event.target.value
                    )
                  }
                  placeholder="https://example.com/category.jpg"
                  className="w-full rounded-xl border border-[#e5dbd1] bg-white px-4 py-3 text-sm outline-none focus:border-[#7b2638] focus:ring-2 focus:ring-[#7b2638]/10"
                />

                {form.imageUrl && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-[#eadfd4] bg-[#f8f3ed]">
                    <img
                      src={form.imageUrl}
                      alt="Category preview"
                      className="h-36 w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display =
                          'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Display Order */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[#756b64]">
                  Display Order
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.displayOrder}
                  onChange={(event) =>
                    updateForm(
                      'displayOrder',
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-[#e5dbd1] bg-white px-4 py-3 text-sm outline-none focus:border-[#7b2638] focus:ring-2 focus:ring-[#7b2638]/10"
                />

                <p className="mt-1.5 text-[11px] text-[#aa9b8e]">
                  Lower numbers appear first.
                </p>
              </div>

              {/* Active */}
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#e5dbd1] bg-white p-4">
                <div>
                  <p className="text-sm font-semibold text-[#332a26]">
                    Active category
                  </p>

                  <p className="mt-0.5 text-xs text-[#aa9b8e]">
                    Active categories are
                    available for menu use.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    updateForm(
                      'isActive',
                      event.target.checked
                    )
                  }
                  className="h-5 w-5 accent-[#7b2638]"
                />
              </label>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-[#e1d5ca] bg-white px-4 py-3 text-sm font-semibold text-[#756b64] transition hover:bg-[#f8f3ed] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-[#7b2638] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#682031] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? 'Saving...'
                    : editingCategory
                      ? 'Update Category'
                      : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================== */}
      {/* DELETE CONFIRMATION */}
      {/* ====================================================== */}

      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-5">
          <div className="w-full max-w-md rounded-[24px] bg-[#fffdf9] p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl text-red-600">
              !
            </div>

            <h2 className="mt-5 font-serif text-2xl font-semibold text-[#2b211d]">
              Delete Category?
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#756b64]">
              Are you sure you want to delete{' '}
              <strong className="text-[#332a26]">
                {deleteTarget.name}
              </strong>
              ? This action cannot be undone.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setDeleteTarget(null)
                }
                disabled={saving}
                className="flex-1 rounded-xl border border-[#e1d5ca] bg-white px-4 py-3 text-sm font-semibold text-[#756b64]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {saving
                  ? 'Deleting...'
                  : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-[#eadfd4] bg-white p-5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#aa9b8e]">
        {label}
      </p>

      <p className="mt-2 font-serif text-3xl font-semibold text-[#2b211d]">
        {value}
      </p>
    </div>
  );
}

// ============================================================
// CATEGORY IMAGE
// ============================================================

function CategoryImage({
  category,
}) {
  if (category.imageUrl) {
    return (
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#f8f3ed]">
        <img
          src={category.imageUrl}
          alt={category.name}
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display =
              'none';
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f8f3ed] font-serif text-lg font-semibold text-[#7b2638]">
      {category.name
        ?.charAt(0)
        ?.toUpperCase() || 'C'}
    </div>
  );
}

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
  active,
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-bold',
        active
          ? 'bg-green-50 text-green-700'
          : 'bg-stone-100 text-stone-500',
      ].join(' ')}
    >
      <span
        className={[
          'h-1.5 w-1.5 rounded-full',
          active
            ? 'bg-green-500'
            : 'bg-stone-400',
        ].join(' ')}
      />

      {active
        ? 'Active'
        : 'Inactive'}
    </span>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({
  search,
  onAdd,
}) {
  return (
    <div className="rounded-2xl border border-[#eadfd4] bg-white px-6 py-16 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f8f3ed] font-serif text-xl text-[#7b2638]">
        C
      </div>

      <h3 className="mt-4 font-serif text-xl font-semibold text-[#332a26]">
        No categories found
      </h3>

      <p className="mt-1 text-sm text-[#857a72]">
        {search
          ? 'Try a different search term.'
          : 'Create your first menu category.'}
      </p>

      {!search && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-5 rounded-xl bg-[#7b2638] px-5 py-2.5 text-xs font-semibold text-white"
        >
          Add Category
        </button>
      )}
    </div>
  );
}

export default CategoriesPage;