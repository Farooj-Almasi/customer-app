import { render } from '@testing-library/react-native';
import React from 'react';

import { OrderStatusTracker } from '../../src/features/order/OrderStatusTracker';
import { PaymentStateView } from '../../src/features/payment/PaymentStateView';
import { MotionProvider } from '../../src/motion';
import { ORDER_STATUS, ORDER_TYPE, OrderStatus, PAYMENT_STATUS, PaymentStatus } from '../../src/types/backend';

const wrap = (ui: React.ReactElement) => render(<MotionProvider>{ui}</MotionProvider>);

const ALL_ORDER = Object.values(ORDER_STATUS) as OrderStatus[];
const ALL_PAYMENT = Object.values(PAYMENT_STATUS) as PaymentStatus[];

describe('OrderStatusTracker (mount)', () => {
  it('renders every order status and both order types without throwing', () => {
    for (const type of [ORDER_TYPE.DELIVERY, ORDER_TYPE.PICKUP]) {
      for (const status of ALL_ORDER) {
        expect(() => wrap(<OrderStatusTracker status={status} type={type} />).unmount()).not.toThrow();
      }
    }
  });

  it('shows the current status label as readable text', () => {
    // "Preparing" appears both in the status chip and as the active node label.
    const { getAllByText } = wrap(<OrderStatusTracker status={ORDER_STATUS.PREPARING} />);
    expect(getAllByText('Preparing').length).toBeGreaterThanOrEqual(1);
  });

  it('exposes the state to assistive tech via an accessibility label', () => {
    const { getByLabelText } = wrap(<OrderStatusTracker status={ORDER_STATUS.OUT_FOR_DELIVERY} />);
    // The pure model's sentence is surfaced on the container.
    expect(getByLabelText(/on the way/i)).toBeTruthy();
  });
});

describe('PaymentStateView (mount)', () => {
  it('renders every payment status without throwing', () => {
    for (const status of ALL_PAYMENT) {
      expect(() => wrap(<PaymentStateView status={status} />).unmount()).not.toThrow();
    }
  });

  it('shows the success message only for a server-reported PAID', () => {
    const paid = wrap(<PaymentStateView status={PAYMENT_STATUS.PAID} />);
    expect(paid.getByText('Payment confirmed')).toBeTruthy();
    paid.unmount();

    // Pending must NOT show success copy — the animation never front-runs truth.
    const pending = wrap(<PaymentStateView status={PAYMENT_STATUS.PENDING} />);
    expect(pending.queryByText('Payment confirmed')).toBeNull();
    expect(pending.getByText('Confirming your payment')).toBeTruthy();
  });

  it('distinguishes failure and refund copy', () => {
    expect(wrap(<PaymentStateView status={PAYMENT_STATUS.FAILED} />).getByText('Payment failed')).toBeTruthy();
    expect(wrap(<PaymentStateView status={PAYMENT_STATUS.REFUNDED} />).getByText('Refunded')).toBeTruthy();
  });
});
