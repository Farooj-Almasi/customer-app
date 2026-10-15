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
