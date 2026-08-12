-- Add batch_number column to products table if missing
ALTER TABLE products ADD COLUMN IF NOT EXISTS batch_number text;
