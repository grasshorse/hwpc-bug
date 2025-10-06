-- Bulk Assignment Scenario Setup
-- Creates test data for validating bulk assignment processing and distribution

-- Insert test routes for bulk assignment testing
INSERT OR IGNORE INTO test_routes (id, name, capacity, current_load, start_time, end_time, days_of_week, technician_id, technician_name) VALUES
('scenario-bulk-route-001', 'Bulk Route Alpha', 20, 5, '08:00:00', '17:00:00', '["monday","tuesday","wednesday","thursday","friday"]', 'bulk-tech-001', 'Bulk Tech Alpha'),
('scenario-bulk-route-002', 'Bulk Route Beta', 18, 3, '09:00:00', '18:00:00', '["monday","tuesday","wednesday","thursday","friday"]', 'bulk-tech-002', 'Bulk Tech Beta'),
('scenario-bulk-route-003', 'Bulk Route Gamma', 15, 2, '07:30:00', '16:30:00', '["monday","wednesday","friday"]', 'bulk-tech-003', 'Bulk Tech Gamma'),
('scenario-bulk-route-004', 'Bulk Route Delta', 12, 1, '10:00:00', '19:00:00', '["tuesday","thursday"]', 'bulk-tech-004', 'Bulk Tech Delta'),
('scenario-bulk-route-005', 'Bulk Route Epsilon', 25, 0, '08:30:00', '17:30:00', '["monday","tuesday","wednesday","thursday","friday"]', 'bulk-tech-005', 'Bulk Tech Epsilon');

-- Insert test locations in clusters for bulk testing
INSERT OR IGNORE INTO test_locations (id, name, latitude, longitude, address) VALUES
-- Cluster 1 (North)
('scenario-bulk-loc-n01', 'Bulk North Location 1', 42.550000, -92.500000, '1001 North Bulk Street'),
('scenario-bulk-loc-n02', 'Bulk North Location 2', 42.551000, -92.501000, '1002 North Bulk Street'),
('scenario-bulk-loc-n03', 'Bulk North Location 3', 42.552000, -92.502000, '1003 North Bulk Street'),
('scenario-bulk-loc-n04', 'Bulk North Location 4', 42.553000, -92.503000, '1004 North Bulk Street'),
('scenario-bulk-loc-n05', 'Bulk North Location 5', 42.554000, -92.504000, '1005 North Bulk Street'),
-- Cluster 2 (South)
('scenario-bulk-loc-s01', 'Bulk South Location 1', 42.480000, -92.480000, '2001 South Bulk Avenue'),
('scenario-bulk-loc-s02', 'Bulk South Location 2', 42.481000, -92.481000, '2002 South Bulk Avenue'),
('scenario-bulk-loc-s03', 'Bulk South Location 3', 42.482000, -92.482000, '2003 South Bulk Avenue'),
('scenario-bulk-loc-s04', 'Bulk South Location 4', 42.483000, -92.483000, '2004 South Bulk Avenue'),
('scenario-bulk-loc-s05', 'Bulk South Location 5', 42.484000, -92.484000, '2005 South Bulk Avenue'),
-- Cluster 3 (East)
('scenario-bulk-loc-e01', 'Bulk East Location 1', 42.515000, -92.470000, '3001 East Bulk Boulevard'),
('scenario-bulk-loc-e02', 'Bulk East Location 2', 42.516000, -92.471000, '3002 East Bulk Boulevard'),
('scenario-bulk-loc-e03', 'Bulk East Location 3', 42.517000, -92.472000, '3003 East Bulk Boulevard'),
('scenario-bulk-loc-e04', 'Bulk East Location 4', 42.518000, -92.473000, '3004 East Bulk Boulevard'),
('scenario-bulk-loc-e05', 'Bulk East Location 5', 42.519000, -92.474000, '3005 East Bulk Boulevard');

-- Insert bulk test tickets (30 tickets for bulk processing)
INSERT OR IGNORE INTO test_tickets (id, customer_id, customer_name, latitude, longitude, address, priority, service_type) VALUES
-- North cluster tickets
('bulk-ticket-n01', 'bulk-cust-n01', 'Bulk North Customer 1 - looneyTunesTest', 42.550100, -92.500100, '1001 North Bulk Street', 'medium', 'repair'),
('bulk-ticket-n02', 'bulk-cust-n02', 'Bulk North Customer 2 - looneyTunesTest', 42.551100, -92.501100, '1002 North Bulk Street', 'high', 'installation'),
('bulk-ticket-n03', 'bulk-cust-n03', 'Bulk North Customer 3 - looneyTunesTest', 42.552100, -92.502100, '1003 North Bulk Street', 'low', 'maintenance'),
('bulk-ticket-n04', 'bulk-cust-n04', 'Bulk North Customer 4 - looneyTunesTest', 42.553100, -92.503100, '1004 North Bulk Street', 'medium', 'inspection'),
('bulk-ticket-n05', 'bulk-cust-n05', 'Bulk North Customer 5 - looneyTunesTest', 42.554100, -92.504100, '1005 North Bulk Street', 'urgent', 'repair'),
('bulk-ticket-n06', 'bulk-cust-n06', 'Bulk North Customer 6 - looneyTunesTest', 42.550200, -92.500200, '1006 North Bulk Street', 'medium', 'repair'),
('bulk-ticket-n07', 'bulk-cust-n07', 'Bulk North Customer 7 - looneyTunesTest', 42.551200, -92.501200, '1007 North Bulk Street', 'high', 'installation'),
('bulk-ticket-n08', 'bulk-cust-n08', 'Bulk North Customer 8 - looneyTunesTest', 42.552200, -92.502200, '1008 North Bulk Street', 'low', 'maintenance'),
('bulk-ticket-n09', 'bulk-cust-n09', 'Bulk North Customer 9 - looneyTunesTest', 42.553200, -92.503200, '1009 North Bulk Street', 'medium', 'inspection'),
('bulk-ticket-n10', 'bulk-cust-n10', 'Bulk North Customer 10 - looneyTunesTest', 42.554200, -92.504200, '1010 North Bulk Street', 'high', 'repair'),
-- South cluster tickets
('bulk-ticket-s01', 'bulk-cust-s01', 'Bulk South Customer 1 - looneyTunesTest', 42.480100, -92.480100, '2001 South Bulk Avenue', 'medium', 'repair'),
('bulk-ticket-s02', 'bulk-cust-s02', 'Bulk South Customer 2 - looneyTunesTest', 42.481100, -92.481100, '2002 South Bulk Avenue', 'high', 'installation'),
('bulk-ticket-s03', 'bulk-cust-s03', 'Bulk South Customer 3 - looneyTunesTest', 42.482100, -92.482100, '2003 South Bulk Avenue', 'low', 'maintenance'),
('bulk-ticket-s04', 'bulk-cust-s04', 'Bulk South Customer 4 - looneyTunesTest', 42.483100, -92.483100, '2004 South Bulk Avenue', 'medium', 'inspection'),
('bulk-ticket-s05', 'bulk-cust-s05', 'Bulk South Customer 5 - looneyTunesTest', 42.484100, -92.484100, '2005 South Bulk Avenue', 'urgent', 'repair'),
('bulk-ticket-s06', 'bulk-cust-s06', 'Bulk South Customer 6 - looneyTunesTest', 42.480200, -92.480200, '2006 South Bulk Avenue', 'medium', 'repair'),
('bulk-ticket-s07', 'bulk-cust-s07', 'Bulk South Customer 7 - looneyTunesTest', 42.481200, -92.481200, '2007 South Bulk Avenue', 'high', 'installation'),
('bulk-ticket-s08', 'bulk-cust-s08', 'Bulk South Customer 8 - looneyTunesTest', 42.482200, -92.482200, '2008 South Bulk Avenue', 'low', 'maintenance'),
('bulk-ticket-s09', 'bulk-cust-s09', 'Bulk South Customer 9 - looneyTunesTest', 42.483200, -92.483200, '2009 South Bulk Avenue', 'medium', 'inspection'),
('bulk-ticket-s10', 'bulk-cust-s10', 'Bulk South Customer 10 - looneyTunesTest', 42.484200, -92.484200, '2010 South Bulk Avenue', 'high', 'repair'),
-- East cluster tickets
('bulk-ticket-e01', 'bulk-cust-e01', 'Bulk East Customer 1 - looneyTunesTest', 42.515100, -92.470100, '3001 East Bulk Boulevard', 'medium', 'repair'),
('bulk-ticket-e02', 'bulk-cust-e02', 'Bulk East Customer 2 - looneyTunesTest', 42.516100, -92.471100, '3002 East Bulk Boulevard', 'high', 'installation'),
('bulk-ticket-e03', 'bulk-cust-e03', 'Bulk East Customer 3 - looneyTunesTest', 42.517100, -92.472100, '3003 East Bulk Boulevard', 'low', 'maintenance'),
('bulk-ticket-e04', 'bulk-cust-e04', 'Bulk East Customer 4 - looneyTunesTest', 42.518100, -92.473100, '3004 East Bulk Boulevard', 'medium', 'inspection'),
('bulk-ticket-e05', 'bulk-cust-e05', 'Bulk East Customer 5 - looneyTunesTest', 42.519100, -92.474100, '3005 East Bulk Boulevard', 'urgent', 'repair'),
('bulk-ticket-e06', 'bulk-cust-e06', 'Bulk East Customer 6 - looneyTunesTest', 42.515200, -92.470200, '3006 East Bulk Boulevard', 'medium', 'repair'),
('bulk-ticket-e07', 'bulk-cust-e07', 'Bulk East Customer 7 - looneyTunesTest', 42.516200, -92.471200, '3007 East Bulk Boulevard', 'high', 'installation'),
('bulk-ticket-e08', 'bulk-cust-e08', 'Bulk East Customer 8 - looneyTunesTest', 42.517200, -92.472200, '3008 East Bulk Boulevard', 'low', 'maintenance'),
('bulk-ticket-e09', 'bulk-cust-e09', 'Bulk East Customer 9 - looneyTunesTest', 42.518200, -92.473200, '3009 East Bulk Boulevard', 'medium', 'inspection'),
('bulk-ticket-e10', 'bulk-cust-e10', 'Bulk East Customer 10 - looneyTunesTest', 42.519200, -92.474200, '3010 East Bulk Boulevard', 'high', 'repair');

-- Expected behavior:
-- Bulk assignment should distribute tickets geographically
-- North cluster tickets should be assigned to routes serving northern areas
-- South cluster tickets should be assigned to routes serving southern areas
-- East cluster tickets should be assigned to routes serving eastern areas
-- Assignment should respect route capacity constraints
-- System should optimize for minimal total travel distance