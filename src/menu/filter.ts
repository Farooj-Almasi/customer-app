/**
 * Menu filtering — pure, no React Native.
 *
 * The storefront search and the category rail both run through this one
 * function, so "what the customer sees" has a single, tested definition. It
 * matches a product on either language's name or its description, and drops a
 * category that ends up with no products so the list never shows an empty
 * heading. Being pure, the awkward cases (bilingual match, a category filter
 * that hides everything, whitespace-only queries) are unit-tested.
 */

export interface FilterableProduct {
  name: string;
  nameAr: string | null;
  description: string | null;
}

export interface FilterableCategory<P extends FilterableProduct> {
  id: string;
  products: P[];
}

/** Does this product match the free-text query? Empty query matches everything. */
export function productMatches(product: FilterableProduct, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q.length === 0) {
    return true;
  }
  return [product.name, product.nameAr, product.description]
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .some((v) => v.toLowerCase().includes(q));
}

/**
 * Filter categories by an optional selected category id and a free-text query.
 * Returns categories that still have at least one matching product, each
 * narrowed to its matching products — preserving order.
 */
export function filterMenu<P extends FilterableProduct, C extends FilterableCategory<P>>(
  categories: readonly C[],
  query: string,
  categoryId: string | null,
): C[] {
  return categories
    .filter((c) => categoryId === null || c.id === categoryId)
    .map((c) => ({ ...c, products: c.products.filter((p) => productMatches(p, query)) }))
    .filter((c) => c.products.length > 0);
}
