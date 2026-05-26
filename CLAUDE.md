# Almari — Claude working notes

## Supabase credentials

- **URL:** `https://smvyzzwzzrnznazygyqt.supabase.co`
- **Anon key:** `sb_publishable_IH7Mt3vHerSJtFFAkRmtNQ_A49HwtYV`
- **Service role key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtdnl6end6enJuem5henlneXF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ0NjI5NiwiZXhwIjoyMDk1MDIyMjk2fQ.WS5IfnTA2DgmwKliQa-mtINmXpKo4GyCYxm3zve-qeo`

Use the service role key for any DB writes (bypasses RLS). Use the anon key for reads only. Never write these to a file on disk — pass inline in curl commands.

## Tonight's task list

- [ ] **Image optimisation** — Switch `ListingCard` and `PhotoCarousel` from raw Supabase Storage URLs to the CDN render endpoint with size/quality params. Feed cards: `?width=400&quality=75`. Detail carousel: `?width=800&quality=85`. One change per component, big real-world impact on slow devices.
- [ ] **S21 measurements screen** — Pull from Chromebook (push from there first). If not pushed, rebuild: editable adult measurements form, accessible from profile. Extract form from `welcome.tsx` into `components/profile/MeasurementsForm.tsx`, reuse in both.
- [ ] **Legal links** — Add "By creating an account you agree to our Terms & Conditions and Privacy Policy" (tappable links) to `register.tsx`. Add T&Cs, Privacy Policy, About Almari links to profile screen footer. Use placeholder URLs (`almari.uk/terms`, `almari.uk/privacy`, `almari.uk/values`) — swap for real pages before App Store submission. Required for Apple/Google approval.
- [ ] **almari.uk website** — Build via GitHub Pages. Create `/docs` folder in repo with HTML pages: home (landing), terms (paste from ALMARI_TERMS.md), privacy, values. Enable GitHub Pages in repo settings. Point GoDaddy DNS to GitHub (one CNAME record). All free.

---

## Pending build plan

### Phase 1 — Get to TestFlight
- [ ] P1: Fix pre-existing TypeScript errors — `profile/index.tsx`, `_layout.tsx`, `list/review.tsx` (Supabase type-gen, `.insert()`/`.update()` returning `never`)
- [ ] P2: Set EAS secrets — `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] P3: Verify `eas.json` and `app.config.ts` — build profiles, bundle IDs, signing certs
- [ ] P4: EAS build iOS → TestFlight internal track
- [ ] P5: EAS build Android → Play Store internal testing track

### Founder actions (not code)
- [ ] ICO registration — £40/year at ico.org.uk. Strictly required when processing personal data commercially. Pre-revenue with a small community may qualify for the £0 not-for-profit tier. Revisit when fees are introduced or user base grows materially.
- [ ] Privacy Policy — use Termly, customise data collection section to mention measurements, listing photos, provenance data. Host at almari.uk/privacy.
- [ ] T&Cs — founder-written based on PRD. All sales final, C2C platform, no consumer return rights, lost in post process. Host at almari.uk/terms. Solicitor review when first revenue arrives.
- [ ] Apple Developer account — $99/year. Required for TestFlight and App Store submission.
- [ ] Google Play Developer account — $25 one-time. Required for Play Store.

### Phase 2 — Social sign-in
- [ ] A1: Apple Sign-In — `expo-apple-authentication` + Supabase Apple provider. Capture name on first sign-in only (Apple only sends it once).
- [ ] A2: Google Sign-In — `@react-native-google-signin/google-signin` + Supabase Google provider
- [ ] A3: Pre-fill name on `welcome.tsx` onboarding from social provider data

### Phase 3 — Complete the listing flow
- [ ] L1: Why selling phrase — `why_selling_copy_id` already in `listings` schema, missing from draft store + Step 1 + review submit. Fetch from `micro_copy`, tap-to-select cards.
- [ ] L2: S21 as standalone editable screen (see tonight's list)

### Phase 4 — Kids measurement architecture
- [ ] K1: Add `category_type TEXT ('women'|'men'|'kids')` to `categories` table + set values (DB migration — needs Supabase SQL editor)
- [ ] K2: Add `age_from_years, age_to_years, height_from_cm, height_to_cm` to `listing_measurements` (DB migration)
- [ ] K3: Create `user_measurement_profiles` table (DB migration — see architecture notes below)
- [ ] K4: Listing Step 2 — kids-aware measurement section (age range + height when Kids category selected)
- [ ] K5: Add kids measurement fields to draft store
- [ ] K6: S21 rebuild as family profile manager — add/edit/delete profiles, adult + kids form modes, auto-migrate existing `user_profile` measurements to "Me" profile on first visit
- [ ] K7: Fits Me profile picker — "Shopping for: Me ▾" in home feed + search. Active profile in Zustand.
- [ ] K8: Update `utils/fit.ts` — kids fit logic. Labels: Fits now / Nearly there / Different size
- [ ] K9: Kids measurement display on listing detail

### Phase 5 — Profile completeness
- [ ] PR1: My listings screen — `app/(app)/profile/my-listings.tsx` stub → real. Active / sold / removed tabs.
- [ ] PR2: Bank details screen — `app/(app)/profile/bank-details.tsx` stub → real
- [ ] PR3: Notifications screen — `app/(app)/notifications.tsx` currently blank

---

## Architecture decisions (agreed 26 May 2025)

**Kids categories:** Split into Kids - Girls (id:3) and Kids - Boys (id:4). Done in DB. `category_type` column to be added so app branches on this, never on name strings.

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
