-- Script para inicializar la base de datos account.sqlite con las tablas necesarias
-- Basado en las migraciones de Actual Budget

BEGIN TRANSACTION;

-- Tabla auth (desde migración 1694360479680)
CREATE TABLE IF NOT EXISTS auth (
    method TEXT PRIMARY KEY,
    display_name TEXT,
    extra_data TEXT,
    active INTEGER
);

-- Tabla sessions (desde migración 1694360479680)
CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    expires_at INTEGER,
    user_id TEXT,
    auth_method TEXT
);

-- Tabla files (desde migración 1694360479680)
CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    group_id TEXT,
    sync_version SMALLINT,
    encrypt_meta TEXT,
    encrypt_keyid TEXT,
    encrypt_salt TEXT,
    encrypt_test TEXT,
    deleted BOOLEAN DEFAULT FALSE,
    name TEXT,
    owner TEXT
);

-- Tabla users (desde migración 1719409568000)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    user_name TEXT,
    display_name TEXT,
    role TEXT,
    enabled INTEGER NOT NULL DEFAULT 1,
    owner INTEGER NOT NULL DEFAULT 0
);

-- Tabla user_access (desde migración 1719409568000)
CREATE TABLE IF NOT EXISTS user_access (
    user_id TEXT,
    file_id TEXT,
    PRIMARY KEY (user_id, file_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (file_id) REFERENCES files(id)
);

-- Tabla secrets (desde migración 1694362247011)
CREATE TABLE IF NOT EXISTS secrets (
    name TEXT PRIMARY KEY,
    value BLOB
);

-- Tabla pending_openid_requests (desde migración 1718889148000)
CREATE TABLE IF NOT EXISTS pending_openid_requests (
    state TEXT PRIMARY KEY,
    code_verifier TEXT,
    return_url TEXT,
    expiry_time INTEGER
);

COMMIT;
