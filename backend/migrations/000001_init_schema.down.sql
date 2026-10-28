-- Rollback skema awal (urutan terbalik dari 000001_init_schema.up.sql)
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS property_facilities;
DROP TABLE IF EXISTS property_images;
DROP TABLE IF EXISTS properties;
DROP TABLE IF EXISTS cities;
DROP TABLE IF EXISTS provinces;
DROP TABLE IF EXISTS facilities;
DROP TABLE IF EXISTS property_types;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS agents;
DROP TABLE IF EXISTS users;

DROP SEQUENCE IF EXISTS agent_code_seq;
DROP SEQUENCE IF EXISTS property_code_seq;

DROP TYPE IF EXISTS facing_direction;
DROP TYPE IF EXISTS furnishing_type;
DROP TYPE IF EXISTS certificate_type;
DROP TYPE IF EXISTS rent_period;
DROP TYPE IF EXISTS property_status;
DROP TYPE IF EXISTS market_type;
DROP TYPE IF EXISTS listing_type;
DROP TYPE IF EXISTS user_status;
DROP TYPE IF EXISTS user_role;
