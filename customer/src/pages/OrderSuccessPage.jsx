import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

function saveOrderToHistory(roomToken, orderSession) {
  if (!roomToken || !orderSession?.order || !orderSession?.trackingToken) {
    return;
  }

  try {
    const historyKey = `hotel-orders-${roomToken}`;

    const existing = localStorage.getItem(historyKey);

    let history = [];

    if (existing) {
      const parsed = JSON.parse(existing);

      if (Array.isArray(parsed)) {
        history = parsed;
      }
    }

    const newOrder = {
      orderId: orderSession.order.id,
      orderNumber: orderSession.order.orderNumber,
      trackingToken: orderSession.trackingToken,
      roomNumber: orderSession.order.roomNumber,
      total: orderSession.order.total,
      createdAt: new Date().toISOString(),
    };

    const alreadyExists = history.some(
      (item) =>
        String(item.orderId) ===
        String(newOrder.orderId)
    );

    if (!alreadyExists) {
      history.unshift(newOrder);
    } else {
      history = history.map((item) =>
        String(item.orderId) ===
        String(newOrder.orderId)
          ? {
              ...item,
              ...newOrder,
            }
          : item
      );
    }

    // Keep the most recent 20 orders for this room/browser.
    history = history.slice(0, 20);

    localStorage.setItem(
      historyKey,
      JSON.stringify(history)
    );

    // Keep the existing session format used by
    // OrderTrackingPage.
    localStorage.setItem(
      `hotel-order-${roomToken}`,
      JSON.stringify(orderSession)
    );
  } catch (error) {
    console.error(
      'Unable to save order history:',
      error
    );
  }
}

function OrderSuccessPage() {
  const { roomToken } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  let orderSession =
    location.state || null;

  if (!orderSession) {
    try {
      const saved =
        localStorage.getItem(
          `hotel-order-${roomToken}`
        );

      orderSession = saved
        ? JSON.parse(saved)
        : null;
    } catch {
      orderSession = null;
    }
  }

  const order =
    orderSession?.order;

  const trackingToken =
    orderSession?.trackingToken;

  /*
   * Save the order so it can later be found
   * from the Menu → Track Your Order section.
   */
  if (order && trackingToken) {
    saveOrderToHistory(
      roomToken,
      orderSession
    );
  }

  if (!order || !trackingToken) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 px-5">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold">
            Order details unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-stone-500">
            This order session is no longer available
            on this device.
          </p>

          <Link
            to={`/order/${roomToken}`}
            className="mt-6 inline-flex rounded-2xl bg-stone-950 px-6 py-3.5 text-sm font-bold text-white"
          >
            Back to Menu
          </Link>
        </div>
      </main>
    );
  }

  const handleTrack = () => {
    navigate(
      `/order/${roomToken}/track/${order.id}`,
      {
        state: {
          trackingToken,
        },
      }
    );
  };

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
        <div className="rounded-[32px] bg-white p-7 text-center shadow-sm ring-1 ring-stone-100 sm:p-9">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
            <span className="text-4xl text-green-600">
              ✓
            </span>
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-green-600">
            Order confirmed
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Your order is confirmed
          </h1>

          <p className="mt-3 text-sm leading-6 text-stone-500">
            The hotel team has received your
            order and will start preparing it.
          </p>

          <div className="mt-7 rounded-2xl bg-stone-50 p-5 text-left">
            <div className="flex justify-between">
              <span className="text-sm text-stone-500">
                Order
              </span>

              <span className="text-sm font-bold">
                #{order.orderNumber}
              </span>
            </div>

            <div className="mt-3 flex justify-between">
              <span className="text-sm text-stone-500">
                Room
              </span>

              <span className="text-sm font-semibold">
                {order.roomNumber}
              </span>
            </div>

            <div className="mt-3 flex justify-between">
              <span className="text-sm text-stone-500">
                Payment
              </span>

              <span className="text-sm font-semibold">
                Pay at Hotel
              </span>
            </div>

            <div className="mt-4 border-t border-stone-200 pt-4">
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

          <button
            type="button"
            onClick={handleTrack}
            className="mt-6 w-full rounded-2xl bg-stone-950 px-5 py-4 text-sm font-bold text-white shadow-lg transition active:scale-[0.98]"
          >
            Track Order →
          </button>

          <Link
            to={`/order/${roomToken}`}
            className="mt-4 block text-sm font-semibold text-stone-500 underline underline-offset-4"
          >
            Order More Food
          </Link>
        </div>
      </div>
    </main>
  );
}

export default OrderSuccessPage;