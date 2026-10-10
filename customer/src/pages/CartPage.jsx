import { Link, useNavigate, useParams } from 'react-router-dom';

import { useCart } from '../context/CartContext.jsx';

function CartPage() {
  const { roomToken } = useParams();
  const navigate = useNavigate();

  const {
    cart,
    updateQuantity,
    removeItem,
    subtotal,
    taxPercent,
    taxAmount,
    total,
  } = useCart();

  const itemCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  if (!cart.length) {
    return (
      <main className="min-h-screen bg-[#f8f5f0] pb-24">
        <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-[#f8f5f0]/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-4 sm:px-6">
            <Link
              to={`/order/${roomToken}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm ring-1 ring-stone-100 transition active:scale-95"
            >
              ←
            </Link>

            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">
                Rose & Aman
              </p>

              <h1 className="text-lg font-bold text-stone-950">
                Your Cart
              </h1>
            </div>
          </div>
        </header>

        <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl shadow-sm ring-1 ring-stone-100">
            🛒
          </div>

          <h2 className="mt-6 font-serif text-2xl font-semibold text-stone-950">
            Your cart is empty
          </h2>

          <p className="mt-2 text-sm leading-6 text-stone-500">
            Add something delicious from the menu
            and it will appear here.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(`/order/${roomToken}`)
            }
            className="mt-6 rounded-2xl bg-[#4b1725] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition active:scale-95"
          >
            Browse Menu
          </button>
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
            to={`/order/${roomToken}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm ring-1 ring-stone-100 transition active:scale-95"
          >
            ←
          </Link>

          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">
              Rose & Aman
            </p>

            <h1 className="text-lg font-bold">
              Your Cart
            </h1>

            <p className="text-xs text-stone-400">
              {itemCount}{' '}
              {itemCount === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Cart Items */}
        <section className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-stone-100">
          {cart.map((item, index) => (
            <article
              key={`${item.foodItemId}-${index}`}
              className="border-b border-stone-100 p-4 last:border-b-0 sm:p-5"
            >
              <div className="flex gap-4">
                {/* Product Image */}
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-stone-100">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-rose-50 to-amber-50 font-serif text-2xl text-[#4b1725]/30">
                      {item.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-stone-950">
                        {item.name}
                      </h2>

                      <p className="mt-1 text-sm text-stone-500">
                        ₹{item.unitPrice}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeItem(index)
                      }
                      className="shrink-0 text-xs font-medium text-stone-400 transition hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    {/* Quantity */}
                    <div className="flex items-center overflow-hidden rounded-xl border border-stone-200 bg-white">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            index,
                            item.quantity - 1
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center text-lg text-stone-600 transition hover:bg-stone-50 active:scale-90"
                      >
                        −
                      </button>

                      <span className="flex h-9 min-w-9 items-center justify-center border-x border-stone-200 text-sm font-semibold">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            index,
                            item.quantity + 1
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center text-lg text-stone-600 transition hover:bg-stone-50 active:scale-90"
                      >
                        +
                      </button>
                    </div>

                    {/* Line Total */}
                    <span className="font-bold text-stone-950">
                      ₹{item.lineTotal}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* Bill Summary */}
        <section className="mt-5 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-stone-100 sm:p-6">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">
              Your order
            </p>

            <h2 className="mt-1 font-serif text-2xl font-semibold">
              Bill summary
            </h2>
          </div>

          <div className="mt-5 space-y-3 text-sm">
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

            <div className="border-t border-dashed border-stone-200 pt-4">
              <div className="flex items-center justify-between">
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

        {/* Payment */}
        <section className="mt-5 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-stone-100 sm:p-6">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">
            Payment
          </p>

          <h2 className="mt-1 font-serif text-2xl font-semibold">
            Pay at hotel
          </h2>

          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#4b1725]/20 bg-[#faf5f5] p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#4b1725] text-white">
              ₹
            </div>

            <div>
              <p className="font-semibold text-stone-900">
                Pay at Hotel
              </p>

              <p className="mt-1 text-xs leading-5 text-stone-500">
                Pay when your order is delivered
                to your room.
              </p>
            </div>

            <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-[#4b1725]">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-100" />
            </span>
          </div>
        </section>
      </div>

      {/* Checkout CTA */}
      <div className="fixed bottom-[78px] left-0 right-0 z-50 border-t border-stone-200/80 bg-[#f8f5f0]/95 px-4 pt-3 pb-3 backdrop-blur-xl sm:pt-4 sm:pb-4">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={() =>
              navigate(
                `/order/${roomToken}/checkout`
              )
            }
            className="flex w-full items-center justify-between rounded-[20px] bg-[#4b1725] px-5 py-4 text-white shadow-xl transition active:scale-[0.99]"
          >
            <div className="text-left">
              <p className="text-[10px] font-medium uppercase tracking-wide text-white/55">
                Total payable
              </p>

              <p className="mt-0.5 text-lg font-bold text-amber-100">
                ₹{total}
              </p>
            </div>

            <span className="rounded-xl bg-amber-100 px-4 py-3 text-xs font-bold text-[#4b1725]">
              Proceed to Checkout →
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}

export default CartPage;