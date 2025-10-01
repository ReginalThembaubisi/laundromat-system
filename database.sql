-- Laundromat Database Schema
-- Run this script to create the database and table

CREATE DATABASE IF NOT EXISTS laundromat_db;
USE laundromat_db;

CREATE TABLE IF NOT EXISTS laundry_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    surname VARCHAR(50) NOT NULL,
    contact VARCHAR(20) NOT NULL,
    commune VARCHAR(50) NOT NULL,
    room VARCHAR(20) NOT NULL,
    clothes_count INT DEFAULT 0,
    photos TEXT,
    status ENUM('Pending', 'In Progress', 'Completed', 'Collected') DEFAULT 'Pending',
    reference_number VARCHAR(20) UNIQUE,
    date_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_completed TIMESTAMP NULL,
    collection_name VARCHAR(100),
    collection_contact VARCHAR(20),
    collection_id_number VARCHAR(20),
    collection_signature TEXT,
    collection_date TIMESTAMP NULL,
    whatsapp_sent BOOLEAN DEFAULT FALSE,
    collection_reminder_sent BOOLEAN DEFAULT FALSE
);

-- Insert some sample data for testing
INSERT INTO laundry_requests (name, surname, contact, commune, room, clothes_count, status, reference_number) VALUES
('Themba', 'Mthembu', '012 345 6789', '5A Room 12', '12', 5, 'Pending', 'LAU123456'),
('John', 'Doe', '011 234 5678', '5B Room 8', '8', 7, 'In Progress', 'LAU123457'),
('Jane', 'Smith', '010 123 4567', '5C Room 15', '15', 6, 'Completed', 'LAU123458');
