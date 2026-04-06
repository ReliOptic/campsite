-- Unveil telemetry schema
-- Stores puzzle session events and BDM-3 assessment results

-- Sessions: one per app open
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  streak_days INTEGER NOT NULL DEFAULT 0,
  device_info JSONB
);

-- Puzzle telemetry events buffered from IndexedDB
CREATE TABLE IF NOT EXISTS telemetry_events (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  puzzle_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  client_ts BIGINT NOT NULL,  -- millisecond timestamp from client
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_telemetry_session ON telemetry_events(session_id);
CREATE INDEX idx_telemetry_puzzle ON telemetry_events(puzzle_id);

-- BDM-3 assessment results (computed by /assess Edge Function)
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),

  -- Raw dimension scores (0.0 to 1.0)
  d1_persistence REAL NOT NULL,
  d2_curiosity REAL NOT NULL,
  d3_tolerance REAL NOT NULL,

  -- Confidence interval
  d1_ci_lower REAL,
  d1_ci_upper REAL,
  d2_ci_lower REAL,
  d2_ci_upper REAL,
  d3_ci_lower REAL,
  d3_ci_upper REAL,

  -- Source event count (for sufficiency check)
  event_count INTEGER NOT NULL,

  -- Criterion scale scores (BFI-10 or equivalent, nullable until validation phase)
  criterion_scores JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessments_user ON assessments(user_id);

-- Progression: streaks, XP, milestones
CREATE TABLE IF NOT EXISTS progression (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  total_xp INTEGER NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_session_at TIMESTAMPTZ,
  milestones_earned INTEGER[] DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Coaching responses (cached for cost control)
CREATE TABLE IF NOT EXISTS coaching_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  user_id UUID REFERENCES auth.users(id),
  tier TEXT NOT NULL CHECK (tier IN ('full', 'light', 'template')),
  prompt_hash TEXT,  -- for cache_control dedup
  response_text TEXT NOT NULL,
  model TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_coaching_user ON coaching_responses(user_id);
CREATE INDEX idx_coaching_hash ON coaching_responses(prompt_hash);

-- RLS Policies
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_responses ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users see own sessions" ON sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own telemetry" ON telemetry_events
  FOR ALL USING (session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users see own assessments" ON assessments
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own progression" ON progression
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own coaching" ON coaching_responses
  FOR ALL USING (auth.uid() = user_id);
