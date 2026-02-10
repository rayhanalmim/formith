--
-- PostgreSQL database dump
--

\restrict htpGThjvLQDTzC2xdHaNO79dfRybvGEX95IcOqsctVa1l9tDloea3n7Y6sBq4qm

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.0

-- Started on 2026-01-28 19:00:05

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 233 (class 1259 OID 16604)
-- Name: banners; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.banners (
    id uuid NOT NULL,
    title text,
    title_ar text,
    image_url text,
    link_url text,
    is_active boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    created_by text
);


ALTER TABLE public.banners OWNER TO doadmin;

--
-- TOC entry 243 (class 1259 OID 16778)
-- Name: bookmarks; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.bookmarks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    post_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.bookmarks OWNER TO doadmin;

--
-- TOC entry 219 (class 1259 OID 16486)
-- Name: categories; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.categories (
    id uuid NOT NULL,
    name_en text,
    name_ar text,
    description_en text,
    description_ar text,
    icon_url text,
    cover_url text,
    slug text,
    is_active boolean DEFAULT false,
    allow_posting boolean DEFAULT false,
    allow_comments boolean DEFAULT false,
    require_approval boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    posts_count integer DEFAULT 0,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.categories OWNER TO doadmin;

--
-- TOC entry 241 (class 1259 OID 16753)
-- Name: comments; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    parent_id uuid,
    content text NOT NULL,
    likes_count integer DEFAULT 0,
    is_hidden boolean DEFAULT false,
    link_previews jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.comments OWNER TO doadmin;

--
-- TOC entry 229 (class 1259 OID 16573)
-- Name: conversation_participants; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.conversation_participants (
    id uuid NOT NULL,
    conversation_id uuid,
    user_id uuid,
    joined_at timestamp with time zone,
    last_read_at timestamp with time zone,
    deleted_at timestamp with time zone,
    is_pinned boolean DEFAULT false,
    pinned_at timestamp with time zone
);


ALTER TABLE public.conversation_participants OWNER TO doadmin;

--
-- TOC entry 228 (class 1259 OID 16567)
-- Name: conversations; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.conversations (
    id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    last_message_at timestamp with time zone
);


ALTER TABLE public.conversations OWNER TO doadmin;

--
-- TOC entry 230 (class 1259 OID 16580)
-- Name: direct_messages; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.direct_messages (
    id uuid NOT NULL,
    conversation_id uuid,
    sender_id uuid,
    content text,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone,
    read_at timestamp with time zone,
    media_url text,
    media_type text,
    is_deleted boolean DEFAULT false,
    reply_to_id uuid,
    reply_content text,
    reply_sender_id uuid,
    reply_sender_username text,
    reply_sender_display_name text,
    edited_at timestamp with time zone,
    link_previews jsonb
);


ALTER TABLE public.direct_messages OWNER TO doadmin;

--
-- TOC entry 232 (class 1259 OID 16598)
-- Name: dm_hidden_messages; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.dm_hidden_messages (
    id uuid NOT NULL,
    message_id uuid,
    user_id uuid,
    hidden_at timestamp with time zone
);


ALTER TABLE public.dm_hidden_messages OWNER TO doadmin;

--
-- TOC entry 231 (class 1259 OID 16590)
-- Name: dm_reactions; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.dm_reactions (
    id uuid NOT NULL,
    message_id uuid,
    user_id uuid,
    emoji text,
    created_at timestamp with time zone
);


ALTER TABLE public.dm_reactions OWNER TO doadmin;

--
-- TOC entry 249 (class 1259 OID 16881)
-- Name: do_users; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.do_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email text NOT NULL,
    password_hash text,
    password_salt text,
    display_name text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.do_users OWNER TO doadmin;

--
-- TOC entry 234 (class 1259 OID 16614)
-- Name: email_templates; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.email_templates (
    id uuid NOT NULL,
    name text,
    subject text,
    subject_ar text,
    body_html text,
    body_html_ar text,
    variables jsonb,
    is_active boolean DEFAULT false,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    updated_by text
);


ALTER TABLE public.email_templates OWNER TO doadmin;

--
-- TOC entry 220 (class 1259 OID 16500)
-- Name: follows; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.follows (
    id uuid NOT NULL,
    follower_id uuid,
    following_id uuid,
    created_at timestamp with time zone
);


ALTER TABLE public.follows OWNER TO doadmin;

--
-- TOC entry 242 (class 1259 OID 16769)
-- Name: likes; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    post_id uuid,
    comment_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.likes OWNER TO doadmin;

--
-- TOC entry 226 (class 1259 OID 16553)
-- Name: message_reactions; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.message_reactions (
    id uuid NOT NULL,
    message_id uuid,
    user_id uuid,
    emoji text,
    created_at timestamp with time zone
);


ALTER TABLE public.message_reactions OWNER TO doadmin;

--
-- TOC entry 227 (class 1259 OID 16561)
-- Name: message_reads; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.message_reads (
    id uuid NOT NULL,
    message_id uuid,
    user_id uuid,
    read_at timestamp with time zone
);


ALTER TABLE public.message_reads OWNER TO doadmin;

--
-- TOC entry 225 (class 1259 OID 16543)
-- Name: messages; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.messages (
    id uuid NOT NULL,
    room_id uuid,
    user_id uuid,
    content text,
    is_deleted boolean DEFAULT false,
    created_at timestamp with time zone,
    media_url text,
    media_type text,
    is_pinned boolean DEFAULT false,
    pinned_at timestamp with time zone,
    pinned_by text,
    link_previews jsonb
);


ALTER TABLE public.messages OWNER TO doadmin;

--
-- TOC entry 221 (class 1259 OID 16506)
-- Name: notifications; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.notifications (
    id uuid NOT NULL,
    user_id uuid,
    type text,
    title text,
    title_ar text,
    message text,
    message_ar text,
    is_read boolean DEFAULT false,
    data jsonb,
    created_at timestamp with time zone
);


ALTER TABLE public.notifications OWNER TO doadmin;

--
-- TOC entry 239 (class 1259 OID 16728)
-- Name: poll_options; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.poll_options (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    poll_id uuid NOT NULL,
    text text NOT NULL,
    emoji text,
    votes_count integer DEFAULT 0,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.poll_options OWNER TO doadmin;

--
-- TOC entry 240 (class 1259 OID 16742)
-- Name: poll_votes; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.poll_votes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    poll_id uuid NOT NULL,
    option_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.poll_votes OWNER TO doadmin;

--
-- TOC entry 237 (class 1259 OID 16700)
-- Name: post_media; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.post_media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    media_url text NOT NULL,
    media_type text DEFAULT 'image'::text,
    thumbnail_url text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.post_media OWNER TO doadmin;

--
-- TOC entry 238 (class 1259 OID 16714)
-- Name: post_polls; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.post_polls (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    question text NOT NULL,
    poll_type text DEFAULT 'single'::text,
    ends_at timestamp with time zone,
    allow_add_options boolean DEFAULT false,
    goal text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.post_polls OWNER TO doadmin;

--
-- TOC entry 246 (class 1259 OID 16815)
-- Name: post_views; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.post_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.post_views OWNER TO doadmin;

--
-- TOC entry 236 (class 1259 OID 16679)
-- Name: posts; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    slug text,
    category_id uuid,
    likes_count integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    shares_count integer DEFAULT 0,
    views_count integer DEFAULT 0,
    is_approved boolean DEFAULT true,
    is_pinned boolean DEFAULT false,
    is_locked boolean DEFAULT false,
    is_hidden boolean DEFAULT false,
    repost_of_id uuid,
    quote_content text,
    location text,
    feeling text,
    link_previews jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.posts OWNER TO doadmin;

--
-- TOC entry 247 (class 1259 OID 16825)
-- Name: profiles; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    username text,
    display_name text,
    display_name_ar text,
    bio text,
    avatar_url text,
    cover_url text,
    is_verified boolean DEFAULT false,
    is_banned boolean DEFAULT false,
    is_email_verified boolean DEFAULT false,
    ban_reason text,
    followers_count integer DEFAULT 0,
    following_count integer DEFAULT 0,
    posts_count integer DEFAULT 0,
    status text DEFAULT 'online'::text,
    last_seen_at timestamp with time zone DEFAULT now(),
    birthday date,
    gender text,
    birthplace text,
    current_location text,
    relationship_status text,
    show_birthday boolean DEFAULT true,
    show_gender boolean DEFAULT true,
    show_birthplace boolean DEFAULT true,
    show_location boolean DEFAULT true,
    show_relationship boolean DEFAULT true,
    show_joined_date boolean DEFAULT true,
    show_followers_count boolean DEFAULT true,
    show_following_count boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.profiles OWNER TO doadmin;

--
-- TOC entry 245 (class 1259 OID 16802)
-- Name: reports; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reporter_id uuid NOT NULL,
    post_id uuid,
    comment_id uuid,
    user_id uuid,
    reason text NOT NULL,
    status text DEFAULT 'pending'::text,
    resolved_at timestamp with time zone,
    resolved_by uuid,
    resolution_notes text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.reports OWNER TO doadmin;

--
-- TOC entry 224 (class 1259 OID 16535)
-- Name: room_activity_log; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.room_activity_log (
    id uuid NOT NULL,
    room_id uuid,
    user_id uuid,
    target_user_id uuid,
    action_type text,
    details jsonb,
    created_at timestamp with time zone
);


ALTER TABLE public.room_activity_log OWNER TO doadmin;

--
-- TOC entry 244 (class 1259 OID 16788)
-- Name: room_invites; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.room_invites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    room_id uuid NOT NULL,
    invited_user_id uuid NOT NULL,
    invited_by uuid NOT NULL,
    status text DEFAULT 'pending'::text,
    responded_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.room_invites OWNER TO doadmin;

--
-- TOC entry 223 (class 1259 OID 16526)
-- Name: room_members; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.room_members (
    id uuid NOT NULL,
    room_id uuid,
    user_id uuid,
    is_muted boolean DEFAULT false,
    muted_until text,
    muted_by text,
    joined_at timestamp with time zone,
    role text
);


ALTER TABLE public.room_members OWNER TO doadmin;

--
-- TOC entry 222 (class 1259 OID 16515)
-- Name: rooms; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.rooms (
    id uuid NOT NULL,
    name text,
    name_ar text,
    description text,
    description_ar text,
    is_public boolean DEFAULT false,
    is_active boolean DEFAULT false,
    created_by text,
    members_count integer DEFAULT 0,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    slug text
);


ALTER TABLE public.rooms OWNER TO doadmin;

--
-- TOC entry 235 (class 1259 OID 16623)
-- Name: smtp_settings; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.smtp_settings (
    id uuid NOT NULL,
    host text,
    port integer DEFAULT 0,
    username text,
    password text,
    from_email text,
    from_name text,
    use_tls boolean DEFAULT false,
    is_active boolean DEFAULT false,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.smtp_settings OWNER TO doadmin;

--
-- TOC entry 248 (class 1259 OID 16857)
-- Name: user_settings; Type: TABLE; Schema: public; Owner: doadmin
--

CREATE TABLE public.user_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email_notifications boolean DEFAULT true,
    push_notifications boolean DEFAULT true,
    notify_likes boolean DEFAULT true,
    notify_comments boolean DEFAULT true,
    notify_follows boolean DEFAULT true,
    notify_messages boolean DEFAULT true,
    show_online_status boolean DEFAULT true,
    allow_messages_from text DEFAULT 'everyone'::text,
    profile_visibility text DEFAULT 'public'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_settings OWNER TO doadmin;

--
-- TOC entry 4764 (class 0 OID 16604)
-- Dependencies: 233
-- Data for Name: banners; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.banners (id, title, title_ar, image_url, link_url, is_active, sort_order, created_at, updated_at, created_by) FROM stdin;
f9e51be9-e91f-4cb2-9a50-27fd2d7c29ca	Welcome to Tahweel	مرحباً بك في تحويل	/images/tahweel-banner.jpg	https://tahweel.io	t	0	2026-01-25 12:55:55.04935+00	2026-01-25 12:56:30.07486+00	\N
\.


--
-- TOC entry 4774 (class 0 OID 16778)
-- Dependencies: 243
-- Data for Name: bookmarks; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.bookmarks (id, user_id, post_id, created_at) FROM stdin;
fa3a9f60-f710-4616-b269-7cf6db82e988	83add33d-3f10-4910-b160-2ed9733a2c0c	2c6b15bd-30db-4ef2-83c6-5e56c211536f	2026-01-27 22:20:18.762+00
\.


--
-- TOC entry 4750 (class 0 OID 16486)
-- Dependencies: 219
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.categories (id, name_en, name_ar, description_en, description_ar, icon_url, cover_url, slug, is_active, allow_posting, allow_comments, require_approval, sort_order, posts_count, created_at, updated_at) FROM stdin;
b0fc5519-3bd7-49d6-9f8a-d94ce4d0a1c8	Technology	التقنية	Tech news, programming, and gadgets	أخبار التقنية والبرمجة والأجهزة	\N	\N	technology	t	t	t	f	11	0	2026-01-25 11:51:06.001772+00	2026-01-26 14:33:52.9314+00
a1ac67df-7317-4032-8e4f-ee56b7c06d24	Technical Support	الدعم الفني	Technical questions and troubleshooting	الأسئلة التقنية وحل المشكلات	\N	\N	technical-support	t	t	t	f	6	0	2026-01-25 12:11:21.150327+00	2026-01-26 14:33:52.938363+00
4dcaa184-d8b3-4134-89f4-f63be2b4c806	Finance & Business	المال والأعمال	Business, investments, and finance	الأعمال والاستثمارات والمال	\N	\N	finance	t	t	t	f	12	0	2026-01-25 11:51:06.001772+00	2026-01-26 14:33:52.950294+00
cd2e22d1-4d1b-4905-b982-05f7911bd471	eSIM & Top-Up	شرائح eSIM والشحن	eSIM cards and mobile top-up recharges	شرائح eSIM وشحن رصيد الهاتف	\N	\N	esim-topup	t	t	t	f	8	0	2026-01-25 12:11:21.150327+00	2026-01-26 14:33:52.95741+00
abf7c788-ed28-448d-aae4-b11c0d353971	Lifestyle	أسلوب الحياة	Health, travel, and lifestyle topics	الصحة والسفر ومواضيع أسلوب الحياة	\N	\N	lifestyle	t	t	t	f	14	0	2026-01-25 11:51:06.001772+00	2026-01-26 14:33:52.962377+00
15f137f5-5ed2-4eba-a3a7-c2642e175ddc	Tahweel App	تطبيق تحويل			\N	\N	tahweel-app	t	t	t	t	3	0	2026-01-25 17:53:08.783517+00	2026-01-26 14:33:52.954992+00
fb41cf3f-b144-4ad5-af7b-f968417f3c77	News	الأخبار	Current events and news	الأحداث الجارية والأخبار	\N	\N	news	t	t	t	f	1	0	2026-01-25 11:51:06.001772+00	2026-01-26 14:33:52.969691+00
ad4e667c-d980-4e7d-a7f2-603cb9666ebe	Money Transfer	تحويل الأموال	Questions about money transfers and remittances	أسئلة حول التحويلات المالية والحوالات	\N	\N	money-transfer	t	t	t	f	7	0	2026-01-25 12:11:21.150327+00	2026-01-26 14:33:52.976206+00
5701d18d-17b6-431f-864e-696dcef0f0dd	Flight Tickets	تذاكر الطيران	Flight bookings and travel assistance	حجوزات الطيران والمساعدة في السفر	\N	\N	flight-tickets	t	t	t	f	9	0	2026-01-25 12:11:21.150327+00	2026-01-26 14:33:52.973214+00
851af697-5ac6-4a07-bb63-3382ea5904cd	Services	الخدمات	All Tahweel services and features	جميع خدمات ومميزات تحويل	\N	\N	services	t	t	t	f	10	0	2026-01-25 12:11:21.150327+00	2026-01-26 14:33:52.978067+00
b38da79c-6937-4ad2-b1c2-09d017d69dc0	Announcements	الإعلانات	Official announcements and updates	الإعلانات والتحديثات الرسمية	\N	\N	announcements	t	f	t	t	0	0	2026-01-25 12:07:58.075519+00	2026-01-26 21:23:01.437123+00
856e7d54-37a2-492b-b819-28485e45b149	Agents	الوكلاء	Find and connect with Tahweel agents	البحث عن وكلاء تحويل والتواصل معهم	\N	\N	agents	t	t	t	f	5	0	2026-01-25 12:11:21.150327+00	2026-01-26 21:48:44.965608+00
268b2a4c-0440-4f5f-af60-42a39aca0cf5	Gaming	الألعاب	Video games and gaming culture	ألعاب الفيديو وثقافة الألعاب	\N	\N	gaming	t	t	t	f	13	0	2026-01-25 11:51:06.001772+00	2026-01-26 14:33:52.968186+00
4947da8f-12a1-43c0-8e27-294deead9c79	Articles	مقالات			\N	\N	articles	t	t	t	t	2	0	2026-01-26 14:33:09.033443+00	2026-01-26 14:33:52.968238+00
b899182a-298a-4b54-8e65-e8fcf1f46f08	General Discussion	نقاشات عامة	General topics and conversations	مواضيع ومحادثات عامة	\N	\N	general	t	t	t	t	4	0	2026-01-25 11:51:06.001772+00	2026-01-26 21:48:44.965608+00
\.


--
-- TOC entry 4772 (class 0 OID 16753)
-- Dependencies: 241
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.comments (id, post_id, user_id, parent_id, content, likes_count, is_hidden, created_at, updated_at) FROM stdin;
e8b62344-260d-4e3e-a61f-7a67bb165b11	2c6b15bd-30db-4ef2-83c6-5e56c211536f	83add33d-3f10-4910-b160-2ed9733a2c0c	\N	1 comment	0	f	2026-01-27 21:57:34.246+00	2026-01-27 21:57:34.246+00
506d450b-2911-4766-ada1-8ef3f5f8e138	2c6b15bd-30db-4ef2-83c6-5e56c211536f	83add33d-3f10-4910-b160-2ed9733a2c0c	e8b62344-260d-4e3e-a61f-7a67bb165b11	@tahweel_support yes	0	f	2026-01-27 21:57:54.29+00	2026-01-27 21:57:54.29+00
20febc1c-55b4-4e1a-a1fc-9a4775e9af5b	2c6b15bd-30db-4ef2-83c6-5e56c211536f	83add33d-3f10-4910-b160-2ed9733a2c0c	\N	@gcbmarketing979 hello	0	f	2026-01-27 21:58:24.933+00	2026-01-27 21:58:24.933+00
\.


--
-- TOC entry 4760 (class 0 OID 16573)
-- Dependencies: 229
-- Data for Name: conversation_participants; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.conversation_participants (id, conversation_id, user_id, joined_at, last_read_at, deleted_at, is_pinned, pinned_at) FROM stdin;
5d64ed0c-6377-41ad-9bcd-15596a1e6ce4	c4e87c1b-2c54-410b-b089-11d35736a555	6d41990f-3eb0-4185-93e2-68ea4b60d17f	2026-01-25 15:58:23.191522+00	2026-01-25 15:58:23.191522+00	2026-01-25 20:38:18.535287+00	f	\N
83ed328d-41ff-4283-a162-15d52e0b59fc	93decb32-22ac-4d27-b895-21ff6c1d44ed	7e73da3a-84e9-493a-87b6-1e29ce538a59	2026-01-26 17:53:38.866967+00	2026-01-26 17:53:38.866967+00	\N	f	\N
1df7ed16-e0d7-4991-9c66-5fee1d66fd7e	af46be0e-056c-459b-ba0e-96cc6d976cd8	7e73da3a-84e9-493a-87b6-1e29ce538a59	2026-01-26 17:54:18.427572+00	2026-01-26 17:54:18.427572+00	\N	f	\N
9974691d-5a70-44c0-9124-fe24dcdf3618	7c6209e8-b921-4726-b5f6-21e0e54e1d24	b839ed92-a430-4399-9961-ff4055c0a05c	2026-01-26 18:03:22.114633+00	2026-01-26 18:03:22.114633+00	\N	f	\N
631040d3-7a57-4316-ba76-50408c42f2c3	e9bd3cbc-0c4f-4134-b267-d14cc44c8c20	b839ed92-a430-4399-9961-ff4055c0a05c	2026-01-26 19:26:28.320012+00	2026-01-26 19:26:28.320012+00	\N	f	\N
75d8e4c6-bf09-41e9-a0ff-8214bcb455cc	e9bd3cbc-0c4f-4134-b267-d14cc44c8c20	7e73da3a-84e9-493a-87b6-1e29ce538a59	2026-01-26 19:26:28.320012+00	2026-01-26 19:26:28.320012+00	\N	f	\N
71d4d147-285a-485b-89fe-00538fbb79b6	a722598c-ecb0-48af-952e-e88ece8e7740	b839ed92-a430-4399-9961-ff4055c0a05c	2026-01-26 19:28:10.232349+00	2026-01-26 19:28:10.232349+00	\N	f	\N
39bd2881-edbe-42e6-a384-8bfed58cd00e	ea3887ed-0e1d-46c2-b9e6-10908e986478	a1aeba75-0b2c-4f55-a1c5-193430cbc3a6	2026-01-26 21:12:58.754688+00	2026-01-26 21:12:58.754688+00	\N	f	\N
8dc92d06-ac03-4832-ae07-29878ae0327e	2676331f-c99e-4bad-bf00-ce9fcaf565b0	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-25 20:10:25.12893+00	2026-01-25 20:10:25.12893+00	2026-01-27 19:03:18.483+00	f	\N
8cc254bd-6cab-41b8-8271-50421dab885a	7c6209e8-b921-4726-b5f6-21e0e54e1d24	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-26 18:03:22.114633+00	2026-01-26 18:03:22.114633+00	2026-01-27 19:03:54.705+00	f	\N
9680fde4-2247-456a-859e-2a19c2897782	af46be0e-056c-459b-ba0e-96cc6d976cd8	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-26 17:54:18.427572+00	2026-01-26 17:54:18.427572+00	2026-01-27 19:04:10.973+00	f	\N
6f054e5a-fa82-4e7e-82ba-8cbb4be122ce	ea3887ed-0e1d-46c2-b9e6-10908e986478	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-26 21:12:58.754688+00	2026-01-26 21:12:58.754688+00	2026-01-27 19:09:17.58+00	f	\N
9c62e5e1-74a8-46e6-a826-446a8019e4c2	6b428c7a-d366-4d74-a1f2-b7a40a203382	a1aeba75-0b2c-4f55-a1c5-193430cbc3a6	2026-01-27 19:27:08.037+00	\N	\N	f	\N
b24f2b65-4ec6-4eef-b290-d4e3055bdee1	6b428c7a-d366-4d74-a1f2-b7a40a203382	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-27 19:27:08.037+00	\N	2026-01-27 19:36:03.466+00	f	\N
6cb87620-77e6-4ce2-8ebb-ef52899e6877	ea4799a0-5ade-4349-b98f-03d82bc16a21	7e73da3a-84e9-493a-87b6-1e29ce538a59	2026-01-27 19:47:06.738+00	\N	\N	f	\N
6cf2b9c3-9fdc-486e-acb5-0caacbad7150	b5c998c4-670e-4856-aa2e-fe3eb50ec03c	441a00f4-4bf2-4275-8dce-431e879e44d1	2026-01-27 19:47:22.202+00	\N	\N	f	\N
1a4a9b98-4892-4859-bb2e-d8e5514f36f2	de21b7ad-a780-47bd-8436-754aa55713be	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-27 19:47:31.871+00	\N	\N	f	\N
0e05e87c-76d2-431a-b367-b108c9955f92	de21b7ad-a780-47bd-8436-754aa55713be	a1aeba75-0b2c-4f55-a1c5-193430cbc3a6	2026-01-27 19:47:31.871+00	\N	\N	f	\N
9e5f6a26-de9f-411c-940d-9f11465a3fa4	ea4799a0-5ade-4349-b98f-03d82bc16a21	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-27 19:47:06.738+00	\N	2026-01-27 22:28:53.125+00	f	\N
0626cbfa-34c2-4f82-bf21-f45fca0fdd95	b5c998c4-670e-4856-aa2e-fe3eb50ec03c	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-27 19:47:22.202+00	\N	\N	t	2026-01-27 22:29:01.499+00
ab64ce39-37cf-402f-ac7c-ca2210e0a18b	a722598c-ecb0-48af-952e-e88ece8e7740	6d41990f-3eb0-4185-93e2-68ea4b60d17f	2026-01-26 19:28:10.232349+00	2026-01-26 19:28:10.232349+00	2026-01-28 01:07:26.568+00	f	\N
13db64eb-215d-4cfc-b6f3-2504b1a91ecd	93decb32-22ac-4d27-b895-21ff6c1d44ed	6d41990f-3eb0-4185-93e2-68ea4b60d17f	2026-01-26 17:53:38.866967+00	2026-01-26 17:53:38.866967+00	2026-01-28 01:07:29.798+00	f	\N
c3690deb-4851-41b2-b9f4-d7124feb42cb	2676331f-c99e-4bad-bf00-ce9fcaf565b0	6d41990f-3eb0-4185-93e2-68ea4b60d17f	2026-01-25 20:10:25.12893+00	2026-01-25 20:10:25.12893+00	2026-01-28 01:07:32.431+00	f	\N
e366bcf2-a690-455f-b969-46e761042bec	962bf915-1d44-4774-a995-643525ad2896	be029ac3-1218-46da-a573-e9ff4175e30c	2026-01-28 10:48:16.671+00	\N	\N	f	\N
7d9911f0-0446-4489-82f0-a117f094a8ac	962bf915-1d44-4774-a995-643525ad2896	5f041b91-8e66-4734-b52a-4943839b4434	2026-01-28 10:48:16.671+00	\N	\N	f	\N
\.


--
-- TOC entry 4759 (class 0 OID 16567)
-- Dependencies: 228
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.conversations (id, created_at, updated_at, last_message_at) FROM stdin;
c4e87c1b-2c54-410b-b089-11d35736a555	2026-01-25 15:58:23.191522+00	2026-01-25 15:58:23.191522+00	2026-01-25 15:58:23.191522+00
2676331f-c99e-4bad-bf00-ce9fcaf565b0	2026-01-25 20:10:25.12893+00	2026-01-26 00:30:33.95354+00	2026-01-26 00:30:33.95354+00
93decb32-22ac-4d27-b895-21ff6c1d44ed	2026-01-26 17:53:38.866967+00	2026-01-26 17:53:38.866967+00	2026-01-26 17:53:38.866967+00
af46be0e-056c-459b-ba0e-96cc6d976cd8	2026-01-26 17:54:18.427572+00	2026-01-26 19:25:23.852221+00	2026-01-26 19:25:23.852221+00
7c6209e8-b921-4726-b5f6-21e0e54e1d24	2026-01-26 18:03:22.114633+00	2026-01-26 19:27:55.170575+00	2026-01-26 19:27:55.170575+00
a722598c-ecb0-48af-952e-e88ece8e7740	2026-01-26 19:28:10.232349+00	2026-01-26 19:28:10.232349+00	2026-01-26 19:28:10.232349+00
ea3887ed-0e1d-46c2-b9e6-10908e986478	2026-01-26 21:12:58.754688+00	2026-01-26 21:12:58.754688+00	2026-01-26 21:12:58.754688+00
e9bd3cbc-0c4f-4134-b267-d14cc44c8c20	2026-01-26 19:26:28.320012+00	2026-01-26 23:12:18.137828+00	2026-01-26 23:12:18.137828+00
6b428c7a-d366-4d74-a1f2-b7a40a203382	2026-01-27 19:27:08.037+00	2026-01-27 19:27:08.037+00	\N
ea4799a0-5ade-4349-b98f-03d82bc16a21	2026-01-27 19:47:06.738+00	2026-01-27 19:47:06.738+00	\N
b5c998c4-670e-4856-aa2e-fe3eb50ec03c	2026-01-27 19:47:22.202+00	2026-01-27 19:47:22.202+00	\N
de21b7ad-a780-47bd-8436-754aa55713be	2026-01-27 19:47:31.871+00	2026-01-27 19:47:31.871+00	\N
962bf915-1d44-4774-a995-643525ad2896	2026-01-28 10:48:16.671+00	2026-01-28 10:48:16.671+00	\N
\.


--
-- TOC entry 4761 (class 0 OID 16580)
-- Dependencies: 230
-- Data for Name: direct_messages; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.direct_messages (id, conversation_id, sender_id, content, is_read, created_at, read_at, media_url, media_type, is_deleted, reply_to_id, reply_content, reply_sender_id, reply_sender_username, reply_sender_display_name, edited_at) FROM stdin;
ce36a0c8-f371-4681-8c7c-f332772e47ac	2676331f-c99e-4bad-bf00-ce9fcaf565b0	6d41990f-3eb0-4185-93e2-68ea4b60d17f		t	2026-01-25 20:58:50.857579+00	2026-01-25 21:00:54.339+00	\N	\N	t	\N	\N	\N	\N	\N	\N
9dddd8dd-31a3-46a5-a683-97577f0cf4dc	2676331f-c99e-4bad-bf00-ce9fcaf565b0	6d41990f-3eb0-4185-93e2-68ea4b60d17f		t	2026-01-25 20:53:40.414836+00	2026-01-25 20:53:45.242+00	\N	\N	t	\N	\N	\N	\N	\N	\N
ffbfe4f4-6d6a-40bb-b3c8-582e183f5e91	2676331f-c99e-4bad-bf00-ce9fcaf565b0	83add33d-3f10-4910-b160-2ed9733a2c0c		t	2026-01-25 20:53:54.712861+00	2026-01-25 20:57:26.075+00	\N	\N	t	\N	\N	\N	\N	\N	\N
f6e232f0-7e5b-4090-8ca8-621c6706fd94	2676331f-c99e-4bad-bf00-ce9fcaf565b0	83add33d-3f10-4910-b160-2ed9733a2c0c		t	2026-01-25 20:36:10.864886+00	2026-01-25 20:38:20.342+00	\N	\N	t	\N	\N	\N	\N	\N	\N
815559e3-fa5d-465a-a68f-d8ae71a7b574	2676331f-c99e-4bad-bf00-ce9fcaf565b0	83add33d-3f10-4910-b160-2ed9733a2c0c		t	2026-01-25 20:35:55.409055+00	2026-01-25 20:38:20.342+00	\N	\N	t	\N	\N	\N	\N	\N	\N
5d3fc554-9607-4cba-a9e1-a956f20484c4	2676331f-c99e-4bad-bf00-ce9fcaf565b0	83add33d-3f10-4910-b160-2ed9733a2c0c		t	2026-01-25 20:27:04.377164+00	2026-01-25 20:38:20.342+00	\N	\N	t	\N	\N	\N	\N	\N	\N
bf2ea121-3763-4642-8ddf-26ca540d4d50	c4e87c1b-2c54-410b-b089-11d35736a555	83add33d-3f10-4910-b160-2ed9733a2c0c		t	2026-01-25 16:25:56.570043+00	2026-01-25 19:04:00.817+00	\N	\N	t	\N	\N	\N	\N	\N	\N
f70b84f9-ce87-4ba3-a80d-3318c6b7d31a	c4e87c1b-2c54-410b-b089-11d35736a555	83add33d-3f10-4910-b160-2ed9733a2c0c		t	2026-01-25 18:38:13.055012+00	2026-01-25 19:04:00.817+00	\N	\N	t	\N	\N	\N	\N	\N	\N
c26f80d9-6dee-4682-a2c6-c70d3e1a9cc2	c4e87c1b-2c54-410b-b089-11d35736a555	83add33d-3f10-4910-b160-2ed9733a2c0c		t	2026-01-25 18:38:34.700609+00	2026-01-25 19:04:00.817+00	\N	\N	t	\N	\N	\N	\N	\N	\N
61c70979-b319-4a79-93a2-4399185c6186	c4e87c1b-2c54-410b-b089-11d35736a555	83add33d-3f10-4910-b160-2ed9733a2c0c		t	2026-01-25 18:49:52.00647+00	2026-01-25 19:04:00.817+00	https://ijkgxnhxtweovtrhivxx.supabase.co/storage/v1/object/public/dm-media/1769366987217-sbxto.png	image	t	\N	\N	\N	\N	\N	\N
94d2e764-8b7f-49a9-8651-44442b3b515e	c4e87c1b-2c54-410b-b089-11d35736a555	6d41990f-3eb0-4185-93e2-68ea4b60d17f		t	2026-01-25 18:38:27.668262+00	2026-01-25 19:04:15.809+00	\N	\N	t	\N	\N	\N	\N	\N	\N
9887070e-a76f-4128-8a74-e5fef128d760	c4e87c1b-2c54-410b-b089-11d35736a555	6d41990f-3eb0-4185-93e2-68ea4b60d17f		t	2026-01-25 18:50:45.434096+00	2026-01-25 19:04:15.809+00	\N	\N	t	\N	\N	\N	\N	\N	\N
77c140cf-9693-471e-92ea-eed150023262	c4e87c1b-2c54-410b-b089-11d35736a555	6d41990f-3eb0-4185-93e2-68ea4b60d17f		t	2026-01-25 19:04:07.905089+00	2026-01-25 19:04:15.809+00	https://ijkgxnhxtweovtrhivxx.supabase.co/storage/v1/object/public/dm-media/1769366987217-sbxto.png	image	t	\N	\N	\N	\N	\N	\N
bf31aa25-ea12-4d6b-a2b5-93ed769b0607	c4e87c1b-2c54-410b-b089-11d35736a555	83add33d-3f10-4910-b160-2ed9733a2c0c		t	2026-01-25 19:04:36.458867+00	2026-01-25 19:04:42.768+00	\N	\N	t	\N	\N	\N	\N	\N	\N
edc322b9-8fec-4ad8-823a-b163acddd6aa	c4e87c1b-2c54-410b-b089-11d35736a555	6d41990f-3eb0-4185-93e2-68ea4b60d17f		t	2026-01-25 19:04:52.263467+00	2026-01-25 19:05:13.26+00	\N	\N	t	\N	\N	\N	\N	\N	\N
034dfae8-a4b0-4ef3-b991-9d17dfc21807	2676331f-c99e-4bad-bf00-ce9fcaf565b0	83add33d-3f10-4910-b160-2ed9733a2c0c	hello	t	2026-01-25 21:19:48.198785+00	2026-01-25 21:20:20.246+00	\N	\N	f	\N	\N	\N	\N	\N	\N
0083efa2-7d6c-4d6a-ac68-60cbd7da825c	2676331f-c99e-4bad-bf00-ce9fcaf565b0	6d41990f-3eb0-4185-93e2-68ea4b60d17f	mmmm	t	2026-01-25 21:19:57.759537+00	2026-01-25 21:21:36.49+00	\N	\N	f	0d9e5c19-7ef1-4401-9199-e61b877c989d	Hello	83add33d-3f10-4910-b160-2ed9733a2c0c	\N	\N	\N
dfd579d0-6b1f-4ab2-a2a5-164e7aa6cc4d	2676331f-c99e-4bad-bf00-ce9fcaf565b0	6d41990f-3eb0-4185-93e2-68ea4b60d17f	m	t	2026-01-25 21:20:15.038672+00	2026-01-25 21:21:36.49+00	\N	\N	f	\N	\N	\N	\N	\N	\N
b0182a49-6be4-4372-98fd-84c241966c53	2676331f-c99e-4bad-bf00-ce9fcaf565b0	83add33d-3f10-4910-b160-2ed9733a2c0c		t	2026-01-25 20:10:25.500565+00	2026-01-25 20:10:33.837+00	\N	\N	t	\N	\N	\N	\N	\N	\N
95ebbf3f-276e-4952-91d6-4f1458754387	2676331f-c99e-4bad-bf00-ce9fcaf565b0	6d41990f-3eb0-4185-93e2-68ea4b60d17f		t	2026-01-25 20:10:40.523973+00	2026-01-25 20:11:41.922+00	\N	\N	t	b0182a49-6be4-4372-98fd-84c241966c53	miw	83add33d-3f10-4910-b160-2ed9733a2c0c	\N	\N	\N
26d31029-a95d-4d25-bb30-f8cb3ee7beb5	2676331f-c99e-4bad-bf00-ce9fcaf565b0	83add33d-3f10-4910-b160-2ed9733a2c0c		t	2026-01-25 20:13:34.162433+00	2026-01-25 20:14:45.709+00	\N	\N	t	b0182a49-6be4-4372-98fd-84c241966c53	miw	83add33d-3f10-4910-b160-2ed9733a2c0c	\N	\N	\N
0d9e5c19-7ef1-4401-9199-e61b877c989d	2676331f-c99e-4bad-bf00-ce9fcaf565b0	83add33d-3f10-4910-b160-2ed9733a2c0c	Hello	t	2026-01-25 20:20:16.474185+00	2026-01-25 20:38:20.342+00	\N	\N	f	\N	\N	\N	\N	\N	\N
049351c9-6985-48d5-a7f2-20057cb923d6	af46be0e-056c-459b-ba0e-96cc6d976cd8	7e73da3a-84e9-493a-87b6-1e29ce538a59	helloo	t	2026-01-26 17:54:19.985073+00	2026-01-26 17:54:57.132+00	\N	\N	f	\N	\N	\N	\N	\N	\N
f7805b96-6c6a-467d-88ae-36c4b809ff99	af46be0e-056c-459b-ba0e-96cc6d976cd8	83add33d-3f10-4910-b160-2ed9733a2c0c	Hello	t	2026-01-26 17:54:59.980608+00	2026-01-26 17:55:21.784+00	\N	\N	f	\N	\N	\N	\N	\N	\N
89dcdb16-b106-42b2-abe4-6dc161fd80d6	af46be0e-056c-459b-ba0e-96cc6d976cd8	7e73da3a-84e9-493a-87b6-1e29ce538a59	📎 File	t	2026-01-26 17:56:01.02643+00	2026-01-26 17:57:04.015+00	https://ijkgxnhxtweovtrhivxx.supabase.co/storage/v1/object/public/dm-media/1769450154141-ycy417.html	file	f	\N	\N	\N	\N	\N	\N
0d340b52-2e57-4b5d-82f2-fb9c37bd63f9	2676331f-c99e-4bad-bf00-ce9fcaf565b0	83add33d-3f10-4910-b160-2ed9733a2c0c	dsfsdfsdfsdf sdfs df sdf sd fsd f sdf sdfsdfsertert ert er ter t er ter t er ter t er rte	t	2026-01-25 21:21:43.574381+00	2026-01-25 21:22:00.117+00	\N	\N	f	\N	\N	\N	\N	\N	\N
e8c33cb1-3deb-4b50-bfef-23861861cf80	2676331f-c99e-4bad-bf00-ce9fcaf565b0	83add33d-3f10-4910-b160-2ed9733a2c0c	ok	t	2026-01-25 21:21:52.926918+00	2026-01-25 21:22:00.117+00	\N	\N	f	\N	\N	\N	\N	\N	\N
0b4a76f4-a87c-40d3-81c6-a796c8f6005d	2676331f-c99e-4bad-bf00-ce9fcaf565b0	83add33d-3f10-4910-b160-2ed9733a2c0c	test	t	2026-01-25 21:23:02.289498+00	2026-01-25 21:23:10.626+00	\N	\N	f	\N	\N	\N	\N	\N	\N
dfc530e3-b7cc-446f-bfde-ae86c85efb67	2676331f-c99e-4bad-bf00-ce9fcaf565b0	6d41990f-3eb0-4185-93e2-68ea4b60d17f	miii	t	2026-01-25 21:23:17.619846+00	2026-01-25 21:24:01.9+00	\N	\N	f	\N	\N	\N	\N	\N	\N
ff245a54-16a9-47ff-825e-a4a2aeb3e049	2676331f-c99e-4bad-bf00-ce9fcaf565b0	6d41990f-3eb0-4185-93e2-68ea4b60d17f	yes	t	2026-01-25 21:23:29.060447+00	2026-01-25 21:24:01.9+00	\N	\N	f	0d340b52-2e57-4b5d-82f2-fb9c37bd63f9	dsfsdfsdfsdf sdfs df sdf sd fsd f sdf sdfsdfsertert ert er ter t er ter t er ter t er rte	83add33d-3f10-4910-b160-2ed9733a2c0c	\N	\N	\N
c4cab79c-72b4-470e-940a-a65c686e7e1a	2676331f-c99e-4bad-bf00-ce9fcaf565b0	6d41990f-3eb0-4185-93e2-68ea4b60d17f	📷 Image	t	2026-01-25 21:29:49.608566+00	2026-01-25 21:34:11.269+00	https://ijkgxnhxtweovtrhivxx.supabase.co/storage/v1/object/public/dm-media/1769376585996-kik1m.avif	image	f	\N	\N	\N	\N	\N	\N
aecaa9b1-a4be-4c5a-a186-c6d1a84fa354	2676331f-c99e-4bad-bf00-ce9fcaf565b0	83add33d-3f10-4910-b160-2ed9733a2c0c	h	t	2026-01-25 21:54:08.293898+00	2026-01-25 22:36:26.508+00	https://ijkgxnhxtweovtrhivxx.supabase.co/storage/v1/object/public/dm-media/1769378045323-634ltx.webp	file	f	\N	\N	\N	\N	\N	\N
9e5b6926-b0f2-446f-876a-69cd534a8d26	2676331f-c99e-4bad-bf00-ce9fcaf565b0	6d41990f-3eb0-4185-93e2-68ea4b60d17f	📤 تمت مشاركة منشور:\n\n"dsfdsfdsf"\n\n🔗 https://forumth.lovable.app/category/announcements/post/dsfdsfdsf-1769382190	t	2026-01-26 00:30:34.250492+00	2026-01-26 13:34:35.62+00	\N	\N	f	\N	\N	\N	\N	\N	\N
1e4dbe37-882d-462c-b29f-753e751c693c	93decb32-22ac-4d27-b895-21ff6c1d44ed	7e73da3a-84e9-493a-87b6-1e29ce538a59	hellloo	f	2026-01-26 17:53:41.253647+00	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
4e9dc588-dcbe-4e1c-9096-5271271605ff	7c6209e8-b921-4726-b5f6-21e0e54e1d24	83add33d-3f10-4910-b160-2ed9733a2c0c	test	t	2026-01-26 18:03:22.695447+00	2026-01-26 18:04:14.693+00	\N	\N	f	\N	\N	\N	\N	\N	\N
6275c44b-5a7f-4d26-903b-115a19a88a2b	7c6209e8-b921-4726-b5f6-21e0e54e1d24	b839ed92-a430-4399-9961-ff4055c0a05c	test 2	t	2026-01-26 18:04:33.838537+00	2026-01-26 18:05:15.773+00	\N	\N	f	\N	\N	\N	\N	\N	\N
7c7944d5-006d-4329-889e-bd4aa482b2ae	e9bd3cbc-0c4f-4134-b267-d14cc44c8c20	b839ed92-a430-4399-9961-ff4055c0a05c	📤 Shared a post:\n\n"#flowers for #Tahweel @tahweel_support"\n\n🔗 https://forumth.lovable.app/category/agents/post/flowers-for-tahweel-tahweel-support-1769452045	t	2026-01-26 19:26:29.686767+00	2026-01-26 19:27:58.725+00	\N	\N	f	\N	\N	\N	\N	\N	\N
ac1cd25f-0459-4bbd-b7a0-6f0add677487	e9bd3cbc-0c4f-4134-b267-d14cc44c8c20	b839ed92-a430-4399-9961-ff4055c0a05c	📤 Shared a post:\n\n"#flowers for #Tahweel @tahweel_support"\n\n🔗 https://forumth.lovable.app/category/agents/post/flowers-for-tahweel-tahweel-support-1769452045	t	2026-01-26 19:26:49.803512+00	2026-01-26 19:27:58.725+00	\N	\N	f	\N	\N	\N	\N	\N	\N
d860ba04-f1c2-49f0-bdc6-39527eb717f5	7c6209e8-b921-4726-b5f6-21e0e54e1d24	83add33d-3f10-4910-b160-2ed9733a2c0c	miw	t	2026-01-26 18:05:18.261827+00	2026-01-26 19:29:10.138+00	\N	\N	f	\N	\N	\N	\N	\N	\N
3bcfc8a1-4e67-498c-98f1-6bf46b69ebd0	e9bd3cbc-0c4f-4134-b267-d14cc44c8c20	b839ed92-a430-4399-9961-ff4055c0a05c	coucou	t	2026-01-26 19:29:26.338946+00	2026-01-26 19:29:41.544+00	\N	\N	f	\N	\N	\N	\N	\N	\N
5193fbd5-ad02-44f7-9868-46fdf399e219	af46be0e-056c-459b-ba0e-96cc6d976cd8	7e73da3a-84e9-493a-87b6-1e29ce538a59	📤 Shared a post:\n\n"do you like Tahweel?"\n\n🔗 https://forumth.lovable.app/category/general/post/do-you-like-tahweel-1769455031	t	2026-01-26 19:25:26.037722+00	2026-01-26 19:31:03.222+00	\N	\N	f	\N	\N	\N	\N	\N	\N
15b5e277-f982-465e-b431-8fc3eb1f0aae	af46be0e-056c-459b-ba0e-96cc6d976cd8	7e73da3a-84e9-493a-87b6-1e29ce538a59	helloo	t	2026-01-26 19:29:18.015361+00	2026-01-26 19:31:03.222+00	\N	\N	f	\N	\N	\N	\N	\N	\N
7a56a52f-41f6-433d-8ea6-f01628b5dca4	7c6209e8-b921-4726-b5f6-21e0e54e1d24	b839ed92-a430-4399-9961-ff4055c0a05c	📤 Shared a post:\n\n"#flowers for #Tahweel @tahweel_support"\n\n🔗 https://forumth.lovable.app/category/agents/post/flowers-for-tahweel-tahweel-support-1769452045	t	2026-01-26 19:27:06.662056+00	2026-01-26 19:31:17.668+00	\N	\N	f	\N	\N	\N	\N	\N	\N
41a306fd-23b3-4edb-a951-cc984e4efacf	7c6209e8-b921-4726-b5f6-21e0e54e1d24	b839ed92-a430-4399-9961-ff4055c0a05c	📤 Shared a post:\n\n"#flowers for #Tahweel @tahweel_support"\n\n🔗 https://forumth.lovable.app/category/agents/post/flowers-for-tahweel-tahweel-support-1769452045	t	2026-01-26 19:27:55.685968+00	2026-01-26 19:31:17.668+00	\N	\N	f	\N	\N	\N	\N	\N	\N
b6b24d19-82fd-4b5f-be5a-5f796b47f237	7c6209e8-b921-4726-b5f6-21e0e54e1d24	b839ed92-a430-4399-9961-ff4055c0a05c	coucou	t	2026-01-26 19:29:14.946508+00	2026-01-26 19:31:17.668+00	\N	\N	f	\N	\N	\N	\N	\N	\N
16d9b587-b8ce-4958-b8fc-79c52a827a04	af46be0e-056c-459b-ba0e-96cc6d976cd8	83add33d-3f10-4910-b160-2ed9733a2c0c	nnnn	t	2026-01-26 19:31:06.230777+00	2026-01-26 19:31:26.535+00	\N	\N	f	\N	\N	\N	\N	\N	\N
7b0a6330-02c2-44db-9007-35671b03ecac	7c6209e8-b921-4726-b5f6-21e0e54e1d24	83add33d-3f10-4910-b160-2ed9733a2c0c	fgfgf	t	2026-01-26 19:31:20.595122+00	2026-01-26 19:31:47.795+00	\N	\N	f	\N	\N	\N	\N	\N	\N
883f3b22-04a2-4906-8876-3c4bb5ca1c31	7c6209e8-b921-4726-b5f6-21e0e54e1d24	b839ed92-a430-4399-9961-ff4055c0a05c	coucou	t	2026-01-26 19:32:33.200276+00	2026-01-26 19:35:45.579+00	\N	\N	f	\N	\N	\N	\N	\N	\N
97c01598-9f94-4292-90ae-781f31619d88	7c6209e8-b921-4726-b5f6-21e0e54e1d24	b839ed92-a430-4399-9961-ff4055c0a05c	test test	t	2026-01-26 19:32:42.238202+00	2026-01-26 19:35:45.579+00	\N	\N	f	\N	\N	\N	\N	\N	\N
de0afba4-f804-44f8-8df0-be40969c09c9	e9bd3cbc-0c4f-4134-b267-d14cc44c8c20	7e73da3a-84e9-493a-87b6-1e29ce538a59	heyyy	t	2026-01-26 19:31:35.452055+00	2026-01-26 19:33:29.251+00	\N	\N	f	\N	\N	\N	\N	\N	\N
e24b9a52-7b51-45c9-a77a-966d064498a8	af46be0e-056c-459b-ba0e-96cc6d976cd8	7e73da3a-84e9-493a-87b6-1e29ce538a59	oui	t	2026-01-26 19:32:15.087118+00	2026-01-26 19:35:18.707+00	\N	\N	f	\N	\N	\N	\N	\N	\N
8b52f85e-a01a-4385-800c-12a100a1fad5	af46be0e-056c-459b-ba0e-96cc6d976cd8	7e73da3a-84e9-493a-87b6-1e29ce538a59	cava?????? :\\	t	2026-01-26 19:32:27.718994+00	2026-01-26 19:35:18.707+00	\N	\N	f	\N	\N	\N	\N	\N	\N
1fedd56c-ab46-4fde-869d-6db37741656c	af46be0e-056c-459b-ba0e-96cc6d976cd8	7e73da3a-84e9-493a-87b6-1e29ce538a59	allooo	t	2026-01-26 19:34:25.423643+00	2026-01-26 19:35:18.707+00	\N	\N	f	\N	\N	\N	\N	\N	\N
4b6c1508-2523-403c-b330-a142e028942d	e9bd3cbc-0c4f-4134-b267-d14cc44c8c20	b839ed92-a430-4399-9961-ff4055c0a05c	hello	t	2026-01-26 19:33:32.077073+00	2026-01-26 19:33:53.756+00	\N	\N	f	\N	\N	\N	\N	\N	\N
07def361-9345-4a75-9761-c5c613b76b3d	e9bd3cbc-0c4f-4134-b267-d14cc44c8c20	b839ed92-a430-4399-9961-ff4055c0a05c	malak	t	2026-01-26 19:33:38.474344+00	2026-01-26 19:33:53.756+00	\N	\N	f	\N	\N	\N	\N	\N	\N
cd848709-091f-4c3a-afdc-a85d288adfd4	e9bd3cbc-0c4f-4134-b267-d14cc44c8c20	7e73da3a-84e9-493a-87b6-1e29ce538a59	salut	t	2026-01-26 19:33:56.433433+00	2026-01-26 19:34:01.226+00	\N	\N	f	\N	\N	\N	\N	\N	\N
af9f00d8-4fea-4fa8-a727-c95f72bdf57a	e9bd3cbc-0c4f-4134-b267-d14cc44c8c20	7e73da3a-84e9-493a-87b6-1e29ce538a59	cava????	t	2026-01-26 19:34:19.063845+00	2026-01-26 19:34:35.42+00	\N	\N	f	\N	\N	\N	\N	\N	\N
27bada0b-ef10-43f4-8ad1-fdd8a23df84e	e9bd3cbc-0c4f-4134-b267-d14cc44c8c20	b839ed92-a430-4399-9961-ff4055c0a05c	test test	t	2026-01-26 19:34:44.403478+00	2026-01-26 19:34:58.802+00	\N	\N	f	\N	\N	\N	\N	\N	\N
49e40138-dfed-4ca8-aa9c-550fc480fc1b	e9bd3cbc-0c4f-4134-b267-d14cc44c8c20	b839ed92-a430-4399-9961-ff4055c0a05c	📤 Shared a post:\n\n"#flowers for #Tahweel @tahweel_support"\n\n🔗 https://forumth.lovable.app/category/agents/post/flowers-for-tahweel-tahweel-support-1769452045	t	2026-01-26 19:34:57.772047+00	2026-01-26 19:35:06.744+00	\N	\N	f	\N	\N	\N	\N	\N	\N
8105473c-661a-44fb-98e0-72f33bc091a6	af46be0e-056c-459b-ba0e-96cc6d976cd8	83add33d-3f10-4910-b160-2ed9733a2c0c	sdfsdf	t	2026-01-26 19:35:21.045791+00	2026-01-26 19:35:34.39+00	\N	\N	f	\N	\N	\N	\N	\N	\N
41c1e2d0-fa28-49c5-bd5b-13c04b2e7b30	7c6209e8-b921-4726-b5f6-21e0e54e1d24	b839ed92-a430-4399-9961-ff4055c0a05c	hello	t	2026-01-26 19:37:01.995892+00	2026-01-26 19:40:33.067+00	\N	\N	f	\N	\N	\N	\N	\N	\N
2f6cd78f-fc9f-41cd-a266-380cbacccd12	7c6209e8-b921-4726-b5f6-21e0e54e1d24	83add33d-3f10-4910-b160-2ed9733a2c0c	miw	t	2026-01-26 19:40:35.607912+00	2026-01-26 19:41:02.34+00	\N	\N	f	\N	\N	\N	\N	\N	\N
3ea6c355-6824-408e-b703-ce02298f8277	e9bd3cbc-0c4f-4134-b267-d14cc44c8c20	7e73da3a-84e9-493a-87b6-1e29ce538a59	hello	t	2026-01-26 19:46:54.538681+00	2026-01-26 19:47:30.037+00	\N	\N	f	\N	\N	\N	\N	\N	\N
351e5c6e-50e4-47a3-aa85-7b464d53ed1e	e9bd3cbc-0c4f-4134-b267-d14cc44c8c20	b839ed92-a430-4399-9961-ff4055c0a05c	coucou	t	2026-01-26 19:46:52.334996+00	2026-01-26 19:48:12.317+00	\N	\N	f	\N	\N	\N	\N	\N	\N
a1d98288-791d-442f-8926-60d6585390c6	e9bd3cbc-0c4f-4134-b267-d14cc44c8c20	b839ed92-a430-4399-9961-ff4055c0a05c	again	t	2026-01-26 19:47:11.296103+00	2026-01-26 19:48:12.317+00	\N	\N	f	\N	\N	\N	\N	\N	\N
e86d7b9e-affb-464c-9574-e1f81a0a295f	e9bd3cbc-0c4f-4134-b267-d14cc44c8c20	b839ed92-a430-4399-9961-ff4055c0a05c	again	t	2026-01-26 19:47:40.428708+00	2026-01-26 19:48:12.317+00	\N	\N	f	\N	\N	\N	\N	\N	\N
f4473930-195d-4865-8819-7e75e3a68a47	e9bd3cbc-0c4f-4134-b267-d14cc44c8c20	7e73da3a-84e9-493a-87b6-1e29ce538a59	hey	t	2026-01-26 19:48:21.399034+00	2026-01-26 19:48:46.106+00	\N	\N	f	\N	\N	\N	\N	\N	\N
a04d0192-0b00-453d-af75-8734ee5c9989	7c6209e8-b921-4726-b5f6-21e0e54e1d24	b839ed92-a430-4399-9961-ff4055c0a05c	piw	t	2026-01-26 19:41:13.530449+00	2026-01-26 19:48:49.673+00	\N	\N	f	\N	\N	\N	\N	\N	\N
e024ab4a-0ad3-431c-9237-ccc7068a9cae	7c6209e8-b921-4726-b5f6-21e0e54e1d24	b839ed92-a430-4399-9961-ff4055c0a05c	coucou	t	2026-01-26 19:46:46.216487+00	2026-01-26 19:48:49.673+00	\N	\N	f	\N	\N	\N	\N	\N	\N
cf9c06cc-9ec6-460b-ab59-168c5816c532	7c6209e8-b921-4726-b5f6-21e0e54e1d24	b839ed92-a430-4399-9961-ff4055c0a05c	sir	t	2026-01-26 19:47:58.417678+00	2026-01-26 19:48:49.673+00	\N	\N	f	\N	\N	\N	\N	\N	\N
4c1d4eb2-96a5-4415-9fbe-0e54189d397f	af46be0e-056c-459b-ba0e-96cc6d976cd8	7e73da3a-84e9-493a-87b6-1e29ce538a59	hello	t	2026-01-26 19:47:29.059654+00	2026-01-26 19:49:00.88+00	\N	\N	f	\N	\N	\N	\N	\N	\N
7d9225b3-2475-4b07-8f7b-49083cc86a24	af46be0e-056c-459b-ba0e-96cc6d976cd8	7e73da3a-84e9-493a-87b6-1e29ce538a59	text me	t	2026-01-26 19:47:39.883809+00	2026-01-26 19:49:00.88+00	\N	\N	f	\N	\N	\N	\N	\N	\N
06128239-edf8-4ee8-aef3-c7d776f8dbfe	af46be0e-056c-459b-ba0e-96cc6d976cd8	7e73da3a-84e9-493a-87b6-1e29ce538a59	hey	t	2026-01-26 19:48:41.160881+00	2026-01-26 19:49:00.88+00	\N	\N	f	\N	\N	\N	\N	\N	\N
7445c17c-c288-4b13-8233-8e7d32340ed1	e9bd3cbc-0c4f-4134-b267-d14cc44c8c20	b839ed92-a430-4399-9961-ff4055c0a05c	try again please	t	2026-01-26 19:48:59.501228+00	2026-01-26 19:49:40.017+00	\N	\N	f	\N	\N	\N	\N	\N	\N
6635bb84-ab60-406c-93a2-28aeb8dd73a7	e9bd3cbc-0c4f-4134-b267-d14cc44c8c20	b839ed92-a430-4399-9961-ff4055c0a05c	ok	t	2026-01-26 19:49:18.032931+00	2026-01-26 19:49:40.017+00	\N	\N	f	\N	\N	\N	\N	\N	\N
705fa714-ff0b-4935-8837-15256a7f3cde	e9bd3cbc-0c4f-4134-b267-d14cc44c8c20	b839ed92-a430-4399-9961-ff4055c0a05c	again	t	2026-01-26 19:49:27.255134+00	2026-01-26 19:49:40.017+00	\N	\N	f	\N	\N	\N	\N	\N	\N
1d775b5d-48aa-4521-bd86-f7df7d7404a0	af46be0e-056c-459b-ba0e-96cc6d976cd8	83add33d-3f10-4910-b160-2ed9733a2c0c	waaaaaa malak	t	2026-01-26 19:49:05.187921+00	2026-01-26 19:49:43.999+00	\N	\N	f	\N	\N	\N	\N	\N	\N
123b91cf-e5d5-4871-8937-e3a2d739b728	7c6209e8-b921-4726-b5f6-21e0e54e1d24	83add33d-3f10-4910-b160-2ed9733a2c0c	waaa madame	t	2026-01-26 19:48:53.730407+00	2026-01-26 19:50:41.034+00	\N	\N	f	\N	\N	\N	\N	\N	\N
08443f2f-948e-43d5-8a3d-526681026c4c	7c6209e8-b921-4726-b5f6-21e0e54e1d24	83add33d-3f10-4910-b160-2ed9733a2c0c	dsfdsf sdfjsdkfewnsd jdjkds	t	2026-01-26 19:55:27.395196+00	2026-01-26 19:55:53.983+00	\N	\N	f	\N	\N	\N	\N	\N	\N
38bf4453-5374-4e16-a6ed-df2fa4e9936b	7c6209e8-b921-4726-b5f6-21e0e54e1d24	b839ed92-a430-4399-9961-ff4055c0a05c		t	2026-01-26 19:52:26.180167+00	2026-01-26 19:52:41.547+00	https://ijkgxnhxtweovtrhivxx.supabase.co/storage/v1/object/public/dm-media/1769457140027-c7z9f.png	image	t	\N	\N	\N	\N	\N	\N
dff3a0da-8e65-4d92-acbc-806868e9beea	7c6209e8-b921-4726-b5f6-21e0e54e1d24	b839ed92-a430-4399-9961-ff4055c0a05c		t	2026-01-26 19:51:57.363774+00	2026-01-26 19:52:41.547+00	\N	\N	t	\N	\N	\N	\N	\N	\N
bca2823f-f36e-4060-978f-33c56f3b3765	af46be0e-056c-459b-ba0e-96cc6d976cd8	7e73da3a-84e9-493a-87b6-1e29ce538a59	im heeeeeere	t	2026-01-26 19:49:26.211778+00	2026-01-26 19:53:03.303+00	\N	\N	f	\N	\N	\N	\N	\N	\N
db52e298-a25c-46df-a5bc-404c2f736cf7	af46be0e-056c-459b-ba0e-96cc6d976cd8	7e73da3a-84e9-493a-87b6-1e29ce538a59	hellooo	t	2026-01-26 19:49:49.912126+00	2026-01-26 19:53:03.303+00	\N	\N	f	\N	\N	\N	\N	\N	\N
a55df8a7-f3d6-4028-82b2-21a1121ff950	af46be0e-056c-459b-ba0e-96cc6d976cd8	7e73da3a-84e9-493a-87b6-1e29ce538a59	hello	t	2026-01-26 19:51:49.983415+00	2026-01-26 19:53:03.303+00	\N	\N	f	\N	\N	\N	\N	\N	\N
a2d83036-41d8-48f3-8920-a7b13935b4c4	af46be0e-056c-459b-ba0e-96cc6d976cd8	7e73da3a-84e9-493a-87b6-1e29ce538a59	test test tesr	t	2026-01-26 19:52:02.452539+00	2026-01-26 19:53:03.303+00	\N	\N	f	\N	\N	\N	\N	\N	\N
bec743e2-e770-46f1-9ff3-23eff57152d0	7c6209e8-b921-4726-b5f6-21e0e54e1d24	b839ed92-a430-4399-9961-ff4055c0a05c	oui oui mseht	t	2026-01-26 19:53:08.760814+00	2026-01-26 19:53:15.804+00	\N	\N	f	\N	\N	\N	\N	\N	\N
d6eef0f9-cd0a-4398-96b7-8d6f538b8e48	7c6209e8-b921-4726-b5f6-21e0e54e1d24	b839ed92-a430-4399-9961-ff4055c0a05c		t	2026-01-26 19:50:48.776407+00	2026-01-26 19:52:41.547+00	\N	\N	t	\N	\N	\N	\N	\N	\N
0dfcf1ac-6e4c-4264-9587-2830ff8da693	e9bd3cbc-0c4f-4134-b267-d14cc44c8c20	7e73da3a-84e9-493a-87b6-1e29ce538a59	hellooo	t	2026-01-26 19:50:02.563911+00	2026-01-26 19:53:47.006+00	\N	\N	f	\N	\N	\N	\N	\N	\N
86d1a11b-6f4d-415b-9d4c-08f1e21c6de0	7c6209e8-b921-4726-b5f6-21e0e54e1d24	83add33d-3f10-4910-b160-2ed9733a2c0c	msse7i???	t	2026-01-26 19:52:52.34075+00	2026-01-26 19:53:55.9+00	\N	\N	f	\N	\N	\N	\N	\N	\N
9c75be54-378e-4505-abe3-ba9bd1cb3ce7	7c6209e8-b921-4726-b5f6-21e0e54e1d24	83add33d-3f10-4910-b160-2ed9733a2c0c	les messages?	t	2026-01-26 19:52:57.853723+00	2026-01-26 19:53:55.9+00	\N	\N	f	\N	\N	\N	\N	\N	\N
2709bab3-0e51-49f8-9e5e-6d41a617bd8d	7c6209e8-b921-4726-b5f6-21e0e54e1d24	83add33d-3f10-4910-b160-2ed9733a2c0c	ok	t	2026-01-26 19:53:21.912674+00	2026-01-26 19:53:55.9+00	\N	\N	f	\N	\N	\N	\N	\N	\N
5d9c13ba-3eac-41c8-9164-ce663191a751	7c6209e8-b921-4726-b5f6-21e0e54e1d24	83add33d-3f10-4910-b160-2ed9733a2c0c	les messages	t	2026-01-26 19:53:30.570261+00	2026-01-26 19:53:55.9+00	\N	\N	f	\N	\N	\N	\N	\N	\N
b75ceba0-7083-4d08-a976-755d1d125a18	af46be0e-056c-459b-ba0e-96cc6d976cd8	7e73da3a-84e9-493a-87b6-1e29ce538a59	hiiiiiiiiiiii	t	2026-01-26 19:53:20.25675+00	2026-01-26 19:54:16.729+00	\N	\N	f	\N	\N	\N	\N	\N	\N
0b14b644-f88a-41bb-b761-b0c91ad36502	7c6209e8-b921-4726-b5f6-21e0e54e1d24	b839ed92-a430-4399-9961-ff4055c0a05c	test test	t	2026-01-26 19:53:41.565082+00	2026-01-26 19:54:17.555+00	\N	\N	f	\N	\N	\N	\N	\N	\N
5b972ea3-4aed-4f65-b944-81699e0550b5	7c6209e8-b921-4726-b5f6-21e0e54e1d24	b839ed92-a430-4399-9961-ff4055c0a05c	nfes l mochkil	t	2026-01-26 19:56:07.710086+00	2026-01-26 19:56:15.709+00	\N	\N	f	\N	\N	\N	\N	\N	\N
7ee98ee0-58a8-49c3-9704-110f4b115bc6	7c6209e8-b921-4726-b5f6-21e0e54e1d24	b839ed92-a430-4399-9961-ff4055c0a05c	test tesjkjkqsjkqsbkqs	t	2026-01-26 19:56:33.195809+00	2026-01-26 19:56:59.248+00	\N	\N	f	\N	\N	\N	\N	\N	\N
1eee4f27-ca3d-4920-bf92-a4caa7dabb17	7c6209e8-b921-4726-b5f6-21e0e54e1d24	b839ed92-a430-4399-9961-ff4055c0a05c	iojkqioioqpqsiojq ijkqspoqkjsnioxcnjsio idfk,spojksdjkfiosdnjiosd klsdfiosiodfjksoidjn jksdfhioçzpfjze kjsdfosifhs kjhfiorufs kuefozehskdnckjsdjvnskdv ksjdfiosjfoif kjoijsfishkjdfshjkdf ijikosdfhsd ihoijhiosdf khoijsd hiohdfiosdf kjsdhfiosdfihiosdfosdjknfioisdjk hjijhihisdhjsd hiiohsdfhios hisdfihsodfhsdfjkjksdj ijsofuijsoudfjiosdfjkoiiosdf  hiofsjhofghdjdf jkhfoishfs hizeofizefisn uihfoizefhzs ihzefozehf ikhefozs	t	2026-01-26 19:57:28.392342+00	2026-01-26 19:57:38.046+00	\N	\N	f	\N	\N	\N	\N	\N	\N
ed80175c-4ef4-421b-9c25-6cf344c3f0b5	7c6209e8-b921-4726-b5f6-21e0e54e1d24	b839ed92-a430-4399-9961-ff4055c0a05c	jkdikiojjsdjskdiosfhsf ihoqihnfhnfoifhsdf ihoiqefhisdfhohindfo jihoijdoisdjkqdfiosefj izefzuiefoiose uiefoisjdksiosd uiuisdofsiod ioisfjkuisc jsdjc	t	2026-01-26 19:57:56.342694+00	2026-01-26 19:58:07.052+00	\N	\N	f	\N	\N	\N	\N	\N	\N
3922213f-d641-4288-a764-8d55cfcda069	7c6209e8-b921-4726-b5f6-21e0e54e1d24	83add33d-3f10-4910-b160-2ed9733a2c0c	ok	t	2026-01-26 19:58:16.805472+00	2026-01-26 19:58:33.596+00	\N	\N	f	\N	\N	\N	\N	\N	\N
682cde30-4ce4-4ac7-b2b6-e945dd982f3d	7c6209e8-b921-4726-b5f6-21e0e54e1d24	b839ed92-a430-4399-9961-ff4055c0a05c	ok	t	2026-01-26 19:58:35.771985+00	2026-01-26 19:59:08.38+00	\N	\N	f	\N	\N	\N	\N	\N	\N
de8bbe39-6de2-46f3-9fb7-2c9d4751a55f	af46be0e-056c-459b-ba0e-96cc6d976cd8	83add33d-3f10-4910-b160-2ed9733a2c0c	a finnnneeee dskjfjkdsfjksdjkfjksdjkfsdjkfjksd	t	2026-01-26 19:53:12.272732+00	2026-01-26 20:00:07.47+00	\N	\N	f	\N	\N	\N	\N	\N	\N
2e9ce9ef-5c96-4d30-a37e-9dc070c0a0b3	af46be0e-056c-459b-ba0e-96cc6d976cd8	83add33d-3f10-4910-b160-2ed9733a2c0c	siftilia	t	2026-01-26 19:57:35.816237+00	2026-01-26 20:00:07.47+00	\N	\N	f	\N	\N	\N	\N	\N	\N
1708e656-4ece-41eb-b106-89f6a005b347	e9bd3cbc-0c4f-4134-b267-d14cc44c8c20	b839ed92-a430-4399-9961-ff4055c0a05c	heeey	t	2026-01-26 19:53:51.70187+00	2026-01-26 20:00:30.153+00	\N	\N	f	\N	\N	\N	\N	\N	\N
a594b816-2aef-4d45-861c-4a91c5385150	e9bd3cbc-0c4f-4134-b267-d14cc44c8c20	7e73da3a-84e9-493a-87b6-1e29ce538a59	again text	t	2026-01-26 20:00:38.252422+00	2026-01-26 20:02:08.873+00	\N	\N	f	\N	\N	\N	\N	\N	\N
db0d47cb-c576-42a8-8507-3a60aaf3a8df	af46be0e-056c-459b-ba0e-96cc6d976cd8	7e73da3a-84e9-493a-87b6-1e29ce538a59	hii	t	2026-01-26 20:00:12.139774+00	2026-01-26 20:00:45.411+00	\N	\N	f	\N	\N	\N	\N	\N	\N
5c3c3ce2-b4b4-4151-86b0-51ffdef18e99	af46be0e-056c-459b-ba0e-96cc6d976cd8	7e73da3a-84e9-493a-87b6-1e29ce538a59	m here	t	2026-01-26 20:00:19.935154+00	2026-01-26 20:00:45.411+00	\N	\N	f	\N	\N	\N	\N	\N	\N
232f759b-ccda-427c-a6a0-90fe0abc1785	7c6209e8-b921-4726-b5f6-21e0e54e1d24	83add33d-3f10-4910-b160-2ed9733a2c0c	Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.	t	2026-01-26 19:59:28.492448+00	2026-01-26 20:01:16.54+00	\N	\N	f	\N	\N	\N	\N	\N	\N
09ae2d9a-dbb5-4abd-a7ae-8fc3ef71a3ca	e9bd3cbc-0c4f-4134-b267-d14cc44c8c20	b839ed92-a430-4399-9961-ff4055c0a05c	oj	t	2026-01-26 20:02:18.1166+00	2026-01-26 20:03:26.033+00	\N	\N	f	\N	\N	\N	\N	\N	\N
adb21fb6-f56a-4683-b38b-03b39a7c959a	7c6209e8-b921-4726-b5f6-21e0e54e1d24	b839ed92-a430-4399-9961-ff4055c0a05c	WALO db hta ltht mab9awch kaywslo	t	2026-01-26 20:03:01.141351+00	2026-01-26 20:04:42.126+00	\N	\N	f	\N	\N	\N	\N	\N	\N
4f6d5e5f-8642-45cd-a895-d61aacb01c42	7c6209e8-b921-4726-b5f6-21e0e54e1d24	83add33d-3f10-4910-b160-2ed9733a2c0c	ok	t	2026-01-26 20:05:08.072901+00	2026-01-26 20:08:53.321+00	\N	\N	f	\N	\N	\N	\N	\N	\N
045f9630-c836-42dc-9389-63eae37cb255	7c6209e8-b921-4726-b5f6-21e0e54e1d24	b839ed92-a430-4399-9961-ff4055c0a05c	okeey	t	2026-01-26 20:08:59.820362+00	2026-01-26 20:24:08.979+00	\N	\N	f	\N	\N	\N	\N	\N	\N
a04bbe2b-834a-4382-8743-4ce434255af0	ea3887ed-0e1d-46c2-b9e6-10908e986478	a1aeba75-0b2c-4f55-a1c5-193430cbc3a6	hello	t	2026-01-26 21:13:11.0058+00	2026-01-26 22:59:25.758+00	\N	\N	f	\N	\N	\N	\N	\N	\N
0a6ef1da-8ec6-4cca-896a-2dac69c5c198	ea3887ed-0e1d-46c2-b9e6-10908e986478	83add33d-3f10-4910-b160-2ed9733a2c0c	hello	t	2026-01-26 22:59:29.01086+00	2026-01-26 22:59:37.365+00	\N	\N	f	\N	\N	\N	\N	\N	\N
387da627-ad63-4b4b-80f0-d3f09711e3ca	7c6209e8-b921-4726-b5f6-21e0e54e1d24	83add33d-3f10-4910-b160-2ed9733a2c0c	everything is okay?	t	2026-01-26 20:24:15.351393+00	2026-01-26 23:11:11.235+00	\N	\N	f	\N	\N	\N	\N	\N	\N
9dbc3d6c-f8c2-4185-a492-34fd24613faa	e9bd3cbc-0c4f-4134-b267-d14cc44c8c20	b839ed92-a430-4399-9961-ff4055c0a05c	lolo	t	2026-01-26 20:05:22.344892+00	2026-01-26 23:48:34.455+00	\N	\N	f	\N	\N	\N	\N	\N	\N
6755c24c-9b25-4ef7-a2d4-df7e6f59525c	e9bd3cbc-0c4f-4134-b267-d14cc44c8c20	b839ed92-a430-4399-9961-ff4055c0a05c	hello	t	2026-01-26 23:12:18.425213+00	2026-01-26 23:48:34.455+00	\N	\N	f	\N	\N	\N	\N	\N	\N
1868edc0-ffbf-42c5-b5cd-e4fb7faa0de9	7c6209e8-b921-4726-b5f6-21e0e54e1d24	b839ed92-a430-4399-9961-ff4055c0a05c	i dont think sir	t	2026-01-26 23:11:28.261699+00	2026-01-26 23:48:41.861+00	\N	\N	f	\N	\N	\N	\N	\N	\N
31dbb5ba-f3e0-4862-9205-4318642e4844	7c6209e8-b921-4726-b5f6-21e0e54e1d24	83add33d-3f10-4910-b160-2ed9733a2c0c	mazal man3sti hahahaa	f	2026-01-26 23:48:49.953893+00	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
07df190b-a7f0-4009-a684-2201fa40434b	e9bd3cbc-0c4f-4134-b267-d14cc44c8c20	7e73da3a-84e9-493a-87b6-1e29ce538a59	i can receive the texrs and the little number icons	f	2026-01-26 23:49:10.862901+00	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
5167152c-fbed-4643-ae13-c5a4dd6b6047	af46be0e-056c-459b-ba0e-96cc6d976cd8	83add33d-3f10-4910-b160-2ed9733a2c0c	here	t	2026-01-26 20:04:39.044171+00	2026-01-26 23:49:14.079+00	\N	\N	f	\N	\N	\N	\N	\N	\N
52d88dee-8b6f-44b4-a0cb-1df0ac75786d	ea3887ed-0e1d-46c2-b9e6-10908e986478	a1aeba75-0b2c-4f55-a1c5-193430cbc3a6		t	2026-01-26 23:53:36.931665+00	2026-01-27 17:34:35.066+00	https://tahweelbookbucket.sfo3.digitaloceanspaces.com/messages/a1aeba75-0b2c-4f55-a1c5-193430cbc3a6/1769471615825-zg1uze.webm	voice	t	\N	\N	\N	\N	\N	\N
ac8efc45-2063-4472-bcdd-0b8b3a124533	ea3887ed-0e1d-46c2-b9e6-10908e986478	a1aeba75-0b2c-4f55-a1c5-193430cbc3a6		t	2026-01-26 23:53:18.709195+00	2026-01-27 17:34:35.066+00	https://tahweelbookbucket.sfo3.digitaloceanspaces.com/messages/a1aeba75-0b2c-4f55-a1c5-193430cbc3a6/1769471597592-l3sxp8.webm	voice	t	\N	\N	\N	\N	\N	\N
b0f834a6-11a3-466e-9bf5-a1d805ee3a3f	ea3887ed-0e1d-46c2-b9e6-10908e986478	a1aeba75-0b2c-4f55-a1c5-193430cbc3a6	/stickers/tahweel-boy-08.avif	t	2026-01-27 15:08:43.130923+00	2026-01-27 17:34:35.066+00	\N	\N	f	\N	\N	\N	\N	\N	\N
07cb792c-b2d3-4a21-9046-a60e857dafc2	ea3887ed-0e1d-46c2-b9e6-10908e986478	a1aeba75-0b2c-4f55-a1c5-193430cbc3a6	😀	t	2026-01-27 15:32:23.216859+00	2026-01-27 17:34:35.066+00	\N	\N	f	\N	\N	\N	\N	\N	\N
02c4c24c-d12c-4bb8-a677-3d5bf4e5417e	ea3887ed-0e1d-46c2-b9e6-10908e986478	a1aeba75-0b2c-4f55-a1c5-193430cbc3a6	🐮	t	2026-01-27 15:32:32.298931+00	2026-01-27 17:34:35.066+00	\N	\N	f	\N	\N	\N	\N	\N	\N
69342b0f-e8bc-4336-9e59-4339f3841e72	ea3887ed-0e1d-46c2-b9e6-10908e986478	83add33d-3f10-4910-b160-2ed9733a2c0c	{"encrypted":true,"version":1,"ciphertext":"/iBWjxPlR/csaZRk7RtPHyfiYTui8LeHcdGrHy69gA==","mediaEncrypted":false}	f	\N	\N	\N	encrypted_file	f	\N	\N	\N	\N	\N	\N
08d7a72f-7b6d-4cb4-a35d-35ccc6d48ab4	ea3887ed-0e1d-46c2-b9e6-10908e986478	83add33d-3f10-4910-b160-2ed9733a2c0c	{"encrypted":true,"version":1,"ciphertext":"896dNvnUvRhKhhucwIU1aUK2bNOGjYOWum72Kx6RdA==","mediaEncrypted":false}	f	\N	\N	\N	encrypted_file	f	\N	\N	\N	\N	\N	\N
92894586-2261-4935-ad33-cf3ef0c56f50	ea3887ed-0e1d-46c2-b9e6-10908e986478	83add33d-3f10-4910-b160-2ed9733a2c0c	{"encrypted":true,"version":1,"ciphertext":"3zTpzAOV6y9ih/39egjFWFXvbv2zKMLWAmwo/SbVRA==","mediaEncrypted":false}	f	\N	\N	\N	encrypted_file	f	\N	\N	\N	\N	\N	\N
823feb3f-18aa-4a46-924f-cb135399f60f	7c6209e8-b921-4726-b5f6-21e0e54e1d24	83add33d-3f10-4910-b160-2ed9733a2c0c	{"encrypted":true,"version":1,"ciphertext":"1dOWgU3ktVJFypZHxm/tnYRucl7S+fqgcbTD9qZl12kA","mediaEncrypted":false}	f	\N	\N	\N	encrypted_file	f	\N	\N	\N	\N	\N	\N
ca6fcc9b-a2c1-4258-b3a9-fb7d7ce83449	7c6209e8-b921-4726-b5f6-21e0e54e1d24	83add33d-3f10-4910-b160-2ed9733a2c0c	{"encrypted":true,"version":1,"ciphertext":"Ac6sV0uniiOJoysCA7s09KGawbW5hkoZBWQu3vFf6VTAtQ9q9A==","mediaEncrypted":false}	f	\N	\N	\N	encrypted_file	f	\N	\N	\N	\N	\N	\N
69ee95eb-df5f-40d6-b80c-805068e9fa57	7c6209e8-b921-4726-b5f6-21e0e54e1d24	83add33d-3f10-4910-b160-2ed9733a2c0c	{"encrypted":true,"version":1,"ciphertext":"Em/pkmIdAxbSCsBWB1rcYtsaiDAWnOT0GQJ2Hh9hS9D2sWutPQ==","mediaEncrypted":false}	f	\N	\N	\N	encrypted_file	f	\N	\N	\N	\N	\N	\N
b26180f0-1383-4655-a809-f75d3112dbeb	7c6209e8-b921-4726-b5f6-21e0e54e1d24	83add33d-3f10-4910-b160-2ed9733a2c0c	{"encrypted":true,"version":1,"ciphertext":"qJHEC6rueIJXWxesFINhg9vo+XT+RYOZ2EjpXtR9M1g=","mediaEncrypted":false}	f	\N	\N	\N	encrypted_image	f	\N	\N	\N	\N	\N	\N
f47f67e0-95db-4b5a-a09b-25aa64472ed8	7c6209e8-b921-4726-b5f6-21e0e54e1d24	83add33d-3f10-4910-b160-2ed9733a2c0c	{"encrypted":true,"version":1,"ciphertext":"d5A2rw9BxW+7tMn0DpiQK9eqXmWsc7XLdh7h0nS6XpSDwaIqWGw=","mediaEncrypted":false}	f	\N	\N	\N	encrypted_image	f	\N	\N	\N	\N	\N	\N
1536286d-2192-4a88-b8e6-106ec38427ca	7c6209e8-b921-4726-b5f6-21e0e54e1d24	83add33d-3f10-4910-b160-2ed9733a2c0c	{"encrypted":true,"version":1,"ciphertext":"kLxx/nliiHNw+GuzC4iSeB8comANW9Qk9ZKdECr1nOhzzJ347+4=","mediaEncrypted":false}	f	\N	\N	\N	encrypted_file	f	\N	\N	\N	\N	\N	\N
a3650588-3eeb-458c-9510-a723678b5aa7	ea3887ed-0e1d-46c2-b9e6-10908e986478	83add33d-3f10-4910-b160-2ed9733a2c0c	{"encrypted":true,"version":1,"ciphertext":"2o0kWGzmeR997qoJlMjJgpm6l7Zo4dR5aqP935gRjkFrrFsZcA8=","mediaEncrypted":true,"originalMediaType":"image/png"}	f	2026-01-27 19:07:23.496+00	\N	https://tahweelbookbucket.sfo3.digitaloceanspaces.com/messages/83add33d-3f10-4910-b160-2ed9733a2c0c/1769540842790-mzawe.enc	encrypted_image	f	\N	\N	\N	\N	\N	\N
8166cff4-705d-4b21-b605-35c1dc20a54c	7b9d3c33-a435-4130-a383-8b91183687e5	83add33d-3f10-4910-b160-2ed9733a2c0c	test	f	2026-01-27 19:17:14.327+00	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
f869f136-df07-4798-99c3-fa33e13d6c71	7b9d3c33-a435-4130-a383-8b91183687e5	83add33d-3f10-4910-b160-2ed9733a2c0c	test	f	2026-01-27 19:17:29.057+00	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
053b0db4-8881-4f33-a05e-39341ffc15ac	7b9d3c33-a435-4130-a383-8b91183687e5	83add33d-3f10-4910-b160-2ed9733a2c0c	Salt	f	2026-01-27 19:22:41.11+00	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
57433c2e-14e4-4343-a9d2-445d5182fd77	6b428c7a-d366-4d74-a1f2-b7a40a203382	83add33d-3f10-4910-b160-2ed9733a2c0c	Hello	f	2026-01-27 19:27:10.815+00	\N	\N	\N	t	\N	\N	\N	\N	\N	\N
b3c6d79b-0504-413f-bbe4-ce6dd946dc1a	6b428c7a-d366-4d74-a1f2-b7a40a203382	83add33d-3f10-4910-b160-2ed9733a2c0c	{"encrypted":true,"version":1,"ciphertext":"ZQGLOAI+wwWDTxwJ2lnJZxRNOuEsFiU0RRg12xCRvDqW","mediaEncrypted":false}	f	2026-01-27 19:27:29.855+00	\N	\N	encrypted_file	t	\N	\N	\N	\N	\N	\N
26c4b3f6-ed06-49bb-ac36-9b538bac4ee9	de21b7ad-a780-47bd-8436-754aa55713be	83add33d-3f10-4910-b160-2ed9733a2c0c	{"encrypted":true,"version":1,"ciphertext":"StBBlxb0cjBoNHWw1Nnvb2Zu9oJe5vV9IyrxxQlmoWU=","mediaEncrypted":false}	f	2026-01-27 19:47:55.836+00	\N	\N	encrypted_file	f	\N	\N	\N	\N	\N	\N
8ff21394-9a9b-4b38-86d7-2a61ce277f40	de21b7ad-a780-47bd-8436-754aa55713be	83add33d-3f10-4910-b160-2ed9733a2c0c	{"encrypted":true,"version":1,"ciphertext":"PF0v1QfbpRfiMHd6ediF3LHjsf9MtzGKSs/dLlWxSVCBGyjZO8w=","mediaEncrypted":true,"originalMediaType":"image/png"}	f	2026-01-27 19:48:09.783+00	\N	https://tahweelbookbucket.sfo3.digitaloceanspaces.com/messages/83add33d-3f10-4910-b160-2ed9733a2c0c/1769543288817-u5e5v.enc	encrypted_image	f	\N	\N	\N	\N	\N	\N
d1c31c21-d9a7-415f-87d0-e55396b4ab15	de21b7ad-a780-47bd-8436-754aa55713be	83add33d-3f10-4910-b160-2ed9733a2c0c	📤 Shared a post:\n\n"Assalmu alaykum first post 😀"\n\n🔗 https://forumth.lovable.app/category/announcements/post/6b37a21e-004a-4e0a-bad3-d95c38c2373b	f	2026-01-27 20:10:05.812+00	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
5a81ee6c-e7db-4762-a50a-d05b6083c22f	b5c998c4-670e-4856-aa2e-fe3eb50ec03c	83add33d-3f10-4910-b160-2ed9733a2c0c	📤 تمت مشاركة منشور:\n\n"Assalmu alaykum first post 😀"\n\n🔗 http://localhost:8080/category/announcements/post/6b37a21e-004a-4e0a-bad3-d95c38c2373b	f	2026-01-27 20:40:03.455+00	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
7699bfac-5546-42e9-8903-0a0a27c87c48	de21b7ad-a780-47bd-8436-754aa55713be	83add33d-3f10-4910-b160-2ed9733a2c0c	📤 تمت مشاركة منشور:\n\n"Assalmu alaykum first post 😀"\n\n🔗 http://localhost:8080/category/announcements/post/6b37a21e-004a-4e0a-bad3-d95c38c2373b	f	2026-01-27 20:59:12.504+00	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
b3831379-c941-44e1-8d53-a30654afb030	de21b7ad-a780-47bd-8436-754aa55713be	83add33d-3f10-4910-b160-2ed9733a2c0c	📤 Shared a post:\n\n"Hello dear"\n\n🔗 https://forumth.lovable.app/category/news/post/2c6b15bd-30db-4ef2-83c6-5e56c211536f	f	2026-01-27 21:29:25.533+00	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
bdf8f00c-0daa-4fcd-940c-1bd70f82b694	ea4799a0-5ade-4349-b98f-03d82bc16a21	83add33d-3f10-4910-b160-2ed9733a2c0c	📤 تمت مشاركة منشور:\n\n"post localhost"\n\n🔗 http://localhost:8081/post/f4b09362-5a79-40db-b71a-45517941a6fd	f	2026-01-27 21:32:28.94+00	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
b16f0628-d35c-4435-8d8d-cc15904ee805	ea4799a0-5ade-4349-b98f-03d82bc16a21	83add33d-3f10-4910-b160-2ed9733a2c0c	📤 تمت مشاركة منشور:\n\n"post localhost"\n\n🔗 http://localhost:8081/post/f4b09362-5a79-40db-b71a-45517941a6fd	f	2026-01-27 21:33:48.059+00	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
c83a9486-acc3-4763-a68c-2665b044ba01	a722598c-ecb0-48af-952e-e88ece8e7740	b839ed92-a430-4399-9961-ff4055c0a05c	📤 Shared a post:\n\n"#flowers for #Tahweel @tahweel_support"\n\n🔗 https://forumth.lovable.app/category/agents/post/flowers-for-tahweel-tahweel-support-1769452045	t	2026-01-26 19:28:10.64556+00	2026-01-28 01:07:14.661+00	\N	\N	f	\N	\N	\N	\N	\N	\N
\.


--
-- TOC entry 4763 (class 0 OID 16598)
-- Dependencies: 232
-- Data for Name: dm_hidden_messages; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.dm_hidden_messages (id, message_id, user_id, hidden_at) FROM stdin;
4558b9cb-44c9-4d2a-b4d2-ea5e3d384ff4	95ebbf3f-276e-4952-91d6-4f1458754387	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-25 20:18:34.726644+00
\.


--
-- TOC entry 4762 (class 0 OID 16590)
-- Dependencies: 231
-- Data for Name: dm_reactions; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.dm_reactions (id, message_id, user_id, emoji, created_at) FROM stdin;
62e189a1-48e6-4466-a346-5f89986d4721	f6e232f0-7e5b-4090-8ca8-621c6706fd94	6d41990f-3eb0-4185-93e2-68ea4b60d17f	🎉	2026-01-25 20:38:29.80349+00
dec3e1c7-0e10-4e23-9765-56db53d1b7a1	815559e3-fa5d-465a-a68f-d8ae71a7b574	6d41990f-3eb0-4185-93e2-68ea4b60d17f	❤️	2026-01-25 20:38:34.234593+00
f7dbc156-d3c0-4431-bfe5-190acc1c0f81	815559e3-fa5d-465a-a68f-d8ae71a7b574	83add33d-3f10-4910-b160-2ed9733a2c0c	😍	2026-01-25 20:39:46.993651+00
f51b2e63-9744-447e-8e8e-90478d7d704c	9dddd8dd-31a3-46a5-a683-97577f0cf4dc	83add33d-3f10-4910-b160-2ed9733a2c0c	❤️	2026-01-25 20:57:16.508467+00
d509193e-ddc9-4a77-a09f-904d4f044862	f6e232f0-7e5b-4090-8ca8-621c6706fd94	6d41990f-3eb0-4185-93e2-68ea4b60d17f	😮	2026-01-25 20:58:40.827843+00
0f66fbd1-e0a2-4810-96c3-989bf7487c43	f6e232f0-7e5b-4090-8ca8-621c6706fd94	6d41990f-3eb0-4185-93e2-68ea4b60d17f	👏	2026-01-25 20:58:43.718633+00
50886c73-26cf-48dc-a8b6-9afe4da5ec34	ffbfe4f4-6d6a-40bb-b3c8-582e183f5e91	6d41990f-3eb0-4185-93e2-68ea4b60d17f	🔥	2026-01-25 21:05:16.66058+00
cf0ba0f2-9a70-42be-a1eb-5a9663e5d048	ffbfe4f4-6d6a-40bb-b3c8-582e183f5e91	6d41990f-3eb0-4185-93e2-68ea4b60d17f	❤️	2026-01-25 21:09:34.25769+00
4c7de278-5137-416d-993f-62b09346b931	ffbfe4f4-6d6a-40bb-b3c8-582e183f5e91	83add33d-3f10-4910-b160-2ed9733a2c0c	❤️	2026-01-25 21:09:59.471595+00
3df7560e-f8a3-44ca-8c16-43f858dddcd5	9dddd8dd-31a3-46a5-a683-97577f0cf4dc	83add33d-3f10-4910-b160-2ed9733a2c0c	👎	2026-01-25 21:10:12.131322+00
8b56169c-21ac-4ff4-a097-e8a6cb8a4ee8	dfc530e3-b7cc-446f-bfde-ae86c85efb67	83add33d-3f10-4910-b160-2ed9733a2c0c	👍	2026-01-25 21:24:06.55314+00
253b3f4e-ce57-4289-a4be-d05c5a9af885	0b4a76f4-a87c-40d3-81c6-a796c8f6005d	83add33d-3f10-4910-b160-2ed9733a2c0c	👍	2026-01-25 21:24:10.209232+00
8df68039-21d4-49ef-a293-84b4583982af	0b4a76f4-a87c-40d3-81c6-a796c8f6005d	6d41990f-3eb0-4185-93e2-68ea4b60d17f	❤️	2026-01-25 21:27:20.964995+00
5d4dcd01-2b6d-4d79-922a-da5313c48fa1	0b4a76f4-a87c-40d3-81c6-a796c8f6005d	83add33d-3f10-4910-b160-2ed9733a2c0c	❤️	2026-01-25 21:27:26.562556+00
3fa7e838-ff94-4fd9-89aa-34ac45d986be	e8c33cb1-3deb-4b50-bfef-23861861cf80	83add33d-3f10-4910-b160-2ed9733a2c0c	🔥	2026-01-25 21:27:36.263505+00
53767ac7-af0f-4798-801f-1a808af78ac8	ff245a54-16a9-47ff-825e-a4a2aeb3e049	83add33d-3f10-4910-b160-2ed9733a2c0c	❤️	2026-01-25 21:34:15.94718+00
06721e03-1838-4c0d-9ed7-798ee97fa71a	aecaa9b1-a4be-4c5a-a186-c6d1a84fa354	6d41990f-3eb0-4185-93e2-68ea4b60d17f	👍	2026-01-25 22:36:29.714232+00
b8279059-bd8b-4db0-9af2-19caea3cdb45	aecaa9b1-a4be-4c5a-a186-c6d1a84fa354	6d41990f-3eb0-4185-93e2-68ea4b60d17f	❤️	2026-01-25 22:36:51.658739+00
024aec6e-1d60-42f1-ad85-07857e7ec9f6	049351c9-6985-48d5-a7f2-20057cb923d6	83add33d-3f10-4910-b160-2ed9733a2c0c	🎉	2026-01-26 17:55:29.696862+00
8daec540-ee05-4cb2-88ef-4255fc6aa8db	f7805b96-6c6a-467d-88ae-36c4b809ff99	7e73da3a-84e9-493a-87b6-1e29ce538a59	👍	2026-01-26 17:56:15.907861+00
83baf402-7c16-4b92-bb10-1061ab788750	89dcdb16-b106-42b2-abe4-6dc161fd80d6	83add33d-3f10-4910-b160-2ed9733a2c0c	❤️	2026-01-26 17:57:08.272173+00
b166ad4e-c89d-4be3-b2f9-3ccd5f04288a	ac1cd25f-0459-4bbd-b7a0-6f0add677487	7e73da3a-84e9-493a-87b6-1e29ce538a59	❤️	2026-01-26 19:28:19.558341+00
1d0482cc-3111-4868-b197-7b6711753fdd	ac1cd25f-0459-4bbd-b7a0-6f0add677487	b839ed92-a430-4399-9961-ff4055c0a05c	❤️	2026-01-26 19:29:05.080652+00
0a71291b-e778-45ed-84b0-613dad22a50f	7ee98ee0-58a8-49c3-9704-110f4b115bc6	83add33d-3f10-4910-b160-2ed9733a2c0c	😂	2026-01-26 19:57:03.065649+00
d7456dc3-a20b-4010-93c7-bb381db2efc7	7ee98ee0-58a8-49c3-9704-110f4b115bc6	83add33d-3f10-4910-b160-2ed9733a2c0c	🔥	2026-01-26 19:57:05.87998+00
df3484f4-2044-4c68-a027-3dab4e881a4d	a04bbe2b-834a-4382-8743-4ce434255af0	a1aeba75-0b2c-4f55-a1c5-193430cbc3a6	❤️	2026-01-26 21:13:14.269812+00
6fcc3c41-4a3b-4062-a1db-7c0b9bfb5d30	1868edc0-ffbf-42c5-b5cd-e4fb7faa0de9	83add33d-3f10-4910-b160-2ed9733a2c0c	😂	2026-01-26 23:49:01.898886+00
\.


--
-- TOC entry 4780 (class 0 OID 16881)
-- Dependencies: 249
-- Data for Name: do_users; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.do_users (id, user_id, email, password_hash, password_salt, display_name, created_at, updated_at) FROM stdin;
ab86b388-97ec-43a9-b2b1-54e2e0f48145	a1b2c3d4-e5f6-7890-abcd-ef1234567890	test@example.com	b24e2402ec7735b7835661111f8923880c924589798e8da40990ae2257615ddd	68983eff-cf9f-4d6d-8c53-46e4c6a5719d	Test User	2026-01-27 18:24:16.405543+00	2026-01-27 18:24:16.405543+00
852c7c0e-c7ed-45da-b59f-370854809b2c	be029ac3-1218-46da-a573-e9ff4175e30c	devrayhanalmim@gmail.com	c7c508a9f1e2e4fc2e1ea487dd7987f8f39cf1bbc16aa1ef8a85bc4875b8bd88	8718cf49-bd69-4867-809a-3dd14be88c52	devrayhanalmim	2026-01-28 10:21:33.418221+00	2026-01-28 10:21:33.418221+00
\.


--
-- TOC entry 4765 (class 0 OID 16614)
-- Dependencies: 234
-- Data for Name: email_templates; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.email_templates (id, name, subject, subject_ar, body_html, body_html_ar, variables, is_active, created_at, updated_at, updated_by) FROM stdin;
31f1028b-d7c6-4aef-ae97-4ac2440a1eee	welcome	Welcome to Tahweel!	مرحباً بك في تحويل!	<h1>Welcome {{display_name}}!</h1><p>Thank you for joining Tahweel. We are excited to have you on board.</p><p>Start exploring and connecting with our community!</p>	<h1>مرحباً {{display_name}}!</h1><p>شكراً لانضمامك إلى تحويل. نحن متحمسون لوجودك معنا.</p><p>ابدأ في استكشاف مجتمعنا والتواصل معه!</p>	["display_name", "email"]	t	2026-01-25 12:49:53.355882+00	2026-01-25 12:49:53.355882+00	\N
aa97b370-3421-4193-b642-39b0cf78b226	password_reset	Reset Your Password	إعادة تعيين كلمة المرور	<h1>Password Reset</h1><p>Hi {{display_name}},</p><p>You requested to reset your password. Click the link below:</p><a href="{{reset_link}}">Reset Password</a><p>This link expires in 1 hour.</p>	<h1>إعادة تعيين كلمة المرور</h1><p>مرحباً {{display_name}},</p><p>لقد طلبت إعادة تعيين كلمة المرور. انقر على الرابط أدناه:</p><a href="{{reset_link}}">إعادة تعيين كلمة المرور</a><p>ينتهي هذا الرابط خلال ساعة.</p>	["display_name", "email", "reset_link"]	t	2026-01-25 12:49:53.355882+00	2026-01-25 12:49:53.355882+00	\N
409e0358-66f7-4c19-9b53-8bbdd381b80a	new_mention	Someone mentioned you!	قام شخص ما بذكرك!	<h1>You were mentioned!</h1><p>Hi {{display_name}},</p><p>{{mentioner_name}} mentioned you in a {{content_type}}.</p><a href="{{post_link}}">View the post</a>	<h1>تم ذكرك!</h1><p>مرحباً {{display_name}},</p><p>قام {{mentioner_name}} بذكرك في {{content_type}}.</p><a href="{{post_link}}">عرض المنشور</a>	["display_name", "mentioner_name", "content_type", "post_link"]	t	2026-01-25 12:49:53.355882+00	2026-01-25 12:49:53.355882+00	\N
dd0e7c45-5954-4c41-a828-7323631edf62	new_follower	You have a new follower!	لديك متابع جديد!	<h1>New Follower!</h1><p>Hi {{display_name}},</p><p>{{follower_name}} started following you.</p><a href="{{profile_link}}">View their profile</a>	<h1>متابع جديد!</h1><p>مرحباً {{display_name}},</p><p>بدأ {{follower_name}} بمتابعتك.</p><a href="{{profile_link}}">عرض ملفه الشخصي</a>	["display_name", "follower_name", "profile_link"]	t	2026-01-25 12:49:53.355882+00	2026-01-25 12:49:53.355882+00	\N
5d665ada-4eae-4ed6-abc3-bc28553cd60f	account_banned	Your Account Has Been Suspended	تم تعليق حسابك	<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">\n    <h1 style="color: #dc2626;">Account Suspended</h1>\n    <p>Hello {{display_name}},</p>\n    <p>We regret to inform you that your account on Tahweel has been suspended.</p>\n    <p><strong>Reason:</strong> {{ban_reason}}</p>\n    <p>If you believe this was a mistake, please contact our support team.</p>\n    <p>Best regards,<br>Tahweel Team</p>\n  </div>	<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl; text-align: right;">\n    <h1 style="color: #dc2626;">تم تعليق الحساب</h1>\n    <p>مرحباً {{display_name}}،</p>\n    <p>نأسف لإبلاغك بأنه تم تعليق حسابك على تحويل.</p>\n    <p><strong>السبب:</strong> {{ban_reason}}</p>\n    <p>إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع فريق الدعم.</p>\n    <p>مع أطيب التحيات،<br>فريق تحويل</p>\n  </div>	["display_name", "ban_reason"]	t	2026-01-25 16:18:34.199277+00	2026-01-25 16:18:34.199277+00	\N
74297cdf-3bf9-4967-91ab-20ce93dd9a1a	account_reactivated	Your Account Has Been Reactivated	تم إعادة تفعيل حسابك	<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">\n    <h1 style="color: #16a34a;">Account Reactivated</h1>\n    <p>Hello {{display_name}},</p>\n    <p>Great news! Your account on Tahweel has been reactivated.</p>\n    <p>You can now log in and continue using all features of the platform.</p>\n    <p>We look forward to seeing you back!</p>\n    <p>Best regards,<br>Tahweel Team</p>\n  </div>	<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl; text-align: right;">\n    <h1 style="color: #16a34a;">تم إعادة تفعيل الحساب</h1>\n    <p>مرحباً {{display_name}}،</p>\n    <p>أخبار سارة! تم إعادة تفعيل حسابك على تحويل.</p>\n    <p>يمكنك الآن تسجيل الدخول واستخدام جميع ميزات المنصة.</p>\n    <p>نتطلع لرؤيتك مجدداً!</p>\n    <p>مع أطيب التحيات،<br>فريق تحويل</p>\n  </div>	["display_name"]	t	2026-01-25 16:18:34.199277+00	2026-01-25 16:18:34.199277+00	\N
9367d16e-179d-4101-a5ca-6265c9ba678f	email_verification	Verify your email - Tahweel	تأكيد بريدك الإلكتروني - تحويل	<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a2e; color: #fff;">\n    <h1 style="color: #8B5CF6; text-align: center;">Welcome to Tahweel!</h1>\n    <p style="color: #e0e0e0;">Thank you for signing up. Please verify your email address by clicking the button below:</p>\n    <div style="text-align: center; margin: 30px 0;">\n      <a href="{{confirmation_link}}" style="background: linear-gradient(135deg, #8B5CF6, #06B6D4); color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email</a>\n    </div>\n    <p style="color: #888; font-size: 14px;">Or copy and paste this link in your browser:</p>\n    <p style="color: #8B5CF6; word-break: break-all; font-size: 12px;">{{confirmation_link}}</p>\n    <hr style="border-color: #333; margin: 30px 0;" />\n    <p style="color: #666; font-size: 12px; text-align: center;">If you did not create an account, you can safely ignore this email.</p>\n  </div>	<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a2e; color: #fff; direction: rtl;">\n    <h1 style="color: #8B5CF6; text-align: center;">مرحباً بك في تحويل!</h1>\n    <p style="color: #e0e0e0;">شكراً لتسجيلك. يرجى تأكيد بريدك الإلكتروني بالنقر على الزر أدناه:</p>\n    <div style="text-align: center; margin: 30px 0;">\n      <a href="{{confirmation_link}}" style="background: linear-gradient(135deg, #8B5CF6, #06B6D4); color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">تأكيد البريد</a>\n    </div>\n    <p style="color: #888; font-size: 14px;">أو انسخ والصق هذا الرابط في متصفحك:</p>\n    <p style="color: #8B5CF6; word-break: break-all; font-size: 12px;">{{confirmation_link}}</p>\n    <hr style="border-color: #333; margin: 30px 0;" />\n    <p style="color: #666; font-size: 12px; text-align: center;">إذا لم تقم بإنشاء حساب، يمكنك تجاهل هذا البريد بأمان.</p>\n  </div>	["confirmation_link", "email", "token", "site_url"]	t	2026-01-26 13:57:04.966891+00	2026-01-26 13:57:04.966891+00	\N
\.


--
-- TOC entry 4751 (class 0 OID 16500)
-- Dependencies: 220
-- Data for Name: follows; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.follows (id, follower_id, following_id, created_at) FROM stdin;
ad077fe6-0600-4431-87fd-b6cf199db3a3	83add33d-3f10-4910-b160-2ed9733a2c0c	7e73da3a-84e9-493a-87b6-1e29ce538a59	2026-01-27 17:03:45.317114+00
d0bfeaa7-e8a1-4923-81e2-9107ee5b8ee1	83add33d-3f10-4910-b160-2ed9733a2c0c	441a00f4-4bf2-4275-8dce-431e879e44d1	\N
b2c95915-27a7-425f-b757-717604fb2761	83add33d-3f10-4910-b160-2ed9733a2c0c	a1aeba75-0b2c-4f55-a1c5-193430cbc3a6	2026-01-27 19:44:50.107+00
a6de58f1-f922-4ff1-8baa-c6c25f1eb50e	83add33d-3f10-4910-b160-2ed9733a2c0c	6d41990f-3eb0-4185-93e2-68ea4b60d17f	2026-01-27 19:51:00.984+00
8f965642-9f17-4bd8-8f6f-7f6cf41f36b1	83add33d-3f10-4910-b160-2ed9733a2c0c	b839ed92-a430-4399-9961-ff4055c0a05c	2026-01-27 19:51:04.816+00
f9ec03bd-41bd-45c9-9c44-28398d2e0d0b	6d41990f-3eb0-4185-93e2-68ea4b60d17f	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-28 01:08:40.092+00
\.


--
-- TOC entry 4773 (class 0 OID 16769)
-- Dependencies: 242
-- Data for Name: likes; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.likes (id, user_id, post_id, comment_id, created_at) FROM stdin;
12dee854-ea27-4d7e-9cfd-ebb887cac80c	83add33d-3f10-4910-b160-2ed9733a2c0c	\N	e8b62344-260d-4e3e-a61f-7a67bb165b11	2026-01-27 21:57:44.833+00
749bcb66-916d-4f33-a2ca-5c284a486883	83add33d-3f10-4910-b160-2ed9733a2c0c	\N	506d450b-2911-4766-ada1-8ef3f5f8e138	2026-01-27 21:58:04.104+00
9baf9487-8bf6-4dad-8c40-37ce9f426ac3	83add33d-3f10-4910-b160-2ed9733a2c0c	2c6b15bd-30db-4ef2-83c6-5e56c211536f	\N	2026-01-27 22:10:15.105+00
\.


--
-- TOC entry 4757 (class 0 OID 16553)
-- Dependencies: 226
-- Data for Name: message_reactions; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.message_reactions (id, message_id, user_id, emoji, created_at) FROM stdin;
da8dfceb-2717-4bda-8e35-90c043b8d5c6	ca684476-f364-4be2-bd9b-305c3e57a30f	6d41990f-3eb0-4185-93e2-68ea4b60d17f	👍	2026-01-25 23:14:16.654478+00
22cfdabd-b436-484b-859a-af891d0e41da	c8bea5eb-981f-41a5-9523-0805e34ef4cf	6d41990f-3eb0-4185-93e2-68ea4b60d17f	👍	2026-01-25 23:15:17.139108+00
f0040aac-90a8-4ed8-9ca8-5cb4464d671b	ca684476-f364-4be2-bd9b-305c3e57a30f	6d41990f-3eb0-4185-93e2-68ea4b60d17f	❤️	2026-01-25 23:18:13.034382+00
4ff2d5a7-0175-4a74-abb9-530bb93a8931	92b50362-b58b-4dfe-a791-6e916e4fff48	6d41990f-3eb0-4185-93e2-68ea4b60d17f	❤️	2026-01-25 23:23:49.693673+00
7ebc83a0-880b-4663-8619-97fc24dd0b8e	ae575d83-446a-4385-99e8-b41355167da2	83add33d-3f10-4910-b160-2ed9733a2c0c	🔥	2026-01-26 00:03:38.718985+00
b0a4b239-c2f8-4b9f-8fbb-8aa0dab8c64f	66b4cf5a-3803-4801-99fc-4085674fcdf9	83add33d-3f10-4910-b160-2ed9733a2c0c	❤️	2026-01-26 00:03:44.777746+00
697c8d1e-9789-4bd3-8daa-405260e06bf5	a3bb0e62-99eb-46de-81fb-1ee4f417cfaa	6d41990f-3eb0-4185-93e2-68ea4b60d17f	❤️	2026-01-26 00:04:31.055771+00
1d9a8a49-631a-4348-bf89-aa6ccc5a5242	d2249e46-a71a-492a-a941-b3b5fe00894b	6d41990f-3eb0-4185-93e2-68ea4b60d17f	😮	2026-01-26 00:04:33.540006+00
27d4d46a-cd20-42e2-9182-d7c5a55d9d0f	d2249e46-a71a-492a-a941-b3b5fe00894b	83add33d-3f10-4910-b160-2ed9733a2c0c	👏	2026-01-26 00:04:39.653706+00
9fac2529-ca60-40e1-8379-ff29512e13d2	a3bb0e62-99eb-46de-81fb-1ee4f417cfaa	83add33d-3f10-4910-b160-2ed9733a2c0c	🔥	2026-01-26 00:04:42.532352+00
74e93bdb-f808-43f4-a2db-3a9e5a07dfd5	25bbb095-ec3c-4848-8240-551bb63440ba	83add33d-3f10-4910-b160-2ed9733a2c0c	👏	2026-01-27 20:37:07.573+00
98b53326-8446-4aa7-a2cd-3df476d8b397	25bbb095-ec3c-4848-8240-551bb63440ba	83add33d-3f10-4910-b160-2ed9733a2c0c	🔥	2026-01-27 20:38:22.368+00
\.


--
-- TOC entry 4758 (class 0 OID 16561)
-- Dependencies: 227
-- Data for Name: message_reads; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.message_reads (id, message_id, user_id, read_at) FROM stdin;
bec65f1a-7f89-4549-b356-5ad5a1931032	d051cf61-3ab0-45fc-bf43-046aa6421997	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-26 18:30:50.533344+00
2333fa46-1da0-45ac-962a-f6842ef91164	d2249e46-a71a-492a-a941-b3b5fe00894b	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-27 21:30:29.444+00
93793a70-c933-49ff-b055-b557d538e518	a3bb0e62-99eb-46de-81fb-1ee4f417cfaa	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-27 21:30:31.006+00
89b89a95-adc7-4aff-b0ec-7df14431a947	24aa6e36-e243-4406-a913-91af3ff28a3a	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-27 21:30:33.023+00
b4f76a78-0dc1-4b8a-a347-ea289d95a4c5	80589bd3-1b11-49ca-b774-1777bae529bf	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-27 21:30:34.594+00
5ff3080c-91cd-4a5a-8041-2feb25af019a	64992469-eb95-4f0a-99aa-6b919a6807a3	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-27 21:30:36.204+00
05c86935-226b-40d0-836d-f446beb8dbeb	474daf10-bfc3-4f4f-bf2c-e2d9aa5d12bc	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-27 21:30:37.794+00
13736bff-4044-4370-bd85-b903e54582c5	34799e5a-cf1a-42e3-b278-991eff69185e	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-27 21:30:39.5+00
2422d1dd-e092-45d3-8652-61d00d0a904d	25bbb095-ec3c-4848-8240-551bb63440ba	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-27 21:30:41.15+00
8aad2ac5-e68e-4b95-b256-9948d3863319	66b4cf5a-3803-4801-99fc-4085674fcdf9	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-27 21:36:35.436+00
cecc347c-a674-4f5d-a951-3d0fd8b0a25c	ae575d83-446a-4385-99e8-b41355167da2	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-27 21:36:36.974+00
3037b45f-4880-4a01-8fd0-006b85624f1e	c8bea5eb-981f-41a5-9523-0805e34ef4cf	6d41990f-3eb0-4185-93e2-68ea4b60d17f	2026-01-25 23:23:45.790424+00
d294a0ef-3dbf-4143-9e58-765a92487463	92b50362-b58b-4dfe-a791-6e916e4fff48	6d41990f-3eb0-4185-93e2-68ea4b60d17f	2026-01-25 23:23:45.790424+00
24265894-5024-4d22-9ea6-9f94711d74cb	b976342d-f87f-409a-9c9e-84aba2203b7b	7e73da3a-84e9-493a-87b6-1e29ce538a59	2026-01-26 18:31:28.949457+00
b4c526a3-21fc-4405-b7a9-7b4aaed9afd7	d4d62b55-b55d-4db0-929a-ef7b4aede27c	6d41990f-3eb0-4185-93e2-68ea4b60d17f	2026-01-25 23:51:31.635656+00
b8d7018e-7dd6-4d3a-9733-018add35724b	66b4cf5a-3803-4801-99fc-4085674fcdf9	a1aeba75-0b2c-4f55-a1c5-193430cbc3a6	2026-01-26 21:11:29.464616+00
1a2c4438-56b5-4e16-8cec-b95f0f2e4990	ae575d83-446a-4385-99e8-b41355167da2	a1aeba75-0b2c-4f55-a1c5-193430cbc3a6	2026-01-26 21:11:29.464616+00
453cb830-7641-4fc1-9537-3a7e863dd541	d2249e46-a71a-492a-a941-b3b5fe00894b	a1aeba75-0b2c-4f55-a1c5-193430cbc3a6	2026-01-26 21:11:29.464616+00
f365d750-60fa-4fbd-8283-fc606efe6da2	a3bb0e62-99eb-46de-81fb-1ee4f417cfaa	a1aeba75-0b2c-4f55-a1c5-193430cbc3a6	2026-01-26 21:11:29.464616+00
6a941cde-f9fb-457d-98b3-fbc1d45dee0b	24aa6e36-e243-4406-a913-91af3ff28a3a	a1aeba75-0b2c-4f55-a1c5-193430cbc3a6	2026-01-26 21:11:29.464616+00
f5634319-fd5c-4da1-ba13-740eb486a9e4	80589bd3-1b11-49ca-b774-1777bae529bf	a1aeba75-0b2c-4f55-a1c5-193430cbc3a6	2026-01-26 21:11:29.464616+00
9fa10185-4d7b-4f6d-a9c8-01d1894df1bf	b976342d-f87f-409a-9c9e-84aba2203b7b	b839ed92-a430-4399-9961-ff4055c0a05c	2026-01-26 18:31:28.205321+00
543a98a4-5672-43b3-a5c3-bad4962ee8f2	64992469-eb95-4f0a-99aa-6b919a6807a3	a1aeba75-0b2c-4f55-a1c5-193430cbc3a6	2026-01-26 21:11:29.464616+00
e31588a9-34e2-48ee-91fe-1d257a3ec831	66b4cf5a-3803-4801-99fc-4085674fcdf9	6d41990f-3eb0-4185-93e2-68ea4b60d17f	2026-01-25 23:23:45.790424+00
6a1bd2fc-29ee-494d-8452-f05bc2571430	ae575d83-446a-4385-99e8-b41355167da2	6d41990f-3eb0-4185-93e2-68ea4b60d17f	2026-01-25 23:51:31.635656+00
fbb74f92-4672-4ee3-b481-78a5a75ad0c8	d2249e46-a71a-492a-a941-b3b5fe00894b	6d41990f-3eb0-4185-93e2-68ea4b60d17f	2026-01-25 23:51:31.635656+00
d1f2b7cc-7b85-4405-80cc-89da58365910	a3bb0e62-99eb-46de-81fb-1ee4f417cfaa	6d41990f-3eb0-4185-93e2-68ea4b60d17f	2026-01-26 00:04:19.889238+00
63f2db10-1652-49f7-b064-7137d212ebde	24aa6e36-e243-4406-a913-91af3ff28a3a	6d41990f-3eb0-4185-93e2-68ea4b60d17f	2026-01-26 00:29:39.817354+00
15172ed5-a4f4-41e1-9e78-b19a8b9fe67c	d051cf61-3ab0-45fc-bf43-046aa6421997	b839ed92-a430-4399-9961-ff4055c0a05c	2026-01-26 18:30:51.28987+00
d347b85a-7987-4575-be6e-b17ed2b9fe14	474daf10-bfc3-4f4f-bf2c-e2d9aa5d12bc	a1aeba75-0b2c-4f55-a1c5-193430cbc3a6	2026-01-26 21:11:29.464616+00
0e5607de-38b2-4643-85f4-66e87744cc0f	34799e5a-cf1a-42e3-b278-991eff69185e	a1aeba75-0b2c-4f55-a1c5-193430cbc3a6	2026-01-26 21:11:43.013571+00
4ff9b9fb-1f29-4a0e-a126-458a77137fd1	66b4cf5a-3803-4801-99fc-4085674fcdf9	7e73da3a-84e9-493a-87b6-1e29ce538a59	2026-01-26 17:57:15.926805+00
5e24dc30-83aa-4b2d-b9b5-db56b9d7bb8e	d051cf61-3ab0-45fc-bf43-046aa6421997	7e73da3a-84e9-493a-87b6-1e29ce538a59	2026-01-26 18:30:52.240055+00
16e71e69-5c4c-446c-ae95-ccaee568a039	ae575d83-446a-4385-99e8-b41355167da2	7e73da3a-84e9-493a-87b6-1e29ce538a59	2026-01-26 17:57:15.926805+00
939a6677-5ec7-4c18-90df-edaa6beb85cf	d2249e46-a71a-492a-a941-b3b5fe00894b	7e73da3a-84e9-493a-87b6-1e29ce538a59	2026-01-26 17:57:15.926805+00
e959b8a0-533c-4ffd-a1b8-637e7834b808	a3bb0e62-99eb-46de-81fb-1ee4f417cfaa	7e73da3a-84e9-493a-87b6-1e29ce538a59	2026-01-26 17:57:15.926805+00
638ee4a3-aed8-4610-83a1-6ba13b64df26	24aa6e36-e243-4406-a913-91af3ff28a3a	7e73da3a-84e9-493a-87b6-1e29ce538a59	2026-01-26 17:57:15.926805+00
16cf6020-821f-4f09-ad0a-61a7e275fae3	80589bd3-1b11-49ca-b774-1777bae529bf	7e73da3a-84e9-493a-87b6-1e29ce538a59	2026-01-26 17:57:33.533686+00
e0854910-97d7-4b7c-bd34-8f80e57e239d	64992469-eb95-4f0a-99aa-6b919a6807a3	7e73da3a-84e9-493a-87b6-1e29ce538a59	2026-01-26 18:30:44.680554+00
6a56e0cc-2147-4507-9749-25b546af041a	474daf10-bfc3-4f4f-bf2c-e2d9aa5d12bc	7e73da3a-84e9-493a-87b6-1e29ce538a59	2026-01-26 18:32:48.51883+00
60fa8268-3d31-4829-91f3-6d9dd405e0b4	66b4cf5a-3803-4801-99fc-4085674fcdf9	b839ed92-a430-4399-9961-ff4055c0a05c	2026-01-26 18:30:32.801865+00
da459127-c908-4fb7-958e-578c3a6948ee	ae575d83-446a-4385-99e8-b41355167da2	b839ed92-a430-4399-9961-ff4055c0a05c	2026-01-26 18:30:32.801865+00
eb95ad82-b117-4792-8b05-d024016058ee	d2249e46-a71a-492a-a941-b3b5fe00894b	b839ed92-a430-4399-9961-ff4055c0a05c	2026-01-26 18:30:32.801865+00
faa1358c-b107-418d-9b89-418e8dc5fcab	a3bb0e62-99eb-46de-81fb-1ee4f417cfaa	b839ed92-a430-4399-9961-ff4055c0a05c	2026-01-26 18:30:32.801865+00
071c1cb7-d8b0-4984-a71b-30d3ed67e586	24aa6e36-e243-4406-a913-91af3ff28a3a	b839ed92-a430-4399-9961-ff4055c0a05c	2026-01-26 18:30:32.801865+00
fb9dc9fe-4cc8-4f27-b467-cb297e06dc40	80589bd3-1b11-49ca-b774-1777bae529bf	b839ed92-a430-4399-9961-ff4055c0a05c	2026-01-26 18:30:32.801865+00
273e3c68-e745-4568-a822-f60483083f8f	64992469-eb95-4f0a-99aa-6b919a6807a3	b839ed92-a430-4399-9961-ff4055c0a05c	2026-01-26 18:30:43.843433+00
53189fa8-f421-496e-af77-bcf787b2d2c8	474daf10-bfc3-4f4f-bf2c-e2d9aa5d12bc	b839ed92-a430-4399-9961-ff4055c0a05c	2026-01-26 18:32:46.667084+00
8d6cf9a0-737b-4d79-b36c-ec1fec1800f5	b976342d-f87f-409a-9c9e-84aba2203b7b	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-26 18:31:27.886338+00
\.


--
-- TOC entry 4756 (class 0 OID 16543)
-- Dependencies: 225
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.messages (id, room_id, user_id, content, is_deleted, created_at, media_url, media_type, is_pinned, pinned_at, pinned_by) FROM stdin;
66b4cf5a-3803-4801-99fc-4085674fcdf9	c6380e38-2967-498a-84b6-a37c311d6551	6d41990f-3eb0-4185-93e2-68ea4b60d17f	yes	f	2026-01-25 23:11:01.387513+00	\N	\N	f	\N	\N
761a4654-15e8-416d-8182-1f89913ec894	c6380e38-2967-498a-84b6-a37c311d6551	6d41990f-3eb0-4185-93e2-68ea4b60d17f	hello dear	t	2026-01-25 23:05:32.478167+00	\N	\N	f	\N	\N
204f112e-d9f0-4ab4-8387-0a8d9caada08	c6380e38-2967-498a-84b6-a37c311d6551	6d41990f-3eb0-4185-93e2-68ea4b60d17f	hi hi	t	2026-01-25 23:05:39.59707+00	\N	\N	f	\N	\N
ca684476-f364-4be2-bd9b-305c3e57a30f	c6380e38-2967-498a-84b6-a37c311d6551	83add33d-3f10-4910-b160-2ed9733a2c0c	miw	t	2026-01-25 23:11:51.063189+00	\N	\N	f	\N	\N
cbb4ffa0-e682-4aab-ad41-7487ab7e6e2f	c6380e38-2967-498a-84b6-a37c311d6551	6d41990f-3eb0-4185-93e2-68ea4b60d17f	yes	t	2026-01-25 23:10:51.884562+00	\N	\N	f	\N	\N
ae575d83-446a-4385-99e8-b41355167da2	c6380e38-2967-498a-84b6-a37c311d6551	83add33d-3f10-4910-b160-2ed9733a2c0c	yeasssss	f	2026-01-25 23:26:31.838957+00	\N	\N	f	\N	\N
c8bea5eb-981f-41a5-9523-0805e34ef4cf	c6380e38-2967-498a-84b6-a37c311d6551	83add33d-3f10-4910-b160-2ed9733a2c0c	dfgdfgdf	t	2026-01-25 23:14:51.034289+00	\N	\N	f	\N	\N
92b50362-b58b-4dfe-a791-6e916e4fff48	c6380e38-2967-498a-84b6-a37c311d6551	83add33d-3f10-4910-b160-2ed9733a2c0c	sdfdsf	t	2026-01-25 23:15:04.201473+00	\N	\N	f	\N	\N
24aa6e36-e243-4406-a913-91af3ff28a3a	c6380e38-2967-498a-84b6-a37c311d6551	6d41990f-3eb0-4185-93e2-68ea4b60d17f	هاي	f	2026-01-26 00:29:23.296787+00	\N	\N	f	\N	\N
80589bd3-1b11-49ca-b774-1777bae529bf	c6380e38-2967-498a-84b6-a37c311d6551	7e73da3a-84e9-493a-87b6-1e29ce538a59	heyyyy	f	2026-01-26 17:57:31.533061+00	\N	\N	f	\N	\N
474daf10-bfc3-4f4f-bf2c-e2d9aa5d12bc	c6380e38-2967-498a-84b6-a37c311d6551	7e73da3a-84e9-493a-87b6-1e29ce538a59	hey guys	f	2026-01-26 18:32:45.945103+00	\N	\N	f	\N	\N
d051cf61-3ab0-45fc-bf43-046aa6421997	c6380e38-2967-498a-84b6-a37c311d6551	b839ed92-a430-4399-9961-ff4055c0a05c	hi boss	t	2026-01-26 18:30:50.274691+00	\N	\N	f	\N	\N
b976342d-f87f-409a-9c9e-84aba2203b7b	c6380e38-2967-498a-84b6-a37c311d6551	b839ed92-a430-4399-9961-ff4055c0a05c	test	t	2026-01-26 18:31:27.624382+00	\N	\N	f	\N	\N
34799e5a-cf1a-42e3-b278-991eff69185e	c6380e38-2967-498a-84b6-a37c311d6551	a1aeba75-0b2c-4f55-a1c5-193430cbc3a6	hahahahaha	f	2026-01-26 21:11:42.063396+00	\N	\N	f	\N	\N
64992469-eb95-4f0a-99aa-6b919a6807a3	c6380e38-2967-498a-84b6-a37c311d6551	83add33d-3f10-4910-b160-2ed9733a2c0c	Helllllo	f	2026-01-26 18:30:43.216975+00	\N	\N	f	\N	\N
d2249e46-a71a-492a-a941-b3b5fe00894b	c6380e38-2967-498a-84b6-a37c311d6551	83add33d-3f10-4910-b160-2ed9733a2c0c	📷 Image	f	2026-01-25 23:35:39.856288+00	https://tahweelbookbucket.sfo3.digitaloceanspaces.com/rooms/migrated/1769465274440-ykik3c.webp	image	f	\N	\N
d4d62b55-b55d-4db0-929a-ef7b4aede27c	c6380e38-2967-498a-84b6-a37c311d6551	83add33d-3f10-4910-b160-2ed9733a2c0c	yeah	t	2026-01-25 23:25:59.096983+00	https://tahweelbookbucket.sfo3.digitaloceanspaces.com/rooms/migrated/1769465275637-2899ns.webp	image	f	\N	\N
a3bb0e62-99eb-46de-81fb-1ee4f417cfaa	c6380e38-2967-498a-84b6-a37c311d6551	83add33d-3f10-4910-b160-2ed9733a2c0c	📷 Image	f	2026-01-26 00:04:19.633966+00	https://tahweelbookbucket.sfo3.digitaloceanspaces.com/rooms/migrated/1769465276079-rwytpm.webp	image	f	\N	\N
25bbb095-ec3c-4848-8240-551bb63440ba	c6380e38-2967-498a-84b6-a37c311d6551	83add33d-3f10-4910-b160-2ed9733a2c0c	test	f	\N	https://tahweelbookbucket.sfo3.digitaloceanspaces.com/rooms/83add33d-3f10-4910-b160-2ed9733a2c0c/1769545315031-5g8y3.mp4	video	f	\N	\N
\.


--
-- TOC entry 4752 (class 0 OID 16506)
-- Dependencies: 221
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.notifications (id, user_id, type, title, title_ar, message, message_ar, is_read, data, created_at) FROM stdin;
72aa113e-35ee-4e82-a3ff-8ac7092f762c	7e73da3a-84e9-493a-87b6-1e29ce538a59	follow	New Follower	متابع جديد	Support started following you	Support بدأ بمتابعتك	f	{"user_id": "83add33d-3f10-4910-b160-2ed9733a2c0c", "username": "tahweel_support"}	2026-01-27 17:03:45.317114+00
\.


--
-- TOC entry 4770 (class 0 OID 16728)
-- Dependencies: 239
-- Data for Name: poll_options; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.poll_options (id, poll_id, text, emoji, votes_count, sort_order, created_at) FROM stdin;
\.


--
-- TOC entry 4771 (class 0 OID 16742)
-- Dependencies: 240
-- Data for Name: poll_votes; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.poll_votes (id, poll_id, option_id, user_id, created_at) FROM stdin;
\.


--
-- TOC entry 4768 (class 0 OID 16700)
-- Dependencies: 237
-- Data for Name: post_media; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.post_media (id, post_id, media_url, media_type, thumbnail_url, sort_order, created_at) FROM stdin;
6370c72c-e3fb-4f20-a37e-25f70378b6a8	6b37a21e-004a-4e0a-bad3-d95c38c2373b	https://tahweelbookbucket.sfo3.digitaloceanspaces.com/posts/83add33d-3f10-4910-b160-2ed9733a2c0c/1769543714930-4piiv.webp	image	\N	0	2026-01-27 19:55:17.323391+00
38dcb1f3-6938-4957-9dd3-b58cd1d8b3ab	2c6b15bd-30db-4ef2-83c6-5e56c211536f	https://tahweelbookbucket.sfo3.digitaloceanspaces.com/posts/83add33d-3f10-4910-b160-2ed9733a2c0c/1769549304801-bb8nnc.webp	image	\N	0	2026-01-27 21:28:27.176059+00
f423d195-e9ce-4297-84f8-871a8bdc7f14	f4b09362-5a79-40db-b71a-45517941a6fd	https://tahweelbookbucket.sfo3.digitaloceanspaces.com/posts/83add33d-3f10-4910-b160-2ed9733a2c0c/1769549538365-ok1nd.webp	image	\N	0	2026-01-27 21:32:20.713987+00
\.


--
-- TOC entry 4769 (class 0 OID 16714)
-- Dependencies: 238
-- Data for Name: post_polls; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.post_polls (id, post_id, question, poll_type, ends_at, allow_add_options, goal, created_at) FROM stdin;
\.


--
-- TOC entry 4777 (class 0 OID 16815)
-- Dependencies: 246
-- Data for Name: post_views; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.post_views (id, post_id, user_id, created_at) FROM stdin;
21148b1a-e07a-478e-9821-32984382ba57	6b37a21e-004a-4e0a-bad3-d95c38c2373b	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-27 20:47:59.725035+00
26603ad4-daba-44e6-9e8b-b7a868601eaa	6b37a21e-004a-4e0a-bad3-d95c38c2373b	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-27 20:48:59.30233+00
a2ffbd82-0d64-477e-bf96-93a0b43bfd27	6b37a21e-004a-4e0a-bad3-d95c38c2373b	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-27 20:52:51.59298+00
2f6ebc0a-f809-4230-929a-54082bc41de9	6b37a21e-004a-4e0a-bad3-d95c38c2373b	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-27 20:55:56.826366+00
ada1bde6-e33d-410e-b9e0-70a048499c93	6b37a21e-004a-4e0a-bad3-d95c38c2373b	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-27 20:57:45.768177+00
4f57edbf-7fd5-4711-b0d7-70eeaedd16c0	6b37a21e-004a-4e0a-bad3-d95c38c2373b	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-27 21:01:56.952519+00
d8069719-6459-4970-a5dc-e8b06aeec4de	2c6b15bd-30db-4ef2-83c6-5e56c211536f	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-27 21:43:03.804321+00
7ef13eeb-ef09-4185-9b7e-cd9dc04fb79d	2c6b15bd-30db-4ef2-83c6-5e56c211536f	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-27 21:57:26.962757+00
085fc080-60e3-49d0-8912-56369e98ae20	2c6b15bd-30db-4ef2-83c6-5e56c211536f	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-27 21:59:43.863945+00
5e306a62-c7a1-46eb-9f9b-5fdc4e89a687	2c6b15bd-30db-4ef2-83c6-5e56c211536f	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-27 22:05:14.309272+00
f4bf72fe-78d8-4583-986f-a7ecf50c3d32	2c6b15bd-30db-4ef2-83c6-5e56c211536f	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-27 22:05:34.761119+00
41c2dda5-5d70-4e47-a719-4a0a7265e41f	2c6b15bd-30db-4ef2-83c6-5e56c211536f	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-27 22:06:05.755006+00
af5db5f5-7d71-47a4-a60b-ae3014888966	2c6b15bd-30db-4ef2-83c6-5e56c211536f	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-27 22:09:56.906912+00
90b675d8-c47d-426b-a394-fbdf65789d2b	2c6b15bd-30db-4ef2-83c6-5e56c211536f	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-27 22:12:02.807642+00
860b551f-c425-4e62-821c-1eeb6ce1fd62	2c6b15bd-30db-4ef2-83c6-5e56c211536f	83add33d-3f10-4910-b160-2ed9733a2c0c	2026-01-27 22:19:57.546694+00
\.


--
-- TOC entry 4767 (class 0 OID 16679)
-- Dependencies: 236
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.posts (id, user_id, content, slug, category_id, likes_count, comments_count, shares_count, views_count, is_approved, is_pinned, is_locked, is_hidden, repost_of_id, quote_content, location, feeling, created_at, updated_at) FROM stdin;
ce2ba55d-c217-488e-9b26-5a1835e55d3d	83add33d-3f10-4910-b160-2ed9733a2c0c	#Tahweel First Hashtag	\N	fb41cf3f-b144-4ad5-af7b-f968417f3c77	0	0	0	0	t	f	f	f	\N	\N	Casablanca, Morocco	In Love	2026-01-27 19:56:50.809667+00	2026-01-27 19:56:50.809667+00
79c52d53-cf89-4e46-abe0-593feceb9de3	83add33d-3f10-4910-b160-2ed9733a2c0c	Hello dear	\N	fb41cf3f-b144-4ad5-af7b-f968417f3c77	0	0	0	0	t	f	f	f	2c6b15bd-30db-4ef2-83c6-5e56c211536f	\N	\N	\N	2026-01-27 22:10:26.032+00	2026-01-27 22:10:26.032+00
6e8fe41f-220e-4130-9fd0-4fa3f4eede88	83add33d-3f10-4910-b160-2ed9733a2c0c	yes	\N	fb41cf3f-b144-4ad5-af7b-f968417f3c77	0	0	0	0	t	f	f	f	2c6b15bd-30db-4ef2-83c6-5e56c211536f	yes	\N	\N	2026-01-27 22:10:44.61+00	2026-01-27 22:10:44.611+00
2fa81414-dfcd-4d98-a5be-2bfc4441c191	83add33d-3f10-4910-b160-2ed9733a2c0c	top	\N	fb41cf3f-b144-4ad5-af7b-f968417f3c77	0	0	0	0	t	f	f	f	2c6b15bd-30db-4ef2-83c6-5e56c211536f	top	\N	\N	2026-01-27 22:40:43.715+00	2026-01-27 22:40:43.715+00
2c6b15bd-30db-4ef2-83c6-5e56c211536f	83add33d-3f10-4910-b160-2ed9733a2c0c	Hello dear	\N	fb41cf3f-b144-4ad5-af7b-f968417f3c77	2	0	3	0	t	f	f	f	\N	\N	Casablanca, Morocco	In Love	2026-01-27 21:28:26.249727+00	2026-01-27 21:28:26.249727+00
83ee1da6-d969-46b4-bfc5-b193b8238b15	83add33d-3f10-4910-b160-2ed9733a2c0c	yes	\N	b38da79c-6937-4ad2-b1c2-09d017d69dc0	0	0	0	0	t	f	f	f	6b37a21e-004a-4e0a-bad3-d95c38c2373b	yes	\N	\N	2026-01-27 22:50:41.688+00	2026-01-27 22:50:41.688+00
6b37a21e-004a-4e0a-bad3-d95c38c2373b	83add33d-3f10-4910-b160-2ed9733a2c0c	Assalmu alaykum first post 😀	\N	b38da79c-6937-4ad2-b1c2-09d017d69dc0	0	0	1	0	t	f	f	f	\N	\N	Casablanca, Morocco	Happy	2026-01-27 19:55:16.457979+00	2026-01-27 19:55:16.457979+00
b2aeea46-cc71-45f2-83f7-52e92ebdd1a2	be029ac3-1218-46da-a573-e9ff4175e30c	hello this is rayhan	\N	\N	0	0	0	0	t	f	f	f	\N	\N	\N	\N	2026-01-28 10:39:38.246+00	2026-01-28 10:39:38.246+00
b44791ff-2697-4cac-b0f8-107a57899ed1	be029ac3-1218-46da-a573-e9ff4175e30c	test	\N	\N	0	0	0	0	t	f	f	f	\N	\N	\N	\N	2026-01-28 10:41:05.144+00	2026-01-28 10:41:05.144+00
\.


--
-- TOC entry 4778 (class 0 OID 16825)
-- Dependencies: 247
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.profiles (id, user_id, username, display_name, display_name_ar, bio, avatar_url, cover_url, is_verified, is_banned, is_email_verified, ban_reason, followers_count, following_count, posts_count, status, last_seen_at, birthday, gender, birthplace, current_location, relationship_status, show_birthday, show_gender, show_birthplace, show_location, show_relationship, show_joined_date, show_followers_count, show_following_count, created_at, updated_at) FROM stdin;
6561e850-a5e9-44dc-abe0-b379ca66d1d1	7e73da3a-84e9-493a-87b6-1e29ce538a59	karoummalak	Karoum Malak	\N	\N	\N	\N	f	f	f	\N	1	0	0	online	2026-01-27 16:40:18.57918+00	\N	\N	\N	\N	\N	t	t	t	t	t	t	t	t	2026-01-27 16:40:18.57918+00	2026-01-27 17:03:45.317114+00
e4c362c8-4f5b-48ee-97d0-6c499b3c203b	441a00f4-4bf2-4275-8dce-431e879e44d1	gcbmarketing979	GCB Marketing	\N	\N	\N	\N	f	f	f	\N	0	0	0	online	2026-01-27 16:40:18.57918+00	\N	\N	\N	\N	\N	t	t	t	t	t	t	t	t	2026-01-27 16:40:18.57918+00	2026-01-27 16:40:18.57918+00
f4a6247a-8fec-4d77-bf37-86f9c2c5f06d	b839ed92-a430-4399-9961-ff4055c0a05c	elaboudiyousra	Yousra Elaboudi	\N	\N	\N	\N	f	f	f	\N	0	0	0	online	2026-01-27 16:40:18.57918+00	\N	\N	\N	\N	\N	t	t	t	t	t	t	t	t	2026-01-27 16:40:18.57918+00	2026-01-27 16:40:18.57918+00
d8edc277-b511-406e-a1a0-2a2c1d01ff27	a1aeba75-0b2c-4f55-a1c5-193430cbc3a6	hani_asfar	Dr.Hani Asfar	\N	\N	\N	\N	t	f	f	\N	0	0	0	online	2026-01-27 16:40:18.57918+00	\N	\N	\N	\N	\N	t	t	t	t	t	t	t	t	2026-01-27 16:40:18.57918+00	2026-01-27 16:57:49.686531+00
9397a27b-7686-4149-b392-07ad7fe4d779	6d41990f-3eb0-4185-93e2-68ea4b60d17f	almustasharradio2021	Almustashar Radio	\N	\N	\N	\N	f	f	f	\N	0	1	0	online	2026-01-27 16:40:18.57918+00	\N	\N	\N	\N	\N	t	t	t	t	t	t	t	t	2026-01-27 16:40:18.57918+00	2026-01-27 16:40:18.57918+00
2a89b71d-6c2b-452c-86e7-71521d7d92ed	83add33d-3f10-4910-b160-2ed9733a2c0c	tahweel_support	Tahweel_Support	دعم تحويل	💬 دعم تحويل – هنا لمساعدتك 💬	\N	\N	t	f	t	\N	1	1	0	online	2026-01-27 16:40:18.57918+00	1984-09-23	\N	\N	Casablanca, Morocco	\N	t	t	t	t	t	t	t	t	2026-01-27 16:40:18.57918+00	2026-01-27 17:03:45.317114+00
\.


--
-- TOC entry 4776 (class 0 OID 16802)
-- Dependencies: 245
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.reports (id, reporter_id, post_id, comment_id, user_id, reason, status, resolved_at, resolved_by, resolution_notes, created_at) FROM stdin;
\.


--
-- TOC entry 4755 (class 0 OID 16535)
-- Dependencies: 224
-- Data for Name: room_activity_log; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.room_activity_log (id, room_id, user_id, target_user_id, action_type, details, created_at) FROM stdin;
1d6fba21-98a8-4cea-85c0-339585bab669	c6380e38-2967-498a-84b6-a37c311d6551	83add33d-3f10-4910-b160-2ed9733a2c0c	83add33d-3f10-4910-b160-2ed9733a2c0c	pin_message	{}	2026-01-26 21:12:03.09554+00
b97d96d1-8b16-4994-8ccc-d8865b2bc348	c6380e38-2967-498a-84b6-a37c311d6551	83add33d-3f10-4910-b160-2ed9733a2c0c	\N	unpin_message	{}	2026-01-26 21:12:17.59037+00
29abfdec-cbc9-41c5-90cd-f56c79ecc4db	c6380e38-2967-498a-84b6-a37c311d6551	83add33d-3f10-4910-b160-2ed9733a2c0c	7e73da3a-84e9-493a-87b6-1e29ce538a59	remove_moderator	{}	2026-01-27 20:23:32.814+00
\.


--
-- TOC entry 4775 (class 0 OID 16788)
-- Dependencies: 244
-- Data for Name: room_invites; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.room_invites (id, room_id, invited_user_id, invited_by, status, responded_at, created_at) FROM stdin;
\.


--
-- TOC entry 4754 (class 0 OID 16526)
-- Dependencies: 223
-- Data for Name: room_members; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.room_members (id, room_id, user_id, is_muted, muted_until, muted_by, joined_at, role) FROM stdin;
065fd6b9-a10d-4031-83df-9a511ce22eee	c6380e38-2967-498a-84b6-a37c311d6551	83add33d-3f10-4910-b160-2ed9733a2c0c	f	\N	\N	2026-01-26 00:01:58.263455+00	member
27ce3d2c-5d55-4c56-9472-66f92f9e4888	2694d24b-4781-4d41-b294-703c2e8ee331	83add33d-3f10-4910-b160-2ed9733a2c0c	f	\N	\N	2026-01-26 00:03:55.459605+00	member
96c39928-043e-41c3-8899-7aacf77883df	6d59c596-8f99-4459-82e2-2f46186c761c	83add33d-3f10-4910-b160-2ed9733a2c0c	f	\N	\N	2026-01-26 00:04:00.345819+00	member
94693bc8-9a7c-4c93-aead-56a0e148ae0d	b084fcbb-492f-43a4-a04a-fec3f8e5ead3	83add33d-3f10-4910-b160-2ed9733a2c0c	f	\N	\N	2026-01-26 00:04:01.445368+00	member
8550487e-cadc-461d-9b05-f0c8a4788d54	84e8bbd7-3885-46a7-8a72-5cce03c0cfc3	83add33d-3f10-4910-b160-2ed9733a2c0c	f	\N	\N	2026-01-26 00:04:02.4212+00	member
ceef1aca-7694-4d5e-9a23-ff1f22e06ea6	d1888737-95e3-49a5-b9db-f10fd600669d	83add33d-3f10-4910-b160-2ed9733a2c0c	f	\N	\N	2026-01-26 00:04:03.282449+00	member
09b38850-0c82-44f1-b4f7-3192435cf31f	f88c27e3-e8c6-45d0-9439-8f1a6910d92e	83add33d-3f10-4910-b160-2ed9733a2c0c	f	\N	\N	2026-01-26 00:04:04.247136+00	member
d6ab5190-2f2f-4e38-9a80-81b9be316c9c	3941043b-1037-4f5a-b0ba-419b579368fd	83add33d-3f10-4910-b160-2ed9733a2c0c	f	\N	\N	2026-01-26 00:04:05.195128+00	member
cfd85d5f-9793-4efa-94ed-43d30ed63406	f2602bd6-a6ae-4a74-9419-310af668475b	83add33d-3f10-4910-b160-2ed9733a2c0c	f	\N	\N	2026-01-26 00:04:06.184929+00	member
09113321-9e5b-4efe-bdc0-7dc767247232	b084fcbb-492f-43a4-a04a-fec3f8e5ead3	7e73da3a-84e9-493a-87b6-1e29ce538a59	f	\N	\N	2026-01-26 17:59:44.224328+00	member
2ed59854-d2a8-42d1-a744-5f4e057431cf	c6380e38-2967-498a-84b6-a37c311d6551	b839ed92-a430-4399-9961-ff4055c0a05c	f	\N	\N	2026-01-26 18:30:31.501562+00	member
3a440d8a-d5d3-4c6b-a2a1-8d1c0272da31	b084fcbb-492f-43a4-a04a-fec3f8e5ead3	b839ed92-a430-4399-9961-ff4055c0a05c	f	\N	\N	2026-01-26 19:07:23.785876+00	member
a25fb943-4777-4f13-9266-d82c79c4ee33	c6380e38-2967-498a-84b6-a37c311d6551	a1aeba75-0b2c-4f55-a1c5-193430cbc3a6	f	\N	\N	2026-01-26 21:11:29.253165+00	member
fc85b5fa-2117-4fb3-aa52-0789ef38f90a	c6380e38-2967-498a-84b6-a37c311d6551	6d41990f-3eb0-4185-93e2-68ea4b60d17f	f	\N	\N	2026-01-25 23:05:22.849147+00	member
93008877-1320-48bf-a158-535251f9ff18	c6380e38-2967-498a-84b6-a37c311d6551	7e73da3a-84e9-493a-87b6-1e29ce538a59	f	\N	\N	2026-01-26 17:57:12.629448+00	member
\.


--
-- TOC entry 4753 (class 0 OID 16515)
-- Dependencies: 222
-- Data for Name: rooms; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.rooms (id, name, name_ar, description, description_ar, is_public, is_active, created_by, members_count, created_at, updated_at, slug) FROM stdin;
c6380e38-2967-498a-84b6-a37c311d6551	General Chat	الدردشة العامة	General discussion room	غرفة النقاش العام	t	t	\N	5	2026-01-25 11:51:06.001772+00	2026-01-26 21:11:29.253165+00	general-chat-1769341866
2694d24b-4781-4d41-b294-703c2e8ee331	Gaming Lounge	الألعاب	Gaming community room	غرفة مجتمع الألعاب	t	t	\N	1	2026-01-25 11:51:06.001772+00	2026-01-26 00:03:55.459605+00	gaming-lounge-1769341866
6d59c596-8f99-4459-82e2-2f46186c761c	Money Transfer Hub	مركز الحوالات	Discuss money transfer services and tips	مناقشة خدمات ونصائح الحوالات المالية	t	t	\N	1	2026-01-25 13:25:54.847521+00	2026-01-26 00:04:00.345819+00	money-transfer-hub-1769347555
84e8bbd7-3885-46a7-8a72-5cce03c0cfc3	Tech Talk	التقنية والبرمجة	Technology and programming discussions	نقاشات التقنية والبرمجة	t	t	\N	1	2026-01-25 11:51:06.001772+00	2026-01-26 00:04:02.4212+00	tech-talk-1769341866
d1888737-95e3-49a5-b9db-f10fd600669d	Agents Lounge	صالة الوكلاء	A place for agents to connect and discuss	مكان للوكلاء للتواصل والنقاش	t	t	\N	1	2026-01-25 13:25:54.847521+00	2026-01-26 00:04:03.282449+00	agents-lounge-1769347555
f88c27e3-e8c6-45d0-9439-8f1a6910d92e	General Chat	الدردشة العامة	Open discussions for the community	مناقشات مفتوحة للمجتمع	t	t	\N	1	2026-01-25 13:25:54.847521+00	2026-01-26 00:04:04.247136+00	general-chat-1769347555
3941043b-1037-4f5a-b0ba-419b579368fd	Tech Support Community	مجتمع الدعم الفني	Get help and share technical knowledge	احصل على المساعدة وشارك المعرفة التقنية	t	t	\N	1	2026-01-25 13:25:54.847521+00	2026-01-26 00:04:05.195128+00	tech-support-community-1769347555
f2602bd6-a6ae-4a74-9419-310af668475b	eSIM & Top-Up Chat	دردشة الشرائح والشحن	Everything about eSIM and mobile top-up	كل ما يخص الشرائح الإلكترونية والشحن	t	t	\N	1	2026-01-25 13:25:54.847521+00	2026-01-26 00:04:06.184929+00	esim-top-up-chat-1769347555
b084fcbb-492f-43a4-a04a-fec3f8e5ead3	Flight Tickets Corner	ركن تذاكر الطيران	Travel tips and flight ticket discussions	نصائح السفر ومناقشات تذاكر الطيران	t	t	\N	3	2026-01-25 13:25:54.847521+00	2026-01-26 19:07:23.785876+00	flight-tickets-corner-1769347555
\.


--
-- TOC entry 4766 (class 0 OID 16623)
-- Dependencies: 235
-- Data for Name: smtp_settings; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.smtp_settings (id, host, port, username, password, from_email, from_name, use_tls, is_active, created_at, updated_at) FROM stdin;
8db60cbf-dea1-449c-ac90-b5ec156ad91c	smtp.hostinger.com	465	forum@tahweel.io	=x3VD8]OPGuA	forum@tahweel.io	Tahweel Forum	t	t	2026-01-25 16:03:22.523427+00	2026-01-25 18:22:31.110854+00
\.


--
-- TOC entry 4779 (class 0 OID 16857)
-- Dependencies: 248
-- Data for Name: user_settings; Type: TABLE DATA; Schema: public; Owner: doadmin
--

COPY public.user_settings (id, user_id, email_notifications, push_notifications, notify_likes, notify_comments, notify_follows, notify_messages, show_online_status, allow_messages_from, profile_visibility, created_at, updated_at) FROM stdin;
1ebb9bf5-7f08-43aa-bd36-d8dfeb366660	a1aeba75-0b2c-4f55-a1c5-193430cbc3a6	t	t	t	t	t	t	t	everyone	public	2026-01-27 16:23:35.852432+00	2026-01-27 16:23:35.852432+00
98e08564-a0ce-4885-8ff8-f48a5584b8d9	be029ac3-1218-46da-a573-e9ff4175e30c	t	t	t	t	t	t	t	everyone	public	2026-01-28 10:40:04.815374+00	2026-01-28 10:40:04.815374+00
\.


--
-- TOC entry 4560 (class 2606 OID 16613)
-- Name: banners banners_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_pkey PRIMARY KEY (id);


--
-- TOC entry 4580 (class 2606 OID 16787)
-- Name: bookmarks bookmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.bookmarks
    ADD CONSTRAINT bookmarks_pkey PRIMARY KEY (id);


--
-- TOC entry 4532 (class 2606 OID 16499)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 4576 (class 2606 OID 16768)
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- TOC entry 4552 (class 2606 OID 16579)
-- Name: conversation_participants conversation_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_pkey PRIMARY KEY (id);


--
-- TOC entry 4550 (class 2606 OID 16572)
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- TOC entry 4554 (class 2606 OID 16589)
-- Name: direct_messages direct_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.direct_messages
    ADD CONSTRAINT direct_messages_pkey PRIMARY KEY (id);


--
-- TOC entry 4558 (class 2606 OID 16603)
-- Name: dm_hidden_messages dm_hidden_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.dm_hidden_messages
    ADD CONSTRAINT dm_hidden_messages_pkey PRIMARY KEY (id);


--
-- TOC entry 4556 (class 2606 OID 16597)
-- Name: dm_reactions dm_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.dm_reactions
    ADD CONSTRAINT dm_reactions_pkey PRIMARY KEY (id);


--
-- TOC entry 4598 (class 2606 OID 16893)
-- Name: do_users do_users_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.do_users
    ADD CONSTRAINT do_users_pkey PRIMARY KEY (id);


--
-- TOC entry 4600 (class 2606 OID 16895)
-- Name: do_users do_users_user_id_key; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.do_users
    ADD CONSTRAINT do_users_user_id_key UNIQUE (user_id);


--
-- TOC entry 4562 (class 2606 OID 16622)
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);


--
-- TOC entry 4534 (class 2606 OID 16505)
-- Name: follows follows_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_pkey PRIMARY KEY (id);


--
-- TOC entry 4578 (class 2606 OID 16777)
-- Name: likes likes_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_pkey PRIMARY KEY (id);


--
-- TOC entry 4546 (class 2606 OID 16560)
-- Name: message_reactions message_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.message_reactions
    ADD CONSTRAINT message_reactions_pkey PRIMARY KEY (id);


--
-- TOC entry 4548 (class 2606 OID 16566)
-- Name: message_reads message_reads_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.message_reads
    ADD CONSTRAINT message_reads_pkey PRIMARY KEY (id);


--
-- TOC entry 4544 (class 2606 OID 16552)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- TOC entry 4536 (class 2606 OID 16514)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 4572 (class 2606 OID 16741)
-- Name: poll_options poll_options_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.poll_options
    ADD CONSTRAINT poll_options_pkey PRIMARY KEY (id);


--
-- TOC entry 4574 (class 2606 OID 16752)
-- Name: poll_votes poll_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.poll_votes
    ADD CONSTRAINT poll_votes_pkey PRIMARY KEY (id);


--
-- TOC entry 4568 (class 2606 OID 16713)
-- Name: post_media post_media_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.post_media
    ADD CONSTRAINT post_media_pkey PRIMARY KEY (id);


--
-- TOC entry 4570 (class 2606 OID 16727)
-- Name: post_polls post_polls_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.post_polls
    ADD CONSTRAINT post_polls_pkey PRIMARY KEY (id);


--
-- TOC entry 4586 (class 2606 OID 16824)
-- Name: post_views post_views_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.post_views
    ADD CONSTRAINT post_views_pkey PRIMARY KEY (id);


--
-- TOC entry 4566 (class 2606 OID 16699)
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- TOC entry 4588 (class 2606 OID 16852)
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 4590 (class 2606 OID 16854)
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- TOC entry 4592 (class 2606 OID 16856)
-- Name: profiles profiles_username_key; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_username_key UNIQUE (username);


--
-- TOC entry 4584 (class 2606 OID 16814)
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- TOC entry 4542 (class 2606 OID 16542)
-- Name: room_activity_log room_activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.room_activity_log
    ADD CONSTRAINT room_activity_log_pkey PRIMARY KEY (id);


--
-- TOC entry 4582 (class 2606 OID 16801)
-- Name: room_invites room_invites_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.room_invites
    ADD CONSTRAINT room_invites_pkey PRIMARY KEY (id);


--
-- TOC entry 4540 (class 2606 OID 16534)
-- Name: room_members room_members_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.room_members
    ADD CONSTRAINT room_members_pkey PRIMARY KEY (id);


--
-- TOC entry 4538 (class 2606 OID 16525)
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- TOC entry 4564 (class 2606 OID 16633)
-- Name: smtp_settings smtp_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.smtp_settings
    ADD CONSTRAINT smtp_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 4594 (class 2606 OID 16877)
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 4596 (class 2606 OID 16879)
-- Name: user_settings user_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: doadmin
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_key UNIQUE (user_id);


--
-- TOC entry 4601 (class 1259 OID 16897)
-- Name: idx_do_users_email; Type: INDEX; Schema: public; Owner: doadmin
--

CREATE INDEX idx_do_users_email ON public.do_users USING btree (email);


--
-- TOC entry 4602 (class 1259 OID 16896)
-- Name: idx_do_users_user_id; Type: INDEX; Schema: public; Owner: doadmin
--

CREATE INDEX idx_do_users_user_id ON public.do_users USING btree (user_id);


-- Completed on 2026-01-28 19:00:34

--
-- PostgreSQL database dump complete
--

\unrestrict htpGThjvLQDTzC2xdHaNO79dfRybvGEX95IcOqsctVa1l9tDloea3n7Y6sBq4qm


-- =====================================================
-- MFA (Two-Factor Authentication) Tables
-- =====================================================

-- MFA Factors table for storing TOTP secrets
CREATE TABLE IF NOT EXISTS mfa_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    friendly_name TEXT DEFAULT 'Authenticator App',
    factor_type TEXT DEFAULT 'totp',
    status TEXT DEFAULT 'unverified', -- 'verified' or 'unverified'
    secret TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_mfa_factors_user_id ON mfa_factors(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_factors_status ON mfa_factors(status);

-- =====================================================
-- MFA-related queries reference
-- =====================================================

-- List verified MFA factors for a user
-- SELECT id, user_id, friendly_name, factor_type, status, created_at, updated_at
-- FROM mfa_factors
-- WHERE user_id = $1 AND status = 'verified'
-- ORDER BY created_at DESC;

-- Check if user has verified MFA (for login)
-- SELECT id FROM mfa_factors WHERE user_id = $1 AND status = 'verified' LIMIT 1;

-- Insert new MFA factor (during enrollment)
-- INSERT INTO mfa_factors (id, user_id, friendly_name, factor_type, status, secret, created_at, updated_at)
-- VALUES ($1, $2, $3, 'totp', 'unverified', $4, NOW(), NOW());

-- Update MFA factor status to verified (after user confirms code)
-- UPDATE mfa_factors SET status = 'verified', updated_at = NOW() WHERE id = $1;

-- Get MFA factor secret for verification
-- SELECT secret FROM mfa_factors WHERE id = $1 AND status = 'verified';

-- Delete MFA factor (when user disables 2FA)
-- DELETE FROM mfa_factors WHERE id = $1 AND user_id = $2;

-- Get assurance level (count verified MFA factors)
-- SELECT COUNT(*) as count FROM mfa_factors WHERE user_id = $1 AND status = 'verified';

-- Get user info after MFA verification (for issuing token)
-- SELECT mf.user_id, u.email, p.id as profile_id, p.username, p.display_name, p.avatar_url, p.is_verified
-- FROM mfa_factors mf
-- JOIN do_users u ON u.user_id = mf.user_id
-- JOIN profiles p ON p.user_id = mf.user_id
-- WHERE mf.id = $1 AND mf.status = 'verified';

-- =====================================================
-- MFA Status Update - Soft Disable Support
-- =====================================================

-- Update the status column to include 'disabled' option
-- The status column can now be: 'verified', 'unverified', or 'disabled'

-- Update existing factors if needed (optional migration)
-- UPDATE mfa_factors SET status = 'verified' WHERE status = 'active';

-- New queries for soft disable/enable:

-- Disable MFA factor (soft delete - keeps setup for re-enabling)
-- UPDATE mfa_factors
-- SET status = 'disabled', updated_at = NOW()
-- WHERE id = $1 AND user_id = $2 AND status = 'verified';

-- Re-enable a previously disabled MFA factor
-- UPDATE mfa_factors
-- SET status = 'verified', updated_at = NOW()
-- WHERE id = $1 AND user_id = $2 AND status = 'disabled';

-- Get disabled MFA factor for re-enabling
-- SELECT id, user_id, friendly_name, factor_type, status, created_at, updated_at
-- FROM mfa_factors
-- WHERE user_id = $1 AND status = 'disabled'
-- ORDER BY created_at DESC
-- LIMIT 1;

-- Check if user has verified MFA for login (only 'verified' status, not 'disabled')
-- SELECT id FROM mfa_factors WHERE user_id = $1 AND status = 'verified' LIMIT 1;

-- List all MFA factors including disabled
-- SELECT id, user_id, friendly_name, factor_type, status, created_at, updated_at
-- FROM mfa_factors
-- WHERE user_id = $1
-- ORDER BY created_at DESC;

-- =====================================================
-- User Settings Table (for notification preferences)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    
    -- Notification preferences
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    notify_likes BOOLEAN DEFAULT true,
    notify_comments BOOLEAN DEFAULT true,
    notify_follows BOOLEAN DEFAULT true,
    notify_messages BOOLEAN DEFAULT true,
    
    -- Privacy settings
    profile_visibility TEXT DEFAULT 'public', -- 'public', 'followers', 'private'
    show_online_status BOOLEAN DEFAULT true,
    allow_messages_from TEXT DEFAULT 'everyone', -- 'everyone', 'followers', 'nobody'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- =====================================================
-- Notification preferences queries
-- =====================================================

-- Get user's notification preferences
-- SELECT push_notifications, notify_likes, notify_follows, notify_comments, notify_messages
-- FROM user_settings
-- WHERE user_id = $1;

-- Update push notification preference
-- UPDATE user_settings SET push_notifications = $1, updated_at = NOW() WHERE user_id = $2;

-- Update specific notification type preferences
-- UPDATE user_settings
-- SET notify_likes = $1, notify_follows = $2, notify_comments = $3, updated_at = NOW()
-- WHERE user_id = $4;

-- Ensure user has default settings (create if not exists)
-- INSERT INTO user_settings (id, user_id)
-- SELECT gen_random_uuid(), $1
-- WHERE NOT EXISTS (SELECT 1 FROM user_settings WHERE user_id = $1);

-- =====================================================
-- Notifications Table
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type TEXT NOT NULL, -- 'like', 'follow', 'comment', 'mention', 'message', etc.
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- =====================================================
-- Notifications queries
-- =====================================================

-- Get notifications for a user
-- SELECT * FROM notifications
-- WHERE user_id = $1
-- ORDER BY created_at DESC
-- LIMIT $2;

-- Get unread count
-- SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false;

-- Mark notification as read
-- UPDATE notifications SET is_read = true WHERE id = $1;

-- Mark all notifications as read for a user
-- UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false;

-- Create a notification
-- INSERT INTO notifications (id, user_id, type, title, message, link, is_read, created_at)
-- VALUES ($1, $2, $3, $4, $5, $6, false, $7);
