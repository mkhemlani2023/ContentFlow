-- Add role column to user_profiles for admin/superuser access
-- Admins get unlimited credits for testing

-- Add role column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
END $$;

-- Update your user to admin (replace with your actual email)
-- UPDATE user_profiles SET role = 'admin' WHERE email = 'your-email@example.com';

-- For admins, we'll check this in the frontend and give them unlimited credits
