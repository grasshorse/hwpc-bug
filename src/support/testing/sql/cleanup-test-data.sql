-- Cleanup Test Data
-- Removes test data while preserving table structure and baseline data

-- Delete test assignments (cascading cleanup)
DELETE FROM test_assignments 
WHERE ticket_id IN (
    SELECT id FROM test_tickets 
    WHERE is_test_data = TRUE 
    AND created_at >= datetime('now', '-1 day')
);

-- Delete test tickets created in the last day
DELETE FROM test_tickets 
WHERE is_test_data = TRUE 
AND created_at >= datetime('now', '-1 day');

-- Reset route current_load for test routes
UPDATE test_routes 
SET current_load = 0 
WHERE is_test_route = TRUE;

-- Delete temporary test routes (keep baseline routes)
DELETE FROM test_routes 
WHERE is_test_route = TRUE 
AND created_at >= datetime('now', '-1 day')
AND id NOT LIKE 'test-route-%';

-- Delete temporary test locations (keep baseline locations)
DELETE FROM test_locations 
WHERE is_test_location = TRUE 
AND created_at >= datetime('now', '-1 day')
AND id NOT LIKE 'test-loc-%';

-- Reset auto-increment counters if supported
-- Note: This is database-specific and may need adjustment for different databases