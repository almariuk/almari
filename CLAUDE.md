# Almari — Claude working notes

## Supabase credentials

- **URL:** `https://smvyzzwzzrnznazygyqt.supabase.co`
- **Anon key:** `sb_publishable_IH7Mt3vHerSJtFFAkRmtNQ_A49HwtYV`
- **Service role key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdnl6end6enJuem5henlneXF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ0NjI5NiwiZXhwIjoyMDk1MDIyMjk2fQ.WS5IfnTA2DgmwKliQa-mtINmXpKo4GyCYxm3zve-qeo`

Use the service role key for any DB writes (bypasses RLS). Use the anon key for reads only. Never write these to a file on disk — pass inline in curl commands.

## Tonight's task list

- [ ] **Image optimisation** — Switch `ListingCard` and `PhotoCarousel` from raw Supabase Storage URLs to the CDN render endpoint with size/quality params. Feed cards: `?width=400&quality=75`. Detail carousel: `?width=800&quality=85`. One change per component, big real-world impact on slow devices.

---

## How to work with me

**Think like an architect before writing a single line of code.**
When a new feature or change is requested, reason about the full system impact first — auth, data model, UI flows, edge cases — then agree the approach with the user before implementing. Patchy solutions that fight the framework (e.g. deferred email verification fighting Supabase's native confirm-email flow) create compounding debt. One clean design is worth ten iterative patches.

**One screen at a time.** Agree the plan. Build. Test. Commit. Move on.

**Never hardcode what belongs in config.** Colours from theme tokens (`theme.*`), brand values from `constants/brand.ts`, scores and tiers from DB tables. No hex literals in components.

**Never show postage margin to anyone.** It is an internal number only.

**Trust score is a diya visual only — never show the number publicly.**

**Session rules (always apply):**
- Confirm the plan before building anything
- All colours via theme tokens — never hardcode hex
- Never show postage margin
- Trust score shown as diya/firework visual only, never as a raw number to buyers/sellers

---

## Tech stack

- React Native / Expo SDK 56, Expo Router (file-based)
- Supabase (auth + PostgREST) with typed client
- React Query v5 (`useQuery`, `useInfiniteQuery`)
- Zustand for auth + listing draft state
- expo-image for photos
- react-native-svg + react-native-reanimated v4 for animations
- @tabler/icons-react-native v3.44.0

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
| S5 — Search | `app/(app)/search.tsx` | **Stub — next to build** |
| S6 — Listing detail | `app/listing/[id].tsx` | Done |
| S7–S10 — Listing flow (4 steps) | `app/list/step-1,2,pricing,review.tsx` | Done |
| S11 — Profile | `app/(app)/profile/index.tsx` | Done |
| S21 — Measurements | `app/(app)/profile/measurements.tsx` | **Not built** — extract form from `welcome.tsx` into `components/profile/MeasurementsForm.tsx`, reuse in both |
| Transaction screens | `app/transaction/[id]/*` | Stubs |
| My listings | `app/(app)/profile/my-listings.tsx` | Stub |
| Bank details | `app/(app)/profile/bank-details.tsx` | Stub |

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

### DB seed needed
- **Kids categories**: `categories` and `sub_categories` tables have no rows for the Kids gender. Replicate the Women/Men structure. Run in Supabase SQL editor:
  ```sql
  -- 1. Find the Kids gender ID
  SELECT id, name FROM genders WHERE name = 'Kids';
  -- 2. Copy category structure from Women (gender_id = X) to Kids (gender_id = Y)
  -- Insert matching rows into categories and sub_categories for Kids
  ```

### Pre-existing TypeScript errors (not caused by new code)
Supabase typed client infers `.insert()` / `.update()` return types as `never` in three files. These are a Supabase type-gen issue, not runtime bugs:
- `app/(app)/profile/index.tsx` lines ~214, 244, 261
- `app/_layout.tsx` line ~71
- `app/list/review.tsx` lines ~295–383
- `app/list/review.tsx` line ~12: `expo-file-system/next` missing types

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
