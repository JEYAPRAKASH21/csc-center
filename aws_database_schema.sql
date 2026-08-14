-- ============================================================
-- CSC DIGITAL EXPRESS - AWS RDS POSTGRESQL DATABASE SCHEMA
-- Compatible with AWS RDS (PostgreSQL 13+) and AWS Aurora PostgreSQL
-- ============================================================

-- Create Users Table (Multi-Tenant Authentication)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    vle_name VARCHAR(255) NOT NULL,
    center_name VARCHAR(255) NOT NULL,
    csc_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create Services Catalog Table
CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    unit VARCHAR(64) NOT NULL DEFAULT 'per page',
    stock INTEGER DEFAULT NULL,
    popular BOOLEAN DEFAULT FALSE,
    code VARCHAR(64) DEFAULT NULL,
    gov_fee NUMERIC(10, 2) DEFAULT 0.00,
    csc_commission NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id);

-- Create Bills Table (POS & Invoice Records)
CREATE TABLE IF NOT EXISTS bills (
    id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bill_number VARCHAR(64) NOT NULL,
    bill_date TIMESTAMP WITH TIME ZONE NOT NULL,
    customer_name VARCHAR(255) NOT NULL DEFAULT 'Walk-in Customer',
    customer_phone VARCHAR(64) NOT NULL DEFAULT 'N/A',
    items JSONB NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount_type VARCHAR(16) DEFAULT 'flat',
    tax NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(32) NOT NULL DEFAULT 'cash',
    payment_status VARCHAR(32) NOT NULL DEFAULT 'paid',
    amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    pending_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON bills(bill_number);

-- Create Applications Table (E-Sevai & Govt Application Tracker)
CREATE TABLE IF NOT EXISTS applications (
    id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ack_number VARCHAR(128) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(64) NOT NULL,
    applied_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'pending',
    status_update_date TIMESTAMP WITH TIME ZONE NOT NULL,
    gov_fee_paid NUMERIC(10, 2) DEFAULT 0.00,
    service_charge NUMERIC(10, 2) DEFAULT 0.00,
    remarks TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_ack_number ON applications(ack_number);

-- Create Khata Table (Customer Credit Ledger)
CREATE TABLE IF NOT EXISTS khata_customers (
    id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(64) NOT NULL,
    total_outstanding NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    history JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_khata_user_id ON khata_customers(user_id);

-- Create Store Settings Table
CREATE TABLE IF NOT EXISTS store_settings (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    center_name VARCHAR(255) NOT NULL,
    vle_name VARCHAR(255) NOT NULL,
    csc_id VARCHAR(64) NOT NULL,
    phone VARCHAR(64) DEFAULT NULL,
    email VARCHAR(255) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    district VARCHAR(128) DEFAULT NULL,
    state VARCHAR(128) DEFAULT NULL,
    upi_id VARCHAR(128) DEFAULT NULL,
    upi_name VARCHAR(128) DEFAULT NULL,
    thermal_printer_width VARCHAR(16) DEFAULT '3inch',
    currency_symbol VARCHAR(8) DEFAULT '₹',
    gst_enabled BOOLEAN DEFAULT FALSE,
    gst_rate NUMERIC(5, 2) DEFAULT 0.00,
    last_updated BIGINT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Default Demo Account
INSERT INTO users (id, email, password_hash, vle_name, center_name, csc_id)
VALUES ('usr_demo_1', 'vle@cscexpress.com', 'password123', 'Dhilipan Kumar (VLE)', 'CSC Digital Express', 'CSC-TN-984210')
ON CONFLICT (id) DO NOTHING;

INSERT INTO store_settings (user_id, center_name, vle_name, csc_id, phone, email, address, district, state, upi_id, upi_name, thermal_printer_width, last_updated)
VALUES ('usr_demo_1', 'CSC Digital Express', 'Dhilipan Kumar (VLE)', 'CSC-TN-984210', '+91 98765 43210', 'csc.digitalexpress@gmail.com', 'No. 45, Main Road, Near Bus Stand', 'Coimbatore', 'Tamil Nadu - 641001', 'csc.express@upi', 'CSC Digital Express', '3inch', EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) * 1000)
ON CONFLICT (user_id) DO NOTHING;
