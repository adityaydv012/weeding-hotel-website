import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const CartContext = createContext(null);

function getStorageKey(roomToken) {
  return `hotel-food-cart-${roomToken}`;
}

function getTaxStorageKey(roomToken) {
  return `hotel-food-tax-${roomToken}`;
}

export function CartProvider({
  children,
  roomToken,
}) {
  const storageKey = getStorageKey(roomToken);
  const taxStorageKey = getTaxStorageKey(roomToken);

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(
        storageKey
      );

      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [taxPercent, setTaxPercentState] =
    useState(() => {
      try {
        const saved =
          localStorage.getItem(taxStorageKey);

        return saved ? Number(saved) : 0;
      } catch {
        return 0;
      }
    });

  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(cart)
      );
    } catch {
      // Ignore storage errors.
    }
  }, [cart, storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(
        taxStorageKey,
        String(taxPercent)
      );
    } catch {
      // Ignore storage errors.
    }
  }, [taxPercent, taxStorageKey]);

  const setTaxPercent = (value) => {
    setTaxPercentState(Number(value) || 0);
  };

  const addItem = (
    food,
    customizations = []
  ) => {
    const unitPrice =
      food.discountPrice ?? food.price;

    const customizationKey =
      JSON.stringify(customizations || []);

    setCart((previous) => {
      const existingIndex =
        previous.findIndex(
          (item) =>
            item.foodItemId === food._id &&
            JSON.stringify(
              item.customizations || []
            ) === customizationKey
        );

      if (existingIndex !== -1) {
        return previous.map(
          (item, index) => {
            if (index !== existingIndex) {
              return item;
            }

            const quantity =
              item.quantity + 1;

            return {
              ...item,
              quantity,
              lineTotal:
                quantity * item.unitPrice,
            };
          }
        );
      }

      return [
        ...previous,
        {
          foodItemId: food._id,
          name: food.name,
          imageUrl: food.imageUrl || '',
          quantity: 1,
          unitPrice,
          customizations,
          lineTotal: unitPrice,
        },
      ];
    });
  };

  const updateQuantity = (
    index,
    quantity
  ) => {
    if (quantity <= 0) {
      setCart((previous) =>
        previous.filter(
          (_, itemIndex) =>
            itemIndex !== index
        )
      );

      return;
    }

    setCart((previous) =>
      previous.map(
        (item, itemIndex) => {
          if (itemIndex !== index) {
            return item;
          }

          return {
            ...item,
            quantity,
            lineTotal:
              quantity * item.unitPrice,
          };
        }
      )
    );
  };

  const removeItem = (index) => {
    setCart((previous) =>
      previous.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total + item.quantity,
        0
      ),
    [cart]
  );

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total + item.lineTotal,
        0
      ),
    [cart]
  );

  const taxAmount = useMemo(
    () =>
      Number(
        (
          (subtotal * taxPercent) /
          100
        ).toFixed(2)
      ),
    [subtotal, taxPercent]
  );

  const total = Number(
    (subtotal + taxAmount).toFixed(2)
  );

  const value = {
    cart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,

    cartCount,
    subtotal,

    taxPercent,
    setTaxPercent,
    taxAmount,
    total,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      'useCart must be used inside CartProvider'
    );
  }

  return context;
}