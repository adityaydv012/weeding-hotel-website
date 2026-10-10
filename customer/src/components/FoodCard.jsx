function VegIcon() {
  return (
    <span
      title="Vegetarian"
      aria-label="Vegetarian"
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border border-green-600"
    >
      <span className="h-2 w-2 rounded-full bg-green-600" />
    </span>
  );
}

function NonVegIcon() {
  return (
    <span
      title="Non-vegetarian"
      aria-label="Non-vegetarian"
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border border-red-600"
    >
      <span className="h-2 w-2 rounded-full bg-red-600" />
    </span>
  );
}

function FoodCard({ food, onAdd }) {
  const sellingPrice = food.discountPrice ?? food.price;

  const hasDiscount =
    food.discountPrice != null &&
    food.discountPrice < food.price;

  return (
    <article className="group border-b border-stone-200 py-5 last:border-b-0 sm:py-6">
      <div className="flex gap-4 sm:gap-6">
        <div className="relative h-[118px] w-[118px] shrink-0 overflow-hidden rounded-2xl bg-stone-100 sm:h-[150px] sm:w-[150px]">
          {food.imageUrl ? (
            <img
              src={food.imageUrl}
              alt={food.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
              <span className="text-3xl font-black text-stone-300">
                {food.name?.charAt(0) || "F"}
              </span>
            </div>
          )}

          {food.isBestseller && (
            <div className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-900 shadow-sm">
              Bestseller
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start gap-2">
            {food.isVeg === true ? (
              <VegIcon />
            ) : (
              <NonVegIcon />
            )}

            <h3 className="line-clamp-2 text-[17px] font-semibold leading-snug text-stone-950 sm:text-lg">
              {food.name}
            </h3>
          </div>

          {food.description && (
            <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-stone-500 sm:text-sm">
              {food.description}
            </p>
          )}

          <div className="mt-auto pt-3">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-stone-950 sm:text-lg">
                ₹{sellingPrice}
              </span>

              {hasDiscount && (
                <span className="text-sm text-stone-400 line-through">
                  ₹{food.price}
                </span>
              )}
            </div>

            {food.preparationTime > 0 && (
              <p className="mt-1 text-xs text-stone-400">
                {food.preparationTime} min
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-end">
          <button
            type="button"
            onClick={() => onAdd(food)}
            className="min-w-[72px] rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-950 shadow-sm transition active:scale-95 hover:border-stone-950 hover:bg-stone-950 hover:text-white sm:min-w-[82px]"
          >
            ADD
          </button>
        </div>
      </div>
    </article>
  );
}

export default FoodCard;