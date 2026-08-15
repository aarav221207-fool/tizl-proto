-- ============================================================================
-- TIZL BACKEND: DATABASE SCHEMA ENHANCEMENT MIGRATION (Phase 2, Step 1)
-- ============================================================================
-- Note: This is a safe, additive migration script for Supabase PostgreSQL.
-- It adds foreign keys, missing indexes, CHECK constraints, RLS policies,
-- trigger functions, and immutability rules without dropping existing tables.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. FOREIGN KEY CONSTRAINTS
-- ----------------------------------------------------------------------------

-- Addresses
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_addresses_customer') THEN
    ALTER TABLE addresses ADD CONSTRAINT fk_addresses_customer FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_addresses_city') THEN
    ALTER TABLE addresses ADD CONSTRAINT fk_addresses_city FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Admin Users
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_admin_users_profile') THEN
    ALTER TABLE admin_users ADD CONSTRAINT fk_admin_users_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Bookings
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_bookings_customer') THEN
    ALTER TABLE bookings ADD CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_bookings_cook') THEN
    ALTER TABLE bookings ADD CONSTRAINT fk_bookings_cook FOREIGN KEY (cook_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_bookings_service') THEN
    ALTER TABLE bookings ADD CONSTRAINT fk_bookings_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_bookings_address') THEN
    ALTER TABLE bookings ADD CONSTRAINT fk_bookings_address FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- Booking Dispatch
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_booking_dispatch_booking') THEN
    ALTER TABLE booking_dispatch ADD CONSTRAINT fk_booking_dispatch_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_booking_dispatch_cook') THEN
    ALTER TABLE booking_dispatch ADD CONSTRAINT fk_booking_dispatch_cook FOREIGN KEY (cook_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Booking History
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_booking_history_booking') THEN
    ALTER TABLE booking_history ADD CONSTRAINT fk_booking_history_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_booking_history_changed_by') THEN
    ALTER TABLE booking_history ADD CONSTRAINT fk_booking_history_changed_by FOREIGN KEY (changed_by) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Booking Cancellations
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_booking_cancellations_booking') THEN
    ALTER TABLE booking_cancellations ADD CONSTRAINT fk_booking_cancellations_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_booking_cancellations_cancelled_by') THEN
    ALTER TABLE booking_cancellations ADD CONSTRAINT fk_booking_cancellations_cancelled_by FOREIGN KEY (cancelled_by) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Booking Notes
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_booking_notes_booking') THEN
    ALTER TABLE booking_notes ADD CONSTRAINT fk_booking_notes_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_booking_notes_author') THEN
    ALTER TABLE booking_notes ADD CONSTRAINT fk_booking_notes_author FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Booking Photos
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_booking_photos_booking') THEN
    ALTER TABLE booking_photos ADD CONSTRAINT fk_booking_photos_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_booking_photos_uploaded_by') THEN
    ALTER TABLE booking_photos ADD CONSTRAINT fk_booking_photos_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Booking Timeline
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_booking_timeline_booking') THEN
    ALTER TABLE booking_timeline ADD CONSTRAINT fk_booking_timeline_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Audit Logs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_audit_logs_profile') THEN
    ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_logs_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. INDEXES FOR PERFORMANCE
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_addresses_customer_id ON addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_addresses_city_id ON addresses(city_id);

CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_cook_id ON bookings(cook_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date_time ON bookings(booking_date, start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_booking_dispatch_booking_id ON booking_dispatch(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_dispatch_cook_id ON booking_dispatch(cook_id);
CREATE INDEX IF NOT EXISTS idx_booking_dispatch_status ON booking_dispatch(status);

CREATE INDEX IF NOT EXISTS idx_booking_history_booking_id ON booking_history(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_timeline_booking_id ON booking_timeline(booking_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_profile_id ON audit_logs(profile_id);

-- ----------------------------------------------------------------------------
-- 3. CHECK & UNIQUE CONSTRAINTS
-- ----------------------------------------------------------------------------

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_bookings_amounts_positive') THEN
    ALTER TABLE bookings ADD CONSTRAINT chk_bookings_amounts_positive CHECK (hourly_rate >= 0 AND total_amount >= 0 AND duration_hours > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_bookings_guest_count') THEN
    ALTER TABLE bookings ADD CONSTRAINT chk_bookings_guest_count CHECK (guest_count > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'uq_bookings_number') THEN
    ALTER TABLE bookings ADD CONSTRAINT uq_bookings_number UNIQUE (booking_number);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_dispatch ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if requesting user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users WHERE profile_id = user_id
  ) OR EXISTS (
    SELECT 1 FROM profiles WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id OR is_admin(auth.uid()));

-- Addresses Policies
DROP POLICY IF EXISTS "Customers can view own addresses" ON addresses;
CREATE POLICY "Customers can view own addresses" ON addresses
  FOR SELECT USING (customer_id = auth.uid() OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Customers can insert own addresses" ON addresses;
CREATE POLICY "Customers can insert own addresses" ON addresses
  FOR INSERT WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Customers can update own addresses" ON addresses;
CREATE POLICY "Customers can update own addresses" ON addresses
  FOR UPDATE USING (customer_id = auth.uid() OR is_admin(auth.uid()));

-- Bookings Policies
DROP POLICY IF EXISTS "Users can view relevant bookings" ON bookings;
CREATE POLICY "Users can view relevant bookings" ON bookings
  FOR SELECT USING (
    customer_id = auth.uid() 
    OR cook_id = auth.uid() 
    OR is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Customers can create bookings" ON bookings;
CREATE POLICY "Customers can create bookings" ON bookings
  FOR INSERT WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update bookings" ON bookings;
CREATE POLICY "Admins can update bookings" ON bookings
  FOR UPDATE USING (is_admin(auth.uid()));

-- Admin Users Policies
DROP POLICY IF EXISTS "Admins can view admin_users" ON admin_users;
CREATE POLICY "Admins can view admin_users" ON admin_users
  FOR SELECT USING (profile_id = auth.uid() OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage admin_users" ON admin_users;
CREATE POLICY "Admins can manage admin_users" ON admin_users
  FOR ALL USING (is_admin(auth.uid()));

-- Audit Logs Policies
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert audit logs" ON audit_logs;
CREATE POLICY "Admins can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (is_admin(auth.uid()) OR auth.uid() IS NOT NULL);

-- Booking Subtables Policies
DROP POLICY IF EXISTS "Users can view booking history" ON booking_history;
CREATE POLICY "Users can view booking history" ON booking_history
  FOR SELECT USING (is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM bookings WHERE bookings.id = booking_history.booking_id AND (bookings.customer_id = auth.uid() OR bookings.cook_id = auth.uid())
  ));

DROP POLICY IF EXISTS "Admins can insert booking history" ON booking_history;
CREATE POLICY "Admins can insert booking history" ON booking_history
  FOR INSERT WITH CHECK (is_admin(auth.uid()) OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view booking timeline" ON booking_timeline;
CREATE POLICY "Users can view booking timeline" ON booking_timeline
  FOR SELECT USING (is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM bookings WHERE bookings.id = booking_timeline.booking_id AND (bookings.customer_id = auth.uid() OR bookings.cook_id = auth.uid())
  ));

DROP POLICY IF EXISTS "Admins can insert booking timeline" ON booking_timeline;
CREATE POLICY "Admins can insert booking timeline" ON booking_timeline
  FOR INSERT WITH CHECK (is_admin(auth.uid()) OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view booking notes" ON booking_notes;
CREATE POLICY "Users can view booking notes" ON booking_notes
  FOR SELECT USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert booking notes" ON booking_notes;
CREATE POLICY "Admins can insert booking notes" ON booking_notes
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view booking cancellations" ON booking_cancellations;
CREATE POLICY "Users can view booking cancellations" ON booking_cancellations
  FOR SELECT USING (is_admin(auth.uid()) OR EXISTS (
    SELECT 1 FROM bookings WHERE bookings.id = booking_cancellations.booking_id AND (bookings.customer_id = auth.uid() OR bookings.cook_id = auth.uid())
  ));

DROP POLICY IF EXISTS "Admins can insert booking cancellations" ON booking_cancellations;
CREATE POLICY "Admins can insert booking cancellations" ON booking_cancellations
  FOR INSERT WITH CHECK (is_admin(auth.uid()) OR auth.uid() IS NOT NULL);

-- Cooks Policies
ALTER TABLE cooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view cooks" ON cooks;
CREATE POLICY "Anyone can view cooks" ON cooks
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Cooks or admins can manage cooks" ON cooks;
CREATE POLICY "Cooks or admins can manage cooks" ON cooks
  FOR ALL USING (profile_id = auth.uid() OR is_admin(auth.uid()));

-- Customer Details Policies
ALTER TABLE customer_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers or admins can view customer details" ON customer_details;
CREATE POLICY "Customers or admins can view customer details" ON customer_details
  FOR SELECT USING (customer_id = auth.uid() OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Customers or admins can manage customer details" ON customer_details;
CREATE POLICY "Customers or admins can manage customer details" ON customer_details
  FOR ALL USING (customer_id = auth.uid() OR is_admin(auth.uid()));

-- Cities & Services Policies
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view cities" ON cities;
CREATE POLICY "Anyone can view cities" ON cities
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage cities" ON cities;
CREATE POLICY "Admins can manage cities" ON cities
  FOR ALL USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can view services" ON services;
CREATE POLICY "Anyone can view services" ON services
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage services" ON services;
CREATE POLICY "Admins can manage services" ON services
  FOR ALL USING (is_admin(auth.uid()));

-- ----------------------------------------------------------------------------
-- 5. IMMUTABLE AUDIT LOG TRIGGER
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION prevent_audit_log_tampering()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_log_tampering ON audit_logs;
CREATE TRIGGER trg_prevent_audit_log_tampering
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_tampering();

-- ----------------------------------------------------------------------------
-- 6. AUTOMATIC UPDATED_AT TRIGGER
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON bookings;
CREATE TRIGGER trg_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_addresses_updated_at ON addresses;
CREATE TRIGGER trg_addresses_updated_at
BEFORE UPDATE ON addresses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 7. CONCURRENCY & OTP HELPER FUNCTIONS
-- ----------------------------------------------------------------------------

-- Hash OTP before storing
CREATE OR REPLACE FUNCTION hash_otp(otp_text text)
RETURNS text AS $$
BEGIN
  RETURN crypt(otp_text, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify hashed OTP
CREATE OR REPLACE FUNCTION verify_otp(otp_text text, hashed_otp text)
RETURNS boolean AS $$
BEGIN
  RETURN (hashed_otp = crypt(otp_text, hashed_otp));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
