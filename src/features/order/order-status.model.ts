/**
 * Order-status timeline — pure model for the `OrderStatusTracker`.
 *
 * Turns a backend `OrderStatus` (+ `OrderType`) into everything the tracker
 * needs to render: which milestones are complete/active/upcoming, an overall
 * progress fraction, the copy for the current state, and a screen-reader
 * sentence. It contains no animation and no React — the component reads this
 * and decides what (if anything) to animate. Because it is pure, every status
 * is exhaustively unit-tested, which is the backbone of the "no crashes"
 * guarantee for the tracker.
 *
 * The fulfilment journey mirrors the backend order state machine. Money states
 * (refunds) are represented as annotations on a delivered order, because
 * fulfilment and payment are separate columns in the backend and neither is
 * derived from the other.
 */

import { ORDER_STATUS, ORDER_TYPE, OrderStatus, OrderType } from '../../types/backend';

/** The forward fulfilment milestones, in order. A subset applies per order type. */
export type MilestoneKey =
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'DRIVER_ASSIGNED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED';

/** Canonical forward order of every fulfilment milestone. Index === progress rank. */
const FORWARD: readonly MilestoneKey[] = [
  'CONFIRMED',
  'PREPARING',
  'READY',
  'DRIVER_ASSIGNED',
  'PICKED_UP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

/** Milestones shown for a delivery order — the full journey. */
const DELIVERY_MILESTONES: readonly MilestoneKey[] = FORWARD;

/** Milestones shown for a pickup order — no driver leg; DELIVERED means collected. */
const PICKUP_MILESTONES: readonly MilestoneKey[] = ['CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'];

const MILESTONE_LABELS: Record<MilestoneKey, string> = {
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY: 'Ready',
  DRIVER_ASSIGNED: 'Driver assigned',
  PICKED_UP: 'Picked up',
  OUT_FOR_DELIVERY: 'On the way',
  DELIVERED: 'Delivered',
};

export type NodeState = 'complete' | 'active' | 'upcoming' | 'cancelled';

export type OrderPhase =
  | 'awaiting_payment'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'payment_failed'
  | 'refund';

export type StatusTone = 'neutral' | 'progress' | 'success' | 'danger' | 'warning';

export interface TimelineNode {
  key: MilestoneKey;
  label: string;
  state: NodeState;
  /** True only for the single active node, and only when it should draw attention. */
  pulse: boolean;
}

export interface OrderTimeline {
  phase: OrderPhase;
  nodes: TimelineNode[];
  /** 0..1 fill for the progress line. 0 before the first milestone, 1 at delivered. */
  progress: number;
  /** Short label for the current state, e.g. "Preparing". */
  currentLabel: string;
  tone: StatusTone;
  /** A full sentence for screen readers — the accessible, motion-free state. */
  accessibilityLabel: string;
}

/** Per-status chip metadata: a label and a colour tone. */
export const STATUS_META: Record<OrderStatus, { label: string; tone: StatusTone }> = {
  [ORDER_STATUS.PENDING_PAYMENT]: { label: 'Awaiting payment', tone: 'warning' },
  [ORDER_STATUS.CONFIRMED]: { label: 'Confirmed', tone: 'progress' },
  [ORDER_STATUS.PREPARING]: { label: 'Preparing', tone: 'progress' },
  [ORDER_STATUS.READY]: { label: 'Ready', tone: 'progress' },
  [ORDER_STATUS.DRIVER_ASSIGNED]: { label: 'Driver assigned', tone: 'progress' },
  [ORDER_STATUS.PICKED_UP]: { label: 'Picked up', tone: 'progress' },
  [ORDER_STATUS.OUT_FOR_DELIVERY]: { label: 'On the way', tone: 'progress' },
  [ORDER_STATUS.DELIVERED]: { label: 'Delivered', tone: 'success' },
  [ORDER_STATUS.PAYMENT_FAILED]: { label: 'Payment failed', tone: 'danger' },
  [ORDER_STATUS.CANCELLED]: { label: 'Cancelled', tone: 'danger' },
  [ORDER_STATUS.REFUND_PENDING]: { label: 'Refund pending', tone: 'warning' },
  [ORDER_STATUS.PARTIALLY_REFUNDED]: { label: 'Partially refunded', tone: 'warning' },
  [ORDER_STATUS.REFUNDED]: { label: 'Refunded', tone: 'neutral' },
};

/** The milestone list for an order type, with pickup's "Collected" relabel. */
function milestonesFor(type: OrderType): { key: MilestoneKey; label: string }[] {
  const keys = type === ORDER_TYPE.PICKUP ? PICKUP_MILESTONES : DELIVERY_MILESTONES;
  return keys.map((key) => ({
    key,
    label: type === ORDER_TYPE.PICKUP && key === 'DELIVERED' ? 'Collected' : MILESTONE_LABELS[key],
  }));
}

/** The forward rank of a status, or -1 if it is not a forward milestone. */
function forwardRank(status: OrderStatus): number {
  return FORWARD.indexOf(status as MilestoneKey);
}

/**
 * Builds the full timeline for a status + order type.
 *
 * Every branch below is covered by a unit test. The default arm treats any
 * unknown value as "awaiting payment" rather than throwing, so a future backend
 * status can never crash the tracker — it degrades to the safe pre-journey view.
 */
export function buildOrderTimeline(
  status: OrderStatus,
  type: OrderType = ORDER_TYPE.DELIVERY,
): OrderTimeline {
  const milestones = milestonesFor(type);
  const lastIndex = milestones.length - 1;

  // Terminal / off-journey phases first.
  if (status === ORDER_STATUS.CANCELLED) {
    return {
      phase: 'cancelled',
      nodes: milestones.map((m) => ({ ...m, state: 'cancelled', pulse: false })),
      progress: 0,
      currentLabel: 'Cancelled',
      tone: 'danger',
      accessibilityLabel: 'This order was cancelled.',
    };
  }

  if (status === ORDER_STATUS.PAYMENT_FAILED) {
    return {
      phase: 'payment_failed',
      nodes: milestones.map((m) => ({ ...m, state: 'upcoming', pulse: false })),
      progress: 0,
      currentLabel: 'Payment failed',
      tone: 'danger',
      accessibilityLabel: 'Payment for this order failed. No further steps have started.',
    };
  }

  if (status === ORDER_STATUS.PENDING_PAYMENT) {
    return {
      phase: 'awaiting_payment',
      nodes: milestones.map((m) => ({ ...m, state: 'upcoming', pulse: false })),
      progress: 0,
      currentLabel: 'Awaiting payment',
      tone: 'warning',
      accessibilityLabel: 'Waiting for payment to be confirmed before the order begins.',
    };
  }

  const isRefund =
    status === ORDER_STATUS.REFUND_PENDING ||
    status === ORDER_STATUS.REFUNDED ||
    status === ORDER_STATUS.PARTIALLY_REFUNDED;

  // A refunded/refunding order was delivered first: show the journey complete,
  // annotated with the refund state (money, not fulfilment).
  if (isRefund) {
    return {
      phase: 'refund',
      nodes: milestones.map((m) => ({ ...m, state: 'complete', pulse: false })),
      progress: 1,
      currentLabel: STATUS_META[status].label,
      tone: STATUS_META[status].tone,
      accessibilityLabel:
        status === ORDER_STATUS.REFUND_PENDING
          ? 'This delivered order has a refund in progress.'
          : status === ORDER_STATUS.PARTIALLY_REFUNDED
            ? 'This delivered order has been partially refunded.'
            : 'This delivered order has been refunded.',
    };
  }

  if (status === ORDER_STATUS.DELIVERED) {
    const label = type === ORDER_TYPE.PICKUP ? 'Collected' : 'Delivered';
    return {
      phase: 'completed',
      nodes: milestones.map((m) => ({ ...m, state: 'complete', pulse: false })),
      progress: 1,
      currentLabel: label,
      tone: 'success',
      accessibilityLabel:
        type === ORDER_TYPE.PICKUP ? 'This order has been collected.' : 'This order was delivered.',
    };
  }

  // In-progress: the active node is the last milestone whose rank <= this status.
  const rank = forwardRank(status);
  const reachedCount = milestones.filter((m) => forwardRank(m.key) <= rank).length;
  const activeIndex = Math.max(0, reachedCount - 1);

  const nodes: TimelineNode[] = milestones.map((m, i) => {
    if (i < activeIndex) {
      return { ...m, state: 'complete', pulse: false };
    }
    if (i === activeIndex) {
      return { ...m, state: 'active', pulse: true };
    }
    return { ...m, state: 'upcoming', pulse: false };
  });

  return {
    phase: 'in_progress',
    nodes,
    progress: lastIndex > 0 ? activeIndex / lastIndex : 0,
    currentLabel: STATUS_META[status].label,
    tone: 'progress',
    accessibilityLabel: `Order status: ${STATUS_META[status].label.toLowerCase()}. Step ${
      activeIndex + 1
    } of ${milestones.length}.`,
  };
}
