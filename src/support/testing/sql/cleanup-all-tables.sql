-- Cleanup All Tables
-- Drops and recreates all test tables (use with caution)

-- Drop tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS test_assignments;
DROP TABLE IF EXISTS test_tickets;
DROP TABLE IF EXISTS test_routes;
DROP TABLE IF EXISTS test_locations;

-- Drop indexes
DROP INDEX IF EXISTS idx_test_tickets_location;
DROP INDEX IF EXISTS idx_test_tickets_customer;
DROP INDEX IF EXISTS idx_test_assignments_ticket;
DROP INDEX IF EXISTS idx_test_assignments_route;
DROP INDEX IF EXISTS idx_test_routes_capacity;

-- Note: After running this script, you should run baseline-location-data.sql
-- to recreate the table structure and baseline data