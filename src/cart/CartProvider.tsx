import React, { createContext, useContext, useMemo, useReducer } from 'react';

import { Cart, CartAction, cartCount, cartReducer, EMPTY_CART } from './cart';

interface CartContextValue {
  cart: Cart;
  count: number;
  dispatch: React.Dispatch<CartAction>;
}

const CartContext = createContext<CartContextValue | null>(null);

/** Holds the cart via the pure reducer, so all cart maths stays testable. */
export function CartProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [cart, dispatch] = useReducer(cartReducer, EMPTY_CART);
  const value = useMemo<CartContextValue>(() => ({ cart, count: cartCount(cart), dispatch }), [cart]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
}
