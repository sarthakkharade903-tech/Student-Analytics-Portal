-- Run these in your Supabase SQL Editor:
ALTER TABLE coaching_centers ADD COLUMN IF NOT EXISTS gps_lat double precision;
ALTER TABLE coaching_centers ADD COLUMN IF NOT EXISTS gps_lon double precision;
ALTER TABLE coaching_centers ADD COLUMN IF NOT EXISTS gps_radius_m integer NOT NULL DEFAULT 150;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS is_late boolean NOT NULL DEFAULT false;
