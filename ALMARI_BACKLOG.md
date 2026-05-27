# Almari — Post Launch Backlog

This document has two sections: pre-launch items (required before TestFlight / App Store) and post-launch backlog (fully designed, not building until after launch). Pick up post-launch items in priority order after the app ships.

---

## Pre-launch items (required for launch)

### Offline payment model — DONE
Launch without Stripe or Sendcloud. Buyers pay sellers directly using PayPal/Revolut/bank transfer. Sellers arrange their own postage and enter tracking manually. Stripe + Sendcloud slot in post-launch as drop-in replacements — the DB schema, status machine, and screen flows are identical.

### S18 — Removal reason screen + removal score
When a seller removes a listing they must give a reason. Screen has 4 options: changed mind (-2) / sold elsewhere (-5) / mistake (-1) / damaged (0). Score accumulates on seller profile. Warning shown at score 5. Free listing privilege suspended at score 9 for 3 months. Score resets after 3 months. Removal score visible to seller in their profile. (`app/listing/remove/[id].tsx`)

### S22 — My Purchases — DONE
`app/(app)/profile/purchases.tsx`. Active / Done tabs. Taps through to S23 buyer view.

### S22 — My Sales — DONE
`app/(app)/profile/sales.tsx`. New / In progress / Done tabs. Taps through to S24 seller view.

### S23 — Order detail, buyer view — DONE (`app/transaction/[id]/buyer.tsx`)
Status timeline, payment reminder (pending_payment), tracking (dispatched), confirm received (opens 48h concern window), raise a concern nav.

### S24 — Order detail, seller view — DONE (`app/transaction/[id]/seller.tsx`)
Confirm payment received, tracking entry + mark dispatched, dispatched/delivered/completed/refunded states.

### S25 — Raise a concern (`app/transaction/[id]/concern.tsx`) — stub, Step 7
- Three reasons: item significantly not as described / item not received / other
- Confirmation step before submitting
- Sets status → `concern_open`, emails atulblal@gmail.com with details
- Affects seller trust score if upheld

### S26 — Lost in post (`app/transaction/[id]/lost-in-post.tsx`) — stub, Step 8
- Both parties confirm in-app
- Sets status → `refunded`
- Almari manually refunds buyer, no Stripe escrow at launch

### Trust score events — Step 9
Wire up on transaction `completed`: seller +5, buyer +3. On concern upheld (manual by Almari): seller −10. Requires `trust_events` table (already in DB).

---

## Pre-launch DB migrations — ALL DONE

All required columns exist in the DB. Run this session or previously:
- `listings.reserved_until`, `listings.parent_listing_id` ✅
- `transactions.cancellation_reason`, `transactions.payment_reference`, `transactions.concern_raised_at`, `transactions.concern_reason`, `transactions.buyer_lost_confirmed_at`, `transactions.seller_lost_confirmed_at` ✅
- `user_profile.payment_instructions` ✅
- `trust_events` table ✅
- RLS policies on transactions (buyer/seller read, buyer insert, buyer/seller update) ✅
- DB trigger `trg_reserve_listing` — auto-reserves listing on transaction insert ✅

---

## GDPR compliance (build before App Store submission)

### Delete account
GDPR right to erasure. User can delete their account from profile settings.
- Anonymise `user_identity` (name → "Deleted User", email → null)
- Delete `user_profile` measurements
- Keep `listings` and `transactions` records intact (needed for other party's history and provenance chain) but detach from user
- Supabase auth user deleted via `supabase.auth.admin.deleteUser()`
- Add to profile screen under a "Danger zone" section

---

## Priority 1 — Add after first 50 users

### Draft listing persistence
Persist draft to `listings` table with `status: 'draft'` from step 1. On app relaunch, detect existing draft and offer to resume. Replaces Zustand-only in-memory draft. Low priority — listing flow is mostly tap-to-select, losing a draft is a minor inconvenience.

### S18 Removal reason screen + removal score
When a seller removes a listing they must give a reason. Screen has 4 options: changed mind (+2) / sold elsewhere (+5) / mistake (+1) / damaged (0). Removal score accumulates on seller profile. Warning shown at score 5. Free listing privilege suspended at score 9 for 3 months. Score resets after 3 months. Removal score visible to seller only. (`app/removal-reason.tsx` — stub exists, needs building)

### Favourites / Wishlist
Buyer hearts a listing to save it. Stored in a `listing_favourites` table (`user_id`, `listing_id`, `created_at`). Accessible from a Saved tab in profile. Seller sees favourite count on their listing ("14 people saved this"). Foundation for price drop alerts.

### Price drop alerts
Seller reduces asking price → all users who favourited the listing get a push notification and Resend email: "A piece you saved just dropped in price." Requires favourites to exist first.

### Saved searches / alerts
Buyer saves a search with active filters. Stored in `saved_searches` table. When a new listing is published that matches — push notification sent. Uses existing `search_events` infrastructure. "The burgundy lehenga you were looking for just arrived."

### Seller onboarding completeness nudge
Profile completeness bar shown on S11. After registration: "Add your measurements (+2 trust), verify bank details (+3 trust), add a profile photo." Each step tappable, shows trust score impact. Re-engagement email sent after 7 days if profile incomplete.

### Pre-purchase listing flag / report
Flag button on S6 listing detail. Three reasons: fake photos / suspected vendor / offensive content. Goes to founder review queue. Listed separately from post-purchase concerns (S25).

### Deep links
`almari.uk/listing/[id]` → opens app or falls back to web preview. Expo deep link config + web fallback page on almari.uk. Required before social content generator is useful.

### Dispute resolution process (documented)
When a concern is raised (S25): seller has 48h to respond via in-app prompt. Founder reviews both sides and decides within 5 working days. Outcome: upheld (buyer refunded, seller trust −10) or dismissed (no action). Both parties notified. Response time SLA shown to buyer on S25.

### Waitlist
When a listing has an active offer (post-launch, requires negotiation engine):
- Listing stays visible in search
- Buy Now button replaced with "Someone is interested in this piece. Join the waitlist."
- Waitlist count shown publicly e.g. "2 people waiting"
- When offer expires or is declined — waitlist members notified instantly: "Good news — the piece you were waiting for is available. You're first in the queue."
- Waitlist position stored in DB per listing. Notification sent via Expo Push + Resend email.

### Make an Offer + Negotiation Engine
Buyer makes one offer. Seller accepts, declines, or counters once. Buyer accepts counter or walks. Maximum two rounds. Offers expire after 24 hours.

**Private pricing tiers (set by seller at listing):**
- Floor: auto decline below this. Never revealed.
- I'll take it: auto accept at or above this. Never revealed.
- I want to know: seller notified, decides manually.
- Ceiling: the public asking price.

Tiers editable only when no active offer on listing. Listing locks completely when offer active. Tiers lock when negotiation active.

Buyer sees Almari suggested offer range and slider. Never sees seller's tiers. Auto accept/decline feels human — buyer can't tell if it was automatic or manual.

### Haggling micro copy
"Make an offer. It's how we've always done it."
"Name your price. Let's talk."
"A deal both sides feel good about."

---

## Priority 2 — Add after first 100 transactions

### Relisting flow + 3rd relist fee
When a seller relists a removed or expired listing, increment relist count via `parent_listing_id` chain. On the 3rd relist, charge a small fee (£1) before publishing. Relist count visible to seller only. Fee charged via Stripe. Deters churn without penalising genuine relists.

### Pricing Intelligence Algorithm
Every completed sale already writes to pricing_intelligence table from day one. After 100 transactions — build the query layer.

Input: category, subcategory, fabric, condition, provenance city/area
Output: suggested price range low and high in pence

Replace manually seeded benchmark data with real transaction data progressively. After 500 transactions — real data dominates.

Show confidence level: "Based on 3 similar sales" vs "Based on 47 similar sales."

### Provenance Certificate PDF
Generated on every completed transaction. Immutable. Stored in Supabase Storage.

Contains: seller name + city, buyer name + city, transaction date, sale price, condition description, provenance summary, why selling phrase, certificate reference (ALMC-2025-XXXXX), previous certificate if resale.

Chain builds across resales. A saree on its third Almari sale has three chapters. Beautiful designed PDF — not a generic receipt. Something the buyer wants to keep.

---

## Priority 3 — Add after TestFlight feedback

### Push notification triggers
Expo Push Notifications infrastructure. S17 (notifications screen) shows history. Triggers to implement:
- Seller: someone bought your listing
- Seller: dispatch reminder (24h after sale if not dispatched)
- Buyer: your order has been dispatched (tracking number included)
- Buyer: your order has been delivered — confirm receipt or raise concern
- Buyer: 48h concern window closing soon
- Buyer/Seller: 48h silence after delivery ETA — nudge both parties
- Waitlist member: listing you were waiting for is available again
- Seller: concern raised against your listing
- Both parties: concern resolved

### Badges and Gamification
**Sharp seller** — completed 5+ sales, all smooth
**Generous heart** — listed items free (pay postage only)
**Community pillar** — 20+ transactions, high trust score
**Nailed it** — sold on first listing, no relist
**Sharp marketer** — shared listing on social media

Badges visible on profile. Not shown on listing cards at launch — add later when community is large enough to recognise them.

### Seasonal Notification Automation
Hard coded calendar. Diwali, Eid, Navratri, wedding season spring and autumn.

Seller nudge 3 weeks before: "Diwali is coming. Your festive pieces could find a new home."
Buyer nudge 2 weeks before: "Diwali is three weeks away. Looking for something festive?"

Currently done manually via WhatsApp. Automate when volume justifies it.

---

## Priority 4 — Growth features

### Social Content Generator
At listing confirmation — Almari generates ready-made social content.

**Instagram post:** best listing photo framed in Almari navy/gold aesthetic, why selling phrase as caption, price context, provenance story. One tap to share.
**WhatsApp status:** photo, one line, price.
**Facebook:** longer format with full story.

All generated from listing data. No typing required. Pre-populated hashtags: #Almari #IndianFashion #DesiStyle #EthnicWear #UKDesi #PrelovedIndian #SustainableFashion

Sellers who share get small trust score boost. Sharp marketer badge.

### Search Intelligence and Trending
search_events and listing_views tables collect data from day one.

After sufficient volume — build listing_search_trends materialised view. Refreshed weekly.

Home feed trending section: "Trending this week — burgundy lehengas, wedding sherwanis, silk sarees."

Seller nudges based on search gaps: "3 buyers searched for burgundy silk lehenga size 38 yesterday and found nothing. Do you have one?"

### Promoted Listings
Seller pays flat fee (£1-2) to boost listing for 7 days. Appears at top of relevant category and occasion feeds. Clearly marked as promoted but tastefully. No garish advertising feel.

### Pay Postage Only — Free Listings
Seller lists item free. Buyer pays postage only. Almari takes postage margin.

Generous seller badge awarded. Community karma built. Listing still generates provenance data. Certificate still issued.

---

## Priority 5 — Platform maturity

### Biometric login
Allow returning users to sign in with Face ID / fingerprint. Use `expo-local-authentication` to prompt biometrics, store credentials via `expo-secure-store`. Faster re-entry, better UX for returning users.

### Phone verification
Add phone number field to profile. Verify via OTP (Supabase phone auth or Twilio). Awards +3 trust score on verification. Required for the trust score ceiling to be reachable.

### Address verification
Seller confirms their UK address. Used for trust score (+3) and to validate Royal Mail eligibility. Can be lightweight at launch — postcode entry confirmed by seller, not third-party verified. Full verification (Royal Mail PAF lookup) post-scale.

### Quick List Option
Minimum viable listing. Photos, category, condition, colour, why selling, one measurement, postage. Live in 3 minutes. Lower trust score shown honestly.

Upgradeable to detailed list any time after posting. Trust score updates in real time.

### Automated Daily Payout Batch
Currently manual via Stripe dashboard. Automate when volume makes manual painful. Edge function runs at 2pm daily. Batches all released escrow per seller. Initiates Stripe payout.

### Lost in Post Case Management UI
Currently: point both parties to Royal Mail directly.
Post launch: full case UI in S26. Both parties confirm agreement in app. Almari initiates refund. Case status tracked.

### Intelligent Seller Intervention
Uses private_seller_motivation data captured at listing.

If listing hasn't sold and motivation is time sensitive (kids grew out of it, moving house) — Almari reaches out privately.
"That offer for £45 — the buyer was genuine. Want us to reach back out to them?"

Requires negotiation engine first.

---

## Priority 6 — Almari Stores

Almari evolves beyond peer-to-peer preloved into a full community marketplace ecosystem. Three tiers of seller, clearly distinguished visually at all times. Community trust is the gate to every tier.

### Tier 1 — Community individual
Current model. Personal wardrobe. No hard listing cap (removed from DB — anti-vendor protection via provenance + trust). Diya trust visual. Free.

### Tier 2 — Community store
Earned through trust. Bharosa diya or above required. Minimum 20 completed transactions. Zero upheld concerns. Clean removal score.

- Elevated listing cap — 50 items
- Persistent store profile page with name, story, speciality, location
- Small monthly subscription — £5–10/month
- Still personal wardrobe and personal network only. Not commercial stock.

### Tier 3 — Verified trader
Application based. Almari vets and approves. Small boutiques, home importers, community traders who currently have no credible online home. Leicester Golden Mile, Southall Broadway, Birmingham traders specifically.

- Higher listing cap — 200 items
- Full store profile
- Monthly subscription £50–100
- Clearly badged as trader at all times. Never appears as individual seller.

### Tier 4 — Heritage artisan
Direct from maker in India. Handloom weavers, embroidery artisans, craft communities. Authenticated by Almari. Provenance guaranteed.

- Monthly subscription £30
- Separate discovery section
- Cultural education content attached to each artisan profile

### The non-negotiable rule
Every listing always shows seller tier visually — individual, community store, verified trader, heritage artisan. Buyer always knows exactly what they are buying from. The preloved community section is sacred and never contaminated by commercial listings appearing alongside individual sellers without clear visual distinction.

### Database changes needed
- `seller_type` column on `user_profile` — `individual` | `community_store` | `verified_trader` | `heritage_artisan`
- `listing_cap` column on `user_profile` — replaces hardcoded 20-cap trigger
- `store_profile` table — name, story, speciality, location, social links, approved_at
- `store_subscriptions` table — seller_id, tier, stripe_subscription_id, status, started_at, ends_at

### Revenue from stores
| Tier | Price | Target (year 3) | Annual revenue |
|---|---|---|---|
| Community stores | £5–10/month | 500 stores | £30,000–60,000 |
| Verified traders | £50–100/month | 200 traders | £120,000–240,000 |
| Heritage artisans | £30/month | 100 artisans | £36,000 |
| **Total** | | | **£186,000–336,000** |

### Depends on
- Stripe subscription billing — recurring payments, not one-time
- Trust tier system fully operational
- Minimum 1,000 active community members before opening store applications
- Manual vetting process for verified traders and heritage artisans initially

---

## Priority 7 — Founder Dashboard and Reporting

Internal tooling for the founder to monitor marketplace health, take action, and stay compliant. Build incrementally — SQL queries first, Edge Function digest second, admin UI third.

### Build sequence

**Now — saved Supabase queries (no code needed)**
Run manually. The four numbers that matter at launch: active users, GMV, listings live, open concerns.

**After 100 users — weekly email digest**
Scheduled Edge Function. Runs Monday morning. Sends plain-text report to founder email. All the numbers below, no dashboard required.

**After stores launch — admin UI**
Subscription status and seller-type enforcement need daily visibility. Build a simple internal web screen at that point.

---

### Performance reports

**Marketplace health — weekly**
- GMV — total value of completed transactions
- Transaction count and average order value by category
- Listing-to-sale conversion rate and average days to sale
- Active sellers vs dormant (no sale in 30 / 60 / 90 days)
- Active buyers vs one-time buyers — repeat purchase rate

**Supply quality — weekly**
- New listings published vs drafts abandoned (completion rate)
- Listings removed by seller vs removed by Almari
- Average photos per listing, average condition rating
- Search terms with zero results — demand signal for what's missing

**Growth — monthly**
- New users by week cohort
- D7, D30, D90 retention by cohort
- Referral source where trackable

---

### Trust and safety reports

**Trust health — weekly**
- Seller distribution across diya tiers
- Trust score movements: upgrades and downgrades that week
- Concerns raised: total, upheld, dismissed, pending
- Sellers suspended or removed and reason

**Concern outcomes — monthly**
- Average resolution time
- Upheld rate by concern type (not as described, no dispatch, etc.)
- Repeat offenders — sellers with more than one concern

---

### Compliance reports

**GDPR — monthly**
- Delete account requests received and completed within 30 days (legal requirement)
- Data subject access requests received and completed
- Any data incidents or breaches — immediate escalation trigger

**Seller compliance — monthly (critical once stores launch)**
- Individuals whose listing volume suggests trading activity
- Community stores approaching listing cap
- Verified traders with lapsed subscription still listing — must auto-suspend

**ICO — quarterly**
- Registration current and paid
- Any regulatory contact received

---

### Financial reports

**Revenue — monthly**
- Postage margin collected by postage class
- Store subscription MRR — community stores, verified traders, heritage artisans separately
- Subscriptions churned that month
- Outstanding escrow — value held and age of oldest open transaction

**Payout reconciliation — monthly**
- Total paid out to sellers
- Failed payouts and resolution status
- Stripe fees

---

### Operational / actions reports

**Open cases — weekly**
- Concerns awaiting founder decision
- Lost in post cases open and their age
- Verified trader and heritage artisan applications pending review
- Community store upgrade applications pending review

**Seller applications — monthly**
- Applications received vs approved vs declined
- Average time from application to decision

---

| Table | Purpose | Depends on |
|---|---|---|
| listing_favourites | Buyer saved listings (wishlist) | listings, users |
| saved_searches | Buyer saved search + filter state | users, search_events |
| listing_flags | Pre-purchase reports from buyers | listings, users |
| pricing_tiers | Floor, I'll take it, I want to know per listing | listings, negotiation engine |
| pricing_intelligence | Every completed sale. The long term asset. | transactions (50+ needed) |
| provenance_certificates | Generated per transaction. PDF. Immutable chain. | transactions, pdf-lib |
| user_badges | Earned badges per user | badge_definitions |
| badge_definitions | What badges exist and criteria | trust_event_types |
| social_content_templates | Instagram, WhatsApp, Facebook templates | listings |
| social_content_generated | Generated assets per listing | social_content_templates |
| listing_search_trends | Computed weekly from search_events | search_events (volume needed) |
| store_profile | Store name, story, speciality, location, approval | user_profile (seller_type) |
| store_subscriptions | Tier, Stripe subscription, status | store_profile, Stripe billing |

