import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

import { getPublicOrder } from '../api/client.js';

const statuses = [
  {
    key: 'NEW',
    label: 'Order Received',
    description:
      'Your order has been received.',
  },
  {
    key: 'ACCEPTED',
    label: 'Order Accepted',
    description:
      'The hotel has accepted your order.',
  },
  {
    key: 'PREPARING',
    label: 'Preparing',
    description:
      'Your food is being prepared.',
  },
  {
    key: 'READY',
    label: 'Ready',
    description:
      'Your order is ready for delivery.',
  },
  {
    key: 'DELIVERED',
    label: 'Delivered',
    description:
      'Your order has been delivered.',
  },
];

function OrderTrackingPage() {
  const {
    roomToken,
    orderId,
  } = useParams();

  const location =
    useLocation();

  const navigate =
    useNavigate();

  const [order, setOrder] =
    useState(null);

  const [trackingToken, setTrackingToken] =
    useState(
      location.state?.trackingToken ||
        ''
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const loadOrder =
    useCallback(async () => {
      try {
        let token =
          trackingToken;

        if (!token) {
          const saved =
            localStorage.getItem(
              `hotel-order-${roomToken}`
            );

          if (saved) {
            const session =
              JSON.parse(saved);

            token =
              session.trackingToken;

            setTrackingToken(token);
          }
        }

        if (!token) {
          throw new Error(
            'Tracking session not found.'
          );
        }

        const response =
          await getPublicOrder(
            orderId,
            token
          );

        if (!response.success) {
          throw new Error(
            response.message ||
              'Unable to load order.'
          );
        }

        setOrder(response.order);
        setError('');
      } catch (err) {
        console.error(err);

        setError(
          err.response?.data?.message ||
            err.message ||
            'Unable to load your order.'
        );
      } finally {
        setLoading(false);
      }
    }, [
      orderId,
      roomToken,
      trackingToken,
    ]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    if (!order) {
      return;
    }

    if (
      order.orderStatus ===
        'DELIVERED' ||
      order.orderStatus ===
        'CANCELLED'
    ) {
      return;
    }

    const interval =
      setInterval(() => {
        loadOrder();
      }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [order, loadOrder]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-stone-200 border-t-stone-950" />

          <p className="mt-4 text-sm text-stone-500">
            Loading your order...
          </p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 px-5">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-xl text-red-600">
            !
          </div>

          <h1 className="mt-5 text-xl font-bold">
            Unable to load order
          </h1>

          <p className="mt-2 text-sm leading-6 text-stone-500">
            {error}
          </p>

          <button
            type="button"
            onClick={loadOrder}
            className="mt-6 rounded-2xl bg-stone-950 px-6 py-3.5 text-sm font-bold text-white"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  const currentIndex =
    statuses.findIndex(
      (status) =>
        status.key ===
        order.orderStatus
    );

  const isCancelled =
    order.orderStatus ===
    'CANCELLED';

  return (
    <main className="min-h-screen bg-stone-50 pb-10">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() =>
              navigate(
                `/order/${roomToken}`
              )
            }
            className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-xl"
          >
            ←
          </button>

          <div>
            <h1 className="text-lg font-bold">
              Track Order
            </h1>

            <p className="text-xs text-stone-400">
              #{order.orderNumber}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        {isCancelled ? (
          <section className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-stone-100">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-2xl text-red-600">
              ×
            </div>

            <h2 className="mt-5 text-xl font-bold">
              Order Cancelled
            </h2>

            <p className="mt-2 text-sm text-stone-500">
              This order has been cancelled by
              the hotel.
            </p>
          </section>
        ) : (
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-100 sm:p-8">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                <span className="text-2xl text-green-600">
                  ✓
                </span>
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                Current status
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                {
                  statuses[
                    Math.max(
                      currentIndex,
                      0
                    )
                  ]?.label
                }
              </h2>

              <p className="mt-2 text-sm text-stone-500">
                {
                  statuses[
                    Math.max(
                      currentIndex,
                      0
                    )
                  ]?.description
                }
              </p>
            </div>

            <div className="mt-10">
              {statuses.map(
                (
                  status,
                  index
                ) => {
                  const completed =
                    index <=
                    currentIndex;

                  const active =
                    index ===
                    currentIndex;

                  return (
                    <div
                      key={
                        status.key
                      }
                      className="relative flex gap-4"
                    >
                      {index <
                        statuses.length -
                          1 && (
                        <div
                          className={`absolute left-[15px] top-8 h-[calc(100%+4px)] w-0.5 ${
                            index <
                            currentIndex
                              ? 'bg-stone-950'
                              : 'bg-stone-200'
                          }`}
                        />
                      )}

                      <div
                        className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                          completed
                            ? 'border-stone-950 bg-stone-950 text-white'
                            : 'border-stone-200 bg-white text-stone-300'
                        }`}
                      >
                        {completed
                          ? '✓'
                          : ''}
                      </div>

                      <div className="pb-9">
                        <p
                          className={`text-sm font-bold ${
                            active
                              ? 'text-stone-950'
                              : completed
                              ? 'text-stone-700'
                              : 'text-stone-400'
                          }`}
                        >
                          {
                            status.label
                          }
                        </p>

                        <p className="mt-1 text-xs leading-5 text-stone-400">
                          {
                            status.description
                          }
                        </p>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </section>
        )}

        <section className="mt-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-100">
          <h2 className="text-lg font-bold">
            Order details
          </h2>

          <div className="mt-5 space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-stone-500">
                Order number
              </span>

              <span className="text-sm font-semibold">
                #{order.orderNumber}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-stone-500">
                Room
              </span>

              <span className="text-sm font-semibold">
                {order.roomNumber}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-stone-500">
                Payment
              </span>

              <span className="text-sm font-semibold">
                {order.paymentMethod ===
                'COD'
                  ? 'Pay at Hotel'
                  : order.paymentMethod}
              </span>
            </div>

            <div className="border-t border-dashed border-stone-200 pt-4">
              <div className="flex justify-between">
                <span className="font-bold">
                  Total
                </span>

                <span className="text-xl font-bold">
                  ₹{order.total}
                </span>
              </div>
            </div>
          </div>
        </section>

        <Link
          to={`/order/${roomToken}`}
          className="mt-5 block rounded-2xl bg-stone-950 px-5 py-4 text-center text-sm font-bold text-white"
        >
          Order More Food
        </Link>
      </div>
    </main>
  );
}

export default OrderTrackingPage;