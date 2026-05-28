# Almari — Claude working notes

## Supabase credentials

- **URL:** `https://smvyzzwzzrnznazygyqt.supabase.co`
- **Anon key:** `sb_publishable_IH7Mt3vHerSJtFFAkRmtNQ_A49HwtYV`
- **Service role key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdnl6end6enJuem5henlneXF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ0NjI5NiwiZXhwIjoyMDk1MDIyMjk2fQ.WS5IfnTA2DgmwKliQa-mtINmXpKo4GyCYxm3zve-qeo`
- **Personal access token (CLI / Management API):** not stored in repo — ask the user to provide it when needed (format: `sbp_...`)

Use the service role key for any DB writes (bypasses RLS). Use the anon key for reads only. Use the personal access token with `npx supabase` CLI or the Management API (`https://api.supabase.com/v1/projects/smvyzzwzzrnznazygyqt/...`). Never write these to a file on disk — pass inline in curl commands.

## Phase 3 reminder — postage restoration
When Stripe + Sendcloud are added (Phase 3), restore the full postage selection flow (package band picker, service cards, underinsured warning, postage price on listing/confirm/order detail). The complete pre-simplification implementation is tagged in git: **`pre-postage-simplification`** (commit 7c28f91). Reference those 8 files: `store/listing-draft.ts`, `app/list/step-2.tsx`, `app/list/review.tsx`, `hooks/useListingDetail.ts`, `types/listing-detail.ts`, `app/listing/[id].tsx`, `app/transaction/new/confirm.tsx`, `app/transaction/[id]/buyer.tsx` + `seller.tsx`.

---

## Tonight's task list

All done. Focus is now Phase 1 — Get to TestFlight.

---

## Pending build plan

### Phase 1 — Get to TestFlight
- [x] P1: Fix pre-existing TypeScript errors — `profile/index.tsx`, `_layout.tsx`, `list/review.tsx` (Supabase type-gen, `.insert()`/`.update()` returning `never`)
- [ ] P2: Set EAS secrets — `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] P3: Verify `eas.json` and `app.config.ts` — build profiles, bundle IDs, signing certs
- [ ] P4: EAS build iOS → TestFlight internal track
- [ ] P5: EAS build Android → Play Store internal testing track
- [x] P6: 3 remaining DB migrations — `listings.reserved_until`, `listings.parent_listing_id`, `transactions.cancellation_reason`, `trust_events` table + RLS policy

### Founder actions (not code)
- [ ] ICO registration — £40/year at ico.org.uk. Strictly required when processing personal data commercially. Pre-revenue with a small community may qualify for the £0 not-for-profit tier. Revisit when fees are introduced or user base grows materially.
- [x] Privacy Policy — written for offline model, live at almari.uk/privacy. Stripe-era version backed up at docs/stripe-era/privacy.html.
- [x] T&Cs — written for offline model, live at almari.uk/terms. Solicitor review when first revenue arrives. Stripe-era version backed up at docs/stripe-era/terms.html.
- [ ] Apple Developer account — $99/year. Required for TestFlight and App Store submission.
- [ ] Google Play Developer account — $25 one-time. Required for Play Store.

### Phase 2 — Offline transaction flow (no Stripe/Sendcloud at launch)
**Decision:** Launch without Stripe or Sendcloud. Buyers pay sellers directly (PayPal/Revolut/bank transfer). Sellers arrange their own postage. Stripe + Sendcloud slot in later as drop-in replacements — DB schema and screen flows are identical.

- [x] DB Step 1: Add `payment_reference`, `concern_raised_at`, `concern_reason`, `buyer_lost_confirmed_at`, `seller_lost_confirmed_at` to `transactions`; add `payment_instructions` to `user_profile`. RLS INSERT + UPDATE policies on transactions. DB trigger auto-reserves listing on transaction insert.
- [x] Step 2: S19 Payment details screen — seller enters PayPal/Revolut/bank details (`app/(app)/profile/bank-details.tsx` converted from stub)
- [x] Step 3: Buy Now flow — confirm screen (`app/transaction/new/confirm.tsx`) → creates transaction (`pending_payment`), generates `ALM-XXXXX` reference, navigates to payment instructions screen (`app/transaction/new/payment-instructions.tsx`). Listing detail hides Buy Now when status is `reserved`/`sold`. Feed invalidated on purchase.
- [x] Step 4: S22 My Purchases (`app/(app)/profile/purchases.tsx`) + My Sales (`app/(app)/profile/sales.tsx`) — list screens with status tabs, accessible from Profile → Orders
- [x] Step 5: S23 Order detail, buyer view (`app/transaction/[id]/buyer.tsx`) — status timeline, payment reminder, tracking, confirm received (opens 48h concern window), raise a concern nav
- [x] Step 6: S24 Order detail, seller view (`app/transaction/[id]/seller.tsx`) — confirm payment received, tracking entry + mark dispatched, dispatched/delivered/completed states
- [ ] Step 7: S25 Raise a concern (`app/transaction/[id]/concern.tsx`) — 3 reasons, confirmation step, sets status → `concern_open`, emails atulblal@gmail.com
- [ ] Step 8: S26 Lost in post (`app/transaction/[id]/lost-in-post.tsx`) — both parties confirm, status → `refunded`, manual Almari refund
- [ ] Step 9: Trust score events on completion — sale completed (+5), purchase completed (+3), concern upheld (−10)

### Phase 3 — Stripe + Sendcloud (post-launch, when transaction volume justifies it)
- [ ] S1: Replace payment instructions screen with Stripe payment sheet on S12
- [ ] S2: Stripe escrow — payment held on purchase, released after concern window closes
- [ ] S3: Stripe Connect onboarding — replaces `payment_instructions` free text in S19
- [ ] S4: Sendcloud — Royal Mail label generation, called from S24 dispatch screen
- [ ] S5: Exchange rate API — daily GBP/INR fetch for price context panel on S6
- [ ] S6: Price context panel on S6 — original INR price, replacement cost, benchmark comparisons
- [ ] T7: Resend transactional emails — order confirmation, dispatch, delivery, concern raised/resolved

### Phase 4 — Social sign-in
- [ ] A1: Apple Sign-In — `expo-apple-authentication` + Supabase Apple provider. Capture name on first sign-in only (Apple only sends it once).
- [ ] A2: Google Sign-In — `@react-native-google-signin/google-signin` + Supabase Google provider
- [ ] A3: Pre-fill name on `welcome.tsx` onboarding from social provider data

### Phase 5 — Complete the listing flow
- [x] L1: Why selling phrase — done. `why_selling_copy_id` saved to `listings`, tap-to-select cards in Step 1.
- [ ] L2: S18 Removal reason screen — post-launch (see backlog)
- [ ] L3: Removal score logic — post-launch (see backlog)
- [x] L4: Private seller motivation — confirmed built. `seller_motivation_type_id` saved to `listings`, full record written to `private_seller_motivation` table on submit.
- [ ] L5: Draft listing persistence — post-launch (see backlog)
- [x] L6: Sort options on S5 search — done. Sort bar: Newest / Price ↑ / Price ↓. `SortBy` type + `sortBy` filter in `useFeedListings`.

### Phase 6 — Kids measurement architecture
- [x] K1: Add `category_type TEXT ('women'|'men'|'kids')` to `categories` table + set values — done via Management API
- [x] K2: Add `age_from_years, age_to_years, height_from_cm, height_to_cm` to `listing_measurements` — done via Management API
- [ ] K3: Create `user_measurement_profiles` table (DB migration — see architecture notes below)
- [x] K4: Listing Step 2 — kids-aware measurement section (age range + height when Kids category selected)
- [x] K5: Add kids measurement fields to draft store
- [ ] K6: S21 rebuild as family profile manager — add/edit/delete profiles, adult + kids form modes, auto-migrate existing `user_profile` measurements to "Me" profile on first visit
- [ ] K7: Fits Me profile picker — "Shopping for: Me ▾" in home feed + search. Active profile in Zustand.
- [ ] K8: Update `utils/fit.ts` — kids fit logic. Labels: Fits now / Nearly there / Different size
- [x] K9 (partial): Kids listing detail shows "Size & age" with age range + height range. Full K9 (fit labels) needs K3/K6/K7/K8.

### Phase 7 — Profile completeness + polish
- [x] PR2: Payment details screen — `app/(app)/profile/bank-details.tsx` done. Seller enters PayPal/Revolut/bank details (offline model). Stripe Connect replaces this in Phase 3.
- [ ] PR3: Notifications screen — `app/(app)/notifications.tsx` currently blank → real (push notification history list)
- [x] PR4: S27 Seller public profile — done. `app/profile/[id].tsx` built. Seller row on listing detail is tappable. Shows: first name + diya tier colour, member since, completed sales count, active listings grid.
- [x] PR5: Empty states — design and implement all empty states per PRD table (feed, search, my listings, my purchases, seller profile)

---

## Architecture decisions (agreed 26 May 2025)

**Kids categories:** Split into Kids - Girls (id:3) and Kids - Boys (id:4). Done in DB. `category_type` column added and seeded — `women`/`men`/`kids`. App branches on `category_type`, never on name strings.

**Family measurement profiles:** New `user_measurement_profiles` table. Kids profiles: `age_years + height_cm`. Adult profiles: `bust/waist/hips/height`. Schema:
```sql
CREATE TABLE user_measurement_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_identity(id) NOT NULL,
    name TEXT NOT NULL,
    relation TEXT CHECK (relation IN ('self','partner','daughter','son','other')),
    age_group TEXT NOT NULL CHECK (age_group IN ('adult','kids')),
    age_years INT,
    bust_cm NUMERIC, chest_cm NUMERIC, waist_cm NUMERIC,
    hips_cm NUMERIC, height_cm NUMERIC, uk_shoe_size NUMERIC(4,1),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Listing cap:** Removed entirely. Trigger `enforce_listing_cap` and function `check_listing_cap` dropped from DB. Anti-vendor protection via provenance + trust system.

**Social sign-in:** Apple + Google only. Facebook dropped. Native `signInWithIdToken` path — not web OAuth redirect.

**Fits Me kids labels:** Fits now / Nearly there / Different size. Not "Quick pin / Quick stitch" (adult tailoring concepts).

**Listing free text:** Keep `additional_notes` as free text — it's the escape valve for colour nuance, fabric detail, alterations. Add hint placeholder: *"Colour not quite right? Describe the fabric or embroidery detail. Any alterations? Worn for a specific occasion?"*. 500 character limit. No profanity filter at launch — revisit at scale. Heirloom story stays as free prose (already gated behind isHeirloom toggle).

**Fees:** Zero at launch — no transaction fee, no buyer protection fee. Attracts both sides of the marketplace. Introduce fees once liquidity is established. Promoted listings / subscriptions to be processed via web (Stripe) not in-app, to avoid Apple's 30% cut.

**Image optimisation:** Supabase CDN render endpoint — `/render/image/public/` with `?width=X&quality=Y`. Feed cards: 400px/75. Detail carousel: 800px/85.

---

## How to work with me

**Think like an architect before writing a single line of code.**
When a new feature or change is requested, reason about the full system impact first — auth, data model, UI flows, edge cases — then agree the approach with the user before implementing. Patchy solutions that fight the framework (e.g. deferred email verification fighting Supabase's native confirm-email flow) create compounding debt. One clean design is worth ten iterative patches.

**One screen at a time.** Agree the plan. Build. Test. Commit. Move on.

**Never hardcode what belongs in config.** Colours from theme tokens (`theme.*`), brand values from `constants/brand.ts`, scores and tiers from DB tables. No hex literals in components.

**Never show postage margin to anyone.** It is an internal number only.

**Trust score is a diya visual only — never show the number publicly.**

**Be proactive, not reactive.** At the start of each session, scan the backlog and flag blockers or dependencies the user hasn't seen yet. When a decision has downstream consequences (e.g. fee model → payment architecture, legal requirement → App Store submission blocker), connect those dots and surface them — don't wait to be asked. Tell the user what's missing. Lead with the gaps.

**Session rules (always apply):**
- Confirm the plan before building anything
- All colours via theme tokens — never hardcode hex
- Never show postage margin
- Trust score shown as diya/firework visual only, never as a raw number to buyers/sellers
- Merge all work to main at end of every session — never leave built code on a feature branch
- At the start of every session read CLAUDE.md, ALMARI_PRD.md and ALMARI_BACKLOG.md before doing anything else

---

## Tech stack

- React Native / Expo SDK 56, Expo Router (file-based)
- Supabase (auth + PostgREST) with typed client
- React Query v5 (`useQuery`, `useInfiniteQuery`)
- Zustand for auth + listing draft state
- expo-image for photos
- react-native-svg + react-native-reanimated v4 for animations
- @tabler/icons-react-native v3.44.0
- Stripe (payments + Connect for seller payouts)
- Sendcloud (Royal Mail label generation)
- Resend (transactional email)
- exchangerate-api.com (free daily GBP/INR rate)

---

## What is built

### Auth
- Email + password signup with inline OTP verification (`app/(auth)/register.tsx`)
- Supabase "Confirm email" is **ON** — OTP sent automatically on `signUp()`
- Sign-in catches "Email not confirmed" error, resends OTP inline — no stuck states
- SMTP: Gmail app password configured in Supabase (warn users to check spam)
- Biometric login: **backlog**

### Screens built
| Screen | File | Status |
|--------|------|--------|
| S1 — Welcome / landing | `app/(auth)/welcome.tsx` | Done |
| S2 — Onboarding (name, measurements) | `app/(auth)/welcome.tsx` | Done |
| S3 — Auth (register/sign-in + OTP) | `app/(auth)/register.tsx` | Done |
| S4 — Home feed | `app/(app)/index.tsx` | Done |
| S5 — Search | `app/(app)/search.tsx` | Done (text search + category/subcategory/occasion/colour/condition/pattern/work/fabric/budget/fits-me filters) |
| S6 — Listing detail | `app/listing/[id].tsx` | Done (seller row tappable → S27; kids listings show age/height range; 20-min reservation countdown when reserved; price context panel post-launch) |
| S7–S10 — Listing flow (4 steps) | `app/list/step-1,2,pricing,review.tsx` | Done (Step 2 kids-aware: shows age/height fields for kids categories) |
| S11 — Profile | `app/(app)/profile/index.tsx` | Done (KPI row at top: Listings / Purchases / Sales with live counts) |
| S19 — Payment details | `app/(app)/profile/bank-details.tsx` | Done (offline model — PayPal email/username + Revolut username, stored as JSON in `payment_instructions`. Strong F&F hint.) |
| S20 — My listings | `app/(app)/profile/my-listings.tsx` | Done (active / sold / removed tabs) |
| S21 — Measurements | `app/(app)/profile/measurements.tsx` | Done |
| S22 — My Purchases | `app/(app)/profile/purchases.tsx` | Done (Active / Done tabs) |
| S22 — My Sales | `app/(app)/profile/sales.tsx` | Done (New / In progress / Done tabs) |
| S23 — Order detail, buyer | `app/transaction/[id]/buyer.tsx` | Done (timeline, confirm received, raise concern nav) |
| S24 — Order detail, seller | `app/transaction/[id]/seller.tsx` | Done (confirm payment, tracking entry, dispatch) |
| Order confirm | `app/transaction/new/confirm.tsx` | Done (item summary + price, "Place order" creates transaction) |
| Payment instructions | `app/transaction/new/payment-instructions.tsx` | Done (PayPal + Revolut details, 20-min countdown, scarcity copy, F&F instruction box) |
| S25 — Raise a concern | `app/transaction/[id]/concern.tsx` | Stub — Step 7 |
| S26 — Lost in post | `app/transaction/[id]/lost-in-post.tsx` | Stub — Step 8 |
| S27 — Seller public profile | `app/profile/[id].tsx` | Done (diya, member since, listings grid) |

### Key components
- `components/listings/ListingCard.tsx` — feed card with press animation (Reanimated v4)
- `components/listings/PhotoCarousel.tsx` — horizontal paginated photo viewer
- `components/brand/FireworkTrust.tsx` — 4-pointed star trust visual (5 states)
- `components/brand/DiyaTrust.tsx` — exists but replaced by `IconCandleFilled` + `getDiyaColour()` everywhere

### Key hooks / utils
- `hooks/useTrustTiers.ts` — fetches `trust_tiers` from DB; exports `getDiyaColour`, `getMaxTrustScore`
- `hooks/useListingDetail.ts` — full S6 data query
- `utils/trust.ts` — `computeTrust`, `getStateLabel` (shared between pricing and review)
- `utils/fit.ts` — `getFitLabel` (compares buyer measurements to listing)

---

## Known bugs / DB tasks outstanding

### Outstanding pre-launch items
- **CRASH: Listing detail — Rules of Hooks violation** — `app/listing/[id].tsx` lines 160–168: `useState` + `useEffect` for the reservation countdown are placed after the `if (isLoading)` and `if (error || !listing)` early returns. React detects a different hook count between renders (8 hooks while loading, 10 once data arrives) and crashes. Fix: move both hooks to the top of the component before any early return. Introduced in commit `60e8918`.
- **Splash: "ALMARI" renders as "ALMAR"** — `app/(auth)/index.tsx` `wordmark` style has `letterSpacing: 8` but no `paddingRight: 8` to compensate. React Native does not include trailing letter-spacing in a Text component's layout bounds, so the 'I' is clipped. Compounded by `hero` having `alignItems: 'center'` which sizes Text to content width. Fix: add `paddingRight: 8` (= letterSpacing) and `textAlign: 'center'` to `wordmark`.
- **Splash: mixed text alignment** — `app/(auth)/index.tsx`: `logoTagline` has `textAlign: 'center'` but `wordmark` (line 211), `scriptTagline` (line 226), `slideTitle` (line 244), and `slideBody` (line 250) do not. Slide texts are visibly left-aligned because their container has a fixed `width: SLIDE_W`. Fix: add `textAlign: 'center'` to all four.
- **Splash: "Get started" button shows only "Get"** — `app/(auth)/index.tsx`: probable cause is the horizontal `ScrollView` in `slideArea` having no explicit width/flex, causing parent flex width calculations to cascade incorrectly to `ctas` and `btnPrimary`. Fix: add `style={{ flex: 1 }}` to the horizontal ScrollView and/or `alignSelf: 'stretch'` to `btnPrimary`. Needs a screenshot to confirm exact visual before fixing.
- **S25 Raise a concern** — `app/transaction/[id]/concern.tsx` is a stub. 3 permitted grounds, confirmation step, sets status → `concern_open`, emails atulblal@gmail.com.
- **S26 Lost in post** — `app/transaction/[id]/lost-in-post.tsx` is a stub. Both parties confirm, status → `refunded`.
- **Step 9: Trust events** — sale completed (+5), purchase completed (+3), concern upheld (−10). No trust_events rows written yet.
- **Buy Now guard** — disable Buy Now if seller has no payment details set (`payment_instructions IS NULL`).
- **GDPR delete account** — required before App Store submission.

---

## Navigation

- Tab navigator: Feed (`/`), Search (`/search`), Sell (`/sell`), Profile (`/profile`)
- Stack transitions: `animation: 'slide_from_right'` set globally in `app/_layout.tsx`
- Auth guard in `app/_layout.tsx`: session + identity present → app, else → auth

---

## Theme

- Light/dark via `hooks/useTheme.ts` + `constants/theme.ts`
- Key tokens: `theme.accent`, `theme.accentText`, `theme.background`, `theme.surface`, `theme.border`, `theme.borderFocused`, `theme.text`, `theme.textSecondary`, `theme.textDisabled`, `theme.inputBackground`, `theme.gold`, `theme.error`, `theme.success`, `theme.searchSurface`
- Brand: `constants/brand.ts` — `Brand.name`, `Brand.secondaryColour` (gold `#DDB86C`), `Brand.email`
