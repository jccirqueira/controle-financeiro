-- Run this script in Supabase SQL Editor to add the goal column to profiles

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'monthly_goal') THEN
        ALTER TABLE public.profiles ADD COLUMN monthly_goal numeric DEFAULT 2000;
    END IF;
END $$;
