import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getOrders,
  updateOrderStatus,
} from '../api/client.js';

import { useAuth } from '../context/AuthContext.jsx';

const DEMO_HOTEL_ID = '6ac5c6be34fd0e1d0236f8b9';

const STATUS_FILTERS = [
  {
    value: '',
    label: 'All Orders',
  },
  {
    value: 'NEW',
    label: 'New',
  },
  {
    value: 'ACCEPTED',
    label: 'Accepted',
  },
  {
    value: 'PREPARING',
    label: 'Preparing',
  },
  {
    value: 'READY',
    label: 'Ready',
  },
  {
    value: 'DELIVERED',
    label: 'Delivered',
  },
  {
    value: 'CANCELLED',
    label: 'Cancelled',
  },
];

const NEXT_STATUSES = {
  NEW: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export default function OrdersPage() {
  const { user } = useAuth();

  const [hotelId, setHotelId] = useState(() => {
    const saved =
      localStorage.getItem('adminSelectedHotelId');

    return (
      saved ||
      (user?.role === 'SUPER_ADMIN'
        ? DEMO_HOTEL_ID
        : user?.hotelId || '')
    );
  });

  const [orders, setOrders] = useState([]);

  const [statusFilter, setStatusFilter] =
    useState('');

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState('');

  const [updatingOrderId, setUpdatingOrderId] =
    useState(null);

  const [selectedOrder, setSelectedOrder] =
    useState(null);

  const isSuperAdmin =
    user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (!hotelId) return;

    localStorage.setItem(
      'adminSelectedHotelId',
      hotelId
    );
  }, [hotelId]);

  const loadOrders = useCallback(
    async ({ silent = false } = {}) => {
      if (!hotelId) {
        setOrders([]);
        setLoading(false);
        return;
      }

      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError('');

        const response = await getOrders({
          hotelId,
          status: statusFilter,
          limit: 100,
        });

        if (!response.success) {
          throw new Error(
            response.message ||
              'Unable to load orders.'
          );
        }

        setOrders(
          Array.isArray(response.orders)
            ? response.orders
            : []
        );
      } catch (requestError) {
        console.error(
          'Orders loading error:',
          requestError
        );

        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            'Unable to load orders.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [hotelId, statusFilter]
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function handleStatusChange(
    order,
    nextStatus
  ) {
    if (!order?._id || !nextStatus) return;

    try {
      setUpdatingOrderId(order._id);
      setError('');

      const response =
        await updateOrderStatus(
          order._id,
          nextStatus
        );

      if (!response.success) {
        throw new Error(
          response.message ||
            'Unable to update order status.'
        );
      }

      const updatedOrder =
        response.order;

      setOrders((currentOrders) =>
        currentOrders.map((item) =>
          String(item._id) ===
          String(order._id)
            ? updatedOrder
            : item
        )
      );

      setSelectedOrder((current) =>
        current &&
        String(current._id) ===
          String(order._id)
          ? updatedOrder
          : current
      );
    } catch (requestError) {
      console.error(
        'Order status update error:',
        requestError
      );

      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          'Unable to update order status.'
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  const statistics = useMemo(() => {
    const total = orders.length;

    const newOrders = orders.filter(
      (order) =>
        order.orderStatus === 'NEW'
    ).length;

    const preparing = orders.filter(
      (order) =>
        order.orderStatus ===
        'PREPARING'
    ).length;

    const ready = orders.filter(
      (order) =>
        order.orderStatus === 'READY'
    ).length;

    const revenue = orders.reduce(
      (sum, order) =>
        sum + Number(order.total || 0),
      0
    );

    return {
      total,
      newOrders,
      preparing,
      ready,
      revenue,
    };
  }, [orders]);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

      {/* Header */}
      <div className="mb-7">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a52]">
              Operations
            </p>

            <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#241d1a] sm:text-4xl">
              Orders
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#857a72]">
              Monitor guest food orders and move them
              through the kitchen workflow.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadOrders({ silent: true })
            }
            disabled={refreshing || loading}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#ded3c9] bg-white px-4 py-2.5 text-sm font-semibold text-[#554b45] shadow-sm transition hover:bg-[#faf6f1] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshIcon
              spinning={refreshing}
            />

            {refreshing
              ? 'Refreshing...'
              : 'Refresh'}
          </button>

        </div>
      </div>

      {/* Super Admin Hotel */}
      {isSuperAdmin && (
        <div className="mb-6 rounded-2xl border border-[#e7ddd3] bg-white p-4 shadow-sm sm:p-5">

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <p className="text-sm font-semibold text-[#332a26]">
                Hotel
              </p>

              <p className="mt-1 text-xs text-[#92867d]">
                SUPER_ADMIN must select a hotel before
                loading its orders.
              </p>
            </div>

            <div className="flex w-full gap-2 lg:w-auto">
              <input
                type="text"
                value={hotelId}
                onChange={(event) =>
                  setHotelId(event.target.value)
                }
                placeholder="Enter hotel ID"
                className="min-w-0 flex-1 rounded-xl border border-[#ddd2c8] bg-[#fcfaf7] px-4 py-2.5 text-sm text-[#332a26] outline-none transition focus:border-[#7b2638] focus:ring-4 focus:ring-[#7b2638]/10 lg:w-[380px]"
              />

              <button
                type="button"
                onClick={() =>
                  loadOrders()
                }
                className="rounded-xl bg-[#7b2638] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#682030]"
              >
                Load
              </button>
            </div>

          </div>

          <p className="mt-3 break-all text-[11px] text-[#a1948a]">
            Current hotel ID: {hotelId || 'Not selected'}
          </p>

        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">

          <div>
            <p className="font-semibold">
              Unable to complete request
            </p>

            <p className="mt-1">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setError('')}
            className="shrink-0 rounded-lg p-1 text-red-500 hover:bg-red-100"
          >
            <CloseIcon />
          </button>

        </div>
      )}

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

        <StatCard
          label="Total"
          value={statistics.total}
        />

        <StatCard
          label="New"
          value={statistics.newOrders}
        />

        <StatCard
          label="Preparing"
          value={statistics.preparing}
        />

        <StatCard
          label="Ready"
          value={statistics.ready}
        />

        <StatCard
          label="Order Value"
          value={formatCurrency(
            statistics.revenue
          )}
        />

      </div>

      {/* Orders */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-[#e7ddd3] bg-white shadow-sm">

        {/* Toolbar */}
        <div className="border-b border-[#eee5dc] px-4 py-4 sm:px-5">

          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

            <div>
              <h2 className="text-base font-semibold text-[#2b211d]">
                Order Queue
              </h2>

              <p className="mt-1 text-xs text-[#92867d]">
                {orders.length} order
                {orders.length === 1
                  ? ''
                  : 's'} loaded
              </p>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {STATUS_FILTERS.map(
                (filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() =>
                      setStatusFilter(
                        filter.value
                      )
                    }
                    className={[
                      'shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition',
                      statusFilter ===
                      filter.value
                        ? 'bg-[#7b2638] text-white'
                        : 'bg-[#f7f2ec] text-[#756a62] hover:bg-[#eee5dc]',
                    ].join(' ')}
                  >
                    {filter.label}
                  </button>
                )
              )}
            </div>

          </div>

        </div>

        {/* Loading */}
        {loading && (
          <OrdersLoading />
        )}

        {/* Empty */}
        {!loading && orders.length === 0 && (
          <EmptyOrders />
        )}

        {/* Desktop */}
        {!loading && orders.length > 0 && (
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-[#eee5dc] bg-[#fcfaf7] text-left">
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9b8d82]">
                    Order
                  </th>

                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9b8d82]">
                    Guest
                  </th>

                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9b8d82]">
                    Room
                  </th>

                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9b8d82]">
                    Items
                  </th>

                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9b8d82]">
                    Total
                  </th>

                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9b8d82]">
                    Payment
                  </th>

                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9b8d82]">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-[#9b8d82]">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <OrderTableRow
                    key={order._id}
                    order={order}
                    updating={
                      updatingOrderId ===
                      order._id
                    }
                    onStatusChange={
                      handleStatusChange
                    }
                    onView={() =>
                      setSelectedOrder(
                        order
                      )
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile */}
        {!loading && orders.length > 0 && (
          <div className="divide-y divide-[#eee5dc] lg:hidden">
            {orders.map((order) => (
              <OrderMobileCard
                key={order._id}
                order={order}
                updating={
                  updatingOrderId ===
                  order._id
                }
                onStatusChange={
                  handleStatusChange
                }
                onView={() =>
                  setSelectedOrder(order)
                }
              />
            ))}
          </div>
        )}

      </section>

      {/* Details modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          updating={
            updatingOrderId ===
            selectedOrder._id
          }
          onClose={() =>
            setSelectedOrder(null)
          }
          onStatusChange={
            handleStatusChange
          }
        />
      )}

    </div>
  );
}

function OrderTableRow({
  order,
  updating,
  onStatusChange,
  onView,
}) {
  const nextStatuses =
    NEXT_STATUSES[
      order.orderStatus
    ] || [];

  return (
    <tr className="border-b border-[#f0e8e1] last:border-b-0 hover:bg-[#fdfbf8]">

      <td className="px-5 py-4">
        <button
          type="button"
          onClick={onView}
          className="text-left"
        >
          <p className="text-sm font-semibold text-[#332a26] hover:text-[#7b2638]">
            #{order.orderNumber || shortId(order._id)}
          </p>

          <p className="mt-1 text-[11px] text-[#978b82]">
            {formatDateTime(
              order.createdAt
            )}
          </p>
        </button>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-medium text-[#403630]">
          {order.guestName || 'Guest'}
        </p>

        {order.phone && (
          <p className="mt-1 text-xs text-[#92867d]">
            {order.phone}
          </p>
        )}
      </td>

      <td className="px-5 py-4">
        <span className="rounded-lg bg-[#f8f2eb] px-2.5 py-1.5 text-xs font-semibold text-[#76583e]">
          Room {order.roomNumber || '—'}
        </span>
      </td>

      <td className="max-w-[220px] px-5 py-4">
        <p className="truncate text-sm text-[#554b45]">
          {getItemsSummary(order)}
        </p>

        <p className="mt-1 text-[11px] text-[#9a8f86]">
          {getItemCount(order)} item
          {getItemCount(order) === 1
            ? ''
            : 's'}
        </p>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-semibold text-[#332a26]">
          {formatCurrency(
            order.total
          )}
        </p>
      </td>

      <td className="px-5 py-4">
        <PaymentBadge
          status={
            order.paymentStatus
          }
        />
      </td>

      <td className="px-5 py-4">
        <StatusBadge
          status={
            order.orderStatus
          }
        />
      </td>

      <td className="px-5 py-4">
        <div className="flex justify-end gap-2">

          <button
            type="button"
            onClick={onView}
            className="rounded-lg border border-[#e1d6cc] px-3 py-2 text-xs font-semibold text-[#665b54] hover:bg-[#faf6f1]"
          >
            View
          </button>

          {nextStatuses.length > 0 && (
            <StatusAction
              order={order}
              updating={updating}
              onStatusChange={
                onStatusChange
              }
            />
          )}

        </div>
      </td>

    </tr>
  );
}

function OrderMobileCard({
  order,
  updating,
  onStatusChange,
  onView,
}) {
  return (
    <article className="p-4">

      <div className="flex items-start justify-between gap-4">

        <div>
          <button
            type="button"
            onClick={onView}
            className="text-left"
          >
            <p className="text-sm font-bold text-[#332a26]">
              #{order.orderNumber ||
                shortId(order._id)}
            </p>

            <p className="mt-1 text-[11px] text-[#978b82]">
              {formatDateTime(
                order.createdAt
              )}
            </p>
          </button>
        </div>

        <StatusBadge
          status={
            order.orderStatus
          }
        />

      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">

        <InfoBox
          label="Guest"
          value={
            order.guestName ||
            'Guest'
          }
        />

        <InfoBox
          label="Room"
          value={
            order.roomNumber
              ? `Room ${order.roomNumber}`
              : '—'
          }
        />

        <InfoBox
          label="Items"
          value={`${getItemCount(order)} item${
            getItemCount(order) === 1
              ? ''
              : 's'
          }`}
        />

        <InfoBox
          label="Total"
          value={formatCurrency(
            order.total
          )}
        />

      </div>

      <div className="mt-4 rounded-xl bg-[#fcfaf7] p-3">

        <p className="text-xs font-semibold text-[#554b45]">
          {getItemsSummary(order)}
        </p>

        <div className="mt-2">
          <PaymentBadge
            status={
              order.paymentStatus
            }
          />
        </div>

      </div>

      <div className="mt-4 flex gap-2">

        <button
          type="button"
          onClick={onView}
          className="flex-1 rounded-xl border border-[#ddd2c8] bg-white px-3 py-2.5 text-xs font-semibold text-[#5f554f]"
        >
          View Details
        </button>

        {NEXT_STATUSES[
          order.orderStatus
        ]?.length > 0 && (
          <div className="flex-1">
            <StatusAction
              order={order}
              updating={updating}
              onStatusChange={
                onStatusChange
              }
              fullWidth
            />
          </div>
        )}

      </div>

    </article>
  );
}

function StatusAction({
  order,
  updating,
  onStatusChange,
  fullWidth = false,
}) {
  const nextStatuses =
    NEXT_STATUSES[
      order.orderStatus
    ] || [];

  const nextStatus =
    nextStatuses[0];

  if (!nextStatus) {
    return null;
  }

  return (
    <button
      type="button"
      disabled={updating}
      onClick={() =>
        onStatusChange(
          order,
          nextStatus
        )
      }
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg bg-[#7b2638] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#682030] disabled:cursor-not-allowed disabled:opacity-50',
        fullWidth
          ? 'w-full rounded-xl py-2.5'
          : '',
      ].join(' ')}
    >
      {updating && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      )}

      {updating
        ? 'Updating...'
        : getNextStatusLabel(
            nextStatus
          )}
    </button>
  );
}

function OrderDetailsModal({
  order,
  updating,
  onClose,
  onStatusChange,
}) {
  const nextStatuses =
    NEXT_STATUSES[
      order.orderStatus
    ] || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-5">

      <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">

        {/* Modal header */}
        <div className="flex items-start justify-between border-b border-[#eee5dc] px-5 py-5 sm:px-6">

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a7a52]">
              Order Details
            </p>

            <h2 className="mt-1 text-xl font-semibold text-[#2b211d]">
              #{order.orderNumber ||
                shortId(order._id)}
            </h2>

            <p className="mt-1 text-xs text-[#92867d]">
              {formatDateTime(
                order.createdAt
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7f2ec] text-[#655a53] hover:bg-[#eee5dc]"
          >
            <CloseIcon />
          </button>

        </div>

        {/* Modal content */}
        <div className="max-h-[calc(92vh-90px)] overflow-y-auto px-5 py-5 sm:px-6">

          {/* Status */}
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              status={
                order.orderStatus
              }
            />

            <PaymentBadge
              status={
                order.paymentStatus
              }
            />
          </div>

          {/* Guest */}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">

            <InfoBox
              label="Guest"
              value={
                order.guestName ||
                'Guest'
              }
            />

            <InfoBox
              label="Phone"
              value={
                order.phone ||
                '—'
              }
            />

            <InfoBox
              label="Room"
              value={
                order.roomNumber
                  ? `Room ${order.roomNumber}`
                  : '—'
              }
            />

          </div>

          {/* Items */}
          <div className="mt-5 rounded-2xl border border-[#eee5dc]">

            <div className="border-b border-[#eee5dc] bg-[#fcfaf7] px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#897b70]">
                Ordered Items
              </p>
            </div>

            <div className="divide-y divide-[#f0e8e1]">

              {Array.isArray(
                order.items
              ) &&
                order.items.map(
                  (item, index) => (
                    <div
                      key={
                        item._id ||
                        `${item.foodItemId}-${index}`
                      }
                      className="flex items-start justify-between gap-4 px-4 py-4"
                    >
                      <div className="min-w-0">

                        <p className="text-sm font-semibold text-[#403630]">
                          {item.name ||
                            'Food Item'}
                        </p>

                        <p className="mt-1 text-xs text-[#92867d]">
                          Qty:{' '}
                          {item.quantity ||
                            0}{' '}
                          ×{' '}
                          {formatCurrency(
                            item.unitPrice
                          )}
                        </p>

                        {Array.isArray(
                          item.customizations
                        ) &&
                          item
                            .customizations
                            .length >
                            0 && (
                            <p className="mt-1 text-[11px] text-[#9c9087]">
                              {item.customizations
                                .map(
                                  (
                                    customization
                                  ) =>
                                    customization.optionName
                                )
                                .join(
                                  ', '
                                )}
                            </p>
                          )}

                      </div>

                      <p className="shrink-0 text-sm font-semibold text-[#332a26]">
                        {formatCurrency(
                          item.lineTotal
                        )}
                      </p>
                    </div>
                  )
                )}

            </div>
          </div>

          {/* Instructions */}
          {order.specialInstructions && (
            <div className="mt-4 rounded-2xl bg-[#fffaf3] p-4">

              <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#9a7a52]">
                Special Instructions
              </p>

              <p className="mt-2 text-sm leading-6 text-[#554b45]">
                {order.specialInstructions}
              </p>

            </div>
          )}

          {/* Totals */}
          <div className="mt-5 rounded-2xl border border-[#eee5dc] p-4">

            <SummaryRow
              label="Subtotal"
              value={formatCurrency(
                order.subtotal
              )}
            />

            <SummaryRow
              label="Tax"
              value={formatCurrency(
                order.taxAmount
              )}
            />

            <div className="my-3 border-t border-[#eee5dc]" />

            <SummaryRow
              label="Total"
              value={formatCurrency(
                order.total
              )}
              strong
            />

          </div>

          {/* Status actions */}
          {nextStatuses.length > 0 && (
            <div className="mt-5">

              <p className="mb-3 text-xs font-semibold text-[#665b54]">
                Update order status
              </p>

              <div className="flex flex-wrap gap-2">

                {nextStatuses.map(
                  (status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={updating}
                      onClick={() =>
                        onStatusChange(
                          order,
                          status
                        )
                      }
                      className={[
                        'rounded-xl px-4 py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
                        status ===
                        'CANCELLED'
                          ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                          : 'bg-[#7b2638] text-white hover:bg-[#682030]',
                      ].join(' ')}
                    >
                      {updating
                        ? 'Updating...'
                        : getNextStatusLabel(
                            status
                          )}
                    </button>
                  )
                )}

              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    NEW: 'bg-blue-50 text-blue-700 border-blue-100',
    ACCEPTED:
      'bg-indigo-50 text-indigo-700 border-indigo-100',
    PREPARING:
      'bg-amber-50 text-amber-700 border-amber-100',
    READY:
      'bg-emerald-50 text-emerald-700 border-emerald-100',
    DELIVERED:
      'bg-stone-100 text-stone-700 border-stone-200',
    CANCELLED:
      'bg-red-50 text-red-700 border-red-100',
  };

  return (
    <span
      className={[
        'inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
        styles[status] ||
          'bg-stone-100 text-stone-600 border-stone-200',
      ].join(' ')}
    >
      {formatStatus(status)}
    </span>
  );
}

function PaymentBadge({ status }) {
  const paid =
    status === 'PAID';

  return (
    <span
      className={[
        'inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
        paid
          ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
          : 'border-amber-100 bg-amber-50 text-amber-700',
      ].join(' ')}
    >
      {status || 'PENDING'}
    </span>
  );
}

function StatCard({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-[#e7ddd3] bg-white p-5 shadow-sm">

      <p className="text-xs font-medium text-[#81766e]">
        {label}
      </p>

      <p className="mt-3 text-2xl font-semibold text-[#2b211d]">
        {value}
      </p>

    </div>
  );
}

function InfoBox({
  label,
  value,
}) {
  return (
    <div className="rounded-xl bg-[#fcfaf7] p-3">

      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9c9087]">
        {label}
      </p>

      <p className="mt-1.5 break-all text-sm font-semibold text-[#403630]">
        {value}
      </p>

    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}) {
  return (
    <div
      className={[
        'flex items-center justify-between gap-4',
        strong
          ? 'text-base'
          : 'text-sm',
      ].join(' ')}
    >
      <span
        className={
          strong
            ? 'font-semibold text-[#332a26]'
            : 'text-[#857a72]'
        }
      >
        {label}
      </span>

      <span
        className={
          strong
            ? 'font-bold text-[#241d1a]'
            : 'font-medium text-[#554b45]'
        }
      >
        {value}
      </span>
    </div>
  );
}

function OrdersLoading() {
  return (
    <div className="flex min-h-[360px] items-center justify-center">
      <div className="text-center">

        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#7b2638]/15 border-t-[#7b2638]" />

        <p className="mt-4 text-sm text-[#81766e]">
          Loading orders...
        </p>

      </div>
    </div>
  );
}

function EmptyOrders() {
  return (
    <div className="flex min-h-[360px] items-center justify-center px-6">
      <div className="max-w-sm text-center">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f8f2eb] text-[#9a7a52]">
          <OrdersIcon />
        </div>

        <h3 className="mt-5 text-base font-semibold text-[#403630]">
          No orders found
        </h3>

        <p className="mt-2 text-sm leading-6 text-[#92867d]">
          There are no orders matching the
          current hotel and status filter.
        </p>

      </div>
    </div>
  );
}

function OrdersIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3h12" />
      <path d="M7 3v3.5a5 5 0 0 0 10 0V3" />
      <path d="M9 13h6" />
      <path d="M8 17h8" />
      <path d="M5 21h14" />
    </svg>
  );
}

function RefreshIcon({
  spinning = false,
}) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={
        spinning
          ? 'animate-spin'
          : ''
      }
    >
      <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4" />
      <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

function getItemsSummary(order) {
  if (
    !Array.isArray(order?.items) ||
    order.items.length === 0
  ) {
    return 'No items';
  }

  return order.items
    .map(
      (item) =>
        `${item.quantity || 0}× ${
          item.name || 'Item'
        }`
    )
    .join(', ');
}

function getItemCount(order) {
  if (!Array.isArray(order?.items)) {
    return 0;
  }

  return order.items.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0),
    0
  );
}

function formatCurrency(value) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat(
    'en-IN',
    {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }
  ).format(amount);
}

function formatDateTime(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  ).format(date);
}

function shortId(id) {
  if (!id) return 'UNKNOWN';

  return String(id).slice(-6).toUpperCase();
}

function formatStatus(status) {
  if (!status) return 'Unknown';

  return status.charAt(0) +
    status.slice(1).toLowerCase();
}

function getNextStatusLabel(status) {
  const labels = {
    ACCEPTED: 'Accept Order',
    PREPARING: 'Start Preparing',
    READY: 'Mark Ready',
    DELIVERED: 'Mark Delivered',
    CANCELLED: 'Cancel Order',
  };

  return labels[status] || formatStatus(status);
}