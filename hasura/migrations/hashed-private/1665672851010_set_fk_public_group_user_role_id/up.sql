alter table "public"."group_user"
  add constraint "group_user_role_id_fkey"
  foreign key ("role_id")
  references "public"."role"
  ("id") on update restrict on delete restrict;
