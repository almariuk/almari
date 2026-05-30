# Almari — Product Requirements Document
## Vision
Almari is a peer-to-peer community marketplace for Indian ethnic wear in the UK diaspora. Not a shop. Not a generic marketplace. A community exchange where real people pass clothes they genuinely own to people who will actually wear them.

**Name:** Almari — Hindi/Urdu for wardrobe
**Tagline:** From our cupboards to yours
**Domain:** almari.uk
**Email:** reachalmari@gmail.com
**Platform:** Mobile app only. iOS and Android. React Native via Expo.
**Geography:** UK only to start.

---

## The Soul
These clothes are not just clothes. A lehenga from Chandni Chowk bought with a mother in 2018. A sherwani that came back in a suitcase wrapped in tissue paper. A saree worn at a cousin's wedding in Jaipur. The seller may never go back to buy something like it again.

Almari is a cultural memory platform that happens to have a checkout button.

Every transaction is an act of cultural preservation. The provenance certificate Almari issues means every piece accumulates human history. A saree with three generations of diaspora stories is not a used garment. It is an artefact.

---

## The Rules — Never Break These
1. No vendors. No shops. No commercial sellers. Ever. Enforce actively.
2. ~~Maximum 20 active listings per seller at any time.~~ **Removed.** Listing cap trigger dropped from DB. Anti-vendor protection enforced via provenance + trust system, not a hard cap.
3. Royal Mail only for postage. No Evri, no DPD.
4. All sales final. No returns. Buy it knowing what you're buying.
5. Never show Almari's postage margin to anyone.
6. Never show the seller's private pricing tiers to the buyer.
7. No messaging between buyers and sellers. The listing is the contract.
8. No returns. If it doesn't fit — relist it. It already has provenance.
9. Buy now only at launch. No negotiation engine until v2.
10. Detailed listings only at launch. No quick list option yet.
11. The community is trusted by default. No public trust scores shown to others.
12. Everything configurable must come from database config tables. Nothing hardcoded in the app.

---

## Brand Voice
Warm. Cultural. Human. Never corporate. Never generic startup.

**Micro copy principles:**
- Two friends talking. Not a transaction.
- "Look, I have this. Do you want it?"
- These clothes deserve more than a bin bag.
- It came from India. Now it needs a new story.
- From our cupboards to yours.

**Language:** Mix of English and Hindi/Urdu in key moments. Warm not tokenistic.

**What Almari is not:** eBay. Vinted. A shop. A retailer. A returns service.

---

## The Competitor Context
**Circular Threads** — UK's first preloved South Asian fashion platform. Curated consignment model. Seller sends item, they photograph, list, sell, take 25-35% commission. Items dry cleaned before listing. Premium prices. High friction. Almari is peer to peer, community owned, much lower cost. Their existence validates the market.

**Vinted/eBay** — don't understand Indian ethnic wear. No provenance. No cultural intelligence. No community. Almari's differentiator is everything they lack.

---

## Revenue Model

### Phase 1 (live at launch)
- Free to list. Free to buy. Free to sell.
- No transaction fee. No postage margin. Attracts both sides of marketplace.
- Introduce fees once liquidity is established.

### Phase 2 (post-launch, when Sendcloud + Stripe are added)
- Postage margin — Almari charges buyer slightly above Royal Mail cost via Sendcloud. Difference is Almari's revenue.
- Relisting fee after third relist — small charge (£1 suggested), charged via Stripe.
- Promoted listings — seller pays to boost visibility. Post launch.

---

## Categories
**Women:** Saree, Lehenga set, Salwar kameez set, Anarkali set, Kurta, Dupatta, Blouse, Co-ord set, Sharara set, Gharara set, Indo western gown, Dress material, Footwear
**Men:** Sherwani set, Kurta pyjama set, Nehru jacket, Bandhgala suit, Jodhpuri suit, Indo western, Footwear
**Kids:** Girls ethnic wear, Boys ethnic wear, Kids footwear

Kids categories have `category_type = 'kids'` in DB. App branches on this field, never on name strings.

---

## Occasion Buckets (with bilingual descriptions)
1. **Grand Occasion** — Dulha / Dulhan. Shaadi ka joda. The most special outfit of your life.
2. **Wedding Functions** — Shaadi ke rangi. For the family and friends who make the celebrations.
3. **Festive** — Tyohaar. Diwali, Eid, Navratri, Karva Chauth. Time to shine.
4. **Religious and Puja** — Pooja aur mandir. Modest, traditional, respectful.
5. **Family and Social** — Ghar aur yaar. Gatherings, dinners, get togethers.
6. **Everyday** — Rozana. Beautiful, comfortable, yours.

---

## Condition Tiers
1. Brand new with tags. Never worn.
2. Bought new, never worn. Tags removed or lost.
3. I wore it once. It's basically new.
4. I've worn it a handful of times. Still beautiful.
5. It's been well loved.

---

## Style Lens (simplified, shown as thumbnails)
- Heavily worked — zari, sequins, mirrors, beading. The ones that catch the light.
- Printed — pattern on the fabric. Block print, floral, geometric.
- Embroidered — thread work, phulkari, chikankari, kantha.
- Simple and elegant — minimal, clean, lets the fabric do the talking.
- Handloom and craft — khadi, handwoven, artisan made.

---

## Fabric Types
DB-driven from `fabric_types` table (Rule 12 — nothing hardcoded). Already seeded and live in the listing flow. Values include: Silk, Georgette, Chiffon, Net, Velvet, Crepe, Organza, Brocade, Cotton, Handloom, Synthetic / Polyester, Linen, Satin, Other.

---

## Work Types (simplified)
- Zari and gold work
- Sequins and stones
- Mirror work
- Gota and ribbon
- Thread embroidery
- Handloom and craft
- No work

---

## Patterns (simplified)
- Printed
- Woven pattern
- Embroidered
- Bandhani and tie dye
- Kalamkari and hand painted
- Plain and solid

---

## Colours (31 swatches with Hindi names)
Bridal Red (Laal), Wine (Gehra Laal), Maroon, Burgundy, Coral (Moonga), Blush Pink (Gulabi), Rose Gold (Gulaabi Sona), Magenta (Rani Pink), Dusty Rose, Saffron (Kesariya), Yellow (Peela), Mustard (Sarson), Orange (Narangi), Peach (Aadu), Mehendi Green, Emerald (Zamurrud), Forest Green (Haraa), Peacock (Mor Neela), Teal (Firozi), Royal Blue (Shahi Neela), Navy (Gehra Neela), Sapphire (Neelam), Indigo (Neel), Purple (Baingani), Amethyst (Jamuni), Ivory (Malai), Champagne, White (Safed), Black (Kaala), Gold (Sona), Silver (Chandi)

---

## Why Selling Phrases (public, shown on listing)
1. It came from India. Now it needs a new story.
2. I just want it to go to a good home.
3. It was my mother's. Time to pass it on.
4. It's been well loved. Someone else should enjoy it.
5. Just give me something for it.
6. It deserves to be worn again.
7. My children will never wear it. Someone's should.

---

## Private Seller Motivations
**Removed from listing flow as of Phase 1.** Captured motivations were: Kids grew out of it | Moving house | Upgrading my wardrobe | It was a gift — never worn | Financial reasons | Emotional — ready to let go | Other.

Data is still used in post-launch intelligent seller intervention (see backlog). `private_seller_motivation` table remains in DB for future use but is no longer written at listing creation.

---

## Item Care Status (affects listing trust score)
1. Dry cleaned and packed — ready to wear (+10 trust points)
2. Freshly washed and pressed — ready to wear (+8 trust points)
3. Needs a clean or press before wearing (0 trust points)

---

## Trust System

### Seller Trust — The Diya
Visual: A flat diya outline. Fills from base to flame with warm amber-to-gold as trust increases. Never a number shown publicly. Internal only.

**Five tiers (only three visible at launch):**
1. Nayi Shuruwat (नयी शुरुआत) — Red diya. Score 0-20. New beginning.
2. Apna (अपना) — Bronze diya. Score 21-50. One of ours.
3. Bharosa (भरोसा) — Silver diya. Score 51-100. Trust. VISIBLE AT LAUNCH.
4. Izzat (इज़्ज़त) — Blue diya. Score 101-200. Respect. HIDDEN.
5. Aanch (आँच) — Gold diya. Score 201+. The flame itself. HIDDEN.

Mystery is intentional. Nobody knows how many tiers exist. Gold may never be announced.

**Trust score events (configured in DB, not hardcoded):**
Verification: email +2, address +3, measurements +2, bank details +3, phone +3
Activity: first listing +2, first purchase +2, sale completed +3, purchase completed +2, detailed listing +1, measurements on listing +1
Activity (post-launch): waitlist converted +2 (requires negotiation engine)
Behaviour: concern upheld −10, listing removed changed mind −2, listing removed sold elsewhere −5

*Currently wired in app: `sale_completed` (+3) and `purchase_completed` (+2) on every `completed` transition via DB trigger. Other events are in `trust_score_events` table and `trust_event_types` — to be wired incrementally.*

### Listing Trust — The Firework
Visual: A firework burst. Expands outward from centre as score increases. Low score = single spark. High score = full gold burst with silver outer sparks.

Five states: Just listed (spark) → Starting → Building → Strong → Brilliant

**Maximum listing trust score: 60.** Components and weights are DB-driven from `listing_trust_components` (see `utils/trust.ts`). Component breakdown is never shown to sellers — only the firework visual and total score.

Components that feed listing trust score: photos count, measurements completeness, provenance detail, condition accuracy, care status, set completeness, why selling filled, additional notes.

---

## Pricing Intelligence

### Price Context Panel — Phase 2 (deferred, not built at launch)
- What the seller paid: original price + currency + GBP equivalent at today's rate
- Current replacement cost shipped from India: from benchmark_prices table + delivery + customs estimate
- "Selling X% below replacement cost" — calculated automatically
- What you'd pay elsewhere: UK vendor Leicester/Birmingham, UK vendor London, shipped from India, brand new in India

The provenance form captures original price and currency (GBP/INR/USD etc.). Exchange rate data is in `daily_exchange_rates` table. Price context panel display is deferred to Phase 2.

### Benchmark Data Sources
- Myntra — scraped monthly. Mid market India pricing.
- Ajio — scraped monthly. Premium India pricing.
- Nalli — scraped monthly. Premium silk sarees specifically.
- Manyavar — scraped monthly. Men's ethnic wear.

All prices stored in INR. Converted to GBP using daily exchange rate from free API.

### Price Suggestion
Almari suggests an offer range based on category, subcategory, fabric, condition, provenance city. Shown at listing confirmation. Pre-populates asking price. At launch — manually seeded market research data. Post launch — real transaction data.

---

## Listing Flow

### Phase 1 (current — built)
1. Photos (minimum 4) — guided prompts: full length, back, detail/embroidery, label
2. Category and subcategory (kids categories show age/height measurement fields)
3. Style lens + work type + pattern + fabric
4. Occasion bucket
5. Colour swatch
6. Condition tier
7. Item care status
8. Why selling phrase (tap to select)
9. Provenance: city, area, seller type, year, original price + currency. Heirloom toggle if unknown.
10. Measurements: guided with body illustration. Kids-aware: shows age range + height fields for kids categories.
11. Set contents: what's included, is set complete
12. **Postage hint (Phase 1):** Read-only box showing real Royal Mail prices. Seller factors postage into asking price. No service selection.
    > "Postage is your cost — factor it into your asking price. Small parcel (dupatta, kurta): £3.65–£4.65 · Medium (saree, salwar set): £5.55–£8.55 · Large (lehenga, sherwani): £11.95–£16.15"
13. Listing trust score shown + price suggestion unlocked if provenance complete
14. Asking price set (pre-populated from suggestion)
15. Review and confirm

### Phase 2 additions (Sendcloud + Stripe)
Steps 12 becomes a full postage selection:
- Package size (Small/Medium/Large) and weight band picker
- Royal Mail service cards with price and compensation level
- Warning if item asking price exceeds service compensation level
- Almari takes margin between buyer price and Royal Mail cost (never shown)
- Sendcloud generates Royal Mail label on dispatch from seller screen

---

## Fits Me Sort
Buyer saves measurements once in profile: bust, waist, hips, height, uk_shoe_size.
Listings sorted by fit match — not filtered, never hidden.

**Adult clothing — four sort tiers:**
1. Exact fit — within 1 inch tolerance
2. Quick pin — within 2 inches. Label exactly "Quick pin"
3. Quick stitch — within 3-4 inches. Label exactly "Quick stitch"
4. Everything else — shown below, never hidden

**Kids clothing — three sort tiers (age + height based):**
1. Fits now — height within range for listed age band
2. Nearly there — within one size band above or below
3. Different size — shown below, never hidden

*Kids fit labels (Fits now / Nearly there / Different size) require family measurement profiles (K6) which are post-launch. Kids listings currently show age/height range on listing detail.*

**Footwear — exact match only:**
Matched on `uk_shoe_size`. Exact match = Fits. Everything else shown below unlabelled.

---

## Waitlist — Post-launch (requires negotiation engine)
When offer is active on a listing:
- Listing stays visible in search
- Offer button replaced with "Someone is interested in this piece. Join the waitlist."
- Waitlist count shown publicly e.g. "2 people waiting"
- When offer expires or declined — waitlist notified instantly: "Good news — the piece you were waiting for is available. You're first in the queue."

---

## Postage Rules

### Phase 1 (current)
- Seller arranges their own Royal Mail postage.
- No Evri, no DPD, no other carriers.
- Seller enters tracking number on dispatch.
- Buyer sees tracking number as a tappable Royal Mail link.
- Seller can edit tracking number inline if entered incorrectly (available while status = dispatched).
- Postage prices shown as a static hint in listing flow — updated annually from royalmail.com.

### Phase 2 (Sendcloud integration)
- Royal Mail only. No Evri, no DPD, no other carriers.
- Seller selects package size (Small/Medium/Large) and weight (Light/Medium/Heavy)
- Almari shows Royal Mail service options with price and compensation level
- Warning shown if item asking price exceeds service compensation level
- Almari takes margin between what buyer pays and what Royal Mail charges
- Margin never shown to buyer or seller
- Sendcloud generates label on dispatch

---

## Listing and Transaction States

### Listing statuses
| Status | Description |
|---|---|
| `draft` | Created but not submitted. Persisted to DB from step 1. |
| `active` | Live and available to buy. |
| `reserved` | Buy Now tapped — locked for **20 minutes** while buyer arranges payment. Prevents race condition. |
| `sold` | Payment confirmed. |
| `removed` | Seller removed it. Reason captured via S18 (post-launch). |
| `removed_by_admin` | Almari removed it. |
| `suspended` | Under review. Hidden from search. |

### Transaction statuses
| Status | Description |
|---|---|
| `pending_payment` | Buyer placed order, payment reference issued. Awaiting offline transfer. |
| `paid` | Seller confirmed payment received. |
| `dispatched` | Seller confirmed posted, tracking number entered. |
| `delivered` | Buyer confirmed receipt. 48h concern window opens. |
| `concern_open` | Buyer raised concern within 48h window. |
| `concern_resolved` | Concern upheld or dismissed by Almari. |
| `completed` | 48h window closed with no concern, or concern dismissed. |
| `refunded` | Concern upheld or lost in post confirmed by both parties. Manual Almari refund. |
| `cancelled` | Cancelled before dispatch (e.g. seller unable to fulfil). |

### Listing expiry
Listings do not expire. A piece of Indian ethnic wear may take months to find its buyer — that is fine. After 90 days with no views → seller nudged: "Is this still available?" Seller confirms or removes. Nudge is informational only, not automated suspension.

---

## Delivery Flow

### Phase 1 — Offline payment model (current)
Buy Now tapped → transaction created (`pending_payment`), payment reference `ALM-XXXXX` issued, listing status `reserved` for 20 minutes (DB trigger) → buyer transfers funds offline (PayPal/Revolut) using reference → buyer taps "Done — I've sent payment" → seller confirms payment received → `paid` → seller posts item via Royal Mail, enters tracking number → `dispatched` → buyer confirms receipt → `delivered`, 48h concern window opens → no concern → `completed`, Almari manually settles with seller.

Buy Now is blocked if seller has not set up payment details (PayPal or Revolut).

Delivery address captured at checkout, snapshotted to transaction. Shown to seller in dispatch instructions.

In-app notification + email sent to relevant party at each status transition.

If no concern raised within 48h window → `completed`.

If tracking not updated 5 days after dispatch → nudge both parties. No response after nudge → buyer can open a lost in post case. Lost in post case → both parties confirm in-app → transaction status `refunded`, Almari manually refunds buyer.

### Phase 2 — Stripe escrow (post-launch)
Stripe replaces offline transfer. Sendcloud generates Royal Mail labels. Escrow automates payout. Flow is identical — only the payment and label steps change.

---

## Notifications (S17)

### In-app notifications (Phase 1 — built)
- Chronological list, unread blue dot per row
- Tap → marks read, navigates to buyer or seller order detail (role auto-detected from transaction)
- Mark all read — header button
- Swipe to delete — per-row dismiss
- Empty state: "You're all caught up"
- Unread badge on Alerts tab icon — real-time via Supabase subscription
- Channel: `in_app`

**Five DB triggers (write to `notifications` table):**
| Event | Recipient | Type |
|---|---|---|
| Buyer taps "Done — I've sent payment" | Seller | `payment_sent` |
| Seller confirms payment received | Buyer | `payment_confirmed` |
| Seller marks dispatched | Buyer | `dispatched` |
| Buyer confirms received | Seller | `delivered` |
| Concern raised | Seller | `concern_raised` |

### Transactional emails (Phase 1 — built)
Same events as above (except concern raised), sent via Resend using `pg_net` DB triggers. Recipient email looked up from `auth.users`. Always sent — not affected by marketing email toggle.

| Event | Recipient | Subject |
|---|---|---|
| Buyer marks payment sent | Seller | "Payment is on its way — [item]" |
| Seller confirms payment | Buyer | "Your order is confirmed — [item]" |
| Seller marks dispatched | Buyer | "Your [item] is on its way" |
| Buyer confirms received | Seller | "Order complete — [item]" |

### Push notifications — Phase 2 (post-TestFlight)
Expo Push Notifications infrastructure. Full trigger list in backlog.

---

## Concerns (not returns)
Buyers can raise a concern within 48 hours of delivery. Three reasons only:
1. Item condition significantly worse than described
2. Set was incomplete — parts missing not declared
3. Suspected vendor listing

Concern affects seller trust score if upheld. Three concerns in 90 days → trust meter hit + manual review.

---

## Removal Score
Sellers who remove listings accumulate a removal score. Score is a positive accumulator — it goes UP with each removal. Separate from the seller trust (diya) score which goes DOWN.

| Reason | Removal score +δ | Trust score −δ |
|---|---|---|
| Changed mind | +2 | −2 |
| Sold elsewhere | +5 | −5 |
| Mistake | +1 | 0 |
| Damaged | 0 | 0 |

Score 5: warning shown to seller in profile.
Score 9: free listing privilege suspended for 3 months. Seller can still list — pays a small fee per listing during suspension.
Score resets to 0 after 3 months.
Removal score visible to seller only in their profile.

**S18 Removal reason screen** — deferred post-launch. Currently no in-app flow for capturing removal reason. Listings are removed from My Listings without a reason screen. Build before first 50 users.

---

## Screens

### Built (Phase 1)
| Screen | File | Status |
|---|---|---|
| S1 — Get Started / Splash | `app/(auth)/welcome.tsx` | Done |
| S2/S3 — Register + OTP inline | `app/(auth)/register.tsx` | Done |
| S3 — Welcome / Onboarding (name, measurements) | `app/(auth)/welcome.tsx` | Done |
| S4 — Home feed (search bar, listing cards, seasonal banner) | `app/(app)/index.tsx` | Done |
| S5 — Search (text + multi-select filters: category, subcategory, occasion, colour, condition, pattern, work, fabric, budget, size/age) | `app/(app)/search.tsx` | Done |
| S6 — Listing detail (photos, story, Buy Now, 20-min reservation countdown, seller row → S27) | `app/listing/[id].tsx` | Done |
| S7–S10 — Listing creation (4 steps) | `app/list/step-1,2,pricing,review.tsx` | Done |
| Edit listing | `app/list/edit/[id].tsx` | Done |
| S11 — Profile (KPI row, diya, tier, payment details, addresses, My Listings, orders, settings, delete account) | `app/(app)/profile/index.tsx` | Done |
| S17 — Notifications (real-time list, badge, mark all read, swipe delete) | `app/(app)/notifications.tsx` | Done |
| S19 — Payment details (PayPal + Revolut — offline model) | `app/(app)/profile/bank-details.tsx` | Done |
| S20 — My Listings (active / sold / removed tabs) | `app/(app)/profile/my-listings.tsx` | Done |
| S21 — Measurements | `app/(app)/profile/measurements.tsx` | Done (family profiles post-launch) |
| S22 — My Purchases | `app/(app)/profile/purchases.tsx` | Done |
| S22 — My Sales | `app/(app)/profile/sales.tsx` | Done |
| S23 — Order detail, buyer (timeline, payment, tracking link, confirm received, raise concern) | `app/transaction/[id]/buyer.tsx` | Done |
| S24 — Order detail, seller (confirm payment, dispatch + tracking entry, tracking link + inline edit) | `app/transaction/[id]/seller.tsx` | Done |
| S25 — Raise a concern (3 reasons, confirm step) | `app/transaction/[id]/concern.tsx` | Done |
| S26 — Lost in post (both-party confirm) | `app/transaction/[id]/lost-in-post.tsx` | Done |
| S27 — Seller public profile (diya, member since, sales count, listings grid) | `app/profile/[id].tsx` | Done |
| Buy Now confirm + payment instructions | `app/transaction/new/confirm.tsx`, `payment-instructions.tsx` | Done |
| GDPR — Delete account | `app/(app)/profile/index.tsx` | Done |

### Deferred — Phase 2 / Post-launch
| Screen | Notes |
|---|---|
| S12 — Payment (Stripe checkout) | Phase 2 — replaces offline PayPal/Revolut |
| S11 — Offer status / negotiation states | Post-launch — requires negotiation engine |
| S18 — Removal reason | Post-launch — before first 50 users |
| S21 — Family measurement profiles (K6) | Post-launch — kids fit label infrastructure |

---

## Filters and Sort

### Sort options
Newest first (default), Price low → high, Price high → low

*Best fit / Fits Me sort — post-launch, requires family measurement profiles (K6)*

### Filters (built in S5 search)
Category, subcategory, occasion bucket, colour swatches, condition, pattern, work type, fabric, budget (min/max), size (women's UK sizes), age range (kids)

---

## Tech Stack
- React Native / Expo SDK 56 (iOS + Android)
- Supabase (Postgres + Auth + PostgREST + Storage + Realtime)
- React Query v5 (`useQuery`, `useInfiniteQuery`)
- Zustand (auth + listing draft state)
- expo-image (photo display)
- react-native-svg + react-native-reanimated v4 (animations)
- @tabler/icons-react-native v3.44.0
- Resend (transactional email, via pg_net DB triggers)
- EAS (cloud builds, TestFlight)
- GitHub (code repository)
- **Phase 2:** Stripe (payments + Connect for seller payouts), Sendcloud (Royal Mail label generation), exchangerate-api.com (daily GBP/INR rate)
- **Post-launch:** Expo Push Notifications

---

## Brand Visual Identity
**Colours:** Midnight navy #0D1B3E, Gold #C9953C, Gold light #E8C875, Washed pink #E8C4C0, Silver #C8D4DC, Cream #FAF6F0, Blue-white #EEF3F8
**Typography:** Cormorant Garamond (headings), Inter (body)
**Logo:** Godrej almirah — two door steel cabinet, mirror on left door with bindis, dupatta hanging on right door handle. Gold and navy.
**Sequin strip:** Gold sequin decorative strip used as divider. Culturally festive.
**Trust visual:** Diya (seller trust). Firework burst (listing trust).

---

## Multi-brand / White Label
Architecture supports multiple brand deployments from one codebase. Brand configured via environment variables at deployment:
BRAND_NAME, BRAND_TAGLINE, BRAND_PRIMARY_COLOUR, BRAND_SECONDARY_COLOUR, BRAND_LOGO_URL, BRAND_DOMAIN, BRAND_EMAIL

All config tables are blank on fresh install. Each brand seeds their own categories, conditions, colours, micro copy, seasonal events. Almari seed data documented separately.

---

## Empty States

Every screen with a list must have a designed empty state — never a blank screen.

| Screen | Empty state copy |
|---|---|
| S4 Home feed (no listings yet) | "Be one of the first. The cupboards are opening." + Sell button |
| S4 Home feed (no fit matches) | "Add your measurements to find pieces that fit." + link to S21 |
| S5 Search (no results) | "Nothing yet. But it might arrive tomorrow." |
| S17 Notifications (none) | "You're all caught up" + bell icon |
| S20 My Listings — active | "Your first listing is waiting to be written." + List button |
| S20 My Listings — sold | "Your first sale is coming." |
| S20 My Listings — removed | Blank — no copy needed |
| S22 My Purchases | "Nothing yet. Find something beautiful." + link to S4 |
| S27 Seller profile — no active listings | "Nothing listed right now." |

---

## Legal Framework
All sales are final. Almari is a peer to peer platform between private individuals. Not a retailer. Consumer retail return rights do not apply.

Misrepresentation concern window: 48 hours after delivery. Three specific reasons only.

Lost in post: Almari facilitates resolution. Both parties agree. Seller claims Royal Mail. Almari refunds buyer manually at launch (escrow automates this in Phase 2).

Almari's liability limited to transaction value.

UK governing law.

Full T&Cs live at almari.uk/terms. Privacy Policy at almari.uk/privacy. Both written for offline model. Solicitor review when first revenue arrives.

ICO registration required when processing personal data commercially. Revisit when fees introduced.

---

## Launch Scope (Phase 1 — current)

### IN (built and live)
All categories, UK wide, detailed listing only, full listing trust score (max 60), buy now only, provenance data capture (including original price currency), kids measurement fields (age/height), postage hint (static Royal Mail prices), offline payment (PayPal/Revolut), payment reference `ALM-XXXXX`, 20-minute reservation lock, in-app notifications (real-time), transactional emails (Resend), order tracking with Royal Mail link + inline edit, seller trust score (diya), seller public profile, all 5 order statuses wired, concerns (S25), lost in post (S26), GDPR delete account, edit listing, delivery address at checkout, Buy Now guard (requires seller payment details).

### OUT Phase 2 (Stripe + Sendcloud — drop-in replacements, DB schema unchanged)
Full postage selection in listing flow, Sendcloud Royal Mail label generation, Stripe escrow, automated payouts, price context panel (exchange rate + benchmark pricing), relisting fee.

### OUT post-launch (backlog — see ALMARI_BACKLOG.md)
Make an offer + negotiation engine, waitlist, private pricing tiers, S18 removal reason screen, family measurement profiles (K6) + full kids fit labels, Fits Me sort, price drop alerts, saved searches, badges, gamification, promoted listings, quick list, biometric login, social sign-in (Apple/Google), social content generator, provenance certificate PDF, draft listing persistence, push notifications, seasonal notification automation, search trends engine, Almari Stores tiers.
