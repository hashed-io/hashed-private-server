CREATE TABLE "public"."actor" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "name" text, "address" Text, "public_key" text, "security_data" text, PRIMARY KEY ("id") , UNIQUE ("id"), UNIQUE ("name"), UNIQUE ("address"), UNIQUE ("public_key"));COMMENT ON TABLE "public"."actor" IS E'Stores actors, meaning users or groups';
CREATE EXTENSION IF NOT EXISTS pgcrypto;
