import { Address } from '../api/types';
import { OrderType } from '../types/backend';

/** The app's screens and their params. One source of truth for navigation typing. */
export type RootStackParamList = {
  // Auth flow
  Phone: undefined;
  Otp: { phone: string };
  // Main flow
  Branches: undefined;
  Menu: { branchId: string; branchName: string };
  Cart: undefined;
  Checkout: { type: OrderType };
  /** No `address` adds a new one; an `address` opens the same form in edit mode. */
  AddAddress: { address?: Address } | undefined;
  PaymentProcessing: { orderId: string };
  OrderTracking: { orderId: string };
  Orders: undefined;
  Account: undefined;
  Notifications: undefined;
  Loyalty: undefined;
  Offers: undefined;
};
