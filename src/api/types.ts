/**
 * API response shapes, mirrored from the backend. Kept in one place and in sync
 * with the backend controllers the app calls.
 */

import { OrderStatus, OrderType, PaymentStatus } from '../types/backend';

export interface Branch {
  id: string;
  name: string;
  nameAr: string | null;
  addressLine: string;
  district: string | null;
  city: string;
  latitude: number | null;
  longitude: number | null;
  acceptsDelivery: boolean;
  acceptsPickup: boolean;
  isAcceptingOrders: boolean;
  acceptsCashOnDelivery: boolean;
  deliveryFeeMinor: number;
  minOrderMinor: number;
  prepTimeMinutes: number | null;
}

export interface MenuAddon {
  id: string;
  name: string;
  nameAr: string | null;
  priceMinor: number;
}

export interface MenuModifierGroup {
  id: string;
  name: string;
  nameAr: string | null;
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
  addons: MenuAddon[];
}

export interface MenuProduct {
  id: string;
  name: string;
  nameAr: string | null;
  description: string | null;
  imageUrl: string | null;
  priceMinor: number;
  taxClass: string;
  variants: { id: string; name: string; priceMinor: number; isDefault: boolean }[];
  modifierGroups: MenuModifierGroup[];
}

export interface MenuCategory {
  id: string;
  name: string;
  nameAr: string | null;
  imageUrl: string | null;
  products: MenuProduct[];
}

export interface Menu {
  branch: { id: string; name: string; nameAr: string | null };
  deliveryFeeMinor: number;
  minOrderMinor: number;
  categories: MenuCategory[];
}

export interface PriceQuote {
  currency: string;
  subtotalMinor: number;
  discountMinor: number;
  deliveryFeeMinor: number;
  taxableBaseMinor: number;
  vatMinor: number;
  totalMinor: number;
  vatRate: string;
}

export interface OrderItem {
  id: string;
  productName: string;
  variantName: string | null;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  branchId: string;
  type: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotalMinor: number;
  discountMinor: number;
  deliveryFeeMinor: number;
  vatMinor: number;
  totalMinor: number;
  items: OrderItem[];
  placedAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  status: PaymentStatus;
  method: string | null;
  amountMinor: number;
  gatewayName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface Address {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  district: string | null;
  city: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  isDefault: boolean;
}

export interface DeliveryTracking {
  id: string;
  orderId: string;
  status: string;
  addressSnapshot: {
    line1?: string;
    city?: string;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  driver: {
    id: string;
    vehicleType: string;
    currentLatitude: number | null;
    currentLongitude: number | null;
    lastLocationAt: string | null;
    user: { fullName: string };
  } | null;
}

/** Pagination envelope the backend returns alongside every paginated collection. */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

/** The customer's own profile. Phone is the login identity and is view-only. */
export interface Profile {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  createdAt: string;
}

/** One entry in the loyalty points ledger (the balance is the sum of these). */
export interface LoyaltyTransaction {
  id: string;
  type: string;
  points: number;
  orderId: string | null;
  reason: string | null;
  createdAt: string;
}

export interface LoyaltyLedger extends Paginated<LoyaltyTransaction> {
  balance: number;
}

/** One item in the customer's notification feed. */
export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  data: unknown;
  orderId: string | null;
  createdAt: string;
}

/**
 * A published coupon shown as an offer. The card carries the very `code` the
 * checkout accepts — there is no separate discount path.
 */
export interface Offer {
  id: string;
  code: string;
  name: string;
  description?: string;
  imageUrl?: string;
  discountType: string;
  discountValue: number;
  maxDiscountMinor?: number;
  minSpendMinor?: number;
  validUntil: string;
}

/** A promotional banner from the customer config. */
export interface ConfigBanner {
  id: string;
  imageUrl: string;
  imageUrlAr?: string;
  title?: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  buttonText?: string;
  buttonTextAr?: string;
  action: string | null;
  targetId?: string;
  targetUrl?: string;
  branchIds: string[];
  priority: number;
}

/** The public customer config: branding, offers, banners. Only the slices the app uses are typed. */
export interface CustomerConfig {
  version: number;
  offers: Offer[];
  banners: ConfigBanner[];
}

/** The applied coupon on a customer quote. */
export interface AppliedCoupon {
  code: string;
  couponId: string;
  name: string;
  discountMinor: number;
}

/** The applied promotion on a customer quote. */
export interface AppliedPromotion {
  promotionId: string;
  name: string;
  discountMinor: number;
}

/**
 * The authenticated customer quote (`/customer/orders/quote`). Richer than the
 * public price quote: it previews the coupon and promotion and says whether the
 * branch is open, while `quote` itself is the same breakdown as {@link PriceQuote}.
 */
export interface CustomerQuote {
  quote: PriceQuote;
  coupon: AppliedCoupon | null;
  couponError: string | null;
  promotion: AppliedPromotion | null;
  branchOpen: {
    isOpen: boolean;
    message: string | null;
    opensAt: string | null;
    closesAt: string | null;
  };
}
