-- Fixars SkillsCanvas Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  points INTEGER DEFAULT 0,
  level TEXT DEFAULT 'Newcomer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Talents table (users who list their skills)
CREATE TABLE IF NOT EXISTS talents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  hourly_rate DECIMAL(10,2),
  availability TEXT CHECK (availability IN ('full-time', 'part-time', 'unavailable')) DEFAULT 'unavailable',
  portfolio JSONB DEFAULT '[]'::jsonb,
  completed_projects INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skills table
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  talent_id UUID REFERENCES talents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')) NOT NULL,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  talent_id UUID REFERENCES talents(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  content TEXT,
  project_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skill requests (for hiring)
CREATE TABLE IF NOT EXISTS skill_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  talent_id UUID REFERENCES talents(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_talents_user_id ON talents(user_id);
CREATE INDEX IF NOT EXISTS idx_talents_availability ON talents(availability);
CREATE INDEX IF NOT EXISTS idx_talents_is_active ON talents(is_active);
CREATE INDEX IF NOT EXISTS idx_skills_talent_id ON skills(talent_id);
CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);
CREATE INDEX IF NOT EXISTS idx_reviews_talent_id ON reviews(talent_id);
CREATE INDEX IF NOT EXISTS idx_skill_requests_talent_id ON skill_requests(talent_id);
CREATE INDEX IF NOT EXISTS idx_skill_requests_requester_id ON skill_requests(requester_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE talents ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for talents
CREATE POLICY "Active talents are viewable by everyone" ON talents
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage own talent profile" ON talents
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for skills
CREATE POLICY "Skills are viewable by everyone" ON skills
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own skills" ON skills
  FOR ALL USING (
    talent_id IN (SELECT id FROM talents WHERE user_id = auth.uid())
  );

-- RLS Policies for reviews
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = reviewer_id);

-- RLS Policies for skill_requests
CREATE POLICY "Users can view their own requests" ON skill_requests
  FOR SELECT USING (
    auth.uid() = requester_id OR 
    talent_id IN (SELECT id FROM talents WHERE user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create requests" ON skill_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Involved parties can update requests" ON skill_requests
  FOR UPDATE USING (
    auth.uid() = requester_id OR 
    talent_id IN (SELECT id FROM talents WHERE user_id = auth.uid())
  );

-- Function to update talent rating when a new review is added
CREATE OR REPLACE FUNCTION update_talent_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE talents
  SET 
    rating = (SELECT AVG(rating)::DECIMAL(3,2) FROM reviews WHERE talent_id = NEW.talent_id),
    review_count = (SELECT COUNT(*) FROM reviews WHERE talent_id = NEW.talent_id),
    updated_at = NOW()
  WHERE id = NEW.talent_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update rating on new review
DROP TRIGGER IF EXISTS on_review_insert ON reviews;
CREATE TRIGGER on_review_insert
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_talent_rating();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users to create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_talents_updated_at
  BEFORE UPDATE ON talents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_skill_requests_updated_at
  BEFORE UPDATE ON skill_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
