# Almari — Pre-release test checklist

Run this on a real device before every build. Should take ~15 minutes.
Ask Claude to run the DB checks (`scripts/pre-release-checks.sql`) at the same time.

---

## 1. Auth

- [ ] Open app fresh (or delete and reinstall). Lands on Get Started screen. Almirah icon visible.
- [ ] Tap Get Started → Register with a new email. OTP arrives. Enter it. Continues to onboarding.
- [ ] Onboarding: enter first name + last initial. Add at least one measurement. Tap Save. Lands on feed.
- [ ] Sign out from Profile. Lands back on Get Started.
- [ ] Sign back in with same email. Goes straight to feed — no onboarding shown again.

---

## 2. Creating a listing

- [ ] Tap Sell tab → Start listing.
- [ ] Step 1: add 4+ photos (minimum), pick category/subcategory, condition, occasion, colour, care status, why selling phrase. Tap Next.
- [ ] Step 2: fill in provenance (city, area, seller type, original price). Add measurements. Tap Next.
- [ ] Pricing screen: firework score shown. Note the score shown (e.g. "39 / 60").
- [ ] Review screen: score shown matches pricing screen exactly. Tap Submit.
- [ ] Success screen: firework matches the score (not a fake full firework).
- [ ] Tap Done → feed loads. New listing visible at the top.
- [ ] Tap the new listing card. Listing detail firework matches what was shown on review screen.
- [ ] **DB check:** Ask Claude — "what is the trust score in the DB for my newest listing?" Should match screen.

---

## 3. Editing a listing

- [ ] Go to Profile → My Listings. Tap Edit on a listing.
- [ ] Change something that improves the score (e.g. add a measurement, add additional notes).
- [ ] Pricing screen shows improved score. Note it.
- [ ] Review screen shows same improved score. Tap Save Changes.
- [ ] Go back to feed. Listing card firework reflects the new score.
- [ ] Tap the listing. Listing detail firework matches.
- [ ] **DB check:** Ask Claude — "what is the trust score in the DB?" Should match screen.

---

## 4. Buy Now flow (requires two accounts — buyer and seller)

- [ ] As buyer: tap Buy Now on an active listing. Confirm screen shows correct price.
- [ ] Tap Place Order. Payment instructions screen appears with PayPal/Revolut details and 20-min countdown.
- [ ] Tap "Done — I've sent payment". Button disappears, shows waiting state.
- [ ] As seller: My Sales shows the order as New. Tap it. Tap Confirm payment received.
- [ ] Seller: enter a tracking number. Tap Mark as dispatched.
- [ ] As buyer: order shows Dispatched with tracking number.
- [ ] Buyer: tap Confirm received. Confirmation alert appears. Confirm.
- [ ] Order status becomes Delivered. Both buyer and seller can see it.
- [ ] After 48 hours (or ask Claude to manually complete it): order shows Completed.
- [ ] **DB check:** Ask Claude — "did the trust score events write for the completed transaction?"

---

## 5. Raise a concern

- [ ] As buyer: on a delivered order, tap Raise a concern.
- [ ] Select a reason. Tap Confirm.
- [ ] Transaction status becomes concern_open.
- [ ] Check that reachalmari@gmail.com received the notification email.

---

## 6. Profile

- [ ] Edit measurements → save → measurements shown correctly.
- [ ] Edit payment details (PayPal/Revolut) → save → Profile shows "Payment set up".
- [ ] Add a delivery address → save → address appears in list.
- [ ] Edit the delivery address → save → updated correctly.
- [ ] KPI row at top of profile shows correct counts for Listings / Purchases / Sales.

---

## 7. Search and feed

- [ ] Home feed loads listings. Tap a listing → detail screen opens.
- [ ] Search tab: type a search term. Results appear.
- [ ] Apply a category filter. Results narrow.
- [ ] Tap Clear. Filters reset, full results shown.
- [ ] Pull to refresh on feed. Feed reloads.

---

## 8. Dark mode

- [ ] Switch device to dark mode.
- [ ] Open app. Feed, listing detail, listing creation, profile — all readable. No white text on white background, no invisible buttons.

---

## DB checks (ask Claude to run these)

At the start of the session:
> "Run the pre-release DB checks"

Claude runs `scripts/pre-release-checks.sql` and reports any failures. Every check should return 0 rows.
