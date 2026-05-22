# Almari — Post Launch Backlog

Everything here is fully designed and agreed. Not building it for launch to keep the build fast and focused. Pick these up in order after launch.

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

## Database Tables — Backlog Schema

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

