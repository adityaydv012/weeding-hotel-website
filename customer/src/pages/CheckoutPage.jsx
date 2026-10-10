import { useState } from 'react';

import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';

import { createOrder } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';

function CheckoutPage() {
  const { roomToken } = useParams();
  const navigate = useNavigate();

  const {
    cart,
    subtotal,
    taxPercent,
    taxAmount,
    total,
    clearCart,
  } = useCart();

  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialInstructions, setSpecialInstructions] =
    useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');

    const name = guestName.trim();
    const mobile = phone.trim();

    if (name.length < 2) {
      setError('Please enter your name.');
      return;
    }

    if (!/^[0-9+\-\s()]{7,20}$/.test(mobile)) {
      setError('Please enter a valid mobile number.');
      return;
    }

    if (!cart.length) {
      setError('Your cart is empty.');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        roomToken,
        guestName: name,
        phone: mobile,
        specialInstructions:
          specialInstructions.trim(),

        items: cart.map((item) => ({
          foodItemId: item.foodItemId,
          quantity: item.quantity,
          customizations:
            item.customizations || [],
        })),
      };

      const response = await createOrder(payload);

      if (!response.success) {
        throw new Error(
          response.message ||
            'Unable to place order.'
        );
      }

      const orderSession = {
        order: response.order,
        trackingToken: response.trackingToken,
      };

      localStorage.setItem(
        `hotel-order-${roomToken}`,
        JSON.stringify(orderSession)
      );

      clearCart();

      navigate(
        `/order/${roomToken}/success`,
        {
          replace: true,
          state: orderSession,
        }
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to place your order. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!cart.length) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f5f0] px-5 pb-24">
        <div className="w-full max-w-md rounded-[32px] bg-white p-8 text-center shadow-sm ring-1 ring-stone-100">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-2xl">
            🛒
          </div>

          <h1 className="mt-5 font-serif text-2xl font-semibold">
            Your cart is empty
          </h1>

          <p className="mt-2 text-sm leading-6 text-stone-500">
            Add some food before checking
            out.
          </p>

          <Link
            to={`/order/${roomToken}`}
            className="mt-6 inline-flex rounded-2xl bg-[#4b1725] px-6 py-3.5 text-sm font-bold text-white shadow-lg"
          >
            Browse Menu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f5f0] pb-[210px] text-stone-950">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-[#f8f5f0]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-4 sm:px-6">
          <Link
            to={`/order/${roomToken}/cart`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm ring-1 ring-stone-100 transition active:scale-95"
          >
            ←
          </Link>

          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">
              Rose & Aman
            </p>

            <h1 className="text-lg font-bold">
              Checkout
            </h1>

            <p className="text-xs text-stone-400">
              Complete your order
            </p>
          </div>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8"
      >
        {/* Guest Details */}
        <section className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-stone-100 sm:p-6">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">
            Guest details
          </p>

          <h2 className="mt-1 font-serif text-2xl font-semibold">
            Who should we deliver to?
          </h2>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">
                Your name
              </span>

              <input
                type="text"
                value={guestName}
                onChange={(event) =>
                  setGuestName(event.target.value)
                }
                placeholder="Enter your name"
                autoComplete="name"
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 text-sm outline-none transition focus:border-[#4b1725] focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">
                Mobile number
              </span>

              <input
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                placeholder="Enter mobile number"
                autoComplete="tel"
                inputMode="tel"
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 text-sm outline-none transition focus:border-[#4b1725] focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">
                Special instructions
                <span className="ml-1 font-normal text-stone-400">
                  (optional)
                </span>
              </span>

              <textarea
                value={specialInstructions}
                onChange={(event) =>
                  setSpecialInstructions(
                    event.target.value
                  )
                }
                placeholder="Less spicy, extra napkins, etc."
                rows={3}
                maxLength={500}
                className="w-full resize-none rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3.5 text-sm outline-none transition focus:border-[#4b1725] focus:bg-white"
              />

              <span className="mt-1 block text-right text-[11px] text-stone-400">
                {specialInstructions.length}/500
              </span>
            </label>
          </div>
        </section>

        {/* Delivery */}
        <section className="mt-5 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-stone-100 sm:p-6">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">
            Delivery
          </p>

          <div className="mt-4 flex items-center gap-4 rounded-2xl border border-[#4b1725]/20 bg-[#faf5f5] p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#4b1725] text-lg text-white">
              ⌂
            </div>

            <div>
              <p className="font-semibold">
                Deliver to your room
              </p>

              <p className="mt-1 text-sm text-stone-500">
                Your QR code identifies the
                delivery room automatically.
              </p>
            </div>

            <span className="ml-auto text-green-600">
              ✓
            </span>
          </div>
        </section>

        {/* Payment */}
        <section className="mt-5 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-stone-100 sm:p-6">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">
            Payment
          </p>

          <button
            type="button"
            className="mt-4 flex w-full items-center gap-4 rounded-2xl border border-[#4b1725]/20 bg-[#faf5f5] p-4 text-left"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#4b1725] text-white">
              ₹
            </div>

            <div>
              <p className="font-semibold">
                Pay at Hotel
              </p>

              <p className="mt-1 text-sm text-stone-500">
                Pay when your order is delivered.
              </p>
            </div>

            <div className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-[#4b1725]">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-100" />
            </div>
          </button>
        </section>

        {/* Order Summary */}
        <section className="mt-5 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-stone-100 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">
                Review
              </p>

              <h2 className="mt-1 font-serif text-2xl font-semibold">
                Order summary
              </h2>
            </div>

            <Link
              to={`/order/${roomToken}/cart`}
              className="text-sm font-semibold text-[#4b1725] underline underline-offset-4"
            >
              Edit
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {cart.map((item, index) => (
              <div
                key={`${item.foodItemId}-${index}`}
                className="flex justify-between gap-4 text-sm"
              >
                <span className="text-stone-600">
                  {item.quantity} × {item.name}
                </span>

                <span className="shrink-0 font-semibold">
                  ₹{item.lineTotal}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-dashed border-stone-200 pt-4">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-stone-500">
                <span>Item total</span>
                <span>₹{subtotal}</span>
              </div>

              <div className="flex justify-between text-stone-500">
                <span>
                  Tax ({taxPercent}%)
                </span>

                <span>
                  ₹{taxAmount}
                </span>
              </div>

              <div className="flex justify-between border-t border-stone-100 pt-4">
                <span className="font-bold">
                  Total
                </span>

                <span className="text-xl font-bold text-[#4b1725]">
                  ₹{total}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
      </form>

      {/* Place Order CTA */}
      <div className="fixed bottom-[78px] left-0 right-0 z-50 border-t border-stone-200/80 bg-[#f8f5f0]/95 px-4 pt-3 pb-3 backdrop-blur-xl sm:pt-4 sm:pb-4">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex w-full items-center justify-between rounded-[20px] bg-[#4b1725] px-5 py-4 text-white shadow-xl transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="text-left">
              <p className="text-[10px] font-medium uppercase tracking-wide text-white/55">
                Pay at hotel
              </p>

              <p className="mt-0.5 text-lg font-bold text-amber-100">
                ₹{total}
              </p>
            </div>

            <span className="rounded-xl bg-amber-100 px-4 py-3 text-xs font-bold text-[#4b1725]">
              {submitting
                ? 'Placing order...'
                : 'Place Order →'}
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}

export default CheckoutPage;