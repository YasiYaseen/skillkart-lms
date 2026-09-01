import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import {
  fetchBackendCart,
  addToBackendCart,
  removeFromBackendCart,
  clearBackendCart,
  mergeBackendCart,
} from '@/features/student/api/cart';

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
  isLoadingCart: boolean;
  addToCart: (item: CartItem) => Promise<void>;
  removeFromCart: (courseId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  isInCart: (courseId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_CART_STORAGE_KEY = 'skillkart_cart_guest';
const LEGACY_CART_STORAGE_KEY = 'skillkart_cart_items';

function readGuestStorage(): CartItem[] {
  try {
    const guestStored = localStorage.getItem(GUEST_CART_STORAGE_KEY);
    if (guestStored) return JSON.parse(guestStored);

    const legacyStored = localStorage.getItem(LEGACY_CART_STORAGE_KEY);
    if (legacyStored) return JSON.parse(legacyStored);

    return [];
  } catch {
    return [];
  }
}

function writeGuestStorage(items: CartItem[]) {
  try {
    if (items.length === 0) {
      localStorage.removeItem(GUEST_CART_STORAGE_KEY);
      localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
    } else {
      localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(items));
    }
  } catch {
    // Ignore storage write issues
  }
}

function clearAllGuestStorage() {
  try {
    localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, isLoading: isAuthLoading } = useAuth();
  const [cart, setCart] = useState<CartItem[]>(() => {
    // Initial guess before auth resolves
    return readGuestStorage();
  });
  const [isLoadingCart, setIsLoadingCart] = useState(false);
  const prevUserRef = useRef<string | null>(null);

  // Synchronize cart when auth state changes (login, logout, initial load)
  useEffect(() => {
    if (isAuthLoading) return;

    const currentUserId = user?.id || null;
    const prevUserId = prevUserRef.current;
    prevUserRef.current = currentUserId;

    // 1. User logged out
    if (prevUserId && !currentUserId) {
      setCart([]);
      clearAllGuestStorage();
      return;
    }

    // 2. User is logged in
    if (token && user) {
      const guestItems = readGuestStorage();
      setIsLoadingCart(true);

      if (guestItems.length > 0) {
        const guestCourseIds = guestItems.map((i) => i.courseId);
        mergeBackendCart(guestCourseIds)
          .then((serverItems) => {
            setCart(serverItems);
            clearAllGuestStorage();
          })
          .catch(() => {
            // Fallback to fetch
            return fetchBackendCart().then((serverItems) => setCart(serverItems));
          })
          .finally(() => {
            setIsLoadingCart(false);
          });
      } else {
        fetchBackendCart()
          .then((serverItems) => {
            setCart(serverItems);
          })
          .catch(() => {
            setCart([]);
          })
          .finally(() => {
            setIsLoadingCart(false);
          });
      }
      return;
    }

    // 3. Unauthenticated guest
    if (!token && !user) {
      const guestItems = readGuestStorage();
      setCart(guestItems);
    }
  }, [user, token, isAuthLoading]);

  // Persist guest cart when user is NOT logged in
  useEffect(() => {
    if (!isAuthLoading && !user && !token) {
      writeGuestStorage(cart);
    }
  }, [cart, user, token, isAuthLoading]);

  const addToCart = async (item: CartItem) => {
    if (cart.some((i) => i.courseId === item.courseId)) {
      return;
    }

    // Optimistic UI update
    setCart((prev) => [...prev, item]);

    if (token && user) {
      try {
        const serverItems = await addToBackendCart(item.courseId);
        if (Array.isArray(serverItems) && serverItems.length > 0) {
          setCart(serverItems);
        }
      } catch (err) {
        console.error('Failed to sync added cart item to backend:', err);
      }
    }
  };

  const removeFromCart = async (courseId: string) => {
    // Optimistic UI update
    setCart((prev) => prev.filter((i) => i.courseId !== courseId));

    if (token && user) {
      try {
        const serverItems = await removeFromBackendCart(courseId);
        setCart(serverItems);
      } catch (err) {
        console.error('Failed to remove cart item from backend:', err);
      }
    }
  };

  const clearCart = async () => {
    setCart([]);
    clearAllGuestStorage();

    if (token && user) {
      try {
        await clearBackendCart();
      } catch (err) {
        console.error('Failed to clear cart on backend:', err);
      }
    }
  };

  const isInCart = (courseId: string) => {
    return cart.some((i) => i.courseId === courseId);
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + (typeof item.price === 'number' ? item.price : 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount: cart.length,
        cartTotal,
        isLoadingCart,
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
