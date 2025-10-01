USE laundromat;

ALTER TABLE laundry_requests 
ADD COLUMN collection_name VARCHAR(100),
ADD COLUMN collection_contact VARCHAR(20),
ADD COLUMN collection_id_number VARCHAR(20),
ADD COLUMN collection_signature TEXT,
ADD COLUMN collection_date TIMESTAMP NULL;
