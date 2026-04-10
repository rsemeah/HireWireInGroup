-- Migration: Create safety_audit_logs table
-- The checkSafety() function in lib/safety/index.ts writes to this table
-- but it didn't exist - this creates it with proper RLS

-- Create safety_audit_logs table
CREATE TABLE IF NOT EXISTS safety_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  input_hash TEXT, -- Hash of input for deduplication without storing PII
  flags_triggered JSONB DEFAULT '[]'::jsonb,
  blocked BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_safety_audit_user ON safety_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_audit_risk ON safety_audit_logs(risk_level);
CREATE INDEX IF NOT EXISTS idx_safety_audit_created ON safety_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_safety_audit_blocked ON safety_audit_logs(blocked) WHERE blocked = true;

-- Enable RLS
ALTER TABLE safety_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own audit logs
CREATE POLICY "safety_audit_select_own"
ON safety_audit_logs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Users can insert their own audit logs
CREATE POLICY "safety_audit_insert_own"
ON safety_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy: No updates or deletes - audit logs are immutable
CREATE POLICY "safety_audit_no_update"
ON safety_audit_logs
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "safety_audit_no_delete"
ON safety_audit_logs
FOR DELETE
TO authenticated
USING (false);

-- Service role full access for admin/monitoring
CREATE POLICY "safety_audit_service_role_all"
ON safety_audit_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
