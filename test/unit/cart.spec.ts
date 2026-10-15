import {
  Cart,
  cartCount,
  cartReducer,
  EMPTY_CART,
  estimatedTotalMinor,
  lineKey,
  toOrderItems,
} from '../../src/cart/cart';

const addBurger = (over = {}) =>
  ({
    type: 'ADD' as const,
    branchId: 'b1',
    line: { productId: 'p1', productName: 'Burger', unitPriceMinor: 3000, addonIds: [], addonNames: [] },
    ...over,
  });

/** First line, asserted present — keeps `noUncheckedIndexedAccess` happy in tests. */
function first(cart: Cart) {
  const line = cart.lines[0];
  if (!line) {
    throw new Error('expected at least one cart line');
  }
  return line;
}

describe('cart reducer', () => {
  it('adds an item and stacks the same product+addons', () => {
    let cart: Cart = EMPTY_CART;
    cart = cartReducer(cart, addBurger());
    cart = cartReducer(cart, addBurger());
    expect(cart.lines).toHaveLength(1);
    expect(first(cart).quantity).toBe(2);
    expect(cartCount(cart)).toBe(2);
    expect(cart.branchId).toBe('b1');
  });

  it('keeps different addon sets as separate lines', () => {
    let cart: Cart = EMPTY_CART;
    cart = cartReducer(cart, addBurger());
    cart = cartReducer(cart, addBurger({ line: { productId: 'p1', productName: 'Burger', unitPriceMinor: 3500, addonIds: ['a1'], addonNames: ['Cheese'] } }));
    expect(cart.lines).toHaveLength(2);
  });

  it('replaces the cart when adding from a different branch', () => {
    let cart: Cart = EMPTY_CART;
    cart = cartReducer(cart, addBurger());
    cart = cartReducer(cart, addBurger({ branchId: 'b2' }));
    expect(cart.branchId).toBe('b2');
    expect(cart.lines).toHaveLength(1);
  });

  it('sets quantity and removes a line at zero', () => {
    let cart: Cart = cartReducer(EMPTY_CART, addBurger());
    const key = first(cart).key;
    cart = cartReducer(cart, { type: 'SET_QTY', key, quantity: 5 });
    expect(first(cart).quantity).toBe(5);
    cart = cartReducer(cart, { type: 'SET_QTY', key, quantity: 0 });
    expect(cart.lines).toHaveLength(0);
    expect(cart.branchId).toBeNull();
  });

  it('removes a line and clears', () => {
    let cart: Cart = cartReducer(EMPTY_CART, addBurger());
    const key = first(cart).key;
    cart = cartReducer(cart, { type: 'REMOVE', key });
    expect(cart.lines).toHaveLength(0);
    cart = cartReducer(cartReducer(EMPTY_CART, addBurger()), { type: 'CLEAR' });
    expect(cart).toEqual(EMPTY_CART);
  });

  it('computes a local estimated total and order items', () => {
    let cart: Cart = cartReducer(EMPTY_CART, addBurger());
    cart = cartReducer(cart, { type: 'SET_QTY', key: first(cart).key, quantity: 3 });
    expect(estimatedTotalMinor(cart)).toBe(9000);
    expect(toOrderItems(cart)).toEqual([{ productId: 'p1', quantity: 3, addonIds: [] }]);
  });

  it('lineKey is order-independent for addons', () => {
    expect(lineKey('p1', ['a2', 'a1'])).toBe(lineKey('p1', ['a1', 'a2']));
  });
});
