SET check_function_bodies = false;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';
CREATE TABLE public.login_challenge (
    address text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    challenge text NOT NULL,
    CONSTRAINT "address length" CHECK ((length(address) < 50))
);
COMMENT ON TABLE public.login_challenge IS 'Stores the login challenges sent to the users';
CREATE TABLE public.owned_data (
    id integer NOT NULL,
    owner_user_id uuid NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    type text NOT NULL,
    cid text NOT NULL,
    original_cid text NOT NULL,
    started_at timestamp with time zone NOT NULL,
    ended_at timestamp with time zone,
    is_deleted boolean DEFAULT false NOT NULL
);
COMMENT ON TABLE public.owned_data IS 'Stores information related to user owned data';
CREATE SEQUENCE public.owned_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.owned_data_id_seq OWNED BY public.owned_data.id;
CREATE TABLE public.shared_data (
    id integer NOT NULL,
    from_user_id uuid NOT NULL,
    to_user_id uuid NOT NULL,
    original_owned_data_id integer NOT NULL,
    cid text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    shared_at timestamp with time zone NOT NULL
);
COMMENT ON TABLE public.shared_data IS 'Stores information related to the data that has been shared';
CREATE SEQUENCE public.shared_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.shared_data_id_seq OWNED BY public.shared_data.id;
CREATE TABLE public."user" (
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    address text NOT NULL,
    public_key text,
    security_data text
);
COMMENT ON TABLE public."user" IS 'Stores users';
CREATE VIEW public.user_private AS
 SELECT "user".id AS user_id,
    "user".security_data
   FROM public."user";
ALTER TABLE ONLY public.owned_data ALTER COLUMN id SET DEFAULT nextval('public.owned_data_id_seq'::regclass);
ALTER TABLE ONLY public.shared_data ALTER COLUMN id SET DEFAULT nextval('public.shared_data_id_seq'::regclass);
ALTER TABLE ONLY public.login_challenge
    ADD CONSTRAINT login_challenge_pkey PRIMARY KEY (address);
ALTER TABLE ONLY public.owned_data
    ADD CONSTRAINT owned_data_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.shared_data
    ADD CONSTRAINT shared_data_original_owned_data_id_to_user_id_key UNIQUE (original_owned_data_id, to_user_id);
ALTER TABLE ONLY public.shared_data
    ADD CONSTRAINT shared_data_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_address_key UNIQUE (address);
ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.owned_data
    ADD CONSTRAINT owned_data_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public."user"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.shared_data
    ADD CONSTRAINT shared_data_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public."user"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.shared_data
    ADD CONSTRAINT shared_data_original_owned_data_id_fkey FOREIGN KEY (original_owned_data_id) REFERENCES public.owned_data(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.shared_data
    ADD CONSTRAINT shared_data_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public."user"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
