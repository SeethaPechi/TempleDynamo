-- Sample Data for Temple Management System
-- Insert after running database-schema.sql

-- Sample Temple Data
INSERT INTO temples (temple_name, deity, village, nearest_city, state, country, linked_temples, established_year, contact_phone, contact_email, description, temple_image, google_map_link, website_link, wiki_link) VALUES
('Sri Sangili Annan Kovil', 'Sangili Annan', 'Seelayampatti', 'Theni', 'TN', 'IN', '{}', 1812, '', '', 'Shree Sangili Annan is located in Seelayampatti, Megamalai, Theni District, Tamilnadu India', '', '', '', ''),
('Sri Lakshmi Temple', 'Lakshmi', 'Kovilpatti', 'Kovilpatti', 'TN', 'IN', '{}', 1800, '+91-9876543210', 'info@srilakshmi.org', 'Ancient temple dedicated to Goddess Lakshmi', '', '', 'https://srilakshmi.org', ''),
('Meenakshi Amman Temple', 'Meenakshi', 'Madurai', 'Madurai', 'TN', 'IN', '{}', 1623, '+91-452-2345678', '', 'Historic temple complex dedicated to Goddess Meenakshi', '', '', '', '');

-- Sample User Data (for authentication if needed)
INSERT INTO users (username, password) VALUES
('admin', '$2b$10$example.hashed.password.here'),
('temple_admin', '$2b$10$example.hashed.password.here');

-- Note: Member and relationship data will be imported during application usage
-- The application provides comprehensive member registration and relationship management