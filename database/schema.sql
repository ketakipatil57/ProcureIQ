-- ============================================================================
-- ProcureIQ Relational Database Schema
-- Compatible with MySQL 8.x+ and Spring Data JPA
-- ============================================================================

CREATE DATABASE IF NOT EXISTS procureiq
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE procureiq;

-- Drop dependent tables first to avoid foreign key constraint violations
DROP TABLE IF EXISTS standard_relationships;
DROP TABLE IF EXISTS certification_requirements;
DROP TABLE IF EXISTS standards;
DROP TABLE IF EXISTS users;

-- ============================================================================
-- Table: users
-- Application authentication and authorization
-- ============================================================================
CREATE TABLE users (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100)    NOT NULL,
    email       VARCHAR(255)    NOT NULL,
    password    VARCHAR(255)    NOT NULL,
    role        VARCHAR(50)     NOT NULL DEFAULT 'PROCUREMENT_OFFICER',
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_users_email ON users (email);

-- ============================================================================
-- Table: standards
-- Master table representing Indian Standards catalog
-- ============================================================================
CREATE TABLE standards (
    is_number               VARCHAR(50)     NOT NULL,
    title                   VARCHAR(255)    NOT NULL,
    category                VARCHAR(100)    NOT NULL,
    scope_summary           TEXT            NULL,
    semantic_keywords       VARCHAR(255)    NULL,
    search_text             TEXT            NULL,
    edition_year            INT             NULL,
    status                  VARCHAR(100)    NULL,
    superseding_is          VARCHAR(100)    NULL,
    amendment_count         VARCHAR(100)    NULL,
    latest_amendment_note   VARCHAR(255)    NULL,
    certification_status    VARCHAR(100)    NULL,
    certification_type      VARCHAR(255)    NULL,
    qco_reference           VARCHAR(255)    NULL,
    related_standards       VARCHAR(255)    NULL,
    verification_status     VARCHAR(50)     NULL,
    data_quality_note       VARCHAR(255)    NULL,
    source_url              VARCHAR(500)    NULL,
    CONSTRAINT pk_standards PRIMARY KEY (is_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes on standards for common query access paths
CREATE INDEX idx_standards_category ON standards (category);
CREATE INDEX idx_standards_edition_year ON standards (edition_year);
CREATE INDEX idx_standards_status ON standards (status);
CREATE INDEX idx_standards_cert_status ON standards (certification_status);

-- ============================================================================
-- Table: certification_requirements
-- Captures certification obligations and QCO applicability for each standard
-- References master table standards via is_number
-- ============================================================================
CREATE TABLE certification_requirements (
    certification_id        BIGINT          NOT NULL AUTO_INCREMENT,
    is_number               VARCHAR(50)     NOT NULL,
    certification_type      VARCHAR(255)    NULL,
    requirement_status      VARCHAR(100)    NULL,
    requirement_description TEXT            NULL,
    qco_reference           VARCHAR(255)    NULL,
    source_url              VARCHAR(500)    NULL,
    CONSTRAINT pk_certification_requirements PRIMARY KEY (certification_id),
    CONSTRAINT fk_cert_is_number FOREIGN KEY (is_number)
        REFERENCES standards (is_number)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for certification requirements lookups
CREATE INDEX idx_cert_is_number ON certification_requirements (is_number);
CREATE INDEX idx_cert_type ON certification_requirements (certification_type);
CREATE INDEX idx_cert_status ON certification_requirements (requirement_status);

-- ============================================================================
-- Table: standard_relationships
-- Captures mapped relationships between standards and related concepts/standards
-- References source standard via source_is_number
-- ============================================================================
CREATE TABLE standard_relationships (
    relationship_id         BIGINT          NOT NULL AUTO_INCREMENT,
    source_is_number        VARCHAR(50)     NOT NULL,
    target_is_number        VARCHAR(100)    NOT NULL,
    relationship_type       VARCHAR(50)     NOT NULL,
    description             VARCHAR(255)    NULL,
    source_url              VARCHAR(500)    NULL,
    CONSTRAINT pk_standard_relationships PRIMARY KEY (relationship_id),
    CONSTRAINT fk_rel_source_is_number FOREIGN KEY (source_is_number)
        REFERENCES standards (is_number)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT uq_rel_source_target UNIQUE (source_is_number, target_is_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for relationship lookups and graph/join queries
CREATE INDEX idx_rel_source_is_number ON standard_relationships (source_is_number);
CREATE INDEX idx_rel_target_is_number ON standard_relationships (target_is_number);
CREATE INDEX idx_rel_type ON standard_relationships (relationship_type);
