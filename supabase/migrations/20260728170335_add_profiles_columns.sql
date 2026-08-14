/*
# Add missing columns to profiles table

## Purpose
The settings page needs to save first_name, last_name, whatsapp, country,
and city directly on the profiles row so the data persists independently
of the producers table.

## Columns added to `profiles`
- first_name (text) — user's first name
- last_name (text) — user's last name
- whatsapp (text) — WhatsApp business number
- country (text) — user's country
- city (text) — user's city

## Security
- No RLS changes (existing policies already allow owner-scoped CRUD).
- All columns are nullable.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city text;
