-- User addresses: add DELETE policy so owners can remove their own addresses.
-- No delete UI exists yet but the policy must be in place before it's added.
CREATE POLICY addresses_delete_own ON user_addresses
  FOR DELETE USING (user_id = almari_user_id());
