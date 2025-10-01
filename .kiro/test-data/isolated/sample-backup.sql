-- Sample SQL backup for isolated testing
-- This file contains test data for the isolated testing mode

-- Create test customers
INSERT INTO customers (id, name, email, phone, is_test_data) VALUES 
('cust-isolated-001', 'Test Customer 1', 'test1@isolated.test', '555-0001', true),
('cust-isolated-002', 'Test Customer 2', 'test2@isolated.test', '555-0002', true),
('cust-isolated-003', 'Test Customer 3', 'test3@isolated.test', '555-0003', true);

-- Create test routes
INSERT INTO routes (id, name, location, is_test_data) VALUES 
('route-isolated-001', 'Test Route 1', 'Test Location 1', true),
('route-isolated-002', 'Test Route 2', 'Test Location 2', true),
('route-isolated-003', 'Test Route 3', 'Test Location 3', true);

-- Create test tickets
INSERT INTO tickets (id, customer_id, route_id, status, is_test_data) VALUES 
('ticket-isolated-001', 'cust-isolated-001', 'route-isolated-001', 'active', true),
('ticket-isolated-002', 'cust-isolated-002', 'route-isolated-002', 'pending', true),
('ticket-isolated-003', 'cust-isolated-003', 'route-isolated-003', 'completed', true);

-- Verification queries for data integrity
-- SELECT COUNT(*) as customer_count FROM customers WHERE is_test_data = true;
-- SELECT COUNT(*) as route_count FROM routes WHERE is_test_data = true;
-- SELECT COUNT(*) as ticket_count FROM tickets WHERE is_test_data = true;