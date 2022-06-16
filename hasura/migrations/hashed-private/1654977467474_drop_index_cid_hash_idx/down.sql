CREATE  INDEX "cid_hash_idx" on
  "public"."owned_data" using hash ("cid");
