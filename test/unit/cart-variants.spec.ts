import { Cart, cartReducer, EMPTY_CART, lineKey, toOrderItems } from '../../src/cart/cart';

const addVariant = (variantId: string, name: string, price: number) =>
  ({
    type: 'ADD' as const,
    branchId: 'b1',
    line: {
      productId: 'p1',
      productName: 'Shawarma',
      productVariantId: variantId,
      variantName: name,
      unitPriceMinor: price,
      addonIds: [],
      addonNames: [],
    },
  });

describe('cart variants', () => {
  it('keys a line by its variant, so two sizes are two lines', () => {
    expect(lineKey('p1', [], 'small')).not.toEqual(lineKey('p1', [], 'large'));
    // Omitting the variant keeps the key identical to the no-variant case.
    expect(lineKey('p1', [])).toEqual(lineKey('p1', [], undefined));
  });

  it('does not merge different variants of the same product', () => {
    let cart: Cart = EMPTY_CART;
    cart = cartReducer(cart, addVariant('small', 'Small', 2000));
    cart = cartReducer(cart, addVariant('large', 'Large', 3000));
    expect(cart.lines).toHaveLength(2);
    expect(cart.lines.map((l) => l.productVariantId).sort()).toEqual(['large', 'small']);
  });

  it('stacks the same variant', () => {
    let cart: Cart = EMPTY_CART;
    cart = cartReducer(cart, addVariant('small', 'Small', 2000));
    cart = cartReducer(cart, addVariant('small', 'Small', 2000));
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0]?.quantity).toBe(2);
  });

  it('sends productVariantId in the order items only when chosen', () => {
    let cart: Cart = EMPTY_CART;
    cart = cartReducer(cart, addVariant('large', 'Large', 3000));
    cart = cartReducer(cart, {
      type: 'ADD',
      branchId: 'b1',
      line: { productId: 'p2', productName: 'Cola', unitPriceMinor: 500, addonIds: [], addonNames: [] },
    });
    const items = toOrderItems(cart);
    expect(items[0]).toEqual({ productId: 'p1', productVariantId: 'large', quantity: 1, addonIds: [] });
    // No variant chosen → the key is absent entirely, not undefined.
    expect(items[1]).toEqual({ productId: 'p2', quantity: 1, addonIds: [] });
    expect('productVariantId' in (items[1] ?? {})).toBe(false);
  });
});
