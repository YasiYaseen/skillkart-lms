import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  courseId: string;
  title: string;
  price: number;
  thumbnailUrl?: string;
  instructorName?: string;
}

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (item: CartItem) => void;
  removeFromCart: (courseId: string) => void;
  clearCart: () => void;
  isInCart: (courseId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'skillkart_cart_items';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage write issues
    }
  }, [cart]);

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      if (prev.some((i) => i.courseId === item.courseId)) {
        return prev;
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (courseId: string) => {
    setCart((prev) => prev.filter((i) => i.courseId !== courseId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const isInCart = (courseId: string) => {
    return cart.some((i) => i.courseId === courseId);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (typeof item.price === 'number' ? item.price : 0), 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount: cart.length,
        cartTotal,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
