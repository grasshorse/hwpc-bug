-- Optimal Assignment Scenario Setup
-- Creates test data for validating optimal route assignment algorithms

-- Insert scenario-specific test locations with known distances
INSERT OR IGNORE INTO test_locations (id, name, latitude, longitude, address) VALUES
('scenario-opt-loc-001', 'Optimal Test Location 1', 42.505000, -92.505000, '100 Optimal Street'),
('scenario-opt-loc-002', 'Optimal Test Location 2', 42.515000, -92.515000, '200 Optimal Avenue'),
('scenario-opt-loc-003', 'Optimal Test Location 3', 42.525000, -92.525000, '300 Optimal Boulevard');

-- Insert scenario-specific test routes with different service areas
INSERT OR IGNORE INTO test_routes (id, name, capacity, current_load, start_time, end_time, days_of_week, technician_id, technician_name) VALUES
('scenario-opt-route-001', 'Optimal Route Close', 10, 2, '08:00:00', '17:00:00', '["monday","tuesday","wednesday","thursday","friday"]', 'opt-tech-001', 'Optimal Tech Alpha'),
('scenario-opt-route-002', 'Optimal Route Medium', 10, 5, '09:00:00', '18:00:00', '["monday","tuesday","wednesday","thursday","friday"]', 'opt-tech-002', 'Optimal Tech Beta'),
('scenario-opt-route-003', 'Optimal Route Far', 10, 1, '07:30:00', '16:30:00', '["monday","wednesday","friday"]', 'opt-tech-003', 'Optimal Tech Gamma');

-- Insert test tickets for optimal assignment testing
-- These tickets are positioned to test distance-based assignment logic
INSERT OR IGNORE INTO test_tickets (id, customer_id, customer_name, latitude, longitude, address, priority, service_type) VALUES
('opt-ticket-001', 'opt-cust-001', 'Optimal Customer Alpha - looneyTunesTest', 42.505100, -92.505100, '101 Optimal Street', 'medium', 'repair'),
('opt-ticket-002', 'opt-cust-002', 'Optimal Customer Beta - looneyTunesTest', 42.515200, -92.515200, '202 Optimal Avenue', 'high', 'installation'),
('opt-ticket-003', 'opt-cust-003', 'Optimal Customer Gamma - looneyTunesTest', 42.525300, -92.525300, '303 Optimal Boulevard', 'low', 'maintenance');

-- Expected optimal assignments (for validation):
-- opt-ticket-001 should be assigned to scenario-opt-route-001 (closest)
-- opt-ticket-002 should be assigned to scenario-opt-route-002 (closest available capacity)
-- opt-ticket-003 should be assigned to scenario-opt-route-003 (closest)