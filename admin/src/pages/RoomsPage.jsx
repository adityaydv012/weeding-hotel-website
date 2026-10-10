
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '../context/AuthContext.jsx';

import {
  createRoom,
  getRooms,
  getRoomQR,
  getRoomOrders,
} from '../api/client.js';

const SUPER_ADMIN_DEMO_HOTEL_ID =
  '6ac5c6be34fd0e1d0236f8b9';

const ORDER_STATUSES = [
  'NEW',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'DELIVERED',
  'CANCELLED',
];

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    'Something went wrong. Please try again.'
  );
}

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toFixed(2)}`;
}

function formatDate(date) {
  if (!date) return '—';

  return new Date(date).toLocaleString();
}

function StatCard({ label, value, detail, tone }) {
  const toneClass =
    tone === 'green'
      ? 'bg-emerald-50 text-emerald-700'
      : tone === 'gray'
        ? 'bg-stone-100 text-stone-600'
        : 'bg-[#7b2638]/[0.07] text-[#7b2638]';

  return (
    <div className="rounded-2xl border border-[#eadfd4] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-stone-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-[#2b211d]">
            {value}
          </p>
          <p className="mt-1 text-xs text-stone-400">{detail}</p>
        </div>

        <span
          className={`rounded-xl px-3 py-2 text-xs font-bold ${toneClass}`}
        >
          R&A
        </span>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    NEW: 'bg-blue-50 text-blue-700',
    ACCEPTED: 'bg-indigo-50 text-indigo-700',
    PREPARING: 'bg-amber-50 text-amber-800',
    READY: 'bg-emerald-50 text-emerald-700',
    DELIVERED: 'bg-stone-100 text-stone-700',
    CANCELLED: 'bg-red-50 text-red-700',
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || 'bg-stone-100 text-stone-600'
      }`}
    >
      {status || 'UNKNOWN'}
    </span>
  );
}

export default function RoomsPage() {
  const { user } = useAuth();

  const hotelId =
    user?.role === 'SUPER_ADMIN'
      ? SUPER_ADMIN_DEMO_HOTEL_ID
      : user?.hotelId;

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qrLoadingRoomId, setQrLoadingRoomId] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [showCreate, setShowCreate] = useState(false);
  const [roomNumber, setRoomNumber] = useState('');
  const [floor, setFloor] = useState('');

  const [createdQr, setCreatedQr] = useState(null);

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomOrders, setRoomOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');

  // ----------------------------------------------------------
  // LOAD ROOMS
  // ----------------------------------------------------------

  const loadRooms = useCallback(async () => {
    if (!hotelId) {
      setError('No hotel is assigned to this account.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await getRooms({ hotelId });

      setRooms(
        response.rooms ||
          response.data?.rooms ||
          []
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // ----------------------------------------------------------
  // ROOM SEARCH AND FILTERS
  // ----------------------------------------------------------

  const filteredRooms = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rooms.filter((room) => {
      const matchesSearch =
        !query ||
        String(room.roomNumber || '')
          .toLowerCase()
          .includes(query) ||
        String(room.floor || '')
          .toLowerCase()
          .includes(query);

      const isActive = room.isActive !== false;

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && isActive) ||
        (statusFilter === 'INACTIVE' && !isActive);

      return matchesSearch && matchesStatus;
    });
  }, [rooms, search, statusFilter]);

  const activeCount = rooms.filter(
    (room) => room.isActive !== false
  ).length;

  const inactiveCount = rooms.length - activeCount;

  // ----------------------------------------------------------
  // CREATE ROOM
  // ----------------------------------------------------------

  async function handleCreateRoom(event) {
    event.preventDefault();

    setError('');
    setSuccess('');
    setCreatedQr(null);

    const cleanedRoomNumber = roomNumber.trim();

    if (!cleanedRoomNumber) {
      setError('Enter a room number.');
      return;
    }

    if (!hotelId) {
      setError('No hotel is assigned to this account.');
      return;
    }

    setSaving(true);

    try {
      const response = await createRoom({
        hotelId,
        roomNumber: cleanedRoomNumber,
        floor: floor.trim(),
      });

      const room =
        response.room || response.data?.room;

      const qr =
        response.qr || response.data?.qr;

      if (room) {
        setRooms((current) =>
          [
            ...current.filter(
              (item) => item._id !== room._id
            ),
            room,
          ].sort((a, b) =>
            String(a.roomNumber).localeCompare(
              String(b.roomNumber),
              undefined,
              { numeric: true }
            )
          )
        );
      } else {
        await loadRooms();
      }

      if (qr?.dataUrl) {
        setCreatedQr({
          roomId: room?._id,
          roomNumber:
            room?.roomNumber || cleanedRoomNumber,
          url: qr.url,
          dataUrl: qr.dataUrl,
        });
      }

      setSuccess(
        `Room ${cleanedRoomNumber} created successfully.`
      );

      setRoomNumber('');
      setFloor('');
      setShowCreate(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // ----------------------------------------------------------
  // VIEW OR REGENERATE ROOM QR
  // ----------------------------------------------------------

  async function handleViewQR(room) {
    setError('');
    setSuccess('');
    setQrLoadingRoomId(room._id);

    try {
      const response = await getRoomQR(room._id);

      const qr =
        response.qr || response.data?.qr;

      if (!qr?.dataUrl) {
        throw new Error(
          'QR code was not returned by the server.'
        );
      }

      setCreatedQr({
        roomId: room._id,
        roomNumber: room.roomNumber,
        url: qr.url,
        dataUrl: qr.dataUrl,
      });

      setSuccess(
        `QR code generated for Room ${room.roomNumber}.`
      );

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setQrLoadingRoomId(null);
    }
  }

  function downloadQr() {
    if (!createdQr?.dataUrl) return;

    const link = document.createElement('a');

    link.href = createdQr.dataUrl;
    link.download =
      `room-${createdQr.roomNumber}-qr.png`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  // ----------------------------------------------------------
  // VIEW ORDERS FOR A ROOM
  // ----------------------------------------------------------

  async function handleViewRoomOrders(room) {
    setSelectedRoom(room);
    setRoomOrders([]);
    setOrderStatusFilter('ALL');
    setOrdersLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await getRoomOrders(room._id, {
        limit: 200,
      });

      setRoomOrders(
        response.orders ||
          response.data?.orders ||
          []
      );

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setOrdersLoading(false);
    }
  }

  const filteredRoomOrders = useMemo(() => {
    if (orderStatusFilter === 'ALL') {
      return roomOrders;
    }

    return roomOrders.filter(
      (order) => order.orderStatus === orderStatusFilter
    );
  }, [roomOrders, orderStatusFilter]);

  function closeRoomOrders() {
    setSelectedRoom(null);
    setRoomOrders([]);
    setOrderStatusFilter('ALL');
  }

  function closeQr() {
    setCreatedQr(null);
  }

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9a7a52]">
            Hotel operations
          </p>

          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#2b211d] sm:text-4xl">
            Rooms
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
            Manage rooms, guest dining QR codes, and room-wise orders.
          </p>
        </div>

        {user?.role !== 'STAFF' && (
          <button
            type="button"
            onClick={() => {
              setShowCreate((value) => !value);
              setError('');
              setSuccess('');
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7b2638] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#65202f]"
          >
            <span className="text-lg">+</span>
            Add room
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Dismiss error"
            className="font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess('')}
            aria-label="Dismiss success"
            className="font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total rooms"
          value={rooms.length}
          detail="Rooms registered in this hotel"
        />

        <StatCard
          label="Active rooms"
          value={activeCount}
          detail="Rooms marked active"
          tone="green"
        />

        <StatCard
          label="Inactive rooms"
          value={inactiveCount}
          detail="Rooms marked inactive"
          tone="gray"
        />
      </div>

      {/* QR code preview */}
      {createdQr && (
        <section className="rounded-2xl border border-emerald-200 bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-44 w-44 shrink-0 items-center justify-center rounded-xl border border-stone-100 bg-white p-3">
              <img
                src={createdQr.dataUrl}
                alt={`QR code for Room ${createdQr.roomNumber}`}
                className="h-full w-full object-contain"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                QR code ready
              </p>

              <h2 className="mt-2 font-serif text-2xl font-semibold text-[#2b211d]">
                Room {createdQr.roomNumber}
              </h2>

              <p className="mt-2 text-sm leading-6 text-stone-500">
                Download and print this QR code for the room.
              </p>

              <div className="mt-3 break-all text-xs leading-5 text-stone-400">
                {createdQr.url}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={downloadQr}
                  className="rounded-xl bg-[#7b2638] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#65202f]"
                >
                  Download QR (PNG)
                </button>

                <button
                  type="button"
                  onClick={closeQr}
                  className="rounded-xl border border-[#e5d8cc] px-4 py-3 text-sm font-semibold text-stone-600 hover:bg-stone-50"
                >
                  Close
                </button>
              </div>

              <p className="mt-3 text-xs leading-5 text-amber-700">
                Regenerating a QR invalidates the previously printed
                QR for that room.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Create room form */}
      {showCreate && (
        <section className="rounded-2xl border border-[#eadfd4] bg-white p-5 sm:p-6">
          <h2 className="font-serif text-xl font-semibold text-[#2b211d]">
            Add a room
          </h2>

          <p className="mt-1 text-sm text-stone-500">
            Create a room and generate its guest dining QR code.
          </p>

          <form
            onSubmit={handleCreateRoom}
            className="mt-5"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="roomNumber"
                  className="mb-2 block text-sm font-medium text-stone-700"
                >
                  Room number *
                </label>

                <input
                  id="roomNumber"
                  type="text"
                  value={roomNumber}
                  onChange={(event) =>
                    setRoomNumber(event.target.value)
                  }
                  placeholder="e.g. 101"
                  required
                  className="w-full rounded-xl border border-[#e5d8cc] px-4 py-3 text-sm outline-none focus:border-[#9a7a52]"
                />
              </div>

              <div>
                <label
                  htmlFor="floor"
                  className="mb-2 block text-sm font-medium text-stone-700"
                >
                  Floor
                </label>

                <input
                  id="floor"
                  type="text"
                  value={floor}
                  onChange={(event) =>
                    setFloor(event.target.value)
                  }
                  placeholder="e.g. 1"
                  className="w-full rounded-xl border border-[#e5d8cc] px-4 py-3 text-sm outline-none focus:border-[#9a7a52]"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                disabled={saving}
                className="rounded-xl border border-[#e5d8cc] px-5 py-3 text-sm font-semibold text-stone-600 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#7b2638] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#65202f] disabled:opacity-50"
              >
                {saving ? 'Creating room...' : 'Create room & QR'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Selected room orders */}
      {selectedRoom && (
        <section className="overflow-hidden rounded-2xl border border-[#eadfd4] bg-white">
          <div className="flex flex-col gap-4 border-b border-[#f0e7df] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a7a52]">
                Room order history
              </p>

              <h2 className="mt-2 font-serif text-2xl font-semibold text-[#2b211d]">
                Room {selectedRoom.roomNumber} — Orders
              </h2>

              <p className="mt-1 text-sm text-stone-500">
                {roomOrders.length} orders loaded
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={orderStatusFilter}
                onChange={(event) =>
                  setOrderStatusFilter(event.target.value)
                }
                className="rounded-xl border border-[#e5d8cc] bg-white px-3 py-2 text-sm"
                aria-label="Filter orders by status"
              >
                <option value="ALL">All statuses</option>

                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => handleViewRoomOrders(selectedRoom)}
                disabled={ordersLoading}
                className="rounded-xl border border-[#e5d8cc] px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-50"
              >
                {ordersLoading ? 'Loading...' : 'Refresh'}
              </button>

              <button
                type="button"
                onClick={closeRoomOrders}
                className="rounded-xl bg-[#7b2638] px-4 py-2 text-sm font-semibold text-white hover:bg-[#65202f]"
              >
                Close
              </button>
            </div>
          </div>

          {ordersLoading ? (
            <div className="p-10 text-center text-sm text-stone-500">
              Loading room orders...
            </div>
          ) : filteredRoomOrders.length === 0 ? (
            <div className="p-10 text-center">
              <h3 className="font-semibold text-[#2b211d]">
                No orders found
              </h3>

              <p className="mt-2 text-sm text-stone-500">
                This room has no orders matching the selected filter.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#f0e7df]">
              {filteredRoomOrders.map((order) => (
                <article
                  key={order._id}
                  className="p-5 transition hover:bg-[#fffdf9]"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-[#2b211d]">
                        Order #{order.orderNumber}
                      </h3>

                      <p className="mt-1 text-sm text-stone-500">
                        {order.guestName}
                      </p>

                      <p className="mt-1 text-sm text-stone-500">
                        {order.phone}
                      </p>

                      <p className="mt-1 text-xs text-stone-400">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-lg font-semibold text-[#2b211d]">
                        {formatCurrency(order.total)}
                      </p>

                      <div className="mt-2">
                        <StatusBadge status={order.orderStatus} />
                      </div>

                      <p className="mt-2 text-xs text-stone-500">
                        Payment: {order.paymentStatus}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl bg-[#fcfaf7] p-3">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-stone-500">
                      Order items
                    </p>

                    <div className="space-y-3">
                      {(order.items || []).map((item, index) => (
                        <div
                          key={`${order._id}-${index}`}
                          className="flex justify-between gap-3 text-sm"
                        >
                          <div>
                            <p className="font-medium text-stone-700">
                              {item.name}
                            </p>

                            <p className="mt-1 text-xs text-stone-400">
                              Quantity: {item.quantity}
                            </p>
                          </div>

                          <span className="shrink-0 font-medium text-[#2b211d]">
                            {formatCurrency(item.lineTotal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.specialInstructions && (
                    <p className="mt-3 text-sm leading-6 text-stone-500">
                      <span className="font-semibold">
                        Special instructions:
                      </span>{' '}
                      {order.specialInstructions}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-stone-500">
                    <span className="rounded-lg border border-[#eadfd4] px-3 py-2">
                      Subtotal: {formatCurrency(order.subtotal)}
                    </span>

                    <span className="rounded-lg border border-[#eadfd4] px-3 py-2">
                      Tax: {formatCurrency(order.taxAmount)}
                    </span>

                    <span className="rounded-lg border border-[#eadfd4] px-3 py-2">
                      Payment: {order.paymentMethod || 'COD'}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Room list */}
      <section className="overflow-hidden rounded-2xl border border-[#eadfd4] bg-white">
        <div className="flex flex-col gap-4 border-b border-[#f0e7df] p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-serif text-xl font-semibold text-[#2b211d]">
              All rooms
            </h2>

            <p className="mt-1 text-sm text-stone-500">
              {filteredRooms.length} of {rooms.length} rooms
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search room or floor..."
              aria-label="Search rooms"
              className="min-w-0 rounded-xl border border-[#e5d8cc] px-4 py-3 text-sm outline-none focus:border-[#9a7a52] sm:w-64"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              aria-label="Filter rooms by status"
              className="rounded-xl border border-[#e5d8cc] bg-white px-4 py-3 text-sm outline-none focus:border-[#9a7a52]"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <button
              type="button"
              onClick={loadRooms}
              disabled={loading}
              className="rounded-xl border border-[#e5d8cc] px-4 py-3 text-sm font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#eadfd4] border-t-[#7b2638]" />

            <p className="mt-4 text-sm text-stone-500">
              Loading rooms...
            </p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <h3 className="font-semibold text-[#2b211d]">
              No rooms found
            </h3>

            <p className="mt-2 text-sm text-stone-500">
              {rooms.length === 0
                ? 'Create your first room to generate a QR code.'
                : 'Try changing your search or status filter.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[780px] text-left">
                <thead>
                  <tr className="bg-[#fcfaf7] text-xs uppercase tracking-wider text-stone-500">
                    <th className="px-6 py-4 font-semibold">Room</th>
                    <th className="px-6 py-4 font-semibold">Floor</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Created</th>
                    <th className="px-6 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f0e7df]">
                  {filteredRooms.map((room) => (
                    <tr
                      key={room._id}
                      className="transition hover:bg-[#fffdf9]"
                    >
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleViewRoomOrders(room)}
                          className="text-left font-semibold text-[#7b2638] hover:underline"
                        >
                          Room {room.roomNumber}
                        </button>

                        <p className="mt-1 text-xs text-stone-400">
                          Click to view orders
                        </p>
                      </td>

                      <td className="px-6 py-4 text-sm text-stone-600">
                        {room.floor || '—'}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            room.isActive !== false
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {room.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-stone-500">
                        {room.createdAt
                          ? new Date(room.createdAt).toLocaleDateString()
                          : '—'}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewRoomOrders(room)}
                            className="rounded-lg border border-[#eadfd4] px-3 py-2 text-xs font-semibold text-[#7b2638] hover:bg-[#f8f3ed]"
                          >
                            View Orders
                          </button>

                          <button
                            type="button"
                            onClick={() => handleViewQR(room)}
                            disabled={qrLoadingRoomId === room._id}
                            className="rounded-lg bg-[#7b2638] px-3 py-2 text-xs font-semibold text-white hover:bg-[#65202f] disabled:opacity-50"
                          >
                            {qrLoadingRoomId === room._id
                              ? 'Loading...'
                              : 'View QR'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="grid gap-3 p-4 md:hidden">
              {filteredRooms.map((room) => (
                <article
                  key={room._id}
                  className="rounded-xl border border-[#f0e7df] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <button
                        type="button"
                        onClick={() => handleViewRoomOrders(room)}
                        className="font-semibold text-[#7b2638] hover:underline"
                      >
                        Room {room.roomNumber}
                      </button>

                      <p className="mt-1 text-sm text-stone-500">
                        Floor: {room.floor || '—'}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        room.isActive !== false
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {room.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-stone-400">
                    Created:{' '}
                    {room.createdAt
                      ? new Date(room.createdAt).toLocaleDateString()
                      : '—'}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-[#f0e7df] pt-3">
                    <button
                      type="button"
                      onClick={() => handleViewRoomOrders(room)}
                      className="flex-1 rounded-lg border border-[#eadfd4] px-3 py-2 text-xs font-semibold text-[#7b2638] hover:bg-[#f8f3ed]"
                    >
                      View Orders
                    </button>

                    <button
                      type="button"
                      onClick={() => handleViewQR(room)}
                      disabled={qrLoadingRoomId === room._id}
                      className="flex-1 rounded-lg bg-[#7b2638] px-3 py-2 text-xs font-semibold text-white hover:bg-[#65202f] disabled:opacity-50"
                    >
                      {qrLoadingRoomId === room._id
                        ? 'Loading...'
                        : 'View QR'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <p className="text-xs leading-5 text-stone-400">
        Viewing an existing room's QR currently generates a new
        access token. Replace any previously printed QR for that room.
      </p>
    </div>
  );
}
