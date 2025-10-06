-- Baseline Location Data Setup
-- Creates the basic table structure and initial test data for location assignment testing

-- Create test locations table if not exists
CREATE TABLE IF NOT EXISTS test_locations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    is_test_location BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create test routes table if not exists
CREATE TABLE IF NOT EXISTS test_routes (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 10,
    current_load INTEGER DEFAULT 0,
    start_time TIME,
    end_time TIME,
    days_of_week TEXT, -- JSON array of days
    technician_id VARCHAR(50),
    technician_name VARCHAR(255),
    is_test_route BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create test tickets table if not exists
CREATE TABLE IF NOT EXISTS test_tickets (
    id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    priority VARCHAR(20) DEFAULT 'medium',
    service_type VARCHAR(50) DEFAULT 'repair',
    assigned_route_id VARCHAR(50),
    is_test_data BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_route_id) REFERENCES test_routes(id)
);

-- Create test assignments table if not exists
CREATE TABLE IF NOT EXISTS test_assignments (
    id VARCHAR(50) PRIMARY KEY,
    ticket_id VARCHAR(50) NOT NULL,
    route_id VARCHAR(50) NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by VARCHAR(100),
    override_reason TEXT,
    estimated_distance DECIMAL(8, 2),
    sequence_order INTEGER,
    FOREIGN KEY (ticket_id) REFERENCES test_tickets(id),
    FOREIGN KEY (route_id) REFERENCES test_routes(id)
);

-- Insert baseline test locations (controlled coordinates for isolated testing)
INSERT OR IGNORE INTO test_locations (id, name, latitude, longitude, address) VALUES
('test-loc-001', 'Test Location Alpha', 42.500000, -92.500000, '123 Test Street Alpha'),
('test-loc-002', 'Test Location Beta', 42.510000, -92.510000, '456 Test Avenue Beta'),
('test-loc-003', 'Test Location Gamma', 42.520000, -92.520000, '789 Test Boulevard Gamma'),
('test-loc-004', 'Test Location Delta', 42.530000, -92.530000, '321 Test Circle Delta'),
('test-loc-005', 'Test Location Epsilon', 42.540000, -92.540000, '654 Test Lane Epsilon');

-- Insert baseline test routes
INSERT OR IGNORE INTO test_routes (id, name, capacity, current_load, start_time, end_time, days_of_week, technician_id, technician_name) VALUES
('test-route-001', 'Test Route North', 15, 0, '08:00:00', '17:00:00', '["monday","tuesday","wednesday","thursday","friday"]', 'tech-001', 'Test Technician Alpha'),
('test-route-002', 'Test Route South', 12, 0, '09:00:00', '18:00:00', '["monday","tuesday","wednesday","thursday","friday"]', 'tech-002', 'Test Technician Beta'),
('test-route-003', 'Test Route East', 10, 0, '07:30:00', '16:30:00', '["monday","wednesday","friday"]', 'tech-003', 'Test Technician Gamma'),
('test-route-004', 'Test Route West', 8, 0, '10:00:00', '19:00:00', '["tuesday","thursday"]', 'tech-004', 'Test Technician Delta');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_test_tickets_location ON test_tickets(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_test_tickets_customer ON test_tickets(customer_name);
CREATE INDEX IF NOT EXISTS idx_test_assignments_ticket ON test_assignments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_test_assignments_route ON test_assignments(route_id);
CREATE INDEX IF NOT EXISTS idx_test_routes_capacity ON test_routes(capacity, current_load);