-- Skema awal MasterPro v1 (PRD §13.3). JANGAN diedit setelah di-merge ke main; buat migrasi baru.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TYPE user_role        AS ENUM ('admin', 'agent');
CREATE TYPE user_status      AS ENUM ('active', 'inactive');
CREATE TYPE listing_type     AS ENUM ('sale', 'rent');
CREATE TYPE market_type      AS ENUM ('primary', 'secondary');
CREATE TYPE property_status  AS ENUM ('draft', 'active', 'sold', 'rented', 'inactive');
CREATE TYPE rent_period      AS ENUM ('monthly', 'yearly');
CREATE TYPE certificate_type AS ENUM ('shm', 'hgb', 'strata', 'girik', 'ajb', 'ppjb', 'other');
CREATE TYPE furnishing_type  AS ENUM ('unfurnished', 'semi_furnished', 'fully_furnished');
CREATE TYPE facing_direction AS ENUM ('north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest');

CREATE SEQUENCE property_code_seq START 1;
CREATE SEQUENCE agent_code_seq START 1;

-- Akun ------------------------------------------------------------
CREATE TABLE users (
  id                  UUID PRIMARY KEY,
  name                VARCHAR(120) NOT NULL,
  email               VARCHAR(160) NOT NULL,
  phone               VARCHAR(20),
  password_hash       VARCHAR(100) NOT NULL,
  role                user_role    NOT NULL,
  status              user_status  NOT NULL DEFAULT 'active',
  avatar_key          VARCHAR(255),
  last_login_at       TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_users_email_lower ON users (lower(email));
CREATE INDEX idx_users_role_status ON users (role, status);

CREATE TABLE agents (
  id              UUID PRIMARY KEY,
  user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
  agent_code      VARCHAR(12)  NOT NULL UNIQUE,          -- AG-0001
  whatsapp_number VARCHAR(20)  NOT NULL,                 -- 6281234567890
  bio             TEXT,
  service_area    VARCHAR(160),
  joined_at       DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_agents_whatsapp CHECK (whatsapp_number ~ '^62[0-9]{8,13}$')
);

CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id   UUID NOT NULL,
  token_hash  CHAR(64) NOT NULL UNIQUE,                  -- SHA-256 hex
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  replaced_by UUID REFERENCES refresh_tokens(id),
  user_agent  VARCHAR(255),
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_refresh_tokens_family ON refresh_tokens (family_id);

-- Referensi -------------------------------------------------------
CREATE TABLE property_types (
  id         SMALLINT PRIMARY KEY,
  slug       VARCHAR(30) NOT NULL UNIQUE,
  name_id    VARCHAR(50) NOT NULL,
  name_en    VARCHAR(50) NOT NULL,
  allow_sale BOOLEAN NOT NULL DEFAULT true,
  allow_rent BOOLEAN NOT NULL DEFAULT false,
  sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE facilities (
  id         SMALLINT PRIMARY KEY,
  slug       VARCHAR(40) NOT NULL UNIQUE,
  name_id    VARCHAR(60) NOT NULL,
  name_en    VARCHAR(60) NOT NULL,
  icon       VARCHAR(40) NOT NULL,                       -- nama ikon lucide
  sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE provinces (
  id   SMALLINT PRIMARY KEY,
  code CHAR(2)      NOT NULL UNIQUE,                     -- kode Kemendagri
  name VARCHAR(80)  NOT NULL,
  slug VARCHAR(80)  NOT NULL UNIQUE
);

CREATE TABLE cities (
  id          INTEGER PRIMARY KEY,
  province_id SMALLINT    NOT NULL REFERENCES provinces(id),
  code        VARCHAR(5)  NOT NULL UNIQUE,               -- mis. 21.71
  name        VARCHAR(100) NOT NULL,                     -- mis. Kota Batam
  slug        VARCHAR(100) NOT NULL UNIQUE,              -- mis. kota-batam
  kind        VARCHAR(10)  NOT NULL CHECK (kind IN ('kota', 'kabupaten'))
);
CREATE INDEX idx_cities_province ON cities (province_id);
CREATE INDEX idx_cities_name_trgm ON cities USING gin (name gin_trgm_ops);

-- Properti --------------------------------------------------------
CREATE TABLE properties (
  id                   UUID PRIMARY KEY,
  code                 VARCHAR(12)  NOT NULL UNIQUE,     -- MP-000123
  slug                 VARCHAR(100) NOT NULL UNIQUE,
  agent_id             UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
  created_by           UUID NOT NULL REFERENCES users(id),
  updated_by           UUID REFERENCES users(id),

  listing_type         listing_type    NOT NULL,
  market_type          market_type     NOT NULL,
  property_type_id     SMALLINT        NOT NULL REFERENCES property_types(id),
  status               property_status NOT NULL DEFAULT 'draft',

  title                VARCHAR(160) NOT NULL,
  description          TEXT         NOT NULL,
  price                BIGINT       NOT NULL CHECK (price > 0),
  rent_period          rent_period,
  is_price_negotiable  BOOLEAN      NOT NULL DEFAULT false,

  province_id          SMALLINT NOT NULL REFERENCES provinces(id),
  city_id              INTEGER  NOT NULL REFERENCES cities(id),
  district             VARCHAR(100),
  address              VARCHAR(255),
  latitude             NUMERIC(9,6),
  longitude            NUMERIC(9,6),

  land_area            NUMERIC(10,2) CHECK (land_area > 0),
  building_area        NUMERIC(10,2) CHECK (building_area > 0),
  bedrooms             SMALLINT CHECK (bedrooms >= 0),
  bathrooms            SMALLINT CHECK (bathrooms >= 0),
  maid_bedrooms        SMALLINT CHECK (maid_bedrooms >= 0),
  floors               SMALLINT CHECK (floors > 0),
  floor_level          SMALLINT,
  total_rooms          SMALLINT CHECK (total_rooms > 0),
  carports             SMALLINT CHECK (carports >= 0),
  garages              SMALLINT CHECK (garages >= 0),
  electricity_va       INTEGER  CHECK (electricity_va > 0),
  water_source         VARCHAR(40),
  certificate          certificate_type,
  furnishing           furnishing_type,
  facing               facing_direction,
  year_built           SMALLINT CHECK (year_built BETWEEN 1900 AND 2100),
  video_url            VARCHAR(255),

  view_count           INTEGER NOT NULL DEFAULT 0,
  whatsapp_click_count INTEGER NOT NULL DEFAULT 0,
  is_featured          BOOLEAN NOT NULL DEFAULT false,

  published_at         TIMESTAMPTZ,
  closed_at            TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at           TIMESTAMPTZ,

  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(code, '') || ' ' || coalesce(district, '') || ' ' || coalesce(address, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'C')
  ) STORED,

  CONSTRAINT chk_properties_rent_period CHECK (
    (listing_type = 'rent' AND rent_period IS NOT NULL) OR
    (listing_type = 'sale' AND rent_period IS NULL)
  ),
  CONSTRAINT chk_properties_status_listing CHECK (
    NOT (status = 'sold'   AND listing_type <> 'sale') AND
    NOT (status = 'rented' AND listing_type <> 'rent')
  )
);

CREATE INDEX idx_properties_public  ON properties (status, listing_type, published_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_agent   ON properties (agent_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_type    ON properties (property_type_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_city    ON properties (city_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_price   ON properties (price) WHERE deleted_at IS NULL;
CREATE INDEX idx_properties_popular ON properties (view_count DESC) WHERE status = 'active' AND deleted_at IS NULL;
CREATE INDEX idx_properties_search  ON properties USING gin (search_vector);
CREATE INDEX idx_properties_title_trgm ON properties USING gin (title gin_trgm_ops);

CREATE TABLE property_images (
  id          UUID PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  object_key  VARCHAR(255) NOT NULL UNIQUE,
  width       INTEGER  NOT NULL,
  height      INTEGER  NOT NULL,
  size_bytes  INTEGER  NOT NULL,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  is_cover    BOOLEAN  NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_property_images_property ON property_images (property_id, sort_order);
CREATE UNIQUE INDEX uq_property_images_cover ON property_images (property_id) WHERE is_cover;

CREATE TABLE property_facilities (
  property_id UUID     NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  facility_id SMALLINT NOT NULL REFERENCES facilities(id),
  PRIMARY KEY (property_id, facility_id)
);

-- Audit -----------------------------------------------------------
CREATE TABLE audit_logs (
  id            BIGSERIAL PRIMARY KEY,
  actor_user_id UUID REFERENCES users(id),
  action        VARCHAR(60) NOT NULL,     -- mis. property.status_changed, user.password_reset
  entity_type   VARCHAR(40) NOT NULL,     -- user | agent | property
  entity_id     UUID,
  changes       JSONB,                    -- {"field": {"from": .., "to": ..}}; tanpa data sensitif
  ip_address    INET,
  user_agent    VARCHAR(255),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_logs_actor  ON audit_logs (actor_user_id, created_at DESC);
