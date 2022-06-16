CREATE  INDEX "shared_data_cid_hash_idx" on
  "public"."shared_data" using hash ("cid");
