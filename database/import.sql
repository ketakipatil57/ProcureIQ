-- ============================================================================
-- ProcureIQ Database Import Script
-- Loads CSV datasets from data/ directory into MySQL tables
-- ============================================================================
-- IMPORTANT PATH CONFIGURATION:
-- Update the file paths in the 'LOAD DATA LOCAL INFILE' statements below if your
-- repository is located in a different directory.
-- On Windows, always use forward slashes (/) or escaped backslashes (\\).
--
-- Default paths configured for this environment:
--   1. standards.csv:
--      'D:/Java Course/ProcureIQ/data/standards.csv'
--   2. certification_requirements.csv:
--      'D:/Java Course/ProcureIQ/data/certification_requirements.csv'
--   3. standard_relationships.csv:
--      'D:/Java Course/ProcureIQ/data/standard_relationships.csv'
-- ============================================================================

USE procureiq;

SET NAMES utf8mb4;

-- ============================================================================
-- Step 0: Clean existing data for safe, idempotent re-runs in development
-- Disabling foreign key checks during truncation ensures clean resets of
-- child tables, master table, and auto-increment sequences without duplicates.
-- ============================================================================
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE standard_relationships;
TRUNCATE TABLE certification_requirements;
TRUNCATE TABLE standards;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- Step 1: Import standards (Master Table)
-- Must be imported FIRST before dependent child tables (foreign key reference)
-- ============================================================================
-- Path to configure: standards.csv
LOAD DATA LOCAL INFILE 'D:/Java Course/ProcureIQ/data/standards.csv'
INTO TABLE standards
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
ESCAPED BY '\\'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(
    is_number,
    title,
    category,
    scope_summary,
    semantic_keywords,
    search_text,
    edition_year,
    status,
    superseding_is,
    amendment_count,
    latest_amendment_note,
    certification_status,
    certification_type,
    qco_reference,
    related_standards,
    verification_status,
    data_quality_note,
    source_url
);

-- ============================================================================
-- Step 2: Import certification_requirements (Child Table)
-- References standards(is_number)
-- ============================================================================
-- Path to configure: certification_requirements.csv
LOAD DATA LOCAL INFILE 'D:/Java Course/ProcureIQ/data/certification_requirements.csv'
INTO TABLE certification_requirements
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
ESCAPED BY '\\'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(
    certification_id,
    is_number,
    certification_type,
    requirement_status,
    requirement_description,
    qco_reference,
    source_url
);

-- ============================================================================
-- Step 3: Import standard_relationships (Child / Association Table)
-- References standards(is_number) via source_is_number
-- ============================================================================
-- Path to configure: standard_relationships.csv
LOAD DATA LOCAL INFILE 'D:/Java Course/ProcureIQ/data/standard_relationships.csv'
INTO TABLE standard_relationships
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
ESCAPED BY '\\'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(
    relationship_id,
    source_is_number,
    target_is_number,
    relationship_type,
    description,
    source_url
);

-- ============================================================================
-- Step 4: Verification Summary
-- Expected record counts:
--   - standards: 60
--   - certification_requirements: 60
--   - standard_relationships: 384
-- ============================================================================
SELECT 'standards' AS table_name, COUNT(*) AS loaded_rows FROM standards
UNION ALL
SELECT 'certification_requirements', COUNT(*) FROM certification_requirements
UNION ALL
SELECT 'standard_relationships', COUNT(*) FROM standard_relationships;
