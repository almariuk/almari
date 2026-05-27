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
- Postage margin only. Almari charges buyer slightly above Royal Mail cost. Difference is revenue.
- Relisting fee after third relist — small charge (£1 suggested).
- Promoted listings — seller pays to boost visibility. Post launch.
- Free to list. Free to buy. Free to sell.

---

## Categories
**Women:** Saree, Lehenga set, Salwar kameez set, Anarkali set, Kurta, Dupatta, Blouse, Co-ord set, Sharara set, Gharara set, Indo western gown, Dress material, Footwear
**Men:** Sherwani set, Kurta pyjama set, Nehru jacket, Bandhgala suit, Jodhpuri suit, Indo western, Footwear
**Kids:** Girls ethnic wear, Boys ethnic wear, Kids footwear

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

## Private Seller Motivations (never shown publicly)
Kids grew out of it | Moving house | Upgrading my wardrobe | It was a gift — never worn | Financial reasons | Emotional — ready to let go | Other

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

**Trust score events (configurable, not hardcoded):**
Verification: email +2, address +3, measurements +2, bank details +3, phone +3
Activity: first listing +2, first purchase +2, sale completed +5, purchase completed +3, detailed listing +1, measurements on listing +1
Activity (post-launch): waitlist converted +2 (requires negotiation engine)
Behaviour: concern upheld −10, listing removed changed mind −2, listing removed sold elsewhere −5

### Listing Trust — The Firework
Visual: A firework burst. Expands outward from centre as score increases. Low score = single spark. High score = full gold burst with silver outer sparks.

Five states: Just listed (spark) → Starting → Building → Strong → Brilliant

Components that feed listing trust score: photos count, measurements completeness, provenance detail, condition accuracy, care status, set completeness, why selling filled, additional notes.

---

## Pricing Intelligence

### Price Context Panel (shown on every listing)
- What the seller paid: original INR price + GBP equivalent at today's rate
- Current replacement cost shipped from India: from benchmark_prices table + delivery + customs estimate
- "Selling X% below replacement cost" — calculated automatically
- What you'd pay elsewhere: UK vendor Leicester/Birmingham, UK vendor London, shipped from India, brand new in India

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
1. Photos (minimum 4) — guided prompts: full length, back, detail/embroidery, label
2. Category and subcategory
3. Style lens + work type + pattern + fabric
4. Occasion bucket
5. Colour swatch
6. Condition tier
7. Item care status
8. Why selling phrase (tap to select)
9. Private seller motivation (tap to select — never shown publicly)
10. Provenance: city, area, seller type, year, original INR price. Heirloom toggle if unknown.
11. Measurements: guided with body illustration
12. Set contents: what's included, is set complete
13. Package size and weight band
14. Postage service: Royal Mail options with price and compensation level. Warning if item value exceeds compensation.
15. Listing trust score shown + price suggestion unlocked if provenance complete
16. Asking price set (pre-populated from suggestion)
17. Review and confirm

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
- Royal Mail only. No Evri, no DPD, no other carriers.
- Seller selects package size (Small/Medium/Large) and weight (Light/Medium/Heavy)
- Almari shows Royal Mail service options with price and compensation level
- Warning shown if item asking price exceeds service compensation level
- Almari takes margin between what buyer pays and what Royal Mail charges
- Margin never shown to buyer or seller

---

## Listing and Transaction States

### Listing statuses
| Status | Description |
|---|---|
| `draft` | Created but not submitted. Persisted to DB from step 1. |
| `active` | Live and available to buy. |
| `reserved` | Buy Now tapped — locked for 10 minutes while payment processes. Prevents race condition. |
| `sold` | Payment confirmed. |
| `removed` | Seller removed it. Reason captured via S18. |
| `removed_by_admin` | Almari removed it. |
| `suspended` | Under review. Hidden from search. |

### Transaction statuses
| Status | Description |
|---|---|
| `pending_payment` | Buyer initiated checkout, Stripe payment not yet confirmed. |
| `payment_failed` | Stripe payment failed — listing returns to `active`. |
| `paid` | Payment confirmed. Funds held in escrow. |
| `dispatched` | Seller confirmed posted, tracking number entered. |
| `delivered` | Tracking confirmed delivered OR buyer tapped confirm receipt. |
| `concern_open` | Buyer raised concern within 48h window. |
| `concern_resolved` | Concern upheld or dismissed. |
| `completed` | 48h window closed with no concern, or concern dismissed. Funds released. |
| `refunded` | Concern upheld or lost in post confirmed. Buyer refunded from escrow. |
| `cancelled` | Cancelled before dispatch (e.g. seller unable to fulfil). |

### Listing expiry
Listings do not expire. A piece of Indian ethnic wear may take months to find its buyer — that is fine. After 90 days with no views → seller nudged: "Is this still available?" Seller confirms or removes. Nudge is informational only, not automated suspension.

---

## Delivery and Escrow Flow
Buy Now tapped → listing status set to `reserved` (10 min TTL) → payment taken → listing status `sold`, transaction status `paid` → held in Stripe escrow → seller dispatches → transaction status `dispatched` → tracking confirmed delivered OR buyer confirms receipt → transaction status `delivered` → 48 hour concern window → no concern → transaction status `completed`, funds released → daily 2pm payout batch.

Payment fails or times out → listing status returns to `active`.

If tracking not updated 48 hours after ETA → nudge both parties.
5 days silence after nudge → message to buyer: sorry, you can open a lost in post case.
Lost in post case → both parties agree → seller claims Royal Mail directly → Almari refunds buyer from escrow → transaction status `refunded`.

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

---

## Screens
S1 — Splash
S2 — Register (email verification inline)
S3 — Welcome + measurements
S4 — Home feed
S5 — Search and filters
S6 — Listing detail (photos, story, price context, Buy Now button — offer slider added post-launch with negotiation engine)
S7 — Listing creation pt 1 (photos, category, style, colour, condition, occasion, why selling)
S8 — Listing creation pt 2 (provenance, measurements, postage)
S9 — Pricing (trust score, price suggestion, asking price)
S10 — Review and confirm
S11 — Offer status (all negotiation states — post-launch when negotiation engine added)
S12 — Payment (checkout, Stripe)
S16 — Profile (history, certificates, badges, payouts, bank details)
S17 — Notifications
S18 — Removal reason (changed mind / sold elsewhere / mistake / damaged — feeds removal score)
S19 — Bank details entry
S20 — My listings (active, sold, removed)
S21 — Measurements (accessible anytime from profile)
S22 — My Purchases (buyer's purchase list — active / completed)
S23 — Order detail, buyer view (status timeline, tracking, confirm receipt, raise concern button)
S24 — Order detail, seller view (dispatch instructions, confirm posted, tracking entry, payout status)
S25 — Raise a concern (3 reasons, 48h window with countdown)
S26 — Lost in post case (both parties confirm in-app, Almari initiates refund)
S27 — Seller public profile (diya tier, member since, completed sales count, active listings — read only, no contact)

---

## Filters and Sort

**Sort options:** Newest first (default), Price low → high, Price high → low, Best fit (Fits Me score)

**Popular filters (shown immediately):** Category, subcategory, occasion bucket, colour swatches, fits me sort toggle, budget slider
**Special filters (under more filters):** Condition, pattern, work type, fabric

---

## Tech Stack
- React Native via Expo (iOS + Android)
- Supabase (Postgres + Auth + Storage + Edge Functions)
- Stripe (payments + Connect for seller payouts)
- Sendcloud (Royal Mail label generation)
- Resend (transactional email)
- Expo Push Notifications
- exchangerate-api.com (free daily GBP/INR rate)
- GitHub (code repository)
- Expo Application Services (cloud builds, TestFlight)

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
| S5 Search (no results) | "Nothing yet. But it might arrive tomorrow." + Save search (post-launch) |
| S20 My Listings — active | "Your first listing is waiting to be written." + List button |
| S20 My Listings — sold | "Your first sale is coming." |
| S20 My Listings — removed | Blank — no copy needed |
| S22 My Purchases | "Nothing yet. Find something beautiful." + link to S4 |
| S27 Seller profile — no active listings | "Nothing listed right now." |

---

## Legal Framework
All sales are final. Almari is a peer to peer platform between private individuals. Not a retailer. Consumer retail return rights do not apply.

Misrepresentation concern window: 48 hours after delivery. Three specific reasons only.

Lost in post: Almari facilitates resolution. Both parties agree. Seller claims Royal Mail. Almari refunds buyer from escrow.

Almari's liability limited to transaction value.

UK governing law.

Full T&Cs drafted — see separate legal document.

---

## Launch Scope (MVP)
IN: All categories, UK wide, detailed listing only, full listing trust score, price context panel, buy now only, provenance data capture, fits me sort, Royal Mail via Sendcloud, Stripe escrow, manual payouts, seller trust score (diya), removal score tracking (S18), concerns (S25), order tracking (S22–S26), all config driven.

OUT (post-launch): Make an offer + negotiation engine, waitlist, private pricing tiers, pricing intelligence algorithm, badges and gamification, promoted listings, quick list, automated payouts, automated payout batch, lost in post case management UI (manual process at launch), seasonal notification automation, provenance certificate PDF, social content generator, search trends engine, push notification triggers (manual Supabase comms at launch), biometric login.

