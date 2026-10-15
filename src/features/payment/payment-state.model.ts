/**
 * Payment-state model — pure logic for the `PaymentStateView`.
 *
 * Maps a backend `PaymentStatus` to one of five customer-facing visuals and its
 * copy. It has no React and no animation, so every mapping is unit-tested.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE LOAD-BEARING RULE: an animation is never proof of payment.
 *
 * The backend advances a payment to PAID only on a signature-verified gateway
 * webhook (Phase 11) — a client returning from the gateway's page proves
 * nothing. So the success visual is derived *only* from a server-reported
 * status of PAID, via {@link paymentVisualForServerStatus}. The path a client
 * takes when it returns from the gateway goes through
 * {@link visualAfterClientReturn}, which is hard-coded to "processing" no matter
 * what the client believes — the UI keeps waiting for the server to confirm.
 * These two entry points are deliberately separate so the rule is impossible to
 * bypass by accident.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { PAYMENT_STATUS, PaymentStatus } from '../../types/backend';

/** The five distinct states the payment view can show. */
export type PaymentVisual = 'processing' | 'success' | 'failed' | 'cancelled' | 'refunded';

/** Extra detail for a refund, since three backend statuses share the "refunded" visual. */
export type RefundDetail = 'pending' | 'partial' | 'full';

export interface PaymentView {
  visual: PaymentVisual;
  refundDetail?: RefundDetail;
  title: string;
  body: string;
  /** True when the view represents a settled outcome (stop the processing motion). */
  settled: boolean;
}

/**
 * The single source of truth for whether a payment has genuinely succeeded.
 *
 * Only a server-reported PAID counts. Nothing else — not a gateway redirect,
 * not a client SDK callback — may be treated as success.
 */
export function isPaymentProven(status: PaymentStatus): boolean {
  return status === PAYMENT_STATUS.PAID;
}

/**
 * Maps a server-reported payment status to the view.
 *
 * "Server-reported" is the operative word: callers pass the status they read
 * from the backend (`GET /customer/orders/:id/payment`), never a value the
 * gateway handed the client.
 */
export function paymentVisualForServerStatus(status: PaymentStatus): PaymentView {
  switch (status) {
    case PAYMENT_STATUS.PENDING:
    case PAYMENT_STATUS.AUTHORIZED:
      // Authorized is not captured — from the customer's view, still processing.
      return {
        visual: 'processing',
        title: 'Confirming your payment',
        body: 'Hang tight — we’re confirming this with your bank.',
        settled: false,
      };
    case PAYMENT_STATUS.PAID:
      return {
        visual: 'success',
        title: 'Payment confirmed',
        body: 'Your payment went through and your order is on its way to the kitchen.',
        settled: true,
      };
    case PAYMENT_STATUS.FAILED:
      return {
        visual: 'failed',
        title: 'Payment failed',
        body: 'We couldn’t take payment. No money has left your account — please try again.',
        settled: true,
      };
    case PAYMENT_STATUS.CANCELLED:
      return {
        visual: 'cancelled',
        title: 'Payment cancelled',
        body: 'This payment was cancelled. You can try again whenever you’re ready.',
        settled: true,
      };
    case PAYMENT_STATUS.REFUND_PENDING:
      return {
        visual: 'refunded',
        refundDetail: 'pending',
        title: 'Refund on the way',
        body: 'Your refund has been started and will reach you shortly.',
        settled: false,
      };
    case PAYMENT_STATUS.PARTIALLY_REFUNDED:
      return {
        visual: 'refunded',
        refundDetail: 'partial',
        title: 'Partially refunded',
        body: 'Part of this order has been refunded to your original payment method.',
        settled: true,
      };
    case PAYMENT_STATUS.REFUNDED:
      return {
        visual: 'refunded',
        refundDetail: 'full',
        title: 'Refunded',
        body: 'This order has been fully refunded to your original payment method.',
        settled: true,
      };
    default:
      // Unknown/future status: never guess success. Show processing and keep
      // waiting for a status we understand — a safe, non-crashing default.
      return {
        visual: 'processing',
        title: 'Confirming your payment',
        body: 'Hang tight — we’re confirming your payment.',
        settled: false,
      };
  }
}

/**
 * The view to show the instant a client returns from the gateway's hosted page.
 *
 * Always "processing", by design. The client cannot know the true outcome yet;
 * only the backend, via a verified webhook, can. The UI polls the server and
 * then switches to {@link paymentVisualForServerStatus}. This function exists so
 * that rule is written down as code, not left to a caller's discipline.
 */
export function visualAfterClientReturn(): PaymentView {
  return {
    visual: 'processing',
    title: 'Finalising your payment',
    body: 'We’re confirming your payment with the bank. This only takes a moment.',
    settled: false,
  };
}
