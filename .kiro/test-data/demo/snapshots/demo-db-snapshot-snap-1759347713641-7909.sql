-- Database Snapshot SQL Dump
-- Generated on: 2025-10-01T19:41:53.643Z

-- Table: customers
DROP TABLE IF EXISTS customers;
CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255),
  is_test_data BOOLEAN DEFAULT FALSE
);

INSERT INTO customers (id, name, email, is_test_data) VALUES (1, 'Test Customer 1', 'test1@example.com', true);
INSERT INTO customers (id, name, email, is_test_data) VALUES (2, 'Test Customer 2', 'test2@example.com', true);

-- Table: routes
DROP TABLE IF EXISTS routes;
CREATE TABLE routes (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255),
  is_test_data BOOLEAN DEFAULT FALSE
);

INSERT INTO routes (id, name, location, is_test_data) VALUES (1, 'Test Route 1', 'Cedar Falls', true);
INSERT INTO routes (id, name, location, is_test_data) VALUES (2, 'Test Route 2', 'Winfield', true);

-- Table: tickets
DROP TABLE IF EXISTS tickets;
CREATE TABLE tickets (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255),
  is_test_data BOOLEAN DEFAULT FALSE
);

INSERT INTO tickets (id, customer_id, route_id, status, is_test_data) VALUES (1, 1, 1, 'active', true);

