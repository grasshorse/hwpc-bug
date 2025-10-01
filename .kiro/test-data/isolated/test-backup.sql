-- Mock database backup for isolated testing
-- This is a simple test backup file

CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT
);

CREATE TABLE IF NOT EXISTS routes (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT
);

CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY,
    customer_id INTEGER,
    route_id INTEGER,
    status TEXT
);

-- Insert test data
INSERT INTO customers (id, name, email, phone) VALUES 
(1, 'Test Customer 1', 'test1@example.com', '555-0001'),
(2, 'Test Customer 2', 'test2@example.com', '555-0002');

INSERT INTO routes (id, name, location) VALUES 
(1, 'Test Route 1', 'Test Location 1'),
(2, 'Test Route 2', 'Test Location 2');

INSERT INTO tickets (id, customer_id, route_id, status) VALUES 
(1, 1, 1, 'active'),
(2, 2, 2, 'pending');