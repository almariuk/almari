# Almari — Post Launch Backlog

Everything here is fully designed and agreed. Not building it for launch to keep the build fast and focused. Pick these up in order after launch.

---

## Pre-launch DB migrations (run in Supabase SQL editor before TestFlight)

### Add `parent_listing_id` to listings
Enables relist chain — traces a piece across multiple listings over time. Trust signal: "this piece has been on Almari before, properly described and photographed."
```sql
ALTER TABLE listings ADD COLUMN parent_listing_id UUID REFERENCES listings(id);
```

### Add `cancellation_reason` to transactions
Required for analytics on failed sales and seller/buyer trust scoring.
```sql
ALTER TABLE transactions ADD COLUMN cancellation_reason TEXT
  CHECK (cancellation_reason IN ('buyer_did_not_pay','seller_did_not_dispatch','mutual_agreement','item_not_as_described','other'));
```

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

### Quick List Option
Minimum viable listing. Photos, category, condition, colour, why selling, one measurement, postage. Live in 3 minutes. Lower trust score shown honestly.

Upgradeable to detailed list any time after posting. Trust score updates in real time.

### Automated Daily Payout Batch
Currently manual via Stripe dashboard. Automate when volume makes manual painful. Edge function runs at 2pm daily. Batches all released escrow per seller. Initiates Stripe payout.

### Lost in Post Case Management UI
Currently: point both parties to Royal Mail directly.
Post launch: full case UI in S15. Both parties confirm agreement in app. Almari initiates refund. Case status tracked.

### Intelligent Seller Intervention
Uses private_seller_motivation data captured at listing.

If listing hasn't sold and motivation is time sensitive (kids grew out of it, moving house) — Almari reaches out privately.
"That offer for £45 — the buyer was genuine. Want us to reach back out to them?"

Requires negotiation engine first.

---

## Priority 6 — Almari Stores

Almari evolves beyond peer-to-peer preloved into a full community marketplace ecosystem. Three tiers of seller, clearly distinguished visually at all times. Community trust is the gate to every tier.

### Tier 1 — Community individual
Current model. Personal wardrobe. 20 listing cap. Diya trust visual. Free.

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

