import { filterMenu, productMatches } from '../../src/menu/filter';

const cat = (id: string, products: { name: string; nameAr: string | null; description: string | null }[]) => ({
  id,
  products,
});
const p = (name: string, nameAr: string | null = null, description: string | null = null) => ({ name, nameAr, description });

const MENU = [
  cat('burgers', [p('Beef Burger', 'برجر لحم'), p('Chicken Burger', 'برجر دجاج')]),
  cat('drinks', [p('Cola', 'كولا', 'Chilled can'), p('Water', 'ماء')]),
];

describe('productMatches', () => {
  it('matches everything on an empty or whitespace query', () => {
    expect(productMatches(p('Cola'), '')).toBe(true);
    expect(productMatches(p('Cola'), '   ')).toBe(true);
  });

  it('matches on English name, Arabic name, or description, case-insensitively', () => {
    expect(productMatches(p('Beef Burger'), 'beef')).toBe(true);
    expect(productMatches(p('Beef Burger', 'برجر لحم'), 'لحم')).toBe(true);
    expect(productMatches(p('Cola', null, 'Chilled can'), 'chilled')).toBe(true);
    expect(productMatches(p('Cola'), 'tea')).toBe(false);
  });
});

describe('filterMenu', () => {
  it('returns everything with no query and no category', () => {
    const r = filterMenu(MENU, '', null);
    expect(r).toHaveLength(2);
    expect(r[0]?.products).toHaveLength(2);
  });

  it('restricts to a selected category', () => {
    const r = filterMenu(MENU, '', 'drinks');
    expect(r).toHaveLength(1);
    expect(r[0]?.id).toBe('drinks');
  });

  it('drops categories left with no matching products', () => {
    const r = filterMenu(MENU, 'burger', null);
    expect(r).toHaveLength(1);
    expect(r[0]?.id).toBe('burgers');
    expect(r[0]?.products).toHaveLength(2);
  });

  it('combines query and category, and can return nothing', () => {
    expect(filterMenu(MENU, 'cola', 'burgers')).toHaveLength(0);
    const r = filterMenu(MENU, 'cola', 'drinks');
    expect(r).toHaveLength(1);
    expect(r[0]?.products.map((x) => x.name)).toEqual(['Cola']);
  });
});
