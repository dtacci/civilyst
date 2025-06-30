-- Enable Row Level Security for core tables
-- This ensures users can only access data they're authorized to see

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on campaigns table  
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Enable RLS on comments table
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on votes table
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
-- Users can read their own profile and update it
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own profile" ON users  
  FOR UPDATE USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create policies for campaigns table
-- Anyone can read active campaigns
CREATE POLICY "Anyone can view active campaigns" ON campaigns
  FOR SELECT USING (status = 'ACTIVE');

-- Users can read their own campaigns (any status)
CREATE POLICY "Users can view own campaigns" ON campaigns
  FOR SELECT USING (creator_id IN (
    SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Users can create campaigns
CREATE POLICY "Authenticated users can create campaigns" ON campaigns
  FOR INSERT WITH CHECK (creator_id IN (
    SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Users can update their own campaigns
CREATE POLICY "Users can update own campaigns" ON campaigns
  FOR UPDATE USING (creator_id IN (
    SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Users can delete their own campaigns
CREATE POLICY "Users can delete own campaigns" ON campaigns
  FOR DELETE USING (creator_id IN (
    SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Create policies for comments table
-- Anyone can read comments on active campaigns
CREATE POLICY "Anyone can view comments on active campaigns" ON comments
  FOR SELECT USING (campaign_id IN (
    SELECT id FROM campaigns WHERE status = 'ACTIVE'
  ));

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (author_id IN (
    SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (author_id IN (
    SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (author_id IN (
    SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Create policies for votes table
-- Anyone can read vote counts (aggregated)
CREATE POLICY "Anyone can view votes on active campaigns" ON votes
  FOR SELECT USING (campaign_id IN (
    SELECT id FROM campaigns WHERE status = 'ACTIVE'
  ));

-- Authenticated users can create votes
CREATE POLICY "Authenticated users can vote" ON votes
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Users can update their own votes
CREATE POLICY "Users can update own votes" ON votes
  FOR UPDATE USING (user_id IN (
    SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Users can delete their own votes
CREATE POLICY "Users can delete own votes" ON votes
  FOR DELETE USING (user_id IN (
    SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));