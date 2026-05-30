-- Fix _notif_item_name: INNER JOIN returns no rows when listing has no subcategory,
-- making the function return NULL. NULL || text = NULL in Postgres, which would fail
-- the body NOT NULL constraint and silently roll back the parent transaction UPDATE.
-- Use a scalar subquery + COALESCE to guarantee a non-null return in all cases.

CREATE OR REPLACE FUNCTION _notif_item_name(p_listing_id UUID)
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (SELECT sc.name
     FROM   listings l
     LEFT JOIN subcategories sc ON sc.id = l.subcategory_id
     WHERE  l.id = p_listing_id),
    'your item'
  );
$$;
