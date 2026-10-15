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
  AddAddress: undefined;
  PaymentProcessing: { orderId: string };
  OrderTracking: { orderId: string };
  Orders: undefined;
};
