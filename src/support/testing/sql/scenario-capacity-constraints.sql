-- Capacity Constraints Scenario Setup
-- Creates test data for validating route capacity management and constraint handling

-- Insert scenario-specific test routes with different capacity situations
INSERT OR IGNORE INTO test_routes (id, name, capacity, current_load, start_time, end_time, days_of_week, technician_id, technician_name) VALUES
('scenario-cap-route-001', 'Capacity Route Full', 5, 5, '08:00:00', '17:00:00', '["monday","tuesday","wednesday","thursday","friday"]', 'cap-tech-001', 'Capacity Tech Alpha'),
('scenario-cap-route-002', 'Capacity Route Near Full', 8, 7, '09:00:00', '18:00:00', '["monday","tuesday","wednesday","thursday","friday"]', 'cap-tech-002', 'Capacity Tech Beta'),
('scenario-cap-route-003', 'Capacity Route Available', 10, 3, '07:30:00', '16:30:00', '["monday","wednesday","friday"]', 'cap-tech-003', 'Capacity Tech Gamma'),
('scenario-cap-route-004', 'Capacity Route Empty', 12, 0, '10:00:00', '19:00:00', '["tuesday","thursday"]', 'cap-tech-004', 'Capacity Tech Delta');

-- Insert test locations for capacity testing
INSERT OR IGNORE INTO test_locations (id, name, latitude, longitude, address) VALUES
('scenario-cap-loc-001', 'Capacity Test Location 1', 42.506000, -92.506000, '100 Capacity Street'),
('scenario-cap-loc-002', 'Capacity Test Location 2', 42.516000, -92.516000, '200 Capacity Avenue'),
('scenario-cap-loc-003', 'Capacity Test Location 3', 42.526000, -92.526000, '300 Capacity Boulevard'),
('scenario-cap-loc-004', 'Capacity Test Location 4', 42.536000, -92.536000, '400 Capacity Circle');

-- Insert test tickets that will test capacity constraints
INSERT OR IGNORE INTO test_tickets (id, customer_id, customer_name, latitude, longitude, address, priority, service_type) VALUES
('cap-ticket-001', 'cap-cust-001', 'Capacity Customer Alpha - looneyTunesTest', 42.506100, -92.506100, '101 Capacity Street', 'high', 'repair'),
('cap-ticket-002', 'cap-cust-002', 'Capacity Customer Beta - looneyTunesTest', 42.516200, -92.516200, '202 Capacity Avenue', 'medium', 'installation'),
('cap-ticket-003', 'cap-cust-003', 'Capacity Customer Gamma - looneyTunesTest', 42.526300, -92.526300, '303 Capacity Boulevard', 'urgent', 'maintenance'),
('cap-ticket-004', 'cap-cust-004', 'Capacity Customer Delta - looneyTunesTest', 42.536400, -92.536400, '404 Capacity Circle', 'low', 'inspection'),
('cap-ticket-005', 'cap-cust-005', 'Capacity Customer Epsilon - looneyTunesTest', 42.506500, -92.506500, '105 Capacity Street', 'medium', 'repair');

-- Pre-populate some assignments to create capacity constraints
INSERT OR IGNORE INTO test_assignments (id, ticket_id, route_id, assigned_by, estimated_distance) VALUES
('cap-assign-001', 'existing-ticket-001', 'scenario-cap-route-001', 'system', 1.2),
('cap-assign-002', 'existing-ticket-002', 'scenario-cap-route-001', 'system', 1.5),
('cap-assign-003', 'existing-ticket-003', 'scenario-cap-route-001', 'system', 0.8),
('cap-assign-004', 'existing-ticket-004', 'scenario-cap-route-001', 'system', 2.1),
('cap-assign-005', 'existing-ticket-005', 'scenario-cap-route-001', 'system', 1.7);

-- Expected behavior:
-- cap-ticket-001 should trigger capacity warning for scenario-cap-route-001 (full)
-- cap-ticket-002 should trigger capacity warning for scenario-cap-route-002 (near full)
-- cap-ticket-003 should be assignable to scenario-cap-route-003 (available)
-- cap-ticket-004 should be assignable to scenario-cap-route-004 (empty)
-- Bulk assignment should distribute tickets to avoid capacity violations