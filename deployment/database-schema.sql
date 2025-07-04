-- Temple Management System Database Schema
-- Generated for IIS Production Deployment

-- Create database (run this separately if needed)
-- CREATE DATABASE temple_management;

-- Members table
CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    gender VARCHAR(10),
    birth_city VARCHAR(100),
    birth_state VARCHAR(100),
    birth_country VARCHAR(100),
    current_city VARCHAR(100),
    current_state VARCHAR(100),
    current_country VARCHAR(100),
    father_name VARCHAR(255),
    mother_name VARCHAR(255),
    spouse_name VARCHAR(255),
    marital_status VARCHAR(20),
    temple_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Relationships table
CREATE TABLE IF NOT EXISTS relationships (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL,
    related_member_id INTEGER NOT NULL,
    relationship_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (related_member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Temples table (matches actual schema)
CREATE TABLE IF NOT EXISTS temples (
    id SERIAL PRIMARY KEY,
    temple_name TEXT NOT NULL,
    deity TEXT,
    village TEXT NOT NULL,
    nearest_city TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT NOT NULL,
    linked_temples TEXT[],
    established_year INTEGER,
    contact_phone TEXT,
    contact_email TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    temple_image TEXT,
    google_map_link TEXT,
    website_link TEXT,
    wiki_link TEXT
);

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint for temple_id in members table
ALTER TABLE members ADD CONSTRAINT fk_members_temple 
FOREIGN KEY (temple_id) REFERENCES temples(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_members_full_name ON members(full_name);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);
CREATE INDEX IF NOT EXISTS idx_members_temple_id ON members(temple_id);
CREATE INDEX IF NOT EXISTS idx_relationships_member_id ON relationships(member_id);
CREATE INDEX IF NOT EXISTS idx_relationships_related_member_id ON relationships(related_member_id);
CREATE INDEX IF NOT EXISTS idx_temples_name ON temples(temple_name);