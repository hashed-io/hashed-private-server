CREATE TABLE "public"."role" ("id" integer NOT NULL, "role" text NOT NULL, PRIMARY KEY ("id") , UNIQUE ("id"));COMMENT ON TABLE "public"."role" IS E'A role a user can have within a group';
