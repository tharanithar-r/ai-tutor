-- Create user_activities table for progress tracking
CREATE TABLE IF NOT EXISTS user_activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add indexes for better query performance
    INDEX idx_user_activities_user_id (user_id),
    INDEX idx_user_activities_goal_id (goal_id),
    INDEX idx_user_activities_activity_type (activity_type),
    INDEX idx_user_activities_created_at (created_at)
);

-- Add some common activity types as comments for reference
-- Activity types can include:
-- 'goal_created', 'goal_updated', 'goal_completed'
-- 'milestone_created', 'milestone_completed', 'milestone_updated'
-- 'chat_message_sent', 'chat_session_started', 'chat_session_ended'
-- 'login', 'logout', 'profile_updated'
-- 'study_session_started', 'study_session_completed'
-- 'quiz_completed', 'assessment_taken'
