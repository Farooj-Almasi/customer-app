# Motion & Animation Design System

The motion language for the Farooj Almasi platform. It is defined once, here and
in code (`src/motion/`), and is meant to read as **one system** across all four
apps — `customer-app` (this repo, the reference implementation), `admin-app`,
`driver-app` and `kitchen-pos`.

Animation here has one job: **improve usability and communicate state.** Nothing
animates for decoration. Every component in this system documents the purpose of
its motion in its own source.

---

## 1. Principles

**Use**

- Subtle scale, opacity and translation — the three cheap, smooth transforms.
- Spring physics for anything that responds to touch or "lands" (press
  feedback, badges, sheets), tuned to settle with little to no overshoot.
- Shared-element / hero transitions where the platform supports them (a product
  image growing into its detail screen).
- Staggered entrances **sparingly** — short lists, first paint only, capped.
- Skeletons instead of spinners wherever a shape can be shown.

**Avoid**

- Excessive bouncing; long animations; anything that loops forever in the
  user's face; animation that blocks interaction; distracting effects;
  unnecessary page transitions.

**Timing discipline** — nothing hard-codes a duration. Every value comes from
the tokens below. The slowest thing a user waits on is `slow` (340 ms).

---

## 2. Tokens

The single source of truth is [`src/motion/tokens.ts`](../src/motion/tokens.ts).
Do not introduce a second way of doing these.

### Duration (ms)

| Token | Value | Use |
| --- | --- | --- |
| `instant` | 0 | State swap with no tween; the reduced-motion fallback. |
| `fast` | 120 | Taps, badge pops, micro-feedback. |
| `normal` | 220 | Sheets, cards, most transitions. The default. |
| `slow` | 340 | Full-screen or celebratory moments. The hard ceiling. |

### Easing (cubic-bezier)

| Token | Curve | Use |
| --- | --- | --- |
| `standard` | (.2, 0, 0, 1) | General in-and-out. |
| `enter` | (0, 0, 0, 1) | Elements entering — fast in, gentle settle (decelerate). |
| `exit` | (.3, 0, 1, 1) | Elements leaving — gentle start, quick out (accelerate). |
| `emphasized` | (.2, 0, 0, 1) | Hero moments (paired with a longer duration). |

These are standard interaction curves, not any brand's proprietary set. The
same tuples feed React Native's `Easing.bezier(...)` here and CSS
`cubic-bezier(...)` in the web apps, so the feel matches everywhere.

### Brand colours

Sampled from the Farooj Almasi logo and held in
[`src/theme/theme.ts`](../src/theme/theme.ts):

| Role | Light | Note |
| --- | --- | --- |
| `primary` | `#E5178B` | The logo magenta — buttons, active states, the cart badge. |
| `secondary` | `#F47C20` | The shawarma/citrus orange — secondary accents. |
| `accent` | `#2E63A6` | The "for fast food" tagline blue. |

`onPrimary` is white. The dark theme brightens each brand colour slightly for
contrast on dark surfaces. The launch screen uses a fixed white background (the
logo artwork is on white) so it reads cleanly in both themes.

### Spring (Reanimated `withSpring`)

| Token | damping / stiffness / mass | Use |
| --- | --- | --- |
| `soft` | 20 / 180 / 1 | Cart badge, toggles, small state changes. |
| `standard` | 26 / 240 / 1 | Cards, sheets, list items. The default. |
| `emphasized` | 18 / 300 / 1 | Add-to-cart, payment success. Low overshoot. |

Damping is deliberately high relative to stiffness so springs **settle** rather
than wobble. The brief rejects excessive bounce.

Other tokens: `PRESS_SCALE` (0.96) for press feedback; `STAGGER_STEP` (40 ms)
and `STAGGER_MAX_ITEMS` (8) so a staggered list never becomes a slow cascade.

---

## 3. Runtime: `useMotion()`

A component never reads a raw token or the reduce-motion flag. It calls
[`useMotion()`](../src/motion/MotionProvider.tsx) and gets ready-to-use configs:

```tsx
const { timing, spring, ms, reduceMotion } = useMotion();

opacity.value = withTiming(1, timing('normal', 'enter'));
scale.value = withSpring(1, spring('emphasized'));
```

`MotionProvider` resolves the OS reduce-motion setting **once** at the top of
the tree and threads the effective configs down. Under reduced motion `timing`
returns zero-duration configs and `spring` returns an instant-settling config,
so the same call sites produce instant state changes with no branching.

`useMotion()` also works with no provider (returns motion-enabled defaults), so
a component is renderable in isolation — used by the component tests.

---

## 4. Reusable components

All exported from [`src/motion`](../src/motion/index.ts). Each documents its
purpose in-source.

| Component | Purpose |
| --- | --- |
| `PressableScale` | Immediate, physical touch feedback (small spring scale). |
| `FadeIn` | One-shot entrance (fade, optional slide). Runs once, never loops. |
| `Stagger` | Ordered entrance for a short list; capped so it never drags. |
| `Skeleton` | Loading placeholder in the content's shape — preferred over a spinner. |
| `BottomSheet` | Content rising over a dimmed backdrop for a focused sub-task. |
| `CartBadge` | Cart count with a single pop on change; absent at zero. |
| `QuantityStepper` | +/- control with an animated value. |
| `Toast` | Transient, non-blocking confirmation banner; auto-dismisses. |
| `EmptyState` / `ErrorState` | Calm, actionable dead-ends with a gentle entrance. |

### Hero components

**`OrderStatusTracker`** ([source](../src/features/order/OrderStatusTracker.tsx))
— a stepper driven entirely by the backend `order.status`. Its logic is a pure,
exhaustively tested model
([`order-status.model.ts`](../src/features/order/order-status.model.ts)) that
maps every status to complete/active/upcoming nodes, a progress fraction, copy
and a screen-reader sentence. Completed steps show a check; the active step is
ringed and gently pulses (the only motion, removed under reduced motion);
`CANCELLED` is a distinct dimmed terminal state. Pickup orders use a shorter,
driver-free journey. **It is fully legible with no animation** — colour, checks
and text carry the state.

**`PaymentStateView`** ([source](../src/features/payment/PaymentStateView.tsx))
— shows `processing / success / failed / cancelled / refunded`, each visually
distinct, from a pure model
([`payment-state.model.ts`](../src/features/payment/payment-state.model.ts)).

---

## 5. Order-tracking states

The tracker communicates the full journey. Statuses map 1:1 to the backend
`OrderStatus` enum:

```
PENDING_PAYMENT → CONFIRMED → PREPARING → READY
  → DRIVER_ASSIGNED → PICKED_UP → OUT_FOR_DELIVERY → DELIVERED

CANCELLED · PAYMENT_FAILED · REFUND_PENDING · REFUNDED · PARTIALLY_REFUNDED
```

- **Delivery** orders show all seven forward milestones.
- **Pickup** orders show `CONFIRMED → PREPARING → READY → Collected` (no driver
  leg).
- **Refund** states render the delivery complete, annotated with the refund —
  because fulfilment and payment are separate in the backend and neither is
  derived from the other.
- The tracker **works without animation** as a static, accessible state: the
  container carries one `accessibilityLabel` sentence and each node's state is
  shown by shape/colour/label, not motion.

---

## 6. Payment states

`PaymentStateView` distinguishes five states, mapped from the backend
`PaymentStatus`:

| Backend status | Visual |
| --- | --- |
| `PENDING`, `AUTHORIZED` | processing |
| `PAID` | success |
| `FAILED` | failed |
| `CANCELLED` | cancelled |
| `REFUND_PENDING` / `PARTIALLY_REFUNDED` / `REFUNDED` | refunded |

**The load-bearing rule: an animation is never proof of payment.** The success
visual is derived **only** from a server-reported `PAID`
(`paymentVisualForServerStatus`), and the path taken when a client returns from
the gateway (`visualAfterClientReturn`) is hard-coded to *processing* no matter
what the client believes. The UI keeps showing a calm "confirming" ring and
polls the backend; only a verified webhook (backend Phase 11) advances the
payment, and only then does success appear. This mirrors, and depends on, the
backend rule that client-side success is never trusted.

---

## 7. Screen-transition rules

Presets live in [`src/motion/transitions.ts`](../src/motion/transitions.ts):

| Preset | When |
| --- | --- |
| `push` | Forward navigation into a detail (lateral slide). |
| `modal` | A self-contained task — checkout, auth (rise from bottom). |
| `fade` | Quiet peer swaps (tab-like roots). |
| `none` | No transition; the reduced-motion form of all of the above. |

Reserve `push`/`modal` for genuine hierarchy changes; prefer `fade`/`none` for
peer changes. Avoid transitions that add nothing. Wire with
`screenTransition(preset, reduceMotion)` so reduced motion collapses to `none`
automatically (while `modal` keeps its presentation semantics).

---

## 8. Accessibility

Reduced motion is a **first-class gate**, not an afterthought
([`reduced-motion.ts`](../src/motion/reduced-motion.ts),
[`useReducedMotion.ts`](../src/motion/useReducedMotion.ts)). When the OS "reduce
motion" setting is on:

- Decorative motion is removed (entrance fades, the active-step pulse, the
  skeleton shimmer stop).
- Essential state changes still happen — instantly, or as a plain crossfade.
- Timed animations collapse to 0 ms and springs settle within a frame, at the
  same call sites, so nothing has to branch.
- The reduce-motion setting is read live and re-applies without a restart. The
  hook is fully defensive — if the platform can't report the setting it falls
  back to motion-enabled and never throws.

Every stateful component also exposes its meaning to assistive tech (the tracker
and payment view carry spoken labels), so the state survives with **no** motion
at all.

---

## 9. Performance

- Animations run on the **UI thread** via Reanimated worklets — the JS thread
  (and your renders) stay free. Values are driven by shared values, **not**
  React state, so animating does not re-render the tree.
- **No looping decoration.** The only repeating animations are the active-step
  pulse and skeleton shimmer, both of which stop under reduced motion, and
  neither blocks interaction.
- **Skeletons over spinners**; short, capped staggers over long cascades.
- No large animation assets — all motion is transforms and vector shapes
  (`react-native-svg`), nothing bundled.
- Long lists should virtualize (FlashList/FlatList) and use entrance animation
  sparingly, never per-row on scroll.
- Everything **degrades gracefully**: if animations are disabled or a platform
  call is unavailable, components render their final state and stay fully usable.

---

## 10. Testing & the "no crashes" guarantee

The correctness-critical logic is **pure and framework-free** — tokens,
reduced-motion resolution, the order-status model and the payment-state model
import nothing from React Native and are exhaustively unit-tested
(`npm test`, 27 tests). The view layer is typechecked (`npm run typecheck`) and
mount-tested under jest-expo (`npm run test:components`, 11 tests) to prove every
hero state and primitive renders without throwing. A change that breaks a state
mapping or a token invariant fails a test before it ships.

---

## 11. Cross-app consistency

The four apps do not share a runtime (six-repository architecture; apps talk
only to the backend API). They share this **specification** and the token
values:

- **customer-app / driver-app** (React Native): use `src/motion` as here.
- **admin-app / kitchen-pos** (React web): mirror the same duration/easing/spring
  numbers as CSS variables + Framer Motion variants, so the feel matches.

Per-app emphasis, from the brief:

- **customer-app** — the full expressive system (this document).
- **admin-app** — restrained: fast order/number/status transitions, modals,
  notifications, loading states. Never slow an administrative workflow.
- **driver-app** — usability first: clear cues for a new delivery, assignment,
  pickup and successful delivery; never delay an action behind an animation.
- **kitchen-pos** — minimal: a new-ticket cue and clear status changes on a
  glanceable screen; nothing decorative.

The canonical tokens are the four tables in §2. When mirroring into another app,
copy those values verbatim and keep this file the source of truth.

---

## 12. Examples

```tsx
// Press feedback — the most useful micro-animation in the app.
<PressableScale onPress={addToCart} style={styles.addButton}>
  <Text>Add to cart</Text>
</PressableScale>

// Loading a product list: skeletons in the content's shape, then a gentle
// staggered reveal of the real items.
{loading ? (
  <>
    <Skeleton height={120} radius={16} />
    <Skeleton width="60%" height={18} />
  </>
) : (
  <Stagger>{items.map((it) => <ProductRow key={it.id} item={it} />)}</Stagger>
)}

// Order tracking — one component, driven by the backend status.
<OrderStatusTracker status={order.status} type={order.type} />

// Payment — success shows ONLY when the server reports PAID.
<PaymentStateView status={payment.status /* from the backend */} />
```

See [`src/demo/MotionDemoScreen.tsx`](../src/demo/MotionDemoScreen.tsx) for a
living catalogue of every component and state.
