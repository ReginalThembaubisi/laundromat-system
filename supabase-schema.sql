-- Laundromat System Database Schema for Supabase (PostgreSQL)

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  surname VARCHAR(100) NOT NULL,
  contact VARCHAR(20) NOT NULL,
  commune VARCHAR(100),
  room VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create saved_photos table
CREATE TABLE IF NOT EXISTS saved_photos (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  photo_path TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES user_profiles(student_id) ON DELETE CASCADE
);

-- Create laundry_requests table
CREATE TABLE IF NOT EXISTS laundry_requests (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(50),
  name VARCHAR(100) NOT NULL,
  surname VARCHAR(100) NOT NULL,
  contact VARCHAR(20) NOT NULL,
  commune VARCHAR(100),
  room VARCHAR(50),
  clothes_count INT NOT NULL,
  photos TEXT,
  reference_number VARCHAR(20) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'Pending',
  collection_name VARCHAR(200),
  collection_contact VARCHAR(20),
  collection_id_number VARCHAR(50),
  collection_signature VARCHAR(200),
  collection_date TIMESTAMP,
  date_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_completed TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES user_profiles(student_id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_student_id ON user_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_saved_photos_student_id ON saved_photos(student_id);
CREATE INDEX IF NOT EXISTS idx_laundry_requests_student_id ON laundry_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_laundry_requests_reference ON laundry_requests(reference_number);
CREATE INDEX IF NOT EXISTS idx_laundry_requests_status ON laundry_requests(status);
CREATE INDEX IF NOT EXISTS idx_laundry_requests_date ON laundry_requests(date_submitted);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_profiles
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

