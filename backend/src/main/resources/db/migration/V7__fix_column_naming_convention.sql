-- V7__fix_column_naming_convention.sql
-- SpringPhysicalNamingStrategy does not insert underscore before uppercase followed by a digit.
-- Entity field betonCouleM3 maps to beton_coulem3 (not beton_coule_m3).
-- Rename the column created by the initial migration to match what Hibernate expects.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'rapports_journaliers'
          AND column_name  = 'beton_coule_m3'
    ) THEN
        ALTER TABLE rapports_journaliers RENAME COLUMN beton_coule_m3 TO beton_coulem3;
    END IF;
END $$;
