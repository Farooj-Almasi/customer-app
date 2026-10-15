/**
 * Cart state — a pure reducer, no React Native.
 *
 * The cart holds only what the customer wants to buy: product ids, quantities
 * and chosen add-ons, plus a *display* price copied from the menu. It never
 * decides the payable total — that is the backend's job (`/pricing/quote` and
 * order placement). The `estimatedTotalMinor` here is a local preview only, and
 * the checkout always shows the server quote before payment.
 *
 * Being pure, every transition is unit-tested, which is what keeps cart maths
 * from silently drifting.
 */

export interface CartLine {
  /** Stable key for the line: product + sorted addon ids. */
  key: string;
  productId: string;
  productName: string;
  /** Per-unit display price in minor units, from the menu (product + addons). */
  unitPriceMinor: number;
  quantity: number;
  addonIds: string[];
  addonNames: string[];
}

export interface Cart {
  branchId: string | null;
  lines: CartLine[];
}

export const EMPTY_CART: Cart = { branchId: null, lines: [] };

export type CartAction =
  | { type: 'ADD'; branchId: string; line: Omit<CartLine, 'key' | 'quantity'>; quantity?: number }
  | { type: 'SET_QTY'; key: string; quantity: number }
  | { type: 'REMOVE'; key: string }
  | { type: 'CLEAR' };

/** A stable line key so the same product+addons stacks instead of duplicating. */
export function lineKey(productId: string, addonIds: readonly string[]): string {
  return [productId, ...[...addonIds].sort()].join('|');
}

export function cartReducer(state: Cart, action: CartAction): Cart {
  switch (action.type) {
    case 'ADD': {
      // Adding from a different branch replaces the cart — an order is always
      // for one branch, and mixing would be meaningless.
      const base = state.branchId === action.branchId ? state : { branchId: action.branchId, lines: [] };
      const key = lineKey(action.line.productId, action.line.addonIds);
      const qty = Math.max(1, action.quantity ?? 1);
      const existing = base.lines.find((l) => l.key === key);
      const lines = existing
        ? base.lines.map((l) => (l.key === key ? { ...l, quantity: l.quantity + qty } : l))
        : [...base.lines, { ...action.line, key, quantity: qty }];
      return { branchId: action.branchId, lines };
    }
    case 'SET_QTY': {
      if (action.quantity <= 0) {
        return removeLine(state, action.key);
      }
      return {
        ...state,
        lines: state.lines.map((l) => (l.key === action.key ? { ...l, quantity: action.quantity } : l)),
      };
    }
    case 'REMOVE':
      return removeLine(state, action.key);
    case 'CLEAR':
      return EMPTY_CART;
    default:
      return state;
  }
}

function removeLine(state: Cart, key: string): Cart {
  const lines = state.lines.filter((l) => l.key !== key);
  return { branchId: lines.length > 0 ? state.branchId : null, lines };
}

/** Total item count across all lines — what the cart badge shows. */
export function cartCount(cart: Cart): number {
  return cart.lines.reduce((sum, l) => sum + l.quantity, 0);
}

/** Local price preview only. The server quote is authoritative at checkout. */
export function estimatedTotalMinor(cart: Cart): number {
  return cart.lines.reduce((sum, l) => sum + l.unitPriceMinor * l.quantity, 0);
}

/** The cart as the order/quote API expects it: product ids, quantities, addons. */
export function toOrderItems(cart: Cart): { productId: string; quantity: number; addonIds: string[] }[] {
  return cart.lines.map((l) => ({ productId: l.productId, quantity: l.quantity, addonIds: l.addonIds }));
}
