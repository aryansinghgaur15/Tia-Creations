-- ============================================================================
-- TIA CREATIONS — Marketplace Database Schema (PostgreSQL 15+)
-- Version: 1.0.0  |  Engine: PostgreSQL 15 / 16
-- Sharding note: users & artworks sharded by hash(id) at application/ Citus layer.
-- Search served by Elasticsearch; primary DB is source of truth.
-- ============================================================================

-- ── Extensions ──────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";      -- for gen_random_uuid / encryption helpers
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- trigram search on titles

-- ============================================================================
-- 1. CORE IDENTITY
-- ============================================================================

CREATE TYPE user_status AS ENUM ('active', 'suspended', 'banned');
CREATE TYPE user_role   AS ENUM ('user', 'admin');          -- admin NEVER public
CREATE TYPE artist_status AS ENUM ('none', 'pending', 'approved', 'rejected', 'revoked');
CREATE TYPE kyc_status  AS ENUM ('unverified', 'submitted', 'verified', 'failed');

CREATE TABLE users (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email         citext UNIQUE NOT NULL,
    phone         varchar(20),
    password_hash text,                               -- NULL for oauth-only
    full_name     varchar(120),
    display_name  varchar(80),
    avatar_url    text,
    user_status   user_status NOT NULL DEFAULT 'active',
    role          user_role   NOT NULL DEFAULT 'user',
    artist_status artist_status NOT NULL DEFAULT 'none',
    scopes        jsonb NOT NULL DEFAULT '[]'::jsonb,  -- computed capability list
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_artist_status ON users (artist_status) WHERE artist_status <> 'none';
CREATE INDEX idx_users_role ON users (role);

-- Addresses (1:many)
CREATE TABLE user_addresses (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       varchar(12) NOT NULL CHECK (type IN ('billing','shipping')),
    line1      varchar(200) NOT NULL,
    line2      varchar(200),
    city       varchar(80) NOT NULL,
    state      varchar(80),
    country    varchar(80) NOT NULL,
    pincode    varchar(20),
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_addr_user ON user_addresses (user_id);

-- Sessions (refresh tokens)
CREATE TABLE user_sessions (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash text NOT NULL,
    device_fp  varchar(64),
    ip         inet,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sess_user ON user_sessions (user_id);
CREATE INDEX idx_sess_exp ON user_sessions (expires_at);

-- OAuth links
CREATE TABLE user_oauth (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider         varchar(30) NOT NULL,
    provider_user_id varchar(120) NOT NULL,
    created_at       timestamptz NOT NULL DEFAULT now(),
    UNIQUE (provider, provider_user_id)
);
CREATE INDEX idx_oauth_user ON user_oauth (user_id);

-- 2FA
CREATE TABLE user_2fa (
    user_id     uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    secret      text NOT NULL,
    enabled     boolean NOT NULL DEFAULT false,
    backup_codes text[],
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Privacy / GDPR
CREATE TABLE user_privacy (
    user_id      uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    visibility   varchar(20) NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','followers','private')),
    export_req   timestamptz,
    delete_req   timestamptz,
    deleted_at   timestamptz
);

-- ============================================================================
-- 2. ARTIST LAYER
-- ============================================================================

CREATE TABLE artist_profiles (
    user_id          uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    bio              text,
    experience_years int,
    education        jsonb,
    awards           jsonb,
    specialization   varchar(120),
    mediums          text[],
    styles           text[],
    subjects         text[],
    website          varchar(255),
    instagram        varchar(120),
    facebook         varchar(120),
    kyc_status       kyc_status NOT NULL DEFAULT 'unverified',
    rating_avg       numeric(3,2) DEFAULT 0,
    followers_count  int NOT NULL DEFAULT 0,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_artist_mediums ON artist_profiles USING gin (mediums);
CREATE INDEX idx_artist_styles  ON artist_profiles USING gin (styles);

-- 6-step application (draft resume)
CREATE TABLE artist_applications (
    user_id       uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    step          int NOT NULL DEFAULT 1 CHECK (step BETWEEN 1 AND 6),
    personal      jsonb,
    info          jsonb,
    portfolio     jsonb,
    kyc_docs      jsonb,                       -- encrypted refs only
    payment       jsonb,                       -- encrypted bank/upi
    submitted_at  timestamptz,
    reviewed_at   timestamptz,
    reviewed_by   uuid REFERENCES users(id),
    reject_reason text,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Portfolio images (non-shop)
CREATE TABLE artist_portfolio_imgs (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url        text NOT NULL,
    caption    varchar(200),
    sort_order int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_port_user ON artist_portfolio_imgs (user_id);

-- Payouts ledger
CREATE TYPE payout_status AS ENUM ('pending','processing','settled','held','failed');
CREATE TABLE artist_payouts (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount     numeric(12,2) NOT NULL,
    currency   char(3) NOT NULL DEFAULT 'INR',
    status     payout_status NOT NULL DEFAULT 'pending',
    method     varchar(20),
    txn_ref    varchar(120),
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payout_user ON artist_payouts (user_id, status);

-- Messages (buyer <-> artist)
CREATE TABLE artist_messages (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    buyer_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body       text NOT NULL,
    read_at    timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_msg_artist ON artist_messages (artist_id, created_at);
CREATE INDEX idx_msg_buyer  ON artist_messages (buyer_id, created_at);

-- ============================================================================
-- 3. ARTWORK LAYER
-- ============================================================================

CREATE TYPE artwork_status AS ENUM ('draft','in_review','published','rejected','archived','sold');

CREATE TABLE artworks (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title        varchar(160) NOT NULL,
    description  text,
    medium       varchar(60),
    style        varchar(60),
    subject      varchar(60),
    orientation  varchar(20),
    dimensions   varchar(40),
    year         int,
    price        numeric(12,2) NOT NULL,
    currency     char(3) NOT NULL DEFAULT 'INR',
    certificate  boolean NOT NULL DEFAULT false,
    tags         text[],
    images       jsonb,                          -- [{full, featured, thumb}]
    thumbnail    text,
    status       artwork_status NOT NULL DEFAULT 'draft',
    is_featured  boolean NOT NULL DEFAULT false,
    rating_avg   numeric(3,2) DEFAULT 0,
    views        int NOT NULL DEFAULT 0,
    saves        int NOT NULL DEFAULT 0,
    created_at   timestamptz NOT NULL DEFAULT now(),
    published_at timestamptz,
    updated_at   timestamptz NOT NULL DEFAULT now()
);
-- Shard key candidate: artist_id. Primary browse index:
CREATE INDEX idx_art_artist_status ON artworks (artist_id, status);
CREATE INDEX idx_art_published ON artworks (published_at) WHERE status = 'published';
CREATE INDEX idx_art_tags ON artworks USING gin (tags);
CREATE INDEX idx_art_featured ON artworks (is_featured) WHERE is_featured;
CREATE INDEX idx_art_title_trgm ON artworks USING gin (title gin_trgm_ops);

-- Reviews
CREATE TABLE artwork_reviews (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    artwork_id    uuid NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
    user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating        int NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title         varchar(160),
    body          text,
    helpful_count int NOT NULL DEFAULT 0,
    verified      boolean NOT NULL DEFAULT false,
    created_at    timestamptz NOT NULL DEFAULT now(),
    UNIQUE (artwork_id, user_id)
);
CREATE INDEX idx_rev_artwork ON artwork_reviews (artwork_id);

-- Wishlist (join)
CREATE TABLE artwork_saves (
    user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    artwork_id uuid NOT NULL REFERENCES artworks(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, artwork_id)
);
CREATE INDEX idx_saves_art ON artwork_saves (artwork_id);

-- Follows (join)
CREATE TABLE artist_follows (
    user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    artist_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, artist_id)
);
CREATE INDEX idx_follow_artist ON artist_follows (artist_id);

-- Orders
CREATE TYPE order_status AS ENUM ('placed','paid','shipped','delivered','completed','cancelled','refunded');
CREATE TABLE orders (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    artwork_id uuid NOT NULL REFERENCES artworks(id),
    amount     numeric(12,2) NOT NULL,
    currency   char(3) NOT NULL DEFAULT 'INR',
    status     order_status NOT NULL DEFAULT 'placed',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_buyer ON orders (buyer_id, created_at);
CREATE INDEX idx_orders_art ON orders (artwork_id);

-- ============================================================================
-- 4. ADMIN & PLATFORM
-- ============================================================================

-- Immutable audit log (append-only)
CREATE TABLE admin_audit (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id    uuid NOT NULL REFERENCES users(id),
    action      varchar(60) NOT NULL,
    entity_type varchar(40) NOT NULL,
    entity_id   uuid,
    meta        jsonb,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_entity ON admin_audit (entity_type, entity_id);
CREATE INDEX idx_audit_admin ON admin_audit (admin_id, created_at);

-- Categories (hierarchy)
CREATE TABLE categories (
    id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name      varchar(80) NOT NULL,
    slug      varchar(80) UNIQUE NOT NULL,
    parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
    sort_order int NOT NULL DEFAULT 0
);
CREATE INDEX idx_cat_parent ON categories (parent_id);

-- Collections
CREATE TABLE collections (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title       varchar(160) NOT NULL,
    slug        varchar(160) UNIQUE NOT NULL,
    curator_id  uuid REFERENCES users(id),
    artwork_ids uuid[],
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- Exhibitions
CREATE TABLE exhibitions (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title       varchar(160) NOT NULL,
    slug        varchar(160) UNIQUE NOT NULL,
    start_date  date,
    end_date    date,
    artwork_ids uuid[],
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- CMS pages
CREATE TABLE cms_pages (
    id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug      varchar(160) UNIQUE NOT NULL,
    title     varchar(200) NOT NULL,
    body      text,
    status    varchar(20) NOT NULL DEFAULT 'draft',
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       varchar(40) NOT NULL,
    channel    varchar(20) NOT NULL,
    body       text,
    read_at    timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_user ON notifications (user_id, read_at);

-- Review queue (admin tasks)
CREATE TYPE queue_status AS ENUM ('open','assigned','resolved');
CREATE TABLE review_queue (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type        varchar(20) NOT NULL CHECK (type IN ('artist','artwork')),
    ref_id      uuid NOT NULL,
    status      queue_status NOT NULL DEFAULT 'open',
    assigned_to uuid REFERENCES users(id),
    sla_due_at  timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_queue_status ON review_queue (status, type);

-- ============================================================================
-- 5. TRIGGERS (materialized counters / timestamps)
-- ============================================================================

-- updated_at maintenance
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated     BEFORE UPDATE ON users          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_art_app_updated   BEFORE UPDATE ON artist_applications FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_art_prof_updated  BEFORE UPDATE ON artist_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_artworks_updated  BEFORE UPDATE ON artworks       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_orders_updated    BEFORE UPDATE ON orders         FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Follower count sync
CREATE OR REPLACE FUNCTION sync_follower_count() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE artist_profiles SET followers_count = followers_count + 1 WHERE user_id = NEW.artist_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE artist_profiles SET followers_count = followers_count - 1 WHERE user_id = OLD.artist_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_follow_sync AFTER INSERT OR DELETE ON artist_follows
    FOR EACH ROW EXECUTE FUNCTION sync_follower_count();

-- Save count sync
CREATE OR REPLACE FUNCTION sync_save_count() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE artworks SET saves = saves + 1 WHERE id = NEW.artwork_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE artworks SET saves = saves - 1 WHERE id = OLD.artwork_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_save_sync AFTER INSERT OR DELETE ON artwork_saves
    FOR EACH ROW EXECUTE FUNCTION sync_save_count();

-- ============================================================================
-- 6. SCOPE COMPUTATION (helper for auth middleware)
-- ============================================================================
-- Recompute scopes when artist_status changes. Called from app layer or trigger.
CREATE OR REPLACE FUNCTION compute_scopes(p_role user_role, p_artist artist_status)
RETURNS jsonb AS $$
DECLARE
    s jsonb := '["browse"]'::jsonb;
BEGIN
    IF p_role = 'user' OR p_role = 'admin' THEN
        s := s || '["purchase","wishlist","review","follow"]'::jsonb;
    END IF;
    IF p_artist = 'approved' THEN
        s := s || '["upload_artwork","manage_artwork","artist_analytics","payout_manage"]'::jsonb;
    END IF;
    IF p_role = 'admin' THEN
        s := s || '["admin_review","admin_manage"]'::jsonb;
    END IF;
    RETURN s;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
