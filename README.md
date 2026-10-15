# customer-app

Farooj Almasi customer ordering app — **React Native (Expo)**.

Account & OTP login, branches, menu, cart, checkout, online payment, order
tracking, invoices, coupons, loyalty and notifications. It talks only to the
[backend](https://github.com/Farooj-Almasi/backend) API — it holds no business
rules and never computes a payable amount itself.

> **Current state:** working end-to-end ordering flow on the **Motion &
> Animation Design System**, themed to the Farooj Almasi brand. OTP login →
> branches → menu → cart → checkout → payment → live order tracking, wired to
> the backend API, with the two hero components (`OrderStatusTracker`,
> `PaymentStateView`) and the animated launch screen. Delivery addresses (needs
> the backend customer-address feature) and product add-on selection are the
> next additions; today checkout is pickup with a single tap-to-add menu.

---

## Quick start

**Requirements:** Node.js 20+, and the Expo tooling (installed via `npx`).

```bash
npm install
npm start          # Expo dev server — open in Expo Go or a simulator
# or: npm run ios / npm run android
```

The app currently renders the **motion demo** (`src/demo/MotionDemoScreen.tsx`)
— a living catalogue of every motion component and both hero components, with
controls to exercise their states. Toggle the OS "reduce motion" setting to see
the accessible, motion-free form of everything.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Expo dev server |
| `npm run typecheck` | TypeScript, no emit |
| `npm run lint` | ESLint |
| `npm test` | Pure-logic unit tests (tokens, reduced-motion, order/payment models) |
| `npm run test:components` | React Native component mount tests (jest-expo) |

---

## Architecture

```
src/
  motion/            # The motion system — tokens, hooks, reusable components
    tokens.ts        #   the single source of truth (durations, easings, springs)
    reduced-motion.ts#   accessibility gating (pure)
    MotionProvider   #   resolves reduce-motion once; exposes useMotion()
    transitions.ts   #   screen-transition presets
    components/      #   PressableScale, FadeIn, Stagger, Skeleton, BottomSheet,
                     #   CartBadge, QuantityStepper, Toast, EmptyState, ErrorState
  features/
    order/           # OrderStatusTracker + its pure, tested model
    payment/         # PaymentStateView + its pure, tested model
  theme/             # minimal design tokens (colours, spacing, radii)
  types/backend.ts   # backend enums, mirrored (kept in sync with the API)
  demo/              # the motion catalogue screen
docs/
  motion-design-system.md   # the full design system
```

### The "no crashes" approach

Correctness-critical logic (token math, reduced-motion gating, the
order-status and payment-state mappings) lives in **pure, framework-free
TypeScript** that is exhaustively unit-tested and imports nothing from React
Native. The React Native components are kept thin, are fully typechecked, and
are mount-tested to prove every state renders without throwing. See
[`docs/motion-design-system.md` §10](./docs/motion-design-system.md).

### Two rules this app inherits from the backend

1. **An animation is never proof of payment.** `PaymentStateView` shows success
   only for a server-reported `PAID`; a client returning from the gateway always
   shows "processing" and waits for the backend.
2. **Fulfilment and payment are separate.** The order tracker reflects
   `order.status`; refund states are shown as annotations on a delivered order,
   never derived from one another.

---

## Configuration

The API base URL comes from `app.json → expo.extra.apiBaseUrl` per environment.
**No secrets live in this repo** — the app holds no gateway credentials; all
payment secrets stay on the backend.

---

## Stack

Expo SDK 51 · React Native 0.74 · TypeScript · React Native Reanimated 3
(UI-thread animation) · react-native-svg · React Navigation · Jest (ts-jest +
jest-expo).
