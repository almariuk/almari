-- Buyers can't see photos or listing data once a listing moves to 'sold'.
-- Extend public read policies to include 'sold' so order detail screens
-- can still load item name and photos after payment is confirmed.
DROP POLICY IF EXISTS listings_public_read ON listings;
CREATE POLICY listings_public_read ON listings
  FOR SELECT
  USING (status = ANY(ARRAY['active','reserved','sold']));

DROP POLICY IF EXISTS listing_photos_public_read ON listing_photos;
CREATE POLICY listing_photos_public_read ON listing_photos
  FOR SELECT
  USING (listing_id IN (
    SELECT id FROM listings
    WHERE status = ANY(ARRAY['active','reserved','sold'])
  ));
