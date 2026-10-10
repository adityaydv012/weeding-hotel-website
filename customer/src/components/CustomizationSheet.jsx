import { useEffect, useMemo, useState } from 'react';

function CustomizationSheet({ food, onClose, onAdd }) {
  const [selected, setSelected] = useState({});

  useEffect(() => {
    if (!food) {
      setSelected({});
    }
  }, [food]);

  const total = useMemo(() => {
    const basePrice = food?.discountPrice ?? food?.price ?? 0;

    if (!food?.customizations?.length) {
      return basePrice;
    }

    let extra = 0;

    food.customizations.forEach((group) => {
      const values = selected[group._id] || [];

      group.options?.forEach((option) => {
        if (values.includes(option._id)) {
          extra += option.priceDelta || 0;
        }
      });
    });

    return basePrice + extra;
  }, [food, selected]);

  if (!food) {
    return null;
  }

  const toggleOption = (group, option) => {
    setSelected((previous) => {
      const current = previous[group._id] || [];

      if (group.selectionType === 'SINGLE') {
        return {
          ...previous,
          [group._id]: [option._id],
        };
      }

      const exists = current.includes(option._id);

      return {
        ...previous,
        [group._id]: exists
          ? current.filter((id) => id !== option._id)
          : [...current, option._id],
      };
    });
  };

  const handleAdd = () => {
    const customizations = [];

    food.customizations?.forEach((group) => {
      const values = selected[group._id] || [];

      values.forEach((optionId) => {
        customizations.push({
          groupId: group._id,
          optionId,
        });
      });
    });

    onAdd(food, customizations);
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <button
        type="button"
        aria-label="Close customization"
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
      />

      {/* Bottom sheet */}
      <div className="absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:left-1/2 sm:bottom-1/2 sm:w-[520px] sm:-translate-x-1/2 sm:translate-y-1/2 sm:rounded-[28px]">
        <div className="flex max-h-[88vh] flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-5">
            <div>
              <h2 className="text-xl font-bold text-stone-950">
                {food.name}
              </h2>

              <p className="mt-1 text-sm text-stone-500">
                Customize your order
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-2xl text-stone-700"
            >
              ×
            </button>
          </div>

          {/* Options */}
          <div className="flex-1 overflow-y-auto">
            {food.customizations?.map((group) => (
              <section
                key={group._id}
                className="border-b border-stone-100"
              >
                <div className="flex items-center justify-between bg-stone-50 px-5 py-4">
                  <div>
                    <h3 className="font-semibold text-stone-950">
                      {group.name}
                    </h3>

                    <p className="mt-0.5 text-xs text-stone-500">
                      {group.required
                        ? 'Required'
                        : 'Optional'}
                    </p>
                  </div>

                  <span className="text-xs text-stone-400">
                    {group.selectionType === 'SINGLE'
                      ? 'Choose 1'
                      : 'Choose multiple'}
                  </span>
                </div>

                <div className="px-5">
                  {group.options?.map((option) => {
                    const current =
                      selected[group._id] || [];

                    const isSelected = current.includes(
                      option._id
                    );

                    return (
                      <button
                        key={option._id}
                        type="button"
                        onClick={() =>
                          toggleOption(group, option)
                        }
                        className="flex w-full items-center justify-between border-b border-stone-100 py-4 text-left last:border-b-0"
                      >
                        <div>
                          <p className="text-[15px] font-medium text-stone-900">
                            {option.name}
                          </p>

                          {option.priceDelta > 0 && (
                            <p className="mt-0.5 text-xs text-stone-400">
                              +₹{option.priceDelta}
                            </p>
                          )}
                        </div>

                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                            isSelected
                              ? 'border-stone-950 bg-stone-950'
                              : 'border-stone-300'
                          }`}
                        >
                          {isSelected && (
                            <span className="h-2.5 w-2.5 rounded-full bg-white" />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}

            {!food.customizations?.length && (
              <div className="px-5 py-8 text-center text-sm text-stone-500">
                No customization options for this item.
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="border-t border-stone-100 bg-white p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={handleAdd}
              className="flex w-full items-center justify-between rounded-2xl bg-stone-950 px-5 py-4 text-white active:scale-[0.99]"
            >
              <span className="text-lg font-bold">
                ₹{total}
              </span>

              <span className="text-sm font-bold uppercase tracking-wide">
                Add to cart
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomizationSheet;