CREATE VIEW "public"."actor_private" AS
SELECT
  "actor".id AS actor_id,
  "actor".security_data
FROM
  "actor";
