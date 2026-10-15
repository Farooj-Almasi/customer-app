import {
  isPaymentProven,
  paymentVisualForServerStatus,
  visualAfterClientReturn,
} from '../../src/features/payment/payment-state.model';
import { PAYMENT_STATUS, PaymentStatus } from '../../src/types/backend';

const ALL_STATUSES = Object.values(PAYMENT_STATUS) as PaymentStatus[];

describe('payment-state model', () => {
  it('treats only a server-reported PAID as proven payment', () => {
    for (const status of ALL_STATUSES) {
      expect(isPaymentProven(status)).toBe(status === PAYMENT_STATUS.PAID);
    }
  });

  it('shows the success visual ONLY for PAID — never for any other status', () => {
    for (const status of ALL_STATUSES) {
      const view = paymentVisualForServerStatus(status);
      if (status === PAYMENT_STATUS.PAID) {
        expect(view.visual).toBe('success');
        expect(view.settled).toBe(true);
      } else {
        expect(view.visual).not.toBe('success');
      }
    }
  });

  it('always shows "processing" when the client returns from the gateway', () => {
    // The client cannot prove success; the UI keeps waiting for the server.
    const view = visualAfterClientReturn();
    expect(view.visual).toBe('processing');
    expect(view.settled).toBe(false);
  });

  it('maps pending and authorized to a non-settled processing state', () => {
    for (const status of [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.AUTHORIZED]) {
      const view = paymentVisualForServerStatus(status);
      expect(view.visual).toBe('processing');
      expect(view.settled).toBe(false);
    }
  });

  it('distinguishes failed and cancelled as settled, retryable outcomes', () => {
    expect(paymentVisualForServerStatus(PAYMENT_STATUS.FAILED)).toMatchObject({
      visual: 'failed',
      settled: true,
    });
    expect(paymentVisualForServerStatus(PAYMENT_STATUS.CANCELLED)).toMatchObject({
      visual: 'cancelled',
      settled: true,
    });
  });

  it('maps the three refund statuses to the refunded visual with the right detail', () => {
    expect(paymentVisualForServerStatus(PAYMENT_STATUS.REFUND_PENDING)).toMatchObject({
      visual: 'refunded',
      refundDetail: 'pending',
      settled: false,
    });
    expect(paymentVisualForServerStatus(PAYMENT_STATUS.PARTIALLY_REFUNDED)).toMatchObject({
      visual: 'refunded',
      refundDetail: 'partial',
      settled: true,
    });
    expect(paymentVisualForServerStatus(PAYMENT_STATUS.REFUNDED)).toMatchObject({
      visual: 'refunded',
      refundDetail: 'full',
      settled: true,
    });
  });

  it('gives every mapping non-empty copy', () => {
    for (const status of ALL_STATUSES) {
      const view = paymentVisualForServerStatus(status);
      expect(view.title.length).toBeGreaterThan(0);
      expect(view.body.length).toBeGreaterThan(0);
    }
  });
});
