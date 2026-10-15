import { buildOrderTimeline, STATUS_META } from '../../src/features/order/order-status.model';
import { ORDER_STATUS, ORDER_TYPE, OrderStatus } from '../../src/types/backend';

const ALL_STATUSES = Object.values(ORDER_STATUS) as OrderStatus[];

describe('buildOrderTimeline', () => {
  it('never throws and always returns a valid shape for every status', () => {
    for (const type of [ORDER_TYPE.DELIVERY, ORDER_TYPE.PICKUP]) {
      for (const status of ALL_STATUSES) {
        const t = buildOrderTimeline(status, type);
        expect(t.nodes.length).toBeGreaterThan(0);
        expect(t.progress).toBeGreaterThanOrEqual(0);
        expect(t.progress).toBeLessThanOrEqual(1);
        expect(t.accessibilityLabel.length).toBeGreaterThan(0);
        expect(t.currentLabel.length).toBeGreaterThan(0);
        // At most one node is ever active, and pulse only ever marks the active one.
        expect(t.nodes.filter((n) => n.state === 'active').length).toBeLessThanOrEqual(1);
        for (const node of t.nodes) {
          if (node.pulse) {
            expect(node.state).toBe('active');
          }
        }
      }
    }
  });

  it('marks completed, active and upcoming nodes correctly mid-journey (delivery)', () => {
    const t = buildOrderTimeline(ORDER_STATUS.PREPARING, ORDER_TYPE.DELIVERY);
    expect(t.phase).toBe('in_progress');
    const node = (key: string) => t.nodes.find((n) => n.key === key);
    expect(node('CONFIRMED')).toMatchObject({ state: 'complete' });
    expect(node('PREPARING')).toMatchObject({ state: 'active', pulse: true });
    expect(node('READY')).toMatchObject({ state: 'upcoming' });
    expect(node('DELIVERED')).toMatchObject({ state: 'upcoming' });
    // Exactly one active, exactly one pulsing.
    expect(t.nodes.filter((n) => n.state === 'active')).toHaveLength(1);
    expect(t.nodes.filter((n) => n.pulse)).toHaveLength(1);
  });

  it('completes the whole journey when delivered', () => {
    const t = buildOrderTimeline(ORDER_STATUS.DELIVERED, ORDER_TYPE.DELIVERY);
    expect(t.phase).toBe('completed');
    expect(t.progress).toBe(1);
    expect(t.nodes.every((n) => n.state === 'complete')).toBe(true);
    expect(t.nodes.some((n) => n.pulse)).toBe(false);
  });

  it('uses a shorter, driver-free journey for pickup and relabels delivered', () => {
    const t = buildOrderTimeline(ORDER_STATUS.READY, ORDER_TYPE.PICKUP);
    expect(t.nodes).toHaveLength(4);
    expect(t.nodes.map((n) => n.key)).not.toContain('DRIVER_ASSIGNED');
    const collected = t.nodes.find((n) => n.key === 'DELIVERED');
    expect(collected?.label).toBe('Collected');
    expect(t.nodes.find((n) => n.key === 'READY')?.state).toBe('active');
  });

  it('treats pending payment as pre-journey with no active step', () => {
    const t = buildOrderTimeline(ORDER_STATUS.PENDING_PAYMENT, ORDER_TYPE.DELIVERY);
    expect(t.phase).toBe('awaiting_payment');
    expect(t.progress).toBe(0);
    expect(t.nodes.every((n) => n.state === 'upcoming')).toBe(true);
    expect(t.nodes.some((n) => n.pulse)).toBe(false);
  });

  it('represents cancellation as a distinct, motion-free terminal state', () => {
    const t = buildOrderTimeline(ORDER_STATUS.CANCELLED, ORDER_TYPE.DELIVERY);
    expect(t.phase).toBe('cancelled');
    expect(t.tone).toBe('danger');
    expect(t.progress).toBe(0);
    expect(t.nodes.every((n) => n.state === 'cancelled')).toBe(true);
    expect(t.nodes.some((n) => n.pulse)).toBe(false);
  });

  it('represents a failed payment without starting any step', () => {
    const t = buildOrderTimeline(ORDER_STATUS.PAYMENT_FAILED, ORDER_TYPE.DELIVERY);
    expect(t.phase).toBe('payment_failed');
    expect(t.progress).toBe(0);
    expect(t.nodes.every((n) => n.state === 'upcoming')).toBe(true);
  });

  it('shows refund states as a completed delivery annotated with the refund', () => {
    for (const status of [
      ORDER_STATUS.REFUND_PENDING,
      ORDER_STATUS.PARTIALLY_REFUNDED,
      ORDER_STATUS.REFUNDED,
    ]) {
      const t = buildOrderTimeline(status, ORDER_TYPE.DELIVERY);
      expect(t.phase).toBe('refund');
      expect(t.progress).toBe(1);
      expect(t.nodes.every((n) => n.state === 'complete')).toBe(true);
    }
  });

  it('advances progress monotonically through the delivery journey', () => {
    const journey: OrderStatus[] = [
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.PREPARING,
      ORDER_STATUS.READY,
      ORDER_STATUS.DRIVER_ASSIGNED,
      ORDER_STATUS.PICKED_UP,
      ORDER_STATUS.OUT_FOR_DELIVERY,
      ORDER_STATUS.DELIVERED,
    ];
    const progresses = journey.map((s) => buildOrderTimeline(s, ORDER_TYPE.DELIVERY).progress);
    for (let i = 1; i < progresses.length; i += 1) {
      expect(progresses[i]).toBeGreaterThan(progresses[i - 1] as number);
    }
    expect(progresses[0]).toBe(0);
    expect(progresses[progresses.length - 1]).toBe(1);
  });

  it('has chip metadata for every backend status', () => {
    for (const status of ALL_STATUSES) {
      expect(STATUS_META[status]).toBeDefined();
      expect(STATUS_META[status].label.length).toBeGreaterThan(0);
    }
  });
});
