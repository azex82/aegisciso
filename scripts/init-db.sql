-- AegisCISO Sovereign AI - Database Initialization
-- This script runs on container startup

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create audit log table (required for compliance)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID,
    session_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    request_path TEXT,
    request_method VARCHAR(10),
    response_status INTEGER,
    details JSONB,
    hash_chain TEXT,  -- For tamper detection
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for efficient audit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Create sessions table for zero-trust session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    token_hash TEXT NOT NULL,
    device_fingerprint TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    mfa_verified BOOLEAN DEFAULT FALSE,
    UNIQUE(token_hash)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);

-- Create AI query history for analysis
CREATE TABLE IF NOT EXISTS ai_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    session_id UUID,
    query_text TEXT NOT NULL,
    query_type VARCHAR(50),
    context_type VARCHAR(50),
    response_text TEXT,
    sources JSONB,
    confidence DECIMAL(3,2),
    processing_time_ms INTEGER,
    dlp_flagged BOOLEAN DEFAULT FALSE,
    dlp_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_queries_user ON ai_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_queries_type ON ai_queries(query_type);
CREATE INDEX IF NOT EXISTS idx_ai_queries_created ON ai_queries(created_at DESC);

-- Create compliance mappings table
CREATE TABLE IF NOT EXISTS compliance_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id UUID NOT NULL,
    framework VARCHAR(50) NOT NULL,
    control_id VARCHAR(50) NOT NULL,
    control_name TEXT,
    mapping_status VARCHAR(20) DEFAULT 'pending',
    coverage_score DECIMAL(3,2),
    gap_analysis TEXT,
    recommendations JSONB,
    ai_generated BOOLEAN DEFAULT FALSE,
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mappings_policy ON compliance_mappings(policy_id);
CREATE INDEX IF NOT EXISTS idx_mappings_framework ON compliance_mappings(framework);

-- Create SOC-CMM assessments table
CREATE TABLE IF NOT EXISTS soc_cmm_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID,
    assessment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    domain VARCHAR(50) NOT NULL,
    current_level INTEGER CHECK (current_level >= 0 AND current_level <= 5),
    target_level INTEGER CHECK (target_level >= 0 AND target_level <= 5),
    evidence_count INTEGER DEFAULT 0,
    findings JSONB,
    recommendations JSONB,
    roadmap JSONB,
    assessed_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_soc_cmm_org ON soc_cmm_assessments(organization_id);
CREATE INDEX IF NOT EXISTS idx_soc_cmm_domain ON soc_cmm_assessments(domain);

-- Create DLP violations log
CREATE TABLE IF NOT EXISTS dlp_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    session_id UUID,
    violation_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    content_hash TEXT,  -- Hash of flagged content (not content itself)
    detection_method VARCHAR(50),
    action_taken VARCHAR(50),
    false_positive BOOLEAN DEFAULT FALSE,
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dlp_user ON dlp_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_dlp_severity ON dlp_violations(severity);
CREATE INDEX IF NOT EXISTS idx_dlp_created ON dlp_violations(created_at DESC);

-- Function to maintain hash chain for audit logs
CREATE OR REPLACE FUNCTION update_audit_hash_chain()
RETURNS TRIGGER AS $$
DECLARE
    prev_hash TEXT;
BEGIN
    SELECT hash_chain INTO prev_hash
    FROM audit_logs
    ORDER BY created_at DESC
    LIMIT 1;

    IF prev_hash IS NULL THEN
        prev_hash := 'GENESIS';
    END IF;

    NEW.hash_chain := encode(
        digest(
            COALESCE(prev_hash, '') ||
            NEW.timestamp::TEXT ||
            NEW.action ||
            COALESCE(NEW.user_id::TEXT, '') ||
            COALESCE(NEW.details::TEXT, ''),
            'sha256'
        ),
        'hex'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for hash chain
DROP TRIGGER IF EXISTS audit_hash_chain_trigger ON audit_logs;
CREATE TRIGGER audit_hash_chain_trigger
    BEFORE INSERT ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_audit_hash_chain();

-- Function to verify audit log integrity
CREATE OR REPLACE FUNCTION verify_audit_integrity()
RETURNS TABLE (
    is_valid BOOLEAN,
    first_invalid_id UUID,
    checked_count INTEGER
) AS $$
DECLARE
    rec RECORD;
    prev_hash TEXT := 'GENESIS';
    expected_hash TEXT;
    count_checked INTEGER := 0;
BEGIN
    FOR rec IN SELECT * FROM audit_logs ORDER BY created_at ASC LOOP
        expected_hash := encode(
            digest(
                COALESCE(prev_hash, '') ||
                rec.timestamp::TEXT ||
                rec.action ||
                COALESCE(rec.user_id::TEXT, '') ||
                COALESCE(rec.details::TEXT, ''),
                'sha256'
            ),
            'hex'
        );

        count_checked := count_checked + 1;

        IF rec.hash_chain != expected_hash THEN
            RETURN QUERY SELECT FALSE, rec.id, count_checked;
            RETURN;
        END IF;

        prev_hash := rec.hash_chain;
    END LOOP;

    RETURN QUERY SELECT TRUE, NULL::UUID, count_checked;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aegisciso;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO aegisciso;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO aegisciso;

-- Insert initial audit log entry
INSERT INTO audit_logs (action, details)
VALUES ('SYSTEM_INITIALIZED', '{"version": "1.0.0", "sovereign": true}'::jsonb);

COMMENT ON TABLE audit_logs IS 'Tamper-evident audit log with hash chain for compliance';
COMMENT ON TABLE user_sessions IS 'Zero-trust session management with device binding';
COMMENT ON TABLE ai_queries IS 'AI query history for analysis and compliance';
COMMENT ON TABLE compliance_mappings IS 'Policy to framework control mappings';
COMMENT ON TABLE soc_cmm_assessments IS 'SOC-CMM maturity assessments';
COMMENT ON TABLE dlp_violations IS 'Data Loss Prevention violation records';
