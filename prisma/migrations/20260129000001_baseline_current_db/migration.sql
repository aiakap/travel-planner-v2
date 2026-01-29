-- Baseline migration to sync schema with actual database state
-- This migration captures all changes that were applied via `prisma db push`
-- including TripIntelligence, TripPDF, and other models

-- Note: All tables and columns already exist in the database
-- This migration serves as documentation and ensures future migrations work correctly

-- The following changes already exist in the database:
-- 1. TripIntelligence table and all related intelligence tables
-- 2. TripPDF table  
-- 3. ImagePromptStyle table and updated ImagePrompt relations
-- 4. All profile system tables (ProfileCategory, ProfileValue, etc.)
-- 5. Travel extraction queue system
-- 6. User contact and hobby systems
-- 7. Various enum types (ChatType, ExtractionStatus, TripPermission, TripStatus)

-- This is an empty migration that marks the current state as the baseline
SELECT 1;
