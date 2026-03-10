-- ============================================
-- CONDOMINIUM / MULTI-LEVEL PROPERTY TABLES
-- Run this in Supabase SQL Editor
-- ============================================

-- Table: condo_buildings
-- Stores building-level data including footprint geometry and floor configuration
CREATE TABLE IF NOT EXISTS condo_buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_name TEXT NOT NULL,
    building_prefix TEXT NOT NULL,           -- e.g., 'ACH' for Acacia Heights (used in unit IDs)
    plot_id TEXT,                             -- Plot number / parcel ID from cadastral layer
    block_number TEXT,                        -- Block reference
    district TEXT,
    county TEXT,
    subcounty TEXT,
    parish TEXT,
    village TEXT,
    footprint_coords JSONB NOT NULL,         -- Array of [E,N] coordinate pairs (original CRS)
    footprint_geojson JSONB NOT NULL,         -- GeoJSON polygon in EPSG:4326 for map display
    coordinate_system TEXT NOT NULL DEFAULT 'EPSG:32636',
    floors_above INTEGER NOT NULL DEFAULT 1,  -- Storeys above ground (ground floor = 1)
    floors_below INTEGER NOT NULL DEFAULT 0,  -- Basement / underground levels
    floor_to_floor_height DECIMAL NOT NULL DEFAULT 3.0, -- Height between floors in meters
    total_height DECIMAL GENERATED ALWAYS AS ((floors_above + floors_below) * floor_to_floor_height) STORED,
    image_urls JSONB DEFAULT '[]'::jsonb,     -- Array of R2 image URLs for facades
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: condo_units
-- Stores individual unit data with coordinates, dimensions, and attributes
CREATE TABLE IF NOT EXISTS condo_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES condo_buildings(id) ON DELETE CASCADE,
    unit_id TEXT UNIQUE NOT NULL,              -- e.g., 'ACH-F02-U03'
    floor_number INTEGER NOT NULL,             -- Positive = above, negative = basement, 1 = ground
    unit_number INTEGER NOT NULL,              -- Sequential within floor
    unit_coords JSONB NOT NULL,                -- Array of [E,N] pairs (original CRS)
    unit_geojson JSONB,                        -- GeoJSON polygon in EPSG:4326
    area_sqm DECIMAL,                          -- Computed from coordinates
    perimeter_m DECIMAL,                       -- Computed from coordinates
    unit_type TEXT DEFAULT 'RESIDENTIAL',       -- RESIDENTIAL, COMMERCIAL, PARKING, STORAGE, UTILITY
    bedrooms INTEGER DEFAULT 0,
    bathrooms INTEGER DEFAULT 0,
    sitting_rooms INTEGER DEFAULT 0,
    toilets INTEGER DEFAULT 0,
    kitchen BOOLEAN DEFAULT FALSE,
    balcony BOOLEAN DEFAULT FALSE,
    store_room BOOLEAN DEFAULT FALSE,
    servants_quarters BOOLEAN DEFAULT FALSE,
    garage BOOLEAN DEFAULT FALSE,
    laundry_room BOOLEAN DEFAULT FALSE,
    dining_room BOOLEAN DEFAULT FALSE,
    study_room BOOLEAN DEFAULT FALSE,
    en_suite INTEGER DEFAULT 0,                -- Number of en-suite bathrooms
    point_descriptions JSONB DEFAULT '{}'::jsonb, -- From CSV: {P1: "corner", P2: "pillar", ...}
    status TEXT DEFAULT 'VACANT',               -- VACANT, OCCUPIED, REGISTERED, SOLD
    owner_name TEXT,
    owner_contact TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_condo_buildings_name ON condo_buildings(building_name);
CREATE INDEX IF NOT EXISTS idx_condo_buildings_plot ON condo_buildings(plot_id);
CREATE INDEX IF NOT EXISTS idx_condo_units_building ON condo_units(building_id);
CREATE INDEX IF NOT EXISTS idx_condo_units_floor ON condo_units(floor_number);
CREATE INDEX IF NOT EXISTS idx_condo_units_unit_id ON condo_units(unit_id);

-- Enable Row Level Security
ALTER TABLE condo_buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE condo_units ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Anyone authenticated can read, only creator can modify
CREATE POLICY "Anyone can view buildings" ON condo_buildings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert buildings" ON condo_buildings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Creators can update their buildings" ON condo_buildings FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Anyone can view units" ON condo_units FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert units" ON condo_units FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update units" ON condo_units FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_condo_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_condo_buildings_timestamp
    BEFORE UPDATE ON condo_buildings
    FOR EACH ROW EXECUTE FUNCTION update_condo_timestamp();

CREATE TRIGGER update_condo_units_timestamp
    BEFORE UPDATE ON condo_units
    FOR EACH ROW EXECUTE FUNCTION update_condo_timestamp();
